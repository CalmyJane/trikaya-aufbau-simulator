const SHOTS = [
  ['OPEN', 'saves4/24.json', 114, 90,
    `// only scripted lines and run-over shouts: no random chatter
     const P = g.npcs.all[0].constructor.prototype; if (!P._say0) { P._say0 = P.say; P.say = function (txt, s) { if (window.MUTE && !this.knocked && !window._force) return; return P._say0.call(this, txt, s); }; }
     window.MUTE = true; window.sayF = (nn, txt, s = 3) => { window._force = true; nn.say(txt, s); window._force = false; };
     for (const nn of g.npcs.all) nn.bubble = null;
     hud(false); g.player.root.position.set(-80, 0, 50); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(60); document.getElementById('bubbles').style.visibility = 'hidden'; shot([60, 190, 230], [-75, 0, 35]);`,
    `const e = k * k * (3 - 2 * k); shot([60 - e * 70, 190 - e * 70, 230 - e * 70], [-75, 0, 35 + e * 10]);
     if (f < 54) promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1>', Math.min(1, (f + 1) / 5, (53 - f) / 6));
     else promo('<div class="vig"></div><div class="cap" style="top:auto;bottom:14%">Das komplette Trikaya-Gelände.<br>Nachgebaut.</div>', Math.min(1, (f - 54) / 5, (n - 1 - f) / 5));
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['AMAIN', 'saves4/24.json', 75, 30,
    `shot([-99 + Math.cos(1.1) * 42, 20, 31.5 + Math.sin(1.1) * 42], [-99, 4, 31.5]); hud(false); g.player.root.position.set(-99, 0, 40); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(60); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `const a = 1.1 + k * 0.9; shot([-99 + Math.cos(a) * 42, 20 - k * 6, 31.5 + Math.sin(a) * 42], [-99, 4, 31.5]);
     cap('Mainstage. Narnia. Forest Dome. Firespace.', f, n);
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['ACAMP', 'saves4/24.json', 48, 30,
    `shot([-22, 9, -22], [-2, 1, -44]); hud(false); g.player.root.position.set(10, 0, -40); g.player.root.visible = false; g.world.setNight(0, .1); g.npcs.setCrowd(60);
     const ns = g.npcs.all.filter((x) => !x.hidden && !x.knocked && !x.incident && !x.party && !x.def.vehicle).slice(0, 26);
     ns.forEach((nn, i) => { nn.task = null; nn.target = null; nn.wait = 0; nn.root.position.set(-20 + (i % 9) * 5 + Math.random() * 2, 0, -46 + Math.floor(i / 9) * 6 + Math.random() * 2); });
     const lines = ['Wer hat meinen Akkuschrauber?!', 'Kaffee!', 'Wo ist Leo?', 'Gaffa! Wer hat Gaffa?', 'Guten Morgen, Crew!', 'Ich such die Spezial-Nuss.', 'Zdenko, mach das Radio leiser!'];
     ns.slice(0, 7).forEach((nn, i) => { nn._pl = lines[i]; });`,
    `shot([-22 + k * 30, 9 - k * 2, -22 + k * 3], [-2 + k * 22, 1, -44]);
     cap('Volunteers überall…', f, n);`],
  ['CREW', 'saves4/24.json', 81, 3,
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
  ['LEOKITCHEN', 'saves4/24.json', 51, 3,
    `const k0 = g.world.spots.kitchen; const leo = g.npcs.get('leo'); leo.root.position.set(k0.x + 2, 0, k0.z + 3); leo.root.visible = true; leo.hidden = false; leo.state = 'lurk'; leo.stateT = 99; leo.wait = 99; g.lastLeo = 0;
     place(k0.x + 16, k0.z + 9, Math.atan2(-14, -6)); g.cam.pitch = 0.25; g.cam.targetDist = 7;
     const s = g.npcs.get('sabse'); s.task = null;`,
    `const leo = g.npcs.get('leo'); if (f === 2) { sayF(leo, 'Nur ein Kaffee! Bin gleich zurück!', 2.5); }
     if (f < 6) leo.stateT = 99; if (f === 6) { leo.state = 'lurk'; } walkTo(leo.position.x, leo.position.z, f > 6);
     if (leo.state === 'flee') leo.stateT = 99;
     if (f === 18) sayF(g.npcs.get('sabse'), 'LEO! Das war MEIN Kaffee!', 2.6);`],
  ['RADLADER', 'saves4/24.json', 84, 3,
    `const r = g.vehicles.radlader; ride(r, 30, -30, Math.atan2(-66, 15)); r.speed = 6; r.armTarget = -0.95; r.arm.rotation.x = -0.95; g.cam.pitch = 0.2; g.cam.targetDist = 9; g.cam.yaw = r.heading + Math.PI - 0.5; document.querySelectorAll('.toast').forEach((e) => e.remove());`,
    `driveTo(-36, -15, true); if (f === 40) g.vehicles.radlader.armTarget = 0.1; if (f === 62) g.vehicles.radlader.armTarget = -0.95; cap('Radlader fahren.', f, n);`],
  ['QUADEXP', 'saves4/24.json', 66, 3,
    `ride(g.vehicles.quad, -20, 66, -Math.PI / 2 - 0.15); g.vehicles.quad.speed = 12; g.cam.pitch = 0.22;
     const ps = g.npcs.campers.filter((x) => !x.hidden && !x.knocked).slice(4, 12);
     ps.forEach((nn, i) => { nn.task = null; nn.party = null; nn.target = null; nn.wait = 99; nn.root.position.set(-38 - i * 2.4, 0, 63.5 + (i % 2 ? 1.2 : -1.2)); });
     g.ui.toast('🛵 Quad-Express: noch 0:41!');`,
    `driveTo(-75, 60, true); cap('Quad heizen.', f, n);`],
  ['ANARNIA', 'saves4/24.json', 66, 30,
    `shot([-150, 26, 120], [-100, 0, 80]); hud(false); g.player.root.position.set(-100, 0, 80); g.player.root.visible = false; g.world.setNight(0, .1); document.getElementById('bubbles').style.visibility = 'hidden';`,
    `shot([-150 + k * 70, 26, 120 - k * 10], [-100 + k * 20, 0, 80]);
     if (f === n - 1) document.getElementById('bubbles').style.visibility = '';`],
  ['BEER', 'saves4/24.json', 72, 3,
    `g.effects.reset(); const t = g.npcs.get('thompsen'); const ze = g.npcs.get('zdenko'); const c0 = g.world.spots.chill || { x: 12, z: -46 };
     t.task = null; t.target = null; t.wait = 99; t.root.position.set(c0.x + 1.6, 0, c0.z);
     if (ze) { ze.task = null; ze.target = null; ze.wait = 99; ze.root.position.set(c0.x + 0.6, 0, c0.z + 1.8); }
     place(c0.x - 1.2, c0.z + 0.6, Math.PI / 2); g.cam.yaw = Math.PI / 2 + Math.PI + 0.7; g.cam.pitch = 0.3; g.cam.targetDist = 5.5; window._c0 = c0;`,
    `const t = g.npcs.get('thompsen'); t.wait = 99; t.task = null; t.target = null; t.root.position.set(_c0.x + 1.6, 0, _c0.z); t.char.faceTowards(g.player.position, 1 / 30, 4);
     if (f === 4) sayF(t, 'Na? Feierabendbier? Es ist 11 Uhr.', 2.2);
     if (f === 12 || f === 34 || f === 54) { g.effects.buy('beer', true); g.player.char.play('wave', 0.2, { once: true }); g.player.waveTimer = 0.8; }
     if (f === 40) { const ze = g.npcs.get('zdenko'); if (ze) sayF(ze, 'Prost! Auf den Aufbau!', 2); }
     cap('Bier mit der Crew…', f, n);`],
  ['DRUNK', 'saves4/24.json', 66, 3,
    `document.querySelectorAll('.toast').forEach((e) => e.remove()); g.effects.beerLevel = 4; ride(g.vehicles.quad, -20, 70, -Math.PI / 2); g.vehicles.quad.speed = 8; g.cam.pitch = 0.22; g.cam.targetDist = 8;`,
    `g.effects.beerLevel = 4; driveTo(-80, 70, true); g.cam.yaw += Math.sin(f * 0.13) * 0.012; const cv = g.renderer.domElement; cv.style.transform = 'rotate(' + (Math.sin(f * 0.11) * 2.2) + 'deg) scale(1.07)'; cv.style.filter = 'blur(' + (0.6 + 0.6 * Math.sin(f * 0.2) ** 2) + 'px) saturate(1.3)'; cap('…eins zu viel…', f, n);`],
  ['COLLAPSE', 'saves4/24.json', 36, 3,
    `g.effects.reset(); g.effects.beerLevel = 4; place(-34, 32, Math.PI); g.cam.pitch = 0.5; g.cam.targetDist = 5; g.player.frozen = true; const cv = g.renderer.domElement; cv.style.transform = 'rotate(-3deg) scale(1.07)'; cv.style.filter = 'blur(1px)'; const ch = g.player.char; ch._play0 = ch._play0 || ch.play; ch._play0.call(ch, 'death', 0.2, { once: true }); ch.play = () => {};`,
    `g.effects.beerLevel = 4; g.cam.targetDist = 5 - k * 1.5; promo('<div style="position:absolute;inset:0;background:#000"></div>', Math.max(0, (f - 18) / 16));`],
  ['AWARE', 'saves4/24.json', 84, 3,
    `g.effects.reset(); const cv = g.renderer.domElement; cv.style.transform = ''; cv.style.filter = ''; const ch = g.player.char; if (ch._play0) ch.play = ch._play0; g.player.frozen = false; g.player.char.play('idle', 0.2); const tp = g.world.structures.awareness?.object.position || V3(-35, 0, 25);
     place(tp.x + 1.2, tp.z + 0.8, -Math.PI / 2); const fr = g.npcs.get('franzi'); fr.task = null; fr.target = null; fr.wait = 99; fr.incident = null; fr.root.position.set(tp.x + 2.6, 0, tp.z + 1.8);
     const de = g.npcs.get('delsin'); if (de) { de.task = null; de.target = null; de.wait = 99; de.root.position.set(tp.x - 0.6, 0, tp.z + 2.4); }
     g.cam.yaw = 1.5; g.cam.pitch = 0.35; g.cam.targetDist = 5; step(2);
     g.runDialog([{ who: 'franzi', text: 'Na du… Aufgewacht? Du bist hier im Awareness-Zelt. Trink Wasser, iss einen Keks. Du bist sicher.' }], null, fr);`,
    `promo('<div style="position:absolute;inset:0;background:#000"></div>', Math.max(0, 1 - f / 10)); if (f >= 10) cap('…und im Awareness-Zelt aufwachen.', f - 10, n - 10); cjfollow();`],
  ['SOUNDBOX', 'saves4/24.json', 63, 3,
    `g.npcs.setCrowd(60); g.world.setNight(0.3, .1); g.soundbox.spawn(); const b = g.soundbox.box;
     if (b) { const extra = g.npcs.campers.filter((x) => !x.hidden && !x.knocked && !x.party).slice(14, 24);
       extra.forEach((nn, i) => { const a = (i / extra.length) * Math.PI * 2; const pos = V3(b.pos.x + Math.cos(a) * 3.2, 0, b.pos.z + Math.sin(a) * 3.2); nn.task = null; nn.incident = null; nn.root.position.copy(pos); nn.party = { pos, box: b.pos, lineT: 0.3 + Math.random() * 3 }; b.npcs.push(nn); });
       place(b.pos.x + 9, b.pos.z + 6, Math.atan2(-9, -6)); }
     g.cam.pitch = 0.28; g.cam.targetDist = 7;`,
    `const b = g.soundbox.box; if (b && f === 14) sayF(b.npcs[0], 'Die ist leise! …auf Stufe 10.', 2.6); if (b) walkTo(b.pos.x + 4.5, b.pos.z + 3, false); cap('Soundbox auf dem Camping? Verboten. Eigentlich.', f, n);`],
  ['NARNIA', 'saves4/24.json', 75, 90,
    `g.world.setNight(0.85, .1); g.npcs.setCrowd(60); const d = V3(-99, 0, 50);
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
