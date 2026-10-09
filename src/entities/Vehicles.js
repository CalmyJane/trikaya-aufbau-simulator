import * as THREE from 'three';
import { mat, box, cyl } from '../world/Props.js';
import { tiltAt } from '../world/Height.js';
import { WORLD_BOUNDS } from '../world/layout.js';

// Arcade vehicles. The player enters with E; W/S throttle, A/D steer, Space handbrake.

class Vehicle {
  constructor(world, opts) {
    this.world = world;
    this.o = opts;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // tilts with the terrain
    this.root.add(this.body);
    this.wheels = [];
    this.speed = 0;
    this.steer = 0;
    this.driver = null;
    this.odometer = 0;
    this.seat = new THREE.Group();
    this.body.add(this.seat);
    this.cargo = new THREE.Group();   // light items travel here while driving
    this.body.add(this.cargo);
    world.scene.add(this.root);
    // body = two circles (front/back) that match the footprint much better than one big circle
    const r = opts.bodyRadius || opts.radius;
    const off = opts.bodyOffset || 0;
    this.parts = [off, -off].map((z) => ({ z, r, c: world.colliders.addCircle(0, 0, r, 'vehicle') }));
  }

  get position() { return this.root.position; }
  get heading() { return this.root.rotation.y; }

  place(p, heading = 0) {
    this.root.position.set(p.x, 0, p.z);
    this.root.rotation.y = heading;
    this.syncCollider();
    this.settle(0);
  }

  syncCollider() {
    const sx = Math.sin(this.heading), sz = Math.cos(this.heading);
    for (const pt of this.parts) {
      pt.c.x = this.root.position.x + sx * pt.z;
      pt.c.z = this.root.position.z + sz * pt.z;
    }
  }

  /** How deep the footprint at (x, z, heading) sits inside other colliders (0 = free). */
  penetration(x, z, heading) {
    for (const pt of this.parts) pt.c.x = 1e6; // ignore own colliders
    const sx = Math.sin(heading), sz = Math.cos(heading);
    let worst = 0;
    for (const pt of this.parts) {
      const q = { x: x + sx * pt.z, z: z + sz * pt.z };
      const qx = q.x, qz = q.z;
      this.world.colliders.resolve(q, pt.r);
      worst = Math.max(worst, Math.hypot(q.x - qx, q.z - qz));
    }
    this.syncCollider();
    return worst;
  }

  /**
   * Something got built on top of us (or we got wedged in)? Move to the nearest free spot,
   * searching outwards and preferring the direction away from `from`.
   */
  unstick(from, minDepth = 0.35, area = null) {
    const p = this.position, h = this.heading;
    // area: footprint of a structure that was just built (x/z box) – standing inside it counts as stuck
    const inArea = (x, z) => area && x > area.min.x - 1.2 && x < area.max.x + 1.2 && z > area.min.z - 1.2 && z < area.max.z + 1.2;
    if (!inArea(p.x, p.z) && this.penetration(p.x, p.z, h) < minDepth) return false;
    const away = from ? Math.atan2(p.x - from.x, p.z - from.z) : h + Math.PI;
    for (let r = 1.5; r <= 45; r += 1.5) {
      for (let k = 0; k < 16; k++) {
        const a = away + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
        const x = p.x + Math.sin(a) * r, z = p.z + Math.cos(a) * r;
        if (!inArea(x, z) && this.penetration(x, z, h) === 0) {
          this.place({ x, z }, h);
          this.speed = 0;
          return true;
        }
      }
    }
    return false;
  }

  canDrive() { return true; }

  setCargo(meshes) {
    while (this.cargo.children.length) this.cargo.remove(this.cargo.children[0]);
    meshes.forEach((m, i) => { m.position.set(((i % 2) - 0.5) * 0.45 * (meshes.length > 1 ? 1 : 0), Math.floor(i / 2) * 0.35, 0); this.cargo.add(m); });
  }

  wheel(r, w, x, y, z, col = '#1d1d1d') {
    const g = new THREE.Group();
    const tyre = cyl(r, r, w, mat(col), 14);
    tyre.rotation.z = Math.PI / 2;
    g.add(tyre);
    const hub = cyl(r * 0.45, r * 0.45, w + 0.02, mat('#b0b0b0', { metalness: 0.6 }), 8);
    hub.rotation.z = Math.PI / 2;
    g.add(hub);
    // tread blocks so spinning is visible
    for (let i = 0; i < 8; i++) {
      const tb = box(w * 0.9, 0.05, r * 0.3, mat('#2a2a2a'));
      const a = (i / 8) * Math.PI * 2;
      tb.position.set(0, Math.cos(a) * r, Math.sin(a) * r);
      tb.rotation.x = -a;
      g.add(tb);
    }
    g.position.set(x, y, z);
    this.body.add(g);
    this.wheels.push({ g, r, front: z > 0 });
    return g;
  }

  update(dt, input) {
    const o = this.o;
    const driving = input && this.canDrive();
    let throttle = 0, steerIn = 0, brake = false;
    if (driving) {
      if (input.down('KeyW', 'ArrowUp')) throttle += 1;
      if (input.down('KeyS', 'ArrowDown')) throttle -= 1;
      if (input.down('KeyA', 'ArrowLeft')) steerIn += 1;
      if (input.down('KeyD', 'ArrowRight')) steerIn -= 1;
      if (Math.abs(input.axis.y) > 0.15) throttle += -input.axis.y;
      const soft = input.touch && this.id === 'quad'; // phone joystick: finer steering near the middle
      if (Math.abs(input.axis.x) > 0.15) {
        const x = -input.axis.x;
        steerIn += soft ? Math.sign(x) * Math.pow(Math.min(1, (Math.abs(x) - 0.15) / 0.85), 1.6) : x;
      }
      throttle = Math.max(-1, Math.min(1, throttle));
      // after a few beers the steering has a mind of its own
      if (this.wobble > 0 && Math.abs(this.speed) > 0.5) {
        this.wobT = (this.wobT || 0) + dt;
        steerIn += this.wobble * (Math.sin(this.wobT * 1.3) * 0.8 + Math.sin(this.wobT * 3.7 + 1) * 0.35);
      }
      steerIn = Math.max(-1, Math.min(1, steerIn));
      brake = input.down('Space');
      // Shift (or the touch sprint toggle): full throttle
      this.boosting = !!o.boost && throttle > 0 && (input.down('ShiftLeft', 'ShiftRight') || input.sprintToggle);
    } else this.boosting = false;
    this.throttle = throttle;
    const maxSp = o.maxSpeed * (this.boosting ? o.boost : 1);
    // longitudinal
    const sp0 = this.speed;
    if (throttle > 0) this.speed += (this.speed < 0 ? o.brake : o.accel * throttle * (this.boosting ? 1.3 : 1)) * dt;
    else if (throttle < 0) this.speed -= (this.speed > 0 ? o.brake : o.accel * 0.6 * -throttle) * dt;
    else this.speed *= Math.max(0, 1 - dt * o.drag);
    if (brake) this.speed *= Math.max(0, 1 - dt * 5);
    this.speed = Math.max(this.speed, -o.maxSpeed * 0.4);
    // above the cap (e.g. Shift released): roll back down smoothly instead of snapping
    if (this.speed > maxSp) this.speed = Math.max(maxSp, Math.min(this.speed, sp0 - 4 * dt));
    // steering
    const softSteer = input?.touch && this.id === 'quad';
    this.steer += (steerIn * o.maxSteer - this.steer) * Math.min(1, dt * (softSteer ? 4 : 6));
    // phone quad: still nimble when slow, a bit calmer at full speed
    const calm = softSteer ? 1 - 0.3 * Math.min(1, Math.abs(this.speed) / o.maxSpeed) : 1;
    const turn = this.steer * (this.speed / o.maxSpeed) * o.turnRate * calm * (Math.abs(this.speed) > 0.3 ? 1 : 0);
    this.root.rotation.y += turn * dt;
    // move
    const p = this.root.position;
    const bx = p.x, bz = p.z;
    p.x += Math.sin(this.heading) * this.speed * dt;
    p.z += Math.cos(this.heading) * this.speed * dt;
    for (const pt of this.parts) pt.c.x = 1e6; // ignore own colliders
    const px = p.x, pz = p.z;
    // resolve each body circle and move the vehicle by the push-out
    let hit = false;
    const sx = Math.sin(this.heading), sz = Math.cos(this.heading);
    for (let it = 0; it < 2; it++) {
      for (const pt of this.parts) {
        const q = { x: p.x + sx * pt.z, z: p.z + sz * pt.z };
        const qx = q.x, qz = q.z;
        if (this.world.colliders.resolve(q, pt.r)) { hit = true; p.x += q.x - qx; p.z += q.z - qz; }
      }
    }
    if (hit) {
      // push-out direction vs driving direction: slide along walls, only brake on head-on hits
      const nx = p.x - px, nz = p.z - pz;
      const nl = Math.hypot(nx, nz) || 1;
      const fx = Math.sin(this.heading) * Math.sign(this.speed || 1), fz = Math.cos(this.heading) * Math.sign(this.speed || 1);
      const headOn = Math.max(0, -(fx * nx + fz * nz) / nl);
      this.speed *= 1 - Math.min(0.9, headOn * 1.6 * dt * 10);
    }
    p.x = THREE.MathUtils.clamp(p.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    p.z = THREE.MathUtils.clamp(p.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    const moved = Math.hypot(p.x - bx, p.z - bz);
    this.odometer += moved;
    this.syncCollider();
    // bikes & scooters lean into the curve (positive steer = left turn = top tilts to +x)
    if (o.lean) this.leanZ = (this.leanZ || 0) + (-this.steer * Math.min(1, Math.abs(this.speed) / o.maxSpeed) * o.lean - (this.leanZ || 0)) * Math.min(1, dt * 5);
    this.settle(dt);
    if (this.steerer) this.steerer.rotation.y = this.steer * 0.8;
    // wheels
    for (const w of this.wheels) {
      w.spin = (w.spin || 0) + (this.speed * dt) / w.r;
      w.g.rotation.x = w.spin;
      if (w.front) w.g.rotation.y = this.steer * 0.8;
      w.g.rotation.order = 'YXZ';
    }
    return moved;
  }

  settle(dt) {
    const p = this.root.position;
    const t = tiltAt(p.x, p.z, this.heading, this.o.length, this.o.width);
    p.y = t.y;
    const k = dt ? Math.min(1, dt * 8) : 1;
    this.body.rotation.x += (t.pitch - this.body.rotation.x) * k;
    this.body.rotation.z += (-t.roll + (this.leanZ || 0) - this.body.rotation.z) * k;
  }

  /** Handlebar parts that turn with the front wheel, around a vertical axis through `pivot`. */
  makeSteerer(parts, pivot) {
    const g = new THREE.Group();
    g.position.copy(pivot);
    for (const m of parts) { m.position.sub(pivot); g.add(m); }
    this.body.add(g);
    this.steerer = g;
    return g;
  }

  /** Invisible anchor the rider's hands/feet reach for (see Character.ride). */
  anchor(parent, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; }

  get kmh() { return Math.abs(this.speed) * 3.6; }
}

// ------------------------------------------------------------------ Quad
export class Quad extends Vehicle {
  constructor(world) {
    super(world, { maxSpeed: 15, accel: 7, brake: 14, drag: 0.8, maxSteer: 1, turnRate: 1.9, radius: 1.1, bodyRadius: 0.62, bodyOffset: 0.45, length: 1.9, width: 1.1, boost: 1.4 });
    this.id = 'quad';
    this.name = { de: 'Quad', en: 'Quad' };
    const b = this.body;
    const red = mat('#c0392b', { roughness: 0.5 });
    b.add(box(0.8, 0.35, 1.5, red, 0, 0.62, 0));
    b.add(box(1.25, 0.08, 0.6, mat('#1d1d1d'), 0, 0.72, 0.62));   // front fender
    b.add(box(1.25, 0.08, 0.6, mat('#1d1d1d'), 0, 0.72, -0.62));  // rear fender
    b.add(box(0.5, 0.14, 0.7, mat('#222'), 0, 0.86, -0.2));       // seat
    b.add(box(0.7, 0.3, 0.4, red, 0, 0.9, 0.45));                // tank
    const bar = cyl(0.025, 0.025, 0.8, mat('#333'), 6, 0, 1.12, 0.62); // handlebar
    bar.rotation.z = Math.PI / 2;
    b.add(bar);
    b.add(cyl(0.03, 0.03, 0.35, mat('#333'), 6, 0, 0.98, 0.58));
    // racks
    const rack = mat('#555', { metalness: 0.5 });
    b.add(box(0.9, 0.04, 0.35, rack, 0, 0.95, 0.85));
    b.add(box(0.9, 0.04, 0.45, rack, 0, 0.95, -0.75));
    b.add(box(0.2, 0.1, 0.02, mat('#fff7cc', { emissive: '#fff2b0', emissiveIntensity: 0.4 }), 0.2, 0.75, 0.93));
    b.add(box(0.2, 0.1, 0.02, mat('#fff7cc', { emissive: '#fff2b0', emissiveIntensity: 0.4 }), -0.2, 0.75, 0.93));
    for (const [x, z] of [[0.55, 0.62], [-0.55, 0.62], [0.55, -0.62], [-0.55, -0.62]]) this.wheel(0.33, 0.3, x, 0.33, z);
    this.seat.position.set(0, 0.5, -0.22);   // character hips sit ~0.45 above the seat anchor
    this.cargo.position.set(0, 0.99, -0.78);
    this.broken = false;
    this.breakAt = 2000 + Math.random() * 1500;
    this.smoke = [];
  }

  canDrive() { return !this.broken; }

  update(dt, input) {
    const m = super.update(dt, input);
    if (!this.broken && this.odometer > this.breakAt) {
      this.broken = true;
      this.onBreak?.();
    }
    if (this.broken || this.smoke.length) this.puffSmoke(dt, this.broken); // after a repair the last puffs still fade out
    return m;
  }

  repair() {
    this.broken = false;
    this.odometer = 0;
    this.breakAt = 2000 + Math.random() * 1500;
  }

  puffSmoke(dt, emit = true) {
    this.smokeT = (this.smokeT || 0) - dt;
    if (emit && this.smokeT <= 0) {
      this.smokeT = 0.25;
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), new THREE.MeshBasicMaterial({ color: '#555', transparent: true, opacity: 0.6, depthWrite: false }));
      s.position.copy(this.root.position).add(new THREE.Vector3(0, 0.9, 0));
      this.world.scene.add(s);
      this.smoke.push({ s, t: 0 });
    }
    this.smoke = this.smoke.filter((p) => {
      p.t += dt;
      p.s.position.y += dt * 0.8;
      p.s.scale.setScalar(1 + p.t * 2);
      p.s.material.opacity = Math.max(0, 0.6 - p.t * 0.3);
      if (p.t > 2) { this.world.scene.remove(p.s); p.s.geometry.dispose(); p.s.material.dispose(); return false; }
      return true;
    });
  }
}

// ------------------------------------------------------------------ Radlader (wheel loader)
export class Radlader extends Vehicle {
  constructor(world) {
    super(world, { maxSpeed: 6.5, accel: 3, brake: 8, drag: 1.2, maxSteer: 1, turnRate: 1.1, radius: 2.1, bodyRadius: 1.2, bodyOffset: 1.25, length: 4.2, width: 2.2, boost: 1.35 });
    this.id = 'radlader';
    this.name = { de: 'Radlader', en: 'Wheel loader' };
    const b = this.body;
    const yellow = mat('#f2b319', { roughness: 0.55 });
    const dark = mat('#2b2b2b');
    b.add(box(1.8, 1.1, 2.2, yellow, 0, 1.25, -1.0));   // engine / rear
    b.add(box(1.4, 0.7, 1.6, yellow, 0, 1.0, 1.0));     // front frame
    b.add(box(1.9, 0.12, 2.3, dark, 0, 1.85, -1.0));
    // cabin
    const glass = new THREE.MeshStandardMaterial({ color: '#9fd3f0', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.45 });
    b.add(box(1.5, 1.3, 1.3, glass, 0, 2.55, -0.55));
    b.add(box(1.6, 0.1, 1.4, yellow, 0, 3.25, -0.55));
    for (const [x, z] of [[0.72, 0.08], [-0.72, 0.08], [0.72, -1.18], [-0.72, -1.18]]) b.add(box(0.08, 1.3, 0.08, dark, x, 2.55, z));
    const beacon = cyl(0.1, 0.12, 0.18, mat('#ff8c1a', { emissive: '#ff6a00', emissiveIntensity: 0.8 }), 8, 0.5, 3.4, -0.9);
    b.add(beacon);
    this.beacon = beacon;
    b.add(cyl(0.07, 0.07, 0.8, dark, 6, -0.6, 2.2, -1.8)); // exhaust
    b.add(box(1.7, 0.4, 0.15, dark, 0, 0.9, -2.15));      // counterweight
    // loader arm (pivot at the front of the cabin)
    this.arm = new THREE.Group();
    this.arm.position.set(0, 1.7, 0.2);
    b.add(this.arm);
    for (const x of [0.55, -0.55]) {
      const boom = box(0.16, 0.22, 2.6, yellow, x, 0, 1.3);
      this.arm.add(boom);
    }
    this.bucket = new THREE.Group();
    this.bucket.position.set(0, 0, 2.6);
    this.arm.add(this.bucket);
    const bk = mat('#3a3a3a', { metalness: 0.4 });
    this.bucket.add(box(2.2, 0.08, 1.0, bk, 0, -0.55, 0.45));   // floor
    this.bucket.add(box(2.2, 1.0, 0.08, bk, 0, -0.1, -0.02));    // back
    for (const x of [1.08, -1.08]) this.bucket.add(box(0.06, 0.7, 1.0, bk, x, -0.25, 0.45));
    this.loadAnchor = new THREE.Group();
    this.loadAnchor.position.set(0, -0.45, 0.45);
    this.bucket.add(this.loadAnchor);
    for (const [x, z] of [[1.0, 1.0], [-1.0, 1.0], [1.0, -1.3], [-1.0, -1.3]]) this.wheel(0.75, 0.55, x, 0.75, z, '#202020');
    this.seat.position.set(0, 1.78, -0.6);
    this.body.remove(this.cargo);
    this.loadAnchor.add(this.cargo);
    this.cargo.position.set(0, 0.05, 0.1);
    this.fuel = 0;                // litres-ish 0..1
    this.armTarget = -0.35;       // radians: negative = raised
    this.arm.rotation.x = -0.35;
    this.load = [];               // item ids in the bucket
  }

  canDrive() { return this.fuel > 0; }

  update(dt, input) {
    const m = super.update(dt, input);
    if (input && this.fuel > 0) this.fuel = Math.max(0, this.fuel - m / 3000);
    this.arm.rotation.x += (this.armTarget - this.arm.rotation.x) * Math.min(1, dt * 2.5);
    this.bucket.rotation.x = -this.arm.rotation.x * 0.9; // keep the bucket level
    if (this.fuel > 0 && input) this.beacon.rotation.y += dt * 8;
    return m;
  }

  setLoad(meshes) {
    [...this.loadAnchor.children].filter((c) => c !== this.cargo).forEach((c) => this.loadAnchor.remove(c));
    meshes.forEach((m, i) => { m.position.set((i - (meshes.length - 1) / 2) * 0.9, 0, 0); m.scale.multiplyScalar(1.4); this.loadAnchor.add(m); });
  }

  /** World position right in front of the bucket (for pick-up / drop-off checks). */
  bucketTip() {
    return new THREE.Vector3(0, 0, 4.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading).add(this.root.position);
  }

  dip(then) {
    this.armTarget = 0.35;
    setTimeout(() => { this.armTarget = -0.35; then?.(); }, 700);
  }
}

// ------------------------------------------------------------------ Franzi's bike (with a witch's broom strapped on)
export class Bike extends Vehicle {
  constructor(world) {
    super(world, { maxSpeed: 10.5, accel: 6.8, brake: 12, drag: 1.1, maxSteer: 1, turnRate: 2.4, lean: 0.32, radius: 0.7, bodyRadius: 0.32, bodyOffset: 0.4, length: 1.7, width: 0.55, boost: 1.25 });
    this.id = 'bike';
    this.name = { de: 'Franzis Hexenrad', en: 'Franzi\'s witch bike' };
    this.quiet = true; // no engine, no horn, doesn't run people over
    const b = this.body;
    const frame = mat('#3aa0a0', { roughness: 0.5 });
    const dark = mat('#222');
    // frame: top tube, down tube, seat tube, forks
    const tube = (len, x, y, z, rx, m = frame) => { const c = cyl(0.025, 0.025, len, m, 6, x, y, z); c.rotation.x = rx; b.add(c); return c; };
    tube(0.75, 0, 0.78, 0.05, Math.PI / 2);          // top tube
    tube(0.8, 0, 0.58, 0.22, Math.PI / 2 + 0.75);     // down tube
    tube(0.5, 0, 0.6, -0.2, 0.25);                     // seat tube
    const fork = tube(0.6, 0, 0.55, 0.5, -0.3, dark);  // fork
    tube(0.45, 0, 0.42, -0.38, Math.PI / 2 - 0.9, dark); // chain stay
    b.add(box(0.14, 0.05, 0.24, dark, 0, 0.86, -0.25)); // saddle
    const bar = cyl(0.02, 0.02, 0.55, dark, 6, 0, 0.98, 0.42);
    bar.rotation.z = Math.PI / 2;
    const stem = cyl(0.02, 0.02, 0.2, dark, 6, 0, 0.9, 0.44);
    const st = this.makeSteerer([fork, bar, stem], new THREE.Vector3(0, 0.9, 0.46));
    // rider anchors: hands on the grips, feet on the pedals
    // swept-back city-bike grips, so the hands reach them
    this.grips = [1, -1].map((s) => {
      const g = cyl(0.022, 0.022, 0.22, dark, 6, s * 0.25, 0.08, -0.1);
      g.rotation.x = Math.PI / 2;
      st.add(g);
      return this.anchor(st, s * 0.25, 0.08, -0.19);
    });
    // crank: two arms with pedals, turning while you pedal
    this.crank = new THREE.Group();
    this.crank.position.set(0, 0.36, 0.02);
    b.add(this.crank);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 4, 14), dark); // chainring
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-0.05, 0.36, 0.02);
    b.add(ring);
    this.pedals = [1, -1].map((s) => {
      const arm = new THREE.Group();
      arm.rotation.x = s > 0 ? 0 : Math.PI;
      arm.add(box(0.02, 0.16, 0.03, mat('#9a9a9a', { metalness: 0.6 }), s * 0.07, -0.08, 0));
      arm.add(box(0.09, 0.025, 0.06, dark, s * 0.11, -0.16, 0));
      this.crank.add(arm);
      return this.anchor(arm, s * 0.1, -0.15, 0);
    });
    this.pedalT = 0;
    // the witch's broom, strapped on horizontally along the bike
    const broom = new THREE.Group();
    const stick = cyl(0.025, 0.03, 1.7, mat('#7a5230', { roughness: 1 }), 6);
    stick.rotation.x = Math.PI / 2;
    broom.add(stick);
    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8), mat('#c8a050', { roughness: 1 }));
    bristles.rotation.x = Math.PI / 2;
    bristles.position.z = -1.0;
    broom.add(bristles);
    broom.position.set(0, 0.72, 0.05); // centred, strapped under the top tube
    b.add(broom);
    for (const z of [0.55, -0.55]) this.spokeWheel(0.34, 0, 0.34, z);
    this.seat.position.set(0, 0.45, -0.3);
    this.cargo.position.set(0, 1.02, 0.66);
    this.ghost = false; // true while Franzi rides it (no collider in her way)
  }

  update(dt, input) {
    const moved = super.update(dt, input);
    // pedal while accelerating, freewheel when rolling; Franzi pedals all the way to the emergency
    if (this.ghost) this.pedalT += dt * 6;
    else if (this.speed > 0.3 && this.throttle > 0) this.pedalT += dt * (2 + this.speed * 0.45);
    this.crank.rotation.x = this.pedalT;
    return moved;
  }

  /** Thin bicycle wheel: tyre ring + spokes (spins like the others). */
  spokeWheel(r, x, y, z) {
    const g = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 6, 20), mat('#1d1d1d'));
    tyre.rotation.y = Math.PI / 2;
    g.add(tyre);
    const sm = mat('#b0b0b0', { metalness: 0.6 });
    for (let i = 0; i < 6; i++) {
      const s = cyl(0.006, 0.006, r * 2, sm, 4);
      s.rotation.x = (i / 6) * Math.PI;
      g.add(s);
    }
    g.position.set(x, y, z);
    this.body.add(g);
    this.wheels.push({ g, r, front: z > 0 });
  }

  syncCollider() {
    if (this.ghost) { for (const pt of this.parts) pt.c.x = 1e6; return; }
    super.syncCollider();
  }
}

// ------------------------------------------------------------------ Fabi's e-scooter (you ride it standing)
export class Scooter extends Vehicle {
  constructor(world) {
    super(world, { maxSpeed: 11, accel: 5.5, brake: 12, drag: 1.1, maxSteer: 1, turnRate: 2.6, lean: 0.26, radius: 0.6, bodyRadius: 0.3, bodyOffset: 0.3, length: 1.2, width: 0.5, boost: 1.2 });
    this.id = 'scooter';
    this.name = { de: 'Fabis E-Scooter', en: 'Fabi\'s e-scooter' };
    this.quiet = true;
    this.standing = true; // the rider stands on the deck
    const b = this.body;
    const dark = mat('#1e1e1e', { roughness: 0.6 });
    const grey = mat('#5a5f66', { metalness: 0.5, roughness: 0.4 });
    b.add(box(0.2, 0.06, 0.85, dark, 0, 0.14, -0.05));                                 // deck
    b.add(box(0.16, 0.012, 0.6, mat('#3a3a3a', { roughness: 1 }), 0, 0.176, -0.08));   // grip tape
    b.add(box(0.06, 0.05, 0.16, mat('#ff8a2a', { emissive: '#ff6a00', emissiveIntensity: 0.4 }), 0, 0.2, -0.5)); // rear light
    const stem = cyl(0.03, 0.03, 1.0, grey, 8, 0, 0.62, 0.42);
    stem.rotation.x = -0.12;
    const bar = cyl(0.022, 0.022, 0.5, dark, 6, 0, 1.1, 0.36);
    bar.rotation.z = Math.PI / 2;
    const steer = [stem, bar];
    for (const x of [0.24, -0.24]) {
      const grip = cyl(0.03, 0.03, 0.1, mat('#2a2a2a'), 6, x, 1.1, 0.36);
      grip.rotation.z = Math.PI / 2;
      steer.push(grip);
    }
    steer.push(box(0.08, 0.06, 0.04, mat('#f5f0d0', { emissive: '#fff4c0', emissiveIntensity: 0.6 }), 0, 0.92, 0.47)); // headlight
    steer.push(box(0.07, 0.02, 0.05, mat('#7fd0ff', { emissive: '#3a9aff', emissiveIntensity: 0.5 }), 0, 1.12, 0.33));  // little display
    const st = this.makeSteerer(steer, new THREE.Vector3(0, 0.6, 0.42));
    this.grips = [this.anchor(st, 0.22, 0.5, -0.06), this.anchor(st, -0.22, 0.5, -0.06)];
    // feet on the deck, one in front of the other
    this.pedals = [this.anchor(b, 0.05, 0.19, 0.12), this.anchor(b, -0.06, 0.19, -0.26)];
    this.wheel(0.11, 0.06, 0, 0.11, 0.5);
    this.wheel(0.11, 0.06, 0, 0.11, -0.45);
    this.seat.position.set(0, 0.17, -0.12);
    this.cargo.position.set(0, 0.95, 0.5);
  }
}
