---
name: coded-shapes-proposal-20261103
description: 11-03 coded-shapes replacement (doc + mondo's per-item answers, round 1 PR #855 done); what's left; harness gotchas
metadata:
  type: project
  modified: 2026-11-03T11:17:31.949Z
---
Doc "Coded shapes worth replacing": https://claude.ai/artifact/WFS1U2pejBAp4cqXQr6wyF. MODEL_LIST_EXTRA §11 = the table (DONE marks).
mondo's rule (11-03): replaced pieces' CODE is DELETED from game + code ("never want to see them again"); no clusters called one
thing — pieces individually placed; replace with packs or Meshy, NOT textures.
ROUND 1 PR #855 (zip 1117): rover=mars_rover, toadstool=mushroom, fairy ring=ring of mushroom2, censer=props censer, brazier=decor
cave_torch, lighthouse=decor lighthouse, whale=ocean Whale.fbx (NOT humpback), bergs=ocean rocks ice; deleted floating island, cone
sea island, hills+dunes rims, ground _nrMounds (clouds kept). Notes maps-terrain-battle.md "THE CODED SHAPES OUT".
ROUND 2 PR #857 (zip 1138, 9 new Assets/misc GLBs zipped by hand, copies in project files asset-packs/coded-out-round2/):
castle/skycastle = castle pack pieces one by one; ruins rim = one ruined piece per stop; greek ruin wears greekcol; flesh mound =
Halloween Body_part heap; greytube = molten_cryo_tube.glb; iso_tank = molten_sleeper_casket.glb; hand_dryer/range_hood/kitchen_range/
sink_row = Diner, urinal = BurgerPiz, toilet_stall = Gas station, shower_stall = House (bake-pack-pieces.py jobs); ziggurat cube; stair
treads 1 tile; monolith thicker no rune; colossus -> fallen_column. castle_wall KEPT code (no 1x2 pack piece; told mondo).
ROUND 2b PR #860 (zip 1152): his OK'd Meshy pieces (meshy/coded-out/: concepts C01-C08 + L1-L4, models) in R2 Assets/decor/ via
_HQ_DECOR_GLB: obelisk, stone_arch (_hzGateway), greek_column (greek ruin), effigy bier+figure, windpump tower + spinning wheel
(_horizonFloaters spinX), grow_lamp (grainy LEDs, offered a redo), submarine, lava lamp base/cap (glass+wax still code). iso_tank kept h 1.3
(Antarctica board #859 stands it on 1.3 m ghost blocks).
ROUND 3: tower weenie = urban pack facade sheets (PR #861, zip 1157). City rim already prism-banded (PR #843).
ROUND 4 PR #869 (zip 1307, 20 Assets/misc ebd_buildings_bld_NN.glb/.png zipped by hand, copies asset-packs/coded-out-round4/): city rim KEPT
(mondo 12:03 "they look fine"); Buildings pack 10 shop blocks = data.js HQ_PACK_BUILDINGS: city plan/district `packP` (Disaster City OLD
TOWN 0.6 = 7 blocks; financial too shallow) + editor building Look "PACK BUILDINGS". Probe: city probe needs --flags=EW_NO_MODEL_QUEUE.
ROUND 5 (zip 1402, PR #871 rim swap + #875): mondo 13:28 "the rims are just dead code from the voxel boards right? obviouslyy they
need to go into the site rooms" -- TRUE: site VS-CPU/online fights = arena cut, nothing round it; world rims never draw. Town houses are
ROOM PROPS: DOOR_HQ.catalogue trailer_home_1..6 (Trailer Park) + abandoned_house (basement cut, hover -1): Area 51 flightline 4 past the
open edge, Skinwalker fields 3 in clearings, Haunted grounds 3 past the pines (outer ground; _hqCaveTop reads _hq.outer). 7 GLBs in
Assets/misc (now world/packs/elbolilloduro). RIMS OUT: PR #877 + #908 (11-05 "delete the rims": peaks+spires too; no rim code left).
BABEL HOUSES PR #912 (11-05, his OK): Meshy B1-B4 -> catalogue babel_house_small/stair/yard/row, R2 world/props/meshy, 8 props in
site_prebuilt_babel_tower. Thread waits on his look. Probe: Babel room crashes headless Chromium with all GLBs; 404 other .glb in route.
Gotchas: builders in ThreeRenderer closure -> scratch patched copy exporting window.__EWB (scratch tools/patch.py); set
EW_NO_OPT_ASSETS + 30 s wait for decor/props/FBX; gothic GLB 195 MB crashes Chromium; Pyramid.glb is cosmic not Giza.
Related [[model-list-master]] [[cone-mountains-removed-20261103]] [[itch-asset-packs-20261103]] [[meshy-decor-concepts-20261103]]
