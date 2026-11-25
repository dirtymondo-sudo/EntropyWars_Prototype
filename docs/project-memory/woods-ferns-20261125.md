---
name: woods-ferns-20261125
description: 11-25 Woods ground ferns fix (PR #2551): kit fern tint, ZONE_FLORA.swap retires Meshy 'fern' rosette + 3-stick dead bush by climate; waits his look
metadata:
  type: project
  modified: 2026-11-25T07:55:02.542Z
---
Thread (owner-project id) (part of foliage pass 2, lead (thread in the owner project) owns flora.md §0 rules + _hqFloraCell).
- Culprits: flora field kit ferns rf_plant_7/1 (pale picture), old Meshy `fern` (agave rosette, 7.7k tris, ~1,560 rows in 50 rooms), psxg_dead_bush_1 (3 sticks, ~800 rows).
- PR #2551 live (data.js ad6c1c01, three-renderer.js cd03b418): M.fern/M.bush re-listed, ZONE_FLORA.tint (lead's code reads it), ZONE_FLORA.swap + zoneFloraSwap in _hqPlaceProps (rosette kept only tropical/japan/hollow; dead bush 1 -> psxg_dead_bush_2). Notes flora.md §3c.
- PR #2553: rosette also off no-zone rooms (old sites, plot dungeons) via swap `none`.
**How to apply:** to retire a bad model game-wide add a row to ZONE_FLORA.swap. Waits mondo's look. Related [[woods-new-trees-20261115]]
- 11-25 later: mondo "plants randomly placed, ugly; do a beauty/scenic pass on all zones". Lead thread owns rules (flora.md §00 S1-S12). Woods PILOT live PR #2556 (data.js 3835d3bb): GROUPS KIT ZONE_FLORA.compose + zoneFloraCompose (anchored groups 3/5/7, hand loose rows dropped via info.composeDrop), Woods flower/fern layers near+far 0.05. Focal/framing/vignettes (S1/S2/S9) not done. Waits his look.
- 11-25 round 2 (mondo: "no blades, plants on a flat field, grass not broken up"): PR #2558 live (data.js a86514e8). compose.islands = rock islands w/ plants in open grass (Clearing 24, Ritual 27, Redwood 13); flower/fern far 0.55 on lawn/floor; dark tufts on dirt_2 (no GGRASS palette there = no blades, told lead); Woods grassH 0.6. Missing blades in his example = probe snapped early: use settle 9000. Proof woods-ferns/woods_scenic_round2.jpg. Waits his look.
