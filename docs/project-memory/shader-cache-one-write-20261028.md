---
name: shader-cache-one-write-20261028
description: PR #637 (10-28) shader cache + one write; 10-29 proposals 1,2,6 built in PR #671 (late look, WebGL cache, title warm); 3,4,5 by another thread
metadata:
  type: project
  modified: 2026-10-28T08:05:54.380Z
---
mondo 10-28: frame drops / jank in battle, exploration, spells on WebGPU; asked how AAA studios get smooth frames.
PR #637 merged, token 20261028-shadercache-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261028-0805.zip (three-renderer.js ae64e744).
Answer doc: https://claude.ai/artifact/EQxGVswEfpYPhVppuAyzbi . Notes: docs/notes/rendering-loading-perf.md "THE SHADER CACHE + THE ONE WRITE".

- Cause: first build of each look's shader + pipeline, every page session (cold 4v4: 44 builds, 39 pipelines, 23 frames >1 s). Draw count is NOT the problem.
- Node renderer only (?ew_gpu=webgpu/webgl2). Classic WebGL default untouched.
- A/B, 16 looks: pipelines 5->2, frames >1 s 3->1. WebGPU battle writeBuffer 807->165 a frame.
- Kill switches: ?ew_shadercache=0, window.EW_NO_ONE_WRITE. APIs: ThreeRenderer.shaderCache() / ('clear'), ThreeRenderer.oneWrite().
- PROPOSALS awaiting mondo (not built):
  1. show late on a miss
  2. pre-build every look on the title screen
  3. one shadow shader for fading trees
  4. plate repaint rate
  5. camera 0.05 s step cap
  6. cache for the classic WebGL renderer
- 10-29 PR #671 BUILT 1 (late look), 2 (title warm), 6 (WebGL cache, localStorage ew_shaderCacheGL_v1). Token 20261029-latelook-01-cors, zip ENTROPY_WARS_SYNC_20261029-1008.zip (three-renderer.js dc156ff8). Switches ?ew_late=0, ?ew_titlewarm=0. WebGL fresh 34 -> 0 spell links in a frame; online host 29->8, guest 19->4 (rest = tree fade/shadow re-keys, still sync). WebGPU scene-pass pipelines 41->8. Node menu warm gain unproven (SwiftShader noise). Proposals 3/4/5 built by a parallel thread same day.
- Measure by counting programs linked inside renderBufferDirect (WebGL) / builds+pipelines inside _renderObjectDirect (node), never FPS. Two-seat recipe: ONLINE PVP > RANDOM TEAM > DEPLOY > FRIENDLY MATCH > CREATE ROOM; map via #friendlyMapSelect; guest JOIN ROOM, focus #lobbyJoinInput before `ph s2 type CODE`.
- Harness gotchas: `ph` draws on demand, so per-frame GPU counts need `ph draw always`. The RANDOM TEAM click can miss right after PLAY VS CPU: retry until "RANDOM SITE" shows. The Math.random seed did not give the same team after a reload. Use a fixed spell list fired with ThreeVFXEffects.fire('impact', id, {...}) for A/B.

Related [[smooth-pass-20261024]] [[sandbox-playtest-speed]] [[webgpu-plan]]
