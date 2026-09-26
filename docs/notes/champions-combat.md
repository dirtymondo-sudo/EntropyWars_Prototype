# Notes: champions-combat

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Battle rules, champ rework, races, Nexus/Arena, targeting, badges.
Append new notes for this system at the end of this file.

## ⇄ RESERVES — the bench in the respawn modes (2026-09-14, local delivery)
Match-select CONFIG → **RESERVES: Off / ⇄ Bench** (match-select.js, sticky
localStorage `ew_reserves`, offered only when the mode has `respawns` and is
not Clash / FFA; mirrored into map.js `_msReserves` → `_msConfirm` sets
`state.reserves` and sizes the party like Gauntlet: `CONFIG.teamSize` =
`RESERVE_RULES.roster` (8 — the Team Archive's cap), `CONFIG.gauntletDeploy`
= `RESERVE_RULES.deploy` (4, the chosen team size caps it lower), SPAWNS
sliced to the deploy). Constants: data.js `RESERVE_RULES` (on `window`).
The Gauntlet plumbing (battle.js `state.bench`, `doSwitch`,
`_gauntletPartitionBench`, the replacement modal) is shared through ONE gate,
**`_benchOn()`** (= Gauntlet OR `_isReservesMatch()` = `state.reserves`, which
SYNCS — never gate on CONFIG there); every site that read `_isGauntlet` for
the bench reads it now (partition, wipeout counts, spawn zones, the SWITCH
blade, the party dock strip, the AI retreat). The reserves-only rules read
`_isReservesMatch()`: **(1) the bench is a rotation, not a hospital** — a
switch keeps HP / MP / lingering statuses (stat stages + shield reset, as in
Gauntlet), nothing heals on the bench; **(2) death owes the ladder, the
ladder follows the seat** — map.js `defeatUnit` keeps `_respawnIn` and calls
`_reserveQueueSeat(fallen)`: the human picks at the death (the Gauntlet modal
with `seat: true`, `fallenId`, `rounds`; WAIT keeps the fallen unit; hud.js
`GauntletReplaceModal` → `_reserveSeatPick(player, reserveId|null, slot,
resume)`), the AI takes its healthiest free reserve above `seatMinHpPct`;
the promise is `fallen._seatFillId` / `reserve._seatFor` (a promised reserve
leaves the FREE list — `_gauntletReserves(player, { free: true })`, the
switch verb's read); NOTHING moves until `processRespawns` revives the
fallen unit on the clock at a zone the team holds (the Nexus spawn lockout
applies), then its tail calls `_reserveTakeSeat(unit)` — the reserve stands
where the fallen unit respawned (its own HP, Spawn Guard) and the fallen
unit revives ON THE BENCH: one body per death, on the ladder's clock; **(3)
switching costs the turn, not a spawn** — `switchApCost` 2, the incoming
unit acts with the leftover AP, and `_switchesLeft(player)` caps voluntary
switches at `switchesPerRound` (1) per team per round (`state.
_switchesThisRound`, reset at the round transition + match start; Gauntlet
stays uncapped). **THE COUNTER-PICK CHIP**: hud.js `_hrlgReserveMatchup(r,
st)` = ▲ enemies the reserve hits WEAK / ▼ enemies that hit it WEAK, the
same `getTypeDamageMultiplier` read as the damage roll, gated by
`_isUnitVisibleToViewer` (screen-true, RULE #2); it rides the switch blade's
`note` (`noteColor`) and the seat modal's rows. **ONLINE (RULE #2)**:
`doSwitch`, `_gauntletDeployReserve` and `_reserveSeatPick` are wrapped in
online.js (the `bench` game-action — not `engine`: a seat pick names a DEAD
seat during anyone's turn); the host validates by the SENDER (`remoteP`
owns the switching unit AND it is the active unit; the pending replacement
is the sender's). A human seat is LOCAL **or REMOTE** (`_benchSeatIsHuman`)
so the host waits for the guest's pick; the guest's modal reads the synced
`_gauntletPendingReplace`. This also fixes Gauntlet's switch, which was
host-only. NOT BUILT: the online LOBBY has no RESERVES toggle (its friendly
config carries mode / map / teamSize / rounds only) — a reserves match is a
VS-CPU launch today; the engine + relay are ready for it. `npm test` runs
`reserves.test.js`. Unseen live (RULE #1c): the seat modal over a paused
enemy turn, the chip's colours on the blade, the dock's 🪑 tag.

## TRAINING MATCH (instant CPU turns vs a human) — added 2026-09-07
Match-select → CONFIG column → **CPU TEMPO: Cinematic / ⚡ Training**
(match-select.js, sticky via localStorage `ew_training_match`; mirrored into
map.js `_msTraining` → `_msConfirm` sets `state.trainingMatch`). The human
plays P1 normally; whenever a CPU-controlled unit becomes the active blitz
unit, battle.js `_syncTrainingTurbo` (called from `_continueBlitzWithUnit_impl`)
flips `state._aiTurbo` on: `_skipVisuals()` → true, camera + animations
forced off (restored from `_preTurboVisualPrefs`), `getDevSimSpeedMultiplier`
→ `TRAINING_TURBO_MULT` (64), `_waitForAnimationsThen` tight poll, AI
telegraph/activation delays zeroed, SFX muted (audio.js). It's cleared for
the human's units, at the end-of-round sequence, in `finalizeMatch` and at
match start. Floating damage numbers are NOT visual-gated so the CPU's hits
still pop. Other launch paths (campaign, MD, spell lab, `_selectMode` labs)
reset `state.trainingMatch = false`; online never turbos (skip-listed in
online.js). Renderer/VFX gates that used to read only
`devAutoSim && !_devSimShowAnims` now also honour `state._aiTurbo`
(three-renderer.js `actionGlowStart`, three-vfx-effects.js timers, state.js
storm lightning). Blitz-turn modes only — Simul has no per-side turn.
**Imitation (same session):** in a training match the CPU LEARNS from the
human. At each human doMove/doAttack/doSpell/doGuard, battle.js
`_imitObserve` calls ai.js `window.aiScoreMargin(unit, action)` — which
runs the CPU's own ranking (`rankCandidates`, now shared with `aiTakeTurn`)
for that unit, finds the human's action among the candidates (a move the
scorer never proposed is scored synthetically: joint move×action value −
tile danger) and returns human − CPU-best score margin. On a disagreement
a random subset of `AI_WEIGHT_DEFAULTS` keys is probed by finite
differences (`_aiWeightProbe` override in `getAIWeight`) and each key that
closes the gap steps 2% of its range, clamped, into `_aiTrainedWeights`
(the same champion table the A/B lab tunes; persisted via saveAIWeights).
Match-end log line summarises; `window._ewImitationSnapshot()` for numbers;
`EW_AI_DEBUG` logs each disagreement; kill-switch `EW_NO_IMITATION`.
Stats key `ai-imitation-stats-v<schema>`. Reset = Training panel → Reset.
The match-end REPORT is a persistent panel (`#imitReportPanel`, created by
battle.js `_imitShowReport`, z-index above the result overlay) with Export
JSON / Copy / Close; it hides on `hideResultOverlay` and at the next match
start; `window._ewImitationReport()` reopens the last one. (Also fixed
2026-09-07: the Arena victory tally zipped P1/P2 detail rows by index and
crashed `showResultOverlay` when only one side had a Bounties row.)

## ENTROPY STRIKE — THE SIX APOCALYPSES (typed team attack) — added 2026-09-07
The full-gauge team attack is no longer typeless: the ⚛ ENTROPY row on the
bezel now OPENS a picker (hud.js `_hrlgEntropyBlades`, `actionMenuView ===
'entropy'`, gated in ui.js `chooseActionMenu`) with one row per damage
type — **For All Mankind** (human) · **Invasion Day** (alien) ·
**Revelations** (divine) · **Hell on Earth** (unholy) · **Robot Uprising**
(tech) · **Reality Shift** (anomaly). Catalogue: data.js
`ENTROPY_STRIKE_TYPES` / `ENTROPY_STRIKE_TYPE_ORDER` (also on `window`);
read it through battle.js `getEntropyStrikeType(id)`. Damage: `doEntropyStrike
(unit, strikeType)` passes the type as `spellType` to applyDamageToUnit, so the
TYPE_CHART judges every victim (weak ×1.30 / resist ×0.75 + the trigger's
STAB) — no element layer. `getEntropyStrikeForecast(unit, type)` (weak /
resist / neutral counts, avg mult, stab) feeds the picker's intel chips and
`getEntropyStrikeBestType(unit)` (the AI's pick, ai.js `scoreEntropyStrike`
→ `strikeType` on the candidate; also the default for any caller that omits
the type). Presentation: `_ewsPlayCinematic` is a shared skeleton (typed
banner `.ews-t-<id>` in styles-cinematic.css, splitscreen charge, crane,
per-enemy camera beats, restore) that delegates every beat to the type's
DIRECTOR in `_EWS_DIRECTORS` (siren / pane / world / enemyCam / lead /
strike / resolve + FIXED chargeMs/staggerMs/resolveMs). Directors use the
CineFX kit (cineGrade, cineInsert — new kinds k-stamp / k-signal /
k-scripture / k-terminal / k-glitch — cineFreezeFrame, cineSlowMo,
cineDollyZoom, the named shots) and the VoidStage (`opts.maxMs` added so
the ultimate holds the void through every strike; scarcity gate bypassed
on purpose). RELAY RULE: VFX that online.js relays by itself
(sigUFOFleet3D, spawnProbeDescent3D, tileGlow) fire only when
`!ctx.relayed`; the DOOR synth kit (`playDoorSfx`) is NOT relayed so both
screens voice it. Online: `strikeType` rides the `doEntropyStrike`
game-action and the `entropy-cine` relay; Simul plan steps carry it too.
`npm test` runs `entropy-strike.test.js` (catalogue ↔ directors ↔ CSS).

## NEXUS REWORK — Arena's zones are the economy — added 2026-09-12
data.js `NEXUS_CAPTURE_THRESHOLD` is **4** (was 6) + `NEXUS_HOLD_HEAL_PCT`
(0.15) / `NEXUS_HOSTILE_DMG_PCT` (0.25) / `NEXUS_CUBE_DMG_PER_ZONE` (0.5,
cap `NEXUS_CUBE_DMG_MAX_MULT` 2). ONE tick engine — ui.js
`_nexusApplyTicks(nex, section, team, ticks, creditUnit)` — fed by three
sources: `channelNexus` (1 AP, +1), **`nexusOnUnitArrive(unit)`** (the
step-on tick: +1 per unit per zone per round, `unit._nexusStepStamp`;
called from battle.js `completeMoveAlongPath` next to `checkFlagPickup` —
four bodies on a fresh 2×2 zone flip it on the spot; an enemy already
standing there = CONTESTED, no tick) and `processNexusIncome` (round
transition, +1 / +2). A tick against an OWNED zone drains the owner's
pips first; the zone goes neutral when they hit 0 (the enemy loses it
right there), then your own pips build. **No instant Nexus-Dominance win
any more** — the prize is the **SPAWN LOCKOUT**: map.js
`getRespawnZoneFor(player)` → the home spawn nexus while you hold it,
else the nearest other zone you hold (the centre, their spawn), else
`{ locked: true }` and `processRespawns` parks the unit (`_respawnIn` 0,
`_spawnLocked`) until the team reclaims a zone; `_respawnTileSafe` skips a
zone tile that was dug into lava / flooded / walled (zones are BUILDABLE:
battle.js `isObjectiveTile` now guards the Cube tiles ONLY — reshape /
dig / flood / block / terrainCreate all work on nexus and spawn tiles;
zone membership is by coordinate, never by terrain key). Zone perks
(battle.js end-of-round block, was spawn-only): every unit standing in a
zone reads the NEXUS owner first (`getNexusAtUnit`) — ally of the owner
heals HP + MP + cleanse, enemy of the owner burns `NEXUS_HOSTILE_DMG_PCT`
(the paced scorch beat); map.js `getSpawnZoneOwnerAt` answers the spawn
nexus's owner in Arena (0 while neutral), the home team elsewhere. Cube
siege: ui.js `getCubeDamageMult(player)` = 1 + 0.5 per held zone that is
not your own spawn, applied in doAttack's Cube branch (both paths, `⬡
SIEGE ×1.5` float). Presentation goes through ONE door — ui.js
`_nexusFx({ kind: tick|contested|neutral|capture|lockout|restored, section,
player, x, y, prog, thr })` (floats at the zone centre in the new `nexus`
float kind, the `_nexusProgress/_nexusChannel` auras, banners, SFX,
shake) — routed through `window._nexusFx` so online.js's wrapper relays it
(`nexus-fx`; the guest replays with `relayed = true` = banner / SFX /
shake only, the floats + VFX ride their own relays). Renderer:
`rebuildNexusWalls` draws EVERY zone (spawn nexuses included — the
sanctuary curtain / spawn wash skip them in Arena) as a terrain-hugging
perimeter: per-tile owner wash on that tile's top, rim line + halo on each
exposed edge at `tileTopY`, gradient SKIRTS down cliff faces where the
ground steps across an edge or between two zone tiles, a short additive
curtain; `_computeNexusSerial` folds `_terrainVersion / _heightVersion /
_voxelVersion` in so building on a zone redraws it that frame. The zone
meter is PIPS (`.nb-pips`, one per tick, `nb-pop` on change, `⛔ Pn LOCKED
OUT` under a stolen spawn). HUD: CHANNEL row shows `⬡ n/4` (+ `ONE MORE`),
the scoreboard's `⛔ Pn SPAWN LOCKED`, dead turn chips say NO SPAWN POINT.
AI: `scoreNexusChannel` / the Arena macro goals score the lockout (we
hold nothing → +200 / sprint; their last zone or spawn → lock them). Legacy
`nexus_dominance` labels stay for old records. `npm test` runs
`nexus-rework.test.js` (source guards for all of the above).

## ARENA RULES — fixed Key pool + round safety cap — added 2026-09-07
Arena (state.js `MULTIPLAYER_MODES.arena`) scatters a FIXED pool of
`keySpawnCount` (5) Keys and wins THRESHOLD STABILIZED when one team CARRIES
`keysToWin` (3) at once; `roundLimit` is 100 — a safety cap only (composite
Arena score, then Sudden Death), because a match must end on a real win
condition (AI training / balancing wants every objective live, comebacks
included; a tighter cap returns later). Read the numbers ONLY through
battle.js `getArenaKeyRules(mp)` / `getKeysToWin(mp)` — modes without the
two fields keep the legacy "carry every Key on the board" rule and the map's
`CONFIG.winHourglasses`. A fixed pool never restocks (the round-10
`spawnPeriodicHourglasses` top-up is skipped). `state.hourglassTarget` is set
at spawn for ai.js `assessWinCondition` and syncs to the guest. HUD tower
block shows `🗝 held/needed`. See PLAYTEST_NOTES "ARENA RULES PASS".

## THE PASSIVE BATCH (CHAMP_REWORK_PLAN Phase 3) — added 2026-09-07
Every §5.2 passive is a `PASSIVE_DEFS` row (data.js) whose HOOK FIELDS the
engine reads through `unitPassiveValue(unit, key)` — never the race. The
header comment above `PASSIVE_DEFS` lists every field and its consumer; plan
§5.7 has the per-passive table. Rules that came with it: `getEffectiveRange
(unit, opts)` — pass `{ item: true }` for thrown-item reach (Longshot is
basic-attack only); `applyStatStageBoost(…, { perm: true })` makes a
permanent ledger entry (`statStageMods[i].perm`, skipped by the tick, the
badge timer and buff purges; death resets it); `unitCryptidHiddenFrom` rides
`isUnitConcealedFrom` (renderer + AI + nameplate eye) and is gated again in
`doAttack` / unit-targeted `doSpell`; `_applyRoundStartPassives()` runs
before EVERY `buildBlitzTurnOrder()` (Lycanthropy's `wolfForm` carrier, Mad
Genius); `buildBlitzTurnOrder` tiers by `getEffectiveSpd` (stages reorder
initiative) and Quickdraw heads its tier. New status fields: `healTakenMult`
(applyHealingToUnit), `magicDamageTakenMult` (applyDamageToUnit, magic only).
Adding a passive = one `PASSIVE_DEFS` row + one `RACE_PASSIVES` id + a
`PASSIVE_VALUE` price in check-grades.js; `npm test` (champ-rework.test.js)
fails on a missing def, a slot overflow (flying counts), an unpriced id, or a
`PLANNED_PASSIVE_ALLOWANCE` row for a race that already wears its passive.

## THE STATUS BATCH (CHAMP_REWORK_PLAN Phase 4) — added 2026-09-07
Every §5.1 status is a `STATUS_DEFS` row (data.js, the Phase 4 block after
`wolfForm`; its header comment lists every hook field → consumer). The
engine reads FIELDS, never ids: `countsAs` (bonusStatusMatches — Corroded
is Burn AND Poison), `blockSpells` (`unitSpellsBlocked` — the ONLY
silence gate; never call `unitHasStatus(u,'silence')` at a cast site),
`rangeDelta` (getEffectiveRange, generic), `basicAttackStatus`
(Incendiary), `hpMaxMult` + `onApply`/`onRemove` (Monstrous; the hooks
fire from applyStatusPayload / clearStatus — `onRemove` runs BEFORE the key
is deleted), `grantsFlight` (map.js canFly + `levitateUnit` /
forceGroundUnit), `shedMotes` (finishMoveAt → dropPixieDust, blind on
step), `linkEcho` (`_procLinks` after every damage application; partner
ids ride the PAYLOAD: `partnerId` / `allyId`), `dragDamagePerTile`
(`_tetherFollow` in finishMoveAt), `fear` (`_fearFleeMove` at the
victim's activation), `realm` (`isUnitRealmShieldedFrom` — target /
damage / heal / status gates). state.js `getNextBlitzUnit` skips ANY
status with blockMove + blockAction (stun, frozen, Stoneform). Adding a
status = one row + `STATUS_LIBRARY_DESCS` + `_STATUS_EFFECT_IDS` +
`_HRLG_SB_COLORS` (+ ai.js `HARD_CC` / data.js `_MF_*` if it denies
turns); champ-rework.test.js fails on a missing registry. §5.6 RULE: a
non-capstone `statStageBoost` is ±1 (ring-3 capstones ±2; Calcify −2) —
the test enforces it. Possessed / Infected are rows only until the
`possess` kind (Phase 5 wave B) wires `getControllingPlayer`.

## TWIN NODES (race-tree nodes that hold two spells) — added 2026-09-07
CHAMP_REWORK_PLAN §4 / §4.6 (Phase 2). A `RACE_TREE` entry (data.js) may be
a 2-id array: the node holds two ALTERNATES, exactly one equips (1 slot,
the node's ring cost + tier), the other is a free respec. Read rows only
through `getRaceTreeRow` (pairs intact) / `getRaceTreeSpells` (faces =
first alternate, the flat shape every legacy caller expects) /
`getRaceTreeAlts` (`{ R3: [a, b] }`) / `getRaceTreeAllIds`. A unit's
tree (`buildUnitSpellTree(race, cls, sec, equippedIds)`) resolves each twin
node to its equipped alternate else its face and exposes `tree.alts`; ALWAYS
pass the equipped ids so the node wears the right spell. `isTreeLoadoutLegal`
rejects both alternates at once, `treeLegalSubset` keeps the first,
`buildTreeLegalLoadout` rebuilds the tree per pick. Builder: ⇄ badge on the
chip, "⇄ other" under the name, one picker overlay shared with the
Freelancer sockets (`twinPick` / `flSocketPick`), swap-in-place via
`twinCandidate`. Saves unchanged (flat `customSpells`); online host
validation already funnels through `treeLegalSubset`. Adding a twin = one
row edit + `npm test` (content-schema.test.js checks the shape, tiers,
one-alternate rule, repair and random walks).

## PHASE 5 WAVE A (CHAMP_REWORK_PLAN §5.9) — added 2026-09-08
The first spell wave: 16 new `RACE_ABILITIES` rows on their §6 twin nodes
(QB Sneak, Transform, Snowball Volley, White Christmas, Ice Shard,
Incendiary Rounds, Grave Chill, Tail Whip `raceDinoTailWhip`, Apex Roar,
Treeline Retreat, Stoneform, Piercing Arrow, Freeze Breath, Sky Tackle,
Cluster Rockets, Plasma Cannon), renames with ids kept (Stampede, Arrow
Volley, Heat Vision, Flat Earth), Perch Form deleted. New kinds:
**`transform`** (battle.js `doSpell` branch toggles the `carForm` /
`mechaForm` carriers at 99 rounds; the model rides `UNIT_ANIM_OVERRIDES
[race].formSprites` via `unitStanceForm` / `_formSpriteFor`, which the
apply/revert sprite beats honour) and **`tackle`** (the damage branch +
`_runPostEffects`: carry `pushDistance` down the charge line, caster lands
one tile behind, `collisionBonus` / `collisionStatus` on a wall or body).
New flags the engine reads: `executeBelowPct` (`_applyExecuteRider`, also
on the delayed Take Aim record → state.js), `onKillHealPct` /
`onKillRefundAp` (`_applyOnKillRiders`), `lineWidth` 2–3
(`getLineSpellLaneOffsets` — `_applyLineDamage`, ray footprint, direction
preview), linePush `collisionBonus` / `collisionStatus` /
`collisionStatusBoth`, `terrainDeform.flatten` (+ `radius`), zoneDebuff
`expireTerrain`, STATUS `spellRangeDelta` (`getEffectiveSpellRange`).
Fixes that came with it: `damage`-kind `pushDistance` and escape-kind
`statusEffects` were never applied (now they are — plan §10 #27). Adding
a wave-B/C spell = data row + tree node + a `SPELL_MAP['<id>']` family
alias in three-vfx-effects.js + a `WAVE_A`-style row in
champ-rework.test.js; a new KIND also needs `SPELL_KIND_META`, a `doSpell`
branch, ai.js `scoreSpell` + `findSpellTarget`, hud.js parts, ui.js
`_SLB_KINDS`. `npm test` guards all of it.

## PHASE 5 WAVE B (CHAMP_REWORK_PLAN §5.10) — added 2026-09-08
Control + links: ten rows on ghost / zombie / demon / shaman / vampire /
succubus and five kinds. **`possess`** (Possession, Enthrall, Infect,
Thrall Bite): battle.js `possessUnit` applies the control status and
FLIPS `unit.player` to the caster's seat (`_origPlayer` = home) — every
`unit.player` consumer (HUD gate, `runComputerTurn`, fog, targeting, the
online guest-emit gate) hands the body over with no special cases;
data.js `_releaseControl` (the statuses' `onRemove`) and battle.js
`releasePossession` (map.js `defeatUnit` calls it) hand it back;
`maybeAdvanceTurn` spends one activation per controlled turn;
`showPossessedActivation` opens the turn (relayed as
`possessed-activation`). Read `getControllingPlayer(unit)` /
`unitHomePlayer(unit)`, never `_origPlayer` directly. **`link`** (Soul
Bind, Voodoo) and **`transfer`** (Sacrifice) are the first TWO-CLICK
casts: `SPELL_KIND_META.twoClick`, the first legal click is remembered in
`state._spellPick1` `{ id, spellId, x, y }` (nothing spent; the gate sits
right before doSpell's commit point), the second resolves; the drum /
prompt / hud chip follow `_twoClickPick(spell)`; `clearSpellPick()` on
cancel / ESC / turn end; online the guest picks locally and its second
click carries `partnerId` (host dispatcher seats it); `_spellPick1` is
skip-listed + guest-local; the AI stashes the partner in
`_aiPairPick[spell.id]` and the executor seats it. **`shadowRealm`**
(Shadow Realm★) crosses `partnerId` on both, director
`CINE_SEQUENCES.raceShadowRealm` = the `shadow` Void palette (+ css
`vp-shadow`). **`cannibalize`** is corpse-targeted through
`spellTargetsCorpses(spell)` (raiseDead OR meta `corpseTarget`) — use it,
never `kind === 'raiseDead'`. Adding a possess / link spell = a data row
+ tree node + `SPELL_MAP` alias + a `WAVE_B` test row; `npm test` guards
the kinds, the seat flip, the two-click gate and the relay.

## PHASE 5 WAVE C (CHAMP_REWORK_PLAN §5.11) — added 2026-09-08
Summons, tethers, terrain: eighteen rows on cowboy / mad scientist / black
goo / fairy / ghoul / atlantean / dragon. **`summonUnit`** (Whistle's Hound,
Summon Creation): a WALKING TURRET in `state.turrets` (`summon: <key>`,
`hitsToKill`, `move`, `reveals`, `armored`; `summonDef` on the row) — the
raiseDead zombie's template, so fog / `damageTurretAt` (now takes
`opts.damageType`; armored = physical hits count half) / the renderer
(`_buildSummon3D`) / the HUD nameplate / state-sync come free;
`processTurretVolleys`' walker branch hunts the owner's ENEMIES only, reveals
Invisible within `reveals` first, walks `move` tiles, strikes adjacent with
`sourceUnit` = the caster. **Goo terrain = the existing `swamp` Black Ooze
row** (never add a `goo` key): `enterStatus` (finishMoveAt) + a
`{ type: 'status' }` endTurn result (map.js applyTerrainTurnEffects) Goo
whoever touches it; **timed painting** through battle.js
`_paintTimedTerrain(cx, cy, { terrain, radius, rounds }, unit, label)` →
`state._timedTerrain` (prev terrain remembered, reverted by
`_tickTimedTerrain` at the top of processEndOfRoundZonesAndSeeds) — used by
`paintTerrain` on damage (`_runPostEffects`) / barrage rows and by Oozing's
`trailTerrain`. Flags the engine reads: `lineZone` (`_applyLineDamage` →
radius-0 `_activeZones` entries; every `zone.radius || 1` became `?? 1`),
`onlyTerrain` on a teleport (`getTeleportTerrainTiles`, gate + ui.js
highlight + AI), `statusFirst` (status before the hit), `purgeBuffs`
(`removeBuffs`). The `pull` branch now applies `spell.statusEffects` (it
never did) — Lasso is the rope (`tethered` 2). Tsunami★ took Great Flood's
r4 seat (Flood stays authored, off-tree). Adding a summon = a row with
`kind: 'summonUnit'` + `summonDef { key, name, move, dmg, hits, reveals?,
armored? }` + a `_buildSummon3D` look for a new key; `npm test`
(champ-rework.test.js "Phase 5 wave C" ×3) guards the rows, the terrain
plumbing and every engine site.

## PHASE 6 — THE TWO NEW RACES (CHAMP_REWORK_PLAN §5.12) — added 2026-09-08
The last phase of the champ rework: **gangster** (Gunslinger, `shank`;
Stomp Out → Drive-By ⇄ Hit a Lick → Choppa → Extended Clips★) and **nun**
(White Mage, `devout`; Purify ⇄ Smite → Blessing → Prayer → Hallelujah★)
are real races — 98 in `AVAILABLE_RACES`, in every race table on BOTH
sides (server.js `AVAILABLE_RACES` + `ACCT_STARTER_UNITS` literals; `npm
run test:parity`). The nun is her OWN race: `RACE_PROFILES.priest
.labelFemale` is 'Priestess' (same whitemage female model, shared by
`RACE_MODELS_3D.priest.female` and `.nun.female`), the Nun's user-authored
`DOOR_ROSTER_LINES` sit under `'nun'` (moved, never rewritten), she is a
starter. **The gangster's art landed 2026-09-10** (R2
`Assets/Sprites/Races/gangster/`): `_mkUAL('gangster',
'thug_gangster_reali')` in `RACE_MODELS_3D`, his OWN single-file 2D sheet
(`_SINGLE_FILE_RACES`; the gunslinger-folder borrow is retired), and a
starter on both sides now — no `basicAttackKind` (Gunslinger range 2
quick-draws; up close he SHANKS, so `castMelee` is flavoured to
Punch_Cross). His five spells stopped aliasing other races' VFX: authored
`raceStompOut_impact` · `raceDriveBy_muzzle` + `_impact` ·
`raceHitALick_impact` · `raceChoppa_beam` + `_impact_tile` ·
`raceExtendedClips_aura`; Choppa's `projectileOverride` was REMOVED so the
line branch takes the (relayed) beam path instead of flying one sprite,
and Drive-By's `afterShot` is a real beat (ranged clip + muzzle at the
caster + gunshot + impact). Still missing from R2: his `portrait.png`;
his `DOOR_ROSTER_LINES` are user-authored (A15) and unwritten. See
CHAMP_REWORK_PLAN §9.8. New kinds (battle.js `SPELL_KIND_META` + `doSpell`):
**`steal`** (the hit, then `_stealFromUnit` moves `stealKeys` Keys +
`stealItems` items — Plunder keeps its utility id) and **`cleanseArea`**
(3×3 tile cast: allies lose every `kind: 'debuff'` key via `clearStatus`,
enemies lose every buff via `removeBuffs`; nothing applied). A `dash` may
wear **`afterShot { dmg, range }`**: after the slide, `_afterShotTarget`
(weakest visible enemy in LOS of the landing tile) takes the bullet; a
`dmg: 0` dash only shoves. ai.js scores/targets all three; hud.js parts,
ui.js `_SLB_KINDS` / AoE preview, data.js `SIM_DEFAULTS` know the kinds.
check-grades.js `PLANNED_PASSIVE_ALLOWANCE` is EMPTY now — a future
planned passive goes back in as `race: value`. Adding a race = the §5.12
table list (data.js ×15, sprites.js ×5, server.js ×2, lore ×2) and the
Heat Death ladder's top tier (`ACH_CATALOG` champsMastered = roster
size; achievements.test.js pins it). `npm test` (champ-rework.test.js
"Phase 6" ×3) guards every table and engine site.

## SHARED-TILE TARGETING + STRUCTURE FACING — added 2026-09-13
A flyer can hover over a ground unit in ONE column. A board click carries
the flyer's own z only when the pointer hit its sprite; a click on the
tile resolves to the SURFACE z and `unitAt(x, y)` prefers the ground
unit — so attacks / casts at the wrong body, "can't target" bounces and
AoE whiffs. ONE rule now: battle.js **`resolveUnitInColumn(actor, x, y,
z, { side: 'enemy'|'ally'|'any', inRange? })`** (right before
`_structureAt`; global) — the exact-z unit when it suits the action, else
the best other unit in the column (right side, then in reach, ground as
the tie-break), else the click as it came. Readers: `doAttack`
(`_clickedTarget` = the pick; **`z` is re-assigned to the pick's z** so
range + every later `unitAt(x, y, z)` agree), `doSpell` (unit-targeted
kinds only — tile / directional / self / phase-2 casts keep the click;
side from `_kindMeta` offensive / allyOnly, twoClick = any), `doItem`
(potions ally, banes enemy), the confirm gates `_spellTargetTeamOk` /
`_itemTargetTeamOk`, ui.js `getPendingDamagePreview`. Never add another
`unitAt(x, y, z) || unitAt(x, y)` at a unit-targeted site — call the
resolver. `_applyAoeDamage` and the combo `aoe` burst hit EVERY enemy in
a tile's column (`filter`, not `find`). FACING: every structure branch of
`doAttack` (Cube / turret / mirror / deployed object / seed / tree chop /
terrain smash) calls `setUnitFacing` after its `pushUndoSnapshot` — the
attacker squares up on the Cube like on a unit. Overwatch turns the MOVER
when the shot FIRES and its delayed impact passes `keepFacing: true` to
`applyDamageToUnit` (the whip-around's opt-out) — the impact used to land
~0.7 s later and spin a unit that had already squared up on its own cast
target. `npm test` runs `shared-tile-targeting.test.js` (the resolver in
a vm sandbox + source guards).

## BASIC ATTACK DELIVERY + THE LEAP (charges and strikes respect elevation) — 2026-09-14, local delivery
The fist sprite (`_PROJ_SPRITES['attack']` = proj_human.png) is RETIRED for
basic attacks. battle.js (the block right after `_unitAttacksWithClip`):
**`basicAttackKindOf(unit)`** = ONE kind for the clip AND the delivery —
the gun / psychic JOB KITS first (`BASIC_ATTACK_JOB_KINDS`: Gunslinger ·
Sniper · Agent → `ranged`, Psychic → `magic` — a Gunslinger of any race
shoots, that IS the job), then the 3D def's authored `basicAttackKind`,
then the mage jobs (`BASIC_ATTACK_MAGE_JOBS`), then
**`BASIC_ATTACK_RACE_KINDS`** (the sprite-only / kind-less races: cowboy ·
marksman · general · men in black · gangster · martian · mad scientist ·
ai · android · droid = `ranged`; ice queen · seraphim · watcher · occulus ·
shadow entity · siren · chosen one · symbiote = `magic`; voidweaver =
`throw`; the brutes = `punch` / `claw`), then reach (> 1 = `ranged`).
`_attackAnimKindFor` reads it (no more reach-by-distance clip choice).
**`basicAttackDelivery(unit)`** → `{ mode: 'shot' | 'leap', kind, bolt,
proj }`: `magic` / `ranged` / `arrow` / `throw` SHOOT (a gun = the
`_bolt_bullet` muzzle flash + the spinning `proj-bullet` round; magic = a
typed ORB, `BASIC_ATTACK_ORB_BOLTS` by `unit.types[0]` — divine / unholy /
tech / alien / psi / ki; a bow = `_bolt_arrow`; a thrower = the race's
`projectileClass` prop, the football / the spider); EVERYONE ELSE LEAPS
at ANY reach (a high-ground brawler striking two tiles down leaps down
and swipes — it used to lob the fist). **`playBasicAttackShot(unit,
target, delivery, flyMs)`** fires the shot (wrapped in online.js → relay
`basic-shot`, the guest replays it fog-gated on either end — playProjectile
itself was never relayed). **`_meleeStrikeAnim(unit, tx, ty, { clip,
strikeLeadMs, leapMs, targetId })`** is the ONE melee strike (doAttack,
the Echo Band re-strike, the counter, the follow-up, the Chivalry
guardian): a rigged model LUNGES `stopShort` of the victim (0.45 tile
adjacent, 0.9 = the adjacent tile from farther) and HOLDS beside it while
its attack clip swings (`animateStrikeLeap`'s `clip: true` builds the
on-arrival `triggerAttackAnim`; the hold = the strike lead + 260 ms; the
in-place clip is gone), a sprite jumps onto the tile as always. doAttack's
`impactDelay = projectileDelay + actionMs(_leapMs) + _meleeLead` (leap 260
ms + 110 per tile beyond the first). The `strike-leap` relay carries the
opts (primitives; the guest calls the UNWRAPPED `window.animateStrikeLeap`
so the clip flag rebuilds its callback). **THE LEAP (three-renderer.js)**:
`startDisplaceTween` vaults when the from / to surface differs by ≥ half
a level, or on `opts.leap: true` (the charge-to-target spells —
`_runChargeToTargetSpell` and the `_runPostEffects` hop pass it through
`animateDisplacement`), never on `opts.leap: false` (a knockback stays a
shove): the body runs the flat part on the FROM surface and vaults the
last ~1.4 tiles on a parabola whose apex clears the higher surface
(`tw.leap`); a polyline slide HOPS every segment that steps a level
(`tw.hops`); `tw._air` = the clip picker plays `jump`; the landing arms
the jump tween's squash + a puff. `startStrikeLeapTween` takes `stopShort`
/ `targetId` (the landing height is the VICTIM's surface — a flyer, a
roof), the arc clears the higher end, `tw._phase` (0 leap / 1 hold / 2
return — the picker plays `jump` in flight and `idle` under the one-shot
on the hold), rigged models get the jump squash & stretch. `npm test` runs
`basic-attack-delivery.test.js` (the classifier + the shot helper in a vm
sandbox, source guards on every site + the relay). UNSEEN LIVE (RULE
#1c): the vault's height against a 3-level cliff, the hold's timing
against long swing clips, the orb colours per type, the guest's leap.

## THE FREELANCER = TWO SOCKET RACKS + THE HOMOSAPIEN TWINS — 2026-09-14, local delivery
The Freelancer's three fixed spells (`improvise` · `jackOfAll` (Pep Talk)
· `reallyGoodPunch`) are HOMOSAPIEN RACE ABILITIES now (data.js
`RACE_ABILITIES.homosapien`, same ids — saves keep working; they left
SPELL_LIBRARY and carry no `school` / `classRestriction`), twinned onto
the race tree: `RACE_TREE.homosapien` = `[[raceElbowGrease, improvise],
[raceAdrenalineRush, jackOfAll], raceUnderdogSpirit, [raceIndomitableWill,
reallyGoodPunch]]`. `CLASS_SPELL_LEARN_ORDER` has NO Freelancer row any
more; `FL_FIXED` is `{}` (still exported). The Freelancer's tree (data.js
FREELANCER block, `buildFreelancerTree`) is the race pillar + TWO socket
racks, ring-tier-capped (r1/r2 tier I, r3 tier II, r4★ tier III):
**P1–P4 = ANY RACE ability** (`flRacePool(race)` = every other race's
tree, both twin alternates, minus the unit's own pillar and anything a
job tree owns; a `jobRequirement` row stays with its job) and **S1–S4 =
ANY JOB ability** (`flWildcardPool(race)`, unchanged). `FL_SOCKET_POOL`
names the pool per key, `flSocketPool(race, key)` is the picker's read,
`tree.socketPool` rides the built tree. **A socket judges a spell by its
TREE RING** (`_flTierOf` → `treeRingOfSpell(id)`, cached beside the
capstone set and dropped by `applyTreeRingCosts`) — most race abilities
carry no `tier` field. The pools are disjoint (no id lives on both a job
and a race tree), so placement is by pool + tier. party-builder.js:
`flSocketKind(tree, key)`, the pillar heads read ANY RACE / ANY JOB, the
socket chip / panel / window say Race Socket / Job Socket, the picker
reads `window.flSocketPool` and `window._flTierOf`. Two capstones still
never fit (4 + 4 > 7). `npm test` (content-schema.test.js "Freelancer
wildcard-socket tree") guards the move, both pools, placement, legality,
the random walks and the repair. Unseen live (RULE #1c): the race pool is
~400 rows in one window — a filter row may be wanted.

## THE DOOR AGENT — the race built on doors (DOOR_RACE_DESIGN.md, Stage 1 shipped 2026-09-14, local delivery)
Race key **`'door agent'`** (label DOOR Agent; human + anomaly; TIME; Agent
job; a starter; the Player / Agent Belle cast GLBs via `RACE_MODELS_3D['door
agent']`, registered AFTER `DOOR_CAST_MODELS` in sprites.js because the cast
library is built later than the race table). **THE DOOR** = battle.js "THE
DOOR" block (right before `_structureAt`): `state.doors` = `[{ id, pairId, x,
y, z, open, hp, maxHp, owner, ownerId, spellName, fixed, placedRound }]` (ids
only, RULE #2; synced — state literal, net snapshot, the six reset blocks and
the fog cache key all carry it). Read it ONLY through `doorAt / doorTwin /
doorsBeside / doorTeamPairs / doorTileFree / placeDoorPair / setDoorOpen /
breakDoorPair / damageDoorAt / doorStepThrough` (on `window` and on `GAME`).
Rules: OPEN = passable, whoever ENDS a move on it steps out of its twin
(`finishMoveAt` → `doorStepThrough`, before the arrival hooks), the owning
team sees the twin's 3×3 (map.js `computeVisibleTiles`); SHUT = a wall for
everyone (`doorBlocksMove` at the four occupancy gates, `doorBlocksSightBetween`
in `isRangeBlockedByTerrain`); `DOOR_RULES.hits` 3 (Keyholder `doorHits` 4)
and the pair breaks together; 1 pair per agent, 2 per team, the oldest
folds. `deployPair` (Grave Passage / Tunnel Network) places FIXED doors now.
Kinds: `door` (Knock Knock — two TILE clicks via `state._spellPick1 { tile:
true }`, NOT the unit two-click gate; online.js's wrapper picks locally and
sends `pickX / pickY`; a click on a friendly door toggles it — Keyholder's
`doorFreeToggle` makes that free once a turn, `_doorFreeAction` skips the
AP spend), `doorBreach`, `doorDelivery` + `doorExit` (their reach is a
DOOR's — `_doorOriginForSpell` replaces the range + LOS gate; meta
`doorOrigin: true`), `doorSlam`, `doorTrap`; The Long Way Round = `buff` +
status `castFromDoors` → `doorCastOriginFor` lets doAttack / doSpell launch
from a twin door when the direct cast fails. **The rear-attack rider**:
`state._doorRearCast` (armed in doSpell by `spell.rearAttack` or a door
origin, disarmed in finishAction) makes `applyDamageToUnit` price the hit
as a back attack. EXITED = status `exited` (realm-shielded from everyone,
no move / act; `onRemove` → `window._doorExitReturn` out of the twin,
Staggered) — the body STAYS on its tile under the status. Renderer:
`_buildDoor3D` in `rebuildDeployables`, hashed into `_computeDeployableSerial`.
`npm test` runs `door-race.test.js`. Adding a door-reading rule = the block;
never re-derive "is there a door here" from `state.doors` at a call site.
Unseen live (RULE #1c): the leaf swing, the pips, the step-through beat,
the guest's tile pick, every AI placement.
**REV 2 (2026-09-14, same day) — THE DOOR IN THE FRAME**: the board door is
the map's own CATALOGUE leaf (`_doorLeafFor` = the crossing's threshold
leaf, else `leaf_hollow_core`) on a DOOR-issue frame, hinged per the
catalogue, facing its twin — NEVER a procedural plank (the user's rule:
the kit has thirty doors). Every ability fires a door recipe from
three-vfx-effects.js "THE DOOR AGENT'S DOORS" (`_sigDoorRig3D` wears the
same leaf through the weapon cache as `door:<key>`; `_sigDoorPortal3D` /
`Knock3D` / `Slam3D` / `Delivery3D` / `Network3D`) through battle.js
`window._doorGeom(id, x, y, extra)` → `VFX.fireGeometry` (relayed;
`extra` primitives only — `doors` rides as "x,y;x,y"). Ids:
`raceKnockKnock` · `raceBreakingEntering:door` · `raceSpecialDelivery` ·
`raceSlam` · `raceExit` / `:out` · `raceLongWayRound` · `raceTrapdoor` /
`:out`. `npm test` runs `door-vfx.test.js`. A new door ability = a
recipe in that section + a `_doorGeom` fire at its branch.

## MOVE + ACT ON THE TILE MENU (Cube attacks, Inspect) — 2026-09-14, local delivery
The tile quick menu (hud.js `_computeTileActions` → `_hrlgTileBlades`) now
offers the one-step "walk into reach, then act" plan the enemy-unit menu
always had: every STRUCTURE attack row (Cube / turret / deployed object /
seed / tree) goes through **`_objAtkRow`** — in range → `_fireObjectAttack`,
else battle.js `findAttackApproachTile` (validated against
`_getAttackValidTargets` from the probe tile, so the Cube's 3D reach + LOS
+ fog rules hold) → `_moveThenAttack`; the INSPECT row measures the scan's
OWN reach (Chebyshev + LOS — it used to read the 3D combat distance and grey
a diagonal the engine accepts), else **`findInspectApproachTile`** →
**`_moveThenInspect`** (battle.js, right after `_tryMoveThenAttack`: ONE
walk step, jump/takeoff tiles skipped, no plan once the unit has moved,
`_inspectMoveBudget`; `_tryMoveThenInspect` is the board-click twin in
clickTile's inspect branch, `_inspectApproachHoverPreview` the hover
arrow). A plan row wears `moveTile` → the `↳ MOVE` / `↳ JUMP` note and the
engine's approach preview on hover (`_drawSpellApproachPreview` /
`_clearSpellApproachPreview`). The root ATTACK blade already lit for a
reachable Cube (`attackHasReachableTarget`), and Attack mode's board click
already walked to it (`_tryMoveThenAttack`) — only the tile menu was behind.
Online (RULE #2): `_moveThenAttack` / `_moveThenInspect` call the WRAPPED
`doMove` / `doAttack` / `doInspect`, so a guest's plan emits each verb and
the host resolves; nothing new is relayed. `npm test` runs
`move-then-act-menu.test.js`. Unseen live (RULE #1c): the ↳ MOVE note on the
object-led menu, the ghost + arrow on hover, the scan landing after the walk.

## THE VANISHING DEPLOYABLES + THE SAME TORCH EVERYWHERE — 2026-09-15, local delivery
**The bug**: wards, mirrors, doors, seeds, bombs, decoys and gates blinked
out after placement and came back only when the NEXT deployable changed.
three-renderer.js `rebuildObjects` stripped EVERY child of `objectGroup` but
the turrets (`_ew_turretId`) and the deco group — the deployables too —
while `deployableMeshes` kept the disposed handles and
`_lastDeployableSerial` never changed, so `rebuildDeployables` never ran.
Any object rebuild did it; the usual trigger was a TEXTURE landing and
flipping `_objectsDirty` (the ward torch's own bark sheet, `_getTorchWoodTex`,
on the first ward of the match). RULES now: (1) `rebuildObjects` skips
anything in `deployableMeshes` or wearing `_ew_deployable` — a deployable is
removed ONLY by `rebuildDeployables`, exactly as a turret is only by
`rebuildTurrets`; (2) `_computeDeployableSerial` folds `_terrainVersion /
_heightVersion / _voxelVersion` (a dig / raise under a prop re-seats it —
the object pass used to do that by accident); (3) your OWN wards, doors,
gate pairs and `_deployedObjects` (decoys, walls, totems) wear
`_ew_depOwner`, so `_applyFogVisibility` never tile-gates them (mirrors and
bombs already did). **THE SAME TORCH EVERYWHERE** (the user's rule): the
HQ's `wall_torch` / `cave_torch` procs are `_makeTorchModel` now — the
ward's / the map editor's / the Dutchman rail's wood-and-rope torch — built
in metres (`_makeTorchModel({ ts: HQ_TILE_M * U, scale, noTint })`; `opts.ts`
and `opts.noTint` are new, `HQ_TILE_M` = 1.75) and fluttered by
**`_torchFlicker(entry, nowSec, isNight, baseInt)`**, the ONE flicker
(`_updateTorchFlames` runs it over `_torchFlames`; an HQ proc runs it from a
room ticker; the point light stays the catalogue's). The wall torch leans
0.42 rad off an iron bracket like a ward hung on a cube face (data.js rows:
`h` 1.1 / 1.9, the glow + light `y` retuned; the gun deck's torch hangs at
mount 1.4 under its 2.7 m beam). Never draw a cone-flame torch again — a
new torch anywhere = `_makeTorchModel` + `_torchFlicker`. `npm test` runs
`deployables-persist.test.js`. Unseen live (RULE #1c): the torch's scale
against the HQ walls, the bracket, the lean.

## THE COMBAT FIXES — solid highlights · the mode holds · the beam heading · the Door Agent's one-click kit · no hover wash while the camera flies (2026-09-19, local delivery)
Five of the user's combat notes. **SOLID HIGHLIGHTS**: three-renderer.js `HL_OPACITY` / `HL_FILL` /
`HL_OPACITY_MAP` / the move-tile recipe in `_getSharedHlMat` / `_OVERLAY_STYLE` were all lifted ("THE
SOLID PASS" comments) — the range washes were a 13 % lattice, they are ~36 % plates now, the move tiles
~46 %; the three tiers keep their order. Restyle there, never per site. **THE MODE HOLDS** (battle.js
`clickTile`): an incompatible click while a verb is armed — out of range, wrong team, no effect, a unit
under a move / jump click — is a beep and a log line and NOTHING else: the mode, the selection and the
range stay up (it used to `_exitModeAndShowUnitMenu` / `selectUnit`, which dropped the highlights). Two
latch bugs fixed on the way: the bare `return doMove(…)` and the "No route onto that surface" branch left
`state._actionExecuting` true, so a refused walk hid the move range and ate the next click (`_execMove`
wraps it now). **THE BEAM HEADING** (Chemtrails "hits 0 targets in a line"): battle.js
`lineSpellHeadingTo(spell, fromX, fromY, fromZ, tx, ty)` (right before `getSpellRangeTiles`, on `window`)
walks the eight rays exactly as `_applyLineDamage` does (range cap, impassable, LOS, the wide beams' lanes;
no boring) and answers the heading whose spine or lane holds the target, else null. `doSpell`'s line branch
reads it (a human's click on a tile no ray reaches is refused BEFORE MP is spent; the AI keeps the old
`Math.sign` snap), `_spellGlowTiles` reads it, and hud.js's enemy quick menu `beamRayHits(sxx, syy, szz)`
reads it — the menu used to offer a beam whose ray the LOS walk stopped short of, and the cast took
`Math.sign` of the click, so an enemy at (+3, +1) got a diagonal beam that missed. Never aim a beam with
`Math.sign` again. **THE DOOR AGENT, ONE CLICK**: Knock Knock places the FAR door where you click (any free
tile within 4 you can see) and the NEAR door beside you (`_doorNearSpot(unit, far)` = the free adjacent tile
nearest the far one); `DOOR_RULES.pairRange` / `minGap` and the `_spellPick1` tile pick are GONE (online.js's
door block emits every click; `pickX / pickY` ride null). A click on your own door still toggles it. Special
Delivery flies out of ANY of your open doors (the nearest that reaches the target within 3 with LOS —
`_doorOriginForSpell`; `doorRange` is gone). **THE GREYING**: `hasSpellTargetInRange` has door branches now —
`door` / `doorSlam` are castable when `getSpellRangeTiles` (→ **`_doorRangeTiles`**: free tiles + your doors ·
your open doors in reach · the delivery zones round your doors · the tiles beside them) is non-empty;
`doorDelivery` / `doorExit` when an enemy a door of yours reaches exists; `doorBreach` / `doorTrap` sit in the
plain single-target list. `_getSpellValidTargets` lists door-reached enemies for Delivery / EXIT and NO unit
for Knock Knock / Slam (the board is their drum); ui.js paints the door tile sets as placement reach. The
rows read their rule (data.js descs, hud.js parts / labels, the aim prompts). ai.js picks the far tile only.
door-race.test.js pins the new delivery rule, the near spot and the reach. **NO HOVER WASH WHILE THE CAMERA
FLIES**: battle.js `isCameraAutoMoving()` (beside `stopBoardCameraAnimation`; on `window`) = a path tween /
`_busy` / a cine shot / a 2D cinematic / the encounter's seeded ease; `updateEnemyRangePreview` returns while
it is true and three-renderer.js `_syncEnemyRangePreview` folds it into its signature so the wash comes back
when the camera lands. Unseen live (RULE #1c): the plate opacities against the busiest sheets, the
one-click door pair's near spot on a crowded flank, the greyed rows' reasons, the wash's return timing.

## THE DOOR AGENT rev 5 — THE STANDING DOORS (door wheel Phase 1: Gust + Archers) — 2026-09-25, local delivery
DOOR_GUN_PLAN.md Phase 1 (full log in its §11). Two wheel rows, `gunGustDoor` / `gunArchersDoor`
(`kind: 'doorDeploy'`, `door` = the DOOR_GUN_DOORS key). The Door Agent SHOOTS a door onto an empty tile (≤ 4,
sight, seen) and it STANDS there: a `kind: 'standing'` record in `state.doors` (pairId = id, `fixed`, open,
walkable, see-through, 3 hits, a Keyholder's 4, faceX/faceY, `laneStamps {unitId: round}`, ids only). Cap: 2
per PLAYER (the oldest folds); the capture door never counts. **Gust** (lane 4) blows EVERY body in its lane,
either team (the user), the far body first, to the lane's end + 1 via `resolveForcedSlide`. **Archers** (radius
4) loose 3 arrows at the nearest hostile they can see; they move nobody. The act fires three ways: when the
door lands (after the comet + the unfold), at **THE DOORS' TURN** (`processDoorActs`, end of round, after the
turrets, oldest first, full camera beats), and on ARRIVAL, **chain step E′** (`_chainStandingDoors`, after E
zones, before F vortex, once per door per unit per round). So a Swing Door into a gust lane that ends on a
capture door is a capture: E′ blows, D′ takes at the landing. A Keyholder (`doorImmune`) walks through wind.
The aim is `doorGunAimResolve`: a lane door takes two clicks (the tile, then any tile of its 8 lanes for
the face, or the tile again for "away from me"); only CPU / auto seats auto-face. Enemies break a door with
basic attacks (`damageDoorAt`, `attack:door` on the tile card); its owner's side can't. VFX recipes are keyed
by spell id (`gunGustDoor:open/act/hit/break/fold`). A basic CPU placer is `window.doorGunAiPick`. Test:
`door-gun-board.test.js` (the door block + the chain in one vm).


## THE DOOR AGENT rev 6 — THE GUST STREAM + THE DESTINATIONS (door wheel Phase 2) — 2026-09-25, local delivery
DOOR_GUN_PLAN.md Phase 2 (full log in its §11). **THE GUST STREAM** (the user: "a persistent hazard on the field,
not just blasting in between rounds … immovable units like the kaiju and giant should be able to stand in it"):
a walk that enters a Gust lane STOPS on the first windy tile (`getPathPickupEvent` kind `gust`, via
`gustStreamAt(unit, x, y)`) and E′ blows it down the lane. E′ stamps a gust per CHAIN (`'c' + _chainRootSeq`,
a counter bumped at every depth-0 `resolveTileArrival`), not per round, so walking back in is blown again and two
gusts facing each other bounce a body once each, never to the depth cap. The round-end blast is GONE for Gust:
`_gunDoorTurnWanted` gives it a DOORS' TURN beat only when a movable body is still in the lane (pinned behind
another). Unmoved: colossal weight (`getUnitPushDistance(u,1) === 0`: kaiju, giant, mech, dragon, kraken…),
flyers in the air, a Keyholder, a held body. The renderer draws the wind all the time (`_gustStreamStreaks`,
onBeforeRender streaks per lane tile, fog-gated). **Five rows** (`gunHellDoor` III, `gunFrostDoor` II,
`gunMawDoor` III, `gunLaserDoor` III, `gunLightDoor` II; the Light row's element is `light`, the table's old
`holy` was not a SPELL_ELEMENT). **Hell** (lane 3): `igniteTile` on the lane for 2 rounds (step B burns
arrivals), a Frost Door's timed ice on it melts back first, enemies take 45 + Burn 2 (allies are spared the
blast, not the fire). **Frost** (lane 4): `_paintTimedTerrain` ice for 3 rounds with `freezeWater` (water / deep
water freeze; the thaw log reads "the ice thaws"), fires on it go out, enemies take 30 + Slow 1. **THE ICE RULE**
(chain step B′): a body DISPLACED onto ice with a direction (`resolveForcedSlide` now passes `dirX / dirY` to
its landing) slides on via `_resolveIceSlide(unit, { dx, dy, delayMs })`; a walk never. **Maw** (radius 2):
enemies drawn one tile in, nearest first; a body on the door's tile is bitten (50 + Stagger 1, once per chain)
and spat out of the back (−face; a radius door's face is the default, away from the placer). **Laser**:
`doorGunBeamTiles` traces the live board — to a wall / a shut door; a live prism (`state.mirrors`) turns it a
quarter turn toward the side with more of the owner's enemies (tie: clockwise), ≤ `bounces` 3; enemies only,
60; a walk ACROSS the beam is burned too (`gunDoorWalkCross` in the doMove path loop, once per door per round).
**Light** (lane 4): its side heals 40 + every debuff cleansed; the other side 45 + Blind 1. Hell / Frost E′ do
nothing (the ground already bit the body); Maw / Laser / Light E′ once per door per unit per round. Look: five
dresses in `_standingDoorDress` (flames, shards + snow, the void ring, the neon edge + scanline, god-rays), the
beam as a real line (`_laserBeamLine`), recipes `gun<Key>Door:{open,act,hit,break,fold}`. AI (EW_AI_VERSION
v4.13): `_aiMoveTiles` drops destinations whose engine path enters a stream that would move the unit
(`_gdStreamFilter`), `aiHazardPenaltyAt` adds hostile lanes (`_gdLaneHazardAt`); the placer scores every act
(`_gunDoorFaceScore`). Kill-switch `window.EW_AI_NO_GUN_DOORS`. Test: door-gun-destinations.test.js.

## THE DOOR AGENT rev 4 — THE DOOR WHEEL Phase 0 (Swing Door, Door Dash, the table) — 2026-09-25, local delivery
DOOR_GUN_PLAN.md Phase 0. The tree is `[[raceSwingDoor, raceDoorDash], [raceBreakingEntering, raceAirMail],
raceTrapdoor, raceDropIn★]` (six rows). **Door to the Face is RETIRED** — `SPELL_ID_RENAMED` (data.js) maps a
saved `raceDoorToTheFace` to `raceSwingDoor` inside `treeLegalSubset`. **SWING DOOR** = `damage` + **`hinge: true`**
r3, 40 phys, push 2, Stagger: the aim is the HINGE, an EMPTY tile beside a hostile (8 neighbours).
`_kindMeta` returns `_HINGE_KIND_META` (tile aim that is still offensive); `getSpellRangeTiles` = the legal
hinges (`swingDoorHingeTiles`); the drum is empty (board aim, like the old door kinds). `doSpell` resolves the
click through **`swingDoorResolve`** (battle.js, beside `_doorRangeTiles`): victim = the side neighbour before a
corner one, then the nearest; stamps `unit._swingHinge = {x, y, spellId}` (plain, RULE #2) and re-aims x/y at
the victim, so the rest is the ordinary damage path. `_runPostEffects` pushes along `swingDoorPushDir(hinge →
victim)` (data.js, pure). A CPU / auto seat may hand in the victim's tile (`auto`) and takes the hinge nearest
itself; a human click must be a hinge. The travel shoots the hinge and fires **`raceSwingDoor:swing`** from it
(never keyed by the spell id — the impact intent's caster-origin registry call would double it). ui.js
`updateAoePreview` paints hinge (gold) · victim (red) · the forecast landing (amber). **DOOR DASH** = `teleport`
r5 + `doorGun`: the teleport branch fires the shot, `raceBreakingEntering:door` at the feet and
`raceDoorDash:out` at the landing, the agent faded until the far door opens. The **door table** (`DOOR_GUN_RULES`,
`DOOR_GUN_DOORS`, `doorGunLaneTiles`, `doorGunWheel`, `doorGunUnlocked`), the **`hq.gunDoors` ledger**
(merge earlier-day-wins, destination keys only, `hqDoorSyncFold`) and **the wheel pool**
(`unitSpellPoolParts().wheel`, race `door agent` only, rows that exist only — empty until Phase 1 lands
`gunGustDoor` / `gunArchersDoor`; the rack tags them DOOR WHEEL) are in data.js. Test: `door-gun.test.js`.

## THE DOOR AGENT rev 3 — THE GUN, NOT THE DOORS (five rows, OPEN HOUSE, the gun's pitch) — 2026-09-20, local delivery
The user dropped the placed-door mechanic. `RACE_ABILITIES['door agent']` (data.js) is FIVE rows on
`[[raceDoorToTheFace, raceBreakingEntering], raceAirMail, raceTrapdoor, raceDropIn★]`, every one wearing
**`doorGun: true`** = the agent SHOOTS A DOOR out of the door gun where the spell needs one (sprites.js
`classifySpellAnimKind` → `'ranged'`; a `damage` row's travel is **`TRAVEL_HANDLERS.doorGun`** in battle.js —
the `raceDoorGun:shot` from the hand, `doorAt: 'between'` for the swing; the door recipes ride the geometry
registry BY SPELL ID through `fire('impact')`). Plain kinds on purpose: **Door to the Face** = `damage` r1 +
push + Stagger (`_sigDoorSwing3D`); **Breaking and Entering** unchanged; **Air Mail** = `damage` r4 +
`groundsFlyers` + `dropTiles` (`_sigDoorAirMail3D`: the victim's door swallows, a face-down door three
storeys up drops the body; the handler fades the real victim out / in); **Trapdoor** = `placeTrap` +
`trapType: 'trapdoor'` + **`trapSize: 2`** — a HIDDEN 2×2 on the trap arsenal (`_trapFootprint` clamps the
anchor + validates every tile, four records share a `groupId`, the cap counts groups, `TRAP_TILE_SPRITES.
trapdoor` for the owner only), sprung by the first enemy to end a move on any tile: `_springTrap`'s
`trapdoor` branch sinks every tile TWO levels (`applyTerrainDeform` −2) under them + the WEAK hit + the fall +
Stagger; a Keyholder never falls (`checkTrapTrigger`); the laying recipe (`raceTrapdoor:set`) is gated by
**`fireGeometry`'s `onlyPlayer`** (drawn only on that player's screen, the relay still carries it — RULE #2);
NOT a capstone (tier II); **Drop In★** = `doorBreach` + **`fromAbove`** (the shot into the air, `_sigDoorDropIn3D`
drops the agent's body out of a door over the landing, the real agent faded for the fall) + **`splashDmg`** on
the neighbours. `FINISHERS['door agent']` = **OPEN HOUSE** (`openHouse` / `_sigOpenHouse3D` / `_FIN_STAGE.
openHouse`: six doors round the victim, the agent in and out faster and faster, every door open at once, the
far door takes them). RETIRED: Knock Knock · Special Delivery · Slam · EXIT · The Long Way Round (rows, tree,
SPELL_MAP); THE DOOR OBJECT in battle.js STAYS (Grave Passage / Tunnel Network `deployPair` fixed doors —
its kinds / statuses / branches are dormant, never re-add a door-placing row). **THE GUN'S PITCH**:
`HQ_PORTAL_RULES.gun.pitch` (degrees the MUZZLE DROPS, after `turn`; shipped 30 for the user's "~30° off
parallel") — three-renderer.js `_heldPitchGroup` in the three holders (the walker, the board's
`_unitAttachHeld`, the viewmodel); `_hqGunMuzzle` reads `holder.userData.inst`. A barrel that now points
DOWN wants `pitch: -30` — one field, unmeasured. `npm test` runs door-race.test.js (the trapdoor in a vm
sandbox) + door-vfx.test.js; finishers.test.js's BUILT table has the agent. UNSEEN LIVE (RULE #1c): the
pitch's sign, the swing at range 1, the Air Mail fall vs the damage number, the Drop In beat, the four
sigils, the six-door ring.

## THE GRADE NODE — one letter-grade widget everywhere, the rings fill from the bottom, Classic goes navy-to-black (2026-09-21, local delivery)
The user's reference sheet: the letter grade in bold white inside a round node whose face is a
gradient per grade, ringed by a GAUGE that fills FROM THE BOTTOM, CLOCKWISE; the health rings the
same way; the Classic profile a deep navy falling to black. **THE NODE** = data.js (beside
`statGrade`) `STAT_GRADE_FACE` (F red · C amber · B teal · A green · S diamond blue / silver),
`statGradePct(key, val)` (a ruler stat's share of 100; HP / MP against their S band),
`statGradeNode(key, val)` → `{ g, pct, color, face, cls }` and **`statGradeNodeHtml(key, val,
{ size: 'sm' | 'lg', label })`** = `<span class="ew-grade grade-a" style="--pct:70"><i>A</i></span>`
(`statGradeChipHtml` is that name now — the old `.stat-grade` chip and its CSS are GONE). CSS:
styles-base.css `.ew-grade` (the ring a `conic-gradient(from 180deg …)` — 6 o'clock clockwise —
over a dark track, the face `::before`, the letter in Cinzel 900 white; `sm` 16 px · the row node
22 px · `lg` 30 px; `.none` keeps the column). THE ROW at every site reads **label · node · number ·
bar**: the forge's `StatBar` / `VitalBar` (`GradeChip` = the React twin off `statGradeNode`; the
glyph disc stays only on an ungraded row), the battle quick stats (`_hrlgQuickStats`, `sm`), the
inspect card (`statBar` in ui.js), the codex / shop dossier (`_codexBuildStatBar`), the pause
menu's party sheet (map.js `_hqPauseBar(label, val, max, color, text, gradeKey)`, `lg`). Never
draw a letter grade any other way. **THE RINGS FILL FROM THE BOTTOM**: the reticle shader's
`frac = fract((uMeterRot - ang) / 6.2832 + 0.5)` (three-renderer.js; the fill's root at the
screen's 6, its edge climbing the right side) and the party dock's `_ppArc(r, len, start)`
(`start` = percent clockwise FROM 6; the fills start at 0, the shield / heal forecast at `hpPct`,
the damage slice at `hpPct − dmgPct`). **CLASSIC BLUE** (`:root` in hud.js's injected sheet +
the HQ pass fallback in styles-base.css): `--ew-plate-bg` #16188e → #0c0e64 → #050632 → #010214
under a silver-white edge; rows / head / dead tokens darkened to match. `npm test` runs
`grade-node.test.js`; ring-vitals.test.js pins the two directions. UNSEEN LIVE (RULE #1c): the
node's legibility at 16 px in the quick stats, the face gradients under each theme, the row
widths on the inspect card and the codex at narrow widths, the darker rows' contrast.

## THE BADGE PASS — solid type badges everywhere, colour-coded blades under every theme, status / bonus badges, plain MP, the AOE tiles, the element glyph (2026-09-21, local delivery)
The user's six. **SOLID TYPE BADGES**: hud.js `typeBadgeStyle(base, opts)` is a FILLED pill now (the
type's colour as the ground, `badgeInk(hex)` = dark ink, white on a dark colour; `opts.solid === false`
keeps the old outline chip); the desc bar's inline badge, party-builder.js `pbTypeBadgeStyle`,
styles-base.css `.type-badge.type-*` (the codex / shop / inspect card / the forge's wall) and
three-renderer.js's nameplate `.tp-type-*` all fill the same way — never draw an outline-only type chip
again. **THE CATEGORY PASS**: a spell / item row's wash is loud (`--bc-hi` = the colour at 0x62, `--bc-lo`
0x2a in `HorologeBlade`'s catVars), the function edge is 5px and the category glyph is a SOLID CHIP in the
function colour (`.hrlg-blade.catc .hrlg-glyph`, the colour-pass block after the root-verb rules) — the
theme tokens paint the material under it, so damage reads red and heal green under Classic / Void / Onyx /
Leather / Parchment / Glass alike. **THE STATUS BADGES** (`_hrlgStatusBadges` → `_hrlgSpellBadges`, every
ability / quick-menu spell row): every status a row applies rides the blade as `STATUS_DEFS[id].short`
(STG · RTD · BRN…) on a solid chip in `_HRLG_SB_COLORS[id]` — read from `statusEffects`,
`allyStatusEffects`, `collisionStatus` (+Both), `basicAttackStatus`, `enterStatus` (`_hrlgStatusRows`;
a new status-carrying spell field = one line there); `bonusVsStatus` wears `×1.5 BRN` (the multiplier +
the abbreviation, a gold outline). **MP** is blue text, no pill (`.hrlg-chip` in the colour pass). **THE
SHAPE TILES**: `_hrlgSpellShape(sp)` (aoe / blast → n×n, cross / diamond → the arms, line → a row per
`lineWidth`; capped 5×5) rides `b.shape` and `_hrlgShapeTiles` draws it as 5px squares in the row's
colour at the right end (`.hrlg-shape`). **THE ELEMENT** is ONE 14px glyph with no word
(`_ELEM_BLADE_GLYPH`; the R2 icon images are no longer drawn on the blade) — sonic is ♫, metal is ⚙.
No new state, nothing relayed (RULE #2). Unseen live (RULE #1c): the chips' ink on each type colour, the
glyph chip against the gold cursor, the tiles' size on a 56px two-line row, the badge row's width with a
type + element + two statuses.

## THE ONE TYPE PALETTE + THE FOCUSED MAP + THE MAP REMEMBERS (2026-09-22, local delivery)
The user's three. **THE ONE TYPE PALETTE**: the battle HUD's type badges (hud.js `TYPE_COLORS`) and the 3D
nameplates' `.tp-type-*` (three-renderer.js) wore the brighter `EW.*` accents (tech `#4fd8ff`) while the codex /
shop / forge / inspect card wore `#28a0be` — the badge read two colours in one game. Every badge is the SAME six
hex values now (`#a0a0c3 · #32aa50 · #dcaa1e · #9632b4 · #dc3c82 · #28a0be`, the values of styles-base.css
`.type-badge.type-*` / ui.js `_CODEX_TYPE_COLORS` / party-builder.js TYPE_C); `EW.*` stays for text and glyphs.
Change a type's colour in all four places at once. **THE FOCUSED MAP** (map.js, the world overview block):
`_hqMapOpenArea(id)` / `_hqMapOpenWorld()` are the ONE way between the sheets — a CLICK on a charted place on the
world sheet opens its area sheet (the anchor, or the first charted room of the place, picked so the card offers
GO; an uncharted place keeps the card + GO ANYWAY; a floor band still travels on its second click), the WHEEL and
the ± buttons go through `_hqMapZoomSwitch(v, p)`: zooming the world in past `HQ_MAP_AREA_IN` (0.34) of its fit
with the cursor within `HQ_MAP_AREA_NEAR` of a place (or over the building's block) opens that place; zooming the
area out past `HQ_MAP_WORLD_OUT` (1.75) of its fit brings the world back with the place picked. **THE MAP
REMEMBERS**: `_hqAreaModel` drew EVERY room outside the sheet's place as UNCHARTED — a room stood in a hundred
times read as a question mark from the next hub over. A portal node keeps its STATE now: a seen room is an EXIT
(`exit: true`, its name + number, the far place under it as `▸ THE WOODS`, `.hq-map-n.exit` in styles-base.css);
only a never-entered room is the `?`. hq-map.test.js pins the click rule, both zoom thresholds and the exit.
UNSEEN LIVE (RULE #1c): the zoom thresholds' feel on a real wheel (the two constants are the edit), the exit's
gold dashed ring against the hub inks.

## THE SCOPES SORTED + RANDOM SITE — the Party Builder opens the roster, the range deals what you know (2026-09-23, local delivery)
The user's three. **THE PARTY BUILDER FROM THE MAIN MENU = THE WHOLE RIGGED ROSTER**: map.js `_goToTeamBuilder` sets
`window._ewRosterScope = 'all'` before the page (online PvP squads are forged there — `isUnitUnlocked` reads the scope,
every race with a 3D model shows unlocked) and `_teamBuilderBack` closes it (`'owned'`) — the forge opened from a
console or the pause menu still fields what you own. **THE RANGE DEALS WHAT YOU KNOW**: `_hqRangeTerminal` passes
`scope: 'owned'` (the roster lock holds in Room 64 now — the whole roster is Online's / Practice's / the archive's) and
`allow: _hqRangeSites()` = every threshold site that is EARNED (`hqSiteEarned`) or VISITED (`hqSiteSeen` — a room of
it stood in) + `prebuilt_training` / `prebuilt_holosim`; `_hqLaunchMission` rides `o.allow` onto the preselect
(`pre.allow`, the same gate DISPATCH's desk used) and match-select.js's card filter / first pick honour it. The RANGE
console is still the FULL variant (presets, the Δ toggle) — only its deck shrank. **🎲 RANDOM SITE** (match-select.js
`handleRandomMap`, the foot's first button on the FULL variant, disabled under two choices): a random MAP alone from
the dealt + filtered list, never the one already picked; RANDOMIZE (mode + map) stays and calls it. earned-doors.test.js
pins all three. UNSEEN LIVE (RULE #1c): the 🔒 wall gone on the archive, the range's shortened deck on a fresh profile
(the two boards alone), the button's fit in the foot row.

## THE DOOR AGENT rev 7 — NO KEYHOLDER EXCEPTIONS — 2026-09-25, local delivery
The user: "take out these weird exceptions for the keyholder … i never asked for that". The `keyholder` passive keeps
ONLY `doorFreeToggle`; `doorImmune` and `doorHits` are gone from data.js and every check is gone from battle.js. The
wind, the other lanes, the Maw's bite, E′, the capture door (`captureDoorCanTake`), the Slam and the trapdoor
(`checkTrapTrigger`) treat a Door Agent like any body of its weight, and `doorMaxHits` is `DOOR_RULES.hits` (3) for
every door. Also removed (never ruled on): flyers standing in the Gust stream, the Maw's draught skipping flyers, and
the Laser's walk-across skipping flyers. Kept: the colossal weight in the wind (the user's ruling), a held body, Hell's
ground fire skipping an airborne flyer (the standing airborne rule), and the capture door's CAPTURE_PLAN exclusions.
This supersedes the Keyholder lines in rev 4–6 above and in DOOR_RACE_DESIGN §3.

## THE 3D LINE + FRACTAL STITCH + NO SEEDS AT FLYERS — 2026-09-25, local delivery (bugfix/ENTROPY_WARS_BATTLE_FIXES_2.zip, token 20260925-bugfix-02-cors)
mondo: "Beams need to shoot in a straight line from the caster to the target, and anyone on that line gets hit"
— a flyer's beam must not hit the lower enemy behind it, and beams never left the ground. battle.js **THE 3D
LINE** block (after `_lineLosBlocked`): a `line`/`linePush` beam still picks one of the 8 headings, but it now
flies a straight line in block levels from the caster's z to the AIMED body (`lineBeamAimZ`: the unit clicked at
that z, else the one nearest z — a click on the ground under a lone flyer aims at the flyer — else the tile's
ground) and on at that slope (`lineBeamLine(from, dx, dy, aim).zAt(step)`; lanes share their spine step). A unit
is hit when the line's height at its cell is within **0.75 of a level** of its own z (`beamBodyOnLine`; 2×2
bosses one level taller). Sight is checked along that line (`_lineLosBlocked(..., lineZ)` → the targetZ of
`isRangeBlockedByTerrain`), so a beam angled up clears the low wall its ground ray used to clip. Ground things
(turrets, prisms, doors, deployed objects, `leaveTerrain`, `lineZone`, terrain reactions) are touched only where
the line runs at body height over the ground (`_beamAtGround`). `lineBeamPlan` (read-only, no boring) feeds the
camera framing, the VFX route and the glow tiles; `_applyLineDamage(…, aim)` is the real walk; doSpell fixes the
aim once (`_beamAim.lineZ`) so the boomerang's return flies the same line. `lineSpellHeadingTo` takes a 7th arg
`tz` (the menu passes the target's z). A walk with NO aim keeps the old flat lane (`unitAt`) — the breach
harnesses call it that way. AI: `_bestLineAimAI` tries each spine victim as the aim and scores with
`g.lineBeamHits` (exported on GAME with `lineBeamPlan`); the re-aim returns `z` and the cast passes it.
**Laser Door**: its beam is level at the door's body height, so an airborne flyer over the lane is not burned
(`_gunDoorLaser`). **Fractal Stitch** (`raceFractalStitch`, mantid, `kind: 'line'` + **`beamZigzag`**, cost 40,
dmg 130, range 5): the Ambush Lunge twin on rung III (tier III). It ignores the line — every enemy in the lane is
hit, any height — and the VFX zigzags through each body (mondo called it "fractal needs"; renamed to avoid a clash
with the mantid's existing Fractal Needle). **Seeds**: hud.js `_computeEnemyActions` drops Poison Seed and Leech
Seed rows against an airborne enemy (`applySeedEffectToUnit` already skipped airborne units). Test:
`beam-3d-line.test.js`. Unseen live: the special beam renderers (breath cone, tsunami, sonic boomerang, gatling,
sword wave, bow) still draw along the ground; the damage follows the line.

## THE SPELL LIBRARY — Phase 0, THE SCHEMA (2026-09-26, local delivery: spell-library/ENTROPY_WARS_SPELL_LIBRARY_0.zip, token 20260925-spell-library-01-cors)
SPELL_LIBRARY_PLAN.md §4 / §9 row 0, mondo's rulings 2026-09-25 (tiers and costs editable per row; passives and
equipment one kind of row, at most 2 of the 7 slots — `PASSIVE_SLOT_MAX`; the 17 accessories a universal GEAR
family). **THE TIER IS NOW A FIELD**: every row in data.js carries `tier: 1–4` (= its SP), written by
`node bake-spell-mods.js --stamp-tiers` from the rung; `spellTierOf` reads it FIRST and falls back to
`spellTierDerived` (rung → door tier → MP ladder) only for a row without one. The legacy `tier: 'I'/'II'/'III'`
strings are gone (157 of 172 disagreed with the live tier — they were Hazard Pay shop labels). Every reader of the
string now calls `spellTierOf` / `spellTierNumeral`; tests pin numbers (class trees 1,2,3,4; a capstone is 4).
**The other fields** (stamped at boot by `stampSpellSchema`, before EWSpellMods clones, so they are fields not
edits): `role` (derived by `spellRoleOf`: passive kind → damage / damageEffect by dmg + status/stat/shield →
heal → movement / deploy / terrain kinds → effect → utility; `roleOverride` pins; `bonusVsStatus` is NOT an
effect), `families` (the element's family unless the row lists its own; door-wheel rows carry `doors`),
`upgrades: []`, `notes` (absent until written; the bake strips them to docs/spell-notes.md). **Registries**:
`SPELL_FAMILIES` (15 elements + gear + doors), `SPELL_UPGRADES` (empty until Phase 5), `RACE_FAMILIES` (empty until
Phase 7). **`AOE_PRESETS`** + `aoeMaskTiles/Bound/Valid/PresetOf` exist; the engine honours `aoeMask` from Phase 2.
**The lint** (`spellLint`, `spellLintAll`, `spellReport`) never edits: THE TIER RULE (`damageEffect` with dmg ≥ 120
below tier III — the 7 survey offenders), dead fields (`SPELL_DEAD_FIELDS`, 68 rows), the LOS triple, duplicate
names (the two Tail Whips), off-pool rows (29), unknown families / upgrades, masks. **EWSpellMods v2**: doc keys
`families / upgrades / raceFamilies / views` (id → row, null = delete), IMPORT MERGES by default (`{ mode:
'replace' }` swaps; `pick` a Set of "group:key[:field]" from `diff(obj)`), export carries `spellNotes` + `report`,
prune covers the registries. **THE ONLINE GUARD**: `setOnline(true)` from online.js `applyOnlineRules` restores
vanilla tables for the match (`state.js transitionTo(MAIN_MENU)` calls `setOnline(false)`); any `apply()` while
`isOnlineMatch()` stays vanilla; `_goToSpellLibrary` refuses to open and the v1 screen says EDITS OFF. **The bake**:
`node bake-spell-mods.js <export.json> [--data] [--out] [--notes] [--dry-run] [--no-test]` patches the literal
rows field by field (comments survive; factory-call rows like `_mkCharge({…})` and the two duplicate-id literals
included; aliases warn), appends added rows to their home array, removes deleted rows (and warns about RACE_TREE /
share references left behind), rewrites learn orders, turns movepool adds into the "Baked movepool shares" table,
patches the registries row by row, then runs `npm run test:quick`. Test: `spell-schema.test.js`. Phase 1 (the new
screen) is next; the v1 editor keeps working on the v2 doc meanwhile.

## THE SPELL LIBRARY — Phase 3, THE TARGETING (2026-09-26, local delivery: spell-library/ENTROPY_WARS_SPELL_LIBRARY_3.zip, token 20260926-spell-library-04-cors)
SPELL_LIBRARY_PLAN.md §4.7 / §6.2 / §9 row 3. Two RIDERS on a `kind: 'damage'` row (any other kind ignores them —
the lint says `riderKind`; a malformed object says `riderInvalid`). data.js owns the normalisers every reader goes
through: `spellRandomTargetsOf(def)` → `{ count 1–8, scope 'enemies'|'units', distinct, mult }` or null,
`spellSplashOf(def)` → `{ mult (0.5), radius 1–3, mask|null, team 'enemies'|'units' }` or null, `splashOffsets` /
`splashTilesAround` (the origin is never a splash tile), `pickRandomTargets(pool, count, distinct, rng)` (pure, ONE
rng draw per pick). **randomTargets**: `_kindMeta` returns `_RANDOM_KIND_META` (selfCast + offensive + breaks
stealth, minRange 0) so the cast needs no aim; the POOL is `_getSpellValidTargets` of the row WITHOUT the rider
(`_riderBaseDef` — range, 3D reach, LOS, fog, taunt, usability) minus the caster, allies (unless scope 'units', via
`_riderAnyTeam`), realm-shielded and cryptid-hidden units (`_randomTargetPool`). doSpell's `_rndRider` branch draws
with `engineRng` (host only) and `_castRandomTargets` runs the caster's clip + camera + the first shot through
`executeSpellAnimation` (cameraOpts frame every pick), then one volley per further pick 260 ms apart
(`playSpellRiderFx('shot')` + `_applyDamageSpellHit` with dmg × mult). No victim ⇒ the cast is refused before
anything is spent; `hasSpellTargetInRange` greys the row the same way; `getSpellRangeTiles` = the caster's tile +
the row's range disc (the self-cast preview washes it faintly and lights the pool). **splash**: `_applyDamageSpellHit`
calls `_applySplashDamage` after the primary hit and BEFORE `_runPostEffects` (a push never moves the origin first):
the `team` units on the splash tiles round the victim (never the victim, never the caster, not realm-shielded) take
`computeSpellBase × mult` (one variance draw, only when something is splashed) through `applyDamageToUnit` —
damage type, element, `bonusVsStatus` ride; statuses do NOT (the primary hit carries them). Turrets / doors /
buildings / objects on splash tiles are NOT hit (the splash is a unit rider, not an area cast). **Online**: nothing
new on `state` or units; the guest never re-rolls — damage arrives by state-sync and the extra shots + the splash
ring by the `'rider-fx'` relay (online.js wraps `playSpellRiderFx`; the guest fog-gates a shot on either end, a
ring on its centre). **AI** (ai.js): `findSpellTarget` returns the caster for a random row once an enemy is in
reach; `scoreSpell` = mean hit over the pool × the hits it lands (allies in reach dilute a scope-'units' roll); a
splash row's hit adds `_splashBonus` (enemies round the victim at × mult, minus allies for team 'units') and the
picker prefers the victim with the most worth round it. check-ai-spell-dispatch.js prints a `riders` block.
**Presentation**: the rack / HQ blades wear 🎲×N and SPL N% badges (hud.js `_hrlgRiderBadges`); a splash row's
card shape is the victim + its splash tiles; the board hover paints the splash tiles and forecasts dmg × mult there
(no statuses); `describeSpell` says "to 3 different random enemies in range — no aim" / "Splashes 50% of it onto
every enemy adjacent to the target"; `computeSpellManaCost` prices random as count × mult targets and a splash as
1 + tiles × mult / 3. **Two example rows** (`SPELL_RIDER_EXAMPLES`, registered in SPELL_BY_ID only — no race row,
job row or family, so no player can equip them until the user keeps one via the library's POOLS or deletes it):
Scatter Shot `riderScatterShot` (64 physical, 3 distinct random enemies in range 4) and Impact Round
`riderImpactRound` (90 physical, 50 % splash radius 1). Tests: `spell-riders.test.js`, `ai-spell-routing.test.js`
(three rows). Not playtested live.

## THE PASSIVES + THE GEAR MERGE (SPELL_LIBRARY_PLAN.md Phase 4, 2026-09-26)

The user's rulings (2026-09-25): equipment and passives are ONE kind of row, equipped in the spell slots, **at most 2
of the 7** (`PASSIVE_SLOT_MAX`); today's accessories are **universal** (the GEAR family in every pool); tiers and SP
are the user's to set. So:

- **A passive row** = a `SPELL_BY_ID` row with `kind: 'passive'` (role passive), a numeric `tier` (= its SP), `families`,
  `icon`, `desc` and `hooks: { <key>: value }`. It takes a slot and its tier in SP like a spell. The verdict
  (`spellAddVerdict` reason `'passives'`, "2 PASSIVES MAX · UNEQUIP ONE"), `isTreeLoadoutLegal` and `treeLegalSubset`
  (the third is skipped, earlier picks win — also the online host's check) enforce the cap. `buildTreeLegalLoadout`
  may roll gear (weight 1, capped).
- **The 16 gear rows** (`GEAR_PASSIVES`, ids `gearBinoculars` … `gearDowsingRod`, `accessory: '<old id>'`,
  `GEAR_ID_OF_ACCESSORY` maps the retired ids): tier I, family `gear` (`universal: true` → `unitSpellPoolParts(...).gear`
  in every unit's pool, a Freelancer's too). Spelunking Gear is gone (nothing read it). `EQUIP_DEFS` stays only as the
  labels of the retired ids.
- **On the board a passive row is never a spell**: map.js `createUnit` moves it out of `unit.spells` into
  `unit.passiveRows` (ids — they ride the snapshot, so the guest reads the same rows; nothing relayed). `getUnitPassives`
  = the race's inherent passives (still capped by `MAX_UNIT_PASSIVES`) + `passiveRowWrap(id)` per row (hooks at top
  level, cached per row object), so every hook key reads through `unitPassiveValue` unchanged. `SPELL_KIND_META.passive`
  + `_getSpellValidTargets` → [] are defence in depth. `unit.equipment` survives only as the DISPLAY mirror of the gear
  rows (sprites, badges, the inventory's flare / ward); the truth is `passiveRows`. `unitHasAccessory(unit, accId)` reads
  the rows (`unitHasGear` — never through getUnitPassives: canFly asks unitHasJetpack); a one-use flare / ward leaves the rows.
- **The hook keys** (`PASSIVE_HOOK_KEYS` is the catalogue): the accessory behaviours became keys any passive may carry —
  `statBonus` (the stat sticks; folded into the stats at build by `unitPassiveStatBonus`), `regenPerRound` (% max HP,
  Chrono Locket 5), `surviveLethalOnce` (Talisman), `purgeDebuff: { lashAtkPct }` (Censer), `spellLock` (Brand / Focus;
  the lock names the row), `basicEcho` (Echo Band 0.5), `revealInvisibleWithin` (Hagstone 4), `revealTrapsWithin`
  (Dowsing Rod 3), `buildBonus: { build | dig }` (Mason's Gauntlets 1 → 2 ops / AP, capped 4), `grantSpell: { id, cost }`
  (Grapnel Gauntlet). New keys the user named: `healOnceBelowPct: { pct, healPct }` (once per life, `_passiveSpent`,
  recharged at respawn), `physicalElementRider: '<element>'` (a physical hit with no element takes it —
  applyDamageToUnit, so affinity + combos read it), `weatherBonus` / `terrainBonus` / `zodiacBonus` = STAT STAGES
  (`{ storm: { atkStages: 1 } }`; zodiac keys: a sign, an element's three signs, or `'own'`) added in
  `getStatStageCount`, so the ruler clamp and every consumer inherit them.
- **Old saves**: the retired `equipment` pair folds into the kit as gear rows after the save's own picks
  (`gearMigrateIds`) on createUnit's three kit paths, in the forge (party-builder) and in the HQ record
  (`hqPartyNormMember`), then the repair prices and caps them. `recordLastParty` still files the raw pair (migrated at build).
- Test: `family-passives.test.js`. Not playtested live.

## ⚙ THE UPGRADES (SPELL_LIBRARY_PLAN.md Phase 5, 2026-09-26, token 20260926-spell-library-06-cors)
- **The rule (the user's standing defaults, §7 Q3):** an upgrade is a `SPELL_UPGRADES` row (data.js) with its OWN SP price
  and a PATCH; at most `SPELL_UPGRADE_MAX` = 2 per spell; an equipped spell costs its tier + Σ its upgrades' SP; the rack
  stays 7 slots / 16 SP. An upgrade never changes a spell's identity: `id` and `name` stay (casts resolve by name).
- **The seed (14 rows):** Empowered `upDamage` (+15 % dmg, 1 SP) · Ricochet `upRicochet` (one bounce to the weakest enemy
  within 2 of the victim, ×0.5, 2 SP) · Forked `upExtraTarget` (+1 target: the enemy nearest the victim among the spell's
  legal targets, ×0.5, 2 SP) · Exploit `upFinisher` (bonusVsStatus +0.5) · Knockback `upKnockback` (+1 push; a single hit
  with none pushes 1) · Undertow `upBlowback` (+1 pull) · Blast `upBlast` (a single hit gains a 3×3 SPLASH at ×0.5, 2 SP) ·
  Widen `upWiden` (an area cast → 5×5, 2 SP) · Efficient `upEfficient` (−10 MP, floor 5) · Long Reach `upReach` (+1 range) ·
  Lingering `upLinger` (statuses +1 round) · Surplus `upDeploy` (+1 deploy cap) · Overclocked `upTurret` (turret ×1.25 dmg /
  HP, +1 range) · Hot Loads `upGun` (door-gun lane / arrow / beam / heal ×1.2, +1 bounce). Prices are first guesses.
- **Which upgrades a spell takes (`spellAllowedUpgrades`):** the row's `upgrades` list when non-empty (CUSTOM); an EMPTY
  list = AUTO — every registry row with `auto !== false` that FITS it (`spellUpgradeFits`: the row's `roles`, `families`,
  and its `requires` test in `SPELL_UPGRADE_FITS` — dmg · singleDmg · area · finisher · status · push · pull · cost · ranged ·
  cooldown · deployCap · turret · gun · heal); `upgradesAuto: false` = NONE. Passive rows never. `excl` groups make them one
  of a kind per spell (Ricochet / Forked / Blast / Widen are all `spread`; Knockback / Undertow `shove`). Lint
  `upgradeOffFit` (amber) when a CUSTOM list names one that does not fit.
- **The loadout:** `meta.spellUpgrades = { spellId: [upIds] }` beside `meta.customSpells` (the forge, the team archive,
  state.js's rebuilt meta + last party, the HQ record, party-config all carry it). `loadoutSpUsed(ids, ups)`,
  `spellAddVerdict(…, poolSet, ups)` and `isTreeLoadoutLegal(…, ups)` count it; `spellUpgradeVerdict` → ok · unequipped ·
  notAllowed · dup · cap · excl · sp. **THE REPAIR** `treeLegalUpgrades(race, cls, ids, ups)`: spells first (the kit
  treeLegalSubset kept), then each spell's upgrades in order — off-list, duplicate, over the cap, excluded or unaffordable
  ones are skipped. It runs in online.js's party-config receipt (the host) and in map.js createUnit (every unit).
- **The board:** createUnit stores `unit.spellUpgrades` (ids) and turns each upgraded spell into ONE derived def in
  `unit.spells` (`resolveSpellDef` — `dmg × 1.15`, `cost − 10`, a `splash`, `ricochetRider`, `extraTargets`, …, `_base` /
  `_ups` / `_upSp`, the desc gains "Upgrades: …"). unit.spells rides the snapshot, so the guest reads the same numbers with
  no new relay. Two new riders in battle.js `_applyDamageSpellHit` (after the splash): `_applyUpgradeRiders` — the bounce
  (`calcBounceTarget`, the Ricochet spell's pick) and the forks (`_extraTargetVictims`: nearest the victim, then the
  weaker); units only, enemies only, no statuses; presentation via `playSpellRiderFx('bounce' | 'shot')`, relayed as
  'rider-fx' (new `fromId`). The door gun's `_gunDoorSpell(door)` reads the OWNER's derived row (Hot Loads).
- **The AI:** state.js `applyRandomSpellsAndSecJob` and the forge / HQ RANDOM buttons spend leftover SP with
  `buildRandomUpgrades` (damage upgrades weighted ×3, not always maxed). The AI's scorers read the derived def's numbers.
- Test: `spell-upgrades.test.js`. Not playtested live.

## ✦ THE FAMILIES AS POOLS (SPELL_LIBRARY_PLAN.md Phase 6, 2026-09-26, token 20260926-spell-library-07-cors)
The user's library export (90 families, 359 row edits, 5 deletions, Metal deleted) was baked first, then the Phase 6 pass
(`/tmp`-built doc baked with bake-spell-mods.js): the 125 rows with no family, the 14 still tagged with the deleted Metal and
the 2 with two families each got ONE family; 13 new families in the user's pattern (Living Stone, Human Grit, Main Character
Energy, Deep Sea Anatomy, Prism Lattice, Infernal Court, Horns & Hooves, Apex Predator, Grave Hunger, Kaiju Rampage, Ooze
Biology, Sentai Colors, Symbiosis); every race has 3–5 families in `RACE_FAMILIES` (the user's rule is 3–10).
- **The pool:** data.js `unitSpellPoolParts(race, cls).race` = the RACE_TREE row (rung order, twins) THEN every member of the
  race's families (`raceFamilyPoolIds` → `familyMemberIds`, tier then name, from `familyMemberIndex()`, dropped by
  `stampSpellSchema` after every library apply). Door-wheel rows stay in `parts.wheel`, universal families (GEAR) in
  `parts.gear`. The verdict, `isTreeLoadoutLegal`, `treeLegalSubset` (the online host's repair) and the AI's
  `buildTreeLegalLoadout` all read the pool, so no other site changed. `spellReachableIds` (the offPool lint) adds the family
  pools: 0 rows are off-pool now (Scatter Shot / Impact Round ride Gun Training, Green Arrow rides Archery).
- **One family per spell:** lint `familyMulti` (red); `elementFamily` fires only on a row with NO family (a row's family is
  its identity, its element only a damage type).
- **The deleted five:** the tree rungs moved to rows of the race's families (reptilian capstone = Flat Earth, chosen one R2 =
  Plot Armor, anubis R2 = Rigormortis, mothman R3 = Cryptid Vanish + R1 twin Red Eyes / Dread Aura, popstar R2 = Stage Dive),
  shared into the races' RACE_ABILITIES. raceTailWhip's capstone director is still registered (dead, unreachable).
- **Bake fixes:** a row a movepool drops MOVES to SPELL_LIBRARY (sentaiGreenArrow) instead of being deleted; an empty
  registry (`RACE_FAMILIES = {}`) takes its rows as one block; two inserts at one spot keep their order.
- The order is tree row → the job's four → the family members: a job row in a race family (Brave Charge in Knighthood)
  keeps its JOB source. sprites.js `SPELL_ANIM_VERBS` / battle.js `SPELL_DIRECTOR_ROWS` dropped the deleted ids.
- Test `spell-families.test.js`; SPELL_CATALOGUE.md is the generated family / race table.
