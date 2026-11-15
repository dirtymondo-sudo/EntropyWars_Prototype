---
name: tiles-touch-20261111
description: PR #1117 (11-11) UI Maker tile highlight Size can make tiles touch; where the 8% gap came from and what is not covered
metadata:
  type: project
---
mondo 2026-11-11: tile highlights never touched whatever he set in UI Maker "Arrows + tiles" ([[ui-maker]]).

- Cause: every highlight plate is a mesh 0.92 of its square (three-renderer.js _makeHlTile / _getSharedHlGeo); tSize only drew the frame inside the mesh, so past 1 it cropped the outline.
- Fix PR #1117 (token 20261111-tilestouch-01-cors): tSize past 1 grows the plate (cover = 0.92 + size - 1). 1 = the game, 1.08 = touching (his saved value, so no change needed on his side), max 1.12 overlaps with a brighter seam. Code: _hlCover / _hlFit / _hlRefit.
- Covers move, attack, spell reach + footprint, previews, cursor, underfoot, acting tile, cast glow, dock preview board. NOT the spawn / nexus zones (own look).
- Proof /mnt/project-files/tiles-touch-20261111/ (WebGL2, flat + raised blocks). WebGPU not checked. Awaiting his look.
