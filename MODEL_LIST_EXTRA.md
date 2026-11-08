## 9. Meshy pieces made 2026-11-03 through the API — WIRED (PR #827 + #829)

Claude made these on Meshy (concept image -> mondo's OK -> smart-topology model) for docs/notes/character-models-plan.md
section 4a/6 (wearable gear + held spell props). Files: project files `meshy/models/` (GLB + preview). **Wired 2026-11-03:**
the held spell props + whip + worn gear (PR #827, R2 `Assets/world/props/misc/`) are in §7a / §7a-2; the creator fittings (PR #829,
`charactercreation/wear/ewm_*`) are in §5e. #01 cowboy hat = mondo's own model; #58 playing cards dropped (mondo uses a pack); #49 whip =
Meshy handle + a lash Claude built in Blender.

`02_gun-belt`, `02b_thigh-holster`, `03_pirate-tricorn`, `04_officer-cap`, `05_firefighter-helmet`, `06_firefighter-air-tank`, `07_football-helmet`, `08_football-shoulder-pads`, `09_astronaut-helmet`, `10_astronaut-backpack`, `11_royal-crown`, `12_ice-crown`, `13_annunaki-headdress`, `14_overlord-helmet`, `15_mushroom-cap-hat`, `16_beret`, `17_straw-hat`, `18_armor-breastplate`, `19_armor-pauldron`, `20_armor-gauntlet`, `21_armor-greave`, `22_egyptian-collar`, `23_sheriff-star`, `24_police-badge`, `25_quiver`, `26_small-backpack`, `27_tool-belt`, `28_cross-pendant`, `29_katana-back-sheath`, `30_trident`, `31_neck-bolt`, `32_elf-ear`, `33_grey-alien-head`, `34_jackal-head`, `35_goat-head`, `36_eagle-head`, `37_shark-head`, `38_lizard-head`, `39_moth-head`, `40_moth-wing`, `41_lizard-tail`, `42a_shark-tail`, `42b_shark-dorsal-fin`, `43_mermaid-tail`, `44_wolf-tail`, `45_hoof`, `46_clawed-beast-foot`, `47_potion-flask`, `48_scalpel`, `49_bullwhip_rigged`, `49_whip-handle`, `50_wrench`, `51_blowpipe`, `52_smartphone`, `53_hand-mirror`, `54_old-camera-flash`, `55_milk-and-cookies`, `56_drinking-cup`, `57_broken-halo`, `58_playing-cards`, `59_magic-wand`, `60_wizard-staff`, `61_jetpack`, `62_binoculars`, `63_walkie-talkie`, `64_flare-gun`, `65_ward-totem`, `66_spyglass`, `67_talisman-pendant`, `68_censer`, `69_grapple-gauntlet`, `70_arm-band`, `71_hagstone`, `72_dowsing-rod`

## 10. DECOR STILL MISSING — the props the rooms need that have no real model (2026-11-03)

Built from the 184 code-drawn catalogue procs of 2026-11-03 (§8 now lists what is left (each already placed in a room: "uses" = placements in data.js) and the
old per-zone wishlists in MODEL_INDEX.md §3f-3p / §6b. Every stand-in falls in exactly one tier below.
Meshy process (mondo's): concept image first -> mondo approves -> model in low-poly smart topology -> mondo names redos.
Target tris are doubled per mondo (MPFB bodies ~30k). Concept rules: one object, plain background, no strings / chains / cords, screens and signs blank. Wiring a model into the
game (giving the catalogue row a `file` and dropping its `proc`) is a separate step, only on mondo's say.
**2026-11-03 mondo said wire them:** the 71 models Meshy made are in (rows marked WIRED). Each proc builder now WEARS its model
(three-renderer.js THE MESHY DECOR, `_hqDecorWear`, files on R2 `Assets/world/props/meshy_decor/`): the catalogue rows are unchanged, the proc's
own pieces hide (and keep the collision) and the model is fitted into their box. Rows not marked were not made on Meshy.

### 10A. Needs a NEW model (89) — stand-ins placed in rooms that no model in the game fits

IDs match project files meshy/decor/decor_prompts.json. D41 locker_bench, D88 tape_shelf and D89 sword_stone were dropped
2026-11-03: their builders already hang a real model (city_bench, vhs_player, the master sword) — see §8.
**THE LAST COLUMN IS AUTO (2026-11-04):** list-models.js reads what each catalogue key draws TODAY. Only a row that reads
"code — still needs a model" is still waiting, and THE PACK-FIRST RULE (top of this file) applies to it before any Meshy prompt.
The 2026-11-04 audit (§12) found 19 rows here that were already done or had a pack piece: they are marked PACK / WIRED below.

| # | catalogue key | prop | uses | target tris | concept prompt |
| --- | --- | --- | --- | --- | --- |
| D01 | `bare_bulb` | Bare ceiling bulb — **PACK 2026-11-04** (Abandoned House `Foco`, mondo: "switch those on") | 101 | 2000 | A bare incandescent light bulb in a plain black ceiling socket with a round ceiling plate, the bulb sitting right under the plate, no cord |
| D02 | `cave_torch` | Standing torch — **WIRED 2026-11-03** | 71 | 6000 | A standing wooden torch: a rough wooden pole on three short splayed wooden feet with an iron basket at the top holding charred unlit wood |
| D03 | `steel_table` | Steel work table — **PACK 2026-11-04** (DINER Table_Metal) | 43 | 6000 | A stainless steel work table with a lower shelf and square legs, brushed metal |
| D04 | `flood_mast` | Floodlight mast — **WIRED 2026-11-03** (regenerated: stadium light D04c) | 42 | 16000 | A tall steel floodlight mast about 7 metres tall on a square lattice base with a bank of four rectangular stadium floodlights at the top |
| D05 | `metal_shelving` | Steel storage shelving (also lost_shelf) — **PACK 2026-11-04** (Gas Station Shelf_Metal) | 38 | 12000 | A grey steel storage shelving unit with four shelves holding cardboard boxes and plastic bins |
| D06 | `notice_board` | Cork notice board — **WIRED 2026-11-03** | 37 | 4000 | A wall-mounted cork notice board in a wooden frame with pinned paper notices, memos and a calendar, no readable text |
| D07 | `t_pillar` | Göbekli T-pillar (Ley Lines) — **WIRED 2026-11-03** | 34 | 16000 | A Göbekli Tepe style megalithic T-shaped limestone pillar about 4.5 metres tall, weathered pale stone, a fox and a boar carved in low relief on its side and arms carved in relief along the shaft |
| D08 | `wall_torch` | Wall torch sconce — **WIRED 2026-11-03** | 32 | 4000 | A medieval iron wall sconce bolted to a small iron plate, holding a wooden torch with a charred unlit head |
| D09 | `iso_tank` | Cryo / isolation tank — **WIRED** (the Molten casket model; this row was stale) | 29 | 16000 | A sci-fi cryogenic isolation tank: a horizontal capsule with a frosted glass lid on a metal base, pipes and valves along its side, a small blank indicator panel |
| D10 | `tanker_desk` | Steel tanker desk — **WIRED 2026-11-03** | 27 | 8000 | A grey 1960s steel tanker office desk with a stack of drawers on one side and a pale green top |
| D11 | `wall_shelf` | Wall shelf — **PACK 2026-11-04** (House Shelf_01) | 25 | 4000 | A simple wooden wall shelf on two black iron brackets holding a few jars and old books |
| D12 | `server_rack` | Server rack — made, NOT used (mondo 11-03: the old one looks better) | 21 | 12000 | A tall black computer server rack cabinet with a perforated mesh door and rows of rack servers inside, blank status lights |
| D13 | `saucer_pendant` | Space-age saucer pendant lamp — **WIRED 2026-11-03** | 21 | 4000 | A 1960s space-age flying-saucer shaped ceiling pendant lamp in white and chrome on a short rigid stem to a round ceiling canopy |
| D14 | `slot_machine` | Slot machine — **WIRED 2026-11-03** | 18 | 10000 | A vintage casino slot machine cabinet with a pull lever on the side, three reels, chrome trim and red paint, blank glass |
| D15 | `armour_stand` | Knight armour on a stand — **WIRED 2026-11-03** (stand redone: square oak plinth D15c) | 17 | 20000 | A full suit of medieval knight plate armour displayed upright on a wooden stand, empty with nobody inside, helmet with the visor down |
| D16 | `radiation_sign` | Radiation warning sign — packs checked 2026-11-04: none fits | 17 | 1000 | A metal wall sign plate with the yellow and black radiation trefoil hazard symbol, bolted corners, slightly worn, no text |
| D17 | `planter` | Concrete planter — packs checked 2026-11-04: none fits | 17 | 8000 | A long rectangular concrete planter box filled with soil and leafy green shrubs |
| D18 | `stone_altar` | Stone altar — **WIRED 2026-11-03** | 15 | 6000 | An ancient carved stone altar block, rectangular, weathered grey stone with worn engraved bands |
| D19 | `sea_buoy` | Channel buoy — **WIRED 2026-11-03** | 12 | 8000 | A red navigation channel buoy: a round float with a short lattice tower and a lamp at the top |
| D20 | `egg_chair` | Egg chair — **WIRED 2026-11-03** | 12 | 12000 | A 1960s retro egg chair, white fibreglass shell with an orange cushioned interior, on a swivel base |
| D21 | `pool_lounger` | Pool lounger — **WIRED 2026-11-03** | 12 | 6000 | A white poolside sun lounger with an adjustable backrest and slatted frame |
| D22 | `boiler` | Basement boiler — **WIRED 2026-11-03** | 11 | 12000 | An old cast-iron basement boiler furnace with a round firebox door, a pressure gauge and pipes rising from the top |
| D23 | `fountain` | Park fountain — **WIRED 2026-11-03** | 11 | 16000 | A classical stone park fountain with a round basin and a tiered central column with two smaller bowls, no water |
| D24 | `banner` | Heraldic banner — **WIRED 2026-11-03** | 11 | 4000 | A medieval heraldic banner of red cloth with a gold lion emblem and a pointed bottom edge, hanging straight from a short wooden crossbar |
| D25 | `lava_lamp` | Lava lamp — **WIRED 2026-11-03** (Meshy base + cap; row was stale). Molten Maps `Lava_Lamp` exists; mondo 11-04 KEEPS this one (the moving wax) | 10 | 3000 | A 1970s lava lamp on a chrome cone base with orange wax blobs inside the glass |
| D26 | `concrete_pillar` | Garage concrete pillar — **PACK 2026-11-04** (Metro PSX `Column`; the hazard band + bay number stay) | 9 | 2000 | A square reinforced concrete parking garage pillar with chipped corners and a yellow and black hazard stripe band near the base |
| D27 | `stocks` | Medieval stocks — **WIRED 2026-11-03** | 9 | 6000 | Medieval wooden pillory stocks with holes for the head and hands, on two wooden posts |
| D28 | `school_desk` | School desk — **WIRED 2026-11-03** | 9 | 6000 | An old school desk with an attached seat, a wooden top and a steel tube frame |
| D29 | `toilet_paper` | Toilet paper roll — **PACK 2026-11-04** (House Toilet_paper) | 8 | 1000 | A single roll of white toilet paper |
| D30 | `tulip_chair` | Tulip chair — **WIRED 2026-11-03** | 8 | 6000 | A white tulip chair with a red seat cushion on a single pedestal base |
| D31 | `tulip_table` | Tulip table — **WIRED 2026-11-03** | 8 | 4000 | A white round tulip table on a single pedestal base |
| D32 | `eeg_rack` | EEG machine trolley — **WIRED 2026-11-03** | 8 | 8000 | A medical trolley holding an EEG monitoring machine with a blank screen and knobs |
| D33 | `lava_lamp_floor` | Floor lava lamp — **WIRED 2026-11-03** (Meshy base + cap; row was stale). Molten Maps `Lava_Lamp` exists; mondo 11-04 KEEPS this one (the moving wax) | 7 | 4000 | A tall floor-standing 1970s lava lamp about 1.5 metres tall, chrome base, orange wax blobs in a tall glass column |
| D34 | `disc_cluster` | Disc cluster ceiling lamp — **WIRED 2026-11-03** | 7 | 6000 | A 1970s ceiling lamp made of a cluster of white discs on rigid chrome rods from a chrome canopy |
| D35 | `sputnik_lamp` | Sputnik chandelier — **WIRED 2026-11-03** | 6 | 6000 | A brass sputnik chandelier: a central sphere with radiating rods each ending in a small bulb |
| D36 | `dream_eye` | Eye on a stalk (Astral) — **WIRED 2026-11-03** | 6 | 12000 | A surreal giant eyeball with eyelids on a thick fleshy stalk growing from the ground |
| D37 | `pool_umbrella` | Pool umbrella — pack candidate: the beach pack parasol (licence not recorded; ask mondo) | 6 | 4000 | An open patio pool umbrella with a white and blue striped canopy on a pole with a weighted base |
| D38 | `robot_arm` | Industrial robot arm — **WIRED 2026-11-03** | 6 | 12000 | An industrial yellow six-axis robotic arm on a floor base with a gripper |
| D39 | `ticket_booth` | Carnival ticket booth — **WIRED 2026-11-03** | 6 | 12000 | A carnival ticket booth: a small red and white striped wooden kiosk with a window and a little peaked roof |
| D40 | `anemone` | Sea anemone — **WIRED 2026-11-03** | 5 | 6000 | A sea anemone with many soft pink tentacles on a small rock |
| D42 | `grow_lamp` | Grow lamp — **WIRED 2026-11-03** (row was stale; the Molten `Hydroponics_Lamp` the old status named is a desk lamp on a stand, not a ceiling panel) | 5 | 3000 | A hydroponic grow light fixture: a rectangular reflector hood with a purple LED panel on short rigid hanger rods |
| D43 | `star_projector` | Planetarium star projector — **WIRED 2026-11-03** | 4 | 12000 | A planetarium star projector, a dumbbell-shaped machine with two studded spheres on a pedestal |
| D44 | `meat_hook` | Meat hook rail — **WIRED 2026-11-03** | 4 | 3000 | A short steel butcher's rail with three S-shaped meat hooks hanging from it on rigid hooks, no chains |
| D45 | `laundry_cart` | Laundry cart — **WIRED 2026-11-03** | 4 | 4000 | A laundry cart: a canvas bin on a metal frame with casters |
| D46 | `umbrella_stand` | Umbrella stand — **WIRED 2026-11-03** | 4 | 4000 | A brass umbrella stand holding two closed umbrellas |
| D47 | `lifeguard_chair` | Lifeguard chair — **WIRED 2026-11-03** | 4 | 8000 | A tall white wooden lifeguard chair with a ladder |
| D48 | `conveyor` | Roller conveyor (also conveyor_z) — **WIRED 2026-11-03** | 4 | 8000 | An industrial roller conveyor section about 3 metres long on steel legs |
| D49 | `popcorn_cart` | Popcorn cart — **WIRED 2026-11-03** | 4 | 10000 | A vintage red popcorn cart with a glass case full of popcorn and spoked wagon wheels |
| D50 | `sea_vent` | Black smoker vent — **WIRED 2026-11-03** | 3 | 8000 | A deep sea hydrothermal vent chimney, a tall black smoker of dark rock |
| D51 | `nightmare_bloom` | Flower of teeth (Astral) — **WIRED 2026-11-03** | 3 | 10000 | A surreal giant flower whose petals are rows of bone-white teeth on a thick dark stem |
| D52 | `broom` | Broom — **PACK 2026-11-04** (House Broom) | 3 | 2000 | A traditional straw broom with a wooden handle |
| D53 | `serving_line` | Cafeteria serving counter — pack candidate: BurgerPiz counter (part of the look only) | 3 | 10000 | A cafeteria serving counter with a glass sneeze guard shelf and empty steel food trays |
| D54 | `pod_bed` | Capsule sleep pod — pack candidate: Molten bunk beds (not a pod) | 3 | 12000 | A futuristic capsule sleep pod bed with a curved canopy cover, white and grey |
| D55 | `roller_shutter` | Roller shutter — **PACK 2026-11-04** (Tacos `doors_garage`, steel garage doors) | 3 | 4000 | A closed metal roller shutter shop door of corrugated grey steel with a box housing at the top |
| D56 | `washer` | Washing machine — **PACK 2026-11-04** (House Washing_machine) | 3 | 6000 | A white front-loading washing machine |
| D57 | `dryer` | Tumble dryer — **PACK 2026-11-04** (Abandoned House Secadora) | 3 | 6000 | A white front-loading tumble dryer |
| D58 | `toilet_stall` | Toilet stall — **PACK 2026-11-03** (§10F swap; row was stale) | 3 | 8000 | A public restroom toilet stall with grey partition walls, an open door and a white toilet inside |
| D59 | `round_table` | Round table (Camelot) — **WIRED 2026-11-03** | 3 | 30000 | A huge round oak table for twelve with twelve high-backed carved wooden chairs around it |
| D60 | `departures_board` | Departures board — **WIRED 2026-11-03** | 3 | 3000 | A railway station departures board: a black rectangular split-flap board in a metal frame, blank with no letters |
| D61 | `barber_chair` | Barber chair — **WIRED 2026-11-03** | 2 | 12000 | A vintage barber chair in red leather and chrome with a footrest and hydraulic base |
| D62 | `barber_pole` | Barber pole — **WIRED 2026-11-03** | 2 | 2000 | A wall-mounted barber pole: a red, white and blue spiral glass cylinder between chrome caps |
| D63 | `urinal` | Urinal — **PACK 2026-11-03** (§10F swap; row was stale) | 2 | 3000 | A white wall-hung urinal |
| D64 | `hand_dryer` | Hand dryer — **PACK 2026-11-03** (§10F swap; row was stale) | 2 | 2000 | A wall-mounted stainless steel hand dryer |
| D65 | `shower_stall` | Shower stall — **PACK 2026-11-03** (§10F swap; row was stale) | 2 | 6000 | A white tiled shower stall with a chrome shower head |
| D66 | `skiff` | Sailing skiff — **WIRED 2026-11-03** | 2 | 16000 | A small wooden sailing skiff about 5 metres long with one mast and a furled canvas sail |
| D67 | `lighthouse` | Lighthouse — **WIRED 2026-11-03** | 2 | 20000 | A white and red striped lighthouse tower with a lantern room and a gallery railing at the top, on a stone base |
| D68 | `trophy_case` | Trophy case — **WIRED 2026-11-03** | 2 | 10000 | A wooden glass-front trophy cabinet with gold trophies on its shelves |
| D69 | `laminator` | Laminator — **WIRED 2026-11-03** | 2 | 1600 | A grey plastic desktop office laminating machine |
| D70 | `exec_desk` | Executive desk — **WIRED 2026-11-03** | 2 | 10000 | A large mahogany executive desk with a leather inlay top and drawers |
| D71 | `mushroom_lamp` | Mushroom lamp — **WIRED 2026-11-03** | 2 | 3000 | A 1970s mushroom table lamp with a glossy orange dome shade |
| D72 | `space_divider` | Space-age room divider — **WIRED 2026-11-03** | 2 | 6000 | A 1960s room divider screen, a white panel with a pattern of circular cut-outs |
| D73 | `kitchen_range` | Commercial range — **PACK 2026-11-03** (§10F swap; row was stale) | 2 | 10000 | A commercial stainless steel kitchen range with six burners and an oven |
| D74 | `range_hood` | Range hood — **PACK 2026-11-03** (§10F swap; row was stale) | 2 | 4000 | A stainless steel commercial kitchen range hood |
| D75 | `chalkboard` | Chalkboard — **PACK 2026-11-04** (VHS Shop `Blackboard`; the type-wheel text stays on its face) | 2 | 2000 | A blank green school chalkboard in a wooden frame with a chalk tray |
| D76 | `door_furnace` | Incinerator furnace — **WIRED 2026-11-03** | 2 | 12000 | A large brick industrial incinerator furnace with a heavy iron door |
| D77 | `carousel` | Carousel — **WIRED 2026-11-03** | 2 | 40000 | A vintage fairground carousel with painted horses on poles under a striped canopy |
| D78 | `high_striker` | High striker — **WIRED 2026-11-03** | 2 | 8000 | A carnival high striker strength tester: a tall red and white tower with a bell at the top and a lever pad at the base |
| D79 | `giant_clam` | Giant clam — **WIRED 2026-11-03** | 1 | 6000 | A giant clam with an open wavy-edged shell and a blue interior mantle |
| D80 | `sink_row` | Row of sinks — **PACK 2026-11-03** (§10F swap; row was stale) | 1 | 8000 | A row of three white bathroom sinks set in a countertop with chrome taps |
| D81 | `submarine` | Bathyscaphe submarine — **WIRED 2026-11-03** (row was stale; mondo asked for Meshy: the BlenderVoyage sub is an open wreck) | 1 | 20000 | A small brass and riveted bathyscaphe research submarine with a round viewport and two lamps |
| D82 | `directory_board` | Mall directory kiosk — **WIRED 2026-11-03** | 1 | 4000 | A free-standing mall directory kiosk with an illuminated panel showing a blank map |
| D83 | `rocking_chair` | Rocking chair — **WIRED 2026-11-03** | 1 | 6000 | A wooden rocking chair |
| D84 | `music_box` | Music box — **WIRED 2026-11-03** | 1 | 4000 | A small wooden music box with the lid open and a tiny ballerina inside |
| D85 | `punch_clock` | Punch clock — **WIRED 2026-11-03** | 1 | 4000 | A vintage employee punch time clock with a card rack beside it |
| D86 | `card_catalogue` | Card catalogue — **WIRED 2026-11-03** | 1 | 10000 | A library card catalogue cabinet: a wall of small wooden drawers with brass handles |
| D87 | `pot_rack` | Pot rack — **WIRED 2026-11-03** | 1 | 8000 | A ceiling-hung iron kitchen pot rack on short rigid rods with copper pots and pans hanging from hooks |
| D90 | `autopsy_table` | Autopsy table — **WIRED 2026-11-03** | 1 | 6000 | A stainless steel autopsy table with drain channels on a pedestal |
| D91 | `ferris_wheel` | Ferris wheel — **WIRED 2026-11-03** | 1 | 40000 | A small fairground ferris wheel with gondola seats on a white steel frame |
| D92 | `scoreboard` | Stadium scoreboard — **WIRED 2026-11-03** | 1 | 12000 | A big stadium scoreboard: a tall frame on legs with a large blank screen and a clock panel |

### 10B. Spell props still missing (from the spell look audit, docs: project files spell-vfx-audit/fix/MISSING_MODELS.md)

| # | prop | spell | concept prompt |
| --- | --- | --- | --- |
| S01 | piano | Things That Go Bump (ghost) — **WIRED 2026-11-03** | A black upright piano with the lid closed |
| S02 | sheep | Counting Sheep (dreameater) — **WIRED 2026-11-03** | A fluffy white cartoonish-realistic sheep standing |
| S03 | polaroid | Cryptid Vanish (loch ness monster) | An instant polaroid photograph showing a blurry photo of a lake, white frame |
| S04 | tripod_machine | Tripod Sweep (martian) — **WIRED 2026-11-03** | A towering three-legged alien tripod fighting machine with a domed head and a heat-ray arm, War of the Worlds style |
| S05 | organ_pipe | Excessive Machine (Barbarella) — **WIRED 2026-11-03** (`Assets/world/props/meshy_decor/organ_pipe_white.glb`; the 9 pipes that rise round the victim were code cylinders in the gold sheet; brass concept also made, project files gold-texture/) | A single tall pipe-organ pipe: a long cylinder with the flat lip mouth cut-out near the bottom and a short cone foot |

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

### 10F. MESHY → ELBOLILLODURO PACK SWAPS — done 2026-11-03 (mondo: "replace the meshy models in the game that it downloaded an asset pack for. Except for urban buildings")

Each piece was cut out of its pack scene in Blender (bake-pack-pieces.py), recentred, turned to face the way the Meshy model faced, and uploaded as `Assets/world/packs/elbolilloduro/ebd_<pack>_<item>.glb`; the catalogue row keeps its size (h / span), so only the look changed. Side-by-side sheets: project files `asset-packs/meshy-swap/`. All 14 packs are CC0.

| key | Meshy file it replaced | new file | pack |
| --- | --- | --- | --- |
| `cash_register` | `Meshy_AI_beige_1980s_cash_regi_0910054541_texture.glb` | `ebd_pizzeria_cash_register.glb` | Pizzeria PSX |
| `dumpster` | `Meshy_AI_dumpster_0727195512_texture.glb` | `ebd_diner_dumpster.glb` | DINER |
| `trash_bin` | `Meshy_AI_trash_bin_0910054450_texture.glb` | `ebd_trailerpark_trash_bin.glb` | Trailer Park |
| `city_bin` | `Meshy_AI_a_city_bin_0917065144_texture.glb` | `ebd_6twelve_city_bin.glb` | 6TWELVE |
| `fire_extinguisher` | `Meshy_AI_a_fire_extinguisher_0903105310_texture.glb` | `ebd_6twelve_fire_extinguisher.glb` | 6TWELVE |
| `coffee_maker` | `Meshy_AI_coffee_maker_0910054513_texture.glb` | `ebd_psx3_coffee_maker.glb` | Paquete de modelos psx 3 |
| `microwave` | `Meshy_AI_beige_1980s_microwave_0910054901_texture.glb` | `ebd_psx3_microwave.glb` | Paquete de modelos psx 3 |
| `water_cooler` | `Meshy_AI_a_water_cooler_0903105259_texture.glb` | `ebd_laundry_water_cooler.glb` | Laundry |
| `mop` | `Meshy_AI_a_mop_0903105505_texture.glb` | `ebd_house_mop.glb` | House |
| `tube_tv` | `Meshy_AI_a_tube_tv_0903102007_texture.glb` | `ebd_trailerpark_tube_tv.glb` | Trailer Park |
| `retro_radio` | `Meshy_AI_retro_radio_0910054335_texture.glb` | `ebd_trailerpark_retro_radio.glb` | Trailer Park |
| `rotary_phone` | `Meshy_AI_analog_phone_0910054719_texture.glb` | `ebd_vhsshop_rotary_phone.glb` | VHS Shop |
| `wall_clock` | `Meshy_AI_a_clock_0903110243_texture.glb` | `ebd_trailerpark_wall_clock.glb` | Trailer Park |
| `filing_cabinet` | `Meshy_AI_a_filing_cabinet_0903105233_texture.glb` | `ebd_laundry_filing_cabinet.glb` | Laundry |
| `bus_shelter` | `Meshy_AI_bus_shelter_0917064913_texture.glb` | `ebd_busstop_bus_shelter.glb` | Bus stop |
| `campfire` | `Meshy_AI_a_campfire_ring_0916235856_texture.glb` | `ebd_survival_campfire.glb` | Survival PSX |
| `camping_tent` | `Meshy_AI_a_camping_tent_0922010306_texture.glb` | `ebd_survival_camping_tent.glb` | Survival PSX |
| `ship_lantern` (+ the ships' `lantern`) | `Meshy_AI_a_hanging_lantern_0912231043_texture.glb` | `ebd_survival_lantern.glb` | Survival PSX |
| `fallen_log` | `Meshy_AI_a_fallen_log_0916235700_texture.glb` | `ebd_vegetation_fallen_log.glb` | Vegetation |
| `stump` | `Meshy_AI_a_stump_0916235717_texture.glb` | `ebd_vegetation_stump.glb` | Vegetation |
| `rowboat` | `Meshy_AI_a_rowboat_0912231059_texture.glb` | `ebd_housesonwater_rowboat.glb` | Houses on the water |
| `locker` | `Meshy_AI_a_locker_0903105424_texture.glb` | `ebd_mine_locker.glb` | Mine |
| `vending_machine` | `Meshy_AI_a_round_vending_machine_0903105625_texture.glb` | `ebd_laundry_vending_machine.glb` | Laundry |
| `sink` | `Meshy_AI_a_sink_0903105415_texture.glb` | `ebd_burgerpiz_sink.glb` | BurgerPiz |
| `table_lamp` | `Meshy_AI_a_lamp_0903110007_texture.glb` | `ebd_trailerpark_table_lamp.glb` | Trailer Park |
| `desk_lamp` | `Meshy_AI_an_office_desk_lamp_0903110208_texture.glb` | `ebd_house_desk_lamp.glb` | House |

Not swapped (no pack piece matches): `school_bus` (the bus-stop pack's bus is a blue city bus), `cardboard_box` / `cardboard_boxes` (the packs have produce crates and plastic totes), `wooden_bucket` (metal pail only), `car_cop` (already drawn by the low-poly car pack; the Meshy file is only its fallback), fridges, `signpost`, roads, urban buildings (mondo: later).

### 10G. THE GOLD-SHEET PIECES — code shapes that wore terrain/gold.png (2026-11-03, mondo: "I previously requested that that gold texture be removed from the game, and those rods should have shown up in the model list as needing to be replaced")

The 2026-09-21 swap (TERRAIN_SPRITES `gold` = the aluminium sheet tinted gold) missed every spell / deployable piece that loaded
`Assets/world/terrain/gold.png` by file name. Since 2026-11-03 nothing loads that file (three-vfx-effects.js `_SIG_GOLD_TEX` +
`_sigTerrainTex`, three-renderer.js `_getTeslaTex`): these pieces wear the tinted aluminium gilt until each gets a model. All are
code shapes (cylinders / boxes / tori) and need a real model (pack or Meshy).
**2026-11-04 audit:** the "needs" column names the model the game or a pack ALREADY has; only G05 bow, G10 gold record, G11 gavel and
G13 lipstick have none. Wiring any of them is mondo's call (spell looks).

| # | piece | spell / object | code (file · function) | needs |
| --- | --- | --- | --- | --- |
| G01 | organ pipes ×9 (the "gold rods") | Excessive Machine (Barbarella) | three-vfx-effects.js `_afOrgan3D` | **DONE 2026-11-03**: the Meshy organ pipe (10B S05), code cylinders deleted |
| G02 | knuckle plates on the giant fist | the unholy finisher's fist (`_sigStandFist3D`) | three-vfx-effects.js `_sigStandFist3D` | gauntlet / fist model — **in the game already:** the Meshy armour gauntlet (gear) / the Meshy fist; no pack fist |
| G03 | shield trim | every spell that raises the heater shield | three-vfx-effects.js `_sigBuildShield` | shield model — **in the game already:** the Meshy spell `shield` (§7a) |
| G04 | ejected shell casings | gun rig shots (`_sigGunRig3D`) | three-vfx-effects.js `_sigGunRig3D` | brass shell casing model — **pack has one:** Survival PSX `Bullet` (Elbolilloduro) |
| G05 | arrow-tip / bow nocks | bow shots (`_sigBowShot3D`) | three-vfx-effects.js `_sigBowShot3D` | bow model — no pack bow found 2026-11-04 (Meshy if mondo wants it) |
| G06 | stand-in blade (only while the sword GLB loads) | Excalibur Strike | three-vfx-effects.js `_sigExcalibur3D` | none — the master-sword GLB is the real one |
| G07 | crown | Royal Decree + the finishers that crown the caster | three-vfx-effects.js `_sigCrown3D` | crown model — **in the game already:** Meshy props `11_royal-crown` |
| G08 | judgment blade ×2 | judgment / Divine Judgment | three-vfx-effects.js `judgment` (sword builder) | golden sword model — **in the game already:** the master sword (Meshy) |
| G09 | spear shafts ×6 | Knights of Round | three-vfx-effects.js `raceKnightsOfRound` (`_sigSpearPrison3D`) | spear model — **pack has one:** the Spear pack (human-made) |
| G10 | gold record | Chart Topper | three-vfx-effects.js `_PZ_SIGS.chartTopper` | gold record model — no pack record found 2026-11-04 (Meshy if mondo wants it) |
| G11 | gavel head bands | Frontier Justice (`pzJustice`) | three-vfx-effects.js `_PZ_SIGS.justice` | gavel model — no pack gavel (Christmas pack `Hammer` only) (Meshy if mondo wants it) |
| G12 | golden chain (36 tori) | Fetter (Valkyrie) | three-vfx-effects.js `_PZ_SIGS.fetter` | chain model — **pack has one:** traps pack `Chain_Draped` (human-made, in the game as wall_chains) |
| G13 | lipstick case | Lipstick Pistol (spy) | three-vfx-effects.js `_PZ_SIGS.spyLipstickPistol` | lipstick model — no pack lipstick found 2026-11-04 (Meshy if mondo wants it) |
| G14 | wheat heads | Bumper Crop | three-vfx-effects.js `_PZ_SIGS.nvBumperCrop` | wheat sheaf model — **pack has one:** the bus-stop pack `Wheat` |
| G15 | orichalcum bands | Pillar of Atlantis (atlantean deployable) | three-renderer.js `_buildAtlantisPillar3D` | column model — **in the game already:** the Meshy greek column |
| G16 | brass disc body | Flashbang Mine (gnome deployable) | three-renderer.js `_buildFlashbangMine3D` | mine model — **in the game already:** the Meshy landmine |
| G17 | gate trim | Grave Gate (deployable) | three-renderer.js `_buildGraveGate3D` | gate model — **pack has one:** castle pack `Gate_2x4` / Halloween `Fence_Metal` gate |

### 10D. NOT A MODEL JOB (60) — decals, lit windows/screens, text, walkable steps/ramps, water, effects

`floor_stain` (decal), `warning_tape` (decal), `light_shaft` (light effect), `ritual_circle` (decal), `door_seal` (decal), `doormat` (flat mat), `parking_bay` (floor paint), `platform_edge` (floor paint), `track_bed` (floor strip), `find_tape` (find marker), `find_pay` (find marker), `find_deck` (find marker), `find_stash` (find marker), `riser_1` (walkable riser), `riser_2` (walkable riser), `riser_3` (walkable riser), `stair_step` (walkable step), `stair_step_x` (walkable step), `stair_landing` (walkable landing), `stair_landing_sq` (walkable landing), `house_stairs` (walkable stair), `quarter_pipe` (skate ramp), `garage_ramp` (walkable ramp), `infinity_pool` (water surface), `lap_pool` (water surface), `garden_ring` (flower bed ring), `star_dome` (ceiling effect), `star_chart` (flat wall chart), `festoon` (string lights (strings model badly)), `crib_mobile` (hanging strings (model badly)), `bigtop` (tent cloth ceiling), `porthole` (lit window), `pod_window` (lit window), `false_window` (lit window), `sun_viewport` (lit window), `shaft_window` (lit window), `dream_screen` (lit screen), `now_serving` (lit sign), `evac_button` (wall button), `keypad` (wall keypad), `floor_panel` (lit wall panel), `car_panel` (lit lift panel), `door_xray` (lit x-ray panel), `wall_padding` (wall surface), `graffiti_wall` (wall paint), `price_tag` (card), `sale_banner` (flat banner), `lesson_plaque` (text plaque), `lesson_sign` (text plaque), `motto_plaque` (text plaque), `wall_plaques` (text plaques), `form_sheet` (paper), `thoughtform` (breathing effect (mondo's wish: the core only)), `mobius_bar` (impossible shape), `impossible_stair` (impossible shape), `temple_dome` (glass dome effect), `door_vine` (vine growth), `garbage_chute` (wall hatch), `barber_mirror` (mirror), `street_drain` (manhole decal)

### 10E. Old wishlist items with no stand-in yet (new dressing, by zone) — not concepted; ask mondo first

**2026-11-04 audit — packs that ALREADY have these** (use them before Meshy): police barricade = the Meshy `policeBarricade` (§7a);
fallen street lamp = `streetlamp` (Assets/world/props/meshy/streetlamp, laid down); rooftop AC unit = 6twelve `Air_conditioners` / Molten
`Air_Con`; rail track section = the mine pack `Rails`; manhole ladder / pool ladder = House / Playground `Ladder`;
castle wall with battlements + round tower = the castle pack `Wall_2x4` / `Tower_Mid` (Castles_and_Forts.glb); candelabra = the
Halloween candles; broken column = the Meshy greek column or a castle `*_ruined` piece; brick stack / timber scaffold = check
`object_names_in_every_downloaded_pack.json` first. Everything else below: no pack piece found.

- **Disaster City**: low-poly city buildings (2-4 storey brick block, office tower, parking garage), arcade cabinet, newspaper box, mailbox, police barricade, fallen street lamp, scaffolding, water tower, rooftop AC unit, food-court table set, subway entrance canopy
- **The D.U.M.B.**: tram / people-mover car, situation board (curved wall screen), round war-room table, wine rack, home cinema seat, particle detector ring, beamline pipe on stands, EEG cap on a stand, Zener card deck, Faraday cage
- **Camelot Kingdom**: drawbridge, stone gargoyle, wizard's workbench, trestle table + benches, castle wall with battlements, round tower
- **The Sewers / tunnels**: manhole ladder + shaft, cast-iron pump + valve wheel, rail track section, signal gantry, maintenance trolley, police booking desk, drunk-tank bench, mine cart, mine timber set
- **The Deep / Atlantis / The Beach**: sunken Atlantean head statue, broken marble arch, treasure pile, brass diver's helmet, open shipwreck section, Flight 19 Avenger wreck, mooring post
- **Leylines**: fallen trilithon, bluestone, sphinx, pyramid casing block, mudbrick kiln, brick stack, timber scaffold, amber keystone, surveyor's tripod, dig kit (wheelbarrow, sieve table, finds tray), barrow entrance
- **Heaven + Hell + Vatican**: candelabra / bone chandelier, broken column
- **Astral**: ticket dispenser, bed with something under it, closet with no back
- **DOOR HQ floors**: pool ladder + starting block

## 11. CODE-BUILT SHAPES — replacement proposal (2026-11-03, awaiting mondo)

mondo 11-03: "focus on the things that were purely coded like the cones ... a box for a building is perfectly fine, but other
stuff just looks really bad". Each code-only builder in §8b was drawn alone in a browser and judged. Full proposal with
before/after thumbnails: Claude Doc "Coded shapes worth replacing" (https://claude.ai/artifact/WFS1U2pejBAp4cqXQr6wyF).
mondo answered 11-03 (thread "Coded shapes"); rows marked DONE / DELETED are in. Also deleted 11-03: the `hills` + `dunes` rims and the ground
swells (`_nrMounds` of grass / sand / dirt / snow / rubble; the cloud banks stay) — mondo: "no map should be using the dune swells or hill swells". Existing rules only; replacing = the builder wears the model.

| # | coded piece (three-renderer.js) | verdict | replacement |
| --- | --- | --- | --- |
| 1 | castle / skycastle landmarks | **DONE 11-03 (round 2)**, code deleted | castle pack pieces placed one by one: Wall_2x4 / Wall_2x2 / Gate_2x4 curtain, Tower_Mid corner towers, a Tower_Doorway keep, Tower_top_1 + Roof_Cone caps (the sky castle keeps its clouds) |
| 2 | iceberg ring `bergs` (cones) | **DONE 11-03**, code deleted | ocean pack rocks tinted ice white |
| 3 | `_hzObelisk` | **DONE 11-03 (round 2)**, code deleted | new Meshy granite obelisk (`Assets/world/props/meshy_decor/obelisk.glb`, mondo: "needs a new meshy model") |
| 4 | `_hzLighthouse` | **DONE 11-03**, code deleted | Meshy decor lighthouse |
| 5 | sea stack / island | island **DONE 11-03** (code deleted, palm isle); sea stack kept (mondo: looks fine) | palm isle |
| 6 | greek ruin + ruins rim | **DONE 11-03 (round 2)** | greek ruin: the standing columns are the NEW Meshy column (`greek_column.glb`) (the code shape kept, mondo likes it; the broken stubs are gone); ruins rim: ONE castle pack ruined piece per spot (Wall_2x4_ruined, Wall_2x2_ruined, Tower_mid_hollow_ruined), no clusters |
| 7 | rover | **DONE 11-03**, code deleted | mars_rover |
| 8 | toadstool / fairy ring | **DONE 11-03**, code deleted | mushroom / a ring of mushroom2 |
| 9 | censer | **DONE 11-03**, code deleted | Meshy props censer |
| 10 | whale (Atlantis) | **DONE 11-03**, code deleted | ocean pack Whale.fbx (mondo: not the humpback) |
| 11 | castle_wall | **KEPT as code** (mondo: only if the shape makes sense) | the spell wall is 1 square wide and 2 high; the pack has no piece that shape (Wall_2x2 is square, Wall_2x4 is 4 long), so the swap would change the wall |
| 12 | gateway / arch | **DONE 11-03 (round 2)**, code deleted | new Meshy curved stone arch (`stone_arch.glb`, mondo: "an arch is curved") |
| 13 | brazier | **DONE 11-03**, code deleted | Meshy cave_torch + a glow |
| 14 | rose window | pack swap | gothic pack Wall_Window_Rose (195 MB source: optimize first) |
| 15 | greytube | **DONE 11-03 (round 2)**, code deleted | Molten Maps sci-fi pack Cryo_Tube_ON (CC0), `Assets/world/props/meshy/molten_cryo_tube.glb` |
| 16 | iso_tank | **DONE 11-03 (round 2)**, code deleted | Molten Maps sleeper casket (CC0), `Assets/world/props/meshy/molten_sleeper_casket.glb` |
| 17 | lava lamps | **DONE 11-03 (round 2)**, base + cap code deleted | Meshy chrome base + cap (table and floor, `lava_lamp_*.glb`); the glass + the moving wax stay drawn (Meshy can't make glass; mondo: the Molten lamp looks bad) |
| 18 | grow_lamp | **DONE 11-03 (round 2)**, code deleted | Meshy LED panel (`grow_lamp.glb`), the purple glow + light kept |
| 19 | submarine | **DONE 11-03 (round 2)**, code deleted | Meshy riveted yellow sub (`submarine.glb`; mondo: the PSX pack sub looked worse than the code one) |
| 20 | hand_dryer / range_hood / kitchen_range / sink_row | **DONE 11-03 (round 2)**, code deleted | DINER pack Hand_dryer, cooker_hood, Stove (griddle range), Washbasin (three basins) |
| 21 | urinal | **DONE 11-03 (round 2)**, code deleted | BurgerPiz pack urinary |
| 22 | toilet / shower stall | **DONE 11-03 (round 2)**, code deleted | Gas station pack stall (two partitions, the door, the toilet); House pack shower (tiles + glass door) |
| 23 | `_hzFloatingIsland` (upside-down cone) | **DELETED 11-03** (mondo: "just get rid of it, i hate the cones") | — |
| 24 | `_hzColossus` | **RENAMED 11-03** to `fallen_column` / `_hzFallenColumn` (mondo: it's a column on the floor, not a colossus) | — |
| 25 | `_hzFleshMound` | **DONE 11-03 (round 2)**, code deleted | a heap of the Halloween pack body parts (the gore spells' pack), each placed on its own |
| 26 | effigy monument (Bohemian Grove) | **DONE 11-03 (round 2)**, code deleted | Meshy bier + Meshy wrapped figure, two models (`effigy_bier.glb`, `effigy_figure.glb`) |
| 27 | windmill monument (Skinwalker Ranch) | **DONE 11-03 (round 2)**, code deleted | Meshy windpump tower + its wheel on its own, turning (`windpump_tower.glb`, `windpump_wheel.glb`) |
| 28 | `_hzGrinSkull` | new Meshy model | giant stone skull — **2026-11-04: not needed.** The builder already wears the game's bone `skull` GLB (`_boneGlbClone('skull')`); the code skull is only the fallback while it streams |
| 29 | far mountain range (removed cones, PR #846) | new Meshy model, only if wanted | low-poly far range |
| - | pyramids rim, Giza near, `pyramid_cone` | mondo's call | 4-sided shape is right but flat; option: Meshy limestone pyramid (`Pyramid.glb` is a cosmic one, not Giza) |

Fine as they are (left alone): gate/waterspout landmarks; (the tower weenie: round 3; hills + dunes rims deleted 11-03; trees / town / city / bergs / ruins / pyramids / craters rims deleted 11-03 (nothing drew them; the town's pack houses stand in the site rooms); the stairway landmark has one-square treads 11-03); monolith (thicker, no purple rune, 11-03),
ziggurat (top is a cube, 11-03), stairway (one-square treads, 11-03), tome, tablet, card, flag, candy cane, igloo, biodome, beam ring, cargo, wooden cross, whale bones, geode,
void solids, girder knot, gold gate, holo pieces, exit sign, fluorescent tube, sacred rings, orbs, lenticular cloud, inner
sun; box-room near settings; §10C/§10D procs. Chess pieces and the Göbekli T-pillar already wear models.

## 12. THE MESHY AUDIT (2026-11-04)

mondo 11-04: "Why ... did you have me making meshy models for the stadium lights and other stuff when we already have non meshy
versions??? You are supposed to document every single model and try to not use meshy models." What the audit checked: every
Meshy prompt / to-do list (§10A-10G, §11, project files `meshy/decor/decor_prompts.json`, the Meshy pieces lists) against §6/§7,
every model file on R2 (§13, 2,708 files) and every node of every downloaded pack (`object_names_in_every_downloaded_pack.json`).

**The stadium floodlight:** no human-made floodlight exists. No downloaded pack has one, and the game had none before the Meshy
`flood_mast` (D04, regenerated D04c on 11-03). The "Beach world props v4" sheet labelled its Meshy decor models "decor" without
saying they are Meshy: a sheet fault, not a duplicate. (A code-drawn floodlight tower, `_nrTower` in the battle settings,
also exists: code, not a model.)

**What was wrong with the list** (fixed in this PR):
- the car pack: 8 catalogue cars + the NPC traffic draw mondo's GGBot low-poly cars, but were listed as Meshy. They are now listed
  as the pack, and the Meshy cars sit under "Meshy files kept only as a FALLBACK" (§6).
- 19 §10A rows still read "needs a new model" although they were done: 5 wired Meshy decor (D09, D25, D33, D42, D81), 7 swapped to
  packs on 11-03 (§10F: D58, D63, D64, D65, D73, D74, D80) and 7 with a pack piece never wired (below). §10A now has an AUTO column.
- the procs that wear a model through a helper or a ternary (`_hqLavaLampBuild`, `_HQ_DECOR_GLB.grow_lamp`) counted as code.
- about 1,700 R2 model files were in no table: §13 lists every one now, with why it is there.

**Swapped to pack pieces (wired 2026-11-04, `bake-pack-pieces.py` AUDIT jobs, three-renderer.js `_HQ_PACK_WEAR`):**
D03 steel_table (DINER `Table_Metal`), D05 metal_shelving (Gas Station `Shelf_Metal`), D11 wall_shelf (House `Shelf_01`),
D29 toilet_paper (House `Toilet_paper`), D52 broom (House `Broom`), D56 washer (House `Washing_machine`), D57 dryer (Abandoned
House `Secadora`). These had no Meshy model yet, so nothing was deleted.

**Meshy made although the decor list named a pack (11-03):** D25 / D33 lava lamps: the Molten Maps `Lava_Lamp` (CC0) is a whole
lava lamp and fits — a real duplicate, but mondo kept the Meshy lamp for its moving wax (2026-11-04). D42 grow lamp:
the named Molten `Hydroponics_Lamp` is a desk lamp on a stand, not the ceiling panel the room needs, so the Meshy one stays. D81
submarine: the BlenderVoyage PSX sub is a broken-open wreck, and mondo asked for a Meshy bathyscaphe (11-03), so it stays.

**Switched on 2026-11-04 (mondo: "keep the lava lamp with moving wax, and switch those on"):** D01 bare_bulb (Abandoned House
`Foco`), D26 concrete_pillar (Metro `Column`), D55 roller_shutter (Tacos `doors_garage`), D75 chalkboard (VHS Shop `Blackboard`),
the turnstile (Metro `automatic_ticket_gate`; its tripod is part of the model, so it no longer turns). The lava lamps KEEP their
Meshy base + cap and the drawn moving wax (mondo). **Still pack candidates (his call):** D37 pool_umbrella (beach pack parasol, licence not
recorded), D53 serving_line (BurgerPiz counter, partial), D54 pod_bed (Molten bunk beds).

**Meshy models in the game that a pack could replace (not swapped: mondo approved these Meshy models; his call):** candles ↔
Halloween `Candle`; sarcophagus ↔ traps `Sarcophagus`; subway cars ↔ Metro `subway_car`; 1 m railing ↔ the stairs pack railings;
office chairs ↔ `computer_chair_blue` / `_grey`; VHS tape / player ↔ VHS Shop `VHS`; bullet ↔ Survival `Bullet`; sniper ↔
Survival `hunting_rifle`; throwing knife ↔ Survival `knife`; tongs ↔ Pizzeria `tongs`; mic ↔ VHS Shop `Microphone`; sack ↔
Quequis `sack_flour`; teapot ↔ Vegetation `teapot`; fern ↔ alxlab `Fern`; clock ↔ Laundry / Trailer `Clock`; breaker panel ↔
Trailer `Fuse_box`; traffic cone ↔ exploration-objects `Cone`; city bench ↔ Playground `Bench`.

**Genuinely still needs a new model (no pack piece found):** §10A rows still reading "code" with "none fits" (D16
radiation_sign, D17 planter); §10G G05 bow, G10 gold record, G11 gavel, G13 lipstick; the §10E items not named in its audit
note; a far mountain range (§8b). Meshy only after mondo's OK on each, with the packs checked named on the to-do row.


## 12b. THE PIZZA DOGGY PSX MEGA PACK — on R2, NOT wired yet (2026-11-08)

mondo 11-08: "Found a coupon code from the creator of the psxmegapack ... see what all is in the pack and what can be used in the
game and add the models to the model list and correct assets folders in the game bucket." (Thread "Add PSX Mega Pack models to
the game".) He bought it; he dropped it unzipped in the art bucket `dirtymondo:inbox/psxmegapack/` (models/glb/<category>/ +
textures/). It is the current PSX Mega Pack (592 models; the 2026-11-03 contents list in project files
`asset-packs/contents-lists/pizzadoggy_psx-mega-pack_CONTENTS.txt` is an older 489-model version).

**THE LICENCE (Pizza Doggy licence, the same one as the Retro Tree Pack; PDF in project files
`asset-packs/contents-lists/pizzadoggy_LICENSE_AGREEMENT.pdf` and `dirtymondo:source/Assets/world/packs/pizzadoggy_psx_mega_pack/LICENSE_AGREEMENT.pdf`):**
free for commercial + non-commercial games, modify freely, attribution appreciated ("Game Assets by Pizza Doggy", credited in
data.js EW_CREDITS). NOT allowed: redistributing the files as standalone / downloadable files, putting them in an open-source
project or asset pack, and ANY AI use: no Meshy (or any generator) from these models or their renders, not as reference, input or
prompt. So: never feed a pack model, texture or screenshot of one to Meshy or any AI tool, and never put the pack files in the repo
(the files live only on R2; the game loads them like any other model).

**What the files are:** Blender glTF exports, every texture embedded in its GLB (no external files), no rigs, no animations, real
metres (a wall module is 4 m wide x 3 m tall, a door 1 m, a chair 0.47 m), 8-18,074 triangles (median 206). PS1-style low-res
textures; many models come in colour variants (`_1` ... `_4`). Lamps come as `_on` / `_off` pairs (the `_on` texture glows; the
game still adds its own real light).

**Where they are:** game bucket `ewmusicsfx`, `Assets/world/packs/pizzadoggy_psx_mega_pack/<category>/<pack file name>.glb`
(the pack's own folders and file names, kept as they are). The loose `textures/` folder (215 PNGs, the same pictures the GLBs
carry, plus 30 extra surface sheets) is pack SOURCE, kept private in `dirtymondo:source/Assets/world/packs/pizzadoggy_psx_mega_pack/textures/`.

| category | on R2 | MB | what it is | where it fits (zones from ZONES_PLAN) |
| --- | --- | --- | --- | --- |
| `furniture` | 151 | 40.3 | armchairs, beds (+ frame), bedside tables, chairs (5 kinds), coffee / dinner / large tables, display cabinets, mattresses, pillows, shelves (6 kinds), sofas (4 kinds), TV tables, wardrobe | DOOR HQ offices + dorms, The Estate, Disaster City flats |
| `modular_structures` | 108 | 77.2 | walls (plain / half / rounded corners / tunnel holes), arches, doorways (single / double / side / wide / half), loose doors, windows (glass, frame only, no glass, metal bars), elevators + elevator doorways, floor-ceiling tiles, pillars, beams, catwalk, stairs (4 kinds), toilet cabin, tunnels (straight / elbow / tee / cross / inclined), pipe holders | DOOR HQ rooms, H-Wing backrooms, The D.U.M.B., The Sewers |
| `items_and_weapons` | 146 | 14.6 | ammo boxes + loose rounds, batteries, bandages, canned food, cash, keys + keycards (access levels 1-4), knives, pills, pistol (+ mags, suppressors), police baton, potions, poison, screwdrivers, shotgun shells, sword, syringe, flashlight, lighter, phones, walkie-talkie, ID cards, cassette / CD / floppy | room clutter, finds, spell props (pistol, sword, knife) |
| `small_props` | 60 | 5.3 | books (+ open book), bricks, car battery, clocks, concrete block, crosses, jerrycans, keypads, padlocks, painting, photo frames, planter pots, cactus, cutlery, plate, sponges, toy bricks, TV remote, VHS tape, notebook, pen, pencil | table / shelf dressing everywhere |
| `electronics_and_misc` | 43 | 5.0 | ceiling fans (light on / off, blades apart), PC + monitor + keyboards + mice + mouse pad, TVs, monitoring screen, outlets, light switches, elevator buttons / screen / sign, vents, handheld console + tablet | offices, the D.U.M.B. control rooms |
| `large_props` | 36 | 8.1 | cardboard boxes, metal barrels (4), wooden crates, supply crates (full / empty), pipes (straight / corner / cross / valve holder), carpet, curtain rod, toilets, vending machine | Disaster City, The Sewers, The D.U.M.B., HQ storage |
| `lighting` | 36 | 18.8 | ceiling lamps (5 kinds), floor / table lamps (lamp_1-5), each `_on` + `_off` | everywhere indoors |
| `decals` | 4 | 0.1 | cobwebs (flat cards) | abandoned rooms, The Estate, H-Wing |

**Skipped (not uploaded to the game bucket, kept in `dirtymondo:source/...` with the textures):** the 8 `*_fake_light_*` models
(ceiling_lamp_1/2/mp_1_1 fake_light_1/2, fake_light_window_2_single/double). They are flat glowing cone / beam cards that fake a
light; the game uses real lights (VISUAL RULES), so they don't fit. The older contents list also named `shotgun_1`, `sofa_2*`
and the padlock knobs; this version of the pack has no such models (only a `shotgun_1.png` texture), so there was nothing to add.

**Swap candidates (mondo's call; nothing swapped):** pack files whose NAME matches a Meshy model or a code stand-in in the game. The
match is by name only: the licence forbids feeding the pack to AI, so no thread looked at renders of these; mondo picks by eye.

| in the game now | made by | pack candidate(s) under `Assets/world/packs/pizzadoggy_psx_mega_pack/` |
| --- | --- | --- |
| `cardboard_box`, `cardboard_boxes` | Meshy AI | `large_props/cardboard_box_1`, `_2`, `_2_1` |
| `cinder_block` | Meshy AI | `small_props/concrete_block_1` |
| `clock` | Meshy AI | `small_props/clock_1`, `clock_2` |
| `couples_bed`, `dorm_bed` | Meshy AI | `furniture/bed_1` ... `bed_5_4`, `bed_1_frame`, `old_mattress_mp_1` |
| `coffee_table` | Meshy AI | `furniture/coffee_table_1` ... `_1_4` (square, not round) |
| `folding_chair`, `cafeteria_chair`, `molded_chair` | Meshy AI | `furniture/chair_mp_1` ... `chair_mp_5_4` |
| `curved_couch`, `curved_office_couch` | Meshy AI | `furniture/sofa_1` / `_3` / `_4` / `_5` (straight, not curved) |
| `library_shelf`, `library_shelf_full` | Meshy AI | `furniture/shelf_mp_2` ... `shelf_mp_7_4`, `small_props/book_mp_1` ... `_10` |
| `key`, `house_key` | Meshy AI | `items_and_weapons/key_mp_1` ... `key_mp_4_2` |
| `pen`, `pencil`, `notebook_paper` | Meshy AI | `small_props/pen_mp_1`, `pencil_mp_1`, `notebook_1` |
| `potted_plant`, `office_plant` | Meshy AI | `small_props/planter_pot_mp_1_full`, `potted_cactus_mp_1` |
| `pipe_run` | Meshy AI | `large_props/pipe_1`, `_corner`, `_cross`, `_short` |
| `vent_grille` | Meshy AI | `electronics_and_misc/vent_1` / `_2` / `_3` / `vent_mp_1` |
| `vhs_tape` | Meshy AI | `small_props/vhs_tape_1` |
| `wooden_cross`, `cross` (spell prop) | Meshy AI | `small_props/cross_1`, `cross_mp_2` |
| `pistol` (spell prop + `lone_gun`) | Meshy AI | `items_and_weapons/pistol_mp_1` ... `_1_3` |
| `desk_fan` | Meshy AI | none (the pack's fans are ceiling fans) |
| door leaves (`leaf_office`, `leaf_hollow_core`, `leaf_shabby_wood`, ...) | Meshy AI | `modular_structures/door_1_loose` ... `door_mp_6_loose` |
| `keypad` | code | `small_props/keypad_1`, `keypad_2` |
| `cell_bars` | code | `modular_structures/bars_metal_1`, `_2`, `window_metal_bars_single` / `_double` |
| `monitor_stack` | code | `electronics_and_misc/pc_monitor_mp_1`, `monitoring_screen_mp_1` |
| `lost_shelf` | code | `furniture/shelf_mp_*` |
| `world_clocks` | code | `small_props/clock_1`, `clock_2` |
| `planter` (D17) | code | `small_props/planter_pot_mp_1_full` (a pot, not a long concrete planter) |
| `false_window` | code | `modular_structures/window_2_single` ... (a whole wall piece with the window) |
| `shag_rug` | code | `large_props/carpet_mp_1` |
