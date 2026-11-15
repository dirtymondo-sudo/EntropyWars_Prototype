---
name: turret-sight-line
description: Turrets need a clear sight line to shoot (PR #225, 2026-10-16): battle.js turretHasShotAt gates volley, real-time scan and aim laser
metadata:
  type: project
  modified: 2026-10-16T06:06:53.307Z
---
PR #225 merged 2026-10-16 (token 20261016-turretlos-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261016-0606.zip: battle.js f9f9f948, three-renderer.js 8aea107b).
mondo: a turret shot him through a wall he raised with Rampart. Cause: turret targeting was range-only.
- battle.js `turretHasShotAt(turret, u)` = isRangeBlockedByTerrain turret→unit (same primitive as spellAimProblem 'los'). Used by processTurretVolleys (turrets + ranged summons), the real-time turret scan, three-renderer `_updateTurretAim` (laser).
- **How to apply:** any new automatic shooter (turret-like, summon with reach) must ask turretHasShotAt or isRangeBlockedByTerrain. Only syntax-checked; not yet seen in-game by mondo.
Related: [[spell-aim-rule]].
