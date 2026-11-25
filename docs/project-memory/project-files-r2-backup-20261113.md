---
name: project-files-r2-backup-20261113
description: Old project files live on R2 dirtymondo:project-files/<same path> (11-13 source archives; 11-22 all model files, videos, zips, replay logs dated 11-17 or older, incl. meshy/); how to fetch one back
metadata:
  type: reference
  modified: 2026-11-13T17:22:21.366Z
---
mondo 11-13 expected the big /mnt/project-files folders to be in R2; they were not (only 80 MB of 7.65 GB matched by md5).
Thread "Clear project storage space" ((owner-project id)) copied, md5 = etag verified:
- `mhpacks/*`, `asset-packs/elbolilloduro/**`, `asset-packs/other/**`, `videos/**` -> private bucket `dirtymondo`, key `project-files/<same relative path>` (154 files, 5.35 GB).
- `mhpacks/dress03_cc-by.zip` (486 MB) is over the REST PUT limit (413 above ~300 MB): stored as `.part00` + `.part01`; `cat` them to rebuild (md5 0d4e56ff48bd433ce43c9eca04523c93).
- Fetch back: GET https://api.cloudflare.com/client/v4/accounts/b2608d464c04fdeec48ba91f04b8aeb7/r2/buckets/dirtymondo/objects/<url-encoded key> (proxy adds auth).
- 11-13 NOT copied: `uploads/hearth` (chat attachments); still local.
- Local copies REMOVED 11-13 17:35Z on his card pick (142 archives + mp4s, 5.34 GB; list /mnt/project-files/storage-cleanup/removed-20261113.md). Threads needing a pack download it from R2 to /tmp. videos/tools rig kept locally.
- SECOND PASS 11-22 (mondo said yes; (thread in the owner project)): every .glb/.fbx/.obj/.blend/.mp4/.zip/.jsonl dated 11-17 or older, in ALL folders except uploads/inbox/r2-sync (1,321 files, 4.08 GB, incl. `meshy/`, `meshy-wishlist/`, `new-races*/`, `new-chars/`, district folders, trailer), copied md5-verified and removed locally. Pictures, notes, scripts stayed. Storage 9.8 -> 5.66 GB. A thread that needs a GLB from those folders: GET it from R2 (same relative path) to /tmp. List: /mnt/project-files/storage-cleanup/removed-20261122.md.
Related: [[r2-direct-upload-setup-20261103]] [[inbox-dropoff-20261103]]
