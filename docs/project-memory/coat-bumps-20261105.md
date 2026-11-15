---
name: coat-bumps-20261105
description: 11-05 coat hang fixes: PR #921 (bumps in upright idles) then PR #944 THE BAKED SHAPE (pointy hip sides, wide-stance bands, cassock seat hole, sleeve slab)
metadata:
  type: project
  modified: 2026-11-05T11:24:17.243Z
---
mondo 11-05: "all of the coats still have these 2 weird bumbs on the side" + asked if the MPFB classic fit caused it. NO: with EW_DISABLE_SWAY the baked coats are clean A-lines; everything came from THE COAT HANG (three-renderer.js COAT_HANG runtime chains). Thread (thread in the owner project).

Pass 1, PR #921: limT + poseA. Upright improved, but he was furious that the after shots "look the exact same": the wide stance still had pointy hips and horizontal bands, and the heavy cassock had a seat hole.

Pass 2, PR #944 (token 20261105-coatbumps-02-cors, live on R2):
- tdir 1: bones follow the coat's baked segments. Aiming from the current head at the baked next joint made the chain zig-zag, which caused the bands.
- follow 0.5 + followSide (front panels keep the full follow).
- poseA null: clearance = rad x t in every pose.
- SLEEVES OUT: vertices with >0.3 arm weight are left out of the chains and the fade. The cuffs had been pulling the side chains into a slab on the duster and long coat.
- jsym/jblend 0.5.
- Jeans through: male wide 358->144 (the rest is the hem gap), lab coat 174->26, duster 1015->115, cassock hole 41->0.
- Sheets: /mnt/project-files/coat-bumps/coats_pass2_C..F.jpg.
- Known: a soft shadow under the seat on the heavy cassock (the coat's own bake), a few px of the lab coat's jeans seat, and the thin long coat's tee at the waist side.

**Why:** judge on shaded shots in ALL poses (wide + walk + upright) on all bodies, not one upright pose.
**How to apply:**
- Harness: a scratch Playwright coat.js that serves the repo JS over cdn routes, uses s.yaw for views and settles hangTick 20x through a temp hook.
- Build-time COAT_HANG params are cached per page after the first job, so test them one per run.
- Never `pgrep -f X` inside a `sh -c` that contains X: it matches itself and loops forever.
- Related: [[coat-flaps-mpfb-only-20261103]]
