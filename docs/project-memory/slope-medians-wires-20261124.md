---
name: slope-medians-wires-20261124
description: Stepped medians + pole wires on hills fixed PR #2520 (11-24): sheared Bayside median, `wire` rows strung by bake-disaster-city.js, hugging highway median barriers
metadata:
  type: project
  modified: 2026-11-24T13:32:42.831Z
---
Thread (owner-project id). LIVE PR #2520 (data.js 216ced81, token 20261124-slopes-02-cors).
- Cause: long things drawn as level pieces each at one height -> stairs on a slope (same class as [[grounded-fences-20261123]]).
- Fixes: B.js median pieces `shear`; city pole wires = `wire: {to, top, sag, offs}` row, strung in bake-disaster-city.js levels pass (THE STRUNG WIRES) at real ground under each pole; bake-route.js highway median barriers `hug: true` (data.js rows sed-edited, no route rebake).
- **How to apply:** any new wire line in DC uses a `wire` row; any slope-following arch piece uses `shear` or `hug`.
- Highway barriers not pictured. Proof /mnt/project-files/slope-medians-wires/. Notes areas-complexes.md "THE SLANTED MEDIANS + STRUNG WIRES".
- Follow-up PR #2521 (11-24): Bayside coast road stays 4 squares ("respect the battle grid"); median rows carry `median: [x0,z0,x1,z1]` (off origin), road marks draw lane dashes at w/4 each side, no centre dashes along it.
