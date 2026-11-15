---
name: easy-editor-20261028
description: THE EASY EDITOR (PR #631 + #633 + #635, 10-28): editor grouped + explained, every size box in battle squares, modular kit on the squares
metadata:
  type: project
  modified: 2026-10-28T06:08:58.305Z
---

mondo 10-28: "make the editor more user friendly and easy to navigate and understand". PR #631 (token 20261028-easyeditor-01-cors, zip ENTROPY_WARS_SYNC_20261028-0608: editor.js, hud.js, styles-editor.css).

- Nothing removed/renamed/moved between tabs. Tabs in 4 groups (PAL_GROUPS + PAL_TIPS), draw tools in labelled groups (DRAW_GROUPS), top bar 2 rows (`--ed-top-h`, topFit), FIELD_TIPS hover, help = quickStart + '§' section rows; outliner sizes in squares. Notes: docs/notes/editor.md "THE EASY EDITOR". Shots /mnt/project-files/editor-easy/.
- PR #633 (10-28, coordinator relayed his 10-19 rule as the go): every size box in battle squares; files still store metres (sqOf / mOfSq / sqTxt, sqKey for inspector lengths, SNAP off/⅛/¼/½/TILE). Token 20261028-edsquares-02-cors, zip ENTROPY_WARS_SYNC_20261028-0623. Unchanged on purpose: RAW JSON, kit args, fog density per metre.
- PR #635 (10-28, his "won't snap to the tile grid / floor overhangs the wall"): MODULAR Cell was 4 m from the room middle (pre-#633 bug). Now modCell() = whole squares (min 1, default 2) on the tileOff lattice; floor s>0 reaches the outer faces of the walls below; SNAP default TILE. Token 20261028-edsnap-01-cors. Gotcha: never put a // comment mid-line in the ED defaults (it commented out tool:'translate' and broke the gizmo every frame).
- Editor screenshots in the cloud: the shared harness (/tmp/ph, [[sandbox-playtest-speed]]); the main-menu EDITOR button needs a wheel scroll first at 1280x720.

See [[editor-plan]] [[floor-gaps-20261028]].
