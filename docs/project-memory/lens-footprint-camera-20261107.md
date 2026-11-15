---
name: lens-footprint-camera-20261107
description: PR #986 (11-07) camera never sinks into a pit rim / under the board: eye floor = highest ground under the lens footprint; kill switch EW_NO_LENS_FLOOR
metadata:
  type: project
  modified: 2026-11-07T05:48:21.429Z
---
Follow-up bug from [[trap-beat-camera-20261107]]: a turn-ending cast parked the close-up on a victim in a 2-level pit and the lens sank under the board (white frame). PR #986 merged, three-camera.js live ac49c0f5, token 20261107-pitlens-01-cors.
- Repro (browser, real R2 assets): Deathtrap laid under an enemy on the stadium EDGE row; eye hung 0.55 squares under the rim, beside it, 1.2-3.0 s. Mid-board Deathtrap never dipped.
- Cause: every eye floor read only the one square under the eye centre (pit floor), and off-board lookups stretch the edge (pit) square.
- Fix: three-camera.js `_eyeFloorWorld` (ring 0.4 sq on board, 1 sq off board) in sight line / clear board / frame guard / clear angle + a last guard on the drawn lens (0.2 sq, battle only, not FP / Strike Mode). Probe `ThreeCamera.lensFloorHits()`.
- NOT a camera bug: the big white panels over a sprung Deathtrap are its own door VFX (`_sigDoorPortal3D` big doors).
- Harness lesson: Playwright clock fakes rAF, so never await rAF while paused; route network with async curl (spawnSync blocks Playwright). Proof /mnt/project-files/pit-camera/. Notes docs/notes/spells-vfx.md "THE LENS FOOTPRINT".
