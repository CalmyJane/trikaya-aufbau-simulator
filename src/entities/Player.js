import * as THREE from 'three';
import { Character } from './Character.js';
import { PLAYER_LOOK } from './npcData.js';
import { WORLD_BOUNDS } from '../world/layout.js';
import { heightAt } from '../world/Height.js';

const WALK = 4.2, RUN = 9.5, GRAVITY = 24, JUMP = 8.5, RADIUS = 0.4;

export class Player {
  constructor(world, input) {
    this.world = world;
    this.input = input;
    this.char = new Character(PLAYER_LOOK);
    this.root = this.char.root;
    world.scene.add(this.root);
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.grounded = true;
    this.jumping = false;
    this.busy = 0;            // seconds of "working" lock (building animation)
    this.frozen = false;      // dialog / menus
    this.stamina = 1;
    this.carried = [];        // visual meshes of carried items
    this.moved = 0;           // distance travelled (footsteps)
    this.vehicle = null;
  }

  get position() { return this.vehicle ? this.vehicle.position : this.root.position; }

  /** New look (styling in the planetarium): swap the character model, keep position & heading. */
  setLook(look) {
    if (this.vehicle) return false;
    const old = this.char;
    const parent = old.root.parent;
    const c = new Character(look);
    c.root.position.copy(old.root.position);
    c.root.rotation.y = old.root.rotation.y;
    if (parent) { parent.remove(old.root); parent.add(c.root); }
    this.char = c;
    this.root = c.root;
    this.carried = [];
    return true;
  }
  get sprinting() { return this._sprint; }

  // ----------------------------------------------------------------- vehicles
  enter(vehicle) {
    this.vehicle = vehicle;
    vehicle.driver = this;
    this.world.scene.remove(this.root);
    vehicle.seat.add(this.root);
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.char.setSitting(!vehicle.standing);
    this.vel.set(0, 0, 0);
  }

  exit() {
    const v = this.vehicle;
    if (!v) return;
    v.seat.remove(this.root);
    this.world.scene.add(this.root);
    // step out to the left side
    const side = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.heading).multiplyScalar(v.o.width / 2 + 0.9);
    this.root.position.copy(v.position).add(side);
    this.world.colliders.resolve(this.root.position, RADIUS);
    this.root.position.y = heightAt(this.root.position.x, this.root.position.z);
    this.root.rotation.set(0, v.heading, 0);
    this.char.setSitting(false);
    v.driver = null;
    v.speed = 0;
    this.vehicle = null;
  }

  // ----------------------------------------------------------------- update
  update(dt, camYaw) {
    if (this.vehicle) {
      this.char.play('neutral');
      this.char.update(dt);
      return;
    }
    const inp = this.input;
    const move = new THREE.Vector3();
    if (!this.frozen && this.busy <= 0) {
      if (inp.down('KeyW', 'ArrowUp')) move.z -= 1;
      if (inp.down('KeyS', 'ArrowDown')) move.z += 1;
      if (inp.down('KeyA', 'ArrowLeft')) move.x -= 1;
      if (inp.down('KeyD', 'ArrowRight')) move.x += 1;
      move.x += inp.axis.x;
      move.z += inp.axis.y;
    }
    const stick = Math.hypot(inp.axis.x, inp.axis.y);
    const moving = move.lengthSq() > 0.01;
    const sprint = moving && (inp.down('ShiftLeft', 'ShiftRight') || inp.sprintToggle || stick > 0.95) && this.stamina > 0.02;
    this._sprint = sprint;
    if (moving) {
      const analog = stick > 0.05 && move.length() < 1.001 ? Math.max(0.35, Math.min(1, stick)) : 1;
      move.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);
      const load = this.carried.length ? 0.85 : 1;
      const speed = (sprint ? RUN : WALK * analog) * load * (this.speedMul || 1);
      this.vel.lerp(move.multiplyScalar(speed), Math.min(1, dt * 12));
      this.char.turnTo(Math.atan2(this.vel.x, this.vel.z), dt, 12);
    } else {
      this.vel.multiplyScalar(Math.max(0, 1 - dt * 14));
    }
    this.stamina = THREE.MathUtils.clamp(this.stamina + (sprint && !this.staminaFree ? -dt * 0.12 : dt * 0.2), 0, this.staminaMax || 1);

    const p = this.root.position;
    const ground = heightAt(p.x, p.z);
    if (inp.hit('Space') && this.grounded && !this.frozen && this.busy <= 0) {
      this.vy = JUMP * (this.jumpMul || 1);
      this.grounded = false;
      this.jumping = true;
    }
    this.vy -= GRAVITY * dt;
    const bx = p.x, bz = p.z;
    p.x += this.vel.x * dt;
    p.z += this.vel.z * dt;
    p.y += this.vy * dt;
    this.world.colliders.resolve(p, RADIUS, p.y - heightAt(p.x, p.z));
    p.x = THREE.MathUtils.clamp(p.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    p.z = THREE.MathUtils.clamp(p.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    const g2 = heightAt(p.x, p.z);
    if (p.y <= g2 || (this.grounded && p.y - g2 < 0.35)) { p.y = g2; this.vy = 0; this.grounded = true; this.jumping = false; }
    else this.grounded = false;
    void ground;
    this.moved += Math.hypot(p.x - bx, p.z - bz);

    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.busy > 0) {
      this.busy -= dt;
      this.char.play('interact', 0.15);
    } else if (this.char.currentName === 'wave' && this.waveTimer > 0) {
      this.waveTimer -= dt;
    } else if (hs > WALK * (this.speedMul || 1) + 0.8) this.char.play('run', 0.15);
    else if (hs > 0.4) this.char.play('walk', 0.15, { timeScale: (hs / WALK) * 1.1 });
    else this.char.play('idle', 0.25);

    this.carried.forEach((m, i) => {
      m.position.y = i * 0.45 + Math.sin(performance.now() / 180) * (hs > 0.5 ? 0.03 : 0);
    });
    this.char.update(dt);
  }

  wave() {
    this.char.play('wave', 0.2, { once: true });
    this.waveTimer = 1.6;
  }

  work(seconds) {
    this.busy = seconds;
    this.vel.set(0, 0, 0);
  }

  /** Show carried item meshes stacked in front of the chest. */
  setCarried(meshes) {
    for (const m of this.carried) this.char.carryAnchor.remove(m);
    this.carried = meshes;
    meshes.forEach((m, i) => {
      m.position.set(0, i * 0.45, 0);
      this.char.carryAnchor.add(m);
    });
  }

  /** Push the player away from a point (Sabse's kitchen justice). */
  shove(from, strength = 9) {
    const d = new THREE.Vector3().subVectors(this.root.position, from).setY(0).normalize();
    this.vel.copy(d.multiplyScalar(strength));
    this.vy = 4;
    this.grounded = false;
  }
}

/** Third-person orbit camera: mouse look (pointer lock), auto-follow behind the player, wall avoidance. */
export class CameraRig {
  constructor(camera, input, settings) {
    this.camera = camera;
    this.input = input;
    this.settings = settings;
    this.yaw = Math.PI * 0.85;
    this.pitch = 0.32;
    this.dist = 7.5;
    this.targetDist = 7.5;
    this.target = new THREE.Vector3();
    this.shake = 0;
    this.ray = new THREE.Raycaster();
    this.tmp = new THREE.Vector3();
    this.lastMouse = 0;
  }

  /**
   * @param focus     world position to look at
   * @param heading   facing of player/vehicle (for auto-follow)
   * @param moving    speed-ish factor 0..1 that scales auto-follow
   */
  update(dt, focus, { indoor = false, blockers, heading = null, moving = 0, vehicle = false } = {}) {
    const inp = this.input;
    const s = this.settings;
    const sens = (s?.sensitivity ?? 1) * 0.0028;
    if (inp.mouseDX || inp.mouseDY) this.lastMouse = performance.now();
    this.yaw -= inp.mouseDX * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch + inp.mouseDY * sens * 0.8 * (s?.invertY ? -1 : 1), -0.15, 1.25);
    if (inp.down('KeyQ')) { this.yaw += dt * 2.2; this.lastMouse = performance.now(); }
    if (inp.down('KeyR')) { this.yaw -= dt * 2.2; this.lastMouse = performance.now(); }

    // auto-follow: swing behind the player while moving (unless the mouse was used just now)
    const follow = s?.autoFollow !== false;
    if (follow && heading != null && moving > 0.05 && performance.now() - this.lastMouse > 900) {
      const behind = heading + Math.PI;
      let d = behind - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const rate = (vehicle ? 2.8 : 1.4) * moving;
      this.yaw += d * Math.min(1, dt * rate);
      if (vehicle) this.pitch += (0.3 - this.pitch) * Math.min(1, dt * 1.5);
    }

    this.targetDist = THREE.MathUtils.clamp(this.targetDist + inp.wheel * 0.9, 3, 22);
    const maxD = indoor ? 4.5 : (vehicle ? Math.max(this.targetDist, 9) : this.targetDist);
    const pitch = indoor ? Math.max(this.pitch, 0.75) : this.pitch;
    this.dist += (maxD - this.dist) * Math.min(1, dt * 6);

    this.target.lerp(this.tmp.set(focus.x, focus.y + (vehicle ? 2.2 : 1.6), focus.z), Math.min(1, dt * 14));
    const off = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(this.yaw) * Math.cos(pitch),
    ).multiplyScalar(this.dist);
    if (blockers?.length) {
      const dir = off.clone().normalize();
      this.ray.set(this.target, dir);
      this.ray.far = this.dist;
      const near = blockers.filter((o) => o.visible && o.getWorldPosition(this.tmp).distanceTo(this.target) < 40);
      const hit = this.ray.intersectObjects(near, true).find((h) => isVisible(h.object) && !h.object.userData.noBlock);
      if (hit) off.setLength(Math.max(1.2, hit.distance - 0.3));
    }
    this.camera.position.copy(this.target).add(off);
    const ground = focus.y;
    if (this.camera.position.y < ground + 0.4) this.camera.position.y = ground + 0.4;
    if (this.shake > 0) {
      this.shake -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4;
    }
    this.camera.lookAt(this.target);
  }

  get moveYaw() { return this.yaw; }
}

function isVisible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}
