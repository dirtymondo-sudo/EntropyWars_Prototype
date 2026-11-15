---
name: capes-drape-20261105
description: 11-05 PR #922 all 8 Blender capes rebaked (THE DRAPE): collar rings the neck, covers shoulder cap, shirt no longer pokes through
metadata:
  type: project
  modified: 2026-11-05T09:20:07.842Z
---
mondo 11-05: "fix all of the capes too ... dont connect to the body properly, they are way too wide" (thread in the owner project).
Cause was the BAKE (bake-clothes.py cape_sheet/Field), not runtime: slab-hull rows put the neckline on the shoulder tips; armx 0.22 cut through the deltoid so the tee came out through the cape even in bind pose; shoulder cloth rode only collarbone/spine.
Fix PR #922: Field drape (hull of everything above), neckline per column 2 cm off the neck, armx 0.30 above 1.44, sh_ease, side_in 0.25, cape_weights shoulder cap takes upper-arm skin weights. Uploaded to R2 + manifest.
Known / open: hang width only a little narrower (side_in); shoulders read a bit fuller (cape covers the deltoid). Female heavy Hooded cape still flares at the hips (same as before). If he still says too wide: raise side_in / lower flare in CAPES specs and rebake (`python3 -I bake-clothes.py --mpfb /tmp/mpfb2 --only <keys>`, ~7 s each, needs bpy 5.2.3 + mpfb2 clone).
**How to apply:** probe harness = scratch Playwright EWCharViewer.mount + mixer.setTime(1.3); notes models-assets.md "THE DRAPE". Related [[blender-clothes-row12]] [[coat-flaps-mpfb-only-20261103]].
