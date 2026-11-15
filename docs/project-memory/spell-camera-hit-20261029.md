---
name: spell-camera-hit-20261029
description: PR #660 (10-29) spell camera clear angle, victim head room, floating-text safe frame, Mummify linen rebuild
metadata:
  type: project
---
PR #660 merged 2026-10-29 for the 10-28 VS CPU playtest shots 7/8/9/10 + bug 2. Camera + looks only, no rules.
- CLEAR ANGLE: three-camera.js `_clearAngle` swings spell-shot yaw (0..180 candidates) to the angle where no nearer body/wall covers caster/victims. Subjects/bodies come from battle.js `_cineArmFrameGuard` G.api. Kill switch `window.EW_NO_CLEAR_ANGLE`. Probe `ThreeCamera.clearAngleState()`.
- Big Kick "wrong enemy" = Bigfoot's own back hid the kicked unit (HUD pick was correct). Push worked in repro; playtest "never pushed" not reproduced.
- HEAD ROOM: per-point frame-guard windows `{t,b,h}` keep the primary victim lower/centred.
- SAFE FRAME: `window._ewFloatSafeRect` + three-renderer `_floatStep` keep pops under letterbox + score plate. Shot 10 was BOTH text and framing.
- MUMMIFY (shot 9): not loading; was 42 flat strips. Now one helix bandage in creator canvas fabric (`getFabricTextureUrl('canvas')`); sarcophagus re-aims behind victim from the CURRENT camera each frame (VFX placed from cast-beat eye get looked at from behind in the hit beat — general gotcha).
- Fog: host/guest angle can differ slightly (hidden units excluded), no leak.
- Before/after: /mnt/project-files/spell-camera-hit/. Notes docs/notes/spells-vfx.md "SEE THE TARGET GET HIT".
