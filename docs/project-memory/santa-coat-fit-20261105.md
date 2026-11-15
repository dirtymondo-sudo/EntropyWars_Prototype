---
name: santa-coat-fit-20261105
description: PR #928 (11-05) Santa Clause look fix — wearCoatFit (Blender coat collar/trims/shoulders on slider bodies) + tight-boot tuck; what was tried and dropped
metadata:
  type: project
  modified: 2026-11-05T09:57:15.570Z
---

PR #928 was merged and uploaded to R2 on 2026-11-05. three-renderer.js three-renderer.js 173c90c1, token 20261105-santacoat-01-cors.

What it fixed (thread in the owner project):
- mondo's Santa: the coat was wrecked, the neck hole too wide, red showed through the belt, and tucked trousers showed through the medieval boots.
- The fix is wearCoatFit, which runs on every Blender coat (outer) on MPFB bodies. It does four things:
  1. skin floor;
  2. sleeves stay under the body piece;
  3. trims, using coverFit;
  4. collar.
- wearBootFit got THE TIGHT BOOT.
- Kill-switch: EW_DISABLE_COAT_FIT.
- Tracker row 12v. Notes are in character-creator.md "THE COAT TRIMS + THE COLLAR". Shots are in /mnt/project-files/santa-coat/.

**Why:** mondo asked. The thread stays open until he says it's good.

**How to apply:**
- Do NOT erode the trim hide. One drawn ring under the band poked through the belt and band when posed.
- The collar must stop at garments worn under the coat. Without that, the cowboy's shirt collar poked through the greatcoat stand.
- The shoulder notch was in the bind pose too (a fit problem, not weights). The skin floor fixed it.
- Still open: skin specks through the pack trousers on heavy shins. They were there before this change and also show with OUTSIDE.

Related: [[pants-boots-20261103]] [[coat-flaps-mpfb-only-20261103]]
