---
name: battle-map-polish-first-third-20261110
description: Battle map polish 11-10 (mondo "improve all 12x12 battle maps"): first third (12 arenas) ALL SHIPPED PR #1084/#1091/#1092/#1095; board layout constraints across 12/11/10/9, launch-fit check, shot harness gotchas
metadata:
  type: project
---
mondo 11-10: "start some threads to make improvements to all of the battle maps (12x12) ... texture, layout, more realistic, better props, removing props ... AAA presentation and polish". Three threads split by site id. FIRST (thread in the owner project): agartha, antarctica, area51, atlantis, babel, bermuda, bohemian_grove, camelot, cern, cyberpunk, derelict, downtown.

ALL 12 SHIPPED: Agartha PR #1084; Atlantis #1091; Antarctica, Spaceship (derelict), CERN, Babel #1092; Camelot, Bermuda, Bohemian Grove, Area 51, Cyberpunk, Downtown #1095 (token 20261110-mappolish-05-cors, data.js 35d244f5 live). Awaiting mondo's review of the looks. What each got: docs/notes/maps-terrain-battle.md "THE BATTLE MAP POLISH, first third". Before/after composites + tools: /mnt/project-files/battle-map-polish/first-third/.
- levelM 3.5 (full ledges) set on all but Camelot, Cyberpunk, Downtown (castle generators / generated cities: left to the ledges (thread in the owner project).
- Known leftovers: Cyberpunk's Skyway deck is high ground on P2's corner only; the loop's traffic drives over the south spawn row; car_cyber model did not land in headless shots (glow only).

LESSONS:
- All four sizes are cut from the same squares. On the 12 grid: cols 4..7 flat on rows 0..3, 8..11 and nexus rows; rows 4 and 7 of cols 4..7 are the 9x9's egress (nothing there); cols 3 and 8 at most ONE level on rows 0..3 / 7..11; level 2+ only on cols 0..2 / 9..11. "KEEPS ITS OLD PICK" = layout broke that size. tools/cons.js prints the houses.
- LAUNCH FIT: bake passing is not enough. A walkable top above level 3 (e.g. a `bld` plateau over 6 m) passes the bake but hqArenaUpgrade refuses the window in game. Run tools/fit.js <site...> (hqArenaUpgrade(hqArenaSizedId(site,S),{compile:true}) must be true for every size).
- Cover = prop with floor:true + ghost wall (`ghost:true, rail:false`) on its squares; a `block` prop alone does not block the board. Keyed walls take the shell's wallColor unless `tint:'#ffffff'`. Scatter rows need `off:[x0,z0,x1,z1]`. gen.open discs/bands clear generated trees / city lots (a band can make the city gen re-lay nearby lots: re-check the raster).
- The bake's reach treats a ring of cover as a sealed pocket (counts as solid): leave a way into every flank yard.
- Harness (tools/pm.js): big city rooms open slowly; pm.js now waits 90 s for the launch gate before forcing startMatch (forcing early gives a black voxel board or drops to team select: a harness artifact, the old board did the same). One browser at a time.
- Merge helper tools/mergemain.sh <token-mid> <my sites>: merges main, keeps my sites' pick rows and main's others, re-bumps the token.
Related [[open-maps-olympus-antarctica-20261103]] [[gobekli-arena-remake-20261103]] [[headless-hq-proof-gotchas-20261108]]
