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
