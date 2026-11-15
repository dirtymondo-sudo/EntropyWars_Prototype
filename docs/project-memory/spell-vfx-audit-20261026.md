---
name: spell-vfx-audit-20261026
description: The 10-26 spell VISUAL audit (VFX, camera, props; report only): capture harness in /mnt/project-files/spell-vfx-audit/, 9 batches, gotchas
metadata:
  type: project
  modified: 2026-10-26T18:05:38.218Z
---
mondo 10-26: "Can we do a similar audit for how the spells look? VFX, camera, and props. Flag any that look wrong or bad
or not what you'd expect or that could be made better." REPORT ONLY. Lead thread (Audit how every spell looks) built the
harness, runs V9; coordinator asked to start V1-V8 threads. Combined list -> findings/COMBINED.md (lead writes it).

Where: /mnt/project-files/spell-vfx-audit/ — BRIEF.md, harness/ (setup.sh, sv-run.js runner, sv-lib.js, sa-lib.js copy,
sv-report.py sheets+report, sv-ctl.js/start.sh/e.sh interactive), batches/ (V1..V9 + INDEX.md, 871 castable spells by
element theme), findings/<batch>.md (S1/S2/S3, ends DONE), sheets/<batch>/ (contact sheet per spell).

How it works: spell-audit board (SA.boot) with art + 3D models ON, ?ew_gpu=webgl2 (WebGPURenderer on WebGL2) on headful
Chromium + llvmpipe (own Xvfb), draw on demand (playtest-harness page.js), Playwright ctx.clock installed; real HUD path
ABILITIES -> row -> aim still -> pause clock -> CONFIRM; fallback GAME.doSpell (tile-placed spells: dash/teleport).
Frames every ~400 ms then ~1 s, ~1 min per spell.

Gotchas (cost time): rAF throttled to 20 fps FAKE time via setTimeout(50) init script = 3x faster stepping (game caps
step at 0.05 s so motion keeps speed); clock.pauseAt(now) throws "fast-forward to the past" -> pause at now+300;
Escape with nothing armed opens the pause menu (back out with HUD CANCEL, SV.unpause clicks RESUME); spell rows carry an
icon prefix (match class brows/catc); self-cast CONFIRM is "CONFIRM — SELF" (not .hrlg-confirm-inline); camera via
getCameraSnapshot(), unit screen boxes via ThreeRenderer.unitScreenBox(id). Never `pkill -f` a pattern that also
appears in your own shell command (it kills the tool shell, exit 144).

DONE 10-26 18:40: findings/COMBINED.md = 864 spells, 55 S1 / 322 S2 / 291 S3 / 12 not judged (incl. V4 pass 2), top "fix first"
shared causes (turn chevron in action cam = 14 S1, full-screen washes, WebGPU-only pillar noise, box-dog summons,
Stadium Show page error, chef T-pose, board-click casts with no cinematic, self-cam zoom 7.13). Open call for mondo:
element-tinted damage numbers vs "damage red" (mondo 20:44: he'll set colours in UI Maker himself, drop it).

FIX PASS (mondo 20:44 "Make whatever other fixes you need", reuse in-game cars/buildings, tell him missing models):
lead PR #564 (chevron hidden in cinematics, Stadium Show error, Car Toss real car, Skyscraper Toss Italian building w/
landMs-timed bursts, noOrb poison+unholy); zip ENTROPY_WARS_SYNC_20261026-2103. Rest: fix/BRIEF.md batches FX-CAM, FX-WASH,
FX-1..FX-5 (coordinator asked for 7 threads). Missing models list: fix/MISSING_MODELS.md (summons, 9 sprite races, chef?).
Related [[spell-audit-harness-20261026]] [[visual-rules]] [[camera-rules]] [[sandbox-playtest-speed]].
