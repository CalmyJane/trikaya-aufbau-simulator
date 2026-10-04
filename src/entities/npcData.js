import { VOLUNTEERS } from './volunteers.js';

// Crew roster. Positions reference named spots from World.spots.
//
// look: see Character.js — base model, colours by role (skin/hair/shirt/pants/shoes; shoes
//       default to skin colour = barefoot), patchwork clothes, hairStyle, height/width, extras.
// behavior:
//   stationary | wander | patrol | runner | worker  – generic
//   elusive   – Leo: always somewhere else
//   estenko   – drunk, clueless, kung fu, harasses AFK players, sits with Thompsen
//   sitter    – sits on the beer bench and laughs
//   kitchen   – guards the kitchen (Game enforces the rules)
//   mechanic  – wanders, can be called to repair the quad
// lines: ambient chatter { de, en }

const SKIN = { light: '#e8c39e', fair: '#f0cfae', tan: '#c8946a', dark: '#5a3822' };
const HIPPIE_PANTS = ['#7a4a8a', '#c0602a', '#2e6b5e', '#8a3a3a', '#b08a3a', '#4a5a8a'];
const HIPPIE_SHIRTS = ['#d98c2b', '#9b3d8a', '#2a8a7a', '#c9b24a', '#6a4aa8', '#b8483a', '#e0e0d0'];

export const NPCS = [
  {
    id: 'leo', name: 'Leo', role: { de: 'Aufbauleitung (angeblich)', en: 'Build lead (allegedly)' }, portrait: '👻',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#0b0b0b', brows: '#0b0b0b', hairCut: [0.95, 0.6, 0.95], shirt: '#6a4aa8', pants: '#2e6b5e', patchwork: true, shirtPatch: ['#6a4aa8', '#c9b24a', '#2a8a7a'] },
    behavior: 'elusive', home: 'office_inside',
    lines: [
      { de: 'Gleich! Bin gleich wieder da!', en: 'In a sec! Be right back!' },
      { de: 'Kurz telefonieren!', en: 'Quick phone call!' },
      { de: 'Später, später!', en: 'Later, later!' },
      { de: 'Ich muss nur schnell was…!', en: 'I just need to quickly…!' },
      { de: 'Frag Corni!', en: 'Ask Corni!' },
    ],
  },
  {
    id: 'corni', name: 'Corni', role: { de: 'Bau', en: 'Construction' }, portrait: '🔨',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#0d0a08', hairCut: [0.95, 0.6, 0.95], shirt: '#161616', pants: '#3a3a4a', pantsPatch: ['#3a3a4a', '#5a4a3a', '#2e4a5a'], patchwork: true, shirtPatch: ['#161616', '#1c1c1c', '#121212'], shirtPrint: 'SECURITY', printColor: '#ffd21f', height: 1.84, width: 1.17 },
    behavior: 'stationary', home: 'plot_mainstage', offset: [9, 14],
    lines: [
      { de: 'Wir bauen das jetzt einfach.', en: 'We\'ll just build it.' },
      { de: 'Gerade? Das ist gerade genug.', en: 'Straight? That\'s straight enough.' },
      { de: 'Wo Leo ist? Frag lieber nicht.', en: 'Where\'s Leo? Better not ask.' },
      { de: 'Erst die Stahlseile, dann die Deko. Nicht andersrum. NIE andersrum.', en: 'Steel wires first, then deco. Never the other way round. NEVER.' },
      // running gag: Corni always asks about the rigging material
      { de: 'Hast du das Rigging-Material? Die Stahlseile für die Mainstage?', en: 'Have you got the rigging material? The steel wires for the mainstage?' },
      { de: 'Sag mal… wo ist eigentlich das Rigging-Material?', en: 'Say… where\'s the rigging material, actually?' },
      { de: 'Stahlseile. Hat irgendwer die Stahlseile gesehen?!', en: 'Steel wires. Has anyone seen the steel wires?!' },
    ],
  },
  {
    id: 'matze', name: 'Matze', role: { de: 'Bau (meistens)', en: 'Construction (mostly)' }, portrait: '🤔',
    look: { base: 'm_hoodie', skin: SKIN.fair, hair: '#e3c46a', brows: '#b8963a', shirt: '#2a8a7a', pants: '#8a6a4a', patchwork: true, height: 1.8 },
    behavior: 'wander', home: 'plot_mainstage', offset: [-8, 12], radius: 5,
    lines: [
      { de: 'Moment… was wollte ich gerade?', en: 'Wait… what was I about to do?' },
      { de: 'War das links oder rechts von links?', en: 'Was that left or right of left?' },
      { de: 'Ich hab den Plan! …irgendwo.', en: 'I have the plan! …somewhere.' },
      { de: 'Warum stehen hier sechs Pfosten? Ach ja. Die Stage.', en: 'Why are there six posts here? Oh right. The stage.' },
      { de: 'Hab ich schon Kaffee getrunken? Ich trink sicherheitshalber noch einen.', en: 'Did I have coffee yet? I\'ll have another, just in case.' },
    ],
  },
  {
    id: 'fabi', name: 'Fabi', role: { de: 'Material & Equipment', en: 'Gear & equipment' }, portrait: '🔦',
    look: { base: 'm_hoodie', skin: SKIN.tan, hair: '#1e150e', shirt: '#6b3a2a', pants: '#3a4a2a', patchwork: true, height: 1.66 },
    behavior: 'wander', home: 'base_yard', radius: 12,
    lines: [
      { de: 'Alles, was du suchst – ich weiß, wo es ist. Meistens.', en: 'Whatever you\'re looking for – I know where it is. Mostly.' },
      { de: 'Künstlergasse-Container, hinten links, unter der Plane. Oder im Hühnercontainer.', en: 'Künstlergasse container, back left, under the tarp. Or in the chicken container.' },
      { de: 'Wer hat mein Maßband?!', en: 'Who has my tape measure?!' },
      { de: 'Ich hab eine Liste. Die Liste ist leider im Hühnercontainer.', en: 'I have a list. Sadly the list is in the chicken container.' },
    ],
  },
  {
    id: 'jan', name: 'Jan', role: { de: 'Anmeldung', en: 'Registration' }, portrait: '📋',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#8a6a38', brows: '#6a5030', hairCut: 'sidecut', shirt: '#c9b24a', pants: '#5a4a7a', patchwork: true, height: 1.97 },
    behavior: 'stationary', home: 'office_boss',
    lines: [
      { de: 'Name? Tätigkeit? Lieblings-Dixi?', en: 'Name? Job? Favourite portaloo?' },
      { de: 'Anmeldung ist Pflicht. Auch für Hunde. Auch für Leo, theoretisch.', en: 'Registration is mandatory. For dogs too. For Leo too, theoretically.' },
      { de: 'Ich hab dich als „motiviert“ eingetragen. Enttäusch mich nicht.', en: 'I put you down as "motivated". Don\'t let me down.' },
      { de: 'Das Bändchen ist wasserdicht. Du hoffentlich auch.', en: 'The wristband is waterproof. Hopefully you are too.' },
      { de: 'Essensmarken? Die hat Leo. Frag Leo. …Ja, ich weiß.', en: 'Food tokens? Leo has them. Ask Leo. …Yes, I know.' },
    ],
  },
  {
    id: 'mark', name: 'Mark', role: { de: 'Chai Lounge', en: 'Chai Lounge' }, portrait: '🍵',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#241a12', shirt: '#b8483a', pants: '#4a3a5a', patchwork: true, width: 1.2, height: 1.83, extras: ['scarf'], scarf: '#e0a030' },
    behavior: 'wander', home: 'plot_chai_lounge', offset: [5, 8], radius: 3,
    lines: [
      { de: 'Chai ist fertig, wenn er fertig ist.', en: 'Chai is ready when it\'s ready.' },
      { de: 'Schuhe aus in der Lounge. Ach, du hast eh keine.', en: 'Shoes off in the lounge. Oh, you don\'t have any anyway.' },
      { de: 'Kardamom ist die Antwort. Egal auf welche Frage.', en: 'Cardamom is the answer. Whatever the question.' },
      { de: 'Mein Zelt steht noch nicht, aber Mate gibt\'s trotzdem. Campingkocher, Baby.', en: 'My tent isn\'t up yet, but there\'s mate anyway. Camping stove, baby.' },
      { de: 'Wir sind fünfundzwanzig Leute am Chai-Zelt. Und ein Zelt. Das liegt noch.', en: 'There are twenty-five of us at the chai tent. And one tent. It\'s still lying down.' },
      { de: 'Heute haben wir am Chai-Zelt richtig was geschafft. Wir wissen jetzt, wo vorne ist.', en: 'We got a lot done at the chai tent today. We now know where the front is.' },
    ],
  },
  {
    id: 'estenko', name: 'Zdenko', role: { de: '???', en: '???' }, portrait: '🍺',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#2a2018', brows: '#2a2018', hairCut: [0.97, 0.3, 0.97], halfBald: true, shirt: '#d98c2b', pants: '#8a3a3a', patchwork: true, shirtPatch: ['#d98c2b', '#3a2a4a', '#c0602a'], extras: ['bottle'] },
    behavior: 'estenko', home: 'chill',
    lines: [
      { de: 'Whats up, mothafuckah?!', en: 'Whats up, mothafuckah?!' },
      { de: 'Ha, komm her!', en: 'Ha, come here!' },
      { de: 'Ey mann… Respekt!', en: 'Hey man… respect!' },
      { de: 'Ey mann… RESPEKT! Echt jetzt.', en: 'Hey man… RESPECT! For real.' },
      { de: 'Ey! EY! …ach, nix.', en: 'Hey! HEY! …never mind.' },
      { de: 'Kennst du Kung Fu? Ich schon. HIYAAA!', en: 'You know kung fu? I do. HIYAAA!' },
      { de: 'Prost, Bruder! Auf… auf alles!', en: 'Cheers, brother! To… to everything!' },
      { de: 'Wo sind wir hier eigentlich?', en: 'Where are we, actually?' },
      { de: 'Alles ist verbunden, weißt du? Auch die Kabel. Vor allem die Kabel.', en: 'Everything is connected, you know? The cables too. Especially the cables.' },
      { de: 'Du hast da was. …Nee, doch nicht. Hahaha.', en: 'You\'ve got something there. …Nah. Hahaha.' },
    ],
    afkLines: [
      { de: 'Whats up, mothafuckah?!', en: 'Whats up, mothafuckah?!' },
      { de: 'Ha, komm her! Komm her!', en: 'Ha, come here! Come here!' },
      { de: 'Schläfst du? Ich schlaf auch manchmal. Im Stehen.', en: 'You sleeping? I sleep sometimes too. Standing up.' },
      { de: 'Psst. Psssst. …Hi.', en: 'Psst. Psssst. …Hi.' },
      { de: 'Ey mann… du stehst hier so rum. Respekt!', en: 'Hey man… you just stand around here. Respect!' },
      { de: 'Hast du ein Bier für mich? Nein? Ich hab eins für dich. …Nein, doch nicht.', en: 'Got a beer for me? No? I\'ve got one for you. …No, I don\'t.' },
    ],
  },
  {
    id: 'thompsen', name: 'Tinyhaus Thompsen', role: { de: 'Stimmung', en: 'Morale' }, portrait: '😂',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#f2dc8a', brows: '#c8a85a', shirt: '#2a8a7a', pants: '#b08a3a', patchwork: true, extras: ['bottle'] },
    behavior: 'sitter', home: 'chill_seat2',
    lines: [
      { de: 'HAHAHAHA!', en: 'HAHAHAHA!' },
      { de: 'Hahaha, der Zdenko! Hahaha!', en: 'Hahaha, that Zdenko! Hahaha!' },
      { de: '*lacht Tränen*', en: '*cries laughing*' },
      { de: 'Hahaha — worüber lachen wir eigentlich? HAHAHA!', en: 'Hahaha — what are we laughing about? HAHAHA!' },
      { de: 'Prost! Hehehe.', en: 'Cheers! Hehehe.' },
    ],
  },
  {
    id: 'sabse', name: 'Sabse', role: { de: 'Küche', en: 'Kitchen' }, portrait: '🔪',
    look: { base: 'f_casual', skin: '#9a6644', hair: '#0e0a08', brows: '#0e0a08', hairStyle: 'long', hairStyleColor: '#0e0a08', hairLength: 0.5, shirt: '#e0e0d0', pants: '#6a3d7a', patchwork: true, shirtPatch: ['#e0e0d0', '#c47a2c', '#2a8a7a'] },
    behavior: 'kitchen', home: 'kitchen', radius: 3,
    lines: [
      { de: 'Essen gibt\'s um eins. Wer um fünf nach kommt, kriegt Karotten.', en: 'Food is at one. Five past gets you carrots.' },
      { de: 'Wer hat meinen großen Topf?!', en: 'Who took my big pot?!' },
      { de: 'Linsen. Heute gibt\'s Linsen. Morgen auch.', en: 'Lentils. Today it\'s lentils. Tomorrow too.' },
    ],
    angryLines: [
      { de: 'RAUS AUS MEINER KÜCHE!', en: 'OUT OF MY KITCHEN!' },
      { de: 'In der Küche wird NICHT gerannt!', en: 'NO running in the kitchen!' },
      { de: 'Mit dem Ding kommst du hier nicht rein!!', en: 'You\'re not coming in here with that thing!!' },
      { de: 'Hände gewaschen?! NEIN?! RAUS!', en: 'Washed your hands?! NO?! OUT!' },
      { de: 'Hier wird nicht rumgehüpft, das ist eine KÜCHE!', en: 'No jumping around, this is a KITCHEN!' },
    ],
  },
  {
    id: 'flo', name: 'Flo', role: { de: 'Technik & Schrauben', en: 'Tech & wrenching' }, portrait: '🔧',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#0a0a0a', brows: '#0a0a0a', shirt: '#3a3a3a', pants: '#2a3a5a', shoes: '#2a2018', height: 1.94, extras: ['bottle'] },
    behavior: 'mechanic', home: 'base_yard', offset: [6, -4], radius: 12,
    lines: [
      { de: 'Noch ein Bier, dann schraub ich weiter.', en: 'One more beer, then back to wrenching.' },
      { de: 'Läuft. Irgendwie.', en: 'It works. Somehow.' },
      { de: 'Hopfen ist auch Gemüse.', en: 'Hops are a vegetable.' },
      { de: 'Das Quad? Das krieg ich wieder hin. Immer.', en: 'The quad? I can always fix it.' },
    ],
  },
  {
    id: 'andi', name: 'Wasser Andi', role: { de: 'Wasser, Technik & Schleppen', en: 'Water, tech & heavy lifting' }, portrait: '🛠️',
    look: { base: 'm_casual', skin: SKIN.tan, hair: '#1a120c', shirt: '#5a6a7a', pants: '#3a3a3a', shoes: '#3a2a1a', height: 1.92, extras: ['bottle'] },
    behavior: 'mechanic', home: 'base_yard', offset: [-8, 6], radius: 14,
    lines: [
      { de: 'Erst schaffen, dann Bier. Oder beides gleichzeitig.', en: 'Work first, then beer. Or both at once.' },
      { de: 'Wer hat den Radlader so geparkt?', en: 'Who parked the wheel loader like that?' },
      { de: 'Kein Stress. Das hält.', en: 'No stress. It\'ll hold.' },
    ],
  },
  {
    id: 'juli', name: 'Juli', role: { de: 'Macht einfach', en: 'Just gets it done' }, portrait: '😒',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#6a4a2a', shirt: '#e8e4d8', pants: '#5a4a3a', shoes: '#1a1a1a', height: 1.55, width: 0.85, extras: ['suspenders'] },
    behavior: 'worker', route: ['plot_chai_lounge', 'plot_mainstage', 'plot_planetarium', 'plot_biergarten', 'plot_entrance'],
    lines: [
      { de: 'Was.', en: 'What.' },
      { de: 'Geh mir aus dem Licht.', en: 'You\'re in my light.' },
      { de: 'Mach ich selber. Wie immer.', en: 'I\'ll do it myself. As always.' },
      { de: 'Nein.', en: 'No.' },
      { de: 'Schon fertig. Im Gegensatz zu dir.', en: 'Already done. Unlike you.' },
    ],
  },
  {
    id: 'franzi', name: 'Franzi', role: { de: 'Awareness & Erste Hilfe', en: 'Awareness & first aid' }, portrait: '💚',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#c0391b', brows: '#8a2a14', hairStyle: 'pigtails', hairStyleColor: '#c0391b', tieColor: '#7fd0ff', shirt: '#8ad0a0', pants: '#6a4a8a', patchwork: true, height: 1.58, extras: ['scarf'], scarf: '#e84a8a' },
    behavior: 'wander', home: 'kitchen', offset: [3.5, 3], radius: 2.5,
    homeAfter: { quest: 'q6_awareness', spot: 'plot_awareness', offset: [6, 6], radius: 6 }, // moves to her tent once it stands
    lines: [
      { de: 'Alles gut bei dir? Wirklich? Trink mal Wasser.', en: 'You okay? Really? Drink some water.' },
      { de: 'Wenn\'s dir zu viel wird: Awareness-Zelt. Immer.', en: 'If it gets too much: the awareness tent. Always.' },
      { de: 'Ich hab Pflaster, Kekse und Geduld. In der Reihenfolge.', en: 'I have plasters, cookies and patience. In that order.' },
      { de: 'Sabse und ich machen nachher Tee. Magst du?', en: 'Sabse and I are making tea later. Want some?' },
    ],
  },
  {
    id: 'niklas', name: 'Niklas', role: { de: 'Hilft überall', en: 'Helps everywhere' }, portrait: '💪',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#4a3420', shirt: '#b8483a', pants: '#3a4a2a', patchwork: true, height: 1.97 },
    behavior: 'worker', route: ['plot_mainstage', 'base_yard', 'plot_chai_lounge', 'plot_forest_dome', 'plot_planetarium'],
    lines: [
      { de: 'Brauchst du Hilfe? Ich helf dir. Ich helf allen. Ich helf mir sogar selbst!', en: 'Need help? I\'ll help. I help everyone. I even help myself!' },
      { de: 'Woah… die Wolken heute. Sorry. Was tragen wir?', en: 'Whoa… the clouds today. Sorry. What are we carrying?' },
      { de: 'Noch drei Paletten, dann Pause. Hab ich vor drei Paletten auch gesagt.', en: 'Three more pallets, then a break. Said that three pallets ago.' },
    ],
  },
  {
    id: 'fabbe', name: 'Fabbe', role: { de: 'Forest Dome', en: 'Forest Dome' }, portrait: '🌳',
    look: { base: 'm_casual', skin: SKIN.tan, hair: '#1a120c', hairCut: [0.95, 0.6, 0.95], shirt: '#2e6b3a', pants: '#6a4a2a', patchwork: true },
    behavior: 'wander', home: 'plot_forest_dome', offset: [7, 8], radius: 4,
    lines: [
      { de: 'Der Forest Dome wird magisch. Zwischen den Bäumen. Mit Bass.', en: 'The Forest Dome will be magical. Between the trees. With bass.' },
      { de: 'Schön, dass du da bist! Wirklich!', en: 'Great that you\'re here! Really!' },
      { de: 'Holz, Seile, Liebe. Mehr braucht ein Dome nicht.', en: 'Wood, ropes, love. That\'s all a dome needs.' },
    ],
  },
  {
    id: 'harry', name: 'Harry', role: { de: 'Deko & Mapping', en: 'Deco & mapping' }, portrait: '🎨',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#e3c46a', brows: '#b8963a', hairStyle: 'ponytail', hairStyleColor: '#e3c46a', hairLength: 0.3, shirt: '#3a3a5a', pants: '#8a6a4a', patchwork: true, height: 1.84 },
    behavior: 'wander', home: 'plot_forest_dome', offset: [-7, 9], radius: 5,
    lines: [
      { de: 'Die Deko kommt ganz am Schluss. Dafür dann richtig.', en: 'The deco comes right at the end. But then properly.' },
      { de: 'Auf das Holz kommt nachts ein 3D-Mapping. Du wirst weinen.', en: 'At night we project a 3D mapping onto the wood. You\'ll cry.' },
      { de: 'Hat jemand den Beamer gesehen? Den großen?', en: 'Has anyone seen the projector? The big one?' },
    ],
  },
  {
    id: 'felix', name: 'Felix', role: { de: 'Strom & Licht', en: 'Power & light' }, portrait: '💡',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#9a7a44', brows: '#7a5a30', shirt: '#2a2a3a', pants: '#3a3a3a', shoes: '#222222', height: 1.86 },
    behavior: 'wander', home: 'generator', offset: [2, 3], radius: 5,
    lines: [
      { de: 'Das ist Starkstrom. Nicht anfassen. Also… du nicht.', en: 'That\'s high voltage. Don\'t touch. Well… not you.' },
      { de: 'Ich hab das Lichtkonzept gemacht. Ja, das ganze.', en: 'I did the lighting concept. Yes, all of it.' },
      { de: 'Hmm. Okay. Kann man so machen. Ist halt falsch.', en: 'Hmm. Okay. You could do it like that. It\'s just wrong.' },
      { de: 'Strom Andi! Das Kabel! Nicht das Bier, das KABEL!', en: 'Strom Andi! The cable! Not the beer, the CABLE!' },
      { de: 'Julez sagt, mein Lichtkonzept ist falsch. Julez sagt das zu allem. Auch zu Licht.', en: 'Julez says my lighting concept is wrong. Julez says that about everything. Even about light.' },
    ],
  },
  {
    id: 'rocky', name: 'Rocky', role: { de: 'Helfer · DJ Geist', en: 'Volunteer · DJ Geist' }, portrait: '🌀',
    // long, matted dreads; black band shirt with his DJ name; hi-tech producer with a soft spot for punk rock
    look: { base: 'm_adventurer', backpack: false, skin: SKIN.tan, hair: '#1a120c', hairStyle: 'dreads', hairStyleColor: '#24180e', dreadLength: 0.6, dreadThick: 1.7, matted: true, beads: true, shirt: '#161616', pants: '#3a3428', patchwork: true, shirtPatch: ['#161616', '#8a1a1a', '#5a2a7a'], pantsPatch: ['#3a3428', '#8a1a1a', '#2a2a2a'], shirtPrint: 'GEIST', printColor: '#c27aff' },
    behavior: 'wander', home: 'chill', radius: 18, speed: 1.2, stoned: true,
    lines: [
      { de: 'Duuude… hörst du die Farben?', en: 'Duuude… can you hear the colours?' },
      { de: 'Ich trag gleich was. Gleich. Nach dem Sonnenuntergang.', en: 'I\'ll carry something soon. Soon. After sunset.' },
      { de: 'Mein Zelt atmet. Ist das normal?', en: 'My tent is breathing. Is that normal?' },
      { de: 'Ich produzier Hi-Tech, weißt du. 190 BPM. Darunter ist für mich Ambient.', en: 'I produce hi-tech, you know. 190 BPM. Anything below is ambient to me.' },
      { de: 'Hör mal… das Brummen vom Generator… das ist ein Sample. Das kommt in meinen nächsten Track.', en: 'Listen… the generator hum… that\'s a sample. It\'s going in my next track.' },
      { de: 'Auflegen tu ich als Geist. Weil ich nach dem Set einfach weg bin. Keiner weiß, wohin. Ich auch nicht.', en: 'I DJ as Geist. Because after the set I just vanish. Nobody knows where. Me neither.' },
      { de: 'Geist legt am Festival auf. So schnell, dass die Zeit rückwärts läuft.', en: 'Geist is playing the festival. So fast that time runs backwards.' },
      { de: '„Praktikum bei Astro TV" – mein Track, Bruder. Die Hotline hat mich nie zurückgerufen. Also hab ich sie gesampelt.', en: '"Praktikum bei Astro TV" – my track, brother. The hotline never called me back. So I sampled it.' },
      { de: 'Weißt du, was Hi-Tech und Punk gemeinsam haben? Beides ist zu schnell für deine Eltern.', en: 'You know what hi-tech and punk have in common? Both are too fast for your parents.' },
      { de: 'Vor dem Psytrance war ich Punk. Bin ich immer noch. Nur mit mehr Hall drauf.', en: 'Before psytrance I was punk. Still am. Just with more reverb.' },
      { de: 'Drei Akkorde, Bruder. Mehr braucht keiner. Ich brauch null, ich hab nen Sequencer.', en: 'Three chords, brother. Nobody needs more. I need zero, I\'ve got a sequencer.' },
      { de: 'Meine Dreads? Die sind nicht gemacht, die sind gewachsen. Die haben inzwischen ihr eigenes Ökosystem.', en: 'My dreads? They weren\'t made, they grew. They have their own ecosystem by now.' },
      { de: 'Wenn ich mal nicht hier bin: Ich bin im Auto und hör Slime. In voller Lautstärke. Zur Entspannung.', en: 'If I\'m ever missing: I\'m in the car listening to punk. Full volume. To relax.' },
      { de: 'Duuude… wenn die Bassline zwitschert, weißt du, dass es Hi-Tech ist. Zwitschert dein Leben?', en: 'Duuude… when the bassline chirps, you know it\'s hi-tech. Does your life chirp?' },
      { de: 'Full-On? Das ist Hi-Tech für Leute, die noch blinzeln. Hehe.', en: 'Full-on? That\'s hi-tech for people who still blink. Hehe.' },
      { de: 'Pogo auf 190 BPM. Hab ich erfunden. Hat mir zwei Zähne gekostet. Hat sich gelohnt.', en: 'Moshing at 190 BPM. I invented it. Cost me two teeth. Worth it.' },
    ],
  },
  {
    id: 'isi', name: 'Isi', role: { de: 'Helferin', en: 'Volunteer' }, portrait: '🌻',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#f0d890', brows: '#c8a85a', shirt: '#f1c40f', pants: '#2e6b5e', patchwork: true, height: 1.82, extras: ['bubbleWand'] },
    soapBubbles: true, // Isi blows soap bubbles. Always.
    behavior: 'patrol', route: ['base_yard', 'plot_mainstage', 'kitchen', 'plot_chai_lounge', 'plot_awareness', 'plot_entrance', 'plot_biergarten', 'plot_narnia_floor', 'plot_firespace', 'plot_mainstage'], speed: 2.0,
    lines: [
      { de: 'Guten Morgen! Ich hab schon drei Zelte aufgebaut und Wasser für alle geholt!', en: 'Good morning! I already pitched three tents and got water for everyone!' },
      { de: 'Seifenblasen machen alles besser. Sogar den Aufbau. Vor allem den Aufbau!', en: 'Soap bubbles make everything better. Even the build. Especially the build!' },
      { de: 'Ich hab drei Liter Seifenlauge dabei. Für Notfälle. Jeder Moment ist ein Notfall.', en: 'I brought three litres of bubble mix. For emergencies. Every moment is an emergency.' },
      { de: 'Schau, die da drüben schillert in allen Farben! …Und weg. Wie das Chai-Zelt.', en: 'Look, that one shimmers in every colour! …And gone. Like the chai tent.' },
      { de: 'Nee danke, ich bleib nüchtern. Einer muss ja fahren.', en: 'No thanks, I\'m staying sober. Someone has to drive.' },
      { de: 'Du machst das super! Echt!', en: 'You\'re doing great! Seriously!' },
      { de: 'Ich hab alle gefragt, wo es Essensmarken gibt. ALLE. Keiner weiß es.', en: 'I asked everyone where to get food tokens. EVERYONE. Nobody knows.' },
    ],
  },
  // ------------------------------------------------------------------ Narnia Floor crew
  {
    id: 'mia', name: 'Mia', role: { de: 'Narnia Floor', en: 'Narnia Floor' }, portrait: '🦁',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#f0d890', brows: '#c8a85a', hairStyle: 'long', hairStyleColor: '#f0d890', hairLength: 0.45, hairStreaks: ['#ff5ab4', '#5ad1ff', '#b07aff', '#7fe07a'], shirt: '#dff0ff', pants: '#3a6ab0', patchwork: true, shirtPatch: ['#dff0ff', '#9ad0ff', '#f0c0e0'], height: 1.68 },
    behavior: 'builder', home: 'plot_narnia_floor', offset: [2, 3], radius: 5,
    lines: [
      { de: 'Hallo du! Schön, dass du vorbeischaust! 💛', en: 'Hi you! So nice of you to drop by! 💛' },
      { de: 'Bruno. BRUNO. Das ist die falsche Schraube. …Danke trotzdem! 💛', en: 'Bruno. BRUNO. That\'s the wrong screw. …Thanks anyway! 💛' },
      { de: 'Daniel, wenn du die Palette noch einmal fallen lässt, bau ich dich in den Boden ein. Mit Liebe.', en: 'Daniel, if you drop that pallet one more time, I\'ll build you into the floor. With love.' },
      { de: 'Lenny! Nicht tanzen, SCHRAUBEN! …Okay, ein bisschen tanzen.', en: 'Lenny! Not dancing, SCREWING! …Okay, a little dancing.' },
      { de: 'Hinter dem Schrank beginnt Narnia. Also bald. Wenn der Schrank da ist.', en: 'Narnia begins behind the wardrobe. Soon. Once the wardrobe is here.' },
      { de: 'Ich bin gar nicht genervt. Ich lächle nur sehr fest.', en: 'I\'m not annoyed at all. I\'m just smiling very firmly.' },
    ],
  },
  {
    id: 'bruno', name: 'Bruno', role: { de: 'Narnia-Crew', en: 'Narnia crew' }, portrait: '🔨',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#ecd27a', brows: '#c8a85a', hairCut: [0.95, 0.6, 0.95], shirt: '#c0602a', pants: '#4a5a3a', patchwork: true, height: 1.86 },
    behavior: 'builder', home: 'plot_narnia_floor', offset: [-3, -1], radius: 5,
    lines: [
      { de: 'Welche Schraube? Die hier? …Die andere? Okay.', en: 'Which screw? This one? …The other one? Okay.' },
      { de: 'Mia sagt, ich soll weniger reden und mehr schrauben. Ich rede beim Schrauben.', en: 'Mia says I should talk less and screw more. I talk while I screw.' },
      { de: 'Holz riecht so gut. Riech mal. RIECH MAL.', en: 'Wood smells so good. Smell it. SMELL IT.' },
    ],
  },
  {
    id: 'daniel', name: 'Daniel', role: { de: 'Narnia-Crew', en: 'Narnia crew' }, portrait: '🪚',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#1a120c', brows: '#1a120c', hairCut: [0.95, 0.6, 0.95], shirt: '#2a3a5a', pants: '#6a4a2a', patchwork: true, height: 1.8 },
    behavior: 'builder', home: 'plot_narnia_floor', offset: [4, -2], radius: 5,
    lines: [
      { de: 'Die Palette ist nicht gefallen. Sie hat sich hingelegt.', en: 'The pallet didn\'t fall. It lay down.' },
      { de: 'Ich trag den Schrank. Allein. …Morgen.', en: 'I\'ll carry the wardrobe. Alone. …Tomorrow.' },
      { de: 'Ist schon Mittag? Es fühlt sich an wie Mittag.', en: 'Is it lunch yet? It feels like lunch.' },
    ],
  },
  {
    id: 'lenny', name: 'Lenny', role: { de: 'Narnia-Crew', en: 'Narnia crew' }, portrait: '🎧',
    look: { base: 'm_adventurer', backpack: false, skin: SKIN.light, hair: '#b0925a', brows: '#8a6a3a', hairStyle: 'long', hairStyleColor: '#b0925a', hairLength: 0.24, shirt: '#8a3a9a', pants: '#2e6b5e', patchwork: true, height: 1.78 },
    behavior: 'builder', home: 'plot_narnia_floor', offset: [-1, 4], radius: 5,
    lines: [
      { de: 'Ich teste nur, ob der Boden tanzbar ist. Er ist tanzbar.', en: 'I\'m just testing if the floor is danceable. It is danceable.' },
      { de: 'Mia ist die Beste. Sag ihr nicht, dass ich das gesagt hab.', en: 'Mia is the best. Don\'t tell her I said that.' },
      { de: 'Hast du die Bassline heute Nacht gehört? Ich auch nicht, ich hab geschlafen.', en: 'Did you hear the bassline last night? Me neither, I was asleep.' },
    ],
  },
  // ------------------------------------------------------------------ the fire island (firespace)
  {
    id: 'aphi', name: 'Aphi', role: { de: 'Feuerinsel', en: 'Fire island' }, portrait: '🔥',
    look: { base: 'm_casual', skin: '#b8865a', hair: '#0e0b09', brows: '#0e0b09', hairCut: [0.95, 0.6, 0.95], shirt: '#1a1a1a', pants: '#c0602a', patchwork: true, shirtPatch: ['#1a1a1a', '#3a2a1a', '#6a2a1a'], height: 1.72 },
    behavior: 'flow', toy: 'staff', home: 'fire_slot_1',
    lines: [
      { de: 'Kontaktstab ist wie Meditation. Nur mit mehr blauen Flecken.', en: 'Contact staff is like meditation. Just with more bruises.' },
      { de: 'Nachts zünden wir an. Jetzt ist Training. Mit LEDs.', en: 'At night we light them up. Now it\'s practice. With LEDs.' },
      { de: 'Achtung, Abstand! Drei Meter. Oder vier, wenn du Dreads hast.', en: 'Careful, distance! Three metres. Or four if you have dreads.' },
      { de: 'Shiva schaut zu. Ich darf den Stab nicht fallen lassen.', en: 'Shiva is watching. I can\'t drop the staff.' },
    ],
  },
  {
    id: 'mux', name: 'Mux', role: { de: 'Feuerinsel', en: 'Fire island' }, portrait: '🔥',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#0a0a0a', brows: '#0a0a0a', hairStyle: 'long', hairStyleColor: '#0a0a0a', hairLength: 0.5, shirt: '#6a3d9a', pants: '#2a2a2a', patchwork: true, height: 1.76 },
    behavior: 'flow', toy: 'poi', home: 'fire_slot_2',
    lines: [
      { de: 'Poi, Bruder. Links, rechts, Unendlichkeit.', en: 'Poi, brother. Left, right, infinity.' },
      { de: 'Wenn du mich suchst: Ich bin der mit den Haaren und den Kreisen.', en: 'If you\'re looking for me: I\'m the one with the hair and the circles.' },
      { de: 'Den Platz vor Shiva halten wir frei. Heilig und so. Und feuerfest.', en: 'We keep the space in front of Shiva clear. Sacred and all. And fireproof.' },
    ],
  },
  {
    id: 'dennis', name: 'Dennis', role: { de: 'Feuerinsel', en: 'Fire island' }, portrait: '🔥',
    look: { base: 'm_adventurer', backpack: false, skin: '#a8744c', hair: '#0c0a08', brows: '#0c0a08', hairStyle: 'long', hairStyleColor: '#0c0a08', hairLength: 0.46, shirt: '#b8483a', pants: '#3a3a4a', patchwork: true, height: 1.8 },
    behavior: 'flow', toy: 'hoop', home: 'fire_slot_3',
    lines: [
      { de: 'Der Hoop hat fünf Dochte. Ich hab zehn Finger. Passt.', en: 'The hoop has five wicks. I have ten fingers. Works out.' },
      { de: 'Wir bauen noch die Dip-Station fertig. Dann wird gespielt. Also… wir spielen eh schon.', en: 'We\'re still finishing the dip station. Then we play. Well… we\'re already playing.' },
      { de: 'Petroleum riecht nach Festival. Ernsthaft.', en: 'Paraffin smells like festival. Seriously.' },
    ],
  },
  {
    id: 'mehdi', name: 'Mehdi', role: { de: 'Hängt bei Corni ab', en: 'Hangs out at Corni\'s' }, portrait: '🎧',
    look: { base: 'm_hoodie', skin: '#b07a52', hair: '#0e0a08', brows: '#0e0a08', hairCut: [0.95, 0.6, 0.95], shirt: '#5a6a3a', pants: '#2a2a3a', patchwork: true, height: 1.78 },
    behavior: 'sitter', home: 'corni_seat', face: 'corni_desk',
    lines: [
      { de: 'Moment… ist das hier Cornis Container? …Dann bin ich richtig. Glaub ich.', en: 'Wait… is this Corni\'s container? …Then I\'m in the right place. I think.' },
      { de: 'Ich hör nur kurz Musik. Seit… wie spät ist es eigentlich?', en: 'I\'m just listening to some music. Since… what time is it, actually?' },
      { de: 'Was machen wir hier nochmal? Festival? Ah. Stimmt.', en: 'What are we doing here again? Festival? Ah. Right.' },
      { de: 'Hast du Corni gesehen? Ich soll ihm was sagen. Ich weiß nur nicht mehr, was.', en: 'Have you seen Corni? I\'m supposed to tell him something. I just forgot what.' },
      { de: 'Dieser Track ist so gut. Welcher? Der hier. …Oder der davor.', en: 'This track is so good. Which one? This one. …Or the one before.' },
      { de: 'Ich wollte eigentlich was holen. Dann hab ich mich hingesetzt. Jetzt sitz ich.', en: 'I actually wanted to get something. Then I sat down. Now I\'m sitting.' },
    ],
  },
  {
    id: 'sarah', name: 'Sarah', role: { de: 'Feuerinsel', en: 'Fire island' }, portrait: '🧝',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#f2dc8a', brows: '#c8a85a', hairStyle: 'long', hairStyleColor: '#f2dc8a', hairLength: 0.58, elfEars: true, shirt: '#2e6b5e', pants: '#3a2a4a', patchwork: true, shirtPatch: ['#2e6b5e', '#6a3d9a', '#1a1a1a'], height: 1.84, width: 0.88 },
    behavior: 'flow', toy: 'staff', home: 'fire_slot_4',
    lines: [
      { de: 'Die Ohren? Die sind echt. Also… echt schön, oder?', en: 'The ears? They\'re real. Well… really pretty, right?' },
      { de: 'Feuer ist wie Wasser, nur heißer. Und gefährlicher. Und schöner.', en: 'Fire is like water, just hotter. And more dangerous. And prettier.' },
      { de: 'Wenn Shiva zuschaut, dreh ich immer eine Runde mehr.', en: 'When Shiva is watching, I always spin one more round.' },
      { de: 'Hast du Lust, mal den Stab zu halten? …Mit LEDs. Erstmal.', en: 'Want to hold the staff? …With LEDs. For now.' },
    ],
  },
  {
    id: 'wiesel', name: 'Wiesel', role: { de: 'Hängemattenwald', en: 'Hammock forest' }, portrait: '🐿️',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#5a3a1e', brows: '#5a3a1e', hairCut: [0.95, 0.6, 0.95], beard: 'moustache', beardColor: '#4a2e18', shirt: '#b0602a', pants: '#3a4a2a', patchwork: true, height: 1.6 },
    behavior: 'builder', home: 'plot_hammocks', offset: [4, 6], radius: 6,
    lines: [
      { de: 'Hängematten sind die beste Erfindung der Menschheit. Direkt nach Pfosten.', en: 'Hammocks are humanity\'s best invention. Right after posts.' },
      { de: 'Der Schnurrbart? Der hält die Seile gerade. Physik.', en: 'The moustache? Keeps the ropes straight. Physics.' },
      { de: 'Klein, aber ich schlepp jeden Pfosten. Zu zweit. Mit Radlader.', en: 'Small, but I carry every post. With help. And a wheel loader.' },
      { de: 'Wenn der Wald steht, leg ich mich rein und steh erst nach dem Festival wieder auf.', en: 'Once the forest stands, I lie down and won\'t get up until after the festival.' },
    ],
  },
  // ------------------------------------------------------------------ the landowner & the helpful one
  {
    id: 'schwarzhuber', name: 'Schwarzhuber', role: { de: 'Bauer (gehört die Wiese)', en: 'Farmer (owns the field)' }, portrait: '🚜',
    look: { base: 'm_casual', skin: '#e8b89a', hair: '#c8763a', brows: '#b0602a', hairStyle: 'curly', hairStyleColor: '#c8763a', hairLength: 0.34, beard: 'full', beardColor: '#b8682e', shirt: '#9a2a24', pants: '#3a4a2a', shoes: '#1e3a1e', patchwork: true, shirtPatch: ['#9a2a24', '#6a1a18', '#d8d0c0'], height: 1.86, width: 1.12 },
    behavior: 'farmer', route: ['parking', 'plot_entrance', 'plot_mainstage', 'chill', 'plot_biergarten', 'plot_firespace', 'chill'],
    lines: [
      { de: 'Dilettantisch. Des is alles so dilettantisch. …Aber schee is scho.', en: 'Amateurs. It\'s all so amateurish. …But it\'s pretty, I\'ll give you that.' },
      { de: 'Wer hat den Bauzaun so hing\'stellt? Des hält ja nia im Leben.', en: 'Who put the fence up like that? That\'ll never hold in a million years.' },
      { de: 'Ihr Hippies seids scho a verrückter Haufen. Aber i mog eich.', en: 'You hippies are a crazy bunch. But I like you.' },
      { de: 'Mei Wiese! …Na guad. Is ja nur fürs Festival.', en: 'My meadow! …Oh well. It\'s only for the festival.' },
      { de: 'Den Radlader fahrt ma so ned. Aber wurscht, is ja ned meiner.', en: 'That\'s not how you drive a wheel loader. But whatever, it\'s not mine.' },
      { de: 'Barfuß auf\'m Acker. Wenn des mei Großvater g\'sehn hätt…', en: 'Barefoot on the field. If my grandfather had seen that…' },
      { de: 'Zdenko, du bist a Hund. Prost.', en: 'Zdenko, you rascal. Cheers.' },
      { de: 'Sechs Pfosten und a Holzdrach. Und des nennts ihr dann Bühne. Mei. I find\'s guad.', en: 'Six posts and a wooden dragon. And you call that a stage. Well. I like it.' },
      { de: 'Alles dilettantisch. Jedes Jahr. Und jedes Jahr kimmt ihr wieder. Und i sag jedes Jahr ja.', en: 'All amateurish. Every year. And every year you come back. And every year I say yes.' },
    ],
    benchLines: [
      { de: 'Zdenko, Tinyhaus – habts ihr heut scho was g\'arbeitet? …Na. Hab i ma denkt.', en: 'Zdenko, Tinyhaus – done any work today? …No. Thought so.' },
      { de: 'Gib ma a Bier, Tinyhaus. Des is mei Wiese, i derf des.', en: 'Give me a beer, Tinyhaus. It\'s my meadow, I\'m allowed.' },
      { de: 'So dilettantisch, wie ihr des macht… aber lustig seids.', en: 'As amateurish as you do it all… but you\'re fun.' },
      { de: 'Prost, ihr Hippies. Auf mei Wiese.', en: 'Cheers, you hippies. To my meadow.' },
    ],
  },
  {
    id: 'thomas', name: 'Thompsen', role: { de: 'Strom & Licht (hilft überall)', en: 'Power & light (helps everywhere)' }, portrait: '🤝',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#15100c', brows: '#15100c', hairCut: [0.95, 0.6, 0.95], beard: 'short', beardColor: '#120e0a', shirt: '#2e5a8a', pants: '#3a3a3a', shoes: '#2a2018', patchwork: true, height: 1.98 },
    behavior: 'worker', route: ['generator', 'festival_generator_side', 'stage_front', 'plot_entrance', 'festival_generator_side', 'plot_mainstage'],
    lines: [
      { de: 'Hey! Brauchst du Hilfe? Ich pack mit an, sag einfach Bescheid!', en: 'Hey! Need help? I\'ll pitch in, just say the word!' },
      { de: 'Felix, soll ich die Kabeltrommel holen? …Hab sie schon!', en: 'Felix, want me to get the cable drum? …Already got it!' },
      { de: 'Kein Stress, das kriegen wir zusammen hin!', en: 'No stress, we\'ll get it done together!' },
      { de: 'Ich hab noch Kabelbinder, falls du welche brauchst. Immer.', en: 'I\'ve got cable ties if you need some. Always.' },
      { de: 'Schön, dass du da bist! Echt jetzt.', en: 'Great that you\'re here! Really.' },
      { de: 'Strom ist wie Liebe: Muss fließen. Sagt Felix. Glaub ich.', en: 'Power is like love: it has to flow. Felix says. I think.' },
    ],
  },
  {
    id: 'verena', name: 'Verena', role: { de: 'Bar', en: 'Bar' }, portrait: '🍹',
    look: { base: 'f_formal', skin: SKIN.light, hair: '#5a2a1a', shirt: '#1f6fc9', pants: '#1f6fc9', patchwork: true, shirtPatch: ['#1f6fc9', '#ffffff', '#1f4f99'] },
    behavior: 'wander', home: 'plot_biergarten', offset: [7.6, 2], radius: 1.5, appearAfter: 'q9_festzelt', // behind her bar at the Techno Floor
    lines: [
      { de: 'So, ich bin da. Wo ist meine Bar? Ah, da. Schön. Wo sind die Gläser?', en: 'Right, I\'m here. Where\'s my bar? Ah. Nice. Where are the glasses?' },
      { de: 'Ich komm immer erst kurz vorher. Dann ist alles fertig. Theoretisch.', en: 'I always arrive just before. Then everything is done. In theory.' },
    ],
  },
  {
    id: 'janina', name: 'Janina', role: { de: 'Narnia-Deko & DJ', en: 'Narnia deco & DJ' }, portrait: '🎶',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#1e140e', brows: '#1e140e', hairStyle: 'long', hairStyleColor: '#1e140e', hairLength: 0.55, shirt: '#9b3d8a', pants: '#2a2a3a', patchwork: true, shirtPatch: ['#9b3d8a', '#2a8a7a', '#c9b24a'], height: 1.7, width: 0.82 },
    behavior: 'wander', home: 'plot_narnia_floor', offset: [-5, 4], radius: 3,
    homeAfter: { quest: 'n2_narnia', spot: 'narnia_deck', radius: 3.5 }, // hangs her deco in the stretch tent once it stands
    lines: [
      { de: 'Noch eine Lichterkette hier, eine Girlande da… und dann noch eine. Und noch eine.', en: 'One more fairy light here, a garland there… and another one. And another one.' },
      { de: 'Sobald das Stretchzelt über dem Narnia Floor steht, häng ich meine Tücher auf. Kisten voll. KISTEN.', en: 'Once the stretch tent is up over the Narnia Floor I\'ll hang my fabrics. Crates of them. CRATES.' },
      { de: 'Mia baut den Floor, ich mach das Zelt schön. Arbeitsteilung. 💫', en: 'Mia builds the floor, I make the tent pretty. Division of labour. 💫' },
      { de: 'Ich leg am Festival auf! Ich bin SO aufgeregt. Hab schon 400 Tracks ausgesucht. Für zwei Stunden.', en: 'I\'m DJing at the festival! I\'m SO excited. Already picked 400 tracks. For two hours.' },
      { de: 'Hörst du das? Das ist mein Set. In meinem Kopf. Läuft seit drei Tagen.', en: 'Hear that? That\'s my set. In my head. Been playing for three days.' },
      { de: 'Deko ist wie Musik: Man merkt sie erst, wenn sie fehlt.', en: 'Deco is like music: you only notice it when it\'s missing.' },
      { de: 'Hinter dem Schrank Narnia, im Zelt ein Sternenhimmel. Aus Tüchern. Und 300 Sicherheitsnadeln.', en: 'Narnia behind the wardrobe, a starry sky in the tent. Made of fabric. And 300 safety pins.' },
      { de: 'Wenn du mich suchst: im Narnia-Zelt, auf der Leiter, mit Tüchern im Mund.', en: 'If you\'re looking for me: in the Narnia tent, up the ladder, fabric in my mouth.' },
      { de: 'Kommst du zu meinem Set? Bitte komm zu meinem Set. Bring Leute mit!', en: 'Are you coming to my set? Please come to my set. Bring people!' },
    ],
  },
  {
    id: 'vero', name: 'Vero', role: { de: 'Deko am Eingang', en: 'Entrance deco' }, portrait: '🌙',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#0b0a0a', brows: '#0b0a0a', hairStyle: 'long', hairStyleColor: '#0b0a0a', hairLength: 0.6, shirt: '#3a2a4a', pants: '#2a2a3a', patchwork: true, shirtPatch: ['#3a2a4a', '#6a3d9a', '#1a1a2a'], height: 1.86 },
    behavior: 'wander', home: 'plot_entrance', offset: [4, 3], radius: 4,
    lines: [
      { de: 'Hallo du. Schön, dass du da bist. Wirklich.', en: 'Hello you. Nice that you\'re here. Really.' },
      { de: 'Der Eingang ist das Erste, was die Leute sehen. Und das Letzte, wenn sie gehen. …Darüber denk ich viel nach.', en: 'The entrance is the first thing people see. And the last when they leave. …I think about that a lot.' },
      { de: 'Jedes Jahr häng ich die gleichen Tücher auf. Und jedes Jahr sind sie ein bisschen mehr verblichen. Wie wir. Aber schön.', en: 'Every year I hang the same fabrics. And every year they\'re a bit more faded. Like us. But pretty.' },
      { de: 'Kannst du mal kurz halten? Danke. Du hast ein gutes Herz, glaub ich.', en: 'Could you hold this for a sec? Thanks. You have a good heart, I think.' },
      { de: 'In einer Woche ist alles wieder abgebaut. Deswegen mach ich es jetzt besonders schön.', en: 'In a week it\'ll all be taken down again. That\'s why I make it extra pretty now.' },
      { de: 'Manchmal steh ich hier und stell mir vor, wie die ersten Gäste reinkommen. Dann muss ich ein bisschen weinen. Gutes Weinen.', en: 'Sometimes I stand here and imagine the first guests coming in. Then I cry a little. Good crying.' },
      { de: 'Groß sein ist praktisch. Ich komm überall hin. Nur nicht an den Sommer vom letzten Jahr.', en: 'Being tall is handy. I can reach everything. Except last year\'s summer.' },
    ],
  },
  {
    id: 'strom_andi', name: 'Strom Andi', role: { de: 'Strom (eigentlich Bier)', en: 'Power (actually beer)' }, portrait: '🍻',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#e6c870', brows: '#c8a85a', hairCut: [0.95, 0.55, 0.95], beard: 'short', beardColor: '#d8b860', shirt: '#c0602a', pants: '#3a4a5a', patchwork: true, shirtPatch: ['#c0602a', '#e0a030', '#3a4a5a'], height: 1.93, width: 1.1, extras: ['bottle'] },
    behavior: 'wander', home: 'generator', offset: [3, -2], radius: 4,
    lines: [
      { de: 'Ich bin eigentlich nur zum Biertrinken hier. Dann hat Felix mich gesehen. Jetzt bin ich Strom.', en: 'I\'m actually only here for the beer. Then Felix saw me. Now I\'m power.' },
      { de: 'Felix sagt, ich soll das Kabel halten. Ich halt das Kabel. In der anderen Hand: Bier. Multitasking!', en: 'Felix says hold the cable. I\'m holding the cable. Other hand: beer. Multitasking!' },
      { de: 'Hahaha, Prost! Auf den Strom! Und auf… alles andere auch!', en: 'Hahaha, cheers! To the power! And to… everything else too!' },
      { de: 'Starkstrom und Bier vertragen sich super. Sagt keiner. Außer mir.', en: 'High voltage and beer go great together. Says nobody. Except me.' },
      { de: 'Wenn Felix fragt: Ich hab gearbeitet. Den ganzen Tag. Mit Pausen. Mit vielen Pausen.', en: 'If Felix asks: I worked. All day. With breaks. Lots of breaks.' },
      { de: 'Du bist super, weißt du das? Komm, ich erzähl dir einen Witz. …Hab ich vergessen. Hahaha!', en: 'You\'re great, you know that? Come on, I\'ll tell you a joke. …Forgot it. Hahaha!' },
      { de: 'Julez sagt, ich halte das Bier falsch. Ich halte es genau richtig. Es ist fast leer.', en: 'Julez says I hold my beer wrong. I hold it exactly right. It\'s almost empty.' },
      { de: 'Hicks! …Das war der Generator. Nicht ich. Hihi.', en: 'Hic! …That was the generator. Not me. Hehe.' },
    ],
  },
  {
    id: 'futuremoon', name: 'Futuremoon Luna', role: { de: 'Artist-Betreuung & Stages', en: 'Artist care & stages' }, portrait: '🌕',
    look: { base: 'f_casual', skin: SKIN.light, hair: '#1a1210', brows: '#1a1210', hairStyle: 'long', hairStyleColor: '#1a1210', hairLength: 0.6, tattoos: true, shirt: '#1a1a1a', pants: '#4a3a6a', patchwork: true, shirtPatch: ['#1a1a1a', '#6a3d9a', '#2a2a4a'], height: 1.84 },
    behavior: 'patrol', route: ['plot_mainstage', 'stage_front', 'plot_forest_dome', 'plot_narnia_floor', 'plot_firespace', 'plot_biergarten', 'plot_mainstage'], speed: 1.6,
    lines: [
      { de: 'Hey du! Brauchst du was? Wasser, Schatten, eine Umarmung? Ich hab alles.', en: 'Hey you! Need anything? Water, shade, a hug? I\'ve got it all.' },
      { de: 'Ich kümmer mich um die Artists. Die brauchen Wasser, Handtücher und viel Liebe. Wie wir alle.', en: 'I look after the artists. They need water, towels and lots of love. Like all of us.' },
      { de: 'Der Rider sagt: „nur stilles Wasser, Raumtemperatur, mit Mondlicht aufgeladen“. Kein Problem!', en: 'The rider says: "still water only, room temperature, charged by moonlight". No problem!' },
      { de: 'Wenn du bei den Stages was brauchst, sag Bescheid. Ich bin eh überall dort.', en: 'If you need anything at the stages, just say. I\'m all over them anyway.' },
      { de: 'Das Tattoo? Das ist der Mond. Und das daneben auch. Und das da. Ich mag den Mond.', en: 'The tattoo? That\'s the moon. And the one next to it. And that one. I like the moon.' },
      { de: 'Komm, ich trag die Hälfte. Zusammen ist es nur halb so schwer.', en: 'Come on, I\'ll carry half. Together it\'s only half as heavy.' },
      { de: 'Full-On ist einfach Liebe in 145 BPM. Diese Melodien! Da muss ich jedes Mal weinen. Und tanzen. Gleichzeitig.', en: 'Full-on is just love at 145 BPM. Those melodies! I cry every time. And dance. At the same time.' },
      { de: 'Rocky sagt, Full-On ist zu langsam. Rocky blinzelt auch nicht mehr. Ich bleib bei Full-On. 🌕', en: 'Rocky says full-on is too slow. Rocky also doesn\'t blink anymore. I\'m sticking with full-on. 🌕' },
      { de: 'Sonnenaufgang, Full-On-Set, alle Arme oben. Dafür machen wir das hier.', en: 'Sunrise, full-on set, everyone\'s arms up. That\'s what we do all this for.' },
      { de: 'Wenn ein Artist fragt, ob es hier Full-On gibt: JA. Dafür sorg ich persönlich.', en: 'If an artist asks whether there\'s full-on here: YES. I\'ll personally make sure of it.' },
      { de: 'Die Artists kommen erst übermorgen. Ich hab trotzdem schon die Backstage-Kissen aufgeschüttelt.', en: 'The artists only arrive the day after tomorrow. I\'ve already fluffed the backstage cushions anyway.' },
    ],
  },
  {
    id: 'mikey', name: 'Mikey', role: { de: 'Hilft überall ein bisschen', en: 'Helps a bit everywhere' }, portrait: '😎',
    look: { base: 'm_casual', skin: SKIN.light, hair: '#e3c46a', brows: '#b8963a', hairStyle: 'long', hairStyleColor: '#e3c46a', hairLength: 0.2, sunglasses: true, shirt: '#e0e0d0', pants: '#4a5a8a', patchwork: true, shirtPatch: ['#e0e0d0', '#5ad1ff', '#c9b24a'], height: 1.8 },
    behavior: 'patrol', route: ['base_yard', 'kitchen', 'plot_mainstage', 'plot_chai_lounge', 'generator', 'plot_entrance', 'plot_hammocks', 'chill'], speed: 1.9,
    lines: [
      { de: 'Ich helf hier ein bisschen, da ein bisschen. Überall ein bisschen. Läuft.', en: 'I help a bit here, a bit there. A bit everywhere. All good.' },
      { de: 'Die Sonnenbrille? Die bleibt auf. Auch nachts. Vor allem nachts.', en: 'The sunglasses? They stay on. At night too. Especially at night.' },
      { de: 'Brauchst du ne Hand? Ich hab zwei. Eine ist frei.', en: 'Need a hand? I\'ve got two. One is free.' },
      { de: 'Hab grad Sabse geholfen. Dann Felix. Dann Corni. Jetzt helf ich mir mal selbst – mit Pause.', en: 'Just helped Sabse. Then Felix. Then Corni. Now I\'m helping myself – to a break.' },
      { de: 'Entspannt bleiben. Das Festival kommt sowieso. Ob wir fertig sind oder nicht.', en: 'Stay relaxed. The festival is coming anyway. Whether we\'re done or not.' },
      { de: 'Ich seh dich. Du siehst mich nicht. Sonnenbrille, Baby.', en: 'I see you. You don\'t see me. Sunglasses, baby.' },
    ],
  },
  {
    id: 'georg', name: 'Georg', role: { de: 'Firespace', en: 'Firespace' }, portrait: '🕉️',
    look: { base: 'm_adventurer', backpack: false, skin: SKIN.light, hair: '#0c0a0a', brows: '#0c0a0a', hairStyle: 'dreads', hairStyleColor: '#0c0a0a', dreadLength: 0.66, beads: true, tattoos: true, shirt: '#1a1a1a', pants: '#5a3a2a', patchwork: true, shirtPatch: ['#1a1a1a', '#6a2a1a', '#2a2a2a'], height: 1.92 },
    behavior: 'wander', home: 'plot_firespace', offset: [-6, 4], radius: 5,
    lines: [
      { de: 'Schön, dass du da bist! Wirklich. …Du trägst aber schon Schuhe, oder? Hm. Jeder, wie er meint.', en: 'Lovely that you\'re here! Really. …You are wearing shoes, though? Hm. Each to their own.' },
      { de: 'Ich will ja niemanden verurteilen. Aber Zdenko. Ich mein ja nur. Zdenko.', en: 'I don\'t want to judge anyone. But Zdenko. I\'m just saying. Zdenko.' },
      { de: 'Namaste, Bruder! Hast du heute schon Plastik benutzt? Ich frag nur. Ganz ohne Wertung.', en: 'Namaste, brother! Used any plastic today? Just asking. No judgement at all.' },
      { de: 'Tinyhaus trinkt schon wieder. Um elf. Ich sag nix. Ich denk es nur sehr laut.', en: 'Tinyhaus is drinking again. At eleven. I won\'t say anything. I\'m just thinking it very loudly.' },
      { de: 'Du machst das toll! Also… für deine Verhältnisse. Das ist ein Kompliment!', en: 'You\'re doing great! Well… by your standards. That\'s a compliment!' },
      { de: 'Das Feuer ist heilig. Wer mit Petroleum rumplempert wie Dennis, hat das nicht verstanden. Liebe Grüße an Dennis.', en: 'Fire is sacred. Anyone sloshing paraffin around like Dennis hasn\'t understood that. Much love to Dennis.' },
      { de: 'Ich find\'s super, dass du so… entspannt mit Zeit umgehst. Wirklich. Jeder Mensch ist anders.', en: 'I think it\'s great that you\'re so… relaxed about time. Really. Everyone is different.' },
      { de: 'Leo? Ein wundervoller Mensch. Der nie da ist. Aber wundervoll.', en: 'Leo? A wonderful person. Who\'s never there. But wonderful.' },
    ],
  },
  {
    id: 'delsin', name: 'Delsin', role: { de: 'Awareness (hilft Franzi)', en: 'Awareness (helps Franzi)' }, portrait: '🫂',
    look: { base: 'm_hoodie', skin: '#c89a70', hair: '#2a1a10', brows: '#2a1a10', hairStyle: 'bun', hairStyleColor: '#2a1a10', shirt: '#4a8a5a', pants: '#3a3a4a', patchwork: true, shirtPatch: ['#4a8a5a', '#e0e0d0', '#2a6a4a'], height: 1.8 },
    behavior: 'wander', home: 'chill', radius: 10,
    homeAfter: { quest: 'q6_awareness', spot: 'plot_awareness', offset: [-5, 5], radius: 5 }, // joins Franzi once her tent stands
    lines: [
      { de: 'Hey. Alles okay bei dir? Echt jetzt, nicht nur so.', en: 'Hey. You okay? For real, not just saying it.' },
      { de: 'Sobald Franzis Zelt steht, helf ich ihr. Für die, die zu viel erwischt haben.', en: 'Once Franzi\'s tent is up, I\'ll help her. For the ones who overdid it.' },
      { de: 'Verbände sind Franzis Ding. Ich bin eher für Wasser, Decke und „du bist sicher“.', en: 'Bandages are Franzi\'s thing. I\'m more water, blanket and "you\'re safe".' },
      { de: 'Wenn jemand zu drauf ist: hol mich. Ich setz mich dazu und erklär, dass der Boden nicht atmet.', en: 'If someone\'s too high: get me. I\'ll sit with them and explain the ground isn\'t breathing.' },
      { de: 'Atmen. Ein, aus. Funktioniert bei allen. Sogar bei Zdenko. Manchmal.', en: 'Breathe. In, out. Works for everyone. Even Zdenko. Sometimes.' },
    ],
  },
  {
    id: 'cosma', name: 'Cosma', role: { de: 'Künstlergasse', en: 'Artists\' alley' }, portrait: '😁',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#241812', brows: '#241812', hairStyle: 'long', hairStyleColor: '#241812', hairLength: 0.56, shirt: '#e0a030', pants: '#6a3d9a', patchwork: true, shirtPatch: ['#e0a030', '#2a8a7a', '#e84a8a'], height: 1.56 },
    behavior: 'builder', home: 'plot_kuenstlergasse', offset: [-2, 3], radius: 5,
    lines: [
      { de: 'Hallo du! 😁 Schön, dass du da bist. Ich hab dich schon gespürt, bevor du da warst.', en: 'Hello you! 😁 Lovely that you\'re here. I felt you before you arrived.' },
      { de: 'Kunst ist, wenn das Herz durch die Hände spricht. 😁', en: 'Art is when the heart speaks through the hands. 😁' },
      { de: 'Mathias ist mein Fels. Ein Fels mit Dreads, der immer lacht.', en: 'Mathias is my rock. A rock with dreads who\'s always laughing.' },
      { de: 'Hier war früher der Creative Space. Jetzt ist es die Künstlergasse. Die Energie ist geblieben, nur der Name ist umgezogen.', en: 'This used to be the creative space. Now it\'s the artists\' alley. The energy stayed, only the name moved.' },
      { de: 'Hast du heute schon was Schönes gesehen? Nein? Dann schau mal in den Himmel. Siehst du? 😁', en: 'Seen anything beautiful today? No? Then look at the sky. See? 😁' },
      { de: 'Alles passiert genau dann, wenn es passieren soll. Auch Leo. Theoretisch.', en: 'Everything happens exactly when it\'s meant to. Even Leo. Theoretically.' },
    ],
  },
  {
    id: 'mathias', name: 'Mathias', role: { de: 'Künstlergasse (Bau)', en: 'Artists\' alley (building)' }, portrait: '😄',
    look: { base: 'm_adventurer', backpack: false, skin: SKIN.light, hair: '#e6c870', brows: '#c8a85a', hairStyle: 'dreads', hairStyleColor: '#e6c870', dreadLength: 0.72, beads: true, shirt: '#2e6b5e', pants: '#8a6a4a', patchwork: true, shirtPatch: ['#2e6b5e', '#c0602a', '#c9b24a'], height: 1.84 },
    behavior: 'builder', home: 'plot_kuenstlergasse', offset: [3, -2], radius: 5,
    lines: [
      { de: 'Hey! 😄 Brauchst du Hilfe? Ich hab grad zwei Hände frei. Also, eine. Okay, gleich zwei.', en: 'Hey! 😄 Need help? I\'ve got two hands free. Well, one. Okay, two in a sec.' },
      { de: 'Cosma hat die Ideen, ich hab den Akkuschrauber. Perfektes Team. 😄', en: 'Cosma has the ideas, I have the cordless drill. Perfect team. 😄' },
      { de: 'Pfosten rein, Seil dran, festziehen, grinsen. So baut man Zelte.', en: 'Post in, rope on, tighten, grin. That\'s how you build tents.' },
      { de: 'Die Dreads? Die helfen beim Bauen. Die halten Schrauben. Manchmal.', en: 'The dreads? They help with building. They hold screws. Sometimes.' },
      { de: 'Wenn du irgendwas tragen musst – sag Bescheid, ich pack mit an! 😄', en: 'If you need to carry anything – just say, I\'ll pitch in! 😄' },
    ],
  },
  {
    id: 'lotta', name: 'Lotta', role: { de: 'Helferin', en: 'Volunteer' }, portrait: '🌼',
    look: { base: 'f_casual', skin: SKIN.light, hair: '#1a120c', brows: '#1a120c', hairStyle: 'dreads', hairStyleColor: '#1a120c', dreadLength: 0.7, beads: true, shirt: '#c9b24a', pants: '#2e6b5e', patchwork: true, shirtPatch: ['#c9b24a', '#9b3d8a', '#2a8a7a'], height: 1.84 },
    behavior: 'wander', home: 'festival_random', roam: 'festival_random', radius: 12,
    lines: [
      { de: 'Hey, du! Schön, dich zu sehen! 🌼 Wie geht\'s dir heute?', en: 'Hey, you! Lovely to see you! 🌼 How are you today?' },
      { de: 'Brauchst du Hilfe? Ich hab Zeit. Und zwei Hände. Und gute Laune.', en: 'Need help? I\'ve got time. And two hands. And good vibes.' },
      { de: 'Die Dreads? Seit zehn Jahren. Die haben schon mehr Festivals gesehen als Leo.', en: 'The dreads? Ten years now. They\'ve seen more festivals than Leo.' },
      { de: 'Ich find\'s so schön, dass wir das alle zusammen machen. Echt.', en: 'I love that we\'re all doing this together. Really.' },
      { de: 'Hast du schon was gegessen? Sabse hat Linsen. Ich bring dir welche, wenn du magst!', en: 'Have you eaten yet? Sabse has lentils. I\'ll bring you some if you like!' },
      { de: 'Du machst das super. Und falls nicht: auch super. 😊', en: 'You\'re doing great. And if not: also great. 😊' },
    ],
  },
  {
    id: 'silke', name: 'Silke', role: { de: 'Chai-Zelt (Bauleitung, seit Montag)', en: 'Chai tent (site lead, since Monday)' }, portrait: '🫖',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#8a3a1e', brows: '#6a2a14', hairStyle: 'long', hairStyleColor: '#8a3a1e', hairLength: 0.4, headband: '#e0a030', shirt: '#d9803c', pants: '#5b3a73', patchwork: true, shirtPatch: ['#d9803c', '#8e2b3a', '#2e5d7a'], height: 1.7 },
    behavior: 'builder', home: 'plot_chai_lounge', offset: [-2, -2], radius: 5,
    lines: [
      { de: 'Morgen steht das Chai-Zelt. Ganz sicher. Spätestens übermorgen.', en: 'The chai tent will be up tomorrow. Definitely. The day after at the latest.' },
      { de: 'Wir sind gerade in der Konzeptphase. Seit Montag. Es ist ein sehr gutes Konzept.', en: 'We\'re in the concept phase. Since Monday. It\'s a very good concept.' },
      { de: 'Alle helfen mit! Wirklich alle! Wir sind die größte Crew vom ganzen Festival.', en: 'Everyone\'s helping! Really everyone! We\'re the biggest crew of the whole festival.' },
      { de: 'Wir haben das Zelt heute einmal ausgerollt. Dann war Chai-Pause. Dann war Mittag.', en: 'We unrolled the tent once today. Then there was a chai break. Then lunch.' },
      { de: 'Der Pfosten da steht schon! Seit Montag. Der ist das Fundament unserer Vision.', en: 'That pole is already up! Since Monday. It\'s the foundation of our vision.' },
      { de: 'Wer sagt, dass das Chai-Zelt nie fertig wird? Juli? JULI!', en: 'Who says the chai tent will never be finished? Juli? JULI!' },
      { de: 'Am Flipchart steht der Plan. Der Plan ist ein Kreis. Kreise sind Harmonie.', en: 'The plan is on the flipchart. The plan is a circle. Circles are harmony.' },
    ],
  },
  {
    id: 'jonas', name: 'Jonas', role: { de: 'Schallschutz (Stroh) & Bier', en: 'Sound walls (straw) & beer' }, portrait: '🍺',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#e6c870', brows: '#c8a85a', hairCut: [0.95, 0.6, 0.95], beard: 'short', beardColor: '#dcbc60', vikingHat: true, shirt: '#3a5a2a', pants: '#5a4a3a', patchwork: true, shirtPatch: ['#3a5a2a', '#c9b24a', '#6b3a2a'], height: 1.94, width: 1.12, extras: ['bottle'] },
    behavior: 'wander', home: 'plot_mainstage', offset: [-12, -8], radius: 6,
    lines: [
      { de: 'SKÅL! Bier gibt\'s bei mir. Immer. Auch beim Strohstapeln.', en: 'SKÅL! Beer\'s at mine. Always. Even while stacking straw.' },
      { de: 'Stroh schluckt den Bass. Bier schluckt den Rest.', en: 'Straw swallows the bass. Beer swallows the rest.' },
      { de: 'Der Helm? Wikinger hatten keine Hörner. Ich schon.', en: 'The helmet? Vikings didn\'t have horns. I do.' },
      { de: 'Eine Strohwand ist wie ein Wikingerschild. Nur gelber. Und weicher. Und es piekst.', en: 'A straw wall is like a viking shield. Just yellower. And softer. And it itches.' },
      { de: 'Wenn die Nachbarn aus Karlsfeld anrufen, sag ich: mehr Stroh! Und dann: Bier.', en: 'When the neighbours from Karlsfeld call, I say: more straw! And then: beer.' },
      { de: 'Ich hab heute schon 80 Ballen bewegt. Also, gedanklich. Mit Bier.', en: 'Already moved 80 bales today. Mentally. With beer.' },
      { de: 'Die Chai-Crew wollte mir Stroh fürs Zelt abkaufen. Das Zelt gibt\'s ja noch nicht. HAHA. Skål!', en: 'The chai crew wanted to buy straw for their tent. There is no tent yet. HAHA. Skål!' },
    ],
  },
  {
    id: 'alf', name: 'Alf', role: { de: 'Geschichtenerzähler', en: 'Storyteller' }, portrait: '📖',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#1e1610', brows: '#1e1610', hairStyle: 'long', hairStyleColor: '#1e1610', hairLength: 0.5, shirt: '#6a4a8a', pants: '#4a3a2a', patchwork: true, shirtPatch: ['#6a4a8a', '#c0602a', '#2a6a5a'], height: 1.8 },
    behavior: 'wander', home: 'festival_random', roam: 'festival_random', radius: 10,
    lines: [
      { de: 'Hab ich dir schon erzählt, wie ich 2012 in Portugal mit einem Esel getrampt bin? Also, der Esel hat getrampt. Ich bin gelaufen.', en: 'Did I tell you how I hitchhiked in Portugal with a donkey in 2012? Well, the donkey hitchhiked. I walked.' },
      { de: 'Einmal hab ich auf einem Festival drei Tage lang einen Schlafsack gesucht. Ich lag die ganze Zeit drin.', en: 'Once at a festival I spent three days looking for a sleeping bag. I was lying in it the whole time.' },
      { de: 'Kennst du die Geschichte vom ersten Trikaya? Da gab\'s nur eine Bühne, einen Generator und Zdenko. Der Generator war das Zuverlässigste.', en: 'Know the story of the first Trikaya? There was just one stage, one generator and Zdenko. The generator was the most reliable.' },
      { de: 'In Goa hab ich mal einen Sadhu getroffen, der hat mir die Zukunft vorhergesagt. Er meinte: „Du wirst Kisten tragen.“ Er hatte recht.', en: 'In Goa I met a sadhu who told my future. He said: "You will carry crates." He was right.' },
      { de: 'Ich hab mal einen Sonnenaufgang auf einem Strohballen erlebt. Dann ist der Ballen umgekippt. War trotzdem schön.', en: 'I once watched a sunrise from a straw bale. Then the bale tipped over. Still beautiful.' },
      { de: 'Das Chai-Zelt? Das stand schon 2017 nicht. Und 2018. Tradition, mein Freund.', en: 'The chai tent? It wasn\'t up in 2017 either. Or 2018. Tradition, my friend.' },
      { de: 'Wusstest du, dass Leo einmal pünktlich war? Ich war dabei. Keiner hat mir geglaubt. Ich glaub\'s selbst kaum noch.', en: 'Did you know Leo was on time once? I was there. Nobody believed me. I barely believe it myself.' },
      { de: 'Setz dich, ich erzähl dir was. …Ach, du musst arbeiten? Dann erzähl ich\'s dir beim Tragen.', en: 'Sit down, I\'ll tell you something. …Oh, you have to work? Then I\'ll tell you while carrying.' },
      { de: 'Damals in Marokko, da hatten wir keine Essensmarken. Da hatten wir… auch keine Essensmarken. Manche Dinge ändern sich nie.', en: 'Back in Morocco, we had no food tokens. We had… also no food tokens. Some things never change.' },
    ],
  },
  {
    id: 'annika', name: 'Annika', role: { de: 'Shops', en: 'Shops' }, portrait: '🛍️',
    look: { base: 'f_casual', skin: SKIN.fair, hair: '#6a4424', brows: '#5a3a1e', hairStyle: 'long', hairStyleColor: '#6a4424', hairLength: 0.3, shirt: '#2a8a7a', pants: '#8a3a3a', patchwork: true, shirtPatch: ['#2a8a7a', '#e0a030', '#b8483a'], height: 1.7 },
    behavior: 'wander', home: 'plot_shops', offset: [3, 4], radius: 6,
    lines: [
      { de: 'Jeder Stand braucht Lichterketten. Und Räucherstäbchen. Und noch mehr Lichterketten.', en: 'Every stall needs fairy lights. And incense. And more fairy lights.' },
      { de: 'Ich hab zwölf Händler, drei Stromkabel und null Ahnung, wie das passt. Wird schon!', en: 'I\'ve got twelve vendors, three power cables and zero idea how that fits. It\'ll work out!' },
      { de: 'Kristalle, Pumphosen, Traumfänger. Das Übliche. Und ein Stand mit Socken. Barfuß-Festival. Mutig.', en: 'Crystals, harem pants, dreamcatchers. The usual. And a sock stall. At a barefoot festival. Brave.' },
      { de: 'Wenn die Marktstraße steht, kauf ich mir selbst als Erstes was. Das ist der Deal mit mir selbst.', en: 'Once the market street stands, I\'m the first one to buy something. That\'s my deal with myself.' },
      { de: 'Das Chai-Zelt wollte einen Stand bei mir. Für Chai. Den es nicht gibt.', en: 'The chai tent wanted a stall at mine. For chai. Which doesn\'t exist.' },
    ],
  },
  {
    id: 'julez', name: 'Julez', role: { de: 'Strom & Licht (weiß es besser)', en: 'Power & light (knows better)' }, portrait: '🧐',
    look: { base: 'm_casual', skin: SKIN.fair, hair: '#ead07a', brows: '#c8a85a', hairStyle: 'ponytail', hairStyleColor: '#ead07a', hairLength: 0.55, shirt: '#3a3a3a', pants: '#4a5a3a', shoes: '#2a2018', patchwork: true, shirtPatch: ['#3a3a3a', '#c9b24a', '#2a2a3a'], height: 1.62 },
    behavior: 'wander', home: 'generator', offset: [-3, 2], radius: 5,
    lines: [
      { de: 'Felix, das Kabel liegt falsch. Nein, das andere. Nein, das ANDERE.', en: 'Felix, that cable is wrong. No, the other one. No, the OTHER one.' },
      { de: 'Felix sagt, er hat das Lichtkonzept gemacht. Ich hab es korrigiert. Zwölfmal.', en: 'Felix says he did the lighting concept. I corrected it. Twelve times.' },
      { de: 'Wer hat den Verteiler so hingestellt? …Felix. Natürlich Felix.', en: 'Who put the distributor like that? …Felix. Of course Felix.' },
      { de: 'Das hält. Aber nur, weil ich es nochmal gemacht hab.', en: 'That holds. But only because I redid it.' },
      { de: 'Corni, das ist nicht gerade. Das ist nicht mal schief-gerade.', en: 'Corni, that isn\'t straight. It\'s not even crooked-straight.' },
      { de: 'Matze, du hältst die Wasserwaage falsch rum. Wie geht das überhaupt?', en: 'Matze, you\'re holding the spirit level upside down. How is that even possible?' },
      { de: 'Ich bin nicht klein. Ich bin kompakt. Und ich hab recht.', en: 'I\'m not small. I\'m compact. And I\'m right.' },
      { de: 'Wie du das trägst… kann man so machen. Ist halt falsch. Hab ich von Felix. Der macht\'s auch falsch.', en: 'The way you carry that… you could do it like that. It\'s just wrong. Got that from Felix. He does it wrong too.' },
    ],
  },
  {
    id: 'jules', name: 'Jules', role: { de: 'Packt überall mit an', en: 'Lends a hand everywhere' }, portrait: '🤗',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#e8cc78', brows: '#c8a85a', hairCut: [0.95, 0.5, 0.95], beard: 'moustache', beardColor: '#dcbc68', shirt: '#2a8a7a', pants: '#5a4a3a', patchwork: true, shirtPatch: ['#2a8a7a', '#e0a030', '#2e6b5e'], height: 1.97, width: 1.08 },
    behavior: 'patrol', route: ['base_yard', 'plot_mainstage', 'generator', 'kitchen', 'plot_chai_lounge', 'plot_forest_dome', 'plot_narnia_floor', 'chill'], speed: 1.8,
    lines: [
      { de: 'Hey! Alles gut bei dir? Wenn du was brauchst – ich bin da.', en: 'Hey! You alright? If you need anything – I\'m here.' },
      { de: 'Komm, ich halt mal kurz fest. Du schraubst.', en: 'Come on, I\'ll hold it. You screw.' },
      { de: 'Das hast du richtig gut gemacht. Ehrlich. Hat nur keiner gesagt.', en: 'You did that really well. Honestly. Nobody said it, that\'s all.' },
      { de: 'Julez meint das nicht so. …Doch, meint er schon. Aber er mag dich trotzdem.', en: 'Julez doesn\'t mean it like that. …Okay, he does. But he likes you anyway.' },
      { de: 'Groß sein hat Vorteile: Ich komm an die Lichterketten. Sag Bescheid.', en: 'Being tall has perks: I can reach the fairy lights. Just say.' },
      { de: 'Der Schnauzer? Den hab ich seit der Grundschule. Fast.', en: 'The moustache? Had it since primary school. Almost.' },
      { de: 'Pause machen ist kein Aufgeben. Setz dich kurz, ich hol dir ein Wasser.', en: 'Taking a break isn\'t giving up. Sit down a sec, I\'ll get you a water.' },
    ],
  },
  {
    id: 'leocitas', name: 'Leocitas', role: { de: 'Kreativ, Kunst & Bodypainting', en: 'Creative, art & body painting' }, portrait: '🛹',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#e6cc7a', brows: '#c8a85a', hairStyle: 'long', hairStyleColor: '#e6cc7a', hairLength: 0.62, beard: 'short', beardColor: '#dcbc68', shirt: '#9b3d8a', pants: '#2e6b5e', patchwork: true, shirtPatch: ['#9b3d8a', '#2a8a7a', '#e0a030'], height: 2.02, width: 0.86, extras: ['pennyboard'] },
    behavior: 'wander', home: 'festival_random', roam: 'festival_random', radius: 14,
    lines: [
      { de: 'Es freut, dich zu sehen. Hat der Wanderer schon gegessen? Es sei Zeit, kurz zu sitzen.', en: 'Rejoiced to see you. Has the wanderer eaten yet? Let it be a moment to sit.' },
      { de: 'Hier werden grad Gesichter gemalt. Es sei Spiel, es sei Freude. Mag der Wanderer auch eins?', en: 'Faces are being painted right now. Let it be play, let it be joy. Does the wanderer want one too?' },
      { de: 'Barfuß auf der Wiese, Brett unterm Arm, Pinsel in der Hand. Damit ist alles da, was es braucht.', en: 'Barefoot on the meadow, board under the arm, brush in the hand. That is everything that is needed.' },
      { de: 'Es sei alles gut. Der Aufbau wird fertig, wenn er fertig wird, heißt es hier.', en: 'Let all be well. The build-up finishes when it finishes, it is said here.' },
      { de: 'Es lädt ein: Spür die Erde unter den Füßen. Ja, genau so. Und dann weiter, Kisten tragen.', en: 'An invitation: feel the earth beneath your feet. Yes, just so. And then onward, carrying crates.' },
      { de: 'Fallen gehört dazu, auch auf dem Brett. Es wird aufgestanden, gelacht und weitergerollt.', en: 'Falling belongs to it, even on the board. One rises, laughs and rolls on.' },
      { de: 'Es spürt sich: Farbe macht Menschen sanfter. Eine Studie braucht es dafür nie, das Herz weiß es.', en: 'It is felt: colour makes people gentler. A study is never needed, the heart knows.' },
      { de: 'Es sei gesegnet, dass alle hier sind. Das Wichtigste überhaupt, findet sich hier.', en: 'Blessed be that all are here. The most important thing of all, is found here.' },
    ],
  },
  {
    id: 'aylien', name: 'Aylien', role: { de: 'Gute Laune & Seelsorge', en: 'Good vibes & moral support' }, portrait: '🫶',
    look: { base: 'f_casual', skin: '#dcac80', hair: '#0a0808', brows: '#0a0808', hairStyle: 'curly', hairStyleColor: '#0a0808', hairLength: 0.52, shirt: '#e0a030', pants: '#7a4a8a', patchwork: true, shirtPatch: ['#e0a030', '#b8483a', '#2a8a7a'], height: 1.68 },
    behavior: 'patrol', route: ['chill', 'plot_mainstage', 'kitchen', 'plot_hammocks', 'plot_chai_lounge', 'base_yard', 'plot_narnia_floor', 'plot_firespace', 'plot_awareness', 'plot_biergarten', 'plot_entrance'], speed: 2.3,
    lines: [
      { de: 'Hey du! Komm her, Umarmung. Keine Widerrede.', en: 'Hey you! Come here, hug. No arguments.' },
      { de: 'Du machst das richtig gut, weißt du das? Sag ich nicht nur so.', en: 'You\'re doing really well, you know that? I\'m not just saying it.' },
      { de: 'Ich war heute schon überall. ÜBERALL. Und überall waren tolle Menschen.', en: 'I\'ve been everywhere today. EVERYWHERE. And everywhere there were lovely people.' },
      { de: 'Atme mal kurz durch. Ein… und aus. Siehst du? Schon besser.', en: 'Take a breath. In… and out. See? Better already.' },
      { de: 'Matze hat geweint, weil er seinen Plan verloren hat. Jetzt lacht er wieder. Gern geschehen.', en: 'Matze cried because he lost his plan. Now he\'s laughing again. You\'re welcome.' },
      { de: 'Ich hab Mia gesagt, dass sie toll ist. Sie hat fast aufgehört, fest zu lächeln.', en: 'I told Mia she\'s great. She almost stopped smiling so firmly.' },
      { de: 'Wenn\'s dir zu viel wird: Hängemattenwald, Chai, oder ich. Am besten alle drei.', en: 'If it gets too much: hammock forest, chai, or me. Ideally all three.' },
    ],
  },
  {
    id: 'leon', name: 'Leon', role: { de: 'DJ Stillbendana – Hype & Beats', en: 'DJ Stillbendana – hype & beats' }, portrait: '🎧',
    look: { base: 'm_hoodie', skin: SKIN.light, hair: '#8a6a3a', brows: '#6a4e2a', hairCut: [0.95, 0.4, 0.95], shirt: '#c8683a', pants: '#3a3a4a', patchwork: true, shirtPatch: ['#c8683a', '#2a8a7a', '#e0a030'], height: 1.78, width: 0.98 },
    behavior: 'wander', home: 'festival_random', roam: 'festival_random', radius: 14,
    lines: [
      { de: 'Yo! Was geht, Chef? Heut wird das richtig, richtig geil!', en: 'Yo! What\'s up, boss? Today\'s gonna be sick!' },
      { de: 'Ich leg später auf. Hip-Hop zum Aufwärmen, dann Techno bis die Sonne aufgeht. Du kommst, ne?', en: 'I\'m playing later. Hip-hop to warm up, then techno till sunrise. You\'re coming, right?' },
      { de: 'Kisten tragen? Ich trag dich moralisch. Das zählt auch! Los, du packst das!', en: 'Carrying crates? I\'m carrying you morally. That counts too! Go, you got this!' },
      { de: 'Stillbendana, so heiß ich auf dem Plakat. Bandana vibes, du verstehst.', en: 'Stillbendana, that\'s my name on the poster. Bandana vibes, you know.' },
      { de: 'Boom bap am Morgen, vier-to-the-floor am Abend. Das ist mein Aufbau-Rhythmus.', en: 'Boom bap in the morning, four-to-the-floor at night. That\'s my build-up rhythm.' },
      { de: 'Hab gerade nen Beat im Kopf. Warte… nee, war nur der Generator. Trotzdem Bass!', en: 'Got a beat in my head. Wait… nah, that was the generator. Still bass!' },
      { de: 'Alle zusammen, jetzt: Aufbau! Aufbau! Aufbau! …Wo geht\'s zur Soundanlage?', en: 'Everybody now: build-up! Build-up! Build-up! …Where\'s the sound system?' },
    ],
  },
];

// ------------------------------------------------------------------ random campers
// Extra hippies arrive as the build progresses (NPCManager.setCrowd).
const CAMPER_NAMES = ['Luna', 'Shiva', 'Kai', 'Nomi', 'Baba', 'Sunny', 'Mo', 'Tara', 'Pixie', 'Rumi', 'Juju', 'Zappa', 'Indra', 'Ollo', 'Fee', 'Surya', 'Mika', 'Yogi', 'Kiki', 'Balu', 'Lenni', 'Mira', 'Tobi', 'Jojo', 'Sina', 'Basti', 'Paula', 'Ben', 'Marie', 'Chris', 'Ronja', 'Paule', 'Nele', 'Timo', 'Anni', 'Flocke'];
const CAMPER_LINES = [
  { de: 'Namaste, Bruder!', en: 'Namaste, brother!' },
  { de: 'Hast du Tape? Irgendein Tape?', en: 'Got tape? Any tape?' },
  { de: 'Wo gibt\'s hier Chai?', en: 'Where\'s the chai around here?' },
  { de: 'Ich bin zum Helfen hier. Und zum Tanzen. Hauptsächlich zum Tanzen.', en: 'I\'m here to help. And to dance. Mostly to dance.' },
  { de: 'Barfuß ist das neue Schuhwerk.', en: 'Barefoot is the new footwear.' },
  { de: 'Om.', en: 'Om.' },
  { de: 'Die Energie hier ist krass, oder?', en: 'The energy here is intense, right?' },
  { de: 'Hat jemand Leo gesehen? Nein? Normal.', en: 'Anyone seen Leo? No? Normal.' },
  { de: 'Ich hab mein Zelt verloren. Es ist lila. Glaub ich.', en: 'I lost my tent. It\'s purple. I think.' },
];

// Running gag: half the volunteers are "chai crew". The chai tent never gets finished.
export const CHAI_CREW_LINES = [
  { de: 'Ich bin beim Chai-Zelt. Wir sind vierzig Leute. Das Zelt ist… in Planung.', en: 'I\'m on the chai tent. There are forty of us. The tent is… in planning.' },
  { de: 'Heute haben wir am Chai-Zelt richtig viel geschafft. Wir haben besprochen, wo die Kissen hinkommen.', en: 'We got so much done at the chai tent today. We discussed where the cushions go.' },
  { de: 'Chai-Crew! Wir bauen gerade die Vision. Das Zelt kommt dann später.', en: 'Chai crew! We\'re building the vision right now. The tent comes later.' },
  { de: 'Ich hab heute drei Stunden am Chai-Zelt gearbeitet. Also, ich war dort. Es war sehr intensiv.', en: 'I worked three hours at the chai tent today. Well, I was there. It was very intense.' },
  { de: 'Wir haben das Chai-Zelt einmal aufgebaut und wieder abgebaut. Die Energie hat nicht gestimmt.', en: 'We put the chai tent up once and took it down again. The energy wasn\'t right.' },
  { de: 'Bei uns am Chai ist immer was los! Was genau, weiß keiner.', en: 'There\'s always something going on at the chai! Nobody knows what exactly.' },
  { de: 'Silke sagt, morgen steht das Chai-Zelt. Silke sagt das seit Montag.', en: 'Silke says the chai tent will be up tomorrow. She\'s been saying that since Monday.' },
  { de: 'Ich muss wieder rüber zum Chai. Die brauchen mich da. Glaub ich.', en: 'I need to get back to the chai. They need me there. I think.' },
  { de: 'Fünfzehn Leute, ein Hering. Chai-Crew-Workflow.', en: 'Fifteen people, one tent peg. Chai crew workflow.' },
  { de: 'Wir machen jetzt erstmal eine Chai-Pause. Vom Chai-Zelt-Aufbau. Ohne Chai-Zelt.', en: 'Time for a chai break. From building the chai tent. Without a chai tent.' },
  { de: 'Ich bin für die Kissen zuständig. Die Kissen sind bereit. Nur das Zelt nicht.', en: 'I\'m in charge of cushions. The cushions are ready. The tent isn\'t.' },
];

// Running gag: nobody knows where the food & drink tokens come from. Every volunteer asks.
export const TOKEN_LINES = [
  { de: 'Weißt du, wo es Essensmarken gibt?', en: 'Do you know where to get food tokens?' },
  { de: 'Wer verteilt eigentlich die Getränkemarken? Irgendwer muss die doch haben!', en: 'Who actually hands out the drink tokens? Somebody must have them!' },
  { de: 'Ich hab gehört, es gibt Marken. Hast du schon mal eine gesehen? In echt?', en: 'I heard there are tokens. Have you ever seen one? For real?' },
  { de: 'Jan sagt, Leo hat die Marken. Leo hab ich noch nie gesehen.', en: 'Jan says Leo has the tokens. I\'ve never seen Leo.' },
  { de: 'Gibt\'s die Essensmarken im Büro? Oder im Hühnercontainer? Oder… gibt es sie überhaupt?', en: 'Are the food tokens in the office? Or in the chicken container? Or… do they even exist?' },
  { de: 'Hast du \'ne Marke für mich? Nur eine. Für ein Wasser.', en: 'Got a token for me? Just one. For a water.' },
  { de: 'Ich arbeite hier seit drei Tagen und hab noch keine einzige Marke gesehen.', en: 'I\'ve worked here for three days and haven\'t seen a single token.' },
  { de: 'Sabse will eine Essensmarke sehen. WO GIBT ES DIE?!', en: 'Sabse wants to see a food token. WHERE DO YOU GET THEM?!' },
];

// Second running gag: the special nut for the construction fences that nobody can find.
export const NUT_LINES = [
  { de: 'Hast du die Spezial-Nuss für die Bauzäune gesehen?', en: 'Have you seen the special nut for the construction fences?' },
  { de: 'Ohne die Spezial-Nuss hält der Bauzaun nicht. Wer hat die Spezial-Nuss?!', en: 'Without the special nut the fence won\'t hold. Who has the special nut?!' },
  { de: 'Die Spezial-Nuss… Fabi sagt Künstlergasse. Im Künstlergasse-Container ist sie nicht. Sie ist nirgends.', en: 'The special nut… Fabi says Künstlergasse. It\'s not in the Künstlergasse container. It\'s nowhere.' },
];

// camper index → [seat, look-at] – they sit in Matze's cabin or at the beer benches in the Aufenthaltszelt
const HANGOUTS = {
  1: ['matze_seat1', 'matze_face'], 2: ['tent_seat1', 'tent_table1'], 4: ['tent_seat2', 'tent_table1'],
  5: ['matze_seat2', 'matze_face'], 8: ['tent_seat3', 'tent_table2'], 11: ['tent_seat5', 'tent_table3'], 14: ['tent_seat4', 'tent_table2'],
};

export function makeCamper(i, rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const persona = VOLUNTEERS[i % VOLUNTEERS.length];
  const female = persona.f;
  const skin = pick([SKIN.light, SKIN.fair, SKIN.tan, SKIN.tan, SKIN.dark]);
  const hairCol = pick(['#1a120c', '#5a3a1e', '#a8864a', '#e3c46a', '#b0402a', '#2a8a7a', '#8a3a9a']);
  const shirt = pick(HIPPIE_SHIRTS), pants = pick(HIPPIE_PANTS);
  return {
    id: `camper_${i}`, name: persona.name + (i >= VOLUNTEERS.length ? ` ${Math.floor(i / VOLUNTEERS.length) + 1}` : ''), role: persona.role, portrait: '🌀',
    look: {
      base: female ? pick(['f_casual', 'f_formal']) : pick(['m_adventurer', 'm_punk', 'm_casual', 'm_hoodie']),
      backpack: rng() < 0.3 ? undefined : false,
      skin, hair: hairCol, shirt, pants, patchwork: true,
      shirtPatch: [shirt, pick(HIPPIE_SHIRTS), pick(HIPPIE_PANTS)], pantsPatch: [pants, pick(HIPPIE_PANTS), pick(HIPPIE_SHIRTS)],
      hairStyle: pick(['dreads', 'dreads', 'long', 'bun', 'mohawk', null]), hairStyleColor: hairCol, beads: rng() < 0.5,
      headband: rng() < 0.35 ? pick(['#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c']) : null,
      extras: rng() < 0.3 ? ['scarf'] : [], scarf: pick(HIPPIE_SHIRTS),
      height: female ? 1.65 + rng() * 0.12 : 1.72 + rng() * 0.16,
    },
    ...(HANGOUTS[i] ? { behavior: 'sitter', home: HANGOUTS[i][0], face: HANGOUTS[i][1] }
      : i % 2 ? { behavior: 'wander', home: 'camp_random', roam: 'camp_random', radius: 10 }
      : i % 4 === 0 ? { behavior: 'builder', home: 'plot_chai_lounge', radius: 7 } // the chai site is always busy
      : { behavior: 'wander', home: 'festival_random', roam: 'festival_random', radius: 14 }), // half of them hang out on the festival ground
    // half of all volunteers are chai crew – and they love talking about it
    ...(i % 2 === 0 ? { role: { de: `${persona.role.de} · Chai-Crew`, en: `${persona.role.en} · chai crew` }, chaiCrew: true } : {}),
    lines: [...persona.lines, pick(CAMPER_LINES), ...(i % 2 === 0 ? [pick(CHAI_CREW_LINES), pick(CHAI_CREW_LINES)] : [])],
    tokenAsker: rng() < 0.6, // most (not all) keep asking about food/drink tokens
  };
}

/** The player's look — a fresh goa hippie volunteer. */
export const PLAYER_LOOK = {
  base: 'm_adventurer', backpack: false, skin: SKIN.light, hair: '#6a4424',
  shirt: '#d98c2b', shirt2: '#9b3d8a', pants: '#2e6b5e', patchwork: true,
  shirtPatch: ['#d98c2b', '#9b3d8a', '#c9b24a'], pantsPatch: ['#2e6b5e', '#7a4a8a', '#8a6a4a'],
  hairStyle: 'dreads', hairStyleColor: '#6a4424', beads: true,
};
