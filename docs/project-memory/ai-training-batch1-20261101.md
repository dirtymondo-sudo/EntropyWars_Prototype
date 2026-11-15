---
name: ai-training-batch1-20261101
description: 11-01 AI training batch 1 (ideas #1 trainable fix numbers, #4 settling SPSA steps + tail average, #5 checkpoints gated vs shipped AI): PR #737, harness, run plan
metadata:
  type: project
---
11-01 mondo asked how to make AI training give real gains; coordinator split ideas into batches (mondo: "a new thread for each or every few"). Thread "Make AI training find real gains" = ideas #1, #4, #5; #2 varied opponents + #3 TDM/Clash go to a later thread.

SHIPPED PR #737 (zip r2-sync/ENTROPY_WARS_SYNC_20261101-0847.zip, ai.js v4.29, token 20261101-trainable-01-cors): 16 new AI_WEIGHT_DEFAULTS keys = the 11-01 fixes' fixed numbers (default = old number, noMult); SPSA step a0 1.2% decaying (A=150, ^0.602), c ^0.101, answer = second-half average; every 150 pairs a checkpoint plays 30 gate pairs vs shipped defaults, CPU plays it only if 90% floor > 50% and best. BEHAVIOUR CHANGE told to mondo: CPU no longer plays the running training walk. New EW_AI_VERSION restarts the schedule.

Harness: /tmp/run/train.js (scratch; copy to /mnt/project-files/ai-training/run-20261101b/) = duel.js-style parallel SPSA, passes global k at sync, harness-driven gates via window._ewSpsaGate. Speed 11-01: ~9-10 matches/min PER worker (2 workers ~18/min). Run from a repo snapshot (EW_REPO=/tmp/ewsnap) so merges don't leak into a running lab. Container survived turn ends with background jobs.

[[ai-training-20261101]] [[ai-training-rework-20261029]]

RESULT + BAKE (PR #766, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1751.zip, ai.js v4.33 '+trained', token 20261101-trained-02-cors): 3,608 training + 704 gate matches (1,340 on v4.31, resumed same theta/k on v4.32 after positioning PR #751). Gates swung 45-63% (32 pairs each, useless alone). Final second-half average vs shipped on main: 875-766 / 1,641 = 53.3% +-2.4 (graded 53.0 +-2.2) -> baked 64 keys. Biggest: teleportAnyValue 1->0.40, engageAdvantage -0.42->-0.76, keyCarrierDenial 862->1175, wipeoutKillBonus 2537->3403. Files: /mnt/project-files/ai-training/run-20261101b/ (train.js, duel.js, bake.py, h2h/, ckpts). Gotchas: `kill $pid` of a busy node left it alive -> two runs on one out dir; kill -9 and check ps. Strength-lab duel ~11-20 matches/min with 4 workers. Force-push is blocked by auto mode: restart branch from origin/main is a fast-forward anyway.
