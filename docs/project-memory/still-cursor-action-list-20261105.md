---
name: still-cursor-action-list-20261105
description: Battle action list hover flicker fixed (PR #936, 2026-11-05): the desc-bar lift moved the list per hovered spell
metadata:
  type: project
  modified: 2026-11-05T10:40:46.550Z
---
mondo 11-05: hovering a spell in the battle Abilities list flickered and cycled the highlight through its neighbours with the mouse held still. This happened every game, for any unit.

The root cause was in hud.js `_listDescDodge` (it lifts the list above the spell description bar). The bar's height follows the hovered spell's description. The lift was measured in screen px but written as CSS px (the rig is scaled), so the margin pushed the whole panel up or down 20-40px for each hovered row.

PR #936 fixes it (token 20261105-hover-03-cors, hud.js 5ab92ccd live):
- The lift is in CSS px and only grows while a list is open.
- `_listRoom` uses the tallest row's height.
- A hover never runs scrollIntoView.
- `.hrlg-blade > .hrlg-body` has pointer-events none; `_hrlgRowTip` forwards chip tooltips to the row.

**How to apply:** any future menu code must not make row geometry depend on the selected or hovered row (hover IS selection there). A playwright probe that holds the mouse still and samples `.sel`/`:hover` caught it. Related: [[hud-rules]] [[ui-maker]]
