---
name: inspect-one-tile-random-keys-20261023
description: PR #467 (10-23) - Inspect searches exactly 1 tile for everyone (no VISION scaling); Keys spawn anywhere on the board, no spacing
metadata:
  type: project
  modified: 2026-10-23T21:33:35.090Z
---

mondo 2026-10-23: "inspect shouldnt grow with vision, it should only be 1 tile at a time for everyone. But some units can still have longer inspect ranges. Also let's make the keys completely random on the whole board, not any rules like have to be 2 tiles apart ... That makes it too easy."

Shipped PR #467 (sync zip r2-sync/ENTROPY_WARS_SYNC_20261023-2133.zip):
- state.js getInspectTileCount = 1. Inspect REACH unchanged (RACE_KITS inspect 2 races, scanner trait +1, gear inspectBonus, Far Sight 4). No new reach added.
- Key placement: removed 2-tile spacing + centre-columns-first pass. Kept: walkable, reachable from unit starts (flood skips Cube tiles), no unit on tile, one Key per tile, per-floor split. Round-10 top-up whole-board too.
- CPU search map: uniform over open tiles; searchCenterPrior_v1 weight kept but no effect.
- Tutorial: WIN BY KEYS last Key hint is now "a tile next to the marked tile".

**How to apply:** never reintroduce Key spacing or VISION-sized scans. See [[hidden-keys-20261023]] [[matchup-keys-vs-keys-20261023]].
