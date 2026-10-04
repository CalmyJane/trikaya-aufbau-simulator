import { chromium } from 'playwright-core';
import fs from 'fs';

export async function openGame({ width = 1920, height = 1080 } = {}) {
  const save = fs.readFileSync(new URL('./save.json', import.meta.url), 'utf8');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--mute-audio'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.addInitScript((s) => { try { localStorage.setItem('trikaya-aufbau-save-v2', s); localStorage.setItem('trikaya-lang', 'en'); } catch {} }, save);
  await page.goto('http://localhost:5173/');
  await page.waitForFunction(() => window.game && window.game.mode === 'menu', null, { timeout: 180000 });
  await page.evaluate(async () => {
    const g = window.game;
    g.startPlay();
    g.renderer.setAnimationLoop(null);
    g.clock.getDelta = () => 1 / 30;
    g.drama.clearAll(); g.drama.nextT = 1e9;
    g.ui.showHUD(true);
    // hide the remaining html chrome (prompt, toasts, minimap etc.), keep speech bubbles
    const st = document.createElement('style');
    st.textContent = '#hud > *:not(#bubbles):not(#dialog){display:none!important} #dialog-hint,#touch{display:none!important}';
    document.head.appendChild(st);
    window.THREE_V = g.camera.position.constructor;
    window.V3 = (x, y, z) => g.camera.position.clone().set(x, y, z);
    window.step = (n = 1) => { for (let i = 0; i < n; i++) g.frame(); };
    window.shot = (pos, look) => { g.sceneCam = { pos: V3(...pos), look: V3(...look) }; };
  });
  return { browser, page };
}
