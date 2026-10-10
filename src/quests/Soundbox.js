import * as THREE from 'three';
import { mat, box, cyl } from '../world/Props.js';
import { heightAt } from '../world/Height.js';
import { L, getLang } from '../i18n.js';

// Soundboxes are forbidden on the camping. People put them up anyway. You hear them from far away;
// walk over and tell them off → the box goes off and you get karma.

const pick = (a) => a[Math.floor(Math.random() * a.length)];

const SCOLD = [
  { de: 'Ey! Soundboksen sind auf dem Campingplatz verboten. Steht auf den Schildern. Auf ALLEN Schildern.', en: 'Hey! Soundboxes are forbidden on the camping. It says so on the signs. On ALL the signs.' },
  { de: 'Mach das Ding aus. Die Mainstage ist 200 Meter weiter, da läuft Musik. Echte.', en: 'Turn that thing off. The mainstage is 200 metres away, there\'s music there. Real music.' },
  { de: 'Soundboks? Auf dem Camping? Ernsthaft? AUS. Jetzt.', en: 'A soundbox? On the camping? Seriously? OFF. Now.' },
];
// the Lagerfeuer in the crew camp is no exception
const SCOLD_FIRE = [
  { de: 'Ey, auch am Lagerfeuer gilt: keine Soundboksen im Crew Camp. Die Leute hier müssen morgen wieder aufbauen.', en: 'Hey, same rule at the campfire: no soundboxes in the crew camp. People here have to build again tomorrow.' },
  { de: 'Lagerfeuer ja, Soundboks nein. Mach aus – nimm eine Gitarre, wenn es sein muss.', en: 'Campfire yes, soundbox no. Turn it off – grab a guitar if you must.' },
  { de: 'Soundboks am Feuer? Im Crew Camp sind die Dinger genauso verboten wie auf dem Campingplatz. AUS.', en: 'A soundbox at the fire? They\'re just as forbidden in the crew camp as on the camping. OFF.' },
];
const EXCUSES = [
  { de: 'Oh… echt? Ich dachte, das gilt nur für große Boksen. Die ist doch klein. …Okay, okay, ist aus.', en: 'Oh… really? I thought that only applies to big ones. This one\'s small. …Okay, okay, it\'s off.' },
  { de: 'Aber der Drop kommt gleich! …Ja gut. Aus. Menno.', en: 'But the drop is coming! …Fine. Off. Meh.' },
  { de: 'Welche Schilder? …Ach, DIE Schilder. Sorry!', en: 'What signs? …Oh, THOSE signs. Sorry!' },
  { de: 'Das ist keine Soundboks, das ist ein… mobiles Kulturangebot. …Na gut.', en: 'It\'s not a soundbox, it\'s a… mobile cultural offering. …Fine.' },
  { de: 'Wir wollten nur kurz vorglühen. Für den Aufbau. …Schon gut, ich mach aus.', en: 'We just wanted a little pre-party. For the build. …Alright, I\'ll turn it off.' },
];
const PARTY = [
  { de: 'WUHUUU!', en: 'WOOHOOO!' },
  { de: 'Lauter! LAUTER!', en: 'Louder! LOUDER!' },
  { de: 'Der Bass! Spürst du den Bass?!', en: 'The bass! Can you feel the bass?!' },
  { de: 'Aufbau ist auch Party!', en: 'Building is a party too!' },
];

function soundboxMesh() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.72, 0.42, mat('#141414', { roughness: 0.7 }), 0, 0.36, 0));
  g.add(box(0.46, 0.6, 0.02, mat('#3a3a3a', { roughness: 0.9 }), 0, 0.37, 0.215)); // grille
  const cone = cyl(0.16, 0.16, 0.02, mat('#222'), 16, 0, 0.42, 0.225);
  cone.rotation.x = Math.PI / 2;
  g.add(cone);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ff7a1a' }));
  led.position.set(0.18, 0.66, 0.22);
  g.add(led);
  g.add(box(0.3, 0.04, 0.06, mat('#5a5a5a'), 0, 0.76, 0));
  g.userData.led = led;
  return g;
}

export class Soundboxes {
  constructor(game) {
    this.game = game;
    this.box = null;
    this.cd = 70;
    this.mesh = soundboxMesh();
    this.mesh.visible = false;
    game.world.scene.add(this.mesh);
    this.source = game.music.add({ id: 'soundbox', pos: () => (this.box ? this.box.pos : null), range: 80, vol: 0.32, tinny: true });
  }

  reset() {
    this.stop();
    this.cd = 70;
  }

  isOwner(npc) { return this.box?.npcs.includes(npc); }

  update(dt) {
    const g = this.game;
    if (this.box) {
      const b = this.box;
      b.t += dt;
      const on = Math.floor(g.time * 4) % 2 === 0;
      this.mesh.userData.led.visible = on;
      this.mesh.scale.y = 1 + Math.sin(g.time * 15) * 0.015;
      if (b.t > 220 && !b.mission) this.stop(); // they got bored (or the battery died)
      return;
    }
    // the soundbox mission needs a box – keep trying until there is one
    const q = g.quests;
    if (Object.keys(q.state.active).some((id) => q.currentStep(id)?.type === 'soundbox')) {
      this.missionCD = (this.missionCD || 0) - dt;
      if (this.missionCD <= 0) { this.missionCD = 3; this.spawn(true); }
      return;
    }
    // random boxes only once you've done the soundbox mission
    if (!q.isDone('s0_soundbox') || q.timer || g.finale) return;
    this.cd -= dt;
    if (this.cd > 0) return;
    this.cd = 110 + Math.random() * 110;
    this.spawn();
  }

  spawn(forMission = false) {
    const g = this.game;
    if (this.box) { if (forMission) this.box.mission = true; return; }
    const spots = g.world.campSpots || [];
    const pp = g.player.position;
    const cands = g.npcs.campers.filter((n) => !n.hidden && !n.incident && !n.task && !n.talking && !n.party && !n.knocked);
    const far = spots.filter((s) => s.distanceTo(pp) > 25);
    // now and then the box stands at the Lagerfeuer in the crew camp instead
    const fireSpot = g.world.spots.campfire_box;
    const fire = !forMission && fireSpot && fireSpot.distanceTo(pp) > 25 && Math.random() < 0.35;
    const spot = fire ? fireSpot : far[Math.floor(Math.random() * far.length)] || spots[Math.floor(Math.random() * spots.length)];
    if (!spot || cands.length < (forMission ? 1 : 2)) return;
    // the nearest campers throw the party – they're standing right at the box from the start
    const npcs = cands.sort((a, b) => a.position.distanceTo(spot) - b.position.distanceTo(spot)).slice(0, 1 + Math.floor(Math.random() * 2));
    const pos = spot.clone();
    this.mesh.position.set(pos.x, heightAt(pos.x, pos.z), pos.z);
    this.mesh.rotation.y = Math.random() * 6.28;
    this.mesh.visible = true;
    npcs.forEach((n, i) => {
      const a = (i / npcs.length) * Math.PI * 2 + 0.5;
      n.party = { pos: new THREE.Vector3(pos.x + Math.cos(a) * 1.6, 0, pos.z + Math.sin(a) * 1.6), box: pos, lineT: 2 + i * 3 };
      if (n.char.sitting) n.standUp?.();
      if (!(n.toPlayer < 15)) { n.root.position.copy(n.party.pos); n.target = null; } // no walking over from the other end of the camp
    });
    this.box = { pos, npcs, t: 0, mission: forMission, fire };
    g.music.shuffle(this.source);
    if (fire) {
      for (const n of npcs) { n.root.position.copy(n.party.pos); n.target = null; } // they are already sitting at the fire
      if (!this.hintedFire) {
        this.hintedFire = true;
        g.ui.toast(L({ de: '🔊 Am Lagerfeuer im Crew Camp läuft eine Soundboks! Auch dort sind die verboten, geh hin und sag Bescheid.', en: '🔊 There\'s a soundbox playing at the campfire in the crew camp! They\'re forbidden there too, go over and tell them.' }));
      }
    } else if (!this.hinted && !forMission) {
      this.hinted = true;
      g.ui.toast(L({ de: '🔊 Da hat jemand auf dem Campingplatz eine Soundboks aufgedreht! Die sind dort verboten, geh hin und sag Bescheid.', en: '🔊 Someone turned on a soundbox on the camping! They\'re forbidden there, go over and tell them.' }));
    }
    g.updateMarkers();
  }

  stop() {
    if (!this.box) return;
    for (const n of this.box.npcs) { n.party = null; n.target = null; }
    this.box = null;
    this.mesh.visible = false;
    this.game.updateMarkers();
  }

  async scold(npc) {
    const g = this.game;
    await g.runDialog([
      { who: 'you', text: pick(this.box?.fire ? SCOLD_FIRE : SCOLD) },
      { who: npc.def.id, text: pick(EXCUSES) },
    ], null, npc);
    const fire = this.box?.fire;
    this.stop();
    // the soundbox mission waits for exactly this
    const qid = Object.keys(g.quests.state.active).find((id) => g.quests.currentStep(id)?.type === 'soundbox');
    if (qid) g.quests.advance(qid);
    const k = 20;
    g.quests.state.karma += k;
    g.audio.accept();
    g.ui.toast(getLang() === 'de' ? `🔇 Soundboks aus. ${fire ? 'Das Crew Camp dankt' : 'Die Nachbarzelte danken'} dir. (+${k} ✺)` : `🔇 Soundbox off. ${fire ? 'The crew camp thanks' : 'The neighbouring tents thank'} you. (+${k} ✺)`);
    g.refreshHUD();
  }

  partyLine() { return pick(PARTY); }

  objectives() {
    return this.box ? [{ pos: this.box.pos, label: '🔊', drama: true, hint: true }] : [];
  }
}
