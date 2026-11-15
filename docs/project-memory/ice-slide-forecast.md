---
name: ice-slide-forecast
description: Move previews + move-then-cast/attack finders measure from where an ice slide stops (battle.js predictWalkLanding, PR #320, 2026-10-18)
metadata:
  type: project
  modified: 2026-10-18T13:54:52.716Z
---
PR #320 merged 2026-10-18 (token 20261018-iceslide-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261018-1354.zip).
mondo: "the spell preview/move forecast should account for sliding on ice ... the arrow or preview should communicate that i will slide".
- battle.js `predictWalkLanding(unit,x,y,z,{path,takeoff})` = the tile a doMove really ends on (shares `_unitSlidesOnIce` + `_iceSlideSteps` with `_resolveIceSlide`). Approach tiles keep x/y = walk tile, add `land`; hud.js `_mtLand` / `_mtCastTile`.
- Previews: blue walk arrow, then ice-blue (0x00d0ff, UI Maker kind 'slide') arrow + tiles, ghost on the landing. Shove simulate adds the ice glide.
- **How to apply:** any new move-then-act finder or castFrom must use the landing, not the walk tile. AI (ai.js) not changed.
- Browser-checked on Training Room ice: finder skipped a slide-out tile, picked a slide-into-range tile, cast landed. Not yet seen by mondo.

- PR #409 (10-22, token 20261022-icecube-01-cors, zip ENTROPY_WARS_SYNC_20261022-0710, battle.js c32911f0): mondo "ice can make me slide into the cube". `_iceSlideSteps` now also stops before thin walls (wallBlocksStep) and any tile canOccupy refuses (Cube, turret, decoy, shut door, blocking object), same as _slideStepInfo. _slideStepInfo's airborne branch treats the Cube tile as a wall. Browser-proved (screenshot /mnt/project-files/ice-cube/). PR #410 (10-22, token 20261022-icecube-02-cors, zip SYNC_20261022-0727): Cube tile now refused by skyThrow ring/gate/forecast, teleport reach/lit/gate/forecast, dash gate/forecast, grapple self-reel, rallyPullPlan, walking summons/zombies, summon/turret/deployObject/prism placement. Audit: walks/jumps/climbs/pushes/leap+slam/charge/escape/door twins/respawn already used canOccupy/unitCanTraverse/doorTileFree. Any NEW landing gate must add isTowerTile.
