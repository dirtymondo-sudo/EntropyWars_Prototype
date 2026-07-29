// test/content-schema.test.js — schema validation for the canonical game data.
//
// Loads the REAL data.js headlessly (tools/load-data.js) and asserts the
// invariants the engine and party builder silently rely on, so a malformed
// spell / missing race entry fails during development instead of mid-match.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { loadGameData } = require('./load-data');

const D = loadGameData();

test('every race has a profile and a valid default job', () => {
    const classes = new Set(Object.keys(D.CLASS_TEMPLATES));
    const problems = [];
    for (const race of D.AVAILABLE_RACES) {
        const prof = D.RACE_PROFILES[race];
        if (!prof) { problems.push(`race '${race}' has no RACE_PROFILES entry`); continue; }
        if (!prof.label) problems.push(`race '${race}' profile has no label`);
        if (!Array.isArray(prof.types) || !prof.types.length) problems.push(`race '${race}' profile has no types`);
        const job = D.RACE_DEFAULT_JOBS[race];
        if (!job) problems.push(`race '${race}' has no RACE_DEFAULT_JOBS entry`);
        else if (!classes.has(job)) problems.push(`race '${race}' default job '${job}' is not a CLASS_TEMPLATES class`);
    }
    assert.deepStrictEqual(problems, []);
});

test('every RACE_PROFILES / RACE_DEFAULT_JOBS key is a known race', () => {
    const races = new Set(D.AVAILABLE_RACES);
    const problems = [];
    for (const k of Object.keys(D.RACE_PROFILES)) {
        if (!races.has(k)) problems.push(`RACE_PROFILES key '${k}' is not in AVAILABLE_RACES`);
    }
    for (const k of Object.keys(D.RACE_DEFAULT_JOBS)) {
        if (!races.has(k)) problems.push(`RACE_DEFAULT_JOBS key '${k}' is not in AVAILABLE_RACES`);
    }
    assert.deepStrictEqual(problems, []);
});

test('class templates have sane combat stats', () => {
    const problems = [];
    for (const [cls, t] of Object.entries(D.CLASS_TEMPLATES)) {
        for (const stat of ['hp', 'mp', 'atk', 'def', 'mdef', 'range', 'move', 'awr']) {
            const v = t[stat];
            if (typeof v !== 'number' || !isFinite(v) || v < 0) {
                problems.push(`class '${cls}' stat '${stat}' is ${v}`);
            }
        }
        if (t.hp <= 0) problems.push(`class '${cls}' hp must be > 0 (got ${t.hp})`);
        if (t.move <= 0) problems.push(`class '${cls}' move must be > 0 (got ${t.move})`);
    }
    assert.deepStrictEqual(problems, []);
});

function validateSpell(sp, where, classes, problems) {
    if (!sp || typeof sp !== 'object') { problems.push(`${where}: not an object`); return; }
    const label = `${where} '${sp.id || sp.name || '?'}'`;
    if (!sp.id) problems.push(`${label}: missing id`);
    if (!sp.name) problems.push(`${label}: missing name`);
    if (!sp.desc) problems.push(`${label}: missing desc`);
    if (!sp.type) problems.push(`${label}: missing type`);
    // apCost is OPTIONAL by design — getSpellApCost (battle.js) defaults it to
    // AP_COST_SPELL and clamps. Only validate fields when present.
    for (const num of ['cost', 'apCost', 'range']) {
        if (sp[num] !== undefined && (typeof sp[num] !== 'number' || !isFinite(sp[num]) || sp[num] < 0)) {
            problems.push(`${label}: ${num} is ${sp[num]}`);
        }
    }
    if (sp.classRestriction && !classes.has(sp.classRestriction)) {
        problems.push(`${label}: classRestriction '${sp.classRestriction}' is not a known class`);
    }
    if (sp.dmg !== undefined && (typeof sp.dmg !== 'number' || !isFinite(sp.dmg))) {
        problems.push(`${label}: dmg is ${sp.dmg}`);
    }
}

test('every SPELL_LIBRARY entry is well-formed', () => {
    const classes = new Set(Object.keys(D.CLASS_TEMPLATES));
    const problems = [];
    const seen = new Set();
    for (const [key, sp] of Object.entries(D.SPELL_LIBRARY)) {
        validateSpell(sp, `SPELL_LIBRARY[${key}]`, classes, problems);
        if (sp && sp.id) {
            if (seen.has(sp.id)) problems.push(`duplicate spell id '${sp.id}'`);
            seen.add(sp.id);
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('every race ability is well-formed and keyed to a known race', () => {
    const races = new Set(D.AVAILABLE_RACES);
    const classes = new Set(Object.keys(D.CLASS_TEMPLATES));
    const problems = [];
    for (const [race, abilities] of Object.entries(D.RACE_ABILITIES)) {
        if (!races.has(race)) problems.push(`RACE_ABILITIES key '${race}' is not in AVAILABLE_RACES`);
        if (!Array.isArray(abilities)) { problems.push(`RACE_ABILITIES['${race}'] is not an array`); continue; }
        for (const sp of abilities) validateSpell(sp, `RACE_ABILITIES['${race}']`, classes, problems);
    }
    assert.deepStrictEqual(problems, []);
});

test('starter units are playable races', () => {
    const races = new Set(D.AVAILABLE_RACES);
    const problems = [];
    const seen = new Set();
    for (const r of D.ACCT_STARTER_UNITS) {
        if (!races.has(r)) problems.push(`starter '${r}' is not in AVAILABLE_RACES`);
        if (seen.has(r)) problems.push(`starter '${r}' listed twice`);
        seen.add(r);
    }
    assert.deepStrictEqual(problems, []);
});

test('map metadata is well-formed', () => {
    const problems = [];
    for (const [id, meta] of Object.entries(D.EW_MAP_META || {})) {
        if (!meta || typeof meta !== 'object') { problems.push(`EW_MAP_META['${id}'] is not an object`); continue; }
    }
    assert.ok(Object.keys(D.EW_MAP_META || {}).length > 0, 'EW_MAP_META is empty');
    assert.deepStrictEqual(problems, []);
});
