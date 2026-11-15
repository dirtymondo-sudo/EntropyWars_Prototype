---
name: rebuilt-area-continue-rule
description: When an area/room is rebuilt, a save's CONTINUE must land in the new room; retire old rooms via DOOR_HQ.retired in the same PR
metadata:
  type: feedback
  modified: 2026-11-15T17:55:16.405Z
---
mondo 2026-11-15 (Camelot Kingdom thread), furious: the new kingdom shipped but CONTINUE kept opening the old Camelot because his save stood in the old room. "did you not think i was gonna press continue? you expect me to just make a new profile ... every single time you add a new area?" and "just delete the old fucking camelot. we are making new maps. no reason why the old one should still be loading at all."

**Why:** he always plays through CONTINUE on his existing profile; the save stores the room id (map.js `_hqSaveRead`), and the map's GO only travels to rooms the save has stood in. A new room id is invisible to both.

**How to apply:** any PR that replaces a room/area must, in the same PR, (1) add every replaced room to data.js `DOOR_HQ.retired` (old id -> new id; map.js `_hqEnter` / `_hqGoRoom` redirect, PR #1468), (2) delete the old rooms or strip their doors (keep one only if a PvP board is cut from it), (3) check Continue + map GO + doors offline before saying it is live. Never tell him to reload/new-profile as the fix. Applies to the Woods and every later plot-built area. See [[camelot-kingdom-plots-20261115]].

UPDATE 11-15 17:58, mondo: "we are supposed to be basing these new redesigned zones after disaster city, i never had this problem with disaster city and we didnt have to delete the old one for it to work". Disaster City worked because the NEW room took the OLD room's id (`site_prebuilt_downtown_streets`; old renamed `_oldstreets`). PREFERRED METHOD for every rebuilt area: reuse the old entry room's id for the new room and rename the old one; `DOOR_HQ.retired` is the fallback only. Also 11-15 17:43-17:58: Render deploy hung again after PR #1467/#1468 (page stayed on the 17:43 build); only he can cancel the hung "Building" row.
