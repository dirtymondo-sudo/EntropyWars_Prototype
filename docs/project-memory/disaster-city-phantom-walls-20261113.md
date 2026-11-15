---
name: disaster-city-phantom-walls-20261113
description: Disaster City one-sided giant walls / floating slabs (11-13) = road-mark kerb stones stretched over sloping streets; fixed PR #1336; probe facts (world scale 73, teleport needs absolute y)
metadata:
  type: project
  modified: 2026-11-13T21:21:17.780Z
---
Thread (thread in the owner project). mondo 11-13 20:04: giant walls on the Bayside police street, visible from one side only. LIVE PR #1336 (three-renderer.js 93cc0cbb, token 20261113-kerb-01-cors). Seen in the headless browser before / after: /mnt/project-files/disaster-city-phantom-walls/.

- Cause: NOT the levels' retaining walls, NOT border leftovers. three-renderer.js road markings (`_ew_hqRoadMark`, THE KERB STONES): one quad pair per street run, top = highest end, foot = lowest end. With the city's levels (PR #1299) a run climbs up to 21 m: a front-faced wall along the kerb, its top quad a slab floating at the highest point (likely the "dark slabs in the sky" the Financial thread saw). Edge lines had the same fault.
- Fix: `runCuts` cuts a run where the ground changes slope; kerb + `flat()` build pieces with a height per corner. One mesh per room, so all districts.
- **How to apply:** a huge flat one-sided plane in a sloped room = first suspect any builder that reads a height at a long run's two ends only. Probe facts: the HQ scene is 73 world units a metre (raycasts / bboxes); `dev.teleport` does not snap to the ground, pass absolute `y` (level * 1.75) or the walker stands under the terrain and sees the sea sheet; raycast meshes only (sprites throw without a camera); put "PROBE" in a console line so playtest_city.js prints it.
Related [[disaster-city-vertical-20261113]] [[disaster-city-144-20261113]]
