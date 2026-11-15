---
name: status-combos-ai-20261101
description: 11-01 PR #722 CPU sets up status combos (setup before non-lethal finisher, team-aware credit); rules, lab numbers, probe location
metadata:
  type: project
  modified: 2026-11-01T04:46:58.618Z
---
11-01 mondo: CPU should apply a status before casting a bonusVsStatus finisher unless the finisher kills anyway; never block a finisher when no setup exists; plan across teammates (last AP on setup so the next ally cashes in). Thread "Teach CPU to set up status combos". SHIPPED PR #722, zip ENTROPY_WARS_SYNC_20261101-0446 (ai.js e15b582b).

Built (ai.js only): _comboGain (real hit math: bonus dmg + kill conversion + combo press), statusSetupValue credits best collector × chance (own same turn 0.92, mate later this round 0.85/0.65, own next turn 0.5 if status lasts, mate next round 0.35; trained statusSetupFactor stays as floor), _comboFirst (setup ranked above a non-lethal finisher on an unstatused target; turn-ending setup only when finisher can't be recast next turn), finisher aim prefers statused enemy. Kill switch window.EW_AI_NO_STATUS_COMBOS. Notes: champions-combat.md "THE STATUS COMBOS".

Lab (Strength Test, 3 workers, vs main): first cut (turn-ending setup always first) 507 matches 47.7%; final 490 matches 52.7% ±4.4; on top of full-list AI (PR #721) 474 matches 50.8% ±4.5. Finisher casts on their status 15.8% → 21%. Biggest blocker: no setup for that status on the whole team (~45% of unstatused finisher casts); finisher unit acting before the teammate with the setup is not handled (no delay action in blitz).
Probe: /mnt/project-files/status-combos/ (duel.js + instr.py/instr_body.py add per-brain combo stats + reason counts; needs playtest-harness setup.sh).

[[ai-audit-20261101]] [[ai-training-rework-20261029]]
