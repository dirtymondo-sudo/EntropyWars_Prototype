---
name: move-towards-click
description: Move-mode click past the move range picks the lit tile with the shortest walk left to the click (battle.js findMoveTowardsTile, PR #408, 2026-10-22)
metadata:
  type: project
  modified: 2026-10-22T06:59:55.145Z
---
mondo 2026-10-22: "click a tile outside my move range ... only moves me one tile at a time, even if there is a tile closer ... in my move range".
- Cause: findMoveTowardsTile took the furthest reachable point of ONE cheapest route from the unit; routes that climbed/waded early stalled short.
- Fix PR #408 (main 8972a80, token 20261022-movetoward-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261022-0659.zip battle.js f95f6eed): findMovePath takes `seeds` + `startCost` route opts; findMoveTowardsTile seeds every reachable tile, the shortest walk left wins, ties -> straight-line nearest. Hover ghost + tile-menu "Move towards" use the same function.
- Unit-target "Move Towards" (hud.js `_bestTowardStep`, chase chain + preview + enemy/ally quick-menu first leg) got the same seeded pick in PR #411 (main ebcfa17, token 20261022-movetoward-02-cors, zip ENTROPY_WARS_SYNC_20261022-0747.zip: battle.js fe9f09b9, hud.js cc3c6ea2, ui.js 999f6b79). Leap wins only if it leaves >=1 move point less; never ends on the target tile. mondo asked for it 10-22 after #408 left it open ("of course i want the move towards fixed too"): fix same-kind gaps in the same thread without asking.
- PR #459 (10-23, main f85f1ea, token 20261023-mvledge-02-cors, zip ENTROPY_WARS_SYNC_20261023-1155 battle.js 970e6675): mondo "still only moves me one tile at a time". Cause: findMoveTowardsTile skipped getMoveTiles `_jump` tiles = every tile whose walk includes a hop (>1 level, off a wall top) and all past it, though doMove walks to them. Now only `_takeoff` skipped. Proved on Pyramids of Giza wall top (G3 click: G7 -> G5); shot /mnt/project-files/move-towards-ledge/. Follow-up PR #460 (main f186fd5, token 20261023-mvcast-01-cors, zip ENTROPY_WARS_SYNC_20261023-1212 battle.js 59613102): findSpellApproachTile, _findSelfNovaApproachTile, TargetQuery.hasReachableTarget, findInspectApproachTile, findCaptureDoorApproachTile count hop tiles too (proved: Sedan on wall, MOVE->CAST off the wall). MD companions + ai.js unchanged.
- Browser harness for this (cloud): jsdelivr + cdnjs are blocked; serve npm copies (three@0.186.1 etc.) via a ctx.route on cdn.jsdelivr.net; launch a specific map via MS_MAP_LIST/_msSelectedMap + window._msConfirm() then wait for .ew-arena-survey to clear. Swiftshader is ~1 s per page.evaluate. [[hands-on-playtest]]
