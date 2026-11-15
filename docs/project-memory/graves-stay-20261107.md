---
name: graves-stay-20261107
description: PR #1022 (11-07): graves now outlive a unit's respawn (state.graves) so Raise the Dead / Cannibalize / Carrion Feast can use them; mondo approved ("sure")
metadata:
  type: project
  modified: 2026-11-07T11:17:21.333Z
---
mondo 2026-11-07 answered "sure" to: should graves survive a unit's respawn so Raise the Dead is castable more often. DONE in PR #1022, token 20261107-graves-02-cors, uploaded live (no zip).

- A respawning unit leaves a `state.graves` row on its death square (battle.js leaveRemainsOnRespawn, called from map.js processRespawns). Not left by consumed corpses, revives, Return of the Dead, bosses. One grave per square.
- Corpse casts read battle.js corpseRemainsBodies / corpseRemainsAt / consumeCorpseRemains (drum, MOVE→CAST, forecast, cast, ai.js).
- Calls made without asking (surface if he objects): Raise the Dead refuses a grave someone/something stands on; graves never expire during a match.
- Cannibalize/Carrion Feast stay enemy-only (PR #1014).
Proof: /mnt/project-files/playtest-mechanics-20261107/graves-stay/. Notes: docs/notes/champions-combat.md "THE GRAVES STAY".
Related: [[playtest-zones-traps-20261107]]
