---
name: bust-slider-20261101
description: 11-01 PR #752: Bust slider natural on classic female (baked MakeHuman target transfer), hidden on non-female bodies; MPFB female "does nothing" not reproduced
metadata:
  type: project
  modified: 2026-11-01T11:58:29.986Z
---
mondo 11-01 11:37: classic FEMALE bust went pointy; MPFB CLASSIC FEMALE natural at 100 (his reference); "doesnt even do anything" on MPFB FEMALE; remove Bust from non-female bodies.

Shipped PR #752, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1158.zip, token 20261101-bust-02-cors:
- bake-classic-bust.js (node, repo root) -> charactercreation/mpfb/mpfb_classic_bust.glb (19 KB): the MPFB breast target moved onto the classic female base by nearest triangle. three-renderer applies it only when the vertex count and a probe vertex match. The analytic lobes are removed.
- party-builder hides Bust unless the body is female; three-renderer bustBody() ignores bust on male bodies.
- MPFB FEMALE: the bust moved fine in Chrome WebGL and WebGPU, before and after, with assets served from disk and from live R2. NOT reproduced. If he says it still does nothing, ask what he is wearing (pack clothes?) and which browser. He plays Firefox, which was not tested.
Shots: /mnt/project-files/bust-slider/bust_before_after.jpg. Probe harness: playtest_creator.js routes; the DOOR Agent slot opens the creator.
Related [[character-models-plan-doc]] [[classic-mpfb-bodies-20261101]]
