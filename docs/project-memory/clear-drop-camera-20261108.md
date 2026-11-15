---
name: clear-drop-camera-20261108
description: PR #1059 (11-08) Infernal Hurl + every drop pick (sky throws, Teleport landing, tosses) camera too far out/right: THE CLEAR DROP; THE CLEAR BOARD crane was lifting the lens 1.5x
metadata:
  type: project
  modified: 2026-11-08T14:32:05.341Z
---
mondo 11-08 (Hell Arena, Fallen Angel Infernal Hurl landing pick): "camera zooms out way too much and is too far over to the left" + a hand-framed shot of what he wants (ring close, just right of ability list). Thread (thread in the owner project). PR #1059 merged, token 20261108-cleardrop-01-cors, battle.js 9cc66a71 + three-camera.js 82ab761c live.
- Causes: (1) THE CLICKABLE PICK fit the ring into the strip right of the widest panel (low CANCEL panel treated as full height); (2) THE CLEAR BOARD crane lifted the lens ~6 squares over the rock spires: real pose 12.7° / 1.55x the distance the fit solved. Any battle.js tile-pick fit can be wrong by this crane on tall-prop maps.
- Fix: battle.js `_clearDropFrame` (opts.clearDrop from `_dropPickCamCheck`): grid-search slide + dist for closest view, lit squares clear of real panel rects (`_clearDropCover`), toss ends `frameOnly`; `ThreeCamera.boardLiftAt()` (new) and re-solve at the steeper tilt the crane lands on. Slide rides camera._clearFit.slide. Kill switch EW_NO_CLEAR_DROP, probe window._clearDropState().
- Proof /mnt/project-files/throw-camera/. Teleport not driven on screen (same code path). Notes docs/notes/spells-vfx.md "THE CLEAR DROP".
- Harness tip: real camera pose = ThreeCamera.getCamera() getWorldDirection; compare to camera.tilt/zoom to spot crane lifts. Related [[camera-rules]] [[steady-board-camera-20261108]] [[camera-one-move-20261107]]
