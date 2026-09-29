# EDITOR PLAN: THE WORLD, BUILDING AND DUNGEON EDITOR

Written 2026-09-29 for mondo's request of the same day (quoted in §1). This is a plan: nothing in it is
built yet. It replaces the generated geography of WORLD_GEOGRAPHY_PLAN.md with a world mondo builds by
hand, inside the game, and it retires the old voxel map editor. §7 says exactly what it keeps from the two
world plans and what it replaces. Phases append to §13.

---

## 0. THE VERDICT

The game already has a real engine for explored rooms: authored rows compile into walkable terrain,
walls, bridges, stairs and ramps; props and models sit on them; doors join rooms and swing; the land is
a streamed heightmap with water, trees, roads and a sky clock. What it does not have is a way to make
any of that except by typing rows into a 4 MB data.js or by tuning a recipe that a bake turns into
ground. Every "design the world better" round has been a plan, a generator and a test, and the result is
a world nobody drew.

The fix is **ONE EDITOR** inside the game that writes the same data the engine already reads:

- a **room** is edited as the rows the terrain compiler compiles (`wall`, `bridge`, `spiral`, `marks`,
  `rail`, props, models, doors, lights, sky), with a gizmo, a palette and an inspector instead of a text
  file;
- a **building** is rows too: walls with a texture on each face, openings, floors, stairs, roofs; a
  finished building becomes a **prefab** that can be placed again anywhere;
- the **land** stays a heightmap in the exact tile format the runtime streams today, but it is sculpted
  and painted by hand, and the editor writes the tiles itself, in the browser, so `bake-land.js` and the
  `HQ_LAND` recipe retire;
- the **world** is the table of where rooms sit (on the land, under it, in the sky) and which door leads
  where, edited on the map and in the room;
- a **dungeon** is a set of rooms stacked as levels, linked by stairs, shafts and ladders, drawn stacked on
  the map;
- everything the editor writes is one **world file** on R2 (`Assets/World/`), which the game loads over
  data.js. mondo uploads it like every other delivery. Nothing about the runtime, the walker, the fights,
  the online mirror or the stage changes for a room that came from the editor rather than from data.js.

The palette holds only what the bucket already has: the urban pack and the terrain sheets, every GLB and
OBJ the game loads, every prop, tree, fern and rock, the built pieces (the Bowl, the garage ring, the
castle towers, the curtain wall, the round block) and every sky option. Nothing is generated and no new
art is made.

---

## 1. WHAT MONDO ASKED FOR, AND WHERE THIS PLAN ANSWERS IT

> "I'm not really satisified with how the open world plan and geography plan are turning out. Instead I
> would like to make a map and building and dungeon editor. There is already a map editor in the game but
> that was for the 8x8 voxel maps which we are moving away from. Instead I want to be able to make a world
> map like the one currently in the game, I want to be able to edit where doors are and to where. I want
> to make individual areas and dungeons. I want to make my own custom buildings and shaped using textures
> from the urban pack. I want to be able to place trees and water and change terrain and make walls/borders
> and paths and different levels/maps to the same dungeon and I want access to everything that is
> currently being used on the maps like the props and glb models and any textures or shapes/ already made
> assets like the buildings you've already made. I want to be able to change elevation and what is in the
> sky and make floating platforms. Yeah, I just want to be able to build everything from scratch.
> Basically make my own engine/map editor specifically tailored for this game."

| Ask | Answer | Where |
|---|---|---|
| A world map like the one in the game | The land editor: the same heightmap, tiles and map tab, sculpted by hand; start from the current bake or from flat | §5.6, E4 |
| Edit where doors are and to where | The door tool: click a spot, pick the target room and entry from the world outliner; both ends written; plates on the door at eye level | §5.5, E2 |
| Individual areas and dungeons | A room is the unit; a dungeon is a group of rooms as levels with stair, shaft and ladder links | §4.2, §5.7, E5 |
| Custom buildings and shapes with the urban pack | The shape tools write `wall`, `bridge`, `spiral` and `rail` rows with a texture key per face; openings, floors, stairs, roofs; a group saves as a prefab | §5.3, E1 |
| Trees, water, terrain, walls/borders, paths | Scatter brush over the existing tree, fern and rock kinds; water planes and levels; terrain brushes; a border is always something drawn (wall, fence, cliff, water); paths and roads as splines | §5.4, §5.6, E2–E4 |
| Different levels/maps to the same dungeon | Levels inside one room (rows at a height, the level filter) and rooms stacked as a dungeon on the map | §5.7, E5 |
| Access to everything already used on the maps | The palette is built from the game's own registries at run time: sprites.js models, the catalogue, the urban pack, the terrain sheets, the kits | §5.2, E2 |
| The buildings already made | Parameterised kits (Bowl, ring, towers, curtain wall, round block) get forms; hard-coded rooms duplicate as room docs; any generated room can be frozen into rows and edited | §5.3, §5.8 |
| Elevation, the sky, floating platforms | Terrain brushes in rooms and on the land; the sky picker over every existing sky option and the clock; a platform is a `bridge` deck at any height, and a whole room can float as a part with a height | §5.4, §5.9, E3, E6 |
| Build everything from scratch, an engine tailored to the game | One editor over the game's own data: what it writes is what the runtime reads, so nothing is authored twice | §4, §6 |

The rules mondo has set elsewhere apply to every phase: no invented names (rooms, routes and areas are
labelled Room 1, Route 1, Area 4 until he names them); no sound work; only assets already in the bucket;
no puzzles; no grass blades; no floating room names, door plates on the door at eye level; no dev
shortcut that changes what the player sees; missing engine pieces get built.

---

## 2. WHAT EXISTS TODAY (the survey, 2026-09-29, read from the code at G8 + quick fixes)

### 2.1 The old map editor (retired by this plan)
- Entry: the main menu's MAP EDITOR button (index.html:756, `_goToMapEditor`, map.js:21916) and the HQ
  lift row ARCANE ENGINEERING (data.js:24843). It opens `_meEnterDioramaEditor` (map.js:17738), which
  sets `state.phase = 'editor'`, syncs a voxel grid into the battle state and draws it with the battle
  renderer. About 6,600 lines of map.js (`_me*`, 15345–21990), the `#mapEditorPage` DOM
  (index.html:1206 on) and the `.me-*` rules of styles-editor.css.
- What it edits: a 4–36 tile board of voxel columns (z 0–20, `ME_TERRAIN_IDS`), edge walls with
  door/window openings, objects, spawns, monuments, a procedural building stamp, tints, an env preset.
  Saves to `localStorage['ew_custom_maps']`; export is clipboard JSON; the server keeps
  `community_maps` (server.js:1573, 500 KB, 20 per player). Play Test is local versus the AI only;
  online.js has no path for a custom map, and `_meSetAndPlay` (referenced by profile.js:2842) is not
  defined anywhere.
- Why it goes: it authors the tile-voxel battle board, which the seamless field replaced for encounters
  (the fight is rasterised from the explored room, §2.4). Nothing in it edits a room, a door, a model or
  the land. Its undo (snapshot stack, `ME_MAX_UNDO` 50), its z-lock layer filter, its wall opening
  record and its palette categories are the only ideas worth carrying over.

### 2.2 The room (data.js `DOOR_HQ.rooms`, 150 authored rooms; areas generated by `hqBuildAreas`)
Every explored place is a room object. This is the schema the editor writes (full key lists in §4.2):
- `kind` box | bay | rotunda; `shell` (size, the floor/wall/dado/trim/ceiling texture keys and
  colours, `open`/`edge`, `gallery` for a second slab, `mood`, `look`, `fog`, `rig`, `sky`);
- `terrain` (a height field: `floor`/`cliff`/`path` sheets, `base`, `res`, `noise`, `slope`, optional
  `gen`, `sea`, `marks`, and `features[]` rows: `hill`, `dip`, `ridge`, `plateau`, `ramp`, `spiral`,
  `deck`, `bridge` (straight or arc), `pool`, `stream`, `wall` (with `quad`, `slopeTop`, `tier`,
  `seat`, `ghost`, `rail`, `gaps`), `rail`, `path`, `tree`, `grove`, `scatter`, `climb`);
- `doors[]` (`wall`+`x|z`, or `free` with `x,z,face`; `y` sill; `leaf`; `secret`; `way`; `label`;
  `action {room, at}`; `minClearance`/`requiresKeys`), plus `DOOR_HQ.links[]` for two-ended doors;
- `props[]` (`key`, `x`, `z`, `y`, `face`, `rot`, `wall`, `mount`, `ceil`, `level`; the catalogue
  entry (data.js:23130) carries the file, size, footprint, blocker, light);
- `counters[]`, `agents[]`, `npcSpots[]`, `onlineSpots[]`, `spawn`, `variants`, `climbs`, `stairs`.
- Compiled by `hqTerrainCompile` (data.js:45683, in a worker) into a height grid, a bridge layer,
  walls, fluids and climbs that `hqTerrainFeet` (46199) walks; drawn by `_hqEnter` (three-renderer.js:60261)
  through the sliced build, the warm-up and the static batch.
- Built pieces: `hqStandBowl`, `hqRingWalls`, `hqRingBridges`, `hqRingQuad`, `hqRoundBlock`,
  `hqCastleTower`, `hqCastleCrown`, `hqCurtainWall`, `hqGridironMarks`, `hqHelixRamp` (data.js:22429–22930):
  each takes an object and returns feature rows. The stadium, garage and Camelot are made of them.
- Movement the rows already support: step 0.62 m, jump apex about 1.46 m, drop 1.6 m, headroom 1.95 m,
  climb rows, rails to grind, ramps, swim, the skiff, the dash.

### 2.3 The world and the land
- `HQ_WORLD` (data.js:40137): `grounds`, `zones` (`land`, `under`, `underworld`, `ley`, `dumb`,
  `medwing`, `basement`), each with `parts` (`x, z, y, rot` or `place, dx, dz, dy` on the land) and
  `joins` (`door`, `island`, `road`, `shore`, `hall`, `stair`). The stage draws the current part and its
  neighbours in one scene and swaps on the crossing.
- The land: `HQ_LAND` (data.js:41065) is a recipe of coast, plateaus, bumps, ranges, peaks, rivers,
  roads, forests and 40 places. `bake-land.js` turns it into `Assets/Land/` on R2: `land.json` (vectors,
  no heights), `land-map.png`, `sea.bin` (8 m world), and 256 m tiles `tiles/t_i_j.bin` (`EWLT`: 129²
  samples at 2 m; planes height u16 at 1 cm from −200 m, material u8, forest u8, water surface u16).
  The runtime (`_hqLand*`, three-renderer.js:52941 on) streams tiles by distance, builds 64 m chunks
  at four LODs, splats the bucket's own sheets by material id, draws the far pass from sea.bin, the water
  layer, the instanced trees and the roads from land.json. Sites are levelled pads at `hqLandSiteY`.
- The map: the ATLAS tab (map.js:4886) draws land.json over land-map.png; the LAND tab draws
  `hqWorldSheet` frames; fog of map is `hqRoomsSeenRecord`.
- Live fault found during this survey (not fixed here, it is the geography thread's file): since the
  quick-fixes zip removed `HQ_LAND_RULES.flora.grass`, `_hqFloraArm` (three-renderer.js:54057) still reads
  `F.grass.fade[0]`, throws, and `_hqLandArm` catches it and sets `L.flora = null`, so the land draws no
  trees, ferns or rocks and has no trunk blockers. Present in G8's three-renderer.js.

### 2.4 The fight in a room (the seamless field, unchanged by this plan)
`hqEncounterLaunch` (data.js:47615) picks an 8 × 8 window (`hqFieldWindow`, 50236; cell 1.75 m),
`hqFieldRaster` (49938) samples the room through `hqTerrainFeet` and box covers, `hqFieldBuild` (50330)
forges a board from it, and the renderer draws the real room around the window
(`_hqBuildRoomInBattle`, three-renderer.js:58639). Any room the editor writes fights the same way.

### 2.5 Persistence and delivery
- Profile-placed things already exist as a pattern: `profile.door.hq.gunPlaced` (data.js:50880) and the
  Threshold portal pair, saved through `PS.saveProfile`.
- The bucket: `Assets/Land/`, `Assets/Sprites/terrain/` (+ `urban/`), `Assets/misc/`, `Assets/foilage/`,
  `Assets/door/`, `Assets/Models/`. Files reach players by `?v=` (scripts), `?h=<sha>` (manifest) or
  `?b=<bake id>` (land). `deploy.js --assets <dir>` uploads a folder with wrangler.
- three r128 from cdnjs with the examples folder from jsdelivr, so `TransformControls`,
  `OrbitControls` and `PointerLockControls` are available as script tags without a new R2 file.

---

## 3. THE RULES (every phase, every test)

| # | Rule |
|---|---|
| R1 | **WHAT THE EDITOR WRITES IS WHAT THE GAME READS.** A room doc is a `DOOR_HQ.rooms` object; the world doc feeds `HQ_WORLD`; the land is `EWLT` tiles. No second format, no converter, no "editor-only" field the runtime ignores except `edit` (§4.2). A doc must compile through `hqTerrainCompile`, walk through `hqTerrainFeet`, draw through `_hqEnter`, fight through `hqFieldBuild` and mirror through `_serializeState` with no special case |
| R2 | **NOTHING NEW IS DRAWN.** The palette is built from the registries at run time: the catalogue, `RACE_MODELS_3D`, the model kits, `TERRAIN_SPRITES`, `URBAN_TEXTURES`, `HQ_CLIMB_LOOKS`, the scenery rosters, the landmark kinds. The editor never ships an image, a model or a colour ramp of its own. Thumbnails are live renders of the game's models, cached in the browser |
| R3 | **NO INVISIBLE WALLS, IN THE TOOL TOO.** There is no invisible-blocker tool. A border is a `wall`, a `rail`, a cliff (`slope > 1.0` painted cliff), water or a trunk. The wall audit and the pocket solver run inside the editor on demand and their marks are drawn in the viewport |
| R4 | **NO GENERATOR IN THE LOOP.** Brushes and line tools change what is under them and nothing else; no erosion, no noise pass, no auto-layout, no random scatter without a brush stroke. A generated room (`terrain.gen`) is left as it is until mondo freezes it (§5.8), after which it is rows |
| R5 | **PLAIN LABELS.** New things are `Room N`, `Area N`, `Route N`, `Trail N`, `Bridge N`, `Level N`, `Door N`. The editor never suggests a name; the label field is empty until typed |
| R6 | **EVERY PHASE SHIPS ONE USABLE DELTA ZIP** with its test, `npm run test:end` at its end, no dev shortcut in the player's game. The editor is not the player's game: it may skip nothing the walker sees, but it may fly, hide layers and draw audits |
| R7 | **THE PLAYER'S RULES HOLD IN A DOC.** Door plates on the door at `HQ_PLATE_EYE`, '?' until visited; no floating names; the encounter window and the field rules unchanged; prop light cap `HQ_PROP_LIGHT_MAX`; the memory budget and the perf readout apply while editing |
| R8 | **ONLINE PARITY BY IDENTITY.** A match, a rejoin or a guest never receives a room doc over the socket. Both clients load the same published doc by id and sha from R2. An unpublished doc plays offline only |
| R9 | **UNDO EVERYTHING.** Every tool, brush stroke and inspector edit is one undo step; land strokes undo per touched tile. Autosave to IndexedDB every change, never to localStorage (5 MB) |
| R10 | **THE OLD EDITOR GOES WHOLE.** When E7 lands, `_me*`, `#mapEditorPage`, the `.me-*` rules and the `community_maps` JSON shape are deleted, not left beside the new one. No tapes, finds or save migration are preserved (mondo's standing rule) |

---

## 4. THE DOCUMENT (what the editor writes; data.js + the bucket)

### 4.1 THE WORLD FILE: `Assets/World/` on R2
```
Assets/World/world.json              the index (below)
Assets/World/rooms/<roomId>.json     one room object each (§4.2)
Assets/World/prefabs/<prefabId>.json one prefab each (§4.3)
Assets/Land/…                        the land, unchanged in format (§4.5)
```
`world.json`:
```
{ v: 1, id: '<sha of this file>', made: '<iso>',
  rooms:   { '<roomId>': [bytes, sha] },      // fetched as rooms/<id>.json?h=<sha>
  prefabs: { '<prefabId>': [bytes, sha] },
  retire:  ['<roomId>'],                       // data.js rooms this world removes
  zones:   { '<zoneId>': { …HQ_WORLD zone… } },// whole-zone replacement
  links:   [ …DOOR_HQ.links rows… ],
  places:  [ …HQ_LAND.places rows… ],          // the land's sites and pads
  land:    { id, cell, ext, tile, heightBase, hubY, base },   // = HQ_LAND.baked
  dungeons:{ '<dungeonId>': { label, levels: [{ room, y }], mouths: [{ room, door }] } },
  clock:   { lock: {…}, dayLook: {…} } }       // HQ_WORLD_CLOCK overrides, optional
```
**Loading.** `index.html` carries `window._EW_WORLD_ID` (deploy.js writes it from world.json's `id`
when it bumps the `?v=` token; without a world file it is empty and the game is data.js alone).
At boot, after data.js, `hqWorldDocLoad()` fetches `Assets/World/world.json?w=<id>` through `_asFetch`
(cached like the land), then every room and prefab listed, then `hqWorldDocApply(doc)`:
1. `retire` deletes those `DOOR_HQ.rooms` entries and their links;
2. each room doc replaces or adds `DOOR_HQ.rooms[id]` (a doc wins over data.js by id);
3. `zones` replace `HQ_WORLD.zones[id]` whole; `links` append; `places` replace `HQ_LAND.places`;
   `land` replaces `HQ_LAND.baked`; `dungeons` and `clock` merge;
4. `hqWorldDocRebuild()` re-runs the load-time derivations that read rooms: `hqBuildAreas`,
   `hqApplySiteEntries`, `hqLinkDoors`, `hqLandSiteFrames`, `hqWorldValidate`, the map graph
   (`hqWorldGraph`/`hqWorldRoutes`), the tape sheet drop. (Finding every derivation is E0's first job;
   they are listed in §12 as they are found.)
The HQ entry (map.js `_hqEnter`) waits on the doc with the load card. The main menu does not.
data.js stays the library: every built-in room still loads unless retired, and the editor opens any of
them. When mondo has replaced the generated world, `retire` empties data.js's outdoor rooms without a
data.js edit; deleting them from data.js is a repo cleanup for E8.

### 4.2 THE ROOM DOC (= one `DOOR_HQ.rooms` object, R1)
The keys are today's, unchanged (§2.2): `label`, `sub`, `kind`, `shell`, `terrain`, `doors`, `props`,
`counters`, `agents`, `npcSpots`, `onlineSpots`, `lines`, `spawn`, `site`, `part`, `variants`, `climbs`,
`stairs`, `quiet`. Two additions, both already tolerated by the compiler (it reads rows by `k`):
- every feature row, prop, door, light and marker gets an `id` (`'r12'`, stable across saves; the
  compiler already accepts `id` on `bridge`, `spiral`, `wall`, `climb`);
- one editor-only key `edit: { grid, snapDeg, layers: { '<name>': ['r12', …] }, hidden: [], cam: {…},
  notes: '' }`, the only key the runtime ignores (R1's one exception).
A **level** inside a room is not a key: it is the rows' `y`, and the editor's level filter shows the rows
whose `y` falls in a band. A **building** is rows in a layer. A **floating platform** is a `bridge`
(deck) or `plateau {float: true}` row at its `y`, which the compiler already walks as the bridge layer.
Row kinds the editor exposes as tools are exactly the compiler's: `wall` (with `quad`, `slopeTop`,
`tier`+`seat`, `ghost`, `rail`, `gaps`, `parapet`), `bridge` (straight, arc, `plain`, `glaze`, `rails`),
`spiral`, `ramp` (`stairs`, `kicker`), `plateau`, `deck`, `hill`, `dip`, `ridge`, `pool`, `stream`,
`path`, `rail`, `tree`, `grove`, `scatter`, `climb`, `marks` (`rect`, `line`, `ring`, `text`).
Two row kinds are new engine work (§6): `opening` and `prefab`.

### 4.3 THE PREFAB (a building or a piece, placed many times)
```
{ id, label, pivot: { x, z, y }, box: { w, d, h },
  rows: [ …feature rows… ], props: [ …prop rows… ], doors: [ …door rows with no action… ],
  lights: [ {x,z,y,color,intensity,dist} ], marks: [ … ] }
```
Placed in a room by one feature row `{ k: 'prefab', id, x, z, y, yaw, mirror }`. `hqPrefabExpand(room,
prefabs)` (data.js, pure) rotates and translates the prefab's rows about its pivot and splices them into
the room before `hqTerrainCompile`, `_hqPlaceProps` and `_hqBuildDoors` see it; nesting to depth 4;
an expanded prefab's rows carry `from: '<placementId>'` so the editor can select the placement, not
the rows. `yaw` is free (degrees); rows that only rotate in quarter turns (`plateau`, `marks.rect`)
snap to the nearest, and the inspector says so.
The kits (`hqStandBowl`, `hqRingWalls`, `hqRingBridges`, `hqRoundBlock`, `hqCastleTower`,
`hqCastleCrown`, `hqCurtainWall`, `hqGridironMarks`) are **parametric prefabs**: a row `{ k: 'kit',
fn: 'hqCastleTower', args: {…}, x, z, y, yaw }` expands by calling the function (allow-listed by
name) and shifting its rows. Editing the args re-expands. "Bake to rows" turns a kit into plain rows
for hand editing.

### 4.4 THE WORLD DOC (zones, parts, joins, dungeons)
`zones[id] = { label, ground, hub, sky, clock, parts, joins, borders }` as today. A part is
`{ x, z, y, rot }` (quarter turns, which keeps the height grids axis-aligned) or, on the land,
`{ place, dx, dz, dy, rot }`. One new flag: `float: true` (§6): no pad on the land, no island ease, no
plinth, the land is not levelled under it; the part hangs at its `y` (an island in the sky, a platform
over the sea). Joins are today's kinds. A dungeon is the `dungeons` table: its rooms are ordinary
rooms in the `under` (or their own) zone; `levels[].y` orders them on the map; `mouths` are the doors
on the land. Nothing in the runtime reads `dungeons` but the map.

### 4.5 THE LAND (sculpted, same files)
The editor holds the whole land in memory as the bake does: 2801² samples at 2 m (`Float32Array`
heights 31 MB, `Uint8Array` material and forest, `Uint16Array` water surface), plus the vector layers
that `land.json` carries today (coast, rivers, roads, bridges, lakes, places, regions, tunnels,
junctions). Export writes exactly what `bake-land.js` writes (§2.3): the tiles (`EWLT`, only tiles
whose bytes changed since the last export, so the zip stays a delta), `sea.bin` (resampled at 8 m),
`land.json`, `land-map.png` (drawn from the heights and materials the same way), and `id` = the bake's
sha rule, into `world.json.land`. The runtime's sampler, chunks, splat, far pass, water, roads and
flora need no change; `HQ_LAND` shrinks to `baked` + `places` + `sight` (both now written by the world
file), and the recipe, `bake-land.js`, `checkRules` and `land-bake.test.js` retire in E8.
Materials stay the 24 bake ids (`HQ_LAND_RULES.mats`, each a sheet + tint + detail amplitude): paint
sets the id per cell. Cliff is not painted: the runtime draws the cliff sheet where slope passes
`cliff.from` and refuses the walker past `walk.maxSlope`, so a steep brush stroke is a cliff (R3).
Forest is the forest byte (0–255) the flora sampler already reads. Water is the surface plane per cell,
which the water layer already draws as sea, river or lake, with falls where the level steps.

---

## 5. THE EDITOR (editor.js + styles-editor.css; the tools, in the order they ship)

### 5.1 The shell (E0)
- **Where it opens.** The main menu's MAP EDITOR button becomes EDITOR (index.html:756). The pause
  menu in any explored room gets EDIT THIS ROOM, which opens the editor on that room at the walker's
  spot. `?edit=<roomId>` opens straight into a room. The HQ lift row ARCANE ENGINEERING (data.js:24843)
  points at the same entry.
- **What it draws.** The room itself, through `_hqEnter` and the same builders, lights, sky and post the
  player gets, so the viewport is the game (R2, R7). On top: the gizmo, the selection outline, the grid,
  the audit marks and the pick proxies, all in an `editor` group the player's game never creates.
- **The camera.** Fly: W A S D + Q E, right mouse to look, wheel for speed, Shift for fast. Orbit the
  selection with Alt + left mouse. F frames the selection, Home goes to the spawn, G toggles the grid.
  P is PLAY HERE: the walker is dropped at the cursor and the game's own input takes over (walk, jump,
  climb, swim, dash, skate, doors, encounters all live); Esc returns to editing where the walker stands.
  This is a tool the player never has (R6).
- **The panels** (plain DOM, `.ed-*` rules replacing `.me-*` in styles-editor.css): a top bar (FILE:
  new, open, save, save as, import zip, import from R2, export zip; EDIT: undo, redo, duplicate, group,
  prefab; VIEW: layers, level band, wireframe, audits, fight window, clock hour; HELP: the key list);
  a left PALETTE with tabs (§5.2); a right INSPECTOR showing every field of the selected row with
  metres, degrees and texture pickers; an OUTLINER (world → zone → room → layer → row) that doubles as
  the door target picker; a bottom STATUS line (cursor x z y, ground height and material, tile,
  TRIS/CALLS/MEM from the perf readout, the prop light count against `HQ_PROP_LIGHT_MAX`).
- **Selection and the gizmo.** Click picks a row: every builder tags its meshes with `userData.rowId`,
  and merged or batched pieces get an invisible pick proxy per row (editor mode only, the same idea as
  `_fieldPickBuild`). `THREE.TransformControls` (three r128 examples, a script tag) moves, rotates and,
  where a row has size fields, scales. Snap: 0.25 / 0.5 / 1 / 1.75 m (the tile) and 5° / 15° / 90°.
  Box select, multi-select, Ctrl + D duplicate, ARRAY (n copies along a vector, for stands, columns,
  fences, streetlights), MIRROR on x or z, copy and paste across rooms.
- **Undo.** A command stack of 200 inverse patches on the doc; every tool, stroke and inspector edit is
  one step (R9). The redo stack clears on a new edit.
- **Saving.** Autosave to IndexedDB (`ew_editor`: projects, docs, prefabs, land tiles, thumbnails) on
  every change; SAVE AS names a project; OPEN lists them. IMPORT FROM R2 pulls the published world file
  (and the land tiles on demand) so a fresh browser starts from what is live. EXPORT writes the delivery
  zip (§5.11).
- **Reload in place.** `hq.reload(patch)` (§6): after an edit the room recompiles in the worker and
  redraws sliced, without leaving the room. A row edit recompiles the room; a brush stroke on a height
  grid re-meshes only the 32 m terrain tiles it touched; a prop or light edit touches only that object.
  Big rooms take seconds to compile (3–31 s today): the status line says COMPILING and editing continues.

### 5.2 The palette (E2; built from the registries at run time, R2)
| Tab | Built from | What it holds |
|---|---|---|
| SHAPES | the compiler's row kinds (§4.2) | wall, quad wall, tier + seat, bridge (straight / arc / plain / glazed), deck, spiral, ramp, stairs, kicker, plateau, floating platform (a `bridge` preset), hill, dip, ridge, pool, stream, path, rail, fence (a `rail` preset), pillar (a `hqRoundBlock` preset), climb (the 7 `HQ_CLIMB_LOOKS`), marks (rect, line, ring, text), opening |
| TEXTURES | `URBAN_TEXTURES` (320 names in 32 families, `-Glow` twins), `TERRAIN_SPRITES` (162), `DOOR_HQ.textures` (8), the fluid keys and `_LIQUID_STYLES` | a swatch per sheet rendered from the sheet itself, repeat metres, tint; drag onto a face or pick in the inspector |
| MODELS | `DOOR_HQ.catalogue` (180 file props, 184 procs, 41 leaves), `_MISC_GLB` (128 keys; E2 adds a catalogue row for each key that has none, measured, `base:'misc'`), `_WPN_MODELS` (29, through `_hqCatGlb`), the foliage OBJs (Tree_1–10, DeadTree_1–10; the 14 unmapped ones become `tree` kinds) | grouped by the catalogue's own fields: furniture and office, misc, vehicles, nature, architecture, structural procs (stair_step, stair_landing, riser_1–3, quarter_pipe, garage_ramp, house_stairs, concrete_pillar, t_pillar, platform_edge, track_bed, railing_1m, lap_pool, infinity_pool, fountain), sea kit, astral kit, celestial (moon, earth, jupiter, saturn, alien, star, solar), craft. Thumbnails are live renders cached in IndexedDB |
| PEOPLE | `RACE_MODELS_3D` (92 races), `DOOR_CAST_MODELS` (20) | `npcSpots` and `agents` rows with the race picker, pose, roam, patrol |
| TREES + SCATTER | the `tree` kinds, `grove`, `scatter`, `HQ_LAND_RULES.flora.kinds` | the scatter brush (§5.4, §5.6): kind mix, density, seed; on the land it paints the forest byte |
| DOORS | the 41 leaves, `DOOR_HQ.ways`, the join kinds | the door tool (§5.5) |
| LIGHTS | catalogue `light` / `glow` props, `shell.lights`, `rig`, `mood`, `fog`, `HQ_LIGHT_RULES` | masts, fluorescents, lamp props, the room's key and ambient, fog; the cap in the status line |
| SKY | `shell.sky` keys, the 14 scenery rosters + none, the 11 landmark kinds, `world` kinds (plain, cavern, void, room, planet) and the 11 rim kinds, `HQ_ROOM_LOOKS` (48), `HQ_WORLD_CLOCK` | the sky picker (§5.9) |
| KITS | `hqStandBowl`, `hqRingWalls`, `hqRingBridges`, `hqRoundBlock`, `hqCastleTower`, `hqCastleCrown`, `hqCurtainWall`, `hqGridironMarks`, `hqHelixRamp`; the 17 shell factories; the 5 `_HQ_TEX_STYLES` building styles; the 8 `_NR_BUILDING_KEYS` sprite buildings | parametric prefabs with a form each (§4.3, §5.3) |
| PREFABS | mondo's own, plus ROOM AS PREFAB from any existing room | placements |
| MARKERS | `spawn`, `counters` (the battle marker, verbs), `onlineSpots`, arena rects and seats (§5.10), reveal points and region polygons on the land (§5.6) | |

### 5.3 Buildings (E1)
- **Walls.** Click-drag a line: a `wall` row with `h`, `t`, `key`; drag its ends, or type them. Corner
  snapping joins rows. A closed loop of four is a room. `keyIn` (new, §6) gives the inside face its own
  sheet; `slopeTop` makes a pitched top; `parapet` and `rail` cap it; `tier` + `seat` make stands; `quad`
  makes any four-cornered block; `ghost` is drawn nowhere and is refused by R3 unless something drawn
  covers it (the audit says which).
- **Openings.** The OPENING tool on a wall writes one `opening` row (`{k:'opening', wall:'r12', at,
  w, h, sill, leaf?, glaze?}`); at compile it becomes the two wall pieces and the lintel, so the wall
  stays one object. A leaf makes it a door, `glaze` a window, nothing an arch.
- **Floors and roofs.** A `bridge {plain}` slab at `y` is a floor the walker stands on with headroom
  1.95 m under it (`hqTerrainBridges`), so a second storey is a slab and a stair. A roof is a slab, a
  `plateau` or `slopeTop` walls. The level band filter shows one storey at a time.
- **Stairs and ramps.** `ramp {stairs:true}` (L ≥ 2.2 h, the solver's rule), `spiral`, the stair procs,
  a kicker for the board.
- **Columns, fences, railings.** `hqRoundBlock`, `wall` quads, `rail`, `railing_1m`, `parapet`.
- **Textured blocks.** A `texbuilding` row (new, §6): footprint, storeys, one of the 5 styles, fronts;
  drawn by the city lot builder (`_hqTexBuilding`) and blocked as a solid quad. This is the quick way to
  a street of buildings without drawing every wall.
- **Prefab.** Select rows, SAVE AS PREFAB, name it (Prefab N until named), place it as often as wanted,
  in any room, at any yaw; edit the prefab once and every placement follows. The Bowl, the garage drum,
  Camelot's towers and walls are kits already; a hard-coded room (Vatican, the mall, Area 51, the ranch,
  the station, the ship, the Dutchman) is opened as a room and copied as a prefab with ROOM AS PREFAB.

### 5.4 Ground, water, levels and platforms in a room (E3)
- **The height delta.** `terrain.hmap` (new, §6): a per-room int16 grid at the terrain `res`, added
  after the feature rows. Brushes RAISE, LOWER, SMOOTH, FLATTEN (to the first click's height),
  TERRACE, RAMP (a line with a grade), CLIFF (steepen past 1.0), SET (absolute height), each with
  radius, strength and falloff. A stroke re-meshes the touched terrain tiles only. Steeper than 1.0 is a
  cliff the walker refuses and the cliff sheet draws (R3).
- **Paint.** `terrain.paint` (new, §6): a per-room u8 grid over a room palette of up to 8 sheets, drawn
  with the land's splat (`_hqLandSplatHook`) on the field mesh; `floor`/`cliff`/`path` stay the defaults
  where nothing is painted. Roads and paths inside a room are `path` rows (a spline) or paint.
- **Water.** `pool` (ellipse), `stream` (a spline with a level and a bed), `terrain.sea` (a level for the
  whole room, `under` for a drowned room), any fluid key. The walker wades and swims already.
- **Levels.** Rows have `y`; the LEVEL BAND filter (like the old editor's z-lock) shows and picks only
  rows in a band, so a stacked interior is edited one storey at a time. Nothing is stored for a level.
- **Floating platforms.** A `bridge` at any `y` (a deck with rails), a `plateau {float:true}` (ground
  with an underside), or a whole room as a part with `float:true` in its zone (§4.4), which puts an
  island in the sky over the land with its own ground, trees and buildings, reached by a door or a
  climb row. The walker refuses to walk off a drop over `HQ_DROP_MAX` (1.6 m), so a high edge holds
  like a balcony; the deck tool adds rails by default and the wall audit marks an unrailed high edge
  as an invisible wall (R3).
- **Audits in the viewport.** WALL AUDIT (R3, the same rule as wall-audit.test.js: a refused 0.5 m step
  with nothing drawn within 0.45 m) marks red posts; POCKETS (the reach solver of check-terrain.js,
  moved into data.js as `hqTerrainReach` so the test and the editor share it) marks unreachable ground
  yellow; FIGHT WINDOW draws the 8 × 8 raster at the cursor (§5.10). None gates a save.

### 5.5 Doors and the world (E2 for doors, E4 for the map)
- **The door tool.** Click a wall (a `wall:'n'|'e'|'s'|'w'` door with `x|z`) or the ground (`free`
  with `face`), pick the leaf, then pick the target in the OUTLINER: a room and one of its doors (or a
  spot). The tool writes `action {room, at}` on this side and, unless RETURN DOOR is off, the matching
  door on the far side (a `links[]` row when both rooms are docs, two door rows otherwise). `secret`,
  `hidden`, `minClearance`, `requiresKeys`, `label`, `sub`, `verb` are inspector fields. The plate is
  the runtime's (`HQ_PLATE_EYE`, '?' until visited): nothing to author (R7). A one-way passage is a
  door with RETURN DOOR off.
- **Joins.** Two rooms that should stage together get a join in the zone: `door` (the leaf swings, no
  load card), `island` on the land (a pad), `stair`, `hall`, `road`, `shore`. The tool picks the kind
  from where the two frames touch; the inspector overrides.
- **The world map (E4).** The LAND tab becomes the world editor's map: parts are dragged to set `x, z,
  y, rot` (quarter turns) or, on the land, `place, dx, dz, dy`; a room dropped on the land gets a `places`
  row (Area N, `pad`, `padY`), a part and an island join, and the land is levelled under its rectangle
  live (the bake's pad rule, now `hqLandPadStamp` in the editor; undoable); `float` parts skip the pad.
  Dangling targets, doors with no return and parts that overlap are listed by `hqWorldValidate` in
  the status line, never blocking.

### 5.6 The land (E4)
- **Start.** IMPORT FROM R2 loads the published tiles, sea.bin and land.json into memory (§4.5), so
  mondo edits the land that exists; NEW LAND gives a flat disc at sea level with the ice wall at
  `wall.r`. The land is edited in two views: the map (top-down, land-map + contours + the vector
  layers, the same drawing as the ATLAS) and the 3D view (fly over the streamed land, fed from memory
  instead of R2 through the tile source hook, §6).
- **Brushes.** RAISE, LOWER, SMOOTH, FLATTEN, TERRACE, SET, CLIFF, ROUGHEN (a hand stroke of noise,
  radius-bounded; the only noise in the editor), radius 4–400 m, strength, falloff.
- **Lines and areas.** RIDGE and VALLEY (a polyline with width and height, stamped); PLATEAU (a
  polygon at a height with an edge width); RIVER (a spline with `w0`, `w1`: carves a monotone bed,
  sets the water surface per cell, marks falls where the surface steps more than `falls.drop`);
  ROAD / LANE / TRAIL (a spline with width and grade limit: grades the ground under it within the fill
  cap, writes a deck where the gap is wider, rails where the drop is over 2 m, junctions where
  splines meet; the bake's `gradeLine` becomes data.js `hqLandGradeLine` so the runtime's road index
  reads what the editor wrote); COAST (sea level and the shoreline polygon); LAKE (a polygon at a
  level); ICE (material + the pack rule). Each stamp is one undo step over the touched tiles.
- **Paint.** MATERIAL (the 24 ids, each a sheet + tint from `HQ_LAND_RULES.mats`), FOREST (the byte;
  the flora sampler places the trees at run time), WATER LEVEL, and CLEAR.
- **Places.** From the OUTLINER, drop a room on the map (§5.5); its pad, `padY`, kind (hub, site, poi,
  dungeon, door, sea) and region are inspector fields. `hqLandSiteFrames` and the island joins follow.
- **Regions and reveals.** Region polygons labelled Area N (the map's labels, the fog-of-map region,
  and, in E6, the weather); reveal markers (a point the map calls FIRST SEEN). Neither is required.
- **Sight check.** From the cursor, draw the ground visible from here (the sketch's sight test as a
  tool). It is information, never a gate (R4: no rule test in the loop).
- **Export.** The tiles that changed, sea.bin, land.json, land-map.png and the id (§4.5) into the zip
  under `Assets/Land/`, and `world.json.land` updated. The ATLAS tab draws the result unchanged.

### 5.7 Dungeons (E5)
- **A dungeon is rooms.** One room per level (Level 1, Level 2 …), in the `under` zone with frames so
  neighbours stage together and doors join without a load card; far levels use load-card doors. The
  `dungeons` table groups them for the map, which draws the levels stacked with their links.
- **Carving.** A cave room is solid rock with space cut out. `terrain.mask` (new, §6): two int16
  grids, floor and ceiling, at the terrain `res`; the CARVE brush cuts, FILL restores, FLOOR and
  CEILING brushes set the two heights (a chasm is a low floor, a shaft a high ceiling, a squeeze a
  low one). The TUNNEL tool is a spline with width and height that carves along it. The compiler treats
  the mask as the cave family's solid mass (already in `hqTerrainFeet`), draws the cut faces in the
  `cliff` sheet (D3: every wall is drawn rock) and keeps the walker to the cut. Halls and brick
  dungeons are the same mask with the room's `wall` sheet on the faces, or `wall` rows.
- **Links between levels.** `climb` rows (ladder, rope, chain, pipe, wall, fire escape), `spiral` and
  `ramp {stairs}` inside a level; a `stair` join or a door join between levels; a shaft is a hole in a
  ceiling over a floor in the level below (two masks, one door join). A way back is authored, never a
  puzzle: a barred door opened from the far side is a door with `hidden` on one end and a counter on
  the other, a lift is the elevator room.
- **Mouths.** A `places` row of kind `dungeon` on the land with the culvert_mouth, drain_grate,
  brick_arch or cave props around a land door at `hqLandPadY`.
- **Water and light below.** `stream` and `pool` rows, `climb` rows on the falls, prop lights under the
  cap, `mood` and `fog` in the shell.

### 5.8 Existing content (E0 onward)
- Every data.js room opens in the editor. SAVE writes it as a room doc that overrides the built-in.
- FREEZE turns a generated room (`terrain.gen`: cave, rooms, halls, city, ley) into rows and a mask
  (`hqTerrainFreeze`, §6: the compiler's walls, mask and lots dumped into the doc) so it can be edited;
  the `gen` key is removed from the frozen doc. Until frozen, a generated room stays as it is (R4).
- DUPLICATE copies a room under a new id; ROOM AS PREFAB copies its rows into a prefab.
- IMPORT FROM R2 (§5.6) makes the current land the starting land.

### 5.9 Sky and light (E6)
- The SKY tab edits `shell.sky` on an open room: `night`/`day`, `tint`, `stars`, `nebula`, `clouds`,
  `fog {color, amount, top, band, density}`, `scenery` (14 rosters + none), `landmarks` (mountain,
  tower, gate, dome, peak, castle, skycastle, stairway, waterspout, whale, eye), `world` (plain, cavern,
  void, room, planet; `rim` of peaks, hills, dunes, trees, town, city, spires, bergs, ruins, pyramids,
  craters; `wall`; `sea`), `look` (48 post looks), `lock` (a pinned hour) and the zone's `clock`.
  The bodies are the celestial models (moon, earth, jupiter, saturn, alien, star, solar) as landmarks.
- The CLOCK SCRUBBER previews any hour of `HQ_WORLD_CLOCK` in the viewport (the same `_hqClockApply`).
- LIGHTS: `shell.lights` masts and fluorescents, `rig {az, el, color, intensity}`, `mood`, prop lights.
- On the land, a region's `weather {fog, sight}` (new, §6) sets fog density and sight distance while
  the walker is inside its polygon.

### 5.10 Arenas and fights (E7)
- An ARENA marker is a rectangle on a room's ground (`N × M`, 8–36 cells of 1.75 m) with team seats;
  `hqFieldBuild` rasterises the room inside it exactly as an encounter does, at that size. The match
  select lists published arenas (a `MS_MAP_LIST` row per marker, `arena:<room>:<marker>`); the mode
  picks the room by id and both clients load the same doc by sha (R8).
- The FIGHT WINDOW overlay (§5.4) shows the raster live while editing: rock, hazard, levels, seats.
- The old editor, its page, its CSS, `_mePlayTest`, the `_custom_editor` mode and the community maps
  page in its current form are deleted in this phase (R10). `community_maps` takes a room doc + arena
  marker instead of a voxel grid (a migration that adds `kind`; old rows are dropped, mondo's rule).

### 5.11 The delivery zip (E0)
EXPORT builds one zip, in the browser, laid out at bucket and repo paths, holding only what changed
since the last export (the sha of each file is kept in IndexedDB):
```
Assets/World/world.json
Assets/World/rooms/<id>.json        (changed rooms)
Assets/World/prefabs/<id>.json      (changed prefabs)
Assets/Land/tiles/t_i_j.bin         (changed tiles), sea.bin, land.json, land-map.png
```
mondo uploads it with `npm run deploy -- --assets Assets/World --assets Assets/Land` (deploy.js learns
`--assets` folders that carry their own ids and writes `_EW_WORLD_ID` into index.html with the token
bump), or by hand, and redeploys index.html to Render. The zip is a plain STORE zip with an optional
deflate through `CompressionStream` (browser-native), written by editor.js; no library.

---

## 6. THE ENGINE WORK (what the game lacks; built per mondo's "build what's missing" rule)

| # | Piece | Where | Phase |
|---|---|---|---|
| 1 | **The world file loader**: `hqWorldDocLoad` / `hqWorldDocApply` / `hqWorldDocRebuild` (§4.1), `_EW_WORLD_ID` in index.html, the HQ entry waiting on it with the load card | data.js, map.js, index.html, deploy.js | E0 |
| 2 | **Row ids and pick proxies**: every builder tags meshes `userData.rowId`; editor-mode proxies for merged walls, batched shells, instanced props, land chunks | three-renderer.js | E0 |
| 3 | **Reload in place**: `hq.reload(patch)` recompiles in the worker and redraws sliced without `_hqLeave`; per-tile re-mesh for `hmap`/`paint`/`mask` strokes (`_hqTerrainTiles`); per-object replace for props, lights, doors | three-renderer.js | E0, E3 |
| 4 | **editor.js** (fork 1): the shell, the panels, the tools, the command stack, IndexedDB, the zip writer, the thumbnail renderer; loaded by a script tag only when the editor opens; `styles-editor.css` rewritten | editor.js (new R2 file), styles-editor.css, index.html | E0 |
| 5 | **`opening` rows** (`hqOpeningExpand`), **`keyIn`** on walls (`drawWall` with two sheets), **`texbuilding`** rows (the lot builder as a row; a solid quad to the walker) | data.js, three-renderer.js | E1 |
| 6 | **Prefabs and kits**: `hqPrefabExpand` (rotate/translate rows about a pivot, depth 4, `from` tags), `kit` rows calling the allow-listed builders, ROOM AS PREFAB, prefab docs in the world file | data.js | E1 |
| 7 | **Catalogue rows for every `_MISC_GLB` key** that lacks one (measured, `base:'misc'`), the 14 unmapped foliage OBJs as `tree` kinds, `_WPN_MODELS` as props through `_hqCatGlb`; no new files | data.js, three-renderer.js | E2 |
| 8 | **The thumbnail renderer**: one offscreen render per model / sheet / kit into a 96 px bitmap, stored in IndexedDB; the game never runs it | editor.js | E2 |
| 9 | **`terrain.hmap`** (int16 delta added after features) and **`terrain.paint`** (u8 over a room palette of ≤ 8 sheets, drawn by the land splat on the field mesh); both compiled in the worker and carried through `hqTerrainFeet` unchanged | data.js, three-renderer.js | E3 |
| 10 | **`float` parts**: no pad, no island ease, no plinth, no land levelling; the stage places the part at its `y` | data.js (`hqLandSiteFrames`, `hqTerrainStitchRows`, `hqLandSites`), three-renderer.js | E3 |
| 11 | **Audits in the browser**: `hqTerrainReach` (the check-terrain solver moved into data.js, shared by the tool and the tests), the wall audit as a pure function over a compiled field, the fight raster preview from `hqFieldRaster` | data.js, check-terrain.js, wall-audit.test.js | E3 |
| 12 | **The land tile source**: `hqLandWant` / `hqLandPut` read from memory when the editor holds the land, the chunk builder re-meshes chunks whose tiles changed (`_hqLandTileLanded` already marks stale), the water and road indexes rebuild from the editor's vectors | data.js, three-renderer.js | E4 |
| 13 | **The land stamps as pure functions**: `hqLandGradeLine` (roads, from `gradeLine`), `hqLandCarveRiver`, `hqLandPadStamp`, `hqLandCoast`, the sea.bin resample, the map PNG drawer, the `EWLT` tile writer and the id rule, all moved out of bake-land.js into data.js so the editor and the (retiring) tool share them | data.js, bake-land.js | E4 |
| 14 | **The world map editor** on the LAND tab: draggable parts and places, join drawing, `hqWorldValidate` in the status line | map.js, editor.js | E4 |
| 15 | **`terrain.mask`** (floor + ceiling int16 grids) compiled as the cave family's solid mass, faces in the `cliff` or `wall` sheet, ceilings drawn; **`hqTerrainFreeze`** (a generated room dumped to rows + mask) | data.js, three-renderer.js | E5 |
| 16 | **The dungeons table** on the map (levels stacked, links drawn); `stair` joins between levels at different `y` | data.js, map.js | E5 |
| 17 | **Region weather** on the land (`fog`, `sight` per region polygon, read by `_hqClockApply` from the walker's region) | data.js, three-renderer.js | E6 |
| 18 | **Arena markers**: `hqFieldBuild` at `N × M`, seats from the marker, `MS_MAP_LIST` rows for published arenas, online map choice by doc id + sha, `community_maps` migration 005 | data.js, map.js, match-select.js, online.js, server.js, migrations/ | E7 |
| 19 | **Removal of the old editor** (§2.1) and, in E8, of the retired generators (`HQ_LAND` recipe, `bake-land.js`, `checkRules`, `land-bake.test.js`, the retired outdoor rooms) | map.js, index.html, styles-editor.css, data.js, package.json | E7, E8 |

Nothing here needs a three.js upgrade. `TransformControls` and `OrbitControls` come from the r128
examples folder already on jsdelivr.

---

## 7. HOW THIS RELATES TO OPEN_WORLD_PLAN.md AND WORLD_GEOGRAPHY_PLAN.md

**KEPT** (the runtime the editor's docs run on; nothing here changes):

| Kept | Why |
|---|---|
| The room as the authoring unit; the terrain compiler (families A–E) in the worker; `hqTerrainFeet`; the walker, climb, swim, skate, dash, the skiff | A room doc is a room |
| `HQ_WORLD` zones, parts, frames, joins; the stage (`_hqStageSwap`, the crossing, the ring, `beside`, islands); door joins that swing; portals `_hqCull*` | The world doc is `HQ_WORLD` |
| The sliced build, the warm-up, the static batch, the instance pass, ImageBitmap, the near-first queue, the LOD levels, the asset store, the manifest, meshopt, the memory budget, the file tracker and the warm zone | Every doc attaches through them |
| The land runtime: `HQ_LAND_STORE`, the sampler, the 64 m chunks and LODs, the splat, the far pass, the water layer, falls, moorings, the flora sampler and trunk blockers, the roads index, decks, rails, signs, traffic, the ice materials, `edgeReach`'s wall | The editor writes the same tiles and land.json |
| The clock and the sky, `sky.lock`, `dayLook`, the lamps | The sky picker edits them |
| The seamless field (`hqFieldWindow`, `hqFieldRaster`, `hqFieldBuild`, the room in battle) | Every doc fights this way; arenas reuse it |
| The map tab's ATLAS drawing, `hqRoomsSeenRecord`, the plates and the '?' rule | Drawn from what the editor exports |
| `wall-audit.test.js`, `check-terrain.js` (the solver moves into data.js and both keep running) | R3 stays a test |

**REPLACED**:

| Replaced | By |
|---|---|
| WORLD_GEOGRAPHY_PLAN §4 (the sketched geography), §5.1 THE BAKE, the `HQ_LAND` recipe (coast, plateaus, bumps, ranges, peaks, rim, glen, canyons, mesas, dunes, basins, beaches, forests, rivers, roads as recipe rows), `bake-land.js`, `checkRules` (R2 sight, R5, R7, R3-cliff, R4), `land-bake.test.js`, the reveal list | The land sculpted and painted by hand (§5.6); the bake's stamps kept as pure functions the editor calls; the sight test as a tool, not a gate; `land.json` and the tiles written by the editor. The current bake is the starting land, not thrown away |
| G9 THE DISCOVERY PASS (landmarks every 150–250 m, dressed reveal points, region title cards, the fog of war) | Regions, reveal markers and landmarks are things mondo places (§5.6). The fog-of-map by region and the title card stay as a small runtime piece if he wants them (fork 9 of that plan carries over as fork 8 here) |
| G10 THE DUNGEONS (the kit D1–D6, one dungeon per thread) | The carve tools and the dungeons table (§5.7). D1–D5 become things he builds; D6 (no puzzles) stays a rule |
| OPEN_WORLD_PLAN §8 THE CONTENT TRACK (rebuilds as threads: the mall, the basilica, the bunker, the catwalks) | Rooms he builds or freezes and edits |
| OPEN_WORLD_PLAN §4.5 and the outdoor zones (already replaced by the land), `HQ_AREA_SPECS` rooms once frozen, `gen.kind` city districts once frozen | Docs |
| The old voxel map editor, `_custom_editor`, the community maps page, `community_maps` voxel JSON, MAP FORGE's editor mirror (`MF_TID`/`MF_OID`) | §5.10; the forge stays for the built-in battle maps until each is redone as a room |
| G11 (sound in space) | Not this plan (mondo does all audio) |
| G12 (the light: shadow cascades, probes) | Unchanged, still a later phase of its own |

**What is NOT decided here:** what the new world looks like. That is the point: the map, the places,
the routes and the dungeons are drawn by mondo in the editor. The plan gives the tools, not a layout.

---

## 8. THE ORDER (each phase a delivery with its own test; `npm run test:end` at the end of each; one delta zip)

| # | Delivery | Files | Test |
|---|---|---|---|
| E0 | **THE DOCUMENT + THE SHELL**: the world file and its loader (§4.1), `deploy.js --assets`, row ids and pick proxies, reload in place, `editor.js` with the fly camera, PLAY HERE, the outliner, the inspector for every field of every row, select / move / rotate any row, prop, door or light with the gizmo, undo, IndexedDB save, export zip, import from R2, SAVE any data.js room as a doc. Usable on day one: open any room, move what is in it, fix a door target, export, upload, live | editor.js (new), data.js, three-renderer.js, map.js, index.html, styles-editor.css, deploy.js, package.json | `world-doc.test.js` (apply + rebuild: a doc overrides a room by id, retire removes it, the derivations list is complete for the rooms it names; the exported room compiles identically) |
| E1 | **THE SHAPES**: every row kind as a tool (§5.3), openings, `keyIn`, snap, array, mirror, textures on faces from the three registries, prefabs and kits with forms, `texbuilding` | editor.js, data.js, three-renderer.js, styles-editor.css | `editor-shapes.test.js` (opening expansion, prefab expand rotates/translates and nests, kit rows call only allow-listed builders, a frozen bowl equals `hqStandBowl`'s rows) |
| E2 | **THE PALETTE**: models, people, trees, doors, lights, markers (§5.2, §5.5), thumbnails, the catalogue rows for the misc keys and the foliage OBJs, the door tool with the return door and links | editor.js, data.js, three-renderer.js, sprites.js | `editor-palette.test.js` (every registry key resolves to a placeable row; every placed door has a live target; no palette entry names a file not in the bucket's known folders) |
| E3 | **THE GROUND**: `hmap` brushes, `paint`, water rows, the level band, float parts and platforms, the audits in the viewport, the fight window preview | editor.js, data.js, three-renderer.js, check-terrain.js | `editor-ground.test.js` (hmap adds after features; paint indexes the palette; a float part has no pad; `hqTerrainReach` equals check-terrain's answer on a pinned room) |
| E4 | **THE LAND**: the land in memory, import from R2, brushes, lines, paint, places, regions, reveals, the sight tool, the world map editor, the in-browser export of tiles / sea.bin / land.json / land-map.png / id (§5.6, §5.5) | editor.js, data.js, three-renderer.js, map.js, bake-land.js (calls the moved functions) | `editor-land.test.js` (a tile written by the editor's writer reads back through `hqLandTileRead` bit-identical; `hqLandGradeLine` equals bake-land's on a pinned road; the id rule matches; changed-tiles-only export) |
| E5 | **THE DUNGEONS**: `mask`, carve / fill / floor / ceiling / tunnel, freeze, the dungeons table and the stacked map, stair joins, mouths (§5.7) | editor.js, data.js, three-renderer.js, map.js | `editor-dungeon.test.js` (a mask compiles to solid mass; every cut face is drawn; a frozen cave equals its generated field; levels stack by y) |
| E6 | **THE SKY AND THE LIGHT**: the sky picker over every key, the clock scrubber, lights, region weather (§5.9) | editor.js, data.js, three-renderer.js | `editor-sky.test.js` (every picker option is a key the dome shader or a builder reads; the region's fog applies inside its polygon) |
| E7 | **THE ARENAS + THE OLD EDITOR GOES**: arena markers, `N × M` rasters, match select rows, online by id + sha, migration 005, deletion of `_me*`, `#mapEditorPage`, `.me-*`, `_custom_editor`, `_mePlayTest`, the voxel community page (§5.10, R10) | editor.js, data.js, map.js, match-select.js, online.js, server.js, migrations/005_arenas.sql, index.html, styles-editor.css, profile.js | `editor-arena.test.js` (a marker rasterises at its size with its seats; the guest resolves the same doc sha; no `_me` symbol remains) |
| E8 | **THE SWAP**: when mondo says his world stands, `retire` the generated outdoor rooms, delete the `HQ_LAND` recipe, `bake-land.js`, `checkRules`, `land-bake.test.js`, the retired rooms from data.js, and close WORLD_GEOGRAPHY_PLAN with a note in §12 there. Runs only on his word | data.js, package.json, tests, docs | the fast suite green with the recipe gone |

**What first:** E0. It is the only phase every other depends on, and it is already useful (a room's props,
doors and lights edited in place and shipped). E1 (buildings) and E4 (the land) are what mondo asked for
most; E1 comes first because E4's brushes reuse E3's brush engine and E4's place tool reuses E2's door
tool. If he wants the land before buildings, E4 can follow E0 with its own brush engine and the place
tool without return doors; the plan does not assume that.

Each phase's zip holds: `editor.js` (R2), the bumped `index.html` (Render), the touched R2 scripts,
`styles-editor.css` (R2), repo-only tests and docs. No phase ships a dev shortcut in the player's game.
Notes go to `docs/notes/editor.md` (new notes file, listed in CLAUDE.md's index), never to CLAUDE.md.

---

## 9. THE FORKS (the plan builds each default unless mondo says otherwise)

| # | Fork | Default | Alternatives |
|---|---|---|---|
| 1 | **Where the editor's code lives** | **RULED 2026-09-29 (mondo: "okay sure do an editor js"): one new R2 file `editor.js`**, loaded by a script tag only when the editor opens, added once to index.html and to the upload set. This is the one exception to "never a new game .js file": the editor is 10–20 k lines that the player's game never runs, and map.js is 1.4 MB already | (b) Inside map.js (no new file; every session's map.js edits get slower; the player downloads the editor); (c) a separate `editor.html` page on Render (the game's scripts loaded twice; the pause-menu entry impossible) |
| 2 | **Where the docs live** | **`Assets/World/` on R2**, loaded over data.js by id (§4.1); data.js stays the library | (b) The editor writes data.js source (a 4 MB regex edit per save, the repo as the store, no in-browser save); (c) the server's D1 (a 500 KB row cap, a Render deploy per change, no delta zips) |
| 3 | **The land's representation** | **The heightmap and the `EWLT` tiles stay**; the editor sculpts them and writes them itself | (b) No heightmap: the world is placed terrain rooms only (loses the streamed continuous ground, the far pass, the water layer, the roads; every outdoor place a rectangle again) |
| 4 | **The starting land** | **Import the current bake** (`5aa5d61879`) and edit it | (b) A flat disc at sea level with the ice wall |
| 5 | **Openings in walls** | **An `opening` row expanded into two wall pieces and a lintel** (no new geometry code) | (b) Real holes cut through the wall mesh (a boolean pass; slower compiles; the walker's wall rule would need a hole test) |
| 6 | **Unpublished docs online** | **Offline only**: a match uses published docs by id + sha (R8) | (b) The host relays the room doc over the socket (docs can be 100 KB+; a guest could be handed anything; the mirror gets a new path) |
| 7 | **When the old editor goes** | **E7**, with the arenas that replace its one job | (b) E0 (nothing to make battle maps with until E7); (c) never (two editors, R10 broken) |
| 8 | **The land's fog of map and title cards** (G9's) | **Kept as a small runtime piece**: regions clear on first sight, a title card on a region's first sight; both read the region polygons mondo draws | (b) The whole map drawn from the start, no cards |
| 9 | **Land cell size** | **2 m**, as baked | (b) 1 m near sites (4 × the tile bytes; the sampler and the writer take a per-tile cell; the bucket grows to ~150 MB) |
| 10 | **Room material paint** | **Up to 8 sheets per room through the land splat** | (b) Keep `floor`/`cliff`/`path` only and paint with `path` rows (no new shader path; coarser) |
| 11 | **The editor on mobile** | **Desktop only** (mouse and keyboard); the player's game on mobile is unchanged | (b) Touch tools (a later plan) |
| 12 | **Per-face textures on walls** | **Two sheets** (`key` outside, `keyIn` inside; top and ends take `key`) | (b) Six faces (the merged-prism path would need per-face groups) |

---

## 10. WHAT'S NEEDED FROM MONDO

| When | What |
|---|---|
| Now | Fork 1 is ruled (a new `editor.js`). A word on fork 2 (docs on R2 under `Assets/World/`), which also changes the upload set once. Silence means the defaults. Any other fork, or "land before buildings" (§8) |
| E0 | Upload the zip as usual (editor.js and styles-editor.css are R2 files; index.html to Render). From then on, every export from the editor is uploaded the same way, with `npm run deploy -- --assets Assets/World` or by hand, and index.html redeployed |
| E4 | Nothing: the starting land is the published bake, fetched by the editor from the bucket |
| Any phase | Which room he wants to try first; the phase's reply names how to open it |
| E8 | His word that the world stands and the generated one can go |

Nothing else: no art, no models, no textures, no names. Names are his to type in the label fields.

---

## 11. RISKS

| Risk | Mitigation |
|---|---|
| **The derivations** (§4.1 step 4): rooms are read at load in places nobody has listed; a doc that overrides a room may miss one | E0's test pins the list; every later phase that finds one adds it to §12 and the test; `hqWorldDocRebuild` is one function, so a miss is one line |
| **Compile latency** on big rooms (3–31 s) makes editing feel dead | Strokes re-mesh tiles only; structural edits compile in the worker while the last build stays on screen; COMPILING in the status line; prefabs and kits expand before compile, so their edits are structural (accepted) |
| **Memory**: the land in memory (about 60 MB) plus the room, the thumbnails and IndexedDB | The land is loaded only in land mode; thumbnails are 96 px; IndexedDB holds project docs and changed tiles, not the whole bucket; the MEM line stays on |
| **Browser support**: IndexedDB, `CompressionStream`, `DataTexture2DArray` (WebGL2 for the splat) | mondo's browser is desktop Chrome (the game already needs WebGL2 for the land splat); the zip falls back to STORE without `CompressionStream` |
| **Online parity** of docs | R8: identity by sha; `_serializeState` unchanged; a guest never receives a doc |
| **Scope**: this is bigger than the geography plan | E0 alone ships a working editor over the real data; each later phase is one tool set with one test; nothing waits on the last phase |
| **Two editors of the same room** (a data.js room mondo also saved as a doc) | The doc wins by id (§4.1); the inspector shows OVERRIDES data.js; RETIRE and DUPLICATE are explicit |
| **The land's pad rule and the sites** at export | The export runs the same `hqLandPadStamp` the bake ran, from the same `places` and part rectangles, so a site keeps its levelled ground; `float` parts opt out |
| **Losing work** | Autosave on every change; projects listed by name; export any time; import from R2 restores the published state |

---

## 12. WHAT EXISTS, WHERE (so no implementation thread re-searches)

| Thing | Where (at G8 + quick fixes) |
|---|---|
| Room schema, feature rows, the compile | data.js `DOOR_HQ.rooms` 24743; the grammar comment 44004–44058; `hqTerrainCompile` 45683; `hqTerrainFeet` 46199; `HQ_TERRAIN_RULES` 44059; the worker `hqTerrainWorkerServe` 45568 |
| Kits and shells | data.js 22429–22930 (`hqRingPts` … `hqCurtainWall`); shell factories 22370–23089; `hqStandBowl` 22510; stadium spec 42741; garage drum 27709; Camelot 34728 |
| Catalogue, props, leaves, misc models | data.js `DOOR_HQ.catalogue` 23130; `_hqPlaceProps` three-renderer.js 47964; `_hqModelUrl` 39875; `_MISC_GLB` 24383–24558; `_hzMiscKit` ~24630; `_hqCatGlb` 39787; foliage OBJs 5091–5120; `_WPN_MODELS` three-vfx-effects.js 10487 |
| Textures | sprites.js `TERRAIN_SPRITES` 3495, `URBAN_TEX_FAMILIES` 3726, `URBAN_TEXTURES` 3762, `_T` 3294; data.js `DOOR_HQ.textures` 3108; three-renderer.js `_hzTex` 23825, `_hqTex` 39481, `_hqMat` 39520 |
| Builders | three-renderer.js `_hqEnter` 60261; `_hqBuildBoxShell` 40292; `_hqBuildTerrain` 41996; `_hqBuildBridges` 41619; `_hqBuildArcBridge` 41690; `_hqMergeWallBoxes` 41794; `_hqBuildMarks` 41878; `_hqTerrainTiles` 41937; `_hqBuildDoors` 47515; `_hqBuildSky` 43558; `_hqBuildClimbs` 56045; `_hqTexBuilding` 42458; `_hqBuildCityLots` 42520; the sliced build `_HQ_STAGE_STEPS` 58873 |
| Walker, collision, audits | three-renderer.js `_hqTickWalker` 56233; `_hqSurface` 50655; blockers 50783–50841; `HQ_STEP_TOL` etc 39451–39455; `wall-audit.test.js`; `check-terrain.js` |
| World and stage | data.js `HQ_WORLD` 40137; readers 40364–40744; `hqWorldSheet` 40857; `HQ_WORLD_RULES` 39814; `HQ_STAGE_RULES` 39836; `hqLandSiteFrames` 42374; `hqLandSites` 42388; `hqLandSiteY` 42408; `hqTerrainStitchRows` 45586; three-renderer.js stage 58803–60241 |
| Doors, links, plates | data.js `DOOR_HQ.links` 24167; `hqLinkDoors` 38962; `siteRooms.entry` 24631; `hqSiteEntry` 38861; `doorSiteState` 51941; `hqDoorPlateFor` 42452; three-renderer.js `HQ_PLATE_EYE` 39919; `_hqTickAutoEnter` 56645; map.js `_hqWalkThroughDoor` 6431 |
| The land | data.js `HQ_LAND` 41065 (`baked` 41366, `places` 41288); `HQ_LAND_RULES` 41405 (`tex` 41499, `mats` 41510, `flora` 41455, `roads` 41531); `HQ_LAND_STORE` 41548; sampler 41550–41800; water 41809–41885; flora 41917–42122; `HQ_LAND_ROADS` 42137; three-renderer.js `_hqLandArm` 52941, `_hqLandStream` 52978, `_hqLandBuildChunk` 53104, splat 53288–53340, far pass 53361–53456, water 53460–53805, flora 53825–54292, roads 54327–54692, `_hqLandFeetAt` 54693 |
| The bake | bake-land.js (`bake` 154, `gradeLine` ~500, `writeOutputs` 867, `checkRules` 755, `stampData` 943); land.json keys §2 of the land survey; the `EWLT` header 16 bytes |
| The map | map.js ATLAS `_hqAtlas*` 4886–5040; LAND `_hqLandModel` 4765; `hqRoomsSeenRecord`; `EW_HQ_MAP_ALL` |
| The fight in a room | data.js `hqEncounterLaunch` 47615; `hqFieldWindow` 50236; `hqFieldRaster` 49938; `hqFieldBuild` 50330; `hqFieldRegister` 50402; `HQ_FIELD_RULES` 49613; three-renderer.js `_hqBuildRoomInBattle` 58639; `_fieldPickBuild` 58395 |
| The old editor | map.js `_me*` 15345–21990 (`_meEnterDioramaEditor` 17738, `_meSave` 21054, `_mePlayTest` 21753, `_meSnapshotState` 15877); index.html `#mapEditorPage` 1206; styles-editor.css `.me-*`; profile.js `CommunityMapsPage` 2275; server.js `/api/maps` 1573; migrations/001_init.sql `community_maps` 36 |
| Player-placed precedent | data.js `hqGunDoorPlace` 50938, `HQ_GUN_RULES` 50881; map.js `_hqGunDoorPlaced` 3300 |
| Delivery tooling | deploy.js (`--assets`), manifest-assets.js, optimize-assets.js, `_asFetch` / `_asNetUrl` three-renderer.js 1550–1690, `hqLandUrl` data.js 41374 |
| Sky and clock | data.js `HQ_WORLD_CLOCK` 39883, `hqRoomClock` 39962, `HQ_ROOM_LOOKS` 15539, `HQ_LIGHT_RULES` 50462; three-renderer.js `_hzThemeRoster` 29720, `_hqLandmarkBuilders` 43358, `_WD_RIM` 30261, `_hqTickSky` 43633, `_hqClockApply` 60094 |
| three.js | r128 from cdnjs; examples from jsdelivr (index.html 264–293); `TransformControls` at `three@0.128.0/examples/js/controls/TransformControls.js` |

---

## 13. THE LOG (each phase appends here)

- 2026-09-29: plan written. Nothing built.
- 2026-09-29: fork 1 ruled by mondo: the editor is a new R2 file `editor.js`.
