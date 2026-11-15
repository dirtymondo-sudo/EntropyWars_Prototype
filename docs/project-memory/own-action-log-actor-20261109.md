---
name: own-action-log-actor-20261109
description: addLog o.actor (entry.a) = the seat whose own action a log line is; that seat always sees it under fog (PR #1074, 11-09)
metadata:
  type: project
---

PR #1074 (merged + live 2026-11-09, (thread in the owner project): a player's own throw/push/pull/teleport line
was dropped from their own log when the landing square sat in their fog. Both seats had it (guest = online.js _gvLogShows, host = battle.js _logFogVisible).

Rule now: battle.js `addLog(msg, vis, hp, { actor: unit|player })` writes `entry.a`. `_logVisible` and `_gvLogShows` always show a line to seat `a`.
Other seats judge it as before. `_logPushMove(lead, target, res, verb, actor)`. A NEW forced-move/teleport line must pass `{ actor: unit }`.
Weather flings, aura-tree pushes, Door Gun maws are deliberately untagged.

Proof: 2 Chromium seats, To the Moon into fog both ways, /mnt/project-files/own-throw-log-fog-20261109/.
Harness tip: menu rows slide in, so wait for the element to stop moving before clicking (two misclicks cast the wrong spell); landing pick = ThreeRenderer.worldToScreen + canvas rect.
Related [[pvp-playtest-20261109]] [[forced-move-log-lines-20261107]] [[online-fog]]
