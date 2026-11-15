---
name: disaster-city-relayout-20261115
description: Disaster City district move + new heights BUILT and LIVE PR #1482 (mondo 11-15); plot ids are names not places, home-frame rule, open highway-column question, his Mac look owed
metadata:
  type: project
  modified: 2026-11-15T19:01:32.433Z
---
Thread (thread in the owner project) "Rearrange Disaster City districts and heights". mondo 11-15 17:33 + 18:17: coast = Entertainment, Bayside, Industrial; Financial off the coast; Southside in the real south; Civic toward the Vatican; heights redone. He tapped "Build it as drawn" 18:25. Follows [[world-zones-plan-20261115]] layout 3.

- LIVE PR #1482 (token 20261115-citymove-01-cors, data.js 810c5568). Blocks (4x4, moved whole, nothing turned, no building removed): built R C F / U H E / I S B, now C F E / U H B / R S I (R Southside, S Sports + Culture). U, H, S did not move. Room id site_prebuilt_downtown_streets kept; PvP Downtown untouched.
- A PLOT ID IS A NAME, NOT A PLACE (P08-04 is still the Casino, it stands at column 8 row 0). `docs/disaster-city/move.js` = where districts stand (`to`), `seams`, `ways`, `frame`. Old notes saying "plot P<x>-<y> covers x -252+42x" hold for the BUILT place only.
- HOME FRAME: the bake shifts the city while a district file's hook runs so its block lies where it was built; district files were NOT edited and district threads just rebake. L.js runs in Bayside's frame. A new hook file with no `frame` entry runs in real city squares (Q.js = the harbour quay).
- Dice replay: `docs/disaster-city/move-seeds.json` freezes the built city's infill/fence dice; only lines the move made get new rolls.
- Heights (levels.js grid is by city place): City Hall 14 top, falls to the sea east and south-east; U, H, S, B, E keep their numbers; Civic +2; Southside -7; Financial 8..12 and Industrial 0..2 new.
- Sea: Bayside's beach/pier/canal on rows 4-7; deep water off rows 0-3; harbour quay off Industrial (cx 144-146, containers, 3 cranes); bay south of columns 8-11 (edges.s.cap).
- Ways out, all CLOSED (fence + ghost wall, barricades on roads) until the zones exist: Vatican gate W row 1 (Dispatch), mountain road N column 8 (Casino), highway S column 3 (Street court).
- OPEN, told mondo: the world plan wants the Desert highway at city column 0 or 1; Southside's only street leaves at column 3. Either the Desert road bends or he OKs cutting a new street.
- Consequences told to him: no ring road any more (four street nets, joined on foot, four bus lines, 18 vehicles); Sports clinic | Container court crossing closed; Townhouse court and Boxing gym crossings are one-square alleys.
- Residents (data.js HQ_CITY_RESIDENTS): `districts` + `beach` written by the bake, `homes` = built blocks, `hqCityPlotAt`.
- Checked offline only (load-data sandbox). NOT seen in game; his Mac look owed. Files: /mnt/project-files/disaster-city-relayout/ (city_relayout_plan.jpg, city_built_map.jpg). Notes: areas-complexes.md "DISASTER CITY, THE DISTRICT MOVE". All nine district threads + shared-pieces + world-map threads told 11-15.
