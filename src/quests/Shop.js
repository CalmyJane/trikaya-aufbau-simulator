import { L, getLang } from '../i18n.js';

// Karma economy on the site: people sell you things for karma.
//  - Mark (once the chai tent stands): cheap mate, chai
//  - Fabi: pro gaffa
//  - random volunteers with a blue "!": speed or keta – buy it or say no.

export const SHOP = [
  {
    id: 'mate', icon: '🧉', cost: 8, vendor: 'mark',
    name: { de: 'Mate', en: 'Mate' },
    desc: { de: '90 Sekunden etwas schneller laufen.', en: 'Walk a bit faster for 90 seconds.' },
  },
  {
    id: 'chai', icon: '🍵', cost: 12, vendor: 'mark',
    name: { de: 'Chai', en: 'Chai' },
    desc: { de: 'Ausdauer sofort voll und 90 Sekunden unbegrenzt sprinten.', en: 'Stamina full right away and 90 seconds of unlimited sprinting.' },
  },
  {
    id: 'gaffa', icon: '🩹', cost: 25, vendor: 'fabi',
    name: { de: 'Profi-Gaffa', en: 'Pro gaffa' },
    desc: { de: 'Die nächsten 3 Bau- und Arbeitsschritte gehen doppelt so schnell.', en: 'The next 3 build/work steps go twice as fast.' },
  },
  {
    id: 'beer', icon: '🍺', cost: 5, vendor: ['thompsen', 'jonas'],
    name: { de: 'Bier', en: 'Beer' },
    desc: { de: 'Solange du was getrunken hast, bist du gesellig: Jedes Gespräch bringt ein bisschen Karma. Fahren wird wackelig.', en: 'While you\'ve had a drink you\'re sociable: every chat earns a little karma. Driving gets wobbly.' },
  },
  {
    id: 'weed', icon: '🌿', cost: 15, dealer: true,
    name: { de: 'Weed', en: 'Weed' },
    desc: { de: '90 Sekunden richtig hoch springen – über Bauzäune und Büsche. Die Welt wird warm und weich.', en: 'Jump really high for 90 seconds – over fences and bushes. The world turns warm and soft.' },
  },
  {
    id: 'schnaps', icon: '🥃', cost: 8, dealer: true,
    name: { de: 'Schnaps', en: 'Schnapps' },
    desc: { de: 'Zählt wie zwei Bier: gesellig, aber Fahren wird SEHR wackelig.', en: 'Counts as two beers: sociable, but driving gets VERY wobbly.' },
  },
  {
    id: 'speed', icon: '⚡', cost: 25, dealer: true,
    name: { de: 'Speed', en: 'Speed' },
    desc: { de: '60 Sekunden rennen wie der Radlader. Zu viel davon, und dein Herz macht Techno.', en: 'Run like the wheel loader for 60 seconds. Too much and your heart goes techno.' },
  },
  {
    id: 'keta', icon: '🌀', cost: 20, dealer: true,
    name: { de: 'Keta', en: 'Keta' },
    desc: { de: 'Der nächste Auftraggeber sieht, dass du voll drauf bist, und erledigt einen Schritt für dich.', en: 'The next quest giver sees you\'re wasted and does one step for you.' },
  },
];

const OD_LIMIT = 3;       // doses (within the decay window) that knock you out
const OD_DECAY = 120;     // seconds for one dose to wear off

const COMMENTS = {
  keta: [
    { de: 'Alles okay bei dir? Du guckst so… durch mich durch.', en: 'You okay? You\'re looking… right through me.' },
    { de: 'Oha. Du bist ja komplett verballert.', en: 'Whoa. You\'re completely wasted.' },
    { de: 'Du läufst, als wär der Boden aus Wackelpudding.', en: 'You walk like the ground is made of jelly.' },
    { de: 'Hallo? Erde an dich? …Okay, später.', en: 'Hello? Earth to you? …Okay, later.' },
    { de: 'Brauchst du Franzi? Du siehst aus, als bräuchtest du Franzi.', en: 'Need Franzi? You look like you need Franzi.' },
    { de: 'Du hast gerade fünf Minuten einen Hering angestarrt.', en: 'You just stared at a tent peg for five minutes.' },
    { de: 'Bist du im K-Hole oder suchst du nur deine Schuhe?', en: 'Are you in a k-hole or just looking for your shoes?' },
  ],
  weed: [
    { de: 'Hihi, du hast ja ganz rote Augen.', en: 'Hehe, your eyes are all red.' },
    { de: 'Riechst du das auch? …Ach, das bist du.', en: 'Do you smell that too? …Oh, that\'s you.' },
    { de: 'Du grinst seit fünf Minuten den Radlader an.', en: 'You\'ve been grinning at the wheel loader for five minutes.' },
    { de: 'Hast du Kekse? Du siehst aus wie jemand, der gleich Kekse braucht.', en: 'Got cookies? You look like someone who\'ll need cookies soon.' },
    { de: 'Warum hüpfst du so? …Egal, sieht gut aus.', en: 'Why are you bouncing like that? …Never mind, looks good.' },
  ],
  beer: [
    { de: 'Na, schon ein Bierchen gehabt? Man riecht\'s.', en: 'Had a beer already? I can smell it.' },
    { de: 'Prost! Moment… du hast ja schon eins.', en: 'Cheers! Wait… you already have one.' },
    { de: 'Du lallst ein bisschen. Nur ein bisschen.', en: 'You\'re slurring a bit. Just a bit.' },
    { de: 'Fahr bloß nicht Radlader so. …Du fährst Radlader so, oder?', en: 'Don\'t drive the wheel loader like that. …You drive the wheel loader like that, don\'t you?' },
  ],
  speed: [
    { de: 'Wow, du bist ja ganz schön drauf!', en: 'Wow, you\'re pretty wired!' },
    { de: 'Warum redest du so schnell? Ich hab gar nix gefragt.', en: 'Why are you talking so fast? I didn\'t even ask anything.' },
    { de: 'Dein Kiefer mahlt lauter als der Generator.', en: 'Your jaw is grinding louder than the generator.' },
    { de: 'Chill mal. Es ist ein Festival, kein Formel-1-Rennen.', en: 'Chill. It\'s a festival, not a Formula 1 race.' },
    { de: 'Du blinzelst gar nicht mehr. Ist das Absicht?', en: 'You stopped blinking. On purpose?' },
    { de: 'Du hast gerade drei Leuten gleichzeitig deine Lebensgeschichte erzählt.', en: 'You just told three people your life story at the same time.' },
  ],
};

const DEALER_LINES = {
  keta: [
    { de: 'Psst. Hey. Du siehst gestresst aus. Ich hab Keta. Macht alles… weicher.', en: 'Psst. Hey. You look stressed. I\'ve got keta. Makes everything… softer.' },
    { de: 'Na? Lust, kurz den Planeten zu verlassen? Hab Keta. Fair Trade. Glaub ich.', en: 'Hey. Fancy leaving the planet for a bit? Got keta. Fair trade. I think.' },
  ],
  weed: [
    { de: 'Psst. Willst du was Grünes? Dann springst du über jeden Bauzaun. Fast.', en: 'Psst. Want something green? You\'ll jump over every fence. Almost.' },
    { de: 'Hey, entspann mal. Ich hab Weed. Bio. Selbst gezogen. Im Zelt.', en: 'Hey, relax. I\'ve got weed. Organic. Home-grown. In my tent.' },
  ],
  speed: [
    { de: 'Ey, du willst schneller aufbauen? Ich hab Speed. Dann rennst du wie der Radlader.', en: 'Hey, want to build faster? I\'ve got speed. You\'ll run like the wheel loader.' },
    { de: 'Psst! Speed? Dann bist du mit dem Aufbau fertig, bevor Leo überhaupt aufwacht.', en: 'Psst! Speed? You\'ll finish the build before Leo even wakes up.' },
  ],
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// "Got anything?" – you can ask (almost) anyone. These never have anything and never sell.
export const NO_STASH = ['fabi', 'jan', 'leo', 'franzi', 'isi', 'verena', 'mia', 'daniel', 'delsin', 'aylien', 'sabse'];
// crew members with a known stash; everyone else is random (most have nothing)
const STASH_FIXED = { strom_andi: ['beer', 'schnaps'], juli: ['beer'], estenko: ['schnaps'], rocky: ['weed'], mehdi: ['weed'], schwarzhuber: ['schnaps'], lenny: ['speed', 'weed'], mux: ['weed'], leocitas: ['weed'] };
const STASH_POOL = ['weed', 'weed', 'schnaps', 'speed', 'keta'];
const STASH_CD = 240; // seconds until someone has something again after selling

const NO_STASH_LINES = {
  fabi: { de: 'Gaffa? Ja. Das andere? Nein. Ich weiß, wo alles ist – aber DAS nicht.', en: 'Gaffa? Yes. The other stuff? No. I know where everything is – but not THAT.' },
  jan: { de: 'Ich hab Bändchen, Listen und kalten Kaffee. Willst du ein zweites Bändchen?', en: 'I have wristbands, lists and cold coffee. Want a second wristband?' },
  franzi: { de: 'Ich hab Wasser, Kekse und ein offenes Ohr. Mehr gibt\'s bei mir nicht. Und das ist gut so.', en: 'I have water, cookies and an open ear. That\'s all you get from me. And that\'s a good thing.' },
  isi: { de: 'Ich?! Ich bleib nüchtern, einer muss ja fahren! Willst du ein Wasser?', en: 'Me?! I\'m staying sober, someone has to drive! Want a water?' },
  verena: { de: 'Ich hab eine Bar und einen Schichtplan. Sonst nix.', en: 'I have a bar and a rota. Nothing else.' },
  mia: { de: 'Ich hab Schrauben. Viele Schrauben. Die richtigen sogar. Sonst nichts. 💛', en: 'I have screws. Lots of screws. Even the right ones. Nothing else. 💛' },
  daniel: { de: 'Ich hab ein Pausenbrot. Das geb ich aber nicht her.', en: 'I have a sandwich. But I\'m not giving that away.' },
  leo: { de: 'Später! Später!', en: 'Later! Later!' },
  delsin: { de: 'Ich bin vom Awareness-Team. Ich hab Wasser, Zeit und ein offenes Ohr. Das andere such dir bitte woanders. Oder besser gar nicht.', en: 'I\'m on the awareness team. I have water, time and an open ear. Look for the other stuff elsewhere. Or better not at all.' },
  aylien: { de: 'Ich hab nur Umarmungen dabei. Die sind gratis und machen nicht abhängig. Na gut, ein bisschen.', en: 'All I have is hugs. They\'re free and not addictive. Okay, a little.' },
  sabse: { de: 'In MEINER Küche? Ich hab Zwiebeln. Willst du Zwiebeln? Nein? Dann raus.', en: 'In MY kitchen? I have onions. Want onions? No? Then out.' },
};
const NOTHING_LINES = [
  { de: 'Nee, sorry. Hab nix dabei.', en: 'Nah, sorry. Got nothing on me.' },
  { de: 'Ich? Nur Kaugummi. Willst du einen?', en: 'Me? Just chewing gum. Want one?' },
  { de: 'Nö. Frag mal bei den Zelten rum.', en: 'Nope. Ask around the tents.' },
  { de: 'Hab nix. Ich bin hier zum Arbeiten. …Und zum Tanzen.', en: 'Got nothing. I\'m here to work. …And to dance.' },
  { de: 'Was soll ich haben? Ich hab Sonnenbrand.', en: 'What would I have? I have sunburn.' },
  { de: 'Ich hab Hustenbonbons. Die sind… sehr intensiv. Eukalyptus. Willst du?', en: 'I\'ve got cough drops. They\'re… very intense. Eucalyptus. Want one?' },
  { de: 'Ich hab einen Kabelbinder und ein gutes Gefühl. Reicht dir das?', en: 'I\'ve got a cable tie and a good feeling. Is that enough?' },
  { de: 'Nur Globuli. Gegen Muskelkater. Wirkt nicht, aber ich glaub dran.', en: 'Just homeopathic pills. For sore muscles. Doesn\'t work, but I believe in it.' },
  { de: 'Ich hab Mate. Also hatte. Jetzt hab ich Herzrasen.', en: 'I had mate. Well, had. Now I have palpitations.' },
  { de: 'Nee. Aber ich hab Sonnencreme mit LSF 50. Das ist quasi auch ein Trip, wenn man\'s vergisst.', en: 'Nope. But I\'ve got SPF 50 sunscreen. Forgetting it is basically a trip too.' },
  { de: 'Ich hab eine Banane. Die ist allerdings schon seit Dienstag in meiner Hosentasche.', en: 'I\'ve got a banana. It\'s been in my trouser pocket since Tuesday, though.' },
  { de: 'Was ich hab? Rücken. Vom Paletten-Schleppen. Willst du auch welchen?', en: 'What have I got? Back pain. From hauling pallets. Want some?' },
  { de: 'Hab nur ein Hanuta. Aber Hanuta ist auch eine Droge, wenn man ehrlich ist.', en: 'Only got a Hanuta. But honestly, Hanuta is a drug too.' },
  { de: 'Ich hab Ohrstöpsel. Brauchst du nachts. Glaub mir. Zdenko schnarcht.', en: 'I\'ve got earplugs. You\'ll need them at night. Trust me. Zdenko snores.' },
  { de: 'Nix. Ich bin clean. Seit heute Morgen. Läuft super bisher.', en: 'Nothing. I\'m clean. Since this morning. Going great so far.' },
  { de: 'Nur Brausepulver. Das knistert auch. Ist fast das Gleiche.', en: 'Just sherbet powder. That crackles too. Almost the same thing.' },
  { de: 'Ich hab eine Essensmarke! …Nee, Quatsch. Die gibt\'s ja nicht.', en: 'I\'ve got a food token! …Nah, kidding. They don\'t exist.' },
  { de: 'Ich hab Zwiebeln. Von Sabse. Frag nicht, ich muss die schneiden.', en: 'I\'ve got onions. From Sabse. Don\'t ask, I have to chop them.' },
  { de: 'Ein Tütchen! …mit Heringen. Für dein Zelt. Gern geschehen.', en: 'A little baggie! …of tent pegs. For your tent. You\'re welcome.' },
];
const HAVE_LINES = [
  { de: 'Psst… ja, bisschen was. Aber nicht weitersagen.', en: 'Psst… yeah, a little something. Don\'t tell anyone.' },
  { de: 'Kommt drauf an, was du brauchst… Schau mal:', en: 'Depends what you need… Have a look:' },
  { de: 'Für dich? Klar. Karma gegen Spaß, fairer Deal.', en: 'For you? Sure. Karma for fun, fair deal.' },
];
const EMPTY_LINES = [
  { de: 'Hab dir doch grad schon was gegeben. Erstmal alle.', en: 'I just gave you something. All gone for now.' },
  { de: 'Ausverkauft! Frag später nochmal.', en: 'Sold out! Ask again later.' },
];

export class Effects {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.mateT = 0;
    this.chaiT = 0;
    this.gaffa = 0;
    this.ketaCharges = 0;
    this.ketaLevel = 0;
    this.ketaDecay = 0;
    this.ketaT = 0;
    this.speedT = 0;
    this.speedLevel = 0;
    this.speedDecay = 0;
    this.weedT = 0;
    this.beerLevel = 0;
    this.beerDecay = 0;
    this.collapsed = false;
    this.commentT = 3;
    this.clearDealer();
    this.dealerCD = 60;
    document.body.classList.remove('keta', 'keta2', 'weed');
  }

  item(id) { return SHOP.find((x) => x.id === id); }

  /** What this NPC sells right now. */
  vendorItems(npcId) {
    const qs = this.game.quests;
    return SHOP.filter((it) => [].concat(it.vendor || []).includes(npcId) && (!it.needs || qs.isDone(it.needs)));
  }

  buy(id, free = false) {
    const g = this.game;
    const it = this.item(id);
    if (!it || (!free && g.quests.state.karma < it.cost) || this.collapsed) return false;
    if (!free) g.quests.state.karma -= it.cost;
    const de = getLang() === 'de';
    if (id === 'mate') this.mateT = 90;
    if (id === 'chai') { this.chaiT = 90; g.player.stamina = 1; }
    if (id === 'gaffa') this.gaffa += 3;
    if (id === 'keta') {
      this.ketaCharges += 1;
      this.ketaLevel += 1;
      this.ketaDecay = 0;
      this.ketaT = 60;
      if (this.ketaLevel >= OD_LIMIT) setTimeout(() => this.collapse('keta'), 600);
      else if (this.ketaLevel === OD_LIMIT - 1) g.ui.toast(de ? '🌀 Uff. Noch eine Dosis und du liegst.' : '🌀 Whoa. One more dose and you\'re down.');
    }
    if (id === 'weed') this.weedT = 90;
    if (id === 'beer' || id === 'schnaps') {
      this.beerLevel += id === 'schnaps' ? 2 : 1;
      this.beerDecay = 0;
      if (this.beerLevel >= 5) setTimeout(() => this.collapse('beer'), 600);
      else if (this.beerLevel >= 3) g.ui.toast(de ? '🍺 Du schwankst schon ordentlich. Noch mehr wäre eine schlechte Idee.' : '🍺 You\'re swaying quite a bit. More would be a bad idea.');
    }
    if (id === 'speed') {
      this.speedT = 60;
      this.speedLevel += 1;
      this.speedDecay = 0;
      if (this.speedLevel >= OD_LIMIT) setTimeout(() => this.collapse('speed'), 600);
      else if (this.speedLevel === OD_LIMIT - 1) g.ui.toast(de ? '⚡ Dein Herz macht 180 BPM. Noch eine und es macht gar nix mehr.' : '⚡ Your heart is at 180 BPM. One more and it stops doing anything.');
    }
    g.audio.pickup();
    g.ui.toast(`${it.icon} <b>${L(it.name)}</b> −${it.cost} ✺`);
    g.refreshHUD();
    return true;
  }

  /** Called when a build/work step starts: Pro gaffa halves the time. */
  buildFactor() {
    if (this.gaffa > 0) { this.gaffa--; return 0.5; }
    return 1;
  }

  get high() { return this.ketaT > 0 ? 'keta' : this.speedT > 0 ? 'speed' : this.weedT > 0 ? 'weed' : this.beerLevel >= 2 ? 'beer' : null; }
  get tipsy() { return this.beerLevel > 0; }

  /** Something people say when you're obviously on something. */
  comment() { const h = this.high; return h ? pick(COMMENTS[h]) : null; }

  update(dt) {
    const g = this.game;
    this.mateT = Math.max(0, this.mateT - dt);
    this.chaiT = Math.max(0, this.chaiT - dt);
    this.ketaT = Math.max(0, this.ketaT - dt);
    this.speedT = Math.max(0, this.speedT - dt);
    this.weedT = Math.max(0, this.weedT - dt);
    if (this.beerLevel > 0 && (this.beerDecay += dt) > 150) { this.beerDecay = 0; this.beerLevel--; }
    if (this.ketaLevel > 0 && (this.ketaDecay += dt) > OD_DECAY) { this.ketaDecay = 0; this.ketaLevel--; }
    if (this.speedLevel > 0 && (this.speedDecay += dt) > OD_DECAY) { this.speedDecay = 0; this.speedLevel--; }
    const p = g.player;
    p.speedMul = (this.speedT > 0 ? 1.6 : this.mateT > 0 ? 1.25 : 1) * (this.ketaT > 0 ? 0.8 : 1);
    p.staminaFree = this.speedT > 0 || this.chaiT > 0;
    p.jumpMul = this.weedT > 0 ? 1.55 : 1;
    // drunk driving: the more beer, the more slalom
    for (const v of Object.values(g.vehicles)) v.wobble = this.beerLevel * 0.28;
    // keta: wobbly world · speed: tunnel vision
    const k = this.ketaT > 0;
    document.body.classList.toggle('keta', k);
    document.body.classList.toggle('keta2', k && this.ketaLevel >= 2);
    document.body.classList.toggle('weed', !k && this.weedT > 0);
    const cam = g.camera;
    let fov = 60;
    if (k) fov = 60 + Math.sin(g.time * 0.9) * (this.ketaLevel >= 2 ? 9 : 5);
    else if (this.speedT > 0) fov = 68 + Math.sin(g.time * 11) * 0.6;
    else if (this.weedT > 0) fov = 62 + Math.sin(g.time * 0.5) * 2.5;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    this.updateComments(dt);
    this.updateDealer(dt);
    g.ui.effects(this.list());
  }

  /** People around you notice. */
  updateComments(dt) {
    if (!this.high) return;
    this.commentT -= dt;
    if (this.commentT > 0) return;
    const g = this.game;
    const pp = g.player.position;
    const near = g.npcs.all.filter((n) => !n.hidden && !n.talking && !n.incident && !n.bubble && n.def.id !== 'leo' && n.position.distanceTo(pp) < 9);
    if (!near.length) { this.commentT = 1.5; return; }
    near[Math.floor(Math.random() * near.length)].say(this.comment(), 3.8);
    this.commentT = 6 + Math.random() * 5;
  }

  // ------------------------------------------------------------ dealers (blue "!")
  clearDealer() {
    this.dealer = null;
    this.game?.updateMarkers?.();
  }

  isDealer(npc) { return this.dealer?.npc === npc; }

  updateDealer(dt) {
    const g = this.game;
    if (this.dealer) {
      const d = this.dealer;
      d.t += dt;
      if (d.t > 160 || d.npc.hidden || d.npc.incident) this.clearDealer();
      return;
    }
    if (!g.quests.isDone('q1_rigging') || this.collapsed) return;
    this.dealerCD -= dt;
    if (this.dealerCD > 0) return;
    this.dealerCD = 80 + Math.random() * 80;
    const pp = g.player.position;
    const pool = [...g.npcs.campers, g.npcs.get('rocky')].filter((n) => n && !NO_STASH.includes(n.def.id) && n.def.id !== 'leocitas' && !n.hidden && !n.incident && !n.task && !n.talking);
    const cands = pool.filter((n) => { const d = n.position.distanceTo(pp); return d > 10 && d < 70; });
    if (!cands.length) { this.dealerCD = 15; return; }
    const npc = cands[Math.floor(Math.random() * cands.length)];
    this.dealer = { npc, item: pick(['keta', 'speed', 'weed', 'weed']), t: 0 };
    if (!this.dealerHinted) {
      this.dealerHinted = true;
      g.ui.toast(L({ de: '🔵 Blaues ! – da will dir jemand was anbieten. Nein sagen ist auch okay.', en: '🔵 Blue ! – someone wants to offer you something. Saying no is fine too.' }));
    }
    g.updateMarkers();
  }

  async dealerTalk(npc) {
    const g = this.game;
    const d = this.dealer;
    const it = this.item(d.item);
    const de = getLang() === 'de';
    const karma = g.quests.state.karma;
    const choice = await g.runDialog(
      [{ who: npc.def.id, text: `${L(pick(DEALER_LINES[d.item]))} ${de ? `${it.cost} Karma.` : `${it.cost} karma.`}` }],
      [de ? `${it.icon} Her damit (✺ ${it.cost})` : `${it.icon} Hand it over (✺ ${it.cost})`, de ? 'Nee, lass mal.' : 'Nah, I\'m good.'],
      npc,
    );
    this.clearDealer();
    if (choice === 0) {
      if (karma < it.cost) {
        await g.reply(npc, de ? 'Kein Karma, kein Stoff. So ist das Universum.' : 'No karma, no stuff. That\'s the universe.');
        return;
      }
      this.buy(it.id);
      await g.reply(npc, de ? 'Viel Spaß. Und… trink Wasser, ja?' : 'Have fun. And… drink some water, yeah?');
    } else {
      g.quests.state.karma += 2;
      await g.reply(npc, de ? 'Auch okay. Mehr für mich.' : 'Fair enough. More for me.');
      g.ui.toast(de ? '✺ +2 – gute Entscheidung, sagt dein Karma.' : '✺ +2 – good call, says your karma.');
      g.refreshHUD();
    }
  }

  /** Can you ask this person whether they have something? */
  canAsk(npc) { return !this.collapsed && npc.def.id !== 'leo'; }

  /** What this NPC carries (decided once per session). */
  stashOf(npc) {
    const id = npc.def.id;
    if (NO_STASH.includes(id)) return [];
    if (!npc._stash) {
      if (STASH_FIXED[id]) npc._stash = STASH_FIXED[id];
      else if (Math.random() < 0.35) {
        const a = pick(STASH_POOL), b = pick(STASH_POOL);
        npc._stash = a === b || Math.random() < 0.5 ? [a] : [a, b];
      } else npc._stash = [];
    }
    return npc._stash;
  }

  /** "Got anything?" – most people don't, some do, a few never would. */
  async stashTalk(npc) {
    const g = this.game;
    const de = getLang() === 'de';
    const id = npc.def.id;
    if (NO_STASH.includes(id)) {
      await g.runDialog([{ who: id, text: NO_STASH_LINES[id] }], null, npc);
      return;
    }
    const stash = this.stashOf(npc);
    if (!stash.length) { await g.runDialog([{ who: id, text: pick(NOTHING_LINES) }], null, npc); return; }
    if ((npc._stashT ?? -999) > g.time - STASH_CD) { await g.runDialog([{ who: id, text: pick(EMPTY_LINES) }], null, npc); return; }
    const items = stash.map((s) => this.item(s));
    const karma = g.quests.state.karma;
    const choice = await g.runDialog(
      [{ who: id, text: `${L(pick(HAVE_LINES))} ${de ? `(Du hast ✺ ${karma})` : `(You have ✺ ${karma})`}` }],
      [...items.map((it) => `${it.icon} ${L(it.name)} (✺ ${it.cost}) – ${L(it.desc)}`), de ? 'Doch nicht, danke.' : 'Never mind, thanks.'],
      npc,
    );
    const it = items[choice];
    if (!it) { await g.reply(npc, de ? 'Auch gut. Bleib sauber!' : 'Fair enough. Stay clean!'); return; }
    // Leocitas gives a little weed away even without karma
    if (this.buy(it.id) || (id === 'leocitas' && this.buy(it.id, true))) {
      npc._stashT = g.time;
      await g.reply(npc, de ? 'Viel Spaß. Von mir hast du das nicht.' : 'Have fun. You didn\'t get that from me.');
    } else await g.reply(npc, de ? 'Kein Karma, kein Stoff. So ist das Universum.' : 'No karma, no stuff. That\'s the universe.');
  }

  /** Mark & Fabi: a little shop dialog. Returns false if the NPC sells nothing right now. */
  async vendorTalk(npc) {
    const items = this.vendorItems(npc.def.id);
    if (!items.length) return false;
    const g = this.game;
    const de = getLang() === 'de';
    const greet = {
      mark: de ? 'Das Zelt? Wird. Irgendwann. Der Chai kocht trotzdem – auf dem Campingkocher! Mate hab ich auch, macht schnelle Beine.' : 'The tent? It\'ll happen. Someday. The chai is brewing anyway – on the camping stove! Got mate too, gives you quick legs.',
      fabi: de ? 'Du brauchst was? Profi-Gaffa hab ich. Das gute. Nicht das aus dem Hühnercontainer.' : 'Need something? I\'ve got pro gaffa. The good stuff. Not the one from the chicken container.',
      thompsen: de ? 'HAHAHA! Bier? Bier! Fünf Karma, Kasten steht unterm Tisch. Hehehe.' : 'HAHAHA! Beer? Beer! Five karma, the crate is under the table. Hehehe.',
      jonas: de ? 'SKÅL! Ein Bier für die Strohwand-Wikinger? Fünf Karma. Der Kasten ist immer kalt. Fast immer.' : 'SKÅL! A beer for the straw-wall vikings? Five karma. The crate is always cold. Almost always.',
    }[npc.def.id];
    const karma = g.quests.state.karma;
    const choice = await g.runDialog(
      [{ who: npc.def.id, text: `${greet} ${de ? `(Du hast ✺ ${karma})` : `(You have ✺ ${karma})`}` }],
      [...items.map((it) => `${it.icon} ${L(it.name)} (✺ ${it.cost}) – ${L(it.desc)}`), de ? 'Nichts, danke.' : 'Nothing, thanks.'],
      npc,
    );
    const it = items[choice];
    if (!it) { await g.reply(npc, npc.line()); return true; }
    if (this.buy(it.id)) await g.reply(npc, de ? 'Bitteschön! Karma ist die einzige Währung, die hier noch was wert ist.' : 'There you go! Karma is the only currency still worth anything here.');
    else await g.reply(npc, de ? 'Zu wenig Karma. Hilf mal jemandem, dann reden wir weiter.' : 'Not enough karma. Go help someone, then we\'ll talk.');
    return true;
  }

  list() {
    const out = [];
    if (this.mateT > 0) out.push(`🧉 ${Math.ceil(this.mateT)}s`);
    if (this.chaiT > 0) out.push(`🍵 ${Math.ceil(this.chaiT)}s`);
    if (this.gaffa > 0) out.push(`🩹 ×${this.gaffa}`);
    if (this.weedT > 0) out.push(`🌿 ${Math.ceil(this.weedT)}s`);
    if (this.beerLevel > 0) out.push(`🍺 ${'●'.repeat(this.beerLevel)}`);
    if (this.speedT > 0 || this.speedLevel > 0) out.push(`⚡${this.speedT > 0 ? ' ' + Math.ceil(this.speedT) + 's' : ''}${this.speedLevel ? ' ' + '●'.repeat(this.speedLevel) : ''}`);
    if (this.ketaCharges > 0 || this.ketaT > 0) out.push(`🌀 ${this.ketaCharges > 0 ? '×' + this.ketaCharges : ''}${this.ketaLevel ? ' ' + '●'.repeat(this.ketaLevel) : ''}`);
    return out;
  }

  /** Too much: fall over, wake up in the awareness tent, karma gone. */
  async collapse(kind = 'keta') {
    const g = this.game;
    if (this.collapsed) return;
    this.collapsed = true;
    g.ui.closeModal?.();
    const p = g.player;
    if (p.vehicle) g.exitVehicle();
    p.frozen = true;
    p.char.play('death', 0.2, { once: true });
    g.ui.fade(true);
    await new Promise((r) => setTimeout(r, 1800));
    const tent = g.world.structures.awareness?.object.position;
    const where = tent || g.world.spots.kitchen;
    p.root.position.set(where.x + 1.2, 0, where.z + 0.8);
    const franzi = g.npcs.get('franzi');
    franzi.task = null;
    franzi.root.position.set(where.x + 2.4, 0, where.z + 1.8);
    const lost = g.quests.state.karma;
    g.quests.state.karma = 0;
    this.reset();
    this.collapsed = true;
    p.char.play('idle', 0.5);
    g.ui.fade(false);
    const de = getLang() === 'de';
    const first = kind === 'beer'
      ? (de ? 'Na du… Aufgewacht? Fünf Bier in der Mittagssonne. Beim Aufbau. Respekt. Und: nein.' : 'Hey you… awake? Five beers in the midday sun. During the build. Respect. And: no.')
      : kind === 'speed'
      ? (de ? 'Na du… Aufgewacht? Dein Herz ist gerade schneller gelaufen als du. Zu viel Speed, hm?' : 'Hey you… awake? Your heart was running faster than you. Too much speed, huh?')
      : (de ? 'Na du… Aufgewacht? Du bist einfach umgekippt. Zu viel Keta, hm?' : 'Hey you… awake? You just collapsed. Too much keta, huh?');
    await g.runDialog([
      { who: 'franzi', text: first },
      { who: 'franzi', text: tent
        ? (de ? 'Du bist hier im Awareness-Zelt. Trink Wasser, iss einen Keks. Du bist sicher.' : 'You\'re in the awareness tent. Drink water, eat a cookie. You\'re safe.')
        : (de ? 'Ich hab noch kein Zelt, also liegst du jetzt halt bei Sabse in der Küche. Sie ist… begeistert.' : 'I don\'t have a tent yet, so you\'re lying in Sabse\'s kitchen. She is… thrilled.') },
      { who: 'franzi', text: de ? `Ach ja, und dein Karma (${lost}) ist weg. Karma ist wie Drogen: Wer zu viel will, hat am Ende nichts.` : `Oh, and your karma (${lost}) is gone. Karma is like drugs: want too much and you end up with nothing.` },
    ], null, franzi);
    this.collapsed = false;
    g.refreshHUD();
  }
}
