---
name: ice-skin-drape
description: Ice/dry skins on true ground drape like water (PR #305, 2026-10-18) + reusable real-asset WebGPU arena probe recipe
metadata:
  type: project
---
PR #305 merged 2026-10-18, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0823.zip. mondo: Skinwalker Ranch ice had ground triangles + flicker; "needs the same fix the liquids had" (PR #275 THE DRAPE). Now _fieldPatchGeo takes o.ground for every dry skin (ice, sand, scorch, rubble), not Rampart rise runs or monument cells. Rampart → raised dirt is a separate thread.
Probe recipe that worked: cdn.entropywars.net is reachable from the sandbox (real textures/React/MeshLine pass through); only jsdelivr + cdn.socket.io need routing to an npm-installed deps dir. Launch: `_goToVsCpu()`, then set `_msSelectedMap` (MS_MAP_LIST arena row), `_msSelectedGM`, `_msConfirm()`, click `.pb-btn-primary`. Paint with `setTerrainAt(x,y,'ice')`; frame with `_cineHardCut({x,y,zoom,tilt,yaw})` right before each screenshot (WebGPU is slow, rounds advance). Related: [[sandbox-webgpu]], [[lava-water-stone]].
