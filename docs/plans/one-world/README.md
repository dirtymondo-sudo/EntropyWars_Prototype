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
- Numbers: about 1,173 plots in the game today; 577 stay as they are, 596 get re-laid out, 501 are new.
