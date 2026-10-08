import * as THREE from 'three';
import { mat, box, cyl, strut, signPost } from './Props.js';

// The Trikaya mainstage: a wooden shingle dragon (already standing) crouching over a DJ stage,
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

  // ---------------------------------------------------------------- the dragon: hunched over the stage,
  // covered in sawn wooden shingles, arms reaching down to form the stage arch (like the real Trikaya one)
  const sh = makeShingles();
  const dark = mat('#2a1a0e', { side: THREE.DoubleSide });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // chest vault over the stage (open to the front)
  const vault = (Rx, Ry) => (u, v) => {
    const z = -18.6 + v * 6.6;
    return { p: V(Math.cos(Math.PI * u) * Rx, Math.sin(Math.PI * u) * Ry, z), c: V(0, 0.5, z) };
  };
  sh.surface(vault(6.5, 7.2));
  g.add(paramMesh(vault(6.25, 6.95), 16, 4, dark));
  g.add(box(13, 7.4, 0.3, dark, 0, 3.7, -18.7)); // back wall behind the DJ
  colliders.push({ type: 'box', x: 0, z: -18.6, hw: 6.6, hd: 1, rot: 0 });

  // hunched back / shoulders
  const hood = ellipsoid(V(0, 6.6, -15.5), V(5.4, 3.0, 3.8), 0, 0.58 * Math.PI);
  sh.surface(hood);
  g.add(paramMesh(ellipsoid(V(0, 6.6, -15.5), V(5.15, 2.8, 3.55)), 16, 10, dark));
  for (let z = -13.8; z >= -18.6; z -= 0.8) { // spine spikes
    const y = 6.6 + 3 * Math.sqrt(Math.max(0, 1 - ((z + 15.5) / 3.8) ** 2));
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 4), woodC);
    s.position.set(0, y + 0.45, z);
    s.rotation.x = -0.25;
    s.castShadow = true;
    g.add(s);
  }

  // arms reaching down to the ground left & right of the stage
  for (const s of [-1, 1]) {
    const arm = new THREE.CatmullRomCurve3([V(s * 4.4, 7.6, -13.4), V(s * 6.4, 5.4, -11.6), V(s * 6.6, 2.6, -10.6), V(s * 6.3, 0, -10.0)]);
    sh.surface(tube(arm, 1.35, 0.85));
    g.add(paramMesh(tube(arm, 1.2, 0.75), 10, 12, dark));
    for (let k = -1; k <= 1; k++) { // claws
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 4), mat('#e6cf9a'));
      c.position.set(s * 6.3 + k * 0.4, 0.15, -9.0);
      c.rotation.x = Math.PI / 2;
      g.add(c);
    }
    colliders.push({ type: 'circle', x: s * 6.3, z: -10.0, r: 1.0 });
    colliders.push({ type: 'circle', x: s * 6.6, z: -11.2, r: 1.0 });
  }

  // neck & head (looking out over the crowd, jaws wide open)
  const neck = new THREE.CatmullRomCurve3([V(0, 8.4, -13.8), V(0, 9.4, -12.7), V(0, 10.0, -11.6)]);
  sh.surface(tube(neck, 1.5, 1.1));
  sh.surface(ellipsoid(V(0, 10.2, -11.2), V(1.25, 1.15, 1.35)));
  const skullCore = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), woodB);
  skullCore.scale.set(1.15, 1.05, 1.25);
  skullCore.position.set(0, 10.2, -11.2);
  g.add(skullCore);
  const jawPart = (rt, rb, len, base, ang, material) => {
    const geo = new THREE.CylinderGeometry(rt, rb, len, 4);
    geo.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(geo, material);
    const d = V(0, Math.cos(ang), Math.sin(ang));
    m.position.copy(base).addScaledVector(d, len / 2);
    m.rotation.x = ang;
    m.castShadow = true;
    g.add(m);
    return { d, base };
  };
  const upper = jawPart(0.35, 0.85, 2.4, V(0, 10.35, -10.1), Math.PI / 2 - 0.3, woodC);
  const lower = jawPart(0.3, 0.7, 2.1, V(0, 9.65, -10.2), Math.PI / 2 + 0.35, woodA);
  g.add(box(0.9, 0.5, 1.2, mat('#2a1208'), 0, 9.95, -9.6)); // throat
  const toothMat = mat('#f2ead8');
  for (const [jaw, len, r0, r1, dir] of [[upper, 2.4, 0.85, 0.35, -1], [lower, 2.1, 0.7, 0.3, 1]]) {
    const perp = V(0, -jaw.d.z, jaw.d.y).multiplyScalar(-dir); // points into the mouth
    for (const t of [0.6, 1.1, 1.6, 2.0]) {
      const r = r0 + (r1 - r0) * (t / len);
      for (const x of [-1, 1]) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.38, 4), toothMat);
        tooth.position.copy(jaw.base).addScaledVector(jaw.d, t).addScaledVector(perp, r * 0.6);
        tooth.position.x = x * r * 0.45;
        if (dir < 0) tooth.rotation.x = Math.PI;
        g.add(tooth);
      }
    }
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ff7a00', emissiveIntensity: 1.2 });
  const hornMat = mat('#e6cf9a');
  const tarp = new THREE.MeshStandardMaterial({ color: '#6e6b63', side: THREE.DoubleSide, roughness: 1 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), eyeMat);
    eye.position.set(s * 0.8, 10.65, -10.3);
    g.add(eye);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.8, 6), hornMat);
    horn.position.set(s * 0.75, 11.4, -11.7);
    horn.rotation.set(-0.5, 0, -s * 0.35);
    horn.castShadow = true;
    g.add(horn);
    // grey spiky frill behind the jaws
    for (let k = 0; k < 3; k++) {
      const a = V(s * 0.95, 10.9 - k * 0.5, -11.6), b = V(s * 0.9, 10.4 - k * 0.5, -12.3);
      const tip = [V(s * 2.2, 12.2, -11.9), V(s * 2.8, 11.0, -12.0), V(s * 2.3, 9.7, -12.2)][k];
      const geo = new THREE.BufferGeometry().setFromPoints([a, b, tip]);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, tarp));
      g.add(strut(a, tip, 0.05, woodB));
    }
  }
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.6, 4), woodC);
  crest.position.set(0, 12.3, -11.5);
  crest.rotation.x = -0.2;
  crest.castShadow = true;
  g.add(crest);
  g.userData.eyeMat = eyeMat;
  g.add(sh.build());

  // ---------------------------------------------------------------- wings: log frame + grey tarp,
  // draped down to the ground with two arched entrances on each side
  const logMat = woodMat('#a87a48');
  const pink = new THREE.MeshStandardMaterial({ color: '#ff3a8a', emissive: '#ff2a7a', emissiveIntensity: 1.4 });
  const horn = (pos, rx, rz, h = 1.3) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.18, h, 6), hornMat);
    m.position.copy(pos);
    m.rotation.set(rx, 0, rz);
    m.castShadow = true;
    g.add(m);
  };
  for (const s of [-1, 1]) {
    const S = V(s * 4.8, 7.9, -15.6), W = V(s * 8, 10.4, -16.2), T = V(s * 12.3, 8.4, -15.6), G = V(s * 13.4, 0, -13.6);
    const B = [V(s * 5.4, 3.6, -15.2), V(s * 8.5, 3.6, -15.2), V(s * 11.2, 3.6, -15.2), T.clone().lerp(G, 0.5)];
    const fan = [S, B[0], B[1], B[2], B[3], T];
    for (let i = 0; i < fan.length - 1; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([W, fan[i], fan[i + 1]]);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, tarp);
      m.castShadow = true;
      g.add(m);
    }
    g.add(strut(S, W, 0.2, logMat), strut(W, T, 0.17, logMat), strut(T, G, 0.17, logMat));
    for (const b of B.slice(0, 3)) g.add(strut(W, b, 0.1, logMat));
    horn(W.clone().add(V(0, 0.7, 0)), 0, -s * 0.15);
    horn(T.clone().add(V(s * 0.25, 0.5, 0)), 0, -s * 0.5);
    horn(B[3].clone().add(V(s * 0.3, 0, 0)), 0, -s * 1.2, 1.0);
    colliders.push({ type: 'circle', x: G.x, z: G.z, r: 0.35 });

    // tarp down to the ground with two arches, black tent behind
    const shape = new THREE.Shape();
    shape.moveTo(5.4, 0); shape.lineTo(13.1, 0); shape.lineTo(12.85, 3.6); shape.lineTo(5.4, 3.6); shape.closePath();
    for (const cx of [7.3, 10.4]) {
      const hole = new THREE.Path();
      hole.moveTo(cx - 1.2, 0); hole.lineTo(cx + 1.2, 0); hole.lineTo(cx + 1.2, 1.5);
      hole.absarc(cx, 1.5, 1.2, 0, Math.PI, false);
      hole.lineTo(cx - 1.2, 0);
      shape.holes.push(hole);
      for (const k of [-1, 1]) g.add(strut(V(s * (cx - 0.8 * k), 0.3, -15.9), V(s * (cx + 0.8 * k), 2.3, -15.9), 0.025, pink));
    }
    const panel = new THREE.Mesh(new THREE.ShapeGeometry(shape), tarp);
    panel.scale.x = s;
    panel.position.z = -15.2;
    panel.castShadow = true;
    g.add(panel);
    g.add(box(7.4, 3.6, 2.8, mat('#111114'), s * 9.1, 1.8, -16.7));
    colliders.push({ type: 'box', x: s * 9.1, z: -16.5, hw: 3.8, hd: 1.5, rot: 0 });

    // red speaker stacks on tripods next to the wings
    const sx = s * 13.8, sz = -11.4;
    g.add(cyl(0.08, 0.11, 5.6, mat('#1a1a1a'), 6, sx, 2.8, sz));
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      g.add(strut(V(sx, 1.3, sz), V(sx + Math.cos(a), 0, sz + Math.sin(a)), 0.04, mat('#1a1a1a')));
    }
    g.add(box(1.1, 1.7, 1.0, mat('#7d1426'), sx, 6.3, sz));
    g.add(box(0.8, 1.3, 0.05, mat('#3a0a12'), sx, 6.3, sz + 0.51));
    colliders.push({ type: 'circle', x: sx, z: sz, r: 0.7 });
  }

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

  // ---------------------------------------------------------------- two half-round stretch tents beside the dance floor
  for (const s of [-1, 1]) {
    const t = halfRoundTent();
    t.object.position.set(s * 17.5, 0, 2);
    if (s < 0) t.object.rotation.y = Math.PI; // the straight, high edge always faces the dance floor
    g.add(t.object);
    for (const c of t.colliders) {
      const x = s < 0 ? -c.x : c.x, z = s < 0 ? -c.z : c.z;
      colliders.push({ ...c, x: s * 17.5 + x, z: 2 + z });
    }
  }

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

// ------------------------------------------------------------------ dragon helpers
// parametric surfaces return { p: point, c: a point inside (to orient normals outwards) }
function ellipsoid(c, r, t0 = 0, t1 = Math.PI) {
  return (u, v) => {
    const ph = u * Math.PI * 2, th = t0 + (t1 - t0) * v;
    return { p: new THREE.Vector3(c.x + r.x * Math.sin(th) * Math.cos(ph), c.y + r.y * Math.cos(th), c.z + r.z * Math.sin(th) * Math.sin(ph)), c };
  };
}

function tube(curve, r0, r1) {
  const ref = new THREE.Vector3(1, 0, 0);
  return (u, v) => {
    const c = curve.getPointAt(v), t = curve.getTangentAt(v);
    const b1 = new THREE.Vector3().crossVectors(t, ref).normalize();
    const b2 = new THREE.Vector3().crossVectors(t, b1);
    const r = r0 + (r1 - r0) * v, a = u * Math.PI * 2;
    return { p: c.clone().addScaledVector(b1, Math.cos(a) * r).addScaledVector(b2, Math.sin(a) * r), c };
  };
}

function paramMesh(P, nu, nv, material) {
  const verts = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const { p } = P(i / nu, j / nv); verts.push(p.x, p.y, p.z); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/** Overlapping oval wood shingles (sawn log slices with bark rim) laid over parametric surfaces – one InstancedMesh. */
function makeShingles() {
  const list = [];
  const len = (pts) => pts.reduce((s, q, i) => (i ? s + q.distanceTo(pts[i - 1]) : 0), 0);
  const e = 1e-3;
  return {
    surface(P, tu = 0.5, tv = 0.62) {
      const col = [];
      for (let k = 0; k <= 24; k++) col.push(P(0.5, k / 24).p);
      const colLen = len(col), nv = Math.max(2, Math.ceil(colLen / tv));
      for (let j = 0; j < nv; j++) {
        const v = (j + 0.5) / nv;
        const row = [];
        for (let k = 0; k <= 24; k++) row.push(P(k / 24, v).p);
        const rowLen = len(row), nu = Math.max(3, Math.ceil(rowLen / tu));
        for (let i = 0; i < nu; i++) {
          const u = Math.min(1, (i + 0.5 + (j % 2) * 0.5 + (Math.random() - 0.5) * 0.25) / nu);
          const { p, c } = P(u, v);
          const du = P(Math.min(1, u + e), v).p.sub(P(Math.max(0, u - e), v).p);
          const dv = P(u, Math.min(1, v + e)).p.sub(P(u, Math.max(0, v - e)).p);
          const n = new THREE.Vector3().crossVectors(du, dv);
          if (n.lengthSq() < 1e-14) n.subVectors(p, c);
          n.normalize();
          if (n.dot(new THREE.Vector3().subVectors(p, c)) < 0) n.negate();
          list.push({ p: p.addScaledVector(n, 0.05), n, dv: dv.normalize(), su: rowLen / nu, sv: colLen / nv });
        }
      }
    },
    build() {
      const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 9);
      const face = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true });
      const bark = new THREE.MeshStandardMaterial({ color: '#6a4626', roughness: 1, flatShading: true });
      const im = new THREE.InstancedMesh(geo, [bark, face, face], list.length);
      const cols = ['#e2bd86', '#d4a86c', '#c8955a', '#b98447', '#e8c99a', '#a87440'].map((c) => new THREE.Color(c));
      const m = new THREE.Matrix4(), tilt = new THREE.Matrix4().makeRotationX(-0.3), sc = new THREE.Matrix4();
      const down = new THREE.Vector3(0, -1, 0), x = new THREE.Vector3();
      list.forEach((s, i) => {
        const d = down.clone().addScaledVector(s.n, -s.n.dot(down));
        if (d.length() < 0.25) d.copy(s.dv);
        d.normalize();
        x.crossVectors(s.n, d);
        const k = 0.85 + Math.random() * 0.3;
        m.makeBasis(x, s.n, d).multiply(tilt)
          .multiply(sc.makeScale(THREE.MathUtils.clamp(s.su * 1.45, 0.3, 0.85) * k, 1, THREE.MathUtils.clamp(s.sv * 1.7, 0.45, 1.05) * k))
          .setPosition(s.p);
        im.setMatrixAt(i, m);
        im.setColorAt(i, cols[(Math.random() * cols.length) | 0]);
      });
      im.castShadow = im.receiveShadow = true;
      return im;
    },
  };
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

/**
 * Half-round (D-shaped) beige stretch tent: the straight edge (local x = 0, along z) is high and open,
 * the round side bulges out to +x and comes down low, held by short poles and guy ropes.
 */
function halfRoundTent({ L = 14, R = 6, HI = 3.8, LO = 2.0 } = {}) {
  const g = new THREE.Group();
  const colliders = [];
  const NU = 24, NV = 10;
  const P = (u, v) => {
    const z = (u - 0.5) * L, x = v * R * Math.sin(Math.PI * u) ** 0.6;
    const y = HI + (LO - HI) * v - 0.45 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
    return [x, y, z];
  };
  const verts = [], idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) verts.push(...P(i / NU, j / NV));
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const sail = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#dcc89e', roughness: 0.95, side: THREE.DoubleSide }));
  sail.castShadow = true;
  g.add(sail);
  const pole = mat('#8a6a42'), rope = mat('#d8cfb8');
  for (const u of [0.04, 0.5, 0.96]) { // high poles along the open edge
    const [x, y, z] = P(u, 0);
    g.add(cyl(0.08, 0.1, y, pole, 6, x, y / 2, z));
    colliders.push({ type: 'circle', x, z, r: 0.2 });
    if (u !== 0.5) g.add(strut(new THREE.Vector3(x, y, z), new THREE.Vector3(x - 1.2, 0, z + Math.sign(z) * 1.8), 0.015, rope, 4));
  }
  for (const u of [0.2, 0.4, 0.6, 0.8]) { // low poles on the round side + guy ropes outwards
    const [x, y, z] = P(u, 1);
    g.add(cyl(0.05, 0.06, y, pole, 6, x, y / 2, z));
    colliders.push({ type: 'circle', x, z, r: 0.15 });
    g.add(strut(new THREE.Vector3(x, y, z), new THREE.Vector3(x * 1.35, 0, z * 1.25), 0.015, rope, 4));
  }
  return { object: g, colliders };
}
