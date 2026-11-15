---
name: zone-tiles-log-20261027
description: PR #598 (10-27): zone icon + status badge on every tile, zone cast line bypasses the fog log filter (entry.zn)
metadata:
  type: project
  modified: 2026-10-27T08:04:13.114Z
---
PR #598 merged 2026-10-27 (main 4c9b29a, token 20261027-zonetiles-02-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0803.zip).
mondo: enemy's purple 3x3 zone only had a danger icon on the centre tile; the combat log never said who cast it.
- Icons: three-renderer `_syncWeatherOverlays` draws heal cross / danger triangle on EVERY footprint tile (danger now also for tickDamage zones), plus a status chip sprite per tile (`_renderZoneBadges`, nameplate chip look). Smoke: no triangle but INV chip. Low Gravity: still no icon. Masked zones draw their real footprint.
- Log cause: fog filter dropped the cast line when the caster was out of sight (battle.js `_logFogVisible`, online.js `_gvLogShows`). Fix: `addLog(msg, vis, hp, { zone: true })` -> entry.zn passes both filters (the board draws every zone for both seats anyway). New zone-laying lines must pass `{ zone: true }`.
- Follow-up PR #602 (main 5ecdd71, token 20261027-zonetiles-04-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261027-0818.zip), mondo's answers: red triangle ONLY on damage zones (tickDamage, Gravity Crush); status-only zones show chips only. Unseen caster -> "Someone creates ...": addLog o.anon + o.caster, entry.zs/zh judged once at cast; `_logMsg` + online `_guestLogFilter` serve the Someone text.
Screens /mnt/project-files/zone-icons-log/. Notes docs/notes/ui-menus-audio.md "THE ZONE ON EVERY TILE". Related [[combat-log]] [[hud-rules]].
