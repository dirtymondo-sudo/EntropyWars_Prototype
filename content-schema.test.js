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
    /* THE SPELL LIBRARY Phase 0 — THE SCHEMA (SPELL_LIBRARY_PLAN.md §4.1): the five fields, typed */
    if (sp.kind !== 'basicAttack') {
        if (!Number.isInteger(sp.tier) || sp.tier < 1 || sp.tier > 4) problems.push(`${label}: tier is ${JSON.stringify(sp.tier)} (want 1–4)`);
        if (!D.SPELL_ROLES.includes(sp.role)) problems.push(`${label}: role is ${JSON.stringify(sp.role)}`);
        if (!Array.isArray(sp.families)) problems.push(`${label}: families is not an array`);
        else for (const f of sp.families) if (!D.SPELL_FAMILIES[f]) problems.push(`${label}: unknown family '${f}'`);
        if (!Array.isArray(sp.upgrades)) problems.push(`${label}: upgrades is not an array`);
        else for (const u of sp.upgrades) if (!D.SPELL_UPGRADES[u]) problems.push(`${label}: unknown upgrade '${u}'`);
    }
    if (sp.roleOverride !== undefined && !D.SPELL_ROLES.includes(sp.roleOverride)) problems.push(`${label}: roleOverride '${sp.roleOverride}' is not a role`);
    if (sp.aoeMask !== undefined && !D.aoeMaskValid(sp.aoeMask)) problems.push(`${label}: aoeMask is not a list of [dx, dy] within ±3`);
    if (sp._aoeBound !== undefined && sp._aoeBound !== D.aoeMaskBound(sp.aoeMask)) problems.push(`${label}: _aoeBound ${sp._aoeBound} is not the mask's reach`);
    /* THE LOOK (§4.6, Phase 2): the animation picks, typed */
    for (const str of ['animVerb', 'animSlot']) if (sp[str] !== undefined && typeof sp[str] !== 'string') problems.push(`${label}: ${str} is not a string`);
    if (sp.animStrikeMs !== undefined && (typeof sp.animStrikeMs !== 'number' || !isFinite(sp.animStrikeMs) || sp.animStrikeMs < 0)) problems.push(`${label}: animStrikeMs is ${sp.animStrikeMs}`);
    if (sp.animClip !== undefined && !(sp.animClip && typeof sp.animClip === 'object' && typeof sp.animClip.name === 'string' && Number.isInteger(sp.animClip.lib) && sp.animClip.lib >= 0 && sp.animClip.lib <= 4))
        problems.push(`${label}: animClip is not { name: string, lib: 0–4 }`);
    if (sp.notes !== undefined && typeof sp.notes !== 'string') problems.push(`${label}: notes is not a string`);
    if (typeof sp._legacyTier === 'string') problems.push(`${label}: still carries the legacy tier string '${sp._legacyTier}' — run node bake-spell-mods.js --stamp-tiers`);
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

test('every CLASS_TREE branch is 4 known spells in ring-tier order (tiers 1,2,3,4)', () => {
    const problems = [];
    for (const [job, ids] of Object.entries(D.CLASS_TREE)) {
        if (!Array.isArray(ids) || ids.length !== 4) { problems.push(`job '${job}' tree is not 4 spells`); continue; }
        const tiers = ids.map(id => D.SPELL_BY_ID[id] ? D.SPELL_BY_ID[id].tier : null);
        ids.forEach((id, i) => { if (!D.SPELL_BY_ID[id]) problems.push(`job '${job}' ring ${i + 1} id '${id}' unknown`); });
        const want = [1, 2, 3, 4];   // Phase 0 (SPELL_LIBRARY_PLAN.md §4.1): the explicit numeric tier, stamped from the rung
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

/* A race-tree entry is a spell id OR a twin pair (2-string array) —
   CHAMP_REWORK_PLAN §4: the node holds two alternates, one equips. */
const treeEntryIds = (e) => Array.isArray(e) ? e : [e];

test('every RACE_TREE entry is 4 known abilities of that race (or twin pairs), none owned by a job tree', () => {
    const jobIds = new Set(Object.values(D.CLASS_TREE).flat());
    const problems = [];
    for (const [race, row] of Object.entries(D.RACE_TREE)) {
        if (!D.RACE_ABILITIES[race]) { problems.push(`RACE_TREE race '${race}' unknown`); continue; }
        if (!Array.isArray(row) || row.length !== 4) { problems.push(`race '${race}' tree is not 4 entries`); continue; }
        const own = new Set(D.RACE_ABILITIES[race].map(a => a.id));
        const seen = new Set();
        row.forEach((entry, i) => {
            if (Array.isArray(entry)) {
                if (entry.length !== 2 || entry.some(id => typeof id !== 'string' || !id)) {
                    problems.push(`race '${race}' ring ${i + 1} twin must be exactly 2 spell ids`);
                }
                if (entry[0] === entry[1]) problems.push(`race '${race}' ring ${i + 1} twins the same id`);
            } else if (typeof entry !== 'string' || !entry) {
                problems.push(`race '${race}' ring ${i + 1} entry is neither an id nor a twin pair`);
            }
            for (const id of treeEntryIds(entry)) {
                if (!D.SPELL_BY_ID[id]) problems.push(`race '${race}' tree id '${id}' unknown`);
                else if (!own.has(id)) problems.push(`race '${race}' tree id '${id}' not in its RACE_ABILITIES`);
                if (jobIds.has(id)) problems.push(`race '${race}' tree id '${id}' also lives in a job tree`);
                if (seen.has(id)) problems.push(`race '${race}' tree repeats '${id}'`);
                seen.add(id);
            }
        });
    }
    assert.deepStrictEqual(problems, []);
});

test('every available race has a curated RACE_TREE row (Phase B: no fallbacks left)', () => {
    // JSON compare — AVAILABLE_RACES.filter yields a vm-realm Array whose
    // foreign prototype fails deepStrictEqual against a local [].
    const missing = D.AVAILABLE_RACES.filter(r => !D.RACE_TREE[r]);
    assert.strictEqual(JSON.stringify(missing), '[]');
});

test('every race capstone (ring 4) is tier 4; rings 1–3 are not — twins share their ring\'s tier', () => {
    /* Phase 0 (SPELL_LIBRARY_PLAN.md §4.1): `tier` is the explicit number on the row (= its SP). The stamp wrote it from
       the rung, so today ring 4 = tier 4; a later bake that re-tiers a capstone in the library moves this pin with it. */
    const problems = [];
    for (const [race, row] of Object.entries(D.RACE_TREE)) {
        for (const id of treeEntryIds(row[3])) {
            const cap = D.SPELL_BY_ID[id];
            if (!cap || cap.tier !== 4) problems.push(`race '${race}' capstone '${id}' is not tier 4`);
        }
        row.slice(0, 3).forEach((entry, i) => {
            for (const id of treeEntryIds(entry)) {
                const sp = D.SPELL_BY_ID[id];
                if (sp && sp.tier === 4) problems.push(`race '${race}' ring ${i + 1} '${id}' is tier 4`);
            }
        });
    }
    assert.deepStrictEqual(problems, []);
});

test('twin nodes: faces, alts, both alternates equippable, shared tier, Freelancer', () => {
    // at least the Phase-2 free twins exist
    const twinRaces = Object.keys(D.RACE_TREE).filter(r => D.RACE_TREE[r].some(Array.isArray));
    assert.ok(twinRaces.length >= 8, `expected the Phase-2 twin rows, found ${twinRaces.length}`);
    // faces = first alternate; alts keyed by node; all-ids covers both
    assert.strictEqual(JSON.stringify(D.getRaceTreeSpells('quarterback')),
        JSON.stringify(['raceBulletPass', 'raceBlitz', 'raceAudible', 'raceHailMary']));
    assert.strictEqual(JSON.stringify(D.getRaceTreeAlts('quarterback')),
        JSON.stringify({ R2: ['raceBlitz', 'raceQBSneak'], R3: ['raceAudible', 'raceSpikeTheBall'] }));
    assert.ok(D.getRaceTreeAllIds('quarterback').includes('raceSpikeTheBall'));
    assert.strictEqual(JSON.stringify(D.getRaceTreeAlts('knight')), '{}');
    // 2026-09-24 SPELL TIERS: a twin is two spells of the same tier — both may be equipped
    const ok = (ids) => D.isTreeLoadoutLegal('quarterback', 'Sniper', '', ids);
    assert.ok(ok(['raceAudible', 'raceSpikeTheBall']), 'both alternates legal together');
    assert.ok(ok(['raceSpikeTheBall']), 'an alternate needs no lower rung');
    assert.strictEqual(D.spellTierOf('raceSpikeTheBall'), D.spellTierOf('raceAudible'), 'twins share a tier');
    assert.strictEqual(D.spellSpCost('raceSpikeTheBall'), 3, 'ring-3 twin costs 3 SP');
    const rings = D.buildTreeRingIndex();
    assert.strictEqual(rings.raceSpikeTheBall, rings.raceAudible);
    assert.strictEqual(D.SPELL_BY_ID.raceSpikeTheBall.cost, D.TREE_RING_MP_COSTS[2]);
    // repair keeps both alternates
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('quarterback', 'Sniper', '', ['raceBulletPass', 'raceSpikeTheBall', 'raceAudible'])),
        JSON.stringify(['raceBulletPass', 'raceSpikeTheBall', 'raceAudible']));
    // random kits over twin races stay legal
    for (const race of twinRaces) {
        const cls = D.RACE_DEFAULT_JOBS[race] || 'Warrior';
        for (let i = 0; i < 10; i++) {
            const walk = D.buildTreeLegalLoadout(race, cls, '');
            assert.ok(D.isTreeLoadoutLegal(race, cls, '', walk), `twin kit illegal for ${race}: ${walk.join(',')}`);
        }
    }
    // Freelancer: own race twins behave the same; the job pool never holds race ids
    assert.ok(D.isTreeLoadoutLegal('ki fighter', 'Freelancer', '', ['raceKiBlast', 'raceKiWave', 'raceFlurryOfBlows']), 'FL both alternates legal');
    assert.ok(!D.flWildcardPool('ki fighter').some(sp => sp.id === 'raceKiWave' || sp.id === 'raceKiBlast'), 'FL job pool excludes race twins');
});

test('§2.1 single-stat rule: only capstones may boost two stats at once', () => {
    const problems = [];
    for (const [race, abs] of Object.entries(D.RACE_ABILITIES)) {
        const capIds = treeEntryIds((D.RACE_TREE[race] || [])[3]);
        for (const a of abs) {
            const b = a.statStageBoost || null;
            if (!b) continue;
            const raised = Object.keys(b).filter(k => b[k] > 0);
            if (raised.length >= 2 && !capIds.includes(a.id) && a.tier !== 4) {
                problems.push(`${race} :: ${a.id} raises ${raised.join('+')} (non-capstone)`);
            }
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('tier legality: SP cost by rung, 16 SP, 7 slots, no adjacency, random kits', () => {
    assert.strictEqual(D.SPELL_SP_MAX, 16);
    assert.strictEqual(D.SPELL_SLOT_MAX, 7);
    // vampire Sniper — a fully-audited race with a full job pillar
    const ok = (ids) => D.isTreeLoadoutLegal('vampire', 'Sniper', '', ids);
    for (const [id, sp] of [['kneecapShot', 1], ['camouflage', 2], ['precisionShot', 3], ['headshot', 4],
                            ['raceBite', 1], ['racePredatorDrop', 4]]) {
        assert.strictEqual(D.spellSpCost(id), sp, `${id} costs ${sp} SP`);
    }
    assert.ok(ok([]), 'empty loadout legal');
    assert.ok(ok(['headshot']), 'a Tier IV alone is legal — no climbing');
    assert.ok(ok(['raceMistForm']), 'a Tier II race spell alone is legal');
    assert.ok(ok(['headshot', 'racePredatorDrop']), 'two capstones legal (8 SP)');
    assert.ok(ok(['kneecapShot', 'camouflage', 'precisionShot', 'headshot', 'raceBite', 'raceMistForm']),
        'full job pillar + two race rungs = 13 SP, 6 slots');
    assert.strictEqual(D.loadoutSpUsed(['kneecapShot', 'camouflage', 'precisionShot', 'headshot']), 10);
    assert.ok(!ok(['raceBite', 'raceBite']), 'duplicates illegal');
    assert.ok(!ok(['fire1']), 'off-pool spell illegal');
    // SP cap: find the race's own ring-3 spell for a 4+4+4+3+… budget check
    const r3 = D.getRaceTreeSpells('vampire', 'Sniper')[2];
    assert.ok(ok(['headshot', 'racePredatorDrop', 'precisionShot', r3, 'raceBite', 'kneecapShot']),
        '4+4+3+3+1+1 = 16 SP exactly is legal');
    assert.ok(!ok(['headshot', 'racePredatorDrop', 'precisionShot', r3, 'camouflage', 'kneecapShot']), '4+4+3+3+2+1 = 17 SP is over');
    assert.strictEqual(D.spellAddVerdict('vampire', 'Sniper', ['headshot', 'racePredatorDrop', 'precisionShot', r3, 'camouflage'], 'kneecapShot').reason, 'sp');
    // verdict reasons
    assert.strictEqual(D.spellAddVerdict('vampire', 'Sniper', ['headshot'], 'headshot').reason, 'dup');
    assert.strictEqual(D.spellAddVerdict('vampire', 'Sniper', [], 'fire1').reason, 'pool');
    // random kits are always legal, within both budgets
    for (const [race, cls] of [['vampire', 'Sniper'], ['homosapien', 'Warrior'], ['gnome', 'Engineer'], ['dragon', 'Black Mage']]) {
        for (let i = 0; i < 20; i++) {
            const walk = D.buildTreeLegalLoadout(race, cls, '');
            assert.ok(D.isTreeLoadoutLegal(race, cls, '', walk), `random kit illegal for ${race}/${cls}: ${walk.join(',')}`);
            assert.ok(walk.length <= D.SPELL_SLOT_MAX, 'kit within slot cap');
            assert.ok(D.loadoutSpUsed(walk) <= D.SPELL_SP_MAX, 'kit within SP cap');
        }
    }
    // repair: off-pool and over-budget ids drop, earlier picks win (JSON compare — vm realm)
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('vampire', 'Sniper', 'Raider', ['raceBite', 'fire1', 'headshot', 'raceMistForm', 'raceBite'])),
        JSON.stringify(['raceBite', 'headshot', 'raceMistForm']));
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('vampire', 'Sniper', '', ['headshot', 'racePredatorDrop', 'precisionShot', r3, 'camouflage', 'kneecapShot'])),
        JSON.stringify(['headshot', 'racePredatorDrop', 'precisionShot', r3, 'camouflage']));
});

test('Freelancer borrows: race + job pools, any tier, same SP / slot budget', () => {
    const fl = (ids) => D.isTreeLoadoutLegal('homosapien', 'Freelancer', '', ids);
    // 2026-09-14: the old fixed spells are homosapien RACE abilities
    for (const id of ['improvise', 'jackOfAll', 'reallyGoodPunch']) {
        assert.ok(D.RACE_ABILITIES.homosapien.some(sp => sp.id === id), id + ' is a homosapien ability');
        assert.ok(!D.SPELL_LIBRARY.some(sp => sp.id === id), id + ' left the job library');
        assert.ok(D.getRaceTreeAllIds('homosapien', 'Freelancer').includes(id), id + ' sits on the homosapien tree');
    }
    assert.strictEqual(D.RACE_TREE.homosapien.filter(Array.isArray).length, 3, 'three homosapien twin nodes');
    assert.ok(fl(['improvise', 'jackOfAll', 'raceUnderdogSpirit', 'reallyGoodPunch']), 'the homosapien race row');
    assert.ok(fl(['improvise', 'raceElbowGrease']), 'both alternates of a homosapien twin legal');
    // the JOB pool
    const pool = D.flWildcardPool('homosapien');
    assert.ok(pool.length >= 40, 'job pool spans the job trees');
    assert.ok(pool.every(sp => !['improvise', 'jackOfAll', 'reallyGoodPunch'].includes(sp.id)),
        'the homosapien twins are not in the job pool');
    // the RACE pool: every other race's tree, never this race's own
    const rp = D.flRacePool('homosapien');
    assert.ok(rp.length >= 200, 'race pool spans the race trees');
    const own = new Set(D.getRaceTreeAllIds('homosapien', 'Freelancer'));
    assert.ok(rp.every(sp => !own.has(sp.id)), 'own race row is not in the race pool');
    const jobIds = new Set(Object.values(D.CLASS_TREE).flat());
    assert.ok(rp.every(sp => !jobIds.has(sp.id)), 'no job-tree id in the race pool');
    assert.ok(D.flRacePool('knight').some(sp => sp.id === 'reallyGoodPunch'), 'a knight Freelancer may borrow the homosapien capstone');
    // the unit pool is own row + both borrow pools
    const parts = D.unitSpellPoolParts('homosapien', 'Freelancer');
    // SPELL LIBRARY Phase 6: the unit's own part now carries its families' members, so the borrow part skips those
    assert.strictEqual(parts.borrowRace.length, rp.filter(sp => !parts.race.includes(sp.id)).length);
    assert.strictEqual(parts.borrowJob.length, pool.filter(sp => !parts.race.includes(sp.id)).length);
    const byTier = (list, t) => list.filter(sp => D.spellTierOf(sp) === t).map(sp => sp.id);
    const j4 = byTier(pool, 4), r4 = byTier(rp, 4), j1 = byTier(pool, 1);
    assert.ok(fl([j4[0]]), 'a Tier IV job borrow alone is legal');
    assert.ok(fl([r4[0], j4[0]]), 'race + job capstones side by side');
    assert.ok(fl([r4[0], r4[1], j4[0], j4[1]]), 'four Tier IVs = 16 SP');
    assert.ok(!fl([r4[0], r4[1], j4[0], j4[1], j1[0]]), 'a fifth spell breaks 16 SP');
    assert.ok(fl(j1.slice(0, 7)), 'seven Tier I borrows fill the slots');
    assert.ok(!fl(j1.slice(0, 8)), 'an eighth never fits');
    for (let i = 0; i < 20; i++) {
        const walk = D.buildTreeLegalLoadout('homosapien', 'Freelancer', '');
        assert.ok(fl(walk), `Freelancer random kit illegal: ${walk.join(',')}`);
    }
    // repair: off-pool ids drop, earlier picks win
    assert.strictEqual(
        JSON.stringify(D.treeLegalSubset('homosapien', 'Freelancer', '', [r4[0], 'noSuchSpell', r4[1], j4[0], j4[1], j1[0]])),
        JSON.stringify([r4[0], r4[1], j4[0], j4[1]]));
});

/* ── Elemental affinity system (2026-09-01, ELEMENTAL_TYPES_PLAN.md) ────── */

// Every unique spell object across both content sources (shared race
// abilities are one object worn by many races — count once).
function allSpellObjects() {
    const seen = new Set();
    const out = [];
    for (const sp of D.SPELL_LIBRARY) { if (!seen.has(sp)) { seen.add(sp); out.push(sp); } }
    for (const abs of Object.values(D.RACE_ABILITIES)) {
        for (const sp of abs) { if (!seen.has(sp)) { seen.add(sp); out.push(sp); } }
    }
    return out;
}

test('spell element tags are canonical SPELL_ELEMENTS values', () => {
    const els = new Set(D.SPELL_ELEMENTS);
    const problems = [];
    for (const sp of allSpellObjects()) {
        if (sp.element !== undefined && !els.has(sp.element)) {
            problems.push(`spell '${sp.id}': unknown element '${sp.element}'`);
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('every SPELL_ELEMENT has an emoji glyph and an icon file (ELEMENT_ICONS / ELEMENT_ICON_FILES)', () => {
    const problems = [];
    for (const el of D.SPELL_ELEMENTS) {
        if (!D.ELEMENT_ICONS[el]) problems.push(`element '${el}' has no ELEMENT_ICONS glyph`);
        const f = D.ELEMENT_ICON_FILES[el];
        if (!f) problems.push(`element '${el}' has no ELEMENT_ICON_FILES entry`);
        else if (!/^[a-z0-9_-]+\.(png|webp|svg)$/.test(f)) problems.push(`element '${el}' icon file '${f}' is not a plain lowercase png/webp/svg name`);
    }
    for (const el of Object.keys(D.ELEMENT_ICON_FILES)) {
        if (!D.SPELL_ELEMENTS.includes(el)) problems.push(`ELEMENT_ICON_FILES has unknown element '${el}'`);
    }
    if (!/^https:\/\/cdn\.entropywars\.net\/Assets\/.+\/$/.test(D.ELEMENT_ICON_BASE)) problems.push(`ELEMENT_ICON_BASE '${D.ELEMENT_ICON_BASE}' must be an R2 Assets folder URL ending in '/'`);
    if (D.elementIconUrl('fire') !== D.ELEMENT_ICON_BASE + D.ELEMENT_ICON_FILES.fire) problems.push('elementIconUrl(fire) does not join base + file');
    if (!/^<img class="ew-elicon"/.test(D.elementIconHtml('fire'))) problems.push('elementIconHtml(fire) is not an .ew-elicon <img>');
    if (D.elementIconHtml('not-an-element') !== '') problems.push('elementIconHtml(unknown) should be empty');
    assert.deepEqual(problems, []);
});

test('RACE_ELEMENT_AFFINITY rows are valid, combat-element-only and sparse', () => {
    const races = new Set(D.AVAILABLE_RACES);
    const combat = new Set(D.COMBAT_ELEMENTS);
    const tiers = new Set(D.ELEMENT_AFFINITY_TIERS);
    const problems = [];
    for (const [race, row] of Object.entries(D.RACE_ELEMENT_AFFINITY)) {
        if (!races.has(race)) problems.push(`affinity key '${race}' is not in AVAILABLE_RACES`);
        let weak = 0;
        for (const [el, tier] of Object.entries(row)) {
            if (!combat.has(el)) problems.push(`'${race}' affinity element '${el}' is not a COMBAT_ELEMENT`);
            if (!tiers.has(tier)) problems.push(`'${race}' ${el}: unknown tier '${tier}'`);
            if (tier === 'weak') weak++;
        }
        // Design rules from the data.js block: sparse rows, bounded downside.
        if (weak > 2) problems.push(`'${race}' has ${weak} weaknesses (max 2)`);
        if (Object.keys(row).length > 3) problems.push(`'${race}' carries ${Object.keys(row).length} affinity rows (keep sparse: max 3)`);
    }
    assert.deepStrictEqual(problems, []);
});

test('status↔element coupling maps reference real statuses and combat elements', () => {
    const combat = new Set(D.COMBAT_ELEMENTS);
    const problems = [];
    for (const [statusId, el] of [...Object.entries(D.ELEMENTAL_STATUS), ...Object.entries(D.ELEMENT_RIDER_STATUS)]) {
        if (!D.STATUS_DEFS[statusId]) problems.push(`coupling status '${statusId}' is not in STATUS_DEFS`);
        if (!combat.has(el)) problems.push(`coupling element '${el}' (for '${statusId}') is not a COMBAT_ELEMENT`);
    }
    assert.deepStrictEqual(problems, []);
});

test('every declared weakness is exploitable: ≥5 damage spells of that element', () => {
    const dealsDamage = sp => !!(sp.dmg > 0 || sp.dashDamage || sp.turretDmg
        || (sp.hitDamages && sp.hitDamages.length) || sp.type === 'damage');
    const damageByEl = {};
    for (const sp of allSpellObjects()) {
        if (sp.element && dealsDamage(sp)) damageByEl[sp.element] = (damageByEl[sp.element] || 0) + 1;
    }
    const weaknesses = new Set();
    for (const row of Object.values(D.RACE_ELEMENT_AFFINITY)) {
        for (const [el, tier] of Object.entries(row)) if (tier === 'weak') weaknesses.add(el);
    }
    const problems = [];
    for (const el of weaknesses) {
        if ((damageByEl[el] || 0) < 5) {
            problems.push(`element '${el}' is a declared weakness but has only ${damageByEl[el] || 0} damage spells`);
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('kaiju absorb row agrees with the Thermal Regen passive', () => {
    // Both paths drink fire through ONE code path in applyDamageToUnit —
    // keep the data sources in agreement so neither silently drifts.
    assert.strictEqual(D.RACE_ELEMENT_AFFINITY['kaiju'].fire, 'absorb');
    assert.strictEqual(D.PASSIVE_DEFS.thermalRegen.healedByElement, 'fire');
});
