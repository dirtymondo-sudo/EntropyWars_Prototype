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

## Validation

- `npm test` (syntax + schema + parity) must pass.
- Balance-lab expectations for the next stats run: dead slots/loadout < 1.5
  (from ~2.7), discord/frozen/charm applications > 500 each, Psychic/
  Harbinger/WM win rates move, melee/utility races (swordfighter, knight,
  king arthur, shaman, werewolf) rise, Requiem whiff ≈ 0, Teleport/Cleanse/
  Encore/Ground Slam cast counts > 0.
