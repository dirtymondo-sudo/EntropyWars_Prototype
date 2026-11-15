---
name: roof-climb-20261101
description: PR #758 (11-01) city building roofs + flat rocks climbable with existing Jump/Climb; dead Enter Building/Take Lift removed; flags
metadata:
  type: project
  modified: 2026-11-01T13:15:39.009Z
---

PR #758 (2026-11-01), merged, zip ENTROPY_WARS_SYNC_20261101-1315.
- mondo asked: buildings on battle maps climbable like terrain (Cyberpunk City arena); Enter Building / Take Lift = dead code, remove.
- Done: city-lot rock cells -> real tiles at lot top (data.js THE ROOFS, hqFieldRoofOf/hqFieldRoofsApply); flat rise masses too. Existing Jump/Climb rules only. Rock squares draw at real top (rockTops). Spawn ripple skips roofs (fieldCellRoof). Kill switch window.EW_HQ_NO_ROOFS.
- Flagged to mondo: non-city "walls"/hall masses (Giza, Olympus, Antarctica, Agartha, North Pole, DUMB, CERN) and trees stay rock; sprite buildings can look taller than the data climb cost. HQ exploration elevator kept.
- Notes: docs/notes/maps-terrain-battle.md "THE ROOFS". Shots /mnt/project-files/roof-climb/.

**Why:** a later thread may get "make Giza/halls climbable too" or "roof height looks wrong".
**How to apply:** extend hqFieldRoofOf rather than adding a new mechanic. [[forced-movement-rules]]
