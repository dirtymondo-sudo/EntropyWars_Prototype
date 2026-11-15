---
name: round-limit-end
description: How a round-limited match ends (state.round steps to limit+1, then tickMatchClock resolves); PR #228 stopped the stray Round 21 card
metadata:
  type: project
  modified: 2026-10-16T06:25:24.488Z
---
PR #228 (2026-10-16, token 20261016-round21-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261016-0625.zip): the end-of-round chain in battle.js does `state.round += 1; tickMatchClock();`, so a 20-round match ends with state.round = 21. The chain now returns right after tickMatchClock when a winner is set (no "Round 21 — Fight!" log, ROUND 21 card, respawns or turn order). hud.js scoreboard and online.js replay meta cap the shown round at the limit outside sudden death; ui.js labels already showed TIME.
Known gap, not fixed: a non-Arena, non-sudden-death tie sets winner = 0 + _winLogged and never calls finalizeMatch (Arena never draws).
