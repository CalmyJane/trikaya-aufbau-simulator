import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Registry of external assets. All models are CC0 (see CREDITS.md).
const MODEL_FILES = {
  m_casual: 'assets/models/m_casual.glb',
  m_hoodie: 'assets/models/m_hoodie.glb',
  m_punk: 'assets/models/m_punk.glb',
  m_adventurer: 'assets/models/m_adventurer.glb',
  f_casual: 'assets/models/f_casual.glb',
  f_formal: 'assets/models/f_formal.glb',
  bottle: 'assets/models/bottle.glb',
  container: 'assets/models/container.glb',
  container_red: 'assets/models/container_red.glb',
  trees: 'assets/models/trees.glb',
  pickup: 'assets/models/pickup.glb',
  pallet: 'assets/models/pallet.glb',
  cone: 'assets/models/cone.glb',
  speaker: 'assets/models/speaker.glb',
  toolbox: 'assets/models/toolbox.glb',
  ladder: 'assets/models/ladder.glb',
  crate: 'assets/models/crate.glb',
  tent_crew: 'assets/models/tent_crew.glb',
};

const TEXTURE_FILES = {
  grass: 'assets/textures/aerial_grass_rock.jpg',
  dirt: 'assets/textures/dirt.jpg',
  siteplan: 'assets/ui/siteplan.jpg',
  logo: 'assets/ui/logo_notext.png',
};

class AssetStore {
  constructor() {
    this.gltf = {};
    this.textures = {};
  }

  async loadAll(onProgress = () => {}) {
    const gltfLoader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();
    const jobs = [
      ...Object.entries(MODEL_FILES).map(([k, url]) => () =>
        gltfLoader.loadAsync(url).then((g) => { this.gltf[k] = g; })),
      ...Object.entries(TEXTURE_FILES).map(([k, url]) => () =>
        texLoader.loadAsync(url).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          this.textures[k] = t;
        })),
    ];
    let done = 0;
    await Promise.all(jobs.map((j) => j().then(() => onProgress(++done / jobs.length)).catch((e) => {
      console.warn('Asset failed', e);
      onProgress(++done / jobs.length);
    })));
  }

  /** Static model clone, normalised so its largest horizontal/vertical dimension fits `opts`. */
  model(name, opts = {}) {
    const g = this.gltf[name];
    if (!g) return new THREE.Group();
    const inner = g.scene.clone(true);
    normalise(inner, opts);
    inner.traverse((o) => {
      if (o.isMesh) { o.castShadow = opts.castShadow ?? true; o.receiveShadow = true; }
    });
    const obj = new THREE.Group(); // wrapper so callers can freely set position/rotation
    obj.add(inner);
    return obj;
  }

  /** Skinned character clone + its animation clips. */
  character(name) {
    const g = this.gltf[name];
    const obj = SkeletonUtils.clone(g.scene);
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        // own materials so each character can be recoloured
        o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
      }
    });
    return { object: obj, clips: g.animations };
  }

  /** All meshes (with baked world transforms) of a sub-object of a gltf, for instancing. */
  meshParts(name, childName, opts = {}) {
    const g = this.gltf[name];
    let root = childName ? g.scene.getObjectByName(childName) : g.scene;
    root = root.clone(true);
    const holder = new THREE.Group();
    holder.add(root);
    root.position.set(0, 0, 0); // keep rotation/scale: Blender exports rotate -90° on X
    normalise(holder, opts);
    holder.updateMatrixWorld(true);
    const parts = [];
    holder.traverse((o) => {
      if (o.isMesh) {
        const geo = o.geometry.clone();
        geo.applyMatrix4(o.matrixWorld);
        parts.push({ geometry: geo, material: o.material });
      }
    });
    return parts;
  }
}

/**
 * Scale an object so that its size matches `height` (y) or `length` (max of x/z)
 * and place its bottom on y=0, centred on x/z (unless keepCenter).
 */
export function normalise(obj, { height, length, width, center = true } = {}) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  let s = 1;
  if (height) s = height / size.y;
  else if (length) s = length / Math.max(size.x, size.z);
  else if (width) s = width / Math.min(size.x, size.z);
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  const wrap = obj;
  if (center) {
    wrap.position.x -= c.x;
    wrap.position.z -= c.z;
  }
  wrap.position.y -= b2.min.y;
  return obj;
}

export const Assets = new AssetStore();
