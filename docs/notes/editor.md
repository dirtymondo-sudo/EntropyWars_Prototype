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
- NOT done: the voxel editor (kept, mondo's word); the Δ builders (still run for the sites without an arena and as the tints /
  layout source); the HQ panels' "CROSS ▸ Δ" wording.
