---
name: perf-city-propchunks-20261114
description: Disaster City perf thread 11-14: seat-ray hang #1381, prop chunks #1382, lamp reach #1386, unseen lamp #1389, THE STILL WALK (matrix walk of 59K objects); how to profile; what is left
metadata:
  type: project
  modified: 2026-11-14T12:48:50.296Z
---
Thread (thread in the owner project) "optimize Disaster City" (mondo 11-14, Mac Firefox WebGPU, started 6.8 FPS / 3748 draws; 12:05 "still really slow ... go harder").
- #1381 seat grid rays (lens tell "Pick ~950 ms/s").
- #1382 prop chunks, #1386 lamp's reach. #1383 went BLACK (a `var ro` clash in `_ewBunSetup`) -> grep hook names there AND load the city in the sandbox before shipping.
- #1389: hero lava-lamp cube shadow held while off camera (it was the 776 "shadow" draws: point-light sides draw bundles classic); whole-scene scans (LOD, chunk spheres, CSS2D, hero list) only on change.
- THE STILL WALK (after #1389): three's `updateMatrixWorld` walked all 59,082 objects every frame (21-45 ms cloud Chrome); `matrixWorldAutoUpdate=false` on a group does NOT skip its children (the "still chunks" of #1382 saved nothing). Now shell + chunk groups own their walk inside `_hqFrame`'s one walk: off-camera chunk nothing, per-child TRS compare, add hook, 500 ms sweep for inner movers. Off `EW_HQ_STILL_OFF`; counts `ThreeRenderer.hq.dev.still()`; lens line "Matrix walk". Notes: rendering-loading-perf.md "THE STILL WALK".
- SANDBOX: city OOMs on drawn frames unless every texture is shrunk to 64 px in-page; that shrink breaks the static batch ('scan', shell classic 6K draws) = artefact, so compare JS shares / counts, not FPS. Sandbox runs ~0.5 fps so 500 ms timers look per-frame. CPU profile: harness `/profile?seat=1&ms=40000&n=5&name=X` + scratchpad prof_an.js.
- #1390 still walk LIVE: his Mac 7.3 -> 14.9 FPS, matrix walk 4.25 ms.
- #1391 LIVE: MOVERS OUT (`_ew_bunOut`, cars + still-walk movers draw outside the recording; off EW_BUN_NO_OUT), QUIET REPLAY (static recording asks one object per shader monitor, rests hasNode objects that write nothing; off EW_BUN_FULL_REFRESH), QUIET GROUPS (bundle check every 3rd frame; off EW_BUN_CHECK_EVERY).
- #1391 REGRESSED on his Mac (11.2 fps, "values 1.9 re-records/s", shell classic): a static shell re-records for every slow changer (signals, glows). Fixed #1393 THE CHANGERS OUT (token changers01): per-child value hash, 3 changes in 20 s -> `_ew_bunOut`; slow churn demotes; lens line "Re-recorded most". LESSON: making a group static exposes every changer in it; ask for F3 after each ship.
- BUG shipped in #1391/#1393, fixed #1394 (token outs01): three projects a bundle group's children ONLY on record frames, so `_ew_bunOut` pieces (cars, signals) were invisible on replay frames. Now `g._ew_bunOuts` projected by the wrapper each replay frame.
- His 19:31 lens (#1393): 13.1 FPS, CPU 70 (submit 40.4), 99 draws, check 8.85 ms. #1395 (token ftime01): STILL CHECK (no per-piece matrix hash in still-walk groups, off EW_BUN_HASH_MATRICES) + F3 "Frame JS" lines (every tick + per pass: projection, replays, draws, submit). His F3 then: 20.2 FPS, CPU 38, frame 48.5. #1396 (token mask01): MASK SHORT WALK (side render projects only layer-holding children, off EW_MASK_FULL_WALK) + QUIET INST SYNC (off EW_HQ_INST_SYNC_EVERY).
- #1401 (lamp01): hero LAVA LAMP reach cull (off EW_SHADOW_REACH_LOOSE), wax redraws 10 Hz (wax shadows visible: keep). His F3: 20.3 FPS, CPU 39.
- #1409 (rest02): door group = still-walk group (swing woken, out of recording; was demoted), dynamic instanced batches rest in replay (off EW_BUN_INST_NO_REST), add marks only its own bundle group + quiet after 8 checks (off EW_BUN_ADD_ALL). Waiting his F3. Harness eval needs `return`.
- Sandbox load: hook createImageBitmap 64 px before _hqEnter, shrink textures after ready.
- LEFT: shell as plot chunks; Firefox per-draw cost; 20 post passes at pixel ratio 2.
Related [[disaster-city-144-20261113]] [[finds-freeze-20261113]] [[perf-options-webgpu-20261109]]
