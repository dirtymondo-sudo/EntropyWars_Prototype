---
name: model-compression-check-20261027
description: 10-27 check of uncompressed models: live ASSET_MANIFEST still the 10-02 R3 one (431); 146 newer files 204 MB raw; 22 Meshy GLBs = 161 MB; recommendation
metadata:
  type: project
  modified: 2026-10-27T12:48:11.130Z
---
mondo asked 10-27 whether the new models need another compression dump (like R3 part 2, PR #55, 10-02: Claude baked 431 GLBs
from the CDN into Assets/opt/*.opt.glb (KTX2 + meshopt) + ASSET_MANIFEST.json `alt` map; zips renderer/r3-models/). Answer only,
no run yet; report = Claude Doc https://claude.ai/artifact/SnYiGKGRPyNoV2AS5DVCiE.

- Live manifest still made 2026-10-02 17:23, 431 entries: NOTHING added since is compressed.
- 146 loaded model files not in it = 204 MB live. 22 Meshy GLBs with 3x2048 sheets = 160.9 MB (space station/shuttle/satellite,
  3 single wings, unicorn horn, bligblog, priest, seraphim ring, 12 race looks from 10-24/25, politician). ~24 MB if baked.
- Battle card spell-library warm pulls ~43 MB of new raw files on a cold cache; space props = 25 MB of it.
- optimize-assets.js is GLB-only: ocean FBX (48), elephant/spear/UFO fbx, bats obj, Christmas.dae can't go through it.
  Spear.fbx 5.7 MB (2x2048) is the only heavy one. Wolf1.glb already ships KTX2.
- Assets/misc/wings.glb (237k tris, 8.9 MB) is no longer loaded (Occulus uses the single bat wing since PR #604).
- 10-28 GO given; thread "Compress all new 3D models" (thread in the owner project) DONE PR #636 (merged 10-28, token 20261028-models-opt-01-cors), zip r2-sync/ENTROPY_WARS_SYNC_20261028-0754.zip (133 MB: manifest + 118 Assets/opt copies), proof sheets /mnt/project-files/model-compression/. 118 of 126 GLBs (365->127 MB) baked to Assets/opt/ (KTX2+meshopt), manifest merged into the REPO's ASSET_MANIFEST.json (was an empty stub). SKIPPED on purpose: 170 per-character `_biped_Animation_*_withSkin.glb` clip exports (1.36 GB) - only loaded if the anim library fails (no def has noAnimLib; voidweaver spider's own clips are the exception and are baked).
- (old) 10-28 HOLD: mondo is uploading more models (first: Assets/Sprites/Races/Homosapien/Male/engineer/Meshy_AI_fankenstein_Running.glb); do ONE pass over everything when he says go, re-enumerating first.
- Recommended: bake the 22 big GLBs now (one ~25 MB zip: Assets/opt/ copies + manifest merged with live 431 entries + ?v= bump PR,
  since index.html preloads the manifest with the token). Skip the small packs.
- Enumeration scripts were in the thread sandbox only (catalogues via load-data.js + literal URLs + _ANIMALS/traps/ocean lists).
Related [[renderer-plan]] [[ipad-boot-title-20261027]] [[r2-audit-baseline]].
