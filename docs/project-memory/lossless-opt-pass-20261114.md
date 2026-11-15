---
name: lossless-opt-pass-20261114
description: 11-14 every game-loaded GLB without an .opt.glb got a LOSSLESS copy (optimize-assets.js --lossless), PR #1385; how to rerun the gap check
metadata:
  type: project
  modified: 2026-11-14T11:00:38.459Z
---
Thread (thread in the owner project) (mondo 11-14: optimize every model with no optimized version, for creator + Disaster City load).
- PR #1385 LIVE, token 20261114-optall02-cors. 1,513 copies on R2 `Assets/opt/<sha8>_<name>.opt.glb`, ASSET_MANIFEST alt rows; 786 MB -> 577 MB.
- New mode `optimize-assets.js --lossless`: NO gltf-transform round trip (it pads 3/6-byte attributes -> InterleavedBufferAttribute, breaks
  creator wear `_N`/`_D_*` `.array` reads; reorder breaks mpfb_classic_bust / mpfb_shapes vertex ranges). Meshopt per view in place,
  PNG -> lossless WebP, JPEG untouched, byte+pixel verified. No KTX2 flag so the creator (wear/hair `_ktxNoCompress`) takes them.
- mondo's hard rule kept: compression must not change how a model looks (proof sheet 0 px diff, project files optimize-models/).
- Skipped on purpose: 400 unused per-character Meshy animation exports (3.1 GB); interior-pass Meshy props already meshopt+WebP in place.
- Rerun: list bucket via CF API, compare GLBs to manifest files/.opt siblings/alt, run `--lossless --check --flat <mirror>/Assets/opt --root <mirror>`,
  `sync-zip.js --put`, add manifest rows by script (never `manifest --merge` on a partial mirror), `list-models.js --r2`.
- Viewer gotcha: GLTFLoader mesh order varies per load (async), so see-through meshes at one spot can swap draw order between any two loads.
Related [[perf-city-propchunks-20261114]] [[r2-layout-plan-20261104]]
