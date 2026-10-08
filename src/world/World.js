import * as THREE from 'three';
import { Assets } from '../core/Assets.js';
import { Colliders } from '../core/Colliders.js';
import { NavGrid } from '../core/NavGrid.js';
import { createGround, setPlotMarked } from './Terrain.js';
import { buildOutskirts } from './Surroundings.js';
import { buildCrewBase, pointInPoly } from './CrewBase.js';
import { strawWall } from './Structures2.js';
import { buildStructure } from './Structures.js';
import { heightAt } from './Height.js';
import { postPositions } from './Mainstage.js';
import {
  AREAS, TREE_LINES, TREE_CLUSTERS, FESTIVAL_FENCE, PLOTS, LANDMARKS, P, ROADS, HEDGES, DIXI_ROWS, SITE_BOUNDS,
} from './layout.js';
import {
  mat, box, fenceRun, lightMast, soccerGoal, plotMarker, dixi, signPost, cyl, beerBench,
} from './Props.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = new Colliders();
    this.nav = new NavGrid(this.colliders, { minX: -232, maxX: 232, minZ: -232, maxZ: 232 });
    this.spots = {};          // named positions used by quests / NPCs
    this.animated = [];       // (time, dt) => void
    this.interiors = [];      // { contains(p), hide: [objects] }
    this.structures = {};     // id -> { object, colliders, type }
    this.plotMarkers = {};    // plotId -> marker object
    this.effects = [];
    this.cameraBlockers = []; // objects the camera should not clip through
    this.night = 0;            // 0 = day … 1 = deep night
    this.nightTarget = 0;
    this.nightSpeed = 1;
    this.visibility = 220;     // fog distance at full night (shrinks during the light mission)
    this.progressHandlers = {}; // quest progress key -> (n) => void
    this.rain = 0;
    this.rainTarget = 0;
  }

  /** Move a point towards the festival centre until it's off every road (+ margin). */
  offRoad(p, margin = 1.2) {
    const pts = AREAS.festival;
    const cx = pts.reduce((a, q) => a + q.x, 0) / pts.length, cz = pts.reduce((a, q) => a + q.z, 0) / pts.length;
    const d = Math.hypot(cx - p.x, cz - p.z) || 1;
    let x = p.x, z = p.z;
    for (let i = 0; i < 60 && this.onRoad(x, z, margin); i++) { x += (cx - p.x) / d * 0.5; z += (cz - p.z) / d * 0.5; }
    return { x, z };
  }

  build() {
    // the festival generator must not stand on the road at the entrance
    Object.assign(LANDMARKS.festival_generator, this.offRoad(LANDMARKS.festival_generator, 3));
    this.setupSky();
    this.setupLights();
    const { canvas } = createGround(this.scene);
    this.groundCanvas = canvas;
    this.buildTrees();
    this.buildFestivalSite();
    buildCrewBase(this);
    this.buildSurroundings();
    this.registerSpots();
  }

  // ------------------------------------------------------------------ sky & light
  setupSky() {
    const skyGeo = new THREE.SphereGeometry(2000, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#3f86d8') }, horizon: { value: new THREE.Color('#cfe4f5') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0); }',
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.skyMat = skyMat;
    // stars (fade in at night)
    const starPos = [];
    for (let i = 0; i < 1600; i++) {
      const u = Math.random() * Math.PI * 2, v = Math.random() * 0.48 * Math.PI;
      starPos.push(Math.cos(u) * Math.cos(v) * 1800, Math.sin(v) * 1800 + 20, Math.sin(u) * Math.cos(v) * 1800);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.scene.add(this.stars);
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog('#cbe0f0', 180, 900);

    // distant Alps to the south (it's Munich after all)
    const alps = new THREE.Group();
    const rng = mulberry(7);
    for (let i = 0; i < 40; i++) {
      const a = -0.9 + (i / 40) * 1.8 + (rng() - 0.5) * 0.05;
      const r = 1500;
      const h = 80 + rng() * 140;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(90 + rng() * 80, h, 5),
        new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fb3c9').lerp(new THREE.Color('#dbe6f0'), rng() * 0.4), fog: false }),
      );
      cone.position.set(Math.sin(a) * r, h / 2 - 10, Math.cos(a) * r);
      alps.add(cone);
      const snow = new THREE.Mesh(new THREE.ConeGeometry((90 + 40) * 0.25, h * 0.25, 5), new THREE.MeshBasicMaterial({ color: '#f4f8fc', fog: false }));
      snow.position.set(cone.position.x, h - 10 - h * 0.12, cone.position.z);
      alps.add(snow);
    }
    this.scene.add(alps);
    this.alps = alps;

    // puffy clouds
    const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#bcc8d6', fog: false });
    this.cloudMat = cloudMat;
    for (let i = 0; i < 18; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(20 + Math.random() * 20, 8, 6), cloudMat);
        s.position.set(k * 25 - 50, Math.random() * 10, Math.random() * 20);
        s.scale.y = 0.5;
        c.add(s);
      }
      const a = Math.random() * Math.PI * 2, r = 500 + Math.random() * 700;
      c.position.set(Math.cos(a) * r, 180 + Math.random() * 120, Math.sin(a) * r);
      this.scene.add(c);
      this.animated.push((t, dt) => { c.position.x += dt * 2; if (c.position.x > 1300) c.position.x = -1300; });
    }
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight('#dff1ff', '#5d7a3a', 1.3);
    this.scene.add(hemi);
    this.hemi = hemi;
    const sun = new THREE.DirectionalLight('#fff4e0', 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 55;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 300 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
    this.sunOffset = new THREE.Vector3(60, 110, 40);
  }

  /** Keep the shadow frustum centred on the player. */
  followSun(target) {
    this.sun.position.copy(target).add(this.sunOffset);
    this.sun.target.position.copy(target);
  }

  // ------------------------------------------------------------------ vegetation
  buildTrees() {
    const rng = mulberry(42);
    const variants = ['NormalTree_1', 'NormalTree_2', 'NormalTree_3', 'NormalTree_4', 'NormalTree_5'];
    const transforms = variants.map(() => []);
    const place = (x, z, scale = 1) => {
      if (this.onRoad(x, z, 1.5)) return;
      if (Object.values(PLOTS).some((pl) => Math.hypot(pl.pos.x - x, pl.pos.z - z) < (pl.clearRadius || pl.size * 0.75))) return;
      const v = Math.floor(rng() * variants.length);
      transforms[v].push({ x, z, s: scale * (0.8 + rng() * 0.5), r: rng() * Math.PI * 2 });
      this.colliders.addCircle(x, z, 0.5, 'tree');
    };
    for (const tl of TREE_LINES) {
      for (let i = 0; i < tl.pts.length - 1; i++) {
        const a = tl.pts[i], b = tl.pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        const n = Math.floor(len / tl.spacing);
        // perpendicular for alleys that line both sides of a road
        const nx = -(b.z - a.z) / len, nz = (b.x - a.x) / len;
        const sides = tl.sides ? [-tl.sides, tl.sides] : [0];
        for (let k = 0; k < n; k++) {
          const t = k / n;
          for (const off of sides) {
            place(a.x + (b.x - a.x) * t + nx * off + (rng() - 0.5) * tl.jitter * 2, a.z + (b.z - a.z) * t + nz * off + (rng() - 0.5) * tl.jitter * 2);
          }
        }
      }
    }
    for (const cl of TREE_CLUSTERS) {
      for (let i = 0; i < cl.count; i++) {
        const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * cl.r;
        place(cl.c.x + Math.cos(a) * r, cl.c.z + Math.sin(a) * r, 0.9);
      }
    }
    // villages, motorway, power lines – and the trees that stand out there
    const sb = SITE_BOUNDS;
    const outTrees = buildOutskirts(this.scene, { inSite: (x, z) => x > sb.minX - 20 && x < sb.maxX + 20 && z > sb.minZ - 20 && z < sb.maxZ + 20 });
    for (const t of outTrees) place(t.x, t.z, t.s);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    variants.forEach((name, vi) => {
      const list = transforms[vi];
      if (!list.length) return;
      const parts = Assets.meshParts('trees', name, { height: 10 });
      for (const part of parts) {
        const im = new THREE.InstancedMesh(part.geometry, part.material, list.length);
        list.forEach((t, i) => {
          q.setFromAxisAngle(up, t.r);
          m4.compose(new THREE.Vector3(t.x, heightAt(t.x, t.z) - 0.1, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
          im.setMatrixAt(i, m4);
        });
        im.castShadow = true;
        im.receiveShadow = true;
        this.scene.add(im);
      }
    });
  }

  onRoad(x, z, margin = 0) {
    for (const r of ROADS) {
      for (let i = 0; i < r.pts.length - 1; i++) {
        if (distToSeg(x, z, r.pts[i], r.pts[i + 1]) < r.width / 2 + margin) return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ festival site
  buildFestivalSite() {
    // Bauzaun around the festival area with gaps at entrances
    const segs = [];
    const pts = FESTIVAL_FENCE.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const n = Math.ceil(len / 3.5);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        // fence posts stand beside the road, not on it
        const pa = this.offRoad({ x: a.x + (b.x - a.x) * t0, z: a.z + (b.z - a.z) * t0 });
        const pb = this.offRoad({ x: a.x + (b.x - a.x) * t1, z: a.z + (b.z - a.z) * t1 });
        const s = { ax: pa.x, az: pa.z, bx: pb.x, bz: pb.z };
        const mx = (s.ax + s.bx) / 2, mz = (s.az + s.bz) / 2;
        const inGap = FESTIVAL_FENCE.gaps.some((g) => Math.hypot(g.x - mx, g.z - mz) < FESTIVAL_FENCE.gapRadius);
        if (inGap) continue;
        segs.push(s);
        this.colliders.addWall(s.ax, s.az, s.bx, s.bz, 0.3, 'fence').h = 2.0; // Bauzaun: only a big (weed) jump clears it
      }
    }
    this.scene.add(fenceRun(segs));

    // plots: staked out until built
    for (const [id, plot] of Object.entries(PLOTS)) {
      if (plot.prebuilt) continue;
      const m = plotMarker(plot.size, plot.label);
      m.position.set(plot.pos.x, 0, plot.pos.z);
      this.scene.add(m);
      this.plotMarkers[id] = m;
    }

    // light masts from the site plan (red dots) – built during the night mission
    this.masts = [];
    const mastPts = [[230, 600], [325, 640], [412, 628], [530, 700], [600, 650], [110, 650], [400, 770], [215, 720]];
    mastPts.forEach(([px, py], i) => {
      const p = P(px, py);
      const lm = lightMast();
      lm.position.set(p.x, heightAt(p.x, p.z), p.z);
      lm.rotation.y = Math.atan2(PLOTS.mainstage.pos.x - p.x, PLOTS.mainstage.pos.z - p.z);
      lm.visible = false;
      this.scene.add(lm);
      const light = new THREE.PointLight('#ffd9a0', 0, 38, 1.2);
      light.position.set(p.x, lm.position.y + 7.6, p.z);
      this.scene.add(light);
      this.masts.push({ obj: lm, light, pos: p, built: false, col: null });
      this.spots[`mast_${i + 1}`] = new THREE.Vector3(p.x + 1.6, 0, p.z + 1.6);
    });
    this.progressHandlers.lights = (done) => this.masts.forEach((m, i) => {
      m.built = done.includes(i);
      m.obj.visible = m.built;
      if (m.built && !m.col) m.col = this.colliders.addCircle(m.pos.x, m.pos.z, 0.8, 'mast');
      if (!m.built && m.col) { this.colliders.remove(m.col); m.col = null; }
    });

    // Dixi rows – delivered with the wheel loader and built where you drop them
    DIXI_ROWS.forEach((r, i) => {
      const fx = Math.sin(r.rot + Math.PI / 2), fz = Math.cos(r.rot + Math.PI / 2); // row's front side
      const cx = r.pos.x + Math.cos(r.rot) * (r.n - 1) * 0.65, cz = r.pos.z - Math.sin(r.rot) * (r.n - 1) * 0.65;
      this.spots[`dixi_row_${i + 1}_pos`] = new THREE.Vector3(cx, 0, cz);
      this.spots[`dixi_row_${i + 1}`] = new THREE.Vector3(cx + fx * 3, 0, cz + fz * 3);
    });
    this.spots.dixis = this.spots.dixi_row_1.clone();

    // festival power generator (for drama: it breaks)
    const fg = LANDMARKS.festival_generator;
    const gen = new THREE.Group();
    gen.add(box(2.6, 1.6, 1.2, mat('#2f6b3a'), 0, 0.8, 0));
    gen.add(cyl(0.07, 0.07, 0.6, mat('#333'), 6, 1, 1.9, 0.3));
    gen.position.set(fg.x, heightAt(fg.x, fg.z), fg.z);
    gen.rotation.y = 0.4;
    this.scene.add(gen);
    this.colliders.addBox(fg.x, fg.z, 1.35, 0.65, 0.4, 'gen');

    // Entrance sign
    const ent = PLOTS.entrance.pos;
    const s = signPost('TRIKAYA', { width: 3, height: 1.4, bg: '#101010', fg: '#e8a33a' });
    s.position.set(ent.x + 6, 0, ent.z - 8);
    s.rotation.y = -0.9;
    this.scene.add(s);

    // the dragon mainstage is already standing
    this.placeStructure('mainstage', 'mainstage', 'mainstage', { animate: false, blocker: false });
    this.progressHandlers.rig = (done) => this.structures.mainstage.api.setRig(done);
    // mainstage posts: set one by one after drilling the holes
    this.progressHandlers.posts = (done) => {
      const ms = this.structures.mainstage;
      ms.api.setPosts(done);
      this.colliders.removeTag('post');
      for (const i of done) {
        const p = ms.api.posts[i];
        this.colliders.addCircle(ms.object.position.x + p.x, ms.object.position.z + p.z, 0.5, 'post');
      }
    };
    this.progressHandlers.pump = () => {};
    // crew kitchen (Sabse's kingdom)
    const k = this.placeStructure('kitchen', 'kitchen', null, { animate: false, at: LANDMARKS.kitchen, rotation: 0 });
    this.placeStructure('firespace', 'firespace', 'firespace', { animate: false, rotation: Math.PI });
    this.placeStructure('narnia_floor', 'narnia_floor', 'narnia_floor', { animate: false, rotation: 0.15 });
    // the chai lounge: a permanent construction site (staged, see Game.applyProgressLevel)
    this.placeStructure('chai_lounge', 'chai_tent', 'chai_lounge', { animate: false, rotation: 0.35 });
    // decoration that is simply there: the bar tent and the little beer garden
    this.placeStructure('bar_tent', 'bar_tent', null, { animate: false, at: LANDMARKS.bar_tent, rotation: Math.PI - 0.1 });
    this.placeStructure('beer_garden', 'beer_garden', null, { animate: false, at: LANDMARKS.beer_garden, rotation: -0.5 });
    this.kitchenZone = { x: LANDMARKS.kitchen.x, z: LANDMARKS.kitchen.z, r: k.zone?.r || 5.5 };
    this.buildStrawWalls();
    this.buildChillCorner();
    this.buildBaleStack();
  }

  /** Round straw bales and green silage bales stacked at the north hedge behind the crew kitchen (like on site). */
  buildBaleStack() {
    const a = P(398, 484), b = P(446, 474);
    const straw = mat('#d8b860'), silage = mat('#7fa070', { roughness: 0.5 });
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      const green = i >= 5;
      for (let k = 0; k < (i % 3 ? 2 : 1); k++) {
        const bale = cyl(0.75, 0.75, 1.2, green ? silage : straw, 12, x, heightAt(x, z) + 0.75 + k * 1.4, z);
        if (!green) bale.rotation.z = Math.PI / 2; else bale.rotation.set(0, 0, 0);
        this.scene.add(bale);
      }
    }
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    this.colliders.addBox((a.x + b.x) / 2, (a.z + b.z) / 2, len / 2 + 0.8, 0.9, Math.atan2(-(b.z - a.z), b.x - a.x), 'bales');
  }

  /**
   * Straw bale walls for sound insulation – behind/in front of the stages. Hidden until built (quest).
   * d = distance along the stage's facing direction (negative = behind), lat = sideways shift.
   */
  buildStrawWalls() {
    const defs = [
      { plot: 'mainstage', rot: 0, d: -24, lat: -9, len: 21 },   // behind the dragon
      { plot: 'forest_dome', rot: 1.7, d: -12.8, lat: 0, len: 18 }, // behind the Forest Dome
      { plot: 'forest_dome', rot: 1.7, d: 17.5, lat: 0, len: 18 },  // in front of it
      { plot: 'narnia_floor', rot: 0.15, d: -12, lat: 0, len: 18 }, // behind the elephant
      { plot: 'biergarten', rot: 0.2, d: -10, lat: 0, len: 21 },   // behind the Techno Floor
      { plot: 'biergarten', rot: 0.2, d: 15.5, lat: 0, len: 21 },   // in front of it
    ];
    this.strawWalls = defs.map((w, i) => {
      const c = PLOTS[w.plot].pos;
      const fx = Math.sin(w.rot), fz = Math.cos(w.rot), lx = Math.cos(w.rot), lz = -Math.sin(w.rot);
      let d = w.d, x, z;
      // stay inside the festival fence: pull the wall towards the stage until both ends are inside
      for (let k = 0; k < 20; k++) {
        x = c.x + fx * d + lx * w.lat; z = c.z + fz * d + lz * w.lat;
        const e = w.len / 2 + 1.5;
        if (pointInPoly(x + lx * e, z + lz * e, AREAS.festival) && pointInPoly(x - lx * e, z - lz * e, AREAS.festival) && pointInPoly(x + fx * Math.sign(d) * 2, z + fz * Math.sign(d) * 2, AREAS.festival)) break;
        d -= Math.sign(d);
      }
      const mesh = strawWall(w.len);
      mesh.position.set(x, heightAt(x, z), z);
      mesh.rotation.y = w.rot;
      mesh.visible = false;
      this.scene.add(mesh);
      // work spot on the stage side of the wall
      this.spots[`straw_${i + 1}`] = new THREE.Vector3(x - fx * Math.sign(d) * 2.3, 0, z - fz * Math.sign(d) * 2.3);
      return { mesh, x, z, rot: w.rot, len: w.len, col: null };
    });
    this.progressHandlers.straw = (done) => this.strawWalls.forEach((w, i) => {
      const on = done.includes(i);
      w.mesh.visible = on;
      if (on && !w.col) w.col = this.colliders.addBox(w.x, w.z, w.len / 2, 0.82, w.rot, 'straw');
      if (!on && w.col) { this.colliders.remove(w.col); w.col = null; }
    });
  }

  /** Zdenko & Thompsen's beer bench in the crew camp. */
  buildChillCorner() {
    const c = LANDMARKS.chill;
    const rot = 0.3;
    const b = beerBench();
    b.position.set(c.x, 0, c.z);
    b.rotation.y = rot;
    this.scene.add(b);
    this.colliders.addBox(c.x, c.z, 1.1, 0.35, rot, 'chill');
    // seats face each other across the table
    const off = (x, z) => new THREE.Vector3(c.x + x * Math.cos(rot) + z * Math.sin(rot), 0, c.z - x * Math.sin(rot) + z * Math.cos(rot));
    this.spots.chill = new THREE.Vector3(c.x, 0, c.z);
    this.spots.chill_seat1 = off(-0.3, 0.62);
    this.spots.chill_seat2 = off(0.4, -0.62);
    // beer crates + a burn barrel
    for (let i = 0; i < 3; i++) {
      const cr = box(0.4, 0.3, 0.3, mat(i % 2 ? '#1f5a2a' : '#8a1f1f'), 0, 0.15 + (i === 2 ? 0.3 : 0), 0);
      const p = off(1.8 + (i % 2) * 0.45, 0.4);
      cr.position.x = p.x; cr.position.z = p.z;
      this.scene.add(cr);
    }
    const barrel = cyl(0.3, 0.3, 0.85, mat('#5a4a3a', { metalness: 0.5 }), 10, 0, 0.42, 0);
    const bp = off(-2, -1.5);
    barrel.position.x = bp.x; barrel.position.z = bp.z;
    this.scene.add(barrel);
    this.colliders.addCircle(bp.x, bp.z, 0.4, 'chill');
  }

  /** Crew camp tents are created up front and revealed as the build progresses. */
  setCampProgress(level) {
    if (!this.campTents) return;
    const n = Math.min(this.campTents.length, 8 + level * 9);
    this.campTents.forEach((t, i) => {
      const vis = i < n;
      if (t.obj.visible !== vis) t.obj.visible = vis;
      // collider only while the tent stands (a new game used to leave invisible tents behind)
      if (vis && !t.col) t.col = this.colliders.addCircle(t.x, t.z, 1.4, 'camp');
      if (!vis && t.col) { this.colliders.remove(t.col); t.col = null; }
    });
    this.campSpots = this.campTents.slice(0, n).map((t) => new THREE.Vector3(t.x + 2.5, 0, t.z + 2.5));
  }

  // ------------------------------------------------------------------ surroundings
  buildSurroundings() {
    // sports meadow goals
    for (const [p, rot] of [[LANDMARKS.soccerGoalW, 1.35], [LANDMARKS.soccerGoalE, -1.8]]) {
      const g = soccerGoal();
      g.position.set(p.x, 0, p.z);
      g.rotation.y = rot;
      this.scene.add(g);
    }
    // TSV Allach pitch: goals + small clubhouse
    const tp = LANDMARKS.tsvPitch;
    for (const s of [-1, 1]) {
      const g = soccerGoal();
      g.position.set(tp.x + Math.cos(-0.1) * s * 24, 0, tp.z - Math.sin(-0.1) * s * 24);
      g.rotation.y = -0.1 + (s > 0 ? -Math.PI / 2 : Math.PI / 2);
      this.scene.add(g);
    }
    this.buildPitchBushes(tp, -0.1, 30, 22);
    this.buildHedges();

    const club = new THREE.Group();
    club.add(box(12, 3.2, 7, mat('#e8dfc8'), 0, 1.6, 0));
    const roof = box(12.6, 0.4, 7.6, mat('#8a3b2a'), 0, 3.4, 0);
    club.add(roof);
    const sign = signPost('TSV ALLACH 09', { width: 3, height: 0.8, bg: '#1e7a3a', fg: '#ffffff' });
    sign.position.set(0, 1.9, 3.6);
    club.add(sign);
    const cp = P(705, 603);
    club.position.set(cp.x, 0, cp.z);
    club.rotation.y = -0.1;
    this.scene.add(club);
    this.colliders.addBox(cp.x, cp.z, 6.1, 3.6, -0.1, 'club');

    // Parking with a couple of crew cars
    const pk = LANDMARKS.parking;
    for (let i = 0; i < 4; i++) {
      const car = Assets.model('pickup', { length: 5.2 });
      car.position.set(pk.x - 18 + i * 8, 0, pk.z + (i % 2) * 1.5);
      car.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      this.scene.add(car);
      this.colliders.addBox(car.position.x, car.position.z, 1.1, 2.6, car.rotation.y - Math.PI / 2, 'car');
    }
    const parkSign = signPost('P  CREW', { width: 1.6, height: 0.8, bg: '#1f5fbf', fg: '#ffffff' });
    parkSign.position.set(pk.x - 26, 0, pk.z + 4);
    this.scene.add(parkSign);

    // power poles along Enterstraße east
    const road = ROADS.find((r) => r.name === 'Enterstraße' && r.kind === 'asphalt').pts;
    for (let i = 0; i < 6; i++) {
      const t = 0.12 + i * 0.15;
      // point along the road + offset to its south side
      const seg = Math.min(road.length - 2, Math.floor(t * (road.length - 1)));
      const a = road[seg], b = road[seg + 1], lt = t * (road.length - 1) - seg;
      const x = a.x + (b.x - a.x) * lt, z = a.z + (b.z - a.z) * lt;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const nx = -(b.z - a.z) / len, nz = (b.x - a.x) / len;
      const px = x + nx * 5.5, pz = z + nz * 5.5;
      this.scene.add(cyl(0.15, 0.2, 9, mat('#6b5a45'), 6, px, 4.5, pz));
      this.colliders.addCircle(px, pz, 0.3, 'pole');
    }
  }

  /** Bush hedges along polylines (layout HEDGES). */
  buildHedges() {
    const rng = mulberry(23);
    const pts = [];
    for (const h of HEDGES) {
      for (let i = 0; i < h.pts.length - 1; i++) {
        const a = h.pts[i], b = h.pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        const n = Math.max(1, Math.floor(len / h.spacing));
        for (let k = 0; k < n; k++) {
          const t = k / n;
          pts.push({ x: a.x + (b.x - a.x) * t + (rng() - 0.5) * 0.6, z: a.z + (b.z - a.z) * t + (rng() - 0.5) * 0.6, s: 1 + rng() * 0.7 });
        }
      }
    }
    this.addBushes(pts, rng);
  }

  addBushes(pts, rng = Math.random) {
    pts = pts.filter((p) => !this.onRoad(p.x, p.z, p.s * 1.1)); // no bushes growing over roads & tracks
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const cols = ['#3f6b2a', '#4c7d31', '#35592a', '#5a8a3a'];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pts.length);
    const col = new THREE.Color();
    pts.forEach((p, i) => {
      q.setFromAxisAngle(up, rng() * 6.28);
      m4.compose(new THREE.Vector3(p.x, p.s * 0.55, p.z), q, new THREE.Vector3(p.s * 1.2, p.s * 0.85, p.s * 1.1));
      im.setMatrixAt(i, m4);
      im.setColorAt(i, col.set(cols[i % cols.length]));
      this.colliders.addCircle(p.x, p.z, p.s * 0.95, 'bush').h = Math.max(1.6, p.s * 1.25); // normal jump (1.5 m) can't, weed jump (3.6 m) can
    });
    im.castShadow = true;
    im.receiveShadow = true;
    this.scene.add(im);
  }

  /** Hedge of bushes around a rectangular pitch (centre, rotation, half extents), gap on the north side. */
  buildPitchBushes(c, rot, hw, hd) {
    const rng = mulberry(11);
    const pts = [];
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const edge = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.floor(len / 2.2);
      for (let i = 0; i <= n; i++) {
        const lx = ax + ((bx - ax) * i) / n + (rng() - 0.5) * 0.8;
        const lz = az + ((bz - az) * i) / n + (rng() - 0.5) * 0.8;
        if (lz < -hd + 1 && Math.abs(lx) < 4) continue; // entrance gap (north)
        pts.push({ x: c.x + lx * cos + lz * sin, z: c.z - lx * sin + lz * cos, s: 0.9 + rng() * 0.8 });
      }
    };
    edge(-hw, -hd, hw, -hd); edge(hw, -hd, hw, hd); edge(hw, hd, -hw, hd); edge(-hw, hd, -hw, -hd);
    for (let i = pts.length - 1; i >= 0; i--) if (this.onRoad(pts[i].x, pts[i].z, pts[i].s * 1.1)) pts.splice(i, 1);
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const cols = ['#3f6b2a', '#4c7d31', '#35592a', '#5a8a3a'];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pts.length);
    const col = new THREE.Color();
    pts.forEach((p, i) => {
      q.setFromAxisAngle(up, rng() * 6.28);
      m4.compose(new THREE.Vector3(p.x, p.s * 0.55, p.z), q, new THREE.Vector3(p.s * 1.2, p.s * 0.85, p.s * 1.1));
      im.setMatrixAt(i, m4);
      im.setColorAt(i, col.set(cols[i % cols.length]));
      this.colliders.addCircle(p.x, p.z, p.s * 0.9, 'bush').h = Math.max(1.6, p.s * 1.25); // normal jump (1.5 m) can't, weed jump (3.6 m) can
    });
    im.castShadow = true;
    im.receiveShadow = true;
    this.scene.add(im);
  }

  registerSpots() {
    const add = (name, p) => { this.spots[name] = new THREE.Vector3(p.x, 0, p.z); };
    for (const [id, plot] of Object.entries(PLOTS)) add(`plot_${id}`, plot.pos);
    for (const [id, p] of Object.entries(LANDMARKS)) add(id, p);
    // a few hand-picked "lost item" spots
    add('hammock_forest', PLOTS.hammocks.pos);
    add('soccer_goal', { x: LANDMARKS.soccerGoalW.x + 2, z: LANDMARKS.soccerGoalW.z + 3 });
    add('tsv_clubhouse', P(705, 620));
    add('alley_bench', P(350, 385));
    // next to the WC container's lifting pump (container is placed with rotation -0.4)
    add('stage_front', { x: PLOTS.mainstage.pos.x + 3, z: PLOTS.mainstage.pos.z - 9 });
    add('festival_generator_side', { x: LANDMARKS.festival_generator.x + 2.4, z: LANDMARKS.festival_generator.z + 1.6 });
    add('wc_pump', { x: LANDMARKS.wc_container.x + 4.0, z: LANDMARKS.wc_container.z + 3.3 });
    // precision parking: the loader stops here (nose to the kitchen), the tank goes right in front of the bucket
    add('water_tank_spot', { x: LANDMARKS.kitchen.x + 12.5, z: LANDMARKS.kitchen.z + 2 });
    add('water_tank_drop', { x: LANDMARKS.kitchen.x + 8.6, z: LANDMARKS.kitchen.z + 2 });
    // the wobbly Bauzaun field next to the entrance (special nut)
    add('nut_fence', { x: PLOTS.entrance.pos.x - 6, z: PLOTS.entrance.pos.z - 10 });
    // rigging posts of the mainstage (stand just outside each post)
    const ms = PLOTS.mainstage.pos;
    postPositions().forEach((pp, i) => {
      const out = pp.clone().normalize().multiplyScalar(1.3);
      add(`post_${i + 1}`, { x: ms.x + pp.x + out.x, z: ms.z + pp.z + out.z });
    });
  }

  // ------------------------------------------------------------------ building
  /** Place a structure on a plot. animate=false is used when loading a save. */
  placeStructure(id, type, plotId, { animate = true, rotation = 0, params, at, blocker = true, growTime = 1.6 } = {}) {
    if (this.structures[id]) return this.structures[id];
    const plot = plotId ? PLOTS[plotId] : { pos: at, size: 10 };
    const { object, colliders, api, zone } = buildStructure(type, params);
    object.position.set(plot.pos.x, heightAt(plot.pos.x, plot.pos.z), plot.pos.z);
    object.rotation.y = rotation;
    this.scene.add(object);
    if (blocker && type !== 'shade_sails') this.cameraBlockers.push(object);
    // colliders to world
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    for (const c of colliders) {
      const wx = plot.pos.x + c.x * cos + c.z * sin;
      const wz = plot.pos.z - c.x * sin + c.z * cos;
      if (c.type === 'circle') this.colliders.addCircle(wx, wz, c.r, `struct_${id}`);
      else this.colliders.addBox(wx, wz, c.hw, c.hd, (c.rot || 0) + rotation, `struct_${id}`);
    }
    if (this.plotMarkers[plotId]) this.plotMarkers[plotId].visible = false;
    if (plotId) setPlotMarked(plotId, false); // the sprayed outline disappears under the new structure
    if (object.userData.animate) this.animated.push(object.userData.animate);
    this.onPlaced?.(object);
    // named spots authored in the structure's local space
    for (const [name, [lx, lz]] of Object.entries(object.userData.spots || {})) {
      this.spots[name] = new THREE.Vector3(plot.pos.x + lx * cos + lz * sin, 0, plot.pos.z - lx * sin + lz * cos);
    }
    const rec = { object, type, plotId, api, zone };
    this.structures[id] = rec;

    if (animate) {
      object.scale.set(1, 0.001, 1);
      this.spawnDust(plot.pos, plot.size * 0.6);
      if (growTime < 3) this.spawnConfetti(plot.pos);
      else setTimeout(() => this.spawnConfetti(plot.pos), growTime * 1000);
      let t = 0;
      const tick = (time, dt) => {
        t += dt / growTime;
        const k = Math.min(1, t);
        const e = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2); // ease out back
        object.scale.set(1 + Math.sin(k * Math.PI) * 0.05, Math.max(0.001, e), 1 + Math.sin(k * Math.PI) * 0.05);
        return k >= 1;
      };
      this.effects.push(tick);
    }
    return rec;
  }

  /** Structures that grow in stages (Narnia Floor): visuals + colliders for stage n. */
  setStructureStage(id, n) {
    const rec = this.structures[id];
    if (!rec?.api?.setStage || rec.stage === n) return;
    rec.stage = n;
    rec.api.setStage(n);
    this.colliders.removeTag(`stage_${id}`);
    const rot = rec.object.rotation.y, cos = Math.cos(rot), sin = Math.sin(rot);
    const o = rec.object.position;
    for (const c of rec.api.colliders(n)) {
      const wx = o.x + c.x * cos + c.z * sin, wz = o.z - c.x * sin + c.z * cos;
      if (c.type === 'circle') this.colliders.addCircle(wx, wz, c.r, `stage_${id}`);
      else this.colliders.addBox(wx, wz, c.hw, c.hd, (c.rot || 0) + rot, `stage_${id}`);
    }
  }

  /** Remove every built structure (new game). */
  clearStructures() {
    for (const [id, rec] of Object.entries(this.structures)) {
      if (['mainstage', 'kitchen', 'firespace', 'narnia_floor', 'chai_lounge', 'bar_tent', 'beer_garden'].includes(id)) continue;
      this.scene.remove(rec.object);
      this.cameraBlockers = this.cameraBlockers.filter((o) => o !== rec.object);
      this.colliders.removeTag(`struct_${id}`);
      if (this.plotMarkers[rec.plotId]) this.plotMarkers[rec.plotId].visible = true;
      if (rec.plotId) setPlotMarked(rec.plotId, true);
      delete this.structures[id];
    }
    this.structures.mainstage?.api?.setRig(0);
    this.progressHandlers.posts?.([]);
  }

  spawnDust(pos, radius, { n = 60, size = 0.6, y = 0.3, life: maxLife = 1.8 } = {}) {
    const geo = new THREE.SphereGeometry(size, 6, 4);
    const m = new THREE.MeshStandardMaterial({ color: '#c8b48a', transparent: true, opacity: 0.8, roughness: 1 });
    const im = new THREE.InstancedMesh(geo, m, n);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.6 + Math.random() * 0.5);
      parts.push({ p: new THREE.Vector3(pos.x + Math.cos(a) * r, y, pos.z + Math.sin(a) * r), v: new THREE.Vector3(Math.cos(a) * 3, 1 + Math.random() * 2, Math.sin(a) * 3), s: 0.5 + Math.random() });
    }
    this.scene.add(im);
    let life = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    this.effects.push((t, dt) => {
      life += dt;
      parts.forEach((pt, i) => {
        pt.p.addScaledVector(pt.v, dt);
        pt.v.multiplyScalar(0.96);
        const s = pt.s * (1 + life * 2);
        m4.compose(pt.p, q, new THREE.Vector3(s, s, s));
        im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
      m.opacity = Math.max(0, 0.8 - life * (0.9 / maxLife));
      if (life > maxLife) { this.scene.remove(im); geo.dispose(); m.dispose(); return true; }
      return false;
    });
  }

  spawnConfetti(pos) {
    const n = 160;
    const geo = new THREE.PlaneGeometry(0.25, 0.15);
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: false });
    const im = new THREE.InstancedMesh(geo, m, n);
    const cols = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#ffffff'].map((c) => new THREE.Color(c));
    const parts = [];
    for (let i = 0; i < n; i++) {
      im.setColorAt(i, cols[i % cols.length]);
      parts.push({
        p: new THREE.Vector3(pos.x, 2, pos.z),
        v: new THREE.Vector3((Math.random() - 0.5) * 14, 10 + Math.random() * 10, (Math.random() - 0.5) * 14),
        r: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0),
        w: (Math.random() - 0.5) * 10,
      });
    }
    this.scene.add(im);
    let life = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    this.effects.push((t, dt) => {
      life += dt;
      parts.forEach((pt, i) => {
        pt.v.y -= 9.8 * dt * 0.5;
        pt.v.x *= 0.98; pt.v.z *= 0.98;
        if (pt.v.y < -2) pt.v.y = -2;
        pt.p.addScaledVector(pt.v, dt);
        if (pt.p.y < 0.05) { pt.p.y = 0.05; pt.v.set(0, 0, 0); }
        pt.r.x += pt.w * dt; pt.r.y += pt.w * dt * 0.7;
        q.setFromEuler(pt.r);
        m4.compose(pt.p, q, one);
        im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
      if (life > 7) { this.scene.remove(im); geo.dispose(); m.dispose(); return true; }
      return false;
    });
  }

  /** Fade towards night (1) or day (0) over `seconds`. */
  setNight(target, seconds = 5) {
    this.nightTarget = target;
    this.nightSpeed = 1 / Math.max(0.1, seconds);
  }

  setRain(on) { this.rainTarget = on ? 1 : 0; }

  updateRain(dt, playerPos) {
    this.rain += (this.rainTarget - this.rain) * Math.min(1, dt * 0.6);
    if (this.rain > 0.02 && !this.rainMesh) {
      const N = 1400, pos = new Float32Array(N * 6);
      this.rainDrops = [];
      for (let i = 0; i < N; i++) this.rainDrops.push({ x: (Math.random() - 0.5) * 70, y: Math.random() * 30, z: (Math.random() - 0.5) * 70, v: 18 + Math.random() * 8 });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rainMesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#aeb8c8', transparent: true, opacity: 0.5, depthWrite: false }));
      this.rainMesh.frustumCulled = false;
      this.scene.add(this.rainMesh);
    }
    if (!this.rainMesh) return;
    this.rainMesh.visible = this.rain > 0.02;
    this.rainMesh.material.opacity = 0.55 * this.rain;
    if (!this.rainMesh.visible) return;
    const arr = this.rainMesh.geometry.attributes.position.array;
    this.rainDrops.forEach((d, i) => {
      d.y -= d.v * dt;
      if (d.y < 0) { d.y = 28 + Math.random() * 4; d.x = (Math.random() - 0.5) * 70; d.z = (Math.random() - 0.5) * 70; }
      const x = playerPos.x + d.x, z = playerPos.z + d.z;
      arr.set([x, d.y, z, x + 0.05, d.y + 0.9, z + 0.02], i * 6);
    });
    this.rainMesh.geometry.attributes.position.needsUpdate = true;
  }

  applyNight(n, playerPos) {
    const L = (a, b, t) => a + (b - a) * t;
    const C = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    const dusk = Math.max(0, 1 - Math.abs(n - 0.45) / 0.35); // orange sunset band
    this.sun.intensity = L(2.6, 0.04, Math.min(1, n * 1.3));
    this.sun.color.copy(C('#fff4e0', '#ff9a5a', dusk)).lerp(new THREE.Color('#5a6aa8'), Math.max(0, n - 0.6) * 2.5);
    this.hemi.intensity = L(1.3, 0.16, n);
    this.hemi.color.copy(C('#dff1ff', '#27335a', n));
    this.hemi.groundColor.copy(C('#5d7a3a', '#141810', n));
    const u = this.skyMat.uniforms;
    u.top.value.copy(C('#3f86d8', '#040816', n));
    u.horizon.value.copy(C('#cfe4f5', '#f0a060', dusk)).lerp(new THREE.Color('#141a34'), Math.max(0, n - 0.5) * 2);
    this.scene.fog.color.copy(C('#cbe0f0', '#0a0f1e', n)).lerp(new THREE.Color('#d0906a'), dusk * 0.35);
    this.scene.fog.near = L(180, 4, Math.min(1, n * 1.2));
    this.scene.fog.far = L(900, this.visibility, Math.min(1, n * 1.15));
    this.stars.material.opacity = Math.max(0, (n - 0.55) * 2.2);
    this.cloudMat.color.copy(C('#ffffff', '#2a3048', n));
    this.cloudMat.emissive.copy(C('#bcc8d6', '#101420', n));
    this.alps.visible = n < 0.75 && this.rain < 0.5;
    // storm: darker, greyer, less far
    const r = this.rain;
    if (r > 0.001) {
      this.sun.intensity *= 1 - 0.6 * r;
      this.hemi.intensity *= 1 - 0.35 * r;
      this.scene.fog.color.lerp(new THREE.Color('#6a7078'), r * 0.6);
      this.scene.fog.far = Math.min(this.scene.fog.far, L(900, 150, r));
      // fog must start before it ends – otherwise it flips: everything near is solid fog, only the far stuff shows
      this.scene.fog.near = Math.min(this.scene.fog.near, L(180, 25, r), this.scene.fog.far * 0.5);
      u.top.value.lerp(new THREE.Color('#4a525e'), r * 0.8);
      u.horizon.value.lerp(new THREE.Color('#7a828c'), r * 0.8);
      this.cloudMat.color.lerp(new THREE.Color('#5a626e'), r);
    }
    // mast lights: only the nearest few are real lights (performance)
    const on = n > 0.3;
    const lit = this.masts.filter((m) => m.built).sort((a, b) => Math.hypot(a.pos.x - playerPos.x, a.pos.z - playerPos.z) - Math.hypot(b.pos.x - playerPos.x, b.pos.z - playerPos.z));
    this.masts.forEach((m) => { m.light.intensity = 0; });
    lit.slice(0, 5).forEach((m) => { m.light.intensity = on ? 90 * Math.min(1, (n - 0.3) * 3) : 0; });
    for (const m of this.masts) {
      const lens = m.obj.userData.lens;
      if (lens) lens.material.emissiveIntensity = on && m.built ? 3 : 0.6;
    }
  }

  update(time, dt, playerPos) {
    if (this.night !== this.nightTarget) {
      const d = this.nightTarget - this.night;
      this.night += Math.sign(d) * Math.min(Math.abs(d), this.nightSpeed * dt);
    }
    this.updateRain(dt, playerPos);
    if (this.night > 0.001 || this.rain > 0.001 || this._wasNight) {
      this.applyNight(this.night, playerPos);
      this._wasNight = this.night > 0.001 || this.rain > 0.001;
    }
    for (const f of this.animated) f(time, dt);
    // Harry's 3D mapping runs whenever it's dark
    const deco = this.structures.mapping_deco?.object.userData.mapping;
    if (deco) {
      const k = Math.max(0, (this.night - 0.35) / 0.4);
      deco.uniforms.uMap.value = Math.min(1, k);
      deco.beam.material.opacity = Math.min(1, k) * 0.07;
    }
    // effects may add new effects while running (truck → structure grows) – keep those too
    const running = this.effects;
    this.effects = [];
    const keep = running.filter((f) => !f(time, dt));
    this.effects = keep.concat(this.effects);
    for (const it of this.interiors) {
      const inside = it.contains(playerPos);
      it.hide.forEach((o) => { o.visible = !inside; });
      it.inside = inside;
    }
  }

  /** F9: show all collision shapes (to hunt invisible edges). */
  toggleColliderDebug() {
    if (this.colDebug) { this.scene.remove(this.colDebug); this.colDebug = null; return; }
    const pts = [];
    const y = 0.4;
    for (const c of this.colliders.list) {
      if (c.type === 'circle') {
        for (let i = 0; i < 16; i++) {
          const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2;
          pts.push(c.x + Math.cos(a0) * c.r, y, c.z + Math.sin(a0) * c.r, c.x + Math.cos(a1) * c.r, y, c.z + Math.sin(a1) * c.r);
        }
      } else {
        const corners = [[-c.hw, -c.hd], [c.hw, -c.hd], [c.hw, c.hd], [-c.hw, c.hd]].map(([lx, lz]) => [c.x + lx * c.cos + lz * c.sin, c.z - lx * c.sin + lz * c.cos]);
        for (let i = 0; i < 4; i++) { const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4]; pts.push(ax, y, az, bx, y, bz); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.colDebug = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#ff00ff', depthTest: false }));
    this.colDebug.renderOrder = 99;
    this.scene.add(this.colDebug);
  }

  isInside(p) {
    return this.interiors.some((it) => it.contains(p));
  }

  inFestival(x, z) { return pointInPoly(x, z, AREAS.festival); }
}

function distToSeg(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((x - a.x) * dx + (z - a.z) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
}

export function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
