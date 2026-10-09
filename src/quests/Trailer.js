import * as THREE from 'three';
import { getLang, L } from '../i18n.js';
import { mat, box, cyl } from '../world/Props.js';
import { heightAt, tiltAt } from '../world/Height.js';

// Trailer ride (step type 'trailer'): the quad gets a little trailer, a few people climb in and you drive
// them somewhere. Yellow cable bridges lie across the way – rattle over them too fast, crash into something
// or slam the handbrake and someone may fly out. Lose `maxFalls` people and the ride fails (try again).
//   { type: 'trailer', npcs: [...], meet: spotName, at: spotName, radius, maxFalls: 2, text, toLabel,
//     boardLine, dialog, fallLines: { id: line } }

const HITCH = 0.98;     // quad: hitch behind the rear rack
const DRAWBAR = 1.85;   // trailer: axle → hitch

/** The trailer itself: bed with low walls, two wheels, drawbar. Follows the quad's hitch. */
class TrailerCart {
  constructor(scene) {
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    const b = this.body;
    const wood = mat('#8a6238', { roughness: 0.95 });
    const steel = mat('#4a4f55', { metalness: 0.5, roughness: 0.5 });
    b.add(box(1.5, 0.08, 2.0, wood, 0, 0.5, 0.05));                 // bed
    for (const s of [-1, 1]) b.add(box(0.06, 0.34, 2.0, wood, s * 0.72, 0.71, 0.05)); // side walls
    b.add(box(1.5, 0.34, 0.06, wood, 0, 0.71, 1.02));               // front wall
    b.add(box(1.5, 0.34, 0.06, wood, 0, 0.71, -0.92));              // tailgate
    b.add(box(1.38, 0.06, 0.32, wood, 0, 0.86, 0.78));               // bench at the front
    b.add(box(1.38, 0.06, 0.32, wood, 0, 0.86, -0.66));              // bench at the back
    for (const s of [-1, 1]) b.add(box(0.16, 0.06, 0.6, mat('#e8a33a'), s * 0.76, 0.6, -0.95)); // reflectors
    const bar = box(0.08, 0.08, DRAWBAR - 0.9, steel, 0, 0.42, 1.0 + (DRAWBAR - 1.0) / 2);
    b.add(bar);
    b.add(cyl(0.06, 0.06, 0.08, steel, 8, 0, 0.44, DRAWBAR));      // coupling
    this.wheels = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group();
      const tyre = cyl(0.3, 0.3, 0.18, mat('#1d1d1d'), 12);
      tyre.rotation.z = Math.PI / 2;
      w.add(tyre);
      const hub = cyl(0.14, 0.14, 0.2, mat('#b0b0b0', { metalness: 0.6 }), 8);
      hub.rotation.z = Math.PI / 2;
      w.add(hub);
      w.position.set(s * 0.88, 0.3, 0);
      b.add(w);
      this.wheels.push(w);
    }
    // seats for the passengers (root positions; they sit on the benches facing forward)
    this.seats = [[-0.35, 0.42, 0.78], [0.35, 0.42, 0.78], [0, 0.42, -0.66], [-0.4, 0.42, -0.66], [0.4, 0.42, -0.66]].map(([x, y, z]) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      b.add(o);
      return o;
    });
    this.bounce = 0;
    this.bounceV = 0;
    this.root.visible = false;
    scene.add(this.root);
  }

  get position() { return this.root.position; }
  get heading() { return this.root.rotation.y; }

  /** Put it straight behind the quad. */
  hitchTo(quad) {
    const h = quad.heading;
    const hx = quad.position.x - Math.sin(h) * HITCH, hz = quad.position.z - Math.cos(h) * HITCH;
    this.root.position.set(hx - Math.sin(h) * DRAWBAR, 0, hz - Math.cos(h) * DRAWBAR);
    this.root.rotation.y = h;
    this.settle(0);
  }

  /** Classic trailer kinematics: the axle is dragged towards the hitch point. */
  follow(quad, dt) {
    const h = quad.heading;
    const hx = quad.position.x - Math.sin(h) * HITCH, hz = quad.position.z - Math.cos(h) * HITCH;
    const p = this.root.position;
    let dx = hx - p.x, dz = hz - p.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    const before = p.clone();
    p.x = hx - dx * DRAWBAR;
    p.z = hz - dz * DRAWBAR;
    this.root.rotation.y = Math.atan2(dx, dz);
    const moved = Math.hypot(p.x - before.x, p.z - before.z) * Math.sign(quad.speed || 1);
    for (const w of this.wheels) w.rotation.x += moved / 0.3;
    // a jolt makes the bed hop
    this.bounceV -= 30 * this.bounce * dt + 6 * this.bounceV * dt;
    this.bounce += this.bounceV * dt;
    this.settle(dt);
  }

  jolt(strength) { this.bounceV += Math.min(3.5, 0.8 + strength * 0.3); }

  settle(dt) {
    const p = this.root.position;
    const t = tiltAt(p.x, p.z, this.heading, 2.0, 1.6);
    p.y = t.y;
    const k = dt ? Math.min(1, dt * 8) : 1;
    this.body.rotation.x += (t.pitch - this.body.rotation.x) * k;
    this.body.rotation.z += (-t.roll - this.body.rotation.z) * k;
    this.body.position.y = Math.max(-0.05, this.bounce);
  }
}

/** Yellow cable bridge lying across the way (no collider – you drive over it). */
function cableBridge() {
  const g = new THREE.Group();
  const y = mat('#f2c21a', { roughness: 0.7 }), k = mat('#1a1a1a');
  g.add(box(3.6, 0.1, 0.6, y, 0, 0.05, 0));
  for (let i = 0; i < 6; i++) g.add(box(0.28, 0.012, 0.6, k, -1.5 + i * 0.6, 0.106, 0));
  for (const s of [-1, 1]) g.add(box(3.6, 0.06, 0.18, y, 0, 0.03, s * 0.36)); // ramps
  return g;
}

export class TrailerRide {
  constructor(game) {
    this.game = game;
    this.cart = new TrailerCart(game.world.scene);
    this.active = null;
  }

  get quad() { return this.game.vehicles.quad; }

  start(qid, step) {
    this.stop();
    const g = this.game, w = g.world;
    // 'quad': right next to where the quad parks in the crew camp
    const vs = w.vehicleSpots?.quad;
    const meet = step.meet === 'quad' && vs ? new THREE.Vector3(vs.pos.x, 0, vs.pos.z) : w.spots[step.meet], goal = w.spots[step.at];
    if (!meet || !goal) return;
    // obstacles: cable bridges spread along the way, across the direction of travel
    const group = new THREE.Group();
    const obstacles = [];
    const dir = new THREE.Vector3().subVectors(goal, meet).setY(0);
    const len = dir.length();
    dir.normalize();
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    const n = step.obstacles || 7;
    for (let i = 0; i < n; i++) {
      const t = 0.14 + (i / (n - 1)) * 0.72;
      // find a free spot near the line (not inside a tent, a container…)
      for (let k = 0; k < 8; k++) {
        const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 3 + Math.sin(i * 2.3) * 3;
        const pos = meet.clone().addScaledVector(dir, t * len).addScaledVector(side, off);
        const q = { x: pos.x, z: pos.z };
        if (w.colliders.resolve(q, 2.0)) continue;
        const ob = cableBridge();
        const ang = Math.atan2(dir.x, dir.z) + Math.sin(i * 1.7) * 0.35;
        ob.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
        ob.rotation.y = ang;
        group.add(ob);
        obstacles.push({ pos: new THREE.Vector3(pos.x, 0, pos.z), cos: Math.cos(ang), sin: Math.sin(ang), onQ: false, onT: false });
        break;
      }
    }
    w.scene.add(group);
    this.active = { qid, step, meet, goal, group, obstacles, boarded: false, falls: 0, fallen: [], hist: [], busy: false, hinted: false };
    this.cart.root.visible = true;
    this.cart.hitchTo(this.quad);
    this.gather();
  }

  stop() {
    const a = this.active;
    if (!a) return;
    this.game.world.scene.remove(a.group);
    for (const n of this.people()) this.release(n);
    this.cart.root.visible = false;
    this.active = null;
  }

  people() { return (this.active?.step.npcs || []).map((id) => this.game.npcs.get(id)).filter(Boolean); }

  /** Everybody walks over to the meeting point next to the quad and waits there. */
  gather() {
    const a = this.active;
    this.people().forEach((n, i) => {
      if (n.riding) this.unseat(n);
      const spot = a.meet.clone().add(new THREE.Vector3((i - 1) * 1.4, 0, 2.2));
      this.game.world.colliders.resolve(spot, 0.5);
      n.visit = null; n.emote = null; n.emoteY = 0; n.target = null;
      n.scenePose = null;
      n.task = { phase: 'go', pos: () => spot, arriveDist: 1.6, workTime: 0.2, speed: 4, anim: 'run', arriveLine: { de: 'Bin da!', en: 'Here!' }, then: () => { if (this.active && !n.riding) n.scenePose = this.quad.position; } };
    });
  }

  release(n) {
    if (n.riding === this.cart) this.unseat(n);
    n.scenePose = null;
    if (n.task?.arriveLine?.de === 'Bin da!') n.task = null;
  }

  unseat(n, offset = 1.4) {
    n.riding = null;
    n.rideSeat = null;
    n.char.setSitting(false);
    const h = this.cart.heading + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
    n.root.position.set(this.cart.position.x + Math.sin(h) * offset, 0, this.cart.position.z + Math.cos(h) * offset);
    this.game.world.colliders.resolve(n.root.position, 0.4);
    n.root.rotation.y = this.cart.heading;
    n.target = null;
  }

  // ------------------------------------------------------------ quest hooks
  interactables(qid, step, p, vehicle) {
    const a = this.active;
    if (!a || a.qid !== qid || a.boarded || a.busy) return [];
    const quad = this.quad;
    const waiting = this.people().filter((n) => n.position.distanceTo(quad.position) < 9).length;
    if (vehicle === quad && quad.position.distanceTo(a.meet) < 12) {
      if (waiting < this.people().length) return [{ d: 2, label: L({ de: `Warte, bis alle da sind (${waiting}/${this.people().length})`, en: `Wait until everyone's here (${waiting}/${this.people().length})` }), disabled: true }];
      return [{ d: 0.2, label: L({ de: '🛻 Alle in den Hänger!', en: '🛻 Everybody into the trailer!' }), action: () => this.board() }];
    }
    if (!vehicle && quad.position.distanceTo(p) < 4) return [{ d: 2.5, label: L({ de: 'Steig aufs Quad, der Hänger hängt schon dran', en: 'Get on the quad, the trailer is hooked up' }), disabled: true }];
    return [];
  }

  objectives(qid, step) {
    const a = this.active;
    if (!a || a.qid !== qid) return [];
    if (a.boarded) return [{ pos: a.goal, radius: step.radius || 10, label: L(step.toLabel) || '' }];
    if (this.game.player.vehicle !== this.quad) return [{ pos: this.quad.position, label: 'Quad' }];
    return [{ pos: a.meet, label: L({ de: 'Treffpunkt', en: 'Meeting point' }) }];
  }

  stepText(qid, step) {
    const a = this.active;
    const de = getLang() === 'de';
    if (!a || a.qid !== qid || !a.boarded) return L(step.text);
    const max = step.maxFalls || 2;
    return `${L(step.driveText || step.text)}${a.falls ? (de ? ` (${a.falls}/${max} rausgefallen!)` : ` (${a.falls}/${max} fell out!)`) : ''}`;
  }

  board() {
    const a = this.active;
    if (!a) return;
    const g = this.game;
    this.people().forEach((n, i) => {
      n.task = null; n.scenePose = null; n.visit = null;
      n.riding = this.cart;
      n.rideSeat = this.cart.seats[i];
    });
    a.boarded = true;
    a.falls = 0;
    a.fallen = [];
    a.hist = [];
    for (const o of a.obstacles) { o.onQ = false; o.onT = false; }
    const first = this.people()[0];
    if (a.step.boardLine && first) first.say(L(a.step.boardLine), 4);
    g.audio.accept?.();
    if (!a.hinted) {
      a.hinted = true;
      g.ui.toast(getLang() === 'de' ? '🛻 Fahr langsam über die gelben Kabelbrücken, keine Vollbremsung, nirgends dagegen! Fallen zwei raus, war\'s das.' : '🛻 Go slow over the yellow cable bridges, no emergency stops, don\'t hit anything! If two fall out, that\'s it.');
    }
    g.quests.refreshMarkers();
    g.refreshHUD();
  }

  // ------------------------------------------------------------ per frame
  update(dt) {
    const a = this.active;
    if (!a) return;
    const g = this.game, quad = this.quad;
    this.cart.follow(quad, dt);
    if (!a.boarded || a.busy) return;
    const sp = Math.abs(quad.speed);
    // crash / emergency stop: big speed loss within a quarter second
    a.hist.push({ t: g.time, sp });
    while (a.hist.length && g.time - a.hist[0].t > 0.25) a.hist.shift();
    const drop = (a.hist[0]?.sp || 0) - sp;
    if (drop > 4.5 && !a.crashCD) {
      a.crashCD = 1;
      a.hist = [];
      this.bump(Math.min(1, (drop - 3.5) / 6), drop);
    }
    if (a.crashCD) a.crashCD = Math.max(0, a.crashCD - dt);
    // cable bridges: the quad's wheels, then the trailer's
    for (const o of a.obstacles) {
      for (const [key, pos] of [['onQ', quad.position], ['onT', this.cart.position]]) {
        const dx = pos.x - o.pos.x, dz = pos.z - o.pos.z;
        const lx = dx * o.cos - dz * o.sin, lz = dx * o.sin + dz * o.cos;
        const on = Math.abs(lx) < 2.1 && Math.abs(lz) < 0.7;
        if (on && !o[key]) this.bump(Math.max(0, Math.min(0.85, (sp - 3.5) / 7)) * (key === 'onT' ? 1 : 0.7), sp);
        o[key] = on;
      }
    }
    // arrived
    if (quad.position.distanceTo(a.goal) < (a.step.radius || 10) && sp < 3 && g.player.vehicle === quad) this.arrive();
  }

  /** Something shook the trailer: everyone hops, maybe one flies out. */
  bump(chance, strength) {
    const a = this.active, g = this.game;
    this.cart.jolt(strength);
    g.cam.shake = Math.max(g.cam.shake || 0, Math.min(0.3, 0.05 + strength * 0.02));
    g.audio.tone?.(110, 0.08, { type: 'square', vol: 0.06 });
    const riders = this.people().filter((n) => n.riding === this.cart);
    if (!riders.length) return;
    if (Math.random() < chance) this.fallOut(riders[Math.floor(Math.random() * riders.length)]);
    else if (strength > 3 && Math.random() < 0.5) {
      const n = riders[Math.floor(Math.random() * riders.length)];
      if (!n.bubble) n.say(pickL(BUMP_LINES), 2);
    }
  }

  fallOut(n) {
    const a = this.active, g = this.game;
    const de = getLang() === 'de';
    n.riding = null;
    n.rideSeat = null;
    n.char.setSitting(false);
    const h = this.cart.heading, s = Math.random() < 0.5 ? 1 : -1;
    const dir = new THREE.Vector3(Math.cos(h) * s, 0, -Math.sin(h) * s).addScaledVector(new THREE.Vector3(Math.sin(h), 0, Math.cos(h)), -0.6).normalize();
    n.root.position.set(this.cart.position.x + dir.x * 0.6, 0, this.cart.position.z + dir.z * 0.6);
    const line = a.step.fallLines?.[n.def.id] || pickL(FALL_LINES);
    n.knock(dir, Math.max(3, Math.abs(this.quad.speed) * 0.6), { karma: 0, shout: { de: 'WAAAH!', en: 'WAAAH!' }, line });
    a.falls++;
    a.fallen.push(n.def.id);
    const max = a.step.maxFalls || 2;
    g.ui.toast(de ? `😱 ${n.def.name} ist rausgefallen! (${a.falls}/${max})` : `😱 ${n.def.name} fell out! (${a.falls}/${max})`);
    g.refreshHUD();
    if (a.falls >= max) this.fail();
  }

  async fail() {
    const a = this.active, g = this.game;
    a.busy = true;
    const q = g.quests.quests[a.qid];
    await new Promise((r) => setTimeout(r, 2200)); // let them land and get up
    if (this.active !== a) return;
    g.player.frozen = true;
    if (g.player.vehicle) g.exitVehicle();
    for (const n of this.people()) if (n.riding === this.cart) this.unseat(n);
    await g.runDialog(q.failDialog || [{ who: q.giver, text: { de: 'So wird das nix. Nochmal, und diesmal mit Gefühl!', en: 'That won\'t work. Again, and this time gently!' } }], null, null);
    g.player.frozen = false;
    if (this.active !== a) return;
    a.boarded = false;
    a.busy = false;
    a.falls = 0;
    a.fallen = [];
    // the quad (with the trailer) and everyone back to the start
    const quad = this.quad, vs = g.world.vehicleSpots.quad;
    quad.place(vs.pos, vs.heading);
    quad.speed = 0;
    this.cart.hitchTo(quad);
    this.gather();
    g.ui.toast(getLang() === 'de' ? '🛻 Neuer Versuch: Das Quad steht wieder im Crew Camp, alle kommen zum Treffpunkt.' : '🛻 New attempt: the quad is back at the crew camp, everyone heads to the meeting point.');
    g.quests.refreshMarkers();
    g.refreshHUD();
  }

  async arrive() {
    const a = this.active, g = this.game;
    a.busy = true;
    const riders = this.people().filter((n) => n.riding === this.cart);
    for (const n of riders) { this.unseat(n, 1.6); n.wait = 8; }
    let dialog = a.step.dialog || [];
    if (a.fallen.length) {
      const lost = g.npcs.get(a.fallen[0]);
      const who = riders[0]?.def.id || a.step.npcs[0];
      if (lost) dialog = [{ who, text: { de: `Wo ist eigentlich ${lost.def.name}? …Ach, der kommt zu Fuß nach. Hoffentlich.`, en: `Where's ${lost.def.name} actually? …Oh well, walking. Hopefully.` } }, ...dialog];
    }
    if (dialog.length) await g.runDialog(dialog, null, riders[0]);
    // whoever fell out shows up a bit later
    for (const id of a.fallen) {
      const n = g.npcs.get(id);
      if (n && !n.knocked && n.position.distanceTo(g.player.position) > 30) { n.root.position.set(a.goal.x + 2, 0, a.goal.z + 2); g.world.colliders.resolve(n.root.position, 0.4); }
    }
    const qid = a.qid;
    this.stop();
    g.quests.advance(qid);
  }
}

const pickL = (arr) => arr[Math.floor(Math.random() * arr.length)];
const BUMP_LINES = [
  { de: 'Uff!', en: 'Oof!' }, { de: 'Hey, langsam!', en: 'Hey, slowly!' }, { de: 'Mein Kaffee!', en: 'My coffee!' },
  { de: 'Wer hat dir den Führerschein gegeben?!', en: 'Who gave you a licence?!' }, { de: 'Huiii!', en: 'Wheee!' }, { de: 'Festhalten!', en: 'Hold on!' },
];
const FALL_LINES = [
  { de: 'Ey! Ich lauf den Rest!', en: 'Hey! I\'ll walk the rest!' },
  { de: 'Das war Absicht, oder?!', en: 'That was on purpose, wasn\'t it?!' },
  { de: 'Aua. Mein Stolz. Und mein Knie.', en: 'Ouch. My pride. And my knee.' },
];
