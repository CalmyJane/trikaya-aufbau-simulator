import { chromium } from 'playwright-core';
import fs from 'fs';
// Opens the game in headless Chrome. save: path to a save json, or null for a fresh game.
export async function launch() {
  return chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio'],
  });
}
export async function openGame(browser, save, { width = 1920, height = 1080, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  const data = save ? fs.readFileSync(save, 'utf8') : null;
  const lang = process.env.PROMO_LANG || 'en';
  await page.addInitScript(([s, lang]) => { try { localStorage.clear(); if (s) localStorage.setItem('trikaya-aufbau-save-v2', s); localStorage.setItem('trikaya-lang', lang); } catch {} }, [data, lang]);
  // never grab the real mouse: headless Chrome on Windows clips the OS cursor to its hidden window
  await page.addInitScript(() => { Element.prototype.requestPointerLock = function () { return Promise.resolve(); }; });
  // vite occasionally reloads the page right after load: retry
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto('http://localhost:5173/');
      await page.waitForFunction(() => window.game && window.game.mode === 'menu', null, { timeout: 180000 });
      await page.waitForTimeout(500);
      await page.evaluate(() => window.game.mode);
      break;
    } catch (e) { if (attempt >= 3) throw e; console.log('retry load', e.message.split('\n')[0]); }
  }
  await page.evaluate(async (fresh) => {
    const g = window.game;
    if (fresh) g.newGame(); else g.startPlay();
    g.renderer.setAnimationLoop(null);
    g.clock.getDelta = () => 1 / 30;
    g.drama.clearAll(); g.drama.nextT = 1e9;
    window.THREE_V = g.camera.position.constructor;
    window.V3 = (x, y, z) => new THREE_V(x, y, z);
    window.step = (n = 1) => { for (let i = 0; i < n; i++) g.frame(); };
    window.shot = (pos, look) => { g.sceneCam = { pos: V3(...pos), look: V3(...look) }; };
    await document.fonts.ready;
  }, !save);
  return { ctx, page };
}
