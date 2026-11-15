---
name: occlusion-fade-rules
description: Battle occlusion fade rules (PR #200 + #227): on-grid objects solid outside spell shots, except pieces hanging OVER units/tiles; off-grid scenery fades; highlights ghost through
metadata:
  type: project
  modified: 2026-10-14T22:24:13.853Z
---
mondo (2026-10-14): map objects fading transparent is confusing. Fading happens only (1) during spell cinematic shots, and (2) for scenery OFF the battle grid, so it never covers the field. On-grid things stay solid; units behind them show their hologram. PR #200 merged (token 20261014-fadeoffgrid-01-cors). He said "ignore roofs for this", so the roof/canopy cutaway was left alone.

**Why:** he wants to see what is really on the map. The hologram is how hidden units show.

**How to apply:** don't bring back the selected-unit or hand-pan fade for on-grid roots. Code: three-renderer.js `_occRootOffGrid` and the `anyFade` flag in `_occComputeBlockers`. Notes: docs/notes/rendering-loading-perf.md "THE FADE RULES". At merge it had only been syntax-checked, not seen in game.

2026-10-16 PR #227 (token 20261016-overhead-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261016-0620.zip): mondo wanted things ABOVE units (bridges over gaps, big tree crowns) to fade. `_occOverheadHit`: on-grid root fades when a sight line to a seen unit / hovered / panned tile crosses it above the head AND it is straight over the subject or overhangs an open passable tile with >=0.6 tile clearance. Walls/trunks/buildings stay solid. Tile highlights got GreaterDepth ghost twins at 0.42 opacity (`_syncHlGhosts`). Switches EW_NO_OVERHEAD_FADE / EW_NO_HL_GHOST. Only syntax-checked.

2026-10-21 PR #401 (token 20261022-treefade-01-cors, zip ENTROPY_WARS_SYNC_20261021-2342.zip): mondo "make them fade more" re trees. THE TREE FADE (`_occTreeHit`/`_occIsTreeRoot`): any TREE (board `_ew_occTree`, room `_ew_hqTree`; chess statues `_ew_occNoTree` stay solid) crossed by a sight line to a seen unit / hovered / panned tile above the subject's shins fades, in front too, on every map. Seen units get a head ray. Browser-checked on Mount Shasta Arena. Same PR: EOR +MP pops 550 ms after +HP (mondo "yes"); Nexus edges he adjusts himself in UI Maker.
