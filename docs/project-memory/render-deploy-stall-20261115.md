---
name: render-deploy-stall-20261115
description: 2026-11-15 the Render game page stopped deploying after PR #1401; cause not in the repo, threads cannot see Render
metadata:
  type: project
  modified: 2026-11-15T10:16:56.346Z
---

On 2026-11-15 entropywars-prototype.onrender.com stayed on the PR #1401 build (index.html `last-modified: 08:22:02 GMT`, token `20261115-lamp01-cors`) while main moved on through #1414. Checked from the cloud (thread "Get the game page serving the latest build"):
- R2 matched origin/main (`node sync-zip.js --dry-run`), so only the Render page was stale.
- No repo cause: server.js/package.json untouched since #1401, `npm install` + `node server.js` boot clean on main, no new dependency release, status.render.com all green, 15 quiet minutes after a merge still no deploy (so not just deploys cancelling each other).
- Threads have NO view into Render (no API key, no deploy hook, no GitHub deployment statuses). The reason lives in the Render dashboard's Events/deploy log.

CAUSE (mondo's dashboard screenshot): the #1402 auto-deploy hung in "Building" for 1h 33m (normal 1m 30s) and every later deploy queued behind it. FIX: mondo clicked Cancel on the hung row; the newest queued deploy then ran by itself and the page matched main at 10:08 UTC.

**How to apply:** quick stale check = `curl -sI https://entropywars-prototype.onrender.com/?r=$RANDOM | grep last-modified` (file time = build time) plus the page's `?v=` token vs origin/main. If stale with a healthy repo, another token-bump PR does nothing; ask mondo for the Render deploy log line or a Render API key / deploy hook as an environment secret. Still never tell him "redeploy on Render" as a routine step.
