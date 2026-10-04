// Gameplay promo v3 (German): scripted "autopilot" play with the real camera rig + HUD, frame by frame.
//   node capture3.mjs full|preview land|port [SHOT,SHOT]
//   full -> shots3_<orient>/<NAME>/f0000.jpg …   preview -> 3 stills per shot into preview3_<orient>/
import { launch, openGame } from './lib2.mjs';
process.env.PROMO_LANG = 'de';
import fs from 'fs';

const preview = process.argv[2] === 'preview';
const orient = process.argv[3] === 'port' ? 'port' : 'land';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const [W, H] = (orient === 'port' ? [1080, 1920] : [1920, 1080]).map((v) => (preview ? v / 2 : v));

// page-side helpers, installed after each load
const HELPERS = `
  const g = game;
  const st = document.createElement('style');
  const B = Math.min(innerWidth, innerHeight);
  st.textContent = \`#hint,#btn-fs-hud,#touch,#dialog-hint{display:none!important}
    #promo{position:fixed;inset:0;pointer-events:none;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}
    #promo img.logo{width:\${B * 0.27}px;border-radius:50%;box-shadow:0 8px 40px rgba(0,0,0,.7)}
    #promo h1{font-family:'Poiret One',sans-serif;font-size:\${B * 0.115}px;line-height:.95;margin:.25em 0 0;color:#f2c14e;letter-spacing:.06em;text-shadow:0 4px 18px rgba(0,0,0,.7)}
    #promo h1 span{display:block;font-size:.5em;letter-spacing:.4em;color:#fff;margin-top:.15em}
    #promo .tag{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:\${B * 0.038}px;text-shadow:0 3px 12px rgba(0,0,0,.85);margin:.6em 4% 0}
    #promo .cap{position:absolute;top:\${innerHeight > innerWidth ? 20 : 13}%;left:4%;right:4%;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:\${B * 0.062}px;line-height:1.15;letter-spacing:.02em;text-shadow:0 3px 14px rgba(0,0,0,.9)}
    #promo .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,.15) 40%,rgba(0,0,0,.6) 100%)}
    .cjbig{display:flex;flex-direction:column;align-items:center;gap:\${B * 0.03}px;margin-top:\${B * 0.05}px}
    .cjbig img.h{height:\${B * 0.2}px;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7))}
    .cjbig img.t{height:\${B * 0.11}px;filter:invert(1) drop-shadow(0 3px 10px rgba(0,0,0,.7))}
    .cjbig.xl img.h{height:\${B * 0.32}px} .cjbig.xl img.t{height:\${B * 0.2}px}
    #cjmark{position:fixed;right:\${B * 0.03}px;bottom:\${B * 0.03}px;z-index:998;pointer-events:none;display:flex;align-items:center;gap:\${B * 0.012}px;opacity:.85}
    #cjmark img.h{height:\${B * 0.085}px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))}
    #cjmark img.t{height:\${B * 0.065}px;filter:invert(1) drop-shadow(0 2px 6px rgba(0,0,0,.6))}\`;
  document.head.appendChild(st);
  const p = document.createElement('div'); p.id = 'promo'; document.body.appendChild(p);
  window.promo = (html, op = 1) => { if (p._h !== html) { p.innerHTML = html; p._h = html; } p.style.opacity = op; };
  window.cap = (txt, f, n, a = 4, b = 4) => promo(txt ? '<div class="cap">' + txt + '</div>' : '', Math.min(1, f / a, (n - 1 - f) / b));
  const m = document.createElement('div'); m.id = 'cjmark'; m.innerHTML = '<img class="t" src="assets/ui/calmyjane_text.svg">'; document.body.appendChild(m);
  window.cjmark = (op) => { m.style.opacity = op; };
  // portrait: dialogs span the full width – lift the mark above the dialog box
  window.cjfollow = () => { const d = document.getElementById('dialog'); const r = d.getBoundingClientRect(); m.style.bottom = (innerHeight > innerWidth && g.ui.dialogOpen && r.height) ? (innerHeight - r.top + B * 0.02) + 'px' : (B * 0.03) + 'px'; };
  window.CJBIG = '<div class="cjbig"><img class="t" src="assets/ui/calmyjane_text.svg"></div>';
  window.hud = (on) => { document.getElementById('hud').style.visibility = on ? '' : 'hidden'; };
  const K = g.input.keys;
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  window.keys = (...ks) => { for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space']) K.delete(k); for (const k of ks) K.add(k); };
  // walk / sprint towards a point: the camera yaw steers, W walks away from the camera
  window.walkTo = (x, z, run) => {
    const pp = g.player.position, dx = x - pp.x, dz = z - pp.z;
    if (Math.hypot(dx, dz) < 0.8) { keys(); return true; }
    const want = Math.atan2(dx, dz) + Math.PI;
    g.cam.yaw += wrap(want - g.cam.yaw) * 0.25;
    run ? keys('KeyW', 'ShiftLeft') : keys('KeyW');
    return false;
  };
  window.driveTo = (x, z, boost) => {
    const v = g.player.vehicle, dx = x - v.position.x, dz = z - v.position.z;
    if (Math.hypot(dx, dz) < 2) { keys(); return true; }
    const err = wrap(Math.atan2(dx, dz) - v.heading);
    const ks = ['KeyW']; if (err > 0.06) ks.push('KeyA'); else if (err < -0.06) ks.push('KeyD'); if (boost) ks.push('ShiftLeft');
    keys(...ks);
    return false;
  };
  window.press = (code) => { window.dispatchEvent(new KeyboardEvent('keydown', { code })); window.dispatchEvent(new KeyboardEvent('keyup', { code })); K.delete(code); };
  window.closeDlg = async () => { for (let i = 0; i < 40 && g.ui.dialogOpen; i++) { press('KeyE'); await new Promise((r) => setTimeout(r, 40)); if (document.getElementById('dialog-choices').children.length) { press('Digit1'); await new Promise((r) => setTimeout(r, 60)); } } };
  window.place = (x, z, heading) => { if (g.player.vehicle) g.exitVehicle(); g.player.root.position.set(x, 0, z); g.player.root.rotation.y = heading; g.cam.yaw = heading + Math.PI; g.cam.target.set(x, 1.6, z); };
  window.ride = (v, x, z, heading) => { if (g.player.vehicle) g.exitVehicle(); v.place({ x, z }, heading); v.repair?.(); if ('fuel' in v) v.fuel = 1; g.enterVehicle(v); g.cam.yaw = heading + Math.PI; g.cam.target.set(x, 2.2, z); };
  window.reset = async () => {
    keys(); g.sceneCam = null; await closeDlg(); g.building = null; g.ui.progress(null);
    if (g.player.vehicle) g.exitVehicle();
    g.effects.weedT = 0; g.cam.shake = 0; g.cam.pitch = 0.32; g.cam.targetDist = g.cam.dist = 7.5;
    g.drama.clearAll(); g.drama.nextT = 1e9; g.player.root.visible = true; hud(true); promo('', 0); cjmark(0.85); for (const nn of (window._hid || [])) { nn.hidden = false; nn.root.visible = true; } window._hid = [];
    document.querySelectorAll('.toast').forEach((e) => e.remove()); document.getElementById('banner')?.classList.add('hidden');
    const vs = g.world.vehicleSpots; g.vehicles.quad.place(vs.quad.pos, vs.quad.heading); g.vehicles.radlader.place(vs.radlader.pos, vs.radlader.heading);
  };
  window.I18N = await import('/src/i18n.js');
`;

// ------------------------------------------------------------------ shots
// [name, save (null = fresh game), frames, preroll, setup (async page code), per-frame (f, n, k)]
const SHOTS = [
  // ---- morning over the camping
  ['OPEN', 'saves4/24.json', 96, 30,
    `hud(false); g.player.root.visible = false; cjmark(0); g.world.setNight(0.35, .1); g.npcs.setCrowd(60); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `shot([40 - k * 22, 34 - k * 20, -95 + k * 30], [8, 0, -48]);
     if (f < 42) { cjmark(0); promo('<div class="vig"></div>' + CJBIG.replace('cjbig', 'cjbig xl'), Math.min(1, (f + 1) / 6, (41 - f) / 6)); }
     else { cjmark(Math.min(0.85, (f - 42) / 8)); promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:16%">Montag, 7 Uhr. Aufbau.</div>', Math.min(1, (f - 42) / 8, (n - 1 - f) / 6)); }
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  // ---- Dixi pallet on the wheel loader, side camera
  ['DIXI', 'saves4/24.json', 72, 3,
    `const L = g.vehicles.radlader; ride(L, 30, -36, -Math.PI / 2 - 0.05); g.quests.state.inventory.push('dixi_pallet_1'); g.updateCarried(); L.speed = 5;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(0, 3);
     ps.forEach((nn, i) => { nn.task = null; nn.target = null; nn.wait = 99; nn.root.position.set(14 - i * 3, 0, -40 - i); nn.say(['Endlich Klos!', 'Ich halt\\'s nicht mehr aus!', 'Nummer eins ist meins!'][i], 2.5); });`,
    `driveTo(-10, -38, true); const L = g.vehicles.radlader, h = L.heading, p = L.position;
     const fx = Math.sin(h), fz = Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
     shot([p.x + fx * (7 - k * 3) - rx * 6, 3.4, p.z + fz * (7 - k * 3) - rz * 6], [p.x + fx * 2, 1.3, p.z + fz * 2]);
     cap('Klos zuerst. Prioritäten.', f, n);`],
  // ---- rigging a mainstage post while Corni asks for the rigging material
  ['RIGGING', 'saves4/24.json', 75, 3,
    `const sp = g.world.spots.post_2; place(sp.x, sp.z, Math.atan2(-99 - sp.x, 31.5 - sp.z)); g.cam.yaw = g.player.root.rotation.y + Math.PI + 0.7; g.cam.pitch = 0.3; g.cam.targetDist = 6.5;
     g.building = { t: 0, dur: 2.2, lastHit: 0, labels: ['Stahlseil spannen…', 'Schäkel zu…', 'Nachspannen…'], done: () => { g.ui.toast('✔ Pfosten 2 geriggt'); g.cam.shake = 0.2; } }; g.player.work(2.2);
     const c = g.npcs.get('corni'); c.task = null; c.target = null; c.root.position.set(sp.x + 2.2, 0, sp.z + 1.6);`,
    `const c = g.npcs.get('corni'); c.char.faceTowards(g.player.position, 1 / 30, 4); const T1 = 'Sag mal… hast du eigentlich das Rigging-Material?'; if (f >= 12 && f < 50 && c.bubble?.text !== T1) c.say(T1, 3.2);
     const T2 = '…Ach, das ist es? Ach so.'; if (f >= 56 && c.bubble?.text !== T2) c.say(T2, 2);`],
  // ---- Leo grabs a coffee in the kitchen and bolts
  ['LEOKITCHEN', 'saves4/24.json', 63, 3,
    `const k0 = g.world.spots.kitchen; const leo = g.npcs.get('leo'); leo.root.position.set(k0.x + 2, 0, k0.z + 3); leo.root.visible = true; leo.hidden = false; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0;
     place(k0.x + 16, k0.z + 9, Math.atan2(-14, -6)); g.cam.pitch = 0.25; g.cam.targetDist = 7;
     const s = g.npcs.get('sabse'); s.task = null;`,
    `const leo = g.npcs.get('leo'); if (f === 2) { leo.say('Nur ein Kaffee! Bin gleich zurück!', 2.5); }
     if (f < 6) leo.stateT = 99; if (f === 6) { leo.state = 'lurk'; } walkTo(leo.position.x, leo.position.z, f > 6);
     if (leo.state === 'flee') leo.stateT = 99;
     if (f === 20) g.npcs.get('sabse').say('LEO! Das war MEIN Kaffee!', 2.6);`],
  // ---- Quad Express: full speed across the festival, people diving away
  ['QUADEXP', 'saves4/24.json', 66, 3,
    `ride(g.vehicles.quad, -20, 66, -Math.PI / 2 - 0.15); g.vehicles.quad.speed = 12; g.cam.pitch = 0.22;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(4, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.target = null; nn.wait = 99; nn.root.position.set(-38 - i * 2.4, 0, 63.5 + (i % 2 ? 1.2 : -1.2)); });
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `driveTo(-75, 60, true); cap('Express-Lieferung.', f, n);`],
  // ---- illegal soundbox party on the camping
  ['SOUNDBOX', 'saves4/24.json', 81, 3,
    `g.npcs.setCrowd(60); g.world.setNight(0.3, .1); g.soundbox.spawn(); const b = g.soundbox.box;
     if (b) { const extra = g.npcs.campers.filter((x) => !x.hidden && !x.knocked && !x.party).slice(14, 24);
       extra.forEach((nn, i) => { const a = (i / extra.length) * Math.PI * 2; const pos = V3(b.pos.x + Math.cos(a) * 3.2, 0, b.pos.z + Math.sin(a) * 3.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: b.pos, lineT: 0.3 + Math.random() * 3 }; b.npcs.push(nn); });
       place(b.pos.x + 9, b.pos.z + 6, Math.atan2(-9, -6)); }
     g.cam.pitch = 0.28; g.cam.targetDist = 7;`,
    `const b = g.soundbox.box; if (b) walkTo(b.pos.x + 4.5, b.pos.z + 3, false); cap('Soundbox auf dem Camping? Verboten. Eigentlich.', f, n);`],
  // ---- drunk Strom Andi, Franzi walks him to the awareness tent
  ['DRUNK', 'saves4/24.json', 84, 3,
    `g.world.setNight(0, .1); g.soundbox.stop?.(); const a = g.npcs.get('strom_andi'); const fz = g.npcs.get('franzi');
     window._de = g.drama.spawn('drunk', 'strom_andi');
     a.root.position.set(-60, 0, 30); fz.task = null; fz.root.position.set(-58.5, 0, 31);
     place(-55, 36, Math.atan2(-5, -6)); g.cam.pitch = 0.3; g.cam.targetDist = 6.5; step(2);
     if (_de && g.drama.tent) g.drama.startEscort(_de, fz);`,
    `const a = g.npcs.get('strom_andi'); g.player.char.faceTowards(a.position, 1 / 30, 3);
     if (f === 4) a.say('Ich bin nicht betrunken. Ich bin… horizontal motiviert.', 3);
     if (f === 46) a.say('Franzi… du bist meine beste Freundin. Seit… wann kennen wir uns?', 3);`],
  // ---- Juli argues with a volunteer
  ['JULIFIGHT', 'saves4/24.json', 66, 3,
    `const j = g.npcs.get('juli'); const v = g.npcs.campers.find((x) => !x.hidden && !x.knocked && !x.party);
     for (const nn of [j, v]) { nn.task = null; nn.target = null; nn.wait = 99; nn.incident = null; }
     j.root.position.set(-84, 0, 58); v.root.position.set(-82.6, 0, 58.4); window._jv = v;
     place(-80.5, 61.5, Math.atan2(-3, -3)); g.cam.yaw = Math.atan2(-3, -3) + Math.PI + 0.6; g.cam.pitch = 0.28; g.cam.targetDist = 5.5;`,
    `const j = g.npcs.get('juli'), v = _jv; j.char.faceTowards(v.position, 1 / 30, 6); v.char.faceTowards(j.position, 1 / 30, 6); j.wait = v.wait = 99;
     const L = [[0, j, 'Das ist MEIN Akkuschrauber!'], [16, v, 'Steht doch nirgends drauf!'], [32, j, 'Doch! JULI! Mit Edding!'], [48, v, 'Da steht JULE.']];
     for (const [t0, who, s] of L) if (f >= t0 && f < t0 + 16 && who.bubble?.text !== s) who.say(s, 2);
     if (f % 8 === 0) j.char.play('wave', 0.2, { once: true });
     cap('Diskussionskultur.', f, n);`],
  // ---- Aylien hug
  ['HUG', 'saves4/24.json', 54, 3,
    `const ay = g.npcs.get('aylien'); ay.task = null; ay.target = null; ay._hugT = -999; ay.root.position.set(-70, 0, 60); place(-70, 61.7, Math.PI); g.cam.yaw = 0.5; g.cam.pitch = 0.3; g.cam.targetDist = 5; step(2); g.talkTo(ay);`,
    `cjfollow();`],
  // ---- high jump over the Bauzaun … and straight off the site
  ['JUMP', 'saves4/24.json', 57, 30,
    `place(-131, 17, Math.PI); g.effects.weedT = 40; g.cam.pitch = 0.22; g.cam.targetDist = 7;`,
    `walkTo(-131, -6, true); if (f === 8 || f === 30) { press('Space'); g.input.pressed.add('Space'); } cap('Bauzaun? Kein Problem.', f, n);`],
  // ---- the police picks you up
  ['POLICE', 'saves4/24.json', 105, 3,
    `g.effects.weedT = 0; place(222, -30, Math.PI / 2); g.cam.yaw = Math.PI / 2 + Math.PI - 0.5; g.cam.pitch = 0.3; g.cam.targetDist = 9; g.police.warned = true; g.police.arrest();`,
    `cjfollow(); cap('…oder doch.', f, n, 4, 4);`],
  // ---- Firespace by day: the fire crew practises with flow toys
  ['FIRE', 'saves4/24.json', 60, 30,
    `for (let i = 0; i < 120 && g.police.busy; i++) { await closeDlg(); await new Promise((r) => setTimeout(r, 100)); step(1); } await closeDlg();
     const fs0 = g.world.spots.fire_stage; place(fs0.x + 9, fs0.z - 6, 0); g.player.root.visible = false; const ge = g.npcs.get('georg'); if (ge) { ge.task = null; ge.root.position.set(fs0.x + 3.5, 0, fs0.z - 2.5); }`,
    `const fs0 = g.world.spots.fire_stage; const a = -0.9 + k * 0.7; shot([fs0.x + Math.cos(a) * 9, 2.8, fs0.z + Math.sin(a) * 9], [fs0.x, 1.3, fs0.z]);
     if (f === 6) g.npcs.get('georg')?.say('Schön. Nur die Poi-Technik… naja. Schön.', 3);
     cap('Feuerinsel: üben, üben, üben.', f, n);`],
  // ---- the chai lounge: permanent construction site
  ['CHAI', 'saves4/24.json', 51, 3,
    `const s = g.npcs.get('silke'); const cl = g.world.spots.plot_chai_lounge; place(cl.x + 9, cl.z + 7, Math.atan2(-9, -7)); g.cam.pitch = 0.32; g.cam.targetDist = 8;
     if (s) { s.task = null; s.say('Morgen steht das Zelt. Ganz sicher. Fast.', 3); }`,
    `walkTo(g.world.spots.plot_chai_lounge.x + 4, g.world.spots.plot_chai_lounge.z + 3.5, false); cap('Die Chai Lounge. Seit 2019 im Bau.', f, n);`],
  // ---- night party under the Narnia stretch tent … and the quad
  ['NARNIA', 'saves4/24.json', 75, 90,
    `g.world.setNight(0.85, .1); g.npcs.setCrowd(60); const d = V3(-99, 0, 50);
     const lines = ['Drache! DRACHE!', 'Noch ein Track!', 'Ich lieb euch alle!', 'Wer hat den Bass so laut gedreht?!'];
     g.npcs.partyLine = () => lines[Math.floor(Math.random() * lines.length)];
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(24, 42);
     ps.forEach((nn, i) => { const row = Math.floor(i / 6), col = i % 6; const pos = V3(d.x - 6 + col * 2.4, 0, d.z - 4 + row * 2.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: d, lineT: 0.5 + Math.random() * 4 }; });
     ride(g.vehicles.quad, -72, 51, -Math.PI / 2); g.vehicles.quad.speed = 4; g.cam.pitch = 0.25; g.cam.targetDist = 8;`,
    `if (f > 14) driveTo(-125, 51, true); else keys(); cap('Nachts wird getanzt.', f, n);`],
  // ---- Leo at night behind the dixis
  ['LEONIGHT', 'saves4/24.json', 48, 60,
    `g.world.setNight(0.8, .1); const dx = { x: -76, z: 46 }; const leo = g.npcs.get('leo'); leo.root.position.set(dx.x, 0, dx.z); leo.root.visible = true; leo.hidden = false; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0;
     place(dx.x + 1, dx.z + 30, Math.PI); g.cam.pitch = 0.2; g.cam.targetDist = 6.5;`,
    `const leo = g.npcs.get('leo'); if (leo.state === 'flee') leo.stateT = 99; walkTo(leo.position.x, leo.position.z, true);`],
  // ---- the punchline: Jan picked you up from the police station
  ['FINAL', 'saves4/24.json', 70, 3,
    `g.world.setNight(0, .1); g.vehicles.radlader.place({ x: 130, z: -34 }, 0); const sp = g.world.spots.base_yard; place(sp.x - 1, sp.z + 5, Math.PI * 0.85); const jan = g.npcs.get('jan'); jan.task = null; jan.root.position.set(sp.x - 1.6, 0, sp.z + 3.4);
     g.cam.yaw = 0.5; g.cam.pitch = 0.32; g.cam.targetDist = 5.5; step(2);
     g.runDialog([{ who: 'jan', text: 'Bitte bleib auf dem Gelände. Leo wär das nicht passiert. Leo hätten sie gar nicht erst gefunden.' }], null, jan);`,
    `g.npcs.get('jan').bubble = null; cjfollow();`],
  ['END', 'saves4/24.json', 108, 60,
    `hud(false); g.player.root.visible = false; g.world.setNight(0.6, .1); cjmark(0); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const a = 2.3 + k * 0.2; shot([-90 + Math.cos(a) * (70 + k * 30), 34 + k * 20, 55 + Math.sin(a) * (70 + k * 30)], [-92, 2, 55]);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Für alle, die nicht bis nächstes Jahr warten wollen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
];

const outRoot = (preview ? 'preview5_' : 'shots5_') + orient;
fs.mkdirSync(outRoot, { recursive: true });
const browser = await launch();
let cur = { save: undefined };
for (const [name, save, n, pre, setup, per] of SHOTS) {
  if (only && !only.includes(name)) continue;
  if (cur.save !== save) {
    if (cur.ctx) await cur.ctx.close();
    const o = await openGame(browser, save, { width: W, height: H });
    cur = { save, ...o };
    await cur.page.evaluate(`(async () => { ${HELPERS} })()`);
    // fresh game: let the welcome banner pass without showing it
    if (!save) await cur.page.evaluate(() => { game.ui.banner = () => {}; document.querySelectorAll('.banner,#banner').forEach((e) => e.classList.add('hidden')); });
  }
  const page = cur.page;
  await page.evaluate(`(async () => { const g = game; await reset(); ${setup}\n step(${pre}); })()`);
  await page.evaluate(`window.__shot = (f, n) => { const g = game; const k = n > 1 ? f / (n - 1) : 0; ${per}\n step(1); }`);
  const dir = preview ? outRoot : `${outRoot}/${name}`;
  if (!preview) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
  const want = preview ? new Set(process.env.PF ? process.env.PF.split(',').map(Number) : [0, Math.floor(n / 2), n - 1]) : null;
  for (let f = 0; f < n; f++) {
    await page.evaluate(([f, n]) => window.__shot(f, n), [f, n]);
    if (!want || want.has(f)) await page.screenshot({ path: preview ? `${dir}/${name}_${f}.jpg` : `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: preview ? 70 : 93 });
  }
  console.log('shot', name, n);
}
await browser.close();
