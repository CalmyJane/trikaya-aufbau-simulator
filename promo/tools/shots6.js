const SHOTS = [
  ['OPEN', 'saves4/24.json', 96, 30,
    `// only scripted lines and run-over shouts: no random chatter
     const P = g.npcs.all[0].constructor.prototype; if (!P._say0) { P._say0 = P.say; P.say = function (txt, s) { if (window.MUTE && !this.knocked && !window._force) return; return P._say0.call(this, txt, s); }; }
     window.MUTE = true; window.sayF = (nn, txt, s = 3) => { window._force = true; nn.say(txt, s); window._force = false; };
     for (const nn of g.npcs.all) nn.bubble = null;
     hud(false); g.player.root.position.set(8, 0, -48); g.player.root.visible = false; cjmark(0); g.world.setNight(0.35, .1); g.npcs.setCrowd(60); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `shot([40 - k * 22, 34 - k * 20, -95 + k * 30], [8, 0, -48]);
     if (f < 42) { cjmark(0); promo('<div class="vig"></div>' + CJBIG.replace('cjbig', 'cjbig xl'), Math.min(1, (f + 1) / 6, (41 - f) / 6)); }
     else { cjmark(Math.min(0.85, (f - 42) / 8)); promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:16%">Montag, 7 Uhr. Aufbau.</div>', Math.min(1, (f - 42) / 8, (n - 1 - f) / 6)); }
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['CARRY', 'saves4/24.json', 75, 3,
    `const k0 = g.world.spots.kitchen; g.quests.state.inventory.push('veggie_a', 'veggie_b', 'veggie_c'); g.updateCarried();
     place(k0.x + 19, k0.z + 8, Math.atan2(-12, -5)); g.cam.pitch = 0.3; g.cam.targetDist = 6.5;
     const s = g.npcs.get('sabse'); s.task = null; s.target = null; s.wait = 99;`,
    `const k0 = g.world.spots.kitchen; walkTo(k0.x + 5, k0.z + 4, false);
     if (f === 40) sayF(g.npcs.get('sabse'), 'Endlich Gemüse! …Nur DREI Kisten?', 2.6);
     cap('Sachen schleppen. Viele Sachen.', f, n);`],
  ['RIGGING', 'saves4/24.json', 75, 3,
    `g.quests.state.inventory.length = 0; g.updateCarried(); const sp = g.world.spots.post_2; place(sp.x, sp.z, Math.atan2(-99 - sp.x, 31.5 - sp.z)); g.cam.yaw = g.player.root.rotation.y + Math.PI + 0.7; g.cam.pitch = 0.3; g.cam.targetDist = 6.5;
     g.building = { t: 0, dur: 2.2, lastHit: 0, labels: ['Stahlseil spannen…', 'Schäkel zu…', 'Nachspannen…'], done: () => { g.ui.toast('✔ Pfosten 2 geriggt'); g.cam.shake = 0.2; } }; g.player.work(2.2);
     const c = g.npcs.get('corni'); c.task = null; c.target = null; c.root.position.set(sp.x + 2.2, 0, sp.z + 1.6);`,
    `const c = g.npcs.get('corni'); c.char.faceTowards(g.player.position, 1 / 30, 4); const T1 = 'Sag mal… hast du eigentlich das Rigging-Material?'; if (f >= 12 && f < 50 && c.bubble?.text !== T1) sayF(c, T1, 3.2);
     const T2 = '…Ach, das ist es? Ach so.'; if (f >= 56 && c.bubble?.text !== T2) sayF(c, T2, 2);`],
  ['LEOKITCHEN', 'saves4/24.json', 63, 3,
    `const k0 = g.world.spots.kitchen; const leo = g.npcs.get('leo'); leo.root.position.set(k0.x + 2, 0, k0.z + 3); leo.root.visible = true; leo.hidden = false; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0;
     place(k0.x + 16, k0.z + 9, Math.atan2(-14, -6)); g.cam.pitch = 0.25; g.cam.targetDist = 7;
     const s = g.npcs.get('sabse'); s.task = null;`,
    `const leo = g.npcs.get('leo'); if (f === 2) { sayF(leo, 'Nur ein Kaffee! Bin gleich zurück!', 2.5); }
     if (f < 6) leo.stateT = 99; if (f === 6) { leo.state = 'lurk'; } walkTo(leo.position.x, leo.position.z, f > 6);
     if (leo.state === 'flee') leo.stateT = 99;
     if (f === 20) sayF(g.npcs.get('sabse'), 'LEO! Das war MEIN Kaffee!', 2.6);`],
  ['QUADEXP', 'saves4/24.json', 66, 3,
    `ride(g.vehicles.quad, -20, 66, -Math.PI / 2 - 0.15); g.vehicles.quad.speed = 12; g.cam.pitch = 0.22;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(4, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.target = null; nn.wait = 99; nn.root.position.set(-38 - i * 2.4, 0, 63.5 + (i % 2 ? 1.2 : -1.2)); });
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `driveTo(-75, 60, true); cap('Express-Lieferung.', f, n);`],
  ['PUMP', 'saves4/24.json', 84, 3,
    `g.quests.state.inventory.length = 0; g.updateCarried(); const sp = g.world.spots.wc_pump; const j = g.npcs.get('juli');
     window._hid = g.npcs.all.filter((nn) => nn !== j && !nn.hidden && nn.position.distanceTo(sp) < 40); for (const nn of _hid) { nn.hidden = true; nn.root.visible = false; }
     j.task = null; j.incident = null; j.target = null; j.wait = 99; j.root.position.set(sp.x + 7, 0, sp.z + 5);
     place(sp.x + 5, sp.z + 7.5, Math.atan2(-5, -7.5)); g.cam.yaw = Math.atan2(-5, -7.5) + Math.PI - 0.35; g.cam.pitch = 0.3; g.cam.targetDist = 8;
     window._pe = g.drama.spawn('pump');`,
    `const sp = g.world.spots.wc_pump; const j = g.npcs.get('juli');
     if (f > 6 && j.position.distanceTo(sp) > 1.2) { j.wait = 0; j.task = null; j.walkTo(V3(sp.x + 0.6, 0, sp.z + 0.4), 1 / 30, 3.2); } else { j.wait = 99; j.workAnim = true; j.char.faceTowards(sp, 1 / 30, 4); }
     if (f === 8) sayF(j, 'Die Kackepumpe. Natürlich.', 2.2);
     if (f === 60 && _pe) { g.drama.resolve(_pe, j); sayF(j, 'Pumpt wieder. Frag nicht, was drin war.', 2.5); }
     cap('Die Kackepumpe. Immer die Kackepumpe.', f, n);`],
  ['FABI', 'saves4/24.json', 75, 3,
    `const fb = g.npcs.get('fabi'); fb.task = null; fb.target = null; fb.wait = 99; fb.root.position.set(113.7, 0, -23.7); g.vehicles.radlader.place({ x: 130, z: -34 }, 0);
     place(113.7, -21.7, Math.PI); g.cam.yaw = 0.5; g.cam.pitch = 0.3; g.cam.targetDist = 5; step(3);
     g.runDialog([{ who: 'you', text: 'Fabi, wo ist das Werkzeug?' }, { who: 'fabi', text: 'Werkstatt. Rote Kiste. Wahrscheinlich.' }], null, fb);`,
    `if (f === 30) press('KeyE'); if (f === 32) press('KeyE'); cjfollow();`],
  ['SOUNDBOX', 'saves4/24.json', 81, 3,
    `g.npcs.setCrowd(60); g.world.setNight(0.3, .1); g.soundbox.spawn(); const b = g.soundbox.box;
     if (b) { const extra = g.npcs.campers.filter((x) => !x.hidden && !x.knocked && !x.party).slice(14, 24);
       extra.forEach((nn, i) => { const a = (i / extra.length) * Math.PI * 2; const pos = V3(b.pos.x + Math.cos(a) * 3.2, 0, b.pos.z + Math.sin(a) * 3.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: b.pos, lineT: 0.3 + Math.random() * 3 }; b.npcs.push(nn); });
       place(b.pos.x + 9, b.pos.z + 6, Math.atan2(-9, -6)); }
     g.cam.pitch = 0.28; g.cam.targetDist = 7;`,
    `const b = g.soundbox.box; if (b && f === 20) sayF(b.npcs[0], 'Die ist leise! …auf Stufe 10.', 2.6); if (b) walkTo(b.pos.x + 4.5, b.pos.z + 3, false); cap('Soundbox auf dem Camping? Verboten. Eigentlich.', f, n);`],
  ['JULIFIGHT', 'saves4/24.json', 66, 3,
    `const j = g.npcs.get('juli'); const v = g.npcs.campers.find((x) => !x.hidden && !x.knocked && !x.party);
     for (const nn of [j, v]) { nn.task = null; nn.target = null; nn.wait = 99; nn.incident = null; }
     j.root.position.set(-84, 0, 58); v.root.position.set(-82.6, 0, 58.4); window._jv = v;
     place(-80.5, 61.5, Math.atan2(-3, -3)); g.cam.yaw = Math.atan2(-3, -3) + Math.PI + 0.6; g.cam.pitch = 0.28; g.cam.targetDist = 5.5;`,
    `const j = g.npcs.get('juli'), v = _jv; j.char.faceTowards(v.position, 1 / 30, 6); v.char.faceTowards(j.position, 1 / 30, 6); j.wait = v.wait = 99;
     const L = [[0, j, 'Das ist MEIN Akkuschrauber!'], [16, v, 'Steht doch nirgends drauf!'], [32, j, 'Doch! JULI! Mit Edding!'], [48, v, 'Da steht JULE.']];
     for (const [t0, who, s] of L) if (f >= t0 && f < t0 + 16 && who.bubble?.text !== s) sayF(who, s, 2);
     if (f % 8 === 0) j.char.play('wave', 0.2, { once: true });
     cap('Diskussionskultur.', f, n);`],
  ['SABSE', 'saves4/24.json', 75, 3,
    `const s = g.npcs.get('sabse'); const k0 = g.world.spots.kitchen; s.task = null; s.target = null; s.wait = 99; s.root.position.set(k0.x, 0, k0.z);
     place(k0.x + 2.4, k0.z + 0.4, -Math.PI / 2); g.cam.yaw = Math.PI / 2 + 0.55; g.cam.pitch = 0.32; g.cam.targetDist = 5; step(3);
     g.runDialog([{ who: 'you', text: 'Was gibt’s heute?' }, { who: 'sabse', text: 'Linsen. Wie gestern. Wie morgen.' }], null, s);`,
    `if (f === 32) press('KeyE'); if (f === 34) press('KeyE'); cjfollow();`],
  ['JUMP', 'saves4/24.json', 57, 30,
    `place(-131, 17, Math.PI); g.effects.weedT = 40; g.cam.pitch = 0.22; g.cam.targetDist = 7;`,
    `walkTo(-131, -6, true); if (f === 8 || f === 30) { press('Space'); g.input.pressed.add('Space'); } cap('Bauzaun? Kein Problem.', f, n);`],
  ['POLICE', 'saves4/24.json', 105, 3,
    `g.effects.weedT = 0; place(222, -30, Math.PI / 2); g.cam.yaw = Math.PI / 2 + Math.PI - 0.5; g.cam.pitch = 0.3; g.cam.targetDist = 9; g.police.warned = true; g.police.arrest();`,
    `cjfollow(); cap(f < 40 ? '…oder doch.' : '', f, 40, 4, 4);`],
  ['FIRE', 'saves4/24.json', 60, 30,
    `for (let i = 0; i < 120 && g.police.busy; i++) { await closeDlg(); await new Promise((r) => setTimeout(r, 100)); step(1); } await closeDlg();
     const fs0 = g.world.spots.fire_stage; place(fs0.x + 9, fs0.z - 6, 0); g.player.root.visible = false; const ge = g.npcs.get('georg'); if (ge) { ge.task = null; ge.root.position.set(fs0.x + 3.5, 0, fs0.z - 2.5); }`,
    `const fs0 = g.world.spots.fire_stage; const a = -0.9 + k * 0.7; shot([fs0.x + Math.cos(a) * 9, 2.8, fs0.z + Math.sin(a) * 9], [fs0.x, 1.3, fs0.z]);
     if (f === 6) { const ge = g.npcs.get('georg'); if (ge) sayF(ge, 'Schön. Nur die Poi-Technik… naja. Schön.', 3); }
     cap('Feuerinsel: üben, üben, üben.', f, n);`],
  ['NARNIA', 'saves4/24.json', 75, 90,
    `g.world.setNight(0.85, .1); g.npcs.setCrowd(60); const d = V3(-99, 0, 50);
     const lines = ['Drache! DRACHE!', 'Noch ein Track!', 'Ich lieb euch alle!', 'Wer hat den Bass so laut gedreht?!'];
     g.npcs.partyLine = () => lines[Math.floor(Math.random() * lines.length)];
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(24, 42);
     ps.forEach((nn, i) => { const row = Math.floor(i / 6), col = i % 6; const pos = V3(d.x - 6 + col * 2.4, 0, d.z - 4 + row * 2.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: d, lineT: 0.5 + Math.random() * 4 }; });
     ride(g.vehicles.quad, -72, 51, -Math.PI / 2); g.vehicles.quad.speed = 4; g.cam.pitch = 0.25; g.cam.targetDist = 8;`,
    `if (f > 14) driveTo(-125, 51, true); else keys(); cap('Nachts wird getanzt.', f, n);`],
  ['FINAL', 'saves4/24.json', 70, 3,
    `g.world.setNight(0, .1); g.vehicles.radlader.place({ x: 130, z: -34 }, 0); const sp = g.world.spots.base_yard; place(sp.x - 1, sp.z + 5, Math.PI * 0.85); const jan = g.npcs.get('jan'); jan.task = null; jan.root.position.set(sp.x - 1.6, 0, sp.z + 3.4);
     g.cam.yaw = 0.5; g.cam.pitch = 0.32; g.cam.targetDist = 5.5; step(2);
     g.runDialog([{ who: 'jan', text: 'Bitte bleib auf dem Gelände. Leo wär das nicht passiert. Leo hätten sie gar nicht erst gefunden.' }], null, jan);`,
    `g.npcs.get('jan').bubble = null; cjfollow();`],
  ['END', 'saves4/24.json', 108, 60,
    `hud(false); g.player.root.position.set(-92, 0, 55); g.player.root.visible = false; g.world.setNight(0.6, .1); cjmark(0); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const a = 2.3 + k * 0.2; shot([-90 + Math.cos(a) * (70 + k * 30), 34 + k * 20, 55 + Math.sin(a) * (70 + k * 30)], [-92, 2, 55]);
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Für alle, die nicht bis nächstes Jahr warten wollen!</div>' + CJBIG, Math.min(1, (f + 1) / 6));`],

