import * as THREE from 'three';
import { L, getLang } from '../i18n.js';

// Quad & wheel loader don't stay put forever: leave one standing for a few minutes and somebody "borrows" it
// and parks it somewhere else (radio message where). Thompsen can bring them back, or send a volunteer over
// with the quad – the volunteer drives, you sit on the back and steer as usual.
// Nothing here is saved: on loading, vehicles stand at their usual spots anyway.

const C = (de, en) => ({ de, en });
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const GRACE = 180;     // seconds a vehicle may stand around untouched before people get ideas
const SNATCH_RATE = 1 / 25;   // after that: chance per second → usually gone within ~half a minute
const HIDDEN_DIST = 45;       // only when you're not looking (far enough away)

const PLACES = [
  ['plot_mainstage', C('an der Mainstage', 'at the mainstage')], ['plot_narnia_floor', C('am Narnia Floor', 'at the Narnia Floor')],
  ['plot_firespace', C('am Firespace', 'at the Firespace')], ['chill', C('an der Bierbank', 'at the beer bench')],
  ['plot_entrance', C('am Eingang', 'at the entrance')], ['kitchen', C('bei der Küche', 'by the kitchen')],
  ['plot_biergarten', C('am Biergarten', 'at the beer garden')], ['plot_chai_lounge', C('am Chai-Zelt', 'at the chai tent')],
  ['plot_hammocks', C('am Hängemattenwald', 'by the hammock forest')], ['base_yard', C('im Crew Camp', 'in the crew camp')],
];
const RADIO = [
  C('Hab mir kurz {v} geliehen, steht jetzt {p}. Danke dir!', 'Borrowed {v} for a sec, it\'s {p} now. Thanks!'),
  C('{V} stand so einsam rum… jetzt steht es {p}. Gern geschehen!', '{V} looked so lonely… now it\'s {p}. You\'re welcome!'),
  C('Sorry, musste dringend Bier holen. {V} parkt {p}. Schlüssel steckt!', 'Sorry, had to fetch beer urgently. {V} is parked {p}. Key\'s in!'),
  C('Wem gehört {v}? Egal, ist jetzt {p}.', 'Whose is {v}? Doesn\'t matter, it\'s {p} now.'),
];
const COME = [C('Ich bring dir das Quad! Bin gleich da!', 'I\'m bringing you the quad! Be right there!'), C('Quad-Taxi ist unterwegs! Brumm brumm!', 'Quad taxi on its way! Vroom vroom!')];
const ARRIVE = [C('Taxi ist da! Spring hinten drauf, du sagst, wo\'s hingeht.', 'Taxi\'s here! Hop on the back, you say where to.'), C('Hinten ist noch frei! Wohin?', 'Back seat\'s free! Where to?')];
const RIDE = [C('Juhuuu!', 'Wheee!'), C('Links! Nein, rechts! Egal, du lenkst!', 'Left! No, right! Whatever, you steer!'), C('Ich hab keinen Führerschein. Aber du lenkst ja.', 'I don\'t have a licence. But you\'re steering.'), C('Festhalten!', 'Hold on!')];
const BYE = [C('Ich lass dir das Quad da. Bis später!', 'I\'ll leave you the quad. See you!'), C('Schöne Fahrt war\'s! Tschüss!', 'Nice ride! Bye!')];
const GIVE_UP = C('Na gut, dann nicht. Ich lass das Quad hier stehen.', 'Fine, never mind. I\'ll leave the quad here.');

/** Fake keyboard for the volunteer driving the quad on their own. */
class Autopilot {
  constructor() { this.keys = new Set(); this.axis = { x: 0, y: 0 }; this.touch = false; }
  down(...k) { return k.some((x) => this.keys.has(x)); }
  hit() { return false; }
}

export class VehicleTheft {
  constructor(game) {
    this.game = game;
    this.idle = {};
    this.taxi = null; // { npc, phase: 'come'|'wait'|'ride', t }
  }

  reset() {
    if (this.taxi) this.endTaxi(false);
    this.idle = {};
  }

  /** Is it okay to "borrow" this one right now? */
  canTake(v) {
    const g = this.game, qs = g.quests;
    if (g.player.vehicle === v || v.driver || v.chauffeur || v.autopilot) return false;
    if (v.broken || v.repairing || (v.fuel != null && v.fuel <= 0)) return false;
    if (v.cargo.children.length) return false; // something's loaded: nobody drives off with your stuff
    if (qs.timer || Object.values(qs.state.active).some((a) => a.riding)) return false;
    if (Object.keys(qs.state.active).some((id) => qs.quests[id]?.noRunOver)) return false;
    return true;
  }

  update(dt) {
    const g = this.game;
    if (g.mode !== 'play') return;
    this.updateTaxi(dt);
    if (g.ui.dialogOpen || g.finale || !g.registered) return;
    for (const id of ['quad', 'radlader']) {
      const v = g.vehicles[id];
      if (!v) continue;
      if (!this.canTake(v)) { this.idle[id] = 0; continue; }
      this.idle[id] = (this.idle[id] || 0) + dt;
      if (this.idle[id] < GRACE || v.position.distanceTo(g.player.position) < HIDDEN_DIST) continue;
      if (Math.random() < SNATCH_RATE * dt) this.snatch(v);
    }
  }

  /** Somebody drove off with it: put it somewhere else, out of sight, and tell the player over the radio. */
  snatch(v) {
    const g = this.game, pp = g.player.position;
    const opts = PLACES.filter(([s]) => {
      const p = g.world.spots[s];
      return p && p.distanceTo(v.position) > 50 && Math.hypot(p.x - pp.x, p.z - pp.z) > HIDDEN_DIST;
    });
    if (!opts.length) return;
    const [spot, place] = pick(opts);
    const p = g.world.spots[spot];
    const a = Math.random() * Math.PI * 2;
    v.place({ x: p.x + Math.cos(a) * 6, z: p.z + Math.sin(a) * 6 }, Math.random() * Math.PI * 2);
    v.unstick(null, 0.05);
    v.speed = 0;
    this.idle[v.id] = 0;
    const who = this.borrower();
    const de = getLang() === 'de', name = L(v.name);
    const art = de ? (v.id === 'quad' ? 'das Quad' : 'den Radlader') : `the ${name.toLowerCase()}`;
    const Art = de ? (v.id === 'quad' ? 'Das Quad' : 'Der Radlader') : `The ${name.toLowerCase()}`;
    const txt = L(pick(RADIO)).replace('{v}', art).replace('{V}', Art).replace('{p}', L(place));
    g.ui.toast(`📻 ${who ? `${who.def.name}: ` : ''}„${txt}“`, 9000);
  }

  borrower(far = true) {
    const g = this.game;
    const c = g.npcs.all.filter((n) => !n.hidden && !n.task && !n.incident && !n.riding && !n.talking && !n.party && !n.away && n.def.behavior === 'wander'
      && (!far || n.toPlayer > 25));
    return c.length ? pick(c) : null;
  }

  // ------------------------------------------------------------ quad taxi
  canCallTaxi() {
    const q = this.game.vehicles.quad;
    return !this.taxi && !q.broken && !q.repairing && this.game.player.vehicle !== q && this.canTake(q);
  }

  /** Thompsen sends someone over with the quad. Returns the volunteer (or null). */
  callTaxi() {
    const g = this.game, q = g.vehicles.quad, pp = g.player.position;
    const n = this.borrower(false);
    if (!n) return null;
    if (n.char.sitting) n.standUp?.();
    n.task = null; n.visit = null; n.emote = null; n.emoteY = 0; n.target = null;
    // far away: the quad "arrives" from the edge of sight instead of crossing the whole site
    if (q.position.distanceTo(pp) > 70) {
      const d = new THREE.Vector3(q.position.x - pp.x, 0, q.position.z - pp.z).normalize();
      q.place({ x: pp.x + d.x * 50, z: pp.z + d.z * 50 }, Math.atan2(-d.x, -d.z));
      q.unstick(null, 0.05);
    }
    this.seat(n);
    q.autopilot = new Autopilot();
    this.taxi = { npc: n, phase: 'come', t: 0, best: Infinity, stall: 0 };
    n.say(L(pick(COME)), 4);
    return n;
  }

  seat(n) {
    const q = this.game.vehicles.quad;
    n.riding = q; n.rideSeat = q.seat;
    n.char.ride = q;
    q.chauffeur = n;
  }

  updateTaxi(dt) {
    const tx = this.taxi;
    if (!tx) return;
    const g = this.game, q = g.vehicles.quad, n = tx.npc, pp = g.player.position;
    tx.t += dt;
    if (q.broken) { this.endTaxi(true); return; }
    if (tx.phase === 'come') {
      const d = Math.hypot(q.position.x - pp.x, q.position.z - pp.z);
      this.steer(q.autopilot, q, pp, d > 12 ? 1 : 0.5);
      // not getting closer (stuck at a fence, a tent…): "takes a shortcut" while nobody looks
      if (d < tx.best - 0.5) { tx.best = d; tx.stall = 0; } else tx.stall += dt;
      if (tx.stall > 4) {
        const a = Math.atan2(q.position.x - pp.x, q.position.z - pp.z);
        q.place({ x: pp.x + Math.sin(a) * 9, z: pp.z + Math.cos(a) * 9 }, a + Math.PI);
        q.unstick(null, 0.05);
        tx.best = 9; tx.stall = 0;
      }
      if (d < 8 || tx.t > 60) {
        q.autopilot.keys.clear(); q.autopilot.keys.add('Space');
        tx.phase = 'wait'; tx.t = 0;
        n.say(L(pick(ARRIVE)), 5);
      }
    } else if (tx.phase === 'wait') {
      if (Math.abs(q.speed) < 0.2) q.autopilot.keys.clear();
      if (tx.t > 90 || q.position.distanceTo(pp) > 80) { n.say(L(GIVE_UP), 4); this.endTaxi(true); }
    } else if (tx.phase === 'ride') {
      if ((tx.lineT = (tx.lineT ?? 15) - dt) <= 0 && Math.abs(q.speed) > 3) { tx.lineT = 18 + Math.random() * 15; n.say(L(pick(RIDE)), 3); }
    }
  }

  /** Throttle & steer the autopilot towards `to`. */
  steer(ap, q, to, throttle) {
    ap.keys.clear();
    const want = Math.atan2(to.x - q.position.x, to.z - q.position.z);
    let diff = want - q.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ap.axis.x = 0; ap.axis.y = 0;
    if (Math.abs(diff) > 0.08) ap.keys.add(diff > 0 ? 'KeyA' : 'KeyD');
    if (Math.abs(diff) < 1.6) ap.axis.y = -throttle; else ap.axis.y = -0.35;
  }

  /** The player climbs on the back. */
  boarded() {
    const tx = this.taxi, q = this.game.vehicles.quad;
    if (!tx) return;
    q.autopilot = null;
    tx.phase = 'ride'; tx.t = 0;
    const p = this.game.player;
    p.root.position.set(0, 0.04, -0.5);  // pillion: behind the volunteer
    p.char.ride = null;
  }

  /** The player got off: the volunteer hops off too and walks away; the quad stays. */
  leftQuad() {
    if (!this.taxi || this.taxi.phase !== 'ride') return;
    this.taxi.npc.say(L(pick(BYE)), 4);
    this.endTaxi(true);
  }

  endTaxi(dismount) {
    const g = this.game, q = g.vehicles.quad, n = this.taxi?.npc;
    this.taxi = null;
    q.autopilot = null;
    q.chauffeur = null;
    q.speed = 0;
    this.idle.quad = 0;
    if (!n) return;
    n.riding = null; n.rideSeat = null;
    n.char.ride = null;
    n.char.setSitting(false);
    if (dismount) {
      const side = new THREE.Vector3(-1.4, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), q.heading);
      n.root.position.set(q.position.x + side.x, 0, q.position.z + side.z);
      g.world.colliders.resolve(n.root.position, 0.4);
      n.target = null;
      n.wait = 3;
    }
  }
}
