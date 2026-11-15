---
name: creator-shelves-20261102
description: Creator menus reorganized 11-02 (PR #808, THE SHELVES): one tab per kind, MEN/WOMEN clothes switch, display-only
metadata:
  type: project
  modified: 2026-11-02T12:54:58.961Z
---
mondo 11-02: "organize the character creator better ... wings at the bottom but then wings in equipment ... male and female clothes scattered, should be separated by male and female".
PR #808 (zip ENTROPY_WARS_SYNC_20261102-1254): CLOTHES tabs Tops/Bottoms/Skirts/Dresses/Suits/Coats + capes (Outer layer grouped Coats+jackets/Robes/Uniforms/Costumes, 2nd outer, Cape)/Shoes (Feet layer + pack)/Underwear/Gloves/Belts + ties/Hats/Glasses/Masks with a MEN/WOMEN switch (body's gender default, "Fits anyone" shown on both, worn pieces always shown, nothing blocked). ACCESSORIES: Wings (flapping + pack costume wings), Horns + antlers, Tails, Nails, Held items + gear. Facial hair only under FACE. Base bodies in men's/women's rows; skins split.
DISPLAY ONLY: sprites.js wearShelfOf/wearMadeFor/EW_WEAR_SHELVES/EW_OUTER_GROUPS; EW_MH_WEAR categories untouched because three-renderer layering (tuck, skin cover, hats) reads them.
**Why:** a new pack/Blender piece needs a shelf + gender: add to EW_WEAR_SHELF_MOVE / EW_WEAR_FOR_* if its category or name misleads.
**How to apply:** notes docs/notes/character-creator.md "THE SHELVES"; plan row 12k. Shots /mnt/project-files/creator-shelves/. Related [[character-models-plan-doc]]
