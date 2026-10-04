import * as THREE from 'three';
import { Assets } from '../core/Assets.js';
import { AREAS, FIELDS, ROADS, GROUND_SIZE, PLOTS, LANDMARKS, baseToWorld } from './layout.js';
import { heightAt } from './Height.js';
import { paintOutskirts, fieldBorder, createFarGround } from './Surroundings.js';

// Ground = one big plane whose colour comes from a canvas painted from the site plan,
// multiplied with a tiling photo texture for detail.

const CANVAS_RES = 4096;

function toCanvas(p) {
  return [(p.x / GROUND_SIZE + 0.5) * CANVAS_RES, (p.z / GROUND_SIZE + 0.5) * CANVAS_RES];
}
const M = CANVAS_RES / GROUND_SIZE; // canvas px per metre

function pathPoly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [x, y] = toCanvas(p);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
}

// dirt paths inside the crew base (base-local coordinates)
const BASE_PATHS = [
  [[0, 22.5], [0, 12], [0, 4], [3, -3], [9, -9], [14.5, -22.5]],   // south gate → yard → north gate
  [[0, 12], [-4.5, 13.4]],                                            // workshop door
  [[0, 4], [-5.5, 7], [-6.4, 9.6]],                                   // office door
  [[0, 4], [-5, -1], [-7.4, -2.4]],                                   // Matze's door
  [[0, 4], [-2.6, -3.4]],                                             // Corni's door
  [[3, -3], [-4, -11], [-7.6, -13.2]],                                // Künstlergasse
  [[9, -9], [4.4, -14.2]],                                            // Hühnercontainer
  [[0, 4], [-12, 3.5], [-15, 3.5]],                                   // generator
];

function pathLine(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [x, y] = toCanvas(p);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
}

function noiseSpeckle(ctx, pts, colors, count, size) {
  ctx.save();
  pathPoly(ctx, pts);
  ctx.clip();
  const xs = pts.map((p) => toCanvas(p)[0]), ys = pts.map((p) => toCanvas(p)[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.04 + Math.random() * 0.07;
    const r = size * (0.4 + Math.random());
    ctx.beginPath();
    ctx.ellipse(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0), r, r * (0.5 + Math.random() * 0.5), Math.random() * 3, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}

export function paintGroundCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = CANVAS_RES;
  const ctx = canvas.getContext('2d');

  // base
  ctx.fillStyle = '#5a7f3a';
  ctx.fillRect(0, 0, CANVAS_RES, CANVAS_RES);

  // crop fields with tramlines
  for (const f of FIELDS) {
    ctx.save();
    pathPoly(ctx, f.pts);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.clip();
    const a = (f.angle * Math.PI) / 180;
    const [cx, cy] = toCanvas(f.pts[0]);
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.strokeStyle = f.stripe;
    const sp = f.spacing * M * 0.3;
    for (let i = -CANVAS_RES * 1.5; i < CANVAS_RES * 1.5; i += sp) {
      ctx.lineWidth = sp * (0.35 + 0.15 * Math.sin(i * 0.013));
      ctx.beginPath();
      ctx.moveTo(-CANVAS_RES * 2, i);
      ctx.lineTo(CANVAS_RES * 2, i);
      ctx.stroke();
    }
    // tramlines
    ctx.strokeStyle = 'rgba(120,110,70,0.35)';
    ctx.lineWidth = 1.2 * M;
    for (let i = -CANVAS_RES * 1.5; i < CANVAS_RES * 1.5; i += 24 * M) {
      ctx.beginPath(); ctx.moveTo(-CANVAS_RES * 2, i); ctx.lineTo(CANVAS_RES * 2, i); ctx.stroke();
    }
    ctx.restore();
    noiseSpeckle(ctx, f.pts, ['#2f4a1d', '#8a9a55'], 2500, 2.5 * M);
    fieldBorder(ctx, () => pathPoly(ctx, f.pts), M);
  }
  // fields, villages, Lippweg and the motorway around the site
  paintOutskirts(ctx, (x, z) => toCanvas({ x, z }), M);

  // meadows (mown grass)
  const meadow = (pts, col, stripes) => {
    ctx.save();
    pathPoly(ctx, pts);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.clip();
    if (stripes) { // mowing stripes
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < CANVAS_RES; i += 8 * M) ctx.fillRect(i, 0, 4 * M, CANVAS_RES);
    }
    ctx.restore();
    noiseSpeckle(ctx, pts, ['#3d6326', '#a3b060', '#7b6a45'], 3000, 1.6 * M);
  };
  meadow(AREAS.westMeadow, '#6b9a44');
  meadow(AREAS.sportsMeadow, '#6fa449', true);
  meadow(AREAS.crewCamp, '#7e9a4f');
  paintFestivalDirt(ctx);

  // parking: gravel
  ctx.save(); pathPoly(ctx, AREAS.parking); ctx.fillStyle = '#9aa06a'; ctx.fill(); ctx.restore();
  noiseSpeckle(ctx, AREAS.parking, ['#6e6a50', '#b3ad8a'], 400, 2 * M);

  // worn paths on festival ground (desire lines)
  ctx.strokeStyle = 'rgba(110,90,60,0.45)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.5 * M;
  for (const [a, b] of [
    [PLOTS.entrance.pos, PLOTS.chai_lounge.pos], [PLOTS.entrance.pos, PLOTS.planetarium.pos],
    [PLOTS.chai_lounge.pos, PLOTS.mainstage.pos], [PLOTS.mainstage.pos, PLOTS.narnia_floor.pos],
    [PLOTS.narnia_floor.pos, PLOTS.forest_dome.pos], [PLOTS.biergarten.pos, PLOTS.shops.pos],
    [PLOTS.biergarten.pos, PLOTS.mainstage.pos],
  ]) {
    ctx.beginPath(); ctx.moveTo(...toCanvas(a)); ctx.lineTo(...toCanvas(b)); ctx.stroke();
  }

  // remember each plot's ground before and after marking it, so the marks can be removed once it's built
  const box = (plot) => {
    const [cx, cy] = toCanvas(plot.pos);
    const r = (plot.size / 2 + 2.5) * M;
    return [Math.max(0, Math.floor(cx - r)), Math.max(0, Math.floor(cy - r)), Math.ceil(2 * r), Math.ceil(2 * r)];
  };
  const under = {};
  for (const [id, plot] of Object.entries(PLOTS)) if (!plot.prebuilt) under[id] = ctx.getImageData(...box(plot));
  paintPlotMarks(ctx);
  for (const [id, plot] of Object.entries(PLOTS)) {
    if (plot.prebuilt) continue;
    const b = box(plot);
    plotGround[id] = { box: b, marked: ctx.getImageData(...b), under: under[id] };
  }

  // roads
  const roadStyle = {
    asphalt: { edge: '#6b6a60', core: '#55565a', w: 1 },
    gravel: { edge: '#9b927a', core: '#b1a88c', w: 1 },
    dirt: { edge: '#8a7a55', core: '#a08d63', w: 1 },
  };
  for (const r of ROADS) {
    const s = roadStyle[r.kind];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    pathLine(ctx, r.pts);
    ctx.strokeStyle = s.edge; ctx.lineWidth = (r.width + 1.2) * M; ctx.stroke();
    pathLine(ctx, r.pts);
    ctx.strokeStyle = s.core; ctx.lineWidth = r.width * M; ctx.stroke();
    if (r.kind === 'dirt') { // grass strip in the middle of farm tracks
      pathLine(ctx, r.pts);
      ctx.strokeStyle = 'rgba(100,130,60,0.6)'; ctx.lineWidth = r.width * 0.25 * M; ctx.stroke();
    }
  }

  // crew base: trampled meadow with dirt paths between the cabins (no concrete)
  ctx.save(); pathPoly(ctx, AREAS.crewBase); ctx.fillStyle = '#809a52'; ctx.fill(); ctx.restore();
  noiseSpeckle(ctx, AREAS.crewBase, ['#6c8a44', '#94a860', '#8a8458'], 900, 0.9 * M);
  const basePaths = BASE_PATHS.map((pl) => pl.map(([x, z]) => baseToWorld(x, z)));
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const pl of basePaths) { pathLine(ctx, pl); ctx.strokeStyle = '#8a7658'; ctx.lineWidth = 2.2 * M; ctx.stroke(); }
  for (const pl of basePaths) { pathLine(ctx, pl); ctx.strokeStyle = 'rgba(120,98,70,0.9)'; ctx.lineWidth = 1.2 * M; ctx.stroke(); }
  ctx.restore();

  // TSV Allach pitch
  const [tx, ty] = toCanvas(LANDMARKS.tsvPitch);
  ctx.save();
  ctx.translate(tx, ty); ctx.rotate(-0.1);
  const pw = 48 * M, ph = 32 * M;
  ctx.fillStyle = '#4f9a3c'; ctx.fillRect(-pw / 2 - 4 * M, -ph / 2 - 4 * M, pw + 8 * M, ph + 8 * M);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 10; i += 2) ctx.fillRect(-pw / 2 + (i * pw) / 10, -ph / 2, pw / 10, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.25 * M;
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  ctx.beginPath(); ctx.moveTo(0, -ph / 2); ctx.lineTo(0, ph / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 4.5 * M, 0, 7); ctx.stroke();
  ctx.strokeRect(-pw / 2, -7 * M, 7 * M, 14 * M);
  ctx.strokeRect(pw / 2 - 7 * M, -7 * M, 7 * M, 14 * M);
  ctx.restore();

  return canvas;
}

function paintFestivalDirt(ctx) {
  const pts = AREAS.festival;
  ctx.save();
  pathPoly(ctx, pts);
  ctx.fillStyle = '#8c7a55';
  ctx.fill();
  ctx.clip();
  const xs = pts.map((p) => toCanvas(p)[0]), ys = pts.map((p) => toCanvas(p)[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // leftover grass patches
  for (let i = 0; i < 4000; i++) {
    ctx.globalAlpha = rnd(0.08, 0.28);
    ctx.fillStyle = ['#6f8a45', '#7d9350', '#5f7a3a', '#8a9a5a'][i % 4];
    const r = rnd(0.4, 3.2) * M;
    ctx.beginPath(); ctx.ellipse(rnd(x0, x1), rnd(y0, y1), r, r * rnd(0.4, 1), rnd(0, 3), 0, 7); ctx.fill();
  }
  // darker mud + lighter dry dirt
  for (let i = 0; i < 700; i++) {
    ctx.globalAlpha = rnd(0.1, 0.35);
    ctx.fillStyle = i % 3 ? '#6b5638' : '#a8966c';
    const r = rnd(0.6, 4) * M;
    ctx.beginPath(); ctx.ellipse(rnd(x0, x1), rnd(y0, y1), r, r * rnd(0.4, 1), rnd(0, 3), 0, 7); ctx.fill();
  }
  // tyre tracks of the Radlader
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#5a4630';
  ctx.lineWidth = 0.5 * M;
  for (let k = 0; k < 14; k++) {
    let x = rnd(x0, x1), y = rnd(y0, y1), a = rnd(0, 6.28);
    const pts2 = [];
    for (let i = 0; i < 30; i++) { pts2.push([x, y]); a += rnd(-0.15, 0.15); x += Math.cos(a) * 2 * M; y += Math.sin(a) * 2 * M; }
    for (const off of [-0.9, 0.9]) {
      ctx.beginPath();
      pts2.forEach(([px, py], i) => {
        const ox = -Math.sin(a) * off * M, oy = Math.cos(a) * off * M;
        i ? ctx.lineTo(px + ox, py + oy) : ctx.moveTo(px + ox, py + oy);
      });
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

const plotGround = {};
let groundCtx = null, groundTex = null;

/** Show or remove a plot's sprayed outline (removed once something is built there). */
export function setPlotMarked(id, marked) {
  const pg = plotGround[id];
  if (!pg || !groundCtx || pg.isMarked === marked) return;
  pg.isMarked = marked;
  const [x, y] = pg.box;
  groundCtx.putImageData(marked ? pg.marked : pg.under, x, y);
  if (!marked) { // trampled ground where people have been building
    const plot = PLOTS[id];
    const [cx, cy] = toCanvas(plot.pos);
    groundCtx.save();
    groundCtx.globalAlpha = 0.35;
    groundCtx.fillStyle = '#6e5a3c';
    groundCtx.beginPath(); groundCtx.arc(cx, cy, plot.size * 0.5 * M, 0, 7); groundCtx.fill();
    groundCtx.restore();
  }
  if (groundTex) groundTex.needsUpdate = true;
}

/** Construction plots: outline scratched into the dirt, spray paint marks, name sprayed on the ground. */
function paintPlotMarks(ctx) {
  for (const plot of Object.values(PLOTS)) {
    const [cx, cy] = toCanvas(plot.pos);
    ctx.save();
    ctx.translate(cx, cy);
    if (plot.prebuilt) {
      // trampled dance floor in front of the mainstage
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#6e5a3c';
      ctx.beginPath(); ctx.arc(0, 2 * M, plot.size * 0.44 * M, 0, 7); ctx.fill();
      ctx.restore();
      continue;
    }
    const h = (plot.size / 2) * M;
    // dug-in outline (wobbly, doubled)
    ctx.strokeStyle = 'rgba(70,50,30,0.8)';
    ctx.lineWidth = 0.35 * M;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      const corners = [[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]];
      corners.forEach(([x, y], i) => {
        const jx = (Math.random() - 0.5) * 0.4 * M, jy = (Math.random() - 0.5) * 0.4 * M;
        i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy);
      });
      ctx.stroke();
    }
    // orange spray marks at the corners
    ctx.strokeStyle = 'rgba(255,120,20,0.9)';
    ctx.lineWidth = 0.3 * M;
    for (const [x, y] of [[-h, -h], [h, -h], [h, h], [-h, h]]) {
      const s = 0.8 * M;
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
    }
    // centre cross + sprayed name
    ctx.beginPath(); ctx.moveTo(-1.2 * M, 0); ctx.lineTo(1.2 * M, 0); ctx.moveTo(0, -1.2 * M); ctx.lineTo(0, 1.2 * M); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,20,0.85)';
    ctx.font = `bold ${Math.round(1.6 * M)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plot.label.toUpperCase(), 0, h - 1.6 * M);
    ctx.restore();
  }
}

/** Mask (white = dirt detail texture, black = grass detail). */
function paintDetailMask() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  const k = 1024 / CANVAS_RES;
  ctx.scale(k, k);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_RES, CANVAS_RES);
  ctx.fillStyle = '#fff';
  pathPoly(ctx, AREAS.festival); ctx.fill();
  pathPoly(ctx, AREAS.parking); ctx.fill();
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const pl of BASE_PATHS) { pathLine(ctx, pl.map(([x, z]) => baseToWorld(x, z))); ctx.lineWidth = 2.2 * M; ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const r of ROADS) {
    if (r.kind === 'asphalt') continue;
    pathLine(ctx, r.pts); ctx.lineWidth = r.width * M; ctx.stroke();
  }
  return c;
}

export function createGround(scene) {
  const canvas = paintGroundCanvas();
  const tex = new THREE.CanvasTexture(canvas);
  groundCtx = canvas.getContext('2d');
  groundTex = tex;
  for (const pg of Object.values(plotGround)) pg.isMarked = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mask = new THREE.CanvasTexture(paintDetailMask());

  const grass = Assets.textures.grass;
  const dirt = Assets.textures.dirt;
  for (const d of [grass, dirt]) {
    if (!d) continue;
    d.wrapS = d.wrapT = THREE.RepeatWrapping;
    d.colorSpace = THREE.NoColorSpace; // used as luminance modulators
  }

  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.grassMap = { value: grass };
    shader.uniforms.dirtMap = { value: dirt || grass };
    shader.uniforms.maskMap = { value: mask };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D grassMap;\nuniform sampler2D dirtMap;\nuniform sampler2D maskMap;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec3 g1 = texture2D(grassMap, vMapUv * 120.0).rgb;
        vec3 g2 = texture2D(grassMap, vMapUv * 23.0).rgb;
        vec3 d1 = texture2D(dirtMap, vMapUv * 160.0).rgb;
        float m = texture2D(maskMap, vMapUv).r;
        float lg = dot(mix(g1, g2, 0.35), vec3(0.299, 0.587, 0.114));
        float ld = dot(d1, vec3(0.299, 0.587, 0.114));
        float lum = mix(lg * 1.1, ld * 1.35, m);
        diffuseColor.rgb *= 0.55 + lum;`
      );
  };

  const SEG = 240;
  const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  scene.add(ground);

  // fields, villages & motorway beyond the painted area
  createFarGround(scene);

  return { ground, canvas };
}
