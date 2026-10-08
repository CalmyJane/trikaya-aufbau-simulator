// Promo v7 (German, 40 s: aerials + gameplay): scripted "autopilot" play with the real camera rig + HUD, frame by frame.
//   node capture7.mjs full|preview land|port [SHOT,SHOT]
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
  const m = document.createElement('div'); m.id = 'cjmark'; m.innerHTML = '<img class="h" src="/CalmyJaneHeadWhite.png"><img class="t" src="assets/ui/calmyjane_text.svg">'; document.body.appendChild(m);
  window.cjmark = (op) => { m.style.opacity = op; };
  // portrait: dialogs span the full width – lift the mark above the dialog box
  window.cjfollow = () => { const d = document.getElementById('dialog'); const r = d.getBoundingClientRect(); m.style.bottom = (innerHeight > innerWidth && g.ui.dialogOpen && r.height) ? (innerHeight - r.top + B * 0.02) + 'px' : (B * 0.03) + 'px'; };
  window.CJBIG = '<div class="cjbig"><img class="h" src="/CalmyJaneHeadWhite.png"><img class="t" src="assets/ui/calmyjane_text.svg"></div>';
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
  ['OPEN', 'saves4/24.json', 105, 90,
    `// only scripted lines and run-over shouts: no random chatter
     const P = g.npcs.all[0].constructor.prototype; if (!P._say0) { P._say0 = P.say; P.say = function (txt, s) { if (window.MUTE && !this.knocked && !window._force) return; return P._say0.call(this, txt, s); }; }
     window.MUTE = true; window.sayF = (nn, txt, s = 3) => { window._force = true; nn.say(txt, s); window._force = false; };
     for (const nn of g.npcs.all) nn.bubble = null;
     hud(false); g.player.root.position.set(-80, 0, 50); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(30); document.getElementById('bubbles').style.visibility = 'hidden'; shot([60, 190, 230], [-75, 0, 35]);`,
    `const e = k * k * (3 - 2 * k); shot([60 - e * 70, 190 - e * 70, 230 - e * 70], [-75, 0, 35 + e * 10]);
     if (f < 54) promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1>', Math.min(1, (f + 1) / 5, (53 - f) / 6));
     else promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:14%">Das komplette Trikaya-Gelände.<br>Nachgebaut.</div>', Math.min(1, (f - 54) / 5, (n - 1 - f) / 5));
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['BIRD', 'saves4/24.json', 75, 30,
    `shot([-18, 58, 22], [-18, 0, 14]); hud(false); g.player.root.position.set(-30, 0, 40); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(30); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const e = k * k * (3 - 2 * k); shot([-18 - e * 32, 58 - e * 12, 22 + e * 40], [-18 - e * 32, 0, 14 + e * 40]);
     cap('Jedes Zelt. Jede Bühne. Jeder Bauzaun.', f, n);
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['AMAIN', 'saves4/24.json', 60, 30,
    `shot([-99 + Math.cos(1.1) * 42, 20, 31.5 + Math.sin(1.1) * 42], [-99, 4, 31.5]); hud(false); g.player.root.position.set(-99, 0, 40); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(30); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const a = 1.1 + k * 0.9; shot([-99 + Math.cos(a) * 42, 20 - k * 6, 31.5 + Math.sin(a) * 42], [-99, 4, 31.5]);
     cap('Mainstage. Narnia. Forest Dome. Firespace.', f, n);
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['ACAMP', 'saves4/24.json', 42, 30,
    `shot([-22, 9, -22], [-2, 1, -44]); hud(false); g.player.root.position.set(10, 0, -40); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(30);
     const ns = g.npcs.all.filter((x) => !x.hidden && !x.knocked && !x.incident && !x.party && !x.def.vehicle).slice(0, 26);
     ns.forEach((nn, i) => { nn.task = null; nn.target = null; nn.wait = 0; nn.root.position.set(-20 + (i % 9) * 5 + Math.random() * 2, 0, -46 + Math.floor(i / 9) * 6 + Math.random() * 2); });
     const lines = ['Wer hat meinen Akkuschrauber?!', 'Kaffee!', 'Wo ist Leo?', 'Gaffa! Wer hat Gaffa?', 'Guten Morgen, Crew!', 'Ich such die Spezial-Nuss.', 'Zdenko, mach das Radio leiser!'];
     ns.slice(0, 7).forEach((nn, i) => { nn._pl = lines[i]; });`,
    `shot([-22 + k * 30, 9 - k * 2, -22 + k * 3], [-2 + k * 22, 1, -44]);
     cap('Volunteers überall…', f, n);`],
  ['CREW', 'saves4/24.json', 90, 3,
    `document.getElementById('bubbles').style.visibility = ''; hud(true);
     const C = [['jan', 'Moin! Kaffee steht im Büro.'], ['fabi', 'Gaffa? Hab ich.'], ['sabse', 'Heute: Linsen.'], ['corni', 'Hast du das Rigging-Material?'], ['franzi', 'Trink Wasser!'], ['zdenko', 'Radio bleibt an.'], ['mia', 'Narnia braucht Stroh!'], ['georg', 'Schön. …Naja. Schön.']];
     window._crew = []; C.forEach(([id, line], i) => { const nn = g.npcs.get(id); if (!nn) return; nn.task = null; nn.target = null; nn.incident = null; nn.party = null; nn.wait = 99; nn.hidden = false; nn.root.visible = true;
       nn.root.position.set(-48 - i * 1.7, 0, i % 2 ? 63.6 : 68.4); _crew.push([nn, line]); });
     place(-42, 66, -Math.PI / 2); g.cam.pitch = 0.24; g.cam.targetDist = 6.5;`,
    `walkTo(-66, 66, false); _crew.forEach(([nn, line], i) => { nn.wait = 99; nn.char.faceTowards(g.player.position, 1 / 30, 5); if (f === 2 + i * 8) { sayF(nn, line, 1.6); nn.char.play('wave', 0.2, { once: true }); } });
     cap('…und die ganze Crew ist da.', f, n);`],
  ['JULIFIGHT', 'saves4/24.json', 54, 3,
    `const j = g.npcs.get('juli'); const v = g.npcs.campers.find((x) => !x.hidden && !x.knocked && !x.party);
     for (const nn of [j, v]) { nn.task = null; nn.target = null; nn.wait = 99; nn.incident = null; }
     j.root.position.set(-84, 0, 58); v.root.position.set(-82.6, 0, 58.4); window._jv = v;
     place(-80.5, 61.5, Math.atan2(-3, -3)); g.cam.yaw = Math.atan2(-3, -3) + Math.PI + 0.6; g.cam.pitch = 0.28; g.cam.targetDist = 5.5;`,
    `const j = g.npcs.get('juli'), v = _jv; j.char.faceTowards(v.position, 1 / 30, 6); v.char.faceTowards(j.position, 1 / 30, 6); j.wait = v.wait = 99;
     const L = [[0, j, 'Das ist MEIN Akkuschrauber!'], [15, v, 'Steht doch nirgends drauf!'], [30, j, 'Doch! JULI! Mit Edding!'], [45, v, 'Da steht JULE.']];
     for (const [t0, who, s] of L) if (f >= t0 && f < t0 + 15 && who.bubble?.text !== s) sayF(who, s, 2);
     if (f % 8 === 0) j.char.play('wave', 0.2, { once: true });`],
  ['BIKE', 'saves4/24.json', 54, 3,
    `g.bikeSys.rented = true; ride(g.vehicles.bike, -20, 70, -Math.PI / 2); g.vehicles.bike.speed = 5; g.cam.pitch = 0.22; g.cam.targetDist = 6;
     const fr = g.npcs.get('franzi'); fr.task = null; fr.target = null; fr.incident = null; fr.wait = 99; fr.root.position.set(-27, 0, 73);`,
    `driveTo(-75, 70, true); if (f === 4) sayF(g.npcs.get('franzi'), 'Bring’s heil zurück! Der Besen ist handgebunden!', 2.4); cap('Franzis Hexenrad ausleihen.', f, n);`],
  ['RADLADER', 'saves4/24.json', 78, 3,
    `const r = g.vehicles.radlader; ride(r, 30, -30, Math.atan2(-66, 15)); r.speed = 6; r.armTarget = -0.95; r.arm.rotation.x = -0.95; g.cam.pitch = 0.2; g.cam.targetDist = 9; g.cam.yaw = r.heading + Math.PI - 0.5; document.querySelectorAll('.toast').forEach((e) => e.remove());`,
    `driveTo(-36, -15, true); if (f === 40) g.vehicles.radlader.armTarget = 0.1; if (f === 62) g.vehicles.radlader.armTarget = -0.95; cap('Radlader fahren.', f, n);`],
  ['QUADEXP', 'saves4/24.json', 60, 3,
    `ride(g.vehicles.quad, -20, 66, -Math.PI / 2 - 0.15); g.vehicles.quad.speed = 12; g.cam.pitch = 0.22;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(4, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.target = null; nn.wait = 99; nn.root.position.set(-38 - i * 2.4, 0, 63.5 + (i % 2 ? 1.2 : -1.2)); });
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `driveTo(-75, 60, true); cap('Quad heizen.', f, n);`],
  ['ANARNIA', 'saves4/24.json', 54, 30,
    `shot([-150, 26, 120], [-100, 0, 80]); hud(false); g.player.root.position.set(-100, 0, 80); g.player.root.visible = false; g.world.setNight(0, .1); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `shot([-150 + k * 70, 26, 120 - k * 10], [-100 + k * 20, 0, 80]);
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['BEER', 'saves4/24.json', 66, 3,
    `g.effects.reset(); const t = g.npcs.get('thompsen'); const ze = g.npcs.get('zdenko'); const c0 = g.world.spots.chill || { x: 12, z: -46 };
     t.task = null; t.target = null; t.wait = 99; t.root.position.set(c0.x + 1.6, 0, c0.z);
     if (ze) { ze.task = null; ze.target = null; ze.wait = 99; ze.root.position.set(c0.x + 0.6, 0, c0.z + 1.8); }
     place(c0.x - 1.2, c0.z + 0.6, Math.PI / 2); g.cam.yaw = Math.PI / 2 + Math.PI + 0.7; g.cam.pitch = 0.3; g.cam.targetDist = 5.5; window._c0 = c0;`,
    `const t = g.npcs.get('thompsen'); t.wait = 99; t.task = null; t.target = null; t.root.position.set(_c0.x + 1.6, 0, _c0.z); t.char.faceTowards(g.player.position, 1 / 30, 4);
     if (f === 4) sayF(t, 'Na? Feierabendbier? Es ist 11 Uhr.', 2.2);
     if (f === 12 || f === 34 || f === 54) { g.effects.buy('beer', true); g.player.char.play('wave', 0.2, { once: true }); g.player.waveTimer = 0.8; }
     if (f === 40) { const ze = g.npcs.get('zdenko'); if (ze) sayF(ze, 'Prost! Auf den Aufbau!', 2); }
     cap('Bier mit der Crew…', f, n);`],
  ['DRUNK', 'saves4/24.json', 60, 3,
    `document.querySelectorAll('.toast').forEach((e) => e.remove()); g.effects.beerLevel = 4; ride(g.vehicles.quad, -20, 70, -Math.PI / 2); g.vehicles.quad.speed = 8; g.cam.pitch = 0.22; g.cam.targetDist = 8;`,
    `g.effects.beerLevel = 4; driveTo(-80, 70, true); g.cam.yaw += Math.sin(f * 0.13) * 0.012; const cv = g.renderer.domElement; cv.style.transform = 'rotate(' + (Math.sin(f * 0.11) * 2.2) + 'deg) scale(1.07)'; cv.style.filter = 'blur(' + (0.6 + 0.6 * Math.sin(f * 0.2) ** 2) + 'px) saturate(1.3)'; cap('…eins zu viel…', f, n);`],
  ['COLLAPSE', 'saves4/24.json', 33, 3,
    `g.effects.reset(); g.effects.beerLevel = 4; place(-34, 32, Math.PI); g.cam.pitch = 0.5; g.cam.targetDist = 5; g.player.frozen = true; const cv = g.renderer.domElement; cv.style.transform = 'rotate(-3deg) scale(1.07)'; cv.style.filter = 'blur(1px)'; const ch = g.player.char; ch._play0 = ch._play0 || ch.play; ch._play0.call(ch, 'death', 0.2, { once: true }); ch.play = () => {};`,
    `g.effects.beerLevel = 4; g.cam.targetDist = 5 - k * 1.5; promo('<div style="position:absolute;inset:0;background:#000"></div>', Math.max(0, (f - 18) / 16));`],
  ['AWARE', 'saves4/24.json', 78, 3,
    `g.effects.reset(); const cv = g.renderer.domElement; cv.style.transform = ''; cv.style.filter = ''; const ch = g.player.char; if (ch._play0) ch.play = ch._play0; g.player.frozen = false; g.player.char.play('idle', 0.2); const tp = g.world.structures.awareness?.object.position || V3(-35, 0, 25);
     place(tp.x + 1.2, tp.z + 0.8, -Math.PI / 2); const fr = g.npcs.get('franzi'); fr.task = null; fr.target = null; fr.wait = 99; fr.incident = null; fr.root.position.set(tp.x + 2.6, 0, tp.z + 1.8);
     const de = g.npcs.get('delsin'); if (de) { de.task = null; de.target = null; de.wait = 99; de.root.position.set(tp.x - 0.6, 0, tp.z + 2.4); }
     g.cam.yaw = 1.5; g.cam.pitch = 0.35; g.cam.targetDist = 5; step(2);
     g.runDialog([{ who: 'franzi', text: 'Na du… Aufgewacht? Du bist hier im Awareness-Zelt. Trink Wasser, iss einen Keks. Du bist sicher.' }], null, fr);`,
    `promo('<div style="position:absolute;inset:0;background:#000"></div>', Math.max(0, 1 - f / 10)); if (f >= 10) cap('…und im Awareness-Zelt aufwachen.', f - 10, n - 10); cjfollow();`],
  ['SOUNDBOX', 'saves4/24.json', 57, 3,
    `g.npcs.setCrowd(30); g.world.setNight(0.3, .1); g.soundbox.spawn(); const b = g.soundbox.box;
     if (b) { const extra = g.npcs.campers.filter((x) => !x.hidden && !x.knocked && !x.party).slice(14, 24);
       extra.forEach((nn, i) => { const a = (i / extra.length) * Math.PI * 2; const pos = V3(b.pos.x + Math.cos(a) * 3.2, 0, b.pos.z + Math.sin(a) * 3.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: b.pos, lineT: 0.3 + Math.random() * 3 }; b.npcs.push(nn); });
       place(b.pos.x + 9, b.pos.z + 6, Math.atan2(-9, -6)); }
     g.cam.pitch = 0.28; g.cam.targetDist = 7;`,
    `const b = g.soundbox.box; if (b && f === 14) sayF(b.npcs[0], 'Die ist leise! …auf Stufe 10.', 2.6); if (b) walkTo(b.pos.x + 4.5, b.pos.z + 3, false); cap('Soundbox auf dem Camping? Verboten. Eigentlich.', f, n);`],
  ['NARNIA', 'saves4/24.json', 69, 90,
    `g.world.setNight(0.85, .1); g.npcs.setCrowd(30); const d = V3(-99, 0, 50);
     const lines = ['Drache! DRACHE!', 'Noch ein Track!', 'Ich lieb euch alle!', 'Wer hat den Bass so laut gedreht?!'];
     g.npcs.partyLine = () => lines[Math.floor(Math.random() * lines.length)];
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(24, 42);
     ps.forEach((nn, i) => { const row = Math.floor(i / 6), col = i % 6; const pos = V3(d.x - 6 + col * 2.4, 0, d.z - 4 + row * 2.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: d, lineT: 0.5 + Math.random() * 4 }; });
     ride(g.vehicles.quad, -72, 51, -Math.PI / 2); g.vehicles.quad.speed = 4; g.cam.pitch = 0.25; g.cam.targetDist = 8;`,
    `if (f > 14) driveTo(-125, 51, true); else keys(); cap('Nachts wird getanzt.', f, n);`],
  ['FIRE', 'saves4/24.json', 45, 30,
    `g.world.setNight(0.85, .1); const fs0 = g.world.spots.fire_stage; place(fs0.x + 9, fs0.z - 6, 0); g.player.root.visible = false; hud(false); shot([fs0.x + Math.cos(-0.9) * 9, 2.8, fs0.z + Math.sin(-0.9) * 9], [fs0.x, 1.3, fs0.z]);`,
    `const fs0 = g.world.spots.fire_stage; const a = -0.9 + k * 0.7; shot([fs0.x + Math.cos(a) * 9, 2.8, fs0.z + Math.sin(a) * 9], [fs0.x, 1.3, fs0.z]);`],
  ['END', 'saves4/24.json', 120, 60,
    `shot([-90 + Math.cos(2.3) * 70, 34, 55 + Math.sin(2.3) * 70], [-92, 2, 55]); hud(false); g.player.root.position.set(-92, 0, 55); g.player.root.visible = false; g.world.setNight(0.6, .1); cjmark(0); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const a = 2.3 + k * 0.25; shot([-90 + Math.cos(a) * (70 + k * 40), 34 + k * 26, 55 + Math.sin(a) * (70 + k * 40)], [-92, 2, 55]);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Jetzt im Browser spielen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
];

const outRoot = (preview ? 'preview7_' : 'shots7_') + orient;
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
