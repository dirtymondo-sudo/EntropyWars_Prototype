---
name: guard-carry-camera-20261107
description: PR #1037 (11-07) potion/heal camera no longer dives to the healed unit's feet after the shot; three-camera.js carries the frame guard's correction; kill switch EW_NO_GUARD_CARRY
metadata:
  type: project
  modified: 2026-11-07T14:30:55.522Z
---
mondo 11-07: "Healing potion action camera zooms in towards the ground at the end on the unit being healed." PR #1037 merged, three-camera.js live c167621c, token 20261107-guardcarry-01-cors.
- Cause: the frame guard (battle.js `_cineArmFrameGuard`, three-camera `_frameGuardSolve`) dollied beat 2 of the heal two-shot back from 0.85 to 1.73 squares; it dies with the shot id, but the framing can outlive it. The CPU's potion (softResetToUnit auto branch, settle 600 ms later) dived to the feet; the glide home started from the bare boom.
- Fix: three-camera.js `_fgCarry` / `_fgCarryApply` (THE GUARD'S HAND-OFF): the correction is carried while the same cine rig stays on the same subject with the same target zoom/tilt/yaw, eased out over 0.6 s once it moves on, and dropped on snapImmediate. Probe `ThreeCamera.guardCarryState()`.
- Proof in a real VS CPU match with real R2 models, Playwright clock stepped 50 ms: /mnt/project-files/potion-camera/. The harness was in the session scratchpad (potioncam.js: async curl + disk cache for R2, local repo scripts). Own-turn returns that turn more than 60° were already cuts, so they were never affected.
- Notes: docs/notes/spells-vfx.md "THE GUARD'S HAND-OFF". Related: [[impact-hold-camera-20261105]] [[lens-footprint-camera-20261107]] [[camera-rules]]
- Follow-up PR #1038 (same day, Codex review): `_fgCarry.last` now stored by `_frameGuardSolve`, so a shot that glides straight home fades too. three-camera.js live 185d90c1, token 20261107-guardcarry-02-cors.
