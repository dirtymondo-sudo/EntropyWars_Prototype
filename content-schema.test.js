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

/* ── Spell tree (Tree of Life selector) — SPELL_TREE_REDESIGN §5 ────────── */

test('every CLASS_TREE branch is 4 known spells in ring-tier order (I,I,II,III)', () => {
    const problems = [];
    for (const [job, ids] of Object.entries(D.CLASS_TREE)) {
        if (!Array.isArray(ids) || ids.length !== 4) { problems.push(`job '${job}' tree is not 4 spells`); continue; }
        const tiers = ids.map(id => D.SPELL_BY_ID[id] ? D.SPELL_BY_ID[id].tier : null);
        ids.forEach((id, i) => { if (!D.SPELL_BY_ID[id]) problems.push(`job '${job}' ring ${i + 1} id '${id}' unknown`); });
        const want = ['I', 'I', 'II', 'III'];
        if (JSON.stringify(tiers) !== JSON.stringify(want)) {
            problems.push(`job '${job}' ring tiers are ${tiers.join(',')} (want ${want.join(',')})`);
        }
        // learn order must stay the tree in ring order (level unlocks = rings)
        const order = (D.CLASS_SPELL_LEARN_ORDER[job] || []).slice(0, 4);
        if (JSON.stringify(order) !== JSON.stringify(ids)) {
            problems.push(`job '${job}' CLASS_SPELL_LEARN_ORDER diverges from CLASS_TREE`);
        }
    }
    assert.ok(Object.keys(D.CLASS_TREE).length >= 13, 'expected 13+ job trees');
    assert.ok(!D.CLASS_TREE.Freelancer, 'Freelancer must NOT have a tree yet (separate pass)');
    assert.deepStrictEqual(problems, []);
});

test('every RACE_TREE entry is 4 known abilities of that race, none owned by a job tree', () => {
    const jobIds = new Set(Object.values(D.CLASS_TREE).flat());
    const problems = [];
    for (const [race, ids] of Object.entries(D.RACE_TREE)) {
        if (!D.RACE_ABILITIES[race]) { problems.push(`RACE_TREE race '${race}' unknown`); continue; }
        if (!Array.isArray(ids) || ids.length !== 4) { problems.push(`race '${race}' tree is not 4 ids`); continue; }
        const own = new Set(D.RACE_ABILITIES[race].map(a => a.id));
        const seen = new Set();
        for (const id of ids) {
            if (!D.SPELL_BY_ID[id]) problems.push(`race '${race}' tree id '${id}' unknown`);
            else if (!own.has(id)) problems.push(`race '${race}' tree id '${id}' not in its RACE_ABILITIES`);
            if (jobIds.has(id)) problems.push(`race '${race}' tree id '${id}' also lives in a job tree`);
            if (seen.has(id)) problems.push(`race '${race}' tree repeats '${id}'`);
            seen.add(id);
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('tree fallback races produce job-tree-free ability lists', () => {
    const problems = [];
    for (const race of D.AVAILABLE_RACES) {
        if (D.RACE_TREE[race]) continue;
        const ids = D.getRaceTreeSpells(race, D.RACE_DEFAULT_JOBS[race] || 'Warrior');
        const jobIds = new Set(Object.values(D.CLASS_TREE).flat());
        for (const id of ids) {
            if (!D.SPELL_BY_ID[id]) problems.push(`fallback '${race}' id '${id}' unknown`);
            if (jobIds.has(id)) problems.push(`fallback '${race}' id '${id}' owned by a job tree`);
        }
        if (ids.length > 4) problems.push(`fallback '${race}' returned ${ids.length} ids`);
    }
    assert.deepStrictEqual(problems, []);
});

test('tree legality: adjacency, connectivity, capstone geometry, random walks', () => {
    // vampire Sniper/Raider — a fully-audited race with two full job pillars
    const ok = (ids) => D.isTreeLoadoutLegal('vampire', 'Sniper', 'Raider', ids);
    assert.ok(ok([]), 'empty loadout legal');
    assert.ok(ok(['raceBite']), 'ring-1 alone legal');
    assert.ok(!ok(['raceMistForm']), 'ring-2 without ring-1 illegal');
    assert.ok(!ok(['headshot']), 'capstone alone illegal');
    assert.ok(ok(['kneecapShot', 'camouflage', 'precisionShot', 'headshot']), 'full pillar legal');
    assert.ok(ok(['raceBite', 'raceMistForm', 'camouflage']), 'ring-2 cross-link legal');
    assert.ok(!ok(['racePredatorDrop', 'headshot', 'rampage']), 'three capstones impossible');
    assert.ok(!ok(['raceBite', 'raceBite']), 'duplicates illegal');
    assert.ok(!ok(['fire1']), 'off-tree spell illegal');
    assert.ok(D.isTreeLoadoutLegal('homosapien', 'Freelancer', '', ['fire1', 'meteor']),
        'Freelancer exempt from tree rules');
    // random walks are always legal, for audited and fallback races alike
    for (const [race, cls, sec] of [['vampire', 'Sniper', 'Raider'], ['homosapien', 'Warrior', 'Tank'],
                                    ['gnome', 'Engineer', ''], ['dragon', 'Warrior', 'Black Mage']]) {
        for (let i = 0; i < 20; i++) {
            const walk = D.buildTreeLegalLoadout(race, cls, sec);
            assert.ok(D.isTreeLoadoutLegal(race, cls, sec, walk),
                `random walk illegal for ${race}/${cls}/${sec}: ${walk.join(',')}`);
            assert.ok(walk.length <= D.SPELL_SLOT_MAX, 'walk within slot cap');
        }
    }
    // repair keeps the largest connected subset (JSON compare — the array
    // comes from the load-data vm realm, so deepStrictEqual sees a foreign
    // Array prototype)
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('vampire', 'Sniper', 'Raider', ['raceBite', 'headshot', 'raceMistForm'])),
        JSON.stringify(['raceBite', 'raceMistForm']));
});
