// Promo v8 shot list. Music: 160 BPM → one bar = 45 frames at 30 fps; every cut sits on a bar or half bar.
// The drop lands on TITLE (frame 135), the 1-second silence on AWARE, the second drop on STAGE.
// [name, frames, preroll, setup (async page code), per-frame (f, n, k = 0..1)]
export const SHOTS = [
  // ------------------------------------------------ intro (quiet): three places everybody knows
  ['MAIN', 45, 40,
    `aerial(-81, 40); shot([-79, 3.4, 56], [-81, 5.5, 20]);`,
    `shot([-79 - k * 1.5, 3.4 - k * 0.3, 56 - k * 9], [-81, 5.5, 20]);`],
  ['ELEFANT', 45, 40,
    `aerial(-112, 58); shot([-104, 2.4, 65], [-114, 2.3, 53]);`,
    `shot([-104 - k * 2.2, 2.4, 65 - k * 2.6], [-114, 2.3, 53]);`],
  ['SHIVA', 45, 40,
    `aerial(-104, 80); shot([-93, 3.2, 89], [-109, 4.6, 80]);`,
    `shot([-93 + k * 2.5, 3.2 + k * 0.5, 89 + k * 1], [-109, 4.6, 80]);`],
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
       if (!c[2] && g.player.position.z < nn.position.z + 4.2) { c[2] = true; sayF(nn, line, 1.7); nn.char.play('wave', 0.2, { once: true }); } }`],
  // ------------------------------------------------ new rides
  ['BIKE', 68, 3,
    `g.bikeSys.rented = true; ride(g.vehicles.bike, -26, 47, -Math.PI / 2); g.vehicles.bike.speed = 8; g.cam.pitch = 0.09; lock(); zoom(1.7); g.cam.yaw += 0.3;
     hold('franzi', -30, 50.5, [-40, 47]);`,
    `driveTo(-75, 47.5, true); if (f === 16 || f === 44) hop();
     if (f === 3) sayF(g.npcs.get('franzi'), 'Bring’s heil zurück!', 1.6);`],
  ['SCOOTER', 67, 3,
    `g.scooterSys.rented = true; const h = Math.atan2(-64.8, 16.8); ride(g.vehicles.scooter, 74, -41.6, h); g.vehicles.scooter.speed = 8; g.cam.pitch = 0.09; lock(); zoom(1.7); g.cam.yaw -= 0.3;
     hold('fabi', 70, -43.4, [60, -38]);`,
    `driveTo(18, -27.3, true); if (f === 14 || f === 40) hop();
     if (f === 3) sayF(g.npcs.get('fabi'), 'Der ist nur geliehen!', 1.6);`],
  // the break in the music: full throttle… and exactly one person in the way (hit on the bar, frame 45)
  ['QUAD', 112, 3,
    `const h = Math.atan2(-45.6, -41.4); ride(g.vehicles.quad, -10, 28.2, h); g.vehicles.quad.speed = 11; g.cam.pitch = 0.13; lock(); zoom(1.35);
     g.knockReaction = () => ({ karma: 10, shout: { de: 'AAH!', en: 'AAH!' }, line: { de: 'Das ist ein Festival, keine Autobahn!', en: '' } });
     const d = hold('danny', -10 + Math.sin(h) * 26.7, 28.2 + Math.cos(h) * 26.7); d.root.rotation.y = h; window._hit = -1;
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `const d = g.npcs.get('danny');
     if (_hit < 0) { driveTo(-51, -9, true); if (d.knocked) { window._hit = f; console.log('HIT at ' + f); } else { d.wait = 99; } }
     else { keys(); if (f === _hit + 34) sayF(d, 'Das ist ein Festival, keine Autobahn!', 2.2); }`],
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
     if (_tr.out >= 0 && f === _tr.out + 30) sayF(g.npcs.get('julez'), 'Hab ich doch gesagt, das hält nicht!', 2.2);`],
  ['RADLADER', 67, 3,
    `g.checkRunOver = () => {}; const r = g.vehicles.radlader; const h = Math.atan2(-30, -2); ride(r, -65, 42.5, h); r.speed = 6; r.armTarget = -0.95; r.arm.rotation.x = -0.95; g.cam.pitch = 0.2; lock(); zoom(1.3); g.cam.yaw = h + Math.PI - 0.55; untoast();`,
    `driveTo(-95, 40.5, true); if (f === 18) g.vehicles.radlader.armTarget = 0.1; if (f === 48) g.vehicles.radlader.armTarget = -0.95;`],
  // ------------------------------------------------ after work
  ['BEER', 68, 3,
    `const t0 = g.world.spots.tent_table1; window._c0 = t0; g.vehicles.radlader.place({ x: 100, z: -6 }, 0);
     place(t0.x - 2.6, t0.z + 2.4, Math.atan2(2.6, -2.4)); g.cam.yaw = Math.atan2(2.6, -2.4) + Math.PI + 0.5; g.cam.pitch = 0.26; g.cam.targetDist = 5;`,
    `const pp = g.player.position; const j = hold('jan', _c0.x - 1.2, _c0.z + 0.2); j.char.faceTowards(pp, 1 / 30, 4); const fa = hold('fabi', _c0.x - 3.4, _c0.z + 0.4); fa.char.faceTowards(pp, 1 / 30, 4);
     if (f === 3) sayF(j, 'Teammeeting fällt aus.', 0.9);
     if (f === 30) sayF(fa, 'Dann ist jetzt Feierabend. Prost!', 1.6);
     if (f === 34 || f === 48 || f === 60) { g.effects.buy('beer', true); g.player.char.play('wave', 0.2, { once: true }); g.player.waveTimer = 0.8; }`],
  ['DRUNK', 54, 3,
    `untoast(); g.effects.beerLevel = 4; g.bikeSys.rented = true; ride(g.vehicles.bike, -28, 47, -Math.PI / 2); g.vehicles.bike.speed = 7; g.cam.pitch = 0.1; zoom(1.5);`,
    `g.effects.beerLevel = 4; driveTo(-75, 47 + Math.sin(f * 0.16) * 14, true); if (f === 20) hop();
     g.cam.yaw += Math.sin(f * 0.13) * 0.012; const cv = g.renderer.domElement; cv.style.transform = 'rotate(' + (Math.sin(f * 0.11) * 2.6) + 'deg) scale(1.08)'; cv.style.filter = 'blur(' + (0.6 + 0.8 * Math.sin(f * 0.2) ** 2) + 'px) saturate(1.3)';
     promo('<div class="black"></div>', Math.max(0, (f - (n - 9)) / 8));`],
  // the music stops for a second
  ['AWARE', 36, 3,
    `const tp = g.world.structures.awareness.object.position; place(tp.x + 1.2, tp.z + 0.8, -Math.PI / 2); hold('franzi', tp.x + 2.6, tp.z + 1.8, [tp.x + 1.2, tp.z + 0.8]); hold('delsin', tp.x - 0.6, tp.z + 2.4, [tp.x + 1.2, tp.z + 0.8]);
     g.cam.yaw = 1.5; g.cam.pitch = 0.35; g.cam.targetDist = 5; step(2);
     g.runDialog([{ who: 'franzi', text: 'Na du… Aufgewacht? Du bist im Awareness-Zelt. Trink Wasser.' }], null, g.npcs.get('franzi')); for (let i = 0; i < 6; i++) { step(1); await new Promise((r) => setTimeout(r, 60)); }`,
    `promo('<div class="black"></div>', Math.max(0, 1 - (f + 1) / 6));`],
  // ------------------------------------------------ second drop: night
  ['STAGE', 68, 60,
    `night(0.85); aerial(-81, 38); dance(extras().slice(0, 30), -81, 35, 3, 1.9); shot([-81, 2.6, 52], [-81, 5, 20]);`,
    `shot([-81 + k * 2, 2.6 + k * 2.2, 50 + k * 4], [-81, 5, 20]);`],
  ['DOME', 67, 60,
    `night(0.85); aerial(-146, 68); dance(extras().slice(0, 16), -135, 68, 2.4, 1.8); shot([-126, 5, 62], [-150, 3.5, 67]);`,
    `shot([-126 - k * 4, 5 - k * 1.2, 62 + k * 6], [-150, 3.5, 67]);`],
  ['SOUNDBOX', 45, 30,
    `night(0.6); g.soundbox.stop(); g.soundbox.spawn(); const b = g.soundbox.box; window._sb = b;
     const ex = extras(['jan', 'fabi', 'franzi']).slice(0, 9); ex.forEach((nn, i) => { const a = (i / ex.length) * Math.PI * 2; hold(nn); const pos = V3(b.pos.x + Math.cos(a) * 2.6, 0, b.pos.z + Math.sin(a) * 2.6); nn.root.position.copy(pos); nn.party = { pos, box: b.pos, lineT: 99 }; b.npcs.push(nn); });
     aerial(b.pos.x, b.pos.z); bubbles(true); shot([b.pos.x + 6, 5, b.pos.z + 5], [b.pos.x, 1, b.pos.z]);`,
    `const b = _sb; shot([b.pos.x + 6 - k * 1.5, 5, b.pos.z + 5 + k * 1.2], [b.pos.x, 1, b.pos.z]); for (const nn of b.npcs) if (nn.party) nn.party.lineT = 99;`],
  ['FIRE', 68, 60,
    `night(0.85); aerial(-104, 80); window._fc = ['aphi', 'mux', 'dennis', 'sarah'].map((id, i) => { const s = g.world.spots['fire_slot_' + (i + 1)]; const nn = g.npcs.get(id); nn.task = null; nn.incident = null; nn.hidden = false; nn.root.visible = true; nn.root.position.set(s.x, 0, s.z); nn.state = 'flow'; nn.stateT = 99; return nn; });
     const fs0 = g.world.spots.fire_stage; window._fs = fs0; shot([fs0.x + Math.cos(-0.9) * 6.5, 1.9, fs0.z + Math.sin(-0.9) * 6.5], [fs0.x, 1.5, fs0.z]);`,
    `for (const nn of _fc) { nn.state = 'flow'; nn.stateT = 99; }
     const a = -0.9 + k * 0.8; shot([_fs.x + Math.cos(a) * 6.5, 1.9, _fs.z + Math.sin(a) * 6.5], [_fs.x, 1.5, _fs.z]);`],
  ['END', 135, 60,
    `night(0.6); g.world.visibility = 600; aerial(-92, 55); cjmark(0); shot([-90 + Math.cos(2.3) * 70, 34, 55 + Math.sin(2.3) * 70], [-92, 2, 55]);`,
    `g.world.visibility = 600; const a = 2.3 + k * 0.25; shot([-90 + Math.cos(a) * (70 + k * 40), 34 + k * 26, 55 + Math.sin(a) * (70 + k * 40)], [-92, 2, 55]);
     promo(TITLE + '<div class="tag">Jetzt im Browser spielen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
];
