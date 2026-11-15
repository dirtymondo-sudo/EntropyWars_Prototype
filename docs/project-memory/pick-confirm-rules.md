---
name: pick-confirm-rules
description: Escape-spell landing pick, combo partner/CONFIRM, named tile targets, no attacking tiles (PR #413, 2026-10-22)
metadata:
  type: project
  modified: 2026-10-22T20:03:59.104Z
---
PR #413 (2026-10-22, mondo's second playtest "Unsure What to Press" 2-5), token 20261022-pickconfirm-01-cors.
- ESCAPE spells (kind 'escape', 13 rows, teleportDistance): player picks the landing tile (lit free tiles, click/CONFIRM); battle.js escapeLandingTiles/escapeLandingFor. CPU keeps escapeLandingTile auto safest landing (thread's call, flagged).
- COMBOS: partner pick pre-picks neediest target; list has 'With <partner>' row (CHANGE) + ✓ + CONFIRM; hud.js _hrlgComboTargetList/_hrlgComboPrePick.
- NO ATTACKING TILES (mondo): basic attack can't smash raised terrain; Dig (Build) only. Tree chop by attack KEPT (1 AP). smashTerrainAt/_tileIsSmashable still defined, uncalled.
- pickTargetName(x,y,z) names non-unit picks ("Grassland A7", Tree, seed, deployed obj); enemy decoy named as the unit it copies.
- Attack list after press refund re-picks; potions/banes pre-pick first usable target (_hrlgItemTargetList).
Related: [[hud-rules]]
