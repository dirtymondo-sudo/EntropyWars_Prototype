'use strict';
const L = [0, 25, 50, 75, 100];
const ADDED = {
  // ── Ancient Knowledge ──
  raceSandstoneTomb: { _home: { lib: true }, name: 'Sandstone Tomb', tier: 3, cost: L[3], apCost: 1, families: ['ancientknowledge'],
    spellType: 'divine', element: 'earth', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 125, range: 4,
    statusEffects: [{ id: 'root', duration: 2 }],
    desc: 'The sand closes over them, and the sand remembers. Deals MEDIUM magic damage to a Single Enemy and Roots them for 2 rounds.' },

  // ── Animal Handling ──
  raceHawk: { _home: { lib: true }, name: 'Hawk', tier: 1, cost: L[1], apCost: 1, families: ['animalhandling'],
    spellType: 'human', element: 'nature', type: 'utility', kind: 'summonUnit', range: 1, maxActivePerCaster: 1,
    summonDef: { key: 'hawk', name: 'Hawk', move: 6, dmg: 35, hits: 2, reveals: 2 },
    desc: 'Two fingers on the glove. At the end of every round it dives 6 tiles at the nearest enemy for 35; anything hidden within 2 tiles of it is spotted. Two hits to bring it down.' },
  raceWolfPack: { _home: { lib: true }, name: 'Wolf Pack', tier: 2, cost: L[2], apCost: 1, families: ['animalhandling'],
    spellType: 'human', element: 'nature', type: 'utility', kind: 'summonUnit', range: 1, maxActivePerCaster: 2,
    summonDef: { key: 'wolf', name: 'Wolf', move: 4, dmg: 45, hits: 2 },
    desc: 'Never one. At the end of every round each wolf runs 4 tiles at the nearest enemy and bites for 45. Two per handler. Calls a Wolf to an adjacent tile; two hits to put one down.' },
  raceCrackTheWhip: { _home: { lib: true }, name: 'Crack the Whip', tier: 3, cost: L[3], apCost: 1, families: ['animalhandling'],
    spellType: 'human', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 125, range: 2,
    statusEffects: [{ id: 'feared', duration: 1 }],
    desc: 'The whip cracks — or the spirit roars — and they run. Deals MEDIUM magic damage to a Single Enemy and Fears them for a round: on its next activation it can only flee.' },
  raceElephant: { _home: { lib: true }, name: 'Elephant', tier: 4, cost: L[4], apCost: 1, families: ['animalhandling'],
    spellType: 'human', element: 'nature', type: 'utility', kind: 'summonUnit', range: 1, maxActivePerCaster: 1,
    summonDef: { key: 'elephant', name: 'Elephant', move: 3, dmg: 110, hits: 6 },
    desc: "The big top's biggest act. Walks 3, hits for 110, takes six hits to put down. One per handler. Calls an Elephant to an adjacent tile; at the end of every round it walks toward the nearest enemy and strikes." },

  // ── Apex Predator ──
  raceDeathRoll: { _home: { lib: true }, name: 'Death Roll', tier: 2, cost: L[2], apCost: 1, families: ['apexpredator'],
    spellType: 'anomaly', type: 'damage', kind: 'damage', damageType: 'physical', dmg: 100, range: 1,
    statusEffects: [{ id: 'root', duration: 2 }],
    desc: 'Clamp and spin. MEDIUM physical damage, and the prey is not going anywhere. Roots a Single Enemy for 2 rounds.' },

  // ── Arachnid Powers ──
  raceCocoon: { _home: { lib: true }, name: 'Cocoon', tier: 4, cost: L[4], apCost: 1, families: ['arachnid'],
    spellType: 'alien', element: 'arcane', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 170, range: 4,
    statusEffects: [{ id: 'silence', duration: 1 }],
    bonusVsStatus: { status: 'root', mult: 1.5 },
    desc: 'The silk closes over the mouth first. HEAVY arcane damage; a Rooted target is wrapped tight and takes half again. Silences a Single Enemy for a round.' },

  // ── Arcane Magic (partial: see DEFER) ──
  raceAnnihilation: { _home: { lib: true }, name: 'Annihilation', tier: 4, cost: L[4], apCost: 1, cooldownRounds: 2, families: ['arcane'],
    spellType: 'unholy', element: 'arcane', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 180, range: 4,
    purgeBuffs: true,
    desc: 'Unmake it. Deals HEAVY magic damage to a Single Enemy and strips every buff they carry. Cooldown: 2 rounds.' },

  // ── Astral Projection ──
  raceSpiritGuide: { _home: { lib: true }, name: 'Spirit Guide', tier: 3, cost: L[3], apCost: 1, families: ['astralprojection'],
    spellType: 'anomaly', element: 'psychic', type: 'utility', kind: 'buff', range: 4,
    statusEffects: [{ id: 'invisible', duration: 1 }, { id: 'levitating', duration: 2 }],
    desc: 'Take my hand. They cannot see what is not here. An ally is Invisible for a round and Levitating for 2 rounds.' },

  // ── Athleticism ──
  raceShakeItOff: { _home: { lib: true }, name: 'Shake It Off', tier: 2, cost: L[2], apCost: 1, cooldownRounds: 2, families: ['athleticism'],
    spellType: 'human', type: 'heal', kind: 'selfHeal', range: 0, selfHealPct: 0.25, cleanse: 2,
    desc: "Walk it off. Restores 25% of the caster's max HP and cleanses 2 debuffs. Cooldown: 2 rounds." },

  // ── Beast Abilities ──
  raceMaul: { _home: { lib: true }, name: 'Maul', tier: 2, cost: L[2], apCost: 1, families: ['beastabilities'],
    spellType: 'human', type: 'damage', kind: 'damage', damageType: 'physical', dmg: 110, range: 1,
    statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'Jaws lock and shake. MEDIUM physical damage and a wound that will not close. A Single Enemy takes a Grievous Wound for 2 rounds — healing on them is halved.' },

  // ── Black Magic ──
  raceNeedleWork: { _home: { lib: true }, name: 'Needle Work', tier: 3, cost: L[3], apCost: 1, families: ['blackmagic'],
    spellType: 'anomaly', element: 'shadow', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 125, range: 4,
    ignoreArmor: true,
    bonusVsStatus: { status: 'voodoo', mult: 1.5 },
    desc: 'Push the pin in. Deals MEDIUM magic damage to a Single Enemy that ignores M DEF; a Voodoo-bound target takes it worse.' },

  // ── Blood Magic ──
  raceHemorrhage: { _home: { lib: true }, name: 'Hemorrhage', tier: 2, cost: L[2], apCost: 1, families: ['blood'],
    spellType: 'unholy', element: 'blood', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 100, range: 3,
    statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'Open the vein. MEDIUM magic damage and a wound that will not close — healing on them is halved. The Grievous Wound lasts 2 rounds.' },
  raceExsanguinate: { _home: { lib: true }, name: 'Exsanguinate', tier: 4, cost: L[4], apCost: 2, cooldownRounds: 2, families: ['blood'],
    spellType: 'unholy', element: 'blood', type: 'damage', kind: 'lifeDrain', damageType: 'magic', dmg: 180, range: 3,
    drainPct: 1.0,
    bonusVsStatus: { status: 'grievous', mult: 1.5 },
    desc: 'Take all of it. HEAVY magic damage to a Single Enemy and every point of it comes back to you. Deals bonus damage to targets with a Grievous Wound.' },

  // ── Cephalopod Anatomy ──
  raceConstrict: { _home: { lib: true }, name: 'Constrict', tier: 2, cost: L[2], apCost: 1, families: ['tentacleappendages'],
    spellType: 'anomaly', element: 'water', type: 'debuff', kind: 'debuff', range: 2,
    statusEffects: [{ id: 'root', duration: 2 }],
    statStageBoost: { def: -1 },
    desc: 'Two arms, then four. It is not going anywhere. Roots a Single Enemy for 2 rounds and lowers its DEF by 1 stage.' },
  raceEightfoldLash: { _home: { lib: true }, name: 'Eightfold Lash', tier: 3, cost: L[3], apCost: 1, families: ['tentacleappendages'],
    spellType: 'anomaly', element: 'water', type: 'damage', kind: 'multiHit', damageType: 'magic', range: 2,
    hitDamages: [32, 32, 32, 32],
    bonusVsStatus: { status: 'root', mult: 1.5 },
    desc: 'All of them at once. Deals WEAK magic damage to a Single Enemy across 4 hits. Deals bonus damage to Rooted targets.' },

  // ── Chemistry ──
  raceAcidFlask: { _home: { lib: true }, name: 'Acid Flask', tier: 1, cost: L[1], apCost: 1, families: ['chemistry'],
    spellType: 'tech', element: 'poison', type: 'damage', kind: 'damage', damageType: 'magic', dmg: 100, range: 3,
    statStageBoost: { def: -1 },
    desc: 'It eats the plate first. Deals MEDIUM magic damage to a Single Enemy and lowers its DEF by 1 stage.' },
  raceAntidote: { _home: { lib: true }, name: 'Antidote', tier: 2, cost: L[2], apCost: 1, families: ['chemistry'],
    spellType: 'tech', type: 'heal', kind: 'heal', range: 3, healAmt: 140, cleanse: 2,
    desc: 'Drink it before it stops fizzing. Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.' },
  raceChainReaction: { _home: { lib: true }, name: 'Chain Reaction', tier: 4, cost: L[4], apCost: 1, cooldownRounds: 2, families: ['chemistry'],
    spellType: 'tech', element: 'fire', type: 'damage', kind: 'aoe', damageType: 'magic', dmg: 140, range: 4, aoeRadius: 2,
    bonusVsStatus: { status: ['burn', 'poison'], mult: 1.5 },
    desc: 'One spark. The whole table goes. Deals HEAVY magic damage to every enemy in a 5×5 area. Deals bonus damage to targets with Burn or Poison.' },

  // ── Christmas Spirit (partial: see DEFER) ──
  raceMilkAndCookies: { _home: { lib: true }, name: 'Milk and Cookies', tier: 3, cost: L[3], apCost: 1, families: ['christmasspirit'],
    spellType: 'divine', type: 'heal', kind: 'healAll', range: 0, healAmt: 100, cleanse: 1,
    desc: "Left out for whoever's still standing. Restores a MEDIUM amount of HP to All Allies and cleanses 1 debuff from each." },

  // ── Computer Hacking Skills (partial: see DEFER) ──
  raceSystemCrash: { _home: { lib: true }, name: 'System Crash', tier: 4, cost: L[4], apCost: 1, cooldownRounds: 2, families: ['computerhacking'],
    spellType: 'tech', type: 'damage', kind: 'aoe', damageType: 'magic', dmg: 150, range: 4, aoeRadius: 1,
    bonusVsStatus: { status: 'jammed', mult: 1.5 },
    desc: 'Fatal exception. Deals HEAVY magic damage to every enemy in a 3×3 area. Deals bonus damage to targets with Jammed.' },

  // ── Cowboy Skills ──
  raceSlapLeather: { _home: { lib: true }, name: 'Slap Leather', tier: 3, cost: L[3], apCost: 1, families: ['cowboyskills'],
    spellType: 'human', element: 'metal', type: 'damage', kind: 'damage', damageType: 'physical', dmg: 125, range: 4,
    statusEffects: [{ id: 'stagger', duration: 1 }],
    actedTargetBonus: 30,
    desc: "Hand hovers, then it doesn't. MEDIUM physical damage to a Single Enemy — they flinch and lose an AP. Hits harder on anyone who already made their move." },

  // ── Cryptid Abilities ──
  raceEyewitness: { _home: { lib: true }, name: 'Eyewitness', tier: 3, cost: L[3], apCost: 1, families: ['cryptid'],
    spellType: 'anomaly', type: 'debuff', kind: 'aoe', noDamage: true, range: 4, aoeRadius: 1,
    statusEffects: [{ id: 'feared', duration: 1 }, { id: 'blind', duration: 2 }],
    desc: 'They will describe it badly for the rest of their lives. Every enemy in a 3×3 within 4 tiles is Feared for a round and Blinded for 2 rounds.' },
};
const DEFER = [
  ['raceBumperCrop', 'seeds on a rim (§6.5): the seeds on every empty rim tile that sprout into trees are the point of the row (the tree-team flagship); no aoe kind plants seeds on the rim.'],
  ['raceAnnihilation', 'partial: purgeBuffs strips buff statuses only and after the hit (as Terror Pounce); shields and stat stages are not stripped and nothing is stripped before the damage lands. Dropped "every ward / every stage ... and then" from the desc.'],
  ['raceMilkAndCookies', 'partial: "allies within 2 tiles" dropped. healAll reaches the whole team and no kind heals + cleanses allies in a caster radius (warCry reads auraRadius but does not heal). Shipped as a team-wide healAll; element none (there is no christmas element).'],
  ['raceSystemCrash', 'partial: statusIfTargetHas (§6.5) — "every Jammed enemy hit is also Staggered 1" dropped from the row and the desc.'],
];
module.exports = { ADDED, DEFER };
