---
name: saved-settings-20261103
description: Settings persistence across refresh (PR #834, 11-03): Action Cam was force-reset ON at load; battle toggles now saved; probe proves all 94 pause-menu controls
metadata:
  type: project
  modified: 2026-11-03T08:18:17.684Z
---
mondo 11-03: "the game never saves my settings like having the action cam turned off".
PR #834 merged, zip ENTROPY_WARS_SYNC_20261103-0817 (battle.js, ui.js, online.js), token 20261103-savedset-02-cors.
- Cause: ew_cinematicActionCam was written but ui.js window-load + battle.js getCameraMode forced state.cinematicActionCam=true.
- Newly saved: ew_cameraDisabled (player toggle only, sims never write), ew_cinematicMode, ew_nametagMode, ew_gameSpeed (1/2/4 only).
- online.js: cinematicActionCam/cinematicMode/animationsDisabled/nametagMode/particleSettings are per-viewer (skip list + _guestUIKeys).
- SHIPPED-KEYS (his 11-01 bake) has ew_cinematicActionCam "0": fresh browsers start with Action Cam OFF. Flagged to him.
- Proof: a scratchpad probe changes every pause-menu control (Audio/Video/Game/Controls, 94), reloads, re-enters battle, compares; all hold.
  Main-menu-only rows (HQ on/off, lone door, biome) are localStorage already.
Notes: docs/notes/ui-menus-audio.md "THE SAVED SETTINGS". [[shipped-setup-20261028]]
