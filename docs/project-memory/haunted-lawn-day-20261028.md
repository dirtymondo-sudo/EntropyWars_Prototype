---
name: haunted-lawn-day-20261028
description: PR #626 (10-28): Haunted House Arena dark board under bright day sky — lawn tint lifted + dayLook `hemi` gain; mondo's likely settings (Map Looks off, Haunted Green, fog off)
metadata:
  type: project
  modified: 2026-10-28T02:33:42.525Z
---
PR #626 merged 2026-10-28, sync zip r2-sync/ENTROPY_WARS_SYNC_20261028-0233.zip (data.js 30841aac, three-renderer.js 66f8f653), token 20261028-hauntday-01-cors.
mondo: "why is the map so dark but the sky is bright and sunny?" (Haunted House Arena, round 1 day, WebGPU).
- Cause: not the lights (normal day rig, same as Grove arena 54/255). The grounds' floorColor 0x3a4a34 / cliffColor 0x4a3e34 were night-only tints from before rooms rode the clock (10-17); the pines shade most of the cut.
- Fix: floorColor 0x76906a / cliffColor 0x76665a; HQ_WORLD_CLOCK.dayLook rows take optional `hemi` (day hemisphere gain, read in _hqClockVals → walk + fight); haunted grounds hemi 1.5.
- Board 33→48 WebGL, 37→49 WebGPU; night round 38. Proof /mnt/project-files/haunted-daylight/.
- His likely settings reproduce it: localStorage ew_scene_looks=off, ew_retro preset 'green', Scene Fog off. With fog ON + Map Looks off, his green preset fog (0x2f4d3f, fixed dark) also darkens a day board while the dome stays bright — not changed (his PR #491 rule); worth raising if he reports it with fog on.
- ALL MAPS (PR #630, zip ENTROPY_WARS_SYNC_20261028-0321): audited 22 outdoor clocked arenas round 1 day (board 50-130); only Göbekli Tepe dark (40): tell floorColor 0xecc89c + dayLook {hemi: 2.0}; dayLook `hemi` now read for day rooms too. 57 WebGL / 54 WebGPU, night 34. Table /mnt/project-files/haunted-daylight/all-maps/AUDIT.md.
Related: [[key-light-20261024]] [[map-looks-off-clean-20261024]] [[visual-rules]]
