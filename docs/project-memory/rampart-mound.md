---
name: rampart-mound
description: Rampart on field arenas = raised dirt mound, not a cube (PR #307, 2026-10-18); voxel boards keep the cube
metadata:
  type: project
  modified: 2026-10-18T09:07:27.111Z
---
PR #307 merged 2026-10-18, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0907.zip, token 20261018-mound-01-cors.
- mondo: Rampart on non-voxel maps should raise the ground like the editor's RAISE brush, with dirt sides.
- data.js rampart `terrainDeform.mound: true` → battle.js records `state.moundTiles`; three-renderer.js `_fieldMoundBuild` draws dirt_2 banks + room-floor crest on true-ground field arenas. Rules unchanged (+2 levels, jump-only, LOS).
- Training Room, Holo Sim and every Δ / moving tile board keep the cube (his own assumption, confirmed).
- **How to apply:** if he wants other raise spells (Earthquake mountains, Snow Fort) as mounds, add `mound: true` to their terrainDeform. Proof shots in /mnt/project-files/rampart-mound/.
