---
name: zone-gates-forest-kingdom-20261122
description: Zone gates share for Fairy Forest / Came A Lot / Estate / Woods' other exits: PR #2431 live, 28 gates walked both ways, Old Road taper PR #2434
metadata:
  type: project
  modified: 2026-11-22T18:31:05.008Z
---
Thread (owner-project id) (mondo 2026-11-22: "Every single entrance/exit in the game needs to look good and natural"). See [[road-gates-walked-20261122]] for his gate rules.

Shipped PR #2431 (live on R2): every `trail` gate in a room with land past its line now runs its path on for 150 m in its own ground, keeps its wood beside the path, has a wooden signpost, no dark cards. Notes: docs/notes/areas-complexes.md "THE PATH RUNS ON TOO".

Found only by WALKING (looks were fine): the Estate's Lake farm gate and House Trail iron leaf stood shut; the Ranch's fence lay across the graveyard's back gate (ow-move.js gives a fence on a plot line to the west / north plot); the Redwood Trail's north gate had one closed square with a tree behind the door's middle (bake-woods.js now opens the door's own column).

OLD ROAD DONE (PR #2434, live): `taper` on both road ends of site_ow_r4 (two lanes at Came A Lot and the Vatican), walked both ways. The R4 rebake drift was only the map's changes since 11-17 (snow corner by the Snowy Pines, joined lane lines, spawn); no prop moved.

EAST ROW GATE (PR #2441, live): mondo 11-22 "build a fifth gate and a bridge at some point this old road needs to transition to a dirt road, makes no sense to have a modern road leading to camelot". Came A Lot has FIVE gates now (east side: East Gate + East Row gate where the Old Road arrives, own bridge); the Old Road narrows to two lanes then turns to dirt 77 m before the gate (bake-route.js taper row `dirt`). RULE (his): no modern paved road leads into Came A Lot.

**How to apply:** probe tips: one out-and-back pair per `playtest_city.js` run with `EW_PROBE_TRIES=1`, walk `max` 110000 (the walker is slow in big rooms); never two probes at once.
