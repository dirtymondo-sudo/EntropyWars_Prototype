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
| The Estate (plot build, prompt 5 of docs/plans/HANDOFF_PROMPTS.md) | second | 2026-11-15 | first delivery merged (`site_prebuilt_skinwalker_estate`, bake-estate.js); not seen on screen, waits mondo's look |
| Camelot Kingdom | owner | 2026-11-15 | castle redesign 2 waits mondo's OK |
| The Desert | owner | 2026-11-15 | interiors build stopped partway |
| The Woods | owner | 2026-11-15 | trees wait mondo's reaction |
| The Mountains (+ the Hollywood Hills room, the city's north beach strip in B.js beach() and EDGES.n.cap) | second | 2026-11-15 | plan 2 built: Hills room, Shasta/Olympus swap, north beach; not seen on screen, waits mondo's look |
| The Beach (plot build: the Shore, the Harbour, the Island; `docs/plans/world-zones/beach-layout.json`) | second | 2026-11-15 | claimed; plan 1 waits mondo's OK, nothing built |
| Disaster City (all districts, heights, residents, traffic) | owner | 2026-11-13 | several districts wait mondo's answers |
| DOOR HQ (rooms, elevator, Main Hall) | owner | 2026-11-15 | elevator redesign waits mondo's OK |
| First quest cutscenes + cutscene editor | owner | 2026-11-13 | notes fixes, ride down and foyer in progress |
| Disaster City frame rate, Main Hall crash | owner | 2026-11-15 | waits mondo's F3 numbers |
| Everything else | free | | ask mondo which side takes it |

## Notes between the sides
- 2026-11-15 (owner): the owner side was mostly paused on 11-15 (usage limit). Rows above stay with the owner side
  until mondo hands one over; when he does, he pastes its prompt from docs/plans/HANDOFF_PROMPTS.md and the second side
  changes the row here.
- 2026-11-15 (second, to the Woods' holder): the Estate is one plot room now, `site_prebuilt_skinwalker_estate`. The Woods' `estate` door
  (bake-woods.js) still targets the retired `site_prebuilt_skinwalker_fields` at `bay`; it works (the retired table lands the walker on the
  Estate's spawn, just inside its north gate). When you next bake the Woods, point it at `{ room: 'site_prebuilt_skinwalker_estate', at: 'woods' }`.
  I did not touch the Woods' tool or block.
- 2026-11-15 (second, to the Disaster City holder): on mondo's OK I changed two things in the city: `districts/B.js` beach() (THE NORTH BEACH: boardwalk + sand along
  Entertainment, cy 4N..8N in Bayside's frame) and `bake-disaster-city.js` EDGES.n.cap (off 0, len 36). The city's mountain road (link `downtown_mountains`) now lands in
  `site_prebuilt_shasta_hills`; new link `downtown_cove` at the boardwalk's north end. Nothing else in the city was touched.
- 2026-11-15 (second, to the Woods' holder): the Mountains' Trailhead plot is `P13-07` now (door id `woods` unchanged, so bake-woods.js needs no change).
