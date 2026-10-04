// Minimal 2D (XZ-plane) collision world: circles and oriented boxes.
// Characters are circles that get pushed out of static colliders.
export class Colliders {
  constructor() {
    this.list = [];
    this.version = 0; // bumped on every change (the nav grid rebuilds from it)
  }

  addCircle(x, z, r, tag) {
    const c = { type: 'circle', x, z, r, tag };
    this.list.push(c);
    this.version++;
    return c;
  }

  /** Oriented box: centre, half extents, rotation around Y (radians, three.js convention). */
  addBox(x, z, hw, hd, rot = 0, tag) {
    const c = { type: 'box', x, z, hw, hd, rot, cos: Math.cos(rot), sin: Math.sin(rot), tag };
    this.list.push(c);
    this.version++;
    return c;
  }

  /** Axis-free wall segment from a to b with thickness t. */
  addWall(ax, az, bx, bz, t = 0.3, tag) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const rot = -Math.atan2(dz, dx);
    return this.addBox((ax + bx) / 2, (az + bz) / 2, len / 2, t / 2, rot, tag);
  }

  remove(c) {
    const i = this.list.indexOf(c);
    if (i >= 0) { this.list.splice(i, 1); this.version++; }
  }

  removeTag(tag) {
    this.list = this.list.filter((c) => c.tag !== tag);
    this.version++;
  }

  /**
   * Push a circle (pos with x,z) out of all colliders. Returns true if it collided.
   * @param above  how high the feet are above the ground – low obstacles (c.h) are cleared when jumping over them
   */
  resolve(pos, radius, above = 0) {
    let hit = false;
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.list) {
        if (c.h !== undefined && above > c.h) continue;
        if (c.type === 'circle') {
          const dx = pos.x - c.x, dz = pos.z - c.z;
          const min = radius + c.r;
          const d2 = dx * dx + dz * dz;
          if (d2 < min * min) {
            const d = Math.sqrt(d2) || 0.0001;
            pos.x = c.x + (dx / d) * min;
            pos.z = c.z + (dz / d) * min;
            hit = true;
          }
        } else {
          // to box local space (three.js Y rotation: x' = x cos + z sin ... inverse)
          const dx = pos.x - c.x, dz = pos.z - c.z;
          const lx = dx * c.cos - dz * c.sin;
          const lz = dx * c.sin + dz * c.cos;
          if (Math.abs(lx) > c.hw + radius || Math.abs(lz) > c.hd + radius) continue;
          const cx = Math.max(-c.hw, Math.min(c.hw, lx));
          const cz = Math.max(-c.hd, Math.min(c.hd, lz));
          let ox = lx - cx, oz = lz - cz;
          let d = Math.hypot(ox, oz);
          let nlx, nlz;
          if (d > 0.0001) {
            if (d >= radius) continue;
            nlx = cx + (ox / d) * radius;
            nlz = cz + (oz / d) * radius;
          } else {
            // centre inside the box: push out along the shallowest axis
            const px = c.hw - Math.abs(lx), pz = c.hd - Math.abs(lz);
            if (px < pz) { nlx = Math.sign(lx || 1) * (c.hw + radius); nlz = lz; }
            else { nlx = lx; nlz = Math.sign(lz || 1) * (c.hd + radius); }
          }
          // back to world
          pos.x = c.x + nlx * c.cos + nlz * c.sin;
          pos.z = c.z - nlx * c.sin + nlz * c.cos;
          hit = true;
        }
      }
    }
    return hit;
  }
}
