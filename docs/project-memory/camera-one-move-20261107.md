---
name: camera-one-move-20261107
description: PR #1034 (11-07) camera zoom jitter before attacks: walk-then-act holds the two-shot, glide retarget, refits only widen; per-frame camera recorder recipe
metadata:
  type: project
  modified: 2026-11-07T13:20:04.458Z
---
mondo 11-07: "weird quick little zoom ins and zoom outs before an attack like the camera is fighting itself". PR #1034 merged, battle.js live b42855c5, token 20261107-onemove-02-cors.
- Causes (recorded per frame, real VS CPU match): (1) MOVE→ATK/JUMP→ATK/MOVE→CAST walk follow (focusOnTiles/animateBoardCameraPath) left the menu two-shot for the tactical view, then the strike swung back in; (2) pick frames re-solved 2-3x restarted the glide from rest; (3) HEAD ROOM / CLEAR FRAME refits ping-ponged zoom (potion 1.40→1.63→1.50).
- Fix: `_actWalkHold` (attack glides once to landing two-shot, cast holds `still`), `camera._glideRetarget` in moveTo, `_refitZoom` (REFIT_ZOOM_IN 1.2). Kill switches EW_NO_ONE_MOVE / EW_NO_GLIDE_RETARGET / EW_NO_REFIT_WIDEN_ONLY.
- Not re-recorded after the fix: JUMP→ATK (same code path). Not touched: turn-start framing (other thread), cine beat swings (face beat ~160° yaw swoop on items/spells) — possible follow-up if he still sees spins.
- Recorder recipe: temporarily add `window.__ewCam = camera;` after the camera object in battle.js (never commit), wrap moveTo/snap with stack logging, sample ThreeCamera.getCamera() per rAF. Harness: /mnt/project-files/playtest-harness. Its profile had ew_cinematicActionCam '0' — set '1' to test spell cine. Local origin/main ref can be stale: always `git fetch origin main` before branching.
- Proof /mnt/project-files/camera-one-move/camera_before_after.png. Notes docs/notes/champions-combat.md "THE ONE MOVE". Related [[menu-camera]] [[camera-rules]] [[impact-hold-camera-20261105]]
