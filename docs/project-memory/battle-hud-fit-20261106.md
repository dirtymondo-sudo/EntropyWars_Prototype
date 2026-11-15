---
name: battle-hud-fit-20261106
description: PR #963 (11-06) fixed playtest 11-05 group E1-E6 battle HUD overlap/cut-off; where each fix lives
metadata:
  type: project
  modified: 2026-11-06T15:09:58.507Z
---

PR #963 merged 2026-11-06, token 20261106-hudfit-02-cors, uploaded (hud.js, ui.js, three-renderer.js). Notes: docs/notes/ui-menus-audio.md "THE BATTLE HUD FITS". Shots: /mnt/project-files/hud-fit-20261106/.

- Combat log top capped under match info + bars (ui.js `_clogFit`). mondo's shipped UI Maker layout moves the log up 232 px, which caused E1.
- Weather pill drops under the bars when it can't fit beside them (hud.js `_metaFitUnderBars`).
- Cube plates are CSS2D (not plate sprites); now fade under HUD in `_updateTowerCubes`.
- Names shrink to fit: hud.js `ewFitLine` (unit panel), three-renderer `_pmFitName` (plates).
- Abilities menu "! RESISTED" head mark (group 'menu') now drops when forecast plates speak for that body (`dropPressMarksOn`).
- Float pops follow their unit's model; word pops capped at 7% screen; plates fade to 0.45 under pops (HP drain still visible). If mondo dislikes plate fade under numbers, POP_FADE_OP in three-renderer.

Related: [[log-lines-one-event-20261029]] [[hud-rules]]

2026-11-07 PR #983 (token 20261107-chevname-01-cors, uploaded): turn cursor sits over the plate's real drawn top (`_chevPlaceAbove` in `_pmTick`), not a fixed 75 px guess (cause of "COWBO"/"SUCCUB"). `getBlitzTurnUnit` never existed, so tp-active (gold acting name) never applied: now defined in three-renderer. CSS2D plates now run the name fit (`_cssPlateFit`). Shots /mnt/project-files/nameplate-cursor-20261107/.

2026-11-07 PR #1027 (token 20261107-hudwalls-01-cors, uploaded): THE HUD WALLS. Float pops sat under HUD boxes (HUD draws over #floatTextOverlay): HIGH GROUND!/IN THE AIR in top-right corner. `_ewFloatSafeRect` returns `walls` (scoreboard, matchmeta, ap-press, turn-col, clog, achieve-toast); `_floatStep` steps each unit's stack shortest way clear. Command menu rig + minimap NOT walls. Shots /mnt/project-files/playtest-mechanics-20261107/hud-walls/.
