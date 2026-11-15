---
name: blender-clothes-row12
description: Row 12 / 4d Blender clothes DONE 2026-11-01 (batches 1-5c, PRs #753-#764) + row 12c Blender shoes (PR #774), tool bake-clothes.py
metadata:
  type: project
  modified: 2026-11-01T12:18:14.431Z
---

Row 12 (character-models-plan 4d) soft clothes built in cloud Blender, thread "Build soft clothes in Blender" (thread in the owner project).
- Pilot: trench coat, bake-garment.py, PR #753 (nearSet reshape for outer coats).
- Batch 1 DONE 2026-11-01 PR #754: 8 capes (ewb_cape_*.glb) via bake-clothes.py (imports bake-garment.py), new creator Cape layer (appearance.cape, MPFB bodies only), sway chains, fitSmooth reshape for capes on classic MPFB bodies. Zip ENTROPY_WARS_SYNC_20261101-1217.
- Batch 2 DONE PR #756 (zip 20261101-1248): long coats as Outer picks b<key> -> ewb_<key>.glb, sprites.js EW_BLENDER_COATS with `look`): duster, pirate, leather, longcoat, greatcoat, overcoat, frock, tailcoat (tails sway), labcoat.
- spaceSmooth (ewWear.fitSpatial) fixes long-skirt layer tearing on classic bodies; MPFB heavy shows tee specks at shoulders/belly under any Blender coat (trench too), left as is.
- Batch 4a uniforms DONE PR #759 (zip 20261101-1323): police, general, turnout, riot, chef, gi, jersey. Batch 3 robes DONE PR #757 (zip 20261101-1308): cassock, habit, cultrobe, anunnaki, succubus, raggedrobe. Next 4 uniforms+fighters, 5 ragged/costume.
- Batch 4b tight clothes DONE PR #762 (zip 20261101-1450): Football pants (pack Bottoms, takes Bottoms colour), Wrestling singlet (Suits, takes Top colour, front rises over a bust), Luchador mask (Masks, own red/gold). Per-body hidden skin ewWear.delBy. Known: female painted bra shows at singlet armholes; classic male tiny Briefs speck; hair over mask.
- Batch 5a+5b DONE PR #763 (zip 20261101-1531): Outer picks santa, robinhood, tabard, krampus (own fur, harness), fringe, scarecrow, zombie (Tattered shirt), clown, leafdress; Bottoms skirts raggedskirt, valkyrie, kilt, loincloth (skirt=True coat mode, sway chains hang from the thigh under them: ewWear.sway.parents). Coat skirt fronts stretch between the legs in the creator's wide stance (hang weights), so charges stay above the hips.
- Batch 5c DONE PR #764 (zip 20261101-1626), 4d LIST COMPLETE: pack picks Mummy wraps + Ghost sheet (Suits), Scale leggings, Do-rag, Suspenders, Coin belt, Belly-dancer top, Off-shoulder top. Creator note: a Suits pick does NOT turn off the coded Top/Bottoms shells, so the tee pokes through the mummy unless Top = Topless (+ Briefs); checks need PREP="Top:Topless,Bottoms:Briefs". Ghost weights: fingers -> hand, far-from-skin parts ride the torso, smoothed; all hem chains on pelvis (thigh-hung chains flared out as wings).
- Row 12c SHOES DONE PR #774 (zip 20261101-2103): packs DO have 65 shoes/boots (already creator picks under MakeHuman clothes > Shoes, row 11). Feet row got 5 Blender picks bsneakers/bboots/bhighboots/bsandals/bcowboy (ewb_shoe_*.glb, sprites.js EW_BLENDER_FEET, three-renderer CC_MESH_FEET; classic Meshy bodies fall back to coded shell). Built per foot from a convex-hull last (bake-clothes.py THE BLENDER SHOES, --only shoe_<key>). CC_MESH_TUCK raises coded trouser hems under boots. Known: small step at boot ankle front; pack jeans sit over shafts; heels don't lift the foot; cowboy race look still wears baked coded High boots.
- Bake needs bpy 5.2.3 + /tmp/mpfb2 + R2 tiles (curl with User-Agent). New wear GLBs must be added to ASSET_MANIFEST.json (sha1 first 12, ensure_ascii JSON).
Related: [[character-models-plan-doc]] [[modular-characters-plan-20261101]]
