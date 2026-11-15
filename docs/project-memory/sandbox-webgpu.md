---
name: sandbox-webgpu
description: The sandbox CAN run real WebGPU (SwiftShader adapter) in headless Chromium; flags, the secure-context catch, routing
metadata:
  type: reference
  modified: 2026-10-23T23:45:47.035Z
---

Never tell mondo the sandbox can't run WebGPU (2026-10-12: "either find a way to run it or just stop trying").

Recipe (confirmed by several threads through 10-23):
- Chromium: `/opt/pw-browsers/chromium` (the old chromium-1194 path is gone).
- Args: `--enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader --use-angle=swiftshader`. Without the Vulkan/adapter flags the canvas stays black and the device is lost.
- `navigator.gpu` exists only in a SECURE context: load from http://localhost:<port>, never about:blank. Then `?ew_gpu=webgpu`.
- addInitScript: wrap GPUTexture.prototype.createView and delete `descriptor.swizzle` (sandbox Chromium throws on it).
- If the device still drops, `?ew_gpu=webgl2` (node renderer, WebGL2 backend) checks the same TSL twins.

Routing: cdn.jsdelivr.net is 403 here. npm-pack the import-map packages and route `cdn.jsdelivr.net/npm/<pkg>@<ver>/...` to them; route cdn.entropywars.net *.js/css to repo files; curl react / react-dom / THREE.MeshLine.js from cdn.entropywars.net once (without React hud.js dies with "_HRLG_SB_COLORS is not defined", a harness artefact). Ready-made: /mnt/project-files/balance/weak-races-harness/ (setup.sh, route.js, ctl.js control server).

Speed: SwiftShader WebGPU is ~2x slower than WebGL; compare counts (pipelines, shader builds) not FPS. VFX pieces get 1-2 ticks at ~1 fps: slow their clock and frame with window.playOffensiveActionCamera before shooting. Run probes one at a time. How to get ~19 fps: [[sandbox-playtest-speed]]. See [[webgpu-plan]] [[hands-on-playtest]].
