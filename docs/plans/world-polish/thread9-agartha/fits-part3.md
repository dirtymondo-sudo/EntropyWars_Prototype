# AGARTHA FITS, part 3: MODEL_LIST.md lines 2470-4588

Reader's shortlist for thread 9 (Agartha crystal city + the Descent labyrinth + the Lemuria adit). Covers the smaller packs
(end of §6), §7 spell props / sky / animals / foliage, §8 code stand-ins, §8b horizon builders, §10, §11, §12, §12b PSX Mega
Pack, §13 every R2 model file not in the tables. Keys copied exactly from MODEL_LIST.md. Sizes: the list gives none per file
in these sections; §12b / §13 give MB per folder only (quoted where useful).

Two licence flags met in this range:
- **PSX Mega Pack (Pizza Doggy licence):** NO AI use of any kind (never a concept, render or reference for Meshy); files live on R2 only.
  Catalogue keys are `psx_<file>` (§12b, every one of the 584 GLBs is a row, none placed in a room yet).
- **Stairs & Railings (ATD-London, CC-BY 4.0):** credit required.

## TOP 10 FINDS

1. `greek_column` · Meshy decor (`Assets/world/props/meshy_decor/greek_column.glb`) · the new white Meshy column, already the standing columns of `_hzGreekRuin`: the marble terrace colonnade.
2. `crystalShard` / `crystalShards` · Meshy spell props (`Assets/world/props/meshy/Meshy_AI_crystal_shard_1027232226_texture.glb`, `..._crystal_shards_1027232219_texture.glb`) · loose shards + a cluster; plus the `crystals (_CRYSTAL_MODEL_URLS)` set the existing `agartha` near setting, `crystal` and `geode` monuments already use.
3. `ancient_walkway` · Meshy 7b (`Assets/world/props/meshy/Meshy_AI_ancient_walkway_0917035609_texture.glb`) · an ancient stone walkway: the crystal-bridge / terrace-span starting point.
4. `bat_black` / `bat_brown` / `bat_grey` · bats pack OBJ (`Assets/world/animals/bats/bat_*.obj`, the `bat_` procs) · cave bats, already wired.
5. `skull_pile` + `catacomb_wall` · Meshy 7b · the bone pit and the bone-walled passages.
6. `cave_torch` (+ procs `torch_blue`, `torch_green`, `torch_red`, `torch_white`) and `wall_torch` (wears `wall_torch_bracket`) · Meshy decor · standing and wall torches in four colours: the city's white/blue light and the labyrinth's red.
7. PSX tunnels `psx_tunnel_mp_1_straight` / `_straight_inclined` / `_elbow` / `_tee` / `_cross_tee`, `psx_tunnel_entrance_platform_1` · PSX Mega Pack `modular_structures` · the Lemuria adit tube (licence: no AI use).
8. Wishlist mine set on R2 (Meshy, not wired): `mine_cart`, `rail_section`, `pickaxe`, `ore_heap`, `wooden_ladder`, `rope_bridge`, `rope_coils`, `hand_car` · `Assets/world/props/meshy/wishlist/<name>.opt.glb` · the whole adit + abandoned camp kit.
9. Wishlist camp set on R2 (not wired): `canvas_tent`, `sleeping_bag`, `backpack`, `lean_to`, `stretcher`, `oil_lamp`, `ice_axe` + wired `campfire`, `camping_tent`, `ship_lantern`, `flair` (flare gun gear) · the Descent explorers' camp.
10. `Meshy_AI_loch_ness_monster_re_biped_Character_output` (race, `Assets/opt/` copy) + `Jellyfish_Bioluminescent` / `Anglerfish_Lure_Lit` (ocean pack, `Assets/opt/`) + `rowboat` · the lake, its monster and glowing water life.

---

## CITY ARCHITECTURE

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `greek_column` | Meshy decor | — | white Meshy column (`meshy_decor/greek_column.glb`) | best marble column; `_hzGreekRuin` standing columns |
| `greekcol` | Meshy 7b | — | older Meshy greek column (`Meshy_AI_greek_column_0727195651_texture.glb`) | used by `heaven`, `olympus`, `atlantis` near settings |
| `stone_arch` | Meshy decor | — | curved stone arch (`meshy_decor/stone_arch.glb`) | `gateway` / `arch` monuments; city gates, passage mouths |
| `ancient_walkway` | Meshy 7b | — | ancient stone walkway | bridge / terrace span base |
| `obelisk` | Meshy decor | — | granite obelisk | city plaza markers; `_hzObelisk` |
| `obelisk3d` | Meshy 7b | — | older Meshy obelisk | |
| `trilithon` | Meshy 7b | — | two posts + lintel | ancient gate / labyrinth relic |
| `t_pillar` | Meshy decor | — | Göbekli T-pillar | ancient-civilisation carving pillar |
| `menhir` / `standingstone` | Meshy 7b | — | standing stones | `standingstone` already in the `agartha` near setting |
| `angel_statue` | Meshy 7b | — | angel statue | tint white marble for terrace statues |
| `demon_statue` | Meshy 7b | — | demon statue | labyrinth idol |
| `pearly_gate` | Meshy 7b | — | ornate gate | city gate if gold reads right |
| `vatican_dome` | Meshy 7b | — | big dome | a temple dome under the Spire; `dome` landmark wears it |
| `stained_glass` | Meshy 7b | — | stained glass window | lit-from-inside crystal windows |
| `brick_arch` | Meshy 7b | — | brick arch section | adit / old-mine arch rather than city |
| `castle_wall`, `castle_gate`, `castle_tower`, `castle_tower_top`, `castle_cone` | Castle and Fort Builder (McSteeg) | — | `Castles_and_Forts.glb#…` | its `Wall_2x4_ruined`, `Wall_2x2_ruined`, `Tower_mid_hollow_ruined` (§11 #6) = ruined outer works / old Lemurian walls |
| `babel_house_row`, `babel_house_small`, `babel_house_stair`, `babel_house_yard` | Meshy (Babel) | — | ancient terraced houses | check style; stepped houses suit terraces |
| `psx_arc_1_wall_1`, `psx_arc_2_wall_1`, `psx_half_arc_pillar_1_wall_1_plain`, `psx_half_arc_pillar_2_tall_wall_1_plain`, `psx_pillar_1` … `psx_pillar_3` | PSX Mega Pack `modular_structures` (77.2 MB for the folder) | — | arched walls, arcade pillars | keys = `psx_<file>`; PS1 textures, real metres (wall 4 x 3 m); NO AI use |
| `psx_stairs_3`, `psx_stairs_4`, `psx_stairs_5_concrete`, `psx_stairs_mp_1`, `psx_catwalk_1`, `psx_beam_1` … `psx_beam_5` | PSX Mega Pack `modular_structures` | — | stairs, catwalk, beams | terrace stairs / walkways |
| `Assets/world/packs/stairs/stairs.glb`, `stairs_railings.glb` | Stairs & Railings · ATD-London · CC-BY 4.0 | 32.0 MB (both) | stair flights + railings (HQ_STAIR_PACK) | terrace stairs; credit required |
| `trap_sarcophagus_box` / `trap_sarcophagus_lid`, `sarcophagus` | traps pack / Meshy 7b | — | stone sarcophagus | the secret kept room |
| `royal_throne` | Meshy 7b | — | throne | council hall |
| `fountain` | Meshy decor | — | park fountain | city plaza |
| `hero_statue_crossed` / `hero_statue_landing` | Meshy (Hero Plaza) | — | superhero statues | probably wrong era, skip unless re-tinted |

## CRYSTALS AND GLOW

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `crystalShard` | Meshy spell prop | — | one crystal shard | scatter, Spire facets |
| `crystalShards` | Meshy spell prop | — | shard cluster | crystal pockets |
| `crystals (_CRYSTAL_MODEL_URLS)` | (files listed outside this range) | — | mondo's 11-02 gem clusters | used by near setting `agartha`, `hollow_earth`, monuments `crystal`, `geode`, roster `_hzCrystalShards` |
| `crystal_cluster` | §8 code proc (44 uses) | — | gem-cluster stand-in | KEPT by mondo (§10C) |
| `geode` | §8b-E monument (crystals + Sphere + glow sprites) | — | a geode | crystal pockets in the labyrinth |
| `crystalBall` | Meshy spell prop | — | crystal ball | small glowing orb on plinths |
| `floating_orb` | §8 code proc | — | 1.9 m lit plinth + orb | glowing city lamps / Spire core |
| `_hzSacredRings`, `_hzAstralOrbs`, `_hzMonolith`, `_hzModelPlanet` | §8b-A far roster, theme `crystals` | — | code rings / glow orbs / box monolith | the far roster already has a `crystals` theme |
| `innersun` | §8b-E monument (code) | — | an inner sun | the cave's big light / Spire glow |
| `lightpillar` / `_hzLightPillar` | §8b | — | draws nothing (empty group) | do not use |
| `mushroom_lamp` | Meshy decor | — | glowing mushroom lamp | cave glow fungus |
| `mushroom`, `mushroom2`, `fae_cap`, `fae_cap_2` | Meshy 7b / 7d | — | mushrooms | already in the `agartha` near setting |
| `holo_projector` | Meshy (internet) | — | holo projector | "advanced civilisation" tech, check look |
| `star_projector` | Meshy decor | — | planetarium projector | observatory in the city |
| `brass_orrery` | Meshy (University) | — | brass orrery | the ancients' sky model (no sky down here: a point) |
| `teslaCoil` | Meshy spell prop | — | tesla coil | Vril / power tech |
| `meteorite_plinth` | Meshy (University) | — | rock on a plinth | a crystal relic display |
| `hearth_fire_blue`, `hearth_fire_white` | §8 code procs | — | blue / white fire | city fire bowls |
| `light_glow`, `light_shaft` | §8 code procs (10D: light effects) | — | glow / shaft | Spire light spill |
| `crystal_chandelier` | Meshy (line 2272, outside this range) | — | crystal chandelier | the council hall |

## CITY FURNISHING

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `round_table` | Meshy decor | — | round table (Camelot) | council table |
| `stone_altar` | Meshy decor | — | stone altar | temple / secret kept room |
| `library_shelf_full` | Meshy 7b | — | shelf of books | the archive |
| `library_chandelier` | Meshy (University) | — | chandelier | |
| `museum_vitrine` | Meshy (Sports + Culture) | — | glass display case | relic hall |
| `greek_amphora` | Meshy (Sports + Culture) | — | amphora | terrace dressing |
| `gallery_ottoman` | Meshy | — | gallery bench | |
| `rope_stanchion` | Meshy (University) | — | rope barrier | |
| `banner` | Meshy decor | — | heraldic banner | re-tint white/gold |
| `holy_carpet` | Meshy 7b | — | ornate carpet | throne hall |
| `candelabra`, `votive_stand` | Meshy (Southside) | — | candelabra, votive rack | |
| `instrument_harp`, `instrument_drum` | Instruments + orchestral | — | harp, drum | nordic hall |
| `taiko_drum` | Meshy (Southside) | — | big drum | |
| `tulip_chair`, `tulip_table`, `egg_chair`, `space_divider` | Meshy decor | — | white space-age furniture | white smooth "advanced" look; maybe for machine-elf rooms |
| `Assets/world/props/meshy/wishlist/greek_couch.opt.glb`, `lyre.opt.glb`, `laurel_wreath.opt.glb`, `gong.opt.glb`, `sundial.opt.glb`, `bird_bath.opt.glb`, `stone_lantern.opt.glb`, `woven_baskets.opt.glb`, `market_stall.opt.glb`, `trestle_table.opt.glb` | Meshy wish list (§13, not wired) | 146.6 MB folder | classical / market dressing | terraces, market |

## CAVE ROCK AND SHAPE

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `asteroid_a` / `asteroid_b` | D.O.O.R. kit upload | — | rocks (`asteroid_1.glb`, `asteroid_2.glb`) | in `agartha`/`hollow_earth` near settings; §8b: stretched into a massif they read as blobs |
| `menhir`, `standingstone` | Meshy 7b | — | standing stones | stalagmite stand-in at best |
| `cave_stone` | Meshy (line 1361, outside range) | — | standing stone file | |
| `sea_vent` | Meshy decor | — | black smoker rock chimney | a tall dark rock column / stalagmite candidate |
| `Assets/halloween/models/halloween.fbx` nodes `Stone`, `Stone_01` … `Stone_05` | Halloween · Elbolilloduro · CC0 (§7e) | — | small stones | floor rubble |
| `Assets/world/props/meshy/wishlist/lake_rock.opt.glb`, `cairn.opt.glb`, `ore_heap.opt.glb`, `stepping_stones.opt.glb`, `moss_clump.opt.glb` | Meshy wish list (not wired) | — | rocks, cairn, ore, stepping stones, moss | cave floor + lake shore |
| `Assets/world/props/meshy/wishlist/icicles.opt.glb`, `ice_block.opt.glb` | Meshy wish list | — | icicles, ice block | icicles tinted = small stalactites? eye check |
| `fl_*`, `rf_willow_*_blue` | §7d foliage | — | trees | no cave plant; the blue willow only if a lit garden terrace wants one |
| (none) | — | — | no stalactite, stalagmite, cave wall, cliff or chasm-edge model in this range | see NEEDS |

## HORROR CAVE

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `skull_pile` | Meshy 7b | — | skull heap | bone pit |
| `catacomb_wall` | Meshy 7b | — | bone wall | bone-lined passage |
| `skull`, `femur`, `ulna` | Meshy spell props | — | single bones | scatter round the nest |
| `anatomy_skeleton` | Meshy (University) | — | full skeleton | dead explorer (lab stand look: check) |
| `dinosaur_skeleton` | Meshy (University) | — | big skeleton | giant bones in the bone pit |
| `psx_fish_skeleton_mp_1` | PSX Mega Pack | — | fish bones | sump shore |
| `Assets/world/props/meshy/wishlist/cattle_skull.opt.glb` | Meshy wish list | — | animal skull | |
| Halloween `Body`, `Body001`, `Body_01`, `Body_part` … `Body_part_09`, `Coffin`, `Coffin_Top` | Halloween · CC0 (§7e) | — | body parts | the nest's kill heap (`_hzFleshMound` / `fleshmound` already does a heap) |
| `trap_spike_pit`, `trap_hole`, `trap_hole_spear`, `trap_hole_dart`, `trap_pressure_plate`, `trap_trip_wire`, `trap_trip_wire_broken`, `trap_bear_base` / `trap_bear_jaw` | Traps pack | — | pits, holes, trip wire, bear trap | the pits; the trip wire for the camp |
| `trap_chain_draped`, `trap_chain_straight`, `wall_chains` | Traps pack | — | chains | |
| `trap_coffin_wood` / `trap_coffin_lid`, `trap_iron_maiden_body` | Traps pack | — | coffin, iron maiden | kept room |
| `psx_cobweb_1`, `psx_cobweb_2`, `psx_cobweb_4`, `psx_cobweb_5` | PSX Mega Pack `decals` | 0.1 MB | cobweb cards | squeezes, nest |
| `meat_hook` | Meshy decor | — | hook rail | nest larder |
| `blackBlob` | Meshy spell prop | — | black blob | goo / nest |
| `goo_tendril` | §8 code proc | — | goo tendril | |
| `eyeball` | `Assets/world/props/meshy/eyeball/eyeball.obj` (7f) | — | eyeball | |
| `missing_board` | Meshy (Woods horror pass) | — | missing-persons board | lost caving team notice at the camp |
| `Assets/world/props/meshy/wishlist/hooded_statue.opt.glb`, `weeping_angel.opt.glb`, `cage_lamp.opt.glb`, `chain_bunk.opt.glb` | Meshy wish list | — | statues, cage lamp, chain bunk | |

## THE OLD CAMP / MINE

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `campfire` | Survival PSX · CC0 | — | campfire | camp |
| `camping_tent` | Survival PSX · CC0 | — | tent | camp |
| `ship_lantern` (+ `lantern`) | Survival PSX · CC0 | — | hanging lantern | camp light |
| `locker` | Mine · Elbolilloduro · CC0 | — | mine locker | adit changing room; §10E: the mine pack also has `Rails` (not cut out yet) |
| `generator` | Houses on the water · CC0 | — | generator | camp power |
| `railway_lantern`, `chain_hoist`, `cable_drum`, `gas_cylinder_rack`, `high_bay_lamp`, `maintenance_stairs`, `gate_valve`, `gauge_board`, `signal_lever_frame` | Meshy (Industrial) | — | mine machinery | the adit's winding gear |
| `tool_chest`, `engine_hoist`, `welding_cart` | Meshy | — | tools | |
| `flood_mast` | Meshy decor | — | floodlight mast | the expedition's work light |
| `flair` | gear (`Assets/world/props/misc/flare_gun.glb`) | — | flare gun | The Descent's red flares |
| `binoculars`, `walkie_talkie`, `dowsing_rod` | gear | — | explorer kit | |
| `metal_detector` | Meshy | — | metal detector | |
| `rope`, `sack` | Meshy spell props | — | rope coil, burlap sack | |
| `psx_supply_crate_1` (+ `_empty` / colour variants), `psx_wooden_crate_1` … `_6`, `psx_metal_barrel_mp_0` … `_3`, `psx_jerrycan_1` | PSX Mega Pack `large_props` / `small_props` | — | crates, barrels, jerrycan | camp stores |
| `psx_flashlight_1`, `psx_flashlight_mp_1`, `psx_canned_food_mp_5_rusty`, `psx_bandage_mp_1`, `psx_pills_bottle_1`, `psx_walkie_talkie_1`, `psx_notebook_1`, `psx_old_mattress_mp_1`, `psx_ammo_box_mp_1`, `psx_lighter_mp_1`, `psx_padlock_1` | PSX Mega Pack `items_and_weapons` | — | dead team's kit | camp clutter |
| `psx_tunnel_mp_1_straight`, `psx_tunnel_mp_1_straight_inclined`, `psx_tunnel_mp_1_elbow`, `psx_tunnel_mp_1_tee`, `psx_tunnel_mp_1_cross_tee`, `psx_tunnel_1`, `psx_tunnel_entrance_platform_1`, `psx_wall_1_tunnel_hole` | PSX Mega Pack `modular_structures` | — | tunnel tubes | the Lemuria adit (concrete look: eye check) |
| `psx_pipe_1`, `psx_pipe_1_corner`, `psx_pipe_valve_holder_large_1`, `psx_pipes_holder_1` | PSX Mega Pack | — | pipes | adit services |
| `culvert`, `drain_grate` | Meshy 7b | — | culvert mouth, grate | adit drain |
| `pd_lever` | Meshy (plot dungeons) | — | lever | old mine gate |
| `Assets/world/props/meshy/wishlist/mine_cart.opt.glb`, `rail_section.opt.glb`, `hand_car.opt.glb`, `buffer_stop.opt.glb`, `pickaxe.opt.glb`, `ore_heap.opt.glb`, `wheelbarrow.opt.glb`, `sieve_table.opt.glb`, `timber_gate.opt.glb`, `braced_gate.opt.glb`, `wooden_ladder.opt.glb`, `manhole_ladder.opt.glb`, `rope_bridge.opt.glb`, `rope_coils.opt.glb`, `wooden_barrel.opt.glb`, `tunnel_signal.opt.glb`, `valve_wheel.opt.glb`, `fire_danger_sign.opt.glb`, `trail_sign.opt.glb` | Meshy wish list (§13, not wired) | — | the mine + ladders + rope bridge | biggest single source for the adit + labyrinth climbs |
| `Assets/world/props/meshy/wishlist/canvas_tent.opt.glb`, `sleeping_bag.opt.glb`, `backpack.opt.glb`, `lean_to.opt.glb`, `firewood_stack.opt.glb`, `stretcher.opt.glb`, `rescue_sled.opt.glb`, `oil_lamp.opt.glb`, `kettle.opt.glb`, `ice_axe.opt.glb`, `hazmat_suit.opt.glb`, `radiation_drum.opt.glb` | Meshy wish list (not wired) | — | explorers' camp | abandoned camp |
| `footbridge` | Meshy 7b | — | plank footbridge | chasm crossing in the labyrinth |

## WATER / SUMP

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `rowboat` | Houses on the water · CC0 | — | rowboat | the lake |
| `mooring_piles` | Houses on the water · CC0 | — | piles | lake jetty |
| `skiff` | Meshy decor | — | small boat | |
| `submarine` | Meshy decor | — | bathyscaphe | a sunk expedition sub in the lake? |
| `ancient_well` | Meshy 7b | — | ancient well | city well over the lake |
| `giant_clam`, `anemone` | Meshy decor | — | sea life | probably not (fresh water) |
| `sea_vent` | Meshy decor | — | black smoker | a vent in the black sump |
| `tentacle` / `tentacle2` | Meshy 7b | — | kraken tentacle | things in the sump |
| `Assets/opt/Jellyfish_Bioluminescent.opt.glb`, `Jellyfish_Moon_Jelly.opt.glb`, `Jellyfish_Pulsing_Frames.opt.glb` | ocean pack (opt copies) | — | glowing jellyfish | lake glow life |
| `Assets/opt/Anglerfish_Lure_Lit.opt.glb`, `Anglerfish_Lure_Dim.opt.glb`, `Anglerfish_Jaws_Open.opt.glb` | ocean pack (opt copies) | — | anglerfish | the black sump's horror |
| `fish_school` | §8 code proc | — | instanced fish school | lake |
| `deep_sea_diver_helmet` | gear (7f) | — | diver helmet | lost diver at the sump |
| `Assets/world/props/meshy/wishlist/raft.opt.glb`, `dugout_canoe.opt.glb`, `oars.opt.glb`, `mooring_bollard.opt.glb`, `reeds.opt.glb`, `river_fish.opt.glb`, `water_trough.opt.glb`, `stepping_stones.opt.glb` | Meshy wish list (not wired) | — | boats, shore, fish | lake shore |
| `infinity_pool`, `lap_pool` | §10D (water surface) | — | not a model job | the lake/sump surface is the room's water |

## LIGHTS

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `cave_torch` | Meshy decor | — | standing torch | the procs `torch_blue`, `torch_green`, `torch_red`, `torch_white` wear it |
| `wall_torch` | proc wearing `wall_torch_bracket` (Meshy decor) | — | wall sconce | |
| `brazier` | Meshy 7b / monument `brazier` (wears `cave_torch` + glow) | — | brazier | city fire bowls |
| `candle`, `candleLine`, `candleRing` | Meshy spell props | — | candles | shrine, kept room |
| `candelabra`, `votive_stand` | Meshy (Southside) | — | candle stands | |
| `ship_lantern` / `lantern`, `railway_lantern` | Survival PSX / Meshy | — | lanterns | camp + adit |
| `bare_bulb` | Abandoned House · CC0 | — | bare bulb | adit work lights |
| `high_bay_lamp` | Meshy (Industrial) | — | high bay lamp | adit |
| `flood_mast` | Meshy decor | — | floodlight | camp |
| `mushroom_lamp` | Meshy decor | — | mushroom lamp | glow fungus |
| `library_chandelier` | Meshy | — | chandelier | |
| `psx_lamp_1_on` … `psx_lamp_5_on`, `psx_ceiling_lamp_1_on` … (`_on` / `_off` pairs) | PSX Mega Pack `lighting` (18.8 MB) | — | lamps | `_on` texture glows; mostly modern, adit only |
| `Assets/world/props/meshy/wishlist/oil_lamp.opt.glb`, `lantern_post.opt.glb`, `stone_lantern.opt.glb`, `cage_lamp.opt.glb`, `lit_candle.opt.glb`, `string_lights.opt.glb`, `strobe_lamp.opt.glb`, `iron_lamp_post.opt.glb` | Meshy wish list (not wired) | — | lamps | stone_lantern for city paths |

## CREATURES / ANIMALS

| key or path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `bat_black`, `bat_brown`, `bat_grey` | bats pack (7c, OBJ) | — | bats (the `bat_` procs) | cave roosts |
| `ant`, `ant_queen`, `ant_leaf`, `anthill` | Insects pack | — | ants + hill | crawling floor life; `anthill` as a nest mound? |
| `luna_moth`, `hawk_moth`, `moth_frames` | Insects pack | — | moths | lamp-light moths (luna moth is pale green: cave glow) |
| `caterpillar` (insects) / `chrysalis` | Insects pack | — | grubs, cocoon | nest dressing |
| `crow` | Crow + rabbit | — | crow | probably not underground |
| `eagle` | Meshy-style eagle (rigged) | — | eagle | no |
| `spell_one_bat_wing` | Meshy wing | — | single bat wing | creature parts |
| `spell_top_fangs` / `fangs` | Top fangs | — | fangs | creature remains |
| `Assets/world/props/meshy/wishlist/spider.opt.glb`, `rat.opt.glb`, `scorpion.opt.glb`, `lizard.opt.glb`, `cobra.opt.glb`, `rattlesnake.opt.glb`, `firefly.opt.glb`, `dragonfly.opt.glb`, `owl_perched.opt.glb`, `raven_perch.opt.glb` | Meshy wish list (not wired) | — | small creatures | spider + rat + firefly first |
| `Assets/opt/Meshy_AI_giant_spider_realisti_quadruped_Character_output.opt.glb` (+ `..._quadruped_model_Animation_Walking_withSkin.opt.glb`) | race model (opt copy) | — | rigged giant spider | a nest guardian |
| `Assets/opt/Meshy_AI_loch_ness_monster_re_biped_Character_output.opt.glb` | race model (opt copy) | — | Loch Ness monster | the lake |
| `Assets/opt/Meshy_AI_crystal_guardian_Running.opt.glb` | race (opt; original `Assets/characters/races/crystalguardian/…`) | — | crystal guardian | city people |
| `Assets/opt/Meshy_AI_nordic_alien_male_biped_Character_output.opt.glb` | race (opt) | — | nordic | city people |
| `Assets/opt/Meshy_AI_ghoul_realistic_biped_Character_output.opt.glb`, `Meshy_AI_flesheater_Running.opt.glb`, `Meshy_AI_goblin_Running.opt.glb`, `Meshy_AI_undead_Running.opt.glb`, `Meshy_AI_skeleton_biped_Character_output.opt.glb`, `Meshy_AI_shadow_monster_Running.opt.glb`, `Meshy_AI_swampmonster_Running.opt.glb`, `Meshy_AI_golem_realistic_biped_Character_output.opt.glb`, `Meshy_AI_the_hive_queen_Running.opt.glb`, `Meshy_AI_giant_ant_realistic_biped_Character_output.opt.glb`, `Meshy_AI_black_goo_with_one_ey_biped_Character_output.opt.glb` | race models (opt copies) | — | rigged monsters | the Descent crawlers = ghoul / flesheater / goblin; hive queen for the nest |
| `ship_mantid`, `ship_nordic`, `ship_grey` | Meshy alien ships | — | the nordic's ship | a parked nordic craft in a hangar cavern? |

## FILES ON R2 NOT WIRED THAT FIT (§13 "the game does not load it")

| R2 path | pack | size | what | note |
| --- | --- | --- | --- | --- |
| `Assets/characters/races/machineelves/male/Meshy_AI_DMT_clockwork_elf_biped_Character_output.glb` | Meshy rigged character (mondo) | 15.0 MB (2 files) | machine elf body | not loaded; the 9 `_withSkin` clips beside it are the old fallback |
| `Assets/characters/races/machineelves/male/Meshy_AI_dmt_elf_Walking.glb` | Meshy (mondo) | (same row) | machine elf walking | |
| `Assets/world/packs/stairs/stairs.glb` | Stairs & Railings · ATD-London · CC-BY 4.0 | 32.0 MB (2 files) | stair flights | the game loads `Assets/opt/stairs.opt.glb` |
| `Assets/world/packs/stairs/stairs_railings.glb` | same | (same row) | railings | terrace railings |
| `Assets/world/props/meshy/wishlist/<name>.opt.glb` (246 files) | Meshy wish list (mondo 2026-11-16) | 146.6 MB | the fits: `mine_cart`, `rail_section`, `hand_car`, `buffer_stop`, `pickaxe`, `ore_heap`, `wheelbarrow`, `sieve_table`, `wooden_ladder`, `manhole_ladder`, `rope_bridge`, `rope_coils`, `timber_gate`, `braced_gate`, `wooden_barrel`, `tunnel_signal`, `valve_wheel`, `fire_danger_sign`, `trail_sign`, `canvas_tent`, `sleeping_bag`, `backpack`, `lean_to`, `firewood_stack`, `stretcher`, `rescue_sled`, `oil_lamp`, `kettle`, `ice_axe`, `hazmat_suit`, `radiation_drum`, `cage_lamp`, `chain_bunk`, `lantern_post`, `stone_lantern`, `lit_candle`, `iron_lamp_post`, `lake_rock`, `cairn`, `stepping_stones`, `moss_clump`, `icicles`, `ice_block`, `cattle_skull`, `hooded_statue`, `weeping_angel`, `god_statue`, `golden_idol`, `papyrus_column`, `fallen_column`, `casing_block`, `sundial`, `greek_couch`, `lyre`, `gong`, `laurel_wreath`, `woven_baskets`, `market_stall`, `trestle_table`, `bird_bath`, `raft`, `dugout_canoe`, `oars`, `mooring_bollard`, `reeds`, `river_fish`, `water_trough`, `spider`, `rat`, `scorpion`, `lizard`, `cobra`, `rattlesnake`, `firefly`, `dragonfly`, `owl_perched`, `raven_perch` | §13 lists only the `.opt.glb`; check the catalogue (other part of the list) for a wired row first |
| `Assets/world/props/meshy/missing_board.opt.glb`, `owl_statue.opt.glb` | Meshy (UNSORTED in §13) | 9.4 MB (16 files) | missing board, owl statue | camp notice; owl statue maybe a nordic idol |
| `Assets/world/props/meshy/candelabra.opt.glb`, `votive_stand.opt.glb`, `tool_chest.opt.glb` | Meshy (Southside) | 12.0 MB (28 files) | opt copies not loaded | their originals are wired (catalogue rows) |
| `Assets/world/packs/elbolilloduro_halloween/characters/Character.fbx`, `Character_Witch.fbx` | Halloween · CC0 | 0.5 MB | Halloween characters | probably no fit |
| PSX Mega Pack files (`Assets/world/packs/pizzadoggy_psx_mega_pack/<category>/<file>.glb`) | Pizza Doggy (no AI use) | furniture 40.3, modular 77.2, items 14.6, small 5.3, electronics 5.0, large 8.1, lighting 18.8, decals 0.1 MB | catalogue rows `psx_*` exist, NONE placed in a room | the tunnels, arches, pillars, crates, cobwebs, flashlights above |

Nothing else in §13 fits: the rest is character animation clips, creator hair / clothes, LOD copies, source formats (.blend / .fbx / .dae / .c4d) of models already listed, car parts, the road piece.

## NEEDS A MODEL (nothing in this range fits)

- **Stalactites / stalagmites / flowstone columns** (no model anywhere in 2470-4588; `sea_vent`, menhirs and tinted `icicles` are stand-ins only).
- **Cave wall / cliff / chasm-edge rock pieces** that tile (the asteroid rocks read as blobs when stretched, §8b; §8b also has no far mountain or rock massif).
- **The crystal Spire** itself: a tall faceted crystal tower lit from inside (shards + clusters are small dressing).
- **Crystal bridge** span over a chasm (only stone `ancient_walkway` and plank `footbridge`).
- **White marble terrace pieces**: balustrade, terrace wall with steps, a marble plaza tile kit (the PSX arches are concrete/brick PS1 textures and AI-forbidden).
- **Agartha architecture**: an advanced-ancient building (domed house / hall in white stone with crystal inlay); the Babel houses are mudbrick.
- **Cave squeeze / crawl hole** and a **sump pool edge** rock.
- **Creature nest** (woven bones/hide mound); today: Halloween body parts heap + `anthill`.
- **Caving gear**: helmet with lamp, rope + harness, carabiner rack, bolted fixed rope, caving ladder (the wish list `wooden_ladder` / `rope_bridge` are close but not caving).
- **Mine timber set** (the props-and-cap frame of an adit; §10E lists it as still wanted) and **rail track** (§10E: the mine pack `Rails` exists but was never cut out; wish list `rail_section` is the Meshy one).
- **Machine-elf / nordic furnishing** that reads "advanced": a crystal console, a Vril generator, a glowing pedestal (only code `floating_orb`).
- **Bioluminescent cave fungus / glow worms** on ceilings (only `mushroom_lamp`, the Meshy mushrooms, the `luna_moth`).
