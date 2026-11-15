---
name: custom-battle-maps-20261030
description: Editor BATTLE MAP tab (PR #698, 10-30) turns an editor room into a VS CPU battle map with painted spawns, Nexus, Cubes
metadata:
  type: project
  modified: 2026-10-30T03:12:44.499Z
---

PR #698 (2026-10-30): editor palette BATTLE MAP tab marks a room as a custom battle map (room row `battle` field: S 9-12, sq 3.5/1.75, board x/z, p1/p2 squares, nexus, cube1/cube2). Shows as `custom_<roomId>` tagged CUSTOM in VS CPU map lists (arena/tdm/simul); ▶ PLAYTEST IN VS CPU opens match select on it. Painted zones used verbatim; existing arena rules only.

**Why:** mondo wanted to playtest maps he builds in the editor.
**How to apply:** VS CPU only (map lives in his IndexedDB, excluded from online PvP pool) — if he asks for online/shared custom maps, that's new work (publish via world file). Notes: docs/notes/editor.md "THE CUSTOM BATTLE MAPS". Related [[editor-plan]].

10-30 follow-up (PR #699): "button does nothing" was the CDN holding OLD data.js/map.js/match-select.js under the battlemap-01 token (likely the page loaded after Render deployed index.html but before his R2 upload). Fixed by re-bumping the token to battlemap-02. The button now shows a toast when data.js is stale.

10-30 walls (PR #702): units walked through his editor walls because walls sit on square EDGES and the terrain raster reads square centres. Custom maps now raster with `solid` (data.js hqFieldSolidCell / hqFieldSolidEdges): edge walls → hidden engine edgeWalls, a wall's square / tall prop → rock, low prop → cover. Game arenas + exploration fields NOT changed (his own rooms' exploration fights still let units through walls — offered, not asked).

10-30 floors (PR #707, token 20261030-floors-01-cors, zip ENTROPY_WARS_SYNC_20261030-0914): BATTLE MAP tab spawn/Nexus/Cube tools have a Floor setting (ground / floor above); squares store [bx,by,1]. Spawns, nexus capture (tileZ), Cube z, zone drapes follow it. Spawn split cause: autoGenerateSpawnZones ran before columns were built (stale z). Goo/timed paints go on the body's own floor (lower floor = settled pool, no spread); liquid runoff + paint radius stop at edgeWalls on every map. Only ONE floor over the ground per square (raster reads one deck) — 3+ floors would be new raster work.
