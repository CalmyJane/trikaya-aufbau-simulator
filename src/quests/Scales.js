import { L } from '../i18n.js';

// The dragon's shingles: the frame stands, the scales go on bit by bit from the ground up.
// Jimmy's crew cuts them from a pile of boards with jigsaws in the gazebo left of the dragon and nails them on – slowly. The player can
// saw along there at any time (permanent side job, a little karma), which speeds the dragon up.
// State: quests.state.flags.scales (0…1) and flags.scalesCut (how many the player has sawn).

const C = (de, en) => ({ de, en });
const START = 0.08;          // new game: only the first rows at the feet
const CUT = 0.015;           // one shingle batch sawn by the player
const CREW_RATE = 1 / 9000;  // per second and per person working on the dragon
const DAY_FLOOR = 0.2;       // the crew gets at least this far per build day, whatever happens

const THANKS = [
  C('Passt. Die nächste.', 'Good. Next one.'),
  C('…schöner Schnitt.', '…nice cut.'),
  C('Die kommt an den Arm.', 'That one goes on the arm.'),
  C('Mhm. Gleichmäßig. Gut.', 'Mhm. Even. Good.'),
  C('Danke. Der Drache merkt sich das.', 'Thanks. The dragon will remember.'),
];
const HELPER_LINES = [
  C('Jimmy hat gesagt, ich darf mal sägen!', 'Jimmy said I can have a go at sawing!'),
  C('Eine Schuppe für den Drachen. Von mir!', 'One scale for the dragon. From me!'),
  C('Ich säg nur kurz mit. Sieht entspannend aus.', 'Just sawing along for a bit. Looks relaxing.'),
  C('Wo liegt die Säge? Ah.', 'Where\'s the saw? Ah.'),
];

export class Scales {
  constructor(game) {
    this.game = game;
    this.helpers = 1;
    this.checkT = 0;
    this.sendT = 40;
  }

  get flags() { return this.game.quests.state.flags; }
  get api() { return this.game.world.structures.mainstage?.api; }
  get spot() { return this.game.world.spots.scale_saw; }

  /** 0…1; saves from before the shingle job start where the crew would roughly be by now. */
  get value() {
    const f = this.flags;
    if (f.scales == null) { const day = this.game.days?.day || 1; f.scales = day > 1 ? Math.min(0.9, START + (day - 1) * 0.22) : START; }
    return f.scales;
  }

  /** Standing at the sawbuck? */
  near(p) { const s = this.spot; return !!s && Math.hypot(p.x - s.x, p.z - s.z) < 1.7; }

  label() { return L(C('🪚 Schuppen sägen', '🪚 Saw scales')); }

  /** The player rounds board ends into shingles with the jigsaw (skill game), a bit of karma, the dragon grows faster. */
  cut() {
    const g = this.game;
    if (g.minigame.open || g.building) return;
    const log = g.world.spots.scale_log;
    if (log) g.player.root.rotation.y = Math.atan2(log.x - g.player.position.x, log.z - g.player.position.z);
    g.playMinigame({ minigame: 'jigsaw', minigameTitle: C('Schuppen sägen', 'Saw scales'), minigameFail: C('Verrutscht! Das Brett ist Ausschuss. Nochmal.', 'Slipped! That board is scrap. Again.') }, () => {
      const f = this.flags, was = this.value;
      f.scales = Math.min(1, was + CUT);
      f.scalesCut = (f.scalesCut || 0) + 1;
      const bonus = f.scalesCut % 10 === 0;
      const karma = bonus ? 3 : 1;
      g.quests.state.karma += karma;
      g.player.work(0.8);
      g.audio.tone?.(520, 0.08, { type: 'triangle', vol: 0.12 });
      const pct = Math.round(f.scales * 100);
      g.ui.toast(was >= 1
        ? L(C(`🪚 Ersatzschuppe gesägt. Der Drache ist fertig, aber Schuppen fallen immer mal ab. +${karma} Karma`, `🪚 Spare scale sawn. The dragon is done, but scales do fall off. +${karma} karma`))
        : f.scales >= 1
          ? L(C(`🐉 Die letzte Schuppe! Der Drache ist fertig. +${karma} Karma`, `🐉 The last scale! The dragon is finished. +${karma} karma`))
          : L(C(`🪚 Schuppen gesägt! Drache: ${pct} % · +${karma} Karma`, `🪚 Scales sawn! Dragon: ${pct} % · +${karma} karma`)));
      const jimmy = g.npcs.map.get('jimmy');
      if (jimmy && !jimmy.hidden && jimmy.toPlayer < 9) {
        jimmy.say(bonus ? C(`${f.scalesCut} Stück von dir. Respekt.`, `${f.scalesCut} of them from you. Respect.`) : THANKS[Math.floor(Math.random() * THANKS.length)], 3);
      }
      g.refreshHUD();
      g.save();
    });
  }

  update(dt) {
    const g = this.game, api = this.api;
    if (!api) return;
    // main menu & festival preview show the finished dragon
    if (g.previewState || g.mode === 'menu') { this.show(1); return; }
    let v = this.value;
    if (g.mode === 'play' && v < 1) {
      if ((this.checkT -= dt) <= 0) { this.checkT = 2; this.helpers = this.countHelpers(); }
      const day = g.days?.day || 1;
      let rate = CREW_RATE * this.helpers;
      if (g.finale) rate = 1 / 15;                                  // guests are coming: the last ones go on in a rush
      else if (v < (day - 1) * DAY_FLOOR) rate = Math.max(rate, 1 / 240); // behind schedule: catch up
      v = this.flags.scales = Math.min(1, v + rate * dt);
    }
    if (g.mode === 'play' && !g.finale) this.sendHelper(dt);
    this.show(v);
  }

  show(v) {
    if (v === this.shown) return;
    this.shown = v;
    this.api.setScales(v);
  }

  /** Everyone who is busy at the gazebo or at the dragon's arms right now. */
  countHelpers() {
    const s = this.game.world.spots;
    const at = [s.scale_pavilion, s.scale_dragon, s.scale_dragon2].filter(Boolean);
    let n = 0;
    for (const npc of this.game.npcs.all) {
      if (npc.hidden || npc.incident || !npc.char.work) continue; // only who really has a tool in the hands
      if (at.some((p) => Math.hypot(npc.position.x - p.x, npc.position.z - p.z) < 4.5)) n++;
    }
    return n;
  }

  /** Now and then another volunteer walks over and saws along for a while. */
  sendHelper(dt) {
    if ((this.sendT -= dt) > 0) return;
    this.sendT = 60 + Math.random() * 70;
    const g = this.game, spots = g.world.spots, pav = spots.scale_pavilion;
    const camps = g.npcs.campers || [];
    if (!pav || !g.registered || camps.some((n) => n.scaleHelp > 0 || n.task?.scale)) return;
    const cands = camps.filter((n) => n.def.behavior === 'wander' && !n.hidden && !n.task && !n.incident && !n.talking && !n.workshopSeat && !n.party && !n.char.sitting
      && n.position.distanceTo(pav) < 90 && n.position.distanceTo(pav) > 8);
    if (!cands.length) return;
    const n = cands[Math.floor(Math.random() * cands.length)];
    const at = (Math.random() < 0.5 ? spots.scale_w3 : spots.scale_w4) || pav;
    n.task = {
      scale: true, phase: 'go', pos: () => at, speed: 2, anim: 'walk', arriveDist: 0.9, workTime: 1,
      arriveLine: HELPER_LINES[Math.floor(Math.random() * HELPER_LINES.length)],
      then: () => { n.scaleHelp = 35 + Math.random() * 35; },
    };
  }

  reset() {
    this.shown = -1;
    this.sendT = 40;
    for (const n of this.game.npcs.campers || []) { n.scaleHelp = 0; if (n.task?.scale) n.task = null; }
  }
}
