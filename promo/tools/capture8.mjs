// Promo v8 (German, ~44 s, cut to the beat): scripted "autopilot" play with the real camera rig + HUD, frame by frame.
// Needs the dev server on :5173 (npm run dev).
//   node capture8.mjs full|preview [SHOT,SHOT]
//   full -> %TEMP%/trikaya_promo8/<NAME>/f0000.jpg (or PROMO_OUT) …   preview -> half-size stills per shot into preview8_land/ (PF=0,10,20 picks the frames)
import { launch, openGame } from './lib2.mjs';
import { HELPERS } from './helpers8.mjs';
import { SHOTS } from './shots8.mjs';
import fs from 'fs';
import os from 'os';
import path from 'path';
process.env.PROMO_LANG = 'de';

const preview = process.argv[2] === 'preview';
const only = process.argv[3] ? process.argv[3].split(',') : null;
// 1280x720 CSS pixels: HUD, bubbles and dialogs come out 1.5x bigger (readable in a video); full = 1.5x device pixels = 1920x1080
const [W, H] = [1280, 720];
const SCALE = preview ? 0.75 : 1.5;

// frames go to the local temp folder: inside ProtonDrive the sync renames freshly re-created folders ("Name clash")
const outRoot = preview ? 'preview8_land' : (process.env.PROMO_OUT || os.tmpdir() + '/trikaya_promo8').split(path.sep).join('/');
fs.mkdirSync(outRoot, { recursive: true });
const browser = await launch();
const { page } = await openGame(browser, 'saves4/24.json', { width: W, height: H, scale: SCALE });
page.on('console', (m) => { if (m.type() === 'log') console.log('  PAGE', m.text()); });
await page.evaluate(`(async () => { ${HELPERS} })()`);
await page.evaluate((d) => { window.DBG = d; step(150); }, preview); // the start dive of the camera has to be over
for (const [name, n, pre, setup, per] of SHOTS) {
  if (only && !only.includes(name)) continue;
  await page.evaluate(`(async () => { const g = game; await reset(); ${setup}\n step(${pre}); })()`);
  await page.evaluate(`window.__shot = (f, n) => { const g = game; const k = n > 1 ? f / (n - 1) : 0; ${per}\n step(1); }`);
  const dir = preview ? outRoot : `${outRoot}/${name}`;
  if (!preview) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); }
  const want = preview ? new Set(process.env.PF ? process.env.PF.split(',').map(Number) : [0, Math.floor(n / 3), Math.floor(2 * n / 3), n - 1]) : null;
  for (let f = 0; f < n; f++) {
    await page.evaluate(([f, n]) => window.__shot(f, n), [f, n]);
    if (!want || want.has(f)) await page.screenshot({ path: preview ? `${dir}/${name}_${String(f).padStart(3, '0')}.jpg` : `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: preview ? 70 : 93 });
    if (preview && f % 22 === 0) console.log('   ', name, f, await page.evaluate(() => { const g = game, p = (g.player.vehicle || g.player).position; return `${p.x.toFixed(1)},${p.z.toFixed(1)} v=${(g.player.vehicle?.speed || 0).toFixed(1)}`; }));
  }
  console.log('shot', name, n);
}
await browser.close();
