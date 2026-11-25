---
name: relationship-web-places-audit-20261123
description: 11-23 Relationship Web gaps review (doc link) + LESSON: DOOR_TEXT.POINT_OF_ENTRY homes are stale (Mount Shasta etc.), never use them as current places
metadata:
  type: project
  modified: 2026-11-23T22:38:14.504Z
---
Thread (owner-project id). Doc: https://claude.ai/artifact/9q28F2Dr7kx6Cw85sNX5z3 (suggestions only).

LESSON (mondo angry 11-23): data.js DOOR_TEXT.POINT_OF_ENTRY (dossier "home") is STALE: still says Mount Shasta (removed; Mountains = one ski mountain), The Lodge, The Strip, Football Stadium, Downtown, Cyberpunk City. Check current rooms (DOOR_HQ.rooms, HQ_ZONE_MAP, retired) before naming a place.
- The pirate ship = THE FLYING DUTCHMAN (rooms site_prebuilt_revenge_deck/gundeck/hold; "revenge" is only the id). Board's spawns.js labels it "The Revenge" (bug); board Map lacks it (no world hub). Spaceship IS on the board map.
- mondo picked ONE NAME: BOHEMIAN GROVE for Woods district G (room id ..._ow_ritual unchanged). Done PR #2505 (live data.js 33ad8800): rename everywhere, Dutchman on the board Map at the Beach, spawns label fixed, dossier prints DOOR_TEXT.POINT_OF_ENTRY_NOW (POINT_OF_ENTRY labels kept: keys for doorSiteCrossings). Related [[relationship-web-tool-20261118]].
