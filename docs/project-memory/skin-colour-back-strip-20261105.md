---
name: skin-colour-back-strip-20261105
description: 11-05 PR #917: pale strip down the back under a picked MPFB skin colour = EW_MH_SKIN_KEEP boxes overlapping the spine seam; now exact outlines
metadata:
  type: project
  modified: 2026-11-05T08:29:07.276Z
---
2026-11-05, thread "Fix white spot down red demon's back" (thread in the owner project), PR #917 merged, uploaded live (sprites.js ab667318, three-renderer.js 9500d9d4), token 20261105-backstrip-01-cors.
- Cause: three-renderer.js tintSheet restored sprites.js EW_MH_SKIN_KEEP (mouth inside) untinted; the boxes also covered the hm08 torso island's left edge (= one side of the spine seam, mid back to waist) and right fingertips.
- Fix: KEEP = 3 polygons (cheek pieces + tongue) traced off MPFB UVs; tintSheet clips to them. Notes: character-creator.md "THE LOOK COLOURS" -> THE BACK STRIP FIX.
- Lesson: any rect on the hm08 sheet must be checked against the body UV islands (the back seam sits at the torso island's outer edges, x~120-165 and ~650).
Related: [[clothes-holes-20261102]]
