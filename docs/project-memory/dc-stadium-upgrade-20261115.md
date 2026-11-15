---
name: dc-stadium-upgrade-20261115
description: Disaster City football field brought up to the old stadium map (PR #1415, 11-15); how the stands/paint are built + headless screenshot recipe that works
metadata:
  type: project
  modified: 2026-11-15T11:47:58.860Z
---
Thread (thread in the owner project) (mondo 11-15: city football field "looks worse than the stadium battle map", seats/stands). District notes: [[disaster-city-sports-culture-20261113]].

- LIVE PR #1415: S.js stadium block = 14 tier wall rows a stand (engine's instanced seats, ~3,200), old `hqGridironMarks` paint via new bake `ctx.marks` (code strings -> room `terrain.marks`), bowl-style flood masts in the arch row. data.js 54bb0f37, three-renderer.js fd8ca597, token 20261115-stadium-01-cors. Notes: areas-complexes.md "THE STADIUM, AS GOOD AS THE BOWL".
- GOTCHA: in the sloped city room a wall row's `y` is OVER THE GROUND (`_hqTSlopeFeatures` adds the level). Adding the plot level yourself lifts it twice.
- Stands WALKABLE since PR #1417 (mondo 11-15 12:08): blocks gone, fascia open at 4 aisles, ghost back wall; proven with hqTerrainFeet via load-data.js loadGameData (scratch walk probe), not by walking on screen. Scoreboard + goal posts unchanged.
- HEADLESS SHOTS WORK for both rooms (no crash 11-15): copy /mnt/project-files/disaster-city-sports-culture/mock/city.js, require playwright from /opt/node22/lib/node_modules/playwright, `npm install` + `node server.js`, run in background (city needs --wait=60000, ~2 min a shot). Teleport `y` is absolute (stadium ground 5.25); face 0 = north, 180 = south. Old stadium room id `site_prebuilt_stadium_bowl` (its grass draws black headless).
- Proof: /mnt/project-files/disaster-city-stadium/ (4 side-by-sides).
