---
name: tile-info-panel-plan-20261108
description: Tile info panel (click a square → terrain card + effect badges + small Move/Inspect/Jump buttons, tabs per layer) SHIPPED PR #1048 11-08; Poison Bog gives POISON
metadata:
  type: project
  modified: 2026-11-08T06:15:49.030Z
---
mondo 2026-11-08 asked for a tile info panel like the unit info panel: the square's terrain picture, its effects as badges, Move/Inspect/Jump as small buttons on one row. The same for turrets (attack), trees (chop) and other objects. Tabs per layer.

Plan + mockup: /mnt/project-files/tile-info-panel/ (PLAN.md, tile_info_panel_mockup.jpg/.html). Thread (thread in the owner project). APPROVED 11-08 (decision "Build it, open on the top thing"). SHIPPED PR #1048 (merged + R2 live 11-08, ?v=20261108-tilecard-01-cors). Proof shots /mnt/project-files/tile-info-panel/shots/. Awaiting his review/feedback.

Approved rule:
- Tabs run ground up: TERRAIN · OBJECT · UNIT.
- The panel opens on the top thing. Soft things (walkable forest, open door) open on TERRAIN.
- A tab swaps only the card + its small buttons. Spell rows stay full rows below.
- Small buttons: Move here/towards, Jump, Take Off + Move, Climb, Inspect (gold), Ward, Channel, Dig, Place block; object tab: Attack/Chop. Spells + Place Capture Door stay full rows.

RULE CHANGE BY MONDO 11-08: "yes of course poison bog should give poison". Poison Bog (poison / poison_bog rows) now applies the real POISON status 2 rounds at turn end (data.js turnStatus field), no more flat −12 HP. Move preview + CPU hazard cost updated to match.

Card is 680 px wide so the usual 4 buttons sit on ONE row and it clears the scoreboard (at 500 they wrapped and touched the P1 bar). Terrain ticks are at ROUND START (state.js beginBlitzRound → map.js applyTerrainTurnEffects), not at the unit's own turn end.

Code: battle.js tileEffectsAt / predictTerrainStatusesAt; three-renderer.js tileSwatch; hud.js tile card; data.js endTurn numbers are row fields (turnStatus, turnHealPct, turnMpPct).

Related: [[hud-rules]] [[ui-maker]] [[battle-hud-fit-20261106]]
