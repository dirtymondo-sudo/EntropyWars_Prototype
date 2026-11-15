---
name: floor-gaps-20261028
description: THE GAPS (10-28): sealed floors behind walls baked into pits (HQ_ROOM_HOLES, bake-holes.js) + editor GAP/FILL GAP tools; calls flagged
metadata:
  type: project
  modified: 2026-10-28T02:58:20.056Z
---

mondo 10-28 (Technoticlan screenshot): enclosed walled-off areas should be gaps in the floor, and the map editor should cut holes so he can build dungeon maps with rooms + hallways.

- A gap = a whole battle square. `terrain.holes` (editor, wins even when `[]`) or data.js `HQ_ROOM_HOLES` (baked by `node bake-holes.js`). Reuses THE VOID (walker can't stand, `_hqVoidReturn`) and in battle the existing `cloud_gap` (Open Sky) only on formerly walkable cells.
- Baked 24,894 squares in 29 rooms (plan/halls/ley mass, garage corners outside the round wall, etc.). Skipped: city, trees look, thicket, sea, float, real-void rooms. bake-holes.js checks every arena cut; all unchanged.
- Editor: LAYOUT tab GAP / FILL GAP (drag squares, right-click one), "GAP THE SEALED SQUARES", "FILL EVERY GAP".
- Calls flagged to mondo: pits 6 m deep, black, fog off; rock/wall battle cells unchanged; voxel maps not included.
- Notes: docs/notes/editor.md "THE GAPS". Shots: /mnt/project-files/floor-gaps/. See [[editor-plan]].
