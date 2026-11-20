# AGARTHA, FITS PART 4: THE LIVE DATA (catalogue, surfaces, decals, trees, kits, how a walk-in building is made)

Reader pass, 2026-11-20, HEAD 37898eb (data.js line numbers drift while the build thread edits it, so data.js refs are search anchors; three-renderer.js / bake / district file:line refs are as read). Everything below was read from the LIVE data (`require('./load-data.js').loadGameData()`, then
`DOOR_HQ.catalogue`, `DOOR_HQ.textures`, `DOOR_HQ.decals`, `HQ_TREE_KINDS`, `HQ_KIT_FORMS`, `ZONE_LOOKS`, `CALM_TERRAIN`, `TERRAIN_RULES`)
and from the renderer. The whole catalogue (2,269 rows, 49 groups) was dumped to `/tmp/claude-0/agartha-reader/c3.txt` (one line a row,
with how many times each key is placed across all rooms' `props` + `terrain.features`) and read end to end. "×N" below = times placed today.
Sizes: `hN` = height in m, `sN` = span (longest side) in m. Keys are copied exactly.

## TOP SUMMARY (best finds)

1. **ONLY A PROC ROW GIVES REAL LIGHT.** A catalogue `light` makes a point light only on a `proc` row (three-renderer.js:84324); a model (file)
   row such as `brazier`, `campfire`, `ship_lantern`, `fae_mushroom`, `fae_toadstool` draws its `glow` halo and NEVER a light. Ten prop
   lights a room (`HQ_PROP_LIGHT_MAX`, three-renderer.js:69776; ceiling lamps win when over, :84413-84431), `noLight: true` on a row = flame and
   halo only, no slot taken. To light a model prop: put `light_glow` (proc `glow_light`, no body; data.js, search `light_glow:`) beside it with the row's own
   `light: {color, intensity, dist, y}`. District-wide light = `shell.suns` (four at most, three-renderer.js:100181): the live Agartha room
   already hangs one blue-white sun at the Spire (`{x:5.25,y:19.5,z:-26.25,color:11070719,intensity:1.7,dist:110}`).
2. **CRYSTALS:** `crystal_cluster` (proc, h1.4, its own row `h` grows it, a REAL light, ×155) is the glowing crystal; each placed cluster
   picks a random gem colour (ruby, sapphire, emerald, amethyst, diamond, quartz, rose, smoky, citrine, topaz, aquamarine, garnet, lapis;
   three-renderer.js:10963, :81312) so a colour cannot be pinned, but the row's `light` can set the light's colour. `meshy_crystal_shards`
   (h0.8, ×83) and `meshy_crystal_shard` (h0.6) are model crystals (glow none). The SPIRE is code: `arch` parts `s: 'cyl'` with `key: 'crystal'`,
   `tint`, `glow` 0.5-1.5 and a taper `r2` (live row `cav:spire` in `site_prebuilt_hollow_earth_ow_agartha`). `crystal_chandelier` (h1.4, ceiling, glow).
3. **THE CITY'S MARBLE + TEMPLE KIT exists:** `temple_dome` (proc, s14, a marble dome on a ring of columns, lit within, REAL light),
   `greek_column` (h3.6, ×255), `god_statue` (white marble god, h3.5), `angel_statue`, `marble_bust`, `stone_urn`, `greek_amphora`,
   `tripod_bowl`, `stone_altar` (proc), `fountain` (proc, real light), `pearly_gate` (s4.2, glows), `decor_stone_arch` (h3.5),
   `floating_orb` (proc, plinth + ring + orb, strong light), `sword_stone`. Observatory: `brass_telescope`, `telescope`, `star_projector`
   (proc, glow), `star_dome` (ceiling), `star_chart`, `brass_orrery`, `astronomical_clock`, `giant_hourglass`, `meteorite_plinth`, `solar`.
4. **MACHINE ELVES have a kit:** `thoughtform` (proc, a breathing sphere in one of five colours, REAL light), `dream_eye`, `impossible_stair`
   (proc, marble treads on a cloud), `dream_screen`, `mobius_bar`, `ew_cube_piece`, `holo_projector`. Nordic: `ship_nordic` (s12, ×0).
5. **HORROR CAVE KIT is deep:** `skull_pile` ×117, `skull` ×154, `femur`, `ulna`, `cattle_skull`, `psx_fish_skeleton_mp_1`, the Halloween
   bodies and parts (`hw_body`, `hw_body_rising`, `hw_part_1`..`_9`), `hw_web`/`psx_cobweb_*`, `spider`, `rat`, `bat_black/brown/grey`,
   `goo_tendril` (proc, a black tendril that sways), `nightmare_bloom` (proc, petals of teeth, red light), `meshy_black_blob`,
   `hooded_statue`, `weeping_angel`, the traps (`trap_bear_open`, `trap_spike_pit`, `trap_trip_wire`, `trap_iron_maiden`), `wall_chains`,
   `cell_bars`, `meat_hook`, `anthill` + `ant_queen` (the only "nest"). Gore decals: `blood` (only in a horror zone).
6. **OLD CAMP / MINE kit is complete:** `canvas_tent`, `camping_tent`, `lean_to`, `sleeping_bag`, `backpack`, `cot`, `campfire` /
   `meshy_campfire_ring`, `kettle`, `firewood_stack`, `mine_cart`, `rail_section` (3.5 m of track), `pickaxe`, `ore_heap`, `head_wheel`,
   `chain_hoist`, `cable_drum`, `wooden_ladder`, `manhole_ladder`, `locker` (the MINE locker, `ebd_mine_locker`), `bare_bulb` (proc, real
   light, sways), `railway_lantern`, `cage_lamp`, `lantern_post`, `item_police_barricade`, `warning_tape`, `trail_sign`, crates and barrels.
7. **WALK-IN BUILDING RECIPE (section 9):** one `texbuilding` row with `hollow: true, skin: false` (the walls you bump, the doorway, the roof
   slab, a swinging `leaf_*` in the door) + one `arch` row of drawn parts (the look, inside and out) + prop rows inside. Katana's
   bake-katana.js:113-117 is the cleanest template; doors inside a big building = a `doorsOnly` carrier row with `inner: [...]`.
8. **SURFACES:** `marble_light` (Pale Marble, the white terraces; the live Agartha already uses it), `crystal` (the periwinkle crystal sheet,
   and as a FLOOR it is the battle's Crystal Formation: +1 vision, 15 % MP back at turn end), `obsidian`, `gold` (= gilt.png, the ONLY gold:
   mondo bans the gold_*.png files), `cave_floor`, `cave_wall`, `rocks_5`, `rocks_dark_fantasy`, `dungeon_3` (mine brick), `brokenglass`,
   the horror pack `hz_stone_01`..`_14` (wet black rock 01/02, pale drowned 05, marble-ish 06/12, grey 11), `hz_misc_05` (the Astral crystal
   cliffs), the urban `GlassGeneric*`, `WoodBeams*` (mine timber), `MetalGeneric*`. The Cavern zone LOOK swaps `cave_wall`, `rocks_5`,
   `rocks_dark_fantasy`, `rock_wall_2`, `dungeon_3` for horror sheets at load (data.js `ZONE_LOOKS.zones.cavern`): write the plain keys, the zone does the rest.
9. **NEEDS A MODEL:** stalagmite / stalactite pieces (only code cones), a creature NEST (eggs, a woven nest, egg sacs), a big crystal geode,
   mine timber supports (no model: draw them as `arch` boxes), a miner's helmet / carbide lamp, a survey theodolite, a dead explorer, a crystal
   guardian statue, a marble Agarthan gate, a crystal throne. Details in section 11.

## 1. CITY ARCHITECTURE (marble terraces, halls, temple, observatory, gates)

Columns, arches, gates
- `greek_column` · h3.6 · Meshy Greek column, block · ×255 (the live Agartha rooms use 45 + 10)
- `papyrus_column` · h6 · Egyptian bundle column with a bud capital · ×11
- `fallen_column` · s5 · a fallen column in three pieces (ruin) · ×4
- `metro_column` · h4 · the metro's plain column · ×8
- `concrete_pillar` · h2.7 · proc concrete pillar · ×15
- `t_pillar` · h4.6 · proc Gobekli T-pillar with a relief arm (row `h` scales) · ×71
- `decor_stone_arch` · h3.5 · a stone archway · ×2
- `brick_arch` · h3.2 · a brick arch section · ×3
- `pearly_gate` · s4.2 · ornate white gate, glows warm white · ×5
- `trilithon` · s6.4 · two standing stones and a lintel · ×19
- `obelisk` · h7 · stone obelisk · ×26
- `ancient_walkway` · s6 · a carved ancient walkway slab · ×2
- `psxg_iron_gate_1` / `_2` · h2 · graveyard iron gates · ×3 / ×2
- `hw_fence_iron` · h2.73 · tall iron railing (also `_2`, `_3`) · ×18
- `castle_wall` / `castle_tower` / `castle_gate` / `castle_cone` / `castle_tower_top` · h2 · the Castles and Forts kit (node pieces) · ×449 / ×32 / ×4 / ×4 / ×8
- `vatican_dome` · h12 · a Meshy church dome, block · ×0
- `temple_dome` · s14 · proc: marble dome on a ring of columns over a vault door, lit from within (REAL light) · ×3
- `italian_building` / `italian_building_2` · s12 · Meshy Italian houses, solid · ×0
- `church_building` · s20 · Catholic church, solid · ×2 (not for Agartha)

Statues and monuments
- `god_statue` · h3.5 · white marble bearded god in a toga · ×20
- `angel_statue` · h2.8 · angel statue · ×97
- `marble_bust` · h1.7 · marble bust on a stand · ×37
- `hero_statue_landing` · h3 · a hero statue (landing pose) · ×2
- `hero_statue_crossed` · h3.4 · a hero statue (arms crossed) · ×2
- `lion_statue` · h1.5 · the PSX lion as stone (`statue` tint) · ×28
- `pharaoh_statue` · h4 · sandstone pharaoh · ×5
- `kt_stone_buddha` · h1.8 · stone Buddha · ×2 (Katana, probably wrong place)
- `demon_statue` · h3.4 · demon statue (horror) · ×23
- `hooded_statue` · h2.2 · faceless hooded stone figure · ×26
- `weeping_angel` · h2 · weathered weeping angel · ×4
- `owl_statue` · h10 · giant owl statue · ×2
- `lady_justice` · h1.9 · statue of justice · ×3
- `sphinx` · s20 · the Great Sphinx · ×1

Water, gardens, terraces
- `fountain` · h2 · proc fountain, cool light (REAL) · ×25
- `garden_ring` · h0.7 · proc gravel ring with a hedge (registers its own blockers; place at its centre) · ×11
- `planter` · h0.5 · proc raised bed · ×397
- `bird_bath` · h0.9 · stone bird bath · ×3
- `sundial` · h1 · garden sundial · ×3
- `stone_urn` · h1.05 · stone urn · ×172
- `greek_amphora` · h1.05 · amphora · ×73
- `infinity_pool` · h0.48 · proc pool edge · ×1
- `riser_1` / `riser_2` / `riser_3` · h0.3 / 0.6 / 0.9 · proc steps (8.4 m wide, a ramp) · ×46 / ×12 / ×2
- `stair_step`, `stair_landing`, `stair_landing_sq` · h0.25 · proc steps and landings · ×14 / ×2 / ×2
- `impossible_stair` · s7 · proc: four flights round a square, marble treads on a cloud, turning (machine elves) · ×2
- `iron_garden_bench` · s1.6 · wrought iron bench · ×95
- `park_bench` · h0.85 · proc park bench · ×243
- `city_bench` · s1.7 · a city bench · ×210

Halls, library, throne room, homes
- `library_shelf_full` · h2.6 · shelf full of books · ×239
- `library_shelf` · h2.6 · shelf (PSX) · ×57
- `library_ladder` · h3 · rolling library ladder · ×11
- `library_chandelier` · h1.1 · library chandelier, glows · ×7
- `card_catalog` · h1.3 (model) / `card_catalogue` · h1.9 (proc wall unit) · ×6 / ×4
- `lectern` · h1.15 · the church podium as a lectern · ×44
- `royal_throne` · h1.9 · royal throne, seat · ×31
- `holy_tapestry` · h5 · ornate carpet hung on a wall · ×17
- `holy_carpet` · s6 · ornate carpet on the floor · ×3
- `floor_runner` · s3 · woven red runner · ×8
- `banner` · h2.6 · proc wall banner, sways · ×20
- `stained_glass` · h3.2 · stained glass window on a wall, glows (could read as a crystal window) · ×23
- `decor_organ_pipe_white` · h3 · a white organ pipe (rows of them = an organ / crystal pipes) · ×19
- `decor_piano` · h1.3 · piano · ×11
- `instrument_harp` · h1.4 · harp · ×23
- `lyre` · h0.7 · lyre · ×4
- `round_table` · h1.25 · proc round table · ×3
- `trestle_table` · s3.5 · long rough table with benches · ×6
- `psx_table_large_2` / `psx_table_large_3` · h0.96 / 0.91 · big tables · ×22 / ×10
- `psx_dinner_table_1` · h0.86 · dining table · ×51
- `conference_table` · s3.2 · black oval table (modern, not Agarthan) · ×21
- `greek_couch` · s2 · Greek reclining couch · ×6
- `wingback_chair` · h1.15 · wingback chair · ×20
- `chesterfield_sofa` · s2.2 · chesterfield · ×6
- `royal_bed` · s2.4 · royal bed · ×4
- `couples_bed` · s2.1 · double bed · ×7
- `psx_bed_1`, `psx_bed_4_1`.., `psx_bed_5_1`.. · h0.96-1.27 · PSX beds · ×19 ...
- `psx_wardrobe_mp_1` · h2.1 · wardrobe · ×33
- `psx_bedside_table_1` · h0.64 · bedside table · ×48
- `psx_display_cabinet_mp_1` / `_2` · h2.1 · glass display cabinet · ×19 / ×5
- `museum_vitrine` · s1.6 · museum vitrine · ×6
- `specimen_shelf` · h1.65 · specimen jars shelf · ×7
- `cheval_mirror` · h1.8 · gilded standing mirror · ×5
- `hookah` · h0.8 · brass hookah · ×3
- `bird_cage` · h1.9 · bird cage · ×12
- `woven_baskets` · s1 · three wicker baskets · ×46
- `fur_rug` · s2.2 · bear skin rug · ×16
- `rug_round` · s1.5 · round rug (lay) · ×71
- `shag_rug` · h0.03 · proc shag rug · ×13
- `potted_plant` / `office_plant` · h1.25 / 1.1 · potted plants · ×161 / ×41
- `trophy_case` · h2.1 · proc lit trophy case on a wall · ×7

Observatory
- `brass_telescope` · h2 · brass telescope on a stand · ×43
- `telescope` · h1.6 · telescope · ×23
- `star_projector` · h1.7 · proc planetarium projector, cool glow · ×13
- `star_dome` · h0.4 · proc star dome (ceiling) · ×3
- `star_chart` · h1.5 · proc star chart on a wall · ×11
- `brass_orrery` · h0.85 · brass orrery · ×6
- `astronomical_clock` · s1.8 · astronomical clock · ×5
- `giant_hourglass` · h1.8 · giant hourglass · ×11
- `meteorite_plinth` · h1.2 · a meteorite on a plinth · ×3
- `solar` · s4 · Meshy solar system model · ×0
- `dish` · h2.45 · satellite dish · ×17; `cyber_dish` · h2.4 · ×2
- `map_table` · s2.2 · map table · ×20

## 2. CRYSTALS AND GLOW

- `crystal_cluster` · h1.4 (row `h` grows it) · proc gem cluster, random gem colour a placement, glow + REAL light 0x9ff0d0 (row `light`
  overrides) · ×155. The live Agartha rooms use it 14 times (crystalcity) and the Cavern 9.
- `meshy_crystal_shards` · h0.8 · Meshy crystal shards, no glow · ×83 (48 in the live `..._ow_agartha`)
- `meshy_crystal_shard` · h0.6 · one Meshy shard · ×16
- `crystal_chandelier` · h1.4 · crystal chandelier (ceiling), glow · ×27
- `crystalBall` · h0.3 · crystal ball · ×5
- `floating_orb` · h1.9 · proc plinth + ring + an orb that bobs, strong REAL light (1.3, 12 m, blue) · ×29
- `thoughtform` · h2.3 · proc breathing sphere, a white core, a ring and a halo; five colours; REAL light · ×29
- `dream_eye` · h1.6 · proc eye on a stalk that blinks at you · ×21
- `light_shaft` · h1 · proc god-ray beam (usually `DOOR_HQ.lightShafts`) · ×5
- `sword_stone` · h1.7 · proc sword in a stone, cool REAL light · ×2
- `iso_tank` · h1.3 · glowing sleeper casket · ×62; `meshy_molten_cryo_tube` · h2.2 · lit cryo tube · ×14; `pod_bed` · h1 · proc lit pod bed, REAL light · ×3
- `meshy_tesla_coil` · h2.5 · tesla coil · ×12
- `anemone` · h0.5 · proc glowing anemone · ×24; `giant_clam` · h0.7 · proc clam with a glowing pearl · ×17
- `woods_glowcap` · h0.7 · glowing mushroom (model, glow only) · ×176
- `woods_gasplant` · h1.1 · glowing gas plant (glow only) · ×17
- `fae_mushroom` · h3.5 · giant glowing mushroom (model: glow only, its `light` is ignored) · ×12
- `fae_toadstool` · h1.75 · glowing toadstool (glow only) · ×68
- `mushroom_lamp` · h0.52 · proc mushroom lamp, REAL light · ×18
- `lava_lamp` / `lava_lamp_floor` · h0.46 / 1.56 · proc lava lamps, REAL light · ×14 / ×16
- `ocean_bioluminescent_jelly` · h1.3 · a glowing jellyfish that drifts (hover) · ×26 (an odd, lovely cave-air touch)
- `firefly` · s0.03 · firefly model · ×9
- Code-built crystals: `arch` parts `{s:'cyl', r, r2 (taper, 0.1 = a point), h, seg: 5-6, key:'crystal', tint, glow}` and `{s:'dome'}`
  (the live Spire `cav:spire`; the Cavern's inner sun is a `dome` pair with `glow: 0.8`).

## 3. CITY FURNISHING (temple, homes, market, people's things)

Temple and ritual
- `stone_altar` · h0.95 · proc stone altar · ×48
- `candle_ring` · h0.3 · proc ring of candles, REAL light · ×80
- `candleRing` / `candleLine` / `candle` · s1.2 / s0.8 / h0.3 · Meshy lit candles (glow none) · ×10 / ×3 / ×38
- `lit_candle` · h0.3 · thick candle on an iron dish · ×26
- `candelabra` · h1.8 · standing candelabra · ×42
- `votive_stand` · h1.3 · votive candle stand · ×13
- `tripod_bowl` · h1.4 · bronze tripod bowl · ×13
- `item_censer` · h0.3 · censer · ×11
- `brazier` · h1.3 · brazier (MODEL: glow only, no light) · ×356
- `ritual_circle` · h0.01 · proc faintly lit sigil on the floor · ×8
- `gong` · h1.8 · bronze gong in a frame · ×8
- `bell_frame` · h2.5 · iron bell in a frame · ×3
- `kt_temple_bell` · h1.8 · Japanese temple bell · ×1
- `item_wizard_staff` · h1.8 · staff · ×2; `item_ward_totem` · h1.6 · ×12; `item_potion_flask` · h0.2 · ×11
- `cauldron` · h0.8 · black cauldron · ×25

Market, kitchen, workshop
- `market_stall` · s3 · cloth-awning stall · ×11
- `stock_pots` · s0.9 · ×28; `teapot` · s1 · ×13; `teacups` · h1.2 · ×10; `item_drinking_cup` · ×10; `psx_plate_mp_1` · ×24
- `wooden_barrel` · h1 · ×314; `woven_baskets` · ×46; `meshy_burlap_sack` · h0.7 · ×142
- `forge` · s1.8 · blacksmith forge · ×3; `anvil` · h0.85 · ×6; `bellows` · s1.3 · ×3; `grindstone` · h1.1 · ×6
- `tool_chest` · h1.45 · ×25; `tool_pegboard` · s1.6 · ×17
- `lab_glassware` · s0.55 · ×10; `microscope` · h0.45 · ×9; `fume_hood` · h2.3 · ×5 (an Agarthan lab)

## 4. CAVE ROCK

- `cave_stone` · s0.9 · Meshy standing stone used as cave rock (a scatter favourite) · ×675
- `psxg_rock_1` · h0.74 (block) · `psxg_rock_2` · h0.49 · `psxg_rock_3` · h0.43 · `psxg_rock_4` · h0.23 · graveyard pack rocks · ×621 / ×764 / ×384 / ×583
- `rf_rock_1` · h1.41 · `rf_rock_2` · h1.66 · `rf_rock_3` · s3.5 · `rf_rock_4` · s3.3 · Retro Foliage kit rocks (3 and 4 are big boulders) · ×19 / ×16 / ×72 / ×1
- `ocean_rock` .. `ocean_rock_11` · h0.5-2.6 · Ocean pack rocks (`ocean_rock_3` h2.6 and `ocean_rock_4` h2.4 are the big ones) · ×27 .. ×3
- `hw_stone` .. `hw_stone_5` · h0.72-1.26 · Halloween pack stones · ×20 .. ×11
- `lake_rock` · s1.5 · smooth pale granite boulder · ×128
- `asteroid_a` / `asteroid_b` · s4 · 4 m rock chunks (the Cavern uses them as boulders) · ×20 / ×15
- `menhir` · h2.6 · ×177; `sarsen` · h3.4 · ×83 · standing stones
- `ore_heap` · s2 · coal and ore heap · ×6
- `cairn` · h1.2 · trail cairn · ×183
- `meshy_giant_foot` · h2.5 · a giant stone foot (a broken colossus) · ×2
- `dinosaur_skeleton` · s6.4 · ×7 (the Cavern has one: a fossil wall)
- A `scatter` row (`{k:'scatter', key:'cave_stone', n, seed}`) scatters a ROCK MODEL key; never a sheet (data.js zone looks note).
- Stalactites: code cones under a closed ceiling when `terrain.gen.kind === 'cave'` or `gen.look === 'rock'`, or `terrain.stalactites: true`
  (three-renderer.js:75933). The live Agartha room sets `stalactites: false`.

## 5. HORROR CAVE (the Descent: bone pits, the nest, dead things)

Bones and the dead
- `skull_pile` · s1.3 · a pile of skulls, block · ×117
- `skull` · h0.22 · one skull · ×154
- `femur` · s0.45 · ×17; `ulna` · s0.28 · ×8; `cattle_skull` · s0.7 · ×145; `psx_fish_skeleton_mp_1` · s0.52 · ×23
- `anatomy_skeleton` · h1.9 · a standing skeleton · ×10
- `hw_body` / `hw_body_2` · h0.32 · a wrapped body lying · ×14 / ×10
- `hw_body_rising` / `hw_body_rising_2` · h0.92 / 0.77 · a body clawing out of the ground · ×5 / ×1
- `hw_part`, `hw_part_1` .. `hw_part_9` · h0.12-1 · body parts · ×4 .. ×16
- `astronaut` · h2 · a dead astronaut (an explorer stand-in) · ×2
- `sarcophagus` · s2.3 · ×46; `psxg_coffin` · ×6; `hw_coffin` / `_2` · ×7 / ×4; `trap_coffin_wood` · ×8; `trap_coffin_open` (proc) · ×5
- `psxg_dirt_grave` · h0.19 · ×24; `psxg_tombstone_1..3` · ~h1.1

Webs, creatures, things that move
- `hw_web` / `hw_web_2` / `hw_web_3` · s1.1-1.2 · spider webs · ×10 / ×5 / ×2
- `psx_cobweb_1` / `_2` / `_4` / `_5` · h0.8 · corner cobwebs (decals pack) · ×55 / ×18 / ×9 / ×5
- `spider` · s0.35 · a big hairy wolf spider · ×19
- `rat` · h0.12 · ×58; `bat_black` / `bat_brown` / `bat_grey` · s0.45 · proc bats · ×33 / ×30 / ×25; `crow` · ×158; `raven_perch` · ×10
- `scorpion` · ×4; `cobra` · ×1; `rattlesnake` · ×3; `lizard` · ×5; `meshy_frog` · ×36
- `ant`, `ant_leaf`, `ant_queen`, `anthill` · insects (the queen + anthill = the nearest thing to a nest) · ×27 / ×20 / ×2 / ×11
- `ocean_eel` · ×14; `ocean_anglerfish` / `_dim` / `_jaws` (lit lure) · the sump's fish · ×9 / ×6 / ×4
- `goo_tendril` · h3.2 · proc black tendril with venom at the tip, sways · ×23
- `nightmare_bloom` · h1.9 · proc flower whose petals are teeth, red REAL light · ×10
- `meshy_black_blob` · h1 · a black blob · ×0
- `tentacle` / `tentacle2` · h6 · kraken tentacles · ×0 (great out of a black sump)

Traps, chains, cages
- `trap_bear_open` / `trap_bear_shut` · s0.75 · ×8 / ×3
- `trap_spike_pit` · s2.8 · spike pit · ×0
- `trap_trip_wire` / `_broken` · s1.75 · ×3 / ×1
- `trap_iron_maiden` · h2.2 · ×2; `trap_pressure_plate` · ×1; `trap_dart_hole` / `trap_spear_hole` (proc) · ×0
- `wall_chains` · s1 · chains draped on a wall · ×65; `trap_chain_draped` · ×7
- `cell_bars` · h2.4 · proc bars · ×11; `stocks` · ×16; `meat_hook` · h1.7 · proc hook from the ceiling, sways · ×6
- `cage_wagon` · s4.5 · ×4 (a cage)

Dead wood
- `dead_snag` · h4.6 · ×87; `hollow_dead_tree` · h5 · ×20; `meshy_dead_tree_with_a_dark_hole` · h5 · ×1
- `psxg_dead_tree_1` / `_2` · h3.64 / 4.51 · ×13 / ×11; `burnt_tree` · h6 · ×26; `hw_tree` .. `hw_tree_5` · h4-7
- `psxg_dead_bush_1` / `_2` · h1.17 / 0.77 · ×747 / ×282
- `fallen_log` · s3.6 · ×378; `stump` · h0.6 · ×324; `rf_birch_dead_1..3`, `rf_willow_dead_1/2`, `rf_pine_fallen_1..5`, `rf_oak_fallen_1/2` · ×0

Atmosphere props
- `chimney_smoke` · h0.3 · proc rising smoke (vents, a fire's smoke) · ×75
- `floor_stain` · h0.01 · proc stain · ×155
- `sea_vent` · h2.4 · proc black smoker chimney with a glow, REAL light · ×19

## 6. OLD CAMP / MINE (the abandoned explorers' camp, the Lemuria adit)

Camp
- `canvas_tent` · h2.4 · 1800s canvas wall tent · ×68
- `camping_tent` · s3.2 · modern dome tent · ×34; `meshy_camping_tent` · s2.4 · ×2
- `lean_to` · s3 · survival lean-to · ×2
- `sleeping_bag` · s2 · ×27; `cot` · s1.9 · ×111; `psx_old_mattress_mp_1` · h0.2 · ×31; `psx_pillow_mp_1` · ×20
- `backpack` · h0.75 · expedition backpack · ×48; `footlocker` · s0.85 · ×49; `sea_chest` · h0.7 · ×126
- `campfire` · s1.5 · campfire (MODEL: glow only) · ×90; `meshy_campfire_ring` · s1.2 · stone ring, no fire · ×61
- `hearth_fire` · h1.5 · proc volume fire with logs, REAL light (row `w` x `h` sizes it) · ×42; `hearth_fire_blue` / `_white`
- `kettle` · h0.3 · ×53; `wood_stove` · h1.6 · ×13; `firewood_stack` · s2 · ×124; `axe_chopping_block` · ×19
- `picnic_table` · s2 · ×54; `map_table` · s2.2; `field_radio` · h0.45 · ×18; `item_walkie_talkie`; `psx_walkie_talkie_1` · ×9
- `psx_flashlight_1` · h0.27 · ×11; `item_binoculars` · ×11; `item_flare_gun` · ×2; `psx_dosimeter_1` · ×6
- `psx_canned_food_mp_1..5_rusty` · h0.17 · ×17 ..; `psx_tin_can_mp_1_rusty` · ×37; `psx_glass_bottle_1/2` · ×50 / ×38; `psx_jerrycan_1` · ×42
- `stretcher` · s2.1 · ×9; `psx_bandage_mp_1` · ×6; `meshy_syringe`, `psx_syringe_mp_1`
- `trail_sign` · h2.2 · ×44; `signpost` · h2.2 · ×175; `prayer_flags` · s4 · ×17 (Agartha's way in?)
- `sieve_table` · s1.6 · archaeology dig sieve · ×1
- `meshy_rope` · s0.6 · ×46; `rope_coils` · s1.2 · ×24; `meshy_sandbags` · h0.8 · ×54
- `psx_wooden_crate_1..6` · h0.36-1.08 · ×75 / ×80 / ×95 / ×33 / ×17 / ×22; `psx_supply_crate_1*` · h0.37 · ×62 ..; `cardboard_boxes` · h0.95 · ×191
- `psx_metal_barrel_mp_0..3` · h1.08 · ×70 / ×85 / ×86 / ×36; `radiation_drum` · h0.9 · ×23
- `generator` · s1.33 · ×9; `cable_drum` · h1.4 · ×46

Mine
- `mine_cart` · s2.4 · rusty ore wagon on a short track · ×13
- `rail_section` · s3.5 · 3.5 m of track (one square) · ×133
- `buffer_stop` · s2 · ×8; `hand_car` · s2.5 · pump trolley · ×1
- `pickaxe` · s0.9 · ×22; `ore_heap` · s2 · ×6; `wheelbarrow` · s1.5 · ×45; `hand_cart` · s2.2 · ×12
- `head_wheel` · h5 · mine head frame pulley · ×2; `chain_hoist` · h2 · ×9
- `wooden_ladder` · h3 · ×12; `manhole_ladder` · h3.5 · iron ladder up a shaft · ×3; `library_ladder` · h3
- `locker` · h1.85 · the MINE locker (`ebd_mine_locker`) · ×127
- `item_police_barricade` · s2 · ×137; `warning_tape` · h0.01 · proc · ×83; `radiation_sign` · ×49
- Climbs: `{k:'climb', x, z, face, look, y0?, y1?}`, `look` one of `'ladder'|'rope'|'vine'|'chain'|'pipe'|'wall'|'fireescape'`
  (data.js, "THE CLIMB (AREA_CONTENT_PLAN §4" + `HQ_CLIMB_LOOKS`). Cliffs + ladders in the Descent are climb rows, no model needed.

## 7. LIGHTS (and how a prop gives real light)

- THE RULE (three-renderer.js:84321-84327): only a `proc` catalogue row makes a `THREE.PointLight` from its `light: {color, intensity, dist,
  y, night?}`, scaled by the room's `shell.lampK`. A row's own `light` / `glow` objects override the catalogue's (proc rows only).
  `noLight: true` on a row = no light (flame + halo stay) and no slot. A model row's `light` field is IGNORED (its `glow` sprite stays).
- THE BUDGET: `HQ_PROP_LIGHT_MAX = 10` (three-renderer.js:69776); when more rows ask, ceiling rows (`ceil`) win, then row order (or the
  ones nearest the battle board). A battle reserves 4 (`HQ_BATTLE_ROOM_LIGHTS`, :97055). Hell's pass spends them on purpose (areas-complexes.md:13589).
- BIG LIGHTS: `shell.suns: [{x, y, z, color, intensity, dist, decay}]`, four at most, outside the ten (three-renderer.js:100181).
- ROOM MOOD: `shell.mood: {light, ambient, hero}`, `shell.fog`, `shell.look` (retro amber preset), `shell.atmos.zones` (motes / dust
  boxes), `DOOR_HQ.lightShafts` rows (god rays). Copy the live Cavern / `..._ow_agartha` shells.
- Proc rows WITH real light (the ones worth a slot): `cave_torch` (h1.9, warm, ×344), `torch_blue`, `torch_red`, `torch_white`, `torch_green`
  (the same torch, one-hue flame), `wall_torch` (h1.1 on a wall), `hearth_fire`, `hearth_fire_blue`, `hearth_fire_white`, `candle_ring`,
  `bare_bulb` (ceiling, sways), `crystal_cluster`, `floating_orb`, `thoughtform`, `nightmare_bloom`, `fountain`, `temple_dome`,
  `sword_stone`, `sea_vent`, `boiler`, `mushroom_lamp`, `lava_lamp`, `lava_lamp_floor`, `sputnik_lamp`, `saucer_pendant`, `disc_cluster`,
  `grow_lamp`, `tiki_torch`, `flood_mast`, `light_glow` (NO body: a bare light).
- Model lights (glow halo only, no light): `brazier`, `campfire`, `ship_lantern` (ceiling, sways), `railway_lantern`, `lantern_post`,
  `iron_lamp_post`, `cage_lamp`, `oil_lamp`, `lit_candle`, `string_lights`, `paper_lantern`, `crystal_chandelier`, `library_chandelier`,
  `banker_lamp`, `globe_lamp`, `stone_lantern`, `kt_stone_lantern`, `fae_mushroom`, `fae_toadstool`, `woods_glowcap`.
- Arch parts glow: any part `glow: 0..1` (a lit sheet, the Spire); `kind: 'glass'`; `shine` (polished).

## 8. SURFACE / MATERIAL KEYS

How keys resolve (three-renderer.js:69807 `_hqTex`): `DOOR_HQ.textures` (his painted sheets) first, then `TERRAIN_SPRITES` (sprites.js:7770),
then `urban:<Name>` (URBAN_TEXTURES, sprites.js:8069-8240), then the calm / horror / moving sheets of `CALM_TERRAIN.sheets` (data.js `var CALM_TERRAIN`).
A FLOOR key carries its battle rules (`TERRAIN_RULES`): a field fight on it plays by them.

DOOR_HQ.textures (his painted sheets; never remap these in a zone look): `terrazzo` (mid-century terrazzo floor), `stone` (speckled hallway
stone), `oxblood` (aged oxblood plaster), `teal` (aged teal metal trim), `ceiling` (acoustic ceiling panel), `concrete` (aged cracked
concrete), `drywall` (beige office drywall), `carpet` (taupe office carpet). None fit Agartha.

Marble / white stone
- `marble_light` · Pale Marble, the polished white sheet (darkened once at load to 0.75 so its veins survive) · `marble`, `marble_2` = the same sheet
- `calm_marble` · Marble (calm sheet) · `calm_marblemint` · Mint marble · `calm_checker` · Marble checks · `checkerboard` / `_2` / `_3`
- `urban:TileMarble1a` .. `3d` · marble floor tiles · `urban:ConcreteMoulding*` / `urban:PlasterMoulding*` · mouldings
- `hz_stone_06` (the Bug nest's marble), `hz_stone_12` (Camelot's marble), `hz_wall_01` (travertine / cream, Vatican, Astral), `hz_stone_05` (drowned pale stone)
- `sky_ruin` · Celestial Ruins · `sanctuary` · Sanctuary (both pale)

Crystal / glass
- `crystal` · the periwinkle glassy crystal sheet (crystal_blue.png); as a floor = Crystal Formation (+1 vision, +15 % MP at turn end)
- `calm_crystal` · Crystal (calm sheet) · `hz_misc_05` · the Astral islands' crystal cliffs
- `diamond` · Diamond Plate (it is a metal plate, NOT a gem) · `brokenglass` · Broken Glass
- `urban:GlassGeneric1a` .. `3b`, `urban:GlassGenericBroken1..4`, `urban:GlassWindow*` (with `-Glow` lit twins)
- wall rows `glass: true`; arch part `kind: 'glass'`; ramp `railing: 'glass'` (live in `..._ow_agartha`)
- liquids as glassy floors: `urban:Liquid_Blue_01..08`, `nz_dreamwater` (moving), `healing_spring` (heals x2, 15 % HP)

Gold / metal
- `gold`, `gold_2`, `gold_3` · ALL = gilt.png (Metal007), three warmths; THE ONLY GOLD (never load gold*.png by name; pack-claims.md) · `calm_gilt`
- `copper` · `calm_copper` · `metal` (Metal Grate) · `gunmetal` · `aluminium` · `metal_3` (blued steel) · `urban:MetalGeneric*`, `urban:MetalPanel*`, `urban:MetalBeams*`
- `hz_metal_01` .. `_14` (rust; 06 / 09 used in the sewers)

Cave rock / dark stone
- `cave_floor` (Cave Floor) · `cave_wall` (Cave Wall) · `rock_wall_1` · `rock_wall_2` (= cave_wall sheet) · `rocks_1` .. `rocks_5` (rocky,
  stony, boulders, craggy; `rocks_5` = the cliff sheet, `cliff`, `stone`) · `rocks_dark_fantasy` (Dark Rocks) · `obsidian` (Obsidian Floor)
- `calm_cavefloor`, `calm_darkrock`, `calm_rock`, `calm_obsidian` (lava veins), `calm_obsidian_plain`, `calm_darkstone`, `calm_rubble`
- `hz_stone_01` / `hz_stone_02` (wet black rock: the Cavern zone's walls / cliffs), `hz_stone_07` (grey-brown rock), `hz_stone_10` (scorched
  red-brown, Hell), `hz_stone_11` (grey, Stonehenge), `hz_stone_03` (lichen grave stone)
- `chasm` (Rift Chasm, cost 2) · `void` · `nexus_cave` (Abyssal Wellspring) · `fog_wall` (Darkness)
- `mushroom` (the Giant Mushroom terrain: rock sheet, blocks ranged)
- `urban:GroundPebbles1a` .. `2b`

Mine timber, old masonry
- `dungeon`, `dungeon_2`, `dungeon_3`, `dungeon_4` (`dungeon_3` = the Cavern mine's brick, zone-looked to `hz_brick_11`) · `calm_dungeon`
- `urban:WoodBeams1a` .. `2d` (timber beams: mine props, frames) · `urban:WoodPlywood*` · `urban:WoodCrates*` · `wood`, `wood_planks`, `calm_planks`
- `bricks_1` .. `bricks_3`, `cobblestone`, `cobblestone_2`, `calm_flagstone`, `calm_sandstone`, `ruins`, `rubble_1` .. `_4`
- `hz_brick_01` .. `_14` (11 = mine, 09 / 10 = damp stone blocks), `hz_floor_01` .. `_14` (13 = worn flags)

Ground under plants, water
- `grass_dark_fantasy` (Dark Grass), `dirt_2`, `dirt_4`, `dark_woods`, `purple_grass`, `flesh` (Flesh, for a nest floor), `swamp` (Black Ooze,
  black-violet, cost 2), `oil` (brown), `nz_oil` (Oil, blue-black, moving), `deep_water`, `water`, `purple_bog`, `poison`, `blood`
- A black-water sump = a `pool` / `stream` row with `key: 'swamp'` or `'nz_oil'` or `'deep_water'` (the liquid styles, three-renderer.js:3470).

THE ZONE LOOK (data.js `ZONE_LOOKS.zones.cavern`): the `cavern` zone (rooms: `site_prebuilt_hollow_earth_cavern`, `..._ow_agartha`, `..._ow_west`, `..._ow_long`,
`..._ow_tunnelway`) renames at load `rocks_5`->Stone_02, `cave_wall`/`rock_wall_2`/`rocks_dark_fantasy`->Stone_01, `dungeon_3`->Brick_11,
`urban:ConcreteStriped2c`->Wall_14 (the twin keys `zl_hz_Stone_01__cave_wall` etc. play by the old key's rules), drips + dirt stains;
`byRoom` Agartha: only light drips. A NEW Agartha room must be added to `ZONE_LOOKS.zones.cavern.rooms` (and to ZONE_FLORA `cavern`, climate
`hollow`, `under: true`) by hand.

## 9. HOW A WALK-IN BUILDING IS BUILT (the recipe)

The engine pieces
- `texbuilding` row (data.js "THE SHAPES (EDITOR_PLAN.md" doc block; the walker's rows: `function hqTexBuildingRows`):
  `{ k:'texbuilding', id, seed:1, x, z, w, d, rot, storeys:1, h, skin:false, hollow:true, door?, leaf, leafDouble, keyIn, floorIn }`.
  `hollow` = four thin ghost walls (what you bump), a doorway one face square (1.75 m cell) wide and `HQ_SHAPE_RULES.doorH` = 2.2 m high in
  the FRONT (+z turned by `rot`, degrees clockwise), and the roof slab as a hidden bridge at `storeys x 3.5 m` (or `h`). `door` = which square
  of the front (1 = the left as you face it; none = the middle). `skin:false` = draw no outside (the `arch` row is the look). `keyIn` /
  `floorIn` = inside wall / floor sheets. (data.js "THE INSIDE (2026-10-30" + `function hqTexbDoor`.)
- THE DOOR LEAF (three-renderer.js:76938-76947, `HQ_CITY_DOOR` + `_hqBuildTexDoors`): every hollow texbuilding hangs a swinging catalogue leaf in its doorway
  (`leaf: 'leaf_shabby_wood'`, `'leaf_wooden'`, `'leaf_security'`, ...; default the HQ double glass door; `leaf: 'none'` = a bare doorway;
  a leaf whose catalogue `open` is not `'swing'` falls back to the default). It swings away from the walker. Useful leaves: `leaf_wooden` (frame), `leaf_shabby_wood`, `leaf_barn`,
  `leaf_portcullis` (arch-headed, wide), `leaf_hell_arch` (arch frame), `leaf_vault` (round), `leaf_bulkhead` (round), `leaf_frame_only`,
  `leaf_cell`, `leaf_stable`, `leaf_glass`, `leaf_holographic` / `leaf_futuristic` (SLIDE leaves: the city door refuses them, falls back).
- DOORS INSIDE a big building: a carrier row `{ k:'texbuilding', id:'<id>:doors', x:0, z:0, y:0, w:2, d:2, rot:0, storeys:1, skin:false,
  doorsOnly:true, leaf:'leaf_office', inner:[{x, z, rot, w:1.55, leaf:'leaf_wooden', double?:true, y?}] }` (bake-desert-insides.js:102;
  live in data.js: `id:'aft:vatican:doors'`, `id:'cam:palace:doors'`).
- THE LOOK = an `arch` row (three-renderer.js:76296-76325 doc): `{ k:'arch', id, x, z, rot, y?, parts:[...] }`, parts in the building's frame
  (x along the front, z toward the door at +d/2, y up). SHAPES: `box` size [w,h,d] (faces, keyTop, under), `cyl` r h r2 seg arc ri,
  `dome` r h rz arc, `roof` form `'gable'|'hip'|'pyramid'|'shed'|'barrel'` size over keyEnd, `quad` size [w,h] `hole: [x, w, h]` (a doorway
  cut) or `flat: true`, `poly` pts h, `archw` (a wall with a ROUND-HEADED opening, `hole: [width, springing, x]`, `rise`, `rim`), `sweep`
  (a profile along a path). Common: `key`, `tint`, `glow`, `kind` (`'wall'|'glass'|'over'`), `ds`, `roof: true` (hidden with HIDE ROOFS),
  `uv`, `gain`, `shine`, `n` + `step`, `ring: {n, r, a0}` (a colonnade!), `along` + row `paths` (curved buildings). The arch row is drawn
  only; the walker reads the texbuilding / wall / plateau rows beside it.
- Upper floors: the MODULAR KIT walls with absolute `y0` / `y` (data.js `hqOpeningPieces`, "THE MODULAR KIT: a wall with an absolute foot") and plateau `bld` tiers; Camelot Castle's stacked levels
  (bake-camelot-castle.js header) are the reference for floors over floors.
- Other kit rows: `opening` (a gap in a wall row: `{k:'opening', wall, at, w, h, sill?, glaze?}`), `prefab`, `kit` (`fn` from HQ_KIT_FORMS:
  `hqRoundBlock`, `hqCastleTower` (a round tower with a stair inside: r, t, top, crown, door [a0, a1], doorH, key), `hqCastleCrown`,
  `hqCurtainWall`, `hqRingWalls`, `hqRingBridges` (a ring deck), `hqHelixRamp` (a helix ramp: good for the Spire's climb), `hqStandBowl`,
  `hqGridironMarks`), data.js `const HQ_KIT_FORMS`. `wall` rows gained `keyIn`, `lift` (hung), `glass`.

The template (Katana, bake-katana.js:113-117 and :61-93)
```js
// the collision + door: one texbuilding row
{ k: 'texbuilding', id: 'kat:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true,
  leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: 'urban:PlasterWallStucco2a', floorIn: 'urban:WoodFlooring1d' }
// the look: one arch row, the same x, z, rot
{ k: 'arch', id: 'kat:' + id + ':look', x: cx, z: cz, rot, parts: [
  { s: 'box', p: [0, 0, 0], size: [w + 0.1, h, d + 0.1], top: false, faces: 'blr', key: PLS, tint, uv: [1.75, 1.75] },   // back, left, right walls
  { s: 'quad', p: [0, 0, (d + 0.1) / 2], size: [w + 0.1, h], ry: 0, hole: [door.lx, door.cw, 2.2], key: PLS, tint },      // the front, the doorway cut
  { s: 'roof', form: 'hip', p: [0, h, 0], size: [W1, rise, D1], roof: true, key: TILE, tint }, ... ] }
// the inside: drawn parts in the SAME arch row (docs/areas/katana/insides.js:15-30: a lit lining 0.335 m inside the walls, a lit ceiling
// box with `under: true, roof: true, ds: true`, posts, mats) + catalogue props through ctx.put(B, key, lx, lz) (rotated into the room frame)
```
- `door.lx` = the door square's middle along the front: `L = w - 0.12; cols = round(L / 1.75); cw = L / cols; lx = -L/2 + (col + 0.5) * cw`
  (bake-katana.js:29 `texbDoor`, same as data.js `hqTexbDoor`).
- Disaster City's version: docs/disaster-city/districts/E.js:23-70 (`B(id, {walk, st, leaf}, fn)`: the walls as four quads 5 cm proud with
  `hole: [lx, 1.74, 2.2]` on the front, `roof`, `trim`, `top`; stucco parts take `gain`).
- LEARNT (insides.js:7): `privacy_screen` is a green hospital curtain, never in a period room.
- For Agartha: a marble hall = `texbuilding` hollow with `keyIn: 'marble_light'`, `floorIn: 'marble_light'` (or `urban:TileMarble1a`),
  `leaf: 'leaf_wooden'` or `'leaf_portcullis'`; its look = `archw` walls with round-headed openings, a `ring` of `cyl` columns, a `dome`
  with `glow` for a crystal roof, `cyl` crystal finials (`key: 'crystal'`, `r2: 0.1`, `glow`).

## 10. DECALS, TREES

DOOR_HQ.decals (data.js; hand rows per room): `{ kind, x, z, y?, r, rot, alpha?, key? }`, kinds `scorch`, `oil`, `blood`, `grime`, `puddle`
(+ `wear`), painted canvases (three-renderer.js:95116); or `key: 'urban:<Decal...>'` / `hz_stain_01..15` sheet. Ten rooms have rows today
(garage, interrogation, the D.U.M.B. 50, the moon 4, the sewers 62, two tunnels, boiler, hell pit, haunted cellar); none in the Cavern.
HQ_DECAL_RULES (data.js `const HQ_DECAL_RULES`) adds them by key: a scorch under every torch / brazier / campfire / hearth, blood by `steel_table` /
`autopsy_table` / altar, grime under bins and barrels, a puddle by `sea_vent` / drains; a wear patch inside every door. The zone looks add
stains down walls (`drip`, `dirt`, `grime`, `blood`, `soot`: ZONE_LOOKS.stains). Urban decal sheets: `urban:DecalStainLeaks1..6`,
`urban:DecalStainOil1/2`, `urban:DecalPlasterHole1..3`.

HQ_TREE_KINDS (data.js `const HQ_TREE_KINDS`), placed as `{ k:'tree', x, z, kind, h, r }` (or `grove` rows), the underground-fit ones:
- giant mushrooms: `fae_cap` ("giant mushroom", Meshy mushroom), `fae_cap_2` ("toadstool")
- giant flowers (strange bloom): `fae_bloom_tree`, `fae_bloom_tree_pink`, `fae_bloom_tree_violet`, `fae_bloom_tree_blue`
- dead trees: `tree_5` (bare tree), `tree_6` (big bare tree), `tree_13`..`tree_20`, `tree_41`, `tree_42` (DeadTree_1..10), `tree_31`..`tree_40`
  (DeadBirch_1..10), `rf_fir_1_dead`..`rf_fir_4_dead` (brown), `rf_birch_1_winter`..`_4_winter`, `rf_oak_1_winter`..`_4_winter` (bare)
- blue willows (the `hollow` climate's water trees): `rf_willow_1_blue`, `rf_willow_2_blue`, `rf_willow_3_blue`
- no crystal tree kind exists. The flora rule (ZONE_FLORA `cavern` -> climate `hollow`, `under: true`) plants only where dark grass / dirt is
  painted (flora.md:164, :188): marble and crystal floors grow nothing.

## 11. NEEDS A MODEL (nothing in the catalogue fits)

- STALAGMITES / STALACTITES as props (today: code cones in a cave ceiling, or `arch` `cyl` parts with `r2` ~0.1 in `rocks_5` / `cave_wall`).
- A CREATURE NEST: a woven nest, giant eggs, egg sacs on a wall, a cocoon (only `anthill`, `ant_queen`, `chrysalis` h0.35 and webs exist).
- A big CRYSTAL GEODE / a crystal wall (can be faked with many `crystal_cluster` + `arch` crystal cylinders; a Meshy geode would read better).
- MINE TIMBER: square sets / props / a timbered adit mouth (no model: `arch` boxes in `urban:WoodBeams1a`, as Katana draws posts).
- MINER'S KIT: a helmet with a lamp, a carbide lamp, a dynamite crate (`spell_dynamite` s0.22 exists), a survey theodolite / tripod.
- A DEAD EXPLORER (only `hw_body`, `astronaut`, `anatomy_skeleton`).
- AGARTHAN pieces: a crystal guardian statue, a crystal throne, a marble city gate with crystal inlay, crystal lamps on posts, a white marble
  balustrade (today: `railing_1m` office rail, `psxg_railing`, `hw_fence_iron`, or ramp / bridge `rails`), a crystal bridge (draw it: a
  `bridge` row with `key: 'crystal'` + an `arch` look), Nordic furniture (only `ship_nordic`).
- MACHINE-ELF props beyond the dream kit (fractal toys, jewelled orbs on stalks).
- Note: `fae_mushroom` / `fae_toadstool` / `woods_glowcap` have no real light (model rows); pair each lit one with a `light_glow` row.

## 12. THE TWO DOCS (read end to end)

docs/disaster-city/pack-claims.md: Disaster City's who-uses-which-pack-building table (pizzeria + gas station free for all, every other
`city_*` building one district each), the ten shop blocks `pack_bld_00..09` shared, the industrial pack free, the Meshy second-pass interior
pieces (all live, free for every district: `crystal_chandelier`, `paper_lantern`, `mirror_ball`, `music_stand`, `wedding_arch`...). THE GOLD
rule: `key: 'gold'` is gilt.png; never load `terrain/gold.png`, `gold_2.png`, `gold_3.png` by name. Nothing there is claimed by Agartha.

docs/plans/WISHLIST_MODELS_ADDED.md: the 246 wish-list Meshy models (R2 `Assets/world/props/meshy/wishlist/<key>.glb`, real sizes), all
listed in sections 1-6 above where they fit. Not made: papyrus, whale bones, gold pile, wheat patch. The Agartha-relevant ones: `god_statue`,
`tripod_bowl`, `lyre`, `greek_couch`, `market_stall`, `gong`, `bell_frame`, `hooded_statue`, `weeping_angel`, `trestle_table`, `canvas_tent`,
`lean_to`, `sleeping_bag`, `backpack`, `kettle`, `wood_stove`, `stretcher`, `prayer_flags`, `rope_bridge` (s7, a rope bridge over a chasm),
`timber_lookout`, `mine_cart`, `pickaxe`, `ore_heap`, `head_wheel`, `wooden_ladder`, `manhole_ladder`, `rail_section`, `buffer_stop`,
`hand_car`, `firewood_stack`, `wooden_barrel`, `spider`, `rat`, `cattle_skull`, `lake_rock`, `moss_clump`, `cairn`, `lit_candle`,
`oil_lamp`, `cage_lamp`, `lantern_post`, `string_lights`, `bird_bath`, `cheval_mirror`, `hookah`, `floor_runner`, `woven_baskets`, `fur_rug`.
