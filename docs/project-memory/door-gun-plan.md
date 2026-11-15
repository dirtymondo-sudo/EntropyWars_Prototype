---
name: door-gun-plan
description: DOOR_GUN_PLAN.md (the door wheel, standing doors, destination doors) — where it is, mondo's rulings, and which phases have shipped
metadata:
  type: project
---
DOOR_GUN_PLAN.md is at the repo root, with a copy in /mnt/project-files/door-gun/. It has phases 0-7 in §9, and each shipped phase is logged in §11.

mondo's rulings (2026-09-25, §8):
- The standing-door cap is 2 per PLAYER.
- ONLY the Door Agent fires doors. The wheel pool is `race === 'door agent'` only and can never be borrowed.
- Gust wind pushes allies too.
- Upright vs flat was not answered, so the default is upright standing doors (portals stay flat).

Phase 0 shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_GUN_0.zip (token 20260925-door-gun-01-cors). It contains:
- data.js: DOOR_GUN_RULES/DOOR_GUN_DOORS, the hq.gunDoors ledger, and unitSpellPoolParts().wheel. The wheel stays empty until the gunXxxDoor rows exist.
- Swing Door: `hinge: true` plus battle.js swingDoorResolve.
- Door Dash: a teleport with doorGun.
- raceDoorToTheFace was retired and mapped through SPELL_ID_RENAMED.
- Test: door-gun.test.js.

Phase 1 shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_GUN_1.zip (token 20260925-door-gun-02-cors):
- Standing doors (`kind: 'standing'`): gunGustDoor and gunArchersDoor (`kind: 'doorDeploy'`).
- battle.js adds doorGunPlace, doorGunAimResolve (two clicks for a lane door), chain step E′ and processDoorActs (end of round, after turrets).
- VFX recipes are keyed by spell id (`gunGustDoor:act`), not `raceGunDoor:*`.
- ai.js got a basic placer (doorGunAiPick).
- Test: door-gun-board.test.js (door block + chain in one vm).

Phase 2 shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_GUN_2.zip (token 20260925-door-gun-03-cors):
- THE GUST STREAM (mondo): the gust lane is a standing hazard. A walk into it stops on the first windy tile and is blown; every entry is blown (stamp per chain, `_chainRootSeq`), and there is no round-end blast unless a body is stuck in it. Only colossal weight (kaiju, giant…) stands in it (flyers and the Keyholder exemptions were removed 2026-09-25).
- Hell / Frost / Maw / Laser / Light rows + engine; chain step B′ (a body displaced onto ice slides on). Laser beams turn on prisms.
- ai.js already avoids streams and hostile lanes (EW_AI_VERSION v4.13).
- Test: door-gun-destinations.test.js.

mondo 2026-09-25: NO Keyholder / unruled exceptions. The keyholder passive keeps only its free toggle (no doorImmune, no doorHits; every door takes 3 hits). Don't add special-case immunities mondo didn't ask for.

Phase 3 shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_GUN_3.zip (token 20260925-door-gun-04-cors): hold middle click = #hqWheel (Threshold + 7 standing doors), LEFT stands a door on the floor, RIGHT turns the lane; record profile.door.hq.gunPlaced.list (data.js hqGunDoorPlace); gust/maw push the walker + kickables. Test: hq-gun.test.js. Phase 4 shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_GUN_4.zip (token 20260925-door-gun-05-cors): the strike (three-renderer.js _hqGunStrikeScan → onEncounter gesture 'door'), the carry (data.js hqGunDoorCarry → battle.js encounterCarryDoors before the seats), the opening (encounterOpening on the arrival), hits home at the commit (hqGunDoorsAfterFight), the ONE-WAY wedge (door.hq.gunPlaced.capture, refunded on leaving the room). Test: hq-gun-carry.test.js. Phase 5 (puzzles) is DEFERRED (mondo 2026-09-25: its own human-written plan later; no puzzle work at all from this plan). Door Dash in the room shipped 2026-09-25 as door-gun/ENTROPY_WARS_DOOR_DASH.zip (token 20260925-door-gun-06-cors): C or W/↑ twice on foot, three-renderer.js _hqDash/_hqTickDash, HQ_GUN_RULES.dash; battle raceDoorDash unchanged. Next is Phase 6 (AI).

**Why:** the next thread must build from the plan, not re-derive it.
**How to apply:** read DOOR_GUN_PLAN.md §9-§11 first, and append to §11 for each phase. Related: [[capture-plan]].
