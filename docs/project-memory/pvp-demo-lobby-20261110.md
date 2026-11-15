---
name: pvp-demo-lobby-20261110
description: PvP demo item 2 (lobby / The Room / READY / Quick Play windows / invite link) SHIPPED PR #1103 11-11; how it works + leftovers
metadata:
  type: project
  modified: 2026-11-11T01:29:57.635Z
---

PvP-only demo list item 2. Thread (thread in the owner project), branch claude/project-thread-h0bcuy.
mondo picked "Build as drawn" 11-11 00:42Z. SHIPPED PR #1103 (merged, R2 uploaded, token 20261111-lobbyroom-01-cors).
- Plan doc https://claude.ai/artifact/TeHn4KtCBeL7vjDwzhk7hk; mock-ups /mnt/project-files/demo-lobby-20261110/mockups/; proof (31 two-seat shots, 720+540) ../proof/.

How it works:
- Server referee (server.js): room._lobbyLive, seats{host,guest} {name,team,faces}, ready{host,guest}; events lobby-seat/lobby-ready in, lobby-state/lobby-go/lobby-rules-changed/lobby-left/lobby-closed/lobby-cancelled out. room-full only after the countdown (friendly 3 s both READY, Quick Play 5 s Match Found). Rule change (lobbyRulesKey) clears both READY. Guest leaving pre-start keeps the room + code; host leaving closes it. Player count counts sockets with query ewc=1; 'player-count' carries searching + per-queue counts.
- Client (online.js "THE ROOM" module, _lr*): #lobbyHosting is The Room for host, guest and Quick Play found; #lobbyFriendlyMain = HOST A ROOM + JOIN A ROOM (5 code boxes); #lobbyQuickPlay two windows; ?join=CODE -> window._ewInvite -> squad desk "JOINING ROOM X" -> DEPLOY joins (map.js _goToInviteJoin). Hub name plate + online line (_lrPaintNamePlate/_lrPaintOnline). BTN_MENUS lobby confirm = .lr-go green. _lrSeatBlock blocks READY for a squad smaller than the room or outside Demo roster.
- _lrDropStaleSession: create/join/search ends a leftover reload session (NET.online from a mid-match reload) else host never saw guest.

Choices mondo may question: Quick Play LEAVE sends the leaver to idle Quick Play and the other seat back to searching (plan said both search). Selects borderless (theme input skin). Old Join page merged into Friendly (in plan).
Leftovers (not threaded): squad desk action column can sit over BACK for one paint after a window resize then open (keep-acts timing race, not from this PR); Clash Match Found shows a 5-squad seat's 5 faces though Clash is 4v4.

**Why:** demo goal = a stranger's first five minutes ([[hud-rules]] [[ui-maker]]).
**How to apply:** lobby follow-ups go to this thread; keep the lobby-* events + seats when touching online join flow.
