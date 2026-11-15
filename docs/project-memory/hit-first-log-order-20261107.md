---
name: hit-first-log-order-20261107
description: PR #1011 (2026-11-07) combat log convention: a hit's line is written first, then its shield/drink/save riders and everything the hit sets off
metadata:
  type: project
---

PR #1011 merged + live 2026-11-07 (token 20261107-hitfirst-01-cors, battle.js b9cfabee). Log order only, no rules changed.

Convention: in battle.js applyDamageToUnit the hit line is written right after `target.hp -= finalDamage`, BEFORE everything the hit sets off (reveal, on-hit statuses, link echoes, Contract, Power Core).
- The hit's own body riders (shield soak, element-part drink, Indomitable save) go through `_hitRiderAdd(riders, key, n, make)` and print after the hit line (or after "blocks the hit.") via `_hitRiderFlush`.
- Multi-hit logSink: riders sit on `sink.riders`, summed per kind, written after the one total line in `_multiHitLogFlush`.
- Lines that explain a hit stay BEFORE it on purpose: weak/resist, combo, Marked, "gone before the blow", Walk the Plank's drown.

Proof: /mnt/project-files/playtest-mechanics-20261107/hit-first-log/.

Related: [[forced-move-log-lines-20261107]]
