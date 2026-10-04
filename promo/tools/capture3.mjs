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
  ['TITLE', null, 120, 4,
    `hud(false); g.player.root.visible = false; cjmark(0);`,
    `const a = 0.9 + k * 0.25; shot([100 + Math.cos(a) * (150 - k * 60), 95 - k * 55, -20 + Math.sin(a) * (150 - k * 60)], [60 - k * 40, 0, -10 - k * 10]);
     if (f < 58) { cjmark(0); promo('<div class="vig"></div>' + CJBIG.replace('cjbig', 'cjbig xl'), Math.min(1, (f + 1) / 8, (57 - f) / 8)); }
     else { cjmark(Math.min(0.85, (f - 58) / 10)); promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:16%">Noch eine Woche bis zum Festival.</div>', Math.min(1, (f - 58) / 10, (n - 1 - f) / 8)); }`],
  ['JAN', null, 150, 3,
    `place(107.6, -15.3, -Math.PI / 2 - 0.15); g.cam.pitch = 0.75; step(10); g.talkTo(g.npcs.get('jan'));
     const sl = (ms) => new Promise((r) => setTimeout(r, ms));
     await sl(150); press('KeyE'); await sl(80); press('KeyE'); await sl(60); if (document.getElementById('dialog-text').textContent.startsWith('Ah')) { press('KeyE'); await sl(60); }
     await sl(2500);`,
    `cjfollow();`],
  ['BAND', null, 60, 3,
    `g.vehicles.radlader.place({ x: 130, z: -34 }, 0); place(115.5, -19, 0.35); g.cam.pitch = 0.28;
     const ids = ['andi', 'felix', 'thomas', 'flo', 'mehdi', 'isi', 'camper_1', 'camper_2'];
     ids.forEach((id, i) => { const nn = g.npcs.get(id); if (!nn) return; nn.task = null; nn.root.position.set(116.3 + i * 0.32 + (i % 2 ? 2.4 : -2.4), 0, -16.5 + i * 1.7); nn.target = null; nn.wait = 99; });
     window._band = ids;`,
    `walkTo(119, -1, false);
     if (f % 12 === 1) { const pp = g.player.position; const nn = _band.map((id) => g.npcs.get(id)).filter((x) => x && !x.bubble).sort((a, b) => a.position.distanceTo(pp) - b.position.distanceTo(pp))[0]; if (nn) nn.say(g.bandLine(), 2.5); }
     cap('Ohne Bändchen bist du hier niemand.', f, n);`],
  ['LEO', 'saves/1.json', 75, 3,
    `place(62, -37, -Math.PI / 2); const leo = g.npcs.get('leo'); leo.root.position.set(47, 0, -37.5); leo.root.visible = true; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0; g.cam.pitch = 0.18; g.cam.targetDist = g.cam.dist = 6;`,
    `const leo = g.npcs.get('leo'); walkTo(leo.position.x, leo.position.z, true); if (leo.state === 'flee') leo.stateT = 99;
     cap('Leo hat deine Aufgaben. Theoretisch.', f, n);`],
  ['LOADER', 'saves/15.json', 60, 3,
    `const L = g.vehicles.radlader; ride(L, 84, -44.5, -1.32); g.quests.state.inventory.push('straw_bales', 'wood_panels'); g.updateCarried(); L.speed = 4;`,
    `driveTo(18, -27.3, true); cap('Schweres Zeug? Radlader.', f, n);`],
  ['BUILD', 'saves/15.json', 90, 3,
    `place(-143, 37, -Math.PI / 2 - 0.1); g.cam.pitch = 0.42; g.cam.targetDist = 13;
     const labels = I18N.t('b.labels');
     g.building = { t: 0, dur: 1.9, lastHit: 0, labels, done: () => {
       g.world.placeStructure('forest_dome', 'forest_dome', 'forest_dome', { animate: true, rotation: 1.7, growTime: 1.4 });
       g.ui.banner(I18N.t('b.built'), 'Forest Dome', I18N.t('b.shape'), 2500); g.cam.shake = 0.3; } };
     g.player.work(1.9);`,
    `g.cam.yaw += (Math.PI / 2 + 0.55 - g.cam.yaw) * 0.1; cap('Anleitung? Wird überbewertet.', f, n);`],
  ['QUAD', 'saves/15.json', 72, 3,
    `ride(g.vehicles.quad, 72, -38.5, -Math.PI / 2); g.vehicles.quad.speed = 9;
     const ps = g.npcs.campers.filter((x) => !x.hidden).slice(0, 7);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.root.position.set(52 - i * 1.3, 0, -38.5 + (i % 2 ? 1 : -1) * (0.6 + i * 0.25)); nn.target = null; nn.wait = 99; nn.say(['Geiles Quad!', 'Hey, langsam!', 'Fährt da Leo?', 'Huiii?'][i % 4], 2); });`,
    `driveTo(20, -38.5, true); cap('Fahr vorsichtig. Oder halt nicht.', f, n);`],
  ['KITCHEN', 'saves/15.json', 60, 3,
    `ride(g.vehicles.quad, -52, 12.5, -Math.PI / 2 - 0.05); g.vehicles.quad.speed = 8; g.kitchenLast = g.time; g.kitchenStrikes = 3; g.kitchenCD = 0;`,
    `driveTo(-75, 11.4, true); g.kitchenLast = g.time; cap('Nie. Durch. Sabses. Küche.', f, n);`],
  ['CORNI', 'saves/15.json', 78, 3,
    `const c = g.npcs.get('corni'); c.task = null; const cp = c.position.clone(); place(cp.x + 1.6, cp.z + 1.4, Math.atan2(-1.6, -1.4)); g.cam.yaw = Math.atan2(-1.6, -1.4) + Math.PI + 0.5; g.cam.pitch = 0.3;
     const fl = g.quests.state.flags; fl.chats ||= []; if (!fl.chats.includes('corni#0')) fl.chats.push('corni#0'); step(4); g.chatWith(c);`,
    `if (f === 46) press('Digit1'); cjfollow();`],
  ['PUMP', 'saves/15.json', 72, 3,
    `const sp = g.world.spots.wc_pump; const j = g.npcs.get('juli'); j.task = null; j.target = null; j.wait = 99; j.workAnim = true; j.root.position.set(sp.x + 0.6, 0, sp.z + 0.4);
     place(sp.x + 4.2, sp.z + 3.6, Math.atan2(-4.2, -3.6)); g.cam.yaw = Math.atan2(-4.2, -3.6) + Math.PI - 0.45; g.cam.pitch = 0.32; g.cam.targetDist = 8.5;
     // nobody walks through the shot
     window._hid = g.npcs.all.filter((nn) => nn !== j && !nn.hidden && nn.position.distanceTo(sp) < 45);
     for (const nn of _hid) { nn.hidden = true; nn.root.visible = false; }
     window._pe = g.drama.spawn('pump');`,
    `const j = g.npcs.get('juli'); j.wait = 99; j.workAnim = true; j.char.faceTowards(g.world.spots.wc_pump, 1 / 30, 4);
     if (f === 6) j.say(I18N.L(_pe.def.helperDialog), 2.6);
     if (f === 46 && _pe) g.drama.resolve(_pe, j);
     cap('Kackepumpe kaputt? Juli regelt das.', f, n);`],
  ['WEED', 'saves/15.json', 48, 30,
    `place(-99, 58, Math.PI); g.effects.weedT = 40; g.cam.pitch = 0.2;`,
    `walkTo(-99, 36, false); if (f === 10 || f === 34) { press('Space'); g.input.pressed.add('Space'); } cap('Pause muss auch mal sein.', f, n);`],
  ['NIGHT', 'saves/22.json', 45, 90,
    `g.world.setNight(0.8, .1); ride(g.vehicles.quad, -78, 64, Math.atan2(-21, -17)); g.vehicles.quad.speed = 12; g.cam.pitch = 0.3; g.cam.targetDist = 9;`,
    `driveTo(-99, 49, f < 30); cap('Nachtschicht.', f, n);`],
  ['BEER', 'saves/15.json', 39, 3,
    `const th = g.npcs.get('thompsen'); place(th.position.x + 0.6, th.position.z + 2.1, Math.PI); g.cam.yaw = 0.6; g.cam.pitch = 0.35; step(3); g.thompsenTalk(th);`,
    `cjfollow();`],
  ['LOADER2', 'saves/15.json', 39, 3,
    `const L = g.vehicles.radlader; ride(L, 38, -36, -Math.PI / 2); L.speed = 6;
     const ps = g.npcs.campers.filter((x) => !x.hidden).slice(8, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.root.position.set(33 - i * 0.9, 0, -36 + (i % 2 ? 0.7 : -0.7)); nn.target = null; nn.wait = 99; });`,
    `driveTo(10, -36, true);`],
  ['CORNI2', 'saves/15.json', 36, 3,
    `const c = g.npcs.get('corni'); c.task = null; const cp = c.position.clone(); place(cp.x + 1.2, cp.z + 2.2, Math.atan2(-1.2, -2.2)); g.cam.yaw = Math.atan2(-1.2, -2.2) + Math.PI - 0.4; g.cam.pitch = 0.22; g.cam.targetDist = g.cam.dist = 4.5; step(2);
     c.say('Stahlseile. Hat IRGENDWER die Stahlseile gesehen?!', 3);`,
    `cjfollow();`],
  ['CAUGHT', 'saves/1.json', 79, 3,
    `const leo = g.npcs.get('leo'); leo.state = 'lurk'; leo.stateT = 99; leo.root.position.set(-92, 0, 54); place(-92, 55.6, Math.PI); g.cam.yaw = 0.35; g.cam.pitch = 0.3; step(2); g.catchLeo(leo);`,
    `cjfollow();`],
  ['END', 'saves/22.json', 108, 6,
    `hud(false); g.player.root.visible = false; g.world.setNight(0.25, .1); cjmark(0);`,
    `const a = 1.75 + k * 0.18; shot([-99 + Math.cos(a) * (60 + k * 40), 30 + k * 30, 40 + Math.sin(a) * (60 + k * 40)], [-95, 2, 45]);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Für alle, die nicht bis nächstes Jahr warten wollen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
];

const outRoot = (preview ? 'preview3_' : 'shots3_') + orient;
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
