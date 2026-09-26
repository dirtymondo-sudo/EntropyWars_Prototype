// spell-riders.test.js — THE SPELL LIBRARY Phase 3, THE TARGETING (SPELL_LIBRARY_PLAN.md §4.7, §6.2, §9 row 3).
//
// Two riders on a `damage` row: randomTargets (no aim — the host draws `count` victims from the legal pool with the
// seeded stream) and splash (after the primary hit, the units round the VICTIM take dmg × mult). Pinned here:
//   1. the data.js normalisers, the pure pick, the splash tiles, the lint, the mana formula and the description;
//   2. the battle.js pieces, sliced into a sandbox: the pool (legal, distinct, enemies only by default), the splash
//      (neighbours only, never the victim twice, never the caster, never allies unless team 'units'), the kind meta;
//   3. a random cast drawn from the REAL seeded stream (state.js _ewRngNext) is deterministic per seed;
//   4. the wiring: doSpell's branch, the splash call, the relay + guest handler, the AI, the rack badge, the shape.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');

const D = loadGameData();
/* deep-equal across the sandbox realm (load-data / vm objects carry another realm's prototypes) */
const same = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battleSrc = read('battle.js'), onlineSrc = read('online.js'), aiSrc = read('ai.js'), hudSrc = read('hud.js'), uiSrc = read('ui.js'), stateSrc = read('state.js');

/* A named function's source, by balanced braces from `function NAME(`. */
function fnSrc(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, 'missing function ' + name);
    let i = src.indexOf('{', start), depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return src.slice(start, i + 1);
}
function seededRng(seed) {
    const next = new Function('return ' + fnSrc(stateSrc, '_ewRngNext'))();
    let s = seed >>> 0;
    return () => { const r = next(s); s = r.s; return r.v; };
}

test('the normalisers: defaults, clamps, damage rows only', () => {
    const rt = D.spellRandomTargetsOf({ kind: 'damage', randomTargets: { count: 3 } });
    same(rt, { count: 3, scope: 'enemies', distinct: true, mult: 1 });
    assert.strictEqual(D.spellRandomTargetsOf({ kind: 'damage', randomTargets: { count: 99, scope: 'units', distinct: false, mult: 0.5 } }).count, 8, 'clamped to SPELL_RANDOM_MAX');
    assert.strictEqual(D.spellRandomTargetsOf({ kind: 'damage', randomTargets: { count: 0 } }), null);
    assert.strictEqual(D.spellRandomTargetsOf({ kind: 'aoe', randomTargets: { count: 3 } }), null, 'a non-damage kind never reads it');
    assert.strictEqual(D.spellRandomTargetsOf({ kind: 'damage' }), null);
    same(D.spellSplashOf({ kind: 'damage', splash: { radius: 1 } }), { mult: 0.5, radius: 1, mask: null, team: 'enemies' });
    assert.strictEqual(D.spellSplashOf({ kind: 'damage', splash: { mult: 0.5 } }), null, 'no radius and no mask = no splash');
    const m = D.spellSplashOf({ kind: 'damage', splash: { mask: D.AOE_PRESETS.cross2, team: 'units' } });
    assert.strictEqual(m.radius, 2); assert.strictEqual(m.team, 'units');
});

test('the splash tiles: the origin is never in them; radius 1 = the 8 round the victim; a mask is its own shape', () => {
    const r1 = D.splashOffsets({ kind: 'damage', splash: { radius: 1 } });
    assert.strictEqual(r1.length, 8);
    assert.ok(!r1.some(o => o[0] === 0 && o[1] === 0));
    assert.strictEqual(D.splashOffsets({ kind: 'damage', splash: { radius: 2 } }).length, 24);
    assert.strictEqual(D.splashOffsets({ kind: 'damage', splash: { mask: D.AOE_PRESETS.cross1 } }).length, 4);
    const tiles = D.splashTilesAround({ kind: 'damage', splash: { radius: 1 } }, 0, 0, 8, 8);
    same(tiles.map(t => t.x + ',' + t.y).sort(), ['0,1', '1,0', '1,1']);
});

test('the pick: count distinct victims; fewer victims ⇒ fewer shots; repeats only when distinct is false', () => {
    const pool = ['a', 'b', 'c', 'd', 'e'];
    for (let seed = 1; seed < 40; seed++) {
        const picks = D.pickRandomTargets(pool, 3, true, seededRng(seed));
        assert.strictEqual(picks.length, 3);
        assert.strictEqual(new Set(picks).size, 3, 'distinct');
        assert.ok(picks.every(p => pool.includes(p)));
    }
    assert.strictEqual(D.pickRandomTargets(['a', 'b'], 3, true, seededRng(7)).length, 2);
    assert.strictEqual(D.pickRandomTargets(['a'], 3, false, seededRng(7)).length, 3);
    same(D.pickRandomTargets([], 3, true, seededRng(7)), []);
    // one draw per pick — the stream discipline
    let draws = 0; const rng = seededRng(3);
    D.pickRandomTargets(pool, 3, true, () => { draws++; return rng(); });
    assert.strictEqual(draws, 3);
    // the same seed gives the same picks (host and replay agree)
    same(D.pickRandomTargets(pool, 3, true, seededRng(11)), D.pickRandomTargets(pool, 3, true, seededRng(11)));
});

test('the lint, the mana formula and the description read the riders', () => {
    const ctx = D.spellLintContext();
    const rules = d => D.spellLint(d, ctx).map(h => h.rule);
    assert.ok(rules({ id: 'q1', name: 'Q1', kind: 'aoe', aoeRadius: 1, dmg: 50, splash: { radius: 1 } }).includes('riderKind'));
    assert.ok(rules({ id: 'q2', name: 'Q2', kind: 'damage', dmg: 50, randomTargets: { count: 0 } }).includes('riderInvalid'));
    assert.ok(!rules(D.SPELL_BY_ID.riderScatterShot).some(r => r.startsWith('rider')));
    const base = { kind: 'damage', dmg: 64, range: 4, damageType: 'physical' };
    const plain = D.computeSpellManaCost(base);
    assert.ok(D.computeSpellManaCost(Object.assign({}, base, { randomTargets: { count: 3 } })) > plain, 'three shots cost more than one');
    assert.ok(D.computeSpellManaCost(Object.assign({}, base, { splash: { radius: 1 } })) > plain, 'a splash costs more than a single hit');
    assert.match(D.describeSpell(D.SPELL_BY_ID.riderScatterShot), /3 different random enemies in range — no aim/);
    assert.match(D.describeSpell(D.SPELL_BY_ID.riderImpactRound), /Splashes 50% of it onto every enemy adjacent to the target/);
});

test('the two example rows ship off every pool (the user keeps or deletes them)', () => {
    for (const id of ['riderScatterShot', 'riderImpactRound']) {
        const sp = D.SPELL_BY_ID[id];
        assert.ok(sp, id);
        assert.strictEqual(sp.kind, 'damage');
        assert.ok(!D.SPELL_LIBRARY.includes(sp), id + ' is not a job-library row');
        assert.ok(!Object.values(D.RACE_ABILITIES).some(a => a.includes(sp)), id + ' is not a race row');
        assert.ok(D.spellLint(sp, D.spellLintContext()).some(h => h.rule === 'offPool'));
        assert.strictEqual(sp.tier, 2); assert.strictEqual(sp.role, 'damage');
    }
    assert.ok(D.spellRandomTargetsOf(D.SPELL_BY_ID.riderScatterShot));
    assert.ok(D.spellSplashOf(D.SPELL_BY_ID.riderImpactRound));
});

/* The battle.js pieces in a sandbox: a caster at (3,3) of player 1, enemies and allies round a victim. */
function battleSandbox(units, spell) {
    const hits = [], fx = [];
    const ctx = {
        window: {}, state: { units, phase: 'battle' }, console,
        SPELL_BY_ID: D.SPELL_BY_ID, spellRandomTargetsOf: D.spellRandomTargetsOf, spellSplashOf: D.spellSplashOf,
        splashTilesAround: D.splashTilesAround, splashOffsets: D.splashOffsets,
        bw: () => 10, bh: () => 10,
        isEnemyUnit: (a, b) => a.player !== b.player, isUnitRealmShieldedFrom: (u) => !!u.realm, unitCryptidHiddenFrom: () => false,
        _getSpellValidTargets: (unit, sp) => units.filter(u => !u.dead && u.id !== unit.id
            && Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y) <= (sp.range || 0)
            && (u.player !== unit.player || sp._riderAnyTeam)).map(u => ({ x: u.x, y: u.y, unit: u })),
        computeSpellBase: (sp, power) => (sp.dmg || 0) + power,
        applyDamageToUnit: (u, dmg, label) => hits.push({ id: u.id, dmg, label }),
        playSpellRiderFx: (kind, p) => fx.push({ kind, p }),
        getSpellElement: () => null, classifySpellElement: () => null, addLog() {}, unitDisplayName: u => u.id,
    };
    vm.createContext(ctx);
    const src = ['_riderBaseDef', '_randomTargetPool', '_splashVictims', '_applySplashDamage'].map(n => fnSrc(battleSrc, n)).join('\n')
        + '\n' + battleSrc.slice(battleSrc.indexOf('const _HINGE_KIND_META'), battleSrc.indexOf('function _kindMeta(')) + fnSrc(battleSrc, '_kindMeta')
        + '\nwindow.T = { _riderBaseDef, _randomTargetPool, _splashVictims, _applySplashDamage, _kindMeta };';
    vm.runInContext('const SPELL_KIND_META = { damage: { minRange: 1, offensive: true } };\n' + src, ctx);
    return { T: ctx.window.T, hits, fx, spell };
}
const U = (id, player, x, y, extra) => Object.assign({ id, player, x, y, hp: 100 }, extra || {});

test('the kind meta: a random-target row is an aimless attack; the row without it is a plain single-target hit', () => {
    const { T } = battleSandbox([], null);
    const m = T._kindMeta(D.SPELL_BY_ID.riderScatterShot);
    assert.ok(m.selfCast && m.offensive && m.breaksStealth);
    assert.strictEqual(m.minRange, 0);
    const base = T._riderBaseDef(D.SPELL_BY_ID.riderScatterShot);
    assert.strictEqual(base.randomTargets, undefined);
    assert.ok(!T._kindMeta(base).selfCast);
    assert.ok(D.SPELL_BY_ID.riderScatterShot.randomTargets, 'the shipped row keeps its rider');
    assert.ok(!T._kindMeta(D.SPELL_BY_ID.riderImpactRound).selfCast, 'a splash row is still aimed');
});

test('the pool: legal enemies only (never the caster, never an ally, never a realm-shielded unit); scope units adds allies', () => {
    const caster = U('c', 1, 3, 3);
    const units = [caster, U('e1', 2, 4, 3), U('e2', 2, 3, 5), U('far', 2, 9, 9), U('ally', 1, 2, 3), U('realm', 2, 3, 2, { realm: true })];
    const { T } = battleSandbox(units);
    const pool = T._randomTargetPool(caster, D.SPELL_BY_ID.riderScatterShot).map(u => u.id).sort();
    same(pool, ['e1', 'e2']);
    const anyUnit = Object.assign({}, D.SPELL_BY_ID.riderScatterShot, { randomTargets: { count: 3, scope: 'units' } });
    same(T._randomTargetPool(caster, anyUnit).map(u => u.id).sort(), ['ally', 'e1', 'e2']);
    // a seeded cast: count picks, distinct, every pick from the pool
    const picks = D.pickRandomTargets(T._randomTargetPool(caster, D.SPELL_BY_ID.riderScatterShot), 3, true, seededRng(5));
    assert.strictEqual(picks.length, 2, 'two legal victims ⇒ two shots');
    assert.strictEqual(new Set(picks.map(u => u.id)).size, 2);
});

test('the splash: neighbours only, never the victim twice, never the caster, never allies (team enemies)', () => {
    const caster = U('c', 1, 4, 4);
    const victim = U('v', 2, 5, 4);
    const units = [caster, victim, U('n1', 2, 6, 4), U('n2', 2, 5, 5), U('diag', 2, 6, 5), U('far', 2, 7, 4), U('ally', 1, 5, 3)];
    const h = battleSandbox(units);
    const n = h.T._applySplashDamage(caster, D.SPELL_BY_ID.riderImpactRound, victim, 10);
    assert.strictEqual(n, 3);
    same(h.hits.map(x => x.id).sort(), ['diag', 'n1', 'n2']);
    assert.ok(h.hits.every(x => x.dmg === Math.round((90 + 10) * 0.5)), 'dmg × mult');
    assert.ok(!h.hits.some(x => x.id === 'v' || x.id === 'c' || x.id === 'ally'));
    assert.strictEqual(h.fx.length, 1); assert.strictEqual(h.fx[0].kind, 'splash');
    same([h.fx[0].p.x, h.fx[0].p.y], [5, 4]);
});

test('the splash with team units hits allies round the victim but never the caster', () => {
    const caster = U('c', 1, 4, 4);
    const victim = U('v', 2, 5, 4);
    const units = [caster, victim, U('ally', 1, 5, 3), U('n1', 2, 6, 4)];
    const spell = Object.assign({}, D.SPELL_BY_ID.riderImpactRound, { splash: { mult: 0.5, radius: 1, team: 'units' } });
    const h = battleSandbox(units);
    h.T._applySplashDamage(caster, spell, victim, 0);
    same(h.hits.map(x => x.id).sort(), ['ally', 'n1']);
    const h2 = battleSandbox([caster, victim]);
    assert.strictEqual(h2.T._applySplashDamage(caster, spell, victim, 0), 0, 'nobody round it ⇒ no damage draw');
    assert.strictEqual(h2.hits.length, 0);
});

test('the wiring: doSpell, the hit, the relay, the AI, the rack', () => {
    assert.match(battleSrc, /const _rndRider = spell\.kind === 'damage' \? spellRandomTargetsOf\(spell\) : null;/);
    assert.match(battleSrc, /pickRandomTargets\(_rndPool, _rndRider\.count, _rndRider\.distinct, engineRng\)/, 'the host draws with the seeded stream');
    assert.match(battleSrc, /if \(spell\.splash && target\) _applySplashDamage\(unit, spell, target, spellPower\);[\s\S]{0,400}?\/\/ Post-effects/);
    assert.match(battleSrc, /if \(spell\.randomTargets && kind === 'damage' && spellRandomTargetsOf\(spell\)\) return _randomTargetPool\(unit, spell\)\.length > 0;/, 'the menus light the row only with a victim in reach');
    // online: the host relays the extra shots / the ring; the guest replays them (never re-rolls)
    assert.match(onlineSrc, /type: 'rider-fx', kind: kind/);
    assert.match(onlineSrc, /data\.type === 'rider-fx' && _ewMirrorView\(\)/);
    assert.ok(!/_randomPicks/.test(battleSrc), 'no new state field — nothing for the snapshot skip list');
    // AI + rack
    assert.match(aiSrc, /if \(kind === 'damage' && _riderRandomOf\(spell\)\) return target \? _randomTargetsScore/);
    assert.match(hudSrc, /for \(const bd of _hrlgRiderBadges\(sp\)\) badges\.push\(bd\);/);
    assert.match(uiSrc, /function _slb2RiderEditor\(id, f, val, d\)/);
});

test('the rack shape: a splash row draws the victim + its splash tiles', () => {
    const ctx = { spellSplashOf: D.spellSplashOf, splashOffsets: D.splashOffsets, aoeMaskValid: D.aoeMaskValid, aoeMaskPresetOf: D.aoeMaskPresetOf };
    vm.createContext(ctx);
    vm.runInContext(fnSrc(hudSrc, '_hrlgSpellShape') + fnSrc(hudSrc, '_hrlgCellShape') + '\nthis.shape = _hrlgSpellShape;', ctx);
    const s = ctx.shape(D.SPELL_BY_ID.riderImpactRound);
    assert.strictEqual(s.kind, 'mask'); assert.strictEqual(s.r, 1); assert.strictEqual(s.cells.size, 9);
    assert.match(s.label, /Splash 50%/);
    assert.strictEqual(ctx.shape(D.SPELL_BY_ID.riderScatterShot), null, 'a random row has no footprint');
});
