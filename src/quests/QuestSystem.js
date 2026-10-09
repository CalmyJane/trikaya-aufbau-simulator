import * as THREE from 'three';
import { QUESTS } from './questData.js';
import { ITEMS, createItemMesh, isHeavy } from '../items/itemData.js';
import { PLOTS } from '../world/layout.js';
import { heightAt } from '../world/Height.js';
import { L, t } from '../i18n.js';
import { START_BUDGET } from './Economy.js';

// Data-driven quest engine. Owns quest state, inventory, world items and objective markers.
// The Game wires it to NPCs (talk), vehicles, the interaction prompt and the UI.

const PICKUP_RANGE = 2.4;
const LOADER_RANGE = 4.5;
const WORK_RANGE = 2.8;
const DELIVER_RANGE_DEFAULT = 9;

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.world = game.world;
    this.quests = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
    this.state = QuestSystem.freshState();
    this.worldItems = new Map(); // itemId -> { holder, mesh, ring, pos, qid, search, center }
    this.listeners = [];
    this.markerGroup = new THREE.Group();
    this.world.scene.add(this.markerGroup);
    this.beacons = [];
  }

  static freshState() {
    return {
      completed: [],
      active: {},      // questId -> { step, picked: [itemIds], done: [target idx] }
      inventory: [],   // carried item ids (heavy ones ride in the Radlader bucket)
      karma: 25, // welcome karma – enough for a first purchase
      built: [],       // [{ id, type, plot, rotation, params }]
      progress: {},    // e.g. { rig: 3 }
      tracked: null,
      flags: {},       // misc. world state (radladerFuel, …)
      money: START_BUDGET,
      tickets: 0,
    };
  }

  reset() {
    for (const id of [...this.worldItems.keys()]) this.removeWorldItem(id);
    this.timer = null;
    this.state = QuestSystem.freshState();
    this.applyProgress();
    this.game.updateCarried();
    this.refreshMarkers();
    this.emit('changed');
  }

  on(fn) { this.listeners.push(fn); }
  emit(type, data) { this.listeners.forEach((f) => f(type, data)); }

  // ------------------------------------------------------------ queries
  isDone(id) { return this.state.completed.includes(id); }
  isActive(id) { return !!this.state.active[id]; }
  has(item) { return this.state.inventory.includes(item); }
  itemName(id) { return L(ITEMS[id]?.name) || id; }

  /** The current step's text, with live numbers filled in ({have}/{need} for karma steps). */
  stepText(qid) {
    const step = this.currentStep(qid), a = this.state.active[qid];
    if (step?.type === 'trailer' && this.game.trailer) return this.game.trailer.stepText(qid, step);
    return (L(step?.text) || '').replace('{need}', a?.need ?? '').replace('{have}', Math.floor(this.state.karma));
  }

  /** Karma step whose giver you can talk to now (enough karma collected). */
  karmaReady(npcId) {
    return Object.keys(this.state.active).find((qid) => {
      const st = this.currentStep(qid);
      return st?.type === 'karma' && this.quests[qid].giver === npcId && this.state.karma >= (this.state.active[qid].need || 0);
    });
  }

  /** The loader stands on the mark with the load: drop it, build what it was for, next step. */
  parkDone(qid) {
    const step = this.currentStep(qid);
    if (step?.type !== 'park') return;
    this.state.inventory = this.state.inventory.filter((i) => i !== step.item);
    this.game.updateCarried();
    if (step.build && !this.world.structures[step.build.id]) {
      this.state.built.push({ ...step.build });
      this.placeBuilt(step.build, true);
      if (step.build.cost) this.game.economy.spend(step.build.cost, L(step.text));
      this.emit('built', step.build);
    }
    this.emit('parked', { qid, step });
    this.advance(qid);
  }

  available() {
    const days = this.game.days;
    return Object.values(this.quests).filter((q) => !this.isDone(q.id) && !this.isActive(q.id) && (q.requires || []).every((r) => this.isDone(r)) && (!days || days.allows(q)));
  }

  offeredBy(npcId) { return this.available().filter((q) => q.giver === npcId); }

  currentStep(qid) {
    const a = this.state.active[qid];
    return a ? this.quests[qid].steps[a.step] : null;
  }

  /** Active talk steps that target this NPC. */
  talkStepsFor(npcId) {
    return Object.keys(this.state.active)
      .map((qid) => ({ qid, step: this.currentStep(qid) }))
      .filter((s) => s.step?.type === 'talk' && s.step.npc === npcId);
  }

  npcMarker(npcId) {
    if (this.restartFor(npcId)) return '!';
    if (this.talkStepsFor(npcId).length || this.karmaReady(npcId)) return '?';
    const offers = this.offeredBy(npcId);
    if (offers.some((q) => !q.errand)) return '!';
    if (offers.length) return 'fav'; // favours: optional, green
    return null;
  }

  // ------------------------------------------------------------ lifecycle
  accept(qid) {
    if (this.isActive(qid) || this.isDone(qid)) return;
    this.state.active[qid] = { step: 0, picked: [], done: [] };
    this.state.tracked = qid;
    this.emit('started', this.quests[qid]);
    this.startQuestTimer(qid);
    this.enterStep(qid);
  }

  enterStep(qid) {
    const step = this.currentStep(qid);
    if (!step) return this.complete(qid);
    const a = this.state.active[qid];
    if (step.type === 'work' && step.timeLimit && !a.waitRestart && !(this.timer?.scope === 'quest' && this.timer.qid === qid)) {
      this.timer = { qid, left: step.timeLimit, total: step.timeLimit, dusk: step.dusk, scope: 'step' };
      this.state.tracked = qid;
      this.emit('timerStart', { step, quest: this.quests[qid], timer: this.timer });
    }
    if (step.type === 'night') this.emit('nightStep', { step });
    if (step.type === 'park') this.emit('parkStart', { qid, step });
    if (step.type === 'trailer') this.emit('trailerStart', { qid, step });
    if (step.type === 'karma' && a.need == null) a.need = Math.max(step.min || 100, Math.ceil((this.state.karma + (step.extra || 80)) / 10) * 10);
    if (step.type === 'soundbox') this.game.soundbox?.spawn(true);
    if (step.type === 'wait') {
      if (a.waitLeft == null) a.waitLeft = step.seconds;
      this.emit('waitStart', { qid, step });
    }
    if (step.type === 'delivery') {
      // someone else brings it (truck); already standing (old save)? then just move on
      if (this.world.structures[step.build.id]) { setTimeout(() => this.currentStep(qid) === step && this.advance(qid), 0); }
      else this.emit('delivery', { qid, step });
    }
    if (step.type === 'pickup') {
      for (const it of step.items) {
        if (a.picked.includes(it.item) || this.has(it.item)) continue;
        this.spawnItem(it.item, it.at, qid, it.search);
      }
      this.checkPickupDone(qid);
    }
    this.refreshMarkers();
    this.emit('changed');
  }

  advance(qid) {
    const a = this.state.active[qid];
    if (!a) return;
    const prev = this.currentStep(qid);
    if (prev?.consumes && prev.type !== 'work') { this.state.inventory = this.state.inventory.filter((i) => !prev.consumes.includes(i)); this.game.updateCarried(); }
    if (prev?.doneDialog) setTimeout(() => this.game.runDialog(prev.doneDialog), 250);
    delete a.waitLeft;
    if (this.timer?.qid === qid && this.timer.scope === 'step') { const tm = this.timer; this.timer = null; this.emit('timerDone', { qid, timer: tm }); }
    a.step++;
    a.done = [];
    this.emit('stepDone', { quest: this.quests[qid] });
    this.enterStep(qid);
    this.game.save();
  }

  startQuestTimer(qid) {
    const q = this.quests[qid];
    if (!q.timeLimit) return;
    this.timer = { qid, left: q.timeLimit, total: q.timeLimit, scope: 'quest', weather: q.weather, dusk: q.dusk };
    this.state.tracked = qid;
    this.emit('timerStart', { step: null, quest: q, timer: this.timer });
  }

  complete(qid) {
    const q = this.quests[qid];
    if (this.timer?.qid === qid) { const tm = this.timer; this.timer = null; this.emit('timerDone', { qid, timer: tm }); }
    delete this.state.active[qid];
    this.state.completed.push(qid);
    this.state.karma += q.reward?.karma || 0;
    if (this.state.tracked === qid) this.state.tracked = Object.keys(this.state.active)[0] || null;
    this.refreshMarkers();
    this.emit('completed', q);
    this.emit('changed');
    this.game.save();
  }

  // ------------------------------------------------------------ talk / reach
  consumeTalk(npcId) {
    const hit = this.talkStepsFor(npcId)[0];
    if (!hit) return null;
    return { qid: hit.qid, dialog: hit.step.dialog || [], cameo: hit.step.cameo, onDone: () => this.advance(hit.qid) };
  }

  // ------------------------------------------------------------ items
  spawnItem(itemId, spotName, qid, search) {
    if (this.worldItems.has(itemId)) return;
    const spot = this.world.spots[spotName];
    if (!spot) { console.warn('Unknown spot', spotName); return; }
    const pos = spot.clone();
    if (search) { // somewhere inside the search area, not right at its centre
      const a = Math.random() * Math.PI * 2, r = search * (0.35 + Math.random() * 0.45);
      pos.x += Math.cos(a) * r;
      pos.z += Math.sin(a) * r;
      this.world.colliders.resolve(pos, isHeavy(itemId) ? 1.5 : 0.8);
    }
    pos.y = heightAt(pos.x, pos.z);
    const holder = new THREE.Group();
    const mesh = createItemMesh(itemId);
    if (isHeavy(itemId)) mesh.scale.multiplyScalar(1.4);
    holder.add(mesh);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(isHeavy(itemId) ? 1.3 : 0.7, isHeavy(itemId) ? 1.5 : 0.85, 32),
      new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    holder.add(ring);
    holder.position.copy(pos);
    this.world.scene.add(holder);
    this.worldItems.set(itemId, { holder, mesh, ring, pos, qid, search, center: spot.clone() });
  }

  removeWorldItem(itemId) {
    const wi = this.worldItems.get(itemId);
    if (!wi) return;
    this.world.scene.remove(wi.holder);
    this.worldItems.delete(itemId);
  }

  pickUp(itemId, viaLoader = false) {
    const wi = this.worldItems.get(itemId);
    if (!wi) return;
    this.removeWorldItem(itemId);
    this.state.inventory.push(itemId);
    const a = this.state.active[wi.qid];
    if (a) a.picked.push(itemId);
    this.emit(viaLoader ? 'loaded' : 'picked', { id: itemId, def: ITEMS[itemId] });
    this.game.updateCarried();
    this.checkPickupDone(wi.qid);
    this.refreshMarkers();
    this.emit('changed');
  }

  checkPickupDone(qid) {
    const step = this.currentStep(qid);
    if (step?.type !== 'pickup') return;
    if (step.items.every((it) => this.has(it.item))) this.advance(qid);
  }

  // ------------------------------------------------------------ deliver / build / work / fuel
  deliverTarget(step) {
    if (step.plot) return { pos: new THREE.Vector3(PLOTS[step.plot].pos.x, 0, PLOTS[step.plot].pos.z), r: step.radius || PLOTS[step.plot].size * 0.5 + 4 };
    if (!this.world.spots[step.at]) return { pos: new THREE.Vector3(), r: 0 };
    return { pos: this.world.spots[step.at].clone(), r: step.radius || DELIVER_RANGE_DEFAULT };
  }

  build(qid) {
    const step = this.currentStep(qid);
    this.state.inventory = this.state.inventory.filter((i) => !step.items.includes(i));
    this.game.updateCarried();
    if (step.build) {
      this.state.built.push({ ...step.build });
      this.placeBuilt(step.build, true);
      if (step.build.cost) this.game.economy.spend(step.build.cost, PLOTS[step.build.plot]?.label || L(step.buildLabel) || step.build.id);
      this.emit('built', step.build);
    }
    this.advance(qid);
  }

  /** The truck arrived: the structure stands, pay for it, next step. */
  deliveryDone(qid) {
    const step = this.currentStep(qid);
    if (step?.type !== 'delivery') return;
    if (!this.world.structures[step.build.id]) {
      this.state.built.push({ ...step.build });
      this.placeBuilt(step.build, true);
      if (step.build.cost) this.game.economy.spend(step.build.cost, L(step.text));
      this.emit('built', step.build);
    }
    if (step.doneText) this.game.ui.toast(L(step.doneText));
    this.advance(qid);
  }

  placeBuilt(b, animate) {
    this.world.placeStructure(b.id, b.type, b.plot || null, {
      animate, rotation: b.rotation || 0, params: b.params, at: b.at ? this.world.spots[b.at] : undefined,
      growTime: b.crew ? b.crew.time : 1.6, // built by an NPC crew: grows slowly while they work
    });
  }

  workDone(qid, idx) {
    const step = this.currentStep(qid);
    const a = this.state.active[qid];
    // the step may have moved on meanwhile (e.g. Thomas finished the last target while you were working)
    if (!a || step?.type !== 'work' || idx >= step.targets.length || a.done.includes(idx)) return;
    a.done.push(idx);
    if (step.costEach) this.game.economy.spend(step.costEach, step.label);
    if (step.progress) this.state.progress[step.progress] = a.done.slice(); // which targets are done (not how many)
    this.applyProgress();
    this.emit('work', { step, n: a.done.length, total: step.targets.length });
    if (a.done.length >= step.targets.length) {
      if (step.consumes) { this.state.inventory = this.state.inventory.filter((i) => !step.consumes.includes(i)); this.game.updateCarried(); }
      this.advance(qid);
    } else {
      this.refreshMarkers();
      this.emit('changed');
      this.game.save();
    }
  }

  fuel(qid) {
    const step = this.currentStep(qid);
    this.state.inventory = this.state.inventory.filter((i) => !step.items.includes(i));
    this.state.flags.fuelUnlocked = true;
    this.game.updateCarried();
    this.game.fuelVehicle(step.vehicle);
    this.advance(qid);
  }

  /** Push quest-driven progress into the world (rigging wires, …). */
  applyProgress() {
    for (const [key, fn] of Object.entries(this.world.progressHandlers)) {
      const v = this.state.progress[key];
      fn(Array.isArray(v) ? v : [...Array(v || 0).keys()]); // old saves stored counts
    }
  }

  /**
   * Timed job failed: it does NOT restart by itself – you have to go back to the person who gave it.
   * Whole-job timers: the job is dropped and offered again. Step timers (lights): the step waits for a restart talk.
   */
  failTimed() {
    const tm = this.timer;
    if (!tm) return;
    const q = this.quests[tm.qid];
    this.timer = null;
    this.emit('timerDone', { qid: tm.qid, timer: { ...tm, dusk: false }, failed: true });
    if (tm.scope === 'quest') {
      const ids = new Set(q.steps.flatMap((st) => [...(st.items || []).map((it) => it.item || it), ...(st.consumes || [])]));
      for (const id of ids) this.removeWorldItem(id);
      this.state.inventory = this.state.inventory.filter((i) => !ids.has(i));
      this.game.updateCarried();
      delete this.state.active[tm.qid];
      if (this.state.tracked === tm.qid) this.state.tracked = null;
      if (q.errand) delete this.quests[tm.qid];
    } else {
      const a = this.state.active[tm.qid];
      const step = this.currentStep(tm.qid);
      a.done = [];
      if (step?.progress) this.state.progress[step.progress] = [];
      this.applyProgress();
      a.waitRestart = true;
    }
    this.refreshMarkers();
    this.emit('changed');
  }

  /** Jobs whose timed step waits for you to talk to the giver again. */
  restartFor(npcId) {
    return Object.keys(this.state.active).find((qid) => this.state.active[qid].waitRestart && this.quests[qid].giver === npcId);
  }

  restartTimed(qid) {
    const a = this.state.active[qid];
    if (!a) return;
    a.waitRestart = false;
    this.state.tracked = qid;
    this.enterStep(qid);
    this.refreshMarkers();
    this.emit('changed');
  }

  /** (old behaviour) Timed job failed: reset the step and try again. */
  retryTimed() {
    const tm = this.timer;
    if (!tm) return;
    if (tm.scope === 'quest') {
      // restart the whole job: remove its items, back to step 0
      const q = this.quests[tm.qid];
      const ids = new Set(q.steps.flatMap((st) => [...(st.items || []).map((it) => it.item || it), ...(st.consumes || [])]));
      for (const id of ids) this.removeWorldItem(id);
      this.state.inventory = this.state.inventory.filter((i) => !ids.has(i));
      this.game.updateCarried();
      this.state.active[tm.qid] = { step: 0, picked: [], done: [] };
      this.timer = { ...tm, left: tm.total, expired: false, failReason: null };
      this.emit('timerStart', { step: null, quest: q, timer: this.timer, retry: true });
      this.enterStep(tm.qid);
      return;
    }
    const step = this.currentStep(tm.qid);
    this.state.active[tm.qid].done = [];
    if (step.progress) this.state.progress[step.progress] = [];
    this.applyProgress();
    this.timer = { ...tm, left: tm.total, expired: false };
    this.emit('timerStart', { step, timer: this.timer, retry: true });
    this.refreshMarkers();
    this.emit('changed');
  }

  // ------------------------------------------------------------ interaction
  /** Interactables provided by quests: pick-ups, loader loading, build sites, work spots, fuel. */
  interactables(p, ctx) {
    const out = [];
    const { vehicle, loader } = ctx;          // vehicle = what the player drives, loader = Radlader
    const inLoader = vehicle && vehicle === loader;
    const tip = loader?.bucketTip();
    for (const [itemId, wi] of this.worldItems) {
      if (isHeavy(itemId)) {
        if (inLoader && Math.hypot(wi.pos.x - tip.x, wi.pos.z - tip.z) < LOADER_RANGE) {
          out.push({ d: 0, label: t('p.load', { item: this.itemName(itemId) }), action: () => this.game.loadIntoBucket(itemId) });
        } else if (!vehicle && Math.hypot(wi.pos.x - p.x, wi.pos.z - p.z) < PICKUP_RANGE + 1) {
          out.push({ d: 1, label: t('p.heavy', { item: this.itemName(itemId) }), disabled: true });
        }
        continue;
      }
      if (vehicle) continue;
      const d = Math.hypot(wi.pos.x - p.x, wi.pos.z - p.z);
      if (d < PICKUP_RANGE) out.push({ d, label: t('p.pickup', { item: this.itemName(itemId) }), action: () => this.pickUp(itemId) });
    }
    for (const qid of Object.keys(this.state.active)) {
      const step = this.currentStep(qid);
      if (!step) continue;
      if (step.type === 'deliver') {
        const tg = this.deliverTarget(step);
        const d = Math.hypot(tg.pos.x - p.x, tg.pos.z - p.z);
        if (d >= tg.r) continue;
        const missing = step.items.filter((i) => !this.has(i));
        const heavy = step.items.some(isHeavy);
        const loaderNear = loader && Math.hypot(tg.pos.x - loader.position.x, tg.pos.z - loader.position.z) < tg.r + 3;
        if (missing.length) out.push({ d: d + 5, label: t('p.missing', { items: missing.map((m) => this.itemName(m)).join(', ') }), disabled: true });
        else if (heavy && !loaderNear) out.push({ d: d + 5, label: t('p.needLoader'), disabled: true });
        else out.push({ d: Math.min(d, 0.5), label: step.buildLabel ? L(step.buildLabel) : step.build ? t('p.build', { name: PLOTS[step.build.plot]?.label || '' }) : t('p.deliver'), action: () => this.game.startBuild(qid, step) });
      } else if (step.type === 'work' && !vehicle && !this.state.active[qid].waitRestart) {
        const a = this.state.active[qid];
        step.targets.forEach((name, idx) => {
          if (a.done.includes(idx)) return;
          const s = this.world.spots[name];
          const d = s ? Math.hypot(s.x - p.x, s.z - p.z) : 99;
          if (d < WORK_RANGE) out.push({ d, label: `${L(step.label)} (${a.done.length + 1}/${step.targets.length})`, action: () => this.game.startWork(qid, idx, step) });
        });
      } else if (step.type === 'fuel' && !vehicle) {
        const v = this.game.vehicles[step.vehicle];
        const d = v ? v.position.distanceTo(p) : 99;
        if (d < 4) {
          const missing = step.items.filter((i) => !this.has(i));
          if (missing.length) out.push({ d, label: t('p.missing', { items: missing.map((m) => this.itemName(m)).join(', ') }), disabled: true });
          else out.push({ d: d - 1, label: t('p.fillFuel'), action: () => this.game.startFuel(qid) });
        }
      } else if (step.type === 'ride') {
        const a = this.state.active[qid];
        const quad = this.game.vehicles.quad, n = this.game.npcs.get(step.npc);
        if (!n) continue;
        if (a.riding && n.riding !== quad) a.riding = false; // e.g. after loading a save: pick them up again
        if (!a.riding) {
          const dn = Math.hypot(n.position.x - p.x, n.position.z - p.z);
          if (vehicle === quad && dn < 7.5) out.push({ d: 0.2, label: L({ de: `${n.def.name} aufsitzen lassen`, en: `Let ${n.def.name} hop on` }), action: () => this.game.startRide(qid, step) });
          else if (!vehicle && dn < 3) out.push({ d: 2, label: L({ de: 'Hol erst das Quad', en: 'Get the quad first' }), disabled: true });
        } else if (vehicle === quad && !this._riding) {
          const s = this.world.spots[step.at];
          if (s && Math.hypot(s.x - p.x, s.z - p.z) < (step.radius || 8) && Math.abs(quad.speed) < 3) {
            this._riding = true;
            this.game.endRide(qid, step).finally(() => { this._riding = false; });
          }
        }
      } else if (step.type === 'trailer') {
        out.push(...(this.game.trailer?.interactables(qid, step, p, vehicle) || []));
      } else if (step.type === 'reach' && !this._reaching) {
        const s = this.world.spots[step.at];
        if (s && Math.hypot(s.x - p.x, s.z - p.z) < (step.radius || 6)) {
          this._reaching = true;
          const done = () => { this._reaching = false; this.advance(qid); };
          if (step.dialog) this.game.runDialog(step.dialog).then(done); else done();
        }
      }
    }
    return out;
  }

  // ------------------------------------------------------------ objectives / markers
  /** Objective points for a quest's current step: [{ pos, radius?, label }] */
  objectives(qid) {
    const step = this.currentStep(qid);
    if (!step) return [];
    if (this.state.active[qid]?.waitRestart) {
      const giver = this.game.npcs.get(this.quests[qid].giver);
      return giver ? [{ pos: giver.position, label: giver.def.name, npc: true }] : [];
    }
    if (step.type === 'park') return [{ pos: this.world.spots[step.at], label: '🅿️' }];
    if (step.type === 'trailer') return this.game.trailer?.objectives(qid, step) || [];
    if (step.type === 'karma') {
      const giver = this.game.npcs.get(this.quests[qid].giver);
      return this.state.karma >= (this.state.active[qid].need || 0) && giver ? [{ pos: giver.position, label: giver.def.name, npc: true }] : [];
    }
    if (this.quests[qid].noRunOver && step.type === 'pickup' && this.game.player.vehicle !== this.game.vehicles.quad) {
      return [{ pos: this.game.vehicles.quad.position, label: 'Quad' }];
    }
    if (step.type === 'ride') {
      const a = this.state.active[qid], quad = this.game.vehicles.quad, n = this.game.npcs.get(step.npc);
      if (a.riding) { const s = this.world.spots[step.at]; return s ? [{ pos: s, radius: step.radius || 8, label: L(step.toLabel) || '' }] : []; }
      if (this.game.player.vehicle !== quad) return [{ pos: quad.position, label: 'Quad' }];
      return n ? [{ pos: n.position, label: n.def.name }] : [];
    }
    switch (step.type) {
      case 'talk': {
        const npc = this.game.npcs.get(step.npc);
        return npc ? [{ pos: npc.position, label: npc.def.name, npc: true }] : [];
      }
      case 'pickup':
        return step.items
          .filter((it) => this.worldItems.has(it.item))
          .map((it) => {
            const wi = this.worldItems.get(it.item);
            return it.search
              ? { pos: wi.center, radius: it.search, label: this.itemName(it.item) }
              : { pos: wi.pos, label: this.itemName(it.item) };
          });
      case 'deliver': {
        const tg = this.deliverTarget(step);
        return [{ pos: tg.pos, label: step.build ? PLOTS[step.build.plot]?.label : '' }];
      }
      case 'work': {
        const a = this.state.active[qid];
        return step.targets.map((n, i) => (a.done.includes(i) ? null : { pos: this.world.spots[n], label: L(step.label) })).filter(Boolean);
      }
      case 'fuel': {
        const v = this.game.vehicles[step.vehicle];
        return v ? [{ pos: v.position, label: L(v.name) }] : [];
      }
      case 'soundbox':
        return this.game.soundbox?.box ? [{ pos: this.game.soundbox.box.pos, label: '🔊' }] : [];
      case 'reach':
      case 'delivery':
        return [{ pos: this.world.spots[step.at], label: L(step.text) }];
      case 'night':
      case 'wait':
        return [];
      default:
        return [];
    }
  }

  trackedObjectives() {
    return this.state.tracked ? this.objectives(this.state.tracked) : [];
  }

  refreshMarkers() {
    for (const b of this.beacons) this.markerGroup.remove(b);
    this.beacons = [];
    const tracked = this.state.tracked;
    const all = Object.keys(this.state.active).flatMap((qid) => this.objectives(qid).map((o) => ({ ...o, other: qid !== tracked })));
    for (const o of all) {
      if (o.npc || !o.pos) continue;
      const g = new THREE.Group();
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(o.radius ? 0.5 : 0.25, o.radius ? 0.5 : 0.25, 60, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: o.radius ? '#5ad1ff' : '#ffd84a', transparent: true, opacity: o.other ? 0.1 : 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false }),
      );
      beam.position.y = 30;
      g.add(beam);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(o.other ? 0.35 : 0.5, o.other ? 0.7 : 1, 4), new THREE.MeshBasicMaterial({ color: o.radius ? '#5ad1ff' : o.other ? '#e0c060' : '#ffd84a' }));
      arrow.rotation.x = Math.PI;
      arrow.position.y = 3.2;
      g.add(arrow);
      g.userData.arrow = arrow;
      g.userData.follow = o.pos; // moving targets (vehicles)
      if (o.radius) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(o.radius - 0.3, o.radius, 64),
          new THREE.MeshBasicMaterial({ color: '#5ad1ff', transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.3;
        g.add(ring);
      }
      g.position.set(o.pos.x, heightAt(o.pos.x, o.pos.z), o.pos.z);
      this.markerGroup.add(g);
      this.beacons.push(g);
    }
  }

  update(time, dt, playerPos) {
    const tm = this.timer;
    if (tm && !tm.expired && !this.game.ui.dialogOpen && this.game.mode === 'play') {
      tm.left -= dt;
      if (tm.left <= 0) { tm.left = 0; tm.expired = true; this.emit('timeout', { step: this.currentStep(tm.qid), quest: this.quests[tm.qid], timer: tm }); }
    }
    for (const qid of Object.keys(this.state.active)) {
      const st = this.currentStep(qid);
      if (st?.type === 'night' && this.world.night > 0.9) this.advance(qid);
      if (st?.type === 'wait' && !this.game.ui.dialogOpen && this.game.mode === 'play') {
        const a = this.state.active[qid];
        a.waitLeft -= dt;
        if (a.waitLeft <= 0) {
          if (st.cost) this.game.economy.spend(st.cost, st.costReason || st.text);
          this.emit('waitDone', { qid, step: st });
          this.advance(qid);
        }
      }
    }
    for (const [, wi] of this.worldItems) {
      wi.mesh.position.y = 0.15 + Math.sin(time * 2.5) * 0.12;
      wi.mesh.rotation.y += dt * 0.8;
      const s = 1 + Math.sin(time * 4) * 0.1;
      wi.ring.scale.set(s, s, s);
      if (wi.search) {
        // hidden in the grass: you only spot it when you're close – no glowing ring until you're almost on it
        const d = Math.hypot(wi.pos.x - playerPos.x, wi.pos.z - playerPos.z);
        wi.ring.visible = d < 3.5;
        wi.mesh.visible = d < 9;
        wi.mesh.position.y = d < 3.5 ? wi.mesh.position.y : 0.08;
      }
    }
    for (const b of this.beacons) {
      b.userData.arrow.position.y = 3.2 + Math.sin(time * 3) * 0.3;
      b.userData.arrow.rotation.y += dt * 2;
      const f = b.userData.follow;
      if (f) b.position.set(f.x, heightAt(f.x, f.z), f.z);
    }
    this.updateStartBeacon(time);
  }

  /** Yellow beam over Jan until you have taken the very first job (wristband / registration). */
  updateStartBeacon(time) {
    const jan = this.offeredBy('jan').some((q) => q.id === 'q0_leo') ? this.game.npcs?.get('jan') : null;
    if (!jan || jan.hidden) { if (this.startBeacon) this.startBeacon.visible = false; return; }
    if (!this.startBeacon) {
      const g = new THREE.Group();
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 80, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }),
      );
      beam.position.y = 40;
      g.add(beam);
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), new THREE.MeshBasicMaterial({ color: '#ffd84a' }));
      arrow.rotation.x = Math.PI;
      g.add(arrow);
      g.userData.arrow = arrow;
      this.markerGroup.add(g);
      this.startBeacon = g;
    }
    const b = this.startBeacon;
    b.visible = true;
    b.position.set(jan.position.x, heightAt(jan.position.x, jan.position.z), jan.position.z);
    b.userData.arrow.position.y = 3.6 + Math.sin(time * 3) * 0.3;
    b.userData.arrow.rotation.y = time * 2;
  }

  // ------------------------------------------------------------ save / load
  /** Fingerprint of a quest's steps – lets old saves notice that a job was redesigned. */
  sig(qid) {
    return (this.quests[qid]?.steps || []).map((st) => `${st.type}:${st.at || st.plot || st.npc || ''}:${(st.items || []).map((i) => i.item || i).join('+')}:${st.build?.id || ''}`).join('|');
  }

  serialize() {
    const out = JSON.parse(JSON.stringify(this.state));
    for (const qid of Object.keys(out.active)) out.active[qid].sig = this.sig(qid);
    return out;
  }

  restore(s) {
    this.state = { ...QuestSystem.freshState(), ...s };
    const st = this.state;
    for (const b of st.built) if (b.type === 'festzelt') b.type = 'techno_floor';
    st.built = st.built.filter((b) => b.id !== 'chai_lounge'); // the chai lounge is a permanent construction site now
    delete st.active.q5_chai;
    for (const b of st.built) if (b.id === 'dixis_1') b.rotation = 0.17; // row moved along the north fence
    for (const b of st.built) if (b.id === 'forest_dome' || b.id === 'mapping_deco') b.rotation = -0.45; // Forest Dome turned like the real one
    if (!st.completed.includes('q1a_posts') && (st.completed.includes('q1_rigging') || st.active.q1_rigging)) {
      st.completed.push('q1a_posts');
      st.progress.posts = [0, 1, 2, 3, 4, 5];
    }
    for (const b of this.state.built) this.placeBuilt(b, false);
    this.timer = null;
    for (const qid of Object.keys(this.state.active)) {
      const a = this.state.active[qid];
      if (!this.quests[qid]) { delete this.state.active[qid]; continue; }
      a.done ||= [];
      if (a.sig !== this.sig(qid)) {
        // the job changed since this save: restart it, skipping whatever is already built
        const q = this.quests[qid];
        const ids = new Set(q.steps.flatMap((st) => [...(st.items || []).map((it) => it.item || it), ...(st.consumes || [])]));
        this.state.inventory = this.state.inventory.filter((i) => !ids.has(i));
        const builtIds = this.state.built.map((b) => b.id);
        let start = 0;
        q.steps.forEach((st, i) => { if (st.build && builtIds.includes(st.build.id)) start = i + 1; });
        this.state.active[qid] = { step: start, picked: [], done: [] };
      }
      delete this.state.active[qid].sig;
      this.enterStep(qid);
    }
    this.applyProgress();
    this.game.updateCarried();
    this.refreshMarkers();
    this.emit('changed');
  }
}
