---
name: cpu-way-out-20261101
description: 11-01 PR #751 AI gaps Batch B: enemy mobility + sight lines in the danger read, escapes/swaps/reels as a way out, leap strikes from walk/jump squares; lab level (~49-50%)
metadata:
  type: project
  modified: 2026-11-01T11:46:34.534Z
---
AI gaps Batch B (gaps 3, 5, 8 of the 11-01 training report), thread "Teach the CPU safer positioning".

SHIPPED PR #751 (merged 11-01, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1146.zip = ai.js 1e2f3880, token 20261101-wayout-01-cors, AI stamp v4.32). ai.js only, existing rules, weights untouched.
- Danger read: _enemyMobileOrigins (Jump, move-only dash, self teleport, aimed escape, Grapple reel; one + a hit, never with the walk), _enemyHitMask (LOS via isRangeBlockedByTerrain past first ring, first ring incl. diagonals, 5k checks/enemy cap). Switches EW_AI_NO_MOBILE_THREAT, EW_AI_NO_THREAT_LOS.
- scoreWayOut + scoreMobility (c): swaps/reels/escapes/Sprint as hop into a hit (_shotAtAfterMp) or off a hot square (gain*0.8, >30), swap partner counted; ranking charges swap/reel landing; _wayOutKeepsZone. Switches EW_AI_NO_WAY_OUT, EW_AI_NO_WAY_OUT_SAFETY.
- Leap strikes in jointMoveActionSearch via spellAimProblemOn at the square. EW_AI_NO_HIGH_GROUND. Not done: climb-to-perch.
- Lab vs main: 49.0% ±3.0 (818), 49.0% ±3.1 (738 after fixes), 50.1% ±4.5 (347 vs newest main). Way out alone before fixes 46.5% ±3.7. No measurable strength change. Casts up a lot (Grapple 0->427, escapes, swaps, Vault 2x); From the Ceiling still 0 (few chances).
- Harness/results: /mnt/project-files/ai-way-out/ (duel_usage.js with per-seat usage + --set flags). Notes champions-combat.md "THE WAY IN, THE WAY OUT, THE HIGH GROUND".

[[ai-training-20261101]] [[cpu-traps-20261101]]
