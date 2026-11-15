---
name: grid-fit-group3-20261026
description: Grid-fit group 3 (Haunted, Bohemian, Fairy clearing, Skinwalker, Shasta, Hollow Earth, Bermuda) shipped in PR #547; calls flagged and traps to watch in later grid-fit work
metadata:
  type: project
  modified: 2026-10-26T09:32:10.755Z
---
PR #547 (merged 2026-10-26) put group 3's seven maps on the 1.75 m squares (mondo: "redesign the maps with the square grid in mind"). Screens: /mnt/project-files/grid-fit/group3/ (plans + in-game before/after).

Calls flagged to mondo:
- Bridge ends overlap their tops by one square.
- Some stairs are now 1 square wide.
- The Fairy staircase top is 13.61 m (pitch kept).
- The Bohemian west terrace is one row longer.
- Fairy clearing grove seed 4 → 6, so the 12/10/9 arenas stay in the clearing ([[fairy-forest-room-20261024]]).
- Arena moves: Haunted 12 (1,18→3,5), Bohemian 12 (7,12→13,15), Hollow 9 (16,16→17,17). New Haunted 11.

Lessons for any later grid-fit thread:
- Moving pieces re-rolls the seeded grove/scatter (the LCG rejection sampling in data.js), which can block an arena window. Fix it by re-picking the row's seed.
- Ramp ends and climb feet that sit exactly on a top's rim break reach, because of bilinear smear on the 0.5 m field. Run group 1's proud.js, then move climbs onto the new rim. Check with verify.js (traps, tops reached, invisible walls) in /mnt/project-files/grid-fit/tools/.
- proud.js mis-writes rows when two plateaus share a line (it gave WARNs). Apply those by hand.
- A widened stair (proud) made invisible walls on the Bohemian terrace stair, so it was reverted.
