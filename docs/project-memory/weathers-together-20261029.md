---
name: weathers-together-20261029
description: Weather rules: PR #655 (10-29) heal/drought/renew fixes; PR #970 (11-07) opposite weathers never share the sky (dry vs wet)
metadata:
  type: project
---
PR #655 (10-29, playtest bug 7): Drought heal cut really applies (applyHealingToUnit), Drought evaporates last in tickWeather, a cast of a weather already up RENEWS it instead of stacking.
PR #970 (11-07, elements playtest E1/E2, mondo "fix the other big bugs the elemental playtest found"; built the 10-29 card's recommended option since he never picked): WEATHER_REGISTRY `sky: 'dry'` (Drought, Sandstorm) vs `'wet'` (Thunderstorm, Hurricane, Blood Rain, Blizzard). Natural roll + dungeon floor sky skip opposites; a summonWeather cast drives the opposite off (log "driven off by"); tickWeather settles leftovers (newer stays). Two rains (Thunderstorm + Blood Rain) and Solar Flare/Tornado/Tesseract are NOT opposites. If he wants other pairs, it's one `sky` field.
Notes: docs/notes/champions-combat.md "THE WEATHERS TOGETHER". Related [[playtest-elements-20261106]].
