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
/** Fabbe's stage at the forest edge: two stretch tents (one over the stage, one over the dance floor). */
export function buildForestDome() {
  const g = new THREE.Group();
  const colliders = [];
  const pole = woodMat('#6b4a2a');
  const rope = new THREE.LineBasicMaterial({ color: '#d8d0c0' });
  const bulb = new THREE.MeshStandardMaterial({ color: '#ffe8a0', emissive: '#ffcc55', emissiveIntensity: 1.2 });
  const bulbGeo = new THREE.SphereGeometry(0.07, 5, 4);
  const tent = (cx, cz, w, d, peaks, base, color) => {
    const { mesh, hAt } = stretchSheet(w, d, peaks, base, color);
    mesh.position.set(cx, 0, cz);
    g.add(mesh);
    for (const [px, pz] of peaks) {
      const h = hAt(px, pz);
      g.add(cyl(0.1, 0.12, h, pole, 6, cx + px, h / 2, cz + pz));
      colliders.push({ type: 'circle', x: cx + px, z: cz + pz, r: 0.22 });
    }
    for (const [ex, ez] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
      const top = new THREE.Vector3(cx + ex, hAt(ex, ez), cz + ez);
      g.add(cyl(0.05, 0.05, top.y, pole, 5, top.x, top.y / 2, top.z));
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([top, new THREE.Vector3(cx + ex * 1.18, 0, cz + ez * 1.22)]), rope));
      colliders.push({ type: 'circle', x: top.x, z: top.z, r: 0.2 });
    }
    // fairy lights along the front and back edge
    for (let i = 0; i <= 14; i++) {
      const x = -w / 2 + (i / 14) * w;
      for (const ez of [-d / 2 + 0.2, d / 2 - 0.2]) {
        const b = new THREE.Mesh(bulbGeo, bulb);
        b.position.set(cx + x, hAt(x, ez) - 0.25 - Math.sin((i / 14) * Math.PI) * 0.15, cz + ez);
        g.add(b);
      }
    }
  };
  tent(0, -2.2, 12, 9, [[-3, 0, 2.6], [3, 0, 2.6]], 2.8, '#e2d3b0'); // over the stage
  tent(-1.2, 5.4, 11, 8, [[0, 0, 3.0]], 2.6, '#c4744a');             // over the dance floor
  // stage + DJ + speakers at the back
  g.add(box(7, 0.8, 3.5, mat('#a07040'), 0, 0.4, -3.8));
  colliders.push({ type: 'box', x: 0, z: -3.8, hw: 3.5, hd: 1.75, rot: 0 });
  g.add(box(2, 0.9, 0.8, mat('#5a3a1a'), 0, 1.25, -3.4));
  for (const x of [-2.8, 2.8]) g.add(box(1, 1.8, 0.9, mat('#1a1a1a'), x, 1.7, -4.2));
  const s = signPost('FOREST DOME', { width: 2.4, height: 0.9, bg: '#1f3a1f', fg: '#b8f0a0' });
  s.position.set(6.8, 0, 8.4);
  s.rotation.y = -0.4;
  g.add(s);
  return { object: g, colliders };
}

// ------------------------------------------------------------------ Harry's mapping sculpture
/** Giant faceted wooden sculpture behind the Forest Dome – plain wood by day, 3D-mapped at night. */
export function buildMappingDeco() {
  const g = new THREE.Group();
  const colliders = [];
  const uniforms = { uTime: { value: 0 }, uMap: { value: 0 } };
  const woodMap = new THREE.MeshStandardMaterial({ color: '#b98a55', roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  woodMap.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uniforms.uTime;
    sh.uniforms.uMap = uniforms.uMap;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uTime;\nuniform float uMap;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 lp = vWPos - vec3(cameraPosition.x * 0.0);
        float r = length(lp.xy - vec2(0.0, 6.0));
        float wave = sin(r * 1.6 - uTime * 3.0) * 0.5 + 0.5;
        float stripes = step(0.5, fract(lp.y * 0.6 + uTime * 0.4 + sin(lp.x * 0.5) * 0.4));
        float phase = floor(mod(uTime * 0.2, 3.0));
        vec3 pal = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + r * 0.08 - uTime * 0.15));
        pal = pow(pal, vec3(2.2)); // saturated neon
        float w3 = pow(wave, 3.0);
        float pat = phase < 1.0 ? w3 : (phase < 2.0 ? stripes * (0.3 + 0.7 * w3) : smoothstep(0.35, 0.4, fract(r * 0.35 - uTime * 0.5)) * w3);
        totalEmissiveRadiance += pal * pat * uMap * 1.4;
        diffuseColor.rgb *= 1.0 - 0.75 * uMap; // projector dominates, wood goes dark`);
  };
  // faceted "tree spirit" sculpture behind the dome: a fan of big wooden plates around a trunk
  const sc = new THREE.Group();
  sc.position.set(0, 0, -9.5);
  g.add(sc);
  const H = 11;
  sc.add(cyl(0.6, 0.9, H * 0.55, woodMap, 7, 0, H * 0.27, 0));
  const plates = 11;
  for (let i = 0; i < plates; i++) {
    const a = -Math.PI * 0.55 + (i / (plates - 1)) * Math.PI * 1.1;
    const len = 5 + Math.sin(i * 1.3) * 1.2 + (i % 2) * 1.2;
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, 0); shape.lineTo(0.9, 0); shape.lineTo(1.4, len * 0.6); shape.lineTo(0, len); shape.lineTo(-1.4, len * 0.6); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    const m = new THREE.Mesh(geo, woodMap);
    m.position.set(0, H * 0.5, (i % 2) * 0.25);
    m.rotation.z = a;
    m.castShadow = true;
    sc.add(m);
  }
  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), woodMap);
  face.position.set(0, H * 0.52, 0.6);
  face.scale.set(1, 1.2, 0.5);
  sc.add(face);
  colliders.push({ type: 'circle', x: 0, z: -9.5, r: 1.4 });
  // projector tower beside the dome, aimed at the sculpture
  const tower = new THREE.Group();
  tower.position.set(9.5, 0, 3);
  tower.add(cyl(0.08, 0.08, 4, mat('#555'), 6, 0, 2, 0));
  tower.add(box(0.8, 0.5, 0.9, mat('#222'), 0, 4.2, 0));
  const beamGeo = new THREE.ConeGeometry(4.5, 1, 20, 1, true);
  beamGeo.translate(0, -0.5, 0); // apex at the projector
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  const from = new THREE.Vector3(9.5, 4.3, 3), to = new THREE.Vector3(0, H * 0.55, -9.5);
  const dir = to.clone().sub(from);
  beam.scale.set(1, dir.length(), 1);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  beam.position.set(0, 4.3, 0);
  tower.add(beam);
  g.add(tower);
  colliders.push({ type: 'circle', x: 9.5, z: 3, r: 0.4 });
  g.userData.mapping = { uniforms, beam };
  g.userData.animate = (t) => { uniforms.uTime.value = t; };
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

  // ---- the real fire pit, off to the side, with log benches
  const PIT = { x: 10.5, z: 3 };
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
  const RACK = { x: -8, z: -1.5 };
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

  // ---- the wooden Shiva (seated, ~7.5 m)
  const woodA = woodMat('#b98a55'), woodB = woodMat('#9a6a3a'), woodC = woodMat('#7a4f2a');
  const shiva = new THREE.Group();
  shiva.position.set(0, 0, -8);
  g.add(shiva);
  shiva.add(cyl(2.8, 3.1, 0.7, woodC, 8, 0, 0.35, 0));                  // plinth
  // crossed legs (lotus)
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 2.3, 4, 8), woodA);
    leg.rotation.set(0, s * 0.55, Math.PI / 2);
    leg.position.set(s * 0.25, 1.35, 0.55 + (s > 0 ? 0.15 : 0));
    leg.castShadow = true;
    shiva.add(leg);
  }
  const torso = cyl(1.0, 1.3, 2.4, woodA, 10, 0, 2.95, 0);
  shiva.add(torso);
  shiva.add(box(2.9, 0.7, 1.1, woodB, 0, 4.05, 0));                        // shoulders
  shiva.add(cyl(0.34, 0.4, 0.5, woodA, 8, 0, 4.55, 0));                    // neck
  const snake = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.1, 5, 14), woodC);
  snake.rotation.x = Math.PI / 2;
  snake.position.set(0, 4.45, 0);
  shiva.add(snake);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 10, 8), woodA);
  head.scale.set(0.92, 1.12, 0.95);
  head.position.set(0, 5.35, 0);
  head.castShadow = true;
  shiva.add(head);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), woodB); // jata (hair knot)
  bun.scale.set(1, 1.3, 1);
  bun.position.set(0, 6.35, -0.1);
  shiva.add(bun);
  const moon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 4, 10, Math.PI), woodC);
  moon.position.set(0.25, 6.15, 0.35);
  moon.rotation.set(0.3, 0, -0.6);
  shiva.add(moon);
  const eye3 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshStandardMaterial({ color: '#ffcc66', emissive: '#ff8a00', emissiveIntensity: 1.2 }));
  eye3.position.set(0, 5.55, 0.68);
  shiva.add(eye3);
  for (const x of [-0.26, 0.26]) shiva.add(box(0.22, 0.04, 0.05, woodC, x, 5.38, 0.66)); // closed eyes
  // left arm resting on the knee (mudra)
  shiva.add(strut(new THREE.Vector3(-1.35, 4.0, 0), new THREE.Vector3(-1.65, 2.9, 0.4), 0.3, woodA));
  shiva.add(strut(new THREE.Vector3(-1.65, 2.9, 0.4), new THREE.Vector3(-1.2, 1.85, 1.3), 0.26, woodA));
  const lh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), woodB);
  lh.position.set(-1.15, 1.8, 1.4);
  shiva.add(lh);
  // right arm holding the trident (trishul)
  shiva.add(strut(new THREE.Vector3(1.35, 4.0, 0), new THREE.Vector3(1.9, 3.0, 0.3), 0.3, woodA));
  shiva.add(strut(new THREE.Vector3(1.9, 3.0, 0.3), new THREE.Vector3(2.25, 3.9, 0.55), 0.26, woodA));
  const rh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), woodB);
  rh.position.set(2.25, 3.95, 0.55);
  shiva.add(rh);
  const metal = mat('#8a8f96', { metalness: 0.6, roughness: 0.35 });
  shiva.add(cyl(0.09, 0.09, 8.2, woodC, 6, 2.3, 4.1, 0.55));               // shaft
  shiva.add(box(1.4, 0.14, 0.14, metal, 2.3, 7.9, 0.55));                   // crossbar
  for (const x of [-0.62, 0, 0.62]) {
    const prong = new THREE.Mesh(new THREE.ConeGeometry(0.13, x === 0 ? 1.1 : 0.85, 5), metal);
    prong.position.set(2.3 + x, x === 0 ? 8.5 : 8.35, 0.55);
    shiva.add(prong);
  }
  const drum = cyl(0.2, 0.2, 0.3, woodC, 8, 2.3, 7.1, 0.55); // damaru on the trident
  drum.rotation.z = Math.PI / 2;
  shiva.add(drum);
  shiva.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  colliders.push({ type: 'circle', x: 0, z: -8, r: 3.1 });

  const sign = signPost('FIRESPACE', { width: 3.0, height: 1.0, bg: '#3a1a0a', fg: '#ffb060' });
  sign.position.set(-5, 0, 6.8);
  g.add(sign);

  g.userData.spots = spots;
  g.userData.animate = (t) => {
    flames.forEach((f, i) => { const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.18; f.scale.set(1, k, 1); });
    fireLight.intensity = 7 + Math.sin(t * 13) * 1.5 + Math.sin(t * 7.3) * 1.2;
    ringLeds.forEach((l, i) => l.material.color.setHSL((0.05 + Math.sin(t * 0.7 + i * 0.4) * 0.05 + 1) % 1, 1, 0.5 + 0.1 * Math.sin(t * 3 + i)));
  };
  return { object: g, colliders };
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
export function buildMarket() {
  const g = new THREE.Group();
  const colliders = [];
  const roofs = ['#c0392b', '#2a8a7a', '#e67e22', '#6a3d9a', '#1a8aa8'];
  const goods = [['#e84a8a', '#f1c40f', '#3ad1ff'], ['#7fb040', '#c0602a'], ['#f4f1ea', '#b8283a', '#d6a21e'], ['#2a2a2a', '#9a6a3a'], ['#ff7a1a', '#35ff6a', '#b07aff']];
  const wood = woodMat('#8a6a42');
  roofs.forEach((rc, i) => {
    const x = -8 + i * 4, z = i % 2 ? 1.2 : -1.2, rot = i % 2 ? Math.PI : 0;
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
    colliders.push({ type: 'box', x, z: z + (rot ? -0.6 : 0.6), hw: 1.5, hd: 0.5 });
  });
  // string of lights over the market street
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), new THREE.MeshBasicMaterial({ color: ['#ffd24a', '#ff6ab4', '#5ad1ff'][i % 3] }));
    b.position.set(-9 + t * 18, 2.9 - Math.sin(t * Math.PI * 4) * 0.25, 0);
    g.add(b);
  }
  const sign = signPost('SHOPS', { width: 2.0, height: 0.8, bg: '#2a1a3a', fg: '#ffd24a' });
  sign.position.set(-10.5, 0, 3.5);
  g.add(sign);
  return { object: g, colliders };
}
