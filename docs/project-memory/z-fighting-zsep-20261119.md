---
name: z-fighting-zsep-20261119
description: Flickering textures (z-fighting) on building walls 11-19 = coplanar faces in plot-built buildings; fixed PR #2165 by _hqZSep lift pass; ground flicker by Bayside sea wall unconfirmed
metadata:
  type: project
  modified: 2026-11-19T14:09:38.857Z
---
mondo 11-19: z-fighting on building walls, some on ground ((thread in the owner project)). SHIPPED PR #2165, three-renderer.js 7c5eba60, token 20261119-zsep-02-cors.

- Cause: exact coplanar faces (separation 0, not depth precision) in arch rows + plot shells: ceilings on roof undersides, wall on wall, window on wall. His colonnade screenshot = Disaster City x 133 z -19.
- Fix: `_hqZSep` in `_hqBatchBuild` lifts the smaller face 1.2 cm. Off switch window.EW_HQ_NO_ZSEP. Notes rendering-loading-perf.md "THE ZSEP". Proof /mnt/project-files/z-fighting/.
- His 2nd picture (Bayside sea wall ground strip): a sweep found no overlapping ground there. If he still sees it, suspect shadow acne at low sun (normalBias 2.4).
- Probe lessons: a full Disaster City load nearly fills the cloud's memory; use --nogltf for sweeps, kill leftover chrome between runs (pkill -9 -f chrom), never two probes at once. To aim at a point, wrap renderer.render to swap in your own camera.
