---
name: perf-city-chunks-20261113
description: Disaster City 12 fps (11-13): fences were one city-wide mesh per kind + instance pass in one unculled bundle; PR #1271 THE CHUNKS + one matrix walk; knobs, kill switches, what is left
metadata:
  type: project
  modified: 2026-11-13T17:13:41.804Z
---
mondo 11-13 16:27 pasted an F3 readout walking the 144-plot Disaster City (Mac, Firefox, WebGPU): 12 fps, submit 65 ms, 109 draws, 3.29M tris in 13 "hq_part terrain" draws. Thread (thread in the owner project). He said: "we have the plots already, why not just make those the chunks or like a group of them".

SHIPPED PR #1271 (token 20261113-chunks-01-cors; three-renderer.js bfca5234, data.js 76d5a90d live). Notes: docs/notes/rendering-loading-perf.md "THE CHUNKS + THE ONE MATRIX WALK".
- Cause: STAIRS PACK fences (`_spBuildRailings`) = one mesh per fence kind for the whole room (12 meshes, 4.27M tris), in the unculled shell bundle + redrawn by the model mask (lens "extra" pass, `_ew_pixelate`). Instance pass (989 batches, 4.4M tris) in ONE bundle, never culled. 20,700 objects matrix-walked 4x a frame.
- THE CHUNKS (rooms >= 200 m across, live walk's own room only): fences per plot (42 m) under `H.chunks.root`; instance cells are groups (`I.cells`), small placed props (< 1.7 m sphere) in `|s` cells. Each group its own bundle, `visible=false` when off camera (+15 m pad) or past far (fences 120 m, cells 260 m, small 100 m). `_hqChunkTick`, `_hqChunkHome` (hand-over / crossing / leave put fences back in the shell). Knobs: data.js HQ_ENGINE_RULES chunkM, chunkMinSpanM, chunkPadM, fenceFarM, instFarM, instSmallM, instSmallFarM.
- THE ONE MATRIX WALK: walk frame updates matrices once, holds `matrixWorldAutoUpdate` false for its renders.
- Off live: `window.EW_HQ_NO_CHUNK_CULL = true`, `window.EW_HQ_MW_EVERY_RENDER = true`. Lens line "Chunks: fence plots a/b drawn · prop cells c/d drawn".
- Sandbox (SwiftShader WebGPU, counts only): tris in view 10.2M -> 3.1-3.4M; matrix walk 38 -> 11 ms; projection 51 -> 22 ms; cull on/off pictures differ 0.2-0.4% of pixels. Proof /mnt/project-files/perf-city-chunks-20261113/. Mac FPS NOT measured: he owes a fresh F3 in the city.

LEFT (offer if still slow): ground 256 tiles 670K tris + buildings stay in the unculled shell bundle; dense Meshy props (5-9K tris each, x315 / x94 / x70) have no LOD files (`optimize-assets --lod` + manifest would feed the existing LOD tick); fence pack ~500 tris a metre; his pixel ratio 2.0 at 3456x1812 (Render Scale setting exists); a room entered by a stage crossing is not chunked.

**How to apply:** lens "hq_part terrain" heavy draws in a site room = check `_ew_hqRailing` meshes first. Census snippet: traverse `ThreeRenderer.hq.dev.hqScene()`, sum tris per top group and per tag. City loads headless in ~8 min; `ph draw demand` while loading. Harness sandbox frame is seconds: compare counts, not FPS.
Related [[perf-atlantis-skinpick-20261113]] [[disaster-city-144-20261113]] [[perf-options-webgpu-20261109]]
