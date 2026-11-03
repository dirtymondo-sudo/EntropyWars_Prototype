## 9. Meshy pieces made 2026-11-03 through the API, NOT wired into the game yet

Claude made these on Meshy (concept image -> mondo's OK -> smart-topology model) for docs/notes/character-models-plan.md
section 4a/6 (wearable gear + held spell props). Files: project files `meshy/models/` (GLB + preview). They get rows above
only when they are wired in. #01 cowboy hat = mondo's own model; #58 playing cards dropped (mondo uses a pack); #49 whip =
Meshy handle + a lash Claude built in Blender.

`02_gun-belt`, `02b_thigh-holster`, `03_pirate-tricorn`, `04_officer-cap`, `05_firefighter-helmet`, `06_firefighter-air-tank`, `07_football-helmet`, `08_football-shoulder-pads`, `09_astronaut-helmet`, `10_astronaut-backpack`, `11_royal-crown`, `12_ice-crown`, `13_annunaki-headdress`, `14_overlord-helmet`, `15_mushroom-cap-hat`, `16_beret`, `17_straw-hat`, `18_armor-breastplate`, `19_armor-pauldron`, `20_armor-gauntlet`, `21_armor-greave`, `22_egyptian-collar`, `23_sheriff-star`, `24_police-badge`, `25_quiver`, `26_small-backpack`, `27_tool-belt`, `28_cross-pendant`, `29_katana-back-sheath`, `30_trident`, `31_neck-bolt`, `32_elf-ear`, `33_grey-alien-head`, `34_jackal-head`, `35_goat-head`, `36_eagle-head`, `37_shark-head`, `38_lizard-head`, `39_moth-head`, `40_moth-wing`, `41_lizard-tail`, `42a_shark-tail`, `42b_shark-dorsal-fin`, `43_mermaid-tail`, `44_wolf-tail`, `45_hoof`, `46_clawed-beast-foot`, `47_potion-flask`, `48_scalpel`, `49_bullwhip_rigged`, `49_whip-handle`, `50_wrench`, `51_blowpipe`, `52_smartphone`, `53_hand-mirror`, `54_old-camera-flash`, `55_milk-and-cookies`, `56_drinking-cup`, `57_broken-halo`, `58_playing-cards`, `59_magic-wand`, `60_wizard-staff`, `61_jetpack`, `62_binoculars`, `63_walkie-talkie`, `64_flare-gun`, `65_ward-totem`, `66_spyglass`, `67_talisman-pendant`, `68_censer`, `69_grapple-gauntlet`, `70_arm-band`, `71_hagstone`, `72_dowsing-rod`

## 10. DECOR STILL MISSING — the props the rooms need that have no real model (2026-11-03)

Built from the 184 code-drawn catalogue procs of 2026-11-03 (§8 now lists what is left (each already placed in a room: "uses" = placements in data.js) and the
old per-zone wishlists in MODEL_INDEX.md §3f-3p / §6b. Every stand-in falls in exactly one tier below.
Meshy process (mondo's): concept image first -> mondo approves -> model in low-poly smart topology -> mondo names redos.
Target tris are doubled per mondo (MPFB bodies ~30k). Concept rules: one object, plain background, no strings / chains / cords, screens and signs blank. Wiring a model into the
game (giving the catalogue row a `file` and dropping its `proc`) is a separate step, only on mondo's say.

### 10A. Needs a NEW model (89) — stand-ins placed in rooms that no model in the game fits

IDs match project files meshy/decor/decor_prompts.json. D41 locker_bench, D88 tape_shelf and D89 sword_stone were dropped
2026-11-03: their builders already hang a real model (city_bench, vhs_player, the master sword) — see §8.

| # | catalogue key | prop | uses | target tris | concept prompt |
| --- | --- | --- | --- | --- | --- |
| D01 | `bare_bulb` | Bare ceiling bulb | 101 | 2000 | A bare incandescent light bulb in a plain black ceiling socket with a round ceiling plate, the bulb sitting right under the plate, no cord |
| D02 | `cave_torch` | Standing torch | 71 | 6000 | A standing wooden torch: a rough wooden pole on three short splayed wooden feet with an iron basket at the top holding charred unlit wood |
| D03 | `steel_table` | Steel work table | 43 | 6000 | A stainless steel work table with a lower shelf and square legs, brushed metal |
| D04 | `flood_mast` | Floodlight mast | 42 | 16000 | A tall steel floodlight mast about 7 metres tall on a square lattice base with a bank of four rectangular stadium floodlights at the top |
| D05 | `metal_shelving` | Steel storage shelving (also lost_shelf) | 38 | 12000 | A grey steel storage shelving unit with four shelves holding cardboard boxes and plastic bins |
| D06 | `notice_board` | Cork notice board | 37 | 4000 | A wall-mounted cork notice board in a wooden frame with pinned paper notices, memos and a calendar, no readable text |
| D07 | `t_pillar` | Göbekli T-pillar (Ley Lines) | 34 | 16000 | A Göbekli Tepe style megalithic T-shaped limestone pillar about 4.5 metres tall, weathered pale stone, a fox and a boar carved in low relief on its side and arms carved in relief along the shaft |
| D08 | `wall_torch` | Wall torch sconce | 32 | 4000 | A medieval iron wall sconce bolted to a small iron plate, holding a wooden torch with a charred unlit head |
| D09 | `iso_tank` | Cryo / isolation tank | 29 | 16000 | A sci-fi cryogenic isolation tank: a horizontal capsule with a frosted glass lid on a metal base, pipes and valves along its side, a small blank indicator panel |
| D10 | `tanker_desk` | Steel tanker desk | 27 | 8000 | A grey 1960s steel tanker office desk with a stack of drawers on one side and a pale green top |
| D11 | `wall_shelf` | Wall shelf | 25 | 4000 | A simple wooden wall shelf on two black iron brackets holding a few jars and old books |
| D12 | `server_rack` | Server rack | 21 | 12000 | A tall black computer server rack cabinet with a perforated mesh door and rows of rack servers inside, blank status lights |
| D13 | `saucer_pendant` | Space-age saucer pendant lamp | 21 | 4000 | A 1960s space-age flying-saucer shaped ceiling pendant lamp in white and chrome on a short rigid stem to a round ceiling canopy |
| D14 | `slot_machine` | Slot machine | 18 | 10000 | A vintage casino slot machine cabinet with a pull lever on the side, three reels, chrome trim and red paint, blank glass |
| D15 | `armour_stand` | Knight armour on a stand | 17 | 20000 | A full suit of medieval knight plate armour displayed upright on a wooden stand, empty with nobody inside, helmet with the visor down |
| D16 | `radiation_sign` | Radiation warning sign | 17 | 1000 | A metal wall sign plate with the yellow and black radiation trefoil hazard symbol, bolted corners, slightly worn, no text |
| D17 | `planter` | Concrete planter | 17 | 8000 | A long rectangular concrete planter box filled with soil and leafy green shrubs |
| D18 | `stone_altar` | Stone altar | 15 | 6000 | An ancient carved stone altar block, rectangular, weathered grey stone with worn engraved bands |
| D19 | `sea_buoy` | Channel buoy | 12 | 8000 | A red navigation channel buoy: a round float with a short lattice tower and a lamp at the top |
| D20 | `egg_chair` | Egg chair | 12 | 12000 | A 1960s retro egg chair, white fibreglass shell with an orange cushioned interior, on a swivel base |
| D21 | `pool_lounger` | Pool lounger | 12 | 6000 | A white poolside sun lounger with an adjustable backrest and slatted frame |
| D22 | `boiler` | Basement boiler | 11 | 12000 | An old cast-iron basement boiler furnace with a round firebox door, a pressure gauge and pipes rising from the top |
| D23 | `fountain` | Park fountain | 11 | 16000 | A classical stone park fountain with a round basin and a tiered central column with two smaller bowls, no water |
| D24 | `banner` | Heraldic banner | 11 | 4000 | A medieval heraldic banner of red cloth with a gold lion emblem and a pointed bottom edge, hanging straight from a short wooden crossbar |
| D25 | `lava_lamp` | Lava lamp | 10 | 3000 | A 1970s lava lamp on a chrome cone base with orange wax blobs inside the glass |
| D26 | `concrete_pillar` | Garage concrete pillar | 9 | 2000 | A square reinforced concrete parking garage pillar with chipped corners and a yellow and black hazard stripe band near the base |
| D27 | `stocks` | Medieval stocks | 9 | 6000 | Medieval wooden pillory stocks with holes for the head and hands, on two wooden posts |
| D28 | `school_desk` | School desk | 9 | 6000 | An old school desk with an attached seat, a wooden top and a steel tube frame |
| D29 | `toilet_paper` | Toilet paper roll | 8 | 1000 | A single roll of white toilet paper |
| D30 | `tulip_chair` | Tulip chair | 8 | 6000 | A white tulip chair with a red seat cushion on a single pedestal base |
| D31 | `tulip_table` | Tulip table | 8 | 4000 | A white round tulip table on a single pedestal base |
| D32 | `eeg_rack` | EEG machine trolley | 8 | 8000 | A medical trolley holding an EEG monitoring machine with a blank screen and knobs |
| D33 | `lava_lamp_floor` | Floor lava lamp | 7 | 4000 | A tall floor-standing 1970s lava lamp about 1.5 metres tall, chrome base, orange wax blobs in a tall glass column |
| D34 | `disc_cluster` | Disc cluster ceiling lamp | 7 | 6000 | A 1970s ceiling lamp made of a cluster of white discs on rigid chrome rods from a chrome canopy |
| D35 | `sputnik_lamp` | Sputnik chandelier | 6 | 6000 | A brass sputnik chandelier: a central sphere with radiating rods each ending in a small bulb |
| D36 | `dream_eye` | Eye on a stalk (Astral) | 6 | 12000 | A surreal giant eyeball with eyelids on a thick fleshy stalk growing from the ground |
| D37 | `pool_umbrella` | Pool umbrella | 6 | 4000 | An open patio pool umbrella with a white and blue striped canopy on a pole with a weighted base |
| D38 | `robot_arm` | Industrial robot arm | 6 | 12000 | An industrial yellow six-axis robotic arm on a floor base with a gripper |
| D39 | `ticket_booth` | Carnival ticket booth | 6 | 12000 | A carnival ticket booth: a small red and white striped wooden kiosk with a window and a little peaked roof |
| D40 | `anemone` | Sea anemone | 5 | 6000 | A sea anemone with many soft pink tentacles on a small rock |
| D42 | `grow_lamp` | Grow lamp | 5 | 3000 | A hydroponic grow light fixture: a rectangular reflector hood with a purple LED panel on short rigid hanger rods |
| D43 | `star_projector` | Planetarium star projector | 4 | 12000 | A planetarium star projector, a dumbbell-shaped machine with two studded spheres on a pedestal |
| D44 | `meat_hook` | Meat hook rail | 4 | 3000 | A short steel butcher's rail with three S-shaped meat hooks hanging from it on rigid hooks, no chains |
| D45 | `laundry_cart` | Laundry cart | 4 | 4000 | A laundry cart: a canvas bin on a metal frame with casters |
| D46 | `umbrella_stand` | Umbrella stand | 4 | 4000 | A brass umbrella stand holding two closed umbrellas |
| D47 | `lifeguard_chair` | Lifeguard chair | 4 | 8000 | A tall white wooden lifeguard chair with a ladder |
| D48 | `conveyor` | Roller conveyor (also conveyor_z) | 4 | 8000 | An industrial roller conveyor section about 3 metres long on steel legs |
| D49 | `popcorn_cart` | Popcorn cart | 4 | 10000 | A vintage red popcorn cart with a glass case full of popcorn and spoked wagon wheels |
| D50 | `sea_vent` | Black smoker vent | 3 | 8000 | A deep sea hydrothermal vent chimney, a tall black smoker of dark rock |
| D51 | `nightmare_bloom` | Flower of teeth (Astral) | 3 | 10000 | A surreal giant flower whose petals are rows of bone-white teeth on a thick dark stem |
| D52 | `broom` | Broom | 3 | 2000 | A traditional straw broom with a wooden handle |
| D53 | `serving_line` | Cafeteria serving counter | 3 | 10000 | A cafeteria serving counter with a glass sneeze guard shelf and empty steel food trays |
| D54 | `pod_bed` | Capsule sleep pod | 3 | 12000 | A futuristic capsule sleep pod bed with a curved canopy cover, white and grey |
| D55 | `roller_shutter` | Roller shutter | 3 | 4000 | A closed metal roller shutter shop door of corrugated grey steel with a box housing at the top |
| D56 | `washer` | Washing machine | 3 | 6000 | A white front-loading washing machine |
| D57 | `dryer` | Tumble dryer | 3 | 6000 | A white front-loading tumble dryer |
| D58 | `toilet_stall` | Toilet stall | 3 | 8000 | A public restroom toilet stall with grey partition walls, an open door and a white toilet inside |
| D59 | `round_table` | Round table (Camelot) | 3 | 30000 | A huge round oak table for twelve with twelve high-backed carved wooden chairs around it |
| D60 | `departures_board` | Departures board | 3 | 3000 | A railway station departures board: a black rectangular split-flap board in a metal frame, blank with no letters |
| D61 | `barber_chair` | Barber chair | 2 | 12000 | A vintage barber chair in red leather and chrome with a footrest and hydraulic base |
| D62 | `barber_pole` | Barber pole | 2 | 2000 | A wall-mounted barber pole: a red, white and blue spiral glass cylinder between chrome caps |
| D63 | `urinal` | Urinal | 2 | 3000 | A white wall-hung urinal |
| D64 | `hand_dryer` | Hand dryer | 2 | 2000 | A wall-mounted stainless steel hand dryer |
| D65 | `shower_stall` | Shower stall | 2 | 6000 | A white tiled shower stall with a chrome shower head |
| D66 | `skiff` | Sailing skiff | 2 | 16000 | A small wooden sailing skiff about 5 metres long with one mast and a furled canvas sail |
| D67 | `lighthouse` | Lighthouse | 2 | 20000 | A white and red striped lighthouse tower with a lantern room and a gallery railing at the top, on a stone base |
| D68 | `trophy_case` | Trophy case | 2 | 10000 | A wooden glass-front trophy cabinet with gold trophies on its shelves |
| D69 | `laminator` | Laminator | 2 | 1600 | A grey plastic desktop office laminating machine |
| D70 | `exec_desk` | Executive desk | 2 | 10000 | A large mahogany executive desk with a leather inlay top and drawers |
| D71 | `mushroom_lamp` | Mushroom lamp | 2 | 3000 | A 1970s mushroom table lamp with a glossy orange dome shade |
| D72 | `space_divider` | Space-age room divider | 2 | 6000 | A 1960s room divider screen, a white panel with a pattern of circular cut-outs |
| D73 | `kitchen_range` | Commercial range | 2 | 10000 | A commercial stainless steel kitchen range with six burners and an oven |
| D74 | `range_hood` | Range hood | 2 | 4000 | A stainless steel commercial kitchen range hood |
| D75 | `chalkboard` | Chalkboard | 2 | 2000 | A blank green school chalkboard in a wooden frame with a chalk tray |
| D76 | `door_furnace` | Incinerator furnace | 2 | 12000 | A large brick industrial incinerator furnace with a heavy iron door |
| D77 | `carousel` | Carousel | 2 | 40000 | A vintage fairground carousel with painted horses on poles under a striped canopy |
| D78 | `high_striker` | High striker | 2 | 8000 | A carnival high striker strength tester: a tall red and white tower with a bell at the top and a lever pad at the base |
| D79 | `giant_clam` | Giant clam | 1 | 6000 | A giant clam with an open wavy-edged shell and a blue interior mantle |
| D80 | `sink_row` | Row of sinks | 1 | 8000 | A row of three white bathroom sinks set in a countertop with chrome taps |
| D81 | `submarine` | Bathyscaphe submarine | 1 | 20000 | A small brass and riveted bathyscaphe research submarine with a round viewport and two lamps |
| D82 | `directory_board` | Mall directory kiosk | 1 | 4000 | A free-standing mall directory kiosk with an illuminated panel showing a blank map |
| D83 | `rocking_chair` | Rocking chair | 1 | 6000 | A wooden rocking chair |
| D84 | `music_box` | Music box | 1 | 4000 | A small wooden music box with the lid open and a tiny ballerina inside |
| D85 | `punch_clock` | Punch clock | 1 | 4000 | A vintage employee punch time clock with a card rack beside it |
| D86 | `card_catalogue` | Card catalogue | 1 | 10000 | A library card catalogue cabinet: a wall of small wooden drawers with brass handles |
| D87 | `pot_rack` | Pot rack | 1 | 8000 | A ceiling-hung iron kitchen pot rack on short rigid rods with copper pots and pans hanging from hooks |
| D90 | `autopsy_table` | Autopsy table | 1 | 6000 | A stainless steel autopsy table with drain channels on a pedestal |
| D91 | `ferris_wheel` | Ferris wheel | 1 | 40000 | A small fairground ferris wheel with gondola seats on a white steel frame |
| D92 | `scoreboard` | Stadium scoreboard | 1 | 12000 | A big stadium scoreboard: a tall frame on legs with a large blank screen and a clock panel |

### 10B. Spell props still missing (from the spell look audit, docs: project files spell-vfx-audit/fix/MISSING_MODELS.md)

| # | prop | spell | concept prompt |
| --- | --- | --- | --- |
| S01 | piano | Things That Go Bump (ghost) | A black upright piano with the lid closed |
| S02 | sheep | Counting Sheep (dreameater) | A fluffy white cartoonish-realistic sheep standing |
| S03 | polaroid | Cryptid Vanish (loch ness monster) | An instant polaroid photograph showing a blurry photo of a lake, white frame |
| S04 | tripod_machine | Tripod Sweep (martian) | A towering three-legged alien tripod fighting machine with a domed head and a heat-ray arm, War of the Worlds style |

### 10C. SWAPS TO MODELS ALREADY IN THE GAME — done 2026-11-03 (mondo: "go ahead and do the recommended replacements")

| stand-in | uses | result |
| --- | --- | --- |
| `lectern` | 22 | SWAPPED to church_podium's file (Meshy) |
| `wall_chains` | 19 | SWAPPED to the traps pack's draped chain |
| `telescope` | 7 | SWAPPED to brass_telescope's file (Meshy) |
| `exec_chair` | 1 | SWAPPED to office_chair's file (Meshy) |
| `kelp` | 3 | SWAPPED to the ocean pack's seaweed (it sways on its own clip) |
| `coral_brain` | 4 | SWAPPED to the ocean pack's Coral |
| `coral_fan` | 4 | SWAPPED to the ocean pack's Coral1 |
| `coral_tube` | 1 | SWAPPED to the ocean pack's Coral2 |
| `flicker_tube` | 25 | SWAPPED: the fluorescent fixture hangs in place of the box (the glow still flickers) |
| `park_bench` | 56 | already wore city_bench (no change) |
| `candle_ring` | 47 | already wore the spell candle (no change) |
| `garden_tree` | 35 | already a Retro Tree Pack tree (no change) |
| `retro_console` | 7 | already wore retro_control_panel (no change) |
| `lone_gun` | 5 | already wore the pistol (no change) |
| `fortune_tent` | 3 | already wore fortune_teller_tent (no change) |
| `saucer_rig` | 1 | already wore saucer_lg (no change) |
| `parked_car` | 1 | already the Honda Civic sedan model (no change) |
| `crystal_cluster` | 44 | KEPT: mondo's 11-02 gem clusters replaced the crystal cones on purpose |
| `curved_sofa` | 13 | KEPT: five arcs form the sunken lounge ring in each room's colour; the curved couch model can't make the ring |
| `shag_rug` | 8 | KEPT: the round rug of that lounge, in the room's two colours |
| `floating_orb` | 13 | KEPT: a 1.9 m lit plinth + orb; the 0.3 m crystal ball is a different thing |
| `fish_school` | 13 | KEPT: an instanced school of ~40 fish; a pack fish per school member is renderer work |
| `cell_bars` | 11 | KEPT: open bars; leaf_cell is a solid door |
| `square_cubicle` | 6 | KEPT: square cubicles in grids; the model is round |
| `door_stack` | 11 | KEPT: a pallet of the works' own door leaves (code-drawn like every works leaf) |
| `monitor_stack` | 13 | KEPT: nine live CCTV screens of the building's rooms |
| `world_clocks` | 2 | KEPT: five labelled clocks that disagree (SHASTA, GIZA ...) |
| `tube_map` | 3 | KEPT: draws DOOR_HQ.routes as the subway map |
| `turnstile` | 3 | KEPT: the gate turns as you come up; the metro gate is a different, still gate |
| `clipboard` | 26 | KEPT: wall-hung; the clipboard model lies flat on a desk |
| `lost_shelf` | 4 | WAITS for the new steel shelving model (D05) |
| `conveyor_z` | 1 | WAITS for the new conveyor model (D48) |

### 10D. NOT A MODEL JOB (60) — decals, lit windows/screens, text, walkable steps/ramps, water, effects

`floor_stain` (decal), `warning_tape` (decal), `light_shaft` (light effect), `ritual_circle` (decal), `door_seal` (decal), `doormat` (flat mat), `parking_bay` (floor paint), `platform_edge` (floor paint), `track_bed` (floor strip), `find_tape` (find marker), `find_pay` (find marker), `find_deck` (find marker), `find_stash` (find marker), `riser_1` (walkable riser), `riser_2` (walkable riser), `riser_3` (walkable riser), `stair_step` (walkable step), `stair_step_x` (walkable step), `stair_landing` (walkable landing), `stair_landing_sq` (walkable landing), `house_stairs` (walkable stair), `quarter_pipe` (skate ramp), `garage_ramp` (walkable ramp), `infinity_pool` (water surface), `lap_pool` (water surface), `garden_ring` (flower bed ring), `star_dome` (ceiling effect), `star_chart` (flat wall chart), `festoon` (string lights (strings model badly)), `crib_mobile` (hanging strings (model badly)), `bigtop` (tent cloth ceiling), `porthole` (lit window), `pod_window` (lit window), `false_window` (lit window), `sun_viewport` (lit window), `shaft_window` (lit window), `dream_screen` (lit screen), `now_serving` (lit sign), `evac_button` (wall button), `keypad` (wall keypad), `floor_panel` (lit wall panel), `car_panel` (lit lift panel), `door_xray` (lit x-ray panel), `wall_padding` (wall surface), `graffiti_wall` (wall paint), `price_tag` (card), `sale_banner` (flat banner), `lesson_plaque` (text plaque), `lesson_sign` (text plaque), `motto_plaque` (text plaque), `wall_plaques` (text plaques), `form_sheet` (paper), `thoughtform` (breathing effect (mondo's wish: the core only)), `mobius_bar` (impossible shape), `impossible_stair` (impossible shape), `temple_dome` (glass dome effect), `door_vine` (vine growth), `garbage_chute` (wall hatch), `barber_mirror` (mirror), `street_drain` (manhole decal)

### 10E. Old wishlist items with no stand-in yet (new dressing, by zone) — not concepted; ask mondo first

- **Disaster City**: low-poly city buildings (2-4 storey brick block, office tower, parking garage), arcade cabinet, newspaper box, mailbox, police barricade, fallen street lamp, scaffolding, water tower, rooftop AC unit, food-court table set, subway entrance canopy
- **The D.U.M.B.**: tram / people-mover car, situation board (curved wall screen), round war-room table, wine rack, home cinema seat, particle detector ring, beamline pipe on stands, EEG cap on a stand, Zener card deck, Faraday cage
- **Camelot Kingdom**: drawbridge, stone gargoyle, wizard's workbench, trestle table + benches, castle wall with battlements, round tower
- **The Sewers / tunnels**: manhole ladder + shaft, cast-iron pump + valve wheel, rail track section, signal gantry, maintenance trolley, police booking desk, drunk-tank bench, mine cart, mine timber set
- **The Deep / Atlantis / The Beach**: sunken Atlantean head statue, broken marble arch, treasure pile, brass diver's helmet, open shipwreck section, Flight 19 Avenger wreck, mooring post
- **Leylines**: fallen trilithon, bluestone, sphinx, pyramid casing block, mudbrick kiln, brick stack, timber scaffold, amber keystone, surveyor's tripod, dig kit (wheelbarrow, sieve table, finds tray), barrow entrance
- **Heaven + Hell + Vatican**: candelabra / bone chandelier, broken column
- **Astral**: ticket dispenser, bed with something under it, closet with no back
- **DOOR HQ floors**: pool ladder + starting block

