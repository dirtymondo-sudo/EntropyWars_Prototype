---
name: imitation-report-20261008
description: PR #171 acted on mondo's human-vs-CPU imitation report; his 14 imitation weights are shipped defaults
metadata:
  type: project
  modified: 2026-10-08T01:41:16.351Z
---

2026-10-08, PR #171 merged. mondo's imitation report (5 matches, 248 decisions, 26% CPU agreement) showed that the CPU chased the Cube late, over-rated potions next to Free Energy, and that the trainer measured human moves unfairly and skipped Cube hits, items, Inspect and Channel. Fixes: Arena Cube window bonuses scaled by wipeout distance plus new trainable cubeWindowBonus_v1; team MP spells credit unlocked casts; new trainable potionValue_v1; fairer imitation scoring with more verbs observed. His 14 trained values are now the defaults (prev = gen-40). Analysis: /mnt/project-files/ai-training/AI_IMITATION_ANALYSIS_20261008.md. Sync zip r2-sync/ENTROPY_WARS_SYNC_20261008-0141.zip.

**Why:** standing rule: when he shares training output, deliver an analysis and apply the weights [[ai-training]].
**How to apply:** future imitation reports name items and the Cube, so compare them against this baseline.
