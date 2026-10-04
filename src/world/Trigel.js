import * as THREE from 'three';
import { heightAt } from './Height.js';
import { L } from '../i18n.js';

// The Trigel – the Trikaya hedgehog. Every now and then (more often in the evening) it trundles into
// the Aufenthaltszelt in the crew camp, sniffs around under the beer benches for food and wanders off again.
// Come too close and it curls up for a moment. Press E to say hi.

const C = (de, en) => ({ de, en });
const PET_LINES = [
  C('🦔 Der Trigel schnüffelt an deinem Schuh. Kein Essen. Enttäuschung.', '🦔 The Trigel sniffs your shoe. No food. Disappointment.'),
  C('🦔 Der Trigel schaut dich an, als hättest du die Linsen versteckt.', '🦔 The Trigel looks at you like you hid the lentils.'),
  C('🦔 *schnauf schnauf* – der Trigel ignoriert dich und sucht weiter Krümel.', '🦔 *sniff sniff* – the Trigel ignores you and keeps looking for crumbs.'),
  C('🦔 Der Trigel hat einen Brezelkrümel gefunden. Er ist jetzt der glücklichste Mensch im Camp. Also Igel.', '🦔 The Trigel found a pretzel crumb. Happiest person in the camp now. Well, hedgehog.'),
  C('🦔 Der Trigel rollt sich kurz ein. Dann wieder aus. Er hat beschlossen, dass du okay bist.', '🦔 The Trigel curls up for a second. Then uncurls. It decided you\'re okay.'),
];

function buildMesh() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const spikeMat = new THREE.MeshStandardMaterial({ color: '#5a4632', roughness: 1, flatShading: true });
  const tipMat = new THREE.MeshStandardMaterial({ color: '#d8ccb4', roughness: 1, flatShading: true });
  const faceMat = new THREE.MeshStandardMaterial({ color: '#c9a77e', roughness: 1, flatShading: true });
  const black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.4 });
  // spiky back
  const back = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), spikeMat);
  back.scale.set(0.95, 0.72, 1.25);
  back.position.y = 0.1;
  back.castShadow = true;
  body.add(back);
  const spikeGeo = new THREE.ConeGeometry(0.017, 0.07, 4);
  spikeGeo.translate(0, 0.035, 0);
  const spikes = new THREE.InstancedMesh(spikeGeo, spikeMat, 90);
  const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 4, 3), tipMat, 90);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < 90; i++) {
    // points on the upper/back half of the ellipsoid, pointing outwards and slightly backwards
    const u = Math.random() * Math.PI * 2, v = Math.acos(1 - Math.random() * 1.15);
    n.set(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u));
    if (n.z > 0.75) n.z = 0.75 - Math.random() * 0.3; // keep the face free
    p.set(n.x * 0.14, 0.1 + n.y * 0.1, n.z * 0.18);
    n.z -= 0.6; n.normalize();
    q.setFromUnitVectors(up, n);
    m.compose(p, q, new THREE.Vector3(1, 0.8 + Math.random() * 0.5, 1));
    spikes.setMatrixAt(i, m);
    m.compose(p.clone().addScaledVector(n, 0.066), q, new THREE.Vector3(1, 1, 1));
    tips.setMatrixAt(i, m);
  }
  spikes.castShadow = true;
  body.add(spikes, tips);
  // face: pointy snout, nose, eyes, ears
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 6), faceMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.075, 0.2);
  body.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), black);
  nose.position.set(0, 0.075, 0.27);
  body.add(nose);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), black);
    eye.position.set(s * 0.04, 0.11, 0.17);
    body.add(eye);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), faceMat);
    ear.scale.set(1, 1, 0.5);
    ear.position.set(s * 0.065, 0.14, 0.13);
    body.add(ear);
  }
  // little feet
  const feet = [];
  for (const [fx, fz] of [[-0.07, 0.09], [0.07, 0.09], [-0.07, -0.09], [0.07, -0.09]]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), faceMat);
    f.scale.set(1, 0.6, 1.3);
    f.position.set(fx, 0.015, fz);
    g.add(f);
    feet.push(f);
  }
  g.userData = { body, nose, feet };
  return g;
}

export class Trigel {
  constructor(world) {
    this.world = world;
    this.mesh = buildMesh();
    this.mesh.visible = false;
    world.scene.add(this.mesh);
    this.state = 'away';
    this.timer = 40 + Math.random() * 60; // first visit fairly soon
    this.target = new THREE.Vector3();
    this.stops = 0;
    this.curl = 0;
    this.lineIdx = Math.floor(Math.random() * PET_LINES.length);
  }

  get position() { return this.mesh.position; }
  get visible() { return this.state !== 'away'; }

  tent() { return this.world.spots.aufenthalt; }

  /** A point just outside the tent, where it comes from / disappears to. */
  edgePoint(out) {
    const c = this.tent();
    const a = Math.random() * Math.PI * 2;
    return out.set(c.x + Math.cos(a) * 8, 0, c.z + Math.sin(a) * 6);
  }

  /** Somewhere under or next to a beer bench – that's where the crumbs are. */
  snackPoint(out) {
    const s = this.world.spots;
    const t = s[`tent_table${1 + Math.floor(Math.random() * 3)}`] || this.tent();
    return out.set(t.x + (Math.random() - 0.5) * 2.4, 0, t.z + (Math.random() - 0.5) * 1.6);
  }

  reset() {
    this.state = 'away';
    this.mesh.visible = false;
    this.timer = 40 + Math.random() * 60;
  }

  /** Close enough to say hi? */
  near(p) { return this.visible && this.mesh.position.distanceTo(p) < 1.8; }

  pet() {
    this.curl = 1.2;
    this.lineIdx = (this.lineIdx + 1 + Math.floor(Math.random() * (PET_LINES.length - 1))) % PET_LINES.length;
    return L(PET_LINES[this.lineIdx]);
  }

  update(dt, time, playerPos, night = 0) {
    if (!this.tent()) return;
    const mesh = this.mesh;
    if (this.state === 'away') {
      this.timer -= dt * (night > 0.3 ? 2.5 : 1); // hedgehogs prefer the evening
      if (this.timer > 0) return;
      this.edgePoint(mesh.position);
      this.snackPoint(this.target);
      this.stops = 3 + Math.floor(Math.random() * 3);
      this.state = 'walk';
      this.petted = false;
      mesh.visible = true;
    }
    const { body, nose, feet } = mesh.userData;
    // someone stomps by → curl up into a ball for a moment
    const close = !!playerPos && playerPos.distanceTo(mesh.position) < 1.1;
    if (close && !this._close) this.curl = 2;
    this._close = close;
    if (this.curl > 0) {
      this.curl -= dt;
      const k = Math.min(1, this.curl * 3);
      body.scale.set(1 + 0.12 * k, 1 - 0.15 * k, 1 - 0.3 * k);
      body.rotation.x = 0.35 * k;
      mesh.position.y = heightAt(mesh.position.x, mesh.position.z);
      return;
    }
    body.scale.set(1, 1, 1);
    body.rotation.x = 0;

    if (this.state === 'sniff') {
      this.timer -= dt;
      nose.position.x = Math.sin(time * 18) * 0.006; // wiggly nose
      body.rotation.z = Math.sin(time * 3) * 0.08;
      if (this.timer <= 0) {
        this.stops--;
        if (this.stops > 0) this.snackPoint(this.target);
        else this.edgePoint(this.target);
        this.state = this.stops > 0 ? 'walk' : 'leave';
      }
    } else {
      // trundle towards the target
      const d = this._d ||= new THREE.Vector3();
      d.subVectors(this.target, mesh.position).setY(0);
      const dist = d.length();
      const speed = this.state === 'leave' ? 0.75 : 0.55;
      if (dist < 0.1) {
        if (this.state === 'leave') { this.state = 'away'; mesh.visible = false; this.timer = 120 + Math.random() * 180; return; }
        this.state = 'sniff';
        this.timer = 3 + Math.random() * 4;
      } else {
        const want = Math.atan2(d.x, d.z);
        let turn = want - mesh.rotation.y;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        mesh.rotation.y += turn * Math.min(1, dt * 5);
        mesh.position.addScaledVector(d.normalize(), Math.min(dist, speed * dt));
        // waddle
        body.position.y = Math.abs(Math.sin(time * 14)) * 0.012;
        body.rotation.z = Math.sin(time * 14) * 0.05;
        feet.forEach((f, i) => { f.position.y = 0.015 + Math.max(0, Math.sin(time * 14 + (i % 3 ? Math.PI : 0))) * 0.015; });
      }
    }
    mesh.position.y = heightAt(mesh.position.x, mesh.position.z);
  }
}
