---
name: mountains-plots-20261115
description: The Mountains zone BUILT + live PR #1492 (11-15): two plot rooms (56-plot mountains + 16-plot North Pole village), ways, retired rooms, what is not done; waits mondo's look
metadata:
  type: project
  modified: 2026-11-15T20:06:07.101Z
---
Thread (owner-project id) "Build the Mountains zone". mondo 11-15 18:17 asked for a mountain zone with 3 trails/peaks (Mt Shasta from the Woods, snowy trail to the North Pole village, trail to Mt Olympus) + ski lodge and slopes for skateboarding; 19:37 "okay that's good" on the plan ([[world-zones-plan-20261115]]).

BUILT + LIVE PR #1492 (data.js d11546bc, token 20261115-mountains-01-cors):
- `bake-mountains.js` + `docs/areas/mountains/layout.json` write `site_prebuilt_shasta_mountains` (Snowy Pass, Ski Lodge + 5 runs + half-pipe + chairlift, Mount Shasta, Mount Olympus) and `site_prebuilt_northpole_plots` (village behind the Pass Gate). Notes: docs/notes/areas-complexes.md "THE MOUNTAINS ON PLOTS".
- Ways two-way: Woods Snowline P00-00 north door (bake-woods.js) <-> Trailhead; links northpole_camelot (new village south wall x 45.5), vatican_olympus (new), downtown_mountains (new; city move.js way P08-04 N opened, free door x 105 z -247.6), heaven_olympus, lodge_olympus, shasta_lemuria, northpole_haunted. Hub `mountains`.
- Old rooms shasta_slopes, olympus_summit, northpole_village in DOOR_HQ.retired; literals kept as PvP board sources.

NOT done: never seen on screen (headless compile only); chairlift = a door pair, nothing rides it; Woods Upper Shelf has no door; no encounter tables; no Ice Queen; no Meshy; big room compiles ~23 s in node (Woods ~10 s), watch load time.

**How to apply:** changes to these rooms go through bake-mountains.js (rerun bake-woods.js / bake-disaster-city.js if their ends move). Waits mondo's look on his Mac. Related [[camelot-kingdom-plots-20261115]] [[desert-plots-20261115]].

ONE WORLD MOVE 11-17 (PR #1936, claims freed PR #1940, data.js 79f5414e live): (thread in the owner project) "Re-lay out the Mountains for One World". bake-mountains.js THE ONE WORLD MOVE writes three rooms at v13 places: `site_prebuilt_shasta_ow_lodge` (Pass+Lodge+L9), `…_ow_olympus` (L10+Olympus+L11), `…_ow_shasta`; North Pole unchanged; old `site_prebuilt_shasta_mountains` retired -> ow_shasta. Seams: L3 `ow_v_m16_m14` + L6 `ow_v_m22_m16` written only once `site_ow_l3`/`site_ow_l6` exist (rerun the bake then). Open: chairlift line passes over the Rental Hut; S.js deck stray on The Spring; interim pass/woods/hills/saddle doors wait for R2/R5. Waits mondo's look.
