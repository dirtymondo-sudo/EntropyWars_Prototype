---
name: city-yards-open
description: Disaster City invisible alleys fixed (PR #146, 2026-10-06): city walker solid = buildings only, yards walkable + paved
metadata:
  type: project
  modified: 2026-10-06T21:27:42.188Z
---
PR #146 merged 2026-10-06; zip /mnt/project-files/alleys/ENTROPY_WARS_ALLEYS.zip (data.js, three-renderer.js).
Root cause: `city` plans refused the walker on the whole block mask, buildings (info.lots) covered only part, so gaps read as alleys on dark cliff-sheet ground but were invisible walls. Now _hqTGenerate opens every uncovered mass cell after THE INFILL (rim kept, roof-drop pockets re-closed by a reach flood), sets info.yard; renderer paints yard cells with the path sheet. Applies to Downtown, Strip, Cyberpunk. Kill: gen.yardsOpen:false.
**Why:** mondo furious ("a building is literally just a box, why invisible walls").
**How to apply:** never make a city block mask the walker's blocker again; buildings and real walls block. Related: [[mesh-collision]].
