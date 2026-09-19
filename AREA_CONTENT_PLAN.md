# AREA CONTENT PLAN — filling the rooms with purpose (2026-09-19)

**The brief (the user, 2026-09-19):** "We have plenty of rooms and the assets and textures look
decent, but now we need to fill these rooms with content and purpose. They feel too much like
boxes. Need more elevation and things to climb up and down like ramps and stairs and ladders and
vines and ropes. Too many doors right next to each other in perfect view. Discovering a new door
or passageway should feel rewarding like finding a tape. Some areas could be much bigger, like the
streets of Disaster City / Cyberpunk City."

This is the plan that answers it. It is built on THE COMPLEX BLUEPRINT (EXPLORABLE_AREAS_GUIDE.md)
and on the sources in bytecauldron/awesome-level-design (§1). §2 is the measured state of the
building today (`node check-area-content.js`); §3 the rules that come out of §1 + §2, each with a
number a test can hold; §4 the one mechanic the brief needs that the walker does not have; §5 the
deliveries in order; §6 the decisions that are the user's. Nothing here is built yet.

## 1. THE SOURCES — what was read, what applies

`awesome-level-design` is a link list plus a Tips section; the substance is at the links. Read:
the Ghost of Tsushima weenie taxonomy (Game Developer), Andrew Yoder's "The Door Problem of
Combat Design", the Level Design Book's Layout / Typology / Flow / Blockout chapters, and the
list's own Tips. (Clement Melendez's "Push and Pull" essay is behind a 403 from here; its
denial / tease rule is quoted from memory of the Level Design Book's account of it.)

| Principle | Source | What it means for us |
|---|---|---|
| **The 30-second rule** — "players must be drawn by something every 30 seconds or less" | weenie taxonomy | At the walker's 4.2 m/s that is ≈ 100 m of travel: a flag (a tall landmark), a short flag (tall, seen only close) or a breadcrumb (a ground marker in a spaced run) inside every 100 m of any route. Most areas have ONE weenie for the whole part. |
| **Flags / short flags / breadcrumbs** | weenie taxonomy | Three kinds, not one. A lamp post run, torii-style posts, cairns, tyre tracks are breadcrumbs — cheap, and they are what leads to a hidden door. |
| **Players don't look up** | the list's Tips | Every hard tape on a pinnacle and every upper door needs a VISTA of the top from the way in (the plan's approach path should frame it) before the puzzle asks for it. |
| **Denial / the tease** | Push and Pull (via LDB) | Show the goal, take it away, hand it back by another route. A door SEEN across a chasm / behind bars / on a ledge and reached later is the "rewarding discovery" the brief asks for. A door seen and walked straight into is furniture. |
| **Parti — one idea per space** | LDB Layout | Every part gets ONE sentence ("a bowl you climb out of", "a ring you circle") before its features. A box with features scattered in it has no parti. |
| **Typologies** | LDB Typology | Corridor · switchback · combat bowl · hub-and-spoke · loopback · string of pearls. Name the one each part is; a part that is none of them is a box. |
| **The door problem** — footholds, one-way commits, partitions that hide information | Yoder | For the encounter: the seats should stand on a foothold (cover, height), not open floor; a drop-in that commits the walker (a one-way ledge) is a legitimate way INTO a wild room. |
| **Wall height 150–200 % of the figure; doorways 2× the figure** | LDB Blockout | Our walls are 3.2–9 m against a 1.75 m figure: fine. A 3-door wall run at 5–8 m spacing is the readability failure the brief names, not the door size. |
| **Combat bowl / arena needs multiple approach routes** | LDB Typology | An area's plaza (the battle marker) wants ≥ 2 ways in at different heights. |
| **Mechanics must be introduced and reinforced across the level** | the list's Tips | Skating, swimming, the door gun, the (new) climb each need a room that TEACHES it (the door gun has plaques; the rest have nothing). |

## 2. THE AUDIT — the building measured (2026-09-19, `node check-area-content.js`)

203 box-kind rooms: 77 terrain rooms (fields with a plan or hand features), 126 plain boxes
(the facility and the prefab parts). Of the 132 EXPLORABLE parts (rooms with a `site`):

| Family | rooms | avg m² | climb features / 100 m² | avg height range | rooms with a hidden exit |
|---|---|---|---|---|---|
| cave (the cave, the crypt, the pit, the workings) | 13 | 1 513 | **0.75** | 8.6 m | 5 / 13 |
| field (hand features, no plan) | 9 | 6 091 | 0.33 | 8.5 m | 3 / 9 |
| rooms (the 20 generated areas + the open parts) | 36 | 4 708 | **0.23** | 8.5 m | 13 / 36 |
| halls (D.U.M.B., Area 51, the underworld) | 14 | 4 525 | **0.16** | 5.4 m | 4 / 14 |
| city (Downtown, the Strip, the Grid) | 3 | 8 331 | **0.04** | 4.9 m | 3 / 3 |
| ley (the ley lines, the library) | 2 | 22 000 | 0.02 | 3.5 m | 1 / 2 |
| box (prefab parts) | 55 | 638 | — | — | 10 / 55 |

A "climb feature" is a ramp / stair / plateau / deck / wall row. Findings:

1. **The cave is the standard; everything after it is a quarter of it.** The seven hand-built
   cave chambers run 0.7–1.6 climb features per 100 m². The twenty generated areas
   (`HQ_AREA_SPECS`) run 0.08–0.20: one weenie plateau, one ramp, a hill — then 4 000 m² of
   noise. That is the "box" feeling: a big flat floor with a bump. The cities are 0.03–0.05.
2. **58 of 77 terrain rooms are under 0.4 / 100 m².** The height ranges look healthy (8 m
   average) because every area has one tall weenie; the floor between is flat.
3. **93 of 132 explorable parts have no hidden exit at all** — every way out is a plain door on
   a wall. The building has 12 secret doors and ~30 ways across 203 rooms.
4. **Doors on one wall:** only six explorable parts have two doors under 12 m apart on one wall
   (Downtown's streets at 8 m, Saturn 5 m, the Singularity 4.8 m, Olympus 4.8 m, the North Pole
   9.8 m); three have three doors on one wall (Downtown's streets, the ranch fields, the well
   room's five). So the "doors in perfect view" complaint is less about spacing than about
   EXPOSURE: a door is on a flat wall of a room whose floor is flat, so it is seen from the way
   in. Nothing hides it — no mass, no turn, no height.
5. **The cities are small for what they are:** 112 × 88 (Downtown), 104 × 84 (the Grid), 100 × 64
   (the Strip) — one ring road and two cross streets each; three to five doors each on the
   perimeter walls, so every exit is a wall you can see across the block.
6. **Content per part:** the generated areas carry 3–6 props, 1–2 natives, 1 marker, 1–2 tapes on
   ~4 000 m². The prefab parts carry 10–40 props on ~600 m². The generated areas are empty by a
   factor of ~20 per m².
7. **The walker can climb 0.62 m a step, jump 1.46 m, drop anything.** There is NO vertical
   mechanic beyond that: no ladder, rope, vine, climbable wall, lift or moving platform. A
   ramp / stair is the only way up. That is why every tier reads as a plateau with a ramp
   bolted on.

## 3. THE RULES (to be added to EXPLORABLE_AREAS_GUIDE.md once the user says yes)

Each rule has a NUMBER `check-area-content.js` reports, and a TEST that holds it (soft
warnings first — see §5 D1 — hard after the areas are brought up to it).

- **R1 CLIMB DENSITY.** An explorable part carries ≥ 0.6 climb features per 100 m² (open) /
  ≥ 0.8 (closed), of ≥ 3 distinct kinds (stairs, ramp, plateau, deck, wall, climb, float), with
  the height range ≥ 6 m (open) / ≥ 4 m (closed). The features CHAIN: every tier is reached by
  two different kinds (a stair AND a ladder; a ramp AND a jump line).
- **R2 THE 100-METRE PULL.** Along every door-to-door route (the solver's path), something the
  eye is drawn to stands within every 100 m: a flag on the sky, a short flag inside, or a
  breadcrumb run. Measured on the reach graph: no node farther than 50 m from a pull.
- **R3 DOOR EXPOSURE.** From a door's landing, at most ONE other door of the room lies in a
  clear line of sight (the terrain's own `_hqLosClear` over the field: masses, tiers, walls,
  treelines block). Two doors on one wall stand ≥ 12 m apart, three never (a third door goes
  round a corner, up a tier, or becomes a way / a draught). A door that MUST be exposed (a
  city's road out, a bay door) is exposed at the END of a street, never on a side wall.
- **R4 THE EARNED EXIT.** Every explorable part has ≥ 1 exit that is not a plain door on the
  critical path: a draught (`secret: true`), a `way`, a door on a tier you climb to, a door
  behind a gun puzzle (a `hard` ledge), a door under water (a swim), a door at the end of a
  breadcrumb run off the path. ≥ 1/3 of a part's exits are earned. The MAP already rewards the
  discovery (ON THE MAP / ROUTE CHARTED toasts; the `?` → number flip) — R4 is what makes the
  toast mean something.
- **R5 THE TEASE.** Every earned exit is SEEN before it is reached: from a spot on the critical
  path the door / the ledge / the far bank is in view and out of reach (across water, up a
  cliff, behind bars, on the far side of a chasm). "Players don't look up": a door on a tier
  gets a vista from the way in — the approach path frames it.
- **R6 PARTI + TYPOLOGY.** Every part's spec carries `parti: '<one sentence>'` and `typology:
  'bowl' | 'ring' | 'switchback' | 'hub' | 'loop' | 'pearls' | 'corridor'`; the audit prints
  them; a part without either is not finished (the weenie rule §5b's twin).
- **R7 SIZE.** A city part is ≥ 200 × 160 m with ≥ 3 DISTRICTS (a district = its own street
  grid, its own look, its own weenie, one seam to the next); an open wild part ≥ 60 × 50;
  a closed part is whatever its parti needs. Bigger only with more to find: R1 / R2 / R4 scale
  with the area, so a doubled city carries twice the climbs and twice the earned exits.
- **R8 CONTENT DENSITY.** A part carries ≥ 1 prop or native per 60 m² of OPEN floor (the
  prefab parts' rate is ~1 per 20; the generated areas' is 1 per 700). Props are the pack's and
  the kits' (MODEL_INDEX): no new models needed to hit it.
- **R9 THE TEACHING ROOM.** Every walker mechanic has ONE room that teaches it with a lesson
  plaque (`HQ_GUN_LESSONS`' pattern): the climb (D1), the skateboard (Room 26 / the garage),
  the swim (the natatorium), the door gun (done).

## 4. THE MECHANIC — `climb`: ladders, ropes, vines, chains, pipes, the climbable wall

One feature kind, one walker mode, five looks. Data (`terrain.features` row):

```
{ k: 'climb', x, z, y0, y1, face: 0|90|180|270, look: 'ladder'|'rope'|'vine'|'chain'|'pipe'|'wall', w?: 0.6 }
```

- **Compile** (`hqTerrainCompile`): a climb is a vertical LINE from y0 (the ground it stands
  on, or a deck) to y1 (the tier it reaches, ≤ 0.3 m under a top so the mount is a step).
  `hqTerrainFeet` is untouched (the line is not ground); the SOLVER gains an edge: the node at
  the foot ↔ the node at the head (`hqTerrainReach` reads `info.climbs`), so a tier reached by a
  ladder alone still satisfies every door-reach and return-guarantee test, and a hard tape
  above a ladder stops being hard. `hqTerrainTraps` treats the head as returning ground.
- **Walker** (three-renderer.js, the mode pattern of `_hqTickSwim`): `_hqClimbCheck(pl)` at
  the walker tick's tail — the body within 0.5 m of a climb's foot or head, facing it, pressing
  W (or SPACE at the head to drop on) → `_hqTickClimb(dt)`: the body on the line, W/S up /
  down at `HQ_CLIMB_RULES.speed` 1.6 m/s, A/D nothing, SPACE lets go (a drop; the walker's
  fall), the top hands the walker onto the tier with a small push, the foot hands back at the
  ground. Clips: sprites.js `HQ_CLIMB_CLIPS` — the UAL libraries have `Climb_Ladder_*` /
  `Climbing_*` style loops (verify with `node anim-sheets.js` before wiring; a rope uses the
  same loop at a slower timescale). The rider steps off the deck at a climb (`_hqRideToggle
  (false)`); the swimmer never climbs (a ladder out of water = the pool ladder, the swim hands
  over at the foot). Kill-switch `EW_HQ_NO_CLIMB`.
- **Renderer**: `_hqBuildClimbs` — a rung ladder (two rails + rungs, the pack's `MetalPipe` /
  wood), a rope (a catenary-free hanging cylinder with knots), a vine (the foliage OBJ's leaf
  material on a twisted cylinder, a few leaves), a chain (links), a pipe (a drain pipe against
  a city facade with brackets), a `wall` (a hand-hold texture band on a cliff — the climb is
  invisible but for the holds). All merged per look; one blocker at the foot so props stay off.
- **The prompt**: `[W] CLIMB` at a foot / head; the hint line `.hq-hints.climb`.
- **The audit**: R1 counts `climb`; the fire-escape is a chain of `climb` + `deck` rows.
- **Not in D1**: a moving platform / a lift inside an area (a later `lift` kind: a deck that
  rides between two y's on a ticker; the solver's edge is the same as a climb's).

## 5. THE DELIVERIES (in order; each one the user's zip)

**D1 — THE TOOL, THE RULES, THE CLIMB.** `check-area-content.js` (done, in this delivery) grows
R2 / R3 / R5 measurements (the pull distance on the reach graph, door exposure by the terrain
LOS, the tease's vista); `area-content.test.js` holds R1–R8 as WARNINGS (a printed list, never a
red) until D3 lands, then hard; `climb` per §4 with `hq-climb.test.js` (the solver's edge, the
trap rule, the walker on a stub line, the source sites); the climb's teaching room = the
garage's ramp wall (a ladder to the dock's roof with a plaque). Ship: data.js (R2 + Render),
three-renderer.js, sprites.js, styles-base.css (the hint), index.html; tests + docs.

**D2 — DISASTER CITY + THE GRID, TWICE THE SIZE.** *(SHIPPED 2026-09-19 as a local delivery — see §7; the overpass over a walked street was first re-shaped because the height field held one height per point — then D2b (§7, the same day) added THE BRIDGE LAYER and built THE OVERPASS over the avenue and THE OVERLOOK SPAN over the undercity.)* Downtown's streets → 224 × 176 with three
districts (THE FINANCIAL BLOCKS = towers + the parking deck + the overpass; THE OLD TOWN = low
brick, the market square, the church square (a second weenie); THE DOCKS = the waterfront,
cranes, the drowned quay = a swim to a container roof), the Grid → 208 × 168 (THE NEON GRID;
THE STACKS = tenements four storeys with fire escapes = `climb` chains onto rooftops that
CHAIN across the district on `deck` gangways — the rooftop run; THE UNDERCITY = a lower street
level 4 m down under the skyway, reached by stairs and drains); the Strip stays one district
but gains the back-lot rooftops. Verticality: the overpass (a 6 m `deck` road over the avenue
with on-ramps), fire escapes, the rooftop chain, the undercity, manhole drops into the sewers
(a `gutter` way per district). Door exposure: every seam leaves at the END of a street (the
`road` way), the subway stairs go DOWN into a mouth off the sidewalk, the tower / mall doors
stand in a recessed forecourt round a corner off the ring road. Earned exits: a rooftop door
(the tower's roof access), the drowned quay's hatch, the alley behind the hoardings. R8 with
the city batch + the urban pack props (`city_bin`, hydrants, benches, vending, dumpsters,
scaffolding = `climb` `pipe` + `deck`). The `city` plan gains `districts: [{ id, rect, look,
lots, streets }]` and the traffic / race / markings run per district. `check-terrain.js` +
`playtest_city.js` before anything is claimed.

**D3 — THE TWENTY AREAS, BROUGHT UP TO THE CAVE.** *(FIRST DELIVERY SHIPPED 2026-09-19 — Shasta, the North Pole, Olympus; SECOND DELIVERY 2026-09-19 — the Stadium, the Haunted grounds, the Spaceship deck: the six the user sees first are done; THIRD DELIVERY 2026-09-19 — Technoticlan, Agartha, Antarctica; see §7.)* `HQ_AREA_SPECS` rework, one spec at a time,
each to R1–R8: a parti, a typology, ≥ 3 tiers chained by ≥ 2 kinds, a ladder / rope / vine per
area where it fits the place (vines in the grove, the woods, Agartha; ropes in Shasta, the
North Pole, Olympus; ladders in the station, the deck, the base; chains in Hell; hand-holds on
Mars / the Moon), a breadcrumb run to an earned exit, a tease of the weenie's tape from the
plaza, 40–70 props per area from the packs already on R2. Order: the six the user sees first
(Shasta, the North Pole, Olympus, the Stadium, the Haunted grounds, the Spaceship deck), then
the rest. Two or three areas per delivery.

**D4 — THE DOOR PASS over the complexes.** Every part built before this plan (the woods, the
cave, D.U.M.B., Area 51, Camelot, the divine stair, the underworld, the deep, the ley, the
astral): R3 + R4 + R5 — a third door on a wall moves round a corner or becomes a draught;
every part gains an earned exit if it has none (the 93); every earned exit gains its tease.
Data-only (door rows + a feature or two per room); the solver and the landing tests hold it.

**D5 — THE FACILITY ROOMS' PURPOSE.** The 126 plain boxes: a room with no counter, no panel
and no find is a box with props (the works' warehouse, the boiler room, the laundry, the
dock, the corridors). Each gets ONE of: a by-id panel that reads something real off the
profile, a find, a daily line, a cast spot, or it is folded into its neighbour. The list is
in the audit (`--all`, `counters` 0 and no find). Copy is the user's (A15).

## 6. DECISIONS THAT ARE THE USER'S — TAKEN 2026-09-19 ("yes to all, or the recommended")

1. The numbers stand as set from the cave (R1 0.6 / 100 m² open · 0.8 closed; R7 200 × 160 cities,
   60 × 50 open parts; R8 a prop per 60 m²). They live in `check-area-content.js` `RULES`.
2. **D2 before D3.**
3. The five looks + the climbable wall (six); the lift / moving platform stays deferred.
4. **Warnings until D3** — `area-content.test.js` prints the offenders per rule and never reds;
   R9 (the teaching rooms) is hard from D1.
5. The prefab parts (family B) are exempt from R1; they take R3 / R4 / R8.

The questions as they were asked:

1. **The numbers in R1 / R7 / R8** — 0.6 climbs per 100 m², 200 × 160 cities, a prop per 60
   m². They are set from the cave (the standard the user named) and can be moved.
2. **D2 before D3, or D3 first?** The brief names the cities; the twenty areas are where the
   bay doors land most players. The plan says D2 first because it also builds the `districts`
   plumbing the other big areas (the ley, the abyss) can use.
3. **The climb's looks** — five in §4. A moving lift / platform is deferred; say if it should
   be in D1.
4. **Hard rules or warnings?** The plan makes R1–R8 warnings until D3; the user may want them
   red from D1 so no new area ships as a box.
5. **The prefab parts** (family B) are exempt from R1 (a hall is a hall); they take R3 / R4 /
   R8 only. Confirm.

## 7. LOG
- 2026-09-19 — the plan written; `check-area-content.js` added (read-only audit); EXPLORABLE_AREAS_GUIDE §10 logged. Nothing built.
- 2026-09-19 — **D1 SHIPPED (local delivery).** THE CLIMB per §4: data.js `climb` feature rows (`hqTerrainClimbs` → `info.climbs`,
  the head spot found PAST the tier's edge blend; `hqTerrainClimbEdges` = the solver's edge, read by `hqTerrainReach`, the reach
  grid, the trap check's forward and return walks — a pit with a ladder out needs no rescue ramp; a plan keeps a climb's foot
  and head OPEN; the scatter stays off them; the dump prints `|`); `HQ_TERRAIN_RULES.climbReach / climbSpeed / climbMount`;
  three-renderer.js "THE CLIMB" (before the per-frame section: `_hqBuildClimbs` — the six looks, a terrain room's rows + a box
  room's `room.climbs` compiled against its blocker tops —, `_hqClimbCheck` at the walker tick's tail = the foot walked INTO /
  the head walked OFF, `_hqTickClimb` = W / S at the speed, SPACE lets go, the top MANTLES (UAL2 ClimbUp_1m) onto the tier; the
  rider steps off the deck, the swimmer never climbs; `EW_HQ_NO_CLIMB`; `hq.climbs()` / `hq.climbing()`); sprites.js
  `HQ_CLIMB_CLIPS` (no ladder loop exists in either library — the swim stroke stood up, the float as the hang); map.js
  `onClimb` → the W CLIMB hint at a foot, the climbing line, a first-time toast. **THE TEACHING ROOMS (R9)**: data.js
  `HQ_WALK_LESSONS` (climb / skate / swim, `hqWalkLessons()`, the plaque proc reads both tables) — the garage's ceiling rose to
  5.4 m for THE DOCK OFFICE (a `stair_landing` platform on the west wall, one ladder in `garage.climbs`, the plaque at its
  foot); the skate plaque in Room 26, the swim plaque in the natatorium. **THE AUDIT** grew R2 (the pull distance on the reach
  graph), R3 (door exposure by a line of sight at eye height over the field / the props), R4 (the earned exits), R5 (the tease:
  an earned exit seen from a reachable node ≥ 6 m off with ≥ 0.8 m of height between), R6 (`parti` / `typology` on an
  `HQ_AREA_SPECS` row ride to the room), R8 (per 60 m² of OPEN floor); `node check-area-content.js [--rules]`; it is a module
  (`audit()` / `RULES`). Tests: `hq-climb.test.js` (the rules, the compile, the solver both ways, the return guarantee, the
  walker in a sandbox, the rooms, the sites), `area-content.test.js` (the tool, R9 hard, R1–R8 as warnings — heavy).
  UNSEEN LIVE (RULE #1c): the ladder's look and the walker on it (the stood-up stroke — `HQ_CLIMB_CLIPS.climb.ts` and the
  lean −1.3 in `_hqTickChars` are the edits), the mantle's timing, the platform in the raised garage, the three plates.
- 2026-09-19 — **D2 SHIPPED (local delivery): DISASTER CITY + THE GRID, TWICE THE SIZE.** THE DISTRICTS on the `city` plan
  (data.js `_hqTGenerate`: `gen.districts = [{ id, label, rect, lotW, lotD, lotMinW, lowP, storeys, texP, ruinP, style, fronts,
  neon, fenceKey, fenceH }]` — the district is read PER LOT at the run's position along a face, every lot row carries its
  district's look (`district`, `neon`, `texP`, `ruinP`, `style`, `fronts`), the fronts inherit it, a yard wall wears its
  district's fence, `info.districts` counts the lots per district, `info.gen.districts`; three-renderer.js `_hqTexPlan` /
  `_hqBuildCityLots` read the lot before the plan — a flipped neon flag goes into a second batch, a lot's `style` wins when
  the storeys allow it, the front's kind is the lot's). THE CUT (`plateau.sink: true` = a sunk tier the walker drops into
  and never climbs; a plan never forces it open). THE GANGWAY (`deck.gangway: true` = the forced band is the deck's own
  width — the grown band lay on the yard at ground level and made a pocket). THE FIRE ESCAPE (`climb.look: 'fireescape'`,
  a steel ladder with a grated landing cage; chained through landing plateaus 1.6 × 2.2 m). **DOWNTOWN 224 × 176** — THE
  FINANCIAL BLOCKS (the pinned core: the ring road, the plaza, the deck, the rooftop, the collapse — untouched) + THE OLD TOWN
  (the high street, market square's fountain, church square + the churchyard with the church GLB, THE COURT with THE
  WAREHOUSE ROOF up a fire escape, the metro's mouth down a dogleg, the tower's door behind a dogleg — R3) + THE DOCKS (the
  waterfront, THE CANAL behind its warehouses crossed by FOUR BRIDGES, THE QUAY with two cranes, the freight siding, three
  floodlights, THE CRANE PLATFORM up a gantry stair, THE BASIN of deep water with THE CONTAINER ROOF in it = the second
  tape, the door gun's, THE FLOODED QUAY waded to THE DROWNED MANHOLE = `links.docks_sewer`, a gutter into the sewers'
  south wall — an earned exit seen across the water). **THE GRID 208 × 168** — THE NEON GRID (the core) + THE STACKS (seven
  tenement roofs at 10.5 m behind the terrace, four fire escapes in two alleys, three gangways, the parapet rails) + THE
  UNDERCITY (THE CUT four metres down: THE RAMP ROAD = the boulevard's own incline the cars take, THE STEPS off both loop
  corners, THE DRAINS = two pipes down the retaining wall, THE LOWER CROSS, the bay door DOWN THERE, THE OVERLOOK 3 m up a
  ramp on the grid's south edge looking seven metres down into it — the tease of the lower city's gutter =
  `links.undercity_sewer` at the east drain's foot). The Strip stays one district (the plan's rule) and gains THE MOTEL
  ROOF + THE LAUNDRY ROOF, one ladder each. Every room wears `parti` + `typology` (R6). **THE AUDIT** refined: R7 counts
  districts (`RULES.R7.districts` 3); a road out (`way: 'road'`) is never earned; a door is "on a tier" against the room's
  MEDIAN sill (the lowest sill made every street door of a city with a sunk district a tier). **THE RULES THE SOLVER
  TAUGHT**: a rail row's forced band (2.8 m) must not lie past a tier's edge on the mass — rails stand ≥ 1.6 m inside a roof,
  one per roof (a rail across a yard gap opens the yard); a deep pool's sloped bank leaves a dry ledge at its foot the walker
  drops onto and cannot leave — a canal the walker never enters is `deep_water` with a SHALLOW bed (0.55 m) under its dark
  sheet; a fluid's forced band is wider than its water, so lots along a street backing onto a canal need ≥ 5.5 m of mass
  between the sidewalk and the bank. **MEASURED** (`node check-area-content.js`): Downtown 22 climb rows / 6 kinds / range
  9.8 m / pull 50 m / 0.9 items per 60 m² / 2 doors exposed at most / every earned exit teased; the Grid 33 rows / 5 kinds /
  range 14.5 m / 0.7 per 60 m² / 1 exposed / all teased. R1 (0.6 per 100 m²) is NOT met — at 24 000 / 16 000 m² of open floor
  it asks ~145 / ~96 climb rows per city; the number was set from 1 500 m² cave chambers and reads wrong for a city (the
  user's call: a per-district count, or a city exemption — §6). R4 stays a warning on Downtown (2 of 10 with the three
  roads excluded; the tower / metro / mall doors are pinned by older tests at their walls). **NOT BUILT, with the reason**:
  the overpass OVER a walked street and the undercity UNDER the skyway — a walkable layer over walkable ground needs a
  second height layer in `hqTerrainFeet` / the solver (every node is (x, z) with one y); the four bridges span water the
  walker never enters instead, and the undercity sits beside the overlook. Tests: `hq-city-districts.test.js` (the districts
  on a synthetic city, the cut, the gangway + the fire escape chain, the three cities' sheet, the solver + the roofs + the
  door gun's roofs + the sewers' grates (heavy), the audit's refinements (heavy), the sources); amended hq-city (the ring
  is still driven both ways among more routes), hq-city-2 (the shelters ≥ 2), hq-city-repair (cars per m², never more than
  the first cut's), urban-pack (a yard wall wears its district's fence; the two renderer pins), hq-underworld (the
  pumping alley doglegs). UNSEEN LIVE (RULE #1c): all of it — the fire-escape cages against the tenement sheets, the
  gangways over the yards, the ramp road's cars going down, the overlook's rails, the canal's dark sheet at 0.55 m, the
  church GLB in its yard, the cranes' scale, the flooded quay's grate under the water, the traffic islands' trees on the
  avenue, the districts' looks side by side (the old town's brick hoardings against the financial glass).
- 2026-09-19 — **D2b SHIPPED (local delivery): THE BRIDGE LAYER — the overpass over a walked street.** The user: "Why is
  that limit there and how can we remove it? Surely we can figure out how to make bridges in the game. Of course we need
  stacked walkable areas like bridges. Why can't we have 2 floors or even more? … why can't we just use 3D objects as
  bridges?" THE ANSWER: the limit was one data structure — `info.H` holds one height per (x, z), a `deck` was written into it,
  and every solver keyed a node by cell alone. The walker never collided with meshes (a prop's top is already a floor: the
  stairwell's stacked step blockers), so a 3D-object bridge always walked — but the solvers could not SEE it, so no test
  could prove a route across it. The fix is the wall rule generalised: a **`bridge`** row (`{ k: 'bridge', x0, z0, x1, z1,
  w, y, thick?, rails?, key? }`, or a `deck` wearing `over: true`) is a SECOND SURFACE the field never carries — data.js
  `hqTerrainBridges` → `info.bridges` (each with its `layer`); `hqTerrainFeet` returns its top for feet ARRIVING within a
  climb of it (`hqTerrainBridgeFor` — a fall lands on the first slab under it; a free query is the ground's), the ground
  under it stays walked while the slab leaves `HQ_TERRAIN_RULES.headroom` (1.95 m — a lower slab is a wall to the body
  beneath, never a clip), `hqTerrainAir` / `hqTerrainCam` hold the slab solid (`hqTerrainInBridgeSlab`), and EVERY solver
  keys a node by cell + layer × (nx·nz) (`_hqTNodeFeet` = the candidates at a cell: the step's surface, the jump's cliff
  top, every bridge the jump reaches from below; `_hqTReachGrid` / `_hqTReachJump` / `_hqTReturnJump` / `hqTerrainReach`
  (string keys `i,j` / `i,j,L`; `hqTerrainNodeKey(info, x, z, y)`) / `_hqTTraps` (components over cells)). Any number of
  bridges may stack (`hqTerrainLayerAt`). A plan forces only a bridge's two MOUTHS (a short run inside each tier — the
  raster's round cap must stay inside the tier or the ground beside it opens and traps). The renderer draws the slab (the
  path sheet on top, the cliff sheet on the sides), a box girder, kerb lips, steel rails (grind rails on the register) and
  PIERS where the ground lies ≥ 1.5 m below and no traffic route runs (each a blocker) — `_hqBuildBridges`; the door gun's
  ray lands on a deck (`_hqPortalSurf` → `hqTerrainBridgeBelow`) and the lip snap puts a floor door on one. THE TWO:
  Downtown's **THE OVERPASS** (the parking deck's roof west across THE AVENUE at 3 m to THE WEST LANDING, a 3 m tier in the
  north-west block's corner, up THE OVERPASS STAIR from an alley off the ring road's sidewalk; the avenue's cars and walkers
  pass under it) and the Grid's **THE OVERLOOK SPAN** (the overlook south over THE CUT and THE LOWER CROSS to THE PIER, a 3 m
  tower in the undercity, down a 7 m fire escape to an alley off the lower cross — the overlook no longer only looks down).
  Both cities: every door reached, nothing traps, zero rescue ramps (`node check-terrain.js` prints `bridges n`; the dump
  draws a span as `B`). Tests: `hq-bridge-layer.test.js` (the rules, the feet under / on / the fall / the stack / the
  headroom wall, the solver across a span only, the plan's mouths, the two cities (heavy), the renderer on a stub scene,
  the source sites); hq-terrain's KINDS pin. NOT built: a bridge that SLOPES (a `bridge` is level — a sloped span is a ramp
  on the field or a chain of level spans), a door standing ON a bridge, props authored on a bridge (`y` on the row stands
  them; the tabletop seat does not read a deck), the full second floor with its own rooms and walls (EXPLORABLE_AREAS_GUIDE
  §5 item 3 — the bridge layer is its pattern). UNSEEN LIVE (RULE #1c): the slab's read from below (the girder, the piers on
  the pier alley's kerbs), the rails' height against the walker, the overpass's headroom under a truck GLB, the fire
  escape's 7 m against the pier's flank, the west landing's cliff on the plaza's corner.
- 2026-09-19 — **D3, FIRST DELIVERY (local): SHASTA · THE NORTH POLE · OLYMPUS, brought up to the cave.** Three of the six the user
  sees first (§5 D3's order), each re-specced in `HQ_AREA_SPECS` to R1–R8 and measured clean by `node check-area-content.js --rules`
  (R1 0.61 / 0.77 / 0.82 climb rows per 100 m² of open floor (16 / 17 / 18 rows, 6 kinds each, ranges 9.6 / 7.8 / 8.6 m); R8 1.36 / 1.32 / 1.09 per 60 m²; R3 nothing exposed; R4 2 of 3 exits earned on the slopes and the summit, the hearth on the village (its drift door is 1.2 m over the median sill); R5 every earned exit teased; R6 a `parti` + a `typology` on each; R8 ≥ 1 per 60 m²). **THE SLOPES** (switchback):
  THE SHELF (3.6) up the trail or the hand-holds on its south rim, THE LOOKOUT (6.4) up a ladder on it, THE SADDLE (2.4) up a stair off
  THE FALLS' pool or a rope up its south face, THE CRAG (4.8) by a rope off the saddle, THE SNOWLINE (4.4) up a stair off the saddle
  or a rope at its east end — the woods' frame stands ON it (`woods_shasta.b` carries `y: 4.4`: a door you climb to), THE SUMMIT (7.2,
  the tape — the door gun's) on the snowline, seen from the crag and the snowline; THE CREEK (waded) with a plank, the corral wall
  the rider grinds; **LEMURIA = a DRAUGHT** (`links.shasta_lemuria`, `secret: true`, route `woods`: the west wall's boulders ⇄ THE
  CRYSTAL CITY's north wall at x 10 — the plain `shasta_agartha` door THE AREAS pruned stays pruned; the hidden passage is the
  earned exit). **THE SUMMIT** (hub): THE THRONE DAIS (3.0) up its stair or the carved flank's hand-holds, THE HIGH TERRACE (3.0) to
  the west wall up a stair or over a `deck` wearing `over: true` (THE BRIDGE LAYER) from the dais — Heaven's gate of cloud stands ON
  it (`heaven_olympus.b` → `wall: 'w', z: -19, y: 3.0`), THE SPIRE (6.6, the tape) off its south edge, THE FORGE's lava (a 0.55 m
  bed, the canal rule; `gen.open` round it so its bank has no pocket against a cloud bank) under THE ANVIL TERRACE (2.2) and THE LOFT
  (5.0) up a chain, THE LOWER COURT (1.2) up a ramp or a rope, three stepping clouds (`float: true`) 1.1 → 2.0 → 3.0 to the dais's
  west side; the Lodge's painting moved to n x 8 (R3: 20 m from nothing, behind the dais from the court). **THE VILLAGE** (pearls):
  THE WORKSHOP's deck (1.0) runs to the west wall with the hearth ON it (`northpole_haunted.a` → `wall: 'w', z: -2, y: 1.0`) — a
  ramp or the ice-block hand-holds up, THE LOFT (3.4) up a ladder, THE FROZEN LAKE (waded) with two floes, THE ICE WALL (3.2, the
  grind) between the plaza and THE DRIFT (2.2) up a stair or a rope with the sleigh road's door ON it (`northpole_camelot.a` → n x 14,
  y 2.2), THE POLE's cairn (6.2, the tape) off the drift's west edge, THE SLEDGE HILL under THE ICE SHELF (4.0) by a rope, THE GIFT
  STACK (1.3) with a ladder, the meltwater stream with a plank. **THE RULES THE COMPILER TAUGHT**: a climb's LINE stands ≤ 0.3 m off
  its mass — the head scan starts `climbMount` (0.3) in and breaks on the FIRST flat step, so a rope 0.6 m short of a tier's rim
  reads a flat head and is dropped (four of thirteen were; `hqTerrainInfo(id).climbs` is the read — the sandbox swallows the warning);
  a climb's foot must stand OFF its tier (a wall-holds row on the tier's own top reads 3.6 → 3.6); a dry pocket of a lava bank between
  the sheet and a plan's bank is a trap the compiler cuts a rescue ramp out of — force the plan open round the pool. Tape pins moved
  with the weenies (`findSpots`). hq-climb.test.js's six-looks pin reads seven (D2's fire escape — the pre-existing red). NEXT: the
  other three of the six (the Stadium, the Haunted grounds, the Spaceship deck), then the rest of the twenty.
- 2026-09-19 — **D3, SECOND DELIVERY (local): THE BOWL · THE GROUNDS · THE DECK — the other three of the six the user sees first, brought up
  to the cave.** Each re-specced in `HQ_AREA_SPECS` (data.js) and measured clean on R1–R8 by `node check-area-content.js --rules` (climb rows /
  kinds / per 100 m² / range / items per 60 m² / earned exits: THE BOWL 24 / 5 / 0.64 / 8.6 m / 1.12 / 2 of 3; THE GROUNDS 22 / 6 / 0.97 / 6.2 m /
  1.63 / 2 of 3; THE DECK 18 / 5 / 0.76 / 8.5 m / 1.26 / 2 of 3; at most one door exposed anywhere; every earned exit that is not a draught teased;
  a `parti` + a `typology` on each; `node check-terrain.js` solves every door from every door with no trap and no rescue ramp). **THE BOWL**
  (ring): the bay door stands ON THE CONCOURSE — the south stand, 3.4 m up (`siteRooms.entry.prebuilt_stadium.door.y`; you come in at the top,
  the pitch in the bowl below, the press box's tape across it) — two stairs down and the hand-holds at the tunnel mouth; the west / east stands
  (3.0) up their stairs (the treads were too steep: a stair needs L ≥ 2.2 × h) with a pipe run up the west stand's back from THE SERVICE ROAD; THE
  NORTH STAND (3.0) up its stair or the hand-holds on its west end, THE PRESS BOX (6.4, the tape — the door gun's) moved onto it (the tape pin
  moved with it); THREE GANTRIES = level `deck` rows wearing `over: true` (the bridge layer) joining the stands at the corners over the walk-round;
  two floodlight pylons on plinths (1.8) with ladders; the dugout roofs and the stands' rails (the grind); 53 items (chairs on the stands, the
  popcorn carts on the concourse, the ticket booth, the linesman's chair, a crashed car behind the west stand); **THE PITCH DRAIN** =
  `links.stadium_sewers`, a DRAUGHT (`secret: true`, route `sewers`) behind the east stand into the sewers' east return (the earned exit — a road
  out never is). **THE GROUNDS** (pearls): THE PORCH raised to 1.6 with the front door ON it (a door you climb to — earned) and the ivy up its west
  corner; THE FAMILY PLOT (0.8) with THE ANGEL; THE CRYPT is a block (2.6) you climb by its ivy, THE GARGOYLE on its roof, the churchyard wall the
  grind; THE GAZEBO's deck (0.6) round the roof that holds the tape; THE TERRACE (1.4) along the east side up a stair or the hand-holds, the
  balustrade on it; THE COACH HOUSE roof (3.6, a ladder and a rope); THE TREEHOUSE (3.2, a ladder and a rope) in the old oak by the west fence;
  THE FOOTBRIDGE over the pond; 62 items. **THE DECK** (corridor, now 62 × 50 — R7): THE AIRLOCK on a TOWER (3.2 — the companion stair, a ladder
  on its east face, the pipe run up its west; the airlock is a door you climb to, earned); THE BRIDGE'S ROOF (1.6) up its stair or a pipe run; THE
  SENSOR MAST's platform (2.4, a ladder and a chain); THE ENGINE BELL (4.2, a chain and a pipe run); THE GANGWAY across THE BREACH (`over:
  true`); three radiator panels (the grind; the aft one 2 m tall so the bay's landing sees ONE other door, R3); **THE CARGO HATCH** = a plain
  door pair wearing `secret: true` between the deck's east wall and the hold's west wall (a draught inside the site — hq-floors' secret-door count
  is ten — a pair is two doors); the cryo pods, the lander and the rover lashed on deck, three flood masts; 50 items. **THE RULE THE COMPILER TAUGHT (the one that
  matters for every area still to do)**: a tier's cliff face rises from its NOMINAL edge INWARD over ~0.5 m (measured: a rect at x 14 rises
  14.0 → 14.6; a round tier's blend starts ~0.4 m outside its radius), and `hqTerrainClimbs`' head scan starts `climbMount` (0.3) in from the
  line and breaks the moment the ground stops rising — so **a climb's LINE stands 0.3 m INSIDE the tier's nominal edge**: the scan starts on the
  top, the foot (`climbReach` 0.6 back) lands 0.3 m outside the edge on the ground. A line 0.6 m OUTSIDE a rect's edge reads a flat head and is
  DROPPED (fifteen of twenty were, silently in the sandbox — `hqTerrainInfo(id).climbs` is the read, the audit's `climbs` column now); the first
  delivery's round tiers survived that placement only because their blend reaches out. The other two rules that bit: with TWO doors the audit's
  median sill is the HIGHER one, so a tier door on a two-door room is never earned — the third door (the draught) is what makes the concourse and
  the airlock count; and the ground BEHIND a stand against the shell wall is a pocket the walker drops into off the stand's back (three rescue
  ramps cut) until a `path` (THE SERVICE ROAD) and `gen.open` circles at the corners join it to the open floor. Tests: hq-floors' pin (nine
  secret doors); the rest hold as written. NEXT: the remaining fourteen areas (Technoticlan, Agartha, Antarctica, Mars, the Moon, the Grove, the
  Flatlands, the Looking-Glass's garden, the Lodge, the Singularity, Saturn, Hollow Earth, the Dutchman's deck, the Backrooms), two or three a
  delivery, on the same pattern — then D4, D5.
- 2026-09-19 — **D3, THIRD DELIVERY (local): THE TEMPLE CITY · THE CRYSTAL CITY · THE STATION — the first three of the remaining fourteen, brought up
  to the cave.** Each re-specced in `HQ_AREA_SPECS` (data.js) and measured clean on ALL of R1–R8 by `node check-area-content.js --rules` (climb rows /
  kinds / per 100 m² / range / items per 60 m² / earned exits: THE TEMPLE CITY 27 / 5 / 0.89 / 8.2 m / 1.55 / 2 of 3; THE STATION 20 / 6 / 0.69 / 7.4 m
  / 1.33 / 2 of 3; THE CRYSTAL CITY 18 / 5 / 0.63 / 8.0 m / 1.42 / 4 of 5; at most one door exposed anywhere; every earned exit that is not a draught
  teased; a `parti` + a `typology` on each; `node check-terrain.js` solves every door from every door, nothing traps, zero rescue ramps). **THE
  TEMPLE CITY** (processional): THE PYRAMID moved east of the ley terrace with its back AGAINST the north wall (the 2 m strip behind it was a
  pocket the walker dropped into off the back — 46 cells), three tiers 2.5 / 5.0 / 7.5 — THE GREAT STAIR up the south face, THE OTHER STAIR up
  the west flank (the gag made real), the hand-holds up both east faces, THE TEMPLE the tape (the door gun's); THE AQUEDUCT = THE PRIEST HOUSE
  (3.0, a stair + a rope) north of THE CANAL and THE MARKET TERRACE (3.0, a stair + a vine) south of it joined by a level span the canal is
  waded under (the bridge layer); THE BALL COURT's STAND (2.4, a stair + a ladder) at its west end; THE OBSERVATORY (4.2, the long ramp down from
  the north wall's side, a chain up its east face — moved north: the strip between its foot and the canal's bank was a 3-cell pocket); THE LEY
  TERRACE (2.0) on the north wall with `babel_technoticlan.b` standing ON it (`y: 2.0` — a door you climb to; the x −5 hq-leylines pins is
  kept), a stair from the west + the hand-holds up its south face; two planks over the canal; XIBALBA = a DRAUGHT (`links.technoticlan_agartha`,
  `secret: true`, `leaf_portcullis`) under the ball court's west wall into the crystal city's east wall; 46 items. **THE CRYSTAL CITY**
  (terraces): THE LOWER TERRACE (1.6, a stair + a vine), THE UPPER TERRACE (3.6, a stair + a rope), THE GALLERY = a level span from it east to
  THE BALCONY (3.6, a ladder from the ground) over the lower terrace (the bridge layer — the upper terrace grew 3.4 → 3.6 so the slab leaves
  the 1.95 m of headroom over the lower one; a lower slab is a wall to the body beneath), THE ADIT TERRACE (2.4) on the north wall with
  `cave_agartha.b` standing ON it (`y: 2.4`; a stair + the hand-holds), THE SPIRE moved over the lake's west bank (the tape pin moved with it),
  THE CRYSTAL FOREST (3.0, a stair + a vine), THE PIER's wall along the lake (the grind); THREE DRAUGHTS come out here now — Lemuria's (the
  first delivery's), THE POLAR OPENING (`links.antarctica_polar`, `leaf_bulkhead`, the station's west wall ⇄ the city's west wall) and XIBALBA
  — on a NEW dashed route **`routes.hollow` · THE INNER EARTH** (the pruned plain doors `antarctica_agartha` / `shasta_agartha` stay pruned,
  hq-areas pins them; a draught wears a new id); 4 of 5 exits earned; 43 items. **THE STATION** (traverse): THE DECK the huts stand on (1.2, the
  ramp + a ladder + the hand-holds), THE RADIO MAST's plinth (3.2, a ladder + a chain), THE MELT POOL (waded), two PRESSURE RIDGES (the grind),
  THE CREVASSE (never entered — its bed 0.55 m now, the canal rule) crossed by the one plank, THE ICE SHELF (4.0, the long stair + a rope), THE
  DRILL RIG (2.2, a chain + a ladder) beside THE ICE WALL (the tape, moved east of the hull; the pin moved), and THE HULL (3.0) rising out of the
  ice on the north wall with the ship's collar standing ON it (`antarctica_derelict.a` `y: 3.0` — a stair up its east side, a ladder on its
  west); the polar draught in the west wall; 48 items (the snowcat and the SUV stand in for the traverse's vehicles). **THE RULE THE COMPILER
  TAUGHT**: a `climb` row's `face` is the direction TOWARD THE MASS (`hqTerrainClimbs`: `ux = sin(face)`, `uz = −cos(face)` — face 0 = the tier
  is NORTH of the line, 180 = south, 90 = east, 270 = west); a line on a tier's north face wears `face: 180`. Every row of the first draft had the
  north / south faces inverted and the probe read every one as a drop before a flat head — the read is `hqTerrainInfo(id).climbs` against the
  authored rows (the scratch probe prints foot / mount / in-1.2 per row). Two pockets the solver found on the crystal city (the forest's back
  corner, the strip behind the upper terrace) were joined to the open floor with `path` rows, not rescue ramps. Test amended: hq-cave.test.js's
  far-lane crowding compares north-wall link doors only (a side-wall draught has no `x` — the assertion read NaN). Pre-existing on main before
  this delivery, not touched: doorhq's server-banks count + Camelot's dry board, hq-cave's eight secret doors (ten since the cargo hatch),
  hq-spaceship's deck hatch, hq-terrain's fountain on Downtown, hq-world's seams list (the two sewer gutters). NEXT: Mars, the Moon, the Grove;
  then the Flatlands, the Looking-Glass's garden, the Lodge, the Singularity, Saturn, Hollow Earth, the Dutchman's deck, the Backrooms — then D4, D5.
- 2026-09-19 — **D3, FIFTH DELIVERY (local): THE GARDEN · THE HALLS · THE HORIZON — brought up to the cave.** Each re-specced in `HQ_AREA_SPECS`
  (data.js) and measured clean on ALL of R1–R8 by `node check-area-content.js --rules` (climb rows / kinds / per 100 m² / range / items per
  60 m² / earned exits: THE GARDEN 20 / 5 / 0.88 / 9.8 m / 1.80 / 2 of 4; THE HALLS 19 / 4 / 1.09 / 5.5 m / 2.06 / 2 of 4; THE HORIZON 24 / 4 /
  0.84 / 12.6 m / 1.26 / 1 of 3; one door exposed at most; every earned exit teased; a `parti` + a `typology` on each; `node check-terrain.js`
  solves every door from every door, nothing traps, zero rescue ramps; every authored climb compiled — `hqTerrainInfo(id).climbs` 6 / 8 / 8).
  **THE GARDEN** (grid): THE TEA LAWN (1.6, a ramp + a vine, the table set for four), THE CROQUET GROUND (1.6, a stair + the hand-holds, the
  umpire's chair), THE WHITE QUEEN'S TOWER (3.4, a stair off the tea lawn + a rope) and THE BISHOP'S LANDING (3.4, a stair + a vine) joined by
  THE HEDGE WALK (the bridge layer), THE RED KING'S TOWER (3.4, a ramp off the croquet ground + two vines, the throne), THE RABBIT HOLE (a
  2 m bowl), the moon's perch (6.4, the tape) seen from the landing; the mirror and the dead tree stand under the tiers (the tease); four
  `gen.open` circles kill four pockets. **THE HALLS** (halls, h 5.0): THE WEST GALLERY (2.2, a stair + a ladder + the bell rope) and THE ORGAN
  LOFT (2.2, a ladder + the organ's pipe) joined over the round table by THE MINSTRELS' WALK (the bridge layer), THE HIGH TABLE (3.9, the tape —
  out of a jump's reach from either gallery; the pin moved to (0, −15)), THE SCREEN across the sanctum's mouth (R3), THE MEZZANINE over the bar
  (2.6, a stair + a ladder + the panelling's hand-holds; the painting of Olympus is seen from it), THE STACKS (2.4, a stair + the library ladder
  + a pipe), THE WINE CELLAR (−1.6, a stair down — the 322 basement); `grove_lodge.b` moved to `e z 14` (14 m from the painting, R3). **THE
  HORIZON** (bowl): THE DROP is a real 4 m bowl now, THE WEST SHELF (2.2), THE NEAR LENS (3.4, a ramp + a rope) and THE FAR LENS (3.4, a chain +
  a stair) joined by THE LENSING ARC (the bridge layer), THE EAST TERRACE (2.4, the survey camp) under THE JET (4.6, a floating shard: a ladder
  + a chain), THE ORBIT's three floating stones, THE OBSERVATORY LEDGE (2.4) on the north wall with the observatorium's screen standing ON it
  (`observatorium_singularity.b` `x 14, y 2.4` — a door you climb to, seen from the floor, 19 m from Saturn's frame). **THE RULE THE COMPILER
  TAUGHT**: a `dip`'s `h` is its DEPTH (positive) — the old drop (`h: -4`) and the rabbit hole were MOUNDS; and a climb's `face` is the
  direction toward the mass in the room's own axes (0 = −z, 180 = +z, 90 = +x, 270 = −x), whatever the wall is called. The suites and the
  hard-tape proofs were not run at the user's word (`npm run test:quick` passed; the two tools solved and audited the three rooms). NEXT:
  Saturn, Hollow Earth, the Dutchman's deck — then D4, D5 (the Flatlands and the Backrooms are skipped at the user's word).
- 2026-09-19 — **D3, FOURTH DELIVERY (local): CYDONIA · THE MARE · THE GROVE — brought up to the cave.** Each re-specced in `HQ_AREA_SPECS`
  (data.js) and measured clean on ALL of R1–R8 by `node check-area-content.js --rules` (climb rows / kinds / per 100 m² / range / items per
  60 m² / earned exits: CYDONIA 19 / 4 / 0.63 / 6.6 m / 1.33 / 2 of 3; THE MARE 20 / 5 / 0.77 / 7.4 m / 1.47 / 2 of 3; THE GROVE 17 / 6 /
  0.63 / 7.4 m / 1.88 / 2 of 4; at most one door exposed anywhere; every earned exit that is not a draught teased; a `parti` + a `typology`
  on each; `node check-terrain.js` solves every door from every door, nothing traps, zero rescue ramps; every authored climb compiled —
  `hqTerrainInfo(id).climbs` 9 / 8 / 6). **CYDONIA** (pearls): THE CANYON from the bay door to the plaza between TWO MESAS (3.2) — the west
  one up a long ramp, a rope on its east face and the hand-holds on its north (THE BASE CAMP on it), the east one up a stair off its north
  side, the hand-holds on its south face and a chain on its east (THE SURVEY on it) — joined by **THE ARCH**, a level span (the bridge layer)
  over the canyon floor at 3.2 m, the plaza under it; THE PYRAMID's lower tier (2.4, the great stair + the hand-holds on its east face) and
  upper tier (4.8, a ladder on its west face + the hand-holds on its east); THE ROVER BAY's mesa (2.6) on the north wall with the ship's
  collar standing ON it (`mars_derelict.a` `y: 2.6` — a stair up its east end, the hand-holds on its south face, a rope on its west); THE
  FACE (6.4, the tape — the door gun's) moved over the west crater and seen from the west mesa (the pin moved with it); three craters; **THE
  FACE'S MOUTH** = `links.cydonia_mare` (`secret: true`, route `lunar`, `leaf_bulkhead`): a draught in the west wall the greys bored to the
  far side of the Moon (the plain `mars_moon` THE AREAS pruned stays pruned — a draught wears a new id; hq-areas pins it); 47 props + 4
  natives + 17 scattered. **THE MARE** (bowl): THE BIG CRATER (−2.4, a bowl the walker drops into and climbs out of) and the small one;
  THE LANDING PAD (1.3, a ramp + a ladder) with the lander on it; THE BOULDER SHELF (1.4, a ramp + the hand-holds) with THE HABITAT on it;
  THE DISH's platform (3.4, a ladder + a chain); THE TERRACE (2.4) on the north wall with the collar standing ON it (`moon_derelict.a`
  `y: 2.4` — a stair, a ladder on its east end, a rope on its west) and **THE CATWALK** (a level span, the bridge layer) from it to THE
  ANTENNA PLATFORM (2.4, a ladder) under THE RIM (5.6, the tape — the door gun's, 3.2 m over the platform: the tease); THE OVERLOOK (3.0, a
  ramp + a rope) over the crater; THE MASS DRIVER's rail (the grind); THE FAR SIDE = the draught's other end in the west wall; 40 props + 4
  natives + 19 scattered. **THE GROVE** (ring): THE LAKE (waded) fed by THE CREEK (waded) under THE LOG (a deck), THE DOCK onto the water;
  THE STAGE (1.4, the ramp + a vine on its south face); THE MOUND (2.6, the stair + a vine on its east face + a rope on its north) with THE
  OWL (6.4, the tape — the door gun's, seen from the stage) and the altar on it; **THE WEST TERRACE** (2.2, a stair from the north + a
  rope on its south face) with the owl's gate standing ON it (`woods_grove.a` `y: 2.2` — a door you climb to); THE TREEHOUSE (3.4, a
  ladder + a vine) round the old redwood; THE HOLLOW; THE FENCE (the grind); THE CAMP's three tents; **THE MEMBERS' TUNNEL** =
  `links.grove_lodge` (`secret: true`, route `ranch`, `leaf_saloon`): a draught in the east wall (z 12, behind a dogleg) into the Lodge's
  east wall; four redwoods stand on the terrace's two sightlines (the bay's and the tunnel's) so the owl's gate sees one door at most
  (R3); 46 props + 4 natives + 21 scattered + 2 groves. **THE RULE THE SOLVER TAUGHT**: the strip between a tier's cliff and a plan's rock
  bank is a pocket the walker drops into off the tier and cannot leave — a rescue ramp was cut at Cydonia's west mesa's north-west corner
  until a `gen.open` circle forced the plan open along that face; read `RETURN:` on every room before claiming it. The suites were not
  run at the user's word (the three rooms were solved and audited by the two tools; `npm run test:quick` passed). NEXT: the Flatlands, the
  Looking-Glass's garden, the Lodge, the Singularity, Saturn, Hollow Earth, the Dutchman's deck, the Backrooms — then D4, D5.
