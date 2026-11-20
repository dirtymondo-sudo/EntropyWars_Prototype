# FITS: THE CAVERN — the props the game already has for a horror cave (2026-11-20)

A shortlist for dressing The Cavern (bake-cavern.js, `docs/areas/cavern/districts/K|H|A.js`) as the darkest cave in the game
(The Descent: squeezes, bone pits, a creature nest, crystal pockets, an old explorers' camp, black water sumps, falls, torches, ladders, rope).

**How it was read (in full, not a grep):** every one of the 2,269 rows of the live `DOOR_HQ.catalogue` (loaded through `load-data.js`),
MODEL_LIST.md §6 (every pack section, for the source), §7 (spell props, _MISC_GLB, animals, foliage), §8 (code procs and the models
they wear), §10 (decor still missing), §12 / §12b (the Meshy audit, the PSX Mega Pack) and §13 (files on R2 not named elsewhere),
`docs/plans/WISHLIST_MODELS_ADDED.md` (the 246 wish-list models + their real sizes), `docs/disaster-city/pack-claims.md`, and the
district files of the Cavern, the Sewers, the Catacombs / Hell and the D.U.M.B.

**Columns.** *size* is what the catalogue row says: `h` = height (m), `span` = longest side (m), `foot` = the blocker radius (m),
`rect` = the blocker box (w x d, m); `model` = the wish-list file's own w x h x d. *blocks?*: `blocks` = the row has `block: true`;
`decor` = no block flag (walk-through); `wall-hung` / `ceiling` = `wall` / `ceil` rows; `real light` = the row carries a `light`;
`glow` = a glow sprite only. *already in a cave room* = the district files that name the key today (placed rows, or a pick list)
(Cavern K/H/A, Sewers W/T/H/O/R, Afterlife K = the Catacombs, D/R/L/W = Hell, DUMB K/P/S/R/C).
A key written here is copied exactly from `DOOR_HQ.catalogue`; anything not in the catalogue says NOT WIRED.

**Licence note (MODEL_LIST §12b):** PSX Mega Pack (`psx_*`, `psxmp` base) and Retro Tree Pack pieces may never be fed to Meshy or any
AI tool, not even as a reference picture.

## ROCK + CAVE FORMS (stalagmites, boulders, rock piles, crystals)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `cave_stone` | short standing stone, a small rock spire | Meshy (mondo) | span 0.9, foot 0.35 | blocks | Cavern K, Sewers O, Afterlife R |
| `menhir` | tall standing stone (same Meshy file as cave_stone, taller) | Meshy (mondo) | h 2.6, foot 0.5 | blocks | Cavern K, Afterlife R |
| `sarsen` | big standing stone / rock column | Meshy (mondo) | h 3.4, foot 0.6 | blocks | Cavern K |
| `trilithon` | two stones + lintel: a rock gate | Meshy (mondo) | span 6.4, rect 6.40x1.80 | blocks | Cavern K |
| `psxg_rock_1` | boulder (graveyard pack, the only blocking one of the four) | PSX Halloween Graveyard (BlenderVoyage) | h 0.74, foot 0.6 | blocks | Sewers W |
| `psxg_rock_2` | rock | PSX Halloween Graveyard (BlenderVoyage) | h 0.49, foot 0.4 | decor |  |
| `psxg_rock_3` | rock | PSX Halloween Graveyard (BlenderVoyage) | h 0.43, foot 0.3 | decor | Sewers W |
| `psxg_rock_4` | flat rock | PSX Halloween Graveyard (BlenderVoyage) | h 0.23, foot 0.3 | decor |  |
| `hw_stone` | rock (Halloween pack Stone) | Halloween pack (Elbolilloduro, CC0) | h 0.72, foot 0.3 | blocks |  |
| `hw_stone_1` | rock | Halloween pack (Elbolilloduro, CC0) | h 0.72, foot 0.3 | blocks |  |
| `hw_stone_2` | rock (used in Cavern K) | Halloween pack (Elbolilloduro, CC0) | h 1.05, foot 0.3 | blocks | Cavern K |
| `hw_stone_3` | tallest Halloween rock | Halloween pack (Elbolilloduro, CC0) | h 1.26, foot 0.3 | blocks |  |
| `hw_stone_4` | rock | Halloween pack (Elbolilloduro, CC0) | h 0.87, foot 0.3 | blocks |  |
| `hw_stone_5` | rock | Halloween pack (Elbolilloduro, CC0) | h 1.07, foot 0.3 | blocks |  |
| `ocean_rock` | rock (Ocean pack) | Ocean pack (mondo upload) | h 1, foot 0.5 | blocks | Cavern K |
| `ocean_rock_2` | rock | Ocean pack (mondo upload) | h 1.4, foot 0.7 | blocks |  |
| `ocean_rock_3` | tall rock, 2.6 m: a pillar | Ocean pack (mondo upload) | h 2.6, foot 0.5 | blocks |  |
| `ocean_rock_4` | tall rock, 2.4 m | Ocean pack (mondo upload) | h 2.4, foot 0.6 | blocks |  |
| `ocean_rock_5` | low rock | Ocean pack (mondo upload) | h 0.5, foot 0.4 | decor | Cavern H |
| `ocean_rock_6` | low rock | Ocean pack (mondo upload) | h 0.6, foot 0.45 | decor |  |
| `ocean_rock_7` | rock | Ocean pack (mondo upload) | h 0.8, foot 0.6 | blocks |  |
| `ocean_rock_8` | rock (used in Cavern K) | Ocean pack (mondo upload) | h 0.7, foot 0.6 | blocks | Cavern K |
| `ocean_rock_9` | rock | Ocean pack (mondo upload) | h 0.6, foot 0.6 | decor |  |
| `ocean_rock_10` | pebble | Ocean pack (mondo upload) | span 0.5 | decor |  |
| `ocean_rock_11` | pebble (used in Cavern K) | Ocean pack (mondo upload) | span 0.6 | decor | Cavern K |
| `rf_rock_1` | boulder (Retro Foliage) | Retro Foliage kit (AFGameAssets) | h 1.41, foot 0.6 | blocks |  |
| `rf_rock_2` | boulder | Retro Foliage kit (AFGameAssets) | h 1.66, foot 0.8 | blocks |  |
| `rf_rock_3` | big boulder, 3.5 m span | Retro Foliage kit (AFGameAssets) | span 3.5, foot 1.5 | blocks |  |
| `rf_rock_4` | big boulder, 3.3 m span | Retro Foliage kit (AFGameAssets) | span 3.3, foot 1.4 | blocks |  |
| `lake_rock` | smooth water-worn granite boulder | Meshy wish list (Claude, 11-16) | span 1.5, foot 0.49, model 1.5x0.92x0.99 | blocks |  |
| `cairn` | stacked-stone trail cairn (explorer marker) | Meshy wish list (Claude, 11-16) | h 1.2, foot 0.47, model 0.97x1.2x0.93 | blocks |  |
| `ore_heap` | heap of coal + ore rocks: a rubble pile | Meshy wish list (Claude, 11-16) | span 2, foot 0.97, model 2.0x0.82x1.93 | blocks | Sewers O |
| `asteroid_a` | lumpy rock (used as a boulder in Cavern K) | D.O.O.R. kit upload (mondo) | span 4 | decor | Cavern K |
| `asteroid_b` | lumpy rock (used in Cavern K) | D.O.O.R. kit upload (mondo) | span 4 | decor | Cavern K |
| `casing_block` | cut limestone block | Meshy wish list (Claude, 11-16) | span 1.5, foot 0.66, model 1.32x1.05x1.5 | blocks |  |
| `fallen_column` | fallen stone column | Meshy wish list (Claude, 11-16) | span 5, foot 0.68, rect 5.00x1.36, model 5.0x1.24x1.37 | blocks |  |
| `decor_stone_arch` | stone arch (used in Cavern K) | Meshy decor (Claude, 11-03) | h 3.5, foot 1.46 | decor | Cavern K |
| `brick_arch` | brick arch section | Meshy (mondo) | h 3.2 | decor |  |
| `psx_brick_1` | loose brick | PSX Mega Pack (Pizza Doggy) | h 0.14 | decor | Sewers W, Sewers T, Sewers O |
| `hw_bricks` | brick rubble on the floor | Halloween pack (Elbolilloduro, CC0) | h 0.13 | decor | Sewers O |
| `hw_bricks_2` | brick rubble | Halloween pack (Elbolilloduro, CC0) | h 0.13 | decor | Sewers O |
| `meshy_crystal_shards` | crystal cluster (used in Cavern K/H/A) | Meshy (mondo) | h 0.8, foot 0.72 | decor | Cavern K, Cavern H, Cavern A, Sewers O |
| `meshy_crystal_shard` | single crystal shard | Meshy (mondo) | h 0.6, foot 0.23 | decor | Sewers O |
| `crystal_cluster` | lit gem cluster, code-drawn (mondo kept it on purpose, 10C) | code (proc `crystal_cluster`) | h 1.4, foot 0.55 | blocks, real light | Cavern K, Cavern H, Sewers O |
| `icicles` | snow icicles: the nearest thing to a stalactite row (no stalactite model) | Meshy wish list (Claude, 11-16) | span 2, model 2.0x1.21x0.2 | decor |  |
| `ice_block` | ice block | Meshy wish list (Claude, 11-16) | h 2.5, foot 1.54, model 3.18x2.5x3.08 | blocks |  |
| `catacomb_wall` | catacomb wall panel (used in Sewers O) | Meshy (mondo) | span 3.2 | decor, wall-hung | Sewers O |

## LIGHT (torches: only variants of cave_torch, wall_torch, tiki_torch; candles; glow)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `cave_torch` | standing torch, the Cavern default | code (proc `cave_torch`), wears cave_torch (Meshy decor) | h 1.9, foot 0.12 | blocks, real light | Cavern K, Sewers W, Sewers O, Afterlife K, Afterlife D, Afterlife R, Afterlife W |
| `torch_blue` | cave_torch, blue flame | code (proc `cave_torch`), wears cave_torch (Meshy decor) | h 1.9, foot 0.12 | blocks, real light |  |
| `torch_red` | cave_torch, red flame | code (proc `cave_torch`), wears cave_torch (Meshy decor) | h 1.9, foot 0.12 | blocks, real light | Afterlife R |
| `torch_white` | cave_torch, white flame | code (proc `cave_torch`), wears cave_torch (Meshy decor) | h 1.9, foot 0.12 | blocks, real light |  |
| `torch_green` | cave_torch, green flame | code (proc `cave_torch`), wears cave_torch (Meshy decor) | h 1.9, foot 0.12 | blocks, real light |  |
| `wall_torch` | iron wall sconce torch | code (proc `wall_torch`), wears wall_torch_bracket (Meshy decor) | h 1.1 | decor, wall-hung, real light |  |
| `decor_wall_torch_bracket` | the sconce model wall_torch wears, as a loose prop | Meshy decor (Claude, 11-03) | h 0.5, foot 0.24 | decor |  |
| `tiki_torch` | tall torch, code-drawn | code (proc `tiki_torch`) | h 2.85, foot 0.12 | blocks, real light |  |
| `candle` | single lit candle (spell prop) | Meshy (mondo) | h 0.3 | decor |  |
| `candleLine` | line of lit candles | Meshy (mondo) | span 0.8 | decor |  |
| `candleRing` | ritual ring of lit candles (used in Cavern K/A) | Meshy (mondo) | span 1.2 | decor | Cavern K, Cavern A |
| `candle_ring` | lit candle ring proc (wears the candle model) | code (proc `candle_ring`), wears candle (the Meshy spell candle) | h 0.3 | decor, real light | Sewers W, Afterlife K |
| `hw_candles` | candle cluster (Halloween) | Halloween pack (Elbolilloduro, CC0) | h 0.38, foot 0.2 | decor | Cavern K, Sewers W, Sewers O |
| `hw_candles_2` | candle cluster | Halloween pack (Elbolilloduro, CC0) | h 0.38, foot 0.2 | decor | Sewers O |
| `hw_candle` | one candle | Halloween pack (Elbolilloduro, CC0) | h 0.2, foot 0.1 | decor |  |
| `hw_candle_2` | one candle | Halloween pack (Elbolilloduro, CC0) | h 0.27, foot 0.1 | decor |  |
| `lit_candle` | thick dripping candle on an iron dish | Meshy wish list (Claude, 11-16) | h 0.3, model 0.31x0.3x0.24 | decor | Sewers W |
| `candelabra` | standing candelabra | Meshy (Claude, Southside interiors) | h 1.8, foot 0.3 | decor | Sewers O |
| `votive_stand` | votive candle stand | Meshy (Claude, Southside interiors) | h 1.3, foot 0.6 | decor |  |
| `brazier` | fire bowl on a stand | Meshy (mondo) | h 1.3, foot 0.4 | blocks, real light | Cavern H, Cavern A, Sewers W, Sewers O, Afterlife K, Afterlife R, Afterlife L, Afterlife W |
| `hearth_fire` | open fire, code-drawn | code (proc `hearth_fire`) | h 1.5, foot 0.5 | decor, real light | Sewers T, Sewers O, Afterlife D |
| `hearth_fire_blue` | blue fire | code (proc `hearth_fire`) | h 1.5, foot 0.5 | decor, real light | Afterlife D |
| `hearth_fire_white` | white fire | code (proc `hearth_fire`) | h 1.5, foot 0.5 | decor, real light |  |
| `campfire` | camp fire ring (Survival PSX) | Survival PSX (Elbolilloduro, CC0) | span 1.5, foot 0.7 | blocks, real light | Cavern K, Cavern H, Sewers O |
| `meshy_campfire_ring` | stone campfire ring (Meshy, unlit model) | Meshy (mondo) | span 1.2 | decor |  |
| `ship_lantern` | hanging lantern (Survival PSX lantern), lit | Survival PSX (Elbolilloduro, CC0) | h 0.5 | decor, ceiling, real light | Cavern K, Sewers W, Sewers O |
| `meshy_hanging_lantern` | old Meshy hanging lantern (replaced by the pack one in ship_lantern) | Meshy (mondo) | h 0.5 | decor |  |
| `railway_lantern` | railway hand lantern | Meshy (Claude, Industrial interiors) | h 0.4 | decor | Sewers W, Sewers T, Sewers H, Sewers O, DUMB P |
| `lantern_post` | post with a hanging oil lantern | Meshy wish list (Claude, 11-16) | h 2.2, foot 0.16, rect 0.70x0.32, model 0.7x2.2x0.33 | blocks | Cavern K |
| `oil_lamp` | oil lamp | Meshy wish list (Claude, 11-16) | span 0.3, model 0.3x0.12x0.19 | decor |  |
| `cage_lamp` | bulkhead cage lamp (mine / tunnel) | Meshy wish list (Claude, 11-16) | h 0.3, model 0.29x0.3x0.12 | decor | Sewers W, Sewers T, Sewers H, Sewers R |
| `bare_bulb` | bare ceiling bulb (old works) | code (proc `bare_bulb`), wears bare_bulb (Abandoned House pack piece) | h 0.35 | decor, ceiling, real light | Cavern K, Sewers W, Sewers T, Sewers H, Sewers R, DUMB S |
| `strobe_lamp` | strobe lamp (used in the Sewers) | Meshy wish list (Claude, 11-16) | h 0.3, model 0.13x0.3x0.27 | decor | Sewers W, Sewers T, Sewers H |
| `psx_flashlight_1` | dropped flashlight | PSX Mega Pack (Pizza Doggy) | h 0.27 | decor | Sewers W, Sewers T, DUMB S |
| `psx_flashlight_mp_1` | small flashlight | PSX Mega Pack (Pizza Doggy) | h 0.08 | decor | Sewers T |
| `light_glow` | a bare glow + light, no model | code (proc `glow_light`) | h 0.1 | decor, real light | Afterlife D, Afterlife R |
| `light_shaft` | a shaft of light from above, effect only | code (proc `light_shaft`) | h 1 | decor |  |
| `woods_glowcap` | glowing mushroom cap | Meshy (mondo) | h 0.7, foot 0.2 | decor, glow | Cavern K, Cavern H, Sewers O, Sewers R |
| `fae_toadstool` | lit glowing toadstool | Meshy (mondo) | h 1.75, foot 0.3 | decor, real light | Cavern K |
| `fae_mushroom` | big lit glowing mushroom | Meshy (mondo) | h 3.5, foot 0.8 | blocks, real light |  |
| `woods_gasplant` | glowing gas plant | Meshy (Claude, the Garden plants) | h 1.1, foot 0.35 | decor, glow |  |
| `firefly` | firefly (tiny) | Meshy wish list (Claude, 11-16) | span 0.03, model 0.03x0.01x0.02 | decor |  |
| `ocean_bioluminescent_jelly` | bioluminescent jellyfish (a living glow for a black sump) | Ocean pack (mondo upload) | h 1.3 | decor |  |
| `ocean_anglerfish` | anglerfish, lure lit | Ocean pack (mondo upload) | span 1 | decor | Sewers O |
| `floating_orb` | lit plinth + orb, code-drawn | code (proc `floating_orb`) | h 1.9, foot 0.7 | blocks, real light | DUMB K, DUMB R |

## BONES + HORROR (skulls, skeletons, corpses, body parts, blood, cages, nests, webs, eggs)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `skull` | single skull | Meshy (mondo) | h 0.22 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers R |
| `skull_pile` | pile of skulls | Meshy (mondo) | span 1.3, foot 0.5 | blocks | Cavern K, Sewers T, Sewers O, Sewers R, Afterlife K, Afterlife D, Afterlife R, Afterlife L, Afterlife W |
| `femur` | femur bone | Meshy (mondo) | span 0.45 | decor | Sewers T |
| `ulna` | ulna bone | Meshy (mondo) | span 0.28 | decor |  |
| `cattle_skull` | horned animal skull | Meshy wish list (Claude, 11-16) | span 0.7, model 0.7x0.46x0.2 | decor |  |
| `psx_fish_skeleton_mp_1` | fish skeleton | PSX Mega Pack (Pizza Doggy) | span 0.52 | decor | Cavern K, Sewers W, Sewers O, Sewers R |
| `anatomy_skeleton` | standing human skeleton (anatomy model) | Meshy (Claude, University interiors) | h 1.9, foot 0.22 | decor | Sewers T, Sewers O, DUMB R |
| `dinosaur_skeleton` | big fossil skeleton (used in Hollow Earth H) | Meshy (Claude, University interiors) | span 6.4 | decor | Cavern H |
| `astronaut` | dead astronaut: a dead explorer in a suit | Meshy (mondo) | h 2, foot 0.4 | decor |  |
| `decor_effigy_figure` | lying stone effigy figure | Meshy decor (Claude, 11-03) | span 1.9, foot 0.95 | decor |  |
| `hw_body` | body (Halloween Body): a corpse | Halloween pack (Elbolilloduro, CC0) | h 0.32, foot 0.5, rect 0.58x2.10 | decor | Cavern K, Sewers W, Sewers O, Sewers R, DUMB S, DUMB R |
| `hw_body_2` | body | Halloween pack (Elbolilloduro, CC0) | h 0.28, foot 0.5, rect 0.60x1.88 | decor | Sewers W, Sewers T, Sewers O, Sewers R |
| `hw_body_rising` | corpse rising from the ground | Halloween pack (Elbolilloduro, CC0) | h 0.92, foot 0.4 | blocks |  |
| `hw_body_rising_2` | corpse rising | Halloween pack (Elbolilloduro, CC0) | h 0.77, foot 0.4 | blocks |  |
| `hw_part` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.56 | decor | Sewers W, Sewers O |
| `hw_part_1` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.31 | decor | Cavern K, Sewers R |
| `hw_part_2` | body part (1 m) | Halloween pack (Elbolilloduro, CC0) | h 1 | decor | Sewers T |
| `hw_part_3` | body part (most used in the caves) | Halloween pack (Elbolilloduro, CC0) | h 0.65 | decor | Cavern K, Sewers W, Sewers H, Sewers O, Sewers R |
| `hw_part_4` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.5 | decor | Sewers W |
| `hw_part_5` | body part | Halloween pack (Elbolilloduro, CC0) | span 0.25 | decor | Sewers W, Sewers H, Sewers R |
| `hw_part_6` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.12 | decor | Sewers W |
| `hw_part_7` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.18 | decor | Sewers W |
| `hw_part_8` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.13 | decor |  |
| `hw_part_9` | body part | Halloween pack (Elbolilloduro, CC0) | h 0.22 | decor |  |
| `psx_meat_1` | raw meat | PSX Mega Pack (Pizza Doggy) | h 0.08 | decor |  |
| `psx_meat_1_1` | raw meat | PSX Mega Pack (Pizza Doggy) | h 0.08 | decor |  |
| `meat_hook` | meat hook rail | code (proc `meat_hook`), wears meat_hook (Meshy decor) | h 1.7, foot 0.3 | blocks, ceiling | DUMB R |
| `floor_stain` | floor stain decal (the only blood / slime stand-in) | code (proc `floor_stain`) | h 0.01 | decor | Sewers W, Sewers T, Sewers H, Sewers R, DUMB K, DUMB P, DUMB S, DUMB R |
| `hw_coffin` | coffin | Halloween pack (Elbolilloduro, CC0) | h 0.41, foot 0.5, rect 1.10x2.68 | blocks | Sewers O, Afterlife K |
| `hw_coffin_lid` | coffin lid | Halloween pack (Elbolilloduro, CC0) | h 0.14 | decor | Sewers O |
| `psxg_coffin` | coffin (graveyard pack) | PSX Halloween Graveyard (BlenderVoyage) | h 0.45, foot 0.5, rect 0.86x2.18 | blocks | Afterlife K |
| `trap_coffin_open` | open coffin trap | Traps pack, drawn by a proc | span 2, foot 0.6, rect 2.00x1.32 | blocks | Afterlife K |
| `sarcophagus` | stone sarcophagus | Meshy (mondo) | span 2.3, foot 0.8 | blocks | Sewers O, Afterlife K |
| `hw_coffin_2` | coffin | Halloween pack (Elbolilloduro, CC0) | h 0.41, foot 0.5, rect 1.10x2.68 | blocks | Afterlife K |
| `psxg_dirt_grave` | dirt grave mound | PSX Halloween Graveyard (BlenderVoyage) | h 0.19 | decor |  |
| `psxg_tombstone_1` | tombstone | PSX Halloween Graveyard (BlenderVoyage) | h 1.18, foot 0.35 | blocks | Afterlife D |
| `psxg_tombstone_3` | tombstone | PSX Halloween Graveyard (BlenderVoyage) | h 1.05, foot 0.35 | blocks | Afterlife D |
| `wooden_cross` | wooden cross (wall-hung) | Meshy (mondo) | h 3 | decor, wall-hung | Afterlife K |
| `bird_cage` | cage (1.9 m) | Meshy (Claude, Financial interiors) | h 1.9 | decor | Sewers O, DUMB R |
| `cage_wagon` | circus cage wagon | Meshy wish list (Claude, 11-16) | span 4.5, foot 1.23, rect 4.50x2.46, model 4.5x3.42x2.45 | blocks |  |
| `cell_bars` | open cell bars, code-drawn | code (proc `cell_bars`) | h 2.4 | decor, wall-hung |  |
| `psx_bars_metal_1` | metal bars panel | PSX Mega Pack (Pizza Doggy) | h 2.4, foot 1.25 | decor |  |
| `psx_bars_metal_2` | metal bars panel | PSX Mega Pack (Pizza Doggy) | h 2.4, foot 1.25 | decor |  |
| `chain_bunk` | chain-hung bunk | Meshy wish list (Claude, 11-16) | span 2, foot 0.45, rect 2.00x0.90, model 2.0x1.85x0.89 | blocks | Sewers H |
| `wall_chains` | draped wall chain (traps pack) | Traps pack (mondo upload) | span 1 | decor, wall-hung | Cavern K, Sewers W, Sewers H, Sewers O, Sewers R, Afterlife K, Afterlife D, Afterlife R, Afterlife L, Afterlife W |
| `trap_chain_draped` | draped chain | Traps pack (mondo upload) | span 1.6 | decor, wall-hung | Cavern K, Sewers W, Sewers H |
| `trap_chain_straight` | hanging straight chain | Traps pack (mondo upload) | h 1.22 | decor, wall-hung |  |
| `stocks` | wooden stocks | code (proc `stocks`), wears stocks (Meshy decor) | h 1.1, foot 0.5 | blocks | Cavern K, Sewers O, Afterlife D, Afterlife L |
| `trap_iron_maiden` | iron maiden | Traps pack, drawn by a proc | h 2.2, foot 0.5, rect 0.90x0.70 | blocks | Cavern K |
| `trap_spike_pit` | spike pit | Traps pack (mondo upload) | span 2.8, foot 1.3 | blocks |  |
| `trap_bear_open` | bear trap, open | Traps pack, drawn by a proc | span 0.75 | decor |  |
| `trap_trip_wire` | trip wire | Traps pack (mondo upload) | span 1.75 | decor |  |
| `trap_pressure_plate` | pressure plate | Traps pack (mondo upload) | span 1 | decor |  |
| `hw_web` | cobweb (Halloween) | Halloween pack (Elbolilloduro, CC0) | span 1.07 | decor | Sewers T, Sewers O |
| `hw_web_2` | cobweb | Halloween pack (Elbolilloduro, CC0) | span 1.1 | decor | Sewers T, Sewers O |
| `hw_web_3` | cobweb | Halloween pack (Elbolilloduro, CC0) | span 1.2 | decor | Sewers T, Sewers O |
| `psx_cobweb_1` | cobweb card | PSX Mega Pack (Pizza Doggy) | h 0.8, foot 0.68 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O, Sewers R |
| `psx_cobweb_2` | cobweb card | PSX Mega Pack (Pizza Doggy) | h 0.8, foot 0.59 | decor | Cavern K, Sewers W, Sewers H, Sewers O, Sewers R |
| `psx_cobweb_4` | cobweb card | PSX Mega Pack (Pizza Doggy) | h 0.8, foot 0.44 | decor | Sewers W, Sewers H |
| `psx_cobweb_5` | cobweb card | PSX Mega Pack (Pizza Doggy) | h 0.8, foot 0.47 | decor | Sewers W, Sewers H |
| `stone_altar` | stone altar | code (proc `stone_altar`), wears stone_altar (Meshy decor) | h 0.95, foot 1, rect 2.10x1.00 | blocks | Cavern H, Cavern A, Afterlife K, Afterlife L |
| `ritual_circle` | ritual circle decal | code (proc `ritual_circle`) | h 0.01 | decor |  |
| `demon_statue` | demon statue | Meshy (mondo) | h 3.4, foot 0.7 | blocks | Afterlife R, Afterlife L, Afterlife W |
| `hooded_statue` | hooded statue | Meshy wish list (Claude, 11-16) | h 2.2, foot 0.34, model 0.76x2.2x0.68 | blocks | Sewers O |
| `weeping_angel` | weeping angel statue | Meshy wish list (Claude, 11-16) | h 2, foot 0.54, model 1.09x2.0x1.3 | blocks |  |
| `meshy_voodoo_doll` | voodoo doll | Meshy (mondo) | h 0.25 | decor |  |
| `missing_board` | MISSING posters board (the Woods horror pass) | Meshy (Claude, Woods horror pass) | h 3.2, foot 0.6, rect 2.40x1.40 | blocks | Sewers T, Sewers O |

## CAMP + EXPLORERS (tents, packs, ropes, crates, lanterns, ladders, mining carts, timber)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `camping_tent` | dome tent (Survival PSX) | Survival PSX (Elbolilloduro, CC0) | span 3.2, foot 1.5, rect 3.20x2.80 | blocks |  |
| `meshy_camping_tent` | dome tent (Meshy) | Meshy (mondo) | span 2.4, foot 1.2 | decor |  |
| `canvas_tent` | old canvas wall tent | Meshy wish list (Claude, 11-16) | h 2.4, foot 1.75, model 3.86x2.4x3.51 | blocks | Cavern K |
| `lean_to` | survival lean-to | Meshy wish list (Claude, 11-16) | span 3, foot 1.23, model 3.0x1.46x2.45 | blocks |  |
| `sleeping_bag` | sleeping bag, flat | Meshy wish list (Claude, 11-16) | span 2, model 2.0x0.28x0.73 | decor | Cavern K, Sewers W, Sewers T, Sewers O |
| `backpack` | expedition backpack | Meshy wish list (Claude, 11-16) | h 0.75, foot 0.24, model 0.54x0.75x0.48 | blocks | Cavern K, Sewers W, Sewers T, Sewers H |
| `kettle` | camp kettle | Meshy wish list (Claude, 11-16) | h 0.3, model 0.31x0.3x0.24 | decor | Sewers W, Sewers T, Sewers O |
| `firewood_stack` | firewood stack | Meshy wish list (Claude, 11-16) | span 2, foot 0.33, rect 2.00x0.66, model 2.0x0.82x0.65 | blocks | Cavern K, Sewers O |
| `psx_old_mattress_mp_1` | old mattress on the floor | PSX Mega Pack (Pizza Doggy) | h 0.2 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O, DUMB S, DUMB R |
| `cot` | camp cot | Meshy (mondo) | span 1.9, foot 0.7 | decor | Cavern K, Sewers W, Sewers T, Sewers H, DUMB R |
| `folding_chair` | folding chair | Meshy (mondo) | h 0.84, foot 0.28 | decor | Sewers T, Sewers H |
| `map_table` | map table | Meshy (Claude, Financial interiors) | span 2.2 | decor | DUMB K, DUMB C |
| `psx_supply_crate_1` | supply crate | PSX Mega Pack (Pizza Doggy) | h 0.37, foot 0.33 | decor | Cavern K, Sewers W, Sewers T, Sewers O, Sewers R, DUMB S |
| `psx_supply_crate_1_empty` | supply crate, empty | PSX Mega Pack (Pizza Doggy) | h 0.2 | decor | Sewers W, Sewers R |
| `psx_wooden_crate_1` | small wooden crate | PSX Mega Pack (Pizza Doggy) | h 0.36, foot 0.36 | decor | Cavern K, Sewers W, Sewers T, Sewers O |
| `psx_wooden_crate_2` | wooden crate 1.08 m | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.54 | decor | Cavern K, Sewers W, Sewers O |
| `psx_wooden_crate_3` | wooden crate | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.54 | decor | Sewers W, Sewers O |
| `psx_wooden_crate_4` | wooden crate | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.54 | decor | Sewers O |
| `psx_wooden_crate_5` | wooden crate | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.54 | decor | Sewers O |
| `psx_wooden_crate_6` | wooden crate | PSX Mega Pack (Pizza Doggy) | h 0.75, foot 0.38 | decor | Sewers O |
| `sea_chest` | old chest | Meshy (mondo) | h 0.7, foot 0.5 | blocks | Cavern K, Cavern H, Cavern A |
| `footlocker` | footlocker | Meshy (Claude, Civic interiors) | span 0.85 | decor | Cavern K, Sewers T, Sewers H, Sewers R, DUMB S |
| `wooden_barrel` | wooden barrel | Meshy wish list (Claude, 11-16) | h 1, foot 0.38, model 0.75x1.0x0.75 | blocks | Cavern K, Sewers O, DUMB C |
| `psx_metal_barrel_mp_1` | metal barrel | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.37 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O, Sewers R, DUMB K, DUMB S, DUMB R |
| `psx_metal_barrel_mp_2` | metal barrel | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.37 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O, Sewers R, DUMB S |
| `psx_metal_barrel_mp_3` | metal barrel | PSX Mega Pack (Pizza Doggy) | h 1.08, foot 0.37 | decor | Sewers W, Sewers T, Sewers O, Sewers R |
| `psx_jerrycan_1` | jerrycan | PSX Mega Pack (Pizza Doggy) | h 0.5, foot 0.21 | decor | Sewers W, Sewers T, Sewers H, Sewers O, DUMB P |
| `meshy_burlap_sack` | burlap sack | Meshy (mondo) | h 0.7, foot 0.33 | decor | Cavern K, Sewers W |
| `meshy_sandbags` | sandbags | Meshy (mondo) | h 0.8, foot 0.89 | decor | Cavern K, Sewers W, Sewers O, DUMB P, DUMB S |
| `psx_canned_food_mp_1` | canned food | PSX Mega Pack (Pizza Doggy) | h 0.17 | decor | Sewers W, Sewers T |
| `psx_canned_food_mp_5_rusty` | rusty can | PSX Mega Pack (Pizza Doggy) | h 0.17 | decor | Sewers W |
| `psx_bandage_mp_1` | bandage | PSX Mega Pack (Pizza Doggy) | h 0.06 | decor | Sewers W |
| `psx_pills_bottle_1` | pill bottle | PSX Mega Pack (Pizza Doggy) | h 0.11 | decor | Sewers W, DUMB R |
| `psx_healing_potion_mp_1` | potion bottle | PSX Mega Pack (Pizza Doggy) | h 0.11 | decor | Sewers W |
| `psx_glass_bottle_1` | glass bottle | PSX Mega Pack (Pizza Doggy) | h 0.35 | decor | Sewers W, Sewers T, Sewers H, Sewers O, DUMB C |
| `psx_walkie_talkie_1` | walkie-talkie | PSX Mega Pack (Pizza Doggy) | span 0.36 | decor | Cavern K, Sewers W, DUMB S |
| `item_walkie_talkie` | walkie-talkie (Meshy) | Meshy (Claude, held props 11-03) | h 0.22 | decor |  |
| `field_radio` | field radio | Meshy (Claude, Civic interiors) | h 0.45 | decor | Sewers T, DUMB S, DUMB C |
| `item_binoculars` | binoculars | Meshy (Claude, held props 11-03) | span 0.18 | decor |  |
| `item_flare_gun` | flare gun | Meshy (Claude, held props 11-03) | span 0.25 | decor |  |
| `item_old_camera_flash` | old flash camera | Meshy (Claude, held props 11-03) | h 0.25 | decor |  |
| `psx_notebook_1` | notebook | PSX Mega Pack (Pizza Doggy) | span 0.22 | decor |  |
| `psx_open_book_mp_1` | open book / journal | PSX Mega Pack (Pizza Doggy) | span 0.42 | decor | Sewers O |
| `psx_matchbox_1` | matchbox | PSX Mega Pack (Pizza Doggy) | span 0.09 | decor |  |
| `psx_lighter_mp_1` | lighter | PSX Mega Pack (Pizza Doggy) | span 0.15 | decor | Sewers W, Sewers H |
| `psx_dosimeter_1` | dosimeter | PSX Mega Pack (Pizza Doggy) | h 0.07 | decor | DUMB K, DUMB S, DUMB R |
| `psx_knife_mp_1` | knife | PSX Mega Pack (Pizza Doggy) | span 0.44 | decor |  |
| `stretcher` | rescue stretcher | Meshy wish list (Claude, 11-16) | span 2.1, model 2.1x0.19x0.96 | decor | DUMB R |
| `rescue_sled` | rescue sled | Meshy wish list (Claude, 11-16) | span 2.2, foot 0.38, rect 2.20x0.76, model 2.2x1.01x0.75 | blocks |  |
| `ice_axe` | ice axe (climbing) | Meshy wish list (Claude, 11-16) | span 0.7, model 0.7x0.07x0.36 | decor |  |
| `item_grapple_gauntlet` | grapple gauntlet | Meshy (Claude, held props 11-03) | span 0.35 | decor |  |
| `meshy_rope` | coil of rope | Meshy (mondo) | span 0.6 | decor | Sewers W, Sewers T, Sewers H |
| `rope_coils` | two big rope coils | Meshy wish list (Claude, 11-16) | span 1.2, model 1.2x0.57x0.8 | decor | Sewers W, Sewers O |
| `rope_bridge` | rope plank bridge, 7 m | Meshy wish list (Claude, 11-16) | span 7, foot 0.85, rect 7.00x1.70, model 7.0x1.5x1.7 | blocks |  |
| `footbridge` | plank footbridge | Meshy (mondo) | span 4.4 | decor |  |
| `wooden_ladder` | plain wooden ladder, 3 m | Meshy wish list (Claude, 11-16) | h 3, model 1.05x3.0x0.17 | decor | Sewers W, Sewers O |
| `manhole_ladder` | iron ladder up a round shaft | Meshy wish list (Claude, 11-16) | h 3.5, foot 0.99, model 1.98x3.5x2.0 | blocks | Sewers W |
| `ladder_wall_rack` | ladders on a wall rack | Meshy (Claude, Civic interiors) | span 3.4 | decor | Sewers T, Sewers O |
| `mine_cart` | mine cart on a short rail | Meshy wish list (Claude, 11-16) | span 2.4, foot 0.61, rect 2.40x1.22, model 2.4x1.62x1.22 | blocks | Cavern K, Sewers O |
| `rail_section` | rail track section | Meshy wish list (Claude, 11-16) | span 3.5, model 3.5x0.22x1.42 | decor | Sewers T, Sewers O |
| `buffer_stop` | rail buffer stop | Meshy wish list (Claude, 11-16) | span 2, foot 0.66, model 1.33x1.04x2.0 | blocks | Sewers T, Sewers O, DUMB P |
| `hand_car` | rail hand car | Meshy wish list (Claude, 11-16) | span 2.5, foot 0.86, model 2.5x1.75x1.72 | blocks | Sewers T |
| `head_wheel` | mine head-frame pulley wheel | Meshy wish list (Claude, 11-16) | h 5, foot 1.04, model 2.75x5.0x2.08 | blocks | Sewers O |
| `pickaxe` | pickaxe | Meshy wish list (Claude, 11-16) | span 0.9, model 0.9x0.09x0.78 | decor | Cavern K, Sewers W, Sewers O |
| `hw_shovel` | shovel | Halloween pack (Elbolilloduro, CC0) | h 0.13 | decor | Sewers W, Sewers O |
| `wheelbarrow` | wheelbarrow | Meshy wish list (Claude, 11-16) | span 1.5, model 1.5x0.55x0.57 | decor | Cavern K, Sewers W, Sewers O |
| `sieve_table` | sieve table | Meshy wish list (Claude, 11-16) | span 1.6, foot 0.76, model 1.51x1.06x1.6 | blocks |  |
| `spell_dynamite` | dynamite | Meshy (mondo) | span 0.22 | decor | Sewers O |
| `anvil` | anvil | Meshy wish list (Claude, 11-16) | h 0.85, foot 0.33, model 0.76x0.85x0.66 | blocks | Cavern K, Sewers O |
| `bellows` | forge bellows | Meshy wish list (Claude, 11-16) | span 1.3, foot 0.25, rect 1.30x0.50, model 1.3x0.86x0.51 | blocks | Sewers O |
| `psx_hand_saw_1` | hand saw | PSX Mega Pack (Pizza Doggy) | span 0.7 | decor | Sewers W, Sewers O |
| `psx_nails_1_rusty` | rusty nails | PSX Mega Pack (Pizza Doggy) | span 0.14 | decor | Sewers W |
| `cable_drum` | cable drum | Meshy (Claude, Industrial interiors) | h 1.4, foot 0.5 | decor | Cavern K, Sewers T, Sewers O, DUMB K, DUMB S |
| `chain_hoist` | chain hoist | Meshy (Claude, Industrial interiors) | h 2 | decor | Sewers W, DUMB K, DUMB R |
| `generator` | generator | Houses on the water (Elbolilloduro, CC0) | span 1.33, foot 0.6 | blocks | Sewers R |
| `signal_lever_frame` | lever frame | Meshy (Claude, Industrial interiors) | span 3 | decor | Cavern K, Sewers T |
| `timber_gate` | heavy log gate with iron straps | Meshy wish list (Claude, 11-16) | span 3.5, foot 0.3, rect 3.50x0.60, model 3.5x3.58x0.6 | blocks |  |
| `braced_gate` | braced gate | Meshy wish list (Claude, 11-16) | span 3, model 3.0x2.51x0.21 | decor |  |
| `psx_beam_1` | beam (PSX structures) | PSX Mega Pack (Pizza Doggy) | h 0.46, foot 2 | decor |  |
| `psx_beam_2` | beam | PSX Mega Pack (Pizza Doggy) | h 0.46, foot 2 | decor |  |
| `psx_tunnel_mp_1_straight` | PSX tunnel module (concrete, not timber) | PSX Mega Pack (Pizza Doggy) | h 2.9, foot 2 | decor |  |
| `trail_sign` | trail sign | Meshy wish list (Claude, 11-16) | h 2.2, foot 0.48, rect 1.56x0.96, model 1.57x2.2x0.96 | blocks | Cavern K |
| `signpost` | blank wooden signpost | Meshy (mondo) | h 2.2, foot 0.2 | blocks | Cavern K, Cavern H, Sewers O |
| `warning_tape` | warning tape decal | code (proc `warning_tape`) | h 0.01 | decor | Cavern K, Sewers H, Sewers R, DUMB K, DUMB S, DUMB R |

## WATER (puddles, pools, sumps, falls)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `floor_drain` | floor drain | Meshy (mondo) | span 0.36 | decor | Cavern K, Sewers W, Sewers H, DUMB S, DUMB R |
| `drain_grate` | storm drain grate | Meshy (mondo) | span 1.2 | decor | Sewers W, DUMB R |
| `culvert_mouth` | culvert mouth: water out of a wall | Meshy (mondo) | h 2.6 | decor | Sewers W, Sewers O |
| `ice_fishing_hole` | round hole of dark water (in ice) | Meshy wish list (Claude, 11-16) | span 1.2, model 1.2x0.44x1.18 | decor |  |
| `ancient_well` | old stone well | Meshy (mondo) | h 1.15, foot 0.42 | blocks |  |
| `wooden_bucket` | wooden bucket | Meshy (mondo) | h 0.16, foot 0.08 | decor | Sewers W, Sewers T, Sewers H, Afterlife K |
| `water_trough` | water trough | Meshy wish list (Claude, 11-16) | span 2.2, model 2.2x0.55x0.6 | decor |  |
| `rowboat` | rowboat | Houses on the water (Elbolilloduro, CC0) | span 3, foot 0.9 | blocks | Cavern K, Cavern H, Sewers W, Sewers O |
| `meshy_rowboat` | rowboat (Meshy) | Meshy (mondo) | span 3.2, foot 1.6 | decor | Sewers O |
| `raft` | log raft | Meshy wish list (Claude, 11-16) | span 3, foot 0.96, model 1.91x2.66x3.0 | blocks |  |
| `dugout_canoe` | dugout canoe | Meshy wish list (Claude, 11-16) | span 5, model 5.0x0.57x1.84 | decor |  |
| `oars` | oars | Meshy wish list (Claude, 11-16) | span 2.4, model 0.68x0.06x2.4 | decor | Sewers W, Sewers O |
| `mooring_piles` | mooring piles | Houses on the water (Elbolilloduro, CC0) | span 1.26, foot 0.6 | blocks | Cavern K |
| `mooring_bollard` | mooring bollard | Meshy wish list (Claude, 11-16) | h 0.7, foot 0.31, model 0.61x0.7x0.61 | blocks | Cavern K, Sewers W, Sewers O |
| `stepping_stones` | stepping stones | Meshy wish list (Claude, 11-16) | span 3, model 3.0x0.13x0.72 | decor |  |
| `psxg_stepping_stone_1` | stepping stone | PSX Halloween Graveyard (BlenderVoyage) | h 0.04 | decor |  |
| `psxg_stepping_stone_2` | stepping stone | PSX Halloween Graveyard (BlenderVoyage) | h 0.05 | decor |  |
| `reeds` | reeds | Meshy wish list (Claude, 11-16) | h 1.8, foot 0.67, model 1.34x1.8x1.35 | blocks | Cavern K |
| `moss_clump` | moss + small ferns | Meshy wish list (Claude, 11-16) | span 0.8, model 0.8x0.37x0.78 | decor | Sewers W, Sewers O |
| `meshy_frog` | frog | Meshy (mondo) | span 0.15 | decor | Cavern K, Sewers W |
| `river_fish` | trout | Meshy wish list (Claude, 11-16) | span 0.5, model 0.13x0.2x0.5 | decor |  |
| `ocean_eel` | eel | Ocean pack (mondo upload) | span 1.8 | decor | Sewers W |
| `ocean_crab` | crab | Ocean pack (mondo upload) | span 0.7 | decor | Sewers W |
| `sea_vent` | black smoker vent (steam vent stand-in) | code (proc `sea_vent`), wears sea_vent (Meshy decor) | h 2.4, foot 0.7 | blocks, real light | Cavern K |
| `fishing_net_wall` | net on a wall | Meshy (Claude, Bayside interiors) | span 2.2 | decor | Sewers W |

## CREATURE / NEST pieces

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `goo_tendril` | tendril of goo, code-drawn | code (proc `goo_tendril`) | h 3.2, foot 0.35 | blocks | Sewers R |
| `tentacle` | kraken tentacle, 6 m | Meshy (mondo) | h 6, foot 0.6 | blocks |  |
| `tentacle2` | kraken tentacle 2 | Meshy (mondo) | h 6, foot 0.6 | blocks |  |
| `meshy_black_blob` | black blob | Meshy (mondo) | h 1, foot 0.5 | decor |  |
| `nightmare_bloom` | flower of teeth | code (proc `nightmare_bloom`), wears nightmare_bloom (Meshy decor) | h 1.9, foot 0.7 | blocks, real light |  |
| `dream_eye` | eye on a stalk | code (proc `dream_eye`), wears dream_eye (Meshy decor) | h 1.6, foot 0.6 | blocks, glow |  |
| `chrysalis` | chrysalis: the nearest thing to a cocoon / egg | Insects pack (mondo upload) | h 0.35 | decor |  |
| `hw_straw` | straw pile (nest bedding) | Halloween pack (Elbolilloduro, CC0) | h 0.86, foot 0.5, rect 1.36x0.66 | blocks | Cavern H |
| `hw_straw_2` | straw pile | Halloween pack (Elbolilloduro, CC0) | h 0.86, foot 0.5, rect 1.10x0.72 | blocks |  |
| `spider` | big hairy wolf spider (0.35 m) | Meshy wish list (Claude, 11-16) | span 0.35, model 0.32x0.1x0.35 | decor | Sewers W, Sewers T, Sewers H, Sewers O |
| `bat_black` | bat | Bats (pack OBJ) drawn by a proc | span 0.45 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O |
| `bat_brown` | bat | Bats (pack OBJ) drawn by a proc | span 0.45 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O |
| `bat_grey` | bat | Bats (pack OBJ) drawn by a proc | span 0.45 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O |
| `rat` | rat | Meshy wish list (Claude, 11-16) | h 0.12, model 0.19x0.12x0.31 | decor | Cavern K, Sewers W, Sewers T, Sewers H, Sewers O, Sewers R, DUMB R |
| `ant_queen` | ant queen (tiny) | Insects pack (mondo upload) | span 0.16 | decor |  |
| `anthill` | anthill | Insects pack (mondo upload) | span 0.7 | decor | Cavern H |
| `caterpillar` | big caterpillar, 2.1 m (Meshy) | Meshy (mondo) | span 2.1, foot 0.6 | decor |  |
| `scorpion` | scorpion | Meshy wish list (Claude, 11-16) | span 0.3, model 0.25x0.2x0.3 | decor |  |
| `cobra` | cobra | Meshy wish list (Claude, 11-16) | h 0.7, foot 0.28, model 0.63x0.7x0.57 | blocks |  |
| `lizard` | lizard | Meshy wish list (Claude, 11-16) | span 0.4, model 0.18x0.1x0.4 | decor |  |
| `wolf` | wolf | Farm / zoo animals (mondo upload) | h 0.85 | decor |  |
| `crow` | crow | Crow + rabbit (mondo upload) | h 0.3 | decor | Sewers O |
| `raven_perch` | raven on a perch | Meshy wish list (Claude, 11-16) | h 0.9, model 0.23x0.9x0.63 | decor |  |
| `owl_perched` | owl | Meshy wish list (Claude, 11-16) | h 0.7, foot 0.22, model 0.45x0.7x0.43 | blocks |  |
| `spell_top_fangs` | top fangs | Top fangs (mondo upload) | span 0.3 | decor |  |
| `ocean_anglerfish_jaws` | anglerfish, jaws open | Ocean pack (mondo upload) | span 1 | decor |  |
| `halloween_character_ghost` | ghost | Halloween pack (Elbolilloduro, CC0) | h 1.87, foot 0.36 | decor |  |
| `meshy_giant_foot` | giant stone foot | Meshy (mondo) | h 2.5, foot 2.33 | decor | Cavern H |

## ANYTHING ELSE THAT FITS (mushrooms, roots, fungus, dead wood)

| catalogue key | what / use | pack / source | size (catalogue) | blocks? | already in a cave room |
|---|---|---|---|---|---|
| `mushroom` | giant mushroom, 3.5 m | Meshy (mondo) | h 3.5, foot 0.5 | blocks | Sewers W |
| `mushroom2` | mushroom, 1.75 m | Meshy (mondo) | h 1.75, foot 0.3 | decor | Cavern K, Cavern H, Sewers W, Sewers O |
| `fern` | fern | Meshy (mondo) | h 0.75 | decor | Sewers W, Sewers O |
| `woods_thornvine` | thorn vine | Meshy (Claude, the Garden plants) | h 1.5, foot 0.4 | decor |  |
| `door_vine` | vine on a wall, code-drawn | code (proc `door_vine`) | h 1.8 | decor, wall-hung |  |
| `rf_grass_1_dark` | dark grass tuft | Retro Foliage kit (AFGameAssets) | span 1.15 | decor |  |
| `psxg_dead_bush_1` | dead bush | PSX Halloween Graveyard (BlenderVoyage) | h 1.17, foot 0.3 | decor |  |
| `psxg_dead_bush_2` | dead bush | PSX Halloween Graveyard (BlenderVoyage) | h 0.77, foot 0.5 | decor |  |
| `stump` | stump | Vegetation (Elbolilloduro, CC0) | h 0.6, foot 0.4 | blocks |  |
| `rf_stump` | stump | Retro Foliage kit (AFGameAssets) | h 0.82, foot 0.3 | blocks |  |
| `rf_oak_stump` | oak stump | Retro Foliage kit (AFGameAssets) | h 0.93, foot 0.5 | blocks |  |
| `fallen_log` | fallen log | Vegetation (Elbolilloduro, CC0) | span 3.6, foot 0.5, rect 3.60x0.90 | blocks | Cavern H, Sewers O |
| `rf_willow_dead_2` | dead willow | Retro Foliage kit (AFGameAssets) | h 2.44, foot 0.7 | blocks |  |
| `hollow_tree` | hollow tree (used in Hollow Earth H) | Retro Tree Pack (Pizza Doggy) | h 6, foot 0.7 | blocks | Cavern H |
| `meshy_dead_tree_with_a_dark_hole` | dead tree with a dark hole | Meshy (mondo) | h 5, foot 2.11 | decor |  |
| `cauldron` | black cauldron | Meshy (mondo) | h 0.8, foot 0.45 | blocks | Cavern K, Sewers O |
| `psx_tin_can_mp_1_rusty` | rusty tin | PSX Mega Pack (Pizza Doggy) | h 0.23 | decor | Sewers W, Sewers T, Sewers H |

## WHAT THE CAVE ROOMS ALREADY USE (keys from the lists above that each district file names)

- **Cavern K** (`docs/areas/cavern/districts/K.js`): `cave_stone` `menhir` `sarsen` `trilithon` `hw_stone_2` `ocean_rock` `ocean_rock_8` `ocean_rock_11` `asteroid_a` `asteroid_b` `decor_stone_arch` `meshy_crystal_shards` `crystal_cluster` `cave_torch` `candleRing` `hw_candles` `campfire` `ship_lantern` `lantern_post` `bare_bulb` `woods_glowcap` `fae_toadstool` `skull` `skull_pile` `psx_fish_skeleton_mp_1` `hw_body` `hw_part_1` `hw_part_3` `wall_chains` `trap_chain_draped` `stocks` `trap_iron_maiden` `psx_cobweb_1` `psx_cobweb_2` `canvas_tent` `sleeping_bag` `backpack` `firewood_stack` `psx_old_mattress_mp_1` `cot` `psx_supply_crate_1` `psx_wooden_crate_1` `psx_wooden_crate_2` `sea_chest` `footlocker` `wooden_barrel` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `meshy_burlap_sack` `meshy_sandbags` `psx_walkie_talkie_1` `mine_cart` `pickaxe` `wheelbarrow` `anvil` `cable_drum` `signal_lever_frame` `trail_sign` `signpost` `warning_tape` `floor_drain` `rowboat` `mooring_piles` `mooring_bollard` `reeds` `meshy_frog` `sea_vent` `bat_black` `bat_brown` `bat_grey` `rat` `mushroom2` `cauldron`
- **Cavern H** (`docs/areas/cavern/districts/H.js`): `ocean_rock_5` `meshy_crystal_shards` `crystal_cluster` `brazier` `campfire` `woods_glowcap` `dinosaur_skeleton` `stone_altar` `sea_chest` `signpost` `rowboat` `hw_straw` `anthill` `meshy_giant_foot` `mushroom2` `fallen_log` `hollow_tree`
- **Cavern A** (`docs/areas/cavern/districts/A.js`): `meshy_crystal_shards` `candleRing` `brazier` `stone_altar` `sea_chest`
- **Sewers W** (`docs/areas/sewers/districts/W.js`): `psxg_rock_1` `psxg_rock_3` `psx_brick_1` `cave_torch` `candle_ring` `hw_candles` `lit_candle` `brazier` `ship_lantern` `railway_lantern` `cage_lamp` `bare_bulb` `strobe_lamp` `psx_flashlight_1` `skull` `psx_fish_skeleton_mp_1` `hw_body` `hw_body_2` `hw_part` `hw_part_3` `hw_part_4` `hw_part_5` `hw_part_6` `hw_part_7` `floor_stain` `wall_chains` `trap_chain_draped` `psx_cobweb_1` `psx_cobweb_2` `psx_cobweb_4` `psx_cobweb_5` `sleeping_bag` `backpack` `kettle` `psx_old_mattress_mp_1` `cot` `psx_supply_crate_1` `psx_supply_crate_1_empty` `psx_wooden_crate_1` `psx_wooden_crate_2` `psx_wooden_crate_3` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `psx_metal_barrel_mp_3` `psx_jerrycan_1` `meshy_burlap_sack` `meshy_sandbags` `psx_canned_food_mp_1` `psx_canned_food_mp_5_rusty` `psx_bandage_mp_1` `psx_pills_bottle_1` `psx_healing_potion_mp_1` `psx_glass_bottle_1` `psx_walkie_talkie_1` `psx_lighter_mp_1` `meshy_rope` `rope_coils` `wooden_ladder` `manhole_ladder` `pickaxe` `hw_shovel` `wheelbarrow` `psx_hand_saw_1` `psx_nails_1_rusty` `chain_hoist` `floor_drain` `drain_grate` `culvert_mouth` `wooden_bucket` `rowboat` `oars` `mooring_bollard` `moss_clump` `meshy_frog` `ocean_eel` `ocean_crab` `fishing_net_wall` `spider` `bat_black` `bat_brown` `bat_grey` `rat` `mushroom` `mushroom2` `fern` `psx_tin_can_mp_1_rusty`
- **Sewers T** (`docs/areas/sewers/districts/T.js`): `psx_brick_1` `hearth_fire` `railway_lantern` `cage_lamp` `bare_bulb` `strobe_lamp` `psx_flashlight_1` `psx_flashlight_mp_1` `skull` `skull_pile` `femur` `anatomy_skeleton` `hw_body_2` `hw_part_2` `floor_stain` `hw_web` `hw_web_2` `hw_web_3` `psx_cobweb_1` `missing_board` `sleeping_bag` `backpack` `kettle` `psx_old_mattress_mp_1` `cot` `folding_chair` `psx_supply_crate_1` `psx_wooden_crate_1` `footlocker` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `psx_metal_barrel_mp_3` `psx_jerrycan_1` `psx_canned_food_mp_1` `psx_glass_bottle_1` `field_radio` `meshy_rope` `ladder_wall_rack` `rail_section` `buffer_stop` `hand_car` `cable_drum` `signal_lever_frame` `wooden_bucket` `spider` `bat_black` `bat_brown` `bat_grey` `rat` `psx_tin_can_mp_1_rusty`
- **Sewers H** (`docs/areas/sewers/districts/H.js`): `railway_lantern` `cage_lamp` `bare_bulb` `strobe_lamp` `skull` `hw_part_3` `hw_part_5` `floor_stain` `chain_bunk` `wall_chains` `trap_chain_draped` `psx_cobweb_1` `psx_cobweb_2` `psx_cobweb_4` `psx_cobweb_5` `backpack` `psx_old_mattress_mp_1` `cot` `folding_chair` `footlocker` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `psx_jerrycan_1` `psx_glass_bottle_1` `psx_lighter_mp_1` `meshy_rope` `warning_tape` `floor_drain` `wooden_bucket` `spider` `bat_black` `bat_brown` `bat_grey` `rat` `psx_tin_can_mp_1_rusty`
- **Sewers O** (`docs/areas/sewers/districts/O.js`): `cave_stone` `ore_heap` `psx_brick_1` `hw_bricks` `hw_bricks_2` `meshy_crystal_shards` `meshy_crystal_shard` `crystal_cluster` `catacomb_wall` `cave_torch` `hw_candles` `hw_candles_2` `candelabra` `brazier` `hearth_fire` `campfire` `ship_lantern` `railway_lantern` `woods_glowcap` `ocean_anglerfish` `skull_pile` `psx_fish_skeleton_mp_1` `anatomy_skeleton` `hw_body` `hw_body_2` `hw_part` `hw_part_3` `hw_coffin` `hw_coffin_lid` `sarcophagus` `bird_cage` `wall_chains` `stocks` `hw_web` `hw_web_2` `hw_web_3` `psx_cobweb_1` `psx_cobweb_2` `hooded_statue` `missing_board` `sleeping_bag` `kettle` `firewood_stack` `psx_old_mattress_mp_1` `psx_supply_crate_1` `psx_wooden_crate_1` `psx_wooden_crate_2` `psx_wooden_crate_3` `psx_wooden_crate_4` `psx_wooden_crate_5` `psx_wooden_crate_6` `wooden_barrel` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `psx_metal_barrel_mp_3` `psx_jerrycan_1` `meshy_sandbags` `psx_glass_bottle_1` `psx_open_book_mp_1` `rope_coils` `wooden_ladder` `ladder_wall_rack` `mine_cart` `rail_section` `buffer_stop` `head_wheel` `pickaxe` `hw_shovel` `wheelbarrow` `spell_dynamite` `anvil` `bellows` `psx_hand_saw_1` `cable_drum` `signpost` `culvert_mouth` `rowboat` `meshy_rowboat` `oars` `mooring_bollard` `moss_clump` `spider` `bat_black` `bat_brown` `bat_grey` `rat` `crow` `mushroom2` `fern` `fallen_log` `cauldron`
- **Sewers R** (`docs/areas/sewers/districts/R.js`): `cage_lamp` `bare_bulb` `woods_glowcap` `skull` `skull_pile` `psx_fish_skeleton_mp_1` `hw_body` `hw_body_2` `hw_part_1` `hw_part_3` `hw_part_5` `floor_stain` `wall_chains` `psx_cobweb_1` `psx_cobweb_2` `psx_supply_crate_1` `psx_supply_crate_1_empty` `footlocker` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `psx_metal_barrel_mp_3` `generator` `warning_tape` `goo_tendril` `rat`
- **Afterlife K** (`docs/areas/afterlife/districts/K.js`): `cave_torch` `candle_ring` `brazier` `skull_pile` `hw_coffin` `psxg_coffin` `trap_coffin_open` `sarcophagus` `hw_coffin_2` `wooden_cross` `wall_chains` `stone_altar` `wooden_bucket`
- **Afterlife D** (`docs/areas/afterlife/districts/D.js`): `cave_torch` `hearth_fire` `hearth_fire_blue` `light_glow` `skull_pile` `psxg_tombstone_1` `psxg_tombstone_3` `wall_chains` `stocks`
- **Afterlife R** (`docs/areas/afterlife/districts/R.js`): `cave_stone` `menhir` `cave_torch` `torch_red` `brazier` `light_glow` `skull_pile` `wall_chains` `demon_statue`
- **Afterlife L** (`docs/areas/afterlife/districts/L.js`): `brazier` `skull_pile` `wall_chains` `stocks` `stone_altar` `demon_statue`
- **Afterlife W** (`docs/areas/afterlife/districts/W.js`): `cave_torch` `brazier` `skull_pile` `wall_chains` `demon_statue`
- **DUMB K** (`docs/areas/dumb/districts/K.js`): `floating_orb` `floor_stain` `map_table` `psx_metal_barrel_mp_1` `psx_dosimeter_1` `cable_drum` `chain_hoist` `warning_tape`
- **DUMB P** (`docs/areas/dumb/districts/P.js`): `railway_lantern` `floor_stain` `psx_jerrycan_1` `meshy_sandbags` `buffer_stop`
- **DUMB S** (`docs/areas/dumb/districts/S.js`): `bare_bulb` `psx_flashlight_1` `hw_body` `floor_stain` `psx_old_mattress_mp_1` `psx_supply_crate_1` `footlocker` `psx_metal_barrel_mp_1` `psx_metal_barrel_mp_2` `meshy_sandbags` `psx_walkie_talkie_1` `field_radio` `psx_dosimeter_1` `cable_drum` `warning_tape` `floor_drain`
- **DUMB R** (`docs/areas/dumb/districts/R.js`): `floating_orb` `anatomy_skeleton` `hw_body` `meat_hook` `floor_stain` `bird_cage` `psx_old_mattress_mp_1` `cot` `psx_metal_barrel_mp_1` `psx_pills_bottle_1` `psx_dosimeter_1` `stretcher` `chain_hoist` `warning_tape` `floor_drain` `drain_grate` `rat`
- **DUMB C** (`docs/areas/dumb/districts/C.js`): `map_table` `wooden_barrel` `psx_glass_bottle_1` `field_radio`

## ON R2 OR IN THE SCRIPTS, BUT NOT A CATALOGUE KEY (NOT WIRED as a prop)

MODEL_LIST §13 lists 3,529 files not named in the tables; almost all are `.opt` / `.lod` copies or source formats of wired models.
The ones that touch this theme:

| file / name | where | state |
|---|---|---|
| `eyeball` | `Assets/world/props/meshy/eyeball/eyeball.obj` (MODEL_LIST §7f) | NOT WIRED: a script loads it by URL; no catalogue key |
| Halloween `Character.fbx`, `Character_Witch.fbx` | `Assets/world/packs/elbolilloduro_halloween/characters/` (§13) | NOT WIRED: on R2, the game does not load them (only `halloween_character_ghost` is a row) |
| Traps `Chain_Draped-colonly.glb`, `Coffin_Wood-colonly.glb`, `Coffin_Wood_Lid-convcolonly.glb`, `Iron_Maiden-colonly.glb` | `Assets/world/packs/traps/` (§13) | NOT WIRED: collision-only copies, 0.0 MB; the drawn pieces are the `trap_*` rows above |
| Quaternius `DeadTree_*`, `DeadBirch_*` | `Assets/world/nature/OBJ/` (§7d) | tree KINDS `tree_13`..`tree_20`, `tree_31`..`tree_42` (HQ_TREE_KINDS), planted as trees, not catalogue props |
| `fae_cap`, `fae_cap_2` | the two mushroom files (§7d) | tree KINDS (HQ_TREE_KINDS), not catalogue props; the catalogue rows on the same files are `mushroom`, `mushroom2`, `fae_mushroom`, `fae_toadstool`, `woods_glowcap` |
| giant spider, skeleton, shadow monster, swamp monster | `Assets/characters/races/voidweaver/…`, `…/skeleton/…`, `…/shadowentity/…`, `…/swampmonster/…` | unit (race) models, not props: an NPC / enemy job, not dressing |
| the WATERFALL | `{ k: 'fall', … }` terrain row (areas-complexes.md "THE WATERFALLS"; the Sewers use three) | not a model: a terrain row on a lip between two water levels |
| puddles, pools, black sumps | terrain water cells (`'w'`, `stream` / `pool` rows; the Grotto pool in K.js `plan`) | not a model: terrain |
| stalagmites + boulders at the wall feet | K.js PASS 1 "THE ROCK KIT": code `dome` + `cyl` parts in an `arch` row, `rocks_5` / `obsidian` sheets, "drawn only: nothing here blocks a walk" | code shapes, no model file |

## NEEDS A MODEL — horror-cave things the game has nothing for

Checked against all 2,269 catalogue rows, §7, §10A / §10E, §13 and the wish list. Before any Meshy prompt: THE PACK-FIRST RULE
(MODEL_LIST top; §12) and mondo's OK on the concept.

1. **Stalagmite / stalactite / cave column** — no model; K.js draws code cones and domes. (`icicles` is a row of ice icicles under an ice strip, 2.0 x 1.21 x 0.2 m, not rock.)
2. **Flowstone / dripstone curtain** on a wall — none.
3. **Creature eggs / egg sacs / a clutch** — no egg prop at all (`egg_chair` is a chair; `chrysalis` is a 0.35 m butterfly chrysalis).
4. **A creature nest** of bones, hide and debris — none (`hw_straw` / `hw_straw_2` are farm straw piles; `anthill` is an ant mound).
5. **Webbed cocoon / a body wrapped in web** — none (the webs are flat cards: `hw_web*`, `psx_cobweb_*`).
6. **Mixed bone pile, ribcage, animal carcass** — none (`skull_pile` is skulls only; `femur`, `ulna`, `skull` are single bones; `anatomy_skeleton` stands upright).
7. **A dead caver** (helmet, harness, rope) — none (`astronaut` is a space suit; `hw_body*` are the Halloween pack bodies).
8. **Caving helmet with a headlamp, climbing harness, carabiners, pitons / bolts** — none.
9. **A rope hanging down a pitch / a fixed line on anchors, a rope ladder** — none (`meshy_rope` is a coil, `rope_coils` lie on the floor; the Meshy concept rule bans strings and cords, so this one is a code or pack job).
10. **Mine timber set** (props, cap beams, lagging) — none; still on MODEL_LIST §10E (the Sewers' "mine timber set"). `psx_beam_1` / `_2` are PSX building beams.
11. **A rock squeeze / crawl tunnel piece** — none (`psx_tunnel_*` are concrete tunnels).
12. **Blood pool, gore splatter, slime** — only the `floor_stain` decal (MODEL_LIST §10D counts decals as not a model job).
13. **Glow-worm threads on a ceiling, wall fungus (bracket fungus), roots hanging from the roof** — none (`door_vine` is a wall vine proc; the mushrooms all stand on the floor).
14. **A cave crawler / the creature itself as a prop** (a corpse of one, a statue of one) — none in the catalogue (only race unit models, above).
15. **A drowned / sump diving kit** (old tank, mask) — none (`deep_sea_diver_helmet` is unit gear, §7f).
