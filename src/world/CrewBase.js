import * as THREE from 'three';
import { Assets } from '../core/Assets.js';
import { CREW_BASE, AREAS, LANDMARKS } from './layout.js';
import { mat, box, cyl, corrugated, textPlane, signPost, dixi, fenceRun, beerBench, bauwagen } from './Props.js';

// Crew base (the real crew camp): white site cabins – office, Matze's, Corni's, the workshop,
// two storage cabins – the Aufenthaltszelt, pickup, generator. Registers named "spots" used by quests.

const CONTAINER_LEN = 6.06, CONTAINER_W = 2.44, CONTAINER_H = 2.6;

/** A GLTF container turned so its long side is along X, sized like a 20ft container. */
function containerModel(kind = 'container', color) {
  const m = Assets.model(kind, { length: kind === 'container' ? CONTAINER_LEN * 1.4 : CONTAINER_LEN });
  const b = new THREE.Box3().setFromObject(m);
  const s = b.getSize(new THREE.Vector3());
  if (s.z > s.x) m.children[0].rotation.y = Math.PI / 2;
  const g = new THREE.Group();
  g.add(m);
  // re-centre after rotation
  const b2 = new THREE.Box3().setFromObject(g);
  const c = b2.getCenter(new THREE.Vector3());
  m.position.x -= c.x; m.position.z -= c.z;
  if (color) {
    m.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.color.lerp(new THREE.Color(color), 0.6);
      }
    });
  }
  const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  return { group: g, size };
}

export function buildCrewBase(world) {
  const { scene, colliders, spots } = world;
  const base = new THREE.Group();
  const c = CREW_BASE.center;
  base.position.set(c.x, 0, c.z);
  base.rotation.y = CREW_BASE.rotation;
  scene.add(base);
  base.updateMatrixWorld(true);

  const toWorld = (x, z) => new THREE.Vector3(x, 0, z).applyMatrix4(base.matrixWorld);
  const addBoxCollider = (x, z, hw, hd, rot = 0, tag) => {
    const w = toWorld(x, z);
    colliders.addBox(w.x, w.z, hw, hd, rot + CREW_BASE.rotation, tag);
  };
  const addSpot = (name, x, z, y = 0) => {
    const w = toWorld(x, z);
    w.y = y;
    spots[name] = w;
  };
  const HW = CREW_BASE.halfW, HD = CREW_BASE.halfD;

  // ------------------------------------------------ fence with gates
  const corners = [[-HW, -HD], [HW, -HD], [HW, HD], [-HW, HD]];
  const segs = [];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(len / 3.5);
    for (let k = 0; k < n; k++) {
      const x0 = ax + ((bx - ax) * k) / n, z0 = az + ((bz - az) * k) / n;
      const x1 = ax + ((bx - ax) * (k + 1)) / n, z1 = az + ((bz - az) * (k + 1)) / n;
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      if (CREW_BASE.gates.some((g) => Math.hypot(g.x - mx, g.z - mz) < g.w / 2)) continue;
      const a = toWorld(x0, z0), b = toWorld(x1, z1);
      segs.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
      colliders.addWall(a.x, a.z, b.x, b.z, 0.3, 'basefence').h = 2.0;
    }
  }
  scene.add(fenceRun(segs));
  // gate posts + signs
  for (const g of CREW_BASE.gates) {
    const along = Math.abs(g.z) > Math.abs(g.x) ? [1, 0] : [0, 1];
    for (const s of [-1, 1]) {
      base.add(box(0.3, 2.6, 0.3, mat('#d6b23a'), g.x + (along[0] * s * g.w) / 2, 1.3, g.z + (along[1] * s * g.w) / 2));
    }
  }
  const s1 = signPost('CREW BASE', { width: 3, height: 1.4, bg: '#1a2a1a', fg: '#e8b04a' });
  s1.position.set(7, 0, HD + 1.2);
  base.add(s1);
  const s2 = signPost('CREW BASE', { width: 3, height: 1.4, bg: '#1a2a1a', fg: '#e8b04a' });
  s2.position.set(-4.5, 0, -HD - 1.2);
  s2.rotation.y = Math.PI;
  base.add(s2);

  // ------------------------------------------------ Baucontainer (site cabins) like on the real crew camp
  // Everything is squeezed into the west side, as on the aerial photo: the two storage cabins in the
  // north-west corner; below them Matze's and the office end to end along the west fence, Corni's
  // across a narrow lane with the Aufenthaltszelt right behind it, the big workshop closing the lane in the south.
  // storage cabins (closed): Künstlergasse & Hühnercontainer – things lie in front of them
  buildStorage(base, addBoxCollider, addSpot, { id: 'kuenstler', x: -15.5, z: -18, rot: 0, label: 'KÜNSTLERGASSE', frame: '#c9b02a' });
  buildStorage(base, addBoxCollider, addSpot, { id: 'huehner', x: -2.5, z: -19, rot: 0.15, label: 'HÜHNERCONTAINER', frame: '#3040b0' });
  // a few chickens in front of the Hühnercontainer (of course)
  const chickens = [];
  for (let i = 0; i < 4; i++) {
    const ch = chicken();
    ch.position.set(-5 + i * 1.3, 0, -15.4 + (i % 2) * 0.8);
    ch.rotation.y = i * 1.7;
    base.add(ch);
    chickens.push(ch);
  }
  world.animated.push((t) => chickens.forEach((ch, i) => {
    ch.userData.head.rotation.x = Math.max(0, Math.sin(t * 3 + i * 2)) * 0.9; // pecking
    ch.rotation.y += Math.sin(t * 0.4 + i) * 0.004;
  }));

  // walk-in cabins: Matze's (volunteers hang out), Corni's (Mahdi listens to music), the workshop
  buildCabin(base, world, addBoxCollider, addSpot, {
    id: 'matze', x: -14.98, z: -3.2, rot: Math.PI / 2, label: 'MATZE', frame: '#7a3aa8',
    furnish: (g, add, col, spot) => {
      add(box(2.0, 0.42, 0.7, mat('#6a3d2a'), 0, 0.3, -0.8));            // sofa
      add(box(2.0, 0.5, 0.18, mat('#5a321f'), 0, 0.72, -1.08));
      add(box(0.8, 0.4, 0.5, mat('#8a6a42'), 0, 0.2, 0.1));              // coffee table
      add(box(0.6, 1.5, 0.6, mat('#e8e8e8'), 2.5, 0.75, -0.8));          // fridge
      add(box(0.9, 0.6, 0.02, mat('#c0392b'), -1.6, 1.6, -1.12));        // poster
      col(0, -0.85, 1.0, 0.35); col(2.5, -0.8, 0.3, 0.3);
      spot('matze_seat1', -0.5, -0.55); spot('matze_seat2', 0.5, -0.55); spot('matze_face', 0, 0.8);
    },
  });
  buildCabin(base, world, addBoxCollider, addSpot, {
    id: 'corni', x: -8.94, z: 1, rot: -Math.PI / 2, label: 'CORNI', frame: '#20a8b0',
    furnish: (g, add, col, spot) => {
      add(box(1.6, 0.06, 0.7, mat('#c9a27a'), 1.6, 0.78, -0.75));        // desk
      for (const [x, z] of [[0.9, -1.0], [2.3, -1.0], [0.9, -0.5], [2.3, -0.5]]) add(box(0.05, 0.76, 0.05, mat('#444'), x, 0.39, z));
      add(box(0.5, 0.3, 0.25, mat('#1a1a1a'), 2.1, 0.96, -0.8));         // radio / speaker
      add(box(1.2, 0.8, 0.02, mat('#f4f0e0'), -1.2, 1.5, -1.12));        // site plan copy
      add(box(0.4, 1.8, 0.4, mat('#7a5a3a'), -2.6, 0.9, -0.8));          // shelf
      col(1.6, -0.75, 0.85, 0.4); col(-2.6, -0.8, 0.25, 0.25);
      spot('corni_seat', 1.4, -0.1); spot('corni_desk', 1.4, -1.0);
    },
  });
  // the workshop is a proper shed, three cabins deep, with a small lean-to roof on its east side
  const WS_W = 8.4, WS_D = 7.3, wsBack = -WS_D / 2;
  buildCabin(base, world, addBoxCollider, addSpot, {
    id: 'werkstatt', x: -11.9, z: 10.68, rot: Math.PI, label: 'WERKSTATT', frame: '#b8302a', w: WS_W, d: WS_D, doorX: 0, winX: 2.6, lblX: -2.4,
    furnish: (g, add, col, spot) => {
      add(box(2.4, 0.08, 0.7, mat('#8a6a42'), 1.3, 0.9, wsBack + 0.42));          // workbench
      add(box(2.4, 0.86, 0.66, mat('#5a4a3a'), 1.3, 0.43, wsBack + 0.42));
      add(box(0.2, 0.18, 0.3, mat('#3a5a8a', { metalness: 0.5 }), 0.4, 1.03, wsBack + 0.42)); // vise
      add(box(2.4, 1.0, 0.04, mat('#c8a878'), 1.3, 1.7, wsBack + 0.1));           // tool wall
      const tools = ['#c0392b', '#7f8c8d', '#e67e22', '#2c3e50', '#16a085', '#8e44ad'];
      tools.forEach((c, i) => add(box(0.08, 0.35 + (i % 3) * 0.1, 0.04, mat(c), 0.4 + i * 0.35, 1.7, wsBack + 0.14)));
      add(box(0.45, 0.28, 0.22, mat('#1a1a1a'), 2.3, 1.08, wsBack + 0.52));        // radio
      add(box(0.5, 1.8, 0.5, mat('#6a6a6a', { metalness: 0.4 }), -2.5, 0.9, wsBack + 0.42)); // shelf
      add(cyl(0.25, 0.3, 0.5, mat('#2d6a9f'), 10, -1.4, 0.25, wsBack + 0.42));    // compressor
      col(1.3, wsBack + 0.42, 1.25, 0.4); col(-2.5, wsBack + 0.42, 0.3, 0.3); col(-1.4, wsBack + 0.42, 0.3, 0.3);
      // long shelves along the side walls, a second bench and a pile of timber – it is big in here
      for (const sx of [-1, 1]) {
        const x = sx * (WS_W / 2 - 0.4);
        add(box(0.5, 2.0, 3.6, mat('#7a5a3a'), x, 1.0, -0.6));
        for (let i = 0; i < 6; i++) add(box(0.4, 0.3, 0.45, mat(tools[(i + (sx > 0 ? 3 : 0)) % 6]), x, 0.75 + (i % 2) * 0.62, -2.0 + Math.floor(i / 2) * 1.3));
        col(x, -0.6, 0.3, 1.85);
      }
      add(box(1.8, 0.08, 0.8, mat('#8a6a42'), -1.9, 0.85, 0.2));                   // second bench in the middle
      for (const [x, z] of [[-2.7, -0.1], [-1.1, -0.1], [-2.7, 0.5], [-1.1, 0.5]]) add(box(0.07, 0.82, 0.07, mat('#5a4a3a'), x, 0.41, z));
      col(-1.9, 0.2, 0.9, 0.4);
      for (let i = 0; i < 5; i++) add(box(2.2, 0.09, 0.14, mat(i % 2 ? '#c49a62' : '#b08850'), 2.5, 0.06 + Math.floor(i / 3) * 0.1, 3.0 + (i % 3) * 0.17)); // timber along the front wall
      col(2.5, 3.17, 1.1, 0.3);
      spot('werkstatt_inside', 0.4, -1.2); spot('werkstatt_seat', -1.9, 1.3);

      // Vordach: lean-to roof on the east wall (east = cabin -x, the cabin is turned by 180°)
      const vx = -WS_W / 2 - 1.3, vz = 0.3, vl = 4.4;
      const roof = box(2.7, 0.06, vl, corrugated('#b9bdc1'), vx, 2.2, vz);
      roof.rotation.z = -0.16;
      add(roof);
      for (const z of [vz - vl / 2 + 0.15, vz + vl / 2 - 0.15]) {
        add(box(0.1, 2.0, 0.1, mat('#8a6a42'), vx - 1.2, 1.0, z));
        const beam = box(2.5, 0.08, 0.08, mat('#8a6a42'), vx, 2.14, z);
        beam.rotation.z = -0.16;
        add(beam);
        col(vx - 1.2, z, 0.1, 0.1);
      }
      add(box(1.6, 0.06, 0.7, mat('#8a6a42'), vx + 0.75, 0.8, vz));                // sawhorse table under the roof
      for (const z of [vz - 0.6, vz + 0.6]) add(box(0.06, 0.8, 0.5, mat('#6b4a2b'), vx + 0.75, 0.4, z));
      col(vx + 0.75, vz, 0.4, 0.85);
    },
  });
  buildOffice(base, world, addBoxCollider, addSpot, -14.98, 3.2, Math.PI / 2);

  // Aufenthaltszelt: green marquee with beer benches – people hang out here
  buildLoungeTent(base, addBoxCollider, addSpot, -1.6, 2.4);

  // Lagerfeuer next to the tent – sometimes somebody sets up a soundbox here (not allowed either)
  buildCampfire(base, world, addBoxCollider, 6, 3);
  addSpot('campfire', 6, 3);
  addSpot('campfire_box', 8.7, 1.1);

  // aliases for jobs written against the old container numbers
  spots.C1_front = spots.werkstatt_inside;        // tools, shackles, ropes, pegs, screws
  spots.C2_front = spots.kuenstler_front;         // cables & steel wires, drill
  spots.C3_front = spots.huehner_front;           // tents, tarps, yurt
  addSpot('C4_front', 2.6, -16.5);              // deco stuff next to the Hühnercontainer
  addSpot('sauna_site', 16, -8);                  // Krygo's sauna (eternal construction site)

  // ------------------------------------------------ vehicles, pallets, clutter
  const pickup = Assets.model('pickup', { length: 5.3 });
  pickup.position.set(13.5, 0, 8.5);
  pickup.rotation.y = -0.4;
  base.add(pickup);
  world.crewPickup = pickup;
  addBoxCollider(13.5, 8.5, 1.05, 2.6, -0.4, 'pickup'); // the model is long along its z axis
  addSpot('pickup_bed', 13.5 + Math.sin(0.4) * 3.6, 8.5 - Math.cos(0.4) * 3.6); // behind the truck (the bed points to -z)

  // Bauwagen along the east side (the blue one is where Fabi leaves the diesel canister)
  for (const [col, x, z, rot] of [['#2d6a9f', 15.2, 14.2, -Math.PI / 2], ['#a8483a', 17, 1.5, -Math.PI / 2 + 0.12]]) {
    const bw = bauwagen(col);
    bw.position.set(x, 0, z);
    bw.rotation.y = rot;
    base.add(bw);
    addBoxCollider(x, z, 3.05, 1.25, rot, 'crewbase');
  }

  const clutter = [
    ['pallet', { length: 1.2 }, 11, -12, 0.2], ['pallet', { length: 1.2 }, 12.4, -11.6, -0.1],
    ['crate', { height: 0.9 }, 11, -12, 0, 0.14], ['crate', { height: 0.9 }, 3.6, -19.4, 0.5],
    ['cone', { height: 0.7 }, -2, 20], ['cone', { height: 0.7 }, 2, 20],
    ['ladder', { height: 3 }, -12.5, 14.75, 0],
  ];
  for (const [name, opt, x, z, rot = 0, y = 0] of clutter) {
    const m = Assets.model(name, opt);
    m.position.set(x, y, z);
    m.rotation.y = rot;
    base.add(m);
  }
  addBoxCollider(11.7, -11.8, 1.5, 0.8, 0, 'crewbase');
  addBoxCollider(3.6, -19.4, 0.5, 0.5, 0, 'crewbase');

  // cable drums
  for (let i = 0; i < 3; i++) {
    const drum = cyl(0.7, 0.7, 0.6, mat('#8a5a2b'), 12, 6.5 + i * 1.6, 0.7, -19.5);
    drum.rotation.x = Math.PI / 2;
    base.add(drum);
  }
  addBoxCollider(8.1, -19.5, 2.4, 0.5, 0, 'crewbase');

  // flag pole with festival flag
  base.add(cyl(0.06, 0.06, 8, mat('#cccccc', { metalness: 0.6 }), 6, 18.5, 4, 6));
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: Assets.textures.logo, side: THREE.DoubleSide, color: '#ffffff' }));
  flag.position.set(19.75, 7.1, 6);
  base.add(flag);
  world.animated.push((t) => { flag.rotation.y = Math.sin(t * 1.3) * 0.25; });

  // ------------------------------------------------ power generator (Felix' baby)
  const gen = new THREE.Group();
  gen.add(box(3.2, 1.8, 1.4, mat('#2f6b3a'), 0, 0.9, 0));
  gen.add(box(3.3, 0.12, 1.5, mat('#1f4a28'), 0, 1.86, 0));
  gen.add(cyl(0.08, 0.08, 0.7, mat('#333'), 6, 1.2, 2.2, 0.3));
  const genSign = textPlane('STROM 100 kVA', 1.6, 0.3, { w: 512, h: 96, bg: '#ffd400', fg: '#111', font: 'bold 56px sans-serif' });
  genSign.position.set(0, 1.3, 0.71);
  gen.add(genSign);
  gen.position.set(-14, 0, 17.3);
  base.add(gen);
  addBoxCollider(-14, 17.3, 1.65, 0.75, 0, 'crewbase');
  addSpot('generator', -11, 18.6);

  addSpot('spawn', 0, 9);
  addSpot('base_yard', 10, -7);
  addSpot('diesel_spot', 12, 14.2);          // diesel canister next to the blue Bauwagen

  // ------------------------------------------------ registration desk (Jan)
  base.add(box(2.2, 0.06, 0.9, mat('#c9a27a'), 5, 0.78, 15.6));
  for (const [x, z] of [[4.05, 15.2], [5.95, 15.2], [4.05, 16], [5.95, 16]]) base.add(box(0.05, 0.76, 0.05, mat('#444'), x, 0.39, z));
  base.add(box(0.45, 0.3, 0.03, mat('#222'), 4.6, 0.97, 15.4));
  base.add(box(0.35, 0.18, 0.25, mat('#e74c3c'), 5.7, 0.9, 15.7)); // box of wristbands
  addBoxCollider(5, 15.6, 1.15, 0.5, 0, 'crewbase');
  const reg = signPost('EINLASS', { width: 2.2, height: 1.0, bg: '#ffe066', fg: '#222' });
  reg.position.set(7, 0, 16.3);
  base.add(reg);
  addSpot('registration', 5, 14.5);

  // ------------------------------------------------ diesel tank (IBC) for the Radlader
  const ibc = new THREE.Group();
  ibc.add(box(1.2, 0.15, 1.0, mat('#8a6b4a'), 0, 0.08, 0));
  ibc.add(box(1.1, 1.0, 0.95, new THREE.MeshStandardMaterial({ color: '#f2f2ea', transparent: true, opacity: 0.85, roughness: 0.4 }), 0, 0.68, 0));
  ibc.add(box(1.14, 0.05, 0.99, mat('#9aa0a6', { metalness: 0.7 }), 0, 1.2, 0));
  const ibcSign = textPlane('DIESEL', 0.8, 0.3, { w: 256, h: 96, bg: '#ffd400', fg: '#111', font: 'bold 60px sans-serif' });
  ibcSign.position.set(0, 0.8, 0.49);
  ibc.add(ibcSign);
  ibc.position.set(-18.5, 0, -8);
  base.add(ibc);
  addBoxCollider(-18.5, -8, 0.65, 0.55, 0, 'crewbase');
  addSpot('diesel_tank', -16.3, -8);

  // vehicle parking (world heading = base rotation + local heading)
  world.vehicleSpots = {
    quad: { pos: toWorld(0, 12.5), heading: CREW_BASE.rotation + Math.PI / 2 },
    radlader: { pos: toWorld(13.2, -4.5), heading: CREW_BASE.rotation },
  };

  // ------------------------------------------------ crew camp tents along the camp strip
  const tents = [];
  const camp = AREAS.crewCamp;
  const bbox = camp.reduce((b, p) => ({ x0: Math.min(b.x0, p.x), x1: Math.max(b.x1, p.x), z0: Math.min(b.z0, p.z), z1: Math.max(b.z1, p.z) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
  let tries = 0;
  const domeCols = ['#2e86de', '#e67e22', '#27ae60', '#c0392b', '#8e44ad', '#f1c40f'];
  world.campTents = [];
  // "no soundboxes" signs around the camping (people put them up anyway)
  const cx = camp.reduce((a, p) => a + p.x, 0) / camp.length, cz = camp.reduce((a, p) => a + p.z, 0) / camp.length;
  const signAt = (a, b, t, rot) => {
    let x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    const d = Math.hypot(cx - x, cz - z) || 1;
    x += (cx - x) / d * 4; z += (cz - z) / d * 4;
    const sg = noSpeakerSign();
    sg.position.set(x, 0, z);
    sg.rotation.y = rot ?? Math.atan2(cx - x, cz - z) + Math.PI;
    scene.add(sg);
    world.colliders.addCircle(x, z, 0.15, 'sign');
    tents.push({ x, z }); // keep tents off the signs
  };
  signAt(camp[0], camp[1], 0.1); signAt(camp[0], camp[1], 0.45); signAt(camp[0], camp[1], 0.8); signAt(camp[3], camp[0], 0.5); signAt(camp[2], camp[3], 0.6);
  const nSigns = tents.length;
  while (tents.length < 60 + nSigns && tries++ < 2500) {
    const x = bbox.x0 + Math.random() * (bbox.x1 - bbox.x0);
    const z = bbox.z0 + Math.random() * (bbox.z1 - bbox.z0);
    if (!pointInPoly(x, z, camp)) continue;
    if (world.onRoad(x, z, 2)) continue;
    if (Math.hypot(x - LANDMARKS.chill.x, z - LANDMARKS.chill.z) < 7) continue; // keep Zdenko's bench free
    if (tents.some((t) => Math.hypot(t.x - x, t.z - z) < 6)) continue;
    tents.push({ x, z });
    let t;
    if (Math.random() < 0.35) {
      t = Assets.model('tent_crew', { length: 3.2 });
    } else {
      t = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(domeCols[tents.length % domeCols.length]));
      dome.scale.set(1.2, 0.85, 1);
      dome.castShadow = true;
      t.add(dome);
    }
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI * 2;
    t.visible = false;
    scene.add(t);
    world.campTents.push({ obj: t, x, z, col: null });
  }

  return base;
}

function buildOffice(base, world, addBoxCollider, addSpot, ox, oz, rot = 0) {
  const { colliders } = world;
  const W = 6.06, D = 2.44, H = CONTAINER_H;
  const g = new THREE.Group();
  g.position.set(ox, 0, oz);
  g.rotation.y = rot;
  base.add(g);
  world.cameraBlockers.push(g);

  const steelOut = corrugated('#dfe3e6');
  steelOut.map.repeat.set(3, 1);
  const inner = mat('#f1ede4');
  const t = 0.1;
  // floor
  g.add(box(W, 0.15, D, mat('#6d6258'), 0, 0.08, 0));
  // back wall
  g.add(box(W, H, t, steelOut, 0, H / 2, -D / 2));
  // side walls
  g.add(box(t, H, D, steelOut, -W / 2, H / 2, 0));
  g.add(box(t, H, D, steelOut, W / 2, H / 2, 0));
  // front wall with door gap (door at x=+1.6) and a window
  const doorX = 1.6, doorW = 1.2;
  const leftW = W / 2 + doorX - doorW / 2;
  g.add(box(leftW, H, t, steelOut, -W / 2 + leftW / 2, H / 2, D / 2));
  const rightW = W / 2 - doorX - doorW / 2;
  g.add(box(rightW, H, t, steelOut, W / 2 - rightW / 2, H / 2, D / 2));
  g.add(box(doorW, H - 2.1, t, steelOut, doorX, 2.1 + (H - 2.1) / 2, D / 2));
  const glass = new THREE.MeshStandardMaterial({ color: '#9fd3f0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 });
  const win = box(1.6, 0.9, 0.12, glass, -1.2, 1.5, D / 2);
  win.castShadow = false;
  g.add(win);
  // open door leaf
  const door = box(doorW, 2.05, 0.05, mat('#2e4d6b'), doorX + doorW / 2 + 0.02, 1.05, D / 2 + doorW / 2);
  door.rotation.y = Math.PI / 2;
  g.add(door);
  // roof (hidden while the player is inside)
  const roof = box(W + 0.1, 0.12, D + 0.1, corrugated('#c9cdd1'), 0, H + 0.06, 0);
  g.add(roof);
  // label
  const lbl = textPlane('BÜRO', 1.6, 0.5, { w: 344, h: 108, bg: '#1b1b1b', fg: '#ffd24a', font: 'bold 60px sans-serif' });
  lbl.position.set(-0.8, 2.35, D / 2 + 0.07);
  g.add(lbl);
  // interior walls lining
  const lining = box(W - 0.25, H - 0.1, 0.02, inner, 0, H / 2, -D / 2 + 0.07);
  lining.castShadow = false;
  g.add(lining);

  // --- interior furniture (everything along the back wall, the cabin is only 2.4 m deep)
  const desk = box(2.2, 0.06, 0.7, mat('#c9a27a'), -1.4, 0.78, -0.8);
  g.add(desk);
  for (const [x, z] of [[-2.4, -0.5], [-0.4, -0.5], [-2.4, -1.1], [-0.4, -1.1]]) g.add(box(0.05, 0.76, 0.05, mat('#444'), x, 0.39, z));
  g.add(box(0.5, 0.33, 0.03, mat('#222'), -1.2, 0.98, -0.98)); // laptop screen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.29), new THREE.MeshBasicMaterial({ color: '#4aa3ff' }));
  screen.position.set(-1.2, 0.98, -0.96); g.add(screen);
  g.add(box(0.5, 0.02, 0.35, mat('#333'), -1.2, 0.82, -0.75));
  // coffee machine (the most important piece of festival infrastructure)
  g.add(box(0.35, 0.45, 0.35, mat('#b33a2e'), -2.2, 1.04, -0.9));
  for (let i = 0; i < 4; i++) g.add(cyl(0.05, 0.045, 0.1, mat('#ffffff'), 6, -1.9 + i * 0.12, 0.86, -0.55));
  // chair
  g.add(box(0.5, 0.06, 0.5, mat('#222'), -2.2, 0.48, -0.05));
  g.add(box(0.06, 0.5, 0.5, mat('#222'), -2.45, 0.75, -0.05));
  g.add(cyl(0.03, 0.03, 0.45, mat('#555'), 5, -2.2, 0.23, -0.05));
  // whiteboard with the real site plan
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), new THREE.MeshBasicMaterial({ map: Assets.textures.siteplan }));
  plan.position.set(1.2, 1.5, -D / 2 + 0.1);
  g.add(plan);
  g.add(box(2.1, 1.5, 0.03, mat('#dddddd'), 1.2, 1.5, -D / 2 + 0.08));
  // shelf with binders
  g.add(box(0.4, 1.8, 1.0, mat('#8a6b4a'), W / 2 - 0.3, 0.9, -0.6));
  const binderCols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad'];
  for (let i = 0; i < 10; i++) g.add(box(0.3, 0.32, 0.07, mat(binderCols[i % 5]), W / 2 - 0.35, 1.25 + (i > 4 ? 0.45 : 0), -0.95 + (i % 5) * 0.12));
  // ceiling light
  const lamp = new THREE.PointLight('#fff1d6', 6, 8, 1.5);
  lamp.position.set(0, H - 0.3, 0);
  g.add(lamp);

  // colliders (office coordinates → base)
  const wallT = 0.12;
  const col = (cx, cz, hw, hd) => { const [bx, bz] = cabinLocal(ox, oz, rot, cx, cz); addBoxCollider(bx, bz, hw, hd, rot, 'office'); };
  const spot = (name, cx, cz) => { const [sx, sz] = cabinLocal(ox, oz, rot, cx, cz); addSpot(name, sx, sz); };
  col(0, -D / 2, W / 2, wallT);
  col(-W / 2, 0, wallT, D / 2);
  col(W / 2, 0, wallT, D / 2);
  col(-W / 2 + leftW / 2, D / 2, leftW / 2, wallT);
  col(W / 2 - rightW / 2, D / 2, rightW / 2, wallT);
  col(-1.4, -0.8, 1.15, 0.38); // desk
  col(W / 2 - 0.3, -0.6, 0.25, 0.5); // shelf

  spot('office_boss', -1.2, 0.3);
  spot('office_door', doorX, D / 2 + 1.8); // the lane in front of the door is narrow
  spot('office_inside', 0.6, 0.3);

  // interior volume: roof hides while the player is inside
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  world.interiors.push({
    contains: (p) => {
      const l = p.clone().applyMatrix4(inv);
      return Math.abs(l.x) < W / 2 && Math.abs(l.z) < D / 2 + 0.2;
    },
    hide: [roof, lbl],
  });
}

export function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, zi = pts[i].z, xj = pts[j].x, zj = pts[j].z;
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// ------------------------------------------------------------------ site cabins
const CAB_W = 6.06, CAB_D = 2.44, CAB_H = 2.6;

/** local (x, z) inside a rotated group at (gx, gz) → base-local coordinates */
function cabinLocal(gx, gz, rot, x, z) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return [gx + x * c + z * s, gz - x * s + z * c];
}

/** White site-container shell with a coloured steel frame. */
function cabinShell(frame, closed, CAB_W = 6.06, CAB_D = 2.44) {
  const g = new THREE.Group();
  const wall = mat('#ecebe4', { roughness: 0.7 });
  const fr = mat(frame, { roughness: 0.6, metalness: 0.2 });
  const t = 0.08;
  g.add(box(CAB_W, 0.14, CAB_D, mat('#6d6258'), 0, 0.07, 0));
  g.add(box(CAB_W, CAB_H, t, wall, 0, CAB_H / 2, -CAB_D / 2));
  g.add(box(t, CAB_H, CAB_D, wall, -CAB_W / 2, CAB_H / 2, 0));
  g.add(box(t, CAB_H, CAB_D, wall, CAB_W / 2, CAB_H / 2, 0));
  // steel frame: corner posts + top/bottom rails
  for (const x of [-CAB_W / 2, CAB_W / 2]) for (const z of [-CAB_D / 2, CAB_D / 2]) g.add(box(0.16, CAB_H + 0.1, 0.16, fr, x, CAB_H / 2, z));
  for (const z of [-CAB_D / 2, CAB_D / 2]) { g.add(box(CAB_W + 0.1, 0.16, 0.16, fr, 0, CAB_H, z)); g.add(box(CAB_W + 0.1, 0.16, 0.16, fr, 0, 0.1, z)); }
  if (closed) {
    g.add(box(CAB_W, CAB_H, t, wall, 0, CAB_H / 2, CAB_D / 2));
    g.add(box(0.95, 2.0, 0.04, fr, -1.6, 1.05, CAB_D / 2 + 0.05)); // closed door
    g.add(box(1.1, 0.7, 0.04, mat('#9fb8c8'), 1.4, 1.55, CAB_D / 2 + 0.05)); // window (shutters)
  }
  return g;
}

/** Closed storage cabin: things you need are dropped in front of its door. */
function buildStorage(base, addBoxCollider, addSpot, { id, x, z, rot, label, frame }) {
  const g = cabinShell(frame, true);
  g.add(box(CAB_W + 0.1, 0.12, CAB_D + 0.1, mat('#d8d8d0'), 0, CAB_H + 0.06, 0));
  const lbl = textPlane(label, 3.4, 0.5, { w: 768, h: 112, bg: '#ffffff', fg: '#1b1b1b', font: 'bold 64px sans-serif' });
  lbl.position.set(0.8, 2.25, CAB_D / 2 + 0.07);
  g.add(lbl);
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  base.add(g);
  addBoxCollider(x, z, CAB_W / 2 + 0.05, CAB_D / 2 + 0.05, rot, 'crewbase');
  const [fx, fz] = cabinLocal(x, z, rot, -1.6, CAB_D / 2 + 1.5);
  addSpot(`${id}_front`, fx, fz);
}

/**
 * Walk-in cabin: door in the front (+z) long side, roof hides while you're inside.
 * furnish(g, add, col, spot) places furniture in cabin coordinates.
 */
function buildCabin(base, world, addBoxCollider, addSpot, { id, x, z, rot, label, frame, furnish, w: CAB_W = 6.06, d: CAB_D = 2.44, doorX = -1.6, winX = doorX + 2.8, lblX = winX }) {
  const g = cabinShell(frame, false, CAB_W, CAB_D);
  const wall = mat('#ecebe4', { roughness: 0.7 });
  const t = 0.08;
  const doorW = 1.2; // wide enough that the nav grid always finds a free cell in the gap
  const leftW = CAB_W / 2 + doorX - doorW / 2, rightW = CAB_W / 2 - doorX - doorW / 2;
  g.add(box(leftW, CAB_H, t, wall, -CAB_W / 2 + leftW / 2, CAB_H / 2, CAB_D / 2));
  g.add(box(rightW, CAB_H, t, wall, CAB_W / 2 - rightW / 2, CAB_H / 2, CAB_D / 2));
  g.add(box(doorW, CAB_H - 2.1, t, wall, doorX, 2.1 + (CAB_H - 2.1) / 2, CAB_D / 2));
  const win = box(1.2, 0.8, 0.1, new THREE.MeshStandardMaterial({ color: '#9fd3f0', roughness: 0.1, transparent: true, opacity: 0.55 }), winX, 1.55, CAB_D / 2);
  win.castShadow = false;
  g.add(win);
  const door = box(doorW, 2.05, 0.05, mat(frame), 0, 1.05, 0);
  const hinge = new THREE.Group();
  hinge.position.set(doorX - doorW / 2, 0, CAB_D / 2 + 0.02);
  door.position.x = doorW / 2;
  hinge.rotation.y = -1.9;
  hinge.add(door);
  g.add(hinge);
  const roof = box(CAB_W + 0.1, 0.12, CAB_D + 0.1, mat('#d8d8d0'), 0, CAB_H + 0.06, 0);
  g.add(roof);
  const lbl = textPlane(label, 2.2, 0.45, { w: 512, h: 104, bg: '#ffffff', fg: '#1b1b1b', font: 'bold 64px sans-serif' });
  lbl.position.set(lblX, 2.25, CAB_D / 2 + 0.07);
  g.add(lbl);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.2), new THREE.MeshBasicMaterial({ color: '#fff4d8' }));
  light.position.set(0, CAB_H - 0.08, 0);
  g.add(light);
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  base.add(g);
  world.cameraBlockers.push(g);

  // walls → colliders (door gap stays open)
  const wallCol = (cx, cz, hw, hd) => { const [bx, bz] = cabinLocal(x, z, rot, cx, cz); addBoxCollider(bx, bz, hw, hd, rot, id); };
  wallCol(0, -CAB_D / 2, CAB_W / 2, 0.06);
  wallCol(-CAB_W / 2, 0, 0.06, CAB_D / 2);
  wallCol(CAB_W / 2, 0, 0.06, CAB_D / 2);
  wallCol(-CAB_W / 2 + leftW / 2, CAB_D / 2, leftW / 2, 0.06);
  wallCol(CAB_W / 2 - rightW / 2, CAB_D / 2, rightW / 2, 0.06);
  furnish?.(
    g,
    (o) => g.add(o),
    (cx, cz, hw, hd) => wallCol(cx, cz, hw, hd),
    (name, cx, cz) => { const [sx, sz] = cabinLocal(x, z, rot, cx, cz); addSpot(name, sx, sz); },
  );
  const [dx, dz] = cabinLocal(x, z, rot, doorX, CAB_D / 2 + 1.4);
  addSpot(`${id}_door`, dx, dz);
  const [ix, iz] = cabinLocal(x, z, rot, 0, 0.2);
  addSpot(`${id}_inside`, ix, iz);

  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  world.interiors.push({
    contains: (p) => {
      const l = p.clone().applyMatrix4(inv);
      return Math.abs(l.x) < CAB_W / 2 && Math.abs(l.z) < CAB_D / 2 + 0.2;
    },
    hide: [roof, lbl],
  });
}

/** Aufenthaltszelt: green marquee, open sides, beer benches. */
function buildLoungeTent(base, addBoxCollider, addSpot, x, z) {
  const g = new THREE.Group();
  const TW = 9, TD = 6, TH = 2.3;
  const pole = mat('#d8d8d8', { metalness: 0.5 });
  for (const px of [-TW / 2, 0, TW / 2]) for (const pz of [-TD / 2, TD / 2]) {
    g.add(cyl(0.05, 0.05, TH, pole, 6, px, TH / 2, pz));
    addBoxCollider(x + px, z + pz, 0.12, 0.12, 0, 'tent');
  }
  const canvas = mat('#2e8b3a', { side: THREE.DoubleSide, roughness: 0.9 });
  // gabled roof
  const hw = TD / 2 + 0.2, rise = 1.3;
  const slope = Math.hypot(hw, rise);
  for (const s of [-1, 1]) {
    const r = box(TW + 0.4, 0.04, slope, canvas, 0, TH + rise / 2, s * hw / 2);
    r.rotation.x = s * Math.atan2(rise, hw);
    r.castShadow = true;
    g.add(r);
  }
  for (const s of [-1, 1]) { // gable triangles
    const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(s * (TW / 2 + 0.2), TH, -hw), new THREE.Vector3(s * (TW / 2 + 0.2), TH, hw), new THREE.Vector3(s * (TW / 2 + 0.2), TH + rise, 0)]);
    tri.computeVertexNormals();
    g.add(new THREE.Mesh(tri, canvas));
  }
  // valance around the edge
  for (const s of [-1, 1]) g.add(box(TW + 0.4, 0.3, 0.03, canvas, 0, TH - 0.1, s * (TD / 2 + 0.2)));
  // beer benches inside
  const benches = [[-2.6, -1.1], [2.6, -1.1], [0, 1.4]];
  benches.forEach(([bx, bz], i) => {
    const b = beerBench();
    b.position.set(bx, 0, bz);
    g.add(b);
    addBoxCollider(x + bx, z + bz, 1.1, 0.35, 0, 'tent');
    addSpot(`tent_seat${i * 2 + 1}`, x + bx - 0.4, z + bz + 0.62);
    addSpot(`tent_seat${i * 2 + 2}`, x + bx + 0.5, z + bz - 0.62);
    addSpot(`tent_table${i + 1}`, x + bx, z + bz);
  });
  const sign = textPlane('AUFENTHALTSZELT', 2.6, 0.4, { w: 768, h: 112, bg: '#ffffff', fg: '#1e5a28', font: 'bold 60px sans-serif' });
  sign.position.set(0, TH - 0.1, TD / 2 + 0.23);
  g.add(sign);
  g.position.set(x, 0, z);
  base.add(g);
  addSpot('aufenthalt', x, z);
}

/** Lagerfeuer: ring of stones, burning logs, a few tree-trunk seats around it. */
function buildCampfire(base, world, addBoxCollider, x, z) {
  const g = new THREE.Group();
  const stone = mat('#8d8a82', { roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.SphereGeometry(0.17 + (i % 3) * 0.03, 6, 5), stone);
    st.scale.y = 0.7;
    st.position.set(Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62);
    g.add(st);
  }
  g.add(cyl(0.55, 0.55, 0.04, mat('#2a2622'), 12, 0, 0.02, 0)); // ash
  for (let i = 0; i < 4; i++) {
    const log = cyl(0.07, 0.07, 0.8, mat('#4a3320'), 6, 0, 0.2, 0);
    log.rotation.z = 1.05; log.rotation.y = i * 1.57 + 0.3;
    g.add(log);
  }
  const flameMat = new THREE.MeshBasicMaterial({ color: '#ff8a1e', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (const [fx, fz, h] of [[0, 0, 0.9], [0.18, 0.1, 0.6], [-0.15, 0.14, 0.55], [0.02, -0.2, 0.65]]) {
    const geo = new THREE.ConeGeometry(0.2, h, 6);
    geo.translate(0, h / 2, 0);
    const f = new THREE.Mesh(geo, flameMat);
    f.position.set(fx, 0.15, fz);
    g.add(f);
    flames.push(f);
  }
  const glow = new THREE.PointLight('#ff9a3a', 5, 9, 1.6);
  glow.position.set(0, 0.9, 0);
  g.add(glow);
  // tree-trunk seats
  for (const a of [0.4, 1.9, 3.5, 5.0]) {
    const sx = Math.cos(a) * 1.9, sz = Math.sin(a) * 1.9;
    g.add(cyl(0.26, 0.28, 0.42, mat('#7a5a3a'), 8, sx, 0.21, sz));
    addBoxCollider(x + sx, z + sz, 0.24, 0.24, 0, 'campfire');
  }
  g.position.set(x, 0, z);
  base.add(g);
  addBoxCollider(x, z, 0.6, 0.6, 0, 'campfire');
  world.animated.push((t) => {
    flames.forEach((f, i) => { const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.2; f.scale.set(1, k, 1); f.rotation.y = t * (1 + i * 0.3); });
    glow.intensity = 5 + Math.sin(t * 11) * 0.8 + Math.sin(t * 5.3) * 0.6;
  });
}

function chicken() {
  const g = new THREE.Group();
  const white = mat('#f4f1ea');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), white);
  body.scale.set(1, 0.85, 1.3);
  body.position.y = 0.26;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0.16);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 5), white);
  hm.position.set(0, 0.06, 0.04);
  head.add(hm);
  head.add(box(0.03, 0.05, 0.06, mat('#d62d20'), 0, 0.14, 0.04));      // comb
  head.add(box(0.03, 0.025, 0.05, mat('#e8a020'), 0, 0.06, 0.12));     // beak
  g.add(head);
  for (const x of [-0.05, 0.05]) g.add(box(0.02, 0.16, 0.02, mat('#e8a020'), x, 0.08, 0));
  g.userData.head = head;
  return g;
}

let noSpeakerTex;
/** Small round sign: loudspeaker, crossed out. No text needed. */
function noSpeakerSign() {
  if (!noSpeakerTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(128, 128, 118, 0, 7); ctx.fill();
    ctx.lineWidth = 22; ctx.strokeStyle = '#d0201a';
    ctx.beginPath(); ctx.arc(128, 128, 106, 0, 7); ctx.stroke();
    // loudspeaker
    ctx.fillStyle = '#111';
    ctx.fillRect(62, 104, 34, 48);
    ctx.beginPath(); ctx.moveTo(96, 104); ctx.lineTo(140, 70); ctx.lineTo(140, 186); ctx.lineTo(96, 152); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = '#111';
    for (const r of [26, 46]) { ctx.beginPath(); ctx.arc(146, 128, r, -0.7, 0.7); ctx.stroke(); }
    // strike-through
    ctx.lineWidth = 22; ctx.strokeStyle = '#d0201a';
    ctx.beginPath(); ctx.moveTo(56, 56); ctx.lineTo(200, 200); ctx.stroke();
    noSpeakerTex = new THREE.CanvasTexture(c);
    noSpeakerTex.colorSpace = THREE.SRGBColorSpace;
  }
  const g = new THREE.Group();
  g.add(cyl(0.03, 0.03, 1.4, mat('#9aa0a6', { metalness: 0.6 }), 6, 0, 0.7, 0));
  const face = new THREE.MeshStandardMaterial({ map: noSpeakerTex, transparent: true, alphaTest: 0.5, roughness: 0.6 });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), face);
  disc.position.set(0, 1.45, 0.03);
  g.add(disc);
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), face); // symbol on both sides
  back.position.set(0, 1.45, 0.01);
  back.rotation.y = Math.PI;
  g.add(back);
  return g;
}
