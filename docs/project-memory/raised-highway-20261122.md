---
name: raised-highway-20261122
description: Raised highways: Badlands Highway (site_ow_r9) = THE STANDARD (approved 11-22); Desert legs raised PR #2448 (DH1 exit) + #2449 (DH2-4 flyovers); R1 + R4 stay on the ground; highway signs PR #2451; kit ow-raised.js
metadata:
  type: project
  modified: 2026-11-22T13:33:11.661Z
---
Thread (owner-project id) "highway system / roads" (mondo 11-22).

mondo 11-22: "I want actual highway architecture, raised off the ground with exits and stuff. Right now it looks like the road is just painted on the ground ... Start with the badland highway and then we will do the rest of the highways."
His OK on plan + mock-ups (/mnt/project-files/badlands-highway/): "Yeah that looks good, just make sure the exit ramp actually branches off from the highway ... make sure the road doesnt abruptly stop at teh edge of the map, need to see the road continue beyond it".
Picks that stood (he did not object): deck on pillars the whole middle, 7 m high, comes down to the ground before each end.

SHIPPED PR #2388 (11-22): `site_ow_r9` raised, 24 plots, exit with gas station + motel, cross road under the deck that runs on past both map edges (leads to no zone). Kit = `ow-raised.js`, switched on by `raised` in a route spec (`docs/areas/routes/<id>.json`), then `node bake-route.js <id>` + `node bake-map.js site_ow_<id>`. Notes: docs/notes/areas-complexes.md "THE RAISED HIGHWAY".

POLISH PASS PR #2392: his complaints fixed: mitred lane lines on bends; barrier gap caught skateboard; exit ramp rebuilt realistic (taper, dotted exit lane, gore + chevrons); RULE: use the city's own lamps (`terrain.gen.lamps`), never box lamps; deck jump momentum bug fixed. He allows making the highway bigger for realism.

PR #2393 (11-22): after "yeah almost there, gonna need a some stop lights at the end of the ext where it meets the road, thats an intersection Also let's add police officers to the highway too along with trucker and sedan": the city's traffic signals at both exit crossings (`terrain.signals`), Police Officer x2 on HQ_NPC_PLACES.site_ow_r9 (only r9; other roads not asked).

PR #2397: roadside (power_pole wires, city adverts, mile markers, EXIT plates, joints); he said "This should be the standard for how the rest of the highways get built".

THE STANDARD: docs/notes/areas-complexes.md "THE HIGHWAY STANDARD" (8 points). He has APPROVED the Badlands Highway ("yep looks good") before the roadside pass; the roadside pass itself waits his look. GO GIVEN 11-22 ("yes" to raising the others, Desert legs first). DONE: DH1 (site_ow_dh1) PR #2448: full exit + gas station + caravan stop, kit now raises east-west roads (`axis: 'x'`). DH2, DH3, DH4 DONE PR #2449 as FLYOVERS (ramps + short deck over a road that runs on; their straights are ~30 squares, an exit needs ~64; told to mondo, no answer yet). R1 River Road and R4 The Old Road STAY ON THE GROUND (mondo 11-22: "don't worry about those other roads"). R6/R7/R8/R10/R11 are look `road`, not highways.

HIGHWAY SIGNS PR #2451 (11-22), his words: "use highway gothic, clearview, or another similar font. Give the signs a white border that is inset so that green still appears as the outside edge of the sign. Round the corners of the sign. Add exit numbers, with disaster city being exit 1. Basically try to make them look more realistic." Built: renderer sign style `h` + font `hwy` (Overpass), south-kit.js `gantry`; exits renumbered PR #2455 after "you cant just go 1 and then 1a": 1A Disaster City, 1B Badlands gas, 2A Circus, 2B Desert gas, 3 Western Town, 4 Area 51, 5 Giza; Desert gate road signs (bake-desert.js) same panel. Waits his look.

11-22 mondo on raising legs 2-4 fully: "i just want it to be realistic and believable" -> kept at grade + flyovers (real desert interstates); added concrete median barrier on ground stretches of every `raised` route, PR #2457.

**How to apply:** a road that leaves any room uses `terrain.edges.roads`; cars on a deck need `deck: true` (the deck is the bridge layer, not the height field).
