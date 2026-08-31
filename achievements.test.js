// achievements.test.js — validates the ACH_CATALOG / ACH_CHAMP_LINES registry
// in data.js (ACHIEVEMENTS_PLAN.md Phase 1). Runs via `npm test` (node --test).
// Zero dependencies; loads the REAL data.js through load-data.js.

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { loadGameData } = require('./load-data.js');

const data = loadGameData();

test('ACH_CATALOG exists and is exported', () => {
    assert.ok(Array.isArray(data.ACH_CATALOG), 'ACH_CATALOG must be an array');
    assert.ok(data.ACH_CATALOG.length >= 20, 'catalog unexpectedly small');
    assert.ok(Array.isArray(data.ACH_CHAMP_LINES), 'ACH_CHAMP_LINES must be an array');
    assert.ok(Array.isArray(data.ACH_TIER_NAMES), 'ACH_TIER_NAMES must be an array');
    assert.ok(Array.isArray(data.ACH_TIER_COLORS), 'ACH_TIER_COLORS must be an array');
});

test('catalog lines are well-formed', () => {
    const ids = new Set();
    const metrics = new Set();
    for (const line of data.ACH_CATALOG) {
        assert.ok(line.id && typeof line.id === 'string', 'line missing id');
        assert.ok(!ids.has(line.id), `duplicate id: ${line.id}`);
        ids.add(line.id);
        assert.ok(line.metric && typeof line.metric === 'string', `${line.id}: missing metric`);
        assert.ok(!metrics.has(line.metric), `${line.id}: metric ${line.metric} used by two lines`);
        metrics.add(line.metric);
        assert.ok(line.name && line.desc && line.icon, `${line.id}: missing name/desc/icon`);
        assert.ok(['combat', 'support', 'battlefield', 'objectives', 'modes'].includes(line.cat),
            `${line.id}: unknown category ${line.cat}`);
        assert.ok(Array.isArray(line.tiers) && line.tiers.length >= 2 && line.tiers.length <= 6,
            `${line.id}: tiers must have 2-6 entries`);
        for (let i = 0; i < line.tiers.length; i++) {
            assert.ok(Number.isInteger(line.tiers[i]) && line.tiers[i] > 0,
                `${line.id}: tier ${i} must be a positive integer`);
            if (i > 0) assert.ok(line.tiers[i] > line.tiers[i - 1],
                `${line.id}: tiers must be strictly ascending`);
        }
        // Tier count never exceeds the shared name/color ladders.
        assert.ok(line.tiers.length <= data.ACH_TIER_NAMES.length, `${line.id}: more tiers than tier names`);
        assert.ok(line.tiers.length <= data.ACH_TIER_COLORS.length, `${line.id}: more tiers than tier colors`);
    }
});

test('unlock keys cannot collide between standard and champ lines', () => {
    // Standard keys are `${id}.${i}`; champ keys are `champ.${race}.${metric}.${i}`.
    // A standard line id starting with 'champ.' would collide with the champ
    // namespace.
    for (const line of data.ACH_CATALOG) {
        assert.ok(!line.id.startsWith('champ.'), `${line.id}: id collides with champ.* namespace`);
        assert.ok(!line.id.startsWith('feat_'), `${line.id}: id collides with feat_* (legacy migration) namespace`);
        assert.ok(!line.id.includes('..'), `${line.id}: id must not contain '..'`);
    }
});

test('champ lines are well-formed', () => {
    const metrics = new Set();
    for (const spec of data.ACH_CHAMP_LINES) {
        assert.ok(spec.metric && !metrics.has(spec.metric), 'champ line metric missing or duplicated');
        metrics.add(spec.metric);
        assert.ok(spec.name && spec.icon, `champ line ${spec.metric}: missing name/icon`);
        assert.ok(Array.isArray(spec.tiers) && spec.tiers.length >= 2, `champ line ${spec.metric}: bad tiers`);
        for (let i = 1; i < spec.tiers.length; i++) {
            assert.ok(spec.tiers[i] > spec.tiers[i - 1], `champ line ${spec.metric}: tiers must ascend`);
        }
    }
    // The three mastery ladders the plan defines (§4.1).
    for (const m of ['kills', 'wins', 'deathless']) {
        assert.ok(metrics.has(m), `champ line missing: ${m}`);
    }
});

test('win-condition metrics stay in sync with the engine strings', () => {
    // battle.js commitAchProgress maps state._winCondition → these metrics;
    // every mapped metric must exist as a catalog line so wins are never
    // counted into a line no UI will ever show.
    const catalogMetrics = new Set(data.ACH_CATALOG.map(l => l.metric));
    const expected = [
        'wins_wipeout', 'wins_tower', 'wins_hourglass', 'wins_nexus',
        'wins_composite', 'wins_suddenDeath', 'wins_flags',
        'wins_arena', 'wins_tdm', 'wins_clash', 'wins_simul', 'wins_gauntlet',
        'wins_total', 'md_clears',
    ];
    for (const m of expected) {
        assert.ok(catalogMetrics.has(m), `catalog missing win metric: ${m}`);
    }
});

test('high-water lines are marked', () => {
    // Streak/best-run/mastery-count metrics merge by max(), not addition
    // (battle.js hw() + _achEvaluateTiers) — the flags must match exactly.
    const HW = new Set(['bestStreak', 'challenge_runWins', 'survival_bestStreak',
        'md_bestFloor', 'champsMastered']);
    for (const m of HW) {
        const line = data.ACH_CATALOG.find(l => l.metric === m);
        assert.ok(line, `hw line missing: ${m}`);
        assert.strictEqual(line.hw, true, `${m} must be a high-water (hw) line`);
    }
    // Everything else is additive.
    for (const line of data.ACH_CATALOG) {
        if (!HW.has(line.metric)) {
            assert.ok(!line.hw, `${line.id}: unexpected hw flag`);
        }
    }
});

test('Phase-2 deferred metrics exist in the catalog', () => {
    const metrics = new Set(data.ACH_CATALOG.map(l => l.metric));
    for (const m of ['tilesChanged', 'flyersGrounded', 'comebacks',
        'challenge_runWins', 'survival_bestStreak', 'md_bestFloor', 'champsMastered']) {
        assert.ok(metrics.has(m), `catalog missing Phase-2 metric: ${m}`);
    }
});

test('tier rewards cover every tier and are sane (§4.7)', () => {
    const r = data.ACH_TIER_REWARDS;
    assert.ok(Array.isArray(r), 'ACH_TIER_REWARDS must be an array');
    const maxTiers = Math.max(...data.ACH_CATALOG.map(l => l.tiers.length),
        ...data.ACH_CHAMP_LINES.map(s => s.tiers.length));
    assert.ok(r.length >= maxTiers, `rewards array shorter than deepest ladder (${r.length} < ${maxTiers})`);
    for (let i = 0; i < r.length; i++) {
        assert.ok(Number.isInteger(r[i]) && r[i] > 0, `reward ${i} must be a positive integer`);
        if (i > 0) assert.ok(r[i] >= r[i - 1], 'rewards must be non-decreasing by tier');
    }
});

test('mastery bar matches the champ ladders (§4.1)', () => {
    const M = data.ACH_MASTERY;
    assert.ok(M && typeof M === 'object', 'ACH_MASTERY missing');
    // Each requirement must be an actual threshold on its champ ladder —
    // and deliberately NOT the top tier (the meta-chase must stay human).
    for (const [metric, req] of Object.entries(M)) {
        const spec = data.ACH_CHAMP_LINES.find(s => s.metric === metric);
        assert.ok(spec, `ACH_MASTERY references unknown champ line: ${metric}`);
        assert.ok(spec.tiers.includes(req), `${metric} mastery bar ${req} is not a ladder threshold`);
        assert.ok(req < spec.tiers[spec.tiers.length - 1], `${metric} mastery bar must sit below the top tier`);
    }
    // The Heat Death line's final tier equals the roster size.
    const heatDeath = data.ACH_CATALOG.find(l => l.metric === 'champsMastered');
    assert.strictEqual(heatDeath.tiers[heatDeath.tiers.length - 1], data.AVAILABLE_RACES.length,
        'champsMastered top tier must equal the champ roster size');
});
