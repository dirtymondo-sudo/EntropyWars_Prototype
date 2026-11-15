---
name: exploration-battles-plan
description: EXPLORATION_BATTLES_PLAN.md (2026-09-30): the field is the room, followers, the hand-back, ESCAPE / TEAM ESCAPE; Phases 1-5 built (hand-back lite), only §5.1 suspend left
metadata:
  type: project
  modified: 2026-09-30T04:17:06.844Z
---
mondo (2026-09-30): the encounter grid sits with enemies on a back edge, units spawn in walls / float near walls,
drop the 8x8 limit ("move anywhere the map and my movement allow"), add ESCAPE (a hidden unit slips out, survives any
result, cannot be switched in, leads the party home after a wipe), TEAM ESCAPE at 3/4 hidden, make the victory →
explore seam seamless, and "maybe the first 3 party members follow the player".

Plan: EXPLORATION_BATTLES_PLAN.md at the repo root (PR #17, merged 2026-09-30) + copy in /mnt/project-files/battles/.
Causes read off the code (§1): `hqFieldWindow` scores windows by the WALKER's reach first (slides off walls, native on
the rim); map.js `_encounterPlaceSeats` uses `_respawnTileSafe` and every wall sheet is `passable: true`, so rock cells
(tops null) are seats → in-wall / floating bodies; the engine is already size-parametric (`bw()/bh()`, boards to 24x24),
the 8 is `HQ_FIELD_RULES.size` + square-N field code.

Order (§9): Phase 1 THE FIELD IS THE ROOM (whole lattice under 24 tiles a side, else 24x24 crop; THE STAND RULE =
seat under each body's feet; feet rule on the box lattice; cave joins true ground; editor AUDIT 8x8 → AUDIT FIELD;
ZONES_PLAN §2.3 amended per §7) → Phase 4 ESCAPE (`state.escaped` third list; eye closed = `isUnitSeenByAnyEnemy`
false; loss with escapes = no ward, escaped to the front of the party, return to the room at the entry door) →
Phase 2 THE FOLLOWERS (first shift's 3 fit members trail the lead, no collision, hidden on rides) → Phase 3 THE
HAND-BACK (`_hqSuspend`/`_hqResume` instead of `_hqLeave`/`_hqEnter`) → Phase 5 TEAM ESCAPE + THE RETREAT (neither
win nor loss: nothing cleared, no pool, no ward). Forks in §10 (cap 24 default; natives don't escape; retreat costs
nothing; followers in HQ halls too; retreat lands at the door; eye closed is enough).

**Why:** build from the plan; the next thread must not re-derive the causes or the order.
**How to apply:** read §2 (rules) and §3/§6 before touching the encounter, seats, field raster or reserves; append
each phase to §12 and to docs/notes/seamless-field-encounter.md. Related: [[zones-plan]] (§2.3 8x8 rule to amend).

PHASE 1 BUILT + MERGED 2026-09-30 (PR #21, main c562014, token 20260930-battles-01-cors; R2 zip battles/ENTROPY_WARS_BATTLES_1.zip =
data.js, map.js, three-renderer.js, editor.js; upload AFTER arenas/ENTROPY_WARS_ARENAS.zip). hqFieldFrame (whole lattice <= 24,
else crop; pad to 6), W x H everywhere, entry.field.seats = the only seat test, group seated on own cells (aim reports x/z),
AUDIT FIELD (hqPlanFieldSeats). PvP arenas verified unchanged (raster diff 0 on all 32 picks). Deviation: cells >1 level under
the median floor clamp to -1 instead of hazard. No cave rooms exist today. Next: Phase 4 ESCAPE (§6.1).

DELIVERY 2 BUILT + MERGED 2026-09-30 (PR #22, main 69adeb1, token 20260930-battles-02-cors; R2 zip battles/ENTROPY_WARS_BATTLES_2.zip = data.js, battle.js,
hud.js, map.js, three-renderer.js; upload AFTER BATTLES_1): story-fight camera frames 8 tiles (HQ_ENCOUNTER_RULES.arrival.frameTiles,
zoom 0.459 → 0.765 on the fairy clearing), ESCAPE / TEAM ESCAPE / THE RETREAT (Phases 4+5, hud.js ladder rows), THE FOLLOWERS
(Phase 2), THE HAND-BACK LITE (a win lands lead + followers on their end cells). NOT built: §5.1 suspend-instead-of-leave (the
handover moves room groups into the battle scene and disposes far props, so the walk cannot resume without a rebuild; the rebuild
stays hidden under the held frame). That is the only plan item left.
