// Gameplay promo: scripted "autopilot" play with the real camera rig + HUD, frame by frame.
//   node capture2.mjs              -> all shots into shots/<NAME>/f0000.jpg …
//   node capture2.mjs preview      -> 3 stills per shot into preview2/
//   node capture2.mjs preview LEO  -> only that shot (comma list ok)
import { launch, openGame } from './lib2.mjs';
process.env.PROMO_LANG = 'de';
import fs from 'fs';

const preview = process.argv[2] === 'preview';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const W = preview ? 960 : 1920, H = preview ? 540 : 1080;

// page-side helpers, installed after each load
const HELPERS = `
  const g = game;
  const st = document.createElement('style');
  st.textContent = \`#hint,#btn-fs-hud,#touch,#dialog-hint{display:none!important}
    #promo{position:fixed;inset:0;pointer-events:none;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}
    #promo img.logo{width:\${innerWidth * 0.15}px;border-radius:50%;box-shadow:0 8px 40px rgba(0,0,0,.7)}
    #promo h1{font-family:'Poiret One',sans-serif;font-size:\${innerWidth * 0.065}px;line-height:.95;margin:.25em 0 0;color:#f2c14e;letter-spacing:.06em;text-shadow:0 4px 18px rgba(0,0,0,.7)}
    #promo h1 span{display:block;font-size:.5em;letter-spacing:.4em;color:#fff;margin-top:.15em}
    #promo .tag{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:\${innerWidth * 0.021}px;text-shadow:0 3px 12px rgba(0,0,0,.85);margin-top:.6em}
    #promo .cap{position:absolute;top:13%;left:0;right:0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:\${innerWidth * 0.034}px;letter-spacing:.03em;text-shadow:0 3px 14px rgba(0,0,0,.9)}
    #promo .cj{position:absolute;right:3%;bottom:4%;height:\${innerWidth * 0.03}px;filter:invert(1) drop-shadow(0 2px 6px rgba(0,0,0,.6));opacity:.9}
    #promo .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,.15) 40%,rgba(0,0,0,.6) 100%)}\`;
  document.head.appendChild(st);
  const p = document.createElement('div'); p.id = 'promo'; document.body.appendChild(p);
  window.promo = (html, op = 1) => { if (p._h !== html) { p.innerHTML = html; p._h = html; } p.style.opacity = op; };
  window.cap = (txt, f, n, a = 4, b = 4) => promo(txt ? '<div class="cap">' + txt + '</div>' : '', Math.min(1, f / a, (n - 1 - f) / b));
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
    g.drama.clearAll(); g.drama.nextT = 1e9; g.player.root.visible = true; hud(true); promo('', 0);
    document.querySelectorAll('.toast').forEach((e) => e.remove()); document.getElementById('banner')?.classList.add('hidden');
    const vs = g.world.vehicleSpots; g.vehicles.quad.place(vs.quad.pos, vs.quad.heading); g.vehicles.radlader.place(vs.radlader.pos, vs.radlader.heading);
  };
  window.I18N = await import('/src/i18n.js');
`;

// ------------------------------------------------------------------ shots
// [name, save (null = fresh game), frames, preroll, setup (async page code), per-frame (f, n, k)]
const SHOTS = [
  ['TITLE', null, 135, 4,
    `hud(false); g.player.root.visible = false;`,
    `const a = 0.9 + k * 0.25; shot([100 + Math.cos(a) * (150 - k * 60), 95 - k * 55, -20 + Math.sin(a) * (150 - k * 60)], [60 - k * 40, 0, -10 - k * 10]);
     const o = Math.min(1, f / 15, (n - 1 - f) / 10);
     promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:16%">Noch drei Wochen bis zum Festival.<br>Noch steht nichts.</div>', o);`],
  ['JAN', null, 120, 3,
    `place(107.6, -15.3, -Math.PI / 2 - 0.15); g.cam.pitch = 0.75; step(10); g.talkTo(g.npcs.get('jan'));`,
    `if (f === 66) press('KeyE'); if (f === 68) press('KeyE');`],
  ['BAND', null, 90, 3,
    `g.vehicles.radlader.place({ x: 130, z: -34 }, 0); place(115.5, -19, 0.35); g.cam.pitch = 0.28;
     const ids = ['andi', 'felix', 'thomas', 'flo', 'mehdi', 'isi', 'camper_1', 'camper_2'];
     ids.forEach((id, i) => { const nn = g.npcs.get(id); if (!nn) return; nn.task = null; nn.root.position.set(116.3 + i * 0.32 + (i % 2 ? 2.4 : -2.4), 0, -16.5 + i * 1.7); nn.target = null; nn.wait = 99; });
     window._band = ids;`,
    `walkTo(119, -1, false);
     if (f % 14 === 2) { const pp = g.player.position; const nn = _band.map((id) => g.npcs.get(id)).filter((x) => x && !x.bubble).sort((a, b) => a.position.distanceTo(pp) - b.position.distanceTo(pp))[0]; if (nn) nn.say(g.bandLine(), 2.5); }
     cap('Hol dir dein Bändchen…', f, n);`],
  ['LEO', 'saves/1.json', 90, 3,
    `place(62, -37, -Math.PI / 2); const leo = g.npcs.get('leo'); leo.root.position.set(47, 0, -37.5); leo.root.visible = true; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0; g.cam.pitch = 0.18; g.cam.targetDist = g.cam.dist = 6;`,
    `const leo = g.npcs.get('leo'); walkTo(leo.position.x, leo.position.z, true); if (leo.state === 'flee') leo.stateT = 99;
     cap('…finde Leo. Viel Glück.', f, n);`],
  ['LOADER', 'saves/15.json', 90, 3,
    `const L = g.vehicles.radlader; ride(L, 84, -44.5, -1.32); g.quests.state.inventory.push('straw_bales', 'wood_panels'); g.updateCarried(); L.speed = 4;`,
    `driveTo(18, -27.3, true); cap('Schweres Zeug schleppen…', f, n);`],
  ['BUILD', 'saves/15.json', 100, 3,
    `place(-143, 37, -Math.PI / 2 - 0.1); g.cam.pitch = 0.42; g.cam.targetDist = 13;
     const labels = I18N.t('b.labels');
     g.building = { t: 0, dur: 1.9, lastHit: 0, labels, done: () => {
       g.world.placeStructure('forest_dome', 'forest_dome', 'forest_dome', { animate: true, rotation: 1.7, growTime: 1.4 });
       g.ui.banner(I18N.t('b.built'), 'Forest Dome', I18N.t('b.shape'), 2500); g.cam.shake = 0.3; } };
     g.player.work(1.9);`,
    `g.cam.yaw += (Math.PI / 2 + 0.55 - g.cam.yaw) * 0.1; cap('Bau ein ganzes Festival', f, n);`],
  ['QUAD', 'saves/15.json', 75, 3,
    `ride(g.vehicles.quad, 72, -38.5, -Math.PI / 2); g.vehicles.quad.speed = 9;
     const ps = g.npcs.campers.filter((x) => !x.hidden).slice(0, 7);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.root.position.set(52 - i * 1.3, 0, -38.5 + (i % 2 ? 1 : -1) * (0.6 + i * 0.25)); nn.target = null; nn.wait = 99; nn.say(['Geiles Quad!', 'Hey, langsam!', 'Fährt da Leo?', 'Huiii?'][i % 4], 2); });`,
    `driveTo(20, -38.5, true); cap('Fahr (vorsichtig?)', f, n);`],
  ['KITCHEN', 'saves/15.json', 64, 3,
    `ride(g.vehicles.quad, -52, 12.5, -Math.PI / 2 - 0.05); g.vehicles.quad.speed = 8; g.kitchenLast = g.time; g.kitchenStrikes = 3; g.kitchenCD = 0;`,
    `driveTo(-75, 11.4, true); g.kitchenLast = g.time;`],
  ['CHAT', 'saves/15.json', 66, 3,
    `g.vehicles.radlader.place({ x: 130, z: -34 }, 0); const fb = g.npcs.get('fabi'); fb.task = null; fb.root.position.set(113.7, 0, -23.7); place(113.7, -21.6, Math.PI); g.cam.yaw = 0.5; g.cam.pitch = 0.3; step(4);
     g.chatWith(fb);`,
    `if (f === 34) press('Digit2'); cap('Finde Freunde', f, n);`],
  ['WEED', 'saves/15.json', 66, 30,
    `place(-99, 62, Math.PI); g.effects.weedT = 40; g.cam.pitch = 0.2;`,
    `walkTo(-99, 36, false); if (f === 14 || f === 44) press('Space'); if (f === 14 || f === 44) g.input.pressed.add('Space'); cap('…und genieß die Vibes', f, n);`],
  ['NIGHT', 'saves/22.json', 60, 90,
    `g.world.setNight(0.8, .1); ride(g.vehicles.quad, -78, 64, Math.atan2(-21, -17)); g.vehicles.quad.speed = 10; g.cam.pitch = 0.3; g.cam.targetDist = 9;`,
    `driveTo(-99, 49, f < 40);`],
  ['BEER', 'saves/15.json', 45, 3,
    `const th = g.npcs.get('thompsen'); place(th.position.x + 0.6, th.position.z + 2.1, Math.PI); g.cam.yaw = 0.6; g.cam.pitch = 0.35; step(3); g.thompsenTalk(th);`,
    ``],
  ['LOADER2', 'saves/15.json', 48, 3,
    `const L = g.vehicles.radlader; ride(L, 40, -36, -Math.PI / 2); L.speed = 5;
     const ps = g.npcs.campers.filter((x) => !x.hidden).slice(8, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.root.position.set(33 - i * 0.9, 0, -36 + (i % 2 ? 0.7 : -0.7)); nn.target = null; nn.wait = 99; });`,
    `driveTo(10, -36, true);`],
  ['CAUGHT', 'saves/1.json', 74, 3,
    `const leo = g.npcs.get('leo'); leo.state = 'lurk'; leo.stateT = 99; leo.root.position.set(-92, 0, 54); place(-92, 55.6, Math.PI); g.cam.yaw = 0.35; g.cam.pitch = 0.3; step(2); g.catchLeo(leo);`,
    ``],
  ['END', 'saves/22.json', 108, 6,
    `hud(false); g.player.root.visible = false; g.world.setNight(0.25, .1);`,
    `const a = 1.75 + k * 0.18; shot([-99 + Math.cos(a) * (60 + k * 40), 30 + k * 30, 40 + Math.sin(a) * (60 + k * 40)], [-95, 2, 45]);
     const o = Math.min(1, (f + 1) / 6);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Finde Leo. Bau das Festival. Fahr möglichst niemanden um.</div><img class="cj" src="assets/ui/calmyjane_text.svg">', o);`],
];

const outRoot = preview ? 'preview2_de' : 'shots_de';
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
  const want = preview ? new Set([0, Math.floor(n / 2), n - 1]) : null;
  for (let f = 0; f < n; f++) {
    await page.evaluate(([f, n]) => window.__shot(f, n), [f, n]);
    if (!want || want.has(f)) await page.screenshot({ path: preview ? `${dir}/${name}_${f}.jpg` : `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: preview ? 70 : 93 });
  }
  console.log('shot', name, n);
}
await browser.close();
