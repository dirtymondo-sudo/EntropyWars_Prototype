---
name: full-block-ledges-20261110
description: Build/dig full-square fix (PR #1077) + THE FULL LEDGES rule terrain.levelM (PR #1080); who raises which map's ledges and the recipe
metadata:
  type: project
---

mondo 2026-11-10: "Build only builds half a tile up now, and there are some maps where it looks like there are raised tiles but they are only half a tile up." After the Giza pilot shot: "looks good, go ahead and fix all of the maps that need it". Thread (thread in the owner project).

**Shipped:** PR #1077 three-renderer.js `_fieldGround` `G.elev` = one whole square (was halved on 3.5 m squares since 10-28; flyers keep 1.75 m `G.airElev`; switch `window.EW_HALF_BLOCK`). PR #1080 data.js `hqFieldLevelRules`: a room with `terrain.levelM: 3.5` counts one level per 3.5 m (tierMin stays 1.2; level 1 = 1.2-4.7 m, 2 = 4.7-8.2, 3 = 8.2+). Giza switched (ledges 3.5 m, picks re-cut, same squares/levels).

**Recipe per room** (docs/notes/maps-terrain-battle.md "THE FULL LEDGES"): add levelM: 3.5; visible ledges, cover-block walls, stair h0/h1, rail y, ghost walls under props to 3.5 / 7 / 10.5 m for level 1 / 2 / 3; bridge over walked ground 7 m; lift props with explicit y; compare board (tools/board.js) and room lattice (tools/reach.js, DATA_FILE=main copy) before/after; re-cut picks ONLY when cmp.js (DATA_BEFORE=<old data.js>) shows changed cells, a re-bake can move the window: `node bake-arenas.js <site> --json f` + `--size 9/10/11`, then `--apply f` (seconds when the site has a `within` pin). Tools: /mnt/project-files/build-full-block/tools. Survey of old heights: /mnt/project-files/build-full-block/ledge_survey_12x12.txt.

**Split with the three map-polish threads (11-10):** first third (thread in the owner project): agartha, antarctica, area51, atlantis, babel, bermuda, bohemian_grove, camelot, cern, cyberpunk, derelict, downtown) switches its own 12 in its re-lay. This thread takes, AFTER each polish merge: second third (…KUCQLTGiQW7eGCm6crEQMb: fairy_forest, lodge, moon, mars, dumb, haunted, then hollow_earth, hell, heaven, gobekli, lookingglass; giza done) and last third (…PzXChP6bs8QYXb4vdkX6Np: stonehenge, stadium, vatican, strip, then technoticlan, shasta, skinwalker, saturn, singularity, northpole, olympus, revenge). They message this thread after each merge with new ledge rows / ghost wall levels. Also unowned: prebuilt_holosim (box room risers 1.75 m), training, clash (flat).

**Done so far (11-10):** Giza (#1080), Gobekli + Hell (#1082), Holo Sim (#1083, hall 17.5 m). PR #1082 `hqTerrainRulesFor(room)` scales maxSlope/cliffFrom/cliffTo by levelM/1.75, so only HEIGHTS change in a switched room (no plan edits). Nothing to raise: Hollow Earth, Heaven, Lookingglass, Training, Clash. All three polish threads told about the slope rule; waiting on their merge messages for the rest.

**11-10 later:** PR #1090 second third (Mars, Moon, Lodge +3.5 m ceiling, Haunted, Fairy Forest, D.U.M.B. +3.5 m ceiling). PR #1093 last third (Stonehenge, Singularity, Technoticlan, Shasta, Olympus, Saturn, North Pole, Flying Dutchman) + flags `ghostM: 1.75` (ghost blocks = real-size props keep the 1.75 m step) and `walkM: 1.75` (plain walk rules). NOT switched on purpose: Stadium, Vatican, Strip, Skinwalker (board cover = props/buildings). First third switched its own nine (PR #1084/#1091/#1092/#1095); NOT switched: Camelot, Cyberpunk, Downtown (generated / builder rooms; Downtown's 3 m overpass reads level 2 and no stair keeps its squares at 7 m). Final survey 11-10: all 144 arenas launch; /mnt/project-files/build-full-block/ledge_survey_final.txt. Asked mondo whether to raise Downtown/Camelot/Cyberpunk and the four prop-cover maps anyway: no answer yet. Tools lift.py (--auto) / sw.sh / cmp.js / rdiff.py in /mnt/project-files/build-full-block/tools. A ramp on a board: start it later, never re-cut picks.


**Not done / not checked:** exploration look of raised rooms on screen; editor shows nothing special for levelM.
