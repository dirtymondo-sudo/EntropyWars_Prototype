---
name: takeoff-first
description: PR #420 (2026-10-23) Move never takes off for a player's grounded flyer; Take Off / Land are their own AP actions; CPU keeps combined take-off+move
metadata:
  type: project
  modified: 2026-10-23T03:29:23.876Z
---
mondo 10-23 (Cube + wipeout playtests): "dont show tiles that you can take off+move to, it should require you to take off first. Same with land+move, the player should have the choice to spend the ap to take off or land".

- PR #420 merged (token 20261023-takeoff-02-cors), zip r2-sync/ENTROPY_WARS_SYNC_20261023-0329.zip (battle.js 30a3f497).
- battle.js getMoveTiles: the teal `_takeoff` fan-out runs only when `state.autoPlayers[unit.player]` (CPU). Players see walk/jump tiles only. Land+move never existed (airborne move tiles are all in the air).
- Thread's call, flagged: CPU flyers still take off + move in one action. Spell approaches that take off/land in place then cast (`_spellHeightApproaches`) untouched.
- Probe gotcha: in the page, `GAME.state.autoPlayers[1] = true` does not stick (reads back false); to simulate a CPU unit set `unit.player = 2` temporarily. Clicking a tile by mouse is unreliable when staged; call `clickTile(x, y, z)` (the board click entry).
Notes: docs/notes/champions-combat.md "TAKE OFF FIRST". Related: [[climb-mechanic]], [[playtest-cube]].
