// Promo v8 shot list. Music: 160 BPM → one bar = 45 frames at 30 fps; every cut sits on a bar or half bar.
// The drop lands on TITLE (frame 135), the 1-second silence on AWARE, the second drop on NARNIA.
// [name, frames, preroll, setup (async page code), per-frame (f, n, k = 0..1)]
export const SHOTS = [
  // ------------------------------------------------ intro (quiet): three places everybody knows
  ['MAIN', 45, 40,
    `aerial(-81, 40); shot([-79, 3.4, 56], [-81, 5.5, 20]);`,
    `shot([-79 - k * 1.5, 3.4 - k * 0.3, 56 - k * 9], [-81, 5.5, 20]);
     cap('Du warst beim Aufbau dabei?', f, n, 8, 0, 'low');`],
  ['ELEFANT', 45, 40,
    `aerial(-112, 58); shot([-104, 2.4, 65], [-114, 2.3, 53]);`,
    `shot([-104 - k * 2.2, 2.4, 65 - k * 2.6], [-114, 2.3, 53]);
     cap('Du warst beim Aufbau dabei?', f, n, 0, 6, 'low');`],
  ['SHIVA', 45, 40,
    `aerial(-104, 80); shot([-93, 3.2, 89], [-109, 4.6, 80]);`,
    `shot([-93 + k * 2.5, 3.2 + k * 0.5, 89 + k * 1], [-109, 4.6, 80]);
     cap('Dann kennst du das hier.', f, n, 5, 3, 'low');`],
  // ------------------------------------------------ drop: title over the whole site
  ['TITLE', 90, 40,
    `aerial(-80, 50); shot([40, 150, 190], [-75, 0, 38]);`,
    `const e = 1 - (1 - k) * (1 - k); shot([40 - e * 62, 150 - e * 78, 190 - e * 82], [-75, 0, 38 + e * 8]);
     promo(TITLE, Math.min(1, (f + 1) / 3, (n - 1 - f) / 8));`],
  // ------------------------------------------------ the crew
  ['CREW', 135, 3,
    `const C = [['jan', 119.6, -12.5, 'Moin! Kaffee steht im Büro.'], ['fabi', 113.6, -14.5, 'Gaffa? Hab ich.'], ['sabse', 119.8, -17, 'Heute gibt’s Linsen.'], ['corni', 113.9, -18.2, 'Hast du die Spezial-Nuss?'], ['franzi', 119.8, -21.5, 'Trink Wasser!'], ['estenko', 119.4, -25.5, 'Radio bleibt an.']];
     window._crew = C.map(([id, x, z, line]) => [hold(id, x, z), line, false]);
     g.vehicles.quad.place({ x: 124, z: -9 }, 2.2);
     place(116.6, -7.5, Math.PI); g.cam.pitch = 0.22; g.cam.targetDist = 6;`,
    `walkTo(116.9, -40, false);
     for (const c of _crew) { const [nn, line] = c; nn.wait = 99; nn.char.faceTowards(g.player.position, 1 / 30, 5);
       if (!c[2] && g.player.position.z < nn.position.z + 4.2) { c[2] = true; sayF(nn, line, 1.7); nn.char.play('wave', 0.2, { once: true }); } }
     cap('Die ganze Crew ist da.', f, n);`],
  // ------------------------------------------------ new rides
  ['BIKE', 68, 3,
    `g.bikeSys.rented = true; ride(g.vehicles.bike, -26, 47, -Math.PI / 2); g.vehicles.bike.speed = 8; g.cam.pitch = 0.09; lock(); zoom(1.7); g.cam.yaw += 0.3;
     hold('franzi', -30, 50.5, [-40, 47]);`,
    `driveTo(-75, 47.5, true); if (f === 16 || f === 44) hop();
     if (f === 3) sayF(g.npcs.get('franzi'), 'Bring’s heil zurück!', 1.6);
     cap('Franzis Hexenrad.', f, n);`],
  ['SCOOTER', 67, 3,
    `g.scooterSys.rented = true; const h = Math.atan2(-64.8, 16.8); ride(g.vehicles.scooter, 74, -41.6, h); g.vehicles.scooter.speed = 8; g.cam.pitch = 0.09; lock(); zoom(1.7); g.cam.yaw -= 0.3;
     hold('fabi', 70, -43.4, [60, -38]);`,
    `driveTo(18, -27.3, true); if (f === 14 || f === 40) hop();
     if (f === 3) sayF(g.npcs.get('fabi'), 'Der ist nur geliehen!', 1.6);
     cap('Fabis E-Scooter.', f, n);`],
  // the break in the music: full throttle… and exactly one person in the way (hit on the bar, frame 45)
  ['QUAD', 112, 3,
    `const h = Math.atan2(-45.6, -41.4); ride(g.vehicles.quad, -10, 28.2, h); g.vehicles.quad.speed = 11; g.cam.pitch = 0.13; lock(); zoom(1.35);
     g.knockReaction = () => ({ karma: 10, shout: { de: 'AAH!', en: 'AAH!' }, line: { de: 'Das ist ein Festival, keine Autobahn!', en: '' } });
     const d = hold('danny', -10 + Math.sin(h) * 26.7, 28.2 + Math.cos(h) * 26.7); d.root.rotation.y = h; window._hit = -1;
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `const d = g.npcs.get('danny');
     if (_hit < 0) { driveTo(-51, -9, true); if (d.knocked) { window._hit = f; console.log('HIT at ' + f); } else { d.wait = 99; } }
     else { keys(); if (f === _hit + 34) sayF(d, 'Das ist ein Festival, keine Autobahn!', 2.2); }
     if (_hit < 0) cap('Quad heizen.', f, 46, 4, 0); else cap('Ups.', f - _hit, n - _hit, 0, 4);`],
  ['HAENGER', 113, 3,
    `g.trailer.start('t1_trailer', g.quests.quests.t1_trailer.steps[0]); const a = g.trailer.active; const o = a.obstacles[4];
     // drive across the cable bridge (its long side lies along the local x axis), coming from the east
     const head = -Math.PI / 2, dir = [-1, 0]; o.pos.set(-50, 0, 47); o.cos = Math.cos(head); o.sin = Math.sin(head); a.group.children[4].position.set(-50, 0, 47); a.group.children[4].rotation.y = head;
     g.checkRunOver = () => {}; ride(g.vehicles.quad, -38, 47, head); g.vehicles.quad.speed = 7; g.trailer.cart.hitchTo(g.vehicles.quad);
     for (const id of ['juli', 'julez', 'corni']) hold(id); g.trailer.board(); untoast();
     const b0 = g.trailer.bump.bind(g.trailer); g.trailer.bump = (c, s) => b0(0, s);
     window._tr = { o, dir, out: -1 }; g.cam.pitch = 0.13; lock(); zoom(1.4); g.cam.yaw += 0.5;`,
    `const { o, dir } = _tr; if (g.vehicles.quad.speed < 8) driveTo(-66, 47, false); else keys();
     if (f === 3) sayF(g.npcs.get('corni'), 'Fahr los, aber mit Gefühl!', 1.6);
     if (_tr.out < 0 && o.onT) { _tr.out = f; console.log('FALL at ' + f); g.trailer.fallOut(g.npcs.get('julez')); }
     if (_tr.out >= 0 && f === _tr.out + 30) sayF(g.npcs.get('julez'), 'Hab ich doch gesagt, das hält nicht!', 2.2);
     cap(_tr.out < 0 ? 'Hänger-Taxi. Keiner fällt raus.' : 'Hänger-Taxi. Fast keiner.', f, n);`],
  ['RADLADER', 67, 3,
    `g.checkRunOver = () => {}; const r = g.vehicles.radlader; const h = Math.atan2(-30, -2); ride(r, -65, 42.5, h); r.speed = 6; r.armTarget = -0.95; r.arm.rotation.x = -0.95; g.cam.pitch = 0.2; lock(); zoom(1.3); g.cam.yaw = h + Math.PI - 0.55; untoast();`,
    `driveTo(-95, 40.5, true); if (f === 18) g.vehicles.radlader.armTarget = 0.1; if (f === 48) g.vehicles.radlader.armTarget = -0.95; cap('Radlader fahren.', f, n);`],
  // ------------------------------------------------ after work
  ['BEER', 68, 3,
    `const c0 = g.world.spots.chill; window._c0 = c0; hold('thompsen', c0.x + 1.6, c0.z); hold('estenko', c0.x + 0.6, c0.z + 1.8);
     place(c0.x - 1.2, c0.z + 0.6, Math.PI / 2); g.cam.yaw = Math.PI / 2 + Math.PI + 0.7; g.cam.pitch = 0.3; g.cam.targetDist = 5.5;`,
    `const t = hold('thompsen', _c0.x + 1.6, _c0.z); t.char.faceTowards(g.player.position, 1 / 30, 4); const z = hold('estenko', _c0.x + 0.6, _c0.z + 1.8); z.char.faceTowards(g.player.position, 1 / 30, 4);
     if (f === 3) sayF(t, 'Feierabendbier? Es ist 11 Uhr.', 2);
     if (f === 10 || f === 30 || f === 50) { g.effects.buy('beer', true); g.player.char.play('wave', 0.2, { once: true }); g.player.waveTimer = 0.8; }
     if (f === 38) sayF(z, 'Prost! Auf den Aufbau!', 1.8);
     cap('Feierabendbier…', f, n);`],
  ['DRUNK', 54, 3,
    `untoast(); g.effects.beerLevel = 4; g.bikeSys.rented = true; ride(g.vehicles.bike, -28, 47, -Math.PI / 2); g.vehicles.bike.speed = 7; g.cam.pitch = 0.1; zoom(1.5);`,
    `g.effects.beerLevel = 4; driveTo(-75, 47 + Math.sin(f * 0.16) * 14, true); if (f === 20) hop();
     g.cam.yaw += Math.sin(f * 0.13) * 0.012; const cv = g.renderer.domElement; cv.style.transform = 'rotate(' + (Math.sin(f * 0.11) * 2.6) + 'deg) scale(1.08)'; cv.style.filter = 'blur(' + (0.6 + 0.8 * Math.sin(f * 0.2) ** 2) + 'px) saturate(1.3)';
     promo('<div class="black"></div><div class="cap">…eins zu viel…</div>', 1); document.querySelector('#promo .black').style.opacity = Math.max(0, (f - (n - 9)) / 8); document.querySelector('#promo .cap').style.opacity = Math.min(1, (f + 1) / 4, Math.max(0, (n - 9 - f) / 4));`],
  // the music stops for a second
  ['AWARE', 36, 3,
    `const tp = g.world.structures.awareness.object.position; place(tp.x + 1.2, tp.z + 0.8, -Math.PI / 2); hold('franzi', tp.x + 2.6, tp.z + 1.8, [tp.x + 1.2, tp.z + 0.8]); hold('delsin', tp.x - 0.6, tp.z + 2.4, [tp.x + 1.2, tp.z + 0.8]);
     g.cam.yaw = 1.5; g.cam.pitch = 0.35; g.cam.targetDist = 5; step(2);
     g.runDialog([{ who: 'franzi', text: 'Na du… Aufgewacht? Du bist im Awareness-Zelt. Trink Wasser.' }], null, g.npcs.get('franzi')); for (let i = 0; i < 6; i++) { step(1); await new Promise((r) => setTimeout(r, 60)); }`,
    `promo('<div class="black"></div>', Math.max(0, 1 - (f + 1) / 6));`],
  // ------------------------------------------------ second drop: night
  ['NARNIA', 68, 60,
    `night(0.85); dance(extras(['fabi', 'franzi', 'jan']).filter((x) => x.def.id !== 'mia').slice(0, 22), -112.5, 58, 2.2, 1.8); hold('mia', -113.6, 54.2, [-112, 60]);
     g.scooterSys.rented = true; ride(g.vehicles.scooter, -86, 64.6, -Math.PI / 2); g.vehicles.scooter.speed = 7; g.cam.pitch = 0.1; lock(); zoom(1.5); g.cam.yaw -= 0.7;`,
    `driveTo(-113, 64.6, false); if (f === 12 || f === 36) hop(); cap('Nachts wird getanzt.', f, n);`],
  ['DOME', 67, 60,
    `night(0.85); aerial(-146, 68); dance(extras().slice(0, 16), -135, 68, 2.4, 1.8); shot([-126, 5, 62], [-150, 3.5, 67]);`,
    `shot([-126 - k * 4, 5 - k * 1.2, 62 + k * 6], [-150, 3.5, 67]);`],
  ['FIRE', 45, 60,
    `night(0.85); aerial(-104, 80); ['aphi', 'mux', 'dennis', 'sarah'].forEach((id, i) => { const s = g.world.spots['fire_slot_' + (i + 1)]; const nn = g.npcs.get(id); nn.root.position.set(s.x, 0, s.z); nn.hidden = false; nn.root.visible = true; }); const fs0 = g.world.spots.fire_stage; window._fs = fs0; shot([fs0.x + Math.cos(-0.9) * 8, 2.6, fs0.z + Math.sin(-0.9) * 8], [fs0.x, 1.4, fs0.z]);`,
    `const a = -0.9 + k * 0.6; shot([_fs.x + Math.cos(a) * 8, 2.6, _fs.z + Math.sin(a) * 8], [_fs.x, 1.4, _fs.z]);`],
  ['STAGE', 68, 60,
    `night(0.85); aerial(-81, 38); dance(extras().slice(0, 30), -81, 35, 3, 1.9); shot([-81, 2.6, 52], [-81, 5, 20]);`,
    `shot([-81 + k * 2, 2.6 + k * 2.2, 50 + k * 4], [-81, 5, 20]); cap('Und dann: Festival.', f, n, 4, 4, 'low');`],
  ['END', 135, 60,
    `night(0.6); g.world.visibility = 600; aerial(-92, 55); cjmark(0); shot([-90 + Math.cos(2.3) * 70, 34, 55 + Math.sin(2.3) * 70], [-92, 2, 55]);`,
    `g.world.visibility = 600; const a = 2.3 + k * 0.25; shot([-90 + Math.cos(a) * (70 + k * 40), 34 + k * 26, 55 + Math.sin(a) * (70 + k * 40)], [-92, 2, 55]);
     promo(TITLE + '<div class="tag">Jetzt im Browser spielen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
];
