# WORLD GEOGRAPHY PLAN: THE LAND

Written 2026-09-28 for mondo's request of 2026-09-27 (quoted in full in §1), and revised the same day for his
layout changes (§1b: the bayside mall, the Strip in the desert, Area 51 past it, Bermuda farther out, the woods
reshuffled, the storm drain, Shasta south). The map and views are sketch 2. This is a plan: nothing in it is
built yet. It replaces the geography of OPEN_WORLD_PLAN.md (§4.5 and the outdoor zones) and keeps that
plan's engine (§6 here says exactly what stays and what goes). Phases append to §12.

The map to argue with: `WORLD_GEOGRAPHY_MAP.jpg` (repo root, beside this file). The full-size map, ten 3D
views and the generator that made them are in the project folder `open-world/geography/`.

---

## 0. THE VERDICT

The world feels stitched together because it is. Today every outdoor place is a rectangle, 21 to 300 m
on a side, with edges joined to its neighbours. The relief inside a rectangle is under 9 m, and a
rectangle's edge is a wall you can't see. There is no ground between places, so there can be no hill to
hide the next place and no valley to cross on the way to it. Rearranging the same rectangles would give
the same world.

The fix is **ONE LAND**: a single heightmap for the whole world, baked offline from a recipe, streamed in
tiles and drawn at several levels of detail. Everything outside is one continuous ground, like
ZyFou/ProceduralTerrains. The places that exist today sit on it as sites on flattened **pads**. Roads,
lanes and trails join them; rivers run from the mountains to the sea; forests and ridges hide one region
from the next. The sea surrounds the land, and an ice wall surrounds the sea.

A working sketch of this land already exists (§11). It is a 4 m heightmap with erosion, rivers, a loch,
graded roads and switchbacks, forests, and a sight test that checks what can be seen from where. It
proves that the layout in §4 works:
- From HQ you see only the tops of Olympus and the Downtown towers (and the summits).
- Camelot appears only when you crest Area 14.
- The Strip appears only when the desert highway comes through its valley's gap; before that you see its towers over the ridge.
- Area 51 appears only from Area 17, and never from the Strip, not even its hangar tops.
- Loch Ness and the estate open up when the trees part on Trail G.
- Nine places see no other place at all from their own ground.

**Size.** The land is 7.08 km² inside a 5.6 km disc: about 3.2 km east to west and 3.2 km north to south
(Area 9 runs south to 1.74 km). Heights run from 356 m on Olympus down to −177 m in the Deep.
- On foot (running) a kilometre takes about 3.5 minutes. On the skateboard it takes about 1.5.
- Route 1, the ring road, is 5.8 km: 21 minutes running, about 8 on the board.
- Disaster City to Area 51 is about 2.2 km of road (Route 1, the desert highway, Route 6): 8 minutes
  running, 3.5 on the board. As the crow flies it is 1.33 km (it was 0.87 km in sketch 1).

---

## 1. WHAT MONDO ASKED FOR, AND WHERE THIS PLAN ANSWERS IT

> "regarding the open plan, so far the world just kinda feels disconnected and i dont like the layout of the map. It feels stitched together and not an actual map. There need to be trails or routes in in between places. There is not enough difference in height elevation between places. There should be cliffs and valleys. Rolling hills. Areas should be separated by sight, like the fist time I discover a place in the open world needs to be a huge moment like getting to the top of a hill or a clearing and seeing there's a whole other area ahead of me. Right now it's like I get into the woods and everything is within view and I can see where the other areas are immediately. There's no big elevation changes or a deep ditch or a hill to block the next area or anything like that. Same with the urban areas, there is one street in the cyberpunk city that goes down like a ramp, and thats it. The rest of the urban area is completely flat. We need more streets like that. And in the forest and the woods there are a lot of invisible walls. I hate that. There are buildings placed that look like they form alleys but they wont let me walk through them. Change that. The player needs to have a constant sense of discovery. Right now there is no reason to explore because you walk into an area and immediately see the entrance to another area in clear view, so you can just walk straight to it. Design the city better. Design the world better. Design the woods better. Design anything else you worked on better. Design the map better. The deep should be an ocean all the way around the map, or at least a big part of it. Antarctica needs to be at the bottom of the map. The north pole at the top. Maybe Antarctica can be like the flat earth ice wall and go all the way around the map and that can be the world borders. But id be okay with the map surrounded by ocean or mountains too. Add a lake at the estate with woods surrounding it (Loch Ness). Add some rivers on the map connecting to the deep, maybe coming down some mountains. You know, like actual geography like i originally requested. Like why is the highway just one long straight road straight to area 51 and nothing else? It needs to actually go around the city and the map to different places. The sewer and the cavern and the leylines etc can to be like their own dungeons like in skyrim. But same rules as above apply to them. [...] https://github.com/ZyFou/ProceduralTerrains [...] https://github.com/jeromeetienne/threex.grass/tree/master"

| Ask | Answer | Where |
|---|---|---|
| Not stitched; an actual map | One land, one heightmap; sites on pads; no rectangle edges outdoors | §3 R1, §5.1–5.2, §5.7 |
| Trails and routes between places | Route 1 (the ring), 6 roads, 6 lanes, 11 trails; every place on a route | §4.4 |
| Height differences, cliffs, valleys, rolling hills | 356 m of relief; Area 13 cliff (60 m); Area 7; Canyon 1 canyon; Area 10; erosion | §4.2, §4.6 |
| Discovery as a "huge moment" | THE SIGHT RULE and seven reveal points, checked by a test on every bake | §3 R2, §4.7, §5.11 |
| Can't see the next area's entrance | Nine places see no other ground; others see only summits, lookouts and places across the sea | §4.7 |
| Sloped city streets | Disaster City on a hill falling 58 m to the harbour; streets carry height; terraced lots; stair streets | §5.8 |
| No invisible walls | Nothing outside stops you unless you can see it at that spot; audited by a test | §3 R3, §5.9 |
| Alleys that block | Every gap between buildings is either walkable or closed by a drawn wall | §5.8 |
| Constant discovery | Something every 150–250 m of route; the map fills in as you see places | §3 R6, phase G9 |
| The Deep all round | The ocean surrounds the land; the Bermuda triangle is far out in the south-east | §4.1 |
| Antarctica at the bottom, the North Pole at the top, an ice wall border | The ice wall rings the world; the Antarctic shelf lies inside it to the south; the frozen Arctic and the Pole to the north | §4.1, fork 1 |
| Loch Ness at the estate, with woods | Loch Ness fills Area 7: 0.7 km long, 30 m deep. The estate is on its south-east shore and the woods come down its north side | §4.5 |
| Rivers from the mountains to the Deep | River 1 (Olympus to the east coast), River 2 (Shasta to the loch, with falls), River 3 (loch to the sea, with falls), River 4 (desert to the south coast) | §4.5 |
| The highway goes round the map | Route 1 loops 5.8 km through the kingdom, the woods, the glen, Area 8, the desert and the city | §4.4 |
| Dungeons like Skyrim, same rules | The storm drain and the sewers (Dead Man's Cave is its mouth in the woods), the Cavern, the ley lines and the D.U.M.B. as dungeon zones with mouths on the land. No puzzles | §5.13, phase G10 |
| ProceduralTerrains | Its ideas are reimplemented, not copied (licence note in §5.1): noise stack, erosion, spline carving, water, props, fog | §5 |
| threex.grass | Its crossed-quad tuft idea, rewritten for three r128 with instancing and wind | §5.5 |

### 1b. The layout changes (mondo, 2026-09-28, on sketch 1)

> "let's continue with the world geography plan. I want the mall to be a bayside mall by the beach. Let's move the strip out of disaster city and into the desert area, like Las Vegas. The bermuda triangle should be further away from the bay so you actually have to go find it. Connect the woods to downtown, with dead man's cave (sewer) being the connection point. The fairy forest needs to be the closes woods to Camelot, the ritual stuff closer to the estate. Let's move Mt shasta south a but to differentiate it from Mount Olympus more. Area 51 is still too close to disaster city. It needs to be disaster city > highway > desert highway > the strip (vegas) > and then area 51 somewhere."

| Ask | Sketch 2 | Where |
|---|---|---|
| A bayside mall by the beach | THE BAY: the harbour's inlet opened into a real bay (about 450 m across, 400 m deep) with a sand beach on its south shore. THE BAYSIDE MALL stands on its own pad behind the beach at (1205, 548), 5 m up, reached by Route 7 from Downtown along the shore. The lighthouse moved to the bay's south head. The mall is no longer behind Downtown's street doors | §4.2, §4.3, §5.8 |
| The Strip out of the city, into the desert, like Las Vegas | VALLEY 1: the Strip runs down the desert highway on the floor of a valley ringed by desert ridges (the ring that held Area 51 in sketch 1). You see its towers over the ridge from Route 1, Area 13 and Route 2; its streets only when the highway comes through the valley's east gap (reveal 4) | §4.2, §4.7 |
| City > highway > desert highway > the Strip > Area 51 | Route 1 leaves the city south and west under Area 13; THE DESERT HIGHWAY turns off it, rounds Hill 1, enters the valley by its east gap, runs the Strip, leaves by the south gap and crosses AREA 9 (new land, south of sketch 1's coast) to Area 16; ROUTE 6 goes on to Area 51 in its own ring of hills by Lake 1, with Area 17 beside it. Area 51 is 1.33 km from Downtown and 0.61 km past the Strip, and neither can see the other | §4.4 |
| Bermuda farther from the bay | The triangle moved from 0.4 km off the bay's coast to the far south-east Deep, 0.9 km from the mall and 1.25 km from the harbour, behind the land from both (the bay can't see it). You find it by sailing south round Area 9, or you spot it from Area 17 | §4.1 |
| The woods to Downtown through Dead Man's Cave (the sewer) | DEAD MAN'S CAVE is the upper mouth of THE STORM DRAIN: a 1.8 km drain under the highlands from the woods' east edge (by Route 1) to the Sewers under Downtown, and out at the harbour's outfall. It falls the whole way (R7) | §5.13 |
| The Fairy Forest nearest Camelot; the ritual stuff nearer the estate | THE FAIRY FOREST is the woods' north-east corner across River 1 from Camelot: the clearing (320 m from Camelot, by Trail C and a footbridge), the Redwoods, the Staircase and Dead Man's Cave. AREA 6 is on Loch Ness's north-west shore, across the water from the estate: Bohemian Grove (364 m from it) and the Ritual Ground (299 m), on Trail F off Trail G | §4.2, §4.3 |
| Shasta south, away from Olympus | Mt Shasta moved 330 m south to (−1040, −440), on the woods' west side above the ritual woods: 1.23 km from Olympus and clear of Area 2. The Cavern and the creek (now River 2) moved with it | §4.3, §4.5 |

### 1c. Sketch 3 (mondo, 2026-09-28, on sketch 2)

> "not a fan of how the strip and area 51 both have rings around them. Why dont we add more forest area and move some of the areas in the woods to other forests so they're not all bunched up in that side of the map and you can break up the line of sight more."

| Ask | Sketch 3 | Where |
|---|---|---|
| No ring round the Strip | The valley's ring is gone. The Strip is one straight boulevard, north to south, on an open valley floor (38 m), and the desert highway runs straight down it. The SPRING MOUNTAINS stand 350–450 m to the west as a backdrop, pines on the crest (Area 12); Hill 1 (pines on its crown) hides the Strip from the city. From Area 13 and Route 1 only its towers show; its streets open at the valley floor | §4.2, §4.4, §4.7 |
| No ring round Area 51 | The ring at Area 51 is gone. RANGE 1 is one chain on the north-west and north of Lake 1, pines on top; Area 17 stands east; the lake is open to the south and the sea. The desert highway runs through PASS 1 between the range's east end and the pass hills (pines) to Area 16. The range hides Area 51 from the Strip, Area 13 and the highway | §4.2, §4.4 |
| More forest, the woods' places spread out | Forest went from 15 % to 16 % of the land, in four new forests: AREA 3 (north-east, across River 1 from the Vatican: THE REDWOODS moved there, on Route 12 from the Bowl); AREA 4 (south-east, below Hill 1, behind the mall: THE STAIRCASE moved there, on Trail E off Route 7); AREA 11 on the ridge between HQ and Downtown (HQ no longer sees the skyline); and the desert's pines on Area 5, Hill 1, Range 1 and the pass hills. The west keeps three woods: the fairy forest (the clearing, Dead Man's Cave), the deep woods (Shasta, the Cavern), the ritual woods (Bohemian Grove, the Ritual Ground) | §4.2, §4.3 |

---

## 2. WHY TODAY'S WORLD FEELS STITCHED (read from the code, 2026-09-28)

D = data.js, R = three-renderer.js. The "measured" numbers come from headless compiles through load-data.js.

### 2.1 The invisible walls
| # | What you see | What stops you | Where |
|---|---|---|---|
| a | Grass running on to a treeline | The part's edge. `_hqSurface` returns null at `S.w/2 − HQ_BODY_R − 0.08`. The treeline starts 1.4 m further out and adds no blockers; the city skyline outside the shell is "pure scenery". `roam` widens only the compiled grid and `_hqSurface` never reads it | R:50517, D:22497, R:41314-60, R:42556-59, D:44938 |
| b | An open trail between two woods parts | The join. Only `span − 2 × HQ_STAGE_PAD (1.5 m)` is walkable, about 3 m of a 6 m trail, but the thicket mouth is cut 6 m wide. Outside a span the shared edge is a wall. Parts that touch without a join (the trail and the stair) are a wall along their whole edge | D:41359-71, R:56700, D:40892-99, D:45136-39, D:40883-84, R:57886 |
| c | A grassy hump at the edge of a woods room | The `wallH` bank (1.7–1.9 m) keeps the grass sheet. The walker is refused by `maxSlope` 1.0 and the 0.62 m step. Thicket trees grow on a 2.1 m lattice; 27–56 % of bank samples have no tree within 1.6 m, so bare grass blocks | D:43498, D:44248-54, D:44264, D:45456, R:50605, D:44668 |
| d | An alley between two buildings | The city mask is solid over the whole block, and buildings add no blockers. Slits the alley pass can't close stay solid (`closedFail`): 21 in Cyberpunk and 23 in Downtown. Of the mask-edge cells, 16.4 % in Cyberpunk (846 of 5,174) and 13.5 % in Downtown (681 of 5,046) have no building, wall or cliff in front of them | D:44107-10, D:43521, R:42243, D:44374-78, D:44452-75, D:44597-632 |
| e | A log, a tent, a tree | Authored footprints, not measured ones. A 3.6 m fallen log blocks as a 0.5 m disc; a measured blocker uses `max(ex, ez) × 0.45`; trees have no top | R:47908, R:48006, R:42163, R:42131-38 |

### 2.2 Flat
- **The city is flat.** `podium:false`, street noise amp 0.05, kerb 0.12 m (D:44245-46, D:33339). All the
  relief there is comes from authored plateaus. Cyberpunk's one sloped street is an authored `ramp` from 0
  to −4 m into a sunk plateau (D:33878-79).
- **The generator can't do slopes.** Street points carry no height, each lot's base is sampled once, and
  the alley march refuses more than 0.4 m of change (D:44412).
- **The woods are flat.** Measured ranges: the clearing −0.8 to 5.1 m, the Grove −1.0 to 6.4, Shasta −0.9
  to 8.7. Noise is ±0.2 m, and the zone offsets between parts are −2.2 to +0.05 m (D:40881-89).

### 2.3 Everything in view
- Fog closes most rooms at 60–150 m (densities 0.011–0.03/m), but far shells draw neighbouring parts at
  0.3 × the fog (D:40436). The next place's ground shows through the fog, and nothing stands between
  because there is no land between.
- Weenies are scale models hung about 75 m out at true bearings (R:43398), not things on a map.

### 2.4 The shape
- The highway is two 80 × 210 m parts running straight south to Area 51.
- The woods are seven parts packed within 100 m of each other.
- The whole surface fits in about 750 × 700 m.
- The rectangle is built in everywhere: `hqTerrainFeet`, `_hqCamBlocked`, `_hqNavBounds`, the shadow fit,
  and the outer ground (D:45434, R:50761, R:51311, R:54860).

---

## 3. THE RULES (every phase, every test)

**R1. ONE LAND.**
- Everything outdoors is one heightmap baked from one recipe.
- A site is a pad on the land: a flattened patch at a set height, blended into the land around it.
- Interiors stay rooms behind door joins. Dungeons are their own zones behind a mouth.
- No outdoor place is a rectangle with an edge.

**R2. THE SIGHT RULE.** Discovery is built into the ground.
- From any place's pad, you may see:
  - another place's ground only if that place is a **summit** (Olympus, Shasta, Area 17), a **lookout** (Area 13, Area 14), in the **same region**, or across **open sea**;
  - the **tops** of weenies (Olympus, the Downtown towers, Babel, the haunted house's gable).
- The first sight of a region's ground happens at a **reveal point**: a crest, a pass, the edge of the
  trees, or a bend in a canyon. The road or trail climbs to it and the view opens.
- The bake's sight test checks this from every pad and along every route every 8 m, with forest canopy
  counted as 20 m and city blocks as 28 m. A bake that breaks it fails its test.

**R3. NO INVISIBLE WALLS.** The walker is stopped only by something drawn at that spot, at least body high:
- a cliff face (slope over 1.0, always drawn with the cliff material);
- a building wall, fence or rail;
- a tree trunk (its measured radius) or a rock (its measured hull);
- the ice wall.

Water deeper than wading depth means you swim; it never stops you. Bushes, ferns, grass and crops never
block. The wall audit test samples every refused step and fails if nothing is drawn within 0.45 m.

**R4. THE EDGE OF THE WORLD IS A THING YOU CAN SEE.** The Deep surrounds the land and the ice wall
surrounds the Deep. You can swim or sail to the wall and touch it. Nothing ends in fog or a void.

**R5. ROUTES.**
- Every place is on a route, and every route leads somewhere.
- Route 1 loops.
- Grades: roads climb at most 10 % (highway 7.5 %, lanes 12–14 %); trails stay walkable (at most 1.0 locally, with benches and steps).
- Long climbs switch back.
- A road leaves the ground on a bridge only over water or where it is more than 7 m above the ground.
- No route runs straight for more than 400 m.

**R6. DISCOVERY DENSITY.** Along every route there is something every 150–250 m: a landmark, a view, a
ruin, a camp, a wreck, a waterfall pool, a dungeon mouth, a fork in the road. **No puzzles** (the standing
rule). These are places to find, not tapes or finds to pin in tests.

**R7. WATER RUNS DOWNHILL.**
- Rivers fall steadily from source to sea or loch.
- A lake has one level and an outlet.
- A drop is a waterfall, drawn as one.
- The sea is at 0 m.

**R8. SLOPED CITIES.**
- A city sits on the land's slope; its streets carry height.
- Every district has at least one street steeper than 6 %, and at least one stair street or ramp.
- No district is flat.

**R9. DUNGEONS OBEY R2, R3 AND R7 UNDERGROUND** (§5.13).

**R10. THE STANDING RULES.**
- No dev shortcuts that change what the player sees or decides.
- No work spent preserving tapes, finds or old saves.
- Missing engine infrastructure gets built (mondo, 2026-09-26: an "AAA game engine").
- Online PvP is untouched: the land is story-mode exploration. Battles on it use the same field window as today.

---

## 4. THE GEOGRAPHY (the sketch; x east, z south, y above sea level, all in metres)

See `WORLD_GEOGRAPHY_MAP.jpg`. Coordinates are the sketch's and will move a little when G0 re-bakes at
finer resolution; the relations (what hides what) are what the test pins.

### 4.1 The shape of the world
- **The disc.** 5.6 km across, with the land slightly north of centre.
- **The ice wall.** A ring of radius 2,600 m, 92 m high and 150 m thick, pulled 250 m south so the
  Antarctic shelf has room inside it.
- **ANTARCTICA.** The shelf along the south inside the wall: ice 11 m above the sea with a ragged front.
  The research station (`antarctica_station`) stands on it at (110, 2190).
- **THE FLAT LANDS** (`flatlands_plain`) are on top of the wall at (110, 2440). Fork 5 decides whether you can
  climb there.
- **THE ARCTIC.** Frozen sea north of Area 2, from about z −1,700 to the wall. The North Pole
  village (`northpole_village`) stands on the ice at (0, −2150). The only way north is Trail I.
- **THE DEEP.** Ocean all round the land, to −177 m.
  - Offshore islands lie west and east.
  - The Bermuda triangle is far out in the south-east Deep, over its own trench, with the cay (1320, 1440), the
    Flying Dutchman (1500, 1580) and the whirlpool (1410, 1625). It is 0.9 km from the Bayside Mall and
    1.25 km from the harbour, and the land between hides it from the whole bay: you sail south round the
    deep desert to find it (or spot it from Area 17). Today's door to Atlantis and the other deep places can
    stay on the whirlpool.

### 4.2 The regions
| Region | Ground | What it is | What hides it | First seen from |
|---|---|---|---|---|
| AREA 1 | 70–110 m | Rolling moor in the middle; D.O.O.R. HQ at 85 m; every road starts here | Its own edges: Area 13 cliff south, Area 7's rim west, Area 14 north, Ridge 1 | You start here |
| THE KINGDOM | valley 25–60 m | Camelot on a knoll in River 1's loop under Olympus | The Crown's brow (111 m) | 3 · AREA 14 |
| AREA 2 | 150–356 m | Olympus (356 m, snow above 245 m), peaks to the north-west and north-east, Trail I | Nothing: it is the weenie | Its tops, from nearly everywhere |
| AREA 10 | 40–110 m | Chalk downs east of the kingdom; Stonehenge in a hollow; Vatican City on a hill over River 1 | The downs' ridge (a 106 m plateau) | 5 · ROUTE 9 (the stones); the last bend of the Via (the Vatican) |
| THE WOODS | 30–140 m; Shasta 254 | Dense forest on the west, in three parts. **THE FAIRY FOREST** (the north-east corner, across River 1 from Camelot): the clearing and Dead Man's Cave. **THE DEEP WOODS** under Shasta: Mt Shasta and the Cavern. **AREA 6** on Loch Ness's north-west shore, facing the estate across the water: Bohemian Grove and the Ritual Ground | The canopy | Only from inside the trees; the clearing from Trail C's last bend |
| AREA 7 | floor 18–30 m; rims 60–100 m | Loch Ness, the estate on its shore bench, the haunted house above, Area 15, River 3 falls, Bridge 7 | The glen's walls and the woods | 4 · TRAIL G (and Route 5's end) |
| AREA 8 | 40–90 m | Red-rock mesas, Canyon 1 canyon, Göbekli Tepe's tell | Mesas and the canyon | Route 1 rounding the glen's foot |
| THE DESERT | 10–60 m | River 4 valley; Giza's plateau; Babel by the south coast; the dunes | Area 13 (96 m falling to 36 m) | 2 · AREA 13 |
| VALLEY 1 | floor 38 m; Area 5 150–190 m | Las Vegas: THE STRIP, one straight boulevard down the desert highway on an open valley floor; Area 5 (pines on the crest) to the west, Hill 1 (pines) to the north-east | The valley floor sits low under Area 13; Hill 1; only the casino towers show from above | 4 · THE DESERT HIGHWAY |
| AREA 9 | 20–60 m; Area 17 234 | Area 16 past PASS 1, Range 1 (one chain, pines on top) north-west and north of Lake 1's playa, Area 51 on the lake, Area 17 east, the D.U.M.B. under the lake | Range 1 and the pass hills | 1 · AREA 17 (Area 51) |
| AREA 3 | 20–110 m | New forest in the north-east, across River 1: THE REDWOODS (their 60 m crowns are a landmark from the ring and the downs) | The canopy and the river | Route 12's last bend |
| AREA 4 | 5–30 m | New low pine forest in the south-east between Hill 1, the mall and the sea: THE STAIRCASE | The canopy | Only from inside: Trail E's end |
| AREA 11 | 60–110 m | A wood on the ridge between HQ and Downtown | The canopy | — (it hides the skyline from HQ) |
| DISASTER CITY and THE BAY | −4 to 60 m | A hill city: Downtown on the crown, the Bowl to the north, the harbour on the bay; the bay's beach with the Bayside Mall behind it; the lighthouse on the bay's south head | Ridge 1 (78 m) and its own towers | Route 3's crest (only the skyline is seen from HQ); Route 7 shows the beach and the mall |
| THE DEEP | to −133 m | The ocean; the Bermuda triangle | Nothing | Every coast |
| THE ARCTIC | ice | Pack ice, the Pole | Area 2 | 6 · TRAIL I |
| ANTARCTICA and THE ICE WALL | shelf 11 m; wall 92 m | The shelf, the station; the wall around everything; the Flat Lands on top | Distance and the sea | The south coast |

### 4.3 The places
Ground heights are from the sketch bake. "Today" is the room or zone the place already has; G6, G7 and
G10 move them.

| Place | x, z | y | Region | Today | Reached by |
|---|---|---|---|---|---|
| D.O.O.R. HQ | 0, 0 | 85 | Highlands | the building, `hq_grounds` | every road |
| Area 14 (lookout) | −32, −368 | 111 | Highlands' brow | new | Route 2 |
| Area 13 (lookout) | 45, 262 | 97 | Highlands' south cliff | new | Route 4 |
| Downtown | 900, 210 | 54 | Disaster City | `downtown_streets` (+ lobby, showroom, subway) | Route 3, Route 1 |
| The Bowl | 990, −70 | 22 | Disaster City | `stadium_bowl` | the stadium road |
| The Harbour | 1030, 228 | −2 to 3 | Disaster City, on the bay | `downtown_harbour` | the city's streets, Route 7 |
| The Bayside Mall | 1205, 548 | 5 | the bay's beach | the mall (today behind Downtown's street doors; §8.1 of the old plan rebuilds it) on its own pad | Route 7 |
| The Lighthouse | 1505, 365 | 4 | the bay's south head | new landmark | the beach, then the head |
| The Sewers (mouth) | 960, 330 | — | under the city | the `underworld` zone | the storm drain from Dead Man's Cave, the harbour's outfall, a grate in Downtown |
| The Strip | 398, 890 | 38 | Valley 1 | `strip_streets` (+ chapel, casino) | the desert highway |
| Vatican City | 812, −445 | 45 | Downs | the `divine` zone (Rome ground) | Route 8 (fork 4) |
| Stonehenge | 455, −500 | 55 | Downs | `stonehenge_henge` | Route 9 |
| Camelot | −40, −640 | 44 | Kingdom | `camelot_*` (the road part retires into the land) | Route 2, Trail C |
| Mt Olympus (summit) | 60, −1000 | 356 | Area 2 | `olympus_summit`; the foothills and switchbacks retire into the land | Trail A |
| Mt Shasta | −1040, −440 | 254 | Woods (the deep woods) | `shasta_slopes`; Agartha stays a door inside | Trail B |
| The clearing | −360, −625 | 58 | Woods (the fairy forest) | `fairy_forest_clearing` | Trail C from Camelot, Trail D |
| The Redwoods | 1050, −560 | 69 | Area 3 | `fairy_forest_redwoods` | Route 12 from the Bowl |
| The Staircase | 935, 930 | 11 | Area 4 | `fairy_forest_stair` | Trail E off Route 7 |
| Dead Man's Cave | −470, −530 | 76 | Woods (the fairy forest's edge) | `fairy_forest_deadmans`; the storm drain's upper mouth | Trail D, off Route 1 |
| Bohemian Grove | −800, −175 | 104 | Woods (the ritual woods) | `bohemian_grove_grove` | Trail F |
| The Ritual Ground | −930, −70 | 97 | Woods (the ritual woods) | `fairy_forest_ritual` | Trail F |
| The Cavern (mouth) | −895, −585 | 95 | Shasta's foot | the `hollow_earth_*` rooms (the Cavern hub) and the `under` zone | Trail B |
| The Estate | −778, 188 | 26 | Area 7 | `skinwalker_fields` (the corn fields) and the estate's rooms | Route 10 along the loch shore |
| The Haunted House | −690, 118 | 54 | Area 7 | `haunted_*` | Trail G |
| Area 15 | −965, 140 | 33 | Area 7 | new landmark | Trail G |
| Göbekli Tepe | −780, 650 | 53 | Area 8 | `gobekli_tell` | a lane off Route 1 |
| The Ley Lines (mouth) | −560, 820 | — | under Area 8 | `gobekli_leylines` | a shaft in the tell |
| Giza | −330, 725 | 24 | Desert | `giza_plateau` | Route 11 |
| Babel | −360, 1040 | 11 | Desert (south coast) | `babel_tower` | River 4 path |
| Area 51 | 425, 1455 | 34 | Area 9 | `area51_*` (the highway parts retire) | Route 6 |
| The D.U.M.B. (mouth) | 440, 1545 | — | under Lake 1 | the `dumb` zone | a vent or lift at Area 51 |
| Area 16 | 566, 1244 | 33 | Area 9 | new | the end of the desert highway |
| Area 17 | 766, 1394 | 234 | Area 9 | new | Trail H off Route 6 |
| The Cay / The Dutchman | 1320, 1440 / 1500, 1580 | 3 / sea | the Deep (the Bermuda triangle) | `bermuda_sea`, `revenge_*` | the skiff |
| Antarctica · The Station | 110, 2190 | 10 | the shelf | `antarctica_station` | the skiff, then on foot |
| The North Pole | 0, −2150 | ice | the Arctic | `northpole_village` | Trail I, then on foot across the ice |

These stay **doors** to other worlds, as today: Heaven and Hell, the moon, Mars, Saturn, the derelict,
the singularity, the backrooms, the looking-glass, Atlantis (from the whirlpool), CERN (from the D.U.M.B.),
the lodge and the Technoticlan. Hollow Earth is the Cavern (§5.13).

### 4.4 The routes (sketch lengths and maximum grades)
**ROUTE 1, THE RING** (a 12 m highway, 5,822 m, 7.5 % max). Starting at Downtown and heading north:
1. Past the Bowl, then north-west over Area 10 past the Vatican turn and Stonehenge's drove road.
2. West through the kingdom, between Area 14 and Camelot's river loop, and into the woods at the fairy forest's edge, past Dead Man's Cave and over River 2.
3. South through the woods, over Bridge 6, and down Area 7's east rim on Bridge 7.
4. Round the glen's foot, then east across Area 8 past Göbekli Tepe, over Bridge 3 and past Giza.
5. East below Area 13, past the desert highway's turn, and back into the city from the south.

**Roads** (7–8 m wide, 10 % max):
| Road | Length | Route |
|---|---|---|
| Route 2 | 1,265 m | HQ north over Area 14, then hairpins down to Camelot |
| Route 3 | 759 m | HQ over Ridge 1 to Downtown |
| Route 4 | 1,012 m | HQ south along Area 13's ledge, down to Route 1 by the desert highway's turn |
| The stadium road | 197 m | to the Bowl |
| Route 7 | 353 m | Downtown down to the bay, along behind the beach to the Bayside Mall |

**THE DESERT HIGHWAY** (a 10 m highway, 712 m, 7.5 % max): turns off Route 1 below Area 13 and runs
straight south down the valley floor as the Strip's boulevard, then south-east through PASS 1 (between the
Range 1's east end and the pass hills) to Area 16. The way to Area 51 is **Disaster City > Route 1 > the desert highway > the Strip >
Area 16 > Route 6 > Area 51**.

**Lanes** (4–5 m wide, 12–14 % max):
| Lane | Length | Route |
|---|---|---|
| Route 5 | 616 m | HQ to Area 7's rim |
| Route 6 | 421 m | from Area 16 round Range 1's east end and Area 17's foot to Area 51 on the lake |
| Route 12 | 520 m | from the Bowl up the coast, over River 1's mouth, into Area 3 |
| Route 8 | 182 m | to the Vatican |
| Route 9 | 103 m | to Stonehenge |
| Route 10 | 518 m | leaves Route 1 south of the loch and runs up its south-east shore |
| Route 11 | 83 m | to Giza |
| The Göbekli lane | 117 m | to Göbekli Tepe |

**Trails** (dirt, 1.6–2.4 m wide, hugging the ground; 11 in all):
- Trail A up Olympus (569 m)
- Trail B
- Trail C (325 m): from Camelot's west gate over a footbridge on River 1 to the clearing
- Trail D (247 m): Route 1 past Dead Man's Cave to the clearing
- Trail E (473 m): off Route 7's end, south into the pine barrens to the Staircase
- Trail F (458 m): a loop off Trail G through the ritual woods, by Bohemian Grove and the Ritual Ground
- Trail G (527 m)
- Trail H (320 m, switchbacking up the peak from Route 6)
- Trail I (590 m)
- River 4 path
- Trail J along the west coast

**Travel times.**
- HQ to Camelot: 1.3 km, about 4.5 minutes running.
- HQ to the Strip by Route 4, Route 1 and the desert highway: about 1.8 km, 6.5 minutes running.
- HQ to Area 51 (on past the Strip, Area 16 and Route 6): about 2.7 km, 9.5 minutes running or 4 on the board.
- Disaster City to Area 51: about 2.2 km of road, 8 minutes running.

### 4.5 Water
| Water | Course | Features |
|---|---|---|
| RIVER 1 | From the snowfields under Olympus's west shoulder, down through the kingdom (looping round Camelot's knoll), east along Area 10 past the Vatican, to the east coast north of the city | 4 m wide at the source, 16 m at the estuary; Route 2 crosses it into Camelot |
| RIVER 2 | From Shasta's east flank through the woods, south under Route 1, over a waterfall into the head of Loch Ness | Crossed by Route 1, the woods' trails and Trail G |
| LOCH NESS | Fills Area 7 from (−628, −78) to (−1122, 420): 0.7 km long, up to 104 m wide | Level 18 m, 30 m deep; forest down the north-west side; the estate's bench on the south-east shore; Area 15 on a point |
| RIVER 3 | From the loch's south-west end, over a falls, to the sea | Trail J crosses on Bridge 2 |
| RIVER 4 | Down the desert from Area 13's foot, past Giza, to the south coast by Babel | Route 1's Bridge 3 |
| The Olympus brook | Feeds River 1 | — |
| THE BAY | The harbour's inlet on the east coast, about 450 m across and 400 m deep, between the Bowl's headland and the lighthouse head | A sand beach along its south shore (graded about 7 % into the water) under the Bayside Mall; the harbour on its west side; the storm drain's outfall |

### 4.6 The relief
| Place | Height |
|---|---|
| Olympus | 356 m |
| Shasta | 254 m (crater) |
| Area 17 | 234 m |
| Area 2 ridge | about 205 m |
| Area 5, Range 1 | 120–190 m |
| Area 13 | 97 m, over a 60 m cliff to the desert |
| Area 14 | 111 m |
| HQ | 85 m |
| The Downs | 106 m |
| The haunted house | 54 m |
| Downtown | 54 m |
| Camelot | 44 m |
| The estate | 26 m |
| The loch | 18 m |
| The harbour | −4 m |

The bake runs thermal erosion (talus relaxation) and a droplet pass that cuts gullies (reduced on high
ground). Mesas sit on Area 8. The Canyon 1 is a canyon 16 m wide with 7 m walls. Dunes lie along
the south desert. The valley's floor is flat under the Strip, and Lake 1 is a playa.

### 4.7 The reveals (the sketch's sight test)
The seven marked reveal points:

| # | Where | What opens up |
|---|---|---|
| 1 | AREA 17 (the summit after a 320 m switchback climb) | The only place Area 51 can be seen from. Its ground comes into view 125 m up the trail, 310 m away. Route 6 shows it only at the gate, 240 m away |
| 2 | AREA 13 | The highlands end in a cliff; the desert, River 4, Giza and Babel lie below. Their ground first shows 237 m along Route 4. The Strip sits low on its valley floor: only its towers show, from 144 m |
| 3 | AREA 14 | Camelot's ground first shows 329 m along Route 2, 275 m away, in its valley under Olympus |
| 4 | THE DESERT HIGHWAY | Off Route 1 the highway drops onto the valley floor and the Strip's streets open straight ahead at 232 m. Before that only its towers show, from Route 1, Route 4 and Route 2 (the glow over Area 13) |
| 5 | TRAIL G | Out of the trees: the haunted house at 95 m, the estate at 175 m (306 m away), Area 15 at 500 m. On Route 10 the estate comes round the shore at 405 m of 518. Trail F leaves it for the ritual woods |
| 6 | ROUTE 9 | Stonehenge is hidden from HQ and the Vatican; it appears when Route 1 reaches the drove road's mouth, 104 m away |
| 7 | TRAIL I | The Arctic and the Pole open at 436 m, 1.16 km across the ice |

The the clearing is a small reveal of its own: Trail C from Camelot shows it only at its last bend,
58 m away. The Bermuda triangle is out of sight of the whole bay; the first glimpse from a route is a speck
of the cay 1.4 km off, from Route 4's descent.

**What each place sees from its own pad** (ground, or ^top only):

| Place | What it sees |
|---|---|
| HQ | ^Olympus, Shasta, Area 17, Area 13 (Area 11 hides the skyline) |
| Downtown, the Bowl, the Strip, the clearing, the Redwoods, the Staircase, Dead Man's Cave, Bohemian Grove, the Ritual Ground | **nothing** |
| The Bayside Mall | ^Downtown, the harbour and the lighthouse across the bay, ^Olympus, Area 17 |
| Camelot | Shasta, ^the Redwoods, Area 14 |
| Stonehenge | ^Olympus |
| The Vatican | ^Downtown, ^the lighthouse, ^the Bowl, ^Olympus, Area 17 |
| The estate | Olympus, ^the haunted house, Area 15 (not the ritual woods across the loch: the trees hide them) |
| Giza | ^Downtown, ^Olympus, ^Babel, the Flat Lands (on the wall, across the sea) |
| Area 51 | Area 17, ^the Station |
| Area 16 | ^the Strip, ^Olympus, Area 17 |
| The Staircase | Area 17 |
| The Redwoods | ^the Cay |
| Area 17 | 21 places: the reward for the climb |

Every place passes R2, and so do mondo's named separations: the Strip never sees Area 51 or the D.U.M.B.
(ground or top), Downtown never sees Area 51, and no place on the bay sees the cay or the Dutchman. The
sketch's `r2check.js` checks all of it after each bake.

---

## 5. THE ENGINE (what to build; all of it works on three r128, no upgrade needed)

### 5.1 THE BAKE (`bake-land.js`, a repo-only tool, and the `HQ_LAND` recipe in data.js)
The sketch hardened. It reads the recipe through `load-data.js` and writes:
- **The tiles.** 256 m land tiles at 2 m: 129² samples each. Layers:
  - height (uint16, 1 cm steps from −150 m);
  - material (u8: grass, meadow, forest floor, rock, cliff, sand, snow, desert, red rock, playa, asphalt, dirt, pavement, ice);
  - forest density (u8);
  - water surface (uint16; none where there is no water).
- **The sea and the ice** in 8 m tiles.
- **Overlay JSON**: roads with per-sample height, bridges, rivers, lakes, places, pads, reveal points.
- **A map image.**
- **Size**: about 160 land tiles at roughly 70 KB before brotli, so about 10 MB in all, fetched by distance.
  Files go under `Assets/Land/` on R2 through the manifest (`?h=<sha>`, Phase 9 of the old plan).

The bake's steps, in the sketch's order:
1. coast and islands;
2. plateaus, bumps, ranges and peaks;
3. thermal erosion;
4. Area 13 cliff and the glen;
5. dunes and the playa;
6. droplet erosion;
7. mesas and canyons;
8. rivers (monotone beds) and lakes (level auto-found, shore raised at most 6 m);
9. the sea floor, the wall, the shelf and the pack ice;
10. **pads**;
11. **roads** (per-sample graded height, cut slope 2.0, fill slope 0.7, ends pinned to the ground, bridges where the deck is more than 7 m up; trails hug the ground within −1.2 / +0.6 m and are benched to at most 0.9 slope with steps where steeper);
12. materials (a cliff wherever the slope is over 0.8);
13. forest;
14. urban;
15. the sight test;
16. output.

Improvements over the sketch:
- ProceduralTerrains' **analytic-gradient erosion damping** (`damp = 1/(1 + erosion·4·|∇|²)`) in the ridged noise, for gullies without rounded domes.
- A stronger droplet pass on the slopes.
- Finer switchbacks for the roads that still take viaducts (§11).

**Licence.** ProceduralTerrains' root licence is MIT with "and/or sell" missing, and its Blender part is
GPL. So nothing is copied: the ideas are reimplemented, and the terrain textures come from CC0 Poly
Haven. threex.grass is MIT and credited if any of it is used.

### 5.2 THE LAND UNDERFOOT (the runtime)
**The sampler.**
- `hqLandHeight(x, z)`, `hqLandFeet`, `hqLandMaterial` and `hqLandWater` are one global sampler, shared by
  the main thread and the terrain worker.
- It reads the 2 m tiles with bicubic filtering and adds deterministic detail noise near the walker
  (±0.3 m on grass, ±1.2 m on rock). Roads and paths are stamped at their exact height.
- A pad returns its site's compiled field (0.5 m, today's compiler) inside the pad, and the land outside it.

**The mesh.** Chunks are built in the worker as transferable arrays: positions, normals, two splat weights
and AO. Levels of detail:

| Level | Spacing | Out to |
|---|---|---|
| L0 | 0.5 m | 32 m |
| L1 | 1 m | 96 m |
| L2 | 4 m | 400 m |
| L3 | 16 m | 1.6 km |
| L4 | 64 m | the wall |

- Seams are hidden by skirts, as ProceduralTerrains does.
- About 250k triangles before culling and about 120k in view.
- Chunks attach through today's machinery: the sliced build, the warm-up and the file tracker.

**The floating origin.** Crossing a 256 m tile re-anchors every root. This is `_hqStageSwap` with no
rotation: the stage's swap, reused.

**THE FAR PASS.** The land beyond 250 m, far tree cards and far weenies are drawn first with a far camera
(near 200 m, far 6 km). Then depth is cleared and the near scene is drawn with today's camera (far 274 m).
This gives no z-fighting across 5.6 km and changes no existing shader. It replaces the far shells
outdoors.

**The material.** Two strongest splat materials per vertex, as ProceduralTerrains does. The textures use
triplanar sampling only where the slope is high (cliffs) and flat UVs elsewhere, with the tiling broken
by offset sampling. There are 8–12 CC0 texture sets, and the snow line and altitude tint are done in the
shader.

**The walker.**
- `_hqSurface` asks the land when outside a site's field. The box clamp is gone outdoors.
- `maxSlope` 1.0 and the 0.62 m step stay. Because of the bake's material rule, whatever refuses you looks
  like a cliff.
- Camera collision samples the land.

### 5.3 SIGHT AND FOG
- Fog stops doing the hiding; the land does it.
- Each region's weather sets its distance: clear days see 2–3 km with aerial perspective (far land tinted
  toward the sky). The woods keep a close, damp fog under the canopy. The Arctic and Antarctica get snow
  haze.
- Weenies become the real things at their true distance: Olympus is a 356 m mountain, not a 75 m scale
  model. `HQ_WORLD_WEENIES` retires outdoors.

### 5.4 THE WATER
- **The sea.** One plane at 0 m following the camera. Its shader takes depth from the land's height
  texture: shallow-to-deep colour, a foam band at the shore, fresnel sky, two scrolling ripple normals, and
  a sun glint (ProceduralTerrains' legacy water, reimplemented).
- **Rivers.** Ribbons along the river spline with per-sample height, falling steadily. The normals scroll
  in the downstream direction, and white water shows where the slope is over 3 %.
- **Waterfalls.** A vertical ribbon, mist particles and sound.
- **Lakes.** A level plane, clipped by depth.
- **Underwater.** A fog pass when the camera is under the water layer.
- **Swimming and the skiff.** You swim anywhere deeper than wading depth. The skiff works on any water
  deep enough: the Deep, the loch and River 1's lower reach. `_hqTickVehicle` pins to the water
  layer instead of `sea.y`, so "one sea per part" goes away.

### 5.5 THE TREES AND THE GRASS
**Trees.**
- Placed from the forest layer with ProceduralTerrains' method: a jittered grid, a hash-local-maximum
  spacing test, and slope, height and shore windows.
- About 25k trees in the forests and 10k scattered elsewhere, deterministic per tile.
- One `InstancedMesh` per model and LOD per tile. The tree materials become shared: one bark and one leaf
  material per model, with the wind patch driven by uniforms, so `_hqInstKey` stops rejecting them.
- Levels: the full model within 80 m, the Phase 10 simplified level out to 250 m, and a baked crossed-card
  impostor out to 1.5 km, drawn in the far pass. The canopy really blocks sight.
- **Every trunk is a blocker** at its measured radius. **The forest is walkable between trunks.** There
  are no thickets, banks or treeline rings.

**Undergrowth.** Ferns and bushes are instanced and never block. Rocks block by their measured hull.

**Grass.**
- threex.grass's crossed quads with normals forced up, rewritten as an `InstancedMesh` of 3-quad tufts.
- Placed by a deterministic hash on grass materials only, faded out between 30 and 60 m, with a wind
  vertex shader whose phase comes from world XZ so whole fields sway together.
- The battle board's grass tufts share the art.
- Budget: about 8k tufts and 50k triangles, in a few draw calls.

### 5.6 THE ROADS
- Road meshes are ribbons following the baked per-sample height: asphalt with painted lines for the
  highway, packed dirt for lanes, and trails painted into the land's path weight.
- **Bridges and viaducts** are walkable decks (today's bridge layer), with piers down to the ground, rails
  and lamp posts. Named bridges get their own look: Bridge 7 is an arched railway-style viaduct,
  Bridge 3 a truss.
- Guard rails are drawn wherever the road edge drops more than 2 m, so the rail is the blocker, not the edge.
- Signs at junctions name the next place, not what is visible.
- NPC traffic runs on Route 1 (today's traffic routes).
- The skateboard rides every road.

### 5.7 THE SITES ON PADS
- Each outdoor site becomes a pad: the bake flattens a disc (or rectangle) at `padY` and blends it into the
  land over its edge band.
- The site's compiled field (today's compiler, families A–E, 0.5 m) fills the pad.
- Its shell edge stops refusing the walker: past the field, `_hqSurface` asks the land.
- Interiors stay door joins (Phase 2 of the old plan).
- The site compiles in the worker while you approach. Until it attaches, the pad shows the land's flat
  ground and the site's LOD models: the black-texture rule and the file tracker, as today.
- **The woods' seven parts retire.** The forest is land. The clearing, the redwoods, the grove, the
  staircase and the ritual ground become small pads with their props, joined by the trails.
- The highway's two parts retire into Route 1. The mountain's foothills and switchbacks retire into
  Olympus's real slope.

### 5.8 THE CITY ON THE HILL
Disaster City is rebuilt on the land's slope, falling from Downtown's crown (about 60 m) to the harbour
(0 m). The generator (family D) changes:
- **Streets carry height.** Each street point samples the land and is graded to at most 12 % (stair streets steeper, drawn as steps and ramps under 1.0).
- **Lots are terraced.** A lot's base is the street height at its front. The downhill side stands on a drawn plinth or retaining wall, and the uphill side cuts into the slope behind a drawn wall.
- **Solid is what's drawn.** The walker's mask becomes the union of building footprints, drawn walls and plinths. This inverts today's "the block is solid".
  - An alley at least 1.6 m wide is walkable, either through to the far side or ending at a drawn wall.
  - A gap under 1.6 m gets a drawn fence or wall, and the audit proves every one.
- **Districts on levels.** The Bowl sits in a hollow north of Downtown. The harbour is on the bay's west
  shore. Switchback streets, a funicular-style stair and a viaduct link the levels. Route 7 runs down
  to the beach.
- **The bay.** The beach is graded sand (about 7 % into the water) that you walk and swim from. The Bayside
  Mall is a site on its own pad behind the beach: its front faces the sand and the water, its car park and
  Route 7 are behind it.
- **The Strip is not in the city any more.** It is a site in VALLEY 1 (§4.2): the casinos line the desert
  highway on the valley floor, which falls a few metres towards the south gap. Its podiums, stairs and
  ramps follow R8's spirit (no invisible walls, every gap walkable or walled), but it is Las Vegas, so its
  floor is nearly flat.
- Route 3 arrives over Ridge 1. From its crest the city's streets appear for the first time;
  from HQ only the skyline shows.

### 5.9 NO INVISIBLE WALLS (the audit)
**The wall audit test.** Walk the walker's refusal function over every site field and a sample of land
tiles. For every refused step, something drawn must stand within 0.45 m: a cliff material, a building
footprint, a wall, a trunk or a rock hull.

**The fixes it forces:**
- Measured footprints from GLB bounds, as oriented rectangles, for every catalogue prop (replacing the
  authored `foot` and `rect` values).
- Tree tops at their real height.
- No `wallH` banks outdoors.
- No shell-edge refusal outdoors.
- No stage pad (`HQ_STAGE_PAD`) outdoors.

### 5.10 THE ENCOUNTER ON THE LAND
- `hqFieldLattice` stops rasterising the whole part. It rasterises a 32 × 32 m window round the strike
  from the land sampler (and the pad's field inside a site).
- The 8 × 8 window and its rules are unchanged (Phase 8 of the old plan stays skipped).
- Window ids become `field:land:<tile>:ox,oz`.

### 5.11 THE MAP AND DISCOVERY
- The map tab draws the baked land: shaded relief, contours, rivers, roads by kind, places and reveal
  points, drawn like `WORLD_GEOGRAPHY_MAP.jpg`.
- Regions start under a light fog of war. A region clears when you first see its ground (from a reveal
  point, or by entering it). A place's name appears when you first see it.
- A region's first sight also shows its title card, the "whole other area ahead" moment.
- A new save key holds what you have seen; there is no migration (R10).

### 5.12 MEMORY AND PERFORMANCE
One VRAM estimate covers everything under a single budget, with LRU eviction: land tiles, chunk meshes,
instance buffers and parsed models. This is Phase 12's memory half (§6).

Rough numbers:
| Item | Size |
|---|---|
| Land tiles in memory | 25 near tiles ≈ 2 MB |
| Tree instances | 35k × 64 B ≈ 2 MB |
| Grass | 8k tufts |
| Draw calls | land ~40, trees ~60, grass ~10, on top of the sites |

`EW_PERF_LOW` halves tree and grass density and pulls L2–L4 in.

### 5.13 THE DUNGEONS (the dungeon kit)
**The rules:**

| # | Rule |
|---|---|
| D1 | A **mouth on the land**, visible from a route: a cave mouth, the harbour's storm outfall, a grate, a shaft in the tell, a vent at Lake 1. It is a door join into the dungeon's zone on the `under` ground |
| D2 | **400–900 m of path**, 3–5 set-piece chambers, and **at least 40 m of vertical**: shafts, ramps, chasms with bridges, an underground river and a waterfall. It is built with the cave and halls families |
| D3 | **R3 underground**: every wall is drawn rock or brick at the mask edge (the cave family's cliff sheet on every solid; the halls get drawn walls). No bare banks |
| D4 | **R2 underground**: chambers separated by bends, drops and narrows, so each chamber opens as a reveal. A lookout ledge over the biggest one |
| D5 | **A way back**: the deepest chamber opens a short route to the mouth or to a second mouth on the land. A barred door lifted from the far side, a rope or a lift, **never a puzzle** |
| D6 | **No puzzles**: fights, traversal, loot, a boss, discoveries |

**The dungeons:**

| Dungeon | Rooms | Where it runs |
|---|---|---|
| THE STORM DRAIN and THE SEWERS | Dead Man's Cave (`fairy_forest_deadmans`) is the upper mouth; the drain; then `underworld`: sewers, running tunnels, holding cells, old workings | **The woods' link to Downtown** (mondo, 2026-09-28). From Dead Man's Cave at the fairy forest's edge, 1.8 km under the highlands to the Sewers under Downtown, falling the whole way (76 m to sea level), and out at the harbour's outfall on the bay. The chambers are at the two ends; the long middle is a concrete trunk drain with a stream in its channel, which the skateboard rides (about 1.5 minutes end to end). Grates up into Downtown and the harbour are its other mouths |
| THE CAVERN | `hollow_earth_*`: mouth, adit, gallery, vent, blast, oubliette, inner sun; the `under` zone | Under Shasta's foot, down to the inner sun |
| THE LEY LINES | `gobekli_leylines` | Under Area 8 from Göbekli's tell, with a second mouth in Canyon 1 |
| THE D.U.M.B. | `dumb_*` | Under Lake 1 in Area 9; CERN stays a door from it |

The storm drain breaks D2's 400–900 m because it is a link as well as a dungeon: its length is the
distance from the woods to the city. D2 applies to its two ends.

### 5.14 WHAT IS NEW ENGINE WORK (built, per mondo's "build what's missing" rule)
The bake tool, tile streaming, chunk LOD, the far pass, the land sampler, splat terrain, the water shaders,
instanced forests with impostors, grass, road meshes and bridges, sloped city generation, the wall
audit, the windowed field raster, and the map's fog of war. None of it needs a three.js upgrade.

---

## 6. HOW THIS RELATES TO OPEN_WORLD_PLAN.md

**KEPT** (the engine it built is what the land runs on):

| Kept | Why it matters here |
|---|---|
| THE STAGE's floating-origin swap (`_hqStageSwap`), the sliced build, the warm-up, the static batch, ImageBitmap textures (Phases 1 and 11) | Every chunk and pad attaches through them |
| The asset store, the manifest, meshopt, the LOD levels, the near-first queue (Phases 9 and 10) | The land tiles and tree levels go through the same tools |
| THE CLOCK and the sky (Phase 3) | The land rides `HQ_WORLD_CLOCK`; `sky.lock` still serves Cyberpunk and the other worlds |
| Door joins (Phase 2) | All interiors: the mall, the hall and keep, the hangar and white rooms, the medical wing, the basement |
| The file tracker and file book | Unchanged |
| The terrain compiler (families A–E) | Compiles each site's pad field and each dungeon |
| The content track (§8.1: the mall, the basilica, the bunker, the D.U.M.B. catwalks) | Continues in parallel. The mall is now the Bayside Mall: its rebuild faces the beach on its own pad instead of hiding behind Downtown's street doors |

**REPLACED:**
- **§4.5 THE GEOGRAPHY** (the forecourt at the origin, the city at 162 m east, the woods at −192 m, Area 51
  at 544–652 m south) is replaced by §4 here.
- **The outdoor zones of rectangular parts and their edge joins** become the land: `forecourt`, `city`,
  `coast`, `highway`, `desert`, `kingdom`, `mountain`, `woods`, `haunted`. The underground zones stay and
  become dungeons: `dumb`, `under`, `underworld`, `ley`.
- **The far shells** outdoors are replaced by the far pass.
- **The scale-model weenies** outdoors are replaced by the real things.
- **The LAND map tab drawn from frames** is replaced by the map drawn from the bake.
- **The old forks** are answered:
  - fork 2 (one surface zone): yes, one land;
  - fork 7 (Shasta): Shasta is a mountain in the woods;
  - fork 3 (Cyberpunk) and fork 8 (the car) carry over as forks 3 and 7 here.

**PHASE 12 (portals + the memory budget) is kept as written and runs FIRST, as G1.**
- It needs no geography.
- Its portal half serves the interiors behind door joins, which stay.
- Its memory half (LRU eviction under a VRAM estimate, the MEM line) is the budget the land needs (§5.12).
  G2 extends that budget to land tiles and instance buffers.

**Phases 13 (sound in space) and 14 (the light)** are kept and move after the land as G11 and G12.
Shadow cascades matter far more on open land.

---

## 7. THE ORDER (each phase a delivery with its own test; `npm run test:end` at the end of each)

| # | Delivery | Files | Test |
|---|---|---|---|
| G0 | **THE BAKE + THE MAP**: `bake-land.js` (the sketch hardened, §5.1), the `HQ_LAND` recipe and `hqLand*` readers, tiles to `Assets/Land/`, the map tab drawn from the bake, so mondo can argue with the geography in the game before anything else changes | bake-land.js (repo tool), data.js, map.js, package.json (`npm run bake-land`) | `land-bake.test.js`, which bakes at 8 m in the fast suite and checks: R2 from every pad, rivers monotone, lakes level, road grades, the ring a loop, every place reachable, cliffs drawn wherever slope > 1.0. Full resolution is `heavy` — **DONE 2026-09-28** (zip ENTROPY_WARS_WORLD_GEOGRAPHY_3; §12) |
| G1 | **PHASE 12** of OPEN_WORLD_PLAN (portals + the memory budget), as written | three-renderer.js | `hq-joins.test.js` portal rule; `asset-store.test.js` eviction — **DONE 2026-09-28** (zip ENTROPY_WARS_WORLD_GEOGRAPHY_1; §12) |
| G2 ✓ (2026-09-28, zip 4) | **THE LAND UNDERFOOT**: the sampler, the tiles, chunk LOD, the far pass, the splat material, the walker and camera on the land, HQ's front door onto the land at its pad. The sites are still reached by their old doors, so this ships a walkable bare world | data.js, three-renderer.js, map.js, index.html | `land-stream.test.js` (vm: fetch order, LRU, sampler continuity across tiles, feet on slopes, refusal only at cliff material) |
| G3 ✓ (2026-09-28, zip G3) | **THE WATER**: sea, rivers, lakes, waterfalls, underwater, swimming and the skiff on the water layer | three-renderer.js, data.js | `land-water.test.js` (the water layer's y matches the bake; the skiff floats on the loch) |
| G4 ✓ (2026-09-28, zip G4) | **THE TREES + THE GRASS**: instanced forests, shared wind materials, impostors, trunk blockers, undergrowth, grass | three-renderer.js, data.js | `land-forest.test.js` (deterministic placement per tile; a trunk under every blocker; instancing accepted) |
| G5 ✓ (2026-09-28, zip G5) | **THE ROADS**: Route 1 and every road, lane and trail; bridges and viaducts; rails; signs; traffic; regrading the sketch's giveaway viaducts (§11) | three-renderer.js, data.js, bake-land.js | `land-roads.test.js` (grades, deck clearance, rails where the drop is > 2 m) |
| G6 ✓ (2026-09-28, zip G6) | **THE SITES ON PADS**: every outdoor place of §4.3 on its pad; the outdoor zones retire; the woods' parts become pads in the forest (the fairy forest by Camelot, the ritual woods by the loch); the Strip on its valley pad; the Bayside Mall on its beach pad; Olympus and Camelot on real slopes | data.js, three-renderer.js | `wall-audit.test.js` over every site (R3); the old site tests re-pinned |
| G7 ✓ (2026-09-29, zip G7) | **THE CITY ON THE HILL** (§5.8): Downtown, the Bowl, the harbour, the bay's beach, the lighthouse | data.js, three-renderer.js | `city-slopes.test.js` (R8: every district has a street > 6 % and a stair or ramp; every alley ≥ 1.6 m walkable, every smaller gap walled) plus the wall audit |
| G8 | **THE EDGE OF THE WORLD**: the Deep to the wall, the ice wall, the shelf and the station, the pack ice and the Pole, the islands, the Bermuda triangle with the cay, the Dutchman and the whirlpool; the Flat Lands per fork 5 | data.js, three-renderer.js | `land-edge.test.js` (the wall is the only border; the skiff reaches it everywhere) |
| G9 | **THE DISCOVERY PASS** (R6, §5.11): landmarks every 150–250 m of route, the reveal points dressed (a cairn, a bench, a broken fence), the region title cards, the map's fog of war | data.js, map.js, three-renderer.js | the bake's R6 spacing check; no finds or tapes pinned |
| G10 | **THE DUNGEONS** (§5.13): the kit first, then one dungeon per thread (the storm drain and the sewers, the Cavern, the ley lines, the D.U.M.B.) | data.js, three-renderer.js | `dungeon-kit.test.js` (D1–D5: mouth reachable, vertical ≥ 40 m, a way back, the wall audit underground) |
| G11 | **SOUND IN SPACE** (old Phase 13): positional rivers, falls, surf, wind in the trees, the city | audio.js, three-renderer.js | `audio-space.test.js` |
| G12 | **THE LIGHT** (old Phase 14): shadow cascades on the land, light probes for interiors | three-renderer.js | screenshots plus `day-sky.test.js` |
| ∥ | The interiors of OPEN_WORLD_PLAN §8.1 continue, one thread each, at any time | | |

**What first:** G0 (the bake and the in-game map) and G1 (Phase 12) can run at the same time. G2 is the
first phase that changes what you walk on.

No phase ships a dev shortcut. Each phase's deliverable is a delta zip. data.js goes to R2 with the token
bump, and to Render only if the server reads something new (it doesn't in this plan).

---

## 8. THE FORKS (the plan builds each default unless mondo says otherwise)

| # | Fork | Default | Alternatives |
|---|---|---|---|
| 1 | **The world's border** | **The ice wall ring** (the sketch): ocean all round, the wall beyond it, Antarctica's shelf inside it to the south, the frozen Arctic to the north | (b) Ocean only, fading into sea haze, with no visible edge (breaks R4); (c) a mountain ring (hides the sea he asked for) |
| 2 | **The scale** | **As sketched**: 7.08 km² of land (sketch 2), Route 1 at 5.8 km, a km in about 3.5 minutes running | (b) 0.7 × (3.5 km², faster to cross, lower hills, weaker reveals); (c) 1.4 × (14 km², would need a car) |
| 3 | **Cyberpunk** | **Stays a door** (2047, another time) | A district on the city's hill with `sky.lock` night |
| 4 | **Vatican City** | **On the land** on its hill over River 1 in Area 10, the painting kept as a second way in | Stays its own "Rome" ground behind the painting |
| 5 | **The Flat Lands** | **Seen, not reached yet**: on top of the wall, visible from the south coast and the station | A stair cut in the wall near the station (a later place) |
| 6 | **The big viaducts** | **Keep Bridge 7 and Bridge 6 as landmarks**; regrade the rest (§11) | Regrade all of them (longer detours, no bridges) |
| 7 | **A drivable car on Route 1** | **Not in this plan**: the skateboard and traffic are the ring's speed | A car as its own later plan (the helm's vehicle code already drives a hull) |
| 8 | **The textures** | **RULED 2026-09-28 (mondo): the bucket's own terrain and urban sheets** (sprites.js TERRAIN_SPRITES / URBAN_TEXTURES), nothing new | Procedural colour only (ProceduralTerrains' default look: cheaper, flatter) |
| 9 | **The map's fog of war** | **On**: regions clear on first sight | The whole map drawn from the start |
| 10 | **The day and the weather** | **The existing 24-minute clock**; each region's weather sets its sight distance | A fixed clear day |
| 11 | **The storm drain's middle** (sketch 2) | **One long skateable trunk drain** with a stream in its channel; chambers at the two ends | A maintenance rail cart through the middle; or a shorter drain with a second mouth half-way (a grate near HQ) |

---

## 9. WHAT'S NEEDED FROM MONDO

| When | What |
|---|---|
| Now | A look at the map and the eight views, and a word on any fork (silence means the defaults). If the layout is wrong (a place in the wrong region, a reveal he doesn't want), say so now; G0 is cheap to re-bake |
| G0 | Upload the zip as usual, plus the `Assets/Land/` tiles (about 10 MB) to R2 with `npm run deploy` |
| G2 | Nothing: the ground wears the terrain and urban sheets already in the bucket (fork 8) |
| G4 | Nothing required: the existing trees come first. Better later: 3–4 new tree models (a fir for the north, a redwood, a birch, a palm for the coast) from Meshy or CC0 |
| G8 / G10 | Optional Meshy models: a cave mouth, a storm outfall, the station's outbuildings, a lighthouse |

---

## 10. RISKS

| Risk | Mitigation |
|---|---|
| **Performance** on mondo's machine | Budgets in §5.12, `EW_PERF_LOW` halves density, the readout's MEM and TRIS lines, and each phase measured with the Playwright probe before shipping |
| **Site compile time** (3–31 s today) | Compiles happen in the worker while you walk toward a site; the pad is walkable land meanwhile. The woods retire as fields, so the woods cost nothing to compile |
| **Sight results depend on resolution** (the sketch lost Area 17's view of Area 51 at 2.7 m cells) | The test runs at the bake's own resolution, reveal points are placed with a brink rule (stand where the ground starts falling), and ridges that hide keep a minimum width |
| **Scope** | This is the largest plan so far. G0–G2 give a walkable land; each later phase ships a visible improvement on its own |

---

## 11. THE SKETCH (what exists, and its known limits)

**Files** (project folder `open-world/geography/sketch/`; RETIRED 2026-09-28: G0 made them the repo's `bake-land.js`, with the recipe in data.js `HQ_LAND`):

| File | What it is |
|---|---|
| `recipe.js` | The world recipe: coast, peaks, ranges, rivers, loch, roads, places, regions |
| `land-sketch.js` | The generator (4 m cells, `N` 1400, about 47 s) |
| `reveals.js` | Walks every route every 8 m and logs first sights |
| `r2check.js` | R2 from every pad plus mondo's named separations (the Strip and Area 51, the bay and Bermuda); exits 1 on a breach |
| `probe.js` / `dbg.js` | A height profile / why a sight line is blocked |
| `map.html` + `render-map.js` | The labelled map |
| `view.html` + `views.js` + `render-views.js` | The ten 3D views (three r128, headless Chromium with SwiftShader) |

Run with `node land-sketch.js && node r2check.js && node reveals.js && node render-map.js map.html 3000 out/map.png && node render-views.js`
(needs `playwright` installed in that folder and Chromium at `/opt/pw-browsers/chromium`).

**Known limits:**
1. **4 m cells.** Sight results shift with resolution (see §10).
2. **Viaducts where the sketch's road solver gave up:**
   - Route 2 hairpins (208 m of deck);
   - Route 4's descent to Route 1 (189 m);
   - Route 3 into the city (287 m: could stay as the city's grand bridge);
   - Route 1 past Giza (353 m, 25 m over the plateau the pad flattened).

   Bridge 7 (177 + 102 m), Bridge 6 (208 m) and the river bridges are meant to be there. G5 regrades the rest with longer switchbacks or cuttings.
3. **Trail grades.** Trails hug the ground and reach local slopes of 1.4–3.1 on the steepest pitches. G0 benches them and adds steps.
4. **Rounded hills.** Thermal erosion rounds hills into domes, and Lake 1's basin reads as a crater from above. G0 adds ridged noise with gradient damping.
5. **Route 3** glimpses the Vatican's ground from 687 m away. G0 raises the ridge or moves the road.
6. **Stand-ins.** The city and the Strip are grey blocks with their streets drawn only on the map, and the models in the views are boxes and cones.
7. **The Staircase** now stands in the pine barrens at 11 m (sketch 3); nothing to decide.

---

## 12. THE LOG (each phase appends here)

- 2026-09-28: plan written; sketch baked at 4 m; map and eight views rendered. Route 10 was
  re-routed along the loch's south-east shore (the first sketch dropped it onto the estate from a 52 m
  viaduct).
- 2026-09-28, sketch 2 (mondo's layout changes, §1b): the bay and the beach with the Bayside Mall; the Strip
  moved into the valley (sketch 1's Area 51 ring, opened east and south); Area 9 added south of it
  (+0.53 km² of land) with Area 16, Area 51 in a new Range 1 ring, Lake 1 and Area 17; the desert
  highway (Route 1 > the Strip > Area 16); the Bermuda triangle moved to the far south-east Deep; the woods
  split into the fairy forest (by Camelot), the deep woods (Shasta, moved 330 m south) and the ritual woods
  (on the loch's north-west shore, facing the estate); River 2 re-routed; the storm drain from Dead
  Man's Cave to the Sewers. `r2check.js` added (R2 plus the named separations): it holds. Map and ten views
  re-rendered (new: the valley gap, the bay). Forks 1–10 are still the defaults (silence); fork 11 is new.
- 2026-09-28 — **G1 DONE** (OPEN_WORLD_PLAN Phase 12; same thread, zip `ENTROPY_WARS_WORLD_GEOGRAPHY_1.zip`, token
  `20260928-geography-01-cors`). THE PORTALS: a room joined only by doors is not drawn while its doors are shut or out
  of view (closed boxes only; dark pad lamps keep the light count so nothing recompiles; `window.EW_NO_PORTALS`).
  THE MEMORY BUDGET: idle parsed models nothing draws are dropped past `heapMB` (700 MB, 320 on a phone), oldest
  first; the rigs are counted, not dropped; the readout gains `MEM used/budget MB`; `window.EW_NO_MEM_BUDGET`. The
  detail is OPEN_WORLD_PLAN.md §12. Next: G0 (the bake and the in-game map).
- 2026-09-28 — **sketch 3** (mondo: no rings round the Strip or Area 51; more forest; the woods' places spread
  out). The valley ring and the ring at Area 51 are gone: the Strip is one straight north–south boulevard on an open
  valley floor with Area 5 to the west; Area 51 sits under one Range 1 chain (north-west and
  north) with Area 17 east; the desert highway runs through Pass 1. New forests: Area 3 (the
  Redwoods moved there), Area 4 (the Staircase moved there), Area 11, and desert pines on the
  Area 5, Hill 1, Range 1 and the pass hills (the sketch's `dry` forests). r2check.js now checks the desert separations both
  ways and counts the ice shelf as open sea. R2 holds; the named separations hold. Map and views re-rendered.
- 2026-09-28 — **G0 DONE** (the bake + the map; zip `ENTROPY_WARS_WORLD_GEOGRAPHY_3.zip`, token `20260928-geography-03-cors`).
  - **The recipe** is data.js `HQ_LAND` (the sketch's recipe.js moved in whole, plus each place's region, weenie top, peak and
    lookout, the sight constants, mondo's named separations and the bake id). The sketch folder is retired.
  - **`bake-land.js`** (`npm run bake-land`, ~2.5 min at 2 m) is the sketch hardened: every step in metres (the erosion's drop
    life, brush and drops per km²; the thermal passes), ridged noise with gradient damping on the ranges and peaks (§11 limit 4),
    trails benched to 0.9 with their step spans marked (§11 limit 3), river surfaces that fall monotonically, a cliff material
    wherever the slope passes 0.8, and one `checkRules` for the CLI and the test. It writes land.json, land-map.png, 379 land
    tiles (256 m at 2 m) and sea.bin under `Assets/Land/`, and stamps `HQ_LAND.baked.id` (bake `0b57d9ab50`).
  - **The rules hold at 2 m and at 8 m**: R2 from every pad and the named separations; rivers downhill; the loch level with an
    outlet; every road within its grade; Route 1 a closed loop; every place on a route from HQ; every face over 1.0 drawn as
    cliff. HQ sees the ground of Olympus and Area 17 only; the Strip sees no other place.
  - **Two routes added** so every place is on one (R5): TRAIL K (the mall to the bay's head) and ROUTE 13
    (the estate to the haunted house).
  - **The numbers** (2 m): 7.08 km² of land; heights −176.7 to 354.4 m; forest 14.5 % (the sketch said 16 %: the damped ridges
    and the cliff rule thin the desert pines a little); 18.3 km of routes. Bridges over 100 m are the sketch's known ones
    (§11 limit 2: the ring's 208, 185, 353 and 103 m, Route 2 204 m, Route 3 287 m, Route 4 189 m); G5
    regrades them.
  - **THE ATLAS**: a new tab on the map (map.js `_hqAtlas*`) draws the baked relief with the roads by kind, rivers, the storm
    drain, bridges, regions and places. A place's card shows what its pad sees, where each route first shows it, and the routes
    it is on. There is no fog of war yet (G9, fork 9's default). The LAND tab stays until G2 retires the stitched zones.
  - **What mondo uploads**: `land.json` and `land-map.png` to R2 `Assets/Land/`. The tiles and sea.bin are not read until G2 and
    are re-baked then. Test: `land-bake.test.js` (8 m in the fast suite, 2 m `heavy`). Next: G2 (the land underfoot).
- 2026-09-28 — **G2 DONE** (the land underfoot; zip `ENTROPY_WARS_WORLD_GEOGRAPHY_4.zip`, token `20260928-geography-04-cors`).
  - **The way out**: the foyer's front door (`street`) opens onto THE LAND (a new room `land`, `land: true`), landing in front of
    D.O.O.R. HQ's own front door on its pad (84.9 m, `HQ_LAND.baked.hubY`, re-stamped by every bake). HQ from outside is a
    concrete drum (22 m, 13 m tall, a shallow dome, a canopy), solid to the walker and the camera; G6 dresses it. The main menu
    is the pause menu's EXIT. The plate reads ? until the land has been stood in. The sites keep their old doors (G6 moves them).
  - **THE SAMPLER** (data.js, after the recipe): `HQ_LAND_RULES` (the numbers), `HQ_LAND_STORE` (the index, the 8 m world from
    sea.bin, the 2 m tiles in an LRU of 72), `hqLandBase` (Catmull-Rom over the 2 m samples, the 8 m world where a tile is not in),
    `hqLandDetail` (value noise at 9.5 m + 3.4 m; the amplitude per material, none on a road, a street or a river bed, faded to
    nothing on a pad), `hqLandHeight`, `hqLandFeet` (null where the base slope passes 1.0), `hqLandCliff` (the drawn cliff: full at
    0.97, so every refused face is cliff, R3), `hqLandGrid` (a chunk's read in one pass: exactly the point read at 1 m),
    `hqLandWant` (the tiles to fetch, nearest first), `hqLandPut` / `hqLandTouch` (the LRU never drops the walker's tiles).
  - **THE CHUNKS** (three-renderer.js `_hqLand*`): 64 m chunks at 1 / 2 / 4 / 8 m out to 80 / 176 / 272 / 400 m (centre
    distance, 6 m hysteresis), nearest first, 6 ms a frame (40 while the card is up; a chunk costs ~0.6 ms in Chrome). Skirts
    three steps deep hide the seams; normals and a hollows' AO come from the grid. The near camera reaches 460 m on the land.
  - **THE FAR PASS** as planned but inside the one scene render: after the sky, the whole world at 16 m (one mesh from the 8 m
    world, built once per bake) and a far sea at 0 m are drawn with their own lens (30 m to 7.2 km), a node clears the depth,
    then the near scene draws with the building's camera. Inside the ring the chunks already cover the far land is discarded.
  - **THE GROUND** (fork 8): a WebGL2 splat. One texture array of 14 ground sheets and a per-chunk sheet of the 2 m materials;
    each pixel gathers the 16 samples round it with B-spline weights into up to four materials (sharpened, so a road's edge is a
    curve, not the 2 m staircase), reads each sheet twice (turned and scaled, no visible repeat) and draws a cliff side-on
    (triplanar) by the walker's own slope rule. Without WebGL2 the ground wears its materials' colours
    (`window.EW_NO_LAND_SPLAT` forces that).
  - **THE SHEETS** (zip 5, mondo: "we already have a bunch of terrain textures in the r2 bucket, and the urban textures as
    well. why are you making new ones?"): each of the 15 layers names a sheet the game already ships (`HQ_LAND_RULES.tex.layers[].src`,
    a TERRAIN_SPRITES key or `urban:<Name>`), mondo's picks: grass_2 the lawns, healing_spring the meadows,
    grass_dark_fantasy the forest floor, rocks_1 the rock, rocks_5 the cliffs, desert (the sand paler), ice the snow and the ice,
    mars the red rock, dirt_2 the dry lakebed, dirt the dirt, dirt paler the trails (a 15th layer), urban:ConcreteStriped2a the
    asphalt, urban:ConcreteStriped1b the pavement. The
    renderer measures each loaded sheet's mean colour and gives it to the far land, so past 400 m the land wears what the near
    ground wears. The generated sheets (zip 4's `tex/`) are gone; bake-land.js makes none.
  - **The walker**: `_hqSurface` / `_hqAirOK` / `_hqCamBlocked` read the land; a landing on a face too steep slides down the fall
    line; the sea at 0 m is the swimmer's (`_hqSea`), so wading in off a beach swims. The card waits for the ground within 176 m
    of the door (5 s in the probe). The shadow frustum rides the walker's height. The readout's MEM line adds LAND MB and tiles.
  - **Deviations from §5.2** (all for speed or because the piece was not needed yet): no floating origin (a float32 metre is
    ~0.2 mm at 2.8 km, so chunks are built in their own frame and placed); chunks built on the main thread time-sliced, not in a
    worker (0.6 ms a chunk); levels 1 / 2 / 4 / 8 m to 400 m, not 0.5 m to 64 m (the far pass covers the rest at 16 m); a pad
    reads the land, not its site's field (the sites stay behind their doors until G6).
  - **Not yet** (their phases): rivers and lakes are dry beds (G3 brings the water layer); no trees (G4); roads are a material,
    not graded geometry (G5); the ice wall is the baked heights (no ice shader).
  - **What mondo uploads**: the whole `Assets/Land/` folder to R2 `Assets/Land/` (379 tiles in `tiles/`,
    sea.bin, land.json, land-map.png; 43 MB). Test: `land-stream.test.js` (a 16 m bake: the stream order, the LRU, the surface
    continuous across tiles, the grid is the point read, R3, HQ's pad flat, the wiring). Next: G3 (the water).

- **G3 THE WATER — DONE 2026-09-28** (zip `ENTROPY_WARS_WORLD_GEOGRAPHY_G3.zip`, token 20260928-geography-07-cors, bake id
  5e65e17571, on G2_ALL):
  - **THE MOUTH (a bake fix, R7):** River 1 stood 4.8 m over the sea at the coast and River 3 4 m. The recipe's new
    `R.riverMouth` gives a river that reaches the coast one even run-out (up to 400 m, never past a falls' foot) down to the sea's
    level + 0.05 m, the channel deepening with it; land.json's rivers carry `mouth`, and the bake's R7 check refuses a mouth
    standing over the sea. It moved 8 tiles (t_14_8/9/10, t_15_8/9/10, t_16_10, t_5_13) plus land.json, land-map.png, sea.bin.
  - **THE WATER LAYER** (data.js, after `hqLandForest`): ONE read of the water for everyone who meets it. `hqLandWaterY` (a river
    or a lake: the tiles' baked water, bilinear; else the sea at 0), `hqLandWaterDepth`, `hqLandWaterFresh`, `hqLandFlow` (the
    current: the surface's fall × 45, capped at 1.5 m/s; a lake and the sea hold still), `hqLandHullFloats` (the helm's five probes,
    all over water deeper than the draft and on one surface within 0.6 m: no sailing up or down a falls), `hqLandFalls` (every
    stretch of a river steeper than 0.35 that drops ≥ 2 m: 8 on this bake, the Olympus brook's 155 m the tallest, the creek's 42 m
    into the loch), `hqLandWaterSheet` (a tile's river and lake mesh), `hqLandSeaDepth` / `hqLandSeaDepthWorld` (the shader's depth
    bytes), `hqLandMooring`. A river sample within 0.6 m of the sea over ground below it is the sea's (River 4's lagoon). Rules in
    `HQ_LAND_RULES.water`.
  - **THE SEA** (three-renderer.js): one Phong sheet round the camera whose shader reads the sea's depth from two byte textures
    (a 512 m window at 2 m re-centred on the camera, the world at 8 m past it): shallow → mid → deep colour, a foam band lapping at
    the shore, travelling ripples as normals (four waves over a noise warp), the sun's glint, the sky at a grazing angle, the
    bucket's own `water.png` and the battle's `waves_1.png` breaking it up. It discards itself where the ground stands over the sea.
    The far sea wears the same shader (opaque, in the far pass); the far land stands the loch at its level and tints the rivers.
  - **THE RIVERS AND LAKES**: every landed tile's water is one mesh on the baked surface (a river falls, the loch is level): the
    ripples carried downstream by the current in two phases (a flow map), white water past 3 %, faded out under the bank. One sheet
    a frame, nearest first; a tile the store drops takes its sheet with it.
  - **THE FALLS** (R7's "a drop is a waterfall"): a curtain of white streaks pouring down each one, a churned foam pool at its
    foot, mist rising within 320 m. Unlit, tinted by the day's light (a lit two-sided transparent sheet draws its back pass black
    in r128). **No falls sound yet**: the game's audio is one-shot synths, positional sound is G11.
  - **SWIMMING**: `_hqWaterYAt` (the land's layer, else the sea's level) under the swimmer, the diver, the plunge, the shallows'
    hand-back, the wader's ripples, the helm and the look under the surface. A surface swimmer keeps to one surface (rides a
    river's slope, never up a falls), drifts with the current, and over a falls' lip the water lets go: the body drops and plunges
    in at the foot. Under the loch or a river the fog turns green and thicker.
  - **THE SKIFF**: four moorings (`water.moor`: the loch, the bay, the harbour, River 1's mouth) found at run time once
    their tiles are in (a spot the hull floats with a hand to spare, alongside a shore the walker can board from): the sea's skiff,
    registered as a vehicle, with a mooring pile on the shore. The helm reads `hqLandHullFloats`, rides the water under the hull and
    drifts downstream on a river.
  - **Probe** (offline, swiftshader): the loch, the bay and the harbour moor their skiffs; River 1, the loch, the creek
    falls and the bay drawn; the shaders compile on WebGL1 and WebGL2. Not measured on a real GPU.
  - **Forks**: none of §8 touches the water; nothing ruled.
  - **What mondo uploads**: R2 data.js, three-renderer.js, `Assets/Land/` land.json, land-map.png, sea.bin and the 8 tiles;
    index.html to Render; the repo bake-land.js, land-water.test.js, this plan, docs/notes/areas-complexes.md. Test:
    `land-water.test.js` (a 16 m bake: the layer is the tiles' water, the loch at 18, the open sea at 0, every mouth at the sea's
    level, the current downstream, the falls, the loch's skiff floats and never on a falls' face; heavy: all four moorings at 2 m).
    Next: G4 (the trees and the grass).

- **G4 — THE TREES + THE GRASS (2026-09-28, zip open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G4.zip, token
  20260928-geography-08-cors, on zip G3; the bake is unchanged, id 5e65e17571)**
  - **Only the game's own models** (R-textures ruling, mondo 2026-09-28): the broadleaf trees are the battle maps' foliage OBJs
    (Tree_1/3/6/9, DeadTree_2/5 in wood.png + leaves.png); the pine, the dead snag and the fern are the Meshy misc GLBs the maps
    already load; the rocks are the HQ catalogue's asteroid_a / asteroid_b; the grass is the board's GRASS blades in grass_2.png.
    Nothing generated, nothing downloaded. Until a model has loaded a plain stand-in of its size holds the spot.
  - **THE PLACEMENT** (data.js `HQ_LAND_RULES.flora` + `hqLandFlora`): a pure function of each baked tile (a jittered grid kept
    only at hash peaks, so neighbouring tiles agree at the seam): the forest byte sets the density, lone trees dot the meadows,
    none on slopes, roads, pads, shores, water or within 8 m of HQ; trees keep 3.2 m apart so there is always a way through. The
    stands differ: the fairy forest broadleaf, the redwood grove tall, the pines pine, the ritual woods dead and snags, the north
    past z −950 or above 150 m pine, dry ground dead trees. Ferns under the trees, rocks where the ground is rock. About 30,000
    trees over the land. A tile's flora is built a few ms a frame (48 steps a tile), never in one hitch.
  - **THE DRAWING**: within 90 m every tree, rock and fern is a real instanced model (a triangle budget, 900k, 360k on
    EW_PERF_LOW); past that each tile's trees are one merged mesh of cards baked from the models themselves (an ortho render per
    model), and the far pass carries cards out to the horizon. The crowns sway in the game's own wind clock. The grass is drawn
    within 58 m on grass, meadow and forest-floor ground, fading at the edge. Cards and blades are lit from above on both faces.
  - **R3, THE TRUNKS**: every drawn trunk has a blocker no wider than its bark (the rule's radius, narrowed to the model's own
    measured trunk); rocks are blockers you can climb onto. Filed around the walker every 1.5 m and twice a second.
  - **Probe** (offline, swiftshader, stand-in textures): Eastwood 267 near trees and 12,788 far cards, the fairy forest 427 near;
    walking into a trunk is refused, a step past its bark is ground. Not measured on a real GPU. Kill-switch `window.EW_NO_LAND_FLORA`.
  - **Forks**: none of §8 touches the trees; nothing ruled. §9 asked nothing for G4 and nothing new is needed: the existing trees
    fill every stand.
  - **What mondo uploads**: R2 data.js, three-renderer.js; index.html to Render; the repo land-forest.test.js, this plan,
    docs/notes/areas-complexes.md, CLAUDE.md. No Assets/Land upload (the bake did not change). Test: `land-forest.test.js` (a 16 m
    bake: placement pure and seam-safe, spacing, a blocker under every trunk and none wider, the stands, grass only on grass, the
    models are existing assets; heavy: the 2 m count).
    Next: G5 (the roads).
- **G4b — THE GRASS BLADES (2026-09-28, zip open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G4B.zip, token
  20260928-geography-09-cors, delta on G4)** — mondo: "I do want you to try grass blades".
  - The tufts are gone: the grass is a field of single blades drawn on the GPU, about 36 a square metre within 22 m, thinning to
    58 m and shrinking away past 42 m. Each 8 m patch is one instance of a shared blade layout (turned and mirrored per patch, so
    it never repeats on an 8 m grid).
  - Every blade stands on the drawn ground (a 160 m float window of the land's height, density and material that follows the
    walker, 1 m a texel; it computes only the strips it gains, a couple of ms a frame). None on roads, rock, sand, snow, slopes
    over 0.8, water or HQ's drum.
  - The blades wear the ground's own colour under them (the material's mean, the far land's colour), dark at the root and
    bright at the tip, streaked by the board's grass_2. They lean, sway in a travelling gust on the wind clock and bend away
    from the walker.
  - Needs vertex textures and float textures (every WebGL2 browser); without them there is no grass. EW_PERF_LOW draws half
    the near blades.
  - Probe (swiftshader, stand-in textures): about 65,000 blades drawn in the meadow by Eastwood and in the fairy forest. Not
    measured on a real GPU.
  - What mondo uploads: R2 data.js, three-renderer.js; index.html to Render; the repo land-forest.test.js, this plan,
    docs/notes/areas-complexes.md. Test: land-forest.test.js (the field: only on grass materials, on the drawn ground, the
    same whether it comes at once or in strips).


- **G5 — THE ROADS (2026-09-28, zip open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G5.zip, token
  20260928-geography-10-cors, delta on G4B; new bake 35b9269ad8)**
  - **The giveaway viaducts are gone** (§11 limit 2). The bake now caps how high a road may stand over dry ground (6.5 m): a
    long dry span is regraded into the slope as a cutting instead. Route 2, Route 3, Route 4 and the West
    Lane were re-laid with switchbacks; Route 1 passes Giza through a gap in the mesas. A road leaves the ground only over water
    or inside the two named viaducts. Every grade holds (R5).
  - **Fork 6, default**: Bridge 7 and Bridge 6 stay as landmarks, drawn as arched stone-grey viaducts with
    spandrel walls. Bridge 3 is a steel truss. Route 2 crosses River 1 on Bridge 5; Route 1
    crosses River 2 on a short bridge (the old line ran 10 m under the perched creek, so the crossing moved north onto the
    plain). Trails cross water on footbridges with steel rails.
  - **The roads drawn**: within 300 m each road wears its own sheet from the bucket (urban asphalt, the Vatican's paving, packed
    dirt for the lanes, fork §5.6) on the drawn ground, with edge lines and a centre line (yellow on Route 1). Trails stay
    painted into the ground.
  - **Decks are walkable**: a walker steps onto a deck from the road, the parapets stop you (R3), you can walk under a high
    deck, and jumps land on it. Piers, girders, lamps along the long decks (the game's street lamp) and name plates at each end.
  - **Guard rails** wherever a road's edge drops more than 2 m (the bake finds them: 4.7 km of rail). The rail is the blocker;
    skaters grind it and the grind runs on from piece to piece.
  - **Signs** at every junction name the next place each way (ROUTE 1 · ◄ THE ESTATE · AREA 15 ►), never what is in sight;
    Route 1 carries signs for each joining road's first place.
  - **Traffic**: nine cars each way on Route 1 (the city's cars), riding the graded line and pitching with it.
  - **Forks**: fork 6 default (keep Bridges 6 and 7, regrade the rest); fork 7 default (no car to drive); §5.6 lanes
    are packed dirt; the Vatican's lane paved. The 2 m bake (rules hold) has 38 decks: the two viaducts, the
    river bridges, the footbridges and short gully bridges (none dry over 64 m). The deepest cuttings are where the recipe's
    own lines cross ridges (Route 1 west of HQ 48 m, Trail A 53 m, Route 12 34 m, the Vatican's lane 31 m):
    left as cuttings with cliff banks; moving those lines is a recipe edit if mondo wants them shallower.
  - **What mondo uploads**: R2 data.js, three-renderer.js and `Assets/Land/` (land.json, land-map.png, sea.bin and 73 changed tiles); index.html to Render; the repo
    bake-land.js, land-roads.test.js, land-stream.test.js, this plan, docs/notes/areas-complexes.md, CLAUDE.md. Test:
    land-roads.test.js. Not measured on a real GPU. Kill-switch `window.EW_NO_LAND_ROADS`.
    Next: G6 (the sites on pads).

- **G6 — THE SITES ON PADS (2026-09-28, zip open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G6.zip, token
  20260928-geography-11-cors, delta on G5; new bake da0db7e906)**
  - Every outdoor site stands on its place's pad on the land: the Strip, Area 51 (gate, flight line, Hangar 18, the white
    rooms), Camelot (ward, hall, keep), Olympus's summit, Shasta, the woods' clearing, redwoods, staircase and ritual ground,
    the Grove, the estate's fields, the haunted grounds, Stonehenge, Giza, Babel, Göbekli Tepe and the Vatican. Walking off a
    site's edge puts you on the land; walking onto a site's pad puts you in it, with no load card.
  - Retired: Camelot's road part, Olympus's foothills and switchbacks, the two highway parts, the woods' trail and pasture, and the
    outdoor zones that stitched them. The links between the woods, the ranch, the Grove, Shasta and Camelot are gone (you walk
    there over the land). Dead Man's Cave opens off the land at the storm drain's mouth.
  - Camelot and the Vatican moved off River 1 (their pads buried it). The loch's skiff mooring moved with the loch's shore.
  - Inside a site the land is drawn around you (its ground cut under the site, no grass or trees through it); the site's
    edges ease to its pad, except where an authored tier stands at the edge (the staircase's landing stays a landing).
  - Downtown and the Bowl see Olympus at its real bearing from Downtown's place on the land.
  - The wall audit (R3) passes on every site. What mondo uploads: R2 data.js, three-renderer.js and all of `Assets/Land/`;
    index.html to Render; the repo bake-land.js, the tests, this plan, docs/notes/areas-complexes.md. Next: G7 (the city on
    the hill).

- **G7 — THE CITY ON THE HILL (2026-09-29, zip open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_G7.zip, token
  20260929-geography-12-cors, delta on the quick fixes zip; new bake 5d00c20e10)**
  - Downtown, the Bowl and the harbour stand on the land. Downtown is turned a quarter so the docks face the bay (east) and the
    old town climbs uphill to the west; the harbour lies off its quay; the Bowl stands on its own pad (rot 1) north of the city.
    The city and coast zones are retired; `HQ_STAGE_RULES.zones` is medwing, basement, dumb, land.
  - Downtown's ground carries a slope (`terrain.slope`, a profile along one axis read by `hqTerrainSlopeFn`): quay 0.4 m,
    old town 14.9 m above the sea. The streets are graded to 12 % at most; four stair streets cross the 3.2 m retaining step
    at the old town's edge (the avenue, the market lane, the church lane, the tower's street). Every district has a street
    steeper than 6 % and a stair. The canal and the fountains stay level on their terraces.
  - The bake levels the land round Downtown to the same profile (`hqLandSiteY`), and the island's edges ease to it. Where
    Downtown meets the harbour, that join owns the edge (no ease to the sea floor under the quay).
  - The renderer turns the land for a turned site (`uLandR` in the ground and water shaders; flora, blockers and roads through
    `_hqLandToScene`). Terraced lots stand on concrete plinths; city cars pitch with the slope.
  - The mall's main entrance moved to the bay's beach (a door on the land); the lighthouse stands on the bay's head.
    Retired links: downtown_strip, stadium_downtown, streets_strip (the land's roads run between the city, the Bowl and the Strip).
  - Recipe: city plateau h 20, the city hill bump west of the old town, a knoll on the headland east of the Bowl (it breaks the
    lighthouse's line to the Vatican's hill, R2), the bay's coast redrawn round the harbour, Route 7 from the city's south end,
    two unlabeled city roads.
  - Deviation: the plan's crown of about 60 m is not reached. A 176 m site with streets at 12 % or less carries about 15 m; the
    land's hill beyond the old town carries the rest.
  - Not done: the mall has no outside building on the beach yet; the cay and the Dutchman stand in no zone (behind their doors)
    until G8. Tests: city-slopes.test.js; the wall audit is clean on the three city sites. hq-coast.test.js is deleted.
    Next: G8 (the edge of the world).

