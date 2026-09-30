# Spell family audit — Batch A + A2 log (2026-09-30)

Built from SPELL_FAMILY_AUDIT_PLAN.md §9 (Batch A, A2) with every §10 decision taken at its recommendation.
The patch list is `docs/spell-audit/batches/batchA.js` (one `put` per row, the §6.2 wording in comments);
`batchA.json` is the export `bake-spell-mods.js` took. R2 files: data.js, battle.js.

## What shipped

- **294 rows patched** in data.js (bake-spell-mods.js): every Batch A RETIER / RECOST / RETUNE / RETYPE / RENAME /
  DESC, the REWRITEs that use live fields, the §6.5 dead-field deletions (guaranteedCrit, bonusVsDebuffed,
  executeBonusPct on No Mercy → executeBelowPct 0.25, selfCenter, equipReq, markedSecondHitBonus, bonusVsUnholy →
  unholyBonus, reviveHpPct → revivePct), and the 21 Q1 T4 folds (T3, 75 MP, 125–135, riders kept).
- **8 rows deleted** that were nobody's rung: Green Arrow, Predator Leap, End Zone Dance, Ricochet (also off the
  Gunslinger learn order), Forest Ambush, A Really Good Punch (Q4), Grim Resolve, and the Impact Round rider example
  (it IS the Blast upgrade). The dead duplicate Absolution row in the seraphim array went too; the priest's live one
  stays.
- **MP follows the tier** (data.js `getTierMpCost`): every active row costs 25/50/75/100 by its explicit `tier`;
  untiered rows still fall back to their tree ring; `manaCostOverride` still wins.
- **Q2**: `EW_MP_L1_FRAC` 0.30 → 0.35 (story/campaign MP floor; PvP builds at the cap and is unchanged).
- **Damage words**: every patched row's WEAK/MEDIUM/HEAVY/SEVERE now matches describeSpell's scale for its dmg
  (Sleigh Dash keeps WEAK: the path hit is its 70 dashDamage). Heat Death's desc is one blast now (zoneDuration gone).
- **Crescendo** is gone, so the `lullabyRangeBonus` hook key and its battle.js read are removed.

## Engine gaps closed in battle.js (the edited rows rely on them)

- heal kind reads `cleanse` (Herbal Remedy, Séance, Absolution, Tidal Blessing).
- buff kind reads `cleanse` before applying its buffs (Wish Granted, Underdog Spirit, Prophecy Fulfilled).
- shield kind applies its `statusEffects` (Prayer's Blessed).
- cleanse kind applies `statStageBoost` (Inner Peace).
- displacement passes its `statusEffects` with the hit (Body Check's Stagger).
- escape kind reads `selfHealPct` (Reassemble).
- `_applyAoeDamage` has a `noDamage` branch: statuses + stat stages, no hit, no turret/door/object chip
  (Dragonfear, Hypnotic Pulse, Executive Order, Curse of Misfortune).
- no-damage barrages apply `statStageBoost` (Meow's DEF −1 never landed).

All of these land on the host inside the existing cast paths; the guest sees them through state-sync and the
floating text/log the paths already relay. No new on-screen moment, so no online.js change.

### Left for Batch B (41)

- Green Thumb `passiveGreenThumb`: MOVE → Agriculture
- Gravity Boots `raceGravityBoots`: MOVE → Alien Weapons (Astronaut Camp deleted)
- Primal Roar `racePrimalRoar`: MERGE into Apex Roar (rung dinosaur#1)
- Tail Whip `raceDinoTailWhip`: MOVE → Apex Predator
- Unstoppable Charge `raceUnstoppableCharge`: MERGE into Rampage (rung juggernaut#4)
- Ambush Lunge `raceAmbushLunge`: DELETE (rung sharkman#3)
- Blood Ritual `raceBloodRitual`: goatman rung 3 → Life Sap
- Ink Cloud `raceInkCloud`: MOVE → Cephalopod Anatomy
- Field Operative `passiveFieldOperative`: MOVE → Computer Hacking
- Neural Hack `raceNeuralHack`: DELETE (rung android#3)
- Blurry Photo `raceRealityShift`: DELETE Blurry Photo (rung bigfoot#2)
- Tithe `raceCultTithe`: MOVE → Cult of Personality
- Inner Demon `raceInnerDemon`: DELETE (rung halfdemon#1)
- Tinker `passiveTinker`: MOVE → Engineering
- Clockwork Turret `raceClockworkTurret`: DELETE (rung gnome#3)
- Pixie Dust `racePixieDust`: DELETE (rungs fairy#2, mushroom girl#2)
- Scorched Earth `sharedScorchedEarth`: DELETE (rungs demon prince#3, overlord#3)
- Star Crossed `raceStarCrossed`: MOVE → Fortune Telling
- Stone Throw `raceStoneThrow`: MOVE → Giant Abilities
- Thick Hide `raceThickHide`: MOVE → Giant Abilities
- Seismic Leap `raceSeismicLeap`: MOVE → Great Ape
- Radiant Bolt `radiantBolt`: DELETE (rung angel#1)
- Divine Judgment `raceDivineJudgment`: MOVE → Heavenly Duties
- Cliff Charge `raceCliffCharge`: DELETE (rungs goatman#2, krampus#2)
- Improvise `improvise`: DELETE (rung homosapien#1)
- Ice Shard `raceIceShard`: DELETE (rung yeti#1)
- Chitin Armor `raceChitinArmor`: PASSIVE (rungs mantid#2, bee queen#2)
- Ocean Current `raceJellyDrift`: MOVE → Jellyfish
- Gothic Rampart `raceGothicRampart`: DELETE (rung gargoyle#2)
- Hydraulic Punch `raceHydraulicPunch`: MOVE → Machinery
- Blessed Blade `raceBlessedBlade`: MOVE → Main Character Energy
- Long Rifle `raceQuickDraw`: MOVE Long Rifle → Marksmanship
- Bone Barrage `raceBoneBarrage`: MOVE → Necromancy
- Nuclear Option `sharedNuke`: MOVE → Politics; general and mech rung 4 → Fire for Effect
- Ayahuasca Retreat `raceAyahuascaRetreat`: MOVE → Psychedelics
- Robo Punch `raceRoboPunch`: MERGE into Hydraulic Crush (rung honda civic#3)
- Call Out `provoke`: MOVE → Stage Presence
- Symbiote Armor `raceSymbioteArmor`: PASSIVE (rung symbiote#2)
- Stick-Up `raceHitALick`: MOVE → Thievery
- Tinker's Contraption `raceTinkersContraption`: DELETE (rung gnome#2)
- Borrowed Claw `raceBorrowedClaw`: MOVE → Trickery

### Left for Batch D (32)

- Weigh the Heart `raceWeighTheHeart`: wire executeBonusPct (×1.5 under 50% HP), 180→160, drop the Stagger finisher
- Stampede `raceApexCharge`: Stagger on every enemy along the dash path (only the target is Staggered today)
- Hallelujah `raceHallelujah`: healBonusVsStatus: Blessed allies healed ×1.5
- Memory Leak `raceMemoryLeak`: mpDrain: the target loses 30 MP
- Heat Death `raceHeatDeath`: the real zone: 70 to every enemy inside at the end of each round for 2 rounds (zone-tick key); A2 folds it to a plain T3 135 3×3 + Slow until then
- Depth Charge `raceDepthCharge`: the Wet finisher should read "standing in water" too (_unitIsSoaked)
- Brainwash `raceBrainwash`: the Discord 2 left behind when the possession wears off
- Soul Bind `raceSoulBind`: the 45% clause keyed to Contract
- Nightmare Pulse `raceNightmarePulse`: aoeLifeDrain 25%, targeted 3×3 at rng 3, psychic, Stun finisher (whole rewrite waits for the area drain)
- Carrion Feast `raceCarrionFeast`: corpse-gated feed + respawn delay
- Scatter Shot `riderScatterShot`: the random extra victims ignore line of sight
- Divine Light `raceDivineLight`: heal the ally AND 70 to every enemy adjacent to it
- Miracle `raceWingsOfMercy`: wire healOnSwap (100) and restore the heal-on-arrival text
- Shield Maiden `raceShieldMaiden`: self DEF +1 and Taunt 1 on every enemy within 2 (one cast, two targets)
- Horn Toss `raceHornToss`: a throw in a direction the caster picks
- Hellfire Crown `raceHellfireCrown`: stageHigherOf: +1 to whichever of ATK / M ATK is higher, CD 2
- Swarm Signal `raceSwarmSignal`: +1 MOV for 2 rounds on top of the ATK
- Ki Charge `raceKiCharge`: a 96-point ki barrier on a self buff (buff rows cannot grant a shield yet)
- Sad Backstory `raceSadBackstory`: stageIfBelowPct: ATK +2 instead of +1 under 50% HP
- Siege Mode `raceSiegeMode`: +1 ATK, +2 RNG, −2 MOV for 3 rounds (a lock-down status)
- Mitosis `raceMitosisSplit`: the Blob's ooze trail (summonDef.trailTerrain)
- Grapple `raceGrapple`: self-pull to a wall, door or ally
- Stuffed Double `raceStuffedDouble`: a decoy that taunts, and Fear when it breaks
- Shadow Infiltration `raceShadowInfiltration`: the caster turns Invisible 1 after the hit (hit and fade)
- Drive-By `raceDriveBy`: Stagger 1 on every enemy on the dash path
- Team Strike `sentaiTeamStrike`: bonusHitsPerAdjacentAlly
- Steal from the Rich `raceStealFromRich`: selfStageBoost: the caster takes the ATK stage
- Mimicry `raceMimicry`: spawnDecoy on a buff row
- War of the Worlds `raceWarOfTheWorlds`: zone tick: 100 to every enemy in the 5×5 at the end of each round for 2 rounds
- Bat Swarm `raceBatSwarm`: aoeLifeDrain 30% (whole rewrite waits for the area drain)
- Temporal Tide `raceTemporalTide`: heal + cleanse + Slow in one zone
- Outbreak `raceOutbreak`: 80 poison damage on cast to every enemy in the 5×5
