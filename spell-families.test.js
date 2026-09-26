// spell-families.test.js — SPELL LIBRARY Phase 6 (SPELL_LIBRARY_PLAN.md §9 row 6, with Phase 7's pools pulled forward by the user).
// The user, 2026-09-26: "make families to categorize the rest of the unassigned spells, and assign families to each unit. I do not
// want a spell to appear in more than one family. Minimum 3 families per character, maximum 10" · "in the pools section, I need to
// be able to select families, not individual spells" · "the x to remove a spell is really tiny".
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data');

const D = loadGameData({});
const J = (v) => JSON.parse(JSON.stringify(v));
const UI = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
const CSS = fs.readFileSync(path.join(__dirname, 'styles-hud.css'), 'utf8');
const rows = () => { const seen = new Set(), out = []; for (const id of Object.keys(D.SPELL_BY_ID)) { const sp = D.SPELL_BY_ID[id]; if (sp && !seen.has(sp.id)) { seen.add(sp.id); out.push(sp); } } return out; };

test('every race has 3 to 10 known families, none twice, none universal; the door wheel family is the Door Agent\'s alone', () => {
    const problems = [];
    for (const race of D.AVAILABLE_RACES) {
        const list = D.RACE_FAMILIES[race];
        if (!Array.isArray(list)) { problems.push(`${race}: no families`); continue; }
        if (list.length < 3 || list.length > 10) problems.push(`${race}: ${list.length} families`);
        if (new Set(list).size !== list.length) problems.push(`${race}: a family twice`);
        for (const f of list) {
            if (!D.SPELL_FAMILIES[f]) problems.push(`${race}: unknown family ${f}`);
            else if (D.SPELL_FAMILIES[f].universal) problems.push(`${race}: ${f} is universal (every pool has it already)`);
            if (f === 'doors' && race !== 'door agent') problems.push(`${race}: the door wheel`);
        }
    }
    for (const race of Object.keys(D.RACE_FAMILIES)) if (!D.AVAILABLE_RACES.includes(race)) problems.push(`RACE_FAMILIES['${race}'] is not a race`);
    assert.deepStrictEqual(problems, []);
});

test('every spell sits in exactly one family, and every family is on some race', () => {
    const problems = [];
    const used = new Set(Object.values(D.RACE_FAMILIES).flat());
    for (const sp of rows()) {
        if (sp.kind === 'basicAttack') continue;
        const fams = D.spellFamiliesOf(sp);
        if (fams.length !== 1) problems.push(`${sp.id}: ${fams.length} families`);
    }
    for (const f of Object.keys(D.SPELL_FAMILIES)) if (!D.SPELL_FAMILIES[f].universal && !used.has(f)) problems.push(`family ${f} is on no race`);
    assert.deepStrictEqual(problems, []);
    // the user's own families survived the bake: a few of theirs, by id and name
    assert.strictEqual(D.SPELL_FAMILIES.christmasspirit.name, 'Christmas Spirit');
    assert.strictEqual(D.SPELL_FAMILIES.weaponstraining.name, 'Gun Training');
    assert.ok(!D.SPELL_FAMILIES.metal, 'the user deleted Metal');
    assert.deepStrictEqual(J(D.SPELL_BY_ID.raceTeslaTrap.families), ['advancedtechnology']);
});

test('the pool: the RACE_TREE row, then every member of the race\'s families; every tree rung sits in one of them', () => {
    const problems = [];
    for (const race of D.AVAILABLE_RACES) {
        const fams = D.raceFamilyIds(race);
        const famIds = new Set(fams.flatMap(f => D.familyMemberIds(f)));
        for (const id of D.getRaceTreeAllIds(race)) if (!famIds.has(id)) problems.push(`${race}: tree rung ${id} is in none of its families`);
        const pool = D.unitSpellPool(race, 'Warrior');   // a job row in a race family stays in the job part (its JOB label)
        for (const id of famIds) if (!pool.includes(id)) problems.push(`${race}: ${id} missing from the pool`);
    }
    assert.deepStrictEqual(problems, []);
    // the members come tier by tier; the wheel and GEAR stay in their own parts
    const m = D.familyMemberIds('christmasspirit').map(id => D.spellTierOf(id));
    assert.deepStrictEqual(m, m.slice().sort((a, b) => a - b));
    assert.ok(!D.familyMemberIds('doors').length, 'wheel doors are not family members (the wheel part carries them)');
    const door = D.unitSpellPoolParts('door agent', 'Warrior');
    assert.ok(door.wheel.length >= 7 && !door.race.some(id => D.SPELL_BY_ID[id]._doorWheel));
    assert.ok(!D.familyMemberIds('gear').length, 'GEAR is universal: the gear part carries it');
});

test('legality follows the families: a family row equips, an outside row does not, and the index re-reads after an edit', () => {
    // Santa Clause holds Winter Warfare (the yeti's Avalanche Strike) but not Bible Study
    assert.ok(D.raceFamilyIds('santa clause').includes('winter'));
    assert.ok(D.isTreeLoadoutLegal('santa clause', 'Warrior', '', ['raceAvalancheStrike']), 'a family row is equippable');
    assert.ok(!D.isTreeLoadoutLegal('santa clause', 'Warrior', '', ['raceHallelujah']), 'a row outside the families is not');
    assert.deepStrictEqual(J(D.treeLegalSubset('santa clause', 'Warrior', '', ['raceHallelujah', 'raceAvalancheStrike'])), ['raceAvalancheStrike']);
    // re-tag one row: the pool follows once the schema stamp runs (the library's apply does)
    const sp = D.SPELL_BY_ID.raceHallelujah, was = sp.families;
    sp.families = ['winter']; D.stampSpellSchema();
    assert.ok(D.unitSpellPool('santa clause', 'Warrior').includes('raceHallelujah'));
    sp.families = was; D.stampSpellSchema();
    assert.ok(!D.unitSpellPool('santa clause', 'Warrior').includes('raceHallelujah'));
});

test('the deleted spells left the trees: each rung took a row of the race\'s families', () => {
    for (const id of ['racePopEncore', 'raceTailWhip', 'raceAbduction', 'raceGravePassage', 'racePhantomDouble']) assert.ok(!D.SPELL_BY_ID[id], id);
    assert.ok(D.getRaceTreeAllIds('reptilian').includes('raceTruthBomb'));
    assert.ok(D.getRaceTreeAllIds('chosen one').includes('racePlotArmor'));
    assert.ok(D.getRaceTreeAllIds('anubis').includes('raceRigormortis'));
    assert.ok(D.getRaceTreeAllIds('mothman').includes('raceCryptidVanish'));
    assert.ok(D.SPELL_LIBRARY.some(s => s.id === 'sentaiGreenArrow'), 'Green Arrow left the sentai\'s list but kept its row (Gun Training → archery)');
});

test('the library: POOLS picks families per race, adding a family MOVES a spell, the member ✕ is a real button', () => {
    assert.match(UI, /data-mode="races">RACE FAMILIES</);
    assert.match(UI, /case 'rfToggle':/);
    assert.match(UI, /_SLB_RACE_FAM_MIN = 3, _SLB_RACE_FAM_MAX = 10/);
    assert.match(UI, /_slb2WriteReg\('raceFamilies', race, list\.slice\(\), label\)/);
    assert.match(UI, /const next = add \? \[fam\] : cur\.filter/, 'one family per spell: adding replaces');
    assert.match(UI, /class="slb2-xbig" data-act="famRemove"/);
    const rule = /\.slb2-xbig \{[^}]*min-width: (\d+)px; height: (\d+)px/.exec(CSS);
    assert.ok(rule && +rule[1] >= 24 && +rule[2] >= 22, 'the ✕ is at least 24 × 22');
});

/* ══ PHASE 7 — THE FAMILIES AS POOLS (SPELL_LIBRARY_PLAN.md §9 row 7, §7 Q2 default: families REPLACE RACE_TREE as the pool) ══ */
const PB = fs.readFileSync(path.join(__dirname, 'party-builder.js'), 'utf8');
const MAP = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
const BASE_CSS = fs.readFileSync(path.join(__dirname, 'styles-base.css'), 'utf8');

test('Phase 7: the pool is the job\'s four + the race\'s families (+ wheel, gear) — RACE_TREE is not read', () => {
    for (const race of ['santa clause', 'yeti', 'door agent', 'homosapien']) {
        const p = D.unitSpellPoolParts(race, 'Warrior');
        const fam = new Set(D.raceFamilyPoolIds(race));
        for (const id of p.race) assert.ok(fam.has(id), `${race}: ${id} in the race part but in none of its families`);
    }
    // a tree rung re-tagged out of the race's families leaves the pool (it was kept by RACE_TREE until Phase 7)
    const rung = D.getRaceTreeAllIds('yeti').find(id => !D.CLASS_TREE.Warrior.includes(id));
    const sp = D.SPELL_BY_ID[rung], was = sp.families;
    const other = Object.keys(D.SPELL_FAMILIES).find(f => !D.SPELL_FAMILIES[f].universal && !D.SPELL_FAMILIES[f].unique && !D.raceFamilyIds('yeti').includes(f));
    try {
        sp.families = [other]; D.stampSpellSchema();
        assert.ok(!D.unitSpellPool('yeti', 'Warrior').includes(rung), 'a rung off the families is off the pool');
        assert.deepStrictEqual(J(D.treeLegalSubset('yeti', 'Warrior', '', [rung, 'guardSlash'])), ['guardSlash'], 'an old save holding it is repaired, not crashed');
    } finally { sp.families = was; D.stampSpellSchema(); }
    assert.ok(D.unitSpellPool('yeti', 'Warrior').includes(rung));
});

test('Phase 7: a UNIQUE family is its race\'s alone — no other pool, never borrowed', () => {
    const f = D.raceFamilyIds('santa clause')[0];
    const fam = D.SPELL_FAMILIES[f], was = fam.unique;
    const other = D.AVAILABLE_RACES.find(r => r !== 'santa clause' && D.raceFamilyIds(r).includes(f));
    try {
        fam.unique = 'santa clause';
        assert.ok(D.spellFamilyIsUnique(f));
        assert.ok(D.raceFamilyIds('santa clause').includes(f), 'the owner keeps it');
        if (other) assert.ok(!D.raceFamilyIds(other).includes(f), 'another race listing it does not get it');
        assert.ok(!D.flBorrowFamilyIds('homosapien').includes(f), 'a Freelancer never borrows it');
    } finally { if (was === undefined) delete fam.unique; else fam.unique = was; }
    assert.strictEqual(D.SPELL_FAMILIES.doors.unique, 'door agent');
});

test('Phase 7: the Freelancer borrows family by family — every other race\'s families, never its own, never GEAR', () => {
    const own = new Set(D.raceFamilyIds('homosapien'));
    const fams = D.flBorrowFamilyIds('homosapien');
    assert.ok(fams.length > 20);
    for (const f of fams) { assert.ok(!own.has(f), f); assert.ok(!D.SPELL_FAMILIES[f].universal, f); assert.ok(!D.spellFamilyIsUnique(f), f); }
    const members = new Set(fams.flatMap(f => D.familyMemberIds(f)));
    const ownIds = new Set(D.raceFamilyPoolIds('homosapien'));
    for (const sp of D.flRacePool('homosapien')) { assert.ok(members.has(sp.id), sp.id); assert.ok(!ownIds.has(sp.id), sp.id); }
    const p = D.unitSpellPoolParts('homosapien', 'Freelancer');
    assert.ok(p.borrowRace.length > 100 && p.borrowJob.length > 20);
    // a borrowed family row equips through the one verdict
    const pick = p.borrowRace.find(id => D.spellTierOf(id) === 1 && !D.spellIsPassive(id));
    assert.ok(D.isTreeLoadoutLegal('homosapien', 'Freelancer', '', [pick]));
});

test('Phase 7: spellFamilyGroups folds a pool for the racks — the race\'s families first, tier I → IV inside, every id once', () => {
    const pool = D.unitSpellPool('santa clause', 'Warrior').filter(id => !D.spellIsPassive(id));
    const groups = D.spellFamilyGroups(pool, 'santa clause');
    const order = D.raceFamilyIds('santa clause');
    assert.deepStrictEqual(J(groups.filter(g => g.own).map(g => g.fam)), J(order.filter(f => groups.some(g => g.fam === f))));
    const firstForeign = groups.findIndex(g => !g.own);
    assert.ok(firstForeign < 0 || groups.slice(firstForeign).every(g => !g.own), 'the race\'s own families lead');
    const flat = groups.flatMap(g => g.ids);
    assert.deepStrictEqual(J(flat.slice().sort()), J(pool.slice().sort()), 'every id exactly once');
    for (const g of groups) { const t = g.ids.map(id => D.spellTierOf(id)); assert.deepStrictEqual(J(t), J(t.slice().sort((a, b) => a - b)), g.name); assert.ok(g.name && g.glyph && g.color); }
});

test('Phase 7: the racks fold by family (forge + HQ), the borrow window runs by family, the codex reads families', () => {
    assert.match(PB, /const PB_BORROW_RE = \/\^B\[0-4\]\$\//);
    assert.match(PB, /function pbRackGroupGet\(\)/);
    assert.match(PB, /window\.spellFamilyGroups\(nonPas, race\)/);
    assert.match(PB, /className: 'pb-rack-fold'/);
    assert.match(PB, /className: 'pb-socket-fam'/);
    assert.match(MAP, /data-party-act="fold:/);
    assert.match(MAP, /if \(verb === 'fold'\) \{ _hqRackFoldSet\(b\)/);
    assert.match(MAP, /class="hq-circ-famhead"/);
    assert.match(UI, /\$\{_codexBuildFamilies\(race\) \|\| _codexBuildAbilities\(race\)\}/);
    assert.match(BASE_CSS, /\.pb-tier\.pb-fam \{/);
    assert.match(BASE_CSS, /#hqPage \.hq-circ-famhead \{/);
    assert.match(CSS, /\.cdx-fam \{/);
});
