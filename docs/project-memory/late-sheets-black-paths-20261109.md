---
name: late-sheets-black-paths-20261109
description: Heaven Arena black squares (11-09, PR #1067) = node-renderer terrain path sheets never re-bound after landing; also Giza + Camelot paths
metadata:
  type: project
  modified: 2026-11-09T03:14:16.644Z
---
mondo 11-09 (Firefox, ?ew_gpu=webgpu): "what are these black squares on heaven?" Thread (thread in the owner project).

- The squares were Heaven Arena's cloud PATH squares. The terrain field keeps its cliff/path/paint sheets in its node graph (_ewNodeTag D), and three r186 only re-binds a render object when its material observer sees a slot change. So a sheet that landed after the first draw stayed on three's black placeholder. Only on WebGPU / the node renderer; classic WebGL was fine.
- The bug comes and goes with load timing. Reliable repro: `?ew_gpu=webgl2` (the node renderer on WebGL2, which screenshots fine headless) + probe `ThreeRenderer.hq.dev.renderer()._textures.get(tex).isDefaultTexture`.
- Scan of 9 arenas: Giza (dirt_2) and Camelot (cobblestone) paths were black too.
- Fix: PR #1067 (three-renderer.js `_ewNodeLayer` wraps `_nodes.needsRefresh` for one FULL refresh when the node sheets' versions change; `_ewBunMat` hashes the same sheets). Token 20261109-lateSheets-01-cors, uploaded 6f947f10. Notes: rendering-loading-perf.md "THE LATE SHEETS". Proof: /mnt/project-files/heaven-black-squares/.
- Not verified on real WebGPU on screen (headless WebGPU frames are black).
