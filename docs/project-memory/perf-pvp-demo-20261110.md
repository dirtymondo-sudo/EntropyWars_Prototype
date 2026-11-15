---
name: perf-pvp-demo-20261110
description: PvP demo frame rate (weak Chrome PC = classic WebGL renderer): PR #1100 ground texture-read skip + light reach skip, measured shares, how to time/A-B shaders in the sandbox, open AO question
metadata:
  type: project
---
Thread "Improve frame rate on the weak Chrome PC" (thread in the owner project) (item 4 of mondo's "All" to the PvP demo list, 11-10). Notes: docs/notes/rendering-loading-perf.md "THE WEIGHTED SHEETS + THE LIGHT'S REACH". Files + tools: /mnt/project-files/perf-pvp-demo-20261110/.

KEY FACT: the friend's Chrome runs the DEFAULT classic WebGLRenderer (ew_gpu unset); mondo plays the node renderer (?ew_gpu=webgpu). Plan 1's AO skip is node-only, so it does nothing for the friend. Check which renderer a perf fix lands on.

Measured (Mount Shasta Arena 12x12 4v4, classic, 1280x720, llvmpipe): 172 draws, 425K tris, 15 renders/frame (scene 1, N8AO 7, SMAA 3, tilt-shift 2, ray source 1, frame 1). Screen passes ~20% (N8AO ~13%), the GROUND ~30% (fills the screen; triplanar 9-17 reads at 8x aniso + Phong x 13 point lights). A fight has 13 point lights: 5 dark spares (intensity 0) + 8 unit lights reaching 2.5 squares.

SHIPPED PR #1100 (token 20261111-lightreach-01-cors, three-renderer.js 0abf6573 live):
- THE WEIGHTED SHEETS: terrain sheet reads with weight < 0.0005 skipped, textureGrad/.grad() with derivatives outside the branch; classic + node. Off live: window.EW_TERRAIN_ALL_SAMPLES = true.
- THE LIGHT'S REACH: classic only, ShaderChunk lights_fragment_begin patch; point light skipped when black or pixel past distance. Off: localStorage ew_lightsEveryPixel='1' + reload.
- Proof: pixel diffs of at most 1/255 on under 0.4% of pixels; whole fight frame 395 -> 350 ms (11%) software raster. No real GPU timed. True WebGPU run: ground draws, no shader errors.

AO AT ZERO SHIPPED PR #1101 (11-11, mondo tapped "Turn it off at 0"; token 20261111-aozero-01-cors): three-post.js _ppAoLive, the classic pmndrs chain's N8AO (was floored at intensity 0.5) rests at AO strength 0: 15 renders/frame -> 8, fight frame 376 -> 330 ms software raster. Off live: window.EW_AO_AT_ZERO = true.

STILL ASKED of mondo: F3 Copy readouts from a battle on his Mac AND the friend's PC, to pick anything further (Plan 3 unpicked).

Sandbox lessons: (1) rAF intervals quantise to 16.7 ms and gl.finish() is a no-op in Chrome: time first renderer.render to a 1-px readPixels (tools/gt.sh). (2) three's program key does not hash ShaderChunk text: to A/B a chunk live, give every lit material a new customProgramCacheKey + needsUpdate (tools/chunk3.js), else you measure the same program. (3) the cloud checkout's local origin/main ref can be stale: git fetch origin main BEFORE branching. (4) lens kinds off + post off gives bit-identical frames for pixel diffs (tools/grab.js, cmp.js).
Related [[perf-options-webgpu-20261109]] [[sandbox-playtest-speed]] [[perf-lens]]
