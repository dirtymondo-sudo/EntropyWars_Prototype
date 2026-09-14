'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('./check-ai-breach-terrain');
const plain = x => JSON.parse(JSON.stringify(x));
const keys = ts => Array.from(ts, t => `${t.x},${t.y}`).sort();
function parity(h, hits, bores) {
 const r = h.run();
 assert.deepEqual(keys(r.predicted), keys(r.actual.cells), 'AI footprint must match engine walk');
 assert.equal(r.aiSeesTarget, hits);
 assert.equal(r.engineHitsTarget, hits);
 if (bores != null) assert.equal(r.engineBores, bores);
 return r;
}
for (const player of [1,2]) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
 test(`forecast real voxel breach seat ${player} direction ${dx},${dy}`, () => {
  const h=setup({voxels:true,player,dx,dy});h.tile(1,'grass',2); parity(h,true,1);
 });
 test(`forecast final-hit pair seat ${player} direction ${dx},${dy}`, () => {
  const h=setup({voxels:true,player,dx,dy});const d=h.door(1,1);
  h.state.doors.push({...d,id:'twin',x:h.unit.x+3*dx,y:h.unit.y+3*dy,hp:3});
  parity(h,true,0);
 });
}
for (const count of [0,1,2,3]) test(`${count} walls: footprint and budget`,()=>{
 const h=setup({voxels:true});for(let i=1;i<=count;i++)h.tile(i,'grass',2);parity(h,count<3,Math.min(count,2));
});
for (const width of [1,2,3]) test(`wide footprint ${width} after breach`,()=>{
 const h=setup({voxels:true,spell:{lineWidth:width}});h.tile(1,'grass',2);
 h.state.boardTerrain[5][6]='chasm';parity(h,true,1);
});
for (const terrain of ['cave_wall','wall']) test(`hard ${terrain} cannot be bypassed`,()=>{
 const h=setup({voxels:true});h.tile(1,terrain,2);h.tile(2,'grass',2);parity(h,false,0);
});
for(const player of [1,2])test(`occupied wall seat ${player}`,()=>{
 const h=setup({voxels:true});const p=h.tile(1,'grass',2);h.state.units.push({id:'blocker',player,...p,z:2,hp:10});parity(h,false,0);
});
test('mixed-hardness body window',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',2);h.c.setBlockAt(5,4,2,'wall');parity(h,false,0);
});
test('lintel remains above a ground tunnel',()=>{const h=setup({voxels:true});h.tile(1,'grass',4);parity(h,true,1);});
test('retained lintel blocks higher target',()=>{const h=setup({voxels:true});h.tile(1,'grass',4);h.target.z=5;parity(h,false,1);});
test('elevated body window',()=>{
 const h=setup({voxels:true,z:2});h.target.z=2;h.c.setBlockAt(4,4,2,'grass');
 for(let i=2;i<=4;i++)h.tile(i,'grass',2);h.tile(1,'grass',5);parity(h,true,1);
});
test('zero power',()=>{const h=setup({voxels:true,spell:{breachPower:0}});h.tile(1,'grass',2);parity(h,false,0);});
for(const hp of [1,2,3])test(`enemy shut door ${hp} hp`,()=>{const h=setup();h.door(1,hp);parity(h,hp===1,0);});
for(const hp of [1,3])test(`friendly door ${hp} hp`,()=>{const h=setup();h.door(1,hp,h.unit.player);parity(h,false,0);});
test('door removal consumes no terrain bore',()=>{
 const h=setup({voxels:true});h.door(1,1);h.tile(2,'grass',2);h.tile(3,'grass',2);parity(h,true,2);
});
test('open first leaf survives, final-hit twin destroys pair',()=>{
 const h=setup();const d=h.door(1,3,2,true);h.state.doors.push({...d,id:'twin',x:6,y:4,hp:1,open:false});parity(h,true,0);
});
test('earlier shut leaf prevents reaching its fragile twin',()=>{
 const h=setup();const d=h.door(1,3);h.state.doors.push({...d,id:'twin',x:6,y:4,hp:1});parity(h,false,0);
});
test('tree object removal and real LOS',()=>{
 const h=setup();h.state.boardObjects[4][5]='tree';parity(h,true,1);
});
test('tree object above voxel body still rechecks remaining column',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',2);h.state.boardObjects[4][5]='tree';parity(h,true,2);
});
test('painted spine affects later LOS',()=>{
 const h=setup({spell:{leaveTerrain:'cave_wall'}});parity(h,true);
});
test('ignores-LOS preserves explicit spell exception',()=>{
 const h=setup({voxels:true,spell:{ignoresLineOfSight:true}});h.tile(1,'wall',2);parity(h,true,0);
});
test('wall vision preserves caster exception',()=>{
 const h=setup({voxels:true});h.unit.wallVision=true;h.tile(1,'wall',2);parity(h,true,0);
});
test('immutable input and repeatable forecasts, including doors and columns',()=>{
 const h=setup({voxels:true});h.tile(2,'grass',2);h.door(1,1);
 const freeze=x=>{if(x && typeof x==='object' && !Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}};
 const before=JSON.stringify(h.state);freeze(h.state);
 const one=h.c.getLineForecast(h.unit,h.spell,1,0);
 assert.deepEqual(plain(h.c.getLineForecast(h.unit,h.spell,1,0)),plain(one));
 assert.equal(JSON.stringify(h.state),before);assert.equal(one.bores,1);assert.equal(one.uncertain,false);
 assert.ok(one.tiles.some(t=>t.x===h.target.x&&t.y===h.target.y));
});
test('hypothetical caster location replaces original occupancy without a live move',()=>{
 const h=setup({voxels:true});h.c.setBlockAt(4,4,1,'grass');h.c.setBlockAt(4,4,2,'grass');
 const from={...h.unit,x:3};const before=JSON.stringify(h.state);
 const f=h.c.getLineForecast(from,{...h.spell,range:5},1,0);
 assert.equal(f.bores,1);assert.ok(f.tiles.some(t=>t.x===8&&t.y===4));assert.equal(JSON.stringify(h.state),before);
});
test('missing doors array is never initialized by a read',()=>{
 const h=setup();delete h.state.doors;const before=JSON.stringify(h.state);
 h.c.getLineForecast(h.unit,h.spell,1,0);h.c.isRangeBlockedByTerrain(4,4,8,4,0);
 assert.equal(JSON.stringify(h.state),before);
});
test('explosion marks uncertainty and stops promising later hits',()=>{
 const h=setup();h.state._deployedObjects=[{x:5,y:4,hp:1,detonateOnAttack:true,blastRadius:2}];
 const before=JSON.stringify(h.state),f=h.c.getLineForecast(h.unit,h.spell,1,0);
 assert.equal(f.uncertain,true);assert.deepEqual(keys(f.tiles),['5,4']);assert.equal(JSON.stringify(h.state),before);
});
test('flooding marks uncertainty without terrain or hazard callbacks',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',2);h.state.boardTerrain[3][5]='water';h.state.boardHeights[3][5]=3;
 const before=JSON.stringify(h.state),f=h.c.getLineForecast(h.unit,h.spell,1,0);
 assert.equal(f.uncertain,true);assert.equal(JSON.stringify(h.state),before);assert.ok(!f.tiles.some(t=>t.x===8&&t.y===4));
});
for (const scenario of ['wall','door']) test(`actual AI scorer and picker select newly reachable ${scenario} shot`,()=>{
 const h=setup({voxels:true,scoring:true});if(scenario==='wall')h.tile(1,'grass',2);else h.door(1,1);
 const g=h.c.window.GAME;g.unitHasStatus=()=>false;g.getEffectiveSpellRange=(u,s)=>s.range;
 const v={visibleEnemies:[h.target],allies:[],winState:{phase:'even'}};
 assert.equal(h.c.window.scoreSpell(h.unit,h.spell,h.target,v),100);
 const aim=h.c.window.findSpellTarget(h.unit,h.spell,v);assert.ok(aim);assert.equal(aim.id,h.target.id);
});
test('scorer never values hidden victims beyond a breached wall',()=>{
 const h=setup({voxels:true,scoring:true});h.tile(1,'grass',2);
 assert.equal(h.c.window.scoreSpell(h.unit,h.spell,h.target,{visibleEnemies:[],allies:[]}),0);
});
test('building forecast does not invoke the initializing engine getter',()=>{
 const h=setup();h.c.getBuildingAt=()=>{throw Error('mutating getter called');};
 const before=JSON.stringify(h.state);h.c.getLineForecast(h.unit,h.spell,1,0);assert.equal(JSON.stringify(h.state),before);
});
test('last-hit building stops continuation without changing its HP',()=>{
 const h=setup();const key=Object.keys(h.c.OBJECT_RULES).find(k=>h.c.OBJECT_RULES[k].roofWalkable && h.c.OBJECT_RULES[k].passable!==false);
 assert.ok(key,'production passable building fixture');h.state.boardObjects[4][5]=key;
 h.state.buildings=[{id:'b',x:5,y:4,key,hp:1}];
 const before=JSON.stringify(h.state),f=h.c.getLineForecast(h.unit,h.spell,1,0);
 assert.equal(f.uncertain,true);assert.equal(JSON.stringify(h.state),before);
});
