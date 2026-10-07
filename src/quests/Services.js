import { L, getLang } from '../i18n.js';
import { isHeavy, ITEMS } from '../items/itemData.js';

// Little services for karma:
//  - hire a volunteer: they fetch the next thing you have to pick up and bring it to you
//  - styling with Annika in the planetarium: hair, hair colour, outfit colours, glitter & extras

const C = (de, en) => ({ de, en });
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const HIRE_COST = 20;
export const STYLE_COST = 8;

const HIRE_YES = [
  C('Klar, mach ich! Für Karma lauf ich überall hin. Fast überall.', 'Sure, I\'ll do it! For karma I\'ll walk anywhere. Almost anywhere.'),
  C('Ich hol\'s dir! Ich wollte eh mal da rüber. Glaub ich.', 'I\'ll get it for you! I wanted to go over there anyway. I think.'),
  C('Deal. Bin gleich zurück. Nicht weglaufen!', 'Deal. Back in a sec. Don\'t run off!'),
];

const HAIR = [
  ['dreads', C('Dreads', 'Dreads')], ['long', C('Lang', 'Long')], ['curly', C('Locken', 'Curls')], ['bun', C('Dutt', 'Bun')],
  ['mohawk', C('Iro', 'Mohawk')], ['ponytail', C('Pferdeschwanz', 'Ponytail')], ['pigtails', C('Zöpfe', 'Pigtails')], ['short', C('Kurz', 'Short')],
];
const HAIR_COLORS = [
  ['#6a4424', C('Braun', 'Brown')], ['#15100c', C('Schwarz', 'Black')], ['#e3c46a', C('Blond', 'Blond')], ['#b0402a', C('Rot', 'Red')],
  ['#ff5ab4', C('Pink', 'Pink')], ['#3a7aff', C('Blau', 'Blue')], ['#3ab060', C('Grün', 'Green')], ['#8a3a9a', C('Lila', 'Purple')],
];
const OUTFITS = [
  [C('Sonnenuntergang', 'Sunset'), { shirt: '#d98c2b', pants: '#7a4a8a', shirtPatch: ['#d98c2b', '#b8483a', '#c9b24a'], pantsPatch: ['#7a4a8a', '#9b3d8a', '#4a5a8a'] }],
  [C('Wald', 'Forest'), { shirt: '#3a6a3a', pants: '#6a4a2a', shirtPatch: ['#3a6a3a', '#5a7a3a', '#8a6a3a'], pantsPatch: ['#6a4a2a', '#4a5a2a', '#3a3a2a'] }],
  [C('Ozean', 'Ocean'), { shirt: '#2a8a7a', pants: '#2a4a8a', shirtPatch: ['#2a8a7a', '#3aa0c0', '#dff0ff'], pantsPatch: ['#2a4a8a', '#2e6b5e', '#4a5a8a'] }],
  [C('Regenbogen', 'Rainbow'), { shirt: '#e74c3c', pants: '#2e6b5e', shirtPatch: ['#e74c3c', '#f1c40f', '#1abc9c'], pantsPatch: ['#9b59b6', '#3a7aff', '#2ecc71'] }],
  [C('Ganz in Schwarz (Techno)', 'All black (techno)'), { shirt: '#161616', pants: '#1c1c1c', shirtPatch: ['#161616', '#222', '#101010'], pantsPatch: ['#1c1c1c', '#262626', '#141414'] }],
];
const EXTRAS = [
  ['glitter', C('Glitzer im Gesicht', 'Glitter on the face')], ['headband', C('Stirnband', 'Headband')], ['scarf', C('Schal', 'Scarf')],
  ['elfEars', C('Elfenohren', 'Elf ears')], ['sunglasses', C('Sonnenbrille', 'Sunglasses')], ['beads', C('Perlen in den Dreads', 'Beads in the dreads')],
];
const STYLE_DONE = [
  C('Perfekt. Du siehst aus wie jemand, der weiß, wo die Essensmarken sind.', 'Perfect. You look like someone who knows where the food tokens are.'),
  C('Wow. Leo würde dich nicht wiedererkennen. Okay, Leo erkennt niemanden. Aber trotzdem!', 'Wow. Leo wouldn\'t recognise you. Okay, Leo doesn\'t recognise anyone. But still!'),
  C('Steht dir! Ehrlich. Ich würd dir sofort was im Shop verkaufen.', 'Suits you! Honestly. I\'d sell you something in the shop right away.'),
];

export class Services {
  constructor(game) { this.game = game; }

  // ------------------------------------------------------------ hire a volunteer
  /** The next light thing one of your jobs wants you to pick up. */
  helpItem() {
    const qs = this.game.quests;
    const ids = Object.keys(qs.state.active);
    ids.sort((a, b) => (b === qs.state.tracked) - (a === qs.state.tracked));
    for (const qid of ids) {
      const q = qs.quests[qid], step = qs.currentStep(qid);
      if (!q || q.noRunOver || step?.type !== 'pickup') continue;
      for (const it of step.items) {
        const wi = qs.worldItems.get(it.item);
        if (wi && !wi.reserved && !isHeavy(it.item)) return { qid, itemId: it.item, wi };
      }
    }
    return null;
  }

  canHire(npc) {
    return npc.def.id.startsWith('camper_') && !npc.task && !npc.incident && !npc.party && !this.game.soundbox.isOwner(npc) && !!this.helpItem();
  }

  async hire(npc) {
    const g = this.game, qs = g.quests, de = getLang() === 'de';
    const h = this.helpItem();
    if (!h) return;
    if (qs.state.karma < HIRE_COST) { await g.reply(npc, de ? 'Für lau? Hm. Nee, ich bin grad beim Chai-Zelt eingeteilt. Glaub ich.' : 'For free? Hm. Nah, I\'m on the chai tent right now. I think.'); return; }
    qs.state.karma -= HIRE_COST;
    g.refreshHUD();
    const name = L(ITEMS[h.itemId]?.name) || '…';
    await g.reply(npc, L(pick(HIRE_YES)));
    g.ui.toast(de ? `🤝 ${npc.def.name} holt dir: ${name} (−${HIRE_COST} ✺)` : `🤝 ${npc.def.name} is fetching: ${name} (−${HIRE_COST} ✺)`);
    h.wi.reserved = npc;
    npc.task = {
      phase: 'go', pos: () => h.wi.pos, arriveDist: 1.4, workTime: 1, speed: 4.2,
      arriveLine: de ? 'Hab\'s!' : 'Got it!',
      then: () => {
        // you were quicker (or the job is gone)
        if (qs.worldItems.get(h.itemId) !== h.wi || !qs.state.active[h.qid]) { npc.say(de ? 'Ach, hast du schon? Auch gut!' : 'Oh, you\'ve got it already? Fine!', 3); return; }
        qs.removeWorldItem(h.itemId);
        npc.task = {
          phase: 'go', pos: () => g.player.position, arriveDist: 2.2, workTime: 0.6, speed: 4.6,
          arriveLine: de ? `Hier, ${name}! Gern geschehen.` : `Here, ${name}! You\'re welcome.`,
          then: () => this.handOver(h),
        };
      },
    };
  }

  handOver(h) {
    const qs = this.game.quests;
    const a = qs.state.active[h.qid];
    const step = qs.currentStep(h.qid);
    if (!a || step?.type !== 'pickup' || !step.items.some((it) => it.item === h.itemId) || qs.has(h.itemId)) return;
    qs.state.inventory.push(h.itemId);
    a.picked.push(h.itemId);
    qs.emit('picked', { id: h.itemId, def: ITEMS[h.itemId] });
    this.game.updateCarried();
    qs.checkPickupDone(h.qid);
    qs.refreshMarkers();
    qs.emit('changed');
  }

  // ------------------------------------------------------------ styling (Annika, planetarium)
  canStyle(npc) {
    const qs = this.game.quests;
    return npc.def.id === 'annika' && qs.isDone('q7_dome') && qs.isDone('m1_shops');
  }

  async styling(npc) {
    const g = this.game, de = getLang() === 'de';
    const menu = [C(`💇 Frisur (✺ ${STYLE_COST})`, `💇 Hairstyle (✺ ${STYLE_COST})`), C(`🎨 Haarfarbe (✺ ${STYLE_COST})`, `🎨 Hair colour (✺ ${STYLE_COST})`),
      C(`👕 Outfit-Farben (✺ ${STYLE_COST})`, `👕 Outfit colours (✺ ${STYLE_COST})`), C(`✨ Glitzer & Extras (✺ ${STYLE_COST})`, `✨ Glitter & extras (✺ ${STYLE_COST})`), C('Fertig', 'Done')];
    let intro = de ? `Willkommen im Planetarium-Salon! Unter den Sternen sieht jeder gut aus. Mit meiner Hilfe noch besser. (Du hast ✺ ${Math.floor(g.quests.state.karma)})` : `Welcome to the planetarium salon! Everyone looks good under the stars. Even better with my help. (You have ✺ ${Math.floor(g.quests.state.karma)})`;
    let changed = false;
    for (;;) {
      const c = await g.runDialog([{ who: 'annika', text: intro }], menu, npc);
      if (c < 0 || c >= 4) break;
      const look = { ...g.player.char.look };
      let opts, apply;
      if (c === 0) { opts = HAIR.map(([, n]) => n); apply = (i) => { look.hairStyle = HAIR[i][0]; look.hairCut = undefined; if (look.hairStyle === 'long' || look.hairStyle === 'curly') look.hairLength = 0.36; }; }
      else if (c === 1) { opts = HAIR_COLORS.map(([, n]) => n); apply = (i) => { look.hair = HAIR_COLORS[i][0]; look.hairStyleColor = HAIR_COLORS[i][0]; look.brows = HAIR_COLORS[i][0]; }; }
      else if (c === 2) { opts = OUTFITS.map(([n]) => n); apply = (i) => { Object.assign(look, OUTFITS[i][1]); look.shirt2 = OUTFITS[i][1].shirtPatch[1]; look.patchwork = true; }; }
      else {
        const has = (k) => (k === 'glitter' || k === 'scarf' ? (look.extras || []).includes(k) : k === 'headband' ? !!look.headband : !!look[k]);
        opts = EXTRAS.map(([k, n]) => C(`${has(k) ? '✔' : '○'} ${n.de}`, `${has(k) ? '✔' : '○'} ${n.en}`));
        apply = (i) => {
          const k = EXTRAS[i][0];
          if (k === 'glitter' || k === 'scarf') {
            const ex = new Set(look.extras || []);
            if (ex.has(k)) ex.delete(k); else ex.add(k);
            look.extras = [...ex];
            if (k === 'scarf') look.scarf = '#9b3d8a';
          } else if (k === 'headband') look.headband = look.headband ? null : '#e74c3c';
          else look[k] = !look[k];
        };
      }
      const i = await g.runDialog([{ who: 'annika', text: de ? 'Was darf\'s sein?' : 'What\'ll it be?' }], [...opts, C('Doch nicht', 'Never mind')], npc);
      if (i < 0 || i >= opts.length) { intro = de ? 'Noch was anderes?' : 'Anything else?'; continue; }
      if (g.quests.state.karma < STYLE_COST) { await g.reply(npc, de ? 'Ein bisschen Karma brauch ich schon. Die Glitzerdose war teuer.' : 'I do need a little karma. The glitter tin was expensive.'); break; }
      apply(i);
      if (!g.player.setLook(look)) break;
      g.quests.state.karma -= STYLE_COST;
      g.quests.state.flags.look = look;
      g.updateCarried();
      g.audio.accept();
      g.refreshHUD();
      changed = true;
      intro = de ? `Schick! Noch was? (Du hast ✺ ${Math.floor(g.quests.state.karma)})` : `Fancy! Anything else? (You have ✺ ${Math.floor(g.quests.state.karma)})`;
    }
    if (changed) await g.reply(npc, L(pick(STYLE_DONE)));
    g.save?.();
  }
}
