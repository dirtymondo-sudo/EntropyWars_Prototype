// SPELL FAMILY AUDIT — Batch C (front §9): the new rows of §6.3 that were not rungs (Batch B shipped those).
// The rows were authored per family by four workers into batchC/part_00..03.js ({ ADDED, DEFER }); this file merges
// them, applies the review fixes below (made possible by the small Batch C engine reads in battle.js) and writes the
// bake export.
//   node docs/spell-audit/batches/batchC.js > batchC.json && node bake-spell-mods.js batchC.json --no-test
'use strict';
const path = require('path');
const L = [0, 25, 50, 75, 100];
const ADDED = {}; let DEFER = [];
for (const n of ['00', '01', '02', '03']) {
    const m = require(path.join(__dirname, 'batchC', `part_${n}.js`));
    Object.assign(ADDED, m.ADDED);
    DEFER = DEFER.concat(m.DEFER);
}

/* ── review fixes: the clauses the Batch C engine reads now carry ── */
// warCry reads `cleanse` (Batch C).
Object.assign(ADDED.raceMantra, { cleanse: 2,
    desc: 'One word, everyone breathing it. Every ally within 2 tiles gains Regen for 3 rounds and is cleansed of 2 debuffs.' });
Object.assign(ADDED.raceEverybodyUp, { cleanse: 99,
    desc: 'On three. Every ally within 2 tiles gains +1 ATK and +1 DEF stage and is cleansed of every debuff.' });
// selfHeal reads `statusEffects` (Batch C).
Object.assign(ADDED.raceLunarRegeneration, { statusEffects: [{ id: 'regen', duration: 2 }],
    desc: 'The wounds close while you watch. Restores 25% of the caster\'s max HP, cleanses 1 debuff and gives Regen for 2 rounds.' });
// healAll reads `auraRadius` + `teamStatusEffects` (Batch C).
Object.assign(ADDED.raceMilkAndCookies, { auraRadius: 2,
    desc: 'Left out for whoever\'s still standing. Every ally within 2 tiles heals a MEDIUM amount of HP and is cleansed of 1 debuff.' });
ADDED.raceRejuvenation = { _home: { lib: true }, name: 'Rejuvenation', tier: 4, cost: L[4], apCost: 2, cooldownRounds: 2,
    families: ['nature'], spellType: 'human', element: 'nature', type: 'heal', kind: 'healAll', range: 0, auraRadius: 3,
    healAmt: 120, cleanse: 1, teamStatusEffects: [{ id: 'regen', duration: 2 }],
    desc: 'Everything green in you wakes up at once. Every ally within 3 tiles heals a MEDIUM amount of HP, is cleansed of 1 debuff and gains Regen for 2 rounds. Cooldown: 2 rounds.' };
// the aoe kind passes groundsFlyers on (Batch C).
Object.assign(ADDED.raceTempest, { groundsFlyers: true,
    desc: 'Call the sky down on the lot of them. HEAVY magic damage to a 3x3; everything in it is Stunned for a round and flyers are knocked out of the air.' });
const DONE = new Set(['raceMantra', 'raceEverybodyUp', 'raceLunarRegeneration', 'raceMilkAndCookies', 'raceRejuvenation', 'raceTempest']);
DEFER = DEFER.filter(([id]) => !DONE.has(id));

const doc = { format: 'entropy-wars-spell-mods', v: 2, modified: {
        // §6.4: Counterspell is Spellsteal's own upgrade (auto: false keeps it off every other arcane row).
        raceSpellsteal: { upgrades: ['upEfficient', 'upReach', 'upCounterspell'] },
    }, added: ADDED, deleted: [], families: {}, raceFamilies: {} };
if (require.main === module) process.stdout.write(JSON.stringify(doc, null, 1));
module.exports = { doc, DEFER };
