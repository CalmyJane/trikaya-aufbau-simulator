import * as THREE from 'three';
import { Character } from './Character.js';
import { NPCS, makeCamper, TOKEN_LINES, NUT_LINES } from './npcData.js';
import { EXTRA_LINES, PROGRESS_LINES, OWN_VOICE } from './moreLines.js';
import { heightAt } from '../world/Height.js';
import { L } from '../i18n.js';
import { STATE_LINES } from '../quests/Events.js';
import { AREAS } from '../world/layout.js';

function inPolyXZ(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

const TALK_RANGE = 3;

function markerTexture(ch, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.strokeStyle = '#3a2500';
  ctx.lineWidth = 10;
  ctx.font = 'bold 110px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(ch, 64, 70);
  ctx.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const MARKERS = {};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const SOAP = {}; // shared soap bubble geometry & materials
// care lines are written for Franzi – use whoever actually helps (e.g. Delsin)
const helperLine = (line, helper) => {
  const n = helper?.def.name;
  if (!n || n === 'Franzi' || !line) return line;
  return { de: line.de.replaceAll('Franzi', n).replace(' mit Zöpfen', ''), en: line.en.replaceAll('Franzi', n).replace(' with pigtails', '') };
};

export class NPC {
  constructor(def, world, manager) {
    this.def = def;
    this.world = world;
    this.manager = manager;
    this.char = new Character(def.look);
    this.root = this.char.root;
    world.scene.add(this.root);

    const home = this.resolveSpot(def.home) || this.resolveSpot(def.route?.[0]) || new THREE.Vector3();
    if (def.offset) { home.x += def.offset[0]; home.z += def.offset[1]; }
    this.home = home;
    this.root.position.copy(home);
    this.root.rotation.y = Math.random() * Math.PI * 2;
    world.colliders.resolve(this.root.position, 0.4);

    this.target = null;
    this.wait = Math.random() * 3;
    this.routeIdx = 0;
    this.speed = def.behavior === 'runner' ? 7.5 : (def.speed || 1.6);
    this.talking = false;
    this.bubble = null;       // { text, t }
    this.chatterCD = 4 + Math.random() * 10;
    this.greeted = false;
    this.stuck = 0;
    this.state = 'idle';
    this.stateT = 0;
    this.task = null;         // external task: { pos, then(), arriveDist }

    if (!MARKERS['!']) { MARKERS['!'] = markerTexture('!', '#ffd21f'); MARKERS['?'] = markerTexture('?', '#7fe0ff'); MARKERS.red = markerTexture('!', '#ff3b30'); MARKERS.blue = markerTexture('!', '#3aa0ff'); MARKERS.fav = markerTexture('!', '#6fdc6a'); }
    this.marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: MARKERS['!'], depthTest: false, fog: false }));
    this.marker.scale.set(0.9, 0.9, 0.9);
    this.marker.position.y = (def.look?.height || 1.8) + 0.75;
    this.marker.renderOrder = 10;
    this.marker.visible = false;
    this.root.add(this.marker);

    if (def.behavior === 'sitter') this.sitAt(this.home, this.resolveSpot(def.face || 'chill') || this.home);
    if (def.behavior === 'elusive') this.relocate(null);
  }

  resolveSpot(name) {
    if (name === 'camp_random') return this.manager?.randomCampSpot() || null;
    if (name === 'festival_random') return this.manager?.randomFestivalSpot() || null;
    const s = name && this.world.spots[name];
    return s ? s.clone() : null;
  }

  get position() { return this.root.position; }
  get name() { return this.def.name; }

  setMarker(kind) {
    if (!kind) { this.marker.visible = false; return; }
    this.marker.visible = true;
    this.marker.material.map = MARKERS[kind];
  }

  say(text, seconds = 4) {
    this.bubble = { text: L(text), t: seconds };
  }

  line() {
    // not registered yet: whatever they say, it's about your missing wristband
    const g = this.manager?.game;
    if (g && !g.registered && this.def.id !== 'jan' && this.def.id !== 'leo') return g.bandLine();
    const r = Math.random();
    if (this.def.tokenAsker && r < 0.2) return L(pick(TOKEN_LINES));
    if (this.def.id.startsWith('camper_') && r > 0.9 && !this.manager?.nutFound) return L(pick(NUT_LINES));
    // talk about what has just been built (once that job is done)
    if (g && r > 0.72) {
      const me = this.def.id;
      const prog = PROGRESS_LINES.filter(([q, who, , not]) => g.quests.isDone(q) && (who ? who === me : !OWN_VOICE.includes(me) && !not?.includes(me)));
      if (prog.length) { const own = prog.filter(([, who]) => who === this.def.id); return L(pick(own.length && Math.random() < 0.6 ? own : prog)[2]); }
    }
    // own lines, never the same one twice in a row (or among the last few)
    const pool = [...this.def.lines, ...(EXTRA_LINES[this.def.id] || [])];
    this._recent ||= [];
    const fresh = pool.filter((l) => !this._recent.includes(l));
    const line = pick(fresh.length ? fresh : pool);
    this._recent.push(line);
    if (this._recent.length > Math.min(4, pool.length - 1)) this._recent.shift();
    return L(line);
  }

  sitAt(seat, lookAt) {
    this.root.position.copy(seat);
    this.root.rotation.y = Math.atan2(lookAt.x - seat.x, lookAt.z - seat.z);
    this.char.setSitting(true);
    this.state = 'sit';
  }

  standUp() { this.char.setSitting(false); }

  // ----------------------------------------------------------------- movement helper
  /** Walk towards target; returns true when arrived. */
  walkTo(target, dt, speed = this.speed, anim = 'walk') {
    const p = this.root.position;
    const d = Math.hypot(target.x - p.x, target.z - p.z);
    if (d < 0.6) { this.nav = null; return true; }
    const goal = this.navGoal(target, d, dt);
    const dx = goal.x - p.x, dz = goal.z - p.z;
    const gd = Math.hypot(dx, dz) || 0.0001;
    const step = Math.min(gd, speed * dt);
    const bx = p.x, bz = p.z;
    p.x += (dx / gd) * step;
    p.z += (dz / gd) * step;
    this.world.colliders.resolve(p, 0.4);
    const moved = Math.hypot(p.x - bx, p.z - bz);
    if (moved < step * 0.3) {
      this.stuck += dt;
      // blocked: first ask for a proper path, only then report "stuck" to the behaviour
      if (this.stuck > 0.5 && this.nav && !this.nav.forced) { this.nav.forced = true; this.nav.check = 0; }
      if (this.stuck > 2) { this.stuck = 0; this.nav = null; return 'stuck'; }
    } else this.stuck = 0;
    this.char.turnTo(Math.atan2(dx, dz), dt, 8);
    if (this.ridingBike) {
      // on the bike: sitting pose, raised onto the saddle
      if (!this.char.sitting) { this.char.setSitting(true); this.char.sitBaseY = this.char.standY + 0.1; }
    } else this.char.play(anim, 0.2, { timeScale: anim === 'walk' ? speed / 1.6 * 0.9 : 1 });
    return false;
  }

  /** Next point to walk towards: the target itself if the way is free, else the next path corner. */
  navGoal(target, d, dt) {
    const grid = this.world.nav;
    if (!grid) return target;
    const p = this.root.position;
    let nv = this.nav;
    if (!nv || Math.hypot(nv.tx - target.x, nv.tz - target.z) > 1.5) {
      nv = this.nav = { tx: target.x, tz: target.z, path: null, i: 0, check: 0, forced: false };
    }
    nv.check -= dt;
    if (nv.check <= 0) {
      nv.check = nv.path ? 3 : 0.7;
      if (!nv.forced && (d < 2.5 || grid.lineClear(p, target))) nv.path = null;
      else if (grid.budget > 0) {
        const t0 = performance.now();
        nv.path = grid.findPath(p, target);
        grid.budget -= performance.now() - t0;
        nv.i = 0;
        nv.forced = false;
        if (!nv.path) nv.check = 2.5; // unreachable: walk straight, try again later
      } else nv.check = 0; // no budget this frame
    }
    if (!nv.path) return target;
    // advance along the path; skip corners we already see past
    while (nv.i < nv.path.length - 1) {
      const c = nv.path[nv.i];
      if (Math.hypot(c.x - p.x, c.z - p.z) < 0.9) { nv.i++; continue; }
      break;
    }
    const last = nv.path[nv.path.length - 1];
    return nv.i >= nv.path.length - 1 ? target : nv.path[nv.i] || last;
  }

  pickWanderTarget(radius = this.def.radius || 5, center = this.home) {
    const nav = this.world.nav;
    let v;
    for (let k = 0; k < 8; k++) { // prefer points that aren't inside a wall or tent
      const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
      v = new THREE.Vector3(center.x + Math.cos(a) * r, 0, center.z + Math.sin(a) * r);
      if (!nav || !nav.blockedAt(v.x, v.z)) break;
    }
    return v;
  }

  // ----------------------------------------------------------------- update
  update(t, dt, ctx) {
    const player = ctx.player;
    const p = this.root.position;
    const toPlayer = Math.hypot(player.position.x - p.x, player.position.z - p.z);
    this.toPlayer = toPlayer;

    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }

    // chatter when the player is around
    this.chatterCD -= dt;
    if (toPlayer < 11 && this.chatterCD <= 0 && !this.talking && !this.incident && this.def.behavior !== 'elusive') {
      const g = ctx.game;
      // only a few people talk at the same time around you
      if ((this.manager?.nearBubbles || 0) >= (g?.input?.touch ? 1 : 2) || g?.ui?.dialogOpen) { this.chatterCD = 4 + Math.random() * 6; } else {
        // not registered yet: everybody wants to see your wristband
        this.say(g && !g.registered && this.def.id !== 'jan' ? g.bandLine() : this.line());
        if (this.manager) this.manager.nearBubbles = (this.manager.nearBubbles || 0) + 1;
        this.chatterCD = this.def.behavior === 'sitter' ? 14 + Math.random() * 12 : 18 + Math.random() * 20;
      }
    }

    if (this.hidden) return;
    if (this.def.soapBubbles) this.updateSoapBubbles(dt, t);

    // run over by a vehicle: fly, lie there, get up and complain
    if (this.knocked) { this.runKnocked(dt); return; }

    // cut scene: stand still and look at the middle of the scene
    if (this.scenePose && !this.talking) { this.char.faceTowards(this.scenePose, dt, 4); this.char.play('idle'); this.finish(dt); return; }

    if (this.talking) {
      if (!this.char.sitting && !this.lying) this.char.faceTowards(player.position, dt);
      this.finish(dt);
      return;
    }

    if ((this.incident || this.task) && this.char.flowToy) { this.char.setFlow(null); this.atSlot = false; }
    if (this.incident && !this.task) { this.runIncident(t, dt); this.finish(dt); return; }

    // external task (e.g. mechanic called to the quad)
    if (this.task) { this.runTask(dt); this.finish(dt); return; }

    // illegal soundbox party on the camping
    if (this.party) { this.runParty(t, dt); this.finish(dt); return; }

    const fn = BEHAVIORS[this.def.behavior] || BEHAVIORS.wander;
    fn(this, t, dt, ctx);
    if (this.def.stoned) this.root.rotation.y += Math.sin(t * 1.7 + this.root.position.x) * dt * 0.6;
    this.finish(dt);
  }

  /** Soap bubbles: drift up and with the wind, shimmer, pop. Only while the player is around. */
  updateSoapBubbles(dt, t) {
    const list = (this.soap ||= []);
    if (!SOAP.geo) {
      SOAP.geo = new THREE.SphereGeometry(1, 12, 8);
      SOAP.mats = ['#ff9ad5', '#9ae8ff', '#c8a6ff', '#fff2a0', '#a6ffcf'].map((c) => new THREE.MeshStandardMaterial({
        color: c, emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3, depthWrite: false,
      }));
    }
    const scene = this.world.scene;
    if (this.toPlayer < 55 && list.length < 26) {
      this.soapT = (this.soapT ?? 0) - dt;
      if (this.soapT <= 0) {
        this.soapT = 0.18 + Math.random() * 0.4;
        const from = new THREE.Vector3();
        if (this.char.bubbleTip) this.char.bubbleTip.getWorldPosition(from);
        else from.copy(this.root.position).add(new THREE.Vector3(0, 1.6, 0));
        const n = 1 + (Math.random() < 0.35 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(SOAP.geo, SOAP.mats[Math.floor(Math.random() * SOAP.mats.length)]);
          const r = 0.05 + Math.random() * 0.09;
          m.scale.setScalar(r);
          m.position.copy(from);
          m.renderOrder = 5;
          scene.add(m);
          const h = this.root.rotation.y + (Math.random() - 0.5) * 1.2;
          list.push({ m, r, age: 0, life: 2.5 + Math.random() * 3.5, phase: Math.random() * 6,
            v: new THREE.Vector3(Math.sin(h) * (0.4 + Math.random() * 0.5) + 0.25, 0.25 + Math.random() * 0.35, Math.cos(h) * (0.4 + Math.random() * 0.5)) });
        }
      }
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.age += dt;
      b.v.y += Math.sin(t * 2 + b.phase) * dt * 0.15;
      b.m.position.addScaledVector(b.v, dt);
      b.m.position.x += Math.sin(t * 1.7 + b.phase) * dt * 0.25;
      const k = b.age / b.life;
      // pop: a quick swell at the very end
      b.m.scale.setScalar(b.r * (k > 0.93 ? 1 + (k - 0.93) * 6 : 1));
      if (b.age >= b.life || this.hidden) { scene.remove(b.m); list.splice(i, 1); }
    }
  }

  finish(dt) {
    const p = this.root.position;
    p.y = heightAt(p.x, p.z) + (this.party ? this.bob || 0 : 0);
    this.char.update(dt);
  }

  /** Drama victims: hurt, lying, drunk, high, keta, fight – plus following Franzi and being cared for. */
  runIncident(t, dt) {
    const inc = this.incident;
    const lines = STATE_LINES[inc.state || inc.mode];
    if (inc.mode === 'hurt') {
      if (!this.char.sitting) this.char.setSitting(true, true);
      this.char.play('neutral');
      if (Math.random() < dt * 0.15) this.say({ de: 'Auaaa…', en: 'Ouuch…' }, 2);
    } else if (inc.mode === 'lying') {
      if (!this.lying) { this.lying = true; this.char.play('death', 0.3, { once: true }); }
      if (Math.random() < dt * 0.12) this.say('zzz…', 2);
    } else if (inc.mode === 'drunk' || inc.mode === 'wasted') {
      if (!this.target || this.walkTo(this.target, dt, 0.8)) this.target = this.pickWanderTarget(4, this.position);
      this.root.rotation.y += Math.sin(t * 2.3) * dt * 2;
      if (Math.random() < dt * 0.1) this.say({ de: 'Hicks! …wo war ich?', en: 'Hic! …where was I?' }, 2.5);
    } else if (inc.mode === 'high') {
      if (!this.target || this.walkTo(this.target, dt, 0.6)) this.target = this.pickWanderTarget(3, this.position);
      if (Math.random() < dt * 0.1) this.say({ de: 'Hihihi… die Wolken… hihihi…', en: 'Hehehe… the clouds… hehehe…' }, 2.5);
    } else if (inc.mode === 'keta') {
      this.char.play('idle');
      this.root.rotation.y += dt * 0.25; // slowly drifting away
      if (Math.random() < dt * 0.08) this.say('……', 2);
    } else if (inc.mode === 'follow') {
      // stagger along behind Franzi, saying nonsense
      const lead = inc.leader;
      const behind = lead.position.clone().add(new THREE.Vector3(-Math.sin(lead.root.rotation.y), 0, -Math.cos(lead.root.rotation.y)).multiplyScalar(1.6));
      if (this.position.distanceTo(behind) > 0.8) this.walkTo(behind, dt, 2.4, 'walk');
      else { this.char.faceTowards(lead.position, dt); this.char.play('idle'); }
      if (inc.state === 'drunk' || inc.state === 'keta') this.root.rotation.y += Math.sin(t * 3) * dt * 0.8;
      inc.lineT -= dt;
      if (inc.lineT <= 0 && lines) { inc.lineT = 4 + Math.random() * 2; this.say(helperLine(pick(lines.follow), inc.leader), 3.6); }
    } else if (inc.mode === 'care') {
      inc.t += dt;
      if (!this.char.sitting) this.char.setSitting(true, true);
      this.char.play('neutral');
      inc.lineT -= dt;
      if (inc.lineT <= 0 && lines) { inc.lineT = 7 + Math.random() * 5; this.say(helperLine(pick(lines.care), inc.franzi), 3.5); }
      if (inc.t >= inc.until) {
        this.incident = null;
        this.char.setSitting(false);
        this.target = null;
        const who = inc.franzi?.def.name || 'Franzi';
        this.say({ de: `Danke, ${who}. Mir geht's besser. Zurück an die Arbeit!`, en: `Thanks, ${who}. I feel better. Back to work!` }, 3.5);
      }
    } else if (inc.mode === 'fight') {
      if (inc.other) this.char.faceTowards(inc.other.position, dt, 10);
      inc.cd = (inc.cd || Math.random()) - dt;
      if (inc.cd <= 0) {
        inc.cd = 0.8 + Math.random() * 0.8;
        this.char.play(inc.argue ? (Math.random() < 0.5 ? 'wave' : 'interact') : Math.random() < 0.5 ? 'punchL' : 'punchR', 0.1, { once: true });
        if (Math.random() < 0.3) this.say(pick(inc.shouts || [{ de: 'MEIN Löffel!', en: 'MY spoon!' }]), 2);
      }
    }
  }

  runParty(t, dt) {
    const pt = this.party;
    if (this.char.sitting) this.standUp();
    if (this.position.distanceTo(pt.pos) > 0.8) { this.walkTo(pt.pos, dt, 2.2); return; }
    // "dancing": bouncing, turning, the odd arm wave
    this.char.faceTowards(pt.box, dt, 2);
    this.root.rotation.y += Math.sin(t * 2.2 + pt.pos.x) * dt * 1.5;
    this.char.play(Math.sin(t * 0.7 + pt.pos.z) > 0.6 ? 'wave' : 'idle', 0.3, { timeScale: 1.8 });
    this.bob = Math.abs(Math.sin(t * 7.2)) * 0.08;
    pt.lineT -= dt;
    if (pt.lineT <= 0 && this.manager?.partyLine) { pt.lineT = 5 + Math.random() * 6; this.say(this.manager.partyLine(), 2.5); }
  }

  /** Pivot group around the hips so the whole body can somersault (identity unless knocked). */
  tumbleRig() {
    const c = this.char;
    if (!c.tumble) {
      const h = 0.9 * ((c.look.height || 1.8) / 1.8);
      const pivot = new THREE.Group();
      const inner = new THREE.Group();
      pivot.position.y = h;
      inner.position.y = -h;
      pivot.userData.h = h;
      c.root.remove(c.model);
      inner.add(c.model);
      pivot.add(inner);
      c.root.add(pivot);
      c.tumble = pivot;
    }
    return c.tumble;
  }

  /** Hit by the quad / wheel loader: flies backwards head over heels, bounces, slides, lies there. */
  knock(dir, speed, reaction) {
    if (this.knocked || this.hidden) return false;
    if (this.char.sitting) this.char.setSitting(false);
    this.char.setFlow?.(null);
    const tb = this.tumbleRig();
    const h = tb.userData.h;
    // turn towards the vehicle, so they fly backwards and flip over backwards
    this.root.rotation.y = Math.atan2(-dir.x, -dir.z);
    const vy = 3.2 + speed * 0.5, y0 = 0.15;
    const lieY = -h + 0.14; // lying on the back: hips just above the ground
    const air = (vy + Math.sqrt(vy * vy + 40 * (y0 - lieY))) / 20; // time until the back hits the ground (g = 20)
    const flips = speed > 7 ? 1 : 0;
    this.knocked = {
      vx: dir.x * speed * 0.9, vz: dir.z * speed * 0.9, vy, y: y0, t: 0, phase: 'fly', air, lieY,
      rx: -(Math.PI / 2 + flips * Math.PI * 2), rz: (Math.random() - 0.5) * 1.4, spin: (Math.random() - 0.5) * 3, bounced: false, reaction,
    };
    this.say(reaction.shout, 1.5);
    this.char.play('hit', 0.05, { once: true, timeScale: 1.4 });
    const p = this.root.position;
    this.world.spawnDust?.(p, 0.25, { n: 14, size: 0.22, y: p.y + 0.4, life: 0.9 });
    return true;
  }

  runKnocked(dt) {
    const k = this.knocked;
    const p = this.root.position;
    const tb = this.char.tumble;
    k.t += dt;
    const puff = (n) => this.world.spawnDust?.(p, 0.35, { n, size: 0.2, y: heightAt(p.x, p.z) + 0.15, life: 1 });
    if (k.phase === 'fly' || k.phase === 'bounce') {
      p.x += k.vx * dt; p.z += k.vz * dt;
      k.vy -= 20 * dt;
      k.y += k.vy * dt;
      if (k.phase === 'fly') {
        const f = Math.min(1, k.t / k.air);
        tb.rotation.x = k.rx * f;
        tb.rotation.z = k.rz * Math.sin(f * Math.PI);
        this.root.rotation.y += k.spin * dt;
      }
      this.world.colliders.resolve(p, 0.4);
      if (k.y <= k.lieY && k.vy < 0) {
        k.y = k.lieY;
        tb.rotation.set(-Math.PI / 2, 0, 0);
        if (!k.bounced && k.vy < -5) {
          // first impact: bounce once
          k.bounced = true;
          k.vy = -k.vy * 0.25;
          k.vx *= 0.55; k.vz *= 0.55;
          k.phase = 'bounce';
          puff(16);
        } else {
          k.phase = 'down'; k.t = 0;
          puff(10);
          this.char.play('neutral', 0.3);
        }
      }
    } else if (k.phase === 'down') {
      // slide to a halt, then lie there for a moment
      const fr = Math.exp(-6 * dt);
      k.vx *= fr; k.vz *= fr;
      p.x += k.vx * dt; p.z += k.vz * dt;
      this.world.colliders.resolve(p, 0.4);
      // dazed twitch
      tb.rotation.z = Math.sin(k.t * 9) * 0.04 * Math.max(0, 1 - k.t);
      if (k.t > (k.reaction.oblivious ? 2.8 : 1.8)) { k.phase = 'up'; k.t = 0; this.char.play('idle', 0.6); }
    } else if (k.phase === 'up') {
      // sit up and get back on the feet
      const f = Math.min(1, k.t / 0.9);
      const e = f * f * (3 - 2 * f);
      tb.rotation.set(-Math.PI / 2 * (1 - e), 0, 0);
      k.y = k.lieY * (1 - e);
      if (f >= 1) {
        tb.rotation.set(0, 0, 0);
        this.knocked = null;
        this.target = null;
        p.y = heightAt(p.x, p.z);
        this.say(k.reaction.line, 4.5);
        if (k.reaction.angry) { this.angryT = 3; this.char.play('punchR', 0.1, { once: true }); }
        this.manager?.onGotUp?.(this, k.reaction);
        this.char.update(dt);
        return;
      }
    }
    this.char.update(dt);
    p.y = heightAt(p.x, p.z) + k.y;
  }

  runTask(dt) {
    const tk = this.task;
    if (this.char.sitting && !this.ridingBike) this.standUp();
    if (tk.phase === 'go') {
      const goal = tk.detour && tk.detourT > 0 ? tk.detour : tk.pos();
      if (tk.detourT > 0) tk.detourT -= dt;
      const r = this.walkTo(goal, dt, tk.speed || 4.5, tk.anim || 'run');
      if (r === 'stuck') {
        tk.stucks = (tk.stucks || 0) + 1;
        const tp = tk.pos();
        const far = this.toPlayer > 35 && tp.distanceTo(this.manager?.playerPos || tp) > 35;
        if (far || tk.stucks > 4) {
          // nobody's watching: take the "shortcut"
          this.root.position.set(tp.x + 2, 0, tp.z + 1.5);
          this.world.colliders.resolve(this.root.position, 0.4);
        } else {
          // sidestep around the obstacle for a moment
          const dx = tp.x - this.position.x, dz = tp.z - this.position.z;
          const side = tk.stucks % 2 ? 1 : -1;
          tk.detour = new THREE.Vector3(this.position.x - dz * 0.4 * side, 0, this.position.z + dx * 0.4 * side);
          tk.detourT = 1.5;
        }
      }
      const d = this.root.position.distanceTo(tk.pos());
      if (r === true || d < (tk.arriveDist || 2.2)) { tk.phase = 'work'; tk.t = tk.workTime || 4; this.say(tk.arriveLine || '…', 3); }
    } else if (tk.phase === 'work') {
      this.char.faceTowards(tk.pos(), dt);
      this.char.play('interact');
      tk.t -= dt;
      if (tk.t <= 0) { const done = tk.then; this.task = null; done?.(); }
    }
  }

  greetCheck(dt, player) {
    if (this.toPlayer < 5 && !this.greeted) {
      this.greeted = true;
      this.waveT = 1.8;
      this.char.play('wave', 0.2, { once: true });
    }
    if (this.toPlayer > 14) this.greeted = false;
    if (this.waveT > 0) {
      this.waveT -= dt;
      this.char.faceTowards(player.position, dt);
      return true;
    }
    return false;
  }

  inTalkRange(player) {
    return this.root.position.distanceTo(player.position) < TALK_RANGE;
  }

  // ----------------------------------------------------------------- Leo
  relocate(playerPos) {
    const names = Object.keys(this.world.spots).filter((n) => !n.startsWith('chill'));
    for (let i = 0; i < 20; i++) {
      const s = this.world.spots[pick(names)];
      if (!playerPos || s.distanceTo(playerPos) > 80) {
        this.root.position.set(s.x + (Math.random() - 0.5) * 4, 0, s.z + (Math.random() - 0.5) * 4);
        this.world.colliders.resolve(this.root.position, 0.4);
        this.home = this.root.position.clone();
        break;
      }
    }
    this.state = 'lurk';
    this.stateT = 25 + Math.random() * 30;
    this.root.visible = true;
  }
}

// =================================================================== behaviours
const BEHAVIORS = {
  stationary(n, t, dt, { player }) {
    if (n.greetCheck(dt, player)) return;
    if (n.toPlayer < 8) n.char.faceTowards(player.position, dt, 4);
    n.char.play('idle');
  },

  wander(n, t, dt, { player }) {
    if (n.greetCheck(dt, player)) return;
    if (n.toPlayer < 3.5) { n.char.faceTowards(player.position, dt); n.char.play('idle'); return; }
    if (n.wait > 0) { n.wait -= dt; n.char.play(n.workAnim ? 'interact' : 'idle'); return; }
    if (!n.target) n.target = n.pickWanderTarget();
    const r = n.walkTo(n.target, dt);
    if (r) {
      n.target = null; n.workAnim = Math.random() < 0.5; n.wait = 2 + Math.random() * 5;
      // roamers move on to another part of the camp / festival now and then
      if (n.def.roam && Math.random() < 0.3) { const h = n.resolveSpot(n.def.roam); if (h) n.home = h; }
    }
  },

  patrol(n, t, dt, ctx) { BEHAVIORS.route(n, dt, ctx, false); },
  runner(n, t, dt, ctx) { BEHAVIORS.route(n, dt, ctx, true); },
  worker(n, t, dt, ctx) { BEHAVIORS.route(n, dt, ctx, false, true); },

  route(n, dt, { player }, running, working) {
    if (!running && n.greetCheck(dt, player)) return;
    if (!running && n.toPlayer < 3.5) { n.char.faceTowards(player.position, dt); n.char.play('idle'); return; }
    if (n.wait > 0) { n.wait -= dt; n.char.play(working ? 'interact' : 'idle'); return; }
    if (!n.target) {
      n.routeIdx = (n.routeIdx + 1) % n.def.route.length;
      n.target = n.resolveSpot(n.def.route[n.routeIdx]);
      if (n.target) { n.target.x += (Math.random() - 0.5) * 6; n.target.z += (Math.random() - 0.5) * 6; }
    }
    if (!n.target) return;
    const r = n.walkTo(n.target, dt, running ? 7.5 : (working ? 2.4 : n.speed), running ? 'run' : 'walk');
    if (r) { n.target = null; n.wait = running ? 0.4 : (working ? 5 + Math.random() * 5 : 2 + Math.random() * 3); }
  },

  // Leo: never where you are. Flees when you get close, then teleports somewhere else.
  elusive(n, t, dt, { player, game }) {
    // caught him! (speed, cornering him, pure luck)
    if (n.toPlayer < 1.7 && game?.registered && !game.ui.dialogOpen) { game.catchLeo(n); return; }
    if (n.state === 'lurk') {
      n.stateT -= dt;
      if (n.wait > 0) { n.wait -= dt; n.char.play('idle'); } else {
        if (!n.target) n.target = n.pickWanderTarget(6);
        if (n.walkTo(n.target, dt, 2)) { n.target = null; n.wait = 2 + Math.random() * 4; }
      }
      if (n.toPlayer < 24) {
        n.state = 'flee';
        n.stateT = 7;
        n.say(n.line(), 3);
        const away = new THREE.Vector3().subVectors(n.position, player.position).setY(0).normalize();
        n.fleeTarget = n.position.clone().addScaledVector(away, 60);
        game?.onLeoSeen(n);
      } else if (n.stateT <= 0) n.relocate(player.position);
    } else if (n.state === 'flee') {
      n.stateT -= dt;
      const r = n.walkTo(n.fleeTarget, dt, 9.5, 'run');
      if (r === 'stuck') n.fleeTarget = n.pickWanderTarget(30, n.position);
      if (n.stateT <= 0 || n.toPlayer > 50) {
        // gone for a while before he pops up somewhere else
        n.state = 'away';
        n.stateT = 15 + Math.random() * 20;
        n.root.visible = false;
      }
    } else if (n.state === 'away') {
      n.stateT -= dt;
      if (n.stateT <= 0) n.relocate(player.position);
    }
  },

  // Thompsen: sits on the beer bench and laughs.
  sitter(n, t, dt) {
    // got up (party, drama, run over…)? walk back to the seat first
    if (!n.char.sitting) {
      if (n.position.distanceTo(n.home) > 0.7) { n.walkTo(n.home, dt, 1.5); return; }
      n.sitAt(n.home, n.resolveSpot(n.def.face || 'chill') || n.home);
    }
    n.char.play('neutral');
    if (Math.random() < dt * 0.05 && !n.bubble) n.say(n.line(), 2.5);
  },

  // Zdenko: drunk, clueless, kung fu, sits with Thompsen, pesters AFK players.
  estenko(n, t, dt, { player, game }) {
    n.stateT -= dt;
    const seat = n.world.spots.chill_seat1;
    const table = n.world.spots.chill;
    // AFK pestering has priority
    if (game && game.afkTime > 18 && !n.incident && !['pester', 'pesterTalk', 'pesterWait', 'pesterLeave'].includes(n.state)) {
      n.standUp();
      if (n.toPlayer > 45) {
        // sneak up out of sight: appear ~30 m behind the camera, then come running
        const cam = game.cam;
        const bx = Math.sin(cam.yaw) * 30, bz = Math.cos(cam.yaw) * 30;
        n.root.position.set(player.position.x + bx, 0, player.position.z + bz);
        n.world.colliders.resolve(n.root.position, 0.4);
      }
      n.state = 'pester';
      n.stateT = 40;
    }
    switch (n.state) {
      case 'pester': {
        const r = n.walkTo(player.position, dt, 5, 'run');
        if (r === 'stuck') {
          // Zdenko doesn't do obstacles. He just… appears.
          const a = Math.random() * Math.PI * 2;
          n.root.position.set(player.position.x + Math.cos(a) * 2.5, 0, player.position.z + Math.sin(a) * 2.5);
          n.world.colliders.resolve(n.root.position, 0.4);
        }
        if (n.toPlayer < 2.2 || r === true) {
          n.state = 'pesterTalk';
          n.stateT = 3.5;
          n.say(pick(n.def.afkLines), 3.5);
          game?.audio?.blip();
        } else if (n.stateT <= 0) n.state = 'idle';
        break;
      }
      case 'pesterTalk':
        n.char.faceTowards(player.position, dt);
        n.char.play(n.stateT > 2 ? 'wave' : 'idle');
        if (n.stateT <= 0) {
          n.state = game && game.afkTime > 18 ? 'pesterWait' : 'pesterLeave';
          n.stateT = game && game.afkTime > 18 ? 6 + Math.random() * 4 : 0;
        }
        break;
      case 'pesterWait': // still AFK? pester again
        n.char.faceTowards(player.position, dt);
        if (Math.random() < dt * 0.4) n.char.play(pick(['punchL', 'kickR']), 0.1, { once: true });
        if (game.afkTime < 1) n.state = 'pesterLeave';
        else if (n.stateT <= 0) { n.state = 'pesterTalk'; n.stateT = 3.5; n.say(pick(n.def.afkLines), 3.5); }
        break;
      case 'pesterLeave':
        n.state = 'wander'; n.stateT = 15; n.target = null;
        break;
      case 'sit':
        if (!n.char.sitting) n.sitAt(seat, table);
        n.char.play('neutral');
        if (n.stateT <= 0) { n.standUp(); n.state = 'wander'; n.stateT = 20 + Math.random() * 20; }
        break;
      case 'goSit': {
        const r = n.walkTo(seat, dt, 1.4);
        if (r) { n.sitAt(seat, table); n.stateT = 25 + Math.random() * 30; }
        if (n.stateT <= 0) n.state = 'wander';
        break;
      }
      case 'goWerkstatt': {
        const r = n.walkTo(n.world.spots.werkstatt_seat, dt, 1.4);
        if (r === true) { n.state = 'werkstatt'; n.stateT = 35 + Math.random() * 30; }
        else if (n.stateT <= 0) { n.state = 'wander'; n.stateT = 20; }
        break;
      }
      case 'werkstatt': // radio on, head nodding
        n.char.faceTowards(n.world.spots.werkstatt_inside, dt, 3);
        n.char.play('idle', 0.3, { timeScale: 1.6 });
        n.root.rotation.y += Math.sin(t * 4.6) * dt * 0.6;
        if (Math.random() < dt * 0.05 && !n.bubble) n.say(pick([{ de: 'Ey mann… der Bass! Respekt!', en: 'Hey man… that bass! Respect!' }, { de: 'Werkstatt-Radio, bester Sender.', en: 'Workshop radio, best station.' }, { de: '*nickt im Takt*', en: '*nods to the beat*' }]), 3);
        if (n.stateT <= 0) { n.state = 'wander'; n.stateT = 20 + Math.random() * 20; }
        break;
      case 'kungfu':
        if (n.char.current && !n.char.current.isRunning() || n.kfT === undefined || n.kfT <= 0) {
          if ((n.kfMoves = (n.kfMoves || 0) + 1) > 5) { n.kfMoves = 0; n.state = 'wander'; if (Math.random() < 0.5) n.say({ de: 'HIYAAA! …Prost.', en: 'HIYAAA! …Cheers.' }, 2.5); break; }
          n.char.play(pick(['punchL', 'punchR', 'kickL', 'kickR', 'slash']), 0.1, { once: true });
          n.kfT = 0.9;
        }
        n.kfT -= dt;
        break;
      case 'wander':
      default: {
        if (n.stateT <= 0 && n.state === 'wander') { n.state = Math.random() < 0.45 && n.world.spots.werkstatt_seat ? 'goWerkstatt' : 'goSit'; n.stateT = 60; break; }
        if (n.toPlayer < 3) {
          n.char.faceTowards(player.position, dt);
          n.char.play('idle');
          if (Math.random() < dt * 0.07) { n.state = 'kungfu'; n.kfT = 0; n.kfMoves = 0; if (Math.random() < 0.5) n.say(pick(n.def.lines), 3); }
          break;
        }
        if (n.wait > 0) {
          n.wait -= dt;
          n.char.play('idle');
          if (Math.random() < dt * 0.25) { n.state = 'kungfu'; n.kfT = 0; n.kfMoves = 0; }
          break;
        }
        if (!n.target) n.target = n.pickWanderTarget(35, table);
        // drunk sway
        n.root.rotation.y += Math.sin(t * 3) * dt * 0.8;
        const r = n.walkTo(n.target, dt, 1.3);
        if (r) { n.target = null; n.wait = 2 + Math.random() * 4; }
        if (n.state !== 'wander' && n.state !== 'goSit' && n.state !== 'kungfu') n.state = 'wander';
        break;
      }
    }
  },

  // Sabse guards the kitchen; the rules are enforced by Game.checkKitchen().
  kitchen(n, t, dt, { player }) {
    if (n.angryT > 0) {
      n.angryT -= dt;
      n.char.faceTowards(player.position, dt, 10);
      return;
    }
    BEHAVIORS.wander(n, t, dt, { player });
  },

  mechanic(n, t, dt, ctx) {
    BEHAVIORS.wander(n, t, dt, ctx);
  },

  // Schwarzhuber: strolls across his meadow, stops at Zdenko & Thompsen's bench for a while
  farmer(n, t, dt, { player }) {
    if (n.greetCheck(dt, player)) return;
    if (n.toPlayer < 3.5) { n.char.faceTowards(player.position, dt); n.char.play('idle'); return; }
    if (n.wait > 0) {
      n.wait -= dt;
      if (n.atBench) {
        n.char.faceTowards(n.world.spots.chill, dt, 3);
        if (Math.random() < dt * 0.06 && !n.bubble) n.say(pick(n.def.benchLines || n.def.lines), 3.5);
      }
      n.char.play('idle');
      return;
    }
    if (!n.target) {
      n.routeIdx = (n.routeIdx + 1) % n.def.route.length;
      const name = n.def.route[n.routeIdx];
      n.atBench = name === 'chill';
      n.target = n.resolveSpot(name);
      if (!n.target) return;
      if (n.atBench) { n.target.x += 1.6; n.target.z += 1.2; } else { n.target.x += (Math.random() - 0.5) * 8; n.target.z += (Math.random() - 0.5) * 8; }
    }
    const r = n.walkTo(n.target, dt, 1.35);
    if (r) { n.target = null; n.wait = n.atBench ? 40 + Math.random() * 30 : 5 + Math.random() * 6; }
  },

  // Narnia crew: busy on their plot, hammering most of the time
  builder(n, t, dt, { player }) {
    if (n.greetCheck(dt, player)) return;
    if (n.toPlayer < 3) { n.char.faceTowards(player.position, dt); n.char.play('idle'); return; }
    if (n.wait > 0) {
      n.wait -= dt;
      if (n.lookAt) n.char.faceTowards(n.lookAt, dt, 4);
      n.char.play(n.workAnim ? 'interact' : 'idle');
      return;
    }
    if (!n.target) n.target = n.pickWanderTarget();
    const r = n.walkTo(n.target, dt, 1.8);
    if (r) {
      n.target = null;
      n.workAnim = Math.random() < 0.85;
      n.wait = 4 + Math.random() * 7;
      n.lookAt = n.resolveSpot(n.def.home);
    }
  },

  // Fire island: practise with flow toys on the stage in front of Shiva, sometimes build the space
  flow(n, t, dt, { player, world }) {
    if (n.state !== 'flow' && n.state !== 'fbuild') { n.state = Math.random() < 0.7 ? 'flow' : 'fbuild'; n.stateT = 10 + Math.random() * 20; }
    n.stateT -= dt;
    const w = n.world;
    if (n.state === 'flow') {
      if (!n.atSlot) {
        n.char.setFlow(null);
        const r = n.walkTo(n.home, dt, 1.8);
        if (r) n.atSlot = true;
        if (r === 'stuck') n.atSlot = true;
        return;
      }
      n.char.setFlow(n.def.toy);
      n.char.setFlowFire(w.night > 0.45);
      n.char.play('idle');
      // turn slowly around the stage centre, facing out to the (future) audience
      const c = w.spots.fire_stage || n.home;
      const out = Math.atan2(n.position.x - c.x, n.position.z - c.z);
      n.char.turnTo(out + Math.sin(t * 0.3 + n.home.x) * 0.9, dt, 1.5);
      if (n.stateT <= 0) { n.state = 'fbuild'; n.stateT = 12 + Math.random() * 12; n.atSlot = false; n.target = null; n.char.setFlow(null); }
    } else {
      n.char.setFlow(null);
      if (n.wait > 0) { n.wait -= dt; n.char.play('interact'); }
      else {
        if (!n.target) n.target = n.pickWanderTarget(9, w.spots.plot_firespace || n.home);
        const r = n.walkTo(n.target, dt, 1.7);
        if (r) { n.target = null; n.wait = 3 + Math.random() * 4; }
      }
      if (n.stateT <= 0) { n.state = 'flow'; n.stateT = 25 + Math.random() * 25; n.target = null; n.wait = 0; }
    }
  },
};

export class NPCManager {
  constructor(world) {
    this.world = world;
    this.map = new Map();
    for (const def of NPCS) this.map.set(def.id, new NPC(def, world, this));
    this.campers = [];
  }
  get(id) { return this.map.get(id); }
  get all() { return [...this.map.values()]; }

  /** Somewhere on the festival ground that isn't inside a structure. */
  randomFestivalSpot() {
    const pts = AREAS.festival;
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const nav = this.world.nav;
    for (let k = 0; k < 30; k++) {
      const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0);
      if (!inPolyXZ(x, z, pts) || nav?.blockedAt(x, z)) continue;
      return new THREE.Vector3(x, 0, z);
    }
    return null;
  }

  randomCampSpot() {
    const spots = this.world.campSpots;
    if (!spots?.length) return null;
    return spots[Math.floor(Math.random() * spots.length)].clone();
  }

  /** More volunteers show up as the build progresses. */
  setCrowd(n) {
    while (this.campers.length < n) {
      const def = makeCamper(this.campers.length);
      const npc = new NPC(def, this.world, this);
      this.campers.push(npc);
      this.map.set(def.id, npc);
    }
  }

  /** Art workshop in the Künstlergasse: a few volunteers sit at the tables and paint. */
  setWorkshop(on) {
    const seats = ['kg_seat1', 'kg_seat2', 'kg_seat3', 'kg_seat4'];
    const busy = this.campers.filter((n) => n.workshopSeat);
    if (!on) {
      for (const n of busy) { n.def = n.workshopDef; n.home = n.workshopHome; n.workshopSeat = null; n.char.setSitting(false); n.target = null; }
      return;
    }
    const free = seats.filter((s) => !busy.some((n) => n.workshopSeat === s));
    const cands = this.campers.filter((n) => !n.workshopSeat && n.def.behavior === 'wander' && !n.incident && !n.task);
    for (const s of free) {
      const n = cands.shift();
      if (!n) break;
      n.workshopSeat = s;
      n.workshopDef = n.def;
      n.workshopHome = n.home;
      n.def = { ...n.def, behavior: 'sitter', face: 'kg_table', lines: [...n.def.lines, { de: 'Ich mal gerade meine Aura. Sie ist… lila. Glaub ich.', en: 'I\'m painting my aura. It\'s… purple. I think.' }, { de: 'Cosma sagt, es gibt kein Falsch in der Kunst. Bruno hat trotzdem was falsch gemacht.', en: 'Cosma says there\'s no wrong in art. Bruno still did something wrong.' }] };
      n.home = this.world.spots[s].clone();
      n.target = null;
    }
  }

  /** Show NPCs that only arrive later (e.g. Verena before the festival). */
  refreshAppear(qs) {
    for (const n of this.map.values()) {
      const h = n.def.homeAfter;
      const hDone = h && [].concat(h.quest).every((q) => qs.isDone(q));
      if (h && hDone && !n.movedHome) {
        n.movedHome = true;
        const sp = this.world.spots[h.spot];
        if (sp) { n.home = new THREE.Vector3(sp.x + (h.offset?.[0] || 0), 0, sp.z + (h.offset?.[1] || 0)); n.def = { ...n.def, radius: h.radius }; n.target = null; }
      } else if (h && !hDone && n.movedHome) {
        n.movedHome = false; // new game
        const sp = this.world.spots[n.def.home];
        if (sp) n.home = new THREE.Vector3(sp.x + (n.def.offset?.[0] || 0), 0, sp.z + (n.def.offset?.[1] || 0));
      }
      const a = n.def.appearAfter;
      const hidden = (!!a && !qs.isDone(a)) || !!n.away || !!n.gone; // away = off to the DIY store, gone = went home in the rain
      if (n.hidden !== hidden) { n.hidden = hidden; n.root.visible = !hidden; }
    }
  }

  update(t, dt, ctx) {
    this.playerPos = ctx.player.position;
    let nb = 0;
    for (const n of this.map.values()) if (n.bubble && n.toPlayer < 18) nb++;
    this.nearBubbles = nb;
    if (this.world.nav) this.world.nav.budget = 6; // ms of pathfinding per frame
    for (const n of this.map.values()) {
      // cheap LOD: far away NPCs update less often
      const d = n.position.distanceTo(ctx.player.position);
      if (d > 110) {
        n._acc = (n._acc || 0) + dt;
        if (n._acc < 0.3) continue;
        n.update(t, n._acc, ctx);
        n._acc = 0;
        continue;
      }
      n.update(t, dt, ctx);
    }
  }
}
