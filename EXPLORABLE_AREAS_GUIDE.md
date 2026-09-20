# EXPLORABLE AREAS — THE GUIDE (map generation, the three families, discovery)

**Read this before building or reworking ANY explorable area** (a complex, a site room,
a floor of the facility). It replaces the scattered "blueprint" rules in CLAUDE.md and
DOOR_HQ_BUILD_PLAN §9 with one answer per question. Started 2026-09-17 from the user's
review of the four complexes (THE WOODS, THE CAVERN, DISASTER CITY, THE DIVINE STAIR).
Append to §10 (the log) every session that touches an area.

The user's brief, verbatim where it matters:

- "Some maps should be more pre-fab, like the DOOR HQ egress/rotunda, with buildings/rooms
  like the haunted house and space ship inside of it. Some should be box/room and hallway,
  like the mystery dungeon maps or classic rogue maps (H-Wing, the underground tunnels).
  The cellular structure for natural looking places."
- "Ideally you could utilize more than one in the same map if it helps the setting and tells
  a story (hell could be a prefab throne area but then lead to a more dungeon-like or
  cellular cave structure)."
- "I want areas with multiple floors/platforms (like for when we get to the DUMB, think Portal)."
- "We are going to abandon/rework the rooms that look like the delta maps. Make the area look
  as realistic as possible, but still have that floating crystal thing somewhere with the
  option to battle. Start by getting rid of the square ledge round the perimeter."
- "The player starts with the normal DOOR HQ rooms and a few worlds, and has to explore and
  discover more. After they clear a map (the three win conditions), THEN a little scene with
  Otto finishing repairs on a new door, and that door becomes available in the facility."
- "I haven't had frame rate or lag issues — don't be afraid to make the area even bigger.
  The world feels a lot more connected when every door is not another loading screen."

---

## 1. THE THREE FAMILIES (and what the code already has)

Every explorable area is built from ONE of three generation families, or a hand-off between
them. The names below are the ones the code uses; the games / papers they come from are in
§2 so a future session can look further.

| Family | The code today | Use it for | Feel |
|---|---|---|---|
| **A · NATURAL (cellular)** | `terrain.gen.kind: 'cave'` — cellular automata on a 1.4 m lattice, rounded, the solid raised to `wallH` in the cliff sheet (data.js `_hqTGenerate`) | caves, canyons, badlands, crypts, ice, anything eroded | organic, no straight line anywhere |
| **A' · NATURAL (clearings)** | `terrain.gen.kind: 'rooms'` — elliptical clearings joined by a Prim tree + `loops` winding corridors, the solid a THICKET bank of trees | woods, cloud fields, swamps, gardens, ruins overgrown | open sky, rooms you can see across |
| **B · PREFAB (hand-placed rooms)** | a `kind: 'box'` room with authored `doors`, `props`, `counters` (the whole facility: the rotunda + rings, the suites, the Haunted House parts, the Spaceship's decks, the Dutchman below decks) | man-made interiors and set-pieces: throne rooms, lobbies, bridges, chapels, a mall, a station | every wall means something; the art is placed, not grown |
| **C · ROOMS-AND-HALLWAYS (maze / rogue)** | `terrain.gen.kind: 'halls'` (2026-09-17, D.U.M.B.) — a BSP of the shell into leaves with a rectangular ROOM in each, plus AUTHORED rooms (`gen.rooms`, the prefab chambers) and AUTHORED halls (`gen.halls` polylines, a ring or a spine), joined by a Prim tree + `loops` of L-SHAPED corridors; the solid a MASS to the ceiling (the city's rule), its boundary TRACED into `info.planWalls` (wall rows in an `urban:` sheet; `simplify` collapses the raster stairs); `bsp: false` = the authored rooms and halls alone. Still by hand: H-Wing, the Works' tunnel, the service corridors, the dungeon cells | dungeons, sewers, bunkers, back-of-house, D.U.M.B., Portal-style chamber chains | corridors between rooms, doors on rooms, keys and locks |
| **C' · THE LINES (straight corridors that fork)** | `terrain.gen.kind: 'ley'` (2026-09-18, THE LEY LINES) — AUTHORED straight lines between the stations (`gen.lines`), generated FORKS at ley angles (`forkDeg`, narrower than a line) that run straight until they meet another corridor, the rim, or run out into a NICHE (a round dead end — the design, never a `deadEnd`), a chamber at every crossing and behind every station (`gen.chambers` for the authored ones); the solid a MASS to a low ceiling, traced into walls that light themselves (three-renderer.js `_hqBuildLeyVeins`) | the ley lines, a mine's drifts, a catacomb's galleries, an ant nest, anything DUG in straight lines by someone with a plan you cannot read | claustrophobic, ruler-straight, forks you cannot see the end of |
| **D · STREETS (roads first)** | `terrain.gen.kind: 'city'` — authored polyline streets are the corridors, the blocks the solid, lots terraced along every face, buildings as MASS at street level (§4) | any city, a suburb, a base with roads, a harbour | a grid you navigate by street names |

Two more things exist and are NOT families:

- **THE CAVE GRID** (`room.cave.rows`, the ASCII dungeon) — superseded by the terrain field.
  The code stays for a room that still wears one; never author a new one.
- **THE Δ SITE ROOM** (`hqSiteRoom`, the 8 × 8 board on the floor of a box with the map's
  near setting round it) — being retired as a LOOK (§6). The BOARD ROOM stays as the thing
  a threshold opens onto and the place the crossing console / battle marker stand, but it
  should look like the place, not like the battle map.

### Which one, when

- Is it something nature made? → **A** (closed) or **A'** (open). Never straight edges.
- Is it something people built with a purpose you can read from the plan? → **B**, and give
  every room a job (a counter, a panel, a native, a tape, a seam).
- Is it a place whose POINT is the getting-through — a dungeon, sewers, a bunker, a test
  facility? → **C**. The player should be able to draw the map from memory afterwards.
- Does it have roads? → **D**. Roads first, then blocks, then buildings, then the life.

### Mixing families in one map (the user's rule: tell a story with the hand-off)

A complex is several PARTS (`site_<mapId>_<part>`), and each part picks its own family.
The seam between parts is where the story turns: a prefab throne room (B) whose back door
opens on a cellular cave (A); a city street (D) whose metro stair drops into a maze of
service tunnels (C); a mall (B) with a supply closet that is a way to another city (D).
Within ONE part, a family can host authored features from another (a `plateau` + `stairs`
ramp in a cave is a prefab platform in a natural field). The renderer does not care which
family made the field; only the DATA changes.

**The rule for hand-offs:** the door between two families is a REAL door / way on the wall
(a `links` row or a door row), the two parts each solved on their own, and the plate on the
door says where you are going. Never blend two generators inside one field.

---

## 2. THE RESEARCH — what other games do, and what to borrow

Named so a future session can look each one up; the borrowings are the ones that fit
this engine (a height field + a mask + blockers + doors on walls).

**Natural**
- *Cellular automata caves* (Conway-style birth/survival on a random fill; the classic
  RogueBasin recipe; used by Terraria's caves, Noita, many roguelikes). Ours: `cave`.
- *Drunkard's walk / random walkers* (carve by wandering; Nuclear Throne). Good for RIVERS and
  TUNNELS inside a solid — borrow it for a `stream` that carves its own bed through a plan,
  and for the sewer family (§C).
- *Noise fields + thresholds* (Perlin / simplex: Minecraft's terrain). Ours: `hill / dip /
  ridge / noise`. Borrow: a `mask` cut by a noise threshold for badlands (big open, islands of
  rock) instead of automata.
- *Poisson-disc scatter* for trees / rocks (Bridson). Ours: the thicket lattice + jitter.
  Borrow when a scatter looks gridded.

**Rooms and hallways (family C — to be built as a generator)**
- *BSP (binary space partition)*: split the rect recursively, a room in each leaf, corridors
  between sibling leaves (Rogue-likes since the 80s; Diablo I's tilesets). The most readable
  dungeon; rooms are rectangles, corridors L-shaped. **This is the one to build first** for
  D.U.M.B. / the sewers / the dungeons.
- *Room-placement + spanning tree* (place rooms at random, reject overlaps, Delaunay → MST +
  a few extra edges, corridors along the edges; TinyKeep / Phi Dinh's write-up). Ours: the
  woods' `rooms` kind is exactly this with ellipses and thickets — the generator can be
  reused with rectangles and WALLS for family C.
- *Template rooms* (Spelunky: a 4 × 4 of hand-authored room templates with a guaranteed
  path; Binding of Isaac: hand rooms on a grid). Borrow: a library of PREFAB room templates
  (a cell block, a lab, a pump room, a switchback stair) the generator stamps into BSP leaves.
- *Cyclic dungeon generation* (Joris Dormans, *Unexplored*): build the graph as CYCLES (a loop
  with a lock and a key, a shortcut opening back to the start) before the geometry, so every
  dungeon has a "you came round" moment. Borrow: `loops` (we have it) + a LOCK / KEY pass:
  a rank leaf or a Keys gate on one edge of a cycle, the key (a tape, a switch, a door gun
  target) at the far end.
- *Mission graph → space graph* (the same author): decide the sequence of BEATS (entrance,
  teach, test, twist, boss, exit) first; map beats onto rooms second. This is how a PREFAB
  complex should be planned (§3).
- *Wave Function Collapse* (Gumin; Townscaper, Bad North, Caves of Qud's overworld): tile
  constraints solve a consistent local pattern. Powerful, heavy; NOT worth adding while we
  have a working field + prefab kit. Revisit if the Backrooms wants infinite office.

**Cities (family D)**
- *Parish & Müller, "Procedural Modeling of Cities" (CityEngine)*: L-system ROADS (major roads
  follow population / a pattern — grid, radial, organic), MINOR roads fill blocks, blocks
  subdivided into LOTS along the street frontage, buildings extruded per lot by shape grammar.
  Ours follows the order: `gen.streets` are the major roads (authored, deliberately), the
  block is what is left, lots are TERRACED along every frontage, a building per lot.
  Borrow next: a MINOR-road pass (alleys / service lanes splitting big blocks) so the
  interiors are not one dead yard, and lot depth to the block's medial axis (straight
  skeleton) so back-to-back lots meet.
- *Cities: Skylines / SimCity zoning*: roads first, then a band of ZONING CELLS 4 cells deep
  along each road; a building "grows" on 1–4 cells of frontage; the back of the block past
  the zoning depth is empty or a park. Same as ours: `lotD` is the zoning depth. Their lesson:
  the empty interior is FINE when the frontage is continuous — but it needs a yard wall, a
  fence, a car park or a park, never an invisible line (§4's yard walls).
- *GTA / Sleeping Dogs*: the walkable city is the SIDEWALK + the road + a few interiors; the
  block interior is closed. The reading of a block is its corner buildings and its signs. Ours:
  the kerb, the sidewalk band, the lamps, the signs; corner lots must never be missing.
- *Tensor-field streets* (Chen, Esch, Wonka, Müller "Interactive procedural street modeling"):
  streets follow a smooth direction field with singularities — how to make a city that is
  not a grid (a hill town, a harbour). Borrow later for a non-grid city (Tartaria?).

**Multi-floor / platforms (the user's Portal ask)**
- *Portal / Portal 2 test chambers*: a chamber is ONE prefab room; the game is the CHAIN
  (entry lift → chamber → exit lift → catwalk / back-of-house → next lift). Vertical is the
  interesting axis: the entry is high, the puzzle is below, the exit is up a stair you earn.
  Borrow: the CHAMBER CHAIN as a family-C variant (prefab chambers, generated back-of-house
  corridors between them, every chamber entered from its lift lobby).
- *Metroid / Hollow Knight*: rooms on a big grid with vertical shafts; ability gates; the map
  fills in as you go. We already have the ledger + THE MAP; a SHAFT (a room that is tall and
  thin with ledges) is the missing room shape.
- *Mirror's Edge / Dying Light rooftops*: the second city is the ROOFS — a walkable layer 3–5 m
  up joined by air-con units, planks, pipes. Our `plateau` + `deck` + `ramp` + the door gun
  are exactly that. The LIP snap makes a rooftop the door gun's goal.
- *Tony Hawk parks*: every level has a line (rails → quarter → gap → rail). THE PARK RULE.

---

## 3. THE BUILD ORDER for any new area

1. **The story beats first** (mission graph): what does the player do here in order —
   arrive, see the landmark, find the tape, meet the native, fight (the crystal), find the
   seam out. Write it as a list in DOOR_HQ_BUILD_PLAN §9 before any coordinates.
2. **Pick the family per part** (§1). One family per part; the hand-offs at doors / ways.
3. **Size generously.** The user has no frame-rate ceiling: 100–150 m a side for an open
   part is normal now (Disaster City is 112 × 88; the cavern 52 × 42 was the OLD scale).
   The field costs O(cells) to solve — at `res` 0.5 a 150 × 150 room is 90k cells, fine; go
   to `res` 0.6–0.7 past that. Fewer, bigger, connected parts beat many small ones: "every
   door is not another loading screen" — a room change IS a load, so join what can be joined
   into one field and use `plateau` / `deck` / walls INSIDE it instead of a second room.
4. **Author the field** (features in room metres, in order — data.js `hqTerrainCompile`'s
   header lists every feature kind). A generated plan (`terrain.gen`) for A / A' / D;
   authored walls + props for B; C by hand until §7's generator lands.
5. **The weenies** (§5b) — place the far one and the near one BEFORE the plan, then lay
   the plan so the pads see them. Then the pads, the park rule, the hard tape (§5).
6. **`node check-terrain.js <room>`** — every door reaches every other, RETURN traps 0, the
   open share sane. Then `npm test`. Never claim a room the solver has not passed.
7. **The look** — `shell.look` (an `HQ_ROOM_LOOKS` row), the sky / fog, the room's own
   light. The aesthetic is the deliverable (the user's rule).
8. **The ledger** — the room is on THE MAP by construction (a door from a reached room or a
   `links` row); a new SITE = the 7.10 checklist; tapes re-homed (the hundred is fixed).
9. **Screenshots offline** where the tooling exists (`playtest_hq_offline.js`,
   `playtest_gun_offline.js`), then hand over — the look live is the user's (RULE #1c).

---

## 4. CITIES — THE RULE (STREET LEVEL rev 2, 2026-09-17)

**A city's solid is MASS, never terrain.** The `city` plan used to raise every block 3.2 m
as a concrete podium (the cave rule's rise) and stand the buildings on it — "the weird
raised plateaus the buildings sit on". That was the cellular rule leaking into an urban
map. Now (`HQ_TERRAIN_GEN.city.podium: false`, the default):

- the ground stays at STREET LEVEL under every block — the concrete yard behind the buildings;
- the MASK itself refuses the walker inside a block (`hqTerrainFeet` → null where the mask's
  signed distance is under `solidPad` 0.3 m — the body's share of the face line; the door
  pads and side streets are forced open, so a door on the wall still has its lane);
- the AIR and the CAMERA meet the block as a solid to `info.solidTop` (`hqTerrainSolidTop`:
  a lot's own roof, `storeyH` 3.4 per storey, else `wallH`) — the boom never dips into a
  building, a jump never lands in one, the door gun's wall snap puts a door ON a façade;
- every run of a street face no lot covers wears a YARD WALL (`fenceH` 2.4 in `fenceKey`
  `bricks_2`, an `info.walls` row the renderer draws like any wall; `info.yardWalls` lists
  them) so nothing is an invisible line — but never in front of an authored TIER (a rooftop /
  a parking deck: its own cliff is the face, and the door gun's LIP snap wants that cliff);
- `podium: true` keeps the extruded solid for a plan whose units ARE the mass — the mall
  (`prisms: false`, the store units to `wallH` under their storefronts). That is the only
  podium left.

What a city still needs (the next passes, in order):
1. **Minor roads / alleys** through big blocks (Parish & Müller's second pass) so a block
   interior is a service lane you can walk, not a yard you can't.
2. **Corner lots always** (a block corner with no building reads as a gap even with a wall).
3. **Interior fill**: back-to-back lots meeting at the block's medial axis; a car park or a
   pocket park where they don't.
4. **Roof access**: a fire escape (a `ramp` + `plateau` on one lot per block) so the roofs
   are a second layer for the door gun and the deck.
5. **Prefab set-pieces INSIDE the plan** (a station front, a hotel, a police precinct) as
   authored `open` islands with their own props — family B inside family D.

The renderer's comment over `_hqBuildCityLots` still says "on the podiums"; this section is
the truth.

---

### 4b. THE DISTRICTS (AREA CONTENT D2, 2026-09-19 — R7: a city is ≥ 200 × 160 with ≥ 3 districts)

A city part carries `gen.districts = [{ id, label, rect: [x0, z0, x1, z1], lotW, lotD, lotMinW, lowP, storeys,
texP, ruinP, style, fronts, neon, fenceKey, fenceH }]` — bands or blocks of the room, each its own look. The
district is read PER LOT at the run's position along a face (a face may cross a district line); every lot row
carries its district's look and the renderer reads the lot before the plan (`_hqTexPlan` / `_hqBuildCityLots`:
neon, ruinP, style, texP, the front's kind; a flipped neon flag goes into a second texture batch); a yard wall
wears its district's fence; `info.districts` lists them with their lot counts. A district's streets are the
plan's streets (a `district` label on a street row is documentation). One circuit per room still.

The pieces a city's verticality is built from, and the rules the solver taught:
- **THE CUT** — `{ k: 'plateau', …, h: −4, sink: true }` = a sunk tier (THE UNDERCITY): the ground is cut down to
  h with the same cliff sides; the walker drops in and never climbs back at the wall; a plan never forces it open
  (its streets and blocks are the plan's). Leave it up a `ramp` (a road the cars take), a stair, a `climb`.
- **THE ROOF** — a `plateau` at the storeys' height (3 × 3.5 = 10.5 for a three-storey terrace) BEHIND the lots of
  a street face (the lots need ≥ 3.9 m of depth in front of it) and flush to an ALLEY (a `path` — no lots on a
  path): the roof reads as the terrace's roof and the alley is where the fire escape stands.
- **THE FIRE ESCAPE** — `climb.look: 'fireescape'` chained through a LANDING plateau (1.6 × 2.2 m, half the height,
  `edge: 0.15`) standing against the roof's flank in the alley: the lower ladder on the landing's alley face, the
  upper on the roof's face, 1.2 m apart along the flank; `face` points at the mass.
- **THE GANGWAY** — `{ k: 'deck', …, y: roof, gangway: true }` between two roofs across a YARD (a mass) — never
  across a street: the height field holds ONE height per point, so a deck over a walked street blocks the street.
  `gangway: true` keeps the forced band to the deck's own width (the grown band lay on the yard at ground level and
  made a pocket the walker dropped into).
- **THE RAIL ON A ROOF** — a `rail` row's forced band is 2.8 m wide: stand it ≥ 1.6 m inside the roof's edge, one
  per roof (a rail across a yard gap opens the yard; a rail on the edge opens a strip on the mass below = a trap).
- **THE CANAL** — water the walker never enters is `deep_water` with a SHALLOW bed (0.55 m) under its dark sheet: a
  deep bed leaves a dry ledge at the bank's foot the walker drops onto and cannot leave (the compiler rescues it
  with a ramp — a scar). A fluid's forced band is wider than its water: lots on a street backing onto a canal need
  ≥ 5.5 m of mass between the sidewalk and the bank. A bridge is a `deck` authored after the canal (a causeway).
- **THE OVERPASS over a walked street** (D2b, 2026-09-19) is a **`bridge`** row — `{ k: 'bridge', x0, z0, x1, z1, w, y, thick?,
  rails?, key? }` (or a `deck` wearing `over: true`): a SECOND SURFACE the height field never carries (data.js
  `hqTerrainBridges`; the wall rule generalised — hqTerrainFeet returns its top for feet arriving within a climb of it, the
  ground under it stays walked while the slab leaves 1.95 m of headroom, the solvers key a node by cell AND layer). Its two
  ends stand 0.7 m INSIDE the tiers it joins (their heights = its `y`); a `bridge` is LEVEL (a slope is a `ramp` on the
  field); bridges may stack; never run one over a car ramp that rises to within the headroom of its slab (that strip of
  the ramp becomes a wall). The renderer draws the slab, the rails (grind rails) and piers where no traffic runs. A
  `deck` (written INTO the field) is still right over water the walker never enters; over anything WALKED use a bridge.

## 5. MULTI-FLOOR AND PLATFORMS (the Portal ask)

What exists for vertical play, per family:

- **A terrain field**: `plateau` (a tier with cliff sides — dropped off, never climbed),
  `ramp` (`stairs: true` for treads), `deck` (a plank bridge at a height), `wall` (its top a
  floor once reached), `pool` (waded). The walker climbs ≤ `HQ_STEP_TOL`, jumps 1.3 m, drops
  ANY height (platforming). THE DIVINE STAIR's switchbacks 0 → 12 m are the reference.
- **A box room**: `shell.gallery` (a second floor along one wall with a flight), a door at a
  height (`door.y` — THE STAIRWELL's loop), stacked `stair_step` blockers, the mezzanine
  and THE THIRD RING in the rotunda (`level: 1 / 2`).
- **The door gun**: the LIP snap (a wall hit near a roof's edge = a floor door on top) is
  the vertical puzzle verb; a `hard` tape is its goal.

What is missing, and the plan for it:
1. **THE SHAFT ROOM** (family B/C): a tall box (h 12–20 m) with ledges on alternating walls
   (`plateau` rows can't do walls — a box room needs a `ledges: [{ wall, y, w, d }]` shell
   field the renderer builds as slabs with blockers + the surface layer, like the gallery).
   Portal's chamber = a shaft with the exit up.
2. **THE CHAMBER CHAIN** (family C): prefab chambers (a template library) joined by generated
   back-of-house corridors; every chamber entered at its lift lobby, exited up a stair.
   **BUILT 2026-09-17 as the `halls` plan (D.U.M.B. — the build-plan entry):** the authored
   chambers are `gen.rooms` rects with their tiers, stairs, decks and pits INSIDE them (SUB-LEVEL
   7's four chambers off a hub with THE TOWER), the BSP fills the back-of-house round them, the
   L-corridors are the chain; the CERN ring is one authored loop hall with `bsp: false`. What a
   chamber template library would still add: a `gen.rooms` row naming a TEMPLATE (`tpl: 'drop'`)
   that stamps its features at the room's frame — today each chamber's features are authored
   in room coordinates by hand.
3. **TRUE FLOORS in one room**: a second height field over the first (`terrain.floors[]`,
   each with its own mask; a stair / a lift / a hole joins them; `hqTerrainFeet` reads the
   floor the feet are on). This is the big one; do it after the shaft room proves the
   surface-layer pattern.
   **THE PATTERN IS PROVEN (D2b, 2026-09-19): the `bridge` layer (§4b) — a surface the field never carries, read by the
   feet's arrival height, solid to the air and the boom, a second node per cell in the solvers. A true floor is that with a
   MASK instead of a slab, plus its own walls; a stair / a hole between the floors is the bridge's mouth rule.**

---

## 5b. WEENIES — the landmark that pulls you through (Disneyland's rule)

Walt Disney's Imagineers call it a **weenie**: an irresistible visual landmark placed in the
distance to draw the guest's eye, spark curiosity and guide them through the park without a
sign (the castle at the end of Main Street; the Matterhorn from Tomorrowland; a lamp post
lit on a dark path). **Every part of every area gets one, and it is placed BEFORE the
floor plan** — the plan is laid so the sightlines reach it.

Two sizes, both count:

- **THE FAR WEENIE** — outside the room, on the sky: `shell.sky.landmarks = [{ kind, id, deg,
  dist, s, y }]` → three-renderer.js `_hqLandmarkBuilders` (today: `peak` Shasta, `castle`
  Camelot, `stairway` the stairway in the sky, `dome` the basilica; add a kind = one
  builder). deg 0 = north, clockwise; `dist` a share of the sky disc; never a floater. It
  tells the player which WAY the world continues (the woods' Shasta stands over the trail
  whose top door opens on Shasta; the observatory's stairway stands due north over the door
  that climbs it). The landmark and the seam it promises point the same way.
- **THE NEAR WEENIE** — inside the room: one tall, lit, singular thing at the far end of
  the entrance's sightline — THE NEEDLE in the cavern, the old redwood in the clearing,
  THE TOWER on the staircase, THE SKULL STACK, THE PLINTH in the lava, THE PILLAR OF LIGHT,
  a slot machine's glow, the sun in the bridge's viewport. Rule of thumb: from the door
  pad, before the first step, the player should already see where they want to go.
  The HARD TAPE usually sits on the near weenie (the door gun's puzzle IS the reward for
  reaching what drew you); the crystal (the battle marker) is a weenie too when it stands
  in the open.

Placement rules:
1. **One per sightline, not one per room.** A big part with a bend gets a second weenie
   round the bend; a corridor room (family C) gets a light at its far end and nothing else.
2. **Visible from the pad.** After the plan runs, check the line from each door's pad to
   the weenie is not solid at eye height (a plan corridor along it — `gen.open` rows, or
   an authored `path`, carve it). `node check-terrain.js` prints the dump; read the line.
3. **Lit and singular.** A weenie is the brightest or tallest thing in its view and there
   is only one of it. A cluster of five towers is a skyline, not a weenie.
4. **Chained.** A weenie is best seen from the door you arrive by and STANDS BESIDE the
   door you leave by — so each one hands you to the next part. THE MAP's `?` node is the
   same idea drawn.
5. **Scaled to the room.** A 3.4 m skull stack in a 40 m crypt; a 5 m billboard on a 100 m
   grid; a 50 m castle on the sky. The user: "they can be smaller weenies too."
6. **A far weenie needs a horizon.** An OPEN room only (a closed chamber's weenie is near);
   a city's far weenie is a tower / a dome / a ferris wheel over the roofs — Disaster City
   should wear the tower it keeps falling from (a `kind: 'tower'` landmark to add).

Field per part in the build-plan entry: `weenie: { far: <kind or none>, near: <feature>,
seen from: <door> }`. A part with neither is not finished.

## 5c. WATER — the sea you sail, the ocean you swim (THE DEEP, 2026-09-18)

Water is not a family; it is a LAYER any family's field can wear, and two walker MODES ride on it.

- **`terrain.sea = { y, key, under }`** (data.js hqTerrainCompile) puts ONE water surface over the whole field. The
  field is the SEA FLOOR. Ground above `y` is land; ground within `wadeMax` under it is a wade (the old pool rule);
  anything deeper is a SWIM — `hqTerrainFeet` floats the walker at `y − swimDraft` (1.1), a step the climb accepts
  from the shallows, so the solver, the trap check, the finds and the landings all cross the water on their own.
  `hqTerrainFluidAt` reports the sea as a pseudo-fluid (`sea: true`): scatter and finds stay dry unless a scatter row
  says `sea: true` (kelp, coral in the shallows). **`under: true`** = a DROWNED room: the surface is above the
  ceiling, the whole room is the ocean, the feet rule is the ground everywhere with NO climb (the swimmer flies), no
  fluid anywhere (the water is that room's air). THE OPEN SEA (Room 345's part) is the first; THE ABYSS (Room H-20's)
  the first drowned one.
- **Islands out of the sea floor are `plateau … blend: 'ground'`** (the edge rises from the ground under it) or
  `hill`s — a plain plateau blends from height 0 and stands a cliff at the waterline (the first cay did). A jetty is
  a `deck` with ONE bank on purpose: its end is the sea. The whirlpool / the upwelling are `way`s entered by BEING IN
  them (`open: true`; the builder returns `mouthY`; three-renderer.js `_hqSeaWayCheck`).
- **THE SWIMMER** (three-renderer.js "THE DEEP"): the walker becomes it at the walker tick's tail when deep water is
  under the feet (or the room is drowned) — WASD along the camera, SHIFT faster, C dives, under the surface W swims
  where you look, SPACE up, C down; the shallows hand the walker back. Clips: sprites.js `HQ_SWIM_CLIPS` (UAL1's
  swim pair) baked onto the walker's rig. **THE HELM**: a catalogue prop with `vehicle: 'boat' | 'sub'` (E within
  `boardReach`): THE SKIFF sails the surface (a draft it will not cross), THE BATHYSCAPHE drives the column (SPACE /
  C for depth). `float: true` props ride the surface, `hover` props hang over the floor. `HQ_SEA_RULES` is the table.
- **THE LOOK**: the sea's ONE surface is the battle's animated sheet over the field and the outer ground, DoubleSide;
  under it the scene wears a dense teal fog (the sky dome goes), god rays hang from the surface, marine snow drifts
  round the camera, bubbles rise from a diver / the sub; a drowned room's shell says `underwater: true` and its
  `sky` is a navy dome with no stars (`hqAbyssShell`). Kelp sways in a vertex shader (`_hqKelpMat`), the coral, the
  anemones, the clams, the vents and the fish schools are procs (MODEL_INDEX §3n names the models that would replace
  them).
- **Building a sea room** = `hqSeaShell` (or your own open shell with the map's sky row) + `terrain.sea` + islands +
  a jetty + a `skiff` prop + the whirlpool link; **a drowned room** = `hqAbyssShell` + `terrain.sea { under: true }` +
  the floor's relief + the `submarine` prop + an `upwelling` end. Everything else (the pads, the park rule, the hard
  tapes, the weenies, check-terrain) is the ordinary checklist (§8). Nothing about the battle changes (§6: the fight is
  the site's Δ).

## 6. THE Δ SITE ROOMS — the rework

The user: the rooms that look like the delta maps are abandoned as a LOOK. Keep:
- the BOARD ROOM as the threshold's destination (`hqSiteRoom(mapId)`, `site_<id>`), because
  the bay door, the crossing console and post-match returns land there;
- **THE CRYSTAL** — the `battle` counter / `battle_marker` proc at the board's centre (the
  beacon that spins) — as the one place a fight is offered; it may stand anywhere in the
  room, not on an 8 × 8 replica.

Drop, in this order:
1. **The square ledge round the perimeter** — the open room's flat `apron` + `skirt` + the
   paving line (renderer `_hqBuildBoxShell`, the `_ew_hqGround` pieces) and the walkway
   masts on the corners. A TERRAIN room already has none of it: `_hqBuildOuterGround` runs
   the field's own ground out 54 m under the fog. So the rework of a site room = **make it a
   terrain room** (`terrain` + a plan of the site's family) with the marker on it, and drop
   `hqSiteRoom`'s board + apron for that site (`siteRooms.built` keeps the id; a new
   `siteRooms.terrain[id]` row says "this site room is authored, not generated").
2. **The 1:1 board on the floor** — the site's setting (its near builder at 1:1) stays as
   DRESSING where it helps (the Stadium's stands, Camelot's wall), but the field under it is
   the place, not the tiles. The encounter already fights the SITE's Δ from any terrain
   room (`hqFieldRoomOk` refuses a terrain room), so nothing about the battle changes.
3. **The pilot**: one site per family — the Moon (A, craters as `dip`s on a planet ground),
   Camelot (B + A', the castle a prefab in a `rooms` field), Downtown (D — its board room
   becomes the streets' own block, the marker on the plaza). Then the rest by the same three
   recipes.

---

## 7. DISCOVERY — the doors you earn (the progression rule)

The user's rule: **start with the facility and a few worlds; explore and discover the rest;
clearing a map (the three win conditions) plays Otto finishing repairs on a NEW door, and that
door opens in the facility.**

What the code has today: `doorSiteState(door, profile)` = clearance / sealed (a locked
sector) / codered / unstable / stabilized; `hqSiteMastery` + `masteryConditions` (wipeout ·
tower_destroyed · hourglasses_collected) = the three win conditions; `hqLinkSee` = charted
seams; `hqRoomSee` = THE MAP's ledger; Otto is a cast member (`DOOR_CAST` — "kneeling at a door
on the mezzanine", DOOR_MASTER A16; pose `kneel-fix`; his tool crates stand at the doors he
might be working on).

The design (build in this order; each step is one delivery):
1. **The starter set**: `DOOR_HQ.discovery = { start: [mapIds], byDoor: {…} }`. A threshold
   not in `start` and not yet EARNED reads as a new state **`'repairs'`** in `doorSiteState`
   (the plate: ROOM № · THE SITE · UNDER REPAIR; the leaf is `leaf_frame_only` + Otto's
   crate + warning tape; the door opens on nothing). Walking to a site through a SEAM still
   works (that is discovery by exploring: `hqLinkSee` charts it and `hqRoomSee` puts it on the
   map) — the FACILITY door is what Otto builds.
2. **The unlock rule**: `hqDoorEarned(mapId, profile)` = the map is in `start`, OR it is
   charted (walked to), OR its `byDoor` PREREQUISITE is mastered (`hqMapMastered`). The
   prerequisite graph is the world graph's routes: mastering a station unlocks the next
   station on its line (the bays keep their sector grouping; a site can have two parents).
3. **THE OTTO SCENE**: on the commit of a mastery that earns a door (battle.js `commitAch
   Progress` → a `window._hqNewDoor = { mapId, doorId }` marker), `_hqReturnOrMenu` lands the
   officer on the mezzanine facing the door: Otto in `kneel-fix` at the frame, sparks
   (`_hqFindSparkle`'s motes), the DOOR sound kit's stamp, the leaf swings in from
   `leaf_frame_only` to the catalogue leaf, the plate re-plates (`hqApplyRoomVariant`'s
   re-plate path), Otto stands, one user-authored line (A15 — Claude drafts it `draft: true`),
   a toast NEW DOOR · ROOM №. Viewer-local, nothing relayed (RULE #2). Filed in
   `progress.hq.doors.earned` (synced, monotonic, like the finds).
4. **THE MAP** already dots an unseen far end as `?`; a repairs door is drawn as a hollow
   node with a wrench glyph until earned.

---

## 8. THE CHECKLIST for a new part (copy it into the build-plan entry)

- [ ] family chosen per part; the hand-offs are doors / ways with plates
- [ ] size: as big as the place wants (≥ 60 m a side outdoors), joined where a room change
      would only be a load
- [ ] `terrain.gen` for A / A' / D (`node check-terrain.js` passes: every door, traps 0);
      a city: no podium (`podium` only for a mass-of-units plan), corner lots, yard walls
      only where no tier stands
- [ ] every door on a pad; a `y` door on a tier lands on it
- [ ] THE PARK RULE: a rail and a ramp (a `rail`, a `wall` top, a `ramp` or a quarter pipe)
- [ ] the hard tape (`findSpots` pin + `hard: true`) reachable by a door gun shot
      (`hqFindHardReachTerrain`)
- [ ] THE WEENIES (§5b): a far landmark on the sky (`shell.sky.landmarks`) where there is a
      horizon, a near one inside (tall, lit, singular) at the end of the entrance's sightline,
      visible from every door's pad; the hard tape on the near one where it fits
- [ ] the room's own light (`strips: false`, props with `light`, ≤ `HQ_PROP_LIGHT_MAX`)
- [ ] `shell.look` row; the sky's fog `density` per metre; no square edge, no kerb line
- [ ] natives with `say`, a tape per part (re-homed; the hundred is fixed), no envelope in a
      `quiet` room
- [ ] on THE MAP by construction (hq-map.test.js's DIRECTORY GUARD); a new site = 7.10
- [ ] `npm test`; the build-plan §9 entry; MODEL_INDEX for any GLB; this doc's §10 line

---

## 9. THE NUMBERS THAT ARE TUNED HERE (never in a builder)

- `HQ_TERRAIN_GEN` (data.js): `cave` / `rooms` / `city` per-kind defaults; `forceGrow`,
  `corridorW`, `minIsland`, the open-share bounds.
- `HQ_TERRAIN_RULES`: the walker's climb / wade / jump / slope, the pad sizes, the tile.
- `HQ_ROOM_LOOKS`: the grade per place.
- `HQ_SKATE_RULES`: the rider; `race` for a circuit.
- `HQ_PORTAL_RULES`: the door gun (`ledgeSnapM` is the roof puzzle's reach).

---

## 9b. THE CONTENT RULES (AREA_CONTENT_PLAN §3, the user's yes 2026-09-19)

Every explorable part is measured by `node check-area-content.js` (a module: `audit()`, `RULES`) and
held by `area-content.test.js` — as WARNINGS until D3 brings the twenty areas up to them, then hard.
The prefab parts (family B) take R3 / R4 / R8 only.

- **R1 CLIMB DENSITY** — ≥ 0.6 climb features per 100 m² of open floor (0.8 closed), ≥ 3 kinds
  (stairs · ramp · plateau · deck · wall · climb · float), the height range ≥ 6 m open / 4 m closed.
- **R2 THE 100-METRE PULL** — no reachable node farther than 50 m from a pull (a sky landmark, a
  tier ≥ 3 m, a prop ≥ 3 m, the marker).
- **R3 DOOR EXPOSURE** — from a landing at most ONE other door in a clear line at eye height; two
  doors on a wall ≥ 12 m apart, never three.
- **R4 THE EARNED EXIT** — ≥ 1 exit that is a draught, a way (a road out excepted — it is the most exposed exit
  there is), a door on a tier (≥ 1.5 m over the room's MEDIAN sill) or a door under the water; ≥ ⅓ of the exits earned.
- **R5 THE TEASE** — every earned exit (a draught excepted) is SEEN from a reachable node ≥ 6 m off
  with ≥ 0.8 m of height between them before it is reached.
- **R6 PARTI + TYPOLOGY** — `parti` (one sentence) and `typology` (bowl · ring · switchback · hub ·
  loop · pearls · corridor) on the spec / the room.
- **R7 SIZE** — a city part ≥ 200 × 160 with ≥ 3 districts (`gen.districts`, §4b); an open wild part ≥ 60 × 50.
- **R8 CONTENT DENSITY** — ≥ 1 prop / native / scatter per 60 m² of OPEN floor.
- **R9 THE TEACHING ROOM** — every walker mechanic has ONE room with a lesson plaque
  (`HQ_GUN_LESSONS` the door gun, `HQ_WALK_LESSONS` the climb / the skate / the swim). Hard.

**THE CLIMB** is the vertical feature the rules count: a `terrain.features` row
`{ k: 'climb', x, z, y0?, y1?, face, look: ladder | rope | vine | chain | pipe | wall }` (a plain box
room: `room.climbs`, the head on a blocker top). The solver takes it as an edge — a ladder alone may
reach a tier, a pit with a ladder out is not a trap, a tape above one is not hard. `face` = the way the
climber faces (the mass is that way); the head lands `climbMount` past the tier's edge blend.
**Where the line stands (D3, 2026-09-19, measured):** a tier's cliff face rises from its NOMINAL edge
INWARD over ~0.5 m, and the head scan starts `climbMount` (0.3) in from the line and stops the moment
the ground stops rising — so put the LINE 0.3 m INSIDE the nominal edge (a rect at x 14..22 climbed from
the west: `x: 14.3, face: 90`; a round tier of r 2.4 at z 24 climbed from the north: `z: 21.9, face: 180`).
The scan then starts on the top and the foot (`climbReach` back) lands 0.3 m outside on the ground. A line
0.6 m OUTSIDE a rect's edge reads a flat head and is DROPPED without a red — read
`hqTerrainInfo(id).climbs` (or the audit's `climbs` column) after authoring, never the row count.

## 10. THE LOG

- **2026-09-20 — AREA CONTENT D4, THE DOOR PASS (local delivery).** R3 / R4 / R5 over every pre-plan complex: fifteen draught pairs + six draught links, nine tier doors, the blockers on the sightlines (AREA_CONTENT_PLAN §7 has the list). Rules learnt: a wall's top is the ground UNDER it + h (a parapet on a tier's edge blend stands a metre low — put it on the flat top); a 0.3 m wall slips between the audit's 0.5 m LOS samples (partitions are 0.6 m); two abutting plateau rects leave a solid seam in a halls plan (overlap them); a `bridge` over a door's landing cell keys the landing to the bridge layer (stop the slab short of the pad); a draught is never a target nor a viewpoint for R3.

- **2026-09-17 — D.U.M.B. (complex candidate #5): THE HALLS floor plan (family C's generator) and seven
  parts on Rooms 555 + 999.** `terrain.gen.kind: 'halls'` (data.js `HQ_TERRAIN_GEN.halls`, the branch in
  `_hqTGenerate`, `_hqTTraceMaskWalls`): BSP rooms + authored rooms + authored halls, a Prim tree + loops of
  L-corridors (square-capped — right angles), the solid a MASS to the ceiling (`solidMass`, `info.solidTop` =
  the shell's h), the mask's boundary TRACED into `info.planWalls` (a tooth-cleanup pass first, then
  Ramer–Douglas–Peucker at `simplify` 0.5 m with each wall pushed into the solid by its own stair's reach —
  the drawn face never protrudes past the boundary the mask refuses at); three-renderer.js draws them through
  the one wall path (`drawWall`, a keyed material cache) and hangs `_hqBuildHallsLights` (emissive tubes down
  every corridor). THE MOTOR POOL (the tram hall + platform, the bays; `links.area51_dumb` / `dumb_cern`
  RE-POINTED onto its west / east walls), SUB-LEVEL 7 (the hub + THE TOWER + four Portal chambers: THE DROP,
  THE CATWALK, THE PIT, OBSERVATION), DREAM RESEARCH, CLONE RESEARCH (THE OTHER ONE = a `clone: true` native),
  THE WAR ROOM (family B, its own floor: the galleries + THE BIG BOARD), THE BUNKER (the loft, the pool waded,
  the cellar), CERN · THE RING (one loop hall, the detector hall, the control room). Rules learned: a stair's
  TREAD RISE + the tier's own edge step must stay under the slope rule at the edge (≤ ~0.45 m a tread:
  L ≥ 2.2 × h) and the stair ends 0.7 m inside its tier; a plan room hangs NOTHING on the shell (every wall
  prop free-standing on a plan wall); a `wall: true` catalogue prop placed free stands at x / z with `mount`;
  never `utility_box` as a room prop. NOT built: a chamber TEMPLATE library (§5 item 2), doors on the BSP
  rooms (a corridor opens straight into a room), a lower corridor ceiling, THE SHAFT ROOM, Area 51's hangar
  as a prefab part, the pack on the two board rooms. Tests: `hq-dumb.test.js`; hq-floor-plan (the kind, a
  per-kind `minOpen`), hq-terrain (33 rooms), hq-finds (the shelf's hint count) amended.

- **2026-09-17 — the guide written; STREET LEVEL rev 2 (Disaster City + Cyberpunk City).**
  The `city` plan's podium removed: a block is a mass at street level (`podium: false`,
  `hqTerrainSolidAt` / `hqTerrainSolidTop` / `info.solidTop`, the yard walls
  `info.yardWalls`); the mall keeps `podium: true`. Tests: hq-city / hq-city-2 /
  hq-floor-plan amended. §5b WEENIES added the same day (the user's Disneyland rule). Not done: minor roads, corner-lot guarantee, interior fill, roof
  access (§4); the Δ rework (§6); discovery (§7); the family-C generator (§5 / §2).
- 2026-09-17 — THE URBAN PACK: a city's ground is THREE SHEETS of the pack (asphalt = floor, pavement = path, the yards = cliff) — never tiles laid on it (they distort on every bend); the paint / kerbs / manholes / plates are overlays (`_hqBuildRoadMarkings`); a share of the lots are TEXTURED BUILDINGS (`_hqTexBuilding`, a 1.75 m facade grid) beside the sprite prisms; a street's END is a `road` way — "roads that lead to nothing" are the seam to the next town (§4 amended: a dead end is a door or a barrier, never a wall of fog).
- 2026-09-17 — DISASTER CITY, THE THIRD PASS: (1) a site may be BYPASSED — `DOOR_HQ.siteRooms.entry[mapId] = { room, door }` makes a part stand for the site (every landing in the board room goes there; the part wears the board room's egress as its `bay` door) — Cyberpunk City IS its grid, the Strip its own streets, Downtown its streets; the board room keeps the console, the marker and the map's node. (2) THE MALL is the model for an INDOOR complex part with floors: no plan, plateaus for the upper floor, `terrain.shops` FRONTS on the plateaus' faces and the walls (never masses), balustrades on the escalators, the stairs long enough that the last tread stands within a climb of the tier. (3) THE KERB RULE for a city's scatter (on the sidewalk, never in the road, never on a ramp), THE MITRE for its kerbs, THE OVERLAP SWEEP for its lots, the darker `HQ_TEXB.tint`. (4) A room's look YIELDS to any setting the player has moved (three-post.js) — a look is a starting grade, never a lock.
- **2026-09-18 — THE CYCLE RULE + AREA 51.** Family C's generator (`halls`) gives every room ≥ 2 corridors
  (`HQ_TERRAIN_GEN.halls.minDegree`, `info.genPlan.deadEnds` the readout — the user: "too many dead ends";
  the tree alone left 2 in three of five rooms). THE BASES are BYPASSED (`siteRooms.entry` for D.U.M.B., CERN,
  Area 51 — "we don't need the board maps if the place already has an area"): every link on a bypassed board
  moves onto a part FIRST. A complex's own graph obeys the rule too (D.U.M.B.'s departments got a service
  corridor and a private stair; Area 51's three parts are a loop). AREA 51 = family C ×2 (the hangar round one
  authored hall, the white rooms on FINE leaves = cells) + family A `rooms` with no thicket for an airfield
  (the solid = low berms, `wallH` 1.6). An outdoor terrain room lights ITSELF (`flood_mast`). The motor pool
  is P3 under the garage (`links.garage_motorpool`). Not done: a bypassed board's tapes into its entry part.

- **2026-09-18 — THE DIVINE STAIR, second pass.** Three more boards bypassed (`siteRooms.entry`: an entry door
  may carry `y` — the pit's mouth is on its rim, the gate on its dais). THE FLOATING PIECES: `float: true` on a
  plateau / a stair ramp = a cloud platform / a flight of floating steps (the field cut away under it,
  `_hqBuildFloats`) — the map builder's floating staircase in a terrain room; use it wherever a place hangs in
  the sky. THE WAY DOWN: an entry on a high tier + descending flights (THE RAMP RULE holds at a descent's high
  end: start 0.7 m INSIDE the tier). A GLB that stands upright is hung as a wall row, never laid on the floor.

- **2026-09-18 — CAMELOT CASTLE (complex candidate #2).** Three families in one complex, the hand-offs at doors: THE OUTER WARD
  (A' `rooms` — the hedges the thicket; THE MOAT a `deep_water` stream never entered, THE DRAWBRIDGE a `deck` over it, THE
  CURTAIN WALL four `wall` rows whose TOPS are THE PARAPET WALK once a terrace stair reaches them — a wall's top is the
  HIGHEST ground under it + h, so a wall must end on level ground, never inside a tower's footprint), THE GREAT HALL (B, no
  plan: a dais, a gallery, a loft = the tape), THE KEEP (C `halls` round two authored chambers with THE GREAT STAIR climbing
  0 → 4.5 → 9 m across the stairhall, the sky's door ON the battlements at y 9, the tower top the tape), MERLIN'S UNDERCROFT
  (A `cave` in brick — a cave somebody bricked), THE CASTLE IN THE SKY (A' with no thicket, THE FLOATING PIECES up 0 → 3 →
  6.5 → 10 m, the spire the tape, THE SKY BRIDGE onto the stairway to heaven). The board bypassed (`siteRooms.entry`); the four
  seams that stood on it moved onto the parts (a free `pool` on the moat's bank, the wardrobe on the ward's west wall, the well
  free in the bailey, the Lodge off the hall). WEENIES: the `skycastle` landmark over the ward (the castle builder on a cloud)
  promises the battlements; Camelot itself stands below the sky castle facing back; THE KEEP TOWER beside the hall door; THE
  ORB in the dark. Not done: a portcullis / drawbridge GLB (MODEL_INDEX §3l), battlements on the wall tops, the board's own
  tape into the ward (the bypassed-board rule), a gallery floor inside the keep (§5's shaft room).

- **2026-09-18 — THE UNDERWORLD (complex candidate #3, THE TUNNELS / THE DUNGEONS).** Family C three ways under Disaster
  City: THE SEWERS (`halls`, `bsp: false` — the culverts are authored halls WITH BENDS, a waded `stream` down every
  middle, the chambers authored; the walls follow the diagonals), THE RUNNING TUNNELS (`halls`, `bsp: false` — a loop
  hall + a crossover + three rooms; the rails twelve `wall` rows at 0.14 m the walker steps over and the rider grinds),
  THE HOLDING CELLS (`halls`, `bsp: false`, `minDegree: 1` — six authored cells each joined to A VERTEX UNDER IT on one
  corridor hall: the way to author any row of one-door rooms; the dead-end readout is the design there) and family A
  flooded (THE OLD WORKINGS, `cave` in brick: a waded flood, a deep sump). Six seams join it to what stood already (the
  Strip's gutter, the storm drain, both subway platforms past their track ends — the subway line runs through the loop
  now — Room 24601, the oubliette — the last two on a new dashed `dungeons` line); a hub may claim rooms BY ID (`DOOR_HQ.hubs.underworld.rooms`). Rules: a stream starts
  short of a door's pad; a corridor stays dry beside its channel only when hall.w − stream.w − 2 × bank ≥ the body. Not
  done: a drunkard's-walk sewer generator (§2), a `manhole` way, doors on the cells, THE DEEP (next). Log:
  DOOR_HQ_BUILD_PLAN §9.
- **2026-09-18 — THE MAPS / ROOMS CLEANUP**: THE RANCH (family A, `rooms` — the solid is the standing corn) on Room 512, the
  board bypassed; Nuketown retired; THE HUBS on the map (`DOOR_HQ.hubs`); every door plate reads the room DIRECTLY through it
  (`hqReplateDoors`). Two new sites are owed to the ranch: the Graveyard and a Western map (their gates are held links).
  Log: DOOR_HQ_BUILD_PLAN §9.

- **2026-09-18 — THE DEEP (complex candidate #8, the user's pick).** The WATER layer (§5c): `terrain.sea` — one surface over a
  field; the feet AFLOAT over deep water (the solver swims), a DROWNED room with no climb; THE SWIMMER, THE SKIFF and THE
  BATHYSCAPHE as walker modes (three-renderer.js "THE DEEP"); the whirlpool / the upwelling as ways entered by being in them.
  Three parts: THE OPEN SEA on Room 345 (the cay with the lighthouse, the jetty, the skiff, the islands, the maelstrom ringed
  with buoys), THE ABYSS on Room H-20 (drowned: the drowned road under the kelp, the wreck of the Dutchman with her hatch — the
  user's "connect the Dutchman to the underwater" — the trench, the spire, the station, the upwelling) and THE TEMPLE OF THE
  DEEP (the air pocket, the two dry seams). Both boards bypassed. Rules: an island is a `blend: 'ground'` plateau; a scatter
  under the sea says `sea: true`; a floating prop is `float: true`; a vehicle prop stands first when its lamp must keep under
  the cap; the fluid read is height-aware. Not done: the assets (MODEL_INDEX §3n), a wind for the sail, caustics, a breath rule,
  Agartha / Antarctica / the hold as drowned parts. Log: DOOR_HQ_BUILD_PLAN §9.

- **2026-09-18 — THE LEY LINES (complex candidate #9, the user's pick: "this weird impossible underground tunnel system, not completely cave
  and natural, but not completely man-made either … Amber tone. Long straight claustrophobic corridors that fork off").** Family C's THIRD
  generator, `ley` (§1 C'): authored straight lines between the stations, forks at ley angles that join / run to the rim / end in a niche,
  crossing chambers, antechambers behind the doors; the solid a mass to a 3.2 m ceiling, traced into walls that carry their own amber
  veins (the light is IN the stone — the answer to "who made it" is the room's, never a lamp). THE LEY LINES on Göbekli Tepe's site (the
  hub) and FOUR ANCIENT SITES rebuilt as open `rooms` parts with no thicket (the banks are the solid): STONEHENGE · THE PLAIN (the sarsen
  circle and the trilithons as `wall` rows the rider grinds, the bank + the ditch as an open ridge + gully, the barrows), GÖBEKLI TEPE · THE
  TELL (the tell a hill, four enclosures `dip … dome: true` sunk into it with ring walls and T-pillars), GIZA · THE PLATEAU (the pyramid
  four stacked `plateau` rects up a four-flight stair — 8.2 m a flight for 3.5 m: THE RAMP RULE and the tread rule both hold; the top is
  walked to), BABEL · THE TOWER (four tiers up THE SPIRAL — a stair on each face in turn; the crane's load the hard tape). The four boards
  BYPASSED; the four ley links RE-POINTED onto the parts with their ids kept (a star on the world tab: every leg is Göbekli's). Rules
  learned: a `rooms` plan with `thicket: false` is the right solid for open ground of any kind (dunes, downland, rubble) — set `wallH` to
  the bank's height; a hard tape under a LOW ceiling wants a tier the eye can see the top band of from the floor (THE OMPHALOS is 2.3 m
  in a 3.2 m room, from a floor sunk 0.7 m); a tape that must be moved comes off a BYPASSED board first (Cyberpunk's BILLBOARD was
  unreachable on foot). Not done: Technoticlan's own part (its ley end stays on its board), a Göbekli T-pillar GLB (the proc stands),
  the keystone glyphs as a texture, the niches' finds (an envelope per niche — 9.1's rule wants an inventory owner). Log:
  DOOR_HQ_BUILD_PLAN §9; assets: MODEL_INDEX §3o.
- **2026-09-18 — THE AREAS (every board is an area, Room 64 excepted).** The rule is now the building's: a launch map is a PLACE
  the walker stands in, never a box with a board on the floor — `siteRooms.entry` bypasses every built site's board room onto a
  part, and the twenty sites that had no complex got a generated area each from one spec table (`HQ_AREA_SPECS` → `hqAreaRoom`,
  data.js). The generator IS §1's blueprint in code: family A (`rooms` / `cave`) for the open ground and the caves, family C
  (`halls`) for the indoor ones (the Backrooms, the Lodge), the site's own sky off its EW_MAP_META row, a fog per metre, a grade, a
  path from the bay pad to THE PLAZA, a weenie with the hard tape on it, the park rule. THE MARKER (§4's crystal, the "battle on
  the Δ" option) stands at the plaza or a weenie's foot in EVERY entry part. THE DOOR RULE (§7's spirit, now a test): a plain door
  between two sites stays only as a designed seam — a way, a draught (`secret: true` on a links row), a docked collar, a tunnel
  that is the route, a site's only line; the shortcuts that duplicated a built path are gone (hq-areas.test.js names them).
  Adding a site today = the 7.10 checklist + an `HQ_AREA_SPECS` row (or a hand-authored complex) + an `entry` row; never a plain
  door to a neighbour it already reaches by a path. Log: DOOR_HQ_BUILD_PLAN §9.
- **2026-09-19 — THE ASTRAL REALM (complex candidate #10, the user: "the realm of all possibilities, the home of thought-forms, where ideas
  exist before they are thought … creativity is instantaneous, just like your dreams — but that means nightmares as well; bizarre and
  nightmare fuel mixed with the beautiful and fantastical").** Four parts on the Looking-Glass's site, THREE FAMILIES with the hand-offs at
  real doors (§1's rule, told as a story): a prefab WAITING ROOM (B) → THE SEA OF POSSIBILITY (A', `rooms` with no thicket — the banks are
  unformed crystal; three floating tiers up floating stairs, the stream waded, the mirror lake never) → THE LIBRARY OF UNTHOUGHT THINGS (C',
  `ley` in a WOOD `wallKey`: the stacks fork and end in reading nooks and light themselves — the ley generator is not only for tunnels) and
  THE NIGHTMARE (A, `cave` in the flesh sheets — a bowl ringed with unclimbable spikes, a lava pool, a stage). The seams are THREE SCREENS
  on one dashed line (Room REM's, the D.U.M.B. ward's, the attic's home movies — one `way` kind, three places, no new builder) and the
  garden's second frame (a door pair, the same site). The weenies: THE WATCHER (a new `eye` landmark that blinks) and the divine `stairway`
  the wrong way up; inside, the spire, the spine, the top shelf — every hard tape a tier the gun can shoot. Four procs that MOVE (a
  thought-form that breathes, an eye that looks at you, a stair that only goes up, a flower of teeth). Rules learned: an open room's shell
  `h` is still the ceiling doorhq's prop rule reads — a prop hung at 9 m wants `h` ≥ 10 even with nothing drawn; a wall prop's `mount +
  h` must clear the shell's `h` (the third clock); a `rooms` plan with 2.4 m crystal banks cuts a rescue ramp wherever the walker's jump
  reaches a bank top it cannot leave — nine on the sea (read `info.rescues`; a lower `wallH` or a higher bank is the edit if they read
  as scars). Log: DOOR_HQ_BUILD_PLAN §9; assets: MODEL_INDEX §3p.

- **2026-09-19 — AREA_CONTENT_PLAN.md (the user's brief: the rooms feel like boxes; more climbing — ramps, stairs, ladders, vines, ropes; too many doors in view; discovery should reward; bigger cities).** The building was MEASURED (`node check-area-content.js`): the cave chambers carry 0.75 climb features / 100 m², the twenty generated areas 0.23, the cities 0.04; 93 of 132 explorable parts have no hidden exit; the "doors in view" problem is EXPOSURE (flat floor, flat wall), not spacing. The plan's rules R1–R9 (climb density, the 100-metre pull, door exposure, the earned exit, the tease, parti + typology, size, content density, the teaching room) and the `climb` mechanic (ladder · rope · vine · chain · pipe · wall) are in that file, awaiting the user's decisions (§6) before they are added here as rules. The sources: bytecauldron/awesome-level-design (the weenie taxonomy, the door problem, the Level Design Book's layout / typology / blockout chapters, the list's tips).
- **2026-09-19 — AREA_CONTENT_PLAN D1 (the user: yes to all the questions / the recommended).** The decisions are §6 of that
  file; the rules are §9b here. Built: THE CLIMB (data.js `climb` rows + the solver's edge; three-renderer.js "THE CLIMB" — the
  six looks, the mount at a foot walked into / a head walked off, W / S / SPACE, the mantle; sprites.js `HQ_CLIMB_CLIPS`; the
  hint line), THE TEACHING ROOMS (`HQ_WALK_LESSONS`: the garage's DOCK OFFICE up one ladder under a 5.4 m ceiling, the skate
  plaque in Room 26, the swim plaque in the natatorium), the audit's R2 / R3 / R5 / R6 / R8 measurements and the warnings test.
  Next: D2 (Disaster City + the Grid twice the size, three districts each, fire escapes = `climb` chains onto rooftop `deck`
  runs, the overpass, the undercity, the `districts` plumbing on the `city` plan), then D3 (the twenty areas, two or three
  a delivery, each to R1–R8), D4 (the door pass over the complexes), D5 (the facility rooms' purpose).
- **2026-09-19 — AREA_CONTENT_PLAN D2 (local delivery): Disaster City + the Grid twice the size, three districts each.**
  §4b is the rule that came with it (the districts on the `city` plan, THE CUT, THE ROOF, THE FIRE ESCAPE, THE GANGWAY, the
  rail-on-a-roof rule, the canal's shallow bed, the overpass that is not yet buildable). Downtown 224 × 176 (the financial
  blocks · the old town · the docks), the Grid 208 × 168 (the neon grid · the stacks · the undercity), the Strip's two
  rooftops; `hq-city-districts.test.js`. Log: AREA_CONTENT_PLAN §7. Next: D3 (the twenty areas, two or three a delivery).
- **2026-09-19 — AREA_CONTENT_PLAN D2b (local delivery): THE BRIDGE LAYER.** The overpass over a walked street IS buildable
  now: a `bridge` row is a second surface the height field never carries (§4b's rule rewritten below; §5 item 3's pattern
  proven). Downtown's THE OVERPASS over the avenue, the Grid's THE OVERLOOK SPAN over the cut and the lower cross to THE
  PIER. `hq-bridge-layer.test.js`. Log: AREA_CONTENT_PLAN §7.
- **2026-09-19 — AREA_CONTENT_PLAN D3, first delivery (local): SHASTA · THE NORTH POLE · OLYMPUS to R1–R8.** Three `HQ_AREA_SPECS`
  rows reworked on the blueprint — every tier reached two ways (a stair AND a rope, a trail AND the hand-holds), a door ON a tier
  at every seam (`y` on the link end), a draught for Lemuria, the tape's weenie seen from the tier under it, 40–50 items a room.
  The rule that came with it: a `climb` row's line stands ≤ 0.3 m off its mass and its foot off its tier (§4 / AREA_CONTENT_PLAN §7).
  Log: AREA_CONTENT_PLAN §7. Next: the Stadium, the Haunted grounds, the Spaceship deck.
- 2026-09-19 — AREA CONTENT D3, second delivery: THE BOWL (the concourse arrival — the bay door ON a tier, `entry.door.y`), THE GROUNDS (the porch
  raised, the crypt a block you climb, the coach house, the treehouse), THE DECK (the airlock on a tower, the cargo hatch a draught inside the
  site, 62 × 50). Three rules for every area still to do: the climb LINE stands 0.3 m inside the tier's nominal edge (above); a two-door room's
  tier door is never "earned" (the audit's median sill is the higher one) — give it a third door, a draught; the ground behind a tier against the
  shell wall is a pocket until a path reaches it. AREA_CONTENT_PLAN §7 has the numbers.
- 2026-09-19 — AREA CONTENT D3, third delivery: THE TEMPLE CITY (the pyramid's back against the wall, the other stair on the west flank, the
  aqueduct = a level span over the waded canal, the ley door ON a terrace, Xibalba a draught), THE CRYSTAL CITY (the gallery span over the lower
  terrace, the adit ON a terrace, three draughts on the new dashed `routes.hollow`), THE STATION (the collar ON the hull, the ice shelf, the drill
  rig, the polar draught). The rule that came with it: a `climb` row's `face` points TOWARD THE MASS (0 = the tier is north of the line, 180 south,
  90 east, 270 west) — read the compiled rows back, never the row count. AREA_CONTENT_PLAN §7 has the numbers.
