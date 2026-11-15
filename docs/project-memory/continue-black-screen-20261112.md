---
name: continue-black-screen-20261112
description: All-black world after Continue into the Main Hall on WebGPU = three's stale shadow-light record threw in a bundle replay and skipped every frame; fixed PR #1236
metadata:
  type: project
  modified: 2026-11-12T17:48:13.694Z
---
mondo 11-12: "Continuing the game from the main menu, after the load screen loads its just a black screen". Thread (thread in the owner project). SHIPPED PR #1236, token 20261112-stalelights-01-cors, three-renderer.js 2d9546fa.

- His console named it: `a draw failed and was skipped (Render Pipeline / RenderPipeline: can't access property "map", lightData is undefined)`, stack NodeMaterialObserver.equals < needsRefresh < _renderBundle. ANY "draw failed ... Render Pipeline" line = the WHOLE frame is skipped (black world, HUD fine).
- Cause: three keeps one record per shadow-casting light per render object; a bundle replay never re-fetches render objects, so a shadow light joining after a non-static group was recorded read past the record and threw. `r._ew_lights` is noted at the frame's first real draw, which never came, so `_ewBunTick` never re-recorded: black for good. WebGPU only. NOT the save (PR #1219) and not the lamp budget (PR #1231) as such.
- Fix: `needsRefresh` wrapper catches it, retakes the record, returns FULL, flags the group (`_ew_bunFree`); `_ewRigTick` bumps `_ewBun.epoch` when the rig grows. Notes: rendering-loading-perf.md "THE STALE LIGHT LIST".
- NOT reproduced as his exact flow: headless WebGPU (swiftshader) with the 3D menu + Continue crashed the page ("Target crashed") after ~15 min; one HQ load there takes ~10 min at 640x400. Use `nomenu3d` and one session. Harness: scratch cont.js / synth.js pattern (index.html served from a worktree for before/after via REPO env). Related [[tape2-black-board-20261112]] [[lost-light-rig-20261111]].
- Second try: walked into the hall on real WebGPU (fixed + unfixed), demoted all 7 bundle groups (`_ew_bun.dyn = true`) and set a lamp `castShadow = true`: NEITHER build threw, so the throw was never reproduced here; the fix rests on his stack trace. If he reports black again ask for the console (look for `draw failed`). Picture + harness /mnt/project-files/continue-black-screen/. Scene accessor: `ThreeRenderer.hq.dev.hqScene()`.
