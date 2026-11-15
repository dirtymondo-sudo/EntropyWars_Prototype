---
name: party-dash-in
description: 2026-09-30 exploration followers REMOVED; party leaps in behind the lead at fight start (PR #26, token 20260930-dashin-01-cors)
metadata:
  type: project
  modified: 2026-09-30T09:26:45.211Z
---
mondo (2026-09-30): the party followers in exploration were "too distracting"; the party should jump or dash in as part of the explore-to-battle transition.

Done + merged PR #26 (main 6dabebd, token 20260930-dashin-01-cors). R2 files: battle.js, data.js, map.js, three-renderer.js (zip ENTROPY_WARS_DASH_IN.zip). All follower code is gone (HQ_FOLLOW_RULES, hqPartyFollowers, _hqSpawnFollowers, hq.setFollowers, strike `party` feet). battle.js `_encPartyDashIn` (ENC_DASH_IN backTiles 3, ms 620, stepMs 150): the jump tween carries each non-lead P1 unit from behind the lead onto its seat before the first render. Kill-switch window.EW_ENC_NO_DASH_IN. After a win, only the lead is placed back in the room.

**Why:** do not bring the followers back. EXPLORATION_BATTLES_PLAN §4 is superseded.
**How to apply:** entrance tweaks go in ENC_DASH_IN. Related: [[exploration-battles-plan]].
