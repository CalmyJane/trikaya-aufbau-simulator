// Cloudflare Worker: Telegram → Claude Code routine.
// - Every text message you send to your bot starts a fresh Claude Code cloud session (routine API trigger)
//   with the message as its task.
// - Replying to a bot message (e.g. a ❓ question) sends the quoted message along, so the new session knows the context.
// - Answer buttons under a question (sent by the Notify workflow): a tap starts a session with question + choice;
//   "✍️ Sonstiges" asks you to type your own answer as a reply.
//
// Worker secrets (Settings → Variables and Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
// TG_WEBHOOK_SECRET (any random string, also passed to setWebhook), ROUTINE_URL, ROUTINE_TOKEN.

export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'POST') return new Response('ok');
    // only Telegram (knows the webhook secret) and only your own chat
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
    const update = await req.json();
    const mine = (chat) => chat && String(chat.id) === String(env.TELEGRAM_CHAT_ID);
    // answer Telegram right away (it retries slow webhooks), do the work in the background
    if (update.callback_query && mine(update.callback_query.message?.chat)) ctx.waitUntil(onButton(env, update.callback_query));
    else if (update.message?.text && mine(update.message.chat)) ctx.waitUntil(onMessage(env, update.message));
    return new Response('ok');
  },
};

function tg(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function onMessage(env, msg) {
  const quoted = msg.reply_to_message?.text;
  await fire(env, msg.chat.id, quoted ? `Antwort auf: ${quoted}\n\n${msg.text}` : msg.text);
}

async function onButton(env, cb) {
  const msg = cb.message;
  const buttons = (msg.reply_markup?.inline_keyboard || []).flat();
  const choice = buttons.find((b) => b.callback_data === cb.data)?.text || cb.data;
  await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id });
  // show what was picked and remove the buttons (no double answers)
  await tg(env, 'editMessageText', { chat_id: msg.chat.id, message_id: msg.message_id, text: `${msg.text}\n\n👉 ${choice}`, disable_web_page_preview: true });
  if (cb.data === 'other') {
    // your own answer: reply to this message, the question travels along in the quote
    await tg(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: `✍️ Deine Antwort? (einfach hierauf antworten)\n\n${msg.text}`,
      reply_markup: { force_reply: true, input_field_placeholder: 'Deine Antwort…' },
    });
    return;
  }
  await fire(env, msg.chat.id, `Antwort auf: ${msg.text}\n\n${choice}`);
}

/** Start a new Claude Code session via the routine's API trigger. */
async function fire(env, chatId, text) {
  const r = await fetch(env.ROUTINE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.ROUTINE_TOKEN}`,
      'anthropic-beta': 'experimental-cc-routine-2026-04-01',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  if (r.ok) {
    const j = await r.json();
    await tg(env, 'sendMessage', { chat_id: chatId, text: `🚀 Läuft: ${j.claude_code_session_url}`, disable_web_page_preview: true });
  } else {
    await tg(env, 'sendMessage', { chat_id: chatId, text: `⚠️ Start fehlgeschlagen (${r.status}): ${(await r.text()).slice(0, 200)}` });
  }
}
