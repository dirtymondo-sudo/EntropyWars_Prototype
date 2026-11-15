---
name: climb-two-ways-20261101
description: PR #718 (2026-11-01) 2 AP climb = on top same turn; 1 AP left = the old hang; tall faces unchanged (flagged); CPU climbing not done
metadata:
  type: project
  modified: 2026-11-01T02:12:54.684Z
---
PR #718 merged 2026-11-01, zip r2-sync/ENTROPY_WARS_SYNC_20261101-0212.zip (battle f726e6c0, data 70160a6c, hud 8cc126d1, ui ae054959).
- mondo's rule: climb with 2 AP ends the turn but the unit is on top right then; climb with 1 AP left (e.g. Move + Climb) hangs until next turn, knockable, as before.
- battle.js CLIMB_RULES.instantAp 2, climbIsInstant; _startClimb runs processClimbArrival right after the clip. Tile actions read "Climb up · top now" / "Climb up · hang (fall −N HP)".
- Flagged call: a face taller than one stretch (jump+2) is still a stretch per turn even with 2 AP.
- Tutorial HEIGHT tape text updated; its climb goal accepts the 2 AP climb.
- CPU climbing NOT built yet (mondo wants it after this; separate thread for CPU jump).
- Proof: /mnt/project-files/climb-two-ways/climb_two_ways.jpg. Related: [[climb-multi-turn-20261025]] [[climb-mechanic]]
