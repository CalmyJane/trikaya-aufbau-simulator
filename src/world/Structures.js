import * as THREE from 'three';
import { mat, box, cyl, strut, signPost, beerBench } from './Props.js';
import { buildMainstage, buildShadeSails, buildKitchen } from './Mainstage.js';
import { buildKuenstlergasse, buildWaterTank, buildSauna } from './Structures3.js';
import { buildAwarenessTent, buildForestDome, buildMappingDeco, buildWcContainer, buildDixiRow, buildFirespace, buildNarniaFloor, buildHammockForest, buildTechnoFloor, buildEntranceTent, buildMarket } from './Structures2.js';

// Registry of buildable structures. A quest's `build` effect references one of these by key.
// Each factory returns { object, colliders } in local space (plot centre = origin, +z = front).
// Colliders: { type:'circle', x, z, r } | { type:'box', x, z, hw, hd, rot }
//
// To add a new buildable: add a function here, then reference it from a quest.
export const STRUCTURES = {
  chai_tent: buildChaiTent,
  planetarium_dome: buildDome,
  festzelt: buildFestzelt,
  party_tent: buildPartyTent,
  mainstage: buildMainstage,
  shade_sails: buildShadeSails,
  kitchen: buildKitchen,
  awareness_tent: buildAwarenessTent,
  forest_dome: buildForestDome,
  mapping_deco: buildMappingDeco,
  wc_container: buildWcContainer,
  dixi_row: buildDixiRow,
  firespace: buildFirespace,
  narnia_floor: buildNarniaFloor,
  hammock_forest: buildHammockForest,
  techno_floor: buildTechnoFloor,
  entrance_tent: buildEntranceTent,
  market: buildMarket,
  kuenstlergasse: buildKuenstlergasse,
  water_tank: buildWaterTank,
  sauna: buildSauna,
};

export function buildStructure(type, params = {}) {
  const fn = STRUCTURES[type];
  if (!fn) throw new Error(`Unknown structure type "${type}"`);
  const res = fn(params);
  res.object.traverse((o) => {
    if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; }
  });
  return res;
}

// ------------------------------------------------------------ Chai Lounge stretch tent
/**
 * The chai lounge – a permanent construction site. Lots of people, lots of "work", never finished.
 * Stage 0: poles and fabric lying around. Stage 1: the tent finally stands… empty, furniture still in boxes.
 */
function buildChaiTent() {
  const g = new THREE.Group();
  const staged = [];
  const stageColliders = [];
  const colliders = [];
  const add = (o, min = 0, max = 9) => { o.userData.minStage = min; o.userData.maxStage = max; staged.push(o); g.add(o); return o; };
  const col = (c, min = 0, max = 9) => stageColliders.push({ ...c, minStage: min, maxStage: max });
  const W = 14, D = 10;
  const peaks = [[-3, 0, 5.2], [3, 0, 5.2]];
  const geo = new THREE.PlaneGeometry(W, D, 28, 20);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ex = Math.abs(x) / (W / 2), ez = Math.abs(z) / (D / 2);
    const edge = Math.max(ex, ez);
    let y = 2.4 - edge * 0.6;
    // corners pulled down, sides sag
    y -= Math.pow(ex * ez, 2) * 0.9;
    for (const [px, pz, ph] of peaks) {
      const d = Math.hypot(x - px, z - pz);
      y += (ph - 2.4) * Math.exp(-(d * d) / 5.5);
    }
    pos.setY(i, y);
  }
  geo.computeVertexNormals();
  const sailMat = new THREE.MeshStandardMaterial({ color: '#d9803c', roughness: 0.8, side: THREE.DoubleSide });
  add(new THREE.Mesh(geo, sailMat), 1);

  const pole = mat('#8b5e34');
  for (const [px, pz, ph] of peaks) {
    add(cyl(0.1, 0.12, ph, pole, 8, px, ph / 2, pz), 1);
    col({ type: 'circle', x: px, z: pz, r: 0.25 }, 1);
  }
  // edge poles + guy ropes
  const rope = mat('#d8cfb8');
  const edgePts = [[-7, -5], [0, -5], [7, -5], [-7, 5], [7, 5], [-7, 0], [7, 0]];
  for (const [x, z] of edgePts) {
    const h = 1.9 - (Math.abs(x) === 7 && Math.abs(z) === 5 ? 0.9 : 0);
    add(cyl(0.06, 0.07, h, pole, 6, x, h / 2, z), 1);
    col({ type: 'circle', x, z, r: 0.2 }, 1);
    const out = new THREE.Vector3(x * 1.25, 0, z * 1.35);
    add(strut(new THREE.Vector3(x, h, z), out, 0.015, rope, 4), 1);
  }

  // ---- stage 0: the site. One pole stands (since Monday), the rest lies in the grass.
  add(cyl(0.1, 0.12, 5.2, pole, 8, -3, 2.6, 0), 0, 0);
  col({ type: 'circle', x: -3, z: 0, r: 0.25 }, 0, 0);
  for (let i = 0; i < 6; i++) {
    const p = cyl(0.07, 0.08, 4.4 - (i % 3) * 0.6, pole, 6, 1.5 + (i % 2) * 0.3, 0.08 + i * 0.05, -2.2 + i * 0.35);
    p.rotation.z = Math.PI / 2;
    p.rotation.y = 0.1 * (i - 3);
    add(p, 0, 0);
  }
  // the tent itself, still rolled up
  const roll = cyl(0.55, 0.55, 3.2, mat('#d9803c'), 12, 2.5, 0.55, 2.8);
  roll.rotation.z = Math.PI / 2;
  add(roll, 0, 0);
  col({ type: 'box', x: 2.5, z: 2.8, hw: 1.6, hd: 0.6 }, 0, 0);
  // sawhorses with a plank (a "workbench") and a flipchart with "the vision"
  for (const x of [-5.6, -4.0]) {
    const h = new THREE.Group();
    for (const s of [-1, 1]) { const l = cyl(0.04, 0.04, 0.9, pole, 5, 0, 0.42, s * 0.18); l.rotation.x = s * 0.35; h.add(l); }
    h.add(box(0.1, 0.06, 0.4, pole, 0, 0.84, 0));
    h.position.set(x, 0, -3);
    add(h, 0, 0);
  }
  add(box(2.2, 0.05, 0.4, mat('#c8a46a'), -4.8, 0.9, -3), 0, 0);
  col({ type: 'box', x: -4.8, z: -3, hw: 1.2, hd: 0.3 }, 0, 0);
  const flip = new THREE.Group();
  for (const s of [-1, 1]) { const l = cyl(0.025, 0.025, 1.7, pole, 5, s * 0.35, 0.85, 0); l.rotation.z = -s * 0.08; flip.add(l); }
  flip.add(box(0.8, 1.0, 0.03, mat('#f8f6f0'), 0, 1.3, 0.04));
  flip.add(box(0.5, 0.05, 0.01, mat('#e05a2a'), 0, 1.55, 0.06));
  flip.add(box(0.3, 0.05, 0.01, mat('#2a6ab0'), -0.05, 1.4, 0.06));
  flip.add(box(0.15, 0.15, 0.01, mat('#f1c40f'), 0.15, 1.15, 0.06));
  flip.position.set(-1, 0, -4.2);
  add(flip, 0, 0);

  // ---- always: crates, pallets, boxes of cushions nobody has opened
  const crateCols = ['#8a6a3a', '#7a5a30', '#9a7a4a'];
  const crates = [[5.5, 3.2], [6.2, 2.4], [5.6, 2.2], [-6.2, 3.4], [4.8, -3.8]];
  crates.forEach(([x, z], i) => {
    const c = box(0.8, 0.6, 0.6, mat(crateCols[i % 3]), x, 0.3 + (i === 2 ? 0.6 : 0), z);
    c.rotation.y = i * 0.4;
    g.add(c);
    if (i !== 2) colliders.push({ type: 'circle', x, z, r: 0.5 });
  });
  const pallet = box(1.2, 0.15, 0.8, mat('#b89a6a'), -6, 0.08, -1.5);
  g.add(pallet);
  // stage 1: everything for inside, still packed: rolled rugs, cushion boxes, the kettle in its box
  const rugCols = ['#8e2b3a', '#2e5d7a', '#b8872e', '#5b3a73'];
  rugCols.forEach((c, i) => {
    const r = cyl(0.22, 0.22, 2.4, mat(c), 10, -2 + i * 0.5, 0.22, 2.6 + (i % 2) * 0.1);
    r.rotation.z = Math.PI / 2;
    r.rotation.y = 0.15;
    add(r, 1);
  });
  for (let i = 0; i < 4; i++) add(box(0.9, 0.7, 0.9, mat('#c9a878'), 1.5 + (i % 2) * 1.0, 0.35 + Math.floor(i / 2) * 0.7, -1.8), 1);
  col({ type: 'box', x: 2, z: -1.8, hw: 1.0, hd: 0.5 }, 1);
  add(box(0.5, 0.5, 0.5, mat('#c9a878'), -1.2, 0.25, -1.4), 1);

  const signA = signPost('CHAI LOUNGE – BALD!', { width: 3.2, height: 0.9, bg: '#5b2c1d', fg: '#ffdca0' });
  signA.position.set(-5.5, 0, 6.5);
  add(signA, 0, 0);
  const signB = signPost('CHAI LOUNGE – FAST!', { width: 3.2, height: 0.9, bg: '#5b2c1d', fg: '#ffdca0' });
  signB.position.set(-5.5, 0, 6.5);
  add(signB, 1);

  const api = {
    stage: 0,
    setStage(n) {
      api.stage = n;
      for (const o of staged) o.visible = n >= o.userData.minStage && n <= o.userData.maxStage;
    },
    colliders(n) { return stageColliders.filter((c) => n >= c.minStage && n <= c.maxStage); },
  };
  api.setStage(0);
  g.userData.spots = { chai_site: [0, 1], chai_flip: [-1, -3.4] };
  return { object: g, colliders, api };
}

// ------------------------------------------------------------ Planetarium geodesic dome
function buildDome() {
  const g = new THREE.Group();
  const colliders = [];
  const R = 7.5;
  const ico = new THREE.IcosahedronGeometry(R, 2);
  const p = ico.attributes.position;
  const minY = -0.6;
  // collect triangles of upper hemisphere
  const keep = [];
  const edges = new Map();
  const key = (v) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
  for (let i = 0; i < p.count; i += 3) {
    const tri = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(p, i + k));
    if (tri.some((v) => v.y < minY)) continue;
    const c = tri[0].clone().add(tri[1]).add(tri[2]).divideScalar(3);
    // entrance: open triangles low on the +z side
    const isDoor = c.z > R * 0.72 && c.y < R * 0.4 && Math.abs(c.x) < R * 0.4;
    if (!isDoor) keep.push(...tri);
    for (let k = 0; k < 3; k++) {
      const a = tri[k], b = tri[(k + 1) % 3];
      const kk = [key(a), key(b)].sort().join('|');
      edges.set(kk, [a, b]);
    }
  }
  const skinGeo = new THREE.BufferGeometry().setFromPoints(keep);
  skinGeo.computeVertexNormals();
  const skin = new THREE.Mesh(skinGeo, new THREE.MeshStandardMaterial({
    color: '#f2efe6', roughness: 0.9, side: THREE.DoubleSide, flatShading: true,
  }));
  skin.position.y = -minY;
  g.add(skin);

  // struts as one instanced mesh
  const list = [...edges.values()];
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), mat('#9aa3ad', { metalness: 0.7, roughness: 0.3 }), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  list.forEach(([a, b], i) => {
    const d = b.clone().sub(a);
    const len = d.length();
    q.setFromUnitVectors(up, d.normalize());
    const mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(1.012);
    mid.y += -minY;
    m4.compose(mid, q, new THREE.Vector3(1, len, 1));
    im.setMatrixAt(i, m4);
  });
  im.castShadow = true;
  g.add(im);

  // dark inner projection surface – with the same opening as the door, so you can see the way out
  const innerGeo = new THREE.SphereGeometry(R * 0.96, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  {
    const ip = innerGeo.attributes.position, uv = innerGeo.attributes.uv;
    const pos = [], uvs = [];
    for (let i = 0; i < ip.count; i += 3) {
      let cx = 0, cy = 0, cz = 0;
      for (let k = 0; k < 3; k++) { cx += ip.getX(i + k) / 3; cy += ip.getY(i + k) / 3; cz += ip.getZ(i + k) / 3; }
      if (cz > R * 0.62 && cy < R * 0.45 && Math.abs(cx) < R * 0.42) continue; // door
      for (let k = 0; k < 3; k++) { pos.push(ip.getX(i + k), ip.getY(i + k), ip.getZ(i + k)); uvs.push(uv.getX(i + k), uv.getY(i + k)); }
    }
    innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    innerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    innerGeo.deleteAttribute('normal');
  }
  const inner = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({ map: starTexture(), side: THREE.BackSide }));
  inner.position.y = -minY - 0.2;
  inner.castShadow = false;
  g.add(inner);

  // collision ring with a gap for the entrance
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    const x = Math.sin(a) * R, z = Math.cos(a) * R;
    if (z > R * 0.8 && Math.abs(x) < R * 0.45) continue;
    colliders.push({ type: 'circle', x, z, r: 1.2 });
  }
  // projector in the middle
  g.add(cyl(0.3, 0.4, 1.2, mat('#333'), 8, 0, 0.6, 0));
  const proj = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), mat('#222', { metalness: 0.8 }));
  proj.position.y = 1.4;
  g.add(proj);
  colliders.push({ type: 'circle', x: 0, z: 0, r: 0.6 });

  const sign = signPost('PLANETARIUM', { width: 2.6, height: 1.3, bg: '#101838', fg: '#cfe0ff' });
  sign.position.set(4.5, 0, R + 1.8);
  g.add(sign);
  return { object: g, colliders };
}

function starTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const grd = ctx.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#05060f'); grd.addColorStop(1, '#1b1446');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,${200 + Math.random() * 55},${Math.random()})`;
    const r = Math.random() * 1.6;
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, r, r);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------ Biergarten Festzelt
function buildFestzelt() {
  const g = new THREE.Group();
  const colliders = [];
  const W = 16, D = 10, H = 2.6, R = 2.4;
  const white = new THREE.MeshStandardMaterial({ color: '#f7f7f2', roughness: 0.9, side: THREE.DoubleSide });
  // roof: two sloped planes + gables
  const slope = Math.hypot(D / 2, R);
  const ang = Math.atan2(R, D / 2);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(W, slope), white);
    r.rotation.x = s > 0 ? -Math.PI / 2 + ang : Math.PI / 2 - ang;
    r.position.set(0, H + R / 2, (s * D) / 4);
    g.add(r);
  }
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-D / 2, 0); gableShape.lineTo(D / 2, 0); gableShape.lineTo(0, R); gableShape.closePath();
  for (const s of [-1, 1]) {
    const gb = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), white);
    gb.rotation.y = Math.PI / 2;
    gb.position.set((s * W) / 2, H, 0);
    g.add(gb);
  }
  // Bavarian diamond valance
  const rauten = rautenTexture();
  const valMat = new THREE.MeshStandardMaterial({ map: rauten, side: THREE.DoubleSide, roughness: 0.9 });
  const valFront = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.6), valMat);
  valFront.position.set(0, H - 0.3, D / 2); g.add(valFront);
  const valBack = valFront.clone(); valBack.position.z = -D / 2; g.add(valBack);
  // back and side walls (front open)
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(W, H - 0.6), white);
  wall.position.set(0, (H - 0.6) / 2, -D / 2); g.add(wall);
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(D, H - 0.6), white);
    sw.rotation.y = Math.PI / 2; sw.position.set((s * W) / 2, (H - 0.6) / 2, 0); g.add(sw);
  }
  colliders.push({ type: 'box', x: 0, z: -D / 2, hw: W / 2, hd: 0.15, rot: 0 });
  colliders.push({ type: 'box', x: -W / 2, z: 0, hw: 0.15, hd: D / 2, rot: 0 });
  colliders.push({ type: 'box', x: W / 2, z: 0, hw: 0.15, hd: D / 2, rot: 0 });
  // poles
  const pole = mat('#d0d0d0', { metalness: 0.6 });
  for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 4) {
    for (const z of [-D / 2, D / 2]) g.add(cyl(0.07, 0.07, H, pole, 6, x, H / 2, z));
    if (Math.abs(x) < W / 2) colliders.push({ type: 'circle', x, z: D / 2, r: 0.2 });
  }
  // benches
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const b = beerBench();
    b.position.set(-5 + i * 5, 0, -2.8 + j * 2.8);
    g.add(b);
  }
  // bar
  g.add(box(4, 1.1, 0.8, mat('#7a5230'), 0, 0.55, -4.2));
  for (let i = 0; i < 3; i++) {
    const keg = cyl(0.3, 0.3, 0.6, mat('#9c9c9c', { metalness: 0.8 }), 10, -1.2 + i * 1.2, 1.4, -4.3);
    keg.rotation.z = Math.PI / 2; g.add(keg);
  }
  // pennants on top
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.6), valMat);
  flag.position.set(0, H + R + 0.9, 0);
  g.add(flag);
  g.add(cyl(0.03, 0.03, 1.4, pole, 5, -0.5, H + R + 0.6, 0));

  const sign = signPost('BAR', { width: 2.6, height: 1.3, bg: '#1d4f91', fg: '#ffffff' });
  sign.position.set(W / 2 - 1, 0, D / 2 + 2);
  g.add(sign);
  return { object: g, colliders };
}

function rautenTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#1f6fc9';
  for (let x = 0; x < 512; x += 32) {
    for (let row = 0; row < 2; row++) {
      const ox = x + (row ? 16 : 0), oy = row * 32;
      ctx.beginPath(); ctx.moveTo(ox, oy + 16); ctx.lineTo(ox + 16, oy); ctx.lineTo(ox + 32, oy + 16); ctx.lineTo(ox + 16, oy + 32); ctx.closePath(); ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  return t;
}

// ------------------------------------------------------------ generic party tent (future quests)
function buildPartyTent({ color = '#ffffff', w = 6, d = 6, label } = {}) {
  const g = new THREE.Group();
  const colliders = [];
  const canvas = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2, 1.6, 4, 1, true), canvas);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.5 + 0.8;
  g.add(roof);
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) {
    g.add(cyl(0.05, 0.05, 2.5, mat('#bbbbbb'), 6, x, 1.25, z));
    colliders.push({ type: 'circle', x, z, r: 0.2 });
  }
  if (label) {
    const s = signPost(label, { width: 2.2, height: 1 });
    s.position.set(w / 2, 0, d / 2 + 1);
    g.add(s);
  }
  return { object: g, colliders };
}

function addBunting(g, a, b) {
  const cols = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(t * Math.PI) * 0.4;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 3), mat(cols[i % cols.length]));
    f.rotation.x = Math.PI;
    f.position.copy(p);
    f.position.y -= 0.18;
    g.add(f);
  }
}

