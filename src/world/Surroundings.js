import * as THREE from 'three';
import { mat } from './Props.js';
import { FAR_FIELDS, NEAR_FIELDS, TOWNS, GARDENS, OUT_ROADS, MOTORWAY, POWER_LINES, OUT_TREE_CLUSTERS, OUT_TREE_LINES } from './outskirts.js';

// The world beyond the festival: painted fields/villages/roads on the ground (both the detailed
// site canvas and a big low-res far ground) plus cheap 3D: houses, noise barrier, pylons.

export const FAR_SIZE = 2000;   // far ground covers ±1000 m
const FAR_RES = 2048;

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const pts2 = (a) => a.map(([x, z]) => ({ x, z }));

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function distToLine(x, z, line) {
  let m = 1e9;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i], [bx, bz] = line[i + 1];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return m;
}

/**
 * Paint the outskirts onto a ground canvas.
 * @param proj  (x, z) world -> [canvasX, canvasY]
 * @param m     canvas pixels per metre
 */
export function paintOutskirts(ctx, proj, m, { far = false } = {}) {
  const rng = mulberry(far ? 11 : 12);
  const path = (pts, close = true) => {
    ctx.beginPath();
    pts.forEach(([x, z], i) => { const [cx, cy] = proj(x, z); i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy); });
    if (close) ctx.closePath();
  };
  const field = (f) => {
    ctx.save();
    path(f.pts);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.clip();
    const [cx, cy] = proj(...f.pts[0]);
    ctx.translate(cx, cy);
    ctx.rotate((f.angle * Math.PI) / 180);
    ctx.strokeStyle = f.stripe;
    const sp = Math.max(1.5, f.spacing * m * 0.3);
    const big = 3000 * m;
    for (let i = -big; i < big; i += sp) {
      ctx.lineWidth = sp * 0.4;
      ctx.beginPath(); ctx.moveTo(-big, i); ctx.lineTo(big, i); ctx.stroke();
    }
    ctx.restore();
    fieldBorder(ctx, () => path(f.pts), m);
  };
  for (const f of FAR_FIELDS) field(f);
  for (const f of NEAR_FIELDS) field(f);

  // villages: garden green, paved yards, little roof-coloured speckles (the 3D houses stand on top)
  for (const t of TOWNS) {
    if (t.onlyFar && !far) continue;
    ctx.save();
    path(t.pts);
    ctx.fillStyle = '#6f8f4e';
    ctx.fill();
    ctx.clip();
    // gardens & hedges
    const xs = t.pts.map((p) => p[0]), zs = t.pts.map((p) => p[1]);
    const x0 = Math.max(-1000, Math.min(...xs)), x1 = Math.min(1000, Math.max(...xs));
    const z0 = Math.max(-1000, Math.min(...zs)), z1 = Math.min(1000, Math.max(...zs));
    const n = Math.min(2500, ((x1 - x0) * (z1 - z0)) / 160);
    for (let i = 0; i < n; i++) {
      const [cx, cy] = proj(x0 + rng() * (x1 - x0), z0 + rng() * (z1 - z0));
      ctx.globalAlpha = 0.2 + rng() * 0.3;
      ctx.fillStyle = ['#557a3a', '#8a9a6a', '#4a6a30', '#7a8f58'][i % 4];
      const r = (2 + rng() * 5) * m;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 1.5);
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
    for (const st of townStreets(t)) {
      path(st, false); ctx.strokeStyle = '#8a8a82'; ctx.lineWidth = 5.4 * m; ctx.stroke();
      path(st, false); ctx.strokeStyle = '#626360'; ctx.lineWidth = 4.2 * m; ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // garden centre: dark tree nursery rows
  ctx.save();
  path(GARDENS.pts);
  ctx.fillStyle = '#4e7434';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = '#3c5e28';
  for (let z = -20; z < 140; z += 3) { const [ax, ay] = proj(190, z), [bx, by] = proj(240, z); ctx.lineWidth = 1.4 * m; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  ctx.restore();

  // grass verge between Lippweg and the noise barrier, then the motorway
  const mw = MOTORWAY;
  ctx.save();
  path([[-1000, 160], [1000, 136], [1000, mw.wallZ + 1], [-1000, mw.wallZ + 1]]);
  ctx.fillStyle = '#5f8a3e';
  ctx.fill();
  ctx.restore();
  ctx.save();
  path([[-1000, mw.z0 - 2], [1000, mw.z0 - 2], [1000, mw.z1 + 2], [-1000, mw.z1 + 2]]);
  ctx.fillStyle = '#7a7d74';
  ctx.fill();
  path([[-1000, mw.z0], [1000, mw.z0], [1000, mw.z1], [-1000, mw.z1]]);
  ctx.fillStyle = '#56585a';
  ctx.fill();
  // lane markings
  ctx.strokeStyle = 'rgba(240,240,230,0.85)';
  const laneW = (mw.z1 - mw.z0) / mw.lanes;
  for (let i = 1; i < mw.lanes; i++) {
    const z = mw.z0 + i * laneW;
    const mid = i === mw.lanes / 2;
    ctx.lineWidth = (mid ? 0.6 : 0.2) * m;
    ctx.setLineDash(mid ? [] : [6 * m, 9 * m]);
    const [ax, ay] = proj(-1000, z), [bx, by] = proj(1000, z);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // roads
  const style = { asphalt: ['#6b6a60', '#55565a'], gravel: ['#9b927a', '#b1a88c'], dirt: ['#8a7a55', '#a08d63'] };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const r of OUT_ROADS) {
    const [edge, core] = style[r.kind];
    path(r.pts, false); ctx.strokeStyle = edge; ctx.lineWidth = (r.width + 1.2) * m; ctx.stroke();
    path(r.pts, false); ctx.strokeStyle = core; ctx.lineWidth = r.width * m; ctx.stroke();
  }
}

/** A field is framed by a slightly darker, grassy margin. */
export function fieldBorder(ctx, pathFn, m) {
  ctx.save();
  pathFn();
  ctx.clip();
  pathFn();
  ctx.strokeStyle = 'rgba(52,78,30,0.75)';
  ctx.lineWidth = 2.6 * m;
  ctx.stroke();
  pathFn();
  ctx.strokeStyle = 'rgba(120,140,80,0.5)';
  ctx.lineWidth = 0.9 * m;
  ctx.stroke();
  ctx.restore();
}

/** Big flat ground beyond the detailed site plane. */
export function createFarGround(scene) {
  const c = document.createElement('canvas');
  c.width = c.height = FAR_RES;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5e7f3c';
  ctx.fillRect(0, 0, FAR_RES, FAR_RES);
  const m = FAR_RES / FAR_SIZE;
  const proj = (x, z) => [(x / FAR_SIZE + 0.5) * FAR_RES, (z / FAR_SIZE + 0.5) * FAR_RES];
  paintOutskirts(ctx, proj, m, { far: true });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(FAR_SIZE, FAR_SIZE);
  geo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  ground.position.y = -0.35;
  ground.receiveShadow = true;
  scene.add(ground);
  // beyond that: plain fields up to the horizon
  const ringGeo = new THREE.RingGeometry(FAR_SIZE * 0.49, 2400, 48, 1);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x5e7f3c, roughness: 1 }));
  ring.position.y = -0.5;
  scene.add(ring);
}

/** Village street grid (shared by the painted ground and the 3D houses). */
function townStreets(t) {
  const xs = t.pts.map((p) => p[0]), zs = t.pts.map((p) => p[1]);
  const x0 = Math.max(-700, Math.min(...xs)), x1 = Math.min(700, Math.max(...xs));
  const z0 = Math.max(-700, Math.min(...zs)), z1 = Math.min(700, Math.max(...zs));
  const out = [];
  const rowGap = t.sparse ? 90 : 52;
  for (let z = (z1 < 0 ? z1 - 22 : z0 + 22); z1 < 0 ? z > z0 : z < z1; z += (z1 < 0 ? -rowGap : rowGap)) out.push([[x0, z], [x1, z + (x1 - x0) * -0.012]]);
  for (let x = x0 + 60; x < x1; x += 140) out.push([[x, z0], [x + 6, z1]]);
  return out;
}

// ------------------------------------------------------------------ 3D
const roadsNear = (x, z, d) => OUT_ROADS.some((r) => distToLine(x, z, r.pts) < r.width / 2 + d);

/** Houses (instanced walls + gable roofs), greenhouses, noise barrier, pylons. Returns extra tree positions. */
export function buildOutskirts(scene, { inSite }) {
  const rng = mulberry(5);
  const trees = [];
  // ---- houses along the village streets
  const houses = [];
  for (const t of TOWNS) {
    for (const st of townStreets(t)) {
      const [[ax, az], [bx, bz]] = st;
      const len = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / len, dz = (bz - az) / len;
      for (let d = 6; d < len; d += 17 + rng() * 6) {
        for (const side of [-1, 1]) {
          if (rng() < 0.28) continue;
          const off = 11 + rng() * 3;
          const hx = ax + dx * d - dz * off * side, hz = az + dz * d + dx * off * side;
          if (!inPoly(hx, hz, t.pts) || roadsNear(hx, hz, 7) || inSite(hx, hz) || Math.hypot(hx, hz) > 620) continue;
          const w = 8 + rng() * 3, dd = 9 + rng() * 3, h = 5 + rng() * 2;
          houses.push({ x: hx, z: hz, w, d: dd, h, r: Math.atan2(dx, dz) + (rng() - 0.5) * 0.1, wall: rng(), roof: rng() });
          if (rng() < 0.55) trees.push({ x: hx - dz * side * (dd / 2 + 5), z: hz + dx * side * (dd / 2 + 5) + (rng() - 0.5) * 4, s: 0.55 + rng() * 0.35 });
        }
      }
    }
  }
  const wallCols = ['#efe8d8', '#e8dcc0', '#f4f0e8', '#dcd2bc', '#e9e0cf'].map((c) => new THREE.Color(c));
  const roofCols = ['#a8442e', '#8a3b2a', '#6a6a6e', '#b85a3a', '#4a4a50'].map((c) => new THREE.Color(c));
  const wallGeo = new THREE.BoxGeometry(1, 1, 1);
  wallGeo.translate(0, 0.5, 0);
  // gable roof: a triangular prism along local z
  const roofGeo = new THREE.BufferGeometry();
  const v = [
    -0.55, 0, -0.55, 0.55, 0, -0.55, 0, 1, -0.55, // front gable
    0.55, 0, 0.55, -0.55, 0, 0.55, 0, 1, 0.55,    // back gable
    -0.55, 0, -0.55, 0, 1, -0.55, 0, 1, 0.55, -0.55, 0, -0.55, 0, 1, 0.55, -0.55, 0, 0.55, // left slope
    0.55, 0, -0.55, 0.55, 0, 0.55, 0, 1, 0.55, 0.55, 0, -0.55, 0, 1, 0.55, 0, 1, -0.55,    // right slope
  ];
  roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  roofGeo.computeVertexNormals();
  const walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), houses.length);
  const roofs = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide, flatShading: true }), houses.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  houses.forEach((h, i) => {
    q.setFromAxisAngle(up, h.r);
    m4.compose(new THREE.Vector3(h.x, -0.35, h.z), q, new THREE.Vector3(h.w, h.h + 0.35, h.d));
    walls.setMatrixAt(i, m4);
    walls.setColorAt(i, wallCols[Math.floor(h.wall * wallCols.length)]);
    m4.compose(new THREE.Vector3(h.x, h.h, h.z), q, new THREE.Vector3(h.w, 3 + h.w * 0.08, h.d));
    roofs.setMatrixAt(i, m4);
    roofs.setColorAt(i, roofCols[Math.floor(h.roof * roofCols.length)]);
  });
  walls.castShadow = roofs.castShadow = true;
  walls.receiveShadow = true;
  scene.add(walls, roofs);

  // ---- garden centre: greenhouses + nursery trees
  const glass = new THREE.MeshStandardMaterial({ color: '#dfeef0', transparent: true, opacity: 0.55, roughness: 0.2 });
  for (const [gx, gz] of [[206, 20], [222, 20], [206, 44], [222, 44]]) {
    const gh = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 12, 10, 1, false, 0, Math.PI), glass);
    gh.rotation.z = Math.PI / 2; // tunnel along x, curved roof on top
    gh.position.set(gx, 0, gz);
    scene.add(gh);
  }
  for (let i = 0; i < 40; i++) {
    const x = 197 + rng() * 36, z = 60 + rng() * 66;
    if (!roadsNear(x, z, 3)) trees.push({ x, z, s: 0.45 + rng() * 0.35 });
  }

  // ---- noise barrier along the motorway
  const mw = MOTORWAY;
  const panelW = 4;
  const n = Math.ceil(1600 / panelW);
  const panelGeo = new THREE.BoxGeometry(panelW - 0.08, mw.wallH, 0.3);
  panelGeo.translate(0, mw.wallH / 2 - 0.3, 0);
  const panels = new THREE.InstancedMesh(panelGeo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), n);
  const postGeo = new THREE.BoxGeometry(0.3, mw.wallH + 0.3, 0.4);
  postGeo.translate(0, (mw.wallH + 0.3) / 2 - 0.3, 0);
  const posts = new THREE.InstancedMesh(postGeo, mat('#5a5f5c'), n);
  const pCols = ['#7f8c80', '#8a968a', '#76847a'].map((c) => new THREE.Color(c));
  for (let i = 0; i < n; i++) {
    const x = -800 + i * panelW + panelW / 2;
    m4.makeTranslation(x, 0, mw.wallZ);
    panels.setMatrixAt(i, m4);
    panels.setColorAt(i, pCols[(i * 7) % 3]);
    m4.makeTranslation(x - panelW / 2, 0, mw.wallZ);
    posts.setMatrixAt(i, m4);
  }
  panels.receiveShadow = true;
  scene.add(panels, posts);

  // ---- high-voltage pylons + sagging wires
  const pylon = makePylon();
  const all = POWER_LINES.flat();
  const parts = [];
  pylon.traverse((o) => { if (o.isMesh) parts.push(o); });
  for (const p of parts) {
    const im = new THREE.InstancedMesh(p.geometry, p.material, all.length);
    all.forEach(([x, z], i) => {
      q.setFromAxisAngle(up, Math.atan2(0.44, 0.9)); // arms across the line
      m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1));
      m4.multiply(p.matrix);
      im.setMatrixAt(i, m4);
    });
    scene.add(im);
  }
  const wireMat = new THREE.LineBasicMaterial({ color: '#3a3a3a' });
  const armOffsets = [[-7, 26], [7, 26], [-5, 20], [5, 20], [0, 31]];
  const across = new THREE.Vector3(0.9, 0, -0.44); // perpendicular to the line direction
  for (const line of POWER_LINES) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1];
      for (const [off, y] of armOffsets) {
        const ptsW = [];
        for (let k = 0; k <= 16; k++) {
          const t = k / 16;
          const sag = Math.sin(t * Math.PI) * 4.5;
          ptsW.push(new THREE.Vector3(ax + (bx - ax) * t + across.x * off, y - 1.2 - sag, az + (bz - az) * t + across.z * off));
        }
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsW), wireMat));
      }
    }
  }

  // ---- trees that really stand there
  for (const cl of OUT_TREE_CLUSTERS) {
    for (let i = 0; i < cl.count; i++) {
      const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * cl.r;
      trees.push({ x: cl.c[0] + Math.cos(a) * r, z: cl.c[1] + Math.sin(a) * r, s: 0.8 + rng() * 0.4 });
    }
  }
  for (const tl of OUT_TREE_LINES) {
    for (let i = 0; i < tl.pts.length - 1; i++) {
      const [ax, az] = tl.pts[i], [bx, bz] = tl.pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const k = Math.floor(len / tl.spacing);
      for (let j = 0; j < k; j++) {
        const t = j / k, jit = tl.jitter || 1.5;
        trees.push({ x: ax + (bx - ax) * t + (rng() - 0.5) * jit * 2, z: az + (bz - az) * t + (rng() - 0.5) * jit * 2, s: 0.8 + rng() * 0.4 });
      }
    }
  }
  return trees.filter((t) => !roadsNear(t.x, t.z, 2.5) && !(t.z > MOTORWAY.wallZ - 3 && t.z < MOTORWAY.z1 + 3));
}

/** A lattice high-voltage pylon (~33 m) made of a few boxes – good enough from 200 m away. */
function makePylon() {
  const g = new THREE.Group();
  const steel = mat('#8c9296', { metalness: 0.4, roughness: 0.6 });
  const H = 33;
  const leg = (x0, z0, x1, z1, y0, y1) => {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, len, 0.35), steel);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.updateMatrix();
    g.add(m);
  };
  const w0 = 3.2, w1 = 0.9;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) leg(sx * w0, sz * w0, sx * w1, sz * w1, 0, H);
  // cross bracing on two faces
  for (let k = 0; k < 5; k++) {
    const y0 = (k / 5) * H * 0.85, y1 = ((k + 1) / 5) * H * 0.85;
    const wa = w0 + (w1 - w0) * (y0 / H), wb = w0 + (w1 - w0) * (y1 / H);
    leg(-wa, wa, wb, wb, y0, y1); leg(wa, wa, -wb, wb, y0, y1);
    leg(wa, -wa, wb, wb, y0, y1); leg(wa, wa, wb, -wb, y0, y1);
  }
  // cross arms
  for (const [y, half] of [[26, 7.5], [20, 5.5]]) leg(-half, 0, half, 0, y, y);
  leg(0, 0, 0, 0, H - 1, H + 1);
  return g;
}
