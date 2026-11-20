# FITS THE ESTATE: the full shortlist (thread 17, 2026-11-20)

Made by reading every list end to end, three readers at once (WORLD_POLISH_PLAN.md section 4, step 1b): MODEL_LIST.md in three parts
(lines 741-2060; 2060-3830; 3830 to the end), the live catalogue through load-data.js (2,262 rows), the 137 tree kinds, the ground sheets,
the decals, docs/plans/WISHLIST_MODELS_ADDED.md (246) and docs/disaster-city/pack-claims.md. Keys were copied by the readers: LOOK at a
model before placing it.

## THE SHORT OF IT

- **NO cliff, rock-face or root-wall model exists anywhere.** Ledges wear drawn rock (`rocks_5` slabs, the Woods' way; bake-estate.js
  THE ROOM DESIGN draws one on every drop), with boulders at their feet: the Retro Foliage kit's `rf_rock_1` .. `rf_rock_4` match the
  painted look (rf_rock_3 / _4 are 3.3-3.5 m slabs), `lake_rock` and `psxg_rock_1..4` on shores and creek beds. `hw_stone*` are
  GRAVESTONES, not rocks. `ocean_rock_*` draw near-black.
- **The Bluff:** `coin_telescope` (the lookout, aimed at the Boathouse), `brass_telescope`, `cairn`, `iron_garden_bench`, `psxg_railing`,
  `signpost` / `trail_sign`, `menhir`; a lone tree from the tree kinds (`rf_oak_1..4` + `_autumn` / `_winter`, willows `rf_willow_1..3`).
- **The shore:** `reeds`, `willow_tree`, `fl_lotus` (the one lily plant), `stepping_stones`, `psxg_stepping_stone_1/2`, `footbridge`,
  `dock_boat`, `rowboat` / `meshy_rowboat`, `mooring_bollard` / `mooring_piles`, `oars`, `fishing_rod`, `rope_coils`, `picnic_table`,
  `bbq_grill`, `beach_cooler`, `campfire`, fallen trees `rf_oak_fallen_1/2`, `rf_birch_dead_1/3`, `fallen_log`, `meshy_fallen_log`.
- **The House Trail (later):** dead oaks `rf_oak_*_winter`, `hw_tree*`, `burnt_tree`; NO walk-in gatehouse model: build it from the PSX Mega
  Pack's modular walls / doorways / windows / floor tile with `wooden_ladder` to the loft; the gate `timber_gate`, or `hw_gate_leaf` hung
  between `psxg_wall_pillar` posts; `woods_cabin` is a whole cabin. `hollow_dead_tree` / `dead_snag` are Pizza Doggy pack: NOT CC0, no AI use.
- **Ground sheets:** `grass_2` / `grass_4` (bank tops), `grass_rocky` (the Bluff), `dirt_slope`, `wasteland` (root-bound earth), `dirt_4`
  (a dry creek bed), `rubble_1..4` (scree at a ledge's foot). The Estate's room already draws 8 sheets (the cap): a new one replaces one.
- **Licences:** the PSX Mega Pack is not CC0 (no AI use, no redistribution); ten of its keys carry no `psx_` prefix (`cinder_block`, `key` ...).
  Several keys share one file (`cave_stone` = `menhir`). The Stairs & Railings pack on R2 is not wired (CC-BY: needs credit).

## NEEDS A MODEL (asked in chat with the pilot's pictures)

1. A rock face / cliff piece and a root wall (banks and ledges: drawn rock stands in).
2. A small stone gatehouse / lodge with a loft, walk-in (the House Trail's Back Gate): built from the PSX modular pieces until then.
3. A wooden farm fence run that reads as old (the ranch rail model stands in), a dock plank section, a scarecrow that is not the Halloween pack's.
4. A dead oak big enough to be the House Trail's landmark (the tree kinds' winter oaks stand in).

---

## Reader A

# fits_A: MODEL_LIST.md lines 741-2060 (section 6 first half), read every row

Sections covered: PSX Mega Pack (Pizza Doggy, 584 rows, 743-1330), Meshy AI (mondo) (300, 1332-1635), Meshy AI wish list made by Claude (246, 1637-1886), Roads (Elbolilloduro, 106, 1888-1997), Halloween pack (Elbolilloduro, rows 1999-2060 only; it goes on past 2060).
No row in this range gives a size. The "size" column below is a guess from the name only, or "-".
Paths: wishlist = `Assets/world/props/meshy/wishlist/<key>.glb`; meshy = `Assets/world/props/meshy/Meshy_AI_...`; hq = `Assets/world/hq/models/...`; psx = `Assets/world/packs/pizzadoggy_psx_mega_pack/...`; hw = `Assets/world/packs/elbolilloduro_halloween/models/halloween.fbx#<node>`.

## Rock and ledge faces, banks, creek cut

| key | pack / source | size | where it fits |
|---|---|---|---|
| lake_rock | Meshy wishlist | - | PILOT: shore walk, West Bank toe, rocks at the Bluff edge |
| cairn | Meshy wishlist | small | PILOT: Bluff lookout marker / cairn |
| stepping_stones | Meshy wishlist | - | PILOT: shore walk over the marsh / south beach; Ranch dry creek |
| moss_clump | Meshy wishlist | small | PILOT: West Bank, Bluff rocks, shore; House Trail |
| cave_stone | Meshy (mondo), `a_standing_stone_0916235906` | tall | PILOT: Bluff edge boulder stood on end; House Trail |
| menhir | Meshy (mondo), same file as cave_stone | tall | same as cave_stone (duplicate) |
| sarsen | Meshy (mondo), `a_standing_stone_0912231506` | tall | Bluff edge / ridge rock (a different standing stone) |
| ore_heap | Meshy wishlist | - | rock rubble at a ledge foot (Bluff), dry falls (Ranch) |
| hw_stone, hw_stone_1 .. hw_stone_5 | Halloween pack (fbx nodes Stone..Stone_05) | small | PILOT: rocks along the shore walk / Bluff, IF they are rocks (see notes; they may be gravestones) |
| culvert_mouth | Meshy (mondo) | - | Ranch dry creek cut under County Lane; House Trail pond outflow |
| drain_grate | Meshy (mondo) | small | creek cut (weak fit) |
| footbridge | Meshy (mondo), `a_plank_footbridge` | - | PILOT: shore walk over the marsh inlet; Ranch dry creek; House Trail |
| rope_bridge | Meshy wishlist | - | House Trail over a ravine; Ranch creek cut |
| ancient_walkway | Meshy (mondo) | - | (weak) boardwalk over marsh |
| psx_brick_1, psx_brick_1_1/_2/_3 | PSX Mega Pack | small | scatter on old foundations (gatehouse ruin) |
| cinder_block | PSX Mega Pack (`concrete_block_1`) | small | Ranch yard, old camp |

No cliff / rock-face / root wall piece exists in this half of the list. The ledges of the Bluff will need pieces from the other half (or code-built faces).

## Trees and brush

| key | pack / source | size | where it fits |
|---|---|---|---|
| meshy_dead_snag | Meshy (mondo) | tall | House Trail dead woods; PILOT Bluff lone tree (dead) |
| meshy_dead_tree_with_a_dark_hole | Meshy (mondo) | tall | House Trail DEAD OAK candidate; horror woods |
| meshy_tree_with_a_hole | Meshy (mondo) | tall | House Trail; Ranch ridge lone tree |
| burnt_tree | Meshy wishlist | tall | House Trail dead woods wall |
| meshy_fallen_log | Meshy (mondo) | - | PILOT shore walk, West Bank; House Trail; old camp seat |
| meshy_stump | Meshy (mondo) | small | PILOT Bluff, shore walk; House Trail |
| fallen_redwood | Meshy wishlist | big | House Trail (big fallen trunk across a switchback) |
| willow_tree | Meshy wishlist | tall | PILOT West Bank / shore walk lakeside tree; House Trail pond |
| meshy_pine_with_canopy | Meshy (mondo) | tall | woods edge round the lake / House Trail |
| cypress_tree | Meshy wishlist | tall | (weak) graveyard tree |
| olive_tree | Meshy wishlist | - | (weak) Bluff lone tree if gnarled |
| hw_tree, hw_tree_2, hw_tree_3 (+ hw_tree_4/_5 just past 2060) | Halloween pack | - | House Trail dead woods, graveyard |
| leafy_bush | Meshy wishlist | small | PILOT West Bank, shore walk brush; House Trail brush wall |
| fern | Meshy (mondo) | small | PILOT shady shore; House Trail |
| tumbleweed | Meshy wishlist | small | Ranch dry creek, hay field (dry look) |
| wild_flowers | Meshy wishlist | small | PILOT West Bank grass, Bluff top; Ranch hay field |
| sunflowers | Meshy wishlist | - | Ranch farmhouse garden |
| rose_bed | Meshy wishlist | - | (weak) farmhouse front |
| fae_mushroom / mushroom | Meshy (mondo), same file | small | House Trail ground |
| fae_toadstool / mushroom2 / woods_glowcap | Meshy (mondo), same file | small | House Trail (glowcap = night horror) |
| corn_row | Meshy wishlist | - | CORN wall |
| corn_stalk | Meshy wishlist | - | CORN wall, edges |
| hw_crop, hw_crop_2, hw_crop_3, hw_farmland | Halloween pack | - | Corn / Ranch field rows |
| hw_straw, hw_straw_2 | Halloween pack | small | Ranch barn, hay field |

## Lakeshore (pilot)

| key | pack / source | size | where it fits |
|---|---|---|---|
| reeds | Meshy wishlist | small | PILOT shore walk, marsh, West Bank waterline |
| meshy_rowboat | Meshy (mondo) | - | PILOT south beach drawn up, shore walk; boathouse |
| dock_boat | Meshy wishlist | - | Lake dock / boathouse |
| dugout_canoe | Meshy wishlist | - | PILOT shore walk beach |
| raft | Meshy wishlist | - | Lake; House Trail pond |
| oars | Meshy wishlist | small | PILOT beach, dock |
| fishing_rod | Meshy wishlist | small | PILOT West Bank / dock / shore walk |
| river_fish | Meshy wishlist | small | Lake water / on the dock |
| drying_fish | Meshy wishlist | - | boathouse, dock |
| fish_boxes | Meshy wishlist | - | dock, boathouse |
| psx_fish_skeleton_mp_1 | PSX Mega Pack | small | horror shore detail, old camp |
| mooring_bollard | Meshy wishlist | small | dock |
| rope_coils | Meshy wishlist | small | dock, boathouse |
| meshy_rope | Meshy (mondo) | small | dock |
| ship_anchor | Meshy (mondo) | - | (weak) boathouse wall |
| picnic_table | Meshy wishlist | - | PILOT West Bank or Bluff top picnic spot; old camp |
| bbq_grill | Meshy wishlist | - | picnic spot by the lake |
| beach_towel | Meshy wishlist | small | PILOT south beach |
| patio_umbrella | Meshy wishlist | - | (weak) south beach |
| heron | Meshy wishlist | - | PILOT marsh / shore walk |
| duck | Meshy wishlist | small | PILOT lake, marsh |
| swan | Meshy wishlist | - | Lake |
| dragonfly | Meshy wishlist | small | PILOT marsh, reeds |
| meshy_frog | Meshy (mondo) | small | PILOT marsh; House Trail pond |
| firefly | Meshy wishlist | small | marsh / House Trail at night |
| diving_board | Meshy wishlist | - | (weak) dock end |
| ice_fishing_hole | Meshy wishlist | - | not now (winter only) |

## Bluff dressing (pilot)

| key | pack / source | size | where it fits |
|---|---|---|---|
| city_bench | Meshy (mondo) | - | PILOT Bluff bench (city look; prefer a wooden one if the other half has one) |
| steel_bench | Meshy wishlist | - | Bluff bench (weak, metal) |
| coin_telescope | Meshy wishlist | - | PILOT Bluff lookout to the boathouse |
| timber_lookout | Meshy wishlist | big | PILOT Bluff lookout tower / platform; House Trail hilltop |
| brass_telescope / telescope | Meshy (mondo), same file | small | (weak) lookout |
| cairn | Meshy wishlist | small | PILOT Bluff marker (also listed above) |
| trail_sign | Meshy wishlist | - | PILOT trail start west to the Haunted House; Bluff path; House Trail |
| signpost | Meshy (mondo), blank wooden signpost | - | PILOT West Bank trailhead; County Lane |
| milestone | Meshy wishlist | small | trail marker on the shore walk |
| fire_danger_sign | Meshy wishlist | - | trailhead (rural park sign) |
| sundial | Meshy wishlist | - | (weak) |
| flag_pole | Meshy wishlist | tall | (weak) boathouse / ranch yard |

## Fences and gates

| key | pack / source | size | where it fits |
|---|---|---|---|
| fence_with_gate | Meshy wishlist | - | Ranch paddock, yard; House Trail back gate |
| garden_gate | Meshy wishlist | - | farmhouse yard; graveyard back gate |
| timber_gate | Meshy wishlist | - | Ranch paddock; estate BACK GATE |
| braced_gate | Meshy wishlist | - | Ranch field gate; estate back gate |
| barbed_wire_fence | Meshy wishlist | - | Ranch ridge old fence line; corn edge; Bluff old fence |
| chain_fence | Meshy wishlist | - | (weak) Skinwalker-style keep-out |
| boom_gate | Meshy wishlist | - | County Lane checkpoint (Skinwalker security) |
| hw_fence | Halloween pack | - | PILOT Bluff old fence; Ranch ridge fence line; House Trail |
| hw_fence_iron, hw_fence_iron_2, hw_fence_iron_3 | Halloween pack | - | GRAVEYARD fence |
| hw_gate_leaf, hw_gate_leaf_2 | Halloween pack | - | GRAVEYARD back gate leaves |
| meshy_one_meter_of_railing / meshy_one_meter_of_railing_b / railing_1m | Meshy (mondo) | 1 m | PILOT Bluff edge safety rail (office look, weak); dock rail |
| safety_netting | Meshy wishlist | - | (weak) |

## Buildings and building parts (gatehouse, boathouse, ranch)

| key | pack / source | size | where it fits |
|---|---|---|---|
| outhouse | Meshy wishlist | small | Ranch yard; old camp; gatehouse yard |
| lean_to | Meshy wishlist | - | OLD CAMP shelter; Ranch wood store |
| thatched_hut | Meshy wishlist | - | (weak) gatehouse stand-in |
| canvas_tent | Meshy wishlist | - | OLD CAMP |
| meshy_camping_tent | Meshy (mondo) | - | OLD CAMP (Blair Witch tent) |
| kennel | Meshy wishlist | small | Ranch yard |
| leaf_barn | Meshy (mondo), hq `a_barn_door` | door | Ranch barn doors; gatehouse |
| leaf_stable | Meshy (mondo), hq `a_stable_door` | door | Ranch cow shed / stable; gatehouse |
| leaf_shabby_wood | Meshy (mondo), hq `a_shabby_wooden_door` | door | GATEHOUSE door; boathouse; old shed |
| leaf_suburban_house | Meshy (mondo), hq | door | farmhouse front door |
| leaf_frame_only | Meshy (mondo), hq | door | ruined gatehouse doorway |
| wooden_ladder | Meshy wishlist | - | GATEHOUSE ladder to the loft; barn loft |
| psx_stairs_5_wood | PSX Mega Pack | - | gatehouse / boathouse steps |
| psx_beam_1, psx_beam_2, psx_beam_4, psx_beam_5 | PSX Mega Pack | - | gatehouse loft beams, boathouse frame |
| psx_door_1_loose .. psx_door_4_loose, psx_door_mp_1_loose, psx_door_mp_6_loose | PSX Mega Pack | door | gatehouse inside door, fallen door at the camp |
| psx_window_1_single_no_glass, psx_window_2_single_frame_only (and the other window rows) | PSX Mega Pack | - | broken gatehouse windows |
| psx_floor_ceiling_1/_2/_3, psx_wall_1_plain, psx_doorway_1_plain | PSX Mega Pack | - | gatehouse shell (modular, indoor look) |
| psx_toilet_cabin_mp_1 | PSX Mega Pack | - | (weak) portable toilet at a camp |
| ancient_well | Meshy (mondo) | - | Ranch yard / farmhouse well; House Trail |
| bell_frame | Meshy wishlist | - | farm bell / graveyard chapel |
| windbreak | Meshy wishlist | - | (weak) |
| weather_mast | Meshy wishlist | tall | Skinwalker-style research mast at the Ranch |
| windsock | Meshy wishlist | - | Ranch |
| telegraph_pole | Meshy wishlist | tall | County Lane power line; Ranch |
| beam_pump | Meshy wishlist | - | Ranch (oil pump; weak) |

## Ranch and farm props

| key | pack / source | size | where it fits |
|---|---|---|---|
| hay_bale | Meshy wishlist | - | Ranch hay field, barn, corn edge |
| hay_cart | Meshy wishlist | - | Ranch hay field |
| hay_rack | Meshy wishlist | - | barn, paddock |
| water_trough | Meshy wishlist | - | horse paddock, cow shed |
| saddle | Meshy wishlist | - | barn, paddock rail |
| plough | Meshy wishlist | - | Ranch field |
| tractor | Meshy wishlist | - | Ranch yard / County Lane |
| pitchfork | Meshy wishlist | - | barn |
| wheelbarrow | Meshy wishlist | - | yard, barn |
| hand_cart | Meshy wishlist | - | yard |
| axe_chopping_block | Meshy wishlist | - | farmhouse yard; OLD CAMP |
| firewood_stack | Meshy wishlist | - | farmhouse; OLD CAMP; gatehouse |
| wooden_barrel | Meshy wishlist | - | barn, boathouse |
| wooden_bucket | Meshy (mondo) | small | well, barn, dock |
| woven_baskets | Meshy wishlist | small | farmhouse porch |
| clothes_line | Meshy wishlist | - | farmhouse yard |
| mailbox | Meshy wishlist | small | County Lane at the farmhouse |
| tyre_swing | Meshy wishlist | - | farmhouse yard tree (creepy) |
| beehive | Meshy wishlist | small | farmhouse garden |
| grindstone | Meshy wishlist | - | barn |
| cattle_skull | Meshy wishlist | small | Ranch dry creek; horror |
| meshy_burlap_sack | Meshy (mondo) | small | barn, corn |
| sieve_table, trestle_table | Meshy wishlist | - | barn / camp table |
| wood_stove | Meshy wishlist | - | GATEHOUSE inside |
| kettle | Meshy wishlist | small | gatehouse stove, camp |
| psx_jerrycan_1, psx_jerrycan_1_1 | PSX Mega Pack | small | Ranch yard, old camp |
| psx_metal_barrel_mp_0 .. _3 | PSX Mega Pack | - | Ranch yard (burn barrel) |
| psx_wooden_crate_1 .. psx_wooden_crate_6 | PSX Mega Pack | - | barn, boathouse |
| psx_supply_crate_1 (+ variants) | PSX Mega Pack | - | (weak) |

## Horror

| key | pack / source | size | where it fits |
|---|---|---|---|
| hw_grave, hw_grave_low, hw_grave_slab | Halloween pack | small | GRAVEYARD |
| hw_coffin, hw_coffin_2, hw_coffin_lid, hw_coffin_lid_2 | Halloween pack | - | graveyard, open grave |
| hw_scarecrow, hw_scarecrow_2 | Halloween pack | - | CORN, Ranch hay field, House Trail |
| hw_pumpkin .. hw_pumpkin_4 | Halloween pack | small | farmhouse porch, corn |
| hw_shovel | Halloween pack | small | graveyard dig, old camp |
| hw_body, hw_body_2, hw_body_rising, hw_body_rising_2 | Halloween pack | - | graveyard (risen dead; strong) |
| hw_part .. hw_part_9 | Halloween pack | small | horror scatter (strong; use sparingly) |
| hw_bricks, hw_bricks_2 | Halloween pack | - | graveyard / gatehouse ruin |
| hw_candle, hw_candle_2, hw_candles, hw_candles_2 | Halloween pack | small | OLD CAMP shrine, gatehouse loft |
| halloween_character_ghost | Halloween pack | - | House Trail / graveyard (a character model) |
| meshy_voodoo_doll | Meshy (mondo) | small | Blair Witch charm at the camp / gatehouse |
| carved_totem_pole | Meshy wishlist | tall | (Skinwalker) ridge or House Trail clearing |
| raven_perch | Meshy wishlist | - | DEAD OAK, graveyard |
| owl_perched | Meshy wishlist | small | House Trail tree |
| vulture | Meshy wishlist | - | Ranch dry creek, dead oak |
| hooded_statue | Meshy wishlist | - | graveyard |
| weeping_angel | Meshy wishlist | - | graveyard |
| angel_statue | Meshy (mondo) | - | graveyard |
| gallows | Meshy wishlist | - | (strong) House Trail hilltop / dead oak alt |
| hearse_carriage | Meshy wishlist | - | graveyard gate |
| cage_wagon | Meshy wishlist | - | (weak) |
| wooden_cross | Meshy (mondo) | - | graveyard, roadside cross |
| cross | Meshy (mondo), spell prop wooden cross | - | graveyard (spell-prop folder) |
| psx_cross_1, psx_cross_mp_2 | PSX Mega Pack | small | graveyard, gatehouse wall |
| skull, femur, ulna | Meshy (mondo), spell props | small | old camp, graveyard |
| skull_pile | Meshy (mondo) | - | (strong) |
| sarcophagus | Meshy (mondo) | - | (weak) graveyard tomb |
| psx_cobweb_1, _2, _4, _5 | PSX Mega Pack | - | GATEHOUSE inside, boathouse |
| psx_old_mattress_mp_1, _1_1 | PSX Mega Pack | - | gatehouse loft, old camp |
| psx_bed_1_frame | PSX Mega Pack | - | gatehouse (rusty bed frame) |
| meshy_black_blob | Meshy (mondo) | - | (Skinwalker oddity, weak) |
| ufo / saucer_big | Meshy (mondo) | big | (Skinwalker sky event, optional) |

## Signs and lights

| key | pack / source | size | where it fits |
|---|---|---|---|
| lantern_post | Meshy wishlist | - | PILOT dock, West Bank trailhead; gatehouse |
| meshy_hanging_lantern | Meshy (mondo) | small | boathouse, gatehouse porch, old camp |
| oil_lamp | Meshy wishlist | small | gatehouse table, camp |
| lit_candle | Meshy wishlist | small | gatehouse loft |
| candle, candleLine, candleRing | Meshy (mondo), spell props | small | ritual at the old camp / DEAD OAK |
| cage_lamp | Meshy wishlist | small | barn, boathouse |
| iron_lamp_post | Meshy wishlist | tall | (weak, town look) |
| string_lights | Meshy wishlist | - | (weak) |
| brazier | Meshy (mondo) | - | (weak) camp |
| meshy_campfire_ring | Meshy (mondo) | - | OLD CAMP; PILOT south beach fire |
| psx_flashlight_1, psx_flashlight_mp_1 | PSX Mega Pack | small | dropped at the old camp (Blair Witch) |
| wanted_poster | Meshy wishlist | small | (weak) gatehouse wall |
| psx_lamp_1_on .. psx_lamp_5_off | PSX Mega Pack | small | gatehouse inside (room lamps) |
| roads_g_sign_000 .. roads_g_sign_014 | Roads pack | - | County Lane road signs (check look) |

## Camp and small life

| key | pack / source | size | where it fits |
|---|---|---|---|
| sleeping_bag | Meshy wishlist | - | OLD CAMP |
| backpack | Meshy wishlist | small | OLD CAMP (abandoned) |
| meshy_campfire_ring | Meshy (mondo) | - | OLD CAMP |
| psx_canned_food_mp_5_rusty, psx_tin_can_mp_1_rusty, psx_tin_can_mp_1_rusty_1 | PSX Mega Pack | small | OLD CAMP litter |
| psx_glass_bottle_1, _2 | PSX Mega Pack | small | camp, shore |
| psx_walkie_talkie_1, _2 | PSX Mega Pack | small | old camp (lost hikers) |
| psx_vhs_tape_1 / vhs_tape | PSX / Meshy (mondo) | small | the found tape (Blair Witch) at the camp or gatehouse |
| psx_open_book_mp_1, psx_notebook_1 | PSX Mega Pack | small | camp journal, gatehouse |
| deer | Meshy wishlist | - | House Trail, Ranch ridge |
| fox | Meshy wishlist | - | House Trail, corn edge |
| coyote | Meshy wishlist | - | Ranch ridge, dry creek (Skinwalker) |
| bear | Meshy wishlist | - | House Trail woods |
| mountain_lion | Meshy wishlist | - | Bluff / ridge |
| hawk | Meshy wishlist | - | Bluff sky |
| rattlesnake | Meshy wishlist | small | Ranch dry creek |
| hedgehog | Meshy wishlist | small | (weak, not American) |
| rat | Meshy wishlist | small | barn, gatehouse |
| spider | Meshy wishlist | small | gatehouse, old camp |
| goat | Meshy wishlist | - | Ranch yard |
| pig | Meshy wishlist | - | Ranch yard |
| rooster | Meshy wishlist | small | Ranch coop |
| seagull | Meshy wishlist | small | (weak, lake) |

## NOTES

- No sizes are given anywhere in lines 741-2060; the size column is a guess from the name.
- No cliff, rock-face, bank or root-wall piece exists in this half. Best rock stand-ins: `lake_rock`, `cave_stone`/`menhir`, `sarsen`, `ore_heap`, `cairn`, `moss_clump`, `stepping_stones`. The Bluff ledges need the other half of the list, or code-built faces.
- PSX Mega Pack (Pizza Doggy) is NOT CC0: no AI use of the assets, no redistributing. Pack-made, mostly indoor/urban; few outdoor fits.
- Halloween pack rows are fbx NODES (`halloween.fbx#Stone_06`), not separate GLBs. `hw_stone` .. `hw_stone_5` (nodes Stone..Stone_05) sit beside `hw_grave` (Stone_06), `hw_grave_slab` (Stone_07), `hw_grave_low` (Stone_08): the plain `hw_stone_*` may be headstones, not rocks; look at them before using them as shore rocks. The section goes on after line 2060 (hw_tree_4, hw_tree_5 ...).
- Meshy wish-list keys (Claude-made 11-16, `Assets/world/props/meshy/wishlist/<key>.glb`) are Meshy, not pack; they hold most of the outdoor/rural fits (reeds, lake_rock, cairn, fences, gates, hay, lean_to, outhouse, timber_lookout, coin_telescope, trail_sign, willow_tree, burnt_tree).
- Duplicates (two keys, one file): `cave_stone` = `menhir`; `mushroom` = `fae_mushroom`; `mushroom2` = `fae_toadstool` = `woods_glowcap`; `telescope` = `brass_telescope`; `lectern` = `church_podium`; `holy_carpet` = `holy_tapestry`; `dish` = `dish_big`; `office_chair` = `exec_chair`; `saucer_big` = `saucer_lg`; `spaceship` = `spaceship_fly`; `lunar_lander` = `lunar_lander_full`.
- `railing_1m` and `meshy_one_meter_of_railing` both point at `Assets/world/hq/models/one_meter_of_railing_...`, but `meshy_one_meter_of_railing_b` points at `Assets/world/props/meshy/Meshy_AI_one_meter_of_railing_0903105339_texture.glb` (same stamp, other folder): one of the two copies may be missing on R2. Not checked.
- Mixed naming in the PSX block: ten pack rows have no `psx_` prefix (`cardboard_box`, `cinder_block`, `couples_bed`, `dorm_bed`, `house_key`, `key`, `library_shelf`, `pen`, `pencil`, `vent_grille`), while their Meshy twins carry `meshy_` (`meshy_cinder_block`, `meshy_couples_bed`, ...). Easy to pick the wrong licence by key.
- `door_gun` (Meshy mondo) has a file name with no prompt text (`Meshy_AI__0916054803_texture.glb`).
- Some Meshy (mondo) keys live in the spell-prop folder (`Assets/fx/spell_props/`: `cross`, `skull`, `femur`, `candle*`); fine as props, but they are spell assets first.
- Roads pack (`roads_*`) is city asphalt; no dirt-lane piece, so County Lane stays terrain. Only the `roads_g_sign_*` road signs might fit.
- Nothing in this range says "on R2 but not wired"; that column does not exist here.

## Reader B

# fits_B: MODEL_LIST.md lines 2060-3830, read end to end (second half of §6 Props from the Halloween pack tail to the Stairs pack, all of §7 7a-7f, §8 proc list + "procs that wear a model")

MODEL_LIST.md gives no sizes in this range. Where a size is shown, I read it (read-only) from that key's DOOR_HQ.catalogue row in data.js (h = height, span = longest side, m). "-" = not looked up.
Which list it is in: (cat) = a DOOR_HQ.catalogue key, checked with a grep of data.js. (tree) = an HQ_TREE_KINDS tree key, NOT a catalogue prop. (7a) / (7b) = spell-prop / _MISC_GLB key; some of these also have a catalogue row, marked.

## Rock & ledge faces, boulders, stones

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| rf_rock_3 | Retro Foliage (AFGameAssets, bought) (cat via flora rows) | span 3.5, solid | PILOT Bluff ledge foot / West Bank face: the biggest wide boulder |
| rf_rock_4 | Retro Foliage (cat) | span 3.3, solid | PILOT Bluff ledges, shore walk climb-out |
| rf_rock_1 | Retro Foliage (cat) | h 1.41 | PILOT bank edge, cairn base |
| rf_rock_2 | Retro Foliage (cat) | h 1.66 | PILOT bank edge, Bluff top rocks |
| ocean_rock_3 | Ocean pack (author not recorded) (cat) | h 2.6 "a spire" | PILOT Bluff ledge face (a rock spire against the drop) |
| ocean_rock_4 | Ocean pack (cat) | h 2.4 "a spire on its own boulder" | PILOT Bluff ledge face / lookout marker rock |
| ocean_rock_2 | Ocean pack (cat) | h 1.4 | PILOT West Bank face, shore walk |
| ocean_rock | Ocean pack (cat) | h 1.0 | PILOT shore walk, south beach |
| ocean_rock_7 / ocean_rock_8 | Ocean pack (cat) | h 0.8 / 0.7 | PILOT bank toe at the water line |
| ocean_rock_5 / ocean_rock_6 / ocean_rock_9 | Ocean pack (cat) | h 0.5-0.6, walk-over | PILOT shore walk scatter; a stacked CAIRN from these |
| ocean_rock_10 | Ocean pack (cat) | span 0.5 pebble | PILOT south beach pebbles |
| ocean_rock_11 | Ocean pack (cat) | span 0.6 flat stone | PILOT cairn layers; beach |
| psxg_rock_1 | PSX Halloween Graveyard (BlenderVoyage) (cat) | h 0.74 | PILOT Bluff top; House Trail |
| psxg_rock_2 / psxg_rock_3 / psxg_rock_4 | PSX Graveyard (cat) | h 0.49 / 0.43 / 0.23 | PILOT scatter; cairn stones |
| psxg_stepping_stone_1 / psxg_stepping_stone_2 | PSX Graveyard (cat) | h 0.04, 0.8 m | PILOT shore walk through the marsh / the dip to the beach |
| menhir | Meshy AI (mondo) (cat + 7b) | h 2.6 | PILOT Bluff LOOKOUT MARKER (a standing stone) |
| standingstone | Meshy AI (mondo) (7b only, no catalogue row) | - | PILOT lookout marker (needs a row; menhir is the catalogue one) |
| trilithon | Meshy AI (mondo) (cat + 7b) | span 6.4 | House Trail horror (too Stonehenge for the pilot) |
| cinder_block | PSX Mega Pack · Pizza Doggy (NOT CC0) (7b) | - | Ranch yard |
| culvert | Meshy AI (mondo) "a culvert mouth" (7b only, no catalogue row) | - | Ranch dry creek cut under a track; County Lane |
| rf_oak_stump / rf_pine_stump / rf_stump | Retro Foliage (cat) | h 0.93 / 1.54 / 0.82 | PILOT root / stump pieces on the bank edge; House Trail |

Nothing in this range is a real cliff / rock-wall / root-face piece. The ledge faces will have to be stacked boulders (rf_rock_3/4, ocean_rock_3/4) or come from the first half of the list.

## Trees, brush & flora

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| rf_oak_1 … rf_oak_4 | Retro Foliage (tree) | - | PILOT Bluff LONE TREE; Ranch ridge lone tree |
| rf_oak_1_autumn … rf_oak_4_autumn | Retro Foliage (tree) | - | PILOT Bluff lone tree in autumn colours (horror mood) |
| rf_oak_1_winter … rf_oak_4_winter | Retro Foliage (tree) | - | House Trail DEAD OAK (bare winter oak) |
| rf_willow_1 / rf_willow_2 / rf_willow_3 | Retro Foliage (tree) | - | PILOT West Bank / lake edge willows |
| rf_willow_1_yellow … rf_willow_3_yellow | Retro Foliage (tree) | - | PILOT shore walk, autumn willows |
| rf_willow_dead_1 | Retro Foliage (cat) | span 9.1 | Lake marsh; House Trail POND in the hollow |
| rf_willow_dead_2 | Retro Foliage (cat) | h 2.44 | Lake marsh; pond |
| rf_birch_dead_1 / rf_birch_dead_3 | Retro Foliage (cat) | span 6.5 / 6.1 (lying) | PILOT shore walk DRIFTWOOD (fallen birch); House Trail |
| rf_birch_dead_2 | Retro Foliage (cat) | h 0.96 | House Trail |
| rf_oak_fallen_1 / rf_oak_fallen_2 | Retro Foliage (cat) | span 9.0 / 5.4 | PILOT beach driftwood log; House Trail wall |
| rf_pine_fallen_1 … rf_pine_fallen_5 | Retro Foliage (cat) | span 4.2-11.3 | House Trail switchback walls, dead woods |
| rf_fir_1_dead … rf_fir_4_dead | Retro Foliage (tree) | - | House Trail dead woods |
| rf_birch_1 … rf_birch_4 (+ _autumn) | Retro Foliage (tree) | - | Lake / House Trail edge woods |
| rf_grass_5 / rf_grass_6 / rf_plant_5 / rf_plant_6 | Retro Foliage (cat; ZONE_FLORA `reed` mix = rushes + cattails) | h 0.9 / 0.71 / 0.62 / 0.57 | PILOT REEDS at the water's edge, the marsh |
| rf_grass_1 … rf_grass_6 (+ _dry, _dark) | Retro Foliage (cat) | h 0.14-0.9 | PILOT grassy West Bank + Bluff top; _dry = Ranch dry creek, hay field; _dark = House Trail |
| rf_plant_4 / rf_plant_11 | Retro Foliage (cat, solid) | h 1.24 / 1.86 | House Trail BRUSH wall (ZONE_FLORA `bush` = rf_plant_4) |
| rf_plant_7 / rf_plant_3 / rf_plant_1 / rf_plant_10 | Retro Foliage (cat; ZONE_FLORA `fern`) | - | House Trail wood floor |
| rf_flower_1 … rf_flower_11 | Retro Foliage (cat) | h 0.1-0.49 | PILOT bank meadow |
| hp_daisy / hp_daisy_bunch / hp_bluebell / hp_violet / hp_sunflower | Handpainted flowers (author not recorded) (cat) | h 0.42-1.3 | PILOT bank; Ranch (sunflower = ZONE_FLORA `farm`) |
| flora_field | THE FLORA FIELD (tree list) | - | the one sheet behind all the small plants |
| hollow_dead_tree | Retro Tree Pack · Pizza Doggy (NOT CC0) (cat) | h 5.0 | House Trail DEAD OAK on the hilltop (best single dead tree) |
| dead_snag | Retro Tree Pack · Pizza Doggy (cat) | h 4.6 | House Trail; Ranch ridge |
| tree_5 / tree_6 | Retro Tree Pack dead trees (tree) | - | same models as dead_snag / hollow_dead_tree, as tree kinds |
| tree_13 … tree_20, tree_41, tree_42 | LowPoly nature · Quaternius · CC0 dead trees (tree) | - | House Trail dead woods wall |
| tree_31 … tree_40 | Quaternius dead birches (tree) | - | House Trail; lake marsh |
| tree_21 … tree_30 | Quaternius birches (tree) | - | Lake edge woods |
| tree_48 / tree_49 / tree_50 / tree_51 / tree_7 … tree_12 | Quaternius broadleaf trees (tree) | - | PILOT Bluff lone tree (alternative); Ranch |
| tree / tree_2 / tree_3 / tree_4 / tree_52 … tree_56 | THE PAINTED TREES (bake-trees.py) (tree) | - | Ranch, lake woods |
| hw_tree_3 / hw_tree_4 / hw_tree_5 | Halloween pack · Elbolilloduro · CC0 (cat) | h 5.62 / 4.17 / 7.02 | House Trail horror trees; graveyard |
| psxg_dead_tree_1 / psxg_dead_tree_2 | PSX Graveyard (cat) | h 3.64 / 4.51 | House Trail, graveyard |
| psxg_dead_bush_1 / psxg_dead_bush_2 | PSX Graveyard (cat) | h 1.17 / 0.77 | House Trail BRUSH; Ranch dry creek |
| woods_thornvine | Meshy AI (THE GARDEN) (cat) | - | House Trail brush wall |
| fallen_log | Elbolilloduro Vegetation · CC0 (cat + 7b) | span 3.6 | PILOT driftwood / shore log seat; old camp |
| stump | Elbolilloduro Vegetation · CC0 (cat + 7b) | h 0.6 | PILOT picnic seat; old camp seat |
| fern | Meshy AI (mondo) (cat + 7b) | - | House Trail |
| mushroom / mushroom2 | Meshy AI (mondo) (7b; mushroom has a catalogue row) | - | House Trail |
| fl_wheat_clump | Meshy AI, Katana + flora batch 1 (cat) | - | Ranch HAY FIELD |
| fl_lotus | Meshy AI (cat) | - | House Trail pond (lily-ish; it is a lotus) |

## Lakeshore (boats, dock, fishing, picnic)

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| rowboat | Elbolilloduro Houses on the water · CC0 (cat + 7b) | span 3 | PILOT south beach, a boat pulled up on the sand |
| fishing_boat | Elbolilloduro Houses on the water (cat) | span 6.69 | Lake boathouse / dock |
| skiff | proc wearing Meshy decor skiff (cat, a floating boat vehicle) | span 4.8 | Lake: a boat on the water |
| mooring_piles | Elbolilloduro Houses on the water (cat) | span 1.26, h 1.6 | Lake dock; PILOT beach, old posts in the water |
| stilt_hut | Elbolilloduro Houses on the water (cat) | 3.6 x 5.4 deck, 7.2 high | Lake BOATHOUSE stand-in |
| stilt_house / stilt_house_wide | Elbolilloduro Houses on the water (cat) | - | Lake boathouse (bigger) |
| hammock | Elbolilloduro Houses on the water (cat) | - | Lake picnic; old camp |
| generator | Elbolilloduro Houses on the water (cat) | - | Old camp; Ranch barn |
| sea_buoy | Meshy decor (cat) | - | Lake, a marker buoy off the beach |
| outboard_motor | Meshy (Bayside interiors) (cat) | - | Boathouse |
| lobster_traps | Meshy (Bayside) (cat) | - | Boathouse (crab pots) |
| fishing_net_wall | Meshy (Bayside) (cat) | - | Boathouse wall |
| beach_cooler | Beach Props · Elegant Crow (cat) | - | PILOT PICNIC on the south beach / Bluff |
| beach_life_ring | Beach Props · Elegant Crow (cat) | - | Lake dock / boathouse wall |
| decor_umbrella_closed | Meshy decor (cat) | - | PILOT picnic |
| anchor | Meshy AI (mondo) (7b only, no catalogue row) | - | Boathouse |
| footbridge | Meshy AI (mondo) plank footbridge (cat + 7b) | span 4.4 | PILOT shore walk over the marsh / inlet; Ranch dry creek |
| ocean_turtle | Ocean pack (cat) | - | Lake life (a turtle on a rock) |
| kt_koi | Meshy AI, Katana batch (cat) | - | House Trail pond fish (Japanese look, careful) |
| item_spyglass / item_binoculars | Meshy, held props (cat) | - | PILOT Bluff lookout, left on the bench |
| telescope | Meshy AI (mondo) (7b; a catalogue row with this name exists) | - | PILOT Bluff LOOKOUT viewer to the boathouse |

## Fences & gates

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| psxg_railing / psxg_railing_corner | PSX Graveyard (cat) | 4.7 m long, h 0.95 | PILOT Bluff edge railing (an old iron rail on the ledge); graveyard |
| psxg_wall / psxg_wall_corner / psxg_wall_pillar | PSX Graveyard (cat) | 3.7 m long, h 1.01; pillar 1.5 | Graveyard wall; the estate's old BACK GATE wall; PILOT West Bank low retaining wall |
| psxg_iron_gate_1 / psxg_iron_gate_2 | PSX Graveyard (cat) | 1.2 m leaf, h 2.0; _2 stands ajar | The estate BACK GATE; the graveyard gate (gate_2 ajar = horror) |
| hw_wall / hw_wall_2 / hw_wall_3 / hw_wall_4 | Halloween pack · Elbolilloduro (cat) | 3.6 m panel, h 2.4-2.6 (brick) | Back-gate wall, gatehouse yard |
| hitching_rail | Meshy AI (Desert) (cat) | - | Ranch paddock / yard; a short old fence on the Bluff |
| decor_stone_arch | Meshy decor (cat) | h 3.5 | The estate BACK GATE arch |
| brick_arch | Meshy AI (mondo) (cat + 7b) | - | Back gate |
| castle_gate / castle_wall | McSteeg Castles | - | no (too castle) |

No wooden rail / farm fence pieces in this range (look in the first half).

## Buildings & building parts (gatehouse, ranch)

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| woods_cabin | Meshy AI, the Woods' horror pass (cat) | 7.0 x 6.9 (2 x 2 squares), derelict log cabin | GATEHOUSE / lodge stand-in; OLD CAMP cabin |
| abandoned_house | Elbolilloduro Abandoned House · CC0 (cat) | 36.3 x 23 | the Haunted House (its note: "past the Haunted grounds"), already this zone's |
| trailer_home_1 … trailer_home_6 | Elbolilloduro Trailer Park (cat; note says "Area 51 + Skinwalker rooms") | - | Ranch yard (already used in Skinwalker rooms) |
| city_house | Elbolilloduro House · CC0 (cat) | - | Ranch FARMHOUSE stand-in |
| city_quequis_house | Elbolilloduro (cat) | - | Ranch second house |
| decor_windpump_tower + decor_windpump_wheel | Meshy decor (cat) | h 8 | Ranch WINDMILL (the farm wind pump) |
| water_tower_west | Meshy AI (Desert) (cat) | - | Ranch water tank |
| covered_wagon | Meshy AI (Desert) (cat) | - | Ranch yard / barn |
| ancient_well | Meshy AI (mondo) (cat + 7b) | - | Ranch yard well; gatehouse yard |
| leaf_wooden / leaf_beige_wood / leaf_white_wood | Door leaves (author not recorded) (cat) | - | GATEHOUSE door leaf |
| library_ladder | Meshy (University) (cat) | - | GATEHOUSE LADDER to the loft |
| ladder_wall_rack | Meshy (Civic) (cat) | - | gatehouse / barn wall ladder |
| rocking_chair | Meshy decor (proc wears it) (cat) | - | Farmhouse porch; gatehouse (horror: it rocks) |
| candelabra | Meshy (Southside) (cat) | - | Gatehouse inside |
| railway_lantern | Meshy (Industrial) (cat) | - | Gatehouse; old camp |
| footlocker | Meshy (Civic) (cat) | - | Gatehouse loft; old camp |
| hearth_fire | made in code (§8 proc) | - | Gatehouse fireplace |
| chimney_smoke | made in code (§8 proc) | - | Farmhouse / gatehouse chimney |
| doormat | made in code (§8 proc) | - | Gatehouse door |
| house_stairs | made in code (§8 proc) | - | Gatehouse loft stair if no ladder |
| ride_on_mower | Meshy (Sports + Culture) (cat) | - | Ranch yard / barn |
| tire_stack | Meshy (Southside) (cat) | - | Ranch yard |
| tool_chest / engine_hoist | Meshy (Southside) (cat) | - | Ranch barn |
| metal_trash_can / garbage_bag | Elbolilloduro Trailer Park (cat) | - | Ranch yard |
| power_pole | Elbolilloduro Tacos (cat) | - | County Lane, Ranch |
| utility_box | CC0 'clip ready' (cat) | - | County Lane / barn |
| car_truck | GGBot cars, pool `van` (cat) | - | Ranch yard truck |
| crashed_car | GGBot cars, pool `wreck` (cat) | - | County Lane wreck (horror) |
| wooden_bucket | Meshy AI (mondo) (cat + 7b) | - | Ranch well; PILOT fishing bucket on the beach |

## Horror

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| psxg_tombstone_1 / _2 / _3 | PSX Graveyard (cat) | h 1.03-1.18 | GRAVEYARD; one lone grave on the House Trail |
| psxg_dirt_grave | PSX Graveyard (cat) | 0.9 x 2.25 mound | Graveyard; a fresh grave by the old camp |
| psxg_coffin | PSX Graveyard (cat) | 0.86 x 2.2 | Graveyard |
| psxg_jack_o_lantern_1 / _2 | PSX Graveyard (cat) | - | Farmhouse porch / Corn (autumn) |
| trap_coffin_wood / trap_coffin_lid | Traps pack (cat) | - | Graveyard; barn |
| wooden_cross | Meshy AI (mondo) (cat + 7b) | - | Graveyard; a grave marker on the trail |
| angel_statue | Meshy AI (mondo) (cat + 7b) | - | Graveyard |
| stone_urn | Meshy (Financial) (cat) | - | Graveyard; the estate's back gate posts |
| tomb_plaque | Meshy AI (cat) | - | Graveyard |
| skull_pile | Meshy AI (mondo) (cat + 7b) | - | House Trail old camp (Blair Witch) |
| candleRing / candleLine / candle | Meshy AI (mondo) (7a spell props; candleRing has a catalogue row) | - | Old camp ritual |
| ritual_circle | made in code (§8 proc) | - | Old camp; Dead Oak |
| decor_effigy_figure | Meshy decor (cat) | - | SCARECROW stand-in (Corn); hanging figure in the woods |
| item_ward_totem | Meshy, held props (cat) | - | House Trail stick-figure stand-in; the Dead Oak |
| item_hagstone / item_dowsing_rod | Meshy held props (cat) | - | Old camp found items |
| missing_board | Meshy AI, Woods horror pass (cat) | h 3.2, "a trailhead notice board" | House Trail trailhead; PILOT where the West Bank trail leaves |
| owl_statue | Meshy AI, Woods horror pass (cat) | - | Gatehouse gate post; Dead Oak |
| trap_bear_base + trap_bear_jaw | Traps pack (cat) | - | House Trail woods |
| trap_trip_wire / trap_trip_wire_broken | Traps pack (cat) | - | House Trail |
| trap_chain_draped / wall_chains | Traps pack (cat) | - | Barn; gatehouse |
| hw_web / hw_web_2 / hw_web_3 | Halloween pack (cat) | - | Gatehouse corners, loft |
| security_camera | CC0 'clip ready' (cat) | - | Ranch (the Skinwalker Ranch trail cameras) |
| dish | Meshy AI (mondo) satellite dish (cat + 7b) | - | Ranch watch post (Skinwalker) |
| ufo / saucer_lg | Meshy AI (mondo) (cat + 7b) | - | Ranch sky / the hay field event |
| item_old_camera_flash | Meshy held prop (cat) | - | Old camp: the lost camera |
| field_radio / walkie_talkie / retro_radio | Meshy / Elbolilloduro (cat) | - | Old camp |
| meat_hook | Meshy decor (cat) | - | Barn |
| warning_tape | made in code (§8 proc) | - | Old camp / a closed trail |
| floor_stain | made in code (§8 proc) | - | Gatehouse floor |
| sack / rope / voodooDoll / skull / cauldron | Meshy AI (mondo) (7a spell props; only skull + cauldron have catalogue rows) | - | Old camp |

## Signs & lights, camp gear, picnic

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| signpost | Meshy AI (mondo) blank wooden signpost (cat + 7b) | h 2.2 | PILOT the trail sign where the West Bank trail leaves west; Bluff lookout sign |
| notice_board | proc wearing Meshy decor (cat, wall-mounted) | h 1.15 | Boathouse wall; gatehouse |
| iron_garden_bench | Meshy (Financial) (cat) | span 1.6, white slats | PILOT BLUFF BENCH (Victorian iron bench, an estate look) |
| city_bench | Meshy AI (mondo) (cat) | - | PILOT bench alternative (more city looking) |
| campfire | Elbolilloduro Survival · CC0 (cat + 7b) | - | OLD CAMP; PILOT beach fire ring |
| camping_tent | Elbolilloduro Survival (cat + 7b) | - | OLD CAMP |
| ship_lantern / lantern | Elbolilloduro Survival lantern (cat ship_lantern; 7b lantern) | - | Old camp; dock; gatehouse |
| brazier | Meshy AI (mondo) (cat + 7b) | - | Back gate posts |
| decor_wall_torch_bracket | Meshy decor (cat) | - | Gatehouse wall |
| ebd_abandonedhouse_bare_bulb | Elbolilloduro Abandoned House (cat) | - | Gatehouse / barn ceiling bulb |
| decor_sheep | Meshy decor (cat) | - | Ranch field |

## Animals & small life

| key | pack / source | size | where it fits |
| --- | --- | --- | --- |
| crow | Crow + rabbit (mondo's upload) (cat) | - | PILOT Bluff lone tree; Corn; Dead Oak |
| rabbit | Crow + rabbit (cat) | - | PILOT bank meadow |
| wolf | Farm / zoo animals (cat) | - | House Trail (the skinwalker) |
| horse / horse_black / horse_brown | Horse pack (cat) | - | Ranch paddock |
| cow | Farm / zoo animals (cat) | - | Ranch cow shed |
| chicken | Farm / zoo animals (cat) | - | Ranch coop |
| dog / cat | Farm / zoo animals (cat) | - | Ranch yard / farmhouse |
| bat_black / bat_brown / bat_grey | Bats (OBJ), the bat_ procs (cat) | - | Gatehouse loft; Dead Oak at night |
| eagle | Meshy-style eagle, rigged by Claude (cat) | - | PILOT over the Bluff |
| grasshopper / grasshopper_brown / grasshopper_jump | Insects pack (cat) | - | Hay field; PILOT bank grass |
| luna_moth / hawk_moth / moth_frames | Insects pack (cat) | - | Lanterns at the camp, the gatehouse |
| monarch / swallowtail / butterfly / ladybug | Insects / Farm packs (cat) | - | PILOT bank meadow |
| bee / bumblebee | Insects pack (cat) | - | Ranch flowers |
| anthill | Insects pack (cat) | - | House Trail / Ranch |

## NOTES

- Sizes: MODEL_LIST.md has none in this range; every size above is from the key's data.js row. The Retro Foliage rocks/dead wood/grass sizes come from the generated flora rows near data.js line 100955 (`row('rf_rock_3', { span: 3.5 ... })`), which add them to DOOR_HQ.catalogue at load, so a plain `rf_rock_1: {` grep finds nothing. They are still catalogue keys.
- Retro Foliage is split in two: the 65 catalogue props (rf_rock_*, rf_grass_*, rf_plant_*, rf_flower_*, the dead and fallen wood, the stumps) are in §6, but the LIVING trees (rf_oak_*, rf_willow_*, rf_birch_1-4, rf_fir_*, rf_fir_*_dead) are only tree keys in §7d (HQ_TREE_KINDS). Plant them as tree kinds, not as props.
- Reeds: there is no "reed" model. data.js ZONE_FLORA `reed` = rf_grass_5 + rf_grass_6 + rf_plant_5 + rf_plant_6 (rushes and cattails). Use that mix.
- Licences: the Retro Tree Pack (hollow_dead_tree, dead_snag, tree_5, tree_6, pine, cherry/maple tints) and the PSX Mega Pack (cinder_block) are Pizza Doggy, NOT CC0 ("no AI use of the assets"). Quaternius dead trees (tree_13-20, 41, 42) and the Elbolilloduro pieces are CC0. The Ocean pack, Insects, Farm animals, Crow + rabbit, Horse pack and Handpainted flowers are "author not recorded yet".
- Meshy vs pack: "Meshy AI (mondo)" = older hand-made Meshy files with Meshy_AI_*_texture.glb names (menhir, signpost, footbridge, wooden_cross, skull_pile, ancient_well, wooden_bucket, telescope, culvert, anchor). "Meshy AI, made by Claude" = the newer API batches (iron_garden_bench, woods_cabin, missing_board, owl_statue, hitching_rail, covered_wagon, water_tower_west, decor_*). Pack-made fits for the pilot: rf_rock_*, ocean_rock_*, psxg_*, rowboat, fishing_boat, mooring_piles, fallen_log, stump, campfire.
- Not catalogue keys (no `key: {` row in data.js, so they need one before a room can place them): standingstone, culvert, anchor, sack, rope, sandbags, voodooDoll (7a/7b only). menhir is the catalogue form of the standing stone.
- Duplicates (same file, two keys): coral_brain = ocean_coral, kelp = ocean_seaweed, lion_statue = lion, tripod_big = decor_tripod_machine, city_bin listed in two tables, horse / horse_black / horse_brown = one GLB (tinted), every fae_* flower = ew_plant_healflower.glb, tree_52-56 = the same painted-tree files as tree / tree_2-4 / tree_pine, the decor_* catalogue keys are the same files as the _HQ_DECOR_GLB names (decor_windpump_tower = windpump_tower, decor_stone_arch = stone_arch; only the decor_ name is a catalogue key; `stone_arch:` has no row).
- skiff is a proc vehicle (`vehicle: 'boat', float: true`) wearing the Meshy decor skiff, not a plain prop.
- §7e Halloween pieces (Stone_*, Coffin, Shovel, Pumpkin …) are cut by the spells only. Any catalogue hw_* forms of them are in the first half of the list.
- The "Meshy files kept only as a FALLBACK" table (Meshy cars) is not drawn in the game; use the GGBot car pack keys (car_truck, crashed_car).
- abandoned_house is noted as "past the Haunted grounds", so it is probably the Estate's Haunted House already. trailer_home_N is noted as used in the Skinwalker rooms. Both are already in this zone.
- Gaps in this range: no cliff / rock-face / root-wall pieces, no wooden farm fence or post-and-rail, no dock planks, no scarecrow (decor_effigy_figure is the nearest), no picnic table, no cairn (stack ocean_rock_11 + psxg_rock_* or build one in code).

## Reader C

# Reader C: what fits THE ESTATE (pilot: the Lake's West Bank, the Bluff, the Shore Walk)

## 1. What I read, and the counts

- **MODEL_LIST.md lines 3830 to the end**, read through: §8b horizon/sky (8b-A 49 far rosters, 8b-B 37 near settings, 8b-D 9 room weenies, 8b-E 68 board monuments), §9 (Meshy gear list, 72 pieces, all worn/held gear: nothing for the zone), §10 decor still missing (10A 89 rows, 10B, 10C, 10F 26 pack swaps, 10G, 10D 60 non-model jobs, 10E old wishlists), §11 coded shapes, §12 Meshy audit, §12b PSX Mega Pack (584 GLBs, 8 categories), §13 every model file on R2 the tables do not name (3,529 of 6,112 files; 130 folder rows; character/animation folders skipped as off-topic, every world / pack / opt folder read).
- **docs/plans/WISHLIST_MODELS_ADDED.md**: 246 Meshy wish-list models in 16 groups, all with sizes. **docs/disaster-city/pack-claims.md**: the city pack claims (nothing claimed that the Estate needs; the industrial + interior Meshy pieces are free for every district).
- **The live data** through `load-data.js`:
  - `DOOR_HQ.catalogue`: **2,262 rows** (574 `psx_*` PSX Mega Pack, 246 wish list, 106 roads, 67 Halloween, 65 Retro Foliage `rf_*`, 56 ocean pack, 24 PSX graveyard `psxg_*`, 8 hand-painted `hp_*`, 8 Meshy flora `fl_*`, the rest Meshy / Elbolilloduro / procs). Every key + file + size dumped to `readerC/catalogue.txt` and `readerC/cat_compact.txt`; all non-PSX rows read through, PSX rows read by name.
  - `HQ_TREE_KINDS`: **137 kinds** (`readerC/treekinds.txt`).
  - `DOOR_HQ.textures`: 8 (all indoor sheets: terrazzo, stone, oxblood, teal, ceiling, concrete, drywall, carpet). `DOOR_HQ.decals`: 10 room lists; decal kinds are `oil`, `blood`, `grime`, `scorch`, `puddle`.
  - `CALM_TERRAIN.sheets`: **276** keys (calm_*, nz_*, hz_* horror sheets, zl_* blends). Plus sprites.js `TERRAIN_SPRITES` (~230 keys, the sheets a room's `pal` / `cliff` name). Palette keys in use across data.js rooms counted (dirt_2 42 rooms, grass_dark_fantasy 19, dirt_4 19, rocks_5 18 ...).
  - The current Lake room `site_prebuilt_skinwalker_ow_lake`: floor `grass_2`, **cliff `rocks_5`**, pal (8, full) `dirt_2, dirt_4, grass_4, wasteland, urban:WoodFlooring1a, rocks_5, cobblestone, grass_rocky`; 2,610 props, 264 keys (it also holds the ranch yard). Haunted House room: cliff `leaves_3`.

"used at the Lake" below = the key already stands in `site_prebuilt_skinwalker_ow_lake` (count). Sizes: `h` = height m, `s` = span m, `r` = blocker half-sizes; wish-list sizes are w x h x d from the doc. A prop row's own `h` / `span` rescales any model and its blocker (areas-complexes.md, district L notes).

## 2. The fits

### Rock & ledge faces (banks, the Bluff's ledges, the creek cut, dry falls)

| key | source | size | where it fits |
|---|---|---|---|
| `rf_rock_1` | pack (Retro Foliage kit, AFGameAssets) | h1.41 | boulder at a ledge foot; NEW, not at the Lake yet |
| `rf_rock_2` | pack (Retro Foliage) | h1.66 | same; tallest of the kit's upright rocks |
| `rf_rock_3` | pack (Retro Foliage) | s3.5 (flat/wide) | slab rock: Bluff edge lip, dry-falls step, bank toe |
| `rf_rock_4` | pack (Retro Foliage) | s3.3 | same, second slab shape |
| `ocean_rock` .. `ocean_rock_11` | pack (ocean pack, mondo's upload) | h0.5-2.6, s0.5-0.6 | big rocks; `ocean_rock_3` is a PILLAR (sea stack, h 5-11 by row `h`) = a crag on the Bluff face. NOTE they draw near-black (pack colour, no tint); notes say `_3`/`_4` dark = lava plots only, `_5`/`_9` read as black blocks over 3 m |
| `lake_rock` | wish list (Meshy, Plants) | 1.5 x 0.92 x 0.99 | pale water-rounded granite: the shore walk, the bank toe (used at the Lake: 12) |
| `psxg_rock_1` .. `psxg_rock_4` | pack (PSX graveyard) | h0.74 / 0.49 / 0.43 / 0.23 (take an `h`) | scatter rocks, creek-bed stones (used: 7/26/13/41) |
| `cave_stone` | Meshy (standing stone at s0.9) | s0.9 | single rock on a bank (used: 3) |
| `menhir` | Meshy | h2.6 | a standing rock on the Bluff top if one wants an odd stone (used: 4) |
| `sarsen` | Meshy | h3.4 | taller upright stone; ledge crag |
| `ore_heap` | wish list (Farm) | 2.0 x 0.82 x 1.93 | rubble/scree heap at a ledge foot (it is coal+ore: dark) |
| `cairn` | wish list (Camp) | 0.97 x 1.2 x 0.93 | trail marker on the Bluff, the shore walk (used: 5) |
| `stepping_stones` | wish list (Plants) | 3.0 x 0.13 x 0.72 | five flat stones: crossing the marsh / a creek |
| `psxg_stepping_stone_1` / `_2` | pack (PSX graveyard) | h0.04 / 0.05 | single flat stones, shore walk wet bits |
| `rf_willow_dead_2` | pack (Retro Foliage) | h2.44 | dead willow stump: the nearest thing to an exposed ROOT piece on a bank |
| `rf_oak_stump` / `rf_pine_stump` / `rf_stump` | pack (Retro Foliage) | h0.93 / 1.54 / 0.82 | stumps on the bank lip (roots showing) |
| `stump` | pack (Elbolilloduro Vegetation) | h0.6 | (used: 17) |
| `culvert_mouth` | Meshy | h2.6 | a pipe mouth in a creek-cut wall. HEAVY (two in view cost a third of the frame rate) and reads as a sewer: only if the dry creek runs under the lane |
| `waste_pipe` | wish list (Sewers) | 2.24 x 2.25 x 3.0 | concrete culvert pipe under County Lane where the creek crosses |
| `footbridge` | Meshy (plank footbridge) | s4.4 | over the creek cut / a marsh channel |
| `rope_bridge` | wish list (Camp) | 7.0 x 1.5 x 1.7 | over a deeper creek cut (horror walk) |
| `hw_stone` .. `hw_stone_5` | pack (Halloween) | h0.72-1.26 | NOT rocks: notes say these are gravestone shapes (graveyard only) |

### Trees (tree kinds) & flora

| key | source | size | where it fits |
|---|---|---|---|
| `rf_oak_1` .. `rf_oak_4` (+ `_autumn`, `_winter`) | tree kind, pack (Retro Foliage) | kit size | Bluff-top oaks; `rf_oak_*_winter` = BARE oak = the DEAD OAK on the House Trail hilltop |
| `rf_willow_1` .. `_3` (+ `_yellow`, `_blue`) | tree kind, pack (Retro Foliage) | kit size | lakeshore willows along the shore walk / West Bank |
| `willow_tree` | catalogue prop, wish list (Plants) | 8.77 x 8.0 x 7.7 | big weeping willow over the water (used: 2) |
| `rf_birch_1` .. `_4` (+ `_autumn`, `_winter`) | tree kind, pack (Retro Foliage) | kit size | bank woods edge; winter = bare birch for the horror walk |
| `rf_fir_1` .. `_4` (+ `_dead`) | tree kind, pack (Retro Foliage) | kit size (1, 3 tall) | woods wall; `rf_fir_*_dead` brown dead firs for the House Trail |
| `tree_6` (big bare tree) / `tree_5` (bare tree) | tree kind, Retro Tree Pack `rt:dead_tree_rt_1/2` | - | the lone tree on the ridge; dead oak alternative |
| `tree_3` / `tree_52` (oak), `tree` / `tree_53` (birch), `tree_2` / `tree_55` (spruce), `pine` / `tree_56`, `pine_2` (sapling) | tree kind, Retro Tree Pack (Pizza Doggy) | - | the painted trees, the Estate's current look |
| `tree_13` .. `tree_20`, `tree_41`, `tree_42` | tree kind, Quaternius LowPoly `DeadTree_1..10` (CC0) | - | dead-woods wall of the House Trail |
| `tree_31` .. `tree_40` | tree kind, Quaternius `DeadBirch_1..10` | - | dead birches, horror woods |
| `tree_7` .. `tree_12`, `tree_48` .. `tree_51`; `tree_21` .. `tree_30`; `tree_43` .. `tree_47` | tree kind, Quaternius `Tree_*` / `Birch_*` / `Pine_*` | - | live woods if the Retro look is not wanted (style differs) |
| `hw_tree` .. `hw_tree_5` | pack (Halloween) | h7.18 / 6.77 / 5.62 / 4.17 / 7.02 | spooky bare trees: House Trail, graveyard gate (used: several) |
| `psxg_dead_tree_1` / `_2` | pack (PSX graveyard) | h3.64 / 4.51 | small dead trees, the old camp |
| `hollow_dead_tree` / `dead_snag` | Retro Tree Pack (`dead_tree_rt_1/2`) | h5 / h4.6 | (used: 1 / 2) |
| `meshy_dead_snag`, `meshy_dead_tree_with_a_dark_hole`, `meshy_tree_with_a_hole`, `meshy_pine_with_canopy` | Meshy (old Woods pieces, now plain props) | h4 / 5 / 5 / 8 | horror woods accents (the hole tree = Blair Witch feel) |
| `burnt_tree` | wish list (Plants) | 4.49 x 6.0 x 3.47 | charred tree on the House Trail |
| `rf_willow_dead_1` | pack (Retro Foliage) | s9.1 | fallen dead willow lying into the lake / marsh |
| `rf_oak_fallen_1` / `_2`, `rf_pine_fallen_1` .. `_5`, `rf_birch_dead_1` / `_3` | pack (Retro Foliage) | s4.2-11.3 (rect) | fallen trunks: woods wall, across the creek cut, bank edge |
| `fallen_log` / `meshy_fallen_log` | pack Vegetation / Meshy | s3.6 / s3 | (used: 20 / 1) |
| `fallen_redwood` | wish list (Plants) | 12.0 x 3.69 x 4.79 | too big/redwood; only as a giant blocker |
| `psxg_dead_bush_1` / `_2` | pack (PSX graveyard) | h1.17 / 0.77 | dead brush = the House Trail's wall (used: 19 / 9) |
| `tumbleweed` | wish list (Plants) | 0.81 x 0.8 x 0.77 | dry creek bed, ranch (used: 4) |
| `reeds` | wish list (Plants) | 1.34 x 1.8 x 1.35 | reeds + cattails: the marsh, the shore walk water edge (used: 27) |
| `fl_lotus` | Meshy flora | h0.5 | the only lily-pad-like plant: the pond, the marsh |
| `fl_rice_clump` / `fl_wheat_clump` | Meshy flora | h1.0 / 1.1 | wet grass tufts / a hay field edge |
| `rf_grass_1` .. `rf_grass_6` (+ `_dry`, `_dark`, `_frost`) | pack (Retro Foliage) | s1.15 / h0.51-0.9 | West Bank long grass (plain), Bluff top (dry), House Trail (dark) |
| `rf_plant_1` .. `rf_plant_11`, `rf_flower_1` .. `rf_flower_11` | pack (Retro Foliage) | h0.1-1.86 | bank and bluff ground cover |
| `hp_bluebell`, `hp_daisy`, `hp_daisy_bunch`, `hp_violet`, `hp_purple_flower`, `hp_orange_flower` | pack (hand-painted flowers) | h0.42-0.65 | flowers in the bank grass |
| `wild_flowers` / `fern` / `moss_clump` / `leafy_bush` | wish list / Meshy | 0.62 x 0.4 / h0.75 / 0.8 x 0.37 / 1.45 x 1.3 | (used: 105 / 62 / 13 / 49) |
| `woods_thornvine`, `woods_glowcap`, `mushroom2` | Meshy (the Woods) | h1.5 / 0.7 / 1.75 | horror undergrowth, the old camp |

### Ground sheets & textures (paint `pal` keys, a room's `cliff` sheet)

| key | source | size | where it fits |
|---|---|---|---|
| `rocks_5` (= `cliff`, `stone`, calm `calm_rock`) | terrain sheet | tile | ROCK FACES: the Lake room's `cliff` is already `rocks_5`; the ledge sides of the Bluff |
| `rock_wall_1` | terrain sheet | tile | alternative rock-face sheet (12 rooms use it as `cliff`) |
| `rock_wall_2` / `cave_wall` (calm `calm_darkrock`) | terrain sheet | tile | darker rock face (House Trail cuts) |
| `rocks_dark_fantasy`, `rocks_1` .. `rocks_4` | terrain sheet | tile | rock ground on the Bluff lip, creek walls |
| `zl_hz_Stone_09__rock_wall_1`, `zl_hz_Stone_11__rock_wall_1`, `zl_hz_Stone_01__rock_wall_2`, `zl_hz_Stone_01__cave_wall`, `zl_hz_Stone_01__rocks_dark_fantasy`, `zl_hz_Stone_02__rocks_3`, `zl_hz_Stone_10__rocks_3` | CALM_TERRAIN blend sheets | tile | horror-stone blended rock faces |
| `hz_stone_01` .. `hz_stone_14` | CALM_TERRAIN horror sheets (`Assets/world/terrain/horror/`) | tile | horror rock / stone ground |
| `grass_2` (calm `calm_grass`) | terrain sheet | tile | the Estate floor; the West Bank top |
| `grass_3`, `grass_4` | terrain sheet | tile | bank grass variants (`grass_4` in the Lake pal) |
| `grass_rocky` (calm `calm_rockygrass`) | terrain sheet | tile | the Bluff top (open, rocky); in the Lake pal |
| `grass_dark_fantasy` (calm `calm_darkgrass` "Dark moor grass") | terrain sheet | tile | the House Trail, the ridge |
| `dirt_2` (calm `calm_dirt`), `dirt_3` | terrain sheet | tile | the shore walk path, County Lane |
| `dirt_4` (calm `calm_gravel` "Gravel") | terrain sheet | tile | DRY CREEK BED (gravel); district L already paints gravel with it |
| `dirt_slope` | terrain sheet | tile | the bank's slope down to the water |
| `wasteland` (calm `calm_roots` "Root-bound earth") | terrain sheet | tile | the bank lip / roots ground under the woods; in the Lake pal |
| `dark_woods` (calm `calm_forestfloor`), `leaves_2` .. `leaves_5` | terrain sheet | tile | the woods floor, the House Trail |
| `rubble_1` .. `rubble_4` (calm `calm_rubble`) | terrain sheet | tile | scree at a ledge foot, the dry falls |
| `cobblestone_2`, `calm_flagstone` (`bricks_1`) | terrain sheet | tile | the gatehouse yard, the back gate's paving |
| `desert` (calm `calm_sand`) | terrain sheet | tile | sandy dry creek bed alternative |
| `puddle`, `grime`, `scorch` | DOOR_HQ decal kinds | r per row | wet patches on the shore walk, the old camp's burnt ground |
| `swamp` | terrain sheet | tile | NOT a marsh: it is a purple liquid (`liquids/Liquid_Purple_01`) |

### Lakeshore

| key | source | size | where it fits |
|---|---|---|---|
| `dock_boat` | wish list (Sea) | 6.0 x 1.86 x 3.75 | a short dock on posts WITH a rowboat: the West Bank landing |
| `hw_pier` | pack (Halloween `Concrete_01`) | h2.64 | concrete pier/post (used: 3) |
| `mooring_piles` | pack (Elbolilloduro Houses on the water) | s1.26 | piles at the dock |
| `mooring_bollard` | wish list (Sea) | 0.61 x 0.7 x 0.61 | (used: 6) |
| `rowboat` / `meshy_rowboat` | pack (Houses on water) / Meshy | s3 / s3.2 | boats pulled up on the shore walk (used: 5 / 3) |
| `fishing_boat` | pack (Houses on water) | s6.69 | (used: 1) |
| `dugout_canoe` / `raft` | wish list (Sea) | 5.0 x 0.57 x 1.84 / 1.91 x 2.66 x 3.0 | a canoe in the reeds; the raft = a found/odd thing in the marsh |
| `oars` / `fishing_rod` | wish list | 0.68 x 0.06 x 2.4 / 2.0 x 2.4 x 1.64 | West Bank landing (used: 2 / 3) |
| `stilt_hut` / `stilt_house` | pack (Houses on water) | s5.4 / s8.09 | a fishing shack over the marsh |
| `coin_telescope` | wish list (House) | 1.05 x 1.5 x 0.64 | THE BLUFF LOOKOUT: a viewer pointed at the boathouse |
| `brass_telescope` | Meshy | h2 | alternative lookout (used: 1) |
| `rope_coils` / `beach_life_ring` | wish list / pack (elegantcrow) | 1.2 x 0.57 x 0.8 / s0.78 | dock dressing (used: 3 / 1) |
| `drying_fish` / `fish_boxes` | wish list (Sea) | 2.0 x 2.18 x 1.3 / 1.2 x 1.06 x 0.77 | by the boathouse |
| `bird_bath` | wish list (Storybook) | 0.71 x 0.9 x 0.71 | (used: 1) |
| `rf_willow_*`, `willow_tree`, `reeds`, `lake_rock`, `fl_lotus` | see above | | the shore edge |

### Fences & gates

| key | source | size | where it fits |
|---|---|---|---|
| `barbed_wire_fence` | wish list (Farm) | 3.5 x 1.74 x 0.61 | the old fence line on the ridge, the Bluff's back edge (used: 7) |
| `fence_with_gate` | wish list (Farm) | 3.5 x 1.24 x 0.3 | split-rail with a gate: where the West Bank trail leaves (used: 2) |
| `braced_gate` | wish list (Farm) | 3.0 x 2.51 x 0.21 | five-bar field gate (used: 4) |
| `timber_gate` | wish list (Farm) | 3.5 x 3.58 x 0.6 | heavy log gate with iron straps: THE BACK GATE of the estate |
| `garden_gate` | wish list (Farm) | 1.4 x 1.88 x 0.64 | the gatehouse's little garden gate |
| `hw_fence` | pack (Halloween) | h1.24, r0.82 x 0.1 | wooden fence run (used: 33) |
| `hw_fence_iron`, `hw_fence_iron_2`, `hw_fence_iron_3` | pack (Halloween) | h2.73, ~3.6 m long | the estate's iron fence by the back gate, the graveyard |
| `hw_gate_leaf` / `hw_gate_leaf_2` | pack (Halloween) | h2.48 | iron gate leaves: the back gate into the GRAVEYARD |
| `psxg_iron_gate_1` / `_2` | pack (PSX graveyard) | h2 | smaller iron gate (graveyard) |
| `psxg_wall`, `psxg_wall_pillar`, `psxg_wall_corner` | pack (PSX graveyard) | h1.01 (3.74 long) / 1.5 / 1.5 | low stone wall + gate piers at the back gate |
| `psxg_railing` / `psxg_railing_corner` | pack (PSX graveyard) | h0.95, 4.7 long / h0.87 | iron railing along the Bluff edge |
| `hw_wall` .. `hw_wall_4` | pack (Halloween) | h2.38-2.64, ~3.3-3.6 long | estate boundary wall either side of the back gate |
| `chain_fence` | wish list (Farm) | 3.5 x 2.16 x 0.2 | (a later, modern fence; not the old estate) |
| `hitching_rail` | Meshy (the Desert) | s3.2 | ranch / gatehouse yard (used: 5) |
| `railing_1m` / `meshy_one_meter_of_railing` | Meshy | s1 | a short rail at the lookout |
| `brick_arch` | Meshy | h3.2 | an arch over the back gate |
| `decor_stone_arch` | Meshy decor | h3.5 | curved stone arch: graveyard gate |
| `leaf_barn`, `leaf_stable`, `leaf_shabby_wood`, `leaf_wooden` | door leaves (Meshy / pack) | - | the gatehouse door (`leaf_shabby_wood`), barn/stable doors |

### Buildings & parts (the gatehouse / lodge, small rural buildings)

| key | source | size | where it fits |
|---|---|---|---|
| `woods_cabin` | Meshy (the Woods) | s7, r3.35 x 3.45 | a whole small cabin: the GATEHOUSE outside if a walk-in shell is drawn round it (a prop, not enterable) |
| `outhouse` | wish list (Camp) | 1.69 x 2.4 x 1.86 | beside the gatehouse, the old camp (used: 2) |
| `lean_to` | wish list (Camp) | 3.0 x 1.46 x 2.45 | THE OLD CAMP shelter |
| `timber_lookout` | wish list (Camp) | 3.21 x 8.0 x 4.68 | a fire lookout tower: the Bluff or the hill (big) |
| `kennel` | wish list (Farm) | 1.2 x 1.17 x 1.07 | gatehouse yard (used: 1) |
| `xmas_house` | pack (Christmas) | h8.8 | small house model; Christmas-looking, probably not |
| `trailer_home_1` .. `_6` | pack (Trailer scene) | s15 | ranch hands (used at the Lake: 3) |
| `psx_wall_1`, `psx_wall_1_plain`, `psx_wall_1_half`, `psx_wall_2_1` | pack (PSX Mega Pack, modular) | 4 m x 3 m | GATEHOUSE walls built piece by piece (one room) |
| `psx_doorway_1`, `psx_doorway_1_plain`, `psx_doorway_door_mp_1`, `psx_side_doorway_1` | pack (PSX Mega Pack) | h3 | the gatehouse door wall |
| `psx_window_1_single`, `psx_window_2_single_no_glass`, `psx_window_1_single_frame_only`, `psx_window_metal_bars_single` | pack (PSX Mega Pack) | h3 / h1.6 | gatehouse windows (broken / barred for horror) |
| `psx_floor_ceiling_1` .. `_3` | pack (PSX Mega Pack) | s4.04 | THE LOFT floor (4 m tiles) |
| `psx_stairs_5_wood` / `psx_stairs_mp_1` | pack (PSX Mega Pack) | h3.2 | stairs to a loft (if not a ladder) |
| `psx_beam_1` / `psx_beam_2`, `psx_pillar_1` | pack (PSX Mega Pack) | h0.46 / h3 | loft beams, posts |
| `psx_door_1_loose` .. `psx_door_4_loose` | pack (PSX Mega Pack) | h2.1 | a loose door leaning on a wall |
| `wooden_ladder` | wish list (Farm) | 1.05 x 3.0 x 0.17 | THE LADDER to the gatehouse loft (used: 2) |
| `library_ladder` | Meshy city interiors | h3 | alternative ladder (indoor style) |
| `psx_old_mattress_mp_1`, `psx_bed_1_frame`, `psx_wardrobe_mp_1`, `psx_chair_mp_3`, `psx_table_large_2`, `psx_shelf_mp_5`, `psx_bedside_table_1` | pack (PSX Mega Pack) | - | the gatehouse inside + loft |
| `wood_stove`, `rocking_chair`, `footlocker`, `hearth_fire`, `chimney_smoke` | wish list / proc | - | the lodge room (used at the Lake already in the farmhouse) |
| `antler_trophy`, `fur_rug`, `oil_lamp`, `psx_lamp_1_on` | wish list / pack | - | lodge wall/floor |

### Horror

| key | source | size | where it fits |
|---|---|---|---|
| `hooded_statue` | wish list (Haunted) | 0.76 x 2.2 x 0.68 | faceless hooded figure on the Bluff / the House Trail |
| `weeping_angel` | wish list (Haunted) | 1.09 x 2.0 x 1.3 | the graveyard gate |
| `missing_board` | Meshy (the Woods) | h3.2 | MISSING posters board at the West Bank trailhead (used: 1) |
| `raven_perch` / `owl_perched` / `vulture` | wish list (Animals) | 0.23 x 0.9 / 0.45 x 0.7 / 0.48 x 0.8 | watchers on posts |
| `hw_scarecrow` / `hw_scarecrow_2` | pack (Halloween) | h2.63 / 2.48 | (used: 5 / 7) |
| `cattle_skull` / `skull` / `skull_pile` | wish list / Meshy | 0.7 x 0.46 / h0.22 / s1.3 | the dry creek, the old camp (`skull` is 10k tris: few) |
| `wooden_cross` / `cross` | Meshy | h3 / h1.6 | a grave by the pond |
| `trap_bear_open`, `trap_trip_wire`, `trap_trip_wire_broken` | proc / traps pack | s0.75 / s1.75 | the old camp, the trail |
| `meshy_voodoo_doll` | Meshy | h0.25 | stick-figure substitute (no Blair-Witch stick figure exists) |
| `hw_web` .. `hw_web_3`, `psx_cobweb_1` .. `_5` | pack (Halloween / PSX decals) | s1.07-1.2 / h0.8 | gatehouse corners, the loft |
| `hw_body`, `hw_body_rising`, `hw_part_*` | pack (Halloween) | - | graveyard only (gore) |
| `ritual_circle`, `candleRing`, `hw_candles`, `lit_candle` | proc / Meshy / pack / wish list | - | the old camp, the dead oak |
| `bell_frame` | wish list (Haunted) | 1.8 x 2.5 x 0.99 | an old bell at the back gate / gatehouse |
| `gallows` | wish list (Western) | 3.93 x 5.0 x 4.4 | the dead oak's other option (strong; ask) |
| `hearse_carriage` | wish list (Haunted) | 4.5 x 2.75 x 2.19 | by the graveyard gate |
| `cursed_tv_set` | Meshy decor | h2.083 | (an odd find in the gatehouse) |
| `meshy_black_blob` | Meshy | h1 | something in the pond |
| `crashed_car` | Meshy | s4.6 | an abandoned car on the House Trail (used: 1) |

### Signs & lights

| key | source | size | where it fits |
|---|---|---|---|
| `signpost` | Meshy (blank wooden signpost) | h2.2 | the West Bank trail junction (used: 4) |
| `trail_sign` | wish list (Camp) | 1.57 x 2.2 x 0.96 | trail map board at the start of the House Trail (used: 1) |
| `milestone` | wish list (Storybook) | 0.67 x 1.0 x 0.46 | (used: 10) |
| `fire_danger_sign` | wish list (House) | 1.69 x 2.2 x 0.26 | (used: 1) |
| `lantern_post` | wish list (Lights) | 0.7 x 2.2 x 0.33 | the shore walk lights (used: 25) |
| `iron_lamp_post` | wish list (Lights) | 0.61 x 3.5 x 0.62 | the estate drive at the back gate (used: 16) |
| `ship_lantern`, `meshy_hanging_lantern`, `railway_lantern` | Survival pack / Meshy | h0.5 / 0.5 / 0.4 | the dock, the gatehouse door |
| `cage_lamp` | wish list (Lights) | 0.29 x 0.3 | the boathouse wall |
| `campfire` / `meshy_campfire_ring` | pack Survival / Meshy | s1.5 / s1.2 | THE OLD CAMP (used: 3 / 4) |
| `cave_torch` | Meshy decor | h1.9 | (used: 10) |
| `telegraph_pole` / `power_pole` | wish list / pack (Tacos) | 3.23 x 7.0 / h11 | County Lane lines (used: power_pole 8) |
| `string_lights` | wish list (Lights) | 4.0 x 2.41 x 0.29 | (used: 2) |

### Camp (the OLD CAMP)

| key | source | size | where it fits |
|---|---|---|---|
| `canvas_tent` | wish list (Camp) | 3.86 x 2.4 x 3.51 | old 1800s tent, ripped feel |
| `camping_tent` / `meshy_camping_tent` | pack Survival / Meshy | s3.2 / s2.4 | the Blair-Witch tent |
| `sleeping_bag`, `backpack`, `kettle` | wish list (Camp) | 2.0 x 0.28 / 0.54 x 0.75 / 0.31 x 0.3 | left behind gear (used: 1 each) |
| `firewood_stack`, `axe_chopping_block` | wish list (Farm) | 2.0 x 0.82 / 0.88 x 1.1 | gatehouse yard, the camp |
| `picnic_table` | wish list (Camp) | 2.0 x 0.95 x 1.83 | the Bluff top (used: 6) |
| `iron_garden_bench` / `park_bench` | Meshy / proc | s1.6 / h0.85 | the Bluff lookout seat |
| `tyre_swing` | wish list (Camp) | 2.74 x 3.0 x 0.43 | under the dead oak (used: 1) |

### Small life

| key | source | size | where it fits |
|---|---|---|---|
| `duck`, `heron`, `swan` | wish list (Animals) | 0.17 x 0.4 / 0.26 x 1.0 / 0.83 x 0.8 | the lake, the marsh (used: 8 / 2 / 2) |
| `river_fish`, `meshy_frog`, `dragonfly`, `firefly` | wish list / Meshy | tiny | the pond, the marsh (frog 5k tris) |
| `crow` | pack (animals) | h0.3 | (used: 42) |
| `deer`, `fox`, `coyote`, `wolf`, `mountain_lion` | wish list / pack | 1.8 / 0.45 / 0.65 / h0.85 / 0.8 | glimpsed in the woods (`wolf` = pack `Wolf1`) |
| `rabbit`, `hedgehog`, `rat`, `spider`, `rattlesnake` | pack / wish list | small | the trail, the creek bed |
| `bat_black`, `bat_brown`, `bat_grey` | proc (bat models) | s0.45 | the gatehouse loft |
| `luna_moth`, `hawk_moth`, `moth_frames` | pack (bugs) | ~s0.15-0.18 | lantern moths (11 draw calls each: few) |

## 3. ON R2 BUT NOT WIRED that would fit

§13's "the game does not load it" is partly STALE: everything in `Assets/world/props/meshy/wishlist/` (246) and the "UNSORTED" `Assets/world/props/meshy/` files (`woods_cabin`, `owl_statue`, `missing_board`, `covered_wagon`, `hitching_rail`, `water_tower_west`, ...) IS a live catalogue row (checked against `DOOR_HQ.catalogue`). Genuinely unwired files that could matter:

- `Assets/world/packs/stairs/stairs.glb`, `stairs_railings.glb` (ATD-London Stairs & Railings, CC-BY 4.0, credit required, 32 MB): wooden stairs + railings for the gatehouse loft or a Bluff stair (needs optimising + a credit line).
- `Assets/world/packs/elbolilloduro_halloween/characters/Character.fbx`, `Character_Witch.fbx` (Halloween pack, CC0): a WITCH character (Blair Witch) and a plain character; not loaded (only the ghost is).
- `Assets/world/nature/FBX/*.fbx` and `Assets/world/nature/Blends/*.blend` (Quaternius LowPoly nature, 45 each: Birch, DeadBirch, DeadTree, Pine, Tree): source copies; the OBJs ARE the tree kinds `tree_7`..`tree_51`.
- `Assets/world/nature/retrotreepack/GLB/tree_rt_2.glb`, `_3`, `_4`: the raw Retro Tree Pack GLBs (the game loads the `rt:` full versions).
- `Assets/world/animals/horses/Horse.blend`, `Horse_fbx.fbx`: sources of the wired `horse` rows.
- `Assets/world/animals/eagle.fbx`, `eagle.glb`: unrigged eagle original (the rigged one is `eagle`).
- `Assets/world/packs/traps/Coffin_Wood-colonly.glb`, `Chain_Draped-colonly.glb`, `Iron_Maiden-colonly.glb`: colour-only variants of wired traps.
- `Assets/world/props/meshy/road/road.obj` (+ .fbx/.dae/.blend/.3ds): one road piece, author not recorded (not a dirt lane).
- Assets/opt: `ewb_scarecrow.opt.glb`, `ewm_t2scarecrow_outfit.opt.glb`, `ewm_t2scarecrow_hat.opt.glb` (creator clothes: a scarecrow outfit for an NPC) and `Meshy_AI_scarecrow_biped_Character_output.opt.glb` (a rigged scarecrow unit), `Meshy_AI_jack_o_lantern_Running`, `Meshy_AI_walking_tree_Running`, `Meshy_AI_treeperson_Running` (rigged units: a walking tree on the House Trail would be a resident, not a prop).

## 4. NOTES

- **No rock-face or cliff MODEL exists.** No pack piece is a cliff wall, a rock-face module, an exposed root mass or an overhang. The ledges' faces must be the room's `cliff` sheet (the Lake's is `rocks_5`; `rock_wall_1` and `rock_wall_2`/`cave_wall` are the other faces in use) with boulders at the foot: `rf_rock_1`..`_4` (the best colour match for the painted Retro look, NEW to the Lake), `lake_rock`, `psxg_rock_*`, and `ocean_rock_3` as a crag (it draws near-black; a row takes no tint). §8b says "no downloaded pack has a mountain" and §11 asks for a far range model; the same gap applies to cliffs. If mondo wants real faces, that is a Meshy (or pack) request: "a low weathered rock ledge face, 3.5 m long, 1.75 m high".
- **Roots:** only `rf_willow_dead_2`, the `rf_*_stump` pieces and fallen trunks show roots. No root-wall piece.
- **The dead oak:** `rf_oak_1`..`_4_winter` (bare Retro Foliage oak) matches the kit's live oaks; `tree_6` (big bare tree) and `hw_tree*` are the other bare trees.
- **The pond / marsh:** `reeds` (cattails included), `fl_lotus` (the only lily pad), `stepping_stones`, `rf_willow_dead_1` lying in the water, `duck` / `heron` / `meshy_frog` / `dragonfly`. No mud sheet: `swamp` is a purple liquid; use `dirt_2`/`wasteland` + `puddle` decals.
- **The gatehouse:** no small lodge or gatehouse building you can walk into. Build the one room from the PSX Mega Pack modules (`psx_wall_1` 4 m x 3 m, `psx_doorway_*`, `psx_window_*`, `psx_floor_ceiling_1` for the loft, `wooden_ladder` 3 m to the loft); every `psx_*` piece is cheap. The licence bars any AI use of PSX pack models (never feed them to Meshy). `woods_cabin` (7 m) is the only whole cabin model but is a solid prop.
- **The back gate:** `timber_gate` (3.5 m log gate) or `hw_gate_leaf` pair between `psxg_wall_pillar` / `hw_pier` piers, `hw_wall` / `hw_fence_iron` either side, `brick_arch` / `decor_stone_arch` over it.
- **The Bluff lookout:** `coin_telescope` or `brass_telescope`, a bench, `psxg_railing` along the ledge edge, `cairn`, `signpost`.
- **Palette:** the Lake room's `pal` already holds 8 sheets (pack-claims.md calls the city's 8 FULL): adding `rubble_*`, `dirt_slope`, `grass_dark_fantasy` or a rock sheet for the Bluff top means swapping one out (`cobblestone` / `urban:WoodFlooring1a` are candidates if their squares move).
- **Cost:** `culvert_mouth` is heavy and reads as a sewer; `skull` 10k tris, `meshy_frog` / `meshy_rope` 5k; moths 11 draw calls each. Every `psx_*` / `hw_*` piece is cheap (district O note). Many small things are cheaper as one `arch` row.
- **Already at the Lake** (2,610 props): reeds, lake_rock, psxg rocks, willow_tree, mooring_bollard, rowboat, barbed_wire_fence, lantern_post, missing_board, trail_sign. NOT yet used there: `rf_rock_*`, every `rf_*` tree kind, `ocean_rock_*`, `dock_boat`, `coin_telescope`, `timber_gate`, `hooded_statue`, `fl_lotus`, `stepping_stones`, `burnt_tree`, `lean_to`.
- §8b near settings `skinwalker` (fallen_log, signpost, trees) and `haunted` (stump, trees) and the `windmill` monument (Meshy windpump tower + wheel, `decor_windpump_tower` / `_wheel`) are the zone's battle-board landscape; no far landmark exists for the zone since the cone mountains went.
- Wish list "not made": papyrus, whale bones, gold pile, wheat patch. Nothing on it is a cliff, a gatehouse or a boathouse.
