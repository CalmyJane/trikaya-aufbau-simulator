import * as THREE from 'three';

// Small procedural props + helpers shared by the world and structure builders.

const matCache = new Map();
/** Cached flat-shaded standard material by colour. */
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...opts }));
  }
  return matCache.get(key);
}

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cyl(rt, rb, h, material, seg = 8, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Cylinder between two points (for poles, struts, ropes). */
export function strut(a, b, r, material, seg = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/** Canvas texture with text, e.g. signs and container numbers. */
export function textTexture(text, { w = 512, h = 256, bg = '#ffffff', fg = '#111111', font = 'bold 120px sans-serif', border } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14); }
  ctx.fillStyle = fg;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = String(text).split('\n');
  const lh = h / (lines.length + 0.4);
  // shrink the font until the widest line fits (long names used to be cut off)
  const maxW = w * 0.9;
  let widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (widest > maxW) {
    const m = /(\d+)px/.exec(font);
    if (m) { ctx.font = font.replace(`${m[1]}px`, `${Math.floor(+m[1] * maxW / widest)}px`); widest = maxW; }
  }
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function textPlane(text, width, height, opts) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: textTexture(text, opts), roughness: 0.9, transparent: !opts?.bg, side: THREE.DoubleSide }),
  );
  return m;
}

/** Sign on two posts. */
export function signPost(text, { width = 2.4, height = 1.2, bg = '#fff8e0', fg = '#2b2b2b', post = '#6b4a2b' } = {}) {
  const g = new THREE.Group();
  const board = textPlane(text, width, height, { bg, fg, font: 'bold 64px sans-serif', w: 512, h: Math.round(512 * height / width), border: '#3a2a1a' });
  board.position.y = 1.6;
  board.castShadow = true;
  g.add(board);
  const back = board.clone(); back.rotation.y = Math.PI; back.position.z = -0.03; g.add(back);
  g.add(cyl(0.05, 0.05, 2.2, mat(post), 6, -width / 2 + 0.15, 1.1, -0.05));
  g.add(cyl(0.05, 0.05, 2.2, mat(post), 6, width / 2 - 0.15, 1.1, -0.05));
  return g;
}

let corrugatedTex;
/** Corrugated steel look for containers. */
export function corrugated(color) {
  if (!corrugatedTex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 8;
    const ctx = c.getContext('2d');
    for (let x = 0; x < 256; x++) {
      const v = 190 + Math.sin((x / 256) * Math.PI * 2 * 16) * 55;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 1, 8);
    }
    corrugatedTex = new THREE.CanvasTexture(c);
    corrugatedTex.wrapS = corrugatedTex.wrapT = THREE.RepeatWrapping;
  }
  const t = corrugatedTex.clone();
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color, map: t, roughness: 0.7, metalness: 0.3 });
}

// ------------------------------------------------------------------ props

/** Dixi portable toilet. */
export function dixi(color = '#2f6fb3') {
  const g = new THREE.Group();
  g.add(box(1.15, 2.2, 1.15, mat(color), 0, 1.1, 0));
  const roof = box(1.25, 0.12, 1.25, mat('#e8e8e8'), 0, 2.26, 0); g.add(roof);
  const door = box(0.8, 1.8, 0.04, mat('#244f82'), 0, 1.05, 0.6); g.add(door);
  const sign = box(0.18, 0.18, 0.02, mat('#d13b3b'), 0.25, 1.5, 0.63); g.add(sign);
  return g;
}

/** Row of mobile construction fence panels ("Bauzaun"), instanced. */
export function fenceRun(segments) {
  // segments: [{ax,az,bx,bz}]
  const panels = [];
  for (const s of segments) {
    const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
    const n = Math.max(1, Math.round(len / 3.5));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      panels.push({
        x: s.ax + (s.bx - s.ax) * (t0 + t1) / 2,
        z: s.az + (s.bz - s.az) * (t0 + t1) / 2,
        rot: -Math.atan2(s.bz - s.az, s.bx - s.ax),
        w: len / n,
      });
    }
  }
  const group = new THREE.Group();
  const meshGeo = new THREE.PlaneGeometry(1, 1.9);
  const meshMat = new THREE.MeshStandardMaterial({ map: fenceMeshTexture(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
  const frameGeo = new THREE.BoxGeometry(1, 0.05, 0.05);
  const postGeo = new THREE.BoxGeometry(0.05, 2, 0.05);
  const footGeo = new THREE.BoxGeometry(0.6, 0.14, 0.2);
  const frameMat = mat('#b9bec4', { metalness: 0.5, roughness: 0.4 });
  const footMat = mat('#d9d4c8');
  const count = panels.length;
  const meshI = new THREE.InstancedMesh(meshGeo, meshMat, count);
  const topI = new THREE.InstancedMesh(frameGeo, frameMat, count * 2);
  const postI = new THREE.InstancedMesh(postGeo, frameMat, count);
  const footI = new THREE.InstancedMesh(footGeo, footMat, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  panels.forEach((pn, i) => {
    q.setFromAxisAngle(up, pn.rot);
    m4.compose(p.set(pn.x, 1.05, pn.z), q, s.set(pn.w, 1, 1)); meshI.setMatrixAt(i, m4);
    m4.compose(p.set(pn.x, 2.0, pn.z), q, s.set(pn.w, 1, 1)); topI.setMatrixAt(i * 2, m4);
    m4.compose(p.set(pn.x, 0.12, pn.z), q, s.set(pn.w, 1, 1)); topI.setMatrixAt(i * 2 + 1, m4);
    const ex = pn.x + Math.cos(pn.rot) * pn.w / 2, ez = pn.z - Math.sin(pn.rot) * pn.w / 2;
    m4.compose(p.set(ex, 1.05, ez), q, s.set(1, 1, 1)); postI.setMatrixAt(i, m4);
    m4.compose(p.set(ex, 0.07, ez), q, s.set(1, 1, 1)); footI.setMatrixAt(i, m4);
  });
  for (const im of [meshI, topI, postI, footI]) { im.castShadow = true; im.receiveShadow = true; group.add(im); }
  return group;
}

let fenceTex;
function fenceMeshTexture() {
  if (fenceTex) return fenceTex;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#c8ccd0';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 64; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke(); }
  for (let y = 0; y <= 128; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke(); }
  fenceTex = new THREE.CanvasTexture(c);
  fenceTex.wrapS = fenceTex.wrapT = THREE.RepeatWrapping;
  fenceTex.repeat.set(3, 3);
  return fenceTex;
}

/** Light mast (the red dots on the site plan). */
export function lightMast() {
  const g = new THREE.Group();
  g.add(box(1.4, 0.3, 1.4, mat('#555a60'), 0, 0.15, 0));
  g.add(cyl(0.09, 0.12, 8, mat('#8d949c', { metalness: 0.6 }), 8, 0, 4, 0));
  const head = box(1.2, 0.5, 0.4, mat('#2b2d31'), 0, 8.1, 0);
  g.add(head);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), new THREE.MeshStandardMaterial({ color: '#fff7cc', emissive: '#fff2b0', emissiveIntensity: 0.6 }));
  lens.position.set(0, 8.1, 0.21);
  g.userData.lens = lens;
  g.add(lens);
  return g;
}

/** Football goal. */
export function soccerGoal() {
  const g = new THREE.Group();
  const w = mat('#f4f4f4');
  g.add(cyl(0.06, 0.06, 2.2, w, 6, -3.5, 1.1, 0));
  g.add(cyl(0.06, 0.06, 2.2, w, 6, 3.5, 1.1, 0));
  const bar = cyl(0.06, 0.06, 7, w, 6, 0, 2.2, 0); bar.rotation.z = Math.PI / 2; g.add(bar);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshStandardMaterial({ map: fenceMeshTexture(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: '#ffffff' }));
  net.position.set(0, 1.1, -1.2); net.rotation.x = -0.35;
  g.add(net);
  return g;
}

/** Beer table set (Bierzeltgarnitur). */
export function beerBench() {
  const g = new THREE.Group();
  const wood = mat('#b48a55');
  const leg = mat('#555555');
  g.add(box(2.2, 0.05, 0.6, wood, 0, 0.78, 0));
  g.add(box(2.2, 0.05, 0.25, wood, 0, 0.47, 0.6));
  g.add(box(2.2, 0.05, 0.25, wood, 0, 0.47, -0.6));
  for (const x of [-0.9, 0.9]) {
    g.add(box(0.05, 0.76, 0.5, leg, x, 0.39, 0));
    g.add(box(0.05, 0.45, 0.2, leg, x, 0.23, 0.6));
    g.add(box(0.05, 0.45, 0.2, leg, x, 0.23, -0.6));
  }
  return g;
}

/** Construction plot: the outline is scratched into the dirt (ground canvas); here just wooden pegs + a low sign. */
export function plotMarker(size, label) {
  const g = new THREE.Group();
  const h = size / 2;
  for (const [x, z] of [[-h, -h], [h, -h], [h, h], [-h, h]]) {
    const peg = cyl(0.04, 0.03, 0.5, mat('#caa46a'), 5, x, 0.2, z);
    peg.rotation.z = (Math.random() - 0.5) * 0.3;
    g.add(peg);
    const tip = cyl(0.045, 0.045, 0.06, mat('#ff7a1a'), 5, x, 0.46, z); // orange painted tops
    g.add(tip);
  }
  if (label) {
    const s = signPost(`BAUFLÄCHE
${label}`, { width: 1.8, height: 0.9, bg: '#f4e2b0' });
    s.position.set(-h + 1.2, 0, h + 0.3);
    s.scale.setScalar(0.7);
    g.add(s);
  }
  return g;
}

/** Caravan / Bauwagen for the Privat area. */
export function bauwagen(color = '#c9b27a') {
  const g = new THREE.Group();
  g.add(box(6, 2.4, 2.4, mat(color), 0, 1.7, 0));
  const roof = cyl(1.3, 1.3, 6.1, mat('#6e6e6e'), 12, 0, 2.6, 0);
  roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.55); g.add(roof);
  for (const x of [-1.8, 1.8]) for (const z of [-1.1, 1.1]) {
    const w = cyl(0.4, 0.4, 0.2, mat('#222'), 10, x, 0.4, z); w.rotation.x = Math.PI / 2; g.add(w);
  }
  g.add(box(0.8, 0.8, 0.05, mat('#9fd3f0', { roughness: 0.2 }), 1.2, 2, 1.22));
  g.add(box(0.9, 1.9, 0.05, mat('#7a5a3a'), -1.6, 1.5, 1.22));
  return g;
}
