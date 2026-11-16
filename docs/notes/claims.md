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
| The Estate, the tool + shared pieces (bake-estate.js, docs/areas/estate/layout.json: the corn wall + its pines, levels, paint, sky, every way out) | free | 2026-11-16 | split into district files on mondo's order 11-16 (areas-complexes.md "THE ESTATE, THE DISTRICT FILES"; the room is byte for byte the same). Nobody changes these without a dated note at the bottom of this file. The corn waits for the Meshy key. Two pack prop kits anyone may place: `hw_*` (Halloween pack), `psxg_*` (PSX graveyard pack) |
| The Estate, district C · The Corn Fields (`docs/areas/estate/districts/C.js`) | free | 2026-11-16 | built + look pass seen: tracks, crop circles, the Hub, the Scarecrow, five people. Thin: four of nine plots carry almost no dressing; no corn-stalk model (Meshy) |
| The Estate, district L · The Lake (`districts/L.js`) | free | 2026-11-16 | built: the lake, dock, Boathouse (walk-in), Marsh pools, picnic ground, the Loch Ness Monster. Not seen on screen: the monster, the Boathouse inside. No reeds, lily pads or shingle yet |
| The Estate, district H · The Haunted House + Graveyard (`districts/H.js`) | free | 2026-11-16 | built + look pass seen: the house (solid; its five floors are the old rooms), Crypt (walk-in), gazebo, iron gate, treehouse, both graveyards, nine people. Crypt inside and night not seen |
| The Estate, district R · The Ranch (`districts/R.js`) | free | 2026-11-16 | built + look pass seen: Barn + Farmhouse (walk-in, no upstairs), hen house, windmill, paddock, hay field, kitchen garden, two people. No trough, no gate leaf or cattle grid; insides not seen |
| Camelot Kingdom | owner | 2026-11-15 | castle redesign 2 + the castle as ONE stacked room (`site_prebuilt_camelot_palace`) + five house kinds BUILT, seen on screen in part; the sky castle waits mondo |
| The Desert | second | 2026-11-16 | the highway is built on mondo's OK (12 x 12 plots, four exits, overpass, signs, cars; areas-complexes.md "THE DESERT, THE HIGHWAY"); seen in the browser, waits his look. Open: no door leaf draws in the probe ("THE LOOK PASS") |
| The Woods | owner | 2026-11-15 | the life pass (four district looks, per-district particles) is live, waits mondo's look; the cabin has no game role yet |
| The Mountains (+ the Hollywood Hills room, the city's north beach strip in B.js beach() and EDGES.n.cap) | second | 2026-11-15 | plan 2 built: Hills room, Shasta/Olympus swap, north beach; not seen on screen, waits mondo's look |
| The Beach (`site_prebuilt_bermuda_beach`, bake-beach.js; plan 4: the Shore, the Harbour, the Ocean, the Bermuda Triangle) | second | 2026-11-15 | first delivery merged; not seen on screen, waits mondo's look |
| Disaster City (all districts, heights, residents, traffic) | owner | 2026-11-13 | several districts wait mondo's answers |
| Disaster City, Civic Center only (`districts/C.js`; handoff prompt 3) | second | 2026-11-15 | DC pass 2 merged: the White House (Mayor's House), the statue's temple + 15 blossom trees placed but waiting for their models (owner side makes them, note below); the harbour door points at the Beach |
| DOOR HQ (rooms, elevator, Main Hall) | owner | 2026-11-15 | elevator redesign waits mondo's OK |
| First quest cutscenes + cutscene editor | second | 2026-11-15 | handed over by mondo's prompt 1; the three open shots (lift doors, hall <> foyer atrium, Locke's walk-off) checked and fixed in the code, not seen on screen: waits mondo's look (what to look at: story-party-progression.md "THE THREE OPEN SHOTS") |
| Disaster City frame rate (the Main Hall crash stays with the owner side) | second | 2026-11-15 | handed over by mondo's prompt; 36.9 FPS at 3,264 meshes after THE SPLIT STACK (#1508); THE KEPT LIGHT LIST waits his F3; notes rendering-loading-perf.md, newest section first from "THE KEPT LIGHT LIST" |
| The trees (bake-trees.py, the `rt:*_full` tree files, tree kinds; NOT the Woods room) | second | 2026-11-15 | THE PAINTED TREES live in every room and battle map (palms, bare trees, Christmas pines unchanged); next (mondo asked): alien / exotic trees |
| World layout + zone order (docs/notes/world-layout.md; survey only, no zone is built or held by this row) | second | 2026-11-16 | survey merged: recommends The Sewers next, then Heaven + Hell + Vatican, then The D.U.M.B.; waits mondo's pick. Door loose ends for each holder are in its section A2 |
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
- 2026-11-16 (second, to the Disaster City holder): the Desert's highway now reaches the city as EXIT 1, at the Desert's north wall x -105 (the same x as Southside's South Street way out; link `downtown_desert`, only its Desert end moved). Nothing in the city's tool, district files or block was touched. A road sign for the Desert at the city's way out would be yours.
- 2026-11-16 (second, to the Disaster City frame rate holder): one engine line changed outside any row, on mondo's "fix the slow probes": three-renderer.js
  `_hqSeatLater` now waits 12x the last seat pass's cost (THE SEAT'S SHARE, rendering-loading-perf.md). All harnesses launch through `probe-fast.js`;
  playtest_city.js needs no `--wait=150000` / `EW_NO_MODEL_QUEUE` (PLAYTEST_NOTES "THE FAST PROBE").
- 2026-11-16 (second, to the Estate's former holder, the "Estate zone plot-build" thread, and to every district thread): on mondo's order ("every single zone needs to be like that. now. so we can work in parallel") the Estate's single row is now five rows above and bake-estate.js loads `docs/areas/estate/districts/{C,L,H,R}.js`. Any unmerged Estate work written against the old one-file tool: merge main and move it into the matching district file (the code moved word for word; `BARN` / `FARM` live in R.js, the house's handle is `BUILT.house`).
