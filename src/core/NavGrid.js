// Grid pathfinding over the collider world: fences, containers, hedges, tents and structures are
// rasterised into a walkability grid; NPCs ask for A* paths (smoothed by line-of-sight) whenever
// the straight line to their goal is blocked. Rebuilds itself when colliders change.

const SQ2 = Math.SQRT2;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQ2], [1, -1, SQ2], [-1, 1, SQ2], [-1, -1, SQ2]];

export class NavGrid {
  constructor(colliders, bounds, cell = 0.5, inflate = 0.42) {
    this.colliders = colliders;
    this.cell = cell;
    this.inflate = inflate;
    this.minX = bounds.minX; this.minZ = bounds.minZ;
    this.w = Math.ceil((bounds.maxX - bounds.minX) / cell) + 1;
    this.h = Math.ceil((bounds.maxZ - bounds.minZ) / cell) + 1;
    const n = this.w * this.h;
    this.blocked = new Uint8Array(n);
    this.g = new Float32Array(n);
    this.parent = new Int32Array(n);
    this.stamp = new Uint32Array(n);   // open/seen marker per search
    this.closed = new Uint32Array(n);
    this.search = 0;
    this.heap = new Int32Array(n);
    this.heapF = new Float32Array(n);
    this.version = -1;
    this.budget = 6; // milliseconds of path search per frame (reset by the NPC manager)
  }

  ix(x) { return Math.round((x - this.minX) / this.cell); }
  iz(z) { return Math.round((z - this.minZ) / this.cell); }
  inside(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }
  isBlocked(i, j) { return !this.inside(i, j) || this.blocked[j * this.w + i] === 1; }
  blockedAt(x, z) { return this.isBlocked(this.ix(x), this.iz(z)); }

  ensure() { if (this.colliders.version !== this.version) this.rebuild(); }

  rebuild() {
    const { cell, inflate, minX, minZ, w, h } = this;
    const b = this.blocked;
    b.fill(0);
    for (const c of this.colliders.list) {
      // thin walls (fences, container walls) get less padding so doors stay passable
      const pad = c.type === 'box' && Math.min(c.hw, c.hd) < 0.2 ? 0.3 : inflate;
      const ext = (c.type === 'circle' ? c.r : Math.hypot(c.hw, c.hd)) + pad;
      const i0 = Math.max(0, Math.floor((c.x - ext - minX) / cell)), i1 = Math.min(w - 1, Math.ceil((c.x + ext - minX) / cell));
      const j0 = Math.max(0, Math.floor((c.z - ext - minZ) / cell)), j1 = Math.min(h - 1, Math.ceil((c.z + ext - minZ) / cell));
      if (c.type === 'circle') {
        const rr = (c.r + pad) ** 2;
        for (let j = j0; j <= j1; j++) {
          const dz = minZ + j * cell - c.z;
          for (let i = i0; i <= i1; i++) {
            const dx = minX + i * cell - c.x;
            if (dx * dx + dz * dz < rr) b[j * w + i] = 1;
          }
        }
      } else {
        const hw = c.hw + pad, hd = c.hd + pad;
        for (let j = j0; j <= j1; j++) {
          const dz = minZ + j * cell - c.z;
          for (let i = i0; i <= i1; i++) {
            const dx = minX + i * cell - c.x;
            if (Math.abs(dx * c.cos - dz * c.sin) < hw && Math.abs(dx * c.sin + dz * c.cos) < hd) b[j * w + i] = 1;
          }
        }
      }
    }
    this.version = this.colliders.version;
  }

  /** Nearest walkable cell (spiral search), or -1. */
  nearestFree(i, j, maxR = 12) {
    if (!this.isBlocked(i, j)) return j * this.w + i;
    for (let r = 1; r <= maxR; r++) {
      let best = -1, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          if (this.isBlocked(i + di, j + dj)) continue;
          const d = di * di + dj * dj;
          if (d < bd) { bd = d; best = (j + dj) * this.w + i + di; }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  /**
   * Is the straight walk from a to b free? The first/last metre is forgiven (people stand right
   * next to walls, and targets often sit at a wall – e.g. a container door).
   */
  lineClear(a, b) {
    this.ensure();
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const n = Math.ceil(len / (this.cell * 0.8));
    let leftStart = false;
    for (let k = 1; k < n; k++) {
      const t = k / n;
      const along = t * len;
      const bl = this.blockedAt(a.x + dx * t, a.z + dz * t);
      if (!bl) { leftStart = true; continue; }
      if (!leftStart && along < 1.2) continue;
      if (len - along < 1.2) continue;
      return false;
    }
    return true;
  }

  cellsClear(i0, j0, i1, j1) {
    const di = i1 - i0, dj = j1 - j0;
    const n = Math.ceil(Math.max(Math.abs(di), Math.abs(dj)) * 2.5);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      const fi = i0 + di * t, fj = j0 + dj * t;
      // check the cells a body of ~0.5 cells width would touch
      if (this.isBlocked(Math.round(fi), Math.round(fj))) return false;
      if (this.isBlocked(Math.round(fi + 0.3), Math.round(fj + 0.3)) || this.isBlocked(Math.round(fi - 0.3), Math.round(fj - 0.3))) return false;
    }
    return true;
  }

  /** A* from a to b. Returns [{x,z}, …] (smoothed, ending exactly at b) or null. */
  findPath(a, b, maxExpand = 90000) {
    this.ensure();
    const { w } = this;
    const s = this.nearestFree(this.ix(a.x), this.iz(a.z));
    const goal = this.nearestFree(this.ix(b.x), this.iz(b.z));
    if (s < 0 || goal < 0) return null;
    if (s === goal) return [{ x: b.x, z: b.z }];
    const gi = goal % w, gj = (goal / w) | 0;
    const id = ++this.search;
    const { g, parent, stamp, closed, heap, heapF } = this;
    let size = 0;
    const push = (n, f) => {
      let k = size++;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (heapF[p] <= f) break;
        heap[k] = heap[p]; heapF[k] = heapF[p]; k = p;
      }
      heap[k] = n; heapF[k] = f;
    };
    const pop = () => {
      const top = heap[0];
      const ln = heap[--size], lf = heapF[size];
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= size) break;
        if (c + 1 < size && heapF[c + 1] < heapF[c]) c++;
        if (heapF[c] >= lf) break;
        heap[k] = heap[c]; heapF[k] = heapF[c]; k = c;
      }
      heap[k] = ln; heapF[k] = lf;
      return top;
    };
    const hEst = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return (dx + dz + (SQ2 - 2) * Math.min(dx, dz)) * 1.4; }; // slightly greedy: much faster, paths still fine
    g[s] = 0; stamp[s] = id; parent[s] = -1;
    push(s, hEst(s % w, (s / w) | 0));
    let found = false, expanded = 0;
    while (size > 0) {
      const cur = pop();
      if (closed[cur] === id) continue;
      closed[cur] = id;
      if (cur === goal) { found = true; break; }
      if (++expanded > maxExpand) break;
      const ci = cur % w, cj = (cur / w) | 0;
      for (const [di, dj, cost] of DIRS) {
        const ni = ci + di, nj = cj + dj;
        if (this.isBlocked(ni, nj)) continue;
        if (di && dj && (this.isBlocked(ci + di, cj) || this.isBlocked(ci, cj + dj))) continue; // no corner cutting
        const nIdx = nj * w + ni;
        if (closed[nIdx] === id) continue;
        const ng = g[cur] + cost;
        if (stamp[nIdx] === id && ng >= g[nIdx]) continue;
        stamp[nIdx] = id; g[nIdx] = ng; parent[nIdx] = cur;
        push(nIdx, ng + hEst(ni, nj));
      }
    }
    if (!found) return null;
    // walk back
    const cells = [];
    for (let c = goal; c !== -1; c = parent[c]) cells.push(c);
    cells.reverse();
    // string pulling: keep only corners we can't see past
    const out = [];
    let anchor = 0;
    for (let k = 2; k < cells.length; k++) {
      const A = cells[anchor], C = cells[k];
      if (!this.cellsClear(A % w, (A / w) | 0, C % w, (C / w) | 0)) {
        anchor = k - 1;
        out.push(cells[anchor]);
      }
    }
    const pts = out.map((c) => ({ x: this.minX + (c % w) * this.cell, z: this.minZ + ((c / w) | 0) * this.cell }));
    pts.push({ x: b.x, z: b.z });
    return pts;
  }
}
