---
name: bane-forecast
description: Banes + Entropy Grenade show spell-style damage previews via battle.js forecastBanePlan (PR #249, 2026-10-17)
metadata:
  type: project
  modified: 2026-10-17T08:15:35.602Z
---
PR #249 merged 2026-10-17 (token 20261017-baneproj-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261017-0815.zip).
mondo: "banes need to have a damage projection just like spells".
- battle.js `forecastBanePlan(thrower, itemKey, target, {castFrom})` + `baneForecastSpell(itemKey)` (stand-in spell, kind 'bane'); ui.js forecastOnUnit routes kind 'bane' to it, so every spell preview surface (board badges/plates, HP-bar slice, target drum, enemy quick menu, hover HUD) shows it.
- **How to apply:** a change to doItem's bane damage (raw, opts, grenade splash) must be mirrored in forecastBanePlan.
- Browser-checked: Tech Bane and grenade previews equalled the real HP lost. Not yet seen by mondo.
Related: [[combat-clarity]].
