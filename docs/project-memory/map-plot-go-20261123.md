---
name: map-plot-go-20261123
description: Map fast travel fix PR #2490 (11-23): plot GO in the same zone, clicks through names/doors, reasons on card; unchecked on his Mac
metadata:
  type: project
  modified: 2026-11-23T18:30:23.111Z
---
mondo 11-23 ((thread in the owner project)): "clicking on a square to travel... no go option shows up... completely random". He guessed right: same-zone plots had no GO, because a plot zone is ONE room and GO was only offered for another room. The second cause was names and door marks drawn over plots, which swallowed the click.

Shipped PR #2490 (token 20261123-plotgo-02-cors; map.js, three-renderer.js, styles-base.css uploaded). GO lands ON the plot through `ThreeRenderer.hq.goSpot(x,z,rad)` (nearest standable spot). Another room = `_hqGoRoom(room, at, onReady)` then goSpot. `_zmNodeAt` resolves the plot under the pointer. A plot that can't be travelled to gets a red reason on its card (`_zmWhyNot`). Notes: ui-menus-audio.md "THE PLOT GO".

Built on top of the ONE MAP thread's rework (world sheet zooms to plots, PR ~#2487), same day.
Unchecked: Disaster City (proof was the Desert), his Mac.
