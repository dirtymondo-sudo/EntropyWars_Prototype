---
name: meshy-retexture-20261103
description: Meshy Retexture API tried on mondo's cowboy hat 11-03; how to retexture a creator piece without changing its mesh
metadata:
  type: project
  modified: 2026-11-03T08:43:16.307Z
---
2026-11-03 (thread in the owner project): mondo asked if Meshy can texture an uploaded model; tried on his
cowboy hat (charactercreation/wear/ewb_cowboyhat.glb, 1364 verts / 2020 tris, bone Head, no sway chains).
- API: POST https://api.meshy.ai/openapi/v1/retexture, model_url as data:application/octet-stream;base64 GLB, text_style_prompt,
  enable_original_uv true, ai_model meshy-6 (+ remove_lighting true) or latest (meshy-7). 10 credits each, ~4 min. Proxy injects the key.
- Meshy's OWN output GLB changes the mesh (1360 verts / 2018 tris, rescaled to a unit box): never use it. Use only its base_color
  texture (2048, laid out on the original UVs) and swap it into the original GLB's image; every vertex attribute + index stays identical.
- Results in /mnt/project-files/meshy/retexture/cowboyhat/ (A tan meshy-6, B dark brown + concho meshy-6, C tan meshy-7, ORIGINAL kept,
  game-ready ewb_cowboyhat_<k>.glb). NOT in the game; waiting on his pick. bake-clothes.py SOLIDS still points at his own textures.
Related [[meshy-api-pieces]] [[race-looks-cowboy-20261101]]
- ROUND 2 (mondo: round 1 too clean, wants realistic/weathered/worn like the Meshy cowboy's own hat): image_style_url = a render of the
  Meshy cowboy's hat (cut from the gunslinger GLB) matched it best (D meshy-6, G meshy-7). Text-prompt "weathered" tries came out
  cleaner or blotchy (E orange blotches). Sheet cowboyhat_retexture_round2_weathered.png. Still waiting on his pick.
- SHIPPED 11-03 PR #842: mondo picked F + H -> creator picks ewb_cowboyhat_worn / ewb_cowboyhat_worntan (bake-clothes.py SOLIDS, Meshy
  textures on R2 wear/cowboyhat/textures/Cowboy-Hat_meshy_worn_*.png) + THE BAND TINT (band = own primitive, wearTint['<id>:band'],
  sprites.js EW_WEAR_BANDS, creator "Band" block). Zip ENTROPY_WARS_SYNC_20261103-0914 (GLBs + PNGs added by hand). bpy==5.2.3 pip +
  /tmp/mpfb2 clone runs bake-clothes in ~7 s.
