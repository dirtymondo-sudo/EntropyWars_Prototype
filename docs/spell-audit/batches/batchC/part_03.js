'use strict';
/* Batch C, rows_03 — new spell rows as data (SPELL_FAMILY_AUDIT_PLAN.md §6.3). */
const L = [0, 25, 50, 75, 100];
const ADDED = {
  // ── Psychic Abilities ──
  raceTelekineticSlam: { _home: { lib: true }, name: 'Telekinetic Slam', tier: 3, cost: L[3], apCost: 1, families: ['psychic'],
    spellType: 'alien', element: 'psychic', type: 'damage', kind: 'pull', range: 4,
    dmg: 125, damageType: 'magic', pullDistance: 3, groundsFlyers: true,
    desc: 'Grab them with your mind and drag them the whole way — through whatever is between you. Flyers come down first. Deals MEDIUM magic damage to a Single Enemy and pulls it 3 tiles toward the caster.' },

  // ── Ropework ──
  raceHogtie: { _home: { lib: true }, name: 'Hogtie', tier: 2, cost: L[2], apCost: 1, families: ['ropework'],
    spellType: 'human', type: 'debuff', kind: 'debuff', range: 1,
    statusEffects: [{ id: 'root', duration: 2 }, { id: 'stagger', duration: 1 }],
    desc: 'Hands and feet. Roots an adjacent enemy for 2 rounds and Staggers it for 1 round. No damage.' },

  // ── Sasquatch Abilities ──
  raceTimberStomp: { _home: { lib: true }, name: 'Timber Stomp', tier: 2, cost: L[2], apCost: 1, families: ['sasquatch'],
    spellType: 'anomaly', element: 'earth', type: 'damage', kind: 'aoe', range: 0, aoeRadius: 1, aoeOriginSelf: true,
    dmg: 100, damageType: 'physical', statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'One foot down. Everything adjacent staggers. Deals MEDIUM physical damage to All Enemies around the caster and applies Stagger.' },

  // ── Scarecrow Abilities ──
  raceScareOff: { _home: { lib: true }, name: 'Scare Off', tier: 3, cost: L[3], apCost: 1, families: ['scarecrow'],
    spellType: 'unholy', element: 'shadow', type: 'debuff', kind: 'barrage', range: 0, aoeRadius: 2, aoeOriginSelf: true,
    noDamage: true, statusEffects: [{ id: 'feared', duration: 1 }, { id: 'discord', duration: 2 }],
    desc: 'That is what it is for. Every enemy within 2 tiles is Feared for a round and shaken for two. Applies Feared (1 round) and Discord (2 rounds); no damage.' },

  // ── Shadow ──
  raceConsumingDark: { _home: { lib: true }, name: 'Consuming Dark', tier: 3, cost: L[3], apCost: 1, families: ['shadow'],
    spellType: 'unholy', element: 'shadow', type: 'damage', kind: 'aoe', range: 4, aoeRadius: 1,
    dmg: 125, damageType: 'magic', bonusVsStatus: { status: 'feared', mult: 1.5 },
    desc: 'The dark eats first what is already running. MEDIUM magic damage to a 3×3; Feared targets take it worse.' },

  // ── Street Smarts ──
  raceMeanMug: { _home: { lib: true }, name: 'Mean Mug', tier: 1, cost: L[1], apCost: 1, families: ['streetsmarts'],
    spellType: 'human', type: 'debuff', kind: 'debuff', range: 3,
    statusEffects: [{ id: 'discord', duration: 2 }],
    desc: 'Stare them down until they look away. A Single Enemy within 3 tiles is Discorded for 2 rounds.' },

  // ── Symbiosis ──
  raceTendrilWhip: { _home: { lib: true }, name: 'Tendril Whip', tier: 1, cost: L[1], apCost: 1, families: ['symbiosis'],
    spellType: 'unholy', element: 'poison', type: 'damage', kind: 'damage', range: 2,
    dmg: 90, damageType: 'physical', statusEffects: [{ id: 'poison', duration: 2 }],
    desc: 'The suit lashes out two tiles. The barbs stay in. Deals WEAK physical damage to a Single Enemy within 2 and Poisons it for 2 rounds.' },

  // ── Teamwork ── (partial: the cleanse clause waits, see DEFER)
  raceEverybodyUp: { _home: { lib: true }, name: 'Everybody Up', tier: 4, cost: L[4], apCost: 1, cooldownRounds: 3, families: ['teamwork'],
    spellType: 'human', type: 'buff', kind: 'warCry', range: 0, auraRadius: 2,
    statStageBoost: { atk: 1, def: 1 },
    desc: 'On three. Every ally within 2 tiles gains +1 ATK and +1 DEF stage.' },

  // ── Temporal Abilities ──
  raceStutter: { _home: { lib: true }, name: 'Stutter', tier: 2, cost: L[2], apCost: 1, families: ['temporal'],
    spellType: 'anomaly', type: 'debuff', kind: 'debuff', range: 4,
    statusEffects: [{ id: 'stagger', duration: 1 }, { id: 'slow', duration: 1 }],
    desc: 'They drop a frame. Staggers a Single Enemy for 1 round and Slows it for 1 round.' },

  // ── Trickery ──
  raceMisdirection: { _home: { lib: true }, name: 'Misdirection', tier: 1, cost: L[1], apCost: 1, families: ['trickery'],
    spellType: 'anomaly', type: 'debuff', kind: 'debuff', range: 3,
    statusEffects: [{ id: 'blind', duration: 1 }],
    desc: 'Look — over there. Blinds a Single Enemy within 3 for 1 round: its attacks miss half the time.' },
  raceSuckerPunch: { _home: { lib: true }, name: 'Sucker Punch', tier: 1, cost: L[1], apCost: 1, families: ['trickery'],
    spellType: 'anomaly', type: 'damage', kind: 'damage', range: 1,
    dmg: 100, damageType: 'physical', bonusVsStatus: { status: 'blind', mult: 1.5 },
    desc: 'They never saw it coming. Literally. Deals MEDIUM physical damage to an adjacent enemy. Deals bonus damage to Blinded targets.' },

  // ── Unethical Science ──
  raceVivisection: { _home: { lib: true }, name: 'Vivisection', tier: 1, cost: L[1], apCost: 1, families: ['unethicalscience'],
    spellType: 'tech', element: 'poison', type: 'damage', kind: 'damage', range: 2,
    dmg: 100, damageType: 'magic', statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'For science. Hold still. Deals MEDIUM magic damage to a Single Enemy within 2 and inflicts Grievous Wound for 2 rounds (healing halved).' },

  // ── Werewolf Powers ──
  raceClawSweep: { _home: { lib: true }, name: 'Claw Sweep', tier: 2, cost: L[2], apCost: 1, families: ['werewolf'],
    spellType: 'unholy', type: 'damage', kind: 'aoe', range: 0, aoeRadius: 1, aoeOriginSelf: true,
    dmg: 100, damageType: 'physical', statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'Both arms, every direction. MEDIUM physical damage to everything adjacent, and none of it heals right. Applies Grievous Wound for 2 rounds.' },
  // (partial: the Regen clause waits, see DEFER)
  raceLunarRegeneration: { _home: { lib: true }, name: 'Lunar Regeneration', tier: 3, cost: L[3], apCost: 1, families: ['werewolf'],
    spellType: 'unholy', type: 'heal', kind: 'selfHeal', range: 0,
    selfHealPct: 0.25, cleanse: 1,
    desc: 'The wounds close while you watch. Restores 25% of the caster\'s max HP and cleanses 1 debuff.' },

  // ── Wind Control ──
  raceGale: { _home: { lib: true }, name: 'Gale', tier: 2, cost: L[2], apCost: 1, families: ['wind'],
    spellType: 'anomaly', element: 'wind', type: 'damage', kind: 'linePush', range: 4, lineWidth: 1,
    dmg: 100, damageType: 'magic', pushDistance: 3,
    desc: 'One long breath down the row. MEDIUM magic damage to everything in the line, and all of it three tiles further from you.' },
  // (partial: the +1 MOV clause waits, see DEFER)
  raceUpdraft: { _home: { lib: true }, name: 'Updraft', tier: 2, cost: L[2], apCost: 1, families: ['wind'],
    spellType: 'anomaly', element: 'wind', type: 'utility', kind: 'buff', range: 3,
    statusEffects: [{ id: 'levitating', duration: 2 }],
    desc: 'Give them the sky. One ally is Levitating for 2 rounds — flight and the high-ground bonus.' },

  // ── Winter Warfare ──
  raceGlacialSlam: { _home: { lib: true }, name: 'Glacial Slam', tier: 3, cost: L[3], apCost: 1, families: ['winter'],
    spellType: 'anomaly', element: 'ice', type: 'damage', kind: 'aoe', range: 0, aoeRadius: 1, aoeOriginSelf: true,
    dmg: 125, damageType: 'physical', statusEffects: [{ id: 'slow', duration: 2 }], bonusVsStatus: { status: 'frozen', mult: 1.5 },
    desc: 'Bring both fists down. MEDIUM physical damage to everything around you, all of it Slowed — and anything Frozen shatters.' },

  // ── Witchcraft ──
  raceEvilEye: { _home: { lib: true }, name: 'Evil Eye', tier: 1, cost: L[1], apCost: 1, families: ['witchcraft'],
    spellType: 'unholy', element: 'shadow', type: 'damage', kind: 'damage', range: 4,
    dmg: 80, damageType: 'magic', statusEffects: [{ id: 'hexed', duration: 2 }],
    desc: 'One look is enough. Deals WEAK magic damage and Hexes the target for 2 rounds.' },

  // ── Zombie Behavior ──
  raceGrab: { _home: { lib: true }, name: 'Grab', tier: 1, cost: L[1], apCost: 1, families: ['zombie'],
    spellType: 'unholy', type: 'damage', kind: 'damage', range: 1,
    dmg: 80, damageType: 'physical', statusEffects: [{ id: 'root', duration: 1 }],
    desc: 'The hands do not let go. Deals WEAK physical damage and Roots the target for a round.' },
};

const DEFER = [
  ['raceRescueLine', 'the pull kind only takes an enemy (isAllyUnit rejects allies) and never cleanses: an ally haul + cleanse 1 needs engine work.'],
  ['raceRoundUp', 'aoePull: a noDamage area skips the pull (_applyAoeDamage continue), the inward pull is a fixed 1 tile (no 2-tile distance key), and there is no self-origin pull: needs engine work.'],
  ['raceTagIn', 'the swap kind rejects allies (isAllyUnit ⇒ "Invalid target for swap"); a row-level allyOnly is not read by any code (Miracle carries it dead): needs an ally swap.'],
  ['raceEverybodyUp', 'partial: the "cleansed of every debuff" clause — the warCry branch reads no cleanse key; shipped as ATK +1 / DEF +1 only.'],
  ['raceSwipe', 'buff steal (§6.5): damage kind has purgeBuffs (strip) and stealSpell (spells), but nothing moves the stripped buffs onto the caster.'],
  ['raceDeathtrap', 'placeTrap trapdoor spring hits only the triggering victim and hard-codes Stagger 1 (_springTrap); damage + fall to everyone inside and Rooted 2 need engine work.'],
  ['raceLunarRegeneration', 'partial: the Regen 2 rounds clause — the selfHeal branch reads no statusEffects; shipped as heal 25% + cleanse 1.'],
  ['raceUpdraft', 'partial: the +1 MOV for 2 rounds flat bonus — the buff branch reads no flat statBonus key (only statusEffects / statStageBoost / cleanse); shipped as Levitating 2.'],
  ['raceSnowFort', 'snow_wall terrain (§6.5): no snow_wall terrain type and no timed melt on terrainCreate.'],
];

module.exports = { ADDED, DEFER };
