---
name: stairs-pack
description: Stairs pack pass 2026-10-05 (PR #123 engine): pack flights/railings/escalators fitted by slice-repeat; room redesign batches pending
metadata:
  type: project
  modified: 2026-10-05T09:01:55.127Z
---
mondo (2026-10-05) asked for the R2 stairs pack (Assets/stairs/stairs_railings.glb, Assets/stairs/stairs.glb) + metro stairs everywhere man-made (and wooden stairs in the Woods), more verticality (whole upper sections reached by stairs or gap jumps), railings down slopes, curved, across gaps, all grindable incl. down stairs and escalators. No procedural stairs.

**Batch 1 merged, PR #123:** data.js HQ_STAIR_PACK / HQ_STAIR_KINDS / HQ_STAIR_RULES; three-renderer.js `_sp*` fitting; every stair ramp is now a pack flight over a sunk wedge; every rail row is a pack railing (model-less rows default balusters_b, grind-only); mall escalators are the pack's. Zip: /mnt/project-files/stairs/ENTROPY_WARS_STAIRS_PACK.zip.

**Batch 2 merged, PR #124** (token 20261005-stairs-02-cors): all urban/man-made rooms (mall, strip, downtown, cyberpunk, harbour trap fixed, stadium, garage, Area 51, Antarctica, derelict, Revenge, D.U.M.B., sewers, tunnels, cells, workings, CERN). Zip /mnt/project-files/stairs/ENTROPY_WARS_STAIRS_URBAN.zip. **Batch 3 merged, PR #125** (token 20261005-stairs-03-cors): Vatican, Camelot, lodge, Atlantis temple, Giza, Babel, Göbekli, Stonehenge, temple/crystal city, Olympus, North Pole, haunted, Looking Glass library, Hollow Earth, Mars, Moon, all Woods rooms + woodstair. Zip ENTROPY_WARS_STAIRS_REST.zip. Pass COMPLETE. **Editor PR #126** (token 20261005-stairs-04-cors): BUILD ESCALATOR / RAILING / CURVED RAILING tools, stair railing options + centre handrail, ADD skate/gap rail + escalator, inspector lists; zip ENTROPY_WARS_STAIRS_EDITOR.zip. Gotcha: redesigns can kill a site's PvP arena window; rerun bake-arenas.js and keep 30/34 sites fitting (temple city plaza + haunted plot kept clear for it).

**Why:** remaining batches are room redesigns (urban first, then HQ, then Woods with the `forest` kind, no doors in the Woods).
**How to apply:** the running list of rooms done is in docs/notes/areas-complexes.md "STAIRS PASS". Engine notes are in docs/notes/models-assets.md "THE STAIRS PACK". Ornate railings are heavy (2-3k tris/m), so prefer light models. Related: [[editor-creative]]
