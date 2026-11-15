---
name: blue-day-sky-20261113
description: Daytime sky rework (mondo 11-13: "too cloudy and washed out, very white; want blue sunny skies with realistic fluffy clouds"); SHIPPED PR #1250 after his OK
metadata:
  type: project
  modified: 2026-11-13T05:10:22.000Z
---
Thread (thread in the owner project) ("Fix washed-out daytime sky").

- Cause: board camera only sees the LOW sky = the dome's pale horizon colour + a soft fbm haze sheet (half the sky at clouds 0.3) + 25-40% wash to the row's pale tint. Scene Fog off, so not the fog band.
- SHIPPED PR #1250 11-13 07:40 after his "ok looks good" (token 20261113-bluesky-01-cors, three-renderer.js 75851522 live): three-renderer.js `_envDomeFS` "THE BLUE DAY" + TSL twin; deeper blue down to the horizon, cumulus on a flat layer (rd.xz / (h + 0.14)), sun-side lit, tint wash cut by day. No data rows changed; night / dusk / events / painted skies untouched. Note in docs/notes/maps-terrain-battle.md "THE BLUE DAY".
- Mock-up: /mnt/project-files/blue-day-sky/ (in_game_before_after.jpg = Giza + Shasta; sky_only_before_after.jpg = bench incl. overcast + dusk).
- Unseen: his Mac / real WebGPU, HQ garden walk, Downtown (board did not load in the capture), Bermuda looking up stays misty white (its own mist, not the dome).
- Offered: hide the star sprites + 3D moon in the day sky (they show on blue now, e.g. Shasta).
- Harness that worked: standalone WebGL page running old/new `_envDomeFS` on a quad (seconds per iteration); in game a copy of playtest_maps.js with camera tilt 97-108 (tilt > 90 looks up) and `body *{visibility:hidden} canvas{visible}`; ~3 min per board. Related [[headless-hq-proof-gotchas-20261108]] [[visual-rules]].
