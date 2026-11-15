---
name: dc-university-interiors-pass2-20261113
description: University (Disaster City) interiors SECOND PASS 11-13 night: atmosphere (U.js ATMOS) + 18 Meshy interior models on R2 Assets/world/props/meshy/; shared claims list for all districts
metadata:
  type: project
  modified: 2026-11-13T22:50:39.697Z
---
Thread (thread in the owner project) "Polish University interiors atmosphere" (mondo 11-13 22:33: after a district's first interior pass, do a second pass; list models wanted but missing, make Meshy versions, add to model list; focus on vibe/atmosphere). First pass = [[dc-university-buildings-20261113]] PR #1340.

- Code: docs/disaster-city/districts/U.js `ATMOS[kind]` at the end of `inside()` (liner = wall coat + dado + skirting + rail + crown + LIT ceiling; drawn glow lights panelL / strip / pendant / window_; dressing off square centres). Notes: areas-complexes.md "THE UNIVERSITY INSIDES" -> "THE SECOND PASS".
- 18 Meshy models (text-to-image nano-banana-pro concept -> image-to-3d meshy-6, ~10 min for all, pipeline script in project files university-interiors-2/meshy): optimize-assets.js .opt.glb uploaded AS `Assets/world/props/meshy/<key>.glb` via `node sync-zip.js --put`; ASSET_MANIFEST via `node manifest-assets.js <mirror> --merge`; data.js HQ_CATALOGUE_ALL rows (base 'asset'); list-models.js SOURCES row + rerun.
- SHARED LIST every district thread uses: /mnt/project-files/meshy/interior-claims.md (check before making a model, reuse others').
- Blender renders in cloud need `apt-get install libegl1 libgl1` + `pip install bpy==5.2.3` (workbench).
- Prop `y` in the city: with `floor: true`, y < 1 = lift over the room floor; y >= 1 = height from the plot's ground (the bake adds the level). Ceiling things = plain props with y >= 1 (catalogue `ceil` not used in the city).
- LIVE 11-13 ~23:55 UTC: PR #1352 merged, data.js 9f27c9f2 + ASSET_MANIFEST 00cca576 uploaded, token 20261113-univ2-01-cors. Waits mondo's Mac look (headless never loaded most GLB furniture). Shots: project files university-interiors-2/.
- FACING (all districts): city prop `face` 0 = model front (+Z) looks at the BACK wall (-z of the building frame), 180 = at the door, 90 = +x. First pass had back-wall furniture facing the wall; fixed in U.js (`BF`). Teleport camera: face = rot + 90 looked roughly at the back.
- 11-14 BEDROOMS (residents brief, mondo 02:21 "District threads add them"): PR #1362 live, token 20261114-ubeds-01-cors. Faculty homes dc:P03-04-B1 = end house walk-in (3 psx_bed_5 singles); Dorm dc:P00-04-B1 = back-wing hall walk-in off the court (2 dorm_bed). psx_bed_5 headboard = model +x (face 90 on back wall); dorm_bed face 180. Duplicate pastry_case row dropped (Southside keeps it). U.js inside(): `HC` = drawn ceiling height (homes 3.5 m).
