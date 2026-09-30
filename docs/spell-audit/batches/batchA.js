// SPELL FAMILY AUDIT — Batch A + A2 (front §9): row edits on live fields, dead-field deletions,
// deletions of rows nobody rungs, and the Q1 one-T4 folds. Built by hand from front §6.2.
// Tier changes also write the ladder cost (the engine now prices every row by its tier).
'use strict';
const L = [0, 25, 50, 75, 100];
const M = {};
const T = (t) => ({ tier: t, cost: L[t] });
const put = (id, o) => { M[id] = Object.assign(M[id] || {}, o); };
const DEL = [];
const DEFER = [];   // [id, batch, what]
const d = (id, b, what) => DEFER.push([id, b, what]);

/* ── Agriculture ── */
d('passiveGreenThumb', 'B', 'MOVE → Agriculture');
put('healingSeed', { desc: 'Plants a seed beside an ally: allies within 1 tile heal every turn for 3 rounds, then it sprouts into a tree.' });
put('poisonSeed', { desc: 'Plants a seed: enemies within 1 tile are Poisoned every turn for 3 rounds, then it sprouts into a tree.' });
put('leechSeed', Object.assign(T(3), { desc: 'Plants a seed on a Single Enemy: for 3 rounds it drains HP from the target each turn and heals the caster.' }));

/* ── Alien Weapons ── */
put('raceStunRay', Object.assign(T(2), { cooldownRounds: 2 }));
d('raceGravityBoots', 'B', 'MOVE → Alien Weapons (Astronaut Camp deleted)');
put('racePlasmaWhip', { kind: 'line', lineWidth: 1, range: 3,
    desc: 'The whip cracks down the lane. Deals MEDIUM physical damage to All Enemies in a line up to 3 tiles long and sets them alight. It reaches further than it should and burns where it lands.' });

/* ── Ancient Knowledge ── */
put('raceZigguratProtocol', { dmg: 60 });
put('raceAncientMagic', Object.assign(T(3), { dmg: 135, statusEffects: [{ id: 'silence', duration: 1 }],
    desc: 'Words older than the pyramids. Deals MEDIUM magic damage to a Single Enemy and Silences them for a round.' }));
d('raceWeighTheHeart', 'D', 'wire executeBonusPct (×1.5 under 50% HP), 180→160, drop the Stagger finisher');

/* ── Apex Predator ── */
d('racePrimalRoar', 'B', 'MERGE into Apex Roar (rung dinosaur#1)');
d('raceDinoTailWhip', 'B', 'MOVE → Apex Predator');
put('raceApexCharge', Object.assign(T(3), { dashDamage: 50,
    desc: 'Stampedes through the battlefield and ends up behind the target. Deals MEDIUM physical damage to the target and tramples every enemy on the path. Applies Stagger.' }));
d('raceApexCharge', 'D', 'Stagger on every enemy along the dash path (only the target is Staggered today)');
put('raceApexRoar', T(2));
d('raceApexRoar', 'B+D', 'the merged roar: Discord 2 on enemies within 2 on top of the ally ATK +1');
put('raceJurassicJaw', { dmg: 160 });

/* ── Arachnid ── */
put('raceWebLaunch', { damageType: 'magic', element: 'arcane', desc: 'A thread of void-silk. Deals WEAK arcane damage to a Single Enemy and Roots them for a round.' });
put('raceDimensionalWeb', { statusEffects: [{ id: 'root', duration: 1 }],
    desc: 'Weave a web between dimensions over a 3×3 for 2 rounds. Enemies standing in it are Rooted. Whatever stands in it cannot leave.' });

/* ── Arcane ── */
put('raceArcaneBlast', { dmg: 80, crossRadius: 2 });
put('racePolymorph', { apCost: 1, statStageBoost: { atk: -1 }, statusEffects: [{ id: 'silence', duration: 2 }],
    desc: 'Something small and harmless. Ribbit. The target is Silenced for 2 rounds and its ATK drops by 1 stage.' });
put('raceWishGranted', Object.assign(T(2), { element: 'arcane', statStageBoost: { atk: 1, int: 1 },
    desc: 'Your wish is granted. Raises a Single Ally\'s ATK and M ATK by 1 stage and cleanses 2 debuffs.' }));

/* ── Archery ── */
d('racePoisonArrow', 'B/C', 'UPGRADE → Venom Coat (rung robinhood#1; needs the addStatus patch key)');
put('raceBombArrow', { dmg: 90, statusEffects: [{ id: 'burn', duration: 1 }],
    desc: 'An arrow with a powder charge lashed to the head. Deals WEAK physical damage to All Enemies in a 3×3 and sets them alight for a round.' });
DEL.push('sentaiGreenArrow');
put('raceArrowRain', { ignoresLineOfSight: true,
    desc: 'Loose high and let gravity do the rest. HEAVY physical damage to every enemy in a 3×3 up to 6 tiles away. The arrows come down over any wall.' });

/* ── Artificial Intelligence ── */
put('racePredictiveModel', { statStageBoost: { mdef: -1 } });
put('raceOvercalculate', { statStageBoost: { int: 1, mdef: 1 }, desc: 'Run the numbers again. Then again. Raises the caster\'s M ATK and M DEF by 1 stage.' });
put('raceRecursiveLoop', { range: 4, bonusVsDebuffed: null, bonusVsStatus: { status: 'marked', mult: 1.5 },
    desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to Marked targets.' });

/* ── Athleticism ── */
put('raceNimbleDodge', { cooldownRounds: 2, teleportDistance: 3 });
put('rampage', { dmg: 170, statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'Charges through the battlefield. Deals HEAVY physical damage to the target and hits every enemy on the path. Applies Stagger.' });
d('raceUnstoppableCharge', 'B', 'MERGE into Rampage (rung juggernaut#4)');

/* ── Beast Abilities ── */
put('racePounce', { dmg: 100 });
DEL.push('racePredatorLeap');
d('raceAmbushLunge', 'B', 'DELETE (rung sharkman#3)');

/* ── Bible Study ── */
put('raceCultSermon', Object.assign(T(2), { element: 'light', spellType: 'divine',
    desc: 'Gather round. Allies within 2 tiles are Blessed for 2 rounds. They have heard the word.' }));
put('raceAbsolution', Object.assign(T(1), { desc: 'Restores a MEDIUM amount of HP to a Single Ally and cleanses every debuff.' }));
put('raceBlessing', T(1));
put('racePrayer', { shield: 200, statusEffects: [{ id: 'blessed', duration: 2 }],
    desc: 'Shields a Single Ally for 200 HP and Blesses them for 2 rounds.' });
put('exorcism', Object.assign(T(3), { dmg: 135 }));
d('raceHallelujah', 'D', 'healBonusVsStatus: Blessed allies healed ×1.5');

/* ── Black Magic ── */
put('raceDeathPact', { statStageBoost: { atk: 2 }, selfDamagePct: 0.25, cooldownRounds: 3,
    desc: 'Sign here. Raises the caster\'s ATK by 2 stages. Costs 25% of max HP (never fatal).' });
put('raceSacrifice', T(2));
put('raceVoodoo', T(2));
put('raceBaphometsRite', { apCost: 1, bonusVsStatus: { status: ['stagger', 'voodoo'], mult: 1.5 } });

/* ── Blood Magic ── */
put('sharedSummonBloodRain', Object.assign(T(2), { apCost: 1,
    desc: 'Summons Blood Rain for 3 to 5 rounds. Everyone in the downpour is soaked; Divine units are burned each turn, Unholy units heal HP and MP.' }));
put('raceBloodRitual', Object.assign(T(1), { cooldownRounds: 2, element: 'blood' }));
d('raceBloodRitual', 'B', 'goatman rung 3 → Life Sap');
put('lifeDrain', { element: 'blood', bonusVsStatus: { status: ['poison', 'grievous'], mult: 1.5 } });

/* ── Bone Density ── */
put('raceReassemble', { kind: 'escape', teleportDistance: 3, selfHealPct: 0.2,
    desc: 'The bones come apart and put themselves back together somewhere else. Teleports up to 3 tiles and restores 20% of max HP.' });

/* ── Cephalopod Anatomy ── */
put('raceTentacleLash', { damageType: 'magic', element: 'water',
    desc: 'An arm from below the surface. Deals WEAK water damage to a Single Enemy and drags them 2 tiles toward you.' });
d('raceInkCloud', 'B', 'MOVE → Cephalopod Anatomy');

/* ── Chemistry ── */
put('raceOvercharge', { dmg: 125 });

/* ── Christmas Spirit ── */
put('raceSleighDash', { element: 'ice' });
put('raceNaughtyList', Object.assign(T(2), { element: 'shadow', statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }],
    desc: 'You know what you did. The target is on the list: Marked for 3 rounds and its ATK drops by 1 stage.' }));
put('raceBlizzardPresent', { statusEffects: [{ id: 'frozen', duration: 1 }], bonusVsStatus: { status: 'marked', mult: 1.5 } });

/* ── Computer Hacking ── */
d('passiveFieldOperative', 'B', 'MOVE → Computer Hacking');
d('raceMemoryLeak', 'D', 'mpDrain: the target loses 30 MP');
put('raceSystemAnalysis', { statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }], statStageBoost: { mdef: -1 },
    desc: 'Every port open, every weakness listed. Marks a Single Enemy for 2 rounds and lowers its M DEF by 1 stage.' });
put('raceBlueScreen', { apCost: 1, cooldownRounds: 2, range: 4, dmg: 80, damageType: 'magic',
    desc: 'Fatal exception. Deals WEAK magic damage to a Single Enemy and Stuns them for a round.' });
put('raceFirewallProtocol', { apCost: 1, shieldHp: 150 });
d('raceNeuralHack', 'B', 'DELETE (rung android#3)');

/* ── Conspiracy Knowledge ── */
put('raceTinFoilHat', { kind: 'warCry', auraRadius: 2, range: 0,
    desc: 'Hats on, everybody. Every ally within 2 tiles gains +1 M DEF stage.' });
put('raceFluorideWater', { dmg: 105 });

/* ── Cosmic ── */
put('raceEntropicBeam', { dmg: 90, statStageBoost: null });
put('raceCosmicSight', { range: 4 });
put('racePhaseWalk', T(1));
put('raceCosmicSlam', { apCost: 1, selfCenter: null });
put('sharedNebula', { aoeRadius: 1, dmg: 125, apCost: 1,
    desc: 'Birth a star and let it burn. Deals MEDIUM magic damage to All Enemies in a 3×3; everything the starfire touches keeps burning.' });
put('sharedBlackHole', { cost: 100 });
put('raceHeatDeath', Object.assign(T(3), { apCost: 1, dmg: 135, zoneDuration: null }));
d('raceHeatDeath', 'D', 'the real zone: 70 to every enemy inside at the end of each round for 2 rounds (zone-tick key); A2 folds it to a plain T3 135 3×3 + Slow until then');
put('raceStarDecree', Object.assign(T(3), { dmg: 135 }));
put('raceSupernova', Object.assign(T(3), { apCost: 1, dmg: 135 }));

/* ── Cowboy Skills ── */
put('raceFanTheHammer', Object.assign(T(1), { kind: 'barrage', aoeOriginSelf: true, aoeRadius: 1, range: 0, dmg: 80,
    desc: 'Six shots from the hip. Deals WEAK physical damage to every enemy next to you.' }));
put('raceHighNoon', { apCost: 1, guaranteedCrit: null });

/* ── Cryptid ── */
put('raceDreadAura', { noDamage: true, desc: 'Everything nearby feels it watching. All enemies within 2 tiles are Discorded for 2 rounds.' });
d('raceRealityShift', 'B', 'DELETE Blurry Photo (rung bigfoot#2)');
put('raceCryptidVanish', T(2));

/* ── Cult of Personality ── */
put('raceCultTithe', T(1));
d('raceCultTithe', 'B', 'MOVE → Cult of Personality');
put('raceCultIndoctrinate', { bonusVsStatus: { status: 'charm', mult: 2 } });

/* ── D.O.O.R. Training ── */
put('raceDoorDash', T(2));

/* ── Deep Sea ── */
put('raceDepthCharge', { bonusVsStatus: { status: 'wet', mult: 1.5 },
    desc: 'It goes off under the surface. Deals MEDIUM physical damage to All Enemies in a 3×3. Anything soaked takes the shock through its body: bonus damage to Soaked targets.' });
d('raceDepthCharge', 'D', 'the Wet finisher should read "standing in water" too (_unitIsSoaked)');
put('racePoseidonsWrath', { cost: 100 });

/* ── Deep State ── */
put('raceBlackBudget', { statusEffects: [{ id: 'overclock', duration: 2 }],
    desc: 'Money that was never appropriated. Overclocks a Single Ally for 2 rounds: +1 ATK stage and +1 MOV (tech units also +1 RNG).' });
put('raceBrainwash', { kind: 'possess', activations: 1, cooldownRounds: 3, statusEffects: [{ id: 'possessed', duration: 2 }],
    desc: 'Everyone has something, and we have it. A Single Enemy within 3 tiles takes its next activation under your orders. Bosses cannot be brainwashed.' });
d('raceBrainwash', 'D', 'the Discord 2 left behind when the possession wears off');

/* ── Demonic ── */
d('raceInnerDemon', 'B', 'DELETE (rung halfdemon#1)');
d('raceSoulBind', 'D', 'the 45% clause keyed to Contract');
put('raceVoidContract', { apCost: 1 });
put('raceDemonicClaw', Object.assign(T(3), { dmg: 135, statusEffects: null, bonusVsStatus: { status: ['contract', 'soulBound'], mult: 1.5 },
    desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets under a Contract or Soul Bound.' }));

/* ── Dirty Fighting ── */
put('raceBodyCheck', { statusEffects: [{ id: 'stagger', duration: 1 }], bonusVsStatus: null,
    desc: 'Deals MEDIUM physical damage to a Single Enemy and shoves them 2 tiles. Applies Stagger.' });
put('raceStompOut', { dmg: 100, bonusVsStatus: { status: 'stagger', mult: 1.5 } });
put('raceDarkJustice', { bonusVsDebuffed: null, bonusVsStatus: { status: ['grievous', 'silence'], mult: 1.5 },
    desc: 'Charges in and deals MEDIUM physical damage to a Single Enemy. Bonus damage to the Wounded or the Silenced.' });
put('ironGrip', { dmg: 80, damageType: 'physical',
    desc: 'The grab that also hurts. Deals WEAK physical damage to a Single Enemy and Roots them for 2 rounds. Knocks flying targets out of the sky.' });
put('raceBrutalSlam', { dmg: 110, statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'Deals MEDIUM physical damage to All Enemies around the caster and leaves them Grievously Wounded: healing is halved.' });
put('raceNoMercy', { executeBonusPct: null, executeBelowPct: 0.25,
    desc: 'Deals SEVERE physical damage to a Single Enemy. Executes a target below 25% HP outright. Deals bonus damage to Staggered targets.' });

/* ── Dragon ── */
put('raceDragonfear', { kind: 'aoe', noDamage: true, range: 4, aoeRadius: 1, aoeOriginSelf: null,
    statusEffects: [{ id: 'feared', duration: 1 }, { id: 'burn', duration: 1 }],
    desc: 'Ancient terror, roared down from above. Every enemy in a 3×3 is Feared and set alight. They run, and they run burning.' });
put('raceDragonToss', { desc: 'Grabs the target, carries it skyward and hurls it up to 3 tiles. The grab itself is light; the fall and any crash into another unit do the damage. Deals bonus damage to Burning targets.' });
put('raceDragonfire', { statusEffects: [{ id: 'burn', duration: 3 }], bonusVsStatus: { status: 'burn', mult: 1.5 } });

/* ── Dream Predation ── */
d('raceNightmarePulse', 'D', 'aoeLifeDrain 25%, targeted 3×3 at rng 3, psychic, Stun finisher (whole rewrite waits for the area drain)');
put('raceSleepParalysis', Object.assign(T(2), { dmg: 60, statusEffects: [{ id: 'stun', duration: 1 }], cooldownRounds: 2,
    desc: 'Deals WEAK magic damage to a Single Enemy. It cannot move or act: Stunned for a round.' }));

/* ── Driving ── */
put('raceTransform', { desc: 'Stand up into the combat platform: −3 SPD, +1 DEF and +2 M DEF stages, +2 RNG. Or fold back down.' });
put('raceNitroBoost', { statusEffects: [{ id: 'overclock', duration: 2 }],
    desc: 'Floor it. The caster is Overclocked for 2 rounds (+1 ATK stage, +1 MOV) and gains +1 SPD stage.' });
put('raceMissileBarrage', { kind: 'dash', range: 4, dmg: 160, dashDamage: 160, apCost: 1, aoeRadius: null,
    desc: 'It was an accident. Four times. Drives through every enemy in the lane for HEAVY physical damage. Deals bonus damage to Discorded targets.' });

/* ── Earth ── */
put('sharedFissure', T(2));
put('raceTremorStomp', { dmg: 80 });
put('groundSlam', { selfCenter: null });
put('rampart', T(2));
put('raceStoneDrop', Object.assign(T(3), { dmg: 125 }));

/* ── Engineering ── */
d('passiveTinker', 'B', 'MOVE → Engineering');
put('deployTurret', { turretHp: 80 });
d('raceClockworkTurret', 'B', 'DELETE (rung gnome#3)');
put('raceOvertinker', { apCost: 1, cooldownRounds: 2 });

/* ── Eyesight ── */
put('raceHypnoticPulse', { kind: 'aoe', noDamage: true, aoeRadius: 1,
    desc: 'Everything that looks back stops. Every enemy in a 3×3 is Stunned for a round.' });

/* ── Fae ── */
d('racePixieDust', 'B', 'DELETE (rungs fairy#2, mushroom girl#2)');
put('raceGlitterBomb', { dmg: 120 });
put('raceFaeRing', { bonusVsStatus: { status: 'blind', mult: 1.5 } });

/* ── Fallen Angel ── */
put('raceFallenGrace', { dmg: 80 });
put('raceAbyssalWings', { kind: 'escape', teleportDistance: 4,
    desc: 'Spread the black wings. Fly up to 4 tiles and land under Protect for a round.' });
put('raceDescendingWrath', Object.assign(T(3), { apCost: 1, dmg: 135 }));
put('raceWrathOfTheWatchers', { dmg: 160, bonusVsStatus: { status: 'burn', mult: 1.5 } });

/* ── Feline ── */
put('raceMeow', T(1));
put('raceNinefoldScratch', { hitDamages: [20, 20, 20, 20, 20, 20, 20, 20, 20], desc: 'Nine lives, nine scratches. Deals SEVERE physical damage to a Single Enemy across 9 hits.' });

/* ── Fire ── */
put('fire1', { dmg: 100, statusEffects: [{ id: 'burn', duration: 2 }], desc: 'A fist of fire. Deals MEDIUM magic damage to a Single Enemy; the target keeps burning.' });
d('sharedScorchedEarth', 'B', 'DELETE (rungs demon prince#3, overlord#3)');
put('wallOfFire', { range: 4 });

/* ── Football ── */
DEL.push('raceEndZoneDance');
put('raceBlitz', { dmg: 110 });
put('raceAudible', { teamStatusEffects: [{ id: 'overclock', duration: 1 }], statStageBoost: null, auraRadius: 2, aoeRadius: null,
    desc: 'Check with me. Every ally within 2 tiles is Overclocked for a round: +1 ATK stage and +1 MOV (tech allies also +1 RNG).' });
put('raceSpikeTheBall', T(1));

/* ── Fortune Telling ── */
d('raceStarCrossed', 'B', 'MOVE → Fortune Telling');
put('raceTarotDraw', T(2));
put('raceSpiritChannel', { name: 'Séance', desc: 'Call on the departed. Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.' });

/* ── Fractal ── */
put('raceDimensionalFold', { range: 3 });
put('raceFractalNeedle', { desc: 'Deals HEAVY magic damage to one enemy; the needle splits and seeks up to two more within 2 tiles for half. Bonus damage to Stunned targets.' });

/* ── Galactic Federation ── */
put('raceFederationBeacon', T(2));
put('raceStasisBeam', { dmg: 80, damageType: 'magic', cooldownRounds: 2,
    desc: 'Held in the light. Held. Deals WEAK magic damage to a Single Enemy and Stuns them for a round. Knocks flying targets out of the sky.' });
put('raceNordicAccord', { kind: 'warCry', auraRadius: 99, heal: null,
    desc: 'The accord is signed. Every ally on the field gains +1 M ATK and +1 M DEF stage.' });

/* ── Gear ── */
put('gearEchoBand', { tier: 2 });
put('gearJetpack', { tier: 2 });
put('gearMartyrsTalisman', { tier: 2 });
put('gearSignalFlare', { desc: 'One use: thrown up to 8 tiles into the fog, it reveals a diamond 6 tiles out from where it lands. The flare is spent.' });

/* ── Giant ── */
d('raceStoneThrow', 'B', 'MOVE → Giant Abilities');
d('raceThickHide', 'B', 'MOVE → Giant Abilities');
put('raceTitanStep', Object.assign(T(2), { kind: 'barrage', noDamage: true, aoeOriginSelf: true, aoeRadius: 2, dmg: null,
    statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }, { id: 'stagger', duration: 1 }], terrainDeform: null,
    desc: 'Fee. Fi. Fo. Fum. Every enemy within 2 tiles is Marked for 2 rounds and Staggered. He knows where you are, and the floor knows it too.' }));
put('raceColossalCrush', Object.assign(T(3), { apCost: 1, dmg: 135 }));
put('raceGiantSmash', { apCost: 2 });

/* ── Grave Hunger ── */
put('raceFrenzy', Object.assign(T(2), { dmg: 110 }));
d('raceCarrionFeast', 'D', 'corpse-gated feed + respawn delay');

/* ── Great Ape ── */
d('raceSeismicLeap', 'B', 'MOVE → Great Ape');
put('raceApeFury', { name: 'Go Ape', statStageBoost: { atk: 2 }, selfDamagePct: 0.1,
    desc: 'Raises the caster\'s ATK by 2 stages. Costs 10% of max HP (never fatal).' });
put('racePrimalSmash', { bonusVsStatus: { status: 'stagger', mult: 1.5 } });

/* ── Gun Training ── */
put('doubleShot', { markedSecondHitBonus: null, desc: 'Two barrels, no waiting. Deals MEDIUM physical damage to a Single Enemy across 2 hits.' });
DEL.push('riderImpactRound', 'ricochet1');
d('riderScatterShot', 'D', 'the random extra victims ignore line of sight');
put('crossfire', { range: 4, crossRadius: 1, aoeOriginSelf: null,
    desc: 'Two shooters\' worth of lead on one crossing. Deals MEDIUM physical damage to every enemy on the X around the target.' });
put('deadEye', Object.assign(T(3), { dmg: 135, guaranteedCrit: null, statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 60 }],
    desc: 'Deals MEDIUM physical damage to a Single Enemy and Marks them for 3 rounds: the next hit on them lands 60 harder.' }));

/* ── Healing Magic ── */
put('heal1', T(2));

/* ── Heavenly Duties ── */
d('raceDivineLight', 'D', 'heal the ally AND 70 to every enemy adjacent to it');
put('racePurify', T(2));
d('radiantBolt', 'B', 'DELETE (rung angel#1)');
put('raceRapture', Object.assign(T(2), { apCost: 1, statusEffects: [{ id: 'protect', duration: 1 }, { id: 'levitating', duration: 2 }],
    desc: 'The ally is lifted: Protect for a round and Levitating for 2 (flight and the high-ground bonus).' }));
put('raceWingsOfMercy', { desc: 'Swap places with an ally within 4 tiles.' });
d('raceWingsOfMercy', 'D', 'wire healOnSwap (100) and restore the heal-on-arrival text');
put('raceDivineJudgment', Object.assign(T(3), { apCost: 1, dmg: 125 }));
d('raceDivineJudgment', 'B', 'MOVE → Heavenly Duties');
put('raceSanctuary', { healPerTurn: 90, zoneDuration: 3 });
put('raceDivineSmite', { apCost: 1 });

/* ── Hidden Technology ── */
put('freeEnergy', Object.assign(T(2), { mpRestore: 40, desc: 'Restores 40 MP to All Allies.' }));
put('raceTeslaTrap', { blastDmg: 80 });
put('raceClassifiedWeapon', Object.assign(T(3), { dmg: 135 }));

/* ── Holy Defense ── */
d('raceShieldMaiden', 'D', 'self DEF +1 and Taunt 1 on every enemy within 2 (one cast, two targets)');
put('raceDivineSwoop', { statusEffects: [{ id: 'stagger', duration: 1 }] });
put('raceChooserOfSlain', { revivePct: 0.6, reviveHpPct: null });

/* ── Horns & Hooves ── */
d('raceHornToss', 'D', 'a throw in a direction the caster picks');
d('raceCliffCharge', 'B', 'DELETE (rungs goatman#2, krampus#2)');
put('raceLabyrinthRoar', { noDamage: true, statusEffects: [{ id: 'discord', duration: 2 }, { id: 'taunt', duration: 1 }],
    desc: 'The walls throw the bellow back from every direction. Every enemy within 2 tiles is Discorded and Taunted: they lose their heads and come for the horns.' });
put('raceBullRush', { dashDamage: 60 });

/* ── Horseback Riding ── */
put('guardSlash', { range: 4 });

/* ── Human Grit ── */
put('raceElbowGrease', { dmg: 100 });
d('improvise', 'B', 'DELETE (rung homosapien#1)');
put('raceAdrenalineRush', { selfHealPct: 0.4 });
put('raceUnderdogSpirit', { statStageBoost: { atk: 2 }, cleanse: 1,
    desc: 'Nobody believed in you. Good. Raises the caster\'s ATK by 2 stages and cleanses a debuff.' });
put('raceIndomitableWill', { apCost: 1 });

/* ── Hunting ── */
DEL.push('raceForestAmbush');
put('camouflage', { statStageBoost: { atk: 1 },
    desc: 'Go still in the brush. Invisible for a round, and the next shot comes from ambush: +1 ATK stage.' });

/* ── Ice ── */
d('raceIceShard', 'B', 'DELETE (rung yeti#1)');
put('raceIceSpear', { range: 4 });
put('sharedSummonBlizzard', Object.assign(T(2), { apCost: 1 }));
put('raceIceSlide', { dmg: 130 });
put('raceDiamondDust', { apCost: 1 });

/* ── Infernal Court ── */
d('raceHellfireCrown', 'D', 'stageHigherOf: +1 to whichever of ATK / M ATK is higher, CD 2');
put('raceInfernalConscription', { kind: 'pull', dmg: 60, damageType: 'magic', pullDistance: 3, range: 4, lineOfSight: true,
    statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'Report for duty. Deals WEAK magic damage to a Single Enemy, drags them 3 tiles toward the caster and Staggers them.' });
put('raceInfernalDecree', { apCost: 1, dmg: 100 });
put('raceKissOfDecay', { range: 3, dmg: 125, statusEffects: [{ id: 'poison', duration: 3 }] });
put('raceCataclysmDecree', { apCost: 1 });
put('raceDarkDominion', Object.assign(T(3), { dmg: 135, bonusVsStatus: { status: ['burn', 'stagger'], mult: 1.5 } }));
put('raceDarkLullaby', Object.assign(T(3), { dmg: 125 }));

/* ── Insectoid ── */
put('raceVenomFang', { bonusVsStatus: { status: 'poison', mult: 1.5 },
    desc: 'Deals MEDIUM physical damage to a Single Enemy and Poisons them. A second bite on an envenomed target finds the vein.' });
d('raceChitinArmor', 'B', 'PASSIVE (rungs mantid#2, bee queen#2)');
put('raceTunnelNetwork', { range: 4,
    desc: 'Dig a tunnel: one mouth beside you, one where you point (within 4). An ally standing at either mouth attacks and casts as if it stood at the other. One tunnel per caster; three hits collapse both mouths.' });
put('raceSwarmSignal', { auraRadius: 2, aoeRadius: null, desc: 'The signal goes out. Raises ATK by 2 stages for every ally within 2 tiles.' });
d('raceSwarmSignal', 'D', '+1 MOV for 2 rounds on top of the ATK');

/* ── Jellyfish ── */
put('raceJellySting', { dmg: 90, bonusVsStatus: { status: 'wet', mult: 1.5 },
    desc: 'A tentacle brushes past. Deals WEAK water damage and Poisons the target. The venom runs faster through soaked skin: bonus damage to Soaked targets.' });
put('raceJellyBloom', { dmg: 100 });
d('raceJellyDrift', 'B', 'MOVE → Jellyfish');
put('raceJellyNet', { dmg: 125 });

/* ── Kaiju ── */
put('raceCataclysmStomp', T(2));
put('raceAtomicBreath', { element: 'fire', damageType: 'physical' });

/* ── Ki ── */
put('raceKiBlast', { damageType: 'physical', hitDamages: [33, 33, 34] });
d('raceKiCharge', 'D', 'a 96-point ki barrier on a self buff (buff rows cannot grant a shield yet)');
put('raceKiWave', { damageType: 'physical', dmg: 110, apCost: 1 });

/* ── Knighthood ── */
put('raceOathOfValor', { statStageBoost: { atk: 1, def: 1 }, desc: 'Every ally within 2 tiles gains +1 ATK and +1 DEF stage.' });
put('raceCrusade', { damageType: 'physical', aoeOriginSelf: true, range: 0, apCost: 1,
    desc: 'Deus vult. Deals HEAVY physical damage to All Enemies in an X around the knight, and bonus damage to Unholy targets.' });

/* ── Light ── */
put('raceAuroraRay', { dmg: 80 });
put('raceSmite', { range: 4, bonusVsUnholy: null, unholyBonus: 40,
    desc: 'Deals MEDIUM magic damage to a Single Enemy, and bonus damage to Unholy targets.' });
put('raceLuminousShield', Object.assign(T(3), { aoeRadius: 1 }));
put('racePrismBurst', { element: 'light' });
put('judgment', Object.assign(T(3), { dmg: 135, cooldownRounds: 2, damageType: 'magic' }));
put('raceMerkaba', { apCost: 1 });

/* ── Lightning ── */
put('thunderstorm', { desc: 'Summons a thunderstorm for 3 to 4 rounds. It hunts the nearest unit, soaks everyone under it and strikes with lightning (deadly to the wet). −5 DEF in the eye.' });
put('thunder1', { range: 4, chainProfile: null, chainRadius: null,
    desc: 'One bolt, one target. Deals MEDIUM magic damage to a Single Enemy. Soaked targets take half again.' });

/* ── Living Stone ── */
d('raceGothicRampart', 'B', 'DELETE (rung gargoyle#2)');

/* ── Machinery ── */
put('raceHydraulicPunch', { name: 'Hydraulic Punch' });
d('raceHydraulicPunch', 'B', 'MOVE → Machinery');
put('raceHydraulicCrush', { bonusVsStatus: { status: ['jammed', 'stagger'], mult: 1.5 } });

/* ── Main Character ── */
put('raceDarkFeather', { apCost: 1, statusEffects: [{ id: 'stagger', duration: 1 }],
    desc: 'One black feather falls. Then he is already there. Deals MEDIUM physical damage to a Single Enemy and Staggers them.' });
d('raceSadBackstory', 'D', 'stageIfBelowPct: ATK +2 instead of +1 under 50% HP');
put('racePlotArmor', { cooldownRounds: 3, statStageBoost: null, statusEffects: [{ id: 'indomitable', duration: 1 }],
    desc: 'The hero cannot die yet. The next killing blow leaves the caster at 1 HP instead.' });
put('raceProphecyFulfilled', { apCost: 1, cooldownRounds: 2, cleanse: 99, statusEffects: [{ id: 'overclock', duration: 2 }],
    desc: 'It was written. Everything written before it is struck out. The caster is Overclocked for 2 rounds and cleansed of every debuff.' });
put('raceToBeContinued', { requireVision: true });
put('raceBlessedBlade', Object.assign(T(3), { dmg: 135 }));
d('raceBlessedBlade', 'B', 'MOVE → Main Character Energy');

/* ── Marksmanship ── */
put('raceQuickDraw', Object.assign(T(2), { dmg: 110,
    desc: 'Shoulder the long rifle. Deals MEDIUM physical damage to a Single Enemy up to 5 tiles away.' }));
d('raceQuickDraw', 'B', 'MOVE Long Rifle → Marksmanship');
put('headshot', { bonusVsStatus: { status: ['stun', 'root'], mult: 1.5 } });

/* ── Martial Arts ── */
put('raceFlurryOfBlows', { hitDamages: [25, 25, 25, 25] });
put('haymaker', { displaceDistance: 1, bonusVsStatus: { status: 'stagger', mult: 1.5 } });
DEL.push('reallyGoodPunch');
put('raceDragonFist', { bonusVsStatus: { status: 'stun', mult: 1.5 } });

/* ── Mech Pilot ── */
put('raceMortarSalvo', { dmg: 80 });
d('raceSiegeMode', 'D', '+1 ATK, +2 RNG, −2 MOV for 3 rounds (a lock-down status)');
put('raceEject', { cleanse: 99, selfHealPct: 0.2,
    desc: 'Punch out. The pilot escapes up to 3 tiles, sheds every debuff and the frame restores 20% of max HP.' });

/* ── Meditation ── */
put('cleanse', { name: 'Inner Peace', statStageBoost: { mdef: 1 },
    desc: 'Removes every debuff from a Single Ally and raises their M DEF by 1 stage.' });

/* ── Military ── */
put('raceRallyCommand', { apCost: 1 });
put('raceIronBulwark', { kind: 'warCry', auraRadius: 2, statStageBoost: { def: 1, mdef: 1 },
    desc: 'Shields up. Every ally within 2 tiles gains +1 DEF and +1 M DEF stage.' });
put('raceArtilleryStrike', { kind: 'aoe', delayTurns: null, ignoresLineOfSight: true, dmg: 125, apCost: 1,
    desc: 'Fire mission, danger close. Deals MEDIUM physical damage to every enemy in a 3×3 up to 6 tiles away, over any cover. Leaves scorched ground and a crater.' });
put('shieldBash', { kind: 'aoeShield', aoeOriginSelf: true, aoeRadius: 2, shieldHp: 160, heal: null, statStageBoost: null,
    desc: 'Iron Dome up. Every ally within 2 tiles gets a 160-point shield.' });
put('raceRangefinder', T(2));

/* ── Mothman ── */
put('raceProphecyOfDisaster', { dmg: 160 });

/* ── Nature ── */
put('raceHerbalRemedy', { desc: 'Restores a BIG amount of HP to a Single Ally and cleanses 2 debuffs.' });
put('raceTreelineRetreat', { name: 'Into the Green', desc: 'Step back into the undergrowth. Teleport up to 3 tiles and Regen for 2 rounds.' });
put('trunkThrow', T(2));
d('raceBoneBarrage', 'B', 'MOVE → Necromancy');

/* ── Ooze ── */
put('raceMitosisSplit', { kind: 'summonUnit', element: 'poison', range: 1, statusEffects: null, maxActivePerCaster: 1,
    summonDef: { key: 'blob', name: 'Blob', move: 3, dmg: 70, hits: 4, armored: true },
    desc: 'Two of it now. Containment will want to know. Splits off a Blob that fights beside you.' });
d('raceMitosisSplit', 'D', 'the Blob\'s ooze trail (summonDef.trailTerrain)');

/* ── Piracy ── */
put('racePlunder', { dmg: 100 });
put('raceWalkThePlank', { apCost: 1 });
put('raceCannonball', { dmg: 160 });

/* ── Poison ── */
put('raceSplash', Object.assign(T(2), { apCost: 1 }));

/* ── Police ── */
put('racePoliceCuffs', { dmg: 100, statusEffects: [{ id: 'root', duration: 2 }, { id: 'stagger', duration: 1 }],
    desc: 'Hands behind your back. Deals MEDIUM physical damage to an adjacent enemy, Roots them for 2 rounds and Staggers them.' });
put('racePoliceLockdown', { dmg: 150, statusEffects: [{ id: 'root', duration: 1 }, { id: 'slow', duration: 2 }],
    desc: 'Nobody in, nobody out. Deals HEAVY physical damage to every enemy in a 3×3 within 3 tiles; they are Rooted for a round and Slowed for 2.' });

/* ── Politics ── */
put('raceExecutiveOrder', { kind: 'aoe', noDamage: true, aoeRadius: 1, apCost: 1, cooldownRounds: 2,
    desc: 'Signed, sealed, effective immediately. Every enemy in a 3×3 within 4 tiles is Stunned for a round.' });
put('sharedNuke', { name: 'Nuclear Option', dmg: 180, delayTurns: 2,
    desc: 'The football is open. Mark the grid; two rounds later there is no grid. SEVERE magic damage to everything in a 5×5, buildings included.' });
d('sharedNuke', 'B', 'MOVE → Politics; general and mech rung 4 → Fire for Effect');

/* ── Poltergeist ── */
put('raceColdSpot', { desc: 'Opens a cold spot over a 3×3 for 2 rounds. Enemies inside are Frozen.' });

/* ── Psychedelics ── */
put('raceAyahuascaRetreat', { desc: 'The caster restores 50% of max HP, cleanses every debuff and raises M DEF by 1 stage.' });
d('raceAyahuascaRetreat', 'B', 'MOVE → Psychedelics');
put('raceBadTrip', Object.assign(T(3), { dmg: 125 }));

/* ── Psychic ── */
put('racePsychicBeam', { range: 4, dmg: 80 });
put('racePsychicBarrier', { kind: 'shield', shield: 200, desc: 'Shields a Single Ally for 200 HP.' });
put('psychosis', { statusEffects: [{ id: 'discord', duration: 2 }],
    desc: 'Two voices, then four, then all of them. A Single Enemy is Discorded for 2 rounds and its M DEF drops by 1 stage.' });
put('teleport', { desc: 'Warp any unit (self, ally or enemy) to any unoccupied tile within range. Third Eye trims its cost.' });
put('raceMindCrush', Object.assign(T(3), { dmg: 135 }));
put('mindShatter', { kind: 'aoe', aoeRadius: 1, dmg: 160,
    desc: 'Deals HEAVY magic damage to All Enemies in a 3×3 and Silences them. Deals bonus damage to Silenced targets.' });

/* ── Robotic Hardware ── */
put('raceSelfRepairProtocol', { selfHealPct: 0.45, cleanse: 2 });
d('raceRoboPunch', 'B', 'MERGE into Hydraulic Crush (rung honda civic#3)');
put('raceChassisSlam', Object.assign(T(3), { apCost: 1, cooldownRounds: 2, dmg: 125, statusEffects: [{ id: 'stagger', duration: 1 }] }));

/* ── Robotic Weapons ── */
put('raceTaserBolt', { dmg: 70, statusEffects: [{ id: 'jammed', duration: 1 }], bonusVsStatus: null,
    desc: 'Two prongs into the housing. Systems stutter. Deals WEAK magic damage to a Single Enemy and Jams it for a round.' });
put('racePlasmaCannon', { dmg: 125 });
put('raceRocketToss', { requiresFlight: null });

/* ── Ropework ── */
d('raceGrapple', 'D', 'self-pull to a wall, door or ally');

/* ── Sasquatch ── */
put('raceBigKick', { dmg: 100, pushDistance: 2, desc: 'Deals MEDIUM physical damage to a Single Enemy and kicks them 2 tiles back.' });
put('raceSasquatchSmash', { apCost: 1 });

/* ── Scarecrow ── */
d('raceStuffedDouble', 'D', 'a decoy that taunts, and Fear when it breaks');
put('raceCrowStorm', { element: 'shadow' });

/* ── Seduction ── */
put('raceLoveBite', { dmg: 100 });
put('raceSoulSuck', { statusEffects: null, drainPct: 0.5, bonusVsStatus: { status: 'charm', mult: 1.5 },
    desc: 'Kiss them and take what they came with. Deals MEDIUM magic damage to a Single Enemy and heals the caster for half. Deals bonus damage to Charmed targets.' });
put('raceCharm', { cooldownRounds: 2, statusEffects: [{ id: 'charm', duration: 2 }] });
put('raceEnthrall', { cooldownRounds: 3 });
put('raceDrainingEmbrace', { apCost: 1, range: 2 });

/* ── Sentai ── */
put('sentaiBlueWave', Object.assign(T(3), { dmg: 125 }));
put('sentaiPinkHeal', T(1));
put('sentaiYellowThunder', { dmg: 100 });

/* ── Shadow ── */
put('raceShadowBind', { element: 'shadow' });
DEL.push('raceGrimResolve');
put('raceShadowInfiltration', { apCost: 1, dmg: 110, statusEffects: null,
    desc: 'Dashes in and deals MEDIUM physical damage to a Single Enemy.' });
d('raceShadowInfiltration', 'D', 'the caster turns Invisible 1 after the hit (hit and fade)');
put('racePhaseShift', Object.assign(T(2), { statusEffects: [{ id: 'invisible', duration: 2 }] }));
put('raceShadowStep', T(2));
put('voidRush', Object.assign(T(3), { dmg: 135, element: 'shadow', bonusVsStatus: { status: 'feared', mult: 1.5 } }));

/* ── Sonic ── */
put('raceSirenSong', { element: 'sonic' });
put('raceSonicBoomerang', { dmg: 50 });
put('raceSonicBreaker', { dmg: 100 });
put('warCry', Object.assign(T(3), { name: 'Anthem', desc: 'Every ally within 3 tiles sings along: +2 ATK stages. The singer takes +1.' }));
put('lullaby', Object.assign(T(2), { dmg: 110, statusEffects: [{ id: 'stun', duration: 1 }],
    desc: 'Hush. Deals MEDIUM magic damage to a Single Enemy and it sleeps through its next activation (Stun).' }));
put('raceResonancePulse', { dmg: 125 });
put('requiem', { apCost: 2, aoeRadius: 3 });

/* ── Spy Gear ── */
put('knifeThrow', { equipReq: null,
    desc: 'A knife from the sleeve. Deals MEDIUM physical damage to a Single Enemy within 4 and Marks them: the next physical hit any ally lands deals +24.' });
put('raceEMPGrenade', T(3));
put('poisonDart', Object.assign(T(2), { range: 4, dmg: 110 }));
put('sneakSlash', { equipReq: null });

/* ── Stage Presence ── */
put('provoke', { name: 'Call Out' });
d('provoke', 'B', 'MOVE → Stage Presence');
put('racePopStageDive', { dmg: 100 });
put('racePopSpotlight', { statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }],
    desc: 'The team\'s focus-fire call. Lowers a Single Enemy\'s DEF and M DEF by 1 stage and Marks them for 2 rounds.' });
put('raceSpaceDisco', Object.assign(T(3), { name: 'Crowd Surge', kind: 'aoePull', cooldownRounds: null, element: 'sonic', dmg: 110,
    pullToCenter: true, statusEffects: [{ id: 'stagger', duration: 1 }], bonusVsStatus: null,
    desc: 'The crowd rushes the stage, and the stage is you. Deals MEDIUM magic damage to every enemy within 2 tiles, drags them 1 tile toward the caster and Staggers them.' }));
put('racePopStadiumShow', { dmg: 150, cooldownRounds: 3, bonusVsStatus: { status: 'stagger', mult: 1.5 } });

/* ── Street Smarts ── */
put('raceDriveBy', { dashDamage: 40 });
d('raceDriveBy', 'D', 'Stagger 1 on every enemy on the dash path');
put('raceChoppa', { dmg: 125 });

/* ── Superhero ── */
put('raceHeroicLeap', { bonusVsStatus: { status: 'frozen', mult: 1.5 } });
put('raceFreezeBreath', { dmg: 60 });
put('raceInvulnerable', { apCost: 1 });
put('raceShockwaveClap', { statusEffects: [{ id: 'stagger', duration: 1 }] });

/* ── Swordsmanship ── */
put('crossSlash', { statusEffects: [{ id: 'grievous', duration: 2 }], bonusVsStatus: null,
    desc: 'The X-cut that will not close. Deals MEDIUM physical damage to a Single Enemy and leaves it Grievously Wounded: healing is halved.' });
put('dragonSlash', { bonusVsStatus: { status: 'grievous', mult: 1.5 } });

/* ── Symbiosis ── */
d('raceSymbioteArmor', 'B', 'PASSIVE (rung symbiote#2)');
put('raceSymbioticDrain', { damageType: 'physical', desc: 'The tendrils drink from the wound. Deals MEDIUM physical damage to a Single Enemy and heals the caster for part of it. Deals bonus damage to Poisoned targets.' });

/* ── Teamwork ── */
put('jackOfAll', Object.assign(T(3), { range: 3, desc: 'Pep talk. A Single Ally gains +1 ATK, DEF, M ATK and M DEF, +1 MOV and +1 RNG for 3 turns.' }));
put('sentaiTeamStrike', { apCost: 1 });
d('sentaiTeamStrike', 'D', 'bonusHitsPerAdjacentAlly');

/* ── Temporal ── */
put('raceJudgmentBeam', { apCost: 1, dmg: 90, statStageBoost: null, statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'The Watcher decides how long a second lasts. Deals WEAK magic damage to All Enemies in a line and Slows them.' });
put('raceTemporalShift', Object.assign(T(2), { range: 4 }));
put('raceRealityPulse', Object.assign(T(3), { dmg: 135, statusEffects: [{ id: 'discord', duration: 2 }] }));
put('raceTimeRewind', { name: 'Paradox', dmg: 180, bonusVsStatus: { status: ['slow', 'stagger'], mult: 1.5 },
    desc: 'You were never standing there. Deals SEVERE magic damage to a Single Enemy, then replays the last blow it dealt against it. Deals bonus damage to Slowed or Staggered targets.' });

/* ── Thievery ── */
put('raceHitALick', Object.assign(T(1), { name: 'Stick-Up' }));
d('raceHitALick', 'B', 'MOVE → Thievery');
d('raceStealFromRich', 'D', 'selfStageBoost: the caster takes the ATK stage');

/* ── Training ── */
put('passiveAdaptable', { tier: 2 });
put('passiveCrescendo', { hooks: { buffTurnsBonus: 1 }, desc: 'Buffs this unit applies last +1 turn.' });
put('passiveWarpath', { tier: 2 });

/* ── Trap Making ── */
put('raceLucidTrap', Object.assign(T(1), { name: 'Spring Snare',
    desc: 'Clockwork jaws under the leaves. Hides a snare on a tile; the first enemy to step on it is Stunned for a round.' }));
d('raceTinkersContraption', 'B', 'DELETE (rung gnome#2)');

/* ── Trickery ── */
put('raceBorrowedClaw', { desc: 'Deals MEDIUM physical damage to a Single Enemy and tears one spell out of them: the skinwalker keeps it, they lose it for the match. Cooldown: 3 rounds.' });
d('raceBorrowedClaw', 'B', 'MOVE → Trickery');
put('raceMimicry', { cooldownRounds: 3 });
d('raceMimicry', 'D', 'spawnDecoy on a buff row');

/* ── UFO ── */
put('raceImplant', { statStageBoost: { mdef: -1 }, range: 4 });
put('raceAbductionBeam', { bonusVsStatus: { status: 'marked', mult: 1.5 } });
put('raceCropCircle', Object.assign(T(3), { dmg: 125 }));
put('raceWarOfTheWorlds', { cooldownRounds: 2 });
d('raceWarOfTheWorlds', 'D', 'zone tick: 100 to every enemy in the 5×5 at the end of each round for 2 rounds');

/* ── Vampiric ── */
put('raceLifetap', { element: 'blood', damageType: 'physical', range: 1, dmg: 100, statusEffects: [{ id: 'grievous', duration: 2 }],
    desc: 'Open the vein. The wound will not close. Deals MEDIUM physical damage to a Single Enemy, heals the caster for part of it and leaves the target Grievously Wounded.' });
d('raceBatSwarm', 'D', 'aoeLifeDrain 30% (whole rewrite waits for the area drain)');
put('racePredatorDrop', { bonusVsStatus: { status: 'grievous', mult: 1.5 } });

/* ── Water ── */
put('raceRiptide', { dmg: 80 });
put('raceTidalBlessing', { kind: 'heal', healAmt: 140, cleanse: 1, range: 3, aoeRadius: null, zoneDuration: null, healPerTurn: null,
    desc: 'Restores a BIG amount of HP to a Single Ally and cleanses a debuff.' });
put('sharedTidalSurge', { statusEffects: [{ id: 'wet', duration: 2 }] });
d('raceTemporalTide', 'D', 'heal + cleanse + Slow in one zone');
put('raceCallOfTheDeep', Object.assign(T(3), { apCost: 1, dmg: 135,
    desc: 'Something answers from below. Deals MEDIUM magic damage to a Single Enemy, and the floor under them opens into deep water. Silenced targets cannot call for help: bonus damage.' }));
put('raceTidalSlam', Object.assign(T(3), { dmg: 135 }));
put('raceTsunami', Object.assign(T(3), { dmg: 135 }));

/* ── Werewolf ── */
put('raceHowl', Object.assign(T(1), { kind: 'warCry', auraRadius: 2, desc: 'The pack answers. Every ally within 2 tiles gains +1 ATK stage.' }));

/* ── Winter Warfare ── */
put('raceFrozenPunch', { dmg: 100 });
put('raceAvalancheStrike', { cooldownRounds: 2 });

/* ── Witchcraft ── */
put('sharedHexOfToil', { statusEffects: [{ id: 'hexed', duration: 3 }, { id: 'grievous', duration: 3 }] });
put('raceCurseOfMisfortune', { kind: 'aoe', noDamage: true, aoeRadius: 1,
    desc: 'It runs in the family. Every enemy in a 3×3 is Hexed for 3 rounds.' });
put('raceHocusPocus', { cost: 100, bonusVsStatus: { status: 'hexed', mult: 1.5 } });

/* ── Zombie ── */
put('raceInfect', { cooldownRounds: 3, activations: 2, statusEffects: [{ id: 'infected', duration: 3 }] });
put('raceOutbreak', { apCost: 1, bonusVsStatus: null });
d('raceOutbreak', 'D', '80 poison damage on cast to every enemy in the 5×5');
put('raceShamblingHorde', { apCost: 1 });

module.exports = { M, DEL, DEFER };
