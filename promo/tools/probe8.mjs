// Dumps positions (spots, structures, NPCs, vehicles) of the current build for writing promo shots.
import { launch, openGame } from './lib2.mjs';
process.env.PROMO_LANG = 'de';
const browser = await launch();
const { page } = await openGame(browser, process.argv[2] || 'saves4/24.json', { width: 960, height: 540 });
const out = await page.evaluate(() => {
  const g = game, r = (v) => Math.round(v * 10) / 10;
  step(30);
  return {
    day: g.quests.state.day, phase: g.quests.state.phase, karma: g.quests.state.karma,
    built: Object.keys(g.quests.state.built || {}).join(' '),
    spots: Object.entries(g.world.spots).map(([k, v]) => `${k}:${r(v.x)},${r(v.z)}`).join('  '),
    structures: Object.entries(g.world.structures).map(([k, v]) => `${k}:${r(v.object.position.x)},${r(v.object.position.z)}`).join('  '),
    vehicleSpots: JSON.stringify(g.world.vehicleSpots),
    vehicles: Object.entries(g.vehicles).map(([k, v]) => `${k}:${r(v.position.x)},${r(v.position.z)},h${r(v.heading)}`).join('  '),
    npcs: g.npcs.all.filter((n) => !n.def.random).map((n) => `${n.def.id}${n.hidden ? '(hidden)' : ''}:${r(n.position.x)},${r(n.position.z)}`).join('  '),
    campers: g.npcs.campers?.length, all: g.npcs.all.length,
    player: [r(g.player.position.x), r(g.player.position.z)],
  };
});
for (const [k, v] of Object.entries(out)) console.log(k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)) + '\n');
await browser.close();
