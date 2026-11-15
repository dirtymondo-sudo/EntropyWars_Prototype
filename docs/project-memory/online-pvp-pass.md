---
name: online-pvp-pass
description: 2026-10-07 online PvP pass (PR #158) — root causes found for stuck 2nd room, tile leak, voxel arenas on slow seats; friendly map pick added
metadata:
  type: project
  modified: 2026-10-07T08:14:00.118Z
---

PR #158 merged 2026-10-07, token 20261007-onlinepvp-01-cors, zip /mnt/project-files/online-pvp/ENTROPY_WARS_ONLINE_PVP.zip.

- Stuck VS on 2nd game = leftover `_autoStartFired`/`_waitingForOpponent` after the result screen's Main Menu; `window._ewResetOnlineMatchFlags` now clears them on exit and at room-full. In-room rematch worked in a two-browser run.
- Voxel arena online = a slow seat outran the 45 s survey wait (downtown takes ~40 s even in node). Wait now polls `arena-check`/`arena-busy`, cap 180 s.
- Friendly room has a MAP select (Random default); Quick Play stays random.
- Two-browser probe harness lives only in that session's scratchpad (probe3/probe4.js); swiftshader runs take ~10 min per match.

**Why:** next online bug report should start from these, not re-derive them.
**How to apply:** new online flags must be added to `_ewResetOnlineMatchFlags`. See [[zones-plan]] for arenas context.
