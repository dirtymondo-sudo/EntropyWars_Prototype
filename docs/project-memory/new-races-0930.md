---
name: new-races-0930
description: 2026-09-30 race batch (PR #12): 7 races wired from mondo's Meshy uploads, kaiju remodel, finisher caption-swap mechanism, 14 races still not on R2
metadata:
  type: project
  modified: 2026-09-30T01:19:13.905Z
---
PR #12 merged 2026-09-30 (token 20260930-races-01-cors; R2 files data.js, sprites.js, battle.js, ui.js, party-builder.js; zip
races/ENTROPY_WARS_NEW_RACES.zip WRITTEN + delivered 2026-09-30 after PR #14; covers #12-#14).
Wave 1: astronaut, krampus, rabbit, luchador, firefighter, goblin, hippie (m+f). Kaiju uses Races/kaiju/male/Meshy_AI_kaiju_Running.glb.
All 21 wired: 7 in PR #12 + 14 in PR #13 (roster 124). R2 file names are Meshy's ORIGINAL prompts (clown = evil_clown,
sherrif = western_sherrif, ringmaster lives in folder ringleader); the full map is in docs/notes/champions-combat.md.
Probe likely names (curl -r 0-0 on r2.dev) before asking mondo; ask ONCE for only the misses.
New races have NO own spells (RACE_ABILITIES []); pool = families; finishers reuse a built sig + `lines` caption swaps
(battle.js _finLine). Full checklist: docs/notes/champions-combat.md "THE 2026-09-30 BATCH".
Load check recipe in the sandbox: jsdelivr/cdnjs/socket.io are blocked, so route them in Playwright to a local three@0.128.0
npm install and the local server's socket.io; launch Chromium with executablePath /opt/pw-browsers/chromium and proxy HTTPS_PROXY.
