# THE SPELL AUDIT — Batch C log (2026-09-30)

Plan: SPELL_FAMILY_AUDIT_PLAN.md §9 Batch C ("new content that needs no engine"). Export builder:
`docs/spell-audit/batches/batchC.js` (merges the per-family row files in `batchC/part_00..03.js` and applies the review
fixes) → `batchC.json` → `node bake-spell-mods.js batchC.json --no-test`.

## What shipped

**87 new rows** (§6.3, the ones Batch B did not ship as rungs). Every row is in the Spell Library with one family, its
tier and the tier's MP. None is a rung: races reach them through their families' pools.

- `advancedtechnology`: Blue Beam (T3)
- `ancientknowledge`: Sandstone Tomb (T3)
- `animalhandling`: Hawk (T1), Wolf Pack (T2), Crack the Whip (T3), Elephant (T4)
- `apexpredator`: Death Roll (T2)
- `arachnid`: Cocoon (T4)
- `arcane`: Annihilation (T4)
- `astralprojection`: Spirit Guide (T3)
- `athleticism`: Shake It Off (T2)
- `beastabilities`: Maul (T2)
- `blackmagic`: Needle Work (T3)
- `blood`: Hemorrhage (T2), Exsanguinate (T4)
- `chemistry`: Acid Flask (T1), Antidote (T2), Chain Reaction (T4)
- `christmasspirit`: Milk and Cookies (T3)
- `computerhacking`: System Crash (T4)
- `cowboyskills`: Slap Leather (T3)
- `cryptid`: Eyewitness (T3), Out of the Dark (T4)
- `deepsea`: Spout (T1)
- `deepstate`: Surveillance (T1)
- `desertacclimation`: Quicksand (T3), Simoom (T4)
- `door`: Door Slam (T3)
- `dragonabilities`: Ember Heart (T2)
- `fallenangel`: Broken Halo (T3)
- `feline`: Cat Nap (T3)
- `fire`: Combust (T2)
- `fractal`: Strange Loop (T2)
- `galacticfederation`: Pleiadian Touch (T1)
- `gambling`: Stacked Deck (T2), Jackpot (T4)
- `horns`: Horn Hook (T3)
- `horsebackriding`: Saddle Up (T2), Ride-By (T3), Lance (T4)
- `huntingskills`: Snare (T1)
- `ice`: Shatter (T1)
- `internetaddiction`: Doomscroll (T1), Rabbit Hole (T2), Ratio'd (T3)
- `ki`: Spirit Bomb (T4)
- `knight`: Shield Bash (T2)
- `lightning`: Static Shock (T1), Chain Lightning (T3), Tempest (T4)
- `martialarts`: Roundhouse Kick (T2), Pressure Point (T3)
- `mecha`: Full Burst (T4)
- `meditation`: Deep Breath (T1), Mantra (T3)
- `mirrormagic`: Mirror Shard (T1), Seven Years (T2), Shattered Mirror (T3)
- `mothman`: Premonition (T2), Harbinger (T3)
- `nature`: Rejuvenation (T4)
- `poison`: Miasma (T4)
- `politics`: Campaign Promise (T2)
- `psychadelic`: Dosed (T1), Contact High (T3)
- `psychic`: Telekinetic Slam (T3)
- `ropework`: Hogtie (T2)
- `sasquatch`: Timber Stomp (T2)
- `scarecrow`: Scare Off (T3)
- `shadow`: Consuming Dark (T3)
- `streetsmarts`: Mean Mug (T1)
- `symbiosis`: Tendril Whip (T1)
- `teamwork`: Everybody Up (T4)
- `temporal`: Stutter (T2)
- `tentacleappendages`: Constrict (T2), Eightfold Lash (T3)
- `titan`: Giant Stride (T2)
- `trickery`: Misdirection (T1), Sucker Punch (T1)
- `unethicalscience`: Vivisection (T1)
- `werewolf`: Claw Sweep (T2), Lunar Regeneration (T3)
- `wind`: Gale (T2), Updraft (T2)
- `winter`: Glacial Slam (T3)
- `witchcraft`: Evil Eye (T1)
- `zombie`: Grab (T1)

**26 family passives** (§6.4), new data.js `FAMILY_PASSIVES` (read by the same `PASSIVE_HOOK_KEYS` as TRAINING,
cost 0, tier = SP):
- LIVE (18): Cinder Touch, Live Wire, Venomous, Thick Fur, Restuffing, Triage, Star Chart, Slow Rot, Terminally Online,
  Keen Nose, Unweathered, Deep Adapted, Second Wind, Rising Power, Cheap Shot, Sea Legs, Overwatch, Ballistic Vest.
  With Chitin Armor, Symbiote Armor (Batch B) and the three moved TRAINING rows (Green Thumb, Tinker, Field Operative)
  that is all 23 LIVE passives of §6.4.
- PARTIAL, live half only (8): Snowborn (ice), Gills (water), Windborne (wind), Consecrated (light), Faraday Cage (robot),
  Chorus (stage presence), Choir (angelic), Iron Discipline (military support). Their text says only what ships.
- Skipped: Jellyfish's "Deep Breath" (the name is taken by the new Meditation T1 spell `raceDeepBreath`; names must be
  unique), Resonant Voice and Bloodlust (no meaningful live half).

**Upgrades** (§6.4): `upExploitMarked` (marked ×1.5, 7 families), `upFrostbite` (live half: frozen bonus, ice / winter /
christmas spirit / haunted), `upEncorePerformance` (CD −1, stage presence), `upCounterspell` (CD −1, arcane, `auto:
false`, listed on Spellsteal only: `upgrades: ['upEfficient', 'upReach', 'upCounterspell']`).

**Engine reads** (small, data-driven; host-side, ride the state sync):
- battle.js warCry reads `cleanse` (N debuffs per ally; 99 = all) — Mantra, Everybody Up.
- battle.js selfHeal reads `statusEffects` — Lunar Regeneration's Regen.
- battle.js healAll reads `auraRadius` (allies within N; none = whole team as before) and `teamStatusEffects` —
  Rejuvenation, Milk and Cookies. ai.js scores healAll over the same allies.
- battle.js aoe passes `groundsFlyers` to the area hit — Tempest; Meteor already carried the flag and now honours it.

**Fix:** the TRAINING_PASSIVES loop reset every row's family to `training` at load, so Green Thumb / Tinker / Field
Operative (moved in Batch B) were back in Training at runtime. The loop now keeps a row's own family.

**Bake gotcha:** appending rows after a trailing comment at the end of SPELL_LIBRARY made the bake write a lone `,`
between rows (86 holes → `SPELL_BY_ID` threw at load). Removed by hand; check `loadGameData()` after every bake.

## Not done in Batch C

**Per-row "Upgrades" lines** (151 entries in the family blocks): not applied. Most name picks the auto rules already
allow, and an explicit list freezes a row's upgrade set against later upgrades. Left for mondo's own pass in the Spell
Library.

**Rows waiting for Batch D** (whole rows not shipped, or rows shipped without the clause named):

- `raceBumperCrop` seeds on a rim (§6.5): the seeds on every empty rim tile that sprout into trees are the point of the row (the tree-team flagship); no aoe kind plants seeds on the rim.
- `raceAnnihilation` partial: purgeBuffs strips buff statuses only and after the hit (as Terror Pounce); shields and stat stages are not stripped and nothing is stripped before the damage lands. Dropped "every ward / every stage ... and then" from the desc.
- `raceSystemCrash` partial: statusIfTargetHas (§6.5) — "every Jammed enemy hit is also Staggered 1" dropped from the row and the desc.
- `gunShutDoor` doorDeploy reads DOOR_GUN_DOORS[spell.door] and there is no "shut" standing door (no act, blocks move + LoS, the owner may open it) — needs a new DOOR_GUN_DOORS entry + its open/shut behaviour on a standing door, not a spell-row key
- `gunTwinDoors` deployPair (placeDoorPair) puts one mouth on the CASTER's tile, not two picks within 4, and doorStepThrough only fires when a unit ENDS A WALK on the door — knocked / blown / pulled bodies never transit; needs a two-pick pair + a transit hook on forced moves
- `raceLandOnYourFeet` §6.5 Batch D: a no-damage leap that ignores elevation (there is no leap kind), plus no-fall-damage and the +1 DEF rider
- `raceGiantStride` partial: "enemies ADJACENT to the path take 60" — the dash kind only hits enemies ON the path tiles (shipped that way, desc says "on the path"); "ignoring elevation" dropped from the desc (a dash only checks the landing tile)
- `raceHallOfMirrors` a real zone on a plain area row (zone tick: 60 magic + Blind 1 at each round end for 3 rounds) — §6.5 zoneTickDamage, not in the engine yet
- `raceMiasma` partial: 'the centre 3x3 becomes poison terrain' dropped — aoe leaveTerrain paints the whole 5x5 and paintTerrain is read only by barrage; needs a centre-only terrain key
- `raceShatterLattice` prism detonation (every owned prism blasts a 3x3 in the current frequency, then is destroyed) — §6.5 Batch D mechanic
- `raceRescueLine` the pull kind only takes an enemy (isAllyUnit rejects allies) and never cleanses: an ally haul + cleanse 1 needs engine work.
- `raceRoundUp` aoePull: a noDamage area skips the pull (_applyAoeDamage continue), the inward pull is a fixed 1 tile (no 2-tile distance key), and there is no self-origin pull: needs engine work.
- `raceTagIn` the swap kind rejects allies (isAllyUnit ⇒ "Invalid target for swap"); a row-level allyOnly is not read by any code (Miracle carries it dead): needs an ally swap.
- `raceSwipe` buff steal (§6.5): damage kind has purgeBuffs (strip) and stealSpell (spells), but nothing moves the stripped buffs onto the caster.
- `raceDeathtrap` placeTrap trapdoor spring hits only the triggering victim and hard-codes Stagger 1 (_springTrap); damage + fall to everyone inside and Rooted 2 need engine work.
- `raceUpdraft` partial: the +1 MOV for 2 rounds flat bonus — the buff branch reads no flat statBonus key (only statusEffects / statStageBoost / cleanse); shipped as Levitating 2.
- `raceSnowFort` snow_wall terrain (§6.5): no snow_wall terrain type and no timed melt on terrainCreate.
