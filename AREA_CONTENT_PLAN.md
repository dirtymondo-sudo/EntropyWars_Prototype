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

**D2 — DISASTER CITY + THE GRID, TWICE THE SIZE.** Downtown's streets → 224 × 176 with three
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

**D3 — THE TWENTY AREAS, BROUGHT UP TO THE CAVE.** `HQ_AREA_SPECS` rework, one spec at a time,
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

## 6. DECISIONS THAT ARE THE USER'S

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
