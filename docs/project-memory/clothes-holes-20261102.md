---
name: clothes-holes-20261102
description: 11-02 PR #799: clothes holes/clipping fix (skin cover, clothes under clothes, classic reshape); hole-detector rig; cowboy look baked (PR #800)
metadata:
  type: project
  modified: 2026-11-02T10:44:15.823Z
---
2026-11-02, thread "Fix clothes holes" (thread in the owner project), PR #799 merged, zip r2-sync/ENTROPY_WARS_SYNC_20261102-1042.zip (three-renderer.js only, no GLBs). Plan row 12i.
- mondo's complaints: tucked shirt waist hole, hat holes at temples, collars bad, holes at shoulders/armpits/back. His cowboy look export: /mnt/project-files/clothes-holes/Entropy_Wars_Race_Look_cowboy_MONDO_20261102-0754.json (open greatcoat, ewb_top_shirt, belt, cowboy hat, ewb_beard_full, pack jeans + ankle boots, MPFB classic male, Idle_11). Before/after sheets in the same folder.
- Fix = runtime only (three-renderer SKIN_COVER/skinCover with tilted-ray open-edge test, wearUnderCover, nearSet d0+R weighting). Notes character-creator.md "THE SKIN UNDER THE CLOTHES".
- Check method: hole detector = body BackSide magenta clone; a magenta pixel = looking into the hollow body. Pixel counts are noisy run to run (hair/wear sometimes fail to load in the scratch rig).
- Known left: pack tank tops on MPFB CLASSIC bodies tear at one strap (classic fit of pack pieces); Blender collared shirts have a dark fold at the shoulder seam (bake-clothes.py); tucked shirt without trousers shows tuck specks; hair003 hard temple edge = its texture.
- Cowboy look BAKED at mondo's card pick (PR #800, zip 20261102-1052, sprites.js only); three-renderer.js from #799 was already live by then.
Related: [[coat-fronts-shirts-20261102]] [[classic-clothes-retired-20261102]] [[creator-clipping-20261101]]
