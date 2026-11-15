---
name: disaster-city-industrial-20261113
description: Industrial district buildings (Disaster City 144 plots): BUILT + LIVE PR #1279 11-13 after mondo's OK 17:05; where the code lives, ind_* pack keys, what is unchecked
metadata:
  type: project
  modified: 2026-11-13T17:51:40.391Z
---
Thread (thread in the owner project) "Design Industrial district buildings" (mondo 11-13 16:41 district-architecture ask).

- STATUS 11-13 17:55: LIVE, PR #1279 merged, data.js 34d5314b uploaded. Waits mondo's Mac look. Shots /mnt/project-files/disaster-city-industrial/ (mockup_*, game_*.jpg).
- Code: `docs/disaster-city/districts/I.js` (DESIGN map per building id, parametric on the baked footprint); rerun `node bake-disaster-city.js`. Notes: areas-complexes.md "DISASTER CITY, THE INDUSTRIAL DISTRICT".
- Industrial = plots x 0-3, y 8-11, district `I`, 28 buildings, 11 walk-ins. Each = skin-less texbuilding (collision + swing door) + `ind:<id>` k:'arch' row.
- NOT walk-tested: roof route over Freight gate + Loading office (changed from plateau to hollow 2-storey texbuilding, roof slab at 7 m).
- I wrongly told mondo crane + shuttle were existing room models; they are horizon models only. Crane built from truss parts; shuttle NOT placed (owned up in delivery reply).
- INDUSTRIAL PACK: domi236 PS1/PSX Industrial Pack #1, CC0 (https://domi236.itch.io/ps1psx-industrial-pack-1), R2 Assets/world/packs/domi236_industrial/, cut by bake-pack-pieces.py `ind_*` (scale 0.4694). Keys free for all districts: ind_container (stack with row `y` 2.15/level), ind_skip, ind_skip_full, ind_silo, ind_vent, ind_panel, ind_factory_red/tan/blue (fronts cut, not placed).
- Headless look method: copy of playtest_city.js with a free camera (`ThreeRenderer.hq.dev.renderer()/hqScene()`), ~6 min first load; third-person teleport shots end inside buildings.
Related [[disaster-city-144-20261113]]
- 11-13 later: exterior polish LIVE PR #1319 (MORE/ROOFS lists, ~1200 parts) + sign words PR #1331 (`txt:` sheet). INTERIORS: plan + floor-plan mock-ups posted 21:20 (/mnt/project-files/disaster-city-industrial/interiors_plan_1..3.jpg, layouts in interiors_plans.py), NOTHING BUILT, waits mondo's OK. Open question: the F-22 model (13.6 x 15.6 m) does not fit the 10.5 m deep hangar.
- GRID RULE for the interiors build (mondo 21:14, all interiors): blocking pieces snap to the battle grid, centred on cells, multi-cell pieces fill whole cells (a 2-wide truck = exactly 2 tiles, never between tiles); cosmetic decor sits off centre, free of the grid. The posted floor plans are rough metres: snap them when building.
- The city's battle squares are 3.5 m (HQ_ARENA_RULES.squareDefault, bake C = 3.5): snap interior barriers to whole 3.5 m squares.
- 21:21 mondo "make hangar deeper so it fits": DONE PR #1338 (hangar 31.5 x 14 m via `fit` in build, 7 m walls, fighter_jet inside on 5 x 3 squares). LESSON: never change the plan in `tailor` for this: it re-rolls the whole city's random dressing (2800 data.js lines); grow a building with `fit` in `build`. `ctx.lamps` now reaches build. He has NOT yet said OK to the other ten interiors.
- 11-14 00:20 INTERIORS LIVE PR #1354 (his "all okay" 11-13 22:25): all 11 walk-ins, I.js `IN[id]` + `KIT` + `inside()`; data.js a9499e24. Shot /mnt/project-files/disaster-city-industrial/interiors_game.jpg. UNSEEN: model-file props (lockers, crates, containers, chairs, vehicles) and prop facings. Pump court has an older mirrored shop-front sheet by the sewers door (not from this work, flagged to mondo).
- HEADLESS LESSON: a free-camera render (own THREE camera) does NOT draw the game's batched props: instanced ones (`_ew_instHidden`) and merged proc ones (`_ew_mcKeep`) are hidden originals; the window flags did not help. For a placement look, force `visible` true on meshes under `userData.ewRow` groups in the view's eval. Also pass `--wait=430000` (default 22 s) or nothing has loaded.
- 11-15 HOUSTON LIVE PR #1425 (real-cities plan d-i, mondo "Build it as drawn"; brief relayed from (thread in the owner project): I.js `HOU_LOOK` + the LANDMARKS block (`claim`/`land`); data.js 52858d3c. Shots /mnt/project-files/disaster-city-industrial/houston_1/2.jpg. Pump jacks static parts (a nodding Meshy one would need his concept OK). Tanker sits in dry berth (Industrial edges are forest/desert, no water).
- 11-15 19:00 DISTRICT MOVE PR #1482: Industrial is now the city's SOUTH-EAST block (cols 8-11, rows 8-11), sea east + south; a harbour quay (districts/Q.js, cx 144-146) runs down its east side. I.js needs no edits: plot ids stay names, the bake shifts the city while I.js runs. Merge main + rebake as usual; never convert coordinates by hand. Levels 0-2 now (flat).
