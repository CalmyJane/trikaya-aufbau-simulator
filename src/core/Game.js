import * as THREE from 'three';
import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Assets } from './Assets.js';
import { heightAt } from '../world/Height.js';
import { World } from '../world/World.js';
import { Player, CameraRig } from '../entities/Player.js';
import { FlyCam } from './FlyCam.js';
import { Trigel } from '../world/Trigel.js';
import { NPCManager } from '../entities/NPC.js';
import { Quad, Radlader } from '../entities/Vehicles.js';
import { QuestSystem } from '../quests/QuestSystem.js';
import { Economy } from '../quests/Economy.js';
import { DramaSystem, BUSY_MODES } from '../quests/Events.js';
import { Effects } from '../quests/Shop.js';
import { Police } from '../quests/Police.js';
import { Soundboxes } from '../quests/Soundbox.js';
import { Finale } from '../quests/Finale.js';
import { DaySystem } from '../quests/Days.js';
import { Parking } from '../quests/Parking.js';
import { Minigame } from '../ui/Minigame.js';
import { Errands } from '../quests/Errands.js';
import { NPC } from '../entities/NPC.js';
import { makeCamper } from '../entities/npcData.js';
import { CHATS, CAMPER_CHATS } from '../quests/chats.js';
import { Music, TRACKS } from './Music.js';
import TRACK_DATA from '../data/tracks.json';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createItemMesh, isHeavy } from '../items/itemData.js';
import { UI } from '../ui/UI.js';
import { PLOTS } from '../world/layout.js';
import { L, t, getLang, setLang, onLangChange, applyDom } from '../i18n.js';
import { TouchControls, portraitHint } from '../ui/TouchControls.js';

const SAVE_KEY = 'trikaya-aufbau-save-v2';
const SETTINGS_KEY = 'trikaya-settings';

export class Game {
  constructor(container) {
    const mobile = matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.clock = new THREE.Clock();
    this.input = new Input(this.renderer.domElement);
    this.audio = new Audio();
    this.ui = new UI();
    this.settings = this.loadSettings();
    this.audio.muted = !!this.settings.muted;
    this.mode = 'loading'; // loading | menu | play | pause | map
    this.time = 0;
    this.afkTime = 0;
    applyDom();
    if (this.input.touch) {
      this.touch = new TouchControls(this.input, this);
      if (window.innerHeight > window.innerWidth) portraitHint();
    }

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.post?.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ------------------------------------------------------------------ settings
  loadSettings() {
    const def = { sensitivity: 1, invertY: false, autoFollow: true, volume: 0.5, muted: false };
    try { return { ...def, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return def; }
  }

  saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    this.audio.setVolume(this.settings.volume);
  }

  /** Build everything after assets are loaded. */
  init() {
    this.world = new World(this.scene);
    this.world.build();
    if (this.input.touch) this.world.sun.shadow.mapSize.set(1024, 1024);
    this.player = new Player(this.world, this.input);
    this.cam = new CameraRig(this.camera, this.input, this.settings);
    this.fly = new FlyCam(this.camera, this.input);
    this.npcs = new NPCManager(this.world);
    this.trigel = new Trigel(this.world);
    this.npcs.game = this;
    this.vehicles = { quad: new Quad(this.world), radlader: new Radlader(this.world) };
    this.quests = new QuestSystem(this);
    this.economy = new Economy(this);
    this.drama = new DramaSystem(this);
    this.effects = new Effects(this);
    this.police = new Police(this);
    // live music: the mainstage always plays, the Forest Dome once it stands, and illegal soundboxes
    this.music = new Music(this.audio);
    // main menu: the music plays directly (not from the stage)
    this.music.add({ id: 'menu', pos: () => (this.mode === 'menu' ? this.camera.position : null), range: 10, vol: 0.4 });
    this.music.add({ id: 'mainstage', pos: () => (this.mode === 'menu' ? null : this.world.structures.mainstage?.object.position), range: 175, vol: 0.5, start: 0 });
    this.music.add({ id: 'forest_dome', pos: () => (this.mode === 'menu' ? null : this.world.structures.forest_dome?.object.position || null), range: 120, vol: 0.42, start: 1 });
    // radios: Mehdi in Corni's cabin, Zdenko in the workshop
    const spots = this.world.spots;
    this.music.add({ id: 'corni_radio', range: 16, vol: 0.2, tinny: true, start: 2, pos: () => {
      const m = this.npcs.get('mehdi');
      return this.mode !== 'menu' && m && !m.hidden && m.char.sitting && m.position.distanceTo(spots.corni_seat) < 1.2 ? spots.corni_desk : null;
    } });
    this.music.add({ id: 'werkstatt_radio', range: 16, vol: 0.2, tinny: true, start: 1, pos: () => (this.mode !== 'menu' && this.npcs.get('estenko')?.state === 'werkstatt' ? spots.werkstatt_inside : null) });
    // the Techno Floor plays techno once it stands; the fire island has its own little fire track
    this.music.add({ id: 'techno', playlist: 'techno', range: 120, vol: 0.45, pos: () => (this.mode === 'menu' ? null : this.world.structures.biergarten?.object.position || null) });
    this.music.add({ id: 'firespace', playlist: 'fire', range: 28, vol: 0.25, pos: () => (this.mode === 'menu' ? null : this.world.spots.fire_stage) });
    this.soundbox = new Soundboxes(this);
    this.finaleSys = new Finale(this);
    this.days = new DaySystem(this);
    this.parking = new Parking(this);
    this.minigame = new Minigame(this);
    this.errands = new Errands(this);
    this.npcs.partyLine = () => this.soundbox.partyLine();
    // pre-compile the police car's materials so the arrest doesn't hitch
    this.police.car.visible = true;
    try { this.renderer.compile(this.scene, this.camera); } catch { /* ignore */ }
    this.police.car.visible = false;
    this.headlamp = new THREE.PointLight('#ffe6c0', 0, 16, 1.4);
    this.scene.add(this.headlamp);
    this.ui.setMapSource(this.world.groundCanvas);
    this.ui.onDialogBlip = () => this.audio.blip();
    // a structure appeared where a vehicle is standing → park it next to the structure
    this.world.onPlaced = (obj) => {
      obj.updateMatrixWorld(true);
      const s = obj.scale.y; obj.scale.y = 1; obj.updateMatrixWorld(true); // growing structures start flat
      const area = new THREE.Box3().setFromObject(obj);
      obj.scale.y = s; obj.updateMatrixWorld(true);
      for (const v of Object.values(this.vehicles)) if (v.unstick(obj.position, 0.35, area)) this.ui.toast(getLang() === 'de' ? `🚜 ${L(v.name)} umgeparkt – stand im Weg.` : `🚜 ${L(v.name)} moved – it was in the way.`); };
    this.vehicles.quad.onBreak = () => {
      this.mechanicNearby();
      this.audio.sputter();
      this.ui.toast(t('t.quadDead'));
      if (this.player.vehicle === this.vehicles.quad) this.cam.shake = 0.4;
    };
    this.bindQuestEvents();
    this.bindMenus();
    onLangChange(() => this.refreshHUD(true));
    this.resetWorldState();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resetWorldState() {
    const s = this.world.spots.spawn;
    if (this.player.vehicle) this.exitVehicle();
    this.player.root.position.set(s.x, 0, s.z);
    this.player.root.rotation.y = Math.PI + 0.2;
    this.cam.yaw = 0.2;
    const vs = this.world.vehicleSpots;
    this.vehicles.quad.place(vs.quad.pos, vs.quad.heading);
    this.vehicles.quad.repair();
    this.vehicles.radlader.place(vs.radlader.pos, vs.radlader.heading);
    this.vehicles.radlader.fuel = 0;
    this.drama?.clearAll();
    this.trigel?.reset();
    this.effects?.reset();
    this.soundbox?.reset();
    this.finaleSys?.reset();
    for (const t of this.errandTents || []) this.scene.remove(t);
    this.errandTents = [];
    this.days?.reset();
    this.parking?.stop();
    this.errands?.reset();
    this.clearRouteWalkers?.();
    // nobody is still off at the DIY store in a fresh game
    for (const n of this.npcs.all) n.away = false;
    if (this.world.crewPickup) this.world.crewPickup.visible = true;
    this.world.setRain(false); this.world.rain = 0;
    this.world.night = 0; this.world.setNight(0, 0.1); this.world.visibility = 220;
    this.world.applyNight(0, this.player.position);
    this.sunriseT = 0;
    this.applyProgressLevel();
  }

  /** Tents & volunteers grow with every finished job. */
  applyProgressLevel() {
    const lvl = this.quests ? this.quests.state.completed.filter((id) => !id.startsWith('err_')).length : 0;
    this.world.setCampProgress(lvl);
    // Mia's crew builds the Narnia Floor in stages – each delivery lets them get further
    const narnia = ['n1_narnia', 'n2_narnia', 'n3_narnia'].filter((id) => this.quests?.isDone(id)).length;
    this.npcs.nutFound = !!this.quests?.isDone('x1_nuss'); // the special nut running gag ends
    this.world.setStructureStage('narnia_floor', narnia);
    // the chai tent: at some point it stands. Empty. (it's never finished)
    this.world.setStructureStage('chai_lounge', this.quests?.isDone('q9_festzelt') ? 1 : 0);
    // Künstlergasse: paintings & art workshops once Cosma has her art
    const kunst = !!this.quests?.isDone('k2_kunst');
    this.world.setStructureStage('kuenstlergasse', kunst ? 2 : 1);
    this.npcs.setWorkshop?.(kunst && !!this.world.spots.kg_seat1);
    // volunteers keep arriving; fewer on phones for performance
    this.npcs.setCrowd(Math.min(this.input.touch ? 16 : 30, 3 + lvl * 3));
    if (this.quests) this.npcs.refreshAppear(this.quests);
  }

  get registered() { return this.quests.isActive('q0_leo') || this.quests.isDone('q0_leo'); }

  // ------------------------------------------------------------------ vehicles (cargo follows you)
  enterVehicle(v) { this.player.enter(v); this.updateCarried(); }
  exitVehicle() { this.player.exit(); this.updateCarried(); }

  // ------------------------------------------------------------------ menus
  controlsHtml() {
    const de = getLang() === 'de';
    const k = (x) => `<span class="kbd">${x}</span>`;
    const rows = de ? [
      [k('W') + k('A') + k('S') + k('D'), 'Laufen / Fahren'],
      [k('Shift'), 'Sprinten (Ausdauer!)'],
      [k('Leertaste'), 'Springen / Handbremse'],
      ['Maus', 'Ins Spiel klicken, um die Maus zu fangen – dann umschauen. Rechte Maustaste ziehen geht auch. Die Kamera folgt beim Laufen automatisch.'],
      ['Mausrad', 'Zoom'],
      [`${k('Q')} / ${k('R')}`, 'Kamera drehen (Tastatur)'],
      [k('E'), 'Reden / Aufheben / Bauen / Ein- & Aussteigen'],
      [k('F'), 'Winken'],
      [k('J'), `Aufgaben · ${k('T')} Job wechseln`],
      [k('M'), 'Lageplan'],
      [k('N'), 'Ton an/aus'],
      [k('Esc'), 'Pause'],
    ] : [
      [k('W') + k('A') + k('S') + k('D'), 'Walk / drive'],
      [k('Shift'), 'Sprint (stamina!)'],
      [k('Space'), 'Jump / handbrake'],
      ['Mouse', 'Click the game to capture the mouse, then look around. Right-drag also works. The camera follows automatically while moving.'],
      ['Wheel', 'Zoom'],
      [`${k('Q')} / ${k('R')}`, 'Rotate camera (keyboard)'],
      [k('E'), 'Talk / pick up / build / enter & exit vehicles'],
      [k('F'), 'Wave'],
      [k('J'), `Quest log · ${k('T')} switch job`],
      [k('M'), 'Site map'],
      [k('N'), 'Mute'],
      [k('Esc'), 'Pause'],
    ];
    const touchRows = de ? [
      ['🕹️ links', 'Daumen auf die linke Bildschirmhälfte = Joystick (laufen / fahren). Ganz raus = sprinten.'],
      ['👆 rechts', 'Wischen = umschauen · zwei Finger = zoomen'],
      [k('E'), 'Aktion (leuchtet, wenn etwas geht) – oder auf den Hinweis tippen'],
      [k('⤒') + ' ' + k('»'), 'Springen / Sprint an-aus'],
      ['🗺️ 📋 ⛶ ⏸', 'Karte · Aufgaben · Vollbild · Pause'],
    ] : [
      ['🕹️ left', 'Thumb on the left half = joystick (walk / drive). Push to the edge = sprint.'],
      ['👆 right', 'Swipe = look around · two fingers = zoom'],
      [k('E'), 'Action (glows when something is possible) – or tap the hint'],
      [k('⤒') + ' ' + k('»'), 'Jump / sprint toggle'],
      ['🗺️ 📋 ⛶ ⏸', 'Map · jobs · fullscreen · pause'],
    ];
    const table = (r) => `<table>${r.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
    if (this.input.touch) return `<h2>${t('menu.controls')}</h2>${table(touchRows)}`;
    return `<h2>${t('menu.controls')}</h2>${table(rows)}`;
  }

  creditsHtml() {
    const de = getLang() === 'de';
    return `
      <h2>Credits</h2>
      <p>${de ? 'Eine liebevolle Parodie auf jeden Festival-Aufbau ever. Gebaut mit' : 'A loving parody of every festival build ever. Built with'} <a href="https://threejs.org" target="_blank">three.js</a> + Vite.</p>
      <h3>${de ? '3D-Modelle (CC0)' : '3D models (CC0)'}</h3>
      <table>
        <tr><td>Quaternius</td><td>${de ? 'Charaktere, Container, Bäume, Pickup, Palette, Kiste, Hütchen, Zelt, Flasche' : 'Characters, containers, trees, pickup, pallet, crate, cone, tent, bottle'} — via <a href="https://poly.pizza" target="_blank">poly.pizza</a></td></tr>
        <tr><td>iPoly3D</td><td>Speaker</td></tr>
        <tr><td>CreativeTrio</td><td>Toolbox, ladder</td></tr>
      </table>
      <h3>${de ? 'Musik' : 'Music'}</h3>
      <table>${this.musicCredits()}</table>
      <h3>${de ? 'Texturen (CC0)' : 'Textures (CC0)'}</h3>
      <table><tr><td>Poly Haven</td><td>aerial_grass_rock, dirt</td></tr></table>
      <p>${de ? 'Drache, Zelte, Dome, Quad, Radlader, Büro, Zäune, Karte und Sounds sind prozedural. Lageplan nach dem offiziellen Trikaya-Plan.' : 'Dragon, tents, dome, quad, wheel loader, office, fences, map and sounds are procedural. Layout traced from the official Trikaya site plan.'}</p>`;
  }

  /** Credits rows for every artist in the music folder (generated list, some artists hidden on request). */
  musicCredits() {
    const by = {};
    for (const t of TRACKS) {
      for (const artist of t.artists || [t.artist]) {
        if (TRACK_DATA.artists[artist.toLowerCase()]?.hidden) continue;
        (by[artist] ||= []).push(t.title);
      }
    }
    return Object.entries(by).map(([artist, titles]) => {
      const a = TRACK_DATA.artists[artist.toLowerCase()] || {};
      const link = a.link || a.soundcloud || `https://soundcloud.com/search?q=${encodeURIComponent(artist)}`;
      return `<tr><td><a href="${link}" target="_blank" rel="noopener">${artist}</a></td><td>${titles.map((x) => `<i>${x}</i>`).join(', ')}</td></tr>`;
    }).join('');
  }

  settingsHtml() {
    const s = this.settings;
    const lang = getLang();
    return `
      <h2>${t('s.title')}</h2>
      <table class="settings">
        <tr><td>${t('s.lang')}</td><td>
          <select id="set-lang" class="sel"><option value="de" ${lang === 'de' ? 'selected' : ''}>Deutsch</option><option value="en" ${lang === 'en' ? 'selected' : ''}>English</option></select></td></tr>
        <tr><td>${t('s.sens')}</td><td><input id="set-sens" type="range" min="0.3" max="2.5" step="0.1" value="${s.sensitivity}"></td></tr>
        <tr><td>${t('s.invert')}</td><td><input id="set-invert" type="checkbox" ${s.invertY ? 'checked' : ''}></td></tr>
        <tr><td>${t('s.follow')}</td><td><input id="set-follow" type="checkbox" ${s.autoFollow ? 'checked' : ''}></td></tr>
        <tr><td>${t('s.volume')}</td><td><input id="set-vol" type="range" min="0" max="1" step="0.05" value="${s.volume}"></td></tr>
      </table>`;
  }

  openSettings() {
    this.ui.modal(this.settingsHtml());
    const $ = (id) => document.getElementById(id);
    $('set-lang').onchange = (e) => { setLang(e.target.value); this.openSettings(); };
    $('set-sens').oninput = (e) => { this.settings.sensitivity = +e.target.value; this.saveSettings(); };
    $('set-invert').onchange = (e) => { this.settings.invertY = e.target.checked; this.saveSettings(); };
    $('set-follow').onchange = (e) => { this.settings.autoFollow = e.target.checked; this.saveSettings(); };
    $('set-vol').oninput = (e) => { this.settings.volume = +e.target.value; this.saveSettings(); };
  }

  bindMenus() {
    const $ = (id) => document.getElementById(id);
    const unlockAudio = () => { this.audio.unlock(); this.audio.setVolume(this.settings.volume); this.audio.click(); };
    $('btn-new').onclick = () => { unlockAudio(); this.newGame(); };
    $('btn-continue').onclick = () => { unlockAudio(); this.startPlay(); };
    $('btn-controls').onclick = () => { this.audio.click(); this.ui.modal(this.controlsHtml()); };
    $('btn-settings').onclick = () => { this.audio.click(); this.openSettings(); };
    $('btn-credits').onclick = () => { this.audio.click(); this.ui.modal(this.creditsHtml()); };
    const fs = () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    };
    $('btn-fullscreen').onclick = fs;
    // sound on/off – in the main menu and the pause menu (N in game), remembered
    $('btn-mute').onclick = $('btn-pmute').onclick = () => { unlockAudio(); this.toggleMute(); };
    this.muteLabels();
    onLangChange(() => this.muteLabels());
    $('btn-fs-hud').onclick = (e) => { e.stopPropagation(); fs(); };
    $('btn-resume').onclick = () => this.resume();
    $('bigmap').addEventListener('pointerdown', () => { if (this.mode === 'map') this.resume(); });
    $('btn-log').onclick = () => this.openQuestLog();
    $('btn-map').onclick = () => { this.ui.showPause(false); this.openMap(); };
    $('btn-psettings').onclick = () => this.openSettings();
    $('btn-pcontrols').onclick = () => this.ui.modal(this.controlsHtml());
    $('btn-quit').onclick = () => { this.save(); this.ui.showPause(false); this.toMenu(); };

    // menu & pause: how to fly the free camera
    const flyHint = () => document.querySelectorAll('.fly-hint').forEach((el) => { el.textContent = t(this.input.touch ? 'fly.hintTouch' : 'fly.hint'); });
    flyHint();
    onLangChange(flyHint);

    // browsers only allow sound after a user gesture: the first click/key anywhere starts the music
    const firstGesture = () => { this.audio.unlock(); this.audio.setVolume(this.settings.volume); };
    window.addEventListener('pointerdown', firstGesture, { once: true, capture: true });
    window.addEventListener('keydown', firstGesture, { once: true, capture: true });

    document.addEventListener('pointerlockchange', () => {
      // Esc while pointer-locked releases the lock without a keydown event → pause
      if (!this.input.locked && this.mode === 'play' && !this.ui.dialogOpen && !this.ignoreUnlock) this.pause();
    });
  }

  toggleMute() {
    const m = this.audio.toggleMute();
    this.settings.muted = m;
    this.saveSettings();
    this.muteLabels();
    if (!m) this.audio.click();
    return m;
  }

  /** The button shows the current state. */
  muteLabels() {
    for (const id of ['btn-mute', 'btn-pmute']) document.getElementById(id).textContent = t(this.audio.muted ? 'menu.soundOff' : 'menu.soundOn');
  }

  toMenu() {
    const from = this.mode;
    this.mode = 'menu';
    this.input.enabled = false;
    this.input.unlock();
    this.ui.showHUD(false);
    // back from a game: float up into the cinematic orbit (first boot starts right in it)
    if (from !== 'loading') { this.fly.startTween(this.camera, 3.5, 25); this.fly.startOrbit(); }
    let has = false;
    try { has = !!localStorage.getItem(SAVE_KEY); } catch { /* ignore */ }
    this.ui.showMenu(has);
  }

  newGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    this.world.clearStructures();
    this.quests.reset();
    this.resetWorldState();
    this.introShown = false;
    this.startPlay();
  }

  startPlay() {
    this.ui.hideMenu();
    this.ui.showHUD(true);
    this.mode = 'play';
    this.input.enabled = true;
    this.cam.target.copy(this.player.position);
    this.cam.dist = this.cam.targetDist;
    // fly in from wherever the menu camera is to the player
    const d = this.camera.position.distanceTo(this.player.position);
    this.fly.startTween(this.camera, THREE.MathUtils.clamp(d / 45, 1.4, 3.4), Math.min(18, d * 0.12));
    this.input.lock();
    this.afkTime = 0;
    this.refreshHUD();
    if (!this.quests.state.completed.length && !Object.keys(this.quests.state.active).length && !this.introShown) {
      this.introShown = true;
      setTimeout(() => this.ui.banner(t('t.welcomeTop'), t('t.welcome'), t('t.welcomeSub'), 5500), 400);
    }
  }

  pause() {
    if (this.mode !== 'play') return;
    this.mode = 'pause';
    this.input.enabled = false;
    this.ui.showPause(true);
    this.ui.showHUD(false);
    // rise up into a drone view above the player – from there you can fly around freely
    this.fly.startTween(this.camera, 1.6);
    this.fly.birdPose(this.player.position, this.cam.yaw);
    this.save();
  }

  resume() {
    const from = this.mode;
    this.ui.showPause(false);
    this.ui.closeModal();
    this.ui.showBigMap(false);
    this.ui.showHUD(true);
    // dive back down to the player when coming out of the drone view
    if (from === 'pause' || (from === 'map' && this.fly.flown)) this.fly.startTween(this.camera, 1.4);
    this.fly.flown = false;
    this.mode = 'play';
    this.input.enabled = true;
    this.input.lock();
  }

  openQuestLog() {
    const qs = this.quests;
    const all = Object.values(qs.quests).filter((q) => !q.errand || qs.isActive(q.id));
    const html = `<h2>${t('q.title')}</h2>` + all.map((q) => {
      const done = qs.isDone(q.id), active = qs.isActive(q.id);
      const avail = qs.available().includes(q);
      if (!done && !active && !avail) return `<div class="qlog-item locked"><div class="t">???</div><div class="s">${t('q.locked')}</div></div>`;
      const step = qs.currentStep(q.id);
      const giver = this.npcs.get(q.giver)?.def.name;
      return `<div class="qlog-item ${done ? 'done' : ''}"><div class="t">${done ? '✔ ' : active ? '▶ ' : '! '}${L(q.title)}</div>
        <div class="s">${L(q.summary)}</div>
        <div class="s">${done ? t('q.done') : active ? `${t('q.current')}: <b>${active ? this.quests.stepText(q.id) : L(step?.text)}</b>` : t('q.talkTo', { name: giver })} · ${t('q.reward')}: ${q.reward?.karma || 0} Karma</div></div>`;
    }).join('') + `<div class="qlog-item locked"><div class="t">${t('q.more')}</div><div class="s">${t('q.moreSub')}</div></div>`;
    if (this.mode === 'play') {
      this.ignoreUnlock = true; this.input.unlock(); setTimeout(() => (this.ignoreUnlock = false), 100);
      this.input.enabled = false;
      this.ui.onModalClose = () => { this.ui.onModalClose = null; this.resume(); };
    }
    this.ui.modal(html);
  }

  openMap() {
    this.ignoreUnlock = true;
    this.input.unlock();
    setTimeout(() => (this.ignoreUnlock = false), 100);
    this.mode = 'map';
    this.input.enabled = false;
    this.ui.showBigMap(true);
  }

  // ------------------------------------------------------------------ quest events
  bindQuestEvents() {
    this.quests.on((type, data) => {
      switch (type) {
        case 'started':
          this.audio.accept();
          this.ui.toast(t('t.newJob', { title: L(data.title) }));
          break;
        case 'picked':
          this.audio.pickup();
          this.ui.toast(t('t.picked', { icon: data.def.icon, item: L(data.def.name) }));
          break;
        case 'loaded':
          this.audio.pickup();
          this.ui.toast(t('t.loaded', { item: L(data.def.name) }));
          break;
        case 'work':
          this.audio.pickup();
          this.ui.toast(`🔩 ${L(data.step.label)} ${data.n}/${data.total}`);
          break;
        case 'built':
          this.audio.built();
          if (data.crew) { this.crewBuild(data); break; }
          this.cam.shake = 0.6;
          this.ui.banner(t('b.built'), data.type === 'shade_sails' ? (getLang() === 'de' ? 'Sonnensegel' : 'Shade sails') : (PLOTS[data.plot]?.label || ''), t('b.shape'));
          break;
        case 'timerStart': {
          const de = getLang() === 'de';
          if (data.quest?.noRunOver) this.prepareQuadExpress();
          if (data.timer.dusk) {
            this.world.setNight(1, data.timer.total * 1.05);
            if (!data.retry) this.ui.banner(de ? 'Die Sonne geht unter' : 'The sun is setting', L(data.step.text), `⏱ ${Math.round(data.timer.total)} s`, 4500);
          } else {
            if (data.timer.weather === 'rain') this.world.setRain(true);
            if (!data.retry) this.ui.banner(de ? 'Zeit-Mission!' : 'Timed job!', L(data.quest.title), `⏱ ${Math.round(data.timer.total)} s`, 4000);
          }
          break;
        }
        case 'timerDone':
          if (data.timer?.dusk) {
            this.world.visibility = 190;
            this.world.setNight(1, 6); // let the night fall fully so you can enjoy your lights
            this.ui.banner(getLang() === 'de' ? 'Licht an!' : 'Lights on!', getLang() === 'de' ? 'Geschafft – das Gelände leuchtet' : 'Made it – the site is glowing', '', 4000);
          }
          if (data.timer?.weather === 'rain') setTimeout(() => this.world.setRain(false), 6000);
          break;
        case 'timeout':
          this.player.frozen = true;
          if (this.player.vehicle) this.exitVehicle();
          setTimeout(async () => {
            let fail = (data.timer.scope === 'quest' ? data.quest?.failDialog : data.step?.failDialog) || data.quest?.failDialog || data.step?.failDialog || [{ who: data.quest?.giver || 'felix', text: { de: 'Zu spät!', en: 'Too late!' } }];
            if (data.timer.failReason === 'runover' && data.quest?.runOverDialog) fail = data.quest.runOverDialog;
            await this.runDialog(fail, null, null);
            if (data.timer.dusk) { this.world.night = 0.25; this.world.visibility = 220; this.world.applyNight(0.25, this.player.position); }
            this.player.frozen = false;
            const giver = this.npcs.get(data.quest?.giver);
            const de = getLang() === 'de';
            this.quests.failTimed();
            if (giver) this.ui.toast(de ? `⏱ Nicht geschafft. Sprich nochmal mit ${giver.def.name}, wenn du es nochmal versuchen willst.` : `⏱ Didn't make it. Talk to ${giver.def.name} again if you want another go.`);
          }, 600);
          break;
        case 'delivery':
          this.deliveryTruck(data.qid, data.step);
          break;
        case 'parkStart':
          this.parking.start(data.qid, data.step);
          if (!data.step._hinted) { data.step._hinted = true; this.ui.toast(getLang() === 'de' ? '🅿️ Fahr den Radlader in die Hütchengasse und bleib auf der gelben Markierung stehen.' : '🅿️ Drive the loader into the cone lane and stop on the yellow mark.'); }
          break;
        case 'waitStart': // someone drives off to the DIY store (with the crew pickup)
          for (const id of data.step.away || []) { const n = this.npcs.get(id); if (n) { n.away = true; n.task = null; } }
          if (this.world.crewPickup) this.world.crewPickup.visible = false;
          this.npcs.refreshAppear(this.quests);
          break;
        case 'waitDone': {
          const back = this.world.spots.pickup_bed;
          (data.step.away || []).forEach((id, i) => {
            const n = this.npcs.get(id);
            if (!n) return;
            n.away = false;
            n.root.position.set(back.x + 1.5 + i, 0, back.z + 1);
            if (id === 'leo') { n.relocate(this.player.position); return; } // and he's gone again
            // unload, then walk back to where they belong (Corni → mainstage, Jan → office)
            const home = n.home.clone();
            n.task = { phase: 'go', pos: () => home, arriveDist: 1, workTime: 0.1, speed: 4.2, anim: 'run', arriveLine: '👍' };
          });
          if (this.world.crewPickup) this.world.crewPickup.visible = true;
          this.npcs.refreshAppear(this.quests);
          this.audio.accept();
          if (data.step.doneText) this.ui.toast(L(data.step.doneText));
          break;
        }
        case 'nightStep':
          this.world.visibility = 170;
          this.world.setNight(1, 12);
          break;
        case 'completed':
          this.audio.complete();
          if (data.noRunOver) this.clearRouteWalkers();
          setTimeout(() => this.ui.banner(t('t.jobDone'), L(data.title), `+${data.reward?.karma || 0} Karma`), 300);
          if (data.outro) setTimeout(() => this.runDialog(data.outro), 3200);
          if (!data.errand && !data.id.startsWith('err_')) this.checkFinale(data); // the festival opens… and drowns
          if (data.beer) { this.effects.beerLevel += 1; this.effects.beerDecay = 0; this.ui.toast(getLang() === 'de' ? '🍺 Prost! Du bist jetzt ein bisschen geselliger.' : '🍺 Cheers! You\'re a bit more sociable now.'); }
          if (data.tentAt && this.world.spots[data.tentAt]) {
            const tp = this.world.spots[data.tentAt];
            const tent = Assets.model('tent_crew', { length: 3.2 });
            tent.position.set(tp.x + 1.6, 0, tp.z + 1.2);
            tent.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(tent);
            (this.errandTents ||= []).push(tent);
          }
          this.applyProgressLevel();
          break;
      }
      if (['changed', 'completed', 'built', 'picked', 'loaded', 'work'].includes(type)) this.refreshHUD();
    });
  }

  /** A delivery truck drives in from the road, drops its load and leaves again. */
  deliveryTruck(qid, step) {
    const de = getLang() === 'de';
    const to = this.world.spots[step.at];
    if (!to) { this.quests.deliveryDone(qid); return; }
    if (!this.truck) {
      const g = new THREE.Group();
      const car = Assets.model('pickup', { length: 5.6 }); // the model already faces +z (driving direction)
      g.add(car);
      const load = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 3.2), new THREE.MeshStandardMaterial({ color: '#2f6fb3', roughness: 0.6 }));
      load.position.set(0, 2.2, -4.7);
      load.castShadow = true;
      g.add(load);
      const hitch = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.4), new THREE.MeshStandardMaterial({ color: '#333' }));
      hitch.position.set(0, 0.6, -3.0);
      g.add(hitch);
      for (const x of [-1.2, 1.2]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12), new THREE.MeshStandardMaterial({ color: '#1a1a1a' }));
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.45, -4.7);
        g.add(w);
      }
      g.userData.load = load;
      g.visible = false;
      this.scene.add(g);
      this.truck = g;
    }
    // drive in through the nearest festival entrance
    const gate = this.world.spots.plot_entrance;
    const dir = new THREE.Vector3(gate.x - to.x, 0, gate.z - to.z).normalize();
    const start = new THREE.Vector3(gate.x, 0, gate.z).addScaledVector(dir, 25);
    const stop = to.clone().addScaledVector(dir, 3);
    const tr = this.truck;
    tr.userData.load.visible = true;
    tr.visible = true;
    this.ui.toast(de ? '🚚 Der Klowagen wird angeliefert! Er kommt über den Eingang aufs Gelände.' : '🚚 The toilet trailer is being delivered! It comes in through the entrance.');
    let t = -(step.delay || 0);
    const leg1 = start.distanceTo(gate) + 0.001, leg2 = new THREE.Vector3(gate.x, 0, gate.z).distanceTo(stop);
    const speed = 7;
    let phase = 'in';
    const tick = (time, dt) => {
      t += dt;
      if (t < 0) return false;
      if (phase === 'in') {
        const d = t * speed;
        const from = d < leg1 ? start : new THREE.Vector3(gate.x, 0, gate.z);
        const target = d < leg1 ? new THREE.Vector3(gate.x, 0, gate.z) : stop;
        const k = d < leg1 ? d / leg1 : Math.min(1, (d - leg1) / leg2);
        const p = from.clone().lerp(target, k);
        tr.position.set(p.x, heightAt(p.x, p.z), p.z);
        tr.rotation.y = Math.atan2(target.x - from.x, target.z - from.z);
        if (d >= leg1 + leg2) { phase = 'drop'; t = 0; tr.userData.load.visible = false; this.quests.deliveryDone(qid); }
      } else if (phase === 'drop') {
        if (t > 3) { phase = 'out'; t = 0; }
      } else {
        const k = Math.min(1, t * speed / (leg1 + leg2));
        const p = stop.clone().lerp(start, k);
        tr.position.set(p.x, heightAt(p.x, p.z), p.z);
        tr.rotation.y = Math.atan2(start.x - stop.x, start.z - stop.z);
        if (k >= 1) { tr.visible = false; return true; }
      }
      return false;
    };
    this.world.effects.push(tick);
  }

  /** Quad express: the quad works and lots of people stroll around between base and Firespace. */
  prepareQuadExpress() {
    const q = this.vehicles.quad;
    if (q.broken) q.repair();
    if (this.player.vehicle !== q) { const vs = this.world.vehicleSpots.quad; q.place(vs.pos, vs.heading); q.speed = 0; }
    if (this.routeWalkers?.length) return;
    this.routeWalkers = [];
    const a = this.world.spots.base_yard, b = this.world.spots.fire_pit || this.world.spots.plot_firespace;
    const stops = ['plot_mainstage', 'kitchen', 'plot_narnia_floor', 'plot_chai_lounge', 'plot_hammocks', 'plot_biergarten'];
    const n = this.input.touch ? 8 : 14;
    for (let i = 0; i < n; i++) {
      const def = makeCamper(500 + i);
      def.id = `walker_${i}`;
      def.behavior = 'wander';
      def.home = stops[i % stops.length];
      def.radius = 16;
      const npc = new NPC(def, this.world, this.npcs);
      // somewhere along the way between base and Firespace
      const t = 0.15 + (i / n) * 0.75;
      npc.root.position.set(a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 20, 0, a.z + (b.z - a.z) * t + (Math.random() - 0.5) * 20);
      this.world.colliders.resolve(npc.root.position, 0.4);
      this.npcs.map.set(def.id, npc);
      this.routeWalkers.push(npc);
    }
  }

  clearRouteWalkers() {
    for (const n of this.routeWalkers || []) { this.world.scene.remove(n.root); this.npcs.map.delete(n.def.id); }
    this.routeWalkers = [];
  }

  /** Thomas now and then jumps in and does one of your remaining work targets (masts, wires, tarps…). */
  updateThomas(dt) {
    const th = this.npcs.get('thomas');
    if (!th || th.hidden || th.task || th.incident || th.knocked) return;
    this.thomasCD = (this.thomasCD ?? 45) - dt;
    if (this.thomasCD > 0) return;
    this.thomasCD = 10;
    const qs = this.quests;
    for (const qid of Object.keys(qs.state.active)) {
      const st = qs.currentStep(qid);
      if (st?.type !== 'work') continue;
      const a = qs.state.active[qid];
      const open = st.targets.map((n, i) => i).filter((i) => !a.done.includes(i));
      if (open.length < 2) continue; // leave the last one to you
      // leave you the one closest to you, take the one closest to him
      const pp = this.player.position;
      const sp = (i) => this.world.spots[st.targets[i]];
      const mine = open.reduce((b, i) => (sp(i).distanceTo(pp) < sp(b).distanceTo(pp) ? i : b), open[0]);
      const idx = open.filter((i) => i !== mine).sort((x, y) => sp(x).distanceTo(th.position) - sp(y).distanceTo(th.position))[0];
      const spot = this.world.spots[st.targets[idx]];
      const de = getLang() === 'de';
      th.say(de ? 'Warte, ich helf dir! Ich übernehm den da hinten!' : "Hold on, I will help! I will take the one over there!", 3.5);
      this.ui.toast(de ? `🤝 Thompsen hilft dir: „${L(st.label)}“ – einen übernimmt er.` : `🤝 Thompsen is helping: "${L(st.label)}" – he takes one.`);
      // far away and out of sight? then he "was already over there anyway"
      if (th.position.distanceTo(spot) > 60 && th.toPlayer > 40) {
        const d = new THREE.Vector3().subVectors(th.position, spot).setY(0).normalize();
        th.root.position.set(spot.x + d.x * 20, 0, spot.z + d.z * 20);
        this.world.colliders.resolve(th.root.position, 0.4);
      }
      th.task = {
        phase: 'go', pos: () => spot, arriveDist: 1.6, workTime: (st.workTime || 2.5) + 1.5, speed: 4.2, anim: 'run',
        arriveLine: de ? 'So, den mach ich!' : "Right, I have got this one!",
        then: () => {
          const cur = qs.state.active[qid];
          if (cur && qs.currentStep(qid) === st && !cur.done.includes(idx)) qs.workDone(qid, idx);
          th.say(de ? 'Erledigt! Sag Bescheid, wenn du noch was brauchst!' : 'Done! Let me know if you need anything else!', 3.5);
        },
      };
      this.thomasCD = 110 + Math.random() * 70;
      return;
    }
  }

  /** An NPC crew builds a structure while it grows out of the ground. */
  crewBuild(b) {
    const plot = PLOTS[b.plot];
    const de = getLang() === 'de';
    const names = b.crew.npcs.map((id) => this.npcs.get(id)?.def.name).filter(Boolean);
    this.ui.banner(de ? 'Die Crew baut!' : 'The crew is building!', `${names.join(' & ')} → ${plot?.label || ''}`, de ? 'Du hast geliefert – den Rest machen sie.' : 'You delivered – they do the rest.', 4500);
    b.crew.npcs.forEach((id, i) => {
      const npc = this.npcs.get(id);
      if (!npc || !plot) return;
      const a = 0.6 + i * 1.3;
      const pos = new THREE.Vector3(plot.pos.x + Math.cos(a) * (plot.size * 0.5 + 1), 0, plot.pos.z + Math.sin(a) * (plot.size * 0.5 + 1));
      npc.task = {
        phase: 'go', pos: () => pos, arriveDist: 2.2, workTime: b.crew.time, speed: 3.6, anim: 'run',
        arriveLine: de ? 'So, jetzt wird gebaut!' : 'Right, time to build!',
        then: () => npc.say(de ? 'Steht! Schön, oder?' : 'It stands! Pretty, right?', 3.5),
      };
    });
  }

  refreshHUD(force) {
    const qs = this.quests;
    const buildable = Object.values(PLOTS).filter((p) => !p.prebuilt).length + 1; // +1: mainstage sails
    const pct = Math.min(1, (qs.state.built.length + ((qs.state.progress.rig?.length ?? qs.state.progress.rig ?? 0) / 12)) / buildable);
    this.readiness = pct;
    this.ui.dayText(this.days.hudText());
    this.ui.stats(qs.state.karma, pct, qs.state.money, qs.state.tickets || 0);
    this.npcs.refreshAppear(qs);
    this.ui.inventory(qs.state.inventory.filter((i) => !isHeavy(i)));
    this.updateMarkers();
    if (force) this.ui.forceRefresh();
  }

  /** Quest markers – hidden while someone is too wasted to talk business. */
  updateMarkers() {
    for (const n of this.npcs.all) {
      if (this.drama.isRedMarked(n)) n.setMarker('red');
      else if (this.effects?.isDealer(n)) n.setMarker('blue');
      else n.setMarker(n.incident && BUSY_MODES.includes(n.incident.mode) ? null : this.quests.npcMarker(n.def.id));
    }
  }

  updateCarried() {
    const inv = this.quests.state.inventory;
    const light = () => inv.filter((id) => !isHeavy(id)).map((id) => { const m = createItemMesh(id); m.scale.multiplyScalar(0.8); return m; });
    const veh = this.player.vehicle;
    this.player.setCarried(veh ? [] : light());
    this.player.char.carrying = !veh && this.player.carried.length > 0;
    this.vehicles.quad.setCargo(veh === this.vehicles.quad ? light() : []);
    this.vehicles.radlader.setCargo(veh === this.vehicles.radlader ? light() : []);
    this.vehicles.radlader.setLoad(inv.filter(isHeavy).map((id) => createItemMesh(id)));
  }

  // ------------------------------------------------------------------ dialog & talking
  speakerInfo(who) {
    if (who === 'you') return { name: t('you'), role: t('youRole'), portrait: '🌀' };
    if (who === 'police') return { name: getLang() === 'de' ? 'Polizei' : 'Police', role: getLang() === 'de' ? 'Streife' : 'Patrol', portrait: '👮' };
    const n = this.npcs.get(who);
    return n ? { name: n.def.name, role: L(n.def.role), portrait: n.def.portrait } : { name: who };
  }

  /** An NPC's answer after a conversation: a proper dialog box, not just a speech bubble. */
  reply(npc, text) {
    return this.runDialog([{ who: npc.def.id, text }], null, npc);
  }

  async runDialog(lines, choices, npc) {
    // dialogs never overlap: a second one waits until the first is closed
    const prev = this._dlgQ || Promise.resolve();
    let release;
    this._dlgQ = new Promise((r) => { release = r; });
    await prev;
    try {
      return await this.showDialog(lines, choices, npc);
    } finally {
      release();
    }
  }

  async showDialog(lines, choices, npc) {
    if (npc) npc.talking = true;
    this.player.frozen = true;
    const r = await this.ui.dialog(lines.map((l) => ({ who: l.who, text: L(l.text) })), (w) => this.speakerInfo(w), choices?.map(L));
    this.player.frozen = false;
    if (npc) npc.talking = false;
    return r;
  }

  async talkTo(npc) {
    const qs = this.quests;
    const id = npc.def.id;
    // Leo can't be talked to. Obviously.
    if (id === 'leo') { this.catchLeo(npc); return; }
    // not registered yet → everybody wants to see your wristband
    if (!this.registered && id !== 'jan') {
      await this.runDialog([{ who: id, text: this.bandLine() }], null, npc);
      return;
    }
    // a beer or two makes you sociable: every chat is worth a bit of karma
    if (this.effects.tipsy && (npc._cheersT ?? -999) < this.time - 60) {
      npc._cheersT = this.time;
      this.quests.state.karma += 2;
      this.ui.toast(getLang() === 'de' ? '🍺 Gesellig! +2 ✺' : '🍺 Sociable! +2 ✺');
      this.refreshHUD();
    }
    // 0) too drunk / high / on keta / being looked after → no business with them
    if (this.drama.victimTalk(npc)) return;
    // 0a) illegal soundbox → tell them off
    if (this.soundbox.isOwner(npc)) { await this.soundbox.scold(npc); return; }
    // 0a) blue "!": someone wants to sell you something
    if (this.effects.isDealer(npc)) { await this.effects.dealerTalk(npc); return; }
    // 0b) player is on keta: the quest giver takes over the current step
    if (this.effects.ketaCharges > 0) {
      const own = Object.keys(qs.state.active).find((qid) => qs.quests[qid].giver === id && !(qs.currentStep(qid)?.type === 'talk' && qs.currentStep(qid)?.npc === id));
      if (own) {
        const de = getLang() === 'de';
        await this.runDialog([{ who: id, text: de ? `Oh… du bist voll auf Keta, oder? Keine Sorge, ich mach das schon: „${L(qs.currentStep(own).text)}“.` : `Oh… you\'re totally on keta, right? Don\'t worry, I\'ll do it: "${L(qs.currentStep(own).text)}".` }], null, npc);
        this.effects.ketaCharges--;
        qs.ketaSkip(own);
        this.refreshHUD();
        return;
      }
    }
    // 0b2) a job that needs karma
    const kq = Object.keys(qs.state.active).find((qid) => qs.currentStep(qid)?.type === 'karma' && qs.quests[qid].giver === id);
    if (kq) {
      const st = qs.currentStep(kq), a = qs.state.active[kq];
      const have = Math.floor(qs.state.karma), need = a.need;
      if (have >= need) {
        await this.runDialog(st.okDialog || [{ who: id, text: { de: 'Passt. Respekt.', en: 'Fine. Respect.' } }], null, npc);
        qs.state.karma -= need;
        this.ui.toast(`✺ −${need}`);
        qs.advance(kq);
      } else {
        await this.runDialog([{ who: id, text: L(st.notYet).replace('{need}', need).replace('{have}', have).replace('{missing}', need - have) }], null, npc);
      }
      this.refreshHUD();
      return;
    }
    // 0c) a failed timed job waits for a restart
    const retry = qs.restartFor(id);
    if (retry) {
      const de = getLang() === 'de';
      const c = await this.runDialog([{ who: id, text: de ? `Nochmal „${L(qs.quests[retry].title)}“? Die Uhr läuft, sobald du Ja sagst.` : `Another go at "${L(qs.quests[retry].title)}"? The clock starts as soon as you say yes.` }],
        [de ? 'Los geht\'s!' : 'Let\'s go!', de ? 'Gleich.' : 'In a bit.'], npc);
      if (c === 0) qs.restartTimed(retry);
      this.refreshHUD();
      return;
    }
    // 1) a quest step wants us to talk to this NPC
    const talk = qs.consumeTalk(id);
    if (talk) {
      await this.runDialog(talk.dialog, null, npc);
      talk.onDone();
      return;
    }
    // 1b) drama: helpers
    if (await this.drama.helperTalk(npc)) return;
    // 2) NPC offers a quest
    const offer = qs.offeredBy(id)[0];
    if (offer && offer.timeLimit && qs.timer) {
      await this.runDialog([{ who: id, text: { de: 'Du hast grad schon eine Zeit-Mission am Laufen. Mach die erst fertig!', en: 'You already have a timed job running. Finish that first!' } }], null, npc);
      return;
    }
    if (offer) {
      const choice = await this.runDialog(offer.offer, [offer.accept || 'OK', offer.decline || '…'], npc);
      if (choice === 0) qs.accept(offer.id);
      else await this.reply(npc, t('d.later'));
      this.refreshHUD();
      return;
    }
    // 3) mechanics fix the quad
    const quad = this.vehicles.quad;
    if ((id === 'flo' || id === 'andi') && quad.broken && !quad.repairing) {
      const de = getLang() === 'de';
      await this.runDialog([
        { who: 'you', text: de ? 'Das Quad ist verreckt…' : 'The quad died…' },
        { who: id, text: de ? 'Schon wieder? *trinkt aus* Ich komm. Wo steht\'s?' : 'Again? *finishes beer* I\'m coming. Where is it?' },
      ], null, npc);
      quad.repairing = true;
      npc.task = {
        phase: 'go', pos: () => quad.position, arriveDist: 2.5, workTime: 5, speed: 4.5,
        arriveLine: de ? 'Ah. Klassiker. Zündkerze. Und Gaffa.' : 'Ah. Classic. Spark plug. And gaffa.',
        then: () => {
          quad.repair();
          for (const m of ['flo', 'andi'].map((i) => this.npcs.get(i))) if (m?.homeBackup) { m.home = m.homeBackup; m.homeBackup = null; m.target = null; }
          this.economy.spend(150, { de: 'Quad-Reparatur (Zündkerze, Gaffa)', en: 'Quad repair (spark plug, gaffa)' });
          quad.repairing = false;
          npc.say(de ? 'Läuft. Fahr nicht so viel. Oder doch, dann seh ich dich wieder.' : 'Runs. Don\'t drive so much. Or do, then I\'ll see you again.', 4);
          this.ui.toast(t('t.quadFixed'));
          this.audio.accept();
        },
      };
      return;
    }
    // 4a) Thompsen & Zdenko push stuck vehicles back to the base
    if (id === 'thompsen') { await this.thompsenTalk(npc); return; }
    // 4) Mark & Fabi sell things for karma
    if (await this.effects.vendorTalk(npc)) return;
    // 5) a little conversation with answer options (karma +/-)
    if (!this.effects.high && await this.chatWith(npc)) return;
    // 6) small talk (context aware for quest givers – and they notice when you're high)
    let line = this.effects.comment() || npc.line();
    const own = Object.keys(qs.state.active).find((qid) => qs.quests[qid].giver === id);
    if (own && !this.effects.high) {
      const st = qs.currentStep(own);
      const title = L(qs.quests[own].title);
      const name = npc.def.name;
      let step = L(st?.text) || '';
      const de = getLang() === 'de';
      if (st?.type === 'talk' && st.npc === id) {
        // their crew is still building / they're still busy: say so instead of "let X build"
        line = de ? `Ich bin noch dran an „${title}“! Gib mir noch einen Moment – schau gleich nochmal vorbei.` : `I'm still working on "${title}"! Give me a moment – come back in a bit.`;
      } else {
        if (step.includes(name)) {
          step = de
            ? step.replaceAll(` zu ${name}`, ' zu mir').replaceAll(` mit ${name}`, ' mit mir').replaceAll(` für ${name}`, ' für mich').replaceAll(` ${name}s `, ' meine ').replaceAll(name, 'mir')
            : step.replaceAll(` to ${name}`, ' to me').replaceAll(` with ${name}`, ' with me').replaceAll(` for ${name}`, ' for me').replaceAll(`${name}'s`, 'my').replaceAll(name, 'me');
        }
        line = t('d.howGoing', { title, step });
      }
    }
    const de = getLang() === 'de';
    // Aylien: a hug now and then lifts your karma
    if (id === 'aylien' && (npc._hugT ?? -999) < this.time - 180) {
      npc._hugT = this.time;
      line = de ? 'Komm her, Umarmung! 🫶 Du schaffst das. Ehrlich. Ich glaub an dich.' : 'Come here, hug! 🫶 You\'ve got this. Honestly. I believe in you.';
      qs.state.karma += 3;
      this.ui.toast(de ? '🫶 Aylien baut dich auf. +3 ✺' : '🫶 Aylien lifts you up. +3 ✺');
      this.refreshHUD();
    }
    // Jules: steps in, carries for a bit, hands you a water
    if (id === 'jules' && (npc._helpT ?? -999) < this.time - 120) {
      npc._helpT = this.time;
      line = de ? 'Hier, trink erstmal ein Wasser. Ich halt das so lange. Kein Ding! 🤗' : 'Here, have some water first. I\'ll hold that. No worries! 🤗';
      this.player.stamina = 1;
      qs.state.karma += 2;
      this.ui.toast(de ? '🤗 Jules hilft dir – Ausdauer voll, +2 ✺' : '🤗 Jules helps you out – stamina full, +2 ✺');
      this.refreshHUD();
    }
    const ask = this.effects.canAsk(npc);
    const choice = await this.runDialog([{ who: id, text: line }], ask ? [de ? 'Bis später!' : 'See you!', de ? '👀 Hast du was dabei?' : '👀 Got anything on you?'] : null, npc);
    if (ask && choice === 1) await this.effects.stashTalk(npc);
  }

  /** The festival only opens once every job is done (errands don't count). */
  checkFinale(data) {
    const qs = this.quests;
    const left = Object.values(qs.quests).filter((q) => !q.errand && !q.id.startsWith('err_') && !qs.isDone(q.id));
    const de = getLang() === 'de';
    if (!left.length) { setTimeout(() => this.finaleSys.run(), data.outro ? 7000 : 3000); return; }
    if (left.length <= 3) {
      setTimeout(() => this.ui.toast(de
        ? `🎪 Noch ${left.length === 1 ? 'ein Job' : `${left.length} Jobs`}, dann öffnet das Festival: ${left.map((q) => L(q.title)).join(', ')}`
        : `🎪 ${left.length === 1 ? 'One more job' : `${left.length} more jobs`} until the festival opens: ${left.map((q) => L(q.title)).join(', ')}`), 2500);
    }
  }

  /** You actually caught Leo (speed, cornering, luck): he hands you a drink token and vanishes. */
  async catchLeo(npc) {
    if (this._leoBusy || this.mode !== 'play') return;
    this._leoBusy = true;
    const de = getLang() === 'de';
    npc.char.faceTowards(this.player.position, 1, 100);
    await this.runDialog([
      { who: 'leo', text: de ? 'Oh! Äh… HI! Du hast mich… eingeholt? Das passiert nie. Ähm. Hm.' : 'Oh! Uh… HI! You… caught me? That never happens. Uhm. Hm.' },
      { who: 'leo', text: de ? 'Hier, nimm eine Getränkemarke! Die sind super selten. Nicht weitersagen. Ich muss jetzt ganz dringend… da hin. TSCHÜSS!' : 'Here, have a drink token! They are super rare. Do not tell anyone. I really have to go… over there. BYE!' },
    ], null, npc);
    const qs = this.quests;
    qs.state.flags.drinkTokens = (qs.state.flags.drinkTokens || 0) + 1;
    qs.state.karma += 30;
    this.audio.pickup();
    this.ui.toast(de ? `🎟️ Getränkemarke von Leo! (+30 ✺) – jetzt weißt du, wer die Marken hat. (${qs.state.flags.drinkTokens} gesammelt)` : `🎟️ Drink token from Leo! (+30 ✺) – now you know who has the tokens. (${qs.state.flags.drinkTokens} collected)`);
    this.world.spawnDust(npc.position.clone(), 2.5);
    npc.relocate(this.player.position);
    this.refreshHUD();
    this._leoBusy = false;
  }

  bandLine() {
    const de = getLang() === 'de';
    const lines = de
      ? ['Hast du ein Bändchen?! Nein? Dann ab zu Jan ins Büro!', 'HAST DU EIN BÄNDCHEN? …Dachte ich mir. Büro-Container, Jan!', 'Ohne Bändchen kein Aufbau. Jan sitzt im Büro.', 'Bändchen? Zeig mal! …Keins? JAN!']
      : ['Do you have a wristband?! No? Go see Jan in the office!', 'DO YOU HAVE A WRISTBAND? …Thought so. Office container, Jan!', 'No wristband, no building. Jan is in the office.', 'Wristband? Show me! …None? JAN!'];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  onLeoSeen() {
    const now = performance.now();
    if (now - (this.lastLeo || 0) > 25000) {
      this.lastLeo = now;
      this.ui.toast(t('t.leoSeen'));
    }
  }

  // ------------------------------------------------------------------ jobs: build / work / fuel / load
  startBuild(qid, step) {
    if (this.building) return;
    if (this.player.vehicle) this.exitVehicle();
    const dur = (step.buildTime || 3) * this.effects.buildFactor();
    this.building = { t: 0, dur, lastHit: 0, labels: t('b.labels'), done: () => this.quests.build(qid) };
    this.player.work(dur);
    const plot = PLOTS[step.build?.plot];
    if (plot) this.player.char.faceTowards(new THREE.Vector3(plot.pos.x, 0, plot.pos.z), 1, 100);
  }

  startWork(qid, idx, step) {
    if (this.building || this.minigame.open) return;
    if (step.minigame) {
      const de = getLang() === 'de';
      const title = L(step.minigameTitle) || L(step.label);
      this.player.frozen = true;
      this.minigame.run(step.minigame, { title, ...(step.minigameOpts || {}) }).then((ok) => {
        this.player.frozen = false;
        if (ok) { this.player.work(0.8); this.quests.workDone(qid, idx); }
        else this.ui.toast(L(step.minigameFail) || (de ? 'Daneben! Nochmal.' : 'Missed! Again.'));
      });
      return;
    }
    const dur = (step.workTime || 2.5) * this.effects.buildFactor();
    this.building = { t: 0, dur, lastHit: 0, labels: [L(step.label) + '…'], done: () => this.quests.workDone(qid, idx) };
    this.player.work(dur);
    const ms = this.world.structures.mainstage;
    if (ms) this.player.char.faceTowards(ms.object.position, 1, 100);
  }

  startFuel(qid) {
    if (this.building) return;
    this.building = { t: 0, dur: 2.5, lastHit: 0, labels: [getLang() === 'de' ? 'Gluck gluck gluck…' : 'Glug glug glug…'], done: () => this.quests.fuel(qid) };
    this.player.work(2.5);
  }

  fuelVehicle(id) {
    const v = this.vehicles[id];
    if (v) v.fuel = 1;
    this.ui.toast(t('t.fueled'));
    this.audio.accept();
  }

  loadIntoBucket(itemId) {
    const l = this.vehicles.radlader;
    if (this.loading) return;
    this.loading = true;
    l.dip(() => { this.quests.pickUp(itemId, true); this.loading = false; });
  }

  updateBuilding(dt) {
    const b = this.building;
    if (!b) return;
    b.t += dt;
    if (b.t - b.lastHit > 0.45) { b.lastHit = b.t; this.audio.hammer(); }
    const labels = b.labels;
    this.ui.progress(b.t / b.dur, labels[Math.min(labels.length - 1, Math.floor((b.t / b.dur) * labels.length))]);
    if (b.t >= b.dur) {
      this.ui.progress(null);
      this.building = null;
      b.done();
    }
  }

  // ------------------------------------------------------------------ interaction
  interactionCandidates() {
    const p = this.player.position;
    const list = [];
    const veh = this.player.vehicle;
    const { quad, radlader } = this.vehicles;
    if (veh) {
      list.push({ d: 50, label: t('p.exit'), action: () => this.exitVehicle() });
      const tank = this.world.spots.diesel_tank;
      if (veh === radlader && this.quests.state.flags.fuelUnlocked && tank && radlader.position.distanceTo(tank) < 5 && radlader.fuel < 0.95) {
        list.push({ d: 1, label: t('p.refuel'), action: () => { this.fuelVehicle('radlader'); this.economy.spend(80, { de: 'Diesel', en: 'Diesel' }); } });
      }
    } else {
      for (const n of this.npcs.all) {
        if (n.hidden) continue;
        const d = n.position.distanceTo(p);
        if (d < 3) {
          const mk = this.quests.npcMarker(n.def.id);
          // quest-relevant people first; plain small talk loses against jobs nearby
          const relevant = mk || this.drama.events.some((e) => e.victims.includes(n) || (e.discovered && !e.helping && e.def.helpers.includes(n.def.id)));
          const red = this.drama.isRedMarked(n);
          const blue = this.effects.isDealer(n);
          list.push({ d: d + (relevant || blue ? -1 : 1.8), label: `${t('p.talk', { name: n.def.name })}${red ? ' <b style="color:#ff3b30">!</b>' : blue ? ' <b style="color:#3aa0ff">!</b>' : mk ? ` <b style="color:${mk === '!' ? '#ffd21f' : '#7fe0ff'}">${mk}</b>` : ''}`, action: () => this.talkTo(n) });
        }
      }
      // the Trigel (hedgehog) looking for crumbs in the Aufenthaltszelt
      if (this.trigel.near(p)) {
        list.push({ d: this.trigel.position.distanceTo(p) + 1.5, label: getLang() === 'de' ? '🦔 Trigel begrüßen' : '🦔 Say hi to the Trigel', action: () => {
          this.ui.toast(this.trigel.pet());
          if (!this.trigel.petted) { this.trigel.petted = true; this.quests.state.karma += 1; this.refreshHUD(); }
        } });
      }
      for (const v of [quad, radlader]) {
        const d = v.position.distanceTo(p);
        if (d > v.o.radius + 1.6) continue;
        if (v === quad && quad.broken) list.push({ d: d + 0.5, label: t('p.quadBroken'), disabled: true });
        else if (v === radlader && radlader.fuel <= 0) list.push({ d: d + 2, label: t('p.loaderEmpty'), disabled: true });
        else list.push({ d: d + 0.5, label: v === quad ? t('p.enterQuad') : t('p.enterLoader'), action: () => this.enterVehicle(v) });
      }
    }
    list.push(...this.quests.interactables(p, { vehicle: veh, loader: radlader }));
    list.sort((a, b) => (!!a.disabled - !!b.disabled) || (a.d - b.d));
    return list;
  }

  /** Sabse enforces the kitchen rules: no running, no jumping, no vehicles. First a warning, then she throws you out. */
  checkKitchen(dt) {
    const z = this.world.kitchenZone;
    if (!z) return;
    const p = this.player.position;
    this.kitchenCD = Math.max(0, (this.kitchenCD || 0) - dt);
    if (Math.hypot(p.x - z.x, p.z - z.z) > z.r || this.kitchenCD > 0) return;
    const pl = this.player;
    const speed = pl.vehicle ? Math.abs(pl.vehicle.speed) : Math.hypot(pl.vel.x, pl.vel.z);
    const bad = pl.vehicle ? 2 : pl.jumping ? 4 : (pl.sprinting && speed > 6.5) ? 1 : -1;
    if (bad < 0) return;
    const sabse = this.npcs.get('sabse');
    if (sabse.incident) return;
    const de = getLang() === 'de';
    const qs = this.quests;
    // working for Sabse (e.g. veggie delivery) → she only grumbles
    const forSabse = Object.keys(qs.state.active).some((qid) => {
      const st = qs.currentStep(qid);
      return qs.quests[qid].giver === 'sabse' || (st?.type === 'talk' && st.npc === 'sabse') || (st?.type === 'deliver' && st.at === 'kitchen');
    });
    const now = this.time;
    this.kitchenStrikes = now - (this.kitchenLast || -99) < 15 ? (this.kitchenStrikes || 0) + 1 : 1;
    this.kitchenLast = now;
    sabse.angryT = 2;
    if (forSabse || this.kitchenStrikes === 1) {
      sabse.say(forSabse ? (de ? 'Danke fürs Bringen – aber LANGSAM in meiner Küche!' : 'Thanks for bringing it – but SLOWLY in my kitchen!') : (de ? 'Hey! Das ist eine Küche! Letzte Warnung!' : 'Hey! This is a kitchen! Last warning!'), 3);
      this.kitchenCD = 3;
      return;
    }
    const lines = sabse.def.angryLines;
    sabse.say(lines[bad] || lines[0], 3.5);
    this.kitchenCD = 4;
    this.cam.shake = 0.5;
    this.audio.angry();
    this.ui.toast(t('t.kitchen'));
    if (pl.vehicle) pl.vehicle.speed = -Math.sign(pl.vehicle.speed || 1) * 4;
    else pl.shove(new THREE.Vector3(z.x, 0, z.z), 11);
  }

  // ------------------------------------------------------------------ save / load
  save() {
    if (!this.quests) return;
    const { quad, radlader } = this.vehicles;
    const vs = (v) => ({ x: v.position.x, z: v.position.z, h: v.heading });
    const data = {
      v: 2,
      quests: this.quests.serialize(),
      player: { x: this.player.position.x, z: this.player.position.z, r: this.headingOf() },
      vehicles: { quad: { ...vs(quad), broken: quad.broken, odo: quad.odometer }, radlader: { ...vs(radlader), fuel: radlader.fuel } },
      introShown: this.introShown,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }

  load() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch { return false; }
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this.quests.restore(data.quests);
      this.days.migrate();
      this.days.applyLoaded();
      this.player.root.position.set(data.player.x, 0, data.player.z);
      this.player.root.rotation.y = data.player.r;
      this.cam.yaw = data.player.r + Math.PI;
      const { quad, radlader } = this.vehicles;
      if (data.vehicles) {
        quad.place(data.vehicles.quad, data.vehicles.quad.h);
        quad.broken = !!data.vehicles.quad.broken;
        quad.odometer = data.vehicles.quad.odo || 0;
        radlader.place(data.vehicles.radlader, data.vehicles.radlader.h);
        radlader.fuel = data.vehicles.radlader.fuel || 0;
      }
      this.introShown = data.introShown;
      this.applyProgressLevel();
      return true;
    } catch (e) {
      console.warn('Save broken, starting fresh', e);
      return false;
    }
  }

  // ------------------------------------------------------------------ loop
  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const time = this.time;
    const inp = this.input;
    const ctx = { player: this.player, game: this };

    if (this.mode === 'menu' || this.mode === 'loading') {
      // cinematic orbit around the festival ground & dragon – until you grab the controls and fly yourself
      this.fly.active = this.mode === 'menu' && !this.ui.modalOpen;
      this.fly.update(dt, time, { controls: this.fly.active, menu: true });
      this.fly.apply(this.camera, dt);
      this.world.update(time, dt, this.player.position);
      this.npcs.update(time, dt, ctx);
      this.world.followSun(this.fly.focus(this._sunFocus ||= new THREE.Vector3()));
      this.music.update(this.camera.position, this.camera);
      this.renderer.render(this.scene, this.camera);
      inp.endFrame();
      return;
    }

    if (this.mode === 'map') {
      this.ui.drawBigMap(this.player.position, this.headingOf(), [...this.quests.trackedObjectives(), ...this.drama.objectives(), ...this.soundbox.objectives()], this.npcs.all.filter((n) => !n.hidden), this.quests, this.quests.state.built, this.vehicles);
      if (this._mapKeyReady && (inp.keys.has('KeyM') || inp.keys.has('Escape'))) { this._mapKeyReady = false; this.resume(); }
      if (!inp.keys.has('KeyM') && !inp.keys.has('Escape')) this._mapKeyReady = true;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const playing = this.mode === 'play';
    const paused = this.mode === 'pause';
    this.fly.active = paused && !this.ui.modalOpen;
    if (paused && !this.ui.modalOpen && inp.hit('Escape')) this.resume();
    if (playing) {
      if (inp.hit('Escape')) this.pause();
      if (this.minigame.open) inp.pressed.clear();
      if (inp.hit('KeyM')) { this._mapKeyReady = false; this.openMap(); }
      if (inp.hit('KeyJ')) this.openQuestLog();
      if (inp.hit('KeyN')) this.ui.toast(this.toggleMute() ? t('t.mute') : t('t.unmute'));
      if (inp.hit('KeyF') && !this.player.vehicle) this.player.wave();
      if (inp.hit('KeyT')) {
        const ids = Object.keys(this.quests.state.active);
        if (ids.length > 1) {
          this.quests.state.tracked = ids[(ids.indexOf(this.quests.state.tracked) + 1) % ids.length];
          this.quests.refreshMarkers();
        }
      }
      // AFK tracking (Zdenko loves AFK people)
      const active = inp.keys.size > 0 || inp.mouseDX || inp.mouseDY || inp.wheel;
      this.afkTime = active || this.ui.dialogOpen ? 0 : this.afkTime + dt;
    }

    const canMove = playing && !this.ui.dialogOpen;
    const veh = this.player.vehicle;
    for (const v of Object.values(this.vehicles)) v.update(dt, canMove && veh === v && !this.building ? inp : null);
    if (canMove) this.player.update(dt, this.cam.moveYaw);
    else this.player.char.update(dt);

    if (!veh && this.player.moved - (this._lastStep || 0) > 1.4) { this._lastStep = this.player.moved; this.audio.step(); }
    this.audio.engine(veh ? veh.kmh / 50 : 0, !!veh && veh.canDrive());

    this.npcs.update(time, dt, ctx);
    if (playing && veh) this.checkRunOver(veh);
    this.quests.update(time, dt, this.player.position);
    this.world.update(time, dt, this.player.position);
    this.trigel.update(dt, time, this.player.vehicle ? this.player.vehicle.position : this.player.position, this.world.night);
    this.updateBuilding(dt);
    if (playing) {
      this.checkKitchen(dt);
      this.economy.update(dt, this.readiness || 0);
      this.drama.update(dt);
      this.updateNight(dt);
      this.shoutWristband(dt);
      if (inp.hit('F9')) this.world.toggleColliderDebug();
      this.effects.update(dt);
      this.police.update(dt);
      this.soundbox.update(dt);
      this.updateThomas(dt);
      this.errands.update(dt);
      this.days.update();
      this.parking.update(dt);
      // safety net: vehicles wedged into something (new stage, posts, masts…) get freed
      this._unstickT = (this._unstickT || 0) - dt;
      if (this._unstickT <= 0) {
        this._unstickT = 1;
        for (const v of Object.values(this.vehicles)) if (Math.abs(v.speed) < 0.5) v.unstick(null, 0.6);
      }
      this._markerT = (this._markerT || 0) - dt;
      if (this._markerT <= 0) { this._markerT = 0.5; this.updateMarkers(); }
    }

    // touch controls only while actually playing
    if (this.touch) {
      const want = playing && !this.ui.dialogOpen;
      if (want !== this._touchShown) { this._touchShown = want; this.touch.show(want); }
    }
    // interaction prompt
    if (playing && !this.ui.dialogOpen && !this.building) {
      const best = this.interactionCandidates()[0];
      this.ui.prompt(best?.label, best?.disabled);
      this.touch?.setAction(best?.label, best?.disabled);
      if (best && !best.disabled && inp.hit('KeyE') && performance.now() - this.ui.dialogClosedAt > 250) best.action();
    } else this.ui.prompt(null);

    const indoor = this.world.isInside(this.player.position);
    const moving = veh ? Math.min(1, Math.abs(veh.speed) / 4) : Math.min(1, Math.hypot(this.player.vel.x, this.player.vel.z) / 4);
    if (this.sceneCam) { // cut scene camera (finale)
      this.camera.position.copy(this.sceneCam.pos);
      this.camera.lookAt(this.sceneCam.look);
    } else if (paused) {
      this.fly.update(dt, time, { controls: this.fly.active });
      this.fly.flown = true;
    } else {
      this.cam.update(dt, this.player.position, { indoor, blockers: veh ? null : this.world.cameraBlockers, heading: this.headingOf(), moving, vehicle: !!veh });
    }
    this.fly.apply(this.camera, dt);
    this.world.followSun(paused ? this.fly.focus(this._sunFocus ||= new THREE.Vector3()) : this.player.position);

    // HUD
    this.ui.tracker(this.quests, this.player.position, this.drama);
    this.ui.stamina(veh ? 1 : this.player.stamina);
    this.ui.vehicleHud(veh);
    this.ui.drawMinimap(this.player.position, this.headingOf(), this.cam.yaw, [...this.quests.trackedObjectives(), ...this.drama.objectives(), ...this.soundbox.objectives()], this.npcs.all.filter((n) => !n.hidden), this.quests, this.vehicles);
    this.ui.overlays(this.npcs.all.filter((n) => !n.hidden), this.camera, this.player.position);
    this.music.update(paused ? this.camera.position : this.player.position, this.camera);

    this.renderMain();
    inp.endFrame();
  }

  /** Normal render – with trails (afterimage) while you're on keta. */
  renderMain() {
    const fx = this.effects;
    if (fx.ketaT > 0) {
      if (!this.post) {
        const c = new EffectComposer(this.renderer);
        c.setPixelRatio(1); // trails don't need retina resolution – keeps it smooth
        c.addPass(new RenderPass(this.scene, this.camera));
        this.afterimage = new AfterimagePass(0.9);
        c.addPass(this.afterimage);
        c.addPass(new OutputPass());
        this.post = c;
      }
      // fade in / out with the effect
      this.afterimage.uniforms.damp.value = (fx.ketaLevel >= 2 ? 0.84 : 0.76) * Math.min(1, fx.ketaT / 8);
      this.post.render();
    } else this.renderer.render(this.scene, this.camera);
  }

  /** Answer options: named people have their own chats (each once), volunteers share a pool. */
  async chatWith(npc) {
    const id = npc.def.id;
    const flags = this.quests.state.flags;
    flags.chats ||= [];
    let chat = null, key = null;
    const own = CHATS[id] || [];
    const i = own.findIndex((_, k) => !flags.chats.includes(`${id}#${k}`));
    if (i >= 0) { chat = own[i]; key = `${id}#${i}`; }
    else if (id.startsWith('camper_') && !npc._chatted && Math.random() < 0.7) {
      chat = CAMPER_CHATS[(npc._chatIdx ??= Math.floor(Math.random() * CAMPER_CHATS.length))];
    }
    if (!chat) return false;
    const choice = await this.runDialog([{ who: id, text: chat.line }], chat.options.map((o) => o.text), npc);
    const o = chat.options[choice] || chat.options[0];
    if (key) flags.chats.push(key); else npc._chatted = true;
    await this.reply(npc, L(o.reply));
    if (o.karma) {
      this.quests.state.karma = Math.max(0, this.quests.state.karma + o.karma);
      this.ui.toast(o.karma > 0 ? `💬 +${o.karma} ✺` : `💬 ${o.karma} ✺`);
      this.refreshHUD();
    }
    return true;
  }

  /** Thompsen at the beer bench: beer, or he and Zdenko bring stuck vehicles back to the base. */
  async thompsenTalk(npc) {
    const de = getLang() === 'de';
    const karma = this.quests.state.karma;
    const choice = await this.runDialog(
      [{ who: 'thompsen', text: de ? `HAHAHA! Was brauchst du? Bier? Oder steckt wieder was fest? HAHAHA! (Du hast ✺ ${karma})` : `HAHAHA! What do you need? Beer? Or is something stuck again? HAHAHA! (You have ✺ ${karma})` }],
      [de ? '🍺 Bier (✺ 5)' : '🍺 Beer (✺ 5)', de ? '🚜 Fahrzeuge zurück in die Base bringen' : '🚜 Bring the vehicles back to the base', de ? 'Nichts, danke.' : 'Nothing, thanks.'],
      npc,
    );
    if (choice === 0) {
      if (this.effects.buy('beer')) await this.reply(npc, de ? 'Prost! HAHAHA!' : 'Cheers! HAHAHA!');
      else await this.reply(npc, de ? 'Kein Karma? HAHAHA! Dann halt Wasser.' : 'No karma? HAHAHA! Water then.');
    } else if (choice === 1) {
      if (this.player.vehicle) this.exitVehicle();
      const vs = this.world.vehicleSpots;
      for (const [id, v] of Object.entries(this.vehicles)) { v.place(vs[id].pos, vs[id].heading); v.speed = 0; }
      await this.reply(npc, de ? 'Zdenko und ich schieben das! …Zdenko schiebt. Ich lach. HAHAHA!' : 'Zdenko and I will push it! …Zdenko pushes. I laugh. HAHAHA!');
      this.ui.toast(de ? '🚜 Quad und Radlader stehen wieder in der Crew-Base.' : '🚜 Quad and wheel loader are back at the crew base.');
    } else await this.reply(npc, npc.line());
  }

  /** The quad died: Flo or Wasser Andi just happen to be hanging around nearby (with a beer). */
  mechanicNearby() {
    const q = this.vehicles.quad;
    const qp = q.position;
    const mechs = ['flo', 'andi'].map((id) => this.npcs.get(id)).filter((n) => n && !n.hidden && !n.task && !n.incident && !n.talking);
    if (!mechs.length) return;
    const m = mechs.sort((a, b) => a.position.distanceTo(qp) - b.position.distanceTo(qp))[0];
    if (m.position.distanceTo(qp) > 30) {
      // "was just passing by": appear a bit away, out of the way
      const a = Math.random() * Math.PI * 2;
      m.root.position.set(qp.x + Math.cos(a) * 16, 0, qp.z + Math.sin(a) * 16);
      this.world.colliders.resolve(m.root.position, 0.4);
    }
    if (!m.homeBackup) m.homeBackup = m.home.clone();
    m.home = new THREE.Vector3(qp.x + 5, 0, qp.z + 4);
    m.target = null;
    m.say(getLang() === 'de' ? 'Hab ich da grad was knallen hören? *trinkt*' : 'Did I just hear something go bang? *drinks*', 4);
    this.hangingMechanic = m;
  }

  /** Quad / wheel loader vs. people: they fly, get up and let you know what they think. */
  checkRunOver(veh) {
    if (Math.abs(veh.speed) < 2.2) return;
    const vp = veh.position;
    const reach = (veh.o.radius || 1.5) * 0.8 + 0.45;
    const fwd = new THREE.Vector3(Math.sin(veh.heading), 0, Math.cos(veh.heading)).multiplyScalar(Math.sign(veh.speed));
    for (const n of this.npcs.all) {
      if (n.hidden || n.knocked || n.talking || n.def.id === 'leo') continue;
      const dx = n.position.x - vp.x, dz = n.position.z - vp.z;
      const d = Math.hypot(dx, dz);
      if (d > reach) continue;
      const dir = new THREE.Vector3(dx / (d || 1), 0, dz / (d || 1)).add(fwd).normalize();
      const r = this.knockReaction(n);
      if (!n.knock(dir, Math.abs(veh.speed), r)) continue;
      veh.speed *= 0.6;
      this.cam.shake = 0.35;
      this.audio.noise?.(0.12, { vol: 0.5, freq: 300 });
      this.audio.tone?.(180, 0.15, { type: 'square', vol: 0.12, slide: -0.5 });
      this.quests.state.karma = Math.max(0, this.quests.state.karma - r.karma);
      const de = getLang() === 'de';
      this.ui.toast(de ? `💥 ${n.def.name} umgefahren! −${r.karma} ✺` : `💥 Ran over ${n.def.name}! −${r.karma} ✺`);
      // the quad express fails right away
      const tm = this.quests.timer;
      if (tm && !tm.expired && this.quests.quests[tm.qid]?.noRunOver) { tm.failReason = 'runover'; tm.left = 0.01; }
      this.refreshHUD();
    }
  }

  knockReaction(n) {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const wasted = n.def.stoned || ['drunk', 'high', 'keta', 'wasted', 'lying'].includes(n.incident?.mode) || ['estenko', 'thompsen', 'rocky', 'strom_andi'].includes(n.def.id) || !!n.party;
    const r = Math.random();
    if ((wasted && r < 0.75) || r < 0.15) {
      return { karma: 3, oblivious: true, shout: { de: 'Huiii…', en: 'Wheee…' }, line: pick([
        { de: 'Huch… war das ein Windstoß?', en: 'Huh… was that a gust of wind?' },
        { de: 'Woah… ich bin geflogen. Nochmal!', en: 'Whoa… I flew. Again!' },
        { de: 'Hab ich was verpasst? …Egal, schön hier unten.', en: 'Did I miss something? …Whatever, it’s nice down here.' },
        { de: 'Hehe… der Boden ist heute ganz weich.', en: 'Hehe… the ground is really soft today.' },
        { de: 'War das ein Radlader oder ein Gefühl?', en: 'Was that a wheel loader or a feeling?' },
      ]) };
    }
    if (r < 0.65) {
      return { karma: 10, shout: { de: 'AAH!', en: 'AAH!' }, line: pick([
        { de: 'Ey! Guck doch, wo du hinfährst!', en: 'Hey! Watch where you’re driving!' },
        { de: 'Aua! Das gibt \'nen blauen Fleck. Danke auch.', en: 'Ouch! That’ll bruise. Thanks a lot.' },
        { de: 'Das ist ein Festival, keine Autobahn!', en: 'This is a festival, not a motorway!' },
        { de: 'Geht\'s noch? Ich lauf hier!', en: 'Seriously? I’m walking here!' },
      ]) };
    }
    return { karma: 20, angry: true, shout: { de: 'WAAAH!!', en: 'WAAAH!!' }, line: pick([
      { de: 'BIST DU WAHNSINNIG?! Ich hol Franzi! Und Jan! Und die POLIZEI!', en: 'ARE YOU INSANE?! I’m getting Franzi! And Jan! And the POLICE!' },
      { de: 'Du hast mich UMGEFAHREN! Mein Chai ist ausgekippt!!', en: 'You RAN ME OVER! My chai is spilled!!' },
      { de: 'Führerschein? HAST DU ÜBERHAUPT EINEN FÜHRERSCHEIN?!', en: 'Licence? DO YOU EVEN HAVE A LICENCE?!' },
      { de: 'Das meld ich Corni! Das meld ich ALLEN!', en: 'I’m reporting this to Corni! To EVERYONE!' },
    ]) };
  }

  /** Night mission visibility, sunrise timer and the player's headlamp. */
  updateNight(dt) {
    const tm = this.quests.timer;
    if (tm?.dusk) this.world.visibility = 14 + 200 * Math.pow(tm.left / tm.total, 0.8);
    if (this.sunriseT > 0) {
      this.sunriseT -= dt;
      if (this.sunriseT <= 0) { this.world.setNight(0, 25); this.world.visibility = 220; }
    }
    const n = this.world.night;
    this.headlamp.intensity = n > 0.3 ? 18 * n : 0;
    this.headlamp.position.set(this.player.position.x, this.player.position.y + 2.2, this.player.position.z);
  }

  shoutWristband(dt) {
    if (this.registered) return;
    this._bandT = (this._bandT || 0) - dt;
    if (this._bandT > 0) return;
    const p = this.player.position;
    const near = this.npcs.all.filter((n) => !n.hidden && n.def.id !== 'jan' && !n.bubble && n.position.distanceTo(p) < 9);
    if (!near.length) return;
    near[Math.floor(Math.random() * near.length)].say(this.bandLine(), 3.5);
    this._bandT = 4 + Math.random() * 3;
  }

  headingOf() {
    return this.player.vehicle ? this.player.vehicle.heading : this.player.root.rotation.y;
  }
}
