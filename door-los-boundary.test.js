'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./check-ai-breach-terrain');
const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
for(const [dx,dy] of dirs) for(const player of [1,2]) {
    test(`shut first-interior door blocks actual LOS both ways: ${dx},${dy}, seat ${player}`,()=>{
        const h=setup({dx,dy,player});h.door(1);
        const {unit:u,target:t,c}=h;
        assert.equal(c.doorBlocksSightBetween(u.x,u.y,t.x,t.y),true);
        assert.equal(c.isRangeBlockedByTerrain(u.x,u.y,t.x,t.y,u.z),true);
        assert.equal(c.isRangeBlockedByTerrain(t.x,t.y,u.x,u.y,t.z),true);
        const r=h.run();
        assert.equal(r.aiSeesTarget,false);
        assert.equal(r.engineHitsTarget,false);
        assert.equal(r.after.doors[0].hp,2,'beam can still hit the door itself');
    });
}
test('open, removed, off-ray and endpoint doors do not occlude',()=>{
    for(const variant of ['open','removed','off-ray','source','target']) {
        const h=setup();const d=h.door(1);
        if(variant==='open')d.open=true;
        if(variant==='removed')h.state.doors.length=0;
        if(variant==='off-ray')d.y++;
        if(variant==='source'){d.x=h.unit.x;d.y=h.unit.y;}
        if(variant==='target'){d.x=h.target.x;d.y=h.target.y;}
        assert.equal(h.c.isRangeBlockedByTerrain(4,4,8,4,0),false,variant);
        assert.equal(h.c.doorBlocksSightBetween(4,4,8,4),false,variant);
    }
});
test('friendly shut door blocks without taking friendly beam damage',()=>{
    const h=setup();h.door(1,3,h.unit.player);const r=h.run();
    assert.equal(r.aiSeesTarget,false);assert.equal(r.engineHitsTarget,false);
    assert.equal(r.after.doors[0].hp,3);
});
test('adjacent door remains directly targetable and point-blank endpoint stays exempt',()=>{
    const h=setup();h.door(1);
    assert.equal(h.c.isRangeBlockedByTerrain(4,4,5,4,0),false);
    assert.equal(h.c.doorBlocksSightBetween(4,4,5,4),false);
    assert.equal(h.c.doorBlocksSightBetween(4,4,4,4),false);
});
test('second-interior door remains blocking',()=>{
    const h=setup();h.door(2);const r=h.run();
    assert.equal(r.aiSeesTarget,false);assert.equal(r.engineHitsTarget,false);
    assert.equal(r.after.doors[0].hp,2);
});
test('final door hit removes both leaves before the engine continues (forecast residual)',()=>{
    const h=setup();const d=h.door(1,1);const twin=h.door(3,3);twin.pairId=d.pairId;
    const r=h.run();assert.equal(r.aiSeesTarget,false);
    assert.equal(r.engineHitsTarget,true);assert.equal(r.engineBores,0);
    assert.equal(r.after.doors.length,0);
});
test('voxel board uses the same first-interior door gate',()=>{
    const h=setup({voxels:true});h.door(1);const r=h.run();
    assert.equal(r.aiSeesTarget,false);assert.equal(r.engineHitsTarget,false);
});
