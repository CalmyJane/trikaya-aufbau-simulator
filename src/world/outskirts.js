// The world around the festival site, traced (loosely) from the satellite view of München-Allach.
// Everything here is in WORLD metres (x = east, z = south). The festival site itself lives in layout.js.
//
//  south: strip fields → Lippweg → noise barrier → A99 (Alps behind it)
//  north: fields → houses (Birkenstraße)
//  east:  narrow strip fields → garden centre / Baumschulweg → houses
//  west:  big fields with high-voltage power lines
// Nobody needs to go there – the police picks you up long before.

const R = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// crop fields outside the painted site (far ground) – pts in world metres
export const FAR_FIELDS = [
  // west: huge pale fields with the power lines
  { pts: R(-1000, -1000, -430, 150), color: '#8f8c78', stripe: '#837f6b', angle: 2, spacing: 11 },
  { pts: R(-430, -1000, -300, -80), color: '#6e7a5a', stripe: '#646f50', angle: 90, spacing: 9 },
  { pts: R(-430, -80, -240, 150), color: '#8a8672', stripe: '#7e7a66', angle: 30, spacing: 10 },
  { pts: R(-300, -1000, -240, -80), color: '#3f5f2c', stripe: '#365324', angle: 90, spacing: 7 },
  { pts: R(-1000, 150, -430, 168), color: '#7b8a55', stripe: '#6f7d4b', angle: 0, spacing: 8 },
  // north: fields before the houses
  { pts: R(-1000, -1000, -300, -240), color: '#5f7f3c', stripe: '#557234', angle: 0, spacing: 12 },
  { pts: R(-300, -1000, 0, -240), color: '#7b7a5e', stripe: '#6f6e53', angle: 4, spacing: 10 },
  { pts: [[0, -1000], [140, -1000], [140, -235], [0, -240]], color: '#4f7a3a', stripe: '#466d33', angle: 90, spacing: 9 },
  // north-east: fields between the villages
  { pts: R(240, -165, 1000, -25), color: '#4d7f38', stripe: '#3f6c2d', angle: -4, spacing: 8 },
  // south of the motorway
  { pts: R(-1000, 210, -360, 1000), color: '#6f8a44', stripe: '#627c3b', angle: 0, spacing: 10 },
  { pts: R(-200, 210, 200, 1000), color: '#8a7d5e', stripe: '#7c704f', angle: 90, spacing: 9 },
  { pts: R(-360, 210, -200, 1000), color: '#5a7f3a', stripe: '#4f7232', angle: 0, spacing: 8 },
];

// small fields inside the painted ground, south of the festival (between fence and Lippweg)
// and the narrow strip fields east of the crew base
export const NEAR_FIELDS = [
  { pts: [[-240, 132], [-120, 132], [-120, 157], [-240, 159]], color: '#5e8a3a', stripe: '#527a32', angle: 0, spacing: 8 },
  { pts: [[-120, 132], [-40, 132], [-40, 154], [-120, 157]], color: '#8a7f62', stripe: '#7d7256', angle: 90, spacing: 7 },
  { pts: [[-40, 134], [60, 134], [60, 151], [-40, 154]], color: '#46703a', stripe: '#3c6232', angle: 0, spacing: 6 },
  { pts: [[60, 134], [150, 132], [150, 148], [60, 151]], color: '#7d7a58', stripe: '#716e4e', angle: 90, spacing: 6 },
  { pts: [[150, 132], [192, 130], [192, 146], [150, 148]], color: '#3a5a2a', stripe: '#324e24', angle: 90, spacing: 5 },
];

// villages (painted as gardens, filled with simple houses)
export const TOWNS = [
  { name: 'Birkenstraße', pts: [[140, -1000], [1000, -1000], [1000, -165], [300, -168], [140, -170]] },
  { name: 'Allach Nord', pts: [[0, -1000], [140, -1000], [140, -235], [0, -240]], sparse: true, onlyFar: true },
  { name: 'Enterstraße Ost', pts: [[240, -20], [1000, -30], [1000, 138], [240, 142]] },
  { name: 'Allach Süd', pts: [[200, 215], [1000, 215], [1000, 1000], [200, 1000]] },
];

// garden centre / tree nursery on Baumschulweg: lots of trees, a few greenhouses
export const GARDENS = { pts: [[194, -12], [236, -14], [234, 128], [196, 128]] };

// roads outside the site
export const OUT_ROADS = [
  { name: 'Lippweg', pts: [[-1000, 166], [-240, 158], [0, 153], [240, 146], [1000, 140]], width: 5, kind: 'asphalt' },
  { name: 'Baumschulweg', pts: [[238, -22], [236, 60], [233, 146]], width: 4, kind: 'asphalt' },
  { name: 'Enterstraße', pts: [[258, -21], [600, -26], [1000, -30]], width: 6, kind: 'asphalt' },
  { name: 'Entertraße Nord', pts: [[316, -1000], [316, -300], [318, -21], [320, 143]], width: 5, kind: 'asphalt' },
  { name: 'Birkenstraße', pts: [[150, -200], [400, -206], [1000, -214]], width: 5, kind: 'asphalt' },
  { name: 'Gündinger Weg', pts: [[126, -201], [110, -400], [90, -1000]], width: 6, kind: 'asphalt' },
  { name: 'Feldweg West', pts: [[-1000, 120], [-430, 110], [-240, 101]], width: 4, kind: 'dirt' },
];

// the A99 behind its noise barrier
export const MOTORWAY = { z0: 175, z1: 207, lanes: 6, wallZ: 171, wallH: 4.6 };

// high-voltage lines on the western fields: pylon positions per line
const pylonLine = (x0, z0, dx, dz, n, step) => Array.from({ length: n }, (_, i) => [x0 + dx * step * i, z0 + dz * step * i]);
export const POWER_LINES = [
  pylonLine(-662, -650, 0.44, 0.9, 7, 150),
  pylonLine(-628, -660, 0.44, 0.9, 7, 150),
];

// tree positions that really exist on the satellite image (world metres)
export const OUT_TREE_CLUSTERS = [
  { c: [-300, 160], r: 34, count: 70 },  // little forest south-west, next to Lippweg
  { c: [-150, 205], r: 18, count: 18 },  // bushes along the motorway embankment
  { c: [110, -150], r: 18, count: 14 },  // junction Gündinger Weg / Lärchenweg
];
export const OUT_TREE_LINES = [
  { pts: [[-174, -217], [-500, -217]], spacing: 9 },           // tree row along the field edge (north-west)
  { pts: [[-1000, 165], [-240, 163]], spacing: 22, jitter: 4 }, // sparse along Lippweg west
  { pts: [[-240, 163], [240, 151]], spacing: 26, jitter: 4 },
  { pts: [[240, 151], [1000, 145]], spacing: 20, jitter: 4 },
];
