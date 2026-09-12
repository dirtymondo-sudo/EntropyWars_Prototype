# AI v4 — ground-up rewrite of the tactical brain (2026-08-15)

One brain, one file, one currency. `ainew.js` is gone (deleted; its combat edges
were absorbed), `ai.js` was rewritten around a commensurable value model. This
doc is the architecture reference for future sessions — read it before touching
ai.js scoring.

## Why the old AI was structurally broken (stats15 post-mortem)

The old scorer was an accretion of incommensurable numbers: damage spells scored
in ~HP units, buffs in hand-picked constants (28), moves in waypoint-progress
units (×10), and then a **null-move gate** zeroed any non-damage candidate that
scored below `max(bestMoveScore*0.8, 15)` — so a 28-point buff lost to a
15-point random walk *by design*. Utility was further hard-capped at
`bestDamage*0.6–0.8`, unhandled spell kinds fell through to `return 5`, debuffs
were vetoed outright on marked targets, and damage was estimated as `atk*0.65`
flat with the wrong type multiplier (1.5 vs the engine's 1.30) and no armor,
shields, or MP cost. On top of that a second brain (ainew.js overlay) played
some jobs and delegated others to the old one, so job win rates measured *which
AI played the job*, not the job.

Design sources: XCOM 2 (intent selection then scored destination search),
Fire Emblem (per-target expected damage minus expected retaliation, kill
bonuses, no-suicide vetoes), Pokémon gen 3+ (layered veto → score → pick;
never pick a move that does nothing), Dave Mark-style utility AI
(commensurable considerations, no magic floors), Battle Brothers dev blogs
(one currency: expected hitpoint swing).

## The five rules

1. **One currency.** Every candidate action is scored in **expected effective-HP
   swing** (1 point ≈ 1 HP of value at level-cap magnitude). Damage dealt,
   damage prevented, HP healed, actions denied, tempo gained — all converted
   into the same unit. No caps, no floors, no null-move gate. A no-op scores ~0
   and anything real beats it naturally.
2. **Engine-true damage oracle.** `estDamage()` mirrors
   `applyDamageToUnit`/`calcDamageResolution` exactly: spellPower =
   `0.35×stat_at_cap` (+BM +8, hourglass), offensive multiplier *product*
   (type 1.30/0.75 × STAB 1.25 × downhill 1+0.1Δh × range-profile 0.8–1.2
   (sniper inverted 0.6–1.2) × bonusVsStatus 1.5, capped ×3.0), +40 marked,
   ×`offenseScale` (level magnitude × 1.75 pace × gap), − armor
   (`getEffectiveArmor`×defenseScale + height soak 5/Δh + Tank bulwark 8 +
   hourglass soak), × status damage-taken mults, shields absorb first.
   Kill checks compare vs `hp + shield`.
3. **Plan the turn shape.** The engine turn is `[≤1 setup action or move] +
   [1 damaging action → turn ends]`, with exactly one press refund (+2 AP) for
   the turn's first weakness-hit/crit. The planner therefore evaluates
   act-from-here vs move-then-act (1-ply joint move×action search, the ainew
   "chess engine" pass generalized) and values press lines as a fractional
   free action.
4. **Veto only the impossible.** Hard vetoes exist solely for actions the
   engine would reject or that literally do nothing (heal at full HP, damage an
   element-drinker, misaligned beam, leapStrike from below, protected target).
   Everything else competes on value.
5. **One brain for every job.** No PURE_SUPPORT delegation, no class score
   multipliers pretending to be roles. A White Mage heals because its heal is
   *worth more* than its poke in the currency, not because of a ×2.0 class tag.

## Value model (the currency)

- **Damage**: expected post-mitigation damage, **capped at the target's
  remaining effective HP** (overkill is worthless), × land probability
  (evasion for front/side basic attacks; back-arc is sure).
- **Kill premium**: removing a unit removes its future output:
  `KILL_BASE (60) + 0.6 × target's per-turn threat + support premium
  (healer/high-INT) + mode premium (points modes)`. Cheapest sufficient
  killer wins (MP cost still subtracts).
- **Press**: expected refund = `P(weak/crit) × 0.6 × best-alternative value`,
  and resisted hits pay the −1 AP drain as a negative.
- **Healing**: `HP restored × urgency(hpFrac) × threat-reality factor`.
  Urgency scales with the fraction of the pool restored on a unit that
  enemies can actually still reach — a 192 HP top-up on a 900 HP pool at
  full safety is worth ≈ its HP, not 5× a kill.
- **CC / denial**: `P(apply) × (denied actions × target's per-turn output)`.
  Stun/freeze/sleep/charm on a full-AP caster ≈ its whole turn; root on a
  melee unit ≈ its approach; silence on a caster ≈ its casts. Soft debuffs
  score their stat-stage impact. INT differential feeds P(apply).
- **Status setup (bonusVsStatus)**: applying status S is also worth the ×1.5
  payoff it unlocks: scan the team's kits for spells with
  `bonusVsStatus S`, add `0.5 × (mult−1) × their est damage` when they can
  plausibly collect next turn. Payoff side is already in the oracle (rule 2).
- **Buffs/shields**: stat stages × expected remaining exchanges × stat→HP
  conversion; shields = HP granted × threat reality.
- **MP cost**: every cast pays `mpCost × λ`, λ ≈ 0.9 (tunable
  `AI_TUNE.mpValuePerPoint`) — cost is a real lever now, and the MP-dump
  multiplier is gone.
- **Delayed spells (Take Aim / Nuke…)**: damage × P(still there at
  detonation): ~1.0 vs rooted/stunned/frozen/sleeping targets, ~0.75 for
  unit-tracking marks, ~0.35 for ground-tile blasts. Never counted as a
  kill-securer.
- **Positioning**: Δ(best action value achievable) − Δ(expected incoming
  damage, HP-asymmetry-weighted) + height/backstab/sweet-spot terms +
  hazard penalties + macro-intent progress (below).

## Macro layer (modes)

The old intent layer survives (it was the one well-shaped piece): per-mode
goals (CTF carry/intercept, hotspot/domination/arena nexus, TDM hunt,
hourglasses, tower siege/defend, explore, retreat) are generated as scored
goals — now denominated in the same currency (an hourglass ≈ 140, a nexus
channel tick ≈ 90–160, tower pushes scale with win-state) — and the winner
becomes the movement objective fed to the A* waypoint pathfinder (kept).
Hard difficulty still multiplies objective intents ×1.3.

## What was kept verbatim (engine-mirroring plumbing)

- `buildVision` fog/concealment discipline (never target unseen units).
- Per-kind spell target pickers (`findSpellTarget`) incl. ring-AoE centers,
  elemental tile fallback, line-ray walking + cast-time re-aim
  (`window._aiReaimLineSpell`, SimulEngine depends on it).
- `executeAction` delay contract (run → returned delay →
  `finishComputerAction`), skyThrow two-phase, per-activation failed-action
  memos, stall/loop safety nets.
- Items, nexus channel, recall, build/dig, altitude, gauntlet switching,
  flair/ward, detonate, entropy strike, combos.
- A* waypoint pathfinding with per-unit climb/phase rules.
- Difficulty profiles (easy = softmax top-3, no combos/press hunting, no
  joint search; hard = objective persona) and `_ewGetAiDifficulty` API.
- `window._aiPlanCandidates` (Simul mode) and trained-weight lookups
  (`getAIWeight`, schema 12 keys).

## What ainew.js contributed before deletion

Real-damage estimation through the engine pipeline, press-turn valuation,
team focus fire with confirm-kill burst analysis, 1-ply move×shot search,
threat maps from real per-matchup damage, leapStrike/flight precondition
mirroring, line-beam ray walking, kill-with-cheapest-action, kiting when out
of actions. All rebuilt into the core rather than layered on top.

## Tuning knobs

`AI_TUNE` in ai.js — now *documented* constants in the one currency
(killBase, mpValuePerPoint, pressActionFraction, healUrgency curve,
ccDenialPerAP, focusCommitBonus, threatSelfWeight…). The 15 trained
schema-12 weights in battle.js (`AI_WEIGHT_DEFAULTS`) still apply where they
map cleanly (kill bonus, press refund, tower/nexus/hourglass priorities,
engage threshold, anti-oscillation); dead references were dropped.

### Schema 13 (2026-08-15, same-day follow-up)

The trainer was rebased onto v4: the 4 schema-12 keys with no remaining
code path (healPotionHpPct, statusEffectBonus, safeEnemyDistWeight,
healAllyThreshold) are deleted, and 6 AI_TUNE value-model knobs are now
TRAINABLE `_v4` keys (mpValuePerPoint, threatCostFactor, killBase,
supportKillPremium, pressActionValue, focusCommitBonus) — ai.js reads them
via `tuneW(g, key)`, which routes through battle.js `getAIWeight`, so A/B
experiments, the trained champion, the strength-test baseline pin AND
campaign difficulty multipliers all apply automatically. RULE: never read
those six via `AI_TUNE.x` directly, and keep `AI_WEIGHT_DEFAULTS` `_v4`
defaults byte-identical to AI_TUNE (an untrained install must play the
shipped constants; there's a delivered check for it). v12 trained weights
migrate forward (surviving keys keep values, pruned keys dropped).
`window.EW_AI_VERSION` stamps every Balance Lab export's `_meta.aiVersion`
— reset balance data after any AI change or exports mix brains (stats17
did).

## Validation

### 2026-09-10 — adversarial navigation/beam fixes (local delivery)

AI stamp: `v4.2-2026-09-10-navigation`. `advance_to_mid` now uses the active
board helpers. Waypoints recompute for each macro movement decision instead
of retaining round-scoped success/failure/null results across terrain,
height, flight, phasing or match changes. The corridor shortcut now checks
edge walls as well as cells and height; phasing still bypasses edge walls.
One waypoint query is made per macro selection, not per reachable tile.

`_lineRayTilesAI` shares the aimed beam spine across `scoreSpell`,
`findSpellTarget` (including re-aiming) and `jointMoveActionSearch`.
Hypothetical beams require eight-ray alignment, raw beam step range, current
terrain and LOS from the landing height. Diagonal beams no longer lose half
their reach through a Manhattan-distance gate. The caller still filters
visible/protected enemies and spell affordability, and execution re-picks
the actual action after movement. No new state/relay fields or tuning weights.

`ai-navigation.test.js` executes the production closure with controlled board
queries and damage-value stubs: 15 checks, including mirrored board centers,
same-round route edits, flight/height/phasing, new-match identity, legal
diagonal versus off-ray beam choices, walls and elevated LOS. Fourteen fail
against the old AI; all pass after fixes. Full package command: 247 passed,
0 failed, 2 existing skips; syntax 69/69 clean. No browser playtest or AI
simulation. A* cost on large real maps is unmeasured. Wide-beam side-lane
valuation and destructive-breach prediction remain outside this batch;
the helper deliberately preserves existing aimed-spine target selection.
The complete runtime files are `ai.js` (R2) and cache-busted `index.html`
(Render). This log and tests go to the repository. Deployment unverified.

- `npm test` (syntax + schema + parity) must pass.
- Balance-lab expectations for the next stats run: dead slots/loadout < 1.5
  (from ~2.7), discord/frozen/charm applications > 500 each, Psychic/
  Harbinger/WM win rates move, melee/utility races (swordfighter, knight,
  king arthur, shaman, werewolf) rise, Requiem whiff ≈ 0, Teleport/Cleanse/
  Encore/Ground Slam cast counts > 0.

### 2026-09-11 — adversarial Phase 6 spell dispatch (local delivery)

Pinned main: `82906801a763c0ce5fe943bdde48980d60ee7776`. AI stamp:
`v4.3-2026-09-12-spell-routing`. Hit a Lick (`steal`) and Purify
(`cleanseArea`) had scorer and target-picker branches nested under
`utility`, so normal spell selection skipped them. Both now dispatch at
kind level; missing targets score zero. Existing values and all execution,
resource, failed-action and online contracts are preserved.

`ai-spell-routing.test.js` executes production dispatch/candidate/executor
functions with canonical data and controlled board, damage and engine-call
doubles: 13 pass, 10 fail on the pinned baseline, three controls pass on both.
The champion source guard now requires direct dispatch and null guards.
Full suite: 720 total, 718 passed, zero failed, two existing skips. No browser
playtest, simulation, actual doSpell-effects validation or deployment.

`check-ai-spell-dispatch.js` inventories 501 canonical spells / 65 kinds.
It does not prove every utility ID or executor works. Remaining direct
scorer/picker gaps: guard/Trick Room. Prism self-casts have scorers and
no-target admission but no target coordinates for the generic executor;
inspect mirror ownership as well. Wide Plasma Cannon/Tsunami still use
spine-only AI geometry. The review plan contains evidence and the exact
next task: prism self-cast contract, then wide-beam direction/footprint.

Complete files: ai.js → R2, index.html → Render (shared token
`20260912-ai-spell-routing-01-cors`); tests, tooling and docs → repository.

### 2026-09-11 — Phase 6 prism self-cast contract (local delivery)

Baseline main: `043dede2ada453c7ccc9d022438988107eeba64a`; relevant Git blobs verified. AI stamp `v4.4-2026-09-12-prism-selfcast`.
Pulse Lattice and Tune Frequency return the caster as their target, supplying coordinates to ordinary execution and Simul conversion. Removed their no-target exemptions. Keep player-wide mirror ownership: `ownerUnitId` is only the placement-cap owner; the lattice intentionally aggregates `owner === unit.player`.
Canonical Tune costs 75 MP, so its score 12 is rejected under default MP weight; trained weight 0.1 admits it. Preserve this distinction when assessing reachability. Frequency-aware valuation remains open.
Twelve new production AI/real network checks pass; six fail on baseline. Full package script via bundled Node: 732 total, 730 pass, zero fail, two skips. Syntax 105/105. `doSpell` is doubled; no gameplay, simulation or live multiplayer acceptance. Simul conversion was source-reviewed.
Complete delivery: ENTROPY_WARS_PHASE6_PRISM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-prism-selfcast-01-cors`); tests/docs → repository. Not deployed. Exact next task: wide-beam footprint/direction correspondence for Plasma Cannon and Tsunami, then guard/Trick Room and Tune valuation, then mode-aware endgame evaluation. See review plan for evidence limits.

### 2026-09-11 — Phase 6 wide-beam direction/footprint (local delivery)

Baseline main `3a00af7735cb8e96681bc1c771841794c85cb368`; relevant Git blobs verified. AI stamp `v4.5-2026-09-12-wide-beams`. Plasma Cannon/Tsunami side lanes now follow the spine's reach, engine width/diagonal offsets and side-cell passability. Shared AI footprint drives full-direction scoring, target discovery, hypothetical movement and cast-time re-aim. Return aligned aim coordinates plus a victim ID for Simul; never aim directly at an off-spine victim. Movement charges MP once and uses destination elevation. Shared narrow-beam direction valuation also uses total spell value; no tuning weights or online fields changed.
28 production AI/engine-footprint/Simul checks pass; 26 fail before. Full package script via bundled Node: 760 total, 758 passed, zero failed, two skips. Syntax 106/106. Damage, board and doSpell boundaries are doubled; no browser, simulation, performance or live multiplayer acceptance. Destructive wall-boring prediction and existing Simul null-re-aim fallback remain open; see the review plan for scope and evidence.
Complete delivery: ENTROPY_WARS_PHASE6_WIDE_BEAM_FIXES.zip. ai.js → R2; index.html → Render (`20260912-wide-beams-01-cors`); test and docs → repository only. Not deployed. Exact next task: AI-04b guard/Trick Room and Tune valuation, then AI-06 endgame evaluation. Phase 6 remains open; VFX work stays deferred.

### 2026-09-11 — Phase 6 utility contracts / Trick Room reset (local delivery)

Pinned main `844c4ba424963f301a0dd24e952f2ce08cc5838a`; nine relevant Git blobs verified. Added initial `_trickRoomRounds: 0` and clear it in the four match/roster data reset blocks in battle.js. An old cast can no longer reverse the next match's opening order through these blocks. Actual Blitz duration/order and host scalar serialization are preserved. No AI weights or relay changes; ai.js remains unchanged.
12 new focused checks pass; five fail before, seven controls pass before/after. Runs actual reset blocks/order builder/host serializer with controlled boundaries, not complete UI/map reset routes. Full suite via bundled Node: 772 total, 770 passed, zero failed, two existing skips. Syntax 108/108. No browser, simulation or deployment.
The utility diagnostic confirms null Chivalry/Trick Room targets, Simul comparator ignoring reversal, constant Tune scores and Pulse scoring independent of frequency despite distinct engine damage/effects. See the latest review entry for detailed contracts, evidence limits and residuals. Simul duration does reach common end-of-round upkeep; do not describe it as never decrementing. Chivalry transfers a raw hit to the guardian, not shield HP. Tune must compare the next frequency against the current one; Pulse/crossing/burn effects share the frequency.
Complete package: ENTROPY_WARS_PHASE6_TRICK_ROOM_RESET.zip. battle.js and state.js → R2; index.html → Render (`20260912-trick-room-reset-01-cors`); tests/diagnostic/docs → repository. Next: Chivalry legal-target/net-transfer scoring, Trick Room Simul/effective-speed contract and mode-aware scoring, then coupled Tune/Pulse valuation and AI-06. Phase 6 stays open; VFX stays deferred.
