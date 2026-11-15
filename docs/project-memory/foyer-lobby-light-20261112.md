---
name: foyer-lobby-light-20261112
description: Foyer too bright / lobby dark by comparison (mondo 11-12) fixed PR #1217; foyer wears the hall's light rig, shell.lampK scales a room's own lamps
metadata:
  type: project
---
mondo 11-12: "the foyer is too bright and then stepping into the lobby is dark by comparison". Thread (thread in the owner project).

- Cause: hemisphere/key/fill are scene-wide. In the foyer the hall through the doorway wore the foyer's box rig (hemi 0.44 vs hall 0.78) and looked dark; foyer white plaster blown by pendants + Key Light (hall gets no Key Light).
- Fix PR #1217: three-renderer.js `_hqJoinedHall` (a box in HQ_STAGE_RULES.round wears the hall rig; off = HQ_LIGHT_RULES.joinRig false), `shell.lampK` (room's own lamps share, any room), foyer `lampK 0.5, keyLamp 0.3`. Token 20261112-foyerlight-02-cors. Proof /mnt/project-files/foyer-lobby-light/.
- If he says the foyer is now too dim or too yellow: raise foyer lampK / keyLamp in data.js, do not undo the shared rig. Not yet checked on his Mac (WebGPU renders brighter there).
- Harness that worked: copy of playtest_city.js with `require('playwright')`, executablePath /opt/pw-browsers/chromium, `--post --w=640 --h=400 --wait=90000`; foyer loads in ~2.5 min, teleport views `{x,z,face}` / `{deg,r,face}`. Related [[headless-hq-proof-gotchas-20261108]] [[lost-light-rig-20261111]].

FOLLOW-UP same day: mondo "pretty much all the other rooms inside door hq have the same issue, like the cafeteria, my office". Cause = the camera Key Light at full strength in already-lit rooms. PR #1242: `_hqKeyLitK` + `HQ_LIGHT_RULES.keyLampLit {from .45, to .75, min .3, wall .8}`: HQ box rooms without `shell.keyLamp` take 1..0.3 of the Key Light by mood light x mean luminance of wallColor + floorColor. Dark rooms, site rooms, fights unchanged. Live off switch `window.EW_HQ_NO_LIT_KEY` (used for before shots in one session). Token 20261112-litrooms-01-cors. Proof /mnt/project-files/foyer-lobby-light/rooms/. Garden is another thread's. If a room still reads wrong: give it its own shell.keyLamp (or lampK), do not change the rule's numbers for one room.
