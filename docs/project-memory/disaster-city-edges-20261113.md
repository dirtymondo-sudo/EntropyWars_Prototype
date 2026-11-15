---
name: disaster-city-edges-20261113
description: Disaster City natural edges LIVE PR #1310 + #1317 (11-13): ring of fake border buildings replaced by mountains N / forest W / desert S / bay E; where the code is, rules for other city threads, seen in game headless
metadata:
  type: project
  modified: 2026-11-13T20:29:28.128Z
---
Thread (thread in the owner project) "Replace Disaster City's border buildings". mondo 11-13 19:20: get rid of / replace the "edge/moat" of fake buildings round Disaster City; highest side = steep mountains, one side forest / tall trees, one side plain flat desert; "I want the buildings to be interactable ... fake buildings as barriers doesnt feel right". Later other zones (The Woods) use the plot system and plots get connected. 19:28 he tapped "Build it as drawn". LIVE PR #1310, then PR #1317 (haze colour fix; three-renderer.js 8bb8a628). Thread left open for his look on the Mac.

- City bearings: x west to east, z north to south (room metres, city ±252). North edge is the high side (levels 11-14), west falls 14 to 0, south 0-1, east is the bay. Since Bayside's beach (PR #1308) the shell is 644 x 504: 70 m strips each side; the west strip is dead ground behind a ghost wall at x -252.4.
- GONE: skyline ring (`terrain.backdrop: false` on the room; `_hqBuildCityBackdrop` untouched for other rooms) and the 63 filler buildings on the OUTER plot line (bake-disaster-city.js THE INFILL `r.outer` cut; Bayside's east line kept). Southside's + Financial's styled back lots on the outer line went with them.
- THE LAND: bake `EDGES` -> `terrain.edges = { reach, n, s, w, e }`, side = `{ kind: mountain|forest|desert|coast, inset, cap: { kind, at, off, len } }`; three-renderer.js `_hqBuildEdgeLand` / `_hqEdgeLandFn` / `_hqEdgeLandOn` (THE NATURAL EDGES). A room with `terrain.edges` builds NO field outer ground; `_hq.outer.yAt` is the land. ~36k tris, 20 chunk pieces (`H.chunks.cells['edge:..']`), far part (>70 m) fog-free with baked haze (copies the room's scene.fog.color), ~900 trees via plantTree. Kill switch `EW_HQ_NO_EDGE_LAND`. Edge stops per side = bake `EDGE_STOP`.
- Rules for other city threads: never use `terrain.outer: false` on the city (it trims the field, JUST THE ROOM); a district's outer-line infill no longer exists; the land samples the field's edge ground, so anything a district sinks / raises at the room's edge shows in the land.
- SEEN IN GAME 11-13 (headless, after his "go ahead"; the classifier refuses a browser run until he writes approval in the thread): all four sides, corners, seams fine. Shots /mnt/project-files/disaster-city-edges/ingame_1_north_west.jpg, ingame_2_south_east.jpg (mock-up: mockup_sheet.jpg). How: scratch copy of playtest_city.js, `--wait=240000`, views need absolute camera y (level*1.75 + eye), face 0 = north, 90 east.
- Left as seen / offers: forest hillside bare past 60 m (only from the air), forest floor sheet bright green, snow line jagged, no road out into the desert, no rocks/cactus (he asked plain flat), sky far roster still `scenery: 'city'`.
Related [[disaster-city-144-20261113]] [[disaster-city-vertical-20261113]] [[disaster-city-bayside-20261113]] [[perf-city-chunks-20261113]]
