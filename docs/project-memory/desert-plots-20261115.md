---
name: desert-plots-20261115
description: The Desert on plots (8x8, Road / Western Town / Area 51 / Giza): plan + mock-up posted 11-15, NOT built, waits mondo's OK
metadata:
  type: project
  modified: 2026-11-15T16:36:54.087Z
---
Thread (thread in the owner project) "Build the plot-built Desert" (mondo 11-15: "start a thread to start on the desert"). Follows [[world-areas-plan-20261115]] Revision 2 and the Woods method (bake-woods.js, docs/areas/woods/layout.json).

Files: /mnt/project-files/desert-plots/ desert_plot_plan.png (the mock-up), desert-layout.json (64 plots + 96x96 square map), draw-plan.py.

PLAN posted 11-15 ~16:40 UTC, NOT BUILT (map design rule: wait for his explicit OK):
- 8x8 plots, 336 m. Quadrants: Road NW, Western Town NE, Area 51 SW, Giza SE. Disaster City over the north edge.
- Road: highway in from DC (needs a NEW door on DC's south edge), gas station (city chain), trailers, the Door (opening scene), junction, crossroads.
- Town: Boot Hill, church, windmill, mine, stables, saloon, bank, hotel, jail, Main Street, general store, corral. Buildings to be made with the Disaster City building builder in wood. First insides proposed: saloon + jail.
- Area 51: gate, fence, apron, tower, pens, Runway 33, crater, Hangar 18 (inside kept; Room 51, D.U.M.B. lift), White Rooms yard (inside kept).
- Giza: causeway, Sphinx, dig, obelisks, Menkaure, Khafre, Great Pyramid on 4 plots, tomb door (Room 444 arrives), oasis, Robbers' Tunnel (hidden, Leylines).
- Ways in to swap when built: HQ Room 51 hangar big door, HQ Room 444, new DC highway; add a hub THE DESERT (none exists today; Giza sits under the Leylines hub). Old Gate / Flight Line / Plateau rooms stay.
- Missing art (no western buildings, no real cactus, wagon, water tower in MODEL_LIST): ask for Meshy OK at build time.

**How to apply:** do not build until he says OK in that thread; then write bake-desert.js + docs/areas/desert/layout.json like the Woods.

11-15 16:38 mondo (Camelot thread, relayed by coordinator as likely applying here): "i would want the the old rooms to be redesigned too ... same level of architecture as the most complex buildings in disaster city". Plan addendum posted: Hangar 18 inside, the White Rooms and a new Great Pyramid inside get REDESIGNED at Disaster City's best-building level (not kept as-is), as a second stage after the outdoor plots. Stated to him as my reading of his Camelot words; awaits his OK with the rest.
11-15 16:39 mondo (same thread): "exterior and interior". So the hangar, tower, gate, pyramids and Sphinx OUTSIDES are redesigned at that level too, not ported block for block.

11-15 16:41 mondo: "Can we also put the circus in the desert (move it from where it is now)" + "i meant district not plot for the circus" + put the intro cutscene / main menu spot somewhere. PLAN v2 posted (desert_plot_plan.png; v1 kept as *_v1): FIVE districts. Circus = 9 plots (x1-3, y0-2) built from HQ Room 1893 `carnival` (ticket booth, big top, wheel, horses, midway + bell, lady who knows, tank, mirrors door to the Mandela Room, animals); Room 1893's door would open at the Ticket Booth. Road shrinks to 7 plots (west column + road east); highway now on column 0, the Gate at P00-04. Intro / menu spot = plot "The Door" P00-02 (scene room intro_desert ONE ROAD · ONE DOOR; map.js main menu scene is the same lone door). Still NOT built, waits his OK.

11-15 17:55 coordinator relays mondo's rule from the Camelot work (PR #1467/#1468): when the rebuilt Desert ships, RETIRE the old Desert rooms in the same change and redirect Continue saves, the map/directory, doors and match returns to the new area (he plays with Continue, makes no new profiles). This replaces "old Gate / Flight Line / Plateau rooms stay". Read how PR #1467/#1468 did it before building.
11-15 17:58 coordinator correction: do it as Disaster City did (`site_prebuilt_downtown_streets` = the new 144-plot room, old one renamed `..._oldstreets`): the new Desert TAKES OVER the old Desert's main room id so saves / Continue / map land in it with no deletion; redirect the other old Desert room ids to the new area. (The Desert has no single main room today: pick the id at build time, likely `site_prebuilt_area51_flightline`, and redirect gate + giza_plateau + carnival.)
Approved 11-15 18:33 mondo: "okay looks good" on plan v2 (five districts). BUILD STARTED.

SHIPPED 11-15 PR #1481 (?v=20261115-desert-01-cors, data.js ebc23e7f live): room `site_prebuilt_area51_desert` written by `node bake-desert.js` from docs/areas/desert/layout.json (notes: areas-complexes.md "THE DESERT ON PLOTS"). Five districts, 64 plots, 12 buildings (9 walk-in), pyramids climbable, circus moved out of HQ Room 1893. Ways: Disaster City south park gate (link downtown_desert), Room 444 bay door = Tomb Door, Robbers' Tunnel (Leylines), Hangar 18, White Rooms, tunnel platform, Mandela Room. Retired to it: area51 gate + flightline, giza_plateau, carnival (literals kept: PvP board sources / the tool reads their lines). CHECKED OFFLINE ONLY, never seen on screen. Told mondo the differences from the picture (highway on columns 1-2, circus entrance through The Door plot).
NEXT (not done): redesigned insides (Hangar 18, White Rooms, a Great Pyramid inside, more town insides); Meshy list waits his OK (cactus, covered wagon, water tower, hitching rail); his on-screen look for facings/scales.
