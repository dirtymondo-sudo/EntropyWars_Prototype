# One World: build plan and thread briefs (17 Nov 2026)

How to build the One World map (`README.md`, `one-world-v13.html`) across threads. mondo OK'd the map; phases 3 to 5
wait for his OK on the test slice.

## Overview

**What gets built.** Walkable plots only: the districts, the roads and the wild links. The unnamed land between them
stays scenery seen past the plot edges (mondo, 17 Nov).

- About 1,173 plots are in the game today (the room grids in data.js `HQ_ZONE_MAP`).
- 433 stay as they are: Disaster City with the Hills, the Beach, the Vatican, the Catacombs, Hell, Antarctica, the North Pole.
- 740 get re-laid out: zones whose districts the map spreads apart or reshapes, the Desert included (mondo 17 Nov: its
  districts stand apart in v13, so it is re-laid, not "stays"). Their contents move with them.
- 501 are new: routes 247, wild links 51, underground walks 98, islands 60, the Colosseum 9, the Internet 36.

**Threads.** About 20, no more than 6 at once: every zone bake writes data.js, so more at once mostly means more merge
clashes.

| Phase | Threads | Model | Starts when |
|---|---|---|---|
| 1. Foundation: world positions, the route and link kit, room splitting, stitching | 1 | Fable | now |
| 2. Test slice: the south Woods, County Lane, the Corn Fields to the Lake | 1 | Fable | phase 1 merged |
| 3A. Re-lay the surface zones | 7 | Opus | mondo OKs the test slice |
| 3B. Re-lay the zones below and off the map | 6 | Opus | wave 3A merged |
| 4. New plots: routes, islands, underground walks, the Colosseum, the Internet | 4 | Opus | phase 2 OK'd; beside 3B |
| 5. Whole-world pass: joins, frame rate, memory, map sheets, a walk end to end | 1 | Fable | everything else merged |
| 6. Dressing passes: an exterior pass + an interior pass on every re-laid zone (list below) | one a zone | Opus | phase 5 merged |

Fable for the threads that design or judge (foundation, test slice, final pass); Opus for the ones that follow a clear
spec once the kit exists (zone re-layouts, routes). Fable runs on the second account.

## Rules every thread follows

1. **Fresh check first.** `git fetch origin main && git merge origin/main`, then `node fresh-check.js` (CLAUDE.md RULE #1d).
2. **The claims board.** Read `docs/notes/claims.md`. Take your rows in your first PR; never touch a row the other side
   holds (leave a note at its bottom instead). Free the rows when you finish.
3. **The design.** Everything is in `docs/plans/one-world/`: `gen.js` holds every plot coordinate, `one-world-v13.html`
   explains it, `sheets/` shows it.
4. **Keep the plot counts.** A district keeps every plot and everything on it; only where its plots stand changes.
   Never delete content mondo didn't name.
5. **Old rooms retire in the same PR.** New rooms ship -> old rooms into data.js `DOOR_HQ.retired`; saves, the map and
   doors point at the new ones.
6. **Small PRs, merge main often.** Merge main before each merge, resolve clashes by hand keeping both sides, never
   force-push main.
7. **Delivery.** Commit, push, PR, merge, bump `?v=`, `node sync-zip.js --upload` (CLAUDE.md RULE #1).
8. **Proof.** Visual changes get a `probe-fast.js` run and a picture with the `[EW BUILD]` HEAD line (RULE #1c).
9. **Models and names.** `MODEL_LIST.md` and the pack files first. Never invent characters or game rules; new names are
   marked as ideas and kept plain.
10. **Notes.** Lasting facts go in the matching `docs/notes` file (areas-complexes.md for zones) in the same PR.
11. **Join more (mondo, 17 Nov, after the test slice).** A card between two places that touch is wrong. Districts, routes and links that touch
    stand in ONE room, until a number stops you: two zones never join; a box of 12 x 12 plots; 30 plots; 12 plots in one straight open row; 2,500
    draw calls and 12 M triangles at the heaviest view; 1.4 GB of models + rigs. The full rule, who writes a joined room and how to measure one:
    `docs/notes/areas-complexes.md` "ONE WORLD, THE ROOM-SPLITTING RULE". The slice's two joined rooms are the pattern (`bake-woods.js` `STAND`,
    `docs/areas/routes/R7.json`).
13. **Open ground has no portal (mondo, 17 Nov).** A seam in open country (salt flat, grass, sand, snow, a road) is `way: 'open'`: you walk off the
    edge into the next room. An arch only on a forest wall, a cliff or a building. The route kit does it by the ground; a zone tool names it.
14. **One place on every route plot (mondo, 17 Nov).** The route kit lays it (`ow-places.js`; names are ideas, marked). A route's spec may name them.
12. **Walk every seam you write.** A door that resolves in data is not a door you can walk through. `playtest_city.js` has a `"walk"` view for it.

## Phase 1: the foundation (1 thread, Fable)

```
Build the foundation for the One World map (version 13, approved by mondo). Read docs/plans/one-world/README.md,
BUILD_PLAN.md (follow its "Rules every thread follows"), open one-world-v13.html and look at sheets/ first. The
unnamed land between districts stays scenery (not walkable); Avalon is scrapped. Take the claims rows for the map /
directory and world layout. Do this, in small PRs:
1. Extract the design from gen.js into docs/plans/one-world/plots.json: every district's plots (name + world plot
   x,y), every route, wild link and underground walk as plot lists, every way down/up, every island. This is what the
   zone threads read. Add the extract as a mode of gen.js (node gen.js --plots) rather than a copy by hand.
2. Give every plot-built room a world position so a room knows its neighbours and what lies past each edge. Extend
   data.js HQ_ZONE_MAP (wx, wy) rather than adding a new table.
3. Write the room-splitting rule: when a zone's districts stand apart on the map, which become their own rooms and
   which stay joined, how doors and edges between them work, and how big a room may get (memory budget, _mm*).
4. Build THE ROUTE KIT as a repo tool like the bake tools: it takes a list of plots and writes a walkable route room,
   dressing each plot from its ground kind (forest, scrub, snow, grass, desert, rock) with pack models from
   MODEL_LIST.md, in three looks: highway, road, trail. A wild link is a trail one plot wide.
5. Make the horizons read the map: each room's edges show the right ground kind and its true neighbours (_hz* builders).
6. Write the rules for the zone threads into docs/notes/areas-complexes.md under "ONE WORLD, THE ZONE MOVES": how to
   move a district's plots to new coordinates without losing anything, and how to retire old rooms.
Don't move any zone yet; that is the test slice's job. Prove the route kit on one short stretch of trail with a picture.
```

## Phase 2: the test slice (1 thread, Fable)

**BUILT 17 Nov 2026.** Report: `TEST_SLICE_REPORT.md` (read it before phase 3 or 4). The brief below is kept as it was given.

```
Build and walk the One World test slice. Read docs/plans/one-world/README.md + BUILD_PLAN.md, the foundation notes
("ONE WORLD, THE ZONE MOVES" in docs/notes/areas-complexes.md) and plots.json first. Take the claims rows for the Woods
districts C and M, the Estate districts C and L and their tools.
The slice: the Clearing, Dead Man's Cave laid out as the creek bed to the Storm Drain, the wild link from the Fence
Line, the Corn Fields as the walk south to the Hub, County Lane (route R7) and the Estate's Lake. Move the districts'
plots to their v13 coordinates with everything on them, build County Lane and the link with the route kit, stitch the
edges and doors.
Then measure: walk times (Clearing to the Lake by the corn and by County Lane, the creek to the city's edge), frame
rate and memory per room, load time, what the horizon shows from each end. Fight once on a trail plot. Report with
pictures and numbers, and say plainly what felt wrong. Don't move any other zone; this decides whether the size and
spacing stay.
```

## Phase 3: re-laying out the zones (13 threads, Opus, wave A 7, wave B 6)

```
Re-lay out ZONE for the One World map. Read docs/plans/one-world/README.md + BUILD_PLAN.md, docs/notes/areas-complexes.md
("ONE WORLD, THE ZONE MOVES" and the zone's own sections), plots.json and the test slice's report first. Take the
claims rows for the zone's tool and every district file.
WHAT CHANGES (from the table). Move each district's plots to its v13 plot coordinates with everything on them, split
the zone into rooms by the foundation's rule, build its wild links with the route kit, stitch the doors and edges,
point the ways down / up at their new spots, retire the old room into DOOR_HQ.retired in the same PR. Keep every plot
and everything on it. Rerun node bake-map.js for the new rooms and --put their pictures. One picture per new room.
```

| Wave | Zone | What changes | Tool and district files |
|---|---|---|---|
| A | The Woods (36) — **BUILT 2026-11-17** (areas-complexes.md "THE WOODS, ONE WORLD PHASE 3") | four districts become paths: the Clearing hub, the Redwood Trail up to the Snowy Pass, the Ritual Ground ring, Dead Man's Cave the creek (skip what the slice moved) | `bake-woods.js`, `docs/areas/woods/districts/C T G M.js` |
| A | Camelot Kingdom (64) | castle + village stay; the Snowy Pines north, the Looking-Glass Garden west to the coast, the Fairy Forest east to the Spring, the Forest south | `bake-camelot.js`, `docs/areas/camelot/districts/N L F W.js` |
| A | The Estate (36) | the Haunted House as a drive, the Ranch south with the barn hatch; Corn Fields + Lake from the slice | `bake-estate.js`, `docs/areas/estate/districts/C L H R.js` |
| A | The Mountains (96) | Olympus, the Snowy Pass, the Ski Lodge, Shasta as climbs along the range; the North Pole stays | `bake-mountains.js`, `docs/areas/mountains/districts/O P K S.js` |
| A | Leylines (81) | districts round the plateau, the ley line from Giza through all of them (moved, not reshaped) | `bake-leylines.js`, `docs/areas/leylines/districts/G B S Y T Z.js` |
| A | The Desert (144) | the Circus, Western Town, Area 51 and Giza stand apart (v13: 6,21 · -4,26 · 2,33 · 13,29); the Highway re-routes between them as route plots (thread 4.2) | `bake-desert.js` + `bake-desert-insides.js`, `docs/areas/desert/districts/C W A G.js` |
| A | The Sewers (30) | districts spread under the city districts they belong to; the Holding Cells reach the tunnel way in the creek | `bake-sewers.js`, `docs/areas/sewers/districts/W T H O R.js` |
| B | The Cavern (36) | the Cavern under the Woods + the wells, Hollow Earth under its sun, Agartha under the Lemuria adit; cave walks join them | `bake-cavern.js`, `docs/areas/cavern/districts/K H A.js` |
| B | The D.U.M.B. (49) | bases on the tube: P3 by the city, Command under Area 51, Research under the Barn, Sub-Level 7 under Shasta, CERN's Ring under Stonehenge | `bake-dumb.js`, `docs/areas/dumb/districts/K P S R C.js` |
| B | The Deep (40) | Atlantis under the Triangle, the Sea Floor off the Harbour, the Trench towards the rim, joined by the sub | `bake-deep.js`, `docs/areas/deep/districts/C R S T.js` |
| B | Heaven (20) — **BUILT 2026-11-17** (areas-complexes.md "HEAVEN, THE ONE WORLD MOVE": one room, 26 plots, rising north-east) | the cloud districts stand apart above the Vatican | `bake-afterlife.js` (Heaven room), its Heaven district files |
| B | Outer Space (72) — **BUILT 2026-11-17** (one room you fly the Spaceship through, PR #1959) · **THE ROUND WORLDS 2026-11-17** (mondo: "round worlds first", from his two-maps design doc: each world a ball you walk all the way round; the MOON is round now, 24 plots = six faces of 2 x 2 plots; Mars, Saturn and the Singularity next; new planets after; areas-complexes.md "OUTER SPACE, THE ROUND WORLDS") | each world's districts become landing sites the Spaceship flies between | `bake-space.js`, `docs/plans/world-zones/draw-space.js`, `docs/areas/space/districts/` |
| B | The Astral Realm (36) — **BUILT 2026-11-17** (areas-complexes.md "THE ASTRAL REALM, THE ONE WORLD MOVE"; mondo: one room, the chain Sea · Library · Nightmare) | three islands with two crossings; + **THE CUBE** (mondo 11-17): a Rubik's cube floating high over the middle of the Cloud Bridge, its broken pieces round it, a rising stair of them up to its top; the fight on it is on all six faces (areas-complexes.md "THE CUBE"; battle side + placement BUILT 11-17) | `bake-astral.js`, `docs/areas/astral/districts/S L N.js` |

The zones that stay as they are only get their world position and edges, which phase 1 does.

## Phase 4: the new plots (4 threads, Opus)

```
Build PART for the One World map with the route kit. Read docs/plans/one-world/README.md + BUILD_PLAN.md, the
foundation notes ("ONE WORLD, THE ZONE MOVES"), plots.json and the test slice's report first. Take a claims row for
your part. Build each route from its plot list with the kit's look (highway, road or trail), add the places on the way
by hand from the page's list (a well, a mill, a camp: marked as ideas, plain names), stitch both ends to the zones
they join, rerun node bake-map.js. One picture a route.
```

| Thread | Part | Plots |
|---|---|---|
| 4.1 | North routes: R1 River Road, R2 Canyon Trail, R3 Pilgrim Way, R4 Old Road, R5 Polar Trail, R12 Stone Path | 118 |
| 4.2 | South routes: R6 Valley Road, R8 Ranch Road, R9 Badlands Highway, the Desert Highway (74 plots, re-routed between the Desert's districts after its wave A thread) | 68 |
| 4.3 | Coast + islands: R10 Coast Road, R11 Delta Causeway, the new islands (Pirates' Cove, the Frozen Sea, the Volcano Island's move, the Triangle's move), the Round Voyage stops | 46 + 60 |
| 4.4 | Below + between: the underground walks (98: the Bone Passage secret walk, the Outfall, the Holding Cells to the tunnel way), the Freight Line late-game ride, the Colosseum (9), the Internet (36) | 143 |

R7 County Lane is built by the test slice. Wild links between districts belong to the phase 3 zone threads.

## Phase 5: the whole-world pass (1 thread, Fable)

```
Do the whole-world pass on the One World map, now that every zone, route and link is merged. Read
docs/plans/one-world/README.md + BUILD_PLAN.md and the reports of every phase first.
1. Walk the world end to end (Camelot to the Beach, the Snowy Pass to the Desert) and through each underground loop.
   List every seam: a door that lands wrong, an edge showing the wrong neighbour, a gap, a cliff you can't pass.
2. Measure frame rate, memory and load time in every new room, worst first, and fix what is over budget.
3. Remake the map sheets (node bake-map.js for every room, data.js HQ_ZONE_MAP) so the in-game map matches the design.
4. Check the map's GO to every zone lands where it should, and that saves and old doors point at the new rooms.
5. Free every claims row the build used; write "ONE WORLD, BUILT" in docs/notes/world-layout.md.
Report with pictures, numbers, and a short list of what still feels wrong.
```

## Phase 6: the dressing passes (one thread a zone, after phase 5)

mondo 11-17 (on the new Bug Colony): "that is fine for now but that tree looks terrible and this will definitely need
exterior/interior passes later, make sure thats in the plan". Phases 3 + 4 move and lay plots; how a place LOOKS gets
its own passes once the world stands. Every zone gets an EXTERIOR pass (buildings, landmarks, ground, props, the
rules in owner-rules.md) and, where it has insides, an INTERIOR pass (atmosphere, light, props, missing models listed
then made, like Disaster City's second insides pass). Named items, add to this list as they come up:

- **Leylines, Bug Colony (district B, `docs/areas/leylines/districts/B.js`)**:
  - EXTERIOR: the Giant Tree looks terrible (mondo 11-17). Remake it as a real tree, not drawn cylinders and domes: a
    proper trunk model or a built mesh in bark, real boughs, a leaf canopy (look at the painted trees,
    areas-complexes.md "THE PAINTED TREES", and MODEL_LIST.md for a big tree first). Also check the shelf-fungus walk,
    the Hive's shell, the Anthill mound, the Meadow and the Bee Yard.
  - INTERIOR: the Hive (`site_prebuilt_gobekli_hive`) is dim and brownish (brighter honey-gold light, real brood
    cells, honey); the Ant Nest (`site_prebuilt_gobekli_nest`) has drawn eggs and larvae, so make models for them.

