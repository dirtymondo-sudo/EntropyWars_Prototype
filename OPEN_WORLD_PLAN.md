# THE OPEN WORLD — one ground under the places, doors that open, a map that is a map

*Plan document, 2026-09-26. Story mode's explored world (the D.O.O.R. HQ rooms and the site parts) only —
the battle engine, Online and Practice are untouched except where §5.6 widens the field. Nothing in this
plan is built. Read BUILT_ARCHITECTURE_PLAN.md (the E · BUILT family, the rebuild method) and
EXPLORABLE_AREAS_GUIDE.md §1 (the families), §3 (the build order), §5b (weenies), §5c (water) first:
every rebuild this plan schedules is one of those, placed in a frame. House rules that stand over every
phase: NO PUZZLES of any kind (the user, 2026-09-25 — a separate human-written plan); never ship a dev
shortcut that changes what the player sees; every R2 delivery bumps `?v=` (CLAUDE.md RULE #1b).*

The user's brief (2026-09-26), verbatim where it matters:

- "Open connected world for exploration. Outside should be outside, inside buildings or separate dimensions
  can be their own area if necessary. Minimal load screens."
- "Ability to go beyond the 8x8 area for exploration encounter fights." The user's correction (2026-09-26):
  "idc about 8 vs 8 battles, i meant how an encounter restricts me to an 8 by [8] grid area." The ask is
  the SIZE OF THE GROUND a fight is confined to (the encounter's 8 × 8 window of the room), never the
  number of fighters; team sizes are not part of this plan (§5.6).
- "An actual highway from the city to area 51 or something. Dirt trails and stone paths. Mt Olympus as an
  actual mountain you can climb. An ocean to sail. Weenies in the distance like from Disneyland. Separate
  day night cycle for exploration."
- Concerns: "Feasibility. Frame rate. Asset loading/downloading (can't things just download once and
  never again?). What to work on/fix first."
- "I want areas like the mall and Camelot castle and the Vatican and the billionaire bunker and the D.U.M.B.
  etc to be on par visually with the stadium and the garage for how they were made. Actual architecture
  and geography where applicable."
- "Improvements to all of the rooms/areas, especially the ones that are smaller or are just connection
  points between places, like buffer zones … why do we need a well room? It doesn't even make sense for
  all the wells to lead to the same place. Some should lead to the sewers, some to the cavern, in
  DIFFERENT parts, not all in the same room."
- "A new map reflecting the in game geography and the locations of places relative to each other, not
  just a bunch of door nodes."
- "Some sort of graphics or rendering thing where only a chunk of the map is being rendered … if gta 5
  and Minecraft open worlds are possible, then it should be possible in this game too."
- "Some of these doorways/connections I am definitely going to take out, so don't get stuck if something
  doesn't perfectly fit geographically. Just because two places are connected by a door does not mean
  they should be close together on the map."
- "I hate walking into the medical bay and every single little room in there is a different loading
  screen … the woods feel totally disconnected … you don't have to get rid of every door, it would just
  be nice if some of them opened and let me through without a load screen."
- "The world doesn't have to be huge, it just needs to work well and function with what we already have
  and be visually impressive."

---

## 0. The verdict — what this is, in one paragraph

It is feasible in this engine without a rewrite, and the way to do it is not GTA's streaming engine but
something this game is already half-way to: **ZONES of STITCHED PARTS**. Every explorable place stays a
room in `DOOR_HQ.rooms` (the authoring unit, the terrain compiler, the solver, check-terrain, the tests all
keep working), but rooms that stand on the same ground get a FRAME — a position in a shared zone — and
a JOIN along a shared edge. The renderer keeps ONE scene per zone, draws the part you stand in plus its
joined neighbours, warms the next ones while you walk, and swaps "current" when your feet cross a join.
No card, no blink: the load screen only remains for a door to another dimension or a cold first visit.
The world is small (40 outdoor rooms today; the biggest 224 × 176 m) and the machinery for most of it
exists: the worker survey that already pre-compiles the rooms behind every door, the `road` way that
already runs asphalt 40 m into the fog under a gantry, `edge: 'open'` + `roam` that already lets the walker
walk past a shell, the outer ground, the seeded terrain compile, the asset store, the model queue with its
background lane, the hand-over that already fights inside the room. What is missing is the FRAME (§4),
the STAGE that draws two parts at once (§5.1–5.3), the STITCH of two height fields (§4.2), a door that
swings instead of loading (§4.3), a world clock (§4.4), a far plane and a dome big enough to see the next
place (§5.4), and a map drawn from the frames instead of from the door graph (§7). The rebuilds the
user asked for (the mall, Camelot, the Vatican, the bunker, the D.U.M.B., the woods, the wells, the buffer
rooms) are content work on that stage, each its own thread, each following BUILT_ARCHITECTURE_PLAN.
**What to do first (the user's fourth concern): the STAGE on THE CITY (Phase 1)** — Downtown, the Strip
and the Stadium already meet at road gantries, it is where the user skates most, and every later phase
(the joins, the merges, the geography, the rebuilds in their frames) is drawn on it. The interior rebuilds
that need no frame (the mall's atrium, the basilica, the bunker) can run in parallel from day one.

---

## 1. The rules, in one page

- **A PLACE is a ZONE; a ZONE is PARTS on one ground.** `DOOR_HQ.world.zones[id] = { label, sky, clock,
  parts: { roomId: { x, z, y, rot } }, joins: [...] }` (§4.1). A part is an existing room. Its frame is in
  metres in the zone, `rot` in quarter turns. A room in no zone is what it is today (an interior, another
  dimension).
- **A JOIN is a shared edge, not a door.** Two parts of a zone that touch declare the span they share
  (§4.2). Along it the shell is open, the two height fields are STITCHED to agree, and the walker just
  walks. A join is also allowed indoors (the sewers' four halls, the D.U.M.B.'s six) — a zone needs no sky.
- **A DOOR JOIN is a door that swings.** An interior part inside a zone (the mall on its lot, the keep in
  its ward, the medical wing off the hall) is joined through a doorway that opens (`inner: true`, §4.3):
  both parts are live, the leaf swings, no card. The user: "some of them opened and let me through".
- **The STAGE draws CURRENT + JOINED (one hop), holds TWO hops warm, drops the rest** (§5.1–5.2).
  Current is the part under your feet: its finds, natives, tapes, counters, doors, encounter window and
  population are live. A joined neighbour is drawn whole (terrain, walls, bridges, props, its lamps within
  reach) and walkable, so you see it and step into it; its population and interactions wake at the
  crossing. Two hops away only the compile and the assets are warm. Three hops away is disposed.
- **THE CROSSING is a swap, never a rebuild.** When the feet leave the current part's rectangle into a
  joined one, that part becomes current (§5.3). Nothing on screen changes but the strip's name plate.
- **Doors to other dimensions keep the card, and the card gets better.** A `way` or a link to a room in
  another zone (the mirror, the wardrobe, the whirlpool, Heaven's gate, the thresholds) is the walk it is
  today — with the arrival warmed while you stand near the door (§5.2), so the walk blink stays a blink.
- **The ground is chunked; the field is not.** A part's terrain mesh is built as TILES of 32 × 32 m sharing
  one material (§5.5), so the frustum drops what is behind you; the height field, the solver, the finds
  and the encounter window stay whole per part (SEAMLESS_FIELD_PLAN's rule: "a TERRAIN room's field is
  built WHOLE round the window").
- **Weenies are real where the place is real.** A zone's far parts are drawn as FAR SHELLS (§5.4) — the
  coarse ground and the building masses, no props — so Olympus stands over the kingdom because it IS
  there. The sky-dome landmarks stay for what is not on this ground (Camelot's castle in the sky, the
  stairway, the eye).
- **One sky, one sun, one clock per zone** (§4.4, §5.7). `HQ_WORLD_CLOCK` runs a day in real minutes for
  every zone with `clock: true`; the sun's azimuth and elevation, the dome's day, the lamps' dusk follow
  it. A room whose night is its design (Hell, the Strip's neon) says `sky.lock` and keeps its hour. The
  battle keeps its own round cycle; a fight starts at the hour the room was at.
- **The frame is the map.** THE WORLD tab draws each zone's parts as their floor-plan silhouettes at
  their frames, the joins as open edges, the doors as door glyphs on the wall they stand in, you as a
  dot that walks (§7). Off-ground places (the planets, Heaven, Hell, the Looking-Glass) go on a BEYOND
  sheet as the doors they are. The subway-line map is retired.
- **Every rebuild is BUILT_ARCHITECTURE_PLAN's method** (§8): real-world size, flat ground with the
  architecture standing on it, bridges where there is space under, round things round, paint, then
  check-terrain, screenshots, a pinning test. Nature stays terrain.
- **A buffer room is merged or deleted, never kept because a link points at it** (§8.4). The user is
  removing doors; a link that would strand is re-pointed in the same delivery, and the plan proposes
  where (§4.5), the user rules.
- **Download once is mostly true already and the plan makes it whole** (§6): compress the assets
  offline, publish a manifest, raise the store's cap when the browser grants persistence. No service
  worker.
- **Numbers live in data.js tables** (`HQ_WORLD_RULES`, `HQ_WORLD_CLOCK`, `HQ_STAGE_RULES`), never in a
  builder. Every phase ships with its own test; the end-of-session check is `npm run test:end` (the quick
  checks + the tests the phase changed) — never `npm test` or `test:full` at the end (CI runs `npm test`).
- **NO BACKWARD COMPATIBILITY, NO TAPE / FIND GUARDS** (2026-09-27, mondo: "I do not care about the tapes
  or the finds at all right now. We are literally building the map, the tapes are going to change
  regardless ... I do not care about save files or old saves at all. I am the only one playing and
  testing this game right now."). A phase MERGES, RENAMES and DELETES rooms freely: no aliases kept for
  old saves, no save-key migration, no ledger shims. Tapes and finds follow the map: a find in a deleted
  room goes, a tape whose room moves is re-placed by the finder or dropped, and no phase spends time
  proving a tape's spot, a find's reach or the tape count. Tests pin the map (the joins, the stitch, the
  walker's reach between doors), never the tapes. A "keeps every id / find / tape / save" deviation is
  never a reason to pick a lesser fork.

---

## 2. Where it stands today (the survey, 2026-09-26)

### 2.1 What a door costs (three-renderer.js `_hqEnter` ~56215, `_hqLeave` ~56566; map.js `window._hqEnter` ~960)

1. `_hqTickAutoEnter` (~54617) → map.js `_hqWalkThroughDoor` (~6067) → `_hqGoRoom` → `window._hqEnter`.
2. The load card `#hqLoad` goes up. On a WALK into a room whose terrain is compiled it is a door-blink
   (`walk` class, no card); if the room is not ready within `HQ_WALK_BLINK_MS` = 700 ms it becomes the full
   card (map.js ~363, ~440). `ThreeRenderer.hq.hold(true)` freezes the old room under it.
3. If the room has `terrain` and no `_terrainInfo`, the WORKER compiles it (`hqTerrainCompile` data.js
   ~44780, served by `hqTerrainWorkerServe`; map.js ~233–330). Measured in node today: Downtown 24 s,
   Giza 5.4 s, Atlantis 1.9 s; the notes record 3–31 s in browsers. The result is cached on the room
   object for the page session only.
4. `_hqLeave` is a FULL teardown: every rig disposed, every scene child removed and disposed (`_disposeR`
   ~2639 keeps `_ew_shared` geometry), the gate closed, queued background loads dropped.
5. `_hqEnter` makes a NEW `THREE.Scene`, lights and fog by room kind, a new camera, then runs every
   builder synchronously on the main thread: shell → terrain (`_hqBuildTerrain` ~41526: ONE indexed mesh
   over the height grid, O(cells) with per-vertex slope/AO/path loops) → setting → sky (`_hqBuildSky`
   ~43577: a dome of radius `_ENV_DOME_R` 16000 u ≈ 219 m riding the camera) → stairs, doors, counters,
   props (`_hqPlaceProps` ~47926 → `_miscModelInstance` ~23874: `root.clone(true)` per placement, one draw
   call per mesh per copy, InstancedMesh only for tier seats, book spines and a few procs) → population
   → light, shadow, AO, fog, shafts, decals.
6. The card drops when `_hqGateTick` (~55500) says ready: the walker's rig attached AND every file the
   build requested has settled with 300 ms of quiet (`AL_SETTLE_MS`), capped at `HQ_GATE_CAP_MS` 75 s.
   The rule (rendering-loading-perf.md "THE LOAD GATE"): nothing is shown until every file has landed,
   never a placeholder.
7. What survives between rooms: tile sheets (`_hqTexCache`), prop materials, misc GLBs (`_miscModelCache`,
   geometry flagged shared), rigs (`_unitGlbCache`), the compile, and on disk the ASSET STORE (§2.4).
   Rebuilt every entry: every mesh, the terrain, the merged batches, the nav lattice, the lights.
8. Prefetch: `_hqSurveyWarmAround` (map.js ~332) pre-COMPILES the rooms behind this room's doors, then
   theirs, then all, nearest first, in the worker (one hop on `EW_PERF_LOW`). Nothing prefetches a
   neighbour's GLBs or sheets; `hq.warmRoom` (~56755) exists but is called only for the arrival room from
   the menu (map.js ~824).

So a warm walk (compiled, assets in memory) already costs only the blink plus the synchronous rebuild;
a cold walk costs the compile (seconds to half a minute) plus the downloads plus the rebuild, under a
card. The plan removes the rebuild from the crossing (the neighbour is already built), moves the
compile and the downloads ahead of the walk (they already can be), and keeps the card for what is
genuinely far.

### 2.2 The room graph (data.js `DOOR_HQ`, `rooms:` ~26263, `links: [` ~24337; dump: the thread's inventory)

- **217 rooms**: 66 facility, 8 H-Wing, 7 bays + 2 rings, 38 generated board rooms (ALL bypassed by
  `siteRooms.entry` ~24845 — nobody walks them; they survive as map nodes and the register number), 76
  hand-authored site parts, 20 generated areas. 78 have `shell.open` + `sky`; **40 outdoor rooms a player
  walks** once the board rooms are taken out.
- **76 links** on 17 routes, every one bidirectional and `draft: true`; 31 are `way`s (an entryway object,
  never a walked door), 16 are `secret` draughts. One-way edges exist only where a door has no twin
  (records → observatorium's service stair; the ship's collar; H-Wing's shared office).
- **THE WELLS** (links ~24613–24644, route `undercroft`, sub "EVERY WELL COMES OUT IN THE SAME CAVE"):
  five wells (the haunted cellar, the HQ garden, Camelot's bailey, the estate's farmyard, Göbekli's east
  flank) all land in ONE room, `site_prebuilt_hollow_earth_shaft` "THE WELL ROOM" (24.5 × 21, three tiers,
  a well head per link, no counters) — a distribution node in front of the cavern's gallery. A sixth well
  (the Vatican courtyard ⇄ catacombs) is an ordinary intra-site door. hq-cave.test.js PINS "every well in
  the world drops into ONE cave"; hq-world.test.js pins the well seams. Both change with §8.4.
- **THE MEDICAL WING**: five rooms, five loads — `medwing` 12 × 8 (the hub, off the hall at 210°) →
  `medical` 8 × 6 → `padded` 3.6 × 3.6; → `dispensary` 7 × 5.4; → `interrogation` 7 × 6. All dead ends. The
  records wing and the executive suite are the same "hub + leaves" shape.
- **THE WOODS**: seven rooms under one `hqWoodsShell` sky (data.js ~22647) — the clearing (49 × 38.5) is a
  star: trail, redwoods, pasture, stair, deadmans, ritual radiate from it and never touch except by three
  secret shortcuts; every neighbour outside the woods (Shasta, the Grove, the HQ stairwell, the HQ tunnel,
  the ritual room, Camelot, the Looking-Glass, the sewers, Downtown) is behind a link. "Disconnected" is
  literal: the parts are small (28 × 21) and each path is a load.
- **THE CITY**: Downtown 224 × 176 (districts financial · old town · docks), the Strip 100 × 64, Cyberpunk
  208 × 168 (neon · stacks · undercity), joined by `road` ways (Downtown W ⇄ Strip E, Strip W ⇄ Cyberpunk
  E; Downtown N ⇄ the stadium's players' tunnel). The road way (`DOOR_HQ.ways.road` ~24259) is already an
  OPEN seam: asphalt and dashes continue 40 m into the fog under a gantry naming the next town, "the
  press-in is walking on" — it is a load at a gantry, the nearest thing to a highway today.
- **THE UNDERWORLD**: the sewers 120 × 84, the running tunnels 124 × 96, the cells 64 × 48, the workings
  60 × 44 — four `halls` parts, three gutters (one per city), the stadium's culvert, Dead Man's drain.
- **THE D.U.M.B.**: motorpool 64 × 40 (P3, under the garage by link), sub-level 7 96 × 72, dream lab
  48 × 36, clone vats 56 × 40, war room 44 × 32, **THE BILLIONAIRE BUNKER** 60 × 40 (`halls`), CERN ring
  100 × 100. **AREA 51**: hangar 72 × 48 (`halls`), the white rooms 44 × 30, the flightline 96 × 64 (open,
  RUNWAY 33, the tower). **CAMELOT**: the ward 96 × 80 (open, `rooms`), the great hall 26 × 52, the keep
  44 × 44 (`halls`), Merlin's undercroft 48 × 36 (`cave`), the sky castle 64 × 52. **THE VATICAN**: the
  basilica 36 × 52 × 16, the archive 30 × 36, the cortile 40 × 36 (open), the catacombs 38.5 × 31.5, the
  observatory 24 × 24 (open). **THE MALL**: 96 × 64 × 12, two doors (the street, the closet), a
  `podium` plateau mezzanine (BUILT §5.3 names it). **MT OLYMPUS**: the summit 62 × 52, a hub of terraces
  0 → 8.6 m — Heaven's cloud gate stands on its high terrace. **THE DEEP**: Bermuda's sea 150 × 120 (the
  first `terrain.sea`), the abyss 170 × 140 (drowned), the temple 36 × 36; the skiff sails inside the one
  sea room.
- **Buffer rooms** (the thread's audit, §8.4 rules on each): the 38 board rooms; THE WELL ROOM; the
  elevator car; the three lift lobbies (works · annex · labs, 10 × 6 each); the three wing hubs; the
  basement junction; service corridors A/B (2.8 × 22, 2.8 × 30); the room at the end 3 × 3; the crawlspace;
  the cold room; dock/laundry; the two-room supply closet; the stairwell; the tunnel; H-Wing's lobby, bar
  and two 48 m legs; Downtown's lobby, platform and closet; the noodle bar; the airlock; the Dutchman's
  cabin; the attic; the cellar; the Vatican observatory; the waiting room; the woods' stair; the cavern's
  vent/adit/mouth; the ley tunnel 200 × 150 (a corridor whose job is linking four sites); the running
  tunnels.
- **THE GEOGRAPHY that exists**: `HQ_WORLD_L.slots` (data.js ~41378, the user's ruling of 2026-09-23):
  the surface north of the building (the kingdom at twelve, the woods and the mountain north-west, the
  estate west, the divine stair and the astral realm north-east, the city east), the underground south
  (the cavern south-west, the ley lines west of it, the D.U.M.B. east, the underworld under the city, the
  deep off the city's coast, space beyond the deep, the bases and the ice along the bottom). Abstract
  units, HQ at the origin, one point per PLACE, none per room. Two-click travel already rides it.
  The building has NO walkable exterior: the foyer's street door is the main menu.
- **THE FICTION** (DOOR_MASTER.md A2 ~149–157, DOOR_STORY.md): doors connect Earth to other realities;
  "reality conserves connectivity"; nothing states that linked places are adjacent. The user's rule ("two
  places connected by a door need not be close") is the fiction's rule too.

### 2.3 What the renderer draws (measured 2026-09-26, headless Chromium, software GL)

Method: the repo's offline HQ probe pattern (`playtest_hq_offline.js`), one page, each room entered with
`_hqEnter`, `renderer.info` read at the spawn view after the card dropped, the scene walked for counts.
**Caveats:** GLBs from R2 are 404 in the sandbox (only repo-held ones load), so props from the bucket and
the walker's rig are MISSING — every count below is a FLOOR; the real room draws more. Frame times under
software GL mean nothing and are not reported; draw calls and triangles are exact for what was built.

| Room | Size (m) | Family | Draw calls | Tris drawn | Tris in scene | Meshes | Lights |
|---|---|---|---|---|---|---|---|
| the main hall (rotunda) | r 21 | B | 280 | 38 k | 112 k | 1205 (+6 instanced) | 22 |
| medical | 8 × 6 | B | 92 | 12 k | 32 k | 755 | 11 |
| the medical wing | 12 × 8 | B | 125 | 16 k | 52 k | 804 | 13 |
| the mall | 96 × 64 | B (podium) | 771 | 74 k | 141 k | 2149 | 21 |
| Camelot's ward | 96 × 80 | A' | **1187** | 143 k | 251 k | **3356, 0 instanced** | 13 |
| Camelot's keep | 44 × 44 | C | 226 | 23 k | 62 k | 985 | 15 |
| the basilica | 36 × 52 | B | 299 | 24 k | 51 k | 1005 | 17 |
| sub-level 7 | 96 × 72 | C | 347 | 67 k | 118 k | 1133 | 19 |
| THE BOWL | 85 × 132 | E | 419 | **377 k** | 402 k | 1093 (+6719 seats instanced) | 14 |
| the garage | 56 × 56 | E | 231 | 41 k | 74 k | 1096 | 26 |
| Bermuda's sea | 150 × 120 | sea | 375 | 187 k | 213 k | 1062 (+120 instanced) | 15 |
| Olympus summit | 62 × 52 | A' | 349 | 73 k | 101 k | 1187 | 12 |
| Area 51 hangar | 72 × 48 | C | 226 | 39 k | 76 k | 1031 | 21 |
| the redwoods | 28 × 21 | A' | 395 | 40 k | 80 k | 1369 | 14 |
| the sewers | 120 × 84 | C | 379 | 101 k | 141 k | 1116 | 18 |
| Cyberpunk | 208 × 168 | D | **1579** | **386 k** | 447 k | **4972, 0 instanced** | 17 |
| Downtown | 224 × 176 | D | **2701** | **398 k** | 431 k | **6291, 0 instanced** | 17 |
| the estate's fields | 56 × 46 | A' | 400 | 53 k | 84 k | 1481 | 17 |

JS heap after a room: 126–226 MB. What the table says:

1. **Draw calls are the lever, and prop clones are where they go.** Downtown draws 2701 calls for 6291
   meshes with nothing instanced; Cyberpunk 1579 for 4972; Camelot's ward 1187 for 3356. The city's textured buildings are already
   merged per sheet (~20 calls); the calls are the props: every tree, lamp, crate and seat is a clone.
   THE INSTANCE PASS (§5.5) is worth ~3× on the outdoor rooms before any world is stitched.
2. **Triangles are fine.** The heaviest room draws ~380 k; a 2016 laptop GPU draws 1–2 M at 60 fps.
   Three parts of a zone live at once is ~1 M in the scene, most of it frustum-culled.
3. **Even an 8 × 6 room draws ~750 meshes and ~100 calls** — the fixed cost of the shell, the door
   dress, the walker, the HUD sprites. Merging five medical rooms into one costs little.
4. **The user "hasn't had frame rate issues"** (EXPLORABLE_AREAS_GUIDE line 25). The plan sets a budget
   anyway (§5.5) because a zone multiplies what a room costs, and Phase 0 measures it on the user's
   machine with the readout that exists (`ThreeRenderer.hq.perf()`, three-renderer.js ~33112) put on the
   HUD behind the existing `ew_fpsCounter` setting (the counter ticks only in battle today, ~33133).

### 2.4 The assets (download once)

- **THE ASSET STORE exists** (three-renderer.js ~1436–1565, 2026-09-20; asset-store.test.js): every GLB,
  OBJ and texture goes through Cache Storage `ew-assets-v1`, capped at `AS_CAP_BYTES` 1.5 GB, LRU by a
  localStorage index (≤ 4000 entries, evicts to 90 %), `navigator.storage.persist()` asked once; a hit
  reads from disk with no network. Off on insecure contexts and file://. Safari/iOS may purge after 7
  days unused. Eviction accounting reads `content-length`, so a response without one counts as 0 bytes
  (a gap; §6 closes it with the manifest).
- **The scripts do not use it**: 22 R2 scripts + 5 stylesheets ≈ 20.1 MB JS + 0.9 MB CSS on disk (brotli
  on the wire, unmeasured, likely 3–5 MB), all parser-blocking, ONE shared `?v=` token, so any delivery
  re-downloads everything (deploy.js refuses two tokens). index.html is `no-cache` from Render.
- **No compression anywhere**: plain r128 `GLTFLoader.parse` on the main thread, no DRACO / meshopt /
  KTX2; textures are PNG/JPG at full size (phones redraw maps over 512 px). Meshy GLBs are 5–16 MB
  (chairs 16 MB, the Wooden Door 11 MB); the hall's furniture ~300 MB, a room's population ~100 MB cold.
  ~455 distinct GLB names in the code; the whole set is an ESTIMATED 2.5–4 GB — more than the store's cap.
- **Parsed models are never freed** (`_unitGlbCache`, `_miscModelCache`, `_foliageModelCache`, the texture
  caches) — RAM and GPU memory only grow within a session. For a world that matters more than bytes.
- **The queue** (~11057–11140): `MODEL_MAX_INFLIGHT` 4, priority 0 the rig lane, 1 the scene, 2 the
  background; GLBs held while sheets are in flight (`TEX_HOLD_MS` 2500); phones one at a time.
- Cloudflare: `Assets/` had no cache-control from the bucket (the user added a cache rule; unverifiable
  from the repo). Asset URLs carry no `?v=`: the URL is the version; a file replaced under its name stays
  stale until evicted (MODEL_INDEX's same-thing rule + rename-to-bust stands).

**The honest answer to "can't things just download once?"**: on desktop Chrome/Edge they already mostly
do; the browser can still evict, so it is "rarely again", never "never". The three things that make it
whole are compression (so the whole game fits under the cap and a room is 5–10× lighter), a manifest (so
the store counts right and a zone can be warmed as a set), and a bigger cap when the browser grants
persistence (§6).

### 2.5 The sky, the clock, the water, the vehicles

- **No time of day.** Each room is static: `shell.sky.night` picks the day or night light rule
  (`HQ_LIGHT_RULES.open`, data.js ~49515), `sky.day`/`clouds` feed the dome (`_hqTickSky` ~43645); the key
  light's azimuth/elevation is fixed per room kind; the dome's `sunDir` is a constant in the shader
  (~22191). `body.dataset.cycle` is forced to `'day'` on every entry (~56414). The BATTLE has a cycle
  (odd rounds day, even night, `getCurrentCyclePhase` map.js ~12287). Real-clock ROOM VARIANTS exist
  (`when: {hours, p}` — rush hour, last train, the dead hour).
- **Water**: `terrain.sea` = one surface over a field; the swimmer, the skiff (8.5 m/s), the bathyscaphe
  (`HQ_SEA_RULES` ~49490; three-renderer.js "THE DEEP" ~52803–53000). Only inside the one sea room. A
  sea room fights a Δ, not a field ("a swim has no tile").
- **Vehicles**: cars are NPC traffic on routes (`_hqBuildTraffic` ~42678) and parked props; there is no
  drivable car. The skateboard is a full ride mode anywhere. The train is a way.
- **The camera** sees 274 m (`far` 20000 u); the dome is 219 m; the outer ground runs `HQ_OUTER_M` 54 m
  past the field into `FogExp2`. A far weenie is a sky decoration at a bearing (`shell.sky.landmarks` →
  `_hqLandmarkBuilders` ~43454: peak, castle, stairway, dome), not a thing on the ground.
- **The shadow** is one 2048 map, 30 m half-width round the walker, texel-snapped, every frame.

### 2.6 The map (map.js `_hqMapHtml` ~4950, `_hqWorldHtml` ~5166; data.js `hqMapGraph` ~41132, `hqWorldOverview` ~41495)

Two sheets: AREA (rooms as nodes laid out by an algorithm — the hall at the origin, the rings, floor
bands, a BFS into free cells) and WORLD (one node per place on the authored slots, octilinear transit
lines per route, glyphs, a compass). Both are subway maps of the door graph. No room has a world
position; no part has an outline; there is no metre anywhere on the sheet.

---

## 3. THE GAP — the user's asks against today

| The ask | Today | The plan |
|---|---|---|
| open connected world, minimal loads | every door a rebuild; a warm walk is a blink, a cold one a card | zones + joins + the stage (§4, §5); the card only for another dimension or a cold first visit |
| outside is outside | 40 outdoor rooms, each under its own sky, 54 m of ground then fog | one ground per zone, the neighbour visible and walkable, a far plane that reaches it (§5.4) |
| beyond the 8 × 8 area | the encounter confines the fight to an 8 × 8 window of the room (`HQ_FIELD_RULES.size` 8); the engine runs 16–24 boards | the window sized by the GROUND round the strike: 8, 12 or 16 cells a side, the biggest the open ground holds; team sizes unchanged (§5.6) |
| a highway to Area 51 | three `road` gantries between the cities, a load each | THE HIGHWAY zone: road parts on the desert from Downtown's edge to the flightline's gate (§4.5, Phase 5) |
| dirt trails and stone paths | `path` is a texture swap in the terrain; the roads-out asphalt | trail parts between places (family A', `path` rows, the `marks` paint); paths are how joins are found (§4.5) |
| Olympus a mountain you climb | the summit is a hub of terraces, 8.6 m of range | THE MOUNTAIN: three stacked parts, foothills → switchbacks → summit, 0 → 70 m (§4.5, Phase 6) |
| an ocean to sail | one sea room 150 × 120, the skiff inside it | THE COAST: the sea joined to Downtown's docks, the sea 300 × 300 at res 1.0, the cay and the Dutchman on it (Phase 7) |
| weenies in the distance | a dome decoration at a bearing | far shells of the zone's own parts (§5.4) + the dome for what is off-ground |
| a separate day/night cycle | none outdoors; the battle's round cycle; real-clock variants | `HQ_WORLD_CLOCK` per zone (§4.4, §5.7) |
| feasibility | — | §0; every mechanism named with its line |
| frame rate | 1187–1579 calls on the outdoor rooms, 0 instancing on props | THE INSTANCE PASS, the tiles, the budget, the readout (§5.5) |
| download once | the store, 1.5 GB, no compression, no manifest | §6 |
| what first | — | Phase 1 on the city; interiors in parallel (§10) |
| the mall, Camelot, the Vatican, the bunker, the D.U.M.B. on par with the stadium | plateaus, generators, board-room sizes | BUILT rebuilds in their frames (§8.1–8.3) |
| buffer rooms, the well room | 40-odd connectors; five wells into one room | §8.4: merged, deleted, or re-pointed; the wells table |
| a real map | a subway map of doors | drawn from the frames (§7) |
| chunked rendering | one terrain mesh per room, default frustum culling, no LOD | terrain tiles, far shells, the stage's one-hop rule (§5.1, §5.4, §5.5) |
| medical bay's little rooms | five loads | THE MERGE: one room with partitions and swinging doors (§4.3, Phase 2) |
| the woods disconnected | seven small rooms behind links | THE WOODS as one field of clearings (§8.5, Phase 4) |

---

## 4. THE WORLD MODEL (data.js)

### 4.1 `DOOR_HQ.world` — zones, parts, frames

```js
world: {
  zones: {
    city: {
      label: 'DISASTER CITY', hub: 'city',
      sky: 'downtown',                      // the zone's ONE sky row (the parts' own `shell.sky` become overrides for `lock`)
      clock: true,                          // rides HQ_WORLD_CLOCK (§4.4); false = the parts keep their fixed hour
      far: 900,                             // camera far in metres for this zone (default HQ_WORLD_RULES.far)
      parts: {
        site_prebuilt_downtown_streets: { x: 0,    z: 0,    y: 0, rot: 0 },
        site_prebuilt_stadium_bowl:     { x: 40,   z: -190, y: 0, rot: 0 },
        site_prebuilt_strip_streets:    { x: -190, z: 60,   y: 0, rot: 0 },
        site_prebuilt_downtown_mall:    { x: -60,  z: 20,   y: 0, rot: 0, interior: true },   // on its lot
      },
      joins: [
        { a: 'site_prebuilt_downtown_streets', b: 'site_prebuilt_stadium_bowl', side: 'n', span: [-12, 12], y: 0, kind: 'road' },
        { a: 'site_prebuilt_downtown_streets', b: 'site_prebuilt_strip_streets', side: 'w', span: [50, 70], y: 0, kind: 'road' },
        { a: 'site_prebuilt_downtown_streets', b: 'site_prebuilt_downtown_mall', door: 'mall', kind: 'door' },
      ],
    },
    …
  },
}
```

- `x, z, y` metres in the zone's frame (the zone's origin is its hub anchor's centre); `rot` quarter turns
  (0–3). Quarter turns keep every height grid axis-aligned, which is what makes the stitch (§4.2) a row
  copy rather than a resample. `y` lifts a whole part (the mountain's tiers).
- `interior: true` = a part with a ceiling that stands INSIDE the zone (the mall on its lot, the keep in
  its ward): drawn only when current or joined, never as a far shell, its floor plan drawn on the map
  as a footprint.
- A room may be in ONE zone. A room in none behaves exactly as today. Nothing changes for the 217 rooms
  until a zone names them, which is how the phases can land one place at a time.
- Readers: `hqWorldZoneOf(roomId)`, `hqWorldFrame(roomId)` → `{zone, x, z, y, rot}`, `hqWorldToZone(roomId,
  x, z)` / `hqZoneToRoom` (the two transforms), `hqWorldNeighbours(roomId)` (the joined parts, one hop),
  `hqWorldRing(roomId, hops)`. `hqWorldValidate()` (data.js, run by the test): no two parts of a zone
  overlap except at a join's overlap band; every join's two spans coincide in the zone frame within
  `HQ_WORLD_RULES.joinTol` 0.5 m; every part of a zone is reachable from its hub through joins.
- **The slots stay.** `HQ_WORLD_L.slots` becomes DERIVED for a place that has a zone (the zone's origin in
  the compass scaled to the sheet), authored as today for a place that has none. The two-click travel is
  unchanged.

### 4.2 The join — a shared edge, and the STITCH of two height fields

A join is a segment of one part's edge that is the same segment of the neighbour's edge in the zone
frame. `side` is the side of `a`; `span` is the range along that side in `a`'s metres; the compiler finds
`b`'s side and span from the frames (`hqWorldJoinResolve`). Three things happen at a join:

1. **The shell opens there.** Today `edge: 'open'` + `roam` (data.js ~40520, ~44782) already lets the walker
   past an open shell by `roam` metres over the outer ground. A join sets that side's shell to open over
   the span (the wall row, the treeline ring, the fence: whatever the part's family puts on that side,
   `hqShellSideOpen(room, side, span)` cuts it) and `roam` to the neighbour: the feet rule hands over at
   the line (§5.3). A `kind: 'road'` join keeps the existing road way's dress (the asphalt, the dashes,
   the gantry naming the next place) minus the fog and the LEAVING plate — the gantry stays because it
   is a good sign; a `kind: 'trail'` join dresses a dirt path with a marker post; `kind: 'shore'` (§4.5
   THE COAST) meets a sea part at a quay or a beach; `kind: 'wall'` (Camelot's gate in the curtain wall)
   dresses an opening in a wall row.
2. **The two height fields agree along it.** `hqTerrainCompile(room, roomId, { joins })` gets, per join,
   the TARGET PROFILE: `y` (a flat join, the default: a road, a quay, a meadow) or `profile: [[t, y] …]`
   (an authored cross-section for a mountain shoulder). Within `HQ_WORLD_RULES.stitchM` 6 m of the edge
   the field blends to the profile with the same ease the door pads use today (`pads`, HQ_TERRAIN_RULES),
   and the generator is told the span is a corridor mouth (`gen.open` rows at the join, which every
   family already honours for door pads: the cave's automata leaves it open, the clearings' Prim tree
   reaches it, the city's streets end on it, the halls' BSP puts a corridor on it). Both sides compile
   INDEPENDENTLY to the same authored profile, so the worker needs neither side's result for the other,
   the seeded compile (`hqHash(roomId)`, data.js ~44787) stays deterministic, and check-terrain proves
   each part alone. A join therefore never needs the other part to exist yet.
3. **The outer ground yields.** `_hqBuildOuterGround` (~40990) runs the field 54 m out under the fog on
   every side today; on a joined side it is not built (the neighbour's field is the ground there), and
   the fog over a zone is the zone's (§5.7). On an UNJOINED side of a zoned part it stays, and it wears
   the FAR SHELL of whatever lies that way (§5.4).

The overlap band: the two parts overlap by `stitchM` (each part's field is compiled `roam` + 1 m past its
shell already). Inside the band both fields exist and agree to the profile; the walker's feet read
whichever part is current (§5.3). A prop, a find, a native or a tape may not stand in a join band
(`hqWorldValidate` refuses it), so nothing is drawn twice.

**Indoors** a join is the same thing through a wall: a `halls` part's corridor ends on a span of its
shell that is open into the next `halls` part's corridor (the D.U.M.B.'s sub-level 7 ⇄ the war room ⇄ the
bunker: three parts, no loads, the corridor runs on). The profile is the floor's height. The zone has no
sky; its "sky" is the parts' ceilings and their fog.

### 4.3 The DOOR JOIN — a door that swings (`inner: true`)

For an interior part inside a zone (`interior: true`) and for the MERGE of small rooms (the medical wing)
the join is a doorway, not an edge. A door row gains `inner: true`:

- The door stands in BOTH parts' shells at the same zone position (the validator checks). It is a real
  door leaf on a frame (the door dress that exists, `_buildDoor3D`-style in the room, `_hqBuildDoors`),
  it SWINGS when the walker is within `HQ_WORLD_RULES.swingM` 1.6 m and closes behind (the hinge the
  battle's Swing Door already animates; the sound is the door's own), and it BLOCKS nothing once open.
  Its plate reads the room beyond (the existing plates).
- The other part is a joined neighbour (live, drawn, walkable); crossing the threshold line is the
  crossing (§5.3). A locked or earned door (`hqDoorEarned`, the repairs frame) stays a door that does not
  open: `inner` is refused on a door that is not earned yet, so discovery is unchanged.
- THE MERGE is the same door inside ONE room: the medical wing becomes one `box` room 26 × 16 with
  PARTITIONS (authored `wall` rows with `door` gaps — the E · BUILT wall row with a gap, `hqWallDoorway`)
  and `inner` doors on the partitions. The five rooms' props, counters (Ward 1111's desk = Challenge, the
  chart), natives and the padded cell keep their places; the five room ids stay as ALIASES in
  `DOOR_HQ.rooms` (`alias: 'medwing'` + an `at`) so every link, ledger key, `hqRoomSee` row, achievement
  and save that names `padded` or `dispensary` resolves (`hqRoomResolve`). The directory shows one room
  with four named bays. That is the whole recipe for a wing (§8.4 lists which).

### 4.4 `HQ_WORLD_CLOCK` — the exploration day

```js
const HQ_WORLD_CLOCK = { dayMin: 24, start: 9.0, dawn: [5.5, 7.0], dusk: [18.5, 20.0], lampsOn: 18.0, lampsOff: 6.5,
                         sun: { noonEl: 62, riseAz: 100, setAz: 260 }, moon: { el: 35 } };
```

- `hqWorldHour(now)` = a day of `dayMin` real minutes, continuous, from the profile's own epoch
  (`door.hq.clock.t0`, so a returning player finds the same time of day as they left, plus the minutes
  since — the world ran on). Not the real clock: a player at 3 a.m. should not have to wait for a
  morning. Pausing (the pause menu, a battle, a panel) STOPS it (`hq.clockHold`).
- The sun: azimuth from `riseAz` to `setAz` over the day, elevation a sine to `noonEl`; below the
  horizon the moon (`el`) is the key light at the night intensities. The dome's `uSkyDay` is the sun's
  elevation eased through `dawn`/`dusk`; `uSkyClouds` stays the zone's. The hemisphere/key/fill
  intensities interpolate between `HQ_LIGHT_RULES.open`'s day and night rows (both exist).
- Lamps (`shell.lights`, the street lamps, the neon, the campfire's flicker) carry `night: true` (most
  already do by look) and fade in from `lampsOn`, out at `lampsOff`; a lamp with `always: true` stays.
- `sky.lock: true` on a room keeps its own hour (Hell, Heaven's cloud fields, space, the Strip's and
  Cyberpunk's neon night — §9 asks the user which cities lock). A locked part inside a clocked zone
  keeps its lamps on; its sky is the zone's anyway.
- **The room VARIANTS on the real clock** (`when: {hours}`: rush hour, last train, the dead hour) move to
  the world hour (§9, default yes — the world's own morning has its own rush hour).
- **A fight starts at the hour the room was at.** The hand-over already carries the room's light
  (seamless-field-encounter.md "the light, fog, look and ceiling hold"); the battle's round cycle
  (`getCurrentCyclePhase`) starts from the nearest phase (day if the sun is up) and flips per round as
  today; the return puts the world hour back where the clock was held. Nothing on `state`, nothing
  relayed (RULE #2: story mode only).

### 4.5 THE GEOGRAPHY — the proposal (the user picks; nothing here is forced by a door)

Drawn on `HQ_WORLD_L`'s compass (the user's own ruling: surface north, underground south, city east, the
deep off the coast) and the asks. Every line below is a DEFAULT; a door the user removes takes its row
with it and nothing else moves. Distances are the parts' real sizes; a trail or a road part is new
ground only where the two places would otherwise touch by a load.

```
                                   THE NORTH POLE (a door: the fireplace, the ward's tape)
                 MT OLYMPUS · the summit 70 m ─ Heaven's gate (a door in the sky)
                 the switchbacks 25→60 m
                 the foothills 0→25 m ──── THE KINGDOM: Camelot's ward, the keep, the hall, Merlin's undercroft below
     THE WEST                        │        (the sky castle: a door in the sky)
  Shasta's slopes ─┐                 │ the crown's road (stone)
  THE WOODS: one field ── the haunted grounds ── THE FORECOURT ── the road (asphalt) ──→ THE CITY: the stadium (north)
  of six clearings          (the house)        D.O.O.R. HQ                                Downtown (the mall on its lot)
     │ the redwood trail                          (the origin)                             the Strip (south-west of Downtown)
  the Grove ── the estate (the corn, the lodge)                                            the docks ──→ THE COAST: the sea, the cay,
                                                                                                          the Dutchman, the whirlpool (a door)
                                        THE HIGHWAY (south from the Strip, through the desert)
                                                       │
     THE UNDER (no sky, under the woods and the estate): THE DESERT: Area 51's gate ── the flightline ── the hangar ── the white rooms
     the cavern's gallery, the vent, the blast, the adit, the mouth,      the D.U.M.B. below it (an underground zone: motorpool, sub-level 7,
     the oubliette — one cave field                                        the dream lab, the clone vats, the war room, THE BUNKER)
     THE UNDERWORLD (no sky, under the city): the sewers, the tunnels, the cells, the workings — one zone
```

| Zone | Parts (existing unless NEW) | Joins | Notes |
|---|---|---|---|
| **THE FORECOURT** (Z0, the origin) | NEW `hq_grounds` 100 × 80 (family E: the rotunda's drum and the wings as the building's outside, r 21 + the containment ring; the forecourt south; a car park east; the trailhead west; the crown's road north) | the road east (→ THE CITY), the trail west (→ THE WOODS via the haunted grounds), the road north (→ THE KINGDOM) | the foyer's front door becomes an `inner` door onto it; the main menu moves to the strip's EXIT + the terminal (§9 fork 1). It is the place you see everything from: Olympus north, the city's towers east, the redwoods west — the far shells (§5.4) |
| **THE CITY** (Z1, east) | Downtown (the hub), the stadium (north, the players' tunnel), the Strip (south-west: a Vegas strip on the desert's edge), the mall (`interior`, on its financial-district lot), the garage stays HQ's G floor (its link to the motorpool is a vehicle tunnel: a door) | Downtown N ⇄ stadium (road, the existing gantry); Downtown W ⇄ the Strip (road); Downtown ⇄ mall (door join); the docks' waterfront S ⇄ THE COAST (shore) | Cyberpunk is Downtown in 2047: the same coordinates, another time — it stays a DOOR (the time machine, the train, the road gantry at the Strip's west end), on the BEYOND sheet as "DOWNTOWN · 2047". The Strip's neon night: `sky.lock` (§9) |
| **THE COAST** (Z1b, the same zone as the city or its own — default its own, joined) | NEW `harbour_sea` 300 × 300 at res 1.0 (the sea floor is cheap; `terrain.sea` over it), Bermuda's cay and the Dutchman's deck placed ON it as islands (the existing parts become features of the sea part, or parts with a `shore` join at their beach — default: parts, joined), the abyss stays drowned behind the whirlpool (a door), the temple behind the abyss | the docks' quay (shore, `y` 0 on the quay, the sea floor −6 under the surface at −0.4) | the skiff sails from the quay; 300 m at 8.5 m/s is 35 s across, the cay at 120 m, the Dutchman at 200 m, the waterspout weenie on the horizon, the whirlpool at the far edge |
| **THE HIGHWAY** (Z2, south) | NEW `highway_desert` 80 × 420 at res 1.0 (family E on flat desert: the road with its paint, a diner, a gas station, a billboard weenie of Area 51's gate; family A' banks either side) — one long part, or two of 210 (default two, joined) | the Strip S ⇄ the highway N (road); the highway S ⇄ Area 51's gate (road) | the user's "actual highway": 420 m at run speed 4.6 m/s is 90 s of road; the user's skate does it in 60. A vehicle you drive is NOT in this plan (§9 fork 8) |
| **THE DESERT / AREA 51** (Z2b) | the flightline (open, the hub), the hangar (`interior`, door join at the hangar doors), the white rooms (door join), NEW `area51_gate` 60 × 40 (the guard post, the fence, RUNWAY 33's end) | gate S ⇄ flightline; flightline ⇄ hangar (door); hangar ⇄ ward (door) | the D.U.M.B. below is its own zone reached by the motorpool's lift/ramp (a door: down is a load, which is fine — "separate dimensions can be their own area") |
| **THE D.U.M.B.** (Z3, underground, no sky) | motorpool (hub), sub-level 7, the dream lab, the clone vats, the war room, THE BUNKER, CERN's ring stays a door (Europe) | corridor joins between the six `halls` parts at their existing door positions (the corridors run on) | the bunker rebuilt BUILT (§8.3); the catwalks over the halls (BUILT §5.6) |
| **THE KINGDOM** (Z4, north) | the ward (hub, rebuilt BUILT: curtain walls, the keep's drum, the gatehouse bridge — §8.2), the great hall (`interior`, door join), the keep (`interior`, door join), Merlin's undercroft (a door: down), the sky castle (a door: up), NEW `crown_road` 60 × 160 (stone road, family A' banks) between the forecourt and the gate | forecourt N ⇄ crown road; crown road N ⇄ the ward's south gate (wall join); ward ⇄ hall / keep (door joins); ward N ⇄ THE MOUNTAIN's foothills (trail) | the North Pole village stays a door (the fireplace, the ward's tape): snow is another place |
| **THE MOUNTAIN** (Z4b, north of the kingdom) | NEW `olympus_foothills` 140 × 120 (family A' with `wallH` banks and plateaus 0 → 25 m, the pines, the trailhead shrine), NEW `olympus_switchbacks` 100 × 120 (the `switchback` typology Shasta already uses, 25 → 60 m, the cliff path, the lookout), the summit (existing, lifted `y: 60`, 60 → 70 m, Heaven's gate on the high terrace stays the door it is) | foothills N ⇄ switchbacks (trail, `profile` up the shoulder); switchbacks N ⇄ summit (trail at `y` 60) | the climb is 70 m over ~300 m of trail: ten minutes on foot with the lookouts; the summit seen from the forecourt is the north weenie; Shasta's slopes are NOT this mountain (Shasta is the west's peak, a door from the woods' trail top; §9 fork 7 asks whether Shasta joins the woods as a fourth part instead) |
| **THE WOODS** (Z5, west) | THE WOODS as ONE field 160 × 140 (§8.5: the six open rooms' clearings become the clearings of one `rooms` plan; the deadmans drain stays a door: down), the haunted grounds (existing, east, joined), the house (`interior`, door join off the grounds), Shasta's slopes (a trail join at the top of the old trail, default), the Grove (a trail join at the redwoods' west, default), the estate (a trail join south of the pasture; the lodge `interior`, door join) | forecourt W ⇄ haunted grounds (trail); grounds W ⇄ the woods (trail); woods NW ⇄ Shasta; woods W ⇄ the Grove; woods SW ⇄ the estate | Agartha's crystal city stays a door in Shasta's flank; the Looking-Glass stays the dead tree; the woods' stair to HQ's stairwell stays a link (a door in the tower) |
| **THE UNDER** (Z6, no sky) | the cavern's seven parts as ONE cave field 120 × 100 (family A, the gallery in the middle, the vent, the blast, the adit, the mouth, the oubliette as its chambers; THE WELL ROOM deleted) | none outside (the wells are ways that drop into it at DIFFERENT chambers, §8.4; the inner sun stays a door: the mouth) | the cave lies under the woods and the estate on the map; its exits to Hell (the vent's draught), the D.U.M.B. (the blast's link) and Agartha (the adit) stay doors |
| **THE UNDERWORLD** (Z7, no sky, under the city) | the sewers (hub), the running tunnels, the cells, the workings — four `halls`/`cave` parts joined at their door positions | corridor joins | the gutters from the streets stay ways (a climb down IS a load worth having: another realm of light) |
| **THE DIVINE** (Z8, its own ground: Rome) | the cortile (open, the hub, rebuilt: the basilica as BUILT architecture standing on it, §8.2), the basilica (`interior`, door join at the great doors), the archive (door join), the observatory (a stair join up), the catacombs (a door: down, the well) | cortile ⇄ basilica / archive (doors); observatory (stair) | Hell under the catacombs and Heaven's stair off the telescope stay doors; the bureau's painting stays the way in from HQ |
| **THE LEY** (Z9, no sky) | the ley tunnel (the corridor) with Göbekli's tell (open) at one end; Stonehenge, Giza, Babel stay doors at the tunnel's other stations ("four hundred miles of it") | tell ⇄ tunnel (a door join at the cistern) | a corridor whose stations are far apart in the fiction stays a corridor with doors |
| **BEYOND** (not a zone: the sheet) | the planets and the ship, Heaven, Hell, the Looking-Glass, the Backrooms, the Flat Lands, Antarctica, the North Pole, Agartha, Technoticlan, Atlantis, CERN, the sky castle, Cyberpunk/2047 | — | doors, drawn as doors, on the wall they open from |

Sizes: the whole surface is about 700 m east–west (the Grove to the coast) by 600 m north–south (the
summit to the highway's end): four minutes' walk end to end. "The world doesn't have to be huge."

---

## 5. THE ENGINE (three-renderer.js / map.js)

### 5.1 THE STAGE — one scene per zone, parts as groups with frames

- `_hqEnter` gains a branch: if the room is in a zone and the zone's stage is live, it does NOT tear down
  and rebuild; it calls `_hqStageMakeCurrent(roomId)` (§5.3). The stage is `_hq.stage = { zone, parts:
  { roomId: { group, state: 'built' | 'warm' | 'far' | 'none', info, batches, lamps, props, nav } } }`.
- Every builder that today writes into `_hq.shellGroup / doorGroup / propGroup / charGroup` writes into
  the PART's group, positioned by its frame (`group.position.set(x·U, y·U, z·U); group.rotation.y = rot·π/2`).
  The builders already take `(room)` and read `room.shell`; the change is the target group and a
  `_hqPartFrame(roomId)` the few builders that compute world positions directly (the sky, the outer
  ground, the landmarks, the sea plane, the shadow frustum) read. Every per-room lookup that keyed on
  "the room" (`_hq.room`, `_hq.info`, `_hq.finds`, `_hq.doors`, `_hq.natives`, `_hq.rails`, `_hq.ramps`, the
  kickables, the gun doors, the climbs, the seats) becomes `_hq.parts[id].*` with `_hq.room` = the current
  part; the walker and the camera live in the ZONE frame, and `_hqSurface(x, z)` (~50616) asks the part
  whose rectangle holds (x, z), in zone metres, transforming into that part's room metres for
  `hqTerrainFeet`. A room in no zone is a zone of one part at the origin: the same code path, no branch.
- The sky, the fog, the sun, the shadow, the AO, the height fog, the atmosphere, the decal and reflector
  passes are ZONE-level (built once per zone entry, ticked for the current part's hour and look). The
  per-part things: the shell, terrain, walls, bridges, spirals, props, lamps (point lights), natives,
  finds, tapes, counters, doors, gun doors, seats, kickables, the nav lattice, the water sheets.
- **Lights**: the forward renderer costs every material per light. Budget `HQ_STAGE_RULES.lampsLive` 12:
  the current part's lamps within `lampR` 60 m of the walker plus the neighbours' within the same, by
  distance, the rest `visible: false` (their glow sprites stay). `HQ_PROP_LIGHT_MAX` 10 stays the per-part
  cap.
- Every room-keyed test keeps passing because the room records are untouched; the stage test
  (`hq-stage.test.js`) drives a vm harness of two parts and asserts the frame transforms, the crossing,
  the disposal ring and the lamp budget.

### 5.2 THE STREAM — warm ahead, build sliced, drop behind

- **Two hops warm.** On becoming current, the stage asks `hqWorldRing(roomId, 2)`: for one-hop parts
  `state ≥ 'built'`, for two-hop `state ≥ 'warm'`. Warm = the compile (the worker survey that exists,
  `_hqSurveyWarmAround` already walks doors nearest-first; it now walks joins first, then doors) + the
  assets on the background lane (`hq.warmRoom(id)` ~56755, already written, now called for the ring; the
  queue's `_bgPromote` lifts a file to the scene lane when a part is promoted to built). Three hops:
  nothing, and a built part that falls to three hops is DISPOSED (its group removed, `_disposeR`, its
  rigs dropped; the caches keep the shared geometry as today). `_mqDropQueued(2)` forgets the queued
  files of a part that falls out of the ring.
- **Sliced build.** A neighbour's build runs through `_hqBuildQueue`: one builder step per frame under
  `HQ_STAGE_RULES.buildMs` 6 ms (the nav lattice's precedent, ~51415: 5 ms a frame), the terrain in
  TILES (§5.5) one tile per step, the props in batches of 20 clones, the walls per row batch, the
  population last and only when current. The order is what you would see first: the terrain tiles nearest
  the join, then the walls and bridges, then the props by distance from the join, then the far ones.
  A part is `built` when its queue is empty; the crossing (§5.3) waits for `built` — if the walker
  reaches a join before the neighbour is built (a sprint into a cold part), the old rule applies: the
  door-blink for the remainder, the card past 700 ms. The user never sees a half-built part: a part in
  build is `visible: false` until its terrain and walls are in (its props may still be arriving — they
  arrive by distance, the near ones first, past the fog line the far ones; §9 fork 5 asks whether the
  user wants the props gate to be whole-or-nothing like the room gate today. The plan's default: the
  terrain, walls, bridges and the props within 60 m of the join gate the visibility; the rest pop in
  under the fog).
- **The gate's rule survives**: nothing textured is shown before its sheet lands (the black-texture rule):
  a tile or a prop with a pending texture stays invisible, never a placeholder.
- **Memory**: `HQ_STAGE_RULES.heapMB` 700 as the soft cap read from `performance.memory` where it exists;
  over it the ring shrinks to one hop warm. The parsed-model caches gain an LRU sweep by part: a misc
  model no live part references and no warm part will is dropped after `cacheIdleMs` 120 s (the board's
  epoch sweep exists for textures, ~33876; the same shape).

### 5.3 THE CROSSING — the swap

- Each frame, after the walker tick, `_hqStageWhere(x, z)` finds the part whose rectangle (shell + `roam`,
  in zone metres) holds the feet, preferring the current part while the feet are in its rectangle (the
  overlap band belongs to whoever you came from, so no flip-flop; hysteresis `HQ_WORLD_RULES.crossHys`
  1.0 m).
- On a change: `_hqStageMakeCurrent(next)`: (1) the old part's population is told to wander home and
  stops spawning; its finds/tapes/counters/doors/kickables/gun doors go dormant (drawn, not interactive);
  (2) the new part's interactive tables come live; its population spawns by its rules (frame-sliced, as
  today); its nav lattice builds (5 ms a frame); its lamps join the budget; (3) map.js hears `onCross(next)`:
  `_hqCurRoom = next`, the strip's plate, `hqRoomSee`, the ledger, the arrival card (`_hqArrivalFire`) for
  a FIRST arrival only, the variant roll for a part that has variants (rolled when it was warmed, so the
  built one is the rolled one), the traveller ledger, the music cue if the part's differs; (4) nothing on
  the screen moves. The saved position (`door.hq.lastRoom`, `at`) is the part id + the feet in room
  metres, as today; a load into a zone builds the current part first under the card, then streams.
- The encounter: `hqFieldWindow(roomId, …)` runs on the CURRENT part's info in room metres (the feet
  transformed); a window is never allowed across a join (the rasteriser refuses cells outside the part —
  the band's cells are the part's own field, so a fight at a join fights on the band). The hand-over
  stashes the whole STAGE (every built part's group) exactly as it stashes the room today
  (`_hqHandoverStash` ~56555) — the battle's `keepM` 28 / `keepFarM` 48 radius already decides what it
  draws; the return rebuilds the current part under the seamless fade and re-attaches the stage.
- The skate, the swim, the vehicle, the climb, the dash all tick in the zone frame and cross like the
  walk (the rails/ramps/climbs tables are per part; the ride reads the current part's, then the
  neighbour's when the board crosses). The helm (the skiff) crosses a `shore` join by the same rule.

### 5.4 THE FAR — the next place, seen from here

- **The far plane and the dome.** `far` per zone (`HQ_WORLD_RULES.far` 900 m default, the camera's `far`
  set on zone entry), the dome radius `_ENV_DOME_R` becomes `max(far · 1.2, 219 m)` (it rides the camera;
  its shader is scale-free), the fog density per zone tuned so the far shells read as haze, not fog
  (`sky.fog.density` 0.0018 per metre outdoors gives ~60 % at 500 m).
- **FAR SHELLS** (`state: 'far'`): for every part of the zone that is neither built nor warm — and for
  every warm one until it is built — the stage draws a cheap stand-in at its frame: (1) THE FAR GROUND:
  the compiled height grid sampled every `farRes` 4 m as one mesh with the floor/cliff blend baked to
  vertex colour (no sheets), from the compile the survey already produced (a part that has never been
  compiled shows the zone's flat ground at its `y` until it is); (2) THE MASSES: the city's blocks at
  `solidTop`, the BUILT walls' quads, the plateaus, the treeline ring as a dark band, the stands as their
  tiers — from the room's rows, no models (`hqFarMasses(room)`, data.js: the builders' geometry without
  the dress); (3) THE WEENIE: the part's own near weenie (§5b) as its far mass with an emissive tint at
  night. Budget: a far shell is ≤ 2 draw calls and ≤ 20 k triangles. A far shell is swapped for the built
  part in the same frame the built part becomes visible (no pop: the far ground lies exactly under the
  real one because both come from the same grid).
- **The dome landmarks stay** for what is not on the ground: `shell.sky.landmarks` of the current part
  are drawn as today, except that a landmark whose `id` is a part of THIS zone is dropped (the real thing
  is there). New landmark kinds the geography wants: `tower` (Downtown's from the highway), `gate`
  (Area 51's from the Strip), `mountain` (Olympus from the city — the far shell handles it inside the
  zone; the landmark is for zones that do not include the mountain).
- **Only the current zone is on stage.** A door or way to another zone is a load (a walk with the
  arrival warmed: when the walker is within `warmDoorM` 20 m of a door to another zone, that room is
  warmed on the background lane, compile and assets, so the blink stays a blink).

### 5.5 THE BUDGET — instancing, tiles, culling

- **THE INSTANCE PASS** (the biggest single win, and it needs no zone): `_hqPlaceProps` (~47926) groups
  placements by model URL + material variant; a model placed ≥ `HQ_STAGE_RULES.instanceMin` 4 times in
  a part becomes ONE `InstancedMesh` per mesh of the model (the tier seats' code ~41378 is the precedent),
  with the per-instance matrix from the placement and a per-instance colour where the placement tints.
  Kickables, natives, animated props and props with lights stay clones (they move or glow). Expected:
  Downtown 2701 → ~900 calls, Cyberpunk 1579 → ~600, Camelot's ward 1187 → ~400 (the trees, lamps, crates, bins, cars, signs
  are the repeats). The same pass instances the foliage rings (`shell.forest`) and the city's street
  furniture. Test: the count of draw calls in the vm harness after the pass ≤ the count before / 2.5.
- **TERRAIN TILES**: `_hqBuildTerrain` emits the height mesh as tiles of `tileM` 32 m (one geometry per
  tile, ONE shared material, the same `aBlend`/`aAO` attributes) so three.js's frustum test drops the
  tiles behind the camera — that is the "only a chunk is rendered" the user asked for, at the level
  where it pays: a 224 × 176 city is 7 × 6 tiles and the camera sees ~40 % of them. Raycasts (the camera
  boom, the blocker set, the encounter's occlusion) hit ≤ 4 tiles instead of the whole field. The merged
  wall/lot batches are tiled the same way (their BVH-free raycast rule stays: never raycast a merged
  batch). SEAMLESS_FIELD_PLAN §8's undone CUT was a MOAT (a hole in the field); tiles are the field
  whole, cut for the frustum only — its own fallback line ("frustum-culled chunks of the merged batches")
  is this.
- **Distance culling** for clones: a clone smaller than `cullM` 1.2 m is `visible: false` beyond 90 m
  (a `_hqTickCull` every 10th frame over the current and joined parts' small props; cheap, ~200 checks).
- **The shadow** stays one 2048 map, 30 m about the walker: a zone does not widen it (the far shells are
  unshadowed by design; the fog covers it).
- **The budget** (`HQ_STAGE_RULES`): `callsMax` 2500, `trisMax` 1.5 M in the scene, `partsBuilt` 3 (the
  current + 2 joined; a part with 3+ joins keeps the two nearest built and the others far), `lampsLive`
  12, `heapMB` 700. When `hq.perf()` reports over `callsMax` for 2 s the ring shrinks (the farthest
  built part goes far); `EW_PERF_LOW` runs one hop built, none warm, far shells only, no instancing
  change (instancing helps phones most). The readout goes on the HUD behind `ew_fpsCounter` (the counter
  ticks in the walk too), so the user's Phase 0 numbers are real.

### 5.6 THE FIELD BEYOND 8 × 8 — the ground a fight may use, never the number of fighters

The user's words: "how an encounter restricts me to an 8 by [8] grid area". Today `hqFieldWindow` cuts an
8 × 8 window (14 m a side at the 1.75 m cell) out of the room round the strike and the fight never leaves
it, even on Downtown's avenues, the ward's bailey or the flightline. The fix is the WINDOW, sized by the
ground. The party's four seats and the enemy group are exactly what they are today (the user does not
want bigger battles; nothing here reads the group's size).

- `HQ_FIELD_RULES.size` becomes `sizes: [8, 12, 16]` and `hqFieldSizeFor(info, feet)`: the BIGGEST `N` in
  `sizes` whose best window round the strike holds at least `reachShare` 0.55 of its `N²` cells as
  reachable ground (the rasteriser's IN cells the walker's reach proof joins), else the next one down.
  **8 is the floor**: a cramped room fights the 8 × 8 it fights today, a street or a meadow 12 × 12
  (21 m), a plaza, a bailey or the bowl's pitch 16 × 16 (28 m). The group never changes the size.
- `sizes` tops out at 16 (the biggest prebuilt boards are 16–24 and the AI, the camera, the fog of war
  and the HUD's minimap run them). Whether a big open ground may fight 20 or 24 is fork 9.
- The player never picks it (no dev shortcut); the strike's prompt line reads the size when it is over
  8 ("WIDE FIELD 12 × 12"), the crystal marker fights its Δ as today.
- `hqFieldWindow` (~49289) is O(origins × cells): for 12 and 16 it scans origins on a 2-cell stride first
  and refines the best three (`hqFieldWindowCoarse`), keeping the "most reach, then nearest centre" rule.
  Every rule that reads the window's size reads the window's `N` (the reach proof, the tier rule, the
  fixed cells, the strata beds; they take `board.N` today). The seats (`hqEncounterSeats`) spread the
  same four party seats and the same enemy group over the bigger window by the existing rules: the
  party's edge and the group's edge are further apart, which is the point.
- `keepM` 28 / `keepFarM` 48 (what the battle keeps drawn of the room) already cover a 16-cell window
  (28 m a side); the camera's framing reads `board.N` as the prebuilt boards do.
- Cost: a 16 × 16 window rasterises 256 cells per candidate; with the stride it is ~2 000 candidates,
  well under a frame's worth in the worker. The window search moves into the survey worker
  (`hqTerrainWorkerServe` gains `fieldWindow`) so the strike's slide never waits on the main thread.
- It needs NO zone: the window reads one part's field, which is what it reads today. The phase that owns
  it (Phase 8, §10) can therefore run at any time, in parallel with the stage phases.
- Online and Practice unchanged (they never fight a field).

### 5.7 THE SKY AND THE CLOCK (the renderer side of §4.4)

- The zone's ONE sky row builds the dome; `_hqTickSky` reads `hqWorldSun(hour)` for `sunDir` (a uniform
  replacing the constant at ~22191), `uSkyDay` from the elevation, the stars' alpha from the same; the
  key light follows the sun (or the moon), the hemisphere/fill interpolate the two rows; the shadow's
  light is the key. Lamps tick their `night` fade once a second. The horizon band's colour is dawn/dusk
  tinted (the dome shader has the band; it gets a `uDusk` factor).
- A part's `sky.lock` freezes its lamp state and, if it is current, holds the dome at its own hour (the
  Strip at night is the Strip's rule; step out of it onto the highway and the sun is where the clock
  says — a fade over 2 s at the crossing, never a snap).
- THE BOWL's floodlights, the flightline's runway lights, the city's neon: lamps with `night: true`.

### 5.8 THE WATER AND THE ROAD (the zone kinds)

- A `shore` join meets a sea part: the land part's field at the quay (`y` 0 → the beach slope to the
  sea floor over `stitchM`), the sea part's `terrain.sea` surface at `y` −0.4 in zone metres, the swimmer
  and the helm cross the join like the walker (the helm refuses the shallows by draft as today). The sea
  part's fog under the surface is the part's own (the teal fog switches at the surface as today, per
  camera depth, zone-wide).
- A `road` join reuses the road way's builder minus the fog run: the asphalt and the dashes are the
  part's own `marks` rows continuing to the edge; the gantry stands at the join naming the next place;
  the LEAVING plate goes. The highway part is a family E part: a `marks`-painted road on a flat desert
  with A' banks (`thicket: false`, `wallH` 1.6 as the flightline's berms already do).
- A `trail` join: a `path` row to the edge on both sides, a marker post prop at the join, the treeline
  ring opened over the span (`hqShellSideOpen`).

---

### 5.9 THE ENGINE GAPS — what a AAA engine has that this one doesn't (read from the code, 2026-09-26)

mondo asked: "What do professional 3D game engines and 3D game worlds have that this plan/game doesn't
include?" The list comes from reading three-renderer.js (three r128, the 2021 release) and the loaders. Each
row says what is there today, what's missing, and where it lands. Rows marked **NEW** add phases 10-14 to
§10. Rows marked **(§x)** were already in this plan.

| AAA engines have | This game today | Where it lands |
|---|---|---|
| **An asset manifest / file tracker**: the engine knows every file a level needs before loading it | Nothing knew. `hq.warmRoom` guessed from prop rows; each gate learned a room's files only by building it | **BUILT in Phase 2**: THE FILE BOOK (each room's recorded files, in localStorage), per-part owned gates, and the near/far split (fork 5). The build-time manifest is Phase 9's `manifest-assets.js` |
| **Streaming by distance priority**: near things load first | The model queue has lanes (scene / warm / bg) but no distance order. Now: a part's far props don't hold its attach, and doors are warmed within `warmDoorM` | Phase 2 (the gate half). Sorting the queue by distance is **NEW Phase 10** |
| **LOD + impostors**: far things drawn with fewer triangles, or as cards | No `THREE.LOD` anywhere; every prop draws at full detail to the fog | **NEW Phase 10**: 2-3 levels per Meshy prop, baked offline by the Phase 9 tool (meshopt `simplify`), plus a camera-facing impostor past ~80 m; the far shells (§5.4) are the zone-scale version |
| **Mesh + texture compression** (Draco/meshopt, KTX2/Basis GPU textures) | Raw GLB, PNG/JPG sheets decoded to full RGBA in VRAM | Phase 9 (§6: meshopt), plus KTX2 in the same tool (**NEW**, into Phase 9): 4-6× less VRAM and no decode stall |
| **Off-main-thread loading**: parse and decode in workers | GLTFLoader parses on the main thread; images decode on it too. Only the terrain survey runs in a worker | **NEW Phase 11**: `ImageBitmapLoader` for textures (decoded off-thread); meshopt decoding already runs in a worker |
| **Shader warm-up / pipeline cache**: no hitch the first time a material shows | No `renderer.compile`: the first frame that shows a new part's materials compiles them (the attach hitch) | **NEW Phase 11**: `renderer.compile(partRoot, camera)` before a part attaches, one part per frame |
| **A frame budget for streaming work** | One builder step per frame (a big terrain step can take 100 ms+). `HQ_STAGE_RULES.buildMs` exists but is unused | **NEW Phase 11**: split the heavy steps (terrain tiles, props) into sub-steps under a ms budget |
| **Static batching**: one draw for a room's unmoving pieces | Instancing of repeated props (Phase 0), but each shell / trim / wall piece is its own draw (~1,300 on Downtown) | **NEW Phase 11**: merge static shell meshes per terrain tile and material (`BufferGeometryUtils.mergeBufferGeometries`, already in r128) |
| **Occlusion / portal culling**: rooms behind walls aren't drawn | Frustum culling only (the "occlusion" in the code is the camera fade and the AO) | **NEW Phase 12**: portals for the door joins (a neighbour through a closed door isn't drawn; through an open one, only if the doorway is in view). Cheap, and the wing is its first user |
| **A memory budget**: evict what you haven't used | Parsed model caches are never freed; a long walk only grows | **NEW Phase 12**: LRU eviction of `_miscModelCache` / rigs by last use, capped by a VRAM estimate (the perf readout gets a MEM line) |
| **Positional (3D) audio** | Sounds are flat: no `PannerNode` | **NEW Phase 13**: room tone and props (a fountain, a crowd, a door) as positional sources on the stage, faded by the neighbour ring |
| **Cascaded shadows + baked light / probes** | One 2048 shadow map following the walker; a forward renderer with a point-light budget (the lamp picker) | **NEW Phase 14** (optional, big): 2-3 cascades on the open ground; light probes baked per part for the interiors |
| **A modern renderer core** (WebGPU, `BatchedMesh`, parallel shader compile) | three r128 (2021) | A fork (§9, 16): upgrading three.js touches every file and every shader patch. Worth its own thread after Phase 9; nothing in Phases 10-13 needs it |
| **Floating origin** | Present: the crossing re-anchors every root to the current part (Phase 1) | done |
| **Instancing, tiled terrain, a disk asset cache, a perf HUD** | Present (Phase 0 / 1; the asset store `ew-assets-v1`; `ew_fpsCounter`) | done |

The biggest wins for "smoother", in order: **shader warm-up + the ms slice** (the attach hitch), then
**texture compression** (VRAM and decode), **LOD** (triangles past 60 m), and **portals** (the interior
zones).

## 6. THE ASSETS — download once, made whole

1. **Compress offline, rename, re-point** (the user's upload; Claude ships the tool): `optimize-assets.js`
   (repo-only tooling, `npm run optimize -- <dir>`): runs `@gltf-transform/cli optimize` per GLB (meshopt
   compression, textures to WebP at 1024 — KTX2 later if the GPU decode cost shows), writes
   `<name>.opt.glb`, prints the size table. The notes estimate 5–10× (a 16 MB chair → 2 MB). The loader
   gains `MeshoptDecoder` (one cdnjs script, ~30 KB) and a WebP-capable texture path (the browser decodes
   WebP natively; three r128's GLTFLoader passes it through). The rename IS the cache bust (MODEL_INDEX's
   same-thing rule): sprites.js / data.js / three-renderer.js URLs move to the `.opt.glb` names in the
   same delivery as the user's upload; the old files stay on R2 until the user prunes them.
2. **The manifest**: `ASSET_MANIFEST.json` on R2 (generated by `manifest-assets.js` from a `wrangler r2
   object list` the user runs; the repo copy is what the test pins): `{ url: { bytes, sha, kind, rooms:
   [...] } }`. The store's accounting reads `bytes` from it when `content-length` is missing (closes the
   0-byte gap); the stage's warm reads the ROOM → files map from it instead of discovering files by
   building (so a two-hop part's assets can be fetched before its build exists); the load card's "N of M
   files" is exact.
3. **The cap**: `AS_CAP_BYTES` becomes `min(4 GB, quota · 0.6)` from `navigator.storage.estimate()` when
   `persisted` is true, else 1.5 GB as today; `_ewAssetStore.stats()` reports both; the settings page
   shows "WORLD ON DISK: 1.9 of 3.2 GB · persistent" with a CLEAR button (the pause menu's settings
   sheet exists).
4. **A zone as a set**: `hq.warmZone(zoneId)` from the pause menu ("DOWNLOAD THIS PLACE") walks the
   manifest's rooms of the zone on the background lane — the user's "download once" as a button, for a
   player on a metered line who wants the city whole before walking it. Not automatic (the ring does the
   automatic part).
5. **Scripts**: unchanged (§9 fork 10). One token, brotli on the wire; per-file hashing is a deploy.js
   change the delivery workflow is built around not making.

Nothing here is a service worker; nothing changes what the player sees except fewer cards.

---

## 7. THE MAP — drawn from the frames (map.js, the WORLD tab)

- **THE SHEET**: one SVG per zone plus the BEYOND sheet; the default view is the surface (Z0 with its
  neighbours' outlines), zoom by wheel, pan by drag, tabs for the underground zones and BEYOND. Metres
  are metres: a scale bar, a compass (north up, the user's compass).
- **A PART is drawn as its outline**: the shell rectangle for a box; for a terrain part the compiled
  plan's solid/open mask traced at 2 m (`hqTerrainMaskAt` ~44692 is the mask, `hqTerrainDump` ~45336 draws
  it for the tests; the new `hqPartOutline` returns the open region's polygon and the mass polygons) — the city's streets as streets, the woods'
  clearings as clearings, the stands as a ring, the mountain as contour bands every 10 m from the height
  grid. Cached per part in the survey worker (it has the grid).
- **JOINS** are open edges (no line); **DOORS** are door glyphs on the wall they stand in, with the
  existing states (`?` unseen end, the wrench for repairs, dotted for a draught not yet found) and the
  existing plates; a door to BEYOND is a glyph with the destination's sheet name; a way keeps its glyph
  (the well, the mirror). **Roads and trails** are the `marks`/`path` rows drawn as lines. **Water** is the
  sea part's surface as a wash.
- **YOU** are a dot that walks (the walker's zone position, live while the panel is open — the panel is
  the pause; the dot is where you paused). Natives you have met, the crystal, the tapes you know, the
  finds you have found: glyphs at their frames (the ledgers exist).
- **Fog of war**: a part you have not stood in is a blank outline with its name only if a seen part's
  door or join names it (the `q` state); a zone you have never entered is not on the sheet.
- **Two-click travel** stays (the world overview's rule) but goes to a PART's door pad, and only to a
  part you have stood in, and never across a zone you have not (the discovery rule §7 of the guide).
- The AREA tab (the subway map of the HQ building's floors) stays for the building's interior, which is
  a building and reads best as floors; the WORLD tab's subway lines are retired.
- Test: `hq-world-map.test.js` — every zone's parts have outlines, no two parts' outlines overlap outside
  a join band, every door in `hqMapGraph` appears once on some sheet, the dot's transform round-trips.

---

## 8. THE CONTENT TRACK — the rebuilds (each its own thread; BUILT_ARCHITECTURE_PLAN §4 is the method)

### 8.1 Interiors that need no frame (can start now, in parallel with Phase 1)

| Place | Today | The rebuild |
|---|---|---|
| **THE MALL** (Downtown, 96 × 64 × 12, `podium`) | a plateau mezzanine, two doors | the atrium: the ground floor open under a MEZZANINE that is an arc/straight `bridge` along the store fronts (BUILT §5.3), the escalators (the Meshy escalator exists) as `ramp` rows between, a glass roof `bridge plain glaze` on trusses, the food court's ring of counters, the fountain in the middle (the near weenie), store fronts as `wall` rows with `quad` shopfronts and `marks` floor tiles; sized to the real thing: 120 × 70 with the anchor store's box at the end; the street doors become the door join (Phase 2) |
| **THE BASILICA** (36 × 52 × 16) | a box with a `basilicadome` prop and marble | the nave as columns (`hqRingWalls` piers), the aisles under galleries (`bridge` galleries on the columns), the DOME as a drum of `hqRingQuad` chords with an oculus, the crossing under it, the altar's baldachin, `marks` on the floor (the cosmatesque pattern); the great doors onto the cortile as the door join (Phase 2) |
| **THE BILLIONAIRE BUNKER** (60 × 40, `halls`) | a BSP of rooms | a real plan: the blast door and the decontamination lock, the vault corridor, the panic suite, the pool room (the pool a real basin), the wine cellar, the server vault, the garage with the cars, the generator hall with catwalks (`bridge` at 4 m); family E, no `gen`, the halls join to sub-level 7 becomes a corridor join (Phase 5) |
| **THE D.U.M.B. HALLS** (sub-level 7 96 × 72, the motorpool 64 × 40) | `halls` generators | keep the generator for the rooms, ADD the catwalks (BUILT §5.6): `bridge` rows at 4.5 m over the main hall with stairs down, the overhead crane rail, the vehicle bays as `wall` pits; the motorpool's ramp up to Area 51's hangar as a `spiral` (its link stays a door: up) |
| **THE MEDICAL WING** | five rooms | THE MERGE (§4.3, Phase 2): one 26 × 16 room, partitions, `inner` doors, the ward's bays, the padded cell |
| **THE RECORDS WING, THE EXECUTIVE SUITE, THE LABS, THE WORKS, THE ANNEX** | hub + leaves | the same merge, one per delivery, after the medical wing proves it (§8.4) |

### 8.2 Outdoor places (after Phase 1; built IN their frames so the joins are authored once)

| Place | The rebuild |
|---|---|
| **CAMELOT** (the ward 96 × 80) | BUILT §5.4: the curtain walls as `wall` rows with walkable wall-walks and `rail`, round towers as `hqRingWalls` drums with `spiral` stairs inside, the gatehouse as a `bridge` over the gate passage (the south gate is the join to the crown road), the keep as an `interior` part behind its own drum, the great hall likewise, the bailey flat with `marks` (the tourney field's lists), the moat as `deep_water` with a drawbridge `bridge`; sized 140 × 120 (a real castle's ward) |
| **THE VATICAN CORTILE** | the cortile as the outdoor hub with the basilica's facade and dome standing on it (the far mass), the colonnade as a ring of `hqRingWalls` piers with a `bridge` entablature, the obelisk (the near weenie), the archive's door and the observatory's stair as joins |
| **THE STADIUM, THE GARAGE** | done (2026-09-26); the stadium's north tunnel mouth becomes the road join to Downtown |
| **AREA 51** | the flightline (open, `rooms`, berms) gets the gate part (NEW, family E: the fence, the guard post, the road's end), the hangar's doors as a door join, the tower as a `bridge` cab on a drum (the near weenie), RUNWAY 33's `marks` |
| **THE FORECOURT** (NEW) | family E: the building's outside as the rotunda's drum (r 21) with the containment ring's annulus and the wings' boxes, the front steps, the flagpoles, the car park, the trailhead, the crown's road; the weenies of the four directions checked from the front door |
| **THE HIGHWAY, THE MOUNTAIN, THE COAST** | NEW parts per §4.5; each a thread |

### 8.3 THE WELLS (the user: "some to the sewers, some to the cavern, in DIFFERENT parts")

| Well (existing link) | Today | Proposed bottom | Why |
|---|---|---|---|
| the haunted cellar's | THE WELL ROOM | the cavern's GALLERY, its west end (a free end `{wall:'free', x, z}` in the cave field) | the house stands over the cave on the map |
| the HQ garden's | THE WELL ROOM | the RUNNING TUNNELS (the underworld), a cistern chamber at their west end | HQ's tunnel already reaches the tunnels; the building's cistern drains to the city's drains |
| Camelot's bailey | THE WELL ROOM | MERLIN'S UNDERCROFT, a new cistern alcove | the kingdom's own underground |
| the estate's farmyard | THE WELL ROOM | the cavern's MOUTH | the estate is over the cave's west; the mouth is the cave's own way out |
| Göbekli's east flank | THE WELL ROOM | the LEY TUNNEL's cistern station (a new chamber off the tell's line) | the tell already opens on the ley; a second way in from the flank |
| the Vatican's | the catacombs | unchanged | already right |

**DONE in Phase 4 (§12):** as the table says, with the details: Camelot's bottom is an open alcove in the
dungeon under the bailey, the estate's well is the skinwalker estate's, Göbekli's cistern is a ley-line
chamber, the garden's a cistern room on the tunnels. THE WELL ROOM is deleted (its ten props go to the gallery's west end; its register number retires).
hq-cave.test.js's "every well drops into ONE cave" pin becomes "every well drops into a DIFFERENT
chamber, none into a room whose only job is wells"; hq-world.test.js's well seams re-pin to the table.

### 8.4 THE BUFFER AUDIT (the rule: merged, deleted, or re-pointed — never kept for a link)

| Room(s) | Ruling |
|---|---|
| the 38 board rooms | **DELETED 2026-09-27** (mondo: "dead code, please delete"): `site_<mapId>` is only an alias `hqSiteEntry` resolves to the entry part, which wears the bay door (`hqSiteEgressDoor`), the marker and the register number |
| THE WELL ROOM | deleted (§8.3) |
| the three lift lobbies (works · annex · labs) | MERGED into their floors: each floor becomes one room with partitions (the warehouse floor, the annex floor, the labs floor), the lobby a bay at the car's door, `inner` doors on the leaves (§4.3); ids aliased |
| the three wing hubs (medical · records · executive) | MERGED (§8.1) |
| the basement junction, corridors A/B, the cold room, dock/laundry, the room at the end, the crawlspace | MERGED into THE BASEMENT: one room 40 × 30 with the corridors as partitions; the secret doors (the cold room's, the room at the end's to the dungeon and to H-Wing) stay secret doors on the partitions; the crawlspace stays a crawl (a low `bridge` you duck under, the guide's headroom rule) |
| the two-room supply closet | one room |
| the stairwell + the tunnel | KEPT (the tunnel is the subway: a hub with six ways; the stairwell is the woods' link's foot) but the stairwell's self-door goes: one landing |
| H-Wing's lobby, bar, two legs, the office | KEPT as they are: H-Wing is a dungeon whose point is the corridor (family C); the shared office's one-way quirk becomes two offices |
| Downtown's lobby, platform, closet; the noodle bar | the lobby and the showroom MERGE into the mall's rebuild (the lobby is the mall's entrance hall); the platform stays (the train is a way); the closet and the noodle bar stay (each is a time machine's booth: a door to BEYOND) |
| the airlock, the Dutchman's cabin, the attic, the cellar | KEPT (each is a set piece with a way: the collar, the pool, the screen, the well); the cellar's well re-pointed (§8.3) |
| the Vatican observatory, the waiting room, the woods' stair | the observatory joins the cortile by a stair (§4.5); the waiting room stays (the Looking-Glass's lobby is its joke); the woods' stair is absorbed into THE WOODS field with its tower as a clearing's feature |
| the cavern's vent / adit / mouth | absorbed into THE UNDER field as chambers (§4.5); their doors out stay doors |
| the ley tunnel, the running tunnels | KEPT: corridors are their families' point; the tunnels gain the garden's well bottom |

**Phase 4 (§12):** THE WELL ROOM deleted; the basement JOINED by doors on the stage (zone `basement`), not
merged; the woods' stair and the cavern chambers stay parts; the 38 board rooms kept then, DELETED 2026-09-27 (§12).

### 8.5 THE WOODS as one field

**Phase 4 built this as JOINED PARTS instead** (zone `woods`, §12): the same walk with no card, every id kept.

Six open rooms (the clearing 49 × 38.5, the trail, the redwoods, the pasture, the stair, the ritual;
Dead Man's cave stays a door: down) become ONE `rooms` plan 160 × 140: `gen.rooms` authored clearings at
the old rooms' bearings from the clearing (the clearing centre; the trail north-west to Shasta's join;
the redwoods west to the Grove's join; the pasture south to the estate's join; the stair east with its
tower; the ritual circle north-east, still behind its draught — a thicket you find), the Prim tree + loops
as the paths between (the generator's own winding corridors are the dirt trails the user asked for; the
`path` rows paint them), the treeline as the bank. Every prop, find, tape, native, the redwood, the
tower, the circle keep their places in the new frame; the six ids alias to the field with `at`s. The
compile is one 160 × 140 field (~15 s in the worker, warmed from the forecourt). The woods' shell sky
becomes the west zone's sky; Shasta's cone stays a landmark until Shasta is a part (§9 fork 7).

---

## 9. THE OPEN QUESTIONS — every fork, with the default the plan builds unless the user says otherwise

1. **The front door.** Today the foyer's street door is the main menu. Default: the front door opens onto
   THE FORECOURT (§4.5 Z0) and the main menu is the strip's EXIT (it exists) and the terminal. Alternative:
   keep the street door as the menu and put the forecourt behind the garage's dock (the loading bay).
2. **How far a zone goes.** Default: the eight surface zones + three underground zones of §4.5 (the
   coast its own zone joined to the city). Alternative: ONE surface zone for everything on the ground
   (simpler map, more far shells live, the same stage). The stage does not care; the map and the sky do.
3. **Cyberpunk.** Default: a door (2047, BEYOND). Alternative: a district of the city (its own frame west
   of the Strip). Its neon night would then need `sky.lock` inside a clocked zone, which works but reads
   oddly at noon next door.
4. **Which cities lock their night.** Default: the Strip and Cyberpunk `sky.lock` (neon is the look);
   Downtown, the stadium, the forecourt, the kingdom, the woods, the mountain, the coast, the highway,
   the desert ride the clock. Hell, Heaven, space, the abyss lock.
5. **The props gate on a streamed part.** Default: a joined part becomes visible when its terrain, walls,
   bridges and the props within 60 m of the join are in; farther props arrive under the fog. Alternative:
   whole-or-nothing like today's room gate (the part stays a far shell until every file lands — slower
   to appear, never a pop). The black-texture rule holds either way.
   **RULED 2026-09-26 (mondo: "if we need a file tracker then make a god damn file tracker"): the DEFAULT.**
   Built in Phase 2 (§12): THE FILE TRACKER (owned part gates, the near/far scan) + THE FILE BOOK + THE WARM.
6. **The day's length.** Default: 24 real minutes a day (a full cycle in a session, dusk every 12 min).
   Alternatives: 48 (slower, more "a day"), 12 (a demo).
7. **Shasta.** Default: Shasta's slopes join THE WOODS at the old trail's top as a fourth outdoor part
   (it is a mountain the woods already look at). Alternative: Shasta stays a door (another place).
   Agartha's crystal city stays a door either way.
8. **A drivable car on the highway.** NOT in this plan (the skate and the run are the highway's speeds;
   the garage's ramp was widened for it, so the hook exists). Default: no. If yes: a `vehicle: 'car'` on
   the helm's code (`_hqTickVehicle` drives a hull already) as its own later plan, with the traffic's
   collision rules.
9. **How big the field may get.** (Rewritten 2026-09-26: the earlier fork asked about enemy seats on a
   wide field, reading the ask as team size; the user ruled that out — "idc about 8 vs 8 battles".)
   Default: the window is 8, 12 or 16 cells a side by the ground round the strike (§5.6); team sizes
   unchanged. Alternative A: up to 24 on the biggest open grounds (the city's avenues, the flightline) —
   longer walks per turn, the camera pulled further out. Alternative B: 16 everywhere the ground holds it
   (no 12 step).
10. **The scripts' token.** Default: one token, unchanged. Alternative: per-file hashes in deploy.js so a
    battle.js fix does not re-download data.js (a change to the delivery workflow, the user's call).
11. **The world's own clock vs the real clock for the variants** (rush hour, last train, the dead hour).
    Default: the world clock. Alternative: keep the real clock for them (a 3 a.m. player sees the dead
    hour).
12. **The mall's lot.** Default: the mall sits on its financial-district lot (the lobby merged in as its
    entrance hall) and the street doors are the join. Alternative: the mall stays a door off the street
    (an interior elsewhere), rebuilt the same way.
13. **The stadium's parking structure.** The link's `why` says "the parking structure joins the stadium
    to the block", but the garage is HQ's G floor. Default: the garage stays under HQ; the stadium joins
    Downtown by the players' tunnel and a surface car park drawn on the bowl's north apron.
14. **The far weenie kinds to add.** Default: `tower`, `gate`, `mountain`; the existing `peak`, `castle`,
    `stairway`, `dome` stay. The user names more.
15. **The order of the outdoor rebuilds.** Default (the user's list, then the frames): the forecourt
    (Phase 1 needs it to see anything) → the city joins → the woods → the highway and Area 51 → Camelot
    and the mountain → the coast → the Vatican. The interiors (§8.1) run whenever a thread is free.
16. **The renderer core (§5.9).** Default: stay on three r128 through Phase 14 (every phase above works on
    it). Alternative: upgrade three.js in its own thread after Phase 9 (WebGPU, `BatchedMesh`, parallel
    shader compile), which touches every shader patch in three-renderer.js and three-vfx-effects.js.

---

## 10. THE ORDER (phases; each a delivery with its own test; no phase ships a dev shortcut)

| # | Delivery | Files | Test |
|---|---|---|---|
| 0 | **THE TABLE + THE READOUT**: `DOOR_HQ.world` with EVERY zone of §4.5 as frames and joins (data only: nothing moves, nothing is drawn differently), `hqWorldValidate` + the readers, `HQ_WORLD_RULES` / `HQ_STAGE_RULES` / `HQ_WORLD_CLOCK` tables, THE MAP drawn from the frames (§7) beside the old WORLD tab (a toggle) so the user can argue with the geography before anything is built, the HUD readout (`hq.perf()` behind `ew_fpsCounter`, ticking in the walk), THE INSTANCE PASS (§5.5: it needs no zone and pays at once) | data.js (R2 + Render), map.js, three-renderer.js, styles-base.css (the map's CSS lives there, not in styles-hud.css) | `hq-world-map.test.js` (the validator's pins and its negative cases, the transforms, the sheet's fog, the instance pass on real three r128 in a vm harness); `hq-world.test.js` untouched (it pins the links, which Phase 0 does not move) — **DONE 2026-09-26, §12** |
| 1 | **THE STAGE on THE CITY**: one scene per zone, parts as groups with frames, `_hqSurface` by part, the crossing swap, the ring (built / warm / far), the sliced build, the terrain tiles, the far shells, the far plane and the dome, the lamp budget, the disposal, the stash of the stage for a fight — proven on Downtown ⇄ the stadium ⇄ the Strip with `road` joins replacing the three gantry loads; THE FORECOURT part built (family E) with its road join to Downtown so the city is reached on foot from the front door (fork 1) | three-renderer.js, map.js, data.js | `hq-stage.test.js` (vm: two parts, the transforms, the crossing, the ring, the lamp budget, the tiles' count); `stadium-garage.test.js` keeps its pins; the offline HQ probe's screenshots from the join looking both ways |
| 2 | **THE JOINS + THE MERGE**: `hqShellSideOpen`, the stitch profile in the compiler, the door join (`inner`), `hqRoomResolve` aliases; THE MEDICAL WING merged; the mall's street doors as a door join (the mall's rebuild §8.1 may land before or after — the join works on the old mall); the road/trail/shore/wall join dresses | data.js, three-renderer.js, map.js | `hq-joins.test.js` (the stitch: two parts compiled to one profile agree within `joinTol`; a swinging door blocks nothing open, everything closed; aliases resolve every ledger key); `hq-suites.test.js` re-pinned for the wing — **DONE 2026-09-26 with deviations (§12): the wing is DOOR JOINS on the stage, not a merge (no aliases needed); the mall's join waits for its lot; the join dresses beyond the road are the later zones'. Plus THE FILE TRACKER (fork 5)** |
| 3 | **THE SKY + THE CLOCK**: the zone sky, `hqWorldSun`, the dome's `sunDir` uniform, the lamps' dusk, `sky.lock`, the clock's hold in pause/battle, the variants on the world hour, the fight at the room's hour; the `tower`/`gate`/`mountain` landmark kinds | data.js, three-renderer.js, map.js | `hq-clock.test.js` (the hour's continuity across a save, the sun at noon/midnight, a locked part's lamps); `day-sky.test.js` re-pinned — **DONE 2026-09-26, §12** (day-sky unchanged: its pins still hold) |
| 4 | **THE WEST: THE WOODS as one field + the haunted grounds + the estate + the Grove joined; THE WELLS re-pointed; THE WELL ROOM and the board rooms deleted; the basement merge** | data.js, three-renderer.js | `hq-woods.test.js` rewritten (one field, six aliases, every old find/tape/native present); `hq-cave.test.js` / `hq-world.test.js` re-pinned to §8.3; `hq-floors.test.js` for the basement — **DONE 2026-09-27 with deviations (§12): the woods are JOINED PARTS (ids kept), the basement DOOR JOINS, the board rooms kept; test `hq-west.test.js`** |
| 5 | **THE SOUTH: THE HIGHWAY parts, the gate part, Area 51 joined (the hangar and the white rooms as door joins), THE D.U.M.B. as an underground zone of corridor joins, THE BUNKER rebuilt** | data.js, three-renderer.js | `hq-area51.test.js` / `hq-dumb.test.js` re-pinned; the highway's `marks` and its two parts' stitch |
| 6 | **THE NORTH: the crown road, CAMELOT rebuilt in its frame, THE MOUNTAIN's three parts** | data.js, three-renderer.js | `hq-camelot.test.js` re-pinned; `hq-mountain.test.js` (the climb solved end to end by the walker proof, 0 → 70 m, `heavy`) — **DONE 2026-09-27** (0 → 65 m on foot; §12) |
| 7 | **THE COAST: the sea part, the shore join at the docks, the cay and the Dutchman as parts on it, the helm across the join** | data.js, three-renderer.js | `hq-deep.test.js` re-pinned; the skiff's crossing in the vm harness — **DONE 2026-09-27** (`hq-coast.test.js`; §12) |
| 8 | **THE FIELD BEYOND 8 × 8** (the encounter's AREA, not its team size — the user's correction): `sizes` [8, 12, 16], `hqFieldSizeFor` by the ground round the strike, the coarse window in the worker, the same seats spread over the bigger window, the prompt's size line. Needs no zone: it can be pulled forward and run in parallel with any phase on the user's word | data.js, map.js, battle.js (`board.N` reads), hud.js | `seamless-field.test.js` grows the 12 and 16 proofs (open grounds get 12/16, a cramped room stays 8, the party and the group seated as today, reach ≥ the window's share) — **SKIPPED 2026-09-27 (mondo: "let's skip phase 8")**: the field stays 8 × 8; §5.6 and fork 9 stand as the design if it is ever wanted |
| 9 | **THE ASSETS**: `optimize-assets.js`, `manifest-assets.js`, `MeshoptDecoder` in the loader, the manifest in the store's accounting and the warm, the cap by quota, the settings row, `hq.warmZone` | three-renderer.js, index.html, deploy.js (the manifest upload), sprites.js / data.js (the renamed URLs, in the user's upload delivery) | `asset-store.test.js` grows the manifest and cap pins; `load-diet.test.js` unchanged — **DONE 2026-09-27 with deviations (§12)**: the swap is by the manifest, not by renamed URLs; textures keep their size (2048 cap); no quantization; KTX2 not wired (r128 ships no KTX2Loader in examples/js) |
| 10 | **THE FAR, SMARTER** (§5.9): LOD levels + impostors for the Meshy props (baked by Phase 9's tool), the model queue sorted by distance to the walker, the far shells (§5.4) | three-renderer.js, the Phase 9 tool | `hq-lod.test.js` (a prop's levels switch at their distances; the queue orders near first) — **DONE 2026-09-27 with deviations (§12)**: levels by screen size, the small-prop cull in place of impostors, the far shells across the whole ground |
| 11 | **THE SMOOTH ATTACH** (§5.9): `renderer.compile` before a part attaches, the ms-budget build slice (`buildMs`), `ImageBitmapLoader` textures, static batching of the shell per tile | three-renderer.js | `hq-stage.test.js` grows the slice (no step over budget on the vm clock) and the merge count pins — **DONE 2026-09-27** (zip 14; `hq-attach.test.js`) |
| 12 | **PORTALS + THE MEMORY BUDGET** (§5.9): a door join is a portal (a neighbour through a shut door is not drawn), LRU eviction of parsed models under a VRAM estimate, the MEM line on the readout | three-renderer.js | `hq-joins.test.js` grows the portal rule; `asset-store.test.js` the eviction — **DONE 2026-09-28 as WORLD_GEOGRAPHY_PLAN G1** (zip ENTROPY_WARS_WORLD_GEOGRAPHY_1; §12, deviation: rigs counted, never dropped) |
| 13 | **SOUND IN SPACE** (§5.9): positional room tone / props on the stage (`PannerNode`), faded by the ring | audio.js, three-renderer.js | `audio-space.test.js` |
| 14 | **THE LIGHT** (§5.9, optional): shadow cascades on the open ground, light probes per interior part | three-renderer.js | screenshots + `day-sky.test.js` |
| ∥ | **THE INTERIORS** (§8.1: the mall, the basilica, the bunker, the D.U.M.B. catwalks, then the remaining wing merges): any time from Phase 0, one thread each | data.js, three-renderer.js | one pinning test each, the BUILT checklist, screenshots |
| ∥ | **THE VATICAN cortile, THE LEY's tell join**: after Phase 2 | | |

`npm run test:end` at the end of every phase (the quick checks + the phase's own tests); never `npm test` or
`test:full` at the end (CI runs `npm test` on every push). No test pins tapes, finds or old saves (§1). data.js goes to Render as well as R2 at Phases 0, 2 and 4 (the aliases and the
ledger keys the server's progress merge reads). Every phase from 1 keeps the room-in-no-zone path
working, so a room the user has not moved is exactly what it was.

**What first, in one line**: Phase 0 this week (the geography as data + the map to argue with + the
instance pass + the readout), Phase 1 next (the stage on the city, the forecourt), the mall and the
basilica rebuilds in parallel threads from day one.

---

## 11. What exists, where (so no implementation thread re-searches)

| Need | Already there |
|---|---|
| the room lifecycle | map.js `window._hqEnter` ~960, `_hqCancelLoadCard` ~225, the walk blink ~363/440, `_hqDeferBuild` ~351, the survey worker ~233–330, `_hqSurveyWarmAround` ~332, the seamless fade ~971–1134, `_hqWalkThroughDoor` ~6067, `_hqGoRoom` ~1357; three-renderer.js `_hqEnter` ~56215, `_hqLeave` ~56566, `_hqGateTick` ~55500, `HQ_GATE_CAP_MS` ~55499, `_disposeR` ~2639, `hq.hold` ~56748, `hq.warmRoom` ~56755, `hq.gate` ~56750 |
| the terrain | data.js `hqTerrainCompile` ~44780 (seeded by `hqHash(roomId)`), `hqTerrainInfo` ~44703 (the cache), `hqTerrainAdopt` ~44738, `hqTerrainWorkerServe` ~44760, `hqTerrainFeet` ~45226, `hqTerrainHeight` ~45152, `HQ_TERRAIN_RULES` ~43261 (`res` 0.5 / `resFine` 0.35, `tile` 1.75), `HQ_TERRAIN_GEN`, `_hqTGenerate` ~43710, `_hqTRng` ~43453, `roam` ~40520 / ~44782; three-renderer.js `_hqBuildTerrain` ~41526, `_hqBuildOuterGround` ~40990 (`HQ_OUTER_M` 54), bridges ~41212, the sea ~41602–41658 |
| the walker | three-renderer.js `_hqTickWalker` ~54206, `_hqSurface` ~50616, `_hqTickAutoEnter` ~54617, `HQ_BODY_R` / `HQ_JUMP_V` / `HQ_GRAV` ~39048–39058, the swim ~52865, the vehicle ~52917–53000, the ride ~51863–52800, the climb ~54018/54134, the dash `_hqDash` |
| props, instancing, models | `_hqPlaceProps` ~47926, `_miscModelInstance` ~23874, the tier seats' InstancedMesh ~41378, the queue `_mqPump` ~11101 (`MODEL_MAX_INFLIGHT` 4, `_bgPromote`, `_mqDropQueued`), the caches ~10962 / ~23717 / ~4946, the ledger + gate ~1347–1432, THE ASSET STORE ~1436–1565 (`AS_CAP_BYTES` ~1454), `_asGltf` ~1542, `_texFetch` ~1571 |
| the sky, the light, the shadow | `_hqBuildSky` ~43577 (`_ENV_DOME_R`), `_hqTickSky` ~43645, the dome shader's `sunDir` ~22191/22228, `_hqBuildLandmarks` ~43556, `_hqLandmarkBuilders` ~43454, the lights per kind ~56274–56355, `HQ_LIGHT_RULES` data.js ~49515 (`open` day/night rows, `key` az/el, `shadows.everyN`), `HQ_PROP_LIGHT_MAX` ~39052, the shadow ~54861–54936, `body.dataset.cycle` ~56414; the battle's cycle map.js ~12287 |
| the encounter | three-renderer.js `_hqStrikeClick` ~51089, `_hqHandoverStash` ~56555, `_hqBuildRoomInBattle` ~56082; map.js `_hqEncounterFire` ~3649, `_hqEncounterStart` ~3755; data.js `HQ_FIELD_RULES` ~48666 (`size` 8, `teamSize` 4, `keepM` 28 / `keepFarM` 48), `hqFieldWindow` ~49289, `hqFieldRaster` ~48991, `hqFieldBuild` ~49383, `hqFieldTransform` ~47236, `hqEncounterSeats` ~44401, `HQ_ENCOUNTER_RULES` ~46625 |
| the population | `_hqSpawnPopulation` ~50380, the nav lattice ~51415/51450 (`HQ_NAV_CELL` 0.7, `HQ_NAV_MAX_CELLS` 42000), `HQ_POPULATION_RULES` data.js ~46426 |
| the ways, the roads, the links | data.js `DOOR_HQ.ways` ~24225 (`road` ~24259), `links` ~24337 (the wells ~24613–24644), `routes` ~24290, `hubs` ~24318, `hqLinkLive` ~40730, `hqLinkDoors` ~40740, `siteRooms` ~24829 (`entry` ~24845), `hqSiteEntry` ~40405, `hqDoorThrough` ~41616; three-renderer.js `_hqWayBuilders` ~46779 |
| the map | data.js `hqMapGraph` ~41132, `hqMapLayout` ~41196, `HQ_WORLD_L` ~41378 (the slots), `hqWorldOverviewGraph` ~41413, `hqWorldOverview` ~41495, `hqWorldRoutes` ~40894, the seen ledger `hqRoomSee`; map.js `_hqMapHtml` ~4950, `_hqWorldHtml` ~5166, the compass ~4573–4600 |
| the built pieces | data.js `hqStandBowl`, `hqGridironMarks`, `hqRingWalls` / `hqRingQuad`, `wall` rows (`y`/`h`/`quad`/`slopeTop`/`tier`/`seat`/`ghost`/`rail`), `bridge` (straight, arc, `plain`, `glaze`), `spiral`, `terrain.marks`, `ramp kicker` — BUILT_ARCHITECTURE_PLAN §3 |
| the rooms this plan moves | Downtown ~34781 (districts), Cyberpunk ~35268, the mall, the Strip, the stadium bowl, the woods' seven (`hqWoodsShell` ~22647, `HQ_WOODS_LANDMARKS`), THE WELL ROOM ~32554, the bunker ~37622, Camelot ~35990+, the Vatican ~35590–35940, Olympus (`HQ_AREA_SPECS` ~41919 `summit`), Bermuda's sea, `hqAreaRoom` ~41850 |
| the perf readout | `_perfRead` ~33112 / `ThreeRenderer.hq.perf()`, `_tickFpsCounter` ~33103 (the battle, and since Phase 0 the walk: `· N CALLS · NK TRIS` summed over the frame's every render), `ew_fpsCounter` / `ew_fpsCap` ~1638–1653, `EW_PERF_LOW`, `hq.nav()`, `_ewAssetStore.stats()`, `EW_HQ_DEBUG` survey log map.js ~295 |
| the tests that pin what moves | hq-cave (the one cave), hq-world (the seams, "the whole world is one piece" ~363), hq-woods, hq-camelot, hq-area51, hq-dumb, hq-deep, hq-suites, hq-floors, hq-map / hq-map-remembers, day-sky, seamless-field, stadium-garage, hq-floor-plan, world-ground, landscape-buildings |

Line numbers are the 2026-09-26 clone's (token `20260926-bugfix-03-cors`); grep the names.

---

## 12. Log

- 2026-09-26 — the plan written (thread "Open World Plan"); nothing built. The survey's measurements
  (§2.3) come from the sandbox's headless Chromium with R2 blocked: floors, not the user's numbers. The
  probe's first entry in a page reports the hall's build (the boot enters the hall at the same time), so
  Downtown was re-measured second in a page; the probe is `measure_rooms.js` in the thread's scratchpad,
  not in the repo (a repo-only copy is worth adding at Phase 0 beside the HUD readout).
- 2026-09-26 — **mondo's correction** (the Phase 0 thread's root message): "idc about 8 vs 8 battles, i meant
  how an encounter restricts me to an 8 by grid area". The plan had read the 8 × 8 goal as team size; every
  place is rewritten as the fight's GROUND: §3's row, §5.6 (THE FIELD BEYOND 8 × 8 — `sizes` [8, 12, 16]
  picked by the ground round the strike, the same seats spread over the bigger window), fork 9 (how big the
  field may get; default 8/12/16) and Phase 8's row. Team sizes are unchanged everywhere.
- 2026-09-26 — **PHASE 0 SHIPPED** (thread "Open world Phase 0"; zip `open-world/ENTROPY_WARS_OPEN_WORLD_0.zip`,
  token `20260926-open-world-01-cors`). Nothing moves and no room loads differently; what is new:
  - **THE TABLE** (data.js, after `hqWorldFloorOf`): `HQ_WORLD_RULES`, `HQ_STAGE_RULES`, `HQ_WORLD_CLOCK`,
    `HQ_WORLD` (= `DOOR_HQ.world`): four grounds, thirteen zones, 45 parts (10 of them `planned` parts with
    a size and no room yet: the forecourt, the sea, the highway's two halves, the gate, the crown road,
    Olympus's two lower parts, the woods field, the cavern field), 32 zone joins + 7 borders, the woods' six and
    the cavern's six rooms `absorbs`-ed at their spots, `retires` for the well shaft. Every coordinate is
    §4.5's compass; north is −z and a quarter turn carries north to the west (three.js's rotation.y).
    Readers: `hqWorldZoneOf`, `hqWorldFrame`, `hqWorldPartSize`, `hqWorldPartRect`, `hqWorldToZone` /
    `hqZoneToRoom`, `hqWorldJoinResolve`, `hqWorldJoins`, `hqWorldNeighbours`, `hqWorldRing`,
    `hqWorldValidate` (§4.1's five rules; `ok` on the shipped table), `hqWorldSheet` (the map's model).
  - **THE LAND TAB** (map.js `_hqLand*`, CSS in styles-base.css `.hq-land-*`): the directory's third tab
    draws the frames in metres — rooms as rectangles, joins in their kind's ink, door joins as glyphs, the
    link doors that are still doors on their walls, a 50 m scale bar, one tab per ground. Fog: the rooms you
    have stood in are named, a room a seen door or join names is an UNCHARTED outline, the planned parts only
    with `window.EW_HQ_MAP_ALL = true`. A first click picks a room (its card, its neighbours, BEYOND = its
    doors off this ground), a second walks there (the old travel rule). The old WORLD and AREA tabs stay.
  - **THE READOUT**: with the FPS counter on (Settings → Video), the walk shows `N FPS · N CALLS · NK TRIS`,
    summed over every render of the frame (`renderer.info.autoReset` off for the frame); `hq.perf().frame`.
  - **THE BUILDING MERGE** (three-renderer.js `_nrSpriteBuilding`): the finding that re-aimed the pass —
    Downtown's 2,701 calls were mostly NOT props: the map-builder building prisms drew ~20 meshes each (a
    plane per storey per face). A face is now ONE mesh (a quad per storey, the same vertices and UVs):
    **Downtown 2,701 → 1,765 calls, 6,292 → 4,014 meshes**, same pixels.
  - **THE INSTANCE PASS** (three-renderer.js, before THE GATE): once the room is ready, meshes that share a
    `_ew_shared` geometry AND `_ew_shared` materials (the misc cache + `_hqPropMatPick`) draw as one
    InstancedMesh per `instanceCell` 64 m square when a kind has `instanceMin` 2+ copies; files that land
    later join as new batches (a 2 s rescan). The originals stay (hidden; raycast; moved by their owners);
    the scene's `onBeforeRender` reads every copy back once a frame (a hidden or detached ancestor zeroes
    it, a changed material or an owner's `visible = true` hands it back for good, a copy that leaves its
    batch's sphere refits the batch), and each batch's frame is scaled so the shared geometry's bounding
    sphere covers its square (culling stays right for the camera AND the shadow map). A mesh with a vertex
    hook other than `_hqAoHook` (the wind, a sway), a skinned mesh, `_ew_noInstance` stay clones.
    `_hqAoHook` gained the `USE_INSTANCING` branch; `_occFieldBig` skips `_ew_hqInst`; `_hqLeave` drops
    the batches BEFORE the battle's hand-over, so the fight takes the originals exactly as before.
    Kill-switch `window.EW_HQ_NO_INSTANCE = true` (re-enter); `ThreeRenderer.hq.dev.hqInst()`.
    Measured on Downtown with a stand-in GLB served for every file (R2 is blocked in the sandbox): **2,299 →
    1,931 calls** (240 batches, 980 copies); 32 m cells gave 2,041 and 128 m 1,832 (+35 % triangles).
    The §5.5 guess (2,701 → ~900 from instancing alone) was wrong: the street furniture is ~15 % of the calls.
    What remains in Downtown: ~1,300 shell meshes (the setting's procedural pieces, lamps, awnings, signs,
    each its own material) — THE MERGE of static shell pieces per material per tile belongs to Phase 1's
    tiles (§5.5), not to this pass.
  - **The probe**: `measure_rooms.js` at the repo root (repo-only): enters rooms in one page and prints the
    calls / meshes / materials / heap / ready time; `CENSUS=1` the top groups, `STANDIN=<glb>` serves one
    file for every missing GLB, `NOQ=1` bypasses the model queue, `NOINST=1` the pass off, `CELL` / `MIN`
    override the pass's numbers, `WAIT=ms` lets late files land, `SHOT=<prefix>` screenshots the LAND tab.
  - Not playtested beyond the probe: the LAND tab was screenshotted headless; the instance pass was checked
    by the probe's counts and hq-world-map.test.js (real three r128 in a vm), never walked by a person.
- 2026-09-26 — **PHASE 1 SHIPPED: THE STAGE on the city** (thread "Open world Phase 1"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_1.zip`, token `20260926-open-world-02-cors`). Downtown ⇄ the stadium ⇄
  the Strip are one walk: the two road joins replace the gantry loads.
  - **THE READERS** (data.js, before THE VALIDATOR): `HQ_STAGE_RULES.zones` (`['city']` — a zone not listed
    keeps today's rooms exactly), `buildDelayMs` 600, `lampPickMs` 500; `hqStagePart`, `hqStageRel`,
    `hqStageToRoom` / `hqStageFromRoom`, `hqStageNeighbours` (rel, the neighbour's box in this room's metres,
    the joined spans, the link doors a span replaces), `hqStageJoinedDoor`, `hqStageWhere` (the crossing's
    rule: `crossHys` past the edge AND inside the neighbour), `hqStageSpanAt` (the doorway strip).
  - **THE PART RECORD** (three-renderer.js `_hqPartFields`): everything a room's builders write that is the
    room's (its four groups in a `partRoot`, doors, blockers, props, finds, rails, tickers, people…); the
    visit's record `_hq` = the zone's keys (`_HQ_ZONE_KEYS`: the scene, the camera, the walker, the sky, the
    light pass, the input) + the CURRENT part's. The current part always stands at the scene's origin.
  - **THE BUILD** (`_hqStageBuildTick`): after the room is ready + `buildDelayMs`, each one-hop neighbour is
    built by the SAME builders (`_HQ_STAGE_STEPS`, `_hqEnter`'s order, one step a frame) into its own record,
    with `_hq` pointed at a stand-in (`_hqStageT`: the zone's keys + the part's, the player absent, a group
    for `scene`). Its floor plan is never compiled on the main thread: the part waits for THE SURVEY
    (`opts.stageWarm` → map.js `_hqSurvey(id, true)`). Skipped for a neighbour: the sky, the portals, the
    gun doors, the people, the ride, the light pass, the atmosphere, the reflectors, the sea.
  - **THE ATTACH** (fork 5 — deviation: WHOLE-OR-NOTHING, the fork's alternative): a built neighbour joins
    the scene when its own gate (`part:<id>`, opened at its first step) is idle, or after `HQ_GATE_CAP_MS`.
    The default (the part's near props first) needs a per-prop gate; the part gate cannot tell near from far.
    Measured headless (stand-in textures, R2 blocked): both neighbours stood ~80 s after Downtown's card at
    software GL's ~1 s a frame; a real GPU runs the same steps in a few seconds.
  - **THE FEET PAST THE EDGE** (`_hqStageSurface`, asked first in `_hqSurface`'s box branch, `_hqAirOK` and
    — `_hqStageCam` — `_hqCamBlocked`): `HQ_STAGE_PAD` 1.5 m either side of the edge along a joined span
    less the pad is the road through (its height, either side's field); beyond it a DRAWN neighbour's own
    `_hqSurface` (its field, its blockers, its step rule) in its own metres. Beside the span the edge stays
    a wall; an undrawn neighbour is no floor.
  - **THE CROSSING** (`_hqStageCross` → `_hqStageSwap`): never mid-dash / climb / seat / swim / ride / helm.
    The records swap in place (the `_hq` object stays: the frame's `_hq !== H` guards hold); the part you
    left keeps its build and becomes a neighbour, its people stand down (rigs disposed) and the new part's
    come out (`_hqSpawnPopulation` with `_stageNoPlayer`); every root is re-anchored by A = RotY(−rot·π/2)·
    T(−rel); the walker, its velocities, its yaw, the camera's eased eye / look / yaw, the key's and fill's
    directions and the sky's bodies turn with the frame; the dome's `uSkyYaw` carries the turn (so the sky
    never moves); the scene-hung lamp masts / shafts of the part you left go into its root; the instance
    pass, the shadow, the AO and the height fog re-arm on the new box. map.js `onCross` → `_hqStageCrossed`
    (the room, the link charted by `_hqRecordVisit`, the room seen + its first-sight card, the strip, the
    tone, the music, the survey's warm). A neighbour not drawn yet — or a door-gun pair / standing door in
    this part (they belong to this room) — falls back to the plain load at the same spot, looking the same
    way (`opts.onStageLoad` → `_hqGoRoom(to, { x, z, face })`).
  - **THE BLEND** (fork 4's default: the Strip keeps its own night): the fog, the hemisphere, the key, the
    dome's tint / stars / nebula / day / clouds / fog ease over `HQ_STAGE_BLEND_MS` 2 s; the look (the retro
    grade, the bloom) turns at the half-way beat. Phase 3's clock replaces this with `sky.lock`.
  - **THE RING**: one-hop neighbours built; a part two hops away detached (kept built; its CSS plates hidden
    — r128's CSS2DRenderer never sees a detached root); past `partsBuilt` 3 disposed, farthest first.
  - **THE LAMPS** (`_hqStageLamps`, every `lampPickMs`): every point light on the stage, the nearest N lit,
    N = max(`lampsLive` 12, the current part's own count) — a constant count (a changing one recompiles every
    material), and a room with no neighbour drawn keeps every lamp exactly as before.
  - **THE GROUND**: the field's quads past the shell that lie in a staged neighbour's box are trimmed (the
    two fields no longer z-fight in the overlap); the outer ground's quads in a neighbour's box are cut into
    `_hq.outerSides[id]`, hidden while that neighbour is drawn. **THE TILES** (§5.5): every terrain field is
    now `tileM` 32 m squares (`_hqTerrainTiles`: each its own geometry — the battle's dig edits a mesh's own
    vertices — with the whole field's normals, so no seam in the light); off: `window.EW_HQ_NO_TILES`.
  - **THE JOINED DOORS**: `link_downtown_strip` and `link_stadium_downtown` build no door record, no plate
    and no road strip (the road builder's `LEN` 0 on a joined door, no LEAVING plate): the gantry alone,
    one each side, facing each other across the join. `link_streets_strip` (Downtown's west z 18) stays a
    door.
  - **THE FIGHT** (`_hqStageFlatten` in `_hqHandoverStash`): the drawn neighbours' pieces join the current
    part's groups, baked through their roots; the battle's keep radius culls them per piece.
  - `ThreeRenderer.hq.stage()` → `{ id, nbs, parts: { id: { built, step, attached, rel } }, crossed, lampN,
    skyYaw, blending }`. Kill-switch `window.EW_HQ_NO_STAGE = true` (then re-enter: every room is its own).
  - **Not in Phase 1** (said so in the thread): the far shells (the city fog, 0.016 / m, closes at ~150 m;
    the camera's far stays the building's 274 m), THE FORECOURT part (fork 1 — a BUILT content job of its
    own), the neighbours' people (they come out when you cross), a 6 ms slice (the build is sliced per
    builder step; a big field is one step), the door joins (Phase 2).
  - Test: `hq-stage.test.js` (the readers; the renderer's crossing, feet, lamps, ring and tiles in a vm).
    Re-pinned: hq-deep (the boats are the part's record), hq-gallery (`gallery: null` lives in
    `_hqPartFields`). Probe: `_probe_stage.js` in the thread's scratchpad (enters Downtown, waits for both
    neighbours, walks the three joins, screenshots).
- 2026-09-26 — **Phase 2 + THE FILE TRACKER** (thread "Open world Phase 2", zip
  open-world/ENTROPY_WARS_OPEN_WORLD_2.zip, token `20260926-open-world-03-cors`). mondo: "if we need a file
  tracker then make a god damn file tracker ... AAA game engine." Fork 5 is RULED to its default.
  - **THE FILE TRACKER**: a gate opened `{ own: true }` records only the files asked for while it is
    `_alOwner` (set around each of a part's build steps), so two neighbours never wait on each other.
    `_loadMiscModel` tags its records `lane: 'misc'` and each instance `_ew_mm = url`. `_hqTrkScan` walks a
    building part's instances, puts each one in part metres, and splits them by `HQ_STAGE_RULES.nearPropM`
    (60 m) from the joined spans (`_hqTrkDist`). `_hqStageReady` attaches the part when `gate.idleExcept(far)`
    (the near files are in plus a settle beat). The far props keep landing under the fog. `propsGate: 'whole'`
    brings back Phase 1's rule. `hq.stage().parts[id].trk` shows the counts.
  - **THE FILE BOOK** (`ew_hqFileBook_v1`, 48 rooms, 900 URLs each): each room's card (`_hqGateTick`) and
    each part attach writes down every file its gate recorded. `hq.fileBook(id)` reads it.
  - **THE WARM** (`_hqWarmTick`, every 500 ms): a door's room within `warmDoorM` is warmed from its book
    (models parsed on the background lane, sheets and rigs fetched to the disk store). A stage part two
    joins away is fetched to disk only (`_asPrefetch`, 2 at a time, skipping what the store already holds).
    Phones (EW_PERF_LOW) warm nothing.
  - **THE DOOR JOIN** (deviation from §4.3's MERGE: the five rooms stay whole, so their ids, tests,
    ledgers and finds don't move). Zone `medwing` on ground `hq` (THE BUILDING): the medwing hub, the
    ward (quarter turn), the dispensary, the interrogation room, and the padded cell off the ward. Its
    four `kind: 'door'` joins name a door on each side, `HQ_WORLD_RULES.wallM` 0.2 apart and facing (the
    validator checks both). Readers: `hqDoorOpening`, `hqWorldDoorJoinResolve`, `hqStageDoorJoin`, and
    `hqShellSideOpen`. A door span on `hqStageNeighbours` (`door`, `pad`, `depth`) replaces no link. The
    renderer:
    - cuts the doorway through the wall and dado, and puts a header over the opening;
    - lines this room's half of the gap (`_hqDoorSleeve`);
    - swings the leaf as the walker comes within reach from EITHER side (`_hqJoinDoorTick`, also run on a
      neighbour's doors in the walker's position in that part's metres);
    - skips the press-in and the door target.
    A closed box neighbour brings its own lamps and (`nbPeople: 'interior'`) its people, with ids suffixed
    `@room`. The box lights ease hemi, key and fill across the crossing, and a room you step out of keeps
    its people standing. map.js records the door used.
  - **THE STITCH** (§4.2): `hqTerrainStitchRows(roomId)` gives, for each edge join between two STAGED parts,
    the join's `y` (default: part a's floor) or its `profile` in zone metres. `hqTerrainCompile` eases the
    field toward it within `stitchM` of the side and past the span's ends. On the city it moves at most
    5 cm; Downtown and the Strip agree along their line (the heavy proof). Zones that aren't staged are not
    stitched yet (the Vatican's observatory join would move 6 m, so it gets authored when that zone is
    staged).
  - **Not in Phase 2**: the mall's door join (its frame overlaps the financial district's buildings: the
    lot must clear, or the mall rebuild (§8.1) lands first); `hqRoomResolve` aliases (no merge, so none
    needed); the trail/shore/wall dresses (their zones' phases); a door-open sound on a joined leaf; an
    outdoor neighbour's crowd (it still comes out at the crossing).
  - **§5.9 THE ENGINE GAPS** was written and Phases 10-14 were added to §10.
  - **Fixed from Phase 1**: a neighbour's plates (the door, counter and bay labels) showed through walls.
    CSS2DRenderer rewrites `display` from `visible` every frame, so Phase 1's hide never held.
    `_hqStageCssShow` now switches `visible`, and the crossing shows the new part's plates.
  - Headless walk (`probe_wing.js` in open-world/, stand-in textures): the three neighbours stood beside the
    hub about 67 s after the card at software GL's ~1 s a frame. The walker went hub → ward through the
    door in 6 ms, with no load. `test:full` ends with the same 25 heavy reds as before this phase (checked
    against HEAD, test by test).
  - Tests: `hq-joins.test.js` (new, one `heavy` proof); `hq-stage.test.js` re-pinned (the zones).
- 2026-09-26 — **PHASE 3 SHIPPED: THE SKY + THE CLOCK** (thread "Open world Phase 3"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_3.zip`, token `20260926-open-world-04-cors`).
  - **THE HOUR** (map.js): a 24-minute day (fork 6's default) run by the HQ frame in every room — never
    paused, never under a card, never in a fight. It lives on the profile (`door.hq.clock = { h, at, run }`):
    written every 30 s of walking with `run` (a game closed mid-walk finds the world ran on), and on every hold
    (pause/suspend, leaving the building, the tab hidden) without it. The hour shows on the room's sub-line in
    a clocked room (`· 19:12 DUSK`). Console: `hqClockSet(21.5)`; `ThreeRenderer.hq.clock()` reads the state.
  - **THE SUN** (data.js `hqWorldSun`): rises 06:00 on az 100, noon 62° due south, sets 19:00 on az 260; the
    moon takes the same arc through the night to 35°. `day` eases over dawn [5.5, 7] and dusk [18.5, 20]; the
    warm horizon (`dusk`) peaks in both; the night lamps are on 18:00 → 06:30 over half an hour.
  - **WHO RIDES IT** (`hqRoomClock`): an open room with a sky in a zone with `clock: true`. Its directions are
    in its own frame (the half-turned bowl sees the noon sun behind its north). The half the room did not
    author comes from `HQ_WORLD_CLOCK.day` / `night`, or `dayLook` by room (Camelot's ward, the flightline,
    the woods' six clearings were authored at night and now have a day). **LOCKED** (`lock`, their lights,
    fog and lamps as authored, the dome's bodies at their own hour): the Strip (fork 4), plus the places whose
    night is the place — the Dutchman's deck, the Grove, the haunted grounds, the skinwalker fields, the
    observatory. Those five are this phase's call, not fork 4's list; one line in `lock` flips each.
  - **THE RENDERER**: the dome's sun and moon read `uSunDir` / `uMoonDir` when `uSunClock` is 1 (the building
    only; the battle and the menu write 0), `uDusk` warms the horizon toward the low sun. The key is the sun,
    or below the horizon the moon, never lower than `keyMinEl` 18° (the shadow map's reach); the hemisphere
    and the key ease between `HQ_LIGHT_RULES.open`'s day and night rows; the fog, the tint, `uSkyDay` and the
    clouds follow `day`. The values are re-read 5× a second and the directions eased every frame. Night lamps
    (`clockLamps`: catalogue `light.night` — the flood masts and the lighthouse — the lamp masts, the far
    skyline's windows) fade by intensity, never `visible`, so the stage's lamp budget count never changes. On
    THE STAGE each part reads its own row; the crossing blends to the hour's values of the part you enter,
    then the clock takes over (Phase 1's blend kept; fork 4 now via `lock`). The zone's `sky` row is not used
    yet: each part still wears its own sky row.
  - **THE FIGHT**: the hand-over's rig (`_fieldGroundDress`) is the held hour's (key, hemisphere, fog), and a
    fight started with the sun down begins at night (`_hqEncounterRun.night` → `getCurrentCyclePhase`; the
    marker is the encounter's own, so a later match never inherits it). The battle's own dome is unchanged.
  - **THE VARIANTS** (fork 11's default): `when.hours` reads the world hour; a test's pinned `opts.now` keeps
    the real clock.
  - **THE WEENIES ON THE GROUND** (fork 14's kinds): `mountain` (a massif, `temple` = Olympus's colonnade),
    `tower` (a far skyline, lit windows as night lamps, a red beacon), `gate` (Area 51's gate: pylons, sign,
    fence, guard tower, floods). `HQ_WORLD_WEENIES` hangs them at the TRUE bearing from the frames
    (`hqWorldBearing`): Olympus over Downtown, the bowl, the Strip, Camelot, Shasta and the haunted grounds;
    the city's towers from the flightline, Camelot, the summit and the sea; Area 51's gate due south down the
    Strip. They go when Phase 10's far shells draw the places themselves.
  - Checked: the dome/ground/wall shaders compile on real three r128 in headless Chromium; `hq-clock.test.js`
    (the sun, the save, the rooms, the bearings, the variants, the lit values on real three r128 in a vm, the
    wiring). Not walked by a person.

- 2026-09-27 — **PHASE 4 SHIPPED: THE WEST + THE WELLS** (thread "Open world Phase 4"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_4.zip`, token `20260927-open-world-05-cors`; data.js to R2 AND Render,
  three-renderer.js to R2, index.html to Render, tests + docs to the repo). Deviations from the row are named.
  - **THE WELLS** (§8.3, mondo: "it makes no sense for all wells to lead to the same room"): each link's `b`
    end is a free end under its own place. The cellar's → the cavern GALLERY's west end (x −24.5, z 10.5, the
    old well room's light shaft and a paper sheet moved there); the garden's → a new CISTERN room at the
    running tunnels' west end (`gen.rooms` row); Camelot's → an open alcove in the dungeon under the bailey
    (`gen.open`), the plan's "Merlin's undercroft"; the skinwalker estate's → the cavern MOUTH; Göbekli's → a
    new cistern chamber on the ley line. THE WELL ROOM (`site_prebuilt_hollow_earth_shaft`) is deleted with
    its door, its Δ builder, its find row; its tape SIX ROPES is innersun's second tape, and a save that took
    it under the old id still counts it (`HQ_FIND_MOVED` in `hqFindLegacyId`). The gallery's `mouth` door
    went first in its list (the floor plan carves from the first door; the vent's tier door first left the
    vent unreachable). Tests: hq-cave.test.js (a different bottom per well, none a wells-only room, landings
    level and clear, the chambers), hq-world.test.js re-pinned.
  - **THE WOODS — DEVIATION: JOINED PARTS, not one 160 × 140 field** (§8.5). The Phase 2 precedent: the
    clearing, the trail, the stair, the redwoods, the pasture, the Grove, the skinwalker fields and Shasta's
    slopes are parts of zone `woods` in their own frames, their doors replaced by `trail` joins (seven), the
    ritual absorbed by the clearing (it stays behind its draught). Every id, find, tape, native and save key
    stays as it was, so no aliases are needed and no find moved; the compile stays per part. The clearing's
    trail door moved west (x −7.875 → −14) so the trail and the stair frames do not overlap. THE HAUNTED
    GROUNDS are their own zone (`haunted`: the grounds, the hall as a door join, and a planned 60 m trailhead
    to the clearing — a border, the frame for a later part); the lodge and Dead Man's cave stay doors (their
    doors are secret or down). The estate is Phase 5's (the skinwalker FIELDS are joined; the estate house
    keeps its door).
  - **THE STITCH, grown**: `hqStageNeighbours` now replaces a room's own plain doors to a staged neighbour (not
    only links; never a secret, hidden or portal door, never a door-join's span); a join's own `stitchM` (the
    stair's flight keeps its steps with 3 m); `hqTerrainCompile` opens a MOUTH through the bank at every stitched (not in a city plan, whose streets already run out)
    span (`gen.mouths`: `_hqTGenerate` forced everything past the wall solid, which left a 1.4 m bank at each
    seam); `hqTerrainDoorY` finds the room's id on a cache miss (it had compiled under the label: no stitch,
    another seed). three-renderer.js: a joined door with no way draws a TRAIL POST (a post, an arrow board, the
    door's label) in place of the door (`_hqBuildTrailPost`), and `_hqPlantTreeline` keeps its trees off a
    staged neighbour's ground.
  - **THE BASEMENT — DEVIATION: DOOR JOINS, not one 40 × 30 room** (§8.4; the medwing precedent): zone
    `basement` (ground `hq`, y −4): the services hall, the kitchen, the cold room, the laundry, the dock,
    corridors A and B, the boiler, the server room, the room at the end — nine door joins. The secret doors
    (the cold room's, the end room's to the dungeon and H-Wing), the draughts and the ways up stay doors. The
    crawlspace stays a crawl.
  - **NOT DONE — THE BOARD ROOMS** (§8.4's 38): kept. `hqSiteEntry` already sends every walker past them, so a
    player sees no change from deleting them, while the delete churns every find, tape, Δ builder and save key
    on 38 ids. The row's `hq-woods.test.js` rewrite is likewise moot (the woods kept their ids); `hq-floors`
    keeps its pins (no room merged).
  - **THE NIGHT LOCK at a seam**: the Grove and the skinwalker fields are locked night places (Phase 3) and now
    border day parts on the stage; the crossing blends the sky over 2 s. mondo's ruling on the lock list still
    stands open.
  - Test: `hq-west.test.js` (the world valid and staged; the trail doors coincide on the ground with sills at
    the join's y; the trail post; the mouths and the stair's `stitchM`; `heavy`: the grounds meet level within
    0.35 m across ±3 m of every seam and every door of each woods part is reachable; the basement's joins).
    `hq-stage.test.js` (four zones), `hq-world-map.test.js` (the ritual absorbed) re-pinned. Not walked by a
    person.
- 2026-09-27 — **THE CLEANUP** (thread "Open world cleanup and Phase 5"; zip `open-world/ENTROPY_WARS_OPEN_WORLD_FIXES.zip`,
  token `20260927-open-world-06-cors`; data.js, three-renderer.js, map.js to R2, data.js + index.html to Render):
  - mondo: "I do not care about the tapes or the finds ... I also do not care about the board rooms at all. Those
    are dead code, please delete ... Grove and skinwalker dont need to have fixed night."
  - **THE BOARD ROOMS DELETED** (§8.4): the generator, `hqSiteRoom`, the board info, the prop stands, the
    fluids, the moat, the dressing, the planet ground, the crossing console, `_hqEncounterBoard`. `site_<mapId>`
    is an alias only: `hqSiteEntry` / `hqSiteEntryOf` / `hqAreaRoomOf` land on the entry part, and the bay's way
    back is `hqSiteEgressDoor(mapId)`. map.js `_hqGoRoom` resolves the alias (THE WORLD's GO buttons). The
    tape/find legacy maps (`HQ_FIND_MOVED`, `hqTapeLegacyId`, `hqFindLegacyId`) and hq-finds.test.js are gone.
  - **THE CLOCK**: the Grove and the skinwalker fields ride the clock (off `HQ_WORLD_CLOCK.lock`, day looks added).
  - **THE TESTS**: `npm run test:end` (test-end.js) is the end-of-session check; ~45 test files re-pinned from
    the boards to the entry parts (84 reds → 0 on the fast suite). The heavy complex-count pins were lowered but
    not run.
- 2026-09-27 — **PHASE 5 SHIPPED: THE SOUTH** (same thread; zip `open-world/ENTROPY_WARS_OPEN_WORLD_5.zip`, token
  `20260927-open-world-07-cors`; data.js + three-renderer.js to R2, data.js + index.html to Render):
  - **THE HIGHWAY** (zone `highway`): two new BUILT parts (family E, no `gen`), 80 × 210 each on flat desert —
    `site_prebuilt_strip_highway` (DISASTER CITY · THE HIGHWAY: the last diner with its roof, the loading dock
    tier, the rest stop's kickers and rail) and `site_prebuilt_area51_highway` (THE DESERT MILES: the gas canopy
    5 m up, the kiosk, the plinth, the crash dip). Painted lines (`marks`), traffic, npcs. Road joins x −8…8:
    the Strip's south edge (its bay door moved to x −22, a street runs out at x 0) ⇄ the Strip end ⇄ the desert
    miles, and a border to the gate.
  - **THE GATE** (zone `desert`, `site_prebuilt_area51_gate`, 60 × 40, BUILT): the fence, the guard post with a
    roof, the barrier, the watchtower (a 4.5 m block, its stair from inside the fence). A road join onto the
    flight line's north edge (the flight line gains the gate road and three `open` discs in its plan).
  - **AREA 51 — DOOR JOINS**: flight line ⇄ hangar 18 ⇄ the white rooms at the doors they already had. The yard
    gate and the storm drain stay doors.
  - **THE D.U.M.B. — DEVIATION: DOOR JOINS, not corridor joins** (the medwing / basement precedent): zone `dumb`,
    six parts round sub-level 7 at y −20; the war room and the bunker stand at their gantry doors' sills (3 m and
    2.4 m up). Four hub doors shifted 2 m along their walls so the doors face. The dream lab's service door
    stays a door. **THE BUNKER NOT REBUILT** (§8.1 row stays open).
  - `hqWorldGraph` walks a staged edge join as an edge (`door: null`, `join: kind`): the highway has no doors;
    the LAND map draws it as a way.
  - Test: `hq-south.test.js` (the world valid and staged; the road chain's spans; the BUILT road; the seven door
    joins 0.2 m apart and facing, the raised sills; `heavy`: the walker end to end in each road part, into the
    diner, the kiosk, the guard post, up the tower, the Strip's bay door and the flight line's hangar door to
    their road joins). Re-pinned: hq-stage, hq-world-map, hq-area51, hq-urban, disaster-city-3. Not walked by a
    person.
- 2026-09-27 — **PHASE 5 FOLLOW-UP** (zip `open-world/ENTROPY_WARS_OPEN_WORLD_5B.zip`, token `20260927-open-world-08-cors`):
  the three new parts get their area Δ boards (`_MF_AREA_DELTA_BUILDERS`: the Strip end, the desert miles, the
  gate), and LAST GAS's pumps are vending machines (a utility box is a board / horizon piece). `npm test` 0 fails.
- 2026-09-27 — **THE FLOATING GRASS + THE REPO SYNC** (thread "Woods grass, CI, then Phase 6"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_9.zip`, token `20260927-open-world-09-cors`; data.js + three-renderer.js + map.js
  to R2, data.js + index.html to Render, tests + docs to the repo).
  - mondo: "the woods stitching areas leaves this grass floating in the air, it goes away when i cross into the next
    area but comes back right as soon as im in the other area." The cause: a part's OUTER GROUND (`_hqBuildOuterGround`,
    the roll + the +2.4 m swell 22 m out) was cut only where its JOINED neighbours lie. The trail and the stair touch
    without a join and both stand beside the clearing, so each one's apron ran through the other's field (and the
    pasture's / redwoods' through the trail's): the crest of the swell showed as a long strip of grass in the air. Crossing
    took the other part off the stage (gone), and the part just left then showed its own apron through a new neighbour.
    The same fault stood between the Strip, Downtown and the Strip end of the highway.
  - The fix: data.js `hqStageNearbyParts` (every staged part that can share a stage with this one: its neighbours and
    theirs, within 64 m), `hqStageNearerParts` / `hqStageNearerKey` (the parts whose box is nearer than this part's own).
    The outer ground is cut into one side mesh per SET of nearer parts and a side hides while ANY of them is on the stage
    (`_ew_hqOuterSideIds`), so the nearest DRAWN part always owns the ground; the treeline and the field's metre past the
    shell stand down the same way. Measured offline over the real compiled fields: from the clearing 1112 apron quads stood
    above another drawn part's ground, now 17 (all in the 1 m seam band where two thicket banks meet); the Strip 1035 → 0,
    Downtown 61 → 0, the flight line 81 → 25 (the gate's dropped overrun: false positives), the Grove 163 → 5. The headless
    stage in the clearing draws exactly the sides the offline model predicts (9 drawn of 74). Test: hq-west.test.js
    "THE FLOATING GRASS".
  - **THE RED CI**: main had the spell library 11 data.js (built on 5B) but the FIXES zip's files had gone into
    docs/notes/ and zips 5 / 5B's tests and scripts never reached the root, so 73 old tests ran against the new data.js.
    This zip carries every root file those zips changed; `npm test` on the rebuilt tree: 0 fails.
- 2026-09-27 — **PHASE 6 SHIPPED: THE NORTH** (thread "Woods grass, CI, then Phase 6"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_10.zip`, token `20260927-open-world-10-cors`; only the files changed since zip 9: data.js +
  three-renderer.js to R2, data.js + index.html to Render, tests + docs to the repo root, areas-complexes.md to docs/notes).
  - **THE CROWN'S ROAD** (`site_prebuilt_camelot_road`, 60 × 160, zone `kingdom`): Camelot's ENTRY part now (the
    portcullis = the bay door at its south end; `siteRooms` and HQ_AREA_MARKERS moved to it). A stone road north through
    an avenue, a wadeable river under a stone bridge, the wayside shrine on its plinth, the knights' camp. A border joins
    the grounds' north edge; a road join (x −10…10) walks into the ward.
  - **THE WARD REBUILT BUILT** (BUILT_ARCHITECTURE_PLAN §5 item 4; 140 × 120, no `gen`, noise 0). New data.js helpers:
    `hqRoundBlock` (a solid drum of mitred wedges), `hqCastleTower` (a HOLLOW round tower: a drum with a doorway, a
    spiral stair round a newel to a deck flush with the wall-walk where the curtain meets it, the merlons),
    `hqCastleCrown` (a crenellated ring), `hqCurtainWall` (a wall-walk block with battlements on its outer face, trimmed
    clear of the towers). The moat (deep water, a U), the drawbridge (a bridge 0.3 m over it), the curtain walked all
    round at 6 m (up two rampart stairs and three towers' stairs), the gatehouse (two solid drums, the passage roofed by
    its deck), the postern walk over the north gap, the lists with their stand and tilt, the knoll, the well, the
    orchard, the track outside the moat. The hall's and the keep's doors are DOOR JOINS on its north wall (the keep's
    hall door moved z 6 → 2 so the three doors face); the bay door left the ward.
  - **THE MOUNTAIN** (zone `mountain`, hub the foothills): `site_prebuilt_olympus_foothills` (140 × 120, a slope 0 → 25 m,
    the meadow bench and its tarn, the trail) and `site_prebuilt_olympus_switchbacks` (100 × 120, five ledges 7 m apart
    up the face to 35 m, a leg of the trail up each, five ropes on the east as the short way), then the summit at 60 m
    (its bay moved to x 20, off the trail join). Trail joins x −5…5 at 25 m and 60 m; a border from the ward's postern
    (ward x 25…33) onto the foothills. `hqMountainShell` + the `mountain` look (MOUNT OLYMPUS, a day sky).
  - **ENGINE**: (1) THE PARTS BESIDE — `hqStageNeighbours` adds the parts DOOR-joined to an EDGE-joined neighbour
    (`spans: []`, `beside: true`, `via`), so the hall and the keep stand whole behind the ward's wall seen from the road
    and the foothills (and the hangar from Area 51's gate); `hqStageWhere` never crosses into a part with no span.
    (2) THE ROOF — a closed box room that is a staged part gets an up-facing roof slab over its walls (`shell.roof` /
    `roofColor`, tagged `ceil` so a battle's look from above drops it): the hall and the keep stood open to the sky from
    the wall-walk. (3) THE OUTER SLOPE — `terrain.outer.keep` (how much of the edge height the land past the field keeps,
    default 0.35) and `outer.lift` (metres it rises or falls over the first 30 m), so a mountainside runs on past its
    shell and the summit's shoulders fall away.
  - Δ boards for the road, the ward (now a non-entry part), the foothills and the switchbacks.
  - **The walk is 0 → 65 m, not the row's 70 m**: the summit's terrace tops out at 5 m over its 60 m frame; its 6.6 m
    spire is the door gun's tape (THE SPIRE), kept. The proof (`hq-mountain.test.js`, `heavy`): the crown road's south
    end → the ward → the postern → the foothills → the switchbacks by the TRAIL ALONE (the ropes removed) → the summit,
    each part solved and chained at its join.
  - Tests: `hq-mountain.test.js` (new); re-pinned hq-camelot (six parts, the road the entry, the ward BUILT: the
    wall-walk, the towers' decks, the drawbridge, the lists; light cap: two bailey torches came out), hq-clock (Olympus
    at its frame's bearing, NNE of the Strip), hq-joins (the ward is stitched now), hq-ranch (the portcullis plate reads
    the road), hq-stage (the zones), hq-world-map. check-terrain: all seven north rooms, every door reached, no traps.
    Not walked by a person.
- 2026-09-27 — **PHASE 7 SHIPPED: THE COAST** (thread "Open world plan, Phase 7 coast"; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_11.zip`, token `20260927-open-world-11-cors`; only the files changed since zip 10: data.js +
  three-renderer.js to R2, data.js + index.html to Render, tests + the plan to the repo root, areas-complexes.md to docs/notes).
  - **THE HARBOUR** (`site_prebuilt_downtown_harbour`, Downtown's part `harbour`, zone `coast`, 300 × 300 at res 1.0, the
    sea at −0.4 over a −6 floor): the planned `harbour_sea` built. A `shore` border joins Downtown's south side
    (stitchM 2: the quay stands as a wall over the water). The avenue runs on as THE LONG PIER (Downtown x 0 = harbour
    x −38) to a T-head; THE WATER STEPS are the way out of the water; the slipway; THE BREAKWATER (a ridge) and its
    lighthouse on the mole's head; four channel buoys; the harbour's own skiff moored at the T-head; two people. Its Δ board.
    Downtown's bay door moved to its east wall (z 64) and the mall's main entrance to its west wall (z 30); the quay's
    open rect runs the south edge.
  - **THE ISLAND JOIN** (`kind: 'island'`, data.js): a part whose frame stands `on` a sea part, INSIDE its rectangle.
    `hqStageNeighbours`: from the sea the island is `inside` (no span); from the island the sea is the `host` on four full
    sides (spans of kind `island`). `hqStageWhere` crosses INTO an island when the feet are `crossHys` inside its box, and
    out past any edge onto the host. The host's floor sinks under an island (`hqTerrainIslandSinks`,
    `HQ_WORLD_RULES.islandSink`); a join with `y` stitches the island's four edges to the host's floor (the cay: −6).
    `hqWorldValidate`: the host has an open sea, the island its own sea at the host's height (±0.05). The compile's
    `info.seaExits` (the deep cells at an island's box edge) seed the return search, so a hull is never given rescue ramps.
  - **THE CAY** (the open sea, 150 × 160 now, frame y −0.4) and **THE DUTCHMAN** (`site_prebuilt_revenge_deck`, frame
    y 2.2, her own sea −2.6 over a −8.2 floor, the hull a plateau over her box) stand on it. The cay's bay door (the yacht's
    cabin door) is a FREE door on its beach. The Dutchman is boarded from the skiff only (step off alongside); a swimmer
    cannot climb her side. No island stands beside another (the sea's fog closes first).
  - **ENGINE (three-renderer.js)**: `_hqStageOwner` / `_hqSeaGroundAt` — the swimmer's, the hull's and the sub's ground is
    the part that owns the point (an island in this sea, or past the edge the drawn neighbour); `_hqSwimFree` and
    `_hqHullFree` ask that part in its own metres and pass the room's edge wherever a joined span opens it. The feet, the
    air and the boom over an island ask the island (`_hqStageIslandAt`). THE CROSSING lets the swimmer and the helm
    through (aboard, it waits for the part to be drawn); THE SWAP carries the vehicle (its record to the new part's
    moorings, its hull into the new part's props, re-anchored), the swimmer's way on, and the sea's look (`_hqSeaDisarm`:
    the dry fog and the sky back, the rays / snow / bubbles down; `_hqSeaArm` for the new part); the blend and the clock
    ease the DRY fog while the camera is under (`_hqDryFog`). An island's sea sheet is an outer side keyed on its host
    (hidden while the host is drawn: one sheet, no z-fight).
  - Tests: `hq-coast.test.js` (new: the rows, the island neighbours and the crossing rule, the ground, the quay, and in a
    vm the SKIFF sailing harbour → cay → harbour across both edges, alongside the Dutchman (no sailing into her hull, no
    climbing it, stepping off onto her deck and crossing aboard), the swimmer off the cay onto the harbour, the source
    lines); re-pinned hq-deep (the free bay door; the entries test no longer reads the deleted board rooms), hq-city (the
    mall door), hq-urban (the harbour part), hq-stage (the zones). check-terrain: the harbour, the cay, the Dutchman and
    Downtown, every door reached, no traps. Not walked by a person.
- 2026-09-27 — **PHASE 8 SKIPPED** (mondo, thread "skip Phase 8": "let's skip phase 8 of the open world plan. continue"). The
  encounter field stays 8 × 8 everywhere; §5.6 and fork 9 are kept as the design, not scheduled.
- 2026-09-27 — **PHASE 9 SHIPPED: THE ASSETS** (same thread; zip `open-world/ENTROPY_WARS_OPEN_WORLD_12.zip`, token
  `20260927-open-world-12-cors`, a delta over zip 11).
  - **`optimize-assets.js`** (`npm run optimize -- <dir>`, repo-only; its deps are installed `--no-save`, never in
    package.json): per GLB, dedup + prune + resample, textures to WebP (EXT_texture_webp) capped at `--size` (default
    **2048**, so every Meshy sheet keeps its size: the look doesn't change), `reorder` + EXT_meshopt_compression on the
    FLOAT attributes. Writes `<name>.opt.glb` beside the original (or under `--out`), skips one that isn't 5 % smaller.
    `--check` parses every result with three r128's own GLTFLoader + MeshoptDecoder and compares meshes, skins, bones,
    clips, tracks and the CPU-skinned bounds with the original. Measured on four repo files: a Meshy vault door 5.0 →
    0.52 MB, the coffee door 1.6 → 0.27, MAL2 (clips only) 0.85 → 0.22, the male base rig 0.47 → 0.26 (7.9 → 1.3 MB).
    **Deviations**: NO quantization (three r128's `BufferAttribute.getX` / `fromBufferAttribute` read a normalized-int
    attribute raw, so a quantized POSITION or skin weight breaks raycasts, `computeBoundingBox` and the CPU-skinned
    bounds the renderer scales rigs by: `gltf-transform optimize` and its `meshopt()` both quantize, so the tool builds
    its own pipeline); no instancing (r128 has no EXT_mesh_gpu_instancing), no simplify (Phase 10's LOD), no
    join/flatten (the retarget finds bones by name). KTX2 is not wired: r128 ships its KTX2Loader only as a module.
  - **`manifest-assets.js`** (`npm run manifest -- <bucket mirror> [--prefix Assets/] [--merge]`): writes
    `ASSET_MANIFEST.json` = `{ v, made, base, files: { "<bucket path>": [bytes, sha12] } }`. **Deviation**: no `kind`
    and no `rooms` in it; the game reads a room's files from data.js's rows + THE FILE BOOK, as THE WARM does.
  - **THE SWAP BY MANIFEST** (three-renderer.js, THE ASSET STORE): **deviation from §6.1**, no URL in sprites.js /
    data.js / the renderer is renamed. `_asResolve` loads `<name>.opt.glb` wherever the manifest lists it, the
    decoder is on the page and `window.EW_NO_OPT_ASSETS` is off; a sibling that fails falls back to the original,
    and three failures in a page turn siblings off. `_asWireMeshopt` wraps `THREE.GLTFLoader` so every loader (the
    VFX file's and anim-sheets' too) gets `MeshoptDecoder`; index.html loads r128's own `meshopt_decoder.js` after
    GLTFLoader.js and preloads the manifest with the `?v=` token (deploy.js ships it like a script).
  - **THE HASH**: a file listed in the manifest is fetched as `<url>?h=<sha>` (R2 ignores the query; the edge caches
    by it), and a store row remembers the sha it was stored under, so a model or sheet replaced IN PLACE on R2
    reaches the player on the next manifest + deploy (the old "rename it to cache-bust" rule, CLAUDE.md RULE #1b).
    The manifest's bytes stand in for a missing content-length (the 0-byte gap).
  - **THE CAP BY QUOTA**: `persist()` at open, then `persisted()` + `estimate()`: a persistent store may hold
    min(4 GB, 60 % of the quota), a best-effort one keeps 1.5 GB. `_ewAssetStore.stats()` reports persisted /
    quota / usage / manifest / optLoads / optFalls / meshopt.
  - **DOWNLOAD THIS PLACE** (`hq.warmZone(zoneId)`, `hq.zoneState`, `hq.zoneFiles`): every room of the zone you stand
    in (its parts and the rooms they absorb): the rows' models, the book's files, the shell sheets, onto the disk,
    two at a time on the background lane, a phone too (the player asked). The settings sheet (main menu and pause)
    grows **THE WORLD ON DISK**: "WORLD ON DISK: 1.9 GB of 4 GB · persistent", CLEAR, and in the walk the
    button with a live "N of M files" line. `_hqWarmRoom` now reads the same `_hqRoomFiles` list.
  - **Not in Phase 9**: the load card's exact "N of M" from the manifest (the gate still counts what the build asks
    for); the `rooms` table in the manifest. mondo's steps to switch the compression on are in the zip 12 reply.
  - Tests: `asset-store.test.js` (the resolve, the hash and the re-fetch, the fallback, the loader wrap, the cap,
    DOWNLOAD THIS PLACE in a vm, the tools); `mobile-performance.test.js` unchanged and green. Checked in Chromium:
    a meshopt + WebP door and rig load through the wrapped r128 loader.
- 2026-09-27 — **PHASE 10 SHIPPED: THE LOD LEVELS, THE NEAR FIRST, THE FAR SHELLS** (same thread; zip
  `open-world/ENTROPY_WARS_OPEN_WORLD_13.zip`, token `20260927-open-world-13-cors`, a delta over zip 12).
  - **THE LOD LEVELS** (`optimize-assets.js --lod`): every static GLB (no skin, no clips, no morphs) of ≥ 3000 tris
    also writes `<name>.lod1.glb` (~25 %) and `<name>.lod2.glb` (~6 %) with meshoptimizer's `simplify` (weld first,
    textures dropped: a level is geometry only and draws with the full file's materials, so it costs no texture
    memory). A level that isn't 30 % smaller than the one before is skipped; `--check` compares mesh names, order and
    attributes with the original. Measured: a Meshy door frame 6592 → 1690 → 636 tris. `manifest-assets.js` counts
    them apart (`lod`). In the game (three-renderer.js THE LOD LEVELS): a prop whose levels the manifest lists loads
    them on the background lane after the full file, pairs meshes by order + name + attributes, and swaps the
    geometry by **screen size** (`HQ_STAGE_RULES.lodScreen [0.12, 0.04]`, hysteresis `lodHys`), never coarser than
    the levels that have landed. An instanced batch takes the level of its nearest copy. `hq.lod()` reports it;
    `window.EW_NO_LOD` turns it off.
  - **Deviations**: (1) **no impostors**: the fogs close at ~150 m and LOD2 at 6 % already carries a far prop, so a
    prop smaller than `lodCull` (0.2 % of the screen) is simply culled (layer 0 off) instead of drawn as a card;
    (2) levels switch by screen size, not by fixed metres, so a big prop keeps its detail further out.
  - **THE NEAR FIRST** (the model queue): a queued file remembers where the scene will stand it (`_mqSpots`, the
    groups `_miscModelInstance` placed), and inside a lane the queue starts the file nearest the walker first
    (re-read every `mqDistMs` 250 ms; the neighbour parts are read through their `rel`). Priority lanes still win
    (the rig, then the scene, then the warm). Phones' one-at-a-time queue sorts the same way. `EW_NO_NEAR_FIRST` off.
  - **THE FAR SHELLS** (§5.4; data.js `hqFarParts` / `hqFarShell`, renderer `_hqFarTick`): every open-sky part of the
    same ground within `HQ_WORLD_RULES.far` of the walker's part that is NOT drawn gets one low mesh built from its
    compiled terrain (a ground grid coloured floor/cliff by slope, a skirt down past its lowest point, the sea, the
    solid tops, and walls ≥ 1.5 m under a 20k-tri per-part cap, 90k in all, 12 parts at most). A part not compiled
    yet is asked from the survey worker (`farWarm`). The shells draw in a thinner fog (`farHaze` 0.3 of the density,
    capped at `farHazeMax`), so the next ridge reads through the haze; a shell hides when its part is drawn or the
    walker is within `farMinM` 24 m of it, and the camera's far plane grows to reach the furthest shell.
    **Deviations**: (3) shells cover the whole ground within `far`, not only the zone; (4) the weenies (the sky
    landmarks) stay, since they are the Phase 3 look mondo approved. `EW_HQ_NO_FAR` off; `hq.far()` reports.
  - Measured in Chromium from the foothills: 12 of 12 parts built, 11 shown, 32,782 tris, the far plane at 622 m; the
    switchbacks' ridges read through the haze.
  - **mondo's steps to switch the levels on**: `npm run optimize -- <bucket mirror folder> --lod --check`, upload
    the new `.lodN.glb` files beside their originals, `npm run manifest -- <bucket mirror>`, then `npm run deploy`.
    Until the manifest lists levels, props draw as before (the far shells and the near first need nothing).
  - Tests: `hq-lod.test.js` (new: the rules, the shells, the far tick in a vm with real three, the level pick and
    pairing, the near-first order, the tool); `asset-store.test.js` (simplify now lives only in `lodOne`);
    `mobile-performance.test.js` (its queue harness gains the near-first helpers).
- 2026-09-27 — **PHASE 11 SHIPPED: THE SMOOTH ATTACH** (same thread; zip `open-world/ENTROPY_WARS_OPEN_WORLD_14.zip`,
  token `20260927-open-world-14-cors`, a delta over zip 13; three-renderer.js only on R2).
  - **THE SLICE** (`buildMs`, already 6 in `HQ_STAGE_RULES`): `_hqBuildTerrain`, `_hqBuildOuterGround` and
    `_hqPlaceProps` are generators inside. The global `_hqSliceAsk` asks a builder for its iterator; otherwise it
    drains itself, so every other caller (the entry, the tests) is unchanged. They yield at `_hqSliceDue()` checks:
    every field row, between sections, in the wall / plan-wall / tree / thicket / prop loops and before each city
    builder. `_hqStageBuildSlice` runs units until the frame's budget is spent and keeps `E.slice` (frames, units,
    the longest unit, the longest frame, frames over 1.5 × budget); `hq.stage()` shows it per part.
  - **THE WARM-UP** (`renderer.compile` before attach): a built part waits in `_hqWarmRun` while its materials
    compile under the lights it will be drawn with (a stand-in scene: the scene's lamp pick `_hqStagePick` + the
    part), one object at a time under `HQ_STAGE_RULES.compileMs` (default 8 ms), and its sheets upload through
    `renderer.initTexture`. If attaching changes the lamp count, every material in the scene would recompile, so
    the warm-up then compiles the WHOLE scene under the new lights first ("the lights changed").
  - **THE STATIC BATCH** (§5.5): 1.5 s after a part attaches and stops moving, its static shell meshes (no skin,
    no morphs, not instanced, not transparent-sorted) merge per material CONTENT (Downtown's materials are almost all
    unique objects of a few looks) and per 32 m tile, sliced at 3 ms a frame. The originals stay in the graph: their
    `visible` reads false only inside `renderer.render` (`_hqBatchDraw`), so raycasts, the walker and every script see
    them as before. A write to an ancestor's `visible`, a moved piece, a changed material or geometry, or a
    re-parent (a 500 ms watchdog) breaks the batch it is in. The batch drops on hand-over, leave and dispose.
    `hq.batch()` reports; `window.EW_HQ_NO_BATCH` off.
  - **THE BITMAPS** (`ImageBitmapLoader`-style): in Chromium, the walk's sheets decode through
    `createImageBitmap(blob, {imageOrientation, premultiplyAlpha, colorSpaceConversion: 'none'})` off the main
    thread, then fall back to `<img>` on any failure. `window.EW_NO_BITMAPS` off.
  - **Deviations**: (1) the test is a new `hq-attach.test.js` rather than growing `hq-stage.test.js`; (2) a few
    single units are still longer than the budget (the field's normals and tiles, the stands' merge, the tabletop
    pass after the props), because each is one three call or one merge; they now land spread over the build instead
    of in one frame.
  - Measured headless on Downtown (1-pixel stand-in sheets, swiftshader, so times are inflated):
    Downtown's draw calls 1785 → 1229 with the batch
    (457 batches of 1559 pieces, none broken). The three neighbours: the strip built in 35 frames (longest 18.9 ms)
    and warmed 597 materials in 4 frames; the harbour in 99 frames (longest 53 ms, was 104 before the outer ground
    was sliced) and warmed 82; the stadium in 56 frames (longest ~50 ms, the stands' merge) and, because it changed
    the lamp count, warmed the whole scene: 2878 materials + 73 sheets over 39 frames. Before this phase a part's
    whole terrain was one step in one frame, and so were all its props.
  - Tests: `hq-attach.test.js` (new: the slice on a fake clock, the builders' pins, the warm-up on real three with a
    fake renderer, the merge and its draw/raycast rules, the hand-backs, the bitmaps); `hq-stage.test.js` /
    `hq-coast.test.js` extract the new helpers; `hq-clock.test.js` fixed (two older pins).
- 2026-09-28 — **Phase 12 DONE as WORLD_GEOGRAPHY_PLAN.md G1** (thread "World geography", zip
  `open-world/geography/ENTROPY_WARS_WORLD_GEOGRAPHY_1.zip`, token `20260928-geography-01-cors`, built on spell
  library zip 12's three-renderer.js / index.html).
  - THE PORTALS (`_hqCull*`; "portal" was taken by THE DOOR GUN's `_hqPortal*`): a neighbour whose every span is a door
    span (not an island, a host, a room beside) is hidden (`partRoot.visible = false`, still built, attached, ticked) while
    every door toward it is shut or off screen. A door is shut when its leaf has landed (a mesh under `rec.leafG`), rests
    at 0, is no see-through leaf (portcullis, bars, grille, glass …) and the walker is beyond its swing + 0.75 m. "Off
    screen" = the doorway box (the recess through the wall) wholly behind one frustum plane. Shown rooms pass the test on
    through their own doors (a chain). The rule is off (all drawn) unless the current part is a closed box with the eye
    inside it, every other part on the stage is a closed box, and there is no mirror; a part with a non-point or a
    shadow-casting light is never hidden. THE LIGHT COUNT: three keys programs on the point-light count, so
    `_hqStagePick` still counts a hidden part's lamps and returns `pad`; `_hqStageLamps` lights that many dark pad lamps
    (`hq_cull_pads`, intensity 0) and the warm-up compiles with them — a flip never recompiles. Resets: the swap, the
    detach, the leave, the switch `window.EW_NO_PORTALS`. `ThreeRenderer.hq.cull()`.
  - THE MEMORY BUDGET (`_mm*`): each `_miscModelCache` entry carries `at` (load, every hit) and a GPU estimate
    (attributes + index + LOD levels + sheets × 4/3 with mips). Every 4 s in the walk: over `HQ_STAGE_RULES.heapMB`
    (700; 320 on EW_PERF_LOW; `window.EW_MEM_MB` overrides) the idle (`cacheIdleMs` 120 s) entries nothing draws are
    dropped oldest first to 85 %, 6 a sweep, disposing geometries, levels, materials, `_hqPropMatCache` conversions and
    cut-out depth materials. Never dropped: loading, failed, and the spells' shared files (`_ewOneFile`). DEVIATION: the
    unit rigs (`_unitGlbCache`) are counted, never dropped (their clips are retargeted per rig). Not built: §5.2's "ring
    shrinks to one hop over heapMB" (the eviction covers the growth). Switch `window.EW_NO_MEM_BUDGET`; `hq.mem()`,
    `perf().mem`, and the readout's `· MEM <used>/<budget> MB`.
  - Tests: `hq-joins.test.js` (the candidate rule on the medical wing / Downtown / the harbour, the frustum test, the rule's
    truth table, the shut door, the pads keep the count, the wiring); `asset-store.test.js` (the estimate, the pick, the
    drop, the budget line, the wiring). Not measured in a browser (no playtest asked).
