'use strict';
const L = [0, 25, 50, 75, 100];
const ADDED = {
  // Cryptid Abilities — Terror Pounce's charge shape (damage + chargeToTarget), T4 at 1 AP.
  raceOutOfTheDark: { _home: { lib: true }, name: 'Out of the Dark', tier: 4, cost: L[4], apCost: 1, families: ['cryptid'],
    spellType: 'anomaly', type: 'damage', kind: 'damage', range: 3, dmg: 180, damageType: 'physical',
    chargeToTarget: true, bonusVsStatus: { status: 'feared', mult: 1.5 },
    desc: 'One clear look. That was the last photo on the roll. Charges up to 3 tiles and deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Feared targets.' },

  // D.O.O.R. Training — Air Mail's door-shot damage row (doorGun travel).
  raceDoorSlam: { _home: { lib: true }, name: 'Door Slam', tier: 3, cost: L[3], apCost: 1, families: ['door'],
    spellType: 'anomaly', element: 'psychic', type: 'damage', kind: 'damage', range: 4, dmg: 130, damageType: 'physical',
    doorGun: true, bonusVsStatus: { status: 'stagger', mult: 1.5 },
    desc: 'Mind your fingers. Shoot a door onto a Single Enemy within 4 tiles and slam it on them for MEDIUM physical damage. Deals bonus damage to Staggered targets.' },

  // Deep Sea Anatomy
  raceSpout: { _home: { lib: true }, name: 'Spout', tier: 1, cost: L[1], apCost: 1, families: ['deepsea'],
    spellType: 'anomaly', element: 'water', type: 'damage', kind: 'damage', range: 3, dmg: 80, damageType: 'magic',
    statusEffects: [{ id: 'wet', duration: 2 }],
    desc: 'A jet of seawater from the gills. WEAK water damage and the target is soaked through.' },

  // Deep State Connections — Red Eyes / Predictive Model shape.
  raceSurveillance: { _home: { lib: true }, name: 'Surveillance', tier: 1, cost: L[1], apCost: 1, families: ['deepstate'],
    spellType: 'human', type: 'debuff', kind: 'debuff', range: 6,
    statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }],
    desc: 'We have had a file on you for years. A Single Enemy within 6 tiles is Marked for 2 rounds: they cannot hide, and the next physical hit any ally lands deals +40.' },

  // Desert Acclimation — Dimensional Web / White Christmas zone shape.
  raceQuicksand: { _home: { lib: true }, name: 'Quicksand', tier: 3, cost: L[3], apCost: 1, families: ['desertacclimation'],
    spellType: 'alien', element: 'earth', type: 'utility', kind: 'zoneDebuff', range: 4, aoeRadius: 1, zoneDuration: 2,
    statusEffects: [{ id: 'root', duration: 1 }, { id: 'slow', duration: 1 }],
    desc: 'The ground is fine until it is not. Turns a 3×3 to quicksand for 2 rounds: enemies inside are Rooted and Slowed.' },
  raceSimoom: { _home: { lib: true }, name: 'Simoom', tier: 4, cost: L[4], apCost: 1, families: ['desertacclimation'],
    spellType: 'alien', element: 'wind', type: 'damage', kind: 'aoe', range: 4, aoeRadius: 1, dmg: 160, damageType: 'magic',
    statusEffects: [{ id: 'blind', duration: 1 }],
    desc: 'The hot wind that kills. HEAVY magic damage to everything in the square, and nobody sees where it came from. Applies Blind to All Enemies in the 3×3.' },

  // Dragon Abilities — the heal kind at range 0 (self-cast; allyOnly + range 0): healPct + statusEffects are both read
  // there, where selfHeal reads neither statusEffects nor Regen.
  raceEmberHeart: { _home: { lib: true }, name: 'Ember Heart', tier: 2, cost: L[2], apCost: 1, families: ['dragonabilities'],
    spellType: 'unholy', element: 'fire', type: 'heal', kind: 'heal', range: 0, healPct: 0.2,
    statusEffects: [{ id: 'regen', duration: 2 }],
    desc: 'The furnace inside never goes out. Restores 20% of the caster\'s max HP and gives them Regen for 2 rounds.' },

  // Fallen Angelic Powers — Terror Pounce's purgeBuffs on a ranged damage row.
  raceBrokenHalo: { _home: { lib: true }, name: 'Broken Halo', tier: 3, cost: L[3], apCost: 1, families: ['fallenangel'],
    spellType: 'unholy', element: 'shadow', type: 'damage', kind: 'damage', range: 4, dmg: 130, damageType: 'magic',
    purgeBuffs: true, bonusVsStatus: { status: 'burn', mult: 1.5 },
    desc: 'What is left of the halo, thrown like a discus. Deals MEDIUM magic damage and strips every buff the target carries; Burning targets take it worse.' },

  // Feline Anatomy — Carrion Feast / Self-Repair Protocol shape.
  raceCatNap: { _home: { lib: true }, name: 'Cat Nap', tier: 3, cost: L[3], apCost: 1, families: ['feline'],
    spellType: 'anomaly', type: 'heal', kind: 'selfHeal', range: 0, selfHealPct: 0.3, cleanse: 99,
    desc: 'Twenty minutes. Good as new. Restores 30% of the caster\'s max HP and removes every debuff.' },

  // Fire Magic
  raceCombust: { _home: { lib: true }, name: 'Combust', tier: 2, cost: L[2], apCost: 1, families: ['fire'],
    spellType: 'unholy', element: 'fire', type: 'damage', kind: 'damage', range: 4, dmg: 130, damageType: 'magic',
    bonusVsStatus: { status: 'burn', mult: 1.5 },
    desc: 'Feed the fire what it wants. MEDIUM magic damage — a Burning target goes up like tinder.' },

  // Fractal Pattern Recognition — Taser's shape.
  raceStrangeLoop: { _home: { lib: true }, name: 'Strange Loop', tier: 2, cost: L[2], apCost: 1, cooldownRounds: 2, families: ['fractal'],
    spellType: 'alien', element: 'arcane', type: 'damage', kind: 'damage', range: 4, dmg: 70, damageType: 'magic',
    statusEffects: [{ id: 'stun', duration: 1 }],
    desc: 'The pattern closes on itself. They cannot find the way out. Deals WEAK magic damage to a Single Enemy within 4 tiles and Stuns them for a round.' },

  // Galactic Federation Protocol
  racePleiadianTouch: { _home: { lib: true }, name: 'Pleiadian Touch', tier: 1, cost: L[1], apCost: 1, families: ['galacticfederation'],
    spellType: 'alien', element: 'light', type: 'heal', kind: 'heal', range: 3, healAmt: 130, cleanse: 1,
    desc: 'A hand on the shoulder. The wound remembers being whole. Heals an ally a BIG amount and removes one debuff.' },

  // Gambling
  raceStackedDeck: { _home: { lib: true }, name: 'Stacked Deck', tier: 2, cost: L[2], apCost: 1, families: ['gambling'],
    spellType: 'anomaly', type: 'debuff', kind: 'debuff', range: 4,
    statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }], statStageBoost: { def: -1 },
    desc: 'You have been reading their tell all night. A Single Enemy within 4 tiles is Marked for 2 rounds (the next physical hit on them deals +40) and loses 1 DEF stage.' },
  raceJackpot: { _home: { lib: true }, name: 'Jackpot', tier: 4, cost: L[4], apCost: 1, families: ['gambling'],
    spellType: 'anomaly', element: 'arcane', type: 'damage', kind: 'aoe', range: 3, aoeRadius: 1, dmg: 160, damageType: 'magic',
    statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'The machine pays out. All of it. On their heads. Deals HEAVY magic damage to All Enemies in a 3×3 and Staggers them.' },

  // Giant Abilities — PARTIAL (see DEFER): a plain dash, the path enemies take the damage.
  raceGiantStride: { _home: { lib: true }, name: 'Giant Stride', tier: 2, cost: L[2], apCost: 1, families: ['titan'],
    spellType: 'alien', type: 'damage', kind: 'dash', range: 4, dmg: 60, damageType: 'physical',
    desc: 'Four of your steps. One of his. Stride up to 4 tiles in a line; every enemy on the path takes WEAK physical damage.' },

  // Hidden Technology
  raceBlueBeam: { _home: { lib: true }, name: 'Blue Beam', tier: 3, cost: L[3], apCost: 1, families: ['advancedtechnology'],
    spellType: 'tech', element: 'light', type: 'damage', kind: 'aoe', range: 5, aoeRadius: 1, dmg: 125, damageType: 'magic',
    statusEffects: [{ id: 'discord', duration: 1 }],
    desc: 'Holograms in the sky. Half of them panic; the other half kneel. Deals MEDIUM magic damage to All Enemies in a 3×3 and applies Discord.' },

  // Horns & Hooves — Earthen Grasp's pull shape.
  raceHornHook: { _home: { lib: true }, name: 'Horn Hook', tier: 3, cost: L[3], apCost: 1, families: ['horns'],
    spellType: 'human', type: 'damage', kind: 'pull', range: 3, dmg: 110, damageType: 'physical', pullDistance: 2,
    statusEffects: [{ id: 'root', duration: 1 }],
    desc: 'Hooked on the horns and dragged home. MEDIUM physical damage; they end the turn where the hooves are. Pulls the target 2 tiles toward the caster and Roots it.' },

  // Horseback Riding — Prophecy Fulfilled's self buff (overclock + cleanse).
  raceSaddleUp: { _home: { lib: true }, name: 'Saddle Up', tier: 2, cost: L[2], apCost: 1, cooldownRounds: 3, families: ['horsebackriding'],
    spellType: 'human', type: 'buff', kind: 'buff', range: 0, cleanse: 2,
    statusEffects: [{ id: 'overclock', duration: 2 }],
    desc: 'Mount up. The caster is Overclocked for 2 rounds (+1 ATK stage, +1 MOV) and cleansed of up to 2 debuffs.' },
  // Rampage / Ice Slide dash shape: dmg to the enemy on the landing tile, dashDamage to every enemy passed.
  raceRideBy: { _home: { lib: true }, name: 'Ride-By', tier: 3, cost: L[3], apCost: 1, families: ['horsebackriding'],
    spellType: 'human', type: 'damage', kind: 'dash', range: 4, dmg: 110, dashDamage: 55, damageType: 'physical',
    desc: 'Don\'t stop. Ride up to 4 tiles in a line: MEDIUM physical damage to the enemy at the end of the ride, and WEAK physical damage to every enemy passed.' },
  // Sky Tackle's shape (kind tackle): the only kind that reads charge + pushDistance + collisionBonus together.
  raceLance: { _home: { lib: true }, name: 'Lance', tier: 4, cost: L[4], apCost: 1, families: ['horsebackriding'],
    spellType: 'human', type: 'damage', kind: 'tackle', range: 5, dmg: 170, damageType: 'physical',
    chargeToTarget: true, pushDistance: 2, collisionBonus: 40,
    desc: 'Couched and level. Charges a Single Enemy up to 5 tiles away and drives it up to 2 tiles along the line. Deals HEAVY physical damage; crashing into a wall or another unit deals 40 more.' },

  // Hunting Skills — Trapdoor's placeTrap plumbing, trapType 'spike' (the engine's WEAK hit + Root 2 trap), 1 tile.
  raceSnare: { _home: { lib: true }, name: 'Snare', tier: 1, cost: L[1], apCost: 1, families: ['huntingskills'],
    spellType: 'human', element: 'nature', type: 'utility', kind: 'placeTrap', range: 3, dmg: 40, damageType: 'physical',
    trapType: 'spike', trapSize: 1, maxActivePerCaster: 2,
    desc: 'A loop of wire where the game walks. The first thing that steps in it is not going anywhere for 2 rounds. Hides a snare on an empty tile within 3; the enemy cannot see it. The first enemy to step on it takes WEAK physical damage and is Rooted for 2 rounds. Two snares per caster.' },

  // Ice Magic — Frozen Punch's finisher on a ranged magic row.
  raceShatter: { _home: { lib: true }, name: 'Shatter', tier: 1, cost: L[1], apCost: 1, families: ['ice'],
    spellType: 'anomaly', element: 'ice', type: 'damage', kind: 'damage', range: 4, dmg: 100, damageType: 'magic',
    bonusVsStatus: { status: 'frozen', mult: 1.5 },
    desc: 'Tap the ice and watch it go. MEDIUM magic damage — a Frozen target takes it through every crack.' },
};
const DEFER = [
  ['gunShutDoor', 'doorDeploy reads DOOR_GUN_DOORS[spell.door] and there is no "shut" standing door (no act, blocks move + LoS, the owner may open it) — needs a new DOOR_GUN_DOORS entry + its open/shut behaviour on a standing door, not a spell-row key'],
  ['gunTwinDoors', 'deployPair (placeDoorPair) puts one mouth on the CASTER\'s tile, not two picks within 4, and doorStepThrough only fires when a unit ENDS A WALK on the door — knocked / blown / pulled bodies never transit; needs a two-pick pair + a transit hook on forced moves'],
  ['raceLandOnYourFeet', '§6.5 Batch D: a no-damage leap that ignores elevation (there is no leap kind), plus no-fall-damage and the +1 DEF rider'],
  ['raceGiantStride', 'partial: "enemies ADJACENT to the path take 60" — the dash kind only hits enemies ON the path tiles (shipped that way, desc says "on the path"); "ignoring elevation" dropped from the desc (a dash only checks the landing tile)'],
];
module.exports = { ADDED, DEFER };
