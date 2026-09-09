// champ-rework.test.js — CHAMP_REWORK_PLAN.md mechanics guards (Phase 3+).
//
// Loads the REAL data.js headlessly (load-data.js) and reads the engine files
// as SOURCE TEXT (the same extractConst trick data-parity.test.js uses for
// server.js), so the passive registry, its check-grades pricing, the statuses
// the passives apply and the engine hooks that consume them can never drift
// apart silently. Phase 3 = the passive batch (plan §5.2, shipped 2026-09-07).

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData, extractConst, REPO_ROOT } = require('./load-data');

const D = loadGameData();
const src = f => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const dataSrc = src('data.js');
// data.js only exposes what it Object.assigns onto window; the two tables
// below are plain literals, so read them straight out of the source.
const STATUS_LIBRARY_DESCS = extractConst(dataSrc, 'STATUS_LIBRARY_DESCS');
const JOB_ARCHETYPES = extractConst(dataSrc, 'JOB_ARCHETYPES');
// Values from the data.js vm realm carry that realm's prototypes — compare
// by structure, not identity (deepStrictEqual would fail on Array/Object).
const same = (actual, expected, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, msg);
const battleSrc = src('battle.js');
const stateSrc = src('state.js');
const mapSrc = src('map.js');
const hudSrc = src('hud.js');
const gradesSrc = src('check-grades.js');

const SKY_RACES = extractConst(mapSrc, 'SKY_RACES');
const PASSIVE_VALUE = extractConst(gradesSrc, 'PASSIVE_VALUE');
const PLANNED = extractConst(gradesSrc, 'PLANNED_PASSIVE_ALLOWANCE');
const STATUS_EFFECT_IDS = extractConst(stateSrc, '_STATUS_EFFECT_IDS');
const SB_COLORS = extractConst(hudSrc, '_HRLG_SB_COLORS');

/* Plan §5.2 — every passive of the batch and the hook field(s) it wears. */
const PHASE3 = {
    incorporeal:     ['phasing', 'immuneDamageType'],
    lycanthropy:     ['dayNightForms'],
    bloodcraze:      ['lowHpBonus'],
    boneDeep:        ['respawnMult'],
    returnOfTheDead: ['respawnAtDeathTile'],
    reach:           ['rangeBonus'],
    dragonReach:     ['rangeBonus'],
    cryptid:         ['targetableWithin'],
    shank:           ['oppAttackChance', 'oppAttackMult'],
    pureNegativity:  ['immuneKind', 'immuneStatDown'],
    serrated:        ['physicalHitStatus'],
    longshot:        ['basicAttackRange'],
    pointBlank:      ['closeRangeBonus'],
    oozing:          ['contactStatus'],
    powerCore:       ['spellCostMult', 'mpOnBasicHit', 'mpFromMagicDamage'],
    madGenius:       ['stagePerRounds', 'resetOnDeath'],
    rayGun:          ['basicAttackMagic', 'basicAttackRangeBonus'],
    devout:          ['healMult'],
    quickdraw:       ['speedTiePriority'],
    fairyDustTrail:  [],
};
/* Plan §5.2 slot check — who wears what today (gangster/nun joined in Phase 6). */
const EXPECTED_RACE_PASSIVES = {
    ghost: ['incorporeal'], werewolf: ['lycanthropy', 'bloodcraze'], skeleton: ['boneDeep'],
    zombie: ['returnOfTheDead'], dinosaur: ['reach'], dragon: ['dragonReach'], bigfoot: ['cryptid'],
    ghoul: ['pureNegativity'], robinhood: ['serrated'], marksman: ['longshot', 'pointBlank'],
    'black goo': ['oozing'], cyborg: ['powerCore'], 'mad scientist': ['madGenius', 'rayGun'],
    fairy: ['fairyDustTrail'], cowboy: ['quickdraw'],
    gangster: ['shank'], nun: ['devout'],
};

test('passive registry: every RACE_PASSIVES row names a real race and real defs, inside the slot cap', () => {
    const races = new Set(D.AVAILABLE_RACES);
    const problems = [];
    for (const [race, ids] of Object.entries(D.RACE_PASSIVES)) {
        if (!races.has(race)) problems.push(`RACE_PASSIVES key '${race}' is not in AVAILABLE_RACES`);
        if (!Array.isArray(ids) || !ids.length) { problems.push(`RACE_PASSIVES['${race}'] is not a non-empty list`); continue; }
        const cap = D.MAX_UNIT_PASSIVES - (SKY_RACES.includes(race) ? 1 : 0);
        if (ids.length > cap) problems.push(`'${race}' lists ${ids.length} passives but only ${cap} slot(s) are free${SKY_RACES.includes(race) ? ' (flying takes one)' : ''}`);
        if (new Set(ids).size !== ids.length) problems.push(`'${race}' lists a passive twice`);
        for (const id of ids) {
            const def = D.PASSIVE_DEFS[id];
            if (!def) { problems.push(`'${race}' → '${id}' is not in PASSIVE_DEFS`); continue; }
            if (def.id !== id) problems.push(`PASSIVE_DEFS.${id}.id is '${def.id}'`);
            for (const f of ['icon', 'name', 'desc']) if (!def[f]) problems.push(`PASSIVE_DEFS.${id} has no ${f}`);
        }
    }
    for (const [id, def] of Object.entries(D.PASSIVE_DEFS)) {
        if (def.id !== id) problems.push(`PASSIVE_DEFS key '${id}' carries id '${def.id}'`);
    }
    assert.deepStrictEqual(problems, []);
});

test('phase 3 batch: every §5.2 passive exists with its hook fields, and the champs wear them', () => {
    const problems = [];
    for (const [id, fields] of Object.entries(PHASE3)) {
        const def = D.PASSIVE_DEFS[id];
        if (!def) { problems.push(`missing PASSIVE_DEFS.${id}`); continue; }
        for (const f of fields) if (def[f] === undefined) problems.push(`PASSIVE_DEFS.${id} lacks hook field '${f}'`);
    }
    for (const [race, ids] of Object.entries(EXPECTED_RACE_PASSIVES)) {
        same(D.RACE_PASSIVES[race], ids, `RACE_PASSIVES['${race}']`);
    }
    if (D.PASSIVE_DEFS.spectralPassage) problems.push('spectralPassage should be folded into incorporeal');
    // The numbers the plan pinned.
    const P = D.PASSIVE_DEFS;
    if (P.incorporeal.immuneDamageType !== 'physical') problems.push('incorporeal must be immune to physical');
    same(P.lycanthropy.dayNightForms, { night: { atk: 2, spd: 3, def: 2, mdef: 1 } });
    same(P.bloodcraze.lowHpBonus, { threshold: 0.30, dmgMult: 1.25, spdStages: 1 });
    if (P.boneDeep.respawnMult !== 0.5) problems.push('boneDeep respawnMult must be 0.5');
    if (P.cryptid.targetableWithin !== 3) problems.push('cryptid targetableWithin must be 3');
    if (P.shank.oppAttackChance !== 1 || P.shank.oppAttackMult !== 1.5) problems.push('shank must be 100% / ×1.5');
    if (P.longshot.basicAttackRange < 99) problems.push('longshot must reach any visible tile (99)');
    same(P.pointBlank.closeRangeBonus, { within: 2, mult: 1.3 });
    if (P.powerCore.spellCostMult !== 1.5 || P.powerCore.mpOnBasicHit !== 25 || P.powerCore.mpFromMagicDamage !== 0.3) problems.push('powerCore numbers drifted (×1.5 / 25 / 30%)');
    same(P.madGenius.stagePerRounds, { int: 1, every: 3 });
    if (P.devout.healMult !== 1.2) problems.push('devout healMult must be 1.2');
    assert.deepStrictEqual(problems, []);
});

test('passives that apply a status name a status that exists (and the carriers agree)', () => {
    const S = D.STATUS_DEFS;
    assert.ok(S.bleed, 'bleed status (Serrated)');
    assert.ok(S.goo, 'goo status (Oozing)');
    assert.ok(S.wolfForm, 'wolfForm carrier (Lycanthropy)');
    assert.strictEqual(D.PASSIVE_DEFS.serrated.physicalHitStatus.id, 'bleed');
    assert.strictEqual(D.PASSIVE_DEFS.oozing.contactStatus, 'goo');
    // The Beast's stance carrier must wear exactly the night stages Lycanthropy promises.
    same(S.wolfForm.stageMod, JSON.parse(JSON.stringify(D.PASSIVE_DEFS.lycanthropy.dayNightForms.night)));
    // bleed is a DoT: 20 a round, ticks through onRoundEnd; goo is the §5.1 bundle.
    assert.strictEqual(S.bleed.dot, 20);
    assert.strictEqual(typeof S.bleed.onRoundEnd, 'function');
    assert.strictEqual(S.bleed.kind, 'debuff');
    assert.strictEqual(S.goo.kind, 'debuff');
    assert.strictEqual(S.goo.moveDelta, -1);
    assert.strictEqual(S.goo.healTakenMult, 0.5);
    assert.strictEqual(S.goo.magicDamageTakenMult, 1.25);
    assert.strictEqual(S.wolfForm.kind, 'buff');
    for (const id of ['bleed', 'goo', 'wolfForm']) {
        assert.ok(STATUS_LIBRARY_DESCS[id], `STATUS_LIBRARY_DESCS.${id}`);
        assert.ok(STATUS_EFFECT_IDS.has(id), `state.js _STATUS_EFFECT_IDS lacks '${id}' (HUD chips / end-of-round tick)`);
        assert.ok(SB_COLORS[id], `hud.js _HRLG_SB_COLORS lacks '${id}'`);
        assert.ok(S[id].iconSrc, `${id} has no iconSrc`);
    }
});

test('check-grades prices every live passive and plans none that already shipped', () => {
    const problems = [];
    const live = new Set();
    for (const ids of Object.values(D.RACE_PASSIVES)) for (const id of ids) live.add(id);
    for (const id of live) if (PASSIVE_VALUE[id] === undefined) problems.push(`check-grades PASSIVE_VALUE has no price for live passive '${id}'`);
    for (const race of Object.keys(PLANNED)) {
        if (D.RACE_PASSIVES[race]) problems.push(`PLANNED_PASSIVE_ALLOWANCE still lists '${race}', whose passive shipped (it would be counted twice)`);
    }
    for (const id of Object.keys(PASSIVE_VALUE)) {
        if (!D.PASSIVE_DEFS[id]) problems.push(`check-grades prices '${id}', which is not in PASSIVE_DEFS`);
    }
    assert.deepStrictEqual(problems, []);
});

test('werewolf: Lycanthropy replaced the nocturnal sleep nudge', () => {
    const raider = Object.values(JOB_ARCHETYPES).find(a => a && a.race === 'werewolf');
    assert.ok(raider, 'werewolf job archetype');
    assert.strictEqual(raider.sleepPreference, 'none');
    assert.ok(/dayNightForms/.test(mapSrc), 'map.js getSleepAffinityModifier honours dayNightForms');
});

test('engine hooks are wired where the plan says (source-text guards)', () => {
    // Round-start passives run before the turn order is built (initiative
    // sees the Beast's SPD the round it appears).
    const hookIdx = battleSrc.indexOf('_applyRoundStartPassives();\n\n                    buildBlitzTurnOrder();');
    assert.ok(hookIdx > 0, 'battle.js round transition calls _applyRoundStartPassives() right before buildBlitzTurnOrder()');
    assert.ok(/function _applyRoundStartPassives\(\)/.test(battleSrc));
    // Initiative reads live SPD + Quickdraw wins ties.
    assert.ok(/function buildBlitzTurnOrder\(\)[\s\S]{0,1500}getEffectiveSpd/.test(stateSrc), 'buildBlitzTurnOrder uses getEffectiveSpd');
    assert.ok(/speedTiePriority/.test(stateSrc), 'buildBlitzTurnOrder honours speedTiePriority');
    // Consumers of each hook field (one grep per field the engine must read).
    for (const [field, file, text] of [
        ['immuneDamageType', 'battle.js', battleSrc], ['lowHpBonus', 'battle.js', battleSrc],
        ['respawnMult', 'map.js', mapSrc], ['respawnAtDeathTile', 'map.js', mapSrc],
        ['rangeBonus', 'battle.js', battleSrc], ['targetableWithin', 'battle.js', battleSrc],
        ['oppAttackChance', 'battle.js', battleSrc], ['immuneKind', 'battle.js', battleSrc],
        ['immuneStatDown', 'battle.js', battleSrc], ['physicalHitStatus', 'battle.js', battleSrc],
        ['basicAttackRange', 'battle.js', battleSrc], ['closeRangeBonus', 'battle.js', battleSrc],
        ['contactStatus', 'battle.js', battleSrc], ['spellCostMult', 'battle.js', battleSrc],
        ['mpOnBasicHit', 'battle.js', battleSrc], ['mpFromMagicDamage', 'battle.js', battleSrc],
        ['stagePerRounds', 'battle.js', battleSrc], ['basicAttackMagic', 'battle.js', battleSrc],
        ['healMult', 'battle.js', battleSrc], ['dayNightForms', 'battle.js', battleSrc],
        ['healTakenMult', 'battle.js', battleSrc], ['magicDamageTakenMult', 'battle.js', battleSrc],
    ]) {
        assert.ok(text.includes(`'${field}'`) || text.includes(`.${field}`) || text.includes(`?.${field}`), `${file} never reads passive/status field '${field}'`);
    }
    // Longshot is basic-attack only: every thrown-item reach passes { item: true }.
    const itemSites = ['battle.js', 'ui.js', 'hud.js', 'ai.js']
        .reduce((n, f) => n + (src(f).match(/getEffectiveRange\([^)]*\{ item: true \}\)/g) || []).length, 0);
    assert.ok(itemSites >= 6, `expected ≥6 item-reach call sites passing { item: true }, found ${itemSites}`);
    // Permanent ledger entries (Mad Genius) are respected by the three ledger walkers.
    assert.ok((battleSrc.match(/m\.perm/g) || []).length >= 3, 'statStageMods perm flag honoured by purge, badge sync and tick');
});

/* ═══════════════ Phase 4 — the §5.1 status batch + the §5.6 retune ═══════════════ */

const aiSrc = src('ai.js');
const uiSrc = src('ui.js');

/* Plan §5.1 — every status of the batch, its kind and the hook field(s) the
   engine reads (data.js STATUS_DEFS header lists each field's consumer). */
const PHASE4 = {
    haunted:       { kind: 'debuff', fields: ['dot', 'onRoundEnd'] },
    corroded:      { kind: 'debuff', fields: ['dot', 'onRoundEnd', 'countsAs'] },
    grievous:      { kind: 'debuff', fields: ['healTakenMult'] },
    feared:        { kind: 'debuff', fields: ['blockAction', 'fear'] },
    possessed:     { kind: 'debuff', fields: ['control'] },
    infected:      { kind: 'debuff', fields: ['control', 'blockSpells', 'stageMod'] },
    stoneform:     { kind: 'buff',   fields: ['blockMove', 'blockAction', 'invulnerable', 'regenPct', 'onRoundEnd', 'dispelProof'] },
    soulBound:     { kind: 'debuff', fields: ['link', 'linkEcho', 'linkEchoBoosted'] },
    voodoo:        { kind: 'debuff', fields: ['link', 'linkEcho'] },
    shadowRealm:   { kind: 'marker', fields: ['realm'] },
    tethered:      { kind: 'debuff', fields: ['blockMove', 'dragDamagePerTile'] },
    incendiary:    { kind: 'buff',   fields: ['basicAttackStatus'] },
    sparkling:     { kind: 'buff',   fields: ['stageMod', 'shedMotes'] },
    levitating:    { kind: 'buff',   fields: ['grantsFlight', 'onApply', 'onRemove'] },
    blessed:       { kind: 'buff',   fields: ['stageMod', 'onRoundEnd'] },
    monster:       { kind: 'buff',   fields: ['blockSpells', 'stageMod', 'rangeDelta', 'hpMaxMult', 'onApply', 'onRemove'] },
    extendedClips: { kind: 'buff',   fields: ['stageMod', 'rangeDelta'] },
    carForm:       { kind: 'buff',   fields: ['form'] },
    mechaForm:     { kind: 'buff',   fields: ['form', 'stageMod', 'rangeDelta'] },
};

test('phase 4 batch: every §5.1 status exists with its kind, hook fields and the four registries', () => {
    const S = D.STATUS_DEFS;
    for (const [id, want] of Object.entries(PHASE4)) {
        const d = S[id];
        assert.ok(d, `STATUS_DEFS.${id} missing`);
        assert.strictEqual(d.kind, want.kind, `${id}.kind`);
        for (const f of want.fields) assert.ok(d[f] !== undefined, `${id}.${f} missing`);
        for (const f of ['icon', 'glyph', 'short', 'label', 'colorText', 'category', 'stack', 'iconSrc']) assert.ok(d[f], `${id}.${f}`);
        assert.ok(STATUS_LIBRARY_DESCS[id], `STATUS_LIBRARY_DESCS.${id}`);
        assert.ok(STATUS_EFFECT_IDS.has(id), `state.js _STATUS_EFFECT_IDS lacks '${id}'`);
        assert.ok(SB_COLORS[id], `hud.js _HRLG_SB_COLORS lacks '${id}'`);
        assert.ok(!d.statChange, `${id} must be a visible status, not a statChange carrier`);
    }
    // Shield became a real library row (plan §5.1 last line).
    assert.strictEqual(S.shield.kind, 'buff');
    assert.ok(STATUS_LIBRARY_DESCS.shield && SB_COLORS.shield);
});

test('phase 4 batch: the numbers the plan promises', () => {
    const S = D.STATUS_DEFS;
    assert.strictEqual(S.haunted.dot, 28);
    assert.strictEqual(S.corroded.dot, 44);
    same(S.corroded.countsAs, ['burn', 'poison']);
    assert.strictEqual(S.grievous.healTakenMult, 0.5);
    assert.strictEqual(S.goo.healTakenMult, S.grievous.healTakenMult, 'Grievous reuses the Gooed heal multiplier');
    assert.ok(S.feared.blockAction && !S.feared.blockMove, 'Feared blocks actions but must still activate (the flee is the move)');
    assert.ok(S.stoneform.blockMove && S.stoneform.blockAction && S.stoneform.invulnerable);
    assert.strictEqual(S.stoneform.regenPct, 0.15);
    assert.strictEqual(S.soulBound.linkEcho, 0.30);
    assert.strictEqual(S.soulBound.linkEchoBoosted, 0.45);
    assert.strictEqual(S.voodoo.linkEcho, 0.5);
    assert.strictEqual(S.tethered.dragDamagePerTile, 20);
    same(S.incendiary.basicAttackStatus, { id: 'burn', duration: 2 });
    same(S.sparkling.stageMod, { spd: 1 });
    same(S.sparkling.shedMotes, { blindOnStep: 1 });
    same(S.blessed.stageMod, { def: 1, mdef: 1 });
    same(S.monster.stageMod, { atk: 1, spd: 1, def: 1, mdef: 1 });
    assert.strictEqual(S.monster.rangeDelta, 1);
    assert.strictEqual(S.monster.hpMaxMult, 1.25);
    same(S.extendedClips.stageMod, { atk: 1 });
    assert.strictEqual(S.extendedClips.rangeDelta, 1);
    same(S.infected.stageMod, { atk: 1, spd: 1 });
    same(S.mechaForm.stageMod, { spd: -3, def: 1, mdef: 2 });
    assert.strictEqual(S.mechaForm.rangeDelta, 2);
    // Every status a hook applies exists.
    assert.ok(S[S.incendiary.basicAttackStatus.id]);
    assert.ok(S.blind, 'glitter motes blind');
    // Monstrous hands the HP back on removal (pure functions — run them on a stub).
    const u = { maxHp: 400, hp: 100, dead: false, status: { monster: 3 } };
    S.monster.onApply(u, null, { refreshed: false });
    assert.strictEqual(u.maxHp, 500); assert.strictEqual(u.hp, 200);
    S.monster.onApply(u, null, { refreshed: true });
    assert.strictEqual(u.maxHp, 500, 'a refresh never stacks the bonus');
    S.monster.onRemove(u);
    assert.strictEqual(u.maxHp, 400); assert.strictEqual(u.hp, 200);
    assert.strictEqual(u._monsterHpBonus, undefined);
});

test('phase 4: the AI, the mana formula and the spell card know the new statuses', () => {
    const hardCc = (aiSrc.match(/const HARD_CC = new Set\(\[([\s\S]*?)\]\)/) || [])[1] || '';
    for (const id of ['feared', 'possessed', 'infected']) assert.ok(hardCc.includes(`'${id}'`), `ai.js HARD_CC lacks ${id}`);
    const mfHard = (dataSrc.match(/const _MF_HARD_CC = \{([\s\S]*?)\};/) || [])[1] || '';
    for (const id of ['feared', 'possessed', 'infected']) assert.ok(new RegExp(`\\b${id}:`).test(mfHard), `_MF_HARD_CC lacks ${id}`);
    const mfDot = (dataSrc.match(/const _MF_DOT\s*= \{([\s\S]*?)\};/) || [])[1] || '';
    for (const id of ['haunted', 'corroded']) assert.ok(new RegExp(`\\b${id}:`).test(mfDot), `_MF_DOT lacks ${id}`);
    const mfBuff = (dataSrc.match(/const _MF_BUFF\s*= \{([\s\S]*?)\};/) || [])[1] || '';
    for (const id of ['stoneform', 'blessed', 'monster', 'extendedClips', 'incendiary', 'sparkling', 'levitating']) assert.ok(new RegExp(`\\b${id}:`).test(mfBuff), `_MF_BUFF lacks ${id}`);
    assert.ok(/const isDebuff = def \? def\.kind === 'debuff'/.test(uiSrc), 'ui.js spell-card status label reads STATUS_DEFS kind');
});

test('phase 4: engine hooks are wired where the plan says (source-text guards)', () => {
    const count = (text, re) => (text.match(re) || []).length;
    // blockSpells: one gate, and no site still asks for silence alone.
    assert.ok(/function unitSpellsBlocked\(unit\)/.test(battleSrc));
    assert.strictEqual(count(battleSrc, /unitHasStatus\([A-Za-z_]+, 'silence'\)/g), 1, 'battle.js: only unitSpellsBlocked itself may read silence directly');
    assert.strictEqual(count(uiSrc, /unitHasStatus\([A-Za-z_]+, 'silence'\)/g), 0, 'ui.js silence gates route through unitSpellsBlocked');
    assert.ok(count(battleSrc, /unitSpellsBlocked\(/g) >= 12, 'silence gates converted');
    // countsAs (Corroded), generic rangeDelta, basicAttackStatus (Incendiary).
    assert.ok(/function bonusStatusMatches[\s\S]{0,600}countsAs/.test(battleSrc));
    assert.ok(/function getEffectiveRange[\s\S]{0,2500}\?\.rangeDelta/.test(battleSrc), 'getEffectiveRange sums STATUS_DEFS rangeDelta');
    assert.ok(/basicAttackStatus/.test(battleSrc));
    // Links, the rope, the flight from fear, levitation, the realm.
    assert.ok(count(battleSrc, /_procLinks\(/g) >= 2, '_procLinks defined and called from applyDamageToUnit');
    assert.ok(count(battleSrc, /_tetherFollow\(/g) >= 2, '_tetherFollow defined and called from finishMoveAt');
    assert.ok(count(battleSrc, /_fearFleeMove\(/g) >= 2, '_fearFleeMove defined and called at activation');
    assert.ok(count(battleSrc, /isUnitRealmShieldedFrom\(/g) >= 6, 'realm gate on target / damage / heal / status sites');
    assert.ok(/function levitateUnit\(/.test(battleSrc));
    assert.ok(/unit\.status\.levitating/.test(mapSrc), 'map.js canFly honours Levitating');
    // Glitter motes ride the pixie-dust system.
    assert.ok(/shedMotes/.test(battleSrc) && /blindOnStep/.test(battleSrc));
    // onApply / onRemove hooks fire from the two status funnels.
    assert.ok(/meta\.onApply\(target, sourceUnit/.test(battleSrc));
    assert.ok(/_def\.onRemove\(unit\)/.test(battleSrc));
    // The blitz skip is generic (blockMove + blockAction), not a stun/frozen id list.
    assert.ok(/function getNextBlitzUnit\(\)[\s\S]{0,1500}blockMove && STATUS_DEFS\[k\]\?\.blockAction/.test(stateSrc));
    // Partner fields land on the unit (state-sync carries them).
    for (const f of ['_fearSourceId', '_tetherCasterId', '_boundToId', '_voodooAllyId', '_realmPartnerId', '_controllerPlayer']) {
        assert.ok(battleSrc.includes(f), `applyStatusPayload stamps ${f}`);
    }
});

test('§5.6 retune: non-capstone stage buffs/debuffs are ±1 (capstones may do ±2)', () => {
    // Ring 3 of a race tree is the capstone (tier III); everything else, and
    // every off-tree / class spell, is ±1. Calcify keeps −2 by the plan's
    // explicit carve-out (the only M.ATK debuff).
    const capstoneIds = new Set();
    for (const tree of Object.values(D.RACE_TREE || {})) {
        for (const [node, v] of Object.entries(tree)) {
            if (String(node) !== '3') continue;
            for (const id of (Array.isArray(v) ? v : [v])) capstoneIds.add(id);
        }
    }
    const ALLOWED_TWO = new Set(['raceCalcify']);
    const seen = new Set();
    const check = (sp, where) => {
        if (!sp || !sp.id || seen.has(sp.id) || !sp.statStageBoost) return;
        seen.add(sp.id);
        const big = Object.entries(sp.statStageBoost).filter(([, v]) => Math.abs(v) >= 2);
        if (!big.length) return;
        assert.ok(capstoneIds.has(sp.id) || ALLOWED_TWO.has(sp.id), `${sp.id} (${where}) wears ${JSON.stringify(sp.statStageBoost)} but is not a capstone`);
        for (const [, v] of big) assert.ok(Math.abs(v) <= 2, `${sp.id}: no stage boost beyond ±2`);
    };
    for (const [race, arr] of Object.entries(D.RACE_ABILITIES || {})) (arr || []).forEach(sp => check(sp, race));
    for (const sp of Object.values(D.SPELL_LIBRARY || {})) check(sp, 'class');
    assert.ok(capstoneIds.size > 0 && seen.size > 30, 'the sweep saw the roster');
    // The words follow the math: no non-capstone desc still promises 2 stages.
    for (const [race, arr] of Object.entries(D.RACE_ABILITIES || {})) {
        for (const sp of arr || []) {
            if (!sp.statStageBoost || capstoneIds.has(sp.id) || ALLOWED_TWO.has(sp.id)) continue;
            assert.ok(!/by [23] stages/.test(sp.desc || ''), `${sp.id} (${race}) desc still says 2+ stages`);
        }
    }
});

/* ═══════════════════════════════════════════════════════════════════════
   Phase 5 wave A — the reuse-heavy spell wave (plan §9.5, shipped 2026-09-08).
   Every new spell, every rename / retune, the two new kinds (transform,
   tackle), the four new flags (executeBelowPct, onKill*, lineWidth > 1,
   terrainDeform.flatten, expireTerrain) and the engine sites that honour them.
   ═══════════════════════════════════════════════════════════════════════ */
// (aiSrc is declared above)
const vfxSrc = src('three-vfx-effects.js');
const uiSrc2 = src('ui.js');

/* id → [race, kind, { field: expected }] — the §6 numbers that matter. */
const WAVE_A = {
    raceQBSneak:          ['quarterback',      'escape',    { teleportDistance: 3 }],
    raceTransform:        ['honda civic',      'transform', { formA: 'carForm', formB: 'mechaForm', range: 0 }],
    raceSnowballVolley:   ['santa clause',     'aoe',       { aoeRadius: 1, range: 4, dmg: 80, damageType: 'magic' }],
    raceWhiteChristmas:   ['santa clause',     'zoneDebuff',{ aoeRadius: 1, zoneDuration: 2, expireTerrain: 'ice' }],
    raceIceShard:         ['yeti',             'damage',    { dmg: 100, range: 3, damageType: 'magic' }],
    raceIncendiaryRounds: ['marksman',         'buff',      { range: 0 }],
    raceGraveChill:       ['skeleton',         'damage',    { dmg: 100, range: 3, damageType: 'magic' }],
    raceDinoTailWhip:     ['dinosaur',         'damage',    { dmg: 100, range: 1, pushDistance: 2, damageType: 'physical' }],
    raceApexRoar:         ['dinosaur',         'warCry',    { auraRadius: 2 }],
    raceTreelineRetreat:  ['bigfoot',          'escape',    { teleportDistance: 3 }],
    raceStoneform:        ['gargoyle',         'buff',      { range: 0 }],
    racePiercingArrow:    ['robinhood',        'linePush',  { range: 5, dmg: 120, pushDistance: 2, collisionBonus: 60, collisionStatusBoth: true }],
    raceFreezeBreath:     ['superhero',        'line',      { range: 2, dmg: 40, damageType: 'magic' }],
    raceSkyTackle:        ['superhero',        'tackle',    { chargeToTarget: true, pushDistance: 4, collisionBonus: 50, damageType: 'physical' }],
    raceClusterRockets:   ['cyborg',           'aoe',       { aoeRadius: 1, range: 4, dmg: 110, damageType: 'magic' }],
    racePlasmaCannon:     ['cyborg',           'line',      { range: 4, dmg: 130, lineWidth: 2, damageType: 'magic' }],
};
/* id → the ONE status each carrier/rider applies. */
const WAVE_A_STATUS = {
    raceQBSneak: 'invisible', raceSnowballVolley: 'slow', raceWhiteChristmas: 'slow', raceIceShard: 'slow',
    raceIncendiaryRounds: 'incendiary', raceGraveChill: 'slow', raceTreelineRetreat: 'regen', raceStoneform: 'stoneform',
    raceFreezeBreath: 'frozen', raceClusterRockets: 'stagger', racePlasmaCannon: 'burn',
};
const raceSpell = (race, id) => (D.RACE_ABILITIES[race] || []).find(s => s && s.id === id);
const treeHas = (race, id) => (D.RACE_TREE[race] || []).some(n => (Array.isArray(n) ? n : [n]).includes(id));

test('Phase 5 wave A: every §6 spell exists on its race with its kind, numbers, status and tree node', () => {
    for (const [id, [race, kind, fields]] of Object.entries(WAVE_A)) {
        const sp = raceSpell(race, id);
        assert.ok(sp, `${race} has ${id}`);
        assert.strictEqual(sp.kind, kind, `${id} kind`);
        for (const [k, v] of Object.entries(fields)) same(sp[k], v, `${id}.${k}`);
        assert.ok(sp.desc && sp.desc.length > 20, `${id} has a desc`);
        assert.ok(treeHas(race, id), `${id} sits on ${race}'s RACE_TREE`);
        assert.ok(D.getRaceTreeAllIds(race).includes(id), `${id} reachable through getRaceTreeAllIds`);
        if (WAVE_A_STATUS[id]) {
            const fx = sp.statusEffects || (sp.collisionStatus ? [sp.collisionStatus] : []);
            assert.strictEqual(fx.length, 1, `${id} applies exactly one status`);
            assert.strictEqual(fx[0].id, WAVE_A_STATUS[id], `${id} applies ${WAVE_A_STATUS[id]}`);
            assert.ok(D.STATUS_DEFS[fx[0].id], `${id}'s status is a STATUS_DEFS row`);
        }
    }
    // The riders' statuses are rows too.
    assert.strictEqual(raceSpell('robinhood', 'racePiercingArrow').collisionStatus.id, 'root');
    assert.strictEqual(raceSpell('superhero', 'raceSkyTackle').collisionStatus.id, 'stagger');
    // Twins: every wave-A pair is a 2-array on its node (both alternates exist).
    const pairs = {
        quarterback: ['raceBlitz', 'raceQBSneak'], 'honda civic': ['raceTransform', 'raceExhaustCloud'],
        'santa clause': ['raceNaughtyList', 'raceWhiteChristmas'], yeti: ['raceFrozenPunch', 'raceIceShard'],
        marksman: ['sharedSmokeScreen', 'raceIncendiaryRounds'], skeleton: ['raceBoneToss', 'raceGraveChill'],
        dinosaur: ['sharedFissure', 'raceApexRoar'], bigfoot: ['raceRealityShift', 'raceTreelineRetreat'],
        gargoyle: ['raceStoneform', 'raceGothicRampart'], robinhood: ['raceSplittingArrow', 'racePiercingArrow'],
        superhero: ['raceShockwaveClap', 'raceSkyTackle'], cyborg: ['overclock', 'racePlasmaCannon'],
    };
    for (const [race, pair] of Object.entries(pairs)) {
        const alts = Object.values(D.getRaceTreeAlts(race)).map(a => JSON.stringify(a));
        assert.ok(alts.includes(JSON.stringify(pair)), `${race} twins ${pair.join(' ⇄ ')} (has ${alts.join(' | ')})`);
    }
});

test('Phase 5 wave A: renames, retunes and retirements', () => {
    assert.strictEqual(raceSpell('dinosaur', 'raceApexCharge').name, 'Stampede');
    same(raceSpell('dinosaur', 'raceJurassicJaw').onKillHealPct, 0.25);
    same(raceSpell('dinosaur', 'raceJurassicJaw').onKillRefundAp, 1);
    assert.strictEqual(raceSpell('robinhood', 'raceArrowRain').name, 'Arrow Volley');
    assert.strictEqual(raceSpell('robinhood', 'raceArrowRain').range, 6);
    assert.strictEqual(raceSpell('superhero', 'raceLaserBeam').name, 'Heat Vision');
    assert.strictEqual(raceSpell('superhero', 'raceLaserBeam').range, 3);
    assert.strictEqual(raceSpell('ki fighter', 'raceKiBlast').range, 4);
    same(raceSpell('marksman', 'raceFireForEffect').bonusVsStatus, { status: 'burn', mult: 1.5 });
    assert.strictEqual(raceSpell('conspiracy theorist', 'raceTruthBomb').name, 'Flat Earth');
    same(raceSpell('conspiracy theorist', 'raceTruthBomb').terrainDeform, { flatten: true, radius: 1 });
    // Take Aim executes at ≤15% for every Sniper (§10 #4 taken as yes).
    const headshot = D.SPELL_BY_ID.headshot;
    assert.ok(headshot && headshot.executeBelowPct === 0.15, 'headshot executeBelowPct 0.15');
    assert.ok(/killed outright/i.test(headshot.desc));
    // Perch Form is retired (Stoneform replaced it); the reptilian keeps ITS Tail Whip id.
    assert.ok(!raceSpell('gargoyle', 'racePerchForm'), 'Perch Form retired');
    assert.ok(!D.SPELL_BY_ID.racePerchForm, 'no orphan racePerchForm');
    assert.ok(raceSpell('reptilian', 'raceTailWhip') && raceSpell('dinosaur', 'raceDinoTailWhip'), 'two Tail Whips, two ids');
    // Mecha reaches +2 with spells too (Robo Punch at 3).
    same(D.STATUS_DEFS.mechaForm.spellRangeDelta, 2);
    same(D.STATUS_DEFS.mechaForm.rangeDelta, 2);
    // Every wave-A id has a VFX family recipe.
    for (const id of Object.keys(WAVE_A)) assert.ok(vfxSrc.includes(`SPELL_MAP['${id}']`), `${id} has a SPELL_MAP recipe`);
    assert.ok(vfxSrc.includes("SPELL_MAP['raceDinoTailWhip']"));
});

test('Phase 5 wave A: the engine honours the new kinds and flags (source-text guards)', () => {
    const count = (text, re) => (text.match(re) || []).length;
    // Kinds registered + the damage pipeline takes tackle.
    assert.ok(/transform:\s*\{ minRange: 0, offensive: false, selfCast: true/.test(battleSrc), 'SPELL_KIND_META.transform');
    assert.ok(/tackle:\s*\{ minRange: 1, offensive: true,\s*breaksStealth: true/.test(battleSrc), 'SPELL_KIND_META.tackle');
    assert.ok(/'damage', 'multiHit', 'ricochet', 'lifeDrain', 'tackle',/.test(battleSrc), 'tackle is a Press-Turn kind');
    assert.ok(/spell\.kind === 'damage' \|\| spell\.kind === 'tackle'/.test(battleSrc), 'doSpell routes tackle through the damage branch');
    assert.ok(/else if \(spell\.kind === 'transform'\)/.test(battleSrc), 'doSpell transform branch');
    // Stance carriers: the form pins the sprite, the transform toggles the carriers.
    assert.ok(/function unitStanceForm\(unit\)/.test(battleSrc) && /function _formSpriteFor\(unit\)/.test(battleSrc));
    assert.ok(count(battleSrc, /_formSpriteFor\(unit\)/g) >= 3, 'apply / revert / transform all read the worn form');
    assert.ok(/formSprites:\s*\{\s*mecha:/.test(battleSrc), "UNIT_ANIM_OVERRIDES['honda civic'].formSprites.mecha");
    assert.ok(/spellRangeDelta/.test(battleSrc.slice(battleSrc.indexOf('function getEffectiveSpellRange'), battleSrc.indexOf('function getEffectiveSpellRange') + 2000)), 'getEffectiveSpellRange sums spellRangeDelta');
    // Knockback + the tackle carry live in _runPostEffects.
    const post = battleSrc.slice(battleSrc.indexOf('function _runPostEffects'), battleSrc.indexOf('function _runChargeToTargetSpell'));
    assert.ok(/spell\.pushDistance && target && !target\.dead/.test(post) && /_isTackle/.test(post) && /collisionStatus/.test(post), '_runPostEffects: knockback + tackle carry + collision riders');
    // Wide beams + pin riders.
    assert.ok(/function getLineSpellLaneOffsets\(spell, dx, dy\)/.test(battleSrc));
    assert.ok(count(battleSrc, /getLineSpellLaneOffsets\(/g) >= 4, 'lanes: _applyLineDamage, ray footprint, direction preview');
    const line = battleSrc.slice(battleSrc.indexOf('function _applyLineDamage'), battleSrc.indexOf('function _executeAllySpellAnimation'));
    assert.ok(/collisionStatusBoth/.test(line) && /collisionBonus/.test(line), '_applyLineDamage pin riders');
    // Flatten deform.
    const deform = battleSrc.slice(battleSrc.indexOf('function applyTerrainDeform'), battleSrc.indexOf('function applyTerrainDeform') + 6000);
    assert.ok(/deform\.flatten/.test(deform) && /_floorH - oldH/.test(deform), 'applyTerrainDeform flatten mode');
    // Execute + on-kill riders, on the live hit AND the delayed Take Aim shot.
    assert.ok(/function _applyExecuteRider\(unit, target, spell\)/.test(battleSrc) && /function _applyOnKillRiders\(unit, target, spell\)/.test(battleSrc));
    assert.ok(/_execArmed && !target\.dead\) _applyExecuteRider/.test(battleSrc) && /_applyOnKillRiders\(unit, target, spell\);/.test(battleSrc));
    assert.ok(/executeBelowPct: spell\.executeBelowPct \|\| 0/.test(battleSrc), '_castLaserMark carries executeBelowPct');
    assert.ok(/ds\.executeBelowPct/.test(stateSrc) && /_applyExecuteRider/.test(stateSrc), 'state.js detonation honours the execute');
    // Escapes land their own statuses; zones paint terrain when they clear.
    const esc = battleSrc.slice(battleSrc.indexOf("else if (spell.kind === 'escape')"), battleSrc.indexOf("else if (spell.kind === 'selfHeal')"));
    assert.ok(/applyStatusEffects\(unit, spell\.statusEffects/.test(esc), 'escape applies statusEffects to the caster');
    assert.ok(/expireTerrain: spell\.expireTerrain \|\| null/.test(battleSrc) && /zone\.expireTerrain/.test(battleSrc), 'zoneDebuff expireTerrain');
    // AI + HUD + library filter know the kinds.
    assert.ok(/'leapStrike', 'tackle'\]\)/.test(aiSrc) && /kind === 'transform'/.test(aiSrc) && /'lifeDrain', 'tackle'\]\.includes\(kind\)/.test(aiSrc), 'ai.js tackle + transform');
    assert.ok(/k === 'tackle'/.test(hudSrc) && /k === 'transform'/.test(hudSrc), 'hud.js spell-card parts');
    assert.ok(/'damage','tackle','transform'/.test(uiSrc2), 'ui.js spell library kinds');
});

/* ═══════════════════════════════════════════════════════════════════════
   Phase 5 wave B — control + links (plan §9.5, shipped 2026-09-08).
   The five new kinds (possess, link, shadowRealm, transfer, cannibalize),
   the control hand-off (unit.player flips to the controller's seat and
   comes back on every removal path), the two-click cast gate, and the
   engine / AI / HUD / online sites that honour them.
   ═══════════════════════════════════════════════════════════════════════ */
const onlineSrc = src('online.js');
const mapSrc2 = src('map.js');
const cssSrc = src('styles-cinematic.css');

/* id → [race, kind, { field: expected }] — the §6 numbers that matter. */
const WAVE_B = {
    raceHaunt:        ['ghost',    'debuff',      { range: 5 }],
    racePossession:   ['ghost',    'possess',     { range: 3, activations: 1, cooldownRounds: 3 }],
    raceInfect:       ['zombie',   'possess',     { range: 1, activations: 4 }],
    raceCannibalize:  ['zombie',   'cannibalize', { range: 2, healPct: 0.35, corpseDelay: 2 }],
    raceSoulBind:     ['demon',    'link',        { range: 3, linkTargets: 'enemy-enemy', pairRange: 4 }],
    raceShadowRealm:  ['demon',    'shadowRealm', { range: 3, tier: 'III', cooldownRounds: 3 }],
    raceSacrifice:    ['shaman',   'transfer',    { range: 3, linkTargets: 'ally-ally', takePct: 0.30, givePct: 1.5 }],
    raceVoodoo:       ['shaman',   'link',        { range: 3, linkTargets: 'enemy-ally' }],
    raceThrallBite:   ['vampire',  'possess',     { range: 1, activations: 1, dmg: 80, damageType: 'physical', drainPct: 0.25 }],
    raceEnthrall:     ['succubus', 'possess',     { range: 2, activations: 1 }],
};
/* id → the ONE status each applies (+ its duration). */
const WAVE_B_STATUS = {
    raceHaunt: ['haunted', 3], racePossession: ['possessed', 2], raceInfect: ['infected', 5],
    raceSoulBind: ['soulBound', 3], raceShadowRealm: ['shadowRealm', 2], raceVoodoo: ['voodoo', 3],
    raceThrallBite: ['possessed', 2], raceEnthrall: ['possessed', 2],
};

test('Phase 5 wave B: every §6 spell exists on its race with its kind, numbers, status and tree node', () => {
    for (const [id, [race, kind, fields]] of Object.entries(WAVE_B)) {
        const sp = raceSpell(race, id);
        assert.ok(sp, `${race} has ${id}`);
        assert.strictEqual(sp.kind, kind, `${id} kind`);
        for (const [k, v] of Object.entries(fields)) same(sp[k], v, `${id}.${k}`);
        assert.ok(sp.desc && sp.desc.length > 20, `${id} has a desc`);
        assert.ok(treeHas(race, id), `${id} sits on ${race}'s RACE_TREE`);
        assert.ok(D.getRaceTreeAllIds(race).includes(id), `${id} reachable through getRaceTreeAllIds`);
        const want = WAVE_B_STATUS[id];
        if (want) {
            const fx = sp.statusEffects || [];
            assert.strictEqual(fx.length, 1, `${id} applies exactly one status`);
            assert.strictEqual(fx[0].id, want[0], `${id} applies ${want[0]}`);
            assert.strictEqual(fx[0].duration, want[1], `${id} status duration`);
            assert.ok(D.STATUS_DEFS[fx[0].id], `${id}'s status is a STATUS_DEFS row`);
        } else {
            assert.ok(!sp.statusEffects, `${id} applies no status`);
        }
    }
    // Possess spells wear a CONTROL status; their durations cover activations + 1.
    for (const id of ['racePossession', 'raceInfect', 'raceThrallBite', 'raceEnthrall']) {
        const [race] = WAVE_B[id];
        const sp = raceSpell(race, id);
        assert.ok(D.STATUS_DEFS[sp.statusEffects[0].id].control, `${id}'s status is a control row`);
        assert.ok(sp.statusEffects[0].duration >= sp.activations + 1, `${id} duration ≥ activations + 1`);
    }
    // Enthrall's payoff: bonusVsStatus on a possess = extra activations vs Charmed.
    same(raceSpell('succubus', 'raceEnthrall').bonusVsStatus, { status: 'charm', mult: 2 });
    // Twins: every wave-B pair is a 2-array on its node.
    const pairs = {
        ghost: ['raceColdSpot', 'sharedFlashFreeze'], zombie: ['raceZombieRush', 'raceCannibalize'],
        demon: ['raceInfernalHurl', 'raceSoulBind'], shaman: ['raceSpiritWalk', 'raceSacrifice'],
        vampire: ['raceBatSwarm', 'raceThrallBite'], succubus: ['raceSleepParalysis', 'raceEnthrall'],
    };
    for (const [race, pair] of Object.entries(pairs)) {
        const alts = Object.values(D.getRaceTreeAlts(race)).map(a => JSON.stringify(a));
        assert.ok(alts.includes(JSON.stringify(pair)), `${race} twins ${pair.join(' ⇄ ')} (has ${alts.join(' | ')})`);
    }
    assert.ok(JSON.stringify(D.getRaceTreeAlts('zombie')).includes('"raceOutbreak","raceInfect"'), 'zombie r3 twin Outbreak ⇄ Infect');
    assert.ok(JSON.stringify(D.getRaceTreeAlts('demon')).includes('"raceHellmouth","raceShadowRealm"'), 'demon capstone twin Hellmouth★ ⇄ Shadow Realm★');
    assert.ok(JSON.stringify(D.getRaceTreeAlts('shaman')).includes('"raceAyahuascaRetreat","raceVoodoo"'), 'shaman r3 twin Ayahuasca ⇄ Voodoo');
    // Ghost pillar order: Haunt → Cold Spot ⇄ Flash Freeze → Possession → Boo★.
    same(D.getRaceTreeSpells('ghost'), ['raceHaunt', 'raceColdSpot', 'racePossession', 'raceBoo']);
});

test('Phase 5 wave B: payoffs, the control funnel and the VFX aliases', () => {
    same(raceSpell('ghost', 'raceBoo').bonusVsStatus, { status: 'haunted', mult: 1.5 });
    same(raceSpell('demon', 'raceVoidContract').bonusVsStatus, { status: ['contract', 'soulBound'], mult: 1.5 });
    same(raceSpell('shaman', 'raceBadTrip').bonusVsStatus, { status: ['slow', 'voodoo'], mult: 1.5 });
    same(raceSpell('zombie', 'raceShamblingHorde').bonusVsStatus, { status: 'infected', mult: 1.5 });
    // Possession is no longer the Jammed bolt.
    assert.ok(!raceSpell('ghost', 'racePossession').statusEffects.some(f => f.id === 'jammed'));
    // data.js: the two control statuses hand the seat back from onRemove (the ONE funnel).
    assert.ok(/function _releaseControl\(unit\)[\s\S]{0,400}_origPlayer/.test(dataSrc), 'data.js _releaseControl restores unit.player from _origPlayer');
    assert.strictEqual((dataSrc.match(/onRemove\(unit\) \{ _releaseControl\(unit\); \}/g) || []).length, 2, 'possessed + infected call _releaseControl');
    // Every wave-B id has a VFX family recipe.
    for (const id of Object.keys(WAVE_B)) assert.ok(vfxSrc.includes(`SPELL_MAP['${id}']`), `${id} has a SPELL_MAP recipe`);
    // The Void Stage palette + its vignette row.
    assert.ok(/shadow:\s*\{ color: 0x05040a/.test(battleSrc), 'VOID_PALETTES.shadow');
    assert.ok(/\.void-layer\.vp-shadow::after/.test(cssSrc), 'styles-cinematic.css vp-shadow vignette');
});

test('Phase 5 wave B: the engine honours the new kinds (source-text guards)', () => {
    const count = (text, re) => (text.match(re) || []).length;
    // Kinds registered with the flags the engine keys on.
    assert.ok(/possess:\s*\{ minRange: 1, offensive: true,\s*breaksStealth: true/.test(battleSrc), 'SPELL_KIND_META.possess');
    assert.ok(/shadowRealm:\s*\{ minRange: 1, offensive: true/.test(battleSrc), 'SPELL_KIND_META.shadowRealm');
    assert.ok(/link:\s*\{ minRange: 1, offensive: true,[^}]*twoClick: true/.test(battleSrc), 'SPELL_KIND_META.link twoClick');
    assert.ok(/transfer:\s*\{ minRange: 0, offensive: false, allyOnly: true,[^}]*twoClick: true/.test(battleSrc), 'SPELL_KIND_META.transfer twoClick');
    assert.ok(/cannibalize:\s*\{ minRange: 1, offensive: false,[^}]*corpseTarget: true/.test(battleSrc), 'SPELL_KIND_META.cannibalize corpseTarget');
    for (const k of ['possess', 'shadowRealm', 'link', 'transfer', 'cannibalize']) {
        assert.ok(battleSrc.includes(`else if (spell.kind === '${k}')`), `doSpell ${k} branch`);
    }
    // The control hand-off: possessUnit flips the seat, releasePossession hands it back,
    // the activation end spends one, the activation start announces it, death releases.
    assert.ok(/function possessUnit\(caster, target, spell, acts\)[\s\S]{0,1600}target\._origPlayer = target\.player;\s*target\.player = caster\.player;/.test(battleSrc), 'possessUnit flips unit.player');
    assert.ok(/function releasePossession\(unit, opts = \{\}\)/.test(battleSrc) && /function _possessSpendActivation\(unit\)/.test(battleSrc));
    assert.ok(/_possessSpendActivation\(_ctlUnit\)/.test(battleSrc), 'maybeAdvanceTurn spends a controlled activation');
    assert.ok(/if \(unitIsControlled\(nextUnit\)\) showPossessedActivation\(nextUnit\);/.test(battleSrc), 'activation beat');
    assert.ok(/releasePossession\(unit, \{ quiet: true \}\)/.test(mapSrc2), 'map.js defeatUnit releases the seat before the death is counted');
    assert.ok(/window\.getControllingPlayer = getControllingPlayer/.test(battleSrc) && /window\.unitHomePlayer = unitHomePlayer/.test(battleSrc));
    // Two-click gate sits before the commit point; the drum follows the pick; ESC / cancel drop it.
    const gateAt = battleSrc.indexOf('if (_kindMeta(spell).twoClick) {');
    const commitAt = battleSrc.indexOf('// Every validation gate has passed — the cast WILL happen.');
    assert.ok(gateAt > 0 && commitAt > gateAt && commitAt - gateAt < 4000, 'two-click gate right before the cast commit');
    assert.ok(count(battleSrc, /if \(_skm\.twoClick\) \{/g) >= 2, 'drum + approach lists follow the first pick');
    assert.ok(/function _twoClickPick\(spell\)/.test(battleSrc) && /function clearSpellPick\(\)/.test(battleSrc));
    assert.ok(/state\._spellPick1 = null;\s*\/\/ two-click casts/.test(uiSrc2) && /if \(state\._spellPick1\) \{\s*state\._spellPick1 = null;/.test(uiSrc2), 'ui.js cancel / ESC drop the pick');
    // Corpse targeting is shared (raiseDead + cannibalize) through one predicate.
    assert.ok(/function spellTargetsCorpses\(spell\)/.test(battleSrc));
    assert.ok(count(battleSrc, /spellTargetsCorpses\(spell\)/g) >= 6, 'drum, approach list, has-target check and usability all route through spellTargetsCorpses');
    // Shadow Realm: both ends wear the marker with the partner id; the director holds the void.
    assert.ok(/partnerId: unit\.id \}, `\$\{spell\.name\}: `, unit\)/.test(battleSrc) && /partnerId: target\.id \}, `\$\{spell\.name\}: `, unit\)/.test(battleSrc));
    assert.ok(/raceShadowRealm\(ctx\) \{[\s\S]{0,400}_voidBeat\('shadow', ctx/.test(battleSrc), 'CINE_SEQUENCES.raceShadowRealm');
    assert.ok(/maxMs: opts\.maxMs, caption: opts\.caption/.test(battleSrc), '_voidBeat forwards maxMs');
    // AI: scorers, targeters, the pair pick, the realm gate, the executor seating the pick.
    for (const k of ['possess', 'shadowRealm', 'link', 'transfer', 'cannibalize']) {
        assert.ok(aiSrc.includes(`kind === '${k}'`), `ai.js knows ${k}`);
    }
    assert.ok(/const _aiPairPick = \{\};/.test(aiSrc) && /partner: _aiPairPick\[spell\.id\] \|\| null/.test(aiSrc) && /g\.state\._spellPick1 = \{ id: _p1\.id, spellId: action\.spell\.id/.test(aiSrc), 'AI two-click execution');
    assert.ok(/isUnitRealmShieldedFrom\(tg, _aiActor\)/.test(aiSrc), 'AI treats a realm unit as untargetable');
    // HUD + library filter.
    assert.ok(/k === 'possess'/.test(hudSrc) && /k === 'link' \|\| k === 'transfer'/.test(hudSrc) && /k === 'cannibalize'/.test(hudSrc), 'hud.js spell-card parts');
    assert.ok(/'damage','tackle','transform','possess','link','shadowRealm','transfer','cannibalize'/.test(uiSrc2), 'ui.js spell library kinds');
    // Online: the guest runs the first pick locally, the second click carries partnerId,
    // the host seats it; the pick is per-viewer UI; the activation beat is relayed.
    assert.ok(/partnerId: _tcPick \? _tcPick\.id : null/.test(onlineSrc) && /data\.partnerId != null/.test(onlineSrc), 'online.js doSpell partnerId');
    assert.ok(/_spellPick1: 1,/.test(onlineSrc) && /'_spellPick1',/.test(onlineSrc), '_spellPick1 skip-listed + guest-local');
    assert.ok(/type: 'possessed-activation'/.test(onlineSrc) && /data\.type === 'possessed-activation'/.test(onlineSrc), 'possessed-activation relay');
});

/* ═══════════════════════════════════════════════════════════════════════
   Phase 5 wave C — summons, tethers, terrain (plan §9.5, shipped 2026-09-08).
   cowboy, mad scientist, black goo, fairy, ghoul, atlantean, dragon: the
   `summonUnit` kind (a walking turret), the goo terrain (timed 'swamp'),
   lineZone, onlyTerrain teleports, statusFirst / purgeBuffs / paintTerrain
   riders, the Lasso rope, and the engine sites that honour them.
   ═══════════════════════════════════════════════════════════════════════ */
const rendererSrc = src('three-renderer.js');

const WAVE_C = {
    raceDynamite:       ['cowboy',        'aoe',        { range: 3, dmg: 110, aoeRadius: 1, damageType: 'physical' }],
    raceWhistle:        ['cowboy',        'summonUnit', { range: 1, maxActivePerCaster: 1, summonDef: { key: 'hound', name: 'Hound', move: 4, dmg: 60, hits: 3, reveals: 3 } }],
    raceLasso:          ['cowboy',        'pull',       { range: 3, pullDistance: 2, groundsFlyers: true }],
    raceQuickDraw:      ['cowboy',        'damage',     { range: 5, dmg: 125, name: 'Long Rifle' }],
    raceSummonCreation: ['mad scientist', 'summonUnit', { range: 1, maxActivePerCaster: 1, summonDef: { key: 'creation', name: 'Creation', move: 3, dmg: 90, hits: 4, armored: true } }],
    raceMonsterSerum:   ['mad scientist', 'buff',       { range: 3 }],
    raceOvercharge:     ['mad scientist', 'aoe',        { range: 3, dmg: 110, aoeRadius: 1, name: 'Chemical Concoction' }],
    raceGooShot:        ['black goo',     'damage',     { range: 4, dmg: 90, damageType: 'magic', statusFirst: true, paintTerrain: { terrain: 'swamp', radius: 0, rounds: 3 } }],
    raceIckySurprise:   ['black goo',     'teleport',   { range: 6, onlyTerrain: 'swamp' }],
    raceSplash:         ['black goo',     'barrage',    { range: 0, dmg: 60, aoeRadius: 1, aoeOriginSelf: true, paintTerrain: { terrain: 'swamp', radius: 1, rounds: 3 } }],
    raceSparkle:        ['fairy',         'buff',       { range: 3 }],
    raceFairyDust:      ['fairy',         'warCry',     { range: 0, auraRadius: 3 }],
    raceGlitterBomb:    ['fairy',         'aoe',        { range: 4, dmg: 100, aoeRadius: 1, damageType: 'magic' }],
    raceFrenzy:         ['ghoul',         'lifeDrain',  { range: 1, dmg: 120, damageType: 'physical', drainPct: 0.30 }],
    raceFear:           ['ghoul',         'barrage',    { range: 0, aoeRadius: 3, aoeOriginSelf: true, noDamage: true }],
    raceTerrorPounce:   ['ghoul',         'damage',     { range: 3, dmg: 180, tier: 'III', damageType: 'physical', chargeToTarget: true, purgeBuffs: true }],
    raceTsunami:        ['atlantean',     'linePush',   { range: 4, dmg: 160, tier: 'III', lineWidth: 3, pushDistance: 2 }],
    raceDragonBreath:   ['dragon',        'line',       { range: 3, dmg: 90, lineWidth: 1, lineZone: true, zoneDuration: 2 }],
};
/* id → the ONE status each applies (+ duration); Fairy Dust's rides teamStatusEffects. */
const WAVE_C_STATUS = {
    raceDynamite: ['stagger', 1], raceLasso: ['tethered', 2], raceMonsterSerum: ['monster', 3],
    raceOvercharge: ['corroded', 2], raceGooShot: ['goo', 2], raceSplash: ['goo', 2],
    raceSparkle: ['sparkling', 2], raceFairyDust: ['levitating', 2], raceGlitterBomb: ['blind', 1],
    raceFrenzy: ['grievous', 2], raceFear: ['feared', 1], raceTsunami: ['slow', 1], raceDragonBreath: ['burn', 2],
};

test('Phase 5 wave C: every §6 spell exists on its race with its kind, numbers, status and tree node', () => {
    for (const [id, [race, kind, fields]] of Object.entries(WAVE_C)) {
        const sp = raceSpell(race, id);
        assert.ok(sp, `${race} has ${id}`);
        assert.strictEqual(sp.kind, kind, `${id} kind`);
        for (const [k, v] of Object.entries(fields)) same(sp[k], v, `${id}.${k}`);
        assert.ok(sp.desc && sp.desc.length > 20, `${id} has a desc`);
        assert.ok(treeHas(race, id), `${id} sits on ${race}'s RACE_TREE`);
        assert.ok(D.getRaceTreeAllIds(race).includes(id), `${id} reachable through getRaceTreeAllIds`);
        const want = WAVE_C_STATUS[id];
        const fx = sp.kind === 'warCry' ? (sp.teamStatusEffects || []) : (sp.statusEffects || []);
        if (want) {
            assert.strictEqual(fx.length, 1, `${id} applies exactly one status`);
            assert.strictEqual(fx[0].id, want[0], `${id} applies ${want[0]}`);
            assert.strictEqual(fx[0].duration, want[1], `${id} status duration`);
            assert.ok(D.STATUS_DEFS[fx[0].id], `${id}'s status is a STATUS_DEFS row`);
        } else {
            assert.ok(!fx.length, `${id} applies no status`);
        }
    }
    // Summons: the def carries everything the walker reads.
    for (const id of ['raceWhistle', 'raceSummonCreation']) {
        const sp = raceSpell(WAVE_C[id][0], id);
        for (const k of ['key', 'name', 'move', 'dmg', 'hits']) assert.ok(sp.summonDef[k] != null, `${id}.summonDef.${k}`);
    }
    // Payoffs that came with the wave.
    same(raceSpell('cowboy', 'raceHighNoon').bonusVsStatus, { status: ['stagger', 'tethered'], mult: 1.5 });
    same(raceSpell('black goo', 'raceAbsorb').bonusVsStatus, { status: ['poison', 'goo'], mult: 1.5 });
    same(raceSpell('ghoul', 'raceTerrorPounce').bonusVsStatus, { status: 'feared', mult: 1.5 });
    assert.strictEqual(raceSpell('ghoul', 'raceCarrionFeast').tier, 'II', 'Carrion Feast demoted to tier II');
    assert.ok(!raceSpell('mad scientist', 'raceOvercharge').bonusVsStatus, 'Chemical Concoction dropped the Poison payoff (Corroded IS poison)');
    assert.ok(raceSpell('atlantean', 'raceFlood'), 'Great Flood stays authored (off-tree, §10 #15)');
    // Twins: every wave-C pair is a 2-array on its node.
    const pairs = {
        cowboy: [['raceFanTheHammer', 'raceDynamite'], ['raceQuickDraw', 'raceWhistle']],
        'mad scientist': [['raceCloneDecoy', 'raceSummonCreation'], ['raceOvercharge', 'raceMonsterSerum']],
        'black goo': [['raceGooShot', 'raceCorrosiveSplash'], ['raceIckySurprise', 'raceAbsorb'], ['raceSplash', 'raceToxicNova']],
        fairy: [['raceGlitterburst', 'raceSparkle'], ['racePixieDust', 'raceFairyDust'], ['raceTrickRoom', 'raceGlitterBomb']],
        ghoul: [['raceGhoulishBite', 'raceFrenzy'], ['raceCorpseCrawl', 'raceFear'], ['sharedPoisonSwamp', 'raceCarrionFeast']],
        atlantean: [['racePoseidonsWrath', 'raceTsunami']],
        dragon: [['raceDragonBreath', 'raceWingGust']],
    };
    for (const [race, want] of Object.entries(pairs)) {
        const alts = Object.values(D.getRaceTreeAlts(race)).map(a => JSON.stringify(a));
        for (const pair of want) assert.ok(alts.includes(JSON.stringify(pair)), `${race} twins ${pair.join(' ⇄ ')} (has ${alts.join(' | ')})`);
    }
    same(D.getRaceTreeSpells('ghoul'), ['raceGhoulishBite', 'raceCorpseCrawl', 'sharedPoisonSwamp', 'raceTerrorPounce']);
    same(D.getRaceTreeSpells('cowboy'), ['raceLasso', 'raceFanTheHammer', 'raceQuickDraw', 'raceHighNoon']);
    // Every wave-C id has a VFX family recipe.
    for (const id of Object.keys(WAVE_C)) {
        if (id === 'raceLasso' || id === 'raceQuickDraw' || id === 'raceOvercharge') continue;   // pre-existing ids keep their own
        assert.ok(vfxSrc.includes(`SPELL_MAP['${id}']`), `${id} has a SPELL_MAP recipe`);
    }
});

test('Phase 5 wave C: the goo terrain, the Oozing trail and the timed-terrain plumbing', () => {
    // data.js: swamp is the goo tile — enterStatus + a status-typed endTurn; Oozing wears the trail.
    assert.ok(/swamp: \{[\s\S]{0,900}enterStatus: \{ id: 'goo', duration: 2 \}/.test(dataSrc), 'TERRAIN_RULES.swamp.enterStatus');
    assert.ok(/swamp: \{[\s\S]{0,1400}return \{ type: 'status', id: 'goo', duration: 2/.test(dataSrc), 'TERRAIN_RULES.swamp.endTurn → status');
    same(D.PASSIVE_DEFS.oozing.trailTerrain, { terrain: 'swamp', rounds: 3 });
    assert.ok(D.SIM_DEFAULTS ? D.SIM_DEFAULTS.summonUnit : /summonUnit:\s*\{ simTargeting: 'tile'/.test(dataSrc), 'SIM_DEFAULTS.summonUnit');
    // battle.js: the painter, the tick (called from the zones pass), the enter hook.
    assert.ok(/function _paintTimedTerrain\(cx, cy, cfg, unit, label\)/.test(battleSrc) && /function _tickTimedTerrain\(\)/.test(battleSrc));
    assert.ok(/_tickTimedTerrain\(\);\s*\/\/ wave C/.test(battleSrc), 'timed terrain ticks in processEndOfRoundZonesAndSeeds');
    assert.ok(/state\._timedTerrain\.push\(\{ x: t\.x, y: t\.y, prev: cur, terrain: cfg\.terrain, expiresRound: expires/.test(battleSrc), 'painter remembers prev terrain');
    assert.ok(/_er\.enterStatus/.test(battleSrc), 'finishMoveAt applies enterStatus');
    assert.ok(/if \(spell\.paintTerrain && target\) _paintTimedTerrain\(target\.x, target\.y, spell\.paintTerrain, unit, spell\.name\);/.test(battleSrc), 'damage riders paint the struck tile');
    assert.ok(/if \(spell\.paintTerrain\) _paintTimedTerrain\(unit\.x, unit\.y, spell\.paintTerrain, unit, spell\.name\);/.test(battleSrc), 'barrage paints its footprint');
    // map.js: the trail + the status result type.
    assert.ok(/unitPassiveValue\(unit, 'trailTerrain'\)/.test(mapSrc2), 'applyTerrainTurnEffects lays the trail');
    assert.ok(/result\.type === 'status'/.test(mapSrc2), 'applyTerrainTurnEffects honours a status result');
    // Zones no longer treat radius 0 as radius 1 (lineZone tiles are 1×1).
    for (const [name, text] of [['battle.js', battleSrc], ['ui.js', uiSrc2], ['map.js', mapSrc2]]) {
        assert.ok(!/zone\.radius \|\| 1/.test(text), `${name} zone radius fallback is ??`);
    }
    assert.ok(!/zz\.radius \|\| 1/.test(rendererSrc) && !/\(z\.radius \|\| 1\)/.test(rendererSrc), 'three-renderer.js zone radius fallback');
});

test('Phase 5 wave C: the engine honours the summon kind and the new flags (source-text guards)', () => {
    assert.ok(/summonUnit:\s*\{ minRange: 1, offensive: false, tileTargeted: true/.test(battleSrc), 'SPELL_KIND_META.summonUnit');
    assert.ok(battleSrc.includes("else if (spell.kind === 'summonUnit')"), 'doSpell summonUnit branch');
    assert.ok(/summon: _sd\.key \|\| 'pet', hitsToKill: true, hp: _sHits, maxHp: _sHits/.test(battleSrc), 'the summon is a hits-to-kill turret');
    // The walker: summons hunt enemies only, walk `move` tiles, reveal, and credit the caster.
    assert.ok(/if \(turret\.zombie \|\| turret\.summon\) \{/.test(battleSrc), 'processTurretVolleys walker branch');
    assert.ok(/&& \(!turret\.summon \|\| u\.player !== turret\.owner\)/.test(battleSrc), 'summons hunt enemies only');
    assert.ok(/const _walkSteps = turret\.summon \? \(turret\.move \|\| 3\) : 2;/.test(battleSrc), 'summons walk their move');
    assert.ok(/if \(turret\.summon && turret\.reveals > 0\)/.test(battleSrc), 'the hound reveals');
    assert.ok(/if \(s\.summon\) \{[\s\S]{0,900}sourceUnit: caster \|\| undefined/.test(battleSrc), 'summon hits credit the caster');
    // Armored: physical blows count half; the basic attack passes its type.
    assert.ok(/function damageTurretAt\(x, y, dmg, attackerUnit, opts = \{\}\)/.test(battleSrc));
    assert.ok(/const _chip = \(turret\.armored && opts\.damageType === 'physical'\) \? 0\.5 : 1;/.test(battleSrc));
    assert.ok(/damageTurretAt\(x, y, damage, unit, \{ damageType: 'physical' \}\);/.test(battleSrc), 'doAttack passes physical');
    // lineZone, onlyTerrain, statusFirst, purgeBuffs, the pull's statuses.
    assert.ok(/if \(spell\.lineZone && _lineCells\.length\)/.test(battleSrc) && /radius: 0, type: 'debuff', lineZone: true/.test(battleSrc), 'lineZone → 1-tile zones');
    assert.ok(/if \(spell\.onlyTerrain && getTerrainAt\(x, y\) !== spell\.onlyTerrain\)/.test(battleSrc), 'teleport onlyTerrain gate');
    assert.ok(/function getTeleportTerrainTiles\(unit, spell\)/.test(battleSrc) && /if \(kind === 'teleport' && spell\.onlyTerrain\) return getTeleportTerrainTiles\(unit, spell\)\.length > 0;/.test(battleSrc));
    assert.ok(/if \(spell\.statusFirst && spell\.statusEffects && !target\.dead\)/.test(battleSrc) && /statusEffects: spell\.statusFirst \? null : spell\.statusEffects,/.test(battleSrc), 'statusFirst');
    assert.ok(/function removeBuffs\(unit\)/.test(battleSrc) && /if \(spell\.purgeBuffs && target && !target\.dead\)/.test(battleSrc), 'purgeBuffs');
    assert.ok(/the pull's own statusEffects[\s\S]{0,600}applyStatusEffects\(target, spell\.statusEffects, `\$\{spell\.name\}: `, unit\);/.test(battleSrc), 'pull applies its statuses (the rope)');
    assert.ok(/case 'summonUnit':/.test(battleSrc) && /kind === 'summonUnit'\n/.test(battleSrc) || /kind === 'raiseDead' \|\| kind === 'summonUnit'/.test(battleSrc), 'prompt + Strike category');
    // AI, HUD, library, highlight, renderer.
    assert.ok(/kind === 'summonUnit'/.test(aiSrc) && /spell\.onlyTerrain && g\.getTerrainAt\(tx, ty\) !== spell\.onlyTerrain/.test(aiSrc), 'ai.js summon scorer/targeter + goo teleport');
    assert.ok(/'deployObject', 'summonUnit',/.test(aiSrc), 'ai.js summonUnit is non-repeatable');
    assert.ok(/k === 'summonUnit'/.test(hudSrc) && /tr\.summon/.test(hudSrc), 'hud.js spell-card parts + summon nameplate');
    assert.ok(/'transfer','cannibalize','summonUnit'/.test(uiSrc2), 'ui.js spell library kinds');
    assert.ok(/!spell\.onlyTerrain \|\| getTerrainAt\(cx, cy\) === spell\.onlyTerrain/.test(uiSrc2), 'ui.js teleport highlight honours onlyTerrain');
    assert.ok(/function _buildSummon3D\(turret\)/.test(rendererSrc) && /if \(turret\.summon\) return _buildSummon3D\(turret\);/.test(rendererSrc), 'renderer builds the summons');
});

/* ═══════════════════════════════════════════════════════════════════════
   Phase 6 — the two new races (plan §6.19 / §6.20 / §9.5, shipped 2026-09-08).
   The gangster (Gunslinger, Shank) and the nun (White Mage, Devout): every
   table a race key touches, their pillars, the `steal` and `cleanseArea`
   kinds, the dash `afterShot` rider, and the engine sites that honour them.
   ═══════════════════════════════════════════════════════════════════════ */
const spritesSrc = src('sprites.js');
const serverSrc = src('server.js');
const partyBuilderSrc = src('party-builder.js');

const PHASE_6 = {
    raceStompOut:      ['gangster', 'damage',      { range: 1, dmg: 120, damageType: 'physical' }],
    raceDriveBy:       ['gangster', 'dash',        { range: 3, dmg: 0, afterShot: { dmg: 100, range: 3 } }],
    raceHitALick:      ['gangster', 'steal',       { range: 2, dmg: 60, damageType: 'physical', stealKeys: 1, stealItems: 1 }],
    raceChoppa:        ['gangster', 'line',        { range: 5, dmg: 110, damageType: 'physical', lineWidth: 1, tier: 'II' }],
    raceExtendedClips: ['gangster', 'warCry',      { range: 0, auraRadius: 3, tier: 'III' }],
    racePurify:        ['nun',      'cleanseArea', { range: 3, aoeRadius: 1 }],
    raceSmite:         ['nun',      'damage',      { range: 3, dmg: 100, damageType: 'magic' }],
    raceBlessing:      ['nun',      'buff',        { range: 3 }],
    racePrayer:        ['nun',      'shield',      { range: 3, shield: 150, tier: 'II' }],
    raceHallelujah:    ['nun',      'healAll',     { range: 0, healAmt: 180, cleanse: 2, tier: 'III' }],
};
const PHASE_6_STATUS = {
    raceStompOut:      ['grievous', 2],
    raceExtendedClips: ['extendedClips', 3],
    raceBlessing:      ['blessed', 3],
};

test('Phase 6: gangster + nun exist in every race table, with the §6 stats and passives', () => {
    for (const race of ['gangster', 'nun']) {
        assert.ok(D.AVAILABLE_RACES.includes(race), `${race} in AVAILABLE_RACES`);
        assert.ok(D.RACE_PROFILES[race] && D.RACE_PROFILES[race].label, `${race} profile`);
        assert.ok(D.RACE_BASE_STATS[race], `${race} statline`);
        assert.ok(new RegExp("'" + race + "':\\s*\\{ h: [0-9.]+, w: [0-9.]+ \\}").test(dataSrc), `${race} physique`);
        assert.ok(D.RACE_TREE[race] && D.RACE_TREE[race].length === 4, `${race} tree`);
        assert.ok(Array.isArray(D.RACE_ABILITIES[race]) && D.RACE_ABILITIES[race].length >= 4, `${race} abilities`);
        assert.ok(new RegExp("'" + race + "': [0-9]+,").test(dataSrc.slice(dataSrc.indexOf('const CAMPAIGN_RACE_PRICES'), dataSrc.indexOf('const CAMPAIGN_REGION_THEMES'))), `${race} campaign price`);
        assert.ok(D.EW_RACE_BIOMES[race] && D.EW_RACE_BIOMES[race].length, `${race} biomes`);
        assert.ok(new RegExp("'" + race + "':\\s*\\{ folder: 'Homosapien'").test(spritesSrc), `${race} sprite path rule`);
        assert.ok(new RegExp("'" + race + "': `\\$\\{_S\\}/homosapien\\.png`").test(spritesSrc), `${race} sprite sheet`);
        assert.ok(new RegExp("'" + race + "'").test(serverSrc.slice(serverSrc.indexOf('const AVAILABLE_RACES'), serverSrc.indexOf('const AVAILABLE_RACES') + 3000)), `${race} in server.js AVAILABLE_RACES`);
        assert.ok(new RegExp("'" + race + "':\\s*'").test(partyBuilderSrc), `${race} dossier lore`);
    }
    same(D.RACE_BASE_STATS.gangster, { hp: 540, mp: 100, atk: 78, def: 44, mdef: 44, int: 10, awr: 56, spd: 64 });
    same(D.RACE_BASE_STATS.nun,      { hp: 460, mp: 250, atk: 8, def: 26, mdef: 58, int: 90, awr: 70, spd: 30 });
    assert.strictEqual(D.RACE_DEFAULT_JOBS.gangster, 'Gunslinger');
    assert.strictEqual(D.RACE_DEFAULT_JOBS.nun, 'White Mage');
    same(D.RACE_PASSIVES.gangster, ['shank']);
    same(D.RACE_PASSIVES.nun, ['devout']);
    assert.strictEqual(D.PASSIVE_DEFS.shank.oppAttackMult, 1.5);
    assert.strictEqual(D.PASSIVE_DEFS.devout.healMult, 1.2);
    // The nun is her own race: the priest's female form is the Priestess, and
    // the Nun's user-authored roster lines moved to her key untouched.
    assert.strictEqual(D.RACE_PROFILES.priest.labelFemale, 'Priestess');
    assert.strictEqual(D.RACE_PROFILES.nun.label, 'Nun');
    assert.ok(Array.isArray(D.DOOR_ROSTER_LINES.nun) && D.DOOR_ROSTER_LINES.nun.length >= 2, 'the Nun keeps her lines');
    assert.ok(!D.DOOR_ROSTER_LINES['priest:female'], 'priest:female lines moved to nun');
    // Sprites: the nun wears the whitemage female model; the gangster is male-only, sheet-only until his GLB lands.
    assert.ok(/'nun': \{\s*female: _mkUAL\('Homosapien\/Female\/whitemage', 'sexy_nun_girl_realis'/.test(spritesSrc), 'nun RACE_MODELS_3D');
    assert.ok(/'nun': 'female',/.test(spritesSrc) && /'gangster': 'male',/.test(spritesSrc), 'RACE_SPRITE_GENDERS');
    assert.ok(/'gangster': 'gunslinger',/.test(spritesSrc) && /'nun': 'whitemage',/.test(spritesSrc), '2D sheet job folders');
    // The nun is a starter on both sides (parity); the gangster is not (no model yet).
    assert.ok(D.ACCT_STARTER_UNITS.includes('nun') && !D.ACCT_STARTER_UNITS.includes('gangster'), 'data.js starters');
    assert.ok(/'nun',\s*\n\s*'yeti', 'skeleton'/.test(serverSrc), 'server.js starters');
    // The Heat Death ladder tops out at the roster size.
    const heat = D.ACH_CATALOG.find(l => l.metric === 'champsMastered');
    assert.strictEqual(heat.tiers[heat.tiers.length - 1], D.AVAILABLE_RACES.length);
});

test('Phase 6: the two pillars — rows, twins, kinds, statuses, VFX recipes', () => {
    for (const [id, [race, kind, fields]] of Object.entries(PHASE_6)) {
        const sp = raceSpell(race, id);
        assert.ok(sp, `${id} exists on ${race}`);
        assert.strictEqual(sp.kind, kind, `${id} kind`);
        for (const [k, want] of Object.entries(fields)) same(sp[k], want, `${id}.${k}`);
        assert.ok(D.getRaceTreeAllIds(race).includes(id), `${id} reachable through getRaceTreeAllIds`);
        const want = PHASE_6_STATUS[id];
        const fx = sp.kind === 'warCry' ? (sp.teamStatusEffects || []) : (sp.statusEffects || []);
        if (want) {
            assert.strictEqual(fx.length, 1, `${id} applies exactly one status`);
            assert.strictEqual(fx[0].id, want[0], `${id} applies ${want[0]}`);
            assert.strictEqual(fx[0].duration, want[1], `${id} status duration`);
            assert.ok(D.STATUS_DEFS[fx[0].id], `${id}'s status is a STATUS_DEFS row`);
        } else {
            assert.ok(!fx.length, `${id} applies no status`);
        }
    }
    same(Object.values(D.getRaceTreeAlts('gangster')), [['raceDriveBy', 'raceHitALick']]);
    same(Object.values(D.getRaceTreeAlts('nun')), [['racePurify', 'raceSmite']]);
    same(D.getRaceTreeSpells('gangster'), ['raceStompOut', 'raceDriveBy', 'raceChoppa', 'raceExtendedClips']);
    same(D.getRaceTreeSpells('nun'), ['racePurify', 'raceBlessing', 'racePrayer', 'raceHallelujah']);
    assert.strictEqual(raceSpell('nun', 'raceSmite'), raceSpell('priest', 'raceSmite'), 'the nun shares the priest\'s Smite row');
    for (const id of Object.keys(PHASE_6)) {
        if (id === 'raceSmite') continue;   // pre-existing id keeps its own recipe
        assert.ok(vfxSrc.includes(`SPELL_MAP['${id}']`), `${id} has a SPELL_MAP recipe`);
    }
    // The sim-mode defaults know the new kinds.
    assert.ok(/steal:\s*\{ simTargeting: 'unit'/.test(dataSrc) && /cleanseArea:\s*\{ simTargeting: 'tile'/.test(dataSrc), 'SIM_DEFAULTS rows');
});

test('Phase 6: the engine honours steal, cleanseArea and the dash afterShot (source-text guards)', () => {
    // battle.js: kind meta, the branches, the helpers, the prompts, the glow footprint, the Simul category.
    assert.ok(/steal:\s*\{ minRange: 1, offensive: true,\s*breaksStealth: true, noStrikeLeap: true \}/.test(battleSrc), 'SPELL_KIND_META.steal');
    assert.ok(/cleanseArea:\s*\{ minRange: 0, offensive: false, tileTargeted: true, fogExempt: true, noStrikeLeap: true \}/.test(battleSrc), 'SPELL_KIND_META.cleanseArea');
    assert.ok(/else if \(spell\.kind === 'steal'\) \{/.test(battleSrc) && /function _stealFromUnit\(thief, victim, opts\)/.test(battleSrc), 'steal branch + helper');
    assert.ok(/keys: spell\.stealKeys != null \? spell\.stealKeys : 1,\s*items: spell\.stealItems != null \? spell\.stealItems : 1,/.test(battleSrc), 'steal counts');
    assert.ok(/else if \(spell\.kind === 'cleanseArea'\) \{/.test(battleSrc), 'cleanseArea branch');
    assert.ok(/getActiveStatusKeys\(u\)\.filter\(k => STATUS_DEFS\[k\]\?\.kind === 'debuff'\)/.test(battleSrc) && /const n = removeBuffs\(u\);/.test(battleSrc), 'allies lose debuffs, enemies lose buffs');
    assert.ok(/function _afterShotTarget\(unit, lx, ly, range\)/.test(battleSrc) && /if \(spell\.afterShot\) \{\s*const _asR = spell\.afterShot\.range \|\| 3;\s*const _asT = _afterShotTarget\(unit, x, y, _asR\);/.test(battleSrc), 'the shot after the run');
    assert.ok(/if \(spell\.afterShot\) completionDelay \+= dashAnimMs/.test(battleSrc), 'the turn holds through the shot');
    assert.ok(/if \(hitDmg <= 0\) continue;/.test(battleSrc), 'a zero-damage dash only shoves');
    assert.ok(/case 'cleanseArea':/.test(battleSrc) && /case 'steal':/.test(battleSrc) && /spell\.afterShot\s*\?\s*nm \+ ': select a tile to dash to — you then fire/.test(battleSrc), 'targeting prompts');
    assert.ok(/cleanse: 1, cleanseArea: 1,/.test(battleSrc) && /else if \(kind === 'cleanseArea'\) \{\s*tiles = getSquareArea\(tx, ty/.test(battleSrc), 'glow footprint');
    assert.ok(/\|\| kind === 'steal'\) cat = kind;/.test(battleSrc) && /kind === 'cleanse' \|\| kind === 'cleanseArea'\) cat = 'cleanse';/.test(battleSrc), 'Simul categories');
    // ai.js: scorer + targeter for both kinds, the afterShot rider in the dash scorer/targeter.
    assert.ok(/if \(kind === 'steal' && target\) \{/.test(aiSrc) && /if \(kind === 'cleanseArea' && target\) \{/.test(aiSrc), 'ai.js scoreSpell');
    assert.ok(/if \(kind === 'steal'\) \{\s*const inReach/.test(aiSrc) && /if \(kind === 'cleanseArea'\) \{\s*const defs/.test(aiSrc), 'ai.js findSpellTarget');
    assert.ok(/if \(spell\.afterShot\) \{\s*const _asR = spell\.afterShot\.range \|\| 3;\s*const _asC = v\.visibleEnemies/.test(aiSrc) && /if \(hits === 0 && shot === 0\) continue;/.test(aiSrc), 'ai.js afterShot');
    // HUD + library + highlight.
    assert.ok(/k === 'cleanseArea'/.test(hudSrc) && /k === 'steal'/.test(hudSrc) && /if \(sp\.afterShot\) parts\.push/.test(hudSrc), 'hud.js spell-card parts');
    assert.ok(/'summonUnit','steal','cleanseArea'/.test(uiSrc2), 'ui.js spell library kinds');
    assert.ok(/'cleanse', 'cleanseArea'\]\.includes\(k\)\) return 'heal'/.test(uiSrc2) && /'aoeShield', 'delayed', 'cleanseArea'\]\.includes\(spell\.kind\)/.test(uiSrc2), 'ui.js class + AoE preview');
    // check-grades: nothing planned any more — both passives are live and priced.
    assert.deepStrictEqual(Object.keys(PLANNED), [], 'PLANNED_PASSIVE_ALLOWANCE is empty');
});
