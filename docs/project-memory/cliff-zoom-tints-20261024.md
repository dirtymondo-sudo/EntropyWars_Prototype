---
name: cliff-zoom-tints-20261024
description: PR #482 (10-24): terrain sheets one per battle square everywhere in rooms; editor cliffZoom + floor/cliff/path tints + stair side/sideZoom/sideTint
metadata:
  type: project
  modified: 2026-10-24T11:41:24.992Z
---
mondo (10-24): one 1.75 m battle square = one 128x128 terrain sprite, keep pixel density everywhere; Area 51 stair sides in Dirt 2 were zoomed/blurry.

PR #482 + fix #483 merged (token 20261024-cliffzoom-02-cors, zip ENTROPY_WARS_SYNC_20261024-1144; #483: stair sideZoom 1 / white sideTint stay explicit, empty = room's):
- Cause: room boxes/stair wedges/stairs-pack used HZ_TEX_DENSITY 0.5 (horizon density, 1 sheet per 2 squares). Now _nrBoxUV / U/TM everywhere in terrain rooms, caves, passages. Field shader cliff 0.85 and path 1.15 scales set to 1 (thread's call, flagged).
- New, off by default: terrain.cliffZoom (squares per sheet), floorTint/cliffTint/pathTint ('#rrggbb', multiplied); stairs ramp row side/sideZoom/sideTint. Editor THE GROUND + stairs row fields. WebGPU node matches.
- Not changed (asked?): DOOR HQ hall's own wall/floor sheets (2.2-3.2 m repeats), horizon scenery, linear texture filtering of room sheets.
Notes: docs/notes/editor.md "THE SHEET LOOKS". Shots: /mnt/project-files/cliff-textures/. Related [[visual-rules]] [[editor-creative]]
