'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./check-ai-breach-terrain');
for(const player of [1,2]) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
 test(`beam bores actual earlier column: seat ${player}, ${dx},${dy}`,()=>{
  const h=setup({voxels:true,player,dx,dy});const p=h.tile(1,'grass',2);const r=h.run();
  assert.equal(r.engineHitsTarget,true);assert.equal(r.engineBores,1);
  assert.equal(h.c.getBlockAt(p.x,p.y,1),null);assert.equal(h.c.getBlockAt(p.x,p.y,2),null);
  assert.ok(h.c.getBlockAt(p.x,p.y,0));
 });
}
for(const count of [1,2,3]) test(`${count} walls respects two-bore budget`,()=>{
 const h=setup({voxels:true});for(let i=1;i<=count;i++)h.tile(i,'grass',2);const r=h.run();
 assert.equal(r.engineBores,Math.min(count,2));assert.equal(r.engineHitsTarget,count<=2);
 if(count===3)assert.ok(h.c.getBlockAt(7,4,1));
});
for(const terrain of ['cave_wall','wall'])test(`${terrain} stops before later soft column is damaged`,()=>{
 const h=setup({voxels:true});h.tile(1,terrain,2);h.tile(2,'grass',2);const before=JSON.stringify(h.state.boardColumns);
 const r=h.run();assert.equal(r.engineHitsTarget,false);assert.equal(r.engineBores,0);assert.equal(JSON.stringify(h.state.boardColumns),before);
});
for(const owner of [1,2])test(`occupied blocker owned by ${owner} cannot be bored`,()=>{
 const h=setup({voxels:true});const p=h.tile(1,'grass',2);h.tile(2,'grass',2);
 h.state.units.push({id:'occupant',player:owner,...p,z:2,hp:100});const r=h.run();
 assert.equal(r.engineHitsTarget,false);assert.equal(r.engineBores,0);assert.ok(h.c.getBlockAt(p.x,p.y,1));assert.ok(h.c.getBlockAt(6,4,1));
});
test('body window removes two blocks and preserves a high lintel',()=>{
 const h=setup({voxels:true});const p=h.tile(1,'grass',4);const r=h.run();
 assert.equal(r.engineHitsTarget,true);assert.equal(r.engineBores,1);
 assert.equal(h.c.getBlockAt(p.x,p.y,1),null);assert.equal(h.c.getBlockAt(p.x,p.y,2),null);
 assert.ok(h.c.getBlockAt(p.x,p.y,3));assert.ok(h.c.getBlockAt(p.x,p.y,4));
});
test('hardness in either body block prevents partial destruction',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',2);h.c.setBlockAt(5,4,2,'wall');
 const r=h.run();assert.equal(r.engineBores,0);assert.ok(h.c.getBlockAt(5,4,1));
});
test('elevated caster bores only its elevated body window',()=>{
 const h=setup({voxels:true,z:2});h.target.z=2;h.c.setBlockAt(4,4,2,'grass');for(let i=2;i<=4;i++)h.tile(i,'grass',2);
 const p=h.tile(1,'grass',5);const r=h.run();assert.equal(r.engineHitsTarget,true);assert.equal(r.engineBores,1);
 assert.ok(h.c.getBlockAt(p.x,p.y,2));assert.equal(h.c.getBlockAt(p.x,p.y,3),null);assert.equal(h.c.getBlockAt(p.x,p.y,4),null);assert.ok(h.c.getBlockAt(p.x,p.y,5));
});
test('zero power cannot bore',()=>{const h=setup({voxels:true,spell:{breachPower:0}});h.tile(1,'grass',2);const r=h.run();assert.equal(r.engineHitsTarget,false);assert.equal(r.engineBores,0);});
test('remaining overhead obstruction does not grant automatic continuation',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',4);h.target.z=5;
 const r=h.run();assert.equal(r.engineHitsTarget,false);assert.ok(h.c.getBlockAt(5,4,3));
});
test('query reports earlier obstacle without mutating the board and clears stale evidence',()=>{
 const h=setup({voxels:true});h.tile(1,'grass',2);const before=JSON.stringify(h.state);const evidence={x:99,y:99};
 assert.equal(h.c.isRangeBlockedByTerrain(4,4,6,4,0,0,false,evidence),true);assert.deepEqual(evidence,{x:5,y:4});
 assert.equal(JSON.stringify(h.state),before);
 assert.equal(h.c.isRangeBlockedByTerrain(4,4,4,5,0,0,false,evidence),false);assert.deepEqual(evidence,{});
});
test('door obstruction cannot spend bore budget on a later wall',()=>{
 const h=setup({voxels:true});h.door(1,3);h.tile(2,'grass',2);const r=h.run();
 assert.equal(r.engineHitsTarget,false);assert.equal(r.engineBores,0);assert.ok(h.c.getBlockAt(6,4,1));
});
