---
name: strike-arrows
description: Spell previews draw one red arrow caster→each body hit + ricochet hop arrow (ui.js drawForecastStrikes, PR #325, 2026-10-18)
metadata:
  type: project
  modified: 2026-10-18T16:09:53.306Z
---
PR #325 merged 2026-10-18 (token 20261018-strikes-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1609.zip).
mondo: "an arrow should show for a ricochet, like from the target to the nearby enemy. and for an aoe or multi target spell i wanna see multiple damage arrows from the caster to the enemies that change with where i am hovering".
- battle.js forecastSpellPlan `hit()` sets `h.direct` (untagged or tag in `_FC_DIRECT_TAGS` random/return/shockwave/delayed). Hops (bounce/chain/fork/split/splash) and knock-ons (collision/pinned/bomb/fling/afterShot) are not direct.
- ui.js `drawForecastStrikes(plan, caster, fromX, fromY, fromPx)` draws the arrows; the ricochet hop stays `drawForecastChain`. Used in board aim, hud.js quick menu (single aim arrow only when no victims), board move-then-cast (`_drawSpellApproachShove`, overlay spellApproachChain), and spell target list row hover (`window._ewSpellAimHover`).
- **How to apply:** a new tag in forecastSpellPlan that the caster lands directly must join `_FC_DIRECT_TAGS`.
- Browser probe: the sandbox renders the board washed white, so arrows were confirmed by draw calls + visible meshes in the scene, not by eye. Not yet seen by mondo.
Related: [[quick-cast-aim]], [[spell-strike-area]].
