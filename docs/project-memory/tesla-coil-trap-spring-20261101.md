---
name: tesla-coil-trap-spring-20261101
description: Tesla Coil, Scrap Mine, Jack-in-the-Box never went off (blocked tile + _detonated guard bug); fixed PRs #714/#715/#717 11-01 with spell shot, spare own team, new looks, JitB stretching spring
metadata:
  type: project
  modified: 2026-11-01T01:59:57.048Z
---
PR #714 merged 2026-11-01 (mondo: "the tesla coil doesnt go off ... vfx on par with other spells, as well as spell camera. Start with tesla coil, then list the other trap/deployable spells").

- Two bugs: deployObject rows block their tile unless `blocksMovement: false` (no enemy could step on them), and `_chainFuses` set `_detonated` before `detonateDeployedObject`, whose own guard then returned, so step blasts never fired.
- New: `springCam` row flag → battle.js `playTrapSpringShot` (relayed 'trap-spring-cam'); `detonateDeployedObject(obj, src, {fxDelayMs, victimId, noCam})`; `_floatHoldUntil` delays victims' numbers to the walk landing.
- PR #715: "the coil should match place bomb" → row flag `sparesOwnTeam`.
- PR #717 (mondo: "yes they should match too", plus a spring that stretches and compresses for JitB):
  - Scrap Mine + JitB rows get blocksMovement:false, springCam, sparesOwnTeam.
  - New Scrap Mine detonate look.
  - JitB coil is a per-vertex helix on a damped bounce.
  - JitB board prop `_buildJackBox3D` (was the red marker).
  - Token 20261101-trapspring-01-cors, zip ENTROPY_WARS_SYNC_20261101-0159.
- List of all traps: /mnt/project-files/tesla-coil/TRAPS_AND_DEPLOYABLES.md. Still open: should springCam go on every trap?
- Not tested in a two-seat online match.

Related [[traps-pack-20261027]] [[lightning-vfx-20261025]].
