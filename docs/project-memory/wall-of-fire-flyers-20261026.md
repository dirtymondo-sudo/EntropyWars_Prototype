---
name: wall-of-fire-flyers-20261026
description: Wall of Fire misses airborne flyers via spell flag missesFlyers + battle.js spellMissesFlyer (PR #532, 2026-10-26)
metadata:
  type: project
  modified: 2026-10-26T06:16:26.593Z
---
PR #532 merged 2026-10-26 (token 20261026-wofsky-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261026-0616.zip: ai.js f5a8578a, battle.js a2145f01, data.js 7c75cab3, hud.js 909925fc).
mondo: "wall of fire shouldnt be able to hit flyers in the sky, and it should be greyed out when targeting a flying unit".

- data.js row flag `missesFlyers: true` (Wall of Fire only). battle.js `spellMissesFlyer(spell, u)` = flag + isUnitAirborne. Terrain-cast hit skips the flyer (log "X flies above Wall of Fire."), spellTargetUsableOn says no (drum/approach lists drop it). hud.js _computeEnemyActions greys the row "Flyer in the sky", no MOVE→CAST. ai.js terrainCreate scorer + tile picker skip airborne enemies.
- Wall still paints/burns the ground under the flyer (burning-tile tick already skipped flyers).
- mondo picked "All ground terrain spells" (card, 10-26): PR #533 flagged the other 11 damaging terrainCreate rows (Flash Freeze, Fissure, Poison Swamp, Great Flood, Call of the Deep, Walk the Plank, Permafrost, Enlil's Deluge, Rampart, Walls of Camelot, Pyramid Protocol) + desc "Flyers up in the sky are above it." Token 20261026-wofsky-02-cors, zip ENTROPY_WARS_SYNC_20261026-0632.zip (data.js f7f72455). Non-damaging terrain rows (Ooze Trail, Sticky) not flagged.
- **How to apply:** to make another spell miss flyers, add `missesFlyers: true` to its row; no other code needed for terrainCreate casts.
Checked in an online friendly room via the playtest harness (screens in /mnt/project-files/wall-of-fire-flyers/). Related: [[spell-aim-rule]] [[target-column-rule]]
