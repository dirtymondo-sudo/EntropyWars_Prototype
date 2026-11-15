---
name: sandbox-playtest-speed
description: The shared cloud playtest harness (/mnt/project-files/playtest-harness, built 10-24 on mondo's yes) and why it runs the game ~20x faster than the old SwiftShader setup
metadata:
  type: project
  modified: 2026-10-24T10:34:47.457Z
---

USE IT for every hands-on playtest or click-path check: `bash /mnt/project-files/playtest-harness/setup.sh` then `/tmp/ph/ph start [--seats 2]`; README.md there lists the commands (ph text/sel/ctile/menu/state/wait/shot/export/finish). It lives in project files, NOT the repo or game (mondo bans test work + dev shortcuts; it only clicks, reads state, screenshots). Built 10-24 by thread "Speed up Claude playtesting" after mondo said "yes let's do that" to the proposals doc https://claude.ai/artifact/5fuXUAEMFhpUYZqsWs5naZ .

Proof run (10-24, VS CPU Arena 4v4 by hand): menus to battle ~1 min, 3 rounds ~9 min, CPU turns seconds (old setup: 10-15 min per round, 20-round matches 5-7 h). Two-seat friendly room also checked. Outputs in proof/.

Why: three-camera.js caps the per-frame step at 0.05 s and mixers at 0.1 s, so below ~20 fps every camera glide/animation runs slower than real time and turns wait. Measured fps (1280x720, 4 cores): SwiftShader default 0.7; game low settings 1.7; llvmpipe (headful Chromium on Xvfb, --use-angle=gl) + low 3.1; llvmpipe + 3D draws skipped between screenshots 19. The harness = llvmpipe + draw on demand (wraps ThreeRenderer.hq.dev.renderer().render, still updates matrices; screenshots draw 3 real frames). SwiftShader WebGPU is ~2x slower than WebGL: --gpu webgpu only for WebGPU checks.

Data it keeps per run (/tmp/ph/out/<name>/): ledger.jsonl (inputs with on-screen forecast, log lines, rounds, errors, watchdog lines), forecast-vs-damage checks on each CONFIRM/board commit, summary.md, Export Last Match JSON (`ph export`), final match record per seat, server replays (written every 25 actions / match end).

HARNESS BUG FIXED 10-24 (PR #488 thread): page.js wrap() and P.busy checked `window.ThreeRenderer` (a top-level const, never on window), so draw on demand never engaged. The shared copy now uses `typeof ThreeRenderer`; verified wrapped + drawing on demand in a 2-seat ranked match. Optional extra speed: a style `body *{filter:none!important;backdrop-filter:none!important}` (changes screenshots). [[online-pvp-playtest-20261024]]

Related: [[sandbox-webgpu]] [[hands-on-playtest]] [[matchups-20261023]]
