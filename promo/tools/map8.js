const asc = (x0, x1, z0, z1) => { let out = ''; for (let z = z0; z <= z1; z += 2) { let r = ''; for (let x = x0; x <= x1; x += 2) { const q = { x, z }; r += g.world.colliders.resolve(q, 1.2) ? '#' : '.'; } out += String(z).padStart(4) + ' ' + r + String.fromCharCode(10); } return out; };
console.log('MAP fest x=-166..0 step2' + String.fromCharCode(10) + asc(-166, 0, 2, 96));
console.log('MAP crew x=84..140 step2' + String.fromCharCode(10) + asc(84, 140, -50, 6));
const r = (v) => Math.round(v * 10) / 10;
console.log('SPOTS ' + Object.entries(g.world.spots).filter(([k]) => /tent_|chill|spawn|base_yard|office|corni|matze|werk|aufenthalt|zdenko|tiny|fire|sauna|registration|narnia|chai|kitchen/.test(k)).map(([k, v]) => k + ':' + r(v.x) + ',' + r(v.z)).join('  '));
console.log('VEH ' + JSON.stringify(g.world.vehicleSpots) + ' ' + Object.entries(g.vehicles).map(([k, v]) => k + ':' + r(v.position.x) + ',' + r(v.position.z)).join(' '));
console.log('NPC ' + ['jan', 'fabi', 'sabse', 'corni', 'franzi', 'estenko', 'thompsen', 'thomas', 'leocitas', 'danny', 'julez', 'juli'].map((id) => { const n = g.npcs.get(id); return n ? id + '=' + n.def.name + ':' + r(n.position.x) + ',' + r(n.position.z) : id + '=NONE'; }).join(' '));
console.log('STRUCT ' + Object.entries(g.world.structures).map(([k, v]) => k + ':' + r(v.object.position.x) + ',' + r(v.object.position.z)).join(' '));
