---
name: meshy-audit-pack-first-20261104
description: 2026-11-04 Meshy audit (PR #888): pack-first rule, _HQ_PACK_WEAR, MODEL_LIST §12/§13 + R2 snapshot, open swap candidates awaiting mondo
metadata:
  type: project
  modified: 2026-11-04T19:48:10.142Z
---
mondo 11-04 (angry): "Why ... did you have me making meshy models for the stadium lights and other stuff when we already have non meshy versions??? You are supposed to document every single model and try to not use meshy models."

PR #888 (merged 11-04):
- PACK-FIRST RULE (top of MODEL_LIST.md): before ANY Meshy prompt/to-do, check MODEL_LIST §6/§7, §13 (every R2 model file, from R2_MODEL_FILES.json; `node list-models.js --r2` re-lists the bucket, rerun after uploads) and project files asset-packs/contents-lists/object_names_in_every_downloaded_pack.json. To-do rows name the packs checked.
- three-renderer.js `_HQ_PACK_WEAR` (name -> Assets/misc/ebd_*.glb): `_hqDecorWear` falls back to it after _HQ_DECOR_GLB. Wired: steel_table, metal_shelving, wall_shelf, toilet_paper, broom, washer, dryer.
- §10A has an AUTO "in the game now" column; only "code" rows still need a model.
- Floodlight: NO pack has one; the Beach v4 sheet hid that its "decor" items were Meshy.

mondo 11-04 21:16 "keep the lava lamp with moving wax, and switch those on" -> PR #891: bare_bulb, concrete_pillar, roller_shutter, chalkboard (text kept), turnstile (no longer turns) wear pack pieces. Lava lamps stay Meshy + drawn wax. Still open (his call): D37 parasol, D53 BurgerPiz counter, D54 Molten bunks, Meshy-in-game items with pack twins (MODEL_LIST §12). GLBs in project files asset-packs/meshy-swap/glb/.

**Why:** mondo wants human-made models first and a complete list.
**How to apply:** any model/Meshy brief says "pack-first: check MODEL_LIST §6/§7/§13 + the pack names json". Related: [[meshy-api-pieces]] [[character-models-plan-doc]]
