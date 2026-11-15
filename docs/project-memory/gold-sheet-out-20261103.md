---
name: gold-sheet-out-20261103
description: terrain/gold.png banned; PR #865 removed 17 pieces still loading it, Excessive Machine pipes = Meshy organ pipe; PR #867 gold = gilt.png (Metal007, mondo's pick)
metadata:
  type: project
  modified: 2026-11-03T12:54:36.898Z
---
mondo 2026-09-21 disliked all three bucket gold sheets (gold.png, gold_2, gold_3); TERRAIN_SPRITES `gold` = aluminium tinted #e0b048.
11-03 he saw Excessive Machine (Barbarella) still had gold rods: 17 spell/trap pieces loaded `terrain/gold.png` by file name.
PR #865 (token 20261103-goldout-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261103-1254.zip incl. Assets/decor/organ_pipe_white.glb by hand):
- three-vfx-effects.js `_SIG_GOLD_TEX`='aluminium.png' + `_SIG_GILT`=0xe0b048 (one place to change the spell gold); `_sigTerrainTex` and
  three-renderer.js `_getTeslaTex` redirect 'gold.png'. NEVER load terrain/gold.png again.
- Excessive Machine pipes = Meshy organ pipe `_WPN_MODELS.organPipe` (Assets/decor/organ_pipe_white.glb). Brass version also made
  (project files gold-texture/models/). Decision card asked white (recommended) / brass / chrome.
- MODEL_LIST §10G lists the other 16 gold-sheet code pieces needing models (crown, Fetter chain, gold record, spears, deployables...).
- mondo picked "Option D, metal007": PR #867 (token 20261103-goldout-03-cors, zip 1303 + gilt.png by hand): R2 terrain/gilt.png =
  ambientCG Metal007 regraded gold 128 px; TERRAIN_SPRITES gold/gold_2/gold_3, `_SIG_GOLD_TEX`, deployables all use it.
- mondo questioned organ pipes (11-03): Excessive Machine = Durand Durand's organ in Barbarella (1968); offered a whole-machine model.
Related [[model-list-master]] [[visual-rules]]
