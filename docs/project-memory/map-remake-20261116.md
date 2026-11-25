---
name: map-remake-20261116
description: THE MAP REMAKE built 11-16 PR #1875 (zones drawn as baked height maps, districts, plot names, world surface/underground); waits mondo's look + his 4 plan answers
metadata:
  type: project
  modified: 2026-11-16T13:18:43.190Z
---
Thread (owner-project id). mondo 11-16: build the second side's plan docs/plans/map-remake/MAP_REMAKE_PLAN.md "but make the maps look kinda like the images" (map-pass thread's top-down height maps). SHIPPED PR #1875, token 20261116-mapremake-01-cors, live on R2.

- bake-map.js: each plot-built room's terrain -> Assets/ui/map/<room>.png (1 px a square: R height, G ground kind, B flags) on R2 + data.js HQ_ZONE_MAP (zone world places = tool's ZONES table, layout 3; district names; city plots). Rerun for a room whose heights change, then sync-zip --put its png.
- map.js `_zm*` THE ZONE SHEET + ground world; DOOR HQ keeps old sheet; EW_OLD_MAP=true = old sheets. Notes ui-menus-audio.md "THE MAP REMAKE". Claims row now owner.
- Proof pictures /mnt/project-files/map-remake/.
- Probe gotcha: tap `.hq-map-stage [data-mapnode=...]` (first match is the LOCATIONS list button); screenshots right after a panel rerender can catch a transient frame, use settle ~7 s.
- OPEN: M4 plot-by-plot charting + GO to a plot, M5 plot search; plan §6 four questions answered with defaults (GO to zone as today, layout 3 places, zone whole once charted, underground own sheet).
Related [[map-pass-natural-scenic-skate-20261116]] [[world-zones-plan-20261115]]
