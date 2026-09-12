'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const battle = fs.readFileSync(process.env.EW_CHIVALRY_SOURCE || path.join(__dirname, 'battle.js'), 'utf8');
const map = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
function between(src, a, b) {
    const start = src.indexOf(a), end = src.indexOf(b, start + a.length);
    assert.ok(start >= 0 && end > start, a);
    return src.slice(start, end);
}
function fixture(player = 1) {
    const ward = {id:'ward', player, x:3, y:3, z:2, hp:100, maxHp:100, _guardedBy:'knight'};
    const knight = {id:'knight', player, x:0, y:0, z:7, hp:100, maxHp:100, _guardingAlly:'ward'};
    const enemy = {id:'enemy', player:3-player, x:7, y:7, z:0, hp:100};
    const state = {units:[ward, knight, enemy], _deployedObjects:[], turrets:[]};
    const blocked = new Set(), objects = new Set(), towers = new Set(), surfaces = new Map();
    const hits = [];
    const ctx = {state, window:{}, Math, Object, STATUS_DEFS:{protected:{invulnerable:true}},
        _pressDamageCollector:null, isInside:(x,y)=>x>=0 && y>=0 && x<8 && y<8,
        getWalkableSurfaces:(x,y)=>surfaces.get(`${x},${y}`) || [2],
        getBlockAt:(x,y)=>({terrain:blocked.has(`${x},${y}`)?'wall':'grass'}),
        getTerrainRule:t=>({passable:t!=='wall'}), objectBlocksLanding:(x,y)=>objects.has(`${x},${y}`),
        isTowerTile:(x,y)=>towers.has(`${x},${y}`), getBaseHeightAt:()=>0,
        unitAt:(x,y)=>state.units.find(u=>!u.dead && u.x===x && u.y===y),
        isEnemyUnit:(a,b)=>a.player!==b.player, unitDisplayName:u=>u.id,
        addLog(){}, showFloatingTextForUnit(){}, scheduleBoardRender(){}, flashUnit(){}, showCombatBanner(){},
        playSfx(){}, getActiveStatusKeys:u=>u.protected?['protected']:[],
        isUnitRealmShieldedFrom:()=>false, unitElementAffinity:()=>null, unitPassiveValue:()=>null,
        capture:(u,raw,opts)=>{hits.push({id:u.id,raw,opts,x:u.x,y:u.y,z:u.z});return true;}
    };
    vm.createContext(ctx);
    // Real map landing predicates; only the board queries are controlled.
    vm.runInContext(between(map, '        function nearestWalkableZ(', '        /* Units riding a building') +
        between(map, '        function unitAt3D(', '        function unitsAtColumn('), ctx);
    // Execute the production recursive interception and immunity pipeline.
    // Stop before damage arithmetic/rendering; capture its exact recipient/options.
    vm.runInContext(between(battle, '        function applyDamageToUnit(', '            let finalDamage = Math.max(0, damage);') +
        'return capture(target, damage, opts);\n}', ctx);
    const opts = {sourceUnit:enemy, damageType:'magic', spellElement:'fire', statusEffects:[{id:'burn'}]};
    return {ward,knight,enemy,state,blocked,objects,towers,surfaces,hits,ctx,opts,
        hit:(raw=60, options=opts)=>ctx.applyDamageToUnit(ward,raw,'test',options)};
}
for (const player of [1,2]) {
    test(`seat ${player}: intercept lands on a real adjacent surface and consumes only one pledge`,()=>{
        const h=fixture(player); h.hit();
        assert.deepEqual([h.knight.x,h.knight.y,h.knight.z],[3,4,2]);
        assert.equal(h.ward._guardedBy,null); assert.equal(h.knight._guardingAlly,null);
        assert.equal(h.hits[0].id,'knight'); assert.equal(h.hits[0].raw,60);
        assert.equal(h.hits[0].opts.sourceUnit,h.enemy);
        assert.equal(h.hits[0].opts.statusEffects,h.opts.statusEffects);
        assert.equal(h.hits[0].opts._chivalryRedirected,true);
        assert.equal(h.opts._chivalryRedirected,undefined);
        h.hit(); assert.equal(h.hits[1].id,'ward');
    });
}
for (const obstacle of ['terrain','object','tower','deployed','turret','no surface','occupied']) {
    test(`intercept skips ${obstacle} at its first candidate`,()=>{
        const h=fixture();
        if(obstacle==='terrain') h.blocked.add('3,4');
        if(obstacle==='object') h.objects.add('3,4');
        if(obstacle==='tower') h.towers.add('3,4');
        if(obstacle==='deployed') h.state._deployedObjects.push({x:3,y:4,hp:5,blocksLanding:true});
        if(obstacle==='turret') h.state.turrets.push({x:3,y:4,z:2,hp:5});
        if(obstacle==='no surface') h.surfaces.set('3,4',[]);
        if(obstacle==='occupied') h.state.units.push({id:'blocker',x:3,y:4,z:2});
        h.hit(); assert.deepEqual([h.knight.x,h.knight.y,h.knight.z],[3,2,2]);
        assert.equal(h.hits[0].id,'knight');
    });
}
test('uses a surface near the ward rather than the guardian old elevation',()=>{
    const h=fixture();h.surfaces.set('3,4',[2,7]);h.hit();
    assert.equal(h.knight.z,2);
});
test('all adjacent landings blocked: intercept remains in place',()=>{
    const h=fixture(); for(const k of ['3,4','3,2','4,3','2,3'])h.blocked.add(k);
    h.hit();assert.deepEqual([h.knight.x,h.knight.y,h.knight.z],[0,0,7]);
    assert.equal(h.hits[0].id,'knight');assert.equal(h.ward._guardedBy,null);
});
test('board edge is skipped before surface probing',()=>{
    const h=fixture();h.ward.y=7;h.hit();
    assert.deepEqual([h.knight.x,h.knight.y,h.knight.z],[3,6,2]);
});
for(const reason of ['no source','friendly source','zero damage','dead guardian','dying guardian','already redirected']) {
    test(`${reason} does not consume or move a guardian`,()=>{
        const h=fixture();let raw=60,opts={...h.opts};
        if(reason==='no source')delete opts.sourceUnit;
        if(reason==='friendly source')opts.sourceUnit=h.knight;
        if(reason==='zero damage')raw=0;
        if(reason==='dead guardian')h.knight.dead=true;
        if(reason==='dying guardian')h.knight._dying=true;
        if(reason==='already redirected')opts._chivalryRedirected=true;
        h.hit(raw,opts);assert.equal(h.hits[0].id,'ward');
        assert.equal(h.ward._guardedBy,'knight');
        assert.deepEqual([h.knight.x,h.knight.y,h.knight.z],[0,0,7]);
    });
}
test('guardian immunity still applies after the pledge is consumed',()=>{
    const h=fixture();h.knight.protected=true;
    assert.equal(h.hit(),false);assert.equal(h.hits.length,0);assert.equal(h.ward._guardedBy,null);
});
