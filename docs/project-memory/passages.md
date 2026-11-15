---
name: passages
description: THE PASSAGES (2026-10-01, PR #42): walk-through tunnels/trails/stairs/cloud roads replace thematically wrong doors; Woods stair is a weenie
metadata:
  type: project
---
mondo (2026-10-01): too many literal doors where they make no sense (Woods, Cavern). The HQ stair to the Woods IS the
doorway (no door at the top); the Woods stair should be a weenie climbing past the tree line (refs: freestanding
concrete/marble stairs in woods); other ways = passages that fade to black that you walk through; Dead Man's Cave is
a walkable tunnel. The stair landing buffer room is deleted (site_prebuilt_fairy_forest_stair).

Built in PR #42 (merged, main f757ca1), token 20261001-passages-01-cors. Way rows tunnel/trail/stairway/cloud in
DOOR_HQ.ways carry `passage`; notes docs/notes/areas-complexes.md "THE PASSAGES". New link woods_camelot (trail);
the old Camelot spring "pool" seam had already been cut before this. Clearing gen seed 11 -> 22 (keeps its 8x8 arena).
Zip: passages/ENTROPY_WARS_PASSAGES.zip (data.js, three-renderer.js), written 2026-10-01 after mondo said "write the zip".

**Why:** later threads must not re-add doors in woods/caves/clouds.
**How to apply:** new natural ways use a passage way, not a leaf door. Related: [[zones-plan]], [[level-design-plan]].

2026-10-05 (PR #111, mondo furious doors still in the woods): secret draught exits (clearing⇄ritual, redwoods⇄deadmans culvert, ritual end of woods_ritual) were missed; now trails/tunnels. data.js hqWoodsNoDoors() (end of hqRefreshComplexLinks) forces any leaf/no-way wall door in outdoor Woods rooms to a trail. Passage walk-in dims to 45% (not black), arrivals land 0.9 m outside the far mouth (camera used to sit behind the dark cards = black screen). Door sills: plan mouths past the wall + rim clamp skips door lanes. Zip woods-trails/ENTROPY_WARS_WOODS_TRAILS.zip.
