---
name: cliff-line-falls-20261030
description: PR #704 (10-30) field drapes stop at sheer edges (zone rim/liquid/skins) + liquid waterfalls on the true ground; runoff-below not verified on his map
metadata:
  type: project
  modified: 2026-10-30T08:48:10.028Z
---

mondo 2026-10-30 (VS CPU, his editor room 10, grass): "block up with hard sheer edge, liquid doesnt flow over the edge, and it draws the nexus perimeter on the cliff side". PR #704 merged, token 20261030-cliffline-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261030-0847 (data.js, three-renderer.js).

- Cause: true-ground drapes read the room's ground under each vertex (cap 1 tile), so beside a sheer face (hard BLOCK UP, dig wall) the zone rim and spell-pool sheet bent down the face. The field never drew waterfalls.
- Fix: three-renderer.js `_drapeCliffCut` (rise/run > 1.2 holds the inner neighbour's height; used by _buildDrapeGeo, _liqBlendGeo, _fieldPatchGeo), `_fieldFallBuild` (falling sheet where a liquid cell borders a lower same-liquid cell across a sheer break). Kill: EW_NO_CLIFF_CUT, EW_NO_FIELD_FALLS.
- Follow-up PR #706 (same day, mondo: falls looked like a plain pink sprite, wrong colour): falls now use the SAME material as the sheet above (_liqBlendMat, body key), normals up, UVs scrolled down by _fieldFallTick. Token cliffline-02, zip ENTROPY_WARS_SYNC_20261030-0859 (editor.js from #705 + three-renderer.js).
- Not verified on screen (no playtest). Falls draw ONLY where map.js getLiquidFlowAt already puts runoff below (springs). If he says the water still doesn't spill, check whether the engine flow reaches the cliff-foot cells on his map (rock/OUT cells or a non-spring liquid would block it); that would be a rules question for him.
- Notes: docs/notes/maps-terrain-battle.md "THE CLIFF LINE + THE FALLS". Related [[custom-battle-maps-20261030]] [[liquid-sheets-20261026]].
