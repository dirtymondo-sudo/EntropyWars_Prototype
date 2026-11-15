---
name: playtest-cube
description: 10-23 hands-on VS CPU "win by Cube" playtest (3 matches, Stonehenge 10x10): won match 3 by Cube; report link + key findings
metadata:
  type: project
---

10-23 (main as of 10-22): a thread played 3 VS CPU matches by hand (Stonehenge Arena 10x10, 4v4, Training tempo) to win by destroying the Cube. Lost 1 and 2 by wipeout (Cube 3206, 722 left); won match 3 round 14 by Cube (Dinosaur, Mech, Dreameater w/ Archon's Focus, Gargoyle). Report https://claude.ai/artifact/BqLpotev1HFttbkZGZoiEW ; screenshots /mnt/project-files/playtest-cube/. Nothing fixed; mondo picks.

Findings traced in code: ATK-stage buffs are a no-op at L100 (_statStageCeil = max(100, base), ATK 230-271 → "ATK MAXED", MP/AP still spent); stagger debt (_staggerApDebt) survives death+respawn; Healing Potion forecast ignores Grievous (ui.js _estimateHealPotionHeal); Abilities shows "NO TARGET" when the only spell is on cooldown (hud.js ~5539). Questions raised: wipeout counts respawn-pending units; respawned unit gets no turn that round (intended in code, unsaid on screen); Brutal Slam t3 / Eternal Slumber t4 apply status; Cube hits skip crits/passives.

Cube tactic that worked: hit a super-effective enemy first (+2 AP press refund), then the Cube; keep one unit back to avoid wipeout. See [[hands-on-playtest]].

FIXED 10-23 in PR #419 (main 3b42ab5, token 20261023-cubebugs-01-cors, zip ENTROPY_WARS_SYNC_20261023-0324.zip): every bug + "seen" item except the take-off move (other thread) and the Cube-missing-once (not reproduced). STAT STAGE CAP RULE (mondo 10-23, PR #421): cap = the roster's highest level-100 value of the stat (top RACE_BASE_STATS + LEVEL_TOTAL_STAT_GAINS + max natal) + 5 stages, read live (battle.js _statStageRosterTop), for ATK/M ATK/DEF/M DEF/SPD; step still 20. Zip ENTROPY_WARS_SYNC_20261023-0332.zip (battle.js 4b9ee4a7). Also found: matchNumber never counted up on party-builder starts, so the series record and the match history lost results (fixed).
