---
name: hit-stop-blink-20261104
description: PR #890 (11-04) hit stop rev 2: true freeze, victim solid white + 2 blinks (FE/Pokemon), VFX3D.juiceHit written, guest gets same freeze
metadata:
  type: project
  modified: 2026-11-04T20:59:26.539Z
---
mondo 11-04 wanted Pokemon / Fire Emblem hit feedback: "flash all white a couple times", "i cant even tell if there is hit stop", P2 must get the same freeze, light spells freeze like any other spell, more juice. PR #890 merged, token 20261104-hitstop-01-cors, uploaded to R2.
- Freeze = ThreeAnim.hitstop -> setTimeWarp(0) (was 0.05; `|| 1` used to turn 0 into 1). Table in battle.js EW_JUICE: spells light/standard 90, heavy 130, ult 180; basic 60/90/115/140; crit +40, kill +80, cap 300; rapid multi-hit at 40%.
- THE HIT BLINK (three-renderer hitBlink, REAL clock): solid white + jitter for the freeze, then 2 blinks (kill 3). White = emissive pushed past 1 (no shader change, WebGL + WebGPU).
- VFX3D.juiceHit was called by battle.js but never existed until now; relayed as vfx3d-x, fog-gated, so the guest gets the freeze/blink/shake.
- Calls I made (told mondo): blink timings (on 60 / off 70), screen shake per weight, weak basic attacks get 60 ms.
- Proof: /mnt/project-files/hit-stop/hit_blink_before_after.png. Notes docs/notes/spells-vfx.md "THE HIT STOP REV 2".
- Gotcha: my first `git checkout -B ... origin/main` used a STALE origin/main ref; fetch first.
- 11-05 PR #949: the blink's x60 emissive streaked across the screen on the NODE renderer only (half-float scene into the tilt-shift DoF, unclamped). Fix = three-post.js _ngBuild `ldrIn` clamps light 0..1 before SMAA/DoF/frame + bloom input (classic chain is 8-bit already). Proof /mnt/project-files/hit-flash-streaks/. Repro tip: seed Math.random in addInitScript for identical before/after matches.
