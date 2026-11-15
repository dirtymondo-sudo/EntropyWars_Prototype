---
name: perf-atlantis-skinpick-20261113
description: mondo's 4.7 FPS battle (11-13) was the Atlantis board: fish material runs + skinned raycast cost; PR #1249 fixes, kill switches, how to find such causes
metadata:
  type: project
  modified: 2026-11-13T04:29:58.345Z
---
mondo 11-13 03:54 pasted an F3 readout (Mac, Firefox, WebGPU): 4.7 FPS, 3750 draws, "3415 room hq_piece (outside its bundle)", "Pick (raycasts) 164/s · 819 ms/s". Thread (thread in the owner project). The coordinator guessed Training Room; it was the ATLANTIS board (PR #1246, sea life). Tell: 405 bundle groups all named `hq_piece`, no `hq_wall_*`.

SHIPPED PR #1249 (token 20261113-skinpick-01-cors, three-renderer.js ca262998 live). Notes: docs/notes/rendering-loading-perf.md "THE MATERIAL RUNS + THE SKINNED PICK".
- THE MATERIAL RUNS `_ewGroupRuns` (at load, `_loadMiscModel` + `_ewRig.src`, `_loadUnitGLB`): ocean pack FBX meshes had up to 185 geometry groups over 2-3 materials = one draw each, and the unit ink / pixel mask pass (three-post.js side render, bundles off, room props wear `_ew_pixelate`) drew them all again classic. Now one run per material. Off: `window.EW_NO_GROUP_RUNS`.
- THE SKINNED PICK (`_bvhInstall`): three r186 `SkinnedMesh.raycast` cost 27-56 ms per ray through a unit, 1-4 ms per fish (stale first-pose sphere, per-corner skinning). Now pose box reject + skinned points cached per pose; same hits (0 mismatches / 198 rays). Off: `window.EW_NO_SKIN_PICK`.
- Sandbox (SwiftShader WebGPU): draws 3657 -> 316; 198 skinned rays 1163 -> 22 ms; hover pick 8.2 -> 1.2 ms per mouse move. Proof /mnt/project-files/perf-atlantis-20261113/. Mac FPS NOT measured: he owes a fresh F3 readout on Atlantis.
- Left: the mask pass still walks the room classic (166 draws); 20 point lights untouched.

**How to apply:** "outside its bundle" in the lens "extra" pass = a side render (mask pass) drawing bundled groups classic; wrap `renderer.render` and log scene/camera layers/override/draw count per call to see which. High "Pick ms/s" = wrap Mesh/SkinnedMesh `raycast` and time per mesh + caller stack. The F3 lens itself makes the sandbox frame take seconds; time picks with the lens closed and `ph draw demand`. Harness: `ph start --gpu webgpu`; if the game never boots, `ph quit`, `pkill -f chrome`, start again.
Related [[perf-options-webgpu-20261109]] [[perf-pvp-demo-20261110]] [[atlantis-sunken-agora-20261113]] [[sandbox-webgpu]]
