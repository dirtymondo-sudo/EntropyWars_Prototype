---
name: open-doors-disaster-city-20261123
description: Disaster City's painted doors opened by one rule in the city bake (docs/interiors/open-doors.js), 11-23: counts, what is left, how to rerun
metadata:
  type: project
  modified: 2026-11-23T20:05:18.250Z
---
Thread (owner-project id) "Open every door in Disaster City" = step 2 of [[building-interiors-plan-20261123]] in the city.

- A RULE, no district file edited: `docs/interiors/open-doors.js`, run by bake-disaster-city.js THE OPEN DOORS (+ again at THE LAST STAGE). Painted ground door -> its row turns so that side is the front, goes hollow with the doorway at the door, gets a kit by its plan name; other painted doors = `gaps` + `inner` leaves; door picture + frame dropped. Plateaus -> 2-storey texbuildings. Tall rows get `inH` 6.68. Roof-hut doors + doors onto another level (`WINDOWS_AT`, from find-doors WALKIN-X) -> `urban:GlassWindowTall1a-Glow`.
- Engine: gaps now cut in inside walls + arch parts (three-renderer.js `_hqTexInside`, `_hqArchDoorGrid`); kits keep gap squares clear; find-doors checks heights.
- Count: walk-ins 117 -> 271, closed 244 -> 39, unreachable 0, soft-locks 0 traps.
- PASS 2 = PR #2503 (merged, live, token 20261123-citydoors-03-cors): Civic Center opened too (mondo: main account does it), catalogue buildings (diner, burgerpiz, laundry, vhs, quequis, house) = `_open` + `_inside` GLBs + HQ_WALK_IN_PROPS, pack_bld_08/09 doors CUT in Blender (bake-pack-pieces.py `holes`, HQ_PACK_BUILDINGS `open`, `hqTexbPackShut`, bake PACK_CUT lined room on the model's real walls), 6 sprite prisms -> textured walk-ins, orphan doors -> windows. find-doors: 335 walk-ins, 1 closed (Hotel lobby, its own thread). Soft-locks: Hills trap+crevice pre-existing on main.
- Cloud browser crashed in the city on branch AND main (11-23 evening), so no in-game proof; Blender renders only. mondo has not yet seen it in game.
