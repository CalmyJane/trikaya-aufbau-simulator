# Telegram → Claude Code

Du schreibst deinem Telegram-Bot einen Auftrag → eine neue Claude-Code-Cloud-Sitzung (Routine, läuft über dein Abo)
baut ihn nach `CLAUDE.md`, pusht live und meldet sich per `Notify`-Workflow wieder in Telegram.
Rückfragen kommen als ❓, oft mit Antwort-Buttons (+ „✍️ Sonstiges“ für eine eigene Antwort). Statt Buttons geht auch immer
**Antworten** (Reply) auf die Frage – die neue Sitzung bekommt die Frage jeweils mitgeliefert.

```
Telegram ──► Cloudflare Worker (bot/telegram-worker.js) ──► Routine /fire ──► Cloud-Sitzung
   ▲                                                                              │
   └──────────── GitHub Workflow "Notify" (.github/workflows/notify.yml) ◄────────┘
```

## Einrichtung (einmalig)

### 1. Routine anlegen
[claude.ai/code/routines](https://claude.ai/code/routines) → **New routine**
- Name: `Trikaya Auftrag`
- Repository: `CalmyJane/trikaya-aufbau-simulator`
- Prompt:
  > Im routine-fire-payload-Block steht ein Auftrag von mir per Telegram. Führe ihn aus, genau wie in CLAUDE.md beschrieben: kleine Aufgaben direkt bauen, prüfen, committen und nach main pushen; am Ende den Notify-Workflow mit einer kurzen Telegram-Nachricht starten. Beginnt der Payload mit „Antwort auf:", ist es meine Antwort auf eine frühere Rückfrage von dir – setze den dort genannten Auftrag mit dieser Antwort um.
- Trigger: **API** → speichern → nochmal **Edit** → beim API-Trigger die **URL** kopieren und **Generate token** (Token wird nur einmal angezeigt!)
- Connectors: alles entfernen, was nicht gebraucht wird (GitHub bleibt).

### 2. Cloudflare Worker
[dash.cloudflare.com](https://dash.cloudflare.com) (kostenloses Konto) → **Workers & Pages** → **Create** → **Hello World** Worker
→ **Edit code** → Inhalt von `bot/telegram-worker.js` einfügen → **Deploy**.
Dann **Settings → Variables and Secrets** → als *Secret* anlegen:

| Name | Wert |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token von @BotFather |
| `TELEGRAM_CHAT_ID` | deine Chat-ID |
| `TG_WEBHOOK_SECRET` | ein selbst ausgedachtes Passwort (nur Buchstaben/Zahlen) |
| `ROUTINE_URL` | URL aus Schritt 1 |
| `ROUTINE_TOKEN` | Token aus Schritt 1 |

Die Worker-Adresse steht oben, z. B. `https://trikaya-bot.<name>.workers.dev`.

### 3. Telegram mit dem Worker verbinden
Einmal im Browser öffnen (Platzhalter ersetzen):
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<WORKER_URL>&secret_token=<TG_WEBHOOK_SECRET>
```
Antwort `"ok":true` → fertig. Test: schreib deinem Bot „Teste den Bot: füge nichts hinzu, schick nur eine ✅-Nachricht“.

Hinweis: Solange der Webhook gesetzt ist, liefert `getUpdates` nichts mehr – das ist normal.
