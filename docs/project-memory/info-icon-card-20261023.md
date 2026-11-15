---
name: info-icon-card-20261023
description: PR #454 (10-23) Horologe ⓘ + I key open the quick menu's unit info card; old #unitHoverHud card builder removed
metadata:
  type: project
  modified: 2026-10-23T09:42:55.581Z
---
PR #454 merged 2026-10-23, token 20261023-infocard-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0942.zip (hud.js, ui.js).
mondo: "the i info icon next to the unit name on the horologe still opens the old unit info panel, it needs to instead look like the unit info panel of the quick action menu".
- ⓘ / I still toggle state.showUnitInfo; hud.js QuickPeek draws _hrlgQuickCard for it (a turn-icon peek wins). ui.js renderSelectedUnitPanel no longer builds the old card; keeps the reach overlay.
- One card at a time: peek, ⓘ card, quick menu replace each other. No place opens the old card any more.
- The UI Maker's "Inspect card" piece (#unitHoverHud .ins-card) now styles nothing in battle (not touched).
Related: [[hud-rules]] [[battle-hud-turn-column]].
