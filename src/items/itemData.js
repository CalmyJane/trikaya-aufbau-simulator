import * as THREE from 'three';
import { mat, box, cyl } from '../world/Props.js';

// Item definitions. `mesh` is a factory returning the object shown on the ground / carried.
// Add new quest items here and reference them by id from questData.js.
export const ITEMS = {
  sauna_boards: { name: { de: 'Saunabretter (Krygo)', en: 'Sauna boards (Krygo)' }, icon: '🪵', mesh: timberStack },
  sauna_stove: { name: { de: 'Saunaofen', en: 'Sauna stove' }, icon: '🔥', mesh: () => cyl(0.25, 0.25, 0.6, mat('#2a2a2a', { metalness: 0.6 }), 10, 0, 0.3, 0) },
  steel_wire: { name: { de: 'Stahlseil-Rollen', en: 'Steel wire coils' }, icon: '🪢', mesh: wireCoils },
  shackles: { name: { de: 'Schäkel & Spanngurte', en: 'Shackles & ratchet straps' }, icon: '⛓️', mesh: shackleBox },
  diesel_can: { name: { de: 'Dieselkanister', en: 'Diesel canister' }, icon: '⛽', mesh: dieselCan },
  sail_crate: { name: { de: 'Kiste Sonnensegel', en: 'Crate of shade sails' }, icon: '📦', heavy: true, mesh: () => crate('#6a3d7a') },
  tent_chai: { name: { de: 'Chai-Zelt', en: 'Chai tent' }, icon: '🎒', heavy: true, mesh: () => duffel('#c0602a', 1.3) },
  dome_struts_a: { name: { de: 'Zeltstangen (Bündel A)', en: 'Tent poles (bundle A)' }, icon: '🦯', mesh: () => strutBundle('#d9d9d9') },
  dome_struts_b: { name: { de: 'Zeltstangen (Bündel B)', en: 'Tent poles (bundle B)' }, icon: '🦯', mesh: () => strutBundle('#cfd6dd') },
  dome_struts_c: { name: { de: 'Zeltstangen (Bündel C)', en: 'Tent poles (bundle C)' }, icon: '🦯', mesh: () => strutBundle('#c9c3b5') },
  festzelt_bag: { name: { de: 'Techno-Zelt (Paket)', en: 'Techno tent (package)' }, icon: '⛺', heavy: true, mesh: () => duffel('#1f6fc9', 1.4) },
  tent_pegs: { name: { de: 'Heringe', en: 'Tent pegs' }, icon: '📌', mesh: pegBucket },
  wc_container_item: { name: { de: 'WC-Container', en: 'WC container' }, icon: '🚽', heavy: true, mesh: () => crate('#2f6fb3') },
  light_kit: { name: { de: 'Lampen & Kabel', en: 'Lamps & cables' }, icon: '💡', mesh: lightKit },
  awareness_bag: { name: { de: 'Awareness-Jurte (Tasche)', en: 'Awareness yurt (bag)' }, icon: '💜', mesh: () => duffel('#8a5ab8', 0.9) },
  dome_wood: { name: { de: 'Holzstreben (Forest Dome)', en: 'Timber struts (Forest Dome)' }, icon: '🪵', heavy: true, mesh: timberStack },
  rope_bag: { name: { de: 'Seile & Schrauben', en: 'Ropes & screws' }, icon: '🧵', mesh: () => duffel('#6a8a3a', 0.7) },
  dixi_pallet_1: { name: { de: 'Dixi-Palette (6 Stück)', en: 'Dixi pallet (6)' }, icon: '🚻', heavy: true, mesh: dixiPallet },
  dixi_pallet_2: { name: { de: 'Dixi-Palette (4 Stück)', en: 'Dixi pallet (4)' }, icon: '🚻', heavy: true, mesh: dixiPallet },
  veggie_a: { name: { de: 'Gemüsekiste (Karotten)', en: 'Veggie crate (carrots)' }, icon: '🥕', mesh: () => vegCrate('#e67e22') },
  veggie_b: { name: { de: 'Gemüsekiste (Kohl)', en: 'Veggie crate (cabbage)' }, icon: '🥬', mesh: () => vegCrate('#6ab04c') },
  veggie_c: { name: { de: 'Gemüsekiste (Tomaten)', en: 'Veggie crate (tomatoes)' }, icon: '🍅', mesh: () => vegCrate('#e74c3c') },
  tarps: { name: { de: 'Planen', en: 'Tarps' }, icon: '🟦', mesh: () => box(0.8, 0.3, 0.5, mat('#1f5fbf'), 0, 0.15, 0) },
  wood_panels: { name: { de: 'Holzplatten (Mapping-Deko)', en: 'Wooden panels (mapping deco)' }, icon: '🎨', heavy: true, mesh: timberStack },
  auger_old: { name: { de: 'Erdbohrer', en: 'Earth auger' }, icon: '🌀', mesh: () => auger('#b8302a') },
  auger_second: { name: { de: 'Erdbohrer (zweiter)', en: 'Earth auger (second one)' }, icon: '🌀', mesh: () => auger('#d8a020') },
  auger_new: { name: { de: 'Erdbohrer (neu vom Baumarkt)', en: 'Earth auger (new from the DIY store)' }, icon: '🌀', mesh: () => auger('#e87a10') },
  steel_wire_rusty: { name: { de: 'Stahlseil-Rollen (alt)', en: 'Steel wire coils (old)' }, icon: '🪢', mesh: rustyCoils },
  hammock_posts: { name: { de: 'Holzpfosten (Hängematten)', en: 'Wooden posts (hammocks)' }, icon: '🪵', heavy: true, mesh: timberStack },
  hammock_bag: { name: { de: 'Sack voller Hängematten', en: 'Bag full of hammocks' }, icon: '🌈', mesh: () => duffel('#e84a8a', 0.9) },
  straw_bales: { name: { de: 'Strohballen (vom Schwarzhuber)', en: 'Straw bales (from Schwarzhuber)' }, icon: '🌾', heavy: true, mesh: strawStack },
  entrance_tent_bag: { name: { de: 'Stretchzelt (Eingang)', en: 'Stretch tent (entrance)' }, icon: '⛺', heavy: true, mesh: () => duffel('#d9c9a2', 1.4) },
  wristband_boxes: { name: { de: 'Bändchen-Kisten', en: 'Wristband boxes' }, icon: '🎫', mesh: () => box(0.5, 0.3, 0.35, mat('#e74c3c'), 0, 0.15, 0) },
  market_stalls: { name: { de: 'Marktstände', en: 'Market stalls' }, icon: '🏪', heavy: true, mesh: timberStack },
  market_goods: { name: { de: 'Ware für die Shops', en: 'Goods for the shops' }, icon: '💎', mesh: () => duffel('#6a3d9a', 0.8) },
  diag_device: { name: { de: 'Diagnosegerät', en: 'Diagnostic tool' }, icon: '🧰', mesh: () => { const g = new THREE.Group(); g.add(box(0.45, 0.25, 0.3, mat('#f1c40f'), 0, 0.13, 0)); g.add(box(0.2, 0.12, 0.02, mat('#4aa3ff'), 0, 0.2, 0.16)); return g; } },
  narnia_screws: { name: { de: 'Kiste Terrassenschrauben', en: 'Box of deck screws' }, icon: '🔩', mesh: () => box(0.45, 0.25, 0.3, mat('#2f6fb3'), 0, 0.13, 0) },
  narnia_cable: { name: { de: 'Kabeltrommel', en: 'Cable drum' }, icon: '🔌', mesh: cableDrum },
  kg_stretch: { name: { de: 'Stretchzelt (Künstlergasse)', en: 'Stretch tent (Künstlergasse)' }, icon: '⛺', mesh: () => duffel('#e8d2a6', 1.1) },
  kg_royal: { name: { de: 'Königszelt (rot-gold)', en: 'Royal tent (red & gold)' }, icon: '👑', mesh: () => duffel('#a8233a', 1.0) },
  kg_paintings: { name: { de: 'Bilder & Leinwände', en: 'Paintings & canvases' }, icon: '🖼️', mesh: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(box(0.6, 0.45, 0.04, mat(['#e84a8a', '#2a8a7a', '#f1c40f'][i]), 0, 0.25 + i * 0.02, -0.06 + i * 0.06)); return g; } },
  kg_paints: { name: { de: 'Farben & Pinsel', en: 'Paints & brushes' }, icon: '🎨', mesh: () => { const g = new THREE.Group(); g.add(box(0.5, 0.25, 0.35, mat('#8a5a32'), 0, 0.13, 0)); ['#e84a8a', '#5ad1ff', '#f1c40f'].forEach((c, i) => g.add(cyl(0.06, 0.06, 0.12, mat(c), 8, -0.14 + i * 0.14, 0.31, 0))); return g; } },
  water_tank: { name: { de: 'Wassertank (1000 l)', en: 'Water tank (1000 l)' }, icon: '💧', heavy: true, mesh: () => { const g = new THREE.Group(); g.add(box(1.1, 1.0, 0.95, mat('#f4f4ee'), 0, 0.55, 0)); g.add(box(1.2, 0.12, 1.05, mat('#b89a6a'), 0, 0.06, 0)); return g; } },
  spezial_nuss: { name: { de: 'Die Spezial-Nuss', en: 'The special nut' }, icon: '🔩', mesh: () => { const g = new THREE.Group(); const n = cyl(0.09, 0.09, 0.07, mat('#c9b24a', { metalness: 0.8, roughness: 0.3 }), 6, 0, 0.05, 0); g.add(n); return g; } },
  wardrobe: { name: { de: 'Alter Kleiderschrank', en: 'Old wardrobe' }, icon: '🚪', heavy: true, mesh: () => box(1.0, 1.6, 0.6, mat('#7a4f2a'), 0, 0.8, 0) },
  fake_snow: { name: { de: 'Kunstschnee & Schneeflocken', en: 'Fake snow & snowflakes' }, icon: '❄️', mesh: () => duffel('#dff0ff', 0.8) },
  lantern: { name: { de: 'Laterne', en: 'Lantern' }, icon: '🏮', mesh: () => { const g = new THREE.Group(); g.add(box(0.25, 0.35, 0.25, mat('#1a1a1a'), 0, 0.2, 0)); g.add(box(0.18, 0.25, 0.18, mat('#ffd98a', { emissive: '#ffb030', emissiveIntensity: 1 }), 0, 0.2, 0)); return g; } },
  drill: { name: { de: 'Akkuschrauber', en: 'Cordless drill' }, icon: '🪛', mesh: () => { const g = new THREE.Group(); g.add(box(0.1, 0.25, 0.08, mat('#2ea84a'), 0, 0.13, 0)); g.add(box(0.28, 0.1, 0.08, mat('#2ea84a'), 0.1, 0.28, 0)); return g; } },
  spirit_level: { name: { de: 'Wasserwaage', en: 'Spirit level' }, icon: '📏', mesh: () => box(0.9, 0.06, 0.05, mat('#f1c40f'), 0, 0.03, 0) },
};

/** Two-man petrol earth auger: engine block, handlebar, spiral drill. */
function auger(color) {
  const g = new THREE.Group();
  g.add(box(0.35, 0.3, 0.3, mat(color), 0, 0.95, 0));
  const bar = cyl(0.025, 0.025, 1.2, mat('#333'), 6, 0, 1.05, 0);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  g.add(cyl(0.035, 0.035, 0.8, mat('#777', { metalness: 0.6 }), 6, 0, 0.45, 0));
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 4, 10), mat('#888', { metalness: 0.6 }));
    t.rotation.x = Math.PI / 2 + 0.3;
    t.position.y = 0.12 + i * 0.12;
    g.add(t);
  }
  return g;
}

function rustyCoils() {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 16), mat('#8a4a22', { roughness: 1 }));
    c.rotation.x = Math.PI / 2;
    c.position.set(i * 0.2 - 0.1, 0.08 + i * 0.14, 0);
    g.add(c);
  }
  return g;
}

function strawStack() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(box(1.0, 0.45, 0.55, mat(i % 2 ? '#d9c27a' : '#cdb26a'), (i % 2) * 0.5 - 0.25, 0.23 + Math.floor(i / 2) * 0.46, 0));
  return g;
}

function cableDrum() {
  const g = new THREE.Group();
  for (const z of [-0.12, 0.12]) { const d = cyl(0.22, 0.22, 0.03, mat('#c0392b'), 12, 0, 0.22, z); d.rotation.x = Math.PI / 2; g.add(d); }
  const core = cyl(0.14, 0.14, 0.22, mat('#222'), 10, 0, 0.22, 0);
  core.rotation.x = Math.PI / 2;
  g.add(core);
  return g;
}

function wireCoils() {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 16), mat('#6a7078', { metalness: 0.8, roughness: 0.35 }));
    c.rotation.x = Math.PI / 2;
    c.position.set(i * 0.2 - 0.1, 0.08 + i * 0.14, 0);
    g.add(c);
  }
  return g;
}

function shackleBox() {
  const g = new THREE.Group();
  g.add(box(0.6, 0.3, 0.4, mat('#c0392b'), 0, 0.15, 0));
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 4, 8), mat('#9aa0a6', { metalness: 0.8 }));
    r.position.set(-0.15 + i * 0.15, 0.34, 0);
    g.add(r);
  }
  g.add(box(0.5, 0.06, 0.1, mat('#e0a020'), 0, 0.33, 0.12));
  return g;
}

function dieselCan() {
  const g = new THREE.Group();
  g.add(box(0.35, 0.45, 0.18, mat('#c0392b', { roughness: 0.5 }), 0, 0.23, 0));
  g.add(box(0.2, 0.06, 0.04, mat('#222'), 0, 0.49, 0));
  g.add(cyl(0.035, 0.035, 0.1, mat('#ffd400'), 6, 0.12, 0.5, 0));
  return g;
}

function crate(color) {
  const g = new THREE.Group();
  g.add(box(1.1, 0.7, 0.8, mat('#b48a55'), 0, 0.35, 0));
  g.add(box(1.12, 0.08, 0.82, mat(color), 0, 0.5, 0));
  g.add(box(1.12, 0.08, 0.82, mat(color), 0, 0.2, 0));
  return g;
}

function duffel(color, scale = 1) {
  const g = new THREE.Group();
  const body = cyl(0.28, 0.28, 1.0, mat(color), 10, 0, 0.28, 0);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  for (const x of [-0.25, 0.25]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.03, 4, 12), mat('#222'));
    strap.rotation.y = Math.PI / 2;
    strap.position.set(x, 0.28, 0);
    g.add(strap);
  }
  g.scale.setScalar(scale);
  return g;
}

function strutBundle(color) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const s = cyl(0.035, 0.035, 1.5, mat(color, { metalness: 0.7, roughness: 0.3 }), 5, 0, 0, 0);
    s.rotation.z = Math.PI / 2;
    s.position.set((i % 2) * 0.1, 0.1 + Math.floor(i / 3) * 0.07, (i % 3) * 0.07 - 0.07);
    g.add(s);
  }
  for (const x of [-0.4, 0.4]) {
    const tape = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 4, 10), mat('#333'));
    tape.rotation.y = Math.PI / 2;
    tape.position.set(x, 0.14, 0);
    g.add(tape);
  }
  return g;
}

function pegBucket() {
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.16, 0.36, mat('#e0a020'), 10, 0, 0.18, 0));
  for (let i = 0; i < 9; i++) {
    const p = box(0.02, 0.35, 0.02, mat('#9aa0a6', { metalness: 0.8 }), Math.cos(i) * 0.1, 0.4, Math.sin(i) * 0.1);
    p.rotation.z = (Math.random() - 0.5) * 0.4;
    g.add(p);
  }
  return g;
}

function dixiPallet() {
  const g = new THREE.Group();
  g.add(box(1.5, 0.14, 1.0, mat('#b48a55'), 0, 0.07, 0));
  for (let i = 0; i < 3; i++) {
    g.add(box(0.42, 0.75, 0.42, mat(i === 0 ? '#2e8b57' : '#2f6fb3'), -0.5 + i * 0.5, 0.52, 0));
    g.add(box(0.46, 0.05, 0.46, mat('#e8e8e8'), -0.5 + i * 0.5, 0.92, 0));
  }
  return g;
}

function vegCrate(color) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.28, 0.4, mat('#b48a55'), 0, 0.14, 0));
  for (let i = 0; i < 6; i++) g.add(box(0.12, 0.1, 0.12, mat(color), -0.18 + (i % 3) * 0.18, 0.32, -0.08 + Math.floor(i / 3) * 0.16));
  return g;
}

function lightKit() {
  const g = new THREE.Group();
  g.add(cyl(0.25, 0.25, 0.3, mat('#222'), 12, 0, 0.15, 0));
  g.add(box(0.3, 0.2, 0.2, mat('#ffd400'), 0.1, 0.4, 0));
  return g;
}

function timberStack() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) g.add(box(1.4, 0.12, 0.14, mat(i % 2 ? '#a0703a' : '#b98a55'), 0, 0.08 + Math.floor(i / 3) * 0.13, (i % 3) * 0.16 - 0.16));
  return g;
}

export const isHeavy = (id) => !!ITEMS[id]?.heavy;

export function createItemMesh(id) {
  const def = ITEMS[id];
  const m = def?.mesh ? def.mesh() : box(0.5, 0.5, 0.5, mat('#ff00ff'));
  m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return m;
}
