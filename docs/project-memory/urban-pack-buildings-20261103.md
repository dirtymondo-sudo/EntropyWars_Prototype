---
name: urban-pack-buildings-20261103
description: PRISM BANDS (PR #835) + URBAN PACK BUILDINGS (PR #843, 11-03): prism bands everywhere, ground floor/double door/decals, building_11 + church_2 retired
metadata:
  type: project
  modified: 2026-11-03T08:45:08.388Z
---
Thread "Build buildings properly from the urban pack" (11-03). PR #835 merged, token 20261103-prismbands-01-cors, zip ENTROPY_WARS_SYNC_20261103-0844.

- mondo: prism textures = bottom band on ground floor, top band on top, middle repeats per storey (NOT stretch). data.js HQ_TEXB_PRISM_BANDS [topEndRow, bottomStartRow, storeysInArt] per sprite; three-renderer.js _nrSpriteBuilding `bands` opt; only editor prism buildings (_hqBuildTexPrisms) pass it, city prism lots unchanged.
- URBAN PACK facts: 320 sheets at 128 px = 1.75 m, no docs / sample model / itch page found (pack author not recorded; web search found nothing). Doors (DoorPainted/Storefront/WoodenHalf) are OPAQUE 64x128 = half a square wide, one square tall; a pair = double door. Transparent overlays = DecalWindowsFactory/Residential (two windows per tile, laid over a wall). Glass sheets: a = opaque, b = see-through glass, c = boarded/brown; -Glow = night emissive. PlasterWallPainted2x / Stucco2x have a base / cornice band (made for ground / top rows). Corrugated has a plinth every tile.
- mondo approved the mockup -> PR #843 (token 20261103-urbanbld-02-cors, zip ENTROPY_WARS_SYNC_20261103-0923): texbuilding keyGround / keyDoor (drawn as a double door) / keyOver ('none' = off, empty = smart pick, three-renderer.js _hqTexSheetPlan). Prism bands on EVERY _nrSpriteBuilding (city lots, backdrop, rim) at unchanged H, middle repeats to fill H. Board prism (_buildBuildingPrism) untouched.
- mondo 11-03: NEVER use building_11 or church_2 anywhere (shape doesn't work with bands). sprites.js urls alias them to building_1 / church_1 (and the `church` game-mode object now church_1.png). Removed from editor + map builder palette; ids kept in append-only lists.
- Leave Meshy-to-pack "urban buildings" swap alone (deferred).
- Scratch probe that worked: editor + real CDN textures via playwright route re-served with CORS header, executablePath /opt/pw-browsers/chromium (repo playwright is newer), npm i --no-save --legacy-peer-deps three@0.128.0.
Related [[editor-building-look-20261030]]
