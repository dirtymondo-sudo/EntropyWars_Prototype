---
name: gameplay-video-capture-20261103
description: How a cloud thread records 1080p gameplay video (deterministic frame stepping, llvmpipe), rig in /mnt/project-files/videos/tools/cap.js, speed ~1 s/frame
metadata:
  type: project
  modified: 2026-11-03T11:28:40.474Z
---
mondo 11-03 asked: can Claude record a match video (replay feature / camera mode) at 1920x1080, or should he use OBS?

Answer found: YES. Rig = /mnt/project-files/videos/tools/cap.js (copy to /tmp/ph after the playtest harness setup.sh;
it uses /tmp/ph/route.js). Headful Chromium on own Xvfb, Mesa llvmpipe WebGL (default ?ew_gpu=webgl), viewport 1920x1080,
Playwright page.clock paused + rAF shim; each step = 1/30 s virtual time + one drawn frame + JPEG screenshot. Drive it with
`curl localhost:4700 --data-binary '<node snippet using page,H>'` (H.freeze, H.step, H.record(dir,n,fps,hook,stop)).
Cost ~1.0-1.1 s real per frame at 1080p (4 cores) => 60 s of 30 fps video ~ 30-35 min. Frames look like the real game
(llvmpipe is full GL, just slow); playback is smooth because time is virtual. No audio (game has no SFX anyway per rules).

CPU vs CPU without devAutoSim (dev sim turns cameras + animations OFF): after battle starts, capture-only page eval
`GAME.state.controllers[1]=CTRL.AI; GAME.state.fogOfWar=false`. Nothing shipped.
Menu path: _goToVsCpu() -> click site card text (e.g. CAMELOT ARENA) -> CONFIRM (1718,995) -> party builder ALL (random)
-> SEAL YOUR FATE starts the match on ONE press now. CPU TEMPO "CINEMATIC" default = full action cams.

In-game options for mondo himself: main menu Replay (letterbox, HUD hidden, auto cam, fog off; record it with OBS) and
CAMERA mode (F8) R = MediaRecorder of the canvas (<=1920 px, 16 Mbps, WebM on Firefox) but free-fly only.
SPELL-ONLY MODE (mondo's idea, 11-03): videos/tools/spells.js = skip 50 ms steps with the draw off, record 30 fps while
body.ew-spell-shot / .acam-chrome.active, 36-frame post-roll. ~1.3 s real per kept frame. GOTCHA: index.html SHIPPED-KEYS set
ew_cinematicActionCam '0' so the Action Cam is OFF by default and no spell shots fire; call window._setCinematicActionCam(true)
in the capture page first. Delivered /mnt/project-files/videos/ENTROPY_WARS_SPELLS_1080p30.mp4 (50 s, 6 shots) +
ENTROPY_WARS_MATCH_START_1080p30.mp4 (26 s intro + round 1).
PER-UNIT SHOWCASE (mondo 11-03: eventually one video per unit, each unique spell + ultimate): videos/tools/UNIT_VIDEOS.md +
unit_stage.js / unit_show.js / unit_video.sh (same draw-off spell-only method; ultimate = the race FINISHER, gauge filled
capture-side). First: videos/units/CATGIRL_SPELLS_1080p30.mp4 (42 s, 1177 frames, ~25 min). mondo cares that threads REUSE
this rig and the spell-only frames (he was angry the old thread wasn't found).
Related [[cinematic-camera]] [[trailer]] [[progress-video]] [[sandbox-playtest-speed]]
