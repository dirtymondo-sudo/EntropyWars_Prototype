---
name: classic-clothes-retired-20261102
description: 11-02 PR #783: coded classic clothes retired (EW_RETIRED_CLOTHES swap on normalize), Blender basics, classic MALE/FEMALE bodies wear pack+Blender clothes (THE CLASSIC FIT)
metadata:
  type: project
  modified: 2026-11-02T01:30:04.003Z
---
2026-11-02, thread "Replace classic clothes with Blender ones" (thread in the owner project), PR #783 merged, zip r2-sync/ENTROPY_WARS_SYNC_20261102-0129.zip (4 js/json + 12 R2-only GLBs).
- mondo: remove every classic coded clothing/shoe/accessory pick, keep a replacement for each, KEEP the classic MALE/FEMALE bodies. On a decision card he picked "Fit the new clothes to them" (the classic bodies wear the pack + Blender clothes).
- sprites.js EW_RETIRED_CLOTHES + retireClassicClothes (inside normalizeCharacterAppearance) swap old ids on every read. Cowboy/cowgirl race looks are re-baked. Replacement table: /mnt/project-files/classic-clothes-retired/replacements.md.
- New Blender pieces (bake-clothes.py THE BLENDER BASICS): longsleeve, henley, sweatpants, jacket/blazer/vest/cardigan (Outer b*), belt (belt layer, joins THE LAYERS), tie, bowtie.
- THE CLASSIC FIT: bake-classic-fit.js -> charactercreation/mpfb/mpfb_classic_fit_<g>.glb; three-renderer ensureClassicFit / _ccWearBody(part).
- Wings row: feathered, bat, dragon.
- Known issues: shirt specks at the shoulder tops under coats; a skin patch at the classic MALE crotch under pack trousers in the wide stance; the waistcoat's armhole edges are jagged.
Related: [[blender-clothes-row12]] [[character-models-plan-doc]] [[r2-only-assets-dropped-20261101]]
