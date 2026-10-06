import { getLang } from '../i18n.js';
import { ITEMS } from '../items/itemData.js';
import { mat, box, cyl } from '../world/Props.js';
import * as THREE from 'three';

// Small favours between the big jobs: every few minutes someone from the crew asks for a quick errand
// (fetch something, bring it to them). Some are urgent (timed). Generated at runtime, never repeat back to back.

const C = (de, en) => ({ de, en });

function crate(color) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.35, 0.4, mat(color), 0, 0.18, 0));
  g.add(box(0.52, 0.04, 0.42, mat('#2a2a2a'), 0, 0.37, 0));
  return g;
}
function canister(color) {
  const g = new THREE.Group();
  g.add(box(0.32, 0.45, 0.2, mat(color), 0, 0.23, 0));
  g.add(cyl(0.04, 0.04, 0.08, mat('#222'), 6, 0.08, 0.5, 0));
  return g;
}

// giver, item (id, name, icon, mesh), where it is, what they say
const TEMPLATES = [
  { giver: 'sabse', item: ['err_water', C('Wasserkanister', 'Water canister'), '💧', () => canister('#3a7bd5')], at: 'kuenstler_front',
    ask: C('Ich brauch Wasser. Viel Wasser. Für 200 Portionen Linsen. Der Kanister steht am Künstlergasse-Container.', 'I need water. Lots of water. For 200 portions of lentils. The canister is at the Künstlergasse container.'),
    thanks: C('Na endlich. …Danke. Wirklich.', 'Finally. …Thanks. Really.') },
  { giver: 'felix', item: ['err_fuses', C('Ersatzsicherungen', 'Spare fuses'), '🔌', () => crate('#f1c40f')], at: 'werkstatt_inside',
    ask: C('Mir sind die Sicherungen durchgebrannt. Also, dem Verteiler. Ersatz liegt in der Werkstatt.', 'My fuses blew. Well, the distribution box\'s. Spares are in the workshop.'),
    thanks: C('Perfekt. Gerhard sagt danke. Gerhard ist der Generator.', 'Perfect. Gerhard says thanks. Gerhard is the generator.') },
  { giver: 'mark', item: ['err_cardamom', C('Sack Kardamom', 'Sack of cardamom'), '🌿', () => crate('#7fb040')], at: 'huehner_front',
    ask: C('Der Kardamom ist alle! ALLE! Am Hühnercontainer steht noch ein Sack. Hoffentlich.', 'The cardamom is gone! GONE! There\'s another sack at the chicken container. Hopefully.'),
    thanks: C('Gerettet. Der Chai ist gerettet. Du kriegst den ersten.', 'Saved. The chai is saved. You get the first one.') },
  { giver: 'fabbe', needs: 'q8_forestdome', item: ['err_rope', C('Seilrolle', 'Coil of rope'), '🧵', () => crate('#c9a27a')], at: 'werkstatt_inside',
    ask: C('Mir fehlt eine Seilrolle für den Dome. Werkstatt, ganz hinten. Danke dir schon mal!', 'I\'m missing a coil of rope for the dome. Workshop, at the very back. Thanks in advance!'),
    thanks: C('Super! Jetzt hält er. Also… noch mehr als vorher.', 'Great! Now it holds. Well… even more than before.') },
  { giver: 'mia', needs: 'n2_narnia', item: ['err_lights', C('Lichterketten', 'Fairy lights'), '✨', () => crate('#ff6ab4')], at: 'kuenstler_front',
    ask: C('Ich brauch noch Lichterketten für den Elefanten! Die sind am Künstlergasse-Container. 💛', 'I need more fairy lights for the elephant! They\'re at the Künstlergasse container. 💛'),
    thanks: C('Der Elefant wird LEUCHTEN! Danke! 💛', 'The elephant is going to SHINE! Thanks! 💛') },
  { giver: 'jan', item: ['err_bands', C('Bändchen-Nachschub', 'More wristbands'), '🎫', () => crate('#e74c3c')], at: 'C4_front',
    ask: C('Mir gehen die Bändchen aus. Der Nachschub steht beim Hühnercontainer. Wer verliert die alle?!', 'I\'m running out of wristbands. The refill is at the chicken container. Who keeps losing them?!'),
    thanks: C('Danke. Ich zähl sie jetzt. Alle. Einzeln.', 'Thanks. I\'ll count them now. All of them. One by one.') },
  { giver: 'corni', item: ['err_gaffa', C('Karton Gaffa', 'Box of gaffa'), '🩹', () => crate('#2a2a2a')], at: 'kuenstler_front',
    ask: C('Gaffa ist alle. Ohne Gaffa fällt hier alles auseinander. Wortwörtlich. Künstlergasse-Container.', 'Out of gaffa. Without gaffa everything falls apart here. Literally. Künstlergasse container.'),
    thanks: C('Gaffa! Jetzt bauen wir die Welt.', 'Gaffa! Now we\'ll build the world.') },
  { giver: 'harry', item: ['err_hdmi', C('Beamer-Kabel', 'Projector cable'), '📽️', () => crate('#1a1a1a')], at: 'office_inside',
    ask: C('Das lange Beamer-Kabel liegt im Büro. Jan benutzt es als… frag nicht. Hol es einfach.', 'The long projector cable is in the office. Jan uses it as… don\'t ask. Just get it.'),
    thanks: C('Jetzt kann ich mappen! Also nachts. Jetzt nicht. Aber dann!', 'Now I can map! Well, at night. Not now. But then!') },
  { giver: 'franzi', item: ['err_cookies', C('Kekse & Pflaster', 'Cookies & plasters'), '🍪', () => crate('#d6a21e')], at: 'kitchen',
    ask: C('Mir gehen Kekse und Pflaster aus. Sabse hat Nachschub in der Küche. Sag, es ist für mich.', 'I\'m running out of cookies and plasters. Sabse has more in the kitchen. Say it\'s for me.'),
    thanks: C('Du bist ein Schatz. Jetzt sind alle wieder versorgt.', 'You\'re a treasure. Now everyone\'s looked after again.') },
  { giver: 'aphi', item: ['err_paraffin', C('Kanister Lampenöl', 'Canister of paraffin'), '🔥', () => canister('#c0392b')], at: 'werkstatt_inside',
    ask: C('Ohne Lampenöl kein Feuer heute Nacht. Der Kanister steht in der Werkstatt.', 'No paraffin, no fire tonight. The canister is in the workshop.'),
    thanks: C('Heute Nacht brennt\'s! Also, die Stäbe. Kontrolliert.', 'Tonight it burns! The staffs, I mean. Controlled.') },
  { giver: 'thomas', item: ['err_extension', C('Verlängerungskabel', 'Extension cable'), '🔌', () => crate('#e67e22')], at: 'huehner_front',
    ask: C('Kannst du mir ein Verlängerungskabel vom Hühnercontainer holen? Ich hab gerade beide Hände voll!', 'Could you get me an extension cable from the chicken container? My hands are full right now!'),
    thanks: C('Danke dir! Du bist super. Echt!', 'Thank you! You\'re great. Really!') },
  { giver: 'juli', item: ['err_drill', C('Julis Akkuschrauber', 'Juli\'s drill'), '🪛', () => crate('#2ea84a')], at: 'fire_rack',
    ask: C('Irgendwer hat meinen Akkuschrauber zur Feuerinsel geschleppt. Hol ihn. Bitte. Ja, ich hab bitte gesagt.', 'Someone dragged my drill to the fire island. Get it. Please. Yes, I said please.'),
    thanks: C('…Danke.', '…Thanks.') },
];

// favour: pass a message on (and come back with the answer)
const MESSAGES = [
  { from: 'sabse', to: 'mark', ask: C('Sag Mark, er soll mir meine Gewürze zurückbringen. ALLE.', 'Tell Mark to bring my spices back. ALL of them.'),
    msg: C('Sabse will ihre Gewürze zurück. Alle.', 'Sabse wants her spices back. All of them.'), reply: C('Welche Gewürze? …Okay, die hier. Und die. Und die da.', 'Which spices? …Okay, these. And these. And those.'), back: C('Na also. Geht doch.', 'There you go. See.') },
  { from: 'corni', to: 'fabi', ask: C('Frag Fabi, ob er die Stahlseile gesehen hat. Ich weiß, dass ich sie hab. Ich will\'s nur nochmal hören.', 'Ask Fabi whether he\'s seen the steel wires. I know I have them. I just want to hear it again.'),
    msg: C('Corni fragt, ob du die Stahlseile gesehen hast.', 'Corni asks whether you\'ve seen the steel wires.'), reply: C('Er HAT die Stahlseile. Seit Tag eins. Sag ihm das. Bitte.', 'He HAS the steel wires. Since day one. Tell him. Please.'), back: C('…Ich wollte nur sichergehen.', '…I just wanted to be sure.') },
  { from: 'felix', to: 'julez', ask: C('Sag Julez, das Lichtkonzept ist final. FINAL.', 'Tell Julez the lighting concept is final. FINAL.'),
    msg: C('Felix sagt, das Lichtkonzept ist final.', 'Felix says the lighting concept is final.'), reply: C('Final ist es, wenn es richtig ist. Sag ihm das.', 'It\'s final when it\'s right. Tell him that.'), back: C('*seufz* Kann man so sagen. Ist halt falsch.', '*sigh* You could say that. It\'s just wrong.') },
  { from: 'mia', to: 'lenny', ask: C('Sag Lenny, sie soll schrauben, nicht tanzen. Lieb, aber bestimmt. 💛', 'Tell Lenny to screw, not dance. Kindly but firmly. 💛'),
    msg: C('Mia sagt: schrauben, nicht tanzen.', 'Mia says: screw, don\'t dance.'), reply: C('Ich schraub doch! Im Takt!', 'I am screwing! In rhythm!'), back: C('Im Takt… okay. Das zählt. 💛', 'In rhythm… okay. That counts. 💛') },
  { from: 'silke', to: 'juli', ask: C('Frag Juli, ob wir einen Hammer leihen dürfen. Für die Vision.', 'Ask Juli if we can borrow a hammer. For the vision.'),
    msg: C('Die Chai-Crew fragt nach einem Hammer. Für die Vision.', 'The chai crew is asking for a hammer. For the vision.'), reply: C('Für die Vision? Nein. …Na gut. Einen. Und er kommt zurück.', 'For the vision? No. …Fine. One. And it comes back.'), back: C('Juli hat JA gesagt?! Das schreib ich in die Chronik!', 'Juli said YES?! That goes in the chronicle!') },
  { from: 'jan', to: 'corni', ask: C('Erinner Corni ans Teammeeting heute Abend. Er vergisst es immer.', 'Remind Corni of the team meeting tonight. He always forgets.'),
    msg: C('Jan sagt: Teammeeting heute Abend.', 'Jan says: team meeting tonight.'), reply: C('Welches Teamm… ach DAS. Das findet eh nicht statt.', 'Which team meet… oh THAT. That never happens anyway.'), back: C('Es findet statt! …Vermutlich.', 'It\'s happening! …Probably.') },
  { from: 'aylien', to: 'sabse', ask: C('Bring Sabse eine Umarmung von mir. Vorsichtig. 🫶', 'Bring Sabse a hug from me. Carefully. 🫶'),
    msg: C('*umarmt Sabse* Von Aylien.', '*hugs Sabse* From Aylien.'), reply: C('Eine… was? …Raus aus meiner Küche. *lächelt fast*', 'A… what? …Out of my kitchen. *almost smiles*'), back: C('Sie hat FAST gelächelt? Das ist ein Durchbruch! 🫶', 'She ALMOST smiled? That\'s a breakthrough! 🫶') },
  { from: 'alf', to: 'lotta', ask: C('Sag Lotta, ich hab eine neue Geschichte. Die mit dem Esel. Version vier.', 'Tell Lotta I have a new story. The one with the donkey. Version four.'),
    msg: C('Alf hat eine neue Version von der Esel-Geschichte.', 'Alf has a new version of the donkey story.'), reply: C('Version vier?! Ich komm gleich! Die wird jedes Mal besser.', 'Version four?! I\'m coming! It gets better every time.'), back: C('Hehe. Die Wahrheit ist dehnbar.', 'Hehe. The truth is stretchy.') },
  { from: 'georg', to: 'fabbe', ask: C('Sag Fabbe, sein Dome hat eine interessante Energie. Nur damit er\'s weiß.', 'Tell Fabbe his dome has an interesting energy. Just so he knows.'),
    msg: C('Georg sagt, dein Dome hat eine interessante Energie.', 'Georg says your dome has an interesting energy.'), reply: C('Interessant? Was heißt INTERESSANT?! …Danke, glaub ich.', 'Interesting? What does INTERESTING mean?! …Thanks, I think.'), back: C('Ich hab nur gesagt, was ich sehe.', 'I only said what I see.') },
  { from: 'jonas', to: 'thompsen', ask: C('Sag Tinyhaus, ich hab mehr Bier als er. Kälter auch. SKÅL!', 'Tell Tinyhaus I have more beer than him. Colder too. SKÅL!'),
    msg: C('Jonas sagt, er hat mehr Bier. Und kälter.', 'Jonas says he has more beer. And colder.'), reply: C('HAHAHA! Sag ihm: Meins ist wärmer, aber ich lach lauter! HAHAHA!', 'HAHAHA! Tell him: mine is warmer, but I laugh louder! HAHAHA!'), back: C('SKÅL. Das nehm ich als Kapitulation.', 'SKÅL. I\'ll take that as surrender.') },
  { from: 'harry', to: 'janina', ask: C('Frag Janina, welche Farben ihre Tücher haben. Fürs Mapping.', 'Ask Janina what colours her fabrics are. For the mapping.'),
    msg: C('Harry fragt, welche Farben deine Tücher haben.', 'Harry asks what colours your fabrics are.'), reply: C('Alle. Alle Farben. Sag ihm: alle.', 'All. All the colours. Tell him: all.'), back: C('Alle… okay. Ich brauch mehr Beamer.', 'All… okay. I need more projectors.') },
  { from: 'cosma', to: 'mathias', ask: C('Sag Mathias, er soll mal Pause machen. Ich seh doch, dass er zu viel trägt. 😁', 'Tell Mathias to take a break. I can see he\'s carrying too much. 😁'),
    msg: C('Cosma sagt, du sollst Pause machen.', 'Cosma says you should take a break.'), reply: C('Pause? Ich trag doch nur… drei Bretter. Gleichzeitig. Okay, eine kurze. 😄', 'A break? I\'m only carrying… three planks. At once. Okay, a short one. 😄'), back: C('Er hat sich nicht hingesetzt, oder? …Hab ich mir gedacht. 😁', 'He didn\'t sit down, did he? …Thought so. 😁') },
];

// favour: help a volunteer pitch their tent at the camping (a quick skill game)
const TENT_ASKS = [
  [C('Mein Zelt will einfach nicht stehen. Hilfst du mir kurz mit den Heringen?', 'My tent just won\'t stand. Can you help me with the pegs for a sec?'), C('Es steht! Schief, aber es steht! Danke!', 'It stands! Crooked, but it stands! Thanks!')],
  [C('Ich hab die Anleitung von meinem Zelt verloren. Und den Mut. Hilfst du mir?', 'I lost the instructions for my tent. And my courage. Will you help?'), C('Du bist ein Zelt-Flüsterer. Danke!', 'You\'re a tent whisperer. Thanks!')],
  [C('Der Wind hat mein Zelt umgeweht. Zum dritten Mal. Hilf mir, bevor es nach Karlsfeld fliegt!', 'The wind blew my tent over. For the third time. Help me before it flies to Karlsfeld!'), C('Es bleibt! Es BLEIBT! Danke dir!', 'It stays! It STAYS! Thank you!')],
  [C('Mein Zelt ist ein Wurfzelt. Ich hab es geworfen. Jetzt ist es da drüben. Hilfst du?', 'My tent is a pop-up tent. I threw it. Now it\'s over there. Help?'), C('Danke! Nächstes Mal werf ich nicht so weit.', 'Thanks! Next time I won\'t throw it so far.')],
];

// favour: have a beer with someone (karma + a little buzz)
const BEER_ASKS = {
  thompsen: [C('HAHAHA! Komm, trink ein Bier mit mir! Hol zwei aus dem Kühlschrank im Aufenthaltszelt! HAHA!', 'HAHAHA! Come on, have a beer with me! Grab two from the fridge in the crew tent! HAHA!'), C('PROST! HAHAHA! Siehst du? Gemeinsam lacht sich\'s besser!', 'CHEERS! HAHAHA! See? Laughing\'s better together!')],
  jonas: [C('SKÅL! Zeit für ein Feierabendbier. Also, ein Zwischendurchbier. Holst du zwei aus dem Aufenthaltszelt?', 'SKÅL! Time for an after-work beer. Well, a middle-of-work beer. Grab two from the crew tent?'), C('SKÅL! Auf die Strohwände! Und auf dich!', 'SKÅL! To the straw walls! And to you!')],
  strom_andi: [C('Hey! Felix sieht gerade nicht hin. Hol uns zwei Bier aus dem Aufenthaltszelt, schnell!', 'Hey! Felix isn\'t looking. Grab us two beers from the crew tent, quick!'), C('Prost! Auf den Strom! Und auf Pausen, von denen Felix nix weiß!', 'Cheers! To the power! And to breaks Felix doesn\'t know about!')],
};

// favour: pick up rubbish somewhere on the site
const TRASH_GIVERS = {
  franzi: [C('{Place} liegt überall Müll rum. Sammelst du drei Säcke ein? Für die Umwelt. Und für mich.', 'There\'s rubbish everywhere {place}. Could you collect three bags? For the planet. And for me.'), C('Danke! Die Wiese sagt danke. Schwarzhuber auch, glaub ich.', 'Thanks! The meadow says thanks. Schwarzhuber too, I think.')],
  isi: [C('Wer lässt seinen Müll {place} liegen?! Hilfst du mir beim Einsammeln? Drei Säcke!', 'Who leaves their rubbish {place}?! Help me collect it? Three bags!'), C('Super! Weißt du, was jetzt fehlt? Ein Wettrennen zum Müllcontainer!', 'Great! You know what\'s missing now? A race to the bin!')],
  annika: [C('Bevor die Gäste kommen, muss der Müll {place} weg. Drei Säcke, schaffst du das?', 'Before the guests arrive, the rubbish {place} has to go. Three bags, can you do it?'), C('Perfekt. Jetzt sieht\'s fast aus wie geplant.', 'Perfect. Now it almost looks like it was planned.')],
  schwarzhuber: [C('Auf mei Wiesn {place} liegt Müll. Dilettantisch! Klaub des zamm, drei Säck!', 'There\'s rubbish on my meadow {place}. Amateurs! Pick it up, three bags!'), C('Na also. Geht doch, wennst willst.', 'There you go. You can if you want.')],
};
// place names come with their preposition: "Müll {place}" → "Müll an der Bierbank"
const TRASH_PLACES = [['plot_mainstage', C('an der Mainstage', 'at the mainstage')], ['plot_narnia_floor', C('am Narnia Floor', 'at the Narnia Floor')], ['plot_firespace', C('am Firespace', 'at the Firespace')], ['plot_hammocks', C('im Hängemattenwald', 'in the hammock forest')], ['chill', C('an der Bierbank', 'at the beer bench')], ['plot_entrance', C('am Eingang', 'at the entrance')]];

function trashBag() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat('#1a1a1a'));
  m.scale.set(1, 1.2, 1); m.position.y = 0.3; g.add(m);
  g.add(cyl(0.05, 0.08, 0.12, mat('#1a1a1a'), 6, 0, 0.66, 0));
  return g;
}
function beerPair() {
  const g = new THREE.Group();
  for (const x of [-0.07, 0.07]) { g.add(cyl(0.035, 0.035, 0.2, mat('#5a3a10'), 8, x, 0.1, 0)); g.add(cyl(0.012, 0.02, 0.06, mat('#5a3a10'), 6, x, 0.23, 0)); }
  return g;
}

const URGENT = [
  C('SCHNELL! ', 'QUICK! '), C('Notfall: ', 'Emergency: '), C('Es eilt! ', 'It\'s urgent! '),
];

export class Errands {
  constructor(game) {
    this.game = game;
    this.cd = 25;
    this.seq = 0;
    this.lastGiver = null;
    this.offers = []; // [{ qid, t }] favours offered but not taken yet
    for (const t of TEMPLATES) {
      const [id, name, icon, mesh] = t.item;
      ITEMS[id] = { name, icon, mesh };
    }
    ITEMS.err_beer = { name: C('Zwei Bier', 'Two beers'), icon: '🍺', mesh: beerPair };
    for (const k of ['a', 'b', 'c']) ITEMS[`err_trash_${k}`] = { name: C('Müllsack', 'Bin bag'), icon: '🗑️', mesh: trashBag };
    this.offers = [];
  }

  reset() {
    this.withdraw();
    this.cd = 25;
  }

  /** Remove every favour that was offered but not taken. */
  withdraw() {
    const qs = this.game.quests;
    for (const o of this.offers || []) if (!qs.isActive(o.qid) && !qs.isDone(o.qid)) delete qs.quests[o.qid];
    this.offers = [];
  }

  /** The wheel loader ran dry: a canister is waiting in the crew camp – Fabi knows where. */
  checkDiesel() {
    const g = this.game, qs = g.quests;
    const loader = g.vehicles?.radlader;
    if (!loader || loader.fuel > 0 || !qs.state.flags.fuelUnlocked || g.finale) return;
    if (Object.keys(qs.state.active).some((id) => id.startsWith('err_diesel'))) return;
    const qid = `err_diesel_${++this.seq}`;
    const where = [
      C('Diesel? Ich hab dir einen Kanister beim blauen Bauwagen hingestellt. Vorne am Tor. Ich weiß immer, wo Diesel ist. Fast immer.', 'Diesel? I put a canister for you by the blue site trailer. Near the gate. I always know where diesel is. Almost always.'),
      C('Radlader leer? Klassiker. Kanister steht beim blauen Bauwagen. Ich hab ihn mit „NICHT ANFASSEN“ beschriftet. Du darfst trotzdem.', 'Loader empty? Classic. Canister\'s by the blue site trailer. I labelled it "DON\'T TOUCH". You\'re allowed anyway.'),
      C('Diesel liegt beim blauen Bauwagen. Woher ich das weiß? Ich hab eine Liste. Die Liste ist weg, aber ich weiß es trotzdem.', 'Diesel is by the blue site trailer. How do I know? I have a list. The list is gone, but I know anyway.'),
    ];
    const q = {
      id: qid, giver: 'fabi', requires: [], errand: true,
      title: C('Diesel für den Radlader', 'Diesel for the wheel loader'),
      summary: C('Der Radlader ist leer. Fabi weiß, wo ein Kanister steht.', 'The wheel loader is empty. Fabi knows where there\'s a canister.'),
      steps: [
        { type: 'talk', npc: 'fabi', text: C('Frag Fabi nach Diesel', 'Ask Fabi about diesel'), dialog: [{ who: 'fabi', text: where[this.seq % where.length] }] },
        { type: 'pickup', text: C('Hol den Dieselkanister beim blauen Bauwagen', 'Get the diesel canister by the blue site trailer'), items: [{ item: 'diesel_can', at: 'diesel_spot' }] },
        { type: 'fuel', vehicle: 'radlader', items: ['diesel_can'], text: C('Tank den Radlader auf', 'Fuel the wheel loader') },
      ],
      reward: { karma: 5 },
    };
    qs.quests[qid] = q;
    qs.accept(qid);
    g.ui.toast(getLang() === 'de' ? '⛽ Der Radlader ist leer! Fabi weiß, wo Diesel ist.' : '⛽ The wheel loader is empty! Fabi knows where there\'s diesel.');
    g.refreshHUD();
  }

  update(dt) {
    const g = this.game, qs = g.quests;
    this.checkDiesel();
    // offers nobody took for a while disappear again
    this.offers = this.offers.filter((o) => {
      if (qs.isActive(o.qid) || qs.isDone(o.qid)) return false;
      o.t += dt;
      if (o.t > 240) { delete qs.quests[o.qid]; g.refreshHUD(); return false; }
      return true;
    });
    if (!g.registered || qs.timer || g.finale) return;
    const running = Object.keys(qs.state.active).filter((id) => id.startsWith('err_') && !id.startsWith('err_diesel')).length;
    if (running + this.offers.length >= 3) return; // there's always something to do – but not a flood
    this.cd -= dt;
    if (this.cd > 0) return;
    this.cd = 35 + Math.random() * 45;
    this.spawn();
  }

  free(id) {
    const g = this.game, n = g.npcs.get(id);
    return n && !n.hidden && !n.incident && !n.away && !n.task && !g.quests.npcMarker(id) && !this.offers.some((o) => g.quests.quests[o.qid]?.giver === id);
  }

  spawn() {
    const roll = Math.random();
    const kind = roll < 0.3 ? 'fetch' : roll < 0.5 ? 'tent' : roll < 0.72 ? 'message' : roll < 0.84 ? 'beer' : 'trash';
    const q = this[`make_${kind}`]() || this.make_fetch() || this.make_message();
    if (!q) return;
    const g = this.game;
    g.quests.quests[q.id] = q;
    this.offers.push({ qid: q.id, t: 0 });
    this.lastGiver = q.giver;
    g.refreshHUD();
  }

  newId(kind) { return `err_${kind}_${Date.now().toString(36)}_${++this.seq}`; }

  base(id, giver, title, ask, steps, karma, extra = {}) {
    return {
      id, giver, requires: [], errand: true, title, summary: ask, offer: [{ who: giver, text: ask }],
      accept: C('Mach ich!', 'On it!'), decline: C('Gerade nicht.', 'Not right now.'), steps, reward: { karma }, ...extra,
    };
  }

  make_fetch() {
    const g = this.game;
    const ok = TEMPLATES.filter((t) => this.free(t.giver) && t.giver !== this.lastGiver && g.world.spots[t.at] && (!t.needs || g.quests.isDone(t.needs)));
    if (!ok.length) return null;
    const t = ok[Math.floor(Math.random() * ok.length)];
    const urgent = Math.random() < 0.3;
    const name = t.item[1], itemId = t.item[0];
    const giverName = g.npcs.get(t.giver).def.name;
    const ask = urgent ? C(URGENT[this.seq % URGENT.length].de + t.ask.de, URGENT[this.seq % URGENT.length].en + t.ask.en) : t.ask;
    return this.base(this.newId('fetch'), t.giver, urgent ? C(`Schnell: ${name.de}`, `Quick: ${name.en}`) : C(`Gefallen: ${name.de}`, `Favour: ${name.en}`), ask, [
      { type: 'pickup', text: C(`Hol: ${name.de}`, `Get: ${name.en}`), items: [{ item: itemId, at: t.at }] },
      { type: 'talk', npc: t.giver, text: C(`Bring es zu ${giverName}`, `Bring it to ${giverName}`), consumes: [itemId], dialog: [{ who: t.giver, text: t.thanks }] },
    ], urgent ? 15 : 8, {
      timeLimit: urgent ? 75 : undefined,
      failDialog: [{ who: t.giver, text: C('Zu spät… Na gut. Frag mich nochmal, wenn du Zeit hast.', 'Too late… Fine. Ask me again when you have time.') }],
    });
  }

  make_tent() {
    const g = this.game;
    let cands = g.npcs.campers.filter((n) => n.def.roam === 'camp_random' && this.free(n.def.id));
    if (!cands.length) cands = g.npcs.campers.filter((n) => ['wander', 'builder'].includes(n.def.behavior) && this.free(n.def.id)); // early on: anyone who's around
    const spots = g.world.campSpots || [];
    if (!cands.length || !spots.length) return null;
    const n = cands[Math.floor(Math.random() * cands.length)];
    const [ask, thanks] = TENT_ASKS[Math.floor(Math.random() * TENT_ASKS.length)];
    const id = this.newId('tent');
    const sp = spots[Math.floor(Math.random() * spots.length)];
    const spotName = `${id}_spot`;
    g.world.spots[spotName] = new THREE.Vector3(sp.x + 3.5, 0, sp.z - 2.5);
    n.home = g.world.spots[spotName].clone(); // they wait next to their (not yet) tent
    n.target = null;
    return this.base(id, n.def.id, C(`Zelt für ${n.def.name}`, `A tent for ${n.def.name}`), ask, [
      {
        type: 'work', text: C(`Hilf ${n.def.name}, das Zelt am Campingplatz aufzubauen`, `Help ${n.def.name} pitch the tent at the camping`), targets: [spotName], workTime: 2,
        label: C('Heringe einschlagen', 'Hammer in the pegs'), minigame: 'mash', minigameTitle: C('Heringe rein! Hau drauf!', 'Pegs in! Hammer away!'), minigameOpts: { need: 11, time: 4.5 },
        minigameFail: C('Der Hering ist krumm. Neuer Hering, neues Glück.', 'The peg is bent. New peg, new luck.'),
      },
      { type: 'talk', npc: n.def.id, text: C(`Sag ${n.def.name} Bescheid`, `Tell ${n.def.name}`), dialog: [{ who: n.def.id, text: thanks }] },
    ], 8, { tentAt: spotName });
  }

  make_message() {
    const ok = MESSAGES.filter((m) => this.free(m.from) && this.game.npcs.get(m.to) && !this.game.npcs.get(m.to).hidden && m.from !== this.lastGiver);
    if (!ok.length) return null;
    const m = ok[Math.floor(Math.random() * ok.length)];
    const g = this.game;
    const toName = g.npcs.get(m.to).def.name, fromName = g.npcs.get(m.from).def.name;
    return this.base(this.newId('msg'), m.from, C(`Nachricht an ${toName}`, `Message for ${toName}`), m.ask, [
      { type: 'talk', npc: m.to, text: C(`Richte ${toName} die Nachricht aus`, `Pass the message on to ${toName}`), dialog: [{ who: 'you', text: m.msg }, { who: m.to, text: m.reply }] },
      { type: 'talk', npc: m.from, text: C(`Bring ${fromName} die Antwort`, `Bring ${fromName} the answer`), dialog: [{ who: 'you', text: m.reply }, { who: m.from, text: m.back }] },
    ], 6);
  }

  make_beer() {
    const g = this.game;
    const ok = Object.keys(BEER_ASKS).filter((id) => this.free(id) && g.world.spots.aufenthalt);
    if (!ok.length || g.effects.beerLevel >= 3) return null;
    const id = ok[Math.floor(Math.random() * ok.length)];
    const [ask, cheers] = BEER_ASKS[id];
    const name = g.npcs.get(id).def.name;
    return this.base(this.newId('beer'), id, C(`Ein Bier mit ${name}`, `A beer with ${name}`), ask, [
      { type: 'pickup', text: C('Hol zwei Bier aus dem Kühlschrank im Aufenthaltszelt', 'Get two beers from the fridge in the crew tent'), items: [{ item: 'err_beer', at: 'aufenthalt' }] },
      { type: 'talk', npc: id, text: C(`Stoß mit ${name} an`, `Clink glasses with ${name}`), consumes: ['err_beer'], dialog: [{ who: id, text: cheers }] },
    ], 10, { beer: true });
  }

  make_trash() {
    const g = this.game;
    const ok = Object.keys(TRASH_GIVERS).filter((id) => this.free(id));
    if (!ok.length) return null;
    const id = ok[Math.floor(Math.random() * ok.length)];
    const [placeSpot, placeName] = TRASH_PLACES[Math.floor(Math.random() * TRASH_PLACES.length)];
    if (!g.world.spots[placeSpot]) return null;
    const [ask, thanks] = TRASH_GIVERS[id];
    const name = g.npcs.get(id).def.name;
    const cap = (s) => s[0].toUpperCase() + s.slice(1);
    const fill = (t) => C(t.de.replace('{Place}', cap(placeName.de)).replace('{place}', placeName.de), t.en.replace('{place}', placeName.en));
    return this.base(this.newId('trash'), id, C(`Müll ${placeName.de}`, `Rubbish ${placeName.en}`), fill(ask), [
      { type: 'pickup', text: fill(C('Sammel drei Müllsäcke {place} ein', 'Collect three bin bags {place}')), items: ['a', 'b', 'c'].map((k) => ({ item: `err_trash_${k}`, at: placeSpot, search: 14 })) },
      { type: 'talk', npc: id, text: C(`Bring die Säcke zu ${name}`, `Bring the bags to ${name}`), consumes: ['err_trash_a', 'err_trash_b', 'err_trash_c'], dialog: [{ who: id, text: thanks }] },
    ], 10);
  }
}
