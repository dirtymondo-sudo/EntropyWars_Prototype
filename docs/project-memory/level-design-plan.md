---
name: level-design-plan
description: LEVEL_DESIGN_PLAN.md (2026-09-30): area ranking, Woods staircase hall, Vatican rebuild, Astral jump islands over a void, spaceship staged zone, maze conversions L4/L5 next
metadata:
  type: project
  modified: 2026-09-30T20:47:56.932Z
---
mondo (2026-09-30) asked: study door_reference_images/, fix areas with raised terrain that should be buildings, Astral
floating platforms you jump across, the DOOR HQ staircase to the Woods like the reference (not the stairwell), the
spaceship with no load screens, sewers/tunnels/caverns/dungeons as real mazes (map_layout.JPG), the Vatican and library.

Plan: LEVEL_DESIGN_PLAN.md (repo root), log in §9. Deliveries L1-L6 in §8.
L1+L2+L3 built 2026-09-30 in one PR (branch claude/area-level-design-3m97bp), zip level-design/ENTROPY_WARS_LEVEL_DESIGN_1.zip
(data.js, three-renderer.js), uploaded after spell audit C. PR #32 merged (main 33f3189), token 20260930-leveldesign-01-cors.
Next: L4 mazes (downtown_sewers, tunnels, cells, workings, Dead Man's Cave), L5 (Cavern, Camelot dungeon, Hell pit).

Engine bits added: terrain `void` (data.js hqTerrainVoidAt; walker can't step onto it, a missed jump fades back to the
last grounded spot), float plateaus get rock undersides, `built: true` ramps step a tread per 0.5 m cell, plain bridges
as galleries, zone `derelict` on ground `space` in HQ_STAGE_RULES.zones.

**Why:** later threads continue L4+ from the plan instead of re-deriving it.
**How to apply:** read the plan §7 before any maze room; use `plan` gen space/hall rows (look walls/rock/trees);
check rooms with a compile + reach/traps script before shipping; rerun bake-arenas.js after a site room changes.
Related: [[zones-plan]], [[editor-plan]].

- Delivery 2 (L4+L5 mazes, 2026-09-30): sewers, tunnels, cells, workings, Dead Man's Cave, Camelot dungeon, Cavern gallery, Hell pit rebuilt as plan layouts; zip level-design/ENTROPY_WARS_LEVEL_DESIGN_2.zip (data.js), token 20260930-leveldesign-02-cors. MERGED as PR #33 (main 9f5485c) after mondo said "push and merge it". Next L6 (§3 #7-#9).
- Delivery 3 (L6, 2026-09-30): Backrooms + Flat Lands + Bay 6 deleted everywhere; H-Wing rebuilt as ONE layout room `hwing_floor` (the backrooms design, zone `hwing` lobby⇄floor⇄home door joins); D.U.M.B. (5 rooms), Area 51, CERN, Lodge halls, Dutchman deck, Agartha/Technoticlan/Antarctica/North Pole, Olympus, haunted grounds, Stonehenge/Göbekli/Giza/Babel as plan layouts; arenas re-baked. PR #34 merged (main 6678460), token 20260930-leveldesign-03-cors, zip level-design/ENTROPY_WARS_LEVEL_DESIGN_3.zip (data.js, map.js, three-renderer.js, audio.js). All §8 deliveries L1-L6 done.
