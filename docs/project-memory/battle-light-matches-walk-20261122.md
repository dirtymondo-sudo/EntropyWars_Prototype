---
name: battle-light-matches-walk-20261122
description: Battle lighting must match exploration game-wide; rounds still flip day/night in story fights (mondo's choice 11-22)
metadata:
  type: project
  modified: 2026-11-22T14:18:24.652Z
---

mondo 2026-11-22: a fight must look like the walk it started from ("seamless transition between exploration and battle"), in every zone.

- PR #2390: the fight's Key Light now matches the walk's in every room kind (three-renderer.js `_fieldKeyLampTick`, HQ_LIGHT_RULES.keyLamp.battleMatch). The 11-15 fix only covered closed rooms with ceilings under 7.35 m. Notes: docs/notes/seamless-field-encounter.md "THE FIGHT WEARS THE WALK'S LIGHT, EVERYWHERE".
- DECIDED by mondo 11-22 (decision card): outdoor story fights KEEP flipping day and night each round, look and rule. Do not hold the walk's hour for the whole fight, and do not ask again.
- Not confirmed on screen: the Cavern (raised ground); the probe's fight camera never reached the units there.
- By day the Circus walk and fight already measured the same; if he reports a bright DAYTIME fight, ask where he stood.

**How to apply:** a "battle brighter/darker than exploration" report = compare the walk's and the fight's lights with `playtest_handover.js <room> --hour=<h> --top` (DIAG-BEFORE vs DIAG-FIGHT) before changing anything.
