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
        getEffectiveSpellRange: (u, s) => s.range, getEffectiveRange: () => 1, getUnitStandingHeight: u => u.z || 0,
        isRangeBlockedByTerrain: () => false,
        TargetQuery: { apCost: s => s.apCost, canAfford: () => true },
        queueComputerAction: fn => fn(), doSpell: (u, x, y, z) => { events.push({ name: g.state.selectedTool, x, y, z }); return 650; },
        finishComputerAction: () => events.push('finished'), maybeTriggerComputerTurn: () => events.push('retry') };
    const ctx = { window: { GAME: g, EW_AI_DEBUG: true, setTimeout: (fn, ms) => timers.push({ fn, ms }) },
        console: { log: (...args) => { if (String(args[0]).includes('generic fallback')) fallback.push(args); }, warn() {} },
        // THE TARGETING RIDERS (Phase 3): ai.js reads data.js's rider normalisers as globals
        spellRandomTargetsOf: data.spellRandomTargetsOf, spellSplashOf: data.spellSplashOf, splashOffsets: data.splashOffsets };
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
    return { spell, unit, enemy, ally, v, g, events, timers, fallback, ai: ctx.window.testAI };
}
function candidates(h) { const out = []; h.ai.scoreSpells(h.unit, h.v, out); return out; }

test('Hit a Lick discovers a visible legal Key carrier and uses the dedicated value', () => {
    const h = setup('raceHitALick'); h.enemy.hourglasses = 1;
    assert.equal(h.ai.findSpellTarget(h.unit, h.spell, h.v), h.enemy);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, h.enemy, h.v), 200);
    assert.equal(candidates(h).length, 1); assert.equal(h.fallback.length, 0);
});
test('Hit a Lick prefers a Key carrier over ordinary targets and values items', () => {
    const h = setup('raceHitALick'); h.enemy.items.potion = 1;
    const carrier = { ...h.enemy, id: 'carrier', x: 5, hourglasses: 1, items: {} };
    h.v.visibleEnemies.push(carrier);
    assert.equal(h.ai.findSpellTarget(h.unit, h.spell, h.v), carrier);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, h.enemy, h.v), 125);
});
test('Hit a Lick rejects protected, blocked, out-of-range and unseen targets', () => {
    const h = setup('raceHitALick');
    h.enemy.protected = true; assert.equal(candidates(h).length, 0);
    h.enemy.protected = false; h.g.isRangeBlockedByTerrain = () => true; assert.equal(candidates(h).length, 0);
    h.g.isRangeBlockedByTerrain = () => false; h.enemy.x = 7; assert.equal(candidates(h).length, 0);
    h.enemy.x = 4; h.v.visibleEnemies = []; assert.equal(candidates(h).length, 0);
});
test('Purify targets a debuffed ally and values removal rather than generic floor', () => {
    const h = setup('racePurify'); h.ally.status.slow = 2;
    const target = h.ai.findSpellTarget(h.unit, h.spell, h.v);
    assert.ok(target); assert.equal(target.x, h.ally.x); assert.equal(target.y, h.ally.y);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, target, h.v), 70);
    assert.equal(candidates(h).length, 1); assert.equal(h.fallback.length, 0);
});
test('Purify can strip enemy buffs and scores an empty area as zero', () => {
    const h = setup('racePurify');
    const buff = Object.keys(data.STATUS_DEFS).find(k => data.STATUS_DEFS[k].kind === 'buff');
    h.enemy.status[buff] = 2;
    const target = h.ai.findSpellTarget(h.unit, h.spell, h.v); assert.ok(target);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, target, h.v), 55);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, { x: 0, y: 0 }, h.v), 0);
});
test('Purify rejects no-effect, expired, dead, unseen and out-of-range candidates', () => {
    const h = setup('racePurify'); assert.equal(candidates(h).length, 0);
    h.ally.status.slow = 0; assert.equal(candidates(h).length, 0);
    h.ally.status.slow = 2; h.ally.dead = true; assert.equal(candidates(h).length, 0);
    h.ally.dead = false; h.ally.x = 7; h.ally.y = 7; assert.equal(candidates(h).length, 0);
    h.v.visibleEnemies = []; assert.equal(candidates(h).length, 0);
});
for (const id of ['raceHitALick', 'racePurify']) {
    test(`${id}: null target has no fallback value`, () => {
        const h = setup(id); assert.equal(h.ai.scoreSpell(h.unit, h.spell, null, h.v), 0); assert.equal(h.fallback.length, 0);
    });
    test(`${id}: candidate reaches executor with selected spell, coordinates and completion delay`, () => {
        const h = setup(id); h.ally.status.slow = 2; h.enemy.hourglasses = 1;
        const actions = candidates(h); assert.equal(actions.length, 1);
        const a = actions[0]; h.ai.executeAction(h.unit, a, h.v);
        assert.equal(h.events.length, 1); assert.equal(h.events[0].name, h.spell.name);
        assert.equal(h.events[0].x, a.target.x); assert.equal(h.events[0].y, a.target.y);
        assert.equal(h.timers[0].ms, 650); h.timers[0].fn(); assert.equal(h.events[1], 'finished');
    });
    test(`${id}: AP, MP, affordability, silence and execution-failure gates remain`, () => {
        const h = setup(id); h.ally.status.slow = 2; h.enemy.hourglasses = 1;
        h.unit.ap = 0; assert.equal(candidates(h).length, 0); h.unit.ap = 2;
        h.unit.mp = 0; assert.equal(candidates(h).length, 0); h.unit.mp = 200;
        h.g.TargetQuery.canAfford = () => false; assert.equal(candidates(h).length, 0); h.g.TargetQuery.canAfford = () => true;
        h.unit.status.silence = 1; assert.equal(candidates(h).length, 0); h.unit.status.silence = 0;
        h.g.doSpell = () => 0; const actions = candidates(h); assert.equal(actions.length, 1);
        h.ai.executeAction(h.unit, actions[0], h.v); assert.equal(h.events[0], 'retry');
        assert.equal(candidates(h).length, 0); assert.equal(h.timers.length, 0);
    });
}
test('legacy utility Plunder and Mimic retain their own dispatch', () => {
    const h = setup('raceHitALick'); const s = { id: 'racePlunder', name: 'Plunder', kind: 'utility', range: 1 };
    assert.equal(h.ai.findSpellTarget(h.unit, s, h.v), h.enemy);
    h.enemy.hourglasses = 1; assert.equal(h.ai.scoreSpell(h.unit, s, h.enemy, h.v), 150);
    assert.equal(h.ai.findSpellTarget(h.unit, { id: 'mimic', kind: 'utility' }, h.v), null);
});

/* THE TARGETING RIDERS (SPELL_LIBRARY_PLAN §6.2, Phase 3): the two shipped example rows */
test('Scatter Shot (randomTargets) is cast on the caster once an enemy is in reach, worth hits × the mean hit', () => {
    const h = setup('riderScatterShot');
    assert.equal(h.ai.findSpellTarget(h.unit, h.spell, h.v), h.unit);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, h.unit, h.v), 60);   // one enemy in reach, distinct ⇒ one hit
    const e2 = { ...h.enemy, id: 'e2', x: 5 }, e3 = { ...h.enemy, id: 'e3', x: 3, y: 1 }, e4 = { ...h.enemy, id: 'e4', x: 1, y: 3 };
    h.v.visibleEnemies.push(e2, e3, e4);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, h.unit, h.v), 180);  // four in reach, count 3 ⇒ three hits
    const actions = candidates(h); assert.equal(actions.length, 1); assert.equal(actions[0].target, h.unit);
    h.ai.executeAction(h.unit, actions[0], h.v);
    assert.equal(h.events[0].name, h.spell.name); assert.equal(h.events[0].x, h.unit.x); assert.equal(h.events[0].y, h.unit.y);
    assert.equal(h.fallback.length, 0);
});
test('Scatter Shot has no target and no value with nobody in reach', () => {
    const h = setup('riderScatterShot');
    h.enemy.x = 7; h.enemy.y = 7;
    assert.equal(h.ai.findSpellTarget(h.unit, h.spell, h.v), null);
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, null, h.v), 0);
    assert.equal(candidates(h).length, 0);
    h.enemy.x = 4; h.enemy.y = 3; h.enemy.protected = true; assert.equal(candidates(h).length, 0);
});
test('Impact Round (splash) prefers the victim with enemies round it and values the splash', () => {
    const h = setup('riderImpactRound');
    const lone = { ...h.enemy, id: 'lone', x: 3, y: 6 };
    const packA = { ...h.enemy, id: 'packA', x: 5, y: 3 }, packB = { ...h.enemy, id: 'packB', x: 5, y: 2 };
    h.v.visibleEnemies = [lone, packA, packB];
    const t = h.ai.findSpellTarget(h.unit, h.spell, h.v);
    assert.ok(t.id === 'packA' || t.id === 'packB', 'a victim with a neighbour');
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, lone, h.v), 60);        // nobody round it
    assert.equal(h.ai.scoreSpell(h.unit, h.spell, packA, h.v), 120);      // + packB (the stub scores every hit a flat 60, so the × 0.5 is not visible here)
    assert.equal(h.fallback.length, 0);
});
