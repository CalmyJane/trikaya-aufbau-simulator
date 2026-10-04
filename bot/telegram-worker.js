// Cloudflare Worker: Telegram → Claude Code routine.
// Every text message you send to your bot starts a fresh Claude Code cloud session (routine API trigger)
// with the message as its task. Replying to a bot message (e.g. a ❓ question) sends the quoted message along,
// so the new session knows what the answer is about.
//
// Worker secrets (Settings → Variables and Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
// TG_WEBHOOK_SECRET (any random string, also passed to setWebhook), ROUTINE_URL, ROUTINE_TOKEN.

export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'POST') return new Response('ok');
    // only Telegram (knows the webhook secret) and only your own chat
    if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.TG_WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
    const msg = (await req.json()).message;
    if (!msg?.text || String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) return new Response('ignored');
    // answer Telegram right away (it retries slow webhooks), do the work in the background
    ctx.waitUntil(start(env, msg));
    return new Response('ok');
  },
};

async function start(env, msg) {
  const tg = (text) => fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: msg.chat.id, text, disable_web_page_preview: true }),
  });
  const quoted = msg.reply_to_message?.text;
  const text = quoted ? `Antwort auf: ${quoted}\n\n${msg.text}` : msg.text;
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
    await tg(`🚀 Läuft: ${j.claude_code_session_url}`);
  } else {
    await tg(`⚠️ Start fehlgeschlagen (${r.status}): ${(await r.text()).slice(0, 200)}`);
  }
}
