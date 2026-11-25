---
name: ai-training-20261122
description: How to run battle-AI training in the cloud and what the 11-22 passes found (pass 2 baked, PR #2470)
metadata:
  type: project
  modified: 2026-11-23T12:13:33.718Z
---
11-22/23 AI training (mondo asked for "a few passes and make sure its getting better"; he wanted it run on Opus). Three SPSA passes of 115 min each from the 11-01 baked weights. Head-to-heads against the shipped AI: pass 1 53.0%, pass 2 53.4%, pass 3 51.1%. Pass 2 was proven at 809-692 over 1,501 matches (53.9%) and BAKED in PR #2470. ai.js + battle.js uploaded to R2.

**Why:** more passes are not always better. Bake the pass that wins the long head-to-head, never just the last one.

**How to apply:** `EW_ALLOW_STALE=1 PW_CHROMIUM=/opt/pw-browsers/chromium node train_headless.js --lab train --workers 3 --recycle 10 --minutes 113 [--resume <prev out>]`, then `--lab strength --weights <out>/merged-weights.json`. Run each one as a harness-tracked run_in_background Bash call. 4 workers run out of memory; 3 workers manage about 6 matches/min. Stop a run with kill -9. Bake with /mnt/project-files/ai-training/run-20261101b/bake.py (it needs a flat θ json). Notes are in champions-combat.md under "THE 11-22 TRAINING PASSES". See [[long-runs-where]].
