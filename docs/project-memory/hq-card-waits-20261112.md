---
name: hq-card-waits-20261112
description: HQ loading screen now holds until the room has landed AND settled (PR #1221); how to measure a load in the cloud browser; what is still unproven on mondo's Mac
metadata:
  type: project
  modified: 2026-11-12T16:21:01.343Z
---
11-12 thread "Make loading screen wait for full load" (thread in the owner project), PR #1221, token 20261112-cardwaits-02-cors. mondo: "what is the point of the loading screen before hand if it always loads slow, it needs to wait until the game is loaded".

Causes found (three-renderer.js `_hqGateTick`): 75 s clock from entry; 60 s file stall counted from the request, so queued models were written off; card dropped when the last file landed, before the hall beside the foyer built / warmed and before the instance pass + static batch + late shaders.

Now: cap counts from last progress; stall re-arms while the pipe moves; `H.landed` then `_hqSettled` (whole-scene warm-up `_hqWarmWholeNew`, no shader building, 8 quiet frames). Console line per room: `[HQ] <room> landed in N ms and settled in M ms more (... steps)`. Ask mondo for that line if he says a load is too long or still pops in. Off live: `window.EW_HQ_NO_SETTLE = true`.

**How to measure a load here:** playtest harness with `--draw always`, inject a sampler (card state, `ThreeRenderer.hq.gate()`, `renderer.info` geometries / textures / programs, mesh count) and wrap console for `[HQ` lines. The cloud browser draws ~1 frame a second, so compare ORDER and counters, never seconds.

NOT proven: seconds the settle adds on his Mac / real WebGPU; cold cache on a slow line; terrain zones; editor viewport. Non-round stage neighbours still build after the card (only THE ROUND JOIN holds it). Proof /mnt/project-files/loading-wait/. Related [[headless-hq-proof-gotchas-20261108]] [[sandbox-playtest-speed]] [[whole-body-late-look-20261106]]
