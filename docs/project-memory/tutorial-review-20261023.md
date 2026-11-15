---
name: tutorial-review-20261023
description: 10-23 tutorial review + the plan mondo approved and its delivery (PR #431 fixes, PR #441 new core tapes); what the tutorial is now.
metadata:
  type: project
  modified: 2026-10-23T06:47:29.570Z
---

10-23 mondo asked how to make a tutorial (Q4 of the synthesis threads); report https://claude.ai/artifact/D2f39zkciSXETotan9x8Tw. He then said "do the tutorial plan fixes"; built in two PRs.

PR #431 (zip ENTROPY_WARS_SYNC_20261023-0526): ABILITIES gate fix (Tapes 2 + 7 completable), eleven stale lines, no random weather/celestial in a lesson unless `weather: true` (window._tutWeatherOff), coach top-left click-through.

PR #441 (merge bcf1b5d, token 20261023-tutapes-01-cors, zip ENTROPY_WARS_SYNC_20261023-0646): CORE = 8 tapes, optional renumbered 9-13.
- Tape 4 HEIGHT, JUMP, CLIMB, FLIGHT on the Holo Sim (Grey climbs the pylon, Angel lands + takes off, shoot down).
- Tapes 5-8 REAL MATCHES (`cpuAi: true`): Stonehenge Arena 10x10, 4v4, fog + weather on, the CPU's own AI. Nexus and Respawns, Win by Cube, Win by Keys, Win by Wipeout. Open mid-match via enter effects (down/carry/nexus/cube); win -> finish step, loss -> RESTART TAPE.
- Calls I made (flag if mondo objects): round limit 40 in arena tapes; Cube starts 20%; Keys tape fifth key hidden next to a marked tile; wipeout downed pair on 3-round timers; Three Ways Out (Tape 3) kept as the overview.
- CLAUDE.md rule: a PR changing a TUTORIAL_MECHANICS rule function re-reads that tape.
Notes: docs/notes/story-party-progression.md "THE TUTORIAL PLAN". Optional new tapes from the plan (weather, push/pull, building, party builder tour, combo, battle screen rewrite) NOT built. See [[hands-on-playtest]] [[playtest-cube]] [[playtest-wipeout-20261023]].
