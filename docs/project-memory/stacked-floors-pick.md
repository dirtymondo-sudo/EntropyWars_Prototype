---
name: stacked-floors-pick
description: How battle clicks pick between a bridge deck and the ground under it (PR #417, 2026-10-22): unlit floor never takes the pointer; F flips floors
metadata:
  type: project
  modified: 2026-10-22T20:17:56.908Z
---
mondo 2026-10-22 (playtest 2, "Unsure what to press" 6): clicks on a bridge with no route on top must go to the tile under it; asked for an elegant way to choose when both floors are reachable ("huge deal" for multi-floor maps).

PR #417 merged (main a8b74c4, token 20261022-stackfloor-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261022-2017.zip).
- Cause: Giza Arena is a field board; THE TWO FLOORS picker (`_fieldFloorPick`) fell back to the deck when the cell behind the deck pixel was unlit (range edge). Elsewhere the deck won unless the overhead fade had already opened it.
- Rule (three-renderer `_boardFloorPick`, hover + click, all maps): an unlit floor never takes the pointer; first lit floor along the ray (ThreeCamera.screenToTileAll), else the lit floor under the deck in its own column.
- Both lit: front floor wins; F flips the hovered column's floor (deck fades, cursor drops). Prompt bar shows "F floor below/above" only then (`window._ewStackPick`). The F key was the thread's choice; mondo has not confirmed it yet.
- Browser harness recipe in [[hands-on-playtest]] / [[move-towards-click]]. Notes: docs/notes/champions-combat.md "THE STACKED FLOORS".
