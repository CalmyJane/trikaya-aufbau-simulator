let out = '';
for (let z = 2; z <= 96; z += 2) { let r = ''; for (let x = -166; x <= 0; x += 2) { const q = { x, z }; r += g.world.colliders.resolve(q, 1.2) ? '#' : '.'; } out += String(z).padStart(3) + ' ' + r + String.fromCharCode(10); }
console.log('MAP x=-166..0 step2' + String.fromCharCode(10) + out);
g.trailer.start('t1_trailer', g.quests.quests.t1_trailer.steps[0]);
console.log('OBS ' + g.trailer.active.obstacles.map((o) => o.pos.x.toFixed(1) + ',' + o.pos.z.toFixed(1) + ' cos' + o.cos.toFixed(2) + ' sin' + o.sin.toFixed(2)).join(' | '));
g.trailer.stop();
const hp = (id) => { const h = g.npcs.get(id).home; return id + ' home ' + h.x.toFixed(1) + ',' + h.z.toFixed(1); };
console.log(hp('franzi') + ' ' + hp('fabi') + ' ' + hp('danny') + ' ' + hp('thompsen'));
