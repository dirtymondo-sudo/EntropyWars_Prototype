---
name: room-next-door-ao-20261115
description: Main Hall dark seen from the Foyer, lit the moment you cross (mondo 11-15) = room-box AO of the room you stand in crushed every room outside its box; fixed PR #1457
metadata:
  type: project
  modified: 2026-11-15T16:22:34.012Z
---
mondo 11-15: "the lighting isnt on at first and suddenly turns on as i walk through the door". Thread (thread in the owner project).

- Cause: three-renderer.js THE ROOM-BOX AO (`_hqAoHook` GLSL + `_ewNodeAo` node). The box = the room you stand in (`_hqAoArm`, re-armed at `_hqStageSwap`), but the shader runs on everything drawn; a point outside the box read as against 2 walls + ceiling, so a joined room seen from a box room drew at the 0.3 clamp, bar strips in line with the box's walls (looked like hard shadows). This is also the "seen, not fixed" line in [[main-hall-far-walls-20261112]].
- Fix PR #1457: outside the box (past 0.15 of the reach) walls/ceiling shade nothing; floor contact stays. Token 20261115-nextdoor-02-cors, three-renderer.js d34bc140. Note docs/notes/rendering-loading-perf.md "THE ROOM NEXT DOOR". Proof /mnt/project-files/hall-light-pop/.
- NOT the cause (all measured identical both sides, hours lost): lamps, rig, lamp budget, key shadow / lid / frustum, scene look, fog, bundles.
- Left: a box room's own corner shade only shows while you stand in it; height fog row and scene look also swap at the crossing (small). If he still sees a pop, look at those next.
- His separate "hall dark until the foyer attaches after Continue" was not reproduced in the cloud.
- Harness recipe (WebGPU, ~10 min load): `ph start --gpu webgpu`, `_hqEnter({from:"play",room:"central_egress"})`, wait foyer attached + gate ready, `dev.teleport({deg:195,r:22.5})` crosses to the foyer, first person, `teleport({x:0,z:-3.05})`, `lookAt(4,-20,0)`, wait ~25 s for the doors, `ph draw demand` before `ph shot`. He is angry about being asked for console pastes: do not ask.
