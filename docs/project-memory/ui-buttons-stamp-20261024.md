---
name: ui-buttons-stamp-20261024
description: UI Maker "Buttons" tab (PR #499, 2026-10-24): every-BACK / every-CONFIRM look, per-menu looks, the CONFIRM stamp settings
metadata:
  type: project
  modified: 2026-10-24T16:11:21.074Z
---
PR #499 (merged 2026-10-24, main e2e74db, token 20261024-uibuttons-01-cors, sync zip ENTROPY_WARS_SYNC_20261024-1611: hud.js 956f1682, match-select.js 8b132ebf, party-builder.js 01ae198b, profile.js 41c7eaf7, ui.js d537b5c6).

mondo wanted a red BACK on every menu, green CONFIRM everywhere, each menu changeable on its own (combat BACK different), and the stamp optional/customizable.
- UI Maker > Buttons (hud.js `BTN_MENUS`, `btnRule`, `dockBtnsBody`): kinds BACK / CONFIRM / The stamp. db.btns: `back`, `confirm`, `'<kind>-<menu id>'`, `stamp`. Untouched = game look. Red/green are his to pick, defaults stay the game's.
- Stamp: `window._ewStampLook` read by match-select.js handleConfirm, party-builder.js confirmSlot, ui.js _shopAskConfirm. No new sound.
- A new menu with a BACK/CONFIRM = one BTN_MENUS row (selector); give odd buttons a class (`ew-back`, `ui-confirm-dialog` were added).

Calls I made (flagged to him): SEAL YOUR FATE / START MATCH / SAVE TEAM / DEPLOY / dialog Save + Confirm Trade = CONFIRM; shop ✕ Cancel, results Back to Party Builder/Map, ◂ MAIN MENU, HQ ◂ PARTY/◂ DONE = BACK; combat CANCEL rows not BACK; stamp off on match select = match starts at once; off on party slots shows ✓.

HQ strip over Codex/Shop "← Back": FIXED in PR #501 (mondo said yes): `#hqPage.title-page:not(.active) * { pointer-events: none !important }` in styles-base.css. The hidden HQ page sits after the menu pages; anything in it with pointer-events:auto stole clicks.

UPDATE 11-07 (PR #1039, mondo: "i thought i already told you to make all back buttons red"): the red/green are now SHIPPED defaults (UIM_SHIPPED btns.back.tint #e0453a, btns.confirm.tint #3ccf6e, back-results.padX 34), not just his to pick. BTN_MENUS 'pages' gained #creditsPage .ms-back-btn + .me-hud-back. A new screen's BACK/CONFIRM = add it to BTN_MENUS so it turns red/green.

**Why:** next UI Maker/menu thread should add new buttons to BTN_MENUS rather than per-menu CSS.
**How to apply:** proof shots in /mnt/project-files/ui-buttons/; notes docs/notes/ui-menus-audio.md "UI Maker pass 29". [[ui-maker]] [[hud-rules]]
