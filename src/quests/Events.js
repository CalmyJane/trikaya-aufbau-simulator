import * as THREE from 'three';
import { L, getLang } from '../i18n.js';

// Personal drama & chaos that keeps you from doing your actual job.
//
// Types:
//   nail         – someone stepped into a nail                → Franzi treats on the spot
//   passedout    – someone passed out                         → Franzi wakes them & takes them to awareness
//   drunk/high/keta – too drunk / too high / completely wasted → Franzi takes them to the awareness tent
//   kitchenfight – fight in the kitchen                       → Fabi or Jan (Leo, good luck)
//   generator    – power generator broke                      → Felix, Thompsen, Andi, Strom Andi, Juli (or buy a new one)
//   julifight    – Juli gets into it with a volunteer          → Jan or Fabi (Leo, good luck)
//   pump         – the WC "Kackepumpe" (lifting pump)         → Juli, Andi
//
// Story people (Corni, Matze, Felix, …) can be the ones who are too wasted. They can't give
// or continue jobs until Franzi has looked after them – and she needs her awareness tent for that.

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// people whose absence hurts the story
const STORY = ['corni', 'matze', 'fabi', 'mark', 'felix', 'fabbe', 'harry', 'niklas', 'flo', 'andi', 'estenko', 'rocky', 'thompsen', 'strom_andi'];
// never victims (they're needed as helpers or it wouldn't make sense)
const NEVER = ['stella', 'leo', 'franzi', 'sabse', 'jan', 'juli', 'verena', 'fabi', 'isi', 'mia', 'daniel', 'delsin'];

// Juli vs. a volunteer. {a} = the volunteer.
export const JULI_FIGHTS = [
  { intro: { de: 'Juli und {a} stehen sich gegenüber. {a} hat einen Akkuschrauber in der Hand. Julis Akkuschrauber.', en: 'Juli and {a} are facing off. {a} is holding a cordless drill. Juli\'s cordless drill.' },
    line: { de: 'Das ist MEIN Akkuschrauber! … Da stand doch kein Name drauf! … Da steht JULI drauf. In GROSS.', en: 'That\'s MY drill! … There was no name on it! … It says JULI. In CAPITALS.' },
    shouts: [{ de: 'GIB HER!', en: 'GIVE IT!' }, { de: 'Ich hab den nur geliehen!', en: 'I only borrowed it!' }, { de: 'Ohne zu fragen ist das KLAUEN!', en: 'Without asking that\'s STEALING!' }] },
  { intro: { de: 'Juli baut gerade ab, was {a} eben aufgebaut hat. {a} ist… nicht begeistert.', en: 'Juli is taking down what {a} just built. {a} is… not thrilled.' },
    line: { de: 'Das ist schief. … Das ist KUNST! … Das ist SCHIEF.', en: 'That\'s crooked. … That\'s ART! … That\'s CROOKED.' },
    shouts: [{ de: 'SCHIEF!', en: 'CROOKED!' }, { de: 'Das hatte eine Energie!', en: 'It had an energy!' }, { de: 'Energie hält keine Plane!', en: 'Energy doesn\'t hold a tarp!' }] },
  { intro: { de: '{a} will Julis Werkzeugkiste fürs Chai-Zelt ausleihen.', en: '{a} wants to borrow Juli\'s toolbox for the chai tent.' },
    line: { de: 'Für das Chai-Zelt? Das Zelt, das seit Montag nicht steht? NEIN. … Aber wir brauchen sie für die VISION! … NEIN.', en: 'For the chai tent? The tent that hasn\'t stood since Monday? NO. … But we need it for the VISION! … NO.' },
    shouts: [{ de: 'NEIN!', en: 'NO!' }, { de: 'Die Vision braucht einen Hammer!', en: 'The vision needs a hammer!' }, { de: 'Die Vision braucht ein ZELT!', en: 'The vision needs a TENT!' }] },
  { intro: { de: '{a} hat den Bus direkt vor die Werkstatt gestellt. Juli steht davor. Mit verschränkten Armen.', en: '{a} parked the van right in front of the workshop. Juli is standing there. Arms crossed.' },
    line: { de: 'Weg mit dem Bus. … Der springt grad nicht an! … Dann SCHIEB.', en: 'Move the van. … It won\'t start right now! … Then PUSH.' },
    shouts: [{ de: 'SCHIEB!', en: 'PUSH!' }, { de: 'Der hat eine Seele, der Bus!', en: 'The van has a soul!' }, { de: 'Dann schieb die Seele!', en: 'Then push the soul!' }] },
  { intro: { de: '{a} hat Gaffa um ein Kabel gewickelt. Sehr viel Gaffa. Juli hat es gesehen.', en: '{a} wrapped gaffa around a cable. A LOT of gaffa. Juli saw it.' },
    line: { de: 'Das ist ein Starkstromkabel, kein Geschenk! … Es hat gewackelt! … DANN SAG WAS!', en: 'That\'s a high-voltage cable, not a present! … It was wobbly! … THEN SAY SOMETHING!' },
    shouts: [{ de: 'Gaffa ist keine Lösung!', en: 'Gaffa is not a solution!' }, { de: 'Gaffa ist IMMER eine Lösung!', en: 'Gaffa is ALWAYS a solution!' }] },
];

// Kitchen fights: usually Sabse vs. a volunteer, sometimes two volunteers. {a} = volunteer, {b} = the other one.
// line = what you hear when you get there, shouts = what they yell while fighting
export const KITCHEN_FIGHTS = [
  { sabse: true,
    intro: { de: 'Sabse und {a} stehen sich in der Küche gegenüber. Es geht um… die Uhrzeit.', en: 'Sabse and {a} are facing off in the kitchen. It\'s about… the time.' },
    line: { de: 'Es ist 12:58! Essen gibt\'s um EINS! … Ich hab aber jetzt Hunger, Sabse!', en: 'It\'s 12:58! Food is at ONE! … But I\'m hungry NOW, Sabse!' },
    shouts: [{ de: 'ZWEI MINUTEN!', en: 'TWO MINUTES!' }, { de: 'Ich hab seit gestern nix gegessen!', en: 'I haven\'t eaten since yesterday!' }, { de: 'Finger weg vom Topf!', en: 'Hands off the pot!' }] },
  { sabse: true,
    intro: { de: 'Sabse hält {a} am Kragen. Im Curry schwimmt etwas Gelbes.', en: 'Sabse has {a} by the collar. Something yellow is floating in the curry.' },
    line: { de: 'Wer tut KÄSE in mein VEGANES Curry?! … Das war doch nur ein bisschen Parmesan!', en: 'Who puts CHEESE in my VEGAN curry?! … It was just a bit of parmesan!' },
    shouts: [{ de: 'VEGAN heißt VEGAN!', en: 'VEGAN means VEGAN!' }, { de: 'Parmesan ist quasi Gemüse!', en: 'Parmesan is basically a vegetable!' }] },
  { sabse: true,
    intro: { de: '{a} will Essen. Sabse will eine Essensmarke sehen. Keiner hat eine.', en: '{a} wants food. Sabse wants to see a food token. Nobody has one.' },
    line: { de: 'Ohne Essensmarke kein Essen! … ICH WEISS DOCH NICHT, WO ES DIE MARKEN GIBT!', en: 'No food token, no food! … I DON\'T KNOW WHERE YOU GET THE TOKENS!' },
    shouts: [{ de: 'MARKE!', en: 'TOKEN!' }, { de: 'Wer verteilt die überhaupt?!', en: 'Who even hands them out?!' }, { de: 'Frag Leo! … WER IST LEO?!', en: 'Ask Leo! … WHO IS LEO?!' }] },
  { sabse: true,
    intro: { de: '{a} hat die Dreads in der Spüle gewaschen. Sabse hat es gesehen.', en: '{a} washed their dreads in the sink. Sabse saw it.' },
    line: { de: 'Das ist die SPÜLE, nicht dein BADEZIMMER! … Aber das Wasser ist hier so schön warm!', en: 'This is the SINK, not your BATHROOM! … But the water is so nice and warm here!' },
    shouts: [{ de: 'RAUS mit deinen Haaren!', en: 'OUT with your hair!' }, { de: 'Ist doch Bio-Shampoo!', en: 'It\'s organic shampoo!' }] },
  { sabse: true,
    intro: { de: 'Sabse probiert den Topf, den {a} umgerührt hat. Ihr Gesicht sagt alles.', en: 'Sabse tastes the pot {a} was stirring. Her face says it all.' },
    line: { de: 'Du hast den Topf VERSALZEN! … Das war Kurkuma! …Glaub ich.', en: 'You OVER-SALTED the pot! … That was turmeric! …I think.' },
    shouts: [{ de: 'Das ist ein Salzsee!', en: 'That\'s a salt lake!' }, { de: 'Mit genug Kurkuma schmeckt alles!', en: 'With enough turmeric everything tastes fine!' }] },
  { sabse: false,
    intro: { de: '{a} und {b} ziehen beide an demselben Löffel.', en: '{a} and {b} are both pulling at the same spoon.' },
    line: { de: 'DER hat MEINEN Löffel benutzt! … Das ist ein GEMEINSCHAFTSLÖFFEL!', en: 'HE used MY spoon! … It\'s a COMMUNITY SPOON!' },
    shouts: [{ de: 'MEIN Löffel!', en: 'MY spoon!' }, { de: 'Eigentum ist Diebstahl!', en: 'Property is theft!' }] },
  { sabse: false,
    intro: { de: '{a} und {b} streiten sich um eine leere Kaffeekanne.', en: '{a} and {b} are fighting over an empty coffee pot.' },
    line: { de: 'Das war MEIN letzter Kaffee! … Da stand kein Name drauf!', en: 'That was MY last coffee! … It didn\'t have a name on it!' },
    shouts: [{ de: 'Ich hab ihn GEKOCHT!', en: 'I MADE it!' }, { de: 'Kaffee gehört allen!', en: 'Coffee belongs to everyone!' }] },
  { sabse: false,
    intro: { de: '{a} und {b} streiten sich über die Musik in der Küche.', en: '{a} and {b} are arguing about the music in the kitchen.' },
    line: { de: 'Psytrance beim Zwiebelschneiden ist PFLICHT! … Nicht um sieben Uhr morgens!', en: 'Psytrance while chopping onions is MANDATORY! … Not at seven in the morning!' },
    shouts: [{ de: '145 BPM!', en: '145 BPM!' }, { de: 'Mach das LEISER!', en: 'Turn it DOWN!' }] },
  { sabse: false,
    intro: { de: '{a} und {b} stehen vor einem Berg Geschirr.', en: '{a} and {b} are standing in front of a mountain of dishes.' },
    line: { de: 'Du bist dran mit Spülen! … Ich hab GESTERN gespült! … Gestern war Abbau-Probe!', en: 'Your turn to do the dishes! … I did them YESTERDAY! … Yesterday was a teardown rehearsal!' },
    shouts: [{ de: 'DU bist dran!', en: 'YOUR turn!' }, { de: 'Ich hab Gaffa an den Händen!', en: 'I have gaffa on my hands!' }] },
];

export const AWARENESS_MODES = ['lying', 'drunk', 'high', 'keta'];
export const BUSY_MODES = ['lying', 'drunk', 'high', 'keta', 'follow', 'care'];

// what people say while Franzi walks them to the awareness tent / while being looked after
export const STATE_LINES = {
  drunk: {
    follow: [
      { de: 'Franzi… du bist mein Lieblingsmensch. Seit… wann kennen wir uns?', en: 'Franzi… you\'re my favourite person. Since… when do we know each other?' },
      { de: 'Ich bin nicht betrunken. Ich bin… horizontal motiviert.', en: 'I\'m not drunk. I\'m… horizontally motivated.' },
      { de: 'Warum laufen die Zelte weg?', en: 'Why are the tents running away?' },
      { de: 'Noch ein Bier und ich bau die Mainstage alleine auf!', en: 'One more beer and I\'ll build the mainstage alone!' },
      { de: 'Prooost! …wo ist mein Bier? Wer hat mein Bier?', en: 'Cheeeers! …where\'s my beer? Who has my beer?' },
      { de: 'Ich sing jetzt was. *singt* …das war\'s schon.', en: 'I\'ll sing something now. *sings* …that was it.' },
    ],
    care: [
      { de: 'Wasser. Ja. Wasser ist gut. Wasser ist wie Bier ohne Bier.', en: 'Water. Yes. Water is good. Water is like beer without beer.' },
      { de: 'Ich leg mich nur kurz hin. Nur kurz. Ganz kurz. Zzz.', en: 'I\'ll just lie down for a sec. Just a sec. Zzz.' },
    ],
  },
  high: {
    follow: [
      { de: 'Wusstest du, dass der Drache eigentlich ein Gefühl ist?', en: 'Did you know the dragon is actually a feeling?' },
      { de: 'Die Sonnensegel… die atmen mit mir. Einatmen… ausatmen…', en: 'The shade sails… they breathe with me. In… out…' },
      { de: 'Ich hab so Hunger. Gibt\'s im Awareness-Zelt Kekse? Bitte sag ja.', en: 'I\'m so hungry. Are there cookies in the awareness tent? Please say yes.' },
      { de: 'Alles ist verbunden, Franzi. Auch wir. Und die Kabeltrommel.', en: 'Everything is connected, Franzi. Us too. And the cable drum.' },
      { de: 'Ich hab grad verstanden, wie Gaffa funktioniert. Es ist wunderschön.', en: 'I just understood how gaffa works. It\'s beautiful.' },
      { de: 'Hihihi… dein Schatten ist so lustig… hihihi.', en: 'Hehehe… your shadow is so funny… hehehe.' },
    ],
    care: [
      { de: 'Die Kissen sind so weich… ich wohn jetzt hier.', en: 'The cushions are so soft… I live here now.' },
      { de: 'Kekse! Es gibt wirklich Kekse! Franzi, du bist ein Schatz.', en: 'Cookies! There really are cookies! Franzi, you\'re a treasure.' },
    ],
  },
  keta: {
    follow: [
      { de: 'Ich bin… in einem Loch. Einem schönen, weichen Loch.', en: 'I\'m… in a hole. A nice, soft hole.' },
      { de: 'Meine Beine sind grad… woanders. Ich hol sie später ab.', en: 'My legs are… somewhere else right now. I\'ll pick them up later.' },
      { de: 'Franzi, warum ist die Welt so… verpixelt?', en: 'Franzi, why is the world so… pixelated?' },
      { de: 'Ich hab das Gefühl, ich bin ein Radlader. Piep. Piep. Piep.', en: 'I feel like I\'m a wheel loader. Beep. Beep. Beep.' },
      { de: 'Nicht so schnell… wir laufen doch gar nicht… oder?', en: 'Not so fast… we\'re not even walking… are we?' },
      { de: 'Ich muss dir was Wichtiges sagen… …vergessen.', en: 'I have to tell you something important… …forgot.' },
    ],
    care: [
      { de: 'Ich komm langsam zurück… zurück wohin eigentlich?', en: 'I\'m slowly coming back… back where, actually?' },
      { de: 'Das Zelt dreht sich. Oder ich. Einer von uns dreht sich.', en: 'The tent is spinning. Or I am. One of us is spinning.' },
    ],
  },
  lying: {
    follow: [
      { de: 'Wo bin ich? Wer bin ich? Welcher Tag ist heute?', en: 'Where am I? Who am I? What day is it?' },
      { de: 'Hab ich was verpasst? …Den Aufbau? Den ganzen?', en: 'Did I miss something? …The build? The whole thing?' },
      { de: 'Nur noch fünf Minuten… oder fünf Stunden…', en: 'Just five more minutes… or five hours…' },
      { de: 'Mein Kopf ist ein Dixi. Von innen.', en: 'My head is a portaloo. From the inside.' },
    ],
    care: [
      { de: 'Danke Franzi… du bist ein Engel mit Zöpfen.', en: 'Thanks Franzi… you\'re an angel with pigtails.' },
      { de: 'Ich trink jetzt Wasser. Viel Wasser. Versprochen.', en: 'I\'ll drink water now. Lots of water. Promise.' },
    ],
  },
};

const FRANZI_CARE = [
  { de: 'Ganz ruhig. Du bist hier sicher.', en: 'Easy now. You\'re safe here.' },
  { de: 'Trink mal einen Schluck. Kleine Schlucke.', en: 'Have a sip. Small sips.' },
  { de: 'Ich bleib bei dir, bis es wieder geht.', en: 'I\'ll stay with you until you\'re okay.' },
  { de: 'Kekse sind links, Decken rechts. Und keine Musik.', en: 'Cookies on the left, blankets on the right. And no music.' },
];

export const EVENT_TYPES = {
  nail: {
    weight: 3, helpers: ['franzi'], victims: 1, cost: 40, penalty: 60, karma: 20,
    title: { de: 'Nagel im Fuß!', en: 'Nail in the foot!' },
    task: { de: 'Hol Franzi zu {victim}', en: 'Get Franzi to {victim}' },
    victimLine: { de: 'AUAAA! Ein Nagel! Barfuß war doch keine gute Idee! Hol Franzi!', en: 'OUCH! A nail! Barefoot wasn\'t a great idea! Get Franzi!' },
    helperDialog: { de: 'Ein Nagel? Barfuß? …Natürlich. Ich komm mit dem Verbandskasten!', en: 'A nail? Barefoot? …Of course. I\'m coming with the first-aid kit!' },
    doneLine: { de: 'So. Desinfiziert, verbunden, Tetanus hast du? Gut. Und jetzt: Sandalen.', en: 'There. Disinfected, bandaged, tetanus shot? Good. And now: sandals.' },
    costReason: { de: 'Verbandszeug & Tetanus', en: 'Bandages & tetanus' },
    mode: 'hurt',
  },
  passedout: {
    weight: 2, helpers: ['franzi'], victims: 1, cost: 0, penalty: 0, karma: 25, prefer: ['rocky', 'estenko'], exclude: ['isi'],
    title: { de: 'Jemand liegt im Gras…', en: 'Someone\'s lying in the grass…' },
    task: { de: '{victim} ist umgekippt: hol Franzi', en: '{victim} passed out: get Franzi' },
    victimLine: { de: 'Zzzz… *mumpf* … fünf Minuten noch… zzz', en: 'Zzzz… *mumble* … five more minutes… zzz' },
    helperDialog: { de: 'Oh nein. Ich komm. Erst wach kriegen, dann ab ins Awareness-Zelt: Wasser, Decke, Ruhe.', en: 'Oh no. I\'m coming. Wake them up, then off to the awareness tent: water, blanket, quiet.' },
    doneLine: { de: 'Nur ausgetrocknet und durch. Wasser trinken, Leute!', en: 'Just dehydrated and done. Drink water, people!' },
    noTent: { help: { de: 'Oh nein. Ich komm. Erst wach kriegen, dann ab in den Schatten: Wasser, Decke, Ruhe.', en: 'Oh no. I\'m coming. Wake them up, then into the shade: water, blanket, quiet.' } },
    mode: 'lying',
  },
  drunk: {
    weight: 2, helpers: ['franzi', 'delsin'], victims: 1, cost: 0, penalty: 0, karma: 25, prefer: ['estenko', 'thompsen', 'flo', 'andi', 'strom_andi', 'strom_andi'], exclude: ['isi'], storyChance: 0.4,
    title: { de: 'Zu betrunken zum Arbeiten', en: 'Too drunk to work' },
    task: { de: '{victim} ist sturzbetrunken: hol Franzi', en: '{victim} is blind drunk: get Franzi' },
    victimLine: { de: 'Hicks! Ich arbeite… hicks… ganz normal. Wo ist oben?', en: 'Hic! I\'m working… hic… totally normal. Where is up?' },
    helperDialog: { de: 'Oh je. Ab ins Awareness-Zelt, ich kümmer mich. Wasser, Brot, Ruhe.', en: 'Oh dear. I\'ll fetch them and take them to the awareness tent. Water, bread, rest.' },
    doneLine: { de: 'Wird jetzt erstmal ausgeschlafen. Bei mir im Zelt.', en: 'Sleeping it off now. With me.' },
    noTent: { help: { de: 'Oh je. Ich kümmer mich. Wasser, Brot, Schatten. Ein Zelt wär schöner, aber gut.', en: 'Oh dear. I\'ll take care of it. Water, bread, shade. A tent would be nicer, but fine.' }, done: { de: 'Schläft jetzt im Schatten aus. Ich schau nachher nochmal.', en: 'Sleeping it off in the shade now. I\'ll check back later.' } },
    mode: 'drunk',
  },
  high: {
    weight: 2, helpers: ['franzi', 'delsin'], victims: 1, cost: 0, penalty: 0, karma: 25, prefer: ['rocky', 'niklas'], exclude: ['isi'], storyChance: 0.4,
    title: { de: 'Zu drauf zum Arbeiten', en: 'Too high to work' },
    task: { de: '{victim} ist zu drauf: hol Franzi', en: '{victim} is way too high: get Franzi' },
    victimLine: { de: 'Duuude… der Boden… der atmet… ich kann heute nicht tragen. Oder stehen.', en: 'Dudeee… the ground… it\'s breathing… I can\'t carry today. Or stand.' },
    helperDialog: { de: 'Alles klar, ab ins Awareness-Zelt. Tee, Kekse, keine Musik.', en: 'Alright, I\'ll take them to the awareness tent. Tea, cookies, no music.' },
    doneLine: { de: 'Liegt jetzt bei den Kissen und erklärt den Kissen das Universum.', en: 'Lying with the cushions now, explaining the universe to them.' },
    noTent: { help: { de: 'Alles klar, ich kümmer mich. Tee, Kekse, ein ruhiges Plätzchen, keine Musik.', en: 'Alright, I\'ll handle it. Tea, cookies, a quiet spot, no music.' }, done: { de: 'Liegt jetzt im Gras und erklärt den Wolken das Universum.', en: 'Lying in the grass now, explaining the universe to the clouds.' } },
    mode: 'high',
  },
  keta: {
    weight: 2, helpers: ['franzi', 'delsin'], victims: 1, cost: 0, penalty: 0, karma: 25, prefer: ['rocky', 'estenko'], exclude: ['isi'], storyChance: 0.4,
    title: { de: 'Völlig verballert', en: 'Completely wasted' },
    task: { de: '{victim} ist völlig verballert: hol Franzi', en: '{victim} is completely wasted: get Franzi' },
    victimLine: { de: '…… …hm? …… Ich bin grad… nicht hier. Ruf später an.', en: '…… …hm? …… I\'m not… here right now. Call later.' },
    helperDialog: { de: 'Mitten beim Aufbau? …Okay. Ganz langsam rüber ins Awareness-Zelt.', en: 'In the middle of the build? …Okay. Very slowly over to the awareness tent.' },
    doneLine: { de: 'Sitzt jetzt ganz ruhig im Zelt und findet langsam den Weg zurück.', en: 'Sitting quietly in the tent now, slowly finding the way back.' },
    noTent: { help: { de: 'Mitten beim Aufbau? …Okay. Ganz langsam in den Schatten. Ich bleib dabei.', en: 'In the middle of the build? …Okay. Very slowly into the shade. I\'ll stay with them.' }, done: { de: 'Sitzt jetzt ganz ruhig im Schatten und findet langsam den Weg zurück.', en: 'Sitting quietly in the shade now, slowly finding the way back.' } },
    mode: 'keta',
  },
  kitchenfight: {
    weight: 2, helpers: ['fabi', 'jan', 'leo'], victims: 2, cost: 0, penalty: 280, karma: 20, exclude: ['isi'], campersOnly: true,
    title: { de: 'Streit in der Küche!', en: 'Fight in the kitchen!' },
    task: { de: 'Hol Fabi oder Jan (oder Leo, haha) zum Schlichten', en: 'Get Fabi or Jan (or Leo, haha) to calm it down' },
    victimLine: { de: 'DER hat MEINEN Löffel benutzt! … Das ist ein GEMEINSCHAFTSLÖFFEL!', en: 'HE used MY spoon! … It\'s a COMMUNITY SPOON!' },
    helperDialog: { de: 'Schon wieder Küche? Ich komm. Atmen, Leute. Atmen.', en: 'The kitchen again? I\'m coming. Breathe, people. Breathe.' },
    doneLine: { de: 'So. Alle atmen einmal durch. Und dann: Handschlag. Ja, du auch, Sabse.', en: 'Right. Everyone takes a breath. And then: shake hands. Yes, you too, Sabse.' },
    costReason: { de: 'Zerbrochenes Geschirr', en: 'Broken dishes' },
    mode: 'fight',
  },
  julifight: {
    weight: 2, helpers: ['jan', 'fabi', 'leo'], victims: 2, cost: 0, penalty: 150, karma: 20, juli: true, mode: 'fight',
    title: { de: 'Juli hat Streit!', en: 'Juli is in a fight!' },
    task: { de: 'Hol Jan oder Fabi (oder Leo, haha), Juli streitet mit {victim}', en: 'Get Jan or Fabi (or Leo, haha), Juli is fighting with {victim}' },
    helperDialog: { de: 'Juli? Schon wieder? *seufz* Ich komm. Und ich bring Geduld mit. Viel Geduld.', en: 'Juli? Again? *sigh* I\'m coming. And I\'m bringing patience. Lots of patience.' },
    doneLine: { de: 'So. Ihr gebt euch jetzt die Hand. Juli, du auch. JULI. …Danke.', en: 'Right. You two shake hands now. Juli, you too. JULI. …Thanks.' },
    penaltyReason: { de: 'Kaputtes Werkzeug nach dem Streit', en: 'Tools broken in the fight' },
  },
  generator: {
    weight: 2, helpers: ['felix', 'thomas', 'andi', 'strom_andi', 'juli'], victims: 0, cost: 150, penalty: 1500, karma: 15,
    title: { de: 'Generator kaputt!', en: 'Generator broke!' },
    task: { de: 'Hol Felix, Thompsen (Strom & Licht), Strom Andi, Andi oder Juli, sonst neuer Generator (1.500 €)', en: 'Get Felix, Thompsen (power & light), Strom Andi, Andi or Juli, or buy a new generator (€1,500)' },
    helperDialog: { de: 'Der Generator? *seufz* Hab ich doch gesagt, dass der raucht. Ich schau\'s mir an.', en: 'The generator? *sigh* Told you it was smoking. I\'ll look at it.' },
    doneLine: { de: 'Läuft wieder. Neue Dichtung, bisschen Gaffa, gutes Zureden.', en: 'Running again. New seal, some gaffa, kind words.' },
    costReason: { de: 'Generator-Ersatzteile', en: 'Generator spare parts' },
    penaltyReason: { de: 'Neuer Generator (Notkauf)', en: 'New generator (emergency purchase)' },
    mode: 'place', spot: ['festival_generator_side', 'generator'],
  },
  pump: {
    weight: 0, helpers: ['juli', 'andi'], victims: 0, cost: 120, penalty: 900, karma: 15, requires: 'wc_container', // has its own timer (below)
    title: { de: 'Die Kackepumpe ist kaputt!', en: 'The poo pump is broken!' },
    task: { de: 'Hol Juli oder Andi zur Hebepumpe am WC-Container', en: 'Get Juli or Andi to the lifting pump at the WC container' },
    helperDialog: { de: 'Die Hebepumpe. Natürlich. Keiner will\'s machen, also mach ich\'s. Wie immer.', en: 'The lifting pump. Of course. Nobody wants to do it, so I do. As always.' },
    doneLine: { de: 'Pumpt wieder. Frag nicht, was drin war. Wirklich nicht.', en: 'Pumping again. Don\'t ask what was in it. Really don\'t.' },
    costReason: { de: 'Hebepumpe: Ersatzteil', en: 'Lifting pump: spare part' },
    penaltyReason: { de: 'Notdienst Abpumpen', en: 'Emergency pump-out service' },
    mode: 'place', spot: ['wc_pump'],
  },
};

export class DramaSystem {
  constructor(game) {
    this.game = game;
    this.events = [];
    this.nextT = 60 + Math.random() * 40;
    this.seq = 0;
  }

  get enabled() {
    const qs = this.game.quests;
    return qs.isDone('q1_rigging') && !qs.timer && !this.game.finale; // chaos starts after the first real job
  }

  get tent() { return this.game.world.structures.awareness; }
  /** Delsin helps Franzi once the awareness tent stands. */
  get delsinReady() { return !!this.tent && !!this.game.npcs.get('delsin') && !this.game.npcs.get('delsin').hidden; }

  update(dt) {
    for (const e of this.events) {
      e.t += dt;
      if (e.smoke) this.puff(e, dt);
      if (!e.discovered) {
        if (e.t > 240) { this.cleanup(e); break; } // nobody noticed – they sort it out themselves
        continue;
      }
      const waitingForTent = e.blocked && !this.tent;
      if (!e.helping && !waitingForTent && e.t > e.deadline) this.expire(e);
      else if (e.helping && e.t > e.deadline + 90 && !e.forced) { e.forced = true; e.helping.task = null; this.resolve(e, e.helping); }
    }
    if (!this.enabled || this.game.ui.dialogOpen) return;
    // once the poo pump is connected (toilet job done) it breaks every few minutes – Juli or Andi fix it
    if (this.game.quests.isDone('q3_toilets') && !this.events.some((e) => e.type === 'pump')) {
      this.pumpT = (this.pumpT ?? 150 + Math.random() * 120) - dt;
      if (this.pumpT <= 0) { this.pumpT = 200 + Math.random() * 160; this.spawn('pump'); }
    }
    this.nextT -= dt;
    if (this.nextT <= 0 && this.events.length < 2) {
      this.nextT = 70 + Math.random() * 70;
      this.spawn();
    }
  }

  spawn(forceType, forceVictim) {
    const g = this.game;
    const types = Object.entries(EVENT_TYPES).filter(([k, d]) =>
      (!d.requires || g.world.structures[d.requires]) && !this.events.some((e) => e.type === k) && (d.weight > 0 || k === forceType));
    if (!types.length) return null;
    let type = forceType;
    if (!type) {
      const total = types.reduce((s, [, d]) => s + d.weight, 0);
      let r = Math.random() * total;
      for (const [k, d] of types) { r -= d.weight; if (r <= 0) { type = k; break; } }
    }
    const def = EVENT_TYPES[type];
    const e = { id: ++this.seq, type, def, t: 0, deadline: 120 + Math.random() * 40, victims: [], helping: null };
    if (def.victims) {
      const busy = new Set(this.events.flatMap((x) => x.victims.map((v) => v.def.id)));
      const free = (n) => n.root.visible && !n.hidden && !busy.has(n.def.id) && !n.task && !n.incident && !n.talking &&
        !NEVER.includes(n.def.id) && !(def.exclude || []).includes(n.def.id) &&
        !g.quests.npcMarker(n.def.id); // never someone you currently need for a job
      // without the awareness tent Franzi can't care for story people – they'd be stuck forever
      const noTentCare = AWARENESS_MODES.includes(def.mode) && !this.tent;
      const campers = g.npcs.all.filter((n) => free(n) && n.def.id.startsWith('camper_'));
      const story = g.npcs.all.filter((n) => free(n) && STORY.includes(n.def.id) && !def.campersOnly && !noTentCare);
      const preferred = [...campers, ...story].filter((n) => def.prefer?.includes(n.def.id));
      let nVictims = def.victims;
      if (def.juli) {
        const juli = g.npcs.get('juli');
        if (!juli || juli.hidden || juli.incident || juli.task || juli.talking || busy.has('juli')) return null;
        const pp = g.player.position;
        const near = campers.filter((n) => n.position.distanceTo(juli.position) < 25);
        const other = near.length ? near[Math.floor(Math.random() * near.length)] : campers.find((n) => n.position.distanceTo(pp) > 35);
        if (!other || (juli.position.distanceTo(pp) < 30 && other.position.distanceTo(juli.position) > 25)) return null; // no teleporting in sight
        e.fight = pick(JULI_FIGHTS.filter((f) => f !== this.lastJuliFight));
        this.lastJuliFight = e.fight;
        for (const v of [juli, other]) { if (v.char.sitting) v.standUp(); v.target = null; }
        other.root.position.set(juli.position.x + 1.6, 0, juli.position.z + 0.6);
        g.world.colliders.resolve(other.root.position, 0.4);
        e.victims.push(juli, other);
        nVictims = 0;
      } else if (def.mode === 'fight') {
        const sabse = g.npcs.get('sabse');
        const withSabse = sabse && !sabse.incident && !sabse.talking && Math.random() < 0.65;
        const pool = KITCHEN_FIGHTS.filter((f) => f.sabse === !!withSabse && f !== this.lastFight); // never the same twice in a row
        e.fight = this.lastFight = pool[Math.floor(Math.random() * pool.length)];
        if (withSabse) { e.victims.push(sabse); nVictims = 1; }
      }
      for (let i = 0; i < nVictims; i++) {
        let v = i === 0 && forceVictim ? g.npcs.get(forceVictim) : null;
        if (!v) {
          const roll = Math.random();
          const src = def.storyChance && roll < def.storyChance && story.length ? story
            : preferred.length && roll < 0.65 ? preferred : campers.length ? campers : story;
          v = src.splice(Math.floor(Math.random() * src.length), 1)[0];
        }
        if (!v) { for (const x of e.victims) x.incident = null; return null; }
        for (const arr of [campers, story, preferred]) { const k = arr.indexOf(v); if (k >= 0) arr.splice(k, 1); }
        e.victims.push(v);
      }
      if (def.juli) {
        e.victims.forEach((v, i) => { v.incident = { mode: 'fight', argue: true, other: e.victims[1 - i], shouts: e.fight.shouts }; });
        const juli = e.victims[0];
        e.pos = () => juli.position;
      } else if (def.mode === 'fight') {
        const k = g.world.spots.kitchen;
        e.victims.forEach((v, i) => {
          v.root.position.set(k.x + (i ? 1.2 : -1.2), 0, k.z + 2.5);
          v.incident = { mode: 'fight', other: e.victims[1 - i], shouts: e.fight.shouts };
        });
        if (!e.fight.sabse) g.npcs.get('sabse')?.say(L({ de: 'RUHE IN MEINER KÜCHE!!', en: 'QUIET IN MY KITCHEN!!' }), 4);
        e.pos = () => g.world.spots.kitchen;
      } else {
        const v = e.victims[0];
        if (v.char.sitting) v.standUp();
        // too drunk / high / passed out happens at the camping, nails are on the festival ground –
        // (only moved when the player can't see it happen)
        const where = ['drunk', 'high', 'keta', 'lying'].includes(def.mode) ? g.npcs.randomCampSpot() : def.mode === 'hurt' ? g.npcs.randomFestivalSpot() : null;
        const pp = g.player.position;
        if (where && v.position.distanceTo(pp) > 40 && where.distanceTo(pp) > 40) {
          v.root.position.set(where.x, 0, where.z);
          g.world.colliders.resolve(v.root.position, 0.4);
          v.target = null;
        }
        v.incident = { mode: def.mode };
        v.lying = false;
        e.pos = () => v.position;
      }
      e.story = e.victims.some((v) => STORY.includes(v.def.id));
      e.discovered = false;
    } else {
      const spotName = def.spot.find((s) => g.world.spots[s]);
      const sp = g.world.spots[spotName];
      e.pos = () => sp;
      e.smoke = [];
      e.discovered = true;
    }
    this.events.push(e);
    if (e.discovered) {
      g.audio.alarm?.();
      g.ui.toast(`⚠️ <b>${L(def.title)}</b>`);
    } else {
      g.ui.toast(L({ de: '🔴 Jemand braucht Hilfe, achte auf das rote !', en: '🔴 Someone needs help, look for the red !' }));
    }
    g.quests.refreshMarkers();
    return e;
  }

  victimName(e) { return (e.def.juli ? e.victims[1] : e.victims[0])?.def.name || ''; }

  taskText(e) {
    if (e.blocked && !this.tent) return L({ de: 'Franzi braucht erst ihr Awareness-Zelt, hilf ihr beim Aufbau', en: 'Franzi needs her awareness tent first: help her build it' });
    let txt = L(e.def.task).replace('{victim}', this.victimName(e));
    if (e.def.helpers.includes('delsin') && this.delsinReady) txt += L({ de: ' (oder Delsin)', en: ' (or Delsin)' });
    return txt;
  }

  /** Someone who's wasted/looked after can't work or talk business. Returns true if handled. */
  victimTalk(npc) {
    const g = this.game;
    const inc = npc.incident;
    if (!inc) return false;
    const ev = this.events.find((x) => x.victims.includes(npc));
    if (inc.mode === 'follow' || inc.mode === 'care') {
      const helper = (inc.leader || inc.franzi)?.def.name || 'Franzi';
      const line = L(pick(STATE_LINES[inc.state]?.[inc.mode === 'care' ? 'care' : 'follow'] || STATE_LINES.drunk.care));
      g.reply(npc, helper === 'Franzi' ? line : line.replaceAll('Franzi', helper));
      g.ui.toast(L({ de: `${npc.def.name} wird gerade von ${helper} betreut. Später!`, en: `${npc.def.name} is being looked after by ${helper}. Later!` }));
      return true;
    }
    if (ev && !ev.discovered) {
      this.discover(ev, npc);
      return true;
    }
    if (ev) {
      g.reply(npc, this.victimLine(ev));
      g.ui.toast(this.taskText(ev));
      return true;
    }
    return false;
  }

  /** You found out what happened – now the clock is ticking. */
  async discover(e, npc) {
    const g = this.game;
    const de = getLang() === 'de';
    const name = npc.def.name;
    const intro = {
      nail: de ? `${name} sitzt am Boden und hält sich den Fuß. Da steckt ein Nagel drin.` : `${name} is sitting on the ground holding a foot. There's a nail in it.`,
      passedout: de ? `${name} liegt im Gras und reagiert kaum.` : `${name} is lying in the grass, barely responding.`,
      drunk: de ? `${name} schwankt, lallt und hält sich an der Luft fest.` : `${name} is swaying, slurring and holding on to the air.`,
      high: de ? `${name} starrt kichernd in den Himmel und hat vergessen, was Arbeit ist.` : `${name} is staring at the sky, giggling, having forgotten what work is.`,
      keta: de ? `${name} steht einfach da und ist… irgendwo anders.` : `${name} is just standing there and is… somewhere else.`,
      kitchenfight: e.fight ? this.fightText(e, e.fight.intro) : '',
      julifight: e.fight ? this.fightText(e, e.fight.intro) : '',
    }[e.type];
    await g.runDialog([
      { who: 'you', text: intro },
      { who: npc.def.id, text: this.victimLine(e) },
      { who: 'you', text: this.discoverHint(e) },
    ], null, npc);
    e.discovered = true;
    e.t = 0;
    e.deadline = e.type === 'nail' ? 90 : 110;
    g.audio.alarm?.();
    g.quests.refreshMarkers();
    g.refreshHUD();
  }

  victimLine(e) { return e.fight ? L(e.fight.line) : L(e.def.victimLine); }

  fightText(e, text) {
    const names = e.victims.filter((v) => v.def.id !== 'sabse' && !(e.def.juli && v.def.id === 'juli')).map((v) => v.def.name);
    return L(text).replace('{a}', names[0] || '').replace('{b}', names[1] || '');
  }

  discoverHint(e) {
    const de = getLang() === 'de';
    if (e.type === 'kitchenfight' || e.type === 'julifight') return de ? '(Ich muss Fabi oder Jan holen, schnell!)' : '(I need to get Fabi or Jan, quickly!)';
    if (AWARENESS_MODES.includes(e.def.mode) && !this.tent && e.story) return de ? '(Ich hol Franzi! …Sie wird ihr Awareness-Zelt brauchen.)' : '(I\'ll get Franzi! …She\'ll need her awareness tent.)';
    if (this.delsinReady && e.def.helpers.includes('delsin')) return de ? '(Ich muss Franzi oder Delsin holen, schnell!)' : '(I need to get Franzi or Delsin, quickly!)';
    return de ? '(Ich muss Franzi holen, schnell!)' : '(I need to get Franzi, quickly!)';
  }

  /** Talking to a possible helper while an event runs. Returns true if handled. */
  async helperTalk(npc) {
    const g = this.game;
    const id = npc.def.id;
    const e = this.events.find((x) => x.discovered && !x.helping && x.def.helpers.includes(id));
    if (!e) return false;
    if (id === 'delsin' && !this.delsinReady) return false;
    if (id === 'leo') { // of course
      g.reply(npc, L({ de: 'Klar, mach ich! …gleich!', en: 'Sure, I\'ll do it! …in a sec!' }));
      g.ui.toast(L({ de: 'Leo ist schon wieder weg. Frag lieber Fabi oder Jan.', en: 'Leo\'s gone again. Better ask Fabi or Jan.' }));
      npc.stateT = 0;
      return true;
    }
    const needsTent = AWARENESS_MODES.includes(e.def.mode);
    if (needsTent && !this.tent && e.story) {
      // story people need proper care – no tent, no care
      e.blocked = true;
      const name = this.victimName(e);
      await g.runDialog([
        { who: 'you', text: L(e.def.title) + `${name}` },
        { who: 'franzi', text: { de: `${name}? Oh nein. Den kann ich nicht mitten auf dem Acker betreuen. Ich brauch mein Awareness-Zelt!`, en: `${name}? Oh no. I can't look after them in the middle of the field. I need my awareness tent!` } },
        { who: 'franzi', text: { de: 'Hilf mir, das Zelt aufzubauen, dann kümmer ich mich sofort. Bis dahin ist mit dem nichts anzufangen.', en: 'Help me build the tent, then I\'ll take care of it right away. Until then they\'re no use to anyone.' } },
      ], null, npc);
      g.refreshHUD();
      // if she can give us the tent job right now, go straight into it
      return !g.quests.offeredBy(id).some((q) => q.id === 'q6_awareness');
    }
    const noTent = needsTent && !this.tent && e.def.noTent; // no awareness tent yet: she looks after them on the spot
    await g.runDialog([{ who: 'you', text: L(e.def.title) + (e.victims[0] ? `${this.victimName(e)}` : '') }, { who: id, text: L(noTent ? e.def.noTent.help : e.def.helperDialog) }], null, npc);
    e.helping = npc;
    npc.task = {
      phase: 'go', pos: () => e.pos(), arriveDist: 1.8, workTime: e.def.mode === 'lying' ? 4 : 3, speed: 5,
      arriveLine: L(e.def.mode === 'lying' ? { de: 'Hey… hallo? Aufwachen. Ganz langsam.', en: 'Hey… hello? Wake up. Very slowly.' } : { de: 'So, lass mal sehen…', en: 'Right, let\'s see…' }),
      then: () => (needsTent && this.tent ? this.startEscort(e, npc) : this.resolve(e, npc)),
    };
    return true;
  }

  /** Franzi walks the victim to the awareness tent; they chat nonsense on the way. */
  startEscort(e, helper) {
    const tent = this.tent.object.position;
    const state = e.def.mode;
    e.escorting = true;
    helper.say(L({ de: 'Komm, wir gehen ins Awareness-Zelt. Langsam. Ja, der Boden bewegt sich, ich weiß.', en: 'Come on, let\'s go to the awareness tent. Slowly. Yes, the ground is moving, I know.' }), 4);
    for (const v of e.victims) {
      v.lying = false;
      v.char.setSitting(false);
      v.char.play('idle', 0.3);
      v.incident = { mode: 'follow', state, leader: helper, lineT: 2.5 };
    }
    helper.task = {
      phase: 'go', pos: () => tent, arriveDist: 2.5, workTime: 2, speed: 2.1, anim: 'walk',
      arriveLine: L({ de: 'So. Hier bist du sicher.', en: 'There. You\'re safe here.' }),
      then: () => this.arriveCare(e, helper),
    };
  }

  arriveCare(e, helper) {
    const tent = this.tent.object.position;
    const state = e.def.mode;
    e.victims.forEach((v, i) => {
      const a = Math.random() * Math.PI * 2;
      v.root.position.set(tent.x + Math.cos(a) * (1.2 + i * 0.6), 0, tent.z + Math.sin(a) * (1.2 + i * 0.6));
      v.root.rotation.y = a + Math.PI;
      v.incident = { mode: 'care', state, t: 0, until: 35 + Math.random() * 20, lineT: 4, franzi: helper };
    });
    helper.say(L(pick(FRANZI_CARE)), 4);
    this.resolve(e, helper, true);
  }

  resolve(e, helper, keepVictims = false) {
    const g = this.game;
    helper.say(L(AWARENESS_MODES.includes(e.def.mode) && !this.tent && e.def.noTent?.done ? e.def.noTent.done : e.def.doneLine), 5);
    if (e.def.cost) g.economy.spend(e.def.cost, e.def.costReason);
    const k = e.def.karma || 15;
    g.quests.state.karma += k;
    this.cleanup(e, keepVictims);
    g.ui.toast(L({ de: `✔ Geholfen! (+${k} Karma)`, en: `✔ Helped out! (+${k} karma)` }));
    g.audio.accept();
  }

  /** Pro gaffa: you patch the generator / poo pump yourself, right now. */
  gaffaFix(e) {
    const g = this.game, de = getLang() === 'de';
    if (!this.events.includes(e)) return;
    g.effects.gaffa = Math.max(0, g.effects.gaffa - 1);
    if (e.helping) { e.helping.task = null; e.helping.say(de ? 'Oh. Hast du schon gemacht? Mit Gaffa? …Respekt.' : 'Oh. You did it already? With gaffa? …Respect.', 4); }
    g.player.work?.(1.2);
    const k = e.def.karma || 15;
    g.quests.state.karma += k;
    this.cleanup(e);
    g.audio.accept();
    g.ui.toast(de ? `🩹 Mit Gaffa geflickt! Hält. Bestimmt. (+${k} ✺)` : `🩹 Patched with gaffa! It holds. Surely. (+${k} ✺)`);
  }

  expire(e) {
    const g = this.game;
    if (e.def.penalty) g.economy.spend(e.def.penalty, e.def.penaltyReason || e.def.title);
    g.quests.state.karma = Math.max(0, g.quests.state.karma - 10);
    const de = getLang() === 'de';
    const who = e.victims[0] ? ` (${this.victimName(e)})` : '';
    g.ui.toast(de ? `⌛ Zu spät: ${L(e.def.title)}${who} −10 Karma` : `⌛ Too late: ${L(e.def.title)}${who} −10 karma`);
    this.cleanup(e);
  }

  cleanup(e, keepVictims = false) {
    if (!keepVictims) for (const v of e.victims) { v.incident = null; v.char.setSitting(false); v.lying = false; v.char.play('idle', 0.3); v.target = null; }
    for (const s of e.smoke || []) this.game.world.scene.remove(s.m);
    this.events = this.events.filter((x) => x !== e);
    this.game.quests.refreshMarkers();
    this.game.refreshHUD();
  }

  clearAll() {
    [...this.events].forEach((e) => this.cleanup(e));
    for (const n of this.game.npcs.all) if (n.incident) { n.incident = null; n.char.setSitting(false); n.lying = false; }
    this.nextT = 60;
  }

  /** Objective markers for the HUD (red). */
  objectives() {
    return this.events.map((e) => (e.discovered
      ? { pos: e.blocked && !this.tent ? this.game.world.spots.plot_awareness : e.pos(), label: L(e.def.title), drama: true }
      : { pos: e.pos(), label: '!', drama: true, hint: true }));
  }

  /** NPCs that should show a red "!" (need help, not yet on the way). */
  isRedMarked(npc) {
    return this.events.some((e) => !e.helping && e.victims.includes(npc) && (!e.discovered || !e.escorting));
  }

  puff(e, dt) {
    e.smokeT = (e.smokeT || 0) - dt;
    const p = e.pos();
    if (e.smokeT <= 0 && p) {
      e.smokeT = 0.35;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), new THREE.MeshBasicMaterial({ color: '#444', transparent: true, opacity: 0.55, depthWrite: false }));
      m.position.set(p.x, 2, p.z);
      this.game.world.scene.add(m);
      e.smoke.push({ m, t: 0 });
    }
    e.smoke = e.smoke.filter((s) => {
      s.t += dt;
      s.m.position.y += dt * 1.2;
      s.m.scale.setScalar(1 + s.t * 1.5);
      s.m.material.opacity = Math.max(0, 0.55 - s.t * 0.22);
      if (s.t > 2.5) { this.game.world.scene.remove(s.m); return false; }
      return true;
    });
  }
}
