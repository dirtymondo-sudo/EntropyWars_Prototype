// SPELL FAMILY AUDIT — Batch B (front §9): the registry. One export, because the bake refuses a RACE_TREE rung
// outside its race's families. Built by hand from §6.1 (family verdicts), §6.2 (MOVE / DELETE / MERGE / PASSIVE on
// rung rows), §6.3 (the 18 new rows that are rungs) and §7 (every race's families; the rungs are rewritten
// separately in RACE_TREE — see BATCH_B_LOG.md).
//   node docs/spell-audit/batches/batchB.js <s7.json> > batchB.json
'use strict';
const L = [0, 25, 50, 75, 100];

/* ── §6.1: family registry ── */
const FAMILY_DELETE = ['actingchops', 'archaeology', 'astronautcamp', 'culinaryarts', 'musictheory', 'persuasion',
    'astrology' /* MERGE → Fortune Telling (Star Crossed moves) */, 'stoneage' /* rows → Giant Abilities */];
const FAMILY_RENAME = {
    ancientknowledge: 'Ancient Knowledge',        // was Occult Knowledge
    tentacleappendages: 'Cephalopod Anatomy',     // was Tentacle Appendages
    chemistry: 'Chemistry',                       // typo: Chemistry Knowldege
    apeintelligence: 'Great Ape',                 // was Monkey Brains
    psychadelic: 'Psychedelics',                  // was Drug Use
    scarecrow: 'Scarecrow Abilities',             // typo: Scarecrow Abilties
};
const FAMILY_UNIQUE = { scarecrow: 'scarecrow', ki: 'ki fighter' };   // Q9

/* ── §6.2: the 22 MOVEs (every spell sits in exactly one family) ── */
const MOVE = {
    passiveGreenThumb: 'agriculture', raceGravityBoots: 'alientechnology', raceDinoTailWhip: 'apexpredator',
    raceInkCloud: 'tentacleappendages', passiveFieldOperative: 'computerhacking', raceCultTithe: 'cult',
    passiveTinker: 'engineering', raceStarCrossed: 'fortunetelling', raceStoneThrow: 'titan', raceThickHide: 'titan',
    raceSeismicLeap: 'apeintelligence', raceDivineJudgment: 'angelic', raceJellyDrift: 'jellyfish',
    raceHydraulicPunch: 'machinery', raceBlessedBlade: 'maincharacter', raceQuickDraw: 'marksmanship',
    raceBoneBarrage: 'necromancy', sharedNuke: 'politics', raceAyahuascaRetreat: 'psychadelic', provoke: 'stagepresence',
    raceHitALick: 'thievery', raceBorrowedClaw: 'trickery',
};

/* ── §6.2: rung rows deleted (13) and merged away (3: Primal Roar → Apex Roar, Unstoppable Charge → Rampage,
   Robo Punch → Hydraulic Crush — the targets already carry the merged mechanic or wait in Batch D) ── */
const DELETE = ['raceAmbushLunge', 'raceNeuralHack', 'raceRealityShift', 'raceInnerDemon', 'raceClockworkTurret',
    'racePixieDust', 'radiantBolt', 'raceCliffCharge', 'improvise', 'raceIceShard', 'raceGothicRampart',
    'raceTinkersContraption', 'racePrimalRoar', 'raceUnstoppableCharge', 'raceRoboPunch'];
// sharedScorchedEarth lives in a shared const: removed by hand (the bake cannot).

/* ── §6.2 / §6.4: the two spells that become family passives (both LIVE hooks) ── */
const PASSIVE_NULLS = { cost: 0, apCost: 0, range: 0, statStageBoost: null, statusEffects: null, spellType: null };
const PASSIVE = {
    raceChitinArmor: Object.assign({}, PASSIVE_NULLS, { kind: 'passive', type: 'utility', tier: 2, icon: '🪲',
        hooks: { statBonus: { def: 8 }, immuneStatus: ['stagger'] },
        desc: 'A shell that does not flinch: +8 DEF, and Stagger never takes hold.' }),
    raceSymbioteArmor: Object.assign({}, PASSIVE_NULLS, { kind: 'passive', type: 'utility', tier: 2, icon: '🧬',
        hooks: { healOnceBelowPct: { pct: 40, healPct: 30 } },
        desc: 'Once per life, when the host falls under 40% HP the suit knits it back for 30% of max HP.' }),
};

/* ── §6.3: the 18 new rows that are rungs (home = the race whose rung it becomes) ── */
const row = (race, t, o) => Object.assign({ _home: { race }, tier: t, cost: L[t], apCost: 1 }, o);
const ADDED = {
    raceRollCredits: row('chosen one', 4, { families: ['maincharacter'], spellType: 'human', name: 'Roll Credits', type: 'damage',
        kind: 'damage', damageType: 'physical', dmg: 180, range: 2, bonusVsStatus: { status: 'stagger', mult: 1.5 },
        desc: 'This is the part where it ends. Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Staggered targets.' }),
    raceDisintegrator: row('martian', 4, { families: ['alientechnology'], spellType: 'alien', element: 'lightning', name: 'Disintegrator',
        type: 'damage', kind: 'damage', damageType: 'physical', dmg: 180, range: 4, bonusVsStatus: { status: ['stun', 'minimize'], mult: 1.5 },
        desc: 'There is no body to recover. Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Stunned or Minimized targets.' }),
    raceEntanglingRoots: row('bigfoot', 3, { families: ['nature'], spellType: 'anomaly', element: 'nature', name: 'Entangling Roots',
        type: 'damage', kind: 'aoe', damageType: 'magic', dmg: 125, range: 4, aoeRadius: 1, statusEffects: [{ id: 'root', duration: 1 }],
        desc: 'The ground remembers what it grew. Deals MEDIUM magic damage to All Enemies in a 3×3 and Roots them for a round.' }),
    raceBoneLance: row('skeleton', 3, { families: ['bonedensity'], spellType: 'unholy', name: 'Bone Lance', type: 'damage',
        kind: 'line', damageType: 'physical', dmg: 125, range: 4, lineWidth: 1, ignoreArmor: true,
        desc: 'A femur, thrown like a javelin, through everyone in the way. Deals MEDIUM physical damage to All Enemies in a line. Ignores DEF.' }),
    raceScrapMine: row('gnome', 2, { families: ['trapmaking'], spellType: 'tech', element: 'fire', name: 'Scrap Mine', type: 'utility',
        kind: 'deployObject', damageType: 'physical', range: 3, objectHp: 20, blastRadius: 1, blastDmg: 100, detonateOnStep: true,
        maxActivePerCaster: 2, statusEffects: [{ id: 'stagger', duration: 1 }],
        desc: 'Nails, powder, a spring. Cheap. Sets a mine: the first enemy to step on it sets off a MEDIUM blast in a 3×3 that Staggers. Two per caster.' }),
    raceCarToss: row('kaiju', 1, { families: ['kaiju'], spellType: 'unholy', name: 'Car Toss', type: 'damage', kind: 'damage',
        damageType: 'physical', dmg: 100, range: 4, ignoresLineOfSight: true,
        desc: 'Whatever was parked there. Deals MEDIUM physical damage to a Single Enemy, over any wall.' }),
    raceRot: row('bee queen', 3, { families: ['poison'], spellType: 'unholy', element: 'poison', name: 'Rot', type: 'damage', kind: 'damage',
        damageType: 'magic', dmg: 125, range: 4, statusEffects: [{ id: 'poison', duration: 2 }, { id: 'grievous', duration: 2 }],
        desc: 'It does not heal. Deals MEDIUM magic damage to a Single Enemy; the wound Poisons and will not close — healing on them is halved.' }),
    raceLongBomb: row('quarterback', 3, { families: ['football'], spellType: 'human', element: 'wind', name: 'Long Bomb', type: 'damage',
        kind: 'damage', damageType: 'physical', dmg: 135, range: 6, ignoresLineOfSight: true,
        desc: 'Let it fly. Deals MEDIUM physical damage to a Single Enemy up to 6 tiles away; the ball arcs over cover.' }),
    raceWebSwing: row('symbiote', 2, { families: ['symbiosis'], spellType: 'unholy', name: 'Web Swing', type: 'utility',
        kind: 'teleport', range: 4, teleportDistance: 4,
        desc: 'The line goes out, the host goes after it. Swing to any free tile within 4.' }),
    raceTimeRewindHeal: row('watcher', 3, { families: ['temporal'], spellType: 'anomaly', name: 'Time Rewind', type: 'heal', kind: 'heal',
        range: 3, healPct: 0.4, cleanse: 99,
        desc: 'Restore them to the moment before. Heals an ally for 40% of their max HP and removes every debuff.' }),
    raceEmptyTheClip: row('gangster', 4, { families: ['streetsmarts'], spellType: 'human', element: 'metal', name: 'Empty the Clip',
        type: 'damage', kind: 'line', damageType: 'physical', dmg: 160, range: 4, lineWidth: 3, projectileOverride: 'proj-bullet',
        bonusVsStatus: { status: 'discord', mult: 1.5 },
        desc: 'Hold the trigger down until it clicks. HEAVY physical damage to everything on a three-wide street in front of you — anyone already Discorded gets the rest of the belt.' }),
    raceSoothe: row('starfish', 1, { families: ['healingmagic'], spellType: 'divine', element: 'light', name: 'Soothe', type: 'heal',
        kind: 'heal', range: 3, healAmt: 80, statusEffects: [{ id: 'regen', duration: 2 }],
        desc: 'A hand on the brow. It does not fix you; it keeps you going. Heals an ally a MEDIUM amount and gives them Regen for 2 rounds.' }),
    raceBrood: row('bee queen', 2, { families: ['insectoid'], spellType: 'alien', element: 'poison', name: 'Brood', type: 'utility',
        kind: 'summonUnit', range: 1, maxActivePerCaster: 1, summonDef: { key: 'drone', name: 'Drone', move: 4, dmg: 55, hits: 3 },
        desc: 'One is never found alone. Hatches a Drone beside the caster: at the end of every round it flies 4 tiles at the nearest enemy and stings for 55. Three hits to bring it down.' }),
    raceDeadMansHand: row('bunny girl', 1, { families: ['gambling'], spellType: 'anomaly', element: 'arcane', name: "Dead Man's Hand",
        type: 'damage', kind: 'multiHit', damageType: 'magic', range: 3, hitDamages: [26, 26, 26, 26],
        desc: 'Aces and eights, thrown edge-first. Four cards at a Single Enemy for WEAK magic damage each.' }),
    raceDoubleDown: row('bunny girl', 3, { families: ['gambling'], spellType: 'anomaly', name: 'Double Down', type: 'buff', kind: 'buff',
        range: 0, statStageBoost: { atk: 2, def: -1 },
        desc: 'Everything on the table. Raises the caster\'s ATK by 2 stages and lowers their DEF by 1 stage.' }),
    racePetrify: row('crystal guardian', 4, { families: ['livingstone'], spellType: 'unholy', element: 'earth', name: 'Petrify',
        type: 'debuff', kind: 'debuff', range: 3, cooldownRounds: 2, statusEffects: [{ id: 'stun', duration: 2 }], statStageBoost: { def: -1 },
        desc: 'Grey climbs from the feet up. For two rounds they are a statue; when it lets go, the cracks stay. Stuns a Single Enemy for 2 rounds and lowers DEF by 1 stage. Cooldown: 2 rounds.' }),
    raceSprint: row('rabbit', 1, { families: ['athleticism'], spellType: 'human', element: 'wind', name: 'Sprint', type: 'utility',
        kind: 'dash', damageType: 'physical', dmg: 0, range: 3,
        desc: 'Go. Runs up to 3 tiles in a straight line.' }),
    raceVault: row('rabbit', 3, { families: ['athleticism'], spellType: 'human', name: 'Vault', type: 'damage', kind: 'leapStrike',
        damageType: 'physical', dmg: 125, range: 3, dmgPerLevel: 15,
        desc: 'Over, not through. Leaps over walls and bodies onto a Single Enemy within 3 tiles for MEDIUM physical damage.' }),
};

const s7 = require(require('path').resolve(process.argv[2]));
const { loadGameData } = require('../../../load-data.js');
const g = loadGameData();
const doc = { format: 'entropy-wars-spell-mods', v: 2, modified: {}, added: ADDED, deleted: DELETE.slice(), families: {}, raceFamilies: {} };
for (const f of FAMILY_DELETE) doc.families[f] = null;
for (const [f, name] of Object.entries(FAMILY_RENAME)) doc.families[f] = Object.assign({}, g.SPELL_FAMILIES[f], { name });
for (const [f, race] of Object.entries(FAMILY_UNIQUE)) doc.families[f] = Object.assign({}, doc.families[f] || g.SPELL_FAMILIES[f], { unique: race });
for (const f of Object.keys(doc.families)) if (doc.families[f]) delete doc.families[f].id;
for (const [id, fam] of Object.entries(MOVE)) doc.modified[id] = { families: [fam] };
for (const [id, p] of Object.entries(PASSIVE)) doc.modified[id] = p;
for (const [race, v] of Object.entries(s7)) doc.raceFamilies[race] = v.fams;
process.stdout.write(JSON.stringify(doc, null, 1));
