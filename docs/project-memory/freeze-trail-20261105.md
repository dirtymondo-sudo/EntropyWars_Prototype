---
name: freeze-trail-20261105
description: 11-05 battle freeze (Firefox WebGPU, whole page, no JS error) not reproduced; PR #933 freeze trail in index.html ?ewdiag=1 PREVIOUS SESSION
metadata:
  type: project
  modified: 2026-11-05T12:33:11.053Z
---

11-05 mondo: "Game froze" in a Hell Arena battle (Firefox M1, ?ew_gpu=webgpu, whole page locked, no JS error, he doesn't remember the last click). Thread "Fix game freeze in battle" (thread in the owner project).

Not reproduced in the sandbox Chromium (WebGL + WebGPU, his 4 assigned looks injected via localStorage ew_assigned_looks from his export /mnt/project-files/uploads/hearth/07bcc105-..., tile quick menu, Demon Hellmouth, 9 rounds). The console lines in his log were fixed by other threads (#927 fonts, #929 ORB portraits = CSS backgrounds on old R2 paths, #930 atlas.png).

PR #933 (index.html only): THE FREEZE TRAIL saves the last 40 clicks/keys, 20 warnings, battle state and longest frame stalls to localStorage ew_freeze_trail every second; reload with ?ewdiag=1 -> PREVIOUS SESSION section. Waiting for mondo to paste it after the next freeze. Coordinator lead (12:32): the WebGL x-ray twin of EWCreator_eyes throws every frame on morph update (another thread fixing; WebGPU doesn't throw).

Harness tip: /tmp/ph/ph.js can get /profstart + /profstop CDP CPU-profile endpoints added locally (not in the shared copy).
