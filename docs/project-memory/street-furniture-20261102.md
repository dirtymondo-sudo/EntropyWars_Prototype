---
name: street-furniture-20261102
description: City props polish (PR #787, 11-02): Strip/Downtown/Cyberpunk scatter on kerb/back/gutter/lane bands, compile-placed lamps, race-gate posts on kerb, crisp road edge; calls flagged
metadata:
  type: project
  modified: 2026-11-02T01:58:59.003Z
---
mondo 11-02: lamps/signs/poles/benches misplaced in the city maps + "really define the difference between the road and the sidewalks".

PR #787 merged, token 20261102-streetfurn-03-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261102-0158.zip. Shots /mnt/project-files/street-furniture/*_before_after.jpg.
- data.js HQ_CITY_FURNITURE: per-kind band (kerb/back/gutter/lane), gap, pole, `debris: true` (cinder_block, cardboard_boxes stay where they fell in area rows). info.lamps = compile lamps (corner posts + kerb every 14 m, cap 44).
- three-renderer.js: draws info.lamps; THE ROAD'S EDGE cuts the pavement sheet at road edge only (a first try that ADDED sidewalk along every road edge painted pavement over stop lines on open asphalt: dropped).
- Checks used: hqTerrainInfo lots sha vs main (Strip 6f6c2466, Downtown 91447f34, Cyberpunk 076f8adf), arena pick rasters identical, per-key scatter counts identical. Moving a prop near the building line re-lays lots (Cyberpunk brazier/vending machines needed exact spots).
- Calls flagged to mondo: corner lamp posts added (Strip 32→39 lamps), planters under Downtown plaza island trees, darker asphalt floorTint Strip/Downtown, race-gate posts moved to kerb, some vending machines left mid-sidewalk to keep lots.
- Sandbox probe (playtest_city.js) never draws the street lamp OBJ (glows only), before and after alike: harness issue, not the game.
