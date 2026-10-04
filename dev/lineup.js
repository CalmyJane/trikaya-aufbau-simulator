import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Assets } from '../src/core/Assets.js';
import { Character } from '../src/entities/Character.js';
import { NPCS, PLAYER_LOOK, makeCamper } from '../src/entities/npcData.js';

const r = new THREE.WebGLRenderer({ antialias: true });
r.setSize(innerWidth, innerHeight); document.body.appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#9cc');
scene.add(new THREE.HemisphereLight('#fff', '#666', 2)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(3, 5, 8); scene.add(d);
const cam = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
const ctl = new OrbitControls(cam, r.domElement);
await Assets.loadAll();
const looks = [['player', PLAYER_LOOK], ...NPCS.map((n) => [n.id, n.look]), ['c1', makeCamper(1).look], ['c2', makeCamper(2).look]];
const chars = [];
looks.forEach(([id, look], i) => {
  const c = new Character(look);
  c.root.position.set((i - looks.length / 2) * 0.9, 0, 0);
  scene.add(c.root); chars.push(c);
});
window.chars = chars; window.THREE = THREE; window.scene = scene; window.cam = cam; window.ctl = ctl;
cam.position.set(0, 1.6, 9); ctl.target.set(0, 1, 0);
const clock = new THREE.Clock();
r.setAnimationLoop(() => { const dt = clock.getDelta(); chars.forEach((c) => c.update(dt)); ctl.update(); r.render(scene, cam); });
window.render = (n = 1) => { for (let i = 0; i < n; i++) { chars.forEach((c) => c.update(1 / 30)); } ctl.update(); r.render(scene, cam); };
