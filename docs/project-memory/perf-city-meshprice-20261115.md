---
name: perf-city-meshprice-20261115
description: Disaster City 60 FPS thread, part 2 (11-15 afternoon): the price of a replayed mesh on mondo's Mac, shell cells #1444, one paint #1450, what still splits the shell, next cuts
metadata:
  type: project
  modified: 2026-11-15T15:57:38.522Z
---
Continues [[perf-city-60fps-20261115]] (same (thread in the owner project). Notes: docs/notes/rendering-loading-perf.md "THE ONE PAINT", "THE SHELL CELLS".

- THE PRICE (his Mac, Firefox WebGPU): frame ~ 12.5 ms + 4.8 µs x "bundles ... meshes" on the F3 (6,712 = 44.7 ms; 5,601 = 39.4 ms; 139-mesh lobby = 12.5 ms). 60 FPS needs under ~900 meshes in view. Pixels and JS are not the limit (ratio 1 changed nothing; CPU 20 ms).
- #1444 shell cells (96 m squares cull): 20 -> 22-25 FPS only; 23-28 of 38 squares are in view.
- #1450 THE ONE PAINT (token onepaint-01, three-renderer 8bd48514): shell pieces differing only by colour merge with per-point colour; cloud shell 5,259 -> 3,213 draws, replayed 5,594 -> 4,190. Off `EW_HQ_NO_ONE_PAINT`. Waiting his walk F3 (15:55 UTC).
- What still splits the shell: 636 distinct texture pictures (501 looks left if unified), then emissive. Half the pieces are over 5 m radius, so a far limit for small pieces buys little.
- NEXT by yield: texture array per sheet size (looks differing only by picture merge); sun shadow map held between frames with a static/moving split (shadow ~27% of replay time); far squares as one fused mesh; instance cells (353 in view) + prop chunks (282).
- Sandbox: `_ew_bRec` on a piece gives its batch record (rec.cs, rec.host, rec.mesh); world units ~73 per metre; the static batch does reach 'live' in the cloud after ~15 min. Harness scripts in the session scratchpad ph/ (vcrun.sh, looks2.js, strike2.sh).
- #1450 confirmed by his F3 16:06 UTC: 31.9 FPS at 4,247 meshes (price line exact).
- #1478 THE SHEET STACK (token sheetstack-01): same-size sheets = layers of one DataArrayTexture filled on the GPU with copyExternalImageToTexture from the sheet's own image (never decode PNG bytes yourself: Firefox/Chromium apply gAMA+cHRM, up to 9/255 off); sheet + colour + glow leave the shell look key; per-point `ewSk`; dress `_ewNodeStack`. WebGPU only. Off `EW_HQ_NO_STACK`. Cloud: shell 3,223 -> 1,713 draws, replayed 4,190 -> 2,953 (expect ~38 FPS; 1024 px sheets stack only on a real machine). Waiting his F3 + eyes on walls (18:35 UTC).
- PIXEL PROOF that works in the cloud: standalone three r186 WebGPU page on SwiftShader, render to RenderTarget + readRenderTargetPixelsAsync (scratchpad st/t.html, run.js). In-game readback hangs.
- Local server serves a red STALE page when main moved: fetch + merge main before every sandbox run ("try N lost" x12).
- NEXT: sign canvases (~400, one draw each) onto shared sheets; instance cells + prop chunks (635 in view); loose shell parts the batch refuses (terrain flag 320, multi-material 171, tangent 36); sun shadow held between frames.
