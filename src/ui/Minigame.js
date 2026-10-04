import { getLang } from '../i18n.js';

// Small skill games for some work steps (step.minigame):
//   'timing' – a marker swings back and forth, hit E / Space / tap while it's in the green zone
//   'mash'   – hammer E / Space / tap to fill the bar before the time runs out
// Both resolve to true (success) or false (missed / too slow). Keyboard + touch.

export class Minigame {
  constructor(game) {
    this.game = game;
    this.open = false;
  }

  run(kind, opts = {}) {
    if (this.game.devFast) return Promise.resolve(true); // automated tests
    return kind === 'mash' ? this.mash(opts) : this.timing(opts);
  }

  frame(title, hint) {
    const el = document.createElement('div');
    el.id = 'minigame';
    el.innerHTML = `<div class="mg-panel"><button class="mg-cancel" aria-label="close">✕</button><div class="mg-title">${title}</div><div class="mg-bar"><div class="mg-zone"></div><div class="mg-fill"></div><div class="mg-mark"></div></div><div class="mg-hint">${hint}</div></div>`;
    document.body.appendChild(el);
    this.open = true;
    return el;
  }

  close(el) {
    el.classList.add('done');
    setTimeout(() => el.remove(), 350);
    this.open = false;
  }

  /**
   * Listen for "action" presses until cleanup: E / Space, or a tap ANYWHERE – also on the touch buttons
   * (they sit on top and would swallow the tap otherwise). ✕ cancels, and nobody stays stuck: after
   * 12 s without any input the game gives up on its own.
   */
  listen(el, onPress, onCancel) {
    let idle = 0;
    const key = (e) => {
      if (e.code === 'Escape') { e.preventDefault(); onCancel(); return; }
      if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) { e.preventDefault(); e.stopPropagation(); idle = 0; onPress(); }
    };
    const tap = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.target.closest?.('.mg-cancel')) { onCancel(); return; }
      idle = 0; onPress();
    };
    const timer = setInterval(() => { if (++idle >= 12) onCancel(); }, 1000);
    window.addEventListener('keydown', key, true);
    window.addEventListener('pointerdown', tap, true); // capture: before the touch buttons see it
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
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        off();
        el.classList.add(ok ? 'ok' : 'fail');
        this.game.audio[ok ? 'accept' : 'click']?.();
        setTimeout(() => { this.close(el); resolve(ok); }, 450);
      };
      const off = this.listen(el, () => finish(x >= z0 && x <= z0 + zone), () => finish(false));
    });
  }

  mash({ title, need = 14, time = 4.5 } = {}) {
    const de = getLang() === 'de';
    const el = this.frame(title || (de ? 'Schnell!' : 'Quick!'), de ? '<b>E</b> / Leertaste / Tippen – so schnell du kannst!' : '<b>E</b> / Space / tap – as fast as you can!');
    el.querySelector('.mg-zone').style.display = 'none';
    el.querySelector('.mg-mark').style.display = 'none';
    const fill = el.querySelector('.mg-fill');
    return new Promise((resolve) => {
      let v = 0, left = time, last = performance.now(), raf = 0, finished = false;
      const end = (ok) => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf);
        off();
        el.classList.add(ok ? 'ok' : 'fail');
        this.game.audio[ok ? 'accept' : 'click']?.();
        setTimeout(() => { this.close(el); resolve(ok); }, 450);
      };
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
}
