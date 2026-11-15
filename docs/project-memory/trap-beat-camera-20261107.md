---
name: trap-beat-camera-20261107
description: PR #978 (11-07) camera holds on every sprung trap (Deathtrap etc.) until its look plays + 1.2 s; look waits for the walker to land
metadata:
  type: project
  modified: 2026-11-07T03:27:58.828Z
---
mondo 11-07: "Deathtrap went off but the camera panned to my next unit's turn before the spell animation finished". PR #978 merged, battle.js live a466c40c, token 20261107-trapbeat-01-cors.
- Cause: sprung traps are not casts, never armed THE IMPACT HOLD ([[impact-hold-camera-20261105]]); `_springTrap` also played doors/numbers at the START of the walk.
- Fix: battle.js `_trapBeatDelayMs` + `_holdTrapBeat` (THE TRAP'S BEAT): look + numbers wait for walk/shove; `_cineHoldImpactFor(delay+look+1200)`. Covers all placeTrap types, step-on bombs, deployed mines/snares, overwatch. Trap laid under an enemy fires on the shot's beat 2 (`opts.inShot`, no extra hold).
- Found, NOT fixed: after a turn-ending cast, the parked TPS close-up over a 2-level pit (Deathtrap's sunk 3x3) sinks under the board -> white frame for ~1 s before the settle. Holding longer made it worse.
- Repro harness: frame-stepped Playwright clock (page.clock.pauseAt/runFor), real R2 assets curl-cached; sheets in /mnt/project-files/deathtrap-camera/. Notes docs/notes/spells-vfx.md "THE TRAP'S BEAT".
