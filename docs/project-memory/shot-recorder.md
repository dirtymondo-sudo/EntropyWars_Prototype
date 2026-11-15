---
name: shot-recorder
description: Camera SHOT RECORDER (F7 / SHOTS in battle pause, PR #309); his framed target camera applied in PR #311 then UNDONE in PR #312 at his request
metadata:
  type: project
  modified: 2026-10-18T11:45:27.097Z
---
PR #309 (token shotrec-01) built the recorder; PR #311 (2026-10-18, token 20261018-shotframe-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1145.zip) applied his export.
- Recorder: three-camera.js `EWShots` (panel draggable by header, pos in localStorage `ew_shot_rec_v1:pos`; shots `ew_shot_rec_v1`; EXPORT ALL → `EW_CAMERA_SHOTS_<stamp>.json`); battle.js `window._ewShotRecApi`.
- His framing (verbatim intent): caster in the middle nudged right (spell list covers ~half the screen), target in top-right 3x3 cell near that cell's bottom-left corner, small gap, zoomed in way more. Last shot = the unit's turn start / root action menu.
- Code: battle.js THE MENU CAMERA: MENU_CASTER_AT [0.53,0.40], MENU_TARGET_AT [0.68,0.30], MENU_EYE_DIST 1.65 tiles, `_menuShotPose` (eye grid search + `_menuAim` closed form), turn shot `_menuUnitPose`/`_menuUnitShot` (MENU_UNIT_EYE [1.85 ahead, 0.65 side], MENU_UNIT_AT [0.50,0.58]). three-camera.js sync "exact orbit" (`_menuShot`/`_menuExactUntil`) disables sky crane/head turn/subject look.
- UNDONE 2026-10-18 PR #312 (token shotundo-01): mondo "they didnt turn out the way i wanted". battle.js menu camera back to pre-#311, exact orbit removed; recorder + draggable panel kept. The numbers above are history; ask him what he wants before re-applying.
- To retune: change those constants, don't rebuild. Notes: docs/notes/ui-menus-audio.md "THE SHOT RECORDER, ROUND 2". Related: [[face-target-attack-hold]], [[cinematic-camera]].
