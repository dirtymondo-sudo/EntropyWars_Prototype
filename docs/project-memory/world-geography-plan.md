---
name: world-geography-plan
description: WORLD_GEOGRAPHY_PLAN.md (2026-09-28): one baked land replaces the stitched outdoor zones; sketch 2 layout, the sight rule, phases G0-G12 (G0-G9 done), forks, bake-land.js
metadata:
  type: project
  modified: 2026-09-28T05:01:56.841Z
---
mondo (2026-09-27) rejected the open world's layout: "stitched together and not an actual map". He wants
routes between places, big relief, discovery by sight (crest a hill and see a new area), sloped city
streets, NO invisible walls, the Deep around the map with an ice wall border, Loch Ness at the estate,
rivers to the sea, a ring highway, and Skyrim-like dungeons (no puzzles).

Plan: WORLD_GEOGRAPHY_PLAN.md + WORLD_GEOGRAPHY_MAP.jpg at the repo root; copy, views and shots in project folder
open-world/geography/. Its sketch/ generator is RETIRED: G0 made it the repo tool `bake-land.js` (recipe = data.js `HQ_LAND`).

- **Sketch 2 (2026-09-28):** Bayside Mall on the bay's beach; the Strip in the desert (Downtown -> highway -> Strip -> Rachel ->
  Area 51, not visible from the Strip); Bermuda far out; a 1.8 km storm drain joins the woods to Downtown; woods split in three. Fork 11 new.
- **Sketch 3 (mondo: no rings):** the Strip one straight boulevard, Area 51 under one Groom chain; more forests. Don't bring back
  ring-shaped enclosures: break sight with single ridges and forest.
- **Rules.** R2 THE SIGHT RULE (a pad sees other ground only for summits, lookouts, the same region, across the sea),
  tested on every bake. R3 NO INVISIBLE WALLS (every refusal needs something drawn within 0.45 m).
- **Replaces** OPEN_WORLD_PLAN §4.5 and the outdoor zones; keeps that plan's engine.
- **G0-G4 DONE** (zips in open-world/geography/): G0 `npm run bake-land` bakes HQ_LAND to Assets/Land/ (exits 1 on a rule
  breach), test land-bake; G1 portals `_hqCull*` + memory budget `_mm*`; G2 foyer `street` door -> room `land`, `_hqLand*` renderer,
  bucket sheets; G3 water `hqLandWater*` (land-water test); G4 flora `hqLandFlora*` / `_hqFlora*`, G4b GPU grass (land-forest test).
- **G5-G8 DONE 2026-09-28/29** (zips G5-G8 in open-world/geography/): G5 roads `_hqRoads*` (land-roads test); G6 sites on the land,
  wall-audit R3 (pre-existing heavy reds: mall prop lights, lookingglass crag, downtown docks sill); G7 city/harbour on the land,
  hq-coast test deleted (city-slopes test); G8 edge of the world, R4 (land-edge test).
- **G9 DONE 2026-09-29** (zip geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G9.zip, token -14-cors, delta on G8, bake e6f6667c8a; only
  land.json changed under Assets/Land): region grid, reveal points, R6 stops (bake findSpot clamps stops inside their gap), title
  cards, atlas fog (fork 9 on), save key door.hq.land. Also fixed G8 bug: land flora failed to arm (read removed F.grass). Test land-discovery.
- **Order.** Next G10 dungeons.
- **Forks (§8).** None ruled. Defaults: ice wall border; scale as sketched; Cyberpunk stays a door; Vatican on the
  land; Flat Lands seen, not reached; keep the Glen and Loch Head viaducts; no car; textures = bucket sheets (ruled); map fog of war on.

**Why:** mondo wants the world to be real geography with discovery, not rooms joined edge to edge.
**How to apply:** read the plan's §3 rules and §7 order before any outdoor, map or dungeon work, run `npm run bake-land`
after any recipe edit (it exits 1 on a rule breach), and append to §12 per phase. See [[open-world-plan]] for the engine it builds on.
