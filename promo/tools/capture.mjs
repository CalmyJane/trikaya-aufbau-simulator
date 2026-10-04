// Phase 2: drive the game frame by frame along scripted shots and screenshot every frame.
//   node capture.mjs            -> full 900 frames into frames/
//   node capture.mjs preview    -> first/mid/last frame of each shot into preview/
//   node capture.mjs preview C  -> only shot C
import { openGame } from './lib.mjs';
import fs from 'fs';

const preview = process.argv[2] === 'preview';
const only = process.argv[3];
const W = preview ? 960 : 1920, H = preview ? 540 : 1080;
const { browser, page } = await openGame({ width: W, height: H });
const out = preview ? 'preview' : 'frames';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// ---- one-time world setup: guests stream in (finale), then we take over
await page.evaluate(async () => {
  const g = game;
  const st = document.createElement('style');
  st.textContent = `.nametag{display:none!important}
    #promo{position:fixed;inset:0;pointer-events:none;z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}
    #promo img.logo{width:${innerWidth * 0.16}px;border-radius:50%;box-shadow:0 8px 40px rgba(0,0,0,.7)}
    #promo h1{font-family:'Poiret One',sans-serif;font-size:${innerWidth * 0.065}px;line-height:.95;margin:.25em 0 0;color:#f2c14e;letter-spacing:.06em;text-shadow:0 4px 18px rgba(0,0,0,.7)}
    #promo h1 span{display:block;font-size:.5em;letter-spacing:.4em;color:#fff;margin-top:.15em}
    #promo .tag{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:${innerWidth * 0.022}px;text-shadow:0 3px 12px rgba(0,0,0,.85);margin-top:.6em}
    #promo .cap{position:absolute;bottom:9%;left:0;right:0;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:${innerWidth * 0.03}px;letter-spacing:.04em;text-shadow:0 3px 14px rgba(0,0,0,.9)}
    #promo .cj{position:absolute;right:3%;bottom:4%;height:${innerWidth * 0.03}px;filter:invert(1) drop-shadow(0 2px 6px rgba(0,0,0,.6));opacity:.9}
    #promo .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,.55) 100%)}`;
  document.head.appendChild(st);
  const p = document.createElement('div'); p.id = 'promo'; document.body.appendChild(p);
  window.promo = (html, op = 1) => { p.innerHTML = html; p.style.opacity = op; };
  // fonts / logos warm-up
  promo('<img class="logo" src="assets/ui/logo.png"><h1>x</h1><div class="tag">x</div><img class="cj" src="assets/ui/calmyjane_text.svg">', 0);
  await document.fonts.ready;

  g.finaleSys.run();
  const t0 = performance.now();
  while (performance.now() - t0 < 17500) { step(2); await new Promise((r) => setTimeout(r, 16)); }
  g.finaleSys.active = false; // keep guests, skip the scripted rain/office part
  g.ui.hideBanner?.();
  document.querySelectorAll('.banner,#banner').forEach((e) => e.remove());
  g.player.root.visible = false;

  // dance crowd in front of the dragon
  const S = new THREE_V(-99, 0, 31.5);
  const party = ['YEEES! 🐉', 'Best Aufbau ever!', 'Who built this?!', 'Bass! BASS!', 'I love you all!', 'Where\'s Leo?', 'One more track!', 'Dragon power!'];
  g.npcs.partyLine = () => party[Math.floor(Math.random() * party.length)];
  const people = [...g.finaleSys.guests, ...g.npcs.campers].filter((n) => !n.hidden);
  window.dancers = [];
  people.slice(0, 30).forEach((n, i) => {
    const row = Math.floor(i / 6), col = i % 6;
    n.task = null; n.incident = null;
    const pos = new THREE_V(S.x - 8 + col * 3.2 + (Math.random() - 0.5), 0, S.z + 13 + row * 2.6 + (Math.random() - 0.5));
    n.root.position.copy(pos);
    n.party = { pos, box: S, lineT: 1 + Math.random() * 8 };
    dancers.push(n);
  });
  step(30);
}, null).catch(async (e) => { console.log(e); });

const SHOTS = [
  // name, frames, preroll, setup (page fn body), per-frame (page fn body with f, n, k = f/(n-1))
  ['A', 120, 10, `game.world.setNight(0, .1); game.player.root.position.set(-80,0,60);`,
    `const a = 2.1 + k*0.35; shot([-80+Math.cos(a)*(170-k*40), 105-k*30, 60+Math.sin(a)*(170-k*40)], [-85, 0, 55]);
     const o = Math.min(1, Math.max(0, (f-12)/25)) * Math.min(1, Math.max(0, (n-f-4)/18));
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1>', o);`],
  ['B', 120, 10, `game.player.root.position.set(-99,0,40);`,
    `const a = 1.2 + k*0.5; shot([-99+Math.cos(a)*(34-k*10), 26-k*17, 31.5+Math.sin(a)*(34-k*10)], [-99, 5-k*1.5, 34]);
     const o = Math.min(1, Math.max(0, (f-10)/15)) * Math.min(1, Math.max(0, (n-f-6)/12));
     promo('<div class="cap">Build a whole festival…</div>', o);`],
  ['C', 62, 2, `game.player.root.position.set(-99,0,44);`,
    `const a = 1.95 - k*0.9; shot([-99+Math.cos(a)*15, 3.2+k*1.5, 44+Math.sin(a)*15], [-99, 3, 40]); promo('',0);`],
  ['D', 94, 6, `const g=game; g.sceneCam=null; g.player.root.visible=true; const q=g.vehicles.quad; q.place({x:-76,z:50}, -Math.PI/2); q.repair(); g.enterVehicle(q);
     g.cam.yaw = -Math.PI/2; g.cam.pitch = 0.22; g.cam.dist = g.cam.targetDist = 7; g.input.keys.add('KeyW'); g.player.root.position.copy(q.position);`,
    `if (f===n-1) game.input.keys.delete('KeyW'); step(0); promo(f>8 && f<n-6 ? '<div class="cap">…then drive through it</div>' : '', 1);`],
  ['E', 62, 4, `const g=game; g.input.keys.clear(); g.exitVehicle(); g.player.root.visible=false; g.player.root.position.set(-150,0,45);`,
    `const a = -0.1 - k*0.45; shot([-156+Math.cos(a)*22, 10-k*2, 39+Math.sin(a)*20], [-156, 3.5, 39]); promo('',0);`],
  ['F', 62, 90, `game.world.setNight(0.85, .1); game.player.root.position.set(-100.5,0,100);`,
    `const a = 3.85 + k*0.6; shot([-100.5+Math.cos(a)*(17-k*3), 6.5-k*1.5, 103.5+Math.sin(a)*(17-k*3)], [-101, 1.5, 104]); promo('',0);`],
  ['G', 62, 2, `game.player.root.position.set(-99,0,44);`,
    `const a = 1.0 + k*0.6; shot([-99+Math.cos(a)*(26-k*8), 7-k*2, 31.5+Math.sin(a)*(26-k*8)], [-99, 4, 31.5]); promo(f>6 && f<n-4 ? '<div class="cap">Party all night…</div>' : '', 1);`],
  ['H', 62, 2, `game.world.setNight(0.75,.1); game.player.root.position.set(-80,0,60);`,
    `const a = 2.2 + k*0.35; shot([-99+Math.cos(a)*60, 30-k*6, 60+Math.sin(a)*60], [-99, 0, 60]); promo('',0);`],
  ['I', 78, 120, `const g=game; g.world.setNight(0.55, .1); g.world.setRain(true); g.player.root.position.set(-99,0,48);`,
    `const g=game; if (f===0) { g.cam.shake = 0.8; const L=['My tent is floating!','Every man for himself!','I knew I should have brought wellies!','That\\'s not rain, that\\'s a lake!','Home time! Same again next year!'];
       const park = g.world.spots.parking; for (const nn of [...g.finaleSys.guests, ...g.npcs.campers]) { if (nn.hidden) continue; nn.party=null; nn.incident=null; if (nn.char.sitting) nn.standUp(); nn.say(L[Math.floor(Math.random()*L.length)], 4);
       nn.task = { phase:'go', pos:()=>park, arriveDist:4, workTime:0.1, speed:5.5+Math.random()*2, anim:'run', then:()=>{ nn.gone=true; nn.hidden=true; nn.root.visible=false; } }; } }
     shot([-99+ -6 + k*3, 2.6, 58 - k*2], [-99, 2.2, 42]);
     promo(f>6 && f<n-4 ? '<div class="cap">…until the cloudburst</div>' : '', 1);`],
  ['J', 62, 4, `const g=game; g.world.setRain(false); const inside=g.world.spots.office_inside, boss=g.world.spots.office_boss;
     const cast=['jan','corni','matze','fabi','leo']; const sp=[[boss.x,boss.z],[inside.x+0.9,inside.z-0.6],[inside.x-0.4,inside.z+0.7],[inside.x+1.3,inside.z+0.6],[inside.x-1.4,inside.z-0.2]];
     cast.forEach((id,i)=>{ const nn=g.npcs.get(id); if(!nn) return; nn.task=null; nn.incident=null; nn.away=false; nn.hidden=false; nn.gone=false; nn.root.visible=true; if(nn.char.sitting) nn.standUp(); nn.root.position.set(sp[i][0],0,sp[i][1]); nn.scenePose=inside.clone(); });
     g.player.root.visible=true; g.player.root.position.set(inside.x+0.2,0,inside.z+1.3); g.player.root.rotation.y=Math.PI;
     g.world.setNight(0.45,.1);
     g.runDialog([{ who:'corni', text:'Three weeks of building. Two hours of festival. Then the end of the world.' }]);`,
    `const inside=game.world.spots.office_inside; shot([inside.x+1.5-k*0.5, 6.2-k*0.6, inside.z+3.2-k*0.4], [inside.x-0.3, 0.9, inside.z-0.2]); promo('',0);`],
  ['K', 116, 6, `const g=game; g.ui.closeDialog?.(); document.querySelectorAll('#dialog').forEach(e=>e.classList.add('hidden')); g.world.setNight(0.25,.1); g.player.root.visible=false; g.player.root.position.set(-99,0,40);
     for (const nn of g.npcs.all) if (nn.gone) { nn.gone=false; nn.hidden=false; nn.root.visible=true; }`,
    `const a = 1.6 + k*0.3; shot([-99+Math.cos(a)*(40+k*70), 12+k*60, 31.5+Math.sin(a)*(40+k*70)], [-99, 4, 31.5]);
     const o = Math.min(1, Math.max(0, (f-8)/20));
     promo('<div class="vig"></div><img class="logo" src="assets/ui/logo_notext.png"><h1>TRIKAYA<span>AUFBAU SIMULATOR</span></h1><div class="tag">Build it. Party it. Drown it. Like every year.</div><img class="cj" src="assets/ui/calmyjane_text.svg">', o);`],
];

let total = 0;
for (const [name, n, pre, setup, per] of SHOTS) {
  if (only && name !== only) { total += n; continue; }
  await page.evaluate(({ setup, pre, name }) => { document.getElementById('bubbles').style.visibility = 'AEHK'.includes(name) ? 'hidden' : ''; new Function(setup)(); window.step(pre); }, { setup, pre, name });
  const fn = `(f, n) => { const k = n > 1 ? f / (n - 1) : 0; ${per}\n step(1); }`;
  await page.evaluate((src) => { window.__shot = eval(src); }, fn);
  const want = preview ? new Set([0, Math.floor(n / 2), n - 1]) : null;
  for (let f = 0; f < n; f++) {
    await page.evaluate(([f, n]) => window.__shot(f, n), [f, n]);
    if (!want || want.has(f)) {
      const file = preview ? `${out}/${name}_${f}.jpg` : `${out}/f${String(total + f).padStart(4, '0')}.jpg`;
      await page.screenshot({ path: file, type: 'jpeg', quality: preview ? 70 : 93 });
    }
  }
  total += n;
  console.log('shot', name, 'done, total', total);
}
await browser.close();
