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
    // Freelancer's tree is part-fixed/part-socket (FL_FIXED + FL_SOCKET_TIERS),
    // so it has no CLASS_TREE row — but classHasSpellTree must route it in.
    assert.ok(!D.CLASS_TREE.Freelancer, 'Freelancer has no CLASS_TREE row (socket tree instead)');
    assert.ok(D.classHasSpellTree('Freelancer'), 'Freelancer must be tree-routed (Phase B)');
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

test('every available race has a curated RACE_TREE row (Phase B: no fallbacks left)', () => {
    // JSON compare — AVAILABLE_RACES.filter yields a vm-realm Array whose
    // foreign prototype fails deepStrictEqual against a local [].
    const missing = D.AVAILABLE_RACES.filter(r => !D.RACE_TREE[r]);
    assert.strictEqual(JSON.stringify(missing), '[]');
});

test('every race capstone (ring 4) is tier III; rings 1–3 are not', () => {
    const problems = [];
    for (const [race, ids] of Object.entries(D.RACE_TREE)) {
        const cap = D.SPELL_BY_ID[ids[3]];
        if (!cap || cap.tier !== 'III') problems.push(`race '${race}' capstone '${ids[3]}' is not tier III`);
        ids.slice(0, 3).forEach((id, i) => {
            const sp = D.SPELL_BY_ID[id];
            if (sp && sp.tier === 'III') problems.push(`race '${race}' ring ${i + 1} '${id}' is tier III`);
        });
    }
    assert.deepStrictEqual(problems, []);
});

test('§2.1 single-stat rule: only capstones may boost two stats at once', () => {
    const problems = [];
    for (const [race, abs] of Object.entries(D.RACE_ABILITIES)) {
        const capId = (D.RACE_TREE[race] || [])[3];
        for (const a of abs) {
            const b = a.statStageBoost || null;
            if (!b) continue;
            const raised = Object.keys(b).filter(k => b[k] > 0);
            if (raised.length >= 2 && a.id !== capId && a.tier !== 'III') {
                problems.push(`${race} :: ${a.id} raises ${raised.join('+')} (non-capstone)`);
            }
        }
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

test('Freelancer wildcard-socket tree: pool, placement, legality, random walks', () => {
    const fl = (ids) => D.isTreeLoadoutLegal('homosapien', 'Freelancer', '', ids);
    const pool = D.flWildcardPool('homosapien');
    assert.ok(pool.length >= 40, 'wildcard pool spans the job trees');
    assert.ok(pool.every(sp => !['improvise', 'jackOfAll', 'reallyGoodPunch'].includes(sp.id)),
        'Freelancer fixed spells are not in the pool');
    const t1 = pool.filter(sp => !sp.tier || sp.tier === 'I').map(sp => sp.id);
    const t2 = pool.find(sp => sp.tier === 'II').id;
    const t3 = pool.find(sp => sp.tier === 'III').id;
    assert.ok(fl([]), 'empty legal');
    assert.ok(fl(['improvise', 'jackOfAll']), 'fixed chain legal');
    assert.ok(!fl(['improvise', 'jackOfAll', 'reallyGoodPunch']),
        'capstone without a P3 socket fill is illegal');
    assert.ok(fl(['improvise', 'jackOfAll', t2, 'reallyGoodPunch']),
        'capstone with a tier-II P3 fill legal');
    assert.ok(fl([t1[0]]), 'a tier-I wildcard sits at S1 (root-adjacent)');
    assert.ok(!fl([t3]), 'tier-III wildcard without S1–S3 support illegal');
    assert.ok(fl([t1[0], t1[1], t2, t3]), 'full wildcard pillar to the S4 capstone legal');
    assert.ok(!fl([t1[0], t1[1], t1[2], t1[3] || 'fire1']),
        'a fourth tier-I wildcard has no socket (S1, S2, P3 max — and P3 needs P2)');
    for (let i = 0; i < 20; i++) {
        const walk = D.buildTreeLegalLoadout('homosapien', 'Freelancer', '');
        assert.ok(fl(walk), `Freelancer random walk illegal: ${walk.join(',')}`);
        assert.ok(walk.length <= D.SPELL_SLOT_MAX, 'walk within slot cap');
    }
    // repair: off-pool / disconnected ids drop, earlier picks win
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('homosapien', 'Freelancer', '', ['improvise', 'noSuchSpell', 'reallyGoodPunch', 'jackOfAll', t2])),
        JSON.stringify(['improvise', 'jackOfAll', t2]));
});
