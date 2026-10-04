import * as THREE from 'three';
import { getLang } from '../i18n.js';

// Wheel loader precision job (step type 'park'): back the loader into a lane of traffic cones and stop
// right on the mark, nose pointing the right way. Knock over too many cones and Juli sets them up again.
//   { type: 'park', at: spotName, heading, item, text, build? }

const MAX_HITS = 3;
const HOLD = 1.2;          // seconds standing still on the mark
const POS_TOL = 1.3;       // metres
const HEAD_TOL = 0.32;     // radians

export class Parking {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.coneGeo = new THREE.ConeGeometry(0.28, 0.75, 10);
    this.coneMat = new THREE.MeshStandardMaterial({ color: '#ff6a10', roughness: 0.6 });
    this.stripeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
  }

  start(qid, step) {
    this.stop();
    const g = this.game;
    const spot = g.world.spots[step.at];
    if (!spot) return;
    const h = step.heading || 0;
    const fwd = new THREE.Vector3(Math.sin(h), 0, Math.cos(h)), side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const group = new THREE.Group();
    // painted target box on the ground
    const box = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.6), new THREE.MeshBasicMaterial({ color: '#ffd21f', transparent: true, opacity: 0.35, depthWrite: false }));
    box.rotation.x = -Math.PI / 2;
    box.rotation.z = -h;
    box.position.set(spot.x, 0.06, spot.z);
    group.add(box);
    const cones = [];
    // a lane: two rows of cones leading into the box, a bit narrower at the end
    for (const along of [-6, -3.5, -1, 1.6]) {
      for (const s of [-1, 1]) {
        const lat = along > 0 ? 2.2 : 2.5;
        const p = spot.clone().addScaledVector(fwd, along).addScaledVector(side, s * lat);
        const c = new THREE.Group();
        c.add(new THREE.Mesh(this.coneGeo, this.coneMat).translateY(0.375));
        c.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.12, 10), this.stripeMat).translateY(0.42));
        c.position.copy(p);
        group.add(c);
        cones.push({ obj: c, pos: p, down: false });
      }
    }
    g.world.scene.add(group);
    this.active = { qid, step, spot, h, fwd, group, cones, hits: 0, hold: 0, hinted: false };
  }

  stop() {
    if (!this.active) return;
    this.game.world.scene.remove(this.active.group);
    this.active = null;
  }

  update(dt) {
    const a = this.active;
    if (!a) return;
    const g = this.game, qs = g.quests;
    if (qs.currentStep(a.qid) !== a.step) { this.stop(); return; }
    const L = g.vehicles.radlader;
    const de = getLang() === 'de';
    // cones: knocked over when the loader's body touches them
    const lp = L.position, lf = new THREE.Vector3(Math.sin(L.heading), 0, Math.cos(L.heading));
    for (const c of a.cones) {
      if (c.down) { c.obj.rotation.x += (Math.PI / 2 - c.obj.rotation.x) * Math.min(1, dt * 8); continue; }
      const rel = c.pos.clone().sub(lp);
      const along = THREE.MathUtils.clamp(rel.dot(lf), -2.2, 3.4); // body + bucket
      const d = rel.clone().addScaledVector(lf, -along).setY(0).length();
      if (d < 1.25 && Math.abs(L.speed) > 0.05) {
        c.down = true;
        c.obj.rotation.y = Math.atan2(lf.x, lf.z);
        a.hits++;
        g.audio.tone?.(320, 0.08, { type: 'square', vol: 0.08 });
        if (a.hits >= MAX_HITS) {
          g.ui.toast(de ? `🚧 ${a.hits} Hütchen umgefahren! Juli stellt sie seufzend wieder auf. Nochmal – langsam.` : `🚧 ${a.hits} cones knocked over! Juli sighs and puts them back. Again – slowly.`);
          g.npcs.get('juli')?.say({ de: 'Langsam. LANGSAM. Das ist ein Radlader, kein Autoscooter.', en: 'Slowly. SLOWLY. It\'s a wheel loader, not a bumper car.' }, 4);
          for (const k of a.cones) { k.down = false; k.obj.rotation.set(0, 0, 0); }
          a.hits = 0;
        } else g.ui.toast(de ? `🚧 Hütchen umgefahren (${a.hits}/${MAX_HITS})` : `🚧 Cone knocked over (${a.hits}/${MAX_HITS})`);
      }
    }
    // on the mark?
    if (g.player.vehicle !== L || !qs.has(a.step.item)) { a.hold = 0; return; }
    const dx = lp.x - a.spot.x, dz = lp.z - a.spot.z;
    let dh = L.heading - a.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const onMark = Math.hypot(dx, dz) < POS_TOL && Math.abs(dh) < HEAD_TOL;
    if (onMark && !a.hinted && Math.abs(L.speed) > 0.2) { a.hinted = true; g.ui.toast(de ? '🅿️ Gut so – jetzt anhalten!' : '🅿️ That\'s it – now stop!'); }
    if (onMark && Math.abs(L.speed) < 0.3) a.hold += dt; else a.hold = 0;
    if (a.hold >= HOLD) {
      const qid = a.qid;
      this.stop();
      qs.parkDone(qid);
    }
  }
}
