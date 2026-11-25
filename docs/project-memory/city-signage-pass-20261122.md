---
name: city-signage-pass-20261122
description: Disaster City SIGNAGE PASS (PR #2375, live 11-22, (thread in the owner project)): planner rules for adverts + the city-wide sign check; what is unverified
metadata:
  type: project
  modified: 2026-11-22T12:20:07.875Z
---
mondo 11-22: "Why does this one building have icarus aerospace, hotdogs, and burgers?? And the signs are clipping into stuff ... think like an actual city planner". Cause: billboards.js dealt the 12 adverts onto every open wall of Entertainment + Bayside (55 boards + 218 posters) on bounding boxes, over the shops' own names.

- LIVE PR #2375 (data.js a25f3594, token 20261122-signage-01-cors). Now 16 boards (6 roof, 10 wall) + 46 posters.
- RULES (docs/disaster-city/billboards.js header, notes docs/notes/branding.md "THE SIGNAGE PASS"): a face with the building's own sign or doorway takes NO advert; adverts only on a blank wall (wall behind every part, no glass/door/sign, 2.5 m clear air, no tree/prop); one upper board + one poster pair a building at most; roof boards only over a street or open ground; a chain's own building advertises itself; food places take no other food advert; twins far apart.
- THE SIGN CHECK (docs/disaster-city/sign-check.js, run at the end of bake-disaster-city.js over all districts, no district file edited): moves a sign sunk in a wall out to the face (97), removes a smaller lettering under a larger one (cinema fin, 5), lists what it could not fix in docs/disaster-city/sign-check.txt (9: FIRE STATION, COURTHOUSE behind columns, museum TICKETS, stadium kiosk copies). Those 9 are for the district threads.
- NOT SEEN on screen: the POLICE sign move, Sports "T" blade, a few adverts (camera inside a building). He has not said the result is OK yet. Offered, not built: more billboards on Hero Plaza / along roads.
- PROBE LESSON: the whole city with models OOMs the cloud browser (14 GB). Works with `playtest_city.js --nogltf --flags=EW_HQ_NO_SURVEY,EW_HQ_NO_ENCOUNTER,EW_NO_FLORA,EW_HQ_NO_RESIDENTS,EW_NO_HQ_GRASS,EW_NO_GRASS_FIELD,EW_NO_ANIMALS` (ready in ~1 min; model props do not show). Pictures /mnt/project-files/city-signage/.
- Arch quad facing: front = local +z, one-sided; ry 0 looks +z, 180 -z, 270 +x, 90 -x. Related [[city-sign-fonts-20261115]].
