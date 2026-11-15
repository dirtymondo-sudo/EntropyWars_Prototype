---
name: jump-camera-follow
description: PR #206 (2026-10-14) battle camera now pans with the local player's own jumps; walks still don't pan
metadata:
  type: project
  modified: 2026-10-14T22:45:27.982Z
---
PR #206 merged 2026-10-14 (token 20261014-jumpcam-02-cors), zip r2-sync/ENTROPY_WARS_SYNC_20261014-2245.zip (battle.js bbd541fb, plus PR #205's three-post.js / three-renderer.js).
- mondo: "camera doesnt follow my unit when i jump to a tile".
- Cause: battle.js doJump deliberately skipped the follow pan for the local human ("parity with walking"); only AI/remote jumps panned.
- Fix: every jump pans takeoff to landing over the 480 ms arc (animateBoardCameraPath, pan only: zoom/tilt/yaw kept). AI/remote keep the fog gate. Guests already followed via online.js jump-anim relay.
- Local walks still never pan (doMove isHuman branch). If mondo asks for walk follow, same pattern there.
- Syntax-checked only. Notes: docs/notes/champions-combat.md "THE JUMP FOLLOW". Related: [[range-fit-camera]].
