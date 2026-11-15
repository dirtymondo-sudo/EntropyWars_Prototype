---
name: sync-zip-script
description: Sync zips are built with `node sync-zip.js` (PR #778, 11-01); files always inside one same-named folder, never zip -j
metadata:
  type: feedback
  modified: 2026-11-01T23:12:32.981Z
---

Build every cumulative sync zip with `node sync-zip.js` from the repo root (`--dry-run` to only compare). It fetches origin/main, compares each root-level cdn.entropywars.net ?v= file to live R2 (random query), and zips differing files from origin/main under `ENTROPY_WARS_SYNC_<stamp>/` inside `/mnt/project-files/r2-sync/ENTROPY_WARS_SYNC_<stamp>.zip`.

**Why:** CLAUDE.md RULE #1 used to say "flat (`zip -j`)", so ENTROPY_WARS_SYNC_20261101-2232.zip held three-renderer.js loose and mondo's Mac unzipped it renamed (he complained 10-13 and again 11-01). Fixed in PR #778; replacement zip 20261101-2312.

**How to apply:** briefs that ask for a sync zip should say "run node sync-zip.js". Never zip -j. Related: [[zip-from-fresh-main]]
