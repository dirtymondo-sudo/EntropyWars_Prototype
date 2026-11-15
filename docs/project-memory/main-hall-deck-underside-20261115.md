---
name: main-hall-deck-underside-20261115
description: Main Hall upper deck (gallery) floor invisible unless you stand on it (mondo 11-15) = slab undersides built facing up, culled from below; fixed PR #1483
metadata:
  type: project
  modified: 2026-11-15T19:01:45.781Z
---
mondo 11-15: "the 3rd floor/2nd deck's floor does not show/is invisible ... it only shows when i am walking in it". Thread (thread in the owner project).

- Cause: three-renderer.js `_hqSectorMesh(..., down)` mirrored a FLAT sheet with `g.scale(1,-1,1)`: normals turned, winding did not, so every underside (mezzanine, gallery x2, soffit lip, stair landings) was back-face culled from below; the slab top faces up too, so from the deck under it nothing drew. Likely always so, not a regression of the 11-15 perf / memory / AO PRs (breaking the batches changed nothing).
- Fix PR #1483: the mirror also swaps each triangle's winding. Only caller of `down`. Token 20261115-underside-02-cors, three-renderer.js d0623ca1. Note docs/notes/hq-building-rooms.md "THE SEEN UNDERSIDE". Proof /mnt/project-files/main-hall-deck/.
- Left: the undersides now draw DARK (ceiling sheet, only the hemisphere's dark ground colour reaches a down-facing sheet; no lamp hangs under the gallery). Told mondo; hanging lights under the deck is his call.
- Useful audit (read-only, in page): for each FrontSide mesh compare the first triangles' geometric normal with the normal attribute; disagreement = a sheet that is culled from the side it is meant to be seen. Hall had only these 6.
- Harness: `ph start --gpu webgpu`, `_hqEnter({from:"play",room:"central_egress"})` loaded in ~3 min; `dev.teleport({deg,r,level:1|2,dist})` + `dev.lookAt(x,z,pitch)` (positive pitch looks UP). Repro view: teleport {deg:262,r:21.5,level:1,dist:5}, lookAt(-19.05,-11,0.2).
Related [[room-next-door-ao-20261115]] [[main-hall-far-walls-20261112]]
