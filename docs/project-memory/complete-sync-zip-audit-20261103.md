---
name: complete-sync-zip-audit-20261103
description: 11-03 mondo wants ONE zip with everything R2 lacks; how the full live audit was done (code + manifest + code-named assets + assets from other zips) and what it found
metadata:
  type: project
  modified: 2026-11-03T09:31:18.013Z
---
mondo 11-03: "i need a zip that just has everything, none of this 'if you havent uploaded zip n upload that one first'".
Delivered r2-sync/ENTROPY_WARS_SYNC_20261103-0930.zip (main 18bda43, 114 files, 45 MB): 11 stale code files + ASSET_MANIFEST,
71 Assets/decor (PR #839), 28 Assets/misc (27 ebd_* PR #837 + Castles_and_Forts PR #844), 3 cowboy-hat wear GLBs + 2 hat PNGs.
Per-file list beside it (_files.txt).

How (sync-zip.js only covers root code files, so assets fall out): fetch live with random query and hash
(1) every ASSET_MANIFEST entry (sha1[:12]), (2) every asset in the day's r2-sync zips, (3) repo charactercreation/ (= R2
Assets/Models/charactercreation/) + Assets/, (4) every literal `Assets/...ext` string in index.html + the R2 scripts. ~2,300 paths,
1.3 GB, ~1 min with 16 parallel curls. Assets/decor + Assets/misc + Assets/props are NOT in the repo: the only copies are in zips;
decor is in the manifest, misc/props are not.

Known leftovers (not bugs to zip): Status/jammed.png + drowning.png never existed (emoji icon used); 15 MPFB bodies/looks have a
stale manifest sha but live = repo; Meshy base meshes, wear.json, looks.json, hair_styles.json, ASSET_PACKS_CATALOGUE.json are
bake-tool inputs, not on R2. Related: [[r2-only-assets-dropped-20261101]] [[sync-zip-script]]

Repeat runs 11-03 (0937 → 1311): scripts in the session scratchpad are gone with the session; the method is above. Zip-name
COLLISIONS happen (two threads write the same minute, one overwrites the other's assets): pull lost R2-only files from the
thread's staging (e.g. asset-packs/coded-out-round4/, r2-sync-staging/) or ask that thread. NEVER tell mondo to redeploy on
Render (he can't; the ?v= bump on main is enough, coordinator 11-03).
