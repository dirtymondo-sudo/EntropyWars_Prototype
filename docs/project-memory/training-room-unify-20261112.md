---
name: training-room-unify-20261112
description: Plan + mock-up to make the story Training Room (Room 64) and the battle Training Room one room; WAITING on mondo's OK (11-12)
metadata:
  type: project
  modified: 2026-11-12T18:46:22.101Z
---
mondo 11-12: "unifying the training room look in the battle map with the one in the story mode ... need to be the same for the cutscene and battling" + a seating area where a TV on a cart is rolled in for the orientation tapes. Thread (thread in the owner project). Related [[training-room-redesign-20261112]] [[quest-system-20261112]]. Cutscene plan (thread in the owner project) (its shots are planned on this layout).

- FACT: story = `DOOR_HQ.rooms.training` (Room 64, 20 m, fx 'training' old maroon voxel pit); battle = 8x8 cut of `DOOR_HQ.rooms.training_hall` (63 m test chamber). Two different rooms.
- PROPOSAL posted 11-12 with a decision card, NOT APPROVED YET, nothing merged: the story door opens into the test chamber itself (keep room id `training` so quests/doors/lessons keep working; one shared definition for walk + arena). Room 64's things move in: Range Console desk (west wall z 0), lesson plaque, three doors (main hall south x 0, service stair west, condemned crossing east), two agents + lines, coffee corner, lockers, cooler, wet floor sign. Orientation corner by the south door: 3 `school_desk` (face 0; the prop carries its own seat, sitter faces south) at x -7.35/-5.25/-3.15 z 26, `psx_tv_table_4` + `tube_tv` (y 0.97) + `vhs_player` at x -5.25 z 29.4. Pad sits behind the seats so the portal opens behind the player.
- NO PACK CART HAS WHEELS: asked him table-as-is vs one Meshy AV cart.
- Mock-up lives on branch claude/project-thread-2yvgoq (data.js, commits marked MOCK-UP ONLY). Sheets: /mnt/project-files/training-room-unify-20261112/.
- Harness lesson: walk-room shots via `_hqGoRoom(id)` + `ThreeRenderer.hq.dev.teleport`; cam pitch POSITIVE looks UP (use -0.3..-0.5 for third person overviews); load at 320x200 then resize to 1280x800: whole run 10 min instead of 35.
- Not checked: the corner in the battle camera's view, brightness on his Mac, the Catgirl "on break" NPC spot.

SHIPPED PR #1239 (token 20261112-oneroom-01-cors; data.js 9b7a9941, three-renderer.js b71f744e, ASSET_MANIFEST.json 7bc12778 live), supersedes "not approved" above. mondo picked "Yes, plus a Meshy cart with wheels" on the card.
- `rooms.training` = Object.assign of `rooms.training_hall` (+ roomNo 64, range counter, agents, npcSpots, lines; no `site`), built right after the DOOR_HQ table. CHANGE THE LOOK IN training_hall. Old pit kept unlinked as `rooms.training_pit`. Editor world-doc edits of one room do not reach the other.
- Cart = `decor_av_cart` (Meshy, Assets/world/props/meshy_decor/av_cart.glb, h 1.1; shelves at 0.135 / 0.67 / 1.1 m). Made straight from one concept without a separate concept approval (the card was the approval); he has not judged the model yet.
- FOUND + FIXED: THE GRASS FIELD grew a lawn on the test chamber pad in battle (pad squares keep the grass tile type). New `shell.grassField: false` (three-renderer.js _ggBuild). Holo Sim not checked for the same.
- Proof sheet 3_built_one_room.jpg in the folder. Not checked: quest flow end to end on the new room (tapes > portal > fight > return), WebGPU, online guest, his Mac brightness.
- Harness: server dies between turns if started with nohup inside a command; start `node server.js` as its own background task.
