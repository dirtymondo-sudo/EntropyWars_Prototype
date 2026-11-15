---
name: r2-only-assets-dropped-20261101
description: 11-01 live audit: 7 Blender wear GLBs (R2-only, not in repo) were in zip 1323 only and got lost when newer zips superseded it
metadata:
  type: project
  modified: 2026-11-01T15:18:11.761Z
---
2026-11-01 15:17 full live audit (main c8026b8, token 20261101-tight-01-cors): all 26 game .js/.css + ASSET_MANIFEST.json matched
origin/main under a random query AND the token; 1,195 of 1,202 manifest assets matched their manifest sha under random + `?h=<sha>`.
MISSING (404 on R2): Assets/Models/charactercreation/wear/ewb_{turnout,police,general,riot,chef,gi,jersey}.glb. They are NOT in the
repo; the only copy was r2-sync/ENTROPY_WARS_SYNC_20261101-1323.zip, which later "newest supersedes all" zips (1422/1448/1450) did
not carry, so they never got uploaded. Re-zipped (sha1 matched manifest) as r2-sync/ENTROPY_WARS_SYNC_20261101-1517.zip.

**Why:** the cumulative-zip rule only diffs files index.html loads + files in origin/main; R2-only assets (Blender bakes, opt GLBs)
fall out of the next zip and vanish if mondo skips the older one.
**How to apply:** a thread that ships R2-only assets must re-check them in its own audit; any audit should also hash every
ASSET_MANIFEST entry (random query, then `?h=<sha>` only for files that exist, to avoid caching a 404). Old zips in r2-sync are the
source for re-zipping R2-only files (check sha1[:12] vs manifest). Related: [[index-delivery-open-questions]] [[r2-audit-baseline]]
