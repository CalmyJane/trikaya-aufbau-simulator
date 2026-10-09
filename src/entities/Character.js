import * as THREE from 'three';
import { Assets, normalise } from '../core/Assets.js';

// Animated humanoid built on the Quaternius "modular" rigs (all share one skeleton & clip set).
// Looks are data: recolour body parts by *role*, add hair styles & props on bones.

const ANIMS = {
  idle: 'Idle', walk: 'Walk', run: 'Run', wave: 'Wave', interact: 'Interact',
  neutral: 'Idle_Neutral', roll: 'Roll', death: 'Death',
  punchL: 'Punch_Left', punchR: 'Punch_Right', kickL: 'Kick_Left', kickR: 'Kick_Right',
  hit: 'HitRecieve', slash: 'Sword_Slash',
};

// (meshPart:material) -> role. meshPart is Legs/Feet/Body/Head/Backpack.
const RIGS = {
  m_casual: { 'Feet:*': 'shoes', 'Legs:*': 'pants', 'Body:LightBrown': 'shirt', '*:Skin': 'skin', '*:Skin_Darker': 'skin', 'Head:Hair': 'hair', 'Head:Eyebrows': 'brows' },
  m_hoodie: { 'Feet:*': 'shoes', 'Body:Purple': 'shirt', '*:Skin': 'skin', 'Legs:LightBlue': 'pants', 'Head:Hair': 'hair', 'Head:Eyebrows': 'brows' },
  m_punk: { 'Feet:Black': 'shoes', '*:Skin': 'skin', 'Body:Black': 'jacket', 'Body:White': 'shirt', 'Legs:LightBlue': 'pants', 'Head:Red': 'hair', 'Head:Red_Dark': 'hair', 'Head:Eyebrows': 'brows' },
  m_adventurer: { 'Feet:*': 'shoes', 'Legs:Brown2': 'pants', 'Legs:Brown': 'pants2', 'Backpack:*': 'backpack', 'Body:Green': 'shirt', 'Body:LightGreen': 'shirt2', '*:Skin': 'skin', 'Head:Hair': 'hair', 'Head:Eyebrows': 'brows' },
  f_casual: { 'Body:White': 'shirt', '*:Skin': 'skin', 'Feet:Grey': 'shoes', 'Head:Hair_Blond': 'hair', 'Head:Hair_Brown': 'hair', 'Head:Brown': 'brows', 'Legs:Orange': 'pants' },
  f_formal: { 'Head:Red': 'hair', 'Head:Brown': 'brows', '*:Skin': 'skin', 'Body:LimeGreen': 'shirt', 'Body:Gold': 'belt', 'Legs:LimeGreen': 'pants', 'Feet:Red': 'shoes' },
};

const PART_RE = /(Legs|Feet|Body|Head|Backpack)/;

function roleOf(rig, part, mat) {
  const map = RIGS[rig] || {};
  return map[`${part}:${mat}`] ?? map[`${part}:*`] ?? map[`*:${mat}`] ?? null;
}

/**
 * Patchwork "second-hand, self-made" look: colour blocks + stitch lines driven by
 * the rest-pose vertex position, so the pattern sticks to the cloth.
 */
function patchwork(material, colors, cell) {
  const cols = colors.map((c) => new THREE.Color(c));
  while (cols.length < 3) cols.push(cols[0].clone().offsetHSL(0.05, 0, -0.08));
  material.onBeforeCompile = (sh) => {
    sh.uniforms.pc0 = { value: cols[0] };
    sh.uniforms.pc1 = { value: cols[1] };
    sh.uniforms.pc2 = { value: cols[2] };
    sh.uniforms.pCell = { value: cell };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRest;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRest;\nuniform vec3 pc0; uniform vec3 pc1; uniform vec3 pc2; uniform float pCell;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 q = vRest / pCell + vec3(0.37, 0.11, 0.73);
        vec3 id = floor(q);
        float h = fract(sin(dot(id, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        vec3 pc = h < 0.45 ? pc0 : (h < 0.78 ? pc1 : pc2);
        vec3 f = abs(fract(q) - 0.5);
        float seam = smoothstep(0.44, 0.48, max(f.x, max(f.y, f.z)));
        diffuseColor.rgb = mix(pc, pc * 0.45, seam * 0.8);`);
  };
  material.customProgramCacheKey = () => `patch${colors.join()}${cell.toFixed(4)}`;
}

let dreadGeo, strandGeo;

export class Character {
  /**
   * @param {object} look  see npcData.js — { base, skin, hair, shirt, pants, shoes, patchwork,
   *                       hairStyle, height, width, extras, backpack }
   */
  constructor(look = {}) {
    const base = look.base || 'm_casual';
    const { object, clips } = Assets.character(base);
    this.look = look;
    this.root = new THREE.Group();      // position / heading
    this.model = object;
    const height = look.height || 1.8;
    normalise(this.model, { height });
    if (look.width) { this.model.scale.x *= look.width; this.model.scale.z *= look.width; }
    this.root.add(this.model);
    this.model.updateMatrixWorld(true);

    this.applyColors(base, look);

    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    for (const [key, name] of Object.entries(ANIMS)) {
      const clip = clips.find((c) => c.name.endsWith('|' + name) || c.name === name);
      if (clip) this.actions[key] = this.mixer.clipAction(clip);
    }
    this.current = null;
    this.play('idle', 0);

    this.bones = {};
    this.model.traverse((o) => { if (o.isBone) this.bones[o.name] = o; });
    this.addHair(look);
    this.addExtras(look);

    this.carryAnchor = new THREE.Group();
    this.carryAnchor.position.set(0, 0.86 * (height / 1.8), 0.4);
    this.root.add(this.carryAnchor);
    this.sitting = false;
  }

  applyColors(base, look) {
    const skin = look.skin || '#e0b48a';
    const colorFor = {
      skin,
      shoes: look.shoes || skin,           // barefoot unless stated otherwise
      hair: look.hair || '#3a2414',
      brows: look.brows || look.hair || '#3a2414',
      shirt: look.shirt, shirt2: look.shirt2 || look.shirt, jacket: look.jacket || look.shirt2 || look.shirt,
      pants: look.pants, pants2: look.pants2 || look.pants, belt: look.belt,
      backpack: look.backpackColor,
    };
    this.model.updateMatrixWorld(true);
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      let n = o, part = null;
      while (n && !part) { const m = PART_RE.exec(n.name || ''); if (m && !n.isBone) part = m[1]; n = n.parent; }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        const role = roleOf(base, part, m.name);
        if (role === 'backpack' && look.backpack === false) { o.visible = false; return; }
        const c = colorFor[role];
        if (c) m.color.set(c);
        const pw = look.patchwork && (role === 'shirt' || role === 'pants' || role === 'jacket');
        if (pw) {
          o.geometry.computeBoundingBox();
          const size = o.geometry.boundingBox.getSize(new THREE.Vector3());
          const baseCol = new THREE.Color(role === 'pants' ? look.pants : look.shirt || '#777777');
          const auto = [baseCol.getStyle(), baseCol.clone().offsetHSL(0.08, 0, -0.1).getStyle(), baseCol.clone().offsetHSL(-0.1, -0.1, 0.08).getStyle()];
          const palette = (role === 'pants' ? look.pantsPatch : look.shirtPatch) || auto;
          patchwork(m, palette.map((x) => x || '#777777'), Math.max(size.x, size.y, size.z) / 6);
        }
        m.flatShading = true;
        // short haircut: squash the hair piece down onto the scalp
        if (role === 'hair' && look.hairCut && !Array.isArray(o.material) && !o.userData.cut) {
          o.userData.cut = true;
          o.geometry = o.geometry.clone();
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          const c = bb.getCenter(new THREE.Vector3());
          const pos = o.geometry.attributes.position;
          const h = bb.max.y - bb.min.y;
          if (look.hairCut === 'sidecut') {
            // shaved sides, volume on top, no tail at the back
            const backLimit = bb.min.z + (bb.max.z - bb.min.z) * 0.28;
            for (let i = 0; i < pos.count; i++) {
              const t = (pos.getY(i) - bb.min.y) / h;
              const k = t < 0.55 ? 0.72 : t < 0.8 ? 0.72 + (t - 0.55) / 0.25 * 0.28 : 1;
              let z = pos.getZ(i);
              if (z < backLimit) z = backLimit + (z - backLimit) * 0.15;
              pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * k, pos.getY(i), c.z + (z - c.z) * (0.85 + 0.15 * k));
            }
          } else {
            const [sx, sy, sz] = look.hairCut;
            // pivot low in the hair volume so it shrinks towards the head
            const py = bb.min.y + h * 0.15;
            for (let i = 0; i < pos.count; i++) {
              pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * sx, py + (pos.getY(i) - py) * sy, c.z + (pos.getZ(i) - c.z) * sz);
            }
          }
          pos.needsUpdate = true;
          o.geometry.computeVertexNormals();
        }
      });
    });
  }

  /** Attach an object to a bone so that `obj` is authored in metres, axes = character space. */
  attachToBone(boneName, obj, offset = new THREE.Vector3()) {
    const bone = this.bones[boneName];
    if (!bone) return null;
    this.model.updateMatrixWorld(true);
    const holder = new THREE.Group();
    const bq = bone.getWorldQuaternion(new THREE.Quaternion());
    const rq = this.root.getWorldQuaternion(new THREE.Quaternion());
    const bs = bone.getWorldScale(new THREE.Vector3());
    const rs = this.root.getWorldScale(new THREE.Vector3());
    holder.quaternion.copy(bq.invert().multiply(rq));
    holder.scale.set(rs.x / bs.x, rs.y / bs.y, rs.z / bs.z);
    // wide characters have a wider head too – hair caps, beards, glasses & hats must widen with it
    // (otherwise the skull pokes through a short-hair cap and only a stripe of hair is left)
    if (boneName === 'Head') {
      const k = (this.look.height || 1.8) / 1.8, w = this.look.width || 1; // the model is scaled to its height
      holder.scale.multiply(new THREE.Vector3(k * w, k, k * w));
    }
    // offset expressed in character space -> bone local
    const off = offset.clone().applyQuaternion(holder.quaternion).multiply(holder.scale);
    holder.position.copy(off);
    holder.add(obj);
    bone.add(holder);
    return holder;
  }

  /** Head top position relative to the head bone (character space metres). */
  headInfo() {
    const head = this.bones.Head, end = this.bones.Head_end || this.bones.Head.children.find((c) => c.isBone);
    const rootInv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const hp = head.getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv);
    const ep = end ? end.getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv) : hp.clone().add(new THREE.Vector3(0, 0.25, 0));
    return { len: hp.distanceTo(ep), base: hp, top: ep };
  }

  addHair(look) {
    // a squashed short cut leaves the crown bald (a ring of hair) – cover it with a short cap
    // unless the character really has a receding hairline (Zdenko)
    if (!look.hairStyle && Array.isArray(look.hairCut) && !look.halfBald) look = { ...look, hairStyle: 'short', hairStyleColor: look.hair };
    if (look.beard && this.bones.Head) this.addBeard(look);
    if (look.elfEars && this.bones.Head) this.addElfEars(look);
    if ((look.sunglasses || look.glasses) && this.bones.Head) this.addSunglasses(look);
    if (look.vikingHat && this.bones.Head) this.addVikingHat(look);
    if (look.tattoos) this.addTattoos(look);
    if (look.grin && this.bones.Head) this.addGrin(look);
    if (!look.hairStyle && look.bangs && this.bones.Head) look = { ...look, hairStyle: 'model' }; // just the fringe
    if (!look.hairStyle || !this.bones.Head) return;
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;            // approx. head radius
    const g = new THREE.Group();
    const col = look.hairStyleColor || look.hair || '#3a2414';
    const hm = new THREE.MeshStandardMaterial({ color: col, roughness: 1, flatShading: true });
    const style = look.hairStyle;
    if (style === 'dreads') {
      if (!dreadGeo) { dreadGeo = new THREE.CylinderGeometry(0.015, 0.011, 1, 5); dreadGeo.translate(0, -0.5, 0); }
      const n = 22;
      const thick = look.dreadThick || 1;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.3 + (i / (n - 1)) * Math.PI * 1.4; // around sides & back, open at the face
        // matted dreads: uneven lengths, some grown together into fat clumps
        const clump = look.matted && Math.random() < 0.3 ? 1.8 : 1;
        const dl = (look.dreadLength || 0.34) * (look.matted ? 0.7 + Math.random() * 0.55 : 0.75 + Math.random() * 0.5);
        const d = new THREE.Mesh(dreadGeo, hm);
        const w = thick * clump * (look.matted ? 0.8 + Math.random() * 0.5 : 1);
        d.scale.set(w, dl, w);
        const sx = Math.sin(a), sz = Math.cos(a);
        d.position.set(sx * r * 1.0, len * (0.55 + 0.12 * Math.abs(sz)), sz * r * 1.0);
        const mess = look.matted ? (Math.random() - 0.5) * 0.3 : 0;
        d.rotation.set(sz * 0.28 + mess, 0, -sx * 0.28 + mess); // hang slightly outwards
        d.castShadow = true;
        g.add(d);
      }
      // a few short stubborn ones sticking up on top of the head
      if (look.matted) {
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          const d = new THREE.Mesh(dreadGeo, hm);
          d.scale.set(thick, 0.05 + Math.random() * 0.04, thick);
          d.position.set(Math.sin(a) * r * 0.45, len * 0.95, Math.cos(a) * r * 0.45 - r * 0.15);
          d.rotation.set(Math.PI - Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3); // sticking out sideways
          g.add(d);
        }
      }
      // wrap / beads
      if (look.beads) {
        for (let i = 0; i < 6; i++) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshStandardMaterial({ color: ['#e74c3c', '#f1c40f', '#1abc9c'][i % 3] }));
          const a = Math.PI * 0.5 + i * 0.35;
          b.position.set(Math.sin(a) * r * 1.05, len * 0.35, Math.cos(a) * r * 1.05);
          g.add(b);
        }
      }
    } else if (style === 'long') {
      if (!strandGeo) { strandGeo = new THREE.BoxGeometry(1, 1, 1); strandGeo.translate(0, -0.5, 0); }
      const back = new THREE.Mesh(strandGeo, hm);
      back.scale.set(r * 2.1, look.hairLength || 0.42, r * 0.7);
      back.position.set(0, len * 0.75, -r * 0.55);
      back.castShadow = true;
      g.add(back);
      for (const s of [-1, 1]) {
        const side = new THREE.Mesh(strandGeo, hm);
        side.scale.set(r * 0.45, (look.hairLength || 0.42) * 0.8, r * 1.2);
        side.position.set(s * r * 0.95, len * 0.7, -r * 0.1);
        g.add(side);
      }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm);
      cap.position.set(0, len * 0.55, -r * 0.08);
      g.add(cap);
      // coloured strands (e.g. blond with pink/blue/purple streaks)
      (look.hairStreaks || []).forEach((c, i, arr) => {
        const sm = new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true });
        const x = (i - (arr.length - 1) / 2) * r * 0.62;
        const st = new THREE.Mesh(strandGeo, sm);
        st.scale.set(r * 0.13, (look.hairLength || 0.42) * (0.75 + (i % 2) * 0.2), r * 0.1);
        st.position.set(x, len * 0.76, -r * 0.91);
        g.add(st);
        const sd = new THREE.Mesh(strandGeo, sm);
        sd.scale.set(r * 0.12, (look.hairLength || 0.42) * 0.7, r * 0.3);
        sd.position.set((i % 2 ? 1 : -1) * r * 1.2, len * 0.7, -r * 0.1 + i * r * 0.15);
        g.add(sd);
      });
    } else if (style === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 8, 6), hm);
      bun.position.set(0, len * 1.02, -r * 0.35);
      g.add(bun);
    } else if (style === 'mohawk') {
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), hm);
        sp.position.set(0, len * 0.95, r * 0.6 - i * r * 0.28);
        sp.rotation.x = -0.3 + i * 0.12;
        g.add(sp);
      }
    } else if (style === 'pigtails') {
      for (const sd of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.ConeGeometry(r * 0.38, look.hairLength || 0.3, 7), hm);
        tail.position.set(sd * r * 1.3, len * 0.3, -r * 0.25);
        tail.rotation.set(Math.PI - 0.15, 0, sd * -0.3); // hang down, flare out a little
        tail.castShadow = true;
        g.add(tail);
        const tie = new THREE.Mesh(new THREE.TorusGeometry(r * 0.2, 0.012, 4, 10), new THREE.MeshStandardMaterial({ color: look.tieColor || '#7fd0ff' }));
        tie.position.set(sd * r * 1.2, len * 0.52, -r * 0.25);
        tie.rotation.z = Math.PI / 2;
        g.add(tie);
      }
    } else if (style === 'ponytail') {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.1, look.hairLength || 0.3, 6), hm);
      tail.position.set(0, len * 0.35, -r * 1.05);
      tail.rotation.x = 0.35;
      tail.castShadow = true;
      g.add(tail);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(r * 0.24, 0.012, 4, 10), new THREE.MeshStandardMaterial({ color: '#222' }));
      tie.position.set(0, len * 0.5, -r * 1.0);
      tie.rotation.x = Math.PI / 2 + 0.35;
      g.add(tie);
    } else if (style === 'curly') {
      // big curly mane: a cap plus lots of little curls around the sides and the back, down to the shoulders
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), hm);
      cap.position.set(0, len * 0.55, -r * 0.08);
      g.add(cap);
      const curl = new THREE.IcosahedronGeometry(r * 0.3, 0);
      const drop = look.hairLength || 0.32;
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 70; i++) {
        const a = Math.PI * 0.35 + rnd() * Math.PI * 1.3;          // sides & back, face stays free
        const y = len * 0.8 - rnd() * (drop + len * 0.3);
        const rr = r * (1.05 + rnd() * 0.25) * (y < len * 0.2 ? 1.1 : 1);
        const c = new THREE.Mesh(curl, hm);
        c.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr - r * 0.1);
        c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        c.castShadow = true;
        g.add(c);
      }
      for (let i = 0; i < 14; i++) { // curls on top
        const a = rnd() * Math.PI * 2, rr = r * rnd() * 0.9;
        const c = new THREE.Mesh(curl, hm);
        c.position.set(Math.sin(a) * rr, len * 0.95 + rnd() * 0.03, Math.cos(a) * rr - r * 0.1);
        g.add(c);
      }
    } else if (style === 'short') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.47), hm);
      cap.position.set(0, len * 0.5, -r * 0.05);
      g.add(cap);
    }
    if (look.bangs) { // a fringe across the forehead, ending just above the eyes
      const fr = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, r * 0.34, r * 0.3), hm);
      fr.position.set(0, len * 0.6, r * 0.88);
      fr.rotation.x = 0.25;
      fr.castShadow = true;
      g.add(fr);
    }
    if (look.headband) {
      const hb = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.012, 4, 16), new THREE.MeshStandardMaterial({ color: look.headband }));
      hb.rotation.x = Math.PI / 2;
      hb.position.y = len * 0.62;
      g.add(hb);
    }
    this.attachToBone('Head', g);
  }

  /** Beard on the jaw: 'short' (stubble-ish, trimmed) or 'full'. */
  addBeard(look) {
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;
    const g = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: look.beardColor || look.hair || '#2a2018', roughness: 1, flatShading: true });
    const full = look.beard === 'full';
    if (look.beard === 'moustache') { // just a proper moustache
      const mo = new THREE.Mesh(new THREE.BoxGeometry(r * 0.85, r * 0.14, r * 0.14), bm);
      mo.position.set(0, len * 0.27, r * ((look.beardZ ?? 0.6) + 0.66));
      g.add(mo);
      for (const s of [-1, 1]) { const tip = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.24, r * 0.1), bm); tip.position.set(s * r * 0.44, len * 0.22, r * ((look.beardZ ?? 0.6) + 0.6)); g.add(tip); }
      this.attachToBone('Head', g);
      return;
    }
    // jaw / chin
    const chin = new THREE.Mesh(new THREE.SphereGeometry(r * 0.78, 10, 7, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), bm);
    chin.scale.set(1.0, full ? 1.1 : 0.7, 0.95);
    chin.position.set(0, len * (full ? 0.2 : 0.2), r * (look.beardZ ?? 0.6));
    g.add(chin);
    // moustache
    const mo = new THREE.Mesh(new THREE.BoxGeometry(r * 0.6, r * 0.09, r * 0.1), bm);
    mo.position.set(0, len * 0.27, r * ((look.beardZ ?? 0.6) + 0.66));
    g.add(mo);
    if (full) {
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(r * 0.4, r * 0.7, 7), bm);
      tuft.rotation.x = Math.PI;
      tuft.position.set(0, len * -0.02, r * ((look.beardZ ?? 0.6) + 0.35));
      g.add(tuft);
    }
    this.attachToBone('Head', g);
  }

  /** Pointy elf ears. */
  addElfEars(look) {
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;
    const g = new THREE.Group();
    const em = new THREE.MeshStandardMaterial({ color: look.skin || '#e0b48a', roughness: 0.8, flatShading: true });
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(r * 0.2, r * 0.95, 5), em);
      ear.position.set(s * r * 1.02, len * 0.5, -r * 0.05);
      ear.rotation.set(-0.3, 0, -s * 1.05); // pointing up & outwards
      g.add(ear);
    }
    this.attachToBone('Head', g);
  }

  /** Dark sunglasses: two lenses and a bridge in front of the eyes. */
  /** A big, permanent grin: teeth in a wide smile, rosy cheeks. */
  addGrin(look) {
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;
    const g = new THREE.Group();
    const y = len * (look.grinY ?? 0.2), z = r * (look.grinZ ?? 1.12);
    const teeth = new THREE.Mesh(new THREE.CircleGeometry(r * 0.42, 14, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color: '#fbf6ee', roughness: 0.5, side: THREE.DoubleSide }));
    teeth.position.set(0, y + r * 0.06, z);
    teeth.scale.y = 0.6;
    g.add(teeth);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.42, r * 0.05, 4, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#b04a4a', roughness: 0.7 }));
    lip.rotation.z = Math.PI; // lower half = smile
    lip.scale.y = 0.6;
    lip.position.set(0, y + r * 0.06, z + r * 0.01);
    g.add(lip);
    for (const s of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(r * 0.17, 8, 6), new THREE.MeshStandardMaterial({ color: '#f0a0a0', roughness: 0.9 }));
      cheek.scale.set(1, 0.7, 0.35);
      cheek.position.set(s * r * 0.55, y + r * 0.32, z - r * 0.12);
      g.add(cheek);
    }
    this.attachToBone('Head', g);
  }

  addSunglasses(look) {
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;
    const g = new THREE.Group();
    const lm = look.sunglasses
      ? new THREE.MeshStandardMaterial({ color: look.sunglasses === true ? '#0c0c10' : look.sunglasses, roughness: 0.15, metalness: 0.6 })
      : new THREE.MeshStandardMaterial({ color: look.glasses === true ? '#3a2a22' : look.glasses, roughness: 0.4, metalness: 0.3 });
    const clear = !look.sunglasses; // normal glasses: thin frame around see-through lenses
    const gm = clear ? new THREE.MeshStandardMaterial({ color: '#bfe6ff', roughness: 0.1, transparent: true, opacity: 0.25 }) : lm;
    const y = len * (look.glassesY ?? 0.42), z = r * (look.glassesZ ?? 1.2);
    if (look.glassesSpecial) { // big round glowing rainbow-tinted specs
      const fm = new THREE.MeshStandardMaterial({ color: look.glassesSpecial, emissive: look.glassesSpecial, emissiveIntensity: 0.7, roughness: 0.3 });
      const lensM = new THREE.MeshStandardMaterial({ color: '#ff9be8', emissive: '#7a3cff', emissiveIntensity: 0.35, roughness: 0.1, transparent: true, opacity: 0.4 });
      for (const s of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.34, r * 0.34, r * 0.05, 16), lensM);
        lens.rotation.x = Math.PI / 2; lens.position.set(s * r * 0.36, y, z); g.add(lens);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.34, r * 0.045, 6, 18), fm);
        ring.position.set(s * r * 0.36, y, z); g.add(ring);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(r * 0.04, r * 0.06, r * 0.9), fm);
        arm.position.set(s * r * 0.72, y + r * 0.02, z - r * 0.45); g.add(arm);
      }
      const br = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.05, r * 0.05), fm);
      br.position.set(0, y + r * 0.05, z); g.add(br);
      this.attachToBone('Head', g);
      return;
    }
    for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.3, r * 0.06), gm);
      lens.position.set(s * r * 0.3, y, z);
      g.add(lens);
      if (clear) {
        const fr = (w, h, x, yy) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, r * 0.07), lm); f.position.set(s * r * 0.3 + x, y + yy, z); g.add(f); };
        fr(r * 0.56, r * 0.05, 0, r * 0.16); fr(r * 0.56, r * 0.05, 0, -r * 0.16); fr(r * 0.05, r * 0.32, r * 0.27, 0); fr(r * 0.05, r * 0.32, -r * 0.27, 0);
      }
      const arm = new THREE.Mesh(new THREE.BoxGeometry(r * 0.04, r * 0.06, r * 0.9), lm);
      arm.position.set(s * r * 0.56, y + r * 0.05, z - r * 0.45);
      g.add(arm);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(r * 0.2, r * 0.05, r * 0.05), lm);
    bridge.position.set(0, y + r * 0.08, z);
    g.add(bridge);
    this.attachToBone('Head', g);
  }

  /** A (very unhistorical) viking helmet with horns. */
  addVikingHat(look) {
    this.root.updateMatrixWorld(true);
    const { len } = this.headInfo();
    const r = len * 0.42;
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: '#6f747c', metalness: 0.5, roughness: 0.45, flatShading: true });
    const horn = new THREE.MeshStandardMaterial({ color: '#efe4c4', roughness: 0.6, flatShading: true });
    const y0 = len * 0.55;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel);
    dome.position.y = y0;
    g.add(dome);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.28, r * 0.1, 6, 18), steel);
    brim.rotation.x = Math.PI / 2;
    brim.position.y = y0 + r * 0.04;
    g.add(brim);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.14, r * 2.6), steel);
    ridge.position.y = y0 + r * 1.2;
    ridge.scale.y = 0.6;
    g.add(ridge);
    for (const s of [-1, 1]) {
      // two segments per horn: out, then up
      const h1 = new THREE.Mesh(new THREE.ConeGeometry(r * 0.2, r * 0.7, 8), horn);
      h1.position.set(s * r * 1.45, y0 + r * 0.45, 0);
      h1.rotation.z = -s * 1.2;
      g.add(h1);
      const h2 = new THREE.Mesh(new THREE.ConeGeometry(r * 0.13, r * 0.6, 8), horn);
      h2.position.set(s * r * 1.82, y0 + r * 0.85, 0);
      h2.rotation.z = -s * 0.35;
      g.add(h2);
    }
    this.attachToBone('Head', g);
  }

  /** Tattoos: dark bands and patches on both arms. */
  addTattoos(look) {
    this.model.updateMatrixWorld(true);
    const rootInv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const at = (b) => this.bones[b]?.getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv);
    const tm = new THREE.MeshStandardMaterial({ color: look.tattooColor || '#1c2838', roughness: 0.9 });
    const up = new THREE.Vector3(0, 1, 0);
    for (const s of ['L', 'R']) {
      for (const [from, to, rings] of [[`UpperArm${s}`, `LowerArm${s}`, [0.55, 0.7]], [`LowerArm${s}`, `Wrist${s}`, [0.3, 0.45, 0.75]]]) {
        const a = at(from), b = at(to);
        if (!a || !b) continue;
        const dir = b.clone().sub(a);
        const segLen = dir.length();
        dir.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
        for (const f of rings) {
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), tm);
          const rad = segLen * (from.startsWith('Upper') ? 0.17 : 0.15) * (1 - f * 0.15);
          ring.scale.set(rad, segLen * 0.07, rad);
          ring.quaternion.copy(q);
          const off = a.clone().lerp(b, f).sub(at(from));
          ring.position.copy(off);
          const g = new THREE.Group();
          g.add(ring);
          this.attachToBone(from, g);
        }
      }
    }
  }

  addExtras(look) {
    const extras = look.extras || [];
    if (extras.includes('bubbleWand')) {
      // a soap bubble wand: stick + ring, held in the right hand
      const w = new THREE.Group();
      w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 5), new THREE.MeshStandardMaterial({ color: '#e84a8a' })).translateY(0.13));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14), new THREE.MeshStandardMaterial({ color: '#5ad1ff' }));
      ring.position.y = 0.3;
      w.add(ring);
      w.rotation.x = -0.6;
      this.bubbleWand = this.attachToBone('WristR', w, new THREE.Vector3(0, -0.02, 0.04));
      this.bubbleTip = ring;
    }
    if (extras.includes('pennyboard')) {
      // pennyboard carried under the arm
      const bd = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.7), new THREE.MeshStandardMaterial({ color: '#e0457b', flatShading: true }));
      bd.add(deck);
      const wm = new THREE.MeshStandardMaterial({ color: '#f2e6c0', flatShading: true });
      for (const [x, z] of [[-0.08, -0.26], [0.08, -0.26], [-0.08, 0.26], [0.08, 0.26]]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), wm);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, -0.04, z);
        bd.add(w);
      }
      bd.rotation.set(0.15, 0, 1.3);
      this.attachToBone('WristL', bd, new THREE.Vector3(0, -0.1, 0.03));
    }
    if (extras.includes('bottle')) {
      const b = Assets.model('bottle', { height: 0.24 });
      b.position.set(0, -0.05, 0.02);
      b.rotation.x = -0.2;
      this.bottle = this.attachToBone('WristR', b, new THREE.Vector3(0, -0.04, 0.03));
    }
    if (extras.includes('suspenders')) {
      const strapMat = new THREE.MeshStandardMaterial({ color: look.strapColor || '#4a3a2a' });
      const g = new THREE.Group();
      for (const s of [-1, 1]) {
        for (const z of [0.1, -0.1]) {
          const st = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.012), strapMat);
          st.position.set(s * 0.07, -0.12, z);
          st.rotation.z = s * 0.06;
          g.add(st);
        }
      }
      this.attachToBone('Chest', g);
    }
    if (look.shirtPrint) this.addShirtPrint(look.shirtPrint, look.printColor || '#ffd21f');
    if (extras.includes('glitter') && this.bones.Head) {
      // glitter on the cheeks (Annika's styling): a few tiny sparkly bits
      const g = new THREE.Group();
      const gm = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: look.glitter || '#ff7ad9', emissiveIntensity: 0.9, metalness: 0.8, roughness: 0.2 });
      const geo = new THREE.OctahedronGeometry(0.008);
      for (let i = 0; i < 14; i++) {
        const s = i % 2 ? 1 : -1;
        const m = new THREE.Mesh(geo, gm);
        m.position.set(s * (0.035 + Math.random() * 0.03), 0.04 + Math.random() * 0.04, 0.085 + Math.random() * 0.01);
        g.add(m);
      }
      this.attachToBone('Head', g);
    }
    if (extras.includes('scarf')) {
      const sc = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 5, 10), new THREE.MeshStandardMaterial({ color: look.scarf || '#b03060', flatShading: true }));
      sc.rotation.x = Math.PI / 2;
      this.attachToBone('Neck', sc, new THREE.Vector3(0, 0.02, 0.01));
    }
    if (extras.includes('pendant')) {
      // spiritual jewellery: thin cord around the neck + wooden hexagon pendant with a moonstone
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.006, 4, 14), new THREE.MeshStandardMaterial({ color: '#2a1a12' }));
      cord.rotation.x = Math.PI / 2 - 0.5;
      this.attachToBone('Neck', cord, new THREE.Vector3(0, -0.02, 0.03));
      const p = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 6), new THREE.MeshStandardMaterial({ color: '#6a3a1e', flatShading: true }));
      disc.rotation.x = Math.PI / 2;
      p.add(disc);
      const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), new THREE.MeshStandardMaterial({ color: look.stoneColor || '#bfe6ff', emissive: look.stoneColor || '#5a9ad0', emissiveIntensity: 0.4, roughness: 0.2 }));
      stone.position.z = 0.01;
      p.add(stone);
      this.attachToBone('Chest', p, new THREE.Vector3(0, look.pendantY ?? 0.08, look.pendantZ ?? 0.15));
    }
  }

  /** Text print on the shirt (front small, back big) — e.g. SECURITY. */
  addShirtPrint(text, color) {
    const mk = (w, h, font) => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 68);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.9 }));
    };
    const g = new THREE.Group();
    g.scale.set(this.look.width || 1, 1, this.look.width || 1);
    const f = this.printFront = mk(0.2, 0.05, 'bold 88px sans-serif');
    f.position.set(0, this.look.printY ?? 0, this.look.printZ ?? 0.15);
    g.add(f);
    const b = mk(0.3, 0.075, 'bold 96px sans-serif');
    b.position.set(0, (this.look.printY ?? 0) + 0.03, -(this.look.printZ ?? 0.15) + 0.005);
    b.rotation.y = Math.PI;
    g.add(b);
    this.attachToBone('Chest', g);
  }

  play(name, fade = 0.2, { once = false, timeScale = 1 } = {}) {
    const a = this.actions[name] || this.actions.idle;
    if (!a || (this.current === a && !once)) { if (a) a.timeScale = timeScale; return; }
    a.reset();
    a.timeScale = timeScale;
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.enabled = true;
    if (this.current) this.current.crossFadeTo(a, fade, false);
    a.play();
    this.current = a;
    this.currentName = name;
  }

  get position() { return this.root.position; }

  /** Smoothly turn to face a heading (radians). */
  turnTo(heading, dt, speed = 10) {
    let d = heading - this.root.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.root.rotation.y += d * Math.min(1, dt * speed);
  }

  faceTowards(p, dt, speed = 8) {
    this.turnTo(Math.atan2(p.x - this.root.position.x, p.z - this.root.position.z), dt, speed);
  }

  setSitting(v, ground = false) {
    if (v === this.sitting) return;
    this.sitting = v;
    if (v) {
      this.standY = this.model.position.y;
      this.sitBaseY = this.standY - (ground ? 0.8 : 0.42) * ((this.look.height || 1.8) / 1.8);
      this.play('neutral', 0.2);
    } else if (this.standY != null) this.model.position.y = this.standY;
  }

  /** A short nod (layered over whatever animation runs). */
  nod() { this.nodT = 0.7; }

  /** Tilt the head forward/back by `ang` after the mixer ran (restores itself if the clip doesn't key the head). */
  headTilt(ang) {
    const h = this.bones.Head;
    if (!h) return;
    const st = (this._headOv ||= { set: new THREE.Quaternion(), base: new THREE.Quaternion(), on: false });
    if (st.on && h.quaternion.equals(st.set)) h.quaternion.copy(st.base);
    else st.base.copy(h.quaternion);
    st.on = ang !== 0;
    if (!st.on) return;
    h.rotateX(ang);
    st.set.copy(h.quaternion);
  }

  update(dt) {
    this.mixer.update(dt);
    if (this.nodT > 0 || this._headOv?.on) {
      this.nodT = Math.max(0, (this.nodT || 0) - dt);
      this.headTilt(this.nodT > 0 ? Math.sin((1 - this.nodT / 0.7) * Math.PI * 2) * 0.28 : 0);
    }
    if (!this.ride && this._torsoSet) { // got off: straighten up again
      const torso = this.bones.Torso;
      if (torso?.quaternion.equals(this._torsoSet)) torso.quaternion.copy(this._torsoBase);
      this._torsoSet = null;
    }
    if (this.ride) this.applyRidePose();
    else if (this.sitting) this.applySitPose();
    else if (this.carrying) this.applyCarryPose();
    else if (this.work) this.applyWorkPose(dt);
    else if (this.armPose) this.applyArmPose();
    else if (this.flowToy) this.applyFlowPose(dt);
  }

  // ------------------------------------------------------------------ work with tools (instead of the waving 'interact' clip)
  /** 'hammer' | 'shovel' | 'saw' | 'drill' | 'measure' | null – a tool in the hands and a looping work motion. */
  setWork(kind) {
    if (kind === (this.work?.kind || null)) return;
    if (this.work) { this.root.remove(this.work.group); this.work = null; }
    if (!kind) return;
    this.work = buildWorkTool(kind);
    this.workT = Math.random() * 5;
    this.root.add(this.work.group);
  }

  applyWorkPose(dt) {
    const w = this.work;
    const t = (this.workT += dt);
    const k = (this.look.height || 1.8) / 1.8;
    const root = this.root;
    root.updateMatrixWorld(true);
    const W = (x, y, z) => root.localToWorld(_b1.set(x, y, z));
    const tool = w.tool;
    if (w.kind === 'hammer') {
      // swing up, strike down onto the nail held by the other hand
      const up = Math.pow((Math.sin(t * 5.5) + 1) / 2, 1.5);
      tool.position.set(-0.2, (0.92 + 0.38 * up) * k, 0.45 - 0.1 * up);
      tool.rotation.set(-0.15 - up * 1.3, 0, 0);
      this.reachArm('R', W(-0.2, (0.92 + 0.38 * up) * k, 0.45 - 0.1 * up));
      this.reachArm('L', W(0.08, 0.86 * k, 0.52));
    } else if (w.kind === 'shovel') {
      // push the blade in, lift, toss to the side
      const c = (t * 0.8) % 1;
      const lift = c < 0.45 ? 0 : c < 0.8 ? (c - 0.45) / 0.35 : 1 - (c - 0.8) / 0.2;
      const toss = c > 0.75 ? (c - 0.75) / 0.25 : 0;
      const top = _b2.set(-0.02, (0.98 + lift * 0.12) * k, 0.18);
      const blade = new THREE.Vector3(0.05 + toss * 0.45, 0.06 + lift * 0.5, 0.85 - lift * 0.2 - c * 0.05 * (1 - lift));
      tool.position.copy(top);
      tool.quaternion.setFromUnitVectors(_Z, blade.clone().sub(top).normalize());
      const mid = top.clone().lerp(blade, 0.42);
      this.reachArm('L', W(top.x + 0.04, top.y, top.z));
      this.reachArm('R', W(mid.x - 0.05, mid.y, mid.z));
    } else if (w.kind === 'saw') {
      // saw back and forth across a plank
      const s = Math.sin(t * 9);
      tool.position.set(-0.12, 0.84 * k, 0.4 + 0.14 * s);
      tool.rotation.set(0.45, 0, 0);
      this.reachArm('R', W(-0.12, 0.84 * k, 0.4 + 0.14 * s));
      this.reachArm('L', W(0.22, 0.8 * k, 0.48));
    } else if (w.kind === 'drill') {
      // screwing something in above the head – the drill buzzes
      const buzz = Math.sin(t * 45) * 0.006;
      tool.position.set(-0.08 + buzz, 1.48 * k, 0.4);
      tool.rotation.set(-0.5, 0, 0);
      this.reachArm('R', W(-0.08 + buzz, 1.48 * k, 0.4));
      this.reachArm('L', W(0.12, 1.5 * k, 0.45));
    } else if (w.kind === 'measure') {
      // pull out the tape measure, read it, let it snap back
      const a = (Math.sin(t * 1.3) + 1) / 2;
      const lx = 0.12 + 0.3 * a, rx = -0.12 - 0.3 * a;
      tool.position.set(lx, 0.98 * k, 0.45);
      w.tape.position.set((lx + rx) / 2, 0.98 * k, 0.45);
      w.tape.scale.x = Math.max(0.01, lx - rx);
      this.reachArm('L', W(lx, 0.98 * k, 0.45));
      this.reachArm('R', W(rx, 0.98 * k, 0.45));
    }
  }

  /** Arms to two points in the character's local space (fun moves: cheering, spinning, stretching). */
  applyArmPose() {
    const p = this.armPose, k = (this.look.height || 1.8) / 1.8;
    this.root.updateMatrixWorld(true);
    if (p.L) this.reachArm('L', this.root.localToWorld(_b1.set(p.L[0], p.L[1] * k, p.L[2])));
    if (p.R) this.reachArm('R', this.root.localToWorld(_b1.set(p.R[0], p.R[1] * k, p.R[2])));
  }

  // ------------------------------------------------------------------ flow toys (fire space crew)
  /** 'staff' (contact staff), 'spear' (fire spear: staff with one torch end), 'poi', 'hoop' or null. */
  setFlow(type) {
    if (type === (this.flowToy?.type || null)) return;
    if (this.flowToy) { this.root.remove(this.flowToy.group); this.flowToy = null; }
    if (!type) return;
    this.flowToy = buildFlowToy(type);
    this.flowT = Math.random() * 20;
    this.root.add(this.flowToy.group);
  }

  /** LEDs by day, real fire at night. */
  setFlowFire(on) {
    if (!this.flowToy || this.flowToy.fireOn === on) return;
    this.flowToy.fireOn = on;
    this.flowToy.flames.forEach((f) => { f.visible = on; });
  }

  /** Two-bone arm IK: put the wrist at `target` (world), elbow bending down/back. */
  reachArm(side, target) {
    const b = this.bones;
    const up = b[`UpperArm${side}`], low = b[`LowerArm${side}`], wrist = b[`Wrist${side}`];
    if (!up || !low || !wrist) return;
    up.updateWorldMatrix(true, true);
    const S = up.getWorldPosition(_a1), E0 = low.getWorldPosition(_a2), W0 = wrist.getWorldPosition(_a3);
    const l1 = S.distanceTo(E0), l2 = E0.distanceTo(W0);
    const dir = _a4.subVectors(target, S);
    const d = Math.max(0.05, Math.min(dir.length(), (l1 + l2) * 0.999));
    dir.normalize();
    const rq = this.root.getWorldQuaternion(_q4);
    const pole = _a5.set(side === 'L' ? 0.5 : -0.5, -1, -0.4).applyQuaternion(rq);
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
    const hgt = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const elbow = _a6.copy(S).addScaledVector(dir, a).addScaledVector(pole, hgt);
    this.aimBone(up, low, _a7.subVectors(elbow, S).normalize());
    low.updateWorldMatrix(true, true);
    const E1 = low.getWorldPosition(_a2);
    this.aimBone(low, wrist, _a7.subVectors(target, E1).normalize());
  }

  applyFlowPose(dt) {
    const toy = this.flowToy;
    const t = (this.flowT += dt);
    const k = (this.look.height || 1.8) / 1.8;
    const root = this.root;
    root.updateMatrixWorld(true);
    const W = (x, y, z) => root.localToWorld(_b1.set(x, y, z));
    if (toy.type === 'staff' || toy.type === 'spear') {
      // contact staff / fire spear: windmill spins in front of the body, rolling from side to side
      const cx = Math.sin(t * 0.9) * 0.22, cy = 1.28 * k + Math.sin(t * 1.7) * 0.08, cz = 0.5;
      const a = t * 4.6;
      toy.rig.position.set(cx, cy, cz);
      toy.rig.rotation.set(0, Math.sin(t * 0.45) * 0.7, a);
      this.reachArm('R', W(cx + Math.cos(a) * 0.09, cy + Math.sin(a) * 0.09, cz - 0.08));
      this.reachArm('L', W(cx - 0.32 + Math.sin(t * 2) * 0.05, cy - 0.12, cz - 0.12));
    } else if (toy.type === 'poi') {
      // poi: split-time wheels, drifting between wheel plane and wall plane
      const m = 0.5 + 0.5 * Math.sin(t * 0.35);
      const a = t * 5.2;
      toy.sides.forEach((sd, i) => {
        const s = i ? 1 : -1;
        const ang = a + (i ? Math.PI : 0);
        const hx = s * 0.3 + s * m * Math.cos(ang) * 0.12, hy = 1.2 * k + Math.sin(ang) * 0.12, hz = 0.35 + (1 - m) * Math.cos(ang) * 0.12;
        const pa = ang + 0.35;
        const px = hx + s * m * Math.cos(pa) * 0.55, py = hy + Math.sin(pa) * 0.55, pz = hz + (1 - m) * Math.cos(pa) * 0.55;
        sd.head.position.set(px, py, pz);
        const pos = sd.line.geometry.attributes.position;
        pos.setXYZ(0, hx, hy, hz); pos.setXYZ(1, px, py, pz); pos.needsUpdate = true;
        this.reachArm(i ? 'L' : 'R', W(hx, hy, hz));
      });
    } else if (toy.type === 'hoop') {
      // hoop around the waist, travelling up to the chest and back; arms up
      const a = t * 6.5;
      const y = (1.0 + Math.sin(t * 0.8) * 0.18) * k;
      toy.rig.position.set(Math.cos(a) * 0.1, y, Math.sin(a) * 0.1);
      toy.rig.rotation.set(0.18 * Math.sin(t * 0.8), -a, 0);
      this.reachArm('R', W(-0.22 + Math.sin(t * 1.3) * 0.08, 2.05 * k, 0.08));
      this.reachArm('L', W(0.22 + Math.sin(t * 1.1) * 0.08, 2.0 * k, 0.05));
    }
    // LEDs cycle colours; flames stay upright on the wicks
    const hue = (t * 0.15) % 1;
    toy.leds.forEach((m, i) => m.color.setHSL((hue + i * 0.33) % 1, 1, 0.55));
    if (toy.fireOn) {
      toy.group.updateMatrixWorld(true);
      toy.wicks.forEach((w, i) => {
        const f = toy.flames[i];
        root.worldToLocal(w.getWorldPosition(f.position));
        f.position.y += 0.02;
        const fl = 1 + Math.sin(t * 23 + i * 2.1) * 0.25;
        f.scale.set(1, fl, 1);
      });
    }
  }

  /** Both forearms forward, hands together in front of the belly – holding a box. */
  applyCarryPose() {
    const b = this.bones;
    this.root.updateMatrixWorld(true);
    const rq = this.root.getWorldQuaternion(_q4);
    for (const side of ['L', 'R']) {
      const up = b[`UpperArm${side}`], low = b[`LowerArm${side}`], wrist = b[`Wrist${side}`];
      if (!up || !low || !wrist) continue;
      const s = side === 'L' ? 1 : -1;
      this.aimBone(up, low, _v4.set(0.18 * s, -0.92, 0.25).normalize().applyQuaternion(rq));
      this.aimBone(low, wrist, _v4.set(-0.25 * s, -0.25, 1).normalize().applyQuaternion(rq));
    }
  }

  /** Rotate `bone` so the vector bone->child points along `dirWorld`. */
  aimBone(bone, child, dirWorld) {
    bone.updateWorldMatrix(true, true);
    const bp = bone.getWorldPosition(_v1), cp = child.getWorldPosition(_v2);
    const cur = _v3.subVectors(cp, bp).normalize();
    const q = _q1.setFromUnitVectors(cur, dirWorld);
    const bw = bone.getWorldQuaternion(_q2);
    const pw = bone.parent.getWorldQuaternion(_q3);
    bone.quaternion.copy(pw.invert().multiply(q).multiply(bw));
  }

  /** Two-bone IK for a leg: foot to `target` (world), knee bending towards `pole` (world direction). */
  reachLeg(side, target, pole) {
    const b = this.bones;
    const up = b[`UpperLeg${side}`], low = b[`LowerLeg${side}`], end = low?.children[0];
    if (!up || !low || !end) return;
    up.updateWorldMatrix(true, true);
    const S = up.getWorldPosition(_a1), K0 = low.getWorldPosition(_a2), F0 = end.getWorldPosition(_a3);
    const l1 = S.distanceTo(K0), l2 = K0.distanceTo(F0);
    const dir = _a4.subVectors(target, S);
    const d = Math.max(0.05, Math.min(dir.length(), (l1 + l2) * 0.999));
    dir.normalize();
    const pl = _a5.copy(pole);
    pl.addScaledVector(dir, -pl.dot(dir)).normalize();
    const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
    const hgt = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const knee = _a6.copy(S).addScaledVector(dir, a).addScaledVector(pl, hgt);
    this.aimBone(up, low, _a7.subVectors(knee, S).normalize());
    low.updateWorldMatrix(true, true);
    this.aimBone(low, end, _a7.subVectors(target, low.getWorldPosition(_a2)).normalize());
    // the foot mesh hangs on its own IK bone (child of Root), so carry it along to the ankle
    const foot = b[`Foot${side}`];
    if (foot) {
      low.updateWorldMatrix(true, true);
      foot.parent.updateWorldMatrix(true, false);
      foot.position.copy(foot.parent.worldToLocal(end.getWorldPosition(_a3)));
    }
  }

  /**
   * Riding a bike / scooter (`this.ride` = the vehicle): torso leans forward, hands on the grips,
   * feet on the pedals (they turn) or on the deck. Anchors come from the vehicle (`grips`, `pedals`).
   */
  applyRidePose() {
    const v = this.ride;
    if (this.sitting) this.model.position.y = this.sitBaseY;
    else if (this.standY != null) this.model.position.y = this.standY - 0.06; // knees a little soft
    this.root.updateMatrixWorld(true);
    v.body.updateMatrixWorld(true);
    const rq = this.root.getWorldQuaternion(_q4);
    // lean the upper body forward (about the rider's sideways axis)
    const torso = this.bones.Torso;
    if (torso) {
      // the idle clip doesn't key the torso: start from its own pose each frame, don't stack the lean
      if (this._torsoSet && torso.quaternion.equals(this._torsoSet)) torso.quaternion.copy(this._torsoBase);
      else (this._torsoBase ||= new THREE.Quaternion()).copy(torso.quaternion);
      torso.updateWorldMatrix(true, false);
      const q = _q1.setFromAxisAngle(_v4.set(1, 0, 0).applyQuaternion(rq), this.sitting ? 0.55 : 0.14);
      const bw = torso.getWorldQuaternion(_q2), pw = torso.parent.getWorldQuaternion(_q3);
      torso.quaternion.copy(pw.invert().multiply(q).multiply(bw));
      (this._torsoSet ||= new THREE.Quaternion()).copy(torso.quaternion);
    }
    if (v.grips) { this.reachArm('L', v.grips[0].getWorldPosition(_b1)); this.reachArm('R', v.grips[1].getWorldPosition(_b1)); }
    if (v.pedals) {
      const fwd = _b2.set(0, 0, 1).applyQuaternion(rq);
      this.reachLeg('L', v.pedals[0].getWorldPosition(_b1), fwd);
      this.reachLeg('R', v.pedals[1].getWorldPosition(_b1), fwd);
    }
  }

  /** Procedural sitting pose layered on top of the idle animation. */
  applySitPose() {
    const b = this.bones;
    this.model.position.y = this.sitBaseY;
    this.root.updateMatrixWorld(true);
    const rq = this.root.getWorldQuaternion(_q4);
    for (const side of ['L', 'R']) {
      const up = b[`UpperLeg${side}`], low = b[`LowerLeg${side}`];
      const end = low?.children[0];
      if (!up || !low || !end) continue;
      const s = side === 'L' ? 1 : -1;
      this.aimBone(up, low, _v4.set(0.12 * s, -0.05, 1).normalize().applyQuaternion(rq));
      this.aimBone(low, end, _v4.set(0.05 * s, -1, 0.12).normalize().applyQuaternion(rq));
    }
  }
}

const _Z = new THREE.Vector3(0, 0, 1);
let toolMats;
/** The tool meshes (all pointing along +z from the grip). */
function buildWorkTool(kind) {
  if (!toolMats) toolMats = {
    wood: new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.6, roughness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.6 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#f2c21a', roughness: 0.5 }),
    orange: new THREE.MeshStandardMaterial({ color: '#e8701a', roughness: 0.5 }),
  };
  const M = toolMats;
  const group = new THREE.Group();
  const tool = new THREE.Group();
  group.add(tool);
  const bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); tool.add(o); return o; };
  let tape = null;
  if (kind === 'hammer') {
    bx(0.03, 0.03, 0.32, M.wood, 0, 0, 0.14);
    bx(0.05, 0.13, 0.05, M.steel, 0, 0.02, 0.3);
  } else if (kind === 'shovel') {
    bx(0.035, 0.035, 0.95, M.wood, 0, 0, 0.47);
    bx(0.12, 0.03, 0.05, M.dark, 0, 0, -0.02);           // D-grip
    bx(0.24, 0.02, 0.28, M.steel, 0, 0, 1.06);           // blade
  } else if (kind === 'saw') {
    bx(0.04, 0.09, 0.12, M.wood, 0, 0, 0.02);            // handle
    bx(0.008, 0.11, 0.5, M.steel, 0, -0.03, 0.32);       // blade
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.22), M.wood);
    plank.position.set(0.05, 0.72, 0.5);
    group.add(plank);                                     // the plank being cut
  } else if (kind === 'drill') {
    bx(0.06, 0.12, 0.06, M.orange, 0, -0.06, 0);         // grip
    bx(0.07, 0.07, 0.2, M.orange, 0, 0.02, 0.06);        // body
    bx(0.012, 0.012, 0.12, M.steel, 0, 0.02, 0.21);      // bit
  } else if (kind === 'measure') {
    bx(0.08, 0.08, 0.04, M.yellow, 0, 0, 0);             // the case
    tape = new THREE.Mesh(new THREE.BoxGeometry(1, 0.008, 0.025), M.yellow);
    group.add(tape);
  }
  return { kind, group, tool, tape };
}

let flameGeo, wickGeo;
function buildFlowToy(type) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);
  const wicks = [], flames = [], leds = [], sides = [];
  if (!flameGeo) { flameGeo = new THREE.ConeGeometry(0.07, 0.3, 6); flameGeo.translate(0, 0.12, 0); wickGeo = new THREE.SphereGeometry(0.055, 8, 6); }
  const flameMat = new THREE.MeshBasicMaterial({ color: '#ff9a2a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const wick = (parent, x, y, z) => {
    const led = new THREE.MeshBasicMaterial({ color: '#ff3aa0' });
    leds.push(led);
    const w = new THREE.Mesh(wickGeo, led);
    w.position.set(x, y, z);
    parent.add(w);
    wicks.push(w);
    const f = new THREE.Mesh(flameGeo, flameMat);
    f.visible = false;
    group.add(f);
    flames.push(f);
  };
  const dark = new THREE.MeshStandardMaterial({ color: '#1e1e1e', roughness: 0.6 });
  if (type === 'staff') {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.5, 6), dark);
    st.rotation.z = Math.PI / 2;
    rig.add(st);
    for (const x of [-0.25, 0.25]) {
      const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
      tape.rotation.z = Math.PI / 2;
      tape.position.x = x;
      rig.add(tape);
    }
    wick(rig, -0.76, 0, 0); wick(rig, 0.76, 0, 0);
  } else if (type === 'spear') {
    // fire spear: like a contact staff, but only one end carries a (bigger) torch
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.6, 6), dark);
    st.rotation.z = Math.PI / 2;
    rig.add(st);
    const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 6), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
    tape.rotation.z = Math.PI / 2;
    rig.add(tape);
    wick(rig, 0.82, 0, 0);
    wicks[0].scale.setScalar(1.6);
  } else if (type === 'poi') {
    for (let i = 0; i < 2; i++) {
      const head = new THREE.Group();
      group.add(head);
      wick(head, 0, 0, 0);
      const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#dddddd' }));
      line.frustumCulled = false;
      group.add(line);
      sides.push({ head, line });
    }
  } else if (type === 'hoop') {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.014, 5, 36), new THREE.MeshStandardMaterial({ color: '#e0e0e0', roughness: 0.5 }));
    hoop.rotation.x = Math.PI / 2;
    rig.add(hoop);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 4), dark);
      sp.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
      sp.rotation.set(0, -a, Math.PI / 2);
      rig.add(sp);
      wick(rig, Math.cos(a) * 0.63, 0, Math.sin(a) * 0.63);
    }
  }
  return { type, group, rig, wicks, flames, leds, sides, fireOn: false };
}

const _a1 = new THREE.Vector3(), _a2 = new THREE.Vector3(), _a3 = new THREE.Vector3(), _a4 = new THREE.Vector3(), _a5 = new THREE.Vector3(), _a6 = new THREE.Vector3(), _a7 = new THREE.Vector3(), _b1 = new THREE.Vector3(), _b2 = new THREE.Vector3();
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _q4 = new THREE.Quaternion();
