---
name: turn-frame-camera-20261107
description: Turn-start camera low-in-the-grass fix (PR #1035, THE TURN FRAME) — hand zoom capped at turn start, deferred pans reframe, room ground off-board
metadata:
  type: project
  modified: 2026-11-07T13:27:17.098Z
---

mondo 11-07 (Mount Shasta Arena, Antihero turn): turn-start camera framed low in the grass, unit at top of screen.

Cause: every turn start honoured an engaged hand zoom (wheel goes to 10x) -> lens 1-1.6 squares from the unit, under 1 square over the grass. A turn that started during a hand orbit/pan deferred its pan and kept the hand angle + zoom.

Fix PR #1035 (merged + uploaded, token 20261107-turnframe-02-cors): battle.js getTurnFrameZoomCap/capTurnFrameZoom/turnFrameTooClose (lens >= TURN_FRAME_MIN_DIST 3 squares, whole body in frame; capped zoom written back to state.userZoomScale) on all turn-start paths (own, CPU, remote, SIMUL, online guest follow, replay); window._ewTurnStartCamera used by the state.js deferred-pan releases; three-renderer roomGroundAt so the lens floor past the board edge reads the drawn room ground. Notes: docs/notes/champions-combat.md "THE TURN FRAME". Proof: /mnt/project-files/turn-start-camera/.

Pre-attack zoom jitter was NOT part of this (another thread owns it).

**How to apply:** if he says the turn camera is still too close/far, tune TURN_FRAME_MIN_DIST; never drop the cap on turn start.
