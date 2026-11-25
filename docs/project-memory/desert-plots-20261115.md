---
name: desert-plots-20261115
description: The Desert on plots: built + live (PR #1481-#1490), insides built by the second account 11-15, re-laid by One World 11-17; mondo's rulings on it
metadata:
  type: project
  modified: 2026-11-22T01:04:03.489Z
---
Thread (owner-project id) "Build the plot-built Desert" (mondo 11-15). RESOLVED 11-22. Follows [[world-areas-plan-20261115]].

STATE (checked on main 11-22):
- The Desert is plot-built: `node bake-desert.js` from docs/areas/desert/layout.json; district content in docs/areas/desert/districts/C|W|A|G.js (11-16, one thread a file). One World (11-17) re-laid it as four district rooms at their world places. Notes: docs/notes/areas-complexes.md "THE DESERT ON PLOTS" + "THE DESERT, THE DISTRICT FILES".
- THE INSIDES (Hangar 18, the White Rooms, `site_prebuilt_giza_pyramid`) are BUILT by the second account on 11-15: `bake-desert-insides.js`, with the Turning Tomb door in the King's Chamber and a look pass. Notes: same file, "THE DESERT'S INSIDES". This thread's own unmerged version was dropped (never merged).
- Before any Desert work: read docs/notes/claims.md (two accounts, one board).

SHIPPED BY THIS THREAD 11-15: PR #1481 (the Desert, five districts, 64 plots), #1484 (highway door on Disaster City's own way out), #1485 (five Meshy pieces: saguaro_cactus, prickly_pear, covered_wagon, water_tower_west, hitching_rail; R2 Assets/world/props/meshy/; tools in /mnt/project-files/desert-plots/meshy/ run.py + prep.mjs), #1488 (cacti remade without a mound), #1490 (no prickly pear).

MONDO'S RULINGS (11-15, this thread unless noted):
- "okay looks good" on plan v2: five districts (Road, Circus moved out of HQ Room 1893 as a DISTRICT, Western Town, Area 51, Giza); intro / main-menu spot = the plot "The Door".
- Camelot thread, applies here: old rooms get redesigned "same level of architecture as the most complex buildings in disaster city", "exterior and interior".
- Rebuilt area retires its old rooms and redirects Continue / map / doors (done via `DOOR_HQ.retired`).
- Meshy plants / props WITHOUT a ground mound or base (his pin on the model sheet).
- "insdie looks good. just dont use the prickly pear cactus for now": PEARS = 0 in bake-desert.js; the model + catalogue row stay. Do not plant it again without his word.
- He never answered whether the King's Chamber should hold the Turning Tomb door; the second account added it anyway (PR on 11-15).

**How to apply:** treat the Desert as finished first-pass work owned through claims.md; new Desert asks go to the district files, not a new room.
