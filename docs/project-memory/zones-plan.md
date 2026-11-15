---
name: zones-plan
description: ZONES_PLAN.md (2026-09-29): mondo dropped the open world; DOOR HQ is the hub, separate zones behind its doors; what to cut (THE LAND) and keep (the stage inside HQ), phases Z0-Z5 + editor E7-E9, forks
metadata:
  type: project
  modified: 2026-09-29T22:14:53.727Z
---
mondo (2026-09-29): "ditch the open world entirely and go back to how it was before": DOOR HQ the hub node, separate
explorable zones, discovered as more connected than they look through doors and secret pathways; no loading screens
inside DOOR HQ except between floors; buildings/areas as mystery-dungeon rooms and hallways ("2 areas of interest joined by
3 lanes with their own smaller connections"); an exit to another zone must never be visible from another exit.
Only two exits open at the start: the garage taxi to Disaster City and the fire stair to the Woods.

Plan: ZONES_PLAN.md at the repo root (PR #8, merged 2026-09-29) + copy in /mnt/project-files/zones/.
Z0 THE CUT built + merged 2026-09-29 (PR #9, token 20260929-zones-01-cors; R2 data.js, three-renderer.js, map.js, editor.js). Log in §12. Next: Z1.
Z1 built + merged 2026-09-29 (PR #10, token 20260929-zones-02-cors; R2 data.js, map.js, three-renderer.js). Taxi = way `taxi` + link `garage_taxi` (garage lower ring ⇄ Downtown east kerb x 102.9 z 24). HQ_EXIT_RULES.open = garage_taxi, woods_stair; hqApplyShutExits hides other facility-room link doors until the far room is seen; draughts on garage_motorpool, woods_sewer, woods_ritual, garage/stairwell tunnel hatches. Vehicle-kit way builders need `_hzKitTs = 1.75*U` (the train lacks it, so it is under-scaled). Zip: zones/ENTROPY_WARS_ZONES_2.zip (written after mondo said "write the zip"). Next: Z2.
Z2 built + merged 2026-09-30 (PR #11, token 20260930-zones-03-cors; R2 data.js, three-renderer.js). New staged zones works/annex/labs/executive/recwing/execwing; frames solved door-to-door by a script (b's rot from door walls, 0.2 m gap, skip overlaps), hqWorldValidate clean via vm.runInContext. Rotunda can't be a part (round, degree doors). Train way now sets _hzKitTs; subway kit m 9.84/10.33 at 3.7 m tall.
Z3 built + merged 2026-09-30 (PR #15, token 20260930-zones-04-cors; R2 data.js, map.js). data.js hqRoomPlan/hqRoomPlanModel/hqRoomSpaceSee (ledger door.hq.spaces, local only); map.js _hqAreaPlans + _hqPlanTick; space node ids '<room>~<space>'. Secret links are kind 'secret' in hqMapGraph (19 draughts). _hqMapCharted gates every map GO. Zip write to /mnt/project-files was blocked again. Next: E7.
E7 built + merged 2026-09-30 (PR #16, main 5adf40e, token 20260930-zones-05-cors; R2 editor.js, data.js). His zones = world.json zones[w_zN] {label, rooms, anchor, hub?, slot?}; hqWorldDocApply makes a DOOR_HQ.hubs node (or joins hub). Checks: hqPlanSightCheck / hqPlanFightPatches (data.js). Next: Z4 THE WOODS (mondo builds in editor).
E8 arenas (mondo 2026-09-30): PvP battle maps are FIXED 8x8 and have nothing to do with the exploration battles; an arena = an 8x8 marker in one of his editor rooms that becomes a PvP map in match select (the plan's N×M 8-36 is wrong). E8 does not wait on the Exploration battles plan. KEEP the old voxel editor (mondo 2026-09-30: 'dont delete the voxel editor yet') until arenas replace the voxel Δ maps. E8 ARENAS DONE + MERGED 2026-09-30 (PR #19, main 7b33a4a, token 20260930-arenas-01-cors, R2 zip arenas/ENTROPY_WARS_ARENAS.zip = data.js, three-renderer.js, map.js, match-select.js, battle.js, state.js, online.js): no hand markers; bake-arenas.js (repo tool) auto-picks the 8x8 per main site into HQ_ARENA_RULES.picks, 33/38 sites; Heaven, Hell, Backrooms, Revenge, Bermuda keep their Δ. LOOKING-GLASS KEEPS ITS Δ (mondo; HQ_ARENA_RULES.keep) and its garden got a real 8x8 chessboard (terrain feature `board`), PR #20, token 20260930-arenas-02-cors; same zip rebuilt. Ids stay <site>_delta. Rerun bake-arenas.js after a site room changes. Voxel editor still kept.

Recommendations (defaults until mondo rules; forks in §10):
- Map = the existing NODE map (WORLD / THIS AREA sheets in map.js). No physical map; the LAND + ATLAS tabs go.
- DOOR HQ is not on any map; Antarctica, revealed late through the foyer's sealed front door (canon: the first Black Cube).
- Battle grid stays fixed 8x8 at 1.75 m: every room of interest needs one clear 14 m patch; lanes 3-4 tiles wide.
- CUT: THE LAND whole (HQ_LAND, hqLand*, _hqLand*, water/flora/roads/discovery, room `land`, land edits in site rooms,
  HQ_LAND_EDIT_RULES + editor THE LAND mode, bake-land.js, land.json), far shells, hqWorldSheet, HQ_WORLD.zones.land.
- KEEP: THE STAGE but only inside HQ (each floor becomes a staged zone like medwing today), portals, memory budget,
  asset store, LOD, near-first, batch, door warm, the clock, the node map, the hub graph, all data.js site rooms as the library,
  editor E0-E3/E5/E6. Split HQ_STAGE_RULES engine rows into HQ_ENGINE_RULES.
- Zone graph §3 from mondo's list; entries he did not give are defaults: Desert via Disaster City Route 1, Beach via the City,
  Vatican via Hell's crypt, Space via Hangar 51 -> Spaceship. Bays stay as mission doors, all shut at start.
- Editor plan renumbered: E4 land removed; NEW E7 THE ZONE TOOLS (door flags UI secret/one-way/locked, SITE field on rooms,
  ZONES grouping, LEADS TO overview tab, sight check audit); E8 = arenas + delete old editor; E9 = the swap one zone at a time.
- Order: Z0 THE CUT, Z1 THE TWO EXITS (taxi way), Z2 THE FLOORS (HQ floors staged), Z3 THE MAP, E7, Z4 THE WOODS (mondo builds
  §4's six rooms in the editor), E8, then a zone per delivery.

**Why:** build from the plan, don't re-derive it.
**How to apply:** read ZONES_PLAN.md §5 (keep/cut with anchors) and §9 (order) before any world, map, HQ or editor work;
append each phase to §12. Git restore points for the pre-land site rooms: 1ed44e1, 7beb9d9, 6d1dac8.
