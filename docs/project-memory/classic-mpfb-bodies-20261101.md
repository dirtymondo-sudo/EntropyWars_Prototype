---
name: classic-mpfb-bodies-20261101
description: 11-01 PR #746: classic creator bodies with the MPFB head + skin (2 new body buttons) and the female chest choice (band/nipples/no nipples)
metadata:
  type: project
  modified: 2026-11-01T10:16:38.445Z
---
mondo 11-01 09:44 likes the OLD classic creator bodies' shape but wants the MPFB skin + head (he thinks the heads blink/talk) and the black chest band gone, with a nipple and a no-nipple option.

Shipped PR #746, zip r2-sync/ENTROPY_WARS_SYNC_20261101-1014.zip, token 20261101-classicmpfb-01-cors:
- bake-mpfb-classic.py (repo root; bpy for mathutils BVH): MPFB male/female reshaped below the neck onto Meshy_AI_human_body_base_mesh_<g>_rigged.glb (~1 mm), MPFB head/hands/feet kept -> charactercreation/mpfb/mpfb_classic_<g>.glb. Body ids mpfb_classic_male/female (sprites.js EW_MPFB_BODIES `kit`), all looks/sliders/pack clothes work (buildWear follows _FIT_D). Old MALE/FEMALE untouched.
- Chest: appearance.mhChest band|nipples|smooth (EW_MH_CHEST, setLook clip + smoothChest), female MPFB bodies only. The band was just paint in look_fixed_female.png; stock skins already have nipples.
- 10:28 mondo: classic MPFB shoulders folded + wrists pinched in poses -> fixed PR #748 (joints follow reshaped skin, hands/feet re-seated).
- 10:18 mondo OK'd idle face -> PR #748 (zip 20261101-1035, token classicmpfb-02): every MPFB body blinks/glances/brows/faint smile/jaw breath (three-renderer faceIdle, FACE_IDLE_KEYS, kill switch EW_DISABLE_FACE_IDLE). Talking mouths (visemes from dialogue) still row 21.
Plan doc rows 14b/14c. Related [[mpfb-asset-packs]] [[character-models-plan-doc]]
