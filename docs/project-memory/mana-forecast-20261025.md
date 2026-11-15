---
name: mana-forecast-20261025
description: MP bar preview (cost / Memory Leak drain / Free Energy + Mana Potion restore) on every MP bar, ui.js getPendingManaPreview (PR #506, 2026-10-25)
metadata:
  type: project
  modified: 2026-10-25T05:31:50.921Z
---
PR #506 merged 2026-10-25 (token 20261025-mpprev-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261025-0531.zip).
mondo: "there needs to be a mana bar preview just like for healing and damage".
- ui.js `getPendingManaPreview()` / `window._ewManaPreviewFor(id)`: caster cost (getSpellMpCostFor), Memory Leak mpDrain, Free Energy manaRestoreAll (other allies), Mana Potion (mpPct). Horologe cursor row publishes `window._ewRowMpSpend`.
- Painted on plates, ring vitals (GLSL + TSL uPrevMp/uPrevMpGain), turn icon rings, info card, target rows, Horologe.
- **How to apply:** a change to MP math in battle.js must be mirrored in ui.js `_manaForecast`.
- Browser-checked: previews equalled the MP really moved. Plate MP bars only show at near zoom (tp-far hides them). Not yet seen by mondo.
- Lesson: a fresh thread's `origin/main` can be stale; `git fetch origin main` BEFORE branching.
Related: [[bane-forecast]] [[hud-rules]].
