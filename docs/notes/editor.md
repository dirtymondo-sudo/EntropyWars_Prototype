# THE EDITOR — notes (EDITOR_PLAN.md; E0 built 2026-09-29)

The plan is EDITOR_PLAN.md at the repo root (§4 the document, §5 the tools, §8 the order, §12 where things are, §13 the log).
mondo's ruling (fork 4): his world starts FLAT AND EMPTY; the data.js rooms are a LIBRARY to look at and copy, never imported.

## E0 — THE DOCUMENT + THE SHELL (2026-09-29, token 20260929-editor-01-cors)

- **Opening it:** main menu EDITOR (`_goToMapEditor` now calls `_goToEditor`; the old voxel editor is `_goToVoxelEditor`,
  also FILE → Old voxel map editor, until E7 deletes it), the pause menu's EDIT (this room, where the walker stands), or
  `?edit` / `?edit=<room>` in the url. map.js `_goToEditor` loads `window.EW_EDITOR_URL` (index.html, `?v=` tagged so
  deploy.js sees editor.js as an R2 file) by script tag; the player's page never loads it.
- **The viewport IS the game's room:** `_hqEditEnter` calls `ThreeRenderer.hq.enter` with `edit: { tick, play }`.
  While `_hqEditing(H)` (edit set and not play) `_hqFrame` skips the walker, the portal cross and the camera and calls
  `edit.tick(dt, H)`; the room's own input handlers stand down; no pointer lock. `hq.editView()` hands the editor the
  scene, camera, canvas, units, the props (`grp.userData.ewRow` = the row) and doors. The editor's overlay is one `editor`
  group (grid, spawn cone, invisible pick proxies, the BoxHelpers) plus the TransformControls.
- **Editing sets** `EW_HQ_NO_BATCH` + `EW_HQ_NO_INSTANCE` (restored on close) so a live drag moves the real prop.
- **The doc:** `ED.doc` = the world doc; its room objects ARE `DOOR_HQ.rooms[id]` (hqWorldDocApply lays them in by reference).
  Every edit is one undo step of patches `{path, before, after}` (undefined = insert / remove), then `docSync` (drops
  `_terrainInfo`, re-runs `hqWorldDocRebuild`), autosave (IndexedDB `ew_editor`, store `projects`, debounced 600 ms) and a
  debounced (220 ms) re-enter of the room. A prop moved on the ground skips the re-enter.
- **Ids:** his rooms `w_roomN` (the lowest free N); rows `rN` (`hqWorldDocRowIds`). Export strips every `_` key.
- **Coordinates:** x east, z south, yaw degrees CLOCKWISE from north; `rowTransform` turns points clockwise
  (x' = x cos − z sin, z' = x sin + z cos) and adds to face / rot / a0 / a1. A wall door (n/s/e/w) slides on its wall only.
- **The gizmo:** three r128 TransformControls from jsdelivr. It FLIPS an axis that points away from the eye (the red X
  arrow can point left) — dragging right is still +x. Probes find the arrow by hovering (`EWEditor.state().tcAxis`).
- **Picking:** props / doors / spawn by their meshes; shapes by invisible boxes from `rowShape`. A visible thing under the
  cursor always wins over a shape's box (a door standing on a ridge is picked, not the ridge); the outliner picks shapes.
- **PLAY HERE (P):** `window._hqEnter({ room, at, quiet: true, from: 'walk' })` with the editor hidden (`body.ed-playing`);
  ESC or P in the room → map.js `_hqOpenPause` → `EWEditor.backFromPlay()`.
- **Export:** a STORE zip at `Assets/World/` (world.json + changed `rooms/<id>.json` + README_EXPORT.txt). World id = first
  10 hex of world.json's SHA-256. `npm run deploy -- --world <unzipped folder>` uploads and writes `window._EW_WORLD_ID`.
  With an id set, data.js loads the world at boot and `_hqEnter` waits for it (`HQ_WORLD_DOC_STATE`). Nothing leads into
  his rooms until THE SWAP (E8, `live: true`).
- **Tests / probe:** world-doc.test.js (fast); `node playtest_editor.js` (needs `npm start` and
  `npm i --no-save three@0.128.0 playwright`) drives add / pick / gizmo drag / undo / play / library / copy / export.

## E1 — shapes and buildings (2026-09-29, token 20260929-editor-02-cors)
- **THE POINTER (mondo's report):** three-renderer.js `_hqTryLock` returns while `_hqEditing`. The editor locks only while
  the RIGHT mouse is held over the canvas (`lookLock`), drops it on button up / blur, and `onLockChange` drops any lock taken
  without the right button. Panel fields, menus and modals never lock (the probe counts `requestPointerLock` calls: 0).
- **Draw tools** (editor.js `DRAWS`, `drawDown/Up/Show`, `ED.opts` saved in localStorage `ew_editor_opts`): each finished piece
  is ONE undo step (`drawRows`). Preview boxes live in `ED._pv`. `drawPt` snaps to wall ends (0.6 m) else the grid (≥ 0.25 m).
  V = SELECT; ENTER / ESC end a wall run, a second ESC leaves the tool.
- **The rows E1 adds** are expanded before the compiler (data.js `hqRoomExpand`, called at the top of `hqTerrainCompile`):
  `opening` → `hqOpeningPieces`; `prefab` / `kit` → `hqRowPlace` (mirror, yaw clockwise, move, lift by y; a mirrored wall
  swaps its ends so `keyIn` stays inside); `texbuilding` → `hqTexBuildingRows` (walking) + `info.texb` (the renderer's
  `_hqBuildTexRows` → `_hqTexBuilding`, seeded). Prefab props join `info.scatter`; kit paint joins `info.marksX`.
- **Hung walls:** a row with `lift` is `hung`; `hqTerrainWallAt(info, x, z, pad, lo, hi)` counts it only when the band
  overlaps [base, top]; callers without a band ignore it (feet, air, cam pass their bands).
- **Prefab mode:** `ED.mode = 'prefab'`, `ED.pfId`; the prefab is laid out in the wrapper room `__ed_prefab` whose arrays ARE the
  prefab's, so every tool works unchanged (`basePath()` = `['prefabs', id]`). `stepTouched` re-syncs every room placing a prefab.
  The survey worker gets `HQ_PREFABS` with each room (map.js).
- **Texture picker** (`texPick`): TERRAIN_SPRITES, URBAN_TEX_FAMILIES (as `urban:<Name>`), DOOR_HQ.textures. Only existing sheets.
- **Probe:** the E1 sweep drives the palette with real mouse drags via `EWEditor.w2s(x, y, z)` and `EWEditor.cam({...})`.

## E2 — the palette and the door tool (2026-09-29, token 20260929-editor-03-cors)
- **The tabs** (editor.js `PAL_TABS`, `palette` / `palBody` / `tileHtml`; `ED.opts.tab` remembered): BUILD (E1's draw tools),
  MODELS, PEOPLE, TREES, DOORS, LIGHTS, MARKERS, TEXTURES, KITS. Each tab has a search box and collapsible groups (all open
  when a tab holds ≤ 40 tiles or you are searching), 240 tiles at most shown. The entries come from data.js `hqPalette(o)`,
  built at run time from the registries. `o` = sprites.js `RACE_MODELS_3D` keys, `DOOR_CAST_MODELS` keys and the agent poses.
  Every entry is `{ id, label, sub, group, list, row, thumb }`; `hqPaletteRow(entry, x, z, face)` makes the row.
- **Placing** (`palPick` → `drawSet('place')`, `palDrop`): click a tile, then the ground; each click is one undo step and the
  tool stays armed (the spawn is the exception: one click). The thing faces the eye (`faceEye`); a box ghost shows where it
  lands (`placeShow`). Clicking the armed tile again, ESC or V stops.
- **Stable tiles:** `palette()` / `palBody()` keep their elements when their HTML has not changed (`B._h`, `P._h`, with the
  thumbnails masked out), because every edit re-enters the room and calls `panels()`. A rebuilt button was losing clicks.
- **New catalogue rows** (data.js "THE PALETTE (E2)"): `HQ_CATALOGUE_MISC` (40 `_MISC_GLB` keys, `base: 'misc'`) and
  `HQ_CATALOGUE_WEAPONS` (24 `_WPN_MODELS` keys, `base: 'weapons'`) join `DOOR_HQ.catalogue` only where the key is free.
  The files are copied from the renderer's own tables, and the test holds them equal. Their `h` / `span` sizes are
  UNMEASURED guesses (the bucket is blocked in the sandbox); the inspector overrides them per prop.
- **Trees:** `HQ_TREE_KINDS` maps `tree` … `tree_20` onto the 20 foliage OBJs. The board's six keep their models; tree_7 …
  tree_20 are the other fourteen. `hqTreeDead(kind)` replaces the renderer's old `tree_5 || tree_6` checks
  (`_foliageDead`). New kinds wear leaves.png.
- **People:** a race tile is an `npcSpots` row `{ race }` (a native). A cast tile is `{ cast }`, and `_hqSpawnPopulation`
  now spawns `getCastModel(cast)` for it. Agent tiles are `agents` rows with a pose. `hq.editView().chars` lists them.
- **Markers:** spawn (moves the room's one spawn), sign (a `counters` row, READ), roster spot (an `npcSpots` row with no
  race), online spot (`onlineSpots`). Every spot, agent and sign gets a coloured post in the view (`markerObj`), so an empty
  spot can still be picked.
- **Textures:** click a sheet, then a face. A wall's side picks `key` or `keyIn` (the right-hand face walking x0→x1 is the
  inside); a kit sets `args.key`; other shapes set `key`; the open ground sets the room's `terrain.floor`.
- **The door tool** (`DRAWS.doorway`, `doorClick`, `doorModal`, `doorWrite`; ADD → Door…, or a DOORS tile):
  - Clicking one of his walls cuts an `opening` (door width, or 2.4 m for a `wide` leaf) and stands a free door in the gap,
    facing the side he clicked from. Clicking the ground stands a free door facing him. A way (`way:` tile) always goes on
    the ground.
  - Then he picks the room it leads to (his rooms, or A NEW ROOM) and where he arrives: a new return door
    (`HQ_PALETTE_RULES.returnAhead` = 4 m in front of its spawn, facing back), its spawn (one way), or one of its doors
    (re-pointed back here).
  - It is all one undo step, built by data.js `hqDoorPair(doc, a, b, o)` (pure).
  - This DIFFERS from §5.5's `links[]`: the pair is two door rows whose `action.at` name each other, so both stay
    pickable and editable.
  - The door inspector says where it leads and has LEADS TO… (asks again) and GO THROUGH (the editor goes to its far door).
    Deleting a door clears its partner's `at` in the same step (`hqDoorPartners`).
  - `hqWorldDocDoorCheck(doc)` lists the doors whose room or door is gone; the status line shows "N DOORS LEAD NOWHERE".
- **Thumbnails** (`TH`, `thumbPump`, `thumbRender`): the renderer builds the real thing (`hq.propPreview(key, cb)` for props
  and procs, `hq.treePreview(kind, cb)` for trees, each giving up after 20 s). A second 96 px WebGLRenderer draws it once,
  and the picture is cached in IndexedDB `ew_editor` (version 2, store `thumbs`, keyed by the file name). A thing that
  can't be built shows its letter. `window.EW_ED_NO_THUMBS = true` turns them off. Races use RACE_PORTRAITS.
- **Not in E2:** the battle marker (E7, it needs a site). Lights edit through the inspector; the light cap is the game's.
- **Probe (no test file; the repo's tests were removed 2026-09-29):** `node playtest_editor.js e2` runs the palette sweep with real
  clicks. It serves a stand-in GLB and OBJ, and takes around 10 minutes under swiftshader, so don't wrap it in a short
  `timeout`. `NOTHUMB=1` turns the thumbnails off; `ONLY='[[list,row],…]'` just adds rows.

## E3 — ground, water, levels and audits (2026-09-29, token 20260929-editor-04-cors)
- **The grids** (data.js "THE GROUND GRIDS", before `hqTerrainCompile`): `terrain.hmap = { t: 'i16', res, x0, z0, nx, nz, d }`
  is a height delta in cm (base64 little-endian), added in `hBefore` AFTER the feature rows and BEFORE the door pads, so a
  door's landing still meets its sill. `terrain.paint = { pal: [≤ 8 sheets], t: 'u8', … }` is a sheet per node (0 = none).
  `hqGridDecode` caches on a NON-enumerable `_dec` (the export and the survey's plain copy never see it); `hqGridEncode`
  crops to the non-zero box + 1 node and returns null when all zero. `_hqB64Enc/Dec` fall back to a hand coder when
  atob/btoa are missing (the load-data.js vm sandbox). The compile writes `info.paint = { pal, P, n }` on its own lattice.
- **The paint on the mesh** (three-renderer.js `_hqTerrainMat`, `_hqPaintAttrs`): one-hot vec3 attributes aPaintA/B/C
  (sheets 1-3, 4-6, 7-8) per vertex, samplers tPaint0..n, blended after the floor/path and before the cliff, so a steep
  face still wears the cliff sheet. The cache key carries the sheet count (`hqTerrainTriP3`). `_hqTerrainTiles` copies the
  attributes. DIFFERS from §5.4: not the land's `_hqLandSplatHook` (the field has its own material; this is simpler).
- **The brushes** (editor.js THE GROUND, GROUND tab): RAISE / LOWER (SHIFT flips; 4 m/s × strength), SMOOTH (3 × 3 mean),
  FLATTEN (to the height where the stroke began), TERRACE (to the nearest STEP), RAMP (drag foot → head: an even incline
  between the two grounds, brush-wide, a metre's ease; the status line shows run, rise, grade and TOO STEEP past the
  walker's `maxSlope`), CLIFF (a hard raise of CLIFF m over the start height: the face is as sheer as the lattice), SET
  (absolute), PAINT (+ SHEET picks a texture and adds it to the room at once so the stroke shows live; ERASE; ✕ SHEET
  removes one and renumbers the grid). `[ ]` size the brush; the yellow ring follows the ground. A stroke works on the
  compiled lattice (`strokeStart` reads the stored delta per node, `strokeDab` edits a copy, `meshLive` moves the tile
  meshes' vertices / paint attributes), and the release commits ONE step (`terrain.hmap` or `terrain.paint`), then the room
  rebuilds from the grids. CLEAR HEIGHTS / CLEAR PAINT (the tab and the room inspector).
- **Water:** POOL (drag middle → rim) and STREAM (click the course, ENTER) write `pool` / `stream` rows whose level sits just
  under the lowest ground round them (0.1 / 0.15 m); liquid water / deep_water / lava; depth. The room inspector has `sea`
  (seaY, seaKey, seaUnder) = `terrain.sea`.
- **Floating:** PLATFORM (BUILD, drag) = `plateau { float: true }` at HEIGHT; DECK = a railed `bridge` at HEIGHT. A whole room
  floats with the inspector's `floating` (`terrain.float = { depth }`): no outer ground, and `_hqBuildUnderside` hangs a rock
  underside (7 rings narrowing to `depth` m below the rim, the cliff sheet). A zone part with `float: true` also works in
  data.js (`hqWorldFrame().float`: no land pad, no island ease, no sea sink) for E4's map.
- **The level band** (top bar LEVEL, bottom, top, ▼ ▲; L, Shift L; saved in localStorage `ew_editor_band`): only rows,
  props, doors and markers whose height overlaps it pick (and list in the outliner); everything above its top is cut by a
  clipping plane on the room's materials (`bandClip`; the late-loading models are caught once a second; PLAY HERE and
  close put the materials back).
- **The audits** (top bar AUDIT; `ew_editor_audit`): WALLS = data.js `hqTerrainWallAudit(info)` (R3: a refused 0.5 m step
  with nothing drawn within 0.45 m → red posts; 1 m steps on rooms over ~4000 m² half-area); POCKETS =
  `hqTerrainPockets(info, from)` (walkable nodes `hqTerrainReach` never gets to from the spawn and the doors' landings →
  yellow squares, m² in the status line); FIGHT = `hqFieldWindow(room, cursor, cursor)` drawn as 64 quads (green = a tile,
  lighter = higher tier, red = rock, blue = water/lava). They re-run after each rebuild; none gates a save. The old
  check-terrain.js / wall-audit.test.js logic lives in data.js now (both files were deleted 2026-09-29).
- **Quick check:** a scratch Playwright script (not in the repo) opened the editor, raised the ground (hmap 19 × 18, +0.78 m at
  the centre), painted dirt twice (live the second time), added a float platform + a pool, turned on all three audits and
  the band, and floated the room: no shader or editor errors.

## E4 — the land and the world map (2026-09-29, token 20260929-editor-05-cors)

**CUT 2026-09-29 (ZONES_PLAN Z0):** the whole land mode below was deleted from editor.js and data.js (hqLandEd*,
HQ_LAND_EDIT_RULES, the land export, `world.json.land`, the outliner row, EWEditor.act.land). Kept: float ground (E3).
Old IndexedDB `land` stores stay unused (the db version is unchanged). This section is history.

R2 files: editor.js, data.js, three-renderer.js, styles-editor.css. Repo: index.html (token), deploy.js (`--world` now uploads
`.bin` and `.png` with their types), docs.

**Where it lives.** data.js THE LAND IN THE EDITOR block (just before THE SHAPES): `HQ_LAND_EDIT_RULES`, `hqLandEd*`.
editor.js THE LAND section (just before OPEN / CLOSE): `landOpen`, `landEnsure`, strokes (`landStrokeStart` / `landDab` /
`landStrokeEnd`), `landFinish` (the lines), `landPlaceAt` / `landPlaceSet`, `landCommit` / `landAfter` (undo), the MAP
(`mapDraw0`, `mapBind`), `landExport`, `landImportFiles` / `landImportR2`. three-renderer.js `hq.landEdited(list, o)` and the
`HQ_LAND_STORE.src` branch of `_hqLandStream`.

**How the land is held.** The lattice is the runtime's own tile records (256 m tiles, 129² samples at 2 m, the bake's
`EWLT` fields: h, mat, forest, water). Only tiles he touched are kept (`E.grid`); every other sample comes from the START
function (`hqLandEdStartH` / `M`): a flat disc at 1 m, grass, the ice wall at r 2600 (a 14 m face up to 92 m, ice). A COAST
changes the start itself (an 8 m signed-distance field `E.cD`: beach 10 m, down to −14 m over 60 m); tiles he already
shaped take the difference, so his relief rides on the new coast.

**The runtime reads it from memory.** `hqLandEdInstall` swaps `HQ_LAND.baked` to `{ id: 'ed_…' (one per land), noHQ, own, edit }` (the
old one is kept and put back by `hqLandEdUninstall` when he leaves the land), lists every tile as baked and sets
`HQ_LAND_STORE.src`; `_hqLandStream` then files tiles from the editor (six a frame) instead of fetching. Gates on those
flags: no HQ drum (`hqLandHQSolid`, `_hqLandBuildHQ`, the flora's keep-off), no recipe forests or zones in the flora mix, no
lone trees or boulders on his grass / meadow / farm (the FOREST brush plants trees on any ground that takes them),
`hqLandSites()` is empty while editing. `hq.landEdited(list, o)` marks the chunks, water sheets and trees over those tiles
to rebuild; `o.far` rebuilds the far pass, `o.roads` the roads, `o.falls` the falls. The wrapper room is `__ed_land`
(the land room's shell, no doors). Brushes update the 3D view every 150 ms while held and the far pass on release.

**The tools** (left panel in land mode; MAP / 3D, TAB or M switches): SELECT; BRUSHES (raise, lower, smooth, flatten,
terrace, set, cliff, roughen; radius 4–400 m, strength, hard edge); PAINT (the 24 materials, forest density, water level,
dry, clear); LINES (ridge, valley, plateau, river, route, lane, trail, coast, lake: click points, ENTER ends, BACKSPACE takes
one back, a double click on the map ends too); MARKS (place, region, reveal, sight). Routes are graded to the type's limit
(two passes after a 40 m smoothing), flat across; a fill over 4 m becomes a bridge deck (the ground is left), over 2 m gets
rails both sides. Rivers run monotone downhill, never under the sea, carve a bed and set the water; the falls come from the
runtime's own rule. Lakes are rows of capsules for the far pass (every 24 m). Labels are plain (Route N, Lane N, Trail N,
River N, Lake N, Area N, Reveal N); a place takes its room's label.

**Places.** PLACE picks one of his rooms (each room once) and levels a square pad (half-side = half the room's larger side,
+3 m margin, eased back over 24 m) at the ground there. The inspector moves it (a new pad is levelled; the old one stays),
re-levels it, sets float (no pad), quarter turns and kind. The status line warns (never blocks) when pads overlap, a room is
gone or a pad crosses the ice wall. His rooms are NOT staged on the land in the game until E8: the export writes the land
zone into world.json `land.zone` and `hqWorldDocApply` applies `land` only when the world is `live`.

**Undo.** A stroke or a stamp is one step: the doc's vector patches (`doc.landEd`) + `step.land` = each touched tile before
and after (typed arrays). Steps are trimmed past 256 MB of snapshots (`undoMB`). A coast step recomputes the field from
`doc.landEd.coasts` on undo.

**Saving.** The vectors are in the project doc (`doc.landEd`); the lattice in IndexedDB v3 store `land`, one record a tile
(`<project>|<tile index>`), written 1.5 s after a change.

**Export** (FILE → EXPORT, with the rooms): `Assets/World/land/` = land.json (the runtime overlay: places, roads, bridges,
rivers, lakes as capsules, regions + regionGrid 32 m, revealPts, map, tiles, tileFormat, bake, and `edit` = his vectors),
land-map.png (the bake's shading, 4 m a pixel, 1400²), sea.bin (8 m), and the tiles whose sha changed (every tile he shaped
plus the start's non-plain tiles: the wall ring and the coast band). The bake id is the bake's rule: sha256 of land.json
(without the id) + the png, first 10 hex. world.json gains `land: { id, dir, ext, live, tiles, places, zone }`. The folder is
Assets/World/land/, NOT Assets/Land/ (the old bake the live game still reads). IMPORT (zip or R2) reads land.json's `edit`
block and the tiles; a delta zip keeps this project's tiles for the ones it lacks.

**Differs from the plan.** No full 2801² array in memory (tiles on demand). bake-land.js is untouched (its `gradeLine` did not
move; the editor grades roads with `hqLandEdGrade`). No junctions or signs are written for his roads yet; no ICE tool (paint
`ice` / `pack`). The map is the editor's own canvas, not map.js's ATLAS. Checked by a quick load in the sandbox only.

## E5 — the layout: rooms and hallways, forests with tree walls, dungeons (2026-09-29, token 20260929-editor-06-cors)

R2 files: editor.js, data.js, three-renderer.js. Repo: index.html (token), docs. mondo's ask, built over §5.7: rooms of different
sizes joined by hallways (dungeons, building interiors); a forest "dungeon" whose walls are trees (clearings = rooms, dirt paths =
hallways, no walking into the trees).

**The rows.** `{ k: 'space', x, z, w, d, rot?, round?, dirt?, label? }` (a room / clearing; `round` = the ellipse filling w × d;
`dirt` = a clearing in the path sheet) and `{ k: 'hall', pts, w, label? }` (a hallway / path). Picked, moved, turned, sized like
any row (the gizmo turns `rot`; a prefab placement turns it too).

**The plan.** `terrain.gen = { kind: 'plan', look: 'walls' | 'trees' | 'rock', … }`; a room with space / hall rows and no gen compiles
as `walls`. data.js `_hqTGenerate` `hand` branch: the mask is exactly `hqPlanIn` (walls: square hallway ends; trees / rock: round);
only door pads (+ lanes), the spawn (1.2 m), climbs and ramp / deck / bridge mouths are forced open (`keep: true` restores the
generators' forcing of props, people and features — FREEZE writes it); the door corridor carve stays, the pocket fill-in, the
return guarantee's seals and ramps do not run. Settings (HQ_TERRAIN_GEN.plan): walls `wallH` (open room 4 m, else the shell's h),
`wallKey`, `wallT`; trees `kinds`, `treeGap` 1.55 (trunks along the edge), `treeIn` 0.85, `spacing` 2.3, `depth` 7, `maxTrees`
700, `treeH` [4.2, 6.4], `treeTop` 5.5 (the camera ceiling); rock `wallH` (3.2). `_hqTPlanFinish`: the trunk line walks the traced
boundary (`_hqTTraceMaskWalls` at t 0.02), the band fills behind it nearest-first to the cap, the halls (+ dirt clearings) go
into `info.paths` (the renderer's path blend), and `genPlan.cold` lists the pieces no walk from the spawn or a door reaches
(`hqPlanReport`). The trees are ordinary thicket trees (each a blocker; the mask refuses the walker anyway). three-renderer.js:
the tree kit is made when a room has only a thicket.

**Perf note.** Each tree is its own model clone (the existing thicket path). 700 is the default cap; a big forest with long
paths hits it and the far band thins (the tab shows the count). Instancing the trees is the fix if it ever drags.

**The editor** (LAYOUT tab, between BUILD and GROUND): ROOM / ROUND ROOM (drag), HALLWAY (click points; ENTER ends, ESC drops,
BACKSPACE takes a point back, SHIFT = 45° from the last point; HALLWAY WIDTH option); LOOK (WALLS / TREES / ROCK — before the first
piece it is the look the room will take; after, it changes the room; switching to TREES over the default grass floor sets floor
grass_dark_fantasy and path dirt, mondo's ruling); the look's fields; the floor / path sheets; the readout (rooms, hallways,
trees or wall pieces; NOT JOINED pieces as buttons that select them; a door a way was cut to); REMOVE LAYOUT; FREEZE (a copied
room with a generated `rooms` / `halls` plan → rows: `rooms` → round spaces + paths with look trees, or rock when it had no
thicket; `halls` → spaces + hallways, walls). The first piece drawn gives the room its plan (one undo step with the piece). The
status line shows `layout n / n` and NOT JOINED.

**Dungeons.** world.json `dungeons[w_dgN] = { label: 'Dungeon N', look, levels: [{ room, y }] }` (the export already wrote the
table). NEW DUNGEON asks the look and makes `Dungeon N Level 1`: 96 × 96, closed with a 4 m ceiling for walls (floor dungeon,
walls bricks_3, paths cobblestone), open with the forest treeline for trees (grass_dark_fantasy / dirt), closed 6 m for rock
(cave_floor / rock_wall_1); one 14 × 12 room round the spawn. + LEVEL adds `Dungeon N Level M` 6 m lower on the list. Levels are
joined with the DOOR tool. Not built: the stacked levels on the map, mask grids and carve brushes (the layout replaced them).

**Quick check:** a scratch Playwright run (stand-in textures and tree model) opened the editor, made a walls dungeon, drew two
rooms and two hallways (27 wall pieces), switched it to TREES (299 trees): no new errors (the sandbox's `THREE.Scene is not a
constructor` at index.html load is old).


## E6 — roofs, the grab, sizes; the sky and the light (2026-09-29, token 20260929-editor-07-cors)

R2 files: editor.js, data.js, three-renderer.js. Repo: index.html (token), docs.

**mondo's asks first** ("a button that lets me hide the roof", "click on an object and move it and rotate it, R 45°", "different sized
trees, resize objects already placed"):
- **HIDE ROOFS** (top bar, C; `ED.roof = { off, h }`, localStorage `ew_editor_roof`): `roofHide` hides every `_ew_hqPart === 'ceil'`
  mesh in the shell / prop groups (the box shell's ceiling and a staged room's roof slab), and `bandClip` cuts at
  min(the level band's top, `roofCutY()` = ground at the spawn + h). The drum / ring / mezzanine shells don't tag their ceilings,
  so the cut is what opens them. Re-applied once a second (late models) and after every rebuild; off for PLAY HERE and close.
- **THE GRAB** (`grabStart` / `grabMove` / `grabEnd`): a left press on a visible thing (or on an already-picked shape) and a drag
  > 4 px drives the gizmo's pivot over `rayGround` (the SNAP), through the gizmo's own `dragStart` / `dragMove` / `dragEnd`, so it
  is one undo step and a prop moves live without a rebuild.
- **Keys:** R / SHIFT R = `turnSel(±45)` (props turn live, no rebuild), T = the gizmo SIZE, - / = (SHIFT: ×1.25) = `sizeSel`.
  W and E still switch the gizmo to MOVE / TURN.
- **Sizes** (`sizeOf`, `sizeRow`, `sizeSel`): a prop's `h` (or `span` when the catalogue sizes it by span, read from the catalogue
  when the row has none: the gizmo's SIZE used to drop the row's h), a tree's `h` + `r`, a grove's `h`, any other shape through
  `rowTransform` scaling about its anchor. People, doors, signs, openings, prefabs and kits keep their size. A tree row's `h` is in
  TERRAIN TILES (1.75 m; `_nrTree` also varies each tree 0.85-1.3 ×) — SIZE shows metres (`treeTile()`).
- **Placing:** the placed row is selected (the tile stays armed). TREES tab `sizeStrip`: TREE SIZE (`ED.opts.treeSize` m, 0 = the
  game's) + VARY (±20 %); MODELS: `ED.opts.propX`.
- **Engine:** `_hqPlaceProps` scales the prop's blocker (`rad`, `top`, `rect`) by h / catalogue h; `hqTerrainCompile` keeps a
  tree row's `face`, and the terrain's `plantTree` turns it by `face` (the seeded spin is still drawn, so the other trees keep theirs).

**THE SKY tab** (editor.js THE SKY AND THE LIGHT, `skyHtml` / `skyWire`; left palette SKY; his rooms only). Keys the runtime
reads (surveyed 2026-09-29): `shell.sky` = night (0/1), day, clouds, stars, nebula, tint, tintAmt, fog { color, density per m,
amount, top, band }, scenery (none, cosmic, divine, infernal, ruins, pyramids, crystals, orbs, eyes, islands, city, space, dark, sea,
wreckage, wonder, holosim), density, doors, landmarks [{ kind, deg, dist, y, s }] (mountain, tower, gate, dome, peak, castle,
skycastle, stairway, waterspout, whale, eye), lock; `shell.look` = a HQ_ROOM_LOOKS OBJECT (the select stores a copy); `shell.rig`
{ az, el, color, intensity }; `shell.mood` { light, ambient }; `shell.atmos` ({ kind } / false / absent); `shell.fog` (closed
rooms); `shell.lights` [{ x, z }] (+ LAMP tool). A sky needs `shell.open`. `sky.world/rim/wall/sea` are NOT room keys (battle
maps' `env`). Edits: `shellPut(top, after)` = one step on `shell.<top>`; the live sliders (`SKY_LIVE`: day, clouds, stars, nebula,
tintAmt, fog amount/top/band/density) write the live room on `input` (`skyLive`, the scene fog for density) and commit without a
rebuild on `change`; the rest rebuild.
- **The clock:** data.js `hqRoomClock` — a room with `sky.clock === true` is clocked (zone 'own', north up, `sky.lock` pins it).
  PREVIEW overrides `window._hqClockHour` and calls `ThreeRenderer.hq.clockSnap()` (restored by THE GAME'S HOUR, PLAY HERE, close).
- **Region weather:** a land region's inspector (E4 MARKS → SELECT a region) takes `weather { sight, fog }`; `hqLandEdIndex`
  writes it on land.json's region; `hqLandDiscIndex` files it (`HQ_LAND_DISC.weather`); `hqLandWeatherAt(x, z)` → { fog per m }
  (sight → 1.7 / sight); three-renderer `_hqLandWeatherTick` (after the discovery tick) eases the dry fog's density to it and back.

**Quick check:** a scratch Playwright run (stand-in textures) placed a prop and a tree, R R = (face 90, h × 1.1), sized and turned the
tree, grabbed a prop 2.5 m to the east (one undo step), HIDE ROOFS on the library's main hall (the drum opened from above), made
the room outdoor, set clouds, scenery, clock, a landmark, a look, a key light and a lamp, previewed 20:00: no new errors (the
sandbox's `THREE.Scene is not a constructor` at index.html load is old).

## E7 — THE ZONE TOOLS (ZONES_PLAN §8.2; 2026-09-30, token 20260930-zones-05-cors)

R2 files: editor.js, data.js. Repo: index.html (token), docs.

- **Door FLAGS** (the door inspector, his world only; editor.js `doorFlagsHtml` / `doorFlag`): SECRET writes `secret: true` on the door
  AND its partners (`hqDoorPartners`), one step; the runtime's draught (no leaf, no plate, the wall's panel, the protractor, a dashed
  secret edge on the map). ONE WAY = the door has no partner: ticking it deletes the far door(s) that lead back and sets this door's
  action to `{ room }` (you arrive at the spawn); unticking stands a RETURN DOOR in front of the far spawn (`hqDoorPair`, the DOOR
  tool's own), secret if this one is. LOCKED = `minClearance` (L2-L6, blank at 0) + `requiresKeys` (the story's gates, map.js reads
  them). The outliner's door label shows secret / L / keys.
- **SITE** (the room inspector's ZONE AND SITE; `siteSet`): `rooms[id].site` = an `EW_MAP_META` id (sorted by label), blank = none
  (no fight: `hqEncounterRoomOk`). A library COPY still drops `site` (`HQ_WORLD_DOC_RULES.copyDrop`); set it here.
- **ZONES** (world.json `zones[w_zN] = { label, rooms, anchor, hub?, slot?, color? }`; data.js `hqWorldDocIsOwnZone`,
  `hqWorldDocNextZoneId`, `hqWorldDocZoneOf`): + NEW ZONE (the outliner; the open room goes in it), a room's ZONE select, ✎ on a
  zone = name, ON THE MAP (a node of its own, or JOINS an existing `DOOR_HQ.hubs` place, e.g. the Woods), the room the node opens
  on, the map spot x / y (HQ_WORLD_L units, blank = the ring), colour, delete (rooms stay). The outliner lists rooms under their
  zones (coloured bar) then NO ZONE. Deleting a room takes it out of its zone; DUPLICATE keeps the zone. A zone row with `parts` is
  still a STAGE zone laid over `HQ_WORLD.zones` whole. RUNTIME: `hqWorldDocApply` turns his zone into a `DOOR_HQ.hubs` row claiming
  its rooms by id (`_hqWorldDocZoneHub`; `hqHubOf` reads `rooms` first) + `HQ_WORLD_L.slots.hub[w_zN]`, or appends the rooms to the
  joined hub; it clears the overview caches. Only read when a published world loads (the editor applies rooms only).
- **LEADS TO** (left tab; `leadsGraph` / `leadsSvg` / `leadsBig`): `hqWorldGraph()` edges out of his rooms (+ his doors whose room is
  gone), one line per pair of rooms: dashed = secret, arrow = one way (doors one direction only), red = nowhere (`hqWorldDocDoorCheck`
  or no room), L / K = locked. Nodes coloured by zone, grey = built-in, white ring = here; a spring layout seeded on a ring sorted by
  zone. Click a room to go there; OPEN BIG = the same in a 960 × 600 modal; the NOWHERE doors are listed as buttons. Redrawn per step
  (`ED.stepNo`).
- **AUDIT SIGHT** (data.js `hqPlanSightCheck(room, exitIds)`): an EXIT = a door whose far room is outside the room's zone (every door
  when the room is in no zone). Each exit's spot = 2.4 m in from its door (`hqPlanDoorSpot`, the map's landing); a pair is IN VIEW
  when every 0.5 m sample of the straight line between the spots is in the plan (`hqPlanIn`, square ends for walls), the first /
  last 3 m forgiven (a door's cut mouth); two exits whose spots are within 1 m of one `space` are IN ONE ROOM. Blue posts = exits,
  red line = in view, orange = one room. Layout rooms only.
- **AUDIT 8×8** (`hqPlanFightPatches(room)`): per `space`, an axis-aligned 8 × 8 patch at 1.75 m (14 m) centred in the space (1 m
  candidates, nearest the middle first), every tile corner in the plan. Green square = found, red over the room = none; the status
  line names the rooms without one. FIGHT (the real window at the cursor) stays.
- `hqPlanOfRoom` builds the plan uncached from `hqRoomExpand`: `hqRoomPlan`'s WeakMap keys on the arrays' identity, which the
  editor's in-place patches keep, so it would go stale while editing.
- **Quick check:** a scratch Playwright run drew a layout (20 × 20 + 10 × 10 + a hall), two doors (a pair and a one-way to a new
  room), made a zone with the site Mount Shasta, flipped secret / locked / one way / two way, ran SIGHT + 8×8, the LEADS TO tab and
  OPEN BIG, then undid everything: no new errors (the sandbox's `THREE.Scene is not a constructor` at load is old).

## E8 — THE ARENAS: the Δ maps become 8×8 cuts of each site's own room (2026-09-30, token 20260930-arenas-01-cors)

R2 files: data.js, three-renderer.js, map.js, match-select.js, battle.js, state.js, online.js. Repo: index.html (token),
bake-arenas.js (new repo tool), docs.

mondo (2026-09-30): PvP maps are a fixed 8×8 and have nothing to do with the exploration battles; "i dont need an arena map
for every little room, just the main sites or sites big enough to have an 8x8 area in them"; "they will look better right? yes
replace the delta maps"; "dont delete the voxel editor yet". Replaces §5.10's markers: nothing is placed by hand.

- **The pick** (`bake-arenas.js`, repo tool; data.js `HQ_ARENA_RULES.picks`): per launch site, the site's rooms are compiled
  (the entry part first, `DOOR_HQ.siteRooms.entry`, then the rest biggest first; `hqFieldRoomOk` drops a room with a sea) and
  every 8×8 window of THE FIELD's lattice is judged with the game's own raster (`hqFieldRaster`, `hqFieldReach`). It FITS when
  the Δ house tiles (spawn rows 0 / 7 + egress rows 1 / 6 at x 2..5, the nexus x 3..4 y 3..4) are level-0 walkable floor with a
  seat (no water, wall top, bridge), the spawns' apron is at most +1, no walkable cell is over +2, at most `obstacles` (8) cells
  are blocked and each blocked cell belongs to a FEATURE (a blocked lattice patch of at most `featureMax` (12) cells that touches
  no lattice edge: a tree, a rock, a prop, a pool; never the room's edge, a cliff wall or a building), and every walkable cell is
  reachable from both spawn rows. Score = min(cover, 12) − 0.75 × |cover north − cover south| − metres to the room's BATTLE
  marker / 12 (cover = raised + blocked cells off the house tiles). The first room with a fit wins; none = the site keeps its Δ.
  A pick row: `{ room, ox, oz, base, open, keys, cells }`, `cells` = 64 pairs (key index base 36 + level + 1). ~3 min headless.
  RERUN IT after a site room changes (the launch warns `[ARENA] the window no longer fits` and keeps the baked board).
- **At load** (`hqArenaRegisterAll`, after hqFieldRegister): each pick replaces `PREBUILT_MAPS[<site>_delta]` (hqArenaEntry:
  `_mfNew` 8×8 on MF_DELTA_BASE_H + the Δ bed, the Δ's tints, spawns P2 row 0 / P1 row 7 x 2..5, the `nexus` object at 3,3) and
  its EW_MAP_META row (`label` "<site> Arena", `arena: true`, `room`, `desc`). The id stays `<site>_delta`, so GAME_MODES,
  compatibleMaps, the ranked pool (server.js list), the challenges, the training pool and the HQ crossing all get the arena. The
  Δ's layout stays under the id until the upgrade and is kept in `_HQ_ARENA_SITE_LAYOUTS` (hqFieldLayout reads it for the
  site's other rooms' encounters).
- **At launch** (`hqArenaUpgrade(id, { compile })`): needs the room's floor plan (`room._terrainInfo`); rebuilds the entry in place
  from the live raster, attaches THE FIELD's full record (`hqFieldBuild(...).field`, id = the arena id, `arena: true`: tops,
  levels, cells, fixed, doors, edges) and swaps `MAP_LAYOUT_PRESETS[id]` to `hqFieldLayout(site, …, { terrain, open, look, dome })`.
  map.js `_hqArenaWarm(id, urgent)` surveys the room on the worker then upgrades (never while a fight is on that map);
  `_msArenaGate` at the top of `_msConfirm` waits for it under a small "SURVEYING <ROOM> …" card (no worker = the sync compile
  under the card). Warmed by: the match-select card (`useEffect` on the pick), state.js `applyGameMode` (before the layout is
  read), online.js ranked `match-found` / room join (the guest surveys while the rosters are filed).
- **In battle** (three-renderer.js `_arenaLatch` in `activate()`, `_arenaRun`, `_hqBattleRoom`): no encounter record → the arena's
  `hqArenaRun(activeGameMode)` `{ room, field: { board: { N, C, x0, z0, terrain } }, fieldId }`, latched at activate (cleared at
  deactivate) so a survey that lands mid-fight changes nothing until the next fight. Everything an encounter field does follows:
  the room built round the board, THE TRUE GROUND, the room's lights, fog and look. battle.js `fieldCellFixed` reads the arena's
  flags when there is no encounter. Online: the host and the guest each read the same room; a guest whose survey has not landed at
  activate sees the same board without the room (nothing relayed; the engine is the host's).
- **Match select**: arena rows say `8×8 ARENA`, the site file `· arena · 8×8 cut of the site's own room`, the SITE form's board
  `ARENA`, the filter chip `8×8 MAPS` (arenas + the Δ boards left + the facility boards). The complex parts' own Δ boards
  (`<roomId>_delta`, `area`) stay registered for the HQ encounter fallback but are no longer listed (MS_MAP_LIST rows carry `area`).
- **The bake of 2026-09-30**: 33 arenas of 38 sites. Keep their Δ: Heaven, Hell, the Backrooms (no 8×8 fits), the Revenge and
  the Bermuda Triangle (their rooms are seas). The Fairy Forest and the Lodge fit once free-standing trees count as obstacles.
  Every pick was rebuilt through hqArenaUpgrade headlessly: all 33 match their live rooms level for level.
- **Fixed on the way** (three-renderer.js `_hqBuildRoomInBattle`): the scratch record had no `clockLamps`, so the first night-lamp
  prop threw and every prop after it was dropped from the room round an encounter's field (now the arena's too).
- **Quick check:** a scratch Playwright run launched TDM on the Moon and Camelot arenas from the classic menu: the survey landed
  (the Moon in 0.8 s), the room stood round the board on the true ground, no new errors.
- **The Looking-Glass keeps its Δ** (2026-09-30, token 20260930-arenas-02-cors; R2 data.js, three-renderer.js): mondo: "keep the
  looking glass delta map, for that one there needs to be a chessboard in the looking glass explorable area". `HQ_ARENA_RULES.keep`
  (bake-arenas.js skips those sites, hqArenaRegisterAll never replaces them): 32 arenas. THE BOARD: a terrain feature `{ k: 'board',
  x, z, n, cell, keys, colors, h }` (data.js hqTerrainBoard / _hqTBoardFloors / hqTerrainBoardAt / hqTerrainBoardMarks): a flat
  plateau under it, no scatter on it, every square a textured mark (three-renderer.js _hqBuildMarks rect `tex`), THE FIELD's raster
  keys each cell by its square. THE GARDEN's chessboard: x −7..7, z 1.75..15.75 (on the battle lattice), marble_light / marble
  tinted as the Δ, the rim path moved outside it, the riser / lesson sign / signpost moved off it.
- NOT done: the voxel editor (kept, mondo's word); the Δ builders (still run for the sites without an arena and as the tints /
  layout source); the HQ panels' "CROSS ▸ Δ" wording.

### E8 follow-up — online PvP deals only the 8×8 arenas (2026-10-06, token 20261006-pvp-arenas-01-cors)
mondo: "why is online pvp using the old voxel maps and not the new arena maps? why are they doing maps that are anything other
than 8x8?" Three causes, all fixed:
- server.js MAP_POOL still listed the sites with no arena (heaven, hell, revenge, bermuda: old voxel Δ boards) AND every full
  launch map (16×16 to 24×28), and `pickRandomMap` took every map with `team >= teamSize`, so a 4v4 queue drew full maps too.
  The pool is now read at boot from data.js `hqArenaPvpPool()` (the `<site>_delta` rows that became arenas + the
  HQ_ARENA_RULES.keep boards, all 8×8; the server literal is the fallback) and every queue is 4v4 on it.
- The friendly room drew from every `isDelta` row with teamSize 4: the ~60 area parts' Δ boards, the facilities and the
  voxel Δs. online.js `_friendlyGetCompatibleMaps` now filters to `hqArenaPvpPool()` (Clash keeps its stage).
- Online launched 600 ms after both locks, before the arena's room was surveyed, so the fight drew the bare baked board with
  the old Δ's scenery. online.js `_onlineArenaPrep` surveys on each seat as soon as the map is known, re-runs applyGameMode
  once the room is attached, and the host's `_tryAutoStartRanked` waits for its own room and the guest's (relay
  `arena-check` / `arena-ready`, skipped by the replay recorder), at most 45 s.
Rerun bake-arenas.js after a site room changes; the pool follows the picks on the next server boot.

### E8 follow-up — every arena is 12×12 (2026-10-06, token 20261006-arenas12-01-cors)
mondo: "Let's make all arena maps 12x12 instead of 8x8. Make whatever changes necessary to the maps to achieve this".
- data.js `HQ_ARENA_SIZE = 12` drives HQ_ARENA_RULES.size and HQ_FIELD_RULES.size. `hqArenaHouse(S)` centres the house tiles:
  spawns x 4..7 on rows 0 / 11, egress rows 1 / 10, the 2×2 nexus at 5..6 (on an 8 it gives the old 2..5 / 3..4).
  `_mfDeltaNew({ S })` builds a bigger Δ; the two kept boards (Göbekli Tepe's TELL, the Looking-Glass garden) were re-authored at 12.
- bake-arenas.js: the strict open-ground pass first (obstacles 18 of 144), then THE WALLED CUT for a site with no open window:
  the room's own walls / buildings stand inside the window as solid cells (drawn as the room, as an encounter draws them),
  a walkable pocket no spawn reaches counts with them, `wallMax` 48 in all, no walkable cell over `topMax` 3 levels; house tiles
  still clear, flat and joined. `node bake-arenas.js prebuilt_<site> …` bakes only those sites.
- Rooms opened for it: THE HALLS (the Lodge's entry) 14 × 15 → 22 × 22 m (its umbrella stand + plant moved to the corners); the
  Woods clearing (Fairy Forest) gained `gen.open` disc { x 0, z 10, r 10.5 } round the crossroads.
- Result: 31 site arenas + the 2 kept boards, all 12×12, = the online pool (33). Hell, Revenge, Bermuda still have no arena
  (they keep their 8×8 voxel Δ and stay out of PvP, as before). Facility boards (Training Room, Holo Sim) stay 8×8.

### E8 follow-up 2 — THE ARENA SIZES: 9×9, 10×10, 11×11 + 5v5 (2026-10-17)
mondo: "i would like to add 9x9, 10x10, and 11x11 maps ... an option to play 5v5, where each spawn zone is 2x3 and the cube spawns
in the middle front or back ... for the 9x9 and 11x11 ... the middle nexus can be 3x3 ... The 10x10 is for 4v4 ... Make them the
same way as the current 12x12s like a cutout of the exploration map".
- data.js `HQ_ARENA_EXTRA_SIZES = [9, 10, 11]`, `HQ_ARENA_TEAM_BY_SIZE` (9 / 11 → 5v5, 10 / 12 → 4v4). Picks: HQ_ARENA_RULES
  `picks9` / `picks10` / `picks11` (own `<ARENA PICKS N>` markers), same record as `picks`. Each registers as its own board
  `<site>_<S>x<S>_delta` + an EW_MAP_META row wearing `sizeOf` (the site's 12) and `arenaSize`; `hqSiteId` strips the size;
  `hqArenaSizesOf(site)` lists a site's cuts; `hqArenaPvpPool(team)` deals one team size (4: 10s + 12s, 5: 9s + 11s).
- THE 5v5 HOUSE (`hqArenaHouse` / `hqArenaHouseTiles`): each side's zone is 2 rows × 3 at x (S-3)/2.., the Cube on the back-middle
  (edge-row) tile, the 5 seats front-middle, front flanks, back flanks; the egress row in front (rows 2 / S-3, open, ≤ 1 level);
  the 3×3 nexus at dead centre. The entry carries `house` (zones, cubes, nexusSize 3); map.js `_arenaHouse()` feeds
  autoGenerateSpawnZones (the block instead of a row), _autoPlaceTowersIfNeeded (the Cube tiles) and _initNexusFromObjects
  (zoneSize 3). 10×10 uses the 4v4 row (x 3..6, egress rows 1 / 8, 2×2 nexus 4..5). The Cube could sit front-middle instead
  (swap `cubes` and the back-middle seat in hqArenaHouseTiles).
- bake-arenas.js `--size N` (caps scaled by area: hqArenaCaps; `--json` / `--apply` to bake sizes in parallel, ~3 min each).
  Result: 31 at 9×9, 30 at 10×10 (no Heaven), 26 at 11×11 (no Heaven, Olympus, Fairy Forest, Agartha, Haunted House): their
  rooms have no window of that size whose house tiles are all open floor. Göbekli Tepe + the Looking-Glass (kept, hand-authored)
  stay 12 only. All 87 extra boards build in ~11 ms at load.
- Picks: the squad desk's 4v4 / 5v5 switch (map.js `SQ_DEPLOY`, localStorage `ew_sq_team`); VS CPU's terminal lists each site
  once with a BOARD SIZE chip row (match-select.js `sizesFor` / `resolveIdx`); the friendly room has MAP (site) + BOARD SIZE
  selects (online.js `_friendlyRefreshMaps`); Quick Play queues the squad's size (server.js `queue-join` 4 | 5, `pickRandomMap`
  by team). A guest whose squad is short of the room's size cannot lock in (online.js `_ewSquadAutoLock`).

### E8 follow-up 3 — Göbekli Tepe's voxel Δ remade as a room map: ENCLOSURE E (2026-10-20)
mondo: "i want all of those voxel maps remade as new maps ... built with the tools in the map editor, and remember to design them
with square tiles in mind ... Dont delete these voxel maps". Thread "New Göbekli Tepe map" (one of eight, one per voxel map).
- **The room:** THE TELL (`site_prebuilt_gobekli_tell`) shell w 110 → 136 so the mound reaches east; a new round space
  (x 43.75, z 0, 37 m) east of D, a hall west to hall C and one south to the east flank. Inside it the pit, cut one battle level
  (1.75 m), laid out on THE FIELD's squares: the 12×12 board is x 33.25..54.25, z −10.5..10.5 and every piece is on whole squares,
  half-turn symmetric: corner BASTIONS (3 stone blocks each, 2 levels, a brazier on each), a bedrock TERRACE each flank (1 level,
  a built stair at its end), the two great T-pillars either side of the nexus (3 levels), two lesser pillars (2), two stone
  benches (1); the middle four columns stay open so the 9/10/11 cuts fit. Ring wall 1.8 m on a ledge round the pit, ten lesser
  pillars set in it facing in, the walk round it. All rows the editor writes (space, hall, plateau sink, ramp built, wall, path, props).
- **Gotchas found:** a terrain room's props are NOT obstacles to THE FIELD (only trees, walls, the plan's mass) — each battle pillar
  carries a hidden wall row inside its shaft (Stonehenge's sarsens are walls the same way). A wall row is a CAPSULE to the raster
  (t/2 + bodyR 0.34) but draws as a box L + t long, so a long block bleeds a square past its end: a one-square block is a
  ZERO-LENGTH row with t 1.75 (a box exactly its square, read on that square only). A one-square sink between two blocks goes OUT
  (its edge samples fail the slope), so those corner squares stay terrace.
- **The cut:** `HQ_ARENA_RULES.within[site] = { room, x, z, r }` (bake-arenas.js: that room only, windows centred within r) —
  Göbekli Tepe left `keep`; picks at 12 (58,20), 11 (59,20), 10 (59,21), 9 (60,21). Online pool: 12 + 10 (4v4), 11 + 9 (5v5).
- **The old board:** `HQ_ARENA_RULES.voxelKeep` (shared with the Looking-Glass / Dutchman threads; Göbekli Tepe added to it,
  `keep` is now empty): hqArenaRegisterAll files the old voxel Δ as `prebuilt_gobekli_12x12_delta` ("Göbekli Tepe Δ · voxel",
  `voxel: true`) — a plain Δ row, so VS CPU lists it and the online pool never deals it.
- **Night:** even rounds are night (map.js getCurrentCyclePhase), so the pit reads by its four braziers on the bastions.

### E8 follow-up 4 — THE OWN ARENAS: voxel maps remade as rooms (2026-10-20, thread "New Holo Sim map")
mondo 10-20: "i want all of those voxel maps remade as new maps. Even the training room and holo sim. They should be able to be
built with the tools in the map editor ... design them with square tiles in mind". One thread per map.
- `HQ_ARENA_RULES.own.<mapId>` (data.js, after hqArenaRegisterAll) = a board CUT FROM A ROOM BUILT FOR IT: `{room, ox, oz, base,
  open, keys, cells}` like a site pick, but hand-placed (no search). The runner `hqArenaRegisterOwn` swaps PREBUILT_MAPS[id] for the
  arena entry (same id, so every use keeps working: tutorial, match select, range console) and keeps the voxel board as
  `<id>_voxel`, labelled "<Label> · voxel" in match select (its layout preset + site layout copied). Facility rows stay out of the
  online pool. `node bake-arenas.js --own <id>` re-reads the window and rewrites the `<OWN PICK id>` line.
- ROOM 404 · THE HOLO SIM = DOOR_HQ.rooms.facility_holosim: a 31.5 m (18-square) closed box, every surface the `holo` sheet at
  1.75 m (floor via HQ_TERRAIN_RULES.tile, walls via the new shell `wallTile`, ceiling `ceilTile`), so the projected grid IS the
  battle grid. Lattice is 18×18 from -15.75, board window ox = oz = 5 (cells x,z ∈ [-7, 7]; cell centre = -6.125 + 1.75·i).
  Cover = WALL rows t 1.75 with zero length (exact one-square cubes; the free feet stand on the top), h 1.75 = 1 level, 3.5 = 2.
  Corner block terraces, north exit arch, east gallery (bridge + racks/monitors/console/chairs), west monoliths, corner orbs.
- three-renderer: `holo` / `holo_red` sheets are self-lit wherever they land (_hqMat, terrain walls, _hqTerrainMat emissive) —
  before, only the battle tile sheet glowed. Shell `wallTile` overrides the 3.2 m wall texture repeat.
- ui.js `_tutorialLaunch` waits for an arena's room survey (like _msArenaGate) so the HIGH GROUND lesson opens in the room.

### E8 follow-up 5 — THE TRAINING ROOM on THE OWN ARENAS (2026-10-20, thread "New map: Training Room")
Same ask as follow-up 4. `prebuilt_training` = `HQ_ARENA_RULES.own.prebuilt_training` (window 5,5 of the room; `node bake-arenas.js
--own prebuilt_training`), the voxel board kept as `prebuilt_training_voxel` ("Training Room · voxel").
- THE ROOM: data.js `DOOR_HQ.rooms.training_hall` (inside DOOR_HQ.rooms after Room 64's `training`; `site: 'prebuilt_training'`, not
  linked into the building — Room 64 stays the walk's training room). 18 × 18 squares (31.5 m), 4 high; terrain features + marks +
  props only. THE MATS = a `board` feature (8 × 8, urban:RubberNonSlip5a / 1a, plateau 0.06) at the centre, x / z −7..7; red tape
  lines round it; west BLEACHERS (six `tier` wall rows 0.44 up / 0.875 deep, seats instanced, a walk behind, two end walls); east
  MEZZANINE (a grate bridge 2 squares up, the `steel` ramp stair along the north wall, a pipe rail, four columns, desk + CRT +
  monitors on it, lockers + benches under it); north: wall pads, clock, banners, armour-stand dummies; south kept low. 8 shell
  lights, mood ambient 2.0, inline `look` bloom 0, fog density 0.
- Draw calls (perf lens, battle, 1280×800): the room ~230–500 a frame by pose; the voxel board's scenery read 3312 in the same probe.
  Wall pads cost 37 meshes each, `balusters_b` rails ~60 (use model 'pipe'), a text mark one call each (the tape is plain lines).
- Tutorial fixes found walking the lessons on it: map.js autoGenerateSpawnZones skips relocation while `window._tutActive` (the
  lesson's pinned tiles were being overwritten by the spawn rows — already broken on main); ui.js `_tutPoll` passes a P1 unit's turn
  on a `cpuDone` step after 1.2 s (`_tut.passing` lets the gated end through) — a Press refund left the unit up with no allowed action.

## THE CREATIVE CONTROLS + GAME ROOMS THAT PICK (2026-10-05, token 20261005-edcreative-01-cors)

R2 files: editor.js, styles-editor.css. Repo: index.html (token), docs. mondo: "need to make the editor more intuative and simple controls
like in minecraft creative mode … why the fuck do i have to hold down right click to move around … i loaded a map from the game to try
to edit it, clicking on an object does absolutely nothing".

- **The dead click (root cause):** a library (game) room's rows carry no `id` (only his rooms get `hqWorldDocRowIds`), and the pick
  proxies are built only for rows with an id, so not one prop picked; the palette was also hidden in the library. Now `enterRoom`
  gives a library room's rows ids NOT ENUMERABLE (`libIds`: the game's room object never carries them into a JSON copy or the survey),
  proxies only take the room's own props (identity or id), and the palette shows.
- **A game room edits as his copy:** `own()` is the guard every action calls (was `editable()`): in the library it copies the room
  (`hqWorldDocCopyRoom`), overwrites the copy's row ids with the library's (doors keep their own) so the pick stays the pick, keeps
  the eye, and lands the change on the copy. The step carries `lib`: undoing it goes back to the game room. A game room he already
  copied opens as his copy (`copyOf`: `edit.from`; the library pick, `?edit=`, the pause menu's EDIT). A brush press only makes the
  copy (the next press brushes: the field is rebuilding); a grab started on a game room waits for the copy (`_down.wait`) then drags.
  COPY INTO WORLD / MAKE MY COPY = `own()`. The inspector edits a game room's fields (the first change copies).
- **The fly (`tick`, `flyDown`):** W A S D level with the ground wherever the eye looks (arrows too), SPACE up, SHIFT down (not while
  SHIFT is busy: SHIFT + a key or click, a piece's 45° lock, a brush stroke), W W = sprint ×3; eased velocity `ED.vel`. Q / E no
  longer fly; W / E no longer switch the gizmo (top bar buttons; T toggles SIZE).
- **Mouse look (`ED.look`, `lookSet`, `lookUi`):** E or a click on empty ground with nothing picked = pointer lock + crosshair (`#edCross`,
  `body.ed-look`, the panels dim, the gizmo `enabled = false`); E or ESC frees it (`onLockChange` follows the browser's ESC;
  `pointerlockerror` / a refused promise drop it with a toast). While looking every click works at the view's middle (`ptr(e)`):
  LEFT pick / hold + turn = grab (`_down.mv` counts mouse travel), RIGHT = place (`placeAt`: the armed tile or click tool, else
  `duplicateSel(point)` = a copy of the pick there), MIDDLE = take in hand (`pickBlock`), wheel = fly speed. Flying moves the
  aimed grab / ghost (`hover` from `tick`). A modal or a menu frees the mouse.
- **With the cursor:** as before (pick, drag, gizmo, draw tools) plus RIGHT click = place (`ED.rmbAt`, under 5 px of turn), RIGHT
  drag = turn the eye (pointer lock while held), MIDDLE pan, wheel dolly.
- **The hotbar (`#edHot`, `hotPush` / `hotUse` / `hotUi`, localStorage `ew_editor_hot`):** nine slots; a BUILD / GROUND / LAYOUT tool or
  a palette tile picked from the panels goes in the first empty slot, else the slot in use; 1-9 arm a slot (`palFind` resolves a tile
  across the tabs), 0 / V = the empty hand.
- **Quick check (scratch Playwright, real bucket assets):** the Cafeteria from the library: 92 proxies (was 4), a click picks the
  serving line, a drag makes Room 2 (from cafeteria) and moves it 1 m, R / = work, W / SPACE / SHIFT fly, E locks the pointer and the
  mouse turns the eye, a MODELS tile goes in slot 1, RIGHT click places it, undo goes back to the game room. No page errors.

## THE SHAPES (2026-10-05, token 20261005-edshapes-01-cors)
mondo: "take inspiration from minecraft and minecraft building mods that let you place shapes and terraform quickly and easily".
A SHAPES palette tab (between BUILD and LAYOUT) of WorldEdit-style stamps, DRAWS rows `how: 'stamp'` with a `form`:
- **disc** (drag from the middle out): HILL (bell, `hard` = a dome), MOUNTAIN (peak, `hard` = a straight cone), VOLCANO (cone
  with a crater from 0.3 R in, the floor at 0.55 H), MESA / PIT (SET the ground to press height ± HEIGHT inside R, a smooth
  skirt of max(1, 0.3 R) outside it), BOWL (an upside-down hill), ROUND WALL (a `kit` row, `hqRingWalls` at r, h = wall height,
  t, n = round(2πr / 2.5) clamped 8-64, the wall sheet).
- **rect** (corner to corner): BLOCK UP / BLOCK DOWN / LEVEL (SET to press height + H / − H / = press height; smooth skirt
  1-4 m outside the box).
- **line** (end to end): RIDGE / TRENCH (a bell across, half-width SIZE / 2; `hard` = sheer sides).
- A click (or RIGHT click, or a drag under 0.5 m) stamps one SIZE big where it lands (a line's click runs 3 × SIZE across the
  view). `[` `]` change SIZE. Options: shapeR (SIZE), shapeH (HEIGHT / depth), shapeEdge (smooth | hard), OPT_FIELDS per tool.
- `stampAt(tool, a, p)` builds the whole delta grid the same way strokeStart does (decode terrain.hmap onto the lattice, edit a
  copy, `hqGridEncode('i16')`) and commits ONE `terrain.hmap` step; the room rebuilds. In a game room the first stamp makes the
  copy (own()), the next one lands. A room with no terrain (indoor) gets a toast. `stampShow` = the preview (the ring for a disc,
  a box for a block, a bar for a line), ringUpdate draws `ED._disc` for stamps too.
- Quick check: w_room1 and a fairy forest copy: hill, mesa, trench, block and round wall each one undo step, no page errors.

## THE MODULAR KIT (2026-10-05, token 20261005-edmodular-01-cors)
mondo: "need a modular way to make buildings". A MODULAR palette tab: FLOOR, WALL, DOOR, WINDOW, STAIRS, ROOF that snap to a
cell grid (opts.modC, 4 m, lines at multiples of it from the room's middle) and stack by floor (opts.modS; `[` `]` = the floor
below / above; with the LEVEL band on, it follows the floor). Floor height opts.modH (3.5 m). Each piece row carries
`bld: { b, s }`: b = its building's ground-floor height, taken from the nearest kit piece within 60 m, else the ground (0.25 m
steps) where the first piece goes; s = its floor. Upper floors aim on the floor's own plane (modPt), not the ground.
- FLOOR = a plain `bridge` slab over the dragged cells (the ground floor's top b + 0.06, 0.2 thick; upper floors b + s·H, 0.28).
- WALL = one `wall` row per cell edge (a drag runs along the dominant grid line), `y` = its absolute top, on upper floors `y0`
  = its foot (in the slab). An edge that already has a wall on that floor is skipped.
- DOOR / WINDOW = the old openingAt; on a kit wall (`bld`) the gap goes in the middle of its cell.
- STAIRS = a built `ramp` (stairs + built) from this floor to the next, 2.25 m of run per metre of rise rounded up to cells,
  2 m wide on the cell's middle line, `foot` = b (three-renderer.js _hqBuildBuiltStairs draws the mass down to it).
- ROOF = a ceiling slab (0.4 m overhang) on the floor's top + two `tier` wall prisms (`quad` + `slopeTop`, `y0` = the top)
  rising opts.roofH to a ridge along the long side, the roof sheet opts.roofKey (urban:MetalCorrugatedPainted1a).
Engine (data.js): a wall's `y0` (an absolute foot; over the ground it is HUNG); hqOpeningPieces measures sill / lintel / pane
from `y0` on such a wall; hqTerrainFeet: a walker on a slab is stopped by a wall standing higher than a climb over it
(hqTerrainWallAt's new `minTop`; plan walls left as they were), and where the ground rises over the slab (a stair on a floor)
the ground is the surface. Quick check: a two-floor 12 × 8 m house; the upper walls stop the walker on the slab, the stairs
walk 0 → 1.75 → 3.4, the roof draws, no page errors.

## THE STAIRS PACK IN THE EDITOR (2026-10-05, thread "stairs, railings and verticality")
mondo: "make sure those stairs and railings and anything else you added are incorporated into the editor".
- BUILD: STAIRS takes the pack kind (empty = the room's own), a railing model over the kind's own, the sides (both / left / right /
  none) and a centre handrail (a `pipe` rail row, `block: false`, on the flight's own [x, z, y] ground line). ESCALATOR: drag the way
  it climbs, the run is rise / tan 30°, w 2. RAILING: a chain of rail rows (model, WALL or GRIND ONLY = `block: false`, SPAN END TO END
  = y0 / y1 at the ground under each end: a rail across a gap). CURVED RAILING: drag from the curve's middle out; ARC° centred on the
  release bearing. MODULAR STAIRS takes the railing + sides too.
- ADD: skate rail (pipe, grind only), rail across a gap (`y`, grind only), escalator; the stairs row no longer forces concrete.
- Inspector: `model` lists the stair kinds on a ramp row and the railing models on a rail row (`railing` too); a stair row always
  shows model / railing / rails, a rail row model / block; emptying model / railing / rails (or ticking rails / block back on) drops
  the key (the default). THE GROUND shows `terrain.stairs` (the room's kind). Notes on each row say what the fields do.
- Core: a curved railing is picked by a box per ≤ 30° piece and anchored at its arc's middle; its radius scales; a pts / y / y0 / y1
  railing is boxed at its own heights; a vertical move lifts a rail's [x, z, y] points (data.js hqRowPlace too, for prefabs placed
  with `y`); a mirror swaps a one-sided flight's `rails` l ↔ r.

## THE ENCOUNTER TABLE + THE TALK (2026-10-08, thread "dev tools")

R2 files: editor.js, data.js, map.js, three-renderer.js. mondo picked tools 5 (NPCs and dialogue in the editor) and 6 (encounter
tables) from the dev-tools list.

- **ENCOUNTERS** (room inspector, his world only, under ZONE AND SITE; editor.js `encHtml` / `encWire` / `encSet`): `rooms[id].encounters =
  { list: [{ race, w }], walkers: [min, max], levels: [min, max], group: [min, max] }`, one undo step per change. Ticking "own table" seeds
  it with the room's natives. Blank ranges = the game's rule. data.js `hqRoomEncTable(roomId)` is the ONE read (only 3D-ready roster races,
  weight > 0; an empty list = off). It replaces the site's people in `hqRoomPopulation` (pool + weighted draw `hqEncTablePick`; `walkers`
  sets n, THE CROWD CAP still applies), `hqRoomNatives`, `hqEncounterLaunch` (companions drawn by weight via `hqEncTableDraw`, repeats
  allowed; `group` sets a lone native's companions; `levels` clamps every enemy level) and `hqMarkerLaunch`. A fight still needs the room's
  SITE. Spawn points are the existing PEOPLE / MARKERS spots (a spot with a race stands it; an empty roster spot is filled).
- **TALK** (the inspector of a PEOPLE row, npcSpots; editor.js `talkHtml` / `talkWire`): `talk = { name, convos: [{ if, not, pages, choices:
  [{ label, pages, set }], set }] }`. The generic field list hides `talk`. Runtime: three-renderer.js passes `talk.name` as the spawn label and
  `talk` on the E target; map.js `_hqNpcPanelHtml` → `_hqTalkStart` picks data.js `hqTalkConvo(talk, hqStoryFlags(profile))` (first convo
  whose `if` flag is set and `not` flag is not), shows a page at a time in the subtitle bar (NEXT / E / ENTER / SPACE; 1-4 pick a choice on
  the last page; a 250 ms guard keeps the opening E from turning the first page). Finishing sets `set` and the choice's `set` via
  `hqStoryFlagSet` on `profile.door.hq.flags` (viewer-local, never relayed). ESC abandons without setting flags. No talk = the old `say`.

## THE AREA UNITS (2026-10-24, thread "Add area encounter editor to dev tools")

R2 files: ui.js, data.js, map.js, three-renderer.js, editor.js. mondo: "is there somewhere in the dev tools that lets me change
what units appear in what areas? If not can you add one and add a scrollable list or something with unit portraits to make it
easy, good ui". The only tool was the editor room inspector's ENCOUNTERS dropdowns (one room at a time, no portraits).

- **The window** (ui.js "THE AREA UNITS" IIFE, `openAreaUnits(roomId)` / `closeAreaUnits` / Shift+F9; also the Data Panel's
  AREA UNITS button (DATA in the pause menus), Settings → Developer, the editor's ENCOUNTERS "AREA UNITS…" button). PS1 window
  in the HUD theme tokens (`--ew-plate-bg` etc., Classic Blue fallbacks). Left: areas = every room with a SITE grouped by zone
  (DOOR_HQ.hubs via hqHubOf, labels verbatim; no hub = MORE PLACES) then by site. Right: room chips (ALL ROOMS or one), the
  source (YOUR LIST / MAP EDITOR TABLE / GAME DEFAULT), the list as portrait cards (weight stepper + share %), placed-people
  toggle, walkers/levels/companions ranges, then every 3D-ready unit as a scrollable portrait grid (search, ALL / ON THE LIST
  / NOT ON IT): a click adds or removes. UNDO (Ctrl+Z), SEE IT NOW / GO THERE (`_hqGoRoom`, closes the windows first).
- **The data:** data.js `HQ_AREA_ENCOUNTERS[roomId]` = the editor's shape + `spots`, written via EWDataMods (table listed under
  Story & field; localStorage, off online, Data Panel EXPORT bakes it). `hqRoomEncTable(roomId, skip)` reads it before the
  room's own `encounters`. The game default view is `hqAreaDefaultUnits(roomId)` (hqRoomPopulation with `noTable`, shares by
  the tier weights). Seeding a list from the default turns each share into a weight (% , min 1); a new unit gets weight 10.
- **What it changes:** walkers (now city rooms too: Disaster City / The Sewers ignored the table before), placed people
  (`hqSpotRaces`: a PEOPLE spot whose race is off the list stands as a list race, seeded per day/room/spot; a spot with talk /
  cast / clone keeps who it is; `spots: false` keeps all), travellers (`hqRoomTakesRace`: only list races walk in), fights
  (the existing table reads in hqEncounterLaunch / hqMarkerLaunch / hqRoomNatives). THE CROWD CAP still applies (the clearing
  shows 2 bodies, one of each race).
- **A window over the walk** (ui.js `_ewWalkHold`): the Data Panel and this window pause the walk while up (the pointer lock
  re-grabbed on the DATA click made every panel click land on the canvas); ESC in the walk closes the newest window first
  (map.js onEscape → `_ewWalkWindowEsc`). `_hqCurRoomId()` (map.js) = the walk's room, null off the walk / in the editor.

## THE GAME ROOM EDITS (2026-10-18, thread "Room saves and arena boards")

R2 files: editor.js, data.js, map.js, online.js, three-renderer.js. mondo: "if i make some changes in an existing room in the editor,
like just change the terrain of the ground to a different sprite, how do i save it without saving a whole new room? and do the arena
maps take the changes too?" (He painted THE CORN FIELDS, which IS Skinwalker Ranch's arena room, and the first change made a `w_roomN`
copy that nothing in the game reads.)

- **In place:** the first change to a game room (editor.js `own()`; `commit()` routes any library-room write through it) no longer
  copies: his project keeps the room under the game's OWN id (`edit.over: true`), with site/part/doors kept. MAKE A COPY (`makeCopy`)
  is the old new-room copy. A copy made before this (`edit.from` on a `w_roomN`) has PUT INTO <game room> (`copyToGame`: the copy's
  content over the game room, the game room keeping its doors / label / site / part). DELETE on a game room = UNDO ALL MY CHANGES
  (`revertRoom`). THE LIBRARY labels each room with its arenas ("· SKINWALKER RANCH ARENA") and "EDITED".
- **Saved as a diff:** `saveNow` writes `doc.edits[id] = { diff, edit }` (data.js `hqRoomEditDiff`: `{ key: { $set } | { $del } | nested }`,
  a changed list whole, row ids the editor added ignored); `docPrepare` rebuilds the room (`hqRoomEditBuild`) over the CURRENT data.js
  room, so a later data.js change to the rest of the room still shows.
- **The game:** data.js `hqRoomEditsBoot` (main page only) reads the editor's last project from IndexedDB `ew_editor` (opens read-only,
  aborts the upgrade so it never creates the db) and lays the edits over DOOR_HQ.rooms (`HQ_ROOM_EDITS.orig` keeps the game's object;
  `hqRoomEditPut` / `hqRoomEditDrop`). map.js `_hqEnter`, `_hqArenaWarm` and `_msArenaGate` wait for `HQ_ROOM_EDITS.ready`.
- **Arenas:** `hqWorldDocRebuild` bumps `hqRoomRev(id)` and calls `hqArenaRoomChanged(id)`, which drops the attached `field` of every
  `<site>_delta` / `_NxN_delta` cut from that room so the next launch re-surveys and rebuilds the board from the live room (all sizes).
  The baked cells (thumbnails, the fallback when the window no longer fits) stay data.js's until bake-arenas.js is rerun.
  three-renderer.js keys the battle's drawn room by the rev; map.js re-surveys a room whose rev moved while the worker had it.
- **Online (RULE #2):** each seat builds the arena from its own room, so the host's `arena-check` carries `room` + `edit` (its diff or
  null) + `sig`; the guest lays it over (`hqRoomEditUse`), re-surveys, and its `arena-ready` carries `sig`; the host counts only a ready
  whose sig matches its own room.

## THE TILE GRID + SNAP TILE + the flat plain (2026-10-19)
mondo: "i select the size of the room to be something like 12x12, but then i cant see the outline of that 12x12 ... let me
'quantize' the fidelity of the grid ... when i make a new room and raise a single 1x1x1 tile ... a half raised part that extends
out from it and goes on forever".

- **The grid:** editor.js `gridBuild` replaced the 1 m GridHelper (it lay at y 0.03 under the field mesh, which stands 0.3 up,
  so it never showed). It drapes THE FIELD's squares (edges at k · 1.75 m from the room's centre, `TILE`) on the ground over the
  shell's w × d, plus the room's edge as a yellow band; rebuilt in `onReady` (the ground is compiled then). G still toggles the
  squares; the edge always shows. The status bar shows the room as metres and squares (12 m = 6.9 squares; 12 squares = 21 m).
- **SNAP TILE:** the SNAP select's 1.75 option is TILE (`tileMode()`): points land on a square's middle (`snapPt`: click rows,
  palette drops, lamps, doors, paste), rect draws cover whole squares from the press's square to the release's (`tileRect`,
  drawPt keeps the raw `rx/rz`), stamps: a rect click = round(2·SIZE/1.75) squares round the clicked one, a disc centres on a
  square; walls/lines still snap to square corners; moves go whole squares and one point-row lands on a middle (`tileDelta`;
  the gizmo's own snap is off in TILE and `dragMove` places the pivot). Edge "smooth" still eases a block past its squares.
- **The strip:** three-renderer.js `_hqBuildOuterGround`'s `outer.flat` (every new editor room) returned the field's CLAMPED edge
  height for the whole plain, so a shape touching the room's edge ran on to the fog as a raised strip. Now the plain settles from
  the edge back to `terrain.base` over 2.5 m (the rolling ground's own blend).
- **The wedge:** the outer ground's skip test was strict (`qx0 > -hx`), and its 2 m lattice lands on ±hx exactly, so the ring of
  coarse outer quads lying just inside the edge (0.1 under the field) was drawn and poked through the side of a block raised near
  the edge. Quads on the bound are skipped now (the field runs 0.5 m past hx, so nothing opens).
- **Rooms in squares (same day, mondo: "if I pick 12x12 m room then there should be 12x12 grid ... the exploration is supposed
  to seamlessly transition in to a square grid battle"):** NEW ROOM asks for squares (default 72 × 72 = 126 m; NEW WORLD's
  Room 1 is 126 m, a new dungeon 56 squares), THE SHELL shows `w squares` / `d squares` (whole squares; the metres follow,
  `wSq`/`dSq` in fieldCommit). data.js `hqFieldGridOffset`: for his rooms (`w_` ids) an axis with an ODD whole count of squares
  runs an odd lattice offset half a square (hqFieldTerrainInfo), so the room's edges are square edges on both sides; game rooms
  keep the even, centred rule (site_prebuilt_hollow_earth_vent's d = 9 squares is the one game room it would have moved). The
  editor's grid and TILE snap read the same offset (`tileOff`).

### THE SHEET LOOKS (2026-10-24) — cliff zoom, terrain tints, one sheet per square
- mondo: Area 51's stair sides in Dirt 2 were "zoomed in and blurry"; rule: one 1.75 m battle square = one 128 sprite everywhere.
- Cause: in-room geometry was UV'd at the far horizon's density (`HZ_TEX_DENSITY` 0.5 in `_hzBoxUV` / `_hqSlopePrismGeo` /
  the stairs pack `texK`), one sheet per TWO squares. Every terrain-room box (walls, stands, decks, bridges, floats, the hull,
  city lots, cave ledges + rock, passages) now uses `_nrBoxUV` (the board's density); the pack's flights / railings / escalators
  and the stair wedge use `U / TM`. The field shader's cliff (0.85) and path (1.15) scales are 1 now. The horizon keeps 0.5.
- New fields (default writes nothing, the room looks as before): `terrain.cliffZoom` (squares per cliff sheet, the field's
  steep faces, keyless walls, stair sides wearing the room's cliff), `terrain.floorTint` / `cliffTint` / `pathTint` ('#rrggbb',
  multiplied; white = none); a stair ramp row's `side` (its sides' sheet), `sideZoom`, `sideTint`. Renderer helpers
  `_hqSheetLook(info)` / `_hqSideLook(f, kindSide, info)`; WebGPU `_ewNodeTerrain` reads `cliffK` / `tFloor` / `tCliff` / `tPath`.
- Editor: THE GROUND shows cliffZoom (a select) + the three tints (a hex box + a colour picker); a stairs row shows side /
  sideZoom / sideTint. Proof shots: /mnt/project-files/cliff-textures/.

### THE GAPS (2026-10-28) — sealed floors become holes; the editor's GAP / FILL GAP tools
- mondo (Technoticlan Arena shot): "see how there are these areas of completely enclosed walls? i would like those to be gaps
  in the map ... in the map editor i want to be able to make holes in the map like this, so i can make actual dungeon like maps
  with rooms and hallways."
- A gap is a whole battle square (1.75 m, edges at `hqFieldGridOffset`). Runs `[[j, i0, i1], …]` live in the room's
  `terrain.holes` (the editor's, wins when set, even `[]`) or data.js `HQ_ROOM_HOLES[roomId]` (the bake's). data.js THE GAPS:
  `hqRoomHoles`, `hqTerrainHoleGrid` (info.holes), `hqTerrainHoleAt`, `hqTerrainSealedSquares`.
- Existing rules only: a gap is THE VOID (`hqTerrainVoidAt` true; a room with gaps and no void gets `void.holesOnly` with
  `fall` 8 m below base), so the walker can't stand there and a fall uses the existing `_hqVoidReturn`. In battle a hole square
  whose cell was walkable becomes the existing `cloud_gap` (Open Sky: impassable, flyers pass, a slide falls short); rock / wall
  cells stay as they were, so arena boards over the old mass don't change. A deck (bridge) over a hole keeps its span.
- Renderer: `_hqBuildTerrain` skips ground quads inside a hole; `_hqBuildHoles` draws the pit — cliff-textured walls 6 m deep
  fading to black, a black floor, fog off (fogged pits read as floor). `voidRock` / the void glow are not used for holesOnly.
- The bake: `node bake-holes.js` (several minutes; `--dry-run`; or room ids) gaps every square no walker reaches from the spawn
  or a door, past the body radius from reached ground, at floor height, with no prop / NPC / tree / scatter / climb / bridge /
  fluid on it (plan / halls / ley mass behind traced walls counts as sealed). Skipped: city, trees look, thicket, sea, float and
  real void rooms, and rooms with their own `terrain.holes`. It then rasters every arena cut with and without the gaps and
  prints any changed cell. 2026-10-28: 24894 squares in 29 rooms, every arena cut unchanged.
- Editor LAYOUT tab: GAP (drag a rectangle of squares → holes) and FILL GAP (drag → floor back); right-click = one square.
  The GAPS panel: "GAP THE SEALED SQUARES" (runs the rule on the room as edited, keeps existing gaps) and "FILL EVERY GAP"
  (writes `[]`, so the bake's row is off too). Saved with the room (undo / UNDO ALL as usual). Re-bake arenas after big edits.
- Not done: voxel / box maps (no terrain lattice).

### THE EASY EDITOR (2026-10-28) — grouped tabs, grouped tools, a top bar that fits, tips, a sorted help card
- mondo: "Can we make the editor more user friendly and easy to navigate and understand". Nothing was removed or renamed and no
  tool moved to another tab.
- Top bar: two rows (`.ed-toprow`): the menus + 🎨 UI / 🧮 DATA / ▶ PLAY HERE / ? HELP / ✕ on top, the tools under them in
  labelled groups (`.ed-tgroup`: THE PICK, SNAP, VIEW, AUDIT). At 1280 px the old single row cut off FIGHT..✕. The side panels,
  the banner and `.ed-map` sit under it via `--ed-top-h` (editor.js `topFit`, on every toolsBar + resize).
- Palette tabs: `PAL_GROUPS` puts the same 15 tabs in four groups (THE FLOOR PLAN AND THE GROUND, BUILD, PLACE THINGS, THE ROOM;
  a tab named by no group lands under MORE). `PAL_TIPS` = each tab's tooltip + the blue box under the tabs (`.ed-tabtip`).
- Draw tools: `DRAW_GROUPS[tab]` = labelled groups with a one-line how-to (`.ed-tgrp`); a tool no group names lands under MORE.
  The armed tool shows a how-to box (`.ed-howto`) and "<TOOL> SETTINGS" over its fields.
- Inspector: `FIELD_TIPS` gives a hover tip (dotted name, `.ed-tip`) to fields whose meaning is the same everywhere
  (`fieldHtml` wraps `fieldHtml0`). Outliner room sizes are in battle squares (`roomSize`).
- Help (? / H): QUICK START (`quickStart`, five steps) then the old rows sorted under headings (`['§', title]` rows), plus LAYOUT
  (incl. GAP / FILL GAP) and SKY rows, which it lacked. hud.js's UI Maker stand-in for the editor follows the new top bar + tabs.
- Shots: /mnt/project-files/editor-easy/.

### BATTLE SQUARES, NEVER METRES (2026-10-28) — every size box
- mondo's 10-19 rule, carried to every box: the editor shows and takes battle squares (1.75 m); the room file still stores metres, so
  every saved room loads and plays the same. Helpers next to `TILE`: `sqOf(m)`, `mOfSq(sq)`, `sqTxt(m, dp)`.
- Tool settings: any OPT_FIELDS label with "(m" shows "(squares" and the value ÷ TILE (`data-osq`; paletteWire stores × TILE).
  ED.opts stay metres. Layout plan fields the same (`data-lsq`, treeH list too). ARRAY moves in squares.
- Top bar: SNAP = off / ⅛ / ¼ / ½ square / TILE (default TILE since the modular fix below; off snaps to ⅛ square); roof cut and LEVEL band in squares.
- TREE SIZE presets are whole squares (2, 3, 5, 7, 10). SIZE AND TURN takes squares.
- Inspector: `sqKey(key, list, row)` picks the length fields (SQ_ROOM / SQ_FEAT / SQ_SPOT), shown as "<key> sq", `data-t="sq"`
  (fieldCommit × TILE). A tree's / grove's h was already squares (label only). Angles, counts, colours, seeds, floors and RAW JSON
  and kit args are unchanged (RAW is the file itself, metres).
- Status line, outliner, draw read-outs, toasts and tips read in squares (fly speed sq/s, pockets in squares).
- Proof: wall drawn with Height 2 / Thickness 0.5 squares stored h 3.5 / t 0.875 m; inspector h typed 3 stored 5.25.
  Shot /mnt/project-files/editor-easy/squares_wall_after.jpg.

### THE MODULAR KIT ON THE SQUARES (2026-10-28) — snap + the floor on a wall
- mondo: "the preview wont snap to the tile grid even with the cells set to 0 and the snap all the way down to a fourth ... i cant
  even place a floor on a wall i palced without it ocerhanging". Cause (older than the squares PR): MODULAR's Cell was 4 m counted
  from the room's middle, so every modular wall / floor / roof / stair sat off the battle squares whatever SNAP said, and a Cell of 0
  fell back to 4 m.
- `modCell()`: the Cell is whole squares (min 1; default 2 = 3.5 m; an old 4 m reads as 2). modPlan lays the cells on the room's
  own square lattice (`tileOff('x' / 'z')`, the same lattice `snapPt` / `tileRect` use). The Cell box takes whole squares (step 1).
- An upper floor (s > 0) reaches over the tops of the floor-below walls on its edges, to their outer faces (half a wall thickness
  out), so it sits on the wall instead of stopping at its centre line. Ground floors and roofs (0.4 m eave) are unchanged.
- SNAP starts on TILE (was ¼ square). Proof: walls drawn 0 → 7 m land at 0 / 3.5 / 7, floor 1 is x -0.125 → 7.125 over 0.25 m walls.
  Shot /mnt/project-files/editor-easy/modular_snap_before_after.jpg.

### THE PLAIN WORDS + THE BOXES + JUST THE ROOM (2026-10-28)
- mondo: "in the map editor, wtf is a dado? Why is the ceiling set to grass as default? Why is that there when i dont even see a ceiling?
  ... how do i just make a simple raised platform that is straight and perpendicular with the ground? ... i also need to raise like a
  cube shape and build like that too." Then: "i just want a setting that shows the map as the dimensions i set, with a sky, no big
  landscape, no sea, no floating setting ... what is "apron"? ... Theres a setting that says edge and it just says open in it".
- THE ROOM, IN PLAIN WORDS (editor.js `shellHtml`, `SHELL_WORDS`, `shellUse`, `GROUND_WORDS`/`gw`): THE SHELL is now THE ROOM'S SHAPE
  AND LOOK. SKY (outdoors / indoors), EDGE (no walls / low wall / full walls) and AROUND THE ROOM are dropdowns; every shell key shows a
  plain name + a hover tip (dado = "lower wall band", apron = "ground strip", skirt = "ground strip edge"...). `shellUse(k)` says when
  three-renderer.js `_hqBuildBoxShell` draws a key; the ones it doesn't draw in this room fold under "NOT USED IN THIS ROOM (n)", each with
  why. Nothing was deleted or renamed in the file. Shell colours (floorColor, wallColor...) are colour pickers that still store numbers
  (`data-t="hexnum"`). THE GROUND's fields got plain names; stairs look and sea liquid are dropdowns.
- Facts found: floorColor tints the terrain field too (`_hqTerrainMat`); wallColor tints every drawn wall row; in a terrain room the
  apron / skirt / shell floor are never drawn (the outer ground replaced them 2026-09-17) — that's why "apron" did nothing.
- New rooms: `HQ_WORLD_DOC_RULES.room.ceiling = 'concrete'` (was the floor sheet = grass). Old rooms keep what they have.
- AROUND THE ROOM (`terrain.outer` / `terrain.apron`): Endless ground (outer on, as before) · Just the room (`outer: false`: three-renderer.js
  `_hqBuildRoomSides` drops straight cliff-sheet sides 2 squares under the lowest ground + a bottom; sky all round) · A ground strip
  (`outer: false` + `apron: true`: the old apron + skirt; the skirt sits 0.3 m lower in a terrain room so it no longer z-fights the
  apron). Switching off endless ground parks the old outer object in `terrain.outerWas`. Sea and floating island are unchanged.
- THE BOXES (GROUND tab, group BOXES): BOX RAISE / BOX LOWER on whole battle squares (TILE). A box = an existing `wall` row with `block:
  true`, `rail: false`, `t` = one square, `y` = absolute top; one row per run of squares along x with one top + sheets (`boxSquares`,
  `boxEdit` re-encode only the touched rows; one undo step on terrain.features). RAISE: top = the surface pressed (a box's top = stack) +
  HEIGHT, flat; never lowers a taller square. LOWER: −HEIGHT per square, gone at the ground. `boxPt` ray-casts the box columns (top =
  that square, side = the square beside it; BOX LOWER takes the box itself). Opts boxH / boxSide / boxTop.
- Game side, existing rules: a wall's top is ground for the walker (`hqTerrainFeet`) and the fight (`hqFieldTerrainInfo` cell.top = the
  box top, checked: 1.75 / 3.5 on exactly the box squares). data.js `hqTerrainWallAt`: a `block` row uses `_hqTBoxDist` (square ends,
  like the drawn slab) and the TALLEST box in reach wins (stacked neighbours). three-renderer.js drawWall: a block wears the cliff sheet on
  its sides and the floor sheet on top (or `key` / `keyTop`), the room's floorColor + sheet tints, never wallColor.
- Shots: /mnt/project-files/editor-simple/.

### PAST THE EDGE (2026-10-28)
mondo: "why does the map extend past the yellow boundary of the grid? Is there no option to control how much that sticks out or to
just have it gone completely?" The terrain lattice always runs a metre past the shell (hqTerrainCompile `halfW = S.w/2 + roam + 1`),
and JUST THE ROOM drew all of it. Now an open room with `terrain.outer: false` (not floating) carries `info.cut` = the shell's half
size + `terrain.edgeOut` metres (absent = 0): three-renderer.js pulls the field's nodes past it onto it (height read there), drops the
flattened quads, and _hqBuildRoomSides drops its sides from that trimmed rim. The lattice grows only when edgeOut asks for more than
its metre (info.halfW unchanged, so the fight board is the same). The walker (data.js _hqTOutside, hqTerrainFeet + hqTerrainAir)
stops 0.3 m short of the trimmed edge instead of 0.5 m past the room. Editor: "past the edge (squares)" under AROUND THE ROOM, shown
only for Just the room, 0-20 squares, stored in metres. Shot: /mnt/project-files/editor-simple/edge_before_after.jpg.

### A WALL'S OWN TINT (2026-10-28)
mondo: "i am placing walls, but for some reason they are tinted and i cant change them ... no where is there an option for me to change
the tint of the wall". A new room's shell carries `wallColor: 0x86a066` (green) and every wall row (WALL, ROOM, MODULAR WALL / ROOF,
the ADD list's wall and fence) wore it. Now a wall row may carry `tint` ('#rrggbb'): data.js copies it onto the compiled row, three-
renderer.js draws it IN PLACE of the room's wallColor (matOf: per sheet + tint material, the tier merge batched per tint too);
'#ffffff' = none (the sheet as it is). Absent = the room's wallColor, as every room was built (nothing old changes). The editor writes
`tint: '#ffffff'` on every wall piece it places from now on (NO_TINT), and the wall's panel always shows a tint box (empty = the
room's, typed none / the NONE button = none, a colour, a picker) with a note naming the room's wall tint and where it is set.
Block boxes keep the floor tint rule. Shot: /mnt/project-files/editor-simple/wall_tint_before_after.jpg.

## THE BUILDING'S LOOK (2026-10-30, thread "Change placed building textures")
mondo: "how come when i select a placed building i cant change what it's texture is the same way i can a wall? Where are those
other building textures that were used for the prism buildings? Make sure those are included in these buildings/textures too."
- A `texbuilding` row takes `key` (and its `style` dropdown: office / tower / residential / stucco / factory, empty = its seed
  picks), both always shown on a selected building. `key` = a sheet (urban:… / terrain / HQ texture): three-renderer.js
  _hqTexBuilding puts it on every face cell and the parapet (the style's door decal stays, no windows), as a wall wears its key.
- The PRISM BUILDINGS: the building sprites the battle board's prisms and the city's prism lots wear (OBJECT_SPRITES building_1..11,
  ancient_building, abandoned_building_1/2, church_1/2, shop) = data.js HQ_TEXB_PRISMS / hqTexbPrism. A building whose key is one
  of them is drawn by _hqBuildTexPrisms with _nrSpriteBuilding (the city lots' builder, needs the kit TK, so it runs after TK is
  made; TK is now made when a room has one), storeys HQ_TEXB.storey high, new `flatRoof` opt so the roof sits at the top where the
  walker's roof slab is (hqTexBuildingRows unchanged). Prisms are darker than the textured faces by design (HQ_TEXB.tint note).
- The texture picker lists the prism family FIRST only for a building's key (inspector …, and the BUILDING tool's new Look +
  Style settings, opts bldKey / bldStyle). PAINT paints a building's key too. Nothing removed; rows without key draw as before.
- Ramps/stairs on the squares: mondo solved it himself with the SNAP setting (no change).
- Shots: /mnt/project-files/editor-building-textures/building_textures_before_after.jpg.

## THE CUSTOM BATTLE MAPS (2026-10-30, thread "Make editor maps into battle maps")
mondo: "Need a way to designate a map im building as a custom battle map to let me add spawn zones and nexus zones and the cube
and add it to the map selector so i can playtest it."
- Editor palette, THE ROOM group: new **BATTLE MAP** tab (the room inspector's "THIS ROOM" also has OPEN THE BATTLE MAP TAB).
  MAKE THIS ROOM A BATTLE MAP writes `battle` on the room row: `{ on, name, S (9/10/11/12 squares, default 12), sq (3.5 big
  squares default, or 1.75), x, z (board centre, metres), p1, p2 ([[x,y]…] spawn squares), nexus {x,y}, cube1, cube2 }`.
  Missing fields fall back to data.js hqBattleMapDefaults (the arena house: rows 0 / S-1, Nexus at the middle, 4v4 Cubes at
  the default spots and their 180° twin).
- Tools (DRAWS, how 'bmap'): MOVE BOARD, TEAM 1 / TEAM 2 SPAWN (click toggles a square, drag paints a rectangle; a zone keeps at
  least one square), NEXUS, TEAM 1 / TEAM 2 CUBE. The board overlay (bmBuild, called from gridBuild) draws every square on the
  room's real ground: blue / red zones, gold Nexus, dark red = can't stand there, orange band = the board's edge, cube boxes.
  LOOK AT THE BOARD frames it, MIRROR copies team 1 onto team 2 turned 180°, START OVER resets, CHECK lists problems (warns,
  never blocks). A battle-only change commits with docSync(keep) so the room is NOT rebuilt.
- ▶ PLAYTEST IN VS CPU saves, closes the editor and opens the VS CPU match select on that map (`_goToVsCpu({pre:{launchId}})`).
- data.js "THE CUSTOM BATTLE MAPS" (HQ_BATTLE_MAP_RULES, hqBattleMapBuild / hqBattleMapsSync / hqBattleMapsBoot): every room
  with battle.on registers `custom_<roomId>` in EW_MAP_META / PREBUILT_MAPS via hqArenaEntry({house}) — the same arena path as
  the site arenas, so hqArenaUpgrade cuts the board from the room's live raster at launch (custom = no caps / flat-house rule,
  unstandable house squares only warned). Rebuilt only when the row's signature changes; dispatches `ew-battle-maps`, which map.js
  _ewBattleMapsSync answers with the GAME_MODES / MS_MAP_LIST rows (tag CUSTOM, modes arena / tdm / simul). hqRoomEditsBoot calls
  hqBattleMapsBoot so his own w_ rooms show at boot too.
- map.js autoGenerateSpawnZones: a custom house uses the painted zones VERBATIM (unit i → zone square i, overflow → nearest free
  standable square, never a Cube's). Nexus + Cubes are the existing arena objects (existing rules only).
- NOT ONLINE: the map lives in his browser (IndexedDB), so it is VS CPU only and kept out of hqArenaPvpPool.
- Proof: /mnt/project-files/custom-battle-maps/ (ed4 board, ed6 painted, ms1 selector "Box Yard 12×12 CUSTOM", b2 battle).

### THE WALLS ON A BATTLE MAP (2026-10-30, thread "Make custom map walls block movement")
mondo: "my units are able to walk straight through the walls of a custom map i made. They are supposed to path around them/block
line of sight." Cause: the editor runs a wall on the squares' EDGES (SNAP TILE) and the terrain raster reads each square at its
centre, so an edge wall never reached the board (both squares open floor); on the 3.5 m squares a wall through a square's middle made
the square a +2 ledge on the wall's top.
- data.js `solid` raster (hqFieldRaster opts.solid → hqFieldRasterTerrain): hqArenaUpgrade passes it for a custom map (`a.custom`) only;
  game arenas and exploration fields are unchanged.
- hqFieldSolidCell: a square whose middle a wall stands in (taller than tierMin over the ground) is OUT (rock). BOXES (raised
  platforms), seat tiers, hung walls stay as they were. Blocking props (hqFieldPropCovers, now shared with the box rooms' lattice):
  `box.high` (2.2 m) or taller = OUT, lower = a cover at its top, no seat.
- hqFieldSolidEdges: a wall between two squares = the engine's THIN EDGE WALL (state.edgeWalls via entry.edgeWalls, hidden on the
  board: the room draws its walls). Walled only when every line across the edge (≤ 0.15 m apart) meets a wall, so a doorway / a wall
  end that leaves a gap keeps it open. Glass = `see`; a wall under tierMin over the higher floor = `low` (a jump vaults it); else
  h = the wall's height in levels (≥ 2). Pathing, the AI, LOS all read edgeWalls already (map.js wallBlocksStep / wallBlocksAdjacentSight).
- editor.js BATTLE MAP tab reads the same `solid` raster, so a wall's square shows dark red (can't stand there).
- Checked headless (load-data.js): a new 42 m room, walls on 1.75 edges, a glass wall, a doorway, a mushroom + a 1.5 m bar — on 3.5
  and 1.75 squares the board got the edge walls / OUT squares / the +1 cover, the doorway's edge stayed open.

## THE PRISM ROOFS + THE INSIDE (2026-10-30, same thread)
mondo: "can we possible make roofs on the prism buildings the same way as the other ones? Or like what if i wanted to add an interior
to the buildings so i would need an option for them to be more like walls but still look like a building".
- PRISM ROOFS: a prism building (key in HQ_TEXB_PRISMS) now gets the textured buildings' roof (urban:ConcreteUnderTiles1) + parapet
  (urban:ConcreteStriped2a) from _hqTexBuilding with `roofOnly` (its face cells skipped); _nrSpriteBuilding's own brick roof plane is
  off (`noRoof`) and so is the mast/beacon (roofKit false), so it reads like the textured ones. Collision unchanged (same box, roof).
- THE INSIDE: texbuilding `hollow: true` (editor "inside (walk in)", also a BUILDING tool setting). data.js hqTexbDoor(f) = the
  doorway: square `door` of the front (1 = left as you face it from outside, empty/0 = middle), one drawn cell wide, HQ_SHAPE_RULES.doorH
  (2.2) high. hqTexBuildingRows splits the front ghost wall round it with a hung lintel (`lift`), the existing hung-wall rule. The
  renderer cuts the same cell (the cell above drawn from 2.2 up), draws _hqTexInside: inside walls (`keyIn`, default plaster) at the
  ghost walls' inner face (0.24 in), doorway sides + head, ceiling under the roof slab, floor (`floorIn`, default concrete). Batch kinds
  'inner'/'ceil' are DoubleSide; 'ceil' meshes (ceiling + a hollow building's roof) carry _ew_hqPart 'ceil' so HIDE ROOFS (C) opens it.
  One open room inside the full height: floors/stairs inside are the BUILD tools. A prism building stays solid even with hollow on.
- Proof: PLAY HERE outside the doorway, walked in (walker z -3.9 inside a 0..-7 building). Shots
  /mnt/project-files/editor-building-textures/prism_roofs_and_insides_before_after.jpg (+ r2_*.jpg).

## THE FLOOR ON THE GROUND (2026-10-30, thread "Fix floor flickering with the ground")
- mondo: "im placing a floor at 0 but its flickering with the ground". The BUILD > FLOOR tool writes a `plain` bridge row
  (`y` = Floor height); at 0 its top lies in the ground's own plane, so the two z-fought (grass stripes through the slab).
- Fix (three-renderer.js `_hqBuildBridges`, the plain branch): a plain slab whose top is within 10 cm of the ground under its
  middle or any corner (hqTerrainHeight) draws with a cloned material carrying polygonOffset -2/-2 (cached in keyMats as
  `<key>|ground`). Nothing moves: the walker still reads b.y; slabs off the ground (stands, lintels, upper floors) draw as before.
- Repro in the harness: a local `ph drag` (added to the /tmp/ph copy only). Shot:
  /mnt/project-files/floor-flicker/floor_at_0_before_after.jpg.
- 10-30 "pressing make this room a battle map doesnt do anything": the CDN had cached the OLD data.js / map.js / match-select.js
  under the new `?v=battlemap-01` token (random query served the new ones), so W.hqBattleMapDefaults was missing and battleOn threw.
  Token re-bumped; battleOn now toasts "data.js is older than the editor" instead of failing silently. Re-checked in the browser on
  a new room and on a built-in game room (AREA 51 · HANGAR 18): the board draws and the map registers.

## NO TINT (2026-10-30)
mondo: "why is the floor tint for a new map always green? and how come there is no option for no tint in that setting?"
- Why green: data.js `hqWorldDocNewRoom` wrote `floorColor: 0x86a066, wallColor: 0x86a066, apronColor: 0x7e9460` (a lawn green
  painted to match the grass_2 floor sheet) on every new room, and the editor showed shell colours as a bare `<input type=color>`,
  which can't hold "no colour".
- Now: new rooms carry no floor / wall / ground strip tint (dadoColor kept). The editor's shell tints (floor, wall, lower wall band,
  ceiling, ground strip, roof, cove) are a text box (none or #rrggbb) + picker + NONE, editor.js `shellTintHtml` / `data-t="shtint"`.
  none = the key deleted (the renderer's unset = white); roofColor's none writes 0xffffff (its unset look is the renderer's grey).
  SHELL_TINTS show even when unset, so NONE never makes a box vanish. Rooms he already made keep their saved green until he presses NONE.

## DOOR HQ'S TEXTURES IN THE PICKER (2026-10-30, thread "Add Door HQ textures to the editor")
mondo: "werent there some textures that were used to make door hq? why arent those in the textures of the editor".
- Why they were missing: texSources listed DOOR_HQ.textures (the eight painted tileables, R2 Assets/door/textures/) LAST, after
  165 terrain + 376 urban sheets, and texPick stopped at 400 swatches, so the picker never drew them (nor SignProhibited onward:
  TileGeneric, TileMarble, TileSubway, MetroPSX, Liquids) unless searched. The TEXTURES tab had them as a bottom group called "HQ".
- Now: two groups lead both lists: "DOOR HQ · the eight painted tileables" and "DOOR HQ · the other sheets its rooms wear"
  (editor.js hqBuildingSheets: every floor / wall / dado / trim / ceiling / apron / skirt key on a DOOR_HQ.rooms shell, no site_ /
  clash_ / terrain room, most used first: gunmetal, tilefloor_2, aluminium, metal, dungeon…). The picker cap is 1200 (all sheets).
- `hq:<name>`: stone, drywall and carpet are also battle-sheet names, and a terrain room's ground / walls (_hzTex) read the battle
  sheet first, so the plain name there never drew the painted one. The picker writes `hq:stone` / `hq:drywall` / `hq:carpet`
  (editor.js hqTexKey); three-renderer.js _hzTex and _hqTex read `hq:` as DOOR_HQ.textures. Existing rooms' plain keys unchanged.
