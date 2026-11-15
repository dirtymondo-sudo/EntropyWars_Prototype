---
name: quick-menu-aoe-placement
description: mondo rule (2026-10-19, PR #344): placeable AoE spells picked from an enemy/ally quick menu arm for placement, never fire on the pick
metadata:
  type: feedback
  modified: 2026-10-23T09:15:00.000Z
---
mondo 2026-10-19: "when i choose a placeable aoe spell from a unit's quick target menu, it needs to let me place it first, not just fire automatically".

**Why:** quick-menu rows cast at once on the auto-picked off-centre aim (findBestAoeAimForTarget).

**How to apply:** PR #344 (token 20261019-aoeplace-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261019-2350.zip). hud.js `_fireEnemyAction` (enemy + ally menus) → `_hrlgPlaceableAoe` → `_hrlgArmAoePlacement` = setTool('spell') + pendingTarget at the row's aim; hover moves it, click/CONFIRM casts. MOVE rows walk, then arm. Self-casts keep the CONFIRM row ([[self-cast-confirm]]). Any new quick-cast path for area spells must arm, not fire. Browser probe tip: CDN jsdelivr is blocked by the egress policy; serve its /npm/ URLs from an `npm install` of the same versions; the quick-menu drum scrolls on hover, so re-read the row's box before clicking. Related: [[quick-cast-aim]], [[spell-aim-rule]].

RIGHT-DRAG RULE (mondo 2026-10-20, PR #355, zip r2-sync/ENTROPY_WARS_SYNC_20261020-0347.zip): a right press that drags or holds only orbits, never BACK; only a plain right-click (≤3 px, <450 ms) backs out. The action menu (.hrlg-rig) took BACK on contextmenu (fires on PRESS on Mac/Linux); now hud.js `_hrlgRightPress` decides on release and state.js `_orbitDown` orbits from the menu too. Headless swiftshader stretches real clicks past 450 ms: test clicks with synthetic events in one task.

NO TARGET LIST (mondo 2026-10-20, PR #357, zip r2-sync/ENTROPY_WARS_SYNC_20261020-0900.zip, token 20261020-aoenolist-01-cors): a quick-menu AoE placement shows only the aim panel (CONFIRM + CANCEL), never the portrait target list. hud.js `_hrlgArmAoePlacement` sets `state._quickAoePlace`; the spells aim view skips `_listUnits` while it matches; setTool clears it; per-viewer in online.js. Abilities picks keep the list.

CONFIRM FIRST (mondo 2026-10-23, PR #450, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0914.zip): the pick goes STRAIGHT to CONFIRM aimed at that unit (hover can't move it, `state._quickAoeStage='confirm'`); right-click → free placement ('place'); right-click again → back to that unit's quick menu (`_quickAoeFrom`, ui.js quickAoeBackToMenu). CANCEL row = straight back to the quick menu (thread's call). Camera stays tactical (no menu two-shot) for picks in this arm. Browser harness: /tmp/ew-harness pattern from balance/weak-races-harness (auto-mode refuses running the shared setup.sh; redo its steps inline). ThreeRenderer.clickAtScreen + pickAtScreen hit units more reliably than raw mouse clicks.
