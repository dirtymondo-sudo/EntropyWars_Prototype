---
name: desktop-build-eval-20261123
description: 11-23 desktop app / faster-load evaluation for mondo's Mac: Safari = Tauri test, readback bug 1708023 actually FIXED, KTX2 coverage, pre-baked rooms; waiting his Safari + Firefox webgl F3s
metadata:
  type: project
  modified: 2026-11-23T20:48:35.235Z
---
Thread (owner-project id) "Get stable 60 FPS with a desktop build". mondo asked "if the game was an exe would it load faster?" and was upset no perf thread suggested it. No Chrome ever: [[no-chrome-20261123]]. Follows [[perf-city-60fps-20261115]], [[perf-city-walk-20261122]].

- Told him (20:5xZ): Tauri on Mac = WKWebView = Safari's WebKit, so a SAFARI F3 = the app's FPS. Electron = Chromium, out. CORRECTION (mondo 11-23 screenshot): Mozilla bug 1708023 is RESOLVED FIXED ~a year ago; the 11-15 'readback' cause was WRONG. His about:config dom.webgpu.allow-present-without-readback = TRUE (11-23): Firefox is NOT the bottleneck; app/Safari not recommended. Offered: pre-bake the city plan (waiting his OK). Never cite 1708023 as open again.
- His 11-22 city F3 was JS-bound (22.9 of 27.7 ms): no wrapper reaches 60 alone.
- Loads: repeat loads come from disk cache; ~30 s city load = CPU build (59K objects, decode, shaders). ASSET_MANIFEST: 4,833 files, 3.77 GB, 2,384 .opt.glb, 501 KTX2-flagged.
- Proposed: (1) his Safari F3 + Firefox `?ew_gpu=webgl` F3 same spot (remind `?ew_gpu=auto` after); (2) Tauri app ~10 MB streaming R2 if Safari clearly faster; (3) pre-baked city room (biggest win, ~a week); KTX2 for the rest is lossy = his call. NOTHING BUILT; wait his OK.
- 21:0xZ mondo furious ("stop scanning pieces that dont move"). Thread renamed "Fix city frame rate at the root". Findings: his 11:35 F3 38.9 FPS CPU 21.0; "replay: refreshes 7.00" = camera/light shared-buffer writes per distinct LOOK (~123 firsts x 35 us), NOT per still piece; still-piece checks left = matrix walk ~2.7 + bundle check ~1.8 (unmerged pieces: fans, signs, lamp wax indistinguishable at runtime). I first told him ~11 ms of still-checks (WRONG, corrected by edit). Recommended: PRE-BAKE Disaster City (stills merged per district with few looks, movers in one list) ~a week; decision card posted (bake / quick trim / plan only). Cloud browser crashes loading the full city (2x 11-23) -> no census.
- 21:3xZ plan doc https://claude.ai/artifact/4yRqixRTHJXBahSx4Nixao (Disaster City pre-bake plan: still/moving split, per-district file + fingerprint, EW_NO_BAKE, Downtown first). Waiting his card pick; nothing built, branch claude/project-thread-dden3r has no commits.
