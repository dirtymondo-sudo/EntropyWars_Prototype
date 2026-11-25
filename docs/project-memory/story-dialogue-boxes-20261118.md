---
name: story-dialogue-boxes-20261118
description: Story dialogue box redesign (mondo 11-18): option B "THE PORTRAIT" SHIPPED PR #2108; own ew-dlg look immune to UI Maker/theme, NO hint text under it
metadata:
  type: project
  modified: 2026-11-18T06:44:03.337Z
---
Thread (owner-project id). mondo 11-18 picked option B from mock-ups (/mnt/project-files/dialogue-boxes/) and was ANGRY about hint text under the panel ("nonsense ai slop text ... delete all of that"). Never put key-hint lines under dialogue boxes.

- SHIPPED PR #2108 (token 20261118-dialogue-01-cors, live on R2): map.js `window.EWDlg` = one builder for walk lines / talks / strike ladder / muggings / cast lines, battle.js pay-off box, three-camera.js cutscene words + choices. Faded black band, speaker face PS1 window left, gold name, typing, answers window right under YOU with ▶. No sub ("lives at"/LV), no ✕, no hints.
- CSS styles-base.css "THE DIALOGUE BOX" (`ew-dlg-*`, !important strip of themed card). Notes docs/notes/ui-menus-audio.md "THE DIALOGUE BOX". Proof /mnt/project-files/dialogue-boxes/proof/.
- Unanswered by him, shipped with my picks: level dropped, Fight green, player never speaks, cutscenes + pay-off use the same look. Cast faces = own model portrait only (hidden until ready).
