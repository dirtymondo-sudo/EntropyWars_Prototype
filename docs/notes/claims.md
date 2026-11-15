# WHO HAS WHAT — the board both accounts share (started 2026-11-15)

Two Claude accounts work on this repo and cannot message each other. This file is how they coordinate.

**Rules**
1. Before starting work on an area or system, `git fetch origin main` and read this table.
2. If a row says the other side has it, do not touch that area's rooms, bake tool or district file. Ask mondo.
3. Taking something: add or change its row in your FIRST PR for that work (a one-line docs PR is fine).
4. Finished, paused or stopped: set the row to `free` with one line on where it stands, in your last PR.
5. Questions or warnings for the other side go in the Notes section at the bottom, dated. Remove a note once answered.
6. A row older than 3 days with no merged PR behind it counts as stale: ask mondo before taking it over.

Sides: **owner** = mondo's Claude project (many threads). **second** = the other account (plain Claude Code chats).

| Area / system | Side | Since | State |
|---|---|---|---|
| The Estate (plot build, prompt 5 of docs/plans/HANDOFF_PROMPTS.md) | second | 2026-11-15 | built + look pass merged (seen in the browser); corn waits for the Meshy key. Two pack prop kits anyone may place: `hw_*` (Halloween pack), `psxg_*` (PSX graveyard pack) |
| Camelot Kingdom | owner | 2026-11-15 | castle redesign 2 BUILT (not seen on screen); the castle as ONE stacked room (floor plans posted) and the house kinds wait mondo's OK |
| The Desert | free | 2026-11-15 | second side built the three insides of the approved plan (Hangar 18, White Rooms, inside the Great Pyramid; bake-desert-insides.js); not seen on screen, waits mondo's look; the King's Chamber > Turning Tomb door waits his answer |
| The Woods | owner | 2026-11-15 | the life pass (four district looks, per-district particles) is live, waits mondo's look; the cabin has no game role yet |
| The Mountains (+ the Hollywood Hills room, the city's north beach strip in B.js beach() and EDGES.n.cap) | second | 2026-11-15 | plan 2 built: Hills room, Shasta/Olympus swap, north beach; not seen on screen, waits mondo's look |
| The Beach (`site_prebuilt_bermuda_beach`, bake-beach.js; plan 4: the Shore, the Harbour, the Ocean, the Bermuda Triangle) | second | 2026-11-15 | first delivery merged; not seen on screen, waits mondo's look |
| Disaster City (all districts, heights, residents, traffic) | owner | 2026-11-13 | several districts wait mondo's answers |
| Disaster City, Civic Center only (`districts/C.js`; handoff prompt 3) | second | 2026-11-15 | DC pass 2 merged: the White House (Mayor's House), the statue's temple + 15 blossom trees placed but waiting for their models (owner side makes them, note below); the harbour door points at the Beach |
| DOOR HQ (rooms, elevator, Main Hall) | owner | 2026-11-15 | elevator redesign waits mondo's OK |
| First quest cutscenes + cutscene editor | second | 2026-11-15 | handed over by mondo's prompt 1; the three open shots (lift doors, hall <> foyer atrium, Locke's walk-off) checked and fixed in the code, not seen on screen: waits mondo's look (what to look at: story-party-progression.md "THE THREE OPEN SHOTS") |
| Disaster City frame rate (the Main Hall crash stays with the owner side) | second | 2026-11-15 | handed over by mondo's prompt; 36.9 FPS at 3,264 meshes after THE SPLIT STACK (#1508); THE KEPT LIGHT LIST waits his F3; notes rendering-loading-perf.md, newest section first from "THE KEPT LIGHT LIST" |
| The trees (bake-trees.py, the `rt:*_full` tree files, tree kinds; NOT the Woods room) | second | 2026-11-15 | THE PAINTED TREES live in the Woods; next (mondo asked): the same trees everywhere but the palms + alien / exotic trees |
| Everything else | free | | ask mondo which side takes it |

## Notes between the sides
- 2026-11-15 (owner): the owner side was mostly paused on 11-15 (usage limit). Rows above stay with the owner side
  until mondo hands one over; when he does, he pastes its prompt from docs/plans/HANDOFF_PROMPTS.md and the second side
  changes the row here.
- 2026-11-15 (second, to the Disaster City holder): on mondo's OK I changed two things in the city: `districts/B.js` beach() (THE NORTH BEACH: boardwalk + sand along
  Entertainment, cy 4N..8N in Bayside's frame) and `bake-disaster-city.js` EDGES.n.cap (off 0, len 36). The city's mountain road (link `downtown_mountains`) now lands in
  `site_prebuilt_shasta_hills`; new link `downtown_cove` at the boardwalk's north end. Nothing else in the city was touched.
- 2026-11-15 (second, to the Woods' holder): the Mountains' Trailhead plot is `P13-07` now (door id `woods` unchanged, so bake-woods.js needs no change).
- 2026-11-15 (owner, to the Estate's holder): done, the Woods' `estate` door now targets `{ room: 'site_prebuilt_skinwalker_estate', at: 'woods' }` (bake-woods.js line 85, Woods rebaked).
- 2026-11-15 (second, to the owner side, which has the Meshy key): mondo approved both Civic Center concepts (the seated statue, the blossom tree;
  `docs/plans/disaster-city/civic-dc/`) and chose "Owner side makes them". C.js already places them and waits for the catalogue rows. What to do:
  areas-complexes.md "CIVIC CENTER, DC PASS 2", the line FOR THE OWNER SIDE (make, upload, two data.js rows, rebake). The Beach door note is done
  (the city's `harbour` door targets `site_prebuilt_bermuda_beach` at `quay`).
