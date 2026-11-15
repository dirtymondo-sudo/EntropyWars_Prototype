---
name: mh-eye-hair-materials-20261103
description: 11-03 PR #858: MakeHuman system_eye_materials01-03 + system_hair_materials01-02 wired into the creator (eye rows, Hair texture row, credits)
metadata:
  type: project
  modified: 2026-11-03T11:41:29.179Z
---
mondo 11-03 asked for system_eyes_materials 1-3 + system_hair_materials 1-2 from the MakeHuman asset packs page "if we havent already".
Before: only system_hair_materials01 was in project files mhpacks/ (not wired). Now all 5 zips are in mhpacks/.

Shipped PR #858, zip r2-sync/ENTROPY_WARS_SYNC_20261103-1140.zip (6 scripts + 120 R2 files added by hand: Assets/Models/charactercreation/
mpfb/looks/eyes/materials/*.png (52), hair/mh/materials/*.png (67), mpfb/CREDITS.json; it also carries forward the 9 Assets/misc GLBs from
zip 1138 that were not yet live). Token 20261103-mhmats-01-cors.
- Eyes: sprites.js EW_MH_EYE_MATS pushed onto EW_MH_EYE_PACK (row[4] folder, row[5] group). FACE > EYES rows "Eye materials: human /
  non-human / various" (pack 03 = CC-BY). 5 PNGs (anime x3, snake, target) got the stock cornea alpha (otherwise the dome hides the iris).
- Hair: EW_MH_HAIR_MATS + getHairMaterial, appearance.hairMat; three-renderer.js setHairMat (own colours, white vertex colours).
  HAIR > "Hair texture" row only on Bob 01/02, Braid 01, Long 01, Ponytail 01, Short 01/02/04; Hair colour row hidden while one is worn.
- Credits: CREDITS.json creator_eye_materials / creator_hair_materials. Hider kind hairMat.
Shots: /mnt/project-files/creator-mh-materials/. Plan row 29d. Related [[eye-pack-20261103]] [[mpfb-asset-packs]] [[character-models-plan-doc]]
