---
name: voxel-boards-out-20261111
description: mondo 11-11 "get rid of all the voxel maps": the 9 "voxel" boards (PR #1140) and the 35 big site boards (PR #1143) are out of every map list; Gauntlet plays the 12x12 maps
metadata:
  type: project
  modified: 2026-11-11T23:04:49.833Z
---

mondo 2026-11-11: "I think we are good to get rid of all the voxel maps", then about the 35 old big site boards: "yes those should go too". This overturns his 2026-10-20 "Dont delete these voxel maps".

- PR #1140: the 9 boards labelled "voxel" are no longer registered (five "<Site> Δ · voxel", Holo Sim / Training Room / Fairy Forest "· voxel", Clash's "Temple · voxel").
- PR #1143 (?v=20261111-nobig-01-cors): the 35 old site boards (16x16 to 24x24) are no longer OFFERED anywhere (match select, mode map lists, next-match reroll, setup select, lab pool). Their roster rows, GAME_MODES entries and board data STAND because the HQ, hqSiteId and the arenas (tints, layouts) read the site ids. Do not delete those rows.
- Still listed with ARENA MAPS off: Fairy Forest 20x20 (a room cut, not voxel) and Custom Map 20x20 (the voxel editor's board). Voxel editor untouched. His call if those two go.
- GAUNTLET played only the big boards. It now takes the same maps as the other modes (deploy 4 fits the 12x12 4v4 maps); no rule changed. Checked: a Gauntlet on Stonehenge 12x12 reaches battle with 4 deployed + 4 reserves a side. Not played through.

**How to apply:** never re-add voxel or big site boards to a list. Headless (swiftshader) screenshots of an arena battle right after launch show the camera under the board for both Arena and Gauntlet, so they are no proof of the board view. Proof shots: /mnt/project-files/voxel-maps-out-20261111/. Thread (thread in the owner project).
