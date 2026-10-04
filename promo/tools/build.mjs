// Phase 1: play all jobs except the mapping finale, dump the save.
import { chromium } from 'playwright-core';
import fs from 'fs';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
await page.goto('http://localhost:5173/?dev');
await page.waitForFunction(() => window.game && window.game.mode === 'menu', null, { timeout: 180000 });
console.log('menu ready');
await page.evaluate(async () => {
  const T = (await import('/dev/harness.js')).install(game);
  window.T = T;
  game.newGame();
  T.runJobs(0, 22).then(() => { window.BUILD_DONE = true; });
});
const t0 = Date.now();
let last = 0;
while (!(await page.evaluate(() => window.BUILD_DONE))) {
  await new Promise((r) => setTimeout(r, 3000));
  const log = await page.evaluate(() => T.log);
  for (const l of log.slice(last)) console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', l);
  last = log.length;
}
await page.evaluate(() => game.save && game.save());
const save = await page.evaluate(() => localStorage.getItem('trikaya-aufbau-save-v2'));
fs.writeFileSync('save.json', save);
console.log('saved', save.length);
await browser.close();
