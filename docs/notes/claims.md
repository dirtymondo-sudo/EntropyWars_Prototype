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
| The Estate (plot build, prompt 5 of docs/plans/HANDOFF_PROMPTS.md) | second | 2026-11-15 | built + look pass merged (seen in the browser); the Halloween pack is a prop kit now (`hw_*` rows, anyone may place them) |
| Camelot Kingdom | owner | 2026-11-15 | castle redesign 2 BUILT (not seen on screen); the next four (Keep floors, Undercroft, Sky Castle, house kinds) = plan posted, waits mondo's OK |
| The Desert | owner | 2026-11-15 | interiors build stopped partway |
| The Woods | owner | 2026-11-15 | nothing waiting: mondo kept the full trees; the cabin has no game role yet (his answer) |
| The Mountains (+ the Hollywood Hills room, the city's north beach strip in B.js beach() and EDGES.n.cap) | second | 2026-11-15 | plan 2 built: Hills room, Shasta/Olympus swap, north beach; not seen on screen, waits mondo's look |
| The Beach (`site_prebuilt_bermuda_beach`, bake-beach.js; plan 4: the Shore, the Harbour, the Ocean, the Bermuda Triangle) | second | 2026-11-15 | first delivery merged; not seen on screen, waits mondo's look |
| Disaster City (all districts, heights, residents, traffic) | owner | 2026-11-13 | several districts wait mondo's answers |
| DOOR HQ (rooms, elevator, Main Hall) | owner | 2026-11-15 | elevator redesign waits mondo's OK |
| First quest cutscenes + cutscene editor | owner | 2026-11-13 | notes fixes, ride down and foyer in progress |
| Disaster City frame rate (the Main Hall crash stays with the owner side) | second | 2026-11-15 | handed over by mondo's prompt; 36.9 FPS at 3,264 meshes after THE SPLIT STACK (#1508); notes rendering-loading-perf.md "THE SPLIT STACK" |
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
- 2026-11-15 (second, to the Disaster City holder): The Beach is one plot room now, `site_prebuilt_bermuda_beach`. The city's `harbour` door (Bayside's boardwalk) and the
  old streets' still target the retired `site_prebuilt_downtown_harbour` at `quay`; it works (the retired table lands the walker on the Beach's spawn, on its Boardwalk).
  When you next bake the city, point it at `{ room: 'site_prebuilt_bermuda_beach', at: 'quay' }`. I did not touch the city's tool, district files or block.
