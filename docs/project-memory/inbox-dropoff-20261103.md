---
name: inbox-dropoff-20261103
description: mondo's drop-off inbox (11-03): /mnt/project-files/inbox/ for hand uploads; threads sort it with docs/notes/inbox.md
metadata:
  type: project
  modified: 2026-11-03T14:42:39.410Z
---
mondo 11-03 (thread in the owner project): wants one drop-off folder for anything he'd upload by hand; threads move each file where it belongs.

- THE INBOX = `/mnt/project-files/inbox/` (he uploads from the Claude app's Project files). Holds README.txt + `_sorted-log.md` (never sorted).
- Also sweep: loose top-level files in /mnt/project-files/ no thread wrote (his app uploads may land at the top, e.g. eagle.glb 10-27).
- Too big for the app: R2 bucket `dirtymondo` prefix `inbox/` (private). NEVER an inbox prefix in `ewmusicsfx` (public CDN). Listing via api.cloudflare.com objects?prefix=inbox/ works with the proxy token.
- Chat attachments (uploads/hearth/<id>) belong to their message, not the sweep.
- Routine (full table in repo docs/notes/inbox.md, pointer = CLAUDE.md RULE #0): identify (file/sha256/GLB rig check) -> unsure = leave + ask once -> route (code in place in repo; race models Assets/Sprites/<race>/; props Assets/<kind folder>/; creator pieces charactercreation/; packs asset-packs/<pack>/ + licence check; art -> dirtymondo bucket; refs -> topic folder; exports -> bake tools; audio = ask) -> models: list-models.js + MODEL_LIST.md, manifest entry if replacing in place -> `node sync-zip.js --put/--upload` -> verify sha256 -> THEN rm inbox copy -> log line -> reply with file -> home + sha[:8].
- Coordinator: "sort the inbox" = fresh thread; brief says read docs/notes/inbox.md + attach R2 approval (thread in the owner project).
- Shared folder cap 10 GB (8.1 GB on 11-03): ask before a pack pushes it past ~9 GB.
Related: [[r2-direct-upload-setup-20261103]] [[sync-zip-script]] [[itch-asset-packs-20261103]]
