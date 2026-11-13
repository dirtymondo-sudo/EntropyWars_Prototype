# Disaster City: who uses which pack building

One district per building, first come first served (kept by the shared-pieces thread). Ask there before using one.

**mondo 11-13 17:07: "its oaky to reuse gas stations and pizza, it can be like a chain/franchise in universe".** So the pizzeria and the gas station (`city_pizzeria`, `city_gas_store`, `city_gas_canopy`, `city_gas_sign`) are free for every district, no asking. Keep it a chain: the same building and signs, at most one of each per district, on a street. Everything else below stays one district each.
Sources: `/mnt/project-files/asset-packs/elbolilloduro/` (Elbolilloduro, CC0). "Cut" = the catalogue key (data.js DOOR_HQ catalogue, THE CITY'S WHOLE BUILDINGS): a prop row `{ key, x, z, face }`, real size, entrance at +Z, solid.
Preview: /mnt/project-files/disaster-city-shared/pack_buildings_cut.jpg.

| Pack building | District | Plot | Asked (UTC 11-13) | Cut |
|---|---|---|---|---|
| Pizzeria (pizzeria-psx) | SHARED: an in-universe chain, any district (placed: Sports + Culture P05-11) | any | 17:07 | `city_pizzeria` |
| Gas station (gas-station) | SHARED: an in-universe chain, any district (not placed yet: Sports + Culture dropped it 17:55, no lot fits) | any | 17:07 | `city_gas_store` + `city_gas_canopy` + `city_gas_sign` |
| Playground (other/cursedlake_ps1-playground) | FREE (Sports + Culture released it 17:55: its park became the stadium) | | | no |
| BurgerPiz restaurant | Bayside | P09-09 Food hall | 16:46 | `city_burgerpiz` |
| Tacos stand | Bayside | P08-09 Street market | 16:46 | `city_taco_stand` |
| Diner | Financial | P09-03 Worker cafe | 16:44 | `city_diner` |
| 6twelve convenience store | FREE (Financial released it 17:14: 22.8 x 21.1 m fits no Financial lot; Southside passed too: no Southside lot fits it) | | | `city_6twelve` |
| VHS shop | Entertainment | P09-04, the Costume shops yard (too wide beside the Cinema) | 16:47 | `city_vhs_shop` |
| Laundry | Southside | P00-03 Canal walk, the north-east yard (16.7 m wide: too wide for the Laundry terraces lot) | 16:49 | `city_laundry` |
| House, Quequis house | Southside | two houses on P01-03 Homes row, the Quequis house on P02-03 Pawnshop court (31.7 m wide: it takes the place of two lots) | 16:49 | `city_house`, `city_quequis_house` |
| Bus stop | Southside | P00-02 Bus stop court | 16:49 | already in the game: `bus_shelter` |
| Playground: CUT 11-13 by the prop-pass thread: `play_slide`, `play_swing`, `play_sandbox` (shared, any district may place them; one set stands on Southside's Townhouse court) | | | | |
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
Also in ctx: `LEVELS`, `lvOf(plot)` (the levels), `ROOM`, `paintCell(cx, cy, sheet)` (paints a square outside the 144 x 144 grid; the ground palette is FULL at 8 sheets: the city's 6 + `wood_planks` + `desert`).
A district file may export `room = { east, sea, backdropOpen }` (Bayside's beach): `east` squares added to the room on each side (no coordinate moves), `sea` = `terrain.sea`, `backdropOpen` = boxes the skyline leaves empty. Rows outside the grid: `absY: true`.

## The industrial pack (Industrial thread, 11-13) — free for every district
domi236 PS1/PSX Industrial Pack #1 (CC0). Catalogue keys: `ind_container`, `ind_skip`, `ind_skip_full`, `ind_silo`, `ind_vent`, `ind_panel`, `ind_factory_red`, `ind_factory_tan`, `ind_factory_blue`.
Sizes + the stacking `y`: areas-complexes.md "THE INDUSTRIAL DISTRICT".

## The Meshy pieces of the second interior pass (mondo 11-13 22:33: "make a list of models needed/wanted but not in the bucket or game, and make meshy versions of them")
Every piece made here is a catalogue prop free for EVERY district once it is live (catalogue key = the name below). Before you make one on Meshy, look here: if
another district already lists it, use theirs, don't make a second. Add your own rows when you start, so the others see them.
Files: R2 `Assets/world/props/meshy/<key>.glb` (meshopt + WebP, like the decor). Concepts + sources: project files `<district>/pass2/`.

| Key | What | District making it | Status |
|---|---|---|---|
| `arcade_cabinet` | upright 1980s arcade cabinet, abstract art, no logos | Entertainment | making |
| `pinball_machine` | pinball machine | Entertainment | making |
| `claw_machine` | claw crane prize machine | Entertainment | making |
| `air_hockey_table` | air hockey table | Entertainment | making |
| `jukebox` | 1950s jukebox | Entertainment | making |
| `roulette_table` | casino roulette table | Entertainment | making |
| `blackjack_table` | half-moon card table | Entertainment | making |
| `money_wheel` | casino money wheel on a stand | Entertainment | making |
| `crystal_chandelier` | crystal chandelier (ceiling) | Entertainment | making |
| `velvet_rope` | two brass stanchions + red rope | Entertainment | making |
| `mixing_console` | studio mixing desk | Entertainment | making |
| `drum_kit` | full drum kit | Entertainment | making |
| `guitar_amp` | guitar amp stack | Entertainment | making |
| `pa_speaker` | floor PA loudspeaker | Entertainment | making |
| `followspot` | theatre follow spot on a tripod | Entertainment | making |
| `film_camera` | vintage movie camera on a tripod | Entertainment | making |
| `studio_light` | fresnel light on a wheeled stand | Entertainment | making |
| `directors_chair` | director's chair, plain canvas | Entertainment | making |
| `film_projector` | cinema film projector on its pedestal | Entertainment | making |
| `bakery_case` | curved glass bakery counter, full | Entertainment | making |
| `bread_rack` | wooden bread rack, full | Entertainment | making |
| `deck_oven` | steel bakery deck oven | Entertainment | making |
| `wedding_cake` | four-tier wedding cake | Entertainment | making |
| `costume_rack` | rolling rack of stage costumes | Entertainment | making |
| `makeup_vanity` | dressing-room mirror with bulbs + stool | Entertainment | making |
| `wedding_arch` | flower wedding arch | Entertainment | making |
| `mirror_ball` | disco mirror ball (ceiling) | Entertainment | making |
| `music_stand` | orchestra music stand | Entertainment | making |
| `paper_lantern` | round red paper lantern (hanging) | Entertainment | making |
