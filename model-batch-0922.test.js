'use strict';
/* THE 2026-09-22 MODEL BATCH — twelve Meshy uploads: the POPSTAR (a new race), six races that were sprite-only
   until today (ai · ice queen · juggernaut · symbiote · antihero · shadow entity), three second genders (the
   demon, the robot, the superhero) and two replacements (the djinn, the politician). Data through the vm
   sandbox; sprites.js / three-vfx-effects.js / battle.js by source. One TOTAL lives in one test (THE RED CI
   rule 3): the roster tier is achievements.test.js's, the finisher's three parts finishers.test.js's. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');

const D = loadGameData();
const SRC = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const DATA = SRC('data.js'), SPRITES = SRC('sprites.js'), VFX = SRC('three-vfx-effects.js'), SERVER = SRC('server.js'),
      PB = SRC('party-builder.js'), UI = SRC('ui.js'), BT = SRC('battle.js'), GRADES = SRC('check-grades.js');
const MODELS = SPRITES.slice(SPRITES.indexOf('const RACE_MODELS_3D = {'), SPRITES.indexOf('(function _applyFemaleSlotDefaults()'));
const row = (race) => { const i = MODELS.indexOf("\n  '" + race + "': {"); assert.ok(i >= 0, race + ' has a RACE_MODELS_3D row'); return MODELS.slice(i, MODELS.indexOf('\n  },', i)); };

/* the user's list, verbatim */
const FILES = {
    popstar:          ['female', 'Races/popstar/Meshy_AI_a_blonde_popstar_Running.glb'],
    djinn:            ['male',   'Races/djinn/male/Meshy_AI_a_djinn_Running.glb'],
    symbiote:         ['female', 'Races/symbiote/Meshy_AI_a_female_symbiote_Running.glb'],
    juggernaut:       ['male',   'Races/juggernaut/Meshy_AI_a_giant_juggernaut_Running.glb'],
    superhero:        ['male',   'Races/superhero/male/Meshy_AI_a_superhero_Running.glb'],
    ai:               ['female', 'Races/ai/female/Meshy_AI_AI_girl_biped_Character_output.glb'],
    'ice queen':      ['female', 'Races/icequeen/Meshy_AI_an_ice_queen_Running.glb'],
    antihero:         ['male',   'Races/antihero/Meshy_AI_antihero_Character_output.glb'],
    demon:            ['female', 'Races/Demon/Female/Meshy_AI_demon_female_biped_Character_output.glb'],
    politician:       ['male',   'Races/politician/Meshy_AI_politician_realisti_biped_Animation_Running_withSkin.glb'],
    robot:            ['female', 'Races/robot/female/Meshy_AI_robot_female_biped_Character_output.glb'],
    'shadow entity':  ['male',   'Races/shadowentity/male/Meshy_AI_shadow_monster_Running.glb'],
};

test('every upload is wired: the row, the gender, the file (an explicit model or the _mkUAL folder + prefix that names it)', () => {
    for (const [race, [gender, file]] of Object.entries(FILES)) {
        const r = row(race);
        const g = r.indexOf('\n    ' + gender + ': _mkUAL(');
        assert.ok(g >= 0, race + ' ' + gender + ' row');
        const def = r.slice(g, r.indexOf('}),', g));
        const m = /model: `\$\{_S\}\/([^`]+)`/.exec(def);
        if (m) assert.strictEqual(m[1], file, race + ' explicit model');
        else {
            const fp = /_mkUAL\('([^']+)', '([^']+)'/.exec(def);
            assert.ok(fp, race + ': folder + prefix');
            assert.strictEqual('Races/' + fp[1] + '/Meshy_AI_' + fp[2] + '_biped_Character_output.glb', file, race + ' _mk3d path');
        }
        /* the gender is a sprite gender too (race3DGenders ∩ RACE_SPRITE_GENDERS is what the wall offers) */
        const sg = new RegExp("^  '" + race + "': '(both|" + gender + ")'", 'm');
        assert.ok(sg.test(SPRITES), race + ': RACE_SPRITE_GENDERS carries ' + gender);
    }
    /* the replaced rigs' old bases are gone from the rows */
    assert.ok(!row('djinn').includes('djinn_genie_realist_biped'), 'the old djinn base is retired');
    assert.ok(!/model: `\$\{_S\}\/Races\/politician\/Meshy_AI_politician_realisti_biped_Character_output/.test(row('politician')), 'the old politician base is retired');
    /* the second genders stand beside the first */
    assert.ok(/\n    male: _mk3d\('Demon\/Male'/.test(row('demon')) && /\n    female: _mkUAL\('Demon\/Female'/.test(row('demon')), 'the demon has both');
    assert.ok(/\n    male: _mkUAL\('robot\/male'/.test(row('robot')) && /\n    female: _mkUAL\('robot\/female'/.test(row('robot')), 'the robot has both');
    assert.ok(/\n    female: _mkUAL\('superhero\/female'/.test(row('superhero')) && /\n    male: _mkUAL\('superhero\/male'/.test(row('superhero')), 'the superhero has both');
});

test('the popstar sits in every data.js table, both sides of the parity line, and the sprite tables', () => {
    const r = 'popstar', problems = [];
    if (!D.AVAILABLE_RACES.includes(r)) problems.push('AVAILABLE_RACES');
    for (const T of ['RACE_PROFILES', 'RACE_DEFAULT_JOBS', 'RACE_BASE_STATS', 'RACE_ABILITIES', 'RACE_TREE', 'RACE_PASSIVES', 'EW_RACE_BIOMES', 'FINISHERS']) if (!D[T] || !D[T][r]) problems.push(T);
    for (const [T, re] of [['RACE_CLASS', "^    '" + r + "': 'support',"], ['RACE_PHYSIQUE', "^    '" + r + "': +\\{ h: [0-9.]+, w: [0-9]+ \\}"], ['CAMPAIGN_RACE_PRICES', "^  '" + r + "': [0-9]+,"]]) if (!new RegExp(re, 'm').test(DATA)) problems.push(T);
    if (!D.DOOR_TEXT.CUSTOMS_OVERRIDES[r]) problems.push('CUSTOMS_OVERRIDES');
    if (!D.DOOR_TEXT.POINT_OF_ENTRY[r]) problems.push('POINT_OF_ENTRY');
    if (D.ACCT_STARTER_UNITS.includes(r)) problems.push('a starter (the roster lock)');
    if (!new RegExp("AVAILABLE_RACES = new Set\\(\\[[^\\]]*'" + r + "'").test(SERVER)) problems.push('server.js AVAILABLE_RACES');
    if (!/^  'popstar':\s+\{ folder: 'popstar',\s+capGender: false \}/m.test(SPRITES)) problems.push('RACE_PATH_RULES (her own folder since the VFX pass, 2026-09-22)');
    if (/^    'popstar': 'harbinger',/m.test(SPRITES)) problems.push('_HOMOSAPIEN_RACE_JOB_MAP (she wears her own sheet — not a homosapien job sheet)');
    if (!/^  'popstar': `\$\{_S\}\/Races\/popstar\/popstar_female\.png`/m.test(SPRITES)) problems.push('RACE_SPRITES (Races/popstar/popstar_female.png)');
    if (!/^  'popstar': '/m.test(PB)) problems.push('party-builder CODEX_LORE');
    if (!/^  'popstar': \[/m.test(PB)) problems.push('party-builder RACE_TRAITS');
    if (!/^            'popstar': '/m.test(UI)) problems.push('ui.js _CODEX_LORE');
    if (!/'popstar': 'magic'/.test(BT)) problems.push('battle.js BASIC_ATTACK_RACE_KINDS');
    if (!/\['popstar', '/.test(GRADES)) problems.push('check-grades role row');
    if (!/showMustGoOn: 2/.test(GRADES)) problems.push('check-grades PASSIVE_VALUE');
    const label = D.DOOR_TEXT.POINT_OF_ENTRY[r];
    if (!D.EW_MAP_META.some(m => m.label === label)) problems.push('point of entry ' + label + ' is not an EW_MAP_META label');
    assert.deepStrictEqual(problems, []);
    assert.strictEqual(D.RACE_PROFILES.popstar.faction, 'space');
    assert.deepStrictEqual(D.RACE_PROFILES.popstar.types.join(','), 'human,anomaly');
    assert.strictEqual(D.hqSiteResidents('prebuilt_stadium').tiers.popstar, 'native', 'the Bowl\'s native');
});

test('the popstar\'s kit: the four-node tree on the twin rule, plain kinds, one status a cast, the passive, the finisher built', () => {
    const tree = ['racePopMicDrop', ['racePopEncore', 'racePopStageDive'], 'racePopSpotlight', 'racePopStadiumShow'];
    assert.strictEqual(D.RACE_TREE.popstar.flat().join(','), tree.flat().join(','));
    const rows = D.RACE_ABILITIES.popstar;
    assert.strictEqual(rows.length, 5);
    for (const r of rows) {
        assert.ok(D.SPELL_BY_ID[r.id], r.id);
        assert.ok(D.RACE_PROFILES.popstar.types.includes(r.spellType), r.id + ': spellType');
        assert.ok(D.SPELL_ELEMENTS.includes(r.element), r.id + ': element');
        const sts = (r.statusEffects || []).concat(r.teamStatusEffects || []);
        assert.ok(sts.length <= 1, r.id + ': one status a cast');
        for (const st of sts) assert.ok(D.STATUS_DEFS[st.id], r.id + ': ' + st.id);
        assert.ok(VFX.includes("SPELL_MAP['" + r.id + "']"), r.id + ' in SPELL_MAP');
    }
    assert.strictEqual(D.SPELL_BY_ID.racePopMicDrop.kind, 'damage');
    assert.strictEqual(D.SPELL_BY_ID.racePopEncore.kind, 'encore');
    assert.strictEqual(D.SPELL_BY_ID.racePopStageDive.kind, 'tackle');
    assert.strictEqual(D.SPELL_BY_ID.racePopSpotlight.kind, 'debuff');
    assert.deepStrictEqual(JSON.stringify(D.SPELL_BY_ID.racePopSpotlight.statStageBoost), '{"def":-1,"mdef":-1}', '§5.6: a non-capstone stage move is ±1');
    assert.strictEqual(D.SPELL_BY_ID.racePopStadiumShow.kind, 'aoe');
    assert.strictEqual(D.SPELL_BY_ID.racePopSpotlight.tier, 'II');
    assert.strictEqual(D.SPELL_BY_ID.racePopStadiumShow.tier, 'III');
    assert.ok(D.isCapstoneSpellId('racePopStadiumShow'));
    /* the passive */
    assert.deepStrictEqual(D.RACE_PASSIVES.popstar.join(','), 'showMustGoOn');
    assert.deepStrictEqual(D.PASSIVE_DEFS.showMustGoOn.immuneStatus.join(','), 'silence');
    /* the finisher */
    const f = D.FINISHERS.popstar;
    assert.ok(f && f.sig === 'farewellTour' && f.built === true && f.type === 'anomaly');
    assert.ok(/farewellTour: \{/.test(BT) && /function _sigFarewellTour3D\(/.test(VFX) && /_FIN_STAGE\.farewellTour = function \(P\)/.test(VFX));
    /* no sig: null anywhere in the catalogue */
    assert.ok(!Object.values(D.FINISHERS).some(x => x.sig == null), 'every finisher is built');
});
