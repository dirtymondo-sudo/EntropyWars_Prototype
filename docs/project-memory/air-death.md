---
name: air-death
description: Midair deaths (PR #405, 2026-10-22): body falls to the floor, gore floor marks on the ground under flyers; sandbox probe recipe
metadata:
  type: project
  modified: 2026-10-22T06:22:59.581Z
---
mondo 10-22: "if a unit dies in the air their blood splat stays floating ... consider a separate death animation and blood for units that die in the air". PR #405 merged (token 20261022-airdeath-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261022-0618.zip: three-renderer.js 4cd1e80b, three-vfx-effects.js 4341a1a5). Screens: /mnt/project-files/air-death/.

- fireBlood floor marks now at ThreeRenderer.unitGroundY (floor under a flyer/climber), not body height (fixed every hit on a flyer too).
- Air death (thread's call, display only): drop > 0.15 tile → `fall` clip (Fall3) under gravity, then `deathCollapse` on the ground whatever style battle.js picked, then lie + dissolve; fireBloodLand splash + pool where it lands. Nothing relayed; guest renderer drops its own copy. Kill switch EW_NO_AIR_DEATH. Notes docs/notes/spells-vfx.md "THE FALL FROM THE AIR". See [[gore-rules]].

Probe recipe (worked): scratchpad npm install of the import-map packages + socket.io-client; Playwright route jsdelivr → node_modules, cdn.entropywars.net *.js → repo, other R2 assets curl-cached; `?nohq`, _goToVsCpu + _msConfirm. Side view via EWCine.enter({force:true}) + EWCine.play([key,key]) with p in world/64 (fight C.unit = 64); retry play until the camera lands (C.unit is 1 before the first frame). Kill = ThreeVFXEffects.fireBlood(killing_blow, unitId) + defeatUnit(v) (both global).
