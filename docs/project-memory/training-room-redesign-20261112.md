---
name: training-room-redesign-20261112
description: 11-12 seats removed from Camelot + Training Room (PR #1158) and Training Room rebuilt as a psychic test chamber (PR #1160), both shipped
metadata:
  type: project
---
mondo 2026-11-12: "get rid of the seats on the camelot map and the training room ... make the training room look more like the old one, or just a newer design that is retro scifi secret psychic testing sleek and futuristic". Thread (thread in the owner project).

- SHIPPED PR #1158 (token 20261112-noseats-01-cors, data.js 4c62641a live): Camelot's two stands beside the tilt removed (boards rebaked 12/11/10/9, same windows); Training Room bleachers + their walk, end walls, rail, yellow foot line removed. Nothing else touched.
- REDESIGN SHIPPED PR #1160 (token 20261112-testchamber-01-cors): he picked the mock-up on the card 11-12. Not yet seen by him in game; lessons not replayed on it. Mock-up = `training_hall` room as a white test pad (cyan seams, A-H / 1-8 labels and the old "ORTHOGONAL GEOMETRY EXPOSURE AREA" sign as floor paint, four emitter pylons with floating_orb, iso_tank row + eeg_rack west, dream_screen wall + retro_console + egg_chair north, operators' deck east, aluminium walls). Shots + the data.js diff: /mnt/project-files/training-room-20261112/ (mockup_test_chamber.diff applies on PR #1158's main).
- GOTCHA: the board's battle terrain type comes from the room `board` feature keys. `urban:*` keys read as today's type (tile panel "GRASSLAND"); a named key like `aluminium` changes the tile type (a rule change). Keep `urban:` keys on the pad. The 8x8 pick needs no rebake when only looks change.
- The old voxel look still lives in three-renderer.js `_hqBuildTrainingPit` (Room 64 walk room, fx 'training') and `_hzTrainingRoom`; both are hard-sized for a 20 m room, not the 63 m hall.
- Shot harness: copy of battle-map-polish/first-third/tools/pm.js with poses centred on 3.5,3.5 for the 8x8, `?ew_gpu=webgl2`, ~5.5 min a run; headless look is green-tinted and dim away from the pad.
- FOLLOW-UP PR #1161 (token 20261112-testchamber-02-cors): mondo on his Mac (Firefox, WebGPU): "The white is too bright, needs to be turned down". Pad tints 0xffffff / 0x7f9ab0 -> 0x8e9aa4 / 0x4e6070. Lesson: headless WebGL2 shots under-read brightness vs his Mac; keep pale floors at about 55% tint in lit rooms ([[white-glare-20261103]]).
- SECOND FOLLOW-UP PR #1163 (token 20261112-testchamber-03-cors): "still way too bright". Real cause = the gym's `mood.ambient: 2.0` on pale tile. Now ambient 1.0, pad tints 0x66707a / 0x36424e. Awaiting his check. If still bright: next levers are the 8 shell lamps, the four floating_orb lights (1.3 each), the camera Key Light.

WATER GLARE (PR #1167, 11-12): mondo "water still showing up as way too bright in the training room". Cause of all three brightness complaints = the camera's KEY LIGHT (point light over the camera's focus in enclosed rooms), not the water sheet and not the room lamps. Fix: new `shell.keyLamp` room share (three-renderer.js _hqKeyRoomK); training_hall = 0. Holo Sim water stayed dark in the same test. Not checked: his WebGPU Mac, other enclosed rooms. If another closed room flares white, give it a `keyLamp` share.
