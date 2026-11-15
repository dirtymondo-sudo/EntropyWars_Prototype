---
name: action-preview-motion
description: PR #197 (2026-10-13) battle hover holograms perform the move/jump/dash/cast on a loop (showGhostUnit opts.motion)
metadata:
  type: project
  modified: 2026-10-13T23:47:50.567Z
---
PR #197 merged 2026-10-13, token 20261013-actprev-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261013-2347.zip (battle.js e9fb9187, hud.js 2deae987, three-renderer.js 6d2c8704, ui.js cc6fdc7b).
- mondo asked: hover Move/Jump/Move Towards/spell → the preview character actually walks/jumps/dashes there, looping.
- three-renderer showGhostUnit opts.motion {wps, kind walk|fly|dash|leap|blink|shove, castSpell, attack, faceTo, afterTag}; model ghosts get their own mixer with the live unit's clips; one shared loop clock.
- Spells that move nobody still show no caster ghost (the unit is already standing there).
- Only syntax-checked + a node unit check of the timeline; not seen in a browser. Awaiting mondo's in-game check.
Details: docs/notes/spells-vfx.md "THE ACTION PREVIEW MOTION". Related: [[combat-clarity]], [[quick-cast-aim]].
