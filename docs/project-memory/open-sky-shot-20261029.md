---
name: open-sky-shot-20261029
description: PR #656 (10-29) zodiac/celestial sky cinematic fades the room ceiling and thins the room fog; Hell black-sky root cause was fog, not ceiling
metadata:
  type: project
  modified: 2026-10-29T01:05:42.083Z
---
10-29 mondo (playtest R10 screenshot 6 / bug 1): "maybe temporarily fade the celing out for sky and celestial events". The Pisces crane on Hell Arena went black.
Browser check: the ceiling was ALREADY faded during the shot because the eye rises above it. The room's fog (FogExp2 0x1a0604) was what hid the wheel. PR #656 does both: three-renderer.js setSkyShotOpen/_skyOpenTick fades the ceiling and thins scene fog, height fog and dome band during the crane, then restores them exactly; state.js playSkyCinematic calls it. Token 20261029-skyopen-01-cors. Zip r2-sync/ENTROPY_WARS_SYNC_20261029-0105.zip (state.js d080fbce, three-renderer.js e364495f). Proof: /mnt/project-files/sky-shot-ceiling/.
Harness gotcha: the zodiac wheel eases per FRAME, so at harness fps it stays dim in a live cinematic. Prove the look with a held camera at getSkyShot('zodiac').
Related: [[playtest-vscpu-r10-20261028]] [[sandbox-playtest-speed]]
