---
name: foyer-double-door-20261112
description: Foyer revolving door replaced by a double swing door (pack DOOR WITH LARGE WINDOW x2), shipped PR #1228 11-12
metadata:
  type: project
---
mondo 11-12: "get rid of the revolving door, just make it a normal swing door or double door". Thread (thread in the owner project).
SHIPPED PR #1228 (he picked "Ship the double door" 11-12), token 20261112-foyerdoor-01-cors, data.js + three-renderer.js uploaded live. Was built on branch claude/project-thread-q2p6sl: data.js catalogue `leaf_lobby_glass_double` (`double: true`), three-renderer.js `pivot2`, round join opens it. Mock-ups in /mnt/project-files/foyer-door/foyer_double_door_closed.jpg + _open.jpg. Bay 5 Diplomatic still wears the revolving leaf (not asked).
Gotcha: a round-join leaf key needs `glass` (HQ_CULL_SEE) or the portal rule hides the hall + the kept leaf (black doorway). Notes: docs/notes/hq-building-rooms.md "THE DOUBLE DOOR". Related [[foyer-round-join-20261024]]
**How to apply:** If he wants another leaf, swap the `file` in the catalogue row.
