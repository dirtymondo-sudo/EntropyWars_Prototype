---
name: support-forecast-20261029
description: PR #658 (10-29) every heal/shield/revive previews from the cast's own math; Cube approach rows forecast from the step tile
metadata:
  type: project
  modified: 2026-10-29T01:29:37.836Z
---

PR #658 (merged 2026-10-29) is mondo's fix for "previews need to be robust, even heals" (playtest R10, screenshot 11).
- Cause: ui.js `_estimateSpellHeal` only read `spell.heal`. 20 of 22 heal rows use `healAmt`. Cube JUMP/MOVE→ATK rows called `getCubeAttackForecast` from the unit's current tile and got null.
- Now: battle.js helpers (spellHealAmountFor, healAllAmountFor, selfHealAmountFor, spellShieldGainFor, aoeShieldPerAlly, reviveHpFor, healLandsOn, _healScaledAmount with the weather mult) are shared by doSpell AND forecastSpellPlan (`_FORECAST_SUPPORT_KINDS`). ui.js `forecastSupportOn(caster, target, spell, castFrom)` feeds hud rows, the ally quick menu, nameplates and badges. `getCubeAttackForecast(u, tw, {castFrom})`.
- Not previewed (per-turn ticks): zoneHeal, seedHeal, deployObject auraHeal.
- The "bug 8 no previews" line in that report is really the missing map-picker site pictures (MapShots 404). Routed to the coordinator, not in this PR.

**How to apply:** a new heal/shield kind must go through these helpers so the preview and the cast stay equal. Notes: docs/notes/champions-combat.md "THE SUPPORT FORECAST". Related: [[playtest-vscpu-r10-20261028]]
