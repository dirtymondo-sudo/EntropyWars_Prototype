---
name: combat-clarity
description: Combat clarity pass (PR #38, 2026-10-01) — one engine forecast feeds every spell preview; reach amber vs hit crimson palette
metadata:
  type: project
  modified: 2026-10-01T08:49:18.239Z
---

PR #38 was merged 2026-10-01. The zip is at combat-clarity/ENTROPY_WARS_COMBAT_CLARITY.zip and holds battle.js, ui.js, hud.js and three-renderer.js. Token: 20261001-clarity-01-cors.

- All damage numbers and landing previews come from battle.js forecastSpellPlan / forecastHitOnUnit / forecastBasicAttack, and those use the real hit math (_hitDamageMath with live=false).
- New spell kinds or effects must be added to forecastSpellPlan (_FORECAST_KINDS), or their previews fall back to the old estimators.
- Palette (window.EW_PREVIEW):
  - reach: amber lattice;
  - hit: crimson plate with an inner frame;
  - caster move: blue;
  - other moved bodies: purple.
- mondo asked for "absolute visual clarity" and previews on every spell. Keep red for "will be hit" only.

Details: docs/notes/spells-vfx.md "THE COMBAT CLARITY PASS".
