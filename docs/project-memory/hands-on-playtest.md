---
name: hands-on-playtest
description: How a cloud thread can play the game by hand on WebGPU (headless Chromium + SwiftShader) and what the first full VS CPU playtest found (10-21).
metadata:
  type: reference
  modified: 2026-10-23T01:20:00.000Z
---

10-21: a thread played one full VS CPU Arena match (Mount Shasta, 4v4, 20 rounds) by clicking, on ?ew_gpu=webgpu. Report: https://claude.ai/artifact/FMcV14kczkjTPVRDNoWeFq ; screenshots /mnt/project-files/playtest/. Lost 404-447 at the time limit.

Recipe that worked (sandbox only; never say the sandbox can't do webgpu):
- Playwright from repo node_modules, executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome, headless, 1280x720, ignoreHTTPSErrors, proxy HTTPS_PROXY with bypass localhost.
- Args: --enable-unsafe-webgpu --enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader --use-angle=swiftshader --ignore-gpu-blocklist.
- Init script strips `swizzle` from GPUTexture.prototype.createView descriptors (chromium 1194 throws on it; sandbox-only).
- Route cdn.jsdelivr npm URLs to locally npm-installed packages, cdn.socket.io to socket.io-client dist, cdnjs -> 404, cdn.entropywars.net *.js/css to repo files (react/react-dom/MeshLine curled from CDN); assets pass through to live CDN.
- SwiftShader is very slow: the 20-round match took ~5h20m wall clock. Budget for it.
- Read GAME.state only to know whose turn it is; ThreeRenderer.worldToScreen(x,y,0) gives tile screen coords.

Top findings (not fixed, report only): target list CONFIRM row vs bottom bar disagree on target; letterbox bar sticks over scoreboard; execution logs "executes" but target survives; ability list reorders; result screen front tab has no score ("Player is exited."). See [[combat-log]] [[hud-rules]].

10-21 follow-up PR #398 fixed letterbox/EOR chip stuck, forecast badge follow, result fact line. SANDBOX CAVEAT: SwiftShader ~1 frame per 2.5 s, camera glides take ~30 s; camera drift reports from the sandbox are frame-rate artifacts. _ewShotRecApi.place(uid,x,y) stages units in VS-CPU.

10-22 PLAYTEST 2 (CPU tempo Training, Pyramids of Giza Arena, main 576fa41 through PR #404): lost 244-374 at round 20. Report https://claude.ai/artifact/QrjAn4KWLyR5ZvVCsX9oy4 ; screenshots /mnt/project-files/playtest-2/. Rounds 1-10 by hand, 11-20 a simple click routine (said so in the report). Top: camera inside walls (x-ray silhouettes) and inside the Sedan when targeting; dash/counter/opportunity log lines print a pre-mitigation second number (battle.js ~73945, 64622); Training shows nothing of CPU turns; wireframe Tornado/Blizzard cones; light flips dark/bright every round. Training tempo = AI imitation training (match-select.js:710); its Imitation Report overlays the debrief, Close off-screen at 720p. Nothing fixed; mondo picks.
Harness tips: menu rows are .hrlg-blade (top level no `two` class, sub rows `.two`), inline confirm .hrlg-confirm-inline; never click span.dlg-prompt. ThreeRenderer.pickAtScreen(x,y) -> {tileX,tileY,unitId} is the reliable way to find click points. Escape with nothing armed opens the pause menu (harness trap).

10-23 PLAYTEST 3 (Keys win, Training, Stonehenge Arena 4v4, WebGL): WON by Keys round 12 (55m11s game clock), 28 Inspects, CPU 0 Keys; lost every other stat (score 266-348). Party Robin Hood/Quarterback/Cosmic Wraith (race kit inspect 2) + Mothman (Cryptid Vanish), all Binoculars. Report https://claude.ai/artifact/KCM2QaSGUkdLzw28AuQZyh ; shots /mnt/project-files/playtest-keys/. Top: Shop Back blocked by invisible #hqStrip .hq-strip-l img after picking a locked vessel; float -464 vs log 500; Move click on stone = turn-ending climb; climb hang logged "stunned" (battle.js ~53152); zoom-out washes white. Nothing fixed.
Harness tips: verify the tile label (.hrlg-view-tab-count) before confirming, menus/camera animate and clicks land on the wrong blade; match MOVE blade by exact text (has-text matches CLIMB); tiles under the combat log (x>930) swallow clicks, zoom out with a WheelEvent on the canvas; log is GAME.state._fullLogEntries ({m:...}).
