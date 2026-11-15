---
name: dc-financial-interiors-pass2-20261114
description: Financial (Disaster City) interiors SECOND PASS 11-14: F-atmos.js (lit ceilings, panelling, daylit windows) + 22 Meshy finance props on R2; facing check; LIVE PR #1363
metadata:
  type: project
---
Thread (thread in the owner project) "Deepen Financial interiors, second pass" (mondo 11-13 22:33 brief, same as other districts). First pass = [[dc-financial-district-20261113]] PR #1358 (F-inside.js). Shared Meshy claims: /mnt/project-files/meshy/interior-claims.md.

- LIVE 11-14: PR #1363 merged, data.js e4804de0 + ASSET_MANIFEST 0ae0f3db on R2, token 20261114-fin2-02-cors. Waits mondo's Mac look (headless never draws most Meshy GLBs). Shots: project files disaster-city-financial/interiors2/.
- Code: docs/disaster-city/districts/F-atmos.js `SECOND[id](T, A)`, hooked by one line in F-inside.js (`atmos(T, g, I, n0)` before `I.done()`). Kit: liner (coat at 0.27 m in), coffers, panel/strip/pend/sconce, window_, pilaster, rug, P(key,x,z,hd: 0 = front to back wall, 180 = to door), onWall (mount 0). `LOW[id]` = a hall's ceiling height override. Notes: areas-complexes.md "THE INSIDES, SECOND PASS".
- GOTCHA: a building's facade `:arch` row can hold a slab THROUGH its storey (hotel P08-00-B1: marble box under face 6.38 m) -> its unlit underside hides a lit ceiling deck above it. Check `dc:<id>:arch` parts before setting a ceiling height.
- 22 Meshy models on R2 Assets/world/props/meshy/: chesterfield_sofa, wingback_chair, bar_stool, key_rack, money_counter, deposit_box_wall, cash_cart, money_sacks, marble_bust, atm, evidence_board, reel_to_reel, radio_console, map_table, paper_shredder, newspaper_rack, floor_safe, stock_ticker, iron_garden_bench, bird_cage, stone_urn, concierge_podium. data.js "THE FINANCIAL INTERIOR PIECES" (outside DC144: a `--theirs` data.js merge DROPS it, re-add); list-models.js row. Pipeline: project files disaster-city-financial/meshy/.
- 11-15 mondo: "shitty clocks ... use the model list asset packs" -> drawn box clocks in the bank offices replaced by 3 `wall_clock` pack models, PR #1477 LIVE (data.js a36b3e92, token 20261115-finclock-01-cors). RULE: never draw a thing out of boxes when the model list has it.
- FACING: first-pass props all face the room. Renderer heading: face 0 = model +Z toward -z, world = local + rot.
- Dump: DC_F_DUMP=<dir> node bake-disaster-city.js writes each hall's parts+props in its own frame.
- Avoided: Bankers' terrace homes, hotel Politician room (front-left), penthouse column 3 (Halfdemon bedroom). My skirting/rail run along the hotel front wall through the Politician room.
