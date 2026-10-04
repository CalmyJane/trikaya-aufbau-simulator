import io, re
t = io.open('shots5.js', encoding='utf8').read() + "\n  // ---- end\n"

def take(name):
    i = t.index("  ['%s'" % name)
    m = re.search(r"\n  (\['|// ----)", t[i + 5:])
    return t[i:i + 5 + m.start() + 1]

keep = {n: take(n) for n in ['RIGGING', 'LEOKITCHEN', 'QUADEXP', 'SOUNDBOX', 'JULIFIGHT', 'JUMP', 'POLICE', 'FIRE', 'NARNIA', 'FINAL', 'END']}
opn = take('OPEN')
a = "`hud(false); g.player.root.visible = false;"
assert a in opn
opn = opn.replace(a, """`// only scripted lines and run-over shouts: no random chatter
     const P = g.npcs.all[0].constructor.prototype; if (!P._say0) { P._say0 = P.say; P.say = function (txt, s) { if (window.MUTE && !this.knocked && !window._force) return; return P._say0.call(this, txt, s); }; }
     window.MUTE = true; window.sayF = (nn, txt, s = 3) => { window._force = true; nn.say(txt, s); window._force = false; };
     for (const nn of g.npcs.all) nn.bubble = null;
     hud(false); g.player.root.position.set(8, 0, -48); g.player.root.visible = false;""")

carry = """  ['CARRY', 'saves4/24.json', 75, 3,
    `const k0 = g.world.spots.kitchen; g.quests.state.inventory.push('veggie_a', 'veggie_b', 'veggie_c'); g.updateCarried();
     place(k0.x + 19, k0.z + 8, Math.atan2(-12, -5)); g.cam.pitch = 0.3; g.cam.targetDist = 6.5;
     const s = g.npcs.get('sabse'); s.task = null; s.target = null; s.wait = 99;`,
    `const k0 = g.world.spots.kitchen; walkTo(k0.x + 5, k0.z + 4, false);
     if (f === 40) sayF(g.npcs.get('sabse'), 'Endlich Gemüse! …Nur DREI Kisten?', 2.6);
     cap('Sachen schleppen. Viele Sachen.', f, n);`],
"""
pump = """  ['PUMP', 'saves4/24.json', 84, 3,
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
"""
dlg1 = """  ['FABI', 'saves4/24.json', 75, 3,
    `const fb = g.npcs.get('fabi'); fb.task = null; fb.target = null; fb.wait = 99; fb.root.position.set(113.7, 0, -23.7); g.vehicles.radlader.place({ x: 130, z: -34 }, 0);
     place(113.7, -21.7, Math.PI); g.cam.yaw = 0.5; g.cam.pitch = 0.3; g.cam.targetDist = 5; step(3);
     g.runDialog([{ who: 'you', text: 'Fabi, wo ist das Werkzeug?' }, { who: 'fabi', text: 'Werkstatt. Rote Kiste. Wahrscheinlich.' }], null, fb);`,
    `if (f === 30) press('KeyE'); if (f === 32) press('KeyE'); cjfollow();`],
"""
dlg2 = """  ['SABSE', 'saves4/24.json', 75, 3,
    `const s = g.npcs.get('sabse'); const k0 = g.world.spots.kitchen; s.task = null; s.target = null; s.wait = 99; s.root.position.set(k0.x, 0, k0.z);
     place(k0.x + 2.4, k0.z + 0.4, -Math.PI / 2); g.cam.yaw = Math.PI / 2 + 0.55; g.cam.pitch = 0.32; g.cam.targetDist = 5; step(3);
     g.runDialog([{ who: 'you', text: 'Was gibt’s heute?' }, { who: 'sabse', text: 'Linsen. Wie gestern. Wie morgen.' }], null, s);`,
    `if (f === 32) press('KeyE'); if (f === 34) press('KeyE'); cjfollow();`],
"""

def rep(k, a, b):
    assert a in keep[k], (k, a[:50])
    keep[k] = keep[k].replace(a, b)

rep('RIGGING', "`const sp = g.world.spots.post_2;", "`g.quests.state.inventory.length = 0; g.updateCarried(); const sp = g.world.spots.post_2;")
rep('POLICE', "`cjfollow(); cap('…oder doch.', f, n, 4, 4);`", "`cjfollow(); cap(f < 40 ? '…oder doch.' : '', f, 40, 4, 4);`")
rep('END', "`hud(false); g.player.root.visible = false;", "`hud(false); g.player.root.position.set(-92, 0, 55); g.player.root.visible = false;")
rep('RIGGING', "c.bubble?.text !== T1) c.say(T1, 3.2);", "c.bubble?.text !== T1) sayF(c, T1, 3.2);")
rep('RIGGING', "c.bubble?.text !== T2) c.say(T2, 2);", "c.bubble?.text !== T2) sayF(c, T2, 2);")
rep('LEOKITCHEN', "leo.say('Nur ein Kaffee! Bin gleich zurück!', 2.5);", "sayF(leo, 'Nur ein Kaffee! Bin gleich zurück!', 2.5);")
rep('LEOKITCHEN', "g.npcs.get('sabse').say('LEO! Das war MEIN Kaffee!', 2.6);", "sayF(g.npcs.get('sabse'), 'LEO! Das war MEIN Kaffee!', 2.6);")
rep('JULIFIGHT', "who.bubble?.text !== s) who.say(s, 2);", "who.bubble?.text !== s) sayF(who, s, 2);")
rep('FIRE', "g.npcs.get('georg')?.say('Schön. Nur die Poi-Technik… naja. Schön.', 3);", "{ const ge = g.npcs.get('georg'); if (ge) sayF(ge, 'Schön. Nur die Poi-Technik… naja. Schön.', 3); }")
rep('SOUNDBOX', "`const b = g.soundbox.box; if (b)", "`const b = g.soundbox.box; if (b && f === 20) sayF(b.npcs[0], 'Die ist leise! …auf Stufe 10.', 2.6); if (b)")

order = [opn, carry, keep['RIGGING'], keep['LEOKITCHEN'], keep['QUADEXP'], pump, dlg1, keep['SOUNDBOX'], keep['JULIFIGHT'], dlg2, keep['JUMP'], keep['POLICE'], keep['FIRE'], keep['NARNIA'], keep['FINAL'], keep['END']]
out = "const SHOTS = [\n" + "".join(s if s.endswith("\n") else s + "\n" for s in order)
io.open('shots6.js', 'w', encoding='utf8').write(out)
names = re.findall(r"\['([A-Z0-9]+)', (?:null|'saves4/\d+\.json'), (\d+),", out)
print([n for n, _ in names]); print('pre-drop', sum(int(x) for _, x in names[:-1]))
g = io.open('gen5.py', encoding='utf8').read()
g = g.replace("shots5.js", "shots6.js").replace("'capture5.mjs'", "'capture6.mjs'").replace("(preview ? 'preview5_' : 'shots5_') + orient", "(preview ? 'preview6_' : 'shots6_') + orient").replace('assert "shots5_" in tail', 'assert "shots6_" in tail')
io.open('gen6.py', 'w', encoding='utf8').write(g)
