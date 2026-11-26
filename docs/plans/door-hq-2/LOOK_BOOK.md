# DOOR HQ 2.0 — THE LOOK BOOK

Wave 1, thread 3 of the DOOR HQ 2.0 plan (plan doc: https://claude.ai/artifact/69S69c6y5uBALhoQmiYsCY; mondo's
review copy of this book: https://claude.ai/artifact/DR5PvRFgtmmAyWnEUA6nL2). Written 2026-11-26. Docs only: nothing
here is built. Every room thread (8-21) dresses from this file and adds nothing that is not in it without mondo's OK.

**Every prop key below is a real row in data.js `DOOR_HQ.catalogue` / `HQ_CATALOGUE_ALL`** (checked with load-data.js
on 2026-11-26). Surfaces are terrain keys (`MF_TID`) or `urban:` sheets the rooms already use. `(proc)` = drawn in code,
waits for a model. Pack-first rule: a PSX Mega Pack (`psx_*`, Pizza Doggy licence: never fed to any AI tool) or
Elbolilloduro piece is picked over a Meshy one wherever both fit.

## THE THREE RULES

1. **One key light per room, motivated by something on screen** (a chandelier, a skylight, a furnace mouth). The
   hero shot looks along that light. Fill is the room's `mood.ambient`; no light from nowhere.
2. **Colder, older and lower as you go down, until the Incinerator.** Lobby 3200 K and warm wood; the Ring 2700 K
   sconces; the factory sodium orange; the labs 6500 K white; the ritual level candle and red; then the Incinerator,
   where the ceiling vanishes and the only colour is fire.
3. **The fog stays the game's one fog** (owner rule: never a room fog). Depth comes from light falloff and colour, not haze.
   Bloom stays off: glow comes from bright surfaces (`_on` lamp models) and real lights.

Clear-floor rule for every room (from mondo's list): nothing stands within one 3.5 m square of a door's inside face,
no NPC spot within two squares of a door, and every walkway is whole cells wide. Seats are picked from the ones thread 4
measures (sitting); until then use the seats named here.

---

## 0. THE SIXTIES REFIT (2026-11-26, mondo; this section wins over anything older below)

mondo, in the Lobby: "im not a fan of this red wall paper, we are going for the vintage 1960s office retro campy scifi, like
2001 a space oddyssey spaceship meets the headquarters in the TV show Danger 5". So the public building is no longer a
1960s grand hotel in damask and oxblood: it is **a 1960s government spy agency that thinks it is a space station**. Clean
white moulded panels and lit ceilings (the space station), warm teak and tangerine (the agency's office), chrome where
there was brass, and one loud campy pattern a room at most. Original designs only: nothing copied from either film or show.

**No damask, no oxblood, no red flock anywhere above the Works.** The Works and H-Wing keep their own looks (the
dungeon and the backrooms are meant to feel wrong next to this).

THE SIXTIES SHEETS, drawn in code by `bake-hq60.py` (repo root; seamless 1024 px), on R2 `Assets/world/hq/textures/`,
worn by their DOOR_HQ.textures key:

| Key | File | What it is | Where |
| --- | --- | --- | --- |
| `panel60` | `hq60_panel_wall.png` | off-white `#ECE7DA` moulded wall panels, rounded corners, soft seams (two a 3.2 m sheet) | Lobby walls (both levels), the flue, the Ring, the Foyer, the Training Room, the Extraterrestrial office |
| `teak60` | `hq60_teak_slats.png` | teak slat panelling `#8E4F25`, dark reveals | every dado, Rhonda's desk front, the Penthouse's wood walls, the ring rooms' dados |
| `light60` | `hq60_light_ceiling.png` | a grid of lit white ceiling panels in a grey frame | Lobby dome + gallery underside, the Ring, the Foyer |
| `orange60` | `hq60_tangerine.png` | gloss tangerine `#DE5F1C` | the Lobby floor's rings + spokes, the flue's band |
| `orbit60` | `hq60_orbit_carpet.png` | circles-in-squares carpet, tangerine / mustard / chocolate / cream | the Ring's floor |
| `groovy60` | `hq60_groovy_paper.png` | campy op-art paper, plum ground, magenta / amber / pink bubbles | the Spirit Realm office's walls |

The palette, building-wide: panel white `#ECE7DA` · teak `#8E4F25` · tangerine `#DE5F1C` · mustard `#D9A03A` ·
chocolate `#3E2517` · chrome `#B9C0C6` · DOOR teal `#2F6F68` (kept for the logo, vending machines, staff ties) · the
terrazzo floor stays (it is already mid-century). Trim = chrome (`zl_hz_Metal_02__metal`) on the Lobby and the Ring.
Where a row below still names `damask_*`, `oxblood`, `urban:WoodPanelling1a` (a sheet that never existed on R2) or brass
trim for a public room, read it as the sixties sheet above. Props to look for next (not built in the refit): egg / tulip
chairs, a sunken conversation pit, globe pendants, a wall of reel-to-reel computers, a big lit world map in the Lobby.

---

## 1. THE COLOUR, LIGHT AND MATERIAL SHEET, LEVEL BY LEVEL

Ceiling heights are clear heights. `mood` = the room shell's `mood.light` (hex) and `mood.ambient`.

### Lobby level, public (Foyer, Lobby and its upper level, Medical, Door Store, Cafeteria, Kitchen)
The idea: a 1960s grand hotel that a government office took over and never redecorated.

| | |
| --- | --- |
| Palette | cream marble `#EDE3CC` · oxblood carpet `#7A2630` · walnut `#5A3A22` · brass `#B8893A` · DOOR teal `#2F6F68` (vending machines, staff ties, the logo) |
| Key light | the `crystal_chandelier` hanging from the dome over Rhonda, plus a round skylight at the top of the dome throwing a pool on her desk and the column |
| Mood | light `#FFD9A0` (3200 K), ambient 0.55; brightest at the centre, darker toward the Ring, so the eye goes to Rhonda |
| Floor | `terrazzo` field with a `marble` ring round the column; `carpet_2` runner on the main line, front door to Training Room |
| Walls | `teak60` dado to 1.05 m, `panel60` above (THE SIXTIES REFIT; was `damask_3`) |
| Ceiling | dome + gallery underside in `light60` (THE SIXTIES REFIT) |
| Trim | brass in the better gold (never the old flat gold) |
| Height | Lobby open three storeys, about 15.85 m to the dome; the upper level's gallery at 7.1 m (wave 3: over the 7 m front rooms); the front rooms 7 m |
| Camera | wide, low, symmetrical on the main line (the first shot); slow push in to Rhonda |

Front rooms keep their own look inside (below) but share the Lobby's brass and walnut on their fronts, so the three read
as shopfronts of one hotel.

- **Medical:** the brightest room in the building. White `#F4F6F5`, mint `#9FD8C8`, a coral cross `#D9473F`. Mood
  `#F2FAFF`, ambient 0.7, so its light spills onto the Lobby floor. Floor `urban:TileLinoleum1a`, walls
  `urban:PlasterWallPainted1a`, ceiling `urban:FibreCeilingTile2a`.
- **Door Store:** a gallery. Charcoal walls `#2B2B2E`, oak floor `urban:WoodFlooring1c`, one spotlight per door.
  Mood `#FFE7C2`, ambient 0.35 (the doors carry the light, the room stays dim). Tier colours on the plinths:
  T1 steel `#8C939A`, T2 brass `#B8893A`, T3 vault black `#1E1E22`; the six typed doors wear their type badge colours.
- **Cafeteria:** a sunny 1960s staff canteen. Mustard `#E0A82E`, tangerine `#D9692B`, teal `#2F6F68` booths,
  `checkerboard_2` floor, `urban:TileSubway2a` wall to shoulder height then `drywall`. Mood `#FFE2B0`, ambient 0.6.
  Key light: a row of `saucer_pendant`s down each long table.
- **Kitchen:** stainless and white tile: `tilefloor_2`, `urban:TileSubway1a` walls, `fluorescent` overhead, mood
  `#EAF4FF` ambient 0.65. Seen through the serving hatch, so it is brighter than the canteen.

### Training Room (Lobby level, the main line)
The most important room. It must read as a battle board first: a quiet floor, a loud room around it.

| | |
| --- | --- |
| Palette | floor grey `#8E9094` · DOOR teal `#2F6F68` · white line `#E9E9E4` · warm stands `#5A3A22` |
| Key light | a grid of `high_bay_lamp`s over the 8 by 8 board, evenly lit so no square is in shadow |
| Mood | `#F4F0E6`, ambient 0.6 |
| Floor | `training_floor` on the board (keeps the squares readable); `concrete_floor` round it |
| Walls | `urban:ConcretePanels1a` lower, `urban:MetalWallRibbed1a` upper |
| Ceiling | open truss `urban:MetalTruss1a` at 14 m |
| Camera | the grand doors from inside first (the party walks in small), then the board from the stands |

### The Ring and its rooms (Lobby level)
The Overlook corridor: long, curved, warm, a little too quiet.

| | |
| --- | --- |
| Palette | hex carpet in rust `#8C2F1E`, orange `#D46A2A`, brown `#3B2A20` · cream walls `#E8DCC0` · walnut doors · brass plates |
| Key light | a wall sconce every two squares (7 m), both sides, warm pools on the carpet with dark between; no overhead tubes |
| Mood | `#FFC98A` (2700 K), ambient 0.4 |
| Floor | `orbit60` (THE SIXTIES REFIT; was `urban:CarpetPattern1a`) |
| Walls | `teak60` dado, `panel60` above (THE SIXTIES REFIT) |
| Ceiling | `ceiling`, 4.5 m (raised from today's 3.5 m) |
| Width | 7 m (two squares), nothing on the walking line; props sit in alcoves between doors |
| Camera | low tracking shot behind the walker, curve hiding what is ahead |

Ring rooms are government office, one notch drabber than the Lobby: `carpet_3` or `urban:TileLinoleum1c` floors,
`drywall_2` walls, `urban:FibreCeilingTile1a` ceilings at 4.5 m, `fluorescent` plus a `desk_lamp`/`banker_lamp` key.
Mood `#FFF1D6`, ambient 0.5.

### The Lobby's upper level (division offices, Bureau of Continuity, Observatory)
Each leader's office is a glass box you can see from the Lobby floor, each in its own colour so the three read at a glance.

| Office | Palette | Key light | Floor / walls |
| --- | --- | --- | --- |
| Cryptid Division (Forrest) | forest green `#2F4A32`, tan `#B59A6A`, plaid red `#8A2E26` | a `banker_lamp` and a hunting-lodge `psx_ceiling_lamp_4_on` | `wood` floor, `urban:WoodCladding2a` walls: a hunting lodge |
| Spirit Realm Division (Ringer) | plum `#4A2A4F`, candle gold `#E9B44C`, faded rose `#B07A86` | candles: `candelabra` on the desk, `lit_candle` groups | `carpet_4` floor, `groovy60` walls: a campy séance parlour (THE SIXTIES REFIT; was `damask_4`) |
| Extraterrestrial Division (Glass) | white `#F2F2EE`, chrome `#B9C0C6`, signal orange `#E36A1E` | a `sputnik_lamp` and a `globe_lamp` | `urban:TileGeneric4a` floor, `urban:MetalPanelPainted1a` walls: space age |
| Bureau of Continuity | beige `#D8CBB0`, file green `#4E6B4A` | `fluorescent` + `desk_lamp` | `carpet_3`, `drywall` |
| Observatory | night blue `#141C33`, star white `#F3F1E7` | the `star_projector` and the `star_dome` | `carpet_4`, `void` ceiling |

Mood for all three division offices: ambient 0.45, each office's key colour as its `mood.light`.

### Penthouse
| | |
| --- | --- |
| Palette | midnight blue `#101A2E`, champagne `#D9C79E`, black glass `#0D0D10`, pool cyan `#6FD3E0` |
| Key light | the moon through the window wall; the Infinity Pool's underwater light from below |
| Mood | `#9FB4D9`, ambient 0.3 |
| Floor / walls | `marble_light` floor, `urban:WoodPanelling1a` and dark glass walls; `zl_hz_Wall_01__marble_light` at the pool |
| Height | 7 m |

### Garage
| | |
| --- | --- |
| Palette | concrete grey `#8A8A84`, bay-line yellow `#E8C13A`, tube green-white `#CFE8D0`, rust on the roller door `#8E4A2A` |
| Key light | rows of `fluorescent` tubes, one or two `flicker_tube`; the Loading Dock's roller door lit by one `cage_lamp` (the shot that plants it) |
| Mood | `#DDEEDD`, ambient 0.45 |
| Floor / walls | `concrete_floor` with `urban:ConcreteStriped1a` bays; `urban:ConcretePrecast1c` walls; `concrete` ceiling, 5 m |
| Subway | as built: the Metro PSX pack (`urban:MetroFloor`, `urban:MetroWallTile`) |

### The Works, top: the factory
| | |
| --- | --- |
| Palette | sodium orange `#FF9A3C`, hazard yellow `#E8C13A` on black, steel blue-grey `#56606A`, rust `#7A3B1F` |
| Key light | `high_bay_lamp`s in sodium orange; the Chute glowing from below |
| Mood | `#FFB070`, ambient 0.35 |
| Floor | `concrete_floor`, `urban:MetalDiamondPlate1a` walkways, `urban:MetalWarningStripe1` edges |
| Walls | `urban:MetalCorrugatedPainted2a`, `urban:ConcreteWoodFormed1a` |
| Ceiling | `urban:MetalTruss1b` at 8 m; pipes and ducts on show |
| Service corridors | `concrete`, 3.5 m wide, 4.5 m tall, `pipe_run` overhead, `cage_lamp`s, stencilled warnings |

### The Works, middle: the labs and the holding block
| | |
| --- | --- |
| Palette | tile white `#E6EAEA`, sterile cyan `#8FD3D8`, lab green `#4D7A5A`, observation-glass black `#141618` |
| Key light | flat 6500 K ceiling panels; each lab has one coloured source (the Tank's water, the Dream Lab's screens) |
| Mood | `#DDEBFF`, ambient 0.55 (labs); holding block `#C9D1B8`, ambient 0.3 |
| Floor / walls | `tilefloor`, `urban:TileSubway1a` walls; holding block `concrete`, `urban:BrickPainted1a` in drab olive |
| Ceiling | `urban:FibreCeilingTile2b` labs at 4.5 m; holding block `concrete` at 3.5 m (the only low ceilings in the building, on purpose) |

### The Works, bottom: ritual and the Incinerator
| | |
| --- | --- |
| Palette | old stone `#4A4440`, candle `#FF7A2A`, blood red `#7E1414`, soot black `#141110`; the Incinerator adds fire white `#FFE9B0` |
| Key light | candles and `brazier`s (1800 K); in the Incinerator, the furnace mouth lighting everything from below, plus one point of daylight far above (the Lobby skylight down the flue) |
| Mood | ritual `#FF8040`, ambient 0.2; Incinerator `#FF9A50`, ambient 0.25 |
| Floor | `dungeon_2`, `obsidian` under the ritual circle; Incinerator `urban:MetalGratingGrid1a` catwalk over the pit |
| Walls | `zl_hz_Brick_09__dungeon`, `catacomb_wall` pieces; the Incinerator `zl_hz_Brick_11__bricks_1` blackened toward the furnace |
| Height | ritual rooms 7 m; the Incinerator over 20 m, no ceiling visible |

### H-Wing
| | |
| --- | --- |
| Palette | backrooms yellow `#D8C78A`, damp carpet `#9C8E5E`, tube white-green `#E9F0C8` |
| Key light | none: an even grid of `fluorescent` with `flicker_tube`s, which is what makes it wrong |
| Mood | `#F1EBC0`, ambient 0.65, flat |
| Floor / walls | `zl_urban_CarpetPlain1d__carpet_4`, `wallpaper` |
| Ceiling | `urban:FibreCeilingTile1b` at 3.5 m in the halls (low on purpose); vignettes have their own sky |
| Vignettes | each one dresses as its own zone (desert dusk, snowy pines, a corn field, the Moon), lit by that zone's sky, with one plain door (`leaf_white_wood` in a lone frame) |

---

## 2. THE DRESSING LIST, ROOM BY ROOM

Each room: the hero shot, then **anchors** (the big pieces that define it), **dressing** (the rest), **lights**.

### Foyer
- Hero shot: from the lift doors, straight down the main line to Rhonda, the column and the chandelier.
- Anchors: the lift the party arrives in, `psx_elevator_1` + `psx_elevator_doorway_1`, `psx_elevator_sign_1`, `psx_elevator_call_button_1`.
- Dressing: `umbrella_stand`, `luggage_cart`, `concierge_podium` (empty: a porter's stand nobody uses), `potted_plant` ×2, `doormat` (proc), `door_logo_wall` (proc, mondo's logo file only).
- Lights: two `psx_ceiling_lamp_4_on`. Keep the line to Rhonda empty.

### Lobby
- Hero shot: from the Foyer mouth, low, symmetrical: Rhonda's slim desk, the column, the chandelier above, the Training Room doors far behind.
- Anchors: Rhonda's desk (built in code round the column; slim, under 1 m deep so she is clickable), `crystal_chandelier`, the case board, `directory_board` and `scoreboard` (the leaderboard) hung on the column, `curved_couch` ×6 in a ring.
- Dressing: `marble_bust` ×2 on plinths at the Training Room doors, `painting_portrait` ×3 on the gallery wall (DOOR's founders), `astronomical_clock` on the column above the board, `trophy_case` (the old Trophy Case room becomes this cabinet), `psx_armchair_2` pairs between couches, `potted_plant` / `palm_tree` in the four quadrants, `rope_stanchion` lines only at the Training Room doors, `psx_carpet_mp_1` under each couch group.
- Vending machines (potions, all five spots on the plan): `psx_vending_machine_1` ×3, `meshy_round_vending_machine` ×2 (a round one for the round room).
- Upper level gallery: `railing_1m` the whole way round (Stairs & Railings pack checked first, below), `wingback_chair` + `table_lamp` pairs at the rail, one `brass_telescope` pointing down at the desk (a joke for later).
- Not here: Kit seated, men in black, any reception room, any dev tool.

### Training Room
- Hero shot: inside the grand doors, the party small against the 63 m hall, the board lit ahead.
- Anchors: the 8 by 8 board (no prop on it), `bleacher_stand` ×2 on the side walls, `scoreboard` high on the far wall, `banner` ×4 (DOOR teal).
- Dressing: `locker` and `locker_bench` row by the doors, `water_cooler`, `medicine_ball_rack`, `dumbbell_rack`, `punching_bag` ×2, `tackling_sled`, `wing_chun_dummy`, `instrument_whistle` on the coach's `clipboard` table.
- Lights: `high_bay_lamp` grid (above). Nothing taller than 1.2 m within two squares of the board edge.

### Medical
- Hero shot: from the Lobby, the open front: white light, the nurse at her counter, the beds behind glass.
- Anchors: a long `form_counter` (the nurse's counter, front centre), the healing machine behind it (missing: see list), `hospital_bed` ×4 in bays behind a glass wall, `privacy_screen` between beds.
- Dressing: `iv_stand` per bed, `wheelchair` ×2, `stretcher`, `eeg_rack` as the bedside monitors, `door_xray` (proc) lightbox on the back wall, `sink_row`, `specimen_shelf` of supplies, `psx_pills_bottle_1` / `psx_bandage_mp_1` on the counter, `psx_healing_potion_mp_1` in a `psx_display_cabinet_mp_1`, `number_dispenser` + `now_serving_sign`, waiting seats `metro_bench` ×2 facing the counter.
- Lights: `psx_ceiling_lamp_2_on` panels; the front edge is the brightest line on the Lobby floor.

### Door Store
- Hero shot: from the Lobby, through the shop window: doors standing in rows like cars in a showroom, each in its own spotlight.
- Anchors: the stock (the capture doors as `_buildDoor3D` draws them, on plinths: T1, T2, T3 `leaf_vault`, the six typed doors, the tuned door), a `cash_register` on a `booking_desk` at the back, the shopkeeper behind it.
- Dressing: the shop window display: three `leaf_*` doors on stands (`leaf_glass_exec`, `leaf_hotel`, `leaf_futuristic`); `price_tag` (proc) on each plinth; `sale_banner` (proc, one, no subtitle); `brochure_rack`; `rope_stanchion` round the T3 vault door; `jewelry_case` with door keys (`key`, `house_key`, `psx_keycard_1`) as impulse buys you cannot buy (dressing only); `psx_sofa_3` for "customers", `coffee_table`.
- Lights: one `studio_light` or track spot per plinth (real spot lights), `psx_lamp_3_on` on the desk.
- Not here: races, the party builder, potions.

### Cafeteria
- Hero shot: from the Lobby across the long tables to the serving line, the Kitchen bright behind it.
- Anchors: `serving_line` (proc) with `steam_table` ×2 set in it, `trestle_table` ×6 in long rows (or `psx_table_large_3`), booths on the outer wall (missing: see list), `pastry_case`, `espresso_machine`.
- Dressing: `cafeteria_chair` / `molded_chair` at the tables, `meal_tray` and `meal_tray_empty`, `solo_cup`, `coffee_mug`, `jukebox` in a corner, `bread_rack`, `food_trolley`, `water_cooler`, `trash_bin` stations by the exits, `notice_board`, `wall_clock`, `potted_plant`, `false_window` (proc) ×3 on the outer wall with a garden view.
- Lights: `saucer_pendant` rows + `sputnik_lamp` over the booths.
- Christmas dishes (`xmas_*`) only in the December event, not as standing dressing.

### Kitchen
- Hero shot: through the hatch from the canteen side.
- Anchors: `kitchen_range` ×2 under `range_hood` ×2, `deck_oven`, `steel_table` ×2 as the pass.
- Dressing: `stock_pots`, `pot_rack`, `round_fridge`, `mini_fridge`, `microwave`, `coffee_maker`, `metal_shelving`, `sink`, `hook_rail_long`, `floor_drain`, `meat_hook` row (the folded-in Cold Room, behind a `leaf_security` cold door).

### The Ring
- Hero shot: behind the walker on the curve, sconce pools ahead, a mop bucket by one door.
- Dressing (in alcoves only): `psx_sofa_1` or `wingback_chair` + `table_lamp` in every third alcove, `potted_plant`, `painting_landscape` / `painting_seascape` between doors, `fire_extinguisher` and `exit_sign` at the stairs, `mop_bucket` + `wet_floor_sign` by Your Office (Rhonda's line), `luggage_cart` once, abandoned.
- Doors: one leaf for every Ring door, `leaf_office`, each with a `nameplate`. The H-Wing door: `leaf_white_wood` with no plate.
- Lights: wall sconces (missing: see list; stand-in `psx_lamp_1_on` table lamps in the alcoves until it exists).

### Your Office
- Hero shot: from the door, the desk under the one window, the tape player waiting.
- Anchors: `tanker_desk`, `exec_chair`, `filing_cabinet` ×2, `vhs_player` + `tube_tv` (the tapes).
- Dressing: `rotary_phone`, `desk_lamp`, `papers_a`, `manila_folders`, `coffee_mug`, `cot` (you sleep here), `wall_shelf`, `breaker_panel`, `mop` + `broom` + `mop_bucket` (it used to be a janitor's closet), `mini_fridge`, `rug_round`.

### Records
- Anchors: `metal_shelving` ×8 in aisles, `card_catalogue`, `microfiche_reader`.
- Dressing: `cardboard_boxes`, `manila_folders`, `library_ladder`, `tanker_desk` + `crt_terminal`, `banker_lamp`, `water_cooler`.

### Clock Room
- Anchors: `world_clocks` (proc), `gclock`, `punch_clock`.
- Dressing: `wall_clock` ×6 all wrong, `pocket_watch_hung`, `giant_hourglass`, `tanker_desk`, `form_sheet` (proc).

### Barbershop
- Anchors: `barber_chair` ×2, `barber_pole`, `barber_mirror` (proc).
- Dressing: `sink`, `wall_shelf`, `hook_rail_long`, `retro_radio`, `psx_chair_mp_2` waiting chairs, `checkerboard` floor kept.

### Lecture Hall
- Anchors: `school_desk` ×12 on risers, `chalkboard`, `lectern`.
- Dressing: `film_projector` on a cart, `pa_speaker`, `globe_lamp`, `notebook_paper`, `pencil`.

### Cubicle Floor
- Anchors: `round_cubicle` ×6, `square_cubicle` (proc) ×4.
- Dressing: `computer_chair_blue` / `computer_chair_grey`, `psx_pc_monitor_mp_1` + `psx_pc_mp_1` + `psx_pc_keyboard_mp_1`, `photocopier`, `paper_shredder`, `water_cooler`, `office_plant`, `desk_fan`.

### IT
- Anchors: `server_rack` ×6, `tanker_desk` ×2 with `crt_terminal`.
- Dressing: `dialup_modem`, `wifi_router`, `cable_drum`, `cardboard_boxes`, `metal_shelving`, `retro_speakers`. No dev tools, no terminals that open editors.

### Lost and Found, Locker Room, Bathroom
- Lost and Found: `lost_shelf` (proc) ×4, `umbrella_stand`, `key_rack`, `footlocker`, `backpack`, `skateboard`.
- Locker Room: `locker` ×8, `office_locker` ×8, `locker_bench` ×2, `shower_stall` ×2, `hand_dryer`, `sink`.
- Bathroom: `toilet_stall` ×3, `urinal` ×2, `sink_row`, `hand_dryer`, `toilet_paper`, `psx_toilet_cabin_mp_1` as a fourth stall.

### Stair to the Woods
- Keep today's `greek_column` / `stained_glass` / `brazier` look: it is the one door that already feels like a passage.

### Cryptid Division (Agent Forrest)
- Hero shot: from the gallery through the glass: Forrest at the desk under a mounted head.
- Anchors: `exec_desk`, `chesterfield_sofa`, `evidence_board` (sightings, red string), `map_table`.
- Dressing: `antler_trophy` ×2, `cattle_skull`, `meshy_giant_foot` (the plaster footprint cast, on a plinth), `bear` (stuffed, rearing), `owl_perched`, `fur_rug`, `psx_shelf_mp_4_1` of field journals, `item_binoculars`, `field_radio`, `rifle_rack` (empty), `banker_lamp`.

### Spirit Realm Division (Agent Ringer)
- Anchors: `round_table` (the séance table; the Ouija board is missing), `exec_desk`, `cheval_mirror`.
- Dressing: `candelabra`, `lit_candle` clusters, `crystalBall`, `tarot` / `tarot2` spread on the table, `music_box`, `reel_to_reel` (EVP recordings), `hooded_statue`, `painting_portrait` whose eyes follow you (later), `rocking_chair`, `psx_curtain_rod_mp_1` with heavy drapes.

### Extraterrestrial Division (Agent Glass)
- Anchors: `tulip_table` + `tulip_chair` ×4, `egg_chair`, `meteorite_plinth`.
- Dressing: `ufo` model on a stand, `ship_grey` as a desk model, `star_chart` (proc), `radar_antenna` model, `retro_control_panel`, `brass_orrery`, `sputnik_lamp`, `lava_lamp_floor`, `astronaut` suit on a stand (the helmet case), `psx_monitoring_screen_mp_1`.

### Bureau of Continuity, Observatory
- Bureau: `filing_cabinet` ×6, `tanker_desk`, `laminator`, `motto_plaque` (proc), `clipboard`, `deposit_box_wall` (sealed records).
- Observatory: `star_projector`, `star_dome` (proc), `telescope`, `brass_telescope`, `curved_couch` ×3, `globe_lamp`.

### Penthouse, Corner Office, Infinity Pool
- Penthouse: `chesterfield_sofa` ×2, `psx_armchair_1`, `crystal_chandelier`, `decor_piano`, `greek_couch`, `marble_bust`. Sparse and expensive.
- Corner Office: `exec_desk`, `exec_chair`, `globe_lamp`, `false_window` (proc, the impossible view), `brass_telescope` at the window.
- Infinity Pool: `infinity_pool` (proc), `pool_lounger` ×6, `patio_umbrella` ×2, `palm_tree` in planters only.

### Garage
- Hero shot: down the ramp, cars parked, the roller door at the back under its one lamp.
- Anchors: `car_taxi` (the taxi to Disaster City), `car_cadillac`, `car_suv`, `car_cop`, `parked_car`, `roller_shutter` (the Loading Dock), `boom_gate`.
- Dressing: `traffic_cone`, `traffic_barrel`, `tire_stack`, `parking_bay` (proc), `ticket_machine`, `fire_extinguisher`, `mop_bucket`, `pallet_jack` by the roller door, `psx_metal_barrel_mp_1`.

### The Works, top: Loading Dock, Warehouse, the Line, Door Garden, Autopsy Room, Control Room, Boiler Room, Laundry
- Hero shot (the Line): along the conveyor as doors ride past at eye height toward the Chute's glow.
- Loading Dock: `roller_shutter` ×2, `forklift`, `pallet_jack`, `wrapped_pallet` ×4, `hand_truck`, `platform_scale`.
- Warehouse: `metal_shelving` / `psx_shelf_mp_6` high racks, `door_stack` ×6, `cardboard_boxes`, `psx_supply_crate_1`, `chain_hoist`, `forklift`.
- The Line: `conveyor` / `conveyor_z` runs, `robot_arm` ×4, `drill_press`, `metal_lathe`, `welding_cart`, `tool_pegboard`, `door_stack`, `gauge_board`, `safety_netting` over the Chute, `warning_tape` (proc), `fire_danger_sign`.
- Door Garden: `door_vine` (proc), `grow_lamp`, `planter` (proc), `garden_tree`.
- Autopsy Room: `autopsy_table`, `door_xray` (proc), `specimen_shelf`, `lab_glassware`, `sink_row`, morgue drawers (missing).
- Control Room: `monitor_stack` (proc) ×3, `retro_control_panel`, `psx_monitoring_screen_mp_1` ×4, `computer_chair_grey`.
- Boiler Room: `boiler` ×2, `steam_turbine`, `valve_wheel`, `gate_valve`, `psx_pipe_1` runs, `centrifugal_pump`.
- Laundry: `washer` ×4, `dryer` ×4, `laundry_cart`, `clothes_line`, `hazmat_suit` hanging.
- Service corridors: `pipe_run`, `cage_lamp`, `floor_drain`, `breaker_panel`, `fire_extinguisher`, `exit_sign`; nothing on the floor of a 3.5 m corridor.

### The Works, middle: Dream Lab, the Tank, Clone Disposal, Room X, Server Room, Supply Closet 4B, Interrogation Room, the Hold, the Cells
- Hero shot (Interrogation): from behind the mirror, the table and two chairs through dark glass.
- Dream Lab: `cot` ×4, `eeg_rack` ×4, `dream_screen` (proc), `dream_eye`, `therapy_chaise`.
- The Tank: `iso_tank`, `meshy_molten_cryo_tube` ×2, `fume_hood`.
- Clone Disposal: `garbage_chute` (proc), `steel_table`, `lone_gun`, `hazmat_suit`.
- Room X: keep sealed; `keypad` (proc) and `psx_keycard_1_authorization_level_4` on the floor outside.
- Server Room: `server_rack` ×8, `breaker_panel` ×3.
- Supply Closet 4B: `radiation_drum`, `evac_button` (proc), `warning_tape` (proc), `metal_shelving`.
- Interrogation Room: `steel_table` in the MIDDLE of the room (three squares from the door, never in front of it), `folding_chair` ×2, `desk_lamp`, `observation_window` (proc), `security_camera`, `rotary_phone`. No CPU training.
- The Hold: bigger than today (at least 4 × 4 squares): `wall_padding` (proc), `cot`, `floor_drain`, one `bare_bulb`.
- The Cells: real bars `psx_bars_metal_1` in place of `cell_bars` (proc), `chain_bunk`, `steel_toilet`, `wall_chains`, `mugshot_wall`, `height_board`, `handcuffs` on a `hook_rail`.

### The Works, bottom: Ritual Room, Sacrifice Room, the Incinerator
- Hero shot (Incinerator): from the catwalk, looking up the flue to the point of light, doors falling past toward the fire.
- Ritual Room: `ritual_circle` (proc) on `obsidian`, `stone_altar`, `candle_ring`, `brazier` ×4, `hooded_statue` ×2, `costume_rack` of robes, `cauldron`, `skull_pile`, `catacomb_wall`.
- Sacrifice Room: `stone_altar`, `wall_chains` ×4, `meat_hook`, `decor_effigy_bier`, `trap_iron_maiden_body`, `stocks`.
- The Incinerator: `door_furnace` scaled up as the furnace mouth (check scale: see list), `psx_catwalk_1` ring with `railing_1m`, `chain_hoist` ×2, `signal_gantry`, `conveyor_z` ending at the lip, `door_stack` on the ledge, `gauge_board`, `bellows` (the old part of the machine), `psx_pipe_valve_holder_large_1`.

### H-Wing
- Halls: `square_cubicle` (proc), `office_chair`, `filing_cabinet`, `water_cooler`, `paper_sheet`, `vending_machine` (dead, `psx_vending_machine_1`), `psx_cobweb_1` sparingly; plain doors `leaf_white_wood` / `leaf_beige_wood`.
- Vignettes: dressed from the zone they copy (the Desert, the Snowy Pines, the Corn Fields, the Moon); one lone door in a freestanding frame.
- The old uncanny rooms keep their dressing as listed today in data.js (`hwing_home`, `natatorium`, `garden`, `thirteenth`, `mandela`, `upsidedown`).

### Stairs and railings (every level)
The Stairs & Railings pack (ATD-London, CC-BY 4.0, credit required) is on R2 but not loaded
(`Assets/world/packs/stairs/stairs.glb`, `stairs_railings.glb`). The Lobby's curved stair and every rail should be checked
against it before `railing_1m` repeats are used.

---

## 3. WHAT WE DO NOT HAVE YET

Checked against every catalogue row, MODEL_LIST §6, §12b (the PSX Mega Pack) and §13 (on R2, not loaded). Nothing here
is made without mondo's OK; pack sources are searched first (pack-first rule).

| # | Prop | Room | Why nothing we have fits | Stand-in until then |
| --- | --- | --- | --- | --- |
| 1 | Healing machine (the tray the party's doors go on) | Medical | the Pokémon Center moment needs one object behind the counter; nothing medical in the catalogue is a machine you hand things to | `eeg_rack` behind the counter |
| 2 | Brass wall sconce | the Ring, Lobby gallery | every pack lamp is ceiling, floor or table; `wall_torch_bracket` is a torch | `psx_lamp_1_on` on alcove tables |
| 3 | Diner booth (fixed bench pair + table) | Cafeteria | no booth in any pack; only `ticket_booth`, `confessional_booth` | `psx_sofa_3` facing pairs |
| 4 | Glass lift (open cage, brass) | Lobby | the PSX lift is a closed car | `psx_elevator_1` |
| 5 | Hospital curtain on a ceiling track | Medical | `privacy_screen` is a folding screen; `psx_curtain_rod_mp_1` is a window rod | `privacy_screen` |
| 6 | Morgue drawer wall | Autopsy Room | `deposit_box_wall` reads as a bank | `deposit_box_wall` |
| 7 | Ouija board | Spirit Realm Division | none anywhere | `tarot` spread |
| 8 | Overhead chain conveyor carrying doors | the Line, Incinerator | `conveyor` runs on the floor | floor `conveyor` |
| 9 | Counter service bell | Medical, Door Store | `ships_bell`, `kt_temple_bell` are big | none |
| 10 | Overlook hex carpet sheet (a texture, not a model) | the Ring | `urban:CarpetPattern1a` is close, not the hexagons | `urban:CarpetPattern1a` |
| 11 | Furnace mouth at Incinerator scale | Incinerator | `door_furnace` is a room-size furnace; at 28 m it may read small: check its scale in thread 18 before asking | `door_furnace` scaled |

Code stand-ins that these rooms lean on and that MODEL_LIST §8 already lists as wanting a model: `serving_line`,
`monitor_stack`, `world_clocks`, `lost_shelf`, `wall_padding`, `garbage_chute`, `door_vine`, `planter`, `square_cubicle`,
`star_chart`, `false_window`. `cell_bars` can go to `psx_bars_metal_1` now (a swap, no new model).
