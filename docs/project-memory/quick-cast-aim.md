---
name: quick-cast-aim
description: Quick-cast off-centre AoE aim, ricochet/chain preview plates, tile-menu spell hover preview (PR #105, 2026-10-05)
metadata:
  type: project
  modified: 2026-10-05T01:02:59.116Z
---

PR #105 was merged 2026-10-05 (token 20261005-qcaim-02-cors). Zip: quick-menu-previews/ENTROPY_WARS_QUICK_MENU_PREVIEWS.zip, holding battle.js, hud.js, ui.js and three-renderer.js.

- battle.js findBestAoeAimForTarget picks the AoE centre for a clicked enemy: most visible enemies, then fewest allies. hud.js enemy rows carry `aim`, and the cast and hover preview use it.
- ui.js drawForecastChain draws ricochet, chain, fork and splash victims with crimson plates, hop arrows and badge tags. Overlays: spellChain / actionPlanChain.
- Tile quick menu spell hover calls updateAoePreview(x, y, {unit, spell}).

mondo's standing go-ahead (2026-10-05): threads push, merge and write the zip without asking him. The auto-mode check blocked the first try. A retry that cited his message worked.
Details: docs/notes/ui-menus-audio.md "THE QUICK-CAST AIM + PREVIEWS". Related: [[combat-clarity]].
