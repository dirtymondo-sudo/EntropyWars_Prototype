---
name: battle-panel-plan-20261111
description: One battle panel (unit/tile info + action list merged) SHIPPED 11-11 PR #1131, default layout, Classic kept as UI Maker option; root ATTACK row has no hit chance
metadata:
  type: project
  modified: 2026-11-11T12:55:19.651Z
---

mondo asked 11-11: merge the unit info / tile info panel and the actions list into ONE cohesive panel, "AAA JRPG", all info + actions reachable.
Thread (thread in the owner project). Plan page https://claude.ai/artifact/SGAvR8qW2ywVjM9AKJkyYZ ; files + proof /mnt/project-files/battle-panel-20261111/ (proof/ = shots at 1728x904 and 1280x540).

He said "build it" 11-11 10:46 UTC; his three picks taken as recommended: right bay = own stats when nothing picked, AP icons docked in the panel, zoom cone off in the new layout.
SHIPPED PR #1131 (11-11): hud.js deck branch `div.hrlg-rig.ewd` (WHO / WHAT / ON WHAT / footer), compact layout for 1280x540, UI Maker Layout > Battle panel (One panel / Classic, dFocus, dAp, dCone), kill switch window.EW_CLASSIC_PANEL. battle.js _menuFreeArea + three-renderer _wmMenuRects know it. Notes: docs/notes/ui-menus-audio.md "THE ONE BATTLE PANEL".

Same PR, mondo 11-11: "I dont want the attack accuracy on the main/ top action list, only when i actually click the attack button" -> root ATTACK row has no hit %; target rows after ATTACK and a foe's own quick menu keep the odds.

PR #1133 (11-11, his "whole thing bounces" on tab hover + "compatible with the ui maker? all black"): DeckFoot footer has ONE height (--ewd-say-max 56 full / 48 compact; text steps down to fit) because a hovered tab/row put a longer description in the footer and lifted the bottom-anchored panel off the mouse. UI Maker Battle panel colours dLook: Night blue / All black / My colours -> --ewdu-* vars (deckLook).
Open: not checked on WebGPU or gamepad; enemy/combo/aiming shots only at 1x from the first match; awaiting his look.
**Why:** his approved design; Classic kept because the brief said keep today's layout as an option.
**How to apply:** HUD changes to the action list / unit card / tile card must work in BOTH layouts (deck reuses the same blades/TileCard/quick card; deck CSS lives in hud.js `_ewdCss`). Related: [[hud-rules]] [[ui-maker]].
