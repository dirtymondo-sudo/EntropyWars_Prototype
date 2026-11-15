---
name: second-outer-layer-20261101
description: Creator second Outer layer (outer2): PR #779 (11-01) + clipping pass 2 PR #781 (11-02): how layers under it are hidden, limits
metadata:
  type: project
---

mondo (11-01) asked for a second Outer layer in the character creator (coats over coats) with nothing underneath clipping through. PR #779 shipped CLOTHES > LAYERS > + ADD LAYER > SECOND OUTER LAYER, with keys outer2/outer2Fabric/outer2Color/outer2Color2/outer2Pattern.

11-02 mondo: "Still getting some layers clipping through". PR #781 (pass 2) was checked on 26 combos x 15 poses (including the idle picker poses). It fixed these problems:
- coded coats' front OPENING was also cut down the spine on MPFB bodies (frontness assumes back z < -0.03 q). Fixed with torsoMid/frontnessMid; this affects every coded open coat, including single-layer ones.
- coded under coded outer2 is hidden where outer2 covers the body whole, with sleeveIn 3 cm and neckUnder.
- Blender under coded is hidden via part.out2Cov.
- a tail under a tail uses hideBehind.
- Blender under Blender: pokesAtOpening hides parts sticking out at the coat's edges, accents are tested on their own vertices, and a mesh left under 5% visible is hidden whole.

Known limits flagged to mondo: a coded long coat over a long Blender robe drops its tail (stops at the hips). A longer under-layer showing below a shorter coat, or its collar inside the coat's opening, is normal layering.

**Why:** later clothing/layer threads need to know where the hiding lives, and that checks must be POSED, not just idle.
**How to apply:** read docs/notes/character-creator.md "THE SECOND OUTER LAYER" + "Pass 2". The probe harness was a scratch posed.js (EWCharViewer.play / playClip, then freeze v.preview.act at a fraction and snapshot). Related [[creator-clipping-20261101]] [[idle-pose-picker-20261101]]
