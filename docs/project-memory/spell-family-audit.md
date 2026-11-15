---
name: spell-family-audit
description: SPELL_FAMILY_AUDIT_PLAN.md — ALL BATCHES DONE: A+A2 (PR #29), B (#30), C (#31) 2026-09-30, D engine (#35) 2026-10-01
metadata:
  type: project
  modified: 2026-09-30T19:12:59.776Z
---
SPELL_FAMILY_AUDIT_PLAN.md (repo root, sections in docs/spell-audit/) is the plan of record for spell families/tiers.
mondo asked 2026-09-30 to implement it; all §10 decisions (Q1-Q12) were taken at the plan's recommendations.

Batch A + A2 DONE + MERGED 2026-09-30 (PR #29, main b2d2f5a, token 20260930-spellaudit-01-cors, zip
spell-audit/ENTROPY_WARS_SPELL_AUDIT_A.zip = data.js, battle.js). 294 rows patched, 8 deleted, 21 Q1 T4 folds,
MP follows explicit tier (data.js getTierMpCost), EW_MP_L1_FRAC 0.35 (Q2), small battle.js reads.

Batch B DONE + MERGED 2026-09-30 (PR #30, main 5a6bccc, token 20260930-spellaudit-02-cors, zip
spell-audit/ENTROPY_WARS_SPELL_AUDIT_B.zip = data.js, battle.js, ai.js). Log + gaps: docs/spell-audit/BATCH_B_LOG.md.
Batch C DONE + MERGED 2026-09-30 (PR #31, main 3a65926, token 20260930-spellaudit-03-cors, zip
spell-audit/ENTROPY_WARS_SPELL_AUDIT_C.zip = data.js, battle.js, ai.js): 87 new rows, 26 FAMILY_PASSIVES, 4 upgrades.
Log + the 17 rows/clauses for Batch D: docs/spell-audit/BATCH_C_LOG.md. Per-row Upgrades lines left for mondo.
Gotcha 2: bake appending rows after a trailing comment in SPELL_LIBRARY wrote lone `,` lines (array holes, load crash).
Gotcha: bake-spell-mods deleting a `_mkCharge({...})` row leaves a stray `_mkCharge(),` (an id-less row) — remove by hand.

Batch A log + the full Batch B (41 items: MOVEs, rung deletes/merges) and Batch D (engine) carry-over list:
docs/spell-audit/BATCH_A_LOG.md. Patch list for reuse: docs/spell-audit/batches/batchA.js (put/d helpers → export
for bake-spell-mods.js). Verify rows with load-data.js SPELL_BY_ID.

Batch D DONE + MERGED 2026-10-01 (PR #35, token 20261001-spellaudit-04-cors; main has since moved to the mobile token
20261001-mobile-01-cors, PR #36), zip spell-audit/ENTROPY_WARS_SPELL_AUDIT_D.zip = battle.js, data.js, ai.js, online.js,
state.js, ui.js, sprites.js, three-renderer.js (taken from main after #36; state/ui/three-renderer identical to the mobile
zip's). Log docs/spell-audit/BATCH_D_LOG.md (+ per-part logs docs/spell-audit/batchD/), re-dump in
docs/spell-audit/data-after/, SPELL_CATALOGUE.md regenerated. The plan is fully built; left: mondo's taste pass +
playtest, small gaps in BATCH_D_LOG.md, demon princess pool 32 (above 28).
Method that worked: 4 parallel worktree agents (rows-1, rows-2, passives, upgrades) + hand merge + one review agent.

**Why:** later threads continue B → C → D in the plan's §9 order.
**How to apply:** Batch B must be one export (bake refuses rungs outside a race's families); dump.js/synergy.js
are in git at commit fdefd66. Commit/push may hit the auto-mode classifier: ask mondo to say "push it". Requesting
mondo as reviewer fails (he is the PR author via the app) — skip it. See [[spell-library-plan]].
