---
name: spaceship-arena-20261028
description: Spaceship Arena (prebuilt_derelict) rebuilt as a ship-shaped deck with wings/gaps/engines, PR #627 (2026-10-28); spawn choice + calls flagged
metadata:
  type: project
  modified: 2026-10-28T02:48:42.144Z
---

PR #627 (merged 2026-10-28), sync zip ENTROPY_WARS_SYNC_20261028-0248 (data.js 16209c8a, three-renderer.js eda5d3d4).

mondo said the old map was "a big slab slapped on top of a spaceship" and asked for wings, gaps and pathways, with spawns either one per wing or front vs engines.
- Room site_prebuilt_derelict_deck is now a ship plan drawn by the data.js `hqDeckPlan(rows, o)` helper ('.' void, 'o' deck, '1' raised, 'w' crate). The bow points east. It has a hull, swept wings with booms, engine pods, a raised stern deck and bridge, and two breaches.
- Gaps use the existing terrain.void, which becomes cloud_gap in battle (no new rules). base 2.5 / lip 0.6 is needed, otherwise the edge cells read as slope and drop out.
- The underside is three-renderer.js `_hqBuildStarship` (float.hull.kind 'starship').
- SPAWN CALL: one team per wing (his first option), picked by HQ_ARENA_RULES.within.prebuilt_derelict at the hull centre. Front-vs-engines was NOT built. Flagged to him.
- Other calls flagged to him:
  - the airlock tower was removed (the airlock is now at deck level)
  - the bay door moved to the starboard boom
  - the tape moved to the bridge roof
  - the scatters were dropped
  - the droid NPC was dropped
  - '426' was painted on the wings
- The stepped square outline shows as a sawtooth from a 45° camera. That is the grid, not a bug.
- Shots are in /mnt/project-files/spaceship-arena/.

Related: [[new-maps-voxel-remakes]] [[index-rules-elements-terrain-camera]]
