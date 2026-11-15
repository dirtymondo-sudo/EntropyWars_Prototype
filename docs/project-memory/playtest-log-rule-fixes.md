---
name: playtest-log-rule-fixes
description: PR #397 (10-21) fixes from the Mount Shasta hands-on playtest: finisher forecast/wording, hit-line wording, per-throw bounce cap, respawn past round limit, boot watchdog
metadata:
  type: project
  modified: 2026-10-21T12:32:51.619Z
---
PR #397 merged 2026-10-21 (main 1984fdf, token 20261021-playlog-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261021-1232.zip: battle.js 4e562330, map.js 3099faac).
- Finisher list number = real hit math (forecastHitOnUnit), KILL only on low roll; log "unleashes X on Y", "executes" only on a kill.
- applyDamageToUnit lines via battle.js `_dmgLogLine` (label / verb-phrase / "...for" leads); lead name tagged by side (mirror colours).
- COLLISION_CONFIG.maxBounces now per THROW (shared `opts._throw` in resolveForcedSlide).
- Defeat line/banner: "No respawn before the round limit" (map.js `_respawnPastLimit`).
- Boot watchdog waits LS_MAX_WAIT_MS + 45 s; [BOOT] kick retries while camera/banner busy.
- Not reproduced: "absorbs 38 HP" twice. Browser recipe: WebGL swiftshader + jsdelivr routed to npm packages works; drv.js HTTP control pattern. Related: [[hands-on-playtest]] [[forced-movement]] [[combat-text-colours]].
