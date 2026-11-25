---
name: sewers-one-world-20261117
description: The Sewers One World move (PR #1945, 11-17): four rooms under the city, turned tunnels, what is left for phase 4.4
metadata:
  type: project
  modified: 2026-11-17T09:41:49.364Z
---
PR #1945 (2026-11-17), (thread in the owner project). mondo chose SPREAD over one maze room ("sewers are literally tunnels").
- bake-sewers.js writes 4 rooms (under layer): `site_prebuilt_downtown_underworld` (3,4) Works + Running Tunnels (turned 270, N-S column) + Outfall; `…_ow_cells` (1,1); `…_ow_workings` (1,10); `…_ow_drain` (10,1). Parted pieces joined by doors with one id at both ends.
- ow-move.js now takes `turn: 90|180|270` (clockwise) per plot entry.
- Hub `underworld` lists its rooms explicitly (`hubs.underworld.rooms`) since they share site prebuilt_downtown.
- Known gaps for phase 4.4 (U-walks): the well at the Junction is a dead end, Culverts P04-02 hatch port is a stub. Sewers claims rows FREED.
**Why:** later zone moves / walk threads need to know the Sewers are no longer one room.
**How to apply:** before phase 4.4 work, read areas-complexes.md "ONE WORLD, THE SEWERS SPREAD UNDER THE CITY".
