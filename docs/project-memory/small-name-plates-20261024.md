---
name: small-name-plates-20261024
description: UI Maker "Small name plates" piece (PR #479, 2026-10-24): zoomed-out portrait plate settings, distance-based swap, sheet repaint fix
metadata:
  type: project
  modified: 2026-10-24T10:42:24.241Z
---
PR #479 (merged 2026-10-24, main 61e9ee1, token 20261024-miniplates-02-cors, sync zip ENTROPY_WARS_SYNC_20261024-1041: hud.js 95dc4ee8, three-renderer.js 1ea4fa0d).

mondo asked for UI Maker control of the small portrait plates (the `.tp-far` card when zoomed out), separate from normal plates.
- UI Maker > Bars > row "Small name plates" (UI.bar 'mini'): db.ux mAt (camera distance in battle squares, default 11), mName, mLvl, mBars side|below. Reset group 'm'.
- The swap is now by camera-to-unit distance in squares (three-renderer `_plateFarToggle`, `_plateFarAtSq`, `PLATE_FAR_AT_SQ`), back at 0.9x. It used to be pixel-based (tile < 68 px): ~12.8 squares on a 720 px window, ~16 on 900.
- Normal plate Name/Level (pName/pLvl) now only reach full plates.
- Found + fixed: in-world plates did not repaint when a UI Maker sheet changed, so plate settings looked dead until the plate changed for another reason. hud.js `uimSheetBump()` + `_pmTick` sheet count.

Calls I made (flag if he objects): added a Level toggle next to Name (otherwise a lone "100" sat there); default 11 squares; bars-below puts the name above the portrait.

**Why:** next plate/UI Maker thread must not reintroduce px thresholds or per-plate CSS that skips the repaint.
**How to apply:** any new plate CSS setting just goes in uxCss; the sheet bump repaints it. Proof shots in /mnt/project-files/small-nameplates/. [[world-name-plates]] [[ui-maker]]
