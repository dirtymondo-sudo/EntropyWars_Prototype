---
name: ai-long-training-20261029
description: 10-29 long cloud AI training run (mondo asked to train long + bake in); runner, findings (one-map labs, seat bias), where outputs live
metadata:
  type: project
  modified: 2026-10-29T11:01:49.478Z
---

10-29 mondo: "run the ai training for a long time/lot of matches and then bake it into the game". Thread "Run long AI training and bake it in".

Runner (scratchpad copy of repo train_headless.js, NOT committed): uses /tmp/ph/route.js from the playtest harness (asset_cache CDN fetch fails in sandbox: THREE not defined), PW_CHROMIUM=/opt/pw-browsers/chromium, rotates the arena every 4 matches (wraps _mirrorRandomizeTeams to call _simApplyModeAndMap), per-match logs (wraps recordTrainingMatch/recordStrengthMatch), shard sync every 60 min, skips _AB_RETIRED_KEYS + searchCenterPrior + hardReplyFactor (EW_TRAIN_KEYS would otherwise un-retire them). 3 workers on 4 cores ≈ 11 matches/min. Outputs: /mnt/project-files/ai-training/run-20261029/.

Findings: in-game Training/Strength labs play every match on ONE arena (rotate only applies at launch; only Balance Lab rotates per match). Strong P2 seat bias on some arenas (21/27 P2 wins on one); ~93% of Arena matches end on the round-20 Arena score. Identical-weights strength tests swing 35-63% at n≈50, so before/after needs hundreds of matches.

Baking: AI_WEIGHT_DEFAULTS in battle.js (value + prev) AND ai.js AI_TUNE for _v4 keys must match. mondo's own browser keeps his saved weights (IndexedDB ai-weights-v14 holds the full table after any adoption), so a default change does not reach his browser; never reset it.

RESULT (10-29 18:45): 4,822 matches, 82 experiments, 5 adoptions (Arena Score Play 1→2.125, Search Value 180→285, Tower Finish Push 50→35, Anchor Caution 1→0.5, Move-Then-Act 0.97→0.985). Head to head trained vs current: 382-381 over 763 = NOT stronger; ~4 adoptions expected by SPRT luck. NOT baked; asked mondo (keep / bake anyway / fix lab + retrain). Report: ai-training/run-20261029/AI_TRAINING_ANALYSIS_20261029.md. Seat bias per arena (mirror teams): DUMB 10x10 P1 87%, Agartha P2 75%, Haunted P1 70%, North Pole P2 72%; overall 50/50. Runner copy in ai-training/run-20261029/runner/. Memory: 3 pages ~3 GB each, recycle every 9 min; container restarts when the turn ends, so stay in-turn while it runs.

[[ai-three-clocks-design]] [[sandbox-playtest-speed]]
