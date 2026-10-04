import { AREAS, PLOTS, LANDMARKS } from './layout.js';

// Ground height. The festival field is a bumpy, trampled farm field; everything else is flat.
// Build plots are flattened so structures sit level. Everything that stands on the ground
// (characters, vehicles, props, items) uses heightAt().

const FEST = AREAS.festival;
const bbox = FEST.reduce((b, p) => ({ x0: Math.min(b.x0, p.x), x1: Math.max(b.x1, p.x), z0: Math.min(b.z0, p.z), z1: Math.max(b.z1, p.z) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
const FLAT = [
  ...Object.values(PLOTS).map((p) => ({ x: p.pos.x, z: p.pos.z, r: (p.flatRadius || p.size * 0.7) })),
  { ...LANDMARKS.kitchen, r: 8 }, // kitchen
];

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t) { return t * t * (3 - 2 * t); }
function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = smooth(x - xi), zf = smooth(z - zi);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return (a + (b - a) * xf + (c - a) * zf + (a - b - c + d) * xf * zf) * 2 - 1;
}
function smoothstep(e0, e1, x) { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, zi = pts[i].z, xj = pts[j].x, zj = pts[j].z;
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function distToEdge(x, z, pts) {
  let m = 1e9;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b.x - a.x, dz = b.z - a.z;
    const l2 = dx * dx + dz * dz;
    let t = ((x - a.x) * dx + (z - a.z) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    m = Math.min(m, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return m;
}

export function heightAt(x, z) {
  if (x < bbox.x0 || x > bbox.x1 || z < bbox.z0 || z > bbox.z1) return 0;
  if (!inPoly(x, z, FEST)) return 0;
  let f = smoothstep(0, 10, distToEdge(x, z, FEST));
  if (f <= 0) return 0;
  for (const p of FLAT) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.r + 6) f *= smoothstep(p.r, p.r + 6, d);
    if (f <= 0) return 0;
  }
  const h = noise(x * 0.045, z * 0.045) * 0.55 + noise(x * 0.13 + 7, z * 0.13) * 0.18 + noise(x * 0.4, z * 0.4 + 3) * 0.04;
  return (h + 0.2) * f;
}

/** Surface normal-ish tilt for vehicles: returns { pitch, roll } for a footprint. */
export function tiltAt(x, z, heading, length = 2, width = 1.2) {
  const fx = Math.sin(heading), fz = Math.cos(heading);
  const rx = fz, rz = -fx;
  const hf = heightAt(x + fx * length / 2, z + fz * length / 2);
  const hb = heightAt(x - fx * length / 2, z - fz * length / 2);
  const hr = heightAt(x + rx * width / 2, z + rz * width / 2);
  const hl = heightAt(x - rx * width / 2, z - rz * width / 2);
  return { pitch: Math.atan2(hb - hf, length), roll: Math.atan2(hr - hl, width), y: (hf + hb + hr + hl) / 4 };
}
