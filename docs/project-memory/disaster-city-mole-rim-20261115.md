---
name: disaster-city-mole-rim-20261115
description: Disaster City "wall by the lighthouse" (11-15) = a 5 m rim of ground along the breakwater's north side where two sink cuts only touched; fixed PR #1403; offline fin scan recipe
metadata:
  type: project
  modified: 2026-11-15T08:45:29.501Z
---
Thread (thread in the owner project) "Remove stray wall by the lighthouse". mondo 11-15 08:40: a wall / raised curb by the lighthouse. LIVE PR #1403 (data.js 2d7acdce, token 20261115-mole-01-cors). Fixed and checked offline only (no browser run); his Mac look owed.

- Cause: NOT kerbs ([[disaster-city-phantom-walls-20261113]]), not the sea wall, not the canal. districts/B.js `beach()` had two `sink` plateaus sharing the edge z = Z0 (84): the level-0 beach cut and the deep bay cut. A sink cuts only strictly inside its rectangle (`din <= 0` skips) and the height grid (res 0.875) has a sample row exactly on z 84, so a rim at the city's level (5.25 m) stood from x 252 to 311.
- Fix: level-0 cut starts at Z0 - 0.5 (overlap). RULE: sink rectangles that share an edge must overlap.
- **How to apply:** a thin tall ground wall in the city = scan the height field offline first: load-data.js sandbox, `hqTerrainInfo(room)` + `hqTerrainHeight(info, x, z)` over nx x nz, list samples > 1 m above both neighbours at 1-2 samples. After the fix the only hits are stairs / ramps (roof flights RF32/33/67/80, overpass stair, parking deck ramp). Takes seconds, no browser.
Related [[disaster-city-bayside-20261113]] [[disaster-city-old-pieces-20261115]]
