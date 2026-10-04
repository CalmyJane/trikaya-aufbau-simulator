import * as THREE from 'three';
import { heightAt } from '../world/Height.js';
import { P } from '../world/layout.js';

// Free "drone" camera for the main menu and the pause screen.
// Desktop: WASD / arrows fly, E / Q up & down, Shift fast, drag with the mouse to look, wheel = forward/back.
// Touch: one finger drags the map, two fingers pinch (height) and twist (turn).
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
    this.panX = 0; this.panY = 0; this.pinch = 0; this.twist = 0;
    this.tween = null;
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this.bindPointer();
  }

  // ------------------------------------------------------------------ pointer (mouse drag + touch gestures)
  bindPointer() {
    const pts = new Map();
    let last = null; // previous two-finger state {d, a}
    const blocked = (e) => !this.active || e.target.closest?.('button, a, input, select, .menu-panel, .modal-panel, #modal, #hud');
    const two = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x) };
    };
    window.addEventListener('pointerdown', (e) => {
      if (blocked(e)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' });
      if (pts.size === 2) last = two();
      this.idle = 0;
    });
    window.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (!this.active) return;
      if (pts.size >= 2) {
        const now = two();
        if (last) {
          this.pinch += now.d - last.d;
          let da = now.a - last.a;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          this.twist += da;
        }
        last = now;
      } else if (p.touch) { this.panX += dx; this.panY += dy; }
      else { this.lookDX += dx; this.lookDY += dy; }
      this.idle = 0;
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) last = null; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('wheel', (e) => {
      if (blocked(e)) return;
      this.wheel += Math.sign(e.deltaY);
      this.idle = 0;
    }, { passive: true });
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
    if (!controls) { this.lookDX = this.lookDY = this.wheel = this.panX = this.panY = this.pinch = this.twist = 0; }
    const touched = fwd || side || lift || this.lookDX || this.lookDY || this.wheel || this.panX || this.panY || this.pinch || this.twist;

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
      this.yaw += this.twist;
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
      // touch: drag the map under the finger, pinch for height
      if (this.panX || this.panY) {
        const m = (0.04 + alt * 0.0022);
        this.pos.x += (-cy * this.panX - sy * this.panY) * m;
        this.pos.z += (sy * this.panX - cy * this.panY) * m;
      }
      if (this.pinch) this.pos.y -= this.pinch * (0.05 + alt * 0.004);
      // stay above the ground, below the clouds, near the festival
      const r = Math.hypot(this.pos.x, this.pos.z);
      if (r > LIMIT) { this.pos.x *= LIMIT / r; this.pos.z *= LIMIT / r; }
      this.pos.y = THREE.MathUtils.clamp(this.pos.y, heightAt(this.pos.x, this.pos.z) + 1.5, MAX_Y);
    }
    this.lookDX = this.lookDY = this.wheel = this.panX = this.panY = this.pinch = this.twist = 0;

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
