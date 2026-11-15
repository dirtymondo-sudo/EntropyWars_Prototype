---
name: creator-quick-picks-20261105
description: 11-05 PR #948: creator item picks went from 5-8 s freezes to ~1 s; the rig's fit passes must keep the "settle a new garment set twice" output
metadata:
  type: project
  modified: 2026-11-05T11:55:30.765Z
---

mondo 11-05: "i click one item ... the game freezes ... like 5 seconds". PR #948 merged, three-renderer.js 6e6682b9 live, token 20261105-quickpick-03-cors.
Fixes in _createAppearanceRig: integer grid cells `_ccK` + ring-order nearest `_ccRings`; fit passes deferred to `wearFits(part, strict, twice)`
(fitLater / fitTwice); per-garment fit cache `part.wearPre`; dropped materials kept (`disposeLater`, last 48) so shaders are not recompiled;
hair readback canvases willReadFrequently.
**Why:** the old code ran every fit pass 2-3x per pick, and the passes are NOT idempotent (cords, hang, hides read what the first round left).
The shipped look = a new garment set settled twice, so wearFits runs cords + hangFit + wearUnderOuter2 + wearUnderCover a second time for a new set.
**How to apply:** any change to the fit passes: check output with a geometry fingerprint probe (positions/index/weights/normals/ewColA per garment +
body + hair, EW_DISABLE_JIGGLE = true, since jiggle re-weights by timing). Timings on the cloud box: coat 7.5 -> 1.0 s, boots 6.8 -> 0.85 s, pendant
7.9 -> 1.2 s, hair 2.2 -> 0.35 s. Remaining cost is one body rebuild (rebuildGeometry) + one fit per pick.
Notes: docs/notes/character-creator.md "THE QUICK PICKS". Related [[creator-colours-vertex-20261105]]
