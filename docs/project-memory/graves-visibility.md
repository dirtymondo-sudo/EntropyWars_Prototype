---
name: graves-visibility
description: Gravestone/bone pile display rules (PR #393, 2026-10-21): own graves always shown, enemy remains stay once seen; bone GLB load rebuilds piles
metadata:
  type: project
  modified: 2026-10-21T03:27:53.194Z
---
mondo (2026-10-21): gravestones and bone stacks flickered (vanished and came back within a turn). PR #393 merged (token 20261021-graves-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261021-0327.zip, three-renderer.js only).

Cause: graves were fog-gated by live tile vision (LOS changes with every move / blitz handoff / intro end); bone piles built before the bone GLBs loaded stayed empty because the load only flipped `_objectsDirty` (never rebuilds deployables).

Rule now: viewer's own fallen = always shown (`_ew_depOwner`); enemy remains = shown once the viewer's fog pass saw the tile (`_graveSeen` in three-renderer.js, renderer-local, pruned when the grave goes). Display only; grave rules unchanged.

**Why:** he wants board objects to be consistent; see also [[occlusion-fade-rules]].
**How to apply:** don't re-gate graves by live vision. Notes: docs/notes/spells-vfx.md "THE GRAVES HOLD STILL".
