import { Game } from './core/Game.js';
import { Assets } from './core/Assets.js';
import { L } from './i18n.js';
import { portraitHint } from './ui/TouchControls.js';

const LOADING_LINES = [
  { de: 'LKW werden entladen…', en: 'Unloading trucks…' },
  { de: 'Verlängerungskabel entwirren…', en: 'Untangling extension cords…' },
  { de: 'Dixis zählen…', en: 'Counting portaloos…' },
  { de: 'Leo suchen…', en: 'Looking for Leo…' },
  { de: 'Das gute Gaffa suchen…', en: 'Looking for the good gaffa…' },
  { de: 'Mit dem Bauern verhandeln…', en: 'Negotiating with the farmer…' },
  { de: 'Drachen ölen…', en: 'Oiling the dragon…' },
]

async function boot() {
  const game = new Game(document.getElementById('game'));
  window.game = game; // handy for debugging in the console
  let li = 0;
  const ticker = setInterval(() => game.ui.setLoading(null, L(LOADING_LINES[++li % LOADING_LINES.length])), 900);
  await Assets.loadAll((p) => game.ui.setLoading(p * 0.9));
  game.ui.setLoading(0.95, L({ de: 'Welt wird aufgebaut…', en: 'Building the world…' }));
  await new Promise((r) => setTimeout(r, 30));
  game.init();
  game.load();
  clearInterval(ticker);
  game.ui.setLoading(1, L({ de: 'Fertig!', en: 'Ready!' }));
  // compile shaders before revealing
  game.renderer.compile(game.scene, game.camera);
  setTimeout(() => {
    game.ui.hideLoading();
    game.toMenu();
    // phones held upright: suggest turning – only now, so the loading animation is never covered
    if (game.input.touch && window.innerHeight > window.innerWidth) portraitHint();
  }, 250);
}

boot();
