---
name: one-world-south-routes-20261117
description: One World 4.2 done (PR #2003): R6/R8/R9 + Desert Highway legs DH1-4 as route rooms; old Highway room retired; Desert STAND uses seams lists
metadata:
  type: project
  modified: 2026-11-17T15:13:30.777Z
---
BUILD_PLAN 4.2 shipped 2026-11-17 in PR #2003 ((thread in the owner project)).

New route rooms:
- site_ow_r6 Valley Road (Clearing to city west, link valley_city)
- site_ow_r8 Ranch Road
- site_ow_r9 Badlands Highway (city south link downtown_desert to the Circus; gas station + motel)
- site_ow_dh1..dh4 Desert Highway legs

Retired: site_prebuilt_area51_highway now points to site_ow_r9.

bake-desert.js STAND: each district has `seams: [{side, at:[wx,wy], room, open, ...}]`.

Probe lesson: in playtest_city.js, teleport `face` is a compass heading (0 = north -z, 90 = east, 180 = south, 270 = west).

Follow-up PR #2007:
- Route spawns now stand beside the road (walkers paused on the spawn in the lane; mondo's rule is that NPCs never block paths).
- R8's crop circle is now built from the Estate's corn_row.
- Still open: the Exit 3 overpass was dropped.

See [[world-zones-plan-20261115]].
