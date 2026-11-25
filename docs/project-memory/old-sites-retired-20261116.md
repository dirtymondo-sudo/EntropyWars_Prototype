---
name: old-sites-retired-20261116
description: PR #1876 (11-16) retired every old room a plot-built area replaced (stadium, Strip, Lodge, Grove, old garden, glade, old Downtown); what was kept and why
metadata:
  type: project
  modified: 2026-11-16T13:34:59.927Z
---
Thread (owner-project id) (mondo 11-16: "remove all of the old sites from the game, if we already rebuilt them with plots").

LIVE PR #1876, data.js 4688e56d, token 20261116-oldsites-02-cors. Notes: areas-complexes.md "THE OLD SITES RETIRED"; claims.md row (freed).
- Retired into DOOR_HQ.retired: stadium bowl, Strip (chapel+casino deleted), Lodge -> city (Sports+Culture / Entertainment / Financial Members club); Grove -> Woods G; old Looking-Glass garden + old Fairy Forest glade -> Camelot; old Downtown streets -> city.
- HQ bay doors for those sites now stand in the new rooms (ids bay_stadium/bay_strip/bay_lodge in the city, bay_grove in the Woods, Looking-Glass bay -> Astral Waiting Room west wall). Written by bake-disaster-city.js JOINs / bake-woods.js.
- Deleted literals: old Woods' 4 rooms, Camelot keep + dungeon, Strip chapel + casino. KEPT door-less: PvP board source rooms (HQ_ARENA_RULES) and old rooms other zone bakes read (OLDR lines/anchors in bake-cavern/-afterlife/-sewers/-dumb/-astral/-deep/-beach/-desert/-leylines) — deleting those breaks the second account's tools.
- Left as old on purpose (no plot replacement): Cyberpunk City, Camelot sky castle, city insides (lobby/mall/showroom/platform/closet), Bermuda Island board.
- Check tool: walk every door from central_egress via load-data.js (action.room, site_ alias via siteRooms.entry); only known bad door = HQ records#tapes (pre-existing).
- LESSON: bake-disaster-city/woods/camelot reruns are deterministic on main; rerun them after a main merge conflict in their blocks instead of hand-merging. playtest_city.js view at a door's exact x,z puts the camera inside the door box (black frame) — stand 6+ m away.
