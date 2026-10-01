# Batch D, part U: the upgrade registry

SPELL_FAMILY_AUDIT_PLAN.md §6.4 "New upgrade rows" and §6.5 "New upgrade patch / fit keys". Registry: data.js
`SPELL_UPGRADES` (49 rows now, 31 new), fits: `SPELL_UPGRADE_FITS`, patches: `_upgApplyPatch`. Engine reads: battle.js,
plus one line pair in state.js (delayed strikes carry `ifTargetHas`). Every new upgrade lists only the rows it fits.

## Registry plumbing (data.js)

- `rows: [ids]` on an upgrade row (new, read by `spellUpgradeFits`): pins a one-row upgrade to its row(s).
- `upgradesBlock: [ids]` on a spell row, and on a `SPELL_FAMILIES` row for the whole family (new, `spellUpgradesBlocked`,
  read by `spellAllowedUpgrades`): removed from AUTO and from an explicit list. The library's UPGRADES tab (ui.js) names
  the blocked ones under THE MODE.
- New fits: `statusHit`, `foeStatus`, `directHit`, `chain`, `critable`, `healOrShield`, `shieldHp`, `areaAny`,
  `areaGrow`, `tether`, `stepTrap`, `dashHit`, `detonable`.
- `finisher` fit skips the possess kind: Exploit is off Enthrall's and Indoctrinate's pre-baked charm ×2 (F§).
- `status` fit also reads `teamStatusEffects`, and the Lingering patch (`statusDuration`) stretches them (F.g2: Sermon, Mantra).
- `deployCap` fit accepts `doorDeploy`; Surplus there writes `standingCapDelta` and battle.js `doorGunPlace` (and the
  CPU's `doorGunAiPick`) raise the SHARED standing-door cap 2 → 3 (F.g7). Surplus's text says so.
- Widen now requires `areaGrow` (an area damage cast that is not already a full 5×5). This one generic rule carries
  every "Widen is pointless, already 5×5" exclusion in the family blocks.
- `statusBonus` fix: a named status the row's finisher does not cover now JOINS its list (Exploit: Marked on a Burn
  finisher pays on either). It used to only re-price the old status.
- New patch keys: `addStatus`, `statusPayload`, `tetherDragDmg`, `set`, `weatherPatch`, `shieldDelta`, `ignoreArmor`,
  `actedTargetBonus`, `critChanceAdd`, `pullToCenter`, `tripRadius`, `chainWetHops`, `encoreAlly`, `paintTerrain`,
  `jammedArc`, `detonateOwn`, `onKillRefundAp`. `statusBonus` takes `flat` and `consume`. Listed in ui.js `_SLB2_PATCH_KEYS`.
- `spellWeatherResolved(def, weatherTypes)`: the cast-time def under a weather patch. battle.js `doSpell` calls it.

## The upgrade rows

- `upGrievous` Grievous (dirtyfighting, ghoulish, 1 SP): fit `statusHit`, `addStatus {grievous, 2}`. 10 rows.
- `upOvercharged` Overcharged (robot, cyberpunkweapons, artificialintelligence, 1): `statusHit`, `addStatus {jammed, 1}`. 12 rows.
- `upVenomCoat` Venom Coat (beastabilities, insectoid, arachnid, ghoulish, feline, archery, 1): `statusHit`, `addStatus {poison, 2}`.
  Absorbs Envenomed Mandibles and Poisoned Tips. **`racePoisonArrow` deleted.** It was nobody's RACE_TREE rung, learn-order
  entry or CPU kit, so no rung moved. Fire Arrow + Venom Coat is the poison arrow now. (three-vfx-effects.js still holds
  an orphan `racePoisonArrow` VFX mapping. It is harmless and I left that file alone.)
- `upIncendiary` Incendiary (weaponstraining, archery, cyberpunkweapons, mecha, 1): `statusHit`, `addStatus {burn, 1}`.
- `upConcussive` Concussive (earth, titan, kaiju, dirtyfighting, horns, athleticism, militarysupport, 2): `statusHit`,
  `addStatus {stagger, 1}`. Absorbs Danger Close. "One per kit" is not enforced (there is no per-kit upgrade rule).
- `upFairyFire` Fairy Fire (fae, 1): fit `area`, `addStatus {blind, 1}`. Glitterburst, Glitter Bomb, Fae Ring.
- `upSticky` Sticky (ooze, 1): fit `foeStatus`, `addStatus {goo, 1}`. Goo Shot, Absorb, Toxic Nova and Ooze Trail.
  Engine: a no-damage terrainCreate now lands its statusEffects on the enemies standing in what it painted. Before this,
  Ooze Trail's own Slow 1 was never applied. It is the only no-damage terrain row with statuses.
- `upAnoint` Anoint (light, angelic, biblestudy, holydefense, 1): fit `healOrShield` (heal, shield, aoeShield, healAll,
  selfHeal), `addStatus {blessed, 1}`. On a healAll row it goes into teamStatusEffects. Engine: aoeShield now lands the
  row's statusEffects on every ally it shields. heal / shield / selfHeal / healAll already did (Batches B and C).
- `upReinforced` Reinforced (holydefense, light, psychic, 1): fit `shieldHp`, patch `shieldDelta: 60` (to shieldHp, else shield).
- `upSanctifiedGround` Sanctified Ground (angelic, 2): rows Purify + Sanctuary, fit `areaAny`, `aoe {preset: '5x5'}`
  (the existing area patch handles a no-damage area: cleanseArea and zoneHeal both read the mask / radius).
- `upArmorPiercing` Armor-Piercing (weaponstraining, 2): `singleDmg`, `ignoreArmor: true` (read by `_applyDamageSpellHit`). Dead Eye.
- `upSteadyRest` Steady Rest (marksmanship, 1): `singleDmg`, `actedTargetBonus: 30` (read by `_applyDamageSpellHit`).
- `upLoadedDice` Loaded Dice (gambling, 1): fit `critable`, `critChanceAdd: 0.15` gives the row a `critChance`. Spells could
  not crit before. Engine: `_spellCritRoll` (seeded rng, ×getCritMultiplier, `isCrit` on the hit) in the single-hit and
  chain paths, `_applyAoeDamage` and `_applyMultiHitDamage`. Jackpot and Dead Man's Hand (every card rolls).
- `upBarbedRope` Barbed Rope (ropework, 1): fit `tether`, `tetherDragDmg: 35` stamps `dragDamagePerTile` on the row's
  Tethered. applyStatusPayload keeps it as `unit._tetherDragDmg`, and `_tetherFollow` reads it (default 20). Lasso.
- `upUndertowCharge` Undertow Charge (deepsea, 1): row Depth Charge, `pullToCenter: true`. Engine: the aoe kind now passes
  `pullCenter`, so the flag works on a plain area as well as on aoePull.
- `upTripwire` Tripwire (trapmaking, 1): fit `stepTrap`, `tripRadius: 1`. The deployed object carries it, and `_trapCovers`
  (the walk stop in getPathPickupEvent and the arrival fuse in resolveTileArrival) springs it on an enemy stepping next to
  it. Spring Snare, Scrap Mine. Placed traps (Trapdoor) are out of scope. Fix on the way: a sprung status trap now uses
  the trap's own statusEffects (the caster's upgraded copy, e.g. Lingering) before the base row's.
- `upTemperedGlass` Tempered Glass (prismlattice, 1): row Prism Mirror, `set {mirrorHp: 3}` (placeMirror reads mirrorHp).
- `upSoulTax` Soul Tax (demonicabilities, 2): row `raceVoidContract` (Devour Soul), `set {drainPct: 0.8}`.
- `upBloodPrice` Blood Price (blackmagic, 1): row Baphomet's Rite, `set {selfDamagePct: 0.25, dmg: 190}`.
- `upGraveRobber` Grave Robber (necromancy, 1): row Raise the Dead, `set {zombieHits: 5}`.
- `upCalcium` Calcium (bonedensity, 1): row Reassemble, `set {selfHealPct: 0.4, cleanse: 1}` (the escape kind reads both).
  The numbers follow §6.4 (40% + cleanse), although R.1 has since dropped the base heal to 20%.
- `upBottomless` Bottomless (ghoulish, 1): row Carrion Feast, fit `cooldown`, `set {cooldownRounds: 0}`. **Offered on 0 rows
  today**: Carrion Feast has no cooldown until S1's rewrite lands (CD 2 + corpse gate). The "respawn delay is 3 rounds"
  half is **deferred**: it needs S1's respawn-delay key, so add it to the patch's `set` once that key has a name.
- `upRestless` Restless (haunted, 1): row Haunt, `statusPayload {id: 'haunted', set: {restless: true}}`. Engine:
  applyStatusPayload marks `unit._hauntRestless`. In applyDamageToUnit's death branch, `_restlessHauntJump` hands the
  Haunted rounds left to the dead unit's nearest teammate (still Restless), with a log line and a floating text.
- `upNightfeeder` Nightfeeder (vampiricabilties, 1): row Bat Swarm, `weatherPatch {weather: 'bloodRain', patch: {set:
  {aoeLifeDrain: 0.45}}}`, applied at cast in doSpell while Blood Rain is anywhere on the board. **Depends on S1's
  `aoeLifeDrain`** (Bat Swarm 30%). If S1 names that key differently, change the inner `set`.
- `upConductive` Conductive (lightning, 1): fit `chain`, `chainWetHops: 1`. When the chain touches a Soaked enemy (the
  status, or `_unitIsSoaked`), it gets one more hop at the last hop's damage. Chain Lightning.
- `upReprise` Reprise (sonic, 2): row Anthem (`warCry`), `encoreAlly: true`. The warCry branch gives Encore's AP to the
  nearest ally in the aura who has finished acting and has not had an Encore this round (Encore's own rules).
- `upHush` Hush (sonic, psychic, infernalcourt, politics, conspiracyknowledge, 1): fit `foeStatus`, `addStatus {silence,
  1, ifTargetHas: 'discord', first: true}`. Engine: applyStatusPayload skips a payload whose `ifTargetHas` the target does
  not wear. The entry goes first, so only the ALREADY Discorded are silenced. state.js delayed strikes carry the key.
  (This is a payload-level key, separate from S2's row-level `statusIfTargetHas` for System Crash.)
- `upTidewater` Tidewater (water, deepsea, jellyfish, piracy, 1): fit `directHit`, `paintTerrain {water, r0, 2 rounds}`.
  The existing timed-terrain painter in `_runPostEffects` does the work. Only single damage-kind hits
  (Spout, Boarding Rush, Jelly Sting, Jelly Net).
- `upDaisyChain` Daisy Chain (lightning, robot, computerhacking, cyberpunkweapons, 2): fit `directHit`, `jammedArc
  {mult: 0.5}`. Engine: `_applyJammedArc`. If the target was Jammed before the hit, half the damage goes to every Jammed
  enemy next to it.
- `upDetonate` Detonate (engineering, advancedtechnology, spygear, prismlattice, 1): fit `detonable` (deployTurret except
  the 5G aura tower, deployObject), `detonateOwn: true`. Engine: a new doSpell branch ahead of deployObject. When the
  row is cast on the caster's own live turret or object from the same spell, it spends the cast and blows it through
  `detonateDeployedObject`: 3×3, twice its remaining HP, at least its own blast. Deploy Turret, Tesla Coil. Prisms are
  out of scope (S2 builds the prism detonation, Shatter the Lattice).
- `upOverdrive` Overdrive (athleticism, drivingskills, football, apexpredator, 1): fit `dashHit` (dash, tackle),
  `onKillRefundAp: 1`. Engine: the dash path runs `_applyOnKillRiders` on its first kill. Fix on the way:
  `_applyOnKillRiders` now treats a `_dying` target as killed. defeatUnit flips `.dead` about 800 ms later, so Jurassic
  Jaw's on-kill heal + AP had never fired.
- `upFrostbite` Frostbite, the missing half: patch `statusBonus {frozen, ×1.5, flat: 50, consume: true}` writes
  `bonusVsStatus.extra`. applyDamageToUnit adds +50 on a Frozen target and ends the Frozen (floating "THAW!"). Every
  resolver that threads bonusVsStatus carries it.

## Engine reads that came with them (battle.js)

- multiHit lands the row's statusEffects with the first hit, and ricochet lands them on its first victim. Neither kind
  read them before (no existing multiHit / ricochet row has statuses, so nothing changes until an upgrade adds one).
- lifeDrain now passes the row's statusEffects into the hit. Lifetap / Frenzy (Grievous), Kiss of Decay / Ghoulish Bite
  (Poison) promised them in their text and never applied them.
- Online: the new unit fields (`_tetherDragDmg`, `_hauntRestless`) are plain values on units and ride state-sync. Every new
  moment uses showFloatingTextForUnit / applyDamageToUnit / detonateDeployedObject (already relayed). No new `state.*`
  field. Everything runs host-side.

## upgradesBlock applied (the family blocks' "Upgrades." exclusions)

Row-level (plan line, row, block). Rows marked * were already excluded by a fit; the block is written anyway so a later
fit change cannot reopen them:
2734 Ice Slide Blast* · 2774 Call of the Deep Blast* · 2813 Updraft Surplus* · 2832 Trunk Throw Blast · 2896 Shadow Realm
Long Reach + Lingering (anything but Efficient) · 2977 Avalanche Strike Blast · 3096 Exorcism Blast (Forked left as a player
choice, per the line) · 3113 Revive Efficient (Long Reach only) · 3134 Chooser of the Slain Efficient (Long Reach only) ·
3153 Chivalry Lingering* · 3170 Walls of Camelot Widen* · 3248 Star Crossed Lingering* · 3300 Ego Death Blast · 3430
Reassemble Lingering* · 3444 Cold Spot Widen* · 3464 Outbreak Widen* · 3480 Ghoulish Bite Knockback* · 3512 Sleep Paralysis
Lingering · 3512 Dream Siphon Blast* · 3535 Singularity Undertow* · 3555 Blue Screen Blast* · 3589 EMP Burst Widen* · 3589
Kill Mode Widen* · 3606 To the Moon Blast + Forked* · 3653 Trapdoor Widen* · 3671 Free Energy Efficient · 3685 Cloning
Machine Overclocked* · 3701 Chain Reaction Widen* · 3720 Photon Scatter Widen* · 3739 War of the Worlds Widen · 3739
Abduction Beam Forked + Blast* · 3794 Gravity Well Undertow* · 3794 Black Hole Undertow + Widen* · 3794 Supernova Widen* ·
3814 Paradox Blast · 3831 Strange Loop Lingering · 3831 Fractal Needle Blast* · 3846 Tune Frequency Lingering* · 3863 Full
Burst Widen* · 3880 Vehicular Manslaughter Blast + Widen* · 3903 Feral Dive Blast* · 3916 Stampede Blast + Forked* · 3929
Bull Rush Blast* · 3955 Ninefold Scratch Forked + Blast* · 3994 Prophecy of Disaster Efficient · 4008 Cataclysm Stomp Widen*
· 4093 Hypnotic Pulse Lingering · 4126 Mandible Strike Ricochet + Forked + Blast* · 4144 Cocoon Blast + Forked · 4183 Toxic
Nova Widen* · 4224 Eightfold Lash Ricochet + Forked + Blast* · 4249 Poseidon's Wrath Widen + Blast* · 4276 Underdog Spirit
Lingering* · 4293 Team Strike Blast* · 4293 Everybody Up Widen* · 4312 Rampage Exploit* · 4331 Pressure Point Lingering ·
4350 Ki Wave Hot Loads* · 4368 Blade Waltz Widen · 4535 Scatter Shot Forked* · 4554 Take Aim Blast + Forked + Ricochet ·
4599 Whistle Overclocked* · 4617 Fan the Hammer Long Reach* · 4617 Slap Leather Lingering · 4637 Taser Blast · 4656 Drive-By
Knockback* · 4669 Steal from the Rich Lingering* · 4700 Suppressive Fire Blast + Ricochet + Forked* · 4753 Flat Earth Blast
+ Ricochet + Forked · 4778 Knife Throw Knockback · 4829 Draining Embrace Forked* · 4848 Stadium Show Widen* · 4885 Mimicry
Lingering* · 4903 Fae Ring Widen · 4922 To Be Continued Blast · 4938 Freeze Breath Lingering (the line's "consider
excluding") · 4972 Double Down Long Reach + Lingering* · 4986 Elephant Surplus · 5021 Mirror Shard Ricochet*.

Family-wide lines, written as row blocks on the rows that still took the upgrade: 3324 Fallen Angel "no 5×5 in this
family": Widen off Fallen Grace and Wrath of the Watchers · 3367 Infernal Court "Blast is pointless": no row took it ·
3568 Internet Addiction "No Blast": no row took it.

Family-scoped rule (F.g5, `SPELL_FAMILIES.livingstone.upgradesBlock: ['upLinger']`): no Lingering anywhere in Living Stone
(Petrify, Stoneform).

The lines that give an explicit `upgrades: [...]` list (Scatter Shot, Take Aim, Steal from the Rich, Flat Earth, Knife
Throw, Mirror Shard, Freeze Breath) are written as blocks of the upgrades the line names, not as explicit lists. An explicit
list would freeze the row against every later upgrade, including this batch's family upgrades.

Not applied: Bumper Crop's Widen (the row does not exist yet; S2 builds it, and Widen's `areaGrow` fit already refuses a
5×5). Psychic Beam's "no Empowered until re-costed": it is re-costed (80 dmg), so there is no block. Every positive "X takes
Y" line is left to AUTO.

## Not done / notes for the lead

- `lullabyRangeBonus` cleanup (§6.5): the hook and its read are already gone from the code. Nothing to remove.
- No ai.js change: no new heal kind or zone came in. CPU kits can now roll the new upgrades through
  `buildRandomUpgrades`, and the AI never casts Detonate on its own deployables.
- The library's UPGRADES tab edits roles / families / requires / patch. It shows `rows` (pins a row) only as part of
  the row, so check that an export round-trip keeps `rows` before baking.
