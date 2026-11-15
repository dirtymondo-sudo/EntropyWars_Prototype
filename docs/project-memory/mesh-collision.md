---
name: mesh-collision
description: Real collision from model triangles + texbuilding on flat ground + downtown roofs (PR #142, 2026-10-06)
metadata:
  type: project
  modified: 2026-10-06T20:45:07.025Z
---
PR #142 merged 2026-10-06; zip at /mnt/project-files/collision/ENTROPY_WARS_COLLISION.zip (data.js, three-renderer.js, editor.js).
- three-renderer.js HQ_MC/_mcFor/_mcFeet: every placed GLB/proc prop gets a column-span collider built from its triangles (cached per model, time-sliced). Kill-switch window.EW_HQ_NO_MESH_COLLISION.
- data.js info.exact (_hqTExactList/_hqTExactTop): ramps/decks/bld tiers read exactly, not via 0.5 m heightfield.
- Editor texbuilding = ghost walls + hidden roof bridge on existing ground; never a plateau. Plateaus tagged `bld:{style}` draw as textured buildings (Cyberpunk stacks, Downtown, Strip).
- Not done: parking/valet/skyway decks, fire-escape landings, camera vs meshes.
**Why:** mondo angry that buildings raised terrain, stairs dropped him, roofs missing.
**How to apply:** new placed objects get mesh collision automatically; never reintroduce terrain plateaus under buildings.
