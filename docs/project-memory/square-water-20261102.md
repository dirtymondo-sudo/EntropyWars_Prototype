---
name: square-water-20261102
description: Natural room water (ponds/streams) snaps to 3.5 m squares and fades like spell water (PR #791, 11-02); rules, exclusions, flags
metadata:
  type: project
  modified: 2026-11-02T03:41:23.271Z
---
PR #791 + pass 2 PR #795 + pass 3 PR #796 + sunk PR #797 (2026-11-02), asked by mondo: natural pools/streams look + behave like spell/rain water on tiles.
- data.js HQ_FLUID_GRID_RULES + hqFluidGrid / hqFluidGridDin: pool square = outline grown by its WHOLE bank (pass 2; bank/2 gave plus-shaped ponds) covers >= half OR centre inside; stream = round(w/3.5) squares wide along authored centreline. Pass 3 (mondo: serrated edges = terrain deformation): ground in the squares eases to y-0.1 across the 1.4 m shore window (smooth), bank starts past it (deep water: at the edge); renderer LAYS the sheet on ground up to HQ_FLUID_GRID_RULES.layH 0.2 m over the surface (0.5 drew water over footbridges); 24 verts/side on shore squares; wet read uses layH too. hqTerrainFluidAt reads the same squares.
- three-renderer.js _hqGridWaterBuild draws the _liqBlendGeo-style vertex-alpha sheet (shore + deep) on the square union; EW_HQ_WATER_STEPS=true = old sheet.
- Skipped: sea/Atlantis (swim water), lava (skipKeys, offered to mondo), caves, voxel delta boards (already tile boxes).
- Arena picks re-read in place; Bohemian Grove 12x12 re-baked one square west; Hollow Earth 9x9 re-baked 14,18 -> 16,17. After any pool/stream edit, re-check arena picks of that room.
- Flagged: Haunted Grounds pond rail (arc r 9.875) now crosses the corners of the 5x5 pond; offered to move it.
Notes: docs/notes/maps-terrain-battle.md "THE SQUARE WATER". Related [[element-terrain]] [[new-maps-voxel-remakes]].
- SUNK SURFACE (PR #797, mondo asked; PR #798 0.3 -> 0.5 m, mondo said "a little bigger"): HQ_FLUID_GRID_RULES.inset 0.5 m (started at voxel WATER_TOP_INSET 0.18 x 1.75 m tile = 0.3); Hollow Earth 12 -> 18,18, 9 -> 17,17 re-cut; fluidY(f) sinks surface+rim+bed, depth unchanged; offered to change the amount.
