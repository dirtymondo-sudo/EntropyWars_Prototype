---
name: locke-remake-20261112
description: 11-12 PR #1233: Agent Locke remade on the creator body (first CAST look); how cast looks are wired, bake command, what is left
metadata:
  type: project
  modified: 2026-11-12T17:16:38.797Z
---
Thread (thread in the owner project). mondo 11-12 16:18Z (portraits thread): "Do B" = "Ship, and remake Locke to blink". Follows [[meshy-remake-batch2-round2-20261112]].

- SHIPPED PR #1233 (~17:25Z), live: ewm_t2locke_outfit.glb 030cbb44, skin_ew_face_locke.jpg c789d039, mpfb_shapes.glb ce57a0c4 (adds lockeFace).
- WIRING: sprites.js CAST_CREATOR_LOOKS { locke: { gender, look } } + getCastLookModel(id, race, gender). getCastModel (DOOR HQ spawns, portrait studio) and getRace3DModel's cast branch (board; keeps the Door Agent's gun) return a creator def with def.raceLook. normalizeCharacterAppearance({cast}) still returns null: read the look from def.raceLook. Kill switch window.EW_DISABLE_CAST_LOOKS = true. To remake another cast member: add a row there, nothing else.
- BAKE: `ISLENECK=0.2 OPENSKIN=1 OPENX=0.045 OPENX2=0.045 OPENZ=0.3 SKINISLE=400 python3 -I bake-outfit.py --name locke --label "Agent Locke" --gender female --src locke_t2.glb --bodies charactercreation/mpfb` (source copy /mnt/project-files/meshy-remake-batch1/locke_t2.glb). --neckline cut her blouse collar away, do not use it on a collared shirt. Hair: creator mh_elvs_short_side_do tinted #e6e6ea.
- LESSON: a fully dressed suit on the fuller creator body lets bust, shoulders, crotch and calves stand through; SKINISLE hides them, ISLENECK keeps the neck. ZOMBIE IS FEMALE (rebake check with --gender female).
- NOT SEEN: her in DOOR HQ, in the first fight, the blink in the live portrait (portraits thread told). LEFT, told him: dark teeth in the collar V, mouth a little pursed, fringe sweeps the other way from the old model.
- Proof: /mnt/project-files/meshy-remake-batch1/locke_look_check.jpg.
- ROUND 2 PR #1238 (~18:40Z; mondo 17:18Z: "fix the dark teeth in the v of the blouse collar, and i think the mouth being pursed is a thing for all mpfb bodies, see if you can fix that for all of them"). COLLAR: bake command now `ISLENECK=0.2 OPENFRONT=1 SKINISLE=400` (OPENSKIN dropped); OPENFRONT shows skin in the open V + lifts the collar cloth 6 mm; file 921dfad8. RESTING MOUTH (all MPFB bodies): three-renderer.js MOUTH_REST { mouthWidth .25, lowerLip -.35, upperLip -.2, mouthCorners .12, mouthDepth -.4 } added to every look's mouth sliders in shapeBody; `window.EW_MOUTH_REST = false` undoes; stronger values read as a smile. Notes character-creator.md "THE RESTING MOUTH". Left: Locke's fitted face keeps a heavy lip line. Proof resting_mouth_before_after.jpg, locke_collar_before_after.jpg.
