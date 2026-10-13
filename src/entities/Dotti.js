import * as THREE from 'three';
import { heightAt } from '../world/Height.js';
import { mat, box, cyl, nameTag } from '../world/Props.js';

// Dotti: Kobold's dog – small, short brown fur, pointed snout. Very much her own dog: she trots around
// somewhere near him on the festival ground and now and then runs off to play with the chickens and the cats of the crew base.

/** Small dog, head towards +z. userData: head, tail (pivot), legs. */
function dog() {
  const g = new THREE.Group();
  const fur = mat('#8a5a2e', { roughness: 0.9 }), dark = mat('#1c1512');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), fur);
  body.scale.set(1, 0.95, 2.1);
  body.position.y = 0.25;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0, 0.37, 0.26);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), fur));
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.17, 6), fur); // the pointed snout
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.02, 0.13);
  head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 6, 4), dark);
  nose.position.set(0, -0.02, 0.215);
  head.add(nose);
  for (const x of [-0.05, 0.05]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 4), fur);
    ear.position.set(x, 0.09, -0.01);
    ear.rotation.z = -x * 4;
    head.add(ear);
    head.add(box(0.02, 0.02, 0.01, dark, x * 0.7, 0.025, 0.075));
  }
  g.add(head);
  const legs = [];
  for (const x of [-0.065, 0.065]) for (const z of [-0.16, 0.16]) {
    const l = box(0.04, 0.2, 0.04, fur, x, 0.1, z);
    g.add(l);
    legs.push(l);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.29, -0.23);
  tail.add(cyl(0.01, 0.02, 0.22, fur, 5, 0, 0.11, 0));
  tail.rotation.x = -0.7;
  g.add(tail);
  Object.assign(g.userData, { head, tail, legs });
  return g;
}

export function addDotti(game) {
  const { world, npcs } = game;
  const kobold = npcs.get('kobold');
  if (!kobold) return null;
  const obj = dog();
  obj.name = 'dotti';
  obj.add(nameTag('Dotti', 0.66));
  obj.position.copy(kobold.position);
  obj.position.x += 2;
  world.scene.add(obj);

  const rand = (a, b) => a + Math.random() * (b - a);
  const tmp = new THREE.Vector3();
  const s = { obj, path: [], wait: 1, mode: 'roam', friend: null, playT: 0, dir: 1, ang: 0, voice: 3, speed: 2.6 };

  const route = (goal) => {
    const nav = world.nav, p = obj.position;
    if (nav.blockedAt(goal.x, goal.z)) return [];
    return nav.lineClear(p, goal) ? [goal] : nav.findPath(p, goal, 400000) || [];
  };
  const pick = () => {
    const p = obj.position, friends = world.animals || [];
    if (friends.length) { // off to play – rarely when it is a long run from the festival ground
      const f = friends[Math.floor(Math.random() * friends.length)];
      f.obj.getWorldPosition(tmp);
      const d = Math.hypot(tmp.x - p.x, tmp.z - p.z);
      if (d < 420 && Math.random() < (d < 60 ? 0.3 : 0.015)) {
        s.path = route({ x: tmp.x, z: tmp.z });
        if (s.path.length) { s.mode = 'goplay'; s.friend = f; s.speed = 4.6; return; }
      }
    }
    const k = kobold.position, a = rand(0, 6.28), r = rand(3, 18);
    s.path = route({ x: k.x + Math.cos(a) * r, z: k.z + Math.sin(a) * r });
    s.mode = 'roam';
    s.speed = Math.hypot(k.x - p.x, k.z - p.z) > 28 ? 4.6 : 2.6; // far away: run back
  };

  world.animated.push((t, dt, playerPos) => {
    obj.visible = !kobold.hidden;
    const p = obj.position, u = obj.userData;
    let moving = false, hop = 0;
    const walk = (tx, tz, speed) => {
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.15) return true;
      const step = Math.min(d, speed * dt);
      p.x += (dx / d) * step; p.z += (dz / d) * step;
      const da = Math.atan2(dx, dz) - obj.rotation.y;
      obj.rotation.y += Math.atan2(Math.sin(da), Math.cos(da)) * Math.min(1, dt * 10);
      moving = true;
      return false;
    };

    if (s.mode === 'play') {
      // runs circles around her friend, hopping
      s.friend.obj.getWorldPosition(tmp);
      s.ang += s.dir * dt * 3.2;
      const ox = tmp.x + Math.cos(s.ang) * 1.1, oz = tmp.z + Math.sin(s.ang) * 1.1;
      if (world.colliders.hits(ox, oz, 0.15)) s.dir = -s.dir; // something in the way: turn round
      else walk(ox, oz, 4.2);
      hop = Math.abs(Math.sin(t * 9)) * 0.09;
      if ((s.playT -= dt) <= 0) { s.mode = 'roam'; s.wait = rand(0.5, 2); s.path = []; }
    } else if (s.path.length) {
      if (walk(s.path[0].x, s.path[0].z, s.speed)) {
        s.path.shift();
        if (!s.path.length) {
          if (s.mode === 'goplay') {
            s.friend.obj.getWorldPosition(tmp);
            if (Math.hypot(tmp.x - p.x, tmp.z - p.z) < 6) {
              s.mode = 'play'; s.playT = rand(7, 14); s.ang = Math.atan2(p.z - tmp.z, p.x - tmp.x);
              s.friend.wait = 0; // the friend gets going
            } else s.mode = 'roam';
          }
          s.wait = rand(1, 5);
        }
      }
    } else if ((s.wait -= dt) <= 0) {
      pick();
      if (!s.path.length) s.wait = 1;
    }

    p.y = heightAt(p.x, p.z) + hop;
    const run = s.mode === 'play' || s.speed > 3;
    u.legs.forEach((l, k) => { l.rotation.x = moving ? Math.sin(t * (run ? 18 : 12) + (k % 3 ? Math.PI : 0)) * 0.7 : 0; });
    u.head.rotation.x = moving ? 0 : 0.5 + Math.sin(t * 6) * 0.08; // sniffing when she stands
    u.tail.rotation.z = Math.sin(t * (s.mode === 'play' ? 16 : 7)) * 0.5;

    if ((s.voice -= dt) <= 0) {
      s.voice = s.mode === 'play' ? rand(1.5, 4) : rand(8, 22);
      const d = playerPos && obj.visible ? Math.hypot(p.x - playerPos.x, p.z - playerPos.z) : 1e9;
      if (d < 14) world.audio?.bark(1 - d / 16);
    }
  });
  return s;
}
