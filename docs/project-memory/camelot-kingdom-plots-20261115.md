---
name: camelot-kingdom-plots-20261115
description: Camelot Kingdom on plots: castle PR #1460 + 64-plot kingdom room PR #1465 shipped 11-15, never seen on screen; Keep floors / Undercroft / Sky Castle still old
metadata:
  type: project
  modified: 2026-11-15T16:36:07.699Z
---
Thread (thread in the owner project) "Build Camelot Kingdom on plots" (mondo 11-15 16:30: "another thread for the next most important zone"; Camelot picked because the Woods' west trail already ends there and it is the next stop on his zone graph). See [[world-areas-plan-20261115]].

History: plan 1 + plan 2 (8x8, castle middle, approved 16:53), castle redesign mock-up approved "for a start" (camelot_castle_redesign.png), castle PR #1460.

Shipped earlier: PR #1460 castle, #1465 kingdom room (plan 2), #1467/#1468 old Camelot deleted + DOOR_HQ.retired redirect.

NEW THREAD 11-15 18:29 (thread in the owner project) "Rework Camelot layout, exteriors and interiors" (replaces the old one). mondo: "the village is supposed to be inside the castle walls too. so castle in the middle. village. walls surrounding all that. moat surrounding all that. then woods surrounding all that." Roof gaps FIXED PR #1476 (roofs had no underside; bake-camelot.js sheet().roof adds one). PLAN 3 posted, WAITS HIS OK, nothing built: /mnt/project-files/camelot-kingdom/plan3/ (camelot_plot_plan_3.png, camelot-layout-3.json, draw-plan3.py): same room id, 8x8; castle (no own moat) centre, village loop + market, town wall 4 gates, moat, woods ring (N snowy pines + sleigh road, E Fairy Forest, W Looking-Glass Garden, S forest + HQ road). North Pole district leaves the room (old village room stays behind the sleigh road; Mountains zone = layout thread). After OK: rebuild via bake-camelot.js, then Keep floors / Undercroft / Sky Castle.

11-15 18:39 mondo "okay that looks better" = plan 3 OK. BUILT + SHIPPED PR #1480 (same room id, flat, town wall 7 m, 45 houses, 4 gates, moat, woods ring; North Pole district out, village room untouched). Fixed NaN tower decks (old room's slope + hqCastleTower arc decks). Not seen on screen. Top-down check: camelot-kingdom/plan3/kingdom_plan3_built_rows_topdown.png. NEXT: Keep upper floors, Undercroft, Sky Castle; richer village exteriors.

11-15 19:34 mondo on the built plan 3 (outlined the inner castle): "this whole section i outlined needs to be the castle, like an epic fantasy dragon quest or final fantasy or medieval castle. Disney world cinderella's palace. Hogwarts ... the way it is now is stupid because it like a walled off region inside a walled off region. the castle should be in the center of the map and relatively symmetrical. higher elevation compared to the village". REDESIGN 2 mock-up posted, WAITS HIS OK: /mnt/project-files/camelot-kingdom/castle2/camelot_castle_redesign_2.png (draw-castle2.py): no inner curtain; ONE palace (keep + throne hall, 2 mirrored wings, 8 cone towers, great spire) on a two-step hill (+3.5, +7 m; `plateau` features exist) centred at room centre; Grand Stair from the Market. Engine notes: sloped rooms make hqCastleTower arc decks NaN.
