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
