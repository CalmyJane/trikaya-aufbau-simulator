import * as THREE from 'three';
import { heightAt } from '../world/Height.js';
import { P } from '../world/layout.js';

// Free "drone" camera for the main menu and the pause screen.
// Desktop: WASD / arrows fly, E / Q up & down, Shift fast, drag with the mouse to look, wheel = forward/back.
// Touch: one finger drags the map, two fingers pinch (zoom), twist (turn) and move up/down together (tilt).
// In the main menu it orbits the festival on its own until you touch something (and drifts back when left alone).

const LIMIT = 420;     // metres from the centre you may fly
const MAX_Y = 180;
const IDLE_ORBIT = 30; // seconds without input in the menu → back to the cinematic orbit
const ORBIT_C = P(360, 545);

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export class FlyCam {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = -0.4;
    this.orbiting = true;
    this.active = false; // takes pointer input only while true (menu / pause, no modal)
    this.idle = 0;
    this.lookDX = 0; this.lookDY = 0; this.wheel = 0;
    this.glide = new THREE.Vector3(); this.glideIn = new THREE.Vector3(); // touch swipe inertia (m/s)
    this.tween = null;
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this.bindPointer();
  }

  // ------------------------------------------------------------------ pointer (mouse drag + touch gestures)
  // Touch works like a map app: the ground sticks to your finger (and glides on when you let go),
  // pinch zooms towards the point between your fingers, twist turns, two fingers up/down tilt the view.
  bindPointer() {
    const pts = new Map();
    let last = null; // previous two-finger state
    let lastMove = 0;
    const blocked = (e) => !this.active || e.target.closest?.('button, a, input, select, .menu-panel, .modal-panel, #modal, #hud');
    const two = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };
    window.addEventListener('pointerdown', (e) => {
      if (blocked(e)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' });
      if (pts.size === 2) last = two();
      this.glide.set(0, 0, 0);
      this.idle = 0;
    });
    window.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const px = p.x, py = p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (!this.active) return;
      this.idle = 0;
      if (!p.touch) { this.lookDX += p.x - px; this.lookDY += p.y - py; return; }
      this.grab();
      if (pts.size >= 2) {
        const now = two();
        if (last) this.gesture(last, now);
        last = now;
      } else {
        const t = performance.now();
        const moved = this.panScreen(px, py, p.x, p.y);
        if (moved) {
          // remember the finger speed for the glide after release
          const dt = Math.max(8, t - lastMove) / 1000;
          this.glideIn.lerp(moved.divideScalar(dt), 0.5);
        }
        lastMove = t;
      }
      this.place();
    });
    const up = (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) last = null;
      // one finger let go after a swipe → keep gliding; a finger that rested first doesn't glide
      if (p.touch && pts.size === 0 && performance.now() - lastMove < 90) this.glide.copy(this.glideIn);
      this.glideIn.set(0, 0, 0);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('wheel', (e) => {
      if (blocked(e)) return;
      this.wheel += Math.sign(e.deltaY);
      this.idle = 0;
    }, { passive: true });
  }

  /** A touch takes over: stop the orbit / a running camera flight right where the camera is now. */
  grab() {
    if (this.orbiting || this.tween) {
      this.orbiting = false;
      this.tween = null;
      this.syncFromCamera();
    }
  }

  /** Put the real camera where the fly cam is (so the next touch event in this frame sees the new pose). */
  place() {
    this.clampPos();
    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.updateMatrixWorld();
  }

  clampPos() {
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > LIMIT) { this.pos.x *= LIMIT / r; this.pos.z *= LIMIT / r; }
    this.pos.y = THREE.MathUtils.clamp(this.pos.y, heightAt(this.pos.x, this.pos.z) + 1.5, MAX_Y);
  }

  /** The ground point under a screen position (null when looking at the sky / horizon). */
  groundAt(sx, sy, out = new THREE.Vector3()) {
    const cam = this.camera;
    out.set((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
    if (out.y > -0.04) return null;
    const t = Math.min(500, (0 - cam.position.y) / out.y);
    return out.multiplyScalar(t).add(cam.position);
  }

  /** One-finger drag: move so the ground point under the finger stays under the finger. Returns the move. */
  panScreen(x0, y0, x1, y1) {
    const a = this.groundAt(x0, y0, this._a ||= new THREE.Vector3());
    const b = this.groundAt(x1, y1, this._b ||= new THREE.Vector3());
    let mx, mz;
    if (a && b) { mx = a.x - b.x; mz = a.z - b.z; }
    else { // looking at the horizon: fall back to a height-scaled drag
      const m = 0.04 + Math.max(0, this.pos.y) * 0.0022;
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      const dx = x1 - x0, dy = y1 - y0;
      mx = (-cy * dx - sy * dy) * m; mz = (sy * dx - cy * dy) * m;
    }
    this.pos.x += mx; this.pos.z += mz;
    return new THREE.Vector3(mx, 0, mz);
  }

  /** Two fingers: pinch = zoom towards the point between them, twist = turn around it, both up/down = tilt. */
  gesture(last, now) {
    const pivot = this.groundAt(now.mx, now.my, this._p ||= new THREE.Vector3())
      || this._p.copy(this.pos).addScaledVector(this.camera.getWorldDirection(this._v), 60).setY(0);
    // zoom
    const f = THREE.MathUtils.clamp(last.d / Math.max(1, now.d), 0.75, 1.33);
    const off = this._v.copy(this.pos).sub(pivot);
    if (f < 1 && this.pos.y - heightAt(this.pos.x, this.pos.z) < 3) off.y = Math.max(off.y, off.y * f); // don't dig into the ground
    else off.y *= f;
    off.x *= f; off.z *= f;
    // twist
    let da = now.a - last.a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const c = Math.cos(da), s = Math.sin(da);
    const ox = off.x;
    off.x = ox * c + off.z * s; off.z = -ox * s + off.z * c;
    this.yaw += da;
    this.pos.copy(pivot).add(off);
    // tilt around the point in the middle of the screen
    const dy = now.my - last.my;
    if (dy) {
      this.place();
      const centre = this.groundAt(window.innerWidth / 2, window.innerHeight / 2, this._c ||= new THREE.Vector3());
      if (centre) {
        const v = this._v.copy(this.pos).sub(centre);
        const dist = v.length();
        const elev = THREE.MathUtils.clamp(Math.asin(v.y / dist) + dy * 0.006, 0.12, 1.5);
        const h = Math.hypot(v.x, v.z) || 1e-6;
        const k = Math.cos(elev) * dist / h;
        this.pos.set(centre.x + v.x * k, centre.y + Math.sin(elev) * dist, centre.z + v.z * k);
        this.pitch = -elev;
      } else this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.006, -1.45, 0.6);
    }
  }

  // ------------------------------------------------------------------ poses
  /** Take over wherever the real camera is right now. */
  syncFromCamera() {
    this.pos.copy(this.camera.position);
    const d = this.camera.getWorldDirection(this._v);
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    this.yaw = Math.atan2(-d.x, -d.z);
    this.vel.set(0, 0, 0);
  }

  lookAt(x, y, z) {
    const d = this._v.set(x - this.pos.x, y - this.pos.y, z - this.pos.z).normalize();
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    this.yaw = Math.atan2(-d.x, -d.z);
  }

  /** Cinematic circle around the festival ground & dragon (the old menu camera). */
  orbitPose(time) {
    const a = time * 0.04 + 2.2;
    this.pos.set(ORBIT_C.x + Math.cos(a) * 90, 36, ORBIT_C.z + Math.sin(a) * 90);
    this.lookAt(ORBIT_C.x, 4, ORBIT_C.z);
  }

  /** Drone view above `focus`, seen from the direction the player camera was looking (camYaw). */
  birdPose(focus, camYaw) {
    this.orbiting = false;
    this.vel.set(0, 0, 0);
    this.pos.set(focus.x + Math.sin(camYaw) * 30, focus.y + 42, focus.z + Math.cos(camYaw) * 30);
    this.lookAt(focus.x, focus.y, focus.z);
  }

  startOrbit() { this.orbiting = true; this.vel.set(0, 0, 0); }

  /** Where the camera looks at on the ground (for the sun / shadows). */
  focus(out = new THREE.Vector3()) {
    const d = this.camera.getWorldDirection(this._v);
    const p = this.camera.position;
    const t = d.y < -0.05 ? Math.min(160, p.y / -d.y) : 60;
    return out.set(p.x + d.x * t, 0, p.z + d.z * t);
  }

  // ------------------------------------------------------------------ fly
  /**
   * @param controls allow keyboard/mouse flying (false while a modal is open)
   * @param menu     main menu: orbit on its own, drift back to it when idle
   */
  update(dt, time, { controls = true, menu = false } = {}) {
    const inp = this.input;
    const k = (...c) => controls && inp.down(...c);
    const fwd = (k('KeyW', 'ArrowUp') ? 1 : 0) - (k('KeyS', 'ArrowDown') ? 1 : 0);
    const side = (k('KeyD', 'ArrowRight') ? 1 : 0) - (k('KeyA', 'ArrowLeft') ? 1 : 0);
    const lift = (k('KeyE', 'PageUp') ? 1 : 0) - (k('KeyQ', 'PageDown') ? 1 : 0);
    if (!controls) { this.lookDX = this.lookDY = this.wheel = 0; this.glide.set(0, 0, 0); }
    const touched = fwd || side || lift || this.lookDX || this.lookDY || this.wheel;

    if (touched) {
      this.idle = 0;
      if (this.orbiting) { this.orbiting = false; this.vel.set(0, 0, 0); }
    } else this.idle += dt;

    if (menu && !this.orbiting && this.idle > IDLE_ORBIT) {
      // drift back into the cinematic orbit
      this.startTween(this.camera, 4);
      this.startOrbit();
    }

    if (this.orbiting) {
      this.orbitPose(time);
    } else {
      // look
      const sens = 0.0042;
      this.yaw -= this.lookDX * sens;
      this.pitch = THREE.MathUtils.clamp(this.pitch - this.lookDY * sens, -1.45, 0.6);
      // speed grows with height so you can cross the site quickly from up high
      const ground = heightAt(this.pos.x, this.pos.z);
      const alt = Math.max(0, this.pos.y - ground);
      const speed = (12 + alt * 0.45) * (k('ShiftLeft', 'ShiftRight') ? 2.6 : 1);
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      const want = this._v.set(
        (-sy * fwd + cy * side) * speed,
        lift * speed * 0.7,
        (-cy * fwd - sy * side) * speed,
      );
      this.vel.lerp(want, Math.min(1, dt * 5));
      this.pos.addScaledVector(this.vel, dt);
      // wheel: dolly along the view direction
      if (this.wheel) {
        const d = this.camera.getWorldDirection(this._v);
        this.pos.addScaledVector(d, -this.wheel * (4 + alt * 0.12));
      }
      // touch: glide on after a swipe, slowing down
      if (this.glide.lengthSq() > 0.01) {
        this.pos.addScaledVector(this.glide, dt);
        this.glide.multiplyScalar(Math.exp(-dt * 3.2));
        this.idle = 0;
      } else this.glide.set(0, 0, 0);
      // stay above the ground, below the clouds, near the festival
      this.clampPos();
    }
    this.lookDX = this.lookDY = this.wheel = 0;

    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  // ------------------------------------------------------------------ camera flights
  /**
   * Fly the real camera from where it is now to wherever the active controller puts it.
   * The destination may keep moving (player walking, orbit turning) – apply() blends towards it every frame.
   */
  startTween(camera, dur = 1.5, arc = 0) {
    this.tween = { pos: camera.position.clone(), quat: camera.quaternion.clone(), t: 0, dur, arc };
  }

  /** Call after the controller has written this frame's camera pose. */
  apply(camera, dt) {
    const tw = this.tween;
    if (!tw) return;
    tw.t += dt;
    const k = ease(Math.min(1, tw.t / tw.dur));
    const lift = Math.sin(Math.PI * k) * tw.arc;
    camera.quaternion.copy(this._q.copy(tw.quat).slerp(camera.quaternion, k));
    camera.position.lerpVectors(tw.pos, camera.position, k);
    camera.position.y += lift;
    if (tw.t >= tw.dur) this.tween = null;
  }
}
