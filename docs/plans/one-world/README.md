# One World: the map design (version 13, 17 Nov 2026)

mondo's approved world map: one continent on a disc inside the Ice Wall, radius 44 plots (528 battle squares, about 3.7 km across).
One plot = 12 x 12 battle squares = 42 m. Coordinates are plots: x east, y south, Disaster City's north-west corner at 0,0.
The size is FROZEN until the test slice has been walked (BUILD_PLAN.md phase 2).

What is here (copied from the owner project's files so both accounts can read it):

| File | What it is |
|---|---|
| `BUILD_PLAN.md` | How to build it: 5 phases, the rules, a brief to paste for every thread. START HERE. |
| `one-world-v13.html` | The whole design page (open it in a browser): every sheet, every route with its reason, the zone table, the underground, beyond the map. |
| `sheets/*.png` | The sheets as pictures: `closeup` (west half, every plot named), `terrain` (ground kinds), `travel` (player's map), `surface` (builder's master map), `underground`, `section`, `beyond`. |
| `gen.js` | The generator: every district, path, route, wild link, underground walk and island in plot coordinates. `SHAPES` = the plot-by-plot districts (each plot named), `LINKS` = wild links, `ROUTES` = the roads, `UGD` / `UGWALK` / `UGRIDE` / `UGLOOP` / `UGWAYS` = below. `node gen.js` rewrites the SVGs + `mapdata.json` beside it. |
| `plots.json` | **What the zone threads read** (`node gen.js --plots` writes it; never edit by hand). Every district's plots: name, world plot x, y, and `was` = the plot's id in the game's room today; every route, wild link and underground walk as plot lists in walking order with what each plot `meets`; every way down / up; every island; the ground letter of every plot of the disc. How to use it: `docs/notes/areas-complexes.md` "ONE WORLD, THE ZONE MOVES". |
| `mapdata.json` | gen.js output: every surface room (`SURF`, with `plots` lists for the shaped districts), islands, route plot counts, district names and zones. |
| `build-page.js` + `page_v8.src.html` | Rebuild `world-map-redesign.html` from the SVGs (`node gen.js && node build-page.js`). |

mondo's decisions on it:
- Only walkable plots get built: districts, roads, wild links (about 900 of about 2,800 land plots). The unnamed land between them stays SCENERY seen past the plot edges (17 Nov).
- Districts keep every plot and everything on them; only where the plots stand changes.
- Avalon is scrapped (17 Nov). Names marked "mine" in the page are placeholders by Claude.
- Numbers: about 1,173 plots in the game today; 433 stay as they are, 740 get re-laid out (the Desert is re-laid, mondo 17 Nov), 501 are new.

## The foundation (phase 1, built 17 Nov 2026)
What the zone threads use, all explained in `docs/notes/areas-complexes.md` "ONE WORLD, THE ZONE MOVES":
- `plots.json` (above): every walkable plot, with the plot id each one has in the game today.
- data.js `HQ_ZONE_MAP`: every room's world place (`wx, wy`; `wait: 1` = not moved yet), the ground letter of every plot of the
  disc, and the lookups `hqOwRoom` / `hqOwAt` / `hqOwPast` / `hqOwNear` (a room's neighbours and what lies past each edge).
- The room-splitting rule: which districts share a room, the seam-id door pairs, how big a room may get.
- `bake-route.js`: the route kit (highway, road, trail), dressed by each plot's ground kind. Proof: `proof/trail_L3_*.jpg`.
- `terrain.edges.world`: a room's horizon is the map's own ground, plot by plot. Proof: `proof/edges_from_above.jpg`.
- `ow-census.js`: the count before and after a move, so nothing on a plot is lost.

## The test slice (phase 2, built and walked 17 Nov 2026)
`TEST_SLICE_REPORT.md` = what was built, the walk times, the draw and memory numbers a room, what the horizon shows, the fight on a trail
plot, and what felt wrong. **Read it before any phase 3 or 4 work.** Six rooms stand at their v13 places: the Clearing, Dead Man's Cave (the
dry creek), the Corn Fields with County Lane down their middle, County Lane's road to the Lake, the wild link L8, the Lake.
- `ow-move.js` (repo root): the plot mover. A zone tool builds its home room as before, then stands plots at their world places with it.
- `bake-woods.js` and `bake-estate.js` each end in THE ONE WORLD MOVE: the pattern for every other zone tool.
- `docs/areas/routes/R7.json` + `R7.js`, `L8.json`: the route kit's specs for the slice.
- `docs/areas/woods/move/before.json`, `docs/areas/estate/move/before.json`: the counts before the move.
- Notes: `docs/notes/areas-complexes.md` "ONE WORLD, THE TEST SLICE" (the mover, the strays, the seams, the corrected rule 5).
Phases 3 to 5 wait for mondo's OK on the report; its "What it settles" asks him one thing: join more rooms, or keep the split as it is.

