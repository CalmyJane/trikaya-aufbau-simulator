import * as THREE from 'three';
import { NPC } from '../entities/NPC.js';
import { makeCamper } from '../entities/npcData.js';
import { getLang } from '../i18n.js';

// The end: gates open, guests stream in, every stage plays… then a cloudburst sends everyone home.
// The core crew meets in the office container and moans that it'll be like every year.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const RAIN_LINES = [
  { de: 'Mein Zelt schwimmt!', en: 'My tent is floating!' },
  { de: 'Rette sich wer kann!', en: 'Every man for himself!' },
  { de: 'Ich wusste, ich hätte Gummistiefel mitnehmen sollen!', en: 'I knew I should have brought wellies!' },
  { de: 'Das ist kein Regen mehr, das ist ein See!', en: 'That\'s not rain anymore, that\'s a lake!' },
  { de: 'Ab nach Hause! Nächstes Jahr wieder!', en: 'Home time! Same again next year!' },
];

export class Finale {
  constructor(game) {
    this.game = game;
    this.guests = [];
    this.active = false;
  }

  /** Remove everything the finale added (new game). */
  reset() {
    const g = this.game;
    for (const n of this.guests) { g.world.scene.remove(n.root); g.npcs.map.delete(n.def.id); }
    this.guests = [];
    g.sceneCam = null;
    for (const n of g.npcs.all) { n.scenePose = null; if (n.gone) { n.gone = false; n.hidden = false; n.root.visible = true; } }
    this.active = false;
    g.finale = false;
    document.getElementById('end-screen')?.remove();
  }

  async run() {
    const g = this.game;
    if (this.active) return;
    this.active = true;
    g.finale = true;
    const de = getLang() === 'de';
    g.drama.clearAll();
    g.soundbox.stop();
    // festival day: sun is up
    g.world.setNight(0, 6); g.sunriseT = 0; g.world.visibility = 220;
    await sleep(3500);
    g.ui.banner(de ? 'Tore auf!' : 'Gates open!', de ? 'Das Trikaya beginnt' : 'Trikaya begins', de ? 'Die Gäste strömen herein – alle Bühnen laufen. Schau dich um!' : 'Guests are pouring in – every stage is playing. Have a look around!', 6000);
    g.audio.complete?.();

    // guests stream in through the entrance and spread to the stages
    const stages = ['plot_mainstage', 'plot_forest_dome', 'plot_narnia_floor', 'plot_biergarten', 'plot_firespace', 'plot_chai_lounge', 'plot_hammocks', 'plot_shops', 'plot_mainstage'];
    const ent = g.world.spots.plot_entrance;
    const count = g.input.touch ? 8 : 18; // each guest is a full character – keep it light
    for (let i = 0; i < count && this.active; i++) {
      const def = makeCamper(300 + i);
      def.id = `guest_${i}`;
      def.role = { de: 'Festivalgast', en: 'Festival guest' };
      def.behavior = 'wander';
      def.home = stages[i % stages.length];
      def.radius = 9;
      def.tokenAsker = false;
      def.lines = [{ de: 'Wie schön ist das denn?!', en: 'How beautiful is this?!' }, { de: 'Der Drache! DER DRACHE!', en: 'The dragon! THE DRAGON!' }, { de: 'Wo gibt\'s Chai?', en: 'Where\'s the chai?' }, { de: 'Danke an die Aufbau-Crew!', en: 'Thanks to the build crew!' }];
      const n = new NPC(def, g.world, g.npcs);
      // they come out of the entrance tent's queue lane onto the site
      const q = g.world.spots.entrance_inside || ent;
      n.root.position.set(q.x + (Math.random() - 0.5) * 3, 0, q.z + (Math.random() - 0.5) * 3);
      g.world.colliders.resolve(n.root.position, 0.4);
      n.target = null;
      g.npcs.map.set(def.id, n);
      this.guests.push(n);
      await sleep(450);
    }
    if (!this.active) return;
    await sleep(45000);

    // the sky turns black…
    g.ui.toast(de ? '☁️ Oh oh… da hinten wird\'s ganz schwarz.' : '☁️ Uh oh… it\'s getting very dark over there.');
    g.world.setNight(0.55, 8);
    await sleep(8000);
    if (!this.active) return;
    g.world.setRain(true);
    g.cam.shake = 0.8;
    g.audio.noise?.(1.4, { vol: 0.7, freq: 120 }); // thunder
    g.ui.banner(de ? 'WOLKENBRUCH!' : 'CLOUDBURST!', de ? 'Alle rennen nach Hause' : 'Everybody runs home', '', 4500);
    const park = g.world.spots.parking;
    let k = 0;
    for (const n of [...this.guests, ...g.npcs.campers]) {
      if (n.hidden) continue;
      if (++k % 4 === 0) await sleep(120); // don't let everybody plan their route home in the same frame
      n.party = null;
      n.incident = null;
      if (n.char.sitting) n.standUp();
      n.say(pick(RAIN_LINES), 4);
      n.task = {
        phase: 'go', pos: () => park, arriveDist: 4, workTime: 0.1, speed: 5.5 + Math.random() * 2, anim: 'run',
        then: () => { n.gone = true; n.hidden = true; n.root.visible = false; },
      };
    }
    await sleep(6000);
    g.audio.noise?.(1.2, { vol: 0.6, freq: 100 });
    await sleep(14000);
    if (!this.active) return;
    await this.officeScene();
  }

  /** Leo, Fabi, Jan, Corni and Matze in the office container. */
  async officeScene() {
    const g = this.game;
    const de = getLang() === 'de';
    g.ui.fade(true);
    await sleep(1400);
    if (g.player.vehicle) g.exitVehicle();
    const inside = g.world.spots.office_inside, boss = g.world.spots.office_boss;
    const cast = ['jan', 'corni', 'matze', 'fabi', 'leo', 'estenko', 'schwarzhuber', 'andi'];
    const spots = [[boss.x, boss.z], [inside.x + 0.9, inside.z - 0.6], [inside.x - 0.4, inside.z + 0.7], [inside.x + 1.3, inside.z + 0.6], [inside.x - 1.4, inside.z - 0.2],
      [inside.x - 1.0, inside.z + 1.3], [inside.x + 1.6, inside.z - 1.3], [inside.x - 1.6, inside.z - 1.2]];
    cast.forEach((id, i) => {
      const n = g.npcs.get(id);
      if (!n) return;
      n.task = null; n.incident = null; n.away = false; n.gone = false; n.hidden = false; n.root.visible = true;
      if (n.char.sitting) n.standUp();
      n.root.position.set(spots[i][0], 0, spots[i][1]);
      n.scenePose = new THREE.Vector3(inside.x, 0, inside.z);
    });
    g.player.root.position.set(inside.x + 0.2, 0, inside.z + 1.3);
    g.player.root.rotation.y = Math.PI;
    // look down into the office (its roof hides while the player is inside)
    g.sceneCam = { pos: new THREE.Vector3(inside.x + 1.5, 6.2, inside.z + 3.2), look: new THREE.Vector3(inside.x - 0.3, 0.9, inside.z - 0.2) };
    g.world.setNight(0.45, 0.1);
    g.ui.fade(false);
    await sleep(800);
    const money = Math.round(g.quests.state.money).toLocaleString('de-DE');
    const T = (d, e) => (de ? d : e);
    await g.runDialog([
      { who: 'jan', text: T('So. Alle weg. Der Regen hat gewonnen.', 'Right. Everyone\'s gone. The rain won.') },
      { who: 'corni', text: T('Drei Wochen Aufbau. Zwei Stunden Festival. Dann Weltuntergang.', 'Three weeks of building. Two hours of festival. Then the end of the world.') },
      { who: 'estenko', text: T('*hicks* Ey mann… RESPEKT! An den Regen! Der hat… der hat einfach DURCHGEZOGEN! *hicks* …Wo bin ich?', '*hic* Hey man… RESPECT! To the rain! It just… it just WENT FOR IT! *hic* …Where am I?') },
      { who: 'matze', text: T('Moment… war das jetzt das Festival? Ich war Kaffee holen.', 'Wait… was that the festival? I was getting coffee.') },
      { who: 'schwarzhuber', text: T('Mei Wiese! Der Radlader is drübergfahrn wia a Panzer. Des is koa Acker mehr, des is a Schlammbad. DILETTANTISCH!', 'My meadow! That wheel loader drove over it like a tank. That\'s not a field anymore, that\'s a mud bath. AMATEURS!') },
      { who: 'fabi', text: T('Die Hälfte vom Material steht unter Wasser. Die andere Hälfte schwimmt gerade Richtung Karlsfeld.', 'Half the gear is under water. The other half is floating towards Karlsfeld right now.') },
      { who: 'andi', text: T('Und die Klos sind voll. ALLE. Bis oben. Und rate mal, was wieder kaputt ist.', 'And the toilets are full. ALL of them. To the brim. And guess what\'s broken again.') },
      { who: 'corni', text: T('…Nein.', '…No.') },
      { who: 'andi', text: T('Die Kackepumpe.', 'The poo pump.') },
      { who: 'estenko', text: T('KACKEPUMPE! *hicks* Ich hab… ich hab der einen Namen gegeben. Sie heißt Gerda.', 'POO PUMP! *hic* I… I gave her a name. Her name is Gerda.') },
      { who: 'leo', text: T('Leute! LEUTE! Super Arbeit! Hab ich doch gesagt, dass wir das schaffen. …Was hab ich verpasst?', 'Guys! GUYS! Great work! Told you we\'d make it. …What did I miss?') },
      { who: 'jan', text: T(`Budget: ${money} €. Klos voll, Acker Matsch, Pumpe hin, Zdenko voll.`, `Budget: €${money}. Toilets full, field mud, pump dead, Zdenko wasted.`) },
      { who: 'corni', text: T('Läuft ja super. Wie jedes Jahr.', 'Going great. Like every year.') },
      { who: 'estenko', text: T('Nächstes Jahr… *hicks* …mach ma des nochmal! RESPEKT!', 'Next year… *hic* …let\'s do it again! RESPECT!') },
      { who: 'matze', text: T('…Wie jedes Jahr.', '…Like every year.') },
    ]);
    this.endScreen();
  }

  /** A proper "Ende" screen: rain, the letters drop in, then stats and buttons. */
  endScreen() {
    const g = this.game;
    const de = getLang() === 'de';
    const qs = g.quests.state;
    g.input.unlock();
    g.input.enabled = false;
    document.getElementById('end-screen')?.remove();
    const el = document.createElement('div');
    el.id = 'end-screen';
    const word = de ? 'ENDE' : 'THE END';
    const drops = Array.from({ length: 70 }, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(-Math.random() * 1.2).toFixed(2)}s;animation-duration:${(0.55 + Math.random() * 0.5).toFixed(2)}s"></i>`).join('');
    const letters = [...word].map((c, i) => `<span style="animation-delay:${(0.35 + i * 0.22).toFixed(2)}s">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    const done = qs.completed.filter((id) => !id.startsWith('err_')).length;
    el.innerHTML = `
      <div class="end-rain">${drops}</div>
      <div class="end-inner">
        <div class="end-word">${letters}</div>
        <div class="end-sub">${de ? 'Klos voll. Acker Matsch. Kackepumpe kaputt.<br><b>Läuft ja super – wie jedes Jahr.</b>' : 'Toilets full. Field mud. Poo pump broken.<br><b>Going great – like every year.</b>'}</div>
        <div class="end-card">
          <div><span>${de ? 'Erledigte Jobs' : 'Jobs done'}</span><b>${done}</b></div>
          <div><span>Karma</span><b>✺ ${qs.karma}</b></div>
          <div><span>Budget</span><b>${Math.round(qs.money).toLocaleString('de-DE')} €</b></div>
          <div><span>${de ? 'Getränkemarken von Leo' : 'Drink tokens from Leo'}</span><b>${qs.flags.drinkTokens || 0}</b></div>
        </div>
        <div class="end-buttons">
          <button class="btn primary" id="end-again">${de ? 'Nochmal aufbauen' : 'Build it again'}</button>
          <button class="btn" id="end-credits">Credits</button>
          <button class="btn" id="end-menu">${de ? 'Zum Menü' : 'Main menu'}</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const close = () => { el.remove(); g.input.enabled = true; };
    el.querySelector('#end-again').onclick = () => { close(); g.newGame(); };
    el.querySelector('#end-menu').onclick = () => { close(); g.toMenu(); };
    el.querySelector('#end-credits').onclick = () => g.ui.modal(g.creditsHtml());
  }
}
