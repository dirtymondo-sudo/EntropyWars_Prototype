---
name: team-play-ai-20261101
description: 11-01 PR #744 CPU team play (Batch C gaps 6+7): Teleport-any pull/bring, finisher waits for a teammate's setup; lab numbers; gap 8 Hard lookahead NOT done
metadata:
  type: project
  modified: 2026-11-01T10:05:56.265Z
---
Batch C of the 11-01 AI gap list (thread "Improve CPU team play"). SHIPPED PR #744 (merged 11-01), AI stamp v4.31 (...+ground-price+team-play), token 20261101-teamplay-03-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1005.zip (ai.js dbdfdd97, plus data/map/party-builder from other threads).

- Gap 6: _teleportAnyPick adds 'pull' (enemy dropped where caster can still basic-attack: Teleport keeps the turn but the one-spell cap leaves only the swing; or a mate still to act gains reach) and 'bring' (mate with nothing in walk+range dropped where it can shoot). _tpWhy tags the pick. Kill switch EW_AI_NO_TELEPORT_PULL.
- Gap 7: _comboWait (after _comboFirst): non-lethal finisher, mate still to act this round has a setup that lasts into next round, finisher can't be recast next round (cooldown / MP for one) -> best other real action now (must leave finisher MP, per Codex review), never twice running; mate credits cash-in 0.8 via _comboWaitFor. Kill switch EW_AI_NO_COMBO_WAIT.
- Lab vs main: 438-435/873 (graded 49.8 ±2.8) + after merging #736/#737 259-241/500 (51.7 ±3.8); 0 page errors. Neutral: plays rare (115 waits, ~0 pulls in 873 matches; Teleport-any on few teams). Not lab-checked vs the ground-price AI (#743) merged right before.
- Gap 8 (Hard lookahead) skipped (optional; old reply check lost 7-19).
- Harness: /mnt/project-files/team-play/ (duel2.js adds --spell-bias ids and per-side counts WAIT / TPANY:why / FIN:bonus|plain / SETUP; needs playtest-harness setup.sh + trap-plan/instr.py on both ai.js copies). Gotcha: `git checkout -B x origin/main` before `git fetch` used a stale main.

[[status-combos-ai-20261101]] [[ai-training-20261101]] [[ai-audit-20261101]]
