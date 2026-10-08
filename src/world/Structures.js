import * as THREE from 'three';
import { mat, box, cyl, strut, signPost, beerBench } from './Props.js';
import { buildMainstage, buildShadeSails, buildKitchen, woodMat } from './Mainstage.js';
import { buildKuenstlergasse, buildWaterTank, buildSauna, buildBarTent, buildBeerGarden } from './Structures3.js';
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
  bar_tent: buildBarTent,
  beer_garden: buildBeerGarden,
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
  // stage 1: the two-pole royal tent finally stands (front rolled up)
  const tent = royalTent({ a: 3, r: 4.2, h: 5.2, eave: 2.1, porch: 3 });
  add(tent.object, 1);
  for (const c of tent.colliders) col(c, 1);
  const pole = mat('#8b5e34');

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

  const sign = signPost('CHAI-LOUNGE', { width: 3.2, height: 0.9, bg: '#5b2c1d', fg: '#ffdca0' });
  sign.position.set(-5.5, 0, 6.5);
  g.add(sign);

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

// ------------------------------------------------------------ Planetarium: long stretch tent spanned like a hill
/**
 * A big, long beige stretch tent with open sides. Three tall poles along the middle lift it into a
 * soft hill; the underside is printed with a night sky (lie on the cushions and watch the "stars").
 */
function buildDome() {
  const g = new THREE.Group();
  const colliders = [];
  const L = 24, D = 13, EDGE = 2.1;
  const peaks = [[-8, 0, 5.4], [0, 0, 6.6], [8, 0, 5.4]];
  const geo = new THREE.PlaneGeometry(L, D, 48, 26);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const anchorsX = [-12, -6, 0, 6, 12];
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    const ex = Math.abs(x) / (L / 2), ez = Math.abs(z) / (D / 2);
    // hill: high along the ridge, falling to the edges; the ends come down further
    let y = EDGE + 3.0 * Math.pow(1 - ez * ez, 0.9) * (1 - 0.55 * ex * ex);
    for (const [px, pz, ph] of peaks) {
      const d = Math.hypot(x - px, (z - pz) * 1.2);
      y = Math.max(y, ph - d * 0.55);
    }
    y -= Math.pow(ex, 6) * 0.9; // ends pulled down to the anchors
    // tensioned fabric: edges curve inwards between the anchor points
    if (ez > 0.98) {
      const k = anchorsX.findIndex((ax) => ax >= x) || 1;
      const x0 = anchorsX[k - 1], x1 = anchorsX[k];
      const t = (x - x0) / (x1 - x0);
      z *= 1 - 0.09 * Math.sin(Math.PI * t);
      y += 0.35 * Math.sin(Math.PI * t);
    }
    if (ex > 0.98) z *= 1 - 0.06 * Math.sin(Math.PI * (z / D + 0.5));
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const top = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#e2d3b0', roughness: 0.9, side: THREE.FrontSide }));
  top.castShadow = true;
  g.add(top);
  const sky = starTexture();
  sky.wrapS = sky.wrapT = THREE.RepeatWrapping;
  sky.repeat.set(3, 1.6);
  const under = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', map: sky, emissive: '#ffffff', emissiveMap: sky, emissiveIntensity: 0.5, side: THREE.BackSide, roughness: 1 }));
  under.castShadow = false;
  g.add(under);

  // poles: three tall ones in the middle, short ones along the open sides, guy ropes to the ground
  const pole = mat('#9a7a52');
  const rope = mat('#d8cfb8');
  for (const [px, pz, ph] of peaks) {
    g.add(cyl(0.12, 0.14, ph, pole, 8, px, ph / 2, pz));
    colliders.push({ type: 'circle', x: px, z: pz, r: 0.3 });
  }
  for (const ax of anchorsX) {
    for (const s of [-1, 1]) {
      const z = s * D / 2, h = ax === -12 || ax === 12 ? EDGE - 0.6 : EDGE + 0.1;
      g.add(cyl(0.06, 0.07, h, pole, 6, ax, h / 2, z));
      g.add(strut(new THREE.Vector3(ax, h, z), new THREE.Vector3(ax * 1.05, 0, z * 1.35), 0.015, rope, 4));
      colliders.push({ type: 'circle', x: ax, z, r: 0.2 });
    }
  }
  // cushions & beanbags to lie on, projector in the middle
  const cols = ['#5a3a8a', '#2a4a8a', '#8a2a5a', '#2a6a6a', '#6a4a2a'];
  for (let i = 0; i < 14; i++) {
    const x = -9 + (i % 7) * 3 + (i > 6 ? 1.5 : 0), z = i > 6 ? 2.6 : -2.6;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 6), mat(cols[i % cols.length]));
    bag.scale.set(1.3, 0.45, 1);
    bag.position.set(x, 0.25, z);
    g.add(bag);
  }
  g.add(cyl(0.3, 0.4, 1.2, mat('#333'), 8, 0, 0.6, 0));
  const proj = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), mat('#222', { metalness: 0.8 }));
  proj.position.y = 1.4;
  g.add(proj);

  const sign = signPost('PLANETARIUM', { width: 2.6, height: 1.3, bg: '#101838', fg: '#cfe0ff' });
  sign.position.set(5, 0, D / 2 + 2.2);
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


/**
 * Two-pole royal tent ("Königszelt"): straight middle with a ridge between the poles, round ends,
 * cream canvas with red stripes, scalloped valance, pennants on the poles.
 * Returns the parts so callers can stage them; `openFront` leaves the front wall rolled up.
 */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function royalTent({ a = 3, r = 4.2, h = 5.2, eave = 2.1, cream = '#f1e8d4', red = '#9a2a2a', openFront = true, porch = 0 } = {}) {
  const g = new THREE.Group();
  const colliders = [];
  // perimeter: front side, right half circle, back side, left half circle (x along the ridge)
  const per = [];
  const N = 8, C = 10;
  for (let i = 0; i < N; i++) per.push({ x: -a + (i / N) * 2 * a, z: r, front: true });
  for (let i = 0; i < C; i++) { const t = Math.PI / 2 - (i / C) * Math.PI; per.push({ x: a + Math.cos(t) * r, z: Math.sin(t) * r }); }
  for (let i = 0; i < N; i++) per.push({ x: a - (i / N) * 2 * a, z: -r });
  for (let i = 0; i < C; i++) { const t = -Math.PI / 2 - (i / C) * Math.PI; per.push({ x: -a + Math.cos(t) * r, z: Math.sin(t) * r }); }
  const roof = [[], []], wall = [[], []];
  const quad = (arr, p) => arr.push(p[0], p[1], p[2], p[0], p[2], p[3]);
  for (let i = 0; i < per.length; i++) {
    const p = per[i], q = per[(i + 1) % per.length];
    const rp = new THREE.Vector3(THREE.MathUtils.clamp(p.x, -a, a), h, 0), rq = new THREE.Vector3(THREE.MathUtils.clamp(q.x, -a, a), h, 0);
    const ep = new THREE.Vector3(p.x, eave, p.z), eq = new THREE.Vector3(q.x, eave, q.z);
    const stripe = Math.floor(i / 2) % 2;
    quad(roof[stripe], [rp, ep, eq, rq]);
    if (!(openFront && p.front)) quad(wall[stripe], [ep, new THREE.Vector3(p.x, 0, p.z), new THREE.Vector3(q.x, 0, q.z), eq]);
    // valance scallop
    const m = ep.clone().lerp(eq, 0.5); m.y -= 0.42;
    wall[1].push(ep, m, eq);
  }
  const mk = (pts, color) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
    mesh.castShadow = true;
    return mesh;
  };
  g.add(mk(roof[0], cream), mk(roof[1], red), mk(wall[0], cream), mk(wall[1], red));
  const pole = woodMat('#7a5232');
  for (const x of [-a, a]) {
    g.add(cyl(0.11, 0.13, h + 0.9, pole, 8, x, (h + 0.9) / 2, 0));
    colliders.push({ type: 'circle', x, z: 0, r: 0.25 });
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 8), mat('#d8b040', { metalness: 0.5 }));
    finial.position.set(x, h + 1.1, 0);
    g.add(finial);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.4), new THREE.MeshStandardMaterial({ color: red, side: THREE.DoubleSide }));
    flag.position.set(x + 0.45, h + 0.7, 0);
    g.add(flag);
  }
  // guy ropes from the eave, walls block (front stays open when rolled up)
  const rope = mat('#d8cfb8');
  per.forEach((p, i) => {
    if (i % 3) return;
    const e = new THREE.Vector3(p.x, eave, p.z);
    const out = new THREE.Vector3(p.x + (p.x - THREE.MathUtils.clamp(p.x, -a, a)) * 0.5, 0, p.z * 1.5);
    g.add(strut(e, out, 0.012, rope, 4));
    g.add(cyl(0.05, 0.05, eave, pole, 5, p.x, eave / 2, p.z));
  });
  per.forEach((p) => { if (!(openFront && p.front)) colliders.push({ type: 'circle', x: p.x * 0.97, z: p.z * 0.97, r: 0.45 }); });
  if (porch) { // small awning in front of the open side, striped like the tent
    const pw = 2 * a + 1, z0 = r, z1 = r + porch, y0 = eave, y1 = eave - 0.35;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x0 = -pw / 2 + (i / n) * pw, x1 = -pw / 2 + ((i + 1) / n) * pw;
      const geo = new THREE.BufferGeometry().setFromPoints([V3(x0, y0, z0), V3(x0, y1, z1), V3(x1, y1, z1), V3(x0, y0, z0), V3(x1, y1, z1), V3(x1, y0, z0)]);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: i % 2 ? red : cream, roughness: 0.9, side: THREE.DoubleSide })));
      const m = V3((x0 + x1) / 2, y1 - 0.3, z1);
      const geo2 = new THREE.BufferGeometry().setFromPoints([V3(x0, y1, z1), m, V3(x1, y1, z1)]);
      g.add(new THREE.Mesh(geo2, new THREE.MeshStandardMaterial({ color: red, side: THREE.DoubleSide })));
    }
    for (const x of [-pw / 2, pw / 2]) {
      g.add(cyl(0.06, 0.07, y1, pole, 6, x, y1 / 2, z1));
      g.add(strut(V3(x, y1, z1), V3(x * 1.15, 0, z1 + 1.4), 0.012, rope, 4));
      colliders.push({ type: 'circle', x, z: z1, r: 0.2 });
    }
  }
  return { object: g, colliders };
}
