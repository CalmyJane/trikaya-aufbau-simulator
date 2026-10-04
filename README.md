# Trikaya Aufbau Simulator

A small 3rd-person parody "construction simulator" of the Trikaya festival Aufbau
(München-Allach, Enterstraße / Gündinger Weg). Run around the site, get jobs from the
crew, find stuff that is never where it should be, drive the quad and the Radlader,
and build the festival piece by piece. Leo is in charge. Nobody has ever found Leo.

German by default, English in *Einstellungen / Settings*.

Built with **three.js** + **Vite**. Characters and props are CC0 glTFs; the dragon
mainstage, tents, vehicles, hair, patchwork clothes, map and sounds are procedural.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
```

`http://localhost:5173/dev/lineup.html` shows all crew looks side by side (handy when tuning looks).

## Controls

| Key | Action |
|---|---|
| WASD | walk / drive · **Shift** sprint · **Space** jump / handbrake |
| Mouse | click the game to capture the mouse · wheel zoom · camera auto-follows while moving |
| Q / R | rotate camera with keyboard |
| E | talk / pick up / build / enter & exit vehicles / load the Radlader bucket |
| F | wave |
| J | quest log · **T** cycle tracked quest |
| M | site map · **N** mute · **Esc** pause (autosaves) |

## The crew

| Who | Role | Behaviour |
|---|---|---|
| Leo | build lead | never findable — flees and teleports when you get close |
| Jan | registration (office) | gives the first job; until then everyone yells *„Hast du ein Bändchen?“* |
| Corni, Matze | construction | Matze is… sometimes confused |
| Fabi | equipment | knows where everything is (mostly), calms kitchen fights, sells pro gaffa |
| Mark | Chai Lounge | sells cheap mate & chai for karma once his tent stands |
| Franzi | awareness & first aid | fixes nails, passed-out and wasted people; builds the awareness tent |
| Sabse | kitchen | throws you out for running, jumping or driving in her kitchen |
| Felix | power & light | the night mission; slightly arrogant |
| Fabbe | Forest Dome | builds his dome himself (with Niklas) – you bring the material and tools |
| Schwarzhuber | farmer, owns the field | curly red-blond hair & beard; strolls by, hangs out with Zdenko & Thompsen, finds everything *dilettantisch* – but loves the hippies |
| Thomas | power & light, helps everyone | tall, short black beard, super friendly; helps Felix and now and then takes over one of your work targets |
| Mahdi | hangs out in Corni's cabin | always a bit confused, listens to music |
| Mia | Narnia Floor | always friendly, sometimes annoyed; her crew Bruno, Daniel & Lenny build the floor in stages |
| Aphi, Mux, Dennis | fire island | practise with contact staff, poi & hoop in front of Shiva (LEDs by day, fire at night) |
| Harry | deco & 3D mapping | wooden sculpture behind the Forest Dome, mapped at night |
| Niklas | helps everywhere | sometimes a bit high |
| Zdenko | ??? | drunk kung-fu wanderer, sits with Thompsen, pesters you when you go AFK |
| Thompsen | morale | sits on the beer bench and laughs |
| Flo, Andi | tech | repair the quad; Andi also the generator / poo pump |
| Juli | gets it done | unfriendly, checks your work, repairs pump & generator |
| Rocky, Isi, Verena | volunteers | Rocky is often high, Isi sober and helpful (walks all over the site), Verena (bar) arrives shortly before the festival |
| + random volunteers | — | more arrive (and more tents) with every finished job |

## Jobs

0. *Wo ist Leo?* – register with Jan in the office, search Leo (gate → kitchen → mainstage)
1a. *Löcher im Acker* – find the earth auger (broken), a second one (also broken), Jan drives to the DIY store (−690 €), drill the holes and set the 6 posts
1. *Drachen-Rigging* – the old steel wires are rusty: Leo (!) and Corni drive to the DIY store (−1,480 €), then rig the 6 posts
2. *Sonnensegel & Diesel* – fuel the Radlader, hang the goa shade sails
3. *Kein Festival ohne Klo* – 2 Dixi pallets from the crew camp to their spots (Radlader), WC container, connect the *Kackepumpe*
4. *Es werde Licht* – **timed**: night falls, build all 8 light masts before you can't see anything
5. *Chai-os-Theorie* · 6. *Awareness-Zelt* · 7. *Dome Sweet Dome* · 8. *Forest Dome*
6. *Awareness-Zelt* is available early (after the rigging) – you'll need it for the drama.
9. *O'zapft is?* – Festzelt; Verena arrives
10. *Holz & Licht* – Harry's giant wooden sculpture, 3D-mapped at night
- Side jobs: *Narnia* ×3 for Mia (screws & cable, the wardrobe via Radlader, snow & lantern – each lets her crew build the next stage), *Fabbe braucht Werkzeug*, timed *Gemüse-Notfall* and *Gewitter*.

## Drama (random, after the first real job)

Nails in bare feet (Franzi treats on the spot), people passing out, too drunk, too high or deep
in a k-hole (Franzi walks them to the **awareness tent** – they talk nonsense on the way – and
looks after them there), kitchen fights (Fabi or Jan, Leo is useless), broken generator
(Felix/Andi/Juli or buy a new one), broken *Kackepumpe* (Juli/Andi). Story people (Corni, Matze,
Felix, …) can be the wasted ones: they can't give or continue jobs until Franzi has taken care
of them – and she needs her awareness tent for that. Ignoring drama costs money and karma.

People who need help show a **red !** – talk to them to find out what happened, then the clock
starts to fetch the right helper.

## Police

Wander too far off the festival site into the fields and the police picks you up. Jan bails you
out (500 € from the already negative budget).

## Karma economy (people on site)

Karma comes from jobs and from helping people. There is no shop menu – people sell things:
**Mark** (after the chai tent): cheap **Mate** (walk faster) and **Chai** (unlimited sprint);
**Fabi**: **Profi-Gaffa** (next 3 builds twice as fast). Now and then a volunteer shows a
**blue !** and offers **Speed** (run like the Radlader) or **Keta** (the next quest giver does one
step for you) – buy it or say no (+2 karma). While you're on something, people comment on it.
Three doses in a short time and you collapse, wake up in the awareness tent and lose all karma.

## Music, soundboxes, vehicles

- `core/Music.js`: the mainstage always plays (range ~175 m), the Forest Dome once it stands (~120 m). Tracks live in `public/music/` and play as a playlist; volume, low-pass and stereo pan follow distance and camera.
- Soundboxes are forbidden on the camping (signs, and Jan tells you at the start). Every few minutes campers crank one up anyway – walk over, tell them off: +15 karma.
- Also for sale: **Weed** (dealers; jump higher, afterimage trails) and **Beer** (Thompsen; every chat +2 karma while you're tipsy, but quad/Radlader start to slalom; five beers → Franzi).
- Running people over with the quad/Radlader: they fly, get up and react – oblivious (−3), annoyed (−10) or furious (−20 karma).
- Catch Leo (speed helps, or corner him) and he gives you a drink token worth 40 karma – nobody else knows where the tokens come from.

## NPC pathfinding

`core/NavGrid.js` rasterises all colliders into a 0.5 m grid (rebuilt whenever colliders change).
NPCs walk straight when the line is free, otherwise they follow a smoothed A* path (time-budgeted
to 6 ms per frame), so they get around fences, containers, hedges and through gates.

## Timed jobs

*Es werde Licht* (night falls), *Gemüse-Notfall* (Sabse, 150 s) and *Gewitter im Anmarsch!*
(Corni, 110 s, with rain). Fail and you get scolded and try again.

## Money

Tickets sell by themselves (faster the more is built), everything costs money, random bills
arrive (GEMA, fence rental, Mate…). The festival **never** makes a profit – if you ever get close,
a surprise electricity back-payment arrives. Break-even: next year. Like every year.

## Vehicles

- **Quad** – fast; breaks down after a while. Flo or Andi fix it (150 €).
- **Radlader** – needs diesel, refuel at the IBC tank (80 €). Only way to move heavy items. Items you carry ride on the quad rack / in the bucket.

## Project layout

```
src/
  main.js, i18n.js          boot, loading screen, translations (UI strings)
  core/     Game.js (modes, interaction, vehicles, kitchen/AFK rules, save/load), Assets, Input, Colliders, NavGrid, Audio
  world/
    layout.js               ★ all coordinates, traced from the official site plan
    Height.js               uneven festival ground (heightAt) – plots stay flat
    Terrain.js              painted ground, dirt, plots scratched into the dirt
    World.js                sky, trees, fences, festival site, chill corner, build system
    Mainstage.js            wooden dragon, rigging posts, shade sails, kitchen
    CrewBase.js             fenced base: containers, office, registration, diesel tank, camp tents
    Structures.js           ★ registry of buildable structures
  entities/
    Character.js            recolourable Quaternius characters, hair styles, extras, sit pose
    npcData.js              ★ crew roster (looks, behaviour, lines) + random volunteers
    NPC.js                  behaviours
    Player.js               player + 3rd person camera
    Vehicles.js             Quad, Radlader
  quests/questData.js       ★ all quests (pure data, { de, en } texts)
  quests/QuestSystem.js     quest engine
  items/itemData.js         ★ quest items
  ui/                       HUD, dialog, maps, menus
```

★ = files you touch to add content.

## Adding content

### A quest
Append to `QUESTS` in `src/quests/questData.js`. All texts are `{ de, en }`.

```js
{
  id: 'q6_narnia', title: { de: 'Narnia Floor', en: 'Narnia Floor' },
  giver: 'corni', requires: ['q5_festzelt'],
  summary: { de: '…', en: '…' },
  offer: [{ who: 'corni', text: { de: '…', en: '…' } }],
  steps: [
    { type: 'talk', npc: 'fabi', text: {…}, dialog: [...] },
    { type: 'pickup', text: {…}, items: [{ item: 'floor_panels', at: 'C3_front' }, { item: 'gaffa', at: 'dixis', search: 8 }] },
    { type: 'deliver', text: {…}, items: ['floor_panels', 'gaffa'], plot: 'narnia_floor', buildTime: 4,
      build: { id: 'narnia', type: 'party_tent', plot: 'narnia_floor', params: { color: '#8a3ad0', label: 'NARNIA' } } },
  ],
  reward: { karma: 100 },
}
```

Step types: `talk`, `reach` (optional dialog on arrival), `pickup` (optional `search` radius),
`deliver` (optionally builds a structure; heavy items need the Radlader nearby),
`work` (a job at several spots, e.g. rigging; `timeLimit` + `dusk` make it a night race),
`fuel` (fill a vehicle), `night` (wait for darkness). Costs: `build.cost`, `work.costEach`.
Drama events live in `src/quests/Events.js`, money in `src/quests/Economy.js`.

### An item
Add to `ITEMS` in `src/items/itemData.js` (`name {de,en}`, `icon`, `mesh`, optional `heavy: true`).

### A structure
Add a factory to `STRUCTURES` in `src/world/Structures.js` returning `{ object, colliders, api? }`.

### A plot / location
`PLOTS` / `LANDMARKS` in `src/world/layout.js` (coordinates in site-plan pixels via `P(x, y)`).
Plots are scratched into the dirt automatically and become spots named `plot_<id>`.

### A crew member
Add to `NPCS` in `src/entities/npcData.js`: `look` (base model, colours, `patchwork`, `hairStyle`
dreads/long/bun/mohawk/short, `height`, `width`, `extras` bottle/suspenders/scarf — shoes default
to skin colour = barefoot) and a `behavior`.

## Debugging
`window.game` in the browser console, e.g. `game.quests.accept('q2_sails')`,
`game.vehicles.radlader.fuel = 1`, `game.afkTime = 30` (summons Zdenko), `game.drama.spawn('pump')`,
`game.world.setNight(1, 5)`. **F9** shows all collision shapes. `dev/harness.js` can play quests automatically.

See `CREDITS.md` for asset licences.

## Crew camp

White site cabins like on the real crew camp: the walk-in **office** (Jan), **Matze's cabin** (volunteers hang out on the sofa), **Corni's cabin** (Mahdi listens to music), the walk-in **Werkstatt** (tools; things you need are often in here; Zdenko sometimes listens to the radio there), the closed storage cabins **Künstlergasse** and **Hühnercontainer** (items lie in front of them – and chickens), and the green **Aufenthaltszelt** with beer benches. The ground is meadow with dirt paths between the cabins.
