---
name: creator-layers-123-20261104
description: 11-04 creator OUTFIT > TORSO > LAYERS 1·2·3 (PR #889): layer 2 = wear2 second top or outer vest/jacket, layer 3 = outer2 coat; layer clipping fixes
metadata:
  type: project
  modified: 2026-11-04T20:13:02.195Z
---
mondo asked (11-04, (thread in the owner project) for a layer system in the creator, "layer 1, 2, and 3", not just one outer coat. Delivered PR #889, merged + uploaded to R2.

- UI: OUTFIT > TORSO > "LAYERS 1 · 2 · 3" replaced the Tops + Coats tabs (party-builder.js ccTorsoLayers). L1 = pack/Blender top (wear tops). L2 = appearance `wear2` (a second pack top, drawn just over L1; a Blender wear2 uses the old top2* fabric keys) OR an `outer` vest/jacket/coat, or a pack coat. L3 = `outer2` coat.
- Renderer (three-renderer.js): wearUnderCover also uses the upper garments' del lists (delUp) + LINE_TILT crack test (shirt specks at sleeve seams/armpits); wearUnderOuter2 keeps the under garment where all of its lines miss the coat (`seen`, OUTER2_HIDE seeReach/standOut), so there are no holes at the open-coat front.
- Known leftover: a few lapel specks with a hoodie under an open long coat.
- Shots: /mnt/project-files/creator-layers/. Notes: character-models-plan.md row 12r, character-creator.md "THE LAYERS 1 2 3".

**Why:** the next layer/clipping ask should start from these rules, not add a 4th coat slot.
**How to apply:** for new layered clothes, check them on MPFB bodies only ([[coat-flaps-mpfb-only-20261103]]).
