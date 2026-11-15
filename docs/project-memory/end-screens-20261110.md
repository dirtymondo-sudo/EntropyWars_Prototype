---
name: end-screens-20261110
description: PvP demo item 6 (PR #1099, 11-11): result/forfeit/rematch screens + F4 pause camera + F5 result name; what shipped, hooks, leftovers
metadata:
  type: project
---
PR #1099 merged 2026-11-11 00:2xZ, token 20261111-endscreens-02-cors, 5 files uploaded. Thread (thread in the owner project). Proof /mnt/project-files/end-screens-20261110/ (2 Chromium seats; 1280x720, 1280x540, 800x500).
- Result text on dark windows; debrief sheets dark backing under theme plate (his glass theme = transparent panel, rows unreadable on bright boards).
- state._forfeit {by, how: quit|disconnect|timer} via battle.js _forfeitMark; cleared with _winCondition. NEVER key match data on state.startTime (per seat).
- Rematch status line: battle.js _vicRematchNote(text, tone); online.js _ewSetRematchBtn(text, disabled, note, tone).
- hud.js BTN_MENUS 'results': #mainMenuBtn = BACK, #nextMatchBtn = CONFIRM.
- F5: unnamed profile ("Player") reads "You". F4: #ewCineHint key line, red EXIT.
- Also fixed: PvP playtest F8 stale room chip; offline result after online showed "Reconnecting…" + no Back to Party Builder; stale "Unable to rejoin" window.
- Harness tip: /tmp/ph has no viewport command by default; add `case '/viewport': page.setViewportSize` to ph.js for 540 px proof. Reloading a page on a closed room leaves a rejoin token (banner at boot).
LEFTOVERS told to mondo (unanswered): a forfeit win still grants Perfect Victory / Untouchable / Deathless + MVP "0 K 0 DMG" (rule question, not changed); result under 900 px wide still cramped (MVP plate touches fact line). Not viewed in WebGPU/Firefox.
Notes: docs/notes/ui-menus-audio.md "THE END SCREENS". Related [[pvp-playtest-20261109]] [[ui-maker]].
