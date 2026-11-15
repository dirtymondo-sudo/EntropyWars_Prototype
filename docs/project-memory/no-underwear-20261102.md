---
name: no-underwear-20261102
description: 11-02 PR #802: painted black underwear removed from all MPFB + MPFB classic body skins; Chest 'Band' choice dropped
metadata:
  type: project
  modified: 2026-11-02T11:19:46.018Z
---
mondo 11-02: "remove the black underwear from the mpfb body and mpfb classic body, it is messing up some of the other clothes".
Shipped PR #802, zip r2-sync/ENTROPY_WARS_SYNC_20261102-1119.zip (sprites.js, party-builder.js, three-renderer.js, ASSET_MANIFEST.json + 10 body GLBs + 5 look_fixed PNGs under Assets/Models/charactercreation/mpfb/), token 20261102-nounderwear-02-cors.
- The underwear was PAINT (colour 58,60,70) in two places: each body GLB's skin JPEG and looks/look_fixed_<body>.png. Cleaned in place (pixels -> the kit's stock skin_<id>.jpg), no rebake; bake-mpfb.py UNDERWEAR now all ().
- Chest row lost "Band" (mhChest enum nipples|smooth) -- consequence flagged to mondo.
- Bodies are now nude when unclothed (nipples by default on female).
- Asset files changed in place reach players via ASSET_MANIFEST ?h=<sha>; the old manifest sha for mpfb_male was already stale before this.
Before/after sheets: /mnt/project-files/no-underwear/. Plan row 14e; notes models-assets.md "THE NO UNDERWEAR".
Related [[classic-mpfb-bodies-20261101]] [[clothes-holes-20261102]] [[character-models-plan-doc]]
