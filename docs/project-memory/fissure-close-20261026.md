---
name: fissure-close-20261026
description: PR #555 (2026-10-26) Fissure gap keeps one clock for all 3 tiles; a climber's hang ends when the ground under it closes; flagged calls
metadata:
  type: project
  modified: 2026-10-26T11:22:38.465Z
---
PR #555 merged 2026-10-26, zip r2-sync/ENTROPY_WARS_SYNC_20261026-1122.zip (battle.js, map.js), token 20261026-fissureclose-01-cors.
- Cause of mondo's "climbed tile stayed sunk": a water/ice hit on a unit in the gap turned that cell's lava into stone, and map.js _noteTerrainChange restarted only that cell's 3-round clock. Now an open gap (a timer row with `cut`) keeps its Fissure's clock. A Fissure recast still restarts it.
- battle.js climberFootMoved: when the ground under a hanging climber moves, the hang is read again from the new foot. If the wall is gone, the climb ends with no harm. Before this, a knock-off after the close caused a 5-level fall onto flat ground.
- Flagged to mondo: a paint on a gap's floor no longer gives that cell 3 more rounds; a climber whose wall is gone gets a normal next turn.
- Harness tips: Hailstorm needs an enemy in the blast; a flying caster's line beam does not touch a deep gap's floor; Golem has Fissure in its party-builder pool.
- Proof: /mnt/project-files/fissure-close/. Related: [[climb-multi-turn-20261025]] [[crater-floor-fissure-gap]]
