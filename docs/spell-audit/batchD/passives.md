# Batch D, part P: the family passives

SPELL_FAMILY_AUDIT_PLAN.md §6.4 ("Family passives") and §6.5 ("New passive hook keys"). Rows live in data.js
`FAMILY_PASSIVES`. Every new key has a `PASSIVE_HOOK_KEYS` entry (type, example, reads, desc). The engine reads are
host-side in battle.js, with small reads in state.js and ai.js. Each one is commented "THE SPELL AUDIT Batch D".
New unit fields are primitives (`_ambushStrike`, `_umbralRound`, `_dealtDmgThisRound`). There are no new `state.*`
fields. Outcomes (HP, MP, statuses, stages) ride state-sync, and the floats go through the relayed
`showFloatingTextForUnit`.

## Shared helpers (battle.js, next to `_passiveSituationalStages`)
`passiveStatusDurationBonus`, `unitResistsDisplace`, `_passiveAuraHolders` (allied rows only, Chebyshev reach, never
the holder itself), `unitCritWarded`, `passiveAuraStat`, `passiveAuraRegenPct`, `passiveDeployBonus`,
`passivePullRider`, `passiveStrikeMult` (inside the capped offensive product of applyDamageToUnit. ai.js estDamage
reads the same helper).

## NEW (15)
- `passiveMountainborn` (earth, 1 SP): climbing costs no extra movement (`ignoreClimbCost`, read in findMovePath and
  getMoveTiles). Hits from higher ground deal +10% (`highGroundBonus`, on top of the height rule). Raised ground
  cannot shove it (`immuneDisplace: ['terrain']`): the build/erupt shove is refused, and a sprouting tree takes another
  tile. Mountain-tile move cost is unchanged: the hook is about levels risen.
- `passivePhotosynthesis` (nature, 1 SP): +5% regen at round end on grass / grass_2 / purple_grass / forest / forest_2 / tree (`terrainRegen`).
- `passiveUmbral` (shadow, 1 SP): the round's first basic attack out of Invisible is a crit (`invisibleCrit`; a whiff does not spend it).
- `passiveManaFont` (arcane, 1 SP): +10 flat MP at round end (`mpPerRound`, added to the MP regen. Like base MP
  regen, it only fires below max MP).
- `passiveSanguine` (blood, 1 SP): +6% regen at round end when it damaged an enemy that round (`regenAfterDealing` plus the `_dealtDmgThisRound` flag).
- `passiveSpiritOfGiving` (christmasspirit, 1 SP): adjacent allies get +3% regen at round end (`regenAura {within:1, pct:3}`, max, not stacked).
- `passiveForesight` (temporal, 2 SP): other allies within 2 cannot be crit (`allyNoCritWithin: 2`). Read in doAttack
  and in the action-mode `_hitBasic` crit roll (spells never crit).
- `passiveAftershock` (titan, 2 SP): Stagger it applies lasts +1 round (`statusDurationBonus {stagger:1}`). Stacks
  on top of Third Eye's `debuffTurnsBonus`.
- `passiveAmbush` (huntingskills, 2 SP): the first damaging spell or basic attack out of Invisible deals +40%
  (`invisibleStrikeBonus`). A basic attack passes `opts.fromInvisible`. doSpell sets `unit._ambushStrike` for a
  damaging cast out of Invisible, and the next cast, a basic attack or the round end clears it. Turret, trap and DoT
  damage never gets the bonus.
- `passiveForeman` (trapmaking, 2 SP): `deployStatBonus {hp:40, dmg:20}`.
  - +20 damage on turrets (deployTurret), summons (summonUnit), raised zombies, deployObject blasts (including the
    contact detonation) and placeTrap damage.
  - +40 HP only on a real HP pool: a turret that is not `hitsToKill`, or an object with `objectHp > 1`. 1-HP snares
    and decoys and hit-count turrets keep their shape.
  - The family block's "repair may target contraptions" is not in the §6.4 effect, so it is not built.
- `passiveHexWeaver` (witchcraft, 2 SP): Hexed targets take +25% magic from it (`finisherBonus {status:'hexed', bonus:0.25, damageType:'magic'}`).
  When a Hexed enemy dies, the hex jumps to an adjacent teammate of the fallen that does not have it yet, at the
  remaining duration (`spreadOnDeath: ['hexed']`, run before defeatUnit).
- `passiveEventHorizon` (cosmic, 2 SP): cosmic pull rows also Stagger every enemy they catch
  (`pullRider {id:'stagger', duration:1, family:'cosmic'}`). Read in the aoePull pull block of `_applyAoeDamage`
  (Gravity Well, Black Hole) and in the single-target `pull` kind.
- `passivePackTactics` (apexpredator, 2 SP): +15% against a target adjacent (8-neighbour) to another ally (`flankBonus`).
- `passiveShowmanship` (seduction, 1 SP): Charm +1 round (`statusDurationBonus {charm:1}`), and the charmed enemy also
  loses 1 ATK stage (`statusStageRider {charm:{atk:-1}}`, applied when the status lands).
- `passivePathfinder` (athleticism, 1 SP): dash / leapStrike / tackle / chargeToTarget rows get +1 range
  (`dashRangeBonus`, in getEffectiveSpellRange). Every hit the `dash` kind deals along its path is ×1.3
  (`dashDamageMult`; leapStrike has no path).

## PARTIAL: the missing half, desc rewritten to the full effect
- `passiveSnowborn`: the blizzard's blind never lands (`weatherStatusImmune {blizzard:['blind']}`, state.js weather
  strike). It never slides on ice (`noIceSlide`, `_resolveIceSlide`).
- `passiveGills`: +5% regen at round end in water / deep water (`terrainRegen`).
- `passiveWindborne`: pushes and pulls cannot move it (`immuneDisplace: ['push','pull']`). The gate is in three
  places:
  - getUnitPushDistance, which gained a `kind` argument; the pull kind passes 'pull'.
  - resolveForcedSlide, for slides an enemy drives (door guns and grapples pass raw distances).
  - The aoePull one-tile pull.
- `passiveConsecrated`: the existing `healOnceBelowPct` gains a `cleanse: 1` field: shed 1 debuff with the heal.
  The catalogue entry was updated, and no new key was added.
- `passiveFaradayCage`: Jammed enemies within 2 take 20 at round end (`auraTick {status:'jammed', within:2, dmg:20}`).
  The tick is DoT-style: armor ignored, level-scaled to the victim, and the kill is credited to the bearer. checkWin
  runs on a kill.
- `passiveChorus`: Discord +1 round (`statusDurationBonus {discord:1}`).
- `passiveChoir`: healing a Blessed ally also cleanses 1 debuff (`healRider {blessed:{cleanse:1}}`, applyHealingToUnit,
  on any heal it sends to a teammate, a top-off included).
- `passiveIronDiscipline`: other allies within 2 get +5 DEF (`statAura {within:2, def:5}`, folded into getEffectiveArmor's
  DEF soak. Max, not stacked. The HUD DEF number does not show it).

## The three Batch C skipped
- `passiveResonantVoice` (sonic, 1 SP): +1 range on ranged Sonic spells (`familyRangeBonus {sonic:1}`, getEffectiveSpellRange; range-0 rows unchanged).
- `passiveBloodlust` (vampiricabilties, 2 SP): drains heal ×1.5 (`lifeSapMult: 1.5`, live: lifeDrain and possess drains).
  The sky-drop drain (Predator Drop) now reads lifeSapMult too. A kill raises ATK 1 stage (`killStage {atk:1}`).
- `passiveJellyDrift` (jellyfish, 1 SP): the plan's "Deep Breath" is renamed because that name is the Meditation spell.
  Swims, +1 SPD stage in water (live `swim` / `terrainBonus`). Enemies it hits while they stand in water / deep water
  are Slowed 1 (`terrainHitStatus`).

## AI (ai.js, kept small)
- estDamage multiplies in `passiveStrikeMult` (high ground, flank, finisher, ambush).
- The status-value duration adds `passiveStatusDurationBonus`.
- Regen, aura and displacement keys are not scored.

## Not done / deferred
- `seedBonus` (§6.5 list): it belongs to Agriculture's Green Thumb ("Fertile Ground" was not adopted), and no row in
  this part needed it. Deferred.
- Mountainborn's "terrain cannot displace it" covers the shoves the board actually does (the build/erupt shove and a
  sprouting tree). applyTerrainDeform only lifts or lowers a unit in place, so there was nothing to block there.
- Every row was checked with `node --check` (data.js, battle.js, state.js, ai.js) and loaded through load-data.js.
  All 26 rows are in SPELL_BY_ID, every hook key is in PASSIVE_HOOK_KEYS, each family has one passive, and the names
  are unique. Not playtested (house rule).
