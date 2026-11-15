---
name: white-glare-20261103
description: White maps glared with bloom off (lit white sheets clip before Filmic); shipped PR #847 - near-white sheets darkened at load + 0.75 daylight where the ground is white, fixed per map
metadata:
  type: project
  modified: 2026-11-03T09:58:18.290Z
---
11-03 mondo: the Heaven Arena clouds are "really hard on the eyes", and any white map looks super bright with bloom off.

Cause (measured):
- The scene draws into an 8-bit target with no tone map. three-post.js `_hdrSupported` checks `!THREE.NoToneMapping`, which is 0, so the HDR chain never runs.
- Daylight puts about 1.35x on a floor in an open room and about 1.5x on the battle day rig.
- Sheets around 90% white (cloud_2, marble_light) go past 100% and clip to flat white before Filmic, Brightness or bloom act.

What he wanted:
- He picked B, tone down the white textures.
- He also asked "can we just make light not 130% too?".
- He refused screen-based auto lighting: "i dont want the game to change lighting based on the white on the screen".

SHIPPED PR #847, zip r2-sync/ENTROPY_WARS_SYNC_20261103-0958.zip, token 20261103-whitesheets-02-cors:
- sprites.js TERRAIN_WHITE_SHEETS: 10 sheets with mean brightness >= 0.8 are darkened once at load (three-renderer.js _ewWhiteGuard in textureLoader.load) to a mean of about 0.66. Keyed by file name.
- HQ_LIGHT_RULES.whiteDay 0.75 for rooms: an open room whose floor is a white sheet gets 0.75 sky light (_hqOpenLR). It hits 9 rooms (Heaven gate/stair, Camelot sky, Olympus summit, Vatican observatory, Agartha, Antarctica, North Pole, pool).
- whiteDay for tile boards: a board whose top tiles are half or more white sheets runs ThreePost.setWhiteDay(0.75).
- Both are fixed per map; nothing reads the screen. A normal map (Fairy Forest) is unchanged.
- Not covered: GLB model textures (white statues, cloud prop models).

FOLLOW-UP PR #856 (mondo: "check other marble heavy maps"), zip r2-sync/ENTROPY_WARS_SYNC_20261103-1121.zip, token 20261103-whitemaps-04-cors:
- whiteDay is now day only, because Agartha (a night room) had gone too dark.
- Stair flanks in the room's cliff sheet now wear floorColor (fixes the Atlantis dais clipping).
- Closed white-floored rooms (_hqWhiteIn) also get 0.75 on hemi, key and the camera Key Light, which was blowing a white pool under the camera in the Vatican basilica. This also hits the DOOR HQ tiled rooms.
- Olympus, Antarctica and North Pole looked fine. Looking-Glass was not checked (the probe stuck at the party screen).

Proof: /mnt/project-files/white-glare/. Notes: rendering-loading-perf.md "THE WHITE SHEETS".

Probe gotcha: ThreePost.setRetroFilter(true) in a field fight turns on a grade the shipped state doesn't wear. Don't toggle it when comparing.

Related: [[visual-rules]] [[board-fog-20261101]]

FOLLOW-UP 11-05 PR #925 (token 20261105-teamroom-02-cors, uploaded live): the Select Your Team office room (three-renderer.js _trBuild, own light rig outside HQ_LIGHT_RULES) never got the fix. Now its 5 lights × whiteDay (0.75, `_trWhiteK`) and its drywall colour × TR_ROOM.wallTone 0.78 (that room only; drywall mean 0.69 is under the 0.8 sheet bar). Light alone still left the wall cream-white. Proof /mnt/project-files/white-glare/team_room_before_after.jpg. Headless WebGPU on swiftshader draws black here; use ?ew_gpu=webgl2 (same node renderer) for proof.
