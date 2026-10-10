// Scout stills for writing promo shots: node scout8.mjs  → scout8/<name>.jpg
//   cams: name, [camera pos], [look at], night (0..1)
import { launch, openGame } from './lib2.mjs';
import { HELPERS } from './helpers8.mjs';
import fs from 'fs';
process.env.PROMO_LANG = 'de';
const CAMS = JSON.parse(fs.readFileSync(process.argv[2] || 'scout8.json', 'utf8'));
fs.mkdirSync('scout8', { recursive: true });
const browser = await launch();
const { page } = await openGame(browser, 'saves4/24.json', { width: 1280, height: 720 });
page.on('console', (m) => { if (m.type() === 'log') console.log('PAGE', m.text()); });
await page.evaluate(`(async () => { ${HELPERS} })()`);
await page.evaluate(`(async () => { await reset(); step(60); console.log('npcs ' + game.npcs.all.map((n) => n.def.id + '=' + n.def.name).join(', ')); })()`);
for (let [name, pos, look, nt = 0, js = ''] of CAMS) {
  if (js.startsWith('@')) js = fs.readFileSync(js.slice(1), 'utf8');
  await page.evaluate(`(async () => { const g = game; night(${nt}); aerial(${look[0]}, ${look[2]}); shot(${JSON.stringify(pos)}, ${JSON.stringify(look)}); ${js}; step(${nt ? 40 : 6}); })()`);
  await page.screenshot({ path: `scout8/${name}.jpg`, type: 'jpeg', quality: 75 });
  console.log('scout', name);
}
await browser.close();
