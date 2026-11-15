---
name: coat-fronts-shirts-20261102
description: PR #786 (11-02) open/closed coat fronts, 6 Blender collared shirts as Clothes pieces, cowboy matched look NOT baked (awaiting mondo)
metadata:
  type: project
  modified: 2026-11-02T01:57:24.501Z
---
PR #786 merged 2026-11-02 (thread in the owner project), plan row 12g.
- Fronts: 29 Blender Outer picks have the other front as ewb_<coat>_open/_closed.glb (bake-clothes.py FRONTS); creator Front OPEN/CLOSED row; appearance.outerFront/outer2Front.
- Shirts: ewb_top_shirt/shirtopen/workshirt (tucked, z46), shirtloose/shortshirt/polo (z52) in EW_MH_WEAR + EW_WEAR_LAYER_OF 'top' (Clothes > Tops), real collars.
- Sync zips: wear GLBs are NOT picked up by sync-zip.js; add them by hand under Assets/Models/charactercreation/wear/ in the same zip folder (precedent: 0129 zip from #783).
- Cowboy matched look (work shirt, open duster, jeans, cowboy boots, belt, beard) saved as bake-looks export in /mnt/project-files/clothes-fronts-shirts/; NOT baked, mondo's decision card pending. Missing: gun belt/holster (Meshy #2), worn leather, silver buckle.
- Known: collar slightly crumpled on mpfb_classic_male bind pose; shirt specks at shoulder tops under coats.
Related: [[blender-clothes-row12]] [[creator-clipping-20261101]] [[race-looks-cowboy-20261101]]
