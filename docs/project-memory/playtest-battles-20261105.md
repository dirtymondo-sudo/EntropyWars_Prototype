---
name: playtest-battles-20261105
description: 11-05 two VS CPU playtests (Meshy team + created looks) on WebGL2 backend, report-only; bug families + harness tips
metadata:
  type: project
  modified: 2026-11-05T23:39:49.203Z
---

11-05 thread "Playtest battles and document bugs" (thread in the owner project), main 26bcd34, report only.
Report: /mnt/project-files/playtest-battles-20261105/PLAYTEST_BUGS_20261105.md (+ shots/, ledger, match exports).
Battle 1 Mount Shasta (Bigfoot/Jack-o'-Lantern/Annunaki/Ice Queen), battle 2 Camelot (saved looks Cowboy/Catgirl/Santa + DOOR Agent).

Top findings: Cowboy+Catgirl created looks invisible at spawn in board view (visible close-up / after moving); Team Select
toolbar (DEPLOY) hidden under .sq-head after a 2nd team is saved; last ability row unreachable by mouse; combat log over
top-right HUD; Absolute Zero whiteout; Sasquatch Smash cam under water; black x-ray silhouettes in the open; CPU Ringmaster
casts Crowd Surge on nobody every round ("hits 0 targets"); typo battle.js:6161 "round"→"around".
Not bugs (design): click on out-of-reach tile in MOVE = "Move Towards" (battle.js ~47260), spends AP.

Harness tips: `ph start --query '?ew_gpu=webgl2'` works with draw on demand (WebGPURenderer webgl2 backend). Action Cam ships
OFF: Pause > Settings > VIDEO > Action Cam checkbox. Pause > CAMERA = F8 free-fly (pointer lock; exit with F8).
Ability list scrolls with ArrowDown, not wheel. Shots cost ~3 s each, so action-cam hold timing can't be judged.
Related [[sandbox-playtest-speed]] [[playtest-vscpu-20261103]]
