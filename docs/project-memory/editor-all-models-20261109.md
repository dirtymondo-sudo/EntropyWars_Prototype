---
name: editor-all-models-20261109
description: RULE every model in MODEL_LIST placeable in the editor (PR #1068, 11-09): HQ_CATALOGUE_ALL 721 rows, Elbolilloduro Roads pack HQ_CATALOGUE_ROADS, base 'asset'
metadata:
  type: project
  modified: 2026-11-09T03:57:49.524Z
---
mondo 11-09: "Everything in the model list should be available in the map editor" (after finding only the Meshy road there).
Thread (thread in the owner project), PR #1068 merged, token 20261109-allmodels-01-cors, uploaded.

- RULE: any new model on R2 that can stand in a room gets a DOOR_HQ.catalogue row in the same PR (or a HQ_TREE_KINDS kind).
- data.js HQ_CATALOGUE_ALL (721 rows: PSX Mega Pack 584 `psx_<file>`, Elbolilloduro pieces, unlisted Meshy props/decor/hand props/
  spell props, Halloween ghost). Row fields `group` (palette group) + `label` (palette name). `base: 'asset'` = file is bucket path
  under Assets/. Pack sizes = file bounds (real metres); Meshy = hand sizes.
- ROADS: Elbolilloduro CC0 Roads pack cut by repo tool bake-roads.py (bpy 5.2 pip module; .blend textures relinked via Roads.dae)
  -> R2 Assets/world/packs/elbolilloduro/roads/ (106 GLBs). data.js HQ_CATALOGUE_ROADS keys roads_<a_straight..g_sign>_<nnn> + 12
  Christmas streets xmas_road*. Meshy road rows kept. Other road sources NOT done: gas station / VHS / tacos pack Road pieces,
  jamzuz Road.glb, BlenderVoyage graveyard road (CC-BY); PSX Mega Pack II (not owned) has asphalt.
- HQ_TREE_KINDS tree_21-51 = 31 old OBJ trees.
- Headless proof gotchas: editor at 1 fps in swiftshader; use DOM .click() via evaluate (page.click times out); ?ew_gpu=webgl;
  thumbnails draw slowly headless (~1 per 30 s).
- FOLLOW-UP PR #1069 (token 20261109-allmodels-02-cors): `square: true` rows (Roads, PSX modular_structures, ebd _bld_) snap first facing
  to 90°; R/Shift+R on an off-grid piece turns it onto the snap grid first; propPreview loads front-of-queue (`front: true`, 45 s) so
  thumbnails DO draw (proven headless, slow); palette + hotbar names wrap instead of ellipsis.
Related [[model-list-master]] [[psx-mega-pack-20261108]] [[itch-asset-packs-20261103]]
