// World layout, traced from the official site plan (Trikaya_Übersicht) and satellite view.
// All shapes are authored in "plan pixels" (site plan rendered 1300px wide, north up)
// and converted to world metres with P(). The world is ~65% of real scale so walking
// distances stay fun.

export const PLAN_SCALE = 0.3; // world metres per plan pixel
export const PLAN_ORIGIN = { x: 640, y: 470 };

/** plan pixel -> world {x, z} */
export function P(px, py) {
  return { x: (px - PLAN_ORIGIN.x) * PLAN_SCALE, z: (py - PLAN_ORIGIN.y) * PLAN_SCALE };
}
export const poly = (pts) => pts.map(([x, y]) => P(x, y));
export const line = poly;

// Painted ground covers this square (world metres, centred at 0,0)
export const GROUND_SIZE = 480;

// ---------------------------------------------------------------- areas
export const AREAS = {
  // long strip between the hedge (north), the Enterstraße (north-east) and the straight fence to the big field (south) – like the drone photos
  festival: poly([[100, 540], [300, 497], [448, 462], [612, 598], [625, 785], [65, 785], [80, 640]]),
  crewCamp: poly([[452, 318], [900, 263], [904, 300], [466, 402]]),
  parking: poly([[945, 245], [1120, 230], [1125, 275], [947, 295]]),
  sportsMeadow: poly([[470, 425], [930, 312], [935, 470], [640, 560]]),
  westMeadow: poly([[215, 335], [455, 445], [448, 462], [300, 497], [100, 540]]),
};

// Fields (crop patterns painted on the ground). stripe angle in degrees.
export const FIELDS = [
  { pts: poly([[-200, -200], [1085, -200], [1150, 120], [1165, 236], [930, 238], [265, 303], [-200, 340]]), color: '#4d7a33', stripe: '#436c2b', angle: -6, spacing: 14 },
  { pts: poly([[-200, 340], [265, 303], [215, 335], [100, 540], [80, 640], [65, 785], [-200, 785]]), color: '#557f38', stripe: '#4a7130', angle: 60, spacing: 12 },
  // the big ploughed field south of the festival fence (somebody drew pictures into it with a car)
  { pts: poly([[-200, 785], [65, 785], [625, 785], [640, 1100], [-200, 1100]]), color: '#7a6f58', stripe: '#6d624d', angle: 0, spacing: 9, tracks: true },
  { pts: poly([[1160, -200], [1500, -200], [1500, 405], [1255, 412], [1205, 340], [1175, 240]]), color: '#3f6a2c', stripe: '#355d25', angle: -8, spacing: 13 },
  { pts: poly([[1100, 452], [1255, 412], [1500, 405], [1500, 1100], [1110, 1100]]), color: '#80745c', stripe: '#72674f', angle: 90, spacing: 9 },
  { pts: poly([[760, 520], [1100, 452], [1110, 1100], [760, 1100]]), color: '#5c8a3a', stripe: '#8a7d62', angle: 90, spacing: 28 },
];

// Roads & tracks: width in metres
export const ROADS = [
  { name: 'Enterstraße', pts: line([[150, 300], [235, 328], [470, 440], [622, 578]]), width: 5, kind: 'gravel' },
  { name: 'Enterstraße', pts: line([[622, 578], [800, 530], [1100, 452], [1255, 413], [1500, 400]]), width: 6, kind: 'asphalt' },
  { name: 'Gündinger Weg', pts: line([[1060, -200], [1120, 20], [1150, 120], [1172, 245], [1200, 340], [1255, 413], [1280, 700], [1290, 961]]), width: 6, kind: 'asphalt' }, // ends at Lippweg
  { name: 'Feldweg', pts: line([[-200, 330], [265, 303], [930, 238], [1172, 238]]), width: 4, kind: 'dirt' },
  { name: 'Crew-Zufahrt', pts: line([[470, 440], [520, 421], [700, 379], [916, 323], [1000, 306], [1049, 304]]), width: 4, kind: 'dirt' },
  { name: 'Crew-Einfahrt', pts: line([[972, 312], [975, 332]]), width: 4, kind: 'dirt' }, // into the crew base, between the two storage cabins
  { name: 'Base-Einfahrt', pts: line([[1034, 468], [1030, 452]]), width: 6, kind: 'gravel' },
  { name: 'Parkplatz-Zufahrt', pts: line([[1172, 250], [1122, 255]]), width: 5, kind: 'gravel' },
];

// Tree rows / clusters (plan coords)
export const TREE_LINES = [
  { pts: line([[640, 600], [648, 880]]), spacing: 5, jitter: 1 },                    // hedge east of festival (TSV side)
  { pts: line([[800, 538], [1100, 460]]), spacing: 16, jitter: 2 },                 // a few trees along Enterstraße east
  { pts: line([[650, 900], [790, 900]]), spacing: 6, jitter: 1.2 },
  { pts: line([[387, -30], [300, 140], [223, 297], [120, 470], [15, 640], [-130, 867]]), spacing: 7, jitter: 2 }, // the long hedge along the field track west of the site
  { pts: line([[1260, 440], [1290, 700]]), spacing: 6, jitter: 2 },
];
// Bush hedges (plan coords). The first one separates the camp path from the football meadow.
export const HEDGES = [
  { pts: line([[478, 452], [528, 433], [700, 392], [918, 336], [935, 332]]), spacing: 2.2 },
];

export const TREE_CLUSTERS = [
  { c: P(215, 728), r: 10, count: 16 }, // Hängemattenwald
  { c: P(190, 560), r: 8, count: 7 },   // trees in the north-west
  { c: P(60, 700), r: 7, count: 6 },    // forest edge behind the Forest Dome
  { c: P(362, 458), r: 7, count: 5 },   // the big old trees behind the dragon
  { c: P(300, 405), r: 10, count: 8 },  // the small group where the field tracks meet (north-west corner)
];

// Fence (Bauzaun) along the festival boundary; gaps = entrances
export const FESTIVAL_FENCE = {
  pts: poly([...[[100, 540], [300, 497], [448, 462], [612, 598], [625, 785], [65, 785], [80, 640]], [100, 540]]),
  gaps: [P(560, 555), P(616, 606), P(623, 725), P(73, 700), P(450, 464)], // last one: corner towards the camping (loader!)
  gapRadius: 6,
  wobbly: P(616, 666), // the wobbly stretch next to the entrance – needs the special nut (x1_nuss)
};

// ---------------------------------------------------------------- crew base
// The fenced crew base (containers, office, crew lounge) — the former "Privat" area of the plan.
// Defined as a rotated rectangle; local +z points roughly south (towards Enterstraße).
export const CREW_BASE = {
  center: P(1019, 391),
  rotation: 0.2,
  halfW: 20.5,   // local x
  halfD: 22.5,   // local z
  gates: [{ x: 0, z: 22.5, w: 8 }, { x: -9.3, z: -22.5, w: 6 }], // south (Enterstraße) + north (camp / parking), between Künstlergasse and Hühnercontainer
};
/** crew-base local (x, z) -> world {x, z} */
export function baseToWorld(x, z) {
  const c = Math.cos(CREW_BASE.rotation), s = Math.sin(CREW_BASE.rotation);
  return { x: CREW_BASE.center.x + x * c + z * s, z: CREW_BASE.center.z - x * s + z * c };
}
AREAS.crewBase = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => baseToWorld(sx * CREW_BASE.halfW, sz * CREW_BASE.halfD));

// ---------------------------------------------------------------- landmarks
export const LANDMARKS = {
  dixiRow: P(470, 470),
  tsvPitch: P(725, 710),
  hammockForest: P(215, 728),
  soccerGoalW: P(845, 400),
  soccerGoalE: P(900, 380),
  parking: P(1030, 262),
  kitchen: P(445, 548),       // crew kitchen, on the festival ground (right of the dragon, straw bales behind)
  dixi_delivery: P(434, 390), // pallets of Dixis are dropped at the front of the crew camp, next to the road
  wc_container: P(604, 760),   // the toilet trailer is delivered straight onto the festival ground
  festival_generator: P(585, 615),
  bar_tent: P(358, 740),       // the red & black round bar tent at the south fence
  east_gate: P(612, 728),
  gate_drop: P(594, 706),     // just inside the east gate: suppliers drop heavy material for the western stages here     // gate in the east fence: deliveries come in here (the entrance tent stands further inside)
  chill: P(680, 316), // Zdenko & Thompsen's beer bench, middle of the crew & artist camp
};

// Festival build plots (from the site plan). Quests reference these by id.
export const PLOTS = {
  // West → east, as on the drone photos. The dragon stands at the hedge in the middle of the north side.
  mainstage:    { pos: P(370, 577), size: 30, flatRadius: 24, label: 'Mainstage', prebuilt: true },
  // the firespace with the wooden Shiva statue is already standing too
  firespace:    { pos: P(295, 734), size: 18, flatRadius: 13, label: 'Firespace', prebuilt: true }, // south-west of the dancefloor, where the dragon looks
  hammocks:     { pos: P(215, 728), size: 18, label: 'Hängemattenwald' },                         // between the Forest Dome and the statue
  chai_lounge:  { pos: P(405, 655), size: 16, label: 'Chai Lounge', prebuilt: true },               // below the mainstage, in the middle of the ground – eternal construction site
  planetarium:  { pos: P(514, 556), size: 18, label: 'Planetarium' },                               // the rectangle at the far east, right along the north-east fence
  biergarten:   { pos: P(420, 724), size: 15, label: 'Techno Floor', rotation: -0.45, scale: 0.82 }, // the two tents near the bar, a bit smaller, turned like the Forest Dome
  awareness:    { pos: P(565, 590), size: 12, label: 'Awareness' },                                 // green & light green, at the north-east fence next to the planetarium (generator south of it)
  // future plots - marked in the dirt until a quest builds them
  narnia_floor: { pos: P(262, 655), size: 16, label: 'Narnia Floor', prebuilt: true }, // the pentagon tent + the white one next to it – Mia's crew builds it in stages
  forest_dome:  { pos: P(140, 692), size: 16, label: 'Forest Dome', clearRadius: 19 },  // two half-round tents in the south-west, stage in the gap
  shops:        { pos: P(494, 664), size: 14, label: 'Shops' },          // market stalls between the planetarium, the techno floor and the entrance
  kuenstlergasse: { pos: P(276, 545), size: 18, label: 'Künstlergasse' }, // Cosma & Mathias, at the north hedge west of the dragon
  entrance:     { pos: P(557, 666), size: 12, label: 'Eingang' },          // the white tent, east side of the festival ground (techno floor left of it)
};

// Dixi rows (built by the toilet job): stand spot is computed in front of the row
export const DIXI_ROWS = [
  { pos: P(128, 562), n: 6, rot: 0.2 },  // along the north hedge in the west
  { pos: P(535, 772), n: 4, rot: 0 },     // at the south fence near the entrance
];

// The festival site. Wander off too far beyond it and the police picks you up.
export const SITE_BOUNDS = { minX: -185, maxX: 190, minZ: -135, maxZ: 125 };
export const POLICE_MARGIN = 28; // metres beyond the site before the police arrives
// Hard limit (edge of the painted ground)
export const WORLD_BOUNDS = { minX: -232, maxX: 232, minZ: -232, maxZ: 232 };
