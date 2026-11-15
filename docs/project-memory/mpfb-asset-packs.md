---
name: mpfb-asset-packs
description: MakeHuman/MPFB2 community asset packs: where to download, which are CC0 vs CC-BY, which mondo was told are worth using (11-01)
metadata:
  type: reference
  modified: 2026-11-01T06:06:53.219Z
---

Index: https://static.makehumancommunity.org/assets/assetpacks/index.html (65 packs). Each pack page lists its zip:
files.makehumancommunity.org/asset_packs/<pack>/<pack>_cc0.zip (system assets) or /functional/<pack>.zip (faceunits01,
visemes01, visemes02). Reachable from the project env since 11-01 (allow list).

Licences: every pack is CC0 or CC-BY (CC-BY = credit each author). faceunits01 (52 ARKit), visemes01 (22), visemes02
(15 Oculus names) are CC0. CC0 packs worth using (told mondo 11-01): makehuman_system_assets (23 skins, eyes, 12 brows,
lashes, 10 hair, teeth, tongue, few clothes), skins01/02/03 (56 skins; 03 = zombie/alien/elf/grey etc.), eyebrows01,
eyelashes01, hair01, system_hair_materials01. Later: suits01/02, shirts01, pants01, shoes01, hats01/02, masks01,
gloves01, glasses01, bodyparts01/05, animal01/ears01/nose01/cheek01 targets. mondo 11-01: "i dont mind having a credits scene" -> CC-BY packs
are OK too; keep a credits list (author + licence) of every CC-BY asset used (bake writes it). Skip pose packs. Avoid the "with_genitals" skins.

mondo 11-01 on the first MPFB bodies (procedural stand-in skin): lips looked like smeared lipstick, brows chunky/jagged.
Fix = stock skins + real eyebrow meshes. [[modular-characters-plan-20261101]]

11-01 PR #725 (merged): bake-mpfb.py --packs bakes stock skin + brows/lashes/eyes INTO the skin texture, stock hair
mesh, ARKit 52 + 15 visemes, CREDITS.json; all 5 bodies checked in the real game on the live CDN (idle/walk/cast play).
Still NOT wired to any race (needs mondo's OK).
11-01 PR #726 (merged): the 5 bodies are picks in the character creator (BODY row; DOOR Agent / officer looks),
Height slider works on them (stage + board); sync zip 20261101-0649 carries the GLBs to R2 Assets/Models/charactercreation/mpfb/.
ALL 64 packs downloaded (3.3 GB, 940 assets, 590 CC0 / 350 CC-BY) to project files mhpacks/; per-asset author/licence in
repo charactercreation/mpfb/ASSET_PACKS_CATALOGUE.json. Any CC-BY asset used must go in CREDITS.json.

11-01 mondo: "base the character creator around these models", carry over the current hair pack, add pack hair + clothes.
Plan told to him: 1 current creator on MPFB (PR #727 done: creatorBase, stock face kept, THE BODY MAP t-warp), 2 pack hair
as hair styles, 3 pack clothes as picks, 4 skin/eye/brow picks from packs, 5 MPFB default in creator + credits. Classic
MALE/FEMALE stay. Known flaw: long coat over skirt shows skirt at lifted thigh in idle.
Step 2 DONE PR #730 (70 pack hair, mh_* ids, zip 0754). Shared tracker: docs/notes/character-models-plan.md (update rows per PR + copy to project files).
Step 3 DONE PR #738 (476 pack clothes, all 5 bodies, compact GLBs charactercreation/wear, zip 20261101-0852 ~200 MB).
mondo 11-01 08:13: creator body sliders do nothing (confirmed: rig never shaped skin for chest/waist/hips/head/jaw/nose/
cheeks; Build only moved cloth frame) + wants a Bust slider + spring-bone hair sway. Plan rows 11b/11c. Told him MPFB
builds bodies from sliders + hundreds of face/body targets (5 bodies are just presets).
11b DONE PR #739: sliders shape body (MPFB = MakeHuman targets mpfb_shapes.glb by _BASE_INDEX; classic = rig shapeBody), new Bust slider, zip 20261101-0910. mondo uploaded zip 0852 (live checked 09:08). Height already worked (checked by mouse). Next: 11c hair sway.
- 11-01: row 11c hair sway DONE (PR #740, zip 20261101-0919): any creator hair below the jaw gets 7 spring chains on the head (three-renderer.js swayHair / HAIR_SWAY). Next: step 4 skin/eye/brow picks (row 13), step 5 MPFB default + credits (row 14).
- 11-01: row 13 looks DONE (PR #741, zip 20261101-0936 = cumulative, supersedes 0919/0910): 78 skins / 9 eyes / 26 brows / 9 lashes as hm08-sheet layers in charactercreation/mpfb/looks, composed on canvas by three-renderer setLook; appearance mhSkin/mhEyes/mhBrows/mhLashes ('own' default). Next: step 5 MPFB default + credits screen (row 14).
- 11-01: mondo uploaded zip 0936 (all looks live by 09:42). Row 14 DONE (PR #742, zip 20261101-0942): CREATE APPEARANCE/RANDOM/RESET + officer intake start on MPFB body by gender (saved looks w/o body stay classic); creator CREDITS section lists CREDITS.json by author, CC-BY first. Creator plan steps 1-5 ALL DONE. Open extras: row 9 coat-over-skirt poke, row 12 Blender-built missing clothes, heels float, tee-under-suit z-fight, ears/animal heads.
