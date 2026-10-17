import * as THREE from 'three';
import { heightAt } from '../world/Height.js';
import { mat, box, cyl, nameTag } from '../world/Props.js';

// Micka: Ronja's border collie – black with a white blaze, chest, paws and tail tip. She walks at heel and never
// leaves Ronja's side; only when another animal is right next to the way does she dash over for a quick round of play.

/** Border collie, head towards +z. userData: head, tail (pivot), legs, body. */
function collie() {
  const g = new THREE.Group();
  const fur = mat('#17151a', { roughness: 0.95 }), white = mat('#f1eee6', { roughness: 0.95 }), dark = mat('#0a0908');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7), fur);
  body.scale.set(1, 1, 2.1);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), white); // white bib
  chest.scale.set(1, 1.15, 0.9);
  chest.position.set(0, 0.37, 0.27);
  g.add(chest);
  const head = new THREE.Group();
  head.position.set(0, 0.6, 0.4);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 9, 7), fur));
  const snout = box(0.09, 0.08, 0.15, white, 0, -0.03, 0.14);
  head.add(snout);
  head.add(box(0.035, 0.1, 0.1, white, 0, 0.05, 0.065)); // blaze between the eyes
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 4), dark);
  nose.position.set(0, -0.01, 0.22);
  head.add(nose);
  for (const x of [-0.075, 0.075]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 4), fur); // half-pricked ears, tips tipping over
    ear.position.set(x, 0.1, -0.03);
    ear.rotation.set(0.5, 0, -x * 6);
    head.add(ear);
    head.add(box(0.022, 0.022, 0.01, mat('#6a4a22'), x * 0.62, 0.03, 0.098));
  }
  g.add(head);
  const legs = [];
  for (const x of [-0.09, 0.09]) for (const z of [-0.24, 0.24]) {
    const l = new THREE.Group();
    l.position.set(x, 0.3, z);
    l.add(box(0.055, 0.2, 0.055, fur, 0, -0.1, 0));
    l.add(box(0.06, 0.11, 0.06, white, 0, -0.245, 0)); // white socks
    g.add(l);
    legs.push(l);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.45, -0.33);
  tail.add(cyl(0.035, 0.045, 0.24, fur, 6, 0, 0.12, 0));
  tail.add(cyl(0.012, 0.035, 0.1, white, 6, 0, 0.28, 0));
  tail.rotation.x = -1.9; // bushy tail hanging low
  g.add(tail);
  Object.assign(g.userData, { head, tail, legs, body });
  return g;
}

export function addMicka(game) {
  const { world, npcs } = game;
  const ronja = npcs.get('ronja');
  if (!ronja) return null;
  const obj = collie();
  obj.name = 'micka';
  obj.add(nameTag('Micka', 0.98));
  obj.position.copy(ronja.position);
  obj.position.x += 0.7;
  world.scene.add(obj);

  const rand = (a, b) => a + Math.random() * (b - a);
  const tmp = new THREE.Vector3();
  const s = { obj, mode: 'heel', friend: null, playT: 0, look: rand(4, 9), dir: 1, ang: 0, voice: 5, path: [], plan: 0, wait: 0, kind: 'dog', name: 'Micka', petT: 0 };
  const friends = () => (game.dotti ? [...(world.animals || []), game.dotti] : world.animals || []);

  world.animated.push((t, dt, playerPos) => {
    obj.visible = !ronja.hidden;
    const p = obj.position, u = obj.userData, r = ronja.position;
    let moving = false, hop = 0, speed = 0;
    const walk = (tx, tz, sp) => {
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.12) return true;
      const step = Math.min(d, sp * dt);
      p.x += (dx / d) * step; p.z += (dz / d) * step;
      const da = Math.atan2(dx, dz) - obj.rotation.y;
      obj.rotation.y += Math.atan2(Math.sin(da), Math.cos(da)) * Math.min(1, dt * 10);
      moving = true; speed = sp;
      return false;
    };
    const dR = Math.hypot(r.x - p.x, r.z - p.z);
    if (dR > 45) { p.set(r.x + 0.7, 0, r.z); s.mode = 'heel'; s.path = []; } // Ronja was moved somewhere else

    if (s.petT > 0) s.petT -= dt; // being petted: stands still and wags
    else if (s.mode === 'play') {
      // a quick round around the other animal, hopping – then straight back to Ronja
      s.friend.obj.getWorldPosition(tmp);
      s.ang += s.dir * dt * 3.4;
      const ox = tmp.x + Math.cos(s.ang) * 1.3, oz = tmp.z + Math.sin(s.ang) * 1.3;
      if (world.colliders.hits(ox, oz, 0.2)) s.dir = -s.dir;
      else walk(ox, oz, 4.6);
      hop = Math.abs(Math.sin(t * 9)) * 0.1;
      if ((s.playT -= dt) <= 0 || dR > 13) { s.mode = 'heel'; s.look = rand(10, 25); s.path = []; s.plan = 0; }
    } else {
      // at heel: half a step to Ronja's left, a little behind her
      const h = ronja.root.rotation.y, fx = Math.sin(h), fz = Math.cos(h);
      let tx = r.x + fz * 0.6 - fx * 0.25, tz = r.z - fx * 0.6 - fz * 0.25;
      if (world.colliders.hits(tx, tz, 0.2)) { tx = r.x - fx * 0.5; tz = r.z - fz * 0.5; }
      const d = Math.hypot(tx - p.x, tz - p.z);
      if (d > 3.5) { // fell behind (after playing): run back, around whatever stands in the way
        if ((s.plan -= dt) <= 0) {
          s.plan = 0.8;
          const nav = world.nav, goal = { x: r.x, z: r.z };
          s.path = nav.lineClear(p, goal) ? [] : nav.findPath(p, goal, 40000) || [];
        }
        if (s.path.length > 1) { if (walk(s.path[0].x, s.path[0].z, 5.2)) s.path.shift(); } else walk(tx, tz, 5.2);
      } else if (d > 0.3) walk(tx, tz, Math.min(5, 1.2 + d * 2.2));
      else { const da = h - obj.rotation.y; obj.rotation.y += Math.atan2(Math.sin(da), Math.cos(da)) * Math.min(1, dt * 4); }

      // an animal close by? sometimes she can't resist
      if ((s.look -= dt) <= 0) {
        s.look = rand(2, 4);
        for (const f of friends()) {
          if (!f.obj.visible) continue;
          f.obj.getWorldPosition(tmp);
          if (Math.hypot(tmp.x - p.x, tmp.z - p.z) < 7 && dR < 4 && Math.random() < 0.45) {
            s.mode = 'play'; s.friend = f; s.playT = rand(3, 6); s.ang = Math.atan2(p.z - tmp.z, p.x - tmp.x);
            f.wait = 0; // the friend gets going
            break;
          }
        }
      }
    }

    p.y = heightAt(p.x, p.z) + hop;
    const run = speed > 3, sit = !moving && s.mode === 'heel';
    u.legs.forEach((l, k) => { l.rotation.x = moving ? Math.sin(t * (run ? 17 : 11) + (k % 3 ? Math.PI : 0)) * 0.65 : 0; });
    u.head.rotation.x = sit ? -0.25 + Math.sin(t * 1.3) * 0.06 : 0; // standing still: looks up at Ronja
    u.tail.rotation.x = s.mode === 'play' ? -0.9 : -1.9;
    u.tail.rotation.z = Math.sin(t * (s.mode === 'play' || s.petT > 0 ? 15 : sit ? 5 : 3)) * (s.mode === 'play' || s.petT > 0 ? 0.5 : 0.25);
    if (s.petT > 0) { u.head.rotation.x = -0.3; u.tail.rotation.x = -0.9; }

    if ((s.voice -= dt) <= 0) {
      s.voice = s.mode === 'play' ? rand(1.5, 3) : rand(25, 60);
      const d = playerPos && obj.visible ? Math.hypot(p.x - playerPos.x, p.z - playerPos.z) : 1e9;
      if (d < 14) world.audio?.bark(1 - d / 16);
    }
  });
  return s;
}
