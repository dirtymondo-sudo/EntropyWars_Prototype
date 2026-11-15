---
name: online-pvp-playtest-host-20261023
description: 10-23 two-thread online PvP playtest, HOST side (Camelot Arena 4v4): report link, top bugs found, harness notes.
metadata:
  type: project
  modified: 2026-10-23T05:56:39.056Z
---

10-23 mondo asked for two threads to play an online PvP match and report bugs/friction. This was the HOST thread; the two threads could not reach each other (separate containers, live servers blocked), so it ran its own local server.js and drove BOTH seats in two browsers. Guest thread's own report: [[online-pvp-playtest-guest-20261023]].
Match: friendly room, Arena, Camelot Arena 12x12, 10 rounds, main at PR #418. Host Anubis/Astronaut/Bee Queen/Clown lost 134-183 on score (kills 2-3) to Angel/Cowboy/Crystal Guardian/Cyborg.
Report (report only, nothing fixed): https://claude.ai/artifact/4xoD8YEy4so4CAoDa1z6y3 ; page, shots and raw notes in /mnt/project-files/online-pvp-playtest-host/.

Top findings:
- M1 match end on the round limit never reached the guest (no result screen 3.5+ min) until one manual window._broadcastState() on the host. Guess: online.js handoff heartbeat skips once state.winner is set.
- FOG LEAKS in the guest log: fogged Bee Queen's Swarm Signal/War Cry lines; fogged Anubis "Sandstorm forms at E12" (its own tile); shot-clock lines name fogged units. (Guest thread saw no leaks on its map.)
- MOVE->CAST forecasts under-shoot (3 of 4: 213->285, 219->229, 189->255); in-place casts matched.
- Basic Attack move+attack: blade shows usable but list is empty; map click fires with no forecast or pops a floating CONFIRM where Enter = CANCEL; unreachable enemy refused only after CONFIRM.
- Target list rows slide after opening, CONFIRM clicks switch target (3x). Self-cast Enter does nothing.
- Observation for mondo's call: stat stage ceil max(100, base) makes stage buffs no-ops on stats >100 at level 100 (Swarm Signal "ATK maxed").
- Shot clock raised to 600 s after 2 host timeouts (camera glide eats the 60 s at SwiftShader speed).

Harness: menu blade DOM rects lie while sliding; use fixed coords + wait ~8 s; ESC at root opens PAUSED menu (eats SPACE). See [[hands-on-playtest]].
