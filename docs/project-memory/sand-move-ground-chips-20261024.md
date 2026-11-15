---
name: sand-move-ground-chips-20261024
description: PR #490 (10-24) Desert move cost 2->1 (Ice Queen jump-only bug) + ground chips showing terrain move cost/affinity on units
metadata:
  type: project
  modified: 2026-10-24T13:33:37.143Z
---
mondo 10-24 (PvP playtest item 7): "take away the mov-2 property from desert ... that needs to show just like the attack and defense stages show".
- PR #490 merged (main b4677b6, token 20261024-sandmove-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1333.zip).
- Desert moveCost 1. Ice Queen bug CONFIRMED: she is MOV 1, sand at 2/tile left 0 walk tiles -> only Jump (closes the "Ice Queen can only jump" open item).
- Terrain movement is per-tile-entered cost, never a MOV stat. state.js getTerrainStatChips shows "<glyph> MOV COST N" while standing on ground costing that unit >1, plus terrain affinity stats (TERRAIN_PREFERENCE_BONUS, e.g. Anubis on sand ATK+8, M ATK+5). Card/quick-menu chips + plate badge row (plate badges hidden in current plate mode, same as stage/storm badges).
- Thread call flagged: the affinity chips also show (not only movement). Shared playtest-harness page.js window.ThreeRenderer bug fixed (draw on demand works now).
Related: [[element-terrain]] [[index-rules-elements-terrain-camera]]
