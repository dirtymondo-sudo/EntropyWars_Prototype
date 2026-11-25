---
name: associate-balance-loop-review-20261122
description: 11-22 review of the associate's 11-21 balance lab loop (5 passes, 118 races, bal-*.js tools): verdict, rule flags, runner speed test, questions waiting on mondo
metadata:
  type: project
  modified: 2026-11-22T04:18:39.869Z
---
Thread (owner-project id). The associate's commits are 00eae71..f081518 (PR #2369). Notes are in docs/notes/balance-loop-20261121.md and the state is in its -state.json.

Verdict: the spell family changes are real signal and are good (Spygear, Psychic, Dirty Fighting, Fractal, Sacrifice). The race stat changes are mostly noise: the baseline was already within luck (5.63 vs 5.85) and the final lab is about the same (5.05 vs 5.21), with about 57 games per race (±6.6).

Rule flags:
- EMP Grenade's Jammed went 3→2, against mondo's 11-03 note "Jammed lasts 3 rounds".
- Telepathic Link's aura went 3→4 (not a stat change).
- Boltzmann Brain lost 4 spells from its pool through RACE_SPELL_EXCLUDES.

Speed test on 11-22 main, 10 minutes, 3 workers: train_headless.js played 57 matches and lab4.js (recycle 12) about 65. Neither runs whole-scene scans. The game is about 2x slower per match than on 11-08.

mondo's answers (11-22): (1) keep only the spell family fixes, (2) Jammed can stay at 2 but the descriptions must match, (3) restore Boltzmann Brain's spells, since the random jump is the cause of its low win rate, (4) add the recycling.
Shipped in PR #2371 (token 20261122-balrevert-01-cors, data.js 7b80f3b5 live): all 119 race rows are back to their pre-11-21 lines, 4 descriptions were fixed, the Boltzmann exclude row was restored, and train_headless.js got `--recycle N` (default 12).
11-22 own loop (mondo "run a balance pass a couple times"): PR #2419, data.js 63a8b747 live, state docs/notes/balance-loop-20261122-state.json. Pass 1 = 16 races, pass 2 = 29 races, pass 3 = 29 races (PR #2446), pass 4 = 28 races (PR #2459, data.js 21dfac83; untested); spread flat 3.4->3.6, near floor at ~1,400-match labs. Boltzmann Brain swings 21->46->27% between labs (its random jump). Labs need EW_ALLOW_STALE=1 (main moves mid-run).
11-23 loop (new AI + 7 new units, state docs/notes/balance-loop-20261123-state.json): baseline 1,400 matches spread 2.6; pass 1 = 24 races PR #2495; pass 2 = 27 races PR #2507 (data.js f0a16493, untested). Spread went 2.6->2.9 after pass 1: two 2-h labs a pass is at the floor; further passes need ~4 labs.
Still open: Boltzmann Brain's random jump (fluctuation) could be reworked, but that needs mondo's design.

Related [[balance-loop-20261108]] [[associate-review-20261116]].
