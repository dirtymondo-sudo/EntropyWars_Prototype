# Balance Lab Analysis — ewbalancestats15 (415 arena matches, exported 2026-08-15)

First dataset after the 2026-08-15 structural pass (type rebalance, ring damage bands,
status economy). Analysis only — no changes made. Read §1 first: a large share of what
looks like "imbalance" in this dataset is actually **the AI and the tracker**, not the
numbers, and several tuning conclusions are unsafe until those are fixed.

---

## 0. Dataset health

| Metric | Value | Read |
|---|---|---|
| Matches | 415 (0 no-contests) | Good sample |
| Side bias | P1 won 52.5% (210/400 logged) | Acceptable |
| Avg rounds | 15.4 · 86.5% of matches reach round 15+ | Most matches are decided by **composite score**, so kill-farming still rules the meta |
| First-kill win rate | 62.9% | Snowbally but not degenerate (was 65.7% in stats12) |
| Comeback rate | 24.3% | Down from 30.5% in stats12 — worth watching |
| Job WR spread | 37.8% (Freelancer) → 58.4% (Sniper), ~21 pts | Too wide (target was 47–53) |
| Race WR spread | 26.1% (swordfighter) → 76.5% (scarecrow), ~50 pts | Way too wide (target 44–56) |

The headline: **intra-job race spreads dwarf the job spread.** Chassis stats explain
almost nothing (correlation of race stat-budget vs WR = **−0.14**, i.e. zero). What
predicts winning is whether a race's kit is *spammable ranged damage the AI knows how
to use*.

| Job | Intra-job race spread |
|---|---|
| Swordmaster | **46 pts** — skeleton 73% → swordfighter 26% |
| Harvester | **41 pts** — scarecrow 76% → shaman 35% |
| Psychic | 34 pts — succubus 65% → grey 31% |
| Warrior | 33 pts — nephilim 61% → knight 29% |
| Raider | 31 pts — zombie 69% → minotaur 38% |
| Gunslinger | 31 pts — mech 67% → cowboy 35% |

---

## 1. THE LAB IS MEASURING THE AI AS MUCH AS THE BALANCE

These four findings mean the next balance pass should be an **AI + telemetry pass**,
or the numbers it tunes against will be noise.

### 1a. Different jobs are played by different AIs (job WRs are confounded)
`index.html` loads `ai.js` then `ainew.js`. The ainew overlay (`window.aiTakeTurn`
override, ainew.js:815) is a strictly stronger combat brain — it models DEF/MDEF/
shields, press turns, kill-checks vs hp+shield, and does a 1-ply move×shot search.
But `PURE_SUPPORT = {'White Mage','Psychic','Harbinger'}` (ainew.js:100) makes those
three jobs **delegate unconditionally to the old ai.js brain** (which scores damage
with a flat `atk*0.65` and ignores DEF/shields entirely, ai.js:1327). More blanket
delegations: carriers, "ally dying + I have a heal", low-HP units.

So Sniper (58.4%) is played by the good AI and Psychic/Harbinger (47%) by the weak
one. **Cross-job WR comparison is invalid this run.** Do not tune Psychic/Harbinger/
White Mage chassis or kits off this dataset.

### 1b. Half of every loadout is dead weight — the AI cannot cast large classes of spells
Casts-per-loadout-appearance across 400 logged matches:

- **Literally zero casts in 415 matches**: Encore (216 loadouts), Teleport (194!),
  Cleanse (353), Ground Slam (180), Chivalry, Overclock, Rally Command, Inner Demon,
  Contract, Summon Sandstorm, Love Bite, Howl…
- **Near-zero**: Discordance 8 casts / 649 loadouts, Place Bomb 6/415, Poison Seed
  2/369, Healing Seed 13/500, Camouflage 17/394, Cross Slash 52/465 (0.11),
  Haymaker 0.19, Blade Waltz 0.10, Psychosis 0.18, Fortify 0.19, Provoke 0.18.
- Average loadout carries **~2.5–3 dead slots out of 6** (corr with race WR −0.23).

Why (ai.js audit): `scoreSpell` falls through to `return 5` for unhandled kinds; the
null-move gate (ai.js:405–417) **zeroes** anything scoring under `max(bestMove*0.8,15)`
unless it's a damage spell; utility is hard-capped at `bestDamageScore*0.6–0.8`
(ai.js:368–395); debuffs are vetoed entirely on `marked` targets (ai.js:1860); the
overlay only considers hard-CC debuffs and discards `ccValue < 600` (ainew.js:475).
Melee spells barely get cast because the AI rarely reaches adjacency with AP to spare.

**Consequence for balance:** every race whose tree is utility/buff/melee-heavy
(swordfighter, knight, king arthur, shaman, werewolf, minotaur, mantid, dinosaur)
fights with ~2 live spells or basic attacks only — their low WRs are mostly *AI
unusability*, not weak numbers. Every race whose tree is cheap ranged damage
(skeleton, zombie, scarecrow, mech, gargoyle, succubus) gets its full kit.

### 1c. The whole 2026-08-15 status economy is dead on arrival
Neither AI knows `bonusVsStatus` exists (0 hits in ai.js/ainew.js). Setup spells are
exactly the utility class the scorer floors out. Result: **discord was applied 159
times in ~5,000 unit-games** (Discordance itself: 8 casts), frozen 90, hexed 29,
charm 19. Every ×1.5 payoff added in the 08-15 pass (Requiem vs discord, Marrowstorm
vs poison, Sleigh Dash vs frozen…) is untested design. The only combos that "work"
are accidental — root (3,382 applications, from Kneecap/Web Snare spam) feeding
Precision Shot/Haymaker.

### 1d. Telemetry blind spots (tracker bugs)
- **Delayed damage is never credited.** `_balSpellCollector` flushes at `finishAction`;
  `delayedMark` and `kind:'delayed'` spells resolve at end-of-round. So **Take Aim:
  108 casts, "100% whiff", 0 damage recorded** — structurally guaranteed, says nothing
  about the spell. Same for To Be Continued (31 casts "all whiff"), Nuke, Fire for
  Effect, Crystal Ball, Prophecy of Disaster. Sniper's and marksman's capstone value
  is invisible; they top the charts *anyway*.
- **Turret damage is unattributed** — Deploy Turret (1,575 casts) and Engineer-
  secondary's 56.8% WR are driven by damage the spell table shows as zero.
- **Per-spell "WR" is loadout-correlation**, not effect (Camouflage "54% WR" on 17
  casts). Fine as-is, just don't tune off it.
- Real AI bug underneath Take Aim: both AIs score it as an *instant* 180 nuke and
  fire it as a kill-securer (ainew.js:370 `+50000` believed-kill bonus); the target
  then gets a full round to walk out of vision. It's systematically the wrong tool
  and the AI can't see that.

### 1e. Other AI scoring bugs worth fixing before the next run
- **MP cost is not in ai.js spell scoring at all** (score = raw dmg × modifiers), and
  the "MP dump" rule *multiplies* scores when MP > 60% — cost is not a balance lever
  in the lab. (The overlay does subtract cost; one more brain asymmetry.)
- **Heals outbid kills ~5:1**: `heal 192 × urgency 3.0 × WM 2.0 + 30 ≈ 1182` vs
  ~217 for a confirmed kill (ai.js:1769–1780 vs 1611). Plus `_healDuty` halves all
  damage scores when any ally < 60%. Hence 2,132 Heal casts. Heals also aren't
  level-scaled while damage is ×1.75 — so healing under-converts *in the engine* too.
- **Requiem 36% whiff is a range-model desync**: ai.js barrage check uses `combatDist`
  without Z + fog-gated enemy list; engine uses `combatReach` with real Z + all units.
  AI happily spends 100 MP on "casts Requiem but no enemies are in range". Single-
  target spell targeting (ai.js:4188) uses flat Manhattan — desyncs on elevation.
- ai.js still assumes **type multiplier 1.5**; engine uses **1.30** (state.js:2991).
- Building is softlock-escape only (score 40 when stuck vs 300–1000 for damage);
  flyers never build. 4.45 ops/match ≈ stuck-counter, not terraforming strategy.

---

## 2. STRUCTURAL BALANCE PROBLEMS (real, engine-level)

### 2a. The flat MP ladder made ring-1 spam mathematically optimal
Observed efficiency by tree ring (all casts):

| Ring | MP | Casts | dmg/MP | kills/100MP |
|---|---|---|---|---|
| 1 | 25 | 16,167 | **8.96** | 0.53 |
| 2 | 50 | 7,272 | 3.55 | 0.21 |
| 3 | 75 | 2,189 | 3.34 | 0.21 |
| 4★ | 100 | 1,206 | 4.84 | 0.26 |

Why: final damage ≈ `(base + 0.35×stat_at_cap) × ~1.75 × mults`. The `0.35×stat`
term (+~55 for a 158-ATK unit) and the ×1.75 pace multiplier are **flat per cast** —
they boost a 100-base poke proportionally far more than a 180-base capstone. At the
ladder prices, ring 1 delivers ~(100+55)/25 ≈ 6.2 dmg/MP; a capstone ~(180+55)/100 ≈
2.4. The 08-15 ring-band ascension (r4 150–190) cannot close a 2.5× efficiency gap.
The ladder also silently **reverted every targeted MP nerf** — Kneecap Shot's 32 MP
(07-13 pass) is back to 25, and it's again the most-cast spell in the game (2,895).

### 2b. AoE damage overpays per target
- **No falloff** — every target rolls full base+spellPower (battle.js:4536).
- **Never hits allies** — AoEs only look up enemies; self-centered novas are risk-free.
- **Self-novas collect the close-range bonus**: range profile gives ×1.2 at dist 1,
  ×1.1 at dist 2 — a radius-2 self-AoE lands most victims inside that band by
  construction (battle.js:133/171).
- STAB ×1.25 is silent and always-on; chaos faction synergy +16 flat; the ×3.0
  offensive cap almost never binds on AoE (typical product ≈ 1.5–1.95).

Result: the top of the efficiency league is all cheap AoE on big-stat chassis —
Cataclysm Stomp **43.7 dmg/MP** (1,093/cast — arithmetic checks out exactly:
155 base+power → ×1.25 STAB ×1.1–1.2 range +16 chaos → ×1.75 pace − ~35 armor ≈
415–430/target × 2.55 targets), Glitterburst 31.3, Corrosive Splash 24.3, Fallen
Grace 23.5, Mortar Salvo 18.4 @ 300 casts, Aurora Ray 18.7. Meanwhile 100-MP
capstones average 4–6 dmg/MP.

### 2c. The kiting meta is comp-level real and scoring-fueled
Team WR by number of ranged-primary units (Sniper/Gunslinger/Agent/Psychic):

| # ranged of 6 | Teams | WR |
|---|---|---|
| 0 | 176 | **43.8%** |
| 1 | 264 | 51.9% |
| 3 | 101 | **59.4%** |
| 4 | 21 | 66.7% |

Sniper: 58.4% WR (CI 52.8–63.8, significant), best survival (.914), best kpg (2.0) —
with its capstone contributing zero recorded damage and Camouflage almost never cast.
Its power is the chassis: range-3 basic attack, Kneecap root at range 5 for 25 MP,
inverted range curve (×1.2 at distance, ×0.6 adjacent — correct identity, but nothing
punishes it). Root — the kiting enabler — was applied **3,382 times**, double any
other status. Survival correlates with WR at 0.55, kpg at 0.53; and 86.5% of matches
are decided on points where **kills are 15 pts uncapped** while tower damage caps at
150. Safe kill-farming remains the only strategy the scoreboard rewards. The AI
additionally pays ranged units to stand off (+8/tile) and penalizes their danger
tiles ~2× harder than melee's, while melee approach is greedy one-step with no
pathing — melee bleeds tempo every round.

### 2d. Typing: the chart's winners own the biggest target populations
Defender exposure (unit-games): human 29.2%, anomaly 21.4%, unholy 18.9%, divine
10.4%, alien 10.1%, tech 10.0%. So:

- **tech** (strong vs human) hits a weakness on **29%** of the field → tech races 57.0% WR
- **unholy** (strong vs anomaly) covers **21%** → unholy races 54.6% WR
- **human** (strong vs alien) and **alien** (strong vs divine) cover ~10% → 47.9% / 46.3% WR

A weakness hit isn't just ×1.30×1.25-STAB damage — it's a **+2 AP press refund**, a
whole extra action. Type coverage compounds into tempo. The 08-15 spell-supply
rebalance fixed STAB *supply*; the *demand* side (who you get to be strong against)
is what's skewed. Top-10 races: 6 unholy-typed, 3 tech-typed. Bottom-10: mostly
human/alien-typed.

---

## 3. WHO'S ACTUALLY BROKEN vs WHO'S AN ARTIFACT

**Trustworthy signals (kit/stat problems, worth touching):**

| Race | WR | Resid | Diagnosis |
|---|---|---|---|
| scarecrow | 76.5% | +26.8 | Harvest Hook: r1 25-MP ranged **pull** that deals 356/cast (14.2 dmg/MP, 1.6 targets, 4.1 casts/loadout) on an 84-ATK/660-HP hybrid; Crow Storm capstone on top. Best unit in the game three ways at once |
| skeleton | 72.5% | +29.2 | "Melee job, ranged kit": ATK 96 + SPD 10 chassis casting Bone Toss (r1, range 3, 15.3 dmg/MP) and Marrowstorm (range-4 radius-2 physical 160). Never needs to melee |
| zombie | 69.4% | +17.2 | Lowest stat budget in the game but the kit is 3 cheap direct hits + AoE capstone — 100% AI-usable, all unholy STAB |
| mech | 66.7% | +16.5 | Mortar Salvo: r1 25-MP range-5 radius-1 AoE, 300 casts, 18.4 dmg/MP — the poster child of §2a+2b. Tech STAB into 29% of the field |
| cyborg | 66.7% | +14.5 | EMP Grenade (r2 AoE) + 89 ATK Raider chassis + tech typing |
| succubus | 64.7% | +17.7 | INT 87 + lifedrain sustain kit (Soul Suck 17.1 dmg/MP, Draining Embrace) — self-sufficient carry on the weak-AI job, still 65% |
| djinn | 63.6% | +11.8 | Dust Devil: r1 AoE-pull 14.3 dmg/MP on INT 83 |
| kaiju | 59.0% | +6.8 | Cataclysm Stomp 43.7 dmg/MP (§2b) — low cast count only because the AI rarely uses self-novas; when it does, it's a triple-kill |
| swordfighter | 26.1% | −17.2 | Kit is 2 self-buffs (0 casts) + a delayed-mark shot (untracked/fizzles) + melee AoE capstone. ~4 dead slots of 6 |
| knight | 28.9% | −16.1 | Chivalry 0 casts, Walls 1, Oath ~0 — 3 of 4 spells AI-dead |
| grey | 31.0% | −16.0 | Half-utility kit on ATK-8 chassis; alien typing; weak-AI job (Psychic) |
| king arthur | 32.4% | −10.9 | 3 utility + 1 melee nuke; same as knight |
| mantid | 34.5% | −12.4 | **Stat-scaling mismatch again** (the 07-09b lesson): Mandible Strike + Ambush Lunge are *physical* on an ATK-30 / INT-94 chassis. multiHit takes no spellPower at all |
| cowboy | 35.2% | −15.0 | Lasso deals 0.88 dmg/MP (85 casts of nothing); rest of kit mediocre; human typing |
| shaman | 35.2% | −14.4 | 3 utility slots + one capstone; Harvester's worst |
| minotaur | 38.2% | −14.0 | Labyrinth Roar is an AI-dead self-barrage; melee-locked |
| werewolf | 41.2% | −11.0 | Entire kit is melee/self-buff: Bite 2 casts, Howl 1, Feral Dive 5, Blood Frenzy 7 in 51 games — fights with basic attacks only |
| dinosaur | 42.6% | −9.6 | All-physical melee kit, INT 9, Primal Roar (self-AoE, 4 casts) |

**Artifacts — do NOT tune off this dataset:**
- **Psychic (47.0), Harbinger (47.6), White Mage (52.7)** — played by the old AI (§1a).
- **Swordmaster (43.3) / Warrior (44.9) job chassis** — their races span 26–73%;
  the job-level signal is mostly "AI can't cast melee spells" + move-cap kiting prey.
  Note BALANCE_NOTES 07-13 predicted exactly this: "if melee jobs sag under the move
  cap, the cap needs a gap-closer compensation, not a stat buff."
- **Freelancer (37.8%)** — real, but structural: a 3-spell tree (2 of them AI-dead),
  no secondary-style stat identity, range-1 kit. homosapien (55.1%) proves a good
  race kit rescues it. Needs its planned wildcard pass, not stat tweaks.
- **Take Aim / To Be Continued "100% whiff"** — tracker artifact (§1d).
- **Sniper-as-secondary worst (43.3%) / Engineer-as-secondary best (56.8%)** —
  secondary WR mixes stat-mod value with splash-spell AI-usability and untracked
  turret damage; read it directionally only (Sniper's −80 HP / −12 MDEF nature is
  probably genuinely bad on random chassis).

---

## 4. RECOMMENDATIONS

### Phase 0 — make the lab trustworthy (do this before ANY number tuning)

**Telemetry (battle.js):**
1. Credit delayed damage: tag `_delayedSpells` entries with the cast's collector id
   and flush into `spellUse` at detonation (or at minimum stop counting `delayedMark`
   casts as whiffs).
2. Attribute turret/deployable damage to the deploying spell (or a `Deploy Turret
   (turret)` row).
3. Log casts-per-loadout in the export (the dead-slot metric found everything in §1b).

**AI (ai.js / ainew.js) — ranked by expected effect on data quality:**
4. Kill the `PURE_SUPPORT` delegation during balance sims (or extend the overlay to
   all jobs). One brain for all jobs, or job WRs stay uninterpretable.
5. Add an MP-efficiency term to ai.js spell scoring; remove/invert the MP-dump
   multiplier. Cost must be a lever the lab can feel.
6. Scale heal urgency by fraction-of-maxHp restored, not raw heal amount; a 192-HP
   top-up on a 900-HP pool should not outbid a kill 5:1.
7. Teach both scorers `bonusVsStatus` (score the ×1.5 when the target already has the
   status; small bonus for *applying* a status an ally's payoff can use). Without
   this the status economy can't be evaluated at all.
8. Fix barrage/spell range models to call the engine's own reach functions
   (`_barrageTargets`, `combatReach` with real Z) — kills the Requiem 36% whiff and
   the elevation desyncs.
9. Give unhandled spell kinds real handlers or scores: self-AoE (Ground Slam,
   Cataclysm Stomp — currently near-uncastable), teleport/escape, encore, cleanse,
   guard, and stop flooring utility below the null-move gate; re-price debuffs
   (drop the `marked` veto, score soft CC > 6).
10. Take Aim / delayedMark awareness: score it as delayed (target can escape), prefer
    it on rooted/stunned targets (its own bonusVs!), never as a kill-securer.
11. Sync the AI's type multiplier (1.5 → 1.30) with the engine.
12. Melee approach: path-aware closing (multi-turn), and value adjacency-denial vs
    ranged units. Optional: teach kited melee to break LOS instead of face-tanking.

Then **re-run the lab**. Expect: Psychic/Harbinger/WM to move (AI unification), melee
races to rise (castable kits), utility-kit races (knight, shaman, arthur) to rise,
Sniper to fall somewhat (heal discipline + melee pathing + no more free Take Aim
casts). What's left after that is real balance signal.

### Phase 1 — structural levers (data.js / battle.js, cheap and high-leverage)

13. **Use tree node order as the MP lever it now is.** The ladder means position =
    price; over-efficient ring-1s should move deeper and dead utility shallower.
    Specific swaps (spell ↔ current ring-mate):
    - Sniper: `kneecapShot` r1 ↔ `camouflage` r2 — Kneecap at 50 MP halves the root
      spam that fuels the entire kiting meta. (Restores the 07-13 nerf the ladder erased.)
    - mech: `raceMortarSalvo` r1 ↔ `raceSiegeMode` r2.
    - scarecrow: `raceHarvestHook` r1 ↔ `raceStuffedDouble` r2.
    - skeleton: `raceBoneToss` r1 ↔ `raceReassemble` r2.
    - djinn: `raceDustDevil` r1 ↔ `sharedSummonSandstorm` r2.
    - Conversely, for AI-dead-opener races, put their live damage spell on r1:
      swordfighter (`raceToBeContinued` → r1, buffs deeper), knight (`raceCrusade`
      stays capstone but swap `raceChivalry` r1 ↔ `raceShieldWall` r2 so *something*
      castable is cheap), minotaur (`raceGoreCharge` r1 ↔ `raceHornToss` r3).
    Add a tree invariant (like the Tier-III rule): **no ranged AoE damage spell on
    ring 1** — checkable in content-schema.test.js.
14. **AoE attenuation** (pick ONE, they stack too hard together):
    - (a) Secondary targets take 70% (primary tile full) — simplest, most legible; or
    - (b) spellPower (the 0.35×stat term) applies only to the primary target; or
    - (c) self-origin AoEs skip the close-range ×1.1–1.2 multiplier (fixes the
      unintended §2b synergy without touching targeted AoEs).
    (b) is the most surgical: it directly de-scales AoE from big-stat chassis (kaiju,
    scarecrow) without nerfing low-stat casters' AoEs.
15. **Capstone economics**: even at 150–190 base, 100 MP can't compete (4.8 vs 9.0
    dmg/MP). Either raise the r4 band to ~200–240, or make the capstone identity
    non-MP (keep 100 MP but add signature riders/AP refunds), or drop capstone cost
    to 75 and make ring 3 = 60. Verify against the ladder legibility goal with the
    owner before touching the 25/50/75/100 ladder itself.
16. **Arena scoring** (the twice-deferred lever — this dataset says it's due):
    kills 15 uncapped is what makes safe kill-farming the only strategy. Options:
    diminishing kills (15 for the first ~5, 8 after), raising towerDmgCap 150→300,
    or nexusRound 6→10. Any of these gives tank/support comps a scoreboard lane;
    the 0-ranged-comp 43.8% WR won't fix itself through unit numbers.
17. **Press refunds from spells**: consider +2 → +1 AP for spell-sourced weakness
    presses (keep +2 for basic attacks). Tech/unholy AoE currently converts type
    coverage into extra actions at scale (§2d).
18. **Root cap**: root at 3,382 applications is double any other status. Kneecap's
    ring move (13) helps; if not enough, give root diminishing returns per target
    (immune 1 round after a root expires).

### Phase 2 — targeted kit/stat changes (safe to apply now; independent of AI)

Nerfs (top outliers with CI support):
- **scarecrow**: Harvest Hook dmg 80→50 (it's a *pull*, the damage is a bonus), atk 84→76.
- **skeleton**: spd 10→8 (fastest unit in the game shouldn't also be a ranged artillerist), Marrowstorm cooldown 2→3.
- **zombie**: Zombie Rush 130→110.
- **mech**: Mortar Salvo 100→80 (plus the ring swap in 13).
- **cyborg**: atk 89→84.
- **succubus**: Sleep Paralysis 125→110.
- **kaiju**: Cataclysm Stomp aoeRadius 2→1 (radius-2 self-nova + no friendly fire +
  close-range bonus is three stacked wins; radius 1 keeps the fantasy).
- **djinn**: Dust Devil 80→60 (it also pulls — same logic as Harvest Hook).
- Leave marksman/gargoyle until after the Sniper ring swap + AI pass — they ride the job.

Buffs / fixes (negative residuals that are genuinely kit-side):
- **mantid**: retype Mandible Strike + Ambush Lunge to magic (psychic mantis, INT 94)
  — the exact fix that worked for grey's Abduction Beam in 07-09b. Number buffs
  cannot fix a scaling mismatch.
- **cowboy**: Lasso gains dmg 40 + root 1 round (a lasso that ropes nobody down is
  why it's 0.88 dmg/MP); Quick Draw 125→140.
- **grey**: give Implant a damage rider (60) or swap `raceProbe` deeper — but wait
  for the AI pass; grey is also a Psychic (weak-AI) victim.
- **giant / golem / juggernaut-class tanks**: no stat buffs — they're scoring-system
  victims (16). Re-check after arena points change.
- **swordfighter / knight / king arthur / shaman / werewolf / minotaur / dinosaur**:
  hold everything except the ring reorders (13) until after the AI utility pass —
  these kits may be fine once the AI can actually cast them.
- **Freelancer**: do the planned wildcard-socket pass; interim only if wanted:
  Improvise range 2→3.

### Phase 3 — validation targets for the re-run
- Jobs within 47–53% **with one AI brain driving all of them**.
- Races within 44–56%; watch scarecrow/skeleton/zombie/mech (expect ≤58) and
  swordfighter/knight/grey/mantid (expect ≥42).
- Ring efficiency ratio r1:r4 from 1.9:1 toward ≤1.3:1.
- Discord/frozen/charm application counts >500 each if the combo teaching (7) works.
- 0-ranged comps ≥47% after scoring changes.
- Dead slots per loadout <1.5 (from ~2.7).

---

## Appendix — key numbers referenced

Job WRs (games, Wilson 95% CI):
Sniper 58.4% (303, 52.8–63.8) · Agent 55.8% (310, 50.2–61.2) · White Mage 52.7% (262)
· Raider 52.2% (479) · Black Mage 51.9% (378) · Gunslinger 50.2% (229) · Harvester
49.6% (268) · Engineer 48.1% (256) · Tank 48.4% (182) · Harbinger 47.6% (408) ·
Psychic 47.0% (332) · Warrior 44.9% (247, 38.9–51.2) · Swordmaster 43.3% (224,
37.0–49.9) · Freelancer 37.8% (98, 28.8–47.6)

Typing WR (games-weighted): tech 57.0 · unholy 54.6 · divine 50.0 · anomaly 48.0 ·
human 47.9 · alien 46.3. Faction: chaos 52.2 · space 52.0 · time 46.3.

Secondary-job WR: Engineer 56.8 · Gunslinger 56.4 · Harvester 55.7 · … · Swordmaster
46.3 · Psychic 44.0 · Sniper 43.3.

Status application volume: root 3382 · slow 2317 · marked 2223 · burn 1055 · stagger
646 · stun 471 · silence 449 · poison 320 · jammed 255 · discord 159 · frozen 90 ·
hexed 29 · charm 19.

Damage formula (verified, battle.js): `dmg = (base + 0.35×stat_at_cap ± 8) ×
[type 1.30/0.75 × STAB 1.25 × range 0.8–1.2 (Sniper 0.6–1.2 inverted) × status-combo
1.5 × elevation 1+0.1Δ, capped ×3.0] × 1.75 pace − armor(≈0.25×def×1.75 + flat soaks)`.
Spells never crit. AoE: full damage per target, no falloff, never hits allies.
Weakness hit or crit = +2 AP press refund (cap +2/turn); resist/dodge = −1 AP.
Arena unit stats = RACE_BASE_STATS + secondary JOB_MODIFIERS + level gains
(+58 atk / +52 def / +43 mdef / +43 int / +360 hp at cap).
