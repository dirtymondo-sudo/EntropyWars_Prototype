---
name: edge-hover-way-back
description: PR #407 (2026-10-22) AoE red preview missing when the pointer comes back onto an edge tile from outside the range; cause, fix, combat-log dead zone
metadata:
  type: project
  modified: 2026-10-22T06:35:59.771Z
---
PR #407 merged 2026-10-22 (main a4974ab, token 20261022-edgehover-01-cors). Zip r2-sync/ENTROPY_WARS_SYNC_20261022-0635.zip (battle.js 79baacf4, hud.js f2e7a8c4).

mondo: hover an edge tile, go out past the highlights, come back onto the same tile, and the AoE red preview or Move walk preview does not show.

- Cause, reproduced in a browser: battle.js `updateHoveredTarget` kept `state.pendingTarget` (viaHover) on out-of-range or wrong-team hovers but wiped the preview. The way back onto the same tile read as "no change". Raycast picks were fine right up to the tile edge.
- Fix: module-local `_hoverPickLeft` forces a repaint. The wrong-team branches also `_clearSpellApproachPreview()`. No targeting rule changed.
- Move walk preview recovered on every path tried, before and after the fix, so no Move code changed.
- Dead zone found: the combat log box `#ewCombatLog` (340x340, pointer-events auto) catches the mouse over its see-through top, so board tiles behind it never hover. Flagged to mondo, not changed.
- Shots: /mnt/project-files/edge-hover/. Notes: docs/notes/ui-menus-audio.md "THE WAY BACK IN".
- Browser harness for this kind of probe: launch.js with CDP 9333 + page.route, then connect per step. `_ewShotRecApi.place` stages units. Hover checks need a real page.mouse.move and a settled camera (SwiftShader glides take about 30 s).
