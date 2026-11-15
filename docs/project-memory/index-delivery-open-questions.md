---
name: index-delivery-open-questions
description: Full delivery-workflow line (sync zip, expected CDN non-matches) and the open-questions list (moved from the index).
metadata:
  type: project
---

Moved verbatim from MEMORY.md on 2026-10-23 to keep the index under its size limit.

- Threads PR + MERGE TO MAIN, bump ?v= token, write SYNC ZIP to /mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_<UTC yyyymmdd-hhmm>.zip, one same-named folder, sha256 prefixes. Recent zips are deltas (files changed since the live CDN; index.html not in them). Verify worker should list every CDN-vs-main difference and check each is in the zip. R2 base https://cdn.entropywars.net/<file>?v=<token>. Expected non-matches: ASSET_MANIFEST.json (R2 copy is a generated full manifest, repo is a stub), react, react-dom, MeshLine, Assets/Entropy Wars_Static Logo.mp4, Assets/Sprites/terrain/scorched.png, Assets/door/DOOR_Colored_Logo_ForBlackBG.png, and his 7 R2-only fonts under Assets/fonts/*.ttf (Aida, CONTRA, Ghiya Strokes, Indira_K; not in repo, PR #387).
- Open questions: element-terrain weather calls (above); Big Kick per-kick bounce cap (PR #397); Solo/Team vision toggle (PR #396); PR #398 three look Qs; PR #400 five Qs; graves visible in fog; other old-look pop-ups; story enemy groups one of each?; decoy hover card?; 36 full-site voxel maps too?; older items needing lookup before asking: pirate cutlass, zodiac mapping, Drought lakes, Cube front-middle, lava defaults.
- PR #403 (10-22 00:10, main f55cf67, token 20261022-nexusworld-01-cors): Nexus counter is now a canvas sprite in the 3D world over the zone (depth-tested, under menus; min on-screen width; kill switch ew_text=css). Zip ENTROPY_WARS_SYNC_20261022-0010.zip (battle.js 4ebeb805, hud.js 4ce2344b, three-renderer.js 03e8f5a5). Name plates in world = separate thread.
