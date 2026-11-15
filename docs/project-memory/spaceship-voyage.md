---
name: spaceship-voyage
description: Spaceship deck rebuilt 2026-10-05 as a hull floating in space with streaming wreckage (PR #101); how float.hull + voyage work
metadata:
  type: project
  modified: 2026-10-05T00:36:03.869Z
---
mondo (2026-10-05): the Spaceship deck / arena "looks like a landscape; it needs to be a spaceship like the Flying Dutchman but flying through space".
Cause: E8 arenas are cuts of site rooms, and an open terrain room draws OUTER GROUND to the fog (hills); the field layout also dropped the Δ's motion + near starship.
Fix PR #101 merged (main 6c1ab44), token 20261005-spaceship-01-cors, zip spaceship-arena/ENTROPY_WARS_SPACESHIP.zip (data.js, three-renderer.js).
- Area spec keys: `float: { hull: {...} }` (three-renderer.js _hqBuildHull: ship under a floating field) and `voyage: true` (sky streams in the walk; hqFieldLayout keeps motion + far roster in fights).
- Reusable for any vessel room (e.g. other ships). Notes: docs/notes/maps-terrain-battle.md "THE SHIP UNDER WAY".
- Sandbox WebGPU can't run three 0.186 (texture view `swizzle` unsupported in Chromium 1194); jsdelivr is blocked: serve npm packages from a scratch node_modules in probes.

**Why:** later threads touching ships or open terrain arenas won't re-derive this.
**How to apply:** another "looks like a landscape" room → float it (terrain.float) and/or voyage; see [[level-design-plan]], [[zones-plan]].
