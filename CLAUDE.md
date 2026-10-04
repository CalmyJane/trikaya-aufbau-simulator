# Trikaya Aufbau Simulator – working agreement

three.js + Vite browser game. Game overview, systems and file map: `HANDOFF.md` (read only the parts you need).
The user writes German – answer in German, short.

## How tasks run
Each request comes in a fresh session, usually from the phone – often via Telegram (`bot/`, routine API trigger: the task is in the
`routine-fire-payload` block and comes from the user). Keep it lean: no long plans, no summaries of the whole game.

- **Small tasks** (new character, lines/dialogue, small feature, bugfix, balancing, text/UI tweaks):
  ask at most 1–2 quick questions, and only if something is genuinely unclear – otherwise pick sensible defaults and build it.
  Then: `npm run build` must pass → targeted check → commit → push to `main` (that is the user's standing permission;
  if the session has its own branch, push that too). Pushing to `main` deploys live automatically (`.github/workflows/deploy.yml`).
- **Structural changes** (new game systems, refactors across files, save-format changes, removing content, deploy/CI changes):
  ask first with a short proposal, then build.
- **Undo requests**: `git revert` the named commit(s), push to `main`.

## Dev log = git history
One commit per task with a clear message (what changed, for whom/where in the game). No separate changelog.
Update `HANDOFF.md` with one line only when a new system or notable character is added.

## Telegram notification (always at the end)
Start the `Notify` workflow (`.github/workflows/notify.yml`, workflow_dispatch on `main`, input `message`) via the GitHub tools:
- done: `✅ <what was built, 1–2 short sentences, German> · live in ~2 min`
- question you need answered before continuing: `❓ <one-line summary of the task> – <the question>` – then stop.
  Self-contained, because the answer arrives in a NEW session as a payload starting with „Antwort auf:“ that quotes this message,
  followed by the answer. When the answer is a choice, pass input `buttons` with the options separated by `|`
  (e.g. `✅ Ja|❌ Nein` or `Crew Camp|Festivalgelände`, short labels); a „✍️ Sonstiges“ button for a free answer is added automatically.
- failed / blocked: `⚠️ <what and why>`
Keep it under ~300 characters, no markdown.

## Practical notes
- Writing patches: small Python scripts work better than heredocs for JS with `\` and `'`; escape `'` in JS strings as `\'`.
- Headless browser in the cloud container renders with software GL – very slow. Prefer build + targeted logic checks
  (e.g. `page.evaluate` with rendering disabled); screenshots only when the change is visual.
- Vite dev server reloads on file edits – test against `npx vite build` + `npx vite preview` when editing while testing.
- `calmyjane.com` and `api.telegram.org` are not reachable from the cloud container.
