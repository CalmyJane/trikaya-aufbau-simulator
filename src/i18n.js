// Tiny i18n: German is the default, English optional (settings).
// Content objects are written as { de: '…', en: '…' }; plain strings are used as-is.

const KEY = 'trikaya-lang';
let lang = 'de';
try { lang = localStorage.getItem(KEY) || 'de'; } catch { /* storage blocked */ }
const listeners = [];

export function getLang() { return lang; }

export function setLang(l) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  applyDom();
  listeners.forEach((f) => f(l));
}

export function onLangChange(fn) { listeners.push(fn); }

/** Localise a content value: string | { de, en } | array of those (random pick is caller's job). */
export function L(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] ?? v.de ?? v.en ?? '';
}

/** UI string by key with {var} interpolation. */
export function t(key, vars) {
  const e = STRINGS[key];
  let s = e ? L(e) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

/** Update every element carrying data-i18n="key" (textContent) or data-i18n-html. */
export function applyDom() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
}

const STRINGS = {
  // menu
  'menu.soundOn': { de: '🔊 Ton an', en: '🔊 Sound on' },
  'menu.soundOff': { de: '🔇 Ton aus', en: '🔇 Sound off' },
  'fly.hint': { de: '🛸 Rumfliegen: WASD · E/Q hoch/runter · Maus ziehen = umschauen · Mausrad · Shift = schnell', en: '🛸 Fly around: WASD · E/Q up/down · drag the mouse = look · wheel · Shift = fast' },
  'fly.hintTouch': { de: '🛸 Rumfliegen: wischen = verschieben · zwei Finger = Höhe & drehen', en: '🛸 Fly around: swipe = pan · two fingers = height & turn' },
  'menu.start': { de: 'Aufbau starten', en: 'Start the build' },
  'confirm.reset.title': { de: 'Neu starten?', en: 'Start over?' },
  'confirm.reset.text': { de: 'Dein gespeicherter Aufbau geht dabei verloren. Wirklich neu starten?', en: 'Your saved Aufbau will be lost. Really start over?' },
  'confirm.reset.yes': { de: 'Ja, neu starten', en: 'Yes, start over' },
  'confirm.reset.no': { de: 'Abbrechen', en: 'Cancel' },
  'menu.continue': { de: 'Aufbau fortsetzen', en: 'Continue the build' },
  'menu.reset': { de: 'Neuer Aufbau (Reset)', en: 'New build (reset)' },
  'menu.load': { de: 'Laden', en: 'Load' },
  'load.title': { de: 'Spielstand laden', en: 'Load a save' },
  'load.last': { de: 'Letzter Spielstand', en: 'Last save' },
  'load.auto': { de: 'Autosave', en: 'Autosave' },
  'load.hint': { de: 'Jede Minute wird automatisch gespeichert, die letzten 10 Minuten kannst du hier zurückspringen.', en: 'The game saves itself every minute; you can jump back up to 10 minutes here.' },
  'load.none': { de: 'Noch keine Spielstände.', en: 'No saves yet.' },
  'menu.controls': { de: 'Steuerung', en: 'Controls' },
  'menu.settings': { de: 'Einstellungen', en: 'Settings' },
  'menu.credits': { de: 'Credits', en: 'Credits' },
  'load.rotate': { de: '📱↻ Tipp: im Querformat spielt es sich besser', en: '📱↻ Tip: it plays better in landscape' },
  'menu.preview': { de: 'Fertiges Festival ansehen', en: 'See the finished festival' },
  'menu.previewOff': { de: 'Zurück zur Baustelle', en: 'Back to the build site' },
  'menu.shop': { de: 'Karma-Shop', en: 'Karma shop' },
  'hud.dayN': { de: 'Aufbau-Tag {day} · noch {left} Tage', en: 'Build day {day} · {left} days left' },
  'hud.dayLast': { de: 'Aufbau-Tag {day} · morgen ist Festival!', en: 'Build day {day} · festival tomorrow!' },
  'menu.fullscreen': { de: 'Vollbild', en: 'Fullscreen' },
  'close': { de: 'Schließen', en: 'Close' },
  // pause
  'pause.title': { de: 'Kaffeepause', en: 'Coffee break' },
  'pause.resume': { de: 'Weiterarbeiten', en: 'Back to work' },
  'pause.log': { de: 'Aufgaben', en: 'Quest log' },
  'pause.vol': { de: 'Volunteers', en: 'Volunteers' },
  'vol.title': { de: 'Volunteers', en: 'Volunteers' },
  'vol.sub': { de: 'Tippen: Person wird im Spiel markiert (lila Stab), bis du sie getroffen hast.', en: 'Tap one: they get marked in the game (purple beam) until you\'ve met them.' },
  'vol.marked': { de: 'Markiert', en: 'Marked' },
  'vol.met': { de: 'Getroffen: {name}', en: 'Met: {name}' },
  'pause.map': { de: 'Lageplan', en: 'Site map' },
  'pause.quit': { de: 'Speichern & Hauptmenü', en: 'Save & main menu' },
  // hud
  'hud.karma': { de: 'Karma', en: 'Karma' },
  'hud.ready': { de: 'Festival bereit', en: 'Festival ready' },
  'hud.day': { de: 'Aufbau-Tag 1 · noch 4 Tage', en: 'Build day 1 · 4 days left' },
  'hud.hint': { de: 'Klick = Maus fangen · WASD laufen · Shift sprinten · E interagieren · J Aufgaben · M Karte · Esc Pause', en: 'Click to capture mouse · WASD move · Shift sprint · E interact · J quests · M map · Esc pause' },
  'hud.hintRide': { de: 'W/S Gas/Bremse · A/D lenken · Leertaste lupfen · E absteigen', en: 'W/S throttle/brake · A/D steer · Space hop · E get off' },
  'hud.hintDrive': { de: 'W/S Gas/Bremse · A/D lenken · Leertaste Handbremse · E aussteigen', en: 'W/S throttle/brake · A/D steer · Space handbrake · E exit' },
  'hud.newJob': { de: 'Neuer Job', en: 'New job' },
  'hud.jobAvail': { de: 'Neuer Job verfügbar', en: 'New job available' },
  'hud.talkTo': { de: 'Sprich mit <b>{name}</b> ({role}), achte auf das <b style="color:#ffd21f">!</b>', en: 'Talk to <b>{name}</b> ({role}), look for the <b style="color:#ffd21f">!</b>' },
  'hud.allDone': { de: 'Alle Jobs erledigt!', en: 'All current jobs done!' },
  'hud.allDoneSub': { de: 'Neue Bauaufträge kommen bald. Schau dich um oder such Leo. (Viel Glück.)', en: 'More construction orders coming soon. Explore or try to find Leo. (Good luck.)' },
  'hud.searchArea': { de: 'Suchgebiet', en: 'search area' },
  'hud.speed': { de: 'km/h', en: 'km/h' },
  'hud.fuel': { de: 'Diesel', en: 'Diesel' },
  // prompts
  'p.talk': { de: 'Mit {name} reden', en: 'Talk to {name}' },
  'p.pickup': { de: '{item} aufheben', en: 'Pick up {item}' },
  'p.heavy': { de: '{item}: zu schwer! Hol den Radlader.', en: '{item}: too heavy! Get the wheel loader.' },
  'p.load': { de: '{item} in die Schaufel laden', en: 'Load {item} into the bucket' },
  'p.missing': { de: 'Fehlt: {items}', en: 'Missing: {items}' },
  'p.build': { de: '{name} aufbauen', en: 'Build {name}' },
  'p.deliver': { de: 'Abliefern', en: 'Deliver' },
  'p.needLoader': { de: 'Bring den Radlader mit der Ladung her', en: 'Bring the wheel loader with the load here' },
  'p.work': { de: '{what}', en: '{what}' },
  'p.enterQuad': { de: 'Quad fahren', en: 'Ride the quad' },
  'p.enterLoader': { de: 'Radlader fahren', en: 'Drive the wheel loader' },
  'p.quadBroken': { de: 'Quad ist kaputt, hol Andi oder Flo!', en: 'Quad is broken, get Andi or Flo!' },
  'p.loaderEmpty': { de: 'Radlader: Tank leer, frag Fabi nach Diesel', en: 'Wheel loader: tank empty, ask Fabi about diesel' },
  'p.fillFuel': { de: 'Diesel einfüllen', en: 'Fill in diesel' },
  'p.refuel': { de: 'Am Dieseltank volltanken', en: 'Refuel at the diesel tank' },
  'p.exit': { de: 'Aussteigen', en: 'Exit' },
  // building labels
  'b.labels': { de: ['Auspacken…', 'Anleitung lesen…', 'Anleitung ignorieren…', 'Heringe einschlagen…', 'Spanngurte ziehen…', 'Gaffa drauf…'], en: ['Unpacking…', 'Reading the manual…', 'Ignoring the manual…', 'Hammering pegs…', 'Tightening straps…', 'Adding gaffa…'] },
  'b.built': { de: 'Aufgebaut!', en: 'Built!' },
  'b.shape': { de: 'Das Festival nimmt Form an', en: 'The festival is taking shape' },
  // toasts / banners
  't.newJob': { de: 'Neuer Job: <b>{title}</b>', en: 'New job: <b>{title}</b>' },
  't.picked': { de: '{icon} <b>{item}</b> eingesammelt', en: '{icon} Picked up <b>{item}</b>' },
  't.loaded': { de: '🚜 <b>{item}</b> in der Schaufel', en: '🚜 <b>{item}</b> in the bucket' },
  't.jobDone': { de: 'Job erledigt', en: 'Job complete' },
  't.welcomeTop': { de: 'Aufbau-Tag 1', en: 'Build day 1' },
  't.welcome': { de: 'Willkommen in der Crew!', en: 'Welcome to the crew!' },
  't.welcomeSub': { de: 'Melde dich bei Jan an der Anmeldung im Crew Camp, achte auf das gelbe !', en: 'Register with Jan at the crew camp desk, look for the yellow !' },
  't.mute': { de: '🔇 Ton aus', en: '🔇 Sound off' },
  't.unmute': { de: '🔊 Ton an', en: '🔊 Sound on' },
  't.quadDead': { de: '💥 Das Quad stottert… und ist aus. Hol Andi oder Flo!', en: '💥 The quad sputters… and dies. Get Andi or Flo!' },
  't.quadFixed': { de: '🔧 Quad läuft wieder!', en: '🔧 Quad is running again!' },
  't.fueled': { de: '⛽ Radlader betankt!', en: '⛽ Wheel loader refuelled!' },
  't.kitchen': { de: 'Sabse hat dich aus der Küche geworfen!', en: 'Sabse threw you out of the kitchen!' },
  't.leoSeen': { de: 'War das… Leo?!', en: 'Was that… Leo?!' },
  // quest log
  'q.title': { de: 'Aufgaben', en: 'Quest log' },
  'q.locked': { de: 'Erst frühere Jobs erledigen.', en: 'Finish earlier jobs to unlock.' },
  'q.done': { de: 'Erledigt', en: 'Completed' },
  'q.current': { de: 'Aktuell', en: 'Current' },
  'q.talkTo': { de: 'Sprich mit {name}', en: 'Talk to {name}' },
  'q.reward': { de: 'Belohnung', en: 'Reward' },
  'q.more': { de: 'Weitere Jobs kommen an den nächsten Aufbautagen…', en: 'More jobs come on the next build days…' },
  // map
  'map.legend': { de: 'Lageplan · ▲ du · ● Ziel · ! Job · [M] schließen', en: 'Site map · ▲ you · ● objective · ! quest · [M] close' },
  // dialog
  'd.continue': { de: '[E] / [Leertaste] / Klick = weiter', en: '[E] / [Space] / click to continue' },
  'd.choose': { de: 'Wähle mit den Zahlentasten oder Klick', en: 'Choose with the number keys or click' },
  'd.continueTouch': { de: 'Tippen = weiter', en: 'Tap to continue' },
  'd.chooseTouch': { de: 'Tippe auf eine Antwort', en: 'Tap an answer' },
  'd.later': { de: 'Alles klar. Du weißt ja, wo du mich findest.', en: 'Alright. You know where to find me.' },
  'd.howGoing': { de: 'Wie läuft\'s mit „{title}“? {step}.', en: 'How\'s "{title}" going? {step}.' },
  'you': { de: 'Du', en: 'You' },
  'youRole': { de: 'Neu in der Crew', en: 'New crew member' },
  // mobile
  'm.rotate': { de: 'Dreh dein Handy quer, dann passt der ganze Aufbau aufs Display.', en: 'Turn your phone sideways, the whole build site fits much better.' },
  'm.anyway': { de: 'Trotzdem spielen', en: 'Play anyway' },
  'hud.hintTouch': { de: 'Links: laufen · Rechts wischen: umschauen · E: Aktion', en: 'Left: move · Swipe right side: look · E: action' },
  // settings
  's.title': { de: 'Einstellungen', en: 'Settings' },
  's.lang': { de: 'Sprache', en: 'Language' },
  's.sens': { de: 'Mausempfindlichkeit', en: 'Mouse sensitivity' },
  's.invert': { de: 'Maus-Y invertieren', en: 'Invert mouse Y' },
  's.follow': { de: 'Kamera folgt automatisch', en: 'Camera auto-follow' },
  's.volume': { de: 'Lautstärke', en: 'Volume' },
};
