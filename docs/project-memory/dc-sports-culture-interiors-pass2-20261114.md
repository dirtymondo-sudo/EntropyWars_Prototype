---
name: dc-sports-culture-interiors-pass2-20261114
description: Sports + Culture (Disaster City) interiors SECOND PASS 11-14: S.js inside() atmosphere kit, 18 Meshy models on R2, outer-wall coat offset, manifest --merge gotcha, headless GLB no-draw
metadata:
  type: project
  modified: 2026-11-14T03:21:58.484Z
---
Thread (thread in the owner project) "Deepen Sports + Culture interiors, second pass" (mondo 11-13 22:33 brief). First pass = [[disaster-city-sports-culture-20261113]] PR #1361.

- Code: docs/disaster-city/districts/S.js `inside()` kit new methods: I.doors, edges/runs, coat, band, liner, floorOf, ceilLit, strip, pendant, picLight, onWall(key,u,v,th,y) (mount 0). Each walk-in has a "THE SECOND PASS" block before I.done(). Notes: areas-complexes.md "THE SECOND PASS" under Sports + Culture.
- OUTER WALL OFFSET: a hollow texbuilding's drawn face is 0.06 m inside the row edge, its inside face 0.24 m more = 0.30 m. A coat at 0.26 hid behind it; use 0.33.
- 18 Meshy models live on R2 Assets/world/props/meshy/: greek_amphora, museum_vitrine, gallery_ottoman, painting_landscape/portrait/seascape, arms_trophy, squat_rack, rowing_machine, exercise_bike, medicine_ball_rack, ride_on_mower, ball_cart, line_marker, tackling_sled, ticket_machine, metal_detector, scarf_rack. data.js "THE SPORTS + CULTURE INTERIOR PIECES". Originals/concepts/run.py: project files disaster-city-sports-culture/interiors2/meshy/. Bike/rower/mower came out facing -x: turned 90 deg in prep so fronts are +Z.
- MANIFEST GOTCHA: manifest-assets.js --prefix X --merge drops every other row under X. Add rows to main's manifest by hand.
- LIVE PR #1375 (11-14 ~04:15) + PR #1376 (wall props `floor: true`, Codex: no floor = clamped to the wall top), data.js 8f6fe712, token 20261114-sport2-03-cors. Shots project files disaster-city-sports-culture/interiors2/. Plot-edge hedge at x=0 stood 0.45 m inside the depot: S.js build moves any edge out of the four walk-ins.
- Museum dinosaur: University's dinosaur_skeleton on the plinth; the live dinosaur npcSpot kept, moved to the rotunda square (4,4) looking at it. Antiquity cups -> Financial's marble_bust (in since the merge); the two cups moved to the gym trophy room. mondo chose KEEP BOTH (11-14 09:34): live dinosaur + skeleton stay.
- HEADLESS: every GLB prop (Meshy + pack, even old lockers) never draws in the cloud game browser (also with EW_NO_MEM_BUDGET); the .opt GLBs render fine in a bare three r128 page. Proc props (trophy_case, laundry_cart) + arch parts draw. Facing checked on a model sheet, not in game.
