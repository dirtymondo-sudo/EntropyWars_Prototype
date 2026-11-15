---
name: online-playtest-fixes-20261023
description: PR #438 (10-23) fixed the guest+host online PvP playtest findings: match end sync, guest shot clock, load-screen drop (server.js), guest log fog filter, guest export.
metadata:
  type: project
  modified: 2026-10-23T06:35:00.536Z
---

PR #438 merged 2026-10-23 06:33 (main 73c49e6, token 20261023-onlinefix-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261023-0634.zip: battle.js f3612918, online.js 60d819ba). **server.js changed** (pingTimeout 60 s, recovery deadline 60 s): the live matchmaker needs the new server.js.

Fixed from [[online-pvp-playtest-guest-20261023]] + [[online-pvp-playtest-host-20261023]]:
- Host heartbeat keeps broadcasting 20 s after the winner (was stopping at winner; guest never got the end / last kill). Guest finalizes draws.
- REMOTE turn branch in battle.js _continueBlitzWithUnit_impl now _startShotClock() (was _stopShotClock, guest turns never timed out).
- online.js _guestLogFilter: host judges each log line once by the guest's fog rule before sending (fogged casters, fogged tiles, other-seat lines dropped).
- lastCompletedMatch/matchHistory per-viewer (guest Export). Friendly room 20 rounds. Canon year seeded by NET.matchId. Watchdog waits during opponent drop. Clock pill hidden when the match clock stops.

Not done (not sync/fog, or design): attack targeting (other thread), ESC PAUSED menu online, "Player" callsign, restore-failed box styling, camera glide eating the clock (sandbox frame rate).

Harness: scratchpad ctl.js = two separate chromium launches + HTTP eval endpoint, jsdelivr libs from npm install in scratchpad; window._ewSquad + lobbyCreateRoom/lobbyJoinRoom auto-starts the match. SwiftShader loading blocks the main thread long enough that BOTH seats drop sockets on the loading screen in the sandbox. See [[hands-on-playtest]] [[pvp-audit-20261021]].
