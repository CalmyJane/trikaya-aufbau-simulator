// Page-side helpers for promo v8 (installed once after the game has loaded).
export const HELPERS = `
  const g = game;
  const st = document.createElement('style');
  const B = Math.min(innerWidth, innerHeight);
  st.textContent = \`#hint,#btn-fs-hud,#touch,#dialog-hint,#tracker,#hud-vol,#prompt,#vehicle-hud{display:none!important}
    #promo{position:fixed;inset:0;pointer-events:none;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}
    #promo img.logo{width:\${B * 0.27}px;border-radius:50%;box-shadow:0 8px 40px rgba(0,0,0,.7)}
    #promo h1{font-family:'Poiret One',sans-serif;font-size:\${B * 0.115}px;line-height:.95;margin:.25em 0 0;color:#f2c14e;letter-spacing:.06em;text-shadow:0 4px 18px rgba(0,0,0,.7)}
    #promo h1 span{display:block;font-size:.5em;letter-spacing:.4em;color:#fff;margin-top:.15em}
    #promo .tag{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:\${B * 0.038}px;text-shadow:0 3px 12px rgba(0,0,0,.85);margin:.6em 4% 0}
    #promo .cap{position:absolute;top:13%;left:4%;right:4%;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:\${B * 0.062}px;line-height:1.15;letter-spacing:.02em;text-shadow:0 3px 14px rgba(0,0,0,.9)}
    #promo .cap.low{top:auto;bottom:8%}
    #promo .cap.big{font-size:\${B * 0.085}px}
    #promo .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,.15) 40%,rgba(0,0,0,.6) 100%)}
    #promo .black{position:absolute;inset:0;background:#000}
    .cjbig{display:flex;flex-direction:column;align-items:center;gap:\${B * 0.03}px;margin-top:\${B * 0.05}px}
    .cjbig img.h{height:\${B * 0.2}px;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7))}
    .cjbig img.t{height:\${B * 0.15}px;filter:invert(1) drop-shadow(0 3px 10px rgba(0,0,0,.7))}
    #cjmark{position:fixed;right:\${B * 0.03}px;bottom:\${B * 0.03}px;z-index:998;pointer-events:none;display:flex;align-items:center;opacity:.85}
    #cjmark img.t{height:\${B * 0.065}px;filter:invert(1) drop-shadow(0 2px 6px rgba(0,0,0,.6))}\`;
  document.head.appendChild(st);
  const p = document.createElement('div'); p.id = 'promo'; document.body.appendChild(p);
  window.promo = (html, op = 1) => { if (p._h !== html) { p.innerHTML = html; p._h = html; } p.style.opacity = op; };
  // caption that fades in over a frames and out over b frames (a / b = 0: hard cut)
  window.cap = (txt, f, n, a = 4, b = 4, cls = 'low') => promo(txt ? '<div class="cap ' + cls + '">' + txt + '</div>' : '', Math.max(0, Math.min(1, a ? (f + 1) / a : 1, b ? (n - 1 - f) / b : 1)));
  const m = document.createElement('div'); m.id = 'cjmark'; m.innerHTML = '<img class="t" src="assets/ui/calmyjane_text.svg">'; document.body.appendChild(m);
  window.cjmark = (op) => { m.style.opacity = op; };
  window.CJBIG = '<div class="cjbig"><img class="t" src="assets/ui/calmyjane_text.svg"></div>';
  window.TITLE = '<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1>';
  window.hud = (on) => { document.getElementById('hud').style.visibility = on ? '' : 'hidden'; };
  window.bubbles = (on) => { document.getElementById('bubbles').style.visibility = on ? '' : 'hidden'; };
  window.untoast = () => document.querySelectorAll('.toast').forEach((e) => e.remove());
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
  // bike & scooter: the jump key
  window.hop = () => g.input.pressed.add('Space');
  window.press = (code) => { window.dispatchEvent(new KeyboardEvent('keydown', { code })); window.dispatchEvent(new KeyboardEvent('keyup', { code })); K.delete(code); };
  window.closeDlg = async () => { for (let i = 0; i < 40 && g.ui.dialogOpen; i++) { press('KeyE'); await new Promise((r) => setTimeout(r, 40)); if (document.getElementById('dialog-choices').children.length) { press('Digit1'); await new Promise((r) => setTimeout(r, 60)); } } };
  window.place = (x, z, heading) => { if (g.player.vehicle) g.exitVehicle(); g.player.root.position.set(x, 0, z); g.player.root.rotation.y = heading; g.cam.yaw = heading + Math.PI; g.cam.target.set(x, 1.6, z); };
  window.ride = (v, x, z, heading) => { if (g.player.vehicle) g.exitVehicle(); v.place({ x, z }, heading); v.repair?.(); if ('fuel' in v) v.fuel = 1; g.enterVehicle(v); g.cam.yaw = heading + Math.PI; g.cam.target.set(x, 2.2, z); };
  // an NPC stands still at a spot (and stays there: call every frame with the same values, or once + nn.wait)
  window.hold = (id, x, z, look) => { const nn = typeof id === 'string' ? g.npcs.get(id) : id; if (!nn) { console.log('no npc ' + id); return null; }
    nn.task = null; nn.target = null; nn.incident = null; nn.party = null; nn.visit = null; nn.emote = null; nn.scenePose = null; nn.wait = 99; nn.hidden = false; nn.gone = false; nn.root.visible = true;
    if (nn.char.sitting) nn.char.setSitting(false);
    if (x != null) nn.root.position.set(x, 0, z);
    if (look) nn.root.rotation.y = Math.atan2(look[0] - nn.root.position.x, look[1] - nn.root.position.z);
    return nn; };
  // people who may be used as extras (no fixed role in the shot)
  window.extras = (not = []) => g.npcs.all.filter((x) => !x.hidden && !x.knocked && !x.riding && !x.def.vehicle && !not.includes(x.def.id) && !['leo', 'schwarzhuber', 'aphi', 'mux', 'dennis', 'sarah', 'stella'].includes(x.def.id));
  window.dance = (list, cx, cz, r0 = 2.2, dr = 1.9) => { let ring = 0, i = 0; for (const nn of list) { const per = Math.floor(2 * Math.PI * (r0 + ring * dr) / 1.7); const a = (i / per) * Math.PI * 2 + ring * 0.5; const rr = r0 + ring * dr;
    hold(nn); const pos = V3(cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr); nn.root.position.copy(pos); nn.party = { pos, box: V3(cx, 0, cz), lineT: 1 + Math.random() * 5 }; if (++i >= per) { i = 0; ring++; } } };
  // only scripted lines and run-over shouts: no random chatter
  const P = g.npcs.all[0].constructor.prototype; P._say0 = P.say; P.say = function (txt, s) { if (window.MUTE && !this.knocked && !window._force) return; return P._say0.call(this, txt, s); };
  window.MUTE = true; window.sayF = (nn, txt, s = 3) => { if (!nn) return; window._force = true; nn.say(txt, s); window._force = false; };
  // everything built, all jobs done (same as "Fertiges Festival ansehen" in the menu)
  window.finish = () => { const all = g.quests.constructor.freshState();
    for (const q of Object.values(g.quests.quests)) { all.completed.push(q.id); for (const s of q.steps) { if (s.build) all.built.push({ ...s.build }); if (s.type === 'work' && s.progress) all.progress[s.progress] = s.targets.map((_, i) => i); } }
    all.karma = 120; all.day = 4; all.phase = 'day'; g.days.evening = async () => {}; g.days.sleep = async () => {}; g.finaleSys.start = async () => {}; g.world.clearStructures(); g.quests.restore(all); g.applyProgressLevel(); g.npcs.setCrowd(30); g.refreshHUD(); };
  // tele lens (in a vehicle the camera never comes closer than 9 m)
  window._zoom = 1; window.zoom = (z) => { window._zoom = z; }; const eu0 = g.effects.update.bind(g.effects); g.effects.update = (dt) => { eu0(dt); if (_zoom !== 1) { g.camera.fov /= _zoom; g.camera.updateProjectionMatrix(); } };
  // keep the camera where the shot put it (no swinging behind the vehicle, no pitch reset)
  window.lock = () => { g.cam.lastMouse = performance.now() + 1e7; };
  window.night = (v) => { g.world.night = v; g.world.setNight(v, .1); };
  window.aerial = (x, z) => { hud(false); bubbles(false); g.player.root.position.set(x, 0, z); g.player.root.visible = false; };
  window.reset = async () => {
    keys(); g.sceneCam = null; await closeDlg(); g.building = null; g.ui.progress(null);
    if (g.player.vehicle) g.exitVehicle();
    g.trailer.stop(); delete g.knockReaction; delete g.checkRunOver;
    g.effects.reset(); g.cam.shake = 0; g.cam.pitch = 0.32; g.cam.targetDist = g.cam.dist = 7.5;
    const cv = g.renderer.domElement; cv.style.transform = ''; cv.style.filter = '';
    const ch = g.player.char; if (ch._play0) { ch.play = ch._play0; ch._play0 = null; } g.player.frozen = false;
    g.drama.clearAll(); g.drama.nextT = 1e9; g.soundbox.stop?.(); g.player.root.visible = true; hud(true); bubbles(true); promo('', 0); cjmark(0.85);
    for (const nn of g.npcs.all) { nn.bubble = null; if (nn.party) nn.party = null; if (nn.wait > 50) nn.wait = 0; }
    untoast(); document.getElementById('banner')?.classList.add('hidden');
    night(0); zoom(1); g.cam.lastMouse = 0;
    const vs = g.world.vehicleSpots; g.vehicles.quad.place(vs.quad.pos, vs.quad.heading); g.vehicles.radlader.place(vs.radlader.pos, vs.radlader.heading);
    g.bikeSys.reset(); g.scooterSys.reset();
  };
  finish();
`;
