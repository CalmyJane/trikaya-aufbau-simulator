// Keyboard + mouse input with pointer lock for camera control.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed this frame
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.dragging = false;
    this.enabled = false;
    // analog stick (touch joystick): x right, y down, length 0..1
    this.axis = { x: 0, y: 0 };
    this.touch = matchMedia('(pointer: coarse)').matches; // phones & tablets, not touch laptops
    this.sprintToggle = false;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['Space', 'Tab'].includes(e.code) && this.enabled) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (e.button === 0 && document.pointerLockElement !== canvas) {
        this.lock();
      }
      if (e.button === 2) this.dragging = true;
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 2) this.dragging = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (document.pointerLockElement === canvas || this.dragging) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    canvas.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
  }

  /** Request pointer lock; browsers may reject (e.g. right after Esc), which is harmless. */
  lock() {
    if (this.touch) return; // no pointer lock on phones
    try {
      const r = this.canvas.requestPointerLock?.();
      if (r && r.catch) r.catch(() => {});
    } catch { /* ignore */ }
  }

  get locked() { return document.pointerLockElement === this.canvas; }
  unlock() { if (this.locked) document.exitPointerLock(); }

  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  hit(...codes) { return codes.some((c) => this.pressed.has(c)); }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }
}
