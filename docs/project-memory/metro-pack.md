---
name: metro-pack
description: mondo's PSX metro pack on R2 Assets/Metro_PSX (2026-10-04): one GLB split at load time, which rooms use it, PR #86
metadata:
  type: project
  modified: 2026-10-04T09:04:58.573Z
---

Thread "Metro pack" (2026-10-04), PR #86 merged, token 20261004-metro-01-cors, zip metro-pack/ENTROPY_WARS_METRO_PACK.zip (data.js, sprites.js, three-renderer.js).

R2 Assets/Metro_PSX/Models/Metro.glb = whole kit in one file (79 nodes); Textures/ loose sheets. Split at LOAD time (catalogue `base: 'metro', node: '<names>'`, three-renderer.js _miscPiece), no baked per-piece files. Rows HQ_CATALOGUE_METRO (metro_bench/bin/vending/ticket_machine/gate/map/poster_1..8/light/column/car/car_open). Pieces face -Z in the file (turn 180).

Dressed: HQ `tunnel`, site_prebuilt_downtown_subway, running tunnels depot + ghost station. Train way free ends = metro car; wall ends + street siding/tram still Meshy subway. Fix PR #87 (token metro-02, zip metro-pack/ENTROPY_WARS_METRO_PACK_FIX.zip): cause of "not visible" = model queue: left room's unstarted jobs sorted ahead after _hqLeave cleared spots; _mqDemoteQueued now demotes them. Platform 'street' + streets 'metro' doors are stairway passages with model 'metro_stairs' (Stairs_01). Unused: station shells St*, Stairs landing. Kill-switch window.EW_NO_METRO_PACK. Notes: docs/notes/models-assets.md "THE METRO PACK".
