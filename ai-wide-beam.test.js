'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('./load-data').loadGameData();
const source = fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname, 'ai.js'), 'utf8');
const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function setup(id = 'racePlasmaCannon') {
    const spell = data.SPELL_BY_ID[id];
    const unit = {id:'caster',player:1,x:5,y:5,z:0,mp:500,ap:4,status:{},spells:[spell]};
    const blocked = new Set(), los = new Set(), events = [], queue = [], timers = [];
    const v = {visibleEnemies:[],allies:[],winState:{phase:'even'}};
    const g = {state:{units:[unit],fogOfWar:true}, bw:()=>12,bh:()=>12,
        isTerrainPassable:(x,y)=>!blocked.has(`${x},${y}`),
        isRangeBlockedByTerrain:(x,y,tx,ty,z)=>los.has(`${tx},${ty}`),
        unitHasStatus:(u,k)=>!!u.status?.[k], getEffectiveSpellRange:(u,s)=>s.range,
        getEffectiveRange:()=>1, getHostileUnits:()=>v.visibleEnemies,
        isUnitSeenByTeam:e=>!e.unseen,isUnitConcealedFrom:e=>!!e.concealed,
        posKey:(x,y)=>`${x},${y}`, TargetQuery:{apCost:s=>s.apCost,canAfford:()=>true},
        queueComputerAction:fn=>queue.push(fn), doSpell:(u,x,y,z)=>{events.push({x,y,z});return 650;},
        maybeTriggerComputerTurn:()=>events.push('retry'),finishComputerAction:()=>events.push('finished')};
    const ctx={window:{GAME:g,setTimeout:(fn,ms)=>timers.push({fn,ms})},console:{log(){},warn(){}}};
    vm.createContext(ctx);
    const end=source.lastIndexOf('})();');
    vm.runInContext(source.slice(0,end)+`
        scoreOffensiveHit = (g,u,e,sp,v,opts) => ({val:sp ? (e.value ?? 100) : 0});
        isProtected = (g,e) => !!e.protected; getTargetPriority = () => 0;
        tileDangerCost = () => 0;
        window.testAI = {findSpellTarget,scoreSpell,scoreSpells,jointMoveActionSearch,executeAction};
    `+source.slice(end),ctx);
    function enemy(x,y,value=100) {const e={id:'e'+v.visibleEnemies.length,player:2,x,y,hp:200,status:{},value};v.visibleEnemies.push(e);g.state.units.push(e);return e;}
    // Execute the engine's actual directional footprint with its direction
    // inventory narrowed to the direction under test. No AI geometry oracle.
    function footprint(dx,dy,from=unit) {
        const a=battle.indexOf('        function getLineSpellLaneOffsets(');
        const b=battle.indexOf('        function getSpellRangeTiles(',a);
        const code=battle.slice(a,b).replace('const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];',`const dirs = [[${dx},${dy}]];`);
        return vm.runInNewContext(code+'getLineSpellRayTiles(unit,spell)',{unit:from,spell,
            isInside:(x,y)=>x>=0&&y>=0&&x<12&&y<12,isTerrainPassable:g.isTerrainPassable,
            _lineLosBlocked:(u,s,x,y)=>!s.ignoresLineOfSight&&g.isRangeBlockedByTerrain(u.x,u.y,x,y,u.z)});
    }
    return {spell,unit,g,v,enemy,blocked,los,events,queue,timers,footprint,ai:ctx.window.testAI,reaim:ctx.window._aiReaimLineSpell,ctx};
}
function candidates(h) {const out=[];h.ai.scoreSpells(h.unit,h.v,out);return out;}
for(const id of ['racePlasmaCannon','raceTsunami']) {
    for(const [dx,dy] of dirs) test(`${id}: full engine footprint scored once in direction ${dx},${dy}`,()=>{
        const h=setup(id);const tiles=h.footprint(dx,dy);
        for(const t of tiles) h.enemy(t.x,t.y);
        const score=h.ai.scoreSpell(h.unit,h.spell,{x:h.unit.x+dx,y:h.unit.y+dy},h.v);
        const expected=tiles.length*(100+(h.spell.kind==='linePush'?(h.spell.pushDistance||1)*16:0))+(h.spell.leaveTerrain?30:0);
        assert.equal(score,expected);
    });
    test(`${id}: off-spine victim produces aligned candidate and delayed cast`,()=>{
        const h=setup(id); const e=h.enemy(8,6);
        const a=candidates(h)[0]; assert.ok(a);assert.equal(a.target.id,e.id);
        assert.equal(a.target.x,6);assert.equal(a.target.y,5);
        h.ai.executeAction(h.unit,a,h.v);h.queue[0]();
        assert.deepEqual(h.events[0],{x:6,y:5,z:undefined});
        assert.equal(h.timers[0].ms,650);h.timers[0].fn();assert.equal(h.events[1],'finished');
    });
}
test('whole-direction value beats a direction with more low-value victims',()=>{
    const h=setup();h.enemy(8,6,500);h.enemy(5,7,1);h.enemy(5,8,1);
    const t=h.ai.findSpellTarget(h.unit,h.spell,h.v);assert.equal(t.x,6);assert.equal(t.y,5);
    const a=h.reaim(h.unit,h.spell);assert.equal(a.x,6);assert.equal(a.y,5);
});
test('side-lane walls skip cells, spine walls stop reach, and side LOS is not a separate gate',()=>{
    const h=setup();h.enemy(8,6);const aim={x:6,y:5};
    h.los.add('8,6'); assert.equal(h.ai.scoreSpell(h.unit,h.spell,aim,h.v),100);
    h.blocked.add('8,6'); assert.equal(h.ai.scoreSpell(h.unit,h.spell,aim,h.v),0);
    h.blocked.clear();h.los.add('7,5');assert.equal(h.ai.scoreSpell(h.unit,h.spell,aim,h.v),0);
});
test('hypothetical side-lane shot uses destination elevation without mutating the caster',()=>{
    const h=setup();h.enemy(8,6);h.unit.x=0;h.unit.y=0;
    h.g.isRangeBlockedByTerrain=(x,y,tx,ty,z)=>z!==3;
    assert.equal(h.ai.jointMoveActionSearch(h.unit,[{x:5,y:5,z:0}],h.v),null);
    const t=h.ai.jointMoveActionSearch(h.unit,[{x:5,y:5,z:3}],h.v);assert.ok(t);assert.equal(t.z,3);
    assert.equal(h.unit.x,0);assert.equal(h.unit.z,0);
});
test('move search sums simultaneous hits and pays one MP cost',()=>{
    const h=setup();h.unit.x=0;h.unit.y=0;h.enemy(8,5);h.enemy(8,6);
    const t=h.ai.jointMoveActionSearch(h.unit,[{x:5,y:5,z:0}],h.v);assert.ok(t);
    const moved={...h.unit,x:5,y:5};const value=h.ai.scoreSpell(moved,h.spell,{x:6,y:5},h.v);
    assert.equal(value,200);assert.ok(t.score>100);
});
test('cast-time refresh follows new side-lane direction and excludes hidden/protected/dead victims',()=>{
    const h=setup();const e=h.enemy(8,6);const a=candidates(h)[0];assert.ok(a);
    h.ai.executeAction(h.unit,a,h.v);e.x=4;e.y=8;h.queue[0]();assert.deepEqual(h.events[0],{x:5,y:6,z:undefined});
    for(const flag of ['unseen','concealed','protected','dead']) {e[flag]=true;assert.equal(h.reaim(h.unit,h.spell),null);delete e[flag];}
    e.status.invisible=1;assert.equal(h.reaim(h.unit,h.spell),null);e.status.marked=1;assert.ok(h.reaim(h.unit,h.spell));
});
test('resource gates and failed re-aim preserve retry ownership',()=>{
    const h=setup();const e=h.enemy(8,6);
    for(const field of ['ap','mp']) {const old=h.unit[field];h.unit[field]=0;assert.equal(candidates(h).length,0);h.unit[field]=old;}
    h.unit.status.silence=1;assert.equal(candidates(h).length,0);delete h.unit.status.silence;
    const a=candidates(h)[0];assert.ok(a);h.ai.executeAction(h.unit,a,h.v);e.unseen=true;h.queue[0]();
    assert.deepEqual(h.events,['retry']);assert.equal(h.timers.length,0);assert.equal(candidates(h).length,0);
});
test('Simul candidate conversion preserves direction plus victim identity for resolution re-aim',()=>{
    const h=setup();h.unit.player=2;const e=h.enemy(8,6);e.player=1;const a=candidates(h)[0];assert.ok(a);
    const start=battle.indexOf('            function _candToStep(c) {');const end=battle.indexOf('            function _buildAiPlanFor(',start);
    const convert=vm.runInNewContext(battle.slice(start,end)+'_candToStep',{spellDealsDamage:()=>true});
    const step=convert(a);assert.equal(step.targetId,e.id);assert.equal(step.x,6);assert.equal(step.y,5);
    // Actual Simul spell executor with unrelated resource/action boundaries doubled.
    const sa=battle.indexOf('            function _execSpell(unit, step) {');const sb=battle.indexOf('            function _execItem(',sa);
    const exec=vm.runInNewContext(battle.slice(sa,sb)+'_execSpell',{window:{_aiReaimLineSpell:h.reaim},state:h.g.state,
        canAffordSpell:()=>true,getSpellMpCostFor:()=>h.spell.cost,_kindMeta:()=>({}),isSpellSelfCast:()=>false,
        doSpell:h.g.doSpell,_spellWhiff:()=>{throw Error('unexpected whiff');}});
    e.x=4;e.y=8;assert.equal(exec(h.unit,step),650);assert.deepEqual(h.events[0],{x:5,y:6,z:undefined});
});
test('board edges clip side lanes and range excludes the fifth beam step',()=>{
    const h=setup('raceTsunami');h.unit.x=0;h.unit.y=0;
    const tiles=h.footprint(1,0);for(const t of tiles)h.enemy(t.x,t.y);
    const per=100+(h.spell.pushDistance||1)*16;
    assert.equal(h.ai.scoreSpell(h.unit,h.spell,{x:1,y:0},h.v),tiles.length*per+(h.spell.leaveTerrain?30:0));
    h.v.visibleEnemies.length=0;h.enemy(5,0);assert.equal(h.ai.scoreSpell(h.unit,h.spell,{x:1,y:0},h.v),0);
});
test('empty visibility and rejected affordability admit no candidate',()=>{
    const h=setup();assert.equal(candidates(h).length,0);assert.equal(h.reaim(h.unit,h.spell),null);
    h.enemy(8,5);h.g.TargetQuery.canAfford=()=>false;assert.equal(candidates(h).length,0);
});
test('narrow beam retains aligned target coordinates and diagonal step reach',()=>{
    const h=setup();h.spell={...h.spell,lineWidth:1};h.unit.spells=[h.spell];
    const e=h.enemy(9,9);assert.equal(h.ai.findSpellTarget(h.unit,h.spell,h.v),e);
    assert.equal(h.ai.scoreSpell(h.unit,h.spell,e,h.v),100);
});
