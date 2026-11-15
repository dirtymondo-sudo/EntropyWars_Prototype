---
name: cdn-token-stale-cache
description: If the game loads a new ?v= token before mondo uploads the R2 files, the CDN keeps the OLD file under that token; fix = bump the token again
metadata:
  type: project
  modified: 2026-10-06T06:57:40.849Z
---
2026-10-06 (PR #131 → #132, passive levels): index.html (Render) went live with token passive-levels-01 before mondo uploaded the zip. The cdn.entropywars.net edge then kept serving the pre-upload data.js for `data.js?v=<that token>` even after the upload (any other query string got the new file). mondo saw "i dont see the upgrades in game".

**Why:** the token URL gets cached on first fetch; uploading later doesn't refresh it.
**How to apply:** when mondo reports a fix missing after an upload, compare `curl --compressed https://cdn.entropywars.net/<file>?v=<current token>` against `?v=<random>` and against main. If only the token URL is stale, bump the token again in a new PR and merge; no new zip is needed. Related: [[auto-mode-delivery-blocks]].

2026-10-18 (PR #308, Arrows tab missing): same again for hud.js/three-renderer/battle/data/map under mound-01; a checking thread must not curl the token URL before he uploads (it caches the old file too), use the random query only until he says it is up.

2026-10-19 (PR #337): a local browser check (npm start + Playwright) loads index.html with the NEW token and requests every cdn.entropywars.net script under it, which poisons that token too. For a local check, Playwright-route cdn.entropywars.net to the repo files (others with a random query), and route cdn.jsdelivr.net/npm to an npm-installed copy (jsdelivr/unpkg are blocked by the sandbox proxy). If the token was already requested, re-bump before merging.
