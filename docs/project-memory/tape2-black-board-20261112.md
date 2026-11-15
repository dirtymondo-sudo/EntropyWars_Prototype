---
name: tape2-black-board-20261112
description: Tape 2 all-black board in the first quest = NEXT TAPE re-entered DOOR HQ under the next lesson's match; fixed PR #1229; how to get a real WebGPU canvas headless
metadata:
  type: project
  modified: 2026-11-12T16:56:41.134Z
---
mondo 11-12: "the second tutorial shows an all black screen, HUD and everything still there and responsive". Thread (thread in the owner project). SHIPPED PR #1229, token 20261112-nexttape-02-cors, ui.js 5a39f32e, map.js 7f8f27e4.

- Cause: NEXT TAPE / RESTART on a lesson started at the Range Console (`_tut.from === 'hq'`) tore down through backToMainMenu, whose way home (map.js `_hqReturnOrMenu`) re-entered the building while the next lesson's match started; the building owned the canvas, the board was never drawn. Any renderer (WebGPU and the WebGL 2 backend both black). NOT the Entropy Style, NOT PR #1215 / #1214 (the coordinator's suspects).
- Fix: ui.js `_tutChain` holds `window._tutChainPending` round the teardown; `_hqReturnOrMenu` returns early on it (same pattern as `_questFightPending`). Any new "lesson/fight straight into another match from HQ" needs the same marker.
- Diagnosis trick: his pasted console line numbers (three-post.js:3254, three-renderer.js:48077) matched against `git show <commit>:file | grep -n` tell which build he was running. Do this before blaming the newest PR.
- REAL WEBGPU CANVAS HEADLESS (full game, not only a 2-mesh page): Chromium flags `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader --use-angle=swiftshader --use-vulkan=swiftshader --enable-features=Vulkan --disable-vulkan-surface` + `?ew_gpu=webgpu`. Without the Vulkan pair the swap chain's shared image fails and the device is lost every second. ONE WebGPU browser at a time (two crash). 640x400: HQ > Room 64 > Tape 1 > Tape 2 takes about 8 minutes. Harness + before/after: /mnt/project-files/tape2-black-board-20261112/ (t2.js; env HQ=1 VIA=next GPU=webgpu|webgl2). Use /opt/node22/lib/node_modules/playwright, not the repo's node_modules copy.
- Seen, not threaded: `THREE.NodeBuilder: Material "ShaderMaterial" is not compatible.` once while DOOR HQ foyer loads on the node renderer (some HQ mesh still wears a classic ShaderMaterial and is not drawn).
- Not verified: BACK TO ROOM 64 then Tape 2 from the console (the path the quest harness always used, was fine before); his Firefox Mac.
