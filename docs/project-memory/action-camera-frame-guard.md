---
name: action-camera-frame-guard
description: Spell action camera frame guard (PR #99, 2026-10-05) — how the cine camera keeps caster + hit units in frame; elevZ is ignored by the TPS rig
metadata:
  type: project
  modified: 2026-10-05T00:30:20.501Z
---

PR #99 was merged 2026-10-05 (token 20261005-actioncam-01-cors). It fixes mondo's "action cam misses the target" report: flyers, AoEs, elevation gaps, and AoEs hitting units other than the clicked one.

- Changed R2 files: battle.js, online.js, three-camera.js, three-renderer.js. The zip goes to action-camera/ENTROPY_WARS_ACTION_CAMERA.zip.
- The zip was written 2026-10-05 from main after PRs #100 and #101, so its three-renderer.js includes the spaceship deck and no-light-box changes. Live token: 20261005-spaceship-01-cors.

**Non-obvious facts for future camera work**
- Inside the TPS cine rig (camera._cineTps), the pivot height is ground under _tpsSubject + _tpsHeadLift.
- The elevZ that a beat passes is IGNORED in that rig. To change height, set _tpsHeadLift or pass liftPx to _cineTpsAnchor.
- three-camera.js _frameGuardSolve corrects any composed frame so every body listed in camera._frameGuard fits in the letterbox.
- battle.js _cineArmFrameGuard sets the camera phases. The hit list comes from three sources:
  - the cast-commit forecast (_cineNoteCast);
  - the shot's targets;
  - the floating numbers popped during the shot (_cineGuardNoteHit).
- Console probe: _ewFrameGuard().

Details: docs/notes/spells-vfx.md "THE FRAME GUARD". Related: [[combat-clarity]], [[webgpu-plan]].
