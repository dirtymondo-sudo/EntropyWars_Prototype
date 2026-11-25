---
name: coast-underground-gates-20261122
description: 11-22 coast + underground zone gates (PR #2427): what was fixed, the negative-deep passage trick, what is still open (Agartha mouth)
metadata:
  type: project
  modified: 2026-11-22T18:11:21.269Z
---
Thread "Fix the coast and underground zone entrances" (mondo 2026-11-22: "Every single entrance/exit in the game needs to look good and natural"). Shipped PR #2427, live. Follows [[road-gates-walked-20261122]].

Done: Coast Road (site_ow_r10) north end + the city's port show one causeway from both rooms (docs/areas/routes/R10.js hook, districts/Q.js `edges`); `edges.ways` rows take `spit / w / from`, `edges.roads` rows take `lift / tint / from`; bake-route.js spec `runOn`. Invisible walls fixed: Sewers Gantry Tunnel -> D.U.M.B., Sewers Outfall <-> Sea Floor. D.U.M.B. gantry mouth got a look-only framed panel. Katana east landing tree removed.

**How to apply:** a `free` trail way standing on a rock face cannot be crossed with a positive `passage.deep` (the crossing lies in the rock); a NEGATIVE `deep` puts the crossing in front of the door line (bake-labyrinth.js -0.9, bake-deep.js -0.6). Always run the walk probe both ways; a survey picture does not show an invisible wall.

ROUND 2 (PR #2432, live): the two blank-wall mouths. D.U.M.B.: bake-dumb.js's wall LINING ran across the Gantry Tunnel's opening (now `LINING_CUTS`). Agartha: bake-agartha.js wrote arch rows with `base`, which data.js hqTerrainInfo overwrites with the ground under the row, so all 139 roof blocks stood on their floors (phantom rock walls you walk through); all `aga:` rows use `y` now. RULE: an arch row's height is `y`, never `base`. ROUND 3 (PR #2435, live): the Long Tunnel, the West, the Cavern roofs (up to 30 m too high) and two Astral pieces fixed the same way; Sewers, Tunnel-Way, Hollow were already right.

How to find what covers a gate: a probe view's `eval` with THREE.Raycaster from the walker, print each hit's `_ew_hqArch` + box, run with EW_LIVE_LOG=1. Notes: docs/notes/areas-complexes.md "THE COAST + THE UNDERGROUND, WHERE THE ZONES MEET".

Probe lessons: never edit a served game script while a probe loads (red CODE MISMATCH page in every shot); kill a city walk probe at its WALK line (browser dies loading the city as second room).
