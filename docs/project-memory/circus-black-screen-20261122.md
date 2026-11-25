---
name: circus-black-screen-20261122
description: Circus black screen on WebGPU = elephant FBX sheet flagged for upload with no picture (three throws on image.complete of null); fixed PR #2379; how to get real WebGPU pictures in the cloud probe
metadata:
  type: project
  modified: 2026-11-22T12:56:44.053Z
---
mondo 11-22: "i went across and the screen was black in the circus" (Firefox, WebGPU, site_prebuilt_area51_ow_circus). Thread (owner-project id). SHIPPED PR #2379, token 20261122-nopicture-02-cors, three-renderer.js a849746f.

- His trail: `draw failed ... (elephant-3d / MeshLambertMaterial: can't access property "complete", image is null)` then the same from `Render Pipeline / RenderPipeline` (= whole frame skipped), `Unsupported texture type with RGBFormat. 1009`, `Texture with 'depth' label has been destroyed` (after F12 = resize).
- Cause: `_hqPropMatPick` did `if (_ewTexSetSRGB(tex)) tex.needsUpdate = true` on the elephant's sheet while the FBX loader was still fetching it (image null). three 0.186.1 `Textures.updateTexture` reads `image.complete` with no null check. Found with a hook on `THREE.Texture.prototype.needsUpdate` logging a stack when image == null (cheap, reuse it).
- Fix: `_ewTexSetSRGB` returns true only when the sheet has a picture; `_ewGpuSafeTextures` (placeholder for a no-picture sheet, RGB 8-bit -> RGBA, texture destroys go to `r._ew_freeLater`); THE GROUP GUARD around `r._renderBundle`. Off: `EW_NO_SAFE_TEXTURES`, `EW_NO_GROUP_GUARD`. Notes: rendering-loading-perf.md "THE SHEET WITH NO PICTURE".
- NOT reproduced in the cloud: the fully black frame and the destroyed depth texture (rest on his trail). If black again, ask for the trail (look for `sheets with no picture` in gpuStatus and `draw failed`).
- REAL WEBGPU PICTURES IN THE CLOUD: copy playtest_city.js with `headless: false`, run `EW_PROBE_GL=webgpu xvfb-run -a node <copy> <room> '<views>' --gpu=webgpu --flags=EW_HQ_NO_SURVEY`. The circus is ready in ~80 s, a run ~2.5 min, pictures are real (not black). Needs `npm install` + `npm i --no-save three@0.128.0` + `npm start` first. Related [[continue-black-screen-20261112]].
- Left open, not this thread: invisible wall on the highway road into the circus; memory 1934 of 700 MB in the circus.
