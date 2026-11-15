---
name: steady-board-camera-20261108
description: Stasis Beam "camera lifted up and back down" (11-08): PR #1054 board side (EW_NO_STEADY_BOARD) + PR #1055 spell-shot side THE STEADY CRANE (EW_NO_STEADY_CRANE); mondo's Action Cam is ON
metadata:
  type: project
  modified: 2026-11-08T12:49:38.125Z
---
mondo 11-08: enemy CPU Stasis Beam, "camera lifted upwards and back down after the attack landed". Thread (thread in the owner project).
- HIS ACTION CAM IS ON ("but my action cam is on"), even though the shipped setup key ew_cinematicActionCam is "0". Don't assume Action Cam off from SHIPPED-KEYS; spell camera bugs from him are the cine (spell shot) path.
- PR #1054 (board/tactical rig, token 20261108-steadycam-01-cors): THE CLEAR BOARD body crane decided per move, held at rest. Kill switch EW_NO_STEADY_BOARD, probe ThreeCamera.steadyBoardState().
- PR #1055 (spell shots, token 20261108-steadycrane-01-cors, three-camera.js b29da758 live): causes were per-frame ground lifts on the gliding pose (sight lines + 0.4-square footprint ring + frame guard post-slide ring) bobbing the lens ~2 squares, and THE CLEAR ANGLE snapping back at shot end (~1 square swing). Fix THE STEADY CRANE: crane decided at the beat's target pose, rides the move's eased progress, cut lands on it, rest change holds 700 ms; per-frame hard floor ring 0.15 sq; finished shot keeps clear angle (_caHold) and fades with guard carry, cut home drops it. Kill switch EW_NO_STEADY_CRANE, probe ThreeCamera.steadyCraneState().
- Proof /mnt/project-files/stasis-beam-camera/ (stasis_action_cam_before_after.jpg). Notes docs/notes/spells-vfx.md "THE STEADY BOARD" + "THE STEADY CRANE".
- Harness: wrap GAME.doSpell/doMove (ai.js calls via window.GAME), teleport u.x/u.y + ThreeRenderer.invalidateUnits(); temp `window.__ewCam = camera` probe line (never commit). A performance.now freeze hack cancels the shot: record per frame instead. Related [[camera-rules]] [[camera-one-move-20261107]]
