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
/* Plan §5.2 slot check — who wears what today (gangster/nun join in Phase 6). */
const EXPECTED_RACE_PASSIVES = {
    ghost: ['incorporeal'], werewolf: ['lycanthropy', 'bloodcraze'], skeleton: ['boneDeep'],
    zombie: ['returnOfTheDead'], dinosaur: ['reach'], dragon: ['dragonReach'], bigfoot: ['cryptid'],
    ghoul: ['pureNegativity'], robinhood: ['serrated'], marksman: ['longshot', 'pointBlank'],
    'black goo': ['oozing'], cyborg: ['powerCore'], 'mad scientist': ['madGenius', 'rayGun'],
    fairy: ['fairyDustTrail'], cowboy: ['quickdraw'],
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
