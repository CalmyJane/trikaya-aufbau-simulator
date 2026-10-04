// Small conversations with answer options. Talking to people (instead of plain small talk) can earn or
// cost a little karma. Named characters have their own chats (each used once), volunteers share a pool.
//   { line, options: [{ text, karma, reply }] }

const C = (de, en) => ({ de, en });

export const CHATS = {
  corni: [
    { line: C('Ehrlich: Glaubst du, wir werden rechtzeitig fertig?', 'Honestly: do you think we\'ll finish in time?'), options: [
      { text: C('Klar. Wir bauen das jetzt einfach.', 'Sure. We\'ll just build it.'), karma: 3, reply: C('DAS ist die richtige Einstellung!', 'THAT\'S the right attitude!') },
      { text: C('Wenn Leo mal auftaucht…', 'If Leo ever shows up…'), karma: 1, reply: C('Dann werden wir NIE fertig. Haha.', 'Then we\'ll NEVER finish. Haha.') },
      { text: C('Nö. Nie im Leben.', 'Nope. Not a chance.'), karma: -2, reply: C('…Danke. Sehr motivierend.', '…Thanks. Very motivating.') },
    ] },
    // running gag: the rigging material
    { line: C('Sag mal… hast du eigentlich das Rigging-Material? Die Stahlseile für die Mainstage?', 'Say… have you actually got the rigging material? The steel wires for the mainstage?'), options: [
      { text: C('Die hängen doch schon seit Montag!', 'They\'ve been up since Monday!'), karma: 1, reply: C('Ach ja. …Und die ANDEREN Stahlseile?', 'Oh right. …And the OTHER steel wires?') },
      { text: C('Ich schau gleich nochmal nach.', 'I\'ll check again in a sec.'), karma: 2, reply: C('Super. Das brauchen wir DRINGEND.', 'Great. We need that URGENTLY.') },
      { text: C('Frag doch Leo.', 'Ask Leo.'), karma: -1, reply: C('Hab ich. Leo meinte, ich soll dich fragen.', 'I did. Leo said to ask you.') },
    ] },
  ],
  matze: [
    { line: C('Moment… hab ich dir schon gesagt, was du machen sollst? Oder hab ich das nur gedacht?', 'Wait… did I already tell you what to do? Or did I just think it?'), options: [
      { text: C('Du hast es gesagt. Alles gut, Matze.', 'You said it. All good, Matze.'), karma: 2, reply: C('Puh. Danke. Ich trink noch einen Kaffee.', 'Phew. Thanks. I\'ll have another coffee.') },
      { text: C('Nein, aber ich hab\'s trotzdem schon gemacht.', 'No, but I did it anyway.'), karma: 3, reply: C('Du bist ja Gedankenleser! Wahnsinn.', 'You\'re a mind reader! Amazing.') },
      { text: C('Matze, du vergisst echt alles.', 'Matze, you really forget everything.'), karma: -2, reply: C('Was? …Was wollte ich sagen?', 'What? …What was I going to say?') },
    ] },
  ],
  fabi: [
    { line: C('Hast du zufällig mein Maßband gesehen? Gelb. Fünf Meter. Mein Leben.', 'Have you seen my tape measure by any chance? Yellow. Five metres. My life.'), options: [
      { text: C('Ich halt die Augen offen!', 'I\'ll keep my eyes open!'), karma: 2, reply: C('Danke. Du bist meine einzige Hoffnung.', 'Thanks. You\'re my only hope.') },
      { text: C('Liegt bestimmt in der Werkstatt. Oder im Hühnercontainer.', 'Probably in the workshop. Or the chicken container.'), karma: 1, reply: C('…Das sag ich sonst immer. Fühlt sich komisch an.', '…That\'s what I always say. Feels weird.') },
      { text: C('Frag doch Leo.', 'Ask Leo.'), karma: -1, reply: C('Sehr witzig.', 'Very funny.') },
    ] },
  ],
  jan: [
    { line: C('Ich hab heute 43 Bändchen ausgegeben. Und 40 davon an Leute, die schon eins hatten.', 'I handed out 43 wristbands today. And 40 to people who already had one.'), options: [
      { text: C('Du machst einen super Job, Jan.', 'You\'re doing a great job, Jan.'), karma: 3, reply: C('…Danke. Das sagt mir sonst nie jemand.', '…Thanks. Nobody ever tells me that.') },
      { text: C('Kann ich noch eins haben?', 'Can I have another one?'), karma: -1, reply: C('NEIN.', 'NO.') },
      { text: C('Hat Leo eins?', 'Does Leo have one?'), karma: 1, reply: C('Leo hat sechs. Er verliert sie immer.', 'Leo has six. He keeps losing them.') },
    ] },
  ],
  sabse: [
    { line: C('Was gibt\'s? Ich hab drei Töpfe auf dem Feuer und null Geduld.', 'What is it? I\'ve got three pots on the fire and zero patience.'), options: [
      { text: C('Riecht unglaublich gut hier!', 'It smells amazing in here!'), karma: 3, reply: C('…Hm. Danke. Du darfst probieren. Einen Löffel.', '…Hm. Thanks. You may taste. One spoon.') },
      { text: C('Was gibt\'s heute?', 'What\'s for food today?'), karma: 0, reply: C('Linsen. Wie gestern. Wie morgen.', 'Lentils. Like yesterday. Like tomorrow.') },
      { text: C('Kann ich schon was essen?', 'Can I eat already?'), karma: -2, reply: C('Um EINS. RAUS.', 'At ONE. OUT.') },
    ] },
  ],
  franzi: [
    { line: C('Wie geht\'s dir eigentlich? Also wirklich?', 'How are you actually? Really?'), options: [
      { text: C('Gut! Danke, dass du fragst.', 'Good! Thanks for asking.'), karma: 2, reply: C('Schön. Und trink Wasser. Ich mein\'s ernst.', 'Good. And drink water. I mean it.') },
      { text: C('Ehrlich gesagt bisschen fertig.', 'Honestly, a bit exhausted.'), karma: 3, reply: C('Danke, dass du das sagst. Mach mal Pause, das ist okay.', 'Thanks for saying that. Take a break, that\'s okay.') },
      { text: C('Keine Zeit für Gefühle, ich muss bauen.', 'No time for feelings, I have to build.'), karma: -2, reply: C('Gefühle bauen auch. Nur langsamer.', 'Feelings build too. Just slower.') },
    ] },
  ],
  juli: [
    { line: C('Was.', 'What.'), options: [
      { text: C('Danke, dass du immer alles prüfst.', 'Thanks for always checking everything.'), karma: 3, reply: C('…Gern. Glaub ich.', '…You\'re welcome. I think.') },
      { text: C('Nix. Nur hallo.', 'Nothing. Just hi.'), karma: 0, reply: C('Hallo. Und tschüss.', 'Hi. And bye.') },
      { text: C('Du bist ganz schön grummelig.', 'You\'re pretty grumpy.'), karma: -2, reply: C('Und du stehst im Licht.', 'And you\'re in my light.') },
    ] },
  ],
  estenko: [
    { line: C('Ey mann… hast du schon mal einen Drachen gesehen? Einen echten?', 'Hey man… ever seen a dragon? A real one?'), options: [
      { text: C('Der an der Mainstage zählt doch!', 'The one at the mainstage counts!'), karma: 2, reply: C('Ey mann… RESPEKT. Der zählt.', 'Hey man… RESPECT. That one counts.') },
      { text: C('Zdenko, du bist betrunken.', 'Zdenko, you\'re drunk.'), karma: -1, reply: C('Ein bisschen. Ein bisschen viel. HIYAAA!', 'A little. A little a lot. HIYAAA!') },
      { text: C('Zeig mir lieber Kung Fu.', 'Show me kung fu instead.'), karma: 1, reply: C('HIYAAA! …Rücken.', 'HIYAAA! …My back.') },
    ] },
  ],
  thomas: [
    { line: C('Hey! Läuft alles bei dir? Kann ich irgendwas für dich tun?', 'Hey! Everything going well? Can I do anything for you?'), options: [
      { text: C('Alles gut – danke, dass du immer hilfst!', 'All good – thanks for always helping!'), karma: 3, reply: C('Ach, gerne! Dafür sind wir doch da.', 'Oh, my pleasure! That\'s what we\'re here for.') },
      { text: C('Wo ist eigentlich Felix?', 'Where\'s Felix, actually?'), karma: 1, reply: C('Beim Generator. Er redet mit ihm. Wirklich.', 'At the generator. He\'s talking to it. Really.') },
    ] },
  ],
  felix: [
    { line: C('Weißt du eigentlich, wie viel Ampere so ein Festival zieht?', 'Do you know how many amps a festival draws?'), options: [
      { text: C('Erzähl! Das interessiert mich wirklich.', 'Tell me! I\'m genuinely interested.'), karma: 3, reply: C('ENDLICH fragt mal jemand. Also: Drehstrom…', 'FINALLY someone asks. So: three-phase…') },
      { text: C('Viele?', 'A lot?'), karma: 0, reply: C('…Ja. Viele. Genau.', '…Yes. A lot. Exactly.') },
      { text: C('Ist mir ehrlich gesagt egal.', 'Honestly, I don\'t care.'), karma: -2, reply: C('Merkt man.', 'It shows.') },
    ] },
  ],
  mark: [
    { line: C('Willst du wissen, was das Geheimnis von gutem Chai ist?', 'Want to know the secret of good chai?'), options: [
      { text: C('Unbedingt!', 'Absolutely!'), karma: 2, reply: C('Zeit. Und Kardamom. Vor allem Zeit.', 'Time. And cardamom. Mostly time.') },
      { text: C('Kardamom?', 'Cardamom?'), karma: 3, reply: C('DU verstehst es. Du kriegst den nächsten Chai als Erster.', 'YOU get it. You get the next chai first.') },
      { text: C('Ich trink lieber Kaffee.', 'I prefer coffee.'), karma: -2, reply: C('…Ich tu so, als hätte ich das nicht gehört.', '…I\'ll pretend I didn\'t hear that.') },
    ] },
  ],
  mia: [
    { line: C('Wie findest du den Narnia Floor bis jetzt? Ehrlich!', 'What do you think of the Narnia Floor so far? Honestly!'), options: [
      { text: C('Magisch. Der Elefant ist der Hammer.', 'Magical. The elephant is amazing.'), karma: 3, reply: C('JAAA! Ich wusste es! 💛', 'YESSS! I knew it! 💛') },
      { text: C('Wird schon. Fehlt halt noch viel.', 'Getting there. Still a lot missing.'), karma: 0, reply: C('Ich weiß… Bruno! Weiterschrauben!', 'I know… Bruno! Keep screwing!') },
    ] },
  ],
  schwarzhuber: [
    { line: C('Na, du. Gfoid da mei Wiesn?', 'Well then. Do you like my meadow?'), options: [
      { text: C('Die schönste Wiese in ganz Allach!', 'The prettiest meadow in all of Allach!'), karma: 3, reply: C('Schmeichler. Aber recht hast.', 'Flatterer. But you\'re right.') },
      { text: C('Wir passen auch gut drauf auf. Versprochen.', 'We\'ll take good care of it. Promise.'), karma: 2, reply: C('Des sagt\'s ihr jedes Jahr. Und jedes Jahr glaub i\'s.', 'You say that every year. And every year I believe it.') },
      { text: C('Ist halt ein Acker.', 'It\'s just a field.'), karma: -3, reply: C('A Acker. Soso. Dilettant.', 'A field. I see. Amateur.') },
    ] },
  ],
  mehdi: [
    { line: C('Ey… weißt du, warum ich hier sitze?', 'Hey… do you know why I\'m sitting here?'), options: [
      { text: C('Wegen der Musik?', 'Because of the music?'), karma: 2, reply: C('Ja! Genau. Danke. Das hatte ich vergessen.', 'Yes! Exactly. Thanks. I\'d forgotten.') },
      { text: C('Corni sucht dich übrigens.', 'Corni is looking for you, by the way.'), karma: 1, reply: C('Oh. …Weißt du, wofür?', 'Oh. …Do you know what for?') },
    ] },
  ],
  rocky: [
    { line: C('Duuude… wenn ein Baum im Wald umfällt und keiner ist da… ist dann Bass?', 'Duuude… if a tree falls in the forest and nobody\'s there… is there bass?'), options: [
      { text: C('Immer, Rocky. Immer.', 'Always, Rocky. Always.'), karma: 2, reply: C('Woah. Danke. Das hat mein Leben verändert.', 'Whoa. Thanks. That changed my life.') },
      { text: C('Rocky, trag doch mal was.', 'Rocky, carry something.'), karma: 1, reply: C('…Gleich. Nach dem Sonnenuntergang.', '…Soon. After sunset.') },
    ] },
  ],
  isi: [
    { line: C('Ich hab heute schon zwölf Kisten getragen! Und du?', 'I\'ve carried twelve crates already today! And you?'), options: [
      { text: C('Du bist der Wahnsinn, Isi!', 'You\'re amazing, Isi!'), karma: 3, reply: C('Ach was! Komm, wir schaffen das zusammen!', 'Oh, stop it! Come on, we\'ll do it together!') },
      { text: C('Dreizehn.', 'Thirteen.'), karma: 1, reply: C('Ha! Challenge accepted!', 'Ha! Challenge accepted!') },
    ] },
  ],
};

// shared by all random volunteers
export const CAMPER_CHATS = [
  { line: C('Weißt du, wo es Essensmarken gibt?', 'Do you know where to get food tokens?'), options: [
    { text: C('Bei Leo. Viel Glück.', 'From Leo. Good luck.'), karma: 1, reply: C('Leo? …Ah. Verstehe. Also nie.', 'Leo? …Ah. Got it. So never.') },
    { text: C('Keine Ahnung, aber ich frag für dich rum!', 'No idea, but I\'ll ask around for you!'), karma: 3, reply: C('Du bist ein Schatz!', 'You\'re a treasure!') },
    { text: C('Marken sind ein Konstrukt.', 'Tokens are a construct.'), karma: 0, reply: C('…Stimmt eigentlich. Woah.', '…Actually true. Whoa.') },
  ] },
  { line: C('Kannst du mal kurz mit anfassen?', 'Can you give me a hand for a sec?'), options: [
    { text: C('Klar, her damit!', 'Sure, hand it over!'), karma: 3, reply: C('Danke! Du bist super.', 'Thanks! You\'re great.') },
    { text: C('Sorry, ich hab grad einen Auftrag.', 'Sorry, I\'m on a job right now.'), karma: 0, reply: C('Kein Ding. Ich frag Basti.', 'No worries. I\'ll ask Basti.') },
    { text: C('Frag Leo.', 'Ask Leo.'), karma: -2, reply: C('Haha. Witzig. Nicht.', 'Haha. Funny. Not.') },
  ] },
  { line: C('Ich bin so müde… Ich steh seit sechs auf dem Acker.', 'I\'m so tired… I\'ve been on this field since six.'), options: [
    { text: C('Trink Wasser und mach zehn Minuten Pause.', 'Drink some water and take ten.'), karma: 3, reply: C('Gute Idee. Danke, wirklich.', 'Good idea. Thanks, really.') },
    { text: C('Reiß dich zusammen, morgen ist Festival!', 'Pull yourself together, the festival is tomorrow!'), karma: -2, reply: C('…Wow. Okay.', '…Wow. Okay.') },
    { text: C('Ich auch. Wir schaffen das.', 'Me too. We\'ll make it.'), karma: 2, reply: C('Zusammen. Ja.', 'Together. Yes.') },
  ] },
  { line: C('Hast du die Spezial-Nuss für die Bauzäune gesehen?', 'Have you seen the special nut for the construction fences?'), options: [
    { text: C('Nein, aber ich halt die Augen offen.', 'No, but I\'ll keep an eye out.'), karma: 2, reply: C('Danke! Die Nuss ist unsere letzte Hoffnung.', 'Thanks! The nut is our last hope.') },
    { text: C('Gibt\'s die überhaupt?', 'Does it even exist?'), karma: 1, reply: C('…Jetzt hast du mich verunsichert.', '…Now you\'ve made me unsure.') },
  ] },
  { line: C('Sag mal, wie gefällt dir das Gelände bis jetzt?', 'Hey, how do you like the site so far?'), options: [
    { text: C('Wunderschön. Ihr macht das toll.', 'Beautiful. You\'re all doing great.'), karma: 3, reply: C('Ach, das tut gut zu hören!', 'Aw, that\'s nice to hear!') },
    { text: C('Chaotisch. Aber schön chaotisch.', 'Chaotic. But nicely chaotic.'), karma: 1, reply: C('Das ist das Trikaya-Gefühl!', 'That\'s the Trikaya feeling!') },
    { text: C('Zu viele Hippies.', 'Too many hippies.'), karma: -3, reply: C('…Du bist barfuß, weißt du das?', '…You\'re barefoot, you know that?') },
  ] },
];
