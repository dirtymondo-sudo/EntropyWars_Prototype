---
name: rotate-freeze-skinkey-20261122
description: 11-22 "screen freezes when I rotate" on WebGPU = "requires vertex buffer N to be set" (shader key shared by units with/without tangents); fix PR #2374; cloud WebGPU must run headful
metadata:
  type: project
  modified: 2026-11-22T08:25:54.322Z
---
mondo 11-22: "rotate the map ... screen freezes but i can still see the shadows rotating" + scrambled Gangster/Giant textures in the same session. Thread (owner-project id). SHIPPED PR #2374, token 20261122-skinkey-01-cors, three-renderer.js 932fd3e6.

- His crash trail named it: `RenderPipeline '..._MeshLambertMaterial_...' requires vertex buffer 5 to be set` (and ShadowMaterial, buffer 4). ANY such line = WebGPU refuses the whole frame while that object is in view (frozen picture; turning it out of view unfreezes).
- Cause: THE KEY BY WHAT IS READ (11-20, three-renderer.js `getGeometryCacheKey` in `_ewInstShareSetup`) dropped attributes the MATERIAL does not read, but three's skinning reads normal + tangent when the geometry has them (instancing: normal; morphs too). Rabbit file has TANGENT, gangster does not: shared build, short draw. Fix: skinned key always holds normal + tangent. Notes: rendering-loading-perf.md "THE SKIN READS THE NORMAL AND THE TANGENT".
- RULE: before cutting anything from a build key, grep three.webgpu.js for `hasGeometryAttribute` / `geometry.hasAttribute`.
- Not proven: that the scrambled textures were the same bug (a reload cleared them).
- CLOUD WEBGPU: headless Chromium 153 loses the device as soon as the game draws ("A valid external Instance reference no longer exists", black world). Headful on Xvfb works; harness `--gpu webgpu` is headful since 11-22 (PH_HEADLESS=1 = old). Probe that compares a draw's buffers with its pipeline's: /mnt/project-files/rotate-freeze-20261122/vertex-buffer-probe.js (take the count BEFORE calling createRenderPipelineAsync).
- Squad setup (VS CPU > RANDOM TEAM > RANDOM again and again) is the quick way to cycle many unit models. Related [[props-move-camera-20261115]] [[continue-black-screen-20261112]].
