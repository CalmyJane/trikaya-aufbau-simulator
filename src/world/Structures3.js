import * as THREE from 'three';
import { mat, box, cyl, strut, signPost, beerBench, bwFabric } from './Props.js';

// ------------------------------------------------------------------ Künstlergasse
/**
 * Cosma & Mathias' Künstlergasse between the mainstage and the Forest Dome:
 * an open stretch tent (art workshops) and a royal tent (gallery).
 * Stage 1: the tents stand. Stage 2: paintings hang in the royal tent, workshop tables & easels under the stretch tent.
 */
export function buildKuenstlergasse() {
  const g = new THREE.Group();
  const staged = [];
  const stageColliders = [];
  const colliders = [];
  const add = (o, min = 1, max = 9) => { o.userData.minStage = min; o.userData.maxStage = max; staged.push(o); g.add(o); return o; };
  const col = (c, min, max = 9) => stageColliders.push({ ...c, minStage: min, maxStage: max });

  // ---- open stretch tent (east half): a sagging sail on two high poles and six low ones
  const SCX = 3, SX = 10, SZ = 8;
  const peaks = [[SCX - 2, 0, 2.2], [SCX + 2.2, 0.3, 2.0]];
  const corners = [[SCX - SX / 2, -SZ / 2], [SCX + SX / 2, -SZ / 2], [SCX - SX / 2, SZ / 2], [SCX + SX / 2, SZ / 2], [SCX, -SZ / 2 - 0.3], [SCX, SZ / 2 + 0.3]];
  const hAt = (x, z) => {
    let h = 2.3;
    for (const [px, pz, a] of peaks) h += a * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / 6);
    const ex = Math.abs(x - SCX) / (SX / 2), ez = Math.abs(z) / (SZ / 2);
    return h - 0.7 * Math.pow(Math.max(ex, ez), 3);
  };
  const sg = new THREE.PlaneGeometry(SX, SZ, 28, 24);
  sg.rotateX(-Math.PI / 2);
  const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i) + SCX, z = sp.getZ(i);
    sp.setXYZ(i, x, hAt(x, z), z);
  }
  sg.computeVertexNormals();
  const sail = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#e8d2a6', side: THREE.DoubleSide, roughness: 1 }));
  sail.castShadow = true;
  g.add(sail);
  const poleM = mat('#6b4a2a');
  for (const [px, pz] of peaks.map(([x, z]) => [x, z]).concat(corners)) {
    const h = hAt(px, pz);
    g.add(cyl(0.07, 0.09, h, poleM, 6, px, h / 2, pz));
    colliders.push({ type: 'circle', x: px, z: pz, r: 0.18 });
  }
  // colourful bunting along the front edge
  const buntCols = ['#e84a8a', '#f1c40f', '#2a8a7a', '#6a3d9a', '#e67e22', '#5ad1ff'];
  for (let i = 0; i < 14; i++) {
    const x = SCX - SX / 2 + 0.4 + i * ((SX - 0.8) / 13);
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 3), mat(buntCols[i % buntCols.length]));
    flag.rotation.x = Math.PI;
    flag.position.set(x, hAt(x, SZ / 2) - 0.2, SZ / 2);
    g.add(flag);
  }

  // ---- royal tent (west): oval, black & white with patterns, open towards the stretch tent (+x)
  const tent = new THREE.Group();
  const RX = 2.4, RZ = 3.4, TH = 2.1, P2 = 1.2;
  const TX = -5.2;
  const segs = 22;
  const wallAt = (a) => [Math.cos(a) * RX, Math.sin(a) * RZ];
  const wallSegs = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
    const [x0, z0] = wallAt(a0), [x1, z1] = wallAt(a1);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    if (mx > RX * 0.55) continue; // entrance towards the stretch tent
    const len = Math.hypot(x1 - x0, z1 - z0);
    const panel = box(len + 0.03, TH, 0.06, bwFabric(i % 2 ? 'dark' : 'light'), mx, TH / 2, mz);
    const rot = -Math.atan2(z1 - z0, x1 - x0);
    panel.rotation.y = rot;
    tent.add(panel);
    wallSegs.push({ mx, mz, rot, len });
    colliders.push({ type: 'circle', x: TX + mx, z: mz, r: 0.35 });
  }
  const roofM = bwFabric('roof');
  for (const pz of [-P2, P2]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(RX + 0.3, 2.0, 18, 1, true), roofM);
    cone.scale.z = 1.15;
    cone.position.set(0, TH + 1.0, pz);
    cone.castShadow = true;
    tent.add(cone);
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(RX + 0.3, RX + 0.3, P2 * 2, 18, 1, true, Math.PI, Math.PI), roofM);
  ridge.rotation.x = Math.PI / 2;
  ridge.scale.set(1, 1, 0.55);
  ridge.position.y = TH + 0.02;
  tent.add(ridge);
  const gold = mat('#efeae0', { metalness: 0.3, roughness: 0.4 }); // white finials
  for (const pz of [-P2, P2]) {
    tent.add(cyl(0.07, 0.08, TH + 2.8, mat('#6b4a2a'), 6, 0, (TH + 2.8) / 2, pz));
    tent.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), gold).translateY(TH + 2.9).translateZ(pz));
  }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 24), mat('#3a2a5a'));
  rug.scale.set(RX - 0.2, RZ - 0.2, 1);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.04;
  tent.add(rug);
  tent.position.set(TX, 0, 0);
  g.add(tent);

  // ---- stage 2: paintings on the inner walls of the royal tent
  const artCols = [['#e84a8a', '#1f4f99'], ['#f1c40f', '#2a8a7a'], ['#6a3d9a', '#e67e22'], ['#5ad1ff', '#b8283a'], ['#2e6b3a', '#f0d27a'], ['#c0602a', '#3a2a5a']];
  const frameM = mat('#5a3a1a');
  const pick = wallSegs.filter((_, i) => i % 2 === 0);
  pick.forEach((w, i) => {
    const pic = new THREE.Group();
    const [c1, c2] = artCols[i % artCols.length];
    pic.add(box(0.62, 0.5, 0.03, frameM, 0, 0, 0));
    const canvas = box(0.52, 0.4, 0.02, mat(c1), 0, 0, 0.02);
    pic.add(canvas);
    // a blob / sun / stripes – abstract art, obviously
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.11 + (i % 3) * 0.03, 12), mat(c2, { side: THREE.DoubleSide }));
    blob.position.set(((i % 3) - 1) * 0.1, ((i % 2) - 0.5) * 0.1, 0.035);
    pic.add(blob);
    // inside of the wall: move a bit towards the centre and face inwards
    const k = 0.9;
    pic.position.set(TX + w.mx * k, 1.35, w.mz * k);
    pic.rotation.y = Math.atan2(-w.mx, -w.mz);
    add(pic, 2);
  });
  // an easel with the "masterpiece" at the entrance
  const easel = (x, z, ry, art) => {
    const e = new THREE.Group();
    const wood = mat('#8a5a32');
    for (const s of [-1, 1]) { const leg = cyl(0.025, 0.025, 1.6, wood, 5, s * 0.25, 0.78, 0); leg.rotation.z = s * 0.12; e.add(leg); }
    const back = cyl(0.025, 0.025, 1.6, wood, 5, 0, 0.75, -0.3); back.rotation.x = -0.25; e.add(back);
    e.add(box(0.6, 0.04, 0.08, wood, 0, 0.7, 0.03));
    e.add(box(0.55, 0.45, 0.03, mat('#f4f0e6'), 0, 1.0, 0.04));
    if (art) { const a = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), mat(art, { side: THREE.DoubleSide })); a.position.set(0.05, 1.02, 0.06); e.add(a); }
    e.position.set(x, 0, z);
    e.rotation.y = ry;
    return e;
  };

  // ---- stage 2: art workshop under the stretch tent
  const tableM = mat('#c8a46a'), clothM = mat('#f4f0e6');
  for (const tz of [-1.4, 1.4]) {
    const tg = new THREE.Group();
    tg.add(box(3.2, 0.06, 0.9, tableM, 0, 0.74, 0));
    tg.add(box(3.25, 0.01, 0.95, clothM, 0, 0.775, 0));
    for (const [lx, lz] of [[-1.5, -0.38], [1.5, -0.38], [-1.5, 0.38], [1.5, 0.38]]) tg.add(cyl(0.04, 0.04, 0.74, tableM, 5, lx, 0.37, lz));
    // paint pots, brushes, little canvases
    for (let i = 0; i < 7; i++) {
      const c = artCols[i % artCols.length][i % 2];
      tg.add(cyl(0.06, 0.05, 0.1, mat(c), 8, -1.3 + i * 0.42, 0.83, (i % 2 ? 0.25 : -0.25)));
    }
    for (let i = 0; i < 3; i++) tg.add(box(0.35, 0.02, 0.28, mat(artCols[(i + 2) % artCols.length][0]), -0.9 + i * 0.9, 0.79, 0));
    // stools
    for (const sx of [-1, 0, 1]) for (const s of [-1, 1]) tg.add(cyl(0.18, 0.16, 0.45, mat('#6b4a2a'), 8, sx * 1.0, 0.225, s * 0.85));
    tg.position.set(SCX, 0, tz);
    add(tg, 2);
    col({ type: 'box', x: SCX, z: tz, hw: 1.7, hd: 0.5 }, 2);
  }
  add(easel(SCX + 4, -2.6, -0.6, '#e84a8a'), 2);
  add(easel(SCX + 4.2, 2.4, -2.4, '#2a8a7a'), 2);
  add(easel(TX + RX + 0.9, 1.8, Math.PI / 2 + 0.3, '#f1c40f'), 2);
  // workshop board
  const board = signPost('KUNST-WORKSHOP', { width: 1.6, height: 0.9, bg: '#f4f0e6', fg: '#6a3d9a' });
  board.position.set(SCX + 5.6, 0, 3.6);
  board.rotation.y = 0.5;
  add(board, 2);

  const sign = signPost('KÜNSTLERGASSE', { width: 2.8, height: 0.9, bg: '#3a2a5a', fg: '#f0d27a' });
  sign.position.set(SCX + 1, 0, SZ / 2 + 1.6);
  g.add(sign);

  const api = {
    stage: 1,
    setStage(n) {
      api.stage = n;
      for (const o of staged) o.visible = n >= o.userData.minStage && n <= o.userData.maxStage;
    },
    colliders(n) { return stageColliders.filter((c) => n >= c.minStage && n <= c.maxStage); },
  };
  api.setStage(1);
  // workshop seats (on the stools) and the gallery
  const spots = { kg_table: [SCX, 0], kg_gallery: [TX, 0], kg_tent: [SCX + 1, 0] };
  [[-1, -1.4 - 0.85], [1, -1.4 - 0.85], [0, 1.4 + 0.85], [-1, 1.4 + 0.85]].forEach(([sx, z], i) => { spots[`kg_seat${i + 1}`] = [SCX + sx * 1.0, z]; });
  g.userData.spots = spots;
  return { object: g, colliders, api };
}

// ------------------------------------------------------------------ water tank (IBC) next to the kitchen
/** A 1000 l IBC tank in its metal cage, on a pallet, with a hose to the kitchen. */
export function buildWaterTank() {
  const g = new THREE.Group();
  g.add(box(1.3, 0.14, 1.1, mat('#b89a6a'), 0, 0.07, 0));
  g.add(box(1.1, 1.05, 0.95, mat('#f4f4ee', { transparent: true, opacity: 0.85, roughness: 0.3 }), 0, 0.68, 0));
  const cage = mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 });
  for (const y of [0.2, 0.68, 1.18]) for (const s of [-1, 1]) {
    g.add(box(1.16, 0.04, 0.04, cage, 0, y, s * 0.5));
    g.add(box(0.04, 0.04, 1.02, cage, s * 0.57, y, 0));
  }
  for (const x of [-0.57, 0, 0.57]) for (const z of [-0.5, 0.5]) g.add(box(0.04, 1.0, 0.04, cage, x, 0.7, z));
  g.add(cyl(0.12, 0.12, 0.08, mat('#2a6ab0'), 10, 0, 1.24, 0));
  // hose towards the kitchen (-x)
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 0.25, 0), new THREE.Vector3(-1.2, 0.05, 0.2), new THREE.Vector3(-2.6, 0.05, -0.3), new THREE.Vector3(-3.6, 0.3, 0)]), 16, 0.04, 6), mat('#2a8a3a'));
  g.add(hose);
  return { object: g, colliders: [{ type: 'box', x: 0, z: 0, hw: 0.7, hd: 0.6 }] };
}

// ------------------------------------------------------------------ Krygo's sauna
/** Krygo's sauna in the crew camp: it will never be finished. Floor, a frame, half the boards, no roof, a stove outside. */
export function buildSauna() {
  const g = new THREE.Group();
  const wood = mat('#c49a62'), dark = mat('#8a6236'), fresh = mat('#e0bf88');
  const W = 3, D = 2.6, H = 2.2;
  g.add(box(W + 0.3, 0.2, D + 0.3, dark, 0, 0.1, 0)); // floor on pallets
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2], [0, -D / 2]]) g.add(box(0.12, H, 0.12, wood, x, 0.2 + H / 2, z));
  g.add(box(W, 0.12, 0.12, wood, 0, 0.2 + H, -D / 2));
  g.add(box(0.12, 0.12, D, wood, -W / 2, 0.2 + H, 0));
  // back wall fully boarded, left wall half, right wall three boards
  for (let i = 0; i < 9; i++) g.add(box(W, 0.2, 0.04, i % 2 ? wood : fresh, 0, 0.35 + i * 0.22, -D / 2 - 0.07));
  for (let i = 0; i < 5; i++) g.add(box(0.04, 0.2, D, i % 2 ? wood : fresh, -W / 2 - 0.07, 0.35 + i * 0.22, 0));
  for (let i = 0; i < 3; i++) g.add(box(0.04, 0.2, D * 0.6, fresh, W / 2 + 0.07, 0.35 + i * 0.22, -D * 0.2));
  // one lonely rafter, one crooked board
  g.add(strut(new THREE.Vector3(-W / 2, 0.2 + H, -D / 2), new THREE.Vector3(W / 2, 0.2 + H + 0.5, -D / 2), 0.06, dark));
  const loose = box(0.04, 0.2, 1.6, fresh, W / 2 + 0.07, 1.1, 0.5);
  loose.rotation.x = 0.5;
  g.add(loose);
  // benches inside (the only finished part)
  g.add(box(W - 0.3, 0.08, 0.5, fresh, 0, 0.65, -D / 2 + 0.35));
  g.add(box(W - 0.3, 0.08, 0.5, fresh, 0, 1.05, -D / 2 + 0.3));
  // stove outside, still strapped, pipe lying next to it
  const iron = mat('#2a2a2a', { metalness: 0.6, roughness: 0.5 });
  g.add(cyl(0.32, 0.32, 0.8, iron, 12, W / 2 + 1.0, 0.4, 0.9));
  g.add(cyl(0.34, 0.34, 0.05, mat('#e0a020'), 12, W / 2 + 1.0, 0.45, 0.9));
  const pipe = cyl(0.08, 0.08, 1.6, iron, 8, W / 2 + 1.5, 0.7, 0.6);
  pipe.rotation.z = 0.4;
  g.add(pipe);
  for (let i = 0; i < 6; i++) g.add(box(0.2, 0.14, 0.2, mat('#7a7a72'), W / 2 + 0.6 + (i % 3) * 0.24, 0.07 + Math.floor(i / 3) * 0.12, 1.5)); // sauna stones
  // board pile, sign
  for (let i = 0; i < 8; i++) g.add(box(2.2, 0.05, 0.18, i % 2 ? wood : fresh, -W / 2 - 0.9, 0.04 + Math.floor(i / 4) * 0.06, 0.6 + (i % 4) * 0.2));
  const sign = signPost('SAUNA – fast fertig', { width: 2.2, height: 0.8, bg: '#f4e2b8', fg: '#7a2a10' });
  sign.position.set(-0.6, 0, D / 2 + 1.0);
  sign.scale.setScalar(0.8);
  g.add(sign);
  return { object: g, colliders: [{ type: 'box', x: 0, z: 0, hw: W / 2 + 0.2, hd: D / 2 + 0.2 }, { type: 'circle', x: W / 2 + 1.0, z: 0.9, r: 0.4 }] };
}

// ------------------------------------------------------------------ bar tent & beer garden (decoration)
/** The red & black round bar tent at the south fence: striped half-round canopy over a long bar. */
export function buildBarTent() {
  const g = new THREE.Group();
  const R = 6.5, H = 2.4, N = 12;
  const red = new THREE.MeshStandardMaterial({ color: '#8a1e22', roughness: 0.9, side: THREE.DoubleSide });
  const black = new THREE.MeshStandardMaterial({ color: '#1c1416', roughness: 0.9, side: THREE.DoubleSide });
  // striped half cone roof + back wall, open towards +z
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + (i / N) * Math.PI, a1 = Math.PI + ((i + 1) / N) * Math.PI;
    const m = i % 2 ? red : black;
    const roof = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, H + 2.2, 0), new THREE.Vector3(Math.cos(a0) * R, H, -Math.sin(a0) * R * -1), new THREE.Vector3(Math.cos(a1) * R, H, -Math.sin(a1) * R * -1)]);
    roof.computeVertexNormals();
    g.add(new THREE.Mesh(roof, m));
    const wall = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a0) * R, H, Math.sin(a0) * R), new THREE.Vector3(Math.cos(a0) * R, 0, Math.sin(a0) * R), new THREE.Vector3(Math.cos(a1) * R, 0, Math.sin(a1) * R),
      new THREE.Vector3(Math.cos(a0) * R, H, Math.sin(a0) * R), new THREE.Vector3(Math.cos(a1) * R, 0, Math.sin(a1) * R), new THREE.Vector3(Math.cos(a1) * R, H, Math.sin(a1) * R)]);
    wall.computeVertexNormals();
    g.add(new THREE.Mesh(wall, i % 2 ? black : red));
    // scalloped valance along the open front edge
  }
  for (let i = 0; i < 10; i++) g.add(box(R * 0.2, 0.35, 0.03, i % 2 ? red : black, -R + R * 0.1 + i * R * 0.2, H - 0.17, 0));
  const pole = mat('#3a2a1a');
  g.add(cyl(0.1, 0.1, H + 2.2, pole, 6, 0, (H + 2.2) / 2, 0));
  for (const x of [-R, R]) g.add(cyl(0.07, 0.07, H, pole, 6, x, H / 2, 0));
  // the bar
  const wood = mat('#8a5a2e');
  g.add(box(7, 1.05, 0.7, wood, 0, 0.52, -1.6));
  g.add(box(7.2, 0.08, 0.9, mat('#5a3a1e'), 0, 1.09, -1.6));
  for (let i = 0; i < 6; i++) g.add(cyl(0.05, 0.05, 0.28, mat(['#2a7a3a', '#c8a020', '#7a2a1a'][i % 3]), 6, -2.5 + i, 1.27, -1.6)); // bottles
  g.add(box(1.4, 1.8, 0.7, mat('#e8e8e8'), -2.5, 0.9, -4.2)); // fridge
  g.add(box(3, 1.6, 0.6, mat('#3a2a1a'), 1.2, 0.8, -4.4)); // shelf with crates
  for (let i = 0; i < 4; i++) g.add(box(0.4, 0.28, 0.3, mat(['#e0a020', '#2a6ab0'][i % 2]), 0.1 + i * 0.7, 1.75, -4.4));
  for (let i = 0; i < 5; i++) { // stools
    g.add(cyl(0.2, 0.2, 0.06, wood, 8, -2.6 + i * 1.3, 0.75, -0.5));
    g.add(cyl(0.04, 0.04, 0.72, pole, 5, -2.6 + i * 1.3, 0.36, -0.5));
  }
  const bulb = new THREE.MeshStandardMaterial({ color: '#ffe8a0', emissive: '#ffcc55', emissiveIntensity: 1.2 });
  for (let i = 0; i <= 12; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), bulb);
    b.position.set(-R + (i / 12) * 2 * R, H - 0.45 - Math.sin((i / 12) * Math.PI) * 0.25, 0.05);
    g.add(b);
  }
  const sign = signPost('BAR', { width: 1.6, height: 0.8, bg: '#1c1416', fg: '#ff4a4a' });
  sign.position.set(R + 0.8, 0, 1.2);
  sign.scale.setScalar(0.85);
  g.add(sign);
  const colliders = [{ type: 'box', x: 0, z: -1.6, hw: 3.6, hd: 0.45 }, { type: 'box', x: 0, z: -4.3, hw: 3.3, hd: 0.45 }];
  for (let a = Math.PI; a <= 2 * Math.PI + 0.01; a += Math.PI / 8) colliders.push({ type: 'circle', x: Math.cos(a) * R, z: Math.sin(a) * R, r: 0.5 });
  return { object: g, colliders };
}
