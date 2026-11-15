---
name: pvp-playtest-20261109
description: 11-09 online PvP playtest (2 Chromium seats) findings; F1-F5/F9 FIXED PR #1072, B2-B4 FIXED PR #1075, B1 + F6-F8/F10 status see body
metadata:
  type: project
---

Report: /mnt/project-files/pvp-playtest-20261109/PVP_PLAYTEST_REPORT.md. Thread (thread in the owner project).

FIXED 11-09 PR #1072 (thread in the owner project), proven host+guest, shots /mnt/project-files/pvp-fixes-20261109/):
F1 host timer ticks (hud.js SbClock); F2 stale forecast badge (timeout + one-click cast); F3 own-only log lines skip tile check;
F4 delayed mark line = zone line ("Someone marks"); F5 battle.js _clickSeat() on 185 refusal lines; F9 rematch keeps room rounds.

FIXED 11-09 PR #1075 (thread in the owner project), proven 2 browsers, shots /mnt/project-files/pvp-disconnect-20261109/):
B4 forfeit win -> result screen both seats; B3 SEAT HOLD = index.html Blob worker POSTs /api/seat-hold every 15 s in online battles + from
first script on reload, server holds dropped seat 75 s/ping, cap 8 min; B2 RESULT HOLD = post-match drop keeps room 5 min, rematch re-arms,
Main Menu emits leave-room. Sandbox: reload boot blocks main thread minutes (GLB parse), host also dropped during board build once.

STILL OPEN: B1 guest To the Moon landing pick (a later PR may have fixed: token 'guestThrow'); F6 watchdog; F7 toast over pill;
F8 stale online pill ("Pnull"); F10 roster overlaps unit panel.

Harness proof tips: friendly room via ph (RANDOM TEAM > DEPLOY > FRIENDLY), JUMP shows only after 2 moves (movesThisTurn).
Related [[online-fog]].
