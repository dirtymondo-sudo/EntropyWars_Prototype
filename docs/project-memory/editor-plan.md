---
name: editor-plan
description: EDITOR_PLAN.md — the in-game world/building/dungeon editor (editor.js) that replaces the generated land and the old voxel editor; E0-E4 built 2026-09-29, E5-E8 next
metadata:
  type: project
  modified: 2026-09-29T20:38:12.373Z
---
mondo (2026-09-29) rejected the open world + geography results and wants an in-game editor to build everything by hand. Plan: EDITOR_PLAN.md at the repo root (§13 = the per-phase log). Notes: docs/notes/editor.md (one section per phase). Zips in /mnt/project-files/editor/.

Design: the editor writes what the runtime reads. The world file lives on R2 `Assets/World/` (world.json + rooms/ + prefabs/ + land/), loaded over data.js only when index.html names it (`window._EW_WORLD_ID`, written by `deploy.js --world`). Phases: E0 shell, E1 shapes/prefabs, E2 palette, E3 ground/levels/audits, E4 land + map, E5 dungeons, E6 sky, E7 arenas + delete old `_me*` editor, E8 the swap (`live: true`).

RULINGS: editor.js is a new R2 file. His world starts FLAT AND EMPTY; nothing of the current world is imported; data.js rooms are a LIBRARY; his rooms use `w_roomN` ids.

Status: E0-E4 done and merged (E4 = PR #5, token 20260929-editor-05-cors, zip ENTROPY_WARS_EDITOR_E4.zip: editor.js, data.js, three-renderer.js, styles-editor.css). E4 land export goes to Assets/World/land/, NOT Assets/Land/ (the live game's old bake); world.json `land` is applied only once the world is live (E8). E4 not built: road junctions/signs, an ICE tool, moving bake-land's gradeLine.
E5 done + merged 2026-09-29 (PR #6, token 20260929-editor-06-cors; R2 files editor.js, data.js, three-renderer.js). mondo's ask replaced §5.7's mask/carve brushes: LAYOUT tab draws `space` (room/clearing) + `hall` (hallway/path) rows; room `terrain.gen {kind:'plan', look: walls|trees|rock}` makes the rest solid (trees = game trees the walker can't enter, dirt paths). DUNGEONS table (NEW DUNGEON, + LEVEL), FREEZE for generated rooms/halls plans. Not built: stacked levels on the map. The sandbox refused writing the E5 zip into /mnt/project-files/editor/.

Checking work: a scratch Playwright script that serves local js/css for cdn.entropywars.net URLs and passes other bucket files through; three@0.128.0 + playwright installed with --no-save; screenshots need a ~200 s timeout under swiftshader. Sandbox `THREE.Scene is not a constructor` at index.html load is pre-existing, not the editor's.

E6 done + merged 2026-09-29 (PR #7, token 20260929-editor-07-cors; R2: editor.js, data.js, three-renderer.js). Hide roofs = hide `_ew_hqPart 'ceil'` + clip plane (drum shells don't tag ceilings). Tree row `h` is in 1.75 m TILES, not metres. Room `sky.world/rim` are NOT read by HQ rooms (battle maps only). Next: E7 arenas + delete old editor.

**Why:** the next thread must build E5+ from the plan, not re-derive it.
**How to apply:** read EDITOR_PLAN.md §4, §5, §8, §12 and docs/notes/editor.md before any editor phase; append each phase to §13. Related: [[world-geography-plan]], [[open-world-plan]].
