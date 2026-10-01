# Batch D — S1 rows log (row mechanics, set 1)

One line per item: row id — what ships — keys added — dropped / deferred and why.

- `raceWeighTheHeart` — HEAVY 160 magic, ×1.5 when the target is under 50% HP (log line on the hit) — reads `executeBonusPct` (calcSpellHitRiders `execMult`; removed from SPELL_DEAD_FIELDS) — dmg 180→160; Stagger finisher dropped per plan.
- `raceWarOfTheWorlds` — no cast hit; a square 5×5 damage zone, 100 + spell power to every enemy inside at each round end for 2 rounds; CD 2, AP 2 — `zoneTickDamage`, `zoneDuration` (battle.js `_pushDamageZone`, ticked in processEndOfRoundZonesAndSeeds, drawn through the existing zone overlay) — the round 5×5 shape was dropped (square only).
- `raceHeatDeath` — no cast hit; Slow 1 on cast, then a 3×3 zone that deals 70 at each round end for 2 rounds — `zoneTickDamage` — Batch A2's plain 135 hit is replaced.
- `raceHallOfMirrors` — NEW row: T4 mirrormagic (after Shattered Mirror), arcane magic, area r1 at rng 4, CD 2; a 3×3 zone for 3 rounds that deals 60 + Blind 1 at each round end; in the rabbit pool — `zoneTickDamage`, `zoneTickStatus` — nothing deferred.
- `raceMemoryLeak` — Jam 2 plus the target loses 30 MP (float + log) — `mpDrain` (debuff branch) — nothing deferred.
- `raceBatSwarm` — blood, physical, MEDIUM 110 in a 3×3; the caster heals 30% of the total dealt — `aoeLifeDrain` (`_applyAoeDamage`, scaled by lifeSapMult) — DEF −1 dropped.
- `raceNightmarePulse` — psychic, targeted 3×3 at rng 3 (no longer self-centred), MEDIUM magic, 25% drain, ×1.5 on Stunned — `aoeLifeDrain` — nothing deferred.
- `raceOutbreak` — WEAK 80 physical to every enemy in the 5×5 on cast, then the existing Poison zone — `zoneCastDamage` (zoneDebuff cast) — nothing deferred.
- `raceDepthCharge` — the `wet` finisher also pays on a unit standing in water — engine: `bonusStatusMatches` treats `wet` as true when `_unitIsSoaked`; desc only on the row.
- `raceJellySting` — same `wet`/Soaked read as Depth Charge — no new key; desc only.
- `raceBrainwash` — when the possession comes off by any path (count, tick, cleanse), the unit gets Discord 2 (skipped if it died) — `possessAfterStatus` (stored as plain data `_possessAfter` / `_possessAfterSrcId`, applied in clearStatus) — nothing deferred.
- `raceSoulBind` — the share is 45% (instead of 30%) while EITHER bound unit has Contract — no new key (`_procLinks` read changed) — the brief said "while the binder is Contracted", but Contract is a debuff the demon puts on enemies, so I used the §6.2 reading (either bound unit). The old "binder's M ATK raised" clause was dropped.
- `raceCarrionFeast` — now kind `cannibalize`: needs remains within 2 tiles, heals 50% of max HP, ATK +1, eats the corpse and delays that unit's respawn by 2 rounds; CD 2 — `healPct`, `corpseDelay`, plus a new `statStageBoost` read in the cannibalize branch — nothing deferred.
- `riderScatterShot` — the 3 random victims need no line of sight — `ignoresLineOfSight: true` (the random pool already reads it) — nothing deferred.
- `raceDivineLight` — BIG heal on the ally, plus WEAK 70 light damage to every enemy on the 8 tiles round it (hostiles via getHostileUnits, so FFA works) — `healAdjacentDamage` — nothing deferred.
- `raceWingsOfMercy` (Miracle) — swap with an ally within 4; the ally arrives healed for 100 + power — `healOnSwap` (swap branch, heals allies only) — DEPENDS ON S2: the swap kind still refuses allies until S2's Tag In / row-level `allyOnly` read lands; until then the heal never fires.
- `raceShieldMaiden` — buff at rng 0: caster DEF +1, and every enemy within 2 is Provoked for 1 round toward her — `tauntEnemiesWithin` — nothing deferred.
- `raceHornToss` — click the victim, then a tile beside it: the victim takes WEAK 80 and is thrown 3 tiles that way; +60 on a collision; ×Staggered stays — `throwAnyDirection`, `collisionBonus` (two-click pick in doSpell; range tiles show the 3×3 round the pick; online guest sends `partnerId`; AI/auto seats resolve in one call) — not verified on the HUD action-card cast path, which may lose the pick (the board click path works).
- `raceHellfireCrown` — +1 to whichever of ATK / M ATK is higher; CD 2 — `stageHigherOf` — nothing deferred.
- `raceSwarmSignal` — ATK +2 to allies within 2 as before, plus +1 MOV for 2 rounds through the new `quickened` status — `timedStatBonus` (read in the warCry branch only) — the name was agreed with S2; S2 may also read it elsewhere, so watch for a duplicate `quickened` when merging.
- `raceKiCharge` — ATK +1 and a 96-point barrier (scaled by supportScale, capped by shieldCapPct) — `shield` on a buff row — nothing deferred.
- `raceSadBackstory` — ATK +1, or ATK +2 when under 50% HP — `stageIfBelowPct` — nothing deferred.
- `raceSiegeMode` — new `siegeMode` status for 3 rounds: ATK +1 stage, +2 RNG, −2 MOV — new STATUS_DEFS entry `siegeMode` — the +2 RNG reaches basic-attack range only (rangeDelta), not spell range.
- `raceMitosisSplit` — the Blob paints each tile it walks off as swamp for 3 rounds — `summonDef.trailTerrain` (summon walk loop, `_paintTimedTerrain`) — nothing deferred.
- `raceStuffedDouble` — the straw double Provokes every enemy within 2 for 2 rounds, and a Provoked unit must basic-attack it while it can reach it; when it breaks, every adjacent enemy is Feared 1 — `decoyTaunt`, `breakStatus` (plain `_tauntObjKey` 'x,y' on the unit, `getTauntDecoy`, `_onDecoyBroken`; AI reads both) — the bind covers basic attacks only (spells can't target objects); the decoy has no 2-round lifetime (no object-lifetime system exists), so it stands until it is broken or recast. Only the taunt lasts 2 rounds.
- `raceShadowInfiltration` — dash hit, then the caster is Invisible for 1 round — `selfStatusAfter` (dash branch, after landing) — nothing deferred.
- `raceApexCharge` (Stampede) — the dash already Staggered every enemy on the path; desc only.
- `raceDriveBy` — every enemy on the dash line takes WEAK damage and is Staggered 1, then the after-shot — `statusEffects` on the row (the existing dash path read) — nothing deferred.
- `raceGiantStride` — enemies on OR next to the 4-tile path (start tile included) take WEAK 60, each hit once, regardless of elevation — `dashSweep: 1` (the shared dash-path key) — nothing deferred.
- `sentaiTeamStrike` — 5×27 hits, plus one more 27 hit for each ally (not the caster) next to the target, up to 3 — `bonusHitsPerAdjacentAlly` — nothing deferred.
- `raceMimicry` — ATK +2, DEF +2, and a Shed Skin decoy on a free tile beside the caster, the one farthest from enemies (max 3 per caster) — `spawnDecoy` on a buff row (`_spawnCasterDecoy`) — nothing deferred.
- `raceTemporalTide` — a 3×3 zone for 2 rounds: allies inside heal 60 and shed 1 debuff at each round end; enemies inside are Slowed 1 — `cleanse`, `enemyStatusEffects` on zoneHeal; healPerTurn 100→60 — nothing deferred.

Shared support: `spellHasDamage` now counts zoneTickDamage / zoneCastDamage, and `spellHasEffect` counts zoneTickStatus / selfStatusAfter, so the zone rows get damage / damageEffect roles. The dmgMult upgrade patch now also scales zoneTickDamage, zoneCastDamage and healAdjacentDamage. describeSpell has one sentence for each new key. ai.js scores every new key. New statuses: `siegeMode`, `quickened`.

Merge watch (S2): the swap branch, the summon push and the buff branch were all touched by both parts; `timedStatBonus` / `quickened` may collide.
