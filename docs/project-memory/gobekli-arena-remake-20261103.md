---
name: gobekli-arena-remake-20261103
description: Göbekli Tepe arena remake (PR #836, 11-03): ring wall gone, mound dirt_4 not glyphs, outer.sheet 'solid' soft edge, block/arena squares never gaps
metadata:
  type: project
  modified: 2026-11-03T08:47:51.739Z
---
mondo 11-03: "why are there t-pillars on top of these walls? get rid of the walls ... harsh boundary at the edge ... glyph texture only for ancient structures, not the ground. Remake the gobekli map."

PR #836 merged (token 20261103-gobekli-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261103-0847.zip).
- Cause: a prop stands on the ground under its foot; a terrain `wall` row IS ground, so pillars placed "in" a ring wall stood on its top. Never put a prop's x,z inside a wall row.
- Enclosure E (arena's place) ring wall removed; A-D six pillars moved clear of walls.
- Tell `cliff` rock_wall_1 (glyph sheet) → dirt_4. Glyph rock_wall_1 stays on built wall rows/bastions/stairs. mondo: glyph texture = ancient structures only.
- Hard edge = room edge 28 m east of the board (field mass in cliff sheet vs outer ground in floor sheet). New opt-in `terrain.outer: { sheet: 'solid' }` carries the cliff sheet past the edge. Other look:'rock' rooms (Stonehenge etc.) likely have the same edge; not changed — offer it.
- hqTerrainSealedSquares: square-thick wall blocks and HQ_ARENA_RULES.within places are never gaps (bastion corners had been pits). Only the tell re-baked.
- within.prebuilt_gobekli r 6→2.5 keeps the designed windows (wider r slid the 12×12 onto the ledge).
- 2nd pass PR #841 (mondo furious, missed it first time): the 4 pit pillars stood on DRAWN battle-stone wall rows (5.45/3.15 m glyph blocks). Rows now `ghost: true` (invisible, still block); new prop flag `floor: true` stands a prop on hqTerrainHeight, not a wall top. LESSON: check every prop vs every wall row, incl. 'battle stone' rows inside pillars. Zip 20261103-0912.
- 3rd pass PR #848 (mondo: pillars "supposed to the space of one square and be like 2 or 3 squares tall"): E pillars 3.5 m wide, 6.6-8.4 m tall; pit pillars on square centres, one-square ghost stones (level 3). Meshy t_pillar.glb (D07, on R2, wired by the decor thread) is 0.6 w/h, so new placement `w` stretches it to that width. Zip 20261103-1004.
- Harness note: in playwright the model queue takes >2 min (unit rigs first), so decor GLBs look missing; set EW_NO_MODEL_QUEUE=true before launch for shots. Not a game bug.
Related: [[grid-fit-group4-20261026]] [[sites-a-h-2x-20261028]]
