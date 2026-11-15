---
name: crowd-cap
description: NPC crowd cap + clear arrival + prompt hush (2026-10-01, PR #37): fewer people per room, one per model, nobody in view on entry
metadata:
  type: project
---
mondo (2026-10-01, angry): too many NPCs everywhere (reception had 6-7), wants about half, one NPC per model, men in black as backup employees; NPCs always stood where he entered and blocked the view; the E-to-talk prompt ruined the arrival card. Also: captured races already show up in DOOR HQ, so never pitch "party/captures live in HQ" as a new idea.

Built + merged PR #37 (main 458a4ad, token 20261001-crowd-01-cors; R2 files data.js, map.js, three-renderer.js). data.js HQ_CROWD_RULES / hqRoomCrowdCap / hqRosterHomeOf; three-renderer _hqCrowdLedger, _hqClearArrival, hush API; notes in docs/notes/hq-building-rooms.md. Story cast is never cut (mondo's). Not playtested.

**Why:** later threads must not re-add crowds or spawn people at entry doors.
**How to apply:** new NPC sources must take from the room's crowd ledger; tune counts in HQ_CROWD_RULES.
