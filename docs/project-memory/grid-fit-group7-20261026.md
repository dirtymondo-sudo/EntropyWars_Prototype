---
name: grid-fit-group7-20261026
description: GRID FIT Group 7 (PR #541, 10-26): ~80 building/box rooms' cover props moved onto battle square centres; TURNED RECT rule fix; calls flagged
metadata:
  type: project
  modified: 2026-10-26T09:12:05.706Z
---
PR #541 merged 2026-10-26 (token 20261026-gridfit7-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-0911.zip = data.js only).
mondo's grid-fit ask ("redesign the maps with the square grid in mind"), Group 7 = box rooms. Only cover props (the ones hqFieldBoxInfo counts) were moved, with what sits on/at them (tabletop items, chairs, NPC/agent/online spots). Result on the battle's own feet rule: covers blocking exactly their squares 95→164 of 186; centred 36→160.
Calls flagged to mondo: (1) THE TURNED RECT in hqFieldBoxInfo: a quarter-turned prop's catalogue rect now swaps hw/hd so it blocks the squares it is drawn on (it read unturned before) = a reading fix of an existing rule; (2) ~900 of the audit's ~1100 "floor props" (tabletop, rugs, small scenery) deliberately NOT snapped; (3) stairwell treads left alone; (4) chapel pews hand-laid; (5) people/desk prompts move with their furniture.
Tools + plans + before/after shots: /mnt/project-files/grid-fit/group7/ (fit2.js, overrides.json, shots/). Notes: docs/notes/hq-building-rooms.md "GRID FIT".
**Why:** later grid-fit or room threads should reuse fit2.js/overrides instead of re-measuring.
**How to apply:** after moving a box-room cover, rerun measure.js; keep x/z on lattice centres (x0/z0 + (i+0.5)*1.75).
