---
name: range-fit-camera
description: PR #199 (2026-10-14) Move/Jump/spell-aim camera fits only the lit range tiles (_tilePickFrame), zooms in or out to it
metadata:
  type: project
---
PR #199 merged 2026-10-14, token 20261014-rangefit-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261014-0232.zip (battle.js 247207a4).
- mondo: Move still zoomed out to the whole map; wants just enough to see the move or spell range.
- Cause: old _tilePickFitZoom(reach+1.5) square on tightest axis (at 45° yaw ~2-3x the range area) + Math.min(current zoom, fit) kept wide views.
- Fix: battle.js _tilePickFrame projects lit tiles (getMoveTiles/getJumpTiles/getSpellRangeTiles) through the TILE_PICK_TILT pose, centres on them, exact eye distance; margins H 0.80 / V 0.86, floor ±3 tiles. Zooms in OR out.
- Only syntax-checked plus a node check of the maths; not seen in game. If he says still too far/close, tune the margins.
Notes: docs/notes/champions-combat.md "THE RANGE FIT". Related: [[cinematic-camera]].
