---
name: fairy-forest-room-20261024
description: Fairy Forest rebuilt as its own room (PR #496, 10-24): every board cut from it, voxel kept, 6v6 house on 20x20, calls flagged
metadata:
  type: project
  modified: 2026-10-24T14:51:53.006Z
---
mondo 10-24: "why does fairy forest look like shit? Is it still an old voxel map? Please fix". It was: FULL SITE = old voxel 20x20; arenas = cut of the Woods clearing under the treeline.
PR #496: new room DOOR_HQ.rooms.site_prebuilt_fairy_forest_glade (70x70, woods shell, retro trees, Meshy mushrooms planted as TREES via HQ_TREE_KINDS fae_cap/fae_cap_2 + `misc:` foliage prefix, since props on terrain boards don't block; lit fae_mushroom/fae_toadstool catalogue props off the board). FULL SITE = HQ_ARENA_RULES.own (20x20 6v6; HQ_ARENA_TEAM_BY_SIZE[20]=6); 12/11/10/9 via HQ_ARENA_RULES.within. Voxel kept as "Fairy Forest · voxel". Zip r2-sync/ENTROPY_WARS_SYNC_20261024-1451. Shots /mnt/project-files/fairy-forest/.
RESTYLE (PR #497, same day): mondo said the old ARENA (Woods clearing cut, tall dark pines + mist) "looks way better"; picked "arena back + restyle full site". 12/10/9 = clearing cut again (within row removed, crystal fight back in clearing); glade = 20x20 full site only, clearing look (woods shell defaults, tall trees, dense groves, NO mushrooms/lamps). Zip 20261024-1507. He likes the dark misty tall-pine woods look, not bright fairy mushrooms.
Old calls (PR #496, mostly moot now): room not linked into the Woods; Woods crystal fight now uses new room; voxel's healing springs/crystals not on the new board.
TRAP: `bake-arenas.js --size N --apply one-site.json` wipes every other site's picksN row; merge the row by hand.

**Why:** the next thread touching Fairy Forest or arena bakes needs this.
**How to apply:** rerun `node bake-arenas.js --own prebuilt_fairy_forest` + the within sizes after editing the room. See [[new-maps-voxel-remakes]].
