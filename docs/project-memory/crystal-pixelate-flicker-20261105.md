---
name: crystal-pixelate-flicker-20261105
description: 11-05 PR #939 crystals flickering out of pixelation = every-frame board rebuild from a cached _miscModelInstance landing; mask now rescans on any Object3D.add
metadata:
  type: project
  modified: 2026-11-05T10:55:37.229Z
---
mondo 2026-11-05 (Singularity Arena, WebGPU): board crystals "not pixelating, or flickering on and off of being pixelated".

Cause: rebuildObjects clears _objectsDirty then calls rebuildTerrainDecorations; crystal-tile clusters use _miscModelInstance, whose cached (synchronous) landing set _objectsDirty again, so EVERY crystal board rebuilt all objects + crystals every frame (measured 7/7 frames). ThreePost pixel mask only tagged new meshes every 400 ms → crystals pixelated ~1 frame in 12.

Fix PR #939 (token 20261105-crystalpix-01-cors, uploaded three-post.js f3b2be32, three-renderer.js 23754a79): _miscModelInstance in-call landing only sets _shadowsDirty (THE CACHED LANDING); three-post.js hooks Object3D.prototype.add with a counter and the mask rescans the frame after any add. Verified WebGPU (0 rebuilds/56 frames) and classic WebGL (0/71). Notes docs/notes/rendering-loading-perf.md. Shots /mnt/project-files/crystal-pixelate/.
Related [[crystal-gems-20261102]].
