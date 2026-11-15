---
name: props-move-camera-20261115
description: 11-15 "props move with the camera" (HQ + city): held objects in a replayed bundle missed the shared camera buffer; fix PR #1418 rpShared; how to reproduce a camera-stale bug in the cloud browser
metadata:
  type: project
---
mondo 11-15 10:48 UTC: "trees and other props are moving when i move my camera ... its in door hq too". Thread (thread in the owner project).
- Cause: #1409 THE COPIES REST held instanced batches in the quiet replay (three-renderer.js `rpReplay`). The camera lives in SHARED uniform buffers, written when the first object reading them is refreshed in a render; instanced shaders read their own set, so nobody wrote it: instanced props drawn with a camera up to 20 frames old.
- Fix PR #1418 (token heldcam-01): `rpShared`, first held object per shared bind group gets `updateSharedForRender` each render. Off `window.EW_BUN_HELD_NO_SHARED`. Notes: docs/notes/rendering-loading-perf.md "THE HELD KEEP THE CAMERA".
- RULE for perf threads: anything that skips an object's refresh in a replayed bundle must still refresh the shared buffers it reads. Related [[perf-city-propchunks-20261114]].
- HOW TO REPRODUCE a camera-stale bug (cost me an hour): `ThreeRenderer.hq.dev.teleport` `face` is DEGREES (0.5 = nothing). Harness /mnt/project-files/playtest-harness, `--gpu webgpu`, `_hqEnter({from:'play', room:'central_egress'})`. Rest 30 drawn frames, then in ONE eval teleport + `__ph.draw.mode='demand'; __ph.draw.frames=2` (= one drawn frame), page.screenshot, draw 30 more, screenshot, diff. Letting undrawn ticks pass hides it. Proof /mnt/project-files/props-move-camera-20261115/.
- Not checked in the cloud: Disaster City (same code path). Seen once, not chased: the main hall's ceiling cube missing on the first frame after a turn back (1 of 4 runs).
