import * as THREE from 'three';
import { mat, box, cyl, signPost } from './Props.js';

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

  // ---- royal tent (west): oval, red & gold, open towards the stretch tent (+x)
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
    const panel = box(len + 0.03, TH, 0.06, mat(i % 2 ? '#a8233a' : '#e8c46a'), mx, TH / 2, mz);
    const rot = -Math.atan2(z1 - z0, x1 - x0);
    panel.rotation.y = rot;
    tent.add(panel);
    wallSegs.push({ mx, mz, rot, len });
    colliders.push({ type: 'circle', x: TX + mx, z: mz, r: 0.35 });
  }
  const roofM = mat('#a8233a', { side: THREE.DoubleSide });
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
  const gold = mat('#e0b030', { metalness: 0.5, roughness: 0.35 });
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
