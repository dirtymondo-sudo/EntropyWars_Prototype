---
name: desert-gates-20261122
description: Desert entrances/exits pass (PR #2418, 11-22): the engine draws the next room's road past EVERY open seam game-wide; Desert gate roads + signs; what is left
metadata:
  type: project
---
Thread (owner-project id) "Desert entrances and exits", from mondo 2026-11-22: "Every single entrance/exit in the game needs to look good and natural". Shipped PR #2418, live. He has not reviewed it yet.

WHAT EVERY THREAD SHOULD KNOW (engine-wide, three-renderer.js `_hqBuildEdgeLand` / `_hqSeamSection`):
- Any open seam on a wall (`way:'open'`, wall n/s/e/w) now draws the NEXT room's road past the room line by itself, in that room's sheet and lane lines. A written `terrain.edges.roads` row at the same place wins. Opt out: `edges.seamRoads: false`.
- The land in a seam's lane is level with the gate, with no mesa or range on it; the road stops at sea.
- The ground lattice's outer ring is unpainted: grass/flora there read the node one row in (was a grass band across roads at route ends).

THE DESERT (bake-desert.js seam rows): `road: {sheet, lanes, len, rects, lines, move}` lays a road from a gate to the district's streets; `sign: 'WORDS'` = small green board, `post: true` = wooden signpost. Signs name the destination only (GIZA, AREA 51 ...): my choice, not his words.

**How to apply:** after ANY change at a gate, re-walk it both ways with playtest_city.js `walk`; never edit game .js while a probe is running (red CODE MISMATCH page). Notes: docs/notes/areas-complexes.md "THE ROAD OF THE NEXT ROOM RUNS ON". Pictures: /mnt/project-files/desert-gates/. Related: [[road-gates-walked-20261122]], [[raised-highway-20261122]].

LEFT (my judgement): the Ranch Road and Coast Road run on over a low mound past Western Town / Giza; the DH legs are still ground-level roads (raising them waits for his go, see raised-highway memory).

ROUND 2 (PR #2424, live): mondo on the first pictures: "do you not see what is wrong with this picture???? 1 road going straight into the middle of 2 roads??? seriously????" (a two-lane gate road ran into the median of the six-lane divided highway; MY MISS: I checked materials and walks, not whether the lanes matched). He picked "Highway narrows before the gate" on a card. Done: route spec `taper: {"<end id>": {len, hold}}` in bake-route.js (DH1-DH4 both ends, R9's Circus end); the lane past a gate is graded down to the land (no mound).
RULE (my reading): where two roads meet at a gate, the LANES must match on both sides, not just the material. Look at every gate picture for that before showing him. When DH legs get raised, keep `taper`.
