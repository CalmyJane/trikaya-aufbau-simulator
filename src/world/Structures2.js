import * as THREE from 'three';
import { mat, box, cyl, strut, signPost, textPlane, dixi } from './Props.js';
import { woodMat } from './Mainstage.js';

// More buildables: awareness tent, Forest Dome stage, Harry's mapping sculpture, WC container.

// ------------------------------------------------------------------ Awareness tent (Franzi)
export function buildAwarenessTent() {
  const g = new THREE.Group();
  const colliders = [];
  const R = 4.2, H = 2.2;
  const fabric = new THREE.MeshStandardMaterial({ color: '#efe6f7', roughness: 0.95, side: THREE.DoubleSide });
  // wall with a doorway towards +z
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 24, 1, true, Math.PI * 0.12, Math.PI * 1.76), fabric);
  wall.position.y = H / 2;
  g.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(R + 0.3, 2.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#8a5ab8', roughness: 0.9, side: THREE.DoubleSide }));
  roof.position.y = H + 1.1;
  g.add(roof);
  g.add(cyl(0.12, 0.12, H + 2, mat('#8a6a4a'), 8, 0, (H + 2) / 2, 0));
  // soft floor, cushions, blankets, water
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - 0.1, 24), mat('#c9b8e0'));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.03;
  g.add(floor);
  const cols = ['#e8a0c0', '#a0d0e8', '#c0e8a0', '#f0d890', '#d0a0f0'];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 0.3 + (i / 8) * Math.PI * 1.4;
    const c = box(0.9, 0.3, 0.9, mat(cols[i % cols.length]), Math.sin(a) * 2.9, 0.16, -Math.cos(a) * 2.9);
    c.rotation.y = a;
    g.add(c);
  }
  g.add(cyl(0.18, 0.18, 0.5, mat('#9fd3f0', { transparent: true, opacity: 0.7 }), 10, 1.5, 1.05, -2.2)); // water jug
  g.add(box(0.8, 0.8, 0.5, mat('#ffffff'), 1.5, 0.4, -2.2));
  const cross = box(0.4, 0.12, 0.02, mat('#2eaf5a'), 1.5, 0.6, -1.94); g.add(cross);
  const cross2 = box(0.12, 0.4, 0.02, mat('#2eaf5a'), 1.5, 0.6, -1.94); g.add(cross2);
  // colliders: ring with doorway
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
    const x = Math.sin(a) * R, z = Math.cos(a) * R;
    if (z > R * 0.75) continue;
    colliders.push({ type: 'circle', x, z, r: 0.7 });
  }
  const s = signPost('AWARENESS', { width: 2.6, height: 1.3, bg: '#8a5ab8', fg: '#ffffff' });
  s.position.set(3.5, 0, R + 1.6);
  s.rotation.y = -0.3;
  g.add(s);
  return { object: g, colliders };
}

// ------------------------------------------------------------------ Forest Dome stage (Fabbe)
/**
 * Fabbe's Forest Dome: two white half-round tents (a dome cut in half and pulled apart),
 * open towards each other. The stage sits in the gap; Harry's mapping facade goes behind it.
 * A loose ring of wooden benches around the front.
 */
export function buildForestDome() {
  const g = new THREE.Group();
  const colliders = [];
  const R = 5.6, GAP = 3.6, SQ = 0.66; // half-dome radius, half gap width, height squash
  const canvas = new THREE.MeshStandardMaterial({ color: '#f1ede2', roughness: 0.95, side: THREE.DoubleSide });
  const pole = woodMat('#8a6236');
  const bulb = new THREE.MeshStandardMaterial({ color: '#ffe8a0', emissive: '#ffcc55', emissiveIntensity: 1.2 });
  const bulbGeo = new THREE.SphereGeometry(0.07, 5, 4);
  for (const s of [-1, 1]) {
    const cx = s * GAP;
    // half dome, closed towards the outside, open towards the gap
    const half = new THREE.Mesh(new THREE.SphereGeometry(R, 22, 9, s < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI, 0, Math.PI / 2), canvas);
    half.scale.y = SQ;
    half.position.x = cx;
    half.castShadow = true;
    g.add(half);
    // timber arch along the open edge + ribs
    const arch = new THREE.Mesh(new THREE.TorusGeometry(R, 0.13, 6, 24, Math.PI), pole);
    arch.scale.y = SQ;
    arch.rotation.y = Math.PI / 2;
    arch.position.x = cx;
    g.add(arch);
    for (const off of [-Math.PI / 3, 0, Math.PI / 3]) { // quarter-arc ribs from the ground up to the top
      const rib = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.07, 5, 10, Math.PI / 2), pole);
      rib.scale.y = SQ;
      rib.rotation.y = (s < 0 ? Math.PI : 0) + off;
      rib.position.x = cx;
      g.add(rib);
    }
    // fairy lights hanging along the arch
    for (let i = 1; i < 16; i++) {
      const a = (i / 16) * Math.PI;
      const b = new THREE.Mesh(bulbGeo, bulb);
      b.position.set(cx - s * 0.15, Math.sin(a) * R * SQ - 0.2, Math.cos(a) * R);
      g.add(b);
    }
    // the curved canvas wall blocks, the open side stays walkable
    for (let a = -Math.PI / 2; a <= Math.PI / 2 + 0.01; a += Math.PI / 10) {
      colliders.push({ type: 'circle', x: cx + s * Math.cos(a) * (R - 0.4), z: Math.sin(a) * (R - 0.4), r: 0.6 });
    }
    // cushions & a carpet inside
    const rug = new THREE.Mesh(new THREE.CircleGeometry(R - 1, 20, s < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), mat(s < 0 ? '#8a3a3a' : '#2e6b5e'));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(cx, 0.03, 0);
    g.add(rug);
  }
  // stage in the gap, at the back
  g.add(box(2 * GAP - 0.4, 0.8, 3.6, mat('#a07040'), 0, 0.4, -4.6));
  colliders.push({ type: 'box', x: 0, z: -4.6, hw: GAP - 0.2, hd: 1.8, rot: 0 });
  g.add(box(2.2, 0.9, 0.8, mat('#5a3a1a'), 0, 1.25, -4.2));
  g.add(box(2, 0.05, 0.6, mat('#222'), 0, 1.72, -4.2));
  for (const x of [-2.1, 2.1]) g.add(box(0.9, 1.6, 0.8, mat('#1a1a1a'), x, 1.6, -5.6));
  // ring of wooden benches around the front
  const bench = woodMat('#b98a55');
  for (let i = 0; i < 9; i++) {
    const a = -1.25 + (i / 8) * 2.5;
    if (Math.abs(a) < 0.3) continue; // way in
    const x = Math.sin(a) * 12, z = Math.cos(a) * 12 - 1;
    const b = new THREE.Group();
    b.add(box(2.4, 0.08, 0.4, bench, 0, 0.45, 0));
    for (const bx of [-1, 1]) b.add(box(0.1, 0.45, 0.35, bench, bx, 0.22, 0));
    b.position.set(x, 0, z);
    b.rotation.y = a;
    g.add(b);
    colliders.push({ type: 'box', x, z, hw: 1.2, hd: 0.25, rot: a });
  }
  const s = signPost('FOREST DOME', { width: 2.4, height: 0.9, bg: '#1f3a1f', fg: '#b8f0a0' });
  s.position.set(4.5, 0, 12.5);
  s.rotation.y = -0.3;
  g.add(s);
  return { object: g, colliders };
}

// ------------------------------------------------------------------ Harry's mapping installation
function hexPath(r, rot = Math.PI / 6) {
  const p = new THREE.Path();
  for (let i = 0; i <= 6; i++) { const a = rot + (i / 6) * Math.PI * 2; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return p;
}

/** Laser-cut plywood print: ochre wood with white/grey geometric inlays (lens facade or round mandala). */
function plywoodTexture(round) {
  const c = document.createElement('canvas');
  c.width = round ? 512 : 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height, cx = W / 2, cy = H / 2;
  ctx.fillStyle = '#c98a3a'; ctx.fillRect(0, 0, W, H);
  const light = '#ece6da', grey = '#a8a49c', dark = '#7a4a1a';
  ctx.lineJoin = 'round';
  if (round) {
    for (let ring = 5; ring >= 1; ring--) {
      const R = ring * 48, n = 6 + ring * 2;
      for (let i = 0; i < n; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate((i / n) * Math.PI * 2 + ring * 0.2);
        ctx.beginPath(); ctx.moveTo(-10, R - 30); ctx.lineTo(10, R - 30); ctx.lineTo(16, R + 8); ctx.lineTo(-16, R + 8); ctx.closePath();
        ctx.fillStyle = ring % 2 ? light : grey; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }
    }
    // central star with honeycomb
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 60); ctx.lineTo(0, 95); ctx.lineTo(-18, 60); ctx.closePath();
      ctx.fillStyle = grey; ctx.fill(); ctx.strokeStyle = dark; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fillStyle = light; ctx.fill();
    ctx.restore();
  } else {
    // stripes and chevrons around the lens, snakes towards the window
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const x = cx + Math.cos(a) * W * 0.44, y = cy + Math.sin(a) * H * 0.4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = i % 2 ? light : grey;
      ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(14, -18); ctx.lineTo(4, 18); ctx.lineTo(-24, 18); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save(); ctx.translate(cx + Math.cos(a) * 150, cy + Math.sin(a) * 130); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 46, 16, 0, 0, 7); ctx.fillStyle = grey; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90); ctx.lineTo(cx + Math.cos(a + 0.4) * 210, cy + Math.sin(a + 0.4) * 190); ctx.lineTo(cx + Math.cos(a - 0.4) * 210, cy + Math.sin(a - 0.4) * 190); ctx.closePath();
      ctx.fillStyle = light; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Colourful psy stretch print for the side wings. */
function psyTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grd = ctx.createLinearGradient(0, 0, 256, 256);
  ['#5a2a8a', '#2a8ab0', '#39c46a', '#e0c020', '#e04a8a', '#5a2a8a'].forEach((col, i) => grd.addColorStop(i / 5, col));
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    const px = x * 30 + (y % 2) * 15, py = y * 27;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.lineTo(px + Math.cos(a) * 10, py + Math.sin(a) * 10); }
    ctx.strokeStyle = 'rgba(255,240,120,0.8)'; ctx.lineWidth = 2; ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Harry's installation in the gap of the Forest Dome (like the real one): a wide laser-cut plywood
 * lens with a hexagonal DJ window and two big mandala discs, under a black tarp roof on timber,
 * line arrays on both sides, psy stretch wings. Plain wood by day, 3D-mapped at night.
 */
export function buildMappingDeco() {
  const g = new THREE.Group();
  const colliders = [];
  const Z = -8.4, Y = 3.7; // facade plane and lens centre height
  const uniforms = { uTime: { value: 0 }, uMap: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAxis: { value: new THREE.Vector3(1, 0, 0) } };
  const mapped = (opts) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, ...opts });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uTime;\nuniform float uMap;\nuniform vec3 uCenter;\nuniform vec3 uAxis;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          vec3 dw = vWPos - uCenter;
          vec2 lp = vec2(dot(dw, uAxis), dw.y);
          float r = length(lp);
          float wave = sin(r * 1.6 - uTime * 3.0) * 0.5 + 0.5;
          float stripes = step(0.5, fract(lp.y * 0.6 + uTime * 0.4 + sin(lp.x * 0.5) * 0.4));
          float phase = floor(mod(uTime * 0.2, 3.0));
          vec3 pal = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + r * 0.08 - uTime * 0.15));
          pal = pow(pal, vec3(2.2)); // saturated neon
          float w3 = pow(wave, 3.0);
          float pat = phase < 1.0 ? w3 : (phase < 2.0 ? stripes * (0.3 + 0.7 * w3) : smoothstep(0.35, 0.4, fract(r * 0.35 - uTime * 0.5)) * w3);
          totalEmissiveRadiance += pal * pat * uMap * 1.4 * (0.6 + 0.4 * diffuseColor.r);
          diffuseColor.rgb *= 1.0 - 0.75 * uMap; // projector dominates, wood goes dark`);
    };
    return m;
  };
  const edge = mapped({ color: '#a8732e' });
  const fac = new THREE.Group();
  fac.position.set(0, 0, Z);
  g.add(fac);

  // black curtain under the lens (the DJ climbs in from behind)
  fac.add(box(11.5, 1.6, 0.15, mat('#121212'), 0, 0.8, -0.1));
  // the lens with the hexagonal window
  const lens = new THREE.Shape();
  lens.absellipse(0, 0, 6.2, 2.5, 0, Math.PI * 2, false, 0);
  lens.holes.push(hexPath(1.3));
  const lensTex = plywoodTexture(false);
  lensTex.repeat.set(1 / 12.4, 1 / 5);
  lensTex.offset.set(0.5, 0.5);
  const lensMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(lens, { depth: 0.3, bevelEnabled: false, curveSegments: 28 }), [mapped({ color: '#ffffff', map: lensTex }), edge]);
  lensMesh.position.set(0, Y, 0);
  lensMesh.castShadow = true;
  fac.add(lensMesh);
  // hexagon frame around the window
  const frame = new THREE.Shape(hexPath(1.75).getPoints());
  frame.holes.push(hexPath(1.3));
  const frameMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.2, bevelEnabled: false }), mapped({ color: '#ddd6c8' }));
  frameMesh.position.set(0, Y, 0.3);
  fac.add(frameMesh);
  // psychedelic backdrop + DJ desk behind the window
  const back = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.8), new THREE.MeshStandardMaterial({ map: psyTexture(), emissive: '#ffffff', emissiveMap: psyTexture(), emissiveIntensity: 0.25 }));
  back.position.set(0, Y, -1.4);
  fac.add(back);
  fac.add(box(2.2, 0.15, 0.7, mat('#222'), 0, Y - 1.05, -0.6));
  // two big mandala discs
  const discTex = plywoodTexture(true);
  for (const x of [-4.4, 4.4]) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.35, 36), [edge, mapped({ color: '#ffffff', map: discTex }), edge]);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, Y, 0.35);
    disc.castShadow = true;
    fac.add(disc);
  }
  // timber frame + black tarp roof with beams sticking out
  const timber = woodMat('#c9a26a');
  for (const x of [-6.3, -1.9, 1.9, 6.3]) fac.add(box(0.18, 7.0, 0.18, timber, x, 3.5, -0.9));
  fac.add(box(13, 0.2, 0.2, timber, 0, 6.4, -0.7));
  fac.add(box(9, 0.2, 0.2, timber, 0, 7.4, -1.6));
  fac.add(strut(new THREE.Vector3(-6.3, 6.4, -0.7), new THREE.Vector3(-9.2, 9.6, 0.4), 0.12, timber));
  fac.add(strut(new THREE.Vector3(6.3, 6.4, -0.7), new THREE.Vector3(9.2, 9.6, 0.4), 0.12, timber));
  fac.add(strut(new THREE.Vector3(0, 6.4, -0.7), new THREE.Vector3(0.3, 9.3, 0.2), 0.12, timber));
  const tarpPts = [
    [-7.6, 8.6, 0.3], [0, 7.6, 0.0], [7.6, 8.6, 0.3], // front edge, corners up
    [-7.0, 7.4, -3.2], [0, 6.9, -3.2], [7.0, 7.4, -3.2], // back edge
  ].map((p) => new THREE.Vector3(...p));
  const tarpGeo = new THREE.BufferGeometry().setFromPoints([0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4].map((i) => tarpPts[i]));
  tarpGeo.computeVertexNormals();
  const tarp = new THREE.Mesh(tarpGeo, new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 1, side: THREE.DoubleSide }));
  tarp.castShadow = true;
  fac.add(tarp);
  // psy stretch wings down to the ground
  const psy = new THREE.MeshStandardMaterial({ map: psyTexture(), side: THREE.DoubleSide, roughness: 0.9, emissive: '#ffffff', emissiveMap: psyTexture(), emissiveIntensity: 0.12 });
  for (const s of [-1, 1]) {
    const pts = [new THREE.Vector3(s * 5.6, 4.6, 0.1), new THREE.Vector3(s * 5.6, 1.4, 0.1), new THREE.Vector3(s * 11, 0.1, 2.2), new THREE.Vector3(s * 9.5, 3.2, 1.0)];
    const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1], 2));
    geo.computeVertexNormals();
    fac.add(new THREE.Mesh(geo, psy));
    // line array on a stand
    const la = new THREE.Group();
    la.position.set(s * 7.6, 0, -0.4);
    la.add(cyl(0.09, 0.12, 4.2, mat('#1a1a1a'), 6, 0, 2.1, 0));
    la.add(box(0.5, 0.15, 0.5, mat('#1a1a1a'), 0, 0.08, 0));
    for (let k = 0; k < 3; k++) {
      const cab = box(1.1, 0.55, 0.85, mat('#161616'), 0, 4.6 + k * 0.58, 0.05 * k);
      cab.rotation.x = -0.06 * k;
      la.add(cab);
    }
    fac.add(la);
    colliders.push({ type: 'circle', x: s * 7.6, z: Z - 0.4, r: 0.5 });
  }
  colliders.push({ type: 'box', x: 0, z: Z - 0.5, hw: 6.4, hd: 0.7, rot: 0 });

  // projector tower in front of the dance floor, aimed at the lens
  const tower = new THREE.Group();
  const T = new THREE.Vector3(1.6, 0, 10.5);
  tower.position.copy(T);
  tower.add(cyl(0.08, 0.08, 4, mat('#555'), 6, 0, 2, 0));
  tower.add(box(0.8, 0.5, 0.9, mat('#222'), 0, 4.2, 0));
  const beamGeo = new THREE.ConeGeometry(6.5, 1, 20, 1, true);
  beamGeo.translate(0, -0.5, 0); // apex at the projector
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  const from = new THREE.Vector3(T.x, 4.3, T.z), to = new THREE.Vector3(0, Y, Z);
  const dir = to.clone().sub(from);
  beam.scale.set(1, dir.length(), 1);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  beam.position.set(0, 4.3, 0);
  tower.add(beam);
  g.add(tower);
  colliders.push({ type: 'circle', x: T.x, z: T.z, r: 0.4 });

  g.userData.mapping = { uniforms, beam };
  g.userData.animate = (t) => {
    uniforms.uTime.value = t;
    // mapping coordinates relative to the lens centre, in the facade's own plane
    fac.localToWorld(uniforms.uCenter.value.set(0, Y, 0));
    uniforms.uAxis.value.set(1, 0, 0).applyQuaternion(g.quaternion);
  };
  return { object: g, colliders };
}

// ------------------------------------------------------------------ WC container + Hebepumpe
export function buildWcContainer() {
  const g = new THREE.Group();
  const colliders = [];
  g.add(box(6, 2.6, 2.44, mat('#e8ecef', { roughness: 0.6 }), 0, 1.4, 0));
  g.add(box(6.1, 0.12, 2.5, mat('#9aa0a6'), 0, 2.76, 0));
  for (const [x, label] of [[-1.5, 'DAMEN'], [1.5, 'HERREN']]) {
    g.add(box(0.9, 2, 0.05, mat('#2f6fb3'), x, 1.15, 1.23));
    const l = textPlane(label, 0.9, 0.25, { w: 256, h: 72, bg: '#ffffff', fg: '#2f6fb3', font: 'bold 44px sans-serif' });
    l.position.set(x, 2.35, 1.25);
    g.add(l);
    g.add(box(1.2, 0.3, 0.7, mat('#8a8a80'), x, 0.15, 1.6)); // step
  }
  // the famous "Kackepumpe" (lifting pump) with pipe
  const pump = new THREE.Group();
  pump.add(box(0.8, 0.7, 0.8, mat('#e0a020'), 0, 0.35, 0));
  const pipe = cyl(0.1, 0.1, 3.2, mat('#555'), 6, 0, 0.3, 0);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(-1.8, 0.3, 0);
  pump.add(pipe);
  const lbl = textPlane('HEBEPUMPE', 0.7, 0.18, { w: 256, h: 64, bg: '#222', fg: '#ffd400', font: 'bold 40px sans-serif' });
  lbl.position.set(0, 0.55, 0.41);
  pump.add(lbl);
  pump.position.set(3.8, 0, 0.5);
  g.add(pump);
  colliders.push({ type: 'box', x: 0, z: 0, hw: 3.05, hd: 1.25, rot: 0 });
  colliders.push({ type: 'circle', x: 3.8, z: 0.5, r: 0.6 });
  return { object: g, colliders };
}

// ------------------------------------------------------------------ Dixi row (delivered on a pallet)
export function buildDixiRow({ n = 4 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const d = dixi(i === 0 ? '#2e8b57' : '#2f6fb3');
    d.position.x = (i - (n - 1) / 2) * 1.3;
    g.add(d);
  }
  return { object: g, colliders: [{ type: 'box', x: 0, z: 0, hw: n * 0.65 + 0.1, hd: 0.65, rot: 0 }] };
}

// ------------------------------------------------------------------ Firespace with the wooden Shiva
/**
 * Fire pit with log benches; at the (local −z) edge sits a big wooden Shiva with trident,
 * looking across the fire (+z). Placed with rotation π so he faces north.
 */
export function buildFirespace() {
  const g = new THREE.Group();
  const colliders = [];
  const spots = {};
  // ---- performance circle in front of the statue: packed sand, ringed with LED stakes
  const STAGE = { x: 0, z: -0.6, r: 4.2 };
  const sand = new THREE.Mesh(new THREE.CircleGeometry(STAGE.r, 40), mat('#cdb88e', { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(STAGE.x, 0.04, STAGE.z);
  sand.receiveShadow = true;
  g.add(sand);
  const ringLeds = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const x = STAGE.x + Math.cos(a) * (STAGE.r + 0.25), z = STAGE.z + Math.sin(a) * (STAGE.r + 0.25);
    g.add(cyl(0.035, 0.04, 0.45, mat('#5a3a1a'), 5, x, 0.22, z));
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff8a2a' }));
    led.position.set(x, 0.48, z);
    g.add(led);
    ringLeds.push(led);
  }
  spots.fire_stage = [STAGE.x, STAGE.z];
  spots.fire_slot_1 = [-2.3, -1.4];
  spots.fire_slot_2 = [0.3, 1.1];
  spots.fire_slot_3 = [2.5, -1.9];
  spots.fire_slot_4 = [-0.4, -3.2];

  // ---- home-made wooden grandstands (left & right, from last year) – reinforced in Georg's job
  const old = mat('#8f7a62'), oldDark = mat('#6e5c48'), fresh = woodMat('#e2c18a');
  const fixParts = []; // [index] → objects that appear once that target is reinforced
  const TRIB = [-62, -108, 62, 108].map((deg) => {
    const a = (deg * Math.PI) / 180, R = 8.3;
    return { x: Math.sin(a) * R, z: STAGE.z + Math.cos(a) * R, rot: a + Math.PI };
  });
  TRIB.forEach((t, i) => {
    const tg = new THREE.Group();
    tg.position.set(t.x, 0, t.z);
    tg.rotation.y = t.rot;
    g.add(tg);
    const W = 4.6;
    // three tiers rising to the back (-z), seat boards + foot boards
    for (let k = 0; k < 3; k++) {
      const y = 0.45 + k * 0.45, z = 0.6 - k * 0.75;
      const seat = box(W, 0.06, 0.32, old, 0, y, z);
      seat.rotation.z = (i % 2 ? 1 : -1) * 0.012 * (k + 1); // last year's sag
      tg.add(seat);
      tg.add(box(W, 0.04, 0.3, oldDark, 0, y - 0.28, z + 0.36));
      for (const x of [-W / 2 + 0.2, 0, W / 2 - 0.2]) tg.add(box(0.1, y, 0.1, oldDark, x, y / 2, z)); // posts
    }
    for (const s of [-1, 1]) { // side stringers
      const st = box(0.08, 0.18, 2.5, oldDark, s * (W / 2 - 0.05), 0.95, -0.15);
      st.rotation.x = 0.55;
      tg.add(st);
    }
    const loose = box(1.6, 0.05, 0.25, old, 1.3, 1.36, -0.85); // a loose board
    loose.rotation.set(0.25, 0.3, 0.08);
    tg.add(loose);
    // reinforcement: fresh diagonal braces, extra posts, a new back rail
    const fix = new THREE.Group();
    for (const s of [-1, 1]) {
      fix.add(strut(new THREE.Vector3(s * (W / 2 - 0.25), 0.05, 0.7), new THREE.Vector3(s * (W / 2 - 0.25), 1.3, -0.9), 0.05, fresh));
      fix.add(strut(new THREE.Vector3(s * 0.3, 0.05, -0.9), new THREE.Vector3(s * (W / 2 - 0.4), 1.25, -0.9), 0.045, fresh));
    }
    for (const x of [-1.1, 1.1]) for (let k = 0; k < 3; k++) { const y = 0.45 + k * 0.45; fix.add(box(0.12, y, 0.12, fresh, x, y / 2, 0.6 - k * 0.75 - 0.12)); }
    fix.add(box(W, 0.12, 0.1, fresh, 0, 2.2, -1.0));
    for (const s of [-1, 1]) fix.add(box(0.1, 2.2, 0.1, fresh, s * (W / 2 - 0.05), 1.1, -1.0));
    fix.visible = false;
    tg.add(fix);
    fixParts[i + 1] = [fix];
    loose.userData.hideWhenFixed = i + 1;
    fixParts[i + 1].push(loose);
    // collider (whole stand) – world rot = local rot + structure rotation, like every other box collider
    colliders.push({ type: 'box', x: t.x - Math.sin(t.rot) * 0.3, z: t.z - Math.cos(t.rot) * 0.3, hw: W / 2, hd: 1.35, rot: t.rot });
    // work spot in front of the stand (stage side)
    spots[`fire_fix_${i + 2}`] = [t.x + Math.sin(t.rot) * 1.9, t.z + Math.cos(t.rot) * 1.9];
  });

  // ---- the real fire pit, off to the side, with log benches
  const PIT = { x: 3.5, z: 10 }; // in front, so the grandstands get the sides
  const stone = mat('#7a7a72');
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stone);
    st.position.set(PIT.x + Math.cos(a) * 1.5, 0.15, PIT.z + Math.sin(a) * 1.5);
    st.rotation.set(a, a * 2, 0);
    st.castShadow = true;
    g.add(st);
  }
  for (let i = 0; i < 5; i++) {
    const log = cyl(0.12, 0.12, 1.5, mat('#4a2e1a'), 6, PIT.x, 0.18, PIT.z);
    log.rotation.set(Math.PI / 2, 0, (i / 5) * Math.PI);
    g.add(log);
  }
  const flames = [];
  const fireMat = new THREE.MeshStandardMaterial({ color: '#ff9a2a', emissive: '#ff5a00', emissiveIntensity: 1.6, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.35 - i * 0.04, 1.2 - i * 0.12, 6), fireMat);
    f.position.set(PIT.x + Math.cos(i * 1.3) * 0.25, 0.7, PIT.z + Math.sin(i * 1.3) * 0.25);
    g.add(f);
    flames.push(f);
  }
  const fireLight = new THREE.PointLight('#ff8a3a', 8, 18, 1.4);
  fireLight.position.set(PIT.x, 1.4, PIT.z);
  g.add(fireLight);
  colliders.push({ type: 'circle', x: PIT.x, z: PIT.z, r: 1.8 });
  const bench = mat('#6b4a2a');
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const x = PIT.x + Math.cos(a) * 3.4, z = PIT.z + Math.sin(a) * 3.4;
    const l = cyl(0.28, 0.28, 2.0, bench, 8, x, 0.28, z);
    l.rotation.set(0, -a + Math.PI / 2, Math.PI / 2); // tangential to the ring
    g.add(l);
    colliders.push({ type: 'circle', x, z, r: 0.6 });
  }
  spots.fire_pit = [PIT.x - 2.6, PIT.z - 2.2];

  // ---- the fire island's corner: toy rack, dip station, safety gear
  const RACK = { x: -6.5, z: 9.5 };
  const rackWood = mat('#8a6a42');
  for (const dx of [-0.9, 0.9]) {
    const leg = cyl(0.05, 0.05, 1.9, rackWood, 5, RACK.x + dx, 0.95, RACK.z);
    g.add(leg);
  }
  const bar = cyl(0.04, 0.04, 2.0, rackWood, 5, RACK.x, 1.8, RACK.z);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  const toyCols = ['#ff3aa0', '#3ad1ff', '#b0ff3a', '#ffcf3a'];
  for (let i = 0; i < 4; i++) {
    const x = RACK.x - 0.7 + i * 0.45;
    g.add(cyl(0.012, 0.012, 1.2, mat('#1e1e1e'), 4, x, 1.15, RACK.z + 0.05));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: toyCols[i] }));
    tip.position.set(x, 0.55, RACK.z + 0.05);
    g.add(tip);
  }
  colliders.push({ type: 'box', x: RACK.x, z: RACK.z, hw: 1.0, hd: 0.25, rot: 0 });
  // dip station: two metal buckets, extinguisher, wet towel
  const steel = mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 });
  for (const dx of [-0.35, 0.35]) g.add(cyl(0.22, 0.18, 0.4, steel, 10, RACK.x + 2.2 + dx, 0.2, RACK.z + 1.2));
  g.add(cyl(0.1, 0.1, 0.55, mat('#c0392b'), 8, RACK.x + 3.0, 0.28, RACK.z + 0.5));
  g.add(box(0.5, 0.08, 0.4, mat('#2f6fb3'), RACK.x + 1.4, 0.04, RACK.z + 1.6));
  const safety = signPost('Feuerinsel', { width: 2.2, height: 0.8, bg: '#1a1a1a', fg: '#ff9a2a' });
  safety.position.set(RACK.x + 1.8, 0, RACK.z - 0.9);
  g.add(safety);
  spots.fire_rack = [RACK.x + 1.2, RACK.z + 2.2];

  // ---- the wooden Shiva (like the real one): a giant built from raw boards, sitting cross-legged on a
  // mound of bark-edged slabs, spiky board crown, right hand holding the trident, left arm resting on the knee
  const shiva = new THREE.Group();
  shiva.position.set(0, 0, -8.6);
  g.add(shiva);
  shiva.add(plankStatue());
  // dark eye slits & a little "TORTUGA FIRESPACE" plaque hanging on the knee
  for (const x of [-0.19, 0.19]) shiva.add(box(0.22, 0.05, 0.04, mat('#2a1a0e'), x, 5.92, 0.5));
  const plaque = textPlane('TORTUGA FIRESPACE', 1.1, 0.32, { bg: '#1c1c22', fg: '#d8e0ff', font: 'bold 44px sans-serif', w: 512, h: 150 });
  plaque.position.set(2.0, 1.25, 2.25);
  plaque.rotation.set(-0.25, -0.35, 0.08);
  shiva.add(plaque);
  colliders.push({ type: 'circle', x: 0, z: -8.6, r: 3.6 });
  // reinforcement of last year's statue: props against the back & shoulders, ratchet straps round the mound
  const sfix = new THREE.Group();
  const beam = woodMat('#e2c18a');
  for (const s of [-1, 1]) sfix.add(strut(new THREE.Vector3(s * 2.9, 0.1, -2.6), new THREE.Vector3(s * 1.1, 4.3, -0.45), 0.12, beam));
  sfix.add(strut(new THREE.Vector3(0, 0.1, -3.9), new THREE.Vector3(0, 3.9, -0.55), 0.13, beam));
  const strap = mat('#f0b020');
  for (const [r, y] of [[3.3, 0.45], [2.4, 0.95]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 5, 40), strap);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    sfix.add(ring);
  }
  sfix.visible = false;
  shiva.add(sfix);
  fixParts[0] = [sfix];
  spots.fire_fix_1 = [1.6, -4.3];

  const sign = signPost('FIRESPACE', { width: 3.0, height: 1.0, bg: '#3a1a0a', fg: '#ffb060' });
  sign.position.set(-5, 0, 6.8);
  g.add(sign);

  g.userData.spots = spots;
  g.userData.animate = (t) => {
    flames.forEach((f, i) => { const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.18; f.scale.set(1, k, 1); });
    fireLight.intensity = 7 + Math.sin(t * 13) * 1.5 + Math.sin(t * 7.3) * 1.2;
    ringLeds.forEach((l, i) => l.material.color.setHSL((0.05 + Math.sin(t * 0.7 + i * 0.4) * 0.05 + 1) % 1, 1, 0.5 + 0.1 * Math.sin(t * 3 + i)));
  };
  const api = {
    /** reinforced targets: 0 = statue, 1–4 = grandstands */
    setFix(done) {
      fixParts.forEach((parts, i) => parts.forEach((o) => { o.visible = o.userData.hideWhenFixed === undefined ? done.includes(i) : !done.includes(i); }));
    },
  };
  return { object: g, colliders, api };
}

// ------------------------------------------------------------------ Mia's Narnia Floor (built in stages by her crew)
/**
 * Outdoor floor with a straw dance floor. The audience side is +z.
 * Stage 0: straw bales, half the straw floor. 1: full floor + the elephant DJ booth facing the crowd.
 * 2: stretch tent over the floor, wardrobe entrance, lamp post. 3: royal tent (chill-out) with two poles.
 * Objects & colliders carry minStage/maxStage.
 */
export function buildNarniaFloor() {
  const g = new THREE.Group();
  const staged = [];
  const stageColliders = [];
  const add = (o, min = 0, max = 9) => { o.userData.minStage = min; o.userData.maxStage = max; staged.push(o); g.add(o); return o; };
  const col = (c, min = 0, max = 9) => stageColliders.push({ ...c, minStage: min, maxStage: max });
  const W = 12, D = 9;

  // ---- straw dance floor (strips, slightly uneven colours)
  const strawCols = ['#d9c27a', '#cdb26a', '#e2cc88', '#c7aa5e'];
  const strips = 12;
  for (let i = 0; i < strips; i++) {
    const z = -D / 2 + (i + 0.5) * (D / strips);
    const st = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D / strips + 0.05), mat(strawCols[i % 4], { roughness: 1 }));
    st.position.set((Math.random() - 0.5) * 0.3, 0.03, z);
    st.receiveShadow = true;
    add(st, i < strips * 0.45 ? 0 : 1);
  }
  // straw bales waiting to be spread (stage 0) / as seats at the edge (later)
  const bale = mat('#d2b566', { roughness: 1 });
  for (const [x, z, s] of [[-4, 3.4, 0], [-2.6, 3.6, 0], [-3.3, 3.5, 0]]) {
    add(box(1.1, 0.55, 0.6, bale, x, 0.28 + (s ? 0 : 0), z), 0, 0);
  }
  col({ type: 'box', x: -3.3, z: 3.5, hw: 1.3, hd: 0.4 }, 0, 0);
  for (const [x, z, r] of [[-6.6, 2.5, 1.57], [-6.6, -1.2, 1.57], [6.6, 2.5, 1.57]]) {
    const b = box(1.1, 0.5, 0.6, bale, 0, 0.25, 0);
    b.position.set(x, 0.25, z);
    b.rotation.y = r;
    add(b, 1);
    col({ type: 'box', x, z, hw: 0.35, hd: 0.6 }, 1);
  }

  // ---- the elephant DJ booth, facing the crowd (+z), DJ desk on its back
  const ele = new THREE.Group();
  const grey = mat('#8d8a86', { roughness: 0.9 }), greyD = mat('#6f6c68', { roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), grey);
  body.scale.set(1.3, 1.25, 2.0);
  body.position.set(0, 2.1, -0.4);
  body.castShadow = true;
  ele.add(body);
  for (const [x, z] of [[-0.65, -1.6], [0.65, -1.6], [-0.65, 0.8], [0.65, 0.8]]) ele.add(cyl(0.38, 0.42, 1.6, greyD, 10, x, 0.8, z));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 9), grey);
  head.position.set(0, 2.7, 1.55);
  head.castShadow = true;
  ele.add(head);
  for (const s2 of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(1.0, 12), mat('#a39b92', { side: THREE.DoubleSide }));
    ear.position.set(s2 * 0.95, 2.75, 1.25);
    ear.rotation.y = s2 * 0.5;
    ele.add(ear);
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.75, 6), mat('#f4ecd8'));
    tusk.position.set(s2 * 0.35, 2.15, 2.2);
    tusk.rotation.x = 2.3;
    ele.add(tusk);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat('#1a1a1a'));
    eye.position.set(s2 * 0.42, 3.0, 2.3);
    ele.add(eye);
  }
  // trunk raised towards the crowd
  const trunkPts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; trunkPts.push(new THREE.Vector3(0, 2.4 - Math.sin(t * 2.6) * 0.9 + t * t * 2.0, 2.3 + Math.sin(t * 2.2) * 0.9)); }
  ele.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trunkPts), 20, 0.2, 7), grey));
  // colourful blanket, DJ desk on the back (DJ faces the crowd)
  ele.add(box(2.5, 0.08, 2.4, mat('#b8283a'), 0, 3.28, -0.6));
  for (const s2 of [-1, 1]) ele.add(box(0.04, 0.9, 2.4, mat('#d6a21e'), s2 * 1.26, 2.95, -0.6));
  ele.add(box(1.8, 0.1, 0.9, mat('#2a1a10'), 0, 3.4, -0.1));
  for (const x of [-0.45, 0.45]) ele.add(box(0.5, 0.06, 0.4, mat('#111'), x, 3.48, -0.1));
  // stairs up the back
  const plank = mat('#9a7448');
  for (let i = 0; i < 5; i++) ele.add(box(0.9, 0.18, 0.45, plank, 0, 0.3 + i * 0.62, -3.9 + i * 0.42));
  ele.position.set(0, 0, -6.2);
  add(ele, 1);
  col({ type: 'box', x: 0, z: -6.6, hw: 1.4, hd: 2.6 }, 1);
  for (const x of [-4.4, 4.4]) { add(box(1.0, 1.8, 0.9, mat('#1a1a1a'), x, 0.95, -4.8), 1); col({ type: 'box', x, z: -4.8, hw: 0.55, hd: 0.5 }, 1); }

  // ---- stretch tent over the dance floor: a sagging sail on three high poles
  const SX = 17, SZ = 15, SZ0 = -8.5; // covers the floor and the elephant
  const peaks = [[-4.2, -0.8, 2.6], [4.2, -0.8, 2.6], [0, -5.2, 2.4], [-3.5, 5.3, 1.2], [3.5, 5.3, 1.2]];
  const hAt = (x, z) => {
    let h = 2.7;
    for (const [px, pz, a] of peaks) h += a * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / 7);
    const ex = Math.abs(x) / (SX / 2), ez = (z - (SZ0 + SZ / 2)) / (SZ / 2);
    // sides and back sag down to the guy ropes; the front (audience side) stays high and open
    h -= 1.1 * Math.pow(Math.max(ex, Math.max(0, -ez)), 4);
    if (ez > 0) h += 0.9 * ez * ez * (1 - 0.6 * ex * ex);
    if (Math.abs(x) < 1.8 && z < -3.5) h = Math.max(h, 4.4); // headroom for the elephant
    return h;
  };
  const sg = new THREE.PlaneGeometry(SX, SZ, 34, 30);
  sg.rotateX(-Math.PI / 2);
  const sp = sg.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), z = sp.getZ(i) + SZ0 + SZ / 2;
    sp.setXYZ(i, x, hAt(x, z), z);
  }
  sg.computeVertexNormals();
  const stretch = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#e6d6b4', side: THREE.DoubleSide, roughness: 1 }));
  stretch.castShadow = true;
  add(stretch, 2);
  const poleM = mat('#6b4a2a');
  for (const [px, pz] of peaks.slice(0, 2).concat(peaks.slice(3))) {
    const h = hAt(px, pz);
    add(cyl(0.08, 0.1, h, poleM, 6, px, h / 2, pz), 2);
    col({ type: 'circle', x: px, z: pz, r: 0.2 }, 2);
  }
  // corner guy ropes + stakes
  const ropeM = new THREE.LineBasicMaterial({ color: '#d8d0c0' });
  for (const [cx, cz] of [[-SX / 2, SZ0], [SX / 2, SZ0], [-SX / 2, SZ0 + SZ], [SX / 2, SZ0 + SZ]]) {
    const top = new THREE.Vector3(cx, hAt(cx, cz), cz);
    const foot = new THREE.Vector3(cx * 1.15, 0, cz + Math.sign(cz - (SZ0 + SZ / 2)) * 2);
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([top, foot]), ropeM), 2);
    add(cyl(0.05, 0.05, top.y, poleM, 5, cx, top.y / 2, cz), 2);
    col({ type: 'circle', x: cx, z: cz, r: 0.2 }, 2);
  }

  // ---- the wardrobe: the way into Narnia + the lamp post
  const ward = new THREE.Group();
  const wood = woodMat('#7a4f2a');
  ward.add(box(1.8, 2.7, 0.12, wood, 0, 1.35, -0.45));
  for (const x of [-0.9, 0.9]) ward.add(box(0.12, 2.7, 0.9, wood, x, 1.35, 0));
  ward.add(box(2.0, 0.2, 1.0, wood, 0, 2.8, 0));
  ward.add(box(2.0, 0.12, 1.0, wood, 0, 0.06, 0));
  for (const s2 of [-1, 1]) {
    const door = box(0.9, 2.5, 0.06, woodMat('#8a5a32'), 0, 1.3, 0);
    const hinge = new THREE.Group();
    hinge.position.set(s2 * 0.9, 0, 0.45);
    door.position.x = s2 * 0.45;
    hinge.rotation.y = s2 * 1.9;
    hinge.add(door);
    ward.add(hinge);
  }
  for (let i = 0; i < 3; i++) ward.add(box(0.35, 1.1, 0.25, mat(['#e8e2d8', '#6a4a3a', '#d8c8a8'][i]), -0.5 + i * 0.5, 1.7, -0.15));
  ward.position.set(-3.2, 0, 6.6);
  ward.rotation.y = 0.2;
  add(ward, 2);
  col({ type: 'box', x: -3.2, z: 6.4, hw: 1.0, hd: 0.5, rot: 0.2 }, 2);
  const lamp = new THREE.Group();
  lamp.add(cyl(0.07, 0.1, 3.4, mat('#1a1a1a', { metalness: 0.5 }), 6, 0, 1.7, 0));
  lamp.add(box(0.36, 0.44, 0.36, mat('#1a1a1a'), 0, 3.55, 0));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.28), new THREE.MeshBasicMaterial({ color: '#ffd98a' }));
  glow.position.y = 3.55;
  lamp.add(glow);
  lamp.add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 4), mat('#1a1a1a')).translateY(3.9));
  lamp.position.set(3.6, 0, 6.6);
  add(lamp, 2);
  col({ type: 'circle', x: 3.6, z: 6.6, r: 0.3 }, 2);

  // ---- the royal tent (chill-out) on the west side: oval, two centre poles, open towards the floor
  const tent = new THREE.Group();
  const RX = 2.8, RZ = 4.2, TH = 2.2, P2 = 1.6; // half axes, wall height, pole offset
  const segs = 22;
  const wallAt = (a) => [Math.cos(a) * RX, Math.sin(a) * RZ];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
    const [x0, z0] = wallAt(a0), [x1, z1] = wallAt(a1);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    if (mx > RX * 0.55) continue; // open side towards the dance floor (+x)
    const len = Math.hypot(x1 - x0, z1 - z0);
    const panel = box(len + 0.03, TH, 0.06, mat(i % 2 ? '#b8283a' : '#f0d27a'), mx, TH / 2, mz);
    panel.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    tent.add(panel);
    col({ type: 'circle', x: -11 + mx, z: -0.5 + mz, r: 0.4 }, 3);
  }
  // roof: two cones on the two poles, joined over the middle
  const roofM = mat('#b8283a', { side: THREE.DoubleSide });
  for (const pz of [-P2, P2]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(RX + 0.35, 2.2, 18, 1, true), roofM);
    cone.scale.z = 1.15;
    cone.position.set(0, TH + 1.1, pz);
    cone.castShadow = true;
    tent.add(cone);
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(RX + 0.35, RX + 0.35, P2 * 2, 18, 1, true, Math.PI, Math.PI), roofM);
  ridge.rotation.x = Math.PI / 2;
  ridge.scale.set(1, 1, 0.55);
  ridge.position.y = TH + 0.02;
  tent.add(ridge);
  const gold = mat('#e0b030', { metalness: 0.5, roughness: 0.35 });
  const flags = [];
  for (const [i, pz] of [[0, -P2], [1, P2]]) {
    tent.add(cyl(0.07, 0.08, TH + 3.1, mat('#6b4a2a'), 6, 0, (TH + 3.1) / 2, pz));
    col({ type: 'circle', x: -11, z: -0.5 + pz, r: 0.15 }, 3);
    if (i === 0) {
      const crown = new THREE.Group();
      crown.add(cyl(0.3, 0.3, 0.2, gold, 10, 0, 0, 0));
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; crown.add(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), gold).translateX(Math.cos(a) * 0.26).translateZ(Math.sin(a) * 0.26).translateY(0.2)); }
      crown.position.set(0, TH + 2.35, pz);
      tent.add(crown);
    } else {
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), mat('#1f4f99', { side: THREE.DoubleSide }));
      flag.position.set(0.47, TH + 2.85, pz);
      tent.add(flag);
      flags.push(flag);
    }
  }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 24), mat('#6a2a5a'));
  rug.scale.set(RX - 0.2, RZ - 0.2, 1);
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.04;
  tent.add(rug);
  const cushCols = ['#e0b030', '#2a8a7a', '#c0602a', '#6a3d9a', '#b8283a'];
  for (let i = 0; i < 11; i++) {
    const ang = 0.9 + (i / 10) * (Math.PI * 2 - 1.8);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat(cushCols[i % 5]));
    c.scale.set(1, 0.45, 1);
    c.position.set(Math.cos(ang) * (RX - 0.65), 0.2, Math.sin(ang) * (RZ - 0.65));
    tent.add(c);
  }
  tent.add(cyl(0.45, 0.45, 0.35, mat('#8a5a32'), 12, -0.5, 0.18, 0));
  tent.position.set(-11, 0, -0.5);
  add(tent, 3);
  const bulbs = [];
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), new THREE.MeshBasicMaterial({ color: '#ffe0a0' }));
    b.position.set(-8.2 + Math.sin(t * Math.PI) * 0.4, 2.3 - Math.sin(t * Math.PI) * 0.4, -4.6 + t * 8.5);
    add(b, 3);
    bulbs.push(b);
  }
  const sign = signPost('NARNIA FLOOR', { width: 2.6, height: 0.9, bg: '#16324a', fg: '#dff0ff' });
  sign.position.set(0.8, 0, 7.6);
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
  g.userData.spots = { narnia_dj: [0, -2.4], narnia_deck: [0, 1], narnia_tent: [-9.2, -0.5] };
  g.userData.animate = (t) => {
    if (api.stage < 3) return;
    for (const f of flags) f.rotation.y = Math.sin(t * 2) * 0.25;
    bulbs.forEach((b, i) => b.material.color.setHSL(0.1 + 0.03 * Math.sin(t * 2 + i), 0.9, 0.65 + 0.15 * Math.sin(t * 4 + i * 0.7)));
  };
  return { object: g, colliders: [], api };
}

// ------------------------------------------------------------------ hammock forest
/** Two rows of wooden posts with colourful hammocks sagging between them. */
export function buildHammockForest() {
  const g = new THREE.Group();
  const colliders = [];
  const wood = woodMat('#7a5534');
  const rows = [-3.2, 3.2], xs = [-7.5, -2.5, 2.5, 7.5];
  const posts = [];
  for (const z of rows) for (const x of xs) {
    const jitter = (Math.sin(x * 3.1 + z) * 0.4);
    const px = x + jitter, pz = z + Math.cos(x + z) * 0.3;
    g.add(cyl(0.12, 0.15, 2.6, wood, 7, px, 1.3, pz));
    colliders.push({ type: 'circle', x: px, z: pz, r: 0.25 });
    posts.push(new THREE.Vector3(px, 0, pz));
  }
  const cols = ['#e84a8a', '#2a8a7a', '#f1c40f', '#6a3d9a', '#e67e22', '#1a8aa8', '#c0392b', '#7fb040'];
  const rope = new THREE.LineBasicMaterial({ color: '#d8ccb0' });
  const hammock = (a, b, i) => {
    const len = a.distanceTo(b), ang = Math.atan2(b.z - a.z, b.x - a.x);
    const nu = 16, nv = 6, W = 0.9, sag = 0.75, top = 1.55, inset = 0.45;
    const pos = [], idx = [];
    for (let iu = 0; iu <= nu; iu++) {
      const u = iu / nu;
      for (let iv = 0; iv <= nv; iv++) {
        const v = iv / nv * 2 - 1;
        const s = Math.sin(Math.PI * u);
        const x = inset + u * (len - 2 * inset);
        pos.push(x, top - sag * s - 0.18 * (1 - v * v) * s, v * W * 0.5 * (0.35 + 0.65 * s));
      }
    }
    for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) {
      const k = iu * (nv + 1) + iv;
      idx.push(k, k + nv + 1, k + 1, k + 1, k + nv + 1, k + nv + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat(cols[i % cols.length], { side: THREE.DoubleSide, roughness: 0.9 }));
    m.castShadow = true;
    const holder = new THREE.Group();
    holder.position.set(a.x, 0, a.z);
    holder.rotation.y = -ang;
    holder.add(m);
    // ropes from the post tops to the hammock ends
    for (const [x0, x1] of [[0, inset], [len, len - inset]]) {
      holder.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, 2.3, 0), new THREE.Vector3(x1, top, 0)]), rope));
    }
    g.add(holder);
    return holder;
  };
  let n = 0;
  const swing = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) swing.push(hammock(posts[r * 4 + c], posts[r * 4 + c + 1], n++));
  swing.push(hammock(posts[1], posts[6], n++)); // two across the rows
  swing.push(hammock(posts[2], posts[5], n++));
  const sign = signPost('HÄNGEMATTENWALD', { width: 3.0, height: 0.9, bg: '#2a3a1a', fg: '#f0e0a0' });
  sign.position.set(-5, 0, 6.5);
  g.add(sign);
  g.userData.spots = { hammocks_center: [0, 0] };
  g.userData.animate = (t) => swing.forEach((h, i) => { h.children[0].rotation.x = Math.sin(t * 0.9 + i) * 0.06; });
  return { object: g, colliders };
}

// ------------------------------------------------------------------ techno floor (where Verena also runs a small bar)
/** Black floor under a dark stretch tent (three poles), DJ booth, speaker stacks, lasers, strobes, UV bulbs. Front = +z. */
export function buildTechnoFloor() {
  const g = new THREE.Group();
  const colliders = [];
  const black = mat('#141414', { roughness: 0.9 }), steel = mat('#9aa0a6', { metalness: 0.6, roughness: 0.4 });
  const floor = box(16, 0.06, 12, mat('#1c1c1e', { roughness: 1 }), 0, 0.03, 0);
  floor.receiveShadow = true;
  g.add(floor);
  // stretch tent over the whole floor: two high poles behind the DJ, one over the dance floor
  const TW = 19, TD = 15, peaks = [[-4.5, -2.5, 2.6], [4.5, -2.5, 2.6], [0, 3.5, 2.2]];
  const { mesh, hAt } = stretchSheet(TW, TD, peaks, 3.6, '#4a3560');
  g.add(mesh);
  const pole = woodMat('#3a2a1a');
  for (const [px, pz] of peaks) { const h = hAt(px, pz); g.add(cyl(0.11, 0.13, h, pole, 6, px, h / 2, pz)); colliders.push({ type: 'circle', x: px, z: pz, r: 0.22 }); }
  const rope = new THREE.LineBasicMaterial({ color: '#bdb6a8' });
  for (const [ex, ez] of [[-TW / 2, -TD / 2], [TW / 2, -TD / 2], [-TW / 2, TD / 2], [TW / 2, TD / 2], [0, -TD / 2]]) {
    const top = new THREE.Vector3(ex, hAt(ex, ez), ez);
    g.add(cyl(0.05, 0.05, top.y, pole, 5, ex, top.y / 2, ez));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([top, new THREE.Vector3(ex * 1.15, 0, ez * 1.2)]), rope));
    colliders.push({ type: 'circle', x: ex, z: ez, r: 0.2 });
  }
  // UV bulbs along the edges of the sail
  const uv = [new THREE.MeshStandardMaterial({ color: '#c38bff', emissive: '#9b4dff', emissiveIntensity: 1.4 }), new THREE.MeshStandardMaterial({ color: '#8affc0', emissive: '#35ff6a', emissiveIntensity: 1.2 })];
  const bulbGeo = new THREE.SphereGeometry(0.08, 5, 4);
  for (let i = 0; i <= 16; i++) {
    const x = -TW / 2 + 0.3 + (i / 16) * (TW - 0.6);
    for (const ez of [-TD / 2 + 0.3, TD / 2 - 0.3]) {
      const bl = new THREE.Mesh(bulbGeo, uv[i % 2]);
      bl.position.set(x, hAt(x, ez) - 0.2, ez);
      g.add(bl);
    }
  }
  // light bar (lasers + strobes) hanging under the sail, back curtain behind the DJ
  g.add(box(11, 0.25, 0.25, steel, 0, 4.5, 0.5));
  for (const x of [-5.5, 5.5]) g.add(cyl(0.015, 0.015, 1.2, steel, 4, x, 5.2, 0.5));
  g.add(box(13, 2.6, 0.05, black, 0, 1.3, -5.6)); // back curtain
  // DJ booth + speaker stacks
  g.add(box(2.6, 1.1, 1.0, black, 0, 0.55, -3.4));
  g.add(box(2.7, 0.06, 1.1, mat('#2a2a2a'), 0, 1.12, -3.4));
  for (const x of [-0.6, 0.6]) g.add(box(0.5, 0.06, 0.4, mat('#0a0a0a'), x, 1.18, -3.45));
  colliders.push({ type: 'box', x: 0, z: -3.4, hw: 1.35, hd: 0.55 });
  for (const x of [-4.6, 4.6]) {
    for (let k = 0; k < 3; k++) {
      g.add(box(1.3, 0.9, 1.0, black, x, 0.45 + k * 0.92, -3.6));
      const cone = cyl(0.3, 0.3, 0.02, mat('#303030'), 12, x, 0.45 + k * 0.92, -3.09);
      cone.rotation.x = Math.PI / 2;
      g.add(cone);
    }
    colliders.push({ type: 'box', x, z: -3.6, hw: 0.7, hd: 0.55 });
  }
  // lasers (green beams sweeping over the floor) and strobes on the front truss
  const beamMat = new THREE.MeshBasicMaterial({ color: '#35ff6a', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const lasers = [];
  for (const x of [-4, 0, 4]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 4.3, 0.5);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 14, 4), beamMat);
    beam.position.y = -7;
    pivot.add(beam);
    g.add(pivot);
    lasers.push(pivot);
  }
  const strobeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const strobes = [-5, -2, 2, 5].map((x) => { const s = box(0.4, 0.2, 0.2, strobeMat, x, 4.25, 0.7); g.add(s); return s; });
  // Verena's little bar at the side
  g.add(box(3.2, 1.05, 0.7, woodMat('#6a4a2a'), 7.2, 0.53, 3.5));
  g.add(box(3.3, 0.06, 0.8, mat('#c9a27a'), 7.2, 1.08, 3.5));
  for (let i = 0; i < 5; i++) g.add(cyl(0.04, 0.04, 0.22, mat(['#2e8b57', '#c0392b', '#f1c40f'][i % 3]), 6, 6 + i * 0.5, 1.22, 3.5));
  colliders.push({ type: 'box', x: 7.2, z: 3.5, hw: 1.6, hd: 0.4 });
  const sign = signPost('TECHNO FLOOR', { width: 2.8, height: 0.9, bg: '#0a0a0a', fg: '#35ff6a' });
  sign.position.set(-5.5, 0, 7.2);
  g.add(sign);
  const bar = signPost('BAR', { width: 1.4, height: 0.7, bg: '#0a0a0a', fg: '#ffd24a' });
  bar.position.set(8.6, 0, 4.4);
  g.add(bar);
  g.userData.spots = { techno_bar: [7.2, 2.6], techno_dj: [0, -2.4] };
  g.userData.animate = (t) => {
    lasers.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.9; p.rotation.x = 0.5 + Math.sin(t * 0.6 + i) * 0.35; });
    const on = Math.floor(t * 8) % 5 === 0;
    strobes.forEach((s, i) => { s.visible = on ? i % 2 === 0 : i % 2 === 1 && Math.floor(t * 8) % 7 === 0; });
  };
  return { object: g, colliders };
}

// ------------------------------------------------------------------ straw bale sound walls
/** A wall of stacked straw bales (length along local x). */
export function strawWall(len = 16) {
  // big square bales (3.0 × 1.6 × 1.3 m), three layers, offset like bricks
  const g = new THREE.Group();
  const cols = ['#d9c27a', '#cdb26a', '#e2cc88', '#c9ac60'];
  const BL = 3.0, BW = 1.6, BH = 1.3; // really big square bales
  const n = Math.round(len / BL);
  for (let row = 0; row < 3; row++) {
    const off = (row % 2) * BL / 2;
    for (let i = 0; i < n - (row % 2); i++) {
      const b = box(BL - 0.04, BH, BW, mat(cols[(i + row) % 4], { roughness: 1 }), -len / 2 + BL / 2 + off + i * BL, BH / 2 + row * BH, 0);
      b.castShadow = true;
      b.rotation.y = Math.sin(i * 7.3 + row) * 0.025;
      g.add(b);
    }
  }
  return g;
}

// ------------------------------------------------------------------ entrance: big stretch tent + wristband table
/** A sagging stretch-tent sheet over a w × d area, with poles at the given peaks. Returns { mesh, hAt }. */
function stretchSheet(w, d, peaks, base = 2.6, color = '#e6d6b4') {
  const hAt = (x, z) => {
    let h = base;
    for (const [px, pz, a] of peaks) h += a * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / 8);
    const e = Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2));
    return h - 1.0 * Math.pow(e, 4);
  };
  const geo = new THREE.PlaneGeometry(w, d, 30, 24);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hAt(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }));
  mesh.castShadow = true;
  return { mesh, hAt };
}

export function buildEntranceTent() {
  const g = new THREE.Group();
  const colliders = [];
  const W = 14, D = 10;
  const peaks = [[-3.5, 0, 2.6], [3.5, 0, 2.6]];
  const { mesh, hAt } = stretchSheet(W, D, peaks, 2.7, '#d9c9a2');
  g.add(mesh);
  const pole = woodMat('#6b4a2a');
  for (const [px, pz] of peaks) { const h = hAt(px, pz); g.add(cyl(0.09, 0.11, h, pole, 6, px, h / 2, pz)); colliders.push({ type: 'circle', x: px, z: pz, r: 0.2 }); }
  const rope = new THREE.LineBasicMaterial({ color: '#d8d0c0' });
  for (const [cx, cz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
    const top = new THREE.Vector3(cx, hAt(cx, cz), cz);
    g.add(cyl(0.05, 0.05, top.y, pole, 5, cx, top.y / 2, cz));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([top, new THREE.Vector3(cx * 1.2, 0, cz * 1.3)]), rope));
    colliders.push({ type: 'circle', x: cx, z: cz, r: 0.2 });
  }
  // the long wristband table: boxes of wristbands, a cash box, a laptop, a sign
  const wood = mat('#c9a27a');
  g.add(box(6, 0.06, 0.9, wood, 0, 0.78, -1));
  for (const x of [-2.8, 2.8]) for (const z of [-1.35, -0.65]) g.add(box(0.05, 0.76, 0.05, mat('#444'), x, 0.39, z));
  ['#e74c3c', '#f1c40f', '#2ea84a', '#3a7bd5'].forEach((c, i) => g.add(box(0.35, 0.18, 0.25, mat(c), -2.2 + i * 0.5, 0.9, -1.05)));
  g.add(box(0.4, 0.2, 0.3, mat('#2a2a2a'), 1.4, 0.91, -1.0));
  g.add(box(0.45, 0.3, 0.03, mat('#222'), 2.4, 0.97, -1.25));
  colliders.push({ type: 'box', x: 0, z: -1, hw: 3.05, hd: 0.5 });
  // crowd barrier lanes in front of the table
  const steel = mat('#9aa0a6', { metalness: 0.5 });
  for (const x of [-1.5, 1.5]) {
    g.add(box(0.05, 1.0, 5, steel, x, 0.5, 2.4));
    colliders.push({ type: 'box', x, z: 2.4, hw: 0.06, hd: 2.5 });
  }
  const sign = signPost('EINGANG', { width: 2.6, height: 0.9, bg: '#101010', fg: '#e8a33a' });
  sign.position.set(-5, 0, 5.8);
  g.add(sign);
  g.userData.spots = { entrance_desk: [0, -2.0], entrance_queue: [0, 4.5], entrance_inside: [0, -4.2] };
  return { object: g, colliders };
}

// ------------------------------------------------------------------ shops: a little market street
const STALLS = [[-6.5, -2.5, 0.5], [-1.5, 4.5, -0.3], [4, -5, 0.9], [6.5, 2.5, -1.3], [0, -1, Math.PI + 0.2]];
export function buildMarket() {
  const g = new THREE.Group();
  const colliders = [];
  const roofs = ['#c0392b', '#2a8a7a', '#e67e22', '#6a3d9a', '#1a8aa8'];
  const goods = [['#e84a8a', '#f1c40f', '#3ad1ff'], ['#7fb040', '#c0602a'], ['#f4f1ea', '#b8283a', '#d6a21e'], ['#2a2a2a', '#9a6a3a'], ['#ff7a1a', '#35ff6a', '#b07aff']];
  const wood = woodMat('#8a6a42');
  roofs.forEach((rc, i) => {
    const [x, z, rot] = STALLS[i]; // scattered, not in a row
    const st = new THREE.Group();
    for (const dx of [-1.4, 1.4]) for (const dz of [-0.9, 0.9]) st.add(cyl(0.05, 0.05, 2.4, wood, 5, dx, 1.2, dz));
    const roof = box(3.2, 0.05, 2.2, mat(rc), 0, 2.45, 0);
    roof.rotation.x = 0.12;
    st.add(roof);
    for (let k = 0; k < 6; k++) st.add(box(0.35, 0.25, 0.04, mat(k % 2 ? rc : '#ffffff'), -1.45 + k * 0.58, 2.28, 1.12)); // valance
    st.add(box(2.8, 0.06, 0.8, mat('#c9a27a'), 0, 0.85, 0.6));
    st.add(box(2.8, 0.82, 0.05, wood, 0, 0.42, 0.98));
    goods[i].forEach((c, k) => { for (let n = 0; n < 3; n++) st.add(box(0.22, 0.16 + (n % 2) * 0.1, 0.22, mat(c), -1.1 + k * 0.9 + n * 0.25, 0.97, 0.5)); });
    st.position.set(x, 0, z);
    st.rotation.y = rot;
    g.add(st);
    colliders.push({ type: 'box', x: x + Math.sin(rot) * 0.6, z: z + Math.cos(rot) * 0.6, hw: 1.5, hd: 0.5, rot });
  });
  // string of lights over the market street
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), new THREE.MeshBasicMaterial({ color: ['#ffd24a', '#ff6ab4', '#5ad1ff'][i % 3] }));
    const k = Math.min(3, Math.floor(t * 4)), f = t * 4 - k, a = STALLS[[0, 4, 2, 3][k]], b2 = STALLS[[4, 2, 3, 1][k]];
    b.position.set(a[0] + (b2[0] - a[0]) * f, 2.9 - Math.sin(f * Math.PI) * 0.3, a[1] + (b2[1] - a[1]) * f);
    g.add(b);
  }
  const sign = signPost('SHOPS', { width: 2.0, height: 0.8, bg: '#2a1a3a', fg: '#ffd24a' });
  sign.position.set(-4, 0, 7.5);
  g.add(sign);
  return { object: g, colliders };
}

// ------------------------------------------------------------------ board statue (firespace Shiva)
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * The firespace giant, built from ~200 rough boards (one InstancedMesh). Faces +z, ~10.5 m incl. trident.
 * Every limb is a bundle of boards along a line, ends sticking out a little – like the real one.
 */
function plankStatue() {
  const R = rng(7);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const list = [];
  const LIGHT = ['#e6bd80', '#d9ab6c', '#cf9f60', '#e9c992', '#c68f52'];
  const BARK = ['#8a5a32', '#a06a3a', '#b98a55'];
  /** one board from a to b; `face` = direction the flat side looks to (random if omitted) */
  const plank = (a, b, w = 0.22, t = 0.05, face = null, cols = LIGHT) => list.push({ a, b, w, t, face, col: cols[(R() * cols.length) | 0] });
  /** a bundle of n boards along a→b, spread sideways, ends sticking out */
  const bundle = (a, b, n, spread, w = 0.22, face = null) => {
    const d = b.clone().sub(a), len = d.length(); d.normalize();
    const u = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize();
    const v = new THREE.Vector3().crossVectors(d, u);
    for (let i = 0; i < n; i++) {
      const off = u.clone().multiplyScalar((R() - 0.5) * spread).addScaledVector(v, (R() - 0.5) * spread);
      const e0 = (R() * 0.25 - 0.05) * len, e1 = (R() * 0.3 - 0.05) * len;
      plank(a.clone().add(off).addScaledVector(d, -e0), b.clone().add(off).addScaledVector(d, e1), w * (0.7 + R() * 0.6), 0.05, face);
    }
  };

  // mound of bark-edged slabs, leaning inwards in rings
  for (let k = 0; k < 4; k++) {
    const r = 3.6 - k * 0.75, y = 0.12 + k * 0.3, n = 22 - k * 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.3 + R() * 0.15;
      const c = Math.cos(a), s = Math.sin(a);
      plank(V(c * (r + 0.3), y, s * (r + 0.3)), V(c * (r - 1.4), y + 0.45, s * (r - 1.4)), 0.42 + R() * 0.2, 0.09, V(c * 0.3, 1, s * 0.3), k === 0 ? BARK : [...BARK, ...LIGHT]);
    }
  }
  for (let i = 0; i < 9; i++) plank(V(-1.6, 1.25, -1.6 + i * 0.4), V(1.6, 1.25, -1.6 + i * 0.4), 0.38, 0.08, V(0, 1, 0), BARK); // seat deck

  // crossed legs (the left one on top)
  bundle(V(-0.6, 1.6, 0.1), V(-2.8, 1.5, 1.4), 7, 0.75);
  bundle(V(-2.8, 1.45, 1.4), V(0.7, 1.4, 2.3), 6, 0.6);
  bundle(V(0.6, 1.65, 0.1), V(2.8, 1.55, 1.4), 7, 0.75);
  bundle(V(2.8, 1.6, 1.4), V(-0.7, 1.65, 2.15), 6, 0.6);

  // torso: boards fanning from a narrow waist to a wide chest, front & back
  for (const side of [1, -1]) {
    for (let i = 0; i < 14; i++) {
      const t = i / 13 - 0.5;
      plank(V(t * 0.95, 1.7, side * (0.38 - Math.abs(t) * 0.3)), V(t * 2.9, 4.75, side * (0.5 - Math.abs(t) * 0.6)), 0.24, 0.05, V(t * 0.6, 0, side));
    }
  }
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) plank(V(s * 1.25, 4.3 - k * 0.24, 0.55), V(s * 0.08, 4.2 - k * 0.24, 0.66), 0.32, 0.06, V(0, 0, 1)); // chest plates
    for (let k = 0; k < 4; k++) plank(V(s * 0.05, 3.45 - k * 0.38, 0.55), V(s * 0.5, 3.4 - k * 0.38, 0.5), 0.28, 0.06, V(0, 0, 1)); // abs
    plank(V(s * 1.55, 4.8, 0), V(s * 0.15, 4.95, 0.35), 0.2, 0.05, V(0, 1, 0.4)); // collar bones
    bundle(V(s * 1.5, 4.75, 0), V(s * 1.9, 4.2, 0.1), 4, 0.5, 0.3); // shoulder caps
  }

  // neck & head: horizontal boards for the face, a V-shaped jaw
  bundle(V(0, 4.8, 0), V(0, 5.45, 0.05), 6, 0.38, 0.18);
  [0.3, 0.38, 0.43, 0.46, 0.45, 0.42, 0.36, 0.3].forEach((hw, j) => plank(V(-hw, 5.45 + j * 0.15, 0.44), V(hw, 5.45 + j * 0.15, 0.44), 0.16, 0.05, V(0, 0, 1)));
  for (const s of [-1, 1]) plank(V(0, 5.35, 0.5), V(s * 0.45, 5.85, 0.4), 0.14, 0.05, V(0, 0, 1));
  bundle(V(0, 5.4, -0.15), V(0, 6.6, -0.1), 6, 0.7, 0.25);
  plank(V(-0.42, 6.05, 0.5), V(0.42, 6.05, 0.5), 0.12, 0.08, V(0, 0, 1)); // brow
  for (let i = 0; i < 16; i++) { // spiky crown
    const a = (i / 16) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    plank(V(c * 0.3, 6.45, s * 0.25), V(c * (0.45 + R() * 0.7), 7.3 + R() * 1.0, s * (0.35 + R() * 0.5)), 0.1 + R() * 0.1, 0.04);
  }

  // right arm (−x) holding the trident
  bundle(V(-1.5, 4.6, 0), V(-2.4, 3.35, 0.3), 5, 0.5);
  bundle(V(-2.4, 3.35, 0.3), V(-2.6, 4.5, 0.8), 5, 0.42);
  for (let k = 0; k < 4; k++) plank(V(-2.95, 4.35 + k * 0.1, 0.8), V(-2.25, 4.4 + k * 0.1, 0.85), 0.12, 0.06); // fist around the staff
  const SX = -2.6, SZ = 0.82;
  bundle(V(SX, 0.3, SZ), V(SX, 9.8, SZ), 2, 0.1, 0.18);
  plank(V(SX - 0.25, 7.2, SZ), V(SX + 0.25, 7.2, SZ), 0.12, 0.12);
  plank(V(SX - 0.95, 9.3, SZ), V(SX + 0.95, 9.3, SZ), 0.2, 0.12, V(0, 0, 1)); // crossbar
  plank(V(SX, 9.3, SZ), V(SX, 10.9, SZ), 0.28, 0.1, V(0, 0, 1)); // middle prong
  for (const s of [-1, 1]) { // blade-like side prongs, as on the photo
    plank(V(SX + s * 0.9, 9.3, SZ), V(SX + s * 1.2, 10.0, SZ), 0.34, 0.08, V(0, 0, 1));
    plank(V(SX + s * 1.2, 10.0, SZ), V(SX + s * 0.95, 10.6, SZ), 0.3, 0.08, V(0, 0, 1));
  }

  // left arm (+x) reaching out and resting on the knee
  bundle(V(1.5, 4.6, 0), V(2.8, 3.2, 0.5), 5, 0.5);
  bundle(V(2.8, 3.2, 0.5), V(2.45, 2.05, 2.35), 5, 0.42);
  for (let k = 0; k < 4; k++) plank(V(2.45, 2.05, 2.35), V(2.15 + k * 0.17, 1.75, 2.95), 0.09, 0.05); // fingers

  // → one instanced mesh
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true }), list.length);
  const m4 = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
  list.forEach((p, i) => {
    Z.subVectors(p.b, p.a);
    const len = Z.length();
    Z.normalize();
    const f = p.face ? p.face.clone() : V(R() - 0.5, R() - 0.5, R() - 0.5);
    Y.copy(f).addScaledVector(Z, -f.dot(Z));
    if (Y.lengthSq() < 1e-6) Y.set(1, 0, 0).addScaledVector(Z, -Z.x);
    Y.normalize();
    X.crossVectors(Y, Z);
    m4.makeBasis(X, Y, Z).multiply(new THREE.Matrix4().makeScale(p.w, p.t, len));
    m4.setPosition(p.a.clone().add(p.b).multiplyScalar(0.5));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, new THREE.Color(p.col));
  });
  im.castShadow = im.receiveShadow = true;
  return im;
}
