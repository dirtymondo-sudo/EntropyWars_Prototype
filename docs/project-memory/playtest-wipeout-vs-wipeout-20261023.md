---
name: playtest-wipeout-vs-wipeout-20261023
description: 10-23 two-seat online Arena matchup, both teams playing for wipeout; A won on score 415-344 at R20, no wipeout; 3 engine bugs (guest no result, mid-move death soft-lock, watchdog skipped R9)
metadata:
  type: project
  modified: 2026-10-23T13:19:55.191Z
---
Report-only matchup thread (mondo's "every win-condition combination" ask), 2026-10-23. Page: https://claude.ai/artifact/XQDTsPU9aH5MJS2ucoui6H ; files /mnt/project-files/matchup-wipeout-wipeout/. No code changed.

Teams: A (host) Dragon/Superhero/Mech/Ki Fighter; B (guest) Dinosaur/Antihero/Dreameater/Nordic. Mars Arena 10x10.
Result: A won on Arena composite at R20, 415-344 (kills 9-8 = 225 vs 200; Cube dmg 668 = 46 vs 0; Nexus 24 rounds each = 144 each). No wipeout possible: respawns 2/3/5 rounds; units only drop out on 3rd death (R16+), then the leader guards.

Bugs found (unfixed, for a fix thread):
- BLOCKER guest never gets the result on the Arena R20 timer (host VICTORY, guest winner null >3 min); one host _broadcastState() fixed it. battle.js _resolveArenaTimerExpiry ~75700.
- BLOCKER a unit killed mid-move by an opportunity attack freezes the match (active id stays on the dead unit; watchdog aiOwned gate battle.js ~53689 skips; endUnitIfDone never called after finishMoveAt ~38724).
- BLOCKER the watchdog skipped all of R9 during a slow round end (forces advance while _roundAdvanceInProgress).
- Jurassic Jaw "regains 1 AP" on a kill but the turn still ends (refund likely before spendAllAP).
- Guest AoE preview lists fogged enemies with HP and draws tags on their tiles (Eternal Slumber).
- Wrong-target CONFIRM: Tail Whip self-target, out-of-range default row, stale CONFIRM chip, target rows slide after appearing.
- Tier rule looks reversed on Aurora Ray (T1 finisher) vs Eternal Slumber (T4 applies stun): flagged to mondo.
Balance: type matchups + press refunds decide fights; Entropy Strike size varies hugely by unit (Hoard ~2492, Spirit Bomb 2133 vs B's ~955); stuns on units that already acted are wasted at round end; Nexus points equal for both sides.
Related: [[playtest-wipeout-20261023]] [[win-condition-balance]] [[online-pvp-playtest-guest-20261023]]
