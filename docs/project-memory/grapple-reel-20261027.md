---
name: grapple-reel-20261027
description: Grapple rule change shipped in PR #599 (2026-10-27): range 5, no anchor needed, lit tiles = real landings; anchor drop flagged to mondo
metadata:
  type: project
  modified: 2026-10-27T08:10:23.465Z
---

mondo (10-27) said Grapple needed more range and its lit tiles were misleading ("needs a wall/pillar/unit"). PR #599 merged; the sync zip was ENTROPY_WARS_SYNC_20261027-0809.

- Range went from 3 to 5. Grapple costs 1 AP, deals no damage and does NOT end the turn, so Grapple + Attack works.
- The ANCHOR REQUIREMENT IS DROPPED. This was the thread's pick and was flagged to mondo; he could still ask for the "anchors only" option instead. The reel goes onto any free tile in a straight line, or lands beside a wall/door/Cube/object/ally/ENEMY. Enemy anchors are new, because the old Batch D rule refused enemies.
- One function decides every landing: battle.js `grappleLandingFor(unit,x,y,{viewer,partial})`. `isGrappleReel(spell)` marks the selfPullOnly row. spellAimProblem has a new code 'blocked', labelled "Line blocked".
- The "nothing happened" tile came from two things: utility minRange 0 lit the caster's own tile, and the drum pre-picked the caster. The caster is never a Grapple target now.
- The other thread from the same ask covers dash/grapple in the move+cast action menus.

**How to apply:** route any new Grapple preview or AI code through grappleLandingFor; don't re-add anchor checks. Related: [[forced-movement]] [[target-column-rule]]
