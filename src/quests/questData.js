// ============================================================================
//  QUESTS — all content is data. To add a quest, append an object to QUESTS.
//  Every text is { de, en } (German is the default language).
// ============================================================================
//
//  id        unique id
//  title     shown in the tracker / quest log
//  giver     NPC id that offers it (a yellow "!" appears over their head)
//  requires  quest ids that must be completed first
//  offer     dialog lines shown before Accept / Decline  [{ who, text }]
//  steps     executed in order. Step types:
//
//    { type: 'talk',    npc, text, dialog: [{who,text}] }
//    { type: 'reach',   text, at, radius, dialog? }        – go somewhere (dialog plays on arrival)
//    { type: 'pickup',  text, items: [{ item, at, search? }] }
//          item   – id from items/itemData.js (heavy items need the Radlader)
//          at     – spot name (World.spots)
//          search – optional radius: only a search area is shown
//    { type: 'deliver', text, items, plot | at, radius?, buildTime?, buildLabel?,
//          build: { id, type, plot, rotation?, params? } }
//    { type: 'work',    text, targets: [spots], workTime, label, progress }
//          – do a job at every target (e.g. rig each post); `progress` drives visuals
//    { type: 'fuel',    text, vehicle, items }             – fill a vehicle's tank
//    { type: 'night',   text }                             – wait for the night to fall
//
//  Money: build.cost (paid when built), work.costEach (paid per target).
//  Timed jobs: work.timeLimit (seconds) + dusk: true → it gets dark while you work.
//
//  reward    { karma }
//  outro     optional dialog after completion
//  Speaker "who" may be an NPC id or 'you'.
// ============================================================================

export const QUESTS = [
  // ------------------------------------------------------------------ 0 — Anmeldung & "wo ist Leo?"
  {
    id: 'q0_leo',
    title: { de: 'Wo ist Leo?', en: 'Where is Leo?' },
    giver: 'jan',
    day: 1,
    requires: [],
    summary: { de: 'Anmelden bei Jan, dann Leo finden. Leo hat deine Aufgaben. Theoretisch.', en: 'Register with Jan, then find Leo. Leo has your tasks. Theoretically.' },
    offer: [
      { who: 'jan', text: { de: 'Ah, frisches Blut! Anmeldung. Name? …Ich schreib einfach „Neuer“. Tätigkeit? „Alles“. Lieblings-Dixi? Überspringen wir.', en: 'Ah, fresh blood! Registration. Name? …I\'ll just write "new one". Job? "Everything". Favourite portaloo? Let\'s skip that.' } },
      { who: 'jan', text: { de: 'Hier dein Bändchen. Wasserdicht, feuerfest, Leo-sicher. Und 25 Karma Startguthaben – gib nicht alles für Bier aus. Deine Aufgaben kriegst du von Leo, der leitet den Aufbau.', en: 'Here\'s your wristband. Waterproof, fireproof, Leo-proof. And 25 karma to start with – don\'t spend it all on beer. Leo gives you your tasks, he runs the build.' } },
      { who: 'jan', text: { de: 'Leo war grad noch vorne am Einlass. Oder in der Küche. Oder an der Mainstage. Oder… naja. Viel Glück.', en: 'Leo was just at the front gate. Or in the kitchen. Or at the mainstage. Or… well. Good luck.' } },
    ],
    accept: { de: 'Ich find ihn schon!', en: 'I\'ll find him!' },
    decline: { de: 'Erst mal ankommen.', en: 'Let me settle in first.' },
    steps: [
      {
        type: 'reach', at: 'registration', radius: 3, text: { de: 'Such Leo am Einlass-Tisch vorne am Tor', en: 'Look for Leo at the gate desk' },
        dialog: [{ who: 'you', text: { de: '*Ein Zettel auf dem Tisch:* „Bin gleich zurück! – Leo“. Der Kaffee daneben ist kalt. Sehr kalt.', en: '*A note on the desk:* "Be right back! – Leo". The coffee next to it is cold. Very cold.' } }],
      },
      {
        type: 'reach', at: 'kitchen', radius: 7, text: { de: 'Frag in der Küche nach Leo', en: 'Ask about Leo in the kitchen' },
        dialog: [
          { who: 'sabse', text: { de: 'Leo? War grad hier. Hat Kaffee geklaut und ist weg. Und DU: nicht rennen in meiner Küche, klar?!', en: 'Leo? Was just here. Stole coffee and left. And YOU: no running in my kitchen, got it?!' } },
          { who: 'franzi', text: { de: 'Hi! Ich bin Franzi, Awareness. Wenn was ist – egal was – komm zu mir. Leo wollte zur Mainstage, glaub ich.', en: 'Hi! I\'m Franzi, awareness. If anything happens – anything – come to me. Leo was heading to the mainstage, I think.' } },
          { who: 'sabse', text: { de: 'Und jetzt raus hier.', en: 'And now out.' } },
        ],
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Such Leo an der Mainstage', en: 'Look for Leo at the mainstage' },
        dialog: [
          { who: 'corni', text: { de: 'Leo? Leo findet man nicht. Leo findet dich. Meistens dann, wenn\'s gerade schlecht passt.', en: 'Leo? You don\'t find Leo. Leo finds you. Usually when it\'s inconvenient.' } },
          { who: 'corni', text: { de: 'Ich bin Corni, ich mach den Bau. Du siehst motiviert aus. Ich hab Arbeit für dich — komm nochmal her, wenn du bereit bist.', en: 'I\'m Corni, I handle construction. You look motivated. I\'ve got work for you — come back when you\'re ready.' } },
        ],
      },
    ],
    reward: { karma: 10 },
  },

  // ------------------------------------------------------------------ 1a — the posts (and the earth auger odyssey)
  {
    id: 'q1a_posts',
    title: { de: 'Löcher im Acker', en: 'Holes in the Field' },
    giver: 'corni',
    day: 1,
    requires: ['q0_leo'],
    summary: { de: 'Die sechs Pfosten der Mainstage müssen in den Boden. Dafür braucht es einen Erdbohrer. Einen funktionierenden.', en: 'The six mainstage posts need to go into the ground. That takes an earth auger. A working one.' },
    offer: [
      { who: 'corni', text: { de: 'Siehst du den Drachen? Der steht schon. Der ist der einfache Teil.', en: 'See the dragon? It\'s already standing. That\'s the easy part.' } },
      { who: 'corni', text: { de: 'Um die Tanzfläche kommen sechs Pfosten. Die tragen später die Stahlseile und die Sonnensegel. Aber erst brauchen wir Löcher.', en: 'Six posts go around the dance floor. Later they carry the steel wires and the shade sails. But first we need holes.' } },
      { who: 'corni', text: { de: 'Der Erdbohrer liegt in der Werkstatt. Glaub ich. Hol ihn und fang beim ersten Pfosten-Punkt an.', en: 'The earth auger is in the workshop. I think. Get it and start at the first post spot.' } },
    ],
    accept: { de: 'Ich bohr das!', en: 'I\'ll drill it!' },
    decline: { de: 'Gleich, nach dem Chai.', en: 'Right after chai.' },
    steps: [
      { type: 'pickup', text: { de: 'Such den Erdbohrer in der Werkstatt', en: 'Find the earth auger in the workshop' }, items: [{ item: 'auger_old', at: 'werkstatt_inside' }] },
      {
        type: 'work', text: { de: 'Bohr das erste Loch am ersten Pfosten-Punkt', en: 'Drill the first hole at the first post spot' },
        targets: ['post_1'], workTime: 2.5, label: { de: 'Loch bohren', en: 'Drill hole' }, consumes: ['auger_old'],
        doneDialog: [
          { who: 'you', text: { de: '*zieht am Seil* Brrrm… brrm… *plopp*. Zehn Zentimeter tief, dann stirbt der Motor ab. Und springt nie wieder an.', en: '*pulls the cord* Brrrm… brrm… *pop*. Ten centimetres deep, then the engine dies. And never starts again.' } },
          { who: 'corni', text: { de: 'Ah. DER. Der ist seit 2019 kaputt. Okay, ich fahr schnell zum Baumarkt und hol einen neuen. Nicht weglaufen.', en: 'Ah. THAT one. It\'s been broken since 2019. Okay, I\'ll quickly drive to the DIY store and get a new one. Don\'t run off.' } },
        ],
      },
      {
        type: 'wait', seconds: 25, away: ['corni'], cost: 690, costReason: { de: 'Neuer Erdbohrer (Baumarkt)', en: 'New earth auger (DIY store)' },
        text: { de: 'Corni ist beim Baumarkt…', en: 'Corni is at the DIY store…' },
        doneText: { de: '🚗 Corni ist zurück und hat den neuen Erdbohrer gleich an die Mainstage gelegt. (−690 €)', en: '🚗 Corni is back and dropped the new auger right at the mainstage. (−€690)' },
      },
      { type: 'pickup', text: { de: 'Hol den neuen Erdbohrer an der Mainstage', en: 'Get the new auger at the mainstage' }, items: [{ item: 'auger_new', at: 'stage_front' }] },
      {
        type: 'work', text: { de: 'Bohr die Löcher und stell alle 6 Pfosten', en: 'Drill the holes and set all 6 posts' },
        targets: ['post_1', 'post_2', 'post_3', 'post_4', 'post_5', 'post_6'], workTime: 3, progress: 'posts', costEach: 120,
        label: { de: 'Loch bohren & Pfosten setzen', en: 'Drill hole & set post' }, consumes: ['auger_new'],
        minigame: 'mash', minigameTitle: { de: 'Bohren! Bohren! BOHREN!', en: 'Drill! Drill! DRILL!' }, minigameOpts: { need: 12, time: 4.5 },
        minigameFail: { de: 'Der Bohrer hängt im Lehm fest. Nochmal, mit Gefühl. Und Kraft.', en: 'The auger is stuck in the clay. Again, with feeling. And force.' },
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Melde dich bei Corni', en: 'Report to Corni' },
        dialog: [
          { who: 'corni', text: { de: 'Stehen! Alle sechs! Gerade? …Gerade genug. Jetzt kommen die Stahlseile.', en: 'They stand! All six! Straight? …Straight enough. Now the steel wires.' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },

  // ------------------------------------------------------------------ 1 — Rigging the dragon
  {
    id: 'q1_rigging',
    title: { de: 'Drachen-Rigging', en: 'Rigging the Dragon' },
    giver: 'corni',
    day: 1,
    requires: ['q1a_posts'],
    summary: { de: 'Stahlseile zwischen die 6 Pfosten der Mainstage spannen. Fabi weiß, wo das Material ist. Ob es noch taugt, weiß keiner.', en: 'Rig steel wires between the 6 mainstage posts. Fabi knows where the gear is. Whether it\'s still any good, nobody knows.' },
    offer: [
      { who: 'corni', text: { de: 'Jetzt die Stahlseile. Die tragen später die Sonnensegel. Erst die Seile, dann die Deko. NIE andersrum.', en: 'Now the steel wires. They carry the shade sails later. Wires first, then deco. NEVER the other way round.' } },
      { who: 'corni', text: { de: 'Material hat Fabi. Also, Fabi weiß wo. Frag Fabi in der Crew-Base.', en: 'Fabi has the gear. Well, Fabi knows where. Ask Fabi at the crew base.' } },
    ],
    accept: { de: 'Ich spann das!', en: 'I\'ll rig it!' },
    decline: { de: 'Gleich, nach dem Chai.', en: 'Right after chai.' },
    steps: [
      {
        type: 'talk', npc: 'fabi', text: { de: 'Frag Fabi nach Stahlseilen', en: 'Ask Fabi about steel wires' },
        dialog: [
          { who: 'fabi', text: { de: 'Stahlseile? Künstlergasse-Container, unter den Kabeltrommeln. Die Schäkel hat sich Mathias ausgeliehen – liegen gleich daneben. Wahrscheinlich.', en: 'Steel wires? Künstlergasse container, under the cable drums. Mathias borrowed the shackles – they\'re right next to it. Probably.' } },
          { who: 'fabi', text: { de: 'Die Seile sind vom letzten Jahr. Oder vorletzten. Die sind bestimmt noch gut.', en: 'The wires are from last year. Or the year before. I\'m sure they\'re still fine.' } },
        ],
      },
      {
        type: 'pickup', text: { de: 'Hol die Stahlseile und die Schäkel am Künstlergasse-Container', en: 'Get the steel wires and the shackles at the Künstlergasse container' },
        items: [{ item: 'steel_wire_rusty', at: 'kuenstler_front' }, { item: 'shackles', at: 'kuenstler_front' }],
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Zeig Corni die Stahlseile', en: 'Show Corni the steel wires' }, consumes: ['steel_wire_rusty'],
        dialog: [
          { who: 'corni', text: { de: 'Zeig mal. …Die sind ja komplett VERROSTET. Damit hängen wir keinen Drachen auf. Und keine Menschen drunter.', en: 'Let me see. …They\'re completely RUSTED. We\'re not hanging a dragon on those. Or having people underneath.' } },
          { who: 'leo', text: { de: 'Baumarkt? Ich fahr mit! Ich fahr mit! …Corni, du hast den Schlüssel, oder?', en: 'DIY store? I\'m coming! I\'m coming! …Corni, you\'ve got the keys, right?' } },
          { who: 'corni', text: { de: 'Leo?! Wo kommst DU denn her? …Egal. Wir fahren. Du wartest hier. Und fass nix an.', en: 'Leo?! Where did YOU come from? …Whatever. We\'re going. You wait here. And don\'t touch anything.' } },
        ],
      },
      {
        type: 'wait', seconds: 30, away: ['corni', 'leo'], cost: 1480, costReason: { de: 'Neue Stahlseile (Baumarkt)', en: 'New steel wires (DIY store)' },
        text: { de: 'Leo und Corni sind beim Baumarkt…', en: 'Leo and Corni are at the DIY store…' },
        doneText: { de: '🚗 Corni ist zurück (Leo ist schon wieder weg). Die neuen Stahlseile liegen an der Mainstage. (−1.480 €)', en: '🚗 Corni is back (Leo is already gone again). The new steel wires are at the mainstage. (−€1,480)' },
      },
      { type: 'pickup', text: { de: 'Hol die neuen Stahlseile an der Mainstage', en: 'Get the new steel wires at the mainstage' }, items: [{ item: 'steel_wire', at: 'stage_front' }] },
      {
        type: 'work', text: { de: 'Spann die Stahlseile an allen 6 Pfosten', en: 'Rig the steel wires on all 6 posts' },
        targets: ['post_1', 'post_2', 'post_3', 'post_4', 'post_5', 'post_6'], workTime: 2.5, progress: 'rig',
        label: { de: 'Stahlseil spannen', en: 'Tension steel wire' },
        minigame: 'timing', minigameTitle: { de: 'Spannen – genau jetzt!', en: 'Tension – right now!' }, minigameOpts: { speed: 1.2, zone: 0.2 },
        minigameFail: { de: 'Zu locker! Corni guckt schon. Nochmal.', en: 'Too slack! Corni is watching. Again.' },
        consumes: ['steel_wire', 'shackles'], costEach: 380,
      },
      {
        type: 'talk', npc: 'juli', text: { de: 'Lass Juli die Seile prüfen', en: 'Let Juli check the rigging' },
        dialog: [
          { who: 'juli', text: { de: 'Hm. Falsch. Falsch. Falsch. …Das geht. Den mach ich neu.', en: 'Hm. Wrong. Wrong. Wrong. …That one\'s fine. I\'ll redo this one.' } },
          { who: 'juli', text: { de: 'Fertig. Wie immer ich. Geh zu Corni.', en: 'Done. Me, as always. Go to Corni.' } },
        ],
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Melde dich bei Corni', en: 'Report to Corni' },
        dialog: [
          { who: 'corni', text: { de: 'Hält! Juli hat nur die Hälfte neu gemacht, das ist quasi ein Kompliment.', en: 'It holds! Juli only redid half of it, that\'s basically a compliment.' } },
          { who: 'corni', text: { de: 'Matze kümmert sich um die Sonnensegel. Hilf ihm. Er… braucht Hilfe.', en: 'Matze is on the shade sails. Help him. He… needs help.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ 2 — Shade sails via Radlader
  {
    id: 'q2_sails',
    title: { de: 'Sonnensegel & Diesel', en: 'Shade Sails & Diesel' },
    giver: 'matze',
    day: 1,
    requires: ['q1_rigging'],
    summary: { de: 'Die Sonnensegel sind schwer. Radlader tanken, Kiste holen, an den Seilen aufhängen.', en: 'The shade sails are heavy. Fuel the wheel loader, fetch the crate, hang them on the wires.' },
    offer: [
      { who: 'matze', text: { de: 'Hi! Du bist… der Neue? Ich bin Matze. Ich mach die… Moment… genau, die Sonnensegel!', en: 'Hi! You\'re… the new one? I\'m Matze. I do the… wait… right, the shade sails!' } },
      { who: 'matze', text: { de: 'Die Kiste war ganz hinten im Hühnercontainer. Jetzt steht sie davor, bei den Hühnern. Irgendwie. Die ist aber zu schwer zum Tragen, da brauchen wir den Radlader.', en: 'The crate was at the back of the chicken container. Now it\'s standing in front of it, next to the chickens. Somehow. It\'s too heavy to carry, we need the wheel loader.' } },
      { who: 'matze', text: { de: 'Der Radlader hat keinen Diesel. Oder doch? …Nein. Fabi weiß, wo Kanister sind.', en: 'The wheel loader has no diesel. Or does it? …No. Fabi knows where the canisters are.' } },
    ],
    accept: { de: 'Ich fahr Radlader!', en: 'I\'ll drive the loader!' },
    decline: { de: 'Später, Matze.', en: 'Later, Matze.' },
    steps: [
      {
        type: 'talk', npc: 'fabi', text: { de: 'Frag Fabi nach Diesel', en: 'Ask Fabi about diesel' },
        dialog: [
          { who: 'fabi', text: { de: 'Diesel? Kanister steht beim Pickup, vorne am Tor. Der große Tank steht beim Generator — damit kannst du später nachtanken.', en: 'Diesel? A canister is by the pickup, near the gate. The big tank is next to the generator — use it to refuel later.' } },
        ],
      },
      { type: 'pickup', text: { de: 'Hol den Dieselkanister', en: 'Get the diesel canister' }, items: [{ item: 'diesel_can', at: 'diesel_spot' }] },
      { type: 'fuel', vehicle: 'radlader', items: ['diesel_can'], text: { de: 'Tank den Radlader auf', en: 'Fuel the wheel loader' } },
      { type: 'pickup', text: { de: 'Lade die Sonnensegel-Kiste mit dem Radlader auf', en: 'Load the shade-sail crate with the wheel loader' }, items: [{ item: 'sail_crate', at: 'C4_front' }] },
      {
        type: 'deliver', text: { de: 'Bring die Kiste zur Mainstage und häng die Segel auf', en: 'Bring the crate to the mainstage and hang the sails' },
        items: ['sail_crate'], plot: 'mainstage', radius: 20, buildTime: 5,
        buildLabel: { de: 'Sonnensegel aufhängen', en: 'Hang the shade sails' },
        build: { id: 'shade_sails', type: 'shade_sails', plot: 'mainstage', cost: 6400 },
      },
      {
        type: 'talk', npc: 'matze', text: { de: 'Zeig Matze die Segel', en: 'Show Matze the sails' },
        dialog: [
          { who: 'matze', text: { de: 'Woah. WOAH. Die hängen ja! Hab ich die bestellt? Ich glaub ich hab die bestellt.', en: 'Whoa. WHOA. They\'re up! Did I order these? I think I ordered these.' } },
          { who: 'matze', text: { de: 'Corni sagt, wir brauchen noch Klos. Also… ich glaub, das war Corni.', en: 'Corni says we still need toilets. Well… I think that was Corni.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ 3 — Toilets (Dixis + WC container)
  {
    id: 'q3_toilets',
    title: { de: 'Kein Festival ohne Klo', en: 'No Festival Without Toilets' },
    giver: 'corni',
    day: 2,
    requires: ['q2_sails'],
    summary: { de: 'Zwei Dixi-Paletten vom Crew-Camp mit dem Radlader aufs Gelände bringen. Der Klowagen wird geliefert – dann die Kackepumpe anschließen.', en: 'Bring two Dixi pallets from the crew camp onto the site with the loader. The toilet trailer gets delivered – then connect the poo pump.' },
    offer: [
      { who: 'corni', text: { de: 'Wichtigste Infrastruktur auf jedem Festival? Genau: Klos. Nicht die Bühne. Die Klos.', en: 'Most important infrastructure at any festival? Exactly: toilets. Not the stage. Toilets.' } },
      { who: 'corni', text: { de: 'Die Dixis wurden vorne am Crew-Camp angeliefert, auf zwei Paletten. Die müssen mit dem Radlader nach hinten aufs Gelände.', en: 'The Dixis were delivered at the front of the crew camp, on two pallets. They need to go back onto the site with the loader.' } },
      { who: 'corni', text: { de: 'Der Klowagen kommt heute noch, der Fahrer stellt ihn direkt aufs Gelände. Dann musst du nur noch die Hebepumpe anschließen. Wir sagen Kackepumpe. Juli prüft das.', en: 'The toilet trailer arrives today, the driver puts it straight onto the site. Then you just connect the lifting pump. We call it the poo pump. Juli checks it.' } },
    ],
    accept: { de: 'Klo-Mission, los!', en: 'Toilet mission, go!' },
    decline: { de: 'Muss erst mal selbst.', en: 'Need to go first myself.' },
    steps: [
      { type: 'pickup', text: { de: 'Lade die erste Dixi-Palette vorne am Crew-Camp auf (Radlader)', en: 'Load the first Dixi pallet at the front of the crew camp (loader)' }, items: [{ item: 'dixi_pallet_1', at: 'dixi_delivery' }] },
      {
        type: 'deliver', text: { de: 'Stell die Dixis am Nordzaun auf', en: 'Set up the Dixis at the north fence' },
        items: ['dixi_pallet_1'], at: 'dixi_row_1', radius: 9, buildTime: 3,
        buildLabel: { de: 'Dixis aufstellen', en: 'Set up Dixis' },
        build: { id: 'dixis_1', type: 'dixi_row', at: 'dixi_row_1_pos', rotation: 0.17, params: { n: 6 }, cost: 1900 },
      },
      { type: 'pickup', text: { de: 'Hol die zweite Dixi-Palette am Crew-Camp (Radlader)', en: 'Get the second Dixi pallet at the crew camp (loader)' }, items: [{ item: 'dixi_pallet_2', at: 'dixi_delivery' }] },
      {
        type: 'deliver', text: { de: 'Stell die Dixis im Süden des Geländes auf', en: 'Set up the Dixis in the south of the site' },
        items: ['dixi_pallet_2'], at: 'dixi_row_2', radius: 9, buildTime: 3,
        buildLabel: { de: 'Dixis aufstellen', en: 'Set up Dixis' },
        build: { id: 'dixis_2', type: 'dixi_row', at: 'dixi_row_2_pos', rotation: 0.1, params: { n: 4 }, cost: 1300 },
      },
      {
        type: 'delivery', text: { de: 'Der Klowagen wird angeliefert – schau zu, wo er hinkommt', en: 'The toilet trailer is being delivered – watch where it goes' },
        at: 'wc_container', delay: 6,
        build: { id: 'wc_container', type: 'wc_container', at: 'wc_container', rotation: -0.4, cost: 3200 },
        doneText: { de: '🚚 Der Klowagen steht! Jetzt noch die Kackepumpe anschließen.', en: '🚚 The toilet trailer is in place! Now connect the poo pump.' },
      },
      {
        type: 'work', text: { de: 'Schließ die Kackepumpe an', en: 'Connect the poo pump' },
        targets: ['wc_pump'], workTime: 4, progress: 'pump', costEach: 450,
        label: { de: 'Hebepumpe anschließen', en: 'Connect lifting pump' },
      },
      {
        type: 'talk', npc: 'juli', text: { de: 'Lass Juli die Pumpe prüfen', en: 'Let Juli check the pump' },
        dialog: [
          { who: 'juli', text: { de: 'Pumpt. Noch. Ich geb ihr drei Tage.', en: 'It pumps. For now. I give it three days.' } },
          { who: 'juli', text: { de: 'Wenn sie kaputt geht, holt ihr eh mich. Wie immer.', en: 'When it breaks, you\'ll fetch me anyway. As always.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ 4 — Lights (timed, night falls)
  {
    id: 'q4_lights',
    title: { de: 'Es werde Licht', en: 'Let There Be Light' },
    giver: 'felix',
    day: 1,
    requires: ['q2_sails', 's0_soundbox'], // last job of day 1: dusk falls
    summary: { de: 'Es wird dunkel! Alle Lichtmasten aufstellen, bevor man nichts mehr sieht.', en: 'It\'s getting dark! Put up all light masts before you can\'t see anything anymore.' },
    offer: [
      { who: 'felix', text: { de: 'Felix, Strom und Licht. Du hast bestimmt schon gemerkt: Die Sonne geht bald unter. Das ist normal. Das passiert jeden Tag.', en: 'Felix, power and light. You\'ve probably noticed: the sun is setting soon. That\'s normal. It happens every day.' } },
      { who: 'felix', text: { de: 'Die Lichtmasten müssen stehen, bevor es stockdunkel ist. Sonst sieht man nichts. Logisch, oder?', en: 'The light masts need to stand before it\'s pitch dark. Otherwise you see nothing. Logical, right?' } },
      { who: 'felix', text: { de: 'Lampen und Kabel liegen am Generator in der Crew-Base. Sobald du die hast, läuft die Uhr. Ich würde das Quad nehmen. Also… ich würde es richtig machen.', en: 'Lamps and cables are at the generator in the crew base. Once you have them, the clock is ticking. I\'d take the quad. Well… I\'d do it right.' } },
    ],
    accept: { de: 'Licht an!', en: 'Lights on!' },
    decline: { de: 'Noch nicht.', en: 'Not yet.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol Lampen & Kabel am Generator', en: 'Get lamps & cables at the generator' }, items: [{ item: 'light_kit', at: 'generator' }] },
      {
        type: 'work', text: { de: 'Stell alle 8 Lichtmasten auf, bevor es dunkel ist!', en: 'Put up all 8 light masts before it\'s dark!' },
        targets: ['mast_1', 'mast_2', 'mast_3', 'mast_4', 'mast_5', 'mast_6', 'mast_7', 'mast_8'], workTime: 2.2, progress: 'lights',
        label: { de: 'Lichtmast aufstellen', en: 'Put up light mast' }, costEach: 420,
        timeLimit: 170, dusk: true, consumes: ['light_kit'],
        failDialog: [
          { who: 'felix', text: { de: 'Stockdunkel. Hm. Ich hätte das in der Hälfte der Zeit geschafft. Aber gut.', en: 'Pitch dark. Hm. I would have done it in half the time. But fine.' } },
          { who: 'felix', text: { de: 'Ich dreh die Zeit zurück. Also, ich bau die Masten wieder ab. Nochmal. Schneller diesmal.', en: 'I\'ll turn back time. Well, I\'ll take the masts down again. Once more. Faster this time.' } },
        ],
      },
      {
        type: 'talk', npc: 'felix', text: { de: 'Sag Felix, dass das Licht läuft', en: 'Tell Felix the lights are on' },
        dialog: [
          { who: 'felix', text: { de: 'Hm. Der dritte Mast steht etwas schief. …Okay. Es ist schön. Ich geb\'s zu.', en: 'Hm. The third mast is a bit crooked. …Okay. It\'s beautiful. I admit it.' } },
          { who: 'felix', text: { de: 'Schau mal zu den Sonnensegeln rauf. UV-Farbe. Mein Konzept.', en: 'Look up at the shade sails. UV paint. My concept.' } },
        ],
      },
    ],
    reward: { karma: 40 },
  },

  // ------------------------------------------------------------------ 6 — Awareness tent (Franzi)
  {
    id: 'q6_awareness',
    title: { de: 'Ein Ort zum Ankommen', en: 'A Place to Land' },
    giver: 'franzi',
    day: 2,
    requires: ['q1_rigging'],
    summary: { de: 'Franzi braucht ihr Awareness-Zelt – für alle, denen es zu viel wird.', en: 'Franzi needs her awareness tent – for everyone who gets overwhelmed.' },
    offer: [
      { who: 'franzi', text: { de: 'Hey du! Jetzt, wo so viele Leute da sind, brauch ich dringend mein Awareness-Zelt.', en: 'Hey you! Now that so many people are here, I urgently need my awareness tent.' } },
      { who: 'franzi', text: { de: 'Da können Leute hin, denen alles zu viel wird. Oder die zu viel hatten. Die Jurte liegt vor dem Hühnercontainer – in einer großen Tasche, die kannst du tragen.', en: 'People can go there when everything gets too much. Or when they had too much. The yurt is in front of the chicken container – in a big bag, you can carry it.' } },
    ],
    accept: { de: 'Mach ich gern!', en: 'Happy to!' },
    decline: { de: 'Gleich, Franzi.', en: 'In a bit, Franzi.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol die Awareness-Jurte vor dem Hühnercontainer', en: 'Get the awareness yurt in front of the chicken container' }, items: [{ item: 'awareness_bag', at: 'C3_front' }] },
      {
        type: 'deliver', text: { de: 'Bau das Awareness-Zelt auf', en: 'Build the awareness tent' },
        items: ['awareness_bag'], plot: 'awareness', buildTime: 4,
        build: { id: 'awareness', type: 'awareness_tent', plot: 'awareness', rotation: 0.6, cost: 1900 },
      },
      {
        type: 'talk', npc: 'franzi', text: { de: 'Zeig Franzi das Zelt', en: 'Show Franzi the tent' },
        dialog: [
          { who: 'franzi', text: { de: 'Oh wie schön! Kissen, Decken, Wasser, Kekse. Hier kann jeder runterkommen.', en: 'Oh how lovely! Cushions, blankets, water, cookies. Anyone can come down here.' } },
          { who: 'franzi', text: { de: 'Und du auch, wenn\'s dir zu viel wird. Versprochen?', en: 'You too, if it gets too much. Promise?' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ 7 — Planetarium dome
  {
    id: 'q7_dome',
    title: { de: 'Dome Sweet Dome', en: 'Dome Sweet Dome' },
    giver: 'matze',
    day: 3,
    requires: ['q4_lights'],
    summary: { de: 'Die Dome-Streben für das Planetarium sind… verteilt.', en: 'The planetarium dome struts are… scattered.' },
    offer: [
      { who: 'matze', text: { de: 'Das Planetarium! Das war doch… meins? Ja. Die Streben kamen in drei Bündeln.', en: 'The planetarium! That was… mine? Yes. The struts came in three bundles.' } },
      { who: 'matze', text: { de: 'Eins ist beim Pickup. Eins hat jemand als Torpfosten auf der Bolzwiese benutzt. Und eins ist… bei den Dixis. Frag nicht.', en: 'One is by the pickup. Someone used one as a goalpost on the meadow. And one is… by the portaloos. Don\'t ask.' } },
    ],
    accept: { de: 'Ich such sie.', en: 'I\'ll find them.' },
    decline: { de: 'Später.', en: 'Later.' },
    steps: [
      {
        type: 'pickup', text: { de: 'Finde die 3 Streben-Bündel', en: 'Find the 3 strut bundles' },
        items: [
          { item: 'dome_struts_a', at: 'pickup_bed' },
          { item: 'dome_struts_b', at: 'soccer_goal', search: 18 },
          { item: 'dome_struts_c', at: 'dixis', search: 16 },
        ],
      },
      {
        type: 'deliver', text: { de: 'Bau den Dome am Planetarium-Platz', en: 'Assemble the dome at the planetarium plot' },
        items: ['dome_struts_a', 'dome_struts_b', 'dome_struts_c'], plot: 'planetarium', buildTime: 4,
        build: { id: 'planetarium', type: 'planetarium_dome', plot: 'planetarium', rotation: -0.5, cost: 4200 },
      },
      {
        type: 'talk', npc: 'matze', text: { de: 'Zeig Matze den Dome', en: 'Show Matze the dome' },
        dialog: [
          { who: 'matze', text: { de: 'Geodätisch! Wunderschön! Zu 40% Gaffa! …Wo war ich? Ach ja. Danke!', en: 'Geodesic! Beautiful! 40% gaffa! …Where was I? Oh right. Thanks!' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ 8 — Forest Dome stage (Fabbe)
  {
    id: 'q8_forestdome',
    title: { de: 'Forest Dome', en: 'Forest Dome' },
    giver: 'fabbe',
    day: 3,
    requires: ['q7_dome'],
    summary: { de: 'Fabbe baut die zweite Bühne selbst – du bringst ihm das Material.', en: 'Fabbe builds the second stage himself – you bring him the material.' },
    offer: [
      { who: 'fabbe', text: { de: 'Hey, schön dich zu sehen! Ich bin Fabbe. Ich bau den Forest Dome – unsere zweite Bühne, mitten am Waldrand.', en: 'Hey, great to see you! I\'m Fabbe. I\'m building the Forest Dome – our second stage, right at the forest edge.' } },
      { who: 'fabbe', text: { de: 'Bauen tu ich ihn selbst, mit Niklas. Aber das Holz liegt am Parkplatz – viel Holz, Radlader. Und aus der Werkstatt bräuchte ich Seile und Schrauben.', en: 'I\'ll build it myself, with Niklas. But the timber is at the parking – lots of it, loader. And from the workshop I\'d need ropes and screws.' } },
    ],
    accept: { de: 'Lass uns bauen!', en: 'Let\'s build!' },
    decline: { de: 'Später, Fabbe.', en: 'Later, Fabbe.' },
    steps: [
      {
        type: 'pickup', text: { de: 'Hol Holz (Parkplatz, Radlader) und Seile (Werkstatt)', en: 'Get timber (parking, loader) and ropes (workshop)' },
        items: [{ item: 'dome_wood', at: 'parking' }, { item: 'rope_bag', at: 'C1_front' }],
      },
      {
        type: 'deliver', text: { de: 'Bring das Material zu Fabbe an den Waldrand', en: 'Bring the material to Fabbe at the forest edge' },
        items: ['dome_wood', 'rope_bag'], plot: 'forest_dome', buildTime: 2,
        buildLabel: { de: 'Material abladen', en: 'Unload material' },
        build: { id: 'forest_dome', type: 'forest_dome', plot: 'forest_dome', rotation: 1.7, cost: 5200, crew: { npcs: ['fabbe', 'niklas'], time: 22 } },
      },
      {
        type: 'talk', npc: 'fabbe', text: { de: 'Lass Fabbe bauen und sprich dann mit ihm', en: 'Let Fabbe build, then talk to him' },
        dialog: [
          { who: 'fabbe', text: { de: 'Wow. WOW. Genau so hab ich ihn mir vorgestellt. Danke fürs Material, wirklich!', en: 'Wow. WOW. Exactly how I imagined it. Thanks for the material, really!' } },
          { who: 'fabbe', text: { de: 'Wenn mir noch was fehlt, komm ich auf dich zu. Also… bestimmt.', en: 'If I\'m missing anything, I\'ll come to you. So… definitely.' } },
        ],
      },
    ],
    reward: { karma: 35 },
  },

  // ------------------------------------------------------------------ 9 — Techno Floor
  {
    id: 'q9_festzelt',
    title: { de: 'Techno Floor', en: 'Techno Floor' },
    giver: 'corni',
    day: 4,
    requires: ['q8_forestdome', 'q6_awareness'],
    summary: { de: 'Der Techno Floor braucht sein schwarzes Bühnenzelt. Das ist weg. Fabi hat eine Ahnung.', en: 'The Techno Floor needs its black stage tent. It\'s gone. Fabi has a hunch.' },
    offer: [
      { who: 'corni', text: { de: 'Der Techno Floor. Schwarzes Zelt, Laser, Stroboskop, Bass bis zum Morgengrauen. Und eine kleine Bar für Verena.', en: 'The Techno Floor. Black tent, lasers, strobes, bass until dawn. And a little bar for Verena.' } },
      { who: 'corni', text: { de: 'Nur: Das Zelt ist weg. Frag Fabi.', en: 'Only: the tent is gone. Ask Fabi.' } },
    ],
    accept: { de: 'Jawoll!', en: 'Jawoll!' },
    decline: { de: 'Später.', en: 'Later.' },
    steps: [
      {
        type: 'talk', npc: 'fabi', text: { de: 'Frag Fabi nach dem Zelt', en: 'Ask Fabi about the tent' },
        dialog: [
          { who: 'fabi', text: { de: 'Das Techno-Zelt? Hmm… Zdenko und Tinyhaus Thompsen wollten „nur kurz Schatten testen“. Beim Hängemattenwald.', en: 'The techno tent? Hmm… Zdenko and Tinyhaus Thompsen wanted to "just test some shade". At the hammock forest.' } },
          { who: 'fabi', text: { de: 'Und nimm Heringe aus der Werkstatt mit. Die kommen nie zurück. Nie.', en: 'And grab pegs from the workshop. They never come back. Never.' } },
        ],
      },
      {
        type: 'pickup', text: { de: 'Hol das Zelt (Hängemattenwald, Radlader!) und Heringe (Werkstatt)', en: 'Get the tent (hammock forest, loader!) and pegs (workshop)' },
        items: [{ item: 'festzelt_bag', at: 'hammock_forest', search: 18 }, { item: 'tent_pegs', at: 'C1_front' }],
      },
      {
        type: 'deliver', text: { de: 'Bau den Techno Floor auf', en: 'Build the Techno Floor' },
        items: ['festzelt_bag', 'tent_pegs'], plot: 'biergarten', buildTime: 5,
        build: { id: 'biergarten', type: 'techno_floor', plot: 'biergarten', rotation: 0.2, cost: 3600 },
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Melde dich bei Corni', en: 'Report to Corni' },
        dialog: [
          { who: 'corni', text: { de: 'Steht! Mainstage, Klos, Licht, Chai, Awareness, Dome, Forest Dome, Techno Floor. Mehr als letztes Jahr an Tag vier.', en: 'It stands! Mainstage, toilets, lights, chai, awareness, dome, Forest Dome, Techno Floor. More than last year by day four.' } },
          { who: 'corni', text: { de: 'Ach ja: Die Bar am Techno Floor steht – ab jetzt ist das Verenas Revier. Und Harry sucht dich wegen der Deko.', en: 'Oh right: the bar at the Techno Floor is up – from now on it\'s Verena\'s territory. And Harry is looking for you about the deco.' } },
        ],
      },
    ],
    reward: { karma: 40 },
  },
  // ------------------------------------------------------------------ 10 — Harry's 3D mapping deco (last days)
  {
    id: 'q10_mapping',
    title: { de: 'Holz & Licht', en: 'Wood & Light' },
    giver: 'harry',
    day: 4, night: true,
    requires: ['q9_festzelt', 'e1_entrance', 'm1_shops'],
    summary: { de: 'Kurz vor dem Festival: Harrys riesige Holzskulptur am Forest Dome – nachts mit 3D-Mapping.', en: 'Right before the festival: Harry\'s huge wooden sculpture at the Forest Dome – 3D mapped at night.' },
    offer: [
      { who: 'harry', text: { de: 'Endlich! Morgen ist Festival – jetzt ist Deko-Zeit. Deko kommt immer ganz zum Schluss. Ich bin Harry.', en: 'Finally! The festival is tomorrow – deco time. Deco always comes last. I\'m Harry.' } },
      { who: 'harry', text: { de: 'Hinter den Forest Dome kommt meine Holzskulptur. Riesig. Nachts projizieren wir ein 3D-Mapping drauf.', en: 'Behind the Forest Dome goes my wooden sculpture. Huge. At night we project a 3D mapping onto it.' } },
      { who: 'harry', text: { de: 'Die Holzplatten liegen am Parkplatz. Bring sie mit dem Radlader, dann warten wir auf die Dunkelheit.', en: 'The wooden panels are at the parking. Bring them with the loader, then we wait for darkness.' } },
    ],
    accept: { de: 'Mapping-Zeit!', en: 'Mapping time!' },
    decline: { de: 'Später, Harry.', en: 'Later, Harry.' },
    steps: [
      { type: 'pickup', text: { de: 'Lade die Holzplatten am Parkplatz auf (Radlader)', en: 'Load the wooden panels at the parking (loader)' }, items: [{ item: 'wood_panels', at: 'parking' }] },
      {
        type: 'deliver', text: { de: 'Bau die Skulptur am Forest Dome', en: 'Build the sculpture at the Forest Dome' },
        items: ['wood_panels'], plot: 'forest_dome', buildTime: 6,
        buildLabel: { de: 'Holzskulptur bauen', en: 'Build wooden sculpture' },
        build: { id: 'mapping_deco', type: 'mapping_deco', plot: 'forest_dome', rotation: 1.7, cost: 7400 },
      },
      { type: 'night', text: { de: 'Warte auf die Dunkelheit…', en: 'Wait for darkness…' } },
      {
        type: 'talk', npc: 'harry', text: { de: 'Schau dir das Mapping an und sprich mit Harry', en: 'Watch the mapping and talk to Harry' },
        dialog: [
          { who: 'harry', text: { de: 'Siehst du das? SIEHST DU DAS? Drei Monate Arbeit für zwölf Minuten Loop. Jede Sekunde wert.', en: 'You see that? DO YOU SEE THAT? Three months of work for a twelve minute loop. Worth every second.' } },
          { who: 'harry', text: { de: 'Das Festival kann kommen. …Hast du eigentlich mal aufs Budget geschaut? Lieber nicht.', en: 'The festival can come. …Did you ever look at the budget? Better not.' } },
        ],
      },
    ],
    reward: { karma: 50 },
  },

  // ------------------------------------------------------------------ S0 — no soundboxes on the camping (Jan, early)
  {
    id: 's0_soundbox',
    title: { de: 'Soundboks-Polizei', en: 'Soundbox Police' },
    giver: 'jan',
    day: 1,
    requires: ['q0_leo'],
    summary: { de: 'Auf dem Camping sind Soundboksen verboten. Die Leute stellen trotzdem welche auf. Geh hin und sorg für Ruhe.', en: 'Soundboxes are forbidden on the camping. People put them up anyway. Go there and make it quiet.' },
    offer: [
      { who: 'jan', text: { de: 'Hörst du das? Dieses Wummern vom Camping? Das ist eine Soundboks. Auf dem Campingplatz sind die VERBOTEN.', en: 'Hear that? That thumping from the camping? That\'s a soundbox. They\'re FORBIDDEN on the camping.' } },
      { who: 'jan', text: { de: 'Steht auf den Schildern. Auf ALLEN Schildern. Die Leute stellen trotzdem welche auf. Immer. Jedes Jahr.', en: 'It says so on the signs. On ALL the signs. People put them up anyway. Always. Every year.' } },
      { who: 'jan', text: { de: 'Geh hin, sag Bescheid, Box aus. Freundlich. Oder halt nicht ganz so freundlich. Und das wird nicht die letzte sein – wenn du wieder eine hörst: gleiches Spiel.', en: 'Go over, tell them, box off. Politely. Or not quite so politely. And it won\'t be the last one – whenever you hear one again: same game.' } },
    ],
    accept: { de: 'Ich mach das!', en: 'On it!' },
    decline: { de: 'Ich hör nix…', en: 'I don\'t hear anything…' },
    steps: [
      { type: 'soundbox', text: { de: 'Folge dem Wummern und sorg dafür, dass die Soundboks ausgeht', en: 'Follow the thumping and get the soundbox turned off' } },
      {
        type: 'talk', npc: 'jan', text: { de: 'Melde dich bei Jan', en: 'Report to Jan' },
        dialog: [
          { who: 'jan', text: { de: 'Ruhe! Herrlich. Die Nachbarzelte schlafen wieder. Also, die, die schlafen wollten.', en: 'Silence! Lovely. The neighbouring tents are sleeping again. Well, the ones that wanted to.' } },
          { who: 'jan', text: { de: 'Du bist jetzt offiziell Soundboks-Polizei. Jede Box, die du ausmachst, gibt Karma.', en: 'You are now officially the soundbox police. Every box you turn off earns karma.' } },
        ],
      },
    ],
    reward: { karma: 15 },
  },

  // ------------------------------------------------------------------ H1 — the hammock forest (Wiesel builds it)
  {
    id: 'h1_hammocks',
    title: { de: 'Der Hängemattenwald', en: 'The Hammock Forest' },
    giver: 'wiesel',
    day: 2,
    requires: ['q2_sails'],
    summary: { de: 'Wiesel baut zwischen Narnia Floor und Forest Dome den Hängemattenwald. Du bringst ihm Pfosten und Hängematten.', en: 'Wiesel builds the hammock forest between the Narnia Floor and the Forest Dome. You bring him posts and hammocks.' },
    offer: [
      { who: 'wiesel', text: { de: 'Servus! Wiesel. Ich bau hier den Hängemattenwald. Also… sobald ich Pfosten hab. Und Hängematten.', en: 'Hi! Wiesel. I\'m building the hammock forest here. Well… as soon as I have posts. And hammocks.' } },
      { who: 'wiesel', text: { de: 'Die Pfosten liegen am Parkplatz – schwer, nimm den Radlader. Die Hängematten sind im Hühnercontainer. Den Rest mach ich.', en: 'The posts are at the parking – heavy, take the loader. The hammocks are in the chicken container. I\'ll do the rest.' } },
    ],
    accept: { de: 'Bring ich dir!', en: 'I\'ll bring them!' },
    decline: { de: 'Später, Wiesel.', en: 'Later, Wiesel.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol die Pfosten (Parkplatz, Radlader) und die Hängematten (Hühnercontainer)', en: 'Get the posts (parking, loader) and the hammocks (chicken container)' }, items: [{ item: 'hammock_posts', at: 'parking' }, { item: 'hammock_bag', at: 'huehner_front' }] },
      {
        type: 'deliver', text: { de: 'Bring alles zu Wiesel zwischen Narnia und Forest Dome', en: 'Bring it all to Wiesel between Narnia and the Forest Dome' },
        items: ['hammock_posts', 'hammock_bag'], plot: 'hammocks', buildTime: 2,
        buildLabel: { de: 'Material abladen', en: 'Unload material' },
        build: { id: 'hammocks', type: 'hammock_forest', plot: 'hammocks', rotation: 0.3, cost: 1800, crew: { npcs: ['wiesel'], time: 18 } },
      },
      {
        type: 'talk', npc: 'wiesel', text: { de: 'Lass Wiesel bauen und sprich dann mit ihm', en: 'Let Wiesel build, then talk to him' },
        dialog: [
          { who: 'wiesel', text: { de: 'Steht! Acht Pfosten, acht Hängematten, null Stress. Probier mal eine aus. …Nicht einschlafen!', en: 'Done! Eight posts, eight hammocks, zero stress. Try one out. …Don\'t fall asleep!' } },
          { who: 'rocky', text: { de: 'Duuude… ist das ein Wald? Aus Hängematten? Ich zieh hier ein.', en: 'Duuude… is that a forest? Made of hammocks? I\'m moving in.' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },

  // ------------------------------------------------------------------ K1 — Künstlergasse: the tents (Cosma, Mathias builds)
  {
    id: 'k1_kuenstlergasse',
    title: { de: 'Die Künstlergasse', en: 'The Artists\' Alley' },
    giver: 'cosma',
    day: 2,
    requires: ['q2_sails'],
    summary: { de: 'Cosma und Mathias bauen zwischen Mainstage und Forest Dome die Künstlergasse: ein offenes Stretchzelt und ein Königszelt.', en: 'Cosma and Mathias build the artists\' alley between the mainstage and the Forest Dome: an open stretch tent and a royal tent.' },
    offer: [
      { who: 'cosma', text: { de: 'Hiii! Ich bin Cosma. 😁 Hier entsteht die Künstlergasse – ein Ort, an dem die Kreativität einfach… fließt. Spürst du das? Ich spür das.', en: 'Hiii! I\'m Cosma. 😁 This is where the artists\' alley happens – a place where creativity just… flows. Can you feel it? I can feel it.' } },
      { who: 'cosma', text: { de: 'Mathias baut alles auf, er ist ein Schatz. Wir brauchen nur noch das Stretchzelt aus dem Hühnercontainer und das Königszelt aus dem Künstlergasse-Container. Passt ja, oder? Das Universum plant mit.', en: 'Mathias builds everything, he\'s a treasure. We just need the stretch tent from the chicken container and the royal tent from the Künstlergasse container. Fitting, right? The universe is planning along.' } },
    ],
    accept: { de: 'Ich hol die Zelte!', en: 'I\'ll get the tents!' },
    decline: { de: 'Später, Cosma.', en: 'Later, Cosma.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol das Stretchzelt (Hühnercontainer) und das Königszelt (Künstlergasse-Container)', en: 'Get the stretch tent (chicken container) and the royal tent (Künstlergasse container)' }, items: [{ item: 'kg_stretch', at: 'C3_front' }, { item: 'kg_royal', at: 'C2_front' }] },
      {
        type: 'deliver', text: { de: 'Bring beide Zelte zu Mathias in die Künstlergasse (zwischen Mainstage und Forest Dome)', en: 'Bring both tents to Mathias at the artists\' alley (between mainstage and Forest Dome)' },
        items: ['kg_stretch', 'kg_royal'], plot: 'kuenstlergasse', buildTime: 2,
        buildLabel: { de: 'Zelte abladen', en: 'Unload tents' },
        build: { id: 'kuenstlergasse', type: 'kuenstlergasse', plot: 'kuenstlergasse', rotation: 0.1, cost: 1400, crew: { npcs: ['mathias'], time: 18 } },
      },
      {
        type: 'talk', npc: 'cosma', text: { de: 'Lass Mathias bauen und sprich dann mit Cosma', en: 'Let Mathias build, then talk to Cosma' },
        dialog: [
          { who: 'mathias', text: { de: 'Steht! Stretchzelt gespannt, Königszelt aufgestellt. Hat Spaß gemacht! Brauchst du noch irgendwo Hilfe? 😄', en: 'Done! Stretch tent tensioned, royal tent up. That was fun! Need help anywhere else? 😄' } },
          { who: 'cosma', text: { de: 'Schau, wie schön! Die Energie hier ist jetzt schon ganz weich. Danke dir von Herzen. 😁', en: 'Look how pretty! The energy here is already so soft. Thank you from the heart. 😁' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },
  // ------------------------------------------------------------------ K2 — Künstlergasse: art & workshops (Cosma)
  {
    id: 'k2_kunst',
    title: { de: 'Kunst für die Künstlergasse', en: 'Art for the Artists\' Alley' },
    giver: 'cosma',
    day: 3,
    requires: ['k1_kuenstlergasse', 'q4_lights'],
    summary: { de: 'Im Königszelt sollen Bilder hängen, im Stretchzelt gibt es Kunst-Workshops. Dafür fehlen die Bilder und die Farben.', en: 'Paintings should hang in the royal tent and there\'ll be art workshops in the stretch tent. The paintings and paints are missing.' },
    offer: [
      { who: 'cosma', text: { de: 'Die Zelte stehen, jetzt fehlt die Seele. 😁 Im Königszelt sollen Bilder hängen, und im Stretchzelt machen wir Kunst-Workshops. Malen ist Meditation mit Farbe.', en: 'The tents stand, now the soul is missing. 😁 Paintings should hang in the royal tent, and we\'ll do art workshops in the stretch tent. Painting is meditation with colour.' } },
      { who: 'cosma', text: { de: 'Die Bilder liegen im Künstlergasse-Container – wo sonst? Und Farben und Pinsel sind in der Werkstatt. Fabi weiß, wo. Hoffentlich.', en: 'The paintings are in the Künstlergasse container – where else? And paints and brushes are in the workshop. Fabi knows where. Hopefully.' } },
    ],
    accept: { de: 'Kunst kommt!', en: 'Art incoming!' },
    decline: { de: 'Gleich.', en: 'In a bit.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol die Bilder (Künstlergasse-Container) und Farben & Pinsel (Werkstatt)', en: 'Get the paintings (Künstlergasse container) and paints & brushes (workshop)' }, items: [{ item: 'kg_paintings', at: 'C2_front' }, { item: 'kg_paints', at: 'C1_front' }] },
      {
        type: 'deliver', text: { de: 'Bring alles in die Künstlergasse', en: 'Bring it all to the artists\' alley' },
        items: ['kg_paintings', 'kg_paints'], plot: 'kuenstlergasse', buildTime: 1.5,
        buildLabel: { de: 'Kunst abgeben', en: 'Hand over art' },
      },
      {
        type: 'talk', npc: 'cosma', text: { de: 'Sprich mit Cosma', en: 'Talk to Cosma' },
        dialog: [
          { who: 'mathias', text: { de: 'Bilder hängen, Tische stehen, Pinsel liegen. Der erste Workshop läuft schon! 😄', en: 'Paintings are up, tables are set, brushes are out. The first workshop is already running! 😄' } },
          { who: 'cosma', text: { de: 'Siehst du, wie die Leute malen? Jeder Pinselstrich ist ein kleines Gebet. Danke, dass du Teil davon bist. 😁', en: 'See how people are painting? Every brushstroke is a little prayer. Thank you for being part of it. 😁' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },

  // ------------------------------------------------------------------ X1 — the special nut (night 1, Corni)
  {
    id: 'x1_nuss',
    title: { de: 'Die Spezial-Nuss', en: 'The Special Nut' },
    giver: 'corni',
    day: 1, night: true,
    requires: ['q4_lights'],
    summary: { de: 'Der Bauzaun am Eingang wackelt. Ohne die Spezial-Nuss fällt er nachts um. Seit Tagen sucht sie jeder. Heute Nacht findest du sie.', en: 'The fence at the entrance wobbles. Without the special nut it\'ll fall over in the night. Everybody\'s been looking for it for days. Tonight you find it.' },
    offer: [
      { who: 'corni', text: { de: 'Der Bauzaun am Eingang. Siehst du, wie der wackelt? Der braucht die Spezial-Nuss. Die Dreizehner. Die eine.', en: 'The fence at the entrance. See how it wobbles? It needs the special nut. The thirteen. The one.' } },
      { who: 'corni', text: { de: 'Alle fragen seit Tagen danach. Keiner hat sie. Fabi weiß angeblich, wo sie ist. Nimm die Stirnlampe mit.', en: 'Everyone\'s been asking about it for days. Nobody has it. Fabi supposedly knows where it is. Take the headlamp.' } },
    ],
    accept: { de: 'Ich find die Nuss!', en: 'I\'ll find the nut!' },
    decline: { de: 'Morgen?', en: 'Tomorrow?' },
    steps: [
      {
        type: 'talk', npc: 'fabi', text: { de: 'Frag Fabi nach der Spezial-Nuss', en: 'Ask Fabi about the special nut' },
        dialog: [{ who: 'fabi', text: { de: 'Die Spezial-Nuss? Künstlergasse-Container. Ganz hinten links, unter der Plane. Ganz sicher. Fast ganz sicher.', en: 'The special nut? Künstlergasse container. Way at the back on the left, under the tarp. Definitely. Almost definitely.' } }],
      },
      {
        type: 'reach', at: 'kuenstler_front', radius: 3, text: { de: 'Such im Künstlergasse-Container', en: 'Search the Künstlergasse container' },
        dialog: [{ who: 'you', text: { de: '*leuchtet mit der Stirnlampe* Kabeltrommeln. Ein Einhorn-Kostüm. Drei Hängematten. Ein Zettel: „NUSS?? – Corni“. …Keine Nuss.', en: '*shines the headlamp* Cable drums. A unicorn costume. Three hammocks. A note: "NUT?? – Corni". …No nut.' } }],
      },
      {
        type: 'talk', npc: 'schwarzhuber', text: { de: 'Frag Schwarzhuber – der Bauer hat angeblich alles', en: 'Ask Schwarzhuber – the farmer supposedly has everything' },
        dialog: [
          { who: 'schwarzhuber', text: { de: 'A Spezial-Nuss? Für eure Bauzäun? I hab dahoam a ganze Kistn. Aber des san Zwölfer. Ihr brauchts an Dreizehner. Dilettantisch.', en: 'A special nut? For your fences? I\'ve got a whole box at home. But they\'re twelves. You need a thirteen. Amateurs.' } },
          { who: 'schwarzhuber', text: { de: 'Habts ihr scho amoi in eurer eigenen Werkstatt gschaut? Na? Hab i ma denkt.', en: 'Have you ever looked in your own workshop? No? Thought so.' } },
        ],
      },
      {
        type: 'talk', npc: 'fabi', text: { de: 'Zurück zu Fabi: Was ist mit der Werkstatt?', en: 'Back to Fabi: what about the workshop?' },
        dialog: [
          { who: 'fabi', text: { de: 'Die Werkstatt? Da hab ich doch… Moment. Oberstes Regal. Hinter dem Kaffee. …Oh nein.', en: 'The workshop? But I… wait. Top shelf. Behind the coffee. …Oh no.' } },
          { who: 'fabi', text: { de: 'Da liegt sie. Die ganze Zeit. Seit Montag. Sag\'s keinem. Bitte.', en: 'That\'s where it is. The whole time. Since Monday. Don\'t tell anyone. Please.' } },
        ],
      },
      { type: 'pickup', text: { de: 'Hol die Spezial-Nuss aus der Werkstatt (oberstes Regal)', en: 'Get the special nut from the workshop (top shelf)' }, items: [{ item: 'spezial_nuss', at: 'werkstatt_inside', search: 3 }] },
      {
        type: 'work', text: { de: 'Schraub die Nuss in den wackelnden Bauzaun am Eingang', en: 'Screw the nut into the wobbly fence at the entrance' },
        targets: ['nut_fence'], workTime: 2, label: { de: 'Spezial-Nuss festziehen', en: 'Tighten the special nut' }, consumes: ['spezial_nuss'],
        minigame: 'mash', minigameTitle: { de: 'Festziehen! Fester! FESTER!', en: 'Tighten! Tighter! TIGHTER!' }, minigameOpts: { need: 13, time: 4.5 },
        minigameFail: { de: 'Noch locker. Der Zaun lacht dich aus.', en: 'Still loose. The fence is laughing at you.' },
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Sag Corni, dass der Zaun steht', en: 'Tell Corni the fence stands' },
        dialog: [
          { who: 'corni', text: { de: 'Er steht! DIE NUSS! Wo war sie?', en: 'It stands! THE NUT! Where was it?' } },
          { who: 'you', text: { de: 'In der Werkstatt. Oberstes Regal. Hinter dem Kaffee.', en: 'In the workshop. Top shelf. Behind the coffee.' } },
          { who: 'corni', text: { de: '…FABI!', en: '…FABI!' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },
  // ------------------------------------------------------------------ R1 — precision parking: the kitchen water tank (Andi)
  {
    id: 'r1_wassertank',
    title: { de: 'Millimeterarbeit', en: 'Millimetre Work' },
    giver: 'andi',
    day: 3,
    requires: ['q3_toilets'],
    summary: { de: 'Sabses Küche braucht einen 1000-Liter-Wassertank. Der muss mit dem Radlader in eine enge Lücke neben die Küche. Hütchen inklusive.', en: 'Sabse\'s kitchen needs a 1000-litre water tank. It has to go into a tight gap next to the kitchen with the loader. Cones included.' },
    offer: [
      { who: 'andi', text: { de: 'Andi hier, vom Wasser. Sabse hat kein Wasser mehr in der Küche. Und Sabse ohne Wasser… willst du nicht erleben.', en: 'Andi here, water team. Sabse has no water left in the kitchen. And Sabse without water… you don\'t want to see it.' } },
      { who: 'andi', text: { de: 'Der Tank steht am Parkplatz. Radlader. Und neben der Küche ist es eng – ich hab dir Hütchen hingestellt. Bleib in der Gasse und halt auf der Markierung an.', en: 'The tank is at the parking. Loader. And it\'s tight next to the kitchen – I put out cones for you. Stay in the lane and stop on the mark.' } },
    ],
    accept: { de: 'Millimetergenau!', en: 'Spot on!' },
    decline: { de: 'Später.', en: 'Later.' },
    steps: [
      { type: 'pickup', text: { de: 'Lade den Wassertank am Parkplatz auf (Radlader)', en: 'Load the water tank at the parking (loader)' }, items: [{ item: 'water_tank', at: 'parking' }] },
      {
        type: 'park', at: 'water_tank_spot', heading: -Math.PI / 2, item: 'water_tank',
        text: { de: 'Rangier den Tank durch die Hütchengasse neben die Küche und halt auf der gelben Markierung', en: 'Manoeuvre the tank through the cone lane next to the kitchen and stop on the yellow mark' },
        build: { id: 'water_tank', type: 'water_tank', at: 'water_tank_drop', rotation: 0, cost: 350 },
      },
      {
        type: 'talk', npc: 'sabse', text: { de: 'Sag Sabse, dass sie wieder Wasser hat', en: 'Tell Sabse she has water again' },
        dialog: [
          { who: 'sabse', text: { de: 'Wasser. WASSER! Endlich kann ich Linsen kochen. Für 200 Leute. Danke. …Und jetzt raus aus meiner Küche.', en: 'Water. WATER! Finally I can cook lentils. For 200 people. Thanks. …And now get out of my kitchen.' } },
          { who: 'andi', text: { de: 'Kein einziges Hütchen? …Okay, eins. Ich hab nix gesehen.', en: 'Not a single cone? …Okay, one. I didn\'t see anything.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },
  // ------------------------------------------------------------------ G1 — Schwarzhuber's permission: earn his respect (karma)
  {
    id: 'g1_genehmigung',
    title: { de: 'Anständige Leit', en: 'Decent Folk' },
    giver: 'schwarzhuber',
    day: 4,
    requires: [],
    summary: { de: 'Für den Gästeparkplatz auf seiner Nachbarwiese will Schwarzhuber sehen, dass ihr anständige Leute seid. Das sieht er am Karma: hilf Leuten, kümmer dich um Notfälle, sei nett.', en: 'For the guest parking on his other meadow, Schwarzhuber wants to see you\'re decent people. He can tell by your karma: help people, handle emergencies, be nice.' },
    offer: [
      { who: 'schwarzhuber', text: { de: 'Ihr wollts morgen tausend Autos auf mei Nachbarwiesn stellen. Mei. Des hab i mir überlegt.', en: 'You want to park a thousand cars on my other meadow tomorrow. Well. I\'ve been thinking about that.' } },
      { who: 'schwarzhuber', text: { de: 'I mach des nur für anständige Leit. Und ob einer anständig is, des siag i am Karma. Bring ma ordentlich Karma, dann gibt\'s a Handschlag.', en: 'I only do it for decent folk. And whether somebody\'s decent, I can see from their karma. Bring me proper karma, then we shake hands.' } },
    ],
    accept: { de: 'Ich bin anständig!', en: 'I\'m decent!' },
    decline: { de: 'Gleich.', en: 'In a bit.' },
    steps: [
      {
        type: 'karma', min: 120, extra: 90,
        text: { de: 'Sammle Karma für Schwarzhuber: ✺ {have} / {need} – hilf bei Notfällen, mach Gefallen, red nett mit Leuten', en: 'Collect karma for Schwarzhuber: ✺ {have} / {need} – help in emergencies, do favours, be nice to people' },
        notYet: { de: 'Na. ✺ {have}? Da fehln no {missing}. Hilf a bissl wo mit, kümmer di um die Leit, red nett mit ihnen. Dann schaun ma.', en: 'Nah. ✺ {have}? That\'s {missing} short. Help out a bit, look after people, be nice to them. Then we\'ll see.' },
        okDialog: [
          { who: 'schwarzhuber', text: { de: 'Schau her. Des is ja anständig. Fast scho bayrisch anständig.', en: 'Look at that. That\'s decent. Almost Bavarian decent.' } },
          { who: 'schwarzhuber', text: { de: 'Guad. Die Nachbarwiesn gehört morgen eich. Aber wenn oaner in mei Mais fahrt, dann…', en: 'Fine. The other meadow is yours tomorrow. But if anybody drives into my corn, then…' } },
        ],
      },
      {
        type: 'talk', npc: 'jan', text: { de: 'Sag Jan, dass der Gästeparkplatz steht', en: 'Tell Jan the guest parking is sorted' },
        dialog: [
          { who: 'jan', text: { de: 'Er hat JA gesagt? Schwarzhuber? Zum Parkplatz? Ich schreib dich auf die Liste. Ganz oben. Mit Stern.', en: 'He said YES? Schwarzhuber? To the parking? I\'m putting you on the list. At the top. With a star.' } },
        ],
      },
    ],
    reward: { karma: 15 },
  },

  // ------------------------------------------------------------------ 11 — straw bale sound walls (Juli organises the straw)
  {
    id: 'q11_straw',
    title: { de: 'Stroh gegen Beschwerden', en: 'Straw Against Complaints' },
    giver: 'jonas',
    day: 4,
    requires: ['q9_festzelt'],
    summary: { de: 'Strohballen-Wände als Schallschutz: hinter der Mainstage, vor und hinter dem Forest Dome, hinter dem Elefanten am Narnia Floor, vor und hinter dem Techno Floor.', en: 'Straw bale walls for sound insulation: behind the mainstage, in front of and behind the Forest Dome, behind the elephant at the Narnia Floor, in front of and behind the Techno Floor.' },
    offer: [
      { who: 'jonas', text: { de: 'SKÅL! Jonas, Schallschutz. Schwarzhuber sagt, die Nachbarn rufen an. Man hört uns bis Karlsfeld. Also: Strohwände. Vor und hinter die Bühnen.', en: 'SKÅL! Jonas, sound walls. Schwarzhuber says the neighbours are calling. You can hear us all the way to Karlsfeld. So: straw walls. In front of and behind the stages.' } },
      { who: 'jonas', text: { de: 'Ich hol mit Schwarzhuber das Stroh. Du stapelst. Danach gibt\'s Bier. Vorher auch, wenn du willst.', en: 'I\'ll get the straw with Schwarzhuber. You stack. Beer afterwards. Before too, if you like.' } },
    ],
    accept: { de: 'Ich stapel gerade. Versprochen.', en: 'I\'ll stack straight. Promise.' },
    decline: { de: 'Später.', en: 'Later.' },
    steps: [
      {
        type: 'wait', seconds: 20, away: ['jonas'], cost: 400, costReason: { de: 'Stroh vom Schwarzhuber (Freundschaftspreis)', en: 'Straw from Schwarzhuber (mate\'s rates)' },
        text: { de: 'Jonas holt mit Schwarzhuber das Stroh…', en: 'Jonas is getting the straw with Schwarzhuber…' },
        doneText: { de: '🚜 Die Strohballen liegen am Parkplatz. (−400 €, Freundschaftspreis vom Schwarzhuber)', en: '🚜 The straw bales are at the parking. (−€400, mate\'s rates from Schwarzhuber)' },
      },
      { type: 'pickup', text: { de: 'Lade die Strohballen am Parkplatz auf (Radlader)', en: 'Load the straw bales at the parking (loader)' }, items: [{ item: 'straw_bales', at: 'parking' }] },
      {
        type: 'work', text: { de: 'Bau die 6 Strohballen-Wände an den Bühnen', en: 'Build the 6 straw bale walls at the stages' },
        targets: ['straw_1', 'straw_2', 'straw_3', 'straw_4', 'straw_5', 'straw_6'], workTime: 3.5, progress: 'straw', costEach: 60,
        label: { de: 'Strohballen stapeln', en: 'Stack straw bales' }, consumes: ['straw_bales'],
        minigame: 'timing', minigameTitle: { de: 'Ballen gerade draufsetzen!', en: 'Put the bale on straight!' }, minigameOpts: { speed: 1.5, zone: 0.17 },
        minigameFail: { de: 'Schief. Juli hat\'s gesehen. Nochmal.', en: 'Crooked. Juli saw it. Again.' },
      },
      {
        type: 'talk', npc: 'jonas', text: { de: 'Lass Jonas die Wände prüfen', en: 'Let Jonas check the walls' },
        dialog: [
          { who: 'jonas', text: { de: 'Hmm. Schief. Schief. Wikinger-schief. …Hält aber! SKÅL! Das Bier geht auf mich.', en: 'Hmm. Crooked. Crooked. Viking crooked. …Holds, though! SKÅL! Beer\'s on me.' } },
          { who: 'juli', text: { de: 'Schief. Aber hält. Ich sag nix. …Okay, ich sag: schief.', en: 'Crooked. But holds. I\'m not saying anything. …Okay, I\'m saying: crooked.' } },
          { who: 'schwarzhuber', text: { de: 'Dilettantisch gestapelt. Aber jetzt hört ma nur no a bissl was. Und nach\'m Festival nehm i\'s wieder mit, für d\'Viecher.', en: 'Stacked like amateurs. But now you only hear a little. And after the festival I\'ll take it back, for the animals.' } },
        ],
      },
    ],
    reward: { karma: 35 },
  },

  // ------------------------------------------------------------------ E1 — the entrance (Jan)
  {
    id: 'e1_entrance',
    title: { de: 'Der Eingang', en: 'The Entrance' },
    giver: 'jan',
    day: 3,
    requires: ['q4_lights'],
    summary: { de: 'Ein großes Stretchzelt am Eingang, darunter der Tisch, an dem alle Gäste ihr Bändchen bekommen.', en: 'A big stretch tent at the entrance, with the table underneath where every guest gets their wristband.' },
    offer: [
      { who: 'jan', text: { de: 'Wenn die Gäste kommen, brauchen sie Bändchen. Und ich brauch ein Dach überm Kopf, wenn ich 3.000 Bändchen verteile.', en: 'When the guests come they need wristbands. And I need a roof over my head while handing out 3,000 wristbands.' } },
      { who: 'jan', text: { de: 'Das große Stretchzelt liegt beim Hühnercontainer – schwer, Radlader. Die Bändchen-Kisten stehen bei mir im Büro.', en: 'The big stretch tent is at the chicken container – heavy, loader. The wristband boxes are in my office.' } },
    ],
    accept: { de: 'Ich bau dir den Eingang.', en: 'I\'ll build your entrance.' },
    decline: { de: 'Später, Jan.', en: 'Later, Jan.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol das Stretchzelt (Hühnercontainer, Radlader) und die Bändchen-Kisten (Büro)', en: 'Get the stretch tent (chicken container, loader) and the wristband boxes (office)' }, items: [{ item: 'entrance_tent_bag', at: 'huehner_front' }, { item: 'wristband_boxes', at: 'office_inside' }] },
      {
        type: 'deliver', text: { de: 'Bau den Eingang auf', en: 'Build the entrance' },
        items: ['entrance_tent_bag', 'wristband_boxes'], plot: 'entrance', buildTime: 5,
        buildLabel: { de: 'Stretchzelt spannen & Tisch aufstellen', en: 'Put up the stretch tent & the table' },
        build: { id: 'entrance', type: 'entrance_tent', plot: 'entrance', rotation: 0.6, cost: 2100 },
      },
      {
        type: 'talk', npc: 'jan', text: { de: 'Sag Jan Bescheid', en: 'Tell Jan' },
        dialog: [
          { who: 'jan', text: { de: 'Ein Dach! Ein Tisch! Bändchen! Ich bin vorbereitet. Zum ersten Mal in meinem Leben.', en: 'A roof! A table! Wristbands! I\'m prepared. For the first time in my life.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },
  // ------------------------------------------------------------------ M1 — the shops (Isi)
  {
    id: 'm1_shops',
    title: { de: 'Die Marktstraße', en: 'The Market Street' },
    giver: 'annika',
    day: 3,
    requires: ['q4_lights'],
    summary: { de: 'Annika organisiert die Shops: Marktstände aufbauen, Ware drauf, Lichterkette drüber.', en: 'Annika is organising the shops: set up market stalls, goods on them, fairy lights above.' },
    offer: [
      { who: 'annika', text: { de: 'Hi! Annika. Ich mach die Shops! Schmuck, Klamotten, Räucherstäbchen, Kristalle… alles, was man nicht braucht und trotzdem kauft!', en: 'Hi! Annika. I\'m doing the shops! Jewellery, clothes, incense, crystals… everything you don\'t need and buy anyway!' } },
      { who: 'annika', text: { de: 'Die Stände liegen am Parkplatz, das ist schwer – Radlader. Die Ware ist im Künstlergasse-Container. Hilfst du mir?', en: 'The stalls are at the parking, that\'s heavy – loader. The goods are in the Künstlergasse container. Will you help?' } },
    ],
    accept: { de: 'Klar, Annika!', en: 'Sure, Annika!' },
    decline: { de: 'Gleich!', en: 'In a bit!' },
    steps: [
      { type: 'pickup', text: { de: 'Hol die Marktstände (Parkplatz, Radlader) und die Ware (Künstlergasse)', en: 'Get the market stalls (parking, loader) and the goods (Künstlergasse)' }, items: [{ item: 'market_stalls', at: 'parking' }, { item: 'market_goods', at: 'kuenstler_front' }] },
      {
        type: 'deliver', text: { de: 'Bau die Marktstraße auf', en: 'Build the market street' },
        items: ['market_stalls', 'market_goods'], plot: 'shops', buildTime: 5,
        buildLabel: { de: 'Stände aufstellen', en: 'Set up stalls' },
        build: { id: 'shops', type: 'market', plot: 'shops', rotation: 0.2, cost: 1600 },
      },
      {
        type: 'talk', npc: 'annika', text: { de: 'Zeig Annika die Marktstraße', en: 'Show Annika the market street' },
        dialog: [
          { who: 'annika', text: { de: 'WIE SCHÖN! Ich kauf mir gleich selbst was. Eine Kristallkette. Oder drei.', en: 'SO PRETTY! I\'m buying something myself right away. A crystal necklace. Or three.' } },
        ],
      },
    ],
    reward: { karma: 30 },
  },

  // ------------------------------------------------------------------ S3 — quad express (Flo): fast, but don't run anyone over
  {
    id: 's3_quad',
    title: { de: 'Quad-Express', en: 'Quad Express' },
    giver: 'flo',
    day: 2,
    requires: ['q3_toilets'],
    timeLimit: 70,
    noRunOver: true,
    summary: { de: 'Das Diagnosegerät liegt am Firespace – am anderen Ende des Geländes. Mit dem Quad hin und zurück, schnell. Wer jemanden umfährt, muss von vorn anfangen.', en: 'The diagnostic tool is at the Firespace – at the other end of the site. There and back on the quad, fast. Run anyone over and you start again.' },
    offer: [
      { who: 'flo', text: { de: 'Der Generator spinnt. GERADE. Und Andi hat das Diagnosegerät am Firespace liegen lassen. Ganz am anderen Ende.', en: 'The generator is acting up. RIGHT NOW. And Andi left the diagnostic tool at the Firespace. At the very other end.' } },
      { who: 'flo', text: { de: 'Nimm das Quad, Shift gibt Gas. Aber da laufen überall Leute rum. Fährst du einen um, ist Franzi sauer und wir fangen von vorne an.', en: 'Take the quad, Shift is full throttle. But there are people everywhere. Run one over and Franzi gets mad and we start over.' } },
    ],
    accept: { de: 'Vollgas – aber vorsichtig!', en: 'Full throttle – but carefully!' },
    decline: { de: 'Ich lauf lieber.', en: 'I\'d rather walk.' },
    failDialog: [
      { who: 'flo', text: { de: 'Zu langsam! Der Generator ist aus. …Okay, er läuft wieder. Das Gerät liegt wieder am Firespace. Nochmal, schneller!', en: 'Too slow! The generator is off. …Okay, it\'s running again. The tool is back at the Firespace. Again, faster!' } },
    ],
    runOverDialog: [
      { who: 'flo', text: { de: 'Du hast jemanden UMGEFAHREN?! Mit MEINEM Quad?!', en: 'You ran someone OVER?! With MY quad?!' } },
      { who: 'franzi', text: { de: 'Dem geht\'s gut. Zum Glück. Aber so nicht. Nochmal – und diesmal mit Slalom.', en: 'They\'re okay. Luckily. But not like that. Again – and this time with slalom.' } },
    ],
    steps: [
      { type: 'pickup', text: { de: 'Hol das Diagnosegerät am Firespace – mit dem Quad, ohne jemanden umzufahren!', en: 'Get the diagnostic tool at the Firespace – by quad, without running anyone over!' }, items: [{ item: 'diag_device', at: 'fire_pit' }] },
      {
        type: 'talk', npc: 'flo', text: { de: 'Bring das Gerät zu Flo in die Crew-Base', en: 'Bring the tool to Flo at the crew base' }, consumes: ['diag_device'],
        dialog: [
          { who: 'flo', text: { de: 'Da ist es! Und keiner verletzt? Respekt. *steckt das Gerät an* …Aha. Der Generator hat Durst. Wie ich.', en: 'There it is! And nobody hurt? Respect. *plugs in the tool* …Aha. The generator is thirsty. Like me.' } },
        ],
      },
    ],
    reward: { karma: 40 },
  },

  // ================================================================== crews that build on their own
  // ------------------------------------------------------------------ N1 — Narnia Floor: screws & cable (Mia)
  {
    id: 'n1_narnia',
    title: { de: 'Narnia braucht Schrauben', en: 'Narnia Needs Screws' },
    giver: 'mia',
    day: 2,
    requires: ['q0_leo'],
    summary: { de: 'Mia und ihre Crew bauen den Narnia Floor. Ihnen gehen die Schrauben aus – und der DJ braucht Strom.', en: 'Mia and her crew are building the Narnia Floor. They\'re out of screws – and the DJ needs power.' },
    offer: [
      { who: 'mia', text: { de: 'Hiii! Ich bin Mia, das ist mein Narnia Floor. Also, wird er. Bruno, Daniel und Lenny helfen mir. Meistens.', en: 'Hiii! I\'m Mia, this is my Narnia Floor. Well, it will be. Bruno, Daniel and Lenny help me. Mostly.' } },
      { who: 'mia', text: { de: 'Bruno hat die letzten Schrauben… gegessen? Keine Ahnung. Kannst du uns eine Kiste Terrassenschrauben aus der Werkstatt holen? Und eine Kabeltrommel aus dem Hühnercontainer? Danke, du Engel!', en: 'Bruno used up the last screws… ate them? No idea. Could you bring us a box of deck screws from the workshop? And a cable drum from the chicken container? Thanks, you angel!' } },
    ],
    accept: { de: 'Klar, Mia!', en: 'Sure, Mia!' },
    decline: { de: 'Gleich!', en: 'In a bit!' },
    steps: [
      { type: 'pickup', text: { de: 'Hol Schrauben (Werkstatt) und eine Kabeltrommel (Hühnercontainer)', en: 'Get screws (workshop) and a cable drum (chicken container)' }, items: [{ item: 'narnia_screws', at: 'C1_front' }, { item: 'narnia_cable', at: 'C3_front' }] },
      {
        type: 'deliver', text: { de: 'Bring alles zum Narnia Floor', en: 'Bring it all to the Narnia Floor' },
        items: ['narnia_screws', 'narnia_cable'], plot: 'narnia_floor', buildTime: 1.5,
        buildLabel: { de: 'Material abgeben', en: 'Hand over material' },
      },
      {
        type: 'talk', npc: 'mia', text: { de: 'Sag Mia Bescheid', en: 'Tell Mia' },
        dialog: [
          { who: 'mia', text: { de: 'Du bist der Beste! Leute, SCHRAUBEN! …Lenny, nicht in den Mund. Danke. 💛', en: 'You\'re the best! Guys, SCREWS! …Lenny, not in your mouth. Thanks. 💛' } },
          { who: 'mia', text: { de: 'Jetzt machen wir den Boden fertig – und dann kommt der Elefant! Unser DJ-Pult. Schau später nochmal vorbei!', en: 'Now we finish the floor – and then comes the elephant! Our DJ booth. Come back later!' } },
        ],
      },
    ],
    reward: { karma: 15 },
  },
  // ------------------------------------------------------------------ N2 — the wardrobe (Mia)
  {
    id: 'n2_narnia',
    title: { de: 'Der Weg nach Narnia', en: 'The Way to Narnia' },
    giver: 'mia',
    day: 3,
    requires: ['n1_narnia', 'q2_sails'],
    summary: { de: 'Der Eingang zum Narnia Floor ist ein alter Kleiderschrank. Er steht am Parkplatz und ist schwer.', en: 'The entrance to the Narnia Floor is an old wardrobe. It\'s at the parking and it\'s heavy.' },
    offer: [
      { who: 'mia', text: { de: 'Der Boden steht! Jetzt fehlt der Eingang: ein alter Kleiderschrank. Da geht man rein – und ist in Narnia. Magisch, oder?', en: 'The floor is done! Now the entrance is missing: an old wardrobe. You walk in – and you\'re in Narnia. Magical, right?' } },
      { who: 'mia', text: { de: 'Er steht am Parkplatz. Daniel wollte ihn tragen. Daniel liegt jetzt im Schatten. Nimm lieber den Radlader.', en: 'It\'s at the parking. Daniel wanted to carry it. Daniel is now lying in the shade. Better take the loader.' } },
    ],
    accept: { de: 'Ich hol den Schrank!', en: 'I\'ll get the wardrobe!' },
    decline: { de: 'Später.', en: 'Later.' },
    steps: [
      { type: 'pickup', text: { de: 'Lade den Kleiderschrank am Parkplatz auf (Radlader)', en: 'Load the wardrobe at the parking (loader)' }, items: [{ item: 'wardrobe', at: 'parking' }] },
      {
        type: 'deliver', text: { de: 'Bring den Schrank zum Narnia Floor', en: 'Bring the wardrobe to the Narnia Floor' },
        items: ['wardrobe'], plot: 'narnia_floor', buildTime: 2,
        buildLabel: { de: 'Schrank abladen', en: 'Unload wardrobe' },
      },
      {
        type: 'talk', npc: 'mia', text: { de: 'Sprich mit Mia', en: 'Talk to Mia' },
        dialog: [
          { who: 'mia', text: { de: 'JAAA! Bruno, Lenny – aufstellen! Nein, nicht liegend. STEHEND. …Danke.', en: 'YESSS! Bruno, Lenny – set it up! No, not lying down. STANDING. …Thanks.' } },
          { who: 'mia', text: { de: 'Und Daniel spannt mit Lenny das Stretchzelt über den Floor. Das wird so schön. 💛', en: 'And Daniel and Lenny are putting the stretch tent up over the floor. This is going to be so pretty. 💛' } },
        ],
      },
    ],
    reward: { karma: 20 },
  },
  // ------------------------------------------------------------------ N3 — snow & light (Mia)
  {
    id: 'n3_narnia',
    title: { de: 'Ewiger Winter', en: 'Eternal Winter' },
    giver: 'mia',
    day: 4,
    requires: ['n2_narnia', 'q4_lights'],
    summary: { de: 'Für das Königszelt (Chill-out) braucht Mia Kunstschnee aus dem Hühnercontainer und die Laterne aus dem Büro.', en: 'For the royal tent (chill-out) Mia needs fake snow from the chicken container and the lantern from the office.' },
    offer: [
      { who: 'mia', text: { de: 'Fast fertig! Neben den Floor kommt noch das Königszelt zum Chillen. Dafür brauch ich Kunstschnee aus dem Hühnercontainer, ganz oben.', en: 'Almost done! Next to the floor goes the royal tent for chilling. For that I need fake snow from the chicken container, right at the top.' } },
      { who: 'mia', text: { de: 'Und Jan hat meine Laterne im Büro als Schreibtischlampe. Frag nicht. Hol sie einfach. Lieb, aber bestimmt.', en: 'And Jan is using my lantern as a desk lamp in the office. Don\'t ask. Just get it. Kindly but firmly.' } },
    ],
    accept: { de: 'Winter kommt!', en: 'Winter is coming!' },
    decline: { de: 'Gleich.', en: 'In a bit.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol den Kunstschnee (Hühnercontainer) und die Laterne (Büro)', en: 'Get the fake snow (chicken container) and the lantern (office)' }, items: [{ item: 'fake_snow', at: 'C4_front' }, { item: 'lantern', at: 'office_inside' }] },
      {
        type: 'deliver', text: { de: 'Bring alles zum Narnia Floor', en: 'Bring it all to the Narnia Floor' },
        items: ['fake_snow', 'lantern'], plot: 'narnia_floor', buildTime: 1.5,
        buildLabel: { de: 'Winter abgeben', en: 'Hand over winter' },
      },
      {
        type: 'talk', npc: 'mia', text: { de: 'Sprich mit Mia', en: 'Talk to Mia' },
        dialog: [
          { who: 'mia', text: { de: 'Schau! Der Elefant legt auf, und im Königszelt kann man sich ausruhen. Das ist der schönste Floor, den wir je hatten.', en: 'Look! The elephant is spinning records, and you can rest in the royal tent. This is the prettiest floor we\'ve ever had.' } },
          { who: 'mia', text: { de: 'Und du hast geholfen. Also… ein bisschen. Nein, viel! Danke dir! 💛', en: 'And you helped. Well… a bit. No, a lot! Thank you! 💛' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },
  // ------------------------------------------------------------------ F1 — Fabbe needs tools
  {
    id: 'f1_fabbe_tools',
    title: { de: 'Fabbe braucht Werkzeug', en: 'Fabbe Needs Tools' },
    giver: 'fabbe',
    day: 3, night: true,
    requires: ['q8_forestdome'],
    summary: { de: 'Fabbe baut noch die Bühne im Dome. Er braucht Akkuschrauber und Wasserwaage aus dem Künstlergasse-Container.', en: 'Fabbe is still building the stage inside the dome. He needs the drill and the spirit level from the Künstlergasse container.' },
    offer: [
      { who: 'fabbe', text: { de: 'Hey du! Schön dich zu sehen! Die Bühne im Dome ist schief. Also, künstlerisch schief. Aber zu schief.', en: 'Hey you! Great to see you! The stage in the dome is crooked. Artistically crooked. But too crooked.' } },
      { who: 'fabbe', text: { de: 'Bringst du mir Akkuschrauber und Wasserwaage aus dem Künstlergasse-Container? Den Rest mach ich.', en: 'Could you bring me the drill and the spirit level from the Künstlergasse container? I\'ll do the rest.' } },
    ],
    accept: { de: 'Bin gleich zurück!', en: 'Be right back!' },
    decline: { de: 'Später, Fabbe.', en: 'Later, Fabbe.' },
    steps: [
      { type: 'pickup', text: { de: 'Hol Akkuschrauber und Wasserwaage (Künstlergasse)', en: 'Get the drill and the spirit level (Künstlergasse)' }, items: [{ item: 'drill', at: 'C2_front' }, { item: 'spirit_level', at: 'C2_front' }] },
      {
        type: 'deliver', text: { de: 'Bring das Werkzeug zu Fabbe', en: 'Bring the tools to Fabbe' },
        items: ['drill', 'spirit_level'], plot: 'forest_dome', buildTime: 1.2,
        buildLabel: { de: 'Werkzeug übergeben', en: 'Hand over tools' },
      },
      {
        type: 'talk', npc: 'fabbe', text: { de: 'Sprich mit Fabbe', en: 'Talk to Fabbe' },
        dialog: [
          { who: 'fabbe', text: { de: 'Perfekt! Die Wasserwaage sagt: gerade. Mein Herz sagt: magisch. Danke!', en: 'Perfect! The spirit level says: straight. My heart says: magical. Thanks!' } },
        ],
      },
    ],
    reward: { karma: 15 },
  },

  // ================================================================== timed side jobs
  // ------------------------------------------------------------------ S1 — veggie emergency (Sabse)
  {
    id: 's1_veggies',
    title: { de: 'Gemüse-Notfall', en: 'Veggie Emergency' },
    giver: 'sabse',
    day: 2,
    requires: ['q1_rigging'],
    timeLimit: 150,
    summary: { de: 'Der Gemüse-Lieferwagen steht am Parkplatz. In 2½ Minuten ist Mittagessen. Los!', en: 'The veggie van is at the parking. Lunch is in 2½ minutes. Go!' },
    offer: [
      { who: 'sabse', text: { de: 'Du. Ja, du. Der Gemüse-Lieferant hat alles am Parkplatz abgeladen statt hier. Natürlich.', en: 'You. Yes, you. The veggie supplier dumped everything at the parking instead of here. Of course.' } },
      { who: 'sabse', text: { de: 'Drei Kisten. In zweieinhalb Minuten ist Mittagessen. Wenn das Gemüse nicht da ist, gibt\'s für alle nur Reis. Und DU erklärst das.', en: 'Three crates. Lunch is in two and a half minutes. If the veggies aren\'t here, everyone gets plain rice. And YOU explain it.' } },
    ],
    accept: { de: 'Bin schon unterwegs!', en: 'On my way!' },
    decline: { de: 'Reis ist auch gut…', en: 'Rice is fine too…' },
    failDialog: [
      { who: 'sabse', text: { de: 'ZU SPÄT! Alle essen Reis. Alle schauen mich an. Ich schau DICH an.', en: 'TOO LATE! Everyone\'s eating rice. Everyone\'s looking at me. I\'m looking at YOU.' } },
      { who: 'sabse', text: { de: 'Der Lieferant hat nochmal drei Kisten am Parkplatz abgeladen. Nochmal. Diesmal schneller. Nimm das Quad!', en: 'The supplier dropped another three crates at the parking. Again. Faster this time. Take the quad!' } },
    ],
    steps: [
      {
        type: 'pickup', text: { de: 'Hol die 3 Gemüsekisten am Parkplatz', en: 'Get the 3 veggie crates at the parking' },
        items: [{ item: 'veggie_a', at: 'parking', search: 12 }, { item: 'veggie_b', at: 'parking', search: 12 }, { item: 'veggie_c', at: 'parking', search: 12 }],
      },
      {
        type: 'deliver', text: { de: 'Bring das Gemüse in die Küche – rennen verboten!', en: 'Bring the veggies to the kitchen – no running!' },
        items: ['veggie_a', 'veggie_b', 'veggie_c'], at: 'kitchen', radius: 8, buildTime: 1.5,
        buildLabel: { de: 'Gemüse abliefern', en: 'Deliver veggies' },
      },
      {
        type: 'talk', npc: 'sabse', text: { de: 'Sag Sabse Bescheid', en: 'Tell Sabse' },
        dialog: [
          { who: 'sabse', text: { de: 'Hm. Pünktlich. Und nicht gerannt. …Du darfst heute als Erster essen.', en: 'Hm. On time. And no running. …You get to eat first today.' } },
          { who: 'sabse', text: { de: '…Und jetzt raus aus meiner Küche. Freundlich gemeint.', en: '…And now get out of my kitchen. In a friendly way.' } },
        ],
      },
    ],
    reward: { karma: 20 },
  },

  // ------------------------------------------------------------------ S2 — thunderstorm (Corni)
  {
    id: 's2_storm',
    title: { de: 'Gewitter im Anmarsch!', en: 'Thunderstorm Incoming!' },
    giver: 'corni',
    day: 2, night: true,
    requires: ['q4_lights'],
    timeLimit: 110,
    weather: 'rain',
    summary: { de: 'Ein Gewitter zieht auf. Planen über Generatoren und Bühnentechnik, bevor alles absäuft.', en: 'A storm is coming. Tarps over the generators and stage gear before everything drowns.' },
    offer: [
      { who: 'corni', text: { de: 'Siehst du die Wolken da hinten? Die sind nicht gut. Die sind gar nicht gut.', en: 'See those clouds back there? Not good. Not good at all.' } },
      { who: 'corni', text: { de: 'Planen liegen vor dem Hühnercontainer. Über den Generator in der Base, den am Festivalgelände und die Mainstage-Technik. Schnell!', en: 'Tarps are in front of the chicken container. Over the generator in the base, the one on the festival ground and the mainstage gear. Quick!' } },
    ],
    accept: { de: 'Ich renn!', en: 'I\'ll run!' },
    decline: { de: 'Ist doch nur Wasser…', en: 'It\'s just water…' },
    failDialog: [
      { who: 'corni', text: { de: 'Alles nass. Die Boxen machen komische Geräusche. Felix macht noch komischere Geräusche.', en: 'Everything\'s soaked. The speakers make weird noises. Felix makes even weirder noises.' } },
      { who: 'felix', text: { de: 'Das Gewitter kommt zurück. Das tun Gewitter hier. Diesmal schneller, ja?', en: 'The storm is coming back. Storms do that here. Faster this time, yes?' } },
    ],
    steps: [
      { type: 'pickup', text: { de: 'Hol die Planen vor dem Hühnercontainer', en: 'Get the tarps in front of the chicken container' }, items: [{ item: 'tarps', at: 'C3_front' }] },
      {
        type: 'work', text: { de: 'Deck Generatoren & Bühnentechnik ab', en: 'Cover generators & stage gear' },
        targets: ['generator', 'festival_generator_side', 'stage_front'], workTime: 2.5,
        label: { de: 'Plane drüber', en: 'Tarp over it' }, consumes: ['tarps'],
        minigame: 'mash', minigameTitle: { de: 'Plane festzurren – der Wind zieht!', en: 'Strap the tarp down – the wind is pulling!' }, minigameOpts: { need: 11, time: 4 },
        minigameFail: { de: 'Die Plane ist weggeflogen. Richtung Karlsfeld. Schnapp sie dir!', en: 'The tarp blew away. Towards Karlsfeld. Grab it!' },
      },
      {
        type: 'talk', npc: 'corni', text: { de: 'Melde dich bei Corni', en: 'Report to Corni' },
        dialog: [
          { who: 'corni', text: { de: 'Trocken! Also, die Technik. Du bist klatschnass. Aber die Technik ist trocken.', en: 'Dry! Well, the gear is. You\'re soaked. But the gear is dry.' } },
        ],
      },
    ],
    reward: { karma: 25 },
  },
];
