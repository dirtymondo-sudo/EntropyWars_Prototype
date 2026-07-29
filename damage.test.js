// damage.test.js — pure damage math (extraction stage 2) guards.
//
// battle.js's "PURE DAMAGE MATH" block factors the numeric cores of the
// damage pipeline into dependency-free calc* functions (arguments in, value
// out — no globals, no state, no RNG draws). battle.js is a browser script
// and can't be require()d, so — exactly like rng.test.js does for the PRNG —
// these tests extract each calc* function from source by balanced braces,
// evaluate it in isolation, and pin down:
//   1. purity (no outer-scope references — the extraction contract),
//   2. the wrappers actually delegating to the cores (no silent forks),
//   3. the tuning constants the wrappers feed in,
//   4. the numbers: range curve, spell-base roll, resolution stage order,
//      cap/floor semantics, elemental-combo table, status/counter chances.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const battleSrc = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');

// The battle.js tuning constants here are plain numeric literals, sometimes
// several per `const` statement (`const A = 0.8, B = 1.2;`) — which
// load-data.js extractConst can't split. Match the `NAME = <number>`
// declarator directly instead.
function extractNumConst(src, name) {
    const m = new RegExp('(?:const\\s+|,\\s*)' + name + '\\s*=\\s*(-?\\d+(?:\\.\\d+)?)').exec(src);
    assert.ok(m, `numeric const ${name} not found in battle.js`);
    return Number(m[1]);
}

// Extract a `function NAME(...) { ... }` by balanced braces (rng.test.js
// technique), skipping past the parameter list first so `opts = {}` default
// params don't truncate the match. Returns the source text.
function extractFnSource(src, name) {
    const start = src.indexOf('function ' + name + '(');
    assert.notStrictEqual(start, -1, `battle.js must define function ${name}`);
    let i = src.indexOf('(', start), parens = 0;
    for (; i < src.length; i++) {
        if (src[i] === '(') parens++;
        else if (src[i] === ')' && --parens === 0) break;
    }
    let depth = 0;
    i = src.indexOf('{', i);
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return src.slice(start, i + 1);
}

function extractFn(src, name) {
    // eslint-disable-next-line no-new-func
    return new Function('return ' + extractFnSource(src, name))();
}

const CALC_FNS = ['calcRangeMult', 'calcSpellBase', 'calcStatusApplyChance',
    'calcCounterChance', 'calcElementComboMult', 'calcDamageResolution'];

const calcRangeMult = extractFn(battleSrc, 'calcRangeMult');
const calcSpellBase = extractFn(battleSrc, 'calcSpellBase');
const calcStatusApplyChance = extractFn(battleSrc, 'calcStatusApplyChance');
const calcCounterChance = extractFn(battleSrc, 'calcCounterChance');
const calcElementComboMult = extractFn(battleSrc, 'calcElementComboMult');
const calcDamageResolution = extractFn(battleSrc, 'calcDamageResolution');

// Tuning constants the wrappers feed the pure functions.
const C = {};
for (const name of ['RANGE_SWEET_SPOT', 'RANGE_DAMAGE_STEP', 'RANGE_MULT_MIN',
    'RANGE_MULT_MAX', 'SNIPER_RANGE_STEP', 'SNIPER_RANGE_MULT_MIN',
    'SNIPER_RANGE_MULT_MAX', 'MAX_OFFENSIVE_MULT', 'SPELL_DMG_VARIANCE']) {
    C[name] = extractNumConst(battleSrc, name);
}

const approx = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} !== ~${b}`);

test('calc* functions are pure — no outer-scope/engine references', () => {
    // The extraction contract: a calc* body referencing any engine global
    // would evaluate here but silently read `undefined` (or throw mid-battle
    // only). Forbid the known reachable names outright.
    const banned = /\b(state|window|document|engineRng|engineRandInt|Math\.random|randInt|addLog|showFloatingTextForUnit|unitHasStatus|getEffective\w*|STATUS_DEFS|opts)\b/;
    for (const name of CALC_FNS) {
        const body = extractFnSource(battleSrc, name);
        const m = banned.exec(body);
        assert.ok(!m, `${name} must stay dependency-free (found "${m && m[0]}")`);
    }
});

test('wrappers delegate to the pure cores (no forked math)', () => {
    const delegations = {
        getRangeDamageMult: 'calcRangeMult(',
        computeSpellBase: 'calcSpellBase(',
        rollStatusApply: 'calcStatusApplyChance(',
        getCounterChance: 'calcCounterChance(',
        applyDamageToUnit: 'calcDamageResolution(',
    };
    for (const [wrapper, core] of Object.entries(delegations)) {
        assert.ok(extractFnSource(battleSrc, wrapper).includes(core),
            `${wrapper} must call ${core}...)`);
    }
    assert.ok(extractFnSource(battleSrc, 'applyDamageToUnit').includes('calcElementComboMult('),
        'applyDamageToUnit must resolve elemental combos through calcElementComboMult');
});

test('tuning constants hold their balanced values', () => {
    assert.strictEqual(C.RANGE_SWEET_SPOT, 3);
    approx(C.RANGE_DAMAGE_STEP, 0.10, 'RANGE_DAMAGE_STEP');
    approx(C.RANGE_MULT_MIN, 0.8, 'RANGE_MULT_MIN');
    approx(C.RANGE_MULT_MAX, 1.2, 'RANGE_MULT_MAX');
    approx(C.SNIPER_RANGE_STEP, 0.15, 'SNIPER_RANGE_STEP');
    approx(C.SNIPER_RANGE_MULT_MIN, 0.6, 'SNIPER_RANGE_MULT_MIN');
    approx(C.SNIPER_RANGE_MULT_MAX, 1.2, 'SNIPER_RANGE_MULT_MAX');
    approx(C.MAX_OFFENSIVE_MULT, 3.0, 'MAX_OFFENSIVE_MULT');
    assert.strictEqual(C.SPELL_DMG_VARIANCE, 8);
});

// The params getRangeDamageMult passes for a normal unit / a Sniper.
const RP = (sniper) => ({
    sniper,
    sweetSpot: C.RANGE_SWEET_SPOT, step: C.RANGE_DAMAGE_STEP,
    min: C.RANGE_MULT_MIN, max: C.RANGE_MULT_MAX,
    sniperStep: C.SNIPER_RANGE_STEP,
    sniperMin: C.SNIPER_RANGE_MULT_MIN, sniperMax: C.SNIPER_RANGE_MULT_MAX,
});

test('range curve: sweet spot 3, ±10%/tile, clamped ±20%', () => {
    approx(calcRangeMult(0, RP(false)), 1, 'dist 0 (self) is neutral');
    approx(calcRangeMult(1, RP(false)), 1.2, 'point-blank hits the +20% cap');
    approx(calcRangeMult(2, RP(false)), 1.1, 'one inside the sweet spot: +10%');
    approx(calcRangeMult(3, RP(false)), 1.0, 'sweet spot is neutral');
    approx(calcRangeMult(4, RP(false)), 0.9, 'one beyond: −10%');
    approx(calcRangeMult(5, RP(false)), 0.8, 'two beyond hits the −20% floor');
    approx(calcRangeMult(12, RP(false)), 0.8, 'floor holds at any range');
    for (let d = 1; d < 12; d++) {
        assert.ok(calcRangeMult(d, RP(false)) >= calcRangeMult(d + 1, RP(false)) - 1e-9,
            `non-sniper curve must be non-increasing (dist ${d})`);
    }
});

test('sniper range curve inverts: −40% point-blank → +20% at 5+ tiles', () => {
    approx(calcRangeMult(1, RP(true)), 0.6, 'sniper point-blank floor');
    approx(calcRangeMult(2, RP(true)), 0.75, 'sniper +15%/tile climb');
    approx(calcRangeMult(5, RP(true)), 1.2, 'sniper reaches the cap at 5');
    approx(calcRangeMult(9, RP(true)), 1.2, 'sniper cap holds beyond 5');
    for (let d = 1; d < 12; d++) {
        assert.ok(calcRangeMult(d, RP(true)) <= calcRangeMult(d + 1, RP(true)) + 1e-9,
            `sniper curve must be non-decreasing (dist ${d})`);
    }
});

test('calcSpellBase: symmetric variance window, floor, determinism', () => {
    const V = C.SPELL_DMG_VARIANCE;
    // variance 0 is fully deterministic and ignores rand entirely.
    assert.strictEqual(calcSpellBase(100, 20, 0, 32, 0), 120);
    assert.strictEqual(calcSpellBase(100, 20, 0, 32, 0.999999), 120);
    // The floor catches weak rolls.
    assert.strictEqual(calcSpellBase(10, 0, 0, 32, 0), 32);
    // rand→roll mapping: 0 ⇒ −V, just-under-1 ⇒ +V, mid ⇒ 0.
    assert.strictEqual(calcSpellBase(100, 0, V, 32, 0), 100 - V);
    assert.strictEqual(calcSpellBase(100, 0, V, 32, 1 - 1e-12), 100 + V);
    assert.strictEqual(calcSpellBase(100, 0, V, 32, 0.5), 100);
    // Every possible roll stays inside [base−V, base+V].
    for (let r = 0; r < 1; r += 0.001) {
        const v = calcSpellBase(200, 0, V, 32, r);
        assert.ok(v >= 200 - V && v <= 200 + V, `roll out of window: ${v} (rand ${r})`);
    }
    // Same rand ⇒ same number (the seeded-replay requirement).
    assert.strictEqual(calcSpellBase(80, 15, V, 32, 0.371),
        calcSpellBase(80, 15, V, 32, 0.371));
});

test('calcStatusApplyChance clamps to the 5%–95% window', () => {
    approx(calcStatusApplyChance(1, 0), 0.95, 'certainty is capped');
    approx(calcStatusApplyChance(2, 0.5), 0.95, 'overshoot is capped');
    approx(calcStatusApplyChance(0, -1), 0.05, 'floor holds');
    approx(calcStatusApplyChance(0.5, 0), 0.5, 'mid passes through');
    approx(calcStatusApplyChance(0.3, 0.2), 0.5, 'INT modifier adds');
});

test('calcCounterChance: class table, DEF threshold, guard bonus, 75% cap', () => {
    approx(calcCounterChance('Swordmaster', 0, 0), 0.35, 'Riposte');
    approx(calcCounterChance('Warrior', 0, 0), 0.30, 'Warrior');
    approx(calcCounterChance('Tank', 0, 0), 0.30, 'Tank');
    approx(calcCounterChance('Mage', 12, 0), 0.20, 'high DEF fallback');
    approx(calcCounterChance('Mage', 11, 0), 0.12, 'baseline');
    approx(calcCounterChance('Mage', 0, 0.1), 0.22, 'guard bonus adds');
    approx(calcCounterChance('Swordmaster', 0, 0.5), 0.75, 'hard cap at 75%');
});

test('elemental combo table: lightning/fire vs soaked/tech', () => {
    assert.deepStrictEqual(calcElementComboMult('lightning', { soaked: true, tech: false }),
        { mult: 1.5, supercharge: false, note: 'soakedShock' });
    assert.deepStrictEqual(calcElementComboMult('lightning', { soaked: true, tech: true }),
        { mult: 1.5, supercharge: false, note: 'shortCircuit' });
    assert.deepStrictEqual(calcElementComboMult('lightning', { soaked: false, tech: true }),
        { mult: 0.5, supercharge: true, note: 'overclock' });
    assert.deepStrictEqual(calcElementComboMult('lightning', { soaked: false, tech: false }),
        { mult: 1, supercharge: false, note: null });
    assert.deepStrictEqual(calcElementComboMult('fire', { soaked: true, tech: false }),
        { mult: 0.75, supercharge: false, note: 'soakedFire' });
    assert.deepStrictEqual(calcElementComboMult('fire', { soaked: false, tech: true }),
        { mult: 1, supercharge: false, note: null });
    assert.deepStrictEqual(calcElementComboMult('cold', { soaked: true, tech: true }),
        { mult: 1, supercharge: false, note: null });
    assert.deepStrictEqual(calcElementComboMult(null, { soaked: true, tech: true }),
        { mult: 1, supercharge: false, note: null });
});

// Baseline resolution input: every stage inert.
const R = (over) => Object.assign({
    base: 100, offMult: 1, offCap: C.MAX_OFFENSIVE_MULT, markedBonus: 0,
    levelMult: null, armor: 0, heightSoak: 0, bulwarkSoak: 0, hourglassSoak: 0,
    rangedMult: null, statusTakenMult: 1, shield: 0, shieldIgnore: 0,
}, over);

test('resolution: armor subtracts flat and floors the hit at 1', () => {
    assert.strictEqual(calcDamageResolution(R({})).dmg, 100);
    assert.strictEqual(calcDamageResolution(R({ armor: 30 })).dmg, 70);
    assert.strictEqual(calcDamageResolution(R({ base: 10, armor: 50 })).dmg, 1);
    // Each soak floors independently — stacked soaks never blank a hit.
    assert.strictEqual(calcDamageResolution(R({
        base: 5, armor: 2, heightSoak: 5, bulwarkSoak: 5, hourglassSoak: 5,
    })).dmg, 1);
});

test('resolution: offensive product caps at ×3, penalties stay uncapped', () => {
    assert.strictEqual(calcDamageResolution(R({ offMult: 5 })).dmg, 300);
    assert.strictEqual(calcDamageResolution(R({ offMult: C.MAX_OFFENSIVE_MULT })).dmg, 300);
    assert.strictEqual(calcDamageResolution(R({ offMult: 1.5 })).dmg, 150);
    // Below ×1 the product applies in full (defender's earned reward).
    assert.strictEqual(calcDamageResolution(R({ offMult: 0.25 })).dmg, 25);
});

test('resolution stage order: cap → marked → level → armor → status mults', () => {
    // Marked lands AFTER the capped product (its card value is its value)…
    assert.strictEqual(calcDamageResolution(R({ offMult: 5, markedBonus: 40 })).dmg, 340);
    // …but BEFORE level scaling and armor.
    assert.strictEqual(calcDamageResolution(R({ markedBonus: 40, levelMult: 2, armor: 30 })).dmg, 250);
    // Level scaling multiplies before armor subtracts: 100×2−50, not (100−50)×2.
    assert.strictEqual(calcDamageResolution(R({ levelMult: 2, armor: 50 })).dmg, 150);
    // Status damage-taken multiplier applies after the soaks.
    assert.strictEqual(calcDamageResolution(R({ armor: 40, statusTakenMult: 0.5 })).dmg, 30);
    // …and never revives a zero hit (gated on dmg > 0).
    assert.strictEqual(calcDamageResolution(R({ base: 0, statusTakenMult: 0.5 })).dmg, 0);
});

test('resolution: ranged-taken stage quirk — applicable ⇒ floor 1 even at 0', () => {
    // Parity guard for a long-standing applyDamageToUnit behavior: when the
    // ranged-mult stage applies (physical enemy hit), Math.max(1, …) turns
    // even a 0-damage hit into 1. Skipped (null) it stays 0.
    assert.strictEqual(calcDamageResolution(R({ base: 0, rangedMult: 1 })).dmg, 1);
    assert.strictEqual(calcDamageResolution(R({ base: 0, rangedMult: null })).dmg, 0);
    assert.strictEqual(calcDamageResolution(R({ rangedMult: 0.5 })).dmg, 50);
});

test('resolution: shield absorbs last, shieldIgnore pierces', () => {
    let r = calcDamageResolution(R({ shield: 30 }));
    assert.deepStrictEqual({ dmg: r.dmg, absorbed: r.absorbed, shieldLeft: r.shieldLeft },
        { dmg: 70, absorbed: 30, shieldLeft: 0 });
    r = calcDamageResolution(R({ shield: 200 }));
    assert.deepStrictEqual({ dmg: r.dmg, absorbed: r.absorbed, shieldLeft: r.shieldLeft },
        { dmg: 0, absorbed: 100, shieldLeft: 100 });
    // shieldIgnore reduces what the shield may absorb, not the shield itself.
    r = calcDamageResolution(R({ shield: 200, shieldIgnore: 150 }));
    assert.deepStrictEqual({ dmg: r.dmg, absorbed: r.absorbed, shieldLeft: r.shieldLeft },
        { dmg: 50, absorbed: 50, shieldLeft: 150 });
    // Shield applies AFTER mitigation: 100−60 armor = 40, all absorbed.
    r = calcDamageResolution(R({ armor: 60, shield: 40 }));
    assert.deepStrictEqual({ dmg: r.dmg, absorbed: r.absorbed, shieldLeft: r.shieldLeft },
        { dmg: 0, absorbed: 40, shieldLeft: 0 });
});
