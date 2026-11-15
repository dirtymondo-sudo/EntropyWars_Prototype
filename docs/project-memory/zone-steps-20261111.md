---
name: zone-steps-20261111
description: PR #1110 (11-11) nexus/spawn zone overlay on dug/raised ground = one stepped surface (THE ZONE STEPS); design choices mondo has not yet confirmed + browser harness recipe
metadata:
  type: project
  modified: 2026-11-11T08:42:57.632Z
---
mondo 11-11 (Fairy Forest Arena, Firefox webgpu): nexus zone "all janky whenever the terrain is raised or lowered"; wants the outline always straight and sleek, the yellow always covering its 4 tiles, never torn on ridges. Thread (thread in the owner project).

- Cause: zone tiles wore the move-tile drape (`_buildDrapeGeo`); THE CLIFF LINE held it flat at a whole-square dig's floor while the bowl wall stood through it; a raised block's flat top buried the plate. TDM spawn strips never rebuilt on terrain change.
- Fix PR #1110 three-renderer.js `_zoneStepGeo` (token 20261111-zonesteps-01-cors, three-renderer.js ab874931 live): one geometry per zone on the true ground; fill follows drawn ground + stands on a block's side inside the zone; rim band stays at the pre-dig ground level (lowered by whole blocks only, one level per tile) with a curtain of fill below; rim turns down corners between tiles at different levels. Switch `window.EW_NO_ZONE_STEPS`. Notes: docs/notes/champions-combat.md "THE ZONE STEPS".
- My picks, NOT confirmed by mondo: the rim floats at the old ground level over a pit (with a curtain) instead of dipping into it; a crater edge crossing a zone leaves that tile's rim one block over the crater floor. Not viewed on WebGPU. Light walls (UI Maker, default 0) unchanged.
- Proof: /mnt/project-files/nexus-zone-steps/ (WebGL2 headless before/after).
- Harness recipe that worked: global Playwright (NOT the repo's node_modules copy, its browser is missing), Chromium with `--remote-debugging-port`, route cdn.entropywars.net .js to repo files, `_goToVsCpu()` then set `_msSelectedMap` (MS_MAP_LIST label match) + `_msSelectedGM`, `_msConfirm()`; later scripts `connectOverCDP` to eval / screenshot. Deform with `setBlockAt(x,y,h+1,terrain)` / `removeBlockAt(x,y,h)`. Old vs new in one session: toggle the switch and bump `window._ewZoneLookV`.
