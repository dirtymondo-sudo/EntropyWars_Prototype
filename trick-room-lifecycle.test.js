'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.EW_TRICK_SOURCE_DIR || __dirname;
const battle = fs.readFileSync(path.join(root, 'battle.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(root, 'state.js'), 'utf8');
const online = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
const data = require('./load-data').loadGameData();
function between(source, start, end) {
    const a = source.indexOf(start); assert.ok(a >= 0, start);
    const b = source.indexOf(end, a + start.length); assert.ok(b > a, end);
    return source.slice(a, b);
}
function fixture() {
    const state = {round:1, _trickRoomRounds:0, units:[
        {id:'slow',player:1,spd:10}, {id:'fast',player:2,spd:90}
    ]};
    const ctx = {state, getEffectiveSpd:u=>u.liveSpd ?? u.spd,
        unitPassiveValue:(u,k)=>k==='speedTiePriority' && !!u.quick,
        engineRandInt:()=>0};
    vm.createContext(ctx);
    vm.runInContext('let _blitzTurnOrder = [], _blitzTurnIndex = 0;\n' +
        between(stateSource, '        function buildBlitzTurnOrder()', '        function rebuildBlitzTurnOrderFromIds()'), ctx);
    return {state,ctx,build(){vm.runInContext('buildBlitzTurnOrder()',ctx);return Array.from(state._blitzTurnOrderIds);}};
}
function resetBlock(name) {
    // Execute the production match-scoped data reset block; renderer, account,
    // map generation and UI before/after this block are outside this unit test.
    const fn = between(battle, `        function ${name}(`, '\n        function ');
    return between(fn, '            state.bombs = [];', '            state._deployedObjects = [];');
}
for (const name of ['randomizeParty','prepareBattleStateFromCurrentBuilds','resetGame','applyPartyBuild']) {
    test(`${name}: leftover Trick Room cannot reverse a fresh match`,()=>{
        const h=fixture();h.state._trickRoomRounds=data.SPELL_BY_ID.raceTrickRoom.trickRoomDuration;
        vm.runInContext(resetBlock(name),h.ctx);
        assert.equal(h.state._trickRoomRounds,0);
        assert.deepEqual(h.build(),['fast','slow']);
        assert.deepEqual(h.build(),['fast','slow']);
    });
    test(`${name}: repeated reset keeps default order and clears lattice state`,()=>{
        const h=fixture();h.state.mirrors=[{owner:1,hp:2}];h.state._mirrorFreq={1:2,2:1};
        vm.runInContext(resetBlock(name),h.ctx);vm.runInContext(resetBlock(name),h.ctx);
        assert.equal(h.state.mirrors.length,0);assert.equal(h.state._mirrorFreq[1],0);
        assert.deepEqual(h.build(),['fast','slow']);
    });
}
test('active Trick Room still reverses exactly three future Blitz order builds',()=>{
    const h=fixture();h.state._trickRoomRounds=data.SPELL_BY_ID.raceTrickRoom.trickRoomDuration;
    for(let n=2;n>=0;n--){assert.deepEqual(h.build(),['slow','fast']);assert.equal(h.state._trickRoomRounds,n);}
    assert.deepEqual(h.build(),['fast','slow']);assert.equal(h.state._trickRoomRounds,0);
});
test('Trick Room uses live speed and preserves Quickdraw ties',()=>{
    const h=fixture();h.state.units[0].liveSpd=100;h.state._trickRoomRounds=2;
    assert.deepEqual(h.build(),['fast','slow']);
    h.state.units[0].liveSpd=90;h.state.units[1].quick=true;
    assert.deepEqual(h.build(),['fast','slow']);
});
test('setting Trick Room does not reorder an already built round',()=>{
    const h=fixture();h.build();h.state._trickRoomRounds=3;
    assert.deepEqual(Array.from(h.state._blitzTurnOrderIds),['fast','slow']);
    assert.deepEqual(h.build(),['slow','fast']);
});
test('host serializer carries active and cleared Trick Room values',()=>{
    const h=fixture();h.ctx.window={_gameState:h.state};
    const start=online.indexOf('            function _serializeState()');
    const end=online.indexOf('\n            function ',start+1);
    assert.ok(start>=0&&end>start);
    vm.runInContext(online.slice(start,end),h.ctx);
    h.state._trickRoomRounds=2;
    assert.equal(vm.runInContext('_serializeState()',h.ctx)._trickRoomRounds,2);
    vm.runInContext(resetBlock('prepareBattleStateFromCurrentBuilds'),h.ctx);
    assert.equal(vm.runInContext('_serializeState()',h.ctx)._trickRoomRounds,0);
});
