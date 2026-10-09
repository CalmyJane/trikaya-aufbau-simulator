import { getLang, L } from '../i18n.js';

// Build days. Every job belongs to a day (quest.day) – and some to that day's night (quest.night: true).
// Day jobs of the current day done → evening falls → the night's jobs open up → night jobs done → sleep → next morning.
// Day 1 ends with the timed lights job (dusk). The festival day comes after the last night (Finale.js).

export const LAST_BUILD_DAY = 4;
const C = (de, en) => ({ de, en });

// little story beats: what you hear in the morning (Jan reads out Leo's voice message) and in the evening
const MORNING = {
  2: [
    { who: 'jan', text: C('Guten Morgen! Leo hat eine Sprachnachricht geschickt. Um 4:12 Uhr. Ich spiel sie ab.', 'Good morning! Leo sent a voice message. At 4:12 am. I\'ll play it.') },
    { who: 'leo', text: C('*rauscht* Leute! Super Tag gestern! Heute: Klos, Hängematten, Narnia, alles! Ich bin gleich da! *Hupen* …gleich!', '*crackle* Guys! Great day yesterday! Today: toilets, hammocks, Narnia, everything! I\'ll be right there! *honk* …right there!') },
    { who: 'jan', text: C('Er ist nicht gleich da. Das Teammeeting holen wir heute Abend nach. Ganz sicher.', 'He won\'t be right there. We\'ll make up the team meeting tonight. Definitely.') },
  ],
  3: [
    { who: 'jan', text: C('Morgen. Neue Sprachnachricht von Leo. Diesmal 3:47 Uhr.', 'Morning. New voice message from Leo. 3:47 am this time.') },
    { who: 'leo', text: C('*Wind* Hab heute Nacht nachgedacht. Wir brauchen einen Eingang. Und Shops. Und den Dome! Und einen Wassertank! Ich organisier das! …Organisiert ihr das?', '*wind* Did some thinking last night. We need an entrance. And shops. And the dome! And a water tank! I\'ll organise it! …Can you organise it?') },
    { who: 'corni', text: C('Die Stahlseile von Leo halten übrigens. Ich hab nachgeschaut. Dreimal. Heute Nacht.', 'Leo\'s steel wires are holding, by the way. I checked. Three times. Last night.') },
  ],
  4: [
    { who: 'jan', text: C('Letzter Aufbautag. Morgen kommen die Gäste. Leo hat… ein Foto geschickt. Von einem Sonnenaufgang.', 'Last build day. The guests arrive tomorrow. Leo sent… a photo. Of a sunrise.') },
    { who: 'schwarzhuber', text: C('Und bevor hier irgendwer feiert, will i no mit eich red\'n. Wegen der Wiese. Und dem Parkplatz.', 'And before anybody parties here, I want a word with you. About the meadow. And the parking.') },
    { who: 'silke', text: C('Habt ihr\'s gesehen?! Das Chai-Zelt STEHT! Über Nacht! Wir haben\'s gestern Abend einfach… gemacht!', 'Have you seen it?! The chai tent is UP! Overnight! We just… did it last night!') },
    { who: 'jan', text: C('…Es steht. Es ist leer. Aber es steht. Ich muss mich kurz setzen.', '…It stands. It\'s empty. But it stands. I need to sit down for a second.') },
    { who: 'krygo', text: C('Und die Sauna wird heute fertig! Heute wirklich.', 'And the sauna gets finished today! Really today.') },
    { who: 'jan', text: C('…Nein.', '…No.') },
  ],
};
// every evening there's a team meeting in the office container. It never happens.
const MEETING = {
  1: [
    { who: 'jan', text: C('So, Leute! Teammeeting! Alle in den Büro-Container! Wir besprechen den Plan für morgen.', 'Right, everyone! Team meeting! Everybody into the office container! We\'ll go over tomorrow\'s plan.') },
    { who: 'corni', text: C('Ohne Leo? Leo leitet das Meeting.', 'Without Leo? Leo runs the meeting.') },
    { who: 'jan', text: C('Leo hat gerade eine Sprachnachricht geschickt. *spielt ab*', 'Leo just sent a voice message. *plays it*') },
    { who: 'leo', text: C('*Fahrtwind* Leute, startet schon mal ohne mich! Ich bin in zehn Minuten da! Spätestens zwanzig! Oder morgen!', '*wind noise* Guys, start without me! I\'ll be there in ten minutes! Twenty at most! Or tomorrow!') },
    { who: 'jan', text: C('…Das Meeting ist verschoben.', '…The meeting is postponed.') },
  ],
  2: [
    { who: 'jan', text: C('Teammeeting! Heute wirklich! Büro-Container, JETZT!', 'Team meeting! For real today! Office container, NOW!') },
    { who: 'matze', text: C('Ich hab die Agenda geschrieben! Sie liegt… Moment… ich hatte sie gerade noch.', 'I wrote the agenda! It\'s… wait… I had it just now.') },
    { who: 'silke', text: C('Die Chai-Crew kann leider nicht. Wir haben gerade Pause. Von der Pause.', 'The chai crew can\'t make it, sorry. We\'re on a break. From the break.') },
    { who: 'corni', text: C('Da hinten wird\'s schwarz. Vergesst das Meeting, sichert lieber die Technik!', 'It\'s going black over there. Forget the meeting, secure the gear instead!') },
  ],
  3: [
    { who: 'jan', text: C('Teammeeting. Dritter Versuch. Ich hab Kekse besorgt. Es MUSS heute klappen.', 'Team meeting. Third attempt. I got biscuits. It HAS to work today.') },
    { who: 'jan', text: C('…Warum ist im Büro das Licht aus?', '…Why are the lights off in the office?') },
    { who: 'felix', text: C('Ich hab den Strom fürs Büro auf Fabbes Dome umgelegt. Der braucht ihn mehr. Kann man so machen.', 'I rerouted the office power to Fabbe\'s dome. He needs it more. You could do it like that.') },
    { who: 'estenko', text: C('*schnarcht auf Jans Stuhl* …Respekt… *schnarch*', '*snoring in Jan\'s chair* …respect… *snore*') },
    { who: 'jan', text: C('Er hat die Kekse gegessen. Meeting fällt aus.', 'He ate the biscuits. Meeting cancelled.') },
  ],
  4: [
    { who: 'jan', text: C('Letztes Teammeeting vor dem Festival. Und Leo… ist DA! Ich seh ihn! Da, mit Sonnenbrille!', 'Last team meeting before the festival. And Leo… is HERE! I can see him! There, with the sunglasses!') },
    { who: 'mikey', text: C('Ich bin Mikey.', 'I\'m Mikey.') },
    { who: 'jan', text: C('…Natürlich. Meeting fällt aus. Wie jedes Jahr. Harry, du hast die Bühne.', '…Of course. Meeting cancelled. Like every year. Harry, the stage is yours.') },
  ],
};

const EVENING = {
  1: [
    { who: 'felix', text: C('Kein Meeting? Dann ab ins Zelt.', 'No meeting? Off to the tent then.') },
    { who: 'corni', text: C('Ins Zelt? Nein. Der Bauzaun am Eingang wackelt. Ohne die Spezial-Nuss fällt der nachts um. Komm mal her.', 'The tent? No. The fence at the entrance wobbles. Without the special nut it\'ll fall over in the night. Come here.') },
  ],
  2: [
    { who: 'estenko', text: C('Ey mann… es wird dunkel UND nass. Respekt an das Wetter. Das zieht einfach durch!', 'Hey man… it\'s getting dark AND wet. Respect to the weather. It just goes for it!') },
  ],
  3: [
    { who: 'fabbe', text: C('Gut, dass das Meeting ausfällt. Ich bau heute Nacht am Dome weiter. Ich bräuchte nur… mein Werkzeug.', 'Good thing the meeting\'s off. I\'m working on the dome tonight. I\'d just need… my tools.') },
  ],
  4: [
    { who: 'harry', text: C('Danke, Jan. Jetzt ist es dunkel genug. Zeit fürs Mapping.', 'Thanks, Jan. Now it\'s dark enough. Time for the mapping.') },
  ],
};
const NIGHT_END = {
  1: [{ who: 'corni', text: C('Bauzaun steht. Ab ins Bett. Morgen wird\'s lang.', 'Fence stands. Off to bed. Tomorrow will be long.') }],
  2: [{ who: 'franzi', text: C('Alle trocken? Mehr oder weniger? Dann schlaft jetzt. Bitte.', 'Everyone dry? More or less? Then sleep now. Please.') }],
  3: [{ who: 'fabbe', text: C('Danke dir. Ich mach noch ein bisschen. Du schläfst. Das ist ein Befehl. Ein liebevoller.', 'Thank you. I\'ll do a bit more. You sleep. That\'s an order. A loving one.') }],
};

export class DaySystem {
  constructor(game) {
    this.game = game;
    this.busy = false;
  }

  get qs() { return this.game.quests; }
  get day() { return this.qs.state.day || 1; }
  get phase() { return this.qs.state.phase || 'day'; }
  get isNight() { return this.phase === 'night'; }

  reset() { this.busy = false; }

  /** May this job be offered right now? Jobs without a day (errands, old ones) always can. */
  allows(q) {
    if (!q.day) return true;
    if (q.day > this.day) return false;
    if (q.night && q.day === this.day && !this.isNight) return false;
    return true;
  }

  jobs(day, night) { return Object.values(this.qs.quests).filter((q) => q.day === day && !!q.night === night); }

  /** Called every frame while playing. */
  update() {
    const g = this.game;
    if (this.busy || g.finale || g.mode !== 'play' || this.qs.timer) return;
    const done = (q) => this.qs.isDone(q.id);
    if (!this.isNight) {
      if (this.jobs(this.day, false).every(done)) this.evening();
    } else if (this.day < LAST_BUILD_DAY && this.jobs(this.day, true).every(done)) this.sleep();
  }

  /** Morning/evening talk: whoever speaks (except Leo, he only sends voice messages) is actually there –
   *  anyone far away or hidden pops up in a half circle in front of the player behind a short fade. */
  async scene(lines) {
    const g = this.game, p = g.player.position;
    const ids = [...new Set(lines.map((l) => l.who))].filter((id) => id !== 'leo' && id !== 'you' && g.npcs.get(id));
    const far = ids.filter((id) => { const n = g.npcs.get(id); return !n.riding && !n.ridingBike && (n.hidden || n.gone || n.away || !n.root.visible || n.position.distanceTo(p) > 10); });
    if (far.length) { g.ui.fade(true); await this.wait(700); }
    const yaw = g.player.root.rotation.y;
    ids.forEach((id, i) => {
      const n = g.npcs.get(id);
      if (far.includes(id)) {
        n.task = null; n.incident = null; n.away = false; n.gone = false; n.hidden = false; n.root.visible = true;
        if (n.char.sitting) n.standUp();
        const a = yaw + (i - (ids.length - 1) / 2) * 0.55;
        n.root.position.set(p.x + Math.sin(a) * 2.6, 0, p.z + Math.cos(a) * 2.6);
        g.world.colliders.resolve(n.root.position, 0.4);
      }
      n.scenePose = p.clone();
    });
    if (far.length) { g.ui.fade(false); await this.wait(500); }
    await g.runDialog(lines);
    for (const id of ids) g.npcs.get(id).scenePose = null;
  }

  wait(ms) { return new Promise((r) => setTimeout(r, this.game.devFast ? 30 : ms)); }

  async evening() {
    const g = this.game, de = getLang() === 'de';
    this.busy = true;
    this.qs.state.phase = 'night';
    g.world.visibility = 170;
    if (g.world.night < 0.9) g.world.setNight(1, g.devFast ? 0.1 : 20);
    g.sunriseT = 0;
    await this.wait(2500);
    g.ui.banner(de ? `Nacht ${this.day}` : `Night ${this.day}`, de ? 'Feierabend? Nicht ganz.' : 'Time off? Not quite.', de ? 'Neue Jobs für die Nacht, halt Ausschau nach dem gelben !' : 'New jobs for the night, look for the yellow !', 4500);
    this.qs.refreshMarkers();
    g.refreshHUD();
    await this.wait(3500);
    if (MEETING[this.day] && !g.devFast) {
      g.ui.toast(de ? '📋 Teammeeting im Büro-Container! …theoretisch.' : '📋 Team meeting in the office container! …in theory.');
      await this.scene(MEETING[this.day].map(fix));
    }
    if (EVENING[this.day] && !g.devFast) await this.scene(EVENING[this.day].map(fix));
    this.busy = false;
  }

  async sleep() {
    const g = this.game, de = getLang() === 'de';
    this.busy = true;
    const d = this.day;
    await this.wait(3000);
    if (NIGHT_END[d] && !g.devFast) await this.scene(NIGHT_END[d].map(fix));
    g.ui.toast(de ? '😴 Ab ins Zelt…' : '😴 Off to the tent…');
    await this.wait(1500);
    g.ui.fade(true);
    await this.wait(1600);
    this.qs.state.day = d + 1;
    this.qs.state.phase = 'day';
    g.world.night = 0;
    g.world.setNight(0, 0.1);
    g.world.visibility = 220;
    g.world.setRain(false);
    g.player.stamina = 1;
    g.applyProgressLevel();
    g.save?.();
    g.ui.fade(false);
    await this.wait(900);
    g.ui.banner(de ? `Aufbau-Tag ${d + 1}` : `Build day ${d + 1}`, de ? 'Guten Morgen!' : 'Good morning!', d + 1 === LAST_BUILD_DAY ? (de ? 'Letzter Aufbautag, morgen ist Festival!' : 'Last build day, festival tomorrow!') : '', 4500);
    this.qs.refreshMarkers();
    g.refreshHUD();
    await this.wait(3000);
    if (MORNING[d + 1] && !g.devFast) await this.scene(MORNING[d + 1].map(fix));
    this.busy = false;
  }

  /** After loading a save: put the sky where the day/night says it is. */
  applyLoaded() {
    const g = this.game;
    if (this.isNight) { g.world.night = 1; g.world.setNight(1, 0.1); g.world.visibility = 170; } else { g.world.night = 0; g.world.setNight(0, 0.1); g.world.visibility = 220; }
  }

  /** Old saves have no day yet: the first day that still has open jobs. */
  migrate() {
    const st = this.qs.state;
    if (st.day) return;
    let d = 1;
    while (d < LAST_BUILD_DAY && [...this.jobs(d, false), ...this.jobs(d, true)].every((q) => this.qs.isDone(q.id))) d++;
    st.day = d;
    st.phase = this.jobs(d, false).every((q) => this.qs.isDone(q.id)) && this.jobs(d, true).length ? 'night' : 'day';
  }

  hudText() {
    const de = getLang() === 'de';
    const left = LAST_BUILD_DAY + 1 - this.day;
    if (this.isNight) return de ? `Nacht ${this.day} · ${left <= 1 ? 'morgen ist Festival!' : `noch ${left} Tage`}` : `Night ${this.day} · ${left <= 1 ? 'festival tomorrow!' : `${left} days left`}`;
    return de ? `Aufbau-Tag ${this.day} · ${left <= 1 ? 'morgen ist Festival!' : `noch ${left} Tage`}` : `Build day ${this.day} · ${left <= 1 ? 'festival tomorrow!' : `${left} days left`}`;
  }
}

// 'zdenko' is Zdenko's display alias – his NPC id is 'estenko'
function fix(l) { return { ...l, who: l.who === 'zdenko' ? 'estenko' : l.who, text: L(l.text) }; }
