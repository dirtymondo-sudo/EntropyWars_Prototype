# THE SPELL AUDIT — Batch D, rows set 2 (2026-10-01)

One line per item: the row id, what ships, the keys added, and anything dropped or deferred with the reason.
Engine code is marked `THE SPELL AUDIT Batch D` in battle.js / ai.js / online.js / data.js / sprites.js / three-renderer.js.

## Whole rows (new, SPELL_LIBRARY unless noted; one family, tier = SP, MP by tier, none a rung)

- `raceBumperCrop` (agriculture T4, 100 MP, 2 AP, CD 2): 5x5 aoe, MEDIUM magic damage, Root 1, a plain seed on every empty rim tile that grows into an ordinary tree at the next round end. Keys: `rimSeeds` (aoe branch → `_plantRimSeeds`), seed `type: 'plain'` + `growRounds` (growth tick reads it); plain trees push to `state.plantedTrees` with `aura: null`, so they count for Green Thumb / Trunk Throw and block sight like any tree. three-renderer `seed-plain` reuses the healing seed sprite.
- `gunShutDoor` (doors T1, 25 MP, DOOR_GUN_SPELLS, the wheel): new `DOOR_GUN_DOORS.shut` standing door (no act, no lane). It lands shut (blocks movement and sight: `doorBlocksMove` / `doorBlocksSightBetween` read `open`); casting the row on your own Shut Door toggles it at 0 MP, and the Keyholder free toggle applies when the agent is beside it. Keys: `shut`, `starter` (always unlocked), `battleOnly` (the HQ room wheel skips it). battle.js: `doorGunPlace` `open: !def.shut`, `_gunDoorTurnWanted` false without an act, doSpell `_shutToggle`.
- `gunTwinDoors` (doors T4, 100 MP, CD 3, SPELL_LIBRARY family pool, so the Door Agent only): two picks within 4, by click (first pick = `state._spellPick1 {tile:true}`, click it again to cancel; a CPU seat uses `_doorNearSpot`), placed as a fixed transit pair. Keys: `pairPicks`, `transit` (door record). Transit hook: `resolveTileArrival` new step T (any via but move/teleport: an open transit mouth sends the body out of its twin, then the far tile runs its chain) and `resolveForcedSlide` stops a slide on an open transit mouth. `_runAoePullJobs` stops on one too. online.js: the guest sends the first pick as pickX / pickY (the host already seats it).
- `raceLandOnYourFeet` (feline T2, 50 MP): no-damage leap to any free tile within 3, any height, no fall damage, +1 DEF stage for 1 round on landing. Keys: teleport `leap` (jump-arc tween, relayed), `arrivalStageBoost` + `arrivalStageRounds`; `applyStatStageBoost` now reads `opts.rounds`.
- `raceShatterLattice` (prismlattice T4, 100 MP, 2 AP, CD 2): every owned prism bursts a 3x3 for MEDIUM magic in the current frequency (spellType, status, stage rider, dmgMult), then every owned prism is removed. Needs 1 prism. Keys: `shatterPrisms` (pulseLattice branch → `doShatterLattice`; `_mirrorSpellBlockReason` allows 1 prism). AI scores enemies inside the prisms' 3x3s; the Tune Frequency follow-up valuation skips a shatter row.
- `raceRescueLine` (ropework T3, 75 MP): ally haul up to 3 tiles toward the caster, cleanse 1, no fall damage. Keys: row-level `allyOnly` (now read by `_kindMeta`: offensive false, ally-only, fog-exempt), pull `cleanse`, `noFall` on the slide. AI picks the most hurt ally within range with enemies on it.
- `raceRoundUp` (ropework T4, 100 MP, CD 3): self-origin r2, every enemy pulled 2 tiles toward the caster and Tethered 1, no damage. Keys: `pullDistance` in `_applyAoeDamage` (N-tile pull jobs, nearest first, re-aimed per step; a noDamage area now pulls). AI: a self-origin aoePull now targets the caster tile (Crowd Surge benefits too); a noDamage pull scores the haul and status only.
- `raceTagIn` (teamwork T1, 25 MP, CD 2): ally swap within 3. Keys: row-level `allyOnly` (swap branch requires a friendly non-self target). AI: swap with a hurt ally under pressure when the caster is fitter.
- `raceSwipe` (thievery T3, 75 MP): MEDIUM physical to a Single Enemy within 2; every buff status and positive non-permanent stat stage moves to the caster for the rounds it had left. Keys: `stealBuffs` (`_runPostEffects` → `_stealBuffsFrom`).
- `raceDeathtrap` (trapmaking T4, 100 MP): hidden 3x3 trapdoor (anchored at the clicked tile's north-west, as the 2x2 is), one per caster. The first enemy to step on it drops the whole 3x3 two levels: every grounded enemy of the owner on it takes MEDIUM physical plus the fall and is Rooted 2. Keys: `trapHitsAll` (trap record `hitAll`), trap record `statusEffects` (replaces the trapdoor's hard-coded Stagger 1 when set).
- `raceSnowFort` (winter T2, 50 MP): 3 tiles of `snow_wall` in a line, raised 1 level, blocks sight, move cost 2; melts after 3 rounds to water and sinks back. Keys: `meltRounds`, `meltTo` (terrainCreate pushes `state._timedTerrain` entries with `meltTo` + `deform`; `_tickTimedTerrain` applies them). New data.js TERRAIN_RULES `snow_wall` + overhead colour; sprites.js TERRAIN_SPRITES `snow_wall` reuses ice.png.

## Partials finished

- `raceAnnihilation`: `purgeFirst` replaces `purgeBuffs`: every buff status (the statUp badge takes the raised stages with it) and the whole shield come off BEFORE the hit (`_purgeWardsBeforeHit`). Desc restored to the plan's wording.
- `raceSystemCrash`: `statusIfTargetHas: { has: 'jammed', status: [Stagger 1] }`, judged before the hit, read by the single hit and by `_applyAoeDamage`. Desc names the clause.
- `raceMiasma`: `leaveTerrain: 'poison', leaveTerrainRadius: 1`: only the centre 3x3 turns to poison ground (`_applyAoeDamage` leaveTerrain pass honours the radius around `deformCenter`).
- `raceUpdraft`: `timedStatBonus: { move: 1, rounds: 2 }` (new generic key: `applyTimedStatBonus` / `getTimedStatBonus`, `unit.timedStatMods` ticks in `_tickAllStatusDurations`, cleared on respawn, read through `getStatusMoveDelta`). Same name S1 was told to use for Swarm Signal; if S1 also built it, keep one copy at merge.

## Batch B gaps

- `raceBrood`: `summonDef.hitStatus: Poison 2` (summon record `hitStatus`, applyShot's summon branch passes it as `statusEffects`).
- `raceWebSwing`: `needsLoS: true` (teleport branch rejects an unseen tile; the doSpell LOS gate and `getSpellRangeTiles` honour it; AI filters its tiles by LOS).

## From Batch A

- `raceGrapple`: `selfPullOnly: true`, cost 25. The hook bites a wall / blocking object, a standing door or an ally within 3 and reels the caster to the tile beside it; enemies are refused, open floor is not an anchor, a shut door stops the reel. AI reels to an ally closer to the fight. Grapnel Gauntlet descs (gear row + EQUIP_DEFS) updated.
- `raceStealFromRich`: `selfStageBoost: { atk: 1 }`, cost 50: the caster gains the ATK stages the target actually lost (none if the drop fizzled).

## Text only

- `healingSeed`, `poisonSeed`, `leechSeed`: descs carry the engine's real numbers (8% / 6% / 5% seed procs, 7% / 5% / 4% tree pulses in a 3x3, grow in 2 rounds or 1 when wet).
- `thunderstorm`: 3 to 5 rounds (was "3 to 4"), chases the nearest grounded enemy 2 tiles a round, Soaked 2 then WEAK lightning (Soaked x1.5), flyers skipped, −5 DEF in the eye.
- `sharedSummonBloodRain`: 5 to 8 tiles, 3 to 5 rounds, drifts; Soaked 2 + Burn doused each turn; Divine take WEAK damage, Unholy heal a little HP and MP.

## Dropped / deferred

- Miracle (`raceWingsOfMercy`) carries `healOnSwap: 60`, which nothing reads; not this batch's row. Its `allyOnly` is now live, so it swaps only with allies, as its desc says.
- The grapple's aim preview (ui.js) still draws the old landing line; the engine stops beside the anchor.
- Deathtrap's 3x3 anchors at the clicked tile's north-west corner (shared `_trapFootprint`), not centred.
- No new relay: every new moment is a floating text, a ThreeVFXEffects / VFX3D fire, a `_doorGeom` call, a tween (`animateDisplacementPath` / `animateJumpArc`) or snapshot state, all already relayed.
