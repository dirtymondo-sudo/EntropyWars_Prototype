---
name: npc-board-rule-off-table-rooms-20261122
description: Why off-theme units appeared (rooms not on HQ_NPC_PLACES drew random pools) and the rule that fixed it, PR #2376
metadata:
  type: project
  modified: 2026-11-22T12:41:24.853Z
---
mondo 11-22: met a Dragon + Deep Sea Fish on the road from Disaster City to the Desert ("i definitely did not have a dragon or deep sea fish in the desert"). He thought the associate account built the zone NPC placement from his Relationship Web; in fact an OWNER-side thread built it 11-20 (commit fbebe7b, data.js `HQ_NPC_PLACES`, live).

Cause: the Badlands Highway (`site_ow_r9`) was not on the table and drew 4 random walkers a day from the old Giza AREA UNITS table (far races at weight 1).

Fix, PR #2376 (live): `site_ow_r9` got the Highway's Trucker + Honda Civic rows; data.js `hqBoardRaces` = a room with a site that is NOT on the table draws random extras only from the board's races of the table rooms its doors lead to, and only its own natives; a road `site_ow_*` with no rows draws NOBODY.

**How to apply:** a road or room that should have people needs rows on `HQ_NPC_PLACES` (units for roads not on his board need his approval first: his 11-20 rule "make a list so I can approve"). 11-22 he said "well obviously put the trucker and honda civic on those roads too": PR #2377 put them on the six drivable roads (r1, r4, r6, r8, r10, r11); the six footpaths (r3, r5, r12, l3, l4, l6) stay empty unless he says otherwise. Notes: docs/notes/npc-system.md "A ROOM OFF THE TABLE".
