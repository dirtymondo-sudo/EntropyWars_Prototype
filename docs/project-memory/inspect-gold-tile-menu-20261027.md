---
name: inspect-gold-tile-menu-20261027
description: PR #616 (10-27): tile click menu's Inspect row sits right under Move here/Move towards (top if none) and is a gold button
metadata:
  type: project
  modified: 2026-10-27T10:03:47.480Z
---
mondo 2026-10-27: "move inspect toward the top of the list when i click on a tile, either at the top or right under the move here/towards actions. Also make the inspect button ... yellow or gold."

PR #616 (main 12381b3, token 20261027-inspgold-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-1003.zip hud.js bb4152da). hud.js `_hrlgTileBlades` "THE INSPECT ROW": Inspect spliced after the last move / moveTowards / takeoff-move row, else index 0. Gold = TILE_INSPECT_GOLD #ffc83c as catColor + CSS rule `.hrlg-blade.catc[data-bid^="ta:inspect:"]` (gold name + drop-shadow glow). Not UI Maker-editable (command row colours are fixed CSS). The permanent INSPECT tool row under the vessel card stays teal (#22eebb). Shots /mnt/project-files/inspect-gold/.

Related: [[inspect-one-tile-random-keys-20261023]] [[hud-rules]]
