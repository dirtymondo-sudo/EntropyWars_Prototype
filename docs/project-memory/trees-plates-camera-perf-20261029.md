---
name: trees-plates-camera-perf-20261029
description: PR #670 (10-29) perf proposals 3/4/5 built: one shadow for fading trees, plate repaint ~10 fps, camera step cap 0.1 s; kill switches + sandbox numbers
metadata:
  type: project
  modified: 2026-10-29T09:21:24.923Z
---
mondo 10-29 asked threads to build most of the shader-cache doc's proposals (keep online PvP smooth). This thread did 3, 4, 5; another thread did 1, 2, 6.
PR #670 merged (main de90c76), token 20261029-treeplatecam-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261029-0921.zip (three-camera.js 75a52c36, three-renderer.js a5abb54a). Notes: docs/notes/rendering-loading-perf.md "TREES, PLATES, CAMERA".

- Trees: `_occCloneMat` clone carries `_ew_occSrc`; `_ewGpuCompat` wraps `r.renderObject` so the node renderer's shadow pass draws the original. Builds while faded 12/45 -> 1/34. Off: window.EW_FADE_OWN_SHADOW = true.
- Plates: PM_ANIM_MS 40 -> 100. Off: window.EW_PLATE_ANIM_MS = 40. NOT measurable in the sandbox (~10 fps there).
- Camera: three-camera.js STEP_CAP 0.1 (`_stepCap()`). Zoom glide at ~6 fps 1.3-2.5 s -> 0.9 s. Off: window.EW_CAM_STEP_CAP = 0.05. battle.js / HQ walk / hud.js 0.05 s loops left alone (not camera).
- All viewer-local; two-seat friendly: host/guest counts equal, no errors.

Harness tips learned: SwiftShader WebGPU ran 0.2-0.6 fps (useless); use `--query '?ew_gpu=webgl2'` for node-renderer counts. Draw-demand mode only ~7-10 fps on default renderer (not 20). The friendly-room map <select> set by eval did not take (got Area 51). Probes in this thread wrapped `R._nodes._createNodeBuilder` (shadow builds = material.isShadowPassMaterial) and canvas getContext from `_pmPaint`.

Related [[shader-cache-one-write-20261028]] [[sandbox-playtest-speed]]
