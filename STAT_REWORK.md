# STAT REWORK — letter grades, readable numbers, SPD⇄MOV consolidation

> **STATUS 2026-08-29: IMPLEMENTED (phases 1–3 + rev 3a, one delivery).**
> Letter grades live at all five display sites (`statGrade`/`STAT_GRADE_BANDS`
> in data.js, `.stat-grade` chips in styles-base.css); the six core stats sit
> on the 0–100 ruler (`RACE_BASE_STATS` migrated: DEF ×1.2, MDEF ×1.6,
> AWR ×14, SPD via the MOV-preserving band formula — every race kept its
> exact tile count, and DEF/MDEF got a ±1 "parity nudge" where the ×0.25
> armor fold would otherwise have lost a point through the compensator);
> inverse compensators sit at every consumption point (armor folds, crit,
> opp-attack, RT cooldown/accuracy, keen-sense 84+, inspect ÷14, MD alert
> radius); stages are ±20 = one letter with NO count cap, ruler-clamped at
> apply AND read time, on the per-application `unit.statStageMods` ledger
> (statUp/statDown are derived badges; cleanse/censer funnel through
> `clearStatus`); MOV derives from SPD (`moveFromSpd`, cap 5) with the
> halved second move in `getMoveRangeThisTurn`; the legacy spd-9+ jump-2
> crowd is preserved in `RACE_JUMP_OVERRIDE`'s companion `RACE_NIMBLE_JUMP`
> and the gate moved to SPD 90+; ai.js got the rev-3a audit (bound-aware
> stage valuation via `stageRoom`, re-priced per-stage worth, halved
> double-move projection, follow-up-debuff bonus). `npm run grades` prints
> the roster grade sheet. Deliberately NOT done (separate tuning pass, §5
> item 5): SPD jitter within bands, outlier hand-nudges (marksman band-top
> etc.), and re-costing the ~37 two-stage race abilities the step change
> strengthened (grep `check-grades`/`STAT_REWORK` notes below).

*2026-08-29 — analysis + step-by-step plan (rev 3: stages clamp at the
RULER'S bounds, not at ±2 stages; baseline S speed is allowed and the
map-crossing guard moves to a halved second move).
Goal: make stats easy to read and grade (letters shown BESIDE the number,
never replacing it), and fold movement range into the speed stat — WITHOUT
rebalancing the game. Individual unit tuning comes later, on top of this.*

**The one rule everything hangs on:** every graded stat lives on **1–100**;
a letter grade is a **20-point band** (`letter = ceil(stat / 20)`); a stat
stage (buff/debuff) is **±20 = exactly one letter**; and for SPD, **one
letter = exactly one movement tile** (F speed walks 1 tile, S speed walks 5).
Five letters, low→high: **F · C · B · A · S** (D dropped — F still screams
"dump stat" and S keeps the JRPG crown; if you'd rather keep the school
ladder, the alternative is dropping S for F·D·C·B·A — pick once, it's a
one-line constant).

---

## 1. How stats are produced today (so we know what we're grading)

- **`RACE_BASE_STATS` (data.js) is the whole story.** Since the 2026-08-14
  identity rework each race's statline is FINAL — the primary job is baked in
  and `computeUnitStats` applies no primary-job delta. Everything after that
  is a small shift: secondary job (`JOB_MODIFIERS`, Pokémon-nature-sized:
  ±12 atk/int, ±80 hp, ±40 mp, ±2 spd/awr), gear, zodiac.
- **RNG comes from `JOB_KITS`** (per job, not per race): 10 jobs are range 1,
  three are range 2, one is range 3 → it's a kit fact, not a stat curve.
- **MOV is hard-capped at 3** (2026-07-13: move 4+ crossed an 8×8 map in one
  turn with double-moves). Real domain is 1–3, and 96% of the roster is 2–3.
- **CRT/EVA are derived** (CRT from AWR, EVA from MOV — `critChanceFromStats`
  / `evasionChanceFromStats`), so they inherit whatever we do to their parents.
- There is already an internal **value-weighting budget** (comment above
  `RACE_BASE_STATS`): 1 ATK/INT ≈ 12.5 HP ≈ 6.7 MP ≈ 1.25 DEF/MDEF ≈ ¼ SPD/AWR
  point. So the game already believes the stats live on different scales —
  the rework's job is to stop making the *player* do that conversion.

## 2. Measured distribution (all 96 races, real data.js values)

| stat | min | p10 | p25 | med | p75 | p90 | max | mean | shape |
|------|----:|----:|----:|----:|----:|----:|----:|-----:|-------|
| HP   | 385 | 443 | 480 | 545 | 641 | 708 | 820 | 563  | smooth bell |
| MP   |  40 |  75 | 105 | 145 | 215 | 240 | 265 | 156  | two lumps (martials ~100, casters ~220) |
| ATK  |   8 |   8 |  18 |  54 |  80 |  92 | 100 |  51  | **bimodal**: 22 races at ≤10 (caster dump), fighters 60–100 |
| M ATK|   0 |  18 |  26 |  31 |  84 |  90 | 104 |  50  | **bimodal**: martial dump 20–31, casters 60–104 |
| DEF  |  12 |  18 |  21 |  28 |  40 |  57 |  84 |  33  | right-skewed, long tank tail |
| M DEF|  15 |  20 |  26 |  35 |  52 |  58 |  61 |  38  | two lumps; **max is only 61** |
| SPD  |   2 |   3 |   5 |   7 |   9 |  10 |  10 |  6.7 | only 9 distinct values, top-heavy (13 races at 10) |
| MOV  |   1 |   2 |   2 |   2 |   3 |   3 |   3 |  2.4 | 4 / 51 / 41 races at 1 / 2 / 3 |
| AWR  |   1 |   2 |   3 |   4 |   6 |   7 |   7 |  4.3 | flat-ish, 7 distinct values |

**Verdict on "can there even be an S–F scale?": yes.** Every stat has real
spread and a top tail. The two problems are exactly the ones you suspected:

1. **Scales are inconsistent.** A "great" ATK is ~90 but a "great" M DEF is
   ~58 and a "great" SPD is 10. Same-looking numbers mean different things.
2. **ATK and M ATK are bimodal by design** (mutually exclusive peaks — the
   identity rework did this on purpose). So grades for those two stats will
   naturally cluster at F/D and A/S with a thin middle. That's fine — it's
   honest: a wizard SHOULD show ATK: F.

## 3. How other games handle this (patterns worth stealing)

- **Mario Kart 8 / Pokémon model — precise inside, coarse outside.** MK8
  stores fine-grained internal stat points but displays coarse bars; Pokémon
  stores 0–255 base stats and the community reads them as tiers. Pattern:
  *keep the exact number for the engine and the tinkerers, put a coarse
  grade on top for at-a-glance reads.* That's exactly "letter beside number".
- **Fighting-game stat cards (Granblue Versus, Smash community tier cards)**
  grade each attribute A–D/S **relative to the cast**, not on an absolute
  ruler. An S means "top of the roster today" — which auto-survives later
  rebalances if thresholds are percentile-anchored.
- **Fire Emblem / FFT keep MOVE tiny and separate** because a tile is worth
  ~15–20 statpoints of anything else. FFT's Speed drives turn frequency (CT)
  while Move stays 3–4. Lesson for the consolidation: derived move must use
  **wide, clearly-displayed bands** ("SPD 74 → 3 tiles"), because a 1-tile
  swing is the biggest single-stat swing in the game.
- **One shared 0–100 ruler beats per-stat rulers** (every modern card-style
  stat screen). Players learn ONE mapping: 90+ is elite, 50 is average,
  <20 is a dump stat. Your instinct ("S shouldn't be 80 in one stat and 130
  in another") is this pattern; HP/MP/RNG are the standard exceptions
  (they're resource pools / kit facts, not 0–100 attributes).

## 4. Recommendation — three phases, each shippable alone

### Phase 1 — letter grades NOW (display-only, zero balance impact)

Add one table + one helper to **data.js** (next to `STAT_HELP`, exported the
same way) and render the grade beside the number everywhere. Nothing in
battle.js changes; online needs no relay (grades are derived from state both
clients already have).

```js
// data.js — five letters, one 20-band each. The interim thresholds below
// are simply the universal bands (81/61/41/21) DIVIDED by each stat's
// Phase-2 rescale factor — so the letter a unit shows today is IDENTICAL
// to the letter it will show after the rescale lands. HP/MP keep bespoke
// bands (they're pools, not 0–100 attributes).
const STAT_GRADE_LETTERS = ['S', 'A', 'B', 'C'];   // high → low, else F
const STAT_GRADE_BANDS = {
  //        S     A     B     C   (else F)
  hp:    [700,  620,  540,  460],
  mp:    [235,  190,  140,   80],
  atk:   [ 81,   61,   41,   21],   // already 0–100
  int:   [ 81,   61,   41,   21],
  def:   [ 67,   51,   34,   17],   // = 81/61/41/21 ÷ 1.2
  mdef:  [ 51,   38,   26,   13],   // = ÷ 1.6
  spd:   [  9,    7,    5,    3],   // = ÷ 10
  awr:   [  6,    5,    3,    2],   // = ÷ 14
};
function statGrade(key, val) {
  const bands = STAT_GRADE_BANDS[key];
  if (!bands) return null;                      // move/range/crt/eva: no grade
  for (let i = 0; i < bands.length; i++) if (val >= bands[i]) return STAT_GRADE_LETTERS[i];
  return 'F';
}
// After Phase 2 the six core stats collapse to the universal rule:
//   S 81–100 · A 61–80 · B 41–60 · C 21–40 · F 1–20   (= ceil(val/20))
```

Heads-up on what absolute 20-bands mean vs. percentile bands: grades no
longer track the roster — they ARE the ruler. Today's top-heavy lumps show
through honestly (≈26 races grade S in ATK, 13 races sit at SPD 10). That's
not a bug; it's the to-do list for the later tuning pass (spread the top
lump across 81–100 so S actually discriminates).

Display sites (all already have a `STAT_HELP` hover after the 2026-08-29
tooltip pass — the grade chip goes in the same places):

| where | file / spot |
|-------|-------------|
| Party builder bars (HP/MP/SPD/AWR/CRT/EVA) | `party-builder.js` `StatBar` — small colored chip before the value |
| Party builder ATK/M ATK/DEF/M DEF quadrant | `party-builder.js` QUAD_KEYS block |
| In-battle INFO stat card | `ui.js` `statBar()` (the `ins-stat` rows) |
| Quick-menu stat grid | `hud.js` `_hrlgQuickStats` cells |
| Codex dossier | `ui.js` `_codexBuildStatBar` |

Style suggestion: one 10px chip, color per grade
(S gold `#f2c63c`, A green `#3ddc84`, B teal `#4ecbe2`, C neutral `#c8c8e4`,
F red `#ff5e5e`) — reuse across all sites so the language is learned once.

Deliberate non-grades: **MOV and RNG** (tiny numbers with diamond footprints
— a letter adds nothing to "3 tiles"), **CRT/EVA** (already a % — a grade on
a percentage double-encodes). Zodiac ▲▼ and ± deltas stay as-is; grade is
computed from the FINAL displayed value so gear/sub-job can genuinely move a
unit from B to A — that's a feature (build feedback), not a bug.

Balance-tool bonus: a 10-line script over `load-data.js` can print the
roster as a grade sheet (race × stat letters) — instant view of who has too
many A/S columns. Worth adding as `check-grades.js` (repo-only tooling, fine
per RULE #1).

### Phase 2 — put the six core stats on ONE 0–100 ruler (small data pass)

Phase 1 letters are consistent in *meaning* but the raw numbers still sit on
four different rulers. Phase 2 rescales stored values so the SAME band table
serves ATK/M ATK/DEF/M DEF/SPD/AWR — a find-multiply pass over
`RACE_BASE_STATS` + inverse compensators at the few consumption points, so
combat math is IDENTICAL:

| stat | rescale | compensator (battle.js) |
|------|---------|--------------------------|
| ATK, M ATK | none — already 0–104 | — |
| DEF  | ×1.2 (max 84→101) | armor application ×0.83 |
| M DEF| ×1.6 (max 61→98)  | magic soak ×0.625 |
| SPD  | ×10 (2–10 → 20–100) | opp-attack ×0.003/pt, jump gate 9+→90+, RT cooldown /10 (stage step: see below) |
| AWR  | ×14 (1–7 → 14–98) | crit +0.143%/pt, keen-sense gate 6+→84+, opp-attack ×0.0014/pt |

Then the universal rule takes over for all six: **letter = ceil(val/20)**
(S 81–100 · A 61–80 · B 41–60 · C 21–40 · F 1–20), and `STAT_MAX_PB`
becomes 100 for them. HP/MP keep their own bands (your stated exception —
they're pools, and 600 HP reads better than "HP 54").
Also touch: `JOB_MODIFIERS` (±12 def→±14, ±2 spd→±20, ±2 awr→±28), gear/
zodiac stat bonuses, `server.js` parity literals if any of these constants
are mirrored (run `npm run test:parity`).

**Stat stages become the letter-mover: `STAT_STAGE_STEP` = 20 for all five
staged stats** (atk/def/mdef/spd/int — today 14/9/9/3/12). One stage = one
letter grade up or down, full stop — the buff/debuff UI can literally say
"ATK B → A". Two consequences to accept, not fight: (a) this is a real
strength change per stage (ATK/M ATK buffs ~1.5× stronger than today,
DEF/M DEF roughly 2×, SPD slightly weaker) — fine, it's the readable number,
retune individual spell durations later if something screams; (b) stages
currently stack to ±5, which on a ±20 step is ±100 — the whole ruler.
**That is allowed (rev 3 decision): there is NO stage-count clamp.** The
only clamp is the ruler itself — the effective stat saturates at **100**
and at the floor (**0** for atk/int/def/mdef, **1** for spd — spd feeds
movement, turn order and cooldown divisions, so it never reaches 0).
Buffing an F unit to S, or grinding an enemy's S stat down to F, is legal
by design; the counterplay is cleanse/dispel and the 3-turn stage timer,
which is on the OPPONENT to use. Two implementation rules keep the open
clamp honest:

1. **Clamp at APPLY time, not just read time.** Cap the STORED stage count
   at whatever count reaches the bound from the unit's current base (allow
   one final partial-value stage to touch 100/0 exactly). Otherwise
   overstacked buffs become an invisible buffer — a unit "at 100" that
   secretly holds +5 stages shrugs off the first few debuffs with no
   visible change, which reads as a bug. "+2 ATK (maxed)" must mean maxed.
   The existing `applyStatStageBoost` clamp line and its `(max)` log
   message are the spot — they become base-relative instead of ±CAP.
2. **One chokepoint.** `getStatStageDelta` returns
   `clamp(base + 20·stages, floor, 100) − base` so every consumer (damage,
   opp-attack, turn order, the Phase-3 move bands) inherits the bound for
   free. `STAT_STAGE_CAP = 5` dies with the rework.
3. **Per-application timers (rev 3a — DECIDED, ships with the step
   change).** Today all of a unit's stages ride ONE `statUp`/`statDown`
   carrier status; re-applying the carrier does `max(remaining, 3)`
   (applyStatusPayload's stack rule), so buffing +1 ATK onto an
   about-to-expire +3 refreshes the unit's WHOLE stage stack to 3 fresh
   rounds — and
   `getStatStageCount` counts stages of both signs while EITHER carrier is
   alive, so a live debuff timer keeps expired buffs working. Both wrong;
   with uncapped stacking they'd let a player keep a maxed stat alive
   forever with cheap +1 top-ups. Fix: replace `unit.statStages` with a
   ledger — `unit.statStageMods = [{stat, n, left}]`. Each application is
   its own entry with its own countdown (Psychic/Harbinger ±1-duration
   passives adjust that entry's `left`); the round tick decrements every
   entry and drops the expired ones, so the old +3 falls off on schedule
   while the later +1 lives out its own 3 rounds. Effective stage count =
   sum of live entries for that stat, then the chokepoint bound-clamp; the
   apply-time cap (rule 1) sizes the NEW entry against base + live sum.
   `statUp`/`statDown` stop being sources of truth and become derived
   badges (visible while any entry of that sign is live — their icon,
   VFX and statLock/Fermata gating all stay); cleanse deletes the entries
   of the targeted sign. It's plain unit data, so it state-syncs to the
   guest exactly like `statStages` did (still verify it's not on
   `_serializeState`'s skip list).

Real win hiding here: SPD currently has only 9 distinct values (13 races
share SPD 10). On the ×10 scale you can jitter within bands (98, 94, 91…)
to break turn-order ties and express "same tiles, different speeds" — which
is prerequisite to Phase 3 anyway. Do the jitter as part of tuning later;
the mechanical rescale alone must stay behavior-identical.

### Phase 3 — consolidate MOV into SPD (the real design change)

**Bands = letters = tiles.** The move-3 hard cap (2026-07-13) is replaced
by a **move-5 ceiling** so the bands stay clean 20s and line up 1:1 with
the letter grades:

| SPD | letter | tiles |
|-----|--------|-------|
| 1–20 | F | 1 |
| 21–40 | C | 2 |
| 41–60 | B | 3 |
| 61–80 | A | 4 |
| 81–100 | S | 5 |

`unit.move` stops being a stored stat; `getEffectiveMove` becomes
`ceil(effectiveSpd / 20) + all existing move modifiers` (statuses, terrain,
weather, hourglass, floor bonus — see next point), still floored at 1 and
now capped at 5.

**About re-opening move 4–5 (rev 3):** the old cap existed because move 4+,
with double-moves plus jump, crossed an entire 8×8 map in one turn and
trivialized positioning/teleports. Rev 3 decision: **baseline A/S speed is
allowed — there SHOULD be S-speed units.** The guard moves from "cap the
stat" to "cap the double-move": **the second move of a unit's turn covers
`ceil(effectiveMove / 2)` tiles**:

| eff. move | 1st move | 2nd move | turn total (was) |
|-----------|---------:|---------:|------------------|
| 1 (F) | 1 | 1 | 2 (2) |
| 2 (C) | 2 | 1 | 3 (4) |
| 3 (B) | 3 | 2 | 5 (6) |
| 4 (A) | 4 | 2 | 6 (—) |
| 5 (S) | 5 | 3 | 8 (—) |

Round **up**, not down: ceil needs no special case to keep move-1 units at
1 (2.5→3, 1.5→2, 0.5→1), and floor would collapse move 1/2/3 all onto a
1-tile second move, erasing the band differences exactly where 96% of the
roster lives. Ceil keeps every other band distinct (1/1/2/2/3). Accepted
side effect: this is a real (small) nerf to today's double-move plays —
move-2 units drop 4→3 total tiles, move-3 drop 6→5. That's fine; the
retreat-double-move was strong anyway, and the second move already costs
ALL remaining AP (it ends the turn) — keep that rule too, the two stack.

Implementation notes for the halving:
- Apply it in the movement-RANGE computation (the `maxMove` the overlay /
  pathfinder / `movesThisTurn >= 1` branch uses), **NOT inside
  `getEffectiveMove` itself** — EVA (`getEvasionChance` reads
  `getEffectiveMove`), fog camera gates, and AI threat estimates must not
  see the stat drop mid-turn.
- Order of operations: SPD (base + stages, bound-clamped) → band lookup →
  tile-space `moveDelta` statuses / terrain / weather / hourglass →
  floor 1, **cap 5** → THEN halve if `movesThisTurn ≥ 1`. Keeping the
  hard cap 5 after modifiers means Pixie Dust/hourglass on an S-speedster
  is wasted — same philosophy as the stat clamp, buffs saturate at S.
- **AI must learn the rule**: ai.js projects double-move reach and enemy
  threat as `move × 2`-ish today (kite ranges, zone-reach checks); with
  halving those estimates over-count by up to 2 tiles and the AI will
  plan unreachable retreats. Audit the `getEffectiveMove` call sites in
  ai.js when this lands.
- **Jump and teleport need the same scrutiny** — the 2026-07-13 complaint
  was move PLUS jump. An S-speed unit with jump is the new map-crosser;
  jump distance should not scale past the cap-5 spirit, and the SPD jump
  gate (90+ after rescale) now admits baseline units, not just buffed ones.

**Keep every move buff/debuff working by NOT converting them.** The five
`moveDelta` statuses (Slow −2, Drowning −1, Overclock +1, Pixie Dust +2,
Jack of All +1) plus terrain/weather modifiers keep acting **in tiles, after
the band lookup** — exactly as today. Only the BASE move is derived from
SPD. This is the "don't give yourself more work" path: zero spell rebalance,
zero relay changes, and "Slow" still visibly means "2 fewer tiles".
SPD *stage* spells (4 exist) apply BEFORE the band lookup with the ±20
step — so **one speed stage = one letter = exactly one tile** on the
first move, no matter where in the band you sit (the halved second move
compresses it: +2 stages there = +1 tile). (This is the payoff of aligning
stages, letters, and bands: no more "the buff did nothing because I was
mid-band".)

**Migration must NOT be `spd × 10`.** The current roster has 22 deliberate
SPD⇄MOV outliers (quick-but-short-legged: marksman SPD 9/MOV 1, mothman,
siren, fallen angel, robinhood…; slow-but-long-legged: knight SPD 4/MOV 3,
nephilim, kaiju, yeti, zombie, robot…). Naive rescale hands mothman two
extra tiles and strips the knight to 2 — that IS a rebalance. Instead derive
new SPD from the unit's **current MOV band, ordered by current SPD**:

```
newSpd = bandFloor(move) + round((oldSpd - 2) / 8 * 19)
   move 1 → band 1..20    move 2 → band 21..40    move 3 → band 41..60
```

Every unit keeps its exact tile count; act order within each band follows
old SPD. The one real, accepted balance change of the whole rework is
**global initiative**: fast-but-slow-legged units (marksman, mothman…) now
act later than before because tiles outrank raw speed in the new ordering.
Print a before/after act-order diff (script over `load-data.js`) and
eyeball it; hand-nudge the handful that feel wrong (marksman probably
deserves the top of its band, 20). If any identity truly needs "fast AND
short-legged", that's what a race passive is for (a `moveDelta:-1`-style
trait) — use sparingly, it reintroduces the exception the merge removes.

Also folds in automatically: EVA (already `evasionChanceFromStats(move)` —
now effectively speed-driven, which reads better anyway), AI pathing, fog
pans (all consume `getEffectiveMove`, which still exists). The MOVE diamond
in the party builder stays — relabel it "MOVE (from SPD)" and let its
tooltip show the band table.

## 5. Suggested order of work

1. ~~Tooltips on every stat~~ — **done 2026-08-29** (`STAT_HELP` covers all
   12 stats; wired in party builder bars/quadrant/footprints, INFO card,
   quick menu, codex).
2. Phase 1 letter grades + `check-grades.js` roster sheet. Ship, live with
   it a week — the grade sheet alone may resolve most "is 75 ATK good?"
   pain and will show which units to tune.
3. Phase 2 rescale (mechanical, behavior-identical, `npm test` +
   `test:parity` guard it).
4. Phase 3 consolidation with the MOV-preserving migration.
5. Only THEN rebalance individual units, using the grade sheet as the map.

## 6. Explicit non-goals (guardrails against overcorrecting)

- No changes to spell damage, MP costs, or the race price/XP economy.
- No re-statting units to "fix" their grades — the grades REVEAL the
  statlines, they don't judge them. (22 F-ATK casters is correct output.)
- HP / MP / RNG never join the 0–100 ruler; RNG and CRT/EVA never get letters.
- Move ceiling is 5 (band-aligned), applied AFTER all modifiers. The
  MIGRATION never promotes anyone past their current tile count — units
  entering bands A/S at baseline is a deliberate tuning decision (now
  sanctioned — flagship speedsters SHOULD exist), guarded by the halved
  second move, never a migration side effect.
- No stage-count clamp — stages stack freely until the stat saturates at
  100 / its floor (0, or 1 for SPD). Clamp at apply time so maxed means
  maxed (no hidden overstack buffer).
- Phases 2–3 land as pure refactors first; tuning (SPD spread within bands,
  outlier nudges) is a separate, later commit so diffs stay reviewable.

## 7. Known risks of the open clamp + S-speed decisions (rev 3)

Two of these graduated to required work in rev 3a (marked); the rest are
accepted trade-offs to monitor once live, not reasons to reverse course:

- ~~The all-at-once expiry cliff~~ — **promoted from risk to required fix
  (rev 3a)**: the shared-timer model (re-buff refreshes the unit's whole
  stage stack,
  either carrier keeps both signs alive) is replaced by the
  per-application ledger in Phase 2 rule 3 above. Not optional, not
  "decide after play".
- **SPD debuffs triple-dip.** Post-consolidation one SPD debuff cuts
  movement (tiles), evasion (EVA derives from move), turn order, AND
  opp-attack odds. Uncapped stacking makes "speed down" plausibly the best
  debuff in the game. Counterweight already in the design: move floors at
  1, EVA floors at its 6% base, spd floors at 1 (never 0 — RT cooldown and
  opp-attack math divide/scale by it). Watch it; retune the 4 spd-stage
  spells' durations/costs first if it dominates.
- **Multi-stage spells got a hidden buff twice over.** Step 14→20 (atk;
  more for def/mdef) AND no ±cap means warCry/randomTeamBuff-style effects
  that grant 2+ stages, team-wide, are much stronger than authored. Sweep
  every `statStageBoost` payload with stages ≥ 2 during Phase 2 and
  re-cost deliberately.
- **AI audit is REQUIRED work, not drift to tolerate (rev 3a).** The
  rework does not ship a phase until ai.js is updated for it in the same
  delivery: (a) stage valuation at step 20 with bound awareness — never
  spend a cast buffing a stat already at 100 or debuffing one at the
  floor (the apply-time clamp makes those casts literal no-ops, and an AI
  that wastes turns on them looks broken); (b) reach/retreat/threat
  projections must use the halved second move, both for its own units and
  when projecting enemy threat ranges; (c) debuff-stacking is now a real
  line of play — the AI should at least recognize follow-up debuffs on an
  already-debuffed target as higher value, not lower.
- **Bound-clamp UX.** A +1 stage on a base-90 stat applies as +10
  "(maxed)" — the "B → A one letter per stage" promise bends at the
  ruler's ends. The buff UI should show the clamped result honestly
  ("ATK S (maxed)"), and the log line already has the `(max)` suffix hook.
- **Online parity is already safe** for stages (host computes, guest
  mirrors state) but the halved second move must live in shared range
  code keyed off synced fields (`movesThisTurn`), never in guest-local UI
  guesses — verify `movesThisTurn` isn't on `_serializeState`'s skip list.

## 8. HP / MP letter grades (the "not on the 100 scale" answer)

HP and MP never join the 0–100 ruler — they stay raw pools (600 HP reads
better than "HP 54") and get letters from **bespoke absolute bands** in the
same `STAT_GRADE_BANDS` table, chosen off the measured roster distribution
in §2 so the letters mean the same thing as everywhere else ("B ≈ roster
average, S ≈ top decile"):

|    | S    | A    | B    | C    | F     | anchoring |
|----|------|------|------|------|-------|-----------|
| HP | ≥700 | ≥620 | ≥540 | ≥460 | <460  | B straddles the mean (563); S ≈ p90 (708) |
| MP | ≥235 | ≥190 | ≥140 | ≥80  | <80   | B straddles the median (145); S ≈ p90 (240); F = martial dump |

Same `statGrade()` helper, different threshold array — the letter language
stays one language. These bands are hand-anchored, so a future HP/MP-wide
rebalance means re-anchoring them by rerunning the §2 distribution script;
`check-grades.js` should print a warning if >35% of the roster lands in a
single HP/MP band. HP/MP are not staged stats, so the clamp questions
don't arise for them.
