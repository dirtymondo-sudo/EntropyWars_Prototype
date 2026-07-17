# Entropy Wars — Playtest Engineering Notes

Reverse-engineered notes so any future session can drive the game without
rediscovering it. The game is a browser Tactical-JRPG PvP; the server is just
matchmaking/relay — all gameplay logic is client-side.

## AI SCHEMA 12: weight prune + intent layer + CPU difficulty (2026-07-16, LATEST) — ai.js, ainew.js, battle.js, ui.js, map.js, index.html

Audit of the gen-100 training export (5652 matches, champion WR 49% = no
measurable gain) found most of the 45-weight table untrainable, so the AI got
restructured rather than re-tuned:

- **Weight table pruned 45 → 15** (`AI_WEIGHT_DEFAULTS`, schema 12). Deleted
  outright: the 7 `jump*` weights + `enemySpawnZonePenalty` — referenced by NO
  code anywhere (phantoms from a removed jump-action system). Frozen as
  constants in ai.js `AI_TUNE` (hand-tunable design knobs, trained values):
  everything pinned at a range edge or flat across every experiment
  (mpPotionPriority, towerLow/Mid/Clear push, marked/hourglass target bonuses,
  whiffRiskPenalty, reshape*/move-height/fly* family, recall, earlyExplore,
  safeAllyProximity, hgCarrierFleeAdv, level mods). Trainable keys that remain
  all have a live code path and room to move; `engageAdvantage` range widened
  to [-1.0, 0.3] (gen-100 slammed the old floor twice), `comboSynergyBonus`
  max 25→40 (kept leaning on the ceiling), `hgSeekPriority` default 0→8.
- **Dead code fixed**: `nearLevelUpBonus`/`levelAggressionMod` gated on
  `unit.level`/`g.xpForLevel` which never existed — never fired once. Now use
  `getUnitLevel`/`getXPProgressPct`/`xpProgressionActive` (exported), apply in
  progression modes only. Also `c.type === 'tower_attack'` in the final
  chooser (real type `attack_tower`) — the "winning → press tower" bonus
  never fired; fixed.
- **pickMoveGoal is now an intent layer** (the XCOM shape): every applicable
  goal (ctf/hotspot/domination/nexus/hg/tower/defend/retreat/engage/explore)
  is pushed as a scored candidate and argmax wins — previously a first-match-
  wins if/return ladder where branch ORDER decided and several weights were
  unreachable. Two deliberate behavior changes: Domination zones stay a
  candidate mid-fight (−15 when enemies visible) instead of being abandoned
  the moment a fight starts; TDM hunt scores 16 (below retreat 20) at combat
  disadvantage so outnumbered units stop feeding kills. Chosen intent is
  stamped on `unit._aiLastIntent` for debugging.
- **CPU difficulty** (`window._ewSetAiDifficulty('easy'|'normal'|'hard')`,
  persisted `ew-ai-difficulty-v1`, UI in pause-menu Controls tab + main-menu
  Settings): capability ladder, zero stat cheats. Easy = stock ai.js only
  (ainew focus-fire/press/CC overlay bypassed), no combos, no press-refund
  scoring, softmax-samples among top-3 candidates. Normal = unchanged trained
  AI. Hard = objective persona — `_OBJECTIVE_INTENTS` movement goals ×1.3 so
  it presses towers/zones/hourglasses/flags instead of kill-trading (the
  gen-100 self-play optimum is kill-trading; Hard deliberately overrides it
  for pressure). AI-vs-AI harnesses (devAutoSim) always run at normal so
  training/strength-test numbers stay comparable.
- **Trainer statistics fixed**: the 55%-WR "lean" adoption tier is gone (at
  n=60 that's inside one sigma of a coin flip — it random-walked the champion;
  healPotionHpPct went SPRT-high gen 4 and SPRT-low gen 96). Only SPRT calls
  or ≥60% full-batch adopt now. Persistence bug fixed: `_finalizeExperiment`
  saved the finished experiment as `current`, so every reload replayed and
  re-adopted it (the gen 60-64 "Mana Potion ×5" ghost generations); saves now
  happen after the next experiment is staged + progress persists per match.
  Campaign `_challengeAiMult` no longer scales `noMult` threshold weights
  (heal %/engage advantage — scaling those is non-monotonic in difficulty).
- Old `ai-weights-v11` localStorage is orphaned by the schema bump (defaults
  ARE the gen-100 champion, so nothing is lost). Weight import skips unknown
  keys, so old export JSONs still load partially.

## FLYER MOVEMENT WYSIWYG: takeoff folded into doMove + grounded-flyer jumps (2026-07-16, LATEST) — battle.js, hud.js, ui.js, online.js, index.html
Token `20260716h`. User bug: flyer move preview showed a destination, the click
took off (burning 1 AP) and then the move failed / landed somewhere else.
Root causes + fixes (all four had to land together):
- **getMoveTiles takeoff fan-out was a hand-rolled scan** (flat cost 1/tile, no
  `objectBlocksEdge`, no diagonal corner-cut check, altitude = raw
  `getMinFlyingZ` ignoring the collision-climb doAltitudeChange does). Now it
  resolves the REAL takeoff altitude via shared `_resolveTakeoffZ(unit)`
  (battle.js, above canChangeAltitude — also used by doAltitudeChange), parks
  the unit there and RECURSES into getMoveTiles' own airborne scan, so teal
  tiles are by construction exactly what the post-takeoff move can reach.
  Columns already walk-reachable are skipped (1 AP beats 2).
- **Takeoff now happens INSIDE doMove**: a `_takeoff` matched tile triggers
  doAltitudeChange('ascend') + re-entry (battle.js doMove, right after the
  z-matching block). clickTile / hud "Take Off + Move" card simplified to plain
  doMove calls; the old two-step in clickTile ran doAltitudeChange guest-locally
  ONLINE and desynced (doAltitudeChange was never relayed!). online.js now also
  wraps doAltitudeChange (engine-wrapper pattern) + dispatcher case for the
  standalone Take Off / Land menu verbs.
- **Grounded flyers can JUMP now** (user request): getJumpTiles/doJump only
  reject AIRBORNE flyers. Main-scan climb legs are `_jump` for everyone —
  previously a grounded flyer's climb tiles were mislabeled `_takeoff`, and the
  executor's real takeoff (min clearance 2) could never land on the previewed
  ground surface.
- **findMovePath empty-path teleports**: an airborne dest z is route-derived
  (clearance clamps), so caller z vs search z could disagree → `[]` → the unit
  SLID/teleported instead of flying. findMovePath now falls back to the
  cheapest reached node at the dest column for airborne movers.
- Visuals: doAltitudeChange tweens the rise/descent via ThreeAnim.walkPath
  (1-node path) instead of teleporting to altitude; takeoff+move prepends the
  vertical rise to the glide via `state._takeoffRiseFromZ` (set by doMove,
  consumed once by animateWalkPath, 3D renderer only, added to online.js
  serialize skip-list). Hover preview for teal tiles draws rise+glide at
  flight height from the same `_resolveTakeoffZ` sim, ghost at the real
  airborne z.
- Also fixed: 2-AP walk+walk executor (and its hover/ring-2 previews) took
  ring-2 `_jump`/`_takeoff` tiles on faith — could slide a flyer to altitude
  without paying/animating the takeoff. All three now filter to plain walks.
- Gotcha for future sessions: ANY divergence between a preview scan and the
  executor's re-scan = player betrayal. Prefer "simulate by mutating unit.z +
  reuse the same function" over duplicating Dijkstra loops.

## DAMAGE FORMULA REWORK: capped multiplier product + range profile + passives audit (2026-07-16) — battle.js, ui.js, index.html
Token `20260716a`. The damage pipeline is now explicitly two halves:
- **Caster side — `computeSpellBase(spell, spellPower, {baseDmg, floor, variance})`**
  (battle.js, right above `_applyDamageSpellHit`): replaces every hand-rolled
  `max(32, dmg + spellPower + randInt(40)−16)`. Variance is now SYMMETRIC
  `±SPELL_DMG_VARIANCE` (=8, was −16…+23 ≈ ±13% swing) — flavor only, per the
  no-big-RNG design goal. Basic attacks (doAttack, RT arena, tower/turret
  swings) use the same ±8. Floors preserved per site (16/24/32).
- **Defender side — `applyDamageToUnit` rework**: all offensive multipliers
  (STAB×matchup, high-ground, RANGE PROFILE, `bonusVsStatus` combo, elemental
  combo/zodiac resonance) now ACCUMULATE into one product `_offMult`, capped
  at `MAX_OFFENSIVE_MULT = 3.0`, applied ONCE **before** armor. Previously the
  elemental layer multiplied the post-armor number (defense evaporated on the
  biggest hits) and the stack could compound past ×5 → guaranteed one-shots.
  Penalty products (<×1) are deliberately uncapped. Marked is now a flat rider
  added AFTER the product (card value = hit value). Defender height advantage
  (−5/step) moved to the armor stage so it stays truly flat.
- **🎯 RANGE PROFILE (new, deterministic — damage, NOT accuracy)**:
  `getRangeDamageMult(source, target)` (battle.js, next to the HIGH_GROUND
  consts; exported on GAME). Sweet spot 3 tiles: +10%/tile closer (cap +20%
  point-blank), −10%/tile farther (floor −20%). **Snipers invert** — this IS
  the previously-uncoded Bullet Drop passive: 0.6 at dist 1, +0.15/tile,
  1.2 at 5+. Applies to basic attacks AND spells; skipped for `damageType
  'dot'` and `opts.noRangeMult` (turret shots, traps/mines, bombs/explosion
  objects, terrain conduction/oil/crystal reactions, laser beams/lattice,
  censer lashback, block-erupt — anywhere caster distance is meaningless).
  Callouts: `🎯 BULLET DROP ×N` / `⚔ CLOSE RANGE ×N` / `↘ LONG SHOT ×N` over
  the attacker. Two FIELD MANUAL tips added.
- **Passives audit** (data.js JOB_PASSIVES text vs code) — wired the missing:
  Bulwark (Warrior −8 flat, armor stage), Brute Force (Raider basic ×1.2, TB
  + RT), Arcane Surge (`getJobPassiveSpellBonus` +8 into both spellPower
  assemblies), Grace +2 heal/revive range + Crescendo Lullaby +1 (both in
  `getEffectiveSpellRange`), Crescendo ally-buff +1 turn (applyStatusPayload,
  next to Third Eye), Tinker turret +1 range (TB + RT deploy) & Repair ×1.2.
  Already coded before: Deadeye (+1 SPD via JOB_MODIFIERS), Grace +24 heal
  (map.js healBonus), Field Operative, Third Eye, Green Thumb, Riposte,
  werewolf Nocturnal (sleep affinity → getEffectiveAttackBonus).
- **Forecast parity**: ui.js `_estimateBasicAttackDamage` /
  `_estimateSpellDamage` mirror the new pipeline (capped product, range mult,
  Brute Force, Bulwark, Arcane Surge, known bonusVsStatus) so the confirm-step
  preview stays "the contract if it lands".
- **Online**: all engine-side (host-authoritative); feedback rides the same
  relayed primitives as the existing HIGH GROUND callouts. No new state keys.

## GUARD+OVERWATCH & CONFIRM DAMAGE FORECAST (2026-07-15) — battle.js, ui.js, hud.js, online.js, three-renderer.js, styles-animations.css
Two tactical-JRPG staples, kept deliberately simple (token `20260715j`):
- **Guard now includes Overwatch** (the XCOM reaction shot, folded into the
  existing 2 AP Guard stance instead of a new verb). `doGuard` (ui.js) sets
  `unit._overwatchArmed = true` next to `_guardCounterBonus`; new
  `checkOverwatchTriggers(mover)` + `_fireOverwatchShot` (battle.js, right
  above doMove) fire ONE reaction shot at the first ENEMY that *finishes* a
  move or jump inside the guardian's attack range. Hooks: doMove (next to
  checkTrapTrigger) and `_doPostJump`. Gates mirror a real attack: combatDist
  ≤ getEffectiveRange, `isRangeBlockedByTerrain` LOS, `isInVision` fog, and
  camouflaged (`invisible` w/o `marked`) movers slip past. Damage =
  `getCounterDamage` (same reduced formula as melee counters: no crit, no
  dodge), XP_COUNTER, physical, via applyDamageToUnit. Disarmed by firing,
  by the 'guarding' status ending, and at the same three round-reset sites
  that zero `_guardCounterBonus` (search `_overwatchArmed = false`).
  - **Deliberate scope**: triggers on move END only (not mid-path pass-bys) —
    predictable, readable, no walk-anim interrupts. Forced displacement
    (push/pull), teleports and flight altitude changes do NOT trigger it.
  - **Online**: engine-side ⇒ host-authoritative like traps; speaks through
    relayed primitives (showFloatingTextForUnit→floating-text, playSfx→sfx,
    HP via state-sync). The projectile/attack anim is host-local — same
    parity level as melee counters. ALSO: `doGuard` was never wrapped in
    online.js (guest Guard ran locally and rolled back on the next sync — a
    real desync bug); it now has the standard guest-emit wrapper + a
    `doGuard` case in the game-action dispatcher.
  - AI: ai.js already calls `g.doGuard` — AI guards auto-arm overwatch. The
    AI does NOT yet path around enemy overwatch (future: feed into threat map).
- **Confirm-step damage forecast** ("the contract if it lands"): while a
  target is armed for confirm (`state.pendingTarget`, both hover-arm and
  click-arm), the slice of HP the action would remove **blinks white** on
  (a) the target's 3D nameplate HP bar and (b) the target-drum row's HP bar,
  plus a red `≈−34` chip on the armed blade. Deliberately does NOT reveal
  dodge/counter/crit — risk stays (author's design call).
  - ui.js: `_estimateBasicAttackDamage` (new, mirrors doAttack's roll at the
    randInt midpoint +4) + `predictDamageToUnit(attacker, target, spell?)`
    (wraps `_estimateSpellDamage`/the new attack estimator, then status
    damage-taken mults + shield soak + clamp to hp; 0 for invulnerable) +
    `getPendingDamagePreview()` (resolves pendingTarget → {unitId, dmg,
    lethal}, memoized; on `window`). Spells use `pt.tool || selectedTool`;
    non-damaging spells/allies → null.
  - three-renderer.js: `_updateDmgPreviewPlates()` runs EVERY frame (right
    after `_updateSanctuaryWallPulse()`) because pendingTarget doesn't bump
    the unit serial — `_patchPlateStats` alone can't drive it. Injects/
    removes a `.tp-dmg-preview` div in the plate's HP bar (inserted before
    `.tp-bar-num` so the number stays readable).
  - hud.js: `_hrlgTargetBlades` computes `previewDmg` for the pending blade;
    `HorologeBlade` renders `.hrlg-thp-preview` inside `.hrlg-thp`.
  - CSS: `.tp-dmg-preview`/`.hrlg-thp-preview` + `dmgPreviewBlink` keyframes
    in styles-animations.css (global sheet — reaches plate DOM and drum).
    Lethal forecast tints kill-red (`.dmg-preview-lethal`).
  - Viewer-local by construction: pendingTarget is in the serialize skip
    list AND `_guestUIKeys`, so the preview never syncs (RULE #2 safe).
  - Known v1 limits: single armed target only (no AoE splash preview), no
    preview on item/bane throws, Chivalry `_guardedBy` redirect not shown.

## AP ECONOMY REWORK: 2 AP turns + damaging actions end turn + one +2 press + once-per-turn abilities (2026-07-15) — battle.js, hud.js, data.js
The turn economy changed from "3 AP, everything costs 1-2" to:
- **`UNIT_MAX_AP = 2`** (battle.js). Moves still cost 1 AP each (max 2 moves/turn).
- **Any attack or DAMAGING spell cast ENDS the turn**: new `spendAllAP(unit)`
  (next to `spendAP`) zeroes the pool. Converted sites: doAttack ALL branches
  (unit, tower, mirror, turret, deployed obj, seed, tree chop, terrain smash),
  doSpell `finishAction` (gated on `spellDealsDamage`), the early
  spell-vs-turret/deployed paths (~line 1570), doComboAttack (initiator;
  partner still pays 1 from its own pool), doEntropyStrike.
- **NON-damaging spells/abilities do NOT end the turn** — they spend their
  normal apCost, so heal-then-move and buff-then-attack work.
  `spellDealsDamage(spell)` (battle.js, next to spendAllAP) = any of
  dmg/hitDamages/dotDamage/dashDamage set, OR kind ∈ `_PRESS_SPELL_KINDS`.
  Items, banes, scanner, ping, inspect, detonate, build/reshape, altitude,
  WASD 2-tile move, nexus channel also remain fixed-cost (1), non-ending.
- **Every spell/ability is once per turn** (implicit 1-turn cooldown, basic
  attacks exempt): `unit._spellsUsedThisTurn` map, set by
  `_markSpellUsedThisTurn` in finishAction + the early cast paths, enforced
  as `'Used this turn'` in `getSpellBlockReason` (so every menu greys it and
  doSpell/canAffordSpell/AI/repeat-queue all reject it — you can't recast
  the nuke a press just refunded, or double-heal). Cleared wherever the
  other turn flags reset (blitz turn start ×2, gauntlet reset, round reset);
  syncs to the guest automatically (unit fields serialize wholesale).
- **Press = one +2 AP burst, then entropy**: `PRESS_REFUND_AP = 2`,
  `PRESS_MAX_BONUS_AP = 2` → the turn's FIRST weak/crit press refills the
  whole bar (+2 at once); every later press overflows through the existing
  `pressOverflowAP` vent into the Entropy Gauge (applyPressTurn's cap math
  handles this unchanged). Max 2 attacks per unit per turn, by construction.
  WEAK_CRIT still "wants" 4 → the extra 2 vents to entropy on the first press.
  Feedback popups are now dynamic (`+2 AP!` / `⚛ ENTROPY!`) and ride the
  existing `floating-text` relay → guest parity free.
- **ON FIRE kill reward** no longer refunds +1 AP (it would be wiped by the
  turn-ending spend); it always vents `onFireOverflowAP` entropy instead.
- No ability costs >2 AP anywhere (data.js max apCost is 2; apCost-2 spells
  now require a full bar — you can't move first). hud.js pip `baseAP` and the
  `getUnitMaxAP` fallbacks (battle/hud) updated 3→2. `AP_BONUS_LEVELS` was
  already empty so max AP is exactly 2.

## MENU NAV: no uninvited / all-grey submenus (2026-07-15) — battle.js, ui.js, hud.js
User report: quick-casting a bane off the enemy menu (click werewolf → bane row)
dumped them into the ITEMS submenu afterwards — a menu they never opened, with
every remaining item greyed out (heal potion at full HP) — forcing back-out
clicks. Root cause: `doItem`'s two tails (bane branch + shared potion/scanner
tail) set `state.actionMenuView = 'items'` UNCONDITIONALLY when the unit could
still act, unlike doAttack/doSpell which restore the PREVIOUS view. Fixes:
- **battle.js `doItem` (both tails) + ui.js `useStimItem`**: return to 'items'
  only when the item was armed FROM the items submenu (`actionMenuView ===
  'items'` at resolve time — quick-cast and clock-slot fires leave it 'root')
  AND `anyUsableItemNow(unit)` — else land on the root verbs. Side benefit:
  a guest-initiated remote doItem no longer forces the HOST's menu to 'items'.
- **New probes `anyUsableItemNow` / `anyCastableSpellNow`** (battle.js, next to
  `canUseItemNow`): "would this submenu have ≥1 live row?" The spell probe is
  cooldown/guard-aware (canAffordSpell + getSpellMpCostFor) and covers race
  abilities + move-then-cast reach, mirroring `_hrlgSpellBlades` availability.
- **NEVER open an all-grey submenu**: `chooseActionMenu` (ui.js) now refuses
  'spells'/'items' with an error blip + log line when the probe fails. The root
  ITEMS blade greys with 'Nothing usable' (not just 'Empty'); the ABILITIES
  blade lost its `forceLive` (was: grey-but-clickable to read reasons — user
  explicitly wants it unopenable instead; the one-word sub reason stays). The
  hud.js abilities-button probe now folds in `canAffordSpell` and uses
  `anyCastableSpellNow` so button state always agrees with the gate.
- **Post-action returns gated the same way**: doSpell's finishAction falls back
  to the spellbook only if `anyCastableSpellNow`; doAttack re-arms
  'attackTargets' only if `attackHasReachableTarget` and returns to 'spells'
  only if something is castable — otherwise root. (Staying ARMED on the same
  still-affordable spell is unchanged.)
No new state fields, no new relayed moments — menu state is viewer-local (in
the `_serializeState` skip list), so no online.js changes needed.

## ONLINE PVP PARITY PASS (2026-07-14) — online.js, battle.js, CLAUDE.md, index.html
User report: P2 (guest) never sees the "Your Turn"/"Opponent's Turn" sweep, guest
camera followed P1's units (position leak under fog), and basic attacks played the
full cinematic action cam on the guest. Root causes + fixes (see CLAUDE.md RULE #2):
- **Turn sweep missing on guest**: `showPlayerTurnAnnounce` fires only inside the
  host-side blitz engine (`_continueBlitzWithUnit_impl`) and was never relayed
  (unlike showTurnBanner/showRoundBanner). Now wrapped in online.js → host emits
  `relay {type:'player-turn-announce', player, unitId}`; guest handler replays it
  (label recomputed from the guest's own viewpoint). NOTE: the persistent
  `turnBannerOverlay` card is CSS-hidden (hud.js `.turn-banner-overlay.visible
  {display:none}`) — the SWEEP (`playerTurnAnnounce`) is the visible banner.
- **Camera leak**: the guest state-sync handler snapped the camera (+selection) to
  the host's newly-active blitz unit gated only by `_shouldCameraFollowUnit`, whose
  fog check was `_isUnitVisibleToViewer` = FLAT awr-Manhattan radius that sees
  THROUGH walls — while the real fog renderer uses LOS `computeVisibleTiles`. Both
  `_isTileVisibleToViewer` and `_shouldCameraFollowUnit` (battle.js) now gate on
  `computeVisibleTilesCached(viewer)` — the exact set the renderer draws — and the
  offensive-cam hidden-actor gate uses the same screen-true check. Guest match-start
  focus now frames the guest's OWN unit, never the host's opener. Hidden enemy turns
  leave the guest camera alone (walk/attack relays are already fog-trimmed).
- **Basic-attack cinematic on guest**: the host→guest `camera-events` relay dropped
  `noActionCam`/`_noCinematic` (set by basic attacks, battle.js ~30426), so the guest
  replayed EVERY attack as a cinematic. Flags now relayed + applied. Fallback actors
  in the guest handler also carry the real `srcPlayer`/`tgtPlayer` (was hardcoded
  player:2 = "friendly", which defeated the fog gate when unitFromId missed).
- Architecture reminder: HOST runs the whole engine; GUEST = state-sync mirror +
  explicit relay events. Any new player-facing moment MUST be relayed or the guest
  never sees it — that's CLAUDE.md RULE #2 now.

## LIQUID PASS: tinted-water bogs/ooze + Minecraft flow + oil detonation (2026-07-14) — data.js, sprites.js, map.js, state.js, battle.js, three-renderer.js, ai.js, index.html
Token `20260714a-status-fixes` → `20260714b-liquids`.
- **Tinted water rendering**: `poison`/`poison_bog`/`purple_bog` render as
  PURPLE water, `swamp`/`oil` as BLACK water — same animated fluid pipeline
  as water/deep_water (waves, caustics, glints, shoreline inset). No new art:
  they ride the water textures with a material tint. Registry:
  three-renderer.js `_LIQUID_STYLES` (base texture + tint + per-liquid
  caustic/glint GLSL colors) + entries in `_FLUID_TERRAIN_SET` /
  `_FLUID_DRIFT_3D`; `_buildFluidTopMat` also tints the scrolling wave layers
  (`uWaveTint`) so ripples don't wash the tint back toward blue.
- **New terrain rules (data.js)**: `swamp` ("Black Ooze", was RULE-LESS —
  the Ooze Trail spell created it but it fell back to grass rules/no sprite)
  and `oil` ("Oil Slick"), both moveCost 2. Both are in the map-editor
  Ground palette and appended (append-only!) to the saved-map grid-id list.
- **Minecraft-style liquid spread** (map.js `getLiquidFlowAt(x,y)`, beside
  getHeightAt): DOWNHILL ONLY — a liquid tile spreads runoff onto ground
  STRICTLY BELOW its own level; a pool level with its surroundings is
  contained (existing flat lakes / lava rivers grow NOTHING). Once dropped a
  level the runoff fans across the lower ground but never climbs back up.
  Range from source: water/poison/oil 3 tiles, LAVA 2 (Minecraft's shorter-
  lava ratio; per-family in `_LIQUID_SPREADS`). Lava flow
  BURNS: end-of-turn it ticks the full lava rule (map.js
  applyTerrainTurnEffects swaps the rule; adaptation/flying exempt) and
  knock-ins ignite via battle.js `_isLavaTile` in `_applyKnockbackHazard`.
  DERIVED state — recomputed lazily off `_terrainVersion`/
  `_heightVersion`, never written to boardTerrain, so online clients derive
  identical flow. Renderer: thin fluid slabs (~1/3 step at d=1, thinning to
  ~1/7 at d=3) built at the end of `rebuildTerrain` into `_liquidFlowGroup`
  (removed+rebuilt each pass — rebuilds are incremental), raycast-disabled.
- **Gameplay hooks (battle.js)**: `_isWetTile` (water OR water-family flow)
  now drives soaking (tickWetUnits/_unitIsSoaked), lightning conduction
  flood, knock-in dousing, and `_tileSmothersFire`; frost still only freezes
  REAL water. `_isOilTile` (swamp/oil terrain OR oil flow): fire OR lightning
  → `_reactFireOil` — the whole connected slick (flood cap 40) DETONATES:
  0.9× spell dmg (min 70) to grounded units in it (caster + origin tile
  spared, mirrors conduction), burn 2, oil terrain → scorched + burning
  tiles for 2 rounds. `_elementalTileCastInfo` lets fire/lightning target
  the slick tile directly ("detonates the oil slick").
- **Fall-break (state.js applyFallDamage)**: landing on ANY liquid — source
  or flow, lava included — negates fall damage entirely (`💦 SPLASH!`);
  lava/deep-water hazards still bite via their own effects.
- AI: shove-into scoring counts purple_bog/swamp/oil like poison (+12).
- 2D fallback renderer draws swamp/oil with the plain water sprite
  (untinted) — known cosmetic limitation; flow slabs are 3D-only.

## WEAPON GLB SPELL PROPS + sword/idol cinematics (2026-07-13) — three-vfx-effects.js, three-renderer.js, index.html
Token `20260713a-lvl100` → `20260713b-weapons3d`. Nine Meshy prop GLBs the
owner uploaded to R2 **`Assets/weapons/`** are now real spell props.
- **Loader** (three-vfx-effects.js, above `_sigBuildSword`): `_WPN_MODELS`
  registry + `_wpnLoad/_wpnReady/_wpnInstance(key, targetLen, opts)`. Loads
  once via `THREE.GLTFLoader`, caches, clones per cast; clone geometry is
  SHARED (`geometry._ew_shared = true` — `_sigRun`'s disposer and the
  renderer's projectile teardown skip it), materials cloned per instance so
  `setFade(f)` works. Models are normalized by bounding box: axis `'z'` = long
  axis swung onto +Z (guns/jet/arrow/football), `'y'` = kept upright, scaled
  by height (sword/cauldron/crystal ball). The scene is LIT (three-post sun/
  hemi/ambient) so GLTF PBR materials render as-is, like unit models.
  Cache pre-warms 3.5s after boot. NOT covered by the `?v=` token — to change
  a weapon GLB in place, rename the file (auto cache-bust).
  - Kill-switch: `window.EW_DISABLE_WEAPON_GLB = true` (both files).
  - Orientation fix-ups WITHOUT a code edit (Meshy exports vary; I could not
    open the GLBs from this sandbox — cdn is proxy-blocked — so long-axis
    detection is a heuristic): `window.EW_WPN_TWEAK = { sword: { rx: Math.PI,
    ry: 0, rz: 0, s: 1.2 } }` per key, or bake a `tweak:{}` into _WPN_MODELS.
    Verify in-game: jet nose forward? sword tip down during the plunge?
    arrow head forward? If a model flies backwards set `ry: Math.PI`.
- **Swapped to GLB (procedural/sprite kept as loading fallback)**:
  - Jet flyover (`_fireDescent` `fo.sprite==='f22'` → GLB flyby with bank
    roll + twin afterburner glows): nuke / sharedNuke / raceArtilleryStrike.
  - Crystal ball (`_sigCrystalBall3D` — GLB orb, procedural stand+glass only
    as fallback; vision fog/spark layers unchanged).
  - Guns (`_sigBuildGun`): revolver + NEW kinds `pistol`/`plasma` are GLBs;
    **sniper & shotgun stay procedural** (owner call). New `_SIG_GUN_FOR`:
    mark1 + raceSuppressingFire → pistol; raceClassifiedWeapon (MIB) +
    raceStunRay (barbarella, got a new `_bolt_elec` wiring) → plasma.
  - Football: three-renderer.js `startProjectileTween` supports `_PROJ_MODELS`
    GLB projectiles ('proj-football': spiral spin around the flight axis, nose
    follows the lob arc). First throw of a session may still be the PNG (GLB
    warms on boot + first use). All QB spells ride this via the existing
    `projectileOverride`/UNIT_ANIM_OVERRIDES — no data.js change.
- **New signature cinematics** (`_spell3DGeometry` + SPELL_MAP wiring block
  next to the raceCannonball arsenal wiring):
  - **King Arthur**: raceExcaliburStrike → `_sigExcalibur3D` (master-sword GLB
    rises blade-down from lady-of-the-lake circles, hangs, slams: gold pillar,
    crescents, shock ring; fallback = gold `_sigStandSword3D`). raceRoyalDecree
    → `_sigCrown3D` gold crown + sacred rings.
  - **Robin Hood**: racePrecisionShot/raceSplittingArrow (bolt hook
    `_SIG_BOW_FOR` in `_fireBoltMapped`) → `_sigBowShot3D` spectral longbow
    draws + looses the REAL arrow GLB; raceArrowRain → `_sigArrowRain3D`
    GLB-arrow volley raining into the diamond.
  - **Shaman/Witch**: raceHerbalRemedy + raceAyahuascaRetreat →
    `_sigCauldron3D` cauldron GLB bubbles then boils over into a gas cloud
    (green herbal / violet ayahuasca palettes).
  - **Swordmaster class** (was 100% generic): crossSlash X-combo, swordBeam →
    `_sigSwordWave3D` traveling crescent (hooked inside `_fireBeamMapped`,
    new `swordBeam_beam` def), lungingStrike burst, bladeWaltz →
    `_sigBladeWaltz3D` 3 orbiting hologram greatswords, parryStance →
    shield ring + `_sigParryBlade3D`, zantetsuken → `_sigIaiCut3D` master-sword
    iai draw-cut with the DELAYED cut (flash/shock fires after the sheathe).
  - **Swordfighter race**: REWORKED 2026-07-13 (see the "SANTA + SWORDFIGHTER
    REWORK" section below) — the old raceCrescentCut/raceIdolEncore/
    raceSpotlight kit and its wiring are gone.
- **Future 3D models that would slot right in** (wishlist for the owner):
  longbow (replace the procedural spectral bow), shotgun + sniper rifle
  (finish the firearm set), witch broom, cannon (replace procedural pirate
  carronade), shield/heater shield (knight kits), spear/trident (valkyrie,
  mermaid, poseidon beats), scythe (necromancer/reaper), boomerang, katana +
  saya (zantetsuken deserves its own blade + sheathe), guitar (bard/idol),
  syringe (mad scientist), UFO saucer (replace procedural `_sigBuildUFO`),
  tomahawk missile (artillery descents), treasure chest (pirate plunder),
  hourglass (machine elves), voodoo doll (curse kits).

## SANTA + SWORDFIGHTER REWORK (2026-07-13) — data.js, battle.js, state.js, three-vfx-effects.js, index.html
Token `20260713k-arthur-necro` → `20260713l-santa-sword`.
- **Santa Clause** (RACE_ABILITIES, data.js): DELETED raceGiftOfHealing +
  raceChristmasSpirit (no more support kit). raceSleighDash is now a DAMAGE
  spell — `kind:'dash'` (existing charge mechanic: 70 path damage, 120 on the
  landing tile, destination occupant knocked aside), range 4, cost 25.
  raceLumpOfCoal + raceNaughtyList + raceBlizzardPresent mechanics unchanged.
- **Swordfighter** (RACE_ABILITIES): DELETED raceIdolEncore, raceFlashStep,
  raceSpotlight, raceCrescentCut. New kit: raceSadBackstory (self buff, +2 ATK
  stages), racePlotArmor (self buff, +2 DEF stages), raceBlessedBlade (holy
  3×3 melee aoe, replaces Crescent Cut), raceToBeContinued (range-3 unit mark,
  190 dmg, rides the Headshot `delayedMark` pipeline with
  `requireVision:false` + `markDelayRounds:1` → strike auto-lands at
  end-of-round detonation phase, tracks the target wherever they move).
- **Generic delayed-mark flavor hooks** (battle.js `_castLaserMark`): new
  optional spell fields `markFloatText` (floating text over the target),
  `markLogText` ('{target}' placeholder), `impactSfx` (state.js
  `_detonateDelayedSpell` plays it instead of the hardcoded 'gun').
  `_castLaserMark` also fires `_spell3DGeometry['<id>:mark']` at cast, and the
  dash kind fires `_spell3DGeometry['<id>:dash']` at the landing tile — both
  via `ThreeVFXEffects.fireGeometry`, no-ops when unregistered.
- **New signature VFX** (three-vfx-effects.js):
  - `_sigNaughtyList3D` — parchment scroll (REAL `terrain/parchment.png`
    texture) on wooden rollers unfurls over the victim, ink lines, blazing
    red ✗ stamp + ember spray. Fires on raceNaughtyList impact intent (new
    `raceCurseOfDecay_impact` mapping on top of its `_bolt_unholy` bolt).
  - `_sigPresent3D` — 3D wrapped gift (box + gold ribbon + lid + bow knot)
    drops, squash-bounces, rattles, blows its lid; blizzard shards erupt
    620ms later (raceBlizzardPresent aoe geometry).
  - `_sigFlashbackTint` — full-screen B&W/sepia memory grade: animates a CSS
    `filter` on `#threeCanvas` (fade→hold with old-film flicker→fade) + DOM
    vignette. One at a time (`_sigFlashbackActive`); no-op in 2D renderer /
    devAutoSim. Used by raceSadBackstory (spotlight + rising motes) and both
    To Be Continued beats.
  - `_sigToBeContinuedBanner` — the manga end-card "⬅ To Be Continued" DOM
    banner slides in bottom-left on mark cast. Detonation beat = flashback +
    `_sigIaiCut3D`, impact mapping `dragonSlash_impact`, sfx
    'physicalAbility'. Sleigh Dash landing: speed burst + ice shock ring +
    ice-shard/sparkle spray + pale screen flash (`raceSleighDash:dash`).
- AI needed NO changes: 'dash' and 'buff' kinds already scored, and
  delayedMark rides `kind:'damage'` exactly like Assassinate.

## JOB/RACE REWORK: Swordmaster + Tank/Assassin renames + 3D batch (2026-07-13) — data.js, battle.js, ai.js, ui.js, map.js, sprites.js, index.html
Token `20260712m` → `20260713a`.
- **Display renames, NOT id renames**: job 'Warrior' displays "Tank" and
  'Agent' displays "Assassin" via `JOB_DISPLAY_NAMES` (data.js) — same
  mechanism that shows Raider as "Bruiser". Internal ids unchanged everywhere
  (saves, online protocol, `unit.cls` checks, AI tables) — never rename the
  ids themselves. 'men in black' `labelFemale` = "Intel Spy" (was "Glowie";
  R2 portrait file is still glowie.png — path only).
- **New job `Swordmaster`** (melee duelist, move 4 / spd +2 / range 1): wired
  in JOB_ARCHETYPES/JOB_MODIFIERS/CLASS_TEMPLATES/JOB_PASSIVES/
  CLASS_SPELL_LEARN_ORDER (data.js), frontline flag (ai.js), '⚔' icon
  (ui.js), _CCC_JOB_NAMES 'Blade' (map.js), JOB_FOLDER_MAP → knight art
  (sprites.js), accessory/spell prefs in BOTH optimizeLoadout blocks
  (battle.js). Passive **Riposte** (35% counter, counters at 60% ATK) is live
  in battle.js getCounterChance/getCounterDamage. Kit (new spells, school
  'Swordmaster'): crossSlash I, swordBeam I (line), parryStance II
  (shield+DEF), bladeWaltz II (self-AoE), lungingStrike II (chargeToTarget),
  zantetsuken III (ignoreArmor).
- **Swordmaster races**: new race `swordfighter` (human, female-only pop-idol
  duelist; full table wiring + 4 racials incl. Idol Encore warCry and
  Spotlight mark), plus pirate, king arthur, skeleton, valkraye.
- **Tech spells left the Assassin pool**: empBurst + magnetMine are Engineer
  school/classRestriction now (appended to Engineer learn order); machine
  races robot/android/droid got a shared `SHARED_EMP_PULSE` racial instead
  (cyborg already had EMP Grenade). Assassin kit backfilled with new
  poisonDart II + assassinate III (sneakBonus finisher).
- **Other job moves**: cyclops + juggernaut → Tank (juggernaut RACE_CLASS →
  'tank'), super sentai → Freelancer.
- **3D batch (RACE_MODELS_3D female entries)**: zombie (Zombie_Idle/Walk lib-1
  gait + Zombie_Scratch, claw basics), swordfighter (Sword_Idle +
  Sword_Regular_Combo), fallen angel (magic basics). All three races added to
  ACCT_STARTER_UNITS (3D-only gate unlocks them).

## Level 100 REBALANCE — classic magnitude restored (2026-07-12) — data.js/battle.js
Token `20260712l` → `20260712m`. Owner rollback of the ×24 magnitude: MP was
effectively free in PvP (pools ×24, spell costs flat) and spell cards showed
base numbers while dealing thousands. New model (WYSIWYG):
- **`EW_SCALE = 1`** (data.js) ⇒ `levelScale() ≡ 1` — every resolution-time
  damage/heal/shield/DoT/tower/AI multiplier (all still guarded in
  battle.js/ai.js/ainew.js/state.js/map.js) is now an exact no-op. Spell card
  number == damage dealt, at every level. Towers back to flat 2500 HP
  (scoring is percent-of-tower so unaffected).
- **Stat growth is additive again**: `LEVEL_TOTAL_STAT_GAINS`
  (hp 360 / mp 108 / atk 58 / def 52 / mdef 43 / int 43 = column sums of the
  retired Lv2–10 `LEVEL_UP_GAINS` table) × `((L-1)/99)^1.35`, applied by
  `levelStatGains()` (data.js) via a rewritten delta-based
  `_recomputeStatsForLevel` (battle.js) that preserves equipment/sec-job
  bonuses sitting on live stats. Level 100 == the old level 10 statline
  (~850–1000 HP, base+108 MP), so flat spell damage AND flat MP costs stay
  balanced at every level — the classic game's own property. atk/def/mdef/int
  now grow with level again (they didn't in the ×24 model).
- **AP fixed at 3**: `AP_BONUS_LEVELS = []` (was [40,80]; battle.js fallback
  also emptied). No unit ever exceeds `UNIT_MAX_AP` (3).
- Potions stay percent-of-max (30% HP / 35% MP) — scale-proof either way.
- Drops 1–2 below are kept for history; their "×24 scaled space" descriptions
  no longer apply at runtime (the code paths remain, multiplying by 1).

## Level 100 system — Drop 2 (2026-07-12) — data.js/battle.js/map.js/state.js/ui.js/hud.js
Token `20260712k` → `20260712l`. World objects + the XP economy join the
level-100 magnitude space (Drop 1 below covers the core model).
- **Towers**: `TOWER_MAX_HP`/`TOWER_DEF` stay level-1 bases (2500/15) in map.js;
  every instantiation now uses `_towerHp()`/`_towerDef()` = base ×
  `levelScale(matchLevel)` (`_towerLevelScale`: PvP = LEVEL_CAP, campaign/MD =
  max `partyMeta[1]._campaignLevel`). The doAttack tower block scales the
  attack roll by the ATTACKER's level to match → tower TTK unchanged. Arena/
  domination tower-damage points are now **percent-of-tower** (full tower =
  250 pts × `towerDmgPer10`) in battle.js ×2, ui.js ×2, hud.js ×2 — invariant
  to the scaled HP. Turrets deliberately stay in BASE space (hp AND damage
  taken are base-magnitude; their shots scale by the deploying caster's level
  at `applyDamageToUnit`, with a new `scaleByTargetLevel` fallback for
  orphaned turrets).
- **Weather**: natural storms have no caster, so every weather damage/heal
  site now passes `scaleByTargetLevel: true` (state.js
  `applyWeatherTurnEffects`, homing strikes, battle.js
  `processPendingEarthquake`); bloodRain/tesseract MP gains scale by
  `levelScale(target)`. Caster-summoned weather still scales by the caster
  (sourceUnit wins over the fallback). Flat `statMod`s (-10 DEF etc.) are
  intentionally unscaled — offense/defense stats live in base space.
- **Fall damage** (state.js `applyFallDamage`): flat 8/level → **percent**:
  `maxHp × 0.05 × levels-beyond-grace × massMult` (same 5% knob as building
  collapse). Blowback impact/crush damage scales by target level.
- **XP economy (Pokémon/SMT-style)**:
  - `grantXP` is **fully inert outside progression modes** (`xpProgressionActive`
    = `state.isCampaign || state._mdRun ||
    isProgressionMode(activeMode)`) — PvP XP isn't just capped, it never flows.
  - Kill XP = `computeKillXP(killer, victim)` (battle.js, next to the XP
    consts): per-race base yield `getRaceXpYield(race)` (data.js — derived
    from `CAMPAIGN_RACE_PRICES`, ≈45 fodder → ≈180 apex, hand-tune via
    `RACE_XP_YIELD_OVERRIDES`) × victim level / 14, × Gen-5 level-gap damper
    `((2v+10)/(v+k+10))^4`, +1, ×1.5 for `_isBoss`. Self-corrects toward the
    enemy curve (over-leveled grinding pays ~nothing, punching up pays a
    premium). Simulated vs the challenge curve: player L10@b10, L28@b25,
    L60@b50, L93@b75, caps ≈ b90. Assists = 35% of the assister's own
    computeKillXP.
  - Non-kill trickle awards (damage/heal/buff/round/etc.) scale ×`(1+(L-1)/10)`
    so they fade relative to kills at depth, like Pokémon.
- **Progression pacing**: `generateChallengeLevel` enemy levels stretched to
  the full curve (battle n ≈ level n: [1,2]→[5,11]@10→[18,32]@28→[44,66]@60→
  caps [96,100]); MD floor levels honour optional `MD_DUNGEONS[x].levelPerFloor`
  (default 1 → 10-floor Agartha spans L1–10) and cap at LEVEL_CAP, boss = +1.
- Still open: damage-number `k`-formatting + hit-stop/crit VFX percent
  thresholds; old-save XP migration; party-builder preview shows level-1 stats;
  dormant `BOSS_DEFS` (hellspawn/angel — `handleBossKill` is an empty stub)
  left at base magnitude on purpose.

## Level 100 system — Drop 1 (2026-07-12, latest) — data.js/battle.js/map.js/ui.js/ai.js/ainew.js
Token `?v=20260712j` → `20260712k-lvl100`. Max level 10 → **100** (see
LEVEL100_PLAN.md). Core model (single source of truth in **data.js**):
`LEVEL_CAP=100`, `EW_SCALE=24`, `levelScale(L)` = `1+(EW_SCALE-1)·((L-1)/99)^1.35`
(L1→×1, L50→×9.9, L100→×24).
- **Only max HP/MP scale in-place** (`_recomputeStatsForLevel` in battle.js,
  from a level-1 `unit._baseStats` snapshot taken in map.js `createUnit`).
  Equip/secondary-job max HP/MP go into `_bonusMaxHp/_bonusMaxMp` so a re-scale
  keeps them. atk/def/mdef/int are **left at base** on purpose.
- **All damage/heal/shield/DoT scale at the resolution chokepoints**, not in the
  stat: `applyDamageToUnit` and `applyHealingToUnit` multiply by
  `levelScale(sourceLevel)` (armor/hourglass reduction scale by target level).
  This is why there's no double-scaling and why the AI (which reads raw
  atk/dmg) still reasons in today's magnitude space. Opt-outs: `opts.preScaled`
  (already-percent-of-maxHp callers: collapse/crush, selfHealPct, potions) and
  `opts.scaleByTargetLevel` (source-less DoT tick).
- **Same-level combat at ANY level == today's proportions.** L100 unit HP
  ≈ base×24 ≈ **10.7k–15.8k**. Low-level MD/Challenge is balanced for free.
- **PvP normalized to L100**: map.js `createUnit` PvP branch calls
  `setUnitLevel(unit, MODE_LEVEL_RULES.pvpNormalizedLevel)` (=100). Progression
  modes (`state.isCampaign || state._mdRun`) use `min(campaignLevel, 100)`.
  `MODE_LEVEL_RULES.progressionModes` includes `'endless'` as the future hook.
- **Milestones remapped** (data.js consts): spell shop L10, secondary job L15,
  +1 AP at L40 & L80. Spells unlock via `getSpellUnlockLevel(cls, idx)` (default
  spread `[1,1,5,15,30,45,60,75,90]` onto `CLASS_SPELL_LEARN_ORDER`) — swap in a
  `CLASS_SPELL_UNLOCKS` table later without touching the engine.
- **XP curve**: `XP_THRESHOLDS` regenerated to 100 entries,
  `round(12·(L-1)^1.9)` (L100 ≈ 74k). `getUnitLevel` memoizes on `_xp`.
- **Potions → percent**: `ITEM_RULES.healPotion.healPct=0.30`,
  `manaPotion.mpPct=0.35`.
- **AI**: `estDamage` (ainew.js) now returns level-scaled damage; ai.js lethality
  checks (`target.hp <= dmg`) compare against `_aiKillHp()` (HP de-scaled to base
  space). Team-damage-log comparisons were already in scaled space — left alone.
- **NOT yet done (later drops):** tower/turret/boss HP + objective scoring
  (domination/arena/ctf still use unscaled `TOWER_MAX_HP=2500` → towers die fast);
  damage-number `k`-formatting + hit-stop/crit VFX thresholds (maxed at scale);
  AI weight HP-normalization refinement; old-save XP migration; party-builder
  preview shows base (level-1) stats not the L100 values.

## Horologe → cascading JRPG command panels (2026-07-12) — hud.js only
Token `20260712g` → `20260712h`. The rotating blade DRUM is GONE (focus
window, faded overflow rows, click-to-rotate, `_hrlgSlot` math, bezel-angle
pushers). Full presentation rewrite; ALL game logic / state machine / blade
item model / builders (`_hrlgSpellBlades` etc.) unchanged.
- **Layout**: `.hrlg-rig` is now ONE flex row — `.hrlg-side` identity column
  (206px: crown END TURN/BACK bar → 126px clock → name → Lv·race·job line →
  HP/MP bars → big AP pips → 3 item slots 48px → MAT strip → `.hrlg-push`
  tool rows) + `.hrlg-panels` to its right. NOTHING absolutely positioned
  against magic offsets anymore → the old Build/Channel overlap is impossible.
- **Cascading panels**: ActionMenu builds a `panels` ARRAY (stack), e.g.
  root → spells → targets. Parent panels stay mounted, dimmed (`.hrlg-panel.bg`,
  click = back one level); the LAST panel is active and owns cursor/keyboard/
  wheel/desc-bar. Panel keys are stable (`'root'`, `'spells'`,
  `'aim|spell|<tool>'`…) so going BACK never remounts/re-animates the parent —
  that plus 0.15s row animations (was 0.4s + 40ms stagger) is the responsiveness
  fix. Move/jump aiming shows NO panels (modeLabel + crown only), same as before.
- **Rows**: every row is one-click live; hover = selection (cursor follows
  mouse). Category-tinted spell rows wear their color EDGE TO EDGE
  (`--bc-hi/--bc-lo` gradient over `#0d0d0b`, no fade-to-dark tail) and
  hover/sel GROWS + GLOWS in that color (never washes out). Danger rows
  (END TURN/CANCEL) get red via `--bc*` on `.hrlg-body.danger`.
- **Badges**: ability rows carry ONLY the spell TYPE badge inline
  (`_hrlgSpellBadges` now type-only). Target chip (⟳ SELF/♥ ALLY/⬚ TILE/
  ◎ ENEMY) + PHYSICAL/MAGIC/UTILITY + ⚔ MELEE/⤢ RANGED chips moved into the
  bottom description bar (`_renderSpellDescBar`).
- **Two-line spell rows** (2026-07-13, user request — names were getting cut
  off): any blade with `badges` renders TWO lines (`.hrlg-blade.two`, 56px):
  line 1 = name + TYPE badge (never clipped), line 2 (`.hrlg-brow2`) = the
  `right` chips (damage, MP, AP pips, MOVE→CAST note, grey-out reason).
  Do NOT restore the old single-line `maxWidth:170` layout.
- **Super effective = green !-circle** (2026-07-13): `.hrlg-supereff` chip on
  quick-menu + target-picker rows (blade prop `superEff`), and an inline-styled
  circle in the map intent badge (`_getTypeEffLabel`, ui.js). ▲ is gone; ▼ stays
  for weak. STAB badges/floating text removed EVERYWHERE (mechanic unchanged —
  notes/labels back the STAB factor out and only speak about the matchup).
  `_multCallout` (battle.js applyDamage) dedupes identical callouts per unit
  within 1.5s so AOE/multi-target/barrage casts don't spam "⛰ HIGH GROUND!" ×3.
  Poison badge/icon is PURPLE now (#9b59b6) — ui.js plate colors, three-renderer
  nameplate `_SB_COLORS`, data.js `iconSrc`.
- **BUILD + pushers** (CHANNEL/DETONATE/ENTROPY/ENTER): full-width
  `.hrlg-push` rows at the bottom of the identity column (root view only) —
  the old `.hrlg-buildbtn` / `.hrlg-pusher` bezel studs are gone.
- Long lists scroll INSIDE `.hrlg-list` (max-height 400px, wheel moves the
  cursor + `scrollIntoView`); `hrlg-more-ind`/`hrlg-scroll-hint` are gone.
- Contracts KEPT: `window._hrlgPad` {view, blades, cycle, fire, crown},
  `_setSpellDescBase`, `window._hrlgNoteAction`, blade item fields, the
  quick-menu tab `title.node` (still uses `.hrlg-view-tab-*` + `.hrlg-tport`).

## STRIKE MODE polish pass (2026-07-12, later) — battle.js, three-renderer.js, three-camera.js, three-post.js, ui.js, index.html
Token `20260712e` → `20260712f`. Fixes from first hands-on feedback:
- **Street-lamp FPS drop (three-post.js)**: `rebuildStreetLampLights` was
  creating a real PointLight per lantern (up to 6, distance 420) — every extra
  scene light multiplies per-fragment shading across the WHOLE frame. Now
  stride-picks at most **`LAMP_LIGHT_MAX = 3`** lights (distance 300); the
  other lanterns keep their free self-lit glass + additive halo so they still
  read as lit. Override/kill switch: `window.EW_LAMP_LIGHT_MAX` (0 = none).
- **Sliding instead of walking (ROOT CAUSE)**: `_freeRoamTick`/`_rtTick`
  overwrote `actions.walk.timeScale` with `def.moveTimeScale || 1` every
  frame — but library rigs wire walk at `UAL_SLOTS.walk.ts = 2.05`, so the
  Walking clip played at HALF pace (pure foot-skate) while `run` (1.3,
  untouched) looked right — exactly "they only run when I hold shift".
  `_wireSlot` now stamps **`act._ew_ts0`** (the wired baseline) on every
  action and all runtime boosts (free-roam ×1.75 sprint, RT driver, dash
  sprint ×1.15, restore paths) scale RELATIVE to `_ew_ts0`.
- **Jump (SPACE)**: `_rtJump` no longer gated on ShooterControls' local
  `roamOn` flag (went stale across dash restarts/respawn frames and ate the
  press) — `hubFreeRoam.setJump` already no-ops safely when no walker runs.
- **Spell VFX restored in RT (battle.js StrikeEngine)**: every VFX helper now
  checks the spell's authored SPELL_MAP intent FIRST (same three-vfx-effects
  pipeline as turn-based) and only falls back to the themed generic:
  `_projVfx` → `fire('bolt')` (signature cannon/gun rigs live here);
  `_launchGround` → `fire('descent')` sky cinematics with damage landing at
  telegraph+descent ms, and line/linePush/cross fire a volumetric
  `ThreeVFXEffects.beam`; `_aoeVfx` → `fire('aoe')` then `fireGeometry`
  (signature 3D apparitions) then themed; heals/buffs/cleanse →
  `_supportVfx` (`fire('aura')` > fireHeal/fireMana/fireBuff); pure debuffs →
  fireDebuff; dashes → `fire('teleport')` / fireTeleportLegacy (blinks) /
  fireDash. `_castSlots` picks castTrap for deployables and castPlant for
  seed kinds so cast anims match the spell family.
- **FIRST PERSON default + third-person option**:
  - `ew_strikeOpts.viewMode` (`'first'` default | `'third'`), new **V** bind
    (`view`, rebindable) toggles live; button in Settings → Controls → Strike
    Mode; RT hint mentions it.
  - three-camera.js: **`cam._fpEye`** — eye AT the TPS pivot (head), aims
    along the view dir, no boom/collision/shoulder, tight 0.028 smoothing.
  - ShooterControls `_frame`: FP drops the shoulder offset (reticle
    dead-centre), `_tpsHeadLift ×1.13` (eye at the crown), ADS narrows FOV
    (×0.68) instead of pulling the boom; `_zoom()`'s ADS boom shrink is
    third-person-only. Death → corpse cam falls back to third person.
  - Own model+plate hidden via **`window._ewFpHideUid`** (consumed each frame
    in `_updateUnitModels`, self-restoring). `ThreeCamera.screenToUnit` now
    skips units under an invisible ancestor so the hidden body can't tint the
    reticle or eat picks.
- Syntax-checked only (RULE #1c). Watch list: FP eye clipping inside tall
  wall tiles when backing into them; descent-timed damage vs pause shifts;
  bespoke bolt mappings with fractional (mid-walk) caster coords.

## STRIKE MODE round 3 — FULLY REAL-TIME SHOOTER (2026-07-12) — state.js, map.js, battle.js, three-renderer.js, ui.js, styles-hud.css, index.html
Token `20260712d` → `20260712e`. Strike Mode is no longer a control scheme over
blitz turns — it is a REAL-TIME third-person shooter TDM (Halo/MW2-style).
Turn-based game untouched: every RT branch gates on **`_isStrikeRT()`**
(state.js, next to `_isShooterMode`; false for online matches — RT has no
netcode sync, VS-CPU/hotseat only, online strike falls back to the old
turn-based scheme).

- **Mode entry** (`MULTIPLAYER_MODES.shooter`, state.js): `isRealtime:true`,
  `roundLimit:0` (no matchClock rounds), `timeLimitSec:480`, `scoreLimit:25`,
  winConditions `['most_kills']` only (wipeout removed — respawns are seconds
  away; checkWin/checkWinConditionOnly's wipeout branch is gated off in RT).
- **Turn engine bypass**: `maybeAdvanceTurn` early-returns in RT (and boots
  `StrikeEngine.ensureStarted()` — the round-banner boot path lands there
  once); `maybeTriggerComputerTurn` early-returns. `state._blitzActiveUnitId`
  is pinned to the player's unit for the whole match (legacy HUD readers).
- **StrikeEngine** (battle.js, right after ShooterControls;
  `window.StrikeEngine`): the real-time match loop (own RAF).
  - **Spell auto-converter** `_desc(spell)`: classifies `spell.kind` into RT
    categories (bolt/ground/heal/healAll/manaAll/buff/debuff/dash/turret/
    revive/cleanse/encore/selfUtility) and derives a cooldown from AP+MP+power:
    `1.2 + apCost*2.2 + cost*0.05 + power*0.016` s (clamped 1.6–28;
    `spell.cooldownRounds`×10s wins; optional `spell.strikeCooldownSec`
    overrides). NEW SPELLS ADDED TO data.js CONVERT AUTOMATICALLY.
  - **Combat**: all hits route through the stock `applyDamageToUnit` (type
    chart, zodiac, armor, shields, kill credit, streaks/bounties all live).
    Basic attack: cooldown `1600 - spd*9`ms, melee vs ranged by
    `getEffectiveRange`, crit via `rollCrit`. Projectiles resolve at fire time
    and damage lands on arrival (`pendingFx`), visuals via
    `ThreeVFXEffects.projectile` / `ThreeAnim.projectile`. Ground casts AoE at
    the reticle tile clamped to range; terrainCreate/summonWeather/seeds →
    damage ZONES (12s, ticking); placeTrap/bomb/warpRune → armed TRAPS;
    deployTurret → real `state.turrets` entry, fired by the engine every 3.5s.
    Revive = dead allies' respawn timers cut to 1.2s. Encore = rewind 40% of
    own cooldowns. GCD 450ms.
  - **Aiming**: reticle pick (`pickAtScreen`) + soft-lock aim assist
    (`worldToScreen`, 56px) + camera-forward for ground/dash direction.
    RMB = ADS (boom 4.2→2.6 tiles, sens ×adsSensMult). Held LMB auto-fires
    every 140ms. Hitmarker = reticle pulse (`.strike-hitmark`).
  - **Bots**: every non-player unit on BOTH teams (think ~400ms, steer every
    frame via new renderer `strikeRT` driver): target scoring (near + low-HP +
    LoS), range-band kiting + strafe flips, ally separation, retreat <25% HP,
    healer duty (ally <55% in range of a ready heal), best-ready-ability
    picking, basic-attack accuracy ~72%+awr.
  - **Respawns**: on `RenderBus 'unit:died'` → 6s + 1.5s/death (cap 14s), at
    spawn-zone tiles (`state.spawnZones` → SPAWNS fallback), spawnGuard on.
    Player gets a death overlay countdown + `ShooterControls.reenter()`.
  - **Rounds → clocks**: 30s "ambience pulse" = one round of
    `checkZodiacRotation`/`tickSkyEvent`/`checkNewSkyEvent`/`tickWeather`/
    `spawnWeather` (zodiac change ≈150s) with combat banners; status DoTs tick
    every 3s (½ per-round dot), durations decay every 8s
    (`_tickAllStatusDurations`); MP regen 1.4%/s always, HP regen 4%/s after
    8s unhit. Match: first to 25 kills or best at 8:00; tie → sudden death
    (stock `processKillStreak` sudden-death branch ends it). Pause overlay
    freezes the sim and shifts the clock.
  - **HUD** (styles-hud.css, z 3600): `.strike-top` scores+clock,
    `.strike-vitals` HP/shield/MP, `.strike-killfeed`, `.strike-respawn`,
    `.strike-scoreboard` (hold TAB / pad X). Hotbar reused (#shooterBar) with
    RT cooldown sweeps (conic-gradient) + seconds countdown.
- **ShooterControls RT fork** (`_rt()` inside the IIFE): `_localUnit` = the
  player's unit always; `_owns()` = whole match incl. death cam; walker runs
  unfenced (`_startRoamRT` — no rings, no `_initWasdState`, no AP commits,
  crossings write unit.x/y); `_fire` → `StrikeEngine.playerFire(selSlot)`;
  digits/wheel switch slots (pure selection, nothing arms); SPACE jump; no
  Enter end-turn; TAB scoreboard; mouse binds via **`ew_strikeBinds`**
  (e.code + 'MouseN'), opts via **`ew_strikeOpts`** {sens, adsSensMult,
  invertY, fov} — exposed as `window.StrikeControlsConfig`, FOV applied on
  ownership (restored after). Pad: RT=fire LT=ADS B=jump X=scoreboard.
- **Renderer RT driver** (three-renderer.js `ThreeRenderer.strikeRT`):
  `setMode(on)`, `drive(uid,fx,fy,want,run)`, `release(uid)`,
  `playAnim(uid,slots)` (= `_maybeStartModelAnim`). `_rtTick` applies float
  positions each frame after `_freeRoamTick`; `_updateUnitModels` takes
  `want` from `_rtUnits`; run lean. In `_rtMode` the STRUCTURAL SERIAL
  IGNORES x/y/z (bots crossing tiles must not churn rebuilds — deaths/spawns
  still rebuild via alive-set membership) and the `_freeRoam` rebuild-defer is
  waived (positions reapply next frame, snap invisible).
- **Settings UI** (ui.js `_buildControlsSettingsHTML`): new "🎯 Strike Mode"
  group — sensitivity/ADS/FOV sliders, invert-Y, reset buttons, full
  click-to-rebind grid (`window._ewStrikeRebind` captures next key/mouse,
  ESC cancels). Works in the pause menu Controls tab + main-menu Settings.
- **defeatUnit (map.js)**: RT skips global slow-mo and logs "is down!"
  (StrikeEngine owns respawn countdowns).
- Syntax-checked only (RULE #1c), NOT playtested. Watch list: plates during
  fast bot movement (positions patch via `_patchPlateStats` every frame in
  RT), `ThreeVFXEffects.projectile` with fractional tile coords, bot pathing
  around chasm maps (greedy steering, no A*), pause during in-flight
  projectiles (pendingFx timestamps don't shift), first spawn tile if
  spawnZones missing on a map.

## CINEMATIC CAMERA: FOLLOW / MULTI-TARGET / SUPPORT SHOTS + ×N HOLD (2026-07-12) — battle.js, index.html
Token `20260712b` → `20260712c`. New camera vocabulary (all in battle.js, next
to `_playCineActionShot`):
- **`_cineRetargetShot(point, unit, opts)`** — mid-shot RETARGET: glides the
  live action shot to a new subject without ending it (re-anchors the TPS
  pivot + occlusion-fade target). Returns false when no shot owns the camera
  (callers keep their tactical fallback). Used by: ricochet bounce (camera
  rides to the second victim), `displacement` kind (Kinetic Hurl & co — camera
  follows the flung body to its landing tile), `skyThrow` fling (now also gets
  a full `playOffensiveActionCamera` shot at cast; sourceHold 420).
- **Multi-target beat 2** — `playOffensiveActionCamera(unit, tgt, { frameTiles:
  [{x,y}…] })` → `_playCineActionShot` beat 2 becomes a WIDE reverse cut
  framing the bbox of all tiles (zoom via `_cineZoomForTiles(span+4.5)`,
  tilt `CINE_HIT_TILT-8`) instead of a one-victim close-up. Wired for `aoe`
  (`_setupAoeCameraAndTiming` passes centre + every enemy hit) and `barrage`
  novae (Requiem/Shootout — all enemies in range).
- **`_playSupportCineShot(unit, target, {spellName})`** — ally-targeted
  support two-beat: beat 1 faces the caster casting/throwing, beat 2 GLIDES
  (no hard cut) to the recipient as the gift arrives; light chrome. Returns
  `{sequenceId, sourceHold, travelMs, targetHold, totalMs}` or null (2D/self →
  caller falls back to `_spellFocusCamera`). Wired into
  `_executeAllySpellAnimation` (heal/shield/buff/cleanse — projectile launches
  at sourceHold, aura + heal HP land at arrival via the returned `applyAt`)
  and doItem heal/mana potions (caster THROWS the bottle → recipient plays the
  consume clip on the catch; effect + log land on arrival; shot restores
  itself at totalMs since the item path has no finishAction).
- **×2/×3 repeat attacks no longer reset the camera between swings**: the
  end-of-action `_softResetCameraToUnit` in doAttack's totalDelay timer and
  doSpell's finishAction is SKIPPED while `state._repeatQueue` for that unit
  still has `queued > 0` (or `state._actionExecuting` — covers the stale-timer
  race where swing N's timer fires during the final swing). An aborted chain
  restores via `_rqDrop`; the inter-repeat gap in endUnitIfDone is 500→340ms.

## COMBAT PACING + INTRO POLISH (2026-07-12) — battle.js, three-renderer.js, index.html
Token `20260712a` → `20260712b`. "Everything's a little too fast / camera
leaves the caster too soon / combos are bare lunges" pass:
- **Cast camera dwell**: executeSpellAnimation default cameraOpts 900/900 →
  **1250/1000** (battle.js ~3484); every other plain `sourceHold: 900` call
  site (line-sweep, grapple, etc.) bumped to **1100** via global replace.
  Special VFX-tuned holds intentionally NOT touched: UFO descent 700
  (telegraphMs sync), hook pull 600, dashes. Sniper laser-mark 500/700 →
  750/850. All these paths schedule projectiles off `cam.sourceHold`, so
  launch + cut shift together automatically.
- **Projectile travel window** (getOffensiveCameraTimings ~10519):
  `max(220,min(520,140+d*54))` → `max(260,min(600,170+d*58))`.
- **Combos play real rig clips** (doComboAttack): `_comboStrike(u)` uses the
  same `_unitAttacksWithClip ? triggerAttackAnim : animateStrikeLeap` branch
  as basic attacks; partner swings +180ms after initiator (one-two read).
  Camera sourceHold 750 → 1100. multiHit: gap 300 → **420ms** (must stay
  >350ms — that's triggerAttackAnim's clear window, or the rig clip can't
  re-trigger between hits); follow-up hits alternate initiator/partner, each
  playing their strike clip + firing a 280ms projectile timed to ARRIVE at
  the damage tick (was: projectile launched ON the tick from the initiator
  only, rig frozen).
- **Walk speed** (three-renderer.js startWalkTween ~12093): perTile
  `max(135,190-segs*12)` → `max(155,215-segs*10)` (~15% slower).
- **Intro cinematic** (_runBeats): enemy close-up was ~900ms vs your team's
  2.3s. Enemy tag now at 7800, slow creep-in beat added at 7850 (2.1s), BEAT
  5 sky cut 8800 → 10000, title 9150 → 10350, BEAT 6 11200 → 12400, FIGHT
  12950 → 14150, finish 13650 → 14850, safety net 17000 → 18500.
- **Intro team tags say who's playing**: `_teamLabel` no longer reads
  `state.partyNames[p]` (that's an ARRAY of unit names — it rendered a
  comma-joined list); now viewer → profile username, online opponent →
  `window._NET.opponentName`, else "PLAYER N". Fallback flat VS splash
  `buildPanel` labels updated the same way.

## MYSTERY DUNGEON round 4: companions + tactics + stairs UX + oasis tiles (2026-07-11) — battle.js, ui.js, hud.js, map.js, data.js, styles-hud.css, styles-base.css, index.html, probe_md.js
Token `20260711k` → `20260711m`. Full PMD-ification pass:
- **Stairs are now an explicit CHOICE with real buttons.** Landing the LEADER
  on the stairs (walk OR jump — `doJump._doPostJump` now calls
  `_mdCheckStairs`, previously only `completeMoveAlongPath` did) opens
  uiDialog `mdStairs` (ui.js, pickup-btn styling → hover/press feedback).
  Declining leaves a persistent pulsing **⬇ DESCEND** button in the HUD floor
  badge (`.md-descend-btn`, hud.js Scoreboard MD branch) while the leader
  stands on the tile — that's the re-trigger path since re-prompting needs a
  fresh move onto the tile. A companion landing there just logs a hint;
  descent is leader-gated (`_mdLeaderId` = lowest living slot).
  `window._mdConfirmDescend()` validates leader-on-stairs then
  `_mdAdvanceFloor()`.
- **Pre-run party/loadout select.** Stepping on the hub cave gate no longer
  starts the run instantly: `_mdOpenPartySelect()` (battle.js) stops
  free-roam, exits pointer lock and opens uiDialog `mdParty` — leader locked
  (job editable), roster companions toggleable up to 4 total, per-member JOB
  dropdown (`CLASS_TEMPLATES` keys; `optimizeLoadoutForClass` auto-kit,
  accessories stripped). Confirm → `_mdStartRun(partyCfg)` (snapshots
  `_mdHomeParty` BEFORE applying cfg, so the hub restore stays solo). Cancel
  → free-roam restarts; walk off + back on the gate re-opens it. ESC routes
  through `handleUiDialogSecondary` (state.js:~5981) → cancel handlers.
- **First-companion picker (map.js char select).** On a FRESH save (roster
  of 1) the char-select page grows a second grid: pick ONE companion (3D-ready
  races via `isRace3DReady`, or the "Go Alone" card). The pick is written to
  `ew-md-save-v1.unlockedRaces` on start, so the companion loiters in the hub
  and is default-selected at the gate. `_mdCharSel.comp`: undefined = default
  to first option, null = deliberately solo.
- **Per-companion tactics (auto-battle).** `partyMeta[1][slot]._mdTactic` ∈
  `'manual' | 'auto' | 'guard'` (survives floor rebuilds via
  `run.partyState.meta`); default = manual for the leader, AUTO for
  companions. `_mdUnitAuto(u)` (floors only) routes those units through the
  stock AI: gates added in `_continueBlitzWithUnit_impl` (AI branch),
  `maybeTriggerComputerTurn._shouldAIRun`, `runComputerTurn` (controller
  check), the AI-stall safety timer, `clickTile` (input freeze during their
  turns, mirrors the autoPlayers gate) and `selectUnit` (click = focus panel
  only, like the squadLeader gate). `'guard'` = `_mdGuardRegroup`: >3 tiles
  from the leader with no enemy within 4 → walks the reachable tile nearest
  the leader (same doMove→finishComputerAction contract as ai.js 'move'),
  else falls through to `aiTakeTurn`. **Tactic chips** live under the floor
  badge (hud.js, `.md-tactic-chip`): 👑 leader marker, click cycles
  Manual→Auto→Stay Close (`window._mdCycleTactic`; flipping the ACTIVE unit
  to auto hands its turn to the AI immediately). Leader dies → leadership
  (and manual-by-default) passes to the next living slot.
- **Oasis tiles guaranteed.** `generateMdFloor` step 7 (data.js, placed AFTER
  spawns/stairs so nothing overwrites them): every floor gets ≥1
  `healing_spring` (15% HP/turn, terrain rule already existed) and ≥1–2
  `crystal` tiles (15% MP/turn) in room corners, with a free-room-tile
  fallback for cramped floors. Validated headless: 240 seed/floor/party
  combos — 0 unreachable stairs/enemies, 0 floors missing spring or crystal
  (scratchpad test_mdgen.js; grid stores MF_TID codes — crystal=15,
  healing_spring=18, floors are heightMap===3).
- **probe_md.js updated** for the new flow: confirms the `mdParty` dialog at
  the gate and clicks through `mdStairs` after the stairs move.
- GOTCHA: uiDialogCard handlers — `card.onclick` is reassigned per dialog
  type but `card.onchange` (used only by mdParty's job dropdowns) is reset at
  the top of `renderUiDialog` so it can't leak across dialog types.
- NOT done (candidates next): items/chests on floors, hunger/food, thrown
  items, multiple dungeons (registry supports it), mid-run save/resume,
  companion recruit-on-floor encounters.

## CAMERA PASS: isometric default + sky-gaze lift + kill-cam pull-back + EOR glide (2026-07-11) — three-camera.js, battle.js, state.js, index.html
Token `20260711i` → `20260711j`.
- **New default tactical framing**: `DEFAULT_BOARD_TILT` 50 → **40** (more
  overhead, whole map reads strategically) and `DEFAULT_BOARD_YAW` 0 → **45**
  (isometric). All camera-object seeds (`tilt/yaw`, `_tt/_tyaw`, `_smooth*`,
  `_rest*`), `prepareBattleStateFromCurrentBuilds`, and the view presets
  follow it (STANDARD = DEFAULT_BOARD_TILT, CLOSE 55, FAR 30). Everything
  that returns to `_restTilt/_restYaw` (resets, EOR tour, turn pans) lands on
  the new angle automatically.
- **SKY-GAZE LIFT (three-camera.js `sync`)**: in board/tactical modes (not
  TPS, not keep-subject) the eye's hard floor RISES smoothly as the gaze
  pitches past the horizon — smoothstep ramp starting at dirY −0.35 (~tilt
  70°) up to ground+9 tiles when looking well into the sky. Fixes "terrain in
  the way when looking up at zodiac/sun/eclipse" and the intro's map-name sky
  shot: the camera now hovers ABOVE the battlefield for sky tableaux instead
  of shooting from ankle height. Board sky gazes also aim along the view dir
  FROM THE LIFTED EYE (was: from the ground pivot, which pointed the raised
  camera back down at dirt).
- **Sky cinematic centres first (state.js `playSkyCinematic`)**: the crane-up
  folds a pan to board centre into the same move (upMs 1050→1250, downMs
  900→1050), so the tableau is always shot from over the middle of the map.
- **Kill cam un-sticks (battle.js)**: on an AUTO/AI side, `softResetToUnit`
  kept beat 2's close-up parked on the victim and only levelled pitch — after
  a kill that meant a lingering zoomed-in shot of the gravestone/bones. The
  auto branch now detects the shot victim died (`_cineShotTarget` id →
  dead/_dying) and arms `_armLevelSettle(…, {pullBack:true, x,y})`, a new
  mode that ALSO restores tactical zoom and re-centres on the surviving
  actor. (Player-side press-turn hold already fell through via
  `_shotVictimGone`.)
- **EOR tour glide**: `showEndOfRoundOverview` 520→800ms,
  `eorFocusCamera` default 420→640ms, status-tick dives 400→620ms (tick
  defer 430→650ms), earthquake dive 420→620ms — the resolve sequence reads
  as one slow tour instead of reset-yank-reset.

## AI LAB OVERHAUL: TURBO SIMS + SPRT TRAINING + STRENGTH TEST + SPELL TELEMETRY + AI v3 (2026-07-11) — battle.js, ainew.js, map.js, ui.js, three-renderer.js, index.html
Token `20260711h` → `20260711i`. Big pass on the AI-training / balance-lab
pipeline ("make the CPU a chess engine, get data faster"):

**Animations-off actually off (the reported bug).** The pause "Animation"
toggle never reached the GLB rigs: `_updateUnitModels` ran `mixer.update(dt)`
unconditionally (three-renderer ~8060) and `_syncCombatAnims` kept firing
attack/cast clips. New `_ewAnimsOff()` (mirrors battle.js `_skipVisuals`)
freezes mixers/one-shots/lean, `_maybeStartModelAnim`/`_maybeStartSpriteAnim`
return true (claim, play nothing), lunge/dodge tween creation gated. The
toggle is now PERSISTED (`ew_animationsDisabled` in localStorage, ui.js) —
it used to silently reset every reload.

**Turbo sims (~5-20× more games/hour).** During `devAutoSim` with anims off:
renderFrame drops to ~5fps (`EW_TURBO_FRAME_MS`, default 200, 0=off);
`_waitForAnimationsThen` takes a fast path (only `_walkAnimActive` +
`_dying`, 16ms poll, MAX_WAIT 2s); AI action floors 12→2ms; speed tiers now
[1,2,4,8,16] (new x16 button in the battle dev bar; labs launch at 16 →
effective ×64). CAVEAT: keep the tab FOREGROUND — background tabs clamp
setTimeout to 1s and murder throughput.

**Weight table audit (schema 10→11, key `ai-weights-v11`).** ainew.js's
getAIWeight wrapper used to FLOOR height/CC/kill weights — some floors above
the key's own max (killBonusScore floor 60 > max 50, statusEffectBonus 40 >
max 20, moveHighGroundMelee 2.5 > max 2), so A/B experiments on those keys
tested values the game never saw. Floors are now the real defaults with
widened ranges; wrapper deleted. Weights with board-dependent code paths
carry `probe: 'hourglass'|'nexus'` and `_weightRelevantNow()` skips their
experiments when the training board can't exercise them.

**SPRT early stopping (how fishtest gates Stockfish patches).** Experiments
stop as soon as H1 "side wins 65%" beats H0 coin-flip at α=β=0.05
(bound ±2.944; e.g. 14-2 stops at 16 games). Cap raised 40→60 (only truly
even weights run long). `recordTrainingMatch` → `_finalizeExperiment` with
`exp.sprtEarly`; exports carry the full experiment audit trail.

**NEW: AI Strength Test** (Settings→Developer→"Launch AI Strength Test",
`_selectMode('aistrength')`, `_strengthTestMode`). Mirror teams; champion
(trained weights + ainew overlay) vs BASELINE (default weights via
getAIWeight, stock ai.js via `window._ewStrengthBaseline()` delegation in
ainew). Baseline side flips every 2 matches (de-correlated from the
1-match starting-player flip). Dashboard: WR, Wilson 95% CI, Elo delta,
verdict; export `ew-strength-test.json`. This is the proof arm: run after
training/AI changes; if champion CI doesn't clear 50%, the change was noise.

**Balance Lab data v3 (`ew-balance-stats-v3`).** New `spellUse` bucket =
per-CAST telemetry: `_balSpellCollector` armed in doSpell next to the press
collector, damage/kills attributed in applyDamageToUnit, flushed in
finishAction (cleared in doAttack + finishComputerAction against stale
attribution). Dashboard gains "Casts" tab (dmg/cast, dmg/MP, kills/100MP,
whiff rate). JSON export now has an `analysis` section computed at export:
Wilson CIs on every job/race WR, race WR decomposed into job expectation +
race residual (the BALANCE_NOTES 07-09b method, automatic now), spell
efficiency league, avg rounds/comeback/FK→win. CSV: +wilsonLow/High,
+residualVsJob, +spellUse section. Auto-batch-download every 20 matches is
now Balance-Lab-only (training runs were spamming downloads at turbo speed).

**ainew.js v3 ("chess engine" pass).** pickEngageMove now values each tile
by the BEST REAL SHOT from it (estDamage evaluated from the tile: downhill,
back-arc, armor, +1 range at h≥2) = 1-ply move×action search; threat maps
(`makeThreatFn`) use real per-matchup damage instead of atk×0.65 (lethal
tiles get an explicit death penalty); pickTeamFocus prefers enemies the
TEAM's summed real burst can confirm-kill this round; kills are taken with
the cheapest sufficient action (−MP tiebreak) and chip damage pays an MP
economy tax. Strength-test baseline delegation lives at the top of
aiTakeTurn.

**Known follow-ups**: stock ai.js damage estimate is still `atk*0.65` on its
delegate paths (supports); the balance matchLog could carry per-team kill
totals; dashboard races tab doesn't show the residual (exports do).

## HOTFIX: SUBMERSION CRASH FROZE CAMERA ON SMALL CUSTOM MAPS (2026-07-11) — three-renderer.js
Token `20260711g` → `20260711h`. User repro: playtest a 6x6 custom editor map
→ "Fight!" then the camera never moves and the intro never plays. Cause: the
intro-cinematic march arms walk tweens whose path nodes start OFF-BOARD and
FRACTIONAL (`introCineStart`: `un.x + zi.ox * ~2.8` causeway nodes), and
`_getSubmersionForTile` (added in the water rework) guarded only the ROW:
`boardTerrain[ty][tx]` with a valid row + out-of-range/fractional tx →
`undefined.replace()` → uncaught throw in `_updateWalkTweens` →
`renderFrame` died EVERY frame (camera, intro, everything frozen). Fixed by
guarding the cell (`(terrain || '').replace`) in `_getSubmersionForTile` +
`_getSubmersionDepth`. Lesson for future renderer helpers: any per-frame
board lookup must tolerate off-board coords — intro marches, knockback
arcs, and projectiles all leave the grid; one throw in renderFrame bricks
the whole game loop.

## MULTI-FLOOR PASS: WRONG-FLOOR MOVES + COLUMN REPAINT + CAMERA (2026-07-11) — battle.js, map.js, hud.js, three-renderer.js
Token `20260711f` → `20260711g`. User bug batch from a vertical editor map
(surface + underground floors). KEY ARCHITECTURE FACT for future sessions: the
engine is ALREADY voxel-3D — `state.boardColumns[y][x]` = [{z,terrain}],
`getWalkableSurfaces(x,y)` (map.js ~1860) lists every standable floor of a
column, and getMoveTiles/findMovePath/doMove are a proper Dijkstra over
(x,y,z) surface nodes (the right algorithm for this — do NOT rebuild as A*).
Every "column" bug lives in the LEGACY 2D lookups layered on top:
`state.boardHeights`/`getHeightAt` = column TOP, `getTerrainAt` = top terrain,
z-agnostic `find(t => t.x===x && t.y===y)` picks an arbitrary floor. Fixed:
- **Ghost-says-surface-but-walks-underground**: hover preview (battle.js
  `_updateMoveHoverPreview`) picked the dest floor by closest-to-unit-z and
  drew ghost/arrow at `tileTopY` (column top) — the arrow LOOKED like a
  surface route while the click resolved elsewhere. Now: renderer publishes
  the hovered surface in `state._hoverZ` (three-renderer `_resolveHoverAt`,
  from `_surfaceZFromHitY`), preview+click+doMove all resolve with ONE rule —
  exact clicked/hovered z, else reachable floor CLOSEST to it — and ghost +
  path waypoints draw at the real per-node z via new exported
  `ThreeRenderer.surfaceYAt(x,y,z)` (multi-floor twin of tileTopY).
- **2-move (walk+walk) click could teleport to an unreached floor**: clickTile
  ring-2 branch took `destZ = _clickedZ` on faith even when the ring-2 tile
  was a different surface (and findMovePath could return [] → half-walk with
  final position set anyway). Now bestInterm search records the ACTUAL
  reachable r2 tile (exact clicked floor preferred over cost) and uses its z;
  hover preview mirrors the same selection.
- **Tile quick menu**: `state._tileActionTarget` now carries `z` (all 6
  assignment sites in clickTile); `_computeTileActions(unit,tx,ty,tz)` ranges
  against the clicked FLOOR (was `getHeightAt` = roof) and "Move here"/"Jump
  here" pick the clicked floor's tile (was first-match).
- **Terrain spells repainted whole column**: map.js `setTerrainAt(x,y,t)`
  looped every block in boardColumns/boardVoxels (all callers inherited it —
  fire residue, leaveTerrain, state.js decay). Now paints ONE block: new
  optional `z` arg, default topmost non-void; legacy boardTerrain mirror
  always reflects the top block. battle.js terrainCreate `_paintSpellTile`
  anchors each tile's painted floor to the CAST's surface (`_anchorZ` = spell
  z arg or caster-nearest surface; `_paintZAt` per tile) so casting fire in a
  cave paints the cave floor, not the roof; interior paints skip the water
  runoff model (top-height based = roof from down there). Water/flood on the
  open surface unchanged.
- **Camera stayed at surface over underground units (tiny unit)**: every
  focal-height path used `getHeightAt` (column top) for grounded units —
  unit.z only honored when airborne. New shared `_camFocalZAt(x,y,u)`
  (battle.js, next to `_camFocalUnitAt`): flyer z / grounded unit's own z
  when BELOW column top / else terrain. Wired into `_apply` (integer +
  fractional branches), `_naturalElevAt`, `focusOnTiles` (a below-top unit
  WINS the multi-point max), and `unitElevationZ`. Framing distance is
  unchanged (boom = baseDist/zoom), so underground turns get the same
  tactical view as surface turns. NOTE: canopy cutaway already existed and
  works on editor/community maps (`_updateCanopyCutaway`, three-renderer
  ~11128; blocks need `_ew_canopy` tags which need void gaps — only preserved
  when `_authoredVoxelGapsArePreserved()`); the "camera didn't descend" was
  purely the focal bug.
- **Enemy quick-menu vs engine (out-of-range after move / missing spells)**,
  hud.js `_computeEnemyActions`: dash menu gate was cardinal-axis-only but
  engine dash (doSpell ~32149) is plain 2D Manhattan + passable — diagonal
  dashes were hidden; `findMoveIntoRange` measured `combatDist` while the
  engine barrage path uses `combatReach(longRange)` (gravity drop) — hid
  legal barrage approaches, now takes a longRange flag; leap-strike menu
  compared roof-boosted `getUnitStandingHeight(target)` but engine compares
  the target's RAW z — aligned; fog: primary attack/spell checks now apply
  `isInVision` parity (`_fogSees`) like doAttack/doSpell.
- KNOWN FOLLOW-UPS (not done): TPS/cinematic shots for underground units
  (boom-collision rig assumes open air — pivot uses `_camGroundPx` = column
  top); building-interior cutaway (house roofs are separate object meshes,
  never `_ew_canopy`); beam menu ray is 2D (ignores elevation); 3D-aware
  flood/runoff across interior floors; terrain-spell ghost preview
  (`predictTerrainSpellChanges`) still previews at the surface even when the
  paint will anchor to an interior floor.
- NOT playtested (RULE #1c) — syntax-checked + isolated node test of the new
  setTerrainAt only. First live checks: on a multi-floor editor map (1) hover
  a multi-surface column in move mode — ghost/arrow must sit on the floor the
  cursor points at, click must land exactly there; (2) cast a fire/ice
  terrain spell on the surface, then dig down — buried blocks keep their
  terrain; (3) start a turn with a unit in a cave — camera descends to it;
  (4) quick-menu a diagonal enemy with a dash unit — dash row present.

## AI BALANCE PASS: LINE-BEAM WHIFFS + JOB TENDENCIES (2026-07-10) — ai.js, ainew.js, battle.js
Token `20260710u` → `20260710x`. **DESIGN RULE (from the user): towers/Cubes
are damageable by BASIC ATTACKS ONLY. Spells must NEVER damage towers — the
spell-vs-tower code paths were never supposed to exist.** Removed this pass
(battle.js): `_resolveOffensiveTarget` tower branch (damage/ricochet),
`_resolveMultiHitTower` damage body (both now reject with "The Cube shrugs
off <spell>" at no MP/AP cost), the AoE-tile Cube chip in `_applyAoeDamage`,
and the tower clause in the spell-usability check. ai.js: `scoreSpellsOnTower`
+ the `spell_tower` executor case deleted outright. Basic-attack tower
targeting (`_getAttackValidTargets`, attack_tower AI path) is untouched. Driven by balance-lab export (168 matches) +
20-match batch export. Headline: the 3 weakest races (ki fighter 31.6%,
martian 32.7%, atlantean 39.6% WR) and worst spells (Instant Transmission
15.4%, Ki Wave 24.1%, Heat Ray 25%) were AI bugs, not stat problems.
- **Line/beam whiff bug (user-visible: "AI beams hit no one")**: 33/108 line
  casts in the batch hit 0 targets (Ki Wave 46%, Hellmouth 50%, Railgun 44%).
  THREE causes, all fixed: (1) ainew.js findFocusAction scored line spells
  over `getSpellRangeTiles` (a Manhattan blob) but the engine fires beams in
  `sign(target-caster)` direction along the 8 rays only — misaligned targets
  are unhittable. Now walks the real rays. (2) queueComputerAction's ~370ms
  telegraph lets the target move between decision and cast → stale tile →
  misaligned beam. Both AIs now re-aim at cast time via shared
  `window._aiReaimLineSpell` (ai.js) and abort if every ray whiffs. (3)
  ai.js scoreSpellsOnTower let line spells shoot the Cube with a 200-pt score
  floor, but the beam path has no tower-hit code (towers are basic-attack-only
  by design) → guaranteed no-op AP/MP burn every turn near a tower. Fixed by
  deleting scoreSpellsOnTower (spells never target towers, period).
  Also scoreSpell's line branch scored `Math.max(hits,1)` — a guaranteed whiff
  scored as a full hit (+ kill bonus). Now real hits only, 0 = don't cast.
- **Teleport was double-dead**: scoreTeleport returned 0 for any non-Psychic,
  AND findSpellTarget returned an ENEMY unit whose occupied tile doSpell
  always rejected. Instant Transmission (ki fighter) was a dead spell slot →
  15.4% WR. Now: all classes, picks an EMPTY tile, escape (<35% HP + melee
  adjacent) or blink-to-engage scenarios.
- **Anti-focus-fire skew (early code)**: per-activation repeat penalties were
  spell ×0.15 after ONE cast (crippled one-spell kits: Ki Wave, Fireball) and
  target ×0.6/×0.3 on re-target (spread damage instead of finishing kills).
  Now: damage spells decay ×0.65/use (hard cap at 3), re-target penalty only
  applies when the target is above 45% HP.
- **Control undervalued**: scoreStatusEffect scored stun at ~20, and
  root/sleep/freeze/charm fell through to the default 4(!); the `debuff`
  scorer ignored statusEffects entirely (Discordance/Stasis Beam ~never cast).
  Hard CC now scores 40-90 vs full-AP targets; debuff kind sums its riders.
- **Job tendencies layer (ai.js JOB_TENDENCIES)**: small multipliers so units
  play their role — White Mage heals first (damage ×0.45 while an ally <60%
  HP and a heal is affordable) and stays backline; Black Mage backline,
  spell-damage ×1.35, basic attack ×0.6 when a damage spell is affordable;
  Psychic/Harbinger value control/support; backline jobs prefer standoff
  tiles (penalty for walking into melee, higher threat aversion). Buffs are
  now stat-aware: INT buffs (Harmonize) go to casters, ATK buffs to hitters,
  not lowest-HP. Harbinger added to ainew.js PURE_SUPPORT so the bard kit
  runs the stock support path (Harbinger was 40.3% WR played as a bruiser).
- **Still watch after next lab run**: structure spells (5G Tower 21%,
  Watchtower 23%, Federation Beacon 24%, War of the Worlds 22% WR) — maybe
  genuinely weak, re-measure post-AI-fix before buffing. Atlantean's low
  output (0.68 kills/game) may persist. catgirl 68.5% / werewolf 61.9% /
  halfdemon 61.4% are the over-performers to check next.
- NOT playtested (RULE #1c) — syntax-checked + node-stub test of
  `_aiReaimLineSpell` only. First live check: a ki fighter VS-CPU match —
  Ki Wave should visibly hit, teleport should fire, White Mage should heal
  before attacking.

## UNIVERSAL BUILD ACTION (2026-07-10) — data.js, battle.js, hud.js, ui.js, online.js, ai.js, party-builder.js
Token `20260710s` → `20260710t`. Minecraft-style place/dig became a first-class
VERB every grounded unit has (goal: creativity + a guaranteed way out of any
pit — you can always quarry a wall and stack your way out). NOT playtested
this session (RULE #1c) — syntax-checked only; first live run should check:
enter/exit build mode (root ⚒ blade / B key / More row), a place, a dig, the
hotbar swap, and one AI build.
- **Retired**: `timberBlock`/`stoneBlock`/`steelBlock` spell defs + their
  Harvester/Engineer class-list entries (data.js) — one-block placement is no
  longer a spell. The `placeBlock` kind plumbing (SPELL_KIND_META, handler,
  preview) stays for compat. The More-menu 🔺Raise/🔻Lower reshape rows are
  gone too (superseded); `doReshape`/`canReshapeTile` still exist for the
  move-then-cast height-approach probe. Bigfoot's Rampart et al. KEPT — those
  are multi-tile damage walls, not "simply place 1 block".
- **Engine (battle.js, after doReshape)**: `BUILD_ACTION_CONFIG` (data.js:
  1 AP, reach 1 chebyshev incl. own tile, vReach 3, eruptDamage 22) +
  `BUILD_MATERIALS` (wood→wood_planks 🪵, stone→cobblestone 🪨, metal→metal ⚙️).
  `doBuildAction(unit,x,y,tool)` tool∈dig|wood|stone|metal; validity via
  `_buildProblem` (single source for handler/highlights/ghost/AI; place path
  reuses `_placeBlockProblem` so erupt-shove/water-stepping-stone/occupant
  rules match the old spell, dig blocks walls/objectives/buildings/objects/
  liquids/bedrock). Dig salvages `digSalvageMaterial(t)` = family or STONE
  fallback (plain earth pays — that's the anti-softlock loop) + entropy;
  tree tile = fell (`_fellTreeAt`, +1 🪵); water settles into fresh pits;
  occupants drop/ride (`unit.z` fixups). Place under enemy erupts (flat 22 +
  1-tile shove + `_applyKnockbackHazard`/trap trigger). SINGLE-CLICK (no
  confirm) and the mode STAYS armed while AP lasts (human turns only).
  `predictBuildChanges` + `_updateBuildHoverPreview` drive the hover ghost
  (`showTerrainGhost`). Exported on GAME: doBuildAction/_buildProblem/
  _buildActionProblem/predictBuildChanges/unitBuildOpsPerAP/digSalvageMaterial/
  defaultBuildTool/BUILD_ACTION_CONFIG/BUILD_MATERIALS.
- **UI (hud.js/ui.js)**: root Horologe blade ⚒ Build (toggles like Move;
  greyed with reason from `_buildActionProblem`), ⚒ Build row in More, B key
  toggles (ui.js battle keydown), right-click/ESC/crown backs out
  (`cancelActionSelection` clears the ghost). Build aim view = hotbar blades
  `_hrlgBuildBlades` (⛏ Dig + per-material with ×count, `state._buildTool`
  arms). Reach highlights in the ui.js `_hlCache` chain: 'placeable' blue for
  place, 'combo-target' orange for dig; `_hlKeyParts` gained
  `_buildTool`+matBank so tool swaps repaint. Tile quick menu gained one-tap
  "⛏ Dig Block"/"🧱 Place Block" rows (`_computeTileActions`). NEW `.hrlg-mats`
  strip (team 🪵🪨⚙️ bank, always visible under the item slots; 🧤+N shows a
  banked free op) — mats/buildCharge props on HorologeMenu; CSS next to
  .hrlg-pip block.
- **Mason's Gauntlets accessory** (`masons_gauntlets`, EQUIP_DEFS + ACC_ICONS
  🧤): 2 build ops per AP via `unit._buildCharges` (spend AP → bank 1 free op;
  reset at the 4 `_reshapeThisTurn` turn-reset sites). KNOWN EDGE: a charge
  banked by the unit's LAST AP is lost (blitz ends the turn at ap 0 —
  deliberately not made charge-aware, too many unitFinished/canUnitAct gates).
  AI equip prefs: Harvester/Engineer prefer it (optimizeCurrentTeams).
- **Online (online.js)**: doBuildAction engine-relay wrapper + host dispatcher
  case; guest clickTile relays `_ctx.buildTool` (restored in
  _executeRemoteAction, host UI snapshot keeps its own); guest build clicks
  are single-click/stay-in-mode (new branch before the pendingTarget arm);
  `_buildTool` added to the state-sync SKIP list (per-client UI).
- **AI (ai.js)**: `scoreBuild` replaced scoreReshape in gatherCandidates
  (flyers still route to scoreAltitude): (a) pillar-under-self high ground
  (reshape-raise weights, now costs a block), (b) dig own tile vs elevated
  ranged threats, (c) erupt-shove adjacent enemy (hazard/own-trap landing
  bonus), (d) SOFTLOCK ESCAPE score 40/38 — no moves + no targets → stack
  underfoot or quarry an adjacent wall. `executeAction case 'build'` gauges
  success on AP OR `_buildCharges` drop (never the reshape-style AP check
  alone — gauntlet ops are AP-free).
- **Materials economy**: `MAT_START_STOCK` 2/2/1 → 3/3/1. Dig now the
  universal faucet (earth→stone). Spend: build action + structure spells.

## WATER REWORK (2026-07-10) — battle.js, map.js, data.js, three-renderer.js
Token `20260710n` → `20260710o`. Water made liquid-like (the Meteor→Flood→
lightning "electrocute the crater" combo now works):
- **Flood (`raceFlood`, `elevationFlood`) basin fill**: was "spread through
  connected tiles at/below the TARGET's floor" — cast on a meteor-crater
  center (center −2, ring −1) it wet only that 1 tile. Now
  `computeElevationFloodTiles(x,y,cap)` (battle.js, next to
  `settleWaterAround`) raises the waterline level by level (max head
  `FLOOD_MAX_POUR = 3`) and keeps the highest line whose connected
  below-line region fits in `tileCount` — craters/trenches fill to the rim
  (waterline−floor ≥ 2 ⇒ deep_water, chasm ⇒ deep). Open ground = old capped
  floor-level spread. Shared with the ghost preview (`spell.kind ===
  'terrainCreate'` preview branch) so the hologram matches.
- **Minecraft runoff**: all terrainCreate WATER paints (squareFlood/
  orientable/BFS branches) route through `_paintSpellTile` → `_waterRunoffDest`
  — water conjured on a slope/ledge slides downhill (steepest cardinal drop)
  to a local low or merges into standing water; fell ≥ 2 ⇒ deep_water. No
  more lone elevated water cubes. Runoff destinations are added to
  `affectedTiles` (damage follows the wave); dedupe via `_pushAffected`.
- **Water interactions**: conjured water on `lava` ⇒ `obsidian`; snuffs
  burning tiles it covers (`extinguishTile`); units caught by fresh water get
  `_applyKnockbackHazard` (deep = instant drowning bite, as Flood already did).
- **Burn cure**: standing in / entering `water`/`deep_water`/`healing_spring`
  clears `burn` + `lava_burn` (in `updateTerrainStay`, map.js — runs on every
  move and each round tick); `_applyKnockbackHazard` also douses on knock-ins.
- **Visual**: water/deep_water tile tops render `WATER_TOP_INSET = 0.18` of an
  elevStep below the block line (three-renderer.js — shortened box in the flat
  path + top run of voxel columns) so shorelines show a ridge. Lava exempt.
  Units already sink 0.22/0.45 (SUBMERSION_DEPTH) so they still read submerged.

## NORDIC SPELL/VFX REWORK (2026-07-10) — data.js, battle.js, ui.js, ai.js, party-builder.js, three-vfx-effects.js
Token `20260710j` → `20260710k`. The Nordic alien kit got the dramatic
PS1-era-JRPG treatment plus mechanical reworks:
- **Aurora Ray**: `kind: 'line'` → ranged **3×3 AoE** (`kind:'aoe'`, range 5,
  aoeRadius 1, dmg 160, still applies glare). VFX is a full descent cinematic
  (`raceAuroraRay_descent`): blue telegraph rings → a **3D aurora curtain**
  (`sigAuroraCurtain3D`) dances over the area while light-shafts + glitter-rain
  pour down; per-tile prismatic bursts on impact.
- **Resonance Pulse**: cross → **full diamond** (`diamond: true`,
  crossRadius 2 = 12 tiles + center). New `getDiamondArea()` (battle.js, next
  to getSquareArea) + `diamond` support in the cross handler, range preview,
  ui.js footprint/highlight, ai.js scoring/targeting, party-builder label, and
  a `'diamond'` shape in three-vfx-effects `_buildTileOffsets`. VFX =
  `resonancePulse_aoe` (diamond-staggered stun-ring ripples) + sonic-boom rings
  + a spinning magic circle under the caster. The mana formula prices diamond
  crosses at E 3.4 (data.js `_mfEffectiveTargets`).
- **Stasis Beam**: bespoke **spiraling beam** — `sigSpiralBeam3D` (core lance +
  2 counter-rotating helix tubes + energy rings racing along it), fired from
  battle.js's debuff branch (`_spiralBeamSpells` map, which also gives **Glare**
  a violet spiral), capped by a frozen-light `sigLightPillar3D` stasis column
  on the victim.
- **Federation Beacon**: aura radius 2 → **4**, and regen now pulses at the
  **start of each ally's turn** (`healOnTurnStart: true` on the spell → flag on
  the deployed object → hook in `_continueBlitzWithUnit_impl`, battle.js
  ~19845). End-of-round totem healing skips `healOnTurnStart` objects so it
  can't double-dip. Pulse VFX = `sigRegenPulse3D` at the pylon + heal burst on
  the unit.

### New reusable VFX primitives (three-vfx-effects.js, exported on ThreeVFXEffects)
Compose future spells from these the same way the sig toolkit is used:
- `sigAuroraCurtain3D(tx, ty, {radiusPx, height, baseY, ms, curtains, opacity,
  hues[]})` — waving vertical aurora ribbons with per-column sine dance and
  green→cyan→violet HSL drift. Used by: Aurora Ray (strike curtain), Nordic
  Accord (gentle team shimmer via `_spell3DGeometry.raceNordicAccord`).
- `sigSpiralBeam3D(fromTx, fromTy, toTx, toTy, {color, coreColor, ms,
  helixRadius, turns, strands, rings, spinSpeed})` — helix-wrapped lance
  between two units. Used by: Stasis Beam, Glare. Good fit for any channeled
  single-target ray.
- `sigRegenPulse3D(tx, ty, {color, radiusPx, ms, pillar})` — soft healing wave:
  ground ring + shimmer pillar + rising heal-cross motes. Used by: Federation
  Beacon turn-start pulse AND all end-of-round healing totems (the old
  invisible totem tick is now visible).
- `_buildTileOffsets(shape, r)` now accepts `'diamond'` — any EFFECTS def with
  `shape: 'diamond'` gets Manhattan-diamond tile bursts (staggered outward).

## TACTICAL-ONLY BETWEEN ACTIONS + EDGE-PAN CLAMP + FLYER FOCAL (2026-07-10) — battle.js, state.js
Token `20260710d` → `20260710e`. User feedback fixes:
- **Between-action TPS retired**: new `TPS_BETWEEN_ACTIONS = false` master
  switch (battle.js, contextual-shots block ~10290). The camera now stays in
  the TACTICAL board view for the whole game; over-the-shoulder only engages
  for the spell/ability ACTION shots (`_playCineActionShot` / dash / descent).
  Gated: `_tpsUnitShot` (returns false → every caller's tactical fallback:
  turn activation, soft-reset), `_tpsTargetShot` (target select/cycle now does
  a tactical pan framing caster+target midpoint via focusBoardCameraOnTiles,
  zoom/tilt untouched), `window._tpsTurnShot` (back-to-menu → tactical
  soft-reset), `getTurnStartCamYaw` (turns open at the RESTING yaw, no
  per-unit board spin). Flip the const to true to restore the old contextual
  TPS everywhere.
- **Basic attacks never action-cam**: `performAttack`'s
  playOffensiveActionCamera call passes `noActionCam: true`; the new gate in
  `_cineEligible` routes it to the tactical midpoint pan. Spells/abilities
  keep their action shots.
- **Edge pan clamped to the board** (state.js `_edgePanTick`): focal x/y capped
  to [0, bw()-1]/[0, bh()-1] before `camera.snap`, so riding the screen edge
  can no longer scroll the map off screen. Right-drag hand pan intentionally
  NOT clamped.
- **Flyer focal height** ("camera not in the air until the flyer moved"): the
  camera's natural focal tracking only honored airborne altitude when the
  camera sat at EXACT integer tile coords; any fractional focal (mid-tween
  settle, TPS shoulder offset, post-pan) fell into the bilinear branch which
  interpolates TERRAIN heights only → focal at ground under a hovering unit.
  Also `unitAt()` prefers the GROUND unit of a stack, burying a flyer with
  someone beneath it. Fixes: new `_camFocalUnitAt(x,y)` (airborne unit wins
  when it's the active/selected unit or nothing is under it) used by
  `camera._apply` (both branches — the fractional branch now lifts to the
  flyer's altitude at the rounded tile), `_naturalElevAt`, and
  `focusOnTiles`.
NOT playtested (RULE #1c). Watch: target-cycling now pans the board midpoint
instead of swinging a TPS shot — verify it reads OK with far targets; flyer
focal pop when the camera crosses the 0.5-tile rounding boundary (cosmetic).

## PREDATOR DROP AIRBORNE + HOROLOGE UX OVERHAUL (2026-07-10) — battle.js, hud.js, ui.js
Token `20260709z` → `20260710a`. All four files must ship together.
- **Predator Drop from the air (battle.js doSpell)**: sky grabs (skyDrop /
  skySlam / skyThrow grab phase) now bypass the generic 3D combatReach range
  gate and the LOS gate — `_isSkyGrabCast` uses `_rawDxy` (2D Manhattan),
  matching getSpellRangeTiles/_getSpellValidTargets. The 3D gate was counting
  an AIRBORNE caster's own altitude against the range-1 grab ("out of range"
  after the move-into-position walk); it only ever worked from the ground.
- **UNIVERSAL castability guard (battle.js)**: `getSpellBlockReason(unit,
  spell)` (window-exported) = the ONE place for hard cast locks — silence,
  tier, cooldown, **Berserker's Brand/Archon's Focus choice lock**
  (`unit._brandLockSpellId`), AP, materials, mirror prisms, MP (MP checked
  LAST — canAffordSpell treats a bare 'No MP' as passable since its callers
  gate MP themselves). canAffordSpell delegates to it, so the ability drum,
  quick menus, canCastAnySpellWithTargets and both AIs all inherit any new
  rule added there. hud.js `_hrlgSpellBlades` shows the returned reason
  string (e.g. "🔒 Brand-locked") on the greyed blade.
- **`spellTargetUsableOn(unit, spell, u)` (battle.js, window-exported)**:
  per-unit target validity — heal needs a DAMAGED ally, cleanse an ally with
  an actual `kind:'debuff'` status, revive a revivable corpse. Enforced in
  `_getSpellValidTargets` (drum lists), `hasSpellTargetInRange` (heal/cleanse
  split out of buff/shield → blade greys with 'No target'), and doSpell's
  cleanse executor (map clicks can't waste MP on a clean ally).
- **No menu blink while target-picking (hud.js + battle.js)**:
  `GAME.boardBusy(opts)` takes `{ignoreCamera:true}`; `_hudBoardBusy` passes
  it while `st.pendingTarget && !st._actionExecuting`. The caster→target
  TPS preview glide no longer hides the whole Horologe on every first click
  (that blink was why the two-click confirm read as broken).
- **Big green CONFIRM button (hud.js)**: `.hrlg-confirm` banner above the
  view tab whenever a ✓ pick is pending in any targeting view (attack/spell/
  item target drums AND free-aim); fires the same selectTargetFromMenu
  confirm. The pending row also gets `.pend` (green edge, pulse) + a
  "✓ TARGET" chip instead of the old tiny checkmark.
- **Caster-POV camera on MAP clicks (battle.js clickTile)**: first click on a
  unit while attack/spell/item is armed now calls `_tpsTargetShot` (menu
  picks already did); selectTargetFromMenu's camera condition switched from
  actionMenuView-list to actionMode-based so it also fires for free-aim
  spell target lists.
- **View tab names the armed tool (hud.js)**: aim views show the SPELL/ITEM
  name (was "Abilities"/"Items"); aim viewKey includes the tool so the drum
  resets per spell.
- **Target drum for tile-aim spells (hud.js)**: aim|spell view now renders
  `_hrlgTargetBlades` + CANCEL whenever `_getSpellValidTargets` has units
  (kinds in `_tileOnlyKinds` — placements/deploys/teleport/dash/seeds —
  keep the lone CANCEL). Both paths (list pick / board click) always exist.
- **Back = exactly one level (ui.js handleBackAction)**: armed spell aim →
  ABILITIES list (was cancelActionSelection → root); armed item → ITEMS;
  target lists clear pending AND step out in one press (the pending-only
  step made back feel dead). hud.js: right-click ANYWHERE on the rig =
  crown back (never END TURN) — the board's right-click handler never fired
  over the HUD, which is why back "randomly didn't work".
- **Drum wheel rework (hud.js)**: WINDOW-capture wheel listener while the
  menu is mounted — any wheel inside the rig's bounding box cycles the drum
  (delta ACCUMULATION, one row per ~80px, deltaMode-aware) instead of
  leaking to board zoom the moment the pointer drifts off a blade. Skips
  events inside `.pause-card/.ew-dialog/.modal`.
- **Scrolled-out ≠ disabled (hud.js)**: `_hrlgSlot` shows TWO peek rows
  (op 0.62/0.3, full color); disabled rows are now categorically different —
  flat, desaturated, DASHED left edge, red reason tag. Overflow arrows moved
  past the second peek row (`_arrowTy` +2.55).

## CAMERA OVERHAUL round 4 — boom crane-over + orbit continuity (2026-07-09, same session)
Token `20260709x` → `20260709y`. three-camera.js, battle.js, state.js.
- **Boom collision CRANES OVER obstacles** (three-camera.js): when terrain
  blocks the pivot→eye boom of a TPS/keep-subject shot, the eye now keeps
  the full boom length and RAISES just enough to clear the height field
  (exact LOS: needY = max over samples of pivY + (g+clear−pivY)/t), falling
  back to the old dolly-in only past a crane cap (pivY + dist×1.15). The old
  dolly-only response jammed the lens to 0.14×boom whenever a unit stood
  against a cliff — the "turn shot is a zoomed-in wall, my unit isn't even
  on screen" bug and the "action cam way too zoomed in" bug.
- **Roof-aware ground**: new `window._camGroundPx(tx,ty)` (battle.js, =
  tileElevationZ: terrain + walkable-roof px). ThreeCamera `_groundYWorld`
  prefers it, and `_cineTpsAnchor`'s subject lift now uses
  `unitElevationZ(unit) − _camGroundPx(tile)` (covers airborne AND standing
  on structures).
- **Orbit keeps the TPS rig**: middle-drag / right-stick / 3-finger orbits
  set `state._userOrbiting`; `camera._apply` drops `_tpsHold` only on a real
  PAN (`_userPanning && !_userOrbiting`). Middle-clicking during the turn
  shot used to release the rig instantly (pivot+aim swap = perceived random
  zoom-out); now you orbit around your character, and only RMB-pan / edge
  pan detaches.
- **Tilt cap 135° → 170°** everywhere (MMB drag, 3-finger touch, right
  stick): can look nearly straight up at the zenith.
- **Edge pan yields to turn activations**: `_deferredTurnPanUnitId` set →
  edge pan stops and delivers the pan, so a mouse parked at the screen edge
  can never leave the camera on the previous action's framing when a new
  unit's turn starts.
NOT playtested (RULE #1c). Watch: crane cap feel on tall walls (falls back
to dolly ≥5-ish levels), shoulder offset side flip when orbiting 180° under
a hold (cosmetic).

## CAMERA OVERHAUL round 3 — elevation + edge pan (2026-07-09, same session)
Token `20260709w` → `20260709x`. battle.js, state.js. User feedback fixes:
- **Airborne TPS pivot** (`_cineTpsAnchor`): the rig anchors its pivot at the
  GROUND under the subject, so every shot for/at a FLYER framed the empty
  ground beneath it. The shoulder lift now adds `_getElevationPx(unit.z) −
  groundH×ts` for airborne subjects. Fixes flyer turn shots, flyer action
  shots (attacking up AND down), dash cams with a flying caster.
- **Airborne target resolution** (`selectTargetFromMenu`): `unitAt(x,y)`
  prefers the GROUND unit of a stack, so picking an airborne target from the
  menu aimed the TPS shot at whoever stood beneath it — never looked up. Now
  resolves `unitAt(x,y,z)` first (menu passes the target's z).
- **Vertical gap in the boom**: `_tpsTargetShot` and `_playCineActionShot`
  size the boom from `hypot(horizontalTiles, elevGapTiles)` so steep up/down
  shots get the same breathing room as long flat ones.
- **Tactical distance**: `MAX_AUTO_ZOOM_OUT_TILES` 12 → 20 (the 12-row clamp
  was why tactical hugged the board); close preset 1.45 → 1.35; Move/spell
  tile-aim zoom = the WIDER of range-fit and `getDefaultZoom()`. TPS shots
  keep their fixed world boom, so third-person stays closer than tactical.
- **Edge pan (League-style)** in state.js next to the drag handlers: cursor
  within 20 px of the viewport edge pans that way (1000 px/sec screen-space,
  converted via `ThreeCamera.screenDeltaToWorldXZ`, CSS-fallback math too).
  Gated: battle/editor phase, cursor over the battlefield (canvas /
  #boardStage / #board / .map-center), no pointer lock, no hand drag, no
  dialog, camera not busy / no cine shot / no tween. Sets `_userPanning`
  while active (height latch + TPS-hold release like a real drag), and
  delivers a deferred turn pan on stop.
NOT playtested (RULE #1c). Watch: edge pan speed feel; `_edgeOverBoard`
selector coverage if the battlefield wrapper classes change.

## CAMERA OVERHAUL round 2 (2026-07-09, later session)
Token `20260709v` → `20260709w`. three-camera.js, battle.js, ui.js.
- **Unified collision rig (three-camera.js `sync`)**: the three aim branches
  (TPS / cine keep-subject / free-look) collapsed into ONE rig. Every mode now
  ray-marches the pivot→eye boom against the height field and floors the eye
  above the ground — the camera can NEVER go below the map. Board free-look
  craned past 90° aims ALONG the view dir from just above the ground (sky
  visible, unit rides the lower frame); level/down and `_cineKeepSubject`
  keep the classic look-at-focal orbit. The zodiac/celestial sky cinematic
  (state.js `playSkyCinematic`) no longer dives under the board.
- **Move/jump = one CANONICAL tactical view** (`setActionMode`): always
  moveTo(tilt = active preset's tactical tilt, zoom fit to the unit's move
  range `computeZoomForVisibleTiles(2*mv+4)`, centred on the unit). No more
  "relative nudge only if >8° off". Spell tile-aim uses the same
  `getTacticalTilt()`.
- **Turn TPS shot is over-the-shoulder**: `_tpsUnitShot` pushes the focal
  0.55 tiles screen-right (`TPS_SHOULDER_TILES`, same as Strike Mode's
  `SHOULDER_TILES`) so the character rides left-of-centre, not dead-centre.
- **View presets (C key / pad camera button)**: `CAMERA_PRESETS`
  standard(50°, 1.0×, FOV45) / close(58°, 1.45×, FOV50) / far(38°, 0.72×,
  FOV42), persisted in `ew_cameraPreset`. Preset tilt drives `_restTilt` +
  `getTacticalTilt()`; preset zoomMult scales `getDefaultZoom()` (so it
  sticks); FOV via new `ThreeCamera.setFOV/getFOV` (applied lazily in
  `getCameraMode`). `cycleCameraMode` → `cycleCameraPreset`.
  `_setCameraMode_RETIRED` + CAMERA_MODE_LABELS/ICONS deleted.
- **Hidden-info leaks fixed**: `_shouldCameraFollowUnit` +
  `playOffensiveActionCamera` + `playCinematicAttack` now also refuse to
  follow CONCEALED (invisible/smoke) actors with fog OFF; floating combat
  text (`_realShowFloatingTextAtTile_impl`) drops pops on units/tiles the
  viewer can't see (fog + concealment; `_fogRevealTiles` window still shows).
- **Attack target cycling**: Tab cycles basic-attack targets too
  (`cycleAttackTarget`, `state._attackCycleTargets`), swinging the TPS shot
  per target. Item target picks also fire `_tpsTargetShot` now.
NOT playtested (RULE #1c). Watch: preset far zoom vs `clampAutoZoom` floor
(12-tile cap can re-clamp wide framings on non-bypass moves), the tilt-90°
aim handoff during the sky cinematic tween (damped, should be invisible).

## CONTEXTUAL CAMERA — modes retired (2026-07-09, same session)
Token `20260709u` → `20260709v`. battle.js, ui.js, hud.js. The Tactical/
Follow/Cinematic camera-mode buttons are GONE; the camera is contextual:
- **Your unit's turn starts** → TPS behind the unit (`_tpsUnitShot`, tilt 78,
  boom via `_tpsBoomZoom`, yaw = behind facing).
- **Move/jump or a tile-targeted/orientable spell armed** → automatic
  tactical overhead (rest tilt clamped ≤ REST_TILT_MAX; spells add the
  range-fitting zoom). Drops the hold.
- **Enemy target select/cycle** (attack arm, unit-target spell arm,
  `cycleSpellTarget`, `selectTargetFromMenu`) → `_tpsTargetShot(caster, tgt)`
  — caster-anchored TPS looking at THAT enemy, same slope-tilt/off-axis-yaw
  math as the action shot so the preview == the cast framing.
- **Back to root menu** (cancelActionSelection, ui.js) → `window._tpsTurnShot()`.
- **End of round** → tactical overview (hold dropped, tilt clamped).
- **Action execution** → the TPS action shots (previous entry).
Mechanism: `camera._tpsHold` keeps `_cineTps` engaged with no shot id; it
drops in `camera._apply` on hand-pan / phase change / winner / full-map
overview, and explicitly at move-arm, tile-spell-arm, AI turn activation and
EOR. `softResetToUnit` lands post-action returns back on the TPS turn shot
while the hold is live (except `focusTarget` pans); `_armLevelSettle` settles
to TPS_TURN_TILT (not the overhead) under the hold.
Retirement details: `getCameraMode()` pinned to 'tactical' AND force-sets
`state.cinematicActionCam = true`; `isFollowCamMode()` → false (this keeps
the state.js pan-detach toast + follow branches dormant); `setCameraMode` is
an inert stub (old body kept as `_setCameraMode_RETIRED`); `cycleCameraMode`
just toasts "CAMERA IS AUTOMATIC" ('C' key / pad button). ui.js boot no
longer reads `ew_cameraMode`; the pause-menu Camera Mode selector row was
replaced with an explanatory note; hud.js hints-bar cam buttons removed.
NOT playtested (RULE #1c). Watch: hotseat second-seat framing (non-viewer
local turns fall back to tactical), _tpsHold leaking TPS pitch into a pan.

## ACTION CAMERA = the Strike Mode TPS rig (2026-07-09, same session)
Token `20260709t` → `20260709u`. battle.js + three-camera.js. The main game's
cinematic action shots now run on the Strike Mode third-person rig.

- **Mechanism**: new `camera._cineTps` flag. `ThreeCamera.sync` takes the TPS
  branch when `_tpsCollide || _cineTps`. The flag AUTO-RELEASES in
  `camera._apply()` whenever `_cineShotId == null` — so all ~12 existing
  restore/reset/interrupt paths work untouched, none of them know the rig
  exists. (`_tpsSubject` is preserved if Strike Mode owns it via _tpsCollide.)
- **Helpers (battle.js, above _playCineActionShot)**: `_tpsBoomZoom(len)`
  (fixed world boom: 4.6 tiles + 0.22/tile of gap, cap 7 — encodes as zoom =
  baseDist/(ts·dist)), `_tpsShoulderLift(unit)` (0.8 × getUnitVisualHeight),
  `_cineTpsAnchor(pos, unit)` (sets _cineTps/_tpsSubject/_tpsHeadLift;
  returns false when 3D inactive → callers keep the LEGACY zoom maths as the
  2D fallback — don't delete those branches).
- **_playCineActionShot / animateDashActionCamera**: anchored on the caster /
  launch spot; slope-following tilt + off-axis yaw kept; vertical-fit zoom
  maths only used in the 2D fallback (the aim-ray handles elevation).
- **_playDescentCam (meteor/nuke/saucer)** beat tilts are now rig-dependent:
  establish 78 / SKY **122** / ground 64 when TPS (60/84/54 legacy). 122° is a
  REAL past-horizon crane — the old rig froze at eye level so 84 was its max.
  Beat 3 re-anchors `_cineTpsAnchor(target, target-if-unit)` so the landing
  frames the victim at its own shoulder height ("caster looks up at the
  meteor, then the target takes the hit").
- Engage order matters: `_cineShotId` must be set before/synchronously with
  `_cineTpsAnchor` (the auto-release keys off it); all three shots do this in
  one JS tick, no _apply can interleave.
- Not playtested (RULE #1c) — syntax-checked only. Watch: mid-shot manual pan
  keeps _cineTps until something clears _cineShotId (pre-existing interrupt
  paths do); smoothing eats the ~120ms eye jump when the rig engages.

## STRIKE MODE round 2 — camera rebuilt + Minecraft hotbar (2026-07-09, later session)
Token `20260709s` → `20260709t`. battle.js (ShooterControls + setTool guard),
three-camera.js (TPS rig), three-renderer.js (walker facing + APIs). Fixes for:
flipped/clamped vertical look, can't look up past eye level, inconsistent
camera height per character, units walking BACKWARDS, space=end-turn.

- **WALKING BACKWARDS root cause**: `_freeRoamTick` rotated `entry.group`
  toward the heading, but the GLB sits inside a wrapper (`_ew_facingSprite`)
  whose rotation.y the per-frame gameplay-facing pass (`_updateUnitFacing`)
  overwrites from `unit.facing` — the two yaws COMPOSED (stale facing ≈ π →
  moonwalk). Fix: the walker now writes `unit.facing = {dx:mx, dy:my}` and
  keeps the outer group at 0. One writer only. (Applies to hub roam too.)
- **Camera rig (three-camera.js `_tpsCollide` branch)**:
  1. Pivot is anchored to the SUBJECT's ground tile (`cam._tpsSubject`, walker
     float pos) + `cam._tpsHeadLift` = 0.8 × the model's real rendered height
     (`ThreeRenderer.getUnitVisualHeight(uid)` = ts·RATIO·heightRatio) — short
     and tall characters now get the identical over-the-shoulder frame. The
     old focal-height machinery added a unit-lift only when a unit stood on
     the ROUNDED focal (the shoulder offset often lands on a neighbour tile)
     → shot height wandered.
  2. Gaze aims ALONG the view direction (`look = pivot + dir·2.5ts`), not
     `lookAt(pivot)` — lookAt capped the gaze at eye level once the eye
     floored on the ground (THE "can't look up" bug). Colinear when
     unobstructed, so nothing changes in the normal case; craning past 90°
     now genuinely shows sky with the character riding the lower frame.
- **Pitch, one convention**: ShooterControls stores `pitch` (deg vs horizon,
  −62…+55, default −14); engine tilt derived once as `90 + pitch`. Mouse
  up = look up (standard); `window.EW_INVERT_LOOK_Y = true` flips.
- **Fixed boom length**: camera distance is a constant 4.2 tiles of world
  (`zoom = baseDist·zoomMult / (ts·4.2)`) instead of getDefaultZoom()-derived
  (which scaled with board size). Zoom = Ctrl+wheel or pad triggers,
  zoomMult 0.6–1.9. Shoulder offset = 0.55 tiles screen-right (fwd push
  removed — the aim-ray framing makes it redundant).
- **SPACE = JUMP** (cosmetic hop; walker `noJump` removed, new
  `hubFreeRoam.setJump(on)` channel since battle roam runs `noKeys`). SPACE
  swallowed in capture so ui.js's end-turn binding can't fire; **ENTER = end
  turn** (same double-press confirm via `_ewRequestEndTurn`).
- **Minecraft hotbar**: slot 0 = ⚔ basic attack, 1..n = abilities. WHEEL
  scrolls the cursor (pad L/R too), selected slot lifts + preview strip above
  the bar (name/AP/MP/range + why-dead reason). A slot is GREYED when
  unaffordable (AP/MP/cooldown) OR nothing is in range **from the tile the
  player is standing on** (`_castableFromHere`: selfCast → ok; tileTargeted →
  getSpellRangeTiles>0; else _getSpellValidTargets>0 — provisional unit.x/y so
  it live-updates as you walk; barKey includes x/y). Selecting a dead slot
  never arms and drops any aim; hotkey on a dead slot beeps + toast. LMB with
  a spell-slot held re-arms it (movement drops aim) and casts in the same
  click if no walk was pending.
- `state.thirdPersonCamera` (a read-only gate in state.js's right-drag pan /
  middle-drag orbit handlers that was never set anywhere) is now set while
  ShooterControls owns the camera — legacy drags stand down.
- setTool's range-framing `focusBoardCameraOnTiles` / `_softResetCameraToUnit`
  now skip when `_shooterCamOwns()` (they fought the per-frame snap).
- ShooterControls `_battleActive()` additionally requires
  `ThreeRenderer.isActive()` — no TPS ownership over the 2D fallback.
- Syntax-checked only (RULE #1c), not playtested.

## STRIKE MODE — third-person shooter controls (2026-07-09, EXPERIMENTAL)

New mode card "Strike Mode" 🎯 (BETA) in the PvP picker. Rules = a straight TDM
clone (`MULTIPLAYER_MODES.shooter`, state.js, `scoringType:'kills'`,
`isShooter:true` is the control-scheme flag; `window._isShooterMode()`).
Intent: prove out modern third-person controls, then graduate them to the whole
game. Nothing about turns/AP/spells changed — only how the player drives them.

Architecture (all inside `ShooterControls`, battle.js, right after the
camera-mode block; `window.ShooterControls`, `window._shooterCamOwns()`):
- **Camera**: per-frame `camera.snap({x,y,tilt,yaw,zoom})` following the
  walker's float position while a LOCAL unit is active (releases during AI
  turns so stock framing shows the enemy acting). OVER-THE-SHOULDER framing:
  the orbit focal is `_shoulderFocal()` — pushed ~0.95 tiles toward
  screen-right + 0.35 ahead (scaled by 1/zoomMult), so the character rides
  lower-LEFT of centre and the reticle (50%, 46%) has a clear line. Mouse look
  via Pointer Lock — click the board to grab, ESC releases; right stick on a
  pad. Tilt clamped 32–106°, wheel/triggers zoom. Every competing camera
  writer either checks `window._shooterCamOwns()` (ui.js WASD focus pans,
  EWPad `_cameraFrame`, `_mdFreeRoamCam`) or is cancelled by the per-frame
  snap. NOTE `_hubActive()` in ShooterControls means the GUILD HUB roam
  specifically (dungeon mode + `_mdPhase==='hub'`) — the battle roam also runs
  through `hubFreeRoam`, so the gate must distinguish them.
- **Movement**: CONTINUOUS free-roam, exactly like the Guild Hub — the
  renderer's `_freeRoam` walker (generalized with opts: `noKeys`, `noJump`,
  `parkAtUnit`, `tileAllowed`, `onTile`) drives the model in float coords with
  real walk/run clips, camera-relative to the live 3D camera. Turn economy is
  preserved by FENCING: `_startRoam` runs ui.js `_initWasdState(u)` (exposed as
  `window._initWasdState` + `window._wasdRingSets`) and passes ring1∪ring2∪
  origin as `tileAllowed`; every tile crossing is a PROVISIONAL move (unit.x/y
  mutated, same contract as the old tile-stepper), and the stock
  `_commitWasdMove` bills 1 or 2 AP for wherever the player stands when they
  cast / attack / end turn / step on a trap (onTile force-commits on enemy
  bombs + warp runes). After each action resolves the walker restarts with
  fresh rings (`_roamFrame`) — that's the seamless move→cast→move loop.
  ShooterControls owns the keyboard (capture-phase WASD/Shift → held set →
  `hubFreeRoam.setPadInput` vector each frame); pad left stick feeds the same
  channel as an analog vector. Movement input while aiming drops the aim
  (throttled `handleBackAction`), and the walk resumes next frame.
  `parkAtUnit` matters: a battle-roam stop must never write `unit.x/y` (the
  commit/rollback machinery owns it) — it only parks the model on the unit's
  logical tile.
- **Aiming**: fixed reticle at (50%, 40%) of the canvas. Per frame it runs
  `ThreeRenderer.hoverAtScreen(aim)` (real hover pipeline → range/AoE previews
  track the reticle; it also sets the renderer's `_lastMouseClientX/Y` so the
  camera-move hover refresh follows the reticle). LMB = `clickAtScreen(aim)`
  (the real click pipeline: unit-sprite z, stacked units, towers). 1-9 arm
  spells (`setTool('spell', name)` — ui.js wrapper auto-commits a provisional
  walk), same digit or RMB/Q cancels, LMB with nothing armed = basic attack
  (arms 'attack' mode; if no walk was pending it fires the same click).
- **HUD**: DIY DOM strip (`#shooterBar`, bottom 17%) listing abilities with
  hotkey/AP/MP, `#shooterReticle` (tints red/green over enemy/ally),
  `#shooterHint` "click to take control". Underfoot cyan decal via new
  `ThreeRenderer.setUnderfootTile(x,y)` (excluded from rebuildHighlights sweep).
- **Gamepad**: `window._shooterPadFrame(...)` — EWPad's `_frame` hands the whole
  pad frame over while the layer owns the camera (gate in state.js). Left stick
  walk, right stick look, A fire, B cancel, X(bound endTurn) end turn, L/R
  cycle spells, triggers zoom, start pause, respects EWPad bindings/opts.
- **Renderer API added** (three-renderer.js): `pickAtScreen`, `hoverAtScreen`,
  `clickAtScreen` (extracted `_screenClick`), `setUnderfootTile`, `getCanvas`,
  `hubFreeRoam.setPadInput(ix,iy,run)` + `hubFreeRoam.pos()`.

**Guild-Hub camera-follow FIX**: `_mdFreeRoamCam` (battle.js) previously wrote
`camera.x/y` bare, which left `_computedElevZ` (only refreshed inside
`camera._apply()`) and the smoothing rig frozen at hub entry → the eye never
followed the walker. It now calls `camera.snap({x,y})` per tick (and defers
entirely to ShooterControls when that owns the camera — the hub free-roam now
has the same pointer-lock mouse-look TPS camera; hub movement was already
camera-relative so mouse-look steers naturally). Pads walk the hub through
`hubFreeRoam.setPadInput`.

Playtest watch-list for this mode: pointer-lock grab/release timing, reticle
pick landing short (tilt too low → ray hits near the unit; crank tilt up to aim
far), hotbar overlapping the Horologe drum, first-click-swallow when grabbing
lock, WASD cadence vs `_wasdAnimating` (steps dropped while a hop tween runs),
`_userPanning` leaks freezing the focal height.

## MYSTERY DUNGEON round 3 fixes (2026-07-08, same session) — feedback pass

- **Own roster, start ALONE:** MD progression is separate from account unlocks —
  `ew-md-save-v1.unlockedRaces`, starts `['homosapien']` (`MD_STARTER_RACES`,
  state.js). Char select lists only that roster; hub NPCs come only from it
  (fresh save = empty plaza). Each dungeon CLEAR recruits one random 3D-ready
  race (`_mdEndRun`, shown on the result overlay + log).
- **Stairs = the engine's existing 3D staircase**, not custom geometry: the
  floor exit tile is `barrier_passage` with an explicit `sd` (stairDir) on its
  top voxel (stamped post-`M.finish()` in `generateMdFloor`; ascends toward a
  wall neighbour). `_isStairTile`/`_buildStairMesh` render it like any map;
  objects are auto-skipped on barrier_passage tiles. My custom
  `_buildDescentStairs3D` prop is REMOVED.
- **Cave = existing 'geode' monument** (open rock shell + glowing crystals, no
  `_MON_COLLISION` profile → walkable) at the hub gate; gate tiles are plain
  `cave_floor`. GOTCHA discovered: the `cave_entrance` TERRAIN carries sprite
  art via TERRAIN_SPRITES (that was "the cave sprites"), and the object key is
  in `_CROSS_BILLBOARD_KEYS` — avoid both for 3D-looking props. My custom
  `_buildCaveEntrance3D` rock-blob prop is REMOVED (looked bad).
- **No surprise accessories:** the delver's auto-kit strips accessory1/2
  (class default equipment applies); spells/items still auto-filled.

## MYSTERY DUNGEON MODE + BIG-MAP PERF PASS (2026-07-08) — data.js, state.js, map.js, battle.js, three-renderer.js, three-camera.js, index.html, styles-base.css

New PvE mode: PMD-style dungeon crawl. Entry = **main-menu "Mystery Dungeon" button**
(`window._goToMysteryDungeon`, map.js) → party builder → **Guild Hub** (8×8, id
`md_hub`) where the player's UNLOCKED roster loiters as NPCs → step on the east-edge
cave entrance → 10 procedurally generated maze floors (id `md_floor`) → stairs on
floor 10 = clear. Gold banked via `ProfileSystem.creditLocalGold`.

- **Data layer (data.js, after `_mfRegisterAll`):** `MD_DUNGEONS` registry (one
  dungeon: `agartha_depths`, themed on prebuilt_agartha), `_mdBuildHub()` (registers
  `PREBUILT_MAPS.md_hub` + layout preset; hub entry carries `_mdEntrance` +
  `_mdNpcSpots`), `generateMdFloor(dungeonId, floor, seed, partySize)` (rooms +
  L-corridors + loop + dead-end stubs; walls = height-6 `cave_wall` columns on a
  height-3 floor → blocks ground move (MAX_CLIMB 1) AND LOS, zero engine special-
  casing; emits a full PREBUILT_MAPS-shaped entry + `_mdStairs` + `_mdEnemySpec`),
  `_mdRegisterFloor(entry)` (rewrites `PREBUILT_MAPS/MAP_LAYOUT_PRESETS/GAME_MODES
  ['md_floor']` per floor). Floors are non-square (12×9 → 20×15), floor 10 = boss
  arena. Generator validated headless: rooms/spawns/stairs all BFS-reachable across
  50 seed/floor combos (scratchpad test_mdgen.js pattern).
- **Ruleset:** `MULTIPLAYER_MODES.dungeon` (state.js) — `respawns:false`,
  `roundLimit:0`, `isDungeon:true`, `winConditions:['md_run']` (a sentinel: NO stock
  checkWin branch fires). `compatibleMaps` = [] (never in the PvP picker). `md_hub`
  GAME_MODES entry is hand-registered in state.js (kept OUT of EW_MAP_META so no Δ
  variants/picker cards get generated).
- **Runtime (battle.js, "MYSTERY DUNGEON — RUNTIME" block after
  startCampaignBattle):** state model `state._mdPhase` ('hub'|'floor'),
  `state._mdRun` {dungeonId, floor, seed, partyState}, guards `_mdEnded`/
  `_mdTransitioning`. Hooks: (1) startMatch calls `_mdOnBattlePrepared()` after
  `prepareBattleStateFromCurrentBuilds()` — hub: strips P2 units + spawns roster
  NPCs (`_mdNpc:true`, ap 0, player 1 so they're untargetable; filtered out of
  `buildBlitzTurnOrder` in state.js); floor: re-applies carried HP/MP, crowns the
  `2-0` unit as boss (+60% HP, `_isBoss`) on floor 10. (2) `_mdCheckStairs(unit)`
  in `completeMoveAlongPath` next to `checkFlagPickup` — entrance tile starts the
  run, stairs tile → `_mdAdvanceFloor()` (survivors' build/loadout/meta/HP/MP →
  `run.partyState`, party arrays compacted, board regenerated via
  `applyGameMode('md_floor')` + `startMatch()`, campaign-style, no reload).
  (3) `checkWin`/`checkWinConditionOnly` short-circuit for dungeon → `_mdCheckWin`
  (P1 wipe = `_mdEndRun(false)`; enemy wipe ends NOTHING — floors stay explorable).
  (4) stalemate no-contest voider + shot clock disabled for dungeon. Enemies are
  generated per floor like campaign (partyMeta `_campaignEnemyLevel`; the createUnit
  campaign-level gate in map.js now also accepts `state._mdRun`). Run end →
  `_mdShowResultOverlay` (vic* DOM) → `_mdReturnToHub()` (restores the pre-run
  party snapshot `state._mdHomeParty`, reloads hub). VS splash is skipped for all
  dungeon boards. Persistent progress: `ew-md-save-v1` (bestFloor/clears/runs) via
  `loadMdSave/saveMdSave` (state.js).
- **NOT done yet (v2 candidates):** fog-of-war exploration (works but disables the
  terrain/grass merge — see below), items/chests on floors, multiple dungeons
  (registry supports it), hub interactions (talk to NPCs), mid-run save/resume
  across reloads, XP/leveling for the player party during a run.

**Big-map perf pass (why >8×8 tanked weak GPUs; Minecraft comparison):** Minecraft
merges chunks into few big meshes; we drew almost everything per-tile ×3 (main +
shadow depth + raycast). Fixed in three-renderer.js/three-camera.js:
1. **Grass tufts now bake into ONE merged mesh** per board (was: 1 mesh/draw call
   per tuft, ~59% of grass tiles) — world-space verts, shared material. Under
   fog-of-war it falls back to per-tile tufts (fog reveals decos per tile), same
   policy as the terrain batcher.
2. **All terrain decorations (grass/rocks/crystals) no longer cast/receive shadows
   and are excluded from raycasting** (`raycast = noop`, `_ew_shadowFlagged` set
   preemptively) — they were tripling the per-tile cost via the sun depth pass and
   every hover/pan pick.
3. **Grass density scales down past 12×12** (`coverage × 144/area`, floor 0.28) so
   total blade count stays ~constant on huge boards.
4. **`_updateLavaEmissive` no longer walks every tile mesh every frame** — lava
   list cached per terrain rebuild (`_lavaMeshCache`, nulled in rebuildTerrain).
5. **`_computeObjectSerial` (full-board hash, polled every frame) is TTL-cached
   200ms** — object rebuilds can lag placement by ≤200ms, imperceptible.
6. **Rock cluster materials quantized+cached** (`_rockMatCache`, was a fresh
   material per rock) and **one shared Raycaster** in three-camera.js picking.
   Remaining known big-map costs (untouched): terrain merge still off under
   fog-of-war/editor; ~7-pass post stack has no low-spec off switch.

## FIRE/WATER/LIGHTNING VFX PASS (2026-07-08) — three-vfx-effects.js, three-renderer.js, battle.js

- **Burning tiles are ray-marched volumetric fire.** `_syncTileFlames()` in
  three-vfx-effects.js reconciles `state.burningTiles` every frame into per-tile
  meshes: a unit BoxGeometry (BackSide, base lifted +2px off the tile to avoid
  z-fighting) whose fragment shader marches 18 jittered steps through a 3D flame
  density field — 4 offset noise-eroded tapering columns, 3-octave 3D value-noise
  fbm advected downward + a fine detail octave — accumulating emission through a
  black→red→orange→white heat ramp. `uCamLocal` (camera in unit-box space) is
  updated in `onBeforeRender` via `worldToLocal`. `uVig` dims/squashes dying fires
  (t rounds left) and drives a grow-in on ignite. Crossed-plane v1 (looked flat/
  cartoonish) and the older gradient sprites are gone; `_tickBurningTiles` only
  spawns embers/smoke/ground glow now. Scene comes from `ThreeVFX._getScene()`;
  meshes rebuilt if the scene ref changes; disposed in `clear()`. The flame shape/
  colors were tuned with an offline Node raymarcher (scratchpad fire_raymarch.js
  pattern) — port changes back there if retuning.
- **Fire spells spawn volumetric flame bursts.** `_spawnEffect` checks each
  effect def once (`_flameVolumeInfo`, cached on the def) for floor-anchored
  `flame`/`flame-hot` sprite layers; if found it spawns `spawnFlameBurst3D(tx,ty,
  {lifeMs,hScale,rScale})` — the same ray-marched volume as burning tiles with a
  grow-in/rage/fade envelope — and SKIPS those flat sprite layers (torso-anchored
  flame layers on burning units keep their sprites). Life/size derive from the
  skipped layers' ml/h1. Re-triggering a tile mid-burst (wall-of-fire re-ignition)
  extends the burn instead of stacking meshes; concurrent bursts capped at 24.
  Covers impacts, per-tile AoE bursts and walls — they all funnel through
  `_spawnEffect`. Exported as `ThreeVFXEffects.spawnFlameBurst3D` for bespoke use.
- **Water tops use the iterative turbulence caustic.** In `_buildFluidTopMat`
  (three-renderer.js) the old sin-interference caustics + fat glints (the "blobs on
  the water") were replaced by the classic 4-iteration sin/cos filament caustic in
  world space (`mod(ewP*PI, TAU) - 250` — the -250 offset is load-bearing, keeps the
  1/length terms bounded). Glint threshold tightened to pixel-fine sparkles.
- **Electrified water/metal draws real lightning, no ⚡ emoji.**
  `_conductionArcVfx(ox, oy, tiles, victimTiles)` in battle.js BFS-walks the
  connected pool/sheet from the strike tile and draws `ThreeLightning.boltVfx`
  surface arcs hop-by-hop (55ms per BFS ring, capped at ~48 arcs); victim tiles get
  an upward bolt through the unit + spark-elec burst. `_reactLightningWater` /
  `_reactLightningMetal` collect victims first, then call it; the ⚡ floating text
  only shows when 3D is inactive (2D fallback). The elemental tile-cast (⚡ at a
  lake) uses `ThreeLightning.strikeFromSky` instead of the emoji, same fallback.

## 3D GEOMETRY/TEXTURE PASS (2026-07-08) — three-renderer.js, three-vfx-effects.js, sprites.js, data.js, battle.js
Token `20260708h` → `20260708j`. Syntax-checked only (RULE #1c), not playtested.
1. **Textures.** R2 terrain folder holds exactly THREE marbles: `marble.png`,
   `marble_2.png`, `marble_light.png` (the last was unregistered — now a
   texture-only `TERRAIN_SPRITES.marble_light` entry, NOT a placeable terrain).
   Prop builders that wore muddy `marble` (throne, seraph, basilica, candy cane,
   mannequin) now wear `marble_light`; Zeus-bolt slab wears `marble_2`. Probed
   the CDN for other variants (marble_3+, bone, skull, granite, stone…): 404.
2. **Traffic light** (`_buildTrafficLight3D`): the yellow signal-head assembly
   (housing+lamps+visors+glows) now lives in a `headG` pivot rotated 90° at the
   mast-arm end so lamps face traffic passing UNDER the arm, not down the arm.
3. **Moon flag** (`_hzFlag`): canvas-painted stars-and-stripes
   (`_hzGetFlagTexture`, cached) on a 16-segment plane with a frozen sine
   ripple + top crossbar rod — replaces the 7 flat-color stripe boxes.
4. **Saucer unification** (`_hzSaucer`): Area-51/sky saucer rebuilt on the SAME
   7-point LatheGeometry hull profile + metal.png cladding as the hero spell
   UFO (`_sigBuildUFO`, three-vfx-effects.js) — glow dome, torus rim, 10 rim
   lights; struts + tractor beam kept.
5. **Deployables now have real 3D props** — `_DEPLOY_3D_BUILDERS` map (next to
   the old Tesla special-case in `rebuildDeployables`): Bone Wall (femur
   palisade + skull), Pillar of Atlantis (fluted marble_light column, glowing
   orichalcum band), Totem Drop (3 carved faces + thunderbird wings), Federation
   Beacon (aluminium pylon + floating crystal), Lucid Trap (dreamcatcher),
   Flashbang Mine (brass disc mine). Builders share `_deployMat`/`_deployGlowMat`
   /`_deployFinish` helpers (Tesla-coil style: `_getTeslaTex` + MeshBasic).
6. **Gate pairs finally render.** `state._gatePairs` (Grave Passage / Tunnel
   Network) had NO visual at all. Both endpoints now draw a prop in
   rebuildDeployables (`_buildGraveGate3D` sandstone tomb door w/ purple void,
   `_buildTunnelMound3D` dirt mound w/ shaft hole), and gate pairs are hashed
   into `_computeDeployableSerial` (tag 9, incl. usesLeft).
7. **New monuments** registered in `_monBuilders` + horizon theme rosters:
   `woodcross` (_hzWoodCross → ruins/dark), `skull` (_hzGrinSkull, laughing-or-
   screaming half-buried skull → infernal/dark), `fleshmound` (_hzFleshMound,
   eyes+fangs meat heap → infernal), `tome` (_hzTome, floating open
   bible/grimoire → divine). Usable as on-board `state.monuments` kinds too.
8a. **R2 terrain folder is BIGGER than the code registry** (user screenshots,
   2026-07-08). Now ALL registered in `TERRAIN_SPRITES` (texture-only keys):
   leather(_2), enamel_2, mars(_2), fur(_2,_3), tigerfur(_2), skin, rubber(_2),
   damask(1-4), floral(_2), diamond, brokenglass, gunmetal(_2), copper,
   concrete_floor, checkerboard_2/3, drywall_5, dirt_slope,
   grass/rocks_dark_fantasy, ice_1, igloo, latticegarden, noise, tilefloor(_2).
   Applied: **enamel = bone** everywhere (bone arch, dragon skull, whalebones,
   cattle skull, grin skull, Bone Wall deployable, spectral skull VFX);
   leather = tome/book covers; mars = Cydonia face; rubber = weather balloon;
   skin = Backrooms mannequin + flesh-mound lobes. `tilefloor`/`tilefloor_2`
   are REAL terrains (data.js TERRAIN_RULES + stone salvage family in
   battle.js getTerrainMaterial): D.U.M.B. floor/spawns/deltaPad → tilefloor,
   CERN → tilefloor_2. Still unused, ready to theme: diamond, fur/tigerfur,
   floral, latticegarden, dark_fantasy variants, noise, dirt_slope.
8b. **Damask / igloo / stained glass** (token → `20260708k`): _hzThrone got a
   damask seat cushion + back panel + dais runner. `_hzIgloo` (igloo.png dome,
   vaulted entrance tunnel, hearth-lit doorway) — monument kind `igloo`, 3
   placed on the North Pole map (data.js monSym/mon). `_hzRoseWindow` (ruined
   cathedral wall, stone tracery ring, 6 brokenglass jewel petals + glowing
   heart) — kind `rosewindow`, added to divine + ruins sky rosters.
   `_hzBasilicaDome` drum now has 5 stained-glass windows (brokenglass tinted
   jewel colors + inner pulse glow) between its columns.
8. **New signature spell VFX** (three-vfx-effects.js, `_spell3DGeometry`):
   `_sigSacredRings3D` armillary = the seraphim's signature (raceAbsolution,
   raceRapture, and around the raceDivineJudgment blade drop — the "football"
   treatment); `_sigSkull3D` (laugh: chattering jaw / else looming scream —
   raceSoulDrain, raceCurseOfDecay, raceDeathPact, raceHexOfAgony);
   `_sigFleshMound3D` (racePlaguefield, raceDarkResurrection, raceShamblingHorde);
   `_sigCrystalBall3D` (raceCrystalBall, raceProphecyOfDisaster); `_sigTome3D`
   (raceDivineLight, exorcism holy variant); `_sigWoodCross3D` (exorcism,
   raceSmite). ⚠ Geometry only fires for intents that reach the registry:
   impact/aoe/aura/wall/descent — NOT bolt. Glow planes tip toward the diorama
   camera with `rotation.x = -0.6` (there is no ThreeRenderer.camera export).

## TERRAFORMING OVERHAUL (2026-07-07) — battle.js, data.js, ui.js, hud.js, ai.js, state.js, sprites.js, three-renderer.js
Token `20260708d` → `20260708e`. Design doc: `TERRAIN_SPELLS_PLAN.md` (repo
root). Six systems, all building on existing plumbing. NOT playtested this
session (per RULE #1c) — syntax-checked only; first live run should sanity-check
the ghost preview + a placeBlock/structure cast + a trap trigger.

1. **Terrain-spell ghost preview.** `ThreeRenderer.showTerrainGhost(changes)` /
   `clearTerrainGhost()` (three-renderer, after flashTelegraph): per-level
   translucent voxel boxes + solid edge lines (raise = cyan stack, lower = red
   carve volume, paint = flat family-colored decal), gentle fill-only pulse via
   `_updateTerrainGhostPulse` in renderFrame. Footprints come from
   `predictTerrainSpellChanges(unit, spell, tx, ty)` (battle.js, right after
   applyTerrainDeform; exported on GAME) — a PURE mirror of the
   terrainCreate/placeBlock/buildStructure handlers. ⚠ KEEP IN SYNC when
   editing those handlers. ui.js `updateAoePreview` drives it: terrain kinds
   skip the loud red AoE tiles (red only if spell.dmg) and get the ghost +
   quiet family-colored wash; `leaveTerrain` damage spells (Dragonfire lava
   etc.) keep red but add paint decals. Cleared in `clearAoePreview`
   (`_terrainGhost3dActive` flag) — every preview clear site funnels there.
2. **Calmer highlights (readability pass).** `_hlFragmentShader`: fill
   0.55→0.34, wash-toward-white cap 0.75→0.45, pulse 0.88±0.12→0.94±0.06.
   `_updatePreviewOverlayPulse`: 0.4..1.0 @5Hz → 0.7..1.0 @2.6Hz. Colors now
   stay saturated (color IS the semantics).
3. **Salvage economy.** `state.matBank = {player: {wood,stone,metal}}` (lazy
   `_matFor`, seeded `MAT_START_STOCK` {2,2,1}; reset via `state.matBank=null`
   at the 4 match-init sites alongside state.lumber). Gains: chop tree +1 wood
   (in `_fellTreeAt` credit branch, on top of Harvester lumber), smash column
   +1 of `getTerrainMaterial(terrain)` (wood/stone/metal families over EXISTING
   terrain keys — nothing for plain earth), destroyBuilding +2 stone +1 metal,
   turret kill +2 metal. Spending: `spell.materialCost = {stone:1}` gated in
   `canAffordSpell` (HUD/AI/doSpell inherit), spent via `spendMaterials` inside
   the placeBlock/buildStructure handlers. HUD spell rows show "Need 1 🪨"
   (hud.js reason chain); doSpell logs a salvage hint. GAME: getMaterials /
   gainMaterial / spendMaterials / canAffordMaterials / materialCostLabel /
   getTerrainMaterial.
4. **New element reactions** (extend triggerTerrainSpellReaction):
   ⚡+metal-family terrain (`metal*`, `aluminium` — incl. placed Steel Blocks) =
   `_reactLightningMetal` conducts across the connected sheet (50% tick, units
   standing on it); 🔥/⚡+crystal = `_reactCrystalShatter` (vein cap 12 →
   rubble_2 + 55 dmg to units on it; kills the MP-regen perk).
5. **placeBlock kind** (Minecraft building): stacks ONE voxel (+1 h, cap
   maxHeight 12) of spell.terrainType on the target column, lifting any
   grounded occupant (raise-a-sniper-pillar is intended); on water it REPLACES
   the surface = stepping stone. Guards: wall/objective/solid-object/building.
   Spells: `timberBlock` (Harvester+Engineer, 1 wood, wood_planks),
   `stoneBlock` (Engineer, 1 stone, cobblestone), `steelBlock` (Engineer,
   1 metal, metal → conducts).
6. **Crash-through.** `_tryCrashThrough(unit, nx, ny, {byUnit})`: pushed units
   now BREAK weak barriers instead of stopping — trees felled (pusher's team
   banks the wood), 1-high lips of wood-family/ice/crystal shattered
   (CRASH_THROUGH_DMG 12, push continues). Weight-gated: feather can't break
   anything, heavy/colossal also punch through stone-family. Wired into the
   cross-push (_applyAoeDamage), linePush, and displacement fling loops.
7. **Water settles.** `settleWaterAround(tiles)`: when ground is LOWERED beside
   standing water, water floods connected floor strictly below the pool's
   surface level (BFS, cap 16, deep_water at 2+ below; hazards bite via
   _applyKnockbackHazard). Called from applyTerrainDeform (lowered tiles →
   meteor craters flood), smashTerrainAt, doReshape lower, crash-through, and
   the tremor trap. Chasm/void/lava/walls/objectives never flood.
8. **buildStructure kind + STRUCTURE_TEMPLATES** (data.js, before the SHARED
   spells): local frame +x = away from caster, rotated by caster→target
   cardinal; `_structurePlanFor` (battle.js) computes the world plan (shared
   with the ghost preview). `bridgeSpan` = up-to-4-tile wood deck at caster's
   standing z over water/chasm until the far shore (floating block, gap stays
   open under it); `watchtower` = +2 tower (top `mountain_top` → +1 range) with
   +1 step on the caster side; `stairway` = +1/+2 rising away; `fortRing` =
   ring-8 of +2 castle_wall (unit-occupied tiles left open). Spells:
   `fieldBridge`/`watchtower`/`bulwarkRing` (Engineer), `timberSteps`
   (Harvester+Engineer), `SHARED_BULWARK_RING` race ability on giant/golem/
   minotaur.
9. **Trap arsenal — placeTrap kind + state.traps** (records {x,y,owner,
   casterUnitId,trapType,dmg,spellId,spellName}; reset with bombs). Placement
   mirrors bombs but needs an EMPTY passable un-rigged tile. Trigger:
   `checkTrapTrigger(unit)` — enemy-only, airborne immune — called at both move
   executors, the AI move path, `getPathPickupEvent` (walking THROUGH stops on
   it), and inside `_applyKnockbackHazard` (pushed/pulled INTO a trap springs
   it — magnet-into-snare chains work). Effects in `_springTrap`: `spike`
   (snareTrap, Agent/Harvester) dmg+root 2; `frost` (frostMine, Black Mage)
   dmg+stun+3×3 ice glaze (water/grass*/dirt*); `tremor` (tremorCharge,
   Engineer) dmg + ground −2 + fall dmg + water settle; `magnet` (magnetMine,
   Agent/Engineer) dmg + drags all units in r2 one step in (colossal immune) +
   lightning terrain reaction at the mine. Rendering: owner-only SVG sigils
   (`TRAP_TILE_SPRITES` in sprites.js, warp-rune pattern) in rebuildDeployables
   + hashed into `_computeDeployableSerial` (tag 8).
10. **RACE_PHYSIQUE** (data.js after RACE_BASE_STATS): official height/weight
   for all 95 races (honda civic 1300 kg, kaiju 20 t, fairy 1.5 kg…). Classes
   (battle.js getUnitWeightClass): feather &lt;30 ≤ light &lt;80 ≤ medium &lt;250 ≤
   heavy &lt;1000 ≤ colossal. Effects: `getUnitPushDistance` (feather +1, heavy
   −1 min 1, colossal 0 — used by cross-push/linePush/displacement AND the
   shove preview `_predictSpellApproachShove`); pull + blowback colossal
   immunity ("⚖️ IMMOVABLE"); fall damage ×0.5/0.75/1/1.25/1.5
   (state.js applyFallDamage — flyers still exempt); crash-through gating.
   Codex dossier §2 shows HEIGHT/WEIGHT/CLASS + what the class means.
11. **AI**: scoreSpell + tile pickers for placeTrap (empty tile nearest most
   enemies), placeBlock (pillar under an allied Sniper/Gunslinger/Black Mage),
   buildStructure (fortRing → box best enemy in range; bridge → nearest
   water/chasm tile; tower/steps → free tile toward enemy). All three in
   nonRepeatableKinds. Kinds also added to hud.js tileTargetKinds and
   hasSpellTargetInRange's always-castable list.

### TERRAFORMING POLISH PASS (2026-07-07, second pass) — targeting/UX fixes
Token `20260708f` → `20260708g`. Fixes from the user's first live session.

1. **ROOT CAUSE of "Tremor Charge wants an enemy" / "Steel Block needs an enemy
   target" / "can only build under enemies":** the three new kinds were MISSING
   from `SPELL_KIND_META` (battle.js), so `_kindMeta` fell back to
   `{minRange:1, offensive:true}` — setTool routed them into the enemy-unit
   picker (`spellTargets` view) and tile clicks died in clickTile's Gate A.
   Fixed: `placeBlock`/`buildStructure`/`placeTrap` registered as
   `{minRange:0, offensive:false, tileTargeted:true, noStrikeLeap:true}` → they
   now free-aim like terrainCreate. ⚠ EVERY new spell kind MUST get a
   SPELL_KIND_META entry or it becomes an "attack" by default. Follow-ups in the
   same pass: per-kind prompt lines (`_spellTargetPromptText`), ui.js minRange-0
   highlight list + neutral `spell-range` paint (not enemy-red), hud.js
   `spellKindLabel` parts + `spellTargetMode` 'Tile Target', data.js
   SIM_DEFAULTS rows, placeTrap added to hud.js `nonEnemyTargetKinds` (enemy
   quick menu never offers it — traps need an empty tile).
2. **placeBlock redesign — no more free high ground for enemies.** Placing on
   an enemy-occupied column now ERUPTS: ~45 (+spellPower/2) physical crash
   damage + a 1-tile shove away from the caster (priority: straight away, then
   laterals; `animateDisplacement` + `_applyKnockbackHazard` + trap trigger, so
   block-shove-into-snare/pit/water chains work). Colossal or nowhere-to-shove
   → cast invalid BEFORE materials spend. Allies (and self — self-elevator at
   minRange 0) still ride the block up. AI scores/picks the shove play (hazard
   or own-trap landing = big bonus) via exported `g._placeBlockProblem`.
3. **Placement validity helpers** `_placeBlockProblem(unit,spell,x,y,out)` /
   `_placeTrapProblem(x,y)` (battle.js, above predictTerrainSpellChanges;
   exported on GAME with `_structurePlanFor`): single source of truth for the
   doSpell handlers, `hasSpellTargetInRange` (REAL scans now — a placement
   spell greys "No target" when no tile in range accepts it), the tile
   quick-menu per-tile reasons ("Needs an empty tile", "Max height", "No room
   to shove them"…), the ghost preview (invalid tile = NO ghost) and the AI.
4. **Grey-don't-fail:** hud.js tile quick menu + enemy quick menu + movement
   spell rows now run `canAffordSpell` (adds COOLDOWN + MATERIALS to the AP/MP/
   silence gate) with full reason chain (⏳ CD n / Need 1 🪨 / placement
   reason). placeBlock/buildStructure rows on an enemy are dropped when the
   plan/eruption is impossible there.
5. **"Terrain blocks the spell path" after move-then-cast:** hud.js
   `findMoveIntoRange` LOS probes now pass the LANDING tile z
   (`isRangeBlockedByTerrain(t.x,t.y,tx,ty,t.z)`) — omitting sourceZ made
   map.js infer z from the still-empty column, which could disagree with the
   post-move unit z and approve blocked approaches.
6. **Stale previews during cast animations:** new global
   `clearAllTargetingVisuals()` (battle.js, after clearAttackRangePreview) —
   sweeps aoe overlay + terrain ghost + intent/approach/plan arrows +
   spellRange/attackRange/actionPlan*/spellApproach*/moveHover overlays +
   `_ewHlCache`, and arms `state._suppressHoverPreviewUntil` (~1.4s). Called
   from doSpell (post-validation, pre-`pushUndoSnapshot`), doAttack (after fog
   gate) and hud `_fireEnemyAction`. three-renderer
   `_refreshHoverOnCameraMove` now no-ops while `_actionExecuting` /
   `_walkAnimActive` / suppress window — camera glides can no longer re-paint
   the preview mid-animation (that was the "arrows stay during the animation"
   bug).
7. **Target-mode chips:** hud.js `spellTargetChip(sp)` → ⟳ SELF / ♥ ALLY /
   ⬚ TILE / ◎ ENEMY chip on every ability blade (uses the global
   isSpellSelfCast/isSpellTileTargeted). placeTrap ghost: amber decal on a
   valid empty tile via predictTerrainSpellChanges (+ ui.js `_terrainKinds`);
   placeBlock ghost shows the shove landing tile in orange.

## Gamepad support + camera modes + controls editor (2026-07-07) — state.js, battle.js, hud.js, ui.js, map.js
Token bumped `20260708b` → `20260708c`. Probe-verified in-browser (scratchpad
probe_gamepad.js — fake standard-mapping pad injected over navigator.getGamepads;
**36/36 ×3 runs**: connect/vendor/glyphs/rebind-swap-reset, mode cycling +
persistence, drum hook, stick orbit + _userPanning latch, ZR zoom, stick-walk +
A-commit, X-X end turn (turn handed to P2), + pause / dpad focus / B close,
hints bar, zero page errors). Probe gotcha: hold pad buttons ≥400ms — under
SwiftShader jank the poll loop can run at a few fps and a 150ms release falls
between frames (no edge). Sandbox browser stops crashing on the match-start
transition once `window.EW_DISABLE_3D_UNITS = true` is set in addInitScript.
- **Input layer (state.js, appended at EOF)**: `window.EWInput` tracks the LAST
  device touched (`'kbm' | 'pad'`; trusted-event listeners only — the pad layer
  itself dispatches SYNTHETIC key events, filtered via `e.isTrusted`). Fires
  `ew-input-device` + stamps `body[data-input-device]`. `window.EWPad` = the
  whole controller stack: rAF poll loop (idles at 500ms checks until a pad ever
  connects), per-vendor default bindings (Nintendo confirm=A(idx1)/cancel=B(idx0);
  generic/Xbox/PS confirm=idx0), 15 rebindable actions persisted in
  `ew_padBindings` (rebind = capture-next-button; duplicate bindings swap),
  stick opts in `ew_padOpts` (invertY/invertX/sensitivity/deadzone/vibration),
  radial deadzone + ^1.5 expo curve, `rumble()` (dual-rumble → hapticActuators
  fallback), `glyphForAction/ForButton` (vendor-correct labels: Switch B/A/Y/X,
  PS shapes, Xbox letters), `debugContext()` for harness assertions.
- **Pad → gameplay routing reuses existing paths, never duplicates them**:
  contexts are `menu` (Horologe drum owns stick+dpad → `window._hrlgPad` hook),
  `aim` (move/jump/spell targeting → SYNTHETIC W/A/S/D + ENTER keydowns feed
  the ui.js WASD-walk + kb-cursor pipeline; A with a `pendingTarget` and no
  cursor = clickTile two-click confirm), `free` (not our turn: left stick pans),
  `dialog` (A/B = handleUiDialogPrimary/Secondary), `title`, `domnav` (pause
  menu/settings/menus: focus-order navigation over visible buttons, A clicks,
  left/right adjusts range/select), `rebind`. Global battle buttons: + pause,
  − overview, Y camera mode, X end turn, R3 recenter, ZL/ZR analog zoom
  (writes state.userZoomScale like the wheel), L/R cycle spell targets
  (cycleSpellTarget) else drum rows. Right stick orbits via the SAME
  `camera.snap({_force,tilt,yaw})` contract as middle-drag (sets
  `state._userPanning` while held + consumes `_deferredTurnPanUnitId` on
  release, mirroring mouseup).
- **END TURN is two-press** (`window._ewRequestEndTurn`, shared by pad X and
  the NEW SPACE key): first press arms a 1.6s window + toast "PRESS AGAIN TO
  END TURN". Also NEW: `C` cycles camera mode. Both live in the ui.js battle
  keydown (same guards as WASD). `window._ewToast(msg, ms)` = the little
  DotGothic announcement chip (also used for camera-mode switches + pad
  connect/disconnect).
- **Camera modes (battle.js)**: `state.cameraMode` ∈ tactical | follow |
  cinematic (persisted `ew_cameraMode`; legacy `ew_cinematicActionCam` '1'
  migrates → cinematic in the ui.js load block; `state.cinematicActionCam` is
  now DERIVED from the mode). `setCameraMode/cycleCameraMode/getCameraMode/
  isFollowCamMode` + `getFollowCamTilt/Zoom/Yaw` on window. Follow = the
  camera opens every turn parked BEHIND the active unit's facing
  (`getTurnStartCamYaw` now triggers for follow too) at `FOLLOW_CAM_TILT` 68°
  and `getDefaultZoom()×2.0`; the remembered rest pitch may ride to
  `FOLLOW_REST_TILT_MAX` 85 (snap()'s clamp is mode-aware; tactical stays
  REST_TILT_MAX 62). Cinematic = follow (72°, ×2.2) + auto action shots.
  A free PAN (mouse right-drag or pad left-stick) in follow/cinematic
  DETACHES to tactical silently + toast — orbit/zoom do NOT detach. The
  setActionMode move/jump "force tactical pitch" clamp is skipped in follow.
  Mode switch re-frames the active unit immediately (non-silent).
- **HUD (hud.js)**: `useInputDevice()` hook + `_hintKey(action, kbLabel)`
  helper swap every hint by device: crown label/title (◀ BACK B / ■ END TURN
  X chip), CANCEL/END TURN blade hints. NEW `ControlHints` bar (`.ew-hints-bar`,
  under the scoreboard, hidden <1150px) lists exactly the live inputs per
  context + device with `.ew-padbtn` (round Switch-style caps) / `.ew-keycap`
  chips; its camera chip is CLICKABLE (cycles mode). `window._hrlgPad`
  hook exposed from HorologeMenu ({view, blades, cycle, fire, crown}) — fire
  is nulled while aiming (same rule as ENTER). CSS in the injected
  `_injectHudHideStyles` block, incl. a gold focus ring for pad DOM-nav
  (`body[data-input-device="pad"] .pause-card :focus`).
- **Controls editor (ui.js `window._buildControlsSettingsHTML`)**: shared by
  the pause-menu Controls tab (still has Game Speed) AND main-menu Settings
  (map.js injects it between Display and Developer). Camera-mode 3-button
  selector, gamepad status line (id + non-standard-mapping warning), full
  rebind grid (click a `.pm-bind-btn` → `window._ewPadRebind` → press a
  button; ESC cancels; 8s timeout), Invert-Y / Rumble / Reset Bindings,
  sensitivity slider, and an ACCURATE kb/mouse reference (the old grid
  advertised SPACE/right-click binds that didn't exist; SPACE is real now).
  `window._ewControlsRerender` refreshes whichever host is open (pad
  connect/disconnect/rebind call it).
- **kb-cursor upgrade (ui.js)**: the arrow-key board cursor now calls
  `updateHoveredTarget(nx, ny)` per step, so move-path/AoE previews track it
  (keyboard AND pad aiming).
- GOTCHA: `handleBackAction()` at the ROOT menu deselects the unit (existing
  ESC behavior) — after which bare `setActionMode`/`triggerEndTurn`/WASD all
  no-op on `getSelectedUnit()`. Probes must `selectUnit(_blitzActiveUnitId)`
  before driving verbs directly. Pad B at root goes through `hook.crown()`
  (= END TURN ritual), NOT handleBackAction, so pad players don't hit this.
- HARNESS: fake pad = override `navigator.getGamepads` in addInitScript +
  dispatch a hand-built `gamepadconnected` Event with `.gamepad` attached;
  `EWPad.debugContext()` tells you which router context the pad layer sees.
  Sandbox chromium crash-flaky ("Target page/browser closed") on the
  match-start transition — retry, and `--disable-dev-shm-usage` helps.

## Character balance pass + flyer grounding + Balance Lab v2 (2026-07-07) — data.js, battle.js, three-vfx-effects.js, three-renderer.js, sprites.js, party-builder.js
Token bumped `20260707c` → `20260707d`. Verified: node data-integrity script
(40+ checks) + in-browser LOCAL_ASSETS probe (scratchpad probe_balance.js,
17/18 — the 1 "fail" was the probe testing MP gain on a full-MP unit).
- **Flyer grounding (battle.js)**: `FLYING_ALTITUDE_CONFIG.woundedGroundPct`
  (0.25, data.js). Below 25% max HP a flyer CRASHES to the ground the moment
  damage lands (applyDamageToUnit hook → `forceGroundUnit`) and cannot
  ascend/swoop-takeoff (`canChangeAltitude`/`_skySwoopTakeoff`/requiresFlight
  gates) until healed back over the line. Helpers `isFlightCrippled` +
  `forceGroundUnit` exported on GAME. Spells flagged `groundsFlyers: true`
  (Anchor, Iron Grip, Stasis Beam, Lasso, Earthen Grasp, Gravity Well) slam
  airborne targets down via the debuff-kind hook; pull/aoePull already did.
- **New `root` status (data.js STATUS_DEFS)**: blockMove only — rooted units
  can still act, can't move/dodge/take off. Used by Iron Grip (2t), Anchor
  (2t), Kneecap Shot (2t).
- **Job spell pools**: Neuralyzer DELETED. Engineer lost Nuke (politician/
  general race kits keep SHARED_NUKE) + Tin Foil Hat (→ conspiracy theorist
  race kit) and gained `repair` (tech heal, Tinker-boosted). War Cry moved
  Harbinger → Warrior. Suppressing Fire is Agent-only (marksman race kit got
  its own copy). Headshot renamed **Assassinate** (id `headshot` unchanged).
  Bruiser rework: Haymaker = deterministic 2-tile knockback (displacement),
  Ground Slam = guaranteed slow + crater, Skull Crack = unholy anti-caster
  (silence+drowsy), Iron Grip = root+ground, Rampage path dmg 56→64. Sniper
  job range 4→3; Precision Shot/Spotter trimmed. Harvester int +5→+12,
  Life Drain 160, Healing Spring 1 AP.
- **Race kits**: nordic FULLY reworked to Nordic-alien lore (Aurora Ray /
  Resonance Pulse / Stasis Beam / Federation Beacon / Pleiadian Shield /
  Nordic Accord — ids raceAuroraRay etc.). Werewolf Savage Rend → **Bite**
  (melee lifedrain 30%). Ki Blast → **Ki Volley** (3×45 multiHit; Ki Wave
  stays the beam). Demon Void Contract → **Devour Soul** (150). Martian
  Tractor Beam DELETED (merged into grey's Abduction Beam) → new **Black
  Smoke** (poison line, WotW). Machine elves + **Bad Trip** (dmg + glare/
  drowsy/slow) + buffs. Bigfoot Reality Shift → **Blurry Photo**; Tremor
  Stomp 120 + stagger. Telepath Mind Crush → **Migraine** (drowsy). Atlantean
  Orichalcum Barrier → **Pillar of Atlantis**. Fairy Pixie Dust Trail spell
  REMOVED → passive. Overperformer trims: MIB (atk 54, Classified Weapon
  132), vampire (Lifetap 40% drain, Thrall 30, Predator Drop 20/level), QB
  (hp 538 + all spells trimmed), catgirl (Ninefold 5×28), cowboy (High Noon
  180), annunaki (Star Decree 160, no Nuke), giant (Boulder 110). Buffs:
  nordic stats (atk 50/def 38/int 40), homosapien (545hp/52atk + Adrenaline
  40%), shaman (Spirit Walk 4, Totem 45/turn, Remedy 140), grey (Probe 1
  AP/120, Abduction 75), martian (Heat Ray 135, WotW turret 95/100hp),
  pirate (Yo Ho 130, Plank execute 25%), atlantean (Riptide 120, Tide
  65/turn), ki fighter (Dragon Fist 170).
- **Pixie Dust Trail passive (battle.js + three-renderer.js)**: fairies shed
  a dust mote on the tile they leave each move (`state.pixieDust`, max 4/
  fairy, expires 3 rounds). Allies stepping on a mote collect +40 HP +10 MP
  (`checkPixieDustPickup`, called from finishMoveAt + doJump); enemies stamp
  it out. Rendered as additive canvas-glow sprites in rebuildDeployables
  (hashed into _computeDeployableSerial, seed 7).
- **Weather naming unified**: all summonWeather spells are "Summon X" —
  Call Lightning → **Summon Storm**, job Thunderstorm → **Summon
  Thunderstorm**.
- **`element` tags (organizational)**: optional `element:` field on ~178
  spells (fire/ice/lightning/water/earth/wind/poison/nature/shadow/light/
  psychic/sonic/arcane/blood/metal — doc comment above SPELL_LIBRARY). NOT a
  combat type. battle.js `classifySpellElement` already preferred it;
  three-vfx-effects `_resolveTheme` now checks it first via `_spellDefFor`
  (SPELL_BY_ID/RACE_ABILITY_BY_ID) + `_ELEMENT_THEME` map.
- **VFX wiring (three-vfx-effects.js)**: all reworked/new spells mapped
  (see the "2026-07-07 BALANCE PASS" SPELL_MAP block) + previously-generic
  roster spells (haymaker/groundSlam/ironGrip/pistolWhip/anchor(Toss)/
  plandemic/plank/meow/yoho/glare/lullaby/discordance/spotter/freeEnergy…).
  New bespoke EFFECTS: `skullCrack_impact` (clang + stun-ring + seeing
  stars). Nordic new ids inherit orphaned bespokes (Thunderclap descent →
  Resonance Pulse, Runic Ward aura → Pleiadian Shield).
- **Gun rig fix (`_sigGunRig3D`)**: stand-weapon guns were scale 2.2 and
  pushed 0.45 tiles toward the target — sniper muzzle (1.25 ts) reached
  ~3.2 tiles, pressing the barrel into the target's face. Now: base scale
  1.3 (sky rigs 2.0), anchored 0.18 ts off the CASTER at shoulder height
  (0.95 ts), and scale is distance-capped so the muzzle tip stays within
  ~55% of the caster→target gap (floor 0.55). Summon glyph scales along.
  NOT screenshot-verified — SwiftShader jank kept the intro cinematic up
  past every wait in the sandbox; eyeball live after upload.
- **Castle Fortress texture**: new `castle_wall` terrain (TERRAIN_RULES
  clone of mountain, TERRAIN_SPRITES → bricks_2.png, EW_TERRAIN_COLORS
  entry, three-renderer _CUBE_TERRAIN_SET so it renders as clean masonry
  cubes). raceShieldWall now creates castle_wall.
- **Balance Lab v2 (battle.js)**: BALANCE_STATS_VERSION 2 (auto-migrates the
  v1 localStorage blob). New: `builds` map keyed `race | job (+ sec)` with
  nested `loadouts` (exact sorted spell list → games/wins); `matchLog`
  (capped 400) raw per-match records {mode, rounds, winner, comeback,
  firstKill, firstDeath, teams: both sides' race/job/sec/spells} — opponent
  composition + build-vs-build analyzable offline; aggregates roundsTotal /
  comebackWins (winner trailed ≥2 kills) / firstKillWins. Mid-match tracker
  `_balTrackKill` hooks the applyDamageToUnit kill block; `state._balMatch`
  reset with warpRunes/pixieDust at the 4 new-match sites. Dashboard: new
  Builds tab + Avg Len / Comebacks / FK→Win / Log cards; CSV export gained
  the build category.
- GOTCHA: mana costs are FORMULA-DERIVED at load (`_applyManaCostFormula`
  overwrites `spell.cost` unless `manaCostOverride`) — tune dmg/effects,
  never cost. Slot costs derive from the computed mana.
- Data that drove the pass (117-match arena export ewbalancestats12): Agent
  61%/MIB 65% over; nordic 29%/homosapien 33%/shaman 36% under; Sniper 6
  deaths in 84 games; Suppressing Fire fielded in 106/117 matches. Re-run
  the lab (`balancesim` mode) to validate.

## Character portraits everywhere (2026-07-07) — sprites.js, data.js, battle.js, hud.js, three-renderer.js, party-builder.js
Token bumped `20260707b` → `20260707c`. Probe: scratchpad probe_portraits.js.
- **Portrait folder**: `Assets/Sprites/character_portraits/<male|female>/<name>.png`
  (128×128). NO bucket listing — the inventory was found by HEAD-probing
  candidate names. Files use slang/gendered names: `glowie` (female men in
  black), `cowgirl`, `witch`, `devil` (male demon), `psychic` (telepath F),
  `sniper` (marksman M+F), `harvester` (shaman M+F), `freelancer`
  (homosapien F), `madscientist` (M+F), `meninblack` (M), `kifighter` (F),
  `fortuneteller` (F), plus plain race names: pirate (M+F), knight (F),
  priest (M), nordic, djinn, quarterback, bigfoot, grey, giant, werewolf,
  reptilian, anubis, mantid, antperson (M) and zombie, catgirl, succubus,
  fairy, halfdemon, valkraye (F). **Missing (fall back to map sprite): male
  fortune teller** (kept his old `Races/Homosapien/Male/harbinger/portrait.png`),
  male homosapien/knight/telepath/wizard, female priest(ess), martian,
  machine elves, annunaki, atlantean, vampire, nordic F.
- **sprites.js RACE_PORTRAITS** maps every verified file; `getUnitPortraitUrl`
  unchanged (exact gender match, null → callers fall back to the map sprite).
- **Gendered race labels**: data.js `men in black` got labelMale 'Man in Black'
  + labelFemale 'Glowie'; priest labelFemale 'Nun'→'Priestess'. battle.js
  `unitDisplayName`/`getNametagText` and the three-renderer plate labels
  ('race' nametag mode — the default) now route through
  `getRaceLabel(race, gender)` — plates read "Glowie"/"Priestess"/
  "Mad Scientist", never a lowercase race key.
- **Horologe (hud.js)**: the clock face's inner disc (old etched flat-earth
  map) now wears the ACTIVE unit's portrait (SVG `<image>` inside the
  `hrlgMapClip` circle + radial vignette; no portrait → the map stays). It
  only renders on the local player's turn (ActionMenu gates on canControl),
  so it can never be mistaken for the enemy's turn. New `.hrlg-core-sub`
  line under the unit name: `LvN · RACE · JOB` (race skipped when it equals
  the shown name).
- **Top-left ActiveUnitPanel REMOVED** (hud.js ReactHUD) — redundant with the
  clock (portrait, name, sub-line, AP pips, HP/MP vitals). HudBar is now
  unused but left in place.
- **Target drums = JRPG target lists**: `_hrlgTargetBlades` (attack + spell,
  incl. heals/revives — KO'd revive targets render grayscale) and NEW
  `_hrlgItemTargetBlades` (heal/mana potions → living allies anywhere, banes
  → living enemies within getEffectiveRange+2 chebyshev, mirroring doItem)
  attach a `portrait` payload to each unit blade → HorologeBlade renders a
  face chip (blue ally / red enemy ring) + name over a live HP bar (+shield
  notch; +MP bar on mana-potion targets). Classes: `.hrlg-blade.trow`,
  `.hrlg-tport`, `.hrlg-tcol`, `.hrlg-thp*`. Non-unit targets (towers,
  turrets, buildings) keep the old text meta. The enemy quick-menu view tab
  shows the clicked enemy's face too. battle.js `selectTargetFromMenu`
  gained the `actionMode==='item'` confirm branch (releases
  `_actionExecuting` before doItem — items never owned that latch). Warp
  stone keeps free board aim.
- **Far-zoom portrait nameplates (three-renderer.js)**: every plate carries a
  hidden `.tp-portrait` (portrait, else map sprite) + a `.tp-main` wrapper.
  `_scalePlates` toggles `.tp-far` per frame with hysteresis on projected
  tile width (enter <68px, exit >86px — i.e. when the plate is wider than
  the tile it labels): the plate becomes face card + name + one chunky HP
  bar; types/MP/status/eye/zodiac badges hide. The toggle sits BEFORE the
  `_lastScale` early-return (scale pins at MIN when far and stops changing).
  Decoy clone plates share the structure + toggle so they don't stand out.
- **Party builder rail**: `PortraitSprite` (party-builder.js) — rail slot
  cards show the portrait full-bleed (cover), Sprite fallback otherwise.
- GOTCHA: `RACE_PORTRAITS` URLs are NOT `?v=`-tagged (same as every in-JS
  asset URL) — replacing a portrait image in place needs a file rename.

## Buildings AOE-only + face-your-attacker + press-turn drains + Move Towards metric (2026-07-07) — battle.js, hud.js
Token bumped `20260706n` → `20260707a`. Probe-verified in-browser (scratchpad
probe_fixes2.js, LOCAL_ASSETS harness, 10/10 checks).
- **Buildings are AOE-only now**: basic attacks and single-target spells can no
  longer hit or even target buildings — removed the doAttack siege branch, the
  `kind:'building'` entries in the attack-target list, the doSpell single-target
  chip block, and the hud.js tile-menu "Attack Building" row. Only area damage
  touches structures: AOE blasts / bombs / beams / earthquakes chip exactly **1
  hit per cast** (`buildingHitsForSpell` → 1; was 2 for AOE), cataclysm-class
  spells (`demolishesBuildings`: meteor / both nukes, or terrainDeform+aoe+dmg≥150)
  still level them outright. `BUILDING_MAX_HITS` 6 → **4** (4 area casts to
  level; 6 was tuned for 1-per-swing basic attacks). Enter Building lift,
  collapse rules, right-click demolish (trees/terrain only) all unchanged.
- **Face your attacker (battle.js applyDamageToUnit)**: any direct damage from
  an enemy spins the victim to face its attacker (inside the `finalDamage > 0`
  + `sourceUnit` block; skips DoT ticks, dead targets, self-tile sources). So a
  backstab lands once — repeat swings from the same tile hit the front arc, and
  non-damaging spells (debuffs/seeds) never spin the target since they don't
  route through applyDamageToUnit.
- **Press turn — protected + countered waste AP**: (a) basic attack into a
  Protected (STATUS_DEFS invulnerable) target forces `PRESS_OUTCOME.MISS`
  (extra `PRESS_MISS_PENALTY_AP` drain, no refund chance) — checked
  synchronously in doAttack before resolvePressOutcome; (b) spell damage
  blocked by Protect pushes `{evaded:true}` into `_pressDamageCollector`
  (a MISS vetoes/penalizes the whole cast — same rule as a dodge); (c) getting
  COUNTERED applies an extra `applyPressTurn(unit, MISS)` drain at the counter
  roll site in doAttack (WASTED! float at counter impact). Reminder: back-arc
  attacks can't be dodged OR countered, so a successful backstab never eats
  the counter drain.
- **"Move Towards" 1-tile-shuffle root cause (hud.js)**: the approach scorers
  (`towardTile` scan in _computeEnemyActions + `_bestTowardStep` chase chain)
  ranked candidate tiles by **3D combatDist**, which folds the ELEVATION gap to
  the target into the score — on bumpy maps a tile 2 steps closer on the board
  but up/down a slope scored "no closer", so the pick degenerated to a 1-tile
  shuffle (probe-observed: spawn at z8, candidates at z5-z12 vs target across
  the map). Both now rank by **flat 2D Manhattan** progress (ties prefer the
  smaller z-gap; boss 2×2 footprint handled); jump tiles still win when they
  land strictly closer. Range/LOS gating everywhere else stays 3D — this is
  approach heuristics only.
- HARNESS gotcha: the horologe quick-menu blades (`.hrlg-blade`) don't mount in
  the headless probe by just setting `_enemyActionTargetId`/calling clickTile —
  verify quick-menu logic by calling the module-scope functions directly
  (they're top-level script scope, so globally reachable in evaluate).

## Killstreaks/Bounties + Entropy Gauge/ENTROPY STRIKE (2026-07-06) — battle.js, ai.js, hud.js, online.js, three-renderer.js, data.js, styles-hud.css, styles-cinematic.css
Token bumped `20260706l` → `20260706m`. ALL game modes. Partially probe-verified
(scratchpad probe_entropy.js — globals/gauge/HUD-meter/full-glow all PASS; user
opted to verify the combat flows live in-game).
- **Heat states (battle.js STREAK_LABELS + helpers)**: 2 kills without dying =
  ♨️ HEATING UP, 3+ = 🔥 ON FIRE (labels renamed; 4=RAMPAGE, 5=GODLIKE kept).
  Existing +8 ATK/streak-step bonus unchanged; death still resets via
  resetKillStreak. Helpers on window + GAME: `isUnitHeatingUp/isUnitOnFire/
  getUnitBountyGold`. While ON FIRE every kill refunds **+1 AP** (full tank →
  the surplus vents into the Entropy Gauge instead).
- **Bounties**: ON FIRE units carry `BOUNTY_GOLD_BASE 15 + 5/extra-kill, cap 35`
  (GOLD_PER_KILL is 10). `processBountyClaim(killer, victim)` runs in the
  applyDamageToUnit kill block BEFORE processKillStreak/defeatUnit (victim
  streak still intact). Arena: +`ARENA_PTS.bounty` (10, data.js) per claim via
  `state._arenaBountyPts` — added to ALL THREE composite calcs (hud.js
  _arenaScore/_fullArenaScore, battle.js _vicArenaScore + _arenaComposite).
  Announcements: "💰 BOUNTY POSTED" on ignition, "💰 BOUNTY CLAIMED" on cash-in.
  Nameplate badges (three-renderer.js statusHtml block): `🔥 ON FIRE` (pulsing)
  + `💰Ng`, `♨️ HOT` at 2. ON FIRE units also get a live torch-flame billboard
  over their head (built in _buildUnitEntry, registered with _torchFlames —
  auto-pruned on rebuild/death).
- **Entropy Gauge (battle.js `ENTROPY_PTS` = single balance table)**: per-team
  0..100 (`state.entropyGauge`, reset in both startMatch + find-next-match
  blocks). Charges: press-turn OVERFLOW (a WEAK/CRIT refund clipped by the
  per-turn cap or full AP — "the 6th AP") **8/AP** (the marquee source, wired
  inside applyPressTurn), banked press refunds 1, kill 4, multikill +3/extra,
  bounty claim 8, ON-FIRE overflow 4, overkill 2, hourglass 2, turret destroyed
  3, building destroyed 4, seed/ward 1, tree 1 (in _fellTreeAt credit branch),
  smashed block 1, tower hit 1 (all 3 Cube-damage sites). `addEntropy(player,
  amt, reason, srcUnit)` floats "⚛ +N ENTROPY" (gains ≥3), pins at 100, logs/
  announces FULL, pokes `window._updateEntropyGaugeHUD` (hud.js — dispatches
  'ew-state-change').
- **HUD (hud.js)**: `EntropyMeter` ×2 in the Scoreboard centre (P1 fills →, P2
  fills ←, ⚛ glyph between; violet full-state pulse classes in styles-hud.css).
  ⚛ ENTROPY pusher on the Horologe bezel when `canUseEntropyStrike(unit)` —
  fires `window.doEntropyStrike` (bare global → hits the online wrapper).
- **ENTROPY STRIKE (battle.js)**: full gauge → any allied unit, 1 AP, hits
  EVERY visible enemy (fog: computeVisibleTilesCached; fog off: all) for
  `150 + 0.55 × Σ(living allies' atk)` ±15 anomaly magic damage, drains gauge
  to 0 (refillable). Kills go through the normal kill/streak/bounty pipeline.
  Cinematic (~1.7s charge + 0.34s/enemy + 1.5s resolve, all actionMs-wrapped):
  `ews-*` letterbox banner overlay (styles-cinematic.css, VS-splash pattern) +
  nukeAlarm, per-ally sigMagicCircle3D + light pillars, bloom swell
  (ThreePost.setBloomStrength tween), camera dive → focusOnTiles crane, giant
  sky sigil, staggered per-enemy strikes rotating 3 flavors (ThreeLightning.
  strikeFromSky+sigStormStrike3D / sigStandSword3D+shockring / sigLightPillar3D
  +torus ring) with screen flashes + hard shakes, final whiteout + board-wide
  shockring, camera.restore. VFX wrapped in `_ewsSafe` so a visual error can
  never wedge `_actionExecuting`; `_skipVisuals()` path resolves instantly.
  Returns total-ms (AI waits on it) or false.
- **AI (ai.js)**: `scoreEntropyStrike` in gatherCandidates (score 200 + 40/
  target — fires nearly always when full) + `entropyStrike` case in
  executeAction. Uses GAME.canUseEntropyStrike/doEntropyStrike.
- **Online (online.js)**: doEntropyStrike wrapped like channelNexus (host runs+
  syncs, guest emits `{type:'engine', fn:'doEntropyStrike'}`) + host relay
  case. server.js untouched.
- Unit panel status chips (battle.js getStatusEntries) now read "♨️ HEATING UP
  / 🔥 ON FIRE (+X ATK, kills refund +1 AP)" + "💰 BOUNTY — worth +Ng".
- GOTCHA: gauge stays PINNED at max until spent (addEntropy no-ops at 100).
  `state._entropyStrikeCount` tracks uses per player.
- **Round 2 feedback pass (same day, token → `20260706n`)**: gauges moved to a
  BIG full-width strip along the scoreboard's BOTTOM edge (11px, quarter
  ticks, shimmer sweep, pulsing READY label; root gets paddingBottom:15;
  meters have ids `ewEntropyMeterP1/2`). "⚛ +N ENTROPY" floating text REMOVED —
  replaced by `window._entropyOrbsFly(player, amt, srcUnit)` (hud.js): 1-8
  glowing motes pop at the earning unit's screen position (THREE.Vector3
  .project via bare `ThreeCamera.getCamera()` + `CONFIG.tileSize`; falls back
  to screen centre) and arc into the meter, each arrival kicking a
  brightness flash (`.ew-entropy-hit`).

## Running the game + harness
```bash
npm install                       # express + socket.io
npm start                         # serves the client on http://localhost:3000
# one-time, for automated playtesting:
npm install playwright
npx playwright install chromium --with-deps
node playtest.js tdm              # arena | tdm | ffa | domination | hotspot | ctf
```
Artifacts land in `shots/`: per-round PNGs, `<mode>-result.png`,
`<mode>-combat-log.txt`, `<mode>-flags.json` (flagged bugs).

## Asset loading (important fragility)
`index.html` loads ~35 external scripts from a Cloudflare R2 bucket
(`pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev`) + CDNs (three.js r128, socket.io).
ALL game logic lives there (`battle.js` ~20k lines, `ai.js`, `data.js`, sprites…).
- If those hosts are blocked/down, the game silently renders every menu stacked
  and unstyled — no error, no spinner. Single point of failure.
- Behind TLS inspection the browser throws `ERR_CERT_AUTHORITY_INVALID`; the
  harness sets Playwright `ignoreHTTPSErrors: true` to load anyway.
- Headless needs `--use-gl=swiftshader` for WebGL.

## Movement/sky-spells/UFO/minimap fixes (2026-07-06) — battle.js, hud.js, ui.js, three-renderer.js, three-vfx-effects.js
Token bumped `20260706h` → `20260706i`. Verified in-browser (scratchpad
probe_fixes.js, LOCAL_ASSETS harness, 11/11 checks).
- **Jump re-arms move mode (battle.js doJump `_doPostJump`)**: after a jump the
  unit stays in `actionMode='move'` when `canUnitMove` (same cascade as
  finishMoveAt) instead of dumping to the root menu. Combined with the existing
  move→jump re-arms + ui.js folding jump tiles into the move overlay, walking
  and jumping now feel like ONE movement verb.
- **"Move Towards" chains the whole approach (hud.js)**: new `_chainMoveTowards`
  + `_bestTowardStep` — the quick-menu button keeps stepping (walks AND the
  jump) until the unit is adjacent, out of movement, or nothing gets closer.
  `_executeAction`'s moveTowards branch calls the chain after the first step.
- **Sky grabs (skyDrop/skyThrow/skySlam) fixed**: (a) range is now 2D-Manhattan
  + no terrain LOS in `getSpellRangeTiles`, `_getSpellValidTargets` AND the
  ui.js highlight `_rangeD` — matching doSpell's own validation (the old 3D
  combatReach counted the flyer's altitude → "no longer in range" on adjacent
  targets). (b) skyThrow phase 2 is view-INDEPENDENT in clickTile +
  updateHoveredTarget (`_hasSkyGrab` gate) — drop-tile clicks no longer fall
  into the generic validators when the menu re-armed to 'spells'; invalid
  phase-2 clicks just nag (never cancel the paid grab / reselect). (c) grab
  completion locks `actionMode/actionMenuView/selectedTool` for phase 2.
  (d) NEW `_skySwoopTakeoff(unit)` (battle.js, above doJump): a grounded flyer
  auto-takes-off as part of any requiresFlight sky cast (free — the swoop IS
  the spell), so Predator Drop no longer needs a manual Take Off or an odd
  approach move; drop damage uses the real airborne height.
- **One true UFO**: every saucer is now the crop-circle `_sigBuildUFO` craft.
  `_spawnProbeDescent3D` (three-vfx-effects.js) rebuilt on `_sigBuildUFO`
  (probe needle + ~700ms pierce timing preserved); the flat ufo.png DOM
  sprites in battle.js (debuff flyover for raceImplant, raceTractorBeam tow)
  are DELETED, replaced with `ThreeVFXEffects.sigUFO3D` calls. `_sigUFO3D`
  gained `path`/`pathMs` opts (glides along tile waypoints during hover, beam
  tracks; exit starts from the last waypoint) for the tractor tow.
- **Minimap (three-renderer.js)**: `_miniUnitVisible` now also requires the
  enemy's tile in `_fogVisibleSet` (the same set that hides 3D models) — no
  more permanent enemy dots through fog. Wrapper restyled to match the HUD
  panels: `rgba(8,10,18,0.82)` bg, faint `rgba(120,140,180,0.16)` edge, 8px
  chamfer clip-path (no border-radius), small DotGothic "TACTICAL" label.

## Party Builder redesign round 2 (2026-07-06, same session) — party-builder.js only
Token bumped `20260706c` → `20260706d`. Six feedback fixes:
- Header BACK removed; footer is now ONE command row: red `← BACK`
  (pb-btn-danger) · RANDOM/RANDOM ALL/DEFAULTS · SAVE/LOAD · slot indicator ·
  CONFIRM · SEAL YOUR FATE.
- Roster search/sort/filters left-aligned (spacer removed).
- SUBCLASS promoted: blade-styled `.pbx-subbar` in the ABILITIES panel between
  the loadout and the pool ("adds its spells to the pool below · shifts stats",
  ▾ CHANGE). Opens the picker modal (`equipPicker === 'subjob'`): every job with
  "+N SPELLS TO POOL" + green/red stat shifts from computeSecJobBonuses. Pool
  header now reads "SPELL POOL <MAIN> + <SUB>". Identity row keeps a small
  read-only "◈ SUB: <job>" echo.
- Combat assessment: stat bars shortened to ~54% width; the combined
  reach diamond split into TWO diamonds via `RangeDiamond` — blue MOVE
  footprint + red RANGE footprint, each labeled with its value.
- NEW `RACE_TRAITS` registry (window-exposed, party-builder.js): passives &
  terrain rules per race, rendered as `.pbx-trait` rows under the stats.
  Entries commented CODED (live engine rules: adaptation fns in map.js,
  SKY_RACES flight, sleepPreference day/night ±8 ATK/5 armor/5 INT/1 AWR,
  werewolf day-human/night-beast model swap, deep-water/lava move+drown) vs
  DESIGN (authored playstyle passives, NOT yet implemented in battle.js —
  implement these next; the menu already advertises them). Only the 26
  default-unlocked/3D-ready races have entries.
- RACIAL chip on spell blades removed (race abilities read as normal spells).

## Party Builder redesign (2026-07-06) — party-builder.js only
Token bumped `20260706b` → `20260706c`. Full champ-select-style relayout of the
React builder (mount contract `_mountReactPartyBuilder`/`builderOverlay` unchanged;
all handlers/data flow kept — presentation only).
- Grid is now `112px rail | center | clamp(340px,28vw,470px) abilities`. Center
  splits vertically: HERO SHOWCASE (54%) over the roster grid.
- HERO SHOWCASE: big sprite (fills the stage), flanked by RPG-style slot squares —
  2 GEAR + 3 ITEM (`EquipSlotBox`, class `.pbx-eqslot`). Clicking a slot opens a
  centered picker modal (state `equipPicker`: `'item' | 'accessory1' | 'accessory2'`);
  hover ✕ on a filled slot removes. Item counts are expanded to per-slot units
  (`itemUnits`). Identity sheet right of the stage: big Cinzel name, TypeChips
  (canonical cut-corner badges, size 11), faction demoted to a tiny text line with
  its FACTION_BONUSES value, NAME/ZODIAC/SUB row, then tabs `heroTab`:
  COMBAT ASSESSMENT (stat bars + range profile) / CODEX DOSSIER (lore).
- ABILITIES panel: equipped loadout + spell pool render as `SpellBlade` —
  battle-parity blades mirroring hud.js Horologe rows (skewX(-6deg), clip-path,
  category glyph/left edge from PB_CAT ≡ _HRLG_CAT, Cinzel name, type badge,
  ◆ slot-cost pips, colored PWR chip, MP chip) with an ALWAYS-VISIBLE one-line
  desc (`RNG/AOE — desc`). Pool rows have a checkbox + lit state; rows that
  can't fit the slot budget render at 0.45 opacity but stay clickable (error
  sfx). Rich hover tooltip retained. `.pbx-name` never shrinks; chips clip
  right; ≤1500px viewport hides the RACIAL chip (media query).
- Removed per user feedback: ALL color-coded dots (party rail, vessel cards,
  faction chips, spell rows), FactionChip component, footer slot thumbnails
  (duplicate of the rail), items/gear side panels, codex dossier panel (now a tab).
  Roster cards shrunk (minmax 72px) to name+job only.
- HARNESS: builder screenshots via `.pb-tarot`; blades are `.pbx-blade`
  (`.pool`/`.on`/`.empty`), tabs `.pbx-tab`, slot squares `.pbx-eqslot`,
  pickers `.pbx-pick-row`. "SEAL YOUR FATE" flow (`.pb-btn-primary`) unchanged —
  playtest.js works as-is (verified: menus → builder → interactions at 1600×900
  and 1280×720 with `USE_ASSET_CACHE=1 LOCAL_ASSETS=party-builder.js`).

## Battle loading screen + asset preload gate (2026-07-05/06) — battle.js, three-renderer.js, audio.js, online.js, styles-cinematic.css
Token bumped `20260705g` → `20260705h`. ROADMAP §3.1 + §3.2 shipped.
- `showBattleLoadingScreen(onDone)` (battle.js, just above `showVSSplash`; also on
  `window`) now runs between team lock-in and the VS splash. NGE-title-card look:
  YEAR 2058 / mode / map / BATTLE:n in Cinzel, random `Assets/Sprites/ls1–ls5.png`
  pixel art, entropy motes, rotating FIELD MANUAL / INTEL FRAGMENT hints (mined from
  the ui.js codex dossiers — `LS_HINTS`), real progress strip. CSS = `.ls-*` block at
  the END of styles-cinematic.css.
- It is a REAL gate: `ThreeRenderer.preloadUnitModels(units, (done,total)=>{})` (new
  public API; settles per-URL on success OR failure via `doneCbs` next to the
  success-only `cbs` in `_unitGlbCache`) + `warmBattleTrack(key)` (audio.js,
  `canplaythrough`/10s) + `new Image()` warms of unit sprite URLs. Gate =
  `Promise.race([all, 12s cap])` AND ≥2.6s min display; tap-to-dismiss once ready;
  auto-dismiss 900ms after ready. Constants `LS_MIN_SHOW_MS`/`LS_MAX_WAIT_MS`.
- Kills the 2D→3D pop-in: after the gate, `renderBoard` finds every GLB cached and
  builds real models on the first pass (verified: `preloadUnitModels` re-run after
  battle start reports total 0 outstanding on a normal run).
- `_skipVisuals()` (dev-sim / animations off) skips the screen but still FIRES the
  warmers — auto-sim harnesses are unaffected.
- Online guests get the same screen via online.js phase-flip hook (wraps the guest
  VS-splash call in `window.showBattleLoadingScreen`). §3.3 (both-clients-ready
  handshake) still open.
- HARNESS IMPACT: manual playtests now see loading screen (up to ~12s cold, ~2.6s
  warm) + VS splash before round 1 — bump waits accordingly. In this container
  SwiftShader jank stretches the page's own timers well past the 12s cap (observed
  ~26s); that's environment jank, not the gate. Playwright route interception also
  keeps `<audio>` at readyState ≤1 — the music warm can't be verified in-harness,
  only live.
- Map title on the card: `_lsMapTitle()` = "THE " + GAME_MODES label uppercased;
  generic size labels (Small…Huge) → "THE PROVING GROUNDS".

## Combat-UI batch 2 (2026-07-05, later session) — battle.js, hud.js, state.js, ui.js
Token bumped `20260705c` → `20260705d`. Verified by driving a full VS-CPU arena
match with the harness + `USE_ASSET_CACHE=1 LOCAL_ASSETS=battle.js,hud.js,state.js,ui.js`
(serves the repo-local edits instead of the deployed R2 copies — use this to
test edits pre-upload; needs `PW_CHROMIUM=/opt/pw-browsers/chromium` in this sandbox).
- **Items face the target (battle.js doItem)**: heal/mana potions and bane
  throws now `setUnitFacing(unit, x-ux, y-uy)` after validation, same contract
  as doAttack/doSpell (self-use = zero vector = no-op).
- **Move/jump pick forces tactical pitch (battle.js setActionMode)**: entering
  'move'/'jump' tweens tilt to `min(_restTilt, REST_TILT_MAX)` + centres on the
  unit when live tilt deviates >8° (sky-gaze/straight-down free look no longer
  leaves the reachable overlay unreadable). Yaw deliberately untouched.
- **No CANCEL blade while picking move/jump (hud.js)**: aim view for
  'move'/'jump' has `blades = []` (label + crown ◀ BACK only); other tile modes
  keep the lone CANCEL blade. Empty blade list is safe in HorologeMenu.
- **Repeat queue (battle.js)**: `state._repeatQueue` armed at the confirm
  click; extra clicks on the SAME target while `_actionExecuting` queue more
  repetitions (`_tryQueueRepeat`, "⟳ ×N QUEUED" float, AP-bounded); the chain
  fires in `endUnitIfDone` (500ms beat, re-validates AP/target/cooldown each
  rep). Cleared by handleBackAction, turn end, or any failed validation.
- **Spell stays armed after cast (battle.js doSpell finishAction)**: with AP
  left and the same spell still affordable + off cooldown, the menu re-arms
  `actionMode='spell'` + `selectedTool=spell.name` → next click is already a
  target pick. Falls back to the open spellbook, then root.
- **Active unit rotates with manual camera orbit (battle.js camera.snap)**:
  middle-drag orbit (`state._userPanning` + opts.yaw) sets the active local
  unit's facing to the camera view dir `(-sin yaw, -cos yaw)`. Gameplay facing
  (attack arcs) — intentional, FFT-style end-facing control.
- **Move-to counts jump/take-off/raise as movement (hud.js)**: quick-menu
  "Move Towards" now also scans `getJumpTiles` (picks whichever lands closer,
  1 AP, `moveTile._jump`), and when NOTHING improves offers "Take Off" (grounded
  flyer) or "Raise Ground" (wall ≥2 higher toward target) via `_heightApproach`.
  `findMoveIntoRange` (attack/bane/self-aoe range approach) tries jump tiles
  between the 1-step and 2-step walk rings. Tile quick menu offers "Jump here"
  when the clicked tile is jump- but not walk-reachable. Spell cards already
  used the engine's jump/height-aware `findSpellApproachTile`.
- **Attack button = real targets only (state.js getActionPanelCache +
  battle.js)**: trees and smashable terrain no longer set `hasAttack`;
  `_getAttackValidTargets(unit, {combatOnly:true})` /
  `attackHasReachableTarget(unit, {combatOnly:true})` skip them for button
  lighting (hud root blade passes it too). They REMAIN in the attack target
  menu and right-click chop — only the verb's lit state changed.

## Action-menu + camera/input fixes (2026-07-05) — hud.js, battle.js, state.js, three-camera.js
All four files must go to R2 together. NOT in-browser verified (user chose to
verify visually after upload) — syntax-checked only.
- **Horologe drum focus window (hud.js)**: sliding 4-row window
  (`HRLG_FOCUS_WIN`) — all 4 rows fully lit (`center` class) and fire on ONE
  click; the keyboard/wheel cursor row adds `.sel` (1.12 scale, strongest
  glow). One faded row peeks past each window edge; clicking it rotates it in.
  Clickable pulsing ▲/▼ "N MORE" arrows (`hrlg-more-ind`) step the list.
  `_hrlgSlot` signature is now `(off, rowH, focused, sel)`; rows are laid out
  relative to the WINDOW (its middle rides the clock equator). END TURN stays
  hidden behind the ▼ arrow until scrolled to (or via the crown).
- **Move/jump hide the menu (hud.js)**: 'move'/'jump' joined `tileTargetModes`
  → picking a destination collapses the drum to the aim view (lone CANCEL +
  "MOVING — CLICK A TILE"). WASD-walking keeps the ladder (keyboard IS the picker).
- **Clock item slots (hud.js)**: 3 one-click item slots (`.hrlg-items`) under
  the HP/MP vitals (bottom:12 of the rig); fire `chooseItemAction` — instant
  items (scanner/panacea/warpStone) use immediately, others arm the target
  picker. The Items submenu still lists everything.
- **Right-click (battle.js + state.js)**: demolish-hold drag tolerance 6→14px
  (`DEMOLISH_DRAG_CANCEL_PX`) and the "OUT OF RANGE"/"NO AP" nag no longer
  fires on mousedown — it's deferred 400ms (`DEMOLISH_NAG_DELAY_MS`,
  `_demolishNag`) and any pointer movement (a pan) cancels it silently. A
  clean stationary right-CLICK (<450ms, no drag — handled in state.js pan
  mouseup) calls `handleBackAction()`: backs out of submenus / target-aim
  modes, NEVER ends the turn, and no-ops at the root menu.
- **Camera under the floor (three-camera.js)**: the free-look floor clamp in
  `sync()` is REMOVED — pure orbit, so tilting past 90° lets the eye ride
  below the board while the focal unit stays dead-centred (the old clamp slid
  the camera away from the character when looking up). The cinematic
  `_cineKeepSubject` branch is unchanged.
- **DoT ticks wait for the camera (battle.js)**: `processEndOfRoundStatuses`
  now applies each burn/poison/drowning tick via a deferred `_applyTick`
  (430ms) AFTER its `eorFocusCamera` dive lands, so the floating damage /
  wiggle / sfx play on-screen instead of mid-pan.

## 3D batch wave + basic-attack animations (2026-07-11d)
- **User uploaded 19 new Character_output models** to the races' R2 sprite
  folders. NO bucket listing exists, so prefixes were HEAD-probe swept
  (~380k URLs across 7 sweeps). FOUND + WIRED (+ starter-unlocked in
  data.js/server.js ACCT_STARTER_UNITS):
  - scarecrow M → `scarecrow/male` → `scarecrow` (claw basic attacks, zombie sway idle, hr 1.12)
  - santa clause M → `santaclause` (no gender dir) → `Santa_Clause` (throw basic attacks — present toss, Idle_10 sway, hr 1.08)
  - mermaid F → `mermaid/female` → `hot_mermaid_girl` (magic basic attacks, Swim_Idle_Loop, hr 0.95)
  - The other 16 file names came from the user's R2 dashboard (the Meshy
    PROMPT is the file name — e.g. "Anubis Egyptian dog" — so they can't be
    guessed from race names; the CDN has no folder listing, only the
    dashboard can enumerate). ALL 19 now wired + HEAD-verified (folder →
    prefix; trailing `_` = real, prompt truncation doubles the underscore
    before `_biped_`):
    marksman F → Homosapien/Female/sniper → `female_sniper_beauti` ·
    anubis → anubis/male → `Anubis_Egyptian_dog_` ·
    robinhood → robinhood → `archer_robin_hood_r` (castRanged=Archery_Shot_1, bak arrow) ·
    antperson → antperson/male → `giant_ant_realistic` (claw) ·
    necromancer F → necromancer/female → `hot_girl_necromancer` (magic) ·
    succubus F → succubus/female → `hot_seductive_pink_su` (magic) ·
    barbarella F → barbarella → `hot_space_agent_girl_` (ranged, pistol idle) ·
    king arthur → king → `king_arthur_king_of_` (Sword_Idle + Sword_Regular_Combo) ·
    mantid → mantid/male → `mantid_realistic` (claw) ·
    mech → mech/male → `mecha_mech_battle_m` (ranged, hr 1.5) ·
    minotaur → minotaur → `minotaur_realistic` (punch, Idle_10) ·
    mothman → mothman/male → `mothman_cryptid_gian` (magic) ·
    reptilian → reptilian/male → `reptilian_in_a_busine` (claw) ·
    priest/nun F → Homosapien/Female/whitemage → `sexy_nun_girl_realis` (magic) ·
    robot → robot/male → `futuristic_robot_rea` (punch) ·
    cyborg F → cyborg/female → `hot_girl_futuristic_` (punch).
    All 19 races starter-unlocked (data.js + server.js; priest/marksman were
    already listed — their new models flip the 3D-only gate). GLB rig
    spot-checks (scarecrow/santa/mermaid/mech/nun): 24-joint skins, Hips ✓.
- **LUNGE RETIRED for rigged-model basic attacks** (three-renderer.js
  _syncCombatAnims): the attack-clip chain now plays INSTEAD of the lunge
  tween — the lunge (+ attack sheet) only fires when no model clip started
  (sprite units / load failures). Sprite units keep the old look.
- **Per-character basic-attack flavor**: new def opt `basicAttackKind`
  ('magic'|'arrow'|'punch'|'claw'|'throw'|'ranged'|'melee') read by
  battle.js triggerAttackAnim (kindOverride 'chop' still wins; reach>1 →
  'ranged' / else 'melee' stays the default). Renderer chains: magic→
  [castMagic,cast] · arrow→[castArrow,castRanged,cast] · punch→[castPunch,
  castMelee,cast] · claw→[castClaw,castMelee,cast] · throw→[castThrow,
  castRanged,cast]. Tagged: casters zap (fortune teller M+F, telepath M+F,
  wizard, shaman, fairy, grey, machine elves, atlantean, mermaid), demon/
  vampire/scarecrow claw, quarterback/santa throw.
- **New UAL_SLOTS**: castPunch = UAL1 Punch_Cross @1.2 (punch/jab/uppercut/
  fist spells — Robo Punch, Hydraulic Punch, Dragon Fist…), castClaw = UAL2
  Zombie_Scratch @1.5 (claw/scratch/bite/fang/talon/maul/pounce — Demonic
  Claw, Venom Fang, Ninefold Scratch, Pounce…). classifySpellAnimKind kinds
  'punch' + 'claw' (checked after 'kick', before the damaging split; 'hook'
  deliberately excluded — Harvest Hook is a pull). 'stomp' added to the
  'slam' kind (Tremor/Cataclysm Stomp → Charged_Ground_Slam).
- Offline validation: sprites.js loaded in a node vm — classify cases pass,
  new defs carry basicAttackKind/lib slots, isRace3DReady true for all 3;
  all edited files node --check clean. No in-browser run (RULE #1c).
- No portraits on R2 yet for scarecrow/santaclause/mermaid (HEAD 404) —
  map-sprite fallback shows in HUD panels until 128×128 portrait.png ships.

## MAL library — Meshy clips as a shared library + male sniper (2026-07-11)
- **`Assets/Models/MAL1_Sniper.glb` (lib index 2)**: the user uploaded 20
  Meshy animations exported from ONE character (the male sniper,
  `Meshy_AI_sniper_biped_Animation_<Name>_withSkin.glb`, ~7.9MB EACH — they
  carry the full mesh+texture). Claude consolidated them offline into one
  1.4MB animation-only GLB: skeleton nodes kept, meshes/skins/textures
  stripped, each file's single clip copied in and RENAMED to its file stem
  (`Armature|Idle_5|baselayer` → `Idle_5`). Builder: scratchpad
  `build_mal.js` (@gltf-transform/core; npm sharp 403s behind the proxy, so
  never install @gltf-transform/functions). Clip inventory (dur s): Idle_5
  1.9 / Idle_10 3.7 (brawler) / Idle_11 1.93 (female) / Walking 1.07 /
  Walking_Woman 1.0 / Running 0.67 / Regular_Jump 1.93 / Dead 3.0 / Block3
  1.53 / Hit_Reaction_1 1.27 / Face_Punch_Reaction 2.87 / Fall3 1.33 /
  Cowboy_Quick_Draw_Shooting 7.33 / Spartan_Kick 1.47 / Archery_Shot_1 1.07 /
  mage_soell_cast 2.3 / mage_soell_cast_3 3.37 / mage_soell_cast_7 2.73 /
  Charged_Spell_Cast 2.7 / Charged_Ground_Slam 3.03. All rigs identical;
  walk/run/idle loops have ZERO net hip drift (in-place, no root motion).
- **Renderer**: `_libEnsureSrc` (three-renderer.js) now auto-detects the
  source rig naming — no 'pelvis' node but a 'Hips' node ⇒ Meshy-named
  source; bones/rest are keyed by the CANONICAL UAL name either way, so
  calibration/bake code is untouched. Meshy→Meshy retarget still goes
  through the same keep-own-pose pipeline (sniper's A-pose rest ≈ targets',
  so arm calibration is near-identity).
- **Offline validation** (scratchpad validate_bake.js — 1:1 port of the bake
  math over gltf-transform): MAL1×{fortune teller, werewolf}×7 clips + UAL1
  regression ×3 clips — no NaNs, feet grounded on locomotion, Dead lies at
  floor level, segment lengths preserved to 0.00%. NOT in-browser verified
  (RULE #1c) — visual check on real hardware still pending.
- **UAL_SLOTS remap (sprites.js)**: Meshy clips are the new body-language
  defaults — idle Idle_5 / walk Walking 2.05 / run Running / jump
  Regular_Jump / dodge Block3 / hit Hit_Reaction_1 / death Dead / castMagic
  mage_soell_cast_3 / castSupport mage_soell_cast_7. Weapon actions stay
  UAL (castRanged Pistol_Shoot, castMelee Sword_Attack, castThrow, castPlant).
  NEW slots + classifySpellAnimKind kinds (chains in _syncCombatAnims):
  castHeal mage_soell_cast ('heal': heals/revives, checked before 'aoe') ·
  castAOE Charged_Spell_Cast ('aoe': watchtower/walls/raise) · castSlam
  Charged_Ground_Slam ('slam': /rampart|slam\b/ incl. raceChassisSlan typo) ·
  castArrow Archery_Shot_1 ('arrow') · castKick Spartan_Kick ('kick') ·
  castConsume = UAL2 Consume ('consume': potions/elixir/stim). battle.js
  hooks added: both potion uses fire `triggerCastAnim(unit, {id:'consume…'})`;
  counterattacks fire `triggerAttackAnim` on the countering unit (riposte).
- **Gendered defaults**: `_FEM_SLOT_DEFAULTS` (idle Idle_11, walk
  Walking_Woman) applied to every `female:` def post-build via
  `_applyFemaleSlotDefaults()`; a def's own `opts.lib` slots win
  (`_libOverridden` recorded in _mk3d). Flavor added: cowboy M+F castRanged
  = Cowboy_Quick_Draw_Shooting @5.0 (lib 2), catgirl + ki fighter jump =
  NinjaJump_Start (UAL2), bigfoot/giant/quarterback idle = Idle_10.
- **Male sniper WIRED + UNLOCKED**: race 'marksman' (job Sniper) —
  RACE_MODELS_3D entry whose `model` IS his Idle_5 `_withSkin` export in
  Assets/Models (no Character_output on R2; any withSkin export is a valid
  rigged model). Was already in ACCT_STARTER_UNITS behind the 3D-only gate,
  so wiring the model auto-unlocked him. heightRatio 1.02. No portrait yet
  (map sprite fallback) — optional 128×128 portrait.png later.
- **Round 2 (2026-07-11b — block / chop / deploy wired)**:
  - `block` slot (UAL2 Shield_OneShot @1.6 → 0.52s): the zero-damage
    "blocks the hit" branch of applyDamageToUnit now fires
    `flashUnit(target.id,'block')`; the renderer plays chain
    ['block','hit'], tints the flash a subtle steel-blue and SKIPS the
    impact shake (nothing landed). `_wireSlot` one-shot rule extended to
    'block'.
  - `castChop` (UAL2 TreeChopping_Loop @1.2 → 0.81s): triggerAttackAnim
    grew an optional `kindOverride` arg; the doAttack tree-chop branch and
    BOTH dig-tool ops (tree fell + block dig) pass 'chop' → renderer chain
    ['castChop','castMelee','cast'].
  - `castTrap` (UAL1 Fixing_Kneeling 5.2s @4.0 → 1.3s kneel-and-rig): new
    classifySpellAnimKind kind 'deploy' (/trap|snare|\bmine\b|contraption|
    deploy|sentry/) → chain ['castTrap','castPlant','castSupport','cast'].
    Catches snareTrap, frostMine, magnetMine, raceTeslaTrap, raceLucidTrap,
    raceWebSnare, raceFlashbangMine, raceTinkersContraption, deployTurret;
    warpRune intentionally does NOT match (runes keep magic-cast flavor).
- **Round 3 (2026-07-11c — heavy hits + falls wired)**:
  - `hitHeavy` slot (MAL Face_Punch_Reaction @3.3 → 0.87s reel): the damage
    branch of applyDamageToUnit tags the flash 'hitHeavy' when
    finalDamage ≥ 60 (the SAME threshold that golds the number / picks the
    hit11 spark), opts.isCrit, or the type note says super effective. DoT
    ticks keep their own flashColor kinds. Renderer chain
    ['hitHeavy','hit']; unknown flash kinds already tint white, so the
    heavy flash looks like a hit flash (+ shake).
  - `fall` slot (MAL Fall3 @1.2 → 1.1s flail, **pinHips: true**): new
    battle.js `triggerFallAnim(unit)` (state.fallAnimIds, mirrors dodge) +
    renderer sync block (runs AFTER hit-flash so the fall owns the moment).
    Fires from: forceGroundUnit (wounded crash + spell groundings) and
    state.js applyFallDamage when the caller passes `{byEnemy:true}` —
    tagged at: crash-push spells (2 sites), tremor-trap pit, displacement
    spell, pull spell, state.js applyBlowback. Voluntary drops (doMove
    ledge drops line ~12766, doJump) are deliberately untagged.
  - **pinHips bake flag** (libClips value `{clip, lib, pinHips:true}`,
    plumbed through UAL_SLOTS/_mk3d): _libBakeClips writes the character's
    own REST hips translation for every sample instead of the retargeted
    pelvis travel — Fall3 bakes a fall-from-height plunge (hips 2.79→0.21×
    rest height, verified) that would fight the board tween's actual drop.
    Bake cache key gets a ':pin' suffix so pinned/unpinned bakes of the
    same clip can coexist.
  - Offline bake validation re-run (validate_bake.js): Fall3 /
    Face_Punch_Reaction / Block3 / Spartan_Kick / Archery_Shot_1 (MAL) +
    Fixing_Kneeling (UAL1, kneels to 0.43× hips) × fortune teller +
    werewolf — no NaNs, segErr 0.00%.
- **NOT wired (clips ready, no engine hook)**: none left from the 20 MAL
  clips + requested UAL set. Counter plays hit-flinch → castMelee riposte,
  not block→attack (sequencing two clips would need renderer work).
- **MANDATORY upload for this to work**: `MAL1_Sniper.glb` → R2
  `Assets/Models/MAL1_Sniper.glb`. Without it the bake skips every lib-2
  slot → characters stand in rest pose (UAL casts still play). The 20
  individual withSkin files on R2 stay (the sniper's model URL points at
  Idle_5's), but are no longer fetched as clips by anyone.

## Rigged 3D unit models (2026-07-05 — 17 characters + animation categories)
- **SHARED ANIMATION LIBRARY (2026-07-10 — supersedes per-character clips)**:
  the Quaternius Universal Animation Library (CC0, 43 clips, UE5-style rig,
  `Assets/Models/UAL1_Standard.glb` on R2 — the NON-root-motion export) now
  animates every RACE_MODELS_3D character. three-renderer.js `_libBakeClips`
  RETARGETS clips onto each Meshy rig at load: (1) direction-calibrate the
  Meshy rest pose onto the UAL T-pose top-down per `_ANIMLIB_MAP` (22 bone
  pairs, UE names → Mixamo-ish Meshy names; note Meshy's spine order is
  Spine02→Spine01→Spine bottom-up), (2) constant per-bone world offset
  R = inv(srcRestWq)·tgtCalWq, (3) 30Hz mixer sampling → local quat keys +
  scaled Hips position keys. Bake ≈ 100–170ms/character, cached on the model's
  _unitGlbCache entry (`_libBaked`). Slot map + timescales: sprites.js
  `UAL_SLOTS` (idle/walk/run/jump/dodge/hit/death/cast·Magic·Support·Ranged·
  Melee·Throw). NEW slots: `run` (Sprint_Loop — multi-tile dashes via
  `_ew_sprinting`, hub free-roam run) and `dodge` (Roll — dodge tweens).
  - New character = upload `..._Character_output.glb` + one
    `_mkUAL(folder, prefix, {heightRatio})` line in sprites.js. No animation
    exports needed.
  - Old per-character Meshy clip GLBs stay wired as AUTOMATIC fallback (lib
    404 / bake exception / `window.EW_DISABLE_ANIM_LIB = true` /
    per-character `noAnimLib: true`). The preload gate fetches ONE lib GLB
    instead of every clip GLB when the lib is active (big bandwidth win).
  - Trade-off: calibration forces the source's upright T-pose skeleton shape,
    so hunched/bestial rigs (werewolf, bigfoot) get "humanized" posture on
    library clips — verified OK-looking on werewolf stick-figure bakes, but
    if a character loses too much personality, set `noAnimLib: true` on it.
  - Sampling actions must be LoopOnce+clampWhenFinished during the bake:
    setTime(duration) on LoopRepeat wraps to frame 0 (deaths stood back up).
  - Math validated offline 2026-07-10 (scratchpad stick-figure renders of
    fortune-teller + werewolf bakes vs UAL source; no NaNs, feet grounded,
    T-vs-A rest difference cancelled by the calibration pass).
  - **Round 2 (2026-07-10, same day)**: TWO library files now —
    `Assets/Models/UAL1_Standard.glb` + `UAL2_Standard.glb` (both non-RM).
    `def.animLib` is an ARRAY; `libClips` values are `{clip, lib}` (lib =
    file index). UAL2 adds OverhandThrow (castThrow — real throw at last),
    Farm_PlantSeed (NEW castPlant slot; classifySpellAnimKind returns
    'plant' for /seed|sapling|sprout|plant/ spells, chain castPlant →
    castSupport → cast), Melee_Hook, Zombie_Idle/Walk/Scratch, Sword_Idle/
    Sword_Regular_Combo/Sword_Heavy_Combo, Pistol_Idle_Loop,
    Idle_FoldArms_Loop, shield/slide/ninja/farm sets.
  - **Keep-own-pose retargeting (round 2 — the "everyone looks the same"
    fix)**: calibration now pulls only the ARM bones onto the library's rest
    directions (Meshy arm bind angles are rig noise); spine/head/legs keep
    the character's OWN rest orientation and the animation applies as a
    rotation delta on top — so the hunched werewolf stays hunched (verified:
    rest spine z-lean 0.43 preserved + amplified by the zombie idle) while
    humans stay upright. `_ANIMLIB_MAP` carries the per-bone calibration
    weight. Opt back into the old fully-standardized pose per character with
    `libPose: 'standard'` or globally with
    `window.EW_ANIM_LIB_STANDARD_POSE = true` (console A/B).
  - **Per-character flavor overrides**: `_mk3d`/`_mkUAL` opts.lib =
    `{slot: {clip, lib, ts}}` merges over UAL_SLOTS. Wired: knight
    (Sword_Idle + Sword_Regular_Combo), all gun users incl. catgirl/annunaki
    (Pistol_Idle_Loop), werewolf (Zombie idle/walk/scratch), vampire
    (FoldArms idle + scratch), demon (Sword_Heavy_Combo), giant
    (Punch_Cross), bigfoot/catgirl/kifighter/halfdemon (Melee_Hook),
    atlantean (Swim_Idle_Loop).
  - UAL1 clip inventory (dur s): Idle_Loop 2.5, Walk_Loop 1.33, Jog_Fwd_Loop
    0.93, Sprint_Loop 0.67, Jump_Start 1.33/Jump_Loop 2.5/Jump_Land 1.27,
    Roll 1.47, Hit_Chest 0.33, Hit_Head 0.43, Death01 2.4, Punch_Jab 0.87,
    Punch_Cross 1.0, Sword_Attack 1.53, Sword_Idle 1.67, Spell_Simple_
    Enter/Shoot/Exit/Idle_Loop 0.53/0.5/0.43/2.1, Pistol_Shoot 0.63 (+aim/
    reload/idle), Crouch/Swim/Sitting/Dance/Driving/Push/Interact/PickUp/
    Fixing etc. — full list via animviewer at quaternius.com.
- **Per-unit rig cache (2026-07-06 — post-animation hitch fix)**: rebuildUnits()
  used to SkeletonUtils.clone every model on every structural rebuild (every
  move/kill/selection — deferred until tweens end, so it hitched exactly when
  each walk/spell animation finished). Now `_unitModelRigs` (three-renderer.js,
  unit id → {inner group, mixer, actions, materials}) re-parents the existing
  clone into the fresh wrapper; the mixer never stops, so clips carry through
  rebuilds seamlessly. Rig materials are flagged `_ew_shared` so `_disposeR`
  skips them; rigs are disposed on unit death (evicted in rebuildUnits), on
  `resetForNewMatch`, and on renderer dispose. Measured warm structural
  rebuild: ~3ms (probe: scratchpad probe kept the same mixer object across
  rebuilds over a 2-min live match, 0 re-clones, 0 page errors).
- **3D hologram x-ray (2026-07-06)**: model units now have the sprite-style
  occlusion silhouette — each model mesh gets a ghost twin (same geometry +
  same skeleton via `sil.bind(n.skeleton, n.bindMatrix)`) with a GreaterDepth
  ShaderMaterial (`_makeModelSilhouetteMaterial`, screen-space scanlines,
  blue own / red enemy, recolored on perspective swap in
  _updateEnemyConcealment via `entry.modelSilMats`). r128 `material.skinning`
  flag + stock skinning shader chunks.
- **Camera orbit no longer steers facing (2026-07-06)**: removed the
  battle.js snap() block that setUnitFacing'd the active unit to the camera
  yaw while orbiting — facing changes only on move/attack/cast now.
- Loading screen `LS_MAX_WAIT_MS` raised 12s → 45s (battle.js) — slow
  connections used to hit the cap and drop the screen while GLBs were still
  streaming (stutter + 2D placeholders in the opening seconds).
- Playtest harness note: in this sandbox `playtest.js` can hang on
  `waitUntil:'load'`; probes that work use `domcontentloaded` +
  `--proxy-server=direct:// --proxy-bypass-list=*` + executablePath
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (see probe_3d_wiring.js).
Races registered in `RACE_MODELS_3D` (sprites.js) render on the battle board as
skinned GLB models instead of extruded sprite slabs. Entries are built by
`_mk3d(folder, prefix, {slot: MeshyClipName}, opts)` — URLs are
`Races/<folder>/Meshy_AI_<prefix>_biped_Animation_<Clip>_withSkin.glb` (+
`..._biped_Character_output.glb` as the base model).
- ⚠ NO shared clip library (tried and reverted 2026-07): Meshy auto-rigs each
  character with a UNIQUE rest pose and clips bake absolute bone transforms —
  a clip only fits the character it was exported from; anything else =
  mangled mesh. Every race folder carries its OWN clip set next to its
  `..._Character_output.glb` (the rigged model; `_generate`/`_texture` GLBs
  are boneless — never wire them; the renderer renders rigless models static
  with a console warn).
- **Animation slots + spell categories (2026-07-05)**: clip slots are
  `idle / walk / jump / hit / death / cast / castMagic / castSupport /
  castRanged / castMelee / castThrow` (role guide comment above
  RACE_MODELS_3D in sprites.js). `classifySpellAnimKind(spell)` (sprites.js)
  buckets any spell → magic | support | ranged | melee | throw; battle.js
  triggerCastAnim stores it in `state._castAnimKind[unitId]`, and
  triggerAttackAnim stores melee/ranged (reach > 1 tile) in
  `state._attackAnimKind[unitId]`; the renderer's `_syncCombatAnims` resolves
  fallback chains (throw → castThrow → castRanged → cast; support →
  castSupport → castMagic → cast; everything ends at `cast`, then the old
  lunge/glow tween). Hit flashes also fire the `hit` flinch clip; jump tweens
  play `jump` (falls back walk → idle). One-shot slots = death, hit, cast*.
  Per-def time scales: moveTimeScale (walk), jumpTimeScale, hitTimeScale,
  castTimeScale (all cast*), deathTimeScale, idleTimeScale.
- **Meshy library clip durations (constant across characters)**: Walking
  1.07s, Running 0.67s, Regular_Jump 1.93s, Hit_Reaction(_1) 1.67s, Dead 3.0s
  (stays down — preferred death), Knock_Down 2.53s, Charged_Spell_Cast 2.7s,
  mage_soell_cast 2.3s (staff wave — castSupport),
  Cowboy_Quick_Draw_Shooting 7.33s (needs castTimeScale 5.0), Idle_N ~5–8s.
- **Wired characters (folder → Meshy prefix)** — every registry URL
  HEAD-verified live on R2 2026-07-05 (149/149 across 18 races):
  - fortune teller M → Homosapien/Male/harbinger → `male_fortune_teller` (NEW model; old `Fortune_teller_with_r` files were deleted from R2)
  - fortune teller F → Homosapien/Female/harbinger → `hot_attractive_fortun`
  - men in black F → Homosapien/Female/agent → `beautiful_attractive_` (trailing _ is real)
  - men in black M → Homosapien/Male/agent → `men_in_black_male_ag` (NEW model; no hit clip)
  - wizard/witch F → Homosapien/Female/blackmage → `young_female_witch`
  - mad scientist F → Homosapien/Female/engineer → `female_hot_asian_scie`
  - mad scientist M → Homosapien/Male/engineer → `mad_scientist`
  - cowboy F → Homosapien/Female/gunslinger → `hot_attractive_cowgir`
  - cowboy M → Homosapien/Male/gunslinger → `gunslinger_cowboy`
  - knight F → Homosapien/Female/knight → `hot_attractive_female` (castMelee=Thrust_Slash, cast=Triple_Combo_Attack; spare Idle_8)
  - pirate F → Homosapien/Female/pirate (duplicated in …/raider) → `hot_female_pirate` (Idle_6)
  - pirate M → Homosapien/Male/pirate (duplicated in …/raider) → `dashingly_handsome_sw` (hit=Face_Punch_Reaction, flintlock quick-draw)
  - homosapien/freelancer M → Homosapien/Male/freelancer → `normal_man` (no cast/hit clips; also the future werewolf DAY-form model)
  - telepath F → Homosapien/Female/psychic → `psychic_female_with_d` model + GENERIC `Meshy_AI_Animation_*` clip names (predates prefixed convention): Idle_4 / Running (2026-07-05) / Hit_Reaction (2026-07-05) / Charged_Spell_Cast / Knock_Down; spare Thoughtful_Walk
  - fairy F → Fairy/female → `young_fairy` (richest set; spare emotes Mirror_Viewing, Wave_for_Help_1)
  - bigfoot M → bigfoot/male → `bigfoot` (heightRatio 1.15)
  - grey M → grey/male → `grey_alien` (spare Idle_15)
  - quarterback → quarterback/ (no gender dir) → `football_quarterback` (Right_Hand_Sword_Slash = his THROW motion for castThrow/cast; Face_Punch_Reaction = hit; still NO death export → fade fallback)
  - atlantean F → atlantean/female → `hot_attractive_atlant` (idle = Swim_Idle)
  - werewolf M → Werewolf/male → `werewolf` (hit=Face_Punch_Reaction, castMelee=Right_Hand_Sword_Slash; spare Idle_11, Knock_Down)
  - catgirl F → catgirl/female → `young_female_catgirl` (jump=Backflip_Jump, castRanged=quick-draw @5.0, castMelee=Left_Hook_from_Guard @2.0 via castTimeScales; spare Right_Hand_Sword_Slash, Hit_Reaction)
  - ki fighter F → kifighter/female → `attractive_beautiful_` (trailing _; jump=Backflip_Jump, cast=Punch_Combo_5, castMelee=Kung_Fu_Punch, castMagic/castSupport=mage_soell_cast_3 — note the _3; spare Punch_Forward_…)
  - vampire F → vampire/female → `beautiful_attractive_` (same prompt as MIB F, different rig; castSupport=mage_soell_cast_1 — note the _1; bat-swarm form still particle-based, renderer skips models for it)
- **2026-07-06 additions (all URLs HEAD-verified + in-browser probed)**:
  - machine elves M → machineelves/male → `DMT_clockwork_elf` (cast/castMagic=Charged_Spell_Cast, castRanged=quick-draw @5.0 via castTimeScales, hit=Face_Punch_Reaction; heightRatio 0.72)
  - nordic M → Nordic/Male → `nordic_alien_male` (ONLY action export is quick-draw → wired to castRanged only so melee keeps the lunge tween; heightRatio 1.08)
  - annunaki M → annunaki/male → `annunaki` (cast/castRanged=quick-draw @5.0, castMagic=Charged @2.0, castSupport=mage_soell_cast_3 @2.0; no hit clip; heightRatio 1.35)
  - demon M → Demon/Male → `red_demon` (cast/castMagic=Charged; heightRatio 1.18). NO female demon model on R2 (probed) — the 3D-only gender rule hides her.
  - All four also have Walking + Knock_Down spares on R2. Prefix discovery: user provided the R2 dashboard listing for machineelves; the other three were found by HEAD-probe sweeps.
- **3D-ONLY ROSTER RULE (2026-07-06)**: matches are always 3D vs 3D.
  - sprites.js: `race3DGenders(race)` / `isRace3DReady(race)` helpers; `getAvailableGendersForRace()` now filters to genders that have a 3D model when the race has any (male wizard, female demon, female homosapien etc. are no longer offered anywhere — party builder, random picks, campaign gender rolls).
  - data.js `isUnitUnlocked()`: races with NO 3D model return false for everyone (before the account check, after `_DEV_UNLOCK_ALL`). Sprite-only races stay in ACCT_STARTER_UNITS ('marksman', 'priest') so they auto-unlock when models ship.
  - state.js: new `cpu3DRaceForJobSlot(job)` — CPU default-party slots swap non-3D archetype races (angel, seraphim, android, ai, orb of light…) for a 3D-ready same-job race; `randomizeIdentity()` pool pre-filtered to 3D-ready for BOTH players.
  - ui.js shop: non-3D vessels show "🔒 3D MODEL SOON", are excluded from the featured shelf, and `_shopBuy`/`_shopAskConfirm` refuse them (no wasted gold).
  - Campaign rosters are intentionally NOT race-gated (level-designed enemy pools), only gender-filtered.
- **Default unlocks (2026-07-06)**: ACCT_STARTER_UNITS (data.js + server.js copy — server copy also re-synced, it had drifted: was missing shaman/giant/halfdemon) now adds martian, machine elves, nordic, annunaki, demon. Martian is no longer intentionally locked.
- **Verification probe**: scratchpad probe_new_3d.js run 2026-07-06 — 36/37 (unlocks, gender filters, both default rosters + CPU randomize all 3D-ready, all 5 models attached with expected action sets, cast-kind triggers; the single fail was the probe's own hit-flash timing, wiring identical to passing races).
- **NOT wired (no model on R2 yet)**: male telepath, female demon.
- **Per-slot cast speeds**: `castTimeScales: {slot: scale}` on a registry
  entry overrides `castTimeScale` for individual cast slots (catgirl mixes a
  7.33s quick-draw @5.0 with a short hook @2.0).
- **R2 discovery technique**: the bucket (`ewmusicsfx`, public endpoint
  `pub-c56e…r2.dev`) has NO object listing (r2.dev 404s on '/'; Cloudflare
  MCP only does bucket-level ops; account has no workers). But HEAD per
  object works, and Meshy names are `Meshy_AI_<prompt trunc ≤21 chars>_biped_
  <stage>.glb` — so probe candidate prefixes against
  `_biped_Character_output.glb`, then sweep the clip-name list. That is how
  all 17 prefixes above were found.
- **Verification probe**: `node probe_3d_wiring.js` (repo; LOCAL_ASSETS
  harness) — starts a VS-CPU TDM, reassigns 8 live units to the new races,
  waits for GLBs, asserts attached models + expected action sets, fires
  cast-kind/hit triggers, checks classifySpellAnimKind + default unlocks.
  28/28 on 2026-07-05.
- **Default unlocks**: ACCT_STARTER_UNITS (data.js + the server.js copy) now
  also includes telepath, quarterback, ki fighter, cowboy, atlantean, pirate.
  Starters act as a FLOOR: server getOrBackfillEconomy unions new starters
  into existing accounts on read; profile.js backfillProfile does the same
  for offline/local profiles.
- Two slots may share one clip GLB (agent idle=walk): _attachUnitModel clones
  the clip so the actions get independent loop/timeScale settings.
- Gotcha: `Box3.setFromObject` LIES about skinned GLB size (Meshy geometry is
  authored at 1/100 with bones scaling ×100) — `_skinnedBBox` measures via
  boneTransform(); naive h=0.017 vs real h=1.70.
- Verifying a GLB from the shell (rigged? clips? same-rig?): parse the JSON
  chunk — `buf.readUInt32LE(12)` = JSON length at offset 20; check `skins`
  (must be ≥1), `animations[0]` name/duration, and compare `nodes[].translation`
  between a clip GLB and the character's Character_output (must be ~0 diff).
- Loader/mixer/state machine live in three-renderer.js (`_loadUnitGLB`,
  `_attachUnitModel`, `_updateUnitModels`). State priority: death (Knock_Down,
  clamped + fade, 1600ms) > cast one-shot (also plays for basic attacks) >
  locomotion (walk clip at `moveTimeScale` while any walk/displace/jump/strike
  tween is live) > idle. Idle time persists across rebuilds (`_modelAnimState`).
- The 2D sprite slab still builds FIRST as a loading placeholder and is swapped
  out when the GLB arrives (synchronous once cached); it remains the fallback
  (and the ghost-preview art). `window.EW_DISABLE_3D_UNITS = true` forces
  sprites for A/B.
- Model is normalized to tile height (`heightRatio` 1.0 = same size as the
  128px sprite units), wrapped in an `_ew_facingSprite` group so the gameplay
  facing pass yaws it, with an invisible pick pillar for reliable clicks
  (skinned raycasts hit the bind pose). Materials rebuilt as Lambert +
  emissiveMap self-glow → hit flashes / AP-grey / night glow / cloak all work.
- `THREE.SkeletonUtils` (new index.html script tag) clones the rig per unit.
- HUD portraits: `RACE_PORTRAITS`/`getUnitPortraitUrl` (sprites.js) → hud.js
  `UnitSprite` prefers the 128×128 `portrait.png` (cover/center) everywhere
  (active-unit panel, turn-clock flanks, lists).
- Verified locally via `USE_ASSET_CACHE=1 LOCAL_ASSETS=sprites.js,three-renderer.js,hud.js`
  (asset_cache.js serves repo-local copies): SkinnedMesh replaces the sprite
  billboards in-scene, idle bones animate, walk move accepted, HUD portrait
  renders, zero page errors. NOTE for tests: `state.castAnimIds` & co are
  Sets, not arrays (`.add`, not `.push`).

## Menu flow to start a VS-CPU match (no auto-sim — drive the real UI)
1. `window._goToVsCpu()` → opens Mode Select (sets controllers {1:'local', 2:'ai'},
   parties auto-filled 4v4). Does NOT start a match.
2. Click the `.ms-mode-card` whose text matches the mode → then `.ms-btn-primary`
   (CONFIRM) → goes to Party Builder.
3. Click `.pb-btn-primary` ("SEAL YOUR FATE"). NOTE: two-stage — it LOCKS the team
   first, then STARTS on a second press (`doStart` only calls `startMatch()` once
   `state.teamLockedIn` is true). Harness clicks up to 2x, else forces
   `applyPartyBuild(false); state.teamLockedIn = true; startMatch()`.
4. After battle begins, re-assert `state.controllers = {1:'local', 2:'ai'}`.

## The live state + API (everything you need to play)
`window.GAME` exposes a live game object. `window.GAME.state` is the full state.
- Turn model = **blitz**: one unit acts at a time, id in `state._blitzActiveUnitId`.
  The engine auto-advances after each unit and **auto-plays AI (P2) units**; when a
  P1 (`controllers[1]==='local'`) unit is active it WAITS for input — that's our cue.
- Read state: `state.phase` ('setup'|'battle'), `state.winner` (1/2/0/null),
  `state.round`, `state.units` (each: id, player, name, cls, hp, maxHp, x, y, z, ap,
  mp, dead, spells[]), `state.matchKills` (TDM/FFA score — NOT `matchScores`, which
  stays 0 in TDM), `state.logEntries` / `state._fullLogEntries` (combat log).
- Act on the active unit (all on `GAME`):
  - `getMoveTiles(unit)` → [{x,y,z,cost}] reachable tiles (the orange highlight).
  - `doMove(unit,x,y,z)` → returns false / logs "Invalid move." if tile not in a
    freshly computed getMoveTiles.
  - `getAttackTiles(unit)` → [{x,y}] in basic-attack range. `unitAt(x,y,z)` → unit there.
  - `doAttack(unit,x,y,z)`.
  - Spells: set `state.selectedTool = spell.name` then `doSpell(unit,x,y,z)`.
    `getSpellRangeTiles(unit,spell)` = castable tiles; `canAffordSpell(unit,spell)`
    checks AP+tier; also require `unit.mp >= spell.cost`. Damage kinds: damage,
    ricochet, multiHit, aoe, barrage, lifeDrain, line, linePush, cross, aoePull,
    splitBeam, displacement, pull, dash, sky*, leapStrike. Heal kinds: heal/healAll/selfHeal.
- End a unit's turn: set `unit.ap = 0` then `window.endUnitIfDone(unit)`
  (engine then advances; AI units auto-play, next P1 unit waits).
- Useful globals: `window.maybeTriggerComputerTurn()`, `maybeAdvanceTurn()`,
  `getActiveMultiplayerMode()` (has `.id`, `.roundLimit`), `_goToVsCpu`,
  `applyPartyBuild`, `startMatch`.
- `setDevAutoSim(true)` / `toggleDevAutoSim()` = AI-vs-AI auto-play. Do NOT use for
  playtesting — the user wants Claude to actually play P1.

## Board / map selection (IMPORTANT — board size is a CHOICE, not forced)
The mode-select screen has **map cards** `.ms-map-card`, separate from the mode
cards. Each card's text is like `Outpost 8×8 PRESET 4 SPAWNS`. Click one to set the
board. Sizes: 4×4 (Apartment), **8×8** (Outpost/Suburb/Bunker), 10×10, 12×12 (the
default if you don't pick), 16×16. For fast, decisive 4v4 pick an **8×8 4-SPAWNS**
card. Flow: `_goToVsCpu()` → click `.ms-map-card` (8×8) → click `.ms-mode-card`
(mode) → CONFIRM → seal → start. (CONFIG.boardSize overrides do NOT work — must click.)

## Type chart / damage (job-independent)
Effectiveness = **spell type vs target's `unit.types[]`**, NOT class/job. Spell types:
human, divine, alien, unholy, anomaly, tech, earth (`spell.spellType`). The engine
exposes **`window.getTypeDamageMultiplier(source, target, spellType)`** → call it
directly to score moves. Multiplier = effectMult × stabMult: strong **×1.30**, neutral
×1.0, weak **×0.75**; STAB **×1.25** if `source.types` includes the spellType. So
super-effective is only +30% — **focus fire matters far more than type-chasing.**

## Arena mode mechanics (multi-objective, scores via a COMPOSITE) — REWORKED 2026-07-06
Instant wins: enemy tower destroyed, wipeout, all hourglasses carried, or **NEXUS
DOMINANCE — own all 3 nexus zones simultaneously** (checkWin, only on maps with ≥3
zones). Otherwise **composite score** at the round limit (15). Weights live in ONE
place now: **`window.ARENA_PTS`** (data.js, next to the NEXUS_ constants) — kill 15,
tower dmg 1/10HP **capped at 150 pts**, hourglass 35, nexus-control round 6. Nexus
control accrual **doubles in the last 5 rounds** ("⬡ NEXUS SURGE", tickMatchClock) —
the comeback lever. Tower poking can no longer outscore objective play.
- **Nexus zones** spawn on a **diagonal line**: `earth` (Central) always dead-center,
  `nw` + `se` toward opposite corners (all 3 map.js placement paths; keys are generic
  now — NEVER hardcode earth/above/below; iterate `Object.keys(state.nexusPoints)`;
  display names in `window.NEXUS_LABELS`).
- **Capture = presence** (processNexusIncome, round end): only-your-team standing in
  a zone ticks progress +1 (2+ units: +2) toward you; standing in an enemy zone
  neutralizes it first. Both teams in zone = CONTESTED (frozen, no gold). Empty
  unclaimed zone decays 1/round toward 0. **`channelNexus(unit)` (1 AP)** still adds
  +1 tick — the active accelerant. Threshold ±6. Shared capture bookkeeping (banners,
  scoring, dominance threat/win, sudden-death win) = `_nexusCaptureBookkeeping` (ui.js).
- Scoreboard shows per-zone ownership pips (⬢/⬡) + a pulsing "P# NEEDS 1 NEXUS!"
  alert at 2-of-3. Capture banner + "⬡ NEXUS THREAT!" at 2/3.
- **Sudden death** (tied composite): next kill, hourglass pickup, or nexus capture wins.
- **Hourglasses restock ONCE at round 10** (was every 10th round — round 20 in sudden
  death used to re-fire the "⏳ materialized" toast).
- **AI**: arena now has first-class nexus goals in pickMoveGoal (`arena_nexus`, and
  `arena_nexus_deny` score-75 sprint when the enemy holds all-but-one) + a +25 arena
  channel bonus (+45 for the winning zone, +30 to break enemy 2/3) in scoreNexusChannel.
- **GOTCHA:** Arena `state.matchScores` stays 0-0 — the real result is the composite,
  logged at end as `P1: NNN pts — K kills (..), tower dmg (..), nexus rounds (..)`.

## Gravestones + revive (2026-07-06)
- Dead units leave tile props (three-renderer.js, built in rebuildDeployables, keyed
  `grave_<unitId>`, hashed into `_computeDeployableSerial` → auto appear/vanish on
  death/revive/respawn): **enemy dead = bone pile** (enamel.png-textured bones+skull),
  **your dead = rock.png headstone with flower.png/flower_2-4.png cross billboards**.
  Friend/enemy = relative to `getViewerPlayer()`. Kill-switch:
  `window.EW_DISABLE_GRAVESTONES = true`.
- **Loot**: ending a move on an ENEMY corpse auto-loots its items (finishMoveAt);
  ally corpses keep gear for revive (scan-loot still works on both).
- **Revive fixed**: `hasSpellTargetInRange` now checks range + `reviveLocked` (used to
  light up if ANY dead ally existed anywhere); `_getSpellValidTargets` now includes
  dead allies for revive-kind spells so fallen allies highlight as targets.

## Smart playtest agents (USE THESE — don't replay "hit closest enemy")
- `playtest_smart.js` — TDM on 8×8 with real tactics: **focus-fires the lowest-HP
  reachable enemy, SECURES KILLS, prioritizes enemy healers, type-aware via
  getTypeDamageMultiplier, White Mage revives/heals.** Result: 5–0 wipeout in 3 rounds.
- `playtest_arena.js` — Arena variant: same core + dedicates the closest unit to
  channel the Nexus + pressures the enemy tower. Result: composite **324–69**.
- `playtest_custom.js` — fills all 8 spell slots but plays the dumb base tactics
  (kept for comparison; it 0–0 stalemated). Lesson: **the dumb "weakest-in-range"
  loop spreads chip damage and never kills — always focus-fire + secure kills.**
- All build full 8-slot loadouts via `getEligibleSpellsForClass(cls)` (native ≈5) +
  a random secondary job + damage fillers, applied as a post-start `unit.spells`
  override (pre-seal `state.loadouts` mutation can wedge `startMatch` — don't).

## Environment gotchas (cost a lot of time once)
- **R2 throttling:** each chromium cold-start re-downloads ~35 scripts; after ~15+
  launches the page load slows to minutes. Minimize browser launches; do all probing
  in as few runs as possible. "Stuck at Game loaded" is usually just slow loading.
- **Heavy-DOM evaluates HANG:** `document.body.innerHTML`, `innerText`, and
  `querySelectorAll('*')` force reflow on the 3D board and never return. Use
  `textContent` on bounded selectors, or read JS globals, or one element's `outerHTML`.
- **Screenshots** time out on the software-WebGL renderer; use `timeout` +
  `animations:'disabled'` and treat failures as non-fatal.
- Render bugs seen mid-combat: `hpBar is not defined`, `Cannot read properties of
  null (reading 'accMs')` — animation/render path, worth chasing.
- **Chromium can't reach localhost:3000 in the remote-agent sandbox** (proxy
  autodetect eats it): launch with `--proxy-server=direct:// --proxy-bypass-list=*`
  (external R2/CDN still load — TLS interception is transparent; keep
  `ignoreHTTPSErrors:true`). Playwright's bundled browser may be absent; pass
  `executablePath` from `ls /opt/pw-browsers/` (e.g. `chromium-1194/chrome-linux/chrome`).
- **Testing LOCAL script edits** (game loads everything from R2): intercept in
  Playwright — `page.route('**/three-renderer.js*', r => r.fulfill({ contentType:
  'application/javascript', body: fs.readFileSync('three-renderer.js','utf8') }))`
  before `page.goto`. Works for any of the ~35 R2 scripts.
- **Top-level `const` globals (`ThreeRenderer`, `ThreeCamera`, `camera`, `CONFIG`)
  are NOT on `window`** — in `page.evaluate` use the bare identifier (guard with
  `typeof X !== 'undefined'`), not `window.X`.
- **Camera close-ups for screenshots:** `camera.x/y` are TILE coords of the focal
  point (sync() multiplies by tileSize). Set `x/y/zoom/tilt/yaw` AND their `_t*` +
  `_smooth*` twins, wait ~1s, then screenshot.

## Real-time unit rotation + facing-free follow-up (2026-07-05) — battle.js, three-renderer.js
- **Units now visibly rotate** instead of snapping: `_updateUnitFacing` in
  three-renderer.js rate-limits the slab/wedge yaw to `UNIT_TURN_RATE`
  (4π rad/s ≈ 180° in 0.25s, shortest arc, real-time — independent of game
  speed). New/rebuilt entries (spawn, attack-sprite swap) snap via
  `g._ew_facingYaw == null` so units never pirouette on spawn. The pivot
  always finishes inside the pre-attack camera hold, so strike anims start
  on a squared-up unit.
- **Action cam turn start faces with the unit**: `getTurnStartCamYaw(unit,
  fallback)` (battle.js, next to `getUnitFacing`) returns
  `atan2(-f.dx, -f.dy)` degrees when `state.cinematicActionCam` is on; all
  four activation pans (AI + REMOTE in `_continueBlitzWithUnit_impl`, auto +
  human branches in `selectUnit`) route their `_retYaw` through it. With the
  toggle off, behavior is unchanged (resting/pre-cine yaw).
- **Follow-up is now purely positional** (user request: facing must NOT
  matter). Ally on the exact mirror tile of a melee attack → always a free
  strike: trigger no longer requires the initial swing to land (`!evaded`
  removed — the target is still pinned), the flanker's strike can't be
  dodged, and the facing-arc damage mult is gone (flat `atk*0.4 + rand`).
  The flanker turns first, then leaps on an `actionMs(280)` beat.

## Buff/debuff rebalance — DEF/MDEF + ATK/INT axis split (2026-07-05) — data.js, battle.js, state.js, ui.js, ai.js, three-renderer.js
Spells predating the DEF/MDEF split were rebalanced so every stat axis has a
roughly equal buff/debuff roster (Pokemon/SMT-style). Key engine facts:
- **Stat stages now include `mdef`** (`STAT_STAGE_STEP = {atk:14, def:9, mdef:9,
  spd:3, int:12}`, cap ±5, 3-turn `statUp`/`statDown` carriers). Spells apply
  them via `statStageBoost: {mdef: -2}` etc. — works on kinds `buff`, `debuff`,
  `healAll` (whole team), `warCry` (aura).
- **Axis split**: status `armorDelta` + DEF stages soak PHYSICAL damage only;
  status `mdefDelta` + MDEF stages soak MAGIC only (`getEffectiveArmor`).
  `atkDelta` + ATK stages boost physical damage only; `intDelta` + INT stages
  boost magic damage only (`getEffectiveAttackBonus(unit, 'magic'|'physical')`,
  applied in `applyDamageToUnit` by damageType). Env/faction/streak bonuses and
  gear armor stay universal. `guarding` now carries both armorDelta+mdefDelta.
- **Repurposed spells (same ids, new behavior)**: `shieldBash`→**Phalanx**
  (Warrior team-wide +1 DEF, kind healAll heal:0), `radiantBolt`→**Veil of
  Light** (White Mage team-wide +1 MDEF), `taser`→**Neuralyzer** (Agent, -2 INT),
  `psychosis`→ pure -2 MDEF debuff (Psychic), `sonicCharge`→**Harmonize**
  (Harbinger ally +2 INT), `mark1`→**Suppressing Fire** (Agent/Sniper -2 ATK).
  New spells: `tinFoilHat` (Engineer ally +2 MDEF), `darkPact` (Black Mage self
  +2 INT). `lullaby` also applies new `drowsy` status (stageMod {int:-1});
  `fiveGTower` aura is now MDEF-only (-8, magic branch of getEffectiveArmor).
- **healAll with heal:0** logs "bolstering N allies"; AI scores team stat buffs
  in ai.js healAll branch (skips recast while caster has statUp). Nameplates
  (three-renderer.js) now show INT±/MDEF± badges next to ATK/DEF/MOV.
- Verified in-browser via LOCAL_ASSETS harness: stage deltas hit the right axis
  only (+18 magic / 0 phys etc.), Phalanx bolsters whole team, Psychosis lands
  -2 MDEF through the real doSpell path, no page errors during AI soak.
- NOTE: spell `cost` fields are auto-normalized at load (a balance pass over
  SPELL_LIBRARY recomputes MP costs from a power formula ~data.js:7065), so the
  authored `cost:` is a suggestion, not the live number.

## Online-experience pass (2026-07-03) — online.js, battle.js, ui.js, index.html, server.js
Four upgrades verified end-to-end with a two-browser probe (29/29) + a two-socket
server test (21/21). Client files → R2: **online.js, battle.js, ui.js**;
**index.html + server.js are served by the Node server** → redeploy those there.
- **Reconnect banner (non-blocking):** `_showReconnectOverlay` in online.js is now a
  top-center pill (pointer-events:none) instead of the old full-screen blackout —
  the board stays visible during the 90s window. Showing it calls
  `window._pauseShotClock()`, hiding calls `_resumeShotClock()` (battle.js —
  resume shifts `startedAt` by the paused span). Exposed:
  `window._ewHideReconnectBanner`.
- **Shot clock actually works now (online-only):** `_shotClockExpired` compared
  `ctrl !== CTRL.HUMAN` but CTRL has no HUMAN key → it NEVER fired. Now gated
  `ctrl === CTRL.LOCAL && isOnlineMatch()` (single-player unaffected), and expiry
  routes through `triggerEndTurn()` so a guest EMITS the end-turn instead of
  desyncing its local copy. New self-contained countdown pill
  (`_renderShotClockPill`, battle.js, `#shotClockPill`) appears under the top bar
  when ≤15s remain, red ≤5s, ⏸ while paused. `state.shotClock.pausedAt` is the
  pause flag; the 1s `_matchClockInterval` tick drives everything.
- **Guest latency-hiding feedback:** `_guestActionFeedback(kind, unit, x, y)`
  (online.js) fires instant LOCAL cosmetics on every guest emit — attack/combo:
  `triggerAttackAnim` + basicAttack sfx; spell: `triggerCastAnim` + spellDamage
  (or buff for support kinds); move/jump: moveStep sfx + a team-tinted
  `ThreeRenderer.showGhostUnit(..., {tag:'netPending'})` hologram at the
  destination (cleared in `_applyRemoteState` when the authoritative sync lands);
  item: itemThrow. Wired into all guest engine-wrapper emits AND the clickTile
  confirm/move branches (move ghost only for tiles `getMoveTiles` accepts).
  Damage numbers still arrive only with the host relay — feedback ≠ prediction.
  GOTCHA: `window.GAME.doAttack` etc. are STALE pre-wrap snapshots; the real UI
  (and any probe) must call the bare globals (`window.doAttack`) to hit the
  online wrappers.
- **Post-match Main Menu:** new `#mainMenuBtn` on the result overlay (index.html
  + `_restoreResultOverlayButtons` in battle.js), wired late-bound in ui.js →
  `backToMainMenu()` (battle.js): backToPartyBuilder-style cleanup, then
  `transitionTo(GS.MAIN_MENU)` + `_showTitlePage('mainMenuPage')`. online.js
  wraps it: socket.disconnect + NET/controller reset + sessionStorage rejoin
  cleanup, so ONLINE_RULES.active goes false before the menu rebuilds. The
  server closes the room as a **post-match departure** (`postMatch:true` on
  player-disconnected) and the remaining client keeps its result screen (no
  forced reload); a late match-forfeit is ignored when `state.winner` is set.
- **server.js relay hardening + replays** (deploy server-side, no R2):
  direction enforcement (game-action must come from the room's GUEST socket,
  state-sync from the HOST — spoofed side dropped + `[GUARD]` logged);
  turn-ownership gating (server tracks `activePlayer` from host syncs; mutating
  guest actions — clickTile/engine/triggerEndTurn/useRosterItem/recall — are
  dropped while it isn't P2's turn; selectUnit/setTool/forfeit always pass);
  per-socket token-bucket rate limits (game-action 12/s burst 30, state-sync
  30/60, relay 60/120); JSONL replay per started match in `./replays/`
  (header + party-configs + full guest action stream + battle-start baseline
  snapshot + 60s periodic + final state + end record; ~20k-event cap). Rematch
  (winner→null sync) re-arms forfeit + `_resultProcessed` (fixes rematch ELO
  never processing) and starts a new replay segment. Scratchpad probes:
  `server_test.js` (socket.io-client) + `probe_online_ux.js` (2-browser).

## 3D unit sprites — extruded slab shells (2026-07-02, three-renderer.js)
Unit billboards are now REAL 3D and lit. `_buildUnitEntry` keeps the flat plane as
the FRONT cap (material switched MeshBasic→MeshLambert so sun/hemi/point lights
shade units) and `_attachSpriteShell` parents a generated shell to it: back cap at
z=−depth + side walls traced from the sprite's alpha silhouette (merged per straight
run, UVs sample the boundary pixel → rim carries edge colours). Depth =
`UNIT_SPRITE_DEPTH_PX` (8 native px since the 2026-07-02 facing update — was 10,
briefly 5; const at top; 0 reverts to flat). Geometry
cached per URL in `_spriteShellGeoCache`; built async via canvas `getImageData`
(tainted canvas → silently stays flat). The shell SHARES the plane's material, so
hit flashes / AP grey / cloak opacity / texture swaps all apply for free; it's
`_ew_shadowFlagged` (no cast/receive — the sun-facing shadow proxy still does unit
shadows, and receiving would self-shadow). Sheet anims (`_maybeStartSpriteAnim`)
hide the shell (idle-baked silhouette would clip extended limbs) and restore it in
`_endSpriteAnim`. Verified in-game: 8/8 units shelled (~400–2k tris), no console
errors; edge-on debug (kill `_ew_billboard`, yaw the sprite) shows the slab rim.

## Terrain × spell reactions (2026-06-30) — natural map interactions
New system in `battle.js`, all keyed off the **terrain a spell strikes** (NOT a full
elemental type chart). A spell's "element" is detected by a lightweight name/id
keyword classifier — `classifySpellElement(spell)` → `'lightning'|'fire'|'cold'|null`
(keyword tables `_ELEMENT_KEYWORDS` at the top of the block, ~battle.js:1600). A spell
can also set `element:'lightning'|'fire'|'cold'` to opt in explicitly. The `\b…`
word-boundary regex avoids false positives (e.g. *Sacrifice*/*Justice* don't read as
ice; *Sunburn* doesn't read as fire). Four reactions:
- **⚡ Lightning + water → conduction** (`_reactLightningWater`): flood-fills the
  connected `water`/`deep_water` body from the struck tile (cap 80) and deals a
  conduction tick (~50% of `spell.dmg`, min 40) to EVERY unit standing in it —
  friend or foe — except the caster and the already-hit origin-tile unit. Airborne
  units are spared. This is the "AOE for the whole body of water" the design asked for.
- **❄️ Frost + water → flash-freeze** (`_reactColdWater`): converts the connected
  water body to `ice` terrain (slippery; clears `drowning`; stops conducting
  lightning — natural counterplay) and `stun`s (1 turn) units caught in it.
- **🔥 Fire + forest → wildfire** (`_reactFireForest`): flood-fills connected forest
  (`tree`/`forest` terrain or `tree*` objects, cap 40), burns it down to `scorched`
  terrain (removes tree cover → changes LOS/pathing, so it calls `_invalidateBoardGrid`),
  and applies `burn` (2) to units in the blaze.
- **🔥💧 Fire + ice → melt** (`_reactFireIce`): a fire spell on `ice` thaws the
  connected ice sheet back to shallow `water` (cap 80) — the natural reverse of the
  frost freeze, and it re-arms the pool for lightning conduction. Completes the cycle:
  frost(water→ice) → fire(ice→water) → lightning(conduct water).
- **🌋 Knockback into hazards** (`_applyKnockbackHazard`, element-agnostic): when a
  push/pull/grab/fling lands a unit on `lava` (→ `lava_burn` + 60 sizzle) or
  `deep_water` (→ `drowning` + 36), the hazard bites IMMEDIATELY instead of waiting
  for end of round. Flyers / lava- or water-adapted units are immune.

Wiring: the damage reactions fire from the shared damage resolvers — `_applyDamageSpellHit`
(single + chain), `_applyAoeDamage` (aoe/cross/aoePull), `_applyLineDamage` (line/linePush),
`_applyMultiHitDamage` — each calls `triggerTerrainSpellReaction(unit, spell, tiles)` with
the tiles it struck (deduped per connected body). The knockback hazard is called at the
displacement sites (`_applyKnockbackHazard(target)`) right after the logical move — NOT in
`animateDisplacement`, which early-returns when visuals are skipped (AI/auto-sim) and would
miss the gameplay effect. **All edits are in `battle.js` only** (no data.js/terrain changes
needed — `ice`/`scorched` terrain, `burn`/`stun`/`lava_burn`/`drowning` statuses already
exist). To live, `battle.js` must be re-uploaded to the R2 bucket. To add more lightning/
fire/cold spells, no code change is needed — name them with a matching keyword, or set
`element:`.

## Buildings 2.0 — visibility fix, HP/siege, Enter-Building lift (2026-07-02)
Touches `map.js`, `battle.js`, `state.js`, `three-renderer.js`, `hud.js`, `data.js`,
`ai.js` (all must go to R2 together).

**Fog visibility fix** (the "building invisible while I stand in front of it" bug):
a 2×2 building renders as ONE prism keyed to its NW anchor tile, and vision to that
tile was blocked by the building's own body → whole prism hidden from most angles.
Fixes: (a) `map.js` LOS (`_isRayBlocked3D` + 2D fallback) — a building never occludes
*itself*: body-blocks belonging to the same footprint as the ray's target tile are
skipped (`buildingAnchorAt`/`sameBuildingTile`/`buildingFootprintTiles` helpers near
`getObjectRule`); (b) `three-renderer.js` — prisms are tagged `_ew_isBuilding` and
shown when ANY footprint tile or a tile in the 1-ring around it is visible
(`_bldgVisibleInFog`), with their own fade records (`_updateBuildingFogReveal`)
decoupled from the anchor tile's fade. Footprint `_fp` shadow-stamping now also runs
for custom-editor maps (`_stampBuildingFootprints`).

**Structure HP (like siege turrets, in HITS)**: every roofWalkable 2×2 building gets
`state.buildings` record `{id:'bldg_x_y', x, y, key, hp:6, maxHp:6}` (lazy
`ensureBuildingsInit()`; map.js nulls `state.buildings` on board build). Basic attack
= 1 hit (also listed in `_getAttackValidTargets` kind:'building' + tile-menu "Attack
Building" + lights the Attack button via `getActionPanelCache`), single-target spell
= 1, AOE spell = 2 (deduped per cast), meteor/nuke-class = instant demolish
(`demolishesBuildings:true` on meteor/nuke/SHARED_NUKE in data.js, plus heuristic
`terrainDeform && dmg>=150`; delayed nukes handled in state.js
`_detonateDelayedSpell`). Collapse (`destroyBuilding`): all 4 object cells cleared,
terrain → random `rubble_1..4`, `ruins` object on the anchor; roof units fall
(`max(12, drop*8)` ignoreArmor), a unit INSIDE takes 12+36 crush; prism darkens as hp
drops (rebuildObjects tint). Constants at top of battle.js: `BUILDING_MAX_HITS=6`,
`BUILDING_COLLAPSE_MIN_DMG=12`, `BUILDING_CRUSH_BONUS_DMG=36`.

**Roofs are lift-only now**: the old "anyone can step/jump onto a 2-high roof"
bypass is removed from `getMoveTiles`, the path executor, and `getJumpTiles`
(ai.js pathing mirrored). Rising onto a roofWalkable roof is only possible when the
rise ≤ `MAX_CLIMB_HEIGHT` (1) — i.e. from equal-height terrain. Otherwise use
**🛗 Enter Building**: offered in the More menu and the building tile's action menu
when a ground unit stands adjacent (Chebyshev 1) to a living building with an empty
lift (capacity 1). Entering costs the rest of the turn; while inside the unit is
hidden + untargetable (`unitAt`/`unitAt3D`/`unitsAtColumn` skip
`_insideBuildingId`, renderer hides sprite+plate) but takes the crush if the
building is destroyed. At its next turn start (`_continueBlitzWithUnit_impl` →
`processBuildingEmerge`) it emerges on a free roof tile and acts normally; if the
roof is packed it waits inside (turn skipped). Flyers still land on roofs from the air.

**GAME API**: `getBuildingAt(x,y)`, `buildingDisplayName(b)`, `damageBuildingAt(x,y,
hits,unit)`, `destroyBuilding(b,unit)`, `getEnterableBuilding(unit)` →
`{building, doorTile}`, `doEnterBuilding(unit)`, `ensureBuildingsInit()`. Verified
20/20 scripted checks on Compound (VS-CPU, local-file route interception): fog
anchor/footprint visibility, no walk/jump onto roofs, enter→hidden→emerge-on-roof,
5 hits →1hp → 6th collapses → rubble + ruins, roof fall 24 vs inside crush 48,
meteor/nuke demolish; AI auto-sim advanced rounds with 0 page errors.

## Move-highlight UX rework: colors, AP accuracy, hover previews (2026-07-04) — battle.js, ui.js, three-renderer.js
User asks: simpler/intuitive move colors (kill the striped orange "exposed"
border), accurate AP pips (2-dot tiles showed with only 1 AP after a spell;
some 1-AP jump/move tiles refused the click), enemy range on hover instead,
and a hover path-arrow + destination hologram. **All 3 files → R2 together.**
- **Color system now (three-renderer HL_COLORS + _getSharedHlMat):** blue
  `0x4da6ff` = walkable (pips = AP: 1 or 2; plain 2-AP tiles recede at 0.34
  opacity vs 0.5), teal = jump/takeoff, gold ' strike', crimson ' hazard',
  green ' benefit'. The ' slow' (steel) tint and the whole hatched ' exposed'
  shader path (uExposed uniform + stripe GLSL) were REMOVED — ui.js no longer
  computes the enemy threat field per move tile.
- **AP-accuracy bugs (the real causes):** (1) ring-2 "2-pip" highlighting and
  the 2-AP walk+walk executor were gated ONLY on movesThisTurn — never on
  having 2 AP — and `spendAP` clamps at 0, so with 1 AP the game showed AND
  executed double moves. Gated now in ui.js `_canMove2`, ui.js WASD
  `_initWasdState`, battle.js clickTile (`ap >= AP_COST_ACTION*2`). (2) In
  clickTile move-mode the 2-AP walk+walk search ran BEFORE the standalone
  1-AP jump check, so a 1-pip jump tile could be consumed as a 2-AP double
  walk; and the jump branch passed the raw clicked z to doJump, whose exact-z
  legality check rejects a different surface of the same column ("Invalid
  jump target"). Jump now resolves before the 2-AP fallback with z picked
  from getJumpTiles (nearest to clicked z). (3) STUCK-INPUT TRAP: doMove /
  doJump returning false did NOT reset `state._actionExecuting` on the early
  clickTile returns → one failed click silently locked ALL input (no
  watchdog on that path). Move-mode returns are wrapped in `_execMove` now.
  The 2-AP intermediate scan also skips `_jump/_takeoff` legs (matches the
  ring-2 highlight, which always did).
- **Enemy range on hover/click (battle.js `updateEnemyRangePreview`):**
  hovering an enemy sprite — or click-pinning one (quick-action menu,
  `_enemyActionTargetId`) — paints an 'enemyRange' overlay: bright red 0.5 =
  getAttackTiles (real LOS) from where it stands, faint red 0.22 = danger
  zone (Manhattan attack diamond from every getMoveTiles destination).
  Driven by `_syncEnemyRangePreview` in three-renderer's renderFrame — a
  per-frame SIGNATURE check (hovered id + pinned id + target x,y,z,hp) so
  every set/clear site of `_enemyActionTargetId` is covered without hooks;
  it also drops a stale move-hover arrow if actionMode changed under it.
  Fog: preview refuses enemies outside computeVisibleTiles(viewer) — probes
  must set `state.fogOfWar=false` (or pick a visible enemy) before asserting.
- **Move/Jump hover preview (battle.js `_updateMoveHoverPreview`):** wired in
  updateHoveredTarget (move/jump modes return early with a preview instead of
  confirm-target logic). Reachable tile → `drawPathArrow3D` through the REAL
  `findMovePath` waypoints (gold walk / teal jump legs) + `showGhostUnit`
  caster hologram + 'moveHoverDest' tile mark; standalone jump tile → arced
  teal `drawArrow3D`; 2-AP tile → combined path1+path2 arrow through the
  cheapest intermediate (mirrors the executor). Dedups on
  `state._moveHoverKey`; cleared in clearHoveredTarget, setActionMode,
  and the renderFrame sync above.
- **Verified** via scratchpad `verify_move_ux.js` (LOCAL_ASSETS=battle.js,
  ui.js,three-renderer.js): 17/17 — ring2 hidden at 1 AP / shown at 3 AP, no
  exposed/slow tokens, 2-AP click refused at 1 AP without sticking input,
  jump-only click lands as a 1-AP jump (movesThisTurn untouched), hover
  preview draws + clears (incl. stale-mode leak guard), enemy range paints on
  API call AND on real synthesized mousemove, 0 page/shader errors. Probe
  gotchas: page has FIVE canvases — dispatch synthetic mousemove to all of
  them; the blitz/AI heartbeat resets `state.actionMode` between separate
  page.evaluate calls, so assert selection+mode INSIDE the same evaluate.

## 3D collision + airborne targeting fixes (2026-07-03) — battle.js, hud.js, ai.js, three-renderer.js, three-camera.js
User bugs: (1) units ending up on the SAME tile + SAME elevation; (2) targeting an
airborne unit always hit the unit standing beneath it. Root causes + fixes (all 5
files must go to R2 together):
- **Air targeting, the big one:** `_resolveOffensiveTarget` (battle.js ~1470) — the
  shared resolver for ALL offensive spells — ignored its `z` arg and used
  `unitAt(x,y)`, whose column fallback PREFERS THE GROUND UNIT (map.js ~2117). Now
  exact-z first: `unitAt(x,y,z) || unitAt(x,y)`. (Basic attack already honored z;
  every other single-target kind already used the `||` pattern — this one was missed.)
- **Target submenu:** `selectTargetFromMenu(x,y)` executed with the STALE
  `state._clickedZ` of the last board click → picking a flyer's row hit the ground
  unit. Now takes an optional `z` (hud.js rows pass `t.unit.z`), stores it in
  `pendingTarget.z`, and passes it to doAttack/doSpell. Missing z acts as a wildcard
  in the confirm-compare so the hover→row-click flow still confirms in one click.
- **Pixel-accurate picking:** unit sprite quads are mostly transparent padding and
  raycast as solid rectangles, so one unit's invisible corner could eat a click
  aimed at the unit above/behind. `screenToUnit` (three-camera.js) now skips hits
  whose sampled texel is transparent via `_ew_alphaPickTest` closures attached in
  three-renderer (`_makeAlphaPickTest`, per-URL ImageData cache `_spritePickAlphaCache`;
  tainted canvas or sheet-anim map swap → falls back to solid quad). Attached to the
  sprite plane, the x-ray silhouette, and the shell (walls sample opaque texels).
- **Stacking:** `getMoveTiles` airborne branch had `_blocked = _isAirborne ? false :
  !!_occupant` — a FRIENDLY flyer at the destination's exact z didn't block, so two
  same-team flyers at equal clearance could stack. Now any occupant at the exact z
  blocks (pass-through unchanged). The inline two-step move in `clickTile`
  (~battle.js 17890) committed `actingUnit.x/y/z = destZ` with NO final occupancy
  check (ring-2 tile match is z-agnostic, airborne destZ re-derived) — now guarded.
- **`enforceUnitSeparation(context)`** (battle.js, next to resolveDescentCollision):
  defense-in-depth sweep run in `endUnitIfDone` + at round start. Any exact x,y,z
  overlap: airborne mover climbs to the next free altitude in the column, otherwise
  `pushUnitToNearestOpen`; keeps the active blitz unit in place; logs
  `[enforceUnitSeparation] unstacked …` to console (trace remaining sources there)
  + a "jostled" combat-log line. 90s auto-sim soak: 0 sweep events, 0 stacks, 0 errors.
- Also: ai.js passes `action.target.z` to doAttack/doSpell (AI can hit flyers over
  stacks) and warp-stone now sets `unit.z`; renderer hover panel prefers the sprite
  under the cursor over the tile lookup (which showed the ground unit's panel).
- **Verified** via scratchpad `probe_fixes.js` (LOCAL_ASSETS route interception):
  9/9 — doAttack@z / doSpell@z / menu-row@z hit ONLY the flyer stacked over a ground
  enemy (stale `_clickedZ` set on purpose), getMoveTiles offers 0 occupied-z tiles for
  a flyer beside another flyer at equal clearance, forced overlap unstacked, and a
  real `page.mouse.click` on the flyer's projected sprite resolved `_clickedUnitId`
  and the quick-menu target to the FLYER. Probe gotcha: doAttack/doSpell return a
  DELAY and land damage on a timer — assert HP after ~2.5s, never synchronously.

## Items/trade/combo were still z-blind (2026-07-14) — battle.js, online.js, hud.js, ui.js, ai.js
User bug: a flyer hovering over an ally used a potion "on itself" and it healed the
ally underneath. Same root cause as the 2026-07-03 spell fixes (`unitAt(x,y)` column
fallback prefers the GROUND unit) — the sweep just never covered the non-spell actions:
- `doItem(unit,x,y,→z)`, `doTrade(→z)`, `doComboAttack(→targetZ)` now resolve
  `unitAt(x,y,z) || unitAt(x,y)`. Fixes potions/banes, trade partner, combo target
  landing on the wrong unit of a stack.
- Team gates `_itemTargetTeamOk`/`_spellTargetTeamOk` take z too (click path passes
  `state._clickedZ`, hover path `state._hoverZ`) — before, hover/click over the
  column gated on the ground unit's team, blocking or mis-arming confirms.
- `clickTile` confirm: `pendingTarget` now stores `z` and the sameTarget compare
  includes it (null z = wildcard, same convention as selectTargetFromMenu) — two
  clicks on different FLOORS of one column no longer read as click-then-confirm.
- Combo partner pick in clickTile reuses the outer sprite-aware `clickedUnit`
  instead of a shadowing `unitAt(x,y)` (flying partner resolved to ground unit).
- Online parity: doItem/doComboAttack wrappers + relay dispatcher pass z through.
- Callers updated: hud quick-menu (`tz`, `t.u.z`), ui scanner self-use (`unit.z`),
  ai item/item_targeted/combo (`unit.z` / `action.target.z` / `ct.z`).

## Quick-action menu now offers target-focused UTILITY moves (2026-07-03, hud.js)
`_computeEnemyActions` (hud.js ~2340) used to whitelist only damage/debuff kinds
(`offensiveKinds`), so poison seeds, terrain walls/floods, summoned weather,
swaps, artillery marks etc. never appeared when clicking an enemy. Now INVERTED:
everything is offered except a `nonEnemyTargetKinds` exclusion set (ally/self
support kinds incl. utility-typed healers like `seedHeal`; caster repositioning
`teleport`/`escape`; global `trickRoom`; placements that reject occupied tiles:
`warpRune`, `buildBridge`, `plantTree`, `deployObject/Pair/Turret`, `remoteView`).
Extra gates: `requiresFlight` spells skipped for grounded casters; seed kinds
skipped when the target stands on mountain/lava (engine rejects the plant).
Utility casts flow through the SAME range + `findSpellApproachTile`
move-then-cast logic and are cast AT the enemy's tile (engine accepts e.g.
`seedPoison`/`terrainCreate` on occupied tiles — verified via doSpell).
Sort: available first → expected damage desc → NEW `_actionSortClass` tiebreak
(damage 0 / debuff 1 / utility 2) → attack/spell/item order, so damaging moves
stay on top and pure-utility rows sit below. hud.js is on R2 → re-upload.
Verified via Playwright probe (LOCAL_ASSETS=hud.js): menu listed Poison Seed /
terrainCreate / swap / delayed-artillery rows (with working move-then-cast
tiles), excluded heal/teleport/turret, and kept damage rows on top.

## Action-plan arrow / hologram system (2026-07-01 overhaul)
This preview shows up in THREE places, all now upgraded to the same look
(curved arrows + team-tinted holograms + target displacement holograms):
1. **Quick-action menu** (hover an enemy, no spell selected) — `hud.js
   _showMoveArrowPreview` (~2568).
2. **Main spell menu, in range** (select a spell, hover a reachable tile) —
   `ui.js updateIntentPreview` → `_renderDisplacementArrows` (~7881): intent
   badges PLUS arced displacement arrows + a hologram of every unit at the tile
   it will be pushed/pulled/dashed/teleported/swapped to.
3. **Main spell menu, out of range** (select a spell, hover a far enemy →
   move-then-cast) — `battle.js _drawSpellApproachPreview` (~10769).
All three drive shared THREE primitives in `three-renderer.js`. **All four files
are on R2 → re-upload `three-renderer.js`, `hud.js`, `ui.js`, `battle.js`.**
- **`three-renderer.js` arrow builder** — `drawArrow3D(...,opts)` and the new
  **`drawPathArrow3D(waypoints, color, opts)`** both funnel through
  `_buildArrowFromPoints(pts, color, opts)`: a glowing **TubeGeometry** shaft
  that follows an arbitrary 3D curve (CatmullRom for 3+ pts, Line for 2), a
  cone head aimed along the curve's final tangent, an additive glow tube+halo,
  and 2–6 **flow dots** that stream toward the target (animated in
  `_updateActionPlanPulse`, `_arrowFlowDots`). `opts.arc>0` lobs the arrow
  through the air (curved trajectory); `drawPathArrow3D` hugs the ground and
  **bends smoothly through every walk waypoint** as one continuous arrow.
  `drawArrow3D` keeps its old 8-arg signature (opts is the 9th) so the ui.js /
  battle.js callers are unaffected — they just render nicer now.
- **Holographic ghosts** — `showGhostUnit(unit,x,y,surfY,opts)` now takes
  `{tag,color,opacity}`, tints the sprite toward the team colour (additive,
  blended to white so it stays legible), stands it on a pulsing footprint
  **ring**, and supports **multiple simultaneous ghosts** keyed by `tag`
  (`_ghostGroups[]`). `clearGhostUnit(tag)` clears one; `clearGhostUnit()`
  clears all. Billboarding + pulse iterate the list.
- **What the spell will DO** — a shove predictor replays the engine's
  displacement loop (push = away from the cast tile by `displaceDistance`/
  `pushDistance`; pull = toward it by `pullDistance`; stops at edge/obstacle/
  occupied) and drops a **second hologram of the ENEMY at its projected landing
  tile** (magenta push / cyan pull) with a bent arrow tracing the knockback — so
  the player sees the actual outcome, not just the aim point. Lives as
  `_predictTargetShove` (hud.js), `_predictSpellApproachShove` +
  `_drawSpellApproachShove` (battle.js), and inline in `_renderDisplacementArrows`
  (ui.js, which already computed shove tiles — now adds `_showDisplaceGhost` +
  arcs). Overlays: `actionPlanShove` / `spellApproachShove` (ui.js reuses the
  intent-preview clear, which now also calls `clearGhostUnit()`).
- Colours: walk route gold (jump-approach teal), strike arrow = attack red /
  spell type colour (`_actionPlanArrowColor`), caster ghost = team colour,
  shove ghost/arrow = magenta(push)/cyan(pull).

## Sniper rework — Headshot delayed laser mark + move nerf (2026-07-01)
Headshot was too strong as an instant 180 armour-piercing nuke. It is now a
**delayed, vision-gated shot** instead of firing immediately:
- Cast paints the enemy — see `_castLaserMark()` in battle.js. No damage lands
  on cast. **2026-07-02: the LZR status badge was REPLACED by an actual red
  laser BEAM** drawn caster→target (`_updateLaserSightBeams` in
  three-renderer.js, called every frame from the render loop): additive red
  cylinder + glow tube + pulsing dot at the target's chest; endpoints track
  both units' live mesh positions (walk tweens / flying bob included). The beam
  uses the SAME `_isUnitVisibleToViewer(mark, sourcePlayer)` gate as the shot —
  lose sight and the beam disappears (returns if sight is regained before EOR);
  it also hides when either endpoint is fog-concealed from the LOCAL viewer
  (checks `unitEntries.get(id).group.visible`). `applyStatusEffects('lasered')`
  is no longer called (status def kept in data.js; the `clearStatus` in
  `_detonateDelayedSpell` stays as harmless cleanup). The red single-tile board
  overlay that follows the unit is unchanged. Beams are cleaned up in
  `dispose()` + `resetForNewMatch()`.
- A pending shot is queued in `state._delayedSpells` with `markedUnitId`,
  `requireVision:true`, `roundsLeft:1`. It resolves at END OF ROUND via
  `_detonateDelayedSpell()` in state.js (the unit-tracking branch at the top).
- The 180 dmg only lands if the caster's team STILL sees the target at detonation
  (`_isUnitVisibleToViewer(mark, sourcePlayer)`, battle.js — awareness-range +
  wards, minus smoke/concealment). Break LOS / move out of awr and the shot is
  wasted (logs "slipped out of sight"). `selfStun` was removed (the delay is the
  drawback now). Data: `headshot` gains `delayedMark/markDelayRounds/requireVision`.
- Precision Shot is unchanged (still the instant one).
- Sniper MOVE nerfed: `JOB_MODIFIERS.Sniper.move` 0 → **-1** (most sniper races go
  2 → 1 move) so they must commit to a firing position.
- New status id `lasered` is registered in `_STATUS_EFFECT_IDS` (state.js) and
  `STATUS_DEFS` (data.js, `kind:'marker'` so it is NOT resistable), red badge colour
  in three-renderer `_SB_COLORS`. Board overlays (ui.js ×2, three-renderer) resolve
  `markedUnitId` → live unit tile so the dot tracks the target.
- NOTE: files load from R2, so this can only be tested after the user uploads the
  edited files. Smoke-tested locally 2026-07-02 via LOCAL_ASSETS (probe: cast →
  `_delayedSpells` queued, no `lasered` status, beam mesh in scene at the exact
  caster↔target midpoint, beam removed when `_isUnitVisibleToViewer` → false and
  restored when it returns).

## Tree chopping is now TARGETABLE like any attack (2026-07-02)
"Can't cut down trees — Attack greyed out, no chop option on click" was because
the chop EXECUTION existed (doAttack's 🪓 branch → `_fellTreeAt`) but no
TARGETING surface ever offered a tree. Fixed in four places (all must be
uploaded together: battle.js, state.js, hud.js):
- `_getAttackValidTargets` (battle.js) now appends in-range, LOS-clear,
  unoccupied tree tiles (`_tileHasTree`) as `kind:'tree'` targets — this drives
  the attack-target submenu, click validation in attack mode, AND
  move-then-attack (`findAttackApproachTile`/`attackHasReachableTarget` reuse
  it, so clicking a far tree walks you into range and chops). Trees sort AFTER
  real targets so auto-target still prefers enemies.
- `getActionPanelCache` (state.js) scans the range diamond for choppable trees
  so the Attack button lights up; cache key includes `state._treeTick`, bumped
  in `_fellTreeAt` + Wildwood planting (battle.js) alongside
  `invalidateActionPanelCache()`.
- hud.js: attack-target rows label trees "🪓 Chop Tree"; the tile quick-action
  menu (`_computeTileActions`) gets an `attack:tree` "Chop Tree" entry when the
  clicked tile has a tree and no unit on it.
- Verified locally via probe: tree listed in targets, hasAttack=true, Chop Tree
  quick action available, doAttack fells it ("🪓 … chops down a tree", object
  cleared, +1 lumber).

## Known findings (from playtests)
- **Mouse-hover / highlighted-tile mismatch (FIXED in three-renderer.js):** the
  hover pick (`_onMouseMove` → `_editorResolveTile` raycast) only ran on real
  `mousemove` events, but the engine moves the camera on its own constantly
  (blitz activation pans, attack cinematics, end-of-round overview + restore,
  wheel zoom). With a stationary mouse the world slides under the cursor and the
  hover highlight / pendingTarget stayed where the ray hit BEFORE the pan —
  measured 268px away from the cursor after one 3-tile pan. Fix: `_onMouseMove`
  stores the last client coords; `renderFrame` calls
  `_refreshHoverOnCameraMove(cam)` which re-runs `_resolveHoverAt(...)` whenever
  the camera's world/projection matrix changes (signature compare, no-op when
  the pose is stable). Verified with a probe (scratchpad `probe_verify.js`
  pattern): after 4 engine-style pans/zooms, hover tile == fresh pick every time,
  and clears when the cursor ends over void. Probe technique: intercept
  `three-renderer.js` via `page.route`, add a `__probe` object to the module
  return exposing `_editorResolveTile`/hoverMesh tile/canvas rect.
- **Terrain occlusion picks are correct but surprising:** with 1-height = 1 full
  tile elevation, tall columns hide many tiles behind them; the ray rightly picks
  the front (visible) column. ~half the 8×8 hilly board can be unpickable from a
  low camera tilt — not a bug, but explains "I can't click that tile" reports.
- **Stale highlights (the "won't move to the orange tile" / "terrain blocks the
  spell" bugs):** highlight (`getMoveTiles`/`getSpellRangeTiles`) and execution
  (`doMove`/`doSpell` via `isRangeBlockedByTerrain`) use the SAME logic with the
  SAME caster Z, so fresh recompute never disagrees (harness logged 0 disagreements
  over a full match). The real cause is the highlight not being recomputed/cleared
  after state changes (ally moves into LOS, AP/moves spent, terrain deform, fog).
  Repro idea: select unit → capture highlight → change state → click stale tile.
- **Lethality is fine WITH focus fire (earlier "no kills" was bad play):** units have
  ~750–1050 HP; a focused target dies in 2–3 hits (Meteor/Dead Eye hit 250–550). The
  0-kill stalemate came from the dumb harness SPREADING damage. Concentrate fire +
  secure kills and TDM ends in a 3-round wipeout. End-of-round regen (~5%) + 1-round
  respawns only matter if you fail to focus.
- **Homing storms (tornado, hurricane, thunderstorm, blizzard, sandstorm):** these are
  now single-tile vortices that, at END OF ROUND (just before end-of-round healing, via
  `processHomingWeather` in `state.js`), CHASE the nearest unit, moving up to
  `homingSpeed` tiles (tornado 3, others 2) toward it. Damage only lands on units the
  vortex **physically touches** — i.e. units standing on a tile it lands on or sweeps
  through that round. Stay farther than its move range and you're safe; let it catch you
  and you're hit. Tornado & hurricane also displace (blow back) anyone they catch.
  Blizzard freezes every tile it sweeps. They no longer drift randomly or damage whoever
  stands inside at start of round. Naturally-spawned storms chase both teams; spell-cast
  storms (`_casterUnitId` set) only chase the caster's enemies. Other weather (blood
  rain, drought, solar flare, tesseract storm, earthquake) is unchanged.
- **Mode resolution:** TDM has a 12-round limit (resolves cleanly + shows a result
  screen); Arena had a 15-round limit but dragged with respawns. "No-contest" voids
  after 20–30 idle rounds — a sign matches stall.
- **matchScores vs matchKills:** TDM/FFA kills live in `state.matchKills`; reading
  `state.matchScores` shows 0-0 and is misleading.
- **Traversal is centralized in `unitCanTraverse` (map.js) — and its 3D branch
  used to skip objects (fixed 2026-06-10):** all movement paths (battle.js BFS,
  ai.js pathing, ui.js highlights, the final move check at `doMove`) funnel through
  `unitCanTraverse(unit, x, y, z)`. Current maps always run in 3D mode
  (`state.boardColumns` populated), and the 3D branch only checked block terrain —
  it returned true without consulting `OBJECT_RULES.passable`, so trees
  (`passable:false`) were walkable. Deployed turrets live in `state.turrets` (NOT
  `boardObjects`/`_deployedObjects`) and were never checked by traversal at all.
  Both now block in `unitCanTraverse`; flyers can still pass above (z above object
  top / turret z+1). `canOccupy` previously blocked only `siegeTurret` and
  `canOccupy3D` ignored turrets — both now block any live turret, so teleports/
  knockbacks can't land on one. If a "walk through obstacle" bug reappears, check
  whether the code path passes `z` (3D branch) and whether the blocker is in
  `state.turrets`, `state._deployedObjects`, or `boardObjects` — each is checked
  separately.

## Camera system (battle.js `camera` object, ~line 5160) — 2026-06 overhaul
The logical camera is `camera` in battle.js (x/y tile focus, zoom, tilt, yaw,
camZ, elevZ); it drives BOTH the CSS diorama transform and `ThreeCamera.sync`.
Debug access: **`window.GAME._camera`** (added). Tilt/yaw readouts:
`state.dioramaTiltDeg` / `state.dioramaYawDeg`; focus via `window._lastCamFocalX/Y`.
- **`moveTo` semantics:** `zoom` is IGNORED unless `_allowZoomChange:true`
  (+`_bypassCap` to skip the auto-zoom floor). Since 2026-06, axes not specified
  keep the previous tween TARGET (not the live interpolated value) — interrupting
  a tilt restore with a pan no longer freezes the tilt halfway.
- **Action camera flow:** every offensive action funnels through
  `playOffensiveActionCamera(src, tgt, opts)` → returns timings
  ({sourceHold, travelMs, targetHold, totalMs}) that VFX scheduling relies on.
  It `camera.save()`s (now saves tween TARGETS + tilt/yaw), then either the
  default midpoint framing or the cinematic shot. Restores go through
  `camera.softResetToUnit` — which now SKIPS the restore when the acting side
  is auto-controlled (AI/auto/remote), killing the old per-action
  pan-back-to-unit bounce; ai.js also only re-centers a unit on its FIRST
  action of an activation (`unit._aiLoopCount === 1`).
- **Cinematic action cam** (`state.cinematicActionCam`, persisted in
  localStorage `ew_cinematicActionCam`; toggles: pause menu Video → "Action
  Cam", dev bar "3P"): `_playCineActionShot` (base tilt const 72) swoops
  behind the caster, yaw = atan2(-dx,-dy) **+16° off-axis** so the caster
  reads bottom-corner foreground (Pokémon OTS, not dead-centered). **2026-06
  AAA pass** (pull-back + headroom + steeper look-down): focal now sits
  **0.5–0.72** of the way toward the TARGET (was 0.32–0.62 toward the caster)
  so the target frames with headroom and its nameplate stays on-screen; zoom
  RELATIVE to `getDefaultZoom()` (≈ whole-board view) pulled back to
  `default × (2.7 − 0.18·dist)` clamped **1.35–2.8** (was 4.4−0.3·dist /
  ≤4.0, which cropped the caster and pushed the target off the top) — do NOT
  use `computeZoomForVisibleTiles`, its flat-view model badly underestimates
  what a tilted perspective shows. The shot dollies down-range at fire time
  (easeOut, arrives with the hit) + `shakeBoard('normal')` impact kick.
  Ownership token `camera._cineShotId`/`_cineShotUnitId` guards the dolly and
  the deferred `selectUnit` activation pan from fighting each other.
  `camera._preCineView` remembers the player's overhead tilt/yaw/zoom;
  restored by softResetToUnit/reset/selectUnit for MANUAL local units, while
  auto/AI units keep streaming from the cinematic framing.
  - **Cine-RETURN consistency pass (2026-06-29):** the return-to-gameplay was
    "wonky / inconsistent — zooms out, stays tilted at the spell-cast angle." It
    was split across `restore`/`reset`/`softResetToUnit`(×2)/`focusOnTiles` that
    each handled the return DIFFERENTLY: `reset` returned to the recomputed
    DEFAULT zoom while `restore`/soft-reset returned to the exact `pre.zoom`, and
    the no-saved soft-reset + the focus-cam pan (`_spellFocusCamera`→`focusOnTiles`)
    left `tilt` as `undefined` → frozen at the cinematic angle while x/y/zoom
    moved. Fixes: (1) every cine-return now restores tilt+yaw+ZOOM **together** to
    `_preCineView` in ONE move (reset uses `pre.zoom`, not the default); (2) a
    `cineWasActive` safety net un-tilts to the canonical board angle
    (`DEFAULT_BOARD_TILT=50`/`YAW=0`) if the remembered framing is ever missing —
    the camera can NEVER be stranded tilted; (3) `focusOnTiles` folds the
    un-tilt+zoom-restore into its pan when a `_preCineView` is pending for a
    MANUAL side (auto/AI still stream); (4) `_preCineView` is only captured from a
    true gameplay state (`_cineShotId == null`) so a shot can't record a cinematic
    tilt as the "overhead" to return to. All in battle.js `camera` object.
  - **"Zooms out SUPER far for no reason" — the deeper one (2026-06-29):** the
    auto-zoom framing math was coupled to the LIVE tilt.
    `computeZoomForVisibleTiles` = `parentH · tiltFactor / (tiles · tileSize)`
    with `tiltFactor = max(0.35, cos(dioramaTiltDeg))`. A cinematic shot pitches
    the camera to ~76–86° where cos floors at **0.35** (vs ~0.64 at the resting
    50°), so any `getDefaultZoom()` / `getTurnFramingZoom()` / `clampAutoZoom`
    floor computed WHILE still at the cine angle resolves ~half as tight → the
    board snaps way out. Intermittent because it depended on whether the tilt had
    settled when the zoom was recomputed. Fix: `_zoomRefTilt()` — while a shot
    owns the camera (`_preCineView` pending) the zoom frames for the player's
    remembered pre-cine tilt, not the transient cinematic one. A sustained manual
    tilt (no shot) still drives the auto-zoom. This is the real "zoom is all over
    the place" root cause; the return-path consistency fixes above are the rest.
  Bane-vial item
  throws (`doItem` baneType branch) route through `playOffensiveActionCamera`
  like attacks (throw anim/projectile delayed by `cam.sourceHold`). The shot
  is elevation-aware: focal height lerps caster→target elevation + a headroom
  term, and **tilt pitches harder with the slope (coeff 1.15, clamped 40–80):
  ~40–52 firing DOWN from height/flight for a real 3rd-person look at the
  ground (was clamped ≥55, "didn't tilt toward the ground enough"), 72 flat,
  ≤80 looking up at airborne/high targets — capped below the horizon so
  nameplates keep headroom instead of climbing off the top edge.**
- **Sky-strike descent cam** (`_playDescentCam`, meteor/nuke/cosmic slam via
  `opts.descentCam`): **2026-06 reworked into 3 beats** — (1) SWOOP to an
  over-the-shoulder 3rd-person view behind the caster (yaw = atan2(-dx,-dy)
  +16°, tilt 64, focal 0.62 toward impact) while the telegraph ring forms;
  (2) CRANE UP to the sky (tilt 86, focal back on the impact tile at ground
  elevZ) as the body spawns overhead so it falls into frame from above; (3)
  tilt back DOWN (tilt 58, zoom in) following the body onto the impact,
  `shakeBoard('hard')` on the hit. Beat timing keys off `sourceHold` /
  `descentCam.telegraphMs` / `descentMs` (mirrors `ThreeVFXEffects._fireDescent`).
  Self-cast / zero-range meteors keep the player's heading (no spin).
- **End-of-round camera sequence (2026-06):** when a round ends
  (`maybeAdvanceTurn`, blitz, `!nextUnit`), `showEndOfRoundOverview()` pulls
  back to a near-top-down **tactical overhead of the whole battlefield**
  (board center, tilt 32, `getFullMapZoom()`). The EOR phases then drop in
  from it: `processEndOfRoundStatuses` holds the overhead ~460ms, then **pans
  to each unit taking poison/burn/drown DoT** (tilt 34, `getDefaultZoom()×1.25`)
  and restores to overhead between units; `processHomingWeather` (state.js)
  **focuses and follows each weather vortex along its path** (reaches the
  battle camera via `window.GAME._camera` since it's in another script's
  closure — pans to the storm's start tile over 320ms then glides to its
  landing tile over `SLIDE_MS`, tilt 52, `getDefaultZoom()×1.35`; strike
  resolution waits `followLeadMs + SLIDE_MS`); `processEndOfRoundRegen`
  re-frames to the overhead so every `+HP/+MP` float reads at once.
- **Camera jank pass (2026-07-02)** — three user-reported issues, all fixed:
  - **Right-drag pan bobbed with the terrain.** Root: `camera._apply()`
    (battle.js) re-derives the focal HEIGHT from the terrain under the camera
    every frame (bilinear `getHeightAt` interp → `_computedElevZ`) and applies
    it RAW in the CSS transform (`translate3d(..., -elevZ)`); the old latch
    lived only in `ThreeCamera.sync` and only DURING the drag, so the DOM layer
    still bobbed and every release caused a vertical settle. Fix at the source:
    `camera._panElevLatch` freezes `_computedElevZ` when `state._userPanning`
    starts and STAYS frozen after release; it's released by the next
    programmatic move (`moveTo` — which tweens height from the latched value —,
    a non-pan `snap` that sets x/y/elevZ, or `setBoardCameraFocusPoint`).
    Zoom-only snaps (wheel) and tilt-drag snaps keep the latch. `ThreeCamera.sync`
    now trusts any finite `_computedElevZ >= 0` (0 is a valid latched height —
    the old `> 0` guard fell back to raw `getHeightAt` and re-introduced the bob).
  - **EOR zoomed out to the whole map ("watching from 3 miles away") and
    STAYED out.** `showEndOfRoundOverview()` used `getFullMapZoom()` with
    `_bypassCap`; worse, `processEndOfRoundStatuses` captured its restore zoom
    from `camera._tz` AFTER the overview had already retargeted it → the
    "restore" restored the far-out zoom. Now the overview clamps to
    `max(getFullMapZoom()·0.92, getMaxAutoZoomOut())` and the restore re-derives
    the gameplay zoom (`userZoom > 1.05 ? userZoom : getDefaultZoom()`) at fire
    time.
  - **Wheel zoom-in during the EOR sequence bounced right back out.** Every EOR
    camera call passed an explicit zoom ignoring `state.userZoomScale`. All EOR
    moves (overview, per-unit DoT pan, restore) now honor an engaged user zoom
    (`> 1.05`) — the tour becomes plain pans at the player's zoom.
  - `MAX_AUTO_ZOOM_OUT_TILES` 14 → **12**: hard floor for EVERY automatic zoom,
    map-size independent (this is the "one size fits all" knob — auto moves can
    never show more than ~12 tile-rows no matter how big the map is).
- **Camera overhaul v3 (2026-07-03)** — five user complaints ("spell zoomed out
  ridiculously far", "tilt up + cast = stuck looking up", "random far zoom-outs",
  "unnecessary panning", "tired of scrolling to re-zoom"), all root-caused.
  Files: **battle.js** (all logic) + **state.js/ui.js/online.js** (zoom-gate
  sweep) — the four must go to R2 together.
  - **Action-cam elevation zoom blow-out (the screenshot bug, zoom 0.68 during
    Knife Throw at a rooftop target):** `_playCineActionShot`/`animateDashActionCamera`
    fit an above-caster target with `_cineZoomForTiles`, whose `cos(tilt)` factor
    floors at 0.35 at the shot's ~76–90° tilt → the fit resolved ~3× wider than
    the elevation gap needs (1-level ledge → 0.67 zoom). Fixes: the fit factor is
    now `sin(tilt)` (a world-VERTICAL span projects ∝ sin, not cos), and both
    call sites floor the result at `CINE_MIN_ZOOM` (1.5) — the action cam's zoom
    now always stays in its signature [1.5, 2.5] band. Verified live: 3-level
    gap cast held min zoom exactly 1.50.
  - **"Tilt up then cast → camera stuck looking up":** the middle-drag tilt snap
    records the dragged pitch as `_restTilt` (up to 135° = staring at sky), and
    a cast captured it into `_preCineView` — every return then "restored" the
    sky-gaze, and the auto-settle guard (`tilt <= _restTilt+3`) could never fire.
    Fixes: **`REST_TILT_MAX = 62`** — `snap()` clamps `_restTilt`, and the (now
    shared) `_captureCineReturnView()` clamps the captured pre-cine pitch. Live
    tilt still cranes freely to 135; only the REMEMBERED resting/return pitch is
    capped. Also: the player-side press-turn HOLD (unit still has AP after an
    action) now arms **`camera._armLevelSettle(900ms)`** — the same debounced
    pitch/yaw-only settle the auto side uses — so holding the action framing can
    never strand the camera craned at the spell angle.
  - **"Zoomed out so far / scrolling to re-zoom" (the big one):**
    `computeZoomForVisibleTiles` MULTIPLIED by cos(tilt) where it must DIVIDE
    (rows foreshorten on a tilted board: one row ≈ ts·zoom·cos px), so every
    "12-row" auto framing (default zoom, auto floor, EOR overview, turn framing)
    undershot by cos² ≈ 2.4× — default zoom resolved 0.28 on an 8×8 map. Now
    `parentH / (rows·ts·cos)`; measured live via `ThreeRenderer.worldToScreen`:
    default ≈0.91, ~5.8 center-rows ≈ whole 8×8 board + margin in frame
    (screenshots `shots/camfix-default-framing.png`, `camsoak-r2.png`).
  - **User zoom now actually sticks:** every auto-move gate was the absolute
    `userZoomScale > 1.05`, which assumed default ≈1.0×; with real defaults
    ≈0.4–0.9 ANY wheel zoom-in below 1.05 was discarded by the next reset/turn
    pan/EOR beat. New **`isUserZoomEngaged()`** (battle.js, global) =
    `userZoomScale > getDefaultZoom()·1.05`, swapped into ~35 call sites across
    battle/state/ui/online. Engaged user zoom also now BEATS the remembered
    `_preCineView.zoom` on every cine return (restore/reset/softReset/focusOnTiles)
    — a wheel zoom dialed mid-shot survives the shot's return. The zoom toggle
    button (`cycleUserZoom`) was dead on big maps (toggled 1.0 ↔ default, both
    "not engaged"); it now toggles default ↔ `getTurnFramingZoom()`.
  - **Verification harness:** scratchpad `verify_camera.js` (10 checks — cine
    fit math, elevated-cast zoom floor ≥1.45, rest-tilt clamp, HOLD settle,
    engaged-zoom persistence incl. mid-shot) + `soak_camera.js` (real TDM vs
    CPU, action cam on, in-page 400ms camera monitor flagging zoom-below-floor
    and tilt-stuck-high>6s). Result: 10/10 + 0 anomaly flags + 0 page errors.
    Both need `USE_ASSET_CACHE=1 LOCAL_ASSETS=battle.js,state.js,ui.js,online.js`.
- **EOR combat-log de-bloat (2026-06):** the global regen log is a single
  summary line; spawn-zone friendly regen (`processEndOfRoundZonesAndSeeds`)
  no longer logs one `Spawn zone heals NAME (+HP, +MP)` line PER unit — it
  accumulates `_szRegenUnits`/`_szCleanseUnits` and logs one
  `🏠 Spawn zones restore N units…` line (per-unit `+HP/+MP` floats + subtitle
  dialogue still show on the board). The round-start subtitle/log is now
  `⚡ Round N — Fight!` (was "Blitz!"); the bottom subtitle bar mirrors the
  latest combat-log line (`_renderDialogueBox`), so that one string drives both.
- **Subtitle-bar player prompts (2026-07):** the bottom subtitle bar is now a
  Pokemon-style prompt box. `_computePlayerPrompt()` (battle.js, above
  `_renderDialogueBox`) returns a gold `▶ …` line whenever the LOCAL player has
  a pending choice — root action menu ("X is up — select an action"), move/jump
  tile picks, attack/spell/item/trade two-click confirms (shows the pending
  target's name), every spell kind via `_spellTargetPromptText` (skyThrow's
  grab→throw phase-2 included, keyed off `unit._skyThrowGrab`), the
  `spellOrientation` H/V pick, combo partner→target, WASD-walk (ENTER confirm),
  and ward/flair/inspect/trade/warpStone/ping. Priority in `_renderDialogueBox`:
  `battleDialogueQueue` > fresh combat-log line (2.6s beat, `DLG_LOG_HOLD_MS`,
  then a timer hands the bar to the prompt) > prompt > stale-log mirror (AI
  turns unchanged). A prompt that changes while the log stays put (= direct
  menu input) takes the bar immediately. Gating mirrors the HUD action menu:
  blitz-active unit is ours + local (`getViewerPlayer`), `canUnitAct`, no
  `_actionExecuting`/`_dying`/`uiDialog`/winner/autoPlayers. `renderIfDirty`
  (state.js) now calls `_renderDialogueBox` every battle render since
  action-mode changes don't dirty the log. Prompt CSS = `.dlg-prompt*` in
  styles-hud.css. Verified: scratchpad `probe_prompt.js` (10/10 UI checks:
  root/move/back/attack-confirm/abilities/spell-target/items/log-beat-then-
  prompt/AI-turn-mirror) + 280s TDM playtest soak, 0 page errors — both need
  `USE_ASSET_CACHE=1 LOCAL_ASSETS=battle.js,state.js,styles-hud.css`.
- **camera._busy lifecycle (STALL TRAP):** `_waitForAnimationsThen` polls
  `camera.isBusy()` (8s max per wait). `boardCameraResetTimer` is a SHARED
  slot that any pan/reset/focus cancels — never park a busy-release there or
  `_busy` strands true and every AI action stalls ~8s ("game stalls after a
  spell"). Busy releases must live on `camera._busyTimer` (every setter of
  `_busy=true` installs its own release; ownership transfers re-install).
  Verified with an injected `camera.reset()` race mid-spell.
- **User-held camera + turn change:** while the user holds a camera drag,
  `state._userPanning` must be true so `selectUnit` defers its activation pan
  into `state._deferredTurnPanUnitId`; each drag-release handler consumes it
  (pans to the new active unit). The right-button pan and touch paths always
  did this; the middle-button tilt/yaw drag didn't (fixed 2026-06 in state.js
  — it left the camera wherever the drag ended when a turn started mid-drag).
- **`state.thirdPersonCamera` is DEAD** (never assigned; leftover guards remain
  in state.js input handlers only — battle.js's guard was removed). The 2D
  overlay "Cin" toggle (`state.cinematicMode`, `playCinematicAttack`) is a
  separate, still-live feature.
- **Harness:** `node playtest_camera.js` (needs server on :3000) plays a TDM,
  records tilt/yaw around attacks in 3 phases (cinematic P1, cinematic CPU,
  default) and screenshots to `shots/cam-*`. It serves the LOCAL
  battle.js/ai.js/ui.js via `LOCAL_ASSETS` so repo edits are testable before
  the R2 upload. NOTE: setting `controllers={1:'ai',2:'ai'}` mid-match STALLS
  (no attacks, `_blitzActiveUnitId` null) — use a local side or dev-sim to
  drive soaks.

## Elevation / heights — ONE WORLD SPACE (2026-06-13 unification)
The 3D world (three-renderer.js) draws **1 height level = 1 full tile**
(`ELEV_STEP_RATIO = 1.0`, cube voxels). Historically the rest of the code still
used the legacy half-tile ratio, so spell VFX landed HALF-height (inside cliffs,
a full tile under flyers) and the camera focused below airborne units. Now:
- **`window._getElevationPx(h)` (ui.js) is THE converter** (h × tileSize × 1.0)
  and matches the renderer + three-camera.js. All VFX (three-vfx-effects.js,
  three-lightning.js, three-vfx.js rain), camera elevZ math (battle.js), and
  DOM overlays go through it. NEVER hand-roll `h * ts * 0.5` again (stragglers
  fixed in hud.js move-arrow preview + three-vfx.js `_rainTileTopY`).
- **Game LOGIC heights stay half-tile-based**: building `_gameHeight` is
  `floor(roofPx/(ts*0.5))` (LOS/roof-standing unchanged). Both prism builders
  (ui.js `_buildBuildingPrism` + three-renderer's) now write IDENTICAL
  quantized `_gameHeight`/`_roofZPx` (they used to disagree — whichever ran
  last won, randomly shifting roof-standing VFX/units).
- Because `_roofZPx = _gameHeight × ts × 1.0`, level-based math
  (`_getElevationPx(getHeightAt(x,y))`) ≡ px-based (`tileElevationZ`,
  `ThreeRenderer.tileTopY/unitSurfaceY`). `playtest_heights.js` asserts this.
- **Aim height**: `ThreeVFXEffects.unitZBoost()` is now a FIXED torso anchor
  (ts × 0.45; same in three-lightning chainBolt). It used to scale with the
  camera tilt (diorama hack) so projectiles aimed at feet from overhead.
- Flying = `canFly(unit) && isUnitAirborne(unit)` (map.js; SKY_RACES, psychic,
  jetpack accessory; airborne = unit.z > getHeightAt). Renderer/VFX/camera all
  use `unit.z` levels for airborne, terrain+roof otherwise. Parties roll
  jetpacks/sky races often — airborne units appear in normal matches.

## Line of sight — eye-height + corner-graze fix (2026-07-02, map.js)
LoS is `isRangeBlockedByTerrain` → `_isRayBlocked3D` (map.js ~4505), a 3D voxel
DDA. Chebyshev d ≤ 1 is always exempt; `wallVision` units bypass entirely.
Two bugs fixed this session:
- **Sight ray started at the WAIST, not the eyes.** Ray endpoints were
  `z + 1.5` = center of the lower body voxel (feet at world z+1, 1-tile-tall
  sprite head at z+2). Result: a unit atop a staircase could NOT see down it —
  on 1:1 stairs every step ≥2 tiles away was "blocked" (ray grazed the first
  step's corner), and on 1-in-2 stairs EVERYTHING downhill was blocked (ray
  clipped the floor of the shooter's own step level). Now `EYE = 1.8` at both
  endpoints (eye-to-eye keeps LoS mutual).
- **DDA tie-break falsely hit corner-grazed voxels + made LoS asymmetric.**
  Endpoints sit at *.5 with integer heights, so rays cross voxel edges/corners
  EXACTLY all the time. The old walk stepped one axis at a time on ties,
  detouring through a voxel the ray only touches at an edge → downhill blocked
  while uphill was clear (9.5% of random pairs were one-way sight!). Now all
  tied axes step together (grazing an edge ≠ a hit). Symmetry fuzz over 60
  random heightmaps: 0 asymmetric pairs.
- Preserved on purpose: 1-high bump still hides two flat-ground units (sprite
  is 1 tile tall, head exactly at bump top); 2-high walls block; standing 1
  block up sees over a 1-high bump (used to be blocked).
- **Testing gotcha:** `_inferStandingZ` prefers a live unit's `u.z` over the
  column top. If you sculpt terrain under a unit with `setBlockAt` its stale
  `u.z` corrupts LoS queries for that tile — evacuate units (or reset
  `u.z = nearestWalkableZ(x,y)`) before asserting. Cost 20 min of phantom
  in-game "failures" that the offline harness didn't have.

## Jump mechanic — Phase 1 redesign (2026-06-29)
Jump was reworked from a 1-AP, 4-cardinal, single-tile shuffle into a deliberate
traversal verb. All logic in `battle.js`.
- **`getUnitJumpStat(unit)`** = horizontal reach in tiles. Resolution order:
  explicit `unit.jump` → `RACE_JUMP_OVERRIDE[race]` → agility (`spd<=5 →1`,
  `spd<=8 →2`, else `3`). `RACE_JUMP_OVERRIDE` gives HUGE races size-based reach
  regardless of low spd: colossal (kaiju/giant/king kong/kraken/dragon/loch ness/
  juggernaut/titan) = 3; large bruisers (cyclops/bigfoot/yeti/dinosaur/minotaur/
  nephilim/golem/mech/goatman/symbiote) = 2. Exported on `GAME`.
  **`getUnitJumpClimb(unit)`** = `max(2, jump)` (baseline 2 so existing roofs stay
  reachable; jump-3 units climb 3). Drops unlimited (fall damage applies).
- **`getJumpTiles`** now: flyers return `[]` (they fly, never jump);
  `unit._jumpedThisTurn` returns `[]` (ONE leap per turn, reset alongside
  `_altitudeChangesThisTurn` at every turn boundary). Reach uses the engine's own
  "8-then-diamond" metric (Chebyshev first ring, Manhattan beyond) — same shape as
  `combatDist`. **Only the LANDING tile is validated** (traversable, unoccupied,
  within climb) — intermediate tiles are NOT path-checked, so a jump ARCS OVER
  gaps/chasms/low obstacles to land on solid ground beyond (gap width gated by the
  stat: reach 2 clears a 1-wide gap, reach 3 a 2-wide chasm).
- **`doJump`** sets `unit._jumpedThisTurn = true`; still 1 AP; does NOT increment
  `movesThisTurn` (so jump + up-to-2 moves all-deliberate is still possible). Keeps
  the `animateJumpArc` (cubic ease + parabola + squash/stretch).
- **Removed the one-click walk+jump combos** (`move+jump`, `move+move+jump`,
  `jump+move+move`) in the click handler + their Ring2/Ring3 highlights in `ui.js`.
  Those fired `doJump()` synchronously while `animateWalkPath` was mid-flight →
  the abrupt "snap to a 3-AP jump tile". Jump is deliberate now: walk first, then
  pick a jump (jump tiles show in the move overlay AND the dedicated jump-mode
  highlight at ui.js ~2759). Each leg animates cleanly on its own.
## Jump mechanic — Phase 2: jump-to-enable above-target spells (2026-06-29)
The EXISTING elevation-gated spells (kind `leapStrike` — "leap from high ground onto
an enemy below", requires `casterStandingHeight > targetStandingHeight`; ~9 spells like
Feral Dive) can now be used by JUMPING UP FIRST so the target ends up below you, then
casting — a jump-then-cast combo. NO new spell property was invented; this works off
the existing leapStrike gate. `spellRequiresAboveTarget(spell)` = `kind==='leapStrike'
|| spell.requiresAboveTarget` is the generalized hook.
- **Gating (so a level/below target routes to the jump-approach instead of a failing
  cast):** `getSpellRangeTiles` and `_getSpellValidTargets` now skip target tiles that
  aren't below the caster's current standing height for above-target spells. (`doSpell`
  + `hasSpellTargetInRange` already had the leapStrike gate; now all four agree.)
- **Jump-aware reachability:** `_spellJumpApproachTiles(unit,spell)` returns
  `getJumpTiles` candidates if `ap >= 1 + spellApCost`. `spellHasReachableTarget`
  (keeps the spell selectable in the ability menu) and `findSpellApproachTile` (drives
  the hover move-arrow + click-enemy auto-approach) both try these jump tiles; from a
  jump landing the gate re-evaluates at the post-jump height, so a leap-up that clears
  the target qualifies. `findSpellApproachTile` returns `{_jump:true, moveCost:1}`.
- **Execution:** `_moveThenCast` (engine) and the HUD quick-action executor both got a
  jump branch: `doJump(...)` then wait ~680ms for the arc to land, then cast. HUD
  `isLeap` now also gates inSpellRange on `casterStandH > targetStandH` and uses
  `findSpellApproachTile` (not the walk-only `findMoveIntoRange`) for the approach.
- **Net effect:** on flat ground at even elevation, a leap is correctly unavailable
  (no higher tile to jump to). With any higher tile within jump reach, hovering/clicking
  the enemy jumps you up onto it and leaps. Needs `1 + leapApCost` AP (usually 3).
- **Not done / possible Phase 3:** spells gated on the caster being AIRBORNE (flying),
  and jump-aware approach for non-leap spells (currently only above-target spells get
  the jump fallback; walk approach still covers the rest).

## Action camera framing — REVERTED 2026-06-13 (DO NOT REDO)
The two "framing fixes" below were REVERTED: in practice they ruined the good
closeup over-the-shoulder action cam and made matches start zoomed way out.
The camera now matches the 2026-06-10 (good) behavior. Keep it that way:
- **`ThreeCamera.setBaseDist` stays init-ONLY** (three-renderer.js line ~6045,
  `sqrt(w*w+h*h)*1.2`). The "refresh baseDist on every canvas resize" tweak in
  renderFrame was REMOVED — re-applying baseDist with the full-screen canvas
  dims yanked the steady-state view far out, so every match opened zoomed out.
- **`_playCineActionShot` uses the simple framing**: `f = min(0.62, 0.32 +
  0.8/(dist+1))`, `zoom = min(4.0, getDefaultZoom()*max(1.8, 4.4-0.3*dist))`,
  dolly `f2 = min(0.8, f+0.18)` at `zoom*1.08`. The analytic NDC-budget
  pull-back/zoom-out (caster-in-frame model, budget 0.65/0.78, getBaseDist)
  was REMOVED — it pulled the focal off the caster and pushed zoom out, killing
  the tight closeup third-person shot. (`ThreeCamera.getBaseDist` still exists
  but is no longer used by the cine shot.)
The height/projectile-aim work from the same batch (ELEV_STEP_RATIO=1.0 in
ui.js/three-camera.js/renderer, unitZBoost torso anchor, rain/hud elev px) was
KEPT — only the camera framing was reverted.
- **`node playtest_heights.js`** (server on :3000; uses asset cache +
  LOCAL_ASSETS to serve repo-local edits): asserts renderer-Y ==
  `_getElevationPx` for all units incl. forced-airborne, cine focal elevation
  between the two unit anchors, caster in frame during the held shot (real
  projection through ThreeCamera), and VFX z-args converting to renderer
  space. Quirks: in-page `sleep(100)` samples stretch under swiftshader (use
  the REAL `performance.now` timestamps; nominal labels lie); the target must
  survive the hit or the kill-cam restore ends the shot early; only samples
  with `camera._cineShotId != null` count as "held shot".
- `playtest.js` now honors `USE_ASSET_CACHE=1` (+`LOCAL_ASSETS=...`) too.

## Online / multiplayer (two-browser harness: `playtest_online.js`)
`server.js` is the relay (room codes + ranked queue + D1 ELO); the client glue is
`online.js` (on R2). Authority model: **HOST = Player 1 = authoritative engine;
GUEST = Player 2 = thin client** — guest sends semantic `game-action` intents
(`clickTile`/`selectUnit`/`setActionMode`/`triggerEndTurn`, each with a `_ctx`),
host replays them via `_executeRemoteAction` then `_broadcastState()` (full
serialized state, Set-aware, throttled 50ms). Guest applies host state via
`_applyRemoteState` (preserves local UI keys).
- Entry points (no menu nav needed; they self-connect): `lobbyCreateRoom()` →
  `window._NET.roomCode`; `lobbyJoinRoom()` reads `#lobbyJoinInput`;
  `lobbyJoinQueue()` (uses `_queueTeamSize`/`_queueMode`). `window._NET` =
  {socket, role, myPlayer, roomCode, online, connected, _lockState}.
- Start handshake: guest `applyPartyBuild(false)` (locks + sends party-config →
  sets host `_lockState.guestPartyReceived`), host `applyPartyBuild(false)`, host
  `startMatch()` (gate: `_lockState.host && guestPartyReceived`).
- `node playtest_online.js [friendly|ranked]` drives two real browsers through
  this, plays host=P1 locally + guest=P2 via the real emitters, and **diffs
  host-vs-guest state each step (desync detector)**. Writes `shots/online-*`.
- **CONFIRMED relay layer works:** connect, room-full, party-config relay,
  disconnect detection (`connected=false` + 90s window), and rejoin (new socket
  id) all functioned in testing.
- **BUG FOUND (blocks online match start on procedural maps):** `startMatch` →
  `prepareBattleStateFromCurrentBuilds` (battle.js:9612) → `initMap` (map.js:3139)
  throws **`ReferenceError: sanctuaries is not defined`**. Line 3139 uses bare
  `[sanctuaries[1], sanctuaries[2]]` but everywhere else it's `state.sanctuaries`
  (map.js 2826/2913/2966/3064). **Fix: add `state.` prefix.** Solo vs-CPU misses
  it (uses 8×8 presets); online friendly defaults to map `'medium'` (12×12
  procedural) which hits this branch. NOTE: map.js is on R2 — fix must be applied
  there (or uploaded + re-served) to take effect. Until then the in-match desync
  test can't run (match never starts); the "desyncs" the harness logs pre-start
  are just each client's independent party roll, not a confirmed sync bug.

## Online — 2026-06 session update (match now STARTS; new findings)
- **`sanctuaries` blocker is GONE.** Online friendly on `'medium'` (12×12 procedural)
  now starts cleanly — `startMatch` → battle, no `sanctuaries is not defined`. Either
  the R2 `map.js` was patched or the path changed. The in-match sync test runs now.
- **Relay + state sync CONFIRMED working end-to-end** (via `probe_online.js`): party-
  config relay, P1-turn state-sync (guest correctly mirrors `_blitzActiveUnitId`),
  guest playing P2 through the real emitters, host `_executeRemoteAction`, and turn
  handoff back to P1. In clean probe runs the guest played several unit-turns and
  control returned to P1 — both P1-first and P2-first initiative.
- **`_blitzActiveUnitId` is host-authored ONLY for the host's own (P1) turns.** During
  the REMOTE player's (P2/guest) turn the host often leaves it null; the guest's
  `_applyRemoteState` auto-selects the first available P2 unit into `selectedUnitId`
  (online.js ~2255). So **a guest must be driven off `state.selectedUnitId`, not
  `_blitzActiveUnitId`** (that field being undefined for the remote turn is NOT a
  desync). Fixed in `playtest_online.js` GUEST_TURN + the desync digest (it now only
  compares `active` on the host's turn). This was the cause of the old instant
  "stall + 60 DESYNC" — a HARNESS bug, not a game bug.
- **SUSPECTED real bug — battle-start handoff can be lost with no resend.** The host
  broadcasts each turn-handoff once; `_broadcastState` dedups on `NET.lastSyncJson`,
  so if the guest ever MISSES that single packet there is no retransmit and the match
  deadlocks (`activePlayer host=2 guest=1`, seen intermittently when P2 wins
  initiative). The harness now detects a persistent activePlayer disagreement, forces
  a host re-broadcast (clears the dedup), and logs whether it RECOVERS — confirming
  "missed broadcast + dedup-prevents-resend." Real-fix would live in online.js (e.g.
  periodic full-state heartbeat, or guest-side "I'm behind, resend" request). Couldn't
  repro deterministically in the clean probe (race), but it stalled the full harness.
- **`rejoin-failed` flag** is the disconnect/rejoin probe, a separate area (socket
  reconnect path) — not investigated this session.

## Online play bug-fix pass (2026-07-03) — 5 user-reported bugs, root causes
Files touched (ALL must go to R2 together): **battle.js, online.js, ui.js,
party-builder.js**. Key discoveries (don't re-learn these):
- **All game scripts are TOP-LEVEL classic scripts (no IIFE)** — function
  declarations are shared globals, and online.js's wrapper pattern
  (`const _orig = fn; fn = function(...)`) intercepts battle.js-INTERNAL calls
  too. This is the backbone of the online layer and of this session's fixes.
- **"Guest attacks do nothing / unlimited actions / Press Turn AP refunds"**:
  the HUD quick-action menu, target submenu, tile actions (chop/smash), More
  menu (Channel/Enter Building), and drag-moves call `doAttack/doSpell/doMove/
  doJump/doItem/doComboAttack/channelNexus/doEnterBuilding` DIRECTLY (hud.js
  ~2900-3600, ui.js 3094/4504) — these bypassed the online clickTile relay, so
  the GUEST ran them on its non-authoritative local engine (press popups
  included) and the next sync rolled everything back. Fix: online.js wraps ALL
  engine mutators — guest emits `game-action {type:'engine', fn, unitId, x, y,
  z, tool, partnerId}`, host replays in `_executeRemoteAction` (new 'engine'
  case). Host-side direct calls run locally + `_broadcastState()`.
- **"Opponent HP never goes down" (staleness)**: damage/AP land on impact
  timers ~1-2s AFTER the click-time broadcast; nothing rebroadcast afterward
  during the HOST's own turn. Fixes: `endUnitIfDone` wrapper broadcasts at
  every action completion, and the handoff heartbeat now runs during BOTH
  turns (forced dedup-bypass only while waiting on the guest).
- **Reverse-angle action cam for the P2 viewer**: `_playCineActionShot` /
  `animateDashActionCamera` / `_playDescentCam` added `yaw += 180` when
  `body.is-p2-viewer` — that flip dates from the 2D CSS board (rotated 180 for
  P2); the 3D canvas (in `.map-center`, NOT inside `#board`) is never rotated,
  so the flip put the camera behind the TARGET looking back at the caster.
  Removed (yaw is absolute world-space). Same dead assumption inverted WASD
  for the guest (ui.js ~8711) — also removed. NOTE: in 3D the P2 viewer sees
  the SAME board orientation as P1 (resting yaw 0 for both).
- **Fog camera leaks (online + offline vs CPU)**: new gate
  `_fogCamTilesVisible(...points)` (battle.js, next to _isTileVisibleToViewer)
  = free on own turn / fog off, else requires ≥1 traced point visible. Applied
  to: charge/dash cams (2 sites), displacement follows (fling/pull/swap/
  escape/grab/self-grapple), `_spellFocusCamera`, teleport-dash pan, clickTile
  combined-path walk pan, doJump pan. `doMove`/`doJump` now treat
  `state._remoteAction` like AI (fog-aware partial-path anim branch). Guest
  side (online.js): walk-anim relay trims enemy walks to the VISIBLE segment
  (mirrors the offline doMove logic) and pans only to visible tiles; jump-anim
  pans only to a visible endpoint; floating-text + vfx3d relays are gated on
  tile visibility.
- **Top-left panel desync**: the ActiveUnitPanel (hud.js) is driven by
  `_blitzActiveUnitId → selectedUnitId`; selection keys are viewer-LOCAL (in
  the `_serializeState` skip list). The host kept its stale pre-turn selection
  during the guest's turn. Fixes: `_continueBlitzWithUnit_impl` REMOTE branch
  sets selectedUnitId/focusedUnitId = acting unit; `_executeRemoteAction`
  mirrors the guest's selection while activePlayer === remoteP.
- **"Seal Your Fate" never showed a waiting state**: party-builder.js read
  `window.ONLINE_RULES` / `window._myPlayer` which were NEVER exported (both
  are top-level-const/closure values) → `isOnline` was always undefined. Now
  exported (ui.js + online.js). Button is role-aware: ranked → WAITING ON
  OPPONENT/MATCH STARTING; friendly guest → WAITING FOR HOST TO START;
  friendly host → WAITING ON OPPONENT then an enabled ⚔ START MATCH (host
  also now emits `host-locked` relay in friendly, not just ranked). Also
  fixed doStart's locked-vessel check to use the LOCAL player (was hardcoded
  team 1 — the guest was validated against the host's roster).
- Verification harness: scratchpad `verify_online_fixes.js` (two browsers,
  LOCAL_ASSETS=battle.js,online.js,ui.js,party-builder.js,hud.js) — asserts
  builder button states, panel mirroring, guest direct-doAttack relays to
  host (HP/AP), guest sees damage ≤3s, fog gate truth table, 0 page errors.

## R2 throttling + the on-disk asset cache (`asset_cache.js`)
The game pulls ~35 scripts/styles (~1.3MB; `battle.js` alone ~975KB) from the **public
`*.r2.dev` dev bucket** (rate-limited, NOT CDN-cached) + a few CDNs. Each Playwright
cold-start re-downloads all of them; after ~15 launches the endpoint throttles and
`page.goto` times out (minutes). **Fix shipped:** `asset_cache.js` exports
`installAssetCache(context[, dir])` — a Playwright `context.route` interceptor that
serves those hosts from a local on-disk cache (`.asset-cache/`, gitignored), fetching
each file at most once ever (content-encoding/length headers dropped to avoid double-
decode). Wired into `playtest_online.js` and `probe_online.js` via `mk()`. First run
warms the cache (~124MB incl. sprites); subsequent cold-starts load without hitting R2,
so no more goto timeouts. Page-load in the harnesses now uses `waitUntil:'commit'` +
poll-for-globals (don't wait on `'load'`). **Real-player fix** (out of repo): serve
assets from a real Cloudflare custom domain / CDN instead of the throttled `*.r2.dev`.

## Adding a new prebuilt map (5 touch-points — miss one and it won't load/show)
A "prebuilt" map (fixed grid, the `prebuilt_*` modeIds) is wired across FIVE files.
All of them are on R2, so edits must be re-uploaded to take effect:
1. **`data.js` → `PREBUILT_MAPS[modeId]`** — the actual layout:
   `{ name, w, h, grid[h][w], heightMap[h][w], objects[h][w] (arrays of {oid,...}),
   monuments? [{kind,x,y,foot,maxH,seed,solid?}], spawns{1:[{x,y}],2:[...]} }`.
   `grid` values are 1-based indices into `ME_TERRAIN_IDS` (map.js ~5656); `oid` →
   `ME_OBJECT_IDS`. `forest`/`forest_2`/`tree` terrain auto-converts to grass + a 3D
   tree object (map.js ~4096). **Walls = a height step > `MAX_CLIMB_HEIGHT` (=1,
   battle.js:69):** a column ≥2 taller than its neighbour blocks ground units (flyers
   pass over). Validate every authored map with a height-aware BFS from each spawn so
   no tile is an un-exitable pit and both teams are connected.
2. **`data.js` → `MAP_LAYOUT_PRESETS[modeId]`** — `{sections:{earth:{startRow:0,
   endRow:h-1,baseTerrain}}, barrierRows:[], barrierOpeningsX:[], hasFloors:false}`.
   Missing ⇒ falls back to `large` (wrong size/floors).
3. **`state.js` → `GAME_MODES[modeId]`** — `{id,label,desc, boardSize/Width/Height,
   teamSize, winHourglasses, hiddenItemSpawns, blitzMode:true, hasTowers:false,
   isPrebuilt:true, terrainPatches, spawns, defaultBuilds}`. Spawns MUST match #1.
4. **`state.js` → every `MULTIPLAYER_MODES[*].compatibleMaps`** — a HARD allowlist
   (map.js:1130, match-select.js:539). Add the modeId to each mode you want it
   playable in, or it never appears in the map picker.
5. **`map.js` → `MS_MAP_LIST`** — the menu card `{modeId,name,size,team,w,h,
   isPrebuilt:true}`. The card's minimap thumbnail is rendered from `PREBUILT_MAPS.grid`.

New terrain types need: a sprite URL in `sprites.js` `TERRAIN_SPRITES`, a rule in
`data.js` `TERRAIN_RULES`, and an entry appended to `map.js` `ME_TERRAIN_IDS` (the
index is its grid id). Custom 3D landmarks are `state.monuments` entries whose `kind`
maps to an `_hz*` builder in three-renderer.js `_monBuilders()`; kinds absent from
`_MON_COLLISION` (map.js ~1879) are purely decorative (no tile blocking).
The June-2026 map set (Moon/Heaven/Backrooms) + the `flag/rover/goldgate/lightpillar/
fluorescent` monument builders + the `moon/carpet/gold/metal/leaves` terrains are the
worked example. Tree tops/canopies are textured from `leaves.png` (three-renderer
`_getTreeForestTex` + `_FOLIAGE_LEAF_TEX_FOR_KEY`).

### 2026-06 map set #2 — Stonehenge / Pyramids of Giza / Atlantis (worked example #2)
Added three Tier-1/2 maps via the 5 touch-points above (modeIds `prebuilt_stonehenge`
16×16 6v6, `prebuilt_giza` 20×20 6v6, `prebuilt_atlantis` 24×24 8v8). Authored with a
deterministic generator + height-aware BFS validator (kept in scratchpad as
`genmaps.js`/`inject.js`; regenerate + re-inject rather than hand-editing the big
arrays). Key lessons from this batch:
- **Monument kinds first exercised in-game this batch: `pyramid`, `colossus`, `rings`**
  (previously only `monolith/flag/rover/crystal/obelisk/lightpillar/goldgate/greek/
  exitsign` were used by real maps). All builders are safe: `_hzColossus`/`_hzSacredRings`
  are pure procedural THREE geometry; `_hzModelPyramid` (kind `pyramid`) streams the
  shipped `Pyramid/Pyramid.glb` from R2 (`_buildMonumentObj` try/catches a bad builder →
  monument silently absent, never a crash).
- **Climbable landmarks:** `pyramid`, `ziggurat`, `obelisk`, `stairway`, `colossus` are
  the ONLY kinds in `_MON_COLLISION` (map.js ~1882) — they stamp `grass`-terrain voxels
  (hidden under the model) so units can climb them. `pyramid`/`ziggurat` use
  `rr-max(|dx|,|dy|)` (rr=floor(foot/2)) ⇒ a stepped, climbable mound capped at `maxH`;
  Giza's great pyramid (foot 7 ⇒ climb 3 levels) is a sniper perch. Everything else
  (`monolith/crystal/greek/rings/...`) is **decorative** — for stone cover you must raise
  the heightMap yourself (Stonehenge's sarsens = 1-tile pillars at height 3/4 with a
  `monolith` visual on top; the 4 cardinal gaps are the sanctum entrances).
- **`rings` (`_hzSacredRings`) is NOT a ground stone circle** — it's a floating obsidian
  armillary with a glowing crystal core. Used it as Stonehenge's arcane ley-line
  centerpiece (on-brand for the supernatural/conspiracy tone), not as the henge itself.
- **Water as a soft barrier:** `deep_water` is passable (1-step climb onto a height-1
  marble plaza) but inflicts stacking `drowning` (3 turns) unless flying/deep-water-
  adapted (`TERRAIN_RULES.deep_water`). Atlantis uses a deep-water moat around the
  central crystal-spire plaza + 4 cardinal `bridge` runs as the safe chokepoints — a
  soft objective gate the AI won't get permanently stuck on. `bricks_1/2`=marble,
  `gold`=plaza core, `crystal`=spire base (raised to height 2 for verticality).
- All three validated: spawns mutually reachable, ≥95% tiles reachable, terrain/object
  ids in range, grid/heightMap/objects dims == w×h, all files `node --check` clean.

## HD-2D visual upgrade — V1 lighting/shadows/filmic + V2 tilt-shift DoF (2026-07-01)
Team-Asano-style (Triangle Strategy / Adventures of Elliot) render upgrade. Files:
**three-post.js, three-renderer.js, three-camera.js, ui.js** (all on R2 → re-upload).
- **Lighting flip (three-post.js `LIGHT_DAY/NIGHT`)**: was ambient 1.0 + sun 0.3 (flat);
  now warm sun 1.0 (`0xfff0d6`) + hemisphere fill 0.45 (sky `0x9db8e0` / ground
  `0x8a7458`) + cool ambient 0.38. Night = cool moonlight key 0.55. Day/night lerp
  system unchanged.
- **Sun shadows**: `renderer.shadowMap` PCFSoft, enabled in `ThreePost.init`. The sun's
  ortho shadow camera is fitted to the board by **`ThreePost.setShadowFrame(cx,cz,r)`**
  (called at the end of `rebuildTerrain`); `_applyCurrent` parks the sun at
  `center + dir·max(r·1.8, 900)` with a target at board centre. Meshes opt in via
  **`_applyShadowFlags(group)`** (three-renderer): traverses terrainGroup after
  `rebuildTerrain` and objectGroup whenever `_objDirty` in `renderFrame`; opaque
  Lambert/Standard/Phong cast+receive, opaque Basic cast-only, alpha-cutout casters get
  a cached `MeshDepthMaterial` (`_getCutoutDepthMat`, keyed per texture — do NOT create
  per-mesh, rebuilds run constantly). Skips `_ew_billboard/_ew_silhouette/ShaderMaterial`.
- **Unit sprite shadows**: billboards would cast slivers when viewed edge-on from the
  light, so each unit gets an invisible **shadow-proxy plane** (`_ew_shadowProxy`,
  colorWrite:false + depthWrite:false, `raycast` no-op so it can't block unit picking)
  that faces the sun (`ThreePost.getSunAzimuth()`, re-aimed in `_updateBillboards`) and
  casts via the cutout depth material. Built next to the sprite in `rebuildUnits`.
- **Filmic tone**: ACESFilmicToneMapping by default (`ew_filmicTone`), Linear when off.
  Exposure is multiplied by `FILMIC_EXPOSURE_COMP` (1.22) when on. Toggling recompiles
  all scene materials (`_recompileSceneMaterials`) — tone mapping + shadow defines are
  baked into programs. NOTE r128 applies tone mapping inside the composer's RenderPass
  (that's why the Brightness slider already worked), so ACES works through the chain.
- **Tilt-shift DoF (V2)**: two `_TiltShiftShader` ShaderPasses (H+V separable gaussian)
  between bloom and FXAA. Sharp band (±0.13 uv, feather 0.30) tracks the camera focal:
  **`ThreeCamera.getFocalWorld()`** (new; returns the smoothed look-at) is projected in
  `ThreePost._updateDofFocus(cam)` each frame and damped (0.12/frame), clamped 0.22–0.82.
  Strength slider = `setDofStrength(0..1)` → blur px = 5·s (`ew_dofStrength`, default
  0.45, 0 disables the passes).
- **Pause menu (ui.js `_buildPauseVideo` Graphics group)**: Filmic Tone toggle,
  Shadows Off/Low/High seg (`setShadowQuality`, 1024/2048 map, `ew_shadows`),
  Tilt-Shift slider. All persisted; verified rendering in-game.
- **Verified** via LOCAL_ASSETS harness (scratchpad visual_smoke*.js pattern: pin the
  camera by setting `GAME._camera` x/y/zoom/tilt on an interval — `camera.moveTo` opts
  zoom is ignored mid-battle): shadows on/off diff visible, DoF max/off diff visible,
  pause Video tab renders, 0 page errors. Shots: `shots/v1v2-*.png`. Swiftshader is too
  slow for the day↔night lerp to finish in a screenshot window — night values eyeballed.
- **Gotchas for future edits**: any NEW mesh type added to terrainGroup/objectGroup gets
  shadows automatically on next rebuild (traversal is idempotent via `_ew_shadowFlagged`).
  A new always-on ShaderPass must update `uResolution` in `resize()`. If units ever stop
  casting, check the proxy wasn't dropped when sprite creation branched (bat swarms skip
  proxies intentionally).

## Sun/moon god rays V2 (2026-07-02)
- `three-renderer.js` `_buildLightRays`/`_updateLightRays` rebuilt. The V1 shafts were
  effectively invisible: the fragment shader's radial falloff ran on RAW local px
  (`length(position.xz)*2` vs a smoothstep to 1.0 → lit only a ~1px core), and the
  vertical profile used `vLocal.y+0.5` on a ±1100px range. V2 normalizes via
  `uW`/`uH` uniforms.
- 8 shafts (2 wide "heroes"), stratified across the board, each anchored to a ground
  landing point (`tileTopY`) with an additive elliptical **light pool** + ~14–26
  drifting **dust motes** (Points, local space so they ride the lean). Beams lean
  along ThreePost's key-light dirs (LIGHT_DAY `(-0.55,1.05,-0.42)` / LIGHT_NIGHT
  `(0.4,1.1,0.3)`) blended by the smoothed night factor, so they rake opposite the
  cast shadows and swing to the moon side at night; gold ↔ silver-blue color lerp,
  blood-moon tint, eclipse kill. Pools stay anchored while tops sway.
- **Light Rays slider** in pause Video tab (between Ambient FX and Bloom):
  `ThreeRenderer.setLightRayStrength(0..1.5)` (`ew_lightRays`, default 1.0, 0 hides
  the group). Verified in-game via LOCAL_ASSETS harness: 16 group children render,
  day gold + night silver visible, slider row present and drives the API, strength 0
  → `group.visible=false`, 0 page errors.

## Ambient atmosphere — dust motes (day) + fireflies (night) (2026-07-02)
V3 slice, in **three-vfx.js** (+ an "Ambient FX" slider in ui.js Graphics). Two
GPU-animated `THREE.Points` clouds (flagged `_ew_ambient`), fully shader-driven
(layered sin/cos wander + per-particle firefly blink off `uTime` — no per-frame CPU
position writes; 2 draw calls total). Wiring:
- `_ambientTick(dt)` runs from `ThreeVFX.tick` (alongside `_rainTick`); builds lazily
  in battle when `bw()×bh()×tileSize` changes (key `_ambKey`), placing particles above
  per-tile terrain via `_rainTileTopY`. Motes ≈ area·1.1+30 (cap 420) at 0.25–2.3 ts
  above ground; fireflies ≈ area·0.45+12 (cap 180) hugging 0.2–0.95 ts.
- Day/night crossfade: own dt-lerped `_ambNight` off `body.dataset.cycle` (NOTE: the
  three-post light presets lerp per-FRAME at fixed 0.016 — under swiftshader they crawl,
  while this one uses real dt but is still bound by the renderer's 0.05s dt clamp).
  Motes opacity 0.5 → 0.125 at night; fireflies 0 by day → 0.95 at night.
- **Slider**: `ThreeVFX.setAmbientDensity(0..1)` (`ew_ambientFx`, default 0.6, 0=off).
  Density gates per-fragment via each particle's `aRand` → thins smoothly, no rebuild.
- Verified in-match: clouds build (8×8 → 100 motes + 41 flies), density 0 hides both,
  fireflies visible as glow specks when forced all-on (`uBlink=0` via scene traversal —
  a handy debug trick since blink keeps most dark in any single frame). 0 page errors.
- Gotcha: firefly colour reads cyan-green over blue stone (additive) — tune `colorA/B`
  in `_ambientTick`'s build opts if a warmer look is wanted.

## Unit facing + back/flank attacks + follow-ups (2026-07-02)
New tactical layer in **battle.js + three-renderer.js** (both on R2 → re-upload).
- **Facing model**: `unit.facing = {dx, dy}` normalized board-space vector (continuous
  360°; grid moves naturally quantize to 8 directions). Lazy default = toward nearest
  enemy (`getUnitFacing`). Setters: `doMove` (last path step), `doJump` (leap dir),
  `doAttack`/`doSpell`/`doComboAttack` (square up on target; self-casts keep facing).
  Exported on `GAME`: `getUnitFacing/setUnitFacing/getAttackArc/getFacingDamageMult`,
  `FACING_BACK_DMG_MULT` (1.25) / `FACING_SIDE_DMG_MULT` (1.10).
- **Arc rule** (`getAttackArc(attacker, defender)`, dot of attack travel dir vs
  DEFENDER facing): ≥0.70 → `'back'` (+25% dmg, **cannot be dodged or countered** —
  `doAttack` skips `rollEvasion` and the `rollCounter` gate); ≤−0.70 → `'front'`
  (no bonus); else `'side'` (+10%). Diagonal-behind counts as back (FFT-style).
  Applies to BASIC attacks (any range — arrows to the back get it too); spells/combos
  unaffected. Logs `🗡️ BACKSTAB!`/flank lines + floating text at impact.
- **Follow-Up Attack**: melee hit (d===1) that LANDS (not dodged, target survives)
  while an ally stands on the target's exact opposite tile (`target + (target−attacker)`,
  |Δz|≤1, not invisible/move-blocked) → that ally strikes free ~650ms later
  (counter-formula dmg ×facing mult, no AP, `XP_FOLLOWUP` 4, `_matchFollowUps`).
  Follow-up is itself facing-aware AND dodgeable from front/side — a pinned target
  facing its attacker eats an undodgeable backstab follow-up; one facing the ally can
  dodge it. Lives in `doAttack`'s impact callback right after the counter block.
- **Renderer (three-renderer.js)**: unit sprites **no longer billboard the camera** —
  `_updateUnitFacing()` (every frame, after `_updateBillboards` in renderFrame) yaws
  the sprite slab + a team-colored **wedge on the selection ring**
  (`_ew_facingIndicator` wrapper group; wedge tip = facing) to
  `yaw = atan2(f.dx, f.dy)`; while a walk tween runs the unit faces its current path
  segment. Sprites keep `_ew_billboard` (opacity/shadow sweeps) plus new
  `_ew_facingSprite` flag — the camera-billboard pass skips those. Bat swarms,
  ghosts, deployables still camera-billboard. `UNIT_SPRITE_DEPTH_PX` 10 → 8. The
  ring wedge is the ONLY facing cue (an earlier "BACK" text tag on the rear cap was
  dropped as too noisy).
- **X-ray silhouette self-paint fix (IMPORTANT — non-billboard side effect)**: the
  blue/red hologram shown when a unit hides behind terrain (`_ew_silhouette`,
  `depthFunc GreaterDepth`, "paint only where occluded") is NOT gated by an
  occluded flag — it relies purely on the depth test to hide itself. Once sprites
  stopped billboarding, a unit facing AWAY put its own extruded back cap in FRONT
  of the coincident silhouette plane, so GreaterDepth self-triggered and painted
  the hologram onto the unit's own back. Fix: the silhouette is now a child of the
  GROUP (not the yawing sprite) and `_updateUnitFacing` keeps it **camera-facing and
  nudged camera-ward of the slab** each frame (offset `UNIT_SPRITE_DEPTH_PX·(ts/128)
  + ts·0.02`), so the unit's own slab never occludes it — only real terrain
  occluders do. A fixed local-z offset can't fix this (the slab is symmetric around
  the plane, so one facing always self-occludes); the offset MUST be camera-relative
  (world), hence the reparent. Loses sprite bob/flip/shake inheritance on the ghost
  (cosmetic, acceptable). Don't reparent it back under the sprite.
- **Verified** (scratchpad facing-verify*.js / back-verify.js via LOCAL_ASSETS): arc
  table incl. diagonals + ranged; doMove sets facing; forced-RNG backstab = +25%, no
  dodge, no counter; front attack still dodgeable; follow-up fires (front-facing
  target dodges it, back-facing target can't); 8/8 sprites yawed, 8 wedges; after the
  polish pass — 0 BACK labels, silhouette reparented to group (8/8, offset in front),
  a unit staged back-to-camera shows clean art (no tint/text), 0 page errors.
  Screenshot recipe: `deviceScaleFactor: 2.5` context + clip around
  `ThreeRenderer.worldToScreen(x,y,40)` beats fighting the auto-zoom clamp.
- **NOT done / follow-ups**: AI (ainew.js/ai.js) is facing-blind — it neither seeks
  backstabs nor protects its rear (human players get a free edge; a scoring term for
  attack arc + end-of-turn facing choice would fix it). No UI to choose end-of-turn
  facing (FFT-style). Counters don't turn the defender around. `_spriteFlipX` travel
  flip still applies on top of facing yaw (only race move-sprites use it).

## Per-unit light sources restored (2026-07-03)
- `three-post.js` `rebuildUnitLights`/`_updateUnitLights` (+ constants `UNIT_LIGHT_*`):
  every alive unit carries a warm PointLight (0xffe0a0, dist 320, decay 1.6, 64 above
  the sprite's surface). Was night-only + static; users perceived it as "removed"
  because day rounds showed nothing and the night glow was subtle. Now: always built
  (day 0.45 / night 1.7 intensity, chosen per-frame off `body.dataset.cycle` so a
  mid-match day↔night flip needs NO structural rebuild), flickers, and re-anchors to
  the unit's current tile every frame (stored `unit` ref + `unitSurfaceY` fn), so the
  glow follows moves instead of waiting for the next `rebuildUnits()`.
- Wiring: `three-renderer.js` `rebuildUnits()` (~line 5071) calls
  `ThreePost.rebuildUnitLights(state.units, unitSurfaceY, tileSize)`; per-frame update
  runs inside `ThreePost.render()`. Cycle = `getCurrentCyclePhase()` (map.js): odd
  round day, even round night; the HUD render stamps it onto `body.dataset.cycle`.
- Probe trick used to verify: fast-forward to round 2 by zeroing each active P1
  unit's AP + `endUnitIfDone`, then keep pumping `maybeAdvanceTurn`/
  `maybeTriggerComputerTurn` — the HUD only stamps `dataset.cycle` while renders flow.
  `ThreeRenderer._scene` getter is exported for scene-graph inspection.

## Turret rework: laser-mark model + first-placement texture fix (2026-07-03)
Files touched: `three-renderer.js`, `three-vfx.js`, `three-vfx-effects.js`,
`battle.js`, `state.js`, `data.js`.
- **First-placement texture bug (turrets + 5G towers) FIXED**: three r128's
  `Texture.clone()` copies the `image` ref at clone time, so `_turretMetalTex`
  clones made while metal/aluminium.png was still downloading stayed blank forever
  (a SECOND placement forced a rebuild that cloned the now-loaded base — hence
  "placing another one fixes it"). Fix: `getTexture` now queues `onLoad` callbacks
  on in-flight textures (`_ew_pendingLoads`), and `_turretMetalTex` registers a
  callback that zeroes `_lastTurretSerial` → `rebuildTurrets()` re-clones once the
  pixels land. Same trap exists anywhere else that clones a maybe-unloaded texture.
- **Turret model/behavior now mirrors the Headshot laser mark**:
  - Renderer `_updateTurretAim()` (every frame, before `_updateLaserSightBeams`):
    each non-5G turret arm smoothly yaws toward the closest living enemy in
    Manhattan range (ties → lower HP, matching the shot's pick), using unit VISUAL
    positions so it rides walk tweens; fog-hidden meshes are never tracked. Locked
    targets get a red targeting laser from the muzzle — `_updateLaserSightBeams`
    was refactored to endpoint-based entries (`'tur:'+id` keys) shared with the
    sniper beams. `facingAngle` was REMOVED from `_computeTurretSerial` (renderer
    owns aim; serial rebuilds would fight the per-frame rotation); arm yaw is
    carried across hp-change rebuilds. World yaw convention: `atan2(dxWorld,
    dzWorld)` points local +Z; tile-space `facingAngle` converts via
    `atan2(cos θ, sin θ)` — the old `-facingAngle` mapping was simply wrong,
    which is why arms never pointed at targets.
  - New arm build: metal-clad housing + twin barrels with muzzle collars + red
    emitter lens. Barrels/lens live in a nested PITCH group (`g._ew_pitch`, the
    trunnion at `g._ew_pivotUp` above the group origin) that tilts up/down at the
    target's chest (`rotation.x`, NEGATED — positive x-rotation tips +Z down in
    three.js; clamped ±1.45 rad so near-vertical shots at close flyers still
    align). The laser origin is computed ON the pitched barrel axis
    (`_ew_muzzleFwd` along yaw+pitch), so beam and barrels are collinear — dot
    product of (pivot→lens) vs (pivot→laser-dot) measures 1.0000 on ground
    targets, 0.9994 vs a bobbing flyer.
  - Battle: turret damage MOVED from turn-start (`processTurnStartTowerDamage`,
    now a no-op passthrough) to the end-of-round sequence — `processTurretVolleys`
    runs right after `processDelayedSpellDetonations` in `maybeAdvanceTurn` (one
    extra `});` in that closer stack). Camera to the sight line → `_turretBlast`
    beam (now `laser-red` sprite, added to three-vfx.js tints+gradients; impact
    swapped to laser-red slashes + embers) → damage. Old `processPlayerTurrets`
    (dead code — never called) was deleted. `_turretBlast` S-map now also has an
    `impact` mapping.
  - Headshot detonation (`_detonateDelayedSpell`, state.js) now plays a hit: a
    themed beam down the sight line + `fire('impact','headshot')` (muzzle flash /
    steel sparks / blood — the mapping existed but was never fired on the delayed
    path) + `playSfx('gun')`.
- Drive-by fog fix: turret visibility checked `turret.player` (undefined — turrets
  store `owner`), so your own turrets could vanish under fog.
- **Verified** (scratchpad verify_turrets.js via LOCAL_ASSETS, 12/12 checks): metal
  sprite delayed 4s via a route registered AFTER installAssetCache (last route wins;
  `route.fallback()` chains to the cache) → first turret self-heals its texture;
  arm yaw correct for 3 enemy positions; turret + sniper lasers coexist (probe
  `scene.children` name `laserSights`); round-end volley fires + damages; headshot
  lands with impact; barrel/laser collinearity + pitch-up vs an elevated flyer
  (test hack: `SKY_RACES.push(mark.race)` then `mark.z = getHeightAt(x,y)+3` —
  plain `unit.z` is IGNORED by `unitSurfaceY` unless `isUnitAirborne`, i.e. the
  race canFly); 0 page errors. Gotchas: freeze BOTH controllers to 'local' or
  live AI moves units mid-assert; teleporting units OFF-BOARD kills the render loop
  (`_getSubmersionDepth` throws on undefined terrain and `setAnimationLoop` dies —
  symptom: frozen arms, no lasers, one 'replace' pageerror); swiftshader runs ~3fps
  so lerp-settle waits need ~2.5s; zoom via `state.userZoomScale = 2.4` +
  `camera.snap({x,y,zoom})` (plain `camera.moveTo` zoom gets clamped/reset).

## Competitive balance pass #1 (2026-07-03)
Full audit of SPELL_LIBRARY (73), RACE_ABILITIES (~370), the mana formula, and the
combat engine. Key structural facts discovered (don't rediscover these):
- **All spell `cost:` fields are dead** — `computeSpellManaCost` (data.js ~6995)
  overwrites every cost at load. Balance mana costs by fixing the FORMULA or the
  raw fields, never the `cost:` numbers. `manaCostOverride` exists but is unused.
- **There are no cooldowns anywhere.** MP+AP are the only limiters. Only
  `oneRevivePerUnitPerMatch` and `maxActivePerCaster` (deployables) restrict reuse.
- **The 200-pt spell budget is dead code**: `getEffectiveEquipCost`/`getLoadoutPoints`
  are stubbed to 0 (battle.js ~8916); `maxCrossClassSpells:6` is never enforced on
  hand-built loadouts; Freelancer can natively equip anything (map.js ~5903).
- **Stun only blocks movement** (blockMove) — stunned units still attack/cast/item.
  `blockAction` is referenced by reshape/altitude code but no status defines it.
- **guaranteedCrit is flavor-only** — spell path never applies a crit multiplier
  (only the AI estimators assume 1.5x). Spells never crit or get dodged at all.
- Statuses NOT in `getStatusApplyChance`'s table applied at 100% (now expanded).

Changes applied this pass (data.js + battle.js + state.js):
- Hard-CC durations capped: empBurst silence/jam 2→1, mindShatter silence 2→1,
  pirate Anchor stun 3→1, succubus Charm 2→1, anubis Canopic jam 3→2, mermaid
  Siren Song 2→1. Rule going forward: hard CC (stun/charm/sleep/freeze/silence)
  never exceeds 1 round from a single cast.
- freeEnergy: 40→20 MP/ally and the caster is now EXCLUDED (battle.js) — it was a
  net-positive team mana printer (cast 35, team gained ~160).
- Mana formula blind spots fixed: cross/line/barrage kinds now priced as AoE;
  executePct, teleportAnyUnit, unholyBonus/actedTargetBonus/repeatDmg/lumberCap/
  sneakBonus now priced; per-status `chance` discounts; hard-CC duration scaling
  steepened (0.55→0.9/turn); protect 14→20, invisible 9→12, stealSpell 10→18 pts.
  Result: Divine Judgment 35→65 MP, Requiem 30→50, Atomic Breath →55, hostile
  Teleport 15→25, Walk the Plank →65 (execute also 30%→20%).
- Damage outliers: deadEye 256→200, sneakSlash 224→176, timberStrike lumber cap
  +300→+120. Shadow Lunge reworked into the Agent's tactical engage: 128/48 dash
  → 80/24, now applies marked(+40):2 + slow:1, spellType unholy→tech.
- Race revives (necromancer/valkraye) now `oneRevivePerUnitPerMatch`.
- Smoke Screen ally invisibility 2→1 (zone already re-applies each round inside).
- Basic-attack double-count bug fixed: `getEffectiveAttackBonus` was added in the
  attack roll (battle.js ~19698) AND again in `applyDamageToUnit` (~8218) — every
  chaos/killstreak/terrain ATK bonus counted twice for basic attacks.
- Status resist table expanded (state.js): charm/sleep/freeze/sirenSong/stagger/
  slow/glare/discord are now resistible (were guaranteed).
- Stats: chosen one trimmed (mp 238→225, mdef 52→48, int 76→72, spd 11→9);
  homosapien Adrenaline Rush buffed (30% heal, cleanse 2, +1 SPD); faction
  bonuses rebalanced (chaos atk 16→12, space armor 5→8, time heal 24→32).

Open (bigger) recommendations — see the balance-pass chat report: real cooldown
system, enforce the spell-point budget + cross-class cap, make stun block actions
(or rename it Pin/Snare in UI), terrain self-pillar counterplay (reshape needs
LoS-reachable cap or erosion), invisible units shouldn't contest objectives,
race-kit size normalization (kits run 1→8 abilities), spawn protection round.

## Competitive balance pass #2 (2026-07-03) — budget, cooldowns, smash terrain,
## stealth-vs-objectives, spawn guard, AI facing
Files touched (ALL must go to R2 together): **data.js, battle.js, state.js,
map.js, hud.js, ui.js, ai.js, party-builder.js**. Verified via scratchpad
probe (LOCAL_ASSETS route interception): 16/16 checks + 150s auto-sim soak,
0 page errors. User's design answers: stun stays move-only (stun+silence+
stagger together ≈ full stun by design); race-kit normalization deferred.

1. **Slot-based loadout budget (LIVE — replaces the dead 200-pt budget).**
   Every spell occupies **1–3 of the 8 spell slots** (`SPELL_SLOT_MAX`).
   - `getSpellSlotCost(spell, cls?, secJob?)` in **data.js** (exported on
     window): derived from the computed mana cost — `>=60 MP → 3 slots`
     (only the ~16 apex spells: Nuke/Meteor/EMP Burst/Judgment/Overgrowth/
     Dragonfire/…), `>=35 → 2`, else 1. Game-warping utility (grants
     protect/invisible, revives, encore, stealSpell) floors at 2. Explicit
     `spell.slotCost` overrides. Cross-class picks (not native to main job,
     secondary job, or race; Freelancer counts all native) cost **+1 slot**,
     capped at 3. Distribution: 250×1 / 179×2 / 16×3.
   - Enforced at: party-builder `toggleSpell`/default/randomize fills (shows
     ◆ pips per row + used/8 header, red OVER BUDGET row), map.js
     `createUnit` (graceful `trimSpellIdsToSlotBudget` — earlier picks kept,
     non-fitting later picks skipped, old saved parties never brick),
     battle.js `randomSpellLoadoutForClass` + both preferred-fill paths +
     `_doAutoFill` + `learnSpellForUnit` (level-ups), state.js
     `applyRandomSpellsAndSecJob`. `getEffectiveEquipCost`/`getLoadoutPoints`
     un-stubbed (now slot-based).
2. **Sparse cooldowns.** `spell.cooldownRounds` (data.js baseline pass, ~35
   spells): protect/invisible granters 2, stealSpell 3, encore 2, nukes with
   cost ≥80 MP 2. Cast stamps `unit._spellCooldowns[spell.id] = state.round +
   cooldownRounds` (round-stamp, nothing ticks). Gate lives in
   **`canAffordSpell`** (battle.js) so HUD graying, both AIs and doSpell all
   inherit it; doSpell also logs "⏳ X is on cooldown for N more rounds";
   hud.js shows `⏳ CD N` as the row reason. `getSpellCooldownRemaining` on
   GAME. This kills perma-protect/perma-invis without touching power.
3. **Smash terrain.** `_tileIsSmashable(x,y)` (battle.js, exported): raised
   column (h>0) with an exposed face (a cardinal neighbor lower) and no
   unit/tree/building. Basic attack knocks it down 1 level (`smashTerrainAt`,
   removeBlockAt + grid/chunk/panel invalidation + occupant z-fixup).
   Range is measured to the column FACE at the attacker's height
   (min(colH, unit.z), mirrors the building-wall rule in doAttack) so melee
   can smash tall pillars beside them. Still listed in `_getAttackValidTargets`
   (kind:'terrain', sorts after units like trees — the AI and move-then-attack
   depend on it), but 2026-07: HIDDEN from the player-facing menus. The player
   path is now **right-click-hold** (see "Right-click-hold demolition" below);
   hud.js filters kind:'terrain' out of the attackTargets submenu and the tile
   quick-menu no longer offers "Smash Terrain".
4. **Stealth vs objectives.** `channelNexus` (ui.js) clears `invisible`
   (contesting breaks camouflage); CTF flag pickup clears it (battle.js
   checkFlagPickup); `applyStatusPayload` refuses to apply `invisible` to a
   flag carrier; `processNexusIncome`'s enemyInZone ignores cloaked units
   (can't dispute ground while hidden).
5. **Spawn Guard.** New STATUS_DEFS entry `spawnGuard` (`damageTakenMult:
   0.5`) + general `getStatusDamageTakenMultiplier` applied in
   applyDamageToUnit (all damage types, after armor, before shield). All 3
   respawn branches in map.js `processRespawns` grant `{spawnGuard:1}` —
   respawn happens AFTER the round's status tick, so it lasts exactly one
   full round. Kill credit: `_lastDamageSourceRound` stamped on damage; the
   killer fallback ignores `_lastDamageSource` older than 2 rounds (ancient
   chip damage no longer earns environmental kills).
6. **AI facing.** ai.js `scoreAttacks` + `scoreMoveToAttack` multiply by
   `getFacingDamageMult(getAttackArc(...))` (+30 flat for a back arc since
   backstabs are undodgeable/uncounterable); `scoreMoveToAttack` passes the
   HYPOTHETICAL tile `{x,y}` as attacker (getAttackArc only reads x/y). All
   three explicit turn-end sites in `aiTakeTurn` call `_faceNearestEnemy`
   (setUnitFacing toward nearest visible enemy) so the AI stops leaving its
   back open. ainew.js untouched (it delegates scoring to ai.js).

## Zodiac sky system (2026-07 session)
The zodiac/celestial layer got a full visual pass across three-renderer.js,
state.js and hud.js:
1. **Nameplate badges.** `_createPlate`/`_buildClonePlate` embed two always-
   present spans in `.tp-name`: `[data-zbadge]` (unit's zodiac glyph, ignites
   gold via `.tp-zodiac-on` while `getZodiacBonus(u).active`) and
   `[data-evbadge]` (sky-event icon, pulses via `.tp-skyev-on` while
   `getSkyEventBonus(u).active`). `_updatePlateSkyBadges()` (render loop,
   keyed on `activeZodiac|skyEvent.type`) live-toggles them. HUD MatchMeta
   zodiac chip glows (`.ew-zodiac-blessed`) when any living unit matches.
2. **Constellation wheel.** The dome shader's old node-dots/random cluster
   were replaced by real geometry (`_initZodiacWheel` in three-renderer.js):
   12 authored constellations (`_ZW_CONST`) on a camera-anchored ring at 26°
   elevation, faint rim + hub dots + glyph seals; the ACTIVE sign burns gold
   with its star-lines drawn. On a sign change the whole wheel ROTATES the
   new sign into the prime slot (azimuth 0 = yaw-0 camera) — API:
   `ThreeRenderer.getSkyShot(kind)`, `playZodiacReveal({rotMs,drawMs})`,
   `playSkyEventReveal(type)`. A 9s auto-fallback fires the reveal if the
   cinematic never does (auto-sim / banners skipped). New sky events are
   HELD out of the dome (`_envReadState`) until revealed, same 9s fallback.
3. **Sky cinematic.** `showAnnouncementBanner` (state.js) routes kinds
   'zodiac'/'sky' through `playSkyCinematic`: pauses the shot clock, flags
   `camera._busy`, `camera.moveTo` cranes tilt past 90° (getSkyShot ≈122°),
   fires the reveal, flashes the banner mid-tableau, then eases back to
   `camera._restTilt/_restYaw` and calls onDone (hard 9.5s safety net).
   Falls back to the plain banner when animations/camera/renderer are off.
4. **Testing trick.** `USE_ASSET_CACHE=1 LOCAL_ASSETS=three-renderer.js,
   state.js,hud.js node playtest.js …` serves repo-local copies of R2-hosted
   scripts (asset_cache.js) — the ONLY way local edits run in the harness.
   Screenshots stall seconds under swiftshader: time assertions IN-PAGE
   (e.g. waitForFunction on `#announcementBanner.visible`), never by sleep
   +screenshot cadence. Force a zodiac shift in-page:
   `state.zodiacOffset++; checkZodiacRotation(); showNextAnnouncement(()=>{})`.

## Right-click-hold demolition + side-face picking + wall-mounted wards/torches (2026-07-03)
1. **Side-face picking fixed.** `ThreeCamera.screenToTile` (three-camera.js)
   used a bare `floor(hit.point)`, so a click on the EAST/SOUTH wall of a
   raised cube landed exactly on the tile boundary and resolved to the
   NEIGHBOUR. Now the hit point is pushed a hair INTO the surface along the
   face normal before flooring — every face resolves to the struck cube. The
   result also carries `faceNX/faceNY/faceNZ`, `isTerrainHit` (closest hit was
   terrain, not a prop — prop meshes get tagged `_ew_objHit`), and, when a
   horizontal-normal hit straddles a tile boundary, `isSideFace` +
   `sideTileX/sideTileY` = the open tile IN FRONT of the struck wall.
   three-renderer stashes every resolved pick on **`window._ewLastPick`**
   (`_stashPick`) for the consumers below.
2. **Right-click-hold demolition (replaces menu smash).** battle.js:
   `beginTileDemolishHold(x,y,clientX,clientY)` / `cancelTileDemolishHold`,
   `TILE_DEMOLISH_HOLD_MS = 2000` (all on GAME). Right-mousedown on the board
   canvas (three-renderer `_onMouseDown`) starts it in battle phase. Holding
   right-click ~2s on a smashable column OR choppable tree fills a translucent
   conic-gradient dial (`#demolishHoldDial`, fixed at the cursor, 🔨 center)
   then fires plain `doAttack(unit, x, y)` → the existing smash/chop branch
   (1 AP, range/LOS enforced via `_getAttackValidTargets`). Cancels on: mouse
   up, >6px pointer move (that's the right-drag camera pan — both coexist),
   window blur, or any mid-hold validity change (re-validated every rAF).
   Out-of-range / no-AP right-clicks on a destroyable tile show floating text;
   other tiles stay silent (pan gesture). Menus: hud.js attackTargets filters
   `kind:'terrain'` rows and the tile quick-menu "Smash Terrain" entry is gone
   (Chop Tree kept — single row, and trees also work via the hold).
3. **Wards hang on cube walls (Minecraft style).** `doWard` (ui.js): when the
   click that targeted the ward hit a cube SIDE face (`window._ewLastPick`
   matches the target tile, `isSideFace && isTerrainHit`, cube taller than the
   front tile, human player only), the ward is REDIRECTED to the open tile in
   front of the wall and stores `wallD4` (0=N 1=E 2=S 3=W = which neighbour it
   hangs on). `_buildWardTorch(w)` (three-renderer, now takes the ward object)
   applies the same wall transform as editor wall torches; `wallD4` is in the
   deployable serial so rebuilds notice.
4. **Editor torches auto-wall-mount.** `_mePaintCell` (map.js): stamping a
   torch while the click hit a cube side face places the entry on the tile in
   front of that face with `leaf:'wall'` and rot aimed back at the wall —
   no manual Mount+Rotate dance. Top-face clicks keep the palette mount.
5. **Verified** via scratchpad Playwright harness (LOCAL_ASSETS trick): pick
   sweep invariant (side picks always resolve to the taller cube), API + REAL
   right-mousedown hold→smash (height −1, AP −1), move-cancel, menu filtering,
   ward redirect + wallD4, editor wall-stamp, AI smoke run. NOTE for tests:
   freeze the game first (`controllers={1:'local',2:'local'}`, clear
   autoPlayers, force `_blitzActiveUnitId`) and allow ≥3.5s for the 2s hold —
   rAF ticks are slow under swiftshader.

## End-of-round camera director + turn-handoff angle reset (2026-07-04)
User ask: turn-switch pans must always settle at a normal tactical view; the
end-of-round sequence must be one clean, fixed-order camera tour (pan to DoT
victims, turrets get their own action beat, follow the storm vortex, keep the
zodiac/celestial sky crane, frame everything relevant).

**Architecture (battle.js, near `showEndOfRoundOverview`):**
- `eorFocusCamera(x, y, {zoom, duration})` — THE one move every EOR beat uses:
  pan to the point at `camera._restTilt/_restYaw` (the player's resting 2.5D
  angle) and one shared tour zoom. Never re-angles.
- `getEorFocusZoom()` = `getDefaultZoom() * 1.3` (EOR_FOCUS_ZOOM_MULT), user
  wheel-zoom always wins.
- `_eorPhaseLabel(text)` / `_eorPhaseLabelHide()` — small top-center chip
  (`#eorPhaseChip`, inline-styled, lazily created) naming the current beat
  ("End of Round — Status Effects / Turret Fire / Storms / …"; buffered
  round-start groups show their own labels). Hidden by `showRoundBanner` and
  at the end of `playBufferedRoundEvents`.
- All four are exported on `window` — state.js beats (detonations, storms,
  buffered events, weather announcement) call them via `typeof` guards.

**Canonical EOR order** (documented in `maybeAdvanceTurn`, fixed every round):
overview → status ticks (dive per unit, back to overview) → field effects
(zones/seeds/spawn-zones; 1 unit → dive, several → overview) → delayed
detonations (dive each) → turret volleys (per shot: camera on the TURRET
760ms like a unit activation, then glide to the sight-line midpoint as the
beam fires) → homing storms (focus vortex → glide with it → strikes land) →
regen overview → Round banner → buffered round-start groups (terrain
lava/drowning, weather ticks, respawns — each gets a labelled dive via
`_reGroupFocal`, fog-gated) → announcements (weather spawns pan to the
stashed `state._lastWeatherSpawnTiles`; zodiac/sky events keep the
`playSkyCinematic` crane-up — untouched) → pending earthquake (frame
epicentre 440ms BEFORE the shake) → first unit's activation pan.

**Turn-handoff fix:** `_continueBlitzWithUnit_impl`'s AI and REMOTE branches
now pass `tilt/yaw` (pre-cine view if pending, else rest) into the activation
`focusBoardCameraOnTiles` and consume `_preCineView` — previously only human
`selectUnit` did this, so enemy streak → next AI unit could inherit a craned
cinematic pitch. This does NOT touch the in-action cine cam (see the
"REVERTED — DO NOT REDO" section above; the action shot itself is untouched).

**Testing local camera edits** (R2 serves the live scripts, repo edits don't
load by default): `USE_ASSET_CACHE=1 LOCAL_ASSETS=battle.js,state.js` with the
asset cache route hook. Smoke recipe that exercises EOR with ANIMATIONS ON:
start a VS-CPU match, then `st.controllers={1:'ai',2:'ai'};
st.autoPlayers={1:true,2:true}; st.devSimSpeed=4;` (devSimSpeed scales
`actionMs` WITHOUT devAutoSim's visual skipping) and kick
`maybeTriggerComputerTurn()`. Playwright here needs
`executablePath: '/opt/pw-browsers/chromium'` (registry download blocked).
With animations on, one 4v4 round on 12×12 takes >150s — use an 8×8 map card.

## Map-editor Play Test overhaul (2026-07-04) — gaps, action menu, pause, 45° rot, SFX
User reports: playtest fills empty blocks with lava (z0 lava spread into every
authored gap), playtest "breaks" with no action menu, wanted pause/song-change in
the editor, 45°-snapped rotation, and editor SFX. All fixed; files touched:
**map.js, ui.js, profile.js** (all on R2 — re-upload together).

1. **Gap fill (map.js).** `fillVoxelsDown` + `buildColumnsFromVoxels` filled
   missing z-levels with `col[0].terrain` outside the editor phase → lava floor
   solidified every bridge/overhang column at match time. New
   `_authoredVoxelGapsArePreserved()` (phase 'editor' OR activeGameMode
   `_custom_editor`/`_custom_community`) makes both passes fill with `'void'`
   (renderer already skips void bands; solid-mode rendering unchanged).
2. **Walk-under (map.js `getWalkableSurfaces`).** Now filters out `void` blocks
   before computing surfaces → a grass floor under a z3 bridge yields surfaces
   `[0,3]`: units can walk under AND stand on top. canOccupy3D still blocks
   standing on impassable block tops (lava etc.) via the unfiltered getBlockAt.
3. **Action menu / "playtest breaks" (map.js `_mePlayTest`, profile.js community
   loader).** `state.controllers[1] = CTRL.HUMAN` — **CTRL has no HUMAN key**
   (LOCAL/AI/REMOTE only) → P1 controller was `undefined`, engine never treated
   P1 as human, React ActionMenu never rendered. Fixed to `CTRL.LOCAL`. (Same
   bug class as the shot-clock note above — grep for CTRL.HUMAN when touching
   controllers.) NOTE for probes: the React action menu renders **divs, not
   <button>s** — assert on `reactHudRoot.textContent` containing 'END TURN'.
4. **Unpainted tiles were invisible holes in playtest** — `_mePlayTest` exported
   empty voxel columns; the renderer draws nothing for an empty column while
   boardTerrain said 'grass'. Now exports the same `[{z:0, terrain}]` "for show"
   base `_meSyncToState` uses, so playtest matches the editor view.
5. **`_custom_community` maps** never entered the custom-board branch in
   `applyGameMode` (checked `_custom_editor` only) → heights/voxels/objects/
   monuments were dropped. Branch now accepts both ids.
6. **Pause menu in editor (ui.js + map.js).** Esc (and a new ⚙ header button)
   toggles the pause menu while `state.phase === 'editor'`; Match tab hidden
   there (defaults to Audio), subtitle "🗺 Map Editor". New **Song Select**
   jukebox in the Audio tab (`_buildPauseTrackList` + `window._pausePlayTrack`)
   lists every music track; battle keys picked there also seed the shuffle bag.
   `skipBattleTrack` now also works in the editor phase; `_meEnterDioramaEditor`
   sets `audioUnlocked` + `syncMusicToState()`.
7. **45° rotation snap (map.js `_meSetRotValue`).** All rotation inputs funnel
   through it — dial drag, slider (now step 45), nudge buttons (now ±45/±90),
   R/Shift+R (now ±45) — and it rounds to the nearest 45°.
8. **Editor SFX (map.js `_meSfx`).** Palette picks `uiCursorFocus`, tools
   `uiButtonConfirm`, tabs/undo/redo/dial `uiCursorMove`, paint/raise `moveStep`,
   object/monument place `itemThrow`, erase `block`, spawns `uiButtonConfirm`,
   Play Test `uiConfirm`. playSfx's built-in cooldowns stop drag-paint spam.
- **Verified** via scratchpad `verify_editor.js` (LOCAL_ASSETS=map.js,ui.js,
  hud.js,battle.js,state.js,audio.js,three-renderer.js,profile.js): 13/13 —
  rot snap 137→135 / 10→0, pause+jukebox in editor (31 tracks, track switch),
  battle starts with controllers {1:'local',2:'ai'}, bridge column gap = void,
  surfaces [0,3], unpainted tile has z0 grass, action menu renders for P1,
  0 page errors. Screenshot: bridge floats with lava glow visible beneath.

## Horologe action-menu carousel redesign (2026-07-04) — hud.js, battle.js, state.js
User asks: cohesive Persona-style menu, selected button centered+bigger with
neighbours fading out, scroll-wheel cycling, no gap to the clock, instant hide
during walk/spell/camera animations, camera zoom disabled over the menu, crown
"stopwatch" BACK button, submenus matching the main style, bonus AP in green.
All shipped; files touched: **hud.js, battle.js, state.js** (re-upload together).

1. **Carousel drum (hud.js `HorologeMenu`/`HorologeBlade`).** Root blades no
   longer fan at fixed HRLG_ANG angles; `_hrlgSlot(offset)` maps the wrap-around
   offset from the selected index to angle/opacity/scale: center = 3° o1 s1.13,
   one faded blade above (-17°), two below (21°/36°), everything else parks at
   o0. Selection tracked by blade ID (`selId`) so cost/AP re-renders don't jump
   the drum; resets per `unitKey` (unit id). Blade slide-out starts at
   margin-left 88px, UNDER the clock bezel (hub z-index 8 > fan z 2) — no gap.
2. **Wheel = cycle, never zoom.** Native non-passive `wheel` listener on
   `.hrlg-rig` (React onWheel can be passive) preventDefaults + stopPropagations
   with a 90ms notch throttle; state.js's board-zoom wheel handler early-returns
   for targets inside `.hrlg-rig/.hrlg-panel/.hrlg-hub/.hrlg-crown` (no
   preventDefault → panel lists still scroll natively). Clicking a dim
   neighbour rotates it to center (deliberate: no accidental END TURN); only a
   center click fires. The minute hand winds 30°/notch.
3. **Instant hide (hud.js `useMenusHidden` + battle.js `GAME.boardBusy()`).**
   `boardBusy()` mirrors `_waitForAnimationsThen`'s signals: walk flag,
   cinematic, `_dying`, hit/heal flashes, projectile layer, ThreeRenderer
   .hasActiveAnims(), ThreeVFX.hasActiveParticles(), camera.isBusy().
   `_setWalkAnimActive()` mirrors the walk flag onto `state._walkAnimActive`
   (online.js already does this for remote walks) and dispatches
   `ew-state-change` so the hide is same-frame. useMenusHidden re-renders only
   on hidden↔shown transitions (110ms boolean poll + 180ms linger to stop
   strobing). Confirm-clicks (target row 2nd click, enemy quick-cast, END TURN)
   call `window._hrlgNoteAction(ms)` → hides before engine flags even flip.
   ALL four menus (ActionMenu, SubMenu, EnemyActionMenu, TileActionMenu) take a
   `hidden` prop from ReactHUD.
4. **Crown BACK (hud.js).** `.hrlg-crown` stopwatch pusher at 12 o'clock; `live`
   whenever view≠root or an actionMode is armed; click = handleBackAction + the
   minute hand unwinds. The '← Back' rows were REMOVED from every submenu;
   panels instead get a ‹ chip in the header (`.hrlg-panel-back`) + footer hint.
5. **Panel chrome unified.** `.hrlg-panel` CSS now owns the material (blade
   gradient, faction spine via `--hfc` inline vars, angled clip, `.hrlg-panel-
   head/-foot/-stem`); SubMenuPanel, EnemyActionMenu and TileActionMenu all use
   it — pass `'--hfc': fc` etc. inline when adding a new panel.
6. **Bonus AP.** Pips past base 3 (`UNIT_MAX_AP`) get `.bonus` → green #6ee2a8;
   the max number renders as its own span, green when maxAP>3 (x/4, x/5).
7. **CSS gotcha:** blade entrance anim must be `animation-fill-mode: backwards`
   NOT `both` — a filling animation overrides the transform/opacity transitions
   and the drum snaps instead of gliding. Erupt keyframes end on `var(--o)`.
8. **Playtest-harness gotchas (verify scripts in scratchpad):** headless Chrome
   intensive-timer-throttling clamps setInterval to ~1Hz after ~5min — launch
   with `--disable-background-timer-throttling --disable-backgrounding-occluded-
   windows --disable-renderer-backgrounding`. Do NOT spam maybeAdvanceTurn while
   waiting for the menu: each call re-enters `_continueBlitzWithUnit` → banner/
   camera busy loops forever and the menu (correctly) stays hidden. Just wait;
   assert on `GAME.boardBusy()===false && document.querySelector('.hrlg-rig')`.
- **Verified** via scratchpad verify_menu.js/verify_menu2.js with
  LOCAL_ASSETS=hud.js,battle.js,state.js: carousel cycles (Attack→Combo→…→END
  TURN wrap), zoom unchanged after wheel-over-menu, Abilities/Items/More panels
  + enemy/tile quick menus all in horologe chrome with live crown, crown returns
  to root, menu hides ≤1 frame after doMove/END TURN and returns ~1.9s later
  when the board settles, AP shows ◆◆◆ gold + ◆◆ green and "5/5" with green max,
  0 page errors.

### v2 (same day) — straight drum + EVERY menu is the carousel (hud.js only)
User feedback on v1: rotated blades "look like eyelashes"; submenus were still
"plain boring boxes". v2 (only hud.js changed; battle.js/state.js unchanged
from v1):
1. **Straight stack hugging the bezel.** Blades no longer rotate. `_hrlgSlot`
   maps carousel offset → `--tx/--ty` translate: rows stack at 44px pitch and
   each row's left edge follows the circle (`tx = √(97² − ty²) − 14`), so the
   selected center row rides the equator and protrudes furthest. Same
   fade/scale slots (1 above, center big, 2 below).
2. **One carousel for EVERYTHING.** SubMenu, SubMenuPanel, TargetRow,
   EnemyActionMenu, TileActionMenu components are DELETED. ActionMenu now
   builds blade lists per view via `_hrlgSpellBlades/_hrlgItemBlades/
   _hrlgMoreBlades/_hrlgSwitchBlades/_hrlgPingBlades/_hrlgOrientationBlades/
   _hrlgTargetBlades/_hrlgEnemyBlades/_hrlgTileBlades` — all render through
   HorologeMenu/HorologeBlade. The quick-menu executor + 3D move-arrow
   previews moved to module scope (`_fireEnemyAction`, `_showMoveArrowPreview`,
   `_clearMoveArrowPreview`, `_predictTargetShove`, `_actionPlanArrowColor`);
   `_computeEnemyActions`/`_computeTileActions` unchanged.
3. **View tab.** `.hrlg-view-tab` — a skewed banner riding the top-right of
   the bezel — names the open view (✦ ABILITIES 6/6, ⌖ CYBORG 100% 9t,
   ⬚ Tall Grass F10·h6·1t) so you always know where you are.
4. **Blade item model** (HorologeBlade): `power{v,color}`, `mp`, `cost` (AP
   pips), `count`, `meta{text,color}`, `note` (amber MOVE→CAST), `sub` (red
   reason), `check` (pending ✓), `hint`, `iconColor`, `forceLive`, and
   per-item `fire/hoverIn/hoverOut` (tooltips + range/arrow previews).
   Target pickers keep the two-click confirm: first click centers + ✓,
   second fires (with instant menu-hide).
5. **Rich detail lives in the hover tooltip** (showSpellTooltip) — center-
   hover a spell blade to see desc/range/status like the old cards.
- Verified same harness: root drum straight + hugging (tx 83/72/27 at
  ty 0/±44/±88), items "❖Items2", more "…More8" (Guard centered, 2 AP hint),
  enemy quick "⌖Cyborg 100% 9t" with Dead Eye + dmg previews + reasons, tile
  "⬚Tall Grass", END TURN instant hide, 0 page errors.

### v3 (2026-07-04) — no-wrap ladder, verb order, type badges, red crown, pushers, vitals (hud.js only)
User feedback on v2: wrap-around confusing, verb order scrambled, BACK too
subtle, special actions buried in More, type badges missing from spells, wanted
HP/MP under the watch. All shipped; ONLY hud.js changed:
1. **No wrap.** `_hrlgOffset(i, sel)` is now plain `i - sel` (ladder, not loop);
   `cycle()` clamps at 0/len-1 and plays a 4px translateY bump on the rig at the
   ends. `_hrlgSlot(off, rowH)` shows a symmetric window (±2 rows, op .5/.22)
   and takes a row pitch (44 normal, 58 for badge rows). `▲/▼ N MORE` markers
   (`.hrlg-more-ind`, inline `top` from ±2.55·rowH) + `⭥ sel/len` readout in
   `.hrlg-scroll-hint` show off-window items.
2. **Root order is declaration order** — Move › Attack › Abilities › Combo ›
   Items › More › END TURN. HRLG_ANG + the angle sort are DELETED.
3. **Crown = big red arrowed BACK** (◀ in the cap, "◀ BACK" label, #ff5e70
   family). Same live/pulse behavior.
4. **Bezel pushers** (`.hrlg-pusher`): ActionMenu builds `pushers[]` (Channel
   Nexus ⬡ cyan / Detonate 💣 red / Enter Building 🛗 amber) ONLY when usable
   right now; HorologeMenu mounts up to 3 at bezel angles −33°/−63°/+33°
   (slot math inline, hub center 103,240 in rig coords), root view only. They
   pulse + ring-ping; click strikes the clock hands onto the pusher's angle
   then fires. Actions stay duplicated in More.
5. **Move+action-aware greying**: Attack uses `attackHasReachableTarget` →
   stays lit with an amber MOVE→ATK note; Abilities root blade greys (new
   `.ghost` class = grey but clickable via forceLive) when `abilSub` set.
6. **Type badges on spell blades**: `badges[]` on the blade item → `.tall`
   blade (54px) with a second `.hrlg-badges` row: spellType chip
   (typeBadgeStyleFor), PHYSICAL/MAGIC/UTILITY (spellDeliveryBadge),
   ⚔ MELEE / ⤢ RANGED (spellRangeBadge), plain RNG n + T·tier.
7. **Vitals** `.hrlg-vitals` HP/MP bars (green/amber/red HP tint, cyan MP)
   between the AP row (b102) and the mode line (moved b82→b56).
8. **Keyboard**: ArrowUp/Down cycles, Enter fires center blade (disabled in
   aim views); listeners guard INPUT/TEXTAREA/SELECT focus.
- Verified via scratchpad menu_visual_test.js (LOCAL_ASSETS=hud.js): 9 down-
  scrolls stop on END TURN (no wrap), 9 up-scrolls stop on Move, ArrowDown×2
  = Abilities, badge row text "HUMAN PHYSICAL ⚔ MELEE RNG 1 T·I", crown click
  → root, forced st.bombs → 1 DETONATE pusher at 11 o'clock, vitals 913/913 +
  250/250, mode label intact, 0 page errors.

### v4 (2026-07-05) — inline badges, SMT description bar, HUD scale setting (hud.js + ui.js)
User feedback on v3: type badges too tiny at 1080p, hover-tooltip disliked,
whole clock menu too small on desktop / too big on phone. All shipped:
1. **Badges are INLINE with the name now.** `.hrlg-2line`/`.hrlg-line1` are
   GONE — badge blades are single-row: glyph · name (flex:0 0 auto, never
   shrinks, maxWidth 220) · `.hrlg-badges` (shrinks/clips first) ·
   `.hrlg-spacer` · right chips. Badge font 11px pad 2px/8px (was 7px) via
   `_hrlgSpellBadges(sp, cat, compact)` — shared builder; compact=true (type
   chip only) used by the enemy/tile quick menus, which now ALSO carry badges
   + `spell:` on their blades. `.tall` blade = 46px × 560px wide, pitch 52.
2. **SMT-style description bar** replaces the mouse-follow tooltip.
   `#ew-spell-descbar`: fixed bottom-center strip (min(1160px,96vw)), black
   fill + gold/holo-blue 1px hairlines, both fading at the ends; shows name /
   type chip / desc / DMG-Range-MP-AP-tier / status line. It always describes
   the drum's SELECTED blade — HorologeMenu calls `_setSpellDescBase(selSpell)`
   DURING RENDER (a mount useEffect provably lagged: passive effects didn't
   flush until the next state change → bar missed the menu-open frame; the
   `sp === _descBarShown` guard makes the render-path call free). Hover still
   overrides via the old names `showSpellTooltip`/`hideSpellTooltip` (kept so
   every hoverIn/hoverOut call site works; battle.js's same-named legacy fns
   are shadowed because hud.js loads later). Cleared on menu unmount +
   unmountReactHUD.
3. **HUD scale.** `--ew-ui-scale` on :root drives `.hrlg-rig` and the desc
   bar (transform scale, corner-anchored). `_applyUIScale()` in ui.js (near
   _saveParticleSettings) = device base (≤760px→0.68, ≤1100px→0.85, else
   1.22 — the old hrlg media queries are DELETED, JS owns it now) × pref from
   localStorage `ew_uiScalePref`; runs at load + on resize. Pause menu →
   Video → Display has a "HUD Size" seg row (XS .72 / Small .85 / Normal 1 /
   Large 1.15 / Huge 1.3) calling `window._setUIScalePref`. Per-device by
   nature of localStorage — phone remembers Small, desktop Normal.
- Verified via scratchpad uitest.js (USE_ASSET_CACHE=1 LOCAL_ASSETS=hud.js,
  ui.js): 1920×1080 → scale 1.220, abilities drum shows "Pistol Whip HUMAN
  PHYSICAL ⚔MELEE RNG 1 T·I", bar shows Pistol Whip desc on OPEN (not just
  hover), wheel-scroll re-points bar to Double Pump, pause HUD-Size Large →
  1.403; 690×400 → 0.680, everything fits, bar wraps to 2 rows. 0 pageerrors.
  Gotcha: `.hrlg-rig` can be absent for long stretches (AI turns / menu
  hidden) — tests must poll for it and retry the open, not sleep-and-hope.

### v4.1 (2026-07-05) — user corrections to v4 (hud.js + ui.js)
Feedback: ONLY the TYPE badge should be name-sized (delivery/range were
shouting), blades reached past mid-screen, scoreboard text still tiny, phone
HUD ate the whole screen. Fixes:
1. **Badge hierarchy**: type badge stays 11px; PHYSICAL/MAGIC/UTILITY and
   MELEE/RANGED chips dropped to 8px @ 0.85 opacity (`_HRLG_SUB_FS/_PAD` in
   `_hrlgSpellBadges`). RNG n / T·tier chips REMOVED from blades (the desc
   bar shows exact range/tier). `.tall` width 560 → 440 — right edge lands
   ≈815px at 1.22 on 1920, safely inside mid-screen.
2. **Scoreboard/meta text bump** (kept panel size): mode label + score
   caption 7→10, TIME/ROUND labels 6→8, clock 13→16, /limit 9→11, team name
   10→13, ALIVE sub 8→11, tower hp 7→9, MatchMeta 9→11 (zodiac 13→15, ☰
   14→16), combat log 9→10 (header 7→9).
3. **--ew-hud-scale** (second root var): scales the FIXED panels together —
   `.ew-unitpanel` (new class on ActiveUnitPanel; ClipPanel spreads props so
   className passes through), `.ew-scoreboard` (needs `!important` — inline
   translateX(-50%) — origin 50% 0), `.ew-matchmeta`, `.ew-combatlog`,
   `#battleMinimap` (three-renderer DOM, plain CSS hits it), and
   `.battle-subtitle-text`. Formula in _applyUIScale: clamp(0.45..1,
   min(w/1500, h/760) × pref(0.75..1.25)) → 1 on desktop (panels unchanged),
   ~0.46 on a 690×400 phone. Action-menu var is now continuous TOO:
   clamp(0.4..1.35, min(w/1574, h/885)) × pref → 1.22 @1080p, 0.44 on phone
   (the v4 width-only steps left phone HUDs enormous — height matters).
- Verified same harness both viewports: desktop blades "Pistol Whip HUMAN
  physical melee" (big/small mix), scoreboard legible, subtitle untouched at
  hud-scale 1; phone 0.438/0.46 — board actually visible, subtitle tiny,
  minimap/log/panels all shrunk. 0 pageerrors.

## Signature 3D spell cinematics (three-vfx-effects.js) — 2026-07-04
A "SIGNATURE 3D SPELL CINEMATICS" section now lives in three-vfx-effects.js
(just above `_spell3DGeometry`). It's an anime-style set-piece layer built from
three.js geometry + procedural canvas textures (no new image assets, no new
script files). **To give a spell a cinematic, add an entry to
`_spell3DGeometry` choosing a builder + palette — do not write bespoke code.**

Toolkit (all exported on `window.ThreeVFXEffects` as `sig*`):
- `_sigMagicCircle3D(tx,ty,opts)` — spinning double rune disc (floor or sky via
  `height`), `_sigShockRing3D`, `_sigSpeedBurst3D` (anime speed lines),
  `_sigLightPillar3D`, `_sigCrescentSlash3D`, `_sigScreenFlash(color,ms,peak)`
  (DOM overlay), `_sigSparks` (routes through the existing particle pool).
- Hero builders: `_sigStandSword3D` (stand-summon greatsword: circle → blade
  materializes → plunge → shockwave/crescents/sparks → embed → dissolve;
  `bladeTex`/`guardTex` pick the pixel sprite, `hologram:true` for energy
  blades), `_sigStandFist3D` (stone-golem fist slam: rock.png blocks + gold
  knuckle plates + additive aura shell), `_sigUFO3D` (real 3D saucer clad in
  metal.png like the turrets: lathe hull, glass dome, chasing rim lights,
  tractor cone; swoops in, hovers, blasts off), `_sigStormStrike3D`,
  `_sigJudgmentSword3D` (timing derived from the spell's descentMs so the
  blade lands exactly with the damage).
- PIXEL AESTHETIC: hero objects are clad in the game's own R2 terrain sprites
  via `_sigTerrainTex(file, repX, repY)` (NearestFilter + RepeatWrapping +
  flat tint — the exact tree/turret recipe). Palettes used: obsidian.png =
  lava-cracked dragon blade, gold.png = judgment blade, metal.png = steel
  blades/fittings/saucer hull, rock.png = golem fist. Blade UVs are rescaled
  to board texel density (1 sprite repeat per 128px) via `_sigScaleUVs` —
  ExtrudeGeometry UVs are raw shape-space px and read as noise otherwise.
- Infra: `_sigRun` (self-disposing rAF runner, caps 20 concurrent sig effects),
  `_sigTex` (cached procedural canvas textures), easings.

Wired staples: dragonSlash/guardSlash/sneakSlash/sentaiRedSlash/
raceSyntheticBlade (sword variants), reallyGoodPunch (fist), judgment +
raceDivineJudgment (golden heaven sword + light pillar), thunder1 (sky rune
circle + impact shock), meteor (rune circle during fall + impact ring/flash),
divineIntervention, exorcism, mindShatter, fire2, heal1, raceCropCircle (3D
saucer replaces the flat ufo sprite; ring/shaft sprites kept),
raceAbductionBeam (saucer hovers over the existing 3D beam).

Gotchas learned:
- `fire('impact')` now SKIPS `_spell3DGeometry` when the spell also has a
  descent mapping (descent pipeline already fires it — prevents double spawn).
- Descent pipeline calls `_spell3DGeometry[spellId](tx,ty)` at descent START
  (after telegraphMs); impact-synced extras must self-delay by descentMs.
- Verified via standalone Playwright harness (stub CONFIG/state/ThreeVFX +
  local three.min.js r128; game scripts load from R2 so local playtest can NOT
  see repo edits): all effects fire through the real dispatcher with 0 errors
  and scene children return to baseline (no leaks).

## Signature Arsenal — real 3D weapon/anatomy rigs (2026-07-05) — three-vfx-effects.js, three-renderer.js
Full rework of the "goofy" sword/fist plus 8 new weapon rigs, all built with the
tree/turret recipe (R2 pixel terrain sprites, NearestFilter, flat tint +
additive glow accents). Everything lives in the SIGNATURE ARSENAL section of
`three-vfx-effects.js` (search that phrase); the persistent Tesla coil model is
in `three-renderer.js` (`_buildTeslaCoil3D`, called from the deployed-objects
render loop).

What exists now:
- **Greatsword v2** (`_sigBuildSword`): slim tapered blade w/ profile curve,
  edge-grind bevels, glowing energy fuller + runic strip, swept twin-quillon
  guard, wrapped grip w/ rings, faceted pommel. Judgment descents still plunge.
- **`_sigSlashCombo3D`** — THE sword fix: chained real swings (wind-up →
  accelerating arc w/ 2 lagging afterimage blades → crescent + sparks →
  reposition), heavier finisher w/ shock ring + flash. Wired: dragonSlash (3
  cuts), guardSlash (2), sneakSlash (3 fast), sentaiRedSlash (X-cross),
  raceSyntheticBlade (holo 3). Slash yaws derive from caster→target direction
  via `_sigYawToward` (blitz active unit, falls back to nearest unit).
- **Fist v2** (reallyGoodPunch): sculpted knuckles/curled fingers/muscled
  forearm + wind-up cock-back before the slam.
- **Shield** (`_sigBuildShield` heater + gold trim + boss + crest):
  `_sigShieldBash3D` (summon→brace→RAM) on shieldBash; `_sigShieldRing3D`
  (rising ring of shields) on fortify / raceShieldWall / raceOathOfValor.
- **Jaws** (`_sigJawsBite3D`): flesh.png gums, marble.png fangs, snap-shut +
  clench-tremor. Wired: racePounce, raceFeralDive, raceInfectiousBite,
  raceGhoulishBite, raceLoveBite (pink, tiny), and raceSavageRend =
  claw-claw-BITE (2 claw swipes then jaws, per its desc).
- **Claws** (`_sigClawCombo3D`): 4-talon fan, triple-crescent rake, lingering
  gouge decal. Wired: raceNinefoldScratch (3 swipes), raceDemonicClaw (1 huge).
- **Cannon** (`_sigCannonShot3D`): carronade on wooden carriage, fuse embers,
  muzzle blast + smoke ring, recoil, ballistic obsidian ball w/ ember trail,
  3×3 explosion. Wired via a `raceCannonball` **bolt** mapping that
  `_fireBoltMapped` intercepts (bolt is the only intent that knows caster AND
  target) — the generic bolt is skipped entirely.
- **Guns** (`_sigGunRig3D`, kinds `revolver|shotgun|sniper`): giant spectral
  stand-weapons floating over the caster on a spinning summon disc; muzzle
  flash cross + recoil + tumbling brass shells; revolver cylinder rolls;
  shotgun cycles its pump between shells; sniper paints an aim-laser + scope
  glint then a tracer. Multi-hit spells REUSE the live rig (registry keyed by
  kind+caster tile) and just fire again. Wired via `_SIG_GUN_FOR`: deadEye/
  ricochet1/raceHighNoon→revolver, doubleShot→shotgun, headshot/precisionShot/
  kneecapShot→sniper. shootout additionally hangs two sky revolvers over the
  bullet-rain box.
- **Tesla Coil**: `_sigTeslaCoil3D` deploy cinematic (rune circle, charge
  pillar, ThreeLightning arcs off the toroid) + PERSISTENT board model in
  three-renderer (plinth/copper primary/wound secondary/toroid + owner-colored
  corona) replacing the flat marker for `raceTeslaTrap` deployed objects.

New SPELL_MAP wiring (after `_BOLT_WIRING`): raceCannonball.bolt,
raceFeralDive.impact (reuses racePounce_impact), raceLoveBite.impact (reuses
raceInfectiousBite_impact) — without an impact mapping `_spell3DGeometry`
never fires.

## Signature Arsenal round 2 (2026-07-10) — jaws/claws everywhere + SONIC BOOM
Audit pass: every bite/claw/roar spell now uses the arsenal rigs.
- **Jaws newly wired**: raceBite (werewolf feed, long 420ms clench),
  raceVenomFang (green venom palette), raceJurassicJaw (1.55× dino chomp),
  raceApexPounce (needed a SPELL_MAP impact → reuses racePounce_impact).
- **Claws newly wired**: raceBloodFrenzy (2 fast rakes → jaws finisher;
  its SPELL_MAP was aura-only and is now IMPACT-ONLY on purpose — the aura
  intent also calls `_spell3DGeometry`, so keeping both would double-fire
  the combo at caster AND victim), raceBorrowedClaw (arcane purple).
- **`_sigSonicBoom3D`** (new staple, exported): jagged zigzag concussion
  rings (`_sigSonicRingTex`) echoing out from mouth height + an upright
  camera-facing ring on the first crack; `gentle:true` = smooth slow rings,
  no shake. Optional `notes:` count spawns **`_sigMusicNotes3D`** — big
  spectral beamed-eighth-note billboards (`_sigNoteTex`, canvas-drawn);
  `broken:true` = cracked glyphs with worsening off-key vibrato that
  SHATTER in sparks (discord). Wired: raceHowl (moon-blue echoes),
  raceDemonicRoar, racePrimalRoar, raceLabyrinthRoar (barrage-kind fires
  the *aura* intent → had to add an aura mapping reusing raceDemonicRoar_aoe
  or nothing plays), raceDeafeningWail (broken notes), discordance,
  lullaby (gentle notes + slow circle).
- **Discordance is now the debuff showpiece**: two counter-spinning rune
  circles (magenta/pink) grinding + 4-ring sonic boom + 4 big shattering
  broken notes. Old effect was a 55px flash ("really small" — user report).
- **discord STATUS now visible everywhere**: added `_status_discord`
  hand-authored EFFECTS def + `_statusEffectMap.discord` +
  `fireStatus('discord')` spawns 2 broken 3D notes over the victim. NOTE:
  battle.js gates status VFX via its local `vfxStatusMap` (~line 3893) —
  discord had to be added THERE too, else fireStatus is never called.

## Signature Arsenal round 3 (2026-07-10) — PS2-cinematic tier
User supplied PS2 JRPG reference shots (crossed-staves holy prison inside a
rune sphere → whiteout; green poison cloud; anime rush-line backdrop). New
staples in three-vfx-effects.js (all exported on ThreeVFXEffects):
- **`_sigSpeedLinesFx`** — DOM canvas overlay (like `_sigScreenFlash`),
  radial anime rush lines converging on screen centre, `mix-blend: screen`.
  Auto-fires on: slash-combo heavy hit, jaws snap when `shake:'hard'`,
  claw `heavyFinish`, and inside the whiteout.
- **`_sigWhiteout3D`** — mega-flash finisher: big screen flash + giant
  starburst + stacked shock rings + rush lines + sparks.
- **`_sigRuneSphere3D`** — translucent seal sphere + 2 counter-rotating
  scripture bands (`_sigGlyphBandTex`, glyphs wrapped on open cylinders).
- **`_sigSpearPrison3D`** — THE reference cinematic: rune sphere + magic
  circle, N spectral polearms (`_sigBuildSpear`: metal shaft/marble tip,
  origin at tip, grows +Y) materialize on a ring and thrust home staggered,
  quiver, hold crossed, then optional `finisher` whiteout. GOTCHA: the
  aiming holder needs `rotation.order='YXZ'` — with default XYZ the yaw
  never moves the +Y thrust axis and all spears stack on one side.
- **`_sigGasCloud3D`** — churning billow: staggered soft glow puffs swell/
  drift up over radiusTiles + sickly ground circle.
Wired: raceValkyrieSpear (5 divine spears + whiteout), raceShadowBind
(4 obsidian stakes, no finisher — they STAY), raceSandglassPrison (gold
rune sphere), raceIceSpear (count:1 pitch:1.4 = single sky-plunge ice
spear), exorcism (+gold containment sphere), raceToxicNova (green cloud;
barrage-kind → needed aura mapping reusing raceToxicNova_aoe),
raceInkCloud, raceExhaustCloud, racePlaguefield (+miasma over the mound).

Dedicated sprites (added to the R2 terrain folder 2026-07-05, wired in):
`enamel.png` (fangs + talons), `gunmetal.png` (all three guns; also the cannon
barrel tinted dark 0x9299a4 as cast iron), `copper.png` (tesla primary +
secondary windings), `leather.png` (sword grip wrap), `skin.png` (the ORA
fist — pass `rockTex:'rock.png'` for the old stone-golem look). Still
placeholder: FUR — the jaws' outer hide ridge uses flesh_3.png tinted dark.

Testing recipe that WORKS (models verified rendering in-game, 0 errors):
`USE_ASSET_CACHE=1 LOCAL_ASSETS=three-vfx-effects.js,three-renderer.js` makes
the Playwright harness serve REPO edits in place of the R2 copies. Trigger
effects from the console: `ThreeVFXEffects.fire('impact','dragonSlash',{tx,ty})`,
`fire('bolt','raceCannonball',{fromX,fromY,toX,toY,flyMs:600})`,
`fire('aura','raceTeslaTrap',{tx,ty})`, or the exported `sig*3D` functions
directly (all accept long-hold opts — e.g. `clenchMs:8000` — to pose for
screenshots; swiftshader screenshots are SLOW, transient effects finish during
capture, so pose-and-hold is the only reliable way to screenshot them).
Anchor test effects on the ACTIVE unit's tile (`st._blitzActiveUnitId`) — it's
the tile the camera actually frames. `_sigRun` now console.warns tick
exceptions instead of silently killing the effect.

Tuning knobs if models read too small/big on other maps: gun `modelScale`
(default 2.2) in `_sigGunRig3D`, cannon `scale` (1.35), claw fan ×1.25, tesla
renderer model `g.scale.setScalar(1.3)`.

## Production-readiness review (2026-07-05) — ROADMAP.md + boot loader + perf probe
Full holistic audit session (QoL/architecture/perf/workflow). **Read `ROADMAP.md`** —
it's the handoff plan (delivery pipeline, loading, draw calls, achievements, ranked
maps, retention) with file:line anchors. Changes shipped (all non-visual):
- **index.html**: real boot progress (head telemetry counts finished script/CSS via
  the Performance API) + failure overlay & 45s watchdog (dead R2/CDN core file now
  shows a RELOAD card instead of the silent "· LOADING ·" soft-lock) + preconnects +
  dark pre-CSS background. GOTCHA: Chromium does NOT propagate `load` events for
  script/link elements through window capture-phase listeners — only `error` events
  capture. Progress must come from `performance.getEntriesByType('resource')`.
- **server.js/package.json**: gzip `compression` middleware (index.html 115KB→28KB).
- **three-renderer.js**: `powerPreference:'high-performance'`; new `ThreeRenderer._renderer`
  getter → live draw-call/memory stats at `ThreeRenderer._renderer.info.render`.
- **map.js**: MS_GAME_MODES descriptions fixed to match MULTIPLAYER_MODES rules
  (Arena 33→15 rounds, TDM 15→12).
- **match-select.js BUG FIX**: `_msSelectedRounds`/`_msSelectedGM`/etc. were mirrored
  to globals in a useEffect that (a) omitted `rounds` from its deps and (b) is
  deferred, so `_msConfirm` read stale values — every TDM started from mode select
  ran a 15-round match clock (HUD "1/15") while the rules/log said 12, and manual
  ROUNDS tweaks were ignored. Mirror moved into the render body. When probing this
  UI, note `_msSelectedRounds` is a module-level `let` in map.js — NOT visible as
  `window._msSelectedRounds`.
Probe facts (8×8 TDM, 8 units, headless swiftshader — object counts valid, FPS not):
~13.5s cold boot to `_gameReady` even with all assets local; scene = 1,089 meshes +
684 sprites, 752 visible drawables, 467 unique geometries, **2,016 unique materials**,
11 lights; DOM = 17.4k nodes (212 in the CSS2D overlay). No instancing/merging/atlas
anywhere — see ROADMAP §4 before optimizing (shadow autoUpdate=false is NOT safe:
GLB units idle-animate + castShadow and the sun eases every frame).
HARNESS GOTCHAS: `ThreeRenderer` is a top-level `const`, NOT `window.ThreeRenderer` —
in page.evaluate use the bare identifier / `typeof ThreeRenderer !== 'undefined'`
(`window.ThreeRenderer && …` is always falsy). In the remote container launch with
`executablePath: '/opt/pw-browsers/chromium'` (repo playwright wants a browser build
that isn't installed; do NOT run `npx playwright install`).
R2 delivery facts (verified by curl): the `pub-*.r2.dev` dev bucket serves battle.js
as 1,356,685 raw bytes — **no Cache-Control, no gzip/brotli** — and index.html loads
TWO three.js copies (r128 global + 0.160 module importmap for the menu/sky shaders).
Custom domain on the bucket = brotli + edge cache + real headers (ROADMAP §2.1).

## ROADMAP §4 performance pass (2026-07-06) — three-renderer.js, three-post.js, three-vfx-effects.js, ui.js
User-approved perf/stability session ("run on a potato, zero visual change; anything
visible → Video-settings control"). Shipped §4.1/4.2/4.4/4.6/4.7/4.8/4.9 — full detail
in ROADMAP §11.8. Engine facts a future session needs:
- **Terrain batching (§4.1)**: `_rebuildMergedTerrain()` (three-renderer.js) bakes all
  static plain-Lambert tiles into one merged mesh per material bucket after every
  `rebuildTerrain`. Originals stay in the graph `visible=false` — **r128 Raycaster
  ignores `visible`** (verified: pick parity probe, 0/27 mismatches), so screenToTile
  still hits them; merged meshes have a no-op `raycast`. NOT merged: lava/fluid,
  custom-shader mats (own-property `onBeforeCompile`), and tiles that rise ≥2 steps
  over any 8-neighbour (walls/cliffs — kept individual for the action-cam occlusion
  fade). GOTCHA: `_ew_height` is the ABSOLUTE column top-z, not prominence — the
  first cut rejected `_ew_height>1` and merged NOTHING on plateau maps (TDM map =
  uniform z=7). Measured on that map (50/100 tiles merged → 8 meshes): total draw
  calls −42%, triangles −47%. Auto-disables when `state.fogOfWar` (fog toggles per-tile
  visibility) or `state.phase==='editor'`. Toggle: Video → "Batched Terrain";
  console kill-switch `window.EW_DISABLE_TERRAIN_MERGE=true`. NOTE: **TDM ships with
  fog of war ON**, so batching engages on fog-free modes/maps only.
- **Shadow gating (§4.2)**: `renderer.shadowMap.autoUpdate=false`; renderFrame sets
  `needsUpdate` when: any rebuild ran / `hasActiveAnims()` / any `entry.mixer` (GLB
  idle) / `ThreePost.isLightingEasing()` / turret arm or flying-bob moved
  (`_shadowMotion`) / tower cubes exist / fog on. Kill-switch
  `window.EW_DISABLE_SHADOW_GATING=true`. Idle sprite board = depth pass fully skipped
  (probe: 60 frames, 0 pending updates, shadows still correct).
- **Serial hashing (§4.4)**: all `_compute*Serial` now return 32-bit ints via
  `_hashStr/_hashInt/_hashVal`. If you add a field to a serial, hash it — do NOT
  return strings (comparisons are numeric now; '' initial values still mismatch fine).
- **VFX ticker (§4.6)**: three-vfx-effects.js effects register with `_fxSchedule(fn)`
  (fn returns false → done); ONE rAF pump. `ThreeVFXEffects.clear()` now kills
  everything (3D geom, domes, sig entries) and is called from
  `ThreeRenderer.resetForNewMatch()`. **Two pre-existing bugs fixed**: (a)
  `_activeThreeMeshes` was never declared — light-lance/glacial-tomb casts threw
  ReferenceError mid-spawn and stranded meshes; (b) `ThreeVFXEffects.clear()` ↔
  `ThreeVFX.clear()` (three-vfx.js:1654) mutually recursed → stack overflow the
  first time anything called clear; guarded with `_clearingAll`.
- **FPS cap/counter (§4.7)**: Video → Graphics. `ThreeRenderer.setFpsCap(0|30|60)`,
  `setFpsCounter(bool)`, `setTerrainBatching(bool)`; persisted as `ew_fpsCap`,
  `ew_fpsCounter`, `ew_terrainBatch`. Counter = `#ewFpsCounter`, DotGothic16,
  top-right, green/yellow/red at ≥50/≥28/below.
- **Plates (§4.8)**: `_plateRefs(po)` caches querySelector refs per plate object;
  `_scalePlates` skips the transform write when scale Δ<0.004.
- **Texture epoch (§4.9)**: `getTexture` stamps `tex._ew_epoch`; `resetForNewMatch`
  disposes textures unused for 2 matches.
- **Fog Grid toggle** (same session): Video → Graphics "Fog Grid" (`ew_fogGrid`).
  Off = fog VISUAL removed (no wire boxes, no terrain dimming, whole map shown);
  vision INFO unchanged — `_applyFogVisibility` splits into a world block (tiles/
  objects/decos, shown in full when grid off) and the always-vision-gated block
  (deployables/turrets/units/plates). `_updateFogPulse` has a 'nogrid' key state
  that refreshes `_fogVisibleSet` every 0.2s via `_computeFogVisibleKey()` (which
  was dead code — now the nogrid change detector). rebuildFog() early-returns to
  the same path. Terrain batching engages under fog when the grid is off
  (`_terrainBatchWanted` checks `state.fogOfWar && _fogGridWanted()`). Soak test:
  0 hidden-enemy leaks across 6 samples (grid-ON baseline itself shows a transient
  3-unit leak in the first ~15s of a match that self-clears — pre-existing).
- PROBE GOTCHA: with the EffectComposer, `renderer.info.render.calls` resets on EVERY
  pass — sample with `info.autoReset=false; info.reset()` and divide by
  `info.render.frame` to get calls per frame across all passes.
- Harness combo that serves LOCAL edits: `PW_CHROMIUM=/opt/pw-browsers/chromium
  USE_ASSET_CACHE=1 LOCAL_ASSETS=three-renderer.js,ui.js node playtest.js tdm`.

## Persistence
This is Claude Code on the web: the container is ephemeral and the repo is cloned
fresh each session. Commit `CLAUDE.md`, `playtest.js`, this file, and `package.json`
to the branch so future sessions auto-load context (CLAUDE.md) and reuse the harness.
`node_modules/`, `package-lock.json`, and `shots/` are gitignored.

## 2026-07-07 MAP OVERHAUL — MapForge: the entire launch roster is now GENERATED
User asked for a full map redo: lore-driven competitive maps, layered ground
(lava→cave floor→dirt under a themed surface), per-map skies/backdrops, race
biome tags, and a "Smash delta stage" way to normalize any map into a fair
ranked board. Files touched: **data.js, state.js, map.js, three-renderer.js,
server.js, index.html** (all but server/index are on R2 — re-upload together;
server.js redeploys on Render with index.html).

### The system (data.js "MAP FORGE" section, after PREBUILT_MAPS)
- Every launch map is BUILT AT LOAD TIME by a `_MF_BUILDERS[id]` function using
  a small authoring kit (`_mfNew`: rect/disc/ring/hole/lintel/obj/mon/building/
  sym180/spawnEdges/finishSpawns). `EW_MAP_META` (same file) is the single
  source of truth: label/desc/size/teamSize/tier/biomes/env per map. data.js
  shrank ~3.5k lines because the giant literal grids are gone.
- **Roster**: 29 lore maps (T1: Shasta/Stonehenge/Giza/Nuketown/Heaven/Hell/
  Cyberpunk/Camelot/Stadium; T2: Atlantis/Babel/Olympus/Mars/Area51/Antarctica/
  Skinwalker/HollowEarth/FairyForest/Moon; T3: Technoticlan/Agartha/Vatican/
  BohemianGrove/Gobekli/DUMB/CERN/Backrooms/NorthPole/Flatlands) + Custom Map
  (kept verbatim). ALL old prebuilts were deleted per user instruction.
- **Δ variants**: `_mfDelta` crops a 10×10 window (meta.deltaX/Y, default
  centered) out of each finished map, strips buildings, enforces 180°-rotation
  symmetry (terrain+heights+objects; monuments mirrored, near-center ones kept
  single, spawn-row ones dropped), re-seats 4v4 spawns on N/S rows → 29
  `prebuilt_*_delta` ranked maps, auto-registered everywhere.
- **Layered ground**: every column = strata z0..z2 (per-map, e.g. Hell
  lava/lava/obsidian, Heaven cloud_thick all the way) + themed surface at
  z3 (baseline). Raised cover = h5+ (blocks ground move, MAX_CLIMB=1); steps
  = h4; hazard pits carved to h2 (always 1-step escapable); `hole()` = truly
  empty column (bottomless void — Heaven/Olympus rifts, terrain cloud_gap).
- **Tints**: maps carry `terrainTints` {terrainKey:'#hex'} (multiplicative).
  state.js applyGameMode now copies PREBUILT_MAPS[id].terrainTints →
  state.terrainTints for prebuilts (was editor-only). Same texture, different
  map, different color (Mars = moon_2 tinted rust; Backrooms yellows; Stadium
  end zones = carpet/carpet_2 tinted team colors).
- **Per-map sky/env**: MAP_LAYOUT_PRESETS[id].env → state.mapEnv →
  three-renderer `_updateEnvironment`: `{tint,tintAmt,stars,nebula,
  fog:{color,amount,top,band}, scenery:'divine|infernal|ruins|pyramids|
  crystals|orbs|eyes|islands|city|space|dark|none', density}`. New dome
  uniforms uMapTint/uMapTintAmt/uMapStars/uMapNebula; map fog feeds the same
  uFog* pipeline as the pause-menu retro fog (user fog wins while enabled);
  `_hzThemeRoster()` re-weights the floating horizon landmarks per theme
  (Heaven floats goldgates+stairways, Skinwalker/Flatlands get watching
  eyeballs, Moon is near-empty, underground maps are 'none' + heavy fog).
- **Race biomes**: `EW_RACE_BIOMES` (data.js) stamps `biomes:[...]` onto every
  RACE_PROFILES entry; maps carry matching meta.biomes. Helpers:
  `EW_racesForBiome('forest')`, `EW_mapsForRace('bigfoot')`. No UI yet —
  data + grouping only, per user ("not sure what to do with them yet").
- **Generated plumbing** (never hand-sync again): state.js builds
  GAME_MODES entries from EW_MAP_META+PREBUILT_MAPS (spawns come from the
  built map!), and regenerates all 7 MULTIPLAYER_MODES.compatibleMaps;
  map.js MS_MAP_LIST is generated (fulls in tier order → Custom Map → Δs);
  server.js MAP_POOL lists Δs (team 4) + fulls (team 6/8) — hand-mirrored,
  update it when the roster changes. Challenge pools (_CHAL_MAP_POOL_*) and
  map.js _TRAIN_MAP_POOL now reference the new ids.
- **Validation**: scratchpad `validate_maps.js` (rebuild it from this recipe if
  lost: stub window/PREBUILT_MAPS/MAP_LAYOUT_PRESETS/RACE_PROFILES, eval the
  forge, then per map assert dims, tid/oid ranges, voxel-stack consistency,
  building pads flat+on-board, spawns safe, Δ symmetry, and height-aware BFS
  from team-1 spawns with monument collision stamped → team 2 reachable, ≥90%
  of non-wall passable tiles reachable, center reachable). All 58 pass.
- **Gotchas learned**: (1) NEVER place 2×2 buildings before `sym180()` — the
  object mirror shifts anchors by one tile (sym180 now strips building oids;
  place via buildingSym AFTER). (2) Monument collision (`pyramid/ziggurat/
  stairway/obelisk/colossus`) must be part of any reachability check.
  (3) Icebergs/hop-islands must sit exactly +1 over the water they rise from.
  (4) The asset cache is URL-keyed INCLUDING ?v= — after a token bump, serve
  repo files via LOCAL_ASSETS (all .js/.css) or the first probe run refetches.
### Adding a map now = ONE data.js edit
Write `_MF_BUILDERS.prebuilt_foo` + one `EW_MAP_META` row (id/label/desc/w/h/
teamSize/tier/biomes/base/env/deltaPad). Everything else (Δ variant, GAME_MODES,
picker card, compatibleMaps, thumbnails) generates. Optionally add it to
server.js MAP_POOL for ranked and the challenge pools.

## 2026-07-07 (batch 2) — MAP-PROP FOUNDRY: 53 procedural 3D lore pieces
Follow-up to the map overhaul: user asked for 1-2 signature 3D assets per map
in the sacred-rings/colossus tradition. Files: **three-renderer.js, map.js,
data.js, index.html** (token → 20260708b).
- **53 new `_hz*` builders** (three-renderer.js "MAP-PROP FOUNDRY" section,
  before the horizon-themes block): pure procedural THREE geometry, terrain-
  sprite textured via `_hzTex`/`_hzGeoMat` (day/night graded) + `_hzGlowMat`/
  `_hzGlowCore`/`_hzPulse` bloom accents. Registered in `_MON_BUILDERS`
  (~line 4400) + `ME_MONUMENT_KINDS` (map.js editor palette, emoji cards).
  Kinds: lenticular trilithon wickerman sphinx ankh bus mannequin throne
  seraph bonearch brazier holoboard hovercar excalibur dragonskull blimp
  jumbotron trident shipwreck babelcrane tablet zeusbolt cydoniaface biodome
  saucer radardish whalebones cattleskull windmill innersun fossil toadstool
  fairyring lander serpenthead holopyramid geode basilicadome censer owlidol
  effigy tpillar handbag greytube blastdoor shiva beamring wetfloorsign
  securitycam sleigh candycane weatherballoon roadsign.
- **Functional (collision, map.js `_MON_COLLISION` + validator mirror):**
  `bus`/`lander` = colossus-style +1 platforms (mantle onto the roof);
  `owlidol` = obelisk-style blocker. Everything else decorative (solid:false).
- **Placements** live in each map's forge builder (data.js): every launch map
  now carries 1-3 signature pieces (Nuketown bus+mannequins, Moon landers,
  Giza sphinxes+ankhs, Grove owl+effigy, CERN shiva+beamline, Flat Lands
  weather balloon, Stadium blimp+jumbotron, etc.). Saucers also drift in the
  'orbs'/'space' horizon themes; lenticulars in 'islands'.
- **Floating props MUST carry a ground anchor** (tether/beam/shadow disc):
  `_buildMonumentObj` seats groups by `surfaceY - box.min.y`, so an anchor at
  y=0 is what keeps a blimp/balloon/inner-sun aloft.
- **⚠ THREE gotcha that bit this batch:** `group.add(child)` returns the GROUP,
  so `g.add(_hzGlowCore(...)).position.y = X` moves the whole group (and the
  engine wipes group position anyway) → the glow lands at the prop's FEET.
  Position the child in a variable first. Found via the standalone builder
  harness (scratchpad `check_builders.js`: blank page + three.min.js from the
  asset cache + stubs; asserts every builder constructs, non-degenerate bbox,
  min.y ≤ ground). Re-runnable — keep using it for new builders.
- `_buildMonumentObj`'s silent catch now `console.warn`s the failing kind —
  probe for 'monument builder failed' in console when testing new kinds.
- Verified: builder harness 53/53; BFS validator 58/58 maps with the new
  collision stamps; in-engine Nuketown run = 9/9 monuments built, 0 builder
  fails, 0 page errors. (Full-scene screenshots unreliable in the sandbox —
  swiftshader OOM; verify visuals on real hardware.)

## Targeting / nameplate / death-HP internals (2026-07-08 session)
- **Team-validity is centralized** in `_getSpellValidTargets` / `_getAttackValidTargets`
  (battle.js) — the target drum ('spellTargets'/'attackTargets' views) and their
  clickTile branch are pre-filtered. The FREE-AIM 'spells' view + its hover path
  used to be range-only; now gated by `_spellTargetTeamOk(unit, spell, x, y)`
  (skips tileTargeted/selfCast/directional kinds). Items gated by
  `_itemTargetTeamOk` (potions=allies, banes=enemies).
- **Nameplate visibility chokepoint**: `window._ewTargetableUnitIds` (Set of unit
  ids, or null=show all). Built in ui.js's highlight-cache block from `_hlCache`
  tile classes (units on 'spell-range*/attack/move*' tiles are excluded; 'heal'/
  'attack enemy'/'move ally'/'inspect' included). Consumed each frame by
  `_updatePlateVisibility()` (three-renderer.js). During `state._actionExecuting`
  ui.js now PRESERVES the set, and `_focusPlatesForAction(unit, x, y)` (battle.js,
  called at every player action-execution site) narrows it to caster + units
  within the spell's aoeRadius/auraRadius of the target tile — so only relevant
  bars show during animations.
- **Action-impact focus (2026-07-12)**: `_focusPlatesForAction` only fires from
  LOCAL click paths, so AI/online actions used to leave every plate up (an ally's
  plate could block the view of your unit being hit). New
  `_focusPlatesForImpact(actor, x, y, {radius, tiles, allies, holdMs})`
  (battle.js, also `window._ewFocusPlatesForImpact`) writes
  `window._ewActionPlateFocus = {set, until}` — consumed each frame by
  `_updatePlateVisibility` (three-renderer.js) AHEAD of `_ewTargetableUnitIds`,
  self-expiring by `Date.now()` (`state._actionExecuting` extends the hold).
  Called at the post-validation chokepoints of doAttack (hold 2200ms), doSpell
  (2600ms; radius = aoe/aura, `tiles` = beam line, `allies` for healAll) and
  doItem's potion (1800ms) / bane (3200ms) branches — these executors are shared
  by the local player, ai.js AND online.js replay, so every actor is covered.
  While ANY filter set is active, decoy plates hide too (a decoy can't be in the
  set; a plate ignoring the filter would betray it).
- **Invalid-target declutter (2026-07-12)**: full-HP allies (heal potion),
  full-MP/no-MP allies (mana potion) are no longer painted 'heal' in ui.js item
  mode and fail `_itemTargetTeamOk` (no hover-confirm) — so aiming a potion shows
  ONLY drinkable allies' plates, zero enemy plates. Free-aim ally-only spell
  paint ('heal'/'shield'/'buff'/'cleanse'/'guard' kinds) now also gated by
  `spellTargetUsableOn`, matching the target drum.
- **`.tp-targeted` CSS exists but nothing ever sets it** — plate emphasis is done
  via visibility filtering + `_updatePlateEffBadges`, not that class.
- **Killing-blow HP drain bug root cause**: the frame loop skipped BOTH
  rebuildUnits() and `_patchPlateStats()` while any tween ran; a kill always has a
  death tween in flight by the next frame, so the fatal hit's `width=0%` was never
  written. Fixed: `_patchPlateStats()` now runs during tweens (with
  `_lastUnitSerial` restored afterwards — the function refreshes it as a side
  effect, which would otherwise swallow the deferred post-tween rebuild).
- **Zero-range aura spells (War Cry etc.)**: `previewSpellRange` used to bail on
  `!spell.range`; now draws the `auraRadius || aoeRadius` ring around the caster.
- Death timeline: `defeatUnit` (map.js) sets `_dying` immediately, `dead=true`
  ~800 ms later; plates are dropped on the rebuild after `dead` flips, and
  `rebuildUnits` skips `dead || _dying` units. HP-bar CSS drain is 0.25 s.

## Elemental overhaul (2026-07-08, session "elemental-spells-animations")
- **`state.burningTiles`** = `{ "x,y": {x, y, t, p} }` (t = rounds left, p = igniting
  player). API in battle.js: `igniteTile(x,y,rounds,byUnit)`, `extinguishTile`,
  `_isFlammableTile`, `tickBurningTiles()` (called in the end-of-round pipeline just
  before `state.round += 1`). Flames: bite occupants 24/round (+burn), 18 on walk-in
  (`finishMoveAt`), 30 on knock-in (`_applyKnockbackHazard`), spread 45%/adjacent
  fuel tile/round (grass/tree/leaves/wood families, cap 48 tiles), burn out → tile
  chars to `scorched` (trees felled). Water/ice/flooding smothers. Syncs online
  automatically via `_serializeState`. VFX: `_tickBurningTiles` in
  three-vfx-effects.js reads the same structure (looping flame/ember/smoke).
- **Wall of Fire** (`burningRounds: 3` in data.js) now ignites its line via the
  `terrainCreate` branch, which ALSO now calls `triggerTerrainSpellReaction`.
  `_reactFireForest` ignites the connected stand (burns over time) instead of
  instantly scorching it.
- **HM-style elemental tile casts**: `_elementalTileCastInfo(spell, x, y)`
  (exported on GAME) — `kind:'damage'` spells with a fire/lightning/cold element
  can target reactive tiles: lightning→water/metal/crystal/trees (water conduction
  hits every unit in the connected pool, i.e. beyond cast range), fire→ice/crystal/
  trees/any flammable, cold→water or burning tiles (douse). Execution is a branch
  in `_resolveOffensiveTarget` (before the "No valid target" bail). Wired into:
  clickTile spellTargets validation, `previewSpellRange` (element-colored
  `spellRangeElem` overlay on castable tiles), `_spellTargetPromptText` hints,
  hud.js `_computeTileActions` (`_elemTileOk`), ai.js `_elementalTileFallback`
  (used when no enemy is in direct range; `{x,y,_elemTile}` targets get a flat
  score in `scoreSpell`).
- **VFX**: `wave-1..6` sprites are now PROCEDURAL canvas frames (additive cyan) —
  wave_*.png no longer loaded; `_ELEMENT_THEME.water` → new `'water'` theme.
  Tesseract rain shapes render additive+bright (bloom glow). Water/deep_water tile
  tops have animated caustics/sparkle (uniforms `uFluidTime`/`uFluidTile`, ticked
  in `_updateFluidWaves`; lava untouched). Lightning: whiter core + impact flash.

## Spell VFX overhaul (2026-07-10, session "spell-vfx-animations")
- **Throw-arc tween** (`three-renderer.js`): `startThrowArcTween(unit, fromX,
  fromY, toX, toY, opts)` / `ThreeAnim.throwArc(...)` (returns true when the 3D
  renderer took the animation). Phases: **lift** (straight up to `opts.liftPx`,
  stretched), **hang** (flailing hover, fires `opts.onLift` once), **fling**
  (accelerating ballistic slam into the landing tile), **impact** (big ground
  puff, fires `opts.onImpact` — damage + logical tile change belong THERE),
  **settle** (eases from the impact point to `_unitRestPos`, doubling as the
  bounce-off-the-victim beat when battle.js moved the unit to an adjacent tile
  in onImpact). `opts.drop: true` = no horizontal travel (skyDrop).
- **All four sky/leap kinds now use it** (battle.js): `skyThrow` phase 2 (victim
  lifted→hurled; UFO with tractor beam paces the fling for `raceAbductionBeam`),
  `skyDrop` (lift + straight drop in place), `skySlam` (the CASTER arcs onto the
  target, sonic boom, bounces to the landing tile), `leapStrike` (dive arc, keeps
  the dash streak). Damage/status/terrain all apply in the extracted
  `_apply*Landing()` closures — legacy `setTimeout(actionMs(400))` path retained
  as the 2D fallback. skyThrow grab phase now pins the victim with a
  `sigLightPillar3D` lock-on (green for grey saucer / violet unholy / sky-blue).
- **Lasso** (`raceLasso`, any /lasso|wrangle/ pull): tether system grew a
  spinning rope-loop tip — `_buildLassoMesh` in three-renderer.js (torus +
  honda knot, rope texture); the loop spins about the flight axis during the
  tether's shoot phase, then drops flat and CINCHES (scale-down) on the bite,
  staying around the victim through the retract. Classifier
  `_tetherLassoForSpell` in battle.js; opts flow playTetherEffect → ThreeAnim.tether
  → startTetherTween `{lasso:true}`.
- **Delayed yank for ALL pull spells**: `startDisplaceTween`/`ThreeAnim.displace`
  and `animateDisplacementPath` accept `opts.delayMs` — the victim now holds
  still for rope-flight + bite (280+120 ms, lassos 280+220) before the drag,
  with tether retract + camera path shifted to match. Fixes "victim moves before
  the rope reaches them" on Lasso/Harvest Hook/Earthen Grasp/Tentacle Lash/
  Undying Grip and the tractor-beam tow.
- **End-of-round detonation multi-cam**: `playDetonationCinematic(ds, {descentMs})`
  in battle.js (exported on window; gated by `state.cinematicActionCam` + 3D).
  Beat 1 = hard cut to a low ground-zero shot (sky in frame — the nuke's f22
  flyover and falling ordnance finally read on camera) with a slow push-in for
  the whole descent; beat 2 = reverse-angle wide hard cut at the impact frame
  (kill-flash chrome, hard shake), slow push through the aftermath; then the
  camera releases to `eorFocusCamera`. state.js `detonateNext()` uses
  `_cine.impactMs` to land `_detonateDelayedSpell` exactly on the cut, and
  `_cine.afterMs` before the next blast. Letterbox chrome shows the spell name.
- **Descent-less detonators get visuals**: new `ThreeVFXEffects.fireGeometry(
  spellId, tx, ty, r)` fires a spell's `_spell3DGeometry` entry directly —
  Crystal Ball / Prophecy of Disaster now conjure their orb as the "arming"
  beat (impact delayed ~1100 ms), and ALL no-descent blasts fire a palette-
  matched `sigSonicBoom3D` + 'explosion' sfx at detonation.

## Opening cinematic (match intro) — added 2026-07-11

The flat VS splash is now replaced (when possible) by a ~13s multi-cam intro
shot on the real battlefield. `battle.js showVSSplash()` checks
`_introCineEligible()` and routes to `playOpeningCinematic(onDone)`; any
failure or ineligibility falls back to the classic VS splash unchanged.

**Sequence** (all beats ride the cine TPS rig, like `playDetonationCinematic`):
1. 0.0–2.2s ground-level feet shot: viewer's team marches up a grand staircase
   out of the void into its spawn zone (real walk clips via `_walkTweens`).
2. 2.2–4.0s cut: enemy team's feet mid-march on their own staircase.
3. 4.0–6.3s skewed medium shot: your party settles into line (team tag lower-third).
4. 6.3–7.8s SNAP TURN in place (orbit trick: refocus on the enemy line with a
   map-length boom so the eye stays put while the view whips 180°), then a
   950ms BLITZ DOLLY straight across the battlefield into the enemy's face
   closeups (speed-lines burst + teleport whoosh; staircases dissolved via
   `introCineFadeStairs` just before the turn).
5. 8.8–11.2s hard cut: eye flat on the MAP CENTER looking straight up
   (tilt 164→168, yaw/zoom already = rest framing) — pure sky, no map edges —
   while the map title + mode slam in (`_lsMapTitle()` + mp mode label, Cinzel).
6. 11.2–13.0s ONE pure rotation down out of the sky onto the tactical rest
   view → "FIGHT!" slam + flash + `shakeBoard('hard')` → onDone.

**Visibility during the intro**: per-beat `ThreeRenderer.introCineSetFocus(uids)`
feeds the WHOLE framed team to the action-cam occlusion fade (terrain/props
between camera and any of them ghost out; canopy cutaway follows the row's
center unit via camera._cineShotUnitId). Spawn-zone overlays + sanctuary walls
are hidden for the duration. FLYERS are visually grounded (unitSurfaceY
override via _introGroundSet) so low shots frame the whole roster — their
logical airborne z is untouched and they pop back up when the intro ends.

**Renderer side** (`three-renderer.js` exports): `introCineStart(opts)` builds
one wide terrain-textured staircase + floating causeway per team off the
spawn-zone edge and stages per-unit marches by inserting entries directly into
`_walkTweens` with a future `startTime` (the updater now clamps gt ≥ 0 for
this) and fractional off-board path points with explicit `z` levels
(`_tileSurfaceY(x,y,z)` honors explicit z). Walk-clip `timeScale` is slowed
×0.55 during the march (restored after) so feet don't skate at parade pace.
`introCineEnd()` is the universal teardown (also wired into
`resetForNewMatch`). Unit LOGIC tiles never move — skip just deletes tweens.

**Skip**: any click. Online BOTH players must click — votes ride the relay
channel as `{type:'intro-skip'}` (online.js dispatcher latches
`window._ewIntroRemoteSkip`, pokes `window._ewIntroSkipPoke`; votes reset on
match prepare / guest phase transition). Hint text switches to
"WAITING FOR OPPONENT…" after voting.

**Eligibility/fallbacks**: skipped for dev-sim/animations-off, camera-disabled,
Mystery Dungeon. Plays in fog-of-war matches too (intro march tweens are
exempt from the fog visibility check in _updateWalkTweens). A team only stair-marches when ALL its
units sit inside `state.spawnZones[p]` (FFA scatter-spawns / custom maps keep
units in place but still get their camera beats). Hard-safety timeout 17s.
CSS lives at the end of styles-cinematic.css (`.ewi-*`; `body.ewi-cinema`
parks #sidebarPanel/#scorePanel/scoreboard/#css2dOverlay via visibility).

**Kill-switch (console)**: `window.EW_DISABLE_INTRO_CINE = true` → classic VS splash.

## Action-menu (Horologe) redesign — 2026-07-11
- **Crown = ONE labelled button** (`.hrlg-crown-cap` now holds arrow + `.hrlg-crown-text`
  "BACK"/"END TURN"; the floating `.hrlg-crown-label` above the nub is gone). 116px wide.
- **⚒ BUILD moved OUT of the verb drum** onto the bezel: permanent pusher at 10-11
  o'clock (`.hrlg-buildbtn`, `build` prop on HorologeMenu, root view only, greys with
  the `_buildActionProblem` reason). Still in the More list + B key. Root order is now
  Move › Attack › Abilities › Combo › Items › More › END TURN.
- **View tab** (`.hrlg-view-tab`) is 44px tall / 17px Cinzel — fits the 34×34 unit
  portrait chip the enemy quick-menu puts there. Moved right (left:170) to clear the
  wider crown.
- **Abilities sort**: castable first, then damage › debuff › heal › buff › utility
  (classifySpell), then tier. Each spell blade is TINTED by category (`catColor` →
  `.hrlg-blade.catc`, `--bc*` vars): red/green/blue/purple/amber. Quick-menu spell rows too.
- **Selection**: yellow `▶` JRPG cursor (`.hrlg-cursor`, inside .hrlg-body — outside
  would hide under the bezel) + breathing glow (`hrlgSelGlow`) on the .sel row.
- **Combo finally lists targets**: `_hrlgComboBlades` two-step drum — adjacent ally
  partners (portrait rows, combo name + synergy) then in-range targets; fires
  `state.comboPartner` / `doComboAttack` directly. Board clicks still work in parallel.
- **Palette**: EW ink/panel + all hrlg surfaces de-blued to bone-on-black neutrals
  (#0c0c0a family); descbar chrome bone+blood-red instead of gold/holo-blue; crown red
  now #ff4a3c. Vitals bars 17/14px with 12px numbers (were 8px unreadable).

## Targeting fixes — pick rings + AoE/zone team filtering (2026-07-13)
- **"Can't click the enemy beneath my elevated unit" root cause**: the team
  rings / facing wedge / selection halo / hover glow are wide HORIZONTAL discs
  in the unit's pick group with no raycast guard. From an angled camera an
  elevated unit's discs project down over the tile at its column base and
  swallow clicks aimed at the unit standing there (screenToUnit in
  three-camera.js is pure nearest-hit against unitGroup). Fixed with the same
  `mesh.raycast = function(){}` no-op already used on silhouettes/shadow
  proxies (three-renderer.js ~8425-8500 + `_hoverGlowMesh`). Any NEW
  decorative mesh added to a unit group MUST get this guard.
- **`spellTileTeam(spell)` → 'ally'|'enemy'|'both'** (battle.js, next to
  `_kindMeta`, exported on window): payload-first judgment of who a
  tile-targeted AoE/zone spell serves. Don't trust spell.type/classifySpell —
  Sticky Bomb is type:'buff' with dmg:144, Plunder kind:'utility' dmg:70,
  Smoke Screen kind:'zoneDebuff' but cloaks allies. leechSeed is 'both'.
  Consumers: `_getSpellValidTargets` (target drum — beneficial zones list
  allies only, hostile zones enemies only), `_computeTileActions` (hud.js —
  ally-tile menu hides hostile zone casts; caster's OWN tile keeps them),
  `_computeEnemyActions` (hud.js — hides ally-serving zones, un-hides
  misclassified damage spells like Sticky Bomb), ui.js `_hlCache` utility +
  generic branches (allies light 'heal' green under beneficial zones; enemies
  no longer light red for them).
- **`_getSpellValidTargets` range = engine parity**: was flat 2D Manhattan;
  now `combatReach` (3D, gravity rule, sky-grabs horizontal-only) like
  getSpellRangeTiles/doSpell — so an enemy directly beneath a flyer (same
  column) measures ≥1 and shows in the drum, and far-above flyers no longer
  get bogus in-range rows.

## King Arthur + Necromancer rework (2026-07-13)
**King Arthur**
- `raceShieldWall` (Walls of Camelot): terrainType `mountain` → `castle_wall`
  (wears the R2 `bricks_2.png` "Brick Floor Alt" texture; wall-ness still comes
  from the +2 `terrainDeform` height raise, same as knight's Castle Fortress).
- `raceKnightsOath` (swap) REPLACED by `raceKnightsOfRound` — new kind
  **`rallyPull`** (battle.js, right after the warCry handler): self-cast, every
  living non-rooted ally is pulled to the nearest free tile around the King
  (ring-by-ring BFS, closest knights claim closest tiles, `_applyKnockbackHazard`
  runs on arrival). Meta: selfCast/fogExempt. AI: score = scattered-ally count
  (ai.js scoreSpell/pickTarget). VFX: reuses `raceRoyalDecree_aura`.
- Excalibur Strike / Royal Decree kept; Holy Avenger and the shared terraform were REMOVED (2026-07-13 follow-up) — the kit is exactly the 4 spec spells. Deathfeed passive surfaced in party-builder RACE_TRAITS.

**Necromancer**
- `raceCurseOfDecay` REPLACED by `raceRigormortis`: kind `aoe`, range 4, 3×3,
  dmg 40 magic + **root 2 turns**. VFX: `raceRigormortis_aoe` effect (poison
  tile bursts + `_dark_shadow_impact` center) + the laughing-skull sig.
- `racePlaguefield`: was zoneDebuff — now kind `terrainCreate` with
  `squareFlood`, painting a PERMANENT 3×3 of new terrain **`plague_flesh`**
  (data.js TERRAIN_RULES near the flesh trio; sprite = `flesh_2.png` via
  sprites.js; minimap colors in data.js + match-select.js). Its `endTurn`
  poisons (2 turns) anyone ending a turn on it EXCEPT race 'necromancer'.
  healMultiplier 0.5. VFX: wall-intent mapping to `sharedPoisonSwamp_tile`
  fires per tile + the flesh-mound sig at center.
- `raceDarkResurrection` REPLACED by `raceRaiseDead` — new kind **`raiseDead`**:
  targets ANY dead unit's tile in range 4 (ally gravestone or enemy bone pile,
  gated on `!u._corpseConsumed`). Consumes the corpse (`_corpseConsumed` +
  `reviveLocked`; renderer skips its grave marker & hashes the flag out of the
  deployable serial) and pushes a **zombie** into `state.turrets`:
  `{ zombie:true, hitsToKill:true, hp:3 }` — 3 hits to destroy, inherits the
  whole turret pipeline (attackable, fogged, rebuilt on serial). End-of-round
  (processTurretVolleys): shambles up to 2 tiles toward the NEAREST unit of
  EITHER side and mauls it (melee, ~60 + half caster spellpower, no sourceUnit).
  Real-time mode: shambles 1 tile / attacks adjacent on the turret clock.
  Model: `_buildZombie3D` (three-renderer, above `_buildTurret`) — flesh-terrain-
  textured meat hunch + enamel skull/claws/bone spurs, seeded from its id.
- Bone Barrage: kept mechanics; added `_sigBoneRain3D` (three-vfx-effects, after
  `_sigSkull3D`) — real 3D enamel-textured bones + mini skulls hail over the
  3×3, bounce, settle, fade. Fired from the existing `raceBoneBarrage_aoe`
  mapping via `_spell3DGeometry`.
- **Racial passive "Deathfeed"** (battle.js `getNecroDeathPower`, folded into
  `getSpellStatBonus`): +8 effective INT per unit CURRENTLY dead on the board
  (both sides) feeding all magic spell power. Not shown in HUD stat panels.

Gotchas learned:
- New spell `kind`s must be registered in FOUR places: SPELL_KIND_META
  (battle.js ~246), hasSpellTargetInRange, `_desc` real-time cat map (give
  turn-only kinds their own cat so the exec switch refuses cleanly), and
  ai.js scoreSpell + pickTarget. `_getSpellValidTargets` needs explicit
  handling for corpse-targeted kinds (dead units are filtered by default).
- data.js TERRAIN_RULES endTurn hooks CAN call battle.js helpers like
  `ensureUnitStatus` — every gameplay file's functions are top-level/global
  (the deep_water hook already does this).
- Spell-made terrains (castle_wall, plague_flesh) do NOT need MF_TID /
  ME_TERRAIN_IDS entries — those arrays only serialize editor-placed maps.

## FLOW STATE rename + anime power auras (2026-07-16) — three-renderer.js, three-vfx-effects.js, battle.js, hud.js
Token bumped `20260716d` → `20260716e`. NOT playtested (per RULE #1c) — syntax-checked only.
- **"ON FIRE" (3+ killstreak) renamed to "FLOW STATE"** everywhere player-facing
  (it read like the burn status effect): STREAK_LABELS[3] = `🌀 FLOW STATE!`,
  bounty post/claim log+dialogue lines, unit-panel status entry, hud.js chip,
  nameplate badge (still class `tp-onfire`, now gold-tinted), combat-log
  colorizer (gold, next to LAST STAND red). INTERNAL names unchanged:
  `isUnitOnFire/_killStreak/onFireOverflowAP/ENTROPY_PTS.bounty` etc.
- **DBZ-style power aura system** (three-renderer.js, after _updateTorchFlames):
  two nested wobbling shader flame shells (tileable value-noise canvas scrolled
  in the frag shader, additive), pulsing ground shock-ring, base glow sprite,
  8 rising energy streaks, occasional ThreeLightning crackles, budgeted
  PointLight (max 4). Driven per-frame by `_updateUnitAuras()` straight from
  unit STATE — attaches/detaches to `unitEntries` groups itself, survives
  rebuilds (re-attaches at full fade if seen <600ms ago → no flicker on move),
  shared geometry cache flagged `_ew_shared`.
  - killstreak ≥3 → persistent GOLD Flow State aura (replaces the old
    head-torch flame billboard, which was removed from _buildUnitEntry).
  - `_lastStandTriggered` → persistent CRIMSON aura.
  - `window.EWPowerAura.burst(tx, ty, {color, durationMs, scale, radius})` →
    timed spell-cast aura; only `color` needed (mid/core/light/ring/spark
    stops derive); `radius` wraps same-team units in Chebyshev range.
  - Kill-switch: `window.EW_DISABLE_POWER_AURA = true`. Suppressed during
    devAutoSim/animationsDisabled.
- **Spell integration** (three-vfx-effects.js `_POWER_AURA_SPELLS`, called from
  `_fireAura`): raceKiCharge (ki blue-white, the flagship), warCry (gold),
  raceNordicWarcry (ice, radius 2 → allies too), raceRampage (red), raceApeFury
  (orange), raceInnerDemon (violet), overclock + raceOverclock (teal),
  raceNitroBoost (blue), raceHowl (silver), raceAdrenalineRush (amber).
- **ONLINE PARITY (RULE #2)**: persistent auras key off SYNCED unit fields
  (`_killStreak`, `_lastStandTriggered` ride the wholesale state.units sync),
  so guests render them locally — no relay needed. Spell bursts fire inside
  `_fireAura`, which the guest replays via the existing `vfx3d` relay (with its
  fog gate). Fog hides persistent auras with the unit group they're parented to.
- GOTCHA: `_updateUnitAuras` builds a fresh id→unit map each frame — on guests
  `state.units` is REPLACED by every state-sync, and `_unitById` only refreshes
  on STRUCTURAL rebuilds, so caching unit refs there would go stale.
