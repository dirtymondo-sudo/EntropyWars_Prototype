---
name: dc-civic-interiors-pass2-20261115
description: Civic Center (Disaster City) interiors SECOND PASS LIVE PR #1399 (11-15): LOOK/SECOND kit in C.js, 24 Meshy pieces, the face-convention bug + wall/walk fixes
metadata:
  type: project
---
Thread (thread in the owner project). First pass = [[disaster-city-civic-interiors-20261115]] PR #1397.

- LIVE PR #1399 merged 11-15 ~02:30, data.js 7637c9b0 + ASSET_MANIFEST 232d9311 on R2, token 20261115-civic2-02-cors. Waits mondo's Mac look (headless never draws Meshy GLBs; no in-game shots taken, proof = plan sheet + fronts sheet in project files disaster-city-civic/interiors2/).
- Code: C.js "THE SECOND PASS": LOOK[key] feeds A.line (lit lining glow/gain, ceiling deck glow+roof, lower H, floor, dado); SECOND[key](A, K) with kit() (sheet/coat/band/liner/coffers/panel/strip/pend/sconce/win/pilaster/rug/sign/P/hang). toArch: `t:'raw'` parts, gain/roof on boxes.
- BUG FOUND: C.js FS/FW/FN/FE were 0/90/180/270 ("0 = south") but prop face is a heading (0 = +Z front to north) -> all first-pass props were backwards. Now 180/270/0/90. Other districts may have the same (Hero Plaza fixed theirs).
- Wall pieces at dx 1.66 stood behind the lining (17 cm in); put() snaps WALLD/BACKD keys to the wall.
- Walk check (scratch conn.py in project files): Time Bureau desk+clock moved east, Military map table a row south, Permit corner planters made dressing (whole hall was shut). Dead squares left: City Hall (6,0), Council (0,1).
- Swaps: Court exec_desk->judges_bench, lectern->witness_stand; Military conference_table->map_table.
- 24 Meshy keys listed in project files meshy/interior-claims.md (Civic section).
- 11-15 16:09 his fronts-sheet review -> PR #1454 LIVE (data.js aa882b4d, token civic2-03): brochure_rack, city_scale_model, astronomical_clock regenerated (LESSON: no clear glass/acrylic in Meshy prompts, wall pieces need a straight-on 'suf'); Records uses existing crt_terminal instead of microfiche_reader (he: reuse computers/TVs we have). Sheet interiors2/meshy_regen_sheet.jpg.
