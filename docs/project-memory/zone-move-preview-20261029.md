---
name: zone-move-preview-20261029
description: PR #675 (10-29): zone statuses moved from per-tile chips to the move-preview ghost pill (battle.js predictZoneStatusesAt)
metadata:
  type: project
  modified: 2026-10-29T21:05:09.761Z
---
PR #675 merged 2026-10-29 (main 5c991dc, token 20261029-zonemove-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261029-2104.zip).
mondo: "for zone spells that show a status effect badge, instead i want it to show the status effect during the preview of moving to that tile, the same way ... fall damage shows the red damage number".
- Per-tile status chips from [[zone-tiles-log-20261027]] are REMOVED. The heal cross and danger triangle stay.
- battle.js `predictZoneStatusesAt(unit,x,y)` follows the existing rules: enemy debuff zone gives statusEffects (none from a gravity field), enemy heal zone gives enemyStatusEffects, own debuff zone gives allyStatusEffects. Hard immunities are left out. It goes into `_moveGhostBadges` as badges.st, and three-renderer `_makeGhostBadgeSprite` draws the chips in the ghost pill.
- Proof: /mnt/project-files/zone-move-preview/. The enemy zone in the screenshot was pushed into state by harness eval (no unit on the random team had a zone spell). A real cast was not shot.
**How to apply:** a new zone status rule must be mirrored in predictZoneStatusesAt.
