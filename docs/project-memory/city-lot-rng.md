---
name: city-lot-rng
description: City rooms (gen.kind 'city') lay every building from one seeded RNG; small terrain edits can re-lay a whole city
metadata:
  type: project
  modified: 2026-10-26T10:09:18.208Z
---
Found 2026-10-26 (grid fit group 5, PR #550): city rooms (Downtown / Strip / Cyberpunk streets, `gen.kind: 'city'`) lay lots along street faces with ONE global seeded rnd(). Any edit that changes whether one lot fits (a path, ramp, rail, plateau edge near a lot) shifts the RNG and re-lays buildings citywide: moving Downtown's parking deck + car ramp onto the squares re-laid ~170 of 211 buildings.

**Why:** mondo never wants content he didn't name to change; a re-laid city is a different map.
**How to apply:** after any city-room edit, diff `hqTerrainInfo(id).lots` against origin/main (load-data.js). If lots change, revert that piece or ask mondo. mondo's call 10-26 (decision card): "Fit them, re-lay the city" — so grid fit beats keeping the old skyline; PR #554 re-laid Downtown (207 buildings, was 211) and re-baked its arenas. Still diff lots to report the change. Related: [[new-maps-voxel-remakes]].
