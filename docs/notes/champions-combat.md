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

## ✦ THE FAMILIES AS POOLS, PHASE 7 (SPELL_LIBRARY_PLAN.md Phase 7, 2026-09-26, token 20260926-spell-library-09-cors)
A race's spells ARE its families' members: data.js `unitSpellPoolParts` takes the job's four, then `raceFamilyPoolIds(race)`;
RACE_TREE is no longer read for the pool (kept for the MP ring, the twins and DEFAULTS; spell-families.test.js proves every rung
sits in the race's families, and a rung re-tagged out of them leaves the pool). `spellFamilyIsUnique` + `raceFamilyIds` keep a
unique family its race's alone. The Freelancer borrows family by family (`flBorrowFamilyIds` → `flRacePool`; unique / universal /
own families never). `spellFamilyGroups(ids, race)` folds any id list for the racks. Job pools are still the job's four (job
families wait for the user's ruling). Legality, the SP / slot / passive caps and the online host check are unchanged
(`treeLegalSubset` repairs a save holding a row the new pool dropped).

## THE SECOND FAMILY EXPORT (2026-09-27, token 20260927-spell-library-10-cors)
The user's export re-familied 35 rows and added 23 families; RACE_FAMILIES rows for 52 races changed. RACE_TREE rungs must sit in
the race's families (spell-families.test.js), so 27 rows swapped rungs for rows of their families, borrowed by id in the movepool
share table ("SPELL LIBRARY (2026-09-27 …)" block). A rung's ring must equal its tier somewhere (the stamp's min ring), so a
borrowed lower-tier row on a higher ring needs a ring-matching seat elsewhere (Summon Sandstorm → the martian's ring II twin,
Fissure → the gnome's ring I). Families on no race must be empty or job-only (Marksmanship, Agriculture today). Full log:
SPELL_LIBRARY_PLAN.md §11.

## ✦ THE JOBS REMOVAL (2026-09-27, token 20260927-spell-library-12-cors, zip spell-library/ENTROPY_WARS_SPELL_LIBRARY_12.zip)
mondo: "get rid of the job system. All job spells are already assigned to a family ... The job passives can be added to
the optional passives for 1 SP." What changed:
- **No jobs.** `unit.cls` is the neutral `UNIT_CLASS = 'Vessel'` everywhere (one CLASS_TEMPLATES row); it is only a
  sprite key now. Deleted: JOB_ARCHETYPES (→ DEFAULT_IDENTITY), RACE_DEFAULT_JOBS (→ RACE_KITS / raceKit: the old Sniper
  races reach 4, Gunslinger/Psychic races 2, Agent races 2 + inspect 2), JOB_KITS, JOB_MODIFIERS, computeSecJobBonuses,
  JOB_PASSIVES, CLASS_PASSIVES, getJobPassive, JOB_DISPLAY_NAMES, CLASS_TREE, getClassTreeSpells, the Freelancer
  (flOwnedJobs / flWildcardPool / SECONDARY_JOB_LEVEL), every `classRestriction`, applySecondaryJob, learnSpellForUnit
  (level-ups no longer grant job spells). CLASS_SPELL_LEARN_ORDER stays as MP-ring / capstone PRICING data only.
- **The pool** = the race's families + the universal families (GEAR, TRAINING) + the door wheel; `unitSpellPoolParts`
  keeps the `job` / `borrowJob` keys as empty arrays for old callers.
- **Marksmanship + Agriculture** had no race (their spells were job spells): marksmanship now sits on the 5 old Sniper
  races, agriculture on the old Harvester races (bigfoot, antperson, scarecrow, shaman, king kong).
- **✦ TRAINING** (new universal family, `TRAINING_PASSIVES`, tier I = 1 SP, `kind: 'passive'`, count against the 2
  passive rows): Deadeye (+10 SPD, crit ×2.0) · Warpath (basic ×1.15, counter 30%, +5 armor) · Bulwark (soak 8, counter
  30%, +5 armor) · Arcane Surge (+8 spell power) · Grace (heal range +2, +24 heal) · Field Operative (2 scanners, +1
  inspect) · Third Eye (+1 debuff turn, teleport −1 MP) · Green Thumb (life sap ×1.2, felled trees) · Tinker (turret
  range +1, repair ×1.2) · Crescendo (+1 buff turn, lullaby range +1) · **Adaptable** (opens the borrow window) · Brute
  Force (basic ×1.2, swims) · Riposte (counter 35%, counter hits for 60%).
- **Hooks stack** through data.js `unitPassiveSum` / `unitPassiveMult` / `unitPassiveMax` (sum for flat bonuses,
  product for multipliers, max for chances / caps). Every new key is in PASSIVE_HOOK_KEYS (the lint flags unknown keys).
  createUnit folds armor / spellPower / healBonus / inspectBonus into the unit; battle.js reads the rest live
  (counter, crit, soak, basic mult, durations, ranges, turrets, repair, sap, teleport, scanner cap via
  `getItemCapForClass(unit, key)`).
- **Adaptable = the old Freelancer.** `loadoutBorrows(ids)`: only a loadout holding `passiveAdaptable` (ADAPTABLE_ROW_ID)
  gets `borrowRace` (every other race's families). Unequip it and treeLegalSubset drops the borrowed spells. The story
  officer starts with it (`hqOfficerKit` = `raceDefaultKit(race, [ADAPTABLE_ROW_ID])`), which keeps the rule "the
  officer learns the spells of the vessels you own". The AI never picks it (buildTreeLegalLoadout excludes it).
- **Default kits** = `raceDefaultKit(race, lead)`: lead + race tree rungs + family members by tier, trimmed legal. map.js
  createUnit gives it to any unit whose kit holds no active spell (a seat never opened in the builder, a native): the
  job's level-up learnset used to fill those, and without the fallback they entered battle with no spells.
- **Basic-attack look** is keyed by race now (battle.js BASIC_ATTACK_RACE_FIRST / BASIC_ATTACK_RACE_CASTERS, generated
  from the old default jobs), so every race keeps its old shot.
- Profile CHAMPIONS / OVERVIEW stats key by race. Dropped: homosapien-Psychic flight, the job nametag mode (a stale
  'job' setting draws the race), the balance lab's job tabs.

## THE 2026-09-30 BATCH — seven new races from the user's Meshy uploads + the kaiju remodel
The user uploaded Running exports to R2 `Assets/Sprites/Races/<race>/Meshy_AI_<race>_Running.glb` (rigged, 28 joints,
1.7 m tall in the file). Wired: **astronaut** (ranged; astronautcamp · advancedtechnology · cosmic · athleticism; home
Spaceship = Outer Space), **krampus** (bruiser; christmasspirit · horns · blackmagic · winter; Fairy Forest site = The
Woods; ice resist / fire weak), **rabbit** (assassin; athleticism · trickery · fae · temporal; The Looking-Glass = off the
Fairy Forest), **luchador** (bruiser; martialarts · athleticism · dirtyfighting · stagepresence; The Strip = The Desert),
**firefighter** (tank; water · humangrit · teamwork · athleticism; Downtown = Disaster City; fire resist), **goblin**
(assassin; thievery · trapmaking · dirtyfighting · poison; Hollow Earth = The Cavern), **hippie** (support, both genders;
psychadelic · meditation · nature · agriculture · healingmagic; Stonehenge = Leylines). Each: data.js RACE_PROFILES,
RACE_CLASS, RACE_BASE_STATS, RACE_PHYSIQUE, RACE_ABILITIES (EMPTY: the pool is the families), RACE_TREE (rungs picked from
the families), RACE_FAMILIES, EW_RACE_BIOMES, POINT_OF_ENTRY (the home = population natives), CAMPAIGN_RACE_PRICES,
AVAILABLE_RACES (110; server.js literal too; Heat Death top tier 110), a PASSIVE_DEFS row on the immuneStatus hook
(sealedSuit poison · alpineHide frozen · quickFeet slow · ironChin stagger · turnoutGear burn · caveEyes blind ·
goodVibes discord) + party-builder.js trait; sprites.js RACE_SPRITE_GENDERS, RACE_MODELS_3D (`model:` the Running GLB),
RACE_SPRITES (2D borrows a sheet); lore in ui.js + party-builder.js.
**FINISHERS BORROW A BUILT STAGING**: a row's `sig` may name another race's built director; its own `lines`
([[from, to], …]) swap the director's captions (battle.js `_finLine`, applied in `_finPlayCinematic`'s `insert`). Same
timings + VFX, so online and the forge preview (`_FIN_STAGE[sig]`) need nothing new. Zero G = upUpAndAway, Coal Season =
naughtyList, Out of a Hat = abracadabra, Top Rope = orbitalDrop, Hose Down = theWave, The Horde = pileOn, Bad Trip = theTrip.
**Kaiju**: `RACE_MODELS_3D.kaiju.male` now `Races/kaiju/male/Meshy_AI_kaiju_Running.glb` (heightRatio 1.6 kept).
**SECOND + THIRD WAVE (same day, PR #13)**: the other 14. R2 file names are Meshy's ORIGINAL prompts, not the folder name
(clown/Meshy_AI_evil_clown, bunnygirl/bunny_girl, sharkman/shark_man, crystalguardian/crystal_guardian,
jackolantern/jack_o_lantern, sidekick/superhero_sidekick, mushroomgirl/mushroom_girl, sherrif/western_sherrif,
treeperson/walking_tree, starfish/sentient_starfish, ringleader/circus_ringmaster, beequeen/the_hive_queen,
professor/male_college_professor, deepseafish/alien_fish). Race keys: clown, bunny girl, sharkman, crystal guardian,
jack o lantern, sidekick, mushroom girl, tree person, sheriff, starfish, ringmaster, bee queen, professor, deep sea fish
(roster 124). Finishers: Behind You = sleepParalysis, Last Call = kissOfDeath, Jaws = nessieSurfaces, Shatter =
flashFrozen, Trick or Treat = graveRobbery, Holy Haymaker = haymaker, Fairy Ring = changeling, Timber = blurryFootage,
Run Out of Town = bookEm, Five Arms = releaseTheKraken, The Big Top = farewellTour, The Swarm = theColony, Final Exam =
eventHorizon, The Lure = theBloom. Homes: Haunted House, the Strip, Bermuda Triangle ×2, Agartha, Skinwalker Ranch,
Downtown, Fairy Forest ×2, Area 51, Atlantis, Football Stadium, Göbekli Tepe, D.U.M.B.
UNSEEN LIVE: every rig's scale/facing (heightRatio is the one-field edit).
**HOMES MOVED (same day, the user)**: clown + ringmaster live in THE CARNIVAL (HQ Room 1893, floor 4): race `npcSpots` there,
the ringmaster race standing where THE RINGMASTER agent stood (his line kept as `say`); their POINT_OF_ENTRY reads 'The
Carnival' (no site, so no site draw). Jack-o'-lantern = The Haunted House (the graveyard). NEW `DOOR_TEXT.ALSO_NATIVE`
{ race: [site labels] } — a second home that `doorSiteCrossings` reads: professor also Downtown (POE D.U.M.B.), sharkman
+ deep sea fish also Atlantis (POE Bermuda Triangle).

## THE SPELL AUDIT — Batch A + A2 (2026-09-30)
SPELL_FAMILY_AUDIT_PLAN.md §9 Batch A + A2 shipped (log: docs/spell-audit/BATCH_A_LOG.md; patch list
docs/spell-audit/batches/batchA.js). 294 rows patched, 8 deleted, the 21 Q1 T4 folds done. MP now follows the
explicit `tier` (data.js `getTierMpCost`, 25/50/75/100; ring only when untiered; `manaCostOverride` still wins).
Q2: `EW_MP_L1_FRAC` 0.35. battle.js now reads `cleanse` on heal/buff, `statusEffects` on shield/displacement,
`statStageBoost` on cleanse and no-damage barrages, `selfHealPct` on escape, and `noDamage` on aoe. Batches B
(registry), C (new rows) and D (engine) are listed at the end of the log.
Batch B (the registry) shipped the same day: 8 families gone, 6 renamed, Scarecrow / Ki UNIQUE, every race's families
and 73 races' rungs from plan §7, 22 MOVEs, 16 rung rows deleted, Chitin / Symbiote Armor now passives (passives never
cost MP), 18 new rung rows, and the heal kind's `healPct` + `statusEffects`. Log: docs/spell-audit/BATCH_B_LOG.md.
Batch C (new content) shipped the same day: 87 new §6.3 rows, 26 family passives (data.js `FAMILY_PASSIVES`, 18
LIVE + 8 live halves of PARTIAL ones), 4 upgrades (Exploit: Marked, Frostbite's live half, Encore Performance,
Counterspell on Spellsteal only). battle.js now reads `cleanse` on warCry, `statusEffects` on selfHeal, `auraRadius` +
`teamStatusEffects` on healAll (radius also in ai.js) and `groundsFlyers` on aoe (Meteor's flag was dead until now).
TRAINING_PASSIVES no longer resets a moved row's family. Log + the rows left for Batch D: docs/spell-audit/BATCH_C_LOG.md.

Batch D (engine) shipped 2026-10-01 — the plan is built. New row keys: `zoneTickDamage` / `zoneTickStatus` (damage
zones ticked at round end, `_pushDamageZone`), `zoneCastDamage`, `aoeLifeDrain`, `mpDrain`, `executeBonusPct`,
`statusIfTargetHas`, `selfStageBoost`, `stealBuffs`, `purgeFirst`, `stageIfBelowPct`, `stageHigherOf`, `timedStatBonus`
(the Quickened status), `tauntEnemiesWithin`, `decoyTaunt` / `breakStatus`, `spawnDecoy` on buffs, `healOnSwap`,
`healAdjacentDamage`, `bonusHitsPerAdjacentAlly`, `dashSweep`, `selfStatusAfter`, `throwAnyDirection`, `rimSeeds`,
`shatterPrisms`, `pairPicks`, `needsLoS`, `selfPullOnly`, row-level `allyOnly`, `leaveTerrainRadius`, `trapHitsAll`,
`summonDef.hitStatus` / `trailTerrain`, `snow_wall` terrain with `meltRounds`. Spells can crit (`critChance`). 27 new
passive hook keys (see PASSIVE_HOOK_KEYS), 31 new upgrades incl. the `addStatus`, `set`, `weatherPatch` and
`statusPayload` patch keys, upgrade `rows` pinning and the row field `upgradesBlock`. Log: docs/spell-audit/BATCH_D_LOG.md.

## 2026-10-04 — mondo's own 2D character sprites
Single-frame PNGs (~56-92 × 128) at R2 `Assets/Sprites/character_sprites/<file>.png`, wired in sprites.js
`_CHARACTER_SPRITES` (+ `_CHARACTER_SPRITES_GENDERED` for hippie m/f), checked first in `getR2RaceSpriteUrl` after the
hero sprites, and mirrored in `RACE_SPRITES`. File → race where the names differ: beequeen → bee queen,
deepseacreature → deep sea fish, gremlin → goblin, wrestler → luchador, crystalguardian/cultleader/icequeen/
jackolantern/mushroomgirl/policeofficer/treeperson → the spaced race keys. They replace the older ice queen + kaiju
sprites and every borrowed sheet. bunny girl has no file yet (still borrows catgirl). Portraits: he uploads later.

## THE PASSIVE CAP REMOVED + THE PASSIVE LEVELS (2026-10-06)
mondo: "Get rid of the limit on number of passives, gear, and training i can equip and add 1-2 upgrades to all of them".
- No passive cap: spellAddVerdict / isTreeLoadoutLegal / treeLegalSubset / buildTreeLegalLoadout no longer count passive
  rows. A passive still takes a slot (7) and its tier SP (16). PASSIVE_SLOT_MAX = SPELL_SLOT_MAX, kept only for old readers.
- Every passive / gear / training row takes SPELL_UPGRADES `upPassive1` (+1) then `upPassive2` (+2, `after: 'upPassive1'`),
  1 SP each, through the existing ⚙ upgrade toggles (party builder technique panel, HQ pause rack) and meta.spellUpgrades.
- data.js passiveHooksAtLevel(hooks, L): amounts ×(1+0.5L), multipliers' bonus part the same, fractions the same (cap 1),
  tile / round / stage counts +L, stagePerRounds `every` −L, grantSpell MP −25 %/level; negatives, lists, strings, flags stay.
  A row with nothing to raise (Martyr's Talisman, Adaptable, Umbral, Live Wire) gets +20 max HP a level.
- createUnit writes unit.passiveLevels { rowId: L } (rides the snapshot); getUnitPassives / battle.js aura holders call
  passiveRowWrap(id, level). passiveLevelDiff / spellUpgradeDescFor print the "AWR 28 → 42" line on the toggle.

## SPEED DRIVES MOVEMENT (2026-10-06)
mondo: a slow Loch Ness monster (SPD 21, acts near last) still walked as far as a SPD-40 unit, because the C band
(21–40) all got 2 tiles. data.js `moveFromSpd` now reads `MOVE_SPD_BANDS = [25, 40, 60, 80]`: SPD 1–25 → 1 tile,
26–40 → 2, 41–60 → 3, 61–80 → 4, 81+ → 5. Only the slow tail changed (annunaki/marksman/cosmic wraith already 1;
now also orb of light, telepath, kraken, loch ness monster, king kong, ai, tree person, droid, scarecrow,
juggernaut, mech, golem). Every reader (getEffectiveMove → getMoveTiles / AI / HUD, createUnit's stored move,
the party builder) goes through moveFromSpd, so story, VS-CPU and online (host builds, guest reads the same data.js)
agree. The fallbacks in battle.js / party-builder.js mirror the table.

## THE BASIC ATTACK FLOOR (2026-10-06, mondo: "a basic attack does like 1 damage ... raise the floor to like 25 ... and the ceiling a bit too")
battle.js constants (next to SOAK_FLOOR_SHARE, mirrored on window for ai.js / hud.js / ui.js):
- BASIC_ATTACK_COEF 0.75 (was 0.65) and BASIC_ATTACK_MIN_RAW 30 (was 24): the swing is max(MIN_RAW, floor(ATK × COEF)) ± 8.
  Every basic roll reads them: doAttack, the real-time `_hitBasic`, the Cube / turret swings, forecastBasicAttack,
  ai.js's oracle + Cube estimate, the HUD move-then-attack row, ui.js's fallback estimator. ~+15-20% on a typical hit.
- BASIC_FLOOR_SHARE 0.35 + BASIC_FLOOR_MIN 25: calcDamageResolution stage 7 (after the status taken mults, before
  the shield) lifts a hit flagged `opts.basicAttack` to max(0.35 × base × levelMult, 25 × levelScale(victim level)).
  So it is the same slice of an HP bar at every level (25 of ~910 at the cap, ~2 of ~70 at level 8). Shields still
  absorb it, Indomitable still holds at 1 HP, immune / incorporeal / Protected still blank it (early-outs).
- Flagged hits: the doAttack swing, its counter, the pincer follow-up, the Echo Band echo, the real-time swing and
  forecastBasicAttack (so every preview carries the floor through the one hit math). Spells never get it.
- Examples at the cap (PvP): worst (ATK 66 vs DEF 156, resisted, 3 tiles out, 2 tiers uphill, Bulwark, Guarded,
  low roll) 6 → 25; typical (ATK 140 vs DEF 112) 119 → 144; best (crit + back + capped ×3) 1209 → 1398.

## THE 2026-10-06 BALANCE PASS (Balance Lab export, 1,582 arena matches)
Full analysis + before/after tables: `BALANCE_ANALYSIS_lab_20261006.md` (repo root). 16 race statlines and 9 spell
rows moved (comments tagged `BALANCE PASS 2026-10-06` in data.js). Battle grades now read the base ruler
(data.js `statGradeValForUnit`: level growth taken off before the letter; ui.js inspect, hud.js quick stats, map.js
pause sheet). Lab (battle.js): build-token stamp + stale-match warning, Cube damage per race, zone ticks credited to
their spell, spell tier/families + `analysis.families` + `analysis.neverCast`, tree-shape roll-ups fixed for the
`R·T` sig. Open: Tier II damage rows hit like Tier I; 74 fielded spells never cast in the lab.

## THE RACE EDITOR (2026-10-06, mondo: "a race editor similar to the spell editor")
Settings → Developer → Open Race Editor, or RACES ↗ in the Spell Library top bar (index.html `#raceEditorPage`, map.js
`_goToRaceEditor(from)` / `_raceEditorBack`, ui.js RCE block at the end of the file, styles-hud.css `.rce-*`).
**The diff layer** = data.js `EWRaceMods` (after EWSpellMods; localStorage `ew_race_mods_v1`): sparse per-race rows
(hp mp atk int def mdef spd awr · label labelMale labelFemale faction types · affinity · terrain · role · range · biomes)
plus `grades` (STAT_GRADE_BANDS), `curve` (LEVEL_CURVE) and `gains` (LEVEL_TOTAL_STAT_GAINS), written IN PLACE into the
live tables (restored from a pristine snapshot first), pruned at boot when data.js ships the value, OFF online (online.js /
state.js call setOnline like EWSpellMods). EXPORT = `format: 'entropy-wars-race-mods'` with `summary`, `baseline` and
the doc; no bake script — a thread writes it into data.js by hand (the export's `instructions` name every table).
**THE ONE STATLINE RULE** (mondo: "PvP is the same races as in the story mode just at level 100"): a race has one BASE
statline; every mode builds a unit with levelStatGains (story at its level, PvP at 100); the letter grade reads the BASE
and never moves with level (the Pokémon model). The editor's EDIT AT switch (BASE · LEVEL 1 · LEVEL 100) only changes
what the typed / shown numbers mean (data.js `raceStatAtLevel` / `raceBaseForLevelValue`); the stored number is the base.
The Mystery Dungeon boss's ×1.6 HP / ×1.2 ATK (battle.js) was the one mode-specific stat change and is gone.
**New data.js tables** the editor writes: `LEVEL_CURVE` {hpL1, mpL1, hpExp, statExp} (levelScale / levelStatGains /
levelGrowthDeficit read it; the old consts are its shipped values), `RACE_TERRAIN_PREFERENCE` (moved out of state.js
getTerrainPreferenceForRace), `TERRAIN_PREFERENCE_BONUS` (moved out of getTerrainPreferenceModifier),
`TERRAIN_PREFERENCE_OPTIONS`, `statHelpRefreshGrades` (STAT_HELP band text follows the bands), `racePowerBudget`
(the check-grades budget, target 262). RANK: KEEP SHAPE stretches the list's current ladder of values to the new floor /
ceiling (a drag swaps who holds which value); EVEN STEPS spaces them equally. The duel calculator re-states the
calcDamageResolution chain for a neutral hit (no types / elements / statuses / passives) — keep it in step with battle.js
when the damage math moves. UNSEEN LIVE (RULE #1c): Firefox drag and drop on the RANK list, the narrow layout.

## RACE EDITOR BAKE 1 + ZODIAC EFFECTS (2026-10-06)
- mondo's first race-editor export baked into data.js: all 124 RACE_BASE_STATS rows (new scale, stats up to ~200, HP up to
  ~1800), black goo poison absorb, golem lost poison immunity, every STAT_GRADE_BANDS row re-cut, LEVEL_SCALE_EXP 1.35 → 1.2.
  STAT_HELP text rewritten to the new bands (no more "0–100 ruler").
- SPD → tiles follows the SPD letters again (moveFromSpd reads STAT_GRADE_BANDS.spd live; MOVE_SPD_BANDS = C−1 … S−1).
  computeUnitStats no longer caps SPD at 100.
- Still on the OLD 0–100 ruler (not touched, flag before balancing): AWR 84 cloak detection (battle.js), crit +2% per 14 AWR,
  SPD 90 two-high leap, STAT_STAGE_STEP sizes, Bloodcraze's 100 SPD clamp.
- ZODIAC_EFFECTS (data.js, beside ZODIAC_ICONS): per sign `sky` = percent while the sign rules the sky (atk int def mdef awr
  move heal; shipped +10 each = the old ×1.10) read by state.js getZodiacBonus(unit).m(key); `natal` = flat base stats for
  units born under the sign, added in computeUnitStats(race, cls, zodiac) (map.js createUnit) and shown in the party builder.
  Race editor ZODIAC tab edits it through EWRaceMods doc.zodiac (export/import/prune/undo like race rows).
- Race editor shows each race's portrait (RACE_PORTRAITS), else its 2D sprite; a failed image removes itself.
- Follow-up (same day, mondo: "let me change the bands like everything else in the editor"): MOVE_SPD_RULE {follow, from}
  in data.js; the GRADES tab has a MOVE TILES row (FOLLOW SPD LETTERS toggle, or type the SPD for 2/3/4/5 tiles), stored
  as EWRaceMods doc.move like the other global groups.

## AI TRAINING ON THE NEW ARENA RULES (2026-10-07, ai.js v4.14, weight schema 14)
mondo's gen-40 export (2,360 arena matches, v4.13) was trained on the old rules: a 100-round safety cap (every
`arena_composite` win sat at round 101), 3 of 5 Keys, the old 8×8 Δ training boards. 81% of matches ended on the Cube at
~22 rounds, so under the 20-round limit most of them now end on the Arena score, which the AI did not model at all.
- ai.js: `arenaScoreOf` mirrors battle.js `_resolveArenaTimerExpiry` (+ the nexus rounds held zones still accrue, surge
  ×2); `assessWinCondition` gives Arena the same protect_lead / seek_score / break_tie / sudden_death policy TDM has (a
  lead under one kill's 15 points counts as a tie). Kills credit 15 pts × ARENA_PT_VALUE (4); `arenaBountyPts` mirrors
  processBountyClaim (15 at a 3-streak, +5 a kill, cap 35) for hunting ON FIRE enemies and protecting our own. Late-clock
  pulls on zones and Keys.
- New trainable keys: `arenaScorePlay_v1` (probe arenaClock), `bountyKillBonus_v1` (probe arena), `keyHuntPriority_v1`.
- Schema 14: fresh stats/history; every v13 trained value carries over (mondo 2026-10-07: "a lot of stuff from this data
  would still apply"). ai.js v4.15 ships the gen-40 champion's ten adoptions as the defaults (AI_TUNE + AI_WEIGHT_DEFAULTS,
  `prev` = the replaced value; ranges widened where a value sat on an edge). Analysis: /mnt/project-files/ai-training/.
- Adoption: full-batch threshold 60% → 65% (36/60 is p≈0.16 two-sided; the pass-2 retest of Kill Bonus went 30-30).
- Lab map rotation = `hqArenaPvpPool()` (map.js `_trainMapPoolFor`; gauntlet keeps full maps). Exports carry
  `_meta.rules` (round limit, Keys, board size, points) and `p1WinRate` (what "championWinRate" always measured).

## STAGGER ONE TURN · PROTECT CHARGES · INFO PANEL TYPES (2026-10-07, mondo)
- Stagger is the -1 AP it takes. battle.js `_staggerSpendActivation` (called from maybeAdvanceTurn when the unit's turn
  ends) clears it after the staggered unit's short turn; a stagger owed as `_staggerApDebt` (landed after the unit acted)
  stays up through the round tick and clears after next round's turn. A longer stagger (Aftershock) spends a turn and
  owes the next one's AP. A press refund (`applyPressTurn`) lifts it (`_staggerLiftByRefund`).
- Protect: STATUS_DEFS.protect.blocks = 1 — it turns away that many ATTACKS then drops (rounds are the outer limit).
  Payload `blocks` overrides (library status row "blk" box; upgrades upBulwark / upBulwark2 via patch `protectBlocks`).
  One attack = one action (`_protectActionSeq`, bumped in doAttack/doSpell/doComboAttack/doEntropyStrike/doFinisher), so
  every hit of a multi-hit swing rides one charge. Sourceless hits (DoT, hazards) are blocked without spending a charge.
- Clicked-unit panel (hud.js `_hrlgQuickVitals`) and the INFO card show the unit's type badge(s); the element box uses the
  new `.ew-elem-box.xl` size (styles-base.css). Immune/absorb targets wear a red !-circle (hud `immWarn`, ui
  `_IMM_CIRCLE_HTML`) beside where the green super-effective one sits.
- Status resist (state.js getStatusApplyChance): base stick chance per status (stagger/blind/slow 90%, burn/poison 84%…)
  + 3% per point of caster-over-target effective INT (capped ±18%), clamped 60–95%, then halved if the target resists
  the status's element (0 if immune/absorb). Passive immunities bounce it before the roll.

## THE MOVE SAFETY PASS (2026-10-07, mondo: accidental moves in online matches)
- Battles take no WASD / arrow movement and no drag-to-move. ui.js's battle key handler only keeps Mystery Dungeon
  lockstep; the gamepad stick still drives the board cursor (untrusted synthetic keys) and A confirms through clickTile.
  ShooterControls / hub free-roam keep their own walkers. handleTileDragStart is editor-only now.
- Every move AND every jump ends on the ROOT action menu (finishMoveAt + doJump's landing). The online guest's
  relayed doMove / doJump reset its local menu too (online.js `_guestMenuToRoot`).
- Rooted (any STATUS_DEFS `blockMove`): `unitMoveBlockedByStatus` (battle.js) gates canUnitMove, getJumpTiles and
  doJump, so no jump, no jump-then-cast / jump-then-attack approach. The Jump blade reads "Rooted".
- Blink aim: self teleports paint solid 'move' destination tiles from the moment they are armed; body-moving and
  placement casts keep their reach at full strength under the hover plate (`window._ewAimKeepsReach`, read by
  three-renderer `_updateHlFocusDim`); an illegal blink tile shows a grey plate.
- Status badge colours: hud.js `_HRLG_SB_COLORS` is the one palette for nameplates, Horologe chips, unit panel and the
  glossary. Bleed is dark red; no status falls back to grey.

## BALANCE PASS 2026-10-07 (mondo's lab export, 5,356 arena matches; spells only, no race stats)
- Full analysis: /mnt/project-files/balance/BALANCE_ANALYSIS_lab_20261007.md. 19 spell nerfs + 24 buffs in data.js
  (dmg / dmgPerLevel / dashDamage / hitDamages / selfHealPct / collisionBonus on the rows themselves).
- Cube damage a game correlates 0.85 with race win rate; only basic attacks hit the Cube (getCubeAttackDamage), so
  ranged basic attackers top the table and casters sit at the bottom. Not changed here.
- Gotcha: `_applyManaCostFormula` derives a provisional MP cost from dmg BEFORE tier costs overwrite it, and
  `_applyBaselineCooldowns` stamps a 2-round cooldown on that provisional cost >= 80. A dmg change can silently add or
  drop a cooldown. Railgun (cooldownRounds: 0) and EMP Burst (cooldownRounds: 2) are pinned for that reason. Diff
  SPELL_BY_ID through load-data.js before/after any dmg pass.

## CUBE 2400 · KILLS 25 · AI WIPEOUT (2026-10-07, mondo)
- map.js TOWER_MAX_HP 1800 → 2400 (also window.EW_CUBE_MAX_HP, stamped into AI training exports as rules.arena.cubeHp).
- data.js ARENA_PTS.kill 15 → 25; every fallback literal (battle.js ×2, hud.js, ai.js) follows. ui.js's two arena
  scoreboards had a stale literal (kill 15, hourglass 40, nexus 3, no Cube cap, no bounties); they read ARENA_PTS now.
- AI: ai.js killValue adds `wipeoutKillBonus_v1` (3000, trainable, no schema bump) for the enemy's last standing body
  and 10% of it for the second-to-last. Before this the AI had no idea a wipe wins: only Cube hits / Key pickups were
  flagged as wins, and tower_push phase pulled it off the fight after its first kill (lab: 88 wipeouts in 5,356).

## THE FOUR BATTLE FIXES (2026-10-08, mondo)
- Mirror Blink range (third report): the real cause was ui.js `window._renderForecastBadges`. ui.js is a classic script, so
  its top-level `function _renderForecastBadges` IS `window._renderForecastBadges`; the wrapper assigned over it called
  itself until the stack overflowed. Every handled forecast preview threw, and setTool died inside updateAoePreview before
  it drew the board, so the blink's destination tiles never appeared. The worker is `_fcRenderBadges` now. Never assign a
  `window.X` wrapper that calls a same-named top-level function in ui.js / battle.js / hud.js.
- Every cast and placement ends on the ROOT action menu (battle.js finishAction; the guest's relayed doSpell resets its
  local menu too, online.js `_guestMenuToRoot`). No more staying armed on the same spell.
- Pulse Lattice discharges on the god shot (the self shot's sourceHold + 120 ms), not at cast time: its beams and "-N"
  pops used to finish while the camera was still on the caster.
- Highlights over water: data.js hqFieldBuild files `field.sheets` (a waded IN cell's liquid sheet, room metres); three-
  renderer `_fieldSheetY` + `_buildDrapeGeo` keep every highlight vertex on top of it. Bodies still stand knee deep on `tops`.

## THE SKIN LINE (2026-10-12, mondo: highlights missing on top of a Rampart wall, and sometimes on water)
- Cause: some ground is a SHEET laid over the column top, and highlights at tileTopY + a few px sat under it (depth test).
  THE PATCH on a tile board (`_deltaPatchBuild`, every raised / dug cell since 2026-10-05) lies max(0.6, ts × 0.008) px
  over the voxel top: the plates (+0.3), cursor / selected-tile brackets (+0.5), AoE (+0.6) and unit rings (+0.65 / +0.8)
  were all under it. A dry cell beside water wears a liquid-spread flow slab up to 1.3 levels high: its highlight lay at
  the bottom of the water. PR #172's wade line only covered waded FIELD cells (exploration rooms), not tile boards.
- Fix (three-renderer.js): `_deltaPatchTops` / `_liquidFlowTops` are filled by the code that lays those sheets;
  `_hlSkinTopY(x, y)` = the highest of them, the field wade sheet, and an open liquid tile's own surface. Everything that
  draws on a tile keeps `HL_SKIN_CLEAR` (0.6 px) above it: `_buildDrapeGeo` (move / attack / spell / AoE / action glow),
  `_buildCursorMesh` (hover + selected-tile brackets, which also get the field lift now), the underfoot ring, zone washes /
  danger cells / web overlays, and the unit's reticle + white tile (tile boards at build; fields in `_fieldRingsTick`).

## IMITATION REPORT FIXES (2026-10-08)
mondo's 5-match imitation run (248 decisions, 26% agreement) moved 14 weights; they are the shipped defaults now
(battle.js AI_WEIGHT_DEFAULTS + ai.js AI_TUNE mirrors, `prev` = gen-40). Analysis: project file
ai-training/AI_IMITATION_ANALYSIS_20261008.md. Code changes from the evidence:
- ai.js scoreTowerAttack: the flat "window" bonuses (enemies dead / respawning / tower_push / Cube clear) are scaled
  in the Arena by `_cubeWindowShare` (hits to wipe the standing enemies ÷ hits to drop the Cube, 0.25..1) and by the
  new trainable `cubeWindowBonus_v1`. The CPU wanted the Cube by up to 1,170 while the human finished the team and won.
- ai.js `_mpUnlockValue`: the Mana Potion's "casts it unlocks" value, now also credited per ally to manaRestoreAll
  (Free Energy). New trainable `potionValue_v1` × Healing/Mana Potion scores.
- Imitation scoring (ai.js aiScoreMargin): a human move off the CPU's list earns the CPU's intent value for its
  share of the CPU tile's progress (`_intentCreditAt`); human Cube hits match attack_tower; item use (battle.js
  doItem), Inspect (doInspect) and Channel (ui.js channelNexus) are observed; _candDesc names items and the Cube.
- Pulse Lattice's TOTAL DMG counter (top left, rolls like a slot machine): the self-cast hero shot (_playSelfCastHeroShot) wore
  the heavy chrome only for heals, and _actionCamTallyDamage only feeds a heavy shot. A self-cast that deals damage (the
  lattice, self-origin novae) now wears the heavy chrome, so its hits roll into the counter.

## VISION + BROKEN (2026-10-09, mondo: "implement a vision stat into the game, replacing awareness")
- **AWR is gone.** Every race has `vision` (tiles, 2-6, data.js RACE_BASE_STATS) and its own `crt` (crit percent).
  Conversion from the old AWR: vision = 6/5/4/3/2 at AWR ≥162/127/90/50/else (24-25 races per band); crt =
  round(8 + min(18, awr/7)), capped 30, so no crit odds moved. critChanceFromStats(crt) = crt/100.
  Gear/passive statBonus `awr` became `vision` (Binoculars +2 VISION +4 CRT, Telescope +2, the rest +1);
  sandstorm −5 vision, zodiac sky key `vision`, terrain preference +1 vision. Grade bands: vision 6/5/4/3, crt 24/20/16/12.
- **The rule (data.js VISION_RULES, editable in the Data Panel):** a unit sees a tile when it is within its vision
  (Manhattan) AND line of sight is clear (isVisionBlockedByTerrain). A team sees what any of its living units, wards,
  tower, flares or open-door twins see (map.js teamSeesTile). Attacks, spells, previews, highlights, the action menu,
  move+cast probes (TargetQuery relocates the unit, so sight is from the probe tile) and the CPU all gate on
  isInVision — fog of war ON or OFF, human or CPU (visionGatesTargeting). The caster's own LOS is still needed
  unless the spell is LOS-free (`ignoresLineOfSight`, delayed, teleports, sky grabs); LOS-free spells still need the
  TEAM to see the target (losFreeNeedVision). Heal/buff/self kinds (SPELL_KIND_META fogExempt) are exempt.
  `VISION_RULES.enabled = false` restores the old LOS-only, fog-gated rule.
- **Fog default:** state.fogOfWar stays ON (online enforces it); the fog GRID visual stays OFF. Fog now shows the
  range-limited sight. With fog off, enemies are drawn but only targetable when the team sees them.
- **Blind** = vision 1, half its basic attacks miss, no shared sight (`visionSet: 1, noSharedVision`). Range is
  untouched. **Jammed** = no shared sight (`noSharedVision`) + no Scanner/Scan Pulse.
- **The solo sight (2026-10-18, mondo: "if i am blind then i shouldnt have team vision ... i wouldnt have been able
  to click on that unit in the first place"):** map.js `fogSoloUnit(player)` = the team's acting unit (blitz active,
  else the selected one on its turn) when it is Blind / Jammed; computeVisibleTiles then returns ONLY that unit's own
  sight (plus the enemy-smoke cut), so the fog, the drawn enemies and the clickable tiles match isInVision.
  state.js computeVisibleTilesCached / computeFogDistancesCached keys carry the solo id.
  (PR #300 briefly let Blind keep team sight; mondo rejected that, reverted here.)
- **Move + Attack sight:** hud.js `_computeEnemyActions` → findMoveIntoRange(…, needSight) probes isInVision FROM
  the landing tile (unit relocated + restored), so the quick menu never offers a MOVE→ATK the swing then refuses.
  battle.js `outOfSightMessage`: a Blind / Jammed unit is told it is on its own eyes. Keen sense: vision ≥ 4 (keenSenseVision) senses cloaked/smoke-hidden enemies at 2 tiles.
- **Broken / Break** (STATUS_DEFS.broken, 💔 BRK): getUnitPassives answers [] and unitHasGear false while it lasts
  (every hook, immunity, aura off); canFly false unless Levitating (a status). battle.js breakUnitPassives strips the
  flat stats the passives folded in at build (`unit._passiveStatBonus` → `unit._brokenStrip`) and drops an airborne
  passive flyer with forceGroundUnit (forced fall damage); restoreUnitPassives hands them back on expiry, and the
  respawn wipes + _applyRoundStartPassives reconcile a strip whose status vanished without onRemove.
  On: Crash Loop (computerhacking), Needle Work (blackmagic), Sucker Punch (trickery), Demonic Claw
  (demonicabilities), Divine Smite (angelic), 1 round each.
- **AI:** isConcealed asks isInVision for the actor (team sight; Blind/Jammed = own eyes), buildVision's attack
  targets too; a per-team last-seen memory (ai.js `_aiLastSeen`, never on state) adds a `hunt_last_seen` goal when
  nothing is in sight. New trainable weights (no schema bump): lastSeenHunt_v1, breakValue_v1 (default 1).
- **Race editor:** VISION (clamped 2-6) and CRT (0-100) are editable stats (RACE_STAT_RANGE, clamped in
  EWRaceMods.setRace); both are flat across levels.

## THE RANGE FIT (2026-10-14, Move / Jump / spell-aim camera)
mondo: "the camera still zooms out to much when i select the move button. It doesnt need to zoom out to view the whole
damn map. Zooming out just enough to see the movement range or spell range of the character or spell is enough."
- Cause: `_tilePickFitZoom(reach + 1.5)` fitted a square of reach+1.5 tiles on the TIGHTEST screen axis round the unit.
  At the 45° board yaw a Manhattan range is a screen square only (reach+1)/√2 tall, and the screen is 16:9, so the frame
  held ~2-3× the range's area (a 12×12 arena whole for move 3+). It also kept any WIDER current view
  (`Math.min(camera.zoom, fit)`), so an overview stayed an overview.
- Now battle.js `_tilePickFrame(unit, tiles)` projects every lit tile's corners (`_tilePickTiles`: getMoveTiles /
  getJumpTiles / getSpellRangeTiles, a radius-2 diamond for Build) through the destination pose (TILE_PICK_TILT, target
  yaw, real FOV + aspect), centres the focal on the set, and solves the eye distance exactly. Margins
  TILE_PICK_MARGIN_H 0.80 / _V 0.86, floor ±TILE_PICK_MIN_HALF (3) tiles. It zooms in OR out to that fit. No 3D lens →
  the old square fit. Viewer-local camera, nothing relayed.
- Same 12×12 / 1080p maths: move 3 at the centre 11.7 → 8.4 tiles of eye distance (about half the area); a corner unit
  frames its clipped range, not the void past the edge.

## THE MENU CAMERA (2026-10-14, between-action target framing)
mondo: on his turn, clicking an enemy must frame his unit and that enemy with cinematic framing; in a target list, each
row the cursor lands on reframes the caster + that target, one continuous camera move (Persona 5's menu + camera).
- battle.js `_menuTargetShot` (called from `_tpsTargetShot`, which every between-action pick already used: board click
  on a unit, quick menu open, attack/spell/item target lists, Tab cycling, row confirm). 3D only; 2D keeps the old
  midpoint pan.
- Pose (`_menuShotPose` / `_menuCamSolve`): board rig (no TPS pivot), camera behind the caster swung 36° off the
  caster→target line (56° when adjacent), pitch 66 at melee down to 50 far. Both real bodies (feet to HP bar, flight
  height included) fitted on the true perspective lens, centred right of / above screen centre (menu is bottom-left).
  Two sides × three pitches are tried; terrain-blocked lines of sight lose, then the nearest yaw / same side as the
  last target wins. Tunables: the MENU_CAM_* consts.
- `camera._menuShot = { home, key, side }`: home = resting tilt/yaw + the zoom it left. camera.moveTo without
  `_menuShot` leaves the shot and fills unnamed tilt/yaw/zoom from home (cancel, basic attack pan, next turn, Move's
  range fit — `_tilePickFrame` solves for the home yaw). `_captureCineReturnView` and `camera.save()` take home, so a
  spell's return lands on the tactical view. A hand orbit (snap with tilt/yaw) drops it.
- hud.js: target blades carry `camTarget`; HorologeMenu frames the cursor row (90 ms debounce) only once the PLAYER
  moved the cursor (the engine already framed the default row; aim lists keep the range fit until a row is hovered),
  and calls `_ewMenuCamHome` when the menu leaves every target view with no camera move of its own.
- WHEN it moves, per input (mondo 2026-10-14: mouse+keyboard, controller and touch; some rows need a confirm, some act
  at once): ↑/↓, wheel and D-pad cursor steps frame at once; a MOUSE frames only a row it rests on (MENU_CAM_HOVER_MS
  320, hud.js) so sweeping to CONFIRM never swings it; touch's emulated hover is ignored (window._ewLastPointer); the
  pick (click/tap/ENTER/A = the ✓ step before confirm, or a board click on a unit) frames at once in the engine.
  Immediate rows (finisher) frame on the cursor before the click. Board hover never moves the camera.
- Toggle: Settings → Controls → Camera "Target Camera: ON/OFF" (localStorage ew_menu_cam = 'off'); off = the old
  midpoint pan; switching it off mid-shot returns home (_ewMenuCamHome(true)).
- Local only (menu browsing is never relayed). Only syntax-checked plus a node check of the fit maths.

## THE CLEAR FRAME (2026-10-20, the camera frames beside the menus)
mondo: "a lot of times the action menu is open with another sub menu, which takes up like 1 third of the left side of
the screen. so how the camera moves with the menu, make sure it is framed to include what is meant to be seen in the
right half to two thirds of the screen".
- battle.js `_menuFreeArea()` measures what the command menus cover RIGHT NOW (`.hrlg-rig` side card, every
  `.hrlg-panel` of the cascade and its children/rows, the turn-icon peek; whichever side the UI Maker puts them on; a
  panel wider than 60% of the screen counts as a top/bottom band) plus the HUD strips (scoreboard/match line on top,
  the prompt bar + description bar below) → `{ cx, cy, hw, hh, menu }` in NDC (cached 120 ms). Never narrower than
  42% of the screen (CLEAR_FRAME_MIN_HW).
- `window._ewMenuSlide()` (read by ThreeCamera.sync every frame) = that frame while a menu is up; held through an action
  a pick started while the board rig keeps the camera (and for 450 ms of menu hand-over), else 0. three-camera.js
  sync eases it (MENU_SLIDE_EASE 0.16 s) and TRANSLATES the board rig's eye + aim sideways/up by cx·D·tanH, cy·D·tanV
  (D = eye→aim distance): the view direction never changes, the focal lands in the middle of the free part. Board rig
  only (TPS/cine rigs untouched). So every move that centres something with a menu up (turn start, cancel, Move/spell
  range fit, two-shot) lands it beside the menu; orbit still turns round it; picking uses the real camera, unchanged.
- Fits solve for it: `_menuCamSolve(…, fa)` projects with the slide (+ fa.cx·dist/depth) and centres the pair on
  (fa.cx, fa.cy) with margins MENU_CAM_MARGIN_H 0.74 × hw / _V 0.70 × hh (old SHIFT_H/SHIFT_V consts gone);
  `_tilePickFrame(unit, tiles, fa)` uses the exact |r·right − cx·along·tanH| ≤ mH·hw·depth·tanH bound (margins 0.86 /
  0.90 of the free frame).
- `camera._clearFit = { area, fit() }`: set after the two-shot / range fit moves; any other moveTo or snap drops it.
  When the cover under it changes (the quick list / armed-spell panel renders AFTER the click that framed it) and holds
  140 ms, `_clearFrameRefit` solves the same frame again (`_menuTargetShot(u, t, true)` / `_tilePickArmRefit`).
- THE BODY FOOTPRINT: three-renderer.js `getUnitFootprint(uid, out)` = the drawn model box's 4 corners (fit scale, facing)
  as world offsets from the feet (`inner._ew_fitHalf`, set at model attach, rides the cached rig). `_menuCamBody` adds
  them (`fp`) so a long body (the Sedan) is fitted whole instead of a ±0.38-tile column.
- Checked on screen (1440×900, Football Stadium, Sedan vs CPU): menu alone, Abilities open, Attack target list, a far
  target with Abilities open, Move range, enemy quick menu with its info card. The sandbox renders ~1 fps: let the
  camera settle ~30 s before reading a frame.
- THE SUB MENU RULE (2026-10-21, mondo: "i asked you to frame the camera a little more to the right, but i think you
  overdid it too much. Please fix. And remember it only needs this different framing if a sub menu is open from the
  action menu"). `_menuFreeArea` returns the shifted frame only while a panel past the root is up in the real rig
  (`.hrlg-rig:not(.hrlg-peek) .hrlg-panels > .hrlg-panel:not(.root)`: Abilities, Attack's target list, a board click's
  quick list, ...). The action menu alone returns `_CLEAR_ROOT` (cx 0, hw 1, menu false, cmd true): no slide, and the fits
  use the plain pre-CLEAR-FRAME numbers again (two-shot MENU_CAM_SHIFT_H/V 0.14/0.08 + MENU_CAM_PLAIN_H/V 0.58/0.56; range
  fit TILE_PICK_PLAIN_H/V 0.80/0.86). `_ewMenuSlide` drops the slide at once when a sub menu closes back to the action
  menu (not mid-action) and refits a fitted frame for it. With a sub menu up the frame slides only CLEAR_FRAME_SHIFT
  (0.55) of the way to the free part's middle, keeping its size (Football Stadium 1440x900, Abilities open: cx 0.42 →
  0.23 NDC, the unit ~62% across instead of ~71%). Too far / not far enough: tune CLEAR_FRAME_SHIFT.

## THE CLICK FACE + THE ATTACK HOLD (2026-10-18)
mondo: "whenever i click on an enemy or a unit, my unit should turn to face them. if all i do is basic attack them ...
the camera should sort of stay the way it already is ... and just show that view of the unit attacking the target,
maybe tracking their movement if they have to jump forward to attack them."
- THE CLICK FACE: battle.js `_faceTargetPick` (top of `_tpsTargetShot`, so every between-action UNIT pick: board click,
  quick menu open, attack/spell/item lists, Tab cycling, the list cursor) → `doFaceUnit(unit, targetId)`, which sets the
  REAL `unit.facing` (arc math reads it; the renderer turns the body at UNIT_TURN_RATE). Local hand-played unit only,
  its own turn, not mid-action; a hidden/fogged enemy is never faced; tile and self picks turn nobody. Side effect by
  design: clicking a unit is now a free way to choose facing before ending the turn.
  Online: online.js wraps `doFaceUnit` (engine action 'doFaceUnit' + targetId); the guest turns its copy at once and
  emits only when the facing changed, the host applies + syncs.
- THE ATTACK HOLD: doAttack passes `menuHold: true`; playOffensiveActionCamera's tactical branch calls
  `_menuAttackHold` first: the viewer's own non-auto attacker keeps (same pair = no move) or gets the menu two-shot
  instead of the midpoint pan (which used to drop the shot back to the tactical view). online.js relays `menuHold`;
  each side decides for its own viewer, so each player gets it for their own swings. `camera._menuShot.pose` +
  `camera._menuAtk {unitId, targetId, until}`.
- The leap: `animateStrikeLeap` (host + guest replay) → `_menuAttackTrackLeap`: for a leap of 2+ tiles the shot keeps
  its yaw/tilt and re-fits the frame with the attacker at its landing spot over leapMs, back to the pose over returnMs
  (moves shield boardCameraResetTimer). The post-action `_softResetCameraToUnit` (PR #278 timing untouched) returned
  the tactical view until THE PUSH-IN below.
- THE PUSH-IN (same day, mondo: "basic attack camera still spins around from the view that shows when i have a target
  selected. i specificaly said its supposed to stay the same, just with a slight zoom in or push in as my unit
  attacks"). Browser repro: the two-shot held through the swing, then the soft reset's moveTo (no `_menuShot`) restored
  the menu home = tilt 65→40, yaw 349→45, the spin. Now `_menuAttackPush` creeps the held pose in ×MENU_ATK_PUSH (1.12)
  over the wind-up to the hit (same angle), and softResetToUnit → `_menuAttackSettle` eases back to the pose and KEEPS
  the two-shot while the pair stands (attacker on the solved tile, target alive and unmoved; a kill / displacement /
  new turn falls through to the normal return). The view goes tactical when the menu leaves its target views
  (`_ewMenuCamHome`), a Move pans, or the next turn's activation pan. Guest: the push's own timer eases it back out
  (no soft reset there). The Cube swing uses the same push + settle.

## THE CUBE CAMERA + THE REST ZOOM (2026-10-18)
mondo: "the camera zooms out really unecessarily far after i attack the cube, please fix. if anything else makes the
camera zoom out that far or anywhere close, please fix that too".
- Cause (not PR #287): doAttack's Cube branch moved/snapped with `zoom: getCloseZoom()`, and getCloseZoom = the
  whole-board overview (`_getBattleZoom`); `snap()` applies zoom directly, so every Cube hit pulled all the way out.
- THE CUBE CAMERA: the branch names no zoom now. Your own LOCAL swing → `_menuAttackHoldTile` keeps the Target Camera
  two-shot of unit + Cube (`_menuCamBody` gives a tower tile 1.6 tiles of height), pushes in and stays on the pair
  after the settle (THE PUSH-IN); the CPU's / menu-camera-off swings pan attacker → Cube at the zoom on screen. Guest:
  `_ewMenuAtkPending` also holds for a Cube tile.
- THE REST ZOOM `getRestZoom()` = engaged hand zoom, else the follow-cam zoom / getTurnFramingZoom (the medium framing
  your turn opens on). It replaces the getDefaultZoom (overview) fallback in camera.reset(), the soft-reset no-saved
  branch, the Target Camera home, the three spell-shot → next-turn returns (sim / CPU / remote, `_applyZoom`) and the
  CPU / remote activation zoom. The end-of-round board read (`eorFocusCamera` overview) zooms to getEorFocusZoom, not
  getFullMapZoom×0.92 / the 20-row floor. getDefaultZoom stays the yardstick for the engaged test and multipliers;
  the match-start reveal and hand zoom-out are untouched.

## THE JUMP FOLLOW (2026-10-14, camera rides your own jumps)
mondo: "bug where the camera doesnt follow my unit when i jump to a tile".
- Cause: battle.js `doJump` skipped the follow pan for the LOCAL player's jumps on purpose ("parity with walking": the
  old 400 ms pan on teal Move-overlay tiles read as a lurch). Only AI / replayed remote jumps panned, so your own jump
  left the camera parked on the takeoff tile while the unit leapt to the edge of the frame or out of it.
- Now every jump pans (`animateBoardCameraPath`) from takeoff to landing over the arc's own 480 ms, ease in/out, so the
  camera travels with the body. Pan only: zoom/tilt/yaw stay (no `_allowZoomChange`), so the Jump range fit, the
  player's zoom and the Target Camera's home view (moveTo restores it) are kept. AI + remote jumps keep the fog gate
  (`_shouldCameraFollowUnit` + `_isTileVisibleToViewer`). Online guests already follow via the `jump-anim` relay
  (online.js `focusBoardCameraOnTiles`). Walking is unchanged (still no pan for your own walk).

### THE CUBE SWING (2026-10-14, mondo)
- mondo: attack-heavy units had the edge on the Cube since only basic attacks hurt it. A Cube strike now rolls off the
  HIGHER of ATK and M.ATK (battle.js `getCubeAttackDamage`, which feeds doAttack, the forecast, the HUD and the AI read).
  Spells still can't touch the Cube; no heals, no statuses (no PvE). At L100: avg hit 121 → 177; casters went 38 → ~230.
- Paired with Cube HP 2400 → 3600 (map.js `TOWER_MAX_HP`) so time-to-kill stays ~20 average hits; bruisers 10 → ~15.
- Same day, THE CUBE ARMOUR (mondo: "it's still really easy to have some buffs or passives that raise your attack
  stat"): Cube DEF 15 → 100 and new M.DEF 100 (map.js TOWER_DEF / TOWER_MDEF, `mdef` on every tower object). An ATK
  swing loses DEF, an M.ATK swing loses M.DEF. The basic-attack floor applies (35% of the swing, min BASIC_FLOOR_MIN)
  so weak hitters chip 25 instead of 1. At L100: avg hit 177 → ~96, ~38 average hits to kill 3600 HP.

## MAP-WIDE WEATHER (2026-10-15, mondo: "fractal rain and blood rain and drought and maybe even thunderstorm should be over the whole map")
- WEATHER_REGISTRY rows with `global: true`: bloodRain, drought, tesseractStorm (the "fractal rain"), thunderstorm. A
  weather object made from one also carries `global: true` (spawnWeather, summonWeather cast, MD floor roll).
- Plain global weather: `w.tiles` = every board tile (state.js `allWeatherBoardTiles`), never drifts, no direction.
  Tile checks go through state.js `weatherOnTile(w,x,y)` (fast path, no tile walk); `weatherRainsOnTile` = where the
  rain falls (whole board for any global). Both on window for battle.js / renderer.
- Thunderstorm stays a homing storm: `w.tiles` is still its single hunting eye (lightning + -5 DEF there), but its
  rain soaks every grounded unit each turn (applyWeatherTurnEffects homing branch) and counts as rain for
  `_unitInRain` / seeds everywhere.
- Visuals: no board-sized tile tint for a global footprint (one mesh per tile; skipped in three-renderer
  _syncWeatherOverlays + ui.js outlines). Rain zones flagged `global` rain over the whole board with a 90-drop budget
  (50 on EW_PERF_LOW; three-vfx `_rainDropCap`). Global thunderstorm idle bolts land anywhere on the board. Drought
  turns the existing ambient dust motes amber and thick (three-vfx `_ambDrought`). Sky grade already map-wide.
- Summon targeting preview for a global weather is just the picked tile (ui.js summonWeather area).

## BLOOD RAIN IS RED (2026-10-21, mondo: "can we make blood rain red")
- The drops were 1.2 units wide (under a pixel at the battle zoom) in a dark 200,40,50 at 0.45-0.9 alpha, so the rain read
  as no colour. three-vfx.js `_RAIN_CFG.bloodRain` now 4.5 wide x 40-70 tall, `dropOpacity: 0.95` (new per-config key,
  default 0.7 for the other rains), splash chance 0.7 and 6-30 size; `rain-drop-blood` / `rain-splash-blood` gradients are
  full-strength red. Drop budget unchanged (90 map-wide, 50 on EW_PERF_LOW). Rain is renderer-local: the guest builds it
  from the synced `state.activeWeather`, nothing to relay.

## THE ELEMENT TERRAINS + THE BLOOD POOL + 3-ROUND TERRAIN (2026-10-21, mondo: Divinity OS2-style "correlate at least one terrain to each element ... casting the spell on to a tile that has the terrain should do bonus damage" + "make all terrain changes last 3 rounds, similar to status effects" + "Tornado leaving grass tiles doesnt sound right")
- Proposal doc https://claude.ai/artifact/1d1VuhoZ1wWNgtqc7brW1x; mondo said "go" on the recommended options.
- THE BONUS: data.js `ELEMENT_TERRAINS` (element → terrains, + `flow` liquid family, fire `burning`, wind `air`) and
  `ELEMENT_TERRAIN_MULT` 1.25. battle.js `elementTerrainBonus(el, caster, target, o)` → {mult, who, label}: caster's tile
  first, else the hit tile (opts.struckAt). One bonus even when both stand on it. Applied in `_hitDamageMath` right after
  the ZODIAC SURGE (so it rides `_offMult` under the ×3 cap; live hit + every forecast share it). Spells only:
  `opts.spellElement` set, not `basicAttack`, not `dot`, not `noTerrainBonus` (the terrain reactions' follow-up hits pass
  it). Airborne units are off the ground; wind counts them as on its terrain ('Air'). Live pop "🜃 ON <LABEL> ×1.25"
  + one log line per cast (keyed by `_protectActionSeq`). ai.js estDamage mirrors it from `opts.fromX/fromY`.
- NO SELF-COMBO: doSpell opens map.js `beginCastTerrainWatch()` (after canUnitAct) and finishAction closes it; state.js
  `_detonateDelayedSpell` wraps each detonation. While open, `_noteTerrainChange` records each cell's pre-cast terrain
  (`castPreTerrainAt`) and igniteTile records whether it burned before (`castPreBurningAt`); a LIVE hit reads those, so
  terrain/fire the resolving cast made never counts. Forecasts read the current board.
- THE BLOOD POOL: TERRAIN_RULES.blood (move 1, no other effect), its own liquid family in map.js `liquidFamilyOf` /
  `_LIQUID_SPREADS` (flows like water), three-renderer `_LIQUID_STYLES.blood` (water textures tinted 0x8a0c14) + the flow
  / runoff / drift / entropy-palette tables, sprites.js uses water.png. Blood Rain's `seedTerrain` is 'blood'. Only source.
- THE TIMERS: map.js `state.terrainTimers[k] = {n, t, z, o, oz, p, d, m}` written by `_noteTerrainChange` from
  setTerrainAt (the one paint path) once battle.js startMatch sets `state._terrainClock` (and resets `paintedFrom`, so the
  board as the fight starts = the map's own ground, permanent). n = TERRAIN_CHANGE_ROUNDS (3). battle.js
  `tickTerrainTimers()` runs in processEndOfRoundZonesAndSeeds after `_tickTimedTerrain`: n-1 per round end, at 0
  `revertTerrainTimer` puts back `o` (the map's own terrain; lifts stacked liquid, drops the spring, undoes a terrainCreate
  deform `d`, a Snow Fort's `m` melts into its puddle which then gets its own 3). Same terrain painted again on a clocked
  cell → `refreshTerrainTimer` (n back to 3): terrainCreate `_paintTile`, `_paintTimedTerrain`, every leaveTerrain site,
  the dash trail, weather seeding. A change of a clocked cell into something else (lava+water=stone) restarts the 3 with
  the new terrain, and the end still goes to the map's own ground. Craters (aoe deforms) stay. Burning keeps its own fire
  countdown; the scorched ground it leaves then gets 3. hud.js tile menu shows "⏳n". Plain state: syncs to the guest.
- THE WEATHER RULES (state.js, calls flagged to mondo): Tornado leaves nothing; Earthquake rocky ground (rocks_1, was
  mountain; quarter-board cap kept); Solar Flare scorched (was desert); Sandstorm desert (new); Blood Rain blood (never on
  water); the rain storms' water washes a blood pool away; Drought dries the fight's water, blood AND ice
  (`_evaporateTile`); Thunderstorm/Hurricane water, Blizzard ice, Drought desert unchanged. All of it on the 3-round clock.
- Probe: VS CPU Mount Shasta, painted 15 blood tiles round a unit → red pools, bonus 1.25 (caster), 3 ticks → grass_2.
  Screens /mnt/project-files/element-terrain/.

## THE RUNOFF IS THE GROUND (2026-10-27, mondo: "crystal guardian used a spell on me and it had the on dirt bonus but we were both definitely on water. the original terrain of the map in that spot was dirt though, so just make sure the on terrain bonuses are properly reading the current state of the map")
- Cause: a painted liquid is a spring; its overflow (map.js getLiquidFlowAt, 1 tile onto level ground, further downhill) is
  drawn as water but leaves the tile's terrain as the map's dirt / grass. battle.js `_elemTerrainLabelOf` checked the
  ground list first, so a unit in the runoff got earth's "ON DIRT PATH ×1.25" (and water's bonus too). Reproduced on the
  old build (VS CPU Mount Shasta, Crystal Guardian in a spring's runoff over dirt, Shardstorm: "draws on the dirt path
  underfoot"). Painted tiles themselves (setTerrainAt) already read their new terrain; the 3-round timers revert the real
  terrain, so they were never the cause.
- Fix: map.js `getSurfaceTerrainAt(x, y)` = the runoff's liquid on a dry tile it covers, else getTerrainAt. The element
  bonus reads it (only the liquid's element counts on runoff; a live hit still reads the runoff as it stood before the
  cast, castPreFlowAt), so the forecast, the live pop/log line and ai.js estDamage agree. Same read for the race passive
  rows terrainBonus / terrainRegen / terrainHitStatus, getTerrainPreferenceModifier (+ its HUD chip), and the CPU hazard
  penalty treats lava runoff as lava (the engine already burns it). Movement cost and the mild water/poison/oil runoff
  end-turn rules are unchanged.
- online.js: `terrainTimers` joined _REPLACE_WHOLESALE (a timer deleted host-side stayed on the guest, ⏳ forever).
- Proof (two-seat friendly, Mount Shasta TDM): guest Crystal Guardian on dirt R7 forecast 275 (dirt bonus); R8 in Blood
  Rain runoff over the same dirt forecast 201 = hit 201, no terrain line on host or guest. Screens
  /mnt/project-files/terrain-surface/.

## THE WEATHER'S TERRAIN (2026-10-15, mondo: "let's make the weather affect the terrain. I think it used to but then it was removed ... there was a lot of water on the map and then there was a drought. That drought should evaporate all that water")
- History: the old build (index.html era) had `seedTerrain` on WEATHER_REGISTRY rows + `seedTerrainAt` / `seedWeatherTerrain`;
  cut 2026-04-01 (commit ce37c0a vs 78b5c97). Restored in state.js: tornado grass, earthquake mountain, hurricane / blood
  rain / thunderstorm water, drought / solar flare desert (blizzard's `convertTerrain: 'ice'` was never cut). Old moments
  kept: static weather on forming ~30% of its tiles, a moving one on the tiles it leaves ~60% (drifting patch in
  driftWeather, a homing eye's swept tiles in processHomingWeather), every one on dissipating ~75% (tickWeather).
- Map-wide weathers have no tiles to leave: each round they seed `round(patch × 0.25)` random tiles and `round(patch × 0.5)`
  on dissipating (`weather.patch` = the rolled def.tiles count; summonWeather uses its rolled tiles).
- Liquid adaptation: weather water is a spring (`setTerrainSpringAt`), so it spreads like a spell's. Old priority kept
  (grass 0 < desert 1 < water 2 < deep 3 < mountain 4, only paints its own rank or lower), mountain cap 25% of the board.
  Never paints: lava/bogs/oil, chasm, void, ice, walls, bridges, nexus/home/tower bases, roofed cells, objects, monuments,
  field rock + fixed cells (`_weatherSeedOk`).
- NEW Drought `evaporates: true` (state.js `evaporateBattleWater`): on forming (`weatherTerrainOnForm`, also summonWeather
  + the MD floor roll) and every round it lasts, every water tile the FIGHT put down goes back to what it was. map.js
  `notePaintOrigin` records each cell's top block {t, z} the first time setTerrainAt / setBlockAt / removeBlockAt touches it
  (`state.paintedFrom`, cleared in initMap). Water whose origin was water (the map's own lakes and rivers, a melted natural
  pool) stays. Great Flood's stacked blocks above the origin level come off and grounded units on them settle (u.z).

## THE BLINK LANDING (2026-10-16, mondo: "im trying to use mirror blink and when i click on the tile i want to go to it tells me the target is no longer in my line of sight")
- Cause: the board lights a teleport's landing tiles on the flat Manhattan disc (ui.js `spell.kind === 'teleport'` highlight,
  doSpell's landing branch, the forecast), but the click gate (battle.js getSpellRangeTiles) and doSpell's generic cast gates
  measured a self blink's one click with 3D combatReach + the team-vision gate, so a lit tile up a slope (height gap > range)
  or one no teammate could see answered "Target is no longer in range or line of sight."
- Fix: battle.js `_teleportLandingPhase(spell)` (a self blink, or a pick-a-unit teleport once its unit is picked) and
  `getTeleportLandingReach(unit, spell)` (Manhattan ≤ effective range from the caster, LOS only for `needsLoS` rows such as
  Web Swing). getSpellRangeTiles returns that reach for the landing phase, and doSpell's `isTeleportPhase2` uses the same
  test, so the teleport branch alone judges the landing (range, needsLoS, free passable tile, onlyTerrain).

## THE ONE AIM RULE (2026-10-16, mondo: Dragon Slash greyed under Abilities as "No target", offered on the enemy's quick menu, then "Spell target is out of range" — "so is it out of range or not??")
- Cause: four copies of "can this spell reach that body". doSpell (3D combatReach to the click's body after the shared-column
  resolve, sight line, team vision), hasSpellTargetInRange / hasReachableTarget (the Abilities button: its own reach per kind,
  flat Manhattan for heals/buffs/revive), _getSpellValidTargets (the drum: its own corners + LOS + fog), and hud.js
  _computeEnemyActions (the enemy quick menu: measured the clicked body, then FELL BACK to getSpellRangeTiles, whose height for
  a tile is unitAt(x, y) = the column's ground body, so a flyer over a reachable body read "in range"). findSpellApproachTile
  probed with the lit tiles too. They disagreed on heights, shared columns, 2×2 bosses, sight lines and fog.
- Fix: battle.js `_spellAimTarget` (who in the column the click is for) + `_spellAimReach` (d, range verdict, sky grabs flat,
  `losBlocked()`, `directForDoors()`) are doSpell's own aim numbers now, and `spellAimProblem(unit, spell, x, y, z)` returns
  null or 'range' | 'los' | 'sight' | 'hidden' | 'above' with exactly doSpell's aim gates (self-cast → null, beams → the heading,
  blink landing → getTeleportLandingReach, doors / castFromDoors, telescope, Cryptid / Shadow Realm, the leap's flat range and
  above rule, Purify's flat range). `spellCastableOnUnit` = no aim problem + not cloaked + spellTargetUsableOn.
- Every menu asks it: hasSpellTargetInRange (enemy kinds, leap, heal/cleanse, buff/shield/transfer, revive, corpses), the drum,
  findSpellApproachTile (aimed at a body), the Simul plan check, hud.js enemy quick menu (generic, leap and dash rows; the
  greyed reason reads `spellAimProblemLabel`) and the tile quick menu. getSpellRangeTiles (the lit tiles) is unchanged.

## THE TURRET SIGHT LINE (2026-10-16)
mondo: "i raised a wall with rampart, and there was a turret on the other side, but it was still able to shoot me."
Cause: processTurretVolleys picked its target by flat steps only, never asking line of sight (nor did the renderer's
targeting laser or the real-time turret clock). Fix: battle.js `turretHasShotAt(turret, u)` (window too) = the spells'
terrain sight line, `isRangeBlockedByTerrain(turret → unit, target z)`. Asked by the end-of-round volley (turrets and
ranged summons), the real-time turret scan, and three-renderer.js `_updateTurretAim`, so the laser only paints a unit
the gun can actually hit; a walled-off unit is skipped and the turret takes the next one in range it can see.
- Fog click (2026-10-16, mondo: "im clicking on a tile it tells me i can teleport to but its not letting me move there ...
  its not even telling me an error"): clickTile's fog gate returned SILENTLY on any tile the team can't see unless a
  pick-a-unit teleport was mid-landing, and it looked the armed spell up in `spells` only (Mirror Blink is a race
  ability). Now it finds the spell in `_raceAbilities` too, lets every `_teleportLandingPhase` click through to doSpell,
  and an attack / spell / item click on a fogged tile logs "Out of sight — no one on your team can see that tile."
  Checked in a headless browser: P1 blinked onto a fogged lit tile and onto a seen one.

## FACTIONS REMOVED + CELESTIAL EVENTS BUFF THE MIDDLE NEXUS HOLDER (2026-10-17, mondo)
mondo: "get rid of factions ... celestial events ... should give a buff to whoever controls the middle nexus ...
It should reset control of the nexus whenever a new celestial event happens."
- Factions are gone everywhere: RACE_PROFILES/DEFAULT_IDENTITY `faction`, FACTION_BONUSES, the faction synergy
  (state.js Bulwark/Restoration/Fury: 2+ same-faction allies), unit.faction, codex/shop/party-builder filters and
  stamps, the cinematic label, the race editor FACTION field + filter + export key, the HQ pause chip. Faction
  accent colours became one accent (hud.js getUnitAccentColor = EW.space, party-builder PB_ACCENT = EW.time,
  codex _CODEX_ACCENT); the horologe second hand is always the quartz tick. The Spell Library column that was
  labelled FACTION was the spell TYPE all along (now TYPE).
- Celestial events (data.js SKY_EVENTS, frequency unchanged: from round 6, 15% per round end while none is up,
  2 rounds each): state.js getCelestialNexusKey (`earth`, or the non-spawn zone nearest the centre) +
  getSkyEventHolder; getSkyEventBonus is active for every unit of that zone's owner. checkNewSkyEvent resets the
  zone to nobody (ui.js resetCelestialNexus, nexus-fx kind `reset`, lockout check); a capture under an event adds
  the buff to the banner. Modes without a middle nexus (everything but Arena) get no buff.
- The buffs now do what they say (they used to multiply only the small flat bonus): Blood Moon adds 10% of ATK on
  physical hits (getEffectiveAttackBonus), Lunar Eclipse ×1.10 the whole physical soak (getEffectiveArmor),
  Black Sun +15% of every heal (getEffectiveHealBonus) and revive %.
- AI (ai.js): `arena_nexus_celestial` move goal (230) while an event is up and the middle isn't ours; channel
  score +90 there, never halved by the tower push. Nameplate event badge re-keys on the holder.
- Rev 2 (2026-10-17, mondo: "make the events last every 3 rounds ... +atk and m atk, +def and m def, and healing and
  health and mana regen ... the buff should last until you die or the next buff is claimed"): SKY_EVENT_DURATION 3.
  The buff is PER UNIT now: capturing the middle while an event is up = a claim (ui.js `claimCelestialBuff`): every
  unit's `skyBuff` is cleared, then each living unit of the claiming team gets `skyBuff = <event key>`. It stays
  after the event ends; cleared on death (map.js death timeout) and on respawn/revive (`resetUnitPowerState`).
  getSkyEventBonus reads unit.skyBuff only. Blood Moon +10% ATK and +10% M ATK (magic axis adds 10% of INT),
  Lunar Eclipse ×1.10 physical AND magic soak, Black Sun +15% healing plus `regenPct` 0.05 extra max HP and MP at
  each round end (processEndOfRoundRegen). Status bar shows the carrying team (`🌑 P1`); plate badges key per unit.
- Rev 3 (2026-10-17, mondo: "i played a whole game and didnt see a celestial event or have the nexus reset"): the
  15% roll from round 6 often gave no event in a whole match (0.85^n: ~32% none by round 12). Now a fixed timer:
  data.js SKY_EVENT_FIRST_ROUND 4, SKY_EVENT_EVERY 5, so events run rounds 4-6, 9-11, 14-16, 19-20; the event type is
  random but never the previous one (`state._lastSkyEventType`).

### Opportunity attacks follow height (2026-10-17, mondo: "opportunity attacks need to take height into account")
- battle.js `checkOpportunityAttack(unit, fromX, fromY, fromZ, fromStandH)`: an adjacent enemy only swings when its
  BASIC ATTACK could hit the mover on the tile it left: `combatDist` (height gap is its own axis) within
  `getEffectiveRange(enemy)`, and `isRangeBlockedByTerrain` clear (edge walls, a deck/roof slab between the two).
  So a melee unit (reach 2) still strikes across a 1-2 level step, but not from/to a 3+ level ledge, and a unit on a
  bridge deck can't hit one walking underneath beside it.
- The hit's high ground bonus / height soak / range falloff are judged at the tile it left
  (`applyDamageToUnit` opt `struckAt: {x, y, standH}`), not at the arrival tile. finishMoveAt reads the standing
  height before the move.
- Browser-checked on Pyramids of Giza: flat and 2-up both strike (2-up hit harder, high ground); 3-up, 4-up and
  deck-over-ground do not.

## THE TYPE BADGE RULE + THE PLANTED STING (2026-10-17)
mondo: "get rid of type badges on spells that dont require one ... the type only matters for damage and the type
matchup right?" Checked: a spell's `spellType` only reaches applyDamageToUnit (matchup ×1.30 / ×0.75, STAB, the press
refund, the WEAK/RESIST callouts); everywhere else it is a VFX tint (projectile / ring / beam / tether colour).
- data.js `spellTypeMatters(row)`: spellHasDamage, the always-rolling kinds (barrage / skyDrop / skyThrow / skySlam
  unless noDamage), seeds, turretDmg / blastDmg / door damage fields / healAdjacentDamage / dotDamage, summonDef.dmg,
  pullThroughHazards, Grapple. The TYPE chip shows only where it is true (hud.js `spellTypeShown`, party-builder.js
  `pbTypeShown`, map.js `_hqTypeShown`); the rows keep their spellType (VFX still reads it). 231 of 621 typed rows lose it.
- Typed now (they used the caster's own types, so the badge meant nothing): turret shots + summon bites (turret
  `spellType`, grid + realtime), placeTrap hits (trap `spellType`), deployObject blasts (`obj.spellType`, was hard 'tech').
- THE PLANTED STING: Poison / Leech Seed planted ON an enemy hits typed like the contact bomb (seedDamageOpts:
  source = planter, noAtkBonus, preScaled so the % of max HP is not level-rescaled, the row's type + element). Ticks and
  walk-on procs stay untyped. Forecast: `_forecastSpellInto` seed branch (only when an enemy stands on the tile).
- Browser-checked: Poison Seed 86 → 112 vs a weak type, 81 resisted with STAB; Leech 72 → 94; forecast = dealt.
  Place Bomb contact was already typed (276 super effective, forecast 276).

## THE PRESS FOR EVERY DAMAGING CAST (2026-10-17)
mondo: "i used infernal conscription on an enemy, it said it was super effective, but i didnt get my 2 ap refund."
Cause: doSpell armed the press collector only for the kinds in `_PRESS_SPELL_KINDS` (damage, multiHit, ricochet,
lifeDrain, tackle, line, linePush, splitBeam, aoe, barrage, cross, aoePull) plus damaging terrainCreate. Every damaging
kind added later (pull, dash, displacement, teleport, skyDrop, skyThrow, skySlam, leapStrike, steal, utility,
doorBreach, possess, pulseLattice, placeTrap on contact, damaging debuff rows) showed "It's super effective!" from
applyDamageToUnit but never refunded. Fix: the arm check also takes any `spellDealsDamage(spell)` row except
`delayed` (lands at round end). `_PRESS_SPELL_KINDS` itself is unchanged (it also decides which kinds end the turn).
The CPU's press value (ai.js PRESS_KINDS) was left as is.
- Slams don't judge the press (2026-10-17, mondo: "whenever a spell is super effective but its a displacement spell and
  the target is immovable it doesnt award the ap refund"): a body that can't travel slams into the wall / edge / a pin
  (resolveForcedSlide `_slideSlamDamage` and the bowling-pin crash). Those hits carry no spell type, so
  `_collectPressHit` judged them by the CASTER's own types; a target resisting those types (or a Protected pin) recorded
  a RESIST / MISS that vetoed the spell's own super effective press and drained an AP. They now pass `noPress: true`
  and the collector (and its three MISS pushes) skip them. A colossal target that never slides (dist 0) already
  refunded (browser-checked, Body Check on a colossal unit: +2 AP).

## DEF / M DEF DEBUFFS BITE (2026-10-17)
mondo: "every unit has def and m def stats. thats what the buffs affect ... huge bug". state.js getEffectiveArmor clamped the
extra pool (gear/passive armour + day/night + terrain + weather + DEF/MDEF stages + 5G) at 0 BEFORE folding the DEF / M DEF stat in,
so on nearly every unit a DEF / M DEF debuff stage, a 5G tower or a bad weather/terrain mod did nothing. Now the pool is signed and
only the final soak is clamped at 0 (a -1 DEF stage = -20 soak, mirroring a +1 ATK stage's +20 damage). The zodiac blessing's
DEF / M DEF share now scales the whole physical / magic soak (it scaled only that pool, 0 on most units). getEffectiveArmor(u,
'none') returns the signed pool so the stat cards show DEF + it (a debuff lowers the number); 'dot' and other types keep the old
clamp.

## THE JUMP STAT IN THE RACE EDITOR (2026-10-17)
mondo: "how is a unit's jump stat/range/height calculated? can i see it in the race editor along with the other stats?"
The race jump moved from battle.js (RACE_JUMP_OVERRIDE + RACE_NIMBLE_JUMP) into data.js `RACE_JUMP` (same values, one table)
+ `raceJumpStat(race, spd)`: the race's own row, else 1 below `JUMP_SPD_FROM` (90) SPD and 2 from it. battle.js
getUnitJumpStat = explicit unit.jump → raceJumpStat. Every race resolves exactly as before (checked headless, 0 diffs).
Note: on the 200-point SPD scale (2026-10-06) the SPD-90 line gives 44 races jump 2 from SPD alone (78 of 124 jump 2).
Race editor: JUMP column on RACES (dim = from SPD), a JUMP select in the inspector ("from SPD (n)" or 1-5) with "hops up n
· leaps max(2,n) tiles", and the derived line. EWRaceMods field `jump` (number, or null = drop the row) → RACE_JUMP; the
export instructions + summary carry it. The climb design (not built) is /mnt/project-files/design/CLIMB_MECHANIC_DESIGN.md.

## THE ELEMENT SHARE (2026-10-17, mondo: elemental spells split their damage)
- A combat-element spell (fire/ice/lightning/water/poison/earth; + 7 more in round 2 below) splits: `(1 − elemShare) × type matchup + elemShare ×
  element affinity` (weak ×1.5 / resist ×0.5 / immune 0 / absorb heals that part after the blow). STAB and every other
  bonus ride the whole hit, same ×3 cap. `elemShare` per spell row (Spell Library "Element share"), default 0.5
  (data.js `ELEM_SHARE_DEFAULT`). Source-less hits (ticks, hazards, weather, planted seed stings) stay all element.
- Press: the TYPE decides (a super effective type presses even when the element is resisted); the element presses only on
  a neutral type; immune / absorb never press — `PRESS_OUTCOME.NULL` vetoes a cast's press without the AP drain; a
  resisted type with an element weakness = no refund, no drain (data.js `elemPressVerdict`).
- Entropy: `ENTROPY_PTS.elemWeak` (4) per enemy the element part hit on a weakness, press or not (filed on the press
  collector in applyDamageToUnit, paid in `_consumePressCollector`).
- Mirrors: `forecastHitOnUnit` (heal = absorbed part), ai.js `estDamage` + `pressEV`, ui.js `_estimateSpellDamage` +
  badges (`_elemPressesOn` decides the green !), hud.js target rows + enemy quick menu. Resolvers thread `elemShare`
  (`_spellElemShare(spell)`); bombs and delayed spells carry it in their records.
- Round 2 (mondo's answers, same day): (1) no type chart on the element part, (2) no extra drain for immune/absorb —
  both as built. (3) **Damage-scaled share**: a row without `elemShare` gets `spellElemShareAuto` — 30% element at
  power ≤ 80, 70% at ≥ 160, linear between (data.js `ELEM_SHARE_BAND`; power = dmg, else summed hitDamages, dashDamage,
  turretDmg, dotDamage; no power number → 0.5). The Spell Library field shows `auto N%` beside the blank input.
  (4)+(5) **Seven elements promoted**: wind, nature, sonic, psychic, light, shadow, blood joined `COMBAT_ELEMENTS`
  (13 now) with the approved RACE_ELEMENT_AFFINITY rows (block "element promotion 2026-10-17"). Arcane + metal stay
  unresisted pending his card. The element box wraps into bands of 7 (data.js `elemBoxBands`; xl cells 36px so the
  Horologe's 316px panel fits). No status pairings for the new elements (not asked).
- Barrage fix (same PR): Requiem-style self novas land their hits on staggered timers; a slow frame ran finishAction
  first, so they never pressed or paid element entropy. doSpell's `_pendingSpellHits` gate makes finishAction wait
  (≤ 4 s) for the counted hits.
- Round 3 (same day, mondo "yes make them resistable too"): arcane + metal joined `COMBAT_ELEMENTS` (all 15 tags).
  Rows: metal — werewolf weak, fairy weak, gargoyle resist, juggernaut resist, kaiju resist, cosmic wraith immune;
  arcane — scarecrow weak, wizard / fortune teller / gnome resist, machine elves absorb. Element box bands of 8; xl
  tracks fixed 32px (284px box, Horologe panel 316px).
- Plan, decisions and the tag-only elements proposal: /mnt/project-files/design/ELEMENTAL_DAMAGE_SPLIT_PLAN.md.

## THE TWELVE ELEMENTS + THE ZODIAC SPELL SURGE (2026-10-18, mondo)
- "cut out light and shadow (too close to divine and unholy) and also arcane (thats basically just magic damage, it
  doesnt need an element)". SPELL_ELEMENTS = COMBAT_ELEMENTS = fire, ice, lightning, water, poison, earth (= ground),
  wind, nature, sonic, psychic, blood, metal. The 108 spells tagged light / shadow / arcane now carry `vfxElement:`
  instead — the look only (three-vfx-effects _resolveTheme / _stageArchetype / beam colour read `element || vfxElement`;
  data.js spellFamiliesOf keeps their family pool). battle.js getSpellElement returns null for any tag outside
  SPELL_ELEMENTS (never name-guessed). Their race affinity rows are gone; a race-editor doc's cut-element rows drop on
  apply. Element box bands = 6 (ELEM_BOX_BAND, styles-base .ew-elem-row repeat(6), hud.js UI Maker reads the band).
- THE SURGE: data.js ZODIAC_SURGE_ELEMENT gives every sign one element (Aries fire, Leo blood, Sagittarius psychic,
  Cancer water, Scorpio poison, Pisces ice, Gemini wind, Libra sonic, Aquarius lightning, Taurus earth, Virgo metal,
  Capricorn nature — order inside each trine is Claude's default, mondo may swap). battle.js _hitDamageMath: a unit's
  non-DoT hit whose element (_affEl) is the sky's lands ×ZODIAC_SURGE_MULT 1.25 on the whole hit (forecasts include
  it; ai.js estDamage mirrors). Was one element per trine (fire / lightning / frost via the combo vocab). Earth signs
  keep their earthworks on top. Banner text = getZodiacResonanceDesc.

## THE SOFT ZONE + THE CUBE IN ITS ZONE (2026-10-18, token 20261018-nexuszone-03-cors)
mondo: "i dont like how the nexus zones are drawn on the ground, they have these ugly hitchmarks, and they have these flat
rectangular light panels ... they need to atleast fade at the edge or something. also in 5v5 the idea was for the cube to be
inside the nexus zone but it is drawn around it".
- Look (three-renderer.js rebuildNexusWalls): every zone is ONE soft decal. `_nxZoneTex` draws the zone's shape once into a
  32 px/tile alpha map (soft-min distance to the merged outer edge runs: faint fill, glow rising to the edge, soft rim 0.1
  tile in, feather to 0 at the edge, rounded corners), cached per shape; each tile is a full-size drape (`_nxZoneTileGeo`,
  the move tiles' own _buildDrapeGeo) whose UVs read its patch of the map, tinted by owner colour, in the shimmer list.
  Removed: the 0.96 per-tile washes (their gaps were the grid of "hatch" marks), the rim ribbon + halo, and the standing
  curtain / cliff skirt / seam panels ("light panels"). `_nxDrapeGeo` now copies UVs too when it reuses a geometry.
- 5v5 rule (map.js _initArenaSpawnNexuses): the spawn nexus's `tiles` take the Cube's back-middle tile (the full 2×3); the
  seats (spawnZones) stay the 5. Nobody can stand on the Cube, so no capture / respawn / lockout count changes (respawn
  already skips tower tiles). The front-middle seat sits in the list's middle slot, so zoneX/Y (AI goal) and the centre
  stay on it. 4v4 boards are unchanged (their Cube stands outside the row zone).

## THE ZONE LOOK (2026-10-19)
mondo: "why do the spawn zones and nexus Zones look like shit? i know we just changed them but now they look even worse. add
them to the arrows and highlights section so i can change their settings and appearance and glow and all that".
- Why worse: THE SOFT ZONE kept none of the old light (the additive halo + curtains, the 16% wash): a 7% fill and a
  normal-blended rim, so a zone read as a dull painted line; TDM's spawn strips still wore the old per-tile washes (gaps =
  grid marks), absolute P1-blue / P2-red, and the standing sanctuary panels.
- Now (three-renderer.js THE ZONE LOOK): every zone (centre, diagonal pair, hotspot, Arena spawn nexuses, TDM spawn strips)
  is two draped layers off one alpha map of its shape (`_zoneMaskDraw`, 48 px/tile): PAINT (fill + rim solid / dashed /
  dotted / double + pattern; normal blend) and LIGHT (inner glow to the edge + rim halo; additive), plus optional light
  walls on the edge (rebuildSanctuaryWalls now stands them for any zone, height 0 = none = the default). Spawn zones (TDM +
  Arena spawn nexus) wear the spawn look, every other nexus the nexus look; colours viewer-relative (yours blue, enemy red,
  neutral gold) unless the UI Maker sets one.
- Maps redraw in place on a look change (`_nxZoneTex` keeps one texture per shape + look + layer, `_ewSig`); materials
  are shared per (map, side) and `_zonePaint` writes colour × brightness, opacity and the pulse every frame. Look defaults
  live twice: three-renderer.js ZONE_LOOK_DEF and hud.js zoneDefs(); keep them equal.
- The rim glow follows a dashed or dotted rim (dash period 0.4 tiles; dots 1.4× the line, spaced max(0.2, 4 × width)):
  with a solid band of glow over the gaps, a dotted rim read exactly like a solid one on the real board.
- Checked in a real battle (Arena + TDM, classic WebGL and ?ew_gpu=webgl2): every zs* / zn* control and colour changes
  the board. ?ew_gpu=webgpu in the sandbox Chromium draws black (three's createView `swizzle` is not supported there).

## THE ZONE ON THE GROUND (2026-10-20)
mondo: "on some arena maps there is a bridge spanning a gap and it crosses over the middle nexus zone, which paints the nexus
zone halfway on the bridge and half on the ground. It needs to be all on the ground".
- Cause: a zone tile under a field's deck (THE TWO FLOORS: `field.lows`) was placed and draped at tileTopY = the DECK.
- three-renderer.js `_zoneGroundY` / `_zoneTileY`: such a tile drapes the ground (`_buildDrapeGeo` refY = `G.lowAt`) and sits
  there + HL_FIELD_LIFT; every zone (nexus, Arena spawn nexus, TDM spawn strips) and its light walls. Capture rules unchanged.
- Affected at the time (bake picks): nexus under a deck on Giza 12, Area 51 9, Antarctica 9, Downtown 9/10/11; spawn
  zones under one on Antarctica 12/9/11, CERN 9/10/11, Area 51 11.

## THE SLIDE FORECAST (2026-10-18)
mondo: "the spell preview/move forecast should account for sliding on ice. i dont want to move+cast and then move and be out
of cast range bc i slid, that should already be accounted for/the arrow or preview should communicate that i will slide on ice".
- battle.js: the slide rule is `_unitSlidesOnIce` (who slides) + `_iceSlideSteps` (the glide), read by the real
  `_resolveIceSlide` AND by `predictWalkLanding(unit, x, y, z, {path, takeoff})` = where a doMove to (x,y) really ends
  (heading = the walk's last step, the facing doMove sets; null = no slide). `walkLandingTile` is the short form.
- Every move-then-act finder measures from that landing and returns `land` on its approach tile (x/y stay the tile doMove
  walks to): findSpellApproachTile, _findSelfNovaApproachTile, findAttackApproachTile, findInspectApproachTile,
  findCaptureDoorApproachTile, TargetQuery.hasReachableTarget, attackHasReachableTarget, hud.js findMoveIntoRange + the
  cross / beam / tile-AoE candidate loops (`_mtLand`, `_mtCastTile`). Forecasts / press / AoE aim cast from the landing.
- Board: the move hover, the move-towards hover, the move+cast/attack/inspect approach preview, the quick-menu row hover and
  the tile menu's "Move here" draw the walk arrow to the tile walked to, then an ice-blue arrow (0x00d0ff, UI Maker kind
  'slide' in Arrows + tiles, arrow and tile) over the glide; glided tiles marked ice blue, ghost + destination marker on the
  landing; the hologram glides that leg (three-renderer motion leg type 'slide'). Gold 'strike' / hazard / benefit move
  tiles (ui.js) are read at the landing.
- Shoves: resolveForcedSlide's simulate path now adds THE CHAIN's ice glide (travel direction) to res.x/y + steps
  (`iceSlid`), so push/pull previews land where the ice leaves the body. Live slides unchanged.

## THE STORMS UNDERFOOT + THE WALK'S BURNS (2026-10-19, mondo, token 20261019-tilepath-02-cors)
mondo: "Check all cyclones to make sure their effects or flinging happen when a unit lands on them. Or path through them.
Same for lava and fire too, if i walk on them at any point in my path, i should get burned." + "shouldnt i see the stat
change on the name plate right away?"
- **One strike:** state.js `stormStrikeUnit` is the homing storm's hit on one body (soak, roll, blizzard blind,
  thunder bolt); the round-end strike and THE CHAIN's F both call it. F (`_chainVortex`) now covers every homing storm
  (tornado, hurricane, thunderstorm, blizzard, sandstorm), once per storm per body per round (`_vortexStamps`); tornado /
  hurricane then fling (`vortexFlingUnit`, fling fx waits for the walk tween: `fopts.delayMs`).
- **Walks:** a tornado / hurricane eye that can move the walker stops the walk on it (getPathPickupEvent `storm`,
  `_walkStormStopAt`) and flings it; doMove now animates the walk only up to the first tile that stops it (bombs, traps,
  gusts, doors too). Other eyes strike in passing (`_walkPassHazards`). Lava (`LAVA_WALK_DAMAGE` 30 fire + burn 3) and
  ground fire (18 + burn) bite once each per walk, on any tile of the path or the landing (`_walkBurnt`).
- **Preview:** predictWalkLanding returns the storm stop (`_predictWalkStorm`: stopIdx + fling legs from
  simulateArrivalChain), `walkRouteOf` cuts the route at the eye, the ghost "-N" adds `predictWalkHazardDamage`.
  `_slideStepInfo` no longer reads the simulated body as blocking its own rebound tile (forecasts of edge rebounds were
  one tile off). AI drops destinations whose path meets a flinging eye (ai.js `_aiStormFilter`).
- **Name plate:** state.js `getWeatherStatChips` (e.g. "🏜 VISION-5") on the 3D plate badge row and the Horologe /
  unit card chips; the plate serial hashes them so a storm moving onto a standing unit refreshes it.

## NO SELF-COMBO (2026-10-19, flipped 2026-10-20, mondo)
mondo: no base spell may both apply a status and deal bonus damage (`bonusVsStatus`) against that same status. A status or
bonus gained through an UPGRADE is fine. His rule (10-20, after the first pass got it backwards): LOW-tier spells apply the
status, HIGHER-tier spells are the finishers. So the tier III/IV self-combo rows keep `bonusVsStatus` and lost their own
`statusEffects`: Meteor, Mind Shatter, Requiem (its Discord stat drop went with it), Miasma, Bad Trip, Dark Dominion (pays
on Burn or Stagger), Dark Lullaby, Kiss of Decay, Descending Wrath, Wrath of the Watchers, Heat Vision, Dragonfire, Tidal
Slam, Avalanche Strike. The tier I ones keep the status and lost the bonus: Shadow Crush (Slow), Venom Fang (Poison).
Checked and left: Boo (applies Discord, pays on Haunted), Formic Acid (poison GROUND only ticks damage, never the Poison
status), Star Decree (no status). Forecasts / AI read `spell.bonusVsStatus` generically. A new row must not pair a
`statusEffects` id with the same (or a countsAs) id in `bonusVsStatus`.

## THE LANDING PICK (2026-10-20, mondo: To the Moon lifted the target, a lit landing tile said it was out of range, and a right-click left the target in the air; "there are other similar spells")
Covers every `kind: 'skyThrow'` row (To the Moon, Abduction Beam, Dragon Toss, Infernal Hurl). battle.js:
- `skyThrowLandingPhase(unit)` / `getSkyThrowLandingTiles(unit)` = the lit ring (flat Manhattan 1..throwRange from
  the held body, no sight or height test), the same ring ui.js paints and doSpell's throw gate measures.
  getSpellRangeTiles returns that ring during the landing pick (like THE BLINK LANDING), so every confirm path agrees.
- clickTile's fog gate passes a landing click (the ring is lit fog or no fog). This was the refusal mondo hit: lit
  landing tiles in team fog answered "Out of sight".
- three-renderer `_screenClick`: during the landing pick the click names the TILE under the pointer (what the hover
  lights and holograms), never a body hanging or standing in front of it.
- The grab arms the 'spells' aim view (the board is the drum, label "CLICK A LIT TILE TO THROW"), not the old enemy
  list whose rows threw out of reach. `_getSpellValidTargets` lists only enemies on a lit tile; no MOVE→CAST rows.
- Back-out (right-click / BACK / ESC, ui.js `_dropHeldSpellPick`) calls `cancelSkyThrowGrab`: the body drops back on
  its tile, the spell stays uncast, the grab's MP (`_skyThrowGrab.mpPaid`) comes back. Every release
  (`_releaseSkyThrowGrab`: another action, reselect, turn change) refunds it too. online.js routes the guest's
  cancel to the host (`fn: 'cancelSkyThrowGrab'`). A pick-a-unit teleport forgets its picked unit on back-out.

## THE BATTLE CLIMB (2026-10-20, mondo: "Did climbing ever get added to the game? ... in battle" → yes to design/CLIMB_MECHANIC_DESIGN.md's recommended answers)
battle.js (after doJump) `getClimbTilesFrom` / `getClimbTiles` / `doClimb` / `_startClimb` / `knockOffClimber` /
`processClimbArrival`; data.js STATUS_DEFS `climbing`.
- A face TALLER than the unit's jump (`getUnitJumpClimb`) and at most jump + `CLIMB_RULES.capOverJump` (2) high, from
  one of the 4 straight neighbours (Low Gravity +2, Gravity Crush none). Down: the same cap, only where the drop would
  hurt (predictFallDamage > 0). Never: an edge-wall panel on that edge, arena rock (`fieldCellRock`), roofWalkable
  roofs, a roof over the lane (`columnLaneClear`), Clash, Mystery Dungeon, Simul, a flyer that can still fly.
- Climb ENDS THE TURN (spendAllAP). Move + Climb = one walk to the foot (needs 2 AP, no move spent), then the climb
  (doClimb chains doMove → `_startClimb`; online the guest emits the whole doClimb, the host runs both legs).
- The climber STAYS IN THE FOOT COLUMN: unit.x/y/z = the bottom of the face (up: its own tile; down: it moves into the
  lower column at the start). `unit._climb = { dir, rise, wallX, wallY, wallZ, footX, footY, footZ, round }` is plain
  data → state-sync. Reach, occupancy and hits all read the foot tile (the design's "half-way up" reach was not built:
  too many separate range paths to keep the previews honest).
- The `climbing` status (marker, 99 rounds, only `_endClimb` removes it): blockMove = 0 dodge; stageMod −2 DEF / −2 M.DEF.
  getCounterChance → 0 and checkOpportunityAttack skips a climber.
- Knock-off: any damage with a sourceUnit that isn't a DoT tick (applyDamageToUnit hook before the death check), any
  resolveForcedSlide, any blockAction status (stun / frozen / sleep, applyStatusPayload). Fall damage = the whole rise
  with forced threshold 1, 300 ms later; `predictClimbFallDamage` (rise + 2 into predictFallDamage) is the same number
  on the quick-menu button and in the log. `unit._climbKnockSeq` tells the renderer it was a fall.
- Arrival: the activation (beside processBuildingEmerge) calls `processClimbArrival` first. Up: re-checks the ledge
  (free, surface still there, within the cap, no Gravity Crush, lane clear) → jump arc onto it (relayed), Overwatch,
  Nexus, resolveTileArrival; else drops back to the foot unhurt. Either way the unit keeps its full turn.
- UI: root verb CLIMB (only when a climb exists this turn; MOVE→CLIMB note when only via a walk), action mode 'climb'
  (sandstone `move-climb` tiles), the Move overlay paints the same ledges and a click there climbs, tile quick menu
  "Climb up here / Move + climb up (fall −N HP)".
- Look (three-renderer `_updateBattleClimbers`, UAL_SLOTS `climbWall` = MAL3 Fast_Ladder_Climb, `climbMantle` =
  UAL2 ClimbUp_1m, both defer): body pushed 0.30 tile against the face, feet rising to 42% of the rise over 1 s with
  the climb clip (down: played backwards), then the clip FREEZES (timeScale 0) as the hang. Release: moved = mantle
  one-shot under the jump arc; not moved = a 220 ms drop to the foot (+ the fall clip on a knock-off).
- Not built: AI climbing / AI pathing over climbable faces; Nexus ignoring climbers.

## THE REAL-LOOKING COPY (2026-10-20) — battle.js, three-renderer.js
mondo: "scarecrow's stuffed double needs to be its actual 3d model, not its pixel sprite. this goes for all copy/clone
moves. From the enemy perspective they need to look indistinguishable from the actual unit."
- Every decoy (Shed Skin, Mimicry, Stuffed Double, Cloning Machine) stores `decoyId` + `spriteUnit = _decoyLookOf(unit)`
  (battle.js): race, gender, appearance, sprite override, zodiac, facing, flyer lift — plain data, rides the snapshot.
- three-renderer.js `rebuildDeployables` builds it with `_buildDecoyEntry` → the SAME `_buildUnitEntry` as a real
  unit (rigged model idling on its own rig keyed by decoyId, or the sprite slab for a sprite race; team ring, outline,
  x-ray ghost). Its plate is `_buildPlateDom` (shared with `_createPlate`) fed the caster's LIVE HP / MP / shield /
  statuses / stages; `_decoyOwnerSerial` re-plates it when those change. `_updateDecoyEntries` (per frame) runs the
  idle clip, self-glow (incl. the acting-unit breath), ring look + vitals, flyer bob, tp-active / tp-targeted.
  Hover lights it like a unit (`_resolveHoverAt` → `_decoyGroups`). The old flat sprite card is only the fallback.
- Not mirrored: the hover info card (enemy decoys still show the tile card, hud.js), and a hit on the copy (it just
  breaks, no death clip).

## THE PLAYTEST LOG + RULE FIXES (2026-10-21) — battle.js, map.js
From the hands-on Mount Shasta playtest (https://claude.ai/artifact/FMcV14kczkjTPVRDNoWeFq), each reproduced in a
browser match with the same squads before the fix.
- Finisher forecast: `getFinisherForecast` reads `forecastHitOnUnit` (the real hit math: level, soaks, shield, every
  multiplier) mid roll + `min`/`max` over FINISHER_RULES.variance. It used raw × chart only (list −858, blow 1372).
  `kill` = the LOW roll empties the bar. The opening log line is "☠ X unleashes <FINISHER> on Y!"; "X executes Y!"
  is written only after a killing blow, else "☠ Y survives <finisher>." `_applyExecuteRider` logs EXECUTED! only on a
  real kill (Protect / Indomitable can still save the unit).
- Hit lines: `_dmgLogLine` builds every applyDamageToUnit sentence. Lead kinds: label ("Big Kick: " → "takes N HP
  damage"), verb phrase ending in a word + space ("Anubis drains life from " → "…from Cowboy for N HP damage"), or a
  lead ending in "for" (weather / terrain texts → "…struck by lightning for N HP damage"). It also tags the lead's
  first name (source unit, else the victim) with `_ctName`, so mirror matches colour the attacker by side (the old
  untagged name fell back to "the unit on turn first").
- Forced slides: `resolveForcedSlide` shares one bounce count per THROW (`opts._throw`, passed down every chained
  slide), as COLLISION_CONFIG.maxBounces says. Each chained body used to get its own 2 (7 impacts in one Big Kick).
- Defeat line: map.js `_defeatRespawnLine` / `_respawnPastLimit` — a respawn that would land after the round limit
  (round + _respawnIn > roundLimit, no sudden death) reads "No respawn before the round limit"; the death banner too.
- Boot watchdog: the "boot pending" stall now waits LS_MAX_WAIT_MS + 45 s (the loading gate grew to 90 s, the
  watchdog stayed at 60 s and fired inside a slow first load). The [BOOT] 10 s kick re-checks every 5 s while the
  camera / a centre banner / a walk is still running (up to a minute) instead of kicking under the round-1 arrival.
- Not reproduced: "Anubis absorbs 38 HP." twice. One Life Drain writes one heal line; the same spell can't be cast
  twice in a turn ("Used this turn").

## THE CLEAR CAMERA (2026-10-22, mondo's second playtest, Camera items 1, 2, 3, 5) — battle.js, three-camera.js, three-renderer.js
- **1, the lens inside walls / the x-ray.** On the board nothing on the grid fades, so a lens behind a wall shows the units as their
  x-ray holograms and a lens inside a wall turns the board black. ThreeCamera.sync's board rig now has THE CLEAR BOARD guard
  (`_boardSightFloor`): the focal→eye sight line must clear every solid column by ~½ tile and the eye must sit above any unit's
  drawn body (`window._camBodyTopPx`, battle.js, the model's real footprint), else the eye cranes up (max 6 tiles). Kill switch
  `window.EW_NO_CLEAR_BOARD = true`.
- **2, the pick-a-target two-shot (Rocket Fist into the Sedan).** `_menuCamOccl` (battle.js) scores a pose: each body is sighted at
  chest, head and (a car) its four footprint corners, every line walks the solid columns every ¼ tile and must clear a column top by
  0.45 tile (a room's wall piece stands proud of its column: Pyramids of Giza's hq_piece walls sat ~70 px over the grid height and
  the old centre-of-tile test said clear); the eye inside a column or a model counts 3. `_menuShotPose` also tries drops 24/34
  (tilt floor 26) and a swing 28° wider, only while every old candidate is blocked, so open ground frames exactly as before.
  Seen in a real browser: Sedan (5,8) → enemy (7,8) on Pyramids went from the Sedan as a hologram behind the wall to both in clear.
- **3, the low camera after an action.** softResetToUnit's press-turn HOLD (keep the action shot while the unit has AP left) no
  longer applies to the local player's own unit (`_cameraActingSideIsAuto()` false): it takes the full return to the view it had
  before the action. CPU / remote chains keep the hold. Old behaviour: `window.EW_PRESS_TURN_HOLD_LOCAL = true`.
- **5, the black blob in the death close-up** (mondo: "hide all models during the death animation except the one that died"). The
  death pane (ThreeSplitscreen, `p.death`) hides every other unit group while that pane draws (`_ssSoloUnit` / `_ssSoloRestore`
  in three-renderer.js `_ssRenderFrame`, restored in a finally after the panes); the main view is untouched. Viewer-local, so
  the guest's own death pane does the same. Kill switch `window.EW_DEATH_CAM_ALL_UNITS = true`.
- Move zoom (item 4) untouched, as mondo asked.

## THE STACKED FLOORS — clicks under a bridge (2026-10-22, playtest 2 "Unsure what to press" 6)
mondo: "If there is no route on to the bridge then the game should automatically be registering mouse clicks on the
bridge to the tiles underneath it ... if you can reach the top of the bridge and underneath it in the same turn, how
would the game distinguish the clicks? ... please fix and come up with elegant solution".
- Cause (reproduced on Pyramids of Giza Arena, a field board: deck z7 over ground z5 on row 6): the field pointer
  (THE TWO FLOORS, `_fieldFloorPick`) walks the floors along the ray, but where the ground BEHIND the deck pixel was
  an unlit cell (range edge) it fell back to the deck → "No route onto that surface this turn." On non-field boards
  the deck took the click unless THE OVERHEAD FADE had already opened it (timing dependent).
- Rule now (three-renderer `_boardFloorPick`, hover + click, every map): a floor NOT lit for the action in hand never
  swallows the pointer. (1) the first LIT floor further along the ray wins (the lit tile whose highlight ghost shows
  through the deck; ThreeCamera.screenToTileAll walks the hits); (2) else the lit floor straight under the deck in its
  own column. Lit front floor, or nothing lit, = the old WYSIWYG pick. Only columns with a floor UNDER the hit can
  take (2); a wall or hill has none.
- Both floors lit: the floor in front wins (pointing at the deck = the deck). F flips the hovered column to its next
  lit floor (down, then wraps to the top); the cursor drops onto it, the deck over it opens (the overhead fade follows
  the hovered floor) and the click takes it. The flip holds while the pointer stays on that column or within 40 px.
  The prompt bar adds "F floor below / F floor above" only while the hovered column has 2+ lit floors
  (`window._ewStackPick`, battle.js `_withStackFloorHint`; ui.js key handler). Move / jump / climb / spell aim.
- Browser-checked on Giza Arena (Sedan): deck over lit ground with no route on top → moves to the ground; standing
  where both are reachable → click = deck, F + click = ground; prompt hint shown and flips.
- Not covered: touch/gamepad have no F (keyboard Enter cursor keeps its own z).

## THE CUBE PLAYTEST FIXES (2026-10-23, report https://claude.ai/artifact/BqLpotev1HFttbkZGZoiEW)
- STAT STAGE CAP (mondo's rule 10-23: "the max attack stat at level 100 plus 5 stages", for every main stat, following
  his stat edits): battle.js `_statStageCeil` = max(roster top + 5 × STAT_STAGE_STEP, the unit's own value). Roster top
  (`_statStageRosterTop`, cached 1 s) = highest RACE_BASE_STATS value + LEVEL_TOTAL_STAT_GAINS + biggest ZODIAC_EFFECTS
  natal for ATK / M ATK / DEF / M DEF / SPD, so the race editor moves it. Shipped: ATK 358, M ATK 343, DEF 362, M DEF 369, SPD 300.
  The old max(100, base) sat below every level-100 statline, so every ATK buff read "ATK maxed". `statStageRoom(unit, stat,
  n)` (GAME) is the one room count; ai.js stageRoom and Bloodcraze's SPD clamp read it. STAT_STAGE_STEP stays 20.
- Respawn clears `_staggerApDebt` beside the statStageMods reset (map.js x3, battle.js realtime).
- ui.js `_estimateHealPotionHeal(target, item, user)` applies Devout healMult + healTakenMult (Grievous / Gooed).
- hud.js Abilities sub: a spell blocked by its own guard (cooldown, one cast, Brand lock) names that reason
  ("⏳ CD 2") instead of "No target"; the cooldown beats the Brand lock.
- hud.js attack drum: the Cube row carries GAME.getCubeAttackForecast's mid roll ("≈−161", "×1.5" when sieging).
- Result fact line "N v M STANDING" uses the wipeout rule (home side, not dead / _dying / _sealed).
- startMatch: a match after a finished one counts up matchNumber (party-builder starts kept 1 → "MATCH 1" forever, the
  series record skipped results and matchHistory overwrote itself); `_recentDefeats` reset there too.
- `_actedLog(unit, msg)`: "already acted" click answers are silent for CPU / remote seats and private to the side.
- three-renderer `_updateMinimap` hides off the battle phase (the HUD stylesheet that hides it leaves with the HUD).
- match-select.js MapCard shows the cut a click would play (the picked BOARD SIZE).
- NOT REPRODUCED: the Cube missing from Gargoyle's attack list once (same tile next round). The list's tower branch and
  the swing share combatDist + LoS from the unit's z; a changed z (airborne) or a changed column is the likely cause.

## TAKE OFF FIRST — Move never takes off for the player (2026-10-23, Cube + wipeout playtests) — battle.js
- mondo: "dont show tiles that you can take off+move to, it should require you to take off first. Same with land+move,
  the player should have the choice to spend the ap to take off or land". The playtests had a grounded flyer click a
  Stonehenge tile, take off onto the lintel and spend both AP (turn over).
- battle.js `getMoveTiles`: the grounded-flyer TAKE OFF + MOVE fan-out (the teal `_takeoff` tiles) now runs only for
  `state.autoPlayers[unit.player]` (the CPU). A player's grounded flyer sees walk/jump tiles only; Take Off (1 AP) is
  its own action, then Move shows the flying tiles. Everything downstream of `_takeoff` (ghost route, "Take Off + Move"
  tile card, move-then-cast) simply never sees one for a player unit. The CPU keeps the combined take-off + move.
- Land + move: an airborne flyer's Move tiles were already all airborne (getFlightZChoices never returns the ground),
  so nothing landed on its own; Land stays its own action.
- Not changed: spell approaches that take off / land in place and then cast (`_spellHeightApproaches`).
- Browser-checked on Stonehenge (Sedan as a flyer): old code, 11 teal tiles and a click flew it to the lintel (z 8,
  AP 0); new code, 0 teal tiles for the player (CPU still 11), the same click does not take off, Take Off then Move
  lists the flying tiles.

## THE WIPEOUT PLAYTEST FIXES (2026-10-23)
From the 10-23 wipeout playtest (Stonehenge 4v4, Training). mondo: green ! = super effective (intended); no layout work
except the Nexus counter; flyer take-off is its own thread.
- Entropy Strike picker estimate (~972 shown, real hits 2011/1507): battle.js `getEntropyStrikeForecast` now runs each
  enemy through `forecastHitOnUnit` (the engine's own hit math, live=false) and returns `hits` + `dmgLo`/`dmgHi`; hud.js
  `_hrlgEntropyBlades` shows `lo–hi` (one number when equal). ai.js / `getEntropyStrikeBestType` untouched.
- Nexus counter huge up close: three-renderer.js `NEXUS_PLATE_MAX_PX` (260) caps the plate's on-screen width, the mirror of
  `NEXUS_PLATE_MIN_PX`.
- Imitation Report over the cinematic / VICTORY: `_imitMatchSummary` only sets `_imitReportPending`; `showResultOverlay`
  opens it (`_imitShowPendingReport`, 1.2 s after) FOLDED to its title bar; ▸/▾ (`_ewImitationReportFold`) opens it.
- Camera inside the Dragon/Nephilim: the menu camera (`_menuCamOccl`) counts a model within `NEAR_LENS` (2.5 tiles) of
  the lens as a heavy block; three-camera.js `_boardSightFloor` lifts the board rig over a body within
  `BOARD_NEAR_BODY_TILES` (2.5) of the lens. `window._camBodyTopPx` takes the subject's point so the shot's own unit is
  never its own blocker. Old behaviour for comparison: `EW_NO_CLEAR_BOARD = true`.
- Target off screen after arming a tile-aim spell (Dragonfire etc.): the range fit framed only the lit tiles while the
  list pre-picked a MOVE→CAST target outside them; setActionMode's free-aim branch refits the same board read to take in
  the picked target (THE PICK IN FRAME).
- ATTACK lit with nobody in reach ("No target" on click): state.js `getActionPanelCache` asks `_getAttackValidTargets`
  (the list's own check) instead of a z-0 distance test.
- Setup Field Assignment showed the size twice ("Stonehenge Arena 10×10 10×10"): match-select.js drops the size label
  when the cut's name already carries it.
- Already fixed on main by PR #419: "4 v 1 STANDING" after a wipeout, the list card's 12x12.
- Not bugs: "Player holds the field." is the default profile name; "[BOOT] ... kicking the turn loop" is the slow-machine
  diagnostic (sandbox); the low two-shot menu camera is the design (MENU_CAM_TILT).
## THE SPELL POWER REVIEW (2026-10-23, mondo: "lets go ahead and add those spells. Balance the status effects better like reduce the number of stagger spells ... it needs to work for wet too ... even out the elemental spread. Definitely too much metal too.")
Review page: https://claude.ai/artifact/5v2kAZFtLm1yCam99A89kw (built from the wipeout / Cube / Keys playtests).
- **Eleven new rows** (data.js, end of SPELL_LIBRARY, each in one existing family): Open Vein (blood I, Bleed 2 — the first
  spell that applies Bleed), Arterial Spray (blood III, ×1.5 vs Bleed), Conduction (lightning III, ×1.5 vs Wet, stacks with
  the Soaked shock), Thornlash (nature I, Root 1), Overgrowth (nature III, ×1.5 vs Root), Crosswind (wind II linePush, Blind 1),
  Eye of the Storm (wind IV aoePull, ×1.5 vs Blind, cd 2), Mudslide (earth III line, ×1.5 vs Slow), Tailwind (teamwork II
  warCry, Quickened 2 to allies within 2, cd 2), Far Sight (psychic II, `remoteView` + `inspectAt`), Rustle (cowboyskills II,
  `pull` + `stealKeys: 1`).
- **Far Sight**: battle.js `_inspectFootprintAt(unit, x, y)` is the Inspect itself (footprint, Keys, corpse loot, hidden bombs,
  logs, camera, scan fade) lifted out of doInspect; doInspect keeps its checks + AP + turn bookkeeping. doSpell's
  `remoteView && inspectAt` branch range-checks (Chebyshev ≤ spell range), pays MP and calls it. ai.js `_aiFarSightPick`.
- **Rustle**: the `pull` branch robs after the yank when a row carries `stealKeys` / `stealItems` (`_stealFromUnit`).
- **Stagger 41 → 20 appliers**: tier III/IV rows stop applying it and became finishers (Stampede/Divine Swoop/Rampage ×1.5 vs
  Root; Kill Mode/Cosmic Slam/Quake vs Slow; Shockwave Clap/Slap Leather/Drop In/Jackpot vs Stagger; Crowd Surge vs Charm;
  Cuffed keeps only its Root). Tier I/II moved to under-used statuses: Static Shock + Yellow Thunder → Jammed, Mic Drop →
  Silence, Cluster Rockets + Dynamite → Burn 2, Demonic Roar + Infernal Conscription → Feared; Hogtie and Fee Fi Fo Fum
  dropped the extra Stagger. Drop In's hit now passes `bonusVsStatus` (the doorBreach branch never did).
- **WET CONDUCTS** (battle.js `_isSoakedBodyAt` / `_isConductiveWetTile`): a grounded Soaked unit is part of the conductive
  body like a water tile. Lightning on a pool floods through touching Soaked bodies; lightning striking a Soaked unit on dry
  ground arcs (`_reactLightningWater`, same 75% tick) to every touching Soaked body / wet tile, after the terrain loop and
  skipping tiles a pool already zapped. `_unitIsSoaked` also counts a unit under rain-type weather right now. Water and rain
  already stamped Wet (tickWetUnits, weather soaks); Drowning untouched.
- **Elements** (damage rows, before → after): metal 34 → 27, blood 10 → 22, wind 8 → 22, nature 8 → 18, lightning 11 → 13,
  sonic 11 → 13; no-element 152 → 122. Spells with the cut light/shadow/arcane look were left alone. Hacking/AI spells were
  NOT made lightning (lightning on tech = the overclock half-damage rule).
- Open (asked mondo, not built): Eternal Slumber 5×5 stun, no-cooldown 5×5+ nukes, Meteor/Requiem/Tidal Slam say
  "Cooldown: 2" but `_applyBaselineCooldowns` runs before `applyTreeRingCosts` so it never sees their tier MP,
  Cataclysm Stomp 5×5 at tier II, Spirit Bomb.

## THE TACTICS + THE RACE CLOCKS (2026-10-23, mondo: "lets go ahead and do the ai plan fixes … those jobs - fight, seige, search, intercept, and anchor - to be called tactics … Perhaps add heal") — ai.js v4.16, battle.js, state.js
Plan of record: the "Three Clocks CPU Plan" page (https://claude.ai/artifact/DxJ7TXUQbgdjUZ3yCxKVN2). All CPU-side scoring; no game rule changed, nothing new to sync (the host runs the AI).
- **Phase 1 fixes.** `_wipeoutShare` (one helper for killValue, the Finisher and the own-death price). `_killTally` records every victim ONE action drops (scoreSpells, the Entropy Strike, Detonate); when the kills reach every standing body of that side the action is paid the whole wipeout win minus the per-victim shares (random-target rolls never count). The Entropy Strike adds each victim's kill value (flat part unchanged). tileDangerCost's death price carries OUR wipeout share × anchorCaution_v1. Key carriers: `_keyCarrierDenial` = keyCarrierDenial_v1 × (team Keys ÷ Keys to win)² × the carrier's share. Blind Inspect: one ×0.3 (fight in sight; ×0.75 on the Search Tactic), no stacking after a death.
- **Phase 2 search map.** `_searchMapFor(g, unit, player)`: odds per tile for the still-hidden Keys from public facts only (Key count, own scanned tiles, Chebyshev-2 around Keys this side saw, walkable, not a Cube tile); centre columns × searchCenterPrior_v1 (randomizeSharedObjectives places Keys there first; 1 = off; flagged to mondo). Inspect value = expected Keys in the real footprint × searchKeyValue_v1. `_searchMoveCandidate` = move-then-Inspect (same one-move budget as battle.js _inspectMoveBudget).
- **Tactics.** `window.AI_TACTICS` (fight, siege, search, intercept, anchor, heal), `aiTacticFor(unit)`, `aiTacticReason(unit)`, `aiSetTacticPersona(player, id)`, `aiRaceClocksFor(player)`. unit.tactic (battle.js setUnitTactic, the auto battle thread) = FORCED, read-only here. CPU jobs live in ai.js `_tacticJobs` (never on unit/state). `_planTactics` once per side per round (re-planned when a body drops / a Key moves / a Tactic changes). Steering: `_applyTactic` (rankCandidates) + `_tacticGoal` (pickMoveGoal), × tacticCommitment_v1, forced ×1.5; a forced Tactic damps the other move goals ×0.6 except pickups/emergencies. A player's own auto unit always plays Normal (`_actorDiffKey`).
- **Phase 3 clocks.** `aiRaceClocks(g, p, ws)` → {our, their} × {wipe, cube, keys, buzzer, best, bestKind}. Their Cube clock uses the observed damage to our Cube (`_cubeHist`). scoreTowerAttack: `_cubeClockValue` (raceRoundValue_v1 × rounds saved × share × tightness) replaces the flat window bonuses; the old window + cubeWindowBonus_v1 is the fallback. Kill-switches: `EW_AI_NO_TACTICS`, `EW_AI_NO_CLOCKS`, `EW_AI_NO_SEARCHMAP`.
- **Difficulty.** Easy plays without the plan and the clocks (AI_DIFFICULTY_PROFILES.tactics; a player's own Tactic still applies). **Phase 4.** Hard only: `_hardReplyCheck` (top five options − hardReplyFactor_v1 × the worst enemy reply). state.js `_cpuPlanDraft`: Hard VS CPU drafts brawl / siege / Key hunt from RACE_BASE_STATS + raceKit (top ten per role, one of each); never for crossings, encounters, online or labs. `window._ewCpuDraftPlan`.
- **Phase 5.** battle.js `_AB_RETIRED_KEYS`: the 18 gen-40 flat weights + killBonusScore + cubeWindowBonus are no longer A/B-tested (values kept and still played; imitation still nudges; EW_TRAIN_KEYS overrides). Training dashboard: "P1 wins by" / "P2 wins by". Strength Test: Opponent mirror / Key Rusher / Cube Rusher / Turtle (`_ewSetStrengthSparring`, results per style). Imitation matches Inspect at the tile (synthetic score `_inspectScoreAt` when the CPU didn't propose it). New weights (no schema bump): raceRoundValue_v1, searchKeyValue_v1, searchCenterPrior_v1, keyCarrierDenial_v1, anchorCaution_v1, tacticCommitment_v1, hardReplyFactor_v1 (probe 'hard' = never in the labs). `window.getCubeAttackDamage` exported for the clocks.
- Not built (said so): endgame starts, many-weight steps, plan-drafted training teams, Entropy-gauge spacing, killBonus/killBase merge (both just stop being tested).
- BROWSER CHECK (2026-10-23, v4.17): three VS CPU Arena matches in the cloud browser (Normal, Hard, Normal), no JS errors, none reached a win before the round/time limit (Hard: CPU 5-4 on kills at round 19, Swordfighter hit the Cube twice). Fixed from what they showed: (1) the plan swapped jobs between units every round, now the last holder keeps its job (+60 fitness) unless someone fits it clearly better; (2) the "enemy on our Cube" Intercept alarm used sightings up to 3 rounds old within 4 squares and fired every round on an 8-wide board; now this round or last, within 3 squares (2 on boards 8-11 wide), worded "near our Cube". Then (v4.18): Search loses its unit when Anchor + Intercept + Siege fill the budget, so when the Keys race is our nearest win or within 1.5x+1 of it, the plan hands out one unit per wanted job first (the nearest win's job before the other race) and the kept fighter becomes the searcher. Two more things kept the searcher from searching, both fixed: a CPU-assigned job now damps the other move goals ×0.75 (forced stays ×0.6), so siege_tower no longer walks the searcher to the Cube; and the Search job's Inspect is worth the Keys clock (`_keyClockValue`: expected Keys × rounds per Key off our Keys clock × share × Race Round Value), and with 2 AP it scans FIRST when its best option is a one-AP hit/heal/item (Inspect costs 1 AP, doesn't end the turn, AP doesn't carry over). Browser check: round 7 Robin Hood and Sheriff both scanned before shooting, Sheriff found a Key, Keys clock 14.7 -> 5. The Sheriff that looked like it walked back from the Cube was Bigfoot's Big Kick knocking it into the corner every other round; nothing to fix there.

## THE PLAYER'S TACTICS (auto battle) (2026-10-23, mondo: "for the player to be able to apply them to their units so they dont have to manually fight for them, like they can be on auto battle") — battle.js, hud.js, online.js
- **Set it.** Root verb ♟ TACTICS (hud.js `_hrlgTacticPartyBlades` + `_hrlgTacticBlades`): the party list (acting unit first, each with its Tactic) and beside it MANUAL + the six AI_TACTICS rows for the picked unit. Picking for the acting unit hands the turn to the AI at once; for a teammate it applies on its next turn. Not on Mystery Dungeon (own chips) or in the tutorial.
- **Engine.** battle.js `setUnitTactic(id, tactic|null)` writes `unit.tactic`; `unitOnTactic(u)` is the gate (battle phase, controller ≠ AI, not possessed, not MD/tutorial) and is folded into `_mdUnitAuto`, so every AI-routing path (activation, `_shouldAIRun`, runComputerTurn, stall watchdog, safety timer, selectUnit, imitation skip, ActionMenu/turn column) covers it. `unitTacticProblem` greys Siege (no enemy Cube), Search (mode has no Keys), Intercept (neither), Heal (no heal/healAll/selfHeal/revive/zoneHeal/seedHeal kind and no Healing Potion — the Heal job's own list). MANUAL mid-turn: `_tacticWhenIdle` waits for the AI's step to finish, then restarts the shot clock + selects the unit. The tactic survives death/respawn (same unit object).
- **During its turn.** hud.js `TacticWatch`: the command menu's spot shows "<name> · <TACTIC>", `aiTacticReason`, and the Tactic list (MANUAL = take control). The prompt bar is silent for a Tactic unit.
- **Online.** The host owns unit.tactic (plain unit data → state-sync). Guest picks emit `game-action {type:'setTactic'}`; host handler checks the unit is the sender's (any time, not only its turn). The guest's units on a Tactic are played by the host's AI like the whole-side Auto mode.

## THE SIGNATURE FAMILIES A–F (2026-10-23, mondo: "i want each race to have at least one spell family that is unique to itself ... think of each race as its own JRPG or Dark Souls boss") — data.js
- Every race id A–F has a family of its own. 32 new SPELL_FAMILIES rows (kind 'signature', `unique: '<race>'`, an
  `identity` {who, adj, look, vibe} block for the library's IDENTITY tab, so no SLB_IDENTITY_KITS entry in ui.js), placed
  right after the `doors` row, each appended to its race's RACE_FAMILIES list. 66 new spell rows (ids `sig*`) live in
  RACE_ABILITIES['<race>'] under a "THE SIGNATURE FAMILY" comment. The six families only one A–F race already carried
  (gambling, feline, internetaddiction, door, dragonabilities, fortunetelling) are now flagged `unique` too (no new rows).
  Sibling threads G–O and P–Z follow the same shape.
- Rules kept: no new statuses, no new engine keys (every row copies the key set of a shipped spell), apCost 1, tier I–II
  apply a status, tier III–IV are finishers (bonusVsStatus, no status). MP is the mana formula's, not the literal `cost`.
- TRAP: `randomTargets` and `splash` CANNOT sit on a literal SPELL_LIBRARY / RACE_ABILITIES row: the boot-time mana pass
  (`_applyManaCostFormula`, ~line 10630) calls spellRandomTargetsOf / spellSplashOf before `SPELL_RIDER_KINDS` is declared
  (TDZ) and data.js dies at load, taking the whole game with it. The riders stay upgrade-only (Blast / Extra Target) and
  the rider example row lives after the pass. The three rows that wanted them use chainProfile / splitBeam / barrage.
- The per-race list (names, kinds, statuses, finishers) is the HTML page delivered in the thread; the VFX pass is next.

## THE UNIQUE FAMILIES, G to O (2026-10-23, mondo: "each race to have at least one spell family that is unique to itself")
- One `kind: 'signature'` SPELL_FAMILIES row per race, `unique: '<race>'` (never borrowable, ★ in the codex), with an `identity` {who, adj, look, vibe} block for the library's IDENTITY tab. It sits FIRST in the race's RACE_FAMILIES list. 37 new families; the 9 single-race families that still said `unique: null` (streetsmarts, drivingskills, jellyfish, apeintelligence, tentacleappendages, unethicalscience, mecha, mothman, galacticfederation) now name their race (ki already did).
- The rows live in RACE_ABILITIES['<race>'] under a "UNIQUE FAMILY (2026-10-23)" comment, ids `go*` (A-F uses `sig*`). 81 new spells. Rules kept: existing statuses and engine keys only; T1/T2 apply the status, T3/T4 are finishers (bonusVsStatus, no status of their own), apCost 1, T4 cooldown 2. Each family is a setup + payoff pair (e.g. Rainspout Soaks → Grotesque Dive bonus vs Soaked, +dmgPerLevel from the perch).
- Moved (agreed with the "Shared spell family exclusions" thread): Excalibur Strike → excalibur (king arthur), Atomic Breath → kaijuatomic (kaiju), Fee Fi Fo Fum (raceTitanStep) → giant, Labyrinth Roar → minotaur. RACE_TREE rung swaps: goatman Labyrinth Roar → Treeline Scream, krampus → Krampus Chains.
- data.js fix: `spellRandomTargetsOf` / `spellSplashOf` read `_spellRiderKindOk` / `_spellRandomMax` (function declarations) instead of the consts, because the boot mana pass prices RACE_ABILITIES rows before those consts exist (a random-target row there threw "Cannot access 'SPELL_RIDER_KINDS' before initialization" and took the whole data.js down).
- Full list per race: the artifact "Unique families G-O" https://claude.ai/artifact/Nvu6Ua8Et28KfQfWzu9mgw (project-files unique-families/). All 85 rows cast on the real board (playwright probe, 2026-10-23). Orb of Light's T2 is "Plasma Loop" (P-Z owns "Solar Flare"); Necromancer's T3 goSoulHarvest is named "The Reaping" (A-F owns the spell name "Soul Harvest").

## THE SHARED FAMILY PASS (2026-10-23, thread "Shared spell family exclusions")
- mondo: "exclude certain spells from a race's spell families, to make them more accurate ... not every one of those needs to be available to everyone with the cosmic spell family". Filled data.js `RACE_SPELL_EXCLUDES` (the 2026-10-17 per-race toggle, was empty): 292 exclusions on 97 races across the shared families. No spell deleted, no families tag changed by this pass, no new rules or statuses.
- Rule of thumb used: a shared spell whose text names one race (Supernova "the orb", Cosmic Sight "The Watcher", Stoneform "the gargoyle", Plaguefield "except the necromancer") or that only fits some races (Lasso cowboy only per mondo, Pepper Spray / Taser / Lockdown off the Old-West sheriff, Gills off the firefighter) is off for the rest. Floor: every race keeps 12+ spells in its pool (door agent was already 12).
- Moves out of shared families were made by the unique-family sibling threads, each changing only that spell's families tag: Excalibur Strike → King Arthur, Atomic Breath → Kaiju, Fee Fi Fo Fum → Giant, Labyrinth Roar → Minotaur (G to O); Heat Vision → Superhero (P to Z). Siren Song and Shadow Realm stayed shared (rungs of the mermaid / demon) and got exclusions instead.
- data.js `flRacePool` (the Adaptable borrow window): a family spell is borrowed only from an owned race that learns it (raceFamilyMemberIds), so borrowing COSMIC from the Watcher never yields the orb's Supernova.
- Everything else already read the excludes: raceFamilyPoolIds → unitSpellPool (builder, forge, isTreeLegal), treeLegalSubset (old saves, the host's online kit check, map.js spawns), buildTreeLegalLoadout (CPU / random), raceDefaultKit, the codex dossier, the POOLS tab ✓ boxes. The per-family list with reasons is the delivery page in /mnt/project-files/shared-families/.

## THE P-Z SIGNATURE FAMILIES (2026-10-23, mondo: "i want each race to have at least one spell family that is unique to itself … think of each race as its own JRPG or Dark Souls boss … dont add any new status effects")
Thread "Unique race families P to Z" (siblings: A-F, G-O, "Shared spell family exclusions"). data.js only.
- Every race whose id starts P-Z has a family with `unique: '<race>'`. 26 NEW rows in SPELL_FAMILIES (inserted after the
  scarecrow row, `kind: 'signature'`, an `identity: {who, adj, look, vibe}` kit for the Spell Library IDENTITY tab), listed
  FIRST in that race's RACE_FAMILIES. The 11 families one P-Z race already carried alone (piracy, politics, football,
  mirrormagic, animalhandling, archery, sentai, vampiricabilties, arachnid, werewolf, zombie) just got `unique: '<race>'`
  (scarecrow already had it) — same convention as the A-F thread.
- 53 new rows, ids `pz*`, in each race's RACE_ABILITIES array (top of the array, under a SIGNATURE comment). Shape: a tier
  I-II SETUP that applies one existing status + a tier III-IV FINISHER with `bonusVsStatus` (×1.5) on it and no status of
  its own (NO SELF-COMBO). apCost 1; tier IV finishers carry cooldownRounds 2. Only existing kinds and riders (debuff,
  damage+chargeToTarget, aoe, line, pull, barrage, cross diamond, multiHit, lifeDrain, leapStrike (+aoeDmgPct splash),
  tackle, dash, summonUnit with summonDef.hitStatus, buff; unholyBonus, sneakBonus, onKillHealPct, ignoresLineOfSight,
  ignoreArmor, bonusHitsPerAdjacentAlly). Bleed got its first real appliers (sharkman, swordfighter).
- Moved: Heat Vision (raceLaserBeam) superheropowers → the superhero's `solarpowered` (antihero/sidekick lose it). NOT moved:
  Siren Song (mermaid's tier I rung) and Shadow Realm (the demon's capstone) — they stay shared.
- Shaman's Spirit Animal reuses summonDef key 'wolf' (no new art).
- The three leapStrike finishers (Down the Chimney, From the Ceiling, Abominable Ambush) keep the existing leap rule: the
  caster must stand higher than the target. Their descs say "From higher ground".
- Checked in a browser: every row cast through GAME.doSpell in the Spell Lab (scratch harness, not committed); finishers
  cast on a clean dummy and on one carrying their status ("⚗ Combo! … ×1.5" in the log).

## THE PVP PLAYTEST TARGETING FIXES (2026-10-23, mondo: "yes go ahead and do fixes for the guest and host findings")
From the 10-23 online PvP playtests (host + guest reports). Netcode and fog went to their own thread. PR #400 targeting
rules kept: a board click PICKS (✓), CONFIRM fires; an out-of-reach enemy is MOVE→CAST / MOVE→ATK.
- MOVE→ATK rows: battle.js `_getAttackApproachTargets(unit, have)` (the attack mirror of `_getSpellApproachTargets`; walk
  only, the farthest landing that reaches, fog-gated from the start tile). hud.js `_hrlgTargetBlades` adds them to the
  attack list; `attackHasReachableTarget` uses the same function, so the list and the lit ATTACK button agree.
- A board click on an out-of-reach enemy now PICKS it (`_boardApproachPick` → `selectTargetFromMenu`) instead of moving
  at once; the second click / CONFIRM walks and hits (`_moveThenAttack` / `_moveThenCast`, unchanged). The prompt reads
  "Move + attack X". An enemy nobody can reach is refused on the FIRST click ("X is out of reach this turn.",
  `_outOfReachLine`) and the mode stays armed.
- GUEST board clicks (online.js armed clickTile): `_ewGuestBoardPick` validates the click against the same rows before
  the guest's local pick. Before, a guest click on an enemy armed the TILE ("CONFIRM → (x,y)") and CONFIRM did nothing.
  A unit spell clicked off its list (empty tile, enemy out of reach) is refused and stays armed. Checked in two browsers
  (friendly room): guest MOVE→ATK hit 196 vs ≈201 shown, guest MOVE→CAST 299 vs ≈310.
- The CONFIRM row follows the pick: HorologeMenu moves its cursor to the ✓ row; Enter in the aim view fires CONFIRM
  (was: cancelled the floating CONFIRM / did nothing on an armed self-cast). An approach pick's CONFIRM reads
  "CONFIRM / MOVE→ATK" (or MOVE→CAST) on two lines.
- Previews from the landing tile: `approachCastFrom(unit,x,y,z)` (battle.js) gives the approach landing; the list's
  damage + hit %, the name-plate forecast (ui.js `getPendingDamagePreview`) and `forecastSpellPlan` (now also when only
  the height changes) all forecast from it. Hydraulic Crush 343 → 395 shown, real hit 393; Railgun MOVE→CAST row was 0.
- Status chips per target (ui.js `_getStatusPreviewLabels(spell, target)`): drops a status the target is immune to /
  absorbs (element affinity or passive) and marks a resisted one "½ CHANCE" (the existing halved apply chance).
- Online pause menu says "MENU · ONLINE · THE MATCH KEEPS GOING" instead of PAUSED.
- Not changed: lists open on the lowest-HP target (existing sort, asked mondo); the row slide-in lag is SwiftShader;
  ENDS TURN tag is intended; heals do get MOVE→CAST rows (the report's Divine Light case was not reproduced).

## FIRE ON OIL / GOO, EVERY SPELL KIND (2026-10-23, mondo: "Does using fireball on a target in goo or oil already make the body of liquid explode? If not it should.")
- Single-target spells (Fireball, Dragon Breath) already blew the whole connected slick (battle.js `_reactFireOil` via
  `triggerTerrainSpellReaction`). Nine fire / lightning spells did not, because their resolvers never called the dispatcher
  or painted the slick away first. Checked in a VS CPU match on the old code: Hellmouth, Solar Flare, Place Bomb, Fire for
  Effect, Nuclear Option, Extinction Event, Infernal Hurl, Wall of Fire and Firefly Swarm left the oil standing (or
  scorched it silently).
- Fix: the dispatcher now also runs off a barrage hit (per struck tile), a splitBeam's primary + split hits, a skyThrow's
  landing tile, a bomb blast (`detonateBomb`, the placer must be alive), and a delayed detonation (state.js, before the
  crater's leaveTerrain). `igniteOilBeforePaint(caster, spell, x, y)` runs at every leaveTerrain / terrainCreate paint
  site, so a slick under a scorch / lava paint goes up before it is covered. No new rules: these resolvers now get ALL the
  existing reactions (conduction, flash-freeze, forest fire, crystal) like every other damage resolver.
- "Goo" = the Black Goo's ooze terrain `swamp` (oil family, liquidFamilyOf 'oil'); the charred slick takes the normal
  3-round terrain timer back to the map's own ground.

## ICE SHATTER: SLAMS + HARD LANDINGS (2026-10-23, mondo picked "Slams + hard landings" on "Which physical abilities should shatter ice into water?")
- battle.js `spellShattersIce(spell)`: physical damage, not ice element, not a wall (terrainCreate / monument), and a
  leapStrike / skyDrop / skySlam kind or any `terrainDeform` crater maker (~25 rows: Ground Slam, Tremor Stomp, Cataclysm
  Stomp, Cosmic Slam, Colossal Crush, Quake, Titan Drop, Seismic Leap, Stone Drop, Predator Drop ...). Runs at the top of
  `triggerTerrainSpellReaction`: only the STRUCK ice tiles become shallow `water` (`shatterIceAt`), on the 3-round timer.
  skyDrop / skySlam / leapStrike now call the dispatcher (they never did), so their ice/water/fire reactions work too.
- Hard landing: state.js `applyFallDamage` with `opts.byEnemy` (knockbacks, Big Kick off a ledge, trapdoors, groundings)
  cracks the ice under the body after the damage. `resolveForcedSlide` checks `hardLandingCracksIce` first and passes
  noGlide to the chain AND its forecast, so the body stays in the hole. A sky throw from fall-damage height (carry 4, so
  any flat throw) onto ice cracks it, no glide, forecast matches. Own jumps / walks off a ledge leave ice whole.
- Checked in a browser (VS CPU, Football Stadium): Ground Slam 3 tiles, Tremor Stomp 3, Colossal Crush 1, Infernal Hurl
  + To the Moon landings 1, a byEnemy fall 1; Glacial Slam and Sasquatch Smash left the ice whole.

## THE HAND PAN LEAVES THE TWO-SHOT (2026-10-23, mondo: "panning the camera moves the camera angle real low to the ground as i pan across the map") — battle.js, state.js
- Cause: a hand pan is `camera.snap({x, y, zoom})`; snap never left a menu two-shot (target pick, quick list, the attack hold after a basic attack), so the pan slid the shot's low pitch (MENU_CAM_TILT 50-66), its close zoom and its raised focal (the pair's chest) across the whole map. moveTo already leaves the shot for every programmatic move ("a pan ... never inherits the low angle") — the hand pan was the gap. Plain tactical pans on Shasta / Giza arenas and full Mount Shasta were already level (browser probe); THE CLEAR BOARD crane and THE NEAR BODY rise only ever lift the eye and are untouched.
- Fix: `camera._leaveMenuShotForPan()` (battle.js, beside snap): drops `_menuShot` + `_menuAtk` (and its ease-out timer), takes back the shot's home tilt + zoom, keeps the yaw the player is looking along, latches the pan focal at `_naturalElevAt` (the board under the focal). Called by state.js `_panBegin` (left-drag pan, before it reads `_panStartZoom`) and by snap for any other hand pan (edge pan, one-finger touch). A right-drag orbit already adopts the player's own angle (snap with tilt/yaw). Viewer-local camera: nothing to relay.

## HOMOSAPIEN OUT, DOOR AGENT DEFAULT (2026-10-23, mondo)
mondo: "take homosapien out of the game anyway since it is so plain. door agent should be the default for story mode
and create a character should be accessed through door agent as well instead of homosapien."
- `homosapien` is out of data.js `AVAILABLE_RACES` and `ACCT_STARTER_UNITS` (and the server.js fallback literals), so it
  is gone from the roster wall, the shop, the codex, random/CPU/Balance Lab/AI-training pools, Mystery Dungeon and the
  underworld walker pool. Its data rows (stats, spells, finisher, lore, the 3D model) stay: the werewolf's day form wears
  the Homosapien model, and old saves still draw.
- `DEFAULT_IDENTITY.race`, every `|| 'homosapien'` fallback, `MD_STARTER_RACES`, the Challenge creator's default and the
  mirror's look (`hqPartyOfficer` look mode, map.js `_hqAvatar`) are the DOOR Agent now.
- The creator: the forge's GEAR → CHARACTER CREATOR works on a DOOR Agent slot (not Homosapien); the mirror / intake stage
  shows the DOOR Agent. state.js `ensurePartyMeta` repair and the match preload keep / warm a DOOR Agent look too.
- Old saved teams are never touched: state.js `teamRemovedRaces(races)` (a race RACE_PROFILES knows that AVAILABLE_RACES
  dropped) flags them — REMOVED on the forge slot, a note on the archive card, "Out of the game" on the squad desk — and they
  cannot start / deploy until the unit is swapped out. The host refuses a guest sheet with one (online.js).
- Left as is (flagged to mondo): the Disaster City harbour angler NPC still stands as a plain human (it can't be fought).

## FLANKED / BACKSTAB SHOW THEIR MULTIPLIER (2026-10-23, mondo: "flanked and backstab do bonus damage right? they should have the amount next to their floating number like "Flanked X1.25"") — battle.js, three-renderer.js
- They do: basic attacks only, battle.js `FACING_BACK_DMG_MULT` 1.25 (back arc, also can't be dodged) and `FACING_SIDE_DMG_MULT` 1.10
  (side arc), via `getFacingDamageMult`. Spells get no facing bonus, except the door rear rider (`state._doorRearCast`, priced as a back hit).
- doAttack's pops now read `BACKSTAB ×1.25` (kind `crit`) and `FLANKED ×1.1` (kind `counter`), built from `_facingMult`, so a retune shows the
  new number. The door rear rider's pop reads `🚪 REAR ×1.25`. Kinds, colours and the UI Maker look are unchanged; the UI Maker float preview
  samples (FLOAT_PREV_BEATS / FLOAT_KIND_SAMPLE) match. Online: the pops ride the existing floating-text relay.
- Browser-checked in a VS-CPU Arena match: /mnt/project-files/flank-backstab/flanked_backstab_multiplier.jpg.

## WEAK RACES II — Grey, Djinn, Gnome, Ringmaster (2026-10-23, mondo picked the three fixes)
- Report: hand match vs CPU + Balance Lab (all four on one team won 4.7%), https://claude.ai/artifact/P159GAtjGKrTGzquEvyVgA
- CPU (ai.js): summons score by their life damage (bite = summonDef.dmg + ½ spell power × 1+hits/2 rounds, max 4 ×
  reach × 0.7, + 20/hit body) with the old flat 150/70 as the floor; traps (placeTrap) and step mines (deployObject
  detonateOnStep) score by `_trapHitValue` (P an enemy steps on it × the hit + its status) with the old flat as floor;
  `statusSetupValue` credits a near-certain payoff (teammate with ap left this round, or the caster's own next turn
  from a zone that lasts ≥2 rounds) at AI_TUNE.statusSetupSure 0.6 (NOT a trained key; the trained 0.115 stays for
  the rest). `_aiStatusBlocked`: ccDenialValue / statusSetupValue give 0 for a status the target's passive blocks.
- Spells (data.js): Ankle Biter 80→110 + Garden Shears 130→170, both spellType anomaly (gnome STAB); Scrap Mine blast
  100→140 (goblin shares it); Tissue Sample range 2→4.
- Stats: Grey SPD 48→60 (walks 2), Djinn HP 324→480. Nothing else.

## ONE ROUND = ONE TURN + CUBE VS KEYS REPORT FIXES (2026-10-23, mondo: "a 1 round status means the unit has to actually have at least 1 turn with that status effect. but not take aim ... root definitely needs to not go away just because the round ends")
- Report: https://claude.ai/artifact/S3RPjrYtgW8wQvSPFEweZX (Cube vs Keys matchup). Key carrying unchanged: any unit on
  any team carries a Key (mondo).
- battle.js `_statusLandsAfterTurn(u)`: during a blitz action phase, a unit whose turn this round is active, done
  (ap 0), skipped (stun/freeze) or already taken (`u._turnRound === state.round`, stamped in maybeAdvanceTurn) has
  already used this round. A status landing on it (`applyStatusPayload` → `_markStatusFresh`, `u._stFresh[key] =
  round`) or a stat stage (`statStageMods` row `fr: round`) skips THIS round's end-of-round tick in
  `_tickAllStatusDurations`, so it is still on for the unit's next turn. A status that lands before the unit acts
  ticks as before. End-of-round effects (no active unit) and Strike RT are unchanged. Take Aim is a delayed mark,
  not a status: still lands at end of round.
- Side effects (flagged to mondo): a self-buff cast in the unit's own turn (Camouflage, etc.) now lasts through its
  next turn; a 1-round stun/freeze that lands after the target acted costs it the next turn.
- Encore: kind meta `encore: { minRange: 1, allyOnly, fogExempt }` (was self-cast, so the UI armed "Self Target" and
  the engine refused self = never castable). `spellTargetUsableOn`: another ally that has finished (ap 0) and has
  not had Encore this round. hud.js spellTargetMode 'Single Ally'. Checked in a browser: cast on Bigfoot, it acted
  again.
- three-renderer `_refreshHoverOnCameraMove`: a list / click pick (`pendingTarget` without `viaHover`) is never
  re-aimed by the camera swinging under a still mouse (Psychic Beam CONFIRM named a tile).
- clickTile fog gate lets Far Sight (`remoteView`) pick a fogged lit tile (its whole job; the kind is fogExempt).
- hud.js Attack list: the enemy Cube inside reach but with terrain in the way / out of team sight lists greyed
  with "TERRAIN IN THE WAY" / "OUT OF SIGHT" instead of being missing. Non-portrait rows read "HP 55% · 1t".

## THE HIDDEN KEYS + KEYS VS KEYS FIXES (UNDONE 2026-10-28 except the fixes, see THE KEYS SHOWN AGAIN) (2026-10-23, mondo: an enemy dropping or picking up a Key must not show for the other side; the Inspect may show but must look the same found or not; the Key animation only for the searcher)
- Report: https://claude.ai/artifact/8siq43vA1JeYEszPMUpMyk (Keys vs Keys matchup).
- map.js `keysHiddenFor(p)`: this screen must not show team p's Keys (online: the other seat; VS CPU / hotseat: the
  team not at the controls; dev auto-sim and match end show all). `shownCarriedKeys(p)` (count or null),
  `addKeyLog(msg, p)` (an `addLog` entry flagged `kp`, printed only on team p's screen; battle.js `_logKeyHidden`,
  used by `_logVisible`, hud.js CombatLog and ui.js renderLog / combat-log builder, fog or no fog).
- `_inspectFootprintAt`: "X inspects N tiles around Y." is public; "Inspection uncovers…" / "Nothing found here." are
  addKeyLog. The celebration is `_presentKeyFind` → `_playKeyFindLocal` (float, KEY SECURED banner, close-up, chime,
  shake) under `window._ewNoRelay`, so online.js relays none of it; a guest unit's find goes to the guest alone as
  relay `key-private`. `addEntropy(..., 'hourglass')` skips the flying orbs when hidden.
- Drops (`dropHourglassesFromUnit`): only the dropper's team sees the Keys on the ground and the drop line.
  Rustle / steal lines stay public (both sides are in it).
- Hidden on the other side: scoreboard count shows "?/N" (hud + ui sidebar), its Keys left out of the shown ARENA
  score (the round-limit decision still counts them), KEY+ chip, plate badge, "Carrying ×N" / Key Charge status rows,
  the Key Charge MOV on cards. NOT hidden (rules, flagged to mondo): the forecast vs a carrier includes Key Charge,
  its move range includes the MOV bonus, the Entropy gauge rises 2 per Key, the state-sync still carries the data.
- Far Sight: no ally list / pre-pick (`_tileOnlyKinds` + setTool free aim skip `remoteView`), "FAR SIGHT — CLICK A
  TILE TO SEARCH", desc says "4 steps" and "the turn's one cast". clickTile fog gate also passes any fogExempt
  tile-targeted kind.
- hud.js CONFIRM chip reads "MOVE→CAST · <pick>" when the spell pick walks first (cached per pick).
- battle.js `_ewGuestBoardPick`: a guest tile cast (Gravity Well) outside reach with no approach step, or on a fogged
  tile its kind can't cast into, is refused with the solo click's line (was armed, then the host said out of range).
- `_forecastConduction`: the damage kind's forecast adds the lightning-water reaction (`_reactLightningWater` math,
  allies included) with a "⚡ WATER CONDUCTS" badge. Checked: forecast 476 / 220 = the cast.

## ANTI-GRAVITY: big bodies move in Low Gravity (2026-10-23)
mondo: "i think there's like an antigravity zone spell ... that should make it to where usually immovable enemies (the big
ones) are able to be displaced like any other enemy. see if there are maybe a couple other spells that could be applied to,
or maybe its a status effect already".
- The spell is Low Gravity (`sharedLowGravity`, a 3×3 `gravityField: 'weak'` zone, 3 rounds; martian / grey / annunaki
  pools). No status made a body weightless before; no new status was added.
- battle.js `isUnitWeightless(unit, spell)` / `getUnitDisplaceWeightClass(unit, spell)`: a body standing in a weak gravity
  field, or moved by a spell row flagged `weightless: true`, counts as MEDIUM for displacement (heavy loses the -1, colossal
  is no longer 0). `getUnitPushDistance(unit, dist, kind, spell)` reads it, so every push / pull / fling / bomb knock /
  bowling pin / storm fling / gust lane / rising-ground shove and every forecast agree. Fall damage, crash-through power and
  the codex class keep the real weight. Anchoring passives (Windborne, Mountainborn) and Clash still hold.
- `weightless: true` rows: Telekinetic Slam (pull) and Black Hole (aoePull). Lift-and-throw (skyThrow) already grabbed any
  weight, so nothing changed there.
- Not done (flagged): Levitating (Fairy Dust etc.) does NOT make a body weightless, since it is only ever an ally buff and it
  would have made your own big units easier for the enemy to shove. Gravity Well (tier 1) stays weight-bound.

### MOVE TOWARDS counts the hop tiles (2026-10-23)
mondo: "clicking move towards on a tile outside of my spell range still only moves me one tile at a time ... It needs
to move me to the edge of my range closest to the tile i clicked". battle.js `findMoveTowardsTile` (tile quick menu's
Move towards, Move-mode click past the range, its hover ghost) skipped every getMoveTiles tile flagged `_jump`, and
getMoveTiles flags every tile whose walk includes a hop (a step of more than one level: off a wall top, down a pyramid
side) plus every tile past it. Those tiles are lit and a Move click walks to them with the same doMove, so a unit on a
ledge could only shuffle along it (Pyramids of Giza wall top: G3 clicked from F7 → G7, one tile, while G5 below was
lit), or got no Move towards at all. Now only `_takeoff` tiles are skipped; the standalone leap (getJumpTiles/doJump)
stays its own verb. Browser-proved on Pyramids of Giza: same click now lands on G5. Screenshot
/mnt/project-files/move-towards-ledge/. The unit-target chase (hud.js `_bestTowardStep`) already counted them.
findSpellApproachTile / _findSelfNovaApproachTile (MOVE→CAST) still skip hop tiles — left as they were.

Follow-up (same day, mondo's same-kind-gaps rule): the move-then-act finders now count hop tiles too — findSpellApproachTile
(MOVE→CAST rows, board pick, quick menus), _findSelfNovaApproachTile, TargetQuery.hasReachableTarget (the Abilities
button), findInspectApproachTile and findCaptureDoorApproachTile skip only `_takeoff`. findAttackApproachTile already
counted them. Browser-proved: Sedan on the Pyramids wall top, enemy on H8 below → before "No targets in range", after a
MOVE→CAST row that steps off the wall to G7 and lands the punch. Mystery Dungeon companion steps (_mdGuardRegroup,
_mdStepToward) and ai.js left as they were.

## DROWNING NEEDS DEEP WATER (2026-10-23, mondo: "loch ness used long neck and it caused drowning on one of my units, but my unit wasnt in deep water ... Make it to where drowning can only take place in deep water")
Cause: Long Neck (`goLongNeck`, Loch Ness signature) carried `statusEffects: [{ id: 'drowning' }]`, and the pull branch
applied it wherever the victim landed. The tick already cleared it off dry land at round end, but until then the unit
wore DRW (-1 MOV, Out of the Loch's bonus). Fix: map.js `unitCanDrownHere(unit)` (deep_water tile, grounded, not
`unitIsDeepWaterAdapted`) gates every Drowning status in battle.js `applyStatusPayload` (a quiet skip); ai.js
`_mirrorStatusValue` mirrors it. Long Neck keeps its damage + 2-tile pull; it drowns only a victim that ends up in deep
water. Audit: Long Neck is the only spell row that applies Drowning; Walk the Plank / Great Flood / Enlil's Deluge drown
through the deep-water terrain (resolveTileArrival / TERRAIN_RULES.deep_water), which already checked the tile.
Swimmers (siren, kraken, Loch Ness, snorkel...) no longer take a spell's Drowning in deep water either, matching the
terrain rule. Browser before/after: /mnt/project-files/drowning/.

## ONE TILE A SCAN + RANDOM KEYS — 2026-10-23 (mondo)
mondo: "inspect shouldnt grow with vision, it should only be 1 tile at a time for everyone. But some units can still
have longer inspect ranges. Also let's make the keys completely random on the whole board, not any rules like have to
be 2 tiles apart."
- state.js `getInspectTileCount` returns 1 (was the unit's VISION), so battle.js `getInspectFootprint` is the picked
  tile alone, for Inspect and Far Sight alike. REACH is untouched: `getEffectiveInspect` = RACE_KITS `inspect` (2 for
  Android, Shadow Entity, Reptilian, Annunaki, Men in Black, Marksman, Door Agent, Halfdemon, Vampire, Cosmic Wraith,
  Chosen One, Ghoul, Barbarella, Quarterback, Robinhood, Symbiote), the scanner trait (+1), gear `inspectBonus`, and
  Far Sight's remote search (4). No new reach was added.
- battle.js `randomizeSharedObjectives`: Keys go to an evenly shuffled pick (`_shuffleKeySpots`, engineRng) over the
  WHOLE board. REMOVED: the 2-tile Key spacing (`canPlaceHourglassAt`) and the centre-columns-first pass. KEPT:
  passable tile, reachable by walking from the units' start tiles (the 10-06 flood, which also skips the Cube tiles),
  no unit on it, one Key per tile, the per-floor split when a layout has floors. The round-10 top-up
  (`spawnPeriodicHourglasses`, non-fixed pools only) is whole-board too.
- ai.js search map: every open unscanned tile is equally likely now (no spacing exclusion around seen Keys, no centre
  prior; `searchCenterPrior_v1` stays in the registry but has no effect), and the expected find of one Inspect is one tile.
- Tutorial: the Arena lesson's KEY step and WIN BY KEYS' INSPECT step re-worded; the last Key is now "on a tile next to
  the marked tile".

## CUBE VS KEYS FIXES, PART 2 (2026-10-23)
- Report: https://claude.ai/artifact/S3RPjrYtgW8wQvSPFEweZX. PR #449 took the first batch; this is the rest that was not
  owned by the shared-bugs thread.
- **Refund camera (online).** battle.js softResetToUnit called the bare `armActionCamSettle`, so online.js's
  `window._armActionCamSettle` wrapper (the `cam-action-settle` relay) never ran: the guest replayed every action shot
  and then sat in the target close-up, which a press refund made last the whole turn. Both hold branches now call the
  window copy; the full return and the TPS return (the host's own unit) send the guest the settle alone
  (`window._ewRelayCamSettle`). Checked offline (the settle + relay fire on CPU actions, no errors), not in a two-seat match.
- **THE SEARCH MAP.** `state.scannedByPlayer` was wiped 0.7 s after every Inspect (the scan fade), so nothing remembered
  which tiles a team searched (ai.js's "own scanned tiles" reads it too and has always seen it empty; left alone, flagged).
  New `state.searchedByPlayer[p]`: every tile p's Inspect / Far Sight footprint covered (`_inspectFootprintAt`). A tile
  a unit dies on (or a capture door / EXIT takes it) is forgotten for both sides (`forgetSearchedTile`, every time, Keys or
  not, so it tells nobody a carrier fell). While the viewer's own unit aims Inspect or Far Sight: the hovered tile's real
  footprint (getInspectFootprint; one tile since PR #467) is a solid teal plate (`searchFoot`, dims the reach),
  the team's searched tiles a grey wash (`searchMap`). battle.js `syncSearchMap` (hover: updateHoveredTarget; mode:
  ui.js renderBoard). Online: the host sends the guest only the guest's own set (online.js `_guestTrapFilter`).
- "+N KEY" floats as `pickup` (gold) instead of `streak` (hit-word red).
- Already fixed on main before this pass: the two seats' load-screen / CASE CLOSED year (seeded by the match id).
- (The round-10 Key top-up that cleared the searched tiles is gone, see below.)

## CPU SEARCH MEMORY + NO KEY TOP-UP (2026-10-23, mondo)
mondo: "yes it should remember, and lets also get rid of the round 10 key top up".
- ai.js reads the searched tiles through `_aiSearched(st, p)` = `state.searchedByPlayer[p]` (was scannedByPlayer, always
  empty after the scan fade): the search map, the fallback Inspect pick, the Keys objective pool, Far Sight's pick and
  the win-clock cache key.
- REMOVED: `spawnPeriodicHourglasses` and its round-10 call. It never reshuffled Keys; it ADDED up to 3 new Keys (at most
  6 loose on the ground) once, at round 10, only in a mode without a fixed Key pool. Arena pins keySpawnCount 5 /
  keysToWin 5 (fixedPool), so it never ran in Arena; it could only run in a match with no multiplayer mode set.

## WEAK RACES 2: Symbiote, Bunny Girl, Bee Queen, Wizard (2026-10-23, mondo "sure lets do both")
Study + lab report: https://claude.ai/artifact/DEtZE2J3xJzUBSXzN4Hp9L (screenshots in project files weak-races-2/).
Lab, all four on one team vs random CPU teams (code at PR #442): baseline 17.1% (245 games), spells only 13.9%
(244), spells + these stats 33.6% (304). mondo picked both.
- Spells (data.js): A Thousand Stings 10x17 -> 10x30, Dead Man's Hand 4x34 -> 4x50, Magic Missile 5x27 -> 5x40.
  calcDamageResolution takes armour off EVERY hit (35% soak floor), so multi-hit rows did far less than one hit of the
  same total. Static Shock Jammed 1 -> 2 rounds, Misdirection Blind 1 -> 2 rounds: a 1-round status ticks off at the
  end of the round it was cast in, so a caster who acts after its target wasted it. Static Shock (lightning family)
  and Misdirection (trickery family) change for every race that rolls them.
- Stats (RACE_BASE_STATS): Symbiote HP 690 -> 900, SPD 79 -> 90 (move 2 -> 3); Bunny Girl HP 666 -> 900; Bee Queen
  HP 867 -> 1000, MP 146 -> 220; Wizard HP 349 -> 450, DEF 15 -> 40, SPD 23 -> 50 (move 1 -> 2).

## WIPEOUT vs CUBE MATCHUP FIXES (2026-10-23, mondo: "fix the most prominent individual issues found in each one")
Report: https://claude.ai/artifact/CWTojTHQLaLz8Jz6tqAeKF (copy /mnt/project-files/matchup-wipeout-vs-cube/). Existing rules only.
- MARTYR'S TALISMAN IN THE FORECAST (top issue: rows said lethal, the target lived at 1 HP four times). battle.js
  `talismanReady(u)` (gear hook `surviveLethalOnce`, not `_talismanSpent`); `forecastHitOnUnit` caps a lethal hit at
  hp-1 and returns `talisman`; `forecastSpellPlan` / `forecastBanePlan` tag the unit 'talisman' and spend the save once
  per plan (`_fcTalismanUsed`, cleared at start and in finally) so a second hit in the same plan is lethal again;
  `forecastBasicAttack` returns `endures`. ui.js `predictDamageToUnit(..., out)` fills `out.endures` / `out.blocked`;
  `_FC_TAG_TEXT.talisman` = "✨ TALISMAN · SURVIVES AT 1"; fallback intent badges show it instead of LETHAL. hud.js target
  rows add "✨ SURVIVES AT 1" to the note and show PROTECTED / OUT OF REACH / GUARDED in place of a blank number.
- ATTACK LIT WITH NOTHING TO HIT: state.js `getActionPanelCache` uses `_getAttackValidTargets(unit, {combatOnly:true})`
  when the list exists; turret / deployed / seed fallbacks only without it; a building in reach no longer lights ATTACK
  (buildings are not basic-attack targets). The Downtown case was already fixed by PR #444.
- DOWNTOWN TOWER CAMERA: the tower is a GLB prop (`nr_building:building_5`) standing on 9-high columns, so grid columns
  missed its upper storeys. three-renderer.js `tallSceneryTopAt(wx, wz)` reads room-piece boxes 1-10 tiles across that
  rise 1.5+ tiles over their column (re-read every 3 s for the first 60 s); three-camera.js `_solidGroundYWorld` and
  battle.js `_menuCamOccl` treat them as solid to the roof. `_menuShotPose` also tries two very wide swings (+56/+84 over
  the normal swing, cost 1.2, drops ≤16) only while every nearer pose is blocked. `_menuCamSolve` walks the sight lines
  from the eye AFTER THE CLEAR FRAME slide (three-camera.js sync slides the eye by fa.cx/fa.cy at the focal's depth): from
  the unslid eye a caster against the tower's corner read as clear. Before/after: /mnt/project-files/wipeout-vs-cube-fixes/.
- METEOR COOLDOWN: Meteor, Requiem and Tidal Slam say "Cooldown: 2 rounds" but carried none: `_applyManaCostFormula`
  priced them under 80 before `_applyBaselineCooldowns` (cost ≥ 80 → 2) ran, then the tier ladder set 100. Pinned
  `cooldownRounds: 2` on the three rows (every "Cooldown: N rounds" text now matches its row).
- Small: element-terrain "Air" callout/log reads "IN THE AIR" / "up in the open air"; squad desk text names the
  4v4/5v5 switch; online.js `_spellCycleTargets` / `_spellCycleIndex` are guest-local (skip list + `_guestUIKeys`).
- Not reproduced / left: Stampede on a flyer (path may not have crossed it), Tornado triple fling, Overwatch, flyer over a
  ground unit (existing rule), height counting as range (rule), Meteor MOVE→CAST farthest tile (existing rule), Ki Wave
  rows. Already fixed on main: Cube row "HP NN%" (U01), 1-round statuses (U05). The shared-bugs thread (PR #470) owns the
  round skip, MOVE→CAST numbers, CONFIRM chip, sliding rows, labels over the HUD, guest timer result.

## THE CRATER FLOOR + THE FISSURE GAP (2026-10-24, mondo: "i want the max tiles any spell can sink the ground to be 2, except for fissure which should actually make a gap in the map all the way down to the bottom lava layer, dont use that texture that it uses now")
- **Crater floor:** data.js `TERRAIN_RESHAPE_CONFIG.spellSinkMax: 2`. battle.js `spellSinkFloorAt(x, y, curH)` = the
  cell's height before the first spell deformed it (`state.deformedTiles[k]`, else its current/base height) minus 2,
  never under `minHeight`. `applyTerrainDeform` clamps every negative delta to that floor, so stacked Meteors / Ground
  Slams / Flat Earth stop 2 below the original ground. The preview (pushChange) uses the same floor. Build/Dig (the
  block actions) do not go through applyTerrainDeform and are untouched.
- **Fissure gap:** SHARED_FISSURE carries `terrainDeform: { toBed: true }` (still `kind: terrainCreate`,
  `terrainType: 'lava'`, 3 tiles, orientable, Stagger). `toBed` drops each cell to `minHeight` (the bed: lava on
  MF_DELTA_STRATA boards), records the removed blocks in the row's `cut`, skips the surface paint, and marks
  `state.gapTiles[k]` + `state.paintedTiles[k]`. The 3-round timer carries `cut`; map.js revertTerrainTimer rebuilds the
  column from it and clears gapTiles, so the gap closes like every other battle terrain change (until mondo picks the
  permanent-height rule). Units on a cut cell ride down with the existing deform rule.
- **Field-arena look:** three-renderer.js `_fieldDeformPlan(..., gap)` makes gap cells a flat-bottomed slot instead of
  a bowl (`isGap`), `_fieldDeformMesh` snaps vertices within `FIELD_GAP_SNAP` (0.34 tile) onto the gap edge for a
  straight cut, and `_fieldStrataBuild` adds inward rock faces on every gap side whose neighbour isn't a gap. The lava
  bottom is the existing painted-tile lava skin + glow. Kill-switch `window.EW_NO_FIELD_GAP`. Plain state keys ride
  the state-sync, so the guest sees the same gap.

## PvP playtest fixes (2026-10-24, thread "PvP playtest")

From the 10-24 two-seat playtest (report https://claude.ai/artifact/6eCz5YkErHgFJVkhBY1tAE), mondo's answers:
- **Guest timeouts are logged:** battle.js `_shotClockExpired` on the GUEST no longer writes its own line (the host's next
  snapshot replaced it, so it never showed); the guest's END TURN carries `timeout: true` (`state._shotClockTimeoutEnd`)
  and online.js `'triggerEndTurn'` writes "⏱ Shot clock! X's turn ends automatically." + the TIME! float on the host.
- **The podium never reaches the guest:** `_stageVictoryPodium` revives and lines up the viewer's cast in place; the host
  kept broadcasting, so the guest's result said "4 v 3 STANDING" and its Export Last Match had a dead unit alive.
  `window._ewPodiumStaged()` → online.js `_broadcastState` sends nothing while the podium is up. The host FIRST flushes
  the final snapshot (`window._ewFlushFinalSync`, called at the top of the podium staging, cancels the 50 ms throttle):
  without it the guest never got `winner` and sat on the last round with no result screen.
- **The press line reaches the guest:** `_pressDialogueLine(res)` (the "+2 AP — Free action!" dialogue) is relayed as
  `'press-feedback'` (online.js wraps `_showPressFeedback`); fogged presses stay silent. The press itself shows only AFTER
  the hit (mondo: a pre-hit +2 would give away the crit).
- **The damage chip:** hud.js `_hrlgDmgChip` — colour only, so it never spills out of the target row: green when even the
  low roll kills, gold with "?" when only the high roll does, red otherwise. ui.js `predictDamageToUnit` out carries
  `heal`, `min`, `max`. (A first try with LETHAL / MAY KILL words and the absorb heal on the chip overflowed the row.)
- Checked, already right: an absorbed element part blocks the press (`_pressHitInfo`), and the row's red ! was the absorb
  warning; walking off a drop already tints the tile hazard, badges the move ghost with the damage and labels the tile
  menu "Move here (−N HP)".

## SAND WALKS LIKE GROUND + THE GROUND CHIPS (2026-10-24)
mondo: "Just take away the mov-2 property from desert, that is what was causing my ice queen bug where it could only
jump ... There was nothing to indicate that the sand was affecting me negatively. That needs to show just like the
attack and defense stages show."
- data.js TERRAIN_RULES.desert.moveCost 2 → 1. Confirmed the bug in the browser on The Bermuda Triangle Arena (all sand):
  Ice Queen is MOV 1, so with sand at 2 per tile she had 0 walk tiles (only Jump); now 2. Other units on that board went
  from 3-5 tiles to 19-30. Desert still heals ×0.7 and still counts as earth home ground; desert-adapted races keep their
  full-heal on it. unitIsDesertAdapted's move line in getTerrainMoveCost is now a no-op (kept).
- Movement on terrain was never a stat change: getTerrainMoveCost charges a cost per tile ENTERED (forest/mountain/rocks/
  oil/bog 2, lava 3 ...), which is why no MOV number ever moved. state.js getTerrainStatChips (beside getWeatherStatChips)
  now shows it: "<glyph> MOV COST N" (red) while the body stands on ground that costs it more than 1 (the engine's own
  read for THIS body: boots, wings, adaptations, a cost-adding object), plus the race's terrain affinity stats
  (getTerrainPreferenceModifier, e.g. Anubis/Fallen Angel on sand "🏜 ATK+8", "🏜 M ATK+5", green), which were also
  invisible. A flyer up in the air gets no cost chip (the engine walks it through air at 1). Shown in the unit card /
  quick-menu chips (hud.js _hrlgStatusChips) and the nameplate badge row (three-renderer _plateStatusBadgesHtml; the
  badge serial hashes the chip keys so a repaint of the ground under a still unit refreshes it). Client-side read of
  synced state: the guest sees the same chips.
- Screens: /mnt/project-files/sand-move/.

## THE TIME COP (2026-10-24, mondo)
mondo: "a unit that was a time cop, and depending on their ability they use they are either a sheriff, a cop, or a
future cop (the ones in cyberpunk city)". Proposal shown first, then he picked "look stays until next ability".
- Race `time cop` (male only). Stats, reach 2, ranged class, physique, Point Blank passive, price and the Book 'Em
  finisher are all the Police Officer's. RACE_ABILITIES is empty; no signature family (flagged to mondo).
  Not placed in story / capture (no biomes, no POINT_OF_ENTRY); lore falls back to "File pending".
- Families: policetraining, cowboyskills, marksmanship, cyberpunkweapons, advancedtechnology. RACE_TREE, two picks
  a rung: Nightstick / Taser Bolt, Taser / Long Rifle, Slap Leather / Classified Weapon, High Noon / Railgun.
- Looks: sprites.js TIME_COP_LOOKS {cop, sheriff, future} are the _spriteOverride keys; RACE_MODELS_3D['time cop'].male
  is the black police officer rig with overrideForms → itself, the western_sherrif rig, the cyberpunk_police_officer rig.
  battle.js UNIT_ANIM_OVERRIDES['time cop'].castSprite picks by the cast spell's family (policetraining = cop,
  cowboyskills/marksmanship = sheriff, cyberpunkweapons/advancedtechnology = future); any other family returns null
  and leaves the look. No revertAfter, so the look persists through moves and basic attacks. Online: rides the synced
  `_spriteOverride` like the honda civic; decoys copy it.
- 2026-10-27 (mondo: "make the time cop show as the future cop by default to separate it from the police officer"):
  RACE_MODELS_3D['time cop'].male is now the cyberpunk_police_officer rig (overrideForms → the black police officer
  rig, the sheriff rig, itself). The 2D sprite / portrait stay the police officer png (no future-cop 2D art on R2).

## THE UFO FORM (2026-10-27, mondo)
mondo: "can we make the grey or any other race with ufo spell family turn into the UFO similar to how the time cop
transforms with his spells ... treat the UFO like the seraphim or occulus where you give it custom animations like
spinning and stuff for the spells". Looks only, no rule touched.
- Who: every race whose RACE_FAMILIES lists 'ufo' (today the grey and the martian). battle.js wires them after the
  UNIT_ANIM_OVERRIDES literal (a race with its own override row keeps it): a cast from the 'ufo' family sets
  `_spriteOverride` to sprites.js ufoFormLook (the race's 2D sprite + '#ufo'); a cast from any other family sets the
  plain sprite url back (only when an override is on). No revertAfter: like the Time Cop the look stays until the next
  cast. map.js resetUnitPowerState drops it on respawn.
- Model: sprites.js UFO_FORM_3D = the Triangle UFO already on R2 (Assets/misc, the horizon patrol / VFX saucer),
  heightRatio 0.6 (about a tile across), transformFx (the shock ring) on both swaps. wireUfoForm adds overrideForms
  {base url → the race def, base url#ufo → UFO_FORM_3D} to every gender def of the race.
- three-renderer.js procRig 'ufoCraft' (THE PROCEDURAL RIGS): ewUfoRoot (hover offset + tilt) › ewUfoSpin (hull
  spin) › ewUfoNose (the file's point is on −Z, turned to +Z) › mesh, plus ewUfoBeam (the tractor beam, an additive
  cone hung after the twins by _procRigAttachBeam via _procRigAttachEye) and a hidden zero-area floor point
  UFO_HOVER below the hull so the measured height includes the hover. _procRigFor now also reads overrideForms defs.
  Clips in _UFO_POSES (≤ 1.4 s casts): idle (slow turn, bob), walk (point dipped, faster spin), cast (rear, spin,
  dip, beam flash), castAOE (climb, 3 spins, wide beam, drop), castUltimate (barrel roll, 4 spins), castSupport,
  castSkyward (Abduction Beam: climbs high, long beam), castCurse (Implant: point dips, beam pulses ×3), castPsychic
  (wobbling top), castChannel, castDrain, castKinetic (Low Gravity: lift, drive down, beam slams), castMelee (ram),
  hit (jolt), death (sputter, spin down, drop tilted).
- Renderer fixes the swap needed (shared, all units): a cast that swaps the body can start its clip on the old rig a
  frame before the rebuild (`_castRig` in _syncCombatAnims replays it on the new rig), and a structural rebuild that
  keeps the rig used to drop the playing one-shot (rig.shotEntry carries it), which cut casts to idle mid-clip.
- A CRAFT FOR EACH ALIEN (same day, mondo: "can we use different ufos for different aliens? like a saucer for the
  grey, the martian can keep the triangle, maybe the bligblog can use a spaceship if there is one in the game
  already"). sprites.js UFO_CRAFT_BY_RACE picks the race's craft (a race not listed flies UFO_FORM_3D, the triangle).
  bligblog → UFO_SHIP_3D: the game's spaceship (Assets/misc/Meshy_AI_spaceship_0727195825_texture.glb, the space
  decor's; `#ufoship` on the url keeps the rigged copy apart from the decor's), heightRatio 0.49 (the same scale as
  the triangle: ~1 tile nose to tail), procRig 'shipCraft' = _ufoBuild(root, π/2, roll): the same hinges, beam and
  _UFO_POSES, the nose (the narrow end, on −X in the file) turned to +Z, and every `sp` turned round the nose instead
  of the vertical (spins become barrel rolls, so the nose stays on the target); _UFO_SHIP_POSES replaces only idle and
  walk (a small roll sway, no endless roll). Checked in a VS CPU match: the nose points at the Probe's target, the
  Grey still flies the triangle. The grey keeps the triangle until mondo makes a saucer WITHOUT landing gear: the only
  saucer on R2 (Assets/misc/Meshy_AI_flying_saucer_with_landing_gear_0912231529_texture.glb, the space decor's
  saucer_lg) has its legs in the same mesh.
- THE GREY'S SAUCER (same day): mondo made it, R2 Assets/misc/UFO_Low_Poly.fbx (4.6 across in centimetres, a hull + a
  child "Lights" mesh, flat colours, no uvs, no sheet). sprites.js UFO_SAUCER_3D (heightRatio 0.72 = the triangle's
  scale), grey row in UFO_CRAFT_BY_RACE, procRig 'saucerCraft' = _ufoBuild(root, 0): round, flat spin. _ufoBuild now
  brings any hull to the triangle's size first (k = its width / 1.9, the moves / hover / beam are in those units;
  within 10% of 1 it's left alone, so the triangle and the ship are unchanged), and _ufoSwatchSheets gives a sheetless
  part its file colour (linear → screen, glow added) as a 4×4 swatch sheet plus zero uvs, because the board's unit
  look keeps only a part's sheet (else everything draws plain grey). Checked in a VS CPU match after a Probe: the
  dark navy hull with the dome's lit window band, like the file.

## THE 2026-10-25 BATCH — chef, eagleman, flesheater, mime (mondo's Meshy uploads)
mondo: "I added these new races and their race sprites, please add them to the game ... Each needs its own race family
with at least one spell, an entropy ult, and some shared spell families ... Assign them to areas in the map." (A sibling
thread did mummy / swamp monster / undead; another the shadow entity / sniper / spy / tree person remodels.)
- R2: `Races/chef/male/Meshy_AI_chef_male_Running.glb` + `chef/male/chef.png` (the chef is in male/), `Races/eagleman/
  Meshy_AI_eagleman__Running.glb` (two underscores) + `eagleman.png`, `Races/flesheater/Meshy_AI_flesheater_Running.glb` +
  `flesheater.png` (`flesheater_2.png` unused, asked mondo), `Races/mime/Meshy_AI_mime_female_Running.glb` + `mime_female.png`.
  All rigged, 28 joints, 1.7 m. The pngs are the 2D sprite (_CHARACTER_SPRITES + RACE_SPRITES); portraits cut from them.
- Rows: RACE_PROFILES, RACE_PASSIVES (+ PASSIVE_DEFS on the immuneStatus hook: ironStomach poison · eagleEyed blind ·
  mindlessHunger feared · notAPeep silence; party-builder.js RACE_TRAITS), AVAILABLE_RACES (+ server.js literal),
  RACE_CLASS (support · assassin · bruiser · assassin), RACE_BASE_STATS (each on its class's median budget),
  RACE_PHYSIQUE, RACE_ABILITIES, EW_RACE_BIOMES, RACE_TREE, SPELL_FAMILIES, RACE_FAMILIES, RACE_SPELL_EXCLUDES,
  CAMPAIGN_RACE_PRICES, DOOR_TEXT.POINT_OF_ENTRY, HQ_POPULATION_RULES.underworld (flesheater), CODEX_LORE (both copies).
- Signature families (ids `nr*`): chef `Haute Cuisine` (Hot Pan T1 burn · Taste Test T2 heal + regen · Flambé T3 ×1.5
  vs burn), eagleman `Bird of Prey` (Talon Rake T1 bleed · Eagle Eye T2 marked · Stoop Dive T3 charge ×1.5 vs
  bleed/marked), flesheater `The Maw` (Tendril Snare T1 root · Gnash T2 drain + grievous · Eaten Alive T4 drain ×1.5 vs
  root/grievous), mime `Pantomime` (Invisible Box T1 root · Shhh! T2 silence · Silent Treatment T3 ×1.5 vs
  root/silence). Shared: chef fire/poison/agriculture/dirtyfighting (minus Meteor, Splash); eagleman wind/apexpredator/
  beastabilities (minus Wing Attack, Tail Whip, Jurassic Jaw: no wings, no tail); flesheater ghoulish/blood/apexpredator/
  cryptid (minus Tail Whip); mime trickery/stagepresence/athleticism (minus the sound rows Mic Drop, Chorus, Call Out,
  Crowd Surge, Stadium Show, and the skinwalker's Borrowed Claw). Pools 27 / 19 / 25 / 17.
- Finishers borrow a built staging + `lines`: Order Up = shrinkRay, Bird's Eye View = upUpAndAway, Feeding Time =
  devoured, The Box = compactor.
- Homes: chef The Strip (Disaster City), eagleman The Haunted House (The Estate), flesheater D.U.M.B. + the underworld
  list (The Sewers), mime Downtown (Disaster City).
- Proof (harness VS CPU): 11 of the 12 own spells cast in battle with their combos; screens in
  /mnt/project-files/new-races-2026-10-25/.
## THE UNDEAD BATCH (2026-10-25, mondo) — mummy, swamp monster, undead
mondo's Meshy uploads: R2 `Assets/Sprites/Races/<folder>/Meshy_AI_<name>_Running.glb` + his sprite beside it
(mummy/mummy_female · swampmonster/swampmonster · undead/undead; the swamp monster's rig has finger bones, 66 joints).
- Race keys `mummy` (female only), `swamp monster`, `undead`. Every table the 09-30 batch touched: RACE_PROFILES, RACE_CLASS
  (caster / bruiser / assassin), RACE_BASE_STATS (first pass), RACE_PHYSIQUE, RACE_ELEMENT_AFFINITY (fire weak each; swamp
  water resist; undead poison resist), RACE_PASSIVES + PASSIVE_DEFS on the immuneStatus hook (Embalmed bleed · Bog Body slow ·
  Rotten Through poison) + party-builder.js RACE_TRAITS, AVAILABLE_RACES (+ server.js literal), CAMPAIGN_RACE_PRICES, lore in
  party-builder.js + ui.js; sprites.js RACE_SPRITE_GENDERS, _CHARACTER_SPRITES, RACE_MODELS_3D, RACE_SPRITES.
- Signature families (kind 'signature', unique, identity): `mummy` Mummy's Curse (Linen Bind root · Curse of the Tomb aoe
  hexed · Embalm ×1.5 vs root), `swampmonster` From the Bog (Muck Grab slow · Swamp Gas aoe poison · Into the Bog ×1.5 vs
  slow), `undead` The Restless Dead (Rotting Claw bleed · Death Rattle aoe feared · Grave Grip ×1.5 vs bleed).
- Shared families: mummy ancientknowledge · desertacclimation · necromancy · witchcraft (excludes Sacred Geometry); swamp
  monster water · poison · nature · cryptid (excludes Temporal Tide, Formic Acid, Tidal Blessing); undead ghoulish ·
  bonedensity · blood · necromancy. Pools 21 / 29 / 25.
- Finishers borrow built stagings with `lines`: Entombed = weighing, Dragged Under = nessieSurfaces, Six Feet Under =
  graveRobbery.
- Homes: mummy Pyramids of Giza; swamp monster Fairy Forest (The Woods) + The Sewers (HQ_POPULATION_RULES.underworld);
  undead The Haunted House + Hell (ALSO_NATIVE) + The Sewers.
## THE NATURE PASS (2026-10-25, mondo: "I dont really feel like there's a solid vine whip spell in the game or signature nature spell")
Two Nature Magic rows (data.js, after Overgrowth in SPELL_LIBRARY), existing kinds and rules only:
- **Vine Whip** (`raceVineWhip`, tier II, 50 MP, 1 AP, anomaly, nature): `pull`, range 4, 100 physical, pullDistance 2,
  Root 1 on landing (the Horn Hook shape). Sets up Overgrowth / Wrath.
- **Wrath of the Wild** (`raceWrathOfTheWild`, tier IV, 100 MP, 1 AP, cd 2, anomaly, nature): single-target `damage`,
  range 4, 170 magic, ×1.5 vs Root, applies nothing (finisher, no self-combo).
- Who gets them: every race with Nature Magic in RACE_FAMILIES (bigfoot, fairy, mushroom girl, tree person, hippie, swamp
  monster, scarecrow, shaman) + Adaptable borrowers. No exclusions added. Looks: spells-vfx.md "THE NATURE PASS".

## THE WATER PASS (2026-10-25, mondo: "can you do a similar thread on each element ... making sure there's a nice amount of spells for each")
Water Abilities (11 races: atlantean, jellyfish, kraken, loch ness monster, mermaid, starfish, deep sea fish, sharkman,
firefighter, swamp monster, siren) had T1 Whirlpool, T2 Water Pulse, T3 Call of the Deep / Tsunami / Temporal Tide /
Tidal Slam, T4 Great Flood: no single-target Soak and no finisher vs Soaked (water's own status). Two rows (data.js,
after Spout in SPELL_LIBRARY), existing kinds and rules only:
- **Water Jet** (`raceWaterJet`, tier I, 25 MP, 1 AP, anomaly, water): single-target `damage`, range 3, 80 magic,
  Soaked 2 (the Spout shape).
- **Maelstrom** (`raceMaelstrom`, tier IV, 100 MP, 1 AP, cd 2, anomaly, water): single-target `damage`, range 4, 170
  magic, ×1.5 vs Soaked, applies nothing (finisher, no self-combo; the Wrath of the Wild shape).
- Who gets them: every race with Water Abilities in RACE_FAMILIES + Adaptable borrowers. No exclusions added. The stats
  are thread calls copied from the nature pair. Looks: spells-vfx.md "THE WATER PASS".
## THE STATUS-ONLY CAST NEVER PRESSES (2026-10-25) — battle.js
mondo: "feared shows me a green exclamation point even though its not even a damaging move". The 25 `noDamage` area
spells (Fear, Dread Aura, Meow, Dragonfear, Hypnotic Pulse, Kneel, Treeline Scream…) are aoe / barrage / aoePull
kinds, so `spellArmsPress` armed them; the cast records no hit, so the refund never paid, but `forecastPressOn` fell
back to the bare type chart and every weak enemy wore the green !. `spellArmsPress` now answers false for `noDamage`,
so the nameplate !, the target drum, the quick menus and the over-the-enemy marks all drop it. Their ENDS TURN tag is
unchanged (spellDealsDamage still counts the kind).

## THE ICE PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each [element]")
Ice Magic (`ice` family: ice queen, wizard, yeti + Adaptable borrowers) had setups at T1-T3 but no T3/T4 finisher. Two
rows added (data.js, after Shatter in SPELL_LIBRARY), existing kinds and rules only:
- **Hailstorm** (`raceHailstorm`, tier III, 75 MP, 1 AP, anomaly, ice): `aoe` 3×3 (aoeRadius 1), range 4, 125 magic,
  ×1.5 vs Slow, applies nothing (finisher on Ice Spear / Diamond Dust's Slow).
- **Glacier Break** (`raceGlacierBreak`, tier IV, 100 MP, 1 AP, cd 2, anomaly, ice): single `damage`, range 4, 170 magic,
  ×1.5 vs Frozen, applies nothing (finisher on Flash Freeze / Permafrost's Frozen). Same numbers as Wrath of the Wild.
- Spread now: T1 Ice Spear (Slow), Shatter (×1.5 vs Frozen) · T2 Flash Freeze (Frozen), Summon Blizzard, Ice Slide ·
  T3 Permafrost (Frozen), Diamond Dust (Slow), Hailstorm · T4 Absolute Zero (Frozen), Glacier Break.
- Left as they were (existing exceptions to the tier convention, flagged to mondo, not changed): Absolute Zero is T4 and
  APPLIES Frozen; Shatter is T1 and carries the frozen bonus.
- Names "Hailstorm" and "Glacier Break" were picked by the thread (flagged). Looks: spells-vfx.md "THE ICE PASS".

## THE FIRE PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each")
Fire Magic had one row per tier (Fireball I, Combust II, Wall of Fire III, Meteor IV). Two rows (data.js, after Combust in
SPELL_LIBRARY), existing kinds and rules only:
- **Flamethrower** (`raceFlamethrower`, tier II, 50 MP, 1 AP, unholy, fire): `line`, range 3, width 1, 100 magic, Burn 2
  (setup; Dragon Breath's shape without its burning tiles).
- **Inferno** (`raceInferno`, tier IV, 100 MP, 1 AP, cd 2, unholy, fire): `aoe`, range 0, aoeRadius 2, aoeOriginSelf,
  160 magic, ×1.5 vs Burn, applies nothing (finisher, no self-combo; Throne of Ashes' shape).
- Who gets them: every race with Fire Magic in RACE_FAMILIES (demon, demon prince, dragon, jack o lantern, wizard) +
  Adaptable borrowers. Stats are thread calls (flagged to mondo). Looks: spells-vfx.md "THE FIRE PASS".

## THE WIND PASS (2026-10-25, mondo: "a similar thread on each element ... making sure there's a nice amount of spells for each")
Wind Control had no tier I setup and no tier III finisher. Two rows (data.js, after Eye of the Storm in SPELL_LIBRARY),
existing kinds and rules only:
- **Squall** (`raceSquall`, tier I, 25 MP, 1 AP, anomaly, wind): single-target `damage`, range 4, 90 magic, Blind 1 (the
  Thornlash shape). Sets up Tornado / Eye of the Storm.
- **Tornado** (`raceTornado`, tier III, 75 MP, 1 AP, anomaly, wind): single-target `damage`, range 4, 110 magic, ×1.5 vs
  Blind, applies nothing (the Conduction shape: finisher, no self-combo).
- Who gets them: every race with Wind Control in RACE_FAMILIES (dragon, gargoyle, eagleman, superhero, valkraye) +
  Adaptable borrowers. No exclusions added. Wind Control is now 9 spells + Windborne: I Wing Attack, Squall · II Gale,
  Updraft, Crosswind · III Sky Tackle, Tornado · IV Eye of the Storm, Vortex Slam. Looks: spells-vfx.md "THE WIND PASS".
Follow-up (same day, mondo: "no they shouldnt end your turn"): `spellDealsDamage` answers false for `noDamage` too, so
those 25 casts cost their apCost and keep the turn like a buff (the cast, the ENDS TURN tags, the AP icons and the CPU
plan all read it). The one-cast-a-turn lock still applies.

## THE EARTH PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each [element]")
One Earth Abilities row (data.js, after Mudslide in SPELL_LIBRARY), existing kinds and rules only:
- **Rockslide** (`raceRockslide`, tier IV, 100 MP, 1 AP, cd 2, anomaly, earth): single-target `damage`, range 4, 170 physical,
  ×1.5 vs Root, applies nothing (finisher, no self-combo). Why: the family's only tier IV (Quake) paid off Slow; nothing paid off
  its Root (Earthen Grasp). The numbers are Wrath of the Wild's on the physical side — a thread call, flagged to mondo.
- Who gets it: every race with Earth Abilities in RACE_FAMILIES (cyclops, dinosaur, gargoyle, giant, golem, kaiju, nephilim,
  crystal guardian, tree person) + Adaptable borrowers. No exclusions added. Looks: spells-vfx.md "THE EARTH PASS".
- The family now: T1 Stonefall / Tremor Stomp / Boulder Hurl, T2 Fissure / Rampart / Earthen Grasp, T3 Stone Drop / Mudslide /
  Ground Slam, T4 Quake / Rockslide (+ the Mountainborn passive).


## THE PSYCHIC PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each")
The Psychic Abilities family already had 10 rows across tiers I-IV (Kinetic Hurl, Psychic Beam, Telepathic Link, Psychosis,
Far Sight, Psychic Barrier, Migraine, Telekinetic Slam, Teleport, Mind Shatter) and Discord → Migraine closes. The gap:
Mind Shatter (tier IV) pays off Silence and no family row applied it. One row added (data.js, after Telekinetic Slam),
existing kind and status only:
- **Mind Blank** (`raceMindBlank`, tier II, 50 MP, 1 AP, anomaly, psychic): single-target `damage`, range 4, 90 magic,
  Silence 1 round (the Antimagic Gaze / Timber Stomp shape). Stats were a THREAD CALL, flagged to mondo.
- Who gets it: every race with Psychic Abilities in RACE_FAMILIES (dreameater, grey, mantid, mothman, nordic, occulus,
  telepath) + Adaptable borrowers. Looks: spells-vfx.md "THE PSYCHIC PASS".

## THE SONIC PASS (2026-10-25, mondo: "...making sure there's a nice amount of spells for each" element)
Sonic had 28 rows across tiers I-IV (7 / 9 / 7 / 5) but the Sonic family pool itself (siren, mermaid, popstar) held only
9, one of them tier IV. Two Sonic family rows (data.js, after Requiem in SPELL_LIBRARY), existing kinds and rules only,
numbers mirror THE NATURE PASS's Vine Whip / Wrath of the Wild (THREAD CALLS, flagged to mondo):
- **Screech** (`raceScreech`, tier II, 50 MP, 1 AP, anomaly, sonic): single-target `damage`, range 4, 100 magic,
  Silence 1 (the setup Sonic Breaker pays off).
- **Sonic Boom** (`raceSonicBoom`, tier IV, 100 MP, 1 AP, cd 2, anomaly, sonic): single-target `damage`, range 4,
  170 magic, ×1.5 vs Stun (Lullaby's sleep), applies nothing (finisher, no self-combo).
- Who gets them: siren, mermaid, popstar (Sonic in RACE_FAMILIES) + Adaptable borrowers. Looks: spells-vfx.md "THE SONIC PASS".
- Left as they were, flagged: Deafening Wail (tier III) applies Silence and Sonic Breaker (tier II) is the Silence
  finisher, the reverse of the tier convention.

## THE POISON PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each")
The Poison family had one tier II (Splash, a Goo spell) and one tier III (Rot, which applies), so no single-target setup +
finisher pair. Two rows (data.js, after Miasma in SPELL_LIBRARY), existing kinds and rules only:
- **Venom Spit** (`raceVenomSpit`, tier II, 50 MP, 1 AP, unholy, poison): single `damage`, range 4, 100 magic, Poison 2.
- **Venom Burst** (`raceVenomBurst`, tier III, 75 MP, 1 AP, unholy, poison): single `damage`, range 4, 125 magic, ×1.5 vs
  Poison, applies nothing (finisher, no self-combo).
- Who gets them: every race with Poison Abilities in RACE_FAMILIES (antperson, black goo, demon princess, ghoul,
  necromancer, bee queen, mushroom girl, goblin, chef, swamp monster, reptilian, zombie) + Adaptable borrowers. Stats are
  thread calls, flagged to mondo. Looks: spells-vfx.md "THE POISON PASS".

## THE LIGHTNING PASS (2026-10-25, mondo: "making sure there's a nice amount of spells for each")
Lightning Magic had Static Shock (T1, Jammed) as its only setup and no finisher that paid off its own status. Two rows
(data.js, after Conduction in SPELL_LIBRARY), existing kinds and rules only:
- **Ball Lightning** (`raceBallLightning`, tier II, 50 MP, 1 AP, anomaly, lightning): `line`, range 4, width 1, 100
  magic, Jammed 1 (the Rainspout shape). A second Jammed setup.
- **Bolt from the Blue** (`raceBoltFromTheBlue`, tier IV, 100 MP, 1 AP, cd 2, anomaly, lightning): single-target
  `damage`, range 4, 170 magic, ×1.5 vs Jammed, applies nothing (finisher, no self-combo; the Wrath of the Wild shape).
- Family now 8 rows. Who gets them: Lightning Magic in RACE_FAMILIES (mothman, wizard) + Adaptable borrowers.
- Left as they were (flagged to mondo): Tempest (T4) and EMP Burst / EMP Grenade still APPLY statuses at tier 3-4.
  Looks: spells-vfx.md "THE LIGHTNING PASS".

## THE BLOOD PASS (2026-10-25) — no rule changes
mondo asked each element to have "a nice amount of spells". Blood already has the full spread, so no rows were added:
Open Vein T1 (applies Bleed), Hemorrhage T2 / Maul T2 / Claw Sweep T2 (apply Grievous), Death Roll T2 (Root), Arterial
Spray T3 (×1.5 vs Bleed, applies nothing), Life Sap T3 (×1.5 vs Poison/Grievous), Exsanguinate T4 (×1.5 vs Grievous,
applies nothing), plus Blood Ritual (buff), Summon Blood Rain (weather) and the Sanguine passive. Looks only:
spells-vfx.md "THE BLOOD PASS".

## THE STATS20 PASS + THE DEAD SLOTS (2026-10-25, mondo: "let's do the recomended spell nerfs and buffs, and the stat tests, and the ai pass on the dead slots")
From the stats20 proposals (Balance Lab, 840 Arena matches; doc https://claude.ai/artifact/QZYZLqzhSuLXZwprdMQyfs).
Spell rows (data.js, each tagged `BALANCE PASS 2026-10-25`): Things That Go Bump 3→2 random targets; The Whole House
Shakes 4→3 hits; Eternal Slumber (T4) drops its radius-2 Stun (T4 finishers apply nothing; flagged to mondo); Tremor
Stomp 80→64. Buffs: Ninefold Scratch 9×20→9×30, Six-Shooter 6×30→6×42, Excessive Machine 6×28→6×40, Giant Smash
170→230, Rampage 170→240, Railgun 180→225 (its `cooldownRounds: 0` pin kept), Tether Line 60→100, Infernal
Conscription 60→100. Cooldowns checked with load-data.js: none changed. Miasma left alone until a DoT-fixed lab rerun.

THE DEAD SLOTS (ai.js, EW_AI_VERSION v4.19): 95 fielded spells had 0 casts. Causes found with a headless diagnosis run
(per spell: turns fielded, affordable, a candidate, ranked top, attempted):
1. scoreOffensiveHit returned 0 before the status riders when estDamage was 0, so every `noDamage` aoe / barrage debuff
   (Fear, Eyewitness, Dread Aura, Meow, Executive Order, Hypnotic Pulse…) scored nothing. Now worth its statuses + stages.
2. Setup casts never went first: the hit scores more and ends the turn. `_setupFirst` (rankCandidates): with AP for
   both, a positive non-ending cast that does not move the caster and leaves the MP for the hit goes before it.
3. Friendly statuses on `buff` rows were a flat +35, under any T2+ MP cost → `_friendlyStatusValue` (20 + 0.15 × rounds
   × the wearer's output).
4. warCry rows with `teamStatusEffects` all took Fermata's statLock branch (0 unless allies had raised stages). Only
   statLock takes it now; the rest are worth their statuses on allies in reach.
5. Blinks / escapes were charged the danger of the tile they leave; now the landing tile (×0.3 when the escape cloaks
   or Protects). Plunder counts its 100 dmg hit.
Lab after (492 Arena matches, new spells + AI): 42 of 818 fielded spells never cast (was 95 of the same pool in 840).
Casts per 100 fielded games: buff 12→66, debuff 23→101, warCry 20→108, barrage debuff 0→60. Still dead or near:
teleports (target finder only blinks when hurt+adjacent or out of walk reach), traps, Temporal Tide, Cleanse.
Stat tests (lab only, NOT applied; ~28 games per arm, ±18 points noise): Mech HP 1544→1350 79%→50% is the only clear
signal; the other eight moved within noise. Harness: /mnt/project-files/balance/weak-races-harness/lab3.js (per-match
alternating arms, `--alt`) + diag.js.

## NO FACE IS TOO TALL + THE GAP'S FLOOR (2026-10-25, mondo: "There shouldnt be a wall thats too big to climb ... let me climb it in multiple turns ... The whole point of climbing is to not get stuck to a spell like fissure or a bunch of craters" / "Fissure shows lava on the sides, but its supposed to be only at the bottom")
- battle.js getClimbTilesFrom: the `rise <= cap` ceiling is gone (up and down). Each climb tile carries `cap` (one stretch =
  jump + CLIMB_RULES.capOverJump, +2 in weak gravity) and `turns` = ceil(rise / cap).
- unit._climb gains `h` (how high it holds on) and `cap`. Up starts at h = min(rise, cap); down starts at h = rise.
  processClimbArrival (the activation hook) now returns true when the top / foot is still more than a stretch away: it
  climbs the next stretch (_climbNextStretch: h += cap up, h -= cap down), keeps the hang (climbing status, −DEF, no
  dodge, knock-off rules) and the activation ends the unit's turn (ap 0, the building-emerge pattern). The turn after the
  last stretch pulls up / climbs down with the whole turn, as before. A one-stretch face behaves exactly as before.
- knockOffClimber falls from `h` (where it hangs), predictClimbFallDamage previews the first stretch (_climbHangH). The
  ground at the foot moving under the hang (a Fissure closing) re-reads the rise; rise ≤ h pulls up.
- The round-start "is stunned and cannot move!" line no longer fires for the climbing status (blockMove, not a stun).
- three-renderer.js _updateBattleClimbers: the body hangs at h (feet a stretch's (1 − hangFrac) below the grip); each new
  stretch keys on h and climbs on from where the body is.
- HUD: the tile action reads "Climb up here · N turns" when N > 1; the prompt bar says a tall face takes a turn per stretch.
- THE GAP's floor: _fieldSkinBuild's drape (liquids and dry skins) reads null on a state.gapTiles cell, so the sheet lies
  flat on the bed. It used to read the rim's height on the cell's edge vertices and pull the lava up every wall (the lava
  mesh ran from the bed y≈41 to the rim y≈689; now 42–43). The walls are the strata's own faces (hqFieldBedFor side).
- Calls flagged to mondo: a mid-wall turn is spent climbing automatically (no other action that turn, same as the climb
  itself ending the turn); an enemy can still knock the climber off on every stretch.

## THE STATS21 PASS + THE RACE DETAIL EXPORT (2026-10-25, mondo: "analyze these balance stats and see how much the most recent changes helped or not, and try to buff/nerf the weakest and strongest enemies through small purposeful changes to their stats or their spells. Are there are any status effects, elements, or spells that dominate? A stat that dominates? What else can we add or modify to the export")
Read: ew-balance-stats21.json (1,239 Arena matches, all on build 20261025-climb-02-cors, AI v4.19) against stats20 (840).
- PR #524 read: the spread of race win rates barely moved (true spread ~8 points either run once sampling noise is
  taken out). Eternal Slumber's stun cut worked (Dreameater 64→44%); the pull buffs worked (Tether Line, Infernal
  Conscription); Ghost (69→68%) and Bigfoot did not move. The dead-slot AI change nearly tripled utility casts
  (3.8→10.7 a match): Trick Room 507 casts, Misdirection 371, Shake It Off 335, all for ~0 damage.
- HP is the stat that goes with winning (r 0.50; top HP quarter 57% vs bottom 44%); SPD/move next (move 5 races 58%,
  move 1 races 43%). With HP held, ATK/INT add almost nothing and CRT/MDEF read negative: the power budget prices HP
  and SPD under what the lab says they are worth.
- Elements: earth 57% (k/cast 0.17, the best) and blood 57% (never resisted) lead; psychic 46% trails (5.2 dmg/MP, the
  worst). Statuses: bleed 63%, burn / grievous / stagger 56%. Units that Guard 42%, shields / Protect / Quickened
  under 40% (the Arena score doesn't count what they save).
Changes (data.js, each tagged `BALANCE PASS 2026-10-25 (stats21 lab)`), existing rules only:
- Nerfs: Descending Wrath dmg 135→115 + per level 25→15 (1,237 a cast, 2.6× the Tier III median); Stone Drop
  125→100 + per level 15→12; Cataclysm Stomp 100→80 (desc WEAK); The Whole House Shakes 60→48 a hit. HP: Kaiju
  1556→1450, Ghoul 1300→1180, Flesheater 1600→1460, Gargoyle 1459→1350, Mech 1544→1430.
- Buffs: Mental Static 70→88, Silent Treatment 135→170 (HEAVY), Seven Years 100→125, Hall of Mirrors tick 60→80, Ankle
  Biter 110→135, Garden Shears 170→200 (SEVERE), Web Shoot 95→125 (MEDIUM), Pie in the Face 70→100 (MEDIUM), Devil's
  Coal 130→155 (HEAVY). HP: Telepath 373→470, Shadow Entity 361→460, Mime 780→880, Voidweaver 459→540. SPD: Nun
  28→50 and Jellyfish 36→50 (move 1→2, the Wizard fix). No tier, status or cooldown changed (load-data.js check).
THE RACE DETAIL (battle.js, Balance Lab only, same IndexedDB key; older matches simply carry none of it):
- `_balLedger` per unit this match: damage + kills by source (basic attack / spell / DoT tick credited to its
  applier / other), damage vs utility casts, MP, turns (`_balTurnStart` from _continueBlitzWithUnit_impl) and dry turns
  (MP under the cheapest equipped spell), spells actually cast. Folded into stats.raceDetail and stats.spellCastGames.
- analysis.races[r].base (stat line, move, jump, range, budget) and .detail (dmgShare, killsPerGame, castsPerGame,
  utilityCastShare, dryTurnRate, mpPerGame, turnsPerGame); spellEfficiency rows gain castGames / castWr (units that
  cast it) and `row` (the spell's numbers in this build).
- analysis.teamAdjusted: a logistic fit over the match log (this build's matches when 200+): each race's edge with
  its teammates and opponents taken out, adjWr + ci95. matchLog cap 400→2000; team entries carry k / dmg / dead.
- analysis.statVsWinRate (per stat: r, bottom / top quarter WR) and analysis.flags (races off 50% at 95%, damage
  spells ≥1.6× / ≤0.6× their tier's median a cast, statuses / elements off 50%).
- DoT kills: a lethal tick leaves hp ≤ 0 with the death still to resolve, so dotKills read 0 in every export; the tick
  hook now counts hp ≤ 0.

## THE STATS22 PASS (2026-10-25, mondo: "let's analyze these balance lab stats and again see what recent change worked and didnt work, and balance the weakest and strongest units. Each pass should be getting closer to everyone having 50% WR")
Read: ew-balance-stats22.json (635 Arena matches, builds 20261025-skiesoff-02 + nofreeze-01, both after PR #528, AI v4.19)
against stats21 (1,239) and stats20 (840). ~40 games a race, so one run's WR is ±15; a race is only called strong / weak
when it sits there in all three runs and in analysis.teamAdjusted. Run-to-run correlation of race WR is 0.59 (real signal).
- PR #528 read. WORKED: HP cuts on Kaiju 81→66, Ghoul 68→53, Flesheater 68→46 (Gargoyle 68→65, team-adjusted 51);
  Mime HP + Silent Treatment 31→60; Nun SPD 50 (move 2) 36→47 (team-adjusted 59); Telepath HP + Mental Static 28→38;
  Jack o Lantern Devil's Coal 38→48; Clown Pie in the Face 36→44. DID NOT: Mech HP 1430 (64→69); Ghost after two
  Things That Go Bump / Whole House Shakes trims (68→79); Voidweaver HP + Web Shoot (35→22); Rabbit's Seven Years /
  Hall of Mirrors (32→28); Shadow Entity HP (35→39); Gnome's Ankle Biter / Garden Shears (31→36); Jellyfish SPD (36→39).
- SPD / move is now the stat that goes with winning (r 0.47, move 0.46, HP 0.40): the Arena score is kills + tower damage +
  Keys + Nexus rounds, and the top six are all move 5 except Crystal Guardian (HP 1727, DEF 195).
Changes (data.js, each tagged `BALANCE PASS 2026-10-25 (stats22 lab)`), existing rules only, no tier / status change:
- Nerfs: Ghost SPD 177→160 (move 5→4); HP Dragon 1239→1130, Juggernaut 1776→1640, Ki Fighter 1288→1190, Crystal
  Guardian 1727→1600; Mech's own Mortar Salvo 70→56 and Full Burst 120→105 (desc MEDIUM, the house word for 105).
- Buffs: SPD Hippie 34→50, AI 19→50, Mermaid 40→50 (move 1→2); Voidweaver 85→88, Gnome 82→88, Wizard 50→88 (move 2→3);
  HP Rabbit 593→700, Catgirl 763→840; Ninefold Scratch 30→40 a hit (Catgirl's own, 0.51× the Tier IV median).

## THE STATS23 PASS + EVEN GAMES (2026-10-26, mondo: "Some of the spells have like a 90% win rate ... make informed surgical buffs and debuffs to the weakest and strongest units ... is there a way we can ensure all the units get the same amount of games?")
Read: ew-balance-stats23.json (409 Arena matches, build 20261025-stats22-01-cors) against stats21 + stats22, then THREE
cloud Balance Lab rounds on the candidate changes (525 + 501 + 550 matches, headless harness
/mnt/project-files/balance/weak-races-harness/lab4.js, 2 tabs ≈ 6.5 matches a minute, mods applied in-page only).
- The "90% spells": every one of them (Crystal Resonator 89, Splitting Arrow 88, Camouflage 88, Horn Hook 87, Arrow
  Volley 87, Entropic Beam 86, Plasma Cannon 83) sits on 8-15 cast games, and cast WR mostly follows the caster race
  (Crystal Resonator read 29% in stats22). Pooled over stats22+23 the top spell is ~76%. Trimmed only the ones that are
  high in both runs AND over their tier's damage median: Arrow Volley, Piercing Arrow, Bomb Arrow (Robin Hood), Mortar
  Salvo (Mech), Wing Attack + Stone Drop (Gargoyle).
- Lab lessons: a SPD change that crosses a move band (49 / 88 / 126 / 163) is the lever that moves a race; HP buffs on
  weak races (Mantid, Fairy, Machine Elves), Ghost INT -15, Ghost HP 560, Minotaur HP 1530/1450 + SPD 160 and Dinosaur
  SPD 160 did nothing measurable. Noise at ~35 games a race is bigger than binomial (Gnome 59% → 14% → 56% with no change).
Changes (data.js, tagged `BALANCE PASS 2026-10-26`), existing rules only, no tier / status change:
- Nerfs: Ghost SPD 160→125 (move 4→3); Mech HP 1430→1350 + SPD 195→160 (move 5→4); Juggernaut + Dragon SPD →160 (move
  5→4); Kaiju HP 1450→1320; Cowboy HP 1532→1350; Gargoyle HP 1350→1250; spells above.
- Buffs: SPD Telepath 59→88, Jellyfish 50→88, Fortune Teller 14→88, Necromancer 22→50, Mushroom Girl 33→50, Giant 37→50,
  Angel 45→50, Machine Elves 92→126, Rabbit 151→165; HP Eagleman 760→880.
- Tested and NOT shipped (no effect): Deep Sea Fish / Clown SPD 88, Mantid / Catgirl / Men in Black SPD 165, Voidweaver
  SPD 126, Hippie SPD 88, Professor SPD 50, Fairy HP 760 / SPD 165, Minotaur, Dinosaur. Still weak/strong: Fairy,
  Professor, Shadow Entity, Voidweaver, Catgirl (~35%); Minotaur, Dinosaur (~65%).
- EVEN GAMES (battle.js `_balEvenDraftTeams`, called from randomizeBothTeamsForDevSim in the Balance Lab only): the lab
  drafts the 2×teamSize races with the fewest games on the CURRENT build token (`_balanceStats.raceGamesByBuild`), ties
  in random order, then deals them into the two teams at random. Spells, maps, teammates and foes stay random. In the
  cloud runs every race landed within 3 games of every other (34-36 in 525 matches).

## THE AUTO ATTACK (2026-10-26, mondo)
mondo: "when i use a spell that pushes or pulls an enemy into one of my own units, i want it to trigger an auto attack by
them similar to an opportunity attack. So i guess if they get pushed into their own team, its a crash/collision, and if
they get pushed into my team they get attacked automatically."
- battle.js resolveForcedSlide, the `unit` step: `_slideAutoAttacker(target, occ, opts.byUnit, x, y, z)` — the body is
  byUnit's enemy, occ is on byUnit's side (byUnit itself counts) and `_oppStrikeCanReach` (the opportunity attack's own
  gate, now shared: basic-attack reach + point-blank sight, not stunned / frozen / asleep / climbing). Then
  `_slideAutoAttack`: occ's opportunity-attack hit (`_oppStrikeDamage`, half ATK power less DEF, no Shank ×1.5), always
  lands, no crash damage either way, occ holds its tile, the body stops in front of it (momentum spent, no ice glide).
  Otherwise the old bowling pin. The body still counts in res.hitUnits, so a spell's own collisionBonus / pin riders fire.
- Moves with no driver (ice, ownerless storms, blowback) crash as before. Storm flings and bomb throws carry their caster
  as byUnit, so they auto-attack too.
- Forecast: a simHits row tagged `autoAttack` (ui.js _FC_TAG_TEXT '⚔️ AUTO ATTACK').
- Online: the opportunity-attack banner is now `showOppStrikeBanner(title, sub, x, y)`, wrapped in online.js ('opp-banner'
  relay, fog-gated on the struck tile) — the plain opportunity attack's banner never reached the guest before either.
  The swing rides the relayed strike-leap / basic-shot, the text rides floating-text.
- Browser check: VS CPU TDM, DOOR Agent's Swing Door (hinge west of Minotaur) drove Minotaur into Sedan → "Sedan auto
  attacks Minotaur: 81"; Sedan took no crash, Minotaur stayed put. Hydraulic Punch into Sharkman's own Mime still crashed.

## THE SHADOW REALM WORKS AS WRITTEN (2026-10-26)

mondo: "the units dont disappear, the unit i put in the shadow realm with me got opportunity attacked by one of my
other units ... I should only be able to see the units in the shadow realm when it is their turn, and it should be like
a simple all dark and shadowy realm." The row's own text is the rule ("to everyone else the two of you are gone —
invisible, untargetable, immune to everything not from each other ... In there, it is just you and them").

- The realm is a second plane. battle.js `shadowRealmKey(unit)` = the pair ('<id>|<id>'), only while BOTH ends are alive
  and wear `shadowRealm` with each other's id. `isUnitRealmShieldedFrom(unit, actor)` is now BOTH ways (different keys =
  no touch), so every gate already built on it (damage, heal, status, spell aim, attack, forecast, AI) also stops the
  pair reaching out. `closeShadowRealmFor` / clearStatus: the realm closes for both when either leaves (time, cleanse,
  death in map.js defeatUnit).
- Interaction paths closed: opportunity attack (checkOpportunityAttack), THE AUTO ATTACK (_slideAutoAttacker), any forced
  slide by another plane or by the board (storms, ownerless traps) — a slide into a hidden body just stops short, no
  crash; attack / spell / Entropy Strike target lists (_getAttackValidTargets, spellTargetUsableOn,
  getEntropyStrikeTargets); doAttack inside the realm only reaches the partner (no Cube, trees, objects); aimed support
  casts ('hidden' gate); combo partners (state.js getComboPartners); Chivalry intercepts; Overwatch; traps, warp runes,
  seeds, tile arrival chain, pickups (getPathPickupEvent); Nexus capture / contest (ui.js) and zone heal / burn.
- Sight: a realm unit lends the board no vision (teamSeesTile, computeVisibleTiles); in the realm the pair always see
  each other and nothing else (isInVision). computeVisibleTiles on a realm turn = the realm (the pair + the viewer's
  realm unit's own sight); state.js fog cache keys carry the realm. The online guest mask (_guestView) reads the same
  computeVisibleTiles, so a realm turn masks the board's units for the guest too.
- On screen: `realmViewKey()` = the pair whose turn it is (synced _blitzActiveUnitId, so host and guest switch together,
  nothing relayed). `isUnitOutOfRealmView(unit)`: on the board's turns the pair is hidden (own units too: model, plate,
  minimap, cinematics via _cineActorVisible / _isUnitVisibleToViewer); on the pair's turns everyone else is. three-renderer
  `_realmTick` dresses the realm turn: every scene child but terrain / walls / props / units / tiles / VFX / lights hidden
  (sky, horizon, weather, Nexus walls ...) plus both Cubes and their plates (_realmHideCube; they sit in the kept prop layer), the world grade (_EW_POP_W, live uniform, both renderers) down to x .2 / y .22,
  the background = the shadow palette's sky, scene fog thinned (never removed), and `.realm-layer` (styles-cinematic.css:
  vignette, motes, "🌑 THE SHADOW REALM" tag, z 6 under the plates).
- Calls flagged to mondo: the hidden pair still HOLDS its squares on the board (nobody can step there); the turn column
  still lists them; an area spell cast in the realm still paints terrain on the real squares (it only hurts the partner).

## THE GAP CLOSES WHOLE + THE HANG ON A GONE WALL (2026-10-26, mondo: "after 3 rounds fissure the map returns to normal, but i was climbing as it did so, and it didnt raise the ground all the way back up for the tile i was on, but the other 2 tiles it did")
- Cause (reproduced VS CPU, Mount Shasta, Golem Fissure + Ice Queen Hailstorm): a water / ice hit on a unit in the gap hardens
  that cell's lava into stone (triggerTerrainSpellReaction) and map.js _noteTerrainChange restarted THAT cell's clock at 3, so
  it closed rounds after the other two (heights 5, 5, 2 at round 8). Any later change on a gap's floor (a flood, a weather
  paint, a same-terrain refresh) did the same.
- Fix: _noteTerrainChange and refreshTerrainTimer leave an open gap's clock (a timer row with `cut`) alone; the change still
  shows, and the gap closes with the rest of its Fissure (revertTerrainTimer puts the cut blocks back over it). A Fissure cast
  on the gap again still restarts it (battle.js terrainCreate, unchanged).
- The hang: when the ground under a hanging climber moves (revertTerrainTimer raising a closed gap, applyTerrainDeform),
  battle.js climberFootMoved re-reads the hang from the new foot: h and rise change by the move. Wall gone (top at or under
  the foot) or ground up to the grip: the climb ends, the unit stands on the tile unhurt (the arrival's own "changed ledge,
  no harm done" rule). Before: the climber kept hanging at h over flat ground and a hit knocked it off for a 5-level fall.
- Calls flagged to mondo: a paint on an open gap's floor no longer buys that cell 3 more rounds (it goes with the gap);
  the climber whose wall vanished keeps its next turn as a normal turn (no auto pull-up onto the old ledge).
- Proof: /mnt/project-files/fissure-close/.


## THE SPELL AUDIT FIX PASS — shared engine causes (2026-10-26, lead thread)
mondo: "fix all" (the audit list: /mnt/project-files/spell-audit/findings/COMBINED.md; the batch brief for the parallel fix
threads: /mnt/project-files/spell-audit/fix/BRIEF.md). The lead fixed the causes several spells share:
- `applyDamageToUnit` opts `statStageBoost` (+ `statStageLabel`): a damaging row's stat drop rides the hit. Passed by the
  single-target / chain / area / cross / barrage / line resolvers. selfHeal and aoeShield apply their own `statStageBoost`.
- `_applyDamageSpellHit` reads `groundsFlyers` and `terrainDeform`; executes with `executeAfterHit` (Termination Protocol,
  Ammit) judge the HP the hit leaves (Take Aim / No Mercy stay pre-hit, as their text says). Preview shows the execute.
- Delayed strikes: the mark stores `dmg + spellPower` and `groundsFlyers` (state.js grounds flyers in the blast).
- Lines pass `ignoreArmor`. Line + area pushes run after every hit, farthest body first (forecast in step).
- Plain `aoe` passes `pushFromCenter`; area hits add `unholyBonus` (same Unholy/Anomaly test as the single hit).
- Barrage reads `terrainDeform` (round its origin) and passes `statStageBoost`.
- `lifeDrain`: heals drainPct × the HP the hit really took (preScaled) and hits with the row's damageType.
- Buff kind reads `selfHealPct`; `aoeShield` gives EVERY ally the full shieldHp (was one pool split).
- `_activeZones` / `burningTiles` reset with the match (beside `_delayedSpells` in the 4 reset sites).
- Turn-start pin line names the status (rooted / charmed / frozen / roped / stunned). Infernal Waltz's swap reads statusEffects.
- Rows: Chest Pound `noDamage`, Entropic Beam `statStageBoost {def:-1}`, High Noon `critChance: 1`, Let It Out low-HP boost +2/+2.

## THE SPELL AUDIT FIX PASS — F3 log lines (2026-10-26)
Batch F3 of /mnt/project-files/spell-audit/fix/BRIEF.md: lines carried over from another spell, or cut off.
- Terrain end-turn damage (map.js): the rule's "…for" text is the hit's sourceText, one line with the HP taken
  ("EnemyA is sickened by poison terrain for 12 HP damage."). It used to log a bare "takes N" and the cut-off text apart.
- `aoeLifeDrain`: "the swarm's work" only on Bat Swarm; the others drink "from the enemies it hit".
- Levitating `onApply` gets `info.sourceLabel` (applyStatusPayload passes it): "rises on Spirit Guide / Updraft / Rapture!",
  Fairy Dust keeps "on fairy dust". The name rides `unit._levitateBy` (a string) for the landing line.
- Summons: `SUMMON_LOOK` (battle.js) gives each `summonDef.key` its icon + verb from its text (hawk dives at, wolf / Spirit
  Animal / hound bite, drone stings, creation clubs, elephant / cult member / blob strike). hud.js hover icon reads it.
- `randomTeamBuff`: the tarot cards are Tarot Draw's only; Trick or Treat logs "casts Trick or Treat! N allies gain +1 X".
- teamStatusEffects warCry: Fermata's leftover "carried by the chord" now names the statuses ("4 allies are levitating").
- doSpell's can't-afford branch logs any other block reason ("Pulse Lattice can't be cast: No prisms.").
- Debuff zones: an enemy with no tick damage and no status landed gets no "zone affects" line (Smoke Screen).
- Fissure: "down to the bottom" (was "the the"); a cast that cut nothing says the ground will not split.
- Windborne (`immuneDisplace`): resolveForcedSlide logs "X's Windborne holds — the push/pull cannot move them!" when an
  enemy's push arrives anchored (dist 0 from getUnitPushDistance) or reaches the anchor gate; `opts.noAnchorLog` = the
  caller wrote its own (the pull kind). The pull kind skips "pulls N tiles" when the body held or is colossal.
- `physicalHitStatus` lines name the passive that fired (Cheap Shot / Venomous / Cinder Touch / Serrated).
- `stagePerRounds` labels with the passive's own icon + name (Rising Power) and a permanent stage logs "gains +1 ATK."

### Spell audit fix F6 — passives (2026-10-26)
- Hooks that two equipped passives can share now fire per passive: `healOnceBelowPct` loops every row, the once-per-life
  ledger is `_passiveSpent['healOnceBelowPct:<rowId>']` and each row checks the HP the one before it left (Consecrated +
  Triage, Ballistic Vest + Second Wind). `physicalHitStatus` loops every row (Cheap Shot + Venomous both land), each line
  named by its passive ("Cheap Shot: EnemyA is grievously wounded."). `physicalElementRider` stays first-row-wins (one element).
- Green Thumb: `getPlantedTreeBonus` / `getTreeThrowBonus` need the `plantedTrees` hook (`_hasGreenThumb`); any planter got
  the tree ATK / spell power / Trunk Throw bonus before. Text: "Every drain heals 20% more" (the lifeSapMult reads every drain).
- Cinder Touch / Live Wire text: "physical spells with no element of their own" (the rider only fills an empty element).
- Field Operative: `getItemCapForClass(cls, key, meta)` + `normalizeLoadoutForClass(lo, cls, meta)` read the slot's party meta
  (`passiveIdsMax(meta.customSpells, 'scannerCap', meta.spellUpgrades)`, data.js); the forge stepper reads the same; createUnit
  clamps the scanners again once the kept rows are known (a kit that lost the row keeps 1).

## SPELL AUDIT FIX F1 — card text + data-only rows (2026-10-26)
mondo "fix all" on the 10-26 spell audit, batch F1 of /mnt/project-files/spell-audit/fix/BRIEF.md (data.js only).
- Card text now matches the rows: combo statuses (Dragon Slash Grievous, Ape Fury / Haymaker Staggered, Take Aim Stunned or
  Rooted, Hydraulic Crush Jammed or Staggered; added Heroic Leap Frozen, Hocus Pocus Hexed, Curb Stomp Staggered, Abduction
  Beam Marked, Predator Drop Grievous, Indoctrinate 2 activations vs Charmed, Dragon Fist charge + Stunned + fire on grass,
  Exorcism / Divine Smite "Unholy and Anomaly"), counts (Infect 2, Meow / Sanctuary 3 rounds, Avalanche Strike CD 2, Nimble
  Dodge 3 tiles / 2 rounds), shapes (Diamond Dust / Blade Waltz diamond, Crusade cross, Prism Burst / Splitting Arrow one
  bounce), effects (Water Pulse Soaked, Self-Repair / Yo Ho cleanse 2, Land Ho swap, Pounce leaps in, the 7 leap strikes
  "from higher ground" + Seismic Leap's 40% shockwave, Ice Slide WEAK path / MEDIUM target, Stampede stops and knocks aside,
  Round Up crash damage, Call of the Deep overflow, Walk the Plank drowns the target only, Scatter Shot "you can see",
  Tidal Slam "deep water", Eternal Slumber sleep line gone, Trick or Treat one stat for the team), power words on the
  `_dscDmgWord` scale (row dmg), Bloodlust "for 3 rounds".
- Rows: Demonic Roar `noDamage` (was spell-power chip damage), Rally Command / Royal Decree `auraRadius: 2` (warCry reads
  auraRadius, default 3), Dimensional Fold `requiresLineOfSight: true` (the cast already refused 'los'; the CPU now filters too).
- Kept: Heat Death / Hall of Mirrors ticks stay WEAK (row zoneTickDamage 70 / 80; describeSpell words ticks off the row number).

## THE SPELL AUDIT FIX PASS — F4 movement, board and summons (2026-10-26)
Batch F4 of /mnt/project-files/spell-audit/fix/BRIEF.md. Every push / pull stays on the one shared slide (resolveForcedSlide).
- Lasso (Roped): `_tetherFollow` lands the victim on the tile the roper stepped off LAST (the walk's tile before its end),
  falling back along the walk to the first free tile, then the start tile. `_resolveMovePath` hands the walked tiles
  (`trail`) through completeMoveAlongPath → finishMoveAt.
- Sprint: `dashOnlyMoves(spell)` (a dash with no dmg / dashDamage / afterShot) refuses an occupied landing tile: doSpell's
  dash branch, `spellAimProblem` ('occupied' → "Needs an empty tile") and the CPU's dash tile pick.
- THE AUTO ATTACK once per enemy per cast: resolveForcedSlide `opts._struck` (a Set shared by one cast's slides: area
  push/pull jobs, line pushes, the forecast's `slide`); a second drive of the same body into that side just stops against
  the striker. Crowd Surge used to auto attack EnemyA twice (pulled in, then bowled in again by EnemyB).
- Teleport pick is `state._teleportingUnitId` (an ID, RULE #2; `_teleportMover()` resolves it). A self teleport (Icky
  Surprise) drops it on a refused landing; a warp-any-unit pick still holds through a refusal.
- Smoke Screen: the zone's ally refresh skips the tick it fades on; when a smoke zone fades, `updateSmokeZoneCloak(u,
  {faded})` reveals any unit it cloaked that no other friendly cloud covers.
- Stuffed Double: `_clearDecoyTaunts(obj)` ends the Provoked keyed to the decoy (`_tauntObjKey`) when it breaks
  (`_onDecoyBroken`) or a new double replaces it.
- Checked, not changed: Plaguefield poisons allies at their own turn end (the cast poisons nobody); Raise the Dead and Summon
  Thunderstorm strike at the first round end when the prey is in reach (the zombie walks 2 then mauls); Trick Room and
  Rangefinder last 3 rounds in a match. The audit's short counts came from casting before the board's round-1 start had run
  (the deferred startMatch beginBlitzRound / buildBlitzTurnOrder ticked them after the cast).

## THE SPELL AUDIT FIX — F5: riders, costs and the CPU's aims (2026-10-26)
Batch F5 of /mnt/project-files/spell-audit/fix/BRIEF.md (mondo: "fix all").
- HP costs / recoil (`selfDamagePct` / `recoilPct`: Burnout, Go Ape, Death Pact, Blood Ritual, Let It Out, Baphomet's Rite)
  are paid straight off HP in doSpell's finish block — the exact share of max HP, no DEF/soaks/shield/Protect/multipliers,
  still never lethal (stops at 1 HP). Own float + log line ("Burnout recoil: Caster takes 132 HP damage.").
- Overfit / Paradox (`echoLastDealt`): calcSpellHitRiders no longer replaces the base with the echo. `_applyDamageSpellHit`
  lands the spell's own hit, then a SECOND source-less hit of exactly the target's `_lastHitDealt` (cap 500) with
  ignoreArmor + preScaled + `exactDamage` (new applyDamageToUnit opt: skips the damage-taken status multipliers), the caster
  credited through `_lastDamageSourceId` (link-echo style). Preview adds it as an `echo` hit.
- Chivalry: doAttack skips the counter when the ward's pledge was spent on this swing (the knight took the hit).
- Inner Peace (`cleanse`): spellTargetUsableOn accepts an ally with no debuffs while the row's `statStageBoost` has room.
- Grievous Wound / Gooed `healTakenMult` now scales processEndOfRoundRegen too.
- Text: Dead Eye / Knife Throw marks say "the next basic attack" (spells pass allowMarkBonus:false). Crash Loop's dead
  `repeatOnStay` / `repeatDmg` fields dropped. Precision Shot's `actedTargetBonus` works in a real match (a unit that acted
  has 0 AP; the audit board had every enemy at 0 AP, so it fired both ways): 264 fresh vs 322 acted.
- CPU aims (ai.js): `_aimOkAt` = the engine's spellAimProblem on a picked TILE. Dashes and placeTrap tiles must pass it;
  2×2 / 3×3 traps judge the whole `_trapFootprint` (and score nearE from the footprint); seeds go under a hurt ally /
  an enemy or beside the most of them, never on the caster's own tile; Voodoo's ally excludes the caster.

## THE SPELL AUDIT FIX F2 — THE CONFIRM PREVIEW (2026-10-26, mondo: "fix all" to the spell audit)
Batch F2 of /mnt/project-files/spell-audit/fix/BRIEF.md: the CONFIRM preview (battle.js `forecastSpellPlan` /
`_forecastSpellInto`, ui.js `_fcRenderBadges`) now shows what lands. Proved with the audit harness (fc vs landed).
- SELF-LAID TERRAIN (Miasma, Tidal Slam, Hellmouth, Chemtrails, Formic Acid): the brief's pick was "add the bonus to the
  preview", but the existing NO SELF-COMBO terrain rule (PR #392, map.js cast watch) says a cast never earns the ×1.25
  off terrain it made itself. The leak was the RUNOFF: a painted spring overflows one tile (getLiquidFlowAt), and the
  watch only noted painted cells, so the caster's / the target's tile read the cast's own overflow. map.js
  `beginCastTerrainWatch` now keeps the flow map as it stood (`castPreFlowAt`), `_elemTerrainLabelOf` reads it on a
  live hit. The hit lost the bonus; the preview (current board) already matched. Hellmouth 408 → lands 404 (was 539).
- Conduction (`_forecastConduction`) now also runs for aoe / cross / aoePull (after the moves), lines (the beam's
  tiles) and barrage (each struck tile): Crystal Resonator vs Soaked 940 forecast / 877 landed (was 574 / 914).
- statusFirst (Goo Shot): `_forecastStatusFirstOn` puts the status on for the one hit (not when immune / realm / 0%).
- sneakBonus reads the caster's Invisible (doSpell stamps `_sneakStrikeBonus` only at the cast). Unmasked 702 / 696.
- autoTargetLowestHp (Blood Frenzy): forecastSpellPlan aims at doSpell's prey (aimed EnemyA → EnemyB 290 / 287).
- Random shots: `plan.randomShots`; a body the draw is sure to hit wears every shot; any other one shot with a 0..max
  spread; badge "🎲 MAYBE · ×N RANDOM SHOTS".
- Swing Door: the aim is the hinge (`swingDoorResolve`, auto pick for an enemy's own tile); push away from the hinge.
- Sky moves: pure `skySwoopTakeoffZ(unit)` (doSpell's `_skySwoopTakeoff` reads it) — the preview takes off first, so
  the drop counts from up there and a wind caster gets 'Air' (Predator Drop 730 = 730, Descending Wrath 961 = 961).
  The skyThrow GRAB shows the throw onto the victim's own ground (To the Moon 766 = 766); the landing pick then reads
  the real tile. Predator Drop's drain heal shows on the caster.
- New kinds, read only when the row deals damage (`_FORECAST_DAMAGE_KINDS`): debuff (Star Crossed's zodiac ×1.5,
  groundsFlyers), steal + Plunder, doorBreach (the landing pick, the rear rider armed like doSpell's
  `state._doorRearCast` and restored, Drop In's landing splash), zoneDebuff `zoneCastDamage` (Outbreak), deployObject
  (contact blast on every body; detonateOwn; an armed trap keeps the tile preview), terrainCreate (doSpell's footprint
  rules + a spring's one-tile overflow, ±10, missesFlyers tag "FLIES ABOVE IT", execute floor, fresh deep water's 36
  drag-under first, tag "DRAGGED UNDER").
- Multi-hit: `h.split` (each hit's take); badge "N HITS × each" / "N HITS: a + b" / "N HITS OF lo–hi".

## THE DASH APPROACH + THE JUMP SWINGS (2026-10-27)

mondo: "Any spell that is a non damaging dash move like that needs to be included in move+attack/cast calculations. Like
if i can dash+cast or grapple+attack etc then that needs to show up in the action menus." and "is jump+cast/attack
calculated too? it needs to be if not". Before: casts counted walk, jump and the height verbs; attacks counted the one
walk only; no spell counted anywhere.
- battle.js `spellOnlyMovesCaster(spell)`: a spell that only carries the caster and keeps the turn (not spellEndsTurn):
  a damage-free dash (Sprint, dashOnlyMoves), a self teleport/blink (not teleportAnyUnit), an escape, an ally-only swap,
  Grapple's selfPullOnly reel.
- `selfMoveApproaches(unit)`: every landing such a spell gives this turn, as approach entries `{ x, y, z, moveCost,
  _viaSpell: { name, id, x, y, z, ap, mp } }` (_viaSpell x/y/z = the cast's aim). Aims gate on spellAimProblem (+ the
  swap ally rule; Grapple's 'blocked' from THE GRAPPLE REEL); landings come from forecastSpellPlan's caster move
  (Grapple: grappleLandingFor; escapes: escapeLandingFor, the player's pick). Blocked spells (getSpellBlockReason, Clash) are left out. Cached by unit + board positions.
- What may follow: `selfMoveAllowsAttack` (AP left for the swing) and `selfMoveAllowsCast` (AP, MP for both, the one
  spell per turn: a cast after it only lists while a press opened a second; Brand lock). No rule changed.
- Order everywhere: walk, then jump, then the move-only spells (then the height verbs for casts). Wired into
  findSpellApproachTile, _findSelfNovaApproachTile, TargetQuery.hasReachableTarget, findAttackApproachTile,
  _getAttackApproachTargets (via `_attackLeapApproaches`: jump tiles when AP >= 1 + attack, then the spells), and
  hud.js findMoveIntoRange + the cross / beam / tile-AoE candidate lists (`_mtSpellCands`).
- Run: `_runSelfMoveStep` casts the move-only spell through doSpell (relayed online like any cast), waits until its
  finishAction has marked it used and the caster has moved (an online guest sees both through the host snapshot; 6 s
  cap), then the attack / cast. _moveThenAttack now runs jumps too (doJump, 680 ms, as _moveThenCast).
- Labels: `_mtVerb(mt)` (hud.js) names the leg: rows read SPRINT→ATK / DOOR DASH→ATK / JUMP→CAST, the CONFIRM chip
  the same, the prompt bar "<verb> + attack / cast" (approachCastFrom returns `verb`).
- Browser-checked (VS CPU, Mount Shasta 10x10): after a crit press Catgirl's Love Bite listed the flying Gargoyle as
  SPRINT→CAST (Sprint onto the 3-high pillar G6), CONFIRM dashed then bit; a rooted DOOR Agent's attack list showed
  Machine Elves as DOOR DASH→ATK and CONFIRM teleported + swung. Shots in project files dash-approach/.
- Existing rule worth knowing: rooted only stops walks and jumps, so a rooted unit's teleports/dashes still list.

## THE GRAPPLE REEL (2026-10-27, mondo: "grapple should have more range ... the spell preview shows a bunch of eligible tiles but clicking on them says that it needs to be a wall or pillar or unit")
- Range 3 → 5 (data.js `raceGrapple`; the Grapnel Gauntlet grants the same row). Still 1 AP, no damage, does not end the
  turn, so Grapple + Attack works in one turn (checked in the browser: reel 2 beside Yeti, then a crit).
- The anchor requirement is GONE (the coordinator's pick, flagged to mondo): the hook bites whatever the click names and
  reels the caster straight along the line (`_ewLineTiles`) — ONTO a free tile, or onto the tile BESIDE a wall, a shut
  door, the Cube, an object, an ally or an enemy. Every tile on the way must be clear (`canOccupy`).
- ONE walk: battle.js `grappleLandingFor(unit, x, y, {viewer, partial})` → `{x, y, moved, anchored}` or null. Used by
  doSpell (partial: a body nobody saw stops the reel short), `getSpellRangeTiles` (a tile is in reach only when the reel
  works), `spellAimProblem` (new code 'blocked' → "Line blocked"), the forecast, ui.js lit tiles (landings blue 'move',
  unit anchors gold 'move ally') and the hover arrow + ghost. `viewer` = the caster's side: a body hidden by fog or
  stealth never blocks the lit tiles (no leak). `isGrappleReel(spell)` = the selfPullOnly row.
- The "nothing happened" tile: utility's minRange 0 lit the caster's OWN tile, and the target drum pre-picked the caster
  ("BIGFOOT ✓ CONFIRM") — CONFIRM/click refused it. The caster is never a Grapple target now (spellTargetUsableOn), and a
  MOVE→CAST row is offered only for a body out of reach, not one whose rope is just blocked.
- Type badge: `spellTypeMatters` no longer counts the self reel (it never damages).
- AI unchanged except it only picks an ally the rope actually reaches.

## THE TYPE SPREAD (2026-10-27, mondo: "the game is dominated by human and anomaly type characters")
- Proposal page (counts + picks): https://claude.ai/artifact/CEWMYMgVnu8kRr8R1swS1S. mondo picked the retypes; no new characters.
- data.js RACE_PROFILES types: Mad Scientist tech/unholy, Men in Black tech/anomaly, Priest divine, Nun divine,
  Black Goo unholy/alien, Symbiote unholy/alien, Zombie unholy, Mummy unholy, Barbarella human/tech, Annunaki alien/divine,
  Occulus alien/divine, Watcher divine/alien, Ghost anomaly/unholy, Reptilian alien. Professor and Mech unchanged (his call).
- Spread (131 races, duals count twice): Human 57→49, Anomaly 50→45, Unholy 32→34, Divine 19→20, Tech 16→17, Alien 15→20.
- FINISHERS type tags moved with the race so the execution keeps STAB: Reptilian alien, Barbarella tech, Black Goo unholy,
  Occulus alien. Spells keep their own spellType (no spell retyped).
- types[0] changed for 10 races, so their duo combo (COMBO_REGISTRY), cinematic accent and story customs line follow the new
  first type. Tutorial Tape 2 line "SISTER is HUMAN and DIVINE ... zombie HUMAN and UNHOLY" rewritten to the new types.

## THE BLIGBLOG (2026-10-27, mondo's Meshy upload)
- R2: `Races/bligblog/Meshy_AI_bligblog_Running.glb` (rigged, 58 joints: fingers + extra Bone_0xx, Running clip only;
  the shared UAL/MAL libraries retarget onto it) + `bligblog.png` (64×128 sprite, also the portrait).
- Type ALIEN. Class specialist, stats = the specialist medians with VISION 4 (HP 946→900 pays for it).
- Kit the Time Cop's way: RACE_ABILITIES `[]`, shared families only (ufo, alientechnology, eyesight, trickery), no
  signature family. RACE_TREE: Probe · Baleful Gaze/Implant · Hypnotic Pulse/Abduction Beam · Death Gaze/War of the
  Worlds. Excludes raceBorrowedClaw (the skinwalker's). No FINISHERS row: the Alien typed execution (Abduction).
- No passive, no lore, no DOOR_ROSTER_LINES / customs line (mondo: no invented flavour). POINT_OF_ENTRY Area 51,
  biomes the grey's (space, clandestine), price 250.
- party-builder.js pbFinisherDef now passes the race's types, so a race with no FINISHERS row shows its typed
  execution in the builder (it showed the Anomaly one before).

## PRIEST + NUN MERGED (2026-10-27, mondo: "the priest and the nun are supposed to be male and female versions of the same race ... like the cowboy and cowgirl or the male and female pirate")
- One race key, `priest`: label Priest (male) / Nun (female, `labelFemale`). The old `nun` race is gone from AVAILABLE_RACES
  (and server.js). The "Priestess" label is gone (she was the priest's female before the Nun split off on 2026-09-08 and
  wore the same whitemage female GLB as the Nun).
- data.js `RACE_MERGED = { nun: { race: 'priest', gender: 'female' } }`: state.js normalizeRaceKey + resolveIdentityForBuild
  read an old 'nun' as a female priest; profile.js backfill rewrites saved team slots; hqPartyNormMember rewrites story
  party members; isUnitOwned counts an owned/captured nun as owning the priest; online.js normalizes a guest slot. A team
  that fielded BOTH is flagged by ONE OF EACH (teamDuplicateRaces), never deleted.
- Spells: RACE_FAMILIES.priest = the priest's + the nun's (holyorders, nun/Convent, biblestudy, light, healingmagic,
  angelic) = 32 spells; the nun's RACE_ABILITIES rows moved under 'priest'; SPELL_FAMILIES.nun.unique = 'priest'.
- Gender-only spells: data.js `RACE_GENDER_SPELLS` (priest: male Holy Water + Last Rites, female Ruler Smack + Vow of
  Silence). raceExcludedSpellIds(race, gender) adds the other gender's; the pool functions take a trailing `gender`
  (raceFamilyPoolIds, unitSpellPoolParts, unitSpellPool, spellAddVerdict, buildUnitSpellTree, isTreeLoadoutLegal,
  treeLegalSubset, buildTreeLegalLoadout, raceDefaultKit). No gender = the whole pool (Spell Library, tooling).
- Stats / physique / tree / price: the Priest's rows (the Nun's old stat row is in a comment for the race editor).
  Devout (heals +20%) is the merged race's passive, both genders.
- Finisher: `FINISHERS['priest:female']` = the Nun's Ruler; getFinisherDefForRace(race, types, gender) reads the
  `<race>:female` row first (battle getFinisherFor, party-builder pbFinisherDef). Lore 'priest:female' (getCodexLore
  gender), roster lines 'priest:female', customs line moved to 'priest'.
- Looks: male = R2 Races/priest/Meshy_AI_priest_Running.glb (rigged, 67 joints, library-animated like the Spy) +
  Races/priest/priest.png (same pixels as the male whitemage sheet); female = the whitemage nun GLB + female whitemage sheet.
- Room NPC spots: the nun's spots are `race: 'priest', gender: 'female'`, the priest's `gender: 'male'`; three-renderer
  honours a spot's gender and counts priest:male / priest:female apart for the crowd cap.

## THE SPY SPLIT (2026-10-27, mondo: "the female spy is supposed to be a different race from the men in black")
- The Spy was the men in black's female form (RACE_PROFILES labelFemale 'Spy'), so the one-of-each rule and the
  labels treated the two as one unit. She is her own race `'spy'` now: female only, same sprite
  (`Races/spy/spy_female.png`), same 3D model (`Races/spy/Meshy_AI_spy_female_Running.glb`), same EWFaces face.
  The men in black are male only (RACE_SPRITE_GENDERS 'male', no labelFemale).
- Spy: type HUMAN/TECH (Barbarella's pair). Class assassin, stats = the assassin medians (HP 733, MP 138, ATK 131,
  DEF 84, M.DEF 91, M.ATK 84, VISION 2, CRT 26, SPD 145). Kit the Time Cop's way: RACE_ABILITIES `[]`, shared families
  only (seduction, spygear, weaponstraining), no signature family. RACE_TREE: Knife Throw · Charm/Poison Dart · Dead
  Eye · Sneak Slash. Excludes Soul Suck, Enthrall, Draining Embrace (Barbarella's cut) and Agent Vanish (the men in
  black's vanish). FINISHERS row: her own FEMME FATALE (below), typed human. Basic attack ranged (the pistol).
  RACE_KITS / RACE_JUMP / biomes / POINT_OF_ENTRY copied from the men in black. No lore, passive, roster or customs line.
- The men in black keep every spell, family, stat and the Neuralyzer finisher. MIB unchanged.
- Saves: profile.js `_spySplit` (once per profile, `_spyV`) turns every saved-team slot and story party member that
  fields a female men in black into the Spy; her spells keep what her pool allows and the rest is filled from her tree.
  Owning the men in black grants the Spy (profile mirror + server.js getOrBackfillEconomy).
- HQ: agents a room files as `gender: 'female'` (intake clerk, cashier, …) spawn as the Spy (same model as before);
  the alternating default agents and the online operatives are all men in black now.
- FEMME FATALE (2026-10-27, mondo: "dont give her succubus's finisher, she needs her own"): FINISHERS.spy sig
  `femmeFatale` (glyph 🔫, tagline ONE KISS. ONE BULLET.). battle.js _FIN_DIRECTORS.femmeFatale (2200/3600/2200 ms, the
  usual skeleton + doFinisher damage) + three-vfx-effects.js `_sigFemmeFatale3D` (exported sigFemmeFatale3D) + the forge
  stage `_FIN_STAGE.femmeFatale`. Beats: four white dots slide in and the last opens the gun barrel (dark floor outside a
  white rim, spiral rifling) · she slinks in (red stand-in) · a lipstick 💋 hangs over the victim (caption 💋 MARKED) ·
  she steps back, red laser sight, one shot from the hip (muzzle flash, tracer, blood) · the red runs down the barrel,
  the body falls back, the iris closes · caption SHAKEN, NOT STIRRED. Checked in a VS CPU battle (frames in
  /mnt/project-files/spy-split/). The forge's preview stage drew nothing in the cloud browser for ANY finisher
  (Kiss of Death too) — a cloud-only rendering gap, not this finisher.

## THE TRAINER REWORK (2026-10-29, mondo: "something is fundamentally wrong with the entire ai training if a 6 hour session of thousands of matches didnt improve the ai at all") — battle.js, map.js, ai.js v4.20, train_headless.js

The 10-29 long run (4,822 matches, 82 A/B experiments, 5 adoptions) played 382-381 against the AI it started from.
The five adopted values are now the shipped basis (AI_WEIGHT_DEFAULTS value, `prev` = what they replaced; the two
AI_TUNE ones and the ai.js wght() fallbacks match): Arena Score Play 2.125, Search Value 285, Tower Finish Push 35,
Anchor Caution 0.5, Move-Then-Act 0.985.

Why the old trainer could not work: one weight per experiment, win/loss only (a 5% edge needs ~1,500 matches; an
experiment had 60), every lab match on one arena, and arenas that hand one seat 70-87% of the wins. It adopted by SPRT
luck about as often as by signal. And it could only re-weigh numbers: nothing it did could teach the brain what it
did not look at.

THE PAIRS (battle.js `_labPair*`): Training and Strength Test play every match twice: same arena, same mirror teams,
same engine seed (startMatch `_labPairSeed`), the two sides swap seats (`_labSideASeat`). A new pair moves to the
next arena of the PvP pool (`_labPairPrepareTeams` in restartDevSimFromBuilder). THE GRADED RESULT (`_labMatchValue`):
a score finish counts half the win + half tanh(point gap / 100); a Cube / Keys / wipeout win is 1. `_arenaCompositePts`
is the buzzer's sum.

SPSA (`_spsa*`, IndexedDB `ai-spsa-v1`): each pair nudges EVERY weight by a random ±10% of its range (side A all +,
side B all −); after the twin, every weight steps SPSA_ETA × pair result toward the better side. The A/B experiment
code is still there but never starts (getAIWeight takes the SPSA branch first). `_SPSA_NEVER`: Search: Centre Odds
(no effect), Hard: Reply Check (Hard only). The 20 weights the A/B had retired are trained again. The CPU plays the
running θ (the same trained table, ai-weights-v15). train_headless.js: no shards for training; every --sync-min
(default 20) the runner adds up every worker's moves since the last sync and sets every worker to that θ (`_ewSpsaState` / `_ewSpsaSetTheta`).

WHAT THE AI DID NOT ACCOUNT FOR (ai.js, each a trainable weight, 0 = the old behaviour):
- zoneTileValue_v1 `_zoneTileCost`: the round-end Nexus burn (25% max HP in a zone the other team owns) and heal
  (15% HP + MP in an own zone) on the tile it ends on.
- nexusHoldValue_v1 `_nexusHoldValue`: a zone pays its points every round to the buzzer, so round 3 is worth ~6× round
  18 (the old urgency term grew toward the buzzer, backwards).
- oppAttackCaution_v1 `_oppAttackCost`: the expected opportunity attack on a move away from an adjacent enemy.
- healLifeLine_v1 (healValue): a heal that lifts the patient out of the enemy team's kill range saves a kill; one that
  leaves it inside is mostly wasted.
- forecastTrust_v1 `_fcRatio` (THE FORECAST ORACLE): the AI's damage copy (`_estDamageRaw`) was >15% off the on-screen
  forecast in 20% of 5,800 single-target reads (Giant Smash ×1.52, Dead Man's Hand ×1.47, Rampage ×1.27, High Noon
  ×0.52, Predator Drop ×0.64, Grotesque Dive ×0.78); each (attacker, spell, target) is read once per AI loop through
  forecastBasicAttack / forecastSpellPlan and the copy is scaled to it.
- arenaPointValue_v1 `_ptv` (was the fixed ARENA_PT_VALUE 4) + cubePointsValue_v1 `_cubeHitPts`: a Cube hit pays
  Arena points at the buzzer (~19 for a 280 hit) whether or not the Cube falls; score-decided matches are won by
  kills (+36 points on average), the Cube (+33) and zones (+24).
Not built (listed for mondo): the CPU never Climbs; never uses a lift (ENTER); ignores enemy cooldowns and counters /
Overwatch in its threat field.

RESULTS (cloud lab, Strength Test pairs on the rotating 12×12 PvP arenas, 4 browsers, ~16 matches/min with
`--disable-gpu`):
- New AI, untrained (v4.20 + the new basis) vs the AI on main before this PR (v4.19 + its five old values): 175-157 over
  332 matches (52.7%, graded 53.1% ±4.5). The blind-spot weights alone (zone tiles + opportunity attacks + zone clock vs
  off) were 74-74: the forecast, the point prices and the Cube points carry it.
- SPSA training: 1,962 matches in 2 h on the new code, 0 page errors; 35 of 48 weights moved more than 8%.
- Trained vs the AI on main: 250-197 over 447 matches = 55.9% ±4.6 (graded 55.8% ±3.9, 222 pairs: 69 won both legs, 43
  lost both). The trained side did more Cube damage (893 vs 702) and scored 384 vs 358 points.
- Trained vs untrained (same code): 237-203 over 440 = 53.9% ±4.7 (graded pairs 53.6% ±3.8). The 6 h A/B run had moved
  nothing (382-381); 2 h of SPSA moved it ~4 points.
- Hard's one-move reply check (hardReplyFactor) on the new code vs Normal: 7-19 after 26 matches; dropped as a lever.
- What CPU turns are spent on (6,486 activations, 9 min of lab): 35% walk only (32% two moves), 19% deal damage.
The trained θ is baked into AI_WEIGHT_DEFAULTS (value; `prev` = the basis) and the 17 AI_TUNE fallbacks. Schema 15:
the old ai-weights-v14 table stays in IndexedDB but no longer overrides the defaults (every key of it was filled, so it
would have hidden the whole new basis). Harness + logs: /mnt/project-files/ai-training/rework-20261029/.

## THE KEYS SHOWN AGAIN (2026-10-28, mondo: "get rid of all those hidden key rules ... I just dont want the combat log to give away the exact tile the key is dropped on")
- Removed the whole Hidden Keys layer of 2026-10-23: map.js `keysHiddenFor` / `shownCarriedKeys` / `addKeyLog`, battle.js
  `_logKeyHidden` / `_presentKeyFind` / `_playKeyFindLocal`, online.js `key-private` relay + the `_ewNoRelay` guards. Enemy
  carriers show the Key badge on their plate, KEY+ chip, "Carrying ×N" / Key Charge rows, card MOV, the real count on the
  scoreboard (no "?"), Keys in the shown ARENA score, the entropy orbs, the KEY SECURED celebration (relayed to the guest
  as before), and dropped Keys are visible to both teams again. Inspect / find / nothing-found lines are tagged to the
  searcher's team as before (online/fog: own team only).
- KEPT: `dropHourglassesFromUnit` logs "X drops N Keys." with NO tile, for everyone (mondo's one rule).
- KEPT (bug fixes from that PR): Far Sight tile pick (no ally list / pre-pick, tile prompt, fog-exempt click, desc),
  guest tile-cast reach refusal (`_ewGuestBoardPick`), `_forecastConduction`, the MOVE→CAST CONFIRM chip, and the later
  gold 'pickup' float for "+N KEY" (Cube vs Keys report).

## THE SUPPORT FORECAST — EVERY HEAL PREVIEWS (2026-10-29, mondo on the 10-28 VS CPU report: "previews need to be robust, even heals")
The report: Divine Light's target rows showed no heal amount, and the Cube row in ATTACK showed only "HP 92%".
- Why heals were blank: ui.js `_estimateSpellHeal` read only `spell.heal` (3 rows); 20 of the 22 heal rows carry `healAmt`,
  and selfHeal read `healPct` (the field is `selfHealPct`). The estimate also added spell power the cast never adds.
- Fix: the cast and the forecast share helpers (battle.js "THE SUPPORT FORECAST", above `_FORECAST_KINDS`):
  `spellHealAmountFor` (heal kind), `healAllAlliesOf` / `healAllAmountFor`, `selfHealAmountFor`, `spellShieldGainFor`
  (shield kind + a buff row's `shield`), `aoeShieldAlliesOf` / `aoeShieldPerAlly` / `aoeShieldAfter`, `reviveHpFor`.
  doSpell's branches call them. applyHealingToUnit's scaling is `_healScaledAmount`; `healLandsOn` = what it would return
  (realm gate, supportScale, Devout, Grievous/Gooed, missing-HP cap), no state touched.
- forecastSpellPlan now reads the support kinds (`_FORECAST_SUPPORT_KINDS`: heal, healAll, selfHeal, shield, aoeShield,
  buff with selfHealPct/shield, cannibalize, transfer) plus Miracle's healOnSwap, an escape's selfHealPct and the lifeDrain
  self-heal through `healLandsOn`. A hit only helped has `h.heal` / `h.shield` and `h.support` (no strike arrow, kept out
  of `_cineNoteCast`'s frame guard). Divine Light's `healAdjacentDamage` sear rides the real hit pipeline.
- Readers: ui.js `forecastSupportOn(caster, target, spell, castFrom)` → {heal, shield, dmg}; `_estimateSpellHeal` and
  `getPendingDamagePreview` (`_supportPreviewVal`, an `all` list: Heal All's team, the sear) use it; `_fcRenderBadges`
  draws +N 🛡 and the ally's buffs/CLEANSE. hud.js target rows (≈+N, +N 🛡, a revive's ≈+N HP, Sacrifice giver −N),
  ally quick menu (+N real, not the row's base), turn icons (forecast.all).
- Cube: `getCubeAttackForecast(unit, tw, { castFrom })` — the report's Cube row was a JUMP→ATK row read from where the
  unit stood (null). Target list + tile menu "Attack Cube" rows show ≈−N.
- Browser-checked (VS CPU, Mount Shasta): Divine Light row ≈+140 → healed 140; its sear forecast 133 → 133; Miracle +100
  on the ally quick menu; Cube MOVE→ATK ≈−53 (48–66) → 50. 70 support rows forecast with no errors.
- Not previewed (no instant number): zoneHeal (Sanctuary, Temporal Tide), seedHeal, deployObject auraHeal (per turn).

## THE WEATHERS TOGETHER (2026-10-29, mondo on the 10-28 playtest: "weather interactions need to actually work and make sense")
- Playtest: Drought and Blood Rain ran at once R7-R9. Fixed under the existing rules (no new rule):
- DROUGHT HEALS 50% FOR REAL: `healMult: 0.5` only ever scaled getEffectiveHealBonus's bonus (unit.healBonus, 0 on nearly
  every unit), so a Drought never cut a heal. battle.js `applyHealingToUnit` now scales the WHOLE heal by state.js
  `getWeatherHealMult` at the recipient's tile (spells, potions, drains, Blood Rain's Unholy heal); getEffectiveHealBonus
  dropped it (no double). Previews mirror it: ui.js spell heal row, `_estimateSpellHeal`, `_estimateHealPotionHeal`, the
  potion bar preview. Revive already read it (getEffectiveRevivePct). Round regen untouched (the desc says healing).
- THE DROUGHT DRIES LAST: state.js `tickWeather` runs every Drought's `evaporateBattleWater` after all weathers poured
  their round share and the ending ones left theirs (Blood Rain listed first, or dissipating, left fresh pools on a
  dried board). The round always ends with the fight's water/blood/ice gone while a Drought lasts.
- A CAST WEATHER RENEWS, NEVER STACKS: spawnWeather already never forms a weather on top of itself (10-24); the
  summonWeather cast (battle.js) stacked a second copy (two Blood Rains = double burn/heal). Now a cast of a weather
  that is up renews it: rounds = max(left, cast roll), it becomes the caster's, a storm's eye / patch moves to the
  picked tile; log "The X already up is renewed: N rounds left." (call flagged to mondo).
- OPEN: how two clashing weathers combine (Drought vs Blood Rain / Thunderstorm / Hurricane / Blizzard): asked mondo.

## THE FLYER IS NOT THE TILE — flyer clicks vs tile clicks (2026-10-29, VS CPU playtest R9 + R7, mondo's notes 4/5 + bug 3)
mondo: "clicking a flying unit and clicking a tile need to be 2 separate things" (a click on the tile under the
flying Angel opened her ally menu instead of moving Bigfoot there).
- three-renderer `_screenClick` sets `window._ewGroundClick = !unitHit` around `clickTile` (cleared after).
- battle.js `_groundClickPassesFlyer(u)`: a ground click (no body hit) never names an airborne unit. With no verb
  armed or Move armed, the ground under a flyer is a tile click: the tile menu (Move here, Inspect ...), or the move
  itself. Only a click on the flyer's own body opens its menu. `_moveClickMenuTarget` uses it too, so the online
  guest's move click follows the same rule. Keyboard cursor / pad clicks are unchanged.
- battle.js `_boardBodyPick` (THE BODY IS THE PICK): with an attack or a unit spell armed, a click on a BODY of a
  shared column picks THAT body like its target-list row (selectTargetFromMenu): in reach = pick (next click
  confirms), MOVE→ATK / MOVE→CAST row = that pick, else refused with the out-of-reach line, mode holds. Called from
  clickTile and `_ewGuestBoardPick` (host and guest). Tile-aimed / directional / line casts skip it.
- ~~CALL: a click on the TILE of a shared column with a verb armed keeps the column rule~~ — mondo 2026-10-29: "the tile
  click should always mean the unit on the ground, clicking a flyer should require clicking on the actual flyer".
  THE TILE IS THE GROUND (PR after #657): battle.js `_armedUnitAim` (attack / unit spell / targeted item), `_groundAimPick`
  (a ground click in a column with a flyer names the unit standing there, picked like its row; nobody there = refused
  "Nobody on the ground there. Click <flyer> itself to aim at it."), `_hoverAimBody` (the armed hover: the body under
  the pointer, else the ground unit; no confirm arms on the ground under a lone flyer; hover picks now carry z).
  three-renderer `_boardPickBody` (the click's body filters, shared) + the armed hover aims at the body under the
  pointer (its own column), published as `window._ewHoverBodyId`. Tile / self / directional / line casts keep the tile.
  Checked in the browser: attack armed, ground under the enemy flying Anubis refused with that line, hover on his body
  aimed at him, a click on his body hit him.
- hud.js THE PICK IS LOUDER THAN THE HOVER: a target list with a ✓ pick gets `.hrlg-list.has-pick`; the picked row
  (.pend) joins the Selected look selectors (base CSS, the colour pass and the UI Maker's battle `buttonSel` /
  `selLabels` / edge lists), and a hovered / cursor row that is not the pick is washed out (saturate .3, brightness
  .72). Clicking that row still moves the pick + CONFIRM to it (checked in the browser: Divine Smite, Sharkman →
  Police Officer).

## THE SPELL POWER (2026-10-29, STATS24, mondo: "I want that power score to include the spells it has access to and what the spells do and how powerful they are ... if the data is saying blood and earth spells are better they need to contribute to the power score more")
- data.js `SPELL_POWER_RULES` + `spellPowerScore(id)` / `raceSpellPowerPool(race)` / `raceSpellPower(race)` / `raceTotalPower(race,
  range)` / `racePowerTargetNow()`. POWER = racePowerBudget (the statline, formula untouched) + SPELLS = the race's best
  `loadout` (5) spells of its pool (families + door wheel, no passives), each perPoint (50) × tier weight (I 1 · II 1.07 ·
  III 1.45 · IV 1.68, the STATS24 tier median dmg a cast) × element weight (1 + 4 × (element lab WR − 0.5)) × the spell's
  lab weight (dmg a cast ÷ tier median, shrunk by 100 casts, clamp 0.85-1.2); a no-damage spell counts ×0.25.
- Fit (STATS24 teamAdjusted, 124 races): statline alone r 0.421 → stats + spells r 0.472; the fit asks perPoint ≈ 46.
  Element weights from STATS21-24 pooled predicted STATS24 race WR out of sample (resid r ≈ 0.2-0.3). The lab damage
  weight HURT the fit a little (kept mild because mondo asked for "how powerful they are"); tier weights added nothing.
  CAVEAT: within the same race, carrying a blood / earth spell vs not moves WR only ±2 pts — the element edge rides with
  the races that carry it (big physical bruisers).
- The target is now the MEDIAN race's POWER (racePowerTargetNow, ±5 % colours); RACE_POWER_TARGET 262 is the stale
  2026-09-07 statline target, kept only as the fallback.
- Race Editor RACES table: STATS · SPELLS · POWER columns (sortable); the inspector shows "POWER = stats + spells · target"
  and a SPELL POWER list (each counted spell's points, tier, element %, lab dmg %).
- Balance Lab export: races[r].base.spellPower / .power, and statVsWinRate reads both.
- `node bake-power.js <newest export> [older exports…] [--fit] [--dry-run]` rewrites the BAKED-SPELL-POWER block
  (elementWr from all files, spellWeight from the newest) and prints the r before/after; --fit writes perPoint.
- FIX (same day): the spells part read 0 in the browser — battle.js already sets `window.spellPowerOf(unit, spell)` (combat)
  and overwrote the data.js function of the same name; renamed to `spellPowerScore`. The editor page no longer runs off the
  left edge (#raceEditorPage > .ms-container min-width 0; the RACES table scrolls in its panel). Checked in Chromium.
- spellWeight entries are now `[lab weight, the row's damage the lab saw]` (from the export's row snapshot); the game scales
  the weight by damage now ÷ damage then, so a trim / buff moves POWER before the next lab run.

## THE STAT RE-PRICE + THE STATS24 PASS (2026-10-29, mondo picked "Re-price from the data", then "lets go with all of those proposals")
- data.js RACE_POWER_WEIGHTS (points per unit): hp .21 · mp .26 · atk .61 · int .41 · def .31 · mdef 0 · spd 1.31 · vision 0
  · crt 0 · range 66 a tile past 1. Fit by `node bake-power.js … --fit-stats`: win rate = stats·w + spells, w ≥ 0, ridge λ 20
  on standardized stats toward the 2026-09-07 formula (the prior lives in bake-power.js STAT_PRIOR). STATS24: left-out-race
  r 0.63 (old formula 0.47). M DEF, VISION and CRT showed no link to winning, so they score 0 (flagged to mondo).
- Spell trims: Quake 160→130, Eye of the Storm 160→135, Vortex Slam 160→135, To the Moon 150→120, Full Burst 105→85, Wing
  Attack 65→45, Spike the Ball 65→45, Arterial Spray 125→110, Crystal Resonator 130→110, Descending Wrath 115→90.
- Spell buffs: Pocket Sand 70→100, Tesla Coil blastDmg 80→120, Lure 50→80, Leech Seed drain 5→8 % (tree 4→6.5 %, floor
  12→19; battle.js SEED_LEECH_PCT / TREE_AURA_LEECH_PCT), Team Strike 27→38 a hit (+ bonus hit), Blue Screen 80→110,
  Migraine 135→155, Telekinetic Slam 145→165, Sonic Boom 170→200.
- Race stats: Dinosaur HP 1715→1500, Seraphim HP 300→500, Occulus SPD 13→50 (move 2), Mermaid SPD 50→88 (move 3),
  Men in Black HP 410→600, Grey HP 495→650. Rows carry "STATS24 PASS 2026-10-29" comments.

## THE SPREAD (2026-10-29, Balance Lab team comp tracker, mondo: "it predicts who will win based off the teammates then sees if it beats the prediction or loses, kind of like an over/under spread in sports betting ... we can also see if any comps are overpowered")
- battle.js `BAL_SPREAD` + `_balSpreadFit` (ridge logistic, full Newton): P(team 1 wins) = sigmoid(side + Σ team 1 [race edge
  + w × POWER z-score] − Σ team 2). POWER (raceTotalPower) carries low-sample races. Rows = this build's log if 200+, else all
  (same as teamAdjusted, which is untouched). Race ridge 20 picked on STATS24 (992 matches): out of fold the favourite won 67%,
  forecast said 68%, Brier 0.203 (coin 0.25); powerWeight ≈ 0.32.
- Before each lab match (randomizeBothTeamsForDevSim → `_balMakeForecast`) the fit of the log forecasts it; recordBalanceMatch
  stores it as matchLog[].pred and tallies `stats.forecastLive` (n, favWins, favP, brier, last). Same IndexedDB key, old data kept.
- Spread tab (`_balSpreadHtml`): This match / Last match / Record lines, views Races | Role mixes (RACE_CLASS) | Race pairs | Teams.
  Tables are OUT OF FOLD over the whole log (5 folds), so old matches count. Race expected = its team's forecast with the race
  swapped for an average race; comps = the whole team's forecast. Over/under = actual − expected in win-% points, ±95%.
- Export: analysis.spread (record + calibration buckets, model, races, roleMixes ≥8g, racePairs ≥5g, teams ≥2g, beatForecast /
  underForecast) + analysis.forecastLive.
- Read: with EVEN GAMES random drafts the teammates average out over ~60 games (race expected 47-55%), so a race's over/under is
  close to its raw WR − 50; the gain is at small samples and in the comp lines. Exact teams almost never repeat in random drafts.

## THE GEM SPELLS (2026-10-29, Crystal Guardian, mondo: "crystal guardian should get like some amethyst or emerald spells" ... "surely we can think of some more common gems besides jsut emerald and amethyst")
- Context: the Machine Elves thread's inherent PRISM action is NOT for the Crystal Guardian or Ice Queen (mondo); the guardian
  got gems instead. It keeps its old prism-lattice spells.
- Six rows in its own Crystal Heart family (RACE_ABILITIES['crystal guardian'], ids sig*; mondo took the recommended five
  from a twelve-gem menu, plus Amethyst Lull): Ruby Spark (T1 fire, Burn 2), Sapphire Frost (T2 ice, Slow 2), Topaz Jolt (T1
  lightning, Stagger), Amethyst Lull (T1 psychic, Silence 1), Emerald Heart (T2 nature heal 20% max HP + Regen 2, CD 3),
  Diamond Lance (T4 earth physical 160, x1.5 vs Burn / Slow / Stagger, applies nothing, CD 2). Existing statuses and
  riders only; the tier rule holds (setups apply, the finisher only cashes in).
- Not picked (the menu, if he asks again): Garnet Edge (blood, Bleed), Emerald Snare (nature, Root), Onyx Shade (earth,
  Discord), Pearl Ward (water, Protect), Amethyst Geode (3x3, x1.5 vs Silence), Emerald Spire (x1.5 vs Root).
- VFX (three-vfx-effects.js, "THE GEM SPELLS", _cg*): mondo's crystal shard / crystal cluster models tinted per gem through
  _wpnInstance's `tint` (+ a little emissive), sized by _bodyK() so they fit a body on the 3.5 m squares. Ruby / Sapphire /
  Topaz = _cgGemBurst (a gem turns over the head and bursts, plus flame / a frost ring / arcs); Amethyst = a violet point with
  three rings closing in; Emerald Heart = a green stone over the chest (aura); Diamond Lance = a slim pale spike (the shard
  model squeezed to 0.3 wide) dropping point-first, shattering at 280 ms. All ride fire(), so the guest sees them.

## BUNNY CLUB + LAST CALL + HORN OF LIGHT (2026-10-29, mondo: "yes please" to giving the newer races their own families and finishers, then "yep, looks good" to the list)
- Bunny Girl signature family `bunnyclub` (SPELL_FAMILIES, kind 'signature', unique 'bunny girl', glyph 🐰, first in
  RACE_FAMILIES['bunny girl']). Three rows at the top of RACE_ABILITIES['bunny girl'], ids bn*: Cocktail Hour (T1 anomaly,
  magic 80, range 3, Discord 2), On the House (T2 human heal 80, range 3, CD 2), Cut Off (T3 human physical 135, adjacent,
  ×1.5 vs Discord, applies nothing). Existing statuses/riders only; the tier rule holds. Her House Rules passive already
  makes her immune to Discord.
- VFX (three-vfx-effects.js "BUNNY CLUB", _BN colours): Cocktail Hour = pink drops + an ice cube + a cherry thrown, a pink
  splash ring and stars (no cocktail glass / tray model in R2, so no glass is drawn); On the House = a gold ring, bubbles,
  a cork pop and glitter; Cut Off = a pink heel arc + star flash. All through fire(), so the guest sees them.
- LAST CALL (FINISHERS['bunny girl'] sig `lastCall`, was the succubus's kissOfDeath): battle.js _FIN_DIRECTORS.lastCall
  (2200/3600/2400 ms) + `_sigLastCall3D` (exported sigLastCall3D) + `_FIN_STAGE.lastCall` + a gold _FIN_RAYS row. Beats:
  a dark casino floor; six of the HQ casino's own slot machines (`ThreeRenderer.hq.propPreview('slot_machine')`) rise in
  a ring and spin; the lens-side machine goes see-through; she walks in from outside the ring and raises a hand; every
  reel stops on the gold symbol; coins pour from the trays and pile into a heap over the victim; THE HOUSE ALWAYS WINS.
- HORN OF LIGHT (FINISHERS.unicorn sig `hornOfLight`, was the angel's rapture): _FIN_DIRECTORS.hornOfLight
  (2200/3800/2400 ms, own rays in `_FIN_RAYS_OWN`) + `_sigHornOfLight3D` + `_FIN_STAGE.hornOfLight`; `_FIN_WARM.unicorn`
  warms the white_cloud. Beats: a ring of the game's white clouds parts; a shaft of light (the energy shader rapture
  uses) comes down on the victim; the unicorn rears (castSkyward) with a glow on its horn (head bone), climbs into the
  clouds, then dives straight down the beam (castMelee); the victim rises on the horn into the light and fades; PURE.
- Proven in a VS CPU battle (Mount Shasta 10×10): Cocktail Hour 215 + Discord, then Cut Off "Combo! … ×1.5 harder" for
  511 (forecast ≈536), On the House cast; both finishers filmed in slow motion. Frames in
  /mnt/project-files/bunny-unicorn-finishers/.

## THE BLIGBLOG + THE SPY SIGNATURES (2026-10-29)
mondo OK'd the list ("yeah that works for now"). Both races had empty RACE_ABILITIES; each now has its own signature family
(kind 'signature', unique race key, first in RACE_FAMILIES). Existing statuses/elements/riders only; tier rule holds.
- Bligblog, "Take Me to Your Leader" (👾): Goop Ray (bbGoopRay, T1 alien/water, range 4, 70 magic, Slow 2), Gibberish
  (bbGibberish, T2 sonic AoE r1 range 3, no damage, Discord 2, CD 3), Zap Zap Zap (bbZapZapZap, T3 lightning, range 3,
  135 magic, x1.5 vs Slow / Discord, applies nothing).
- Spy, "Honey Trap" (💄): Lipstick Pistol (spyLipstickPistol, T1 metal, range 4, 80 physical, Bleed 2), Spiked Martini
  (spySpikedMartini, T2 poison look, range 1, Stun 1, CD 3), Garrote Watch (spyGarroteWatch, T3 metal, range 1, 150 physical,
  x1.5 vs Bleed / Stun, applies nothing).
- Finisher: Bligblog got FINISHERS 'bligblog' = Return to Sender (sig returnToSender, alien type). The Spy keeps Femme Fatale.

## THE STATS25 PASS (2026-10-29, mondo: "Surely all of this data together can point to at least one clear thing with each outliar race's stats or spell pool or indiviudal spells ... Please do another balance pass")
Read: STATS25 export (630 Arena matches, builds elves-02 / bbspy-01 / bnuni-01, all after PR #661) + STATS24. Write-up (doc):
https://claude.ai/artifact/GwRLGGxMmPQePu12eD12Hq
- POWER vs race WR r 0.56 (stats half 0.52, spells half 0.31); +100 POWER ≈ +4 pts; team POWER gap 600+ → higher team wins 84%.
- Builds: within a race the drafted loadout moves WR about ±2 pts (R count, T4 count, spell count, no-damage count); 488 spells
  tested in vs out (race-adjusted) gave 10 past 2 SE where chance gives ~22. The POOL matters: no-damage share of a race's pool
  r −0.45 (Arena score ignores heals / buffs / summons), live damage slots r +0.41. PR #661: 4 of 6 stat changes moved races,
  none of 17 spell changes did.
- Ghost: Incorporeal (immuneDamageType physical) is the cause (1,894 damage taken a game, least of all races; 642 Cube dmg).
  Decision card sent to mondo; NOT changed in this pass.
- Changes (rows carry "STATS25 PASS 2026-10-29"): Penance 150, Holy Water 100, Star Crossed 105, Pie in the Face 125,
  Ninefold Scratch 46 a hit, Noisy Cricket 155, Death Gaze 200, Chart Topper 185, Mic Drop 95, Crack the Whip 150, Talon Rake
  100, Stoop Dive 155, Tube Feet + Five-Armed Crush range 2 (text "within 2 tiles"), Shattered Mirror 140, Dosed 105, Ego Death
  225; trims Eternal Slumber 140, Soul Suck 85, Nightmare Pulse 110, Tail Sweep 70, Cataclysm Stomp 70. Stats: SPD 160 (move 4)
  Dinosaur / Minotaur / Sharkman; HP Ghoul 1060, Juggernaut 1520, King Kong 1620, Dragon 1020, Goblin 820, Priest 700; Mech ATK 155.
- Left alone: Police Officer (twin Time Cop reads 52/62: noise), Bligblog / Spy / Bunny Girl / Unicorn (new kits today), Gnome /
  Angel (dead slots = CPU work). Not lab-checked (mondo: "dont bother with the cloud lab").

## THE POWER REFIT (2026-10-29, STATS24 + STATS25, mondo: "make it more accurate and robust representative of the data, so it needs to include passives and all that")
- POWER = STATS (racePowerBudget on the raw statline) + PASSIVES (racePassivePower: the effective statline minus the raw one)
  + SPELLS (raceSpellPower: `loadout` × the AVERAGE spell of the pool, was the best 5). raceTotalPower(race, range, stats?)
  returns { stats, passives, spells, total }; the 3rd arg lets bake-power.js score a race on the statline an export played.
- data.js `racePowerStats(race, stats, range, omit)` turns passives + element affinities into stats (POWER_TRAIT_RULES):
  damage-type immunity cuts physShare (0.51) of incoming damage; each affinity cuts element share × elemPart (0.51) ×
  (1 − mult; absorb −1, weak 1.5); HP counts HP ÷ (1 − cut), cut ≤ 0.8. Ray Gun = basics on max(ATK, M.ATK); Point Blank
  ×1.3 on the reach it covers; Reach / Ray Gun +1 RNG, Longshot +2; lifesteal + share × basicDmgPerGame HP; Mad Genius
  +1 stage (20) per `every` rounds over half avgRounds; night forms × 0.5; low-HP dmg bonus on 20 % of damage. CALLS (not
  measured): half of "other" damage counted physical, nightShare 0.5, lowHpShare 0.2, longshot +2.
- STATUS IMMUNITIES COUNT 0: the 37 status-immune races sat −0.6 pts below POWER across both runs (no effect). Flying and
  JUMP added nothing held out either (left out). Respawn / door / cryptid / trail / reactor passives count 0 (no number).
- SPELLS = average of the pool because the lab fields a draw of it (fielded damage share vs pool damage share r 0.98).
  Within a race a loadout with more damage spells wins only a little more (+6-11 pts per 0 → 100 % damage share).
- Weights (`node bake-power.js <STATS25> <STATS24> <older…> --fit-stats`, fit on the newest 2, `--fit-on=N`): hp: 0.3, mp: 0.7, atk: 0.68, int: 0.94, def: 0.6, mdef: 0, spd: 1.7, vision: 0, crt: 0, range: 92,
  perPoint 78. Prior-ridge λ 0.1 on standardized columns toward the 2026-09-07 formula + perPoint 50, w ≥ 0, rows weighted by
  games, fixed scale 2500 pts = 100 % WR (+100 ≈ +4 pts). Target (median race) moved 976 → 1261 on the new scale.
- Held out (r vs teamAdjusted adjWr): shipped formula STATS25 0.567 (STATS24 0.676, in sample) → fit on STATS24 read
  STATS25 0.650, fit on STATS25 read STATS24 0.729; each race left out 0.624 / 0.697. Step by step (mean of the four held-out
  reads): shipped shape refit 0.601 → + average-of-pool spells 0.632 → + immunities/affinities as HP 0.669 → + the other
  passives 0.678. NOISE CEILING: 40 games a race (STATS25) caps any score at r ≈ 0.62 against that run; STATS24 (64 a race)
  ≈ 0.83; the two runs agree with each other r 0.55.
- Race Editor: STATS · PASSIVES · SPELLS · POWER columns, a PASSIVE POWER list (each item's points = the score with it minus
  without it) above SPELL POWER (now every pool spell). Balance Lab export base.passivePower. Screenshots
  /mnt/project-files/balance/power-refit/.

## THE STATS26 PASS (2026-10-29, mondo: "can we not just literally make everyone's power level the same? Or at least plus or minus 100 of the average/median? ... adjust a stat or 2 that makes sense (or currently doesnt make sense) for each unit", then "dont do it for every race, just the ones the balance lab data shows are weak or strong. dont change a race's stats if their win rate is near 50 %")
- Read: STATS26 export (504 Arena matches, builds powerfit-01 / treeplatecam-01 / latelook-01, all after PR #668 + #669). POWER from
  PR #669 read this run (never seen in its fit) at r 0.555; +100 POWER ≈ +3.1 pts here.
- Rebake: `node bake-power.js <STATS26> <STATS25> <STATS24> <older 3> --fit-stats --fit-on=3` (three runs in the fit now). Weights
  barely moved (hp .27 mp .76 atk .69 int .99 def .7 spd 1.7 range 82, perPoint 77); held out S26 .555 · S25 .651 · S24 .729. Median 1249.
- Who changed: a race whose STATS26 team-adjusted win rate is 42 % or lower / 58 % or higher (about one noise-width, ±8.8 pts at 32
  games, off 50) AND whose POWER is more than 100 off the median on the same side: 30 races. Races near 50 % were not touched; lab
  outliers whose POWER is in band (Honda Civic, King Arthur, Sheriff, Firefighter, Skeleton, Swamp Monster, Succubus, Police
  Officer, Door Agent, Chef / Swordfighter, Antperson, Golem, Goblin, Bee Queen, Pirate, Cosmic Wraith) or on the other side (Rabbit
  59 % at −204, Robot 40 % at +174) were left alone: that is what POWER can't see.
- How: HP + the race's own damage stat (ATK, or M.ATK when most of its damaging pool is magic), the gap split in half, landed at
  about ±75 of the median; move 5 → 4 (SPD 160, the STATS25 move) for fast strong races; move 2 → 3 (SPD 90) only for Shaman,
  Occulus, Hippie, whose HP + M.ATK could not close it. Caps: cuts ≤ 30 %, raises HP ≤ ×1.7 (or up to 1000), damage stat ≤ 200.
  Nephilim and Dragon hit the caps at +162 / +160; mondo then said: keep their unique spells, "cut spells from their shared
  spell families": RACE_SPELL_EXCLUDES drops Quake, Rockslide, Stone Drop, Ground Slam (Nephilim) and Vortex Slam, Eye of the Storm,
  Inferno, Meteor (Dragon), plus SPD 160→145 (still move 4) → +89 / +82 (pools 19 / 20). Own-spell damage trims were NOT shipped. Rows carry
  "STATS26 PASS 2026-10-29". Not lab-checked.

## THE STATS27 PASS (2026-10-29, mondo: "do another balance pass. i want an analysis on every tab in the breakdown and how the data can be used to balance the weakest and strongest units")
- Read: STATS27 export (587 Arena matches, all on build 20261029-stats26-02-cors = PR #673). Analysis page (every tab) is an Artifact
  linked from the thread; the numbers below are its headlines.
- PR #672/#673 WORKED: the 14 races cut in STATS26 went 64.1 % → 51.0 % and the 16 raised went 34.7 % → 51.0 %; the untouched
  races' run-to-run slope (0.47) predicted 56.6 % / 42.8 % from regression alone, so the stat changes moved them ~6 / ~8 pts.
  Single races swung far more than that (Hippie 32→62, Glitch 32→65, Tree Person 59→28, Sharkman 63→38): at 38 games a race the
  noise is ±8 pts (1 sd), and the true spread of race win rates is now only ~4-5 pts sd.
- Rebake: `node bake-power.js <STATS27> <STATS26> <STATS25> <STATS24> <older 3> --fit-stats --fit-on=4` (fit-on=4 read every run
  better held out than 3). Weights hp .28 mp .62 atk .61 int 1.06 def .56 spd 1.62 range 84, perPoint 77; held out S27 .44 · S26 .55
  · S25 .66 · S24 .74. S27 reads lower because the last pass squeezed 30 races into ±75 (less spread left for POWER to explain).
- Who changed (rule, flagged to mondo): a race unchanged since STATS26 counts on STATS26+27 pooled (~70 games) and changes when its
  90 % Wilson range is all on one side of 50 %; a race changed by PR #672/#673 counts on STATS27 alone and needs the 95 % range.
  → 8 weak (Tree Person, Jellyfish, Angel, Golem, Bligblog, Antperson, Seraphim, Voidweaver), 8 strong (Honda Civic, Undead, Bigfoot,
  Cyborg, Firefighter, Cowboy, King Arthur, Succubus). Glitch (65 %, S27 only, 90 % but not 95 %) left alone.
- How much: half the pooled gap to 50 % (the regression-to-the-mean share), at 100 POWER ≈ 4 pts; capped at 200 POWER; races
  where POWER and the lab agree and POWER stays >100 off go on to ±75 (Angel, Seraphim). Which stat: the Races-tab detail picks it
  (survival → HP/DEF; damage/kills → ATK/M.ATK by the pool's damage type; move/dry turns/Cube damage → SPD; casts a game → MP; utility
  cast share + no-damage pool → RACE_SPELL_EXCLUDES of SHARED no-damage spells only, never tree rungs, default-kit or unique spells).
- Rows carry "STATS27 PASS 2026-10-29". Not lab-checked.

## THE STATS28 PASS (2026-10-29, mondo: "analyze and balance", with ew-balance-stats28.json)
- Read: STATS28 export (1,499 Arena matches, ~97 a race; builds zonemove-01 1,346 / chessset-02 76 / hwcoffins-01 77, all after PR
  #674 and all before PR #681, so Trick or Treat's AoE damage + heal is NOT in this data; Jack o Lantern 44 %, not touched). The
  Crystal Guardian gems (#664) and Machine Elves prisms (#663/#665) were already in STATS25-27. Analysis page linked from the thread.
- PR #674 WORKED and the raises OVERSHOT: the 8 raised races 32.7 % → 54.5 % (regression alone predicted 42.8 %), the 8 cut races
  62.4 % → 49.5 % (predicted 55.1 %). Golem 34 → 68, Angel 29 → 63, Tree Person 28 → 61. Untouched races S27 → S28 slope 0.42, r 0.45.
  True race spread ~5 pts sd vs 5.1 pts binomial noise per run.
- CALIBRATION (new): on those 16 races a stat change moved win rate ~5 pts per 100 POWER (raises and cuts alike) once the two
  move 1 → 2 races are left out; POWER's own cross-section says ~3.4. Move 1 → 2 (Golem, Tree Person) was worth ~+20-25 pts on
  ~140 POWER, far more than POWER prices it. So this pass sizes at 20 POWER per point of the half-gap and changes NO move.
- Rebake: `node bake-power.js <STATS28> <STATS27> <STATS26> <STATS25> <STATS24> <older 3> --fit-stats --fit-on=5` (fit-on=4 put 1.26 on
  VISION, 5 kept it 0 and read S27/S26/S25 better held out). Weights hp .28 mp .3 atk .56 int .99 def .27 spd 1.35 range 68, perPoint 65;
  held out S28 .49 · S27 .40 · S26 .54 · S25 .65 · S24 .71. PR #674's POWER read S28 (fresh) at .49. Median 1010.
- Who changed (same bar as STATS27, flagged): unchanged since STATS27 → STATS27+28 pooled (~135 games), 90 % Wilson range off 50; changed
  by PR #674 → STATS28 alone, 95 %. 17 strong, 12 weak; Ghost (61 %) left alone again (its Incorporeal card is still open). A 95 % bar
  everywhere would drop Gangster, Fallen Angel, Cult Leader, Annunaki, Time Cop, Reptilian, Bee Queen (their changes are the smallest).
- SPELLS FIRST: own (one-race) damage spells with 20+ casts at ≥ 1.25× (strong race) or ≤ 0.8× (weak race) their tier's median damage a
  cast: The Last Trumpet 160→135, Birch Switch 85→75, Host-Fetter 70→60, Valkyrie Spear 100→85, Divine Swoop 125→110, Morning Star 170→150;
  Tongue Lash 80→95, A Thousand Stings 10×30→10×36, Lure 80→95, Tether Line 100→120, Space Laser 90→110, Cocktail Hour 80→95,
  Unicorn Charge 135→160 (desc damage words updated where the band changed). Thrall Bite (0.56×) left: its power is the possess.
- Then stats on 28 races (comments "STATS28 PASS 2026-10-29"), cuts ≤ 30 %, damage stat ≤ 200, no move change, by the Races-tab detail;
  Gnome ATK 39→140 (all 5 of its damage spells are physical) + Free Energy excluded (pool 13 → 12). Not lab-checked.
- Watch next run: Golem/Angel/Tree Person (second correction), Vampire/Mantid/Tree Person read 100-200 over the POWER median now
  (POWER can't see survival on low HP), Machine Elves never cast Tune Frequency / Shatter the Lattice (AI use, not a number).
## THE STATS29 PASS (2026-10-30, mondo: "analyze and balance please", with ew-balance-stats29.json)
- Read: STATS29 export (756 Arena matches, ~48 a race; builds stats28-01 248 / chesspiece-04 405 / aitrain-01 103). ALL after PR #684
  (STATS28) and after PR #681 (Trick or Treat), so Jack o Lantern counts on STATS29 alone (48 %, left alone). 653 matches are on the
  old AI, 103 on the PR #692 AI; the strong/weak split held on the new AI (strong group 58.5 %, weak 40.3 % in those 103). data.js
  only changed for the Chess Piece between those builds (#685/#691: 32 games, all with the SP-cost pieces).
- PR #684 RESULT: the 12 raised races 38.6 % → 51.2 % (regression alone predicted 44.4 %), landed. The 16 cut races 61.7 % → 46.8 %
  (predicted 57.8 %), overshot. Golem 68 → 38, Angel 63 → 36, Tree Person 61 → 38 (each the second swing: these three move ~15-20 pts
  per 100 POWER, 2-3× the rest). Measured this time ≈ 9 pts per 100 POWER (STATS28 measured 5); this pass sizes at 7.
- NOISE (new): untouched races S28 → S29 r .33; true race spread ≈ 4 pts sd (S28/S29 covariance). One 48-game run is only ~20-25 %
  signal, so a race changed last pass (one run since) gets about a quarter of its gap, not a half — this is what made the see-saw.
- Rebake: `node bake-power.js <S29> <S28> <S27> <S26> <S25> <S24> <older 3> --fit-stats --fit-on=6` (fit-on=5 put 3.1 on VISION; 6 kept
  it 0 and read the older runs better held out). Weights hp .27 mp .14 atk .53 int 1.0 def .1 spd 1.3 range 63, perPoint 59; held out
  S29 .29 (its ceiling is ~.45) · S28 .48 · S27 .41 · S26 .53 · S25 .65 · S24 .71. Median 1008 → 918 (scale only).
- Who changed (flagged): each race counts on every run since its stats last changed (S27-29 pooled ~183 games, S28+29 ~145, or S29
  alone). Bar: 90 % off 50 on the pooled runs, 95 % for S29 alone. Ghost (63 % pooled, the strongest) left alone: its Incorporeal
  card is still open. Jack o Lantern left (Trick or Treat). Golem / Angel / Tree Person miss the 95 % bar on one run and were left
  alone so they don't swing a third time.
- How much: the race's likely TRUE gap = pooled gap × signal share (τ² 0.0018 over τ² + noise; ~0.65 pooled 3 runs, ~0.25 one run),
  then 100 POWER per 7 pts. HP + the pool's damage stat, M.ATK where the pool is magic on a low M.ATK (Firefighter 34, Bee Queen 86,
  Starfish 119), cuts ≤ 30 %, damage stat ≤ 200, no SPD / move change, no DEF (its weight is .1 now).
- SPELLS FIRST (own spells, 20+ casts, over 1.25× in both S28 and S29 on a strong race): Every Eye at Once 5×50 → 5×40, Crystal
  Resonator 110 → 95, Piercing Arrow 110 → 95 (the last two MEDIUM → WEAK in their descs). No weak race had an own spell under 0.8×
  with 20+ casts.
- Stats on 28 races (comments "STATS29 PASS 2026-10-30"): weak Professor, Anubis, Starfish, Clown, Firefighter, Priest, Dragon,
  Bee Queen, Chess Piece, Grey, Mime, Mech; strong Demon Princess, Atlantean, Giant, Occulus, Dreameater, Dinosaur, Catgirl,
  Robin Hood, Minotaur, Crystal Guardian, Superhero, Unicorn, Demon, Mummy, Scarecrow, Sidekick. Not lab-checked.
- Watch next run: Golem / Angel / Tree Person (one more run decides them), Unicorn (+143 → 65 %, now −52), Chess Piece (32 games),
  Mech (60 % in S29 but 45 % pooled).

- PASS 2 (same day, mondo: "dont skip them if they are weak, wtf. the whole point is to balance. if it seesawed then clearly you need
  to try something different"): EVERY race at ≤ 40 % or ≥ 60 % in STATS29 now changes, skipped ones included (rows "STATS29 PASS 2").
  Size = the larger of the pooled estimate and a quarter of the STATS29 gap, 100 POWER per 7 pts. Golem / Angel / Tree Person sized on
  their OWN measured swing (~17 pts per 100 POWER, 2-3× the rest): +76 POWER each, about half the STATS28 cut back, landing between
  the two statlines. Ghost cut M.ATK 143→110, HP 590→460 (−117 POWER; Incorporeal already counted in POWER; undo part of it if mondo
  picks "physical spells land on Ghost"). Mech's pass-1 raise undone (60 % in STATS29). Others: Djinn, Martian (M.ATK 67→130),
  Cowboy, Hippie, Black Goo, Barbarella up; Telepath, Swordfighter, Gargoyle, Bigfoot, Vampire, Ki Fighter down. Not lab-checked.

## THE STATS30 PASS (2026-10-30, mondo: "analyze and balance", with ew-balance-stats30.json)
- Read: 901 Arena matches; 792 on build battlemap-02 (live data.js = origin/main, all after PR #693 + #694, new AI v4.20) are the
  data. The 109 on battlemap-01 are the export's "stale" matches (the CDN held an older data.js under that token, PR #699) and are left out.
- PR #693 + #694 RESULT: the 20 raised races 38.7 % → 50.3 %, the 23 cut races 60.3 % → 51.4 %: both groups landed near 50. Untouched
  races regress hard (S29 ≥ 55 % went 57.4 → 50.4, ≤ 45 % went 42.8 → 46.6), so one run is mostly noise: Fairy 61 → 36 with no change.
  Measured ≈ 3-6 pts per 100 POWER; this pass sizes at 6. Seesaws: Cowboy 35 → 64, Occulus 53 → 40. No move: Ghost 67 → 64 (third cut),
  Crystal Guardian 67 → 69, Dinosaur 63 → 60, Chess Piece 31 → 35, Grey 43 → 37.
- Rebake: `node bake-power.js <S30> <S29> <S28> <S27> <S26> <S25> <S24> <older 3> --fit-stats --fit-on=7` (fit-on=6 put .45 on VISION,
  5 put 1.51). Weights hp .26 mp .09 atk .53 int .97 def .14 spd 1.22 range 60, perPoint 56; held out S30 .37, S29 .28. Median 919 → 878 (scale).
- Who (mondo's rule, no skips): every race at ≤ 40 % or ≥ 60 % in STATS30, plus every race 90 % off 50 on its pooled runs since its
  last change (Jack o Lantern 43 % over 3 runs, Goblin 44 %). 29 races. Races whose last change went the right way but did not get
  there (Ghost, Crystal Guardian, Dinosaur, Chess Piece, Grey) pool STATS29 + 30.
- How much: pooled gap × signal share (τ² .0016: .25 one run, .39 two, .56 three), 100 POWER per 6 pts, at least 40 POWER, so every
  flagged race moves. HP + the pool's damage stat (≤ 20 % a pass), DEF ≤ +40.
- A DIFFERENT LEVER where the last one failed or seesawed (flagged): Ghost SPD 125 → 87 = move 3 → 2 + shared System Crash excluded
  (Incorporeal kept); Crystal Guardian ATK + HP + shared Quake, Rockslide excluded; Dinosaur shared Quake excluded; Chess Piece DEF + HP
  + shared Royal Decree excluded (its moves ignore SPD); Grey DEF + 4 shared no-damage spells excluded; Bunny Girl ATK (4 of its 7 damage
  spells are physical) instead of M.ATK; Ice Queen SPD 16 → 40 (still move 1) + HP; Cowboy / Occulus a smaller step back.
- Stats on 29 races (comments "STATS30 PASS 2026-10-30"): up Mermaid, Necromancer, Bligblog, Chess Piece, Fallen Angel, Fairy, Bunny
  Girl, Ice Queen, Grey, General, Mothman, Rabbit, Sharkman, Occulus, Jack o Lantern, Goblin; down Dinosaur, Mantid, Popstar, Police
  Officer, Juggernaut, Jellyfish, Nephilim, Antperson, Symbiote, Skeleton, Ghost, Cowboy, Crystal Guardian. No unique spell touched.
  Not lab-checked.

## THE STATS31 PASS (2026-10-30, mondo: "Newest balance lab, please analyze and balance", with ew-balance-stats31.json)
- Read: 458 Arena matches, every one on build 20261030-stats30-01 (= PR #700's data.js, AI v4.20), no stale matches. About 29 games a race.
- PR #700 RESULT: the 16 raised races 37.0 % → 50.6 %, the 13 cut races 62.4 % → 52.8 %. BUT the untouched races came back just as
  far on their own (S30 ≥ 55 %: 57.4 → 52.1; ≤ 45 %: 42.9 → 50.7) and an untouched race's STATS30 rate predicts its STATS31 rate at
  slope .04 (nothing). So this run can't measure a single change: the real race spread is now about 2.7 pts sd (τ² .00074) against
  9 pts of noise at 29 games, and POWER's held-out read on STATS31 is r .12. One 458-match run is mostly luck; ~1,500+ a run is
  needed to see a 5-point race.
- Named: Ghost 64 → 50 (move 3 → 2 worked), Crystal Guardian 69 → 47, Dinosaur 60 → 45, Occulus 40 → 48, Ice Queen 36 → 50,
  Bunny Girl 36 → 48. Seesaws: Chess Piece 35 → 62, Grey 37 → 60, Nephilim 63 → 31, Antperson 63 → 40. Did not move: Popstar
  61 → 73, Skeleton 63 → 69, Juggernaut 61 → 67, Fallen Angel 35 → 31, Jack o Lantern 41 → 37. Cowboy 64 → 60 (right way, short).
- Rebake: `node bake-power.js <S31> <S30> <S29> <S28> <S27> <S26> <S25> <S24> <older 3> --fit-stats --fit-on=8` (no VISION weight).
  Weights hp .25 mp .12 atk .51 int .88 def .12 spd 1.25 range 56, perPoint 54; median 878 → 849 (scale).
- Who (mondo's rule, no skips): every race at ≤ 40 % or ≥ 60 % in STATS31 (41 races) + every race 90 % off 50 pooled since its last
  change (Starfish, Politician, AI, Door Agent, Juggernaut, Skeleton, Popstar, Nephilim, Fallen Angel). 42 races, 19 up, 23 down.
- How much: same rule as STATS30 (pooled gap × τ² .0016 share, 100 POWER per 6 pts, at least 40 POWER), half HP and half the pool's
  damage stat (ATK if most damage spells are physical, M.ATK if magic; ≤ 20 % a pass, 200 cap, the rest to HP). Races whose pooled
  read is near 50 (Swamp Monster, Ringmaster, Vampire, Honda Civic, Quarterback, Undead, Machine Elves) get only the 40 minimum.
- A DIFFERENT LEVER where the STATS30 change did not move it: Popstar DEF 110 → 80 + M.DEF 140 → 115; Skeleton DEF 106 → 85 +
  M.DEF 137 → 110; Juggernaut DEF 155 → 125; Fallen Angel DEF 27 → 60 + shared Contract, Soul Bind excluded; Jack o Lantern shared
  Haunt, Cold Spot excluded. A SMALLER STEP BACK on the seesaws (about half the STATS30 step): Chess Piece HP 1570 → 1440, DEF
  170 → 155; Grey HP 950 → 870, DEF 65 → 45; Nephilim HP 1040 → 1120, ATK 77 → 88; Antperson HP 1620 → 1680, M.ATK 109 → 120.
- Comments "STATS31 PASS 2026-10-30" on every changed row. No unique spell touched. Not lab-checked.

## THE CHESS PIECE (2026-10-29, mondo: "add a character that plays as the chess pieces, with it switching to different pieces depending on the spell ... use this chess dragon with custom animated individual parts for the chess player's finisher")
- Race `'chess piece'` (label Chess Piece, anomaly, bruiser, home The Looking-Glass, 300 credits). Looks: the black pieces of R2 `Assets/chess/Low Poly Chess Set.fbx` through the shared chess loader (three-renderer.js `_chessClone`, PR #678). sprites.js `CHESS_PIECE_3D[piece]` = one def per piece, `procRig: 'chess<Piece>'` (three-renderer.js `_chessUnitBuild` + `_CHESS_POSES`: hops, a lean, a topple for death; the board colour is lifted to `0x5c5664` because the file's near-black vanished on dark squares). 2D/portrait = the chess glyph (`chessPieceLook`, a canvas data URI); no 2D art.
- Six inherent spells (data.js RACE_ABILITIES, `chessPiece: <piece>`, kind `tackle`, `chargeToTarget`, `pushDistance 1`, `families: ['chess']`), always known, listed in SPELLS (map.js createUnit keeps them visible). Casting one makes the unit that piece (`unit._chessPiece`, `UNIT_ANIM_OVERRIDES['chess piece'].castSprite` → the piece's look). Starts and respawns as the pawn (resetUnitPowerState).
- battle.js chess block (before getMoveTiles): `chessPattern`, `chessMoveTiles`, `chessMovePath`, `chessCaptureSquares`, `chessAttackTiles`, `chessCanCapture`, `chessLineTiles`, `chessStrikeSquare`. Movement: pawn 1 straight (any of 4 ways, no "forward" on this board), knight L leap, bishop diagonals, rook straight lines, queen both, king 1 any way; sliders unlimited on the first move, capped by the halved second-move reach; any body blocks a line (allies too); walls/towers/doors block; no Jump, no Climb; rooted = no move; Clash uses the normal rules. Capture: the FIRST body on each line of the piece's pattern (pawn captures diagonally 1, as in chess), enemy only, must be in sight (fog gate). The piece strikes, the victim is pushed 1 along the line by the shared resolveForcedSlide (the shared push rules can add more for light bodies) and the piece takes its old square; a kill = the piece takes the victim's square. No range falloff on piece strikes. Range overlay = `chessLineTiles`; aim gate = `_spellAimReach` chess branch, so the CPU (spellAimProblem) only casts real captures.
- Numbers (my calls, flagged to mondo): Pawn T1 25 MP 130 dmg (the strongest), King T1 25 MP 105, Knight T2 50 MP 120, Bishop/Rook T2 50 MP 105, Queen T3 75 MP 110; stats hp 1200 mp 200 atk 135 def 130 mdef 70 int 40 vision 3 crt 16 spd 110; element earth on the piece spells.
- CHECKMATE (RACE_FINISHERS sig `checkmate`): battle.js director `checkmate`, three-vfx-effects.js `_sigCheckmate3D` (`_FIN_STAGE.checkmate`, `_FIN_WARM['chess piece'] = ['chess:set']`). The pieces fly up off the board into mondo's chess dragon behind the chess piece: knight head + king's crown + one red eye, a rook spine, bishop/pawn neck, pawn arms and legs, rook wing bones with queen fingers, a nine-piece tail ending in a pawn; every part is its own joint (wings beat, tail swings, neck sways, arms reach). It rears, dives head first, the victim tips over like a resigned king, the dragon falls apart into bouncing pieces. No set = no dragon, the director's beats still play.
- Proven: VS CPU (Rook capture + look swap), the forge preview of Checkmate, the CPU planner (legal pawn steps, a King capture ranked when open), online host + guest (guest pawn step, guest Knight capture, the knight's L moves on the guest).
- 2026-10-29 follow-up (mondo: "why dont his spells cost sp? also he has way too many spell families now"): the six pieces are no longer inherent. They are ordinary rows of the race's Chess family (slot + SP by tier: Pawn/King 1, Knight/Bishop/Rook 2, Queen 3), out of RACE_INHERENT_SPELLS and RACE_SPELL_EXCLUDES. RACE_FAMILIES 'chess piece' = chess, royalty, knight (Holy Defense and Living Stone dropped; 3 = the fewest any race has, asked mondo). RACE_TREE = Pawn, Knight, Rook, Queen. A unit that equips no pawn still starts as the pawn (movement).
