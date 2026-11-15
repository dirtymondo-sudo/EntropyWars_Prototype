---
name: finds-freeze-20261113
description: Story mode froze on the loading screen after the 504 m Disaster City merged (11-13); cause = finds warm on the page, fix PR #1267; how to find a main-thread freeze in the cloud browser
metadata:
  type: project
---
mondo 11-13 15:54: "story mode isnt loading anymore ... loading screen just stayed forever and the browser slowed down" (thread in the owner project). He later said it loaded (maybe his internet) but wanted it fixed anyway.

- CAUSE: not the terrain compile (survey worker). After the worker's record for the new 504 m `site_prebuilt_downtown_streets` (PR #1258) was adopted, the background finds warm (map.js `_hqScheduleFindsWarm` -> data.js `hqFindsWarm` -> `hqFindSpot`) scanned the room in 0.5 m steps on the page: one task of 4.5 min headless, in the foyer too.
- FIX PR #1267 (token 20261113-findsfix-02-cors, data.js + map.js live): worker places the room's finds (`hqTerrainWorkerServe` -> `hqFindsAdopt`/`hqFindsGen`), `hqFindGrid` (4 m blocker cells), `hqFindOrder` (farthest first, early stop). Finds byte-identical in the 90 other rooms. Notes: docs/notes/rendering-loading-perf.md "THE FINDS FREEZE".
- RULE: anything walking a whole big terrain room per point (finds, reach, nav, arena bake) runs in the survey worker or is budgeted per frame.
- Proven headless (WebGL2): new profile loads the foyer; Continue from a save inside the new city (x 12, z 8) loads. NOT measured on his Mac / Firefox.
- Seen in that city run, handed to the Disaster City thread: "41 file(s) of this room never landed" was a FALSE ALARM (the log prints the pre-move URL Assets/misc/ebd_*; sprites.js EW_ASSET_MOVES maps it to Assets/world/packs/elbolilloduro/, which is 200; the headless load just ran out of time). Check a logged URL through EW_ASSET_MOVES before calling it missing; the room title district line overlap was fixed by that thread in PR #1273.
- HOW TO FIND A PAGE FREEZE: probe with CDP `Profiler` + an in-page rAF gap logger (console line when a frame gap > 4 s); if `Profiler.stop` times out, `Debugger.pause` gives the live stack. Compare against a `git worktree` of an older commit served through the Playwright route. Node check of finds: load-data.js + `hqTerrainInfo(id)` + `hqBuildFinds(id)`.
Related [[disaster-city-144-20261113]] [[hq-card-waits-20261112]] [[headless-hq-proof-gotchas-20261108]]
