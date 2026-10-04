const SHOTS = [
  ['TITLE', null, 90, 4,
    `hud(false); g.player.root.visible = false; cjmark(0);`,
    `const a = 0.9 + k * 0.25; shot([100 + Math.cos(a) * (150 - k * 60), 95 - k * 55, -20 + Math.sin(a) * (150 - k * 60)], [60 - k * 40, 0, -10 - k * 10]);
     if (f < 40) { cjmark(0); promo('<div class="vig"></div>' + CJBIG.replace('cjbig', 'cjbig xl'), Math.min(1, (f + 1) / 6, (39 - f) / 6)); }
     else { cjmark(Math.min(0.85, (f - 40) / 8)); promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:16%">Noch eine Woche bis zum Festival.</div>', Math.min(1, (f - 40) / 8, (n - 1 - f) / 6)); }`],
  ['JAN', null, 105, 3,
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
  ['LEO', 'saves4/1.json', 66, 3,
    `place(62, -37, -Math.PI / 2); const leo = g.npcs.get('leo'); leo.root.position.set(47, 0, -37.5); leo.root.visible = true; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0; g.cam.pitch = 0.18; g.cam.targetDist = g.cam.dist = 6;`,
    `const leo = g.npcs.get('leo'); walkTo(leo.position.x, leo.position.z, true); if (leo.state === 'flee') leo.stateT = 99;
     cap('Leo hat deine Aufgaben. Theoretisch.', f, n);`],
  ['LOADER', 'saves4/17.json', 60, 3,
    `const L = g.vehicles.radlader; ride(L, 84, -44.5, -1.32); g.quests.state.inventory.push('straw_bales', 'wood_panels'); g.updateCarried(); L.speed = 4; g.cam.pitch = 0.5; g.cam.targetDist = 11;`,
    `driveTo(18, -27.3, true); const L = g.vehicles.radlader, h = L.heading, p = L.position;
     const fx = Math.sin(h), fz = Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
     shot([p.x + fx * (6 - k * 2) - rx * 6.5, 3.6, p.z + fz * (6 - k * 2) - rz * 6.5], [p.x + fx * 2, 1.3, p.z + fz * 2]);
     cap('Schweres Zeug? Radlader.', f, n);`],
  ['BUILD', 'saves4/17.json', 84, 3,
    `place(-143, 37, -Math.PI / 2 - 0.1); g.cam.pitch = 0.42; g.cam.targetDist = 13;
     const labels = I18N.t('b.labels');
     g.building = { t: 0, dur: 1.9, lastHit: 0, labels, done: () => {
       g.world.placeStructure('forest_dome', 'forest_dome', 'forest_dome', { animate: true, rotation: 1.7, growTime: 1.4 });
       g.ui.banner(I18N.t('b.built'), 'Forest Dome', I18N.t('b.shape'), 2500); g.cam.shake = 0.3; } };
     g.player.work(1.9);`,
    `g.cam.yaw += (Math.PI / 2 + 0.55 - g.cam.yaw) * 0.1; cap('Anleitung? Wird überbewertet.', f, n);`],
  ['QUAD', 'saves4/17.json', 66, 3,
    `g.npcs.setCrowd(60); ride(g.vehicles.quad, 72, -38.5, -Math.PI / 2); g.vehicles.quad.speed = 9;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(0, 11);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.root.position.set(54 - i * 1.15, 0, -38.5 + (i % 2 ? 1 : -1) * (0.5 + (i % 4) * 0.35)); nn.target = null; nn.wait = 99; nn.say(['Geiles Quad!', 'Hey, langsam!', 'Fährt da Leo?', 'Huiii?'][i % 4], 2); });`,
    `driveTo(20, -38.5, true); cap('Fahr vorsichtig. Oder halt nicht.', f, n);`],
  ['KITCHEN', 'saves4/17.json', 54, 3,
    `ride(g.vehicles.quad, -52, 12.5, -Math.PI / 2 - 0.05); g.vehicles.quad.speed = 8; g.kitchenLast = g.time; g.kitchenStrikes = 3; g.kitchenCD = 0;`,
    `driveTo(-75, 11.4, true); g.kitchenLast = g.time; cap('Nie. Durch. Sabses. Küche.', f, n);`],
  ['CORNI', 'saves4/17.json', 72, 3,
    `const c = g.npcs.get('corni'); c.task = null; const cp = c.position.clone(); place(cp.x + 1.6, cp.z + 1.4, Math.atan2(-1.6, -1.4)); g.cam.yaw = Math.atan2(-1.6, -1.4) + Math.PI + 0.5; g.cam.pitch = 0.3;
     const fl = g.quests.state.flags; fl.chats ||= []; if (!fl.chats.includes('corni#0')) fl.chats.push('corni#0'); step(4); g.chatWith(c);`,
    `if (f === 42) press('Digit1'); cjfollow();`],
  ['PUMP', 'saves4/17.json', 66, 3,
    `const sp = g.world.spots.wc_pump; const j = g.npcs.get('juli'); j.task = null; j.target = null; j.wait = 99; j.workAnim = true; j.root.position.set(sp.x + 0.6, 0, sp.z + 0.4);
     place(sp.x + 4.2, sp.z + 3.6, Math.atan2(-4.2, -3.6)); g.cam.yaw = Math.atan2(-4.2, -3.6) + Math.PI - 0.45; g.cam.pitch = 0.32; g.cam.targetDist = 8.5;
     // nobody walks through the shot
     window._hid = g.npcs.all.filter((nn) => nn !== j && !nn.hidden && nn.position.distanceTo(sp) < 45);
     for (const nn of _hid) { nn.hidden = true; nn.root.visible = false; }
     window._pe = g.drama.spawn('pump');`,
    `const j = g.npcs.get('juli'); j.wait = 99; j.workAnim = true; j.char.faceTowards(g.world.spots.wc_pump, 1 / 30, 4);
     if (f === 6) j.say(I18N.L(_pe.def.helperDialog), 2.6);
     if (f === 40 && _pe) g.drama.resolve(_pe, j);
     cap('Kackepumpe kaputt? Juli regelt das.', f, n);`],
  ['KUNST', 'saves4/17.json', 54, 3,
    `g.npcs.setCrowd(60); g.npcs.setWorkshop?.(true); place(-121.5, 27.5, Math.atan2(-6, -4)); g.player.root.visible = true;
     const co = g.npcs.get('cosma'); if (co) { co.task = null; co.say('Mehr Farbe! MEHR!', 2.5); }`,
    `shot([-119.5 - k * 2.5, 5.2 - k * 1.2, 31.5 - k * 2], [-127.5, 1.0, 23.2]); cap('Kunst. Mit genug Gaffa.', f, n);`],
  ['WEED', 'saves4/17.json', 48, 30,
    `place(-99, 58, Math.PI); g.effects.weedT = 40; g.cam.pitch = 0.2;`,
    `walkTo(-99, 36, false); if (f === 10 || f === 34) { press('Space'); g.input.pressed.add('Space'); } cap('Pause muss auch mal sein.', f, n);`],
  ['FIRE', 'saves4/24.json', 60, 90,
    `g.world.setNight(0.7, .1); g.npcs.setCrowd(60);
     const pit = g.world.spots.fire_pit; const stg = g.world.spots.fire_stage;
     const lines = ['Feuer! FEUER!', 'Wer hat Marshmallows?', 'Schöner als jede Mainstage.', 'Ich bleib hier bis Montag.', 'Poi! Guck mal, POI!'];
     g.npcs.partyLine = () => lines[Math.floor(Math.random() * lines.length)];
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(20, 34);
     ps.forEach((nn, i) => { const a = (i / ps.length) * Math.PI * 2; const r = i % 2 ? 4.2 : 6.5; const c = i < 8 ? pit : stg;
       const pos = V3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: c, lineT: 0.5 + Math.random() * 4 }; });
     place(-117, 92, Math.atan2(12, 10.5)); g.cam.pitch = 0.3; g.cam.targetDist = 9;`,
    `walkTo(-106, 101, false); cap('Abends: Feuerinsel.', f, n);`],
  ['NIGHT', 'saves4/24.json', 45, 90,
    `g.world.setNight(0.8, .1); ride(g.vehicles.quad, -78, 64, Math.atan2(-21, -17)); g.vehicles.quad.speed = 12; g.cam.pitch = 0.3; g.cam.targetDist = 9;`,
    `driveTo(-99, 49, f < 30); cap('Nachtschicht.', f, n);`],
  ['BEER', 'saves4/17.json', 36, 3,
    `const th = g.npcs.get('thompsen'); place(th.position.x + 0.6, th.position.z + 2.1, Math.PI); g.cam.yaw = 0.6; g.cam.pitch = 0.35; step(3); g.thompsenTalk(th);`,
    `cjfollow();`],
  ['LOADER2', 'saves4/17.json', 45, 3,
    `g.npcs.setCrowd(60); const L = g.vehicles.radlader; ride(L, 38, -36, -Math.PI / 2); L.speed = 6;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(12, 18);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.root.position.set(32 - i * 0.9, 0, -36 + (i % 2 ? 0.7 : -0.7)); nn.target = null; nn.wait = 99; });`,
    `driveTo(10, -36, true);`],
  ['CORNI2', 'saves4/17.json', 33, 3,
    `const c = g.npcs.get('corni'); c.task = null; const cp = c.position.clone(); place(cp.x + 1.2, cp.z + 2.2, Math.atan2(-1.2, -2.2)); g.cam.yaw = Math.atan2(-1.2, -2.2) + Math.PI - 0.4; g.cam.pitch = 0.22; g.cam.targetDist = g.cam.dist = 4.5; step(2);
     c.say('Stahlseile. Hat IRGENDWER die Stahlseile gesehen?!', 3);`,
    `cjfollow();`],
  ['CAUGHT', 'saves4/1.json', 79, 3,
    `const leo = g.npcs.get('leo'); leo.state = 'lurk'; leo.stateT = 99; leo.root.position.set(-92, 0, 54); place(-92, 55.6, Math.PI); g.cam.yaw = 0.35; g.cam.pitch = 0.3; step(2); g.catchLeo(leo);`,
    `cjfollow();`],
  ['END', 'saves4/24.json', 108, 6,
    `hud(false); g.player.root.visible = false; g.world.setNight(0.25, .1); cjmark(0);`,
    `const a = 1.75 + k * 0.18; shot([-99 + Math.cos(a) * (60 + k * 40), 30 + k * 30, 40 + Math.sin(a) * (60 + k * 40)], [-95, 2, 45]);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Für alle, die nicht bis nächstes Jahr warten wollen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],
