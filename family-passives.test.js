// family-passives.test.js — THE SPELL LIBRARY Phase 4, THE PASSIVES + THE GEAR MERGE (SPELL_LIBRARY_PLAN.md §4.5, §6.4,
// §9 row 4). The user's rulings (2026-09-25): equipment and passives are ONE kind of row equipped in the spell slots,
// AT MOST 2 of the 7; today's accessories are UNIVERSAL (the GEAR family in every pool); tiers and SP are editable.
// Pinned here:
//   1. the 16 gear rows (Spelunking Gear dropped), the GEAR pool in every unit's pool, the retired id → row map;
//   2. THE PASSIVE CAP in the one verdict, the legality check and the repair (earlier picks win); SP counts them;
//   3. getUnitPassives = inherent (capped at MAX_UNIT_PASSIVES) + the equipped rows, hooks read by unitPassiveValue;
//   4. the hook consumers, sliced where they are pure (the build ops, the situational stages) and pinned where not;
//   5. the save migration (createUnit, the forge, the HQ record) and the HQ rack's ◈ row; the lint on hooks.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const same = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battleSrc = read('battle.js'), mapSrc = read('map.js'), pbSrc = read('party-builder.js'), aiSrc = read('ai.js');

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

const GEAR = D.GEAR_PASSIVES.map(sp => sp.id);
const TRAINING = D.TRAINING_PASSIVES.map(sp => sp.id);   // THE JOBS REMOVAL (2026-09-27): the old job passives, universal like GEAR

test('the 16 accessories are GEAR passive rows: tier I, the gear family, hooks, the retired id mapped', () => {
    assert.strictEqual(GEAR.length, 16);
    for (const sp of D.GEAR_PASSIVES) {
        assert.strictEqual(sp.kind, 'passive', sp.id);
        assert.strictEqual(sp.role, 'passive', sp.id);
        assert.strictEqual(sp.tier, 1, sp.id + ' — tier I = 1 SP until the catalogue re-tiers it (§7 Q6)');
        same(sp.families, ['gear'], sp.id);
        assert.ok(sp.hooks && Object.keys(sp.hooks).length, sp.id + ' carries its effect as hooks');
        for (const k of Object.keys(sp.hooks)) assert.ok(D.PASSIVE_HOOK_KEYS[k], sp.id + ': hook ' + k + ' is catalogued');
        assert.strictEqual(D.GEAR_ID_OF_ACCESSORY[sp.accessory], sp.id);
        assert.strictEqual(D.SPELL_BY_ID[sp.id], sp);
    }
    assert.strictEqual(D.GEAR_ID_OF_ACCESSORY.spelunking_gear, undefined, 'Spelunking Gear is dropped (nothing read it)');
    assert.strictEqual(D.EQUIP_DEFS.spelunking_gear, undefined);
    same(D.SPELL_BY_ID.gearBinoculars.hooks.statBonus, { awr: 28 }, 'the stat sticks keep their numbers');
    assert.strictEqual(D.SPELL_BY_ID.gearChronoLocket.hooks.regenPerRound, 5);
});

test('THE GEAR POOL: every unit — an Adaptable kit too — may equip every gear + training row; the lint never calls them off-pool', () => {
    for (const [race, ids] of [['knight', []], ['homosapien', [D.ADAPTABLE_ROW_ID]], ['door agent', [D.ADAPTABLE_ROW_ID]], ['fairy', []]]) {
        const parts = D.unitSpellPoolParts(race, D.UNIT_CLASS, ids);
        same(parts.gear, GEAR.concat(TRAINING), race + ' / ' + ids.join(','));
        const pool = new Set(D.unitSpellPool(race, D.UNIT_CLASS, ids));
        for (const id of GEAR.concat(TRAINING)) assert.ok(pool.has(id), race + ' pool has ' + id);
        for (const id of GEAR.concat(TRAINING)) assert.ok(!parts.borrowRace.includes(id), id + ' is never "borrowed"');
    }
    const ctx = D.spellLintContext();
    for (const id of GEAR.concat(TRAINING)) assert.ok(!D.spellLint(D.SPELL_BY_ID[id], ctx).some(h => h.rule === 'offPool'), id + ' is on a pool');
    assert.ok(D.SPELL_FAMILIES.gear.universal);
    assert.ok(D.SPELL_FAMILIES.training.universal);
});

/* THE JOBS REMOVAL (the user, 2026-09-27): "The job passives can be added to the optional passives for 1 SP." */
test('THE TRAINING rows: the 13 old job passives are tier I passive rows in the universal training family, with catalogued hooks', () => {
    same(TRAINING, ['passiveDeadeye', 'passiveWarpath', 'passiveBulwark', 'passiveArcaneSurge', 'passiveGrace', 'passiveFieldOperative',
        'passiveThirdEye', 'passiveGreenThumb', 'passiveTinker', 'passiveCrescendo', 'passiveAdaptable', 'passiveBruteForce', 'passiveRiposte']);
    for (const sp of D.TRAINING_PASSIVES) {
        assert.strictEqual(sp.kind, 'passive', sp.id);
        assert.strictEqual(sp.tier, 1, sp.id + ' — tier I = 1 SP');
        assert.strictEqual(D.spellSpCost(sp.id), 1, sp.id);
        same(sp.families, ['training'], sp.id);
        assert.strictEqual(D.SPELL_BY_ID[sp.id], sp);
        assert.ok(sp.hooks && Object.keys(sp.hooks).length, sp.id + ' carries its effect as hooks');
        for (const k of Object.keys(sp.hooks)) assert.ok(D.PASSIVE_HOOK_KEYS[k], sp.id + ': hook ' + k + ' is catalogued');
        same(D.passiveHookLint(sp), [], sp.id + ' lints clean');
    }
    const H = id => D.SPELL_BY_ID[id].hooks;
    same(H('passiveDeadeye').statBonus, { spd: 10 });
    assert.strictEqual(H('passiveDeadeye').critMult, 2.0);
    assert.strictEqual(H('passiveArcaneSurge').spellPower, 8);
    assert.strictEqual(H('passiveGrace').healBonus, 24);
    assert.strictEqual(H('passiveRiposte').counterChance, 0.35);
    assert.strictEqual(H('passiveAdaptable').borrowFamilies, true);
    // the combine rules: flat bonuses sum, multipliers multiply, chances / caps take the max
    const u = { race: 'knight', passiveRows: ['passiveWarpath', 'passiveBulwark'] };
    assert.strictEqual(D.unitPassiveSum(u, 'armor'), 10, 'armor sums');
    assert.strictEqual(D.unitPassiveMax(u, 'counterChance'), 0.30, 'counter chance takes the max');
    const b = { race: 'knight', passiveRows: ['passiveWarpath', 'passiveBruteForce'] };
    assert.ok(Math.abs(D.unitPassiveMult(b, 'basicDmgMult') - 1.15 * 1.2) < 1e-9, 'basic multipliers multiply');
    const none = { race: 'knight', passiveRows: [] };
    assert.strictEqual(D.unitPassiveSum(none, 'armor'), 0);
    assert.strictEqual(D.unitPassiveMult(none, 'basicDmgMult'), 1);
    assert.strictEqual(D.unitPassiveMax(none, 'counterChance'), 0);
    // two training rows fill the passive cap like any gear
    assert.strictEqual(D.spellAddVerdict('knight', D.UNIT_CLASS, ['passiveWarpath', 'gearEchoBand'], 'passiveBulwark').reason, 'passives');
});

test('THE PASSIVE CAP: at most 2 passive rows — the verdict, the legality check, the repair; each costs its tier in SP', () => {
    const race = 'knight', cls = 'Warrior';
    const two = ['gearEchoBand', 'gearHagstone'];
    const v = D.spellAddVerdict(race, cls, two, 'gearBinoculars');
    assert.strictEqual(v.ok, false);
    assert.strictEqual(v.reason, 'passives');
    assert.match(v.note, /2 PASSIVES MAX/);
    assert.ok(D.spellAddVerdict(race, cls, ['gearEchoBand'], 'gearBinoculars').ok, 'the second fits');
    assert.ok(D.spellAddVerdict(race, cls, two, D.unitSpellPoolParts(race, cls).race[0]).ok, 'a spell still fits beside two passives');
    assert.strictEqual(D.isTreeLoadoutLegal(race, cls, '', two.concat('gearBinoculars')), false);
    assert.strictEqual(D.isTreeLoadoutLegal(race, cls, '', two), true);
    same(D.treeLegalSubset(race, cls, '', ['gearEchoBand', 'gearHagstone', 'gearBinoculars']), two, 'the third is skipped — earlier picks win');
    assert.strictEqual(D.loadoutSpUsed(two), 2, 'tier I = 1 SP each');
    assert.strictEqual(D.passiveRowCount(two.concat(['raceChivalry'])), 2);
    assert.strictEqual(D.PASSIVE_SLOT_MAX, 2);
});

test('an old save: retired accessory ids map onto their gear rows; gearMigrateIds appends them after the own picks', () => {
    same(D.treeLegalSubset('knight', 'Warrior', '', ['binoculars', 'echo_band']), ['gearBinoculars', 'gearEchoBand']);
    same(D.gearMigrateIds(['raceChivalry'], { accessory1: 'jetpack', accessory2: 'hagstone' }), ['raceChivalry', 'gearJetpack', 'gearHagstone']);
    same(D.gearMigrateIds(['gearJetpack'], { accessory1: 'jetpack' }), ['gearJetpack'], 'no duplicate');
    assert.strictEqual(D.gearMigrateIds(null, {}), null, 'nothing to migrate keeps the "no custom kit" branch');
    assert.strictEqual(D.gearMigrateIds(null, { accessory1: 'spelunking_gear' }), null, 'a dropped accessory migrates to nothing');
    same(D.passiveRowsEquipmentMirror(['raceChivalry', 'gearWardTotem']), { accessory1: 'ward', accessory2: null }, 'the display mirror');
});

test('getUnitPassives: the inherent ones (capped at MAX_UNIT_PASSIVES) then the equipped rows; hooks read through unitPassiveValue', () => {
    const u = { race: 'marksman', passiveRows: ['gearEchoBand', 'gearBinoculars'] };
    same(D.getUnitPassives(u).map(p => p.id), ['longshot', 'pointBlank', 'gearEchoBand', 'gearBinoculars'], 'two inherent + two rows');
    assert.strictEqual(D.unitPassiveValue(u, 'basicEcho'), 0.5);
    assert.strictEqual(D.unitPassiveValue(u, 'basicAttackRange'), 99, 'the inherent hooks still read first');
    same(D.unitPassiveStatBonus(u), { hp: 0, mp: 0, atk: 0, def: 0, mdef: 0, move: 0, awr: 28, int: 0, spd: 0 });
    same(D.passiveIdsStatBonus(['gearBerserkersBrand', 'raceChivalry', 'gearJetpack']), { hp: 0, mp: 0, atk: 16, def: 0, mdef: 0, move: 1, awr: 0, int: 0, spd: 0 });
    assert.ok(D.unitHasPassive(u, 'gearEchoBand'));
    assert.ok(D.unitHasGear(u, 'binoculars'));
    assert.ok(!D.unitHasGear(u, 'telescope'));
    same(D.getUnitPassives({ race: 'knight' }).map(p => p.id), ['manAtArms'], 'no rows = the inherent passives unchanged');
    const w = D.passiveRowWrap('gearMartyrsTalisman');
    assert.strictEqual(w, D.passiveRowWrap('gearMartyrsTalisman'), 'the wrap is cached per row');
    assert.strictEqual(w.surviveLethalOnce, true);
    assert.strictEqual(w._row, true);
});

test('a passive row is never cast: SPELL_KIND_META.passive, _getSpellValidTargets offers nothing, createUnit moves it to passiveRows', () => {
    assert.match(battleSrc, /passive:\s+\{ minRange: 0, offensive: false, passive: true/);
    assert.match(fnSrc(battleSrc, '_getSpellValidTargets'), /if \(spell\.kind === 'passive'\) return \[\];/);
    const cu = fnSrc(mapSrc, 'createUnit');
    assert.match(cu, /sp && sp\.kind === 'passive'/, 'the split');
    assert.match(cu, /newUnit\.passiveRows = _pasIds;/);
    assert.match(cu, /passiveRowsEquipmentMirror\(_pasIds\)/, 'unit.equipment is the display mirror');
    assert.match(cu, /unitPassiveStatBonus\(newUnit\)/, 'statBonus folds into the stats');
    assert.doesNotMatch(cu, /computeEquipBonuses\(/, 'the slots no longer price stats');
    assert.match(cu, /unitPassiveValue\(newUnit, 'grantSpell'\)/, 'the Grapnel Gauntlet grants through its hook');
    assert.strictEqual((cu.match(/gearMigrateIds\(Array\.isArray\(identityOverride\?\.customSpells\)/g) || []).length, 3, 'THE SAVE MIGRATION on all three kit paths');
});

test('the accessory behaviours read hook keys — no battle.js / ai.js site asks for an accessory by id any more', () => {
    assert.doesNotMatch(battleSrc, /unitHasAccessory\(/);
    assert.doesNotMatch(aiSrc, /unitHasAccessory\(/);
    for (const [key, where] of [['purgeDebuff', 'the Censer'], ['regenPerRound', 'the Chrono Locket'], ['revealInvisibleWithin', 'the Hagstone'],
        ['revealTrapsWithin', 'the Dowsing Rod'], ['surviveLethalOnce', "the Martyr's Talisman"], ['spellLock', 'the Brand / Focus'],
        ['basicEcho', 'the Echo Band'], ['buildBonus', "the Mason's Gauntlets"], ['healOnceBelowPct', 'the new once-per-life heal'],
        ['physicalElementRider', 'the new element rider']]) {
        assert.match(battleSrc, new RegExp("unitPassiveValue\\([a-zA-Z_.]+, '" + key + "'\\)"), key + ' (' + where + ') has a battle.js reader');
    }
    assert.match(aiSrc, /unitPassiveValue\(target, 'purgeDebuff'\)/);
    // map.js: the one-use gear leaves the rows; the old helpers read the rows (never getUnitPassives — canFly asks unitHasJetpack)
    assert.match(fnSrc(mapSrc, 'removeAccessoryFromUnit'), /unit\.passiveRows = unit\.passiveRows\.filter/);
    assert.match(fnSrc(mapSrc, 'unitHasAccessory'), /unitHasGear\(unit, accessoryId\)/);
    assert.doesNotMatch(fnSrc(read('data.js'), 'unitHasGear'), /getUnitPassives/);
    assert.match(mapSrc, /unit\._passiveSpent = null;/, 'the once-per-life ledger recharges at respawn');
});

test('the build ops read buildBonus (1 + n blocks per AP, capped)', () => {
    const f = new Function('unitPassiveValue', fnSrc(battleSrc, 'unitBuildOpsPerAP') + '; return unitBuildOpsPerAP;');
    assert.strictEqual(f(() => undefined)({}), 1);
    assert.strictEqual(f((u, k) => k === 'buildBonus' ? { build: 1 } : undefined)({}), 2, "the Mason's Gauntlets");
    assert.strictEqual(f((u, k) => k === 'buildBonus' ? { dig: 2 } : undefined)({}), 3);
    assert.strictEqual(f((u, k) => k === 'buildBonus' ? { build: 9 } : undefined)({}), 4, 'capped');
});

test('weather / terrain / zodiac bonus = stat stages while the situation holds (they ride getStatStageCount)', () => {
    const src = fnSrc(battleSrc, '_passiveSituationalStages');
    assert.match(fnSrc(battleSrc, 'getStatStageCount'), /stages \+= _passiveSituationalStages\(unit, stat\);/);
    const signs = "const _ZODIAC_ELEMENT_SIGNS = { fire: ['aries', 'leo', 'sagittarius'], earth: ['taurus', 'virgo', 'capricorn'], air: ['gemini', 'libra', 'aquarius'], water: ['cancer', 'scorpio', 'pisces'] };";
    const make = (state, terrain, rows) => new Function('state', 'posKey', 'getTerrainAt', 'getUnitPassives', 'unitPassiveRowIds',
        signs + src + '; return _passiveSituationalStages;')(state, (x, y) => x + ',' + y, () => terrain, () => rows, (u) => u.passiveRows || []);
    const row = { _row: true, weatherBonus: { storm: { atkStages: 1 } }, terrainBonus: { water: { defStages: 2 } }, zodiacBonus: { earth: { spdStages: 1 }, own: { intStages: 1 } } };
    const u = { x: 3, y: 4, zodiac: 'virgo', passiveRows: ['x'] };
    const f = make({ activeWeather: [{ type: 'storm', tiles: [{ x: 3, y: 4 }] }], activeZodiac: 'virgo' }, 'water', [row]);
    assert.strictEqual(f(u, 'atk'), 1, 'standing in the storm');
    assert.strictEqual(f(u, 'def'), 2, 'on water');
    assert.strictEqual(f(u, 'spd'), 1, 'an earth sign is active');
    assert.strictEqual(f(u, 'int'), 1, "the unit's own sign is active");
    const g = make({ activeWeather: [{ type: 'storm', tiles: [{ x: 9, y: 9 }] }], activeZodiac: 'leo' }, 'grass', [row]);
    assert.strictEqual(g(u, 'atk') + g(u, 'def') + g(u, 'spd') + g(u, 'int'), 0, 'out of the storm, off water, a fire sign');
    assert.strictEqual(f({ x: 3, y: 4, passiveRows: [] }, 'atk'), 0, 'no rows = no read');
});

test('the forge: the ✦ TRAINING / ◈ GEAR tabs, the retired gear slots, the stat preview and the old-save fold', () => {
    /* THE FAMILY TABS (the jobs removal, 2026-09-27): the passive rows sit in their family's tab — the universal TRAINING and
       GEAR each get one — instead of a ◈ row under the tiers */
    const ctx = fnSrc(pbSrc, 'pbTierCtx');
    assert.match(ctx, /uni\('training'\);/, 'the TRAINING tab');
    assert.match(ctx, /uni\('gear'\);/, 'the GEAR tab');
    assert.match(ctx, /const passives = /, 'the ctx still lists the passive rows');
    assert.doesNotMatch(pbSrc, /className: 'pb-tier pb-tier-pas'/, 'the ◈ row is gone');
    assert.match(fnSrc(pbSrc, 'pbTierGrid'), /tab\.ids/, 'the keyboard walks the open tab');
    assert.doesNotMatch(pbSrc, /function handleAccChange\(|function equipAccessory\(|const allAccIds/, 'the two accessory slots are retired');
    assert.match(pbSrc, /computeFullStats\(unitRace, clsName, secJob, customSpells \|\| \[\]\)/);
    assert.match(pbSrc, /window\.gearMigrateIds\(customSpells \|\| \[\], unitEquipment\)/);
});

test('the HQ: a member filed with the old slots carries them into the kit; the rack model has a ◈ row out of the tiers', () => {
    const profile = { door: { hq: { party: { v: 1, seq: 2, members: [{ id: 'p1', you: true, cls: 'Warrior', name: 'A', meta: { race: 'knight', customSpells: ['raceChivalry'] },
        loadout: { spells: ['raceChivalry'], items: {}, equipment: { accessory1: 'binoculars', accessory2: 'echo_band' } } }] } } } };
    const r = D.hqPartyRecord(profile);
    const m = r.members[0];
    same(m.meta.customSpells, ['raceChivalry', 'gearBinoculars', 'gearEchoBand']);
    same(m.loadout.spells, m.meta.customSpells);
    same(m.loadout.equipment, {});
    const C = D.hqPartyTreeCircuit(m);
    assert.ok(C.passives && GEAR.concat(TRAINING).every(id => C.passives.rows.some(x => x.id === id)), 'every gear + training row on the ◈ row');
    assert.strictEqual(C.passives.used, 2);
    assert.ok(C.tiers.every(T => T.rows.every(row => !D.spellIsPassive(row.id))), 'no passive in a tier row');
    assert.strictEqual(C.passives.rows.find(x => x.id === 'gearHagstone').st, 'passives', 'a third is refused');
    const click = D.hqPartyTreeClick(profile, 'p1', 'gearHagstone');
    assert.strictEqual(click.ok, false);
    assert.strictEqual(click.reason, 'passives');
});

test('the lint reads hooks: unknown keys red, a hookless passive amber, a bad shape red', () => {
    const rules = (d) => D.passiveHookLint(d).map(h => h.rule);
    same(rules({ kind: 'passive', hooks: { regenPerRound: 4 } }), []);
    same(rules({ kind: 'passive', hooks: { madeUp: 1 } }), ['hookUnknown']);
    same(rules({ kind: 'passive', hooks: {} }), ['hookNone']);
    same(rules({ kind: 'passive', hooks: [1] }), ['hookInvalid']);
    same(rules({ kind: 'damage', hooks: { madeUp: 1 } }), [], 'a spell row is never hook-linted');
    assert.ok(D.spellLint({ id: 'x', name: 'x', kind: 'passive', tier: 1, hooks: { madeUp: 1 } }).some(h => h.rule === 'hookUnknown'), 'folded into spellLint');
});
