---
name: painted-skies
description: mondo's hand-painted 80s/90s anime watercolor skies — spec, R2 files, and how the game draws them (PR #481, 2026-10-24)
metadata:
  type: project
  modified: 2026-10-24T11:33:51.435Z
---
2026-10-24 mondo asked what files to paint; he paints them himself (never generate/download art). Spec doc: https://claude.ai/artifact/DZ2xiJhEmPTYb6YiRwzddH
- Files on R2 `Assets/skies/<key>_day|_night|_silhouette(.webp|_low.webp)`: day/night 4096x1024 RGB (360 strip, horizon bottom row, zenith top), silhouette 4096x512 RGBA (45 deg tall), _low = half size.
- BUILT PR #481 (token 20261024-paintedskies-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261024-1133.zip): woods + disaster_city wired. Adding a zone = one row in data.js HQ_PAINTED_SKIES (sites) after he uploads files; or a room's `shell.sky.paint`.
- Gotchas found: Chromium bitmaps flip at decode, so sheets use flipY=false and shader reads v=1-altitude; WebGPU twin needs the 3 sampler uniforms to start as 3 DIFFERENT textures (else all draw the day sheet).
- Calls left in place (flagged to mondo): floating far bodies/lone doors/landmarks still hang in front of the painting; map tint does not wash the painting.
- SKY SETS (PR #484, 10-24, "try these skies instead"): his 1024x512 PNG sets on R2 Assets/skies/1024x512/<Name> Sky/ (Bumpy, Cloudy, Wispy, Fading; Blue/Night/Sunset 01-04). Row `set` in HQ_PAINTED_SKIES: woods=wispy, disaster_city=fading (my call, flagged); Bumpy+Cloudy on no row. Old paintings kept (drop `set`). Sunset = clock dawn/dusk (walk only); sets wrap 2x round; old silhouettes kept; room N = 1..4 in building order. Zip r2-sync/ENTROPY_WARS_SYNC_20261024-1242.zip.
- FAR FOG (PR #485, 10-24, mondo: silhouettes must fog like far objects): silhouette takes scene FogExp2 at the room's far edge (half field + outer ground), follows Scene Fog/Fog Density; ~99% fog at factory density. Zip ENTROPY_WARS_SYNC_20261024-1313.zip.
- Proof shots: /mnt/project-files/painted-skies/ (sets/ for PR #484/#485). Notes: docs/notes/maps-terrain-battle.md "THE PAINTED SKIES".
- SWITCHED OFF (PR #529, 2026-10-25, mondo: "not really a fan ... cant really tell when its day or night ... no water color stuff"): data.js HQ_PAINTED_SKIES.on = false; every zone draws the old shader day/night sky. Rows/sets/code/R2 files kept; on: true brings them back. Don't re-enable unless he asks. Proof /mnt/project-files/painted-skies/off/. Zip ENTROPY_WARS_SYNC_20261025-2106.zip.
Related: [[visual-rules]] [[zones-plan]].
