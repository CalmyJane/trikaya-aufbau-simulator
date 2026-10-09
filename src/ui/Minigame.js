import { getLang } from '../i18n.js';

// Small skill games for work and deliver steps (step.minigame):
//   'timing'   – a marker swings back and forth, hit E / Space / tap while it's in the green zone
//   'mash'     – hammer E / Space / tap to fill the bar before the time runs out
//   'sequence' – memorise a short arrow sequence, then repeat it (arrows / WASD / buttons)
//   'balance'  – hold E / Space / touch to push a drifting marker; keep it in the green zone long enough
//   'order'    – tap the work steps in the right order (opts.items, given in the correct order)
//   'match'    – match each thing on the left with its partner on the right (opts.pairs)
//   'spot'     – find the odd one in a grid (the wobbly bolt, the right nut …), opts.rounds times
//   'crown'    – a ring spins: hit when a free hole passes the top marker, fill opts.holes (speeds up)
//   'pump'     – pump left/right in turns, keep the pressure in the green until the tank is empty (too wild = splash)
// step.minigame may also be an array: the games run one after the other, all must succeed.
// Every game resolves to true (success) or false (missed / too slow / cancelled). Keyboard + touch.

const tx = (v) => (v == null ? '' : typeof v === 'string' ? v : v[getLang()] ?? v.de);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ARROWS = [
  { key: ['ArrowLeft', 'KeyA'], sym: '←' },
  { key: ['ArrowUp', 'KeyW'], sym: '↑' },
  { key: ['ArrowRight', 'KeyD'], sym: '→' },
  { key: ['ArrowDown', 'KeyS'], sym: '↓' },
];

export class Minigame {
  constructor(game) {
    this.game = game;
    this.open = false;
  }

  /** kind: a name, an { kind, ...opts } object or an array of those (played in a row). */
  async run(kind, opts = {}) {
    if (this.game.devFast) return true; // automated tests
    const list = Array.isArray(kind) ? kind : [kind];
    for (const k of list) {
      const o = typeof k === 'string' ? { ...opts, kind: k } : { ...opts, ...k, title: tx(k.title) || opts.title };
      const ok = await this.one(o.kind, o);
      if (!ok) return false;
      if (list.length > 1) await new Promise((r) => setTimeout(r, 120));
    }
    return true;
  }

  one(kind, o) {
    switch (kind) {
      case 'mash': return this.mash(o);
      case 'sequence': return this.sequence(o);
      case 'balance': return this.balance(o);
      case 'order': return this.order(o);
      case 'match': return this.match(o);
      case 'spot': return this.spot(o);
      case 'crown': return this.crown(o);
      case 'pump': return this.pump(o);
      default: return this.timing(o);
    }
  }

  frame(title, hint, body = '<div class="mg-bar"><div class="mg-zone"></div><div class="mg-fill"></div><div class="mg-mark"></div></div>') {
    const el = document.createElement('div');
    el.id = 'minigame';
    el.innerHTML = `<div class="mg-panel"><button class="mg-cancel" aria-label="close">✕</button><div class="mg-title">${title}</div>${body}<div class="mg-hint">${hint}</div></div>`;
    document.body.appendChild(el);
    this.open = true;
    return el;
  }

  close(el) {
    el.classList.add('done');
    setTimeout(() => el.remove(), 350);
    this.open = false;
  }

  /** shared ending: flash green/red, sound, close, resolve */
  finisher(el, resolve, cleanup) {
    let done = false;
    return (ok) => {
      if (done) return;
      done = true;
      cleanup?.();
      el.classList.add(ok ? 'ok' : 'fail');
      this.game.audio[ok ? 'accept' : 'click']?.();
      setTimeout(() => { this.close(el); resolve(ok); }, 450);
    };
  }

  /**
   * Listen for "action" presses until cleanup: E / Space, or a tap ANYWHERE – also on the touch buttons
   * (they sit on top and would swallow the tap otherwise). ✕ cancels, and nobody stays stuck: after
   * 12 s without any input the game gives up on its own. onRelease (optional) fires when the key / finger lets go.
   */
  listen(el, onPress, onCancel, onRelease) {
    let idle = 0, lastPress = performance.now();
    const key = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); onCancel(); return; }
      if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) { e.preventDefault(); e.stopPropagation(); idle = 0; onPress(); }
    };
    const keyUp = (e) => { if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); onRelease?.(); } };
    const tap = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.target.closest?.('.mg-cancel')) { if (performance.now() - lastPress > 1200) onCancel(); return; } // no cancel mid-mash
      idle = 0; lastPress = performance.now(); onPress();
    };
    const up = () => onRelease?.();
    const timer = setInterval(() => { if (++idle >= 12) onCancel(); }, 1000);
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', keyUp, true);
    window.addEventListener('pointerdown', tap, true); // capture: before the touch buttons see it
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('keyup', keyUp, true);
      window.removeEventListener('pointerdown', tap, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
    };
  }

  /**
   * For the button games: clicks on .mg-btn[data-i] call onPick(i), number keys 1–9 too,
   * extra keys via keyMap { code: i }. Taps elsewhere are swallowed so the game below stays still.
   */
  listenButtons(el, onPick, onCancel, keyMap = {}) {
    let idle = 0;
    const t0 = performance.now();
    const key = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); onCancel(); return; }
      if (e.repeat) return;
      let i = keyMap[e.code];
      if (i == null && /^Digit[1-9]$/.test(e.code)) i = +e.code.slice(5) - 1;
      if (i == null && /^Numpad[1-9]$/.test(e.code)) i = +e.code.slice(6) - 1;
      if (i != null) { e.preventDefault(); e.stopPropagation(); idle = 0; onPick(i); }
      else if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); }
    };
    const tap = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.target.closest?.('.mg-cancel')) { if (performance.now() - t0 > 1000) onCancel(); return; }
      const b = e.target.closest?.('.mg-btn');
      if (b && el.contains(b) && !b.disabled) { idle = 0; onPick(+b.dataset.i); }
    };
    const timer = setInterval(() => { if (++idle >= 15) onCancel(); }, 1000);
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', tap, true);
    return () => { clearInterval(timer); window.removeEventListener('keydown', key, true); window.removeEventListener('pointerdown', tap, true); };
  }

  timing({ title, speed = 1.3, zone = 0.18 } = {}) {
    const de = getLang() === 'de';
    const el = this.frame(title || (de ? 'Im richtigen Moment!' : 'At the right moment!'), de ? '<b>E</b> / Leertaste / Tippen, wenn der Strich im grünen Bereich ist' : '<b>E</b> / Space / tap when the marker is in the green zone');
    const zoneEl = el.querySelector('.mg-zone'), mark = el.querySelector('.mg-mark');
    const z0 = 0.25 + Math.random() * (0.5 - zone);
    zoneEl.style.left = `${z0 * 100}%`; zoneEl.style.width = `${zone * 100}%`;
    el.querySelector('.mg-fill').style.display = 'none';
    return new Promise((resolve) => {
      let t = Math.random() * 2, last = performance.now(), raf = 0, x = 0;
      const tick = (now) => {
        t += ((now - last) / 1000) * speed; last = now;
        x = 0.5 - 0.5 * Math.cos(t * Math.PI); // ping-pong 0..1
        mark.style.left = `${x * 100}%`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const finish = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const off = this.listen(el, () => finish(x >= z0 && x <= z0 + zone), () => finish(false));
    });
  }

  mash({ title, need = 14, time = 4.5 } = {}) {
    const de = getLang() === 'de';
    const el = this.frame(title || (de ? 'Schnell!' : 'Quick!'), de ? '<b>E</b> / Leertaste / Tippen, so schnell du kannst!' : '<b>E</b> / Space / tap, as fast as you can!');
    el.querySelector('.mg-zone').style.display = 'none';
    el.querySelector('.mg-mark').style.display = 'none';
    const fill = el.querySelector('.mg-fill');
    return new Promise((resolve) => {
      let v = 0, left = time, last = performance.now(), raf = 0;
      const end = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const tick = (now) => {
        const dt = (now - last) / 1000; last = now;
        left -= dt;
        v = Math.max(0, v - dt * 1.6); // it slips back if you stop
        fill.style.width = `${Math.min(1, v / need) * 100}%`;
        if (v >= need) return end(true);
        if (left <= 0) return end(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const off = this.listen(el, () => { v += 1; this.game.audio.hammer?.(); fill.style.width = `${Math.min(1, v / need) * 100}%`; if (v >= need) end(true); }, () => end(false));
    });
  }

  /** Simon says: watch the arrows light up, then repeat them. */
  sequence({ title, length = 4, step = 0.55 } = {}) {
    const de = getLang() === 'de';
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 4));
    const body = `<div class="mg-seq">${seq.map(() => '<span class="mg-slot">·</span>').join('')}</div><div class="mg-pad">${ARROWS.map((a, i) => `<button class="mg-btn mg-arrow" data-i="${i}">${a.sym}</button>`).join('')}</div>`;
    const el = this.frame(title || (de ? 'Merk dir die Reihenfolge!' : 'Remember the order!'), de ? 'Erst zuschauen, dann nachmachen: Pfeiltasten / WASD / Tippen' : 'Watch first, then repeat: arrow keys / WASD / tap', body);
    const slots = [...el.querySelectorAll('.mg-slot')], btns = [...el.querySelectorAll('.mg-btn')];
    const hint = el.querySelector('.mg-hint');
    btns.forEach((b) => (b.disabled = true));
    return new Promise((resolve) => {
      let pos = 0, input = false, off = null;
      const timers = [];
      const finish = this.finisher(el, resolve, () => { timers.forEach(clearTimeout); off?.(); });
      const flash = (i) => { const b = btns[i]; b.classList.add('lit'); timers.push(setTimeout(() => b.classList.remove('lit'), step * 600)); };
      seq.forEach((s, i) => timers.push(setTimeout(() => { slots[i].textContent = ARROWS[s].sym; slots[i].classList.add('shown'); flash(s); this.game.audio.click?.(); }, 350 + i * step * 1000)));
      timers.push(setTimeout(() => {
        slots.forEach((s) => { s.textContent = '?'; s.classList.remove('shown'); });
        btns.forEach((b) => (b.disabled = false));
        hint.innerHTML = de ? '<b>Jetzt du!</b>' : '<b>Your turn!</b>';
        input = true;
      }, 350 + length * step * 1000 + 250));
      const keyMap = {};
      ARROWS.forEach((a, i) => a.key.forEach((k) => (keyMap[k] = i)));
      off = this.listenButtons(el, (i) => {
        if (!input || i > 3) return;
        flash(i);
        if (i !== seq[pos]) { slots[pos].textContent = ARROWS[i].sym; slots[pos].classList.add('bad'); finish(false); return; }
        slots[pos].textContent = ARROWS[i].sym; slots[pos].classList.add('good');
        this.game.audio.hammer?.();
        if (++pos >= seq.length) finish(true);
      }, () => finish(false), keyMap);
    });
  }

  /** Keep the drifting marker in the green zone: hold to push right, let go and it sinks left. */
  balance({ title, need = 2.6, time = 7, zone = 0.24, wind = 1 } = {}) {
    const de = getLang() === 'de';
    const el = this.frame(title || (de ? 'Halt es im Gleichgewicht!' : 'Keep it balanced!'), de ? '<b>E</b> / Leertaste / Finger <b>halten</b> drückt nach rechts, loslassen nach links' : '<b>Hold</b> E / Space / finger to push right, let go to drift left',
      '<div class="mg-bar"><div class="mg-zone"></div><div class="mg-mark mg-bubble"></div></div><div class="mg-sub"><div class="mg-subfill"></div></div>');
    const zoneEl = el.querySelector('.mg-zone'), mark = el.querySelector('.mg-mark'), sub = el.querySelector('.mg-subfill');
    const z0 = 0.5 - zone / 2;
    zoneEl.style.left = `${z0 * 100}%`; zoneEl.style.width = `${zone * 100}%`;
    return new Promise((resolve) => {
      let x = 0.15, v = 0, hold = false, inZone = 0, left = time, t = Math.random() * 10, last = performance.now(), raf = 0;
      const ph = Math.random() * 6;
      const finish = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; left -= dt;
        const gust = (Math.sin(t * 1.7 + ph) * 0.9 + Math.sin(t * 3.1 + ph * 2) * 0.5) * wind;
        v += ((hold ? 1.5 : -1.3) + gust) * dt;
        v *= 1 - 1.2 * dt;
        x += v * dt;
        if (x < 0) { x = 0; v = Math.max(0, v); }
        if (x > 1) { x = 1; v = Math.min(0, v); }
        mark.style.left = `${x * 100}%`;
        const inside = x >= z0 && x <= z0 + zone;
        mark.classList.toggle('in', inside);
        if (inside) inZone += dt;
        sub.style.width = `${Math.min(1, inZone / need) * 100}%`;
        if (inZone >= need) return finish(true);
        if (left <= 0) return finish(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const off = this.listen(el, () => { hold = true; }, () => finish(false), () => { hold = false; });
    });
  }

  /** Tap the steps in the right order. items come in the correct order and get shuffled. */
  order({ title, items = [], mistakes = 1 } = {}) {
    const de = getLang() === 'de';
    const idx = shuffle(items.map((_, i) => i));
    const body = `<div class="mg-list">${idx.map((orig, k) => `<button class="mg-btn mg-item" data-i="${k}"><span class="mg-num">${k + 1}</span>${tx(items[orig])}</button>`).join('')}</div>`;
    const el = this.frame(title || (de ? 'In welcher Reihenfolge?' : 'In which order?'), de ? 'Tippe die Schritte in der richtigen Reihenfolge an (oder Zahlentasten)' : 'Tap the steps in the right order (or number keys)', body);
    const btns = [...el.querySelectorAll('.mg-btn')];
    return new Promise((resolve) => {
      let next = 0, bad = 0;
      const finish = this.finisher(el, resolve, () => off());
      const off = this.listenButtons(el, (k) => {
        const b = btns[k];
        if (!b || b.disabled) return;
        if (idx[k] === next) {
          b.disabled = true; b.classList.add('good');
          b.querySelector('.mg-num').textContent = '✓';
          this.game.audio.hammer?.();
          if (++next >= items.length) finish(true);
        } else {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          if (++bad > mistakes) finish(false);
        }
      }, () => finish(false));
    });
  }

  /** Pair things up: the highlighted left item, then its partner on the right. */
  match({ title, pairs = [], mistakes = 1 } = {}) {
    const de = getLang() === 'de';
    const right = shuffle(pairs.map((_, i) => i));
    const body = `<div class="mg-match"><div class="mg-col">${pairs.map((p, i) => `<div class="mg-left" data-l="${i}">${tx(p[0])}</div>`).join('')}</div><div class="mg-col">${right.map((orig, k) => `<button class="mg-btn mg-item" data-i="${k}"><span class="mg-num">${k + 1}</span>${tx(pairs[orig][1])}</button>`).join('')}</div></div>`;
    const el = this.frame(title || (de ? 'Was gehört wohin?' : 'What goes where?'), de ? 'Finde rechts den Partner zum leuchtenden Feld links (Tippen oder Zahlentasten)' : 'Find the partner of the glowing item on the left (tap or number keys)', body);
    const lefts = [...el.querySelectorAll('.mg-left')], btns = [...el.querySelectorAll('.mg-btn')];
    return new Promise((resolve) => {
      let cur = 0, bad = 0;
      const mark = () => lefts.forEach((l, i) => l.classList.toggle('cur', i === cur));
      mark();
      const finish = this.finisher(el, resolve, () => off());
      const off = this.listenButtons(el, (k) => {
        const b = btns[k];
        if (!b || b.disabled) return;
        if (right[k] === cur) {
          b.disabled = true; b.classList.add('good'); lefts[cur].classList.add('good');
          this.game.audio.hammer?.();
          if (++cur >= pairs.length) { mark(); finish(true); } else mark();
        } else {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          if (++bad > mistakes) finish(false);
        }
      }, () => finish(false));
    });
  }

  /** Find the odd one: a grid of icons, one of them wobbles (or looks different). */
  spot({ title, icon = '🔩', odd = null, n = 9, rounds = 2, time = 9 } = {}) {
    const de = getLang() === 'de';
    const el = this.frame(title || (de ? 'Welches ist es?' : 'Which one is it?'), de ? 'Tippe auf das richtige Feld (oder Zahlentasten 1 bis 9)' : 'Tap the right tile (or number keys 1 to 9)', `<div class="mg-grid"></div><div class="mg-sub"><div class="mg-subfill"></div></div>`);
    const grid = el.querySelector('.mg-grid'), sub = el.querySelector('.mg-subfill');
    // 3×3 grid: keys follow the numpad layout (7 8 9 on top), every tile shows its number
    const pad = n === 9, keyMap = {}, num = (i) => (pad ? (2 - Math.floor(i / 3)) * 3 + (i % 3) + 1 : i + 1);
    for (let i = 0; i < n; i++) keyMap[`Digit${num(i)}`] = keyMap[`Numpad${num(i)}`] = i;
    return new Promise((resolve) => {
      let round = 0, target = 0, left = time, last = performance.now(), raf = 0, dealing = false;
      const deal = () => {
        dealing = false;
        target = Math.floor(Math.random() * n);
        grid.innerHTML = Array.from({ length: n }, (_, i) => `<button class="mg-btn mg-tile${i === target ? (odd ? '' : ' wobble') : ''}" data-i="${i}"><span class="mg-num">${num(i)}</span>${i === target && odd ? odd : icon}</button>`).join('');
      };
      deal();
      const finish = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const tick = (now) => {
        left -= (now - last) / 1000; last = now;
        sub.style.width = `${Math.max(0, left / time) * 100}%`;
        if (left <= 0) return finish(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const off = this.listenButtons(el, (i) => {
        const b = grid.children[i];
        if (!b || dealing) return;
        if (i === target) {
          b.classList.add('good'); this.game.audio.hammer?.();
          if (++round >= rounds) finish(true); else { dealing = true; setTimeout(deal, 220); }
        } else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); left -= 1.5; }
      }, () => finish(false), keyMap);
    });
  }

  /** Yurt roof ring: it spins, hit when a free hole is under the marker at the top. Every pole speeds it up. */
  crown({ title, holes = 6, speed = 0.55, misses = 2, time = 14 } = {}) {
    const de = getLang() === 'de';
    const dots = Array.from({ length: holes }, (_, i) => `<i class="mg-hole" style="transform:rotate(${(i / holes) * 360}deg) translateY(-62px)"></i>`).join('');
    const el = this.frame(title || (de ? 'Dachstangen rein!' : 'Poles in!'), de ? '<b>E</b> / Leertaste / Tippen, wenn ein freies Loch oben am Pfeil ist' : '<b>E</b> / Space / tap when a free hole is at the arrow',
      `<div class="mg-crown"><div class="mg-arrowdown">▼</div><div class="mg-ring">${dots}</div></div><div class="mg-sub"><div class="mg-subfill"></div></div>`);
    const ring = el.querySelector('.mg-ring'), crownEl = el.querySelector('.mg-crown'), hs = [...el.querySelectorAll('.mg-hole')], sub = el.querySelector('.mg-subfill');
    return new Promise((resolve) => {
      let a = Math.random(), v = speed, last = performance.now(), raf = 0, done = 0, bad = 0, left = time;
      const filled = new Set();
      const finish = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; left -= dt;
        a = (a + v * dt) % 1;
        ring.style.transform = `rotate(${a * 360}deg)`;
        sub.style.width = `${Math.max(0, left / time) * 100}%`;
        if (left <= 0) return finish(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const off = this.listen(el, () => {
        // which hole is at the top right now? hole i sits at angle i/holes + a (turns)
        let best = -1, bestD = 1;
        for (let i = 0; i < holes; i++) {
          let d = ((i / holes + a) % 1 + 1) % 1; d = Math.min(d, 1 - d);
          if (d < bestD) { bestD = d; best = i; }
        }
        if (bestD < 0.05 && !filled.has(best)) {
          filled.add(best); hs[best].classList.add('in'); this.game.audio.hammer?.();
          v *= 1.12;
          if (++done >= holes) finish(true);
        } else {
          crownEl.classList.remove('shake'); void crownEl.offsetWidth; crownEl.classList.add('shake');
          if (++bad > misses) finish(false);
        }
      }, () => finish(false));
    });
  }

  /** Pump in turns (left / right). Each stroke adds pressure, it leaks away; only pressure in the green empties the tank. Over the top = splash. */
  pump({ title, need = 4, time = 12, stroke = 0.12, leak = 0.3 } = {}) {
    const de = getLang() === 'de';
    const body = `<div class="mg-pumpwrap"><div class="mg-gauge"><div class="mg-gz"></div><div class="mg-gred"></div><div class="mg-gneedle"></div></div>
      <div class="mg-tank"><div class="mg-tankfill"></div><span>💩</span></div></div>
      <div class="mg-pad"><button class="mg-btn mg-arrow mg-pumpbtn" data-i="0">⬅</button><button class="mg-btn mg-arrow mg-pumpbtn" data-i="1">➡</button></div>`;
    const el = this.frame(title || (de ? 'Pumpen!' : 'Pump!'), de ? 'Abwechselnd ← → (A/D oder Tippen). Druck im Grünen halten!' : 'Alternate ← → (A/D or tap). Keep the pressure in the green!', body);
    const needle = el.querySelector('.mg-gneedle'), tank = el.querySelector('.mg-tankfill'), btns = [...el.querySelectorAll('.mg-pumpbtn')];
    const G0 = 0.45, G1 = 0.82;
    return new Promise((resolve) => {
      let p = 0, got = 0, left = time, side = -1, last = performance.now(), raf = 0;
      const finish = this.finisher(el, resolve, () => { cancelAnimationFrame(raf); off(); });
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now; left -= dt;
        p = Math.max(0, p - leak * dt);
        if (p >= G0 && p <= G1) got += dt;
        needle.style.bottom = `${Math.min(1, p) * 100}%`;
        needle.classList.toggle('in', p >= G0 && p <= G1);
        tank.style.height = `${Math.max(0, 1 - got / need) * 100}%`;
        if (got >= need) return finish(true);
        if (left <= 0) return finish(false);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const keyMap = { ArrowLeft: 0, KeyA: 0, ArrowRight: 1, KeyD: 1 };
      const off = this.listenButtons(el, (i) => {
        if (i > 1) return;
        btns[i].classList.add('lit'); setTimeout(() => btns[i].classList.remove('lit'), 110);
        if (i === side) { p = Math.max(0, p - 0.05); return; } // same side twice: the pump just wheezes
        side = i;
        p += stroke;
        this.game.audio.click?.();
        if (p > 1) { el.querySelector('.mg-panel').classList.add('splash'); finish(false); }
      }, () => finish(false), keyMap);
    });
  }
}
