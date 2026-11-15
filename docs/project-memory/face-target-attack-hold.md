---
name: face-target-attack-hold
description: PR #287/#289 (2026-10-18) click-to-face, basic attack keeps the Target Camera two-shot with a push-in, Cube attack + all auto returns never zoom out to the overview
metadata:
  type: project
  modified: 2026-10-18T05:12:21.657Z
---
PR #287 merged 2026-10-18 (face + attack hold). PR #289 merged 05:10 (Cube zoom + push-in), token 20261018-cubecam-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-0512.zip (battle.js 9e9a7fa3).
- mondo: click an enemy/unit → your unit turns to face it; a basic attack keeps the selection camera "the same, just with a slight zoom in or push in", tracking a forward jump. He was angry it still spun back after #287.
- battle.js doFaceUnit via _faceTargetPick in _tpsTargetShot; online engine action 'doFaceUnit'.
- Attack hold: doAttack opts.menuHold → _menuAttackHold keeps _menuTargetShot; _menuAttackPush ×1.12 over wind-up; softResetToUnit → _menuAttackSettle eases out and KEEPS the two-shot (the old soft-reset moveTo restored the menu home = the spin). Guest eases out on the push timer. _menuAttackTrackLeap for 2+ tile leaps.
- Cube: doAttack's Cube branch used getCloseZoom() = whole-board overview (snap). Now _menuAttackHoldTile + same push/settle. getRestZoom() (turn framing) replaced getDefaultZoom fallbacks in reset/soft reset/menu home/CPU openings; EOR overview uses getEorFocusZoom.
- Browser check: scratch harness with local npm mirror + proxy bypass localhost; swiftshader very slow. Real-click attack flow in TDM works (spin.js); arena Cube needs vision gate off when teleporting units.
Notes: docs/notes/champions-combat.md "THE CLICK FACE + THE ATTACK HOLD", "THE CUBE CAMERA + THE REST ZOOM". Related: [[jump-camera-follow]], [[range-fit-camera]].
