---
name: strip-big-squares-20261028
description: THE BIG SQUARES (PR #634/#638-#640, 10-28): 3.5 m squares — Strip trial, then mondo "2x everywhere": default + keep-old-pick guard, 7 arena sites, 6 side rooms doubled
metadata:
  type: project
  modified: 2026-10-28T07:37:34.980Z
---

mondo 10-28 asked whether units could stand on bigger squares (more room between units, fewer camera problems, same gameplay). The coordinator proposed a per-map "square size" at 1.5-2x, and he said "let's try that on the strip".

PR #634 (token 20261028-stripsq-01-cors, zip ENTROPY_WARS_SYNC_20261028-0737):
- data.js `HQ_ARENA_RULES.squareM = { prebuilt_strip: 3.5 }`. All four Strip arena sizes are re-cut on 3.5 m squares (the pick carries `sq`). Other maps stay at 1.75 m.
- Bodies are drawn at real size (`UNIT_SPRITE_SIZE_RATIO` = 1.75/C, set per fight). Automatic camera framings are sized in bodies (battle.js `_framingBodyK`). Walks are slower per square so the gait doesn't skate.
- NOT scaled (flagged to him): AoE/spell VFX sizes, tile highlights, blood decals.
- To try another map, add it to `squareM` and rerun bake-arenas.js for that site at every size.
- Notes: docs/notes/maps-terrain-battle.md "THE BIG SQUARES". Shots: /mnt/project-files/strip-squares/.

mondo 10-28 verdict: "2x everywhere, use multiple threads so they dont turn out bad" (rooms that don't fit get ENLARGED, his pick).
- PR #638: HQ_ARENA_RULES.squareDefault 3.5 (bake-only; live picks play on their own `sq`); bake-arenas.js keeps a site's old pick when no window fits ("KEEPS ITS OLD PICK") — never drops a board.
- PR #639: Downtown, Cyberpunk, Camelot, Stadium, Area 51 (flight line 64->72 m deep), Fairy Forest re-cut at all 4 sizes.
- PR #640: side rooms doubled x2 in plan (camelot dungeon, downtown cells/workings, fairy deadmans/redwoods/ritual); HQ_WORLD underworld re-seated (cells 166,-18; workings 282,74; hqWorldValidate ok); bake-holes.js rerun after any room grows. Tool: /mnt/project-files/tools/scale_room.py (scales a room literal's plan keys, skips passage/rect/strings).
- Box side rooms (strip casino/chapel, downtown lobby/showroom/subway/closet, cyberpunk noodle) wait on the exploration thread's box cellM (hqFieldSquareFor, 36-square rule); closet/noodle need ~3x.
- Other sites split across threads by the coordinator.
