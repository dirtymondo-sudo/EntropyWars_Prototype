---
name: bunny-girl-sprite-20261027
description: PR #576 (10-27) wired mondo's Races/bunnygirl/bunnygirl.png as the bunny girl 2D sprite and added hud.js FACE_AIMS, a shipped per-sprite portrait face aim
metadata:
  type: project
  modified: 2026-10-27T01:42:11.034Z
---

PR #576 (2026-10-27, merged): bunny girl's 2D sprite = `Races/bunnygirl/bunnygirl.png` (64x128; was catgirl's borrowed sheet). Board body stays her GLB.

Her portrait is the UI Maker face cut from the sprite (hud.js EWFaces). The auto aim landed on her ears, so hud.js `FACE_AIMS` (new, keyed by path under Sprites/) ships her aim {x 0.492, y 0.289, s 0.203} as that sprite's auto aim; a viewer's own UI Maker aim still wins.

**How to apply:** when mondo asks to "zoom in on the face" for a new sprite with no portrait art, check the auto aim first (port of faceAim works in Python); if it misses, add a FACE_AIMS row instead of new art. Screenshots in /mnt/project-files/bunny-girl/. Sync zip ENTROPY_WARS_SYNC_20261027-0142 (hud.js 522714fa, sprites.js 49c4e455). Related: [[ui-maker]]
