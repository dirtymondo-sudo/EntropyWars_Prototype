---
name: hero-plaza-buildings-20261113
description: Hero Plaza district buildings (Disaster City) - BUILT + polish pass LIVE (PR #1285, #1302, #1322) 11-13, waits mondo's review; code in docs/disaster-city/districts/H.js; gotchas
metadata:
  type: project
  modified: 2026-11-13T17:12:36.354Z
---
Thread (thread in the owner project) "Design Hero Plaza district buildings" (mondo 11-13 16:41: nine district threads architect their plots' buildings, exteriors first, unique + recognizable, interiors need swinging doors, fix pack shop-block scale).

- District = plots x4..7, y4..7 (room metres x -84..84, z -84..84), district id 'H' in docs/disaster-city/city-layout.json. Landmark Superhero Tower P06-04. Roof-route buildings (flat roof at 7 m): Training hall P06-05, Transit court P06-06, Office annex P07-06-B2.
- 11-13 17:12 mondo: "looks good, just remember we absolutely never use that gold texture anywhere in the game, there is a better gold texture" = OK TO BUILD the plan. RULE: never the terrain `gold` sheet (gold.png); use the better gold.
- 11-13 ~19:00 BUILT + LIVE: PR #1285 merged, data.js uploaded. All code in docs/disaster-city/districts/H.js `build(ctx)` (shared hook PR #1274; no district code in bake-disaster-city.js). 22 arch rows + city_pizzeria on P05-04-B2 (face 180 = entrance to plaza, proven). In-game shots /mnt/project-files/disaster-city-hero-plaza/ingame_1..3.jpg. Thread stays open for his review.
- GOTCHAS proven in game: arch row over a roof-route plateau needs `y: 0` (else it stands on the 7 m roof); tool infill rows `dc:in<n>` (same pack sheet) can hide your fronts, drop by place in build(); tint multiplies the sheet so pick a sheet of the right colour (MetalCorrugatedPainted 1a grey, 2a red, 5a blue); shaded faces read near black headless, H.js adds glow 0.16 to textured parts.
- NOT DONE (told mondo): interiors of Training hall + Transit court (solid roof-route blocks), sign lettering (arch row has none), bronze hero figure; shaded brick faces still dark; plan doc still says those two have interiors.
- 11-13 19:10 PR #1302: battle-sheet keys (bricks_3, marble_light, aluminium, gold) draw with darker calm sheets, H.js LIFT sets gain 1.5; glass left dark (mondo likes dark glass).
- 11-13 20:15-20:20 mondo: "one more polish pass on the exteriors ... one or two more layers deep" + "roofs and ac units" + "different textures or decals for different parts". DONE PR #1322 (data.js 31b7d3e9): H.js DET[bid] + kit(a) (plinth, course, frames, pil, pipe, lamp, vent, ac, awning, balcony, rTop, parapet, rAC, rDuct, rHut, panel/door/decal with uv 'fit' on one face). ~2,400 parts. Shots polish_1..3 in the project folder. Notes areas-complexes.md "HERO PLAZA, THE POLISH PASS". Next after his OK: interiors.
- Probe on the LEVELS: view y = plot level x 1.75 (Hero Plaza rows 14, 14, 12.25, 10.5/8.75); restart `node server.js` if localhost:3000 refuses.
