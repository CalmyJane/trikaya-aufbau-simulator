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
  // build the world in small steps: between them the browser can draw the loading animation and
  // re-layout it when the phone is turned (a long blocking init would freeze it in the old orientation)
  const times = (window.__loadTimes = []);
  let last = performance.now(), prog = 0.9;
  const breathe = (step) => new Promise((resolve) => {
    const now = performance.now();
    times.push([step, Math.round(now - last), Math.round(now)]);
    prog = Math.min(0.99, prog + 0.009);
    game.ui.setLoading(prog);
    let done = false;
    const go = () => { if (!done) { done = true; last = performance.now(); resolve(); } };
    requestAnimationFrame(() => setTimeout(go, 0)); // after the next painted frame…
    setTimeout(go, 80); // …or anyway (tab in the background: no frames)
  });
  await breathe('assets');
  await game.init(breathe);
  game.load();
  await breathe('save');
  clearInterval(ticker);
  game.ui.setLoading(1, L({ de: 'Fertig!', en: 'Ready!' }));
  // compile the shaders of the loaded state before revealing
  await game.precompile(breathe);
  setTimeout(() => {
    game.ui.hideLoading();
    game.toMenu();
    // phones held upright: suggest turning – only now, so the loading animation is never covered
    if (game.input.touch && window.innerHeight > window.innerWidth) portraitHint();
  }, 250);
}

boot();
