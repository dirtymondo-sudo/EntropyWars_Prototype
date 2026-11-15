---
name: spell-audit-fix-20261026
description: mondo said "fix all" to the 10-26 spell audit; lead thread PR #557 fixed the shared engine causes, brief for parallel fix batches F1-F6
metadata:
  type: project
  modified: 2026-10-26T14:48:31.270Z
---
10-26 ~14:30 UTC mondo answered the spell audit ([[spell-audit-findings-20261026]]) with "fix all". Lead thread
(branch claude/project-thread-8u2b4m, PR #557) fixed the shared causes: statStageBoost rides applyDamageToUnit opts on every
damage resolver; single hits read groundsFlyers/terrainDeform; delayed marks store dmg+spellPower and groundsFlyers;
lines pass ignoreArmor; line/area pushes run after all hits, farthest first; aoe passes its push; area hits add unholyBonus;
barrage reads terrainDeform; lifeDrain heals from HP taken (preScaled) with the row damageType; buff kind reads selfHealPct;
aoeShield gives every ally the full shield (was split); _activeZones/burningTiles reset per match; pin log names the status;
Infernal Waltz charms; rows: Chest Pound noDamage, Entropic Beam def -1, High Noon critChance 1, Termination/Ammit
executeAfterHit, Let It Out low-HP +2/+2.

Calls flagged to mondo (game-rule picks): area shields per ally (3-4x more total shield), stat drops landing on T3/T4
finishers (Migraine, Death Gaze, Supernova, Bone Barrage), delayed strikes +spell power, drains heal more, Unholy cross bonus
also vs Anomaly.

Remaining work: /mnt/project-files/spell-audit/fix/BRIEF.md batches F1 text/power words (data.js desc), F2 CONFIRM
preview, F3 log lines, F4 movement/board/summons, F5 riders/costs/CPU aims, F6 passives. Each item has its PICK.
Open questions for mondo: Sheltering Wings, 2-AP damaging spells, delayed "everything" sparing allies.
Harness gotcha: harness/setup.sh checks out origin/main detached; the brief gives the branch-safe setup.

F1 DONE (PR #558, 10-26 16:03): data.js text/power words/rows; zip ENTROPY_WARS_SYNC_20261026-1603. Call: Heat Death /
Hall of Mirrors ticks kept WEAK (row zoneTickDamage 70/80; describeSpell words ticks off the row), brief's MEDIUM not applied.
F6 DONE (PR #559, 10-26 16:04): passives per [[passives-f6-20261026]]; zip ENTROPY_WARS_SYNC_20261026-1604 (supersedes 1603).
F3 DONE (PR #560, 10-26 16:06): log lines per [[spell-audit-f3-loglines-20261026]]; zip ENTROPY_WARS_SYNC_20261026-1606 (supersedes 1604).
F5 DONE (PR #562, 10-26 16:20): riders/costs/CPU aims per [[spell-audit-fix-f5-20261026]]; zip ENTROPY_WARS_SYNC_20261026-1620 (supersedes 1614).
F2 DONE (PR #563, 10-26 16:35): CONFIRM preview per [[spell-audit-f2-preview-20261026]]; zip ENTROPY_WARS_SYNC_20261026-1635 (supersedes 1620). Call: self-laid terrain fixed by the NO SELF-COMBO runoff watch, not by adding the bonus.
