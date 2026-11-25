---
name: walkin-floor-20261124
description: Invisible walls in walk-in buildings (Hero Plaza pizzeria, 11-24) = the inside model drawn on the back store's roof while the ghost walls stayed on the floor; fixed PR #2515
metadata:
  type: project
  modified: 2026-11-24T12:11:17.013Z
---
Thread (owner-project id). mondo 11-24: invisible wall in Hero Plaza, at square -5,-15, 14 m up. That spot was the pizzeria's dining room. LIVE: PR #2515 (data.js 5d277fed, three-renderer.js 949ae7c2, token 20261124-walkinfloor-01-cors).

- Cause: three-renderer.js `_hq.terrainScatter` copy dropped a walk-in prop's `floor` / `noBlock` / `y`, so the inside model stood on a solid row's top (11 m up). The booth and counter ghost walls (`ghost: true`, collision only) stayed on the floor. Fixed for every walk-in.
- Tools: `ThreeRenderer.hq.dev.why(x, z, curY)` in a probe. Headless: data.js `hqTerrainWallAt` via load-data.js loadGameData() + vm, about 40 s for the city. A `ghost: true` wall in the answer = look for the drawn thing it stands for.
- The city probe crashes the cloud browser (OOM). It works with the flags EW_HQ_NO_SURVEY, EW_HQ_NO_ENCOUNTER, EW_NO_FLORA, EW_HQ_NO_RESIDENTS, EW_NO_HQ_GRASS, EW_NO_GRASS_FIELD, EW_NO_ANIMALS, EW_PERF_LOW. It still crashes about half the time. The server needs `npm start` first.
