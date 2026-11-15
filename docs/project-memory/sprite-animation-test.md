---
name: sprite-animation-test
description: 2026-10-24 hand-made Catgirl idle + attack pixel sprite animations (capability test, not wired into the game)
metadata:
  type: project
  modified: 2026-10-24T10:30:48.320Z
---

mondo asked (2026-10-24) to see if Claude can hand-make sprite animations from a race's unit sprite. One-off exception to the no-art rule, for this ask only.

Delivered in /mnt/project-files/sprite-animation/: Catgirl idle (8 frames, 120 ms) and claw-swipe attack (10 frames) sheets on 256x256 cells at the 128x128 sprite's native pixel scale (sprite at canvas 64,120), GIF previews at 2x, transparent WebP, and the generator script catgirl_anim.py (palette sampled from catgirl_female.png). NOT wired into the game; the existing RACE_SPRITE_ANIMATIONS catgirl entry (3x3 384px gun sheets) is untouched.

Future asks he mentioned: more angles of sprites as reference, and small sprite animations for spell previews in the unit info panel.
