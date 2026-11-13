# Disaster City: who uses which pack building

One district per building, first come first served (kept by the shared-pieces thread). Ask there before using one.

**mondo 11-13 17:07: "its oaky to reuse gas stations and pizza, it can be like a chain/franchise in universe".** So the pizzeria and the gas station (`city_pizzeria`, `city_gas_store`, `city_gas_canopy`, `city_gas_sign`) are free for every district, no asking. Keep it a chain: the same building and signs, at most one of each per district, on a street. Everything else below stays one district each.
Sources: `/mnt/project-files/asset-packs/elbolilloduro/` (Elbolilloduro, CC0). "Cut" = the catalogue key (data.js DOOR_HQ catalogue, THE CITY'S WHOLE BUILDINGS): a prop row `{ key, x, z, face }`, real size, entrance at +Z, solid.
Preview: /mnt/project-files/disaster-city-shared/pack_buildings_cut.jpg.

| Pack building | District | Plot | Asked (UTC 11-13) | Cut |
|---|---|---|---|---|
| Pizzeria (pizzeria-psx) | SHARED: an in-universe chain, any district (first: Sports + Culture P05-11) | any | 17:07 | `city_pizzeria` |
| Gas station (gas-station) | SHARED: an in-universe chain, any district (first: Sports + Culture P07-11) | any | 17:07 | `city_gas_store` + `city_gas_canopy` + `city_gas_sign` |
| Playground (other/cursedlake_ps1-playground) | Sports + Culture | | 16:45 | no |
| BurgerPiz restaurant | Bayside | P09-09 Food hall | 16:46 | `city_burgerpiz` |
| Tacos stand | Bayside | P08-09 Street market | 16:46 | `city_taco_stand` |
| Diner | Financial | P09-03 Worker cafe | 16:44 | `city_diner` |
| 6twelve convenience store | FREE (Financial released it 17:14: 22.8 x 21.1 m fits no Financial lot; Southside asked first, so it has first call) | | | `city_6twelve` |
| VHS shop | Entertainment | P11-07 beside the Cinema | 16:47 | `city_vhs_shop` |
| Laundry | Southside | P02-00 Laundry terraces | 16:49 | `city_laundry` |
| House, Quequis house | Southside | P01-03 | 16:49 | `city_house`, `city_quequis_house` |
| Bus stop | Southside | P00-02 Bus stop court | 16:49 | already in the game: `bus_shelter` |
| Playground: not cut yet (Sports + Culture cuts it itself or asks) | | | | |
| Industrial pack (domi236: container, tank, vent, panel, skip, factory fronts) | cut by Industrial, shared by all | | 16:53 | by Industrial |
| Metro station pieces (already in the game, `base: 'metro'`) | Hero Plaza | P06-06 Transit court | 16:46 | in game |

Turned down (already taken): Financial gas station (withdrew); Hero Plaza diner + tacos; Entertainment diner, tacos, BurgerPiz;
Southside 6twelve, tacos, BurgerPiz, VHS shop.

The ten Buildings-pack shop blocks (`pack_bld_00` .. `pack_bld_09`) are shared by everyone: see areas-complexes.md "THE SHOP BLOCKS AT TRUE SIZE".

Not claimed, free to ask for: the Pizzeria scene's 21 small backdrop buildings (`building_01` .. `building_21`, 12 to 20 m, photo fronts) and the Tacos scene's 27 (`buildings_01` .. `buildings_27`, 5 to 17 m). Not cut; ask the shared-pieces thread.

## The gold (mondo 11-13 17:12: "we absolutely never use that gold texture anywhere in the game, there is a better gold texture")
The better gold = R2 `Assets/Sprites/terrain/gilt.png` (Metal007, his pick 11-03, PR #867). In the game the terrain key `gold` (also `gold_2`, `gold_3`) already IS that sheet, so an arch part writes `key: 'gold'`. Never load the files `terrain/gold.png`, `gold_2.png`, `gold_3.png` by name, in the game or in a mock-up (a mock-up that reads the bucket file shows him the banned sheet). The shared pieces (city doors, shop blocks, `city_*` buildings) use no gold sheet.

## The district files (the ONE hook, 11-13 17:22)
bake-disaster-city.js loads `docs/disaster-city/districts/<LETTER>.js` (R C F U H E I S B), one file per district; never put district code in the shared tool.
Exports, all optional: `tailor(PLAN, plotOf)` before the plan is read; `apply(ctx)` after the buildings and their door steps exist, before the street furniture; `build(ctx)` after every row exists.
`ctx = { PLAN, plotOf, features, props, bInfo, lateRows, gx, gc, r3, take, free, cellAt, setCell, roofB, ROOF_H, C, N, HALF }`.
