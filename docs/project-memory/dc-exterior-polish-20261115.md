---
name: dc-exterior-polish-20261115
description: Disaster City exterior polish LIVE PR #1412 (11-15): bake-time exterior-polish.js puts outdoor props on the compiled ground; banks wear cliff sheet; bare arch parts get surface sheets; district looks LIVE PR #1414
metadata:
  type: project
---
Thread (thread in the owner project) "Polish Disaster City exteriors" (mondo 11-15 09:16: bench clipping a wall/curb from the elevation pass; generated shapes need a texture; 09:16:59 "give each district its own vibe ... while disaster city as a whole feels connected").

- LIVE PR #1412 (data.js 6c581609, three-renderer.js 17adf9ca, token 20261115-extpolish-01-cors). NOT SEEN ON SCREEN (RULE #1c); checked offline on the compiled room.
- `docs/disaster-city/exterior-polish.js` runs LAST in `node bake-disaster-city.js` (DC_NO_EXT=1 skips, DC_EXT_LOG=1 lists rows). The bake compiles the room headless from a scratch data.js (adds about 10 s) so the pass reads the real `hqTerrainHeight` / `hqTerrainFeet`. Tally 11-15: 104 props off wall tops (`floor: true`), 125 moved off level steps, 12 wall things hung at a bank top, 14 dropped props put back, 1 taxi left (Financial Taxi court canopy).
- Facts: the game stands a prop on `hqTerrainFeet` at its middle; within 0.34 m of any wall that is the wall TOP (outdoors too) unless the row has `floor: true`. A levels step is about 0.9 m wide, mostly on the LOW side of the plot line. props.js FIXED `^city_` used to match city_bench / city_bin (never checked): fixed.
- three-renderer.js: a steep face in a painted `terrain.slope` room wears the room's cliff sheet (kill `EW_NO_STEEP_CLIFF`); an arch part with no `key` wears a sheet picked from its colour (`HQ_ARCH_SURFACE`: calm_rivets / calm_concrete / calm_planks / urban:PlasterWallPainted1a, colour kept; kill `EW_ARCH_BARE`). So district threads need not key every trim.
- The Collapse rubble on its `hill`, palms, floats, deck props are left alone on purpose.
- DISTRICT LOOKS LIVE PR #1414 (11-15, he chose "Build all of it"; data.js 9f40162e, three-renderer.js f1e6878f, token 20261115-dlooks-01-cors). NOT SEEN ON SCREEN. One post + banner shape city-wide; per district: lamp light colour, name banner on every other lamp (137, one mesh per district), one kerb piece beside every third lamp (89). Tables: bake-disaster-city.js LOOKS (-> terrain.gen.looks), props.js KERB_LOOK. Renderer `_hqBuildStreetLamps`; banner sheet = `_hqArchSignTex` key 'txt:NAME|ink|bg|aspect|v'. Kill `EW_NO_DISTRICT_LOOKS`. District threads: do not recolour lamps by hand, edit LOOKS. Notes areas-complexes.md "THE DISTRICT LOOKS".
Related [[dc-interior-polish-20261115]] [[disaster-city-vertical-20261113]] [[disaster-city-prop-pass-20261113]]
