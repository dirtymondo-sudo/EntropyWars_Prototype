---
name: forced-move-log-lines-20261107
description: Forced movement log convention (PR #1005, 2026-11-07) and the battle.js log helpers it added
metadata:
  type: project
  modified: 2026-11-07T06:56:21.745Z
---

PR #1005 (merged + live 2026-11-07) fixed forced movement playtest families E, M, P6 + B2's missing line.

Convention mondo approved via the coordinator: ONE log line per forced move. It says who moved, the NET distance (no rebound steps), the end tile and what it landed in. It reads after the hit that caused it (cast/damage, then the move, then the landing). A 0-tile move writes no line.

Helpers in battle.js (next to `_logSinkAfter`):
- `_logLift(mark, from)`
- `_logTake(mark)` / `_logPut(taken)`, for pulls whose damage lands later
- `_fmNet(res)` / `_fmTiles(n, x, y)`
- `_logPushMove(lead, target, res, verb)`
- `_slideObstacleName(info)`

Reorders must happen in the same JS task the lines were written, because the guest's `_gvLogKeep` cache is index-based.

E6 (To the Moon's turn passed before the landing) is fixed by main's `_landingGate` from another thread. That is the same idea as this thread's fix, and the merge kept main's version.

Proof: /mnt/project-files/playtest-mechanics-20261107/forced-movement-log-fix/ (lab) + vs-cpu/ (VS CPU).

PR #1009, the follow-up after the coordinator asked for a VS CPU proof:
- A slide's landing lines wait for its impact-frame slam.
- A yanked flyer's landing line comes after its fall.
- Walk the Plank uses `_applyExecuteRider` when the hit leaves the target standing, and its drown line stays BEFORE the hit (the water acts first).
- The board log, the old chat log and online.js `_gvLogKeep` rebuild when the last line they handled has moved: hoists can cross a render.

Open (not fixed, reported to mondo):
- (FIXED PR #1010) A heavy crash-through of a cliff still slams and rebounds: arena cliffs are field rock cells; _breachWindowCheck now refuses fieldCellRock, and the slam line says "rebounds" only when it really bounces (pins say "slams into X!"). Proof /mnt/project-files/playtest-mechanics-20261107/solid-wall-smash/.
- Shield-absorb and "drinks the water part" lines print above the hit line.

Related: [[playtest-mechanics-20261107]] [[forced-movement-rules]]
