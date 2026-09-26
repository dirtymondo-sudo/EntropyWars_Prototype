// spell-schema.test.js — THE SPELL LIBRARY Phase 0, THE SCHEMA (SPELL_LIBRARY_PLAN.md §4, §9 row 0).
//
// Pins: every row carries the explicit numeric tier and it equals the rung-derived one (the stamp's source);
// the roles cover every row and the tier rule finds exactly the seven offenders the survey named; the families
// registry seeds the 15 elements + GEAR (universal) + the door wheel (unique to the Door Agent); the AOE presets
// and the mask helpers; the lint; EWSpellMods v2 (merge import, registries, notes, the report, the online guard);
// and bake-spell-mods.js round-tripping a doc onto a COPY of data.js that load-data still loads.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadGameData } = require('./load-data');
const B = require('./bake-spell-mods');

const D = loadGameData();
const J = (v) => JSON.parse(JSON.stringify(v));   // sandbox values cross a vm realm — compare by value
const uniqRows = () => { const seen = new Set(), out = []; for (const id of Object.keys(D.SPELL_BY_ID)) { const sp = D.SPELL_BY_ID[id]; if (!seen.has(sp)) { seen.add(sp); out.push(sp); } } return out; };

test('every row carries an explicit numeric tier equal to the rung-derived tier (the stamp), no legacy strings left', () => {
    const rows = uniqRows();
    assert.ok(rows.length >= 500, `expected the 500+ rows, found ${rows.length}`);
    const problems = [];
    const rings = D.buildTreeRingIndex();
    for (const sp of rows) {
        if (!Number.isInteger(sp.tier) || sp.tier < 1 || sp.tier > 4) problems.push(`${sp.id}: tier ${JSON.stringify(sp.tier)}`);
        // the rung check holds on the trees (the ring prices the MP); off-tree rows carry the tier the user set in the library (Phase 6)
        if (rings[sp.id] !== undefined && sp.tier !== D.spellTierDerived(sp.id)) problems.push(`${sp.id}: tier ${sp.tier} vs rung ${D.spellTierDerived(sp.id)}`);
        if (D.spellTierOf(sp.id) !== sp.tier) problems.push(`${sp.id}: spellTierOf ${D.spellTierOf(sp.id)} vs tier ${sp.tier}`);
        if (sp._legacyTier) problems.push(`${sp.id}: legacy '${sp._legacyTier}' survived`);
    }
    assert.deepStrictEqual(problems, []);
    // the source carries them (not only the boot stamp): every literal row has `tier: N`
    const src = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
    assert.strictEqual((src.match(/\btier: '(?:I|II|III|IV)'/g) || []).length, 0, 'no legacy tier strings in data.js');
    const T = B.indexRows(src, B.scanSpans(src));
    const missing = Object.keys(D.SPELL_BY_ID).filter(id => T.rows[id] && !T.rows[id].every(r => r.props.some(p => p.key === 'tier' && /^[1-4]$/.test(src.slice(p.valStart, p.valEnd)))));
    assert.deepStrictEqual(missing, [], 'row literals without a numeric tier in the source');
    // the explicit field WINS over the rung (the user's ruling: tiers are theirs to set)
    const f = D.SPELL_BY_ID.fortify, was = f.tier;
    f.tier = 4; assert.strictEqual(D.spellTierOf('fortify'), 4); assert.strictEqual(D.spellSpCost('fortify'), 4);
    f.tier = was;
    assert.strictEqual(D.spellTierNumeral('fortify'), D.SPELL_TIER_NUMERALS[was]);
});

test('roles cover every row; the tier rule finds exactly the seven survey offenders; bonusVsStatus is not an effect', () => {
    const rows = uniqRows();
    const bad = rows.filter(sp => !D.SPELL_ROLES.includes(sp.role) || sp.role !== D.spellRoleOf(sp));
    assert.deepStrictEqual(bad.map(s => s.id), []);
    const R = D.spellReport();
    assert.strictEqual(R.rows, rows.length);
    assert.ok(R.byRole.damage >= 150 && R.byRole.damageEffect >= 130 && R.byRole.heal >= 20 && R.byRole.movement >= 20 && R.byRole.deploy >= 20, JSON.stringify(R.byRole));
    const offenders = R.lint.filter(r => r.hits.some(h => h.rule === 'tierRule')).map(r => r.id).sort();
    assert.deepStrictEqual(J(offenders), ['raceApexCharge', 'raceFrenzy', 'raceInfernalDecree', 'raceShadowInfiltration', 'raceStompOut', 'raceTremorStomp', 'sentaiBlueWave'].sort());
    // a damage-only spell with a combo finisher stays 'damage' (§7 Q14)
    assert.strictEqual(D.spellRoleOf({ kind: 'damage', dmg: 150, bonusVsStatus: { status: 'burn', mult: 1.5 } }), 'damage');
    assert.strictEqual(D.spellRoleOf({ kind: 'damage', dmg: 150, statusEffects: [{ id: 'burn', duration: 2 }] }), 'damageEffect');
    assert.strictEqual(D.spellRoleOf({ kind: 'healAll', healAmt: 100 }), 'heal');
    assert.strictEqual(D.spellRoleOf({ kind: 'dash', range: 3 }), 'movement');
    assert.strictEqual(D.spellRoleOf({ kind: 'deployTurret' }), 'deploy');
    assert.strictEqual(D.spellRoleOf({ kind: 'terrainCreate' }), 'terrain');
    assert.strictEqual(D.spellRoleOf({ kind: 'buff', statStageBoost: { atk: 1 } }), 'effect');
    assert.strictEqual(D.spellRoleOf({ kind: 'passive' }), 'passive');
    assert.strictEqual(D.spellRoleOf({ kind: 'scan' }), 'utility');
    assert.strictEqual(D.spellRoleOf({ kind: 'damage', dmg: 100, roleOverride: 'utility' }), 'utility', 'roleOverride pins');
    const lint = D.spellLint({ id: 'x', name: 'X', kind: 'damage', dmg: 100, roleOverride: 'utility', tier: 1 });
    assert.ok(lint.some(h => h.rule === 'roleDrift'));
});

test('SPELL_FAMILIES: GEAR (universal), the door wheel (unique to the Door Agent), every row in exactly ONE known family', () => {
    /* Phase 6 (the user's export, 2026-09-26): the element families are the user's to rename, re-kind or delete (Metal is gone,
       Ice is a discipline) and a row's family is its identity — no longer its element. */
    for (const el of ['fire', 'ice', 'lightning', 'water', 'earth', 'wind', 'poison', 'nature', 'shadow', 'light', 'psychic', 'sonic', 'arcane', 'blood']) {
        const f = D.SPELL_FAMILIES[el]; assert.ok(f && f.glyph && f.color && f.id === el, `family ${el}`);
    }
    assert.ok(D.SPELL_FAMILIES.gear && D.SPELL_FAMILIES.gear.universal === true && D.SPELL_FAMILIES.gear.kind === 'support', 'the GEAR pool is universal');
    assert.strictEqual(D.SPELL_FAMILIES.doors.unique, 'door agent');
    for (const f of Object.values(D.SPELL_FAMILIES)) assert.ok(D.SPELL_FAMILY_KINDS.includes(f.kind), `${f.id} kind`);
    assert.strictEqual(D.PASSIVE_SLOT_MAX, 2, 'the user\'s cap: 2 passive / equipment rows among the 7 slots');
    const rows = uniqRows();
    const problems = [];
    for (const sp of rows) {
        if (sp.kind !== 'basicAttack' && sp.families.length !== 1) problems.push(`${sp.id}: ${sp.families.length} families (${sp.families.join(', ')}) — exactly one`);
        if (sp._doorWheel && !sp.families.includes('doors')) problems.push(`${sp.id}: a wheel door outside the doors family`);
        for (const f of sp.families) if (!D.SPELL_FAMILIES[f]) problems.push(`${sp.id}: unknown family ${f}`);
        // Phase 5: every shipped row's list is [] — AUTO (the registry's `auto` rows that fit it); the catalogue pins lists later
        if (!Array.isArray(sp.upgrades) || sp.upgrades.length) problems.push(`${sp.id}: a shipped row's upgrades list should be [] (AUTO) until the catalogue`);
    }
    assert.deepStrictEqual(problems, []);
    assert.deepStrictEqual(J(D.spellFamiliesOf({ element: 'fire' })), ['fire']);
    assert.deepStrictEqual(J(D.spellFamiliesOf({ element: 'physical' })), [], 'an element with no family tags nothing');
    assert.ok(Object.keys(D.SPELL_UPGRADES).length >= 10 && D.SPELL_UPGRADES.upDamage, 'the upgrade registry is seeded (Phase 5 — spell-upgrades.test.js pins it)');
});

test('AOE presets and the mask helpers: every preset valid, the centre where it belongs, tiles clipped, bounds, preset lookup', () => {
    const P = D.AOE_PRESETS;
    for (const [name, mask] of Object.entries(P)) {
        assert.ok(D.aoeMaskValid(mask), `${name} valid`);
        const hasCentre = mask.some(([x, y]) => x === 0 && y === 0);
        assert.strictEqual(hasCentre, !/^(ring|hollow)/.test(name), `${name} centre`);
        const back = D.aoeMaskPresetOf(mask);   // cross1 and diamond1 are the same five tiles — the first name wins
        const key = (m) => J(m).map(o => o.join(',')).sort().join(';');
        assert.strictEqual(key(P[back]), key(mask), `${name} round-trips (as ${back})`);
    }
    assert.strictEqual(P['3x3'].length, 9); assert.strictEqual(P['5x5'].length, 25); assert.strictEqual(P.diamond1.length, 5);
    assert.strictEqual(P.diamond2.length, 13); assert.strictEqual(P.cross2.length, 9); assert.strictEqual(P.x1.length, 5);
    assert.strictEqual(P.ring1.length, 8); assert.strictEqual(P.ring2.length, 16); assert.strictEqual(P.line3.length, 3); assert.strictEqual(P.hollow3x3.length, 8);
    assert.strictEqual(D.aoeMaskBound(P['5x5']), 2); assert.strictEqual(D.aoeMaskBound(P.single), 0);
    const t = D.aoeMaskTiles(P['3x3'], 0, 0, 8, 8);
    assert.strictEqual(t.length, 4, 'a 3×3 at the corner clips to 4 tiles');
    assert.strictEqual(D.aoeMaskTiles(P['3x3'], 4, 4).length, 9);
    assert.strictEqual(D.aoeMaskTiles([[0, 0], [0, 0], [1, 0]], 2, 2).length, 2, 'duplicates dropped');
    assert.ok(!D.aoeMaskValid([[4, 0]]) && !D.aoeMaskValid([]) && !D.aoeMaskValid([[0]]) && !D.aoeMaskValid('3x3'));
    assert.ok(D.spellLint({ aoeMask: [[0, 0]], aoeRadius: 1 }).some(h => h.rule === 'maskVsRadius'));
    assert.ok(D.spellLint({ aoeMask: [[9, 0]] }).some(h => h.rule === 'maskInvalid'));
});

test('the lint: dead fields, the LOS triple, duplicate names, off-pool rows, unknown families / upgrades', () => {
    const ctx = D.spellLintContext();
    assert.ok(ctx.reachable.size >= 480, `reachable ${ctx.reachable.size}`);
    const hits = (d) => D.spellLint(d, ctx).map(h => h.rule);
    assert.ok(hits({ id: 'q', name: 'Q', equipCost: 15 }).includes('deadField'));
    assert.ok(hits({ id: 'q', name: 'Q', ignoresLineOfSight: true, lineOfSight: false }).includes('losTriple'));
    assert.ok(!hits({ id: 'q', name: 'Q', ignoresLineOfSight: true }).includes('losTriple'));
    assert.ok(D.spellLint({ id: 'q', name: 'Twin Name' }, Object.assign({}, ctx, { names: { 'twin name': 2 } })).some(h => h.rule === 'nameDup'), 'two rows under one name are flagged');
    assert.ok(!hits({ id: 'q', name: 'Tail Whip' }).includes('nameDup'), 'the reptilian\'s Tail Whip is gone (Phase 6): one Tail Whip left');
    assert.ok(hits({ id: 'q', name: 'Q' }).includes('offPool'));
    assert.ok(!hits({ id: 'fortify', name: 'Q' }).includes('offPool'));
    assert.ok(hits({ id: 'q', name: 'Q', families: ['nope'] }).includes('familyUnknown'));
    assert.ok(hits({ id: 'q', name: 'Q', upgrades: ['nope'] }).includes('upgradeUnknown'));
    assert.ok(hits({ id: 'q', name: 'Q', element: 'fire', families: [] }).includes('elementFamily'));
    assert.ok(hits({ id: 'q', name: 'Q', tier: 7 }).includes('tierRange'));
    const all = D.spellLintAll();
    assert.strictEqual(all.filter(r => r.hits.some(h => h.rule === 'nameDup')).length, 0, 'no duplicate names (the reptilian\'s Tail Whip was deleted in Phase 6)');
    assert.strictEqual(all.filter(r => r.hits.some(h => h.rule === 'familyMulti')).length, 0, 'no row in two families');
    assert.ok(hits({ id: 'q', name: 'Q', families: ['fire', 'ice'] }).includes('familyMulti'));
    // Phase 6: the race families put every shipped row in some race's pool (the ~29 off-tree library rows were Phase 0's count)
    assert.strictEqual(all.filter(r => r.hits.some(h => h.rule === 'offPool')).length, 0, 'every row reachable through a race family');
    assert.strictEqual(all.filter(r => r.hits.some(h => h.rule === 'losTriple')).length, 0);
    for (const f of D.SPELL_DEAD_FIELDS) assert.strictEqual(typeof f, 'string');
});

test('EWSpellMods v2: the doc, merge import (a v1 doc too), registries, notes, the report, prune, the online guard', () => {
    const M = D.EWSpellMods;
    assert.strictEqual(M.VERSION, 2);
    assert.strictEqual(M.doc.version, 2);
    for (const k of ['families', 'upgrades', 'raceFamilies', 'views']) assert.ok(M.doc[k] && typeof M.doc[k] === 'object', `doc.${k}`);
    const shield0 = D.SPELL_BY_ID.fortify.shield, dmg0 = D.SPELL_BY_ID.raceDivineJudgment.dmg;
    const seraphFams0 = J(D.RACE_FAMILIES.seraphim);   // Phase 6 ships a list for every race
    // a v1 export merges in
    M.import({ format: 'entropy-wars-spell-mods', version: 1, modified: { fortify: { shield: shield0 + 10, notes: 'note A' } } });
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 10);
    assert.strictEqual(M.doc.version, 2, 'stored as v2');
    // a second import MERGES (the first patch survives, a new field lands, a registry row lands)
    M.import({ format: 'entropy-wars-spell-mods', version: 2, modified: { raceDivineJudgment: { dmg: dmg0 + 5 } },
        families: { mystic: { name: 'Mystic', kind: 'discipline', glyph: '✦', color: '#fff' }, blood: null },
        upgrades: { upHot: { name: 'Hotter', sp: 1, patch: { dmgMult: 1.15 } } }, raceFamilies: { seraphim: ['light', 'gear'] }, notes: 'lib note' });
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 10, 'earlier patch kept');
    assert.strictEqual(D.SPELL_BY_ID.raceDivineJudgment.dmg, dmg0 + 5);
    assert.ok(D.SPELL_FAMILIES.mystic && D.SPELL_FAMILIES.mystic.id === 'mystic' && !D.SPELL_FAMILIES.blood, 'registry rows applied');
    assert.ok(D.SPELL_UPGRADES.upHot && D.RACE_FAMILIES.seraphim.length === 2);
    assert.strictEqual(M.doc.notes, 'lib note');
    // a role re-derives after an edit (dmg on an effect-less row keeps 'damage'; a status patch flips it)
    M.import({ format: 'entropy-wars-spell-mods', version: 2, modified: { fire1: { statusEffects: [{ id: 'burn', duration: 2 }] } } });
    assert.strictEqual(D.SPELL_BY_ID.fire1.role, 'damageEffect');
    // the export
    const ex = M.export();
    assert.strictEqual(ex.version, 2);
    assert.deepStrictEqual(J(ex.spellNotes), { fortify: 'note A' });
    assert.ok(ex.report && ex.report.rows > 500 && ex.report.lintByRule.tierRule === 7 && ex.report.byRole.damageEffect > 100);
    assert.ok(ex.summary.some(l => /^FAMILY mystic/.test(l)) && ex.summary.some(l => /^FAMILY DELETE blood/.test(l)) && ex.summary.some(l => /^NOTE fortify/.test(l)));
    assert.ok(ex.families.mystic && ex.families.blood === null && ex.upgrades.upHot && ex.raceFamilies.seraphim);
    assert.ok(M.counts().families === 2 && M.counts().upgrades === 1 && M.total() >= 6);
    // the diff view
    const diff = M.diff({ modified: { fortify: { shield: shield0 + 20 }, rampart: { dmg: 70 } }, families: { mystic: { name: 'Mystic' } } });
    const st = Object.fromEntries(diff.map(r => [r.group + ':' + r.key + (r.field ? ':' + r.field : ''), r.state]));
    assert.strictEqual(st['modified:fortify:shield'], 'conflict'); assert.strictEqual(st['modified:rampart:dmg'], 'add'); assert.strictEqual(st['families:mystic'], 'conflict');
    // a picked import takes only the picked rows
    M.import({ modified: { fortify: { shield: shield0 + 20 }, rampart: { dmg: 70 } } }, { pick: new Set(['modified:rampart:dmg']) });
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 10); assert.strictEqual(D.SPELL_BY_ID.rampart.dmg, 70);
    // THE ONLINE GUARD: vanilla while online, back afterwards
    M.setOnline(true);
    assert.ok(M.suspended && M.online);
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0); assert.strictEqual(D.SPELL_BY_ID.raceDivineJudgment.dmg, dmg0);
    assert.ok(D.SPELL_FAMILIES.blood && !D.SPELL_FAMILIES.mystic && !D.SPELL_UPGRADES.upHot && JSON.stringify(D.RACE_FAMILIES.seraphim) === JSON.stringify(seraphFams0), 'registries vanilla online');
    assert.strictEqual(D.SPELL_BY_ID.fire1.role, 'damage', 'roles re-derive on the vanilla row');
    M.setOnline(false);
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 10); assert.ok(D.SPELL_FAMILIES.mystic);
    // the state's own isOnlineMatch is consulted too
    D.isOnlineMatch = () => true; M.apply(); assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0);
    D.isOnlineMatch = () => false; M.apply(); assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 10);
    delete D.isOnlineMatch;
    // prune drops a registry row that equals the shipped one and a delete of a row that never shipped
    M.import({ families: { fire: JSON.parse(JSON.stringify(M.pristineRegistryRow('families', 'fire'))), ghost: null } });
    const pr = M.prune();
    assert.ok(pr.groups >= 2 && !M.doc.families.fire && !('ghost' in M.doc.families), JSON.stringify([pr, M.doc.families]));
    // replace mode swaps the whole doc; reset restores vanilla
    M.import({ format: 'entropy-wars-spell-mods', version: 2, modified: { fortify: { shield: shield0 + 1 } } }, { mode: 'replace' });
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0 + 1); assert.strictEqual(D.SPELL_BY_ID.raceDivineJudgment.dmg, dmg0); assert.ok(!D.SPELL_FAMILIES.mystic);
    M.reset();
    assert.strictEqual(D.SPELL_BY_ID.fortify.shield, shield0); assert.strictEqual(M.total(), 0);
    assert.strictEqual(D.SPELL_BY_ID.fire1.role, 'damage');
});

test('bake-spell-mods.js: a doc round-trips onto a copy of data.js, load-data still loads it, notes land in the notes file, the stamp is idempotent', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-bake-'));
    const dataCopy = path.join(tmp, 'data.js'), notesFile = path.join(tmp, 'spell-notes.md');
    const src0 = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
    // the stamp changes nothing on the shipped file
    const st = B.stampTiers(src0, D);
    assert.strictEqual(st.stamped + st.replaced, 0, `stamp idempotent: ${JSON.stringify(st)}`);
    const shield0 = D.SPELL_BY_ID.fortify.shield;
    const doc = {
        format: 'entropy-wars-spell-mods', version: 2, enabled: true,
        modified: { fortify: { shield: shield0 + 24, equipCost: null, notes: 'Shield up', families: ['light'], tier: 2 },
                    raceZombieRush: { dmg: 999 },                                    // a factory-call row (_mkCharge({ … }))
                    raceAbsolution: { healAmt: 151 },                                // the duplicate-id literal: BOTH get it
                    sharedRampart: { dmg: 61 } },                                    // an alias — warned, skipped
        added: { customFlare: { name: 'Flare', type: 'damage', kind: 'damage', spellType: 'human', element: 'fire', dmg: 110, range: 3, apCost: 2, damageType: 'magic', tier: 2, families: ['fire'], upgrades: [], desc: 'Deals MEDIUM magic damage to a Single Enemy.', notes: 'a test row', _home: { lib: true } },
                 raceTestHowl: { name: 'Test Howl', type: 'utility', kind: 'warCry', spellType: 'anomaly', range: 0, apCost: 1, tier: 1, desc: 'Empowers the caster.', _home: { race: 'seraphim' } } },
        deleted: ['raceRapture'],
        learnsets: { Tank: ['fortify', 'rampart', 'provoke', 'shieldBash'] },
        raceAbilities: { 'king kong': D.RACE_ABILITIES['king kong'].map(a => a.id).filter(id => id !== 'raceChestPound').concat(['raceBite']) },
        families: { ordnance: { name: 'Ordnance', glyph: '💣', color: '#ff9944', kind: 'weapon', desc: 'Shells.', unique: null }, blood: null },
        upgrades: { upHotter: { name: 'Hotter', glyph: '🔥', desc: '+15%', sp: 1, families: [], roles: ['damage'], patch: { dmgMult: 1.15 } } },
        raceFamilies: { seraphim: ['light', 'gear', 'doors'] },
        notes: 'Library-wide note.',
    };
    const r = B.bakeSource(src0, doc, D, { stamp: 'test' });
    assert.ok(r.edits >= 15, `edits ${r.edits}`);
    assert.ok(r.warnings.some(w => /sharedRampart/.test(w)) && r.warnings.some(w => /DELETE raceRapture: still referenced/.test(w)), r.warnings.join('\n'));
    fs.writeFileSync(dataCopy, r.src);
    fs.writeFileSync(notesFile, B.mergeNotesFile('', r.notes, doc.notes, 'test'));
    const E = loadGameData({ file: dataCopy });
    const f = E.SPELL_BY_ID.fortify;
    assert.strictEqual(f.shield, shield0 + 24); assert.strictEqual(f.equipCost, undefined); assert.strictEqual(f.tier, 2); assert.deepStrictEqual(J(f.families), ['light']);
    assert.strictEqual(f.notes, undefined, 'notes never reach data.js');
    assert.strictEqual(E.spellTierOf('fortify'), 2, 'the baked explicit tier wins over the rung');
    assert.strictEqual(E.SPELL_BY_ID.raceZombieRush.dmg, 999);
    assert.ok(E.RACE_ABILITIES.seraphim.find(a => a.id === 'raceAbsolution').healAmt === 151 && E.RACE_ABILITIES.priest.find(a => a.id === 'raceAbsolution').healAmt === 151, 'both duplicate literals patched');
    assert.strictEqual(E.SPELL_BY_ID.sharedRampart.dmg, D.SPELL_BY_ID.rampart.dmg, 'the alias was not touched');
    assert.ok(E.SPELL_BY_ID.customFlare && E.SPELL_LIBRARY.some(s => s.id === 'customFlare') && E.SPELL_BY_ID.customFlare.tier === 2 && E.SPELL_BY_ID.customFlare.role === 'damage');
    assert.ok(E.RACE_ABILITIES.seraphim.some(a => a.id === 'raceTestHowl') && E.SPELL_BY_ID.raceTestHowl._isRaceAbility);
    assert.ok(!E.SPELL_BY_ID.raceRapture && !E.RACE_ABILITIES.seraphim.some(a => a.id === 'raceRapture'));
    assert.deepStrictEqual(JSON.parse(JSON.stringify(E.CLASS_SPELL_LEARN_ORDER.Tank)), ['fortify', 'rampart', 'provoke', 'shieldBash']);
    const kk = E.RACE_ABILITIES['king kong'].map(a => a.id);
    assert.ok(!kk.includes('raceChestPound') && kk.includes('raceBite') && kk.includes('raceBoulderHurl'), kk.join(','));
    // Phase 6: a row dropped from the only movepool that holds its literal MOVES to SPELL_LIBRARY (a delete is `deleted`)
    assert.ok(E.SPELL_LIBRARY.some(s => s.id === 'raceChestPound'), 'the dropped row moved to the library, not deleted');
    assert.ok(E.SPELL_FAMILIES.ordnance && E.SPELL_FAMILIES.ordnance.id === 'ordnance' && !E.SPELL_FAMILIES.blood);
    assert.ok(E.SPELL_UPGRADES.upHotter && E.SPELL_UPGRADES.upHotter.patch.dmgMult === 1.15);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(E.RACE_FAMILIES.seraphim)), ['light', 'gear', 'doors']);
    const notes = fs.readFileSync(notesFile, 'utf8');
    assert.ok(/## _library\nLibrary-wide note\./.test(notes) && /## fortify\nShield up/.test(notes) && /## customFlare\na test row/.test(notes));
    // a second bake of the same doc onto the result: the patches are no-ops (only the adds / shares would warn or repeat)
    const again = B.bakeSource(r.src, { modified: doc.modified, families: doc.families }, E, {});
    assert.ok(again.edits <= 1, `re-bake edits ${again.edits}: ${again.changes.join(' | ')}`);
    // the serializer keeps the plan's field order
    assert.match(B.serializeRow({ kind: 'damage', id: 'z', desc: 'D', name: 'Z', tier: 3, families: ['fire'], _home: { lib: true }, notes: 'n' }), /^\{ id: 'z', name: 'Z', tier: 3, families: \['fire'\], kind: 'damage',\n\s+desc: 'D' \}$/);
    fs.rmSync(tmp, { recursive: true, force: true });
});
