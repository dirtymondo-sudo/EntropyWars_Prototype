---
name: dc-industrial-interiors-pass2-20261114
description: Industrial (Disaster City) interiors SECOND PASS LIVE PR #1356 (11-14): I.js SECOND + kit2 (atmosphere, safe new blockers), 20 Meshy industrial models on R2, facing fix, pump court / sewers door overlap
metadata:
  type: project
  modified: 2026-11-14T00:35:08.320Z
---
Thread (thread in the owner project) "Deepen Industrial interiors, second pass" (mondo 11-13 22:33 brief, same as other districts). First pass = [[disaster-city-industrial-20261113]] PR #1354.

- Code: docs/disaster-city/districts/I.js `SECOND[id](Q)` after each room's first pass; `kit2()` helpers paint/ceil/sky/hb/strip/pend/beacon/sign/onWall/pipe/lines/exit + `Q.block(i,j,w,d,h,fn)` = new blocker on whole squares, refused on the doorway square or if a flood fill shows a walk square cut off. K.P now takes a 6th `more` arg (e.g. { span }). Notes: areas-complexes.md "THE INDUSTRIAL INSIDES, SECOND PASS".
- 20 Meshy models LIVE on R2 Assets/world/props/meshy/ (11-14 ~00:40): steam_turbine, centrifugal_pump, gate_valve, high_bay_lamp, gauge_board, metal_lathe, drill_press, tool_pegboard, gas_cylinder_rack, air_compressor, jet_engine_stand, aircraft_tug, maintenance_stairs, rocket_engine, signal_lever_frame, railway_lantern, platform_scale, chain_hoist, ship_model, cable_drum. data.js "THE INDUSTRIAL INTERIOR PIECES". Originals/concepts/opt copies: /mnt/project-files/disaster-city-industrial/meshy/ (run.py + items.json pipeline).
- Meshy image-to-3d output: front already +Z, centred at origin (base at -h/2): prep = recentre base to y 0 + metallic 0 (gltf-transform script in this thread), then optimize-assets.js; .opt uploaded AS <key>.glb with `node sync-zip.js --put`; `node manifest-assets.js <mirror> --merge`.
- Blender in cloud: `pip install bpy==5.2.3` + `apt-get update && apt-get install -y libegl1 libgl1` (needs the update first).
- FACING BUG fixed: KIT files/shelf/racks 'l'/'r' faced into the wall (now 'l' = 90, 'r' = 270).
- Reuse via HAS(key) (reads data.js at bake): Southside tool_chest/tire_stack/engine_hoist in since #1356; Hero Plaza welding_cart not on main yet: rebake when it lands.
- PUMP COURT "mirrored shop-front sheet" = three-renderer.js `_hqBuildCityEntrances`: every leafed FREE door in a city room gets a 10x6 m sprite building + awning + sign behind it; the sewers door (JOIN.sewer) stood 0.25 m outside the Pump court so the sprite stood through the room. FIX: bake-disaster-city.js exposes `dcCtx.JOIN` to district `build`; I.js `Q.join('sewer', ...)` hangs it on the Pump court back wall; door row `noEntrance: true` skips the sprite. Tower + mall join doors still get sprites (may overlap their real buildings: unchecked).
- LIVE PR #1356 merged + uploaded 11-14 (data.js e92c7c0f, three-renderer.js 2d2aa777, ASSET_MANIFEST f19e75bf; token ind9). Shots /mnt/project-files/disaster-city-industrial/interiors2_game_1/2.jpg.
- HOMES LIVE PR #1365 (11-14 ~02:55, residents' bedrooms brief): P02-09-B2 Knight, P01-11-B2 Astronaut, P00-09-B2 Marksman = walk-ins (leaf_suburban_house), one psx_bed_5_1 each in a partitioned ground-floor bedroom; IN rows home:true + H 3.2; KIT bed/wardrobe/sofa/tv/dine/kitchen. Headless camera 'face' = rot looks at the back wall. psx_bed_1 did not load headless (switched).
