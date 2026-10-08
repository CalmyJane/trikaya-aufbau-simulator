// Dev-only test harness: plays quests automatically in the browser console.
//   const T = (await import('/dev/harness.js')).install(game); await T.accept('jan'); await T.run('q0_leo');
export function install(g) {
  g.clock.getDelta = () => 1 / 30;
  g.devFast = true; // skill games auto-win, day/night transitions are instant
  const T = { log: [] };
  T.step = (n) => { for (let i = 0; i < n; i++) g.frame(); };
  T.key = (c) => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); g.input.keys.delete(c); };
  T.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  T.pressE = () => { g.ui.dialogClosedAt = 0; g.input.pressed.add('KeyE'); T.step(1); };
  T.L = g.vehicles.radlader;
  T.goto = (p, dx = 0, dz = 0) => { if (g.player.vehicle) g.exitVehicle(); g.player.root.position.set(p.x + dx, 0, p.z + dz); T.step(3); };
  T.best = () => { const c = g.interactionCandidates()[0]; return c ? (c.disabled ? '[x] ' : '') + c.label.replace(/<[^>]+>/g, '') : 'none'; };
  T.fin = async (choice) => {
    await T.sleep(40);
    for (let i = 0; i < 60 && g.ui.dialogOpen; i++) {
      T.key('KeyE'); await T.sleep(35);
      if (choice && document.getElementById('dialog-choices').children.length) { T.key('Digit' + choice); await T.sleep(60); }
    }
    await T.sleep(50); T.step(2);
  };
  T.placeLoaderAt = (p) => {
    if (!g.player.vehicle) g.enterVehicle(T.L);
    // approach from the open side (away from nearby obstacles): face the item from the base yard / plot centre
    const from = g.world.spots.base_yard;
    const h = p.approach ?? Math.atan2(p.x - from.x, p.z - from.z);
    T.L.root.rotation.y = h;
    T.L.root.position.set(p.x - Math.sin(h) * 4.0, 0, p.z - Math.cos(h) * 4.0);
    T.L.syncCollider(); T.step(2);
  };
  const heavy = (id) => ['dixi_pallet_1', 'dixi_pallet_2', 'sail_crate', 'tent_chai', 'festzelt_bag', 'wc_container_item', 'dome_wood', 'wood_panels', 'wardrobe', 'hammock_posts', 'straw_bales', 'entrance_tent_bag', 'market_stalls', 'water_tank'].includes(id);
  T.run = async (qid, failOnce) => {
    const log = T.log;
    let guard = 0;
    while (g.quests.isActive(qid) && guard++ < 30) {
      if (g.ui.dialogOpen) await T.fin();
      const st = g.quests.currentStep(qid);
      if (!st) break;
      if (st.type === 'pickup') {
        for (const it of st.items) {
          const wi = g.quests.worldItems.get(it.item);
          if (!wi) continue;
          if (heavy(it.item)) { T.placeLoaderAt(wi.pos); const b = T.best(); T.pressE(); await T.sleep(900); T.step(3); if (g.quests.worldItems.has(it.item)) log.push(`  LOAD FAIL ${it.item} best=${b}`); }
          else { T.goto(wi.pos, 0.4, 0.4); T.pressE(); if (g.quests.worldItems.has(it.item)) log.push(`  PICK FAIL ${it.item} best=${T.best()}`); }
        }
      } else if (st.type === 'deliver') {
        const t = g.quests.deliverTarget(st);
        if (st.items.some(heavy)) T.placeLoaderAt({ x: t.pos.x, z: t.pos.z + Math.min(t.r - 3, 6) }); else T.goto(t.pos, 0, Math.min(t.r - 2, 6));
        const b = T.best(); T.pressE(); T.step(Math.ceil((st.buildTime || 3) * 30) + 10);
        if (g.quests.currentStep(qid) === st) log.push(`  DELIVER FAIL best=${b}`);
      } else if (st.type === 'talk') {
        const n = g.npcs.get(st.npc); T.goto(n.position, 1.2, 0.5); const b = T.best(); T.pressE(); await T.fin();
        if (g.quests.currentStep(qid) === st) log.push(`  TALK FAIL ${st.npc} best=${b}`);
      } else if (st.type === 'reach') { T.goto(g.world.spots[st.at], 0.3, 0.3); T.step(2); await T.fin(); }
      else if (st.type === 'night') T.step(30 * 14);
      else if (st.type === 'wait') { for (let i = 0; i < 30 * 60 && g.quests.currentStep(qid) === st; i++) g.frame(); await T.fin(); }
      else if (st.type === 'soundbox') { const o = g.soundbox.box?.npcs[0]; if (o) { T.goto(o.position, 1, 0.5); T.pressE(); await T.fin(); } if (g.quests.currentStep(qid) === st) log.push('  SOUNDBOX FAIL'); }
      else if (st.type === 'delivery') { for (let i = 0; i < 30 * 90 && g.quests.currentStep(qid) === st; i++) g.frame(); }
      else if (st.type === 'work') {
        if (failOnce && st.timeLimit) {
          failOnce = false;
          T.goto(g.world.spots[st.targets[0]]); T.pressE(); T.step(Math.ceil(st.workTime * 30) + 5);
          for (let i = 0; i < st.timeLimit * 30 + 30 && !g.quests.timer.expired; i++) g.frame();
          log.push(`  expired, night=${g.world.night.toFixed(2)} vis=${g.world.visibility.toFixed(0)}`);
          await T.sleep(1000); await T.fin(); T.step(5);
          log.push(`  after retry: done=${g.quests.state.active[qid].done.length} left=${g.quests.timer?.left.toFixed(0)} lights=${g.quests.state.progress.lights} night=${g.world.night.toFixed(2)}`);
        }
        for (const tname of st.targets) {
          T.goto(g.world.spots[tname]); const b = T.best(); T.pressE(); T.step(Math.ceil(st.workTime * 30) + 5); await T.sleep(20); T.step(30);
          if (!g.quests.isActive(qid) || g.quests.currentStep(qid) !== st) break;
          if (!g.quests.state.active[qid].done.includes(st.targets.indexOf(tname))) log.push(`  WORK FAIL ${tname} best=${b}`);
        }
      } else if (st.type === 'park') {
        const sp = g.world.spots[st.at];
        if (!g.player.vehicle) g.enterVehicle(T.L);
        T.L.root.rotation.y = st.heading || 0; T.L.root.position.set(sp.x, 0, sp.z); T.L.speed = 0; T.L.syncCollider(); T.step(60);
        if (g.quests.currentStep(qid) === st) log.push('  PARK FAIL');
      } else if (st.type === 'karma') {
        g.quests.state.karma += g.quests.state.active[qid].need;
        if (g.player.vehicle) g.exitVehicle();
        const n = g.npcs.get(g.quests.quests[qid].giver); T.goto(n.position, 1.2, 0.5); T.pressE(); await T.fin();
        if (g.quests.currentStep(qid) === st) log.push('  KARMA FAIL');
      } else if (st.type === 'fuel') { T.goto(T.L.position, 3.5, 0); T.pressE(); T.step(90); }
    }
    log.push(`${qid} done=${g.quests.isDone(qid)} money=${Math.round(g.quests.state.money)} night=${g.world.night.toFixed(2)}`);
  };
  T.accept = async (npcId) => {
    const n = g.npcs.get(npcId); await T.sleep(300); T.goto(n.position, 1.2, 0.5); const b = T.best(); T.pressE(); await T.fin(1);
    if (!Object.keys(g.quests.state.active).length) { await T.sleep(300); T.goto(n.position, 1.2, 0.5); T.pressE(); await T.fin(1); }
    for (let i = 0; i < 20 && !Object.keys(g.quests.state.active).length; i++) await T.sleep(50);
    if (!Object.keys(g.quests.state.active).length) T.log.push(`ACCEPT FAIL ${npcId} best=${b}`);
  };
  T.jobs = [
    // day 1 · night 1
    ['jan', 'q0_leo'], ['jan', 's0_soundbox'], ['corni', 'q1a_posts'], ['corni', 'q1_rigging'], ['matze', 'q2_sails'], ['felix', 'q4_lights'],
    ['corni', 'x1_nuss'],
    // day 2 · night 2
    ['corni', 'q3_toilets'], ['sabse', 's1_veggies'], ['franzi', 'q6_awareness'], ['mia', 'n1_narnia'], ['wiesel', 'h1_hammocks'], ['cosma', 'k1_kuenstlergasse'], ['flo', 's3_quad'], ['krygo', 'kr1_sauna'],
    ['corni', 's2_storm'],
    // day 3 · night 3
    ['jan', 'e1_entrance'], ['annika', 'm1_shops'], ['matze', 'q7_dome'], ['mia', 'n2_narnia'], ['cosma', 'k2_kunst'], ['andi', 'r1_wassertank'], ['fabbe', 'q8_forestdome'],
    ['fabbe', 'f1_fabbe_tools'],
    // day 4 · night 4
    ['schwarzhuber', 'g1_genehmigung'], ['corni', 'q9_festzelt'], ['mia', 'n3_narnia'], ['jonas', 'q11_straw'],
    ['harry', 'q10_mapping'],
  ];
  T.runJobs = async (from, to, failLights) => { for (const [npc, q] of T.jobs.slice(from, to)) { g.drama.clearAll(); g.drama.nextT = 9999; await T.accept(npc); await T.run(q, failLights && q === 'q4_lights'); } return T.log; };
  return T;
}
