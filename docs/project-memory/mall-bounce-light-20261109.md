---
name: mall-bounce-light-20261109
description: Disaster City mall "all black" inside (11-09, PR #1070) = closed-room hemisphere ground was near-black + ceiling lamps lost the 10-prop-light budget
metadata:
  type: project
  modified: 2026-11-09T06:00:10.278Z
---
mondo 11-09 (Firefox, ?ew_gpu=webgpu): "the inside of the mall is all black". Thread (thread in the owner project).

- Cause 1: closed box rooms' HemisphereLight ground colour was fixed 0x1c1a1e, so ceilings and anything facing down got light only from lamps close by. The mall is 96x64x12 m, so it read black overhead. Fix: three-renderer.js `_hqBoxHemiG` = floorColor mixed HQ_LIGHT_RULES.bounce.amount (0.6) over the old black. Applies to EVERY closed box room (walk, door blend, field fight).
- Cause 2: HQ_PROP_LIGHT_MAX 10 went to the first rows (lava lamps + 6 slot machines), so the 9 saucer/sputnik ceiling lamps had no light. Fix: `_hqPlaceProps` gives ceiling lamps the budget first, then row order. Only the mall was affected.
- Token 20261109-mallbounce-02-cors, uploaded data.js 5f2d97f7, three-renderer.js 3b1ed181. Proof: /mnt/project-files/mall-black-interior/ (node renderer on WebGL 2; not seen on real WebGPU).
- Harness gotcha: headless swiftshader draws floors / the walker black for minutes after entering a big room while shaders compile. Shoot each view twice and keep the second. Related [[headless-hq-proof-gotchas-20261108]].
