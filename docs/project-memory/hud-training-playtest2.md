---
name: hud-training-playtest2
description: PR #415 (10-22) playtest-2 HUD/menus/Training fixes: menu fade for plates + Nexus counter, CPU turn recap on Training, Imitation Report left+draggable, tips/year/"defeated"
metadata:
  type: project
  modified: 2026-10-22T20:14:46.465Z
---
PR #415 merged 2026-10-22 (main 4003ea6, token 20261022-hudtrain-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261022-2014.zip).
- Name plates + Nexus counter fade to 0.22 over open menus (three-renderer `_wmMenuRects`/`_wmOverMenu`, kill switch EW_NO_MENU_FADE). Combat log not counted as a menu.
- Panels lost the "<SPELL> — CLICK A TARGET" mode line (only the panel-less move/jump `.hrlg-mode.lone` keeps it).
- Combat text box slide (`_subDodge`) already worked in a real browser; the playtest shot was a sub-1fps sandbox artefact.
- Training CPU turn recap (AAA 2, mondo "sure" but also "is the log not enough?"): net HP pop per unit + red tiles where CPU moved, 1.7 s, at the next human unit (battle.js `_trainRecapShow`). If he calls it noise, it's one function to drop.
- Training combo cinematic NOT reproduced (staged CPU Blood Pact under turbo: no shot). No code change; told mondo to send a screenshot if it recurs.
- Imitation Report opens top-left, drags by title bar. Loading tips for CTF/Hotspot deleted; setup head-line year removed; result line "is defeated."
Related: [[hud-rules]] [[hands-on-playtest]]
