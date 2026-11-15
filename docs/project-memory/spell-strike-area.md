---
name: spell-strike-area
description: Spell aim previews paint the true hit area: wide-beam lanes + battle.js spellStrikeTiles (PR #282, 2026-10-18)
metadata:
  type: project
  modified: 2026-10-18T02:52:18.391Z
---
PR #282 merged 2026-10-18, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0252.zip (battle.js, hud.js, ui.js).
mondo: "tsunami only shows a single line for its damage even though it does damage to more tiles than that, please fix it and any other spells like it".
- Cause: battle.js lineBeamPlan returned only spine `cells`; _applyLineDamage also sweeps side lanes. Now lineBeamPlan also returns `laneCells` + `tiles`; every preview paints `tiles` (Tsunami/Empty the Clip 3 wide, Plasma Cannon 2).
- battle.js spellStrikeTiles(unit, spell, tx, ty): barrage combatDist reach (radius 1 = 3×3), hurting dash path / Giant Stride sweep, leapStrike/skySlam shockwave, Void Rush arrival blast. Feeds ui.js footprint, cast glow, forecastSpellPlan.tiles. Self-centred aoePull/zones use their square.
- **How to apply:** a new multi-tile hit rule in doSpell must add its tiles to spellStrikeTiles (or lineBeamPlan). Hits were not changed.
- Browser-checked in Spell Lab (live showed 1 row while a side-row dummy took 294; fix shows 3). Not yet seen by mondo.
Related: [[quick-cast-aim]], [[bane-forecast]].
