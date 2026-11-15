---
name: dc-entertainment-la-20261115
description: Entertainment district restyled as Los Angeles (PR #1422, 11-15); what was built, what waits on mondo
metadata:
  type: project
  modified: 2026-11-15T12:52:57.165Z
---

Disaster City ENTERTAINMENT = LOS ANGELES + a Little Tokyo lantern lane (mondo 11-15 "each district based off a major city", "Build it as drawn"). Thread (thread in the owner project). See [[dc-entertainment-buildings-20261113]].

- PR #1422 merged 11-15, data.js 59439629 live. All in docs/disaster-city/districts/E.js (LA map + street block at the file's foot); notes in docs/notes/areas-complexes.md "LOS ANGELES (2026-11-15)".
- Stucco sheet is grey: pastel tints read as mud. E.js P() now gives stucco parts raw tint + arch `gain` 2.2 (as Bayside does). Other districts using lifted pastel on stucco likely have the same grey.
- HILL SIGN: PR #1424 ran mountains down the east for it; mondo 13:18 'looks terrible, a random mountain in the ocean... put the sign on the mountains in the north and remove the one you added'. PR #1429: east range gone, sign on the NORTH range (E.js `edges.sign` side n, at x 100; three-renderer _hqBuildEdgeLand THE HILL SIGN). LESSON: never add land/terrain he didn't ask for; use what exists.
- Palms block their square: put them on free yard squares, never on a one-square walk. The bake beds palm_tree props itself.
- Props with y >= 1 are left alone by exterior-polish (hung lanterns OK).
- Proof was an offline render (/mnt/project-files/dc-entertainment/la_built.jpg), not the running game.
- Waiting on mondo: OK for Meshy concepts of a searchlight and a studio water tower (studio_light props stand in; water tower is code-built).
- STARS ON THE GROUND PR #1459 (11-15, (thread in the owner project): one arch row per star + `hug: true` (data.js THE HUGGING ROWS, renderer puts each vertex on the ground). Use `hug` for flat inlays on slopes. Open: Cinema forecourt paving/handprints 1.7 m under ground at its north end (level step).
