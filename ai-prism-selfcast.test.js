'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const data = loadGameData();
const source = fs.readFileSync(process.env.EW_AI_TEST_SOURCE || path.join(__dirname, 'ai.js'), 'utf8');
function setup(id) {
    const spell = data.SPELL_BY_ID[id];
    const unit = { id: 'caster', player: 1, x: 3, y: 3, z: 0, hp: 200, maxHp: 200, mp: 200, ap: 2, status: {}, spells: [spell] };
    const enemy = { id: 'enemy', player: 2, x: 4, y: 3, z: 0, hp: 200, maxHp: 200, status: {}, items: {} };
    const ally = { id: 'ally', player: 1, x: 3, y: 4, hp: 200, maxHp: 200, status: {} };
    const events = [], timers = [], fallback = [];
    const g = { state: { units: [unit, enemy, ally] }, STATUS_DEFS: data.STATUS_DEFS,
        bw: () => 8, bh: () => 8, unitHasStatus: (u, s) => !!u.status?.[s],
        getEffectiveSpellRange: (u, s) => s.range, getEffectiveRange: () => 1,
        isRangeBlockedByTerrain: () => false,
        TargetQuery: { apCost: s => s.apCost, canAfford: () => true },
        queueComputerAction: fn => fn(), doSpell: (u, x, y, z) => { events.push({ name: g.state.selectedTool, x, y, z }); return 650; },
        finishComputerAction: () => events.push('finished'), maybeTriggerComputerTurn: () => events.push('retry') };
    const ctx = { window: { GAME: g, EW_AI_DEBUG: true, setTimeout: (fn, ms) => timers.push({ fn, ms }) },
        console: { log: (...args) => { if (String(args[0]).includes('generic fallback')) fallback.push(args); }, warn() {} } };
    vm.createContext(ctx);
    const end = source.lastIndexOf('})();');
    vm.runInContext(source.slice(0, end) + `
        estDamage = () => 60;
        scoreOffensiveHit = () => ({ val: 60 });
        unitThreatOutput = () => 100;
        isProtected = (g, e) => !!e.protected;
        getTargetPriority = e => e.priority || 0;
        window.testAI = { findSpellTarget, scoreSpell, scoreSpells, executeAction };
    ` + source.slice(end), ctx);
    const v = { visibleEnemies: [enemy], allies: [ally], closestEnemy: enemy };
    const battle = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');
    const start = battle.indexOf('        function computeMirrorNetwork(player) {');
    const endNetwork = battle.indexOf('        // Segments (with frequency colour)', start);
    ctx.state = g.state;
    ctx._mirrorTileHeight = (x, y) => g.state.mirrors.find(m => m.x === x && m.y === y)?.z || 0;
    vm.runInContext(battle.slice(start, endNetwork) + 'window.computeMirrorNetwork = computeMirrorNetwork;', ctx);
    g.state.mirrors = [];
    // Canonical Tune costs 75 MP: default MP valuation rejects its score of 12.
    // A supported trained weight admits it and exposes the latent null target.
    if (id === 'raceTuneFrequency') g.getAIWeight = key => key === 'mpValuePerPoint_v4' ? 0.1 : undefined;
    return { spell, unit, enemy, ally, v, g, events, timers, fallback, ai: ctx.window.testAI, window: ctx.window };
}
function candidates(h) { const out = []; h.ai.scoreSpells(h.unit, h.v, out); return out; }


function mirrors(h, coords = [[2,3], [6,3], [6,6]]) {
    h.g.state.mirrors = coords.map(([x,y,z = 0], i) => ({x,y,z,hp:2,owner:h.unit.player,ownerUnitId:'teammate-'+i}));
}
for (const id of ['racePulseLattice', 'raceTuneFrequency']) {
    test(`${id}: shared teammate lattice yields self coordinates and finishes execution`, () => {
        const h = setup(id); mirrors(h); h.unit.z = 4;
        const actions = candidates(h); assert.equal(actions.length, 1);
        assert.equal(actions[0].target, h.unit);
        h.ai.executeAction(h.unit, actions[0], h.v);
        assert.deepEqual(h.events[0], {name:h.spell.name,x:3,y:3,z:4});
        assert.equal(h.timers[0].ms,650); h.timers[0].fn(); assert.equal(h.events[1],'finished');
    });
    test(`${id}: both seats share their own live prisms, not opposing or dead ones`, () => {
        const h = setup(id); h.unit.player = 2; h.enemy.player = 1; mirrors(h);
        assert.equal(candidates(h).length,1);
        h.g.state.mirrors.forEach(m => m.owner = 1); assert.equal(candidates(h).length,0);
        h.g.state.mirrors.forEach(m => { m.owner = 2; m.hp = 0; }); assert.equal(candidates(h).length,0);
    });
    test(`${id}: rejected execution memoizes spell and retries without a completion timer`, () => {
        const h = setup(id); mirrors(h); h.g.doSpell = () => 0;
        h.ai.executeAction(h.unit,candidates(h)[0],h.v);
        assert.equal(h.events[0],'retry'); assert.equal(h.timers.length,0); assert.equal(candidates(h).length,0);
    });
    test(`${id}: AP, MP, silence and canonical affordability remain gates`, () => {
        const h = setup(id); mirrors(h);
        h.unit.ap=0; assert.equal(candidates(h).length,0); h.unit.ap=2;
        h.unit.mp=0; assert.equal(candidates(h).length,0); h.unit.mp=200;
        h.unit.status.silence=1; assert.equal(candidates(h).length,0); h.unit.status.silence=0;
        h.g.TargetQuery.canAfford=()=>false; assert.equal(candidates(h).length,0);
    });
}
test('Pulse: disconnected, insufficient, empty and unseen lattices have no candidate', () => {
    const h=setup('racePulseLattice');
    mirrors(h,[[2,2],[4,4],[6,6]]); assert.equal(candidates(h).length,0);
    mirrors(h,[[2,3],[6,3]]); assert.equal(candidates(h).length,0);
    mirrors(h); h.enemy.y=1; assert.equal(candidates(h).length,0);
    h.enemy.y=3; h.v.visibleEnemies=[]; assert.equal(candidates(h).length,0);
});
test('Pulse: actual network volume catches interior enemy only across elevations', () => {
    const h=setup('racePulseLattice'); h.enemy.x=4; h.enemy.y=4;
    mirrors(h,[[2,2,0],[6,2,0],[2,6,0],[6,6,0]]); assert.equal(candidates(h).length,0);
    h.g.state.mirrors[3].z=2; const a=candidates(h); assert.equal(a.length,1); assert.equal(a[0].target,h.unit);
    assert.equal(h.ai.scoreSpell(h.unit,h.spell,h.unit,h.v),210);
});
test('Tune: existing two-prism tactical threshold and value stay unchanged', () => {
    const h=setup('raceTuneFrequency'); mirrors(h,[[2,3]]); assert.equal(candidates(h).length,0);
    mirrors(h,[[2,3],[6,3]]); assert.equal(h.ai.scoreSpell(h.unit,h.spell,h.unit,h.v),12);
    assert.ok(candidates(h)[0].target);
});

test('Tune: canonical cost under default MP weight is still rejected', () => {
    const h=setup('raceTuneFrequency'); mirrors(h); delete h.g.getAIWeight;
    assert.equal(h.spell.cost,75); assert.equal(candidates(h).length,0);
});
