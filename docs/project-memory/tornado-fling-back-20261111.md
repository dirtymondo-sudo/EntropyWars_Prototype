---
name: tornado-fling-back-20261111
description: PR #1132 (11-11) tornado/hurricane fling that bounces back into the eye or is stopped short is now shown + logged; open question for mondo; headless repro recipe
metadata:
  type: project
---
mondo 11-11 (Hell Arena (Calm), Sheriff): "tornado moved to the same tile as my cowboy in between rounds, but it didnt fling him". Thread (thread in the owner project).

- Cause (reproduced, WebGL2 headless): battle.js `vortexFlingUnit` returned silently when the body ended on its start tile: thrown 1 square into the board edge / wall and rebounded straight back into the eye, or stopped at once by a neighbour (bowling crash hands momentum over). Damage landed, no fling line / FX / pop. A free fling always worked. Natural tornado only (no Summon Tornado spell exists).
- Fix PR #1132 (token 20261111-flingback-01-cors, battle.js 01745bcf live): no rule change; logs "flings X north, and X is thrown straight back into the eye" / "is stopped short and stays in the eye", lift-spin-hurl to the struck square + slide steps back, FLUNG pop, round waits. Notes: docs/notes/champions-combat.md "THE FLING THAT COMES BACK". Related [[forced-movement-rules]].
- NOT confirmed this was his exact case (inferred from the screenshot: cowboy near the board edge). Motion not viewed (headless ~20 s per frame). OPEN for mondo: should a body that bounces back stop beside the eye instead of ending in it (would be a rule change, not built).
- Also seen, untouched: a cast storm spares the caster's team at round end, but a teammate WALKING into it is flung.
- Harness: /mnt/project-files/tornado-fling-20261111/ boot.js (MAP="Hell Arena (Calm)") + repro.js (CASES shotb0 bounce, shotp2 stopped, natN free; LOCAL_ASSETS=battle.js for repo copy). Calls processHomingWeather directly; driving real round ends by ending turns hung.
