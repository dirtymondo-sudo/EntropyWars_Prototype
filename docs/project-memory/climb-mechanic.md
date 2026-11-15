---
name: climb-mechanic
description: Climb mechanic design (not built) and the race-editor JUMP stat (PR #264, 2026-10-17)
metadata:
  type: project
  modified: 2026-10-17T11:41:35.231Z
---
- mondo brainstormed a battle CLIMB (ledge too high to jump: hang exposed until next turn, lowered DEF, no counter/dodge/opp attack, knockable with fall damage). Design notes: /mnt/project-files/design/CLIMB_MECHANIC_DESIGN.md. NOT built; he must pick the 5 decisions in its last section first.
- Recommendations in it: climb ends the turn (Move+Climb like Move+Attack), cap = jump height + 2, any damaging hit/push knocks off with forced fall threshold 1, climb down allowed, edge-wall panels/arena rock/roofs unclimbable.
- His ask for the look: play Fast_Ladder_Climb briefly then freeze the clip (timeScale 0) as the hang pose until next turn; mantle with ClimbUp_1m on arrival (exploration ladders already freeze this way).
- PR #264 merged: race jump moved to data.js RACE_JUMP + raceJumpStat (same values); race editor shows/edits JUMP; export field `jump`. On the 200 SPD scale the SPD-90 rule gives 44 races jump 2 from SPD alone (78/124 jump 2) - flagged to mondo.
- Zip r2-sync/ENTROPY_WARS_SYNC_20261017-1141.zip (battle.js 2bfa6c91, data.js c5bde7c6, ui.js d8549fa9).
