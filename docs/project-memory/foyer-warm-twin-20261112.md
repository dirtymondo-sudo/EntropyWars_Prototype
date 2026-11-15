---
name: foyer-warm-twin-20261112
description: Foyer WebGPU `Material "ShaderMaterial" is not compatible` line = room warm-up (compileAsync) bypassing the twin swap for the dust motes; fixed PR #1237
metadata:
  type: project
  modified: 2026-11-12T17:50:40.317Z
---
Thread (thread in the owner project) (mondo "yeah sure" 11-12). SHIPPED PR #1237, token 20261112-warmtwin-01-cors, three-renderer.js 1da21173 live.

- The earlier reading "one HQ object not drawn" was wrong: nothing was missing. The line came from `_hqWarmRun` -> renderer.compile (= compileAsync on the node renderer), which calls `renderObject` past the draw hook, so the foyer dust motes (`atmos:dust`, Points ShaderMaterial) were warmed raw. They always drew in real frames.
- Fix: `_ewGpuCompat`'s `r.renderObject` wrap gives an unswapped classic shader material its twin / point proxy. Note: docs/notes/rendering-loading-perf.md "THE WARMED TWIN".
- Proof: headless foyer on `?ew_gpu=webgl2` (same node builder): line printed before, gone after. Headless swiftshader WebGPU floods `createBuffer ... too large` in the foyer, so no usable WebGPU picture from the cloud; his Mac check is owed.
- Diagnose any future "is not compatible" line by logging object + `new Error().stack` in that wrap. Foyer load headless takes ~7-8 min: give the run 25 min. Harness idea: /mnt/project-files/tape2-black-board-20261112/t2.js with routed responses served one at a time.
Related [[headless-hq-proof-gotchas-20261108]]
