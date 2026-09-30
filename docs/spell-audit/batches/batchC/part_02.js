'use strict';
const L = [0, 25, 50, 75, 100];
const ADDED = {
  // ── Internet Addiction ──
  raceDoomscroll: { _home: { lib: true }, name: 'Doomscroll', tier: 1, cost: L[1], apCost: 1, families: ['internetaddiction'],
    spellType: 'human', element: 'psychic', type: 'debuff', kind: 'debuff', range: 4,
    statusEffects: [{ id: 'discord', duration: 2 }],
    desc: 'They read the comments. All of them. A Single Enemy within 4 tiles is Discorded for 2 rounds: ATK down 2 stages and DEF down 1.' },
  raceRabbitHole: { _home: { lib: true }, name: 'Rabbit Hole', tier: 2, cost: L[2], apCost: 1, families: ['internetaddiction'],
    spellType: 'human', type: 'utility', kind: 'teleport', range: 3, teleportDistance: 3,
    desc: 'Three hours later you are somewhere else entirely. Teleports the caster to an unoccupied tile within 3.' },
  // debuff kind: the one kind that deals dmg AND lands a statStageBoost on the target (damage kind reads no statStageBoost)
  raceRatiod: { _home: { lib: true }, name: "Ratio'd", tier: 3, cost: L[3], apCost: 1, families: ['internetaddiction'],
    spellType: 'human', element: 'psychic', type: 'debuff', kind: 'debuff', range: 4, dmg: 125, damageType: 'magic',
    statStageBoost: { atk: -1 },
    bonusVsStatus: { status: 'discord', mult: 1.5 },
    desc: 'The whole internet piles on. Deals MEDIUM magic damage to a Single Enemy and lowers their ATK by 1 stage. Deals bonus damage to targets with Discord.' },

  // ── Ki Energy ──
  raceSpiritBomb: { _home: { lib: true }, name: 'Spirit Bomb', tier: 4, cost: L[4], apCost: 2, families: ['ki'],
    spellType: 'human', element: 'light', type: 'damage', kind: 'delayed', range: 5, dmg: 160, damageType: 'magic',
    aoeRadius: 1, delayTurns: 1,
    desc: 'Lend me your energy. Marks a 3×3 within 5 tiles; at the end of the round it lands for HEAVY magic damage to everything inside.' },

  // ── Knighthood ──
  raceShieldBash: { _home: { lib: true }, name: 'Shield Bash', tier: 2, cost: L[2], apCost: 1, families: ['knight'],
    spellType: 'human', element: 'metal', type: 'damage', kind: 'damage', range: 1, dmg: 110, damageType: 'physical',
    statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'Edge of the shield, under the chin. Deals MEDIUM physical damage to an adjacent enemy and Staggers them: they lose 1 AP.' },

  // ── Lightning Magic ──
  raceStaticShock: { _home: { lib: true }, name: 'Static Shock', tier: 1, cost: L[1], apCost: 1, families: ['lightning'],
    spellType: 'anomaly', element: 'lightning', type: 'damage', kind: 'damage', range: 4, dmg: 100, damageType: 'magic',
    statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'A crack of static across the gap. MEDIUM magic damage, and the jolt costs them an action.' },
  raceChainLightning: { _home: { lib: true }, name: 'Chain Lightning', tier: 3, cost: L[3], apCost: 1, families: ['lightning'],
    spellType: 'anomaly', element: 'lightning', type: 'damage', kind: 'damage', range: 4, dmg: 130, damageType: 'magic',
    chainProfile: [130, 85, 50], chainRadius: 2,
    desc: 'It never wanted just one of you. Deals MEDIUM magic damage to a Single Enemy, then jumps to up to 2 more enemies within 2 tiles of the last, weaker with each jump.' },
  raceTempest: { _home: { lib: true }, name: 'Tempest', tier: 4, cost: L[4], apCost: 2, cooldownRounds: 2, families: ['lightning'],
    spellType: 'anomaly', element: 'lightning', type: 'damage', kind: 'aoe', range: 4, dmg: 160, damageType: 'magic',
    aoeRadius: 1,
    statusEffects: [{ id: 'stun', duration: 1 }],
    desc: 'Call the sky down on the lot of them. HEAVY magic damage to a 3x3; everything in it is Stunned for a round.' },

  // ── Martial Arts ──
  raceRoundhouseKick: { _home: { lib: true }, name: 'Roundhouse Kick', tier: 2, cost: L[2], apCost: 1, families: ['martialarts'],
    spellType: 'human', type: 'damage', kind: 'barrage', range: 0, dmg: 100, damageType: 'physical',
    aoeRadius: 1, aoeOriginSelf: true,
    statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'Everyone in reach. Deals MEDIUM physical damage to All Enemies in the 3×3 around you and Staggers each of them.' },
  racePressurePoint: { _home: { lib: true }, name: 'Pressure Point', tier: 3, cost: L[3], apCost: 1, cooldownRounds: 2, families: ['martialarts'],
    spellType: 'human', type: 'damage', kind: 'damage', range: 1, dmg: 100, damageType: 'physical',
    statusEffects: [{ id: 'stun', duration: 1 }],
    desc: 'Two fingers. Lights out. Deals MEDIUM physical damage to an adjacent enemy and Stuns them for a round. Cooldown: 2 rounds.' },

  // ── Mech Pilot Skills ──
  raceFullBurst: { _home: { lib: true }, name: 'Full Burst', tier: 4, cost: L[4], apCost: 2, cooldownRounds: 2, families: ['mecha'],
    spellType: 'tech', type: 'damage', kind: 'aoe', range: 5, dmg: 150, damageType: 'physical',
    aoeRadius: 2, ignoresLineOfSight: true,
    desc: 'Every hardpoint on the frame, at once. Deals HEAVY physical damage to All Enemies in a 5×5 within 5 tiles. Fires through cover.' },

  // ── Meditation ──
  raceDeepBreath: { _home: { lib: true }, name: 'Deep Breath', tier: 1, cost: L[1], apCost: 1, families: ['meditation'],
    spellType: 'divine', type: 'heal', kind: 'selfHeal', range: 0, healAmt: 100, cleanse: 1,
    desc: 'In through the nose. Restores a MEDIUM amount of HP to the caster and cleanses 1 debuff.' },
  // partial: warCry reads teamStatusEffects but no cleanse — the "cleanse 2 each" clause is dropped (see DEFER)
  raceMantra: { _home: { lib: true }, name: 'Mantra', tier: 3, cost: L[3], apCost: 1, families: ['meditation'],
    spellType: 'divine', element: 'light', type: 'buff', kind: 'warCry', range: 0, auraRadius: 2,
    teamStatusEffects: [{ id: 'regen', duration: 3 }],
    desc: 'One word, everyone breathing it. Every ally within 2 tiles gains Regen for 3 rounds.' },

  // ── Mirror Magic ──
  raceMirrorShard: { _home: { lib: true }, name: 'Mirror Shard', tier: 1, cost: L[1], apCost: 1, families: ['mirrormagic'],
    spellType: 'anomaly', element: 'arcane', type: 'damage', kind: 'ricochet', range: 4, dmg: 80, damageType: 'magic',
    bounceDamage: 40, bounceRadius: 2,
    desc: 'A sliver of the glass. It finds the next face too. Deals WEAK magic damage to a Single Enemy, then bounces to another enemy within 2 tiles for half.' },
  raceSevenYears: { _home: { lib: true }, name: 'Seven Years', tier: 2, cost: L[2], apCost: 1, families: ['mirrormagic'],
    spellType: 'anomaly', element: 'arcane', type: 'damage', kind: 'damage', range: 4, dmg: 100, damageType: 'magic',
    statusEffects: [{ id: 'hexed', duration: 2 }],
    desc: 'You broke it. You know the rule. Deals MEDIUM magic damage to a Single Enemy and Hexes them for 2 rounds.' },
  raceShatteredMirror: { _home: { lib: true }, name: 'Shattered Mirror', tier: 3, cost: L[3], apCost: 1, families: ['mirrormagic'],
    spellType: 'anomaly', element: 'arcane', type: 'damage', kind: 'aoe', range: 4, dmg: 125, damageType: 'magic',
    aoeRadius: 1,
    statusEffects: [{ id: 'blind', duration: 1 }],
    desc: 'Every shard, every eye. Deals MEDIUM magic damage to All Enemies in a 3×3 within 4 tiles and Blinds them for a round.' },

  // ── Mothman ──
  racePremonition: { _home: { lib: true }, name: 'Premonition', tier: 2, cost: L[2], apCost: 1, families: ['mothman'],
    spellType: 'anomaly', type: 'buff', kind: 'buff', range: 4,
    statusEffects: [{ id: 'protect', duration: 1 }],
    statStageBoost: { spd: 1 },
    desc: 'It saw the bridge go. It tells one of you to step back. A Single Ally within 4 tiles gains Protect for a round and +1 SPD stage.' },
  raceHarbinger: { _home: { lib: true }, name: 'Harbinger', tier: 3, cost: L[3], apCost: 1, families: ['mothman'],
    spellType: 'anomaly', type: 'debuff', kind: 'aoe', range: 4, noDamage: true, aoeRadius: 1,
    statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }, { id: 'discord', duration: 2 }],
    desc: 'Everything in the square is on the list. Every enemy in a 3×3 within 4 tiles is Marked and Discorded for 2 rounds.' },

  // ── Poison Abilities ──
  // partial: the aoe kind's leaveTerrain paints the WHOLE area, so "the centre 3×3 stays poisoned" is dropped (see DEFER)
  raceMiasma: { _home: { lib: true }, name: 'Miasma', tier: 4, cost: L[4], apCost: 2, cooldownRounds: 2, families: ['poison'],
    spellType: 'unholy', element: 'poison', type: 'damage', kind: 'aoe', range: 4, dmg: 160, damageType: 'magic',
    aoeRadius: 2,
    statusEffects: [{ id: 'poison', duration: 3 }],
    bonusVsStatus: { status: 'poison', mult: 1.5 },
    desc: 'The air goes green. HEAVY magic damage to a 5x5, Poison on all of it. Deals bonus damage to targets with Poison.' },

  // ── Politics ──
  raceCampaignPromise: { _home: { lib: true }, name: 'Campaign Promise', tier: 2, cost: L[2], apCost: 1, families: ['politics'],
    spellType: 'human', type: 'debuff', kind: 'debuff', range: 4,
    statusEffects: [{ id: 'charm', duration: 1 }],
    desc: 'Look them in the eye and promise everything. A Single Enemy within 4 tiles is Charmed for a round.' },

  // ── Psychedelics ──
  raceDosed: { _home: { lib: true }, name: 'Dosed', tier: 1, cost: L[1], apCost: 1, families: ['psychadelic'],
    spellType: 'anomaly', element: 'psychic', type: 'damage', kind: 'damage', range: 3, dmg: 80, damageType: 'magic',
    statusEffects: [{ id: 'slow', duration: 2 }],
    desc: 'Something in the drink. Their feet stop agreeing with them. Deals WEAK magic damage to a Single Enemy and Slows them for 2 rounds.' },
  raceContactHigh: { _home: { lib: true }, name: 'Contact High', tier: 3, cost: L[3], apCost: 1, families: ['psychadelic'],
    spellType: 'anomaly', element: 'psychic', type: 'buff', kind: 'warCry', range: 0, auraRadius: 2,
    statStageBoost: { int: 1, spd: 1 },
    desc: 'Everyone in the tent is on something. Every ally within 2 tiles gains +1 M ATK and +1 SPD stage.' },
};
const DEFER = [
  ['raceTempest', "partial: 'grounds flyers' dropped — the aoe kind never reads groundsFlyers (only the debuff kind calls forceGroundUnit; _applyAoeDamage's groundAirborne opt is not passed by the aoe branch)"],
  ['raceMantra', "partial: 'cleanse 2 each' dropped — the warCry kind reads teamStatusEffects/statStageBoost but no cleanse"],
  ['raceHallOfMirrors', 'a real zone on a plain area row (zone tick: 60 magic + Blind 1 at each round end for 3 rounds) — §6.5 zoneTickDamage, not in the engine yet'],
  ['raceRejuvenation', 'healAll heals the WHOLE team (no auraRadius) and reads no statusEffects/teamStatusEffects, so the Regen 2 and the r3 aura (the whole point vs Heal All) have no key; needs healAll to read a radius + a team status'],
  ['raceMiasma', "partial: 'the centre 3x3 becomes poison terrain' dropped — aoe leaveTerrain paints the whole 5x5 and paintTerrain is read only by barrage; needs a centre-only terrain key"],
  ['raceShatterLattice', 'prism detonation (every owned prism blasts a 3x3 in the current frequency, then is destroyed) — §6.5 Batch D mechanic'],
];
module.exports = { ADDED, DEFER };
