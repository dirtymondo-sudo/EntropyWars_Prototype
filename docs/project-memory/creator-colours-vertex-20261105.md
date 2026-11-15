---
name: creator-colours-vertex-20261105
description: Creator worn-piece colours must ride vertex colours, never material colour (PR #923, 11-05): stage material swaps whiten them
metadata:
  type: project
  modified: 2026-11-05T09:20:48.047Z
---

2026-11-05, PR #923 (token 20261105-vcolor-01-cors, three-renderer.js 906c23b5 live): mondo "tinted clothes appear white" on
Select Your Team. Cause: team room / board / race actors swap the creator rig's materials for a Lambert copy whose colour = light
level (board resets it every frame for AP grey), so wear tint, Blender coat colour, beard, wings, cord colours kept on
material.color went white whenever garments were cached. Fix: rig `wearVC(mesh, color)` writes a per-mesh colour attribute
(x baked shade), material colour white; `wearMap` keeps the stage copy's emissiveMap in step; team room `_trLookMats` swaps
late-loading garments every 0.5 s.
**How to apply:** any NEW coloured creator piece must colour through wearVC / vertex colours, not material.color.
Battle board still leaves late-loading garments on the creator material (not swept) — not reported, left alone.
Related [[wear-tint-20261101]]
