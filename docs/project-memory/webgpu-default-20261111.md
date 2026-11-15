---
name: webgpu-default-20261111
description: WebGPU is the default renderer since PR #1124 (Auto pick, probe, fallback to classic WebGL, Settings > Video Renderer row); what was and was not verified
metadata:
  type: project
---
mondo 11-11: "make the default game webgpu ... I dont wanna have to type ?ew_gpu=webgpu anymore or tell friends". Thread (thread in the owner project). SHIPPED PR #1124 (token 20261111-gpuauto-01-cors). Notes: docs/notes/rendering-loading-perf.md "WEBGPU BY DEFAULT".

- index.html: `EW_GPU_PICK` auto (default) | webgpu | webgl2 | webgl; `EW_GPU_MODE` = what runs; `EW_GPU_WHY` = reason (F3 backend line, ?ewdiag=1). Auto = WebGPU if navigator.gpu + probe (adapter, not software/fallback adapter, device) passes, else the CLASSIC WebGLRenderer (not the node renderer's WebGL 2 backend). Probe result in localStorage `ew_gpu_probe` (`ok`, `no:why`, `bad:time:why` = node renderer failed after a passed probe, kept a week).
- Settings > Video > Renderer row: Auto / WebGPU / WebGL + Reload now (drops ?ew_gpu= from the address, keeps ?join=).
- So the friend's weak Chrome PC now gets WebGPU if its Chrome has a hardware adapter: perf fixes aimed at "the friend = classic renderer" ([[perf-pvp-demo-20261110]]) may no longer be the path he runs. Ask for his F3 backend line.
- Verified headless (WebGL only): detection cases, fight on classic fallback, device refused after probe, Render Scale both renderers, the row. NOT verified: a real WebGPU frame through Auto; Firefox; the friend's PC.
- Sandbox lesson: the local server's index.html loads game scripts from the CDN, so edited ui.js / three-renderer.js must be served with a Playwright route to the checkout, or the test runs the old live files.
- SPELL FX LAYER (three.quarks fire/embers/smoke; his setup ships it ON) runs on WebGPU since PR #1129: the library simulates, three-vfx.js `_qkNDraw` draws through the game's batched particle material; off live window.EW_NO_QUARKS_NODE. Proof strips /mnt/project-files/webgpu-default-20261111/spell_layer_*.jpg (node renderer on WebGL 2 backend only).
- Known WebGPU gaps on the default path: F3 GPU ms never on Firefox; mall lighting PR #1070, Heaven #1067, nexus overlay #1110, hit side #1106/#1107, ledge raises never viewed on WebGPU.
