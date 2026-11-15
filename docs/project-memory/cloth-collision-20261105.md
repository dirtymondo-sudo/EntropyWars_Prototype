---
name: cloth-collision-20261105
description: 11-05 PR #932 THE CLOTH COLLISION: per-vertex GPU push of every garment out of the posed MPFB skin + layer depth order; what it can't fix
metadata:
  type: project
  modified: 2026-11-05T10:23:15.233Z
---
mondo 11-05 08:42 (furious): "Can you not just add collision to all the mpfb bodies and clothes?" Thread "Add collision between bodies and clothes" (thread in the owner project). PR #932 merged, three-renderer.js live (sha e7c123b4), token 20261105-clothcol-01-cors.

What it is (three-renderer.js, notes character-creator.md "THE CLOTH COLLISION", plan row 12w): fit-time anchor per cloth vertex on the skin (rig collideFit, 5-43 ms per clothes change) + vertex-shader push back into a band off the skin every frame (GLSL _ewColPatch, node twin _ewNodeCol), second anchor at joints (off in creases), polygonOffset by layer rank (no flicker). Board/team room/spell doubles call _ewColMark on their Lambert swaps; any NEW material swap of creator garments must call _ewColMark(mat, mesh) too. Kill-switch window.EW_CLOTH_COLLIDE.x=0 / ?ew_collide=0.

Measured: frame time unchanged within noise; cloth inside posed skin cowboy 213->136, Santa 139->121, vampire 18->7. Can't fix: tight creases (sitting seat, folded inner elbow), hand in pocket into the coat (hands aren't cloth). Arm vs thigh = PR #920 _ccArmClear.

**Why:** next clipping/flicker report should start from this system (tune band/fade in CLOTH_COL), not add another fit-time hack.
**How to apply:** headless Chromium WebGPU loads no models (even on main) — check node path with ?ew_gpu=webgl2 (same TSL). Related [[coat-flaps-mpfb-only-20261103]] [[clothes-holes-20261102]].

**WebGPU 8-buffer limit (PR #946, 11-05, token 20261105-onebuffer-01-cors, three-renderer.js 5e213b94 live):** the 7 anchor streams as separate attributes = 13 vertex buffers per garment; WebGPU max 8 -> every collided garment failed its pipeline on mondo's Firefox WebGPU, bodies showed as skin patches (under-clothes faces cut) on Select Your Team. Now ONE InterleavedBuffer (28 floats/vertex, ewColJ float), node twin falls back to plain skinning over device.limits.maxVertexBuffers. **Rule: never add a new per-vertex attribute to a skinned creator mesh without counting buffers (<=8 on WebGPU); ?ew_gpu=webgl2 does NOT catch it.** Headless chromium WebGPU (--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader --enable-features=Vulkan) can't draw the full game (device lost) but validates pipelines in a minimal three page; count buffers in-game by wrapping THREE_GPU.WebGLBackend.prototype.draw (ro.getAttributes()).
