---
name: sheet-per-square-door-20261103
description: Terrain sheets one sprite per 3.5 m square (mondo's pick) + match-intro door scaled to body size, PR #840, zip 20261103-0923
metadata:
  type: project
  modified: 2026-11-03T09:24:14.416Z
---
2026-11-03 mondo asked whether 2x board stretched terrain textures and said the match-intro door was too big.

- Finding: sheets were NOT stretched; terrain sheets stayed 1.75 m (HQ_TERRAIN_RULES.tile), so each 3.5 m square showed 2x2 sprites.
- From side-by-sides (/mnt/project-files/terrain-sheet-size/) mondo picked "one sprite per square".
- PR #840 merged (token 20261103-sheetdoor-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261103-0923.zip).
- three-renderer.js `_hqSheetM(info)` = max(info.tile, room.fieldSquareM || HQ_FIELD_RULES.squareM). Used for `TS` in _hqBuildTerrain (field UVs, info._TM triplanar, wall _nrBoxUV), board marks, _fieldPatchRep.
- GOTCHA: `TM` in _hqBuildTerrain is ALSO the model scale (_nrKit ts, trees, traffic, hulls). Never scale TM for a texture change (Codex caught trees doubling). Water sheets keep TM.
- Kill switch window.EW_SHEET_REAL_SIZE. Box-room floors/walls unchanged.
- Door: `_introBuildDoor(..., bodyK)`; match intro passes UNIT_SPRITE_SIZE_RATIO, door group scaled (2.16 -> 1.08 tiles on Stonehenge). Menu door unchanged.
- The preview shots mondo saw also had trees doubled (preview bug); the shipped version only changes ground sprites.
Notes: docs/notes/maps-terrain-battle.md "THE DOOR AT BODY SIZE + THE SHEET SIZE QUESTION". Related [[strip-big-squares-20261028]]
