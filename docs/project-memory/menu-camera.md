---
name: menu-camera
description: Menu two-shot (PR #202/#203) + THE CLEAR FRAME (PR #384, 2026-10-20): camera frames beside the action menu, in the screen part the menus leave free
metadata:
  type: project
  modified: 2026-10-20T15:05:44.925Z
---
PR #202 merged 2026-10-14: clicking a unit / target-list cursor frames caster + target (battle.js _menuTargetShot inside _tpsTargetShot). camera._menuShot.home = tactical view. PR #203: per-input timing + Settings > Controls > Camera 'Target Camera' toggle (localStorage ew_menu_cam).

PR #384 merged 2026-10-20. mondo: menu + sub menu cover ~left third, frame what matters in the right half to two thirds.
- battle.js _menuFreeArea measures the menus' DOM boxes (+ score strip, prompt/desc bars) → free frame in NDC; window._ewMenuSlide slides the board rig. Two-shot (_menuCamSolve) and range fit (_tilePickFrame) fit the free frame; camera._clearFit refits when the menus change under it.
- three-renderer getUnitFootprint: two-shot fits long models (Sedan) whole.
- Sandbox renders ~1 fps: wait ~30 s before a screenshot. Too far/close: tune MENU_CAM_MARGIN_H/V or CLEAR_FRAME_MIN_HW.
PR #395 merged 2026-10-21. mondo: "overdid it ... it only needs this different framing if a sub menu is open from the action menu". Now the shift applies ONLY while a non-root panel of the cascade is up (Abilities, Attack list, quick list); action menu alone = pre-#384 plain framing. Shift is CLEAR_FRAME_SHIFT 0.55 of the way (unit ~62% across with Abilities open, was ~71%); tune that if he says more/less. Sheets: /mnt/project-files/menu-camera/subframe_*.png.
PR #418 merged 2026-10-22: THE CLEAR CAMERA, second playtest Camera 1/2/3/5. Two-shot occlusion _menuCamOccl; board rig cranes over walls/bodies (EW_NO_CLEAR_BOARD); press-turn hold skipped for local own unit (EW_PRESS_TURN_HOLD_LOCAL); death pane hides other units (EW_DEATH_CAM_ALL_UNITS). Move zoom untouched (mondo said keep).
Notes: docs/notes/champions-combat.md "THE CLEAR CAMERA", "THE SUB MENU RULE", "THE MENU CAMERA", "THE CLEAR FRAME". Related: [[range-fit-camera]], [[action-camera-frame-guard]].
PR #443 merged 2026-10-23. mondo: "panning moves the camera angle real low to the ground". Cause: hand pan = snap(x,y) never left the menu two-shot, so it slid the low close lens over the map. Fix camera._leaveMenuShotForPan (home tilt+zoom back, yaw kept, focal latched at board).
PR #924 merged 2026-11-05 (token 20261105-nearframe-01-cors, battle.js cecbef23 uploaded): THE NEAR FRAME. mondo: tile quick menu pushed unit + tile "far far too much" right. With no fit owning the frame, _ewMenuSlide now = smallest slide clearing unit + clicked thing CLEAR_POI_MARGIN (0.06 NDC) off the menu edge (_clearSubjectSlide); two-shot aim also stops at menu edge + MENU_CAM_CLEAR for narrow pairs. Tune CLEAR_POI_MARGIN if he wants more room. Sheet /mnt/project-files/menu-camera/near_frame_before_after.jpg.
PR #945 merged 2026-11-05 (token 20261105-lowpanel-01-cors, battle.js 118c0e9c uploaded): THE LOW PANEL. mondo: quick-menu Meteor CONFIRM shoved caster/target/AOE right though the panel is small. _menuFreeArea now also measures the band ABOVE non-faded side menus (faded .hrlg-panel.bg backdrop ignored); band >=45% tall and bigger than side strip -> full width, cx 0, cy up to 0.3. Confirm zoom + cast-time centring were split to separate threads same day. Sheet /mnt/project-files/menu-camera/confirm_panel_before_after.jpg.
PR #953 merged 2026-11-05 (main 423a3ac, token 20261105-confirmzoom-02-cors; battle a84dea3d, hud 20cd641f, ui 0a49d6cb uploaded): THE CONFIRM FRAME. mondo: quick-menu AoE CONFIRM 'zooms too far out' (kept setTool's whole-range fit). battle.js _frameQuickAoeConfirm frames caster + footprint + picked unit (CONFIRM_FRAME_MIN_HALF 1.5, bodies 1.2 levels); right-click back to placement reframes the reach. Browser zoom 0.61 -> 0.87 on 8x8. Sheet /mnt/project-files/confirm-zoom/. Tune CONFIRM_FRAME_MIN_HALF / TILE_PICK_MARGIN_H/V if he wants closer.
