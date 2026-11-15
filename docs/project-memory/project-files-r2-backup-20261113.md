---
name: project-files-r2-backup-20261113
description: 11-13 source archives (mhpacks, asset-pack archives, videos) copied to R2 dirtymondo:project-files/<same path>; how to fetch one back; local removal waits on mondo's card
metadata:
  type: reference
  modified: 2026-11-13T17:22:21.366Z
---
mondo 11-13 expected the big /mnt/project-files folders to be in R2; they were not (only 80 MB of 7.65 GB matched by md5).
Thread "Clear project storage space" (thread in the owner project) copied, md5 = etag verified:
- `mhpacks/*`, `asset-packs/elbolilloduro/**`, `asset-packs/other/**`, `videos/**` -> private bucket `dirtymondo`, key `project-files/<same relative path>` (154 files, 5.35 GB).
- `mhpacks/dress03_cc-by.zip` (486 MB) is over the REST PUT limit (413 above ~300 MB): stored as `.part00` + `.part01`; `cat` them to rebuild (md5 0d4e56ff48bd433ce43c9eca04523c93).
- Fetch back: GET https://api.cloudflare.com/client/v4/accounts/b2608d464c04fdeec48ba91f04b8aeb7/r2/buckets/dirtymondo/objects/<url-encoded key> (proxy adds auth).
- NOT copied: `meshy/` (remake threads read it), `uploads/hearth` (chat attachments).
- Local copies REMOVED 11-13 17:35Z on his card pick (142 archives + mp4s, 5.34 GB; list /mnt/project-files/storage-cleanup/removed-20261113.md). Threads needing a pack download it from R2 to /tmp. videos/tools rig kept locally.
Related: [[r2-direct-upload-setup-20261103]] [[inbox-dropoff-20261103]]
