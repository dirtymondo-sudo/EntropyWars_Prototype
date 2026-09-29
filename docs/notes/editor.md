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
