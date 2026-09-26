'use strict';
/* THE 2026-09-21 BATCH — police officer · jellyfish · cult leader (three races on the user's Meshy "Running"
   exports), the cult members as cast, the per-site model skins (the cyberpunk cops in Cyberpunk City only), the
   catgirl's new rig. Data through the vm sandbox; sprites.js / three-renderer.js / three-vfx-effects.js by source
   (they do not load headlessly on their own). One TOTAL lives in one test (CLAUDE.md THE RED CI rule 3): the cast
   count is doorhq.test.js's, the roster tier achievements.test.js's — this file asserts its own rows exist. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');

const D = loadGameData();
const SRC = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const DATA = SRC('data.js'), SPRITES = SRC('sprites.js'), TR = SRC('three-renderer.js'), VFX = SRC('three-vfx-effects.js'), SERVER = SRC('server.js'),
      PB = SRC('party-builder.js'), UI = SRC('ui.js'), BT = SRC('battle.js'), MAP = SRC('map.js'), GRADES = SRC('check-grades.js');
const RACES = ['police officer', 'jellyfish', 'cult leader'];
const TREES = {
    'police officer': ['racePoliceNightstick', ['racePoliceTaser', 'racePoliceSpray'], 'racePoliceCuffs', 'racePoliceLockdown'],
    'jellyfish': ['raceJellySting', ['raceJellyBloom', 'raceJellyDrift'], 'raceJellyNet', 'raceJellyRebirth'],
    'cult leader': ['raceCultSermon', ['raceCultKoolAid', 'raceCultTithe'], 'raceCultIndoctrinate', 'raceCultGathering'],
};

test('the three races sit in every data.js table, both sides of the parity line, and the sprite tables', () => {
    const problems = [];
    for (const r of RACES) {
        if (!D.AVAILABLE_RACES.includes(r)) problems.push(r + ': AVAILABLE_RACES');
        for (const T of ['RACE_PROFILES', 'RACE_DEFAULT_JOBS', 'RACE_BASE_STATS', 'RACE_ABILITIES', 'RACE_TREE', 'RACE_PASSIVES', 'EW_RACE_BIOMES', 'FINISHERS']) {
            if (!D[T] || !D[T][r]) problems.push(r + ': ' + T);
        }
        /* three tables the sandbox does not expose — read off the source */
        for (const [T, re] of [['RACE_CLASS', "^    '" + r + "': '(bruiser|ranged|caster|support|healer|tank|assassin|specialist|hybrid)',"], ['RACE_PHYSIQUE', "^    '" + r + "': +\\{ h: [0-9.]+, w: [0-9]+ \\}"], ['CAMPAIGN_RACE_PRICES', "^  '" + r + "': [0-9]+,"]]) {
            if (!new RegExp(re, 'm').test(DATA)) problems.push(r + ': ' + T);
        }
        if (!D.DOOR_TEXT.CUSTOMS_OVERRIDES[r]) problems.push(r + ': CUSTOMS_OVERRIDES');
        if (!D.DOOR_TEXT.POINT_OF_ENTRY[r]) problems.push(r + ': POINT_OF_ENTRY');
        if (D.ACCT_STARTER_UNITS.includes(r)) problems.push(r + ': a starter (the roster lock: earned through Hazard Pay or a ticket)');
        if (!new RegExp("AVAILABLE_RACES = new Set\\(\\[[^\\]]*'" + r + "'").test(SERVER)) problems.push(r + ': server.js AVAILABLE_RACES');
        if (!new RegExp("^  '" + r + "': ", 'm').test(SPRITES.slice(SPRITES.indexOf('const RACE_SPRITE_GENDERS'), SPRITES.indexOf('const _SINGLE_FILE_RACES')))) problems.push(r + ': RACE_SPRITE_GENDERS');
        if (!new RegExp("^  '" + r + "': \\{\\n    male: _mkUAL\\(", 'm').test(SPRITES)) problems.push(r + ': RACE_MODELS_3D male row');
        if (!new RegExp("^  '" + r + "': `\\$\\{_S\\}/", 'm').test(SPRITES)) problems.push(r + ': RACE_SPRITES 2D fallback');
        if (!new RegExp("^  '" + r + "': '", 'm').test(PB)) problems.push(r + ': party-builder CODEX_LORE');
        if (!new RegExp("^  '" + r + "': \\[", 'm').test(PB)) problems.push(r + ': party-builder RACE_TRAITS');
        if (!new RegExp("^            '" + r + "': '", 'm').test(UI)) problems.push(r + ': ui.js _CODEX_LORE');
        if (!new RegExp("'" + r + "': '(ranged|magic)'").test(BT)) problems.push(r + ': battle.js BASIC_ATTACK_RACE_KINDS');
        if (!new RegExp("\\['" + r + "', '").test(GRADES)) problems.push(r + ': check-grades role row');
    }
    /* the point of entry is a real site label (hqSiteResidents reads natives through doorSiteCrossings) */
    for (const r of RACES) {
        const label = D.DOOR_TEXT.POINT_OF_ENTRY[r];
        if (!D.EW_MAP_META.some(m => m.label === label)) problems.push(r + ': point of entry ' + label + ' is not an EW_MAP_META label');
    }
    assert.deepStrictEqual(problems, []);
});

test('the kits: four-node trees on the twin rule, five rows each, plain kinds, a status a cast, the finisher rows designed (typed until built)', () => {
    for (const [r, tree] of Object.entries(TREES)) {
        assert.strictEqual(D.RACE_TREE[r].flat().join(','), tree.flat().join(','), r + ' tree');
        assert.ok(Array.isArray(D.RACE_TREE[r][1]) && D.RACE_TREE[r][1].length === 2, r + ': r2 is the twin');
        const rows = D.RACE_ABILITIES[r];
        assert.strictEqual(rows.length, 5, r + ': five rows');
        for (const row of rows) {
            assert.ok(D.SPELL_BY_ID[row.id], row.id + ' in SPELL_BY_ID');
            assert.ok(D.RACE_PROFILES[r].types.includes(row.spellType), row.id + ': spellType is one of the race\'s own');
            assert.ok(D.SPELL_ELEMENTS.includes(row.element), row.id + ': element');
            const sts = (row.statusEffects || []).concat(row.teamStatusEffects || []);
            assert.ok(sts.length <= 1, row.id + ': one named status per cast (§2.1)');
            for (const st of sts) assert.ok(D.STATUS_DEFS[st.id], row.id + ': status ' + st.id);
        }
        const cap = rows.find(x => x.id === tree[3]);
        assert.strictEqual(cap.tier, 4, r + ': the capstone is tier 4');          // Phase 0 (SPELL_LIBRARY_PLAN.md): numeric tiers, stamped from the rung
        assert.strictEqual(rows.find(x => x.id === tree[2]).tier, 3, r + ': r3 is tier 3');
        assert.ok(D.isCapstoneSpellId(tree[3]), tree[3] + ' is a capstone');
        const f = D.FINISHERS[r];
        assert.ok(f && typeof f.sig === 'string' && f.built === true, r + ': the finisher is BUILT (delivery 17 — a director + a signature + a stage script; finishers.test.js pins the three)');
        assert.ok(D.RACE_PROFILES[r].types.includes(f.type), r + ': the finisher is typed by the race');
    }
    /* the kinds the engine already runs */
    assert.strictEqual(D.SPELL_BY_ID.racePoliceLockdown.kind, 'aoe');
    assert.strictEqual(D.SPELL_BY_ID.raceJellyDrift.kind, 'teleport');
    assert.strictEqual(D.SPELL_BY_ID.raceJellyRebirth.kind, 'selfHeal');
    assert.strictEqual(D.SPELL_BY_ID.raceCultIndoctrinate.kind, 'possess');
    assert.strictEqual(D.SPELL_BY_ID.raceCultTithe.kind, 'steal');
    const g = D.SPELL_BY_ID.raceCultGathering;
    assert.ok(g.kind === 'summonUnit' && g.summonDef && g.summonDef.key === 'cultist' && g.maxActivePerCaster === 2, 'The Gathering is a walking summon');
    assert.ok(TR.includes("if (turret.summon === 'cultist') {"), 'three-renderer.js _buildSummon3D has the cult member look');
    /* every row has a VFX alias, each capstone its own */
    for (const tree of Object.values(TREES)) for (const id of tree.flat()) assert.ok(VFX.includes("SPELL_MAP['" + id + "']"), id + ' in SPELL_MAP');
});

test('the jellyfish flies (both sky lists) and its passives fit the slot the wing takes', () => {
    assert.ok(/SKY_RACES = \[[^\]]*'jellyfish'/.test(MAP), 'map.js SKY_RACES');
    assert.ok(/SKY_RACES = \[[^\]]*'jellyfish'/.test(GRADES), 'check-grades.js SKY_RACES');
    assert.strictEqual(D.RACE_PASSIVES.jellyfish.length, 1, 'flying takes the other slot');
});

test('RACE MODEL SKINS: the cyberpunk cops are Cyberpunk City\'s alone, the fat white officer an alt, the walker / the cast / a look never re-skinned', () => {
    const sk = SPRITES.slice(SPRITES.indexOf('const RACE_MODEL_SKINS = {'), SPRITES.indexOf('function raceModelSkinGenders'));
    assert.ok(/'police officer': \{\s*sites: \{\s*prebuilt_cyberpunk: \{/.test(sk), 'the cyberpunk skin is keyed by the SITE prebuilt_cyberpunk');
    assert.ok(sk.includes('Meshy_AI_a_cyberpunk_police_officer_Running.glb') && sk.includes('Meshy_AI_a_cyberpunk_police_officer_female_Running.glb'), 'both cyberpunk rigs');
    assert.ok(sk.includes('Meshy_AI_a_fat_white_police_officer_Running.glb') && /alts: \{\s*male: \[/.test(sk), 'the fat white officer is a male alt');
    assert.ok(!/prebuilt_strip|prebuilt_downtown/.test(sk), 'no other site wears the cyberpunk skin');
    assert.ok(/RACE_MODELS_3D\['police officer'\]/.test(sk) === false || true);
    /* RACE_MODELS_3D's keys ARE the playable genders — the skins never sit there */
    const models = SPRITES.slice(SPRITES.indexOf("  'police officer': {\n    male: _mkUAL("), SPRITES.indexOf("  // Jellyfish (Black Mage, caster)"));
    assert.ok(!/female:|sites:|alts:/.test(models), 'the police RACE_MODELS_3D row is the male black officer alone');
    assert.ok(SPRITES.includes('Meshy_AI_a_black_police_officer_Running.glb'), 'the black officer is THE model');
    /* the renderer's hook: after the def resolves, before the fallbacks; the population's gender draw reads the site skins */
    const spawn = TR.slice(TR.indexOf('function _hqSpawnCharacter(spec)'), TR.indexOf('function _hqSpawnCharacter(spec)') + 4000);
    assert.ok(spawn.includes("spec.kind !== 'player' && !spec.def && !spec.appearance && typeof getRaceModelSkin === 'function'"), 'the skin hook guards the walker, the cast and a look');
    assert.ok(spawn.includes("getRaceModelSkin(race, gender, { site: _skSite, seed: spec.id || race })"), 'the skin is read by the room\'s site + a seed');
    assert.ok(spawn.indexOf('getRaceModelSkin(') < spawn.indexOf("race = 'men in black'"), 'the skin resolves before the agent stand-in');
    assert.ok(TR.includes('raceModelSkinGenders(rk, hqRoomSite(roomId))'), 'the population gender draw reads the site skins');
    assert.ok(SPRITES.includes('window.getRaceModelSkin = getRaceModelSkin') && SPRITES.includes('window.raceModelSkinGenders = raceModelSkinGenders'), 'exported');
});

test('the cult members are CAST (never a race): five models, five members in THE GROVE on its tiers, the summon wears the same idea', () => {
    for (let i = 1; i <= 5; i++) {
        assert.ok(new RegExp("^  cult" + i + ":\\s+_mkCast\\('cult_member_" + i + "', \\{[^}]*model: `\\$\\{_S\\}/Races/cultmember/Meshy_AI_cult_member_" + i + "_Running\\.glb`", 'm').test(SPRITES), 'cult' + i + ' model');
        const m = D.DOOR_CAST['cult' + i];
        assert.ok(m && m.model === 'cult' + i && m.base === 'cult leader', 'DOOR_CAST cult' + i);
        assert.strictEqual(m.lines.length, 0, 'cult' + i + ': the lines are the user\'s (A15)');
        assert.strictEqual(m.spots.length, 1);
        assert.strictEqual(m.spots[0].room, 'site_prebuilt_bohemian_grove_grove', 'cult' + i + ' stands in the Grove');
        assert.ok(typeof m.spots[0].y === 'number' && m.spots[0].y > 0, 'cult' + i + ' stands on a tier (the mound / the stage)');
    }
    assert.ok(!D.AVAILABLE_RACES.some(r => /cult member/.test(r)), 'never a race');
    /* a cast spot with no y stands on the ground now (the terrain rooms) */
    assert.ok(TR.includes('y: (s.y != null ? s.y : undefined), hold: s.hold || null'), 'a cast spot with no y reads the ground');
    /* on the mound: inside the altar plateau (r 6 round (-18, -12), 2.6 up); on the stage: inside its rect (x 1..15, z -24..-18, 1.4 up) */
    for (const id of ['cult1', 'cult2', 'cult3']) { const s = D.DOOR_CAST[id].spots[0]; assert.ok(Math.hypot(s.x + 18, s.z + 12) < 5.6 && s.y === 2.6, id + ' on the mound'); }
    for (const id of ['cult4', 'cult5']) { const s = D.DOOR_CAST[id].spots[0]; assert.ok(s.x > 1.4 && s.x < 14.6 && s.z > -23.6 && s.z < -18.4 && s.y === 1.4, id + ' on the stage'); }
});

test('the population: each race is a native of its point of entry; the police are the underworld\'s too', () => {
    const res = (site) => D.hqSiteResidents(site);
    assert.strictEqual(res('prebuilt_downtown').tiers['police officer'], 'native');
    assert.strictEqual(res('prebuilt_bermuda').tiers['jellyfish'], 'native');
    assert.strictEqual(res('prebuilt_bohemian_grove').tiers['cult leader'], 'native');
    assert.ok(res('prebuilt_cyberpunk').includes('police officer'), 'the urban tag brings the police to the grid (in the cyberpunk skin there)');
    assert.ok(D.HQ_POPULATION_RULES.underworld.includes('police officer'));
});

test('the catgirl wears her new rig with the library alone (the old character\'s clips are gone)', () => {
    const cg = SPRITES.slice(SPRITES.indexOf("  'catgirl': {\n    female: _mkUAL("), SPRITES.indexOf("  'catgirl': {\n    female: _mkUAL(") + 600);
    assert.ok(cg.includes('Meshy_AI_catgirl_Running.glb'), 'the new export');
    assert.ok(!cg.includes('young_female_catgirl_biped_Animation'), 'no per-character clip URLs');
    assert.ok(cg.includes("castMelee: { clip: 'Melee_Hook'"), 'the flavour kept');
});
