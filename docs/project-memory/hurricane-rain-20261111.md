---
name: hurricane-rain-20261111
description: 11-11 PR #1108 Hurricane rain is map-wide (rainWide) so it puts out fire everywhere; Wet map-wide is the thread's pick
metadata:
  type: project
  modified: 2026-11-11T08:09:34.348Z
---
mondo 11-11: "During a hurricane, there is rain on the screen, but I saw some grass tiles on fire ... Rain should always put out fire."
Thread (thread in the owner project), PR #1108 (main d98ea2d, token 20261111-hurricanerain-01-cors, uploaded state/three-renderer/ui).

Cause: Hurricane is homing, w.tiles = the eye square only, so `soaks` reached one square. Fix: state.js WEATHER_REGISTRY.hurricane
`rainWide: true` + `weatherRainIsWide(w)` (global OR rainWide), read by weatherRainsOnTile + the round-start soak. NOT `global`
(eye, fling, -10 DEF, flooded trail stay local). Rain drawn map-wide. Notes: champions-combat.md "THE HURRICANE'S RAIN".

OPEN for mondo: grounded units now get Wet each round map-wide under a Hurricane (Thunderstorm's rule); that was the thread's
pick, he can ask for fire-only.
Facts: no Summon Hurricane spell exists (natural roll only; spawnWeather not exported), so proof forced fire + storm with
GAME.igniteTile + window.weatherTerrainOnForm in a real VS CPU match. Weather turn soak runs at ROUND START (state.js ~1289).
Proof /mnt/project-files/hurricane-rain-20261111/. Related [[weathers-together-20261029]] [[playtest-elements-20261106]].
