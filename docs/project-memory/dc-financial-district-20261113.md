---
name: dc-financial-district-20261113
description: Disaster City FINANCIAL district: F.js buildings, F-detail/F-inside/F-london files, London look, shot method
metadata:
  type: project
  modified: 2026-11-15T12:57:48.884Z
---
Thread "Design Financial district buildings". Plots P08-00..P11-03 (district F, x >= 84, z <= -84). Related [[disaster-city-144-20261113]].

- CODE: `docs/disaster-city/districts/F.js` (tailor/apply/build hook of bake-disaster-city.js) + `F-detail.js` (trims, letters, roofs), `F-inside.js` (interiors, `furnish(T)`; another thread hooked `atmos` from F-atmos.js), `F-london.js` (street things). Rerun `node bake-disaster-city.js`; never hand-edit data.js between DC144 markers. Notes: docs/notes/areas-complexes.md.
- Method: each building keeps its collision row + ONE `arch` row (front = +z); `frame(id,o)` resizes the row; `frontWithDoor` cuts the doorway. Hotel = frame inside:true.
- SHIPPED: buildings PR #1295, exterior polish PR #1334, interiors PR #1358, bedrooms PR #1369 (terrace homes, Politician room in hotel, Halfdemon royal_bed in Penthouse stair).
- LONDON (11-15, real-cities plan /mnt/project-files/disaster-city-real-cities/, mondo "Build it as drawn" 12:32 = Financial is London): clock tower on bank offices; exec court = curved glass tower (old slab + its F-detail roof bits removed); Goblin Bank cream stone, deep arch, bronze doors; club black door "12"; tailor green bay windows; taxi court black car_pack_7 cabs; brass plates, lamps, area railings; F-london.js phone + pillar boxes from parts, bollards, urns, cafe umbrellas. NOT done: double-deck bus (needs his OK on a Meshy concept), soot in joints (no sheet). SHIPPED PR #1433 (data.js 178e20eb). Shots /mnt/project-files/disaster-city-financial/london/.
- Rules learnt: GOLD = terrain key `gold` only. He LIKES dark pack glass. Grid: blockers centred on whole 3.5 m squares, decor off centre. Text signs: `txt:WORDS|fg|bg|aspect` (sign fonts belong to the sign-font thread). Keep King Kong spot (173.25,-92.75) clear.
- SHOTS: `node playtest_city.js site_prebuilt_downtown_streets '<views>' --wait=330000` with `npm start` up. View {x,z,y,face (0 north -z, 90 east, 180 +z),pitch,fp:true}; y ABSOLUTE metres, NOT snapped (y 0 = under the city; Financial ground 14-21 m, eye = ground + 1.7). GLB props land minutes late: throwaway views first. Night: view `eval: "window._hqClockHour=function(){return 22;}"`. Dark tilted boxes float in the sky over the district (not F.js; unexplained).
- DISTRICT MOVE (PR #1482, 11-15): Financial block now stands north-middle (city cols 4-7, rows 0-3). Plot ids are names; the bake shifts the city while F.js runs, so keep using old plot ids/coords; never convert by hand. Financial levels now 9-12 falling east. Notes areas-complexes.md "THE DISTRICT MOVE", docs/disaster-city/move.js. Shot cameras need world coords of the NEW place.
