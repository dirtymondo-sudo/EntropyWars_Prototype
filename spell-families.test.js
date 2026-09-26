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
