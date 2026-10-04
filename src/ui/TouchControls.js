import { t } from '../i18n.js';

// On-screen controls for phones/tablets:
//  - left half: floating joystick (walk / drive; push to the edge = sprint)
//  - right half: drag to look, pinch to zoom
//  - buttons: action (E), jump (Space), sprint toggle; top bar: map, jobs, pause
// Everything is fed into the normal Input object, so game code doesn't care about touch.

export class TouchControls {
  constructor(input, game) {
    this.input = input;
    this.game = game;
    this.stick = null;       // { id, ox, oy }
    this.looks = new Map();  // pointerId -> { x, y }
    this.pinch = null;
    document.body.classList.add('touch');
    this.build();
  }

  build() {
    const el = document.createElement('div');
    el.id = 'touch';
    el.className = 'hidden';
    el.innerHTML = `
      <div id="t-zone"></div>
      <div id="t-stick"><div id="t-knob"></div></div>
      <button class="t-btn" id="t-act" data-code="KeyE"><span>E</span></button>
      <button class="t-btn small" id="t-jump" data-code="Space">⤒</button>
      <button class="t-btn small" id="t-sprint">»</button>
      <div id="t-top">
        <button class="t-top" data-code="KeyM">🗺️</button>
        <button class="t-top" data-code="KeyJ">📋</button>
        <button class="t-top" id="t-fs">⛶</button>
        <button class="t-top" data-code="Escape">⏸</button>
      </div>`;
    document.body.appendChild(el);
    this.el = el;
    this.knob = el.querySelector('#t-knob');
    this.stickEl = el.querySelector('#t-stick');

    const zone = el.querySelector('#t-zone');
    zone.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e));

    // key buttons: press on touch start, release on end
    el.querySelectorAll('[data-code]').forEach((b) => {
      const code = b.dataset.code;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.keys.add(code);
        this.input.pressed.add(code);
        b.classList.add('on');
        if (navigator.vibrate) navigator.vibrate(10);
      });
      const rel = () => { this.input.keys.delete(code); b.classList.remove('on'); };
      b.addEventListener('pointerup', rel);
      b.addEventListener('pointercancel', rel);
      b.addEventListener('pointerleave', rel);
    });
    const sprint = el.querySelector('#t-sprint');
    sprint.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.input.sprintToggle = !this.input.sprintToggle;
      sprint.classList.toggle('on', this.input.sprintToggle);
    });
    el.querySelector('#t-fs').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    });
    // the interaction prompt itself is tappable too
    document.getElementById('prompt').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.input.pressed.add('KeyE');
    });
  }

  show(v) { this.el.classList.toggle('hidden', !v); if (!v) this.reset(); }

  reset() {
    this.stick = null;
    this.looks.clear();
    this.pinch = null;
    this.input.axis.x = this.input.axis.y = 0;
    this.stickEl.style.display = 'none';
  }

  /** Label the action button with what E would do right now. */
  setAction(label, disabled) {
    const b = this.el.querySelector('#t-act');
    b.classList.toggle('ready', !!label && !disabled);
  }

  down(e) {
    e.preventDefault();
    const leftSide = e.clientX < window.innerWidth * 0.42;
    if (leftSide && !this.stick) {
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      this.stickEl.style.display = 'block';
      this.stickEl.style.left = `${e.clientX}px`;
      this.stickEl.style.top = `${e.clientY}px`;
      this.knob.style.transform = 'translate(-50%, -50%)';
    } else {
      this.looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.looks.size === 2) {
        const [a, b] = [...this.looks.values()];
        this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    }
  }

  move(e) {
    if (this.stick && e.pointerId === this.stick.id) {
      e.preventDefault();
      const R = 55;
      let dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const dead = 0.12;
      const m = Math.min(1, d / R);
      const k = m < dead ? 0 : (m - dead) / (1 - dead) / (m || 1);
      this.input.axis.x = (dx / R) * k * (d > R ? 1 : 1);
      this.input.axis.y = (dy / R) * k;
      return;
    }
    const l = this.looks.get(e.pointerId);
    if (!l) return;
    e.preventDefault();
    if (this.looks.size === 2 && this.pinch) {
      l.x = e.clientX; l.y = e.clientY;
      const [a, b] = [...this.looks.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const diff = this.pinch - dist;
      if (Math.abs(diff) > 12) { this.input.wheel += Math.sign(diff); this.pinch = dist; }
      return;
    }
    this.input.mouseDX += (e.clientX - l.x) * 1.6;
    this.input.mouseDY += (e.clientY - l.y) * 1.6;
    l.x = e.clientX; l.y = e.clientY;
  }

  up(e) {
    if (this.stick && e.pointerId === this.stick.id) {
      this.stick = null;
      this.input.axis.x = this.input.axis.y = 0;
      this.stickEl.style.display = 'none';
    }
    this.looks.delete(e.pointerId);
    if (this.looks.size < 2) this.pinch = null;
  }
}

export function portraitHint() {
  const d = document.createElement('div');
  d.id = 'rotate-hint';
  d.innerHTML = `<div>📱↻</div><p>${t('m.rotate')}</p><button class="btn">${t('m.anyway')}</button>`;
  d.querySelector('button').onclick = () => d.remove();
  document.body.appendChild(d);
}
