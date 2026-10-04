import * as THREE from 'three';
import { mat, box, cyl, strut, signPost } from './Props.js';

// The Trikaya mainstage: a wooden dragon (already standing) with a DJ stage in its ribcage,
// surrounded by 6 tall posts. Quests rig steel wires between the posts (setRig) and then
// hang the sun-shade decoration (buildShadeSails).

export const POST_RADIUS = 15;
export const POST_HEIGHT = 10.5;
const WIRE_Y = POST_HEIGHT - 0.4;

export function postPositions() {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + Math.PI / 6 + (i * Math.PI) / 3; // flat side towards the stage
    out.push(new THREE.Vector3(Math.cos(a) * POST_RADIUS, 0, Math.sin(a) * POST_RADIUS));
  }
  return out;
}

let plankTex;
export function woodMat(color) {
  if (!plankTex) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 256;
    const ctx = c.getContext('2d');
    for (let y = 0; y < 256; y += 32) {
      const v = 200 + Math.random() * 55;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 64, 30);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, y + 30, 64, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let k = 0; k < 6; k++) ctx.fillRect(Math.random() * 64, y + Math.random() * 30, 20 + Math.random() * 30, 1);
    }
    plankTex = new THREE.CanvasTexture(c);
    plankTex.wrapS = plankTex.wrapT = THREE.RepeatWrapping;
    plankTex.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshStandardMaterial({ color, map: plankTex, roughness: 0.9, flatShading: true });
}

export function buildMainstage() {
  const g = new THREE.Group();
  const colliders = [];
  const woodA = woodMat('#b07a42'), woodB = woodMat('#8a5a2a'), woodC = woodMat('#c79a5a');

  // ---------------------------------------------------------------- stage platform
  const stage = box(12, 1.3, 7, woodA, 0, 0.65, -14);
  g.add(stage);
  colliders.push({ type: 'box', x: 0, z: -14, hw: 6, hd: 3.5, rot: 0 });
  for (let i = 0; i < 3; i++) g.add(box(3, 0.25, 0.6, woodB, 0, 0.15 + i * 0.4, -10.2 + i * -0.1)); // steps
  g.add(box(2.6, 1.1, 1.1, woodB, 0, 1.85, -12.6)); // DJ booth
  g.add(box(2.4, 0.05, 0.9, mat('#222'), 0, 2.42, -12.6));
  for (const x of [-4.5, 4.5]) { // speaker stacks
    g.add(box(1.4, 2.2, 1.2, mat('#1a1a1a'), x, 2.4, -12.4));
    for (const y of [1.9, 2.9]) {
      const cone = cyl(0.45, 0.45, 0.05, mat('#333'), 16, x, y, -11.78);
      cone.rotation.x = Math.PI / 2;
      g.add(cone);
    }
  }

  // ---------------------------------------------------------------- ribcage around the stage
  for (let i = 0; i < 6; i++) {
    const z = -11.5 - i * 1.9;
    const r = 6.4 - Math.abs(i - 2.5) * 0.35;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.2, 5, 18, Math.PI), i % 2 ? woodA : woodB);
    rib.position.set(0, 1.3, z);
    rib.castShadow = true;
    g.add(rib);
  }
  // spine
  const spinePts = [];
  for (let i = 0; i <= 12; i++) spinePts.push(new THREE.Vector3(0, 1.3 + 6.4 - Math.abs(i / 12 - 0.5) * 1.2, -11.5 - (i / 12) * 11));
  addBeamChain(g, spinePts, 0.28, woodB);
  for (let i = 1; i < spinePts.length - 1; i += 1) { // spikes
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.1, 4), woodC);
    s.position.copy(spinePts[i]).add(new THREE.Vector3(0, 0.6, 0));
    s.castShadow = true;
    g.add(s);
  }
  colliders.push({ type: 'box', x: 0, z: -20.5, hw: 6.5, hd: 3.5, rot: 0 });

  // ---------------------------------------------------------------- neck & head (arching over the DJ)
  const neck = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 7.5, -21.5),
    new THREE.Vector3(0, 11, -22),
    new THREE.Vector3(0, 13, -17),
    new THREE.Vector3(0, 12, -12.5),
    new THREE.Vector3(0, 10.2, -9.8),
  ]);
  const npts = neck.getPoints(22);
  npts.forEach((p, i) => {
    const s = 1.3 - (i / npts.length) * 0.55;
    const seg = box(s, s, 0.9, i % 2 ? woodA : woodC);
    seg.position.copy(p);
    const tan = neck.getTangent(i / (npts.length - 1));
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    g.add(seg);
    if (i % 2 === 0) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4), woodB);
      sp.position.copy(p).add(new THREE.Vector3(0, s * 0.5 + 0.35, 0));
      sp.castShadow = true;
      g.add(sp);
    }
  });
  const head = new THREE.Group();
  head.position.copy(npts[npts.length - 1]);
  head.rotation.x = 0.45; // looking down at the crowd
  g.add(head);
  head.add(box(1.7, 1.3, 2.0, woodA, 0, 0, 0.3));          // skull
  head.add(box(1.3, 0.5, 1.8, woodC, 0, 0.05, 1.9));        // upper snout
  const jaw = box(1.2, 0.3, 1.9, woodB, 0, -0.55, 1.6);     // open lower jaw
  jaw.rotation.x = 0.35;
  head.add(jaw);
  for (const x of [-0.45, -0.15, 0.15, 0.45]) { // teeth
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), mat('#f2ead8'));
    t.position.set(x, -0.3, 2.6);
    t.rotation.x = Math.PI;
    head.add(t);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ff7a00', emissiveIntensity: 1.2 });
  for (const x of [-0.72, 0.72]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), eyeMat);
    eye.position.set(x, 0.25, 0.9);
    head.add(eye);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 5), woodB);
    horn.position.set(x * 0.8, 0.9, -0.5);
    horn.rotation.x = -1.0;
    horn.castShadow = true;
    head.add(horn);
  }
  g.userData.eyeMat = eyeMat;

  // ---------------------------------------------------------------- wings (timber frames + cloth)
  const cloth = new THREE.MeshStandardMaterial({ color: '#7a2a2a', side: THREE.DoubleSide, transparent: true, opacity: 0.85, roughness: 1 });
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Vector3(s * 4.5, 7.5, -18);
    const tips = [
      new THREE.Vector3(s * 13, 14, -21),
      new THREE.Vector3(s * 14.5, 10, -22.5),
      new THREE.Vector3(s * 13, 6, -23.5),
      new THREE.Vector3(s * 9, 3.2, -23),
    ];
    const elbow = new THREE.Vector3(s * 9, 12.5, -19.5);
    g.add(strut(shoulder, elbow, 0.22, woodB));
    tips.forEach((t) => g.add(strut(elbow, t, 0.13, woodA)));
    for (let i = 0; i < tips.length - 1; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([elbow, tips[i], tips[i + 1]]);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, cloth));
    }
    const geo2 = new THREE.BufferGeometry().setFromPoints([shoulder, elbow, tips[tips.length - 1]]);
    geo2.computeVertexNormals();
    g.add(new THREE.Mesh(geo2, cloth));
  }

  // ---------------------------------------------------------------- tail curling round the back
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.2, -22.5), new THREE.Vector3(3, 1.2, -26), new THREE.Vector3(9, 0.7, -26.5),
    new THREE.Vector3(13, 0.5, -23), new THREE.Vector3(14.5, 0.9, -19),
  ]);
  const tpts = tail.getPoints(18);
  tpts.forEach((p, i) => {
    const s = 1.1 - (i / tpts.length) * 0.8;
    if (i % 2 === 0) colliders.push({ type: 'circle', x: p.x, z: p.z, r: Math.max(0.45, s * 0.6) });
    const seg = box(s, s * 0.8, 1.0, i % 2 ? woodA : woodB);
    seg.position.copy(p);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tail.getTangent(i / (tpts.length - 1)));
    g.add(seg);
  });

  // ---------------------------------------------------------------- 6 posts
  const posts = postPositions();
  const postMat = woodMat('#6b4a2a');
  // the posts are only set once the holes are drilled (quest) – World adds their colliders
  const postGroups = posts.map((p) => {
    const pg = new THREE.Group();
    pg.add(cyl(0.2, 0.26, POST_HEIGHT, postMat, 8, p.x, POST_HEIGHT / 2, p.z));
    pg.add(cyl(0.45, 0.5, 0.25, mat('#8a8a80'), 8, p.x, 0.12, p.z)); // concrete foot
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 5, 12), mat('#9aa3ad', { metalness: 0.7 }));
    ring.position.set(p.x, WIRE_Y, p.z);
    pg.add(ring);
    pg.visible = false;
    g.add(pg);
    return pg;
  });

  // ---------------------------------------------------------------- rigging (hidden until quests)
  const wireMat = mat('#4a4f55', { metalness: 0.8, roughness: 0.3 });
  const centre = new THREE.Vector3(0, WIRE_Y + 0.4, 0);
  const rigGroups = posts.map((p, i) => {
    const grp = new THREE.Group();
    const a = new THREE.Vector3(p.x, WIRE_Y, p.z);
    const n = posts[(i + 1) % 6];
    const b = new THREE.Vector3(n.x, WIRE_Y, n.z);
    grp.add(sagWire(a, b, 0.35, wireMat));
    grp.add(sagWire(a, centre, 0.25, wireMat));
    // ratchet strap tension device near the post
    const ratchet = box(0.15, 0.1, 0.3, mat('#e0a020'), 0, 0, 0);
    ratchet.position.copy(a).lerp(centre, 0.06);
    grp.add(ratchet);
    grp.visible = false;
    g.add(grp);
    return grp;
  });
  const centreRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 16), mat('#9aa3ad', { metalness: 0.8 }));
  centreRing.position.copy(centre);
  centreRing.rotation.x = Math.PI / 2;
  centreRing.visible = false;
  g.add(centreRing);

  const sign = signPost('MAINSTAGE', { width: 2.6, height: 1.3, bg: '#2a160a', fg: '#ffb020' });
  sign.position.set(7.5, 0, -7);
  sign.rotation.y = -0.4;
  g.add(sign);

  const api = {
    posts,
    setPosts(done) { postGroups.forEach((pg, i) => { pg.visible = done.includes(i); }); },
    setRig(done) {
      const set = Array.isArray(done) ? done : [...Array(done || 0).keys()];
      rigGroups.forEach((grp, i) => { grp.visible = set.includes(i); });
      centreRing.visible = set.length > 0;
    },
  };
  return { object: g, colliders, api };
}

/**
 * Goa / psytrance sun-shade decoration: stretched lycra sails with concave edges between the
 * posts, layered at alternating heights, UV-neon mandala & fractal prints (slightly emissive),
 * a central mandala canopy, and twisted lycra ribbons hanging down.
 */
export function buildShadeSails() {
  const g = new THREE.Group();
  const posts = postPositions();
  const NEON = [ // [print 1, fabric colour, dark line colour, print 2]
    ['#ffe600', '#ff2bd6', '#2a0a4a', '#39ff14'],
    ['#ff2bd6', '#00d8f0', '#10103a', '#ffe600'],
    ['#8a2bff', '#39ff14', '#0a2a0a', '#ff6a00'],
    ['#00f0ff', '#ff6a00', '#2a0a00', '#ffe600'],
    ['#39ff14', '#8a2bff', '#10002a', '#ffe600'],
    ['#ff2bd6', '#ffe600', '#2a1a00', '#00f0ff'],
  ];
  const centreHigh = new THREE.Vector3(0, WIRE_Y + 1.6, 0);
  const centreLow = new THREE.Vector3(0, WIRE_Y - 1.2, 0);

  // ---- 1) main star: 6 concave lycra sails, alternating high/low for the layered look
  posts.forEach((p, i) => {
    const n = posts[(i + 1) % 6];
    const high = i % 2 === 0;
    const a = new THREE.Vector3(p.x, WIRE_Y + 0.1, p.z).lerp(new THREE.Vector3(0, WIRE_Y, 0), 0.02);
    const b = new THREE.Vector3(n.x, WIRE_Y + 0.1, n.z).lerp(new THREE.Vector3(0, WIRE_Y, 0), 0.02);
    const c = (high ? centreHigh : centreLow).clone();
    const mesh = lycraTriangle(a, b, c, {
      concave: 0.22, sag: high ? 0.8 : 1.6,
      tex: mandalaTexture(NEON[i], i),
    });
    g.add(mesh);
  });

  // ---- 2) second, smaller inner layer rotated by 30° (points hang between the big sails)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6 - Math.PI / 2;
    const tip = new THREE.Vector3(Math.cos(ang) * 9.5, WIRE_Y - 2.2, Math.sin(ang) * 9.5);
    const a1 = ang - 0.55, a2 = ang + 0.55;
    const l = new THREE.Vector3(Math.cos(a1) * 4, WIRE_Y - 0.4, Math.sin(a1) * 4);
    const r = new THREE.Vector3(Math.cos(a2) * 4, WIRE_Y - 0.4, Math.sin(a2) * 4);
    g.add(lycraTriangle(l, r, tip, { concave: 0.3, sag: 0.3, tex: fractalTexture(NEON[(i + 3) % 6], i) }));
  }

  // ---- 3) central mandala disc (UV print, seen from below)
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 48),
    uvMaterial(mandalaTexture(['#ffe600', '#ff2bd6', '#1a0033', '#00f0ff'], 99, true)),
  );
  disc.rotation.x = Math.PI / 2; // face down
  disc.position.set(0, WIRE_Y - 0.5, 0);
  g.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.06, 6, 48), mat('#d0d0d0', { metalness: 0.7 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(disc.position);
  g.add(ring);

  // ---- 4) twisted lycra ribbons ("tentacles") hanging from the wires
  const ribbonCols = ['#ff2bd6', '#39ff14', '#00f0ff', '#ff6a00', '#ffe600', '#8a2bff'];
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const r = i % 2 ? 6.5 : 10.5;
    const top = new THREE.Vector3(Math.cos(ang) * r, WIRE_Y - 0.6, Math.sin(ang) * r);
    const len = 3 + (i % 3) * 1.1;
    g.add(twistedRibbon(top, len, 0.45, ribbonCols[i % ribbonCols.length], i));
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.noBlock = true; } });
  g.userData.animate = (t) => {
    // lycra breathes a little in the wind
    g.children.forEach((c, i) => { if (c.userData.ribbon) c.rotation.y = Math.sin(t * 0.8 + i) * 0.25; });
  };
  return { object: g, colliders: [] };
}

function uvMaterial(tex) {
  return new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.35,
    side: THREE.DoubleSide, roughness: 0.85,
  });
}

/**
 * Stretched lycra triangle a-b-c: edges curve inwards (concave, like tensioned stretch fabric),
 * the middle sags. UVs map the flat triangle so a centred print lands in the middle.
 */
function lycraTriangle(a, b, c, { concave = 0.2, sag = 1, tex }) {
  const N = 14;
  const centroid = a.clone().add(b).add(c).divideScalar(3);
  const P = (wa, wb, wc) => {
    const q = new THREE.Vector3().addScaledVector(a, wa).addScaledVector(b, wb).addScaledVector(c, wc);
    // concave edges: pull points near each edge's middle towards the centroid
    let pull = 0;
    pull += 4 * wa * wb * Math.pow(1 - wc, 4);
    pull += 4 * wb * wc * Math.pow(1 - wa, 4);
    pull += 4 * wc * wa * Math.pow(1 - wb, 4);
    q.lerp(centroid, Math.min(0.9, pull * concave * 2.2));
    q.y -= 27 * wa * wb * wc * sag; // bell-shaped sag, zero at corners & edges
    return q;
  };
  const verts = [], uvs = [];
  // flat 2D frame for UVs: a=(0,0) b=(1,0) c=(0.5,0.87)
  const uvOf = (wa, wb, wc) => [wb * 1 + wc * 0.5, wc * 0.866];
  const push = (w) => { const q = P(...w); verts.push(q.x, q.y, q.z); uvs.push(...uvOf(...w)); };
  for (let r = 0; r < N; r++) {
    for (let k = 0; k < N - r; k++) {
      const w = (i, j) => [1 - i / N - j / N, i / N, j / N];
      push(w(k, r)); push(w(k + 1, r)); push(w(k, r + 1));
      if (k < N - r - 1) { push(w(k + 1, r)); push(w(k + 1, r + 1)); push(w(k, r + 1)); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  tex.repeat.set(1, 1.155); // keep the print round on the triangle
  return new THREE.Mesh(geo, uvMaterial(tex));
}

function twistedRibbon(top, len, width, color, seed) {
  const segs = 24;
  const verts = [], uvs = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * Math.PI * 3 + seed;
    const hw = width * (1 - t * 0.7) / 2;
    const y = -t * len;
    verts.push(Math.cos(ang) * hw, y, Math.sin(ang) * hw, -Math.cos(ang) * hw, y, -Math.sin(ang) * hw);
    uvs.push(0, t, 1, t);
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, side: THREE.DoubleSide, roughness: 0.8 }));
  m.position.copy(top);
  m.userData.ribbon = true;
  return m;
}

// ------------------------------------------------------------------ psychedelic print textures
function neonCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  return [c, c.getContext('2d')];
}
function toTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Radially symmetric UV mandala on a dark or bright ground. */
function mandalaTexture([c1, bg, dark, c3], seed, round) {
  const c2 = dark;
  const [c, ctx] = neonCanvas();
  const cx = 256, cy = round ? 256 : 256 * 0.8; // triangle centroid sits lower in UV space
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512);
  // radial glow
  const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 300);
  grd.addColorStop(0, c3); grd.addColorStop(0.45, bg); grd.addColorStop(1, bg);
  ctx.globalAlpha = 0.6; ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512); ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(cx, cy);
  const petals = 8 + (seed % 3) * 4;
  for (let ring = 6; ring >= 1; ring--) {
    const R = ring * 38;
    const col = [c1, c2, c3][ring % 3];
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i / petals) * Math.PI * 2 + ring * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, R - 34);
      ctx.quadraticCurveTo(18, R - 10, 0, R + 16);
      ctx.quadraticCurveTo(-18, R - 10, 0, R - 34);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, R + 24, 5, 0, 7); ctx.fillStyle = [c2, c3, c1][ring % 3]; ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, R - 36, 0, 7); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  }
  // spiral arms
  ctx.lineWidth = 4;
  for (let arm = 0; arm < 6; arm++) {
    ctx.beginPath();
    for (let k = 0; k < 120; k++) {
      const a = arm * (Math.PI / 3) + k * 0.06, r = k * 0.9;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = arm % 2 ? c2 : c3; ctx.stroke();
  }
  // centre eye
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fillStyle = c3; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fillStyle = bg; ctx.fill();
  ctx.restore();
  return toTex(c);
}

/** Fractal-ish psy print: nested triangles + string-art lines + dots. */
function fractalTexture([c1, bg, dark, c3], seed) {
  const c2 = dark;
  const [c, ctx] = neonCanvas();
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512);
  const tri = (x, y, s, d) => {
    if (d === 0 || s < 8) return;
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.87, y + s / 2); ctx.lineTo(x - s * 0.87, y + s / 2); ctx.closePath();
    ctx.strokeStyle = [c1, c2, c3][d % 3]; ctx.lineWidth = Math.max(1.5, d * 1.2); ctx.stroke();
    tri(x, y - s / 2, s / 2, d - 1); tri(x + s * 0.43, y + s / 4, s / 2, d - 1); tri(x - s * 0.43, y + s / 4, s / 2, d - 1);
  };
  tri(256, 250, 230, 5);
  // string art
  ctx.globalAlpha = 0.7;
  for (let i = 0; i <= 24; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * 21); ctx.lineTo(i * 21, 512); ctx.strokeStyle = c1; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(512, i * 21); ctx.lineTo(512 - i * 21, 512); ctx.strokeStyle = c2; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath(); ctx.arc((i * 97 + seed * 31) % 512, (i * 53 + seed * 17) % 512, 3 + (i % 4), 0, 7);
    ctx.fillStyle = [c1, c2, c3][i % 3]; ctx.fill();
  }
  return toTex(c);
}

function sagWire(a, b, sag, material) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.035, 4, false), material);
  m.castShadow = true;
  return m;
}

function addBeamChain(g, pts, r, material) {
  for (let i = 0; i < pts.length - 1; i++) g.add(strut(pts[i], pts[i + 1], r, material, 6));
}

/** Open crew kitchen tent. */
export function buildKitchen() {
  const g = new THREE.Group();
  const colliders = [];
  const W = 9, D = 6, H = 2.6;
  const canvas = new THREE.MeshStandardMaterial({ color: '#f2efe6', side: THREE.DoubleSide, roughness: 0.9 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(W, D) / 2, 1.4, 4, 1, true), canvas);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(W / Math.hypot(W, D) * 1.41, 1, D / Math.hypot(W, D) * 1.41);
  roof.position.y = H + 0.7;
  g.add(roof);
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]]) {
    g.add(cyl(0.05, 0.05, H, mat('#bbbbbb'), 6, x, H / 2, z));
    colliders.push({ type: 'circle', x, z, r: 0.2 });
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), canvas);
  back.position.set(0, H / 2, -D / 2);
  g.add(back);
  colliders.push({ type: 'box', x: 0, z: -D / 2, hw: W / 2, hd: 0.15, rot: 0 });
  const steel = mat('#c9cdd1', { metalness: 0.7, roughness: 0.35 });
  g.add(box(W - 1, 0.9, 0.8, steel, 0, 0.45, -D / 2 + 0.6));   // back counter
  colliders.push({ type: 'box', x: 0, z: -D / 2 + 0.6, hw: (W - 1) / 2, hd: 0.45, rot: 0 });
  g.add(box(3, 0.9, 0.8, steel, -1.2, 0.45, 0.8));             // island
  colliders.push({ type: 'box', x: -1.2, z: 0.8, hw: 1.5, hd: 0.45, rot: 0 });
  // stoves + giant pots
  for (const x of [-2.5, 0, 2.5]) {
    g.add(box(0.8, 0.1, 0.6, mat('#222'), x, 0.95, -D / 2 + 0.6));
    const pot = cyl(0.35, 0.3, 0.55, mat('#9aa0a6', { metalness: 0.8, roughness: 0.3 }), 12, x, 1.28, -D / 2 + 0.6);
    g.add(pot);
  }
  // veggie crates, fridge
  g.add(box(0.9, 1.9, 0.8, mat('#e8e8e8'), W / 2 - 0.7, 0.95, -D / 2 + 0.7));
  for (let i = 0; i < 4; i++) g.add(box(0.5, 0.3, 0.35, mat(['#e67e22', '#27ae60', '#c0392b', '#f1c40f'][i]), -2.4 + i * 0.55, 1.05, 0.8));
  const sign = signPost('KÜCHE', { width: 2.4, height: 1.2, bg: '#fff3d6', fg: '#8a1a1a' });
  sign.position.set(W / 2 + 0.8, 0, D / 2);
  sign.rotation.y = -0.5;
  g.add(sign);
  return { object: g, colliders, zone: { r: 5.5 } };
}
