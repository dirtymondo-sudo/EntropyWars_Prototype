---
name: new-heaven-20261103
description: NEW HEAVEN (11-03, PR #838): gate room rebuilt from mondo's concept art via hqSkyPlan; FLAT FILL fixes cutouts under float plateaus; zip 20261103-0859
metadata:
  type: project
  modified: 2026-11-03T08:59:39.833Z
---

mondo 11-03: "on the heave map, what is up with those platforms and how they have ugly cutouts underneath them? Use this concept art to make a new heaven map" (top-down 12x12 concept: gate, round sun, 2 terraces, bottom stair platform, cloud paths, corner castles).

- Cause: float plateau ring cut whole ground quads -> sky dome (fog colour, green) showed through. Fix THE FLAT FILL (three-renderer `hq:field:flatfill`), all float-plateau rooms. Float STAIR runs still cut (a fill there would step).
- THE OPEN SKY: void-room props over open sky / y<=-0.5 hang at their y (only heaven gate uses it).
- site_prebuilt_heaven_gate rebuilt with data.js `hqSkyPlan(rows, {legend, rail})` (one char per 3.5 m square). Exactly 48 void squares = wallMax; end platforms only 0.5 m up (spawn/nexus must be level 0). 9/10/11 boards stay on the stair room.
- Castles = McSteeg Castle and Fort Builder Pack (Assets/misc/Castles_and_Forts.glb, added to zip by hand, credited). Unzipped copy was /tmp only; source /mnt/project-files/asset-packs/.
- Calls flagged to mondo: removed rift/plank/stepping clouds/pillar/lookout/pools/fountain/benches/priest+angel NPCs; seraphim moved onto a castle island; no banners.
- Token 20261103-newheaven-01-cors, zip ENTROPY_WARS_SYNC_20261103-0859. Shots /mnt/project-files/heaven-map/. Notes maps-terrain-battle.md "THE NEW HEAVEN + THE FLAT FILL".
- Follow-up PR #844 (THE GROUND UNDER): data.js info.GD = lift floats add; renderer draws ring + float-stair runs on H-GD (no holes/cracks/dark bands); potted plants removed (mondo: "potted plants in heaven?"). Zip ENTROPY_WARS_SYNC_20261103-0925 (supersedes 0859). Heaven Stairway gen mass pokes through round cloud (17.5,10.5): left as is.
- Harness tip: ph eval can't see `const ThreeRenderer` as window prop but can by name; ThreeRenderer._scene; raycasts need rc.camera set (sprites).
