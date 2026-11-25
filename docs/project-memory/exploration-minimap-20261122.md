---
name: exploration-minimap-20261122
description: Exploration minimap shipped PR #2403 (bottom right, north up, battle look, quest diamond); mondo's picks, where it lives, what is unchecked
metadata:
  type: project
---
mondo 2026-11-22 ((thread in the owner project)): "add a minimap to the exploration mode. It should look similar/identical to the one from battle. It should have quest markers too". His picks on the mock-up: "definitely bottom right, north always up, grey walls and blue water are fine, yes npcs should show".

SHIPPED PR #2403 (token 20261122-hqminimap-02-cors; three-renderer.js + styles-hud.css uploaded). three-renderer.js THE EXPLORATION MINIMAP (`_hqMmUpdate` from `_hqFrame`, `#ewHqMinimap` in `#hqPage`); look = battle minimap's `_mmLook()` (UI Maker Minimap look), own element so UI Maker placement of the battle one does not move it. 15 squares of 3.5 m, squares asked once on entering the window (no room scan), people from `_hq.chars`, quest = `hq.questMark` target. Notes: docs/notes/ui-menus-audio.md "THE EXPLORATION MINIMAP". Off: `window.EW_NO_HQ_MINIMAP`.

Colours: arrow = you; ally colour = story cast; foe colour = fightable unit (hqEncounterCharOk, so most city residents); white = others; green = doors; gold diamond = quest.

Unchecked: blue water squares, red dots, Disaster City, his Mac, phone (may sit over touch buttons). Not in the UI Maker as its own piece (possible ask). Proof: /mnt/project-files/exploration-minimap/.

Related: [[minimap-previews-20261112]] [[quest-system-20261112]]
