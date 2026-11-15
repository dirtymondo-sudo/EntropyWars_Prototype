---
name: floor-on-ground-20261030
description: FLOOR AT 0 FLICKER (PR #696, 10-30): editor FLOOR slab on the ground z-fought; plain slabs near ground get polygonOffset -2/-2
metadata:
  type: project
  modified: 2026-10-30T02:52:22.023Z
---

mondo 10-30: "im placing a floor at 0 but its flickering with the ground". BUILD > FLOOR writes a `plain` bridge row; at y 0 its top lay in the ground plane.

- Fix: three-renderer.js `_hqBuildBridges` plain branch — top within 10 cm of hqTerrainHeight at middle/corners → cloned material with polygonOffset -2/-2 (keyMats `<key>|ground`). Nothing moves; slabs off the ground unchanged.
- PR #696, token 20261030-floor0-01-cors, zip ENTROPY_WARS_SYNC_20261030-0252 (three-renderer.js 35a900c9).
- Shot /mnt/project-files/floor-flicker/floor_at_0_before_after.jpg. Notes docs/notes/editor.md "THE FLOOR ON THE GROUND".
- Harness: editor drags need a local `ph drag x0 y0 x1 y1` (added to /tmp/ph copy only, not the shared harness). See [[editor-building-look-20261030]] [[sandbox-playtest-speed]].
