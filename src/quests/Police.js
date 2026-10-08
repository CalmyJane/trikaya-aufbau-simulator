import * as THREE from 'three';
import { mat, box, cyl } from '../world/Props.js';
import { SITE_BOUNDS, POLICE_MARGIN } from '../world/layout.js';
import { heightAt } from '../world/Height.js';
import { getLang } from '../i18n.js';

// Wander off into the fields and the police will pick you up. Jan bails you out. It's not cheap.

// No PointLight on purpose: adding a light at runtime makes three.js recompile every shader
// (that was the big hitch when the police showed up). The blue lights are emissive + glow sprites.
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function policeCar() {
  const g = new THREE.Group();
  g.add(box(1.9, 0.7, 4.3, mat('#f2f2f2', { roughness: 0.4 }), 0, 0.75, 0));
  g.add(box(1.7, 0.6, 2.2, mat('#f2f2f2', { roughness: 0.4 }), 0, 1.4, -0.2));
  g.add(box(1.72, 0.45, 2.0, new THREE.MeshStandardMaterial({ color: '#1a2a3a', roughness: 0.2, metalness: 0.4 }), 0, 1.45, -0.2));
  g.add(box(1.92, 0.22, 4.32, mat('#1f5fbf'), 0, 0.75, 0)); // blue stripe
  const m1 = new THREE.MeshBasicMaterial({ color: '#2060ff' });
  const m2 = new THREE.MeshBasicMaterial({ color: '#ff2020' });
  const l1 = box(0.6, 0.18, 0.3, m1, -0.35, 1.8, -0.2), l2 = box(0.6, 0.18, 0.3, m2, 0.35, 1.8, -0.2);
  g.add(l1, l2);
  const tex = glowTexture();
  const s1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#3060ff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#ff2020', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s1.position.set(-0.35, 1.85, -0.2); s2.position.set(0.35, 1.85, -0.2);
  s1.scale.setScalar(3); s2.scale.setScalar(3);
  g.add(s1, s2);
  for (const [x, z] of [[0.9, 1.3], [-0.9, 1.3], [0.9, -1.3], [-0.9, -1.3]]) {
    const w = cyl(0.38, 0.38, 0.3, mat('#1a1a1a'), 12, x, 0.38, z);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  g.userData = { m1, m2, s1, s2 };
  return g;
}

export class Police {
  constructor(game) {
    this.game = game;
    this.warned = false;
    this.busy = false;
    // built once up front (and compiled with the scene) so the arrest doesn't stutter
    this.car = policeCar();
    this.car.visible = false;
    game.world.scene.add(this.car);
  }

  outside(p) {
    const b = SITE_BOUNDS;
    const dx = Math.max(b.minX - p.x, 0, p.x - b.maxX);
    const dz = Math.max(b.minZ - p.z, 0, p.z - b.maxZ);
    return Math.hypot(dx, dz);
  }

  update(dt) {
    const g = this.game;
    if (this.busy) { this.animate(dt); return; }
    const d = this.outside(g.player.position);
    const de = getLang() === 'de';
    if (d > 4 && !this.warned) {
      this.warned = true;
      g.ui.toast(de ? '⚠️ Vorsicht, du verlässt das Festivalgelände!' : '⚠️ Careful, you\'re leaving the festival site!');
    }
    if (d < 1) this.warned = false;
    if (d > POLICE_MARGIN) this.arrest();
  }

  async arrest() {
    const g = this.game;
    this.busy = true;
    const de = getLang() === 'de';
    const pl = g.player;
    const veh = pl.vehicle;
    if (veh) g.exitVehicle();
    pl.frozen = true;
    // the car drives up from the site side
    const p = pl.position.clone();
    const toSite = new THREE.Vector3(-p.x, 0, -p.z).normalize();
    const start = p.clone().addScaledVector(toSite, 30);
    const stop = p.clone().addScaledVector(toSite, 5);
    this.car.position.set(start.x, heightAt(start.x, start.z), start.z);
    this.car.rotation.y = Math.atan2(-toSite.x, -toSite.z);
    this.car.visible = true;
    this.drive = { from: start, to: stop, t: 0 };
    g.audio.siren?.();
    document.body.classList.add('police');
    await new Promise((r) => setTimeout(r, 2600));
    await g.runDialog([
      { who: 'police', text: de ? 'Guten Tag. Allgemeine Kontrolle. Sie sind hier barfuß auf einem fremden Acker unterwegs.' : 'Good day. Routine check. You\'re out here barefoot on someone else\'s field.' },
      { who: 'you', text: de ? 'Ich… gehör zum Festival. Aufbau-Crew. Ich hab ein Bändchen!' : 'I… belong to the festival. Build crew. I have a wristband!' },
      { who: 'police', text: de ? 'Ein Bändchen. Aha. Und die Frisur ist auch dienstlich? Sie kommen jetzt mal mit auf die Wache.' : 'A wristband. I see. And the hairdo is official too? You\'re coming with us to the station.' },
    ], null, null);
    g.ui.fade(true);
    await new Promise((r) => setTimeout(r, 1400));
    // back at the crew base
    const spawn = g.world.spots.spawn;
    pl.root.position.set(spawn.x, 0, spawn.z);
    if (veh) { // Andi & Flo tow it back
      const vs = g.world.vehicleSpots[veh.id];
      veh.place(vs.pos, vs.heading);
      veh.speed = 0;
    }
    this.car.visible = false;
    this.drive = null;
    document.body.classList.remove('police');
    g.ui.fade(false);
    g.economy.spend(500, { de: 'Kaution (Polizeiwache)', en: 'Bail (police station)' });
    await g.runDialog([
      { who: 'jan', text: de ? 'So. Ich hab dich von der Wache abgeholt. Kaution: 500 Euro. Aus dem Festival-Budget. Das eh schon im Minus ist.' : 'Right. I picked you up from the station. Bail: 500 euros. From the festival budget. Which is already in the red.' },
      { who: 'jan', text: de ? 'Bitte bleib auf dem Gelände. Leo wär das nicht passiert. Leo hätten sie gar nicht erst gefunden.' : 'Please stay on the site. That wouldn\'t have happened to Leo. They\'d never have found Leo in the first place.' },
    ], null, g.npcs.get('jan'));
    pl.frozen = false;
    this.busy = false;
    this.warned = false;
  }

  animate(dt) {
    const c = this.car;
    if (!c.visible) return;
    const u = c.userData;
    const on = Math.floor(performance.now() / 180) % 2 === 0;
    u.m1.color.set(on ? '#3060ff' : '#10183a');
    u.m2.color.set(on ? '#3a1010' : '#ff2020');
    u.s1.visible = on; u.s2.visible = !on;
    if (this.drive && this.drive.t < 1) {
      this.drive.t = Math.min(1, this.drive.t + dt / 2.2);
      const k = 1 - Math.pow(1 - this.drive.t, 3);
      const pos = this.drive.from.clone().lerp(this.drive.to, k);
      c.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
    }
  }
}
