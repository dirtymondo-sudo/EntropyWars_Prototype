# FITS KATANA ISLAND: the full shortlist (thread 21, 2026-11-20)

Made by reading every list end to end (MODEL_LIST.md in five parts, the live catalogue of 2,156 rows through load-data.js, the tree kinds, the wish list, pack-claims.md, a fresh listing of the bucket, 9,887 objects). Keys were copied by the readers: LOOK at a model before placing it. The summary and the NEEDS A MODEL list are in docs/notes/areas-complexes.md "KATANA ISLAND, THE PLAN".

---

## Reader 6

# Part 6: the LIVE data (catalogue, textures, decals, tree kinds, wish list, pack claims, the R2 bucket) for KATANA ISLAND

Read end to end: all 2,156 rows of `DOOR_HQ.catalogue` (dumped with load-data.js: `dump.js` / `dump2.js` in this folder, text in `cat2.txt`),
the 8 `DOOR_HQ.textures` keys, the 10 `DOOR_HQ.decals` rooms, the 83 `HQ_TREE_KINDS`, WISHLIST_MODELS_ADDED.md (246), pack-claims.md, and a
fresh listing of the whole bucket `ewmusicsfx` (9,887 objects, listed today through the same API call `list-models.js --r2` makes; I did NOT run
`--r2` itself because it rewrites R2_MODEL_FILES.json and MODEL_LIST.md in the repo, and the brief says edit nothing; my copy is `r2_all.json` here).

## Top summary

**Best finds (all WIRED, placeable today):**
1. A small real Japanese set already exists: `stone_lantern` (toro), `paper_lantern` (red, hanging), `taiko_drum`, `dojo_weapon_rack`, `wing_chun_dummy`, `gong`, `prayer_flags`, `privacy_screen` (a folding screen), `votive_stand`, `teapot` / `teacups` / `kettle`, `bell_frame`, `armour_stand`, `banner`.
2. Harbour is well covered: `fishing_boat`, `rowboat`, `dock_boat`, `dugout_canoe`, `raft`, `skiff` (drivable), `trawler`, `stilt_hut` / `stilt_house` / `stilt_house_wide`, `thatched_hut` (bamboo walls), `drying_fish`, `woven_baskets`, `rope_coils`, `mooring_bollard`, `mooring_piles`, `lobster_traps`, `fishing_net_wall`, `fishing_rod`, `oars`, plus the whole Ocean pack (crab, turtle, fish, koi stand-ins).
3. Village / farm is well covered by the wish list's Farm + Camp groups (hay, carts, plough, forge, anvil, well, barrel, gates, fences, beehive, market stall) and the Halloween pack's `hw_farmland` / `hw_crop*` / `hw_straw` / `hw_scarecrow`.
4. Jungle + volcano basics exist: `banana_plant`, `tropical_bush`, `palm_tree`, `fern`, `moss_clump`, `willow_tree`, `reeds`, `rope_bridge`, `carved_totem_pole`, `tiki_torch`, `burnt_tree`, `crystal_cluster`, `skull_pile`, `cattle_skull`; terrain sheets `lava`, `obsidian`, `scorched`, `calm_lava_1..4`, `calm_obsidian_1..2`, `nz_magma`, `healing_spring` / `nz_spring` (hot springs), and the `{ k: 'fall', key: 'lava' }` waterfall row.
5. Buildings are made in code, not from models: `texbuilding` rows + `arch` parts over terrain sheets. A thatch recipe is already written down (roof `urban:WoodGeneric2a` tinted 0xd2b060 gain 1.7; wattle wall `WoodGeneric1a` tinted 0xcdb88a). Plaster (`PlasterWallStucco*`, `PlasterWallGeneric*`, `calm_plaster_1`), wood (`WoodCladding*`, `WoodBeams*`, `WoodFlooring*`, `wood_planks`, `calm_shipwood_1`), roof tile (`MetalRoofTiles1a..3d`, `calm_tiles_small_1` = the slate used on Camelot/University) and stone (`rocks_1`, `calm_castle_1`, `calm_flagstone_1`, `cobblestone`) all exist.
6. Castle walls: kit forms `hqCurtainWall`, `hqCastleTower`, `hqCastleCrown` (data.js HQ_KIT_FORMS) and the McSteeg pack (`castle_wall`, `castle_gate`, `castle_tower`, `castle_tower_top`, `castle_cone`; the GLB holds 26 nodes, only 5 have a row).
7. Units that live there are on R2 as rigged models: `ninja` (m+f), `shogun`, `samurai_slug`, `karate_frog`, `monk`, `swordfighter`, `kifighter`, `sentai`, `dinosaur`, `kaiju`, `dragon` (folders under `Assets/characters/races/`).

**What a Japanese island obviously needs that this part does NOT have (no catalogue row, no R2 file):**
- NO torii gate, NO pagoda, NO shrine / temple building or parts, NO Japanese castle keep (tenshu) or curved-eave roof piece, NO shoji / fusuma door leaf (the 40 `leaf_*` doors are all Western), NO tatami sheet, NO paper-screen sheet, NO bamboo sheet, NO real clay roof-tile (kawara) sheet (only metal roof tiles + slate).
- NO cherry / sakura tree, NO bamboo, NO maple, NO bonsai, NO lily pad / lotus, NO koi. The bucket DOES hold unused leaf recolours for the 45-tree nature pack: `Assets/world/nature/Textures/Color Variations/Leaves_Pink.png`, `Leaves_Red.png`, `Leaves_Orange.png`, `Leaves_DarkRed.png`, `Pine_Leaves_Red.png` (R2 ONLY, no code reads them): a pink `Tree_N` = a cherry, red / orange = maples, with a small code change and no new model.
- NO katana, naginata, yumi bow, samurai armour stand, sword stand (only `sword` = a "master sword", `psx_sword_mp_1`, `spear`, `arrow`, `armour_stand` = a European suit in code).
- NO statues that fit: no Buddha, fox (kitsune / inari), komainu, dragon, tanuki. (`cat_statue` is Egyptian, `lion_statue` is a PSX lion, `golden_idol` is small.)
- NO Japanese food / tableware (sushi, ramen, rice bowl, sake, low chabudai table, zabuton cushion, futon), NO onsen wooden tub (only `hot_tub`, a modern spa), NO rickshaw / ox cart, NO festival stall (yatai), NO rice plant / paddy, NO water wheel / mill, NO noren, NO nobori banner, NO paper umbrella (only `decor_umbrella_closed`, `patio_umbrella`).
- NO living dinosaur prop (only the playable `dinosaur` / `kaiju` units and `dinosaur_skeleton`, which the notes call "a museum mount on a plinth with a rod, not bones on a beach"), NO eggs / nests, NO volcanic rock model (the ocean rocks grown past 3 m draw as flat black slabs: notes), NO jungle vine / giant fern / tree fern, NO monkey, crane (bird), tanuki, koi.
- The bucket holds NO file with japan / torii / pagoda / shrine / sakura / bamboo / katana / temple in its name; every model file in `Assets/world/props` and `Assets/world/packs` already has a catalogue row or a code reference (94 files have no row; none of them is a theme fit: see the last section). So the missing list above is Meshy / pack work, not wiring work.

Sizes are w x h x d in metres (wish-list doc, or docs/disaster-city/prop-sizes.json); `h` or `span` alone = the catalogue's own number.
"placed N" = rows in the compiled rooms of data.js today (all zones); "city N" = of those, in Disaster City rooms. Low numbers = fresh for the island.

---

## Japanese pieces (the whole set that exists)
- `stone_lantern` · Meshy wish list · Camp · 1.18 x 1.6 x 1.2 · "A Japanese stone lantern toro", blocks · WIRED · placed 26, city 0
- `paper_lantern` · Meshy (Entertainment pass 2) · 0.52 x 0.7 x 0.52 · round red paper lantern, hanging · WIRED · placed 67, city 49 (the city uses it heavily)
- `taiko_drum` · Meshy city interiors · 1.17 x 1.15 x 1.0 · WIRED · placed 10, city 1
- `dojo_weapon_rack` · Meshy city interiors · 1.6 x 1.6 x 0.61 · WIRED · placed 11, city 2
- `wing_chun_dummy` · Meshy city interiors · 1.07 x 1.7 x 0.79 · wooden training dummy · WIRED · placed 7, city 2
- `gong` · wish list · Camp · 1.6 x 1.8 x 0.71 · bronze gong in a dark wood frame with a mallet · WIRED · placed 5, city 0
- `prayer_flags` · wish list · Camp · 4.0 x 3.58 x 0.15 · a string of Tibetan prayer flags (festival bunting stand-in) · WIRED · placed 13
- `bell_frame` · wish list · Haunted · 1.8 x 2.5 x 0.99 · iron bell in a wooden frame with a rope (temple bell stand-in) · WIRED · placed 3
- `ships_bell` · Meshy props · 0.2 x 0.55 x 0.3 · small hanging bell · WIRED · placed 15
- `privacy_screen` · Meshy city interiors · 1.59 x 1.8 x 1.42 · folding screen (byobu stand-in) · WIRED · placed 8, city 3
- `votive_stand` · Meshy city interiors · 1.24 x 1.3 x 0.78 · rack of votive candles (shrine offering stand) · WIRED · placed 10, city 2
- `teapot` · Meshy misc · 1.0 x 0.64 x 0.61 at catalogue span 1 (scale down) · WIRED · placed 4
- `teacups` · Meshy misc · h 1.2 at catalogue size, "stacked teacups" (scale down) · WIRED · placed 3
- `kettle` · wish list · Camp · 0.31 x 0.3 x 0.24 · black iron kettle (tetsubin stand-in over a hearth) · WIRED · placed 30, city 5
- `item_censer` · Meshy hand props · h 0.3 · incense burner · WIRED · placed 9
- `armour_stand` · CODE-BUILT (`proc`; a Meshy `world/props/meshy_decor/armour_stand.glb` is its part) · h 2 · a European suit, not samurai · WIRED · placed 47
- `decor_armour_stand_post`, `decor_armour_plinth` · Meshy decor · h 1.7 / 0.6 x 0.67 x 0.6 · the bare post + plinth (hang something else on it) · WIRED · placed 0 / 6
- `banner` · CODE-BUILT wall banner · h 2.6 · WIRED · placed 20
- `flag_pole` · wish list · Military · 4.3 x 8.0 x 0.75 · plain grey and white flag (nobori stand-in at best) · WIRED · placed 9
- `string_lights` · wish list · Lights · 4.0 x 2.41 x 0.29 · round lantern bulbs sagging between two posts (festival street) · WIRED · placed 25
- `festoon` · CODE-BUILT ceiling string of lights · WIRED
- `lantern_post` · wish list · Lights · 0.7 x 2.2 x 0.33 · wooden post with an iron oil lantern · WIRED · placed 188 (used everywhere)
- `meshy_hanging_lantern` · Meshy props · 0.2 x 0.5 x 0.2 · WIRED · placed 21; `ship_lantern` · Elbolilloduro · 0.17 x 0.5 x 0.2, ceiling, a light · placed 40; `railway_lantern` · 0.18 x 0.4 x 0.22
- `oil_lamp` · wish list · Lights · 0.3 x 0.12 x 0.19 · clay oil lamp with a flame · WIRED · placed 15
- `lit_candle` (0.31 x 0.3 x 0.24), `candle` (0.19 x 0.3 x 0.19), `candleLine`, `candleRing`, `hw_candles`, `hw_candle`, `candelabra` (0.65 x 1.8 x 0.57), `candle_ring` (code) · all WIRED
- `instrument_drum` (0.45 x 0.62 x 0.61), `instrument_whistle` (h 0.32, a flute), `instrument_harp`, `lyre` (0.42 x 0.7 x 0.14; biwa / koto stand-ins are weak) · WIRED
- `carved_totem_pole` · wish list · Sea · 3.48 x 4.5 x 0.55 · tribal totem (jungle district, not Japan) · WIRED · placed 22
- `item_ward_totem` (h 1.6), `item_talisman_pendant`, `item_hand_mirror`, `item_wizard_staff` (h 1.8, a monk's staff) · Meshy hand props · WIRED

## Buildings + kit pieces
Whole-building models that could stand on the island:
- `thatched_hut` · wish list · Sea · 5.13 x 4.0 x 4.39 · "tropical island thatched hut with a palm leaf roof and bamboo walls on short stilts", solid (not walk-in) · WIRED · placed 4
- `stilt_hut` (span 5.4), `stilt_house` (span 8.09), `stilt_house_wide` (span 9.48) · Elbolilloduro Houses on Water · wooden houses on piles over water, solid · WIRED · placed 1 each (nearly unused; ideal for Katana Bay)
- `woods_cabin` · Meshy · the Woods · span 7 · log cabin, solid (the Woods replaced it with a built walk-in one) · WIRED · placed 3
- `outhouse` · wish list · 1.69 x 2.4 x 1.86 · plank privy shed · WIRED · placed 14
- `lean_to` · wish list · 3.0 x 1.46 x 2.45 · WIRED · placed 2; `kennel` · 1.2 x 1.17 x 1.07 · placed 5
- `timber_lookout` · wish list · 3.21 x 8.0 x 4.68 · wooden watch tower on four legs (castle / village yagura stand-in) · WIRED · placed 6
- `market_stall` · wish list · Egypt · 2.87 x 2.73 x 3.0 · stall with a striped cloth awning on poles · WIRED · placed 7
- `medieval_pavilion` · wish list · 3.56 x 4.0 x 3.65 · round tent (a war-camp jinmaku stand-in) · WIRED · placed 2
- `canvas_tent` · wish list · 3.86 x 2.4 x 3.51 · WIRED · placed 66; `fortune_teller_tent` (span 3.2), `fortune_tent` (code, h 3.2), `carnival_tent` (6 x 6 x 6) for a festival
- `city_taco_stand` · Elbolilloduro · 5.84 x 2.74 x 3.13 · a street food stand (modern; Bayside holds it: pack-claims) · WIRED
- `hot_dog_stand` (0.97 x 2.34 x 1.9), `cotton_candy_cart` (1.6 x 2.23 x 1.12), `popcorn_cart` (code), `ice_shaver` (1.0 x 1.32 x 0.64, shaved ice = kakigori) · festival stalls, modern look · WIRED
- `lighthouse` (h 11) / `lighthouse_tall` (h 30) · CODE-BUILT, a light · WIRED · placed 5 / 1
- `babel_house_small` (span 7), `babel_house_stair` (7), `babel_house_yard` (8.5), `babel_house_row` (12.4) · Meshy misc · mud-brick ancient houses, solid · WIRED (off-style, listed for completeness)
- `gallows` · wish list · 3.93 x 5.0 x 4.4 · a raised wooden platform with stairs (execution ground / stage) · WIRED

Castle + wall pieces:
- `castle_wall` (`Castles_and_Forts.glb#Wall_2x4`, h 2), `castle_gate` (`#Gate_2x4`, h 2.05), `castle_tower` (`#Tower_Mid`, h 2), `castle_tower_top` (`#Tower_top_1`, h 2.16), `castle_cone` (`#Roof_Cone`, h 2.23) · McSteeg Castle and Fort Builder pack · European grey stone · WIRED · placed 517 / 4 / 32 / 8 / 4 (`castle_wall` city 68)
- R2 ONLY (nodes inside `Assets/world/packs/mcsteeg_castles/Castles_and_Forts.glb` with NO catalogue row; I read the file's node list): `Wall_2x2`, `Wall_2x2_walkway`, `Wall_2x4_walkway`, `Wall_2x4_walkway_beveled`, `Wall_corner_walkwayh`, `Wall_2x2_ruined`, `Wall_2x4_ruined`, `Gate_Door`, `Gate_2x4_doorway`, `Gate_2x4_Beveled`, `Tower_mid_hollow`, `Tower_Doorway`, `Tower_mid_hollow_ruined`, `Scaffle`, `Scaffle_Ramp`, `Roof_rectangle`, `Roof_Cube`, `Building_Shape_Beveled_cube`, `Building_Shape_Beveled_rectangle`, `Window_bars`, `Window_glass`
- CODE-BUILT kit forms (data.js `HQ_KIT_FORMS`): `hqCurtainWall` (wall with battlement, any sheet, default `rocks_1`), `hqCastleTower` (hollow tower with a stair inside), `hqCastleCrown`, `hqRingWalls`, `hqRoundBlock`, `hqRingBridges`, `hqHelixRamp`
- `timber_gate` · wish list · Farm · 3.5 x 3.58 x 0.6 · heavy gate of vertical logs with iron straps (the best castle / village gate that exists) · WIRED · placed 2
- `braced_gate` (3.0 x 2.51 x 0.21), `fence_with_gate` (3.5 x 1.24 x 0.3, split rail), `garden_gate` (1.4 x 1.88 x 0.64, white picket + trellis arch) · WIRED · placed 6 / 16 / 1
- `leaf_portcullis` · Meshy door leaf · WIRED · placed 0
- `decor_stone_arch` (h 3.5), `brick_arch` (h 3.2), `trilithon` (span 6.4; two posts + a lintel, the nearest thing to a torii and it is Stonehenge) · WIRED
- `psxg_wall`, `psxg_wall_pillar`, `psxg_wall_corner` (h 1.01 / 1.5 / 1.5, low stone wall), `psxg_railing`, `psxg_railing_corner`, `psxg_iron_gate_1/2` · PSX graveyard pack · WIRED · `psxg_wall` placed 0
- `hw_wall`, `hw_wall_2/3/4` (h 2.4 to 2.6 stone walls), `hw_pier`, `hw_fence` (h 1.24 wooden fence, placed 40), `hw_kerb` · Halloween pack · WIRED

Stairs, doors, structure:
- `psx_stairs_5_wood` (h 3.2), `psx_stairs_3`, `psx_stairs_4` (h 1.7), `psx_stairs_mp_1` · PSX Mega Pack · WIRED · `psx_stairs_5_wood` placed 0
- `house_stairs` (code, h 2.4), `stair_step`, `stair_step_x`, `stair_landing`, `stair_landing_sq` (code), `riser_1/2/3` (code platforms 0.3 / 0.6 / 0.9: a stage, a dojo dais, a tokonoma)
- `Assets/world/packs/stairs/stairs.glb`, `stairs_railings.glb` · stairs pack · referenced in code, no catalogue row
- `wooden_ladder` · 1.05 x 3.0 x 0.17 · WIRED · placed 11; `library_ladder` 0.97 x 3.0 x 1.0
- `psx_beam_1`, `psx_beam_2`, `psx_beam_4`, `psx_beam_5` (timber beams), `psx_pillar_1..3`, `psx_catwalk_1` · PSX Mega Pack walls and structures · WIRED
- Door leaves that pass (all Western, none sliding): `leaf_shabby_wood`, `leaf_wooden`, `leaf_beige_wood`, `leaf_barn`, `leaf_stable`, `leaf_saloon`, `leaf_frame_only` · WIRED · placed 1 / 0 / - / 0 / 0 / 0 / -
- `railing_1m`, `meshy_one_meter_of_railing`, `meshy_one_meter_of_railing_b` · span 1 · WIRED
- `signpost` (h 2.2, blank wooden), `trail_sign` (1.57 x 2.2 x 0.96, wooden map board), `milestone` (0.67 x 1.0 x 0.46, mossy stone marker: a road jizo stand-in), `missing_board`, `notice_board` (code) · WIRED

## Nature + trees
Tree kinds (`HQ_TREE_KINDS`, 83 keys; all WIRED as terrain tree kinds):
- Pines: `pine` (rt:tree_rt_1_full), `pine_2` (sapling), `tree_43`..`tree_47` (Pine_1..Pine_5), `tree_56` ("full pine"), `tree_2` / `tree_55` (spruce)
- Leaf trees: `tree` / `tree_53` (birch), `tree_3` / `tree_52` (oak), `tree_4` / `tree_54` (tall birch), `tree_7`..`tree_12` + `tree_48`..`tree_51` (Tree_1..Tree_10), `tree_21`..`tree_30` (Birch_1..10)
- Bare trees: `tree_5`, `tree_6`, `tree_13`..`tree_20`, `tree_31`..`tree_42` (dead trees + dead birches: the volcano's burnt slope)
- `palm` (Meshy palm), `saguaro`, `fae_cap` / `fae_cap_2` (giant mushrooms), `fae_bloom_tree`, `fae_bloom_tree_pink`, `fae_bloom_tree_violet`, `fae_bloom_tree_blue` (giant flowers; the pink one is the only pink "tree" there is)
- Snow: `xmas_pine`, `xmas_pine_2`, `xmas_pine_3`, `xmas_snow_pine`, `xmas_snow_pine_2`, `xmas_snow_pine_3` (a snow-capped peak)
- Off theme: the 12 `chess_*` kinds
- R2 ONLY, the cherry / maple shortcut: `Assets/world/nature/Textures/Color Variations/Leaves_Pink.png`, `Leaves_Red.png`, `Leaves_Orange.png`, `Leaves_DarkRed.png`, `Leaves_Light.png`, `Leaves_Purple.png`, `Pine_Leaves_Red.png`, `Pine_Leaves_Light.png`, `Bark_Dead.png` (leaf sheets for `Tree_1..10` / `Pine_1..5`; no code reads them)

Tree and plant props (catalogue):
- `willow_tree` · wish list · 8.77 x 8.0 x 7.7 · weeping willow · WIRED · placed 6
- `cypress_tree` · 1.57 x 9.0 x 1.6 · placed 11, city 8; `olive_tree` · 4.36 x 4.5 x 2.63 (a gnarled trunk: the nearest thing to a garden pine / big bonsai) · placed 8
- `banana_plant` · 3.52 x 3.5 x 2.92 · placed 23; `tropical_bush` · 1.67 x 1.5 x 1.63 (hibiscus) · placed 22; `palm_tree` · 2.1 x 3.2 x 2.0 · placed 65, city 49; `palmisle` (span 10, a tiny island with a palm); `coconuts` 0.56 x 0.43 x 0.6
- `fern` · 1.31 x 0.75 x 1.29 · placed 1,177; `moss_clump` · 0.8 x 0.37 x 0.78 · placed 307; `leafy_bush` · 1.45 x 1.3 x 1.45 (a trimmed round shrub: garden topiary) · placed 735; `wild_flowers` · 0.62 x 0.4 x 0.61 · placed 925
- `reeds` · 1.34 x 1.8 x 1.35 · reeds and cattails (paddies, ponds) · placed 188
- `sunflowers` 1.19 x 2.0 x 1.02, `rose_bed` 2.0 x 0.84 x 1.11, `grape_trellis` 3.0 x 2.26 x 2.34 (a wisteria frame stand-in), `agave`, `yucca`
- `corn_row` 3.5 x 2.48 x 0.77, `corn_stalk` (crops; placed 1,233, the Estate's wall), `hw_farmland` (h 0.27 tilled plot), `hw_crop`, `hw_crop_2`, `hw_crop_3` (low crop rows: the nearest thing to rice seedlings) · placed 3 / 6
- `fae_flower_pink` / `fae_flower_small_pink` / `fae_bloom_pink` (h 3.6 / 0.8 / 6, the recoloured heal flower), `woods_healflower`, `woods_thornvine` (h 1.5, the only vine), `woods_glowcap`, `mushroom`, `mushroom2`
- `door_vine` (code, wall vine h 1.8), `garden_tree` (code, h 4.5), `garden_ring` (code), `planter` (code), `potted_plant`, `office_plant`, `psx_planter_pot_mp_1_full`, `psx_planter_pot_mp_1_empty`, `psx_potted_cactus_mp_1` (0.18 x 0.27 x 0.18: a table bonsai stand-in at best)
- `burnt_tree` · 4.49 x 6.0 x 3.47 · volcano · placed 14; `dead_snag` (h 4.6), `hollow_dead_tree` (h 5), `hollow_tree` (h 6), `psxg_dead_tree_1/2`, `psxg_dead_bush_1/2`, `hw_tree`..`hw_tree_5` (h 4.2 to 7.2 spooky trees)
- `fallen_log` (span 3.6), `stump` (h 0.6), `fallen_redwood` (12.0 x 3.69 x 4.79), `firewood_stack`, `axe_chopping_block`

Rocks, stones, ground pieces:
- `lake_rock` · 1.5 x 0.92 x 0.99 · smooth grey boulder (the garden stone) · placed 126
- `psxg_rock_1`..`psxg_rock_4` (h 0.74 / 0.49 / 0.43 / 0.23; the notes say use these on land, with `h`), `ocean_rock`..`ocean_rock_11` (h 0.5 to 2.6; black slabs if grown past 3 m), `hw_stone`..`hw_stone_5`
- `stepping_stones` · 3.0 x 0.13 x 0.72 · five flat round stones in a line (a garden path) · placed 3; `psxg_stepping_stone_1/2` · placed 30
- `cairn` · 0.97 x 1.2 x 0.93 · placed 173; `menhir` (h 2.6), `sarsen` (h 3.4), `cave_stone` (span 0.9), `obelisk` (h 7), `casing_block`, `ore_heap` (2.0 x 0.82 x 1.93, black coal and grey rock: the best volcanic rubble)
- `crystal_cluster` (code, h 1.4, a light), `meshy_crystal_shard` (h 0.6), `meshy_crystal_shards` (h 0.8)
- `ice_block`, `snow_heap`, `icicles` (a snowy summit)
- `footbridge` · Meshy misc · span 4.4 · a plank footbridge · WIRED · placed 2
- `rope_bridge` · wish list · 7.0 x 1.5 x 1.7 · plank rope suspension bridge · WIRED · placed 1
- `ancient_walkway` (span 6); `roads_f_bridge_000`..`018` are 19 modern road bridges h 8.8 to 9.8 (off style)
- NOT present: an arched red wooden bridge (taiko-bashi)
- Water: `fountain` (code), `bird_bath` 0.71 x 0.9 x 0.71, `ancient_well` (h 1.15, placed 28), `wooden_bucket` (placed 174), `water_trough` 2.2 x 0.55 x 0.6, `hot_tub` 2.2 x 0.86 x 2.2 (modern square spa; placed 2), `infinity_pool` / `lap_pool` (code); liquids + `{ k: 'fall' }` waterfalls come from the terrain side (see Textures)

## Harbour + sea
- `fishing_boat` · Elbolilloduro Houses on Water · span 6.69 · WIRED · placed 5
- `rowboat` · Elbolilloduro · 3.0 x 0.62 x 1.05 · placed 46, city 15; `meshy_rowboat` (span 3.2)
- `dock_boat` · wish list · 6.0 x 1.86 x 3.75 · a pier section on posts with a rowboat moored · placed 1
- `dugout_canoe` · 5.0 x 0.57 x 1.84 · outrigger canoe · placed 4; `raft` · 1.91 x 2.66 x 3.0 · log raft with a patched sail · placed 3
- `skiff` · CODE-BUILT, drivable vehicle, span 4.8 · placed 5
- `trawler` · 18.0 x 12.27 x 5.11 · modern fishing trawler · placed 2; `tugboat` · 15.0 x 9.0 x 4.98 · placed 1 (both modern steel; a wooden sengoku-bune / junk does NOT exist)
- `ship_wreck` (span 16, a ghost ship wreck) · placed 8; `torn_sail_mast` · 9.71 x 10.0 x 1.63 · placed 2; `avenger_wreck` (WWII plane, off theme but Pacific)
- `mooring_piles` (span 1.26) · placed 3; `mooring_bollard` 0.61 x 0.7 x 0.61 · placed 44; `ship_anchor` 1.46 x 1.9 x 0.42 · placed 16; `sea_buoy` (code) · placed 38
- `drying_fish` · 2.0 x 2.18 x 1.3 · rack of fish hanging to dry · placed 7
- `fishing_net_wall` 2.2 x 2.08 x 0.12 · placed 12; `lobster_traps` 1.01 x 1.4 x 0.99 · placed 32, city 16; `fishing_rod` 2.0 x 2.4 x 1.64 · placed 13; `oars` 0.68 x 0.06 x 2.4 · placed 12
- `woven_baskets` 1.0 x 0.51 x 0.64 · placed 16; `rope_coils` 1.2 x 0.57 x 0.8 · placed 16; `meshy_rope` · placed 47; `fish_boxes` (blue PLASTIC crates, modern) · placed 5
- `sea_chest` (h 0.7, placed 127), `ship_cannon` (span 2.2, placed 27), `ship_wheel` 1.1 x 1.09 x 0.37, `wheel`, `ship_model` 1.2 x 0.38 x 0.17, `hammock` (span 4.99)
- `wooden_barrel` 0.75 x 1.0 x 0.75 · placed 277; `psx_wooden_crate_1` (0.72 x 0.36 x 0.5), `psx_wooden_crate_2`..`_5` (1.09 cube), `psx_wooden_crate_6`, `psx_supply_crate_1*`, `meshy_burlap_sack` 0.65 x 0.7 x 0.49 · placed 142; `money_sacks`
- `lighthouse`, `lighthouse_tall` (code)
- Sea life (Ocean pack, WIRED; `swim` ones move): `ocean_crab` (span 0.7, placed 44), `ocean_lobster`, `ocean_starfish`, `ocean_turtle` (span 1.3), `ocean_octopus`, `ocean_squid`, `ocean_eel`, `ocean_fish`, `ocean_fish_2`, `ocean_fish_3`, `ocean_brown_fish`, `ocean_clownfish`, `ocean_dory`, `ocean_tuna`, `fish_school` (code), `ocean_dolphin`, `ocean_whale`, `ocean_humpback`, `ocean_shark`, `ocean_hammerhead`, `ocean_manta`, `ocean_stingray`, `ocean_seal_resting`, the 4 jellyfish, `ocean_conch`, `ocean_sand_dollar*`, `ocean_coral`..`ocean_coral_7`, `coral_brain` / `coral_fan` / `coral_tube`, `ocean_seaweed*`, `kelp`, `giant_clam`, `anemone`, `sea_vent` (code, a lit undersea vent: fits a volcano's shore), `tentacle` / `tentacle2` (h 6 kraken arms, placed 0)
- `river_fish` · 0.13 x 0.2 x 0.5 · a trout (the koi stand-in; no koi) · placed 5; `psx_fish_skeleton_mp_1`
- `seagull` (placed 29), `heron` 0.26 x 1.0 x 0.65 (the crane stand-in; placed 13), `swan`, `duck`, `flamingo`
- `windbreak`, `beach_towel`, `sandcastle`, surfboards: modern beach, skip

## Village + farm
- Animals: `chicken`, `rooster` (0.22 x 0.6 x 0.54), `pig`, `cow` (an ox stand-in), `goat`, `horse` / `horse_brown` / `horse_black` (h 2.2), `dog`, `cat`, `rabbit`, `duck`, `decor_sheep` · WIRED · rooster 4, pig 4, goat 7, horse 10
- `hay_bale` 1.0 x 0.48 x 0.59 (placed 48), `hay_cart` 3.2 x 2.39 x 2.08 (placed 7), `hay_rack` 2.0 x 1.92 x 1.4, `hw_straw` / `hw_straw_2` (h 0.86 straw stacks, placed 110)
- `hand_cart` 2.2 x 1.17 x 1.38 (two-wheeled wooden cart: the best rickshaw / market cart stand-in; placed 8), `wheelbarrow` 1.5 x 0.55 x 0.57, `covered_wagon` (span 4.6, western), `cage_wagon`, `chariot`
- `plough` 2.2 x 0.93 x 0.83 (placed 8), `pitchfork` 0.3 x 1.6 x 0.13, `pickaxe`, `hw_shovel`, `broom` / `ebd_house_broom`, `grindstone` 0.96 x 1.1 x 0.72 (placed 3)
- Smith: `forge` 1.8 x 3.09 x 1.42 (placed 2), `anvil` 0.76 x 0.85 x 0.66 (placed 5), `bellows` 1.3 x 0.86 x 0.51 (placed 3): a swordsmith's shop
- `beehive` 0.55 x 0.8 x 0.46, `water_trough`, `ancient_well`, `wooden_bucket`, `firewood_stack` 2.0 x 0.82 x 0.65, `axe_chopping_block` 0.88 x 1.1 x 0.96, `clothes_line` 4.0 x 1.52 x 0.88 (placed 6)
- `hw_scarecrow` (h 2.63), `hw_scarecrow_2` (h 2.48) · placed 12 / 16
- `hitching_rail` (span 3.2), `saddle` 0.8 x 1.03 x 0.5 (western), `kennel`
- `hw_pumpkin`..`hw_pumpkin_4`, `coconuts`, `woven_baskets`, `meshy_burlap_sack`, `greek_amphora` 0.68 x 1.05 x 0.68 (a big storage jar; placed 73), `stone_urn` 0.74 x 1.05 x 0.74 (city 54), `canopic_jars` 0.54 x 0.45 x 0.49 (lidded jars)
- Fire + light: `campfire` (span 1.5), `meshy_campfire_ring`, `hearth_fire` (code), `chimney_smoke` (code), `brazier` (h 1.3, placed 341), `tripod_bowl` 0.98 x 1.4 x 1.01 (bronze fire bowl on three legs: shrine / temple brazier; placed 13), `cave_torch` (h 1.9, placed 325), `wall_torch` (h 1.1, placed 85), `tiki_torch` (h 2.85, placed 22: the jungle), `decor_wall_torch_bracket`, `wood_stove`
- `picnic_table`, `trestle_table` 3.5 x 1.22 x 2.57 (long rough table + two benches: an inn; placed 6), `iron_garden_bench`, `park_bench` (code)
- `mine_cart`, `head_wheel`, `rail_section` (a volcano sulphur mine, if wanted)

## Interiors + furniture (neutral wood that passes; nothing is Japanese-low)
- Tables: `psx_coffee_table_1` + `_1_1.._1_4` (1.62 x 0.66 x 0.62, the lowest table there is: the chabudai stand-in), `psx_dinner_table_1*` (1.7 x 0.86 x 1.1), `psx_table_large_2*` / `_3*`, `psx_tv_table_1*` (1.64 x 0.74 x 0.54, a low sideboard), `round_table` (code), `map_table` 2.2 x 0.77 x 1.31 (a war council table)
- Seats: `psx_chair_mp_1*` / `_2*` (0.47 x 0.59 x 0.47 stools), `bar_stool`, `greek_couch` 2.0 x 0.66 x 0.87 (low couch with a cushion), `gallery_ottoman` 2.2 x 0.56 x 0.63, `psx_pillow_mp_1` / `_2` (h 0.16: the zabuton stand-in), `royal_throne` (h 1.9, the daimyo's seat at a stretch)
- Beds: `psx_old_mattress_mp_1` / `_1_1` (h 0.2, a mattress on the floor = the futon stand-in; placed 31), `sleeping_bag`, `cot`, `fur_rug` 2.2 x 0.04 x 1.96
- Rugs / mats: `floor_runner` 3.0 x 0.02 x 1.04 (red runner), `psx_carpet_mp_1` 3.23 x 0.01 x 2.04 (Persian), `rug_round` 1.5, `doormat` (code); NO tatami mat
- Storage: `psx_shelf_mp_2*`..`psx_shelf_mp_7*` (wooden shelves 0.52 to 1.22 wide), `psx_wardrobe_mp_1*` (1.34 x 2.1 x 0.64), `psx_display_cabinet_mp_1*` / `_2*`, `psx_bedside_table_1*` / `_2*`, `library_shelf`, `library_shelf_full`, `card_catalog` 1.1 x 1.3 x 0.54 (a many-drawer chest: reads as an apothecary / tansu chest), `footlocker` 0.85 x 0.45 x 0.52, `sea_chest`, `key_rack`
- Kitchen / tea house / inn: `stock_pots` 0.9 x 0.4 x 0.84 (placed 18), `kettle`, `teapot`, `teacups`, `pot_rack` (code, ceiling), `psx_plate_mp_1`, `psx_fork_mp_1`, `psx_spoon_mp_1` (no chopsticks / bowls), `psx_butcher_knife_mp_1`, `psx_knife_mp_1`, `psx_glass_bottle_1` / `_2` (h 0.35: the sake bottle stand-in), `item_drinking_cup`, `psx_meat_1`, `steam_table` (modern steel), `bread_rack` 1.35 x 1.9 x 0.59 (wooden rack), `beer_taps`, `wooden_barrel` (sake casks)
- Bath house: `hot_tub` (modern), `wooden_bucket`, `water_trough`, `shower_stall` (modern); NO wooden ofuro
- Dojo: `wing_chun_dummy`, `dojo_weapon_rack`, `punching_bag` 0.54 x 2.3 x 0.54, `riser_1` (a dais), `banner`, `taiko_drum`, `gong`
- Theatre: `costume_rack` 1.75 x 1.75 x 0.89, `makeup_vanity`, `riser_*` (a stage), `bleacher_stand` 5.0 x 3.32 x 4.19 (wooden tiers), `followspot` (modern)
- Shrine / temple inside: `stone_altar` (code, h 0.95, placed 45), `votive_stand`, `candelabra`, `item_censer`, `holy_carpet` (span 6), `tripod_bowl`, `golden_idol` 0.24 x 0.4 x 0.24, `church_podium`
- Scholar / castle rooms: `psx_book_mp_1`..`_10`, `psx_open_book_mp_1`, `giant_hourglass`, `brass_orrery`, `museum_vitrine`, `painting_landscape` 1.8 x 1.7 x 0.14 / `painting_seascape` 2.0 x 1.46 x 0.04 / `psx_painting_1` (Western frames; no hanging scroll), `cheval_mirror`, `bird_cage` 0.65 x 1.9 x 0.65, `hookah`
- Jail / castle dungeon: `stocks` (code), `wall_chains`, `cell_bars` (code), `leaf_cell`, the traps pack (`trap_spike_pit`, `trap_pressure_plate`, `trap_trip_wire`, `trap_dart_hole`, `trap_spear_hole`: a ninja house; placed 0 / 1 / 3)

## Food
- Almost nothing that reads Japanese. What exists: `drying_fish`, `river_fish`, `psx_meat_1`, `psx_canned_food_mp_*` (modern), `coconuts`, `hw_pumpkin*`, `xmas_turkey` / `xmas_carvery` / `xmas_bake` / `xmas_roast` (roasts), `xmas_cocoa` (a cup), `xmas_punch*` (cups), `meal_tray` (modern), `wedding_cake`, `pastry_case`, `bread_rack`, `teapot`, `teacups`, `kettle`, `stock_pots`, `psx_plate_mp_1`
- NOT present: sushi, ramen / noodle bowl, rice bowl, onigiri, dango, sake set, bento, chopsticks, tea whisk

## Weapons
- `sword` · Meshy "master sword" · h 1.1 · WIRED · placed 4; `psx_sword_mp_1` · 0.32 x 0.02 x 1.03 · placed 9, city 6; `Assets/fx/spell_props/Meshy_AI_master_sword_0713025949_texture.glb`
- `spear` · h 2 · placed 33, city 18; `arrow` · span 0.8 · placed 0; `psx_knife_mp_1`, `spell_throwing_knife` (h 0.25: a kunai stand-in), `item_blowpipe` (span 1.2: a ninja tool)
- `dojo_weapon_rack` 1.6 x 1.6 x 0.61, `discus_rack` 1.48 x 2.0 x 0.52 (a rack of upright javelins = a spear rack; placed 2), `rifle_rack` 1.44 x 1.6 x 0.57 (matchlock rack at a stretch), `arms_trophy` 1.5 x 1.21 x 0.18 (wall trophy of arms)
- `ship_cannon`, `spell_shield` (h 0.9), `sword_stone` (code, a sword in a stone, a light; placed 2: a shrine relic)
- Creator gear (sprites.js, not the catalogue): `ewm_katana` ("Katana in a back sheath"), `ewm_quiver`: a katana MESH exists as a worn piece but has no prop row
- NOT present as props: katana, wakizashi, naginata, yumi, kunai / shuriken, sword stand (katana-kake), samurai armour, kabuto, war fan

## Animals + units
- Land (WIRED props): `deer` 1.33 x 1.8 x 1.07 (Nara's deer; placed 17), `fox` 0.4 x 0.45 x 0.75 (placed 8), `bear`, `wolf`, `rabbit`, `cat`, `dog`, `hedgehog`, `rat`, `mountain_goat`, `mountain_lion`, `coyote`
- Birds: `heron` (placed 13), `owl_perched`, `hawk`, `eagle` (swims = flies), `crow`, `raven_perch`, `seagull`, `duck`, `swan`, `peacock`, `parrot` (jungle; placed 3), `rooster`, `chicken`, `dodo` (jungle oddity; placed 2), `vulture`
- Small: `meshy_frog` (span 0.15, placed 34), `lizard` 0.18 x 0.1 x 0.4 (placed 4), `cobra` 0.63 x 0.7 x 0.57 (placed 1), `rattlesnake`, `spider`, `scorpion`, `dragonfly` (placed 11), `firefly` (placed 9), `butterfly`, `monarch`, `blue_morpho`, `swallowtail`, `luna_moth`, `hawk_moth`, `bee`, `bumblebee`, `grasshopper`, `ladybug`, `ant`, `anthill`, `caterpillar_bug`, `chrysalis`, `bat_black` / `bat_brown` / `bat_grey` (code)
- Big: `elephant` (h 2.7, placed 2), `lion` (placed 4), `giraffe`, `camel`
- Dinosaurs: `dinosaur_skeleton` · Meshy city interiors · 1.59 x 3.36 x 6.4 · a MUSEUM MOUNT on a plinth with a rod · WIRED · placed 6. No living dinosaur prop, no eggs, no nest. Bones: `skull`, `femur`, `ulna`, `skull_pile`, `cattle_skull` 0.7 x 0.46 x 0.2, `anatomy_skeleton`, `psx_fish_skeleton_mp_1`
- Unit models on R2 (race folders, not catalogue rows; wired through sprites.js RACE_MODELS_3D, which is another part's list): `Assets/characters/races/ninja/male/Meshy_AI_ninja_m_Running.glb`, `.../ninja/female/Meshy_AI_ninja_f_Running.glb`, `.../shogun/male/Meshy_AI_shogun_Running.glb`, `.../samurai_slug/male/Meshy_AI_samurai_slug_Running.glb`, `.../karate_frog/male/Meshy_AI_karate_frog_Running.glb`, `.../monk/male/Meshy_AI_monk_Running.glb`, `.../swordfighter/male/Meshy_AI_swordfighter_m_Running.glb` + `.../swordfighter/female/Meshy_AI_hot_girl_pop_idol_s_biped_Character_output.glb`, `.../kifighter/` (27 files), `.../sentai/` (pictures only: megazord + six rangers), `.../dinosaur/male/Meshy_AI_dinosaur_realistic_biped_Character_output.glb`, `.../kaiju/male/Meshy_AI_kaiju_Running.glb` (+ `Meshy_AI_retro_1990_s_japan_cy_biped_Character_output.glb` in the kaiju folder), `.../dragon/male/Meshy_AI_dragon_v2_Running.glb`, `.../farmer/`, `.../knight/`, `.../king/`, `.../chef/`, `.../mermaid/`, `.../kraken/`, `.../lochnessmonster/`, `.../gladiator/`, `.../golem/`, `.../treeperson/`, `.../mushroomgirl/`, `.../kingkong/` (the jungle)

## Textures + decals
`DOOR_HQ.textures` (8 keys, all office sheets, none fit): `terrazzo`, `stone`, `oxblood` (aged oxblood plaster wall: a dark red plaster, the one near-fit), `teal`, `ceiling`, `concrete`, `drywall`, `carpet`.
The real sheets are the TERRAIN keys (bucket `Assets/world/terrain/`; a building row names them `key: '<name>'` or `urban:<Name>`). Fits, exact file stems:
- Wood: `wood`, `wood_planks`, `calm_planks_1`, `calm_shipwood_1`, `urban:WoodFlooring1a..` (8), `urban:WoodCladding*` (6), `urban:WoodBeams*` (8), `urban:WoodGeneric*` (6; `WoodGeneric2a` tinted = THATCH, `WoodGeneric1a` light tint = WATTLE: notes), `urban:WoodPainted*` (15), `urban:WoodPlywood*` (6), `urban:WoodCrates*` (4), `urban:DoorWooden*` (6) / `DoorWoodenHalf*` (6); packs' own sheets on R2 not keyed: `elbolilloduro_christmas/textures/WoodPlanksClean.jpg`, `WoodPlanksOverlapping.jpg`, `Wood.jpg`, `BarkPine.jpg`, `elbolilloduro_halloween/textures/WoodPlanksOld.jpg`, `Straw.png`, `Farmland.jpg` (R2 ONLY as terrain sheets)
- Plaster: `calm_plaster_1`, `urban:PlasterWallStucco1a..2e` (7), `urban:PlasterWallGeneric*` (10), `urban:PlasterWallPainted*` (11), `urban:PlasterMasonry*` (14), `urban:PlasterMoulding*` (4), `urban:PlasterBoard*` (10), `drywall`..`drywall_5`, `parchment` (the only paper-like sheet: a shoji / scroll stand-in), `wallpaper`, `damask`..`damask_4`, `floral`, `floral_2`, `latticegarden` (a lattice sheet: the nearest thing to a shoji grid)
- Roof: `urban:MetalRoofTiles1a..3d` (12; the city's pitched-roof sheet), `calm_tiles_small_1` (tinted = slate), `calm_tiles_1`, `tilefloor`, `tilefloor_2`, `elbolilloduro_christmas/textures/RooftilesSlate.png` (R2 ONLY), `urban:ConcreteRoofBitumen*`, `urban:MetalCorrugated*`
- Stone: `rocks_1`..`rocks_5`, `rocks_dark_fantasy`, `rock`, `rock_wall_1`, `rock_wall_2`, `calm_rock_1`, `calm_darkrock_1`, `calm_darkstone_1`, `calm_castle_1`, `calm_flagstone_1`, `calm_paving_1`, `calm_cobble_1`, `cobblestone`, `cobblestone_2`, `bricks_1..3`, `dungeon`..`dungeon_4`, `ruins`, `calm_ruins_1`, `calm_sandstone_1`, `marble`, `marble_2`, `marble_light`, `cliff`, `mountain`, `mountain_top`, `cave_floor`, `cave_wall`, `urban:GroundPebbles*` (4), `calm_gravel_1` (a raked-gravel garden)
- Ground: `grass`..`grass_4`, `grass_rocky`, `calm_grass_1`, `calm_darkgrass_1`, `calm_rockygrass_1`, `forest`, `forest_2`, `dark_woods`, `calm_forestfloor_1`, `calm_roots_1`, `calm_canopy_1`, `calm_hedge_1`, `leaves`..`leaves_5`, `dirt`..`dirt_4`, `dirt_slope`, `calm_dirt_1`, `sand`, `sand_beach`, `calm_sand_1`, `calm_sand_beach_1`, `desert`, `calm_snow_1`
- Volcano: `lava`, `calm_lava_1`..`calm_lava_4`, `nz_magma`, `obsidian`, `calm_obsidian_1`, `calm_obsidian_2`, `scorched`, `calm_scorched_1`, `wasteland`, `rubble_1..4`, `crystal`, `crystal_blue`; liquids `Liquid_Red_01..08-128x128`, `Liquid_Yellow_1..8-128x128`
- Water: `water`, `deep_water`, `waves_1..3`, `healing_spring`, `calm_spring_1`, `nz_spring` (hot springs), `poison_bog`, `nz_dreamwater`, `Liquid_Blue_01..08-128x128`, `Liquid_Green_01..08-128x128` (paddy / pond), `bridge` (a bridge sheet), `fog`, `cloud*`
- Cloth / other: `urban:ClothTattered*` (12; noren / banners), `urban:CarpetPattern*` / `CarpetPlain*` / `CarpetDiamond*`, `carpet`..`carpet_4`, `gilt` / `gold` (the allowed gold = `gilt.png`: a golden pavilion), `copper`, `leather`
- Building skins for `texbuilding` (data.js `HQ_TEXB_PRISMS`, sheets in `Assets/world/terrain/objects/`): `inn`, `itemshop`, `shop`, `ancient_building`, `church_1`, `building_1..11` (old picture fronts; `inn` and `itemshop` are the only period ones). Same folder: `object_well`, `stairs`, `pathway_1`, `pathway_2`, `flower`..`flower_4`, `tree`..`tree_6`, `column_1..4`
- NOT present as sheets: tatami, shoji paper, bamboo, kawara clay roof tile, thatch (a tint recipe only), white castle plaster with stone base (ishigaki), red lacquer, moss
Decals (`DOOR_HQ.decals`: 10 rooms' rows; `HQ_DECAL_RULES` kinds): `puddle`, `grime`, `scorch`, `blood`, `oil`, `wear` (door wear). Fits: `puddle` (paddies, harbour), `scorch` (volcano, forge), `grime`, `blood` (dojo / battlefield). Catalogue decal props: `psx_cobweb_1`, `_2`, `_4`, `_5`, `floor_stain` (code), `ritual_circle` (code), `graffiti_wall` (code). Urban decal sheets on R2: `DecalStainLeaks*` (6), `DecalPlasterHole1..3`. No moss / petal / leaf-litter decal (the catalogue has a `petal` field on 9 flower rows only).

## Sky + horizon
- Bucket `Assets/world/sky/`: only `disaster_city_day|night|silhouette(.webp, _low)` and `woods_day|night|silhouette(.webp, _low)`, plus 48 files in `sky/1024x512/` and 30 in `sky/night_cities/` (synthwave city layers with `palms.png`, `palms-back.png`). NO Japan / Fuji / pagoda / volcano skyline file. Horizon builders are code (`_hz*`, MODEL_LIST.md §8b: another part).
- Catalogue sky props: `moon` (h 3 as listed), `white_cloud` (span 3), `star`, `light_shaft` (code)

## Other
- `fountain`, `sundial` 0.48 x 1.0 x 0.48, `bird_bath` (gardens), `hooded_statue` 0.76 x 2.2 x 0.68 (a faceless robed stone figure: the only statue that could pass as a monk / jizo; placed 26), `weeping_angel`, `god_statue`, `marble_bust`, `hero_statue_*`, `owl_statue` (h 10), `lion_statue` (h 1.5; a komainu stand-in at a stretch, placed 28), `cat_statue` 0.38 x 1.0 x 0.68 (a seated cat: maneki-neko at a stretch; placed 4), `jackal_statue`, `golden_idol`
- `giant_hourglass`, `sword_stone`, `floating_orb` (code), `ritual_circle` (code), `thoughtform` (code spirit): yokai / shrine magic
- Pack-claims.md: it covers only Disaster City's whole buildings (`city_*`, `ind_*`, `play_*`, the pass-2 Meshy interior pieces). Of this shortlist the city uses heavily only `paper_lantern` (49 of 67 rows), `palm_tree` (49 of 65), `stone_urn` (54), `cave_torch` (63), `castle_wall` (68), `leafy_bush` (138), `rat`; everything else above is at most a handful of rows in the city. Nothing on this shortlist is a claimed one-district building.
- R2 files with NO catalogue row (94 found; none is a theme fit): the 21 extra `Castles_and_Forts.glb` nodes above; the leaf recolour sheets above; `Assets/world/packs/stairs/stairs.glb`, `stairs_railings.glb` (code-referenced); `Assets/world/packs/elbolilloduro/ebd_pizzeria_pizza_box.glb`; `Assets/world/packs/elbolilloduro_halloween/characters/Character_Witch.fbx`; `Assets/world/props/meshy/ew_plant_apple.glb` (code-referenced, an apple plant); `Assets/world/props/meshy/Pyramid/Pyramid.glb`; `Assets/world/animals/horses/Horse_fbx.fbx`; `Assets/world/hq/models/Meshy_AI_cheap_hollow_core_door_0903105753_texture.glb`; four `traps/*-colonly.glb`; about 65 `Assets/world/props/meshy_decor/*.glb` that are the mesh parts of the CODE-BUILT rows (e.g. `armour_stand.glb`, `banner.glb`, `cave_torch.glb`, `fountain.glb`, `lighthouse.glb`, `skiff.glb`, `stone_altar.glb`, `round_table.glb`): these ARE in use through their `proc` rows.
- ASSET_MANIFEST.json (4,603 entries) lists only optimised / hashed files (2,065 under `Assets/opt`, creator parts, PSX pack, meshy props); it names nothing the bucket listing does not.

## How walk-in buildings are made (brief)
Walk-in buildings are not models: a zone's bake tool writes a hollow `texbuilding` row (walls + door, a swinging `leaf_*` in the doorway) plus `arch` part rows (boxes, `cyl`, gable / hip / barrel roofs with `over` eaves and `keyUnder` soffits, porches, posts), each part painted with a terrain sheet key and a tint; furniture is catalogue props inside (examples: bake-woods.js `woods:cabin`, the Beach huts in `docs/areas/beach/districts/*.js`, Camelot's village in bake-camelot.js; notes areas-complexes.md lines ~3799, ~4615, ~5210).
For Japanese buildings today: walls `urban:PlasterWallStucco*` / `calm_plaster_1` (white plaster) over `urban:WoodCladding*` / `WoodBeams*` timber, floors `wood_planks` / `urban:WoodFlooring*`, thatch = `urban:WoodGeneric2a` tinted 0xd2b060 gain 1.7, tiled roofs = `urban:MetalRoofTiles*` or `calm_tiles_small_1` tinted dark grey, stone bases `rocks_1` / `calm_castle_1`, castle walls `hqCurtainWall` / `hqCastleTower`.
Missing for the look: curved (upturned) eaves and stacked pagoda tiers as roof shapes, and tatami / shoji / kawara / bamboo sheets; those need new sheets (or tints of `parchment` + `latticegarden`) and probably one new arch roof shape.

---

## Reader 3

# FITS KATANA ISLAND — part 3 (MODEL_LIST.md lines 1332-2312)

Read end to end: Meshy AI (300), THE WISH LIST (246), Roads · Elbolilloduro (106), Halloween pack (67), Ocean pack (60),
Christmas pack (51), Meshy Entertainment pass 2 (27), Meshy decor 11-03 (25), Meshy held props 11-03 (25), Meshy Civic interiors (24).

**Most valuable finds**
- The only outright Japanese pieces in this part: `stone_lantern`, `gong`, `paper_lantern`, `prayer_flags`, `bell_frame`, `lantern_post`, `stepping_stones` (all wish list / Entertainment pass 2).
- Armour display for castle + dojo: `decor_armour_stand_post`, `decor_armour_plinth`; `decor_umbrella_closed` (closed umbrella); `teapot` + `teacups` + `kettle` for the tea house.
- Harbour is well served: `dock_boat`, `meshy_rowboat`, `dugout_canoe`, `raft`, `trawler`, `drying_fish`, `fish_boxes`, `fishing_rod`, `oars`, `mooring_bollard`, `rope_coils`, `ship_anchor`, `torn_sail_mast`, `ship_wreck`, plus the whole Ocean pack (fish, crab, lobster, turtle, octopus, shells, starfish, seaweed, coral, 11 rocks).
- Village / farm: `thatched_hut`, `lean_to`, `market_stall`, `hand_cart`, `hay_cart`, `hay_bale`, `plough`, `wheelbarrow`, `woven_baskets`, `wooden_barrel`, `wooden_bucket`, `water_trough`, `ancient_well`, `hw_scarecrow`, `hw_farmland` + crops, `rooster`, `pig`, `goat`, `duck`.
- Smith / dojo yard: `forge`, `anvil`, `bellows`, `grindstone`, `axe_chopping_block`, `firewood_stack`.
- Nature + animals: `willow_tree`, `meshy_pine_with_canopy`, `banana_plant`, `tropical_bush`, `fern`, `reeds`, `moss_clump`, `leafy_bush`, `wild_flowers`, `lake_rock`, `cairn`; `deer`, `fox`, `heron`, `swan`, `dragonfly`, `firefly`, `meshy_frog`, `owl_perched`, `hawk`, `parrot`, `lizard`, `cobra`, `spider`, `seagull`, `river_fish`.
- Bridges and gates: `rope_bridge`, `footbridge`, `timber_gate`, `braced_gate`, `garden_gate`, `fence_with_gate`, `timber_lookout`, `leaf_portcullis`.
- Onsen stand-ins: `hot_tub`, `wooden_bucket`, `beach_towel`.

**What a Japanese island needs that this part does NOT have**
- No torii, shrine, pagoda, temple, castle keep / wall / gate, dojo, tea house, bath house or any Japanese building or roof / wall / floor kit piece.
- No katana, bow, spear, naginata, weapon rack or training dummy (only `sword` = a "master sword" spell prop, `spell_throwing_knife`, `item_blowpipe`, `rifle_rack`).
- No cherry / sakura, bamboo or maple tree; no bonsai; no koi; no crane (bird); no monkey; no dinosaur, egg or nest.
- No tatami, shoji, futon, folding screen, scroll, mask, fan, low table or cushion; no sushi / ramen / rice / sake food.
- No buddha, fox (kitsune), dragon or lion-dog statue (only `cat_statue`, `golden_idol`, `god_statue`, `hooded_statue`).
- No taiko drum (only a rock `drum_kit`), no temple bell on its own (only `bell_frame`), no banners (only `flag_pole`, `prayer_flags`).
- No volcano pieces: no lava, black rock, crater or hot-spring model. No textures or decals at all in this part. No sky / horizon builders.
- No Japanese-themed unit or race in this part (animals here are props, not units).

Every row below has a catalogue key in the list, so all are WIRED. The list gives no sizes in this part.
Format: `key` · `file` · section · what it is · status.

## Japanese pieces

- `stone_lantern` · `Assets/world/props/meshy/wishlist/stone_lantern.glb` · Meshy wish list (11-16) · stone lantern · WIRED
- `paper_lantern` · `Assets/world/props/meshy/paper_lantern.glb` · Meshy, Entertainment pass 2 (11-13) · paper lantern · WIRED
- `gong` · `Assets/world/props/meshy/wishlist/gong.glb` · Meshy wish list · gong · WIRED
- `bell_frame` · `Assets/world/props/meshy/wishlist/bell_frame.glb` · Meshy wish list · a bell hung in a frame (temple bell stand-in) · WIRED
- `prayer_flags` · `Assets/world/props/meshy/wishlist/prayer_flags.glb` · Meshy wish list · string of prayer flags · WIRED
- `lantern_post` · `Assets/world/props/meshy/wishlist/lantern_post.glb` · Meshy wish list · lantern on a post · WIRED
- `meshy_hanging_lantern` · `Assets/world/props/meshy/Meshy_AI_a_hanging_lantern_0912231043_texture.glb` · Meshy AI (300) · hanging lantern · WIRED
- `stepping_stones` · `Assets/world/props/meshy/wishlist/stepping_stones.glb` · Meshy wish list · garden stepping stones · WIRED
- `decor_armour_stand_post` · `Assets/world/props/meshy_decor/armour_stand_post.glb` · Meshy decor (11-03) · armour stand post · WIRED
- `decor_armour_plinth` · `Assets/world/props/meshy_decor/armour_plinth.glb` · Meshy decor (11-03) · plinth for an armour stand · WIRED
- `decor_umbrella_closed` · `Assets/world/props/meshy_decor/umbrella_closed.glb` · Meshy decor (11-03) · closed umbrella · WIRED
- `teapot` · `Assets/world/props/meshy/Meshy_AI_teapot_0912231417_texture.glb` · Meshy AI (300) · teapot · WIRED
- `teacups` · `Assets/world/props/meshy/Meshy_AI_stacked_teacups_0912231425_texture.glb` · Meshy AI (300) · stacked teacups · WIRED
- `kettle` · `Assets/world/props/meshy/wishlist/kettle.glb` · Meshy wish list · kettle · WIRED
- `item_censer` · `Assets/world/props/misc/censer.glb` · Meshy held props (11-03) · incense censer (shrine / temple) · WIRED
- `item_talisman_pendant` · `Assets/world/props/misc/talisman_pendant.glb` · Meshy held props · talisman (shrine charm) · WIRED
- `item_ward_totem` · `Assets/world/props/misc/ward_totem.glb` · Meshy held props · ward totem (shrine marker) · WIRED
- `cat_statue` · `Assets/world/props/meshy/wishlist/cat_statue.glb` · Meshy wish list · cat statue (Egyptian by its batch; could pass as a shrine guardian, look first) · WIRED
- `golden_idol` · `Assets/world/props/meshy/wishlist/golden_idol.glb` · Meshy wish list · golden idol (temple altar) · WIRED
- `god_statue` · `Assets/world/props/meshy/wishlist/god_statue.glb` · Meshy wish list · god statue (probably Greek; look first) · WIRED
- `hooded_statue` · `Assets/world/props/meshy/wishlist/hooded_statue.glb` · Meshy wish list · hooded stone statue (roadside figure) · WIRED
- `milestone` · `Assets/world/props/meshy/wishlist/milestone.glb` · Meshy wish list · roadside stone marker · WIRED
- `sundial` · `Assets/world/props/meshy/wishlist/sundial.glb` · Meshy wish list · garden sundial · WIRED
- `tripod_bowl` · `Assets/world/props/meshy/wishlist/tripod_bowl.glb` · Meshy wish list · bowl on a tripod (offering / fire bowl) · WIRED
- `string_lights` · `Assets/world/props/meshy/wishlist/string_lights.glb` · Meshy wish list · string of lights (festival street) · WIRED
- `drum_kit` · `Assets/world/props/meshy/drum_kit.glb` · Meshy, Entertainment pass 2 · modern drum kit (weak taiko stand-in only) · WIRED

## Buildings + kit pieces (bridges, gates, fences, walls, doors)

- `thatched_hut` · `Assets/world/props/meshy/wishlist/thatched_hut.glb` · Meshy wish list · thatched hut (one-piece, not walk-in) · WIRED
- `lean_to` · `Assets/world/props/meshy/wishlist/lean_to.glb` · Meshy wish list · lean-to shelter · WIRED
- `timber_lookout` · `Assets/world/props/meshy/wishlist/timber_lookout.glb` · Meshy wish list · timber watch tower · WIRED
- `timber_gate` · `Assets/world/props/meshy/wishlist/timber_gate.glb` · Meshy wish list · timber gate · WIRED
- `braced_gate` · `Assets/world/props/meshy/wishlist/braced_gate.glb` · Meshy wish list · braced wooden gate · WIRED
- `garden_gate` · `Assets/world/props/meshy/wishlist/garden_gate.glb` · Meshy wish list · garden gate · WIRED
- `fence_with_gate` · `Assets/world/props/meshy/wishlist/fence_with_gate.glb` · Meshy wish list · fence run with a gate · WIRED
- `windbreak` · `Assets/world/props/meshy/wishlist/windbreak.glb` · Meshy wish list · windbreak screen · WIRED
- `rope_bridge` · `Assets/world/props/meshy/wishlist/rope_bridge.glb` · Meshy wish list · rope bridge (jungle / volcano gorge) · WIRED
- `footbridge` · `Assets/world/props/meshy/Meshy_AI_a_plank_footbridge_0916235844_texture.glb` · Meshy AI (300) · plank footbridge · WIRED
- `ancient_walkway` · `Assets/world/props/meshy/Meshy_AI_ancient_walkway_0917035609_texture.glb` · Meshy AI (300) · old stone walkway · WIRED
- `decor_stone_arch` · `Assets/world/props/meshy_decor/stone_arch.glb` · Meshy decor (11-03) · stone arch · WIRED
- `leaf_portcullis` · `Assets/world/hq/models/Meshy_AI_a_portcullis_0903105915_texture.glb` · Meshy AI (300) · portcullis door leaf (castle gate) · WIRED
- `leaf_shabby_wood` · `Assets/world/hq/models/Meshy_AI_a_shabby_wooden_door_0903105805_texture.glb` · Meshy AI (300) · shabby wooden door leaf · WIRED
- `leaf_barn` · `Assets/world/hq/models/Meshy_AI_a_barn_door_0904015200_texture.glb` · Meshy AI (300) · barn door leaf · WIRED
- `leaf_stable` · `Assets/world/hq/models/Meshy_AI_a_stable_door_0904015237_texture.glb` · Meshy AI (300) · stable door leaf · WIRED
- `leaf_frame_only` · `Assets/world/hq/models/Meshy_AI_a_door_frame_0903105906_texture.glb` · Meshy AI (300) · bare door frame · WIRED
- `hw_fence` · `Assets/world/packs/elbolilloduro_halloween/models/halloween.fbx#Fence` · Halloween pack · Elbolilloduro · wooden fence · WIRED
- `hw_wall`, `hw_wall_2`, `hw_wall_3`, `hw_wall_4` · `…/halloween.fbx#Wall`, `#Wall_01`, `#Wall_02`, `#Wall_03` · Halloween pack · wall pieces (graveyard walls; look before use) · WIRED
- `hw_bricks`, `hw_bricks_2` · `…/halloween.fbx#Bricks`, `#Bricks_01` · Halloween pack · loose bricks · WIRED
- `roads_f_bridge_000` … `roads_f_bridge_018` · `Assets/world/packs/elbolilloduro/roads/bridge_000.glb` … `bridge_018.glb` · Roads · Elbolilloduro · 19 road-bridge pieces (modern road pack; only if a plain span is wanted) · WIRED
- `outhouse` · `Assets/world/props/meshy/wishlist/outhouse.glb` · Meshy wish list · wooden outhouse · WIRED
- `kennel` · `Assets/world/props/meshy/wishlist/kennel.glb` · Meshy wish list · dog kennel · WIRED
- `medieval_pavilion` · `Assets/world/props/meshy/wishlist/medieval_pavilion.glb` · Meshy wish list · cloth pavilion tent (war camp / festival) · WIRED
- `canvas_tent` · `Assets/world/props/meshy/wishlist/canvas_tent.glb` · Meshy wish list · canvas tent · WIRED
- `wooden_ladder` · `Assets/world/props/meshy/wishlist/wooden_ladder.glb` · Meshy wish list · wooden ladder · WIRED
- `signpost` · `Assets/world/props/meshy/Meshy_AI_a_blank_wooden_signpost_0916235832_texture.glb` · Meshy AI (300) · blank wooden signpost · WIRED
- `trail_sign` · `Assets/world/props/meshy/wishlist/trail_sign.glb` · Meshy wish list · trail sign · WIRED
- `flag_pole` · `Assets/world/props/meshy/wishlist/flag_pole.glb` · Meshy wish list · flag pole (castle / harbour) · WIRED

## Nature + trees

- `willow_tree` · `Assets/world/props/meshy/wishlist/willow_tree.glb` · Meshy wish list · willow · WIRED
- `meshy_pine_with_canopy` · `Assets/world/props/meshy/Meshy_AI_a_pine_with_canopy_0916235640_texture.glb` · Meshy AI (300) · pine · WIRED
- `cypress_tree` · `Assets/world/props/meshy/wishlist/cypress_tree.glb` · Meshy wish list · cypress · WIRED
- `olive_tree` · `Assets/world/props/meshy/wishlist/olive_tree.glb` · Meshy wish list · gnarled olive tree (could pass as an old garden tree) · WIRED
- `banana_plant` · `Assets/world/props/meshy/wishlist/banana_plant.glb` · Meshy wish list · banana plant (jungle) · WIRED
- `tropical_bush` · `Assets/world/props/meshy/wishlist/tropical_bush.glb` · Meshy wish list · tropical bush (jungle) · WIRED
- `palm_tree` · `Assets/world/hq/models/Meshy_AI_palm_tree_0910054114_texture.glb` · Meshy AI (300) · palm tree · WIRED
- `palmisle` · `Assets/world/props/meshy/Meshy_AI_a_tiny_island_with_palm_tree_0912231720_texture.glb` · Meshy AI (300) · tiny island with a palm (offshore islet) · WIRED
- `coconuts` · `Assets/world/props/meshy/wishlist/coconuts.glb` · Meshy wish list · coconuts · WIRED
- `fern` · `Assets/world/props/meshy/Meshy_AI_a_fern_0916235806_texture.glb` · Meshy AI (300) · fern · WIRED
- `leafy_bush` · `Assets/world/props/meshy/wishlist/leafy_bush.glb` · Meshy wish list · leafy bush · WIRED
- `reeds` · `Assets/world/props/meshy/wishlist/reeds.glb` · Meshy wish list · reeds (paddies, ponds) · WIRED
- `moss_clump` · `Assets/world/props/meshy/wishlist/moss_clump.glb` · Meshy wish list · moss clump · WIRED
- `wild_flowers` · `Assets/world/props/meshy/wishlist/wild_flowers.glb` · Meshy wish list · wild flowers · WIRED
- `rose_bed` · `Assets/world/props/meshy/wishlist/rose_bed.glb` · Meshy wish list · flower bed · WIRED
- `sunflowers` · `Assets/world/props/meshy/wishlist/sunflowers.glb` · Meshy wish list · sunflowers · WIRED
- `agave` · `Assets/world/props/meshy/wishlist/agave.glb` · Meshy wish list · agave (volcano slope plant) · WIRED
- `yucca` · `Assets/world/props/meshy/wishlist/yucca.glb` · Meshy wish list · yucca · WIRED
- `burnt_tree` · `Assets/world/props/meshy/wishlist/burnt_tree.glb` · Meshy wish list · burnt tree (volcano) · WIRED
- `meshy_dead_snag` · `Assets/world/props/meshy/Meshy_AI_a_dead_snag_0916235650_texture.glb` · Meshy AI (300) · dead snag (volcano) · WIRED
- `meshy_dead_tree_with_a_dark_hole` · `Assets/world/props/meshy/Meshy_AI_a_dead_tree_with_a_dark_hole_0916235739_texture.glb` · Meshy AI (300) · dead tree with a hole · WIRED
- `meshy_tree_with_a_hole` · `Assets/world/props/meshy/Meshy_AI_a_tree_with_a_hole_0916235727_texture.glb` · Meshy AI (300) · tree with a hole · WIRED
- `meshy_fallen_log` · `Assets/world/props/meshy/Meshy_AI_a_fallen_log_0916235700_texture.glb` · Meshy AI (300) · fallen log · WIRED
- `fallen_redwood` · `Assets/world/props/meshy/wishlist/fallen_redwood.glb` · Meshy wish list · huge fallen trunk (jungle) · WIRED
- `meshy_stump` · `Assets/world/props/meshy/Meshy_AI_a_stump_0916235717_texture.glb` · Meshy AI (300) · stump · WIRED
- `hw_tree`, `hw_tree_2`, `hw_tree_3`, `hw_tree_4`, `hw_tree_5` · `…/halloween.fbx#Tree`, `#Tree_01` … `#Tree_04` · Halloween pack · spooky bare trees (volcano / haunted wood) · WIRED
- `mushroom`, `fae_mushroom` · `Assets/world/props/meshy/Meshy_AI_mushroom_0727200342_texture.glb` · Meshy AI (300) · mushroom (two keys, one file) · WIRED
- `mushroom2`, `fae_toadstool`, `woods_glowcap` · `Assets/world/props/meshy/Meshy_AI_mushroom_realistic_0727202046_texture.glb` · Meshy AI (300) · toadstool (three keys, one file) · WIRED
- `lake_rock` · `Assets/world/props/meshy/wishlist/lake_rock.glb` · Meshy wish list · rock in water · WIRED
- `cairn` · `Assets/world/props/meshy/wishlist/cairn.glb` · Meshy wish list · stacked-stone cairn · WIRED
- `cave_stone`, `menhir` · `Assets/world/props/meshy/Meshy_AI_a_standing_stone_0916235906_texture.glb` · Meshy AI (300) · standing stone (two keys, one file) · WIRED
- `sarsen` · `Assets/world/props/meshy/Meshy_AI_a_standing_stone_0912231506_texture.glb` · Meshy AI (300) · standing stone · WIRED
- `ore_heap` · `Assets/world/props/meshy/wishlist/ore_heap.glb` · Meshy wish list · heap of ore / rock (volcano, smith) · WIRED
- `meshy_crystal_shard` · `Assets/world/props/meshy/Meshy_AI_crystal_shard_1027232226_texture.glb` · Meshy AI (300) · crystal shard · WIRED
- `meshy_crystal_shards` · `Assets/world/props/meshy/Meshy_AI_crystal_shards_1027232219_texture.glb` · Meshy AI (300) · crystal cluster · WIRED
- `hw_stone`, `hw_stone_1` … `hw_stone_5` · `…/halloween.fbx#Stone`, `#Stone_01` … `#Stone_05` · Halloween pack · six stones · WIRED
- `ocean_rock`, `ocean_rock_2` … `ocean_rock_11` · `Assets/world/packs/ocean/Rock.fbx`, `Rock1.fbx` … `Rock10.fbx` · Ocean pack · 11 sea rocks (shore, volcano) · WIRED
- `skull` · `Assets/fx/spell_props/Meshy_AI_skull_realistic_0725070330_texture.glb` · Meshy AI (300) · skull · WIRED
- `skull_pile` · `Assets/world/props/meshy/Meshy_AI_skull_pile_0917035243_texture.glb` · Meshy AI (300) · pile of skulls (jungle lair) · WIRED
- `femur` · `Assets/fx/spell_props/Meshy_AI_femur_bone_realistic_0725070208_texture.glb` · Meshy AI (300) · bone · WIRED
- `ulna` · `Assets/fx/spell_props/Meshy_AI_ulna_bone_realistic_0725070052_texture.glb` · Meshy AI (300) · bone · WIRED
- `cattle_skull` · `Assets/world/props/meshy/wishlist/cattle_skull.glb` · Meshy wish list · horned skull · WIRED
- `hw_web`, `hw_web_2`, `hw_web_3` · `…/halloween.fbx#Spiderweb`, `#Spiderweb_01`, `#Spiderweb_02` · Halloween pack · spider webs (jungle, old storehouse) · WIRED

## Harbour + sea

- `dock_boat` · `Assets/world/props/meshy/wishlist/dock_boat.glb` · Meshy wish list · small boat at a dock · WIRED
- `meshy_rowboat` · `Assets/world/props/meshy/Meshy_AI_a_rowboat_0912231059_texture.glb` · Meshy AI (300) · rowboat · WIRED
- `dugout_canoe` · `Assets/world/props/meshy/wishlist/dugout_canoe.glb` · Meshy wish list · dugout canoe · WIRED
- `raft` · `Assets/world/props/meshy/wishlist/raft.glb` · Meshy wish list · raft · WIRED
- `trawler` · `Assets/world/props/meshy/wishlist/trawler.glb` · Meshy wish list · fishing trawler (modern; far-off only) · WIRED
- `ship_wreck` · `Assets/world/props/meshy/Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb` · Meshy AI (300) · wrecked sailing ship · WIRED
- `torn_sail_mast` · `Assets/world/props/meshy/wishlist/torn_sail_mast.glb` · Meshy wish list · mast with a torn sail · WIRED
- `oars` · `Assets/world/props/meshy/wishlist/oars.glb` · Meshy wish list · oars · WIRED
- `fishing_rod` · `Assets/world/props/meshy/wishlist/fishing_rod.glb` · Meshy wish list · fishing rod · WIRED
- `drying_fish` · `Assets/world/props/meshy/wishlist/drying_fish.glb` · Meshy wish list · fish drying rack · WIRED
- `fish_boxes` · `Assets/world/props/meshy/wishlist/fish_boxes.glb` · Meshy wish list · boxes of fish · WIRED
- `mooring_bollard` · `Assets/world/props/meshy/wishlist/mooring_bollard.glb` · Meshy wish list · mooring bollard · WIRED
- `rope_coils` · `Assets/world/props/meshy/wishlist/rope_coils.glb` · Meshy wish list · coils of rope · WIRED
- `meshy_rope` · `Assets/world/props/meshy/Meshy_AI_rope_1027232157_texture.glb` · Meshy AI (300) · rope · WIRED
- `safety_netting` · `Assets/world/props/meshy/wishlist/safety_netting.glb` · Meshy wish list · netting (possible fishing-net stand-in; look first) · WIRED
- `ship_anchor` · `Assets/world/props/meshy/Meshy_AI_ship_anchor_0912231033_texture.glb` · Meshy AI (300) · anchor · WIRED
- `wheel` · `Assets/world/props/meshy/Meshy_AI_a_ship_s_wheel_0912230950_texture.glb` · Meshy AI (300) · ship's wheel · WIRED
- `ship_cannon` · `Assets/world/props/meshy/Meshy_AI_iron_canon_0912231022_texture.glb` · Meshy AI (300) · iron cannon (castle wall, harbour battery) · WIRED
- `sea_chest` · `Assets/world/props/meshy/Meshy_AI_pirate_treasure_chest_0912231220_texture.glb` · Meshy AI (300) · treasure chest · WIRED
- `hw_pier` · `…/halloween.fbx#Concrete_01` · Halloween pack · stone pier block · WIRED
- `tentacle` · `Assets/world/props/meshy/Meshy_AI_a_kraken_tentacle_0912231121_texture.glb` · Meshy AI (300) · kraken tentacle (sea monster off the bay) · WIRED
- `tentacle2` · `Assets/world/props/meshy/Meshy_AI_a_kraken_tentacle_2_0912231110_texture.glb` · Meshy AI (300) · kraken tentacle 2 · WIRED
- `shark` · `Assets/world/props/meshy/Meshy_AI_shark_0912231236_texture.glb` · Meshy AI (300) · shark · WIRED
- `sandcastle` · `Assets/world/props/meshy/wishlist/sandcastle.glb` · Meshy wish list · sandcastle (beach) · WIRED
- `ocean_crab` · `Assets/world/packs/ocean/Crab.fbx` · Ocean pack · crab · WIRED
- `ocean_lobster` · `Assets/world/packs/ocean/Lobster.fbx` · Ocean pack · lobster · WIRED
- `ocean_turtle` · `Assets/world/packs/ocean/Turtle.fbx` · Ocean pack · sea turtle · WIRED
- `ocean_octopus` · `Assets/world/packs/ocean/Octopus.fbx` · Ocean pack · octopus · WIRED
- `ocean_squid` · `Assets/world/packs/ocean/Squid.fbx` · Ocean pack · squid · WIRED
- `ocean_eel` · `Assets/world/packs/ocean/Eel.fbx` · Ocean pack · eel · WIRED
- `ocean_fish`, `ocean_fish_2`, `ocean_fish_3` · `Assets/world/packs/ocean/Fish1.fbx`, `Fish2.fbx`, `Fish3.fbx` · Ocean pack · fish · WIRED
- `ocean_brown_fish` · `Assets/world/packs/ocean/BrownFish.fbx` · Ocean pack · brown fish · WIRED
- `ocean_tuna` · `Assets/world/packs/ocean/TunaFish.fbx` · Ocean pack · tuna (fish market) · WIRED
- `ocean_clownfish` · `Assets/world/packs/ocean/ClownFish.fbx` · Ocean pack · clownfish · WIRED
- `ocean_dory` · `Assets/world/packs/ocean/DoryFish.fbx` · Ocean pack · blue tang · WIRED
- `ocean_dolphin` · `Assets/world/packs/ocean/Dolphin.fbx` · Ocean pack · dolphin · WIRED
- `ocean_whale` · `Assets/world/packs/ocean/Whale.fbx` · Ocean pack · whale · WIRED
- `ocean_humpback` · `Assets/world/packs/ocean/Whale2.fbx` · Ocean pack · humpback whale · WIRED
- `ocean_shark` · `Assets/world/packs/ocean/Shark.fbx` · Ocean pack · shark · WIRED
- `ocean_hammerhead` · `Assets/world/packs/ocean/Hammerhead.fbx` · Ocean pack · hammerhead · WIRED
- `ocean_manta` · `Assets/world/packs/ocean/Manta ray.fbx` · Ocean pack · manta ray · WIRED
- `ocean_stingray` · `Assets/world/packs/ocean/StingRay.fbx` · Ocean pack · stingray · WIRED
- `ocean_seal`, `ocean_seal_resting` · `Assets/world/packs/ocean/Seal.fbx` · Ocean pack · seal (two keys, one file) · WIRED
- `ocean_moon_jelly` · `Assets/world/packs/ocean/Jellyfish_Moon_Jelly.glb` · Ocean pack · moon jellyfish · WIRED
- `ocean_moon_jelly_pulsing` · `Assets/world/packs/ocean/Jellyfish_Pulsing_Frames.glb` · Ocean pack · pulsing jellyfish · WIRED
- `ocean_box_jelly` · `Assets/world/packs/ocean/Jellyfish_Box_Jelly.glb` · Ocean pack · box jellyfish · WIRED
- `ocean_bioluminescent_jelly` · `Assets/world/packs/ocean/Jellyfish_Bioluminescent.glb` · Ocean pack · glowing jellyfish (night bay) · WIRED
- `ocean_starfish` · `Assets/world/packs/ocean/StarFish.fbx` · Ocean pack · starfish · WIRED
- `ocean_conch` · `Assets/world/packs/ocean/Shells.fbx` · Ocean pack · conch shell · WIRED
- `ocean_sand_dollar`, `ocean_sand_dollar_2`, `ocean_sand_dollar_3` · `Assets/world/packs/ocean/Shells1.fbx`, `Shells2.fbx`, `Shells3.fbx` · Ocean pack · shells · WIRED
- `ocean_seaweed`, `ocean_seaweed_2`, `ocean_seaweed_3` · `Assets/world/packs/ocean/SeaWeed.fbx`, `SeaWeed1.fbx`, `SeaWeed2.fbx` · Ocean pack · seaweed · WIRED
- `kelp` · `Assets/world/packs/ocean/SeaWeed.fbx` · Ocean pack · kelp (same file as `ocean_seaweed`) · WIRED
- `ocean_coral`, `ocean_coral_2` … `ocean_coral_7` · `Assets/world/packs/ocean/Coral.fbx`, `Coral1.fbx` … `Coral6.fbx` · Ocean pack · seven corals · WIRED
- `coral_brain`, `coral_fan`, `coral_tube` · `Assets/world/packs/ocean/Coral.fbx`, `Coral1.fbx`, `Coral2.fbx` · Ocean pack · corals (older keys, same files) · WIRED

## Village + farm

- `market_stall` · `Assets/world/props/meshy/wishlist/market_stall.glb` · Meshy wish list · market stall · WIRED
- `hand_cart` · `Assets/world/props/meshy/wishlist/hand_cart.glb` · Meshy wish list · hand cart · WIRED
- `hay_cart` · `Assets/world/props/meshy/wishlist/hay_cart.glb` · Meshy wish list · hay cart · WIRED
- `food_trolley` · `Assets/world/props/meshy/wishlist/food_trolley.glb` · Meshy wish list · food trolley (possible festival food cart; look first) · WIRED
- `hay_bale` · `Assets/world/props/meshy/wishlist/hay_bale.glb` · Meshy wish list · hay bale · WIRED
- `hay_rack` · `Assets/world/props/meshy/wishlist/hay_rack.glb` · Meshy wish list · hay rack (rice-drying rack stand-in) · WIRED
- `hw_straw`, `hw_straw_2` · `…/halloween.fbx#Straw`, `#Straw_01` · Halloween pack · straw piles · WIRED
- `hw_scarecrow`, `hw_scarecrow_2` · `…/halloween.fbx#Scarecrow`, `#Scarecrow_01` · Halloween pack · scarecrows · WIRED
- `hw_farmland` · `…/halloween.fbx#Farmland` · Halloween pack · tilled field patch · WIRED
- `hw_crop`, `hw_crop_2`, `hw_crop_3` · `…/halloween.fbx#Farmland_01`, `#Farmland_02`, `#Farmland_04` · Halloween pack · crop patches · WIRED
- `hw_pumpkin`, `hw_pumpkin_2`, `hw_pumpkin_3`, `hw_pumpkin_4` · `…/halloween.fbx#Pumpkin`, `#Pumpkin_01` … `#Pumpkin_03` · Halloween pack · pumpkins (kabocha in a field; check they are not carved) · WIRED
- `hw_shovel` · `…/halloween.fbx#Shovel` · Halloween pack · shovel · WIRED
- `plough` · `Assets/world/props/meshy/wishlist/plough.glb` · Meshy wish list · plough · WIRED
- `pitchfork` · `Assets/world/props/meshy/wishlist/pitchfork.glb` · Meshy wish list · pitchfork · WIRED
- `pickaxe` · `Assets/world/props/meshy/wishlist/pickaxe.glb` · Meshy wish list · pickaxe · WIRED
- `wheelbarrow` · `Assets/world/props/meshy/wishlist/wheelbarrow.glb` · Meshy wish list · wheelbarrow · WIRED
- `woven_baskets` · `Assets/world/props/meshy/wishlist/woven_baskets.glb` · Meshy wish list · woven baskets · WIRED
- `wooden_barrel` · `Assets/world/props/meshy/wishlist/wooden_barrel.glb` · Meshy wish list · wooden barrel (sake, harbour) · WIRED
- `wooden_bucket` · `Assets/world/props/meshy/Meshy_AI_wooden_bucket_0922011434_texture.glb` · Meshy AI (300) · wooden bucket (well, onsen) · WIRED
- `meshy_burlap_sack` · `Assets/world/props/meshy/Meshy_AI_burlap_sack_1027232243_texture.glb` · Meshy AI (300) · burlap sack (rice sack) · WIRED
- `water_trough` · `Assets/world/props/meshy/wishlist/water_trough.glb` · Meshy wish list · water trough · WIRED
- `ancient_well` · `Assets/world/props/meshy/Meshy_AI_an_ancient_well_0922010024_texture.glb` · Meshy AI (300) · old stone well · WIRED
- `beehive` · `Assets/world/props/meshy/wishlist/beehive.glb` · Meshy wish list · beehive · WIRED
- `clothes_line` · `Assets/world/props/meshy/wishlist/clothes_line.glb` · Meshy wish list · clothes line · WIRED
- `grape_trellis` · `Assets/world/props/meshy/wishlist/grape_trellis.glb` · Meshy wish list · vine trellis (wisteria-frame stand-in) · WIRED
- `corn_row` · `Assets/world/props/meshy/wishlist/corn_row.glb` · Meshy wish list · row of corn (tall crop) · WIRED
- `corn_stalk` · `Assets/world/props/meshy/wishlist/corn_stalk.glb` · Meshy wish list · corn stalk · WIRED
- `firewood_stack` · `Assets/world/props/meshy/wishlist/firewood_stack.glb` · Meshy wish list · stacked firewood · WIRED
- `axe_chopping_block` · `Assets/world/props/meshy/wishlist/axe_chopping_block.glb` · Meshy wish list · axe in a chopping block · WIRED
- `forge` · `Assets/world/props/meshy/wishlist/forge.glb` · Meshy wish list · forge (swordsmith) · WIRED
- `anvil` · `Assets/world/props/meshy/wishlist/anvil.glb` · Meshy wish list · anvil (swordsmith) · WIRED
- `bellows` · `Assets/world/props/meshy/wishlist/bellows.glb` · Meshy wish list · bellows (swordsmith) · WIRED
- `grindstone` · `Assets/world/props/meshy/wishlist/grindstone.glb` · Meshy wish list · grindstone (sword sharpening) · WIRED
- `meshy_tongs` · `Assets/world/props/meshy/Meshy_AI_tongs_1027232138_texture.glb` · Meshy AI (300) · tongs (smith) · WIRED
- `saddle` · `Assets/world/props/meshy/wishlist/saddle.glb` · Meshy wish list · saddle (stable) · WIRED
- `mine_cart` · `Assets/world/props/meshy/wishlist/mine_cart.glb` · Meshy wish list · mine cart (volcano mine) · WIRED
- `meshy_campfire_ring` · `Assets/world/props/meshy/Meshy_AI_a_campfire_ring_0916235856_texture.glb` · Meshy AI (300) · campfire ring · WIRED
- `brazier` · `Assets/world/props/meshy/Meshy_AI_brazier_0917035429_texture.glb` · Meshy AI (300) · brazier · WIRED
- `decor_wall_torch_bracket` · `Assets/world/props/meshy_decor/wall_torch_bracket.glb` · Meshy decor (11-03) · wall torch bracket · WIRED
- `cage_wagon` · `Assets/world/props/meshy/wishlist/cage_wagon.glb` · Meshy wish list · cage wagon (dinosaur catcher / prisoner cart) · WIRED

## Interiors + furniture

- `trestle_table` · `Assets/world/props/meshy/wishlist/trestle_table.glb` · Meshy wish list · wooden trestle table · WIRED
- `picnic_table` · `Assets/world/props/meshy/wishlist/picnic_table.glb` · Meshy wish list · wooden bench table (inn yard) · WIRED
- `wood_stove` · `Assets/world/props/meshy/wishlist/wood_stove.glb` · Meshy wish list · wood stove · WIRED
- `hot_tub` · `Assets/world/props/meshy/wishlist/hot_tub.glb` · Meshy wish list · hot tub (onsen stand-in; may look modern, look first) · WIRED
- `beach_towel` · `Assets/world/props/meshy/wishlist/beach_towel.glb` · Meshy wish list · towel (bath house) · WIRED
- `fur_rug` · `Assets/world/props/meshy/wishlist/fur_rug.glb` · Meshy wish list · fur rug · WIRED
- `floor_runner` · `Assets/world/props/meshy/wishlist/floor_runner.glb` · Meshy wish list · floor runner rug · WIRED
- `sleeping_bag` · `Assets/world/props/meshy/wishlist/sleeping_bag.glb` · Meshy wish list · bedroll (weak futon stand-in) · WIRED
- `oil_lamp` · `Assets/world/props/meshy/wishlist/oil_lamp.glb` · Meshy wish list · oil lamp · WIRED
- `lit_candle` · `Assets/world/props/meshy/wishlist/lit_candle.glb` · Meshy wish list · lit candle · WIRED
- `candle` · `Assets/fx/spell_props/Meshy_AI_single_lit_candle_realistic_0725065958_texture.glb` · Meshy AI (300) · lit candle · WIRED
- `candleLine` · `Assets/fx/spell_props/Meshy_AI_line_of_lit_candles_realisti_0725065822_texture.glb` · Meshy AI (300) · line of candles (temple) · WIRED
- `candleRing` · `Assets/fx/spell_props/Meshy_AI_lit_candles_ritual_circle__0725065829_texture.glb` · Meshy AI (300) · ring of candles · WIRED
- `hw_candle`, `hw_candle_2`, `hw_candles`, `hw_candles_2` · `…/halloween.fbx#Candle`, `#Candle_02`, `#Candle_03`, `#Candle_01` · Halloween pack · candles · WIRED
- `cauldron` · `Assets/fx/spell_props/Meshy_AI_black_cauldron_0713025916_texture.glb` · Meshy AI (300) · black iron pot (kitchen hearth) · WIRED
- `item_drinking_cup` · `Assets/world/props/misc/drinking_cup.glb` · Meshy held props · drinking cup · WIRED
- `item_hand_mirror` · `Assets/world/props/misc/hand_mirror.glb` · Meshy held props · hand mirror · WIRED
- `cheval_mirror` · `Assets/world/props/meshy/wishlist/cheval_mirror.glb` · Meshy wish list · standing mirror (theatre dressing room) · WIRED
- `costume_rack` · `Assets/world/props/meshy/costume_rack.glb` · Meshy, Entertainment pass 2 · costume rack (theatre; check the clothes) · WIRED
- `antler_trophy` · `Assets/world/props/meshy/wishlist/antler_trophy.glb` · Meshy wish list · antlers on a board · WIRED
- `footlocker` · `Assets/world/props/meshy/footlocker.glb` · Meshy, Civic interiors (11-13) · trunk (may read as military; look first) · WIRED
- `royal_throne` · `Assets/world/props/meshy/Meshy_AI_royal_throne_0917035803_texture.glb` · Meshy AI (300) · throne (European; castle lord's seat only if nothing better) · WIRED

## Food

- `teapot`, `teacups`, `kettle` · see Japanese pieces
- `bread_rack` · `Assets/world/props/meshy/bread_rack.glb` · Meshy, Entertainment pass 2 · rack of bread (bakery; weak fit) · WIRED
- `xmas_roast` · `Assets/world/packs/elbolilloduro_christmas/models/Christmas.dae#Christmas_food_03` · Christmas pack · Elbolilloduro · roast dish (inn table; look first) · WIRED
- `xmas_carvery` · `…/Christmas.dae#Christmas_food_01` · Christmas pack · plated food (look first) · WIRED
- `xmas_cocoa`, `xmas_cocoa_2` · `…/Christmas.dae#Cup_chocolate`, `#Cup_chocolate_01` · Christmas pack · cups of hot drink (tea house; look first) · WIRED
- `drying_fish`, `fish_boxes`, `ocean_tuna`, `coconuts` · see Harbour + Nature

## Weapons

- `sword` · `Assets/fx/spell_props/Meshy_AI_master_sword_0713025949_texture.glb` · Meshy AI (300) · "master sword" (Western blade, not a katana) · WIRED
- `spell_throwing_knife` · `Assets/fx/spell_props/Meshy_AI_throwing_knife_1027232048_texture.glb` · Meshy AI (300) · throwing knife (kunai stand-in) · WIRED
- `arrow` · `Assets/fx/spell_props/Meshy_AI_arrow_0713025846_texture.glb` · Meshy AI (300) · arrow · WIRED
- `spell_shield` · `Assets/fx/spell_props/Meshy_AI_shield_1027232025_texture.glb` · Meshy AI (300) · shield · WIRED
- `item_blowpipe` · `Assets/world/props/misc/blowpipe.glb` · Meshy held props · blowpipe (ninja) · WIRED
- `item_wizard_staff` · `Assets/world/props/misc/wizard_staff.glb` · Meshy held props · staff (monk's staff stand-in; look first) · WIRED
- `rifle_rack` · `Assets/world/props/meshy/rifle_rack.glb` · Meshy, Civic interiors · rifle rack (modern guns; only rack in this part) · WIRED
- `ship_cannon` · see Harbour

## Animals + units (all are props, none is a unit)

- `deer` · `Assets/world/props/meshy/wishlist/deer.glb` · Meshy wish list · deer (Nara-style shrine deer) · WIRED
- `fox` · `Assets/world/props/meshy/wishlist/fox.glb` · Meshy wish list · fox (live animal; kitsune) · WIRED
- `heron` · `Assets/world/props/meshy/wishlist/heron.glb` · Meshy wish list · heron (nearest thing to a crane) · WIRED
- `swan` · `Assets/world/props/meshy/wishlist/swan.glb` · Meshy wish list · swan · WIRED
- `duck` · `Assets/world/props/meshy/wishlist/duck.glb` · Meshy wish list · duck · WIRED
- `rooster` · `Assets/world/props/meshy/wishlist/rooster.glb` · Meshy wish list · rooster · WIRED
- `pig` · `Assets/world/props/meshy/wishlist/pig.glb` · Meshy wish list · pig · WIRED
- `goat` · `Assets/world/props/meshy/wishlist/goat.glb` · Meshy wish list · goat · WIRED
- `mountain_goat` · `Assets/world/props/meshy/wishlist/mountain_goat.glb` · Meshy wish list · mountain goat (volcano slopes) · WIRED
- `bear` · `Assets/world/props/meshy/wishlist/bear.glb` · Meshy wish list · bear (woods) · WIRED
- `hawk` · `Assets/world/props/meshy/wishlist/hawk.glb` · Meshy wish list · hawk · WIRED
- `owl_perched` · `Assets/world/props/meshy/wishlist/owl_perched.glb` · Meshy wish list · perched owl · WIRED
- `raven_perch` · `Assets/world/props/meshy/wishlist/raven_perch.glb` · Meshy wish list · raven on a perch (crow) · WIRED
- `seagull` · `Assets/world/props/meshy/wishlist/seagull.glb` · Meshy wish list · seagull · WIRED
- `parrot` · `Assets/world/props/meshy/wishlist/parrot.glb` · Meshy wish list · parrot (jungle) · WIRED
- `peacock` · `Assets/world/props/meshy/wishlist/peacock.glb` · Meshy wish list · peacock (castle garden) · WIRED
- `dragonfly` · `Assets/world/props/meshy/wishlist/dragonfly.glb` · Meshy wish list · dragonfly (paddies) · WIRED
- `firefly` · `Assets/world/props/meshy/wishlist/firefly.glb` · Meshy wish list · firefly · WIRED
- `meshy_frog` · `Assets/world/props/meshy/Meshy_AI_frog_1027232151_texture.glb` · Meshy AI (300) · frog · WIRED
- `lizard` · `Assets/world/props/meshy/wishlist/lizard.glb` · Meshy wish list · lizard (jungle) · WIRED
- `cobra` · `Assets/world/props/meshy/wishlist/cobra.glb` · Meshy wish list · snake (jungle) · WIRED
- `rattlesnake` · `Assets/world/props/meshy/wishlist/rattlesnake.glb` · Meshy wish list · snake · WIRED
- `spider` · `Assets/world/props/meshy/wishlist/spider.glb` · Meshy wish list · spider · WIRED
- `caterpillar` · `Assets/world/props/meshy/Meshy_AI_caterpillar_0912231445_texture.glb` · Meshy AI (300) · caterpillar (made for Wonderland; look first) · WIRED
- `rat` · `Assets/world/props/meshy/wishlist/rat.glb` · Meshy wish list · rat · WIRED
- `hedgehog` · `Assets/world/props/meshy/wishlist/hedgehog.glb` · Meshy wish list · hedgehog · WIRED
- `river_fish` · `Assets/world/props/meshy/wishlist/river_fish.glb` · Meshy wish list · river fish (nearest thing to a koi) · WIRED
- `dodo` · `Assets/world/props/meshy/wishlist/dodo.glb` · Meshy wish list · dodo (lost-world bird for the jungle) · WIRED
- `vulture` · `Assets/world/props/meshy/wishlist/vulture.glb` · Meshy wish list · vulture (volcano) · WIRED
- `decor_sheep` · `Assets/world/props/meshy_decor/sheep.glb` · Meshy decor (11-03) · sheep · WIRED
- sea animals: see Harbour + sea (Ocean pack).

## Textures + decals

None in this part.

## Sky + horizon

- `moon` · `Assets/world/props/meshy/Meshy_AI_moon_realistic_0727195427_texture.glb` · Meshy AI (300) · moon model (a big moon over the castle) · WIRED
- `white_cloud` · `Assets/world/props/meshy/Meshy_AI_white_cloud_0917035538_texture.glb` · Meshy AI (300) · cloud · WIRED
- No horizon / monument builders in this part.

## Other

- `ring_of_fire` · `Assets/world/props/meshy/wishlist/ring_of_fire.glb` · Meshy wish list · ring of fire (circus hoop; festival / volcano dressing) · WIRED
- `item_potion_flask` · `Assets/world/props/misc/potion_flask.glb` · Meshy held props · flask (apothecary / sake bottle stand-in) · WIRED
- `item_spyglass` · `Assets/world/props/misc/spyglass.glb` · Meshy held props · spyglass (harbour watch) · WIRED
- `brass_telescope`, `telescope` · `Assets/world/props/meshy/Meshy_AI_telescope_0917035520_texture.glb` · Meshy AI (300) · telescope (castle lookout; two keys, one file) · WIRED
- `gallows` · `Assets/world/props/meshy/wishlist/gallows.glb` · Meshy wish list · gallows (castle execution ground) · WIRED
- `hw_grave`, `hw_grave_low`, `hw_grave_slab` · `…/halloween.fbx#Stone_06`, `#Stone_08`, `#Stone_07` · Halloween pack · gravestones (Western shapes; temple graveyard only if they pass) · WIRED
- `sarcophagus` · `Assets/world/props/meshy/Meshy_AI_stone_sarcophagus_0917035255_texture.glb` · Meshy AI (300) · stone tomb · WIRED
- `carved_totem_pole` · `Assets/world/props/meshy/wishlist/carved_totem_pole.glb` · Meshy wish list · carved pole (jungle tribe marker) · WIRED
- `wanted_poster` · `Assets/world/props/meshy/wishlist/wanted_poster.glb` · Meshy wish list · wanted poster (check the print is not Western) · WIRED
- `balloons` · `Assets/world/props/meshy/wishlist/balloons.glb` · Meshy wish list · balloons (festival; weak) · WIRED

`…/halloween.fbx` = `Assets/world/packs/elbolilloduro_halloween/models/halloween.fbx`; `…/Christmas.dae` = `Assets/world/packs/elbolilloduro_christmas/models/Christmas.dae`.

---

## Reader 4

# Part 4: MODEL_LIST.md lines 2313-3644 — what fits Katana Island

Read: rest of §6 (small packs, Meshy interior passes, the Meshy decor `_HQ_DECOR_GLB`, pack wear, stairs pack), §7a spell props,
§7a-2 worn gear, §7b `_MISC_GLB`, §7c `_ANIMALS`, §7d foliage / tree kinds, §7e, §7f, §8 code-built stand-ins.

## Top of the list

**Best finds**
- The only outright Japanese pieces in this part: `taiko_drum`, `dojo_weapon_rack`, `wing_chun_dummy` (Southside pass 2, all WIRED), plus `privacy_screen` (a folding screen) and `votive_stand`.
- Harbour is well covered: `fishing_boat`, `rowboat`, `mooring_piles`, `stilt_house` / `stilt_house_wide` / `stilt_hut`, `skiff`, `sea_buoy`, `lighthouse`, `fishing_net_wall`, `lobster_traps`, `ship_wheel`, `ships_bell`, `anchor`, `cannon`, `wreck`, `chest`.
- Castle kit, five pieces only: `castle_wall`, `castle_gate`, `castle_tower`, `castle_tower_top`, `castle_cone` (McSteeg; European look, usable as stone base walls).
- Dojo / armoury dressing: `armour_stand` (+ `armour_plinth`), `banner`, `sword`, `spear`, `shield`, `arrow`, `throwingKnife`, `blowpipe`, `staff`, `punching_bag`.
- Fire and light: `cave_torch`, `wall_torch_bracket` (proc `wall_torch`), `brazier`, `campfire`, `ship_lantern` / `lantern`, `railway_lantern`, `candle` / `candleLine` / `candleRing`, `candelabra`; `tiki_torch` is CODE-BUILT only.
- Jungle + dinosaurs: `dinosaur_skeleton`, `fern`, `palm`, `palmisle`, `woods_thornvine`, `femur` / `ulna` / `skull` / `skull_pile`, `elephant`, the whole insects pack (butterflies, moths, grasshoppers, bees, ants).
- Garden / shrine stone: `psxg_stepping_stone_1/2`, `psxg_rock_1..4`, `ancient_well`, `ancient_walkway`, `footbridge`, `stone_altar`, `stone_arch`, `stone_urn`, `menhir`, `standingstone`, `owl_statue`, `lion_statue`, `fountain`.
- Tea house: `teapot`, `teacups`, `cup`, `wooden_bucket`, `stock_pots`, `pot_rack`.
- Tree kinds (HQ_TREE_KINDS), complete: `pine`, `pine_2`, `tree_pine`, `tree_sapling`, `tree`, `tree_2..4`, `tree_52..56` (painted trees), `tree_43..47` (Quaternius pines), `tree_7..12` + `tree_48..51` (Quaternius round trees), `tree_21..30` (birches), dead trees `tree_5`, `tree_6`, `tree_13..20`, `tree_31..42`, `palm`, `saguaro`, `fae_bloom_tree` (+ `_pink` = the nearest thing to blossom), `fae_cap`, `fae_cap_2`.

**What a Japanese island needs that this part does NOT have**
- NO cherry / sakura, NO bamboo, NO maple, NO willow, NO jungle tree, NO banana / vine tree kind. Only pines, birches, round trees, dead trees, one palm.
- NO torii, pagoda, shrine, temple, castle keep, Japanese roof / wall / shoji / tatami kit pieces; no stone or paper lantern; no katana, bow, naginata, samurai armour; no bonsai, koi, crane bird, fox / lion-dog / buddha statue; no rice paddy, crops, haystack, cart-with-ox, water wheel, market stall (only `hot_dog_stand`, `popcorn_cart`, `city_taco_stand`).
- NO live dinosaur, egg or nest (only the museum `dinosaur_skeleton`); no deer, fox, monkey, fish, crab, turtle, frog animal (`frog` is a spell prop), no volcano / lava / black rock piece.
- The stairs pack table (HQ_STAIR_PACK) is EMPTY in the list (header only): no stair file rows to pick from here.
- No textures or decals are listed in this part at all.

Status words: WIRED = listed with a catalogue key. DECOR = a `_HQ_DECOR_GLB` model worn by the proc of that name (place the proc key from §8). MISC = a `_MISC_GLB` renderer key (settings / horizon / monument model; the list does not say it is a catalogue row). SPELL = a `_WPN_MODELS` spell prop (not a room prop by itself). TREE = a tree key (HQ_TREE_KINDS / renderer). CODE-BUILT = procedural stand-in.

---

## Japanese pieces (direct)
- `taiko_drum` · Meshy, DC Southside pass 2 · `Assets/world/props/meshy/taiko_drum.glb` · taiko drum (festival, shrine, dojo) · WIRED
- `dojo_weapon_rack` · Meshy, DC Southside pass 2 · `Assets/world/props/meshy/dojo_weapon_rack.glb` · dojo weapon rack · WIRED
- `wing_chun_dummy` · Meshy, DC Southside pass 2 · `Assets/world/props/meshy/wing_chun_dummy.glb` · wooden training dummy · WIRED
- `privacy_screen` · Meshy, University pass 2 · `Assets/world/props/meshy/privacy_screen.glb` · folding screen (reads as a byobu; made as a hospital screen, check the look) · WIRED
- `votive_stand` · Meshy, DC Southside pass 2 · `Assets/world/props/meshy/votive_stand.glb` · votive candle stand (temple) · WIRED
- `armour_stand` · Meshy decor · `Assets/world/props/meshy_decor/armour_stand.glb` (+ `armour_plinth` `Assets/world/props/meshy_decor/armour_plinth.glb`) · armour on a stand (European plate, not samurai) · DECOR (proc `armour_stand`)
- `banner` · Meshy decor · `Assets/world/props/meshy_decor/banner.glb` · hanging banner · DECOR (proc `banner`)
- `umbrella_stand` + `umbrella_closed` · Meshy decor · `Assets/world/props/meshy_decor/umbrella_stand.glb`, `.../umbrella_closed.glb` · umbrella stand (inn entrance) · DECOR (proc `umbrella_stand`)
- `purity_censer` · worn gear (UNIT_GEAR_WEAR) · `Assets/world/props/misc/censer.glb` · incense censer · gear model, R2 file (no room catalogue row listed)
- `ward` · worn gear · `Assets/world/props/misc/ward_totem.glb` · ward totem · gear model
- `martyrs_talisman` · worn gear · `Assets/world/props/misc/talisman_pendant.glb` · talisman pendant (omamori stand-in) · gear model
- `teapot` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_teapot_0912231417_texture.glb` · teapot · MISC
- `teacups` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_stacked_teacups_0912231425_texture.glb` · stacked teacups · MISC
- `brazier` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_brazier_0917035429_texture.glb` · brazier (shrine / castle fire) · MISC
- `instrument_drum` · Instruments pack · `Assets/world/packs/instruments/orchestral/Drum.glb` · drum · WIRED
- `instrument_whistle` · Instruments pack · `Assets/world/packs/instruments/orchestral/Whistle.glb` · flute / whistle · WIRED
- `ships_bell` · Meshy, Bayside · `Assets/world/props/meshy/ships_bell.glb` · brass bell (temple bell stand-in) · WIRED

## Buildings + kit pieces
- `castle_wall` · Castle and Fort Builder Pack (McSteeg) · `Assets/world/packs/mcsteeg_castles/Castles_and_Forts.glb#Wall_2x4` · stone castle wall 2x4 · WIRED
- `castle_gate` · same pack · `...Castles_and_Forts.glb#Gate_2x4` · castle gate 2x4 · WIRED
- `castle_tower` · same pack · `...Castles_and_Forts.glb#Tower_Mid` · tower middle · WIRED
- `castle_tower_top` · same pack · `...Castles_and_Forts.glb#Tower_top_1` · tower top · WIRED
- `castle_cone` · same pack · `...Castles_and_Forts.glb#Roof_Cone` · cone roof · WIRED
- `stilt_house` · Houses on the water (Elbolilloduro) · `Assets/world/packs/elbolilloduro/ebd_housesonwater_stilt_house.glb` · wooden house on stilts (fishing village) · WIRED
- `stilt_house_wide` · same · `Assets/world/packs/elbolilloduro/ebd_housesonwater_stilt_house_wide.glb` · wide stilt house · WIRED
- `stilt_hut` · same · `Assets/world/packs/elbolilloduro/ebd_housesonwater_stilt_hut.glb` · stilt hut · WIRED
- `woods_cabin` · Meshy, Woods horror pass · `Assets/world/props/meshy/woods_cabin.glb` · wooden cabin (hermit hut) · WIRED
- `babel_house_row` / `babel_house_small` / `babel_house_stair` / `babel_house_yard` · Meshy, Babel room · `Assets/world/props/meshy/meshy_babel_house_row.glb` etc. · ancient mud-brick houses (off-style; only as far ruins) · WIRED
- `psxg_wall`, `psxg_wall_corner`, `psxg_wall_pillar` · PSX Halloween Graveyard · `Assets/world/packs/blendervoyage_graveyard/psxg_wall.glb` etc. · low stone wall set (temple grounds, cemetery) · WIRED
- `psxg_railing`, `psxg_railing_corner` · same · railing set · WIRED
- `psxg_iron_gate_1`, `psxg_iron_gate_2` · same · iron gates (weak fit) · WIRED
- `leaf_wooden` · Door leaves · `Assets/world/hq/models/Wooden Door.glb` · plain wooden door leaf · WIRED
- `leaf_beige_wood` · Door leaves · `Assets/world/hq/models/BEIGE WOODEN DOOR.glb` · wooden door leaf · WIRED
- `leaf_white_wood` · Door leaves · `Assets/world/hq/models/WHITE WOODEN DOOR.glb` · wooden door leaf · WIRED
- `stone_arch` · Meshy decor · `Assets/world/props/meshy_decor/stone_arch.glb` · stone arch · DECOR
- `greek_column` · Meshy decor · `Assets/world/props/meshy_decor/greek_column.glb` · stone column (weak fit) · DECOR
- `t_pillar` · Meshy decor · `Assets/world/props/meshy_decor/t_pillar.glb` · carved T pillar (ancient stone) · DECOR (proc `t_pillar`)
- `obelisk` · Meshy decor · `Assets/world/props/meshy_decor/obelisk.glb` · stone obelisk / marker · DECOR
- `brick_arch` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_brick_arch_section_0916235939_texture.glb` · arch section · MISC
- `ancient_walkway` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_ancient_walkway_0917035609_texture.glb` · stone walkway (shrine approach) · MISC
- `footbridge` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_plank_footbridge_0916235844_texture.glb` · plank footbridge (not arched) · MISC
- `signpost` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_blank_wooden_signpost_0916235832_texture.glb` · blank wooden signpost · MISC
- `library_ladder` · Meshy, University pass 2 · `Assets/world/props/meshy/library_ladder.glb` · wooden ladder · WIRED
- `metro_stairs`, `metro_stair_rail` · Metro PSX · `...Metro.glb#Stairs_01`, `#Railing` · concrete stairs + rail (modern; last resort) · WIRED
- Stairs: `house_stairs`, `stair_step`, `stair_step_x`, `stair_landing`, `stair_landing_sq`, `riser_1`, `riser_2`, `riser_3` · §8 · code stairs / risers · CODE-BUILT. The stairs pack table (HQ_STAIR_PACK) lists no files.
- `temple_dome` · §8 · dome · CODE-BUILT
- `hearth_fire` · §8 · hearth fire (irori stand-in) · CODE-BUILT
- `chimney_smoke` · §8 · smoke plume (bath house, volcano vents, kitchens) · CODE-BUILT
- `false_window`, `light_shaft` · §8 · window / light beam dressing · CODE-BUILT

## Nature + trees
Tree kinds (§7d, all TREE keys):
- `pine` · `Assets/world/nature/retrotreepack/GLB/tree_rt_1_full.glb` · painted pine (bake-trees.py); also `tree_pine`, `tree_56` (same file)
- `pine_2` / `tree_sapling` · `Assets/world/nature/retrotreepack/GLB/small_tree_rt_1.glb` · small pine / sapling (Retro Tree Pack)
- `tree` / `tree_53` · `.../tree_rt_2_1_full.glb` · painted leaf tree
- `tree_2` / `tree_55` · `.../tree_rt_3_full.glb` · painted leaf tree
- `tree_3` / `tree_52` · `.../tree_rt_4_full.glb` · painted leaf tree
- `tree_4` / `tree_54` · `.../tree_rt_2_full.glb` · painted leaf tree
- `tree_43`, `tree_44`, `tree_45`, `tree_46`, `tree_47` · `Assets/world/nature/OBJ/Pine_1.obj` .. `Pine_5.obj` · Quaternius low-poly pines
- `tree_48`, `tree_7`, `tree_49`, `tree_8`, `tree_9`, `tree_50`, `tree_10`, `tree_11`, `tree_51`, `tree_12` · `Assets/world/nature/OBJ/Tree_1.obj` .. `Tree_10.obj` (in that order: 1,2,3,4,5,6,7,8,9,10) · Quaternius round leaf trees (the base to recolour for maple / blossom if recolour is possible)
- `tree_21` .. `tree_30` · `Assets/world/nature/OBJ/Birch_1.obj` .. `Birch_10.obj` · birches
- `tree_13`, `tree_41`, `tree_14`, `tree_15`, `tree_42`, `tree_16`, `tree_17`, `tree_18`, `tree_19`, `tree_20` · `DeadTree_1.obj` .. `DeadTree_10.obj` · dead trees (volcano slope)
- `tree_31` .. `tree_40` · `DeadBirch_1.obj` .. `DeadBirch_10.obj` · dead birches (volcano slope)
- `tree_5` · `.../retrotreepack/GLB/dead_tree_rt_2.glb` · dead tree; `tree_6` · `.../dead_tree_rt_1.glb` · hollow dead tree
- `palm` · `Assets/world/hq/models/Meshy_AI_palm_tree_0910054114_texture.glb` · palm tree (Meshy) · the only jungle / beach tree
- `fae_bloom_tree`, `fae_bloom_tree_pink`, `fae_bloom_tree_violet`, `fae_bloom_tree_blue` · `Assets/world/nature/OBJ/asset:world/props/meshy/ew_plant_healflower.glb.obj` (+ `#ff8fc8`, `#b890ff`, `#78c8ff`) · a flower model planted as a tree, tinted; the pink one is the nearest thing to blossom
- `fae_cap`, `fae_cap_2` · `Assets/world/props/meshy/Meshy_AI_mushroom_0727200342_texture.glb`, `...mushroom_realistic_0727202046_texture.glb` · giant mushrooms as trees (jungle oddity)
- `saguaro` · `...saguaro_cactus.glb.obj` · cactus tree kind (off-theme; listed for completeness)
- (skip: `xmas_pine*`, `xmas_snow_pine*` Christmas pines, `chess_*`)

Catalogue trees and plants:
- `pine` · Retro Tree Pack · `Assets/world/nature/retrotreepack/GLB/tree_rt_1.glb` · pine · WIRED
- `hollow_tree` · Retro Tree Pack · `Assets/world/nature/retrotreepack/GLB/tree_rt_2_1.glb` · hollow tree · WIRED
- `hollow_dead_tree` · Retro Tree Pack · `.../dead_tree_rt_1.glb` · WIRED
- `dead_snag` · Retro Tree Pack · `.../dead_tree_rt_2.glb` · WIRED
- `psxg_dead_tree_1`, `psxg_dead_tree_2` · PSX Halloween Graveyard · `Assets/world/packs/blendervoyage_graveyard/psxg_dead_tree_1.glb` etc. · dead trees (volcano) · WIRED
- `psxg_dead_bush_1`, `psxg_dead_bush_2` · same · dead bushes · WIRED
- `psxg_rock_1`, `psxg_rock_2`, `psxg_rock_3`, `psxg_rock_4` · same · rocks · WIRED
- `psxg_stepping_stone_1`, `psxg_stepping_stone_2` · same · stepping stones (garden path!) · WIRED
- `fallen_log` · Vegetation (Elbolilloduro) · `Assets/world/packs/elbolilloduro/ebd_vegetation_fallen_log.glb` · WIRED (+ MISC)
- `stump` · Vegetation · `Assets/world/packs/elbolilloduro/ebd_vegetation_stump.glb` · WIRED (+ MISC)
- `fern` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_fern_0916235806_texture.glb` · fern (jungle) · MISC
- `mushroom`, `mushroom2` · _MISC_GLB · same files as `fae_cap` / `fae_cap_2` · MISC
- `woods_thornvine` · Meshy, THE GARDEN · `Assets/world/props/meshy/ew_plant_thornvine.glb` · thorn vine (jungle) · WIRED
- `woods_healflower` · THE GARDEN · `Assets/world/props/meshy/ew_plant_healflower.glb` · flower · WIRED
- `woods_gasplant` · THE GARDEN · `Assets/world/props/meshy/ew_plant_gasplant.glb` · swamp / jungle plant · WIRED
- `fae_flower`, `fae_flower_pink`, `fae_flower_gold`, `fae_flower_blue`, `fae_flower_violet`, `fae_flower_small_pink`, `fae_flower_small_blue`, `fae_flower_small_violet`, `fae_bloom`, `fae_bloom_pink`, `fae_bloom_violet` · THE GARDEN · all `Assets/world/props/meshy/ew_plant_healflower.glb` tinted · flowers · WIRED
- `ew_plant_apple` · §7f · `Assets/world/props/meshy/ew_plant_apple.glb` · apple (fruit) · R2 file named by three-renderer.js
- `nightmare_bloom` · Meshy decor · `Assets/world/props/meshy_decor/nightmare_bloom.glb` · big strange flower (jungle) · DECOR
- `anemone` · Meshy decor · `Assets/world/props/meshy_decor/anemone.glb` · sea anemone (tide pools) · DECOR
- `giant_clam` · Meshy decor · `Assets/world/props/meshy_decor/giant_clam.glb` · giant clam (shore) · DECOR
- `sea_vent` · Meshy decor · `Assets/world/props/meshy_decor/sea_vent.glb` · smoking sea vent (volcano fumarole / hot spring vent stand-in) · DECOR
- `menhir` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_standing_stone_0916235906_texture.glb` · standing stone · MISC
- `standingstone` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_standing_stone_0912231506_texture.glb` · standing stone · MISC
- `trilithon` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_trilithon_0912231457_texture.glb` · stone gate of three slabs (the nearest shape to a torii here) · MISC
- `crystalShard`, `crystalShards` · spell props · `Assets/world/props/meshy/Meshy_AI_crystal_shard_1027232226_texture.glb`, `...crystal_shards_1027232219_texture.glb` · crystals (volcano cave) · SPELL
- `crystal_cluster` · §8 · crystal cluster · CODE-BUILT
- `meteorite_plinth` · Meshy, University pass 2 · `Assets/world/props/meshy/meteorite_plinth.glb` · black rock on a plinth (volcano shrine) · WIRED
- `asteroid_a`, `asteroid_b` · D.O.O.R. kit upload · `Assets/world/hq/models/asteroid_1.glb`, `asteroid_2.glb` · rough rock lumps (volcanic boulders / lava bombs) · WIRED
- `anthill` · Insects pack · `Assets/world/animals/insects/Ant_Anthill.glb` · anthill mound · WIRED
- `chrysalis` · Insects pack · `Assets/world/animals/insects/Butterfly_Chrysalis.glb` · WIRED
- `garden_ring`, `planter` · §8 · garden ring / planter · CODE-BUILT
- `door_vine` · §8 · vine · CODE-BUILT
- `fish_school` · §8 · a school of fish (koi pond / bay) · CODE-BUILT
- `white_cloud` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_white_cloud_0917035538_texture.glb` · cloud (volcano top, steam) · MISC
- Halloween pack pieces (§7e, cut by spells from `Assets/halloween/models/halloween.fbx`): `Stone`, `Stone_01` .. `Stone_05`, `Pumpkin`, `Pumpkin_01` .. `Pumpkin_03`, `Shovel` · stones, pumpkins, shovel · named nodes, no catalogue row listed

## Harbour + sea
- `fishing_boat` · Houses on the water · `Assets/world/packs/elbolilloduro/ebd_housesonwater_fishing_boat.glb` · fishing boat · WIRED
- `rowboat` · Houses on the water · `Assets/world/packs/elbolilloduro/ebd_housesonwater_rowboat.glb` · rowboat · WIRED (+ MISC)
- `mooring_piles` · Houses on the water · `Assets/world/packs/elbolilloduro/ebd_housesonwater_mooring_piles.glb` · mooring posts · WIRED
- `hammock` · Houses on the water · `Assets/world/packs/elbolilloduro/ebd_housesonwater_hammock.glb` · WIRED
- `skiff` · Meshy decor · `Assets/world/props/meshy_decor/skiff.glb` · small boat · DECOR (proc `skiff`)
- `sea_buoy` · Meshy decor · `Assets/world/props/meshy_decor/sea_buoy.glb` · buoy · DECOR
- `lighthouse` · Meshy decor · `Assets/world/props/meshy_decor/lighthouse.glb` · lighthouse · DECOR (proc `lighthouse`); `lighthouse_tall` is CODE-BUILT
- `fishing_net_wall` · Meshy, Bayside · `Assets/world/props/meshy/fishing_net_wall.glb` · hung fishing net · WIRED
- `lobster_traps` · Meshy, Bayside · `Assets/world/props/meshy/lobster_traps.glb` · stacked traps (crab pots) · WIRED
- `ship_wheel` · Meshy, Bayside · `Assets/world/props/meshy/ship_wheel.glb` · WIRED; `wheel` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_ship_s_wheel_0912230950_texture.glb` · MISC
- `ship_model` · Meshy, Industrial pass 2 · `Assets/world/props/meshy/ship_model.glb` · model sailing ship (shop / inn decor) · WIRED
- `ship_lantern` · Survival PSX · `Assets/world/packs/elbolilloduro/ebd_survival_lantern.glb` · oil lantern · WIRED (MISC key `lantern`)
- `beach_life_ring` · Beach Props Pack · `Assets/world/packs/elegantcrow_beach/beach_life_ring.glb` · life ring (modern; weak) · WIRED
- `anchor` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_ship_anchor_0912231033_texture.glb` · MISC
- `cannon` · _MISC_GLB / spell prop · `Assets/world/props/meshy/Meshy_AI_iron_canon_0912231022_texture.glb` · iron cannon (castle walls, harbour battery) · MISC
- `chest` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_pirate_treasure_chest_0912231220_texture.glb` · treasure chest · MISC
- `wreck` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_ghost_ship_wreck_0912231131_texture.glb` · ship wreck (off the bay) · MISC
- `palmisle` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_tiny_island_with_palm_tree_0912231720_texture.glb` · tiny palm island (far sea) · MISC
- `shark` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_shark_0912231236_texture.glb` · MISC
- `tentacle`, `tentacle2` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_kraken_tentacle_0912231121_texture.glb`, `..._2_0912231110_texture.glb` · kraken tentacles (sea monster off the bay) · MISC
- `rope` · spell prop · `Assets/world/props/meshy/Meshy_AI_rope_1027232157_texture.glb` · rope coil · SPELL
- `sack` · spell prop · `Assets/world/props/meshy/Meshy_AI_burlap_sack_1027232243_texture.glb` · burlap sack (rice sack) · SPELL
- `sandbags` · spell prop · `Assets/world/props/meshy/Meshy_AI_sandbags_1027232011_texture.glb` · stacked bags (rice bales stand-in) · SPELL
- `telescope` (gear) · `Assets/world/props/misc/spyglass.glb` · spyglass; `telescope` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_telescope_0917035520_texture.glb` · MISC
- `porthole` · §8 · CODE-BUILT

## Village + farm
- `campfire` · Survival PSX · `Assets/world/packs/elbolilloduro/ebd_survival_campfire.glb` · WIRED (+ MISC)
- `camping_tent` · Survival PSX · `Assets/world/packs/elbolilloduro/ebd_survival_camping_tent.glb` · modern tent (weak) · WIRED
- `cave_torch` · Meshy decor · `Assets/world/props/meshy_decor/cave_torch.glb` · standing / cave torch · DECOR (proc `cave_torch`)
- `wall_torch_bracket` · Meshy decor · `Assets/world/props/meshy_decor/wall_torch_bracket.glb` · wall torch · DECOR (proc `wall_torch`)
- `tiki_torch` · §8 · tiki torch · CODE-BUILT (no model)
- `ancient_well` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_an_ancient_well_0922010024_texture.glb` · stone well · MISC
- `wooden_bucket` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_wooden_bucket_0922011434_texture.glb` · wooden bucket (well, bath house) · MISC
- `covered_wagon` · Meshy, Desert · `Assets/world/props/meshy/covered_wagon.glb` · wagon (western; weak) · WIRED
- `hitching_rail` · Meshy, Desert · `Assets/world/props/meshy/hitching_rail.glb` · wooden horse rail · WIRED
- `hand_truck` · Meshy, Hero Plaza · `Assets/world/props/meshy/hand_truck.glb` · modern; skip unless needed · WIRED
- `ebd_house_broom` (proc wear `broom`) · House (Elbolilloduro) · `Assets/world/packs/elbolilloduro/ebd_house_broom.glb` · broom · WIRED
- `pitchfork` · §7f unit gear · `Assets/characters/gear/held/pitchfork.glb` · pitchfork (held gear; farm tool) · R2 file named by sprites.js
- `Shovel` · §7e halloween.fbx node · shovel
- `stocks` · Meshy decor · `Assets/world/props/meshy_decor/stocks.glb` · wooden stocks (castle town square) · DECOR
- `notice_board` · Meshy decor · `Assets/world/props/meshy_decor/notice_board.glb` · wooden notice board (town edict board) · DECOR
- `missing_board` · Meshy, Woods horror · `Assets/world/props/meshy/missing_board.glb` · wooden board with notices · WIRED
- `windpump_tower` + `windpump_wheel` · Meshy decor · `Assets/world/props/meshy_decor/windpump_tower.glb`, `windpump_wheel.glb` · farm wind pump (western; weak) · DECOR files
- `fountain` · Meshy decor · `Assets/world/props/meshy_decor/fountain.glb` · stone fountain · DECOR
- `stone_altar` · Meshy decor · `Assets/world/props/meshy_decor/stone_altar.glb` · stone altar (shrine) · DECOR
- `stone_urn` · Meshy, Financial · `Assets/world/props/meshy/stone_urn.glb` · stone urn (garden) · WIRED
- `greek_amphora` · Meshy, Sports + Culture · `Assets/world/props/meshy/greek_amphora.glb` · clay jar (sake / storage jar stand-in) · WIRED
- `owl_statue` · Meshy, Woods horror · `Assets/world/props/meshy/owl_statue.glb` · stone owl statue · WIRED
- `lion_statue` · Farm / zoo animals · `Assets/world/animals/PSX_lion.glb` · a lion as a statue (komainu stand-in) · WIRED
- `effigy_figure`, `effigy_bier` · Meshy decor · `Assets/world/props/meshy_decor/effigy_figure.glb`, `effigy_bier.glb` · straw / ritual effigy (festival, scarecrow stand-in) · DECOR files
- `psxg_tombstone_1`, `psxg_tombstone_2`, `psxg_tombstone_3`, `psxg_dirt_grave`, `psxg_coffin` · PSX Halloween Graveyard · cemetery pieces (temple graveyard) · WIRED
- `psxg_jack_o_lantern_1`, `psxg_jack_o_lantern_2` · same · carved pumpkins (weak) · WIRED
- `popcorn_cart` · Meshy decor · `Assets/world/props/meshy_decor/popcorn_cart.glb` · cart stall (festival, modern look) · DECOR
- `hot_dog_stand` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_hot_dog_stand_0922010432_texture.glb` · food stall (modern) · MISC
- `city_taco_stand` · Elbolilloduro city_* · `Assets/world/packs/elbolilloduro/ebd_tacos_city_taco_stand.glb` · street food stand building (modern) · WIRED
- `fortune_teller_tent` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_fortune_teller_tent_0922010255_texture.glb` · cloth tent (festival; proc `fortune_tent`) · MISC
- `carnival_tent` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_carnival_tent_0922010243_texture.glb` · striped tent (festival; weak) · MISC
- `festoon` · §8 · string of festival lights / flags · CODE-BUILT
- `sale_banner` · §8 · banner · CODE-BUILT
- `trap_hole`, `trap_hole_dart`, `trap_hole_spear`, `trap_spike_pit`, `trap_pressure_plate`, `trap_trip_wire`, `trap_trip_wire_broken`, `trap_bear_base`, `trap_bear_jaw` · Traps pack · `Assets/world/packs/traps/...` · ninja-house / jungle traps · WIRED
- `trap_chain_draped`, `trap_chain_straight`, `wall_chains` · Traps pack · chains · WIRED
- `pd_lever` · Meshy, plot dungeons · `Assets/world/props/meshy/pd_lever.glb` · lever (castle gate, secret door) · WIRED

## Interiors + furniture
- `candelabra` · Meshy, Southside pass 2 · `Assets/world/props/meshy/candelabra.glb` · WIRED
- `candle`, `candleLine`, `candleRing` · spell props · `Assets/fx/spell_props/Meshy_AI_single_lit_candle_realistic_0725065958_texture.glb`, `...line_of_lit_candles_realisti_0725065822_texture.glb`, `...lit_candles_ritual_circle__0725065829_texture.glb` · candles (proc `candle_ring` wears `candle`) · SPELL
- `railway_lantern` · Meshy, Industrial pass 2 · `Assets/world/props/meshy/railway_lantern.glb` · hand lantern · WIRED
- `mushroom_lamp` · Meshy decor · `Assets/world/props/meshy_decor/mushroom_lamp.glb` · low glowing lamp (garden light) · DECOR
- `round_table` · Meshy decor · `Assets/world/props/meshy_decor/round_table.glb` · round wooden table · DECOR
- `rocking_chair` · Meshy decor · `Assets/world/props/meshy_decor/rocking_chair.glb` · wooden chair (weak) · DECOR
- `map_table` · Meshy, Financial · `Assets/world/props/meshy/map_table.glb` · war-room map table (castle keep) · WIRED
- `gallery_ottoman` · Meshy, Sports + Culture · `Assets/world/props/meshy/gallery_ottoman.glb` · low seat / cushion bench · WIRED
- `key_rack` · Meshy, Financial · `Assets/world/props/meshy/key_rack.glb` · key rack (inn front desk) · WIRED
- `concierge_podium` · Meshy, Financial · `Assets/world/props/meshy/concierge_podium.glb` · wooden desk podium (inn / theatre) · WIRED
- `specimen_shelf` · Meshy, University pass 2 · `Assets/world/props/meshy/specimen_shelf.glb` · shelf of jars (apothecary) · WIRED
- `ebd_house_wall_shelf` (wear `wall_shelf`) · House · `Assets/world/packs/elbolilloduro/ebd_house_wall_shelf.glb` · wall shelf · WIRED
- `library_shelf` · _MISC_GLB · `Assets/world/packs/pizzadoggy_psx_mega_pack/furniture/shelf_mp_4.glb` · bookshelf · MISC; `library_shelf_full` · `Assets/world/props/meshy/Meshy_AI_library_shelf_full_of_books_0917035645_texture.glb` · MISC
- `lib_book`, `lib_open_book` · _MISC_GLB · `.../small_props/book_mp_3.glb`, `open_book_mp_1.glb` · books · MISC
- `card_catalogue` · Meshy decor · `Assets/world/props/meshy_decor/card_catalogue.glb` · many-drawer wooden cabinet (reads as an apothecary / tansu chest) · DECOR
- `tool_chest` · Meshy, Southside pass 2 · `Assets/world/props/meshy/tool_chest.glb` · modern; skip unless wooden
- `bird_cage` · Meshy, Financial · `Assets/world/props/meshy/bird_cage.glb` · bird cage (tea house, market) · WIRED
- `painting_landscape`, `painting_seascape`, `painting_portrait` · Meshy, Sports + Culture · `Assets/world/props/meshy/painting_landscape.glb` etc. · framed paintings (western frames; weak) · WIRED
- `museum_vitrine`, `jewelry_case` · Meshy · `Assets/world/props/meshy/museum_vitrine.glb`, `jewelry_case.glb` · glass cases (modern; weak) · WIRED
- `arms_trophy` · Meshy, Sports + Culture · `Assets/world/props/meshy/arms_trophy.glb` · crossed weapons wall trophy (castle hall) · WIRED
- `marble_bust` · Meshy, Financial · `Assets/world/props/meshy/marble_bust.glb` · western bust (weak) · WIRED
- `holy_carpet` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_ornate_holy_carpet_0917035624_texture.glb` · ornate carpet (keep, temple) · MISC
- `royal_throne` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_royal_throne_0917035803_texture.glb` · throne (western) · MISC
- `royal_bed` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_royal_bed_0922010438_texture.glb` · western bed (weak) · MISC
- `couples_bed`, `dorm_bed` · _MISC_GLB · `.../pizzadoggy_psx_mega_pack/furniture/bed_4.glb`, `bed_5.glb` · beds (no futon exists) · MISC
- `chess_board`, `chess_set_game` · Low Poly Chess Set · `Assets/world/packs/chess/Low Poly Chess Set.fbx#Low_Poly_Chessboard` (+ pieces) · board game (go / shogi stand-in) · WIRED
- `music_box` · Meshy decor · `Assets/world/props/meshy_decor/music_box.glb` · DECOR (weak)
- `shag_rug`, `doormat` · §8 · rug / mat (tatami stand-in only by retexture) · CODE-BUILT
- `wall_plaques`, `motto_plaque`, `lesson_plaque` · §8 · wall plaques (dojo creed boards) · CODE-BUILT
- `ritual_circle` · §8 · CODE-BUILT
- Bath house: `wooden_bucket` (above), `mop` · House · `Assets/world/packs/elbolilloduro/ebd_house_mop.glb` · WIRED; `lap_pool`, `infinity_pool` · §8 · pools (onsen basin stand-in) · CODE-BUILT; `boiler` · Meshy decor · `Assets/world/props/meshy_decor/boiler.glb` · bath-house boiler (industrial look) · DECOR
- Theatre: `rope_stanchion` · Meshy, University pass 2 · `Assets/world/props/meshy/rope_stanchion.glb` · WIRED; `ticket_booth` · Meshy decor · `Assets/world/props/meshy_decor/ticket_booth.glb` · DECOR

## Food + kitchen
- `stock_pots` · Meshy, Southside pass 2 · `Assets/world/props/meshy/stock_pots.glb` · big cooking pots (ramen shop) · WIRED
- `steam_table` · Meshy, Southside pass 2 · `Assets/world/props/meshy/steam_table.glb` · steam table (modern steel; weak) · WIRED
- `pot_rack` · Meshy decor · `Assets/world/props/meshy_decor/pot_rack.glb` · hanging pots · DECOR
- `cauldron` · spell prop · `Assets/fx/spell_props/Meshy_AI_black_cauldron_0713025916_texture.glb` · black iron cauldron (hearth pot) · SPELL
- `teapot`, `teacups` · see Japanese pieces · MISC
- `cup` (held) · spell prop · `Assets/world/props/misc/drinking_cup.glb` · drinking cup (sake cup) · SPELL
- `potionFlask` (held) · spell prop · `Assets/world/props/misc/potion_flask.glb` · flask (sake bottle stand-in) · SPELL
- `tongs` · spell prop · `Assets/world/props/meshy/Meshy_AI_tongs_1027232138_texture.glb` · tongs (forge / kitchen) · SPELL
- `meat_hook` · Meshy decor · `Assets/world/props/meshy_decor/meat_hook.glb` · hook (fish market) · DECOR
- `platform_scale` · Meshy, Industrial pass 2 · `Assets/world/props/meshy/platform_scale.glb` · market weighing scale (industrial) · WIRED
- `heartScales` / `item_heart_scales` · `Assets/world/props/misc/heart_scales.glb` · balance scales (merchant) · WIRED as `item_heart_scales`
- `serving_line` · §8 · CODE-BUILT
- No sushi, ramen, noodles, rice, sake or bento model in this part.

## Weapons
- `sword` · spell prop · `Assets/fx/spell_props/Meshy_AI_master_sword_0713025949_texture.glb` · straight "master sword" (not a katana; proc `sword_stone` wears it) · SPELL
- `spear` · Spear (mondo's upload, FBX) · `Assets/fx/spell_props/spear/Spear.fbx` · spear (yari stand-in) · WIRED
- `shield` · spell prop · `Assets/fx/spell_props/Meshy_AI_shield_1027232025_texture.glb` · SPELL
- `arrow` · spell prop · `Assets/fx/spell_props/Meshy_AI_arrow_0713025846_texture.glb` · arrow (no bow exists) · SPELL
- `throwingKnife` · spell prop · `Assets/fx/spell_props/Meshy_AI_throwing_knife_1027232048_texture.glb` · throwing knife (kunai stand-in) · SPELL
- `blowpipe` (held) · spell prop · `Assets/world/props/misc/blowpipe.glb` · blowpipe (ninja) · SPELL
- `staff` (held) · spell prop · `Assets/world/props/misc/wizard_staff.glb` · staff (monk bo stand-in) · SPELL
- `whip` (held) · `Assets/world/props/misc/bullwhip_rigged.glb` · SPELL (weak)
- `grapnel_gauntlet` · worn gear · `Assets/world/props/misc/grapple_gauntlet.glb` · grapple (ninja) · gear
- `dojo_weapon_rack`, `arms_trophy`, `armour_stand` · see above
- `punching_bag`, `speed_bag`, `boxing_gloves`, `boxing_ring` · Meshy, Southside pass 2 · `Assets/world/props/meshy/punching_bag.glb` etc. · modern boxing gear (dojo only at a stretch) · WIRED
- `trap_iron_maiden_body` etc. · Traps pack · western torture (skip)

## Animals + units
(§7c `_ANIMALS` keys; the same files are WIRED catalogue keys in §6)
- `horse`, `horse_black`, `horse_brown` · Horse pack · `Assets/world/animals/horses/Horse_glb.glb` · horse (samurai mounts, stables) · WIRED
- `cow` · Farm / zoo animals · `Assets/world/animals/Cow.glb` · cow (ox stand-in for the paddies) · WIRED
- `chicken` · `Assets/world/animals/chichen.glb` · WIRED
- `cat` · `Assets/world/animals/cat.glb` · WIRED
- `dog` · `Assets/world/animals/dog.glb` · WIRED
- `wolf` · `Assets/world/animals/Wolf1.glb` · wolf (woods; fox stand-in) · WIRED
- `rabbit` · Crow + rabbit · `Assets/world/animals/crow_and_rabbit/rabbit.glb` · WIRED
- `crow` · Crow + rabbit · `Assets/world/animals/crow_and_rabbit/crow.glb` · WIRED
- `eagle` · rigged by Claude (5 clips) · `Assets/world/animals/eagle_rigged.glb` · eagle / hawk · WIRED
- `elephant` · `Assets/world/animals/elephant/elephant-3d.fbx` · jungle big beast · WIRED
- `lion` · `Assets/world/animals/PSX_lion.glb` · jungle predator · WIRED
- `giraffe` · `Assets/world/animals/girafe.glb` · long-neck beast (off-theme; sauropod stand-in at best) · WIRED
- `butterfly` · `Assets/world/animals/butterfly.glb` · WIRED
- `ladybug` · `Assets/world/animals/ladybug.glb` · WIRED
- Insects pack (`Assets/world/animals/insects/`), all WIRED: `monarch` (Butterfly_Monarch.glb), `swallowtail` (Butterfly_Swallowtail.glb), `blue_morpho` (Butterfly_Blue_Morpho.glb), `luna_moth` (Moth_Luna.glb), `hawk_moth` (Moth_Hawk_Moth.glb), `moth_frames` (Moth_Wing_Flap_Frames.glb), `caterpillar_bug` (Butterfly_Caterpillar.glb; `_ANIMALS` key `caterpillar`), `grasshopper` (Grasshopper_Green.glb), `grasshopper_brown`, `grasshopper_jump`, `bee` (Bee_Honeybee.glb), `bumblebee`, `carpenter_bee`, `bee_frames`, `ant` (Ant_Worker.glb), `ant_leaf` (Ant_Carrying_Leaf.glb), `ant_queen`
- `bat_black`, `bat_brown`, `bat_grey` · Bats (OBJ) · `Assets/world/animals/bats/bat_black.obj` etc. · bats (volcano caves; the bat_ procs) · `_ANIMALS` keys
- `frog` · spell prop · `Assets/world/props/meshy/Meshy_AI_frog_1027232151_texture.glb` · frog (pond) · SPELL
- `sheep` · spell prop · `Assets/world/props/meshy_decor/sheep.glb` · SPELL
- `flamingo` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_a_flamingo_0912231434_texture.glb` · wading bird (crane stand-in, pink) · MISC
- `shark` · MISC (see harbour)
- `dinosaur_skeleton` · Meshy, University pass 2 · `Assets/world/props/meshy/dinosaur_skeleton.glb` · mounted dinosaur skeleton (jungle boneyard) · WIRED
- `anatomy_skeleton` · Meshy, University pass 2 · `Assets/world/props/meshy/anatomy_skeleton.glb` · human skeleton · WIRED
- `skull` · spell prop · `Assets/fx/spell_props/Meshy_AI_skull_realistic_0725070330_texture.glb` · SPELL
- `femur`, `ulna` · spell props · `Assets/fx/spell_props/Meshy_AI_femur_bone_realistic_0725070208_texture.glb`, `...ulna_bone_realistic_0725070052_texture.glb` · bones (jungle) · SPELL
- `skull_pile` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_skull_pile_0917035243_texture.glb` · MISC
- `spell_top_fangs` (`fangs`) · `Assets/world/animals/top_fangs.glb` · big fangs (dinosaur jaw / bone dressing) · WIRED
- `spell_one_dragon_wing` · Meshy single wing · `Assets/characters/gear/wings/Meshy_AI_one_dragon_wing_1027074659_texture.glb` · dragon wing (statue dressing) · WIRED
- `feathered_serpent` · §7f · `Assets/characters/races/aztec/feathered_serpent.glb` · Quetzalcoatl's serpent body (the nearest thing to an eastern dragon) · R2 file named by three-renderer.js
- `demon_statue` · _MISC_GLB · `Assets/world/props/meshy/Meshy_AI_demon_statue_0917040101_texture.glb` · demon statue (oni stand-in at a temple gate) · MISC
- `angel_statue` · _MISC_GLB · western (skip)
- No unit / race rows are in this part (races are in other sections).

## Textures + decals
- None listed in this part.

## Sky + horizon + monuments (§7b `_MISC_GLB`)
- `moon` · `Assets/world/props/meshy/Meshy_AI_moon_realistic_0727195427_texture.glb` · the moon (big moon over the castle) · MISC
- `star` · `Assets/world/props/meshy/Meshy_AI_star_realistic_0727195402_texture.glb` · MISC
- `white_cloud` · cloud · MISC
- `palmisle` · far islet · MISC
- `wreck` · far wreck · MISC
- `tentacle`, `tentacle2` · sea monster · MISC
- `lighthouse` (decor) · far lighthouse
- `menhir`, `standingstone`, `trilithon`, `obelisk3d` (`Assets/world/props/meshy/Meshy_AI_obelisk_0727195707_texture.glb`) · stone monuments · MISC
- `Pyramid` · §7f · `Assets/world/props/meshy/Pyramid/Pyramid.glb` · pyramid (off-theme)
- No volcano, Mt Fuji, pagoda or torii horizon model in this part (§8b, the horizon builders, starts at line 3645, outside this part).

## Other (generic, usable anywhere)
- `handMirror` (held) · spell prop · `Assets/world/props/misc/hand_mirror.glb` · hand mirror (shrine mirror / geisha room) · SPELL
- `tarot`, `tarot2`, `tarotDeck` · spell props · cards (fortune slips stand-in; weak) · SPELL
- `crystalBall` · spell prop · `Assets/fx/spell_props/Meshy_AI_crystal_ball_0713025648_texture.glb` · SPELL
- `hagstone` · worn gear · `Assets/world/props/misc/hagstone.glb` · holed stone charm · gear
- `dowsing_rod` · worn gear · `Assets/world/props/misc/dowsing_rod.glb` · gear
- `trap_coffin_wood`, `trap_coffin_lid` · Traps pack · wooden coffin · WIRED
- `sarcophagus` · _MISC_GLB · stone coffin (tomb under the castle) · MISC
- `tomb_plaque` · Meshy · `Assets/world/props/meshy/tomb_plaque.glb` · stone plaque · WIRED
- `floating_orb`, `thoughtform` · §8 · spirit lights (hitodama stand-in) · CODE-BUILT

---

## Reader 5

# Part 5: MODEL_LIST.md lines 3645-4396 (sections 8b, 9, 10, 11, 12, 12b, 13), the Katana Island shortlist

Read end to end (all 752 lines, the long section 13 rows included: creator wear 477 files, the four `Assets/opt` rows 1054 + 436 + 540 + 35 files, the wish list 246 files).

## The top of it

1. **Best find, section 13 `Assets/world/props/meshy/wishlist` (246 files):** `stone_lantern`, `gong`, `prayer_flags`, `rope_bridge`, `thatched_hut`, `market_stall`, `drying_fish`, `fish_boxes`, `dugout_canoe`, `dock_boat`, `trawler`, `raft`, `oars`, `fishing_rod`, `willow_tree`, `reeds`, `banana_plant`, `tropical_bush`, `hot_tub`, `stepping_stones`, `heron`, `deer`, `fox`, `swan` and many more farm / harbour / animal pieces.
2. **Second find, section 13 `Assets/world/props/meshy`:** `dojo_weapon_rack`, `taiko_drum`, `wing_chun_dummy`, `punching_bag`, `candelabra`, `votive_stand`, `stock_pots` (a dojo and a temple are already half furnished).
3. **IMPORTANT, about "R2 ONLY" in section 13:** section 13 calls the wish list and the `props/meshy` files "on R2, the game does not load it", but what it lists are the `.opt.glb` COPIES. I checked data.js: all 246 wish list names are catalogue rows already (`wishlist/<name>.glb`, key = the file name without `.opt.glb`; `stone_lantern`, `gong`, `taiko_drum` are placed in rooms today), and so are the 16 `props/meshy` names I tried. So they are WIRED, placeable today. The three `Assets/opt` rows marked "optimised copy the game loads in place of the original" are also copies of wired models.
4. **Truly R2 only (no catalogue row, per the list):** the MakeHuman creator clothes `mhw_mindfront_kimono.glb`, `mhw_mindfront_f_ninja.glb`, two qipao, a tunic with sash, monk robes, a wooden bow, a short bow, a sword, a dagger, `mh_learning_anime_hair.glb`, `mh_o4saken_chinesebob01.glb` (clothes for island NPCs; sprites.js does name them, so they may already be wardrobe picks: check there). Also `Assets/world/packs/stairs/stairs.glb` + `stairs_railings.glb`, eleven wooden door GLBs in `Assets/opt`, `tree_rt_2/3/4.glb`, 45 Quaternius trees as FBX / .blend (Birch, Pine, Tree, DeadTree), the horse pack sources.
5. **Section 10 (DECOR STILL MISSING) lists NOTHING Japanese as missing.** No torii, pagoda, shoji, tatami, lantern or katana is on any wish row. The only nearby items: G05 bow ("no pack bow found", still needs a model), `planter` D17 (still code), `pool_umbrella` D37 (still code), and the removed far mountain range ("Wanted: a real far mountain range model", useful for a Fuji-like volcano weenie).
6. **Section 8b (horizon / sky / monuments):** nothing Japanese. Reusable: `castle` / `skycastle` landmarks (European castle pack), `_hzLighthouse`, `_hzPalmIsleFar`, `_hzSeaStack`, `_hzGhostShip`, `_hzSharkFar`, `_hzKrakenFar`, `whale`, `waterspout`, `_hzLenticular` cloud, `brazier`, `flag`, `stairway`, near setting `bermuda` (palms + chest), `revenge` (anchor, cannon, rowboat, lantern).
7. **Section 12b (PSX Mega Pack, 584 GLBs, all WIRED as `psx_<file>`):** neutral wooden furniture (beds, low coffee tables, shelves, wardrobes, wooden chairs), wall / doorway / window / stairs / pillar / beam / floor-ceiling modules (4 m x 3 m, western look), wooden crates, barrels, `sword_mp_1`, knives, planter pots, plates and cutlery, paper-ish table lamps.
8. **Section 9:** `29_katana-back-sheath` (worn, WIRED as `ewm_katana`), `17_straw-hat` (`ewm_strawhat`), `25_quiver`, armour pieces, `30_trident`.

**What a Japanese island needs that this part does NOT have:** torii gate, pagoda / temple hall, castle keep (tenshu) and Japanese castle walls / gates, curved tile roofs and any roof piece at all, shoji / fusuma / tatami / folding screens, paper lanterns (only a stone one and a hanging ship lantern), cherry / sakura, bamboo, maple, bonsai, koi, crane (bird), fox / lion-dog / buddha statues, katana as a prop (only worn), spear / naginata / bow as a prop, armour stand in samurai style (only a knight one), futon, low table + cushions, tea set in Japanese style, sake, sushi / ramen / rice bowls, rice paddy / rice plants, water wheel, arched bridge, onsen pieces (only `hot_tub`), festival stalls / banners in Japanese style, a volcano or mountain for the horizon, lava rock, dinosaur eggs / nests (one dinosaur race and a dinosaur skeleton exist, no other dinosaurs), ninja / samurai units (none in this part; `swordfighter` and `ki fighter` races are the nearest).

---

## Japanese pieces

- `stone_lantern` · §13 `Assets/world/props/meshy/wishlist/stone_lantern.opt.glb` (Meshy wish list, 11-16) · a stone lantern · WIRED (data.js row, file `Assets/world/props/meshy/wishlist/stone_lantern.glb`; placed in rooms)
- `gong` · §13 `Assets/world/props/meshy/wishlist/gong.opt.glb` · a gong · WIRED
- `prayer_flags` · §13 `Assets/world/props/meshy/wishlist/prayer_flags.opt.glb` · a line of prayer flags · WIRED
- `taiko_drum` · §13 `Assets/world/props/meshy/taiko_drum.opt.glb` (Meshy, Disaster City interiors pass 2) · a taiko drum · WIRED (`Assets/world/props/meshy/taiko_drum.glb`)
- `dojo_weapon_rack` · §13 `Assets/world/props/meshy/dojo_weapon_rack.opt.glb` · a dojo weapon rack · WIRED
- `wing_chun_dummy` · §13 `Assets/world/props/meshy/wing_chun_dummy.opt.glb` · wooden training dummy · WIRED
- `punching_bag` · §13 `Assets/world/props/meshy/punching_bag.opt.glb` · dojo / gym · WIRED
- `bell_frame` · §13 `Assets/world/props/meshy/wishlist/bell_frame.opt.glb` · a bell in a frame (temple bell stand-in) · WIRED
- `oil_lamp` · §13 wishlist `oil_lamp.opt.glb` · WIRED
- `lantern_post` · §13 wishlist `lantern_post.opt.glb` · a lantern on a post · WIRED
- `golden_idol` · §13 wishlist `golden_idol.opt.glb` · small idol (shrine offering) · WIRED
- `cat_statue` · §13 wishlist `cat_statue.opt.glb` · a cat statue (Egyptian make; could pass as a shrine cat) · WIRED
- `hooded_statue`, `god_statue` · §13 wishlist · statues, not Japanese · WIRED
- `owl_statue` · §13 `Assets/world/props/meshy/owl_statue.opt.glb` · WIRED
- `votive_stand` · §13 `Assets/world/props/meshy/votive_stand.opt.glb` · a stand of votive candles (temple) · WIRED
- `candelabra` · §13 `Assets/world/props/meshy/candelabra.opt.glb` · WIRED
- `tripod_bowl` · §13 wishlist `tripod_bowl.opt.glb` · a bowl on a tripod (incense / fire bowl) · WIRED
- `censer` (monument) · §8b-E, `Assets/world/props/misc/censer.glb` · incense censer with a glow · model, builder `_hzCenser`
- `brazier` (monument) · §8b-E, wears `cave_torch` (Meshy) + glow · builder `_hzBrazier`
- `Assets/opt/Meshy_AI_brazier_0917035429_texture.opt.glb` · §13 opt copy · a brazier · copy of a wired Meshy model
- `29_katana-back-sheath` · §9 Meshy pieces 11-03 · a katana in a back sheath, WORN gear, creator piece `ewm_katana` (`Assets/opt/ewm_katana.opt.glb` in §13) · WIRED (creator wear, not a room prop)
- `17_straw-hat` · §9 · floppy straw hat, creator piece `ewm_strawhat` (`Assets/opt/ewm_strawhat.opt.glb`) · WIRED (creator wear)
- `Assets/opt/ewb_gi.opt.glb`, `Assets/opt/ewb_gi_open.opt.glb` · §13 opt copies · a martial arts gi, creator clothes · WIRED (creator wear)
- `Assets/opt/ewm_t2swordfighter_outfit.opt.glb`, `Assets/opt/ewm_t2kifighter_outfit.opt.glb` · §13 opt copies · the swordfighter and ki fighter outfits as creator pieces · WIRED (creator wear)
- `Assets/characters/creator/wear/mhw_mindfront_kimono.glb` · §13, MakeHuman asset packs · 163.7 MB for the folder's 477 · a kimono · R2 ONLY per the list (sprites.js names it: check the wardrobe)
- `Assets/characters/creator/wear/mhw_mindfront_f_ninja.glb` · §13 · a female ninja suit · R2 ONLY per the list
- `Assets/characters/creator/wear/mhw_punkduck_middle_length_qipao.glb`, `mhw_elvs_fashion_stylized_qipoa.glb` · §13 · qipao dresses (East Asian town NPCs) · R2 ONLY per the list
- `Assets/characters/creator/wear/mhw_drednicolson_asymmetric_tunic_and_sash.glb` · §13 · tunic with a sash · R2 ONLY per the list
- `Assets/characters/creator/wear/mhw_donitz_monk_robe.glb`, `mhw_donitz_monk_robe_hood.glb`, `mhw_donitz_monk_robe_hood_down.glb`, `mhw_donitz_monk_robe_hood_off.glb` · §13 · monk robes (temple monks) · R2 ONLY per the list
- `Assets/characters/creator/wear/mhw_toigo_harem_pants.glb`, `mhw_dressupdoc_sandals1.glb`, `mhw_elvs_caesar_sandals1.glb`, `mhw_toigo_mj_cloth_shoes.glb`, `mhw_punkduck_kill_bill_shoes.glb`, `mhw_mindfront_fishing_hat_01.glb`, `mhw_green_tomato_rei_ayanami.glb`, `mhw_green_tomato_yoko_tsuno.glb` · §13 · loose trousers, sandals, cloth shoes, fishing hat, two anime outfits · R2 ONLY per the list
- `Assets/characters/creator/hair/mh/mh_learning_anime_hair.glb`, `mh_o4saken_chinesebob01.glb`, `mh_elvs_braid_bun.glb`, `mh_rehmanpolanski_hair_bun_brown.glb`, `mh_ponytail01.glb` · §13 MakeHuman hair, 95.1 MB for the folder's 70 · anime hair, bob, buns, ponytail · R2 ONLY per the list
- `Assets/characters/races/kaiju/male/Meshy_AI_retro_1990_s_japan_cy_biped_Character_output.glb` · §13 · a "retro 1990s japan cy…" rigged character sitting in the kaiju folder (77.1 MB with the kaiju) · R2 ONLY (the game does not load it)

## Buildings + kit pieces

- `thatched_hut` · §13 wishlist `thatched_hut.opt.glb` · a thatched hut · WIRED
- `lean_to` · §13 wishlist · a lean-to shelter · WIRED
- `outhouse` · §13 wishlist · WIRED
- `woods_cabin` · §13 `Assets/world/props/meshy/woods_cabin.opt.glb` · a wooden cabin · WIRED
- `market_stall` · §13 wishlist · a market stall · WIRED
- `medieval_pavilion` · §13 wishlist · a cloth pavilion (festival) · WIRED
- `canvas_tent` · §13 wishlist · WIRED
- `timber_gate`, `braced_gate`, `garden_gate`, `fence_with_gate` · §13 wishlist · wooden gates / fence · WIRED
- `timber_lookout` · §13 wishlist · a wooden watch tower · WIRED
- `windbreak` · §13 wishlist · WIRED
- `rope_bridge` · §13 wishlist · a rope bridge (jungle / volcano gorge) · WIRED
- `stepping_stones` · §13 wishlist · garden path stones · WIRED
- `Assets/opt/Meshy_AI_a_plank_footbridge_0916235844_texture.opt.glb` · §13 opt copy · a plank footbridge · copy of a wired Meshy model
- `Assets/opt/Meshy_AI_ancient_walkway_0917035609_texture.opt.glb` · §13 opt copy · a stone walkway · copy of a wired model
- `Assets/opt/Meshy_AI_an_ancient_well_0922010024_texture.opt.glb` · §13 opt copy · a stone well · copy of a wired model
- `Assets/opt/Meshy_AI_a_culvert_mouth_0916235929_texture.opt.glb` · §13 opt copy · a stone culvert mouth (paddy drains) · copy of a wired model
- `Assets/opt/Meshy_AI_a_portcullis_0903105915_texture.opt.glb` · §13 opt copy · a castle portcullis · copy of a wired model
- `Assets/opt/Castles_and_Forts.opt.glb` · §13 opt copy · the McSteeg castle pack (walls, gates, towers; European) · copy of a wired pack
- `castle`, `skycastle` (room landmarks) · §8b-D · made of `Assets/misc/Castles_and_Forts.glb` pieces (Wall_2x4, Wall_2x2, Gate_2x4, Tower_Mid, Tower_Doorway, Tower_top_1, Roof_Cone, §11 row 1) · a far castle, European
- `castle_wall` (monument) · §8b-E / §11 row 11 · CODE-BUILT (Box), 1 square wide, 2 high, the spell wall
- `Assets/world/packs/stairs/stairs.glb`, `Assets/world/packs/stairs/stairs_railings.glb` · §13, Stairs & Railings · ATD-London · CC-BY 4.0 (credit required) · 32.0 MB · "on R2, the game does not load it" · R2 ONLY (opt copies `Assets/opt/stairs.opt.glb`, `Assets/opt/stairs_railings.opt.glb`)
- `Assets/opt/Wooden_Door.opt.glb`, `BEIGE_WOODEN_DOOR.opt.glb`, `WHITE_WOODEN_DOOR.opt.glb`, `Coffee_door.opt.glb`, `ENTRANCE_DOOR.opt.glb`, `DOOR_WITH_LARGE_WINDOW.opt.glb`, `DOOR_WITH_MEDIUM_WINDOW.opt.glb`, `BIRCH_DOOR_WITH_GLASS_IN_THE_MIDDLE.opt.glb`, `ORANGE_DOOR_WITH_GLASS_IN_THE_MIDDLE.opt.glb` · §13 `Assets/opt` row 3 ("its original is not in the tables above") · wooden door leaves · R2 ONLY per the list
- `Assets/opt/Meshy_AI_a_barn_door_0904015200_texture.opt.glb`, `Meshy_AI_a_stable_door_0904015237_texture.opt.glb`, `Meshy_AI_a_shabby_wooden_door_0903105805_texture.opt.glb` · §13 opt copies · wooden door leaves · copies of wired Meshy doors
- PSX Mega Pack `modular_structures` · §12b · 108 files, 77.2 MB · walls (plain / half / rounded corners), arches, doorways, loose doors, windows (glass / frame only / no glass / metal bars), floor-ceiling tiles, pillars, beams, catwalk, stairs (4 kinds, `stairs_5_wood` among them) · a wall module is 4 m wide x 3 m tall, a door 1 m · WIRED, keys `psx_<file>` (e.g. `psx_wall_1_plain`, `psx_stairs_5_wood`, `psx_pillar_1`, `psx_beam_1`, `psx_floor_ceiling_1`, `psx_window_1_single_frame_only`), path `Assets/world/packs/pizzadoggy_psx_mega_pack/modular_structures/<file>.glb`. Licence: NO AI use of these models or their pictures, files never in the repo.
- `stairway` (landmark / monument) · §8b-D, §8b-E · CODE-BUILT (Box, one-square treads) · shrine steps stand-in
- `gate` (landmark) · §8b-D · CODE-BUILT (Box, glow sprites)
- `tower` (landmark) · §8b-D · CODE-BUILT (Box, Cylinder)
- `arch` / `gateway` (monument) · §8b-E · Meshy `stone_arch` (`stone_arch.glb`, a curved stone arch)
- `fountain` D23 · §10A · a tiered stone park fountain, 16000 tris · WIRED (wears Meshy decor)
- `stone_altar` D18 · §10A · carved stone altar block · WIRED

## Nature + trees

- `willow_tree` · §13 wishlist `willow_tree.opt.glb` · WIRED
- `cypress_tree`, `olive_tree`, `burnt_tree`, `fallen_redwood` · §13 wishlist · trees (burnt tree for the volcano) · WIRED
- `banana_plant`, `tropical_bush`, `leafy_bush`, `yucca`, `agave` · §13 wishlist · jungle plants / bushes · WIRED
- `reeds`, `moss_clump`, `wild_flowers`, `sunflowers`, `rose_bed`, `coconuts` · §13 wishlist · water's edge and flowers · WIRED
- `lake_rock`, `cairn`, `ore_heap`, `milestone` · §13 wishlist · rocks, a stone cairn, a way stone · WIRED
- `tumbleweed`, `icicles`, `snow_heap`, `ice_block` · §13 wishlist · only if a snow peak is wanted · WIRED
- `Assets/opt/Meshy_AI_a_pine_with_canopy_0916235640_texture.opt.glb` · §13 opt copy · a pine · copy of a wired model
- `Assets/opt/Meshy_AI_a_dead_snag_0916235650_texture.opt.glb`, `Meshy_AI_a_dead_tree_with_a_dark_hole_0916235739_texture.opt.glb`, `Meshy_AI_a_tree_with_a_hole_0916235727_texture.opt.glb` · §13 opt copies · dead and hollow trees · copies of wired models
- `Assets/opt/Meshy_AI_a_fern_0916235806_texture.opt.glb`, `Meshy_AI_palm_tree_0910054114_texture.opt.glb`, `Meshy_AI_a_tiny_island_with_palm_tree_0912231720_texture.opt.glb` · §13 opt copies · fern, palm, palm islet · copies of wired models
- `Assets/opt/ebd_vegetation_fallen_log.opt.glb`, `ebd_vegetation_stump.opt.glb` · §13 opt copies (keys `fallen_log`, `stump`, §10F) · WIRED
- `Assets/opt/tree_rt_1.opt.glb`, `tree_rt_2_1.opt.glb`, `small_tree_rt_1.opt.glb`, `dead_tree_rt_1.opt.glb`, `dead_tree_rt_2.opt.glb` · §13 opt copies, Retro Tree Pack (Pizza Doggy licence, no AI use) · copies of wired trees
- `Assets/world/nature/retrotreepack/GLB/tree_rt_2.glb`, `tree_rt_3.glb`, `tree_rt_4.glb` · §13, Retro Tree Pack · 2.8 MB · "on R2, the game does not load it" · R2 ONLY
- `Assets/world/nature/FBX/Pine_1.fbx` … `Pine_5.fbx`, `Birch_1.fbx` … `Birch_10.fbx`, `Tree_1.fbx` … `Tree_10.fbx`, `DeadTree_1.fbx` … `DeadTree_10.fbx`, `DeadBirch_1.fbx` … `DeadBirch_10.fbx` (and the same 45 as `.blend` in `Assets/world/nature/Blends`) · §13, LowPoly nature · Quaternius · CC0 · 2.2 MB / 27.5 MB · source formats: "the game loads the OBJ" of the same trees · R2 ONLY as files (the trees themselves are in the game)
- `Assets/opt/Meshy_AI_mushroom_0727200342_texture.opt.glb`, `Meshy_AI_mushroom_realistic_0727202046_texture.opt.glb` · §13 opt copies · mushrooms · copies of wired models
- `Assets/opt/Meshy_AI_crystal_shard_1027232226_texture.opt.glb`, `Meshy_AI_crystal_shards_1027232219_texture.opt.glb` · §13 opt copies · crystals (volcano caves) · copies of wired models
- `Assets/opt/Meshy_AI_a_standing_stone_0912231506_texture.opt.glb`, `Meshy_AI_a_standing_stone_0916235906_texture.opt.glb` · §13 opt copies · standing stones · copies of wired models
- `Assets/opt/ew_plant_apple.opt.glb`, `ew_plant_healflower.opt.glb`, `ew_plant_thornvine.opt.glb` · §13 opt copies · game plants · copies of wired models
- `crystal`, `geode`, `menhir`, `mushroom`, `mushroom2`, `fairyring`, `toadstool` (monuments) · §8b-E · model-based board monuments
- `trees (foliage models, §7d)` · used by near settings `bohemian_grove`, `camelot`, `fairy_forest`, `haunted`, `shasta`, `skinwalker`, `strip` · §8b-B · the woods settings as patterns for an island wood
- `planter` D17 · §10A · concrete planter with shrubs · CODE-BUILT ("code, still needs a model", packs checked: none fits)
- `garden_tree` · §10C · "already a Retro Tree Pack tree" · WIRED
- PSX `planter_pot_mp_1_empty`, `planter_pot_mp_1_full`, `potted_cactus_mp_1` · §12b small_props (0.2 m pots) · WIRED as `psx_<file>`

## Harbour + sea

- `trawler`, `tugboat`, `dock_boat`, `dugout_canoe`, `raft` · §13 wishlist · boats (dugout canoe and raft suit a fishing village) · WIRED
- `oars`, `fishing_rod`, `fish_boxes`, `drying_fish`, `rope_coils`, `mooring_bollard`, `torn_sail_mast`, `pirate_flag` · §13 wishlist · harbour dressing · WIRED
- `river_fish`, `seagull`, `heron`, `duck`, `swan` · §13 wishlist · water birds and a fish · WIRED
- `sandcastle`, `beach_towel`, `patio_umbrella`, `coin_telescope` · §13 wishlist · beach bits (modern-ish) · WIRED
- `skiff` D66 · §10A · small wooden sailing skiff, about 5 m, one mast, 16000 tris · WIRED (wears Meshy decor)
- `lighthouse` D67 · §10A · white and red lighthouse, 20000 tris · WIRED; also `_hzLighthouse` far roster (§8b-A, theme sea)
- `sea_buoy` D19 · §10A · red channel buoy · WIRED
- `giant_clam` D79, `anemone` D40, `sea_vent` D50 · §10A · sea floor pieces (`sea_vent` = a black smoker, fits a volcano coast) · WIRED
- `rowboat` · §10F · `ebd_housesonwater_rowboat.glb` (Houses on the water, Elbolilloduro, CC0) · WIRED
- `ship_lantern` (+ the ships' `lantern`) · §10F · `ebd_survival_lantern.glb` (Survival PSX) · a hanging lantern · WIRED (`Assets/opt/ebd_survival_lantern.opt.glb`)
- `kelp`, `coral_brain`, `coral_fan`, `coral_tube` · §10C · swapped to the ocean pack's seaweed / Coral / Coral1 / Coral2 · WIRED
- `fish_school` · §10C · an instanced school of about 40 fish · CODE-BUILT (kept)
- `Assets/opt/Meshy_AI_ship_anchor_0912231033_texture.opt.glb`, `Meshy_AI_a_ship_s_wheel_0912230950_texture.opt.glb`, `Meshy_AI_pirate_treasure_chest_0912231220_texture.opt.glb`, `Meshy_AI_iron_canon_0912231022_texture.opt.glb`, `Meshy_AI_rope_1027232157_texture.opt.glb`, `Meshy_AI_a_ghost_ship_wreck_0912231131_texture.opt.glb`, `Meshy_AI_shark_0912231236_texture.opt.glb`, `Meshy_AI_a_kraken_tentacle_0912231121_texture.opt.glb`, `Meshy_AI_a_kraken_tentacle_2_0912231110_texture.opt.glb` · §13 opt copies · anchor, wheel, chest, cannon, rope, wreck, shark, tentacles · copies of wired Meshy models
- `Assets/opt/Jellyfish_Moon_Jelly.opt.glb`, `Jellyfish_Box_Jelly.opt.glb`, `Jellyfish_Bioluminescent.opt.glb`, `Anglerfish_Jaws_Open.opt.glb` · §13 opt copies · sea creatures · copies of wired models
- `Assets/opt/fish_skeleton_mp_1.opt.glb` · §13 opt copy (PSX pack, `psx_fish_skeleton_mp_1`) · a fish skeleton · WIRED
- Near settings `revenge` (anchor, cannon, chest, lantern, rowboat, tentacles, wheel), `bermuda` (palm_tree, chest), `atlantis` · §8b-B · sea landscapes round a board, model + code
- Missing per §10E (The Deep / Atlantis / The Beach): "treasure pile, brass diver's helmet, open shipwreck section, mooring post" (no stand-in yet; the wish list later made `mooring_bollard`)

## Village + farm

- `hay_bale`, `hay_cart`, `hay_rack`, `hand_cart`, `wheelbarrow`, `plough`, `pitchfork`, `water_trough`, `firewood_stack`, `axe_chopping_block`, `grindstone`, `wooden_barrel`, `wooden_ladder`, `woven_baskets`, `clothes_line`, `beehive`, `kennel`, `saddle`, `grape_trellis`, `corn_row`, `corn_stalk`, `trestle_table`, `picnic_table` · §13 wishlist · farm and yard dressing · WIRED (keys = these names)
- `forge`, `anvil`, `bellows`, `pickaxe`, `mine_cart` · §13 wishlist · a swordsmith's forge · WIRED
- `kettle`, `wood_stove`, `lit_candle`, `fur_rug`, `floor_runner`, `sleeping_bag` · §13 wishlist · hut interiors · WIRED
- `hitching_rail`, `covered_wagon` · §13 `Assets/world/props/meshy/…opt.glb` · WIRED
- `pig`, `goat`, `rooster`, `duck` · §13 wishlist · farm animals · WIRED
- `Assets/opt/Cow.opt.glb`, `Assets/opt/chichen.opt.glb`, `Assets/opt/Horse_glb.opt.glb`, `Assets/opt/dog.opt.glb`, `Assets/opt/cat.opt.glb` · §13 opt copies · cow, chicken, horse, dog, cat · copies of wired models
- `Assets/world/animals/horses/Horse.blend`, `Horse_fbx.fbx` · §13, Horse pack (mondo's upload) · 3.5 MB · source formats · R2 ONLY
- `cave_torch` D02 · §10A · standing wooden torch on three feet with an iron basket, 6000 tris, 71 uses · WIRED
- `wall_torch` D08 · §10A · iron wall sconce with a torch, 4000 tris (`wall_torch_bracket`) · WIRED
- `campfire` · §10F · `ebd_survival_campfire.glb` (Survival PSX) · WIRED; `camping_tent` · `ebd_survival_camping_tent.glb` · WIRED
- `broom` D52 · §10A · straw broom (House pack) · WIRED
- `banner` D24 · §10A · red heraldic banner with a gold lion on a crossbar, 4000 tris · WIRED (wrong emblem for Japan; the shape is right)
- `flag` (monument) · §8b-E · CODE-BUILT (Cylinder, Plane, Sphere)
- `windmill` (monument) · §8b-E · Meshy `windpump_tower` + `windpump_wheel`, the wheel turns
- `Assets/opt/Meshy_AI_wooden_bucket_0922011434_texture.opt.glb`, `Meshy_AI_burlap_sack_1027232243_texture.opt.glb`, `Meshy_AI_a_blank_wooden_signpost_0916235832_texture.opt.glb`, `Meshy_AI_sandbags_1027232011_texture.opt.glb` · §13 opt copies · bucket, sack, signpost, sandbags (rice bags stand-in) · copies of wired models
- G14 wheat heads · §10G · "pack has one: the bus-stop pack `Wheat`" (a wheat sheaf, nearest thing to rice plants)
- §10E dig kit "(wheelbarrow, sieve table, finds tray)" · the wish list made `wheelbarrow`, `sieve_table` since

## Interiors + furniture

- PSX Mega Pack `furniture` · §12b · 151 files, 40.3 MB · beds (`bed_4` wooden double, `bed_5` wooden single), bedside tables, wooden chairs (5 kinds), coffee / dinner / large tables, display cabinets, mattresses (`old_mattress_mp_1`), pillows (`pillow_mp_1`, `pillow_mp_2`), shelves (6 kinds, `shelf_mp_4` = 2.19 m wooden shelf), wardrobe · WIRED, keys `psx_<file>`, path `Assets/world/packs/pizzadoggy_psx_mega_pack/furniture/<file>.glb` (mattress + pillow = the nearest thing to a futon; coffee tables are square low tables)
- PSX `large_props` · §12b · 36 files · `wooden_crate_1` … `wooden_crate_6`, `metal_barrel_mp_0` … `_3`, `supply_crate_1` (full / empty), `carpet_mp_1`, `curtain_rod_mp_1` · WIRED `psx_<file>`
- PSX `lighting` · §12b · 36 files · `lamp_1` … `lamp_5` floor / table lamps, each `_on` + `_off` · WIRED `psx_<file>`
- PSX `small_props` · §12b · 60 files · books, open book, painting, photo frames, plate, fork, spoon, clocks · WIRED `psx_<file>`
- `couples_bed`, `dorm_bed`, `library_shelf` · §12b swap table · now `furniture/bed_4.glb`, `furniture/bed_5.glb`, `furniture/shelf_mp_4.glb` · WIRED
- `wall_shelf` D11 · §10A · wooden wall shelf (House `Shelf_01`) · WIRED
- `rocking_chair` D83, `card_catalogue` D86 (a wall of small wooden drawers: an apothecary / medicine chest look), `pot_rack` D87, `music_box` D84, `umbrella_stand` D46 (brass stand + two closed umbrellas, `umbrella_closed`) · §10A · WIRED
- `round_table` D59 · §10A · a huge round oak table with 12 chairs, 30000 tris · WIRED
- `space_divider` D72 · §10A · a 1960s room divider screen (the only folding-screen-like piece; wrong style) · WIRED
- `hot_tub` · §13 wishlist `hot_tub.opt.glb` · a tub (onsen / bath house stand-in) · WIRED
- `cheval_mirror`, `greek_couch`, `hookah`, `pool_table`, `dartboard`, `beer_taps` · §13 wishlist · inn / tea house extras (loose fits) · WIRED
- `stock_pots` · §13 `Assets/world/props/meshy/stock_pots.opt.glb` · big cooking pots (ramen kitchen) · WIRED; `steam_table` · same folder · WIRED
- `Assets/opt/Meshy_AI_a_royal_bed_0922010438_texture.opt.glb`, `Meshy_AI_a_cot_0903105358_texture.opt.glb`, `Meshy_AI_a_round_rug_0903110327_texture.opt.glb`, `Meshy_AI_ornate_holy_carpet_0917035624_texture.opt.glb`, `Meshy_AI_royal_throne_0917035803_texture.opt.glb`, `Meshy_AI_coat_hook_rail_0910054259_texture.opt.glb`, `Meshy_AI_hook_rail_0910054853_texture.opt.glb`, `Meshy_AI_black_cauldron_0713025916_texture.opt.glb` · §13 opt copies · bed, cot, rugs, throne (daimyo seat stand-in), hook rails, cauldron · copies of wired models
- `Assets/opt/Meshy_AI_single_lit_candle_realistic_0725065958_texture.opt.glb`, `Meshy_AI_line_of_lit_candles_realisti_0725065822_texture.opt.glb`, `Meshy_AI_lit_candles_ritual_circle__0725065829_texture.opt.glb` · §13 opt copies · candles · copies of wired models
- `candle_ring` · §10C · "already wore the spell candle" · WIRED
- `armour_stand` D15 · §10A · a full suit of KNIGHT plate armour on a square oak plinth, 20000 tris (`armour_plinth` + `armour_stand`) · WIRED (European; the plinth alone could carry samurai armour later)
- `trophy_case` D68 · §10A · wooden glass-front cabinet · WIRED

## Food

- `Assets/opt/Meshy_AI_teapot_0912231417_texture.opt.glb`, `Meshy_AI_stacked_teacups_0912231425_texture.opt.glb`, `Meshy_AI_cup_0910054308_texture.opt.glb` · §13 opt copies · teapot, stacked teacups, cup (western, the Wonderland set) · copies of wired models; far roster `_hzTeapotFar`, `_hzTeacupsFar` (§8b-A, theme wonder)
- `56_drinking-cup` · §9 · held prop `ewm_cup` · WIRED (held prop)
- PSX `canned_food_mp_1` … `_5_rusty`, `meat_1`, `meat_1_1`, `plate_mp_1`, `fork_mp_1`, `spoon_mp_1`, `glass_bottle_1`, `glass_bottle_2` · §12b / §13 opt copies · WIRED `psx_<file>`
- `drying_fish`, `fish_boxes`, `coconuts`, `kettle`, `food_trolley`, `bbq_grill` · §13 wishlist · WIRED
- `popcorn_cart` D49, `cotton_candy_cart` (wishlist), `ticket_booth` D39, `Assets/opt/Meshy_AI_a_hot_dog_stand_0922010432_texture.opt.glb` · festival stalls, all western carnival style · WIRED
- §12: "sack ↔ Quequis `sack_flour`; teapot ↔ Vegetation `teapot`" · pack pieces named as alternatives (rice sack stand-in)
- Nothing here is sushi, ramen, rice, sake or a Japanese tea set.

## Weapons

- `dojo_weapon_rack` · §13 `Assets/world/props/meshy/dojo_weapon_rack.opt.glb` · WIRED (see Japanese pieces)
- `Assets/opt/Meshy_AI_master_sword_0713025949_texture.opt.glb` · §13 opt copy; original `Assets/fx/spell_props/Meshy_AI_master_sword_0713025949_texture.glb` (the `excalibur` monument, §8b-E) · a western long sword · WIRED as a spell prop / monument
- `Assets/opt/sword_mp_1.opt.glb` · §13 opt copy (PSX `items_and_weapons/sword_mp_1.glb`) · a sword · WIRED `psx_sword_mp_1`
- `Assets/opt/knife_mp_1.opt.glb`, `knife_mp_1_1.opt.glb`, `butcher_knife_mp_1.opt.glb` · §13 opt copies (PSX) · knives · WIRED `psx_<file>`
- `Assets/opt/Meshy_AI_arrow_0713025846_texture.opt.glb`, `Meshy_AI_throwing_knife_1027232048_texture.opt.glb`, `Meshy_AI_shield_1027232025_texture.opt.glb` · §13 opt copies · arrow, throwing knife (kunai stand-in), shield · copies of wired spell props
- `25_quiver`, `30_trident`, `18_armor-breastplate`, `19_armor-pauldron`, `20_armor-gauntlet`, `21_armor-greave`, `51_blowpipe`, `60_wizard-staff` · §9 · worn gear / held props (`ewm_quiver`, `ewm_trident`, `ewm_breastplate`, `ewm_pauldrons`, `ewm_gauntlets`, `ewm_greaves`, `ewm_blowpipe`, `ewm_wizardstaff` in §13 `Assets/opt`) · WIRED (creator / held, not room props)
- `Assets/characters/creator/wear/mhw_culturalibre_wooden_bow.glb`, `mhw_maciekg_short_bow.glb`, `mhw_joepal_crude_sword.glb`, `mhw_o4saken_dagger.glb`, `mhw_culturalibre_war_hammer.glb`, `mhw_maciekg_hammer.glb` · §13 MakeHuman wear · held bows, sword, dagger, hammers · R2 ONLY per the list
- G05 bow · §10G · "no pack bow found 2026-11-04 (Meshy if mondo wants it)" · STILL MISSING as a prop
- G09 spear · §10G · "pack has one: the Spear pack (human-made)" (spear / yari stand-in)
- `stocks` D27 · §10A · medieval wooden stocks · WIRED; `gallows` · §13 wishlist · WIRED

## Animals + units

- Wish list animals, §13 `Assets/world/props/meshy/wishlist/<name>.opt.glb`, all WIRED as static props: `deer`, `fox`, `heron`, `swan`, `duck`, `seagull`, `hawk`, `owl_perched`, `raven_perch`, `parrot`, `peacock`, `rooster`, `pig`, `goat`, `mountain_goat`, `mountain_lion`, `bear`, `coyote`, `hedgehog`, `rat`, `lizard`, `cobra`, `rattlesnake`, `scorpion`, `spider`, `dragonfly`, `firefly`, `river_fish`, `dodo`, `vulture`, `camel`, `penguin`, `reindeer`
- `Assets/opt/Butterfly_Blue_Morpho.opt.glb`, `Butterfly_Monarch.opt.glb`, `Butterfly_Swallowtail.opt.glb`, `Butterfly_Caterpillar.opt.glb`, `Butterfly_Chrysalis.opt.glb`, `butterfly.opt.glb`, `ladybug.opt.glb`, `Bee_Honeybee.opt.glb`, `Bee_Bumblebee.opt.glb`, `Grasshopper_Green.opt.glb`, `Grasshopper_Brown.opt.glb`, `Moth_Luna.opt.glb`, `Moth_Hawk_Moth.opt.glb`, `Ant_Worker.opt.glb`, `Ant_Anthill.opt.glb` · §13 opt copies · insects · copies of wired models
- `Assets/opt/Meshy_AI_frog_1027232151_texture.opt.glb`, `Meshy_AI_rabbit_Running.opt.glb`, `Meshy_AI_a_flamingo_0912231434_texture.opt.glb`, `Wolf1.opt.glb`, `PSX_lion.opt.glb`, `girafe.opt.glb`, `eagle_rigged.opt.glb` · §13 opt copies · frog, rabbit, flamingo, wolf, lion, giraffe, eagle · copies of wired models
- `Assets/world/animals/eagle.fbx`, `Assets/world/animals/eagle.glb` · §13 · 78.3 MB · the unrigged original of eagle_rigged.glb · R2 ONLY
- `Assets/opt/Meshy_AI_dinosaur_realistic_biped_Character_output.opt.glb` · §13 opt copy · the DINOSAUR race (rigged biped) · copy of a wired unit (the jungle's only dinosaur in this part)
- `Assets/opt/Meshy_AI_kaiju_Running.opt.glb`; `Assets/characters/races/kaiju/male/Meshy_AI_kaiju_realistic_biped_Character_output.glb` (R2 ONLY, "the game does not load it") · the KAIJU race (a Godzilla for the volcano)
- `Assets/opt/Meshy_AI_dragon_realistic_biped_Character_output.opt.glb`; `Assets/characters/races/dragon/male/Meshy_AI_dragon_realistic_biped_Character_output.glb` (R2 ONLY) · the dragon race
- `Assets/opt/Meshy_AI_hot_girl_pop_idol_s_biped_Character_output.opt.glb` · §13 opt copy · the SWORDFIGHTER (female) race; clips in `Assets/characters/races/swordfighter/female/Meshy_AI_hot_girl_pop_idol_s_biped/Meshy_AI_hot_girl_pop_idol_s_biped` · wired unit
- `Assets/opt/Meshy_AI_attractive_beautiful__biped_Character_output.opt.glb` · §13 opt copy · the KI FIGHTER (female) race; 12 clips in `Assets/characters/races/kifighter/female` · wired unit
- `Assets/opt/Meshy_AI_loch_ness_monster_re_biped_Character_output.opt.glb`, `Meshy_AI_kraken_realistic_biped_Character_output.opt.glb`, `Meshy_AI_evil_gorilla_monster__biped_Character_output.opt.glb`, `Meshy_AI_giant_spider_realisti_quadruped_Character_output.opt.glb`, `Meshy_AI_giant_ant_realistic_biped_Character_output.opt.glb`, `Meshy_AI_mantid_realistic_biped_Character_output.opt.glb`, `Meshy_AI_yeti_biped_Character_output.opt.glb`, `Meshy_AI_golem_realistic_biped_Character_output.opt.glb`, `Meshy_AI_goblin_Running.opt.glb`, `Meshy_AI_treeperson_Running.opt.glb`, `Meshy_AI_mushroom_girl_Running.opt.glb`, `Meshy_AI_ghost_realistic_hot_biped_Character_output.opt.glb`, `Meshy_AI_skeleton_biped_Character_output.opt.glb`, `Meshy_AI_mecha_mech_battle_m_biped_Character_output.opt.glb` · §13 opt copies · races that could live on the island (sea monster, jungle beasts, yokai stand-ins: tree person, ghost, goblin, skeleton; a mecha for the anime side) · copies of wired units
- `Assets/characters/races/catgirl/female/Meshy_AI_young_female_catgirl_biped_Character_output.glb`, `Assets/characters/races/fairy/female/Meshy_AI_young_fairy_biped_Character_output.glb`, `Assets/characters/races/mermaid/female/Meshy_AI_hot_mermaid_girl_biped_Character_output.glb` · §13 · spare rigged outputs, "the game does not load it" · R2 ONLY (the races themselves are wired through other files)
- Animation library clips on R2 that suit sword / martial units · §13 `Assets/characters/animations` (clip files, kept for the fallback): `Meshy_AI_sniper_Charged_Slash.glb`, `Meshy_AI_sniper_Charged_Upward_Slash.glb`, `Meshy_AI_sniper_Thrust_Slash.glb`, `Meshy_AI_sniper_Sword_Judgment.glb`, `Meshy_AI_sniper_Sword_Shout.glb`, `Meshy_AI_sniper_Right_Hand_Sword_Slas.glb`, `Meshy_AI_sniper_Kung_Fu_Punch.glb`, `Meshy_AI_sniper_Rising_Flying_Kick.glb`, `Meshy_AI_sniper_Roundhouse_Kick.glb`, `Meshy_AI_sniper_Sweeping_Kick.glb`, `Meshy_AI_sniper_Archery_Shot_2.glb`, `Meshy_AI_sniper_Archery_Shot_3.glb`, `Meshy_AI_sniper_biped_Animation_Archery_Shot_1_withSkin.glb` (the shared libraries `Assets/opt/MAL1_Sniper.opt.glb` … `MAL5_Sniper.opt.glb` are what the game loads)
- `Assets/opt/Meshy_AI_skull_pile_0917035243_texture.opt.glb`, `Meshy_AI_skull_realistic_0725070330_texture.opt.glb`, `Meshy_AI_femur_bone_realistic_0725070208_texture.opt.glb`, `Meshy_AI_ulna_bone_realistic_0725070052_texture.opt.glb` · §13 opt copies · skulls and bones (jungle / volcano) · copies of wired models; `cattle_skull`, `antler_trophy` · §13 wishlist · WIRED
- `whalebones` (monument) · §8b-E · CODE-BUILT (Cylinder, Torus) · a rib arch, could stand for a dinosaur rib cage

## Textures + decals

- Nothing in this part lists textures. §12b notes the PSX pack's loose `textures/` folder (215 PNGs + 30 extra surface sheets) is pack SOURCE, kept private in `dirtymondo:source/Assets/world/packs/pizzadoggy_psx_mega_pack/textures/`, not on the game bucket; the Pizza Doggy licence forbids any AI use of them.
- PSX `decals` · §12b · 4 files · cobwebs (flat cards: `cobweb_1`, `cobweb_2`, `cobweb_4`, `cobweb_5`) · WIRED `psx_<file>`
- §10D "not a model job" procs that are decals / surfaces: `floor_stain`, `ritual_circle`, `doormat` (flat mat), `garden_ring` (flower bed ring), `door_vine` (vine growth), `sale_banner` (flat banner), `festoon` (string lights), `infinity_pool` / `lap_pool` (water surfaces: a pond or onsen pool), `stair_step`, `stair_landing`, `house_stairs`, `riser_1` … `riser_3` (walkable steps) · CODE-BUILT, kept
- `string_lights` · §13 wishlist · festival lights · WIRED

## Sky + horizon

- `_hzLenticular` / `lenticular` · §8b-A, §8b-E · a lenticular cloud (cloud sprite stack; the cap cloud over a volcano), themes islands, sea · CODE-BUILT
- `_hzSeaStack` · §8b-A · sea rock stacks (Cylinder), theme sea · CODE-BUILT (mondo: looks fine)
- `_hzPalmIsleFar` · §8b-A · far palm islet, Meshy `palmisle`, theme sea
- `_hzLighthouse` · §8b-A · Meshy decor lighthouse, theme sea
- `_hzGhostShip` (Meshy `wreck`), `_hzSharkFar`, `_hzKrakenFar` · §8b-A · sea theme far pieces
- `whale` (landmark) · §8b-D · ocean pack `Whale`; `waterspout` (landmark) · CODE-BUILT
- `castle`, `skycastle` (landmarks) · §8b-D · castle pack, European
- `_hzGateway` / `arch` · §8b · Meshy `stone_arch`; `_hzStairway`; `_hzAstralOrbs` (glow orbs: spirit lights over a shrine)
- `innersun` (monument) · §8b-E · CODE-BUILT (a sun; a red sun disc is possible)
- `Assets/opt/Meshy_AI_moon_realistic_0727195427_texture.opt.glb`, `Meshy_AI_white_cloud_0917035538_texture.opt.glb` · §13 opt copies · a moon and a cloud model · copies of wired models
- Painted, not modelled (§8b intro): the sky dome, stars, clouds, the battle ring-wall's distant snow mountains (drawn in its shader)
- GAP stated by the list (§8b end, §11 row 29, §12): the cone mountains were deleted 11-03 ("they look terrible"), "no downloaded pack has a mountain"; "Wanted: a real far mountain range model (one file, low poly)". A volcano / Fuji weenie would be a NEW model. The `hills` + `dunes` rims and ground swells are deleted too ("no map should be using the dune swells or hill swells").

## Other

- `fountain` D23, `sundial` (wishlist), `bird_bath` (wishlist), `iron_lamp_post` (wishlist), `flag_pole` (wishlist), `trail_sign` (wishlist), `wanted_poster` (wishlist), `telegraph_pole` (wishlist) · town and garden extras · WIRED
- `carved_totem_pole`, `sphinx`, `pharaoh_statue`, `jackal_statue`, `papyrus_column`, `fallen_column`, `weeping_angel` · §13 wishlist · statues of other cultures (jungle ruins only) · WIRED
- `Assets/opt/Meshy_AI_angel_statue_0917035332_texture.opt.glb`, `Meshy_AI_demon_statue_0917040101_texture.opt.glb` · §13 opt copies · the demon statue could stand as an oni · copies of wired models
- `Assets/opt/Drum.opt.glb`, `Assets/opt/Harp.opt.glb`, `Assets/opt/Whistle.opt.glb`, `Assets/opt/Violin.opt.glb` · §13 opt copies (instruments pack) · theatre / festival · copies of wired models; `lyre` · wishlist · WIRED
- `Assets/opt/Bear_Trap_Base.opt.glb`, `Pit_Trap_Spikes.opt.glb`, `Trap_Hole_Spike.opt.glb`, `Trip_Wire.opt.glb`, `Pressure_Plate.opt.glb`, `Chain_Draped.opt.glb` · §13 opt copies (traps pack) · castle / ninja-house traps · copies of wired models
- `Assets/opt/gold_bar_pcs_1.opt.glb`, `coin_mp_1.opt.glb` · PSX · treasure · WIRED `psx_<file>`
- §10E wish items with no stand-in that an island would also want: "drawbridge, stone gargoyle, trestle table + benches, castle wall with battlements, round tower" (Camelot); the audit says castle wall + round tower = the castle pack `Wall_2x4` / `Tower_Mid`, candelabra = the Halloween candles.

---

## Reader 2

# Part 2 — MODEL_LIST.md lines 741-1331: section 6, PSX Mega Pack · Pizza Doggy (584 catalogue props)

Read end to end (every row, 741-1331). Every row here is a catalogue key in data.js DOOR_HQ.catalogue, so every item below is **WIRED**.
The list gives NO sizes and NO descriptions for this pack (only key, file, maker, source); "what it is" below is read from the key / file name only.
All files sit under `Assets/world/packs/pizzadoggy_psx_mega_pack/<folder>/`. Licence note from the list: Pizza Doggy licence, NOT CC0.

## Top of file: the finds and the gaps

- This pack is a modern PSX-horror interior set (apartments, tunnels, elevators, PCs, pistols, pills). It has NOTHING Japanese by name: no torii, shrine, lantern, shoji, tatami, katana, pagoda, roof piece.
- Best find for the harbour and market: the crate family, 8 `psx_wooden_crate_*` + 10 `psx_supply_crate_*` (full and `_empty` twins), plus 4 `psx_metal_barrel_mp_*`.
- Best find for walk-in buildings: a modular building kit in `modular_structures/`: walls (`psx_wall_1*`, `psx_wall_2_*`), doorways, loose doors, windows with `_no_glass` / `_frame_only` twins (frame-only could pass for a paper-screen opening), pillars, beams, floor/ceiling tiles, `psx_stairs_5_wood`. Look unknown from the list (likely modern plaster/concrete): must be looked at before use.
- Low furniture that passes for old Japan: 5 `psx_coffee_table_1*` (low tables), `psx_pillow_mp_1/2` (floor cushions), `psx_old_mattress_mp_1*` (futon stand-in), `psx_carpet_mp_1` (rug / mat), many wooden shelves, wardrobes, display cabinets, bedside tables.
- One blade: `psx_sword_mp_1` (kind unknown, not named katana), plus `psx_knife_mp_1*`, `psx_butcher_knife_mp_1` (fish market / kitchen).
- Small dressing: `psx_fish_skeleton_mp_1` (harbour / cat scraps), `psx_meat_1*`, `psx_plate_mp_1`, `psx_planter_pot_mp_1_empty/_full` (bonsai-pot stand-in), `psx_glass_bottle_1/2` (sake stand-in), `psx_healing_potion_mp_*`, `psx_poison_mp_1`, `psx_coin_mp_1`, `psx_gold_bar_pcs_1`, books, `psx_painting_1`, old keys and padlocks, cobweb decals.
- Arch pieces (`psx_arc_*`, `psx_half_arc_pillar_*`) and the tunnel set (`psx_tunnel_*`) could serve a castle gate passage or a volcano / mine tunnel, if their look is stone enough.
- GAPS (this part has none of these): any Japanese architecture or roof, lanterns, torii, shrine/temple items, banners, drums, bells, statues, tatami/shoji/screens, tea sets, sushi/ramen/rice, bows/spears/armour, ALL nature (no trees, bamboo, sakura, rocks, plants beyond one potted cactus and a planter pot), ALL harbour pieces (no boats, docks, nets, anchors), ALL farm pieces, ALL animals/units/dinosaurs, lava/volcano, textures (none; only 4 cobweb decals), sky/horizon builders (none).
- Lighting here is all electric (ceiling lamps, table lamps, ceiling fans): skipped, except noted table lamps as a last resort.

## Japanese pieces

(none in this part)

## Buildings + kit pieces (all in `modular_structures/`, all WIRED; look must be checked, the list does not describe it)

- `psx_wall_1` · `psx_wall_1_plain` · `psx_wall_1_half` · `psx_wall_1_1_half` · `psx_wall_1_2_half` · `psx_wall_1_3_half` · `psx_wall_2_1` · `psx_wall_2_2` · PSX Mega Pack · wall panels, full and half height · WIRED
- `psx_wall_1_rounded_corner` · `psx_wall_1_rounded_corner_1` · `psx_wall_1_rounded_corner_1_1` · `psx_wall_1_rounded_corner_1_2` · `psx_wall_1_1_rounded_corner_1` · `psx_wall_1_2_rounded_corner_1` · PSX Mega Pack · rounded wall corners · WIRED
- `psx_doorway_1` · `psx_doorway_1_1` · `psx_doorway_1_half` · `psx_doorway_1_plain` · `psx_doorway_2` · `psx_doorway_2_1` · `psx_doorway_2_1_half` · `psx_doorway_2_2_half` · `psx_doorway_2_wide` · `psx_doorway_3_half` · `psx_doorway_3_wide` · `psx_doorway_door_mp_1` · PSX Mega Pack · wall pieces with a door opening (wide ones for shop fronts / gates) · WIRED
- `psx_side_doorway_1` · `psx_side_doorway_2` · `psx_side_doorway_2_1` · `psx_side_doorway_3` · `psx_double_single_doorway_1` · `psx_double_single_doorway_2` · `psx_double_single_doorway_2_1` · `psx_double_single_doorway_3` · PSX Mega Pack · more doorway wall pieces · WIRED
- `psx_door_1_loose` · `psx_door_2_loose` · `psx_door_3_loose` · `psx_door_4_loose` · `psx_door_mp_1_loose` · `psx_door_mp_6_loose` · PSX Mega Pack · loose door leaves · WIRED
- `psx_window_1_single` · `psx_window_1_single_frame_only` · `psx_window_1_single_no_glass` · `psx_window_2_single` · `psx_window_2_single_frame_only` · `psx_window_2_single_no_glass` · `psx_window_2_double` · PSX Mega Pack · window wall pieces; `_frame_only` / `_no_glass` fit old buildings best · WIRED
- `psx_window_2_1_single` · `psx_window_2_1_single_frame_only` · `psx_window_2_1_single_no_glass` · `psx_window_2_1_double` · `psx_window_2_2_single` · `psx_window_2_2_single_frame_only` · `psx_window_2_2_single_no_glass` · `psx_window_2_2_double` · PSX Mega Pack · window variants · WIRED
- `psx_window_metal_bars_single` · `psx_window_metal_bars_double` · `psx_bars_metal_1` · `psx_bars_metal_2` · PSX Mega Pack · barred windows / bars (castle jail, dungeon) · WIRED
- `psx_floor_ceiling_1` · `psx_floor_ceiling_2` · `psx_floor_ceiling_3` · PSX Mega Pack · floor / ceiling tiles · WIRED
- `psx_pillar_1` · `psx_pillar_1_plain_1` · `psx_pillar_1_plain_2` · `psx_pillar_2` · `psx_pillar_3` · PSX Mega Pack · pillars (posts for halls, verandas) · WIRED
- `psx_beam_1` · `psx_beam_2` · `psx_beam_4` · `psx_beam_5` · PSX Mega Pack · beams (roof timbers, gate lintels) · WIRED
- `psx_stairs_5_wood` · PSX Mega Pack · wooden stairs (best stair fit) · WIRED
- `psx_stairs_3` · `psx_stairs_4` · `psx_stairs_mp_1` · `psx_stairs_5_concrete` · PSX Mega Pack · other stairs (concrete one = stone steps stand-in) · WIRED
- `psx_arc_1_wall_1` · `psx_arc_1_wall_1_plain` · `psx_arc_1_wall_2_1` · `psx_arc_1_wall_2_2` · `psx_arc_2_wall_1` · `psx_arc_2_wall_1_plain` · `psx_arc_2_wall_2_1` · `psx_arc_2_wall_2_2` · PSX Mega Pack · arched wall openings (castle gate passage, storehouse) · WIRED
- `psx_half_arc_pillar_1_wall_1_plain` · `psx_half_arc_pillar_2_wall_1_plain` · `psx_half_arc_pillar_2_tall_wall_1_plain` · PSX Mega Pack · half arch + pillar pieces · WIRED
- `psx_tunnel_1` · `psx_tunnel_mp_1_straight` · `psx_tunnel_mp_1_straight_inclined` · `psx_tunnel_mp_1_elbow` · `psx_tunnel_mp_1_tee` · `psx_tunnel_mp_1_cross_tee` · `psx_tunnel_entrance_platform_1` · `psx_wall_1_tunnel_hole` · `psx_wall_1_tunnel_hole_1` · `psx_wall_1_tunnel_hole_2` · PSX Mega Pack · tunnel kit (volcano lava tube, castle escape tunnel, mine; only if the look is not modern concrete) · WIRED
- `psx_catwalk_1` · PSX Mega Pack · catwalk (a plank walkway / pier stand-in only if it reads as wood; likely metal) · WIRED

## Nature + trees

- `psx_planter_pot_mp_1_empty` · `psx_planter_pot_mp_1_full` · PSX Mega Pack, small_props · planter pot, empty and planted (bonsai / garden pot stand-in) · WIRED
- (`psx_potted_cactus_mp_1` exists but a cactus is off theme; nothing else natural in this part)

## Harbour + sea

- `psx_wooden_crate_1` · `psx_wooden_crate_1_1` · `psx_wooden_crate_2` · `psx_wooden_crate_3` · `psx_wooden_crate_3_1` · `psx_wooden_crate_4` · `psx_wooden_crate_5` · `psx_wooden_crate_6` · PSX Mega Pack, large_props · wooden crates (docks, market, storehouses) · WIRED
- `psx_supply_crate_1` · `psx_supply_crate_1_1` · `psx_supply_crate_1_2` · `psx_supply_crate_1_3` · `psx_supply_crate_1_4` · PSX Mega Pack, large_props · supply crates, full · WIRED
- `psx_supply_crate_1_empty` · `psx_supply_crate_1_1_empty` · `psx_supply_crate_1_2_empty` · `psx_supply_crate_1_3_empty` · `psx_supply_crate_1_4_empty` · PSX Mega Pack, large_props · supply crates, empty (open boxes for fish / goods) · WIRED
- `psx_metal_barrel_mp_0` · `psx_metal_barrel_mp_1` · `psx_metal_barrel_mp_2` · `psx_metal_barrel_mp_3` · PSX Mega Pack, large_props · metal barrels (generic; modern-looking, use sparingly at the docks) · WIRED
- `psx_fish_skeleton_mp_1` · PSX Mega Pack, small_props · fish skeleton (dock scraps, cat's dinner, fish market) · WIRED

## Village + farm

- `psx_hand_saw_1` · PSX Mega Pack, items_and_weapons · hand saw (carpenter / boat builder tool) · WIRED
- `psx_nails_1` · `psx_nails_1_rusty` · PSX Mega Pack, items_and_weapons · nails (workshop dressing) · WIRED
- `psx_brick_1` · `psx_brick_1_1` · `psx_brick_1_2` · `psx_brick_1_3` · PSX Mega Pack, small_props · loose bricks (kiln, rubble) · WIRED
- `cinder_block` · PSX Mega Pack, small_props (`concrete_block_1.glb`) · block (stone block stand-in) · WIRED

## Interiors + furniture (all `furniture/` unless said; WIRED)

- `psx_coffee_table_1` · `psx_coffee_table_1_1` · `psx_coffee_table_1_2` · `psx_coffee_table_1_3` · `psx_coffee_table_1_4` · PSX Mega Pack · low tables (best stand-in for a chabudai / tea-house table) · WIRED
- `psx_pillow_mp_1` · `psx_pillow_mp_2` · PSX Mega Pack · pillows (floor cushions / zabuton, futon pillow) · WIRED
- `psx_old_mattress_mp_1` · `psx_old_mattress_mp_1_1` · PSX Mega Pack · bare mattress on the floor (futon stand-in for inn, farm house) · WIRED
- `psx_carpet_mp_1` · PSX Mega Pack, large_props · carpet / rug (floor mat) · WIRED
- `psx_dinner_table_1` · `psx_dinner_table_1_1` · `psx_dinner_table_1_2` · `psx_dinner_table_1_3` · `psx_dinner_table_1_4` · PSX Mega Pack · dinner tables (inn, market) · WIRED
- `psx_table_large_2` · `psx_table_large_2_1` · `psx_table_large_2_2` · `psx_table_large_2_3` · `psx_table_large_2_4` · `psx_table_large_3` · `psx_table_large_3_1` · `psx_table_large_3_2` · `psx_table_large_3_3` · `psx_table_large_3_4` · PSX Mega Pack · large tables (market stall counters, workshop benches) · WIRED
- `psx_tv_table_1` · `psx_tv_table_1_1` · `psx_tv_table_1_2` · `psx_tv_table_1_3` · `psx_tv_table_1_4` · `psx_tv_table_4` · `psx_tv_table_4_1` · `psx_tv_table_4_2` · `psx_tv_table_4_3` · `psx_tv_table_4_4` · PSX Mega Pack · low cabinets (named TV tables; without a TV they are low sideboards / altar stands) · WIRED
- `psx_bedside_table_1` · `psx_bedside_table_1_1` · `psx_bedside_table_1_2` · `psx_bedside_table_1_3` · `psx_bedside_table_1_4` · `psx_bedside_table_2` · `psx_bedside_table_2_1` · `psx_bedside_table_2_2` · `psx_bedside_table_2_3` · `psx_bedside_table_2_4` · PSX Mega Pack · small side tables / chests · WIRED
- `library_shelf` (file `shelf_mp_4.glb`) · `psx_shelf_mp_4_1` · `psx_shelf_mp_4_2` · `psx_shelf_mp_4_3` · `psx_shelf_mp_4_4` · PSX Mega Pack · bookshelf + colour variants (scroll library, shop) · WIRED
- `psx_shelf_mp_2` · `psx_shelf_mp_2_1` · `psx_shelf_mp_2_2` · `psx_shelf_mp_2_3` · `psx_shelf_mp_2_4` · `psx_shelf_mp_3` · `psx_shelf_mp_3_1` · `psx_shelf_mp_3_2` · `psx_shelf_mp_3_3` · `psx_shelf_mp_3_4` · PSX Mega Pack · shelves (shops, storehouse, kitchen) · WIRED
- `psx_shelf_mp_5` · `psx_shelf_mp_5_1` · `psx_shelf_mp_5_2` · `psx_shelf_mp_5_3` · `psx_shelf_mp_5_4` · `psx_shelf_mp_6` · `psx_shelf_mp_6_1` · `psx_shelf_mp_6_2` · `psx_shelf_mp_6_3` · `psx_shelf_mp_6_4` · `psx_shelf_mp_7` · `psx_shelf_mp_7_1` · `psx_shelf_mp_7_2` · `psx_shelf_mp_7_3` · `psx_shelf_mp_7_4` · PSX Mega Pack · more shelf shapes · WIRED
- `psx_wardrobe_mp_1` · `psx_wardrobe_mp_1_1` · `psx_wardrobe_mp_1_2` · `psx_wardrobe_mp_1_3` · `psx_wardrobe_mp_1_4` · PSX Mega Pack · wardrobes (tansu stand-in, inn, bath house changing room) · WIRED
- `psx_display_cabinet_mp_1` · `psx_display_cabinet_mp_1_1` · `psx_display_cabinet_mp_1_2` · `psx_display_cabinet_mp_1_3` · `psx_display_cabinet_mp_1_4` · `psx_display_cabinet_mp_2` · `psx_display_cabinet_mp_2_1` · `psx_display_cabinet_mp_2_2` · `psx_display_cabinet_mp_2_3` · `psx_display_cabinet_mp_2_4` · PSX Mega Pack · display cabinets (shop, tea house, castle treasury) · WIRED
- `psx_chair_mp_1` · `psx_chair_mp_1_1` · `psx_chair_mp_1_2` · `psx_chair_mp_1_3` · `psx_chair_mp_1_4` · `psx_chair_mp_2` · `psx_chair_mp_2_1` · `psx_chair_mp_2_2` · `psx_chair_mp_2_3` · `psx_chair_mp_2_4` · PSX Mega Pack · chairs (kind unknown from the name; western chairs fit only the inn / theatre) · WIRED
- `psx_chair_mp_3` · `psx_chair_mp_3_1` · `psx_chair_mp_3_2` · `psx_chair_mp_3_3` · `psx_chair_mp_3_4` · `psx_chair_mp_4` · `psx_chair_mp_4_1` · `psx_chair_mp_4_2` · `psx_chair_mp_4_3` · `psx_chair_mp_5` · `psx_chair_mp_5_1` · `psx_chair_mp_5_2` · `psx_chair_mp_5_3` · `psx_chair_mp_5_4` · PSX Mega Pack · more chairs (same caveat) · WIRED
- `psx_bed_1` · `psx_bed_1_frame` · `psx_bed_2` · `psx_bed_2_1` · PSX Mega Pack · beds (`psx_bed_1_frame` = bare frame, a low sleeping platform) · WIRED
- `couples_bed` (file `bed_4.glb`) · `psx_bed_4_1` · `psx_bed_4_2` · `psx_bed_4_3` · `psx_bed_4_4` · `dorm_bed` (file `bed_5.glb`) · `psx_bed_5_1` · `psx_bed_5_2` · `psx_bed_5_3` · `psx_bed_5_4` · PSX Mega Pack · beds (inn rooms; western look, weak fit) · WIRED
- `psx_painting_1` · `psx_photo_frame_mp_1` · `psx_photo_frame_mp_2` · PSX Mega Pack, small_props · wall picture + frames (hanging-scroll stand-in, weak) · WIRED
- `psx_book_mp_1` · `psx_book_mp_2` · `psx_book_mp_3` · `psx_book_mp_4` · `psx_book_mp_5` · `psx_book_mp_6` · `psx_book_mp_7` · `psx_book_mp_8` · `psx_book_mp_9` · `psx_book_mp_10` · `psx_open_book_mp_1` · `psx_notebook_1` · PSX Mega Pack, small_props · books (temple library, scholar's room) · WIRED
- `psx_curtain_rod_mp_1` · PSX Mega Pack, large_props · curtain rod (could hang a shop curtain / noren; no cloth in the list) · WIRED
- `psx_lamp_1_off` · `psx_lamp_1_on` · `psx_lamp_1_1_off` · `psx_lamp_1_1_on` · `psx_lamp_2_off` · `psx_lamp_2_on` · `psx_lamp_2_2_off` · `psx_lamp_2_2_on` · `psx_lamp_3_off` · `psx_lamp_3_on` · `psx_lamp_3_1_off` · `psx_lamp_3_1_on` · `psx_lamp_5_off` · `psx_lamp_5_on` · `psx_lamp_5_1_off` · `psx_lamp_5_1_on` · PSX Mega Pack, lighting · standing / table lamps, lit and unlit twins (electric; last-resort floor lantern stand-in only if one has a paper-shade look) · WIRED
- `psx_cobweb_1` · `psx_cobweb_2` · `psx_cobweb_4` · `psx_cobweb_5` · PSX Mega Pack, decals · cobwebs (abandoned shrine, haunted house, castle cellar) · WIRED
- `psx_padlock_1` · `psx_padlock_2` · `psx_padlock_3` · `psx_padlock_4` · PSX Mega Pack, small_props · padlocks (storehouse, jail) · WIRED
- `key` (file `key_mp_1.glb`) · `psx_key_mp_1_1` · `psx_key_mp_1_2` · `psx_key_mp_2` · `psx_key_mp_2_1` · `psx_key_mp_2_2` · `psx_key_mp_3` · `psx_key_mp_3_1` · `psx_key_mp_3_2` · `house_key` (file `key_mp_4.glb`) · `psx_key_mp_4_1` · `psx_key_mp_4_2` · PSX Mega Pack, items_and_weapons · keys (pickups) · WIRED
- `psx_sponge_mp_1` · `psx_sponge_mp_2` · PSX Mega Pack, small_props · sponges (bath house dressing) · WIRED

## Food + tableware

- `psx_meat_1` · `psx_meat_1_1` · PSX Mega Pack, items_and_weapons · meat (market, kitchen, dinosaur bait) · WIRED
- `psx_plate_mp_1` · PSX Mega Pack, small_props · plate · WIRED
- `psx_spoon_mp_1` · `psx_fork_mp_1` · PSX Mega Pack, small_props · spoon, fork (western cutlery; weak fit) · WIRED
- `psx_glass_bottle_1` · `psx_glass_bottle_2` · PSX Mega Pack, items_and_weapons · glass bottles (sake bottle stand-in, inn, tea house) · WIRED
- `psx_healing_potion_mp_1` · `psx_healing_potion_mp_2` · `psx_poison_mp_1` · PSX Mega Pack, items_and_weapons · potion / poison bottles (apothecary, ninja den) · WIRED

## Weapons

- `psx_sword_mp_1` · PSX Mega Pack, items_and_weapons · the pack's one sword (not named a katana; check its shape) · WIRED
- `psx_knife_mp_1` · `psx_knife_mp_1_1` · PSX Mega Pack, items_and_weapons · knives (tanto / kitchen stand-in) · WIRED
- `psx_butcher_knife_mp_1` · PSX Mega Pack, items_and_weapons · cleaver (fish market, kitchen) · WIRED
- `psx_police_baton_mp_1` · PSX Mega Pack, items_and_weapons · baton (weak: a short staff / jitte stand-in for town guards) · WIRED

## Animals + units

(none in this part; `psx_fish_skeleton_mp_1` is listed under harbour)

## Textures + decals

- Only the 4 cobweb decals above (`psx_cobweb_1`, `psx_cobweb_2`, `psx_cobweb_4`, `psx_cobweb_5`). No textures in this part.

## Sky + horizon

(none in this part)

## Other (treasure, pickups, small dressing)

- `psx_coin_mp_1` · PSX Mega Pack, items_and_weapons · coin (shrine offering, market) · WIRED
- `psx_gold_bar_pcs_1` · PSX Mega Pack, small_props · gold bars (castle treasury; koban stand-in) · WIRED
- `psx_incognito_mask_mp_1` · PSX Mega Pack, items_and_weapons · a mask (not a Japanese mask by name; possible theatre / ninja prop if its look allows) · WIRED
- `psx_matchbox_1` · `psx_matchbox_2` · PSX Mega Pack, items_and_weapons · matchboxes (tiny, by candles / incense; weak) · WIRED
- `psx_bandage_mp_1` · `psx_bandage_mp_2` · PSX Mega Pack, items_and_weapons · bandages (dojo, healer) · WIRED
- `pen` · `pencil` · PSX Mega Pack, small_props (`pen_mp_1.glb`, `pencil_mp_1.glb`) · writing tools (brush stand-in, weak) · WIRED
- `psx_ashtray_1` · PSX Mega Pack, small_props · ashtray (small dish / incense bowl stand-in, weak) · WIRED

## Read and skipped as off theme (so nobody re-reads for them)

Ammo boxes and loose ammo, pistols + magazines, suppressors, shotgun ammo, batteries, car battery, jerrycans, cardboard boxes, cash, cassette / VHS / CD / floppy, cell phones, smartphones, handheld console + tablet, PCs, keyboards, mice, monitors, speakers, TVs + remote, monitoring screens, keycards, keypads, IDs, dosimeters, flashlights, walkie-talkies, electrical outlets, light switches, buttons, elevators + doorways + signs, vents (`vent_grille` etc.), pipes + valve holders, ceiling fans, all ceiling lamps, vending machine, toilets + toilet cabin, armchairs, sofas, clocks, crosses, cigarettes / vape / lighters, lollipops, pills + bottles, syringes, canned food + tin cans, toy bricks, magnet, screwdrivers, underwear, potted cactus, mouse pad.

---

## Reader 1

# Part 1: MODEL_LIST.md lines 1-740 (tally, races, story cast, animation libraries, character creator): fits for KATANA ISLAND

Read end to end (every line, 1-740). This part holds NO props, buildings, trees, textures or sky builders: only units and creator pieces.

## Top of the list

Most valuable finds:
- A ready Japanese cast of playable races, all rigged and wired: `ninja` (male + female), `shogun`, `samurai slug`, `karate frog`, `ki fighter` (male + female), `monk`, `swordfighter` (male + female).
- For the jungle: `dinosaur` (one model only), `kaiju`, `dragon`, `king kong`, plus `quetzalcoatl`, `shaman`, `tree person`, `swamp monster`, `mantid`, `voidweaver` (giant spider).
- For Katana Bay: `pirate` (m/f), `mermaid` (m/f), `sharkman`, `kraken`, `deep sea fish`, `starfish`, `jellyfish`, `siren`, `deep sea diver`, `lifeguard`.
- For the village: `farmer`, `scarecrow`, `chef`, `rabbit`, `unicorn` (which is the Horse pack `Assets/world/animals/horses/Horse_glb.glb`: a horse model exists).
- Creator clothes that are Japanese or pass for it: `Kimono` (dress01_cc0), `ewb_gi` / `ewb_gi_open` (martial-arts gi), `F ninja` suit, `Asymmetric tunic and sash`, `Monk robe` (4 variants), `Fashion stylized qipoa` + `Middle length qipao` (Chinese, close), `Kill bill shoes`, `Mj cloth shoes`, `Harem pants`, `ewm_katana` (katana in a back sheath), `ewm_strawhat`, `ewb_shoe_sandals`, `Sandals1`, `Male flip flop sandals1`, `Wooden bow`, `Short bow`, `ewm_quiver`.
- Creator hair that reads Japanese: `hair012 · Top knot`, `hair008 · Bun`, `hair013 · Tied back`, `hair010 · Ponytail`, `Anime hair`, `Chinesebob01`, `Hair bun brown`, `Braid bun`.
- `ewm_t2kifighter_outfit` + `ewm_t2kifighter_hat` and `ewm_t2swordfighter_outfit`: Meshy remakes of the two anime-fighter units as wearable creator pieces.

What a Japanese island needs that this part does NOT have:
- No plain SAMURAI unit (only the slug and the shogun), no geisha / shrine maiden / ronin / sumo / villager / fisherman / merchant units; no oni, kitsune, tengu, kappa or tanuki.
- Only ONE dinosaur model (a biped); no raptor / T-rex / triceratops / pterosaur variety. No small animals as units here (no deer, fox, monkey, crane, crab, koi, turtle, frog apart from the karate frog).
- Creator: no hakama, haori, yukata, obi, samurai armour (do / kabuto / sode), conical straw hat (kasa: `ewm_strawhat` is a FLOPPY farm hat), geta / zori / tabi, oni / kitsune / noh masks, fan, umbrella, naginata, yari, wakizashi worn at the hip, ninja hood as a separate piece.
- No animation library named for sword / martial-arts work (only MAL1-5 Sniper, MOC1_CMU, MOC2_100STYLE, UAL1/2 Standard; clip names are not listed in this part).
- Everything else on the island (buildings, kit pieces, trees, harbour, food, textures, sky) is in the other parts.

## Japanese pieces (units, clothes, gear)

Units (all "WIRED": sprites.js RACE_MODELS_3D rows, playable / spawnable today):
- `Assets/characters/races/ninja/male/Meshy_AI_ninja_m_Running.glb` · §2 races · ninja (male) · Meshy AI · WIRED
- `Assets/characters/races/ninja/female/Meshy_AI_ninja_f_Running.glb` · §2 races · ninja (female) · Meshy AI · WIRED
- `Assets/characters/races/shogun/male/Meshy_AI_shogun_Running.glb` · §2 races · shogun (THE NEW RACES 4, 11-19) · the castle lord · WIRED
- `Assets/characters/races/samurai_slug/male/Meshy_AI_samurai_slug_Running.glb` · §2 races · samurai slug (THE NEW RACES 2) · WIRED
- `Assets/characters/races/karate_frog/male/Meshy_AI_karate_frog_Running.glb` · §2 races · karate frog (THE NEW RACES 2) · dojo / pond · WIRED
- `Assets/characters/races/kifighter/male/Meshy_AI_ki_fighter_m_Running.glb` · §2 races · ki fighter (male) · anime martial artist · WIRED
- `Assets/characters/races/kifighter/female/Meshy_AI_attractive_beautiful__biped_Character_output.glb` · §2 races · ki fighter (female); own legacy clips (idle, walk, jump, hit, death, cast, castMelee, castMagic, castSupport) in `Assets/characters/races/kifighter/female/` (§4b) · WIRED
- `Assets/characters/races/monk/male/Meshy_AI_monk_Running.glb` · §2 races · monk (THE NEW RACES 4) · temple · WIRED
- `Assets/characters/races/swordfighter/male/Meshy_AI_swordfighter_m_Running.glb` · §2 races · swordfighter (male) · WIRED
- `Assets/characters/races/swordfighter/female/Meshy_AI_hot_girl_pop_idol_s_biped_Character_output.glb` · §2 races · swordfighter (female), a pop-idol sword girl (anime) · WIRED
- `Assets/characters/races/kaiju/male/Meshy_AI_kaiju_Running.glb` · §2 races · kaiju (Japanese giant monster; volcano / jungle boss) · WIRED
- `Assets/characters/races/vtuber/female/Meshy_AI_vtuber_f_Running.glb` · §2 races · vtuber (female), anime idol look (modern; "love letter to anime" only) · WIRED
- `Assets/characters/races/catgirl/female/Meshy_AI_catgirl_Running.glb` · §2 races · catgirl (anime trope; creator look also baked) · WIRED
- `Assets/characters/races/bunnygirl/Meshy_AI_bunny_girl_Running.glb` · §2 races · bunny girl (anime trope) · WIRED
- `Assets/characters/races/mech/male/Meshy_AI_mecha_mech_battle_m_biped_Character_output.glb` + `Assets/characters/races/mech/female/Meshy_AI_mech_f2_Running.glb` · §2 races · mech (anime mecha; off-period, anime nod only) · WIRED

Creator clothes (§5b MakeHuman pack picks; one GLB per body in `Assets/characters/creator/wear/mhw_*`; file names are not listed, only pick names; all pickable in the creator today):
- `Kimono` · dress01_cc0 · CC0 · dresses · the only kimono · WIRED (creator)
- `F ninja` · suits03_cc-by · CC-BY · suits · female ninja suit · WIRED (creator)
- `Monk robe`, `Monk robe hood`, `Monk robe hood down`, `Monk robe hood off` · suits02_cc0 · CC0 · suits · temple monk robes (Western cut, usable) · WIRED (creator)
- `Asymmetric tunic and sash` · shirts03_ccby · CC-BY · tops · wrap top with a sash (reads like a kosode) · WIRED (creator)
- `Fashion stylized qipoa` · dress02_cc-by · CC-BY · dresses · Chinese qipao (East Asian, close) · WIRED (creator)
- `Middle length qipao` · dress03_cc-by · CC-BY · dresses · Chinese qipao · WIRED (creator)
- `Harem pants` · pants01_cc0 · CC0 · bottoms · loose trousers, nearest thing to hakama · WIRED (creator)
- `Wool pants` · pants01_cc0 · CC0 · bottoms · plain period trousers · WIRED (creator)
- `Sarong cover up` · dress02_cc-by · dresses · wrap, bay / onsen · WIRED (creator)
- `Ladies apron` · dress02_cc-by · dresses · tea house / inn staff · WIRED (creator)
- `Kill bill shoes` · shoes02_ccby · CC-BY · shoes · the yellow Onitsuka look (anime / film nod) · WIRED (creator)
- `Mj cloth shoes` · shoes01_cc0 · CC0 · shoes · flat cloth shoes (pass for tabi / kung-fu slippers) · WIRED (creator)
- `Sandals1`, `Caesar sandals1`, `Male flip flop sandals1` · shoes02_ccby · CC-BY · shoes · sandals (flip-flops are the nearest to zori) · WIRED (creator)
- `Tomato rei ayanami`, `Tomato yoko tsuno` · suits02_cc0 · CC0 · suits · anime / manga character suits (sci-fi plugsuits; anime nod only) · WIRED (creator)
- `Deathnote t-shirt` · shirts02_ccby · tops · anime shirt (modern) · WIRED (creator)
- `Fishing hat 01` · hats03_cc-by · hats · Katana Bay fishermen (modern cut) · WIRED (creator)
- `Fisherman sweater` · shirts01_cc0 · tops · bay fishermen · WIRED (creator)
- `Mycenaean tunic` · dress01_cc0 · dresses · simple tunic for villagers · WIRED (creator)
- `Bandana mask` · masks02_ccby · masks · ninja / bandit face cover · WIRED (creator)
- `Hero-heroine hood 1`, `Hero-heroine hood 2` · masks01_cc0 · masks · hoods (nearest to a ninja hood) · WIRED (creator)

Creator clothes made in Blender (§5d, `ewb_*`):
- `Assets/characters/creator/wear/ewb_gi.glb` · §5d · ewb_gi · martial-arts gi (dojo, karate) · Claude in Blender · WIRED (creator)
- `Assets/characters/creator/wear/ewb_gi_open.glb` · §5d · ewb_gi_open · the gi, open front · WIRED (creator)
- `Assets/characters/creator/wear/ewb_shoe_sandals.glb` · §5d · ewb_shoe_sandals · sandals · WIRED (creator)
- `Assets/characters/creator/wear/ewb_belt.glb` · §5d · Belt · stands in for an obi / gi belt · WIRED (creator)
- `Assets/characters/creator/wear/ewb_loincloth.glb` · §5d · Loincloth · fundoshi stand-in (sumo, fishermen, jungle) · WIRED (creator)
- `Assets/characters/creator/wear/ewb_kilt.glb` · §5d · Linen kilt · wrap skirt, villager · WIRED (creator)
- `Assets/characters/creator/wear/ewb_raggedrobe.glb` + `ewb_raggedrobe_open.glb` · §5d · ragged robe · ronin / beggar / hermit · WIRED (creator)
- `Assets/characters/creator/wear/ewb_raggedskirt.glb` · §5d · Ragged skirt · peasant · WIRED (creator)
- `Assets/characters/creator/wear/ewb_cape_hooded.glb` · §5d · hooded cape · travellers, ninja · WIRED (creator)
- `Assets/characters/creator/wear/ewb_cape_leaf.glb` + `ewb_leafdress.glb` · §5d · leaf cape / leaf dress · jungle folk · WIRED (creator)
- `Assets/characters/creator/wear/ewb_tabard.glb` · §5d · tabard · castle guard overgarment (European, usable as a jinbaori stand-in) · WIRED (creator)
- `Assets/characters/creator/wear/ewb_scaleleggings.glb` · §5d · Scale leggings · armour legs · WIRED (creator)

Creator pieces by Meshy (§5e, `ewm_*`):
- `Assets/characters/creator/wear/ewm_katana.glb` · §5e · Katana in a back sheath (equipment) · THE katana of this part · Meshy AI · WIRED (creator)
- `Assets/characters/creator/wear/ewm_strawhat.glb` · §5e · Floppy straw hat (hats) · farmer hat (not a conical kasa) · WIRED (creator)
- `Assets/characters/creator/wear/ewm_t2kifighter_outfit.glb` · §5e · Ki fighter outfit (Meshy remake) · anime martial-arts outfit on any body · WIRED (creator)
- `Assets/characters/creator/wear/ewm_t2kifighter_hat.glb` · §5e · Ki fighter headwear (Meshy remake) · WIRED (creator)
- `Assets/characters/creator/wear/ewm_t2swordfighter_outfit.glb` · §5e · Swordfighter jacket (Meshy remake) · WIRED (creator)
- `Assets/characters/creator/wear/ewm_blowpipe.glb` · §5e · Blowpipe (equipment) · ninja fukiya / jungle hunters · WIRED (creator)
- `Assets/characters/creator/wear/ewm_talisman.glb` · §5e · Talisman pendant (equipment) · shrine charm (omamori stand-in) · WIRED (creator)
- `Assets/characters/creator/wear/ewm_wardtotem.glb` · §5e · Ward totem (belt) · shrine / jungle charm · WIRED (creator)
- `Assets/characters/creator/wear/ewm_censer.glb` · §5e · Censer (hip) · temple incense · WIRED (creator)
- `Assets/characters/creator/wear/ewm_cup.glb` · §5e · Drinking cup · sake / tea cup in hand · WIRED (creator)
- `Assets/characters/creator/wear/ewm_handmirror.glb` · §5e · Hand mirror · geisha / shrine mirror · WIRED (creator)
- `Assets/characters/creator/wear/ewm_potionflask.glb` · §5e · Potion flask · sake flask / gourd stand-in · WIRED (creator)
- `Assets/characters/creator/wear/ewm_quiver.glb` · §5e · Quiver · archers (kyudo) · WIRED (creator)
- `Assets/characters/creator/wear/ewm_breastplate.glb`, `ewm_pauldrons.glb`, `ewm_gauntlets.glb`, `ewm_greaves.glb` · §5e · armour breastplate / pauldrons / gauntlets / greaves · European plate, the only armour set; a weak samurai stand-in · WIRED (creator)
- `Assets/characters/creator/wear/ewm_vtwig.glb` · §5e · Idol side-ponytail wig · anime idol · WIRED (creator)
- `Assets/characters/creator/wear/ewm_egwig.glb` · §5e · Split-dye pigtail wig · anime / e-girl · WIRED (creator)
- `Assets/characters/creator/wear/ewm_t2catgirl_hat.glb` + `ewm_t2catgirl_outfit.glb` · §5e · Catgirl ears / outfit (Meshy remake) · anime · WIRED (creator)
- `Assets/characters/creator/wear/ewm_t2bunnygirl_hat.glb` + `ewm_t2bunnygirl_outfit.glb` · §5e · Bunny girl headpiece / outfit · anime · WIRED (creator)

Creator hair that reads Japanese / anime:
- `Assets/characters/creator/hair/hair012.glb` · §5a · hair012 · Top knot · samurai chonmage stand-in · Hair pack part 1 · WIRED (creator)
- `Assets/characters/creator/hair/hair008.glb` · §5a · hair008 · Bun · WIRED (creator)
- `Assets/characters/creator/hair/hair013.glb` · §5a · hair013 · Tied back · ronin · WIRED (creator)
- `Assets/characters/creator/hair/hair010.glb` · §5a · hair010 · Ponytail · WIRED (creator)
- `Assets/characters/creator/hair/hair001.glb` · §5a · hair001 · Long straight · WIRED (creator)
- `Assets/characters/creator/hair/hair000.glb` · §5a · hair000 · Spiked · anime hero · WIRED (creator)
- `Assets/characters/creator/hair/hair014.glb` · §5a · hair014 · Wild mane · anime hero · WIRED (creator)
- `Assets/characters/creator/hair/hair002.glb`, `hair005.glb` · §5a · Swept fringe / Layered bangs · anime · WIRED (creator)
- `Anime hair` · §5c hair01 · learning · CC0 (`Assets/characters/creator/hair/mh/`) · WIRED (creator)
- `Chinesebob01` · §5c hair03 · punkduck · CC-BY · East Asian bob · WIRED (creator)
- `Hair bun brown` · §5c hair01 · RehmanPolanski · CC0 · WIRED (creator)
- `Braid bun`, `50s updo`, `Island princess hair` · §5c hair02 · Elvaerwyn · CC-BY · updo / bun styles · WIRED (creator)
- `Reverse french braid bun`, `Double mh braid` · §5c hair01 · Elvaerwyn · CC0 · WIRED (creator)
- `Wig bun blonde braids` · §5c hair03 · grinsegold · CC-BY · bun with braids · WIRED (creator)
- `Straight bangs` · §5c hair01 · Cortu · CC0 · hime-cut stand-in · WIRED (creator)
- `Blunt bob with bangs`, `Bobcut hair`, `Bob01`, `Bob02`, `Ponytail01`, `Braid01`, `Long01` · §5c · bobs / ponytail / braid / long · WIRED (creator)
- `Junglebook hair` · §5c hair01 · sonntag78 · CC0 · jungle district folk · WIRED (creator)

## Buildings + kit pieces

- None in this part.

## Nature + trees

- None in this part (see the tree-person unit under animals + units).

## Harbour + sea (units and wear for Katana Bay)

- `Assets/characters/races/homosapien/male/pirate/Meshy_AI_dashingly_handsome_sw_biped_Character_output.glb` · §2 races · pirate · (wako sea raiders stand-in); own clips in `Assets/characters/races/homosapien/male/pirate/` · WIRED
- `Assets/characters/races/homosapien/female/pirate/Meshy_AI_hot_female_pirate_biped_Character_output.glb` · §2 races · pirate (female) · WIRED
- `Assets/characters/races/mermaid/male/Meshy_AI_merman_Running.glb` + `Assets/characters/races/mermaid/female/Meshy_AI_mermaid_f2_Running.glb` · §2 races · mermaid (ningyo) · WIRED
- `Assets/characters/races/siren/female/Meshy_AI_siren_f2_Running.glb` · §2 races · siren (female) · WIRED
- `Assets/characters/races/sharkman/Meshy_AI_shark_man_Running.glb` · §2 races · sharkman · WIRED
- `Assets/characters/races/kraken/male/Meshy_AI_kraken_realistic_biped_Character_output.glb` · §2 races · kraken (akkorokamui stand-in) · WIRED
- `Assets/characters/races/deepseafish/Meshy_AI_alien_fish_Running.glb` · §2 races · deep sea fish · WIRED
- `Assets/characters/races/starfish/Meshy_AI_sentient_starfish_Running.glb` · §2 races · starfish · WIRED
- `Assets/characters/races/jellyfish/Meshy_AI_a_jellyfish_king_Running.glb` · §2 races · jellyfish · WIRED
- `Assets/characters/races/lochnessmonster/male/Meshy_AI_loch_ness_monster_re_biped_Character_output.glb` · §2 races · loch ness monster (sea serpent / plesiosaur: bay or jungle lake) · WIRED
- `Assets/characters/races/deep_sea_diver/female/Meshy_AI_deep_sea_diver_f_Running.glb` · §2 races · deep sea diver (female) (ama pearl-diver nod; brass-helmet suit) · WIRED
- `Assets/characters/races/atlantean/male/Meshy_AI_atlantean_m_Running.glb` + `.../atlantean/female/Meshy_AI_atlantean_f_v2_Running.glb` · §2 races · atlantean · sea folk · WIRED
- `ewm_trident` (`Assets/characters/creator/wear/ewm_trident.glb`) · §5e · Trident · fisherman's spear / yari stand-in · WIRED (creator)
- `ewm_spyglass` (`Assets/characters/creator/wear/ewm_spyglass.glb`) · §5e · Spyglass (hip) · harbour master · WIRED (creator)
- `ewm_tricorn`, `ewm_t2pirate_hat`, `ewm_t2pirate_outfit`, `ewm_t2piratef_hat`, `ewm_t2piratef_outfit`, `ewb_pirate`, `ewb_pirate_closed` · §5d / §5e · pirate hats and outfits (Western) · WIRED (creator)
- `ewm_mermaidtail`, `ewm_sharkhead`, `ewm_sharktail`, `ewm_dorsalfin`, `ewb_cape_sea` · §5d / §5e · sea-creature body parts + a sea cape · WIRED (creator)
- `Female pirate boots`, `Semitransparent water boots` · shoes01_cc0 · shoes · WIRED (creator)
- `Diver suit`, `Wetsuit`, `Diver scuba rig` · suits03_cc-by / equipment03_cc-by · modern diving gear (ama divers, loosely) · WIRED (creator)

## Village + farm (units and wear)

- `Assets/characters/races/farmer/male/Meshy_AI_farmer_Running.glb` · §2 races · farmer (Western farmer; rice paddies) · WIRED
- `Assets/characters/races/scarecrow/male/Meshy_AI_scarecrow_biped_Character_output.glb` · §2 races · scarecrow (kakashi in the paddies) · WIRED
- `Assets/characters/races/chef/male/Meshy_AI_chef_male_Running.glb` · §2 races · chef (ramen / sushi cook; creator look also baked) · WIRED
- `Assets/world/animals/horses/Horse_glb.glb#unicorn` · §2 races · unicorn = the Horse pack (mondo's upload) + Meshy horn + wing; the same pack file is a HORSE for the village / castle stables · WIRED (as the unicorn race)
- `Assets/characters/races/rabbit/Meshy_AI_rabbit_Running.glb` · §2 races · rabbit (moon rabbit / woods) · WIRED
- `ewb_scarecrow`, `ewb_scarecrow_open`, `ewm_t2scarecrow_hat`, `ewm_t2scarecrow_outfit` · §5d / §5e · scarecrow coat, headgear and rags · WIRED (creator)
- `Male coveralls 1`, `Male worksuit01` · suits03_cc-by / makehuman_system_assets · work clothes (modern cut) · WIRED (creator)
- `Hammer` · equipment02_cc-by · hand tool (carpenter, smith) · WIRED (creator)
- `ewm_toolbelt` (`Assets/characters/creator/wear/ewm_toolbelt.glb`) · §5e · Tool belt · craftsman · WIRED (creator)
- `ewm_backpack` (`Assets/characters/creator/wear/ewm_backpack.glb`) · §5e · Small backpack · pedlar / traveller · WIRED (creator)
- `ewb_chef`, `ewb_chef_open`, `Unisex chef hat 1` · §5d / hats03_cc-by · chef whites + hat · market / inn kitchens · WIRED (creator)

## Interiors + furniture

- None in this part.

## Food

- None as props. Only `ewm_cup` (Drinking cup) and `ewm_milkcookies` (Milk and cookies; off-theme) as hand-held creator equipment.

## Weapons (all creator equipment worn / held by a character, not room props)

- `Assets/characters/creator/wear/ewm_katana.glb` · §5e · Katana in a back sheath · WIRED (creator)
- `Wooden bow` · equipment01_cc0 · CC0 · bow (yumi stand-in) · WIRED (creator)
- `Short bow` · equipment02_cc-by · CC-BY · bow · WIRED (creator)
- `Crude sword` · equipment01_cc0 · sword · WIRED (creator)
- `Dagger` · equipment01_cc0 · dagger (tanto stand-in) · WIRED (creator)
- `Hero kalistick`, `Hero kalistick lefthanded` · equipment01_cc0 · escrima sticks (martial arts, dojo) · WIRED (creator)
- `Hand claws` · equipment01_cc0 · claws (ninja tekko-kagi stand-in) · WIRED (creator)
- `War hammer` · equipment01_cc0 · war hammer · WIRED (creator)
- `Magic sceptre` · equipment01_cc0 · sceptre (priest's staff stand-in) · WIRED (creator)
- `ewm_wizardstaff` (`Assets/characters/creator/wear/ewm_wizardstaff.glb`) · §5e · Wizard staff · monk's staff (bo / shakujo stand-in) · WIRED (creator)
- `ewm_trident`, `ewm_blowpipe`, `ewm_quiver` · §5e · listed above
- `Mma fighting gloves` · gloves01_cc0 · dojo fighters · WIRED (creator)
- Helmets (none Japanese; weak stand-ins for a kabuto): `Warrior helmet`, `Skull helmet` (hats02_cc0), `Warrior helmet 02`, `Horned helmet`, `Leather helmet` (hats04_cc-by) · WIRED (creator)

## Animals + units (jungle, volcano, woods, yokai stand-ins)

Jungle with dinosaurs:
- `Assets/characters/races/dinosaur/male/Meshy_AI_dinosaur_realistic_biped_Character_output.glb` · §2 races · dinosaur · THE ONLY dinosaur (a biped, Meshy AI, mondo) · WIRED
- `Assets/characters/races/kaiju/male/Meshy_AI_kaiju_Running.glb` · §2 races · kaiju · WIRED
- `Assets/characters/races/kingkong/Meshy_AI_evil_gorilla_monster__biped_Character_output.glb` · §2 races · king kong (giant ape; the nearest thing to a monkey) · WIRED
- `Assets/characters/races/reptilian/male/Meshy_AI_reptilian_in_a_busine_biped_Character_output.glb` · §2 races · reptilian (in a business suit: poor fit) · WIRED
- `Assets/characters/races/sewer_gator/male/Meshy_AI_sewer_gator_Running.glb` · §2 races · sewer gator (jungle river croc) · WIRED
- `Assets/characters/races/swampmonster/Meshy_AI_swampmonster_Running.glb` · §2 races · swamp monster · WIRED
- `Assets/characters/races/treeperson/Meshy_AI_treeperson_Running.glb` · §2 races · tree person (kodama / woods spirit) · WIRED
- `Assets/characters/races/mushroomgirl/Meshy_AI_mushroom_girl_Running.glb` · §2 races · mushroom girl (woods) · WIRED
- `Assets/characters/races/aztec/Meshy_AI_aztec_Running.glb` · §2 races · quetzalcoatl (jungle serpent-god figure) · WIRED
- `Assets/characters/races/shaman/male/Meshy_AI_shaman_m_Running.glb` + `Assets/characters/races/homosapien/female/harvester/Meshy_AI_beautiful_attractive__biped_Character_output.glb` · §2 races · shaman (m/f) · jungle tribe / mountain ascetic · WIRED
- `Assets/characters/races/mantid/male/Meshy_AI_mantid_realistic_biped_Character_output.glb` · §2 races · mantid (giant mantis) · WIRED
- `Assets/characters/races/antperson/male/Meshy_AI_giant_ant_realistic_biped_Character_output.glb` · §2 races · antperson (giant ant) · WIRED
- `Assets/characters/races/cicada_brood/male/Meshy_AI_cicada_brood_Running.glb` · §2 races · cicada brood (cicadas = the sound of a Japanese summer) · WIRED
- `Assets/characters/races/voidweaver/male/Meshy_AI_giant_spider_realisti_quadruped_Character_output.glb` · §2 races · voidweaver = a giant spider, quadruped rig (tsuchigumo / jorogumo stand-in) · WIRED
- `Assets/characters/races/beequeen/Meshy_AI_the_hive_queen_Running.glb` · §2 races · bee queen · WIRED
- `Assets/characters/races/eagleman/Meshy_AI_eagleman__Running.glb` · §2 races · eagleman (bird man: the nearest thing to a TENGU) · WIRED
- `Assets/characters/races/mothman/male/Meshy_AI_mothman_cryptid_gian_biped_Character_output.glb` · §2 races · mothman (Mothra nod) · WIRED
- `Assets/characters/races/bigfoot/male/Meshy_AI_bigfoot_v2_Running.glb` · §2 races · bigfoot (hibagon stand-in, woods) · WIRED
- `Assets/characters/races/werewolf/male/Meshy_AI_werewolf_biped_Character_output.glb` · §2 races · werewolf (wolf spirit / okami stand-in) · WIRED
- `Assets/characters/races/goatman/male/Meshy_AI_goatman_realistic_biped_Character_output.glb` · §2 races · goatman · WIRED
- `Assets/characters/races/minotaur/Meshy_AI_minotaur_realistic_biped_Character_output.glb` · §2 races · minotaur (ox-head demon Gozu stand-in) · WIRED

Volcano:
- `Assets/characters/races/dragon/male/Meshy_AI_dragon_r2_v2_Running.glb` · §2 races · dragon (Western dragon, v2 look; wings apart: THE UNIT GEAR) · WIRED
- `Assets/characters/races/golem/Meshy_AI_golem_realistic_biped_Character_output.glb` · §2 races · golem (rock creature, lava field) · WIRED
- `Assets/characters/races/crystalguardian/Meshy_AI_crystal_guardian_Running.glb` · §2 races · crystal guardian (crater caves) · WIRED
- `Assets/characters/races/demon/male/Meshy_AI_red_demon_biped_Character_output.glb` + `Assets/characters/races/demon/female/Meshy_AI_demon_female_biped_Character_output.glb` · §2 races · demon (the RED demon = the nearest thing to an ONI) · WIRED
- `Assets/characters/races/overlord/Meshy_AI_underworld_overlord__biped_Character_output.glb` · §2 races · overlord (demon lord) · WIRED
- `Assets/characters/races/juggernaut/Meshy_AI_a_giant_juggernaut_Running.glb`, `Assets/characters/races/giant/male/Meshy_AI_ancient_giant_biped_Character_output.glb` · §2 races · juggernaut / giant (big bosses) · WIRED

Yokai / spirits stand-ins (shrine, graveyard, woods at night):
- `Assets/world/packs/elbolilloduro_halloween/characters/Character_Ghost.glb` · §2 races · ghost · Halloween pack · Elbolilloduro · CC0 (human-made) · WIRED
- `Assets/characters/races/ghost/female/Meshy_AI_ghost_realistic_hot_biped_Character_output.glb` · §2 races · ghost (female) (yurei stand-in) · WIRED
- `Assets/characters/races/skeleton/male/Meshy_AI_skeleton_biped_Character_output.glb` · §2 races · skeleton (gashadokuro stand-in) · WIRED
- `Assets/characters/races/shadowentity/male/Meshy_AI_shadowperson_Walking.glb` · §2 races · shadow entity · WIRED
- `Assets/characters/races/haunted_doll/female/Meshy_AI_haunted_doll_Running.glb` · §2 races · haunted doll (cursed doll) · WIRED
- `Assets/characters/races/goblin/Meshy_AI_goblin_Running.glb` · §2 races · goblin (small oni / kappa stand-in) · WIRED
- `Assets/characters/races/fairy/female/Meshy_AI_fairy_v2_Running.glb` · §2 races · fairy (female) · woods spirit · WIRED
- `Assets/characters/races/gnome/male/Meshy_AI_garden_gnome_realist_biped_Character_output.glb` · §2 races · gnome (garden) · WIRED
- `Assets/characters/races/yeti/male/Meshy_AI_yeti_biped_Character_output.glb` · §2 races · yeti (snow peak, if any) · WIRED
- `Assets/characters/races/icequeen/Meshy_AI_an_ice_queen_Running.glb` · §2 races · ice queen (yuki-onna stand-in) · WIRED

Town / castle people that pass:
- `Assets/characters/races/homosapien/male/harbinger/Meshy_AI_male_fortune_teller_biped_Character_output.glb` + `Assets/characters/races/homosapien/female/harbinger/Meshy_AI_fortune_teller_f_v2_Running.glb` · §2 races · fortune teller (m/f) · festival stall / shrine · WIRED
- `Assets/characters/races/gambler/male/Meshy_AI_gambler_Running.glb` · §2 races · gambler (gambling den; Western dress) · WIRED
- `Assets/characters/races/luchador/Meshy_AI_luchador_Running.glb` · §2 races · luchador (wrestler: the nearest thing to a sumo) · WIRED
- `Assets/characters/races/robinhood/Meshy_AI_archer_robin_hood_r_biped_Character_output.glb` · §2 races · robinhood (an archer) · WIRED
- `Assets/characters/races/homosapien/male/blackmage/Meshy_AI_wizard_realistic_biped_Character_output.glb` + female `.../female/blackmage/Meshy_AI_young_female_witch_biped_Character_output.glb` · §2 races · wizard / witch (onmyoji stand-in, weak) · WIRED
- `Assets/characters/races/popstar/Meshy_AI_a_blonde_popstar_Running.glb` · §2 races · popstar (idol; modern) · WIRED

Creator body parts for building animal / yokai folk (§5b / §5e, all WIRED in the creator):
- `Fluffy tail as clothes 1`, `Cat tail as clothes 1`, `Tigra tail` · bodyparts03_cc-by · tails (fluffy tail = kitsune / tanuki) 
- `Deer antlers 1`, `Demon horns` · bodyparts02_cc-by · antlers (Nara deer spirit) / horns (oni)
- `Faun horns`, `Minotaur horns` · bodyparts01_cc0 · horns (oni)
- `Static wings1 dragonfly`, `Static wings3 butterfly1`, `Static wings5 fairy moth1`, `Static wings2 dragon1` · bodyparts03_cc-by · insect / dragon wings
- `ewm_lizardhead`, `ewm_lizardtail` (`Assets/characters/creator/wear/ewm_lizardhead.glb`, `ewm_lizardtail.glb`) · §5e · lizard head + tail (a dinosaur-man / kappa-like build)
- `ewm_eaglehead` (`Assets/characters/creator/wear/ewm_eaglehead.glb`) · §5e · eagle head (tengu build)
- `ewm_wolftail`, `ewm_wolftail_fura`, `ewm_wolftail_furb` · §5e · wolf tail (fox-tail stand-in)
- `ewm_elfears` · §5e · elf ears (spirit folk)
- `ewm_beastfeet` (+ `_fura`, `_furb`), `ewm_hooves` · §5e · clawed feet / hooves
- `ewf_fur`, `ewf_fur_werewolf` (`Assets/characters/creator/wear/ewf_fur.glb`, `ewf_fur_werewolf.glb`) · §5d · whole-body fur (monkey / tanuki folk)
- `ewm_mushroomcap`, `ewm_mushroomcap_big` · §5e · mushroom-cap hats (woods spirits)

## Textures + decals

- None in this part.

## Sky + horizon

- None in this part (line 38-39 only says 61 of the 163 horizon builders are three.js shapes; the list is §8b, another part).

## Other (useful facts in this part)

- Animation libraries every rig is retargeted from (§4): `Assets/characters/animations/UAL1_Standard.glb`, `UAL2_Standard.glb` (Quaternius, CC0), `MAL1_Sniper.glb` to `MAL5_Sniper.glb` (Meshy), `MOC1_CMU.glb`, `MOC2_100STYLE.glb` (motion capture). Clip names are not in this part, so whether a katana slash / bow / kata / kneel / bow-greeting clip exists must be checked in sprites.js UAL_SLOTS.
- Creator bodies (§5a) to dress as villagers / samurai / geisha: `Assets/characters/creator/mpfb/mpfb_male.glb`, `mpfb_female.glb`, `mpfb_heavy.glb` (a sumo build), `mpfb_female_heavy.glb`, `mpfb_thin.glb`, `mpfb_female_thin.glb`, `mpfb_short.glb`, `mpfb_female_short.glb`, + the classic ones.
- Beards for elders / masters: `Assets/characters/creator/wear/ewb_beard_full.glb`, `ewb_beard_scruffy.glb`; `Moustache`, `Dal moustache` (bodyparts06_cc-by).
- Tally (line 22-33): 1036 + 170 asset-pack models, 546 MakeHuman picks, 1263 Meshy; the pack-first rule (lines 12-16) says any NEW Japanese piece must be looked for in §6 / §7, §13 and `asset-packs/contents-lists/object_names_in_every_downloaded_pack.json` before a Meshy prompt.
