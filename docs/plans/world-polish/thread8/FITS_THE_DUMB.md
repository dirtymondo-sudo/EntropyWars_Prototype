# FITS THE D.U.M.B. — the lists read in full (world polish thread 8, 2026-11-20)

Five readers, one a part, read MODEL_LIST.md end to end (sections 6 to 13), WISHLIST_MODELS_ADDED.md, pack-claims.md, ASSET_MANIFEST.json, the bucket list and the live catalogue.
The short of it: everything that fits already has a catalogue row; nothing unwired on R2 fits. No tarp, no stealth aircraft, no blast door, no white wall kit, no collider parts.
The summary and the NEEDS A MODEL list are in docs/notes/areas-complexes.md "THE D.U.M.B., WORLD POLISH (thread 8)".


---

# FITS THE D.U.M.B. — part 1: MODEL_LIST.md lines 741-1332 (section 6, PSX Mega Pack · Pizza Doggy)

Read: lines 741-1332 completely, every row. **584 table rows** (lines 747-1330; matches the heading "Asset pack (584)").
All files live under `Assets/world/packs/pizzadoggy_psx_mega_pack/<folder>/`. Folders seen: modular_structures, large_props, small_props,
furniture, items_and_weapons, electronics_and_misc, lighting, decals.
Licence note on every row: Pizza Doggy licence, NOT CC0 (no AI use of the assets, no redistributing them as standalone files).
Descriptions below are from the file name only (nothing was opened or looked at).

What this pack does NOT hold (so look elsewhere): no aircraft, UFO, cars, trucks, forklifts, tarps; no lab glassware, tanks, pods,
server racks, consoles; no blast doors, fences, ladders, railings, sandbags, turrets, lockers, bunks, filing cabinets, office desks.
Its strength for the D.U.M.B.: a full modular shell kit (walls, tunnels, elevators, doorways, pillars, pipes, catwalk), keycards with
authorization levels, keypads, monitoring screens, dosimeters, supply crates, ammo, medical small items, on/off lamp pairs.

---

## 1. STRUCTURE PIECES (modular_structures + pipes + vents)

Tunnels (tram tunnel, collider ring, service crawl):
- `psx_tunnel_1` — tunnel section
- `psx_tunnel_entrance_platform_1` — tunnel entrance with platform (tram stop)
- `psx_tunnel_mp_1_straight` — modular tunnel, straight
- `psx_tunnel_mp_1_straight_inclined` — modular tunnel, sloped straight
- `psx_tunnel_mp_1_elbow` — modular tunnel, corner
- `psx_tunnel_mp_1_tee` — modular tunnel, T junction
- `psx_tunnel_mp_1_cross_tee` — modular tunnel, cross junction
- `psx_wall_1_tunnel_hole` — wall with tunnel opening
- `psx_wall_1_tunnel_hole_1` — wall with tunnel opening, variant
- `psx_wall_1_tunnel_hole_2` — wall with tunnel opening, variant

Elevators (the way down, VIP bunker lift):
- `psx_elevator_1` — elevator cabin
- `psx_elevator_2` — elevator cabin, variant
- `psx_elevator_doorway_1` — wall with elevator doorway
- `psx_elevator_doorway_2` — elevator doorway, style 2
- `psx_elevator_doorway_2_1` — elevator doorway, style 2 variant
- `psx_elevator_doorway_3` — elevator doorway, style 3
- (its fittings `psx_elevator_buttons_1`, `psx_elevator_call_button_1`, `psx_elevator_screen_1`, `psx_elevator_sign_1`: see section 3 / 8)

Walls:
- `psx_wall_1` — wall panel, style 1
- `psx_wall_1_plain` — wall panel, plain (white chamber candidate)
- `psx_wall_1_half` — half-height wall
- `psx_wall_1_1_half` — half wall, variant 1
- `psx_wall_1_2_half` — half wall, variant 2
- `psx_wall_1_3_half` — half wall, variant 3
- `psx_wall_1_rounded_corner` — rounded corner wall
- `psx_wall_1_rounded_corner_1` — rounded corner, variant
- `psx_wall_1_rounded_corner_1_1` — rounded corner, variant
- `psx_wall_1_rounded_corner_1_2` — rounded corner, variant
- `psx_wall_1_1_rounded_corner_1` — rounded corner, texture 1
- `psx_wall_1_2_rounded_corner_1` — rounded corner, texture 2
- `psx_wall_2_1` — wall panel, style 2
- `psx_wall_2_2` — wall panel, style 2 variant

Arches + arch pillars (vaulted halls, hangar bays):
- `psx_arc_1_wall_1` — arch in wall, style 1
- `psx_arc_1_wall_1_plain` — arch in plain wall
- `psx_arc_1_wall_2_1` — arch, wall style 2
- `psx_arc_1_wall_2_2` — arch, wall style 2 variant
- `psx_arc_2_wall_1` — second arch shape
- `psx_arc_2_wall_1_plain` — second arch, plain wall
- `psx_arc_2_wall_2_1` — second arch, wall style 2
- `psx_arc_2_wall_2_2` — second arch, style 2 variant
- `psx_half_arc_pillar_1_wall_1_plain` — half arch on pillar
- `psx_half_arc_pillar_2_wall_1_plain` — half arch, pillar 2
- `psx_half_arc_pillar_2_tall_wall_1_plain` — tall half arch on pillar

Floors, pillars, beams, catwalk, bars:
- `psx_floor_ceiling_1` — floor / ceiling slab 1
- `psx_floor_ceiling_2` — floor / ceiling slab 2
- `psx_floor_ceiling_3` — floor / ceiling slab 3
- `psx_pillar_1` — pillar, style 1
- `psx_pillar_1_plain_1` — plain pillar
- `psx_pillar_1_plain_2` — plain pillar, variant
- `psx_pillar_2` — pillar, style 2
- `psx_pillar_3` — pillar, style 3
- `psx_beam_1` — structural beam
- `psx_beam_2` — structural beam 2
- `psx_beam_4` — structural beam 4
- `psx_beam_5` — structural beam 5
- `psx_catwalk_1` — metal catwalk section (the only one)
- `psx_bars_metal_1` — metal bars (cell / cage front)
- `psx_bars_metal_2` — metal bars, variant
- `psx_window_metal_bars_single` — barred window, single
- `psx_window_metal_bars_double` — barred window, double

Stairs:
- `psx_stairs_3` — stair flight 3
- `psx_stairs_4` — stair flight 4
- `psx_stairs_5_concrete` — concrete stair flight
- `psx_stairs_mp_1` — stair flight (mega pack)
- (`psx_stairs_5_wood` — wooden stairs, weak fit)

Doors + doorways:
- `psx_door_1_loose` — loose door leaf 1
- `psx_door_2_loose` — loose door leaf 2
- `psx_door_3_loose` — loose door leaf 3
- `psx_door_4_loose` — loose door leaf 4
- `psx_door_mp_1_loose` — loose door leaf (mp 1)
- `psx_door_mp_6_loose` — loose door leaf (mp 6)
- `psx_doorway_door_mp_1` — doorway with its door
- `psx_doorway_1` — wall with doorway
- `psx_doorway_1_1` — doorway, variant
- `psx_doorway_1_half` — half-width doorway piece
- `psx_doorway_1_plain` — doorway in plain wall
- `psx_doorway_2` — doorway, wall style 2
- `psx_doorway_2_1` — doorway style 2 variant
- `psx_doorway_2_1_half` — half doorway piece
- `psx_doorway_2_2_half` — half doorway piece
- `psx_doorway_2_wide` — wide doorway (vehicle / hangar)
- `psx_doorway_3_half` — half doorway, style 3
- `psx_doorway_3_wide` — wide doorway, style 3
- `psx_double_single_doorway_1` — double + single doorway wall
- `psx_double_single_doorway_2` — same, style 2
- `psx_double_single_doorway_2_1` — same, style 2 variant
- `psx_double_single_doorway_3` — same, style 3
- `psx_side_doorway_1` — doorway set to one side
- `psx_side_doorway_2` — side doorway, style 2
- `psx_side_doorway_2_1` — side doorway, variant
- `psx_side_doorway_3` — side doorway, style 3

Windows (OBSERVATION WINDOWS for the test chambers):
- `psx_window_1_single` — single window with glass
- `psx_window_1_single_frame_only` — window frame only
- `psx_window_1_single_no_glass` — window wall, no glass
- `psx_window_2_single` — single window, style 2
- `psx_window_2_single_frame_only` — frame only, style 2
- `psx_window_2_single_no_glass` — no glass, style 2
- `psx_window_2_double` — double window, style 2
- `psx_window_2_1_single` — style 2 texture 1, single
- `psx_window_2_1_single_frame_only` — frame only
- `psx_window_2_1_single_no_glass` — no glass
- `psx_window_2_1_double` — double window
- `psx_window_2_2_single` — style 2 texture 2, single
- `psx_window_2_2_single_frame_only` — frame only
- `psx_window_2_2_single_no_glass` — no glass
- `psx_window_2_2_double` — double window

Pipes + vents:
- `psx_pipe_1` — pipe run, long
- `psx_pipe_1_short` — pipe run, short
- `psx_pipe_1_corner` — pipe elbow
- `psx_pipe_1_cross` — pipe cross joint
- `psx_pipe_valve_holder_large_1` — large pipe valve on bracket
- `psx_pipe_valve_holder_large_2` — large valve bracket 2
- `psx_pipe_valve_holder_large_2_1` — large valve bracket, variant
- `psx_pipes_holder_1` — bracket holding several pipes
- `vent_grille` — wall vent grille (vent_1)
- `psx_vent_2` — vent 2
- `psx_vent_3` — vent 3
- `psx_vent_mp_1` — vent (mp)
- `psx_vent_mp_1_1` — vent (mp), variant
- `psx_toilet_cabin_mp_1` — toilet stall cabin (staff washroom)

## 2. LABS + SCIENCE (thin in this pack: small medical + measuring items only)

- `psx_dosimeter_1` — radiation dosimeter (collider, reactor)
- `psx_dosimeter_2` — dosimeter, model 2
- `psx_dosimeter_4` — dosimeter, model 4
- `psx_syringe_mp_1` — syringe
- `psx_syringe_mp_1_1` — syringe, variant
- `psx_pills_1` — loose pills
- `psx_pills_2` — loose pills 2
- `psx_pills_2_1` — loose pills, colour variant
- `psx_pills_2_2` — loose pills, colour variant
- `psx_pills_3` — loose pills 3
- `psx_pills_bottle_1` — pill bottle
- `psx_pills_bottle_1_1` — pill bottle, variant
- `psx_pills_bottle_1_2` — pill bottle, variant
- `psx_pills_bottle_2` — pill bottle 2
- `psx_pills_bottle_2_1` — pill bottle 2, variant
- `psx_pills_bottle_2_2` — pill bottle 2, variant
- `psx_pills_packet_1` — blister packet of pills
- `psx_bandage_mp_1` — bandage roll
- `psx_bandage_mp_2` — bandage roll 2
- `psx_poison_mp_1` — poison bottle (chemical store)
- `psx_healing_potion_mp_1` — potion vial (serum on a bench)
- `psx_healing_potion_mp_2` — potion vial 2
- `psx_glass_bottle_1` — glass bottle (lab stand-in)
- `psx_glass_bottle_2` — glass bottle 2
- `psx_magnet_mp_1` — horseshoe magnet (physics / collider joke)
- `psx_battery_mp_1`, `psx_battery_mp_1_1`, `psx_battery_mp_2`, `psx_battery_mp_2_1`, `psx_battery_mp_3_1`, `psx_battery_mp_3_2` — small batteries, six kinds
- `psx_car_battery_1` — car battery (jury-rigged experiment)
- `psx_display_cabinet_mp_1`, `_1_1`, `_1_2`, `_1_3`, `_1_4` (`psx_display_cabinet_mp_1_1` … `psx_display_cabinet_mp_1_4`) — glass display cabinet, five finishes (specimen case)
- `psx_display_cabinet_mp_2`, `psx_display_cabinet_mp_2_1`, `psx_display_cabinet_mp_2_2`, `psx_display_cabinet_mp_2_3`, `psx_display_cabinet_mp_2_4` — display cabinet 2, five finishes
- `psx_table_large_2`, `psx_table_large_2_1`, `psx_table_large_2_2`, `psx_table_large_2_3`, `psx_table_large_2_4` — large table (lab bench stand-in), five finishes
- `psx_table_large_3`, `psx_table_large_3_1`, `psx_table_large_3_2`, `psx_table_large_3_3`, `psx_table_large_3_4` — large table 3, five finishes
- `psx_fish_skeleton_mp_1` — fish skeleton (specimen tray)
- `psx_meat_1`, `psx_meat_1_1` — raw meat chunk (creature feed / specimen)

## 3. COMPUTERS + CONTROL

- `psx_monitoring_screen_mp_1` — monitoring / CCTV screen (war room, observation)
- `psx_monitoring_screen_mp_1_1` — monitoring screen, variant
- `psx_pc_mp_1` — PC tower
- `psx_pc_monitor_mp_1` — PC monitor
- `psx_pc_keyboard_mp_1` — keyboard
- `psx_pc_keyboard_mp_2` — keyboard 2
- `psx_pc_keyboard_mp_3` — keyboard 3
- `psx_pc_mouse_mp_1` — mouse
- `psx_pc_mouse_mp_2` — mouse 2
- `psx_mouse_pad_mp_1` — mouse pad
- `psx_pc_speaker_1_left` — PC speaker, left
- `psx_pc_speaker_1_right` — PC speaker, right
- `psx_keypad_1` — door keypad
- `psx_keypad_2` — door keypad 2
- `psx_button_12` — single wall button
- `psx_elevator_buttons_1` — elevator floor button panel
- `psx_elevator_call_button_1` — elevator call button
- `psx_elevator_screen_1` — elevator floor display
- `psx_handheld_tablet_1` — handheld tablet (scientist clipboard)
- `psx_tv_mp_1`, `psx_tv_mp_1_1`, `psx_tv_mp_1_2` — CRT television, three kinds (screen wall)
- `psx_tv_remote_mp_1` — TV remote
- `psx_tv_table_1`, `psx_tv_table_1_1`, `psx_tv_table_1_2`, `psx_tv_table_1_3`, `psx_tv_table_1_4` — low TV stand, five finishes
- `psx_tv_table_4`, `psx_tv_table_4_1`, `psx_tv_table_4_2`, `psx_tv_table_4_3`, `psx_tv_table_4_4` — TV stand 4, five finishes
- `psx_walkie_talkie_1` — walkie-talkie
- `psx_walkie_talkie_2` — walkie-talkie 2
- `psx_cell_phone_1`, `psx_cell_phone_2`, `psx_cell_phone_3` — old cell phones
- `psx_cell_phone_battery_1`, `psx_cell_phone_battery_1_1`, `psx_cell_phone_battery_2`, `psx_cell_phone_battery_2_1` — phone batteries
- `psx_smartphone_mp_1` — smartphone
- `psx_smartphone_mp_1_broken` — smashed smartphone (confiscated)
- `psx_floppy_disc_1` — floppy disc (classified data)
- `psx_compact_disc_mp_1` — compact disc
- `psx_cassette_tape_mp_1`, `psx_cassette_tape_mp_2` — cassette tapes (interview recordings)
- `psx_vhs_tape_1` — VHS tape (test footage)
- `psx_electrical_outlet_1`, `psx_electrical_outlet_2`, `psx_electrical_outlet_3` — wall sockets
- `psx_light_switch_1`, `psx_light_switch_1_1` — light switches

## 4. MILITARY + SECURITY

Access control:
- `psx_keycard_1` — keycard
- `psx_keycard_1_1`, `psx_keycard_1_2`, `psx_keycard_1_3` — keycard colour variants
- `psx_keycard_1_authorization_level_1` — keycard, clearance level 1
- `psx_keycard_1_authorization_level_2` — keycard, clearance level 2
- `psx_keycard_1_authorization_level_3` — keycard, clearance level 3
- `psx_keycard_1_authorization_level_4` — keycard, clearance level 4
- `psx_id_mp_1`, `psx_id_mp_1_1` — ID badge card
- `psx_padlock_1`, `psx_padlock_2`, `psx_padlock_3`, `psx_padlock_4` — padlocks
- `key`, `house_key`, `psx_key_mp_1_1`, `psx_key_mp_1_2`, `psx_key_mp_2`, `psx_key_mp_2_1`, `psx_key_mp_2_2`, `psx_key_mp_3`, `psx_key_mp_3_1`, `psx_key_mp_3_2`, `psx_key_mp_4_1`, `psx_key_mp_4_2` — metal keys (key board in the guard room)
- `psx_police_baton_mp_1` — guard baton
- `psx_incognito_mask_mp_1` — disguise mask (agent gear)

Weapons + ammo (armoury):
- `psx_pistol_mp_1`, `psx_pistol_mp_1_1`, `psx_pistol_mp_1_2`, `psx_pistol_mp_1_3` — pistol, four finishes
- `psx_pistol_mp_1_mag_empty`, `psx_pistol_mp_1_mag_loaded` — pistol magazine
- `psx_pistol_mp_1_mag_extended_empty`, `psx_pistol_mp_1_mag_extended_loaded` — extended magazine
- `psx_suppressor_mp_1`, `psx_suppressor_mp_2` — pistol suppressors
- `psx_ammo_box_1`, `psx_ammo_box_1_1` — ammo box
- `psx_ammo_box_mp_1`, `psx_ammo_box_mp_1_1`, `psx_ammo_box_mp_2`, `psx_ammo_box_mp_2_1`, `psx_ammo_box_mp_3`, `psx_ammo_box_mp_3_1`, `psx_ammo_box_mp_4`, `psx_ammo_box_mp_4_1`, `psx_ammo_box_mp_5`, `psx_ammo_box_mp_5_1` — ammo boxes, five kinds x 2
- `psx_ammo_pistol_loose_1pc_mp_1`, `psx_ammo_pistol_loose_1pc_mp_2`, `psx_ammo_pistol_loose_1pc_mp_3`, `psx_ammo_pistol_loose_2pcs_mp_2`, `psx_ammo_pistol_loose_3pcs_mp_1`, `psx_ammo_pistol_loose_4pcs_mp_3`, `psx_ammo_pistol_loose_5pcs_mp_1`, `psx_ammo_pistol_loose_5pcs_mp_2` — loose pistol rounds
- `psx_ammo_pistol_loose_mp_1_casing`, `psx_ammo_pistol_loose_mp_2_casing`, `psx_ammo_pistol_loose_mp_3_casing` — spent casings (firing range floor)
- `psx_shotgun_ammo_1`, `psx_shotgun_ammo_2`, `psx_shotgun_ammo_2_1` — shotgun shells
- `psx_knife_mp_1`, `psx_knife_mp_1_1` — combat knife

Crates, barrels, stores:
- `psx_supply_crate_1`, `psx_supply_crate_1_1`, `psx_supply_crate_1_2`, `psx_supply_crate_1_3`, `psx_supply_crate_1_4` — military supply crate, five colours
- `psx_supply_crate_1_empty`, `psx_supply_crate_1_1_empty`, `psx_supply_crate_1_2_empty`, `psx_supply_crate_1_3_empty`, `psx_supply_crate_1_4_empty` — same crates, open and empty
- `psx_wooden_crate_1`, `psx_wooden_crate_1_1`, `psx_wooden_crate_2`, `psx_wooden_crate_3`, `psx_wooden_crate_3_1`, `psx_wooden_crate_4`, `psx_wooden_crate_5`, `psx_wooden_crate_6` — wooden crates
- `psx_metal_barrel_mp_0`, `psx_metal_barrel_mp_1`, `psx_metal_barrel_mp_2`, `psx_metal_barrel_mp_3` — metal drums, four kinds
- `psx_jerrycan_1`, `psx_jerrycan_1_1` — fuel jerrycans
- `cardboard_box`, `psx_cardboard_box_1`, `psx_cardboard_box_2_1` — cardboard boxes
- `cinder_block` — concrete block
- `psx_canned_food_mp_1`, `psx_canned_food_mp_2`, `psx_canned_food_mp_3`, `psx_canned_food_mp_4`, `psx_canned_food_mp_5_rusty` — tinned rations (bunker store)
- `psx_gold_bar_pcs_1` — stack of gold bars (VIP bunker vault, black budget)
- `psx_cash_1`, `psx_cash_1_2`, `psx_cash_2`, `psx_cash_2_1`, `psx_cash_3`, `psx_cash_3_1`, `psx_cash_4`, `psx_cash_5`, `psx_cash_5_1`, `psx_cash_6`, `psx_cash_6_1` — cash bundles (same vault)
- `psx_flashlight_1`, `psx_flashlight_mp_1` — flashlights

Barracks (the pack's only beds):
- `dorm_bed` — plain single bed (bed_5)
- `psx_bed_5_1`, `psx_bed_5_2`, `psx_bed_5_3`, `psx_bed_5_4` — single bed, colour variants
- `psx_bed_1` — bed 1
- `psx_bed_1_frame` — bare bed frame (bunk / holding cell)
- `psx_bed_2`, `psx_bed_2_1` — bed 2
- `psx_old_mattress_mp_1`, `psx_old_mattress_mp_1_1` — bare mattress (test subject cell)
- `psx_pillow_mp_1`, `psx_pillow_mp_2` — pillows
- `psx_wardrobe_mp_1`, `psx_wardrobe_mp_1_1`, `psx_wardrobe_mp_1_2`, `psx_wardrobe_mp_1_3`, `psx_wardrobe_mp_1_4` — wardrobe (locker stand-in)

## 5. VEHICLES + HANGAR (no vehicles in this pack; workshop tools and stores only)

- `psx_screwdriver_mp_1`, `psx_screwdriver_mp_1_1`, `psx_screwdriver_mp_1_2`, `psx_screwdriver_mp_2`, `psx_screwdriver_mp_2_1`, `psx_screwdriver_mp_2_2` — screwdrivers
- `psx_hand_saw_1` — hand saw
- `psx_nails_1`, `psx_nails_1_rusty` — loose nails
- `psx_car_battery_1` — car battery (also section 2)
- `psx_jerrycan_1`, `psx_jerrycan_1_1` — fuel cans (also section 4)
- `psx_metal_barrel_mp_0` … `psx_metal_barrel_mp_3` — fuel / oil drums (also section 4)
- `psx_doorway_2_wide`, `psx_doorway_3_wide` — the wide openings for a hangar bay or parking level
- `psx_tunnel_entrance_platform_1` — the tram stop piece
- `psx_brick_1`, `psx_brick_1_1`, `psx_brick_1_2`, `psx_brick_1_3` — loose bricks (construction corner, weak fit)

## 6. PSYCHIC / TEST / TRAINING

- `psx_chair_mp_1`, `psx_chair_mp_1_1`, `psx_chair_mp_1_2`, `psx_chair_mp_1_3`, `psx_chair_mp_1_4` — plain chair, five finishes (subject's chair)
- `psx_chair_mp_2`, `psx_chair_mp_2_1`, `psx_chair_mp_2_2`, `psx_chair_mp_2_3`, `psx_chair_mp_2_4` — chair 2, five finishes
- `psx_coffee_table_1`, `psx_coffee_table_1_1`, `psx_coffee_table_1_2`, `psx_coffee_table_1_3`, `psx_coffee_table_1_4` — low table (card-guessing table)
- `psx_toy_brick_1`, `psx_toy_brick_1_1`, `psx_toy_brick_1_2`, `psx_toy_brick_1_3` — coloured toy bricks (telekinesis test objects, test-chamber cubes)
- `psx_coin_mp_1` — coin (coin-flip prediction test)
- `psx_spoon_mp_1` — spoon (spoon bending)
- `psx_fork_mp_1` — fork (same test)
- `psx_magnet_mp_1` — magnet (also section 2)
- `psx_lollipop_mp_1`, `psx_lollipop_mp_1_1`, `psx_lollipop_mp_1_2`, `psx_lollipop_mp_1_3` — lollipops (reward for child test subjects; eerie)
- `psx_handheld_game_console_1` — handheld game console (reflex test / subject's toy)
- `psx_notebook_1` — notebook (observation log)
- `psx_open_book_mp_1` — open book
- `psx_cassette_tape_mp_1`, `psx_cassette_tape_mp_2`, `psx_vhs_tape_1` — session recordings (also section 3)
- `psx_old_mattress_mp_1`, `psx_old_mattress_mp_1_1` — mattress on the floor of a white cell (also section 4)
- `psx_carpet_mp_1` — carpet / floor mat (meditation mat stand-in)
- `psx_gay_card_mp_1` — a small card (file name only; could pass as a test card, check its picture first)
- `psx_window_*_single` / `_double` families — the observation windows (section 1)

## 7. OFFICE + LIVING

- `psx_chair_mp_3`, `psx_chair_mp_3_1`, `psx_chair_mp_3_2`, `psx_chair_mp_3_3`, `psx_chair_mp_3_4` — chair 3, five finishes
- `psx_chair_mp_4`, `psx_chair_mp_4_1`, `psx_chair_mp_4_2`, `psx_chair_mp_4_3` — chair 4, four finishes
- `psx_chair_mp_5`, `psx_chair_mp_5_1`, `psx_chair_mp_5_2`, `psx_chair_mp_5_3`, `psx_chair_mp_5_4` — chair 5, five finishes
- `psx_dinner_table_1`, `psx_dinner_table_1_1`, `psx_dinner_table_1_2`, `psx_dinner_table_1_3`, `psx_dinner_table_1_4` — dining table (mess hall, briefing table)
- `psx_shelf_mp_2`, `psx_shelf_mp_2_1`, `psx_shelf_mp_2_2`, `psx_shelf_mp_2_3`, `psx_shelf_mp_2_4` — shelf unit 2, five finishes (stores, archive)
- `psx_shelf_mp_3`, `psx_shelf_mp_3_1`, `psx_shelf_mp_3_2`, `psx_shelf_mp_3_3`, `psx_shelf_mp_3_4` — shelf unit 3
- `library_shelf`, `psx_shelf_mp_4_1`, `psx_shelf_mp_4_2`, `psx_shelf_mp_4_3`, `psx_shelf_mp_4_4` — shelf unit 4 (archive of files)
- `psx_shelf_mp_5`, `psx_shelf_mp_5_1`, `psx_shelf_mp_5_2`, `psx_shelf_mp_5_3`, `psx_shelf_mp_5_4` — shelf unit 5
- `psx_shelf_mp_6`, `psx_shelf_mp_6_1`, `psx_shelf_mp_6_2`, `psx_shelf_mp_6_3`, `psx_shelf_mp_6_4` — shelf unit 6
- `psx_shelf_mp_7`, `psx_shelf_mp_7_1`, `psx_shelf_mp_7_2`, `psx_shelf_mp_7_3`, `psx_shelf_mp_7_4` — shelf unit 7
- `psx_bedside_table_1`, `psx_bedside_table_1_1`, `psx_bedside_table_1_2`, `psx_bedside_table_1_3`, `psx_bedside_table_1_4` — bedside cabinet (barracks, VIP suite)
- `psx_bedside_table_2`, `psx_bedside_table_2_1`, `psx_bedside_table_2_2`, `psx_bedside_table_2_3`, `psx_bedside_table_2_4` — bedside cabinet 2
- `psx_vending_machine_1` — vending machine (break room, tram platform)
- `psx_toilet_mp_1`, `psx_toilet_mp_1_1`, `psx_toilet_mp_1_2` — toilets (washroom, cell)
- `psx_clock_1`, `psx_clock_2` — wall clocks (war room time zones)
- `pen`, `pencil` — desk pen and pencil
- `psx_book_mp_1`, `psx_book_mp_2`, `psx_book_mp_3`, `psx_book_mp_4`, `psx_book_mp_5`, `psx_book_mp_6`, `psx_book_mp_7`, `psx_book_mp_8`, `psx_book_mp_9`, `psx_book_mp_10` — books (manuals, binders stand-in)
- `psx_ashtray_1` — ashtray (1960s war room)
- `psx_cig_1`, `psx_cig_2`, `psx_cig_3`, `psx_cigs_packet_1` — cigarettes + packet
- `psx_lighter_mp_1`, `psx_lighter_mp_1_1`, `psx_lighter_mp_1_2`, `psx_matchbox_1`, `psx_matchbox_2` — lighters, matchboxes
- `psx_plate_mp_1`, `psx_tin_can_mp_1_rusty`, `psx_tin_can_mp_1_rusty_1` — mess plate, empty tins
- `psx_sponge_mp_1`, `psx_sponge_mp_2` — cleaning sponges (janitor closet)
- `psx_planter_pot_mp_1_empty`, `psx_planter_pot_mp_1_full`, `psx_potted_cactus_mp_1` — office plants (the sad desk cactus)
- `psx_photo_frame_mp_1`, `psx_photo_frame_mp_2`, `psx_painting_1` — framed photo / picture (director's office, VIP bunker)
VIP bunker (soft furniture):
- `couples_bed`, `psx_bed_4_1`, `psx_bed_4_2`, `psx_bed_4_3`, `psx_bed_4_4` — double bed, five finishes
- `psx_armchair_1`, `psx_armchair_1_1`, `psx_armchair_1_2`, `psx_armchair_1_3` — armchair, four finishes
- `psx_armchair_2`, `psx_armchair_2_1`, `psx_armchair_2_2`, `psx_armchair_2_3` — armchair 2, four finishes
- `psx_sofa_1`, `psx_sofa_1_1`, `psx_sofa_1_2`, `psx_sofa_1_3` — sofa, four finishes
- `psx_sofa_3`, `psx_sofa_3_1`, `psx_sofa_3_2`, `psx_sofa_3_3` — sofa 3
- `psx_sofa_4`, `psx_sofa_4_1`, `psx_sofa_4_2`, `psx_sofa_4_3` — sofa 4
- `psx_sofa_5`, `psx_sofa_5_1`, `psx_sofa_5_2`, `psx_sofa_5_3` — sofa 5
- `psx_carpet_mp_1` — carpet

## 8. LIGHTS + SIGNS + DECAL-LIKE PIECES

Every lamp comes as an `_off` / `_on` pair (good for dead corridors beside lit ones).
- `psx_ceiling_lamp_1_off`, `psx_ceiling_lamp_1_on` — ceiling lamp 1
- `psx_ceiling_lamp_2_off`, `psx_ceiling_lamp_2_on` — ceiling lamp 2
- `psx_ceiling_lamp_4_off`, `psx_ceiling_lamp_4_on` — ceiling lamp 4 (base)
- `psx_ceiling_lamp_4_a_off`, `psx_ceiling_lamp_4_a_on` — ceiling lamp 4, type a
- `psx_ceiling_lamp_4_b_off`, `psx_ceiling_lamp_4_b_on` — ceiling lamp 4, type b
- `psx_ceiling_lamp_4_1_off`, `psx_ceiling_lamp_4_1_on` — ceiling lamp 4, finish 1
- `psx_ceiling_lamp_4_1_a_off`, `psx_ceiling_lamp_4_1_a_on` — finish 1, type a
- `psx_ceiling_lamp_4_1_b_off`, `psx_ceiling_lamp_4_1_b_on` — finish 1, type b
- `psx_ceiling_lamp_mp_1_off`, `psx_ceiling_lamp_mp_1_on` — ceiling lamp (mp)
- `psx_ceiling_lamp_mp_1_1_off`, `psx_ceiling_lamp_mp_1_1_on` — ceiling lamp (mp), variant
- `psx_lamp_1_off`, `psx_lamp_1_on`, `psx_lamp_1_1_off`, `psx_lamp_1_1_on` — lamp 1 (two finishes)
- `psx_lamp_2_off`, `psx_lamp_2_on`, `psx_lamp_2_2_off`, `psx_lamp_2_2_on` — lamp 2
- `psx_lamp_3_off`, `psx_lamp_3_on`, `psx_lamp_3_1_off`, `psx_lamp_3_1_on` — lamp 3
- `psx_lamp_5_off`, `psx_lamp_5_on`, `psx_lamp_5_1_off`, `psx_lamp_5_1_on` — lamp 5
- `psx_ceiling_fan_mp_1`, `psx_ceiling_fan_mp_1_1_light_off`, `psx_ceiling_fan_mp_1_1_light_on`, `psx_ceiling_fan_mp_1_1_light_on_blades` — ceiling fan, with / without light, blades apart (can spin)
- `psx_ceiling_fan_mp_2`, `psx_ceiling_fan_mp_2_1_light_off`, `psx_ceiling_fan_mp_2_1_light_on` — ceiling fan 2
- `psx_elevator_sign_1` — elevator sign (the ONLY sign in the pack)
- `psx_cobweb_1`, `psx_cobweb_2`, `psx_cobweb_4`, `psx_cobweb_5` — cobweb decal planes (the pack's whole decals folder; for an abandoned wing only, not the clean white rooms)

## 9. ODDITIES (things that suit a secret base)

- `psx_keycard_1_authorization_level_1` … `_4` — clearance tiers, a ready story/progression prop
- `psx_dosimeter_1` / `_2` / `_4` — radiation meters lying about
- `psx_incognito_mask_mp_1` — disguise mask
- `psx_gold_bar_pcs_1` + the `psx_cash_*` family — black-budget vault
- `psx_healing_potion_mp_1` / `_2`, `psx_poison_mp_1` — unlabelled serums
- `psx_fish_skeleton_mp_1`, `psx_meat_1`, `psx_meat_1_1` — specimen / feeding-time props
- `psx_toy_brick_*`, `psx_lollipop_mp_*`, `psx_handheld_game_console_1` — child test-subject traces
- `psx_spoon_mp_1`, `psx_coin_mp_1`, `psx_magnet_mp_1` — psychic test objects
- `psx_smartphone_mp_1_broken` — confiscated, smashed phone
- `psx_cross_1`, `psx_cross_mp_2` — crosses (a ward against whatever is in the cell; weak fit)
- `psx_sword_mp_1` — a sword (recovered artefact in a display cabinet; weak fit)
- `psx_vape_mp_1` — vape (off-duty guard; weak fit)
- `psx_ceiling_fan_mp_1_1_light_on_blades` — loose fan blades (a spinning part for a vent shaft)

---

## FAMILIES READ THAT DO NOT FIT (so you know they were read)

`psx_butcher_knife_mp_1` (kitchen cleaver), `psx_underwear_mp_1`, `psx_curtain_rod_mp_1`, `psx_stairs_5_wood` (wooden house stairs),
`psx_brick_*` (only as rubble), `psx_cobweb_*` (only for an abandoned wing), `psx_cross_*`, `psx_sword_mp_1`, `psx_vape_mp_1`,
`psx_painting_1` / photo frames and the home soft furniture (sofas, armchairs, double beds, bedside tables, TV stands) outside the
VIP bunker / break room, the house `key` families beyond a guard-room key board, the wood-finish variants of shelves / tables /
wardrobes / display cabinets where a clean metal look is wanted (the `_1`…`_4` suffixes are finishes: look at them before choosing).

## COUNT

- Rows read: **584** (MODEL_LIST.md lines 747-1330; header says 584).
- Listed above as fitting: about 500 keys (the pack is almost all indoor facility dressing); strong fits about 230
  (sections 1, 3, 4 and the lamps).


---

# FITS THE D.U.M.B. — part 2: MODEL_LIST.md lines 1332-1888 (section 6, the two Meshy tables)

Read end to end: `MODEL_LIST.md` lines 1332-1888 and `docs/plans/WISHLIST_MODELS_ADDED.md` (all 342 lines).
Rows read: **546** = 300 "Meshy AI (mondo)" (lines 1336-1635) + 246 "Meshy AI ... THE WISH LIST" (lines 1641-1886).
Line 1888 is only the heading of the next table (Roads, Elbolilloduro), not read here.

Sizes are w x h x d in metres and are given ONLY where WISHLIST_MODELS_ADDED.md gives one (wish-list rows).
The 300 older Meshy rows have no size in either file ("no size given" is implied where no size is shown).
(W) = wish-list model, file `Assets/world/props/meshy/wishlist/<key>.glb`. All others: `Assets/world/hq/models/`,
`Assets/world/props/meshy/` or `Assets/fx/spell_props/` (marked SP = a spell prop, never used as room decor so far: check its scale).

Several keys share one file (same model, two catalogue names): dish = dish_big; saucer_big = saucer_lg; spaceship = spaceship_fly;
lunar_lander = lunar_lander_full; exec_chair = office_chair; lectern = church_podium; telescope = brass_telescope;
railing_1m / meshy_one_meter_of_railing / meshy_one_meter_of_railing_b (same railing, two folders).

## What the owner's list asks for and these two tables do NOT have (say it plainly)
- NO tarp, no aircraft under a tarp, no covered shape of any kind.
- NO cryo pod, no stasis tube, no specimen tank, no glass cylinder, no vat. Nearest: `escapepod`, `time_machine`, `meshy_black_blob`.
- NO lab bench, no glassware, no microscope, no centrifuge, no fume hood, no operating table. Nearest: `steel_bench` (a jail bench), `meshy_sink`, `meshy_syringe`, `hospital_bed`, `stretcher`.
- NO server rack, no mainframe, no modern monitor, no big wall screen, no security camera (CCTV), no keypad. Nearest: `crt_terminal`, `retro_control_panel`, `breaker_panel`, `meshy_tube_tv`.
- NO test-chamber pieces as such (no white panel, button, cube, emitter, turret). The one real hit: `observation_window` (a ROUND observation window).
- NO collider / accelerator ring part, no magnet, no reactor. Nearest: `dockring` (a spaceship docking ring = a ring section), `waste_pipe`, `pipe_run`, `nacelle`, `meshy_tesla_coil`.
- NO forklift, no aircraft tug, no fuel bowser, no cargo truck, no tram car as such. Nearest: `subway_cart` + `subway_front` (the tram), `hand_car`, `mine_cart`, `missile_cart`, `military_jeep`.
- NO weapon rack, no ammo crate, no gun turret, no metal bunk bed (military). Nearest: `chain_bunk`, `cot`, `meshy_locker`, loose guns (spell props).
- NO psychic kit as such (no zener cards, no sensory tank, no EEG chair, no dummy). Nearest: `crystalBall`, tarot cards, `meshy_ejection_seat`, `cheval_mirror`, `funhouse_mirror`, `meshy_voodoo_doll`.
- Aircraft that DO exist: `fighter_jet` (F-22, a spell prop), `helicopter` (black, 16 m), `avenger_wreck` (WWII bomber wreck, 12 m), `ufo` (triangle UFO), `saucer_big` / `saucer_lg` (saucer on landing gear), `spaceship` / `spaceship_fly`, `space_shuttle`, `lunar_lander`, `escapepod`, `satellite`, `mars_rover`.

---

## 1. Structure pieces (doors, vents, pipes, ladders, railings, cages, lifts)

Doors (all `leaf_*` are door leaves from the HQ door set):
- `leaf_vault` — bank vault door (blast door stand-in)
- `leaf_bulkhead` — submarine bulkhead door
- `leaf_security` — security door
- `leaf_futuristic` — futuristic sliding-style door
- `leaf_holographic` — holographic door (test chamber exit)
- `leaf_wired_double` — institutional wired-glass double door
- `leaf_hospital` — hospital room door, window
- `leaf_cell` — cell door with a slot
- `leaf_frosted` — frosted executive glass door
- `leaf_frosted_single` — single-leaf frosted glass door
- `leaf_glass` — plain glass door
- `leaf_glass_exec` — glass executive door
- `leaf_office` — plain office door
- `leaf_exit` — exit door
- `leaf_closet` / `leaf_closet_alt` — janitor's closet door
- `leaf_closet_warped` — warped closet door (something wrong)
- `leaf_bathroom` / `leaf_stall` — bathroom door, stall door
- `leaf_frame_only` — bare door frame
- `leaf_revolving` — revolving door (lobby / checkpoint)
- `leaf_portcullis` — portcullis (drop gate, containment)
- `leaf_hotel` / `leaf_motel` — numbered room doors (VIP bunker suites, staff quarters)
- `observation_window` — ROUND observation window (the test chamber piece)
- `vault` — a whole bank vault (prop)

Vents, drains, pipes:
- `meshy_vent` — wall / ceiling vent grille
- `pipe_run` — office pipe run
- `waste_pipe` (W) — large concrete pipe on its side — 2.24 x 2.25 x 3.0
- `valve_wheel` (W) — red valve wheel on pipe stand — 0.98 x 1.2 x 0.33
- `culvert_mouth` — culvert mouth (tunnel / drain outlet)
- `drain_grate` — storm drain grate
- `floor_drain` — small floor water drain
- `meshy_round_street_drain` — round street drain / manhole
- `ceiling_fan` (W) — industrial caged ceiling fan — 1.2 x 1.22 x 0.59
- `breaker_panel` — electrical breaker panel

Ladders, stairs, railings, lifts, fences:
- `manhole_ladder` (W) — iron ladder in concrete shaft — 1.98 x 3.5 x 2.0
- `pool_ladder` (W) — chrome ladder (tank / pit access) — 0.8 x 1.5 x 0.65
- `wooden_ladder` (W) — plain wooden ladder — 1.05 x 3.0 x 0.17 (weak fit)
- `escalator` — an escalator (level change)
- `railing_1m` / `meshy_one_meter_of_railing` / `meshy_one_meter_of_railing_b` — one metre of railing
- `chain_fence` (W) — chain-link fence panel — 3.5 x 2.16 x 0.2
- `barbed_wire_fence` (W) — barbed wire fence section — 3.5 x 1.74 x 0.61
- `boom_gate` (W) — military checkpoint boom barrier — 5.0 x 6.35 x 1.27
- `safety_netting` (W) — orange safety net fence — 4.0 x 1.75 x 0.12
- `yellow_pole` — yellow pole (bollard / marker)
- `footbridge` — plank footbridge (weak fit, catwalk stand-in)
- `brick_arch` — brick arch section (old tunnel)
- `hullplate` — torn hull plate with wiring (wreck / damaged wall)

Tram tunnel / rail pieces (also in section 5):
- `rail_section` (W) — 3.5 m of railway track — 3.5 x 0.22 x 1.42
- `buffer_stop` (W) — rail buffer stop, track end — 1.33 x 1.04 x 2.0
- `signal_gantry` (W) — railway signal gantry — 6.0 x 4.93 x 1.32
- `tunnel_signal` (W) — subway tunnel signal light — 0.59 x 2.5 x 0.67
- `third_rail_shoe` (W) — third-rail contact shoe — 0.5 x 0.22 x 0.19
- `road_straight` / `road_turn` — straight road, quarter turn (parking level)
- `traffic_cone`, `traffic_barrel` — cone, barrel (parking, hangar floor)
- `meshy_cinder_block` — one cinder block

## 2. Labs + science
- `meshy_tesla_coil` — a tesla coil (mad scientist)
- `time_machine` — retro time machine (experiment centrepiece)
- `retro_control_panel` — retro control panel / console
- `dockring` — spaceship docking ring (collider ring / portal stand-in)
- `nacelle` — engine nacelle (test stand, collider part)
- `escapepod` — escape pod (pod / chamber stand-in; nearest to a cryo pod)
- `meshy_syringe` — a syringe
- `hospital_bed` — hospital bed (medical bay, test subject)
- `stretcher` (W) — rescue stretcher — 2.1 x 0.19 x 0.96
- `meshy_sink` — a sink (lab wash station)
- `steel_bench` (W) — steel bench bolted down — 2.4 x 1.26 x 1.1 (holding / lab bench stand-in)
- `food_trolley` (W) — stainless steel trolley with trays — 1.2 x 1.28 x 0.65 (instrument cart)
- `hazmat_suit` (W) — yellow hazmat suit on hook — 0.6 x 1.9 x 0.35
- `radiation_drum` (W) — yellow drum, radiation trefoil — 0.57 x 0.9 x 0.59
- `canopic_jars` (W) — four jars, animal-head lids — 0.54 x 0.45 x 0.49 (specimen jars / recovered artefact)
- `ice_block` (W) — big block of glacier ice — 3.18 x 2.5 x 3.08 (thing frozen in ice; nearest "cryo")
- `telescope` / `brass_telescope` — brass telescope
- `coin_telescope` (W) — coin-op binocular viewer — 1.05 x 1.5 x 0.64 (weak)
- `sieve_table` (W) — archaeology sieve screen table — 1.51 x 1.06 x 1.6 (artefact lab)
- `weather_mast` (W) — weather station mast — 3.0 x 4.0 x 2.4 (instrument rig)
- `meshy_tongs` — tongs (lab handling)
- `cauldron` (SP) — black cauldron (mad lab vat, weak)
- `meshy_crystal_shard` / `meshy_crystal_shards` — crystal shard(s) (sample, energy source)
- `solar`, `earth`, `moon`, `jupiter`, `saturn`, `star` — planet / solar system models (astronomy lab, briefing room display)
- `alien` — alien planet model (display; note: a PLANET, not a creature)
- Animal test subjects, cages: `rat` (W) 0.19 x 0.12 x 0.31; `meshy_frog`; `pig` (W) 0.48 x 0.8 x 1.52; `goat` (W) 0.32 x 0.9 x 1.13 ("men who stare at goats"); `spider` (W) 0.32 x 0.1 x 0.35; `scorpion` (W) 0.25 x 0.2 x 0.3; `cobra` (W) 0.63 x 0.7 x 0.57; `lizard` (W) 0.18 x 0.1 x 0.4; `caterpillar`; `kennel` (W) dog kennel 1.2 x 1.17 x 1.07; `cage_wagon` (W) circus cage wagon 4.5 x 3.42 x 2.45 (the only CAGE in these tables)

## 3. Computers + control
- `crt_terminal` — CRT computer terminal
- `retro_control_panel` — retro control console
- `meshy_tube_tv` — tube TV (monitor wall)
- `vhs_player`, `vhs_tape` — VHS deck, tape (recorded experiments)
- `meshy_retro_radio` — retro radio
- `retro_speakers` — retro speakers (PA)
- `meshy_microphone` — a microphone (PA / interrogation)
- `meshy_analog_phone` — analog desk phone (red phone)
- `telegraph_key` (W) — brass telegraph key — 0.29 x 0.07 x 0.3
- `breaker_panel` — breaker panel
- `dish` / `dish_big` — satellite dish
- `antenna_dish` (W) — white satellite dish on base — 2.04 x 2.5 x 1.78
- `radar_antenna` (W) — military radar antenna — 6.52 x 5.0 x 4.69
- `lattice_pylon` (W) — steel lattice radio mast — 3.75 x 15.0 x 3.67 (big cavern only)
- `satellite` — a satellite (hung in a hangar / on a stand)
- `camera_dolly` (W) — film camera on dolly — 2.0 x 2.06 x 1.11 (the ONLY camera; observation room, staged-landing set)
- `clapperboard` (W) — film clapperboard — 0.3 x 0.33 x 0.04 (faked-footage stage)
- `conference_table` — long black oval conference table (the war room table)
- `clock`, `meshy_clock` — wall clocks (war room time zones)
- `height_board` (W) — mugshot height chart on stand — 1.32 x 2.0 x 0.74 (intake)
- `trail_sign` (W) — map board on posts — 1.57 x 2.2 x 0.96 (re-skin as a notice / map board; weak)
- `clipboard_flat`, `manila_folder`, `manila_folders`, `papers_a`, `papers_b`, `paper_sheet`, `notebook_paper` — files and papers

## 4. Military + security
- `meshy_sandbags` — sandbag wall
- `boom_gate` (W) — checkpoint boom barrier — 5.0 x 6.35 x 1.27
- `chain_fence` (W) — chain-link panel — 3.5 x 2.16 x 0.2
- `barbed_wire_fence` (W) — barbed wire section — 3.5 x 1.74 x 0.61
- `missile` (SP) — a missile
- `missile_cart` (W) — missile on wheeled cart — 5.0 x 2.07 x 1.87
- `radiation_drum` (W) — radiation barrel — 0.57 x 0.9 x 0.59
- `traffic_barrel` — plastic traffic barrel
- `wooden_barrel` (W) — oak barrel — 0.75 x 1.0 x 0.75 (weak)
- `cardboard_boxes`, `meshy_cardboard_box` — cardboard boxes (stores)
- `fish_boxes` (W) — stack of blue plastic crates — 1.2 x 1.06 x 0.77 (has fish + ice in it; weak)
- `meshy_burlap_sack` — burlap sack (stores)
- `meshy_locker` — a locker
- `office_locker` — office locker
- `cot` — a cot (barracks)
- `chain_bunk` (W) — steel bunk hung on chains — 2.0 x 1.85 x 0.89
- `meshy_dorm_bed` — dorm bed (barracks)
- `sleeping_bag` (W) — green sleeping bag — 2.0 x 0.28 x 0.73
- `backpack` (W) — expedition backpack — 0.54 x 0.75 x 0.48
- `handcuffs` (W) — steel handcuffs — 0.25 x 0.01 x 0.14
- `key_ring` (W) — jailer's key ring — 0.2 x 0.3 x 0.07 (old look)
- `booking_desk` (W) — police booking counter — 2.4 x 2.0 x 1.14 (security checkpoint desk)
- `steel_bench` (W) — holding cell bench — 2.4 x 1.26 x 1.1
- `flag_pole` (W) — flag pole, plain grey-white flag — 4.3 x 8.0 x 0.75
- `canvas_tent` (W) — old canvas wall tent — 3.86 x 2.4 x 3.51 (field tent in a cavern; nearest thing to canvas / tarp)
- `meshy_camping_tent` — camping tent (weak)
- `meshy_fire_extinguisher` — fire extinguisher
- `meshy_rope`, `rope_coils` (W) 1.2 x 0.57 x 0.8 — rope
- Guns (all spell props, SP): `pistol`, `revolver`, `shotgun`, `sniper`, `plasma` (plasma gun), `bullet`; plus `meshy_retro_gun_that_shoo` (retro ray gun) and `door_gun` (the Door Gun itself)
- Ordnance (SP): `spell_grenade`, `spell_landmine`, `spell_dynamite`, `spell_shield`
- `ship_cannon` — iron cannon (weak, museum piece)
- `military_tank`, `military_jeep`, `helicopter` — see section 5

## 5. Vehicles + hangar
Aircraft / craft (FLAGGED):
- `fighter_jet` (SP) — F-22 fighter jet; a spell prop, check its scale before parking it
- `helicopter` (W) — BLACK military transport helicopter — 16.0 x 4.97 x 4.0
- `avenger_wreck` (W) — wrecked WWII torpedo bomber — 9.15 x 2.25 x 12.0 (recovered wreck, Bermuda case)
- `ufo` — TRIANGLE UFO (the black-triangle craft)
- `saucer_big` / `saucer_lg` — flying saucer on landing gear
- `spaceship` / `spaceship_fly` — a spaceship
- `space_shuttle` — space shuttle
- `lunar_lander` / `lunar_lander_full` — lunar lander (faked-landing stage)
- `mars_rover` — Mars rover
- `escapepod` — escape pod
- `satellite` — satellite
- `space_station` — International Space Station model (hung model, weak)
- `nacelle` — engine nacelle (engine on a stand)
- `hullplate` — torn hull plate with wiring (crash debris on a table)
- `meshy_ejection_seat` — ejection seat
- `astronaut` — dead astronaut (suit on a slab)
- `windsock` (W) — airfield windsock — 2.98 x 5.0 x 1.53 (surface only)

Ground vehicles:
- `military_tank` — a military tank
- `military_jeep` (W) — olive humvee — 4.5 x 1.93 x 2.6
- `missile_cart` (W) — missile on cart — 5.0 x 2.07 x 1.87
- `car_cyber` — cyberpunk car (prototype vehicle)
- `car_ambulance` — ambulance
- `fire_truck` — fire truck (hangar crash tender)
- `school_bus` — school bus (staff shuttle, weak)
- `convertible_car` (W) — 1960s red convertible — 4.8 x 1.47 x 1.87 (VIP parking)
- `camper_van` (W) — 1970s camper van — 5.0 x 3.46 x 2.16 (parking, weak)
- `tractor` (W) — old red farm tractor — 3.8 x 2.59 x 1.98 (the nearest thing to an aircraft TUG; weak)
- `piste_groomer` (W) — tracked snowcat — 6.0 x 2.06 x 3.51 (tracked utility vehicle, weak)
- `snowmobile` (W) — black-yellow snowmobile — 3.0 x 1.44 x 1.15 (weak)
- `skateboard` — skateboard

Tram tunnel:
- `subway_cart` — subway train car (THE TRAM)
- `subway_front` — subway train front car
- `hand_car` (W) — rail pump trolley — 2.5 x 1.75 x 1.72
- `mine_cart` (W) — iron ore wagon on rail — 2.4 x 1.62 x 1.22
- `rail_section` (W) 3.5 x 0.22 x 1.42; `buffer_stop` (W) 1.33 x 1.04 x 2.0; `signal_gantry` (W) 6.0 x 4.93 x 1.32; `tunnel_signal` (W) 0.59 x 2.5 x 0.67; `third_rail_shoe` (W) 0.5 x 0.22 x 0.19
- `meshy_bus_shelter` — bus shelter (tram stop shelter)
- `city_bench` — city bench (tram platform)

Hangar / workshop floor:
- `hand_cart` (W) — wooden two-wheel hand cart — 2.2 x 1.17 x 1.38 (weak, medieval look)
- `wheelbarrow` (W) — wooden wheelbarrow — 1.5 x 0.55 x 0.57 (weak)
- `babel_crane` — a scaffold crane (hangar gantry stand-in)
- `head_wheel` (W) — mine head-frame pulley wheel — 2.75 x 5.0 x 2.08 (lift shaft winch)
- `beam_pump` (W) — cast iron beam pump — 3.64 x 3.5 x 1.66 (weak)
- `anvil` (W) 0.76 x 0.85 x 0.66, `grindstone` (W) 0.96 x 1.1 x 0.72 — workshop (weak, old look)
- `meshy_dumpster` — a dumpster

## 6. Psychic / test / training
- `crystalBall` (SP) — crystal ball (remote viewing prop)
- `tarot`, `tarot2`, `tarotDeck` (SP) — tarot cards (card-guessing test, in place of zener cards)
- `meshy_ejection_seat` — ejection seat (restraint / test chair)
- `exec_chair` / `office_chair`, `teal_chair`, `folding_chair`, `molded_chair`, `cafeteria_chair` — chairs (subject + observer)
- `cheval_mirror` (W) — standing mirror — 1.15 x 1.8 x 0.05
- `funhouse_mirror` (W) — warped mirror — 1.0 x 2.2 x 0.66 (perception test)
- `observation_window` — round observation window
- `gong` (W) — bronze gong in frame — 1.6 x 1.8 x 0.71 (meditation / signal)
- `stone_lantern` (W) — Japanese stone lantern — 1.18 x 1.6 x 1.2 (meditation room, weak)
- `rug_round`, `rug_office` — round rugs (meditation mats stand-in)
- `beach_towel` (W) — flat striped towel — 1.79 x 0.05 x 1.8 (mat stand-in, weak)
- `sleeping_bag` (W) — 2.0 x 0.28 x 0.73 (sleep / dream study)
- `cot`, `hospital_bed` — beds for sleep / dream study
- `meshy_voodoo_doll` — voodoo doll (psychic influence test)
- `meshy_crystal_shard`, `meshy_crystal_shards` — crystals
- `pocket_watch`, `pocket_watch_hung` — pocket watch, hanging one (hypnosis)
- `candle`, `candleLine`, `candleRing` (SP), `lit_candle` (W) 0.31 x 0.3 x 0.24 — candles (occult test room)
- `hookah` (W) — brass hookah — 0.47 x 0.8 x 0.48 (mind-drug study, weak)
- `teapot`, `teacups` — teapot, stacked teacups (telekinesis objects)
- `juggling_pins` (W) 0.5 x 0.18 x 0.5, `balloons` (W) 1.05 x 1.8 x 0.95, `football` (SP), `dartboard` (W) 0.5 x 0.5 x 0.25 — test / target objects
- `ring_of_fire` (W) — standing ring of fire — 1.27 x 2.5 x 0.5 (obstacle / portal ring)
- `trapeze_rig` (W) — tall rig — 7.62 x 8.0 x 7.47 (training hall, weak)
- `tennis_net` (W) 12.0 x 3.6 x 3.63 (training hall divider, weak)
- `bleacher_stand` (W) — four-tier bleachers — 5.0 x 3.32 x 4.19 (viewing stand over a test floor)
- `height_board` (W) — height chart — 1.32 x 2.0 x 0.74 (subject intake)
- `time_machine` — retro time machine
- `card_soldier` (W) — playing-card soldier statue — 0.81 x 1.9 x 0.81 (Looking Glass project oddity)
- `fist` (SP) — a closed fist (odd object)

## 7. Office + living + VIP bunker
Office:
- `round_desk`, `desk_wedge_a`, `desk_wedge_b`, `reception_wedge` — round office desk, its wedges, reception wedge
- `round_cubicle` — round cubicle
- `conference_table` — long black oval table
- `coffee_table` — round office coffee table
- `exec_chair` / `office_chair`, `teal_chair`, `folding_chair`, `molded_chair`, `cafeteria_chair`
- `meshy_filing_cabinet`, `round_cabinet` — filing cabinets
- `library_shelf_full`, `meshy_library_shelf` — book shelves (archive)
- `nameplate`, `stapler`, `meshy_office_pen`, `meshy_no_2_pencil`, `desk_fan`, `coffee_mug`, `solo_cup`
- `meshy_office_desk_lamp`, `meshy_lamp`, `globe_lamp`
- `office_plant`, `potted_plant`, `palm_tree` — indoor plants
- `picture_round_a/b/c` — round empty picture frames
- `hook_rail`, `hook_rail_long` — coat hook rails
- `meshy_trash_bin`, `mall_bin`, `meshy_city_bin`
- `meshy_key`, `meshy_house_key`, `car_key` — keys (pickups)
- `lectern` / `church_podium` — podium (briefing room)

Canteen / break room:
- `meshy_round_vending_machine`, `meshy_water_cooler`, `meshy_coffee_maker`, `meshy_beige_1980s_microwave`, `mini_fridge`, `round_fridge`, `meal_tray`, `meal_tray_empty`, `meshy_beige_1980s_cash_regi`
- `food_trolley` (W) 1.2 x 1.28 x 0.65; `drinking_fountain` (W) 0.64 x 1.0 x 0.67; `picnic_table` (W) 2.0 x 0.95 x 1.83 (weak); `trestle_table` (W) 3.5 x 1.22 x 2.57 (weak, rough wood); `kettle` (W) 0.31 x 0.3 x 0.24
- `hot_dog_stand` — hot dog stand (weak joke fit)

Living / VIP bunker:
- `curved_couch`, `curved_office_couch` — curved couches
- `meshy_couples_bed` — double bed (VIP suite)
- `royal_bed` — royal bed (the top VIP)
- `meshy_dorm_bed`, `cot`, `chain_bunk` (W) — staff beds
- `pool_table` (W) — billiards table — 2.6 x 0.82 x 1.51
- `beer_taps` (W) — bar tap tower — 1.0 x 1.14 x 0.67
- `hot_tub` (W) — square hot tub — 2.2 x 0.86 x 2.2
- `diving_board` (W) 3.0 x 2.22 x 0.99, `pool_ladder` (W) 0.8 x 1.5 x 0.65 — bunker pool
- `dartboard` (W) — 0.5 x 0.5 x 0.25
- `fur_rug` (W) — bear skin rug — 2.2 x 0.04 x 1.96
- `floor_runner` (W) — red carpet runner — 3.0 x 0.02 x 1.04
- `rug_round`, `rug_office`
- `antler_trophy` (W) — mounted elk head — 0.6 x 1.0 x 0.61
- `gclock` — grandfather clock
- `golden_idol` (W) — small gold idol on pedestal — 0.24 x 0.4 x 0.24 (vault treasure)
- `vault`, `leaf_vault` — bank vault, vault door
- `sea_chest` — treasure chest (vault, weak)
- `royal_throne` — throne (weak, joke fit)
- `convertible_car` (W) — VIP car — 4.8 x 1.47 x 1.87
- `meshy_trumpet`, `lyre` (W) — instruments (weak)

Janitor / service:
- `meshy_mop`, `mop_bucket`, `wet_floor_sign`, `meshy_sink`, `meshy_fire_extinguisher`, `meshy_dumpster`, `beach_shower` (W) 1.31 x 2.4 x 1.31 (decontamination shower stand-in)

## 8. Lights + signs
- `fluorescent` — fluorescent ceiling fixture (the base light of the zone)
- `cage_lamp` (W) — bulkhead cage lamp — 0.29 x 0.3 x 0.12
- `strobe_lamp` (W) — red rotating beacon on bracket — 0.13 x 0.3 x 0.27 (alarm)
- `tunnel_signal` (W) — subway signal light — 0.59 x 2.5 x 0.67
- `signal_gantry` (W) — 6.0 x 4.93 x 1.32
- `globe_lamp` — standing globe lamp
- `meshy_lamp`, `meshy_office_desk_lamp` — lamps
- `meshy_hanging_lantern` — hanging lantern (old tunnel, weak)
- `string_lights` (W) — bulbs on a line between posts — 4.0 x 2.41 x 0.29 (work-site lights, weak)
- `exit_sign` — an exit sign
- `wet_floor_sign` — yellow wet floor sign
- `fire_danger_sign` (W) — dial sign pointing HIGH — 1.69 x 2.2 x 0.26 (re-read as a threat-level dial)
- `wanted_poster` (W) — 0.47 x 0.6 x 0.06 (weak, old-west look)
- `circus_posters` (W) — board with three posters — 1.5 x 0.93 x 0.1 (weak)
- `signpost` — blank wooden signpost (weak)
- `traffic_cone`, `traffic_barrel`, `yellow_pole`, `safety_netting` (W) — floor marking / hazard

## 9. Oddities (things a secret base would keep)
- `meshy_black_blob` — a black blob (containment specimen)
- `tentacle`, `tentacle2` — kraken tentacles (specimen in a tank / breaking through a floor)
- `meshy_giant_foot` — a giant foot (specimen)
- `astronaut` — dead astronaut
- `saucer_big` / `saucer_lg`, `ufo`, `spaceship`, `escapepod`, `hullplate` — recovered craft and debris
- `time_machine` — retro time machine
- `sarcophagus` — stone sarcophagus (recovered artefact; opened on a lab floor)
- `canopic_jars` (W) 0.54 x 0.45 x 0.49, `golden_idol` (W) 0.24 x 0.4 x 0.24, `cat_statue` (W) 0.38 x 1.0 x 0.68, `jackal_statue` (W) 0.62 x 1.5 x 1.76, `pharaoh_statue` (W) 1.12 x 4.0 x 1.11, `casing_block` (W) 1.32 x 1.05 x 1.5 — Egyptian finds in crates
- `obelisk`, `menhir` / `cave_stone`, `sarsen`, `trilithon` — standing stones / obelisk under study (artefact hall)
- `hooded_statue` (W) — faceless hooded figure — 0.76 x 2.2 x 0.68
- `weeping_angel` (W) — weeping stone angel — 1.09 x 2.0 x 1.3 (contained statue)
- `angel_statue`, `demon_statue` — statues (contained objects)
- `carved_totem_pole` (W) — 3.48 x 4.5 x 0.55 (artefact)
- `skull`, `femur`, `ulna` (SP), `skull_pile`, `cattle_skull` (W) 0.7 x 0.46 x 0.2 — bones (specimen room)
- `shark` — a shark (specimen tank)
- `dodo` (W) — a dodo — 0.37 x 0.75 x 0.71 (cloned extinct animal)
- `penguin` (W) — 0.41 x 0.9 x 0.48 (Antarctica project)
- `meshy_frog`, `rat` (W), `caterpillar`, `spider` (W), `scorpion` (W), `cobra` (W) — test animals
- `ice_block` (W) — 3.18 x 2.5 x 3.08 (frozen find)
- `meshy_crystal_shard(s)` — crystals
- `fae_mushroom` / `mushroom`, `fae_toadstool` / `mushroom2` / `woods_glowcap` — mushrooms (bio lab growth, glowcaps)
- `card_soldier` (W) — 0.81 x 1.9 x 0.81
- `spell_unicorn_horn` — a unicorn horn (sample)
- `meshy_voodoo_doll`, `crystalBall`, tarot cards, `cauldron`
- `white_cloud` — a white cloud (weather-control experiment)
- `sleigh` (SP) — gold-red sleigh (impounded craft joke)
- `sword` (SP) — master sword (impounded relic)
- `lunar_lander`, `camera_dolly` (W), `clapperboard` (W) — the faked moon-landing stage set
- `door_gun`, `meshy_retro_gun_that_shoo`, `plasma` — strange weapons on a test bench

---

## Families that do NOT fit
Church / Vatican pieces (pews, church walls and buildings, confessional, stained glass, pearly gate, crosses, bible, holy carpet, brazier), farm + blacksmith + hay + corn, almost all plants and trees (only the potted office plants fit), wild animals and birds beyond a few test subjects, sea and boats (rowboat, trawler, tugboat, wreck, anchor, wheel, raft, canoe, dock), snow sport gear, circus rides (ferris wheel, cotton candy), Greek pieces (chariot, god statue, couch, wreath), city street furniture and storefronts, camping (lean-to, outhouse, prayer flags, cairn), western (gallows, telegraph pole), the forest set (stumps, logs, snags, fern).

Rows read: **546** (300 + 246), every line from 1332 to 1888; plus all of WISHLIST_MODELS_ADDED.md.


---

# FITS THE D.U.M.B. — part 3 (MODEL_LIST.md lines 1888-3325, rest of section 6)

Read: MODEL_LIST.md lines 1888 to 3325, every row (about 90 pack tables, **1,016 table rows**: 852 in lines 1888-2967, 164 in lines 2968-3325), and `docs/disaster-city/pack-claims.md` in full.
Each entry: `catalogue key` — what it is (pack). **[CITY]** = pack-claims.md says Disaster City already uses it a lot / it is a shared city piece.

Notes on the source before the list:
- The **Stairs pack table (HQ_STAIR_PACK) is EMPTY in MODEL_LIST.md** (heading + column header at lines 3320-3323, no rows). Stair flights, railings and escalators are not listed as keys in this part; look in data.js `HQ_STAIR_PACK` itself.
- The 81 "Meshy decor" names (lines 3191-3278) are **decor keys worn by proc builders** (`_hqDecorWear(name, U, g)`), not plain catalogue props; the 12 "Pack pieces the procs wear" likewise. I mark them (decor) / (proc wear).
- The 12 Meshy fallback cars are not drawn (the GGBot car pack draws in their place).

## What pack-claims.md says the city already uses heavily
- **Industrial pack `ind_*`** (`ind_container`, `ind_skip`, `ind_skip_full`, `ind_silo`, `ind_vent`, `ind_panel`, `ind_factory_red/tan/blue`): cut by the Industrial district, "free for every district", all over the city. Free to use, but it will read as "the city's industrial look".
- **Metro PSX pieces** (`base: 'metro'`): Hero Plaza's Transit court (P06-06).
- **`bus_shelter`**: Southside bus stop court.
- **`city_*` whole buildings** and `pack_bld_00..09` shop blocks: one district each (pizzeria + gas station = a shared chain). None fit the base anyway.
- **`play_*` playground**: shared.
- **The Meshy second-interior-pass props** (Entertainment's 27 are listed by name; University, Civic, Financial, Industrial, Sports, Southside, Bayside, Hero Plaza batches follow the same rule): "a catalogue prop free for EVERY district once it is live". So every Meshy interior key below already stands in some city interior; none is exclusive, none is forbidden. Rule there: before making a new Meshy piece, check the list and reuse.
- The gold rule: never load `terrain/gold*.png` by name; the key `gold` is the right sheet.

---

## 1. Structure pieces (doors, vents, pipes, ladders, stairs, railings, cages, lifts, industrial)
- `ind_vent` — big industrial vent unit (Industrial pack, domi236) **[CITY]**
- `ind_panel` — industrial wall / electrical panel (Industrial pack) **[CITY]**
- `ind_silo` — tall tank / silo (Industrial pack) **[CITY]**
- `ind_container` — shipping container, stackable (Industrial pack) **[CITY]**
- `ind_skip`, `ind_skip_full` — waste skip, empty / full (Industrial pack) **[CITY]**
- `maintenance_stairs` — rolling steel maintenance stairs (Meshy, Industrial interiors) [city interiors]
- `chain_hoist` — overhead chain hoist (Meshy, Industrial interiors)
- `gate_valve` — big pipe gate valve (Meshy, Industrial interiors)
- `centrifugal_pump` — pump on a skid (Meshy, Industrial interiors)
- `air_compressor` — workshop air compressor (Meshy, Industrial interiors)
- `gas_cylinder_rack` — rack of gas bottles (Meshy, Industrial interiors)
- `cable_drum` — big cable reel (Meshy, Industrial interiors)
- `steam_turbine` — power-plant turbine (Meshy, Industrial interiors) — reactor / power hall
- `gauge_board` — board of pressure gauges (Meshy, Industrial interiors)
- `generator` — portable generator (Houses on the water, Elbolilloduro)
- `utility_box` — wall utility / junction box (CC0 'clip ready' prop)
- `boiler` — boiler (Meshy decor, proc wear)
- `conveyor` — conveyor belt (Meshy decor)
- `sea_vent` — vent stack (Meshy decor; undersea, could read as a floor vent)
- `door_furnace` — furnace door (Meshy decor)
- `ebd_tacos_roller_shutter` / `roller_shutter` — steel roller shutter (Tacos, Elbolilloduro; proc wear) — bay doors, armoury hatch
- `ebd_metro_concrete_pillar` / `concrete_pillar` / `metro_column` — concrete pillar (Metro PSX) — tunnel + parking columns **[CITY: metro]**
- `metro_stairs`, `metro_stair_rail` — concrete stair flight + railing (Metro PSX) **[CITY: metro]**
- `psxg_railing`, `psxg_railing_corner` — iron railing run + corner (PSX Halloween Graveyard) — catwalk edge if the look fits
- `hw_fence_iron`, `hw_fence_iron_2`, `hw_fence_iron_3`, `hw_gate_leaf`, `hw_gate_leaf_2` — iron fence + gate leaves (Halloween pack) — cage walls, holding pens
- `psxg_iron_gate_1`, `psxg_iron_gate_2` — iron gates (PSX Graveyard) — cell gates
- `hw_kerb`, `hw_pier` — concrete kerb / concrete pier block (Halloween pack) — parking kerbs, bollard blocks
- `hw_bricks`, `hw_bricks_2` — loose brick piles (Halloween pack) — construction corner
- `ladder_wall_rack` — ladders on a wall rack (Meshy, Civic interiors)
- `library_ladder` — rolling ladder (Meshy, University) — archive stacks
- Door leaves (mondo's upload, 10): `leaf_entrance` (plain entrance door), `leaf_window_large` + `leaf_lobby_glass_double` (door with large window: observation doors), `leaf_window_medium` (door, medium window: lab door), `leaf_white_wood` (white door: white rooms), `leaf_birch_glass`, `leaf_orange_glass` (glass-middle doors: offices), `leaf_beige_wood`, `leaf_coffee`, `leaf_wooden` (wood doors: VIP bunker, offices)
- `car_lift` — two-post vehicle lift (Meshy, Southside) — motor pool
- `engine_hoist` — engine crane (Meshy, Southside)
- `platform_scale` — floor platform scale (Meshy, Industrial)
- `power_pole` — power pole (Tacos, Elbolilloduro) — only for a surface entrance
- Roads pack ramps: `roads_b_ramp_024..035`, `roads_d_bend_ramp_048..059` — road ramps, straight + bent (Roads, Elbolilloduro) — parking-level ramps; `roads_f_bridge_000..018` — bridge pieces — a gantry road over the collider hall

## 2. Labs + science + medical
- `fume_hood` — lab fume cupboard (Meshy, University)
- `lab_glassware` — bench of flasks + tubes (Meshy, University)
- `microscope` — lab microscope (Meshy, University)
- `specimen_shelf` — shelf of jars / specimens (Meshy, University)
- `anatomy_skeleton` — teaching skeleton on a stand (Meshy, University)
- `iv_stand` — IV drip stand (Meshy, University)
- `wheelchair` — hospital wheelchair (Meshy, University)
- `privacy_screen` — folding medical screen (Meshy, University)
- `therapy_chaise` — analyst's couch (Meshy, University) — psych evaluation room
- `meteorite_plinth` — meteorite on a plinth (Meshy, University) — recovered-object vault
- `brass_orrery` — brass planet model (Meshy, University) — odd science
- `dinosaur_skeleton` — mounted fossil skeleton (Meshy, University) — specimen hangar oddity
- `autopsy_table` — steel autopsy table (Meshy decor) — alien autopsy room
- `eeg_rack` — EEG machine rack (Meshy decor) — psychic lab core piece
- `robot_arm` — industrial robot arm (Meshy decor) — test chamber / assembly
- `grow_lamp` — grow light (Meshy decor) — bio lab
- `iso_tank` — sleeper casket / isolation tank (Molten SciFi, Moltenbolt)
- `meshy_molten_cryo_tube` — standing cryo tube (Molten SciFi, Moltenbolt)
- `item_scalpel` — scalpel (Meshy held props)
- `item_potion_flask` — flask (Meshy held props) — bench clutter
- `magnifier` — big magnifying glass (Meshy, Internet models)
- `ebd_dinerscene_steel_table` / `steel_table` — stainless steel table (DINER, Elbolilloduro) — lab bench
- `sink`, `sink_row` — sink / row of sinks (BurgerPiz, DINER) — scrub room, decon
- `shower_stall` — shower stall (House, Elbolilloduro) — decontamination showers
- `museum_vitrine` — glass display case (Meshy, Sports + Culture) — artefact containment
- `jewelry_case` — glass counter case (Meshy, Southside) — sample display
- `trophy_case` — glass cabinet (Meshy decor)
- `hw_body`, `hw_body_2`, `hw_part`..`hw_part_9` — bodies + body parts (Halloween pack) — mad scientist morgue (use sparingly)
- `ocean_octopus`, `ocean_squid`, `ocean_moon_jelly`, `ocean_bioluminescent_jelly`, `ocean_anglerfish` — sea creatures (Ocean pack) — specimens in a tank wall
- `ant_queen`, `chrysalis`, `hawk_moth`, `luna_moth` — insects (Insects pack) — specimen jars / bio lab (scaled up = experiment)
- `woods_gasplant`, `woods_thornvine` — odd plants (Meshy, the Garden) — xeno-botany lab

## 3. Computers + control + screens
- `radio_console` — desk radio console (Meshy, Financial) — comms room
- `field_radio` — military field radio (Meshy, Civic)
- `reel_to_reel` — tape recorder, reels (Meshy, Financial) — surveillance / mainframe room
- `microfiche_reader` — microfiche viewer (Meshy, Civic) — archive
- `stock_ticker` — ticker machine under glass (Meshy, Financial) — old telemetry printer
- `mixing_console` — big studio mixing desk (Meshy, Entertainment) — reads as a control desk **[CITY]**
- `signal_lever_frame` — railway signal lever frame (Meshy, Industrial) — tram control
- `toggle_switch` — giant toggle switch (Meshy, Internet models) — test chamber button / breaker
- `pd_lever` — floor lever (Meshy, plot dungeons)
- `holo_projector` — hologram projector (Meshy, Internet models) — war room table centre
- `cyber_dish` — small dish antenna (Meshy, Internet models)
- `wifi_router`, `dialup_modem` — network boxes (Meshy, Internet models)
- `cpu_fan`, `capacitor`, `ram_stick`, `coin_battery` — computer parts, oversized (Meshy, Internet models) — collider / server-hall dressing
- `vr_headset` — VR headset (Meshy, Internet models) — remote-viewing rig
- `tube_tv` — CRT television (Trailer Park, Elbolilloduro) — monitor wall
- `cursed_tv_set` — wood-cased TV on an AV cart (Meshy, reworked) — a character rig; only as an oddity
- `decor_av_cart` — AV cart (Meshy decor) — briefing room
- `film_projector` — film projector on pedestal (Meshy, Entertainment) — briefing theatre **[CITY]**
- `star_projector` — planetarium projector (Meshy decor) — observation dome / psychic room
- `departures_board` — split-flap board (Meshy decor) — tram station
- `directory_board`, `notice_board` — wall boards (Meshy decor)
- `scoreboard` — scoreboard (Meshy decor) — test-chamber counter
- `now_serving_sign`, `number_dispenser` — queue sign + ticket dispenser (Meshy, Civic) — intake / processing
- `map_table` — table with a map (Meshy, Financial) — war room
- `city_scale_model` — scale city model on a table (Meshy, Civic) — war room target model
- `evidence_board` — pinboard with string (Meshy, Financial) — intelligence room
- `mugshot_wall` — wall of mugshots (Meshy, Civic) — test-subject wall
- `security_camera` — wall security camera (CC0 'clip ready')
- `item_walkie_talkie`, `item_smartphone`, `item_binoculars` — small gear (Meshy held props)
- `rotary_phone`, `public_phone` — desk rotary phone / wall payphone (VHS Shop, Tacos) — the red phone
- `photocopier` — office copier (Meshy, Hero Plaza)
- `paper_shredder` — shredder (Meshy, Financial) — classified files
- `punch_clock` — time clock (Meshy decor) — staff entrance
- `laminator` — laminator (Meshy decor) — badge office
- `studio_camera`, `film_camera` — TV camera / film camera on tripod (Meshy) — observation rooms
- `pa_speaker` — floor PA speaker (Meshy, Entertainment) — tannoy

## 4. Military + security + traps
- `rifle_rack` — rack of rifles (Meshy, Civic) — armoury
- `riot_gear_rack` — riot shields + helmets (Meshy, Civic)
- `scba_rack` — breathing-apparatus rack (Meshy, Civic) — hazmat room
- `turnout_gear_rack` — protective suits on hooks (Meshy, Civic)
- `hose_rack` — fire hose rack (Meshy, Civic)
- `footlocker` — army footlocker (Meshy, Civic) — barracks
- `steel_toilet` — prison steel toilet (Meshy, Civic) — holding cells
- `metal_detector` — walk-through metal detector (Meshy, Sports + Culture) — checkpoints
- `ebd_metro_turnstile` / `turnstile` / `metro_gate` — turnstile / automatic gate (Metro PSX) — access control **[CITY: metro]**
- `item_police_barricade` — police barricade (Meshy ultimate props)
- `rope_stanchion` — rope barrier post (Meshy, University)
- `key_rack` — board of keys (Meshy, Financial) — guard room
- `floor_safe` — heavy floor safe (Meshy, Financial)
- `deposit_box_wall` — wall of deposit boxes (Meshy, Financial) — evidence / sample vault
- `locker` — steel locker (Mine, Elbolilloduro)
- `filing_cabinet` — filing cabinet (Laundry, Elbolilloduro) — classified archive
- `card_catalog` / `card_catalogue` — drawer cabinet (Meshy Civic / decor)
- `dojo_weapon_rack` — rack of training weapons (Meshy, Southside)
- `item_flare_gun`, `item_jetpack`, `item_grapple_gauntlet` — flare gun / jetpack / grapple (Meshy held props) — prototype bench
- `rocket_engine` — rocket engine on a stand (Meshy, Industrial) — skunkworks
- `flood_mast` — floodlight mast (Meshy decor) — perimeter / hangar
- Traps pack (mondo's upload): `trap_pressure_plate` (floor pressure plate: test-chamber button), `trap_trip_wire`, `trap_trip_wire_broken` (trip wire), `trap_hole`, `trap_hole_dart`, `trap_hole_spear` (wall holes, dart / spear), `trap_spike_pit` (spike pit), `trap_chain_straight`, `trap_chain_draped`, `wall_chains` (chains: restraint room, hoists), `trap_bear_base`, `trap_bear_jaw` (bear trap: odd)
- `bird_cage` — cage (Meshy, Financial) — specimen cage, small
- `stocks` — stocks (Meshy decor) — unlikely

## 5. Vehicles + hangar + tram / metro
- `aircraft_tug` — aircraft tow tractor (Meshy, Industrial) — hangar must-have
- `jet_engine_stand` — jet engine on a stand (Meshy, Industrial)
- `rocket_engine` — rocket engine (Meshy, Industrial)
- `forklift` — forklift (Meshy, Bayside)
- `pallet_jack`, `hand_truck` — pallet jack / sack truck (Meshy, Hero Plaza)
- `wrapped_pallet` — shrink-wrapped pallet (Meshy, Bayside) — "tarped" cargo
- `welding_cart` — welding cart (Meshy, Hero Plaza)
- `tool_chest` — rolling tool chest (Meshy, Southside)
- `tool_pegboard` — tool wall (Meshy, Industrial)
- `drill_press`, `metal_lathe` — machine tools (Meshy, Industrial) — skunkworks shop
- `tire_stack` — stack of tyres (Meshy, Southside)
- `luggage_cart` — baggage cart (Meshy, Bayside) — tram platform
- `cash_cart` — cage trolley (Meshy, Financial) — secure transport
- `laundry_cart` — canvas cart (Meshy decor)
- `shopping_cart` — trolley (Meshy, Internet models)
- `high_bay_lamp` — hangar high-bay light (Meshy, Industrial)
- `metro_car`, `metro_car_open` — subway car, closed / doors open (Metro PSX) — THE TRAM **[CITY: metro]**
- `metro_bench`, `metro_bin`, `metro_light`, `metro_map`, `metro_ticket_machine`, `metro_vending` — station furniture (Metro PSX) **[CITY: metro]**
- `metro_poster_1..8` — wall posters (Metro PSX) — check art before use **[CITY: metro]**
- `ticket_machine` — ticket machine (Meshy, Sports + Culture)
- `railway_lantern` — rail lantern (Meshy, Industrial)
- GGBot low-poly cars: `car_suv` (black SUVs: agency motor pool), `car_cadillac` (black sedan: VIP), `car_truck` / `car_pack_8` (van), `car_cop`, `car_pack_1..7`, `crashed_car`, `crashed_car_2` (wrecks: crash-test bay) — parking level **[CITY: traffic]**
- `transit_bus` — city bus (Bus stop, Elbolilloduro) — staff shuttle
- `bus_shelter`, `bus_stop_sign` — shelter + sign (Bus stop) **[CITY]**
- `popemobile` — the Popemobile (Meshy) — oddity only
- `submarine` — submarine (Meshy decor) — a sub pen, if the base has water
- `skiff`, `fishing_boat` — small boats (Meshy decor / Houses on the water) — unlikely
- `ride_on_mower` — ride-on mower (Meshy, Sports) — a utility cart stand-in, weak
- `ship_model` — model ship (Meshy, Industrial) — desk dressing
- Roads pack: `roads_a_straight_000..023`, `roads_c_bend_036..047`, `roads_e_junction_060..071` — road pieces (Roads, Elbolilloduro) — a drive-in tunnel / parking level

## 6. Psychic / test / training / odd
- `eeg_rack` — EEG rack (Meshy decor) — again, the key psychic piece
- `iso_tank` — isolation / sleeper casket (Molten SciFi) — sensory deprivation
- `egg_chair` — 1960s egg chair (Meshy decor) — remote-viewing seat
- `dream_eye` — big eye object (Meshy decor) — psychic focus
- `item_dowsing_rod` — dowsing rod (Meshy held props)
- `item_hagstone`, `item_talisman_pendant`, `item_ward_totem` — charms (Meshy held props) — confiscated-objects shelf
- `item_hand_mirror`, `item_magic_wand`, `item_censer` — odd objects (Meshy held props)
- `giant_hourglass` — huge hourglass (Meshy, Civic) — time experiment
- `astronomical_clock` — astronomical clock (Meshy, Civic)
- `chess_board`, `chess_set_game` — chess board / full set (Low Poly Chess Set) — psychic test table
- `music_box`, `music_box_dancer` — music box (Meshy decor) — conditioning room
- `rocking_chair` — rocking chair (Meshy decor) — eerie test room
- `school_desk` — school desk (Meshy decor) — psychic classroom
- `ebd_vhsshop_chalkboard` / `chalkboard` — chalkboard (VHS Shop) — equations wall
- `vr_headset`, `ring_light`, `stream_mic` — headset / ring light / mic (Meshy, Internet models) — interview + test rooms
- `studio_light`, `followspot` — lights on stands (Meshy, Entertainment) — interrogation light **[CITY]**
- `treadmill`, `exercise_bike` — treadmill / bike (Meshy) — super-soldier testing
- `squat_rack`, `weight_bench`, `dumbbell_rack`, `medicine_ball_rack` — gym gear (Meshy, Sports / Southside) — training hall
- `punching_bag`, `speed_bag`, `boxing_ring`, `boxing_gloves`, `wing_chun_dummy`, `tackling_sled` — combat training (Meshy, Southside / Sports)
- `line_marker` — line-marking cart (Meshy, Sports) — test-range lines
- `ball_cart` — cart of balls (Meshy, Sports) — test-chamber objects
- `trap_pressure_plate` — pressure plate (Traps pack) — chamber button
- `anthill`, `ant`, `ant_queen` — ants (Insects pack) — hive experiment
- `rabbit`, `crow`, `cat`, `dog`, `sheep (decor_sheep)`, `chicken` — test animals (animals uploads) — in cages
- `asteroid_a`, `asteroid_b` — asteroids (D.O.O.R. kit) — recovered rock in containment
- `item_flat_earth` — flat-earth disc (Meshy ultimate props) — conspiracy oddity
- `decor_tripod_machine` / `tripod_big` — tripod machine (Meshy decor) — captured war machine
- `saucer_pendant` — saucer-shaped pendant lamp (Meshy decor) — reads as a small UFO
- `sputnik_lamp` — sputnik lamp (Meshy decor)
- `lava_lamp_base/cap`, `lava_lamp_floor_base/cap` — lava lamps (Meshy decor) — 1960s psychic lounge

## 7. Office + living + VIP bunker
- `tanker_desk` — steel tanker desk (Meshy decor) — THE military office desk
- `exec_desk` — executive desk (Meshy decor) — commander / VIP
- `computer_chair_blue`, `computer_chair_grey` — office swivel chairs (D.O.O.R. kit)
- `gaming_chair` — racing-style chair (Meshy, Internet) — operator seat
- `tulip_chair`, `tulip_table` — 1960s tulip set (Meshy decor) — retro-future lounge
- `round_table` — round table (Meshy decor) — war room
- `space_divider` — room divider (Meshy decor)
- `chesterfield_sofa`, `wingback_chair` — leather sofa / armchair (Meshy, Financial) — VIP bunker
- `banker_lamp` — green desk lamp (Meshy, University)
- `desk_lamp`, `table_lamp` — lamps (House / Trailer Park)
- `marble_bust`, `stone_urn` — bust / urn (Meshy, Financial) — VIP bunker
- `painting_portrait`, `painting_landscape`, `painting_seascape` — framed paintings (Meshy, Sports + Culture) — VIP bunker, officer mess
- `crystal_chandelier`, `library_chandelier`, `candelabra` — chandeliers (Meshy) — VIP dining **[crystal: CITY]**
- `decor_piano` — piano (Meshy decor) — VIP lounge
- `jukebox`, `pinball_machine`, `arcade_cabinet`, `air_hockey_table` — rec room (Meshy, Entertainment) **[CITY]**
- `bar_stool`, `concierge_podium` — stool / podium (Meshy, Financial)
- `gallery_ottoman` — bench seat (Meshy, Sports) — waiting room
- `cinema_seat_row` — row of cinema seats (Meshy, Bayside) — briefing theatre
- `judges_bench`, `witness_stand` — bench / stand (Meshy, Civic) — tribunal room, weak
- `form_counter` — standing form counter (Meshy, Civic) — intake
- `brochure_rack`, `newspaper_rack`, `newspaper_bundles` — paper racks (Meshy)
- `mailbox_bank` — bank of mailboxes (Meshy, Hero Plaza) — staff mail room
- `vending_machine`, `metro_vending` — vending machines (Laundry / Metro)
- `water_cooler` — water cooler (Laundry, Elbolilloduro)
- `coffee_maker`, `microwave` — break-room appliances (psx 3, Elbolilloduro)
- `espresso_machine` — espresso machine (Meshy, University)
- `kitchen_range`, `range_hood`, `steam_table`, `stock_pots`, `deck_oven`, `pot_rack` — mess-hall kitchen (DINER / Meshy)
- `cash_register` — till (Pizzeria) — commissary
- `ebd_gasstation_metal_shelving` / `metal_shelving` — steel shelving (Gas station) — stores, supply bunker
- `ebd_house_wall_shelf` / `wall_shelf` — wall shelf (House)
- `beach_cooler` — cooler box (Beach Props) — sample cooler
- `toilet_stall`, `urinal`, `hand_dryer`, `ebd_house_toilet_paper` — washroom (Gas station / BurgerPiz / DINER / House)
- `ebd_house_washer` / `washer`, `ebd_abandonedhouse_dryer` / `dryer` — laundry (House / Abandoned House)
- `mop`, `ebd_house_broom` / `broom` — janitor closet (House)
- `fire_extinguisher` — fire extinguisher (6TWELVE, Elbolilloduro) — every corridor
- `wall_clock` — wall clock (Trailer Park) — control rooms, time-zone row
- `retro_radio` — retro radio (Trailer Park)
- `metal_trash_can`, `trash_bin`, `city_bin`, `metro_bin`, `garbage_bag`, `garbage_bags`, `dumpster` — bins (Elbolilloduro)
- `umbrella_stand` — stand (Meshy decor) — VIP entrance
- `hammock` — hammock (Houses on the water) — weak
- `camping_tent` — tent (Survival PSX) — field-ops staging / quarantine tent
- `trailer_home_1..6` — trailers (Trailer Park) — already Area 51 pieces; a site-office trailer in a hangar
- `item_drinking_cup`, `item_milk_and_cookies` — small table items (Meshy held props)

## 8. Lights + signs + road / parking markings
- `high_bay_lamp` — hangar high-bay lamp (Meshy, Industrial)
- `metro_light` — tunnel strip light (Metro PSX) **[CITY: metro]**
- `flood_mast` — floodlight mast (Meshy decor)
- `ebd_abandonedhouse_bare_bulb` / `bare_bulb` — bare hanging bulb (Abandoned House) — service corridors
- `studio_light`, `followspot`, `ring_light` — stand lights (Meshy)
- `ship_lantern`, `railway_lantern` — lanterns (Survival PSX / Meshy) — old tunnel sections
- `saucer_pendant`, `sputnik_lamp`, `mushroom_lamp` — pendant / odd lamps (Meshy decor)
- `roads_g_sign_000..014` — 15 road signs (Roads, Elbolilloduro) — parking + tram tunnel signs (look inside the files for which is which)
- `street_signal` — traffic signal (Pizzeria PSX) — tunnel stop light
- `bus_stop_sign` — pole sign (Bus stop)
- `metro_map` — framed network map (Metro PSX) — the tram map **[CITY: metro]**
- `departures_board`, `directory_board`, `notice_board`, `now_serving_sign` — boards (Meshy)
- `city_seal` — round wall seal (Meshy, Civic) — agency seal behind the commander's desk (check the art)
- `banner` — hanging banner (Meshy decor)
- `item_police_barricade`, `rope_stanchion` — barriers
- `xmas_road*` (12 keys: `xmas_road`, `_01.._03`, `xmas_road_v*`, `xmas_road_v2*`) — small road tiles (Christmas pack) — only if a plain road tile is needed; probably snowy
- Internet icons `icon_document`, `icon_folder`, `icon_bell`, `icon_pointer`, `icon_envelope`, `icon_picture`, `icon_speech_bubble` — flat extruded icons (built in code) — big wall pictograms in a test chamber (the "clean sign" look), `icon_heart` / `icon_like` less so

## 9. Oddities (one-offs for secret rooms)
- `trap_sarcophagus_box`, `trap_sarcophagus_lid` — sarcophagus (Traps pack) — recovered-artefact vault (Area 51 x pyramid)
- `trap_iron_maiden_body`, `_door_l`, `_door_r` — iron maiden (Traps pack) — black-site oddity
- `trap_coffin_wood`, `trap_coffin_lid`, `hw_coffin`, `hw_coffin_2`, `hw_coffin_lid`, `psxg_coffin` — coffins — body storage
- `obelisk`, `t_pillar`, `stone_altar`, `greek_column`, `greek_amphora` — ancient pieces (Meshy decor / Sports) — excavated-relic lab
- `tomb_plaque` — plaque (Meshy) — memorial wall
- `lady_justice`, `hero_statue_crossed`, `hero_statue_landing`, `owl_statue`, `lion_statue` — statues — VIP bunker / cult room (owl statue fits the secret-society note)
- `armour_stand`, `armour_plinth`, `decor_armour_stand_post` — armour display (Meshy decor) — prototype suit stand
- `missing_board` — missing-persons board (Meshy, Woods) — test-subject records
- `meat_hook` — meat hook (Meshy decor) — cold store
- `dinosaur_skeleton`, `ocean_whale`, `ocean_shark` — huge specimens — a hangar oddity
- `elephant`, `giraffe`, `lion`, `wolf`, `horse` — animals — only as test subjects / taxidermy
- `slot_machine`, `roulette_table`, `blackjack_table`, `money_wheel` — casino (Meshy) — VIP bunker vice room **[CITY]**
- `money_sacks`, `money_counter`, `atm` — money (Meshy, Financial) — black-budget vault
- `ballot_box` — ballot box (Meshy, Civic) — conspiracy gag
- `taiko_drum`, `instrument_harp`, `instrument_cello` — instruments — VIP lounge / sonic experiment
- `mirror_ball` — mirror ball (Meshy) — officer's club gag **[CITY]**
- `spell_one_angel_wing`, `spell_one_bat_wing`, `spell_one_dragon_wing`, `item_broken_halo` — wings / halo — specimen-vault trophies
- `item_wrench`, `xmas_hammer` — hand tools
- `hw_web`, `hw_web_2`, `hw_web_3` — spider webs (Halloween) — abandoned wing
- `hw_shovel` — shovel — dig site

---

## Does NOT fit (one line)
Retro Foliage + hand-painted flowers + fae flowers, Halloween farm / graveyard stones / pumpkins / scarecrows / trees, Ocean rocks / coral / seaweed / fish, the Christmas pack (food, gifts, santa, snowmen), surfboards + beach toys, wedding / bakery / costume pieces, carnival decor (carousel, ferris wheel, high striker, popcorn cart, ticket booth), castle pieces, Babel houses, stilt houses, `city_*` buildings + `ebd_buildings_bld_*` shop blocks + `ind_factory_*` fronts, playground, desert western props, woods cabin, lighthouse / windpump / fountain / lifeguard chair / pool lounger.

## Row count
1,016 table rows read (MODEL_LIST.md lines 1888-3325: 852 + 164; the Stairs pack table has no rows) + pack-claims.md, 81 lines, complete.


---

# THE D.U.M.B. — model fits, part 4 (MODEL_LIST.md lines 3325-4403, read end to end)

Read: §7a spell props, §7a-2 worn gear, §7b `_MISC_GLB`, §7c animals, §7d foliage, §7e, §7f, §8, §8b (A/B/D/E), §9, §10 (A/B/C/F/G/D/E), §11, §12, §12b.
"CAT" = also a DOOR_HQ.catalogue key (checked against §6 of the same file, lines 741-3324, by key or by file name). "NOT CAT" = only a spell / horizon / animal table model: needs a catalogue row before a room can place it.

## A. FITS THE D.U.M.B.

### A1. Aircraft, craft, vehicles, weapons (the hangar / skunkworks / Area 51 set)
| key in this section | table | file | catalogue? |
| --- | --- | --- | --- |
| `jet` (Meshy F-22 fighter jet) | §7a `_WPN_MODELS` | `Assets/fx/spell_props/Meshy_AI_f22_fighter_jett_0713025555_texture.glb` | CAT as **`fighter_jet`** (same file) |
| `ufo` (Meshy TRIANGLE UFO, black-triangle craft) | §7a + §7b `_MISC_GLB` | `…/meshy/Meshy_AI_Triangle_UFO_0727195842_texture.glb` | CAT `ufo` — closest thing to a stealth / black aircraft |
| `saucer_lg` (flying saucer WITH landing gear) | §7b; `_hzSaucer`, monument `saucer` | `…/Meshy_AI_flying_saucer_with_landing_gear_0912231529_texture.glb` | CAT `saucer_lg` + `saucer_big` (same file); proc `saucer_rig` wears it (§8, 1 use: saucer on a rig) |
| `UFO_Low_Poly` (FlexUnit, CC0, FBX) | §7f (sprites.js) | `Assets/world/props/meshy/UFO_Low_Poly.fbx` | NOT CAT (a unit/sprite model) |
| `spaceship` | §7b; `_hzModelCraft` | `…/Meshy_AI_spaceship_0727195825_texture.glb` | CAT `spaceship` (+ `spaceship_fly`) |
| `space_shuttle` | §7b | `…/Meshy_AI_space_shuttle_realis_1027103636_texture.glb` | CAT |
| `space_station` (ISS) | §7b | `…/Meshy_AI_international_space_s_1027103646_texture.glb` | CAT |
| `satellite` | §7b | `…/Meshy_AI_satellite_realistic_1027103629_texture.glb` | CAT |
| `escapepod` | §7b | `…/Meshy_AI_an_escape_pod_0912231249_texture.glb` | CAT |
| `nacelle` (engine nacelle) | §7b | `…/Meshy_AI_an_engine_nacelle_0912231313_texture.glb` | CAT — a loose engine on the hangar floor |
| `hullplate` (torn hull plate with wiring) | §7b | `…/Meshy_AI_a_torn_hull_plate_with_wiring_0912231409_texture.glb` | CAT — crash-retrieval wreckage |
| `dockring` (spaceship docking ring) | §7b | `…/Meshy_AI_a_spaceship_docking_ring_0912231400_texture.glb` | CAT — a ready-made RING (collider / portal frame) |
| `astronaut` (dead astronaut) | §7b | `…/Meshy_AI_dead_astronaut_0912231349_texture.glb` | CAT |
| `military_tank` | §7b | `…/Meshy_AI_a_military_tank_0922010101_texture.glb` | CAT |
| `missile` | §7a | `Assets/fx/spell_props/Meshy_AI_missle_0725070818_texture.glb` | CAT `missile` |
| `ejectionSeat` | §7a | `…/Meshy_AI_ejection_seat_1027232003_texture.glb` | CAT as `meshy_ejection_seat` |
| `sandbags` | §7a | `…/Meshy_AI_sandbags_1027232011_texture.glb` | CAT as `meshy_sandbags` |
| `landmine`, `grenade`, `dynamite`, `bullet`, `pistol`, `revolver`, `shotgun`, `sniper`, `plasma` (plasma gun) | §7a | `Assets/fx/spell_props/…` | `spell_landmine`, `spell_grenade` are CAT; check the others (`spell_*` rows) before use — armoury dressing |
| `policeBarricade` | §7a | `Assets/world/props/misc/police_barricade.glb` | CAT as `item_police_barricade` — checkpoint |
| `rover` monument = `mars_rover`; `moon` near setting = `lunar_lander` | §8b-E / §8b-B | Meshy | both CAT (`mars_rover`, `lunar_lander`, `lunar_lander_full`) — test-vehicle bay |
| `subway_cart`, `subway_front` | §7b | Meshy subway train cart / front | CAT — the only TRAM stand-in (§12 notes the Metro pack also has `subway_car`) |
| `ambulance`, `firetruck`, `cybercar`, `schoolbus`, `citybus` | §7b | Meshy / pack | parking-level vehicles (car pack is in §6) |
| `crane` (scaffold crane) | §7b; monument `babelcrane` | `…/Meshy_AI_a_scaffold_crane_0912231516_texture.glb` | CAT only as `babel_crane` — hangar gantry |
| `jetpack`, `walkie_talkie`, `binoculars`, `flair` (flare gun), `telescope` (spyglass) | §7a-2 worn gear | `Assets/world/props/misc/*.glb` | CAT as `item_jetpack`, `item_walkie_talkie`, `item_binoculars` (others: check `item_*`) |

Seen while checking §6 (outside my lines, for the planner): `helicopter`, `missile_cart`, `jet_engine_stand`, `rocket_engine`, `radar_antenna`, `dish_big`, `antenna_dish`, `metal_detector`, `rat`, `cage_lamp` are catalogue rows.

### A2. Machines, lab, medical, psychic
| key | table | catalogue? | use |
| --- | --- | --- | --- |
| `teslaCoil` | §7a | CAT `meshy_tesla_coil` | mad-science lab |
| `time_machine` (retro time machine) | §7b | CAT | experiment centrepiece |
| `retro_control_panel` | §7b | CAT (+ proc `retro_console` wears it, 7 uses) | war room / control rooms |
| `tripodMachine` (War-of-the-Worlds tripod) | §7a / 10B S04 | CAT `decor_tripod_machine`, `tripod_big` | captured alien machine |
| `floodMast` | §7a / D04 | CAT `flood_mast` | hangar / tunnel work lights |
| `vault` (bank vault door) | §7b; monument `blastdoor` (`_hzBlastDoor` wears it) | CAT `vault`, `leaf_vault` | THE blast door |
| `dish` (satellite dish) | §7b | CAT `dish`, `dish_big` | comms |
| `hospital_bed` | §7b | CAT | med bay / subject ward |
| `syringe`, `scalpel`, `potionFlask` | §7a | CAT `meshy_syringe`, `item_scalpel` | lab tables |
| `greytube` monument = `molten_cryo_tube.glb` (Molten Maps Cryo_Tube_ON, CC0) | §8b-E / §11 #15 | CAT `meshy_molten_cryo_tube` | specimen / Grey tubes |
| `iso_tank` = Molten sleeper casket (D09, 29 uses) | §10A / §11 #16 | CAT | sensory deprivation = psychic training |
| `eeg_rack` EEG trolley (D32) | §8 wears model | CAT | psychic lab |
| `autopsy_table` (D90) | §8 | CAT | alien autopsy |
| `robot_arm` yellow six-axis (D38) | §8 | CAT | assembly / test chamber |
| `conveyor`, `conveyor_z` (D48), `boiler` (D22), `door_furnace` incinerator (D76) | §8 | CAT | plant rooms |
| `steel_table`, `metal_shelving`, `tanker_desk`, `exec_desk`, `notice_board`, `punch_clock`, `laminator`, `chalkboard`, `card_catalogue`, `locker` (Mine pack), `filing_cabinet`, `water_cooler`, `vending_machine`, `coffee_maker`, `fire_extinguisher`, `rotary_phone`, `tube_tv` | §8 / §10F | CAT | offices, barracks, break room |
| `concrete_pillar` (Metro `Column`, hazard band + bay number), `roller_shutter` (steel garage doors), `turnstile`, `departures_board`, `directory_board` | §8 | CAT | parking level + tram station |
| `egg_chair`, `tulip_chair`, `tulip_table`, `saucer_pendant`, `sputnik_lamp`, `disc_cluster`, `space_divider`, `mushroom_lamp`, `lava_lamp` | §8 | CAT | 60s space-age VIP bunker / observation lounge |
| `star_projector` (planetarium) | §8 | CAT | briefing / remote-viewing room |
| `securitycam` monument = `security_camera` | §8b-E | CAT | everywhere |
| `crystalBall`, `tarot`, `tarot2`, `tarotDeck`, `dowsing_rod`, `hagstone`, `ward` totem, `voodooDoll`, `candleRing` | §7a / §7a-2 | `crystalBall` CAT; tarot = spell props only (check `spell_*`) | PSYCHIC research (tarot deck is the nearest thing to a Zener deck) |
| `crystalShard`, `crystalShards`, `blackBlob`, `asteroid`, `asteroid2` | §7a | check | specimens under glass (black goo, meteorite) |
| `eyeball` (OBJ), `dream_eye` | §7f / §8 | eyeball NOT CAT | remote-viewing oddity |
| `traffic_cone`, `traffic_barrel`, `yellow_pole` (bollard), `cinder_block`, `drain_grate`, `culvert`, `escalator`, `dumpster`, `city_trash_bin` | §7b | CAT | parking / tunnels |
| `earth`, `moon`, `jupiter`, `saturn`, `solar`, `star`, `alien` (= an alien PLANET, not a creature) | §7b | CAT | war-room globe / holo display |
| `flatEarth` | §7a | check `item_*` | a joke exhibit |

### A3. Lab animals
§7c `_ANIMALS` has NO rat, mouse or monkey. It has `rabbit`, `cat`, `dog`, `chicken`, `cow` (cattle mutilation), `crow`, bats (`bat_black/brown/grey`), insects (`ant*`, `anthill`, `bee*`, moths, butterflies), `lion`, `wolf`, `elephant`, `giraffe`, `horse*`, `eagle`. `rabbit`, `crow` are also CAT. A `rat` exists only as a catalogue prop (§6 wishlist). `frog` (§7a spell prop) and `sheep` (§7a, decor) exist. No monkey / chimp anywhere in these lines.

### A4. Aliens / robots
No alien CREATURE prop and no robot prop in these tables (`alien` = planet; `33_grey-alien-head` in §9 is a creator fitting; `robot_arm` is the only robot). The Greys are units, not décor.

## B. §8 code-made stand-ins (textured code shapes) that fit a base
`warning_tape` (decal), `radiation_sign` (17 uses, still code), `keypad` (carries the sticky-note code), `evac_button`, `parking_bay` (floor paint), `garage_ramp`, `platform_edge`, `track_bed`, `station_sign`, `station_text`, `tube_map`, `server_rack` (21 uses; mondo prefers the code one), `monitor_stack` (nine LIVE CCTV screens), `world_clocks` (war room), `cell_bars` (holding cells), `wall_padding` (padded cell), `pod_bed`, `pod_window`, `porthole`, `false_window`, `shaft_window`, `sun_viewport` (lit windows = observation windows), `door_xray`, `door_seal`, `floor_panel`, `car_panel` (lift panel), `light_shaft`, `floor_stain`, `garbage_chute`, `street_drain`, `square_cubicle`, `clipboard`, `form_sheet`, `now_serving`, `lesson_plaque` / `lesson_sign` / `motto_plaque` / `wall_plaques` (text plaques for chamber numbers), `dream_screen` (lit screen), `star_chart`, `star_dome`, `floating_orb` (lit plinth + orb), `thoughtform`, `crystal_cluster`, `goo_tendril`, `ritual_circle`, `mobius_bar` / `impossible_stair` (psi test oddities), `ew_rubiks_cube` / `ew_cube_piece`, `riser_1-3`, `stair_step*`, `stair_landing*`, `serving_line` (mess hall), `planter`, `graffiti_wall`.
Horizon builders in code that fit (NOT room props; would need porting): `beamring` (`_hzBeamRing`, Box/Cylinder/Torus = a collider ring), `cargo`, `holoboard`, `holopyramid`, `jumbotron`, `exitsign`, `fluorescent`, `biodome`, `monolith`, `flag`, `_hzGirderKnot`, `_hzHullChunk`; near settings `dumb`, `area51`, `cern` are ALL code only (Box/Cylinder/Plane, cern adds Torus) — no model files behind them.

## C. Recorded as MISSING (not in the game)
§10E, **The D.U.M.B.** line, word for word: tram / people-mover car, situation board (curved wall screen), round war-room table, wine rack, home cinema seat, particle detector ring, beamline pipe on stands, EEG cap on a stand, Zener card deck, Faraday cage. "No pack piece found", not concepted, ask mondo first.
Also useful from other zones' missing lists: parking garage building, scaffolding, rooftop AC unit (pack HAS one: 6twelve `Air_conditioners` / Molten `Air_Con`), rail track section (pack HAS: mine pack `Rails`), signal gantry, maintenance trolley, cast-iron pump + valve wheel, manhole ladder (House / Playground `Ladder`), Flight 19 Avenger wreck (an aircraft, missing).
§10A still code: D12 `server_rack` (Meshy made, not used), D16 `radiation_sign` (no pack fits), D54 `pod_bed` (candidate Molten bunk beds), D53 `serving_line`.
NOT in these lines at all: stealth bomber / SR-71 / black aircraft, tarp or covered object, hangar, helicopter (it is in §6), rocket, reactor, radar (in §6), lab cage, monkey, alien body, test-chamber panels, observation window frame (only the code lit windows).

## D. §12b Pizza Doggy PSX Mega Pack (584 GLBs, ALL catalogue rows `psx_<file>` since 11-09; none placed in a room yet)
Licence: fine in the game; NO AI use (never feed to Meshy, not even a screenshot), never in the repo. Real metres (wall module 4 x 3 m, door 1 m).
| folder | n | fits the base |
| --- | --- | --- |
| `modular_structures` | 108 | the list itself names The D.U.M.B.: walls (plain / half / rounded corners / tunnel holes), doorways, loose doors, **windows (glass, frame only, no glass, metal bars)** = observation windows + cells, **elevators + elevator doorways**, floor-ceiling tiles, pillars, beams, **catwalk**, stairs, **tunnels (straight / elbow / tee / cross / inclined)**, pipe holders |
| `electronics_and_misc` | 43 | "the D.U.M.B. control rooms": PC + monitor + keyboards, TVs, **monitoring screen**, outlets, light switches, elevator buttons / screen / sign, vents, tablet |
| `large_props` | 36 | names The D.U.M.B.: metal barrels (4), wooden crates, **supply crates (full / empty)**, **pipes (straight / corner / cross / valve holder)**, cardboard boxes, vending machine |
| `items_and_weapons` | 146 | **keycards (access levels 1-4)**, ID cards, ammo boxes, pistol + mags + suppressors, batteries, pills, syringe, flashlight, walkie-talkie, floppy / cassette / CD |
| `small_props` | 60 | **keypads**, padlocks, jerrycans, car battery, clocks, notebook, concrete block |
| `lighting` | 36 | ceiling lamps `_on` / `_off` |
| `furniture` | 151 | beds, shelves, tables for barracks / VIP bunker |
| `decals` | 4 | cobwebs (abandoned wing) |
Skipped (not on the game bucket): 8 `*_fake_light_*` cards. Not swapped: the code `keypad`, `monitor_stack`, `cell_bars`, `false_window` stay code on purpose.

## E. What does not fit; count
Does not fit: all of §7d foliage (about 130 tree rows), chess pieces, church / Vatican / Camelot / carnival / pirate / sea props, insects and farm animals (except rabbit, cow, bats), §7e Halloween gore, §9 creator fittings, §10G gold spell pieces.
Read: 1,079 lines (3325-4403), about 610 table rows + the §8 lists (87 code procs, 91 model-wearing procs), 163 horizon rows, 89 §10A rows.


---

# PART 5 — R2 section 13, the asset manifest, texture sheets and decals, read for THE D.U.M.B.

Read end to end: MODEL_LIST.md lines 4403-4541 (section 13, all 3,529 paths, split one path a line), ASSET_MANIFEST.json (4,722 paths),
R2_MODEL_FILES.json (the real full bucket list of models, 6,112 paths: the manifest is NOT every bucket path, see below), and the live
catalogue through load-data.js. Scratch lists beside this file: `sec13_paths.txt`, `manifest_paths.txt`, `r2_paths.txt`, `cat_rows.txt`,
`fit_raw.txt` (503 fitting paths with their catalogue key), `unwired_world.txt`, `sheets.txt`.

## THE HEADLINE (read this first)

1. **Section 13 holds almost nothing new.** Its 3,529 files are: 2,065 `Assets/opt/*` optimised copies of models the tables already
   name; ~660 Meshy animation clips and old character exports; 550 MakeHuman hair / clothes; `.lod1/.lod2` and `.opt.glb` twins of
   catalogued props (the whole `props/meshy/wishlist` row, 246 files, is the `.opt.glb` twin of catalogued wishlist props);
   and source formats (.blend / .fbx / .dae / .obj). "The game does not load it" there means "this file name is not in a table",
   not "this model is unused".
2. **I checked every world / fx path on R2 against the catalogue and the code** (data.js, sprites.js, three-renderer.js, the district
   files). Only 61 are truly unreferenced, and NONE fits a base: 33 Retro Foliage trees, 7 retro trees, 13 car / wheel .blend
   sources, 2 horse sources, 4 trap collision meshes, 2 Halloween character FBX, a pizza box, one hollow-core door
   (`Assets/world/hq/models/Meshy_AI_cheap_hollow_core_door_0903105753_texture.glb`, a plain office door: the only usable one).
3. **So the answer to "what unwired model can we use" is: nothing. Everything that fits is already a catalogue row** (list A below
   gives the bucket path AND the catalogue key, and marks the rows the present D.U.M.B. district files do NOT use yet: that is the real stock).
4. **Aircraft / jet / stealth:** NO stealth aircraft, NO black jet, NO bomber, NO tarp-covered aircraft model on R2. What exists:
   one F-22 (`fighter_jet`, a SPELL prop, small Meshy model), one `helicopter` (wishlist), `space_shuttle`, `spaceship`, `ufo`
   (triangle UFO: the closest thing to a black-triangle craft), two saucers, `aircraft_tug`, `jet_engine_stand`, `rocket_engine`,
   `nacelle`, `meshy_ejection_seat`, `missile_cart`, `missile`, `military_tank`, `military_jeep`. The tarp saucer is CODE (`saucer_rig` proc).
5. **Modular sci-fi wall kit:** NONE on R2. The Molten Maps SciFi pack is on R2 as TWO files only (cryo tube, sleeper casket). The only
   modular kit is the PizzaDoggy PSX Mega Pack `modular_structures` (108 pieces: walls, rounded corners, doorways, pillars, beams,
   floor/ceiling slabs, round TUNNEL pieces straight / elbow / tee / cross / inclined, elevator, catwalk, barred windows): grimy PSX
   concrete, not white sci-fi. White chambers must be built from shell + texture sheets (list B), not from a kit.
6. **Ladder:** yes, four, all catalogued and none used in the D.U.M.B.: `manhole_ladder` (steel rungs, the one that fits),
   `wooden_ladder`, `pool_ladder`, `library_ladder`; plus `ladder_wall_rack` (fire ladders on a wall rack). No cage ladder, no ship ladder.
7. NOT on R2 at all (would have to be made or uploaded): server-room racks as a pack (only the one `server_rack` decor model),
   blast door (nearest: `leaf_vault`, `leaf_bulkhead`, `leaf_security`), observation window model (code: `false_window`, `porthole`,
   `pod_window`, `shaft_window`; Meshy `a_round_observation_window` exists in Assets/opt), collider ring / magnet segment, reactor,
   tram car other than the subway cars, bunk bed other than `chain_bunk` (a jail bunk on chains), air conditioner, hydroponics rack
   (`grow_lamp` only), tarp.

## D. COUNTS

| what | count |
|---|---|
| `DOOR_HQ.catalogue` rows | **2,229** (2,030 model-file rows, 191 `proc` code rows, 8 other) |
| catalogue rows by base | asset 850 · psxmp 584 · misc 189 · (hq models) 108 · halloween 66 · ocean 60 · xmas 51 · animals 36 · weapons 26 · metro 20 · traps 19 · instruments 15 · rt 4 · chess 2 |
| `DOOR_HQ.textures` keys | **8** (his painted hallway sheets only: terrazzo, stone, oxblood, teal, ceiling, concrete, drywall, carpet) |
| the real sheet stock | `CALM_TERRAIN.sheets` 276 at load (74 calm / nz + 100 horror `hz_*` + 102 zone twins `zl_*`) · `TERRAIN_SPRITES` ~200 base keys (sprites.js) · `URBAN_TEXTURES` ~1,050 (320 first set + 681 Urban Decay + 8 Metro + 48 liquids), worn as `urban:<Name>` |
| `DOOR_HQ.decals` keys | **10 rooms** (not kinds), 97 rows in all; kinds: puddle 34, grime 31, oil 13, scorch 11, blood 8. `site_prebuilt_dumb_base` already has 18 rows (grime 8, oil 3, scorch 3, puddle 3, blood 1) |
| section 13 files | 3,529 of 6,112 model files on R2 |
| ASSET_MANIFEST.json | 4,722 paths, v1, made 2026-11-20: only optimised copies + pack textures (2,335 .opt.glb, 2,022 .glb, 169 png, 151 jpg, 22 fbx, 20 lod) |

### R2 folder tree (R2_MODEL_FILES.json, model files only; manifest count in brackets)
```
Assets 6112 [4722]
  characters 1547 [1190]   animations 77 · creator 861 [1176: hair 151, mpfb 269, wear 755] · gear 11 · races 598
  fx/spell_props 37 [6]
  opt 2065 [2065]          flat folder, <hash>_<name>.opt.glb
  world 2463 [1461]
    animals 42 (bats 3, crow_and_rabbit 2, elephant 1, horses 4, insects 19)
    hq/models 141 [13]
    nature 149 [10] (Blends 45, FBX 45, OBJ 45, flora 1, retrotreepack 13)
    packs 1049 [814]
      afgameassets_retro_foliage 110 · blendervoyage_graveyard 24 · chess 1 · cursedlake_playground 3
      domi236_industrial 9 · elbolilloduro 196 (roads 13 inside) · elbolilloduro_christmas 6 · _halloween 5 · _metro_psx 3
      elegantcrow_beach 6 · handpainted_flowers 8 · instruments 14 · mcsteeg_castles 1 · ocean 55
      pizzadoggy_psx_mega_pack 584 [576: decals 4, electronics_and_misc 43, furniture 151, items_and_weapons 142, large_props 36, lighting 32, modular_structures 108, small_props 60]
      stairs 2 · traps 22
    props 1058 [621]  internet_icons 16 · meshy 921 (wishlist 246 models, internet 15) · meshy_decor 91 · misc 30
    vehicles 24 (Car 01-08, Shadow, Wheel: GGBot low-poly cars)
```
No folder on R2 is named sci-fi, lab, military, mine, molten or survival. "mine" and "survival" exist only as name stems inside
`packs/elbolilloduro` (`ebd_mine_locker`, `ebd_survival_campfire / _camping_tent / _lantern`); "industrial" is `packs/domi236_industrial` (9).

## A. R2 FILES THAT FIT, BY PACK (bucket path -> catalogue key)

All paths start `Assets/`. **[free]** = catalogued but no D.U.M.B. district file (`docs/areas/dumb/`) names it today. [used] = already placed there.
All of these are WIRED (a catalogue row exists); nothing below needs a new row.

### Aircraft, craft, military vehicles (FLAG)
| bucket path | key | what |
|---|---|---|
| `fx/spell_props/Meshy_AI_f22_fighter_jett_0713025555_texture.glb` | `fighter_jet` [free] | F-22 fighter, a spell prop (check its size / detail before parking it in a hangar) |
| `world/props/meshy/wishlist/helicopter.glb` | `helicopter` [free] | helicopter |
| `world/props/meshy/Meshy_AI_Triangle_UFO_0727195842_texture.glb` | `ufo` [free] | black-triangle UFO: best stand-in for a "black aircraft" |
| `world/props/meshy/Meshy_AI_flying_saucer_with_landing_gear_0912231529_texture.glb` | `saucer_big`, `saucer_lg` [free] | saucer on landing gear |
| `world/props/meshy/UFO_Low_Poly.fbx` | (sprites.js vehicle, the grey's saucer; no catalogue row) | low-poly saucer |
| `world/props/meshy/Meshy_AI_spaceship_0727195825_texture.glb` | `spaceship`, `spaceship_fly` [free] | spaceship |
| `world/props/meshy/Meshy_AI_space_shuttle_realis_1027103636_texture.glb` | `space_shuttle` [free] | space shuttle |
| `world/props/meshy/Meshy_AI_an_escape_pod_0912231249_texture.glb` | `escapepod` [free] | escape pod |
| `world/props/meshy/Meshy_AI_an_engine_nacelle_0912231313_texture.glb` | `nacelle` [free] | engine nacelle (hangar part) |
| `world/props/meshy/Meshy_AI_a_torn_hull_plate_with_wiring_0912231409_texture.glb` | `hullplate` [free] | torn hull plate (reverse-engineering bay) |
| `world/props/meshy/Meshy_AI_a_spaceship_docking_ring_0912231400_texture.glb` | `dockring` [free] | big ring: possible collider / portal ring segment |
| `world/props/meshy/Meshy_AI_ejection_seat_1027232003_texture.glb` | `meshy_ejection_seat` [free] | ejection seat |
| `world/props/meshy/jet_engine_stand.glb` | `jet_engine_stand` [free] | jet engine on a stand |
| `world/props/meshy/rocket_engine.glb` | `rocket_engine` [free] | rocket engine |
| `world/props/meshy/aircraft_tug.glb` | `aircraft_tug` [free] | hangar tow tug |
| `world/props/meshy/wishlist/missile_cart.glb` | `missile_cart` [free] | missile on a cart |
| `fx/spell_props/Meshy_AI_missle_0725070818_texture.glb` | `missile` [free] | missile (spell prop) |
| `world/props/meshy/Meshy_AI_a_military_tank_0922010101_texture.glb` | `military_tank` [free] | tank |
| `world/props/meshy/wishlist/military_jeep.glb` | `military_jeep` [free] | jeep |
| `world/props/meshy/Meshy_AI_a_black_SUV_0915195508_texture.glb` | `car_suv` [used] | black SUV (VIP / agents) |
| `world/props/meshy/Meshy_AI_a_truck_0917065131_texture.glb` | `car_truck` [free] | truck |
| `world/props/meshy/forklift.glb` | `forklift` [free] | forklift |
| `world/hq/models/Meshy_AI_lunar_lander_realis_0910054105_texture.glb` | `lunar_lander`, `lunar_lander_full` [free] | lunar lander |
| `world/hq/models/Meshy_AI_mars_rover_realistic_0910054045_texture.glb` | `mars_rover` [free] | rover |
| `world/props/meshy/Meshy_AI_satellite_realistic_1027103629_texture.glb`, `…international_space_s_1027103646…` | `satellite`, `space_station` [free] | satellite, ISS model (hang over a war-room table) |
| `world/props/misc/jetpack.glb` | `item_jetpack` [free] | jetpack |
| code | `saucer_rig` proc | the saucer under a tarp on its test rig with floodlights (Hangar 18) |

### Tram tunnel, rails, parking level
| bucket path | key | what |
|---|---|---|
| `world/packs/elbolilloduro_metro_psx/Models/Metro.glb` (one file, cut by node) | `metro_car`, `metro_car_open`, `metro_bench`, `metro_bin`, `metro_vending`, `metro_ticket_machine`, `metro_gate`, `metro_map`, `metro_poster_1-8`, `metro_light`, `metro_column`, `metro_stairs`, `metro_stair_rail` [some used] | the PSX metro: the tram car and a whole platform set |
| `world/props/meshy/Meshy_AI_a_subway_train_cart_0915195417_texture.glb`, `…subway_train_front_0915195457…` | `subway_cart` [used], `subway_front` [free] | subway car + its nose |
| `world/props/meshy/wishlist/rail_section.glb`, `buffer_stop.glb`, `tunnel_signal.glb`, `signal_gantry.glb`, `third_rail_shoe.glb`, `hand_car.glb`, `mine_cart.glb` | same names [all free] | rails, buffer stop, tunnel signal, signal gantry, hand car, mine cart |
| `world/props/meshy/signal_lever_frame.glb`, `railway_lantern.glb` | same [free] | lever frame, lantern |
| `world/packs/pizzadoggy_psx_mega_pack/modular_structures/tunnel_1.glb`, `tunnel_entrance_platform_1.glb`, `tunnel_mp_1_straight / _straight_inclined / _elbow / _tee / _cross_tee.glb`, `wall_1_tunnel_hole(_1,_2).glb` | `psx_tunnel_*`, `psx_wall_1_tunnel_hole*` [free] | round tunnel kit: service tunnels, vents, possibly the collider tube |
| `world/packs/elbolilloduro/ebd_metro_concrete_pillar.glb`, `ebd_metro_turnstile.glb` | same keys [free] | concrete pillar 4.85 m, turnstile |
| `world/props/meshy/wishlist/boom_gate.glb`, `chain_fence.glb`, `barbed_wire_fence.glb` | same [free] | boom gate, chain-link, barbed wire |
| code | `parking_bay`, `parked_car`, `garage_ramp`, `concrete_pillar`, `roller_shutter`, `track_bed`, `platform_edge`, `station_sign`, `station_text`, `departures_board`, `turnstile` procs | painted bay, ramp, track bed, yellow platform line, name board |

### Lab, medical, psychic research, test chambers
| bucket path | key | what |
|---|---|---|
| `world/props/meshy/molten_cryo_tube.glb` | `meshy_molten_cryo_tube` [free] | Molten Maps cryo tube (lit) |
| `world/props/meshy/molten_sleeper_casket.glb` | `iso_tank` [used] | Molten Maps sleeper casket (isolation tank) |
| `world/props/meshy/fume_hood.glb`, `lab_glassware.glb`, `microscope.glb`, `specimen_shelf.glb` | same [all free] | fume hood, glassware, microscope, specimen jars |
| `world/props/meshy/anatomy_skeleton.glb`, `iv_stand.glb`, `wheelchair.glb`, `privacy_screen.glb`, `therapy_chaise.glb` | same [first three used] | medical |
| `world/props/meshy/Meshy_AI_a_hospital_bed_0922010451_texture.glb` | `hospital_bed` [used] | hospital bed |
| `world/props/meshy/wishlist/stretcher.glb`, `hazmat_suit.glb`, `radiation_drum.glb`, `strobe_lamp.glb`, `cage_lamp.glb` | same [all free] | stretcher, hazmat suit on a stand, radiation drum, strobe, caged lamp |
| `world/props/meshy/Meshy_AI_tesla_coil_1027232038_texture.glb` | `meshy_tesla_coil` [used] | tesla coil |
| `world/props/meshy/Meshy_AI_a_retro_time_machine_0917064610_texture.glb` | `time_machine` [free] | retro time machine (mad-science centrepiece) |
| `world/props/meshy/Meshy_AI_black_blob_1027232032_texture.glb` | `meshy_black_blob` [free] | black blob (containment specimen) |
| `world/props/meshy/Meshy_AI_dead_astronaut_0912231349_texture.glb` | `astronaut` [free] | dead astronaut |
| `world/props/meshy/Meshy_AI_syringe_1027232304_texture.glb`, `world/props/misc/scalpel.glb` | `meshy_syringe` [used], `item_scalpel` [free] | small lab items |
| `world/props/meshy/meteorite_plinth.glb`, `museum_vitrine.glb`, `brass_orrery.glb` | same [free] | sample on a plinth, glass case, orrery |
| `world/props/meshy/internet/holo_projector.glb`, `cyber_dish.glb`, `vr_headset.glb` | same [free] | holo projector, dish, VR headset (psychic rig) |
| `world/props/meshy_decor/eeg_rack.glb`, `autopsy_table.glb`, `robot_arm.glb`, `star_projector.glb`, `tripod_machine.glb`, `grow_lamp.glb`, `conveyor.glb` | procs `eeg_rack`, `autopsy_table`, `robot_arm`, `star_projector`, `grow_lamp`, `conveyor`; `tripod_big` / `decor_tripod_machine` | EEG rack, autopsy table, robot arm, grow lamp (the ONLY hydroponics piece), conveyor |
| code | `wall_padding`, `dream_screen`, `door_xray`, `evac_button`, `warning_tape`, `radiation_sign`, `false_window`, `porthole`, `pod_window`, `pod_bed`, `floating_orb`, `cell_bars`, `goo_tendril`, `keypad`, `monitor_stack` procs | padded wall, sleepers' screen, X-ray light box, red button, floor stripe, trefoil plate, lit window panes, capsule bed, CRT wall |
| `Assets/opt/…Meshy_AI_a_round_observation_window_0903105519_texture.opt.glb` | (search the catalogue for its row before use) | a round observation window model exists |

### Command war room, comms, offices, VIP bunker
| bucket path | key | what |
|---|---|---|
| `world/props/meshy/map_table.glb`, `radio_console.glb`, `mixing_console.glb`, `evidence_board.glb`, `mugshot_wall.glb`, `stock_ticker.glb`, `city_scale_model.glb` | same [all free] | map table, radio console, big console, pin board, face wall, ticker, scale model |
| `world/props/meshy/field_radio.glb`, `reel_to_reel.glb`, `microfiche_reader.glb`, `photocopier.glb`, `paper_shredder.glb` | same [used] | comms / records |
| `world/props/meshy/Meshy_AI_a_retro_control_panel_0922010114_texture.glb` | `retro_control_panel` [used] | control panel |
| `world/props/meshy/gauge_board.glb` | `gauge_board` [used] | gauge wall |
| `world/hq/models/Meshy_AI_crt_terminal_0903101952_texture.glb` | `crt_terminal` [used] | CRT terminal |
| `world/packs/pizzadoggy_psx_mega_pack/electronics_and_misc/monitoring_screen_mp_1(_1).glb`, `pc_mp_1.glb`, `pc_monitor_mp_1.glb`, `pc_keyboard_mp_1-3.glb` | `psx_monitoring_screen_mp_1(_1)` [free], `psx_pc_*` | CCTV screens, PCs |
| `world/props/meshy_decor/server_rack.glb` | `server_rack` proc | the one server rack |
| `world/props/meshy/wishlist/radar_antenna.glb`, `antenna_dish.glb`, `lattice_pylon.glb`, `weather_mast.glb`, `windsock.glb` | same [free] | radar, dish, pylon, mast, windsock (surface / hangar apron) |
| `world/props/meshy/Meshy_AI_a_satellite_dish_0912231301_texture.glb` | `dish`, `dish_big` [free] | satellite dish |
| `world/hq/models/Meshy_AI_a_long_black_oval_conference_table_0903092858_texture.glb` | `conference_table` [used] | oval table |
| `world/props/meshy_decor/exec_desk.glb`, `tanker_desk.glb` | procs `exec_desk`, `tanker_desk` | desks |
| `world/props/meshy/chesterfield_sofa.glb`, `wingback_chair.glb`, `banker_lamp.glb`, `floor_safe.glb`, `deposit_box_wall.glb`, `Meshy_AI_a_bank_vault_0912231605_texture.glb` | same; `vault` [free] | VIP bunker lounge, safe, deposit wall, vault |
| `world/props/meshy/Meshy_AI_a_royal_bed_0922010438_texture.glb`, `…a_couples_bed…`, `…a_dorm_bed…` | `meshy_dorm_bed` etc. | beds |

### Barracks, armoury, stores, gym
| bucket path | key | what |
|---|---|---|
| `world/props/meshy/wishlist/chain_bunk.glb` | `chain_bunk` [free] | the only bunk (a chained jail bunk) |
| `world/hq/models/Meshy_AI_a_cot_0903105358_texture.glb` | `cot` [used] | cot |
| `world/props/meshy/footlocker.glb`, `rifle_rack.glb`, `riot_gear_rack.glb`, `scba_rack.glb`, `gas_cylinder_rack.glb`, `steel_toilet.glb` | same [used] | barracks / armoury |
| `world/packs/elbolilloduro/ebd_mine_locker.glb` | `locker` [used] | steel locker |
| `world/packs/pizzadoggy_psx_mega_pack/large_props/supply_crate_1*.glb` (10), `metal_barrel_mp_0-3.glb`, `wooden_crate_1-6.glb` | `psx_supply_crate_*`, `psx_metal_barrel_mp_*`, `psx_wooden_crate_*` | crates and drums |
| `…/items_and_weapons/ammo_box_*.glb` (12), `keycard_1*.glb` (8, four authorization levels), `dosimeter_1/2/4.glb`, `flashlight_*`, `walkie_talkie_1/2`, `jerrycan_1`, `car_battery_1`, `battery_mp_*`, `canned_food_mp_*`, `bandage_mp_*`, `pills_*`, `gold_bar_pcs_1` | `psx_*` | small dressing: ammo, KEYCARDS, DOSIMETERS, rations, gold bars for the VIP vault |
| `world/props/meshy/wrapped_pallet.glb`, `pallet_jack.glb`, `hand_truck.glb`, `cable_drum.glb`, `platform_scale.glb` | same [used] | stores |
| `world/props/meshy/Meshy_AI_sandbags_1027232011_texture.glb`, `world/props/misc/police_barricade.glb` | `meshy_sandbags`, `item_police_barricade` [used] | checkpoints |
| `world/props/meshy/squat_rack.glb`, `weight_bench.glb`, `dumbbell_rack.glb`, `treadmill.glb`, `punching_bag.glb`, `rowing_machine.glb`, `exercise_bike.glb` | same [mostly free] | gym |
| `world/props/meshy/steam_table.glb`, `wishlist/steel_bench.glb`, `world/packs/elbolilloduro/ebd_dinerscene_steel_table.glb`, `ebd_diner_sink_row.glb`, `ebd_house_shower_stall.glb` | same / `sink_row`, `shower_stall` | mess hall, wash room |

### Plant, workshop, structure
| bucket path | key | what |
|---|---|---|
| `world/props/meshy/steam_turbine.glb`, `centrifugal_pump.glb`, `air_compressor.glb`, `gate_valve.glb`, `chain_hoist.glb`, `engine_hoist.glb`, `high_bay_lamp.glb` | same [ALL free] | turbine (the nearest thing to a reactor), pump, compressor, valve, hoists, hangar lamp |
| `world/props/meshy/metal_lathe.glb`, `drill_press.glb`, `welding_cart.glb`, `tool_chest.glb`, `tool_pegboard.glb`, `car_lift.glb` | same [mostly free] | skunkworks workshop |
| `world/props/meshy/maintenance_stairs.glb` | `maintenance_stairs` [used] | rolling aircraft stairs |
| `world/props/meshy/wishlist/manhole_ladder.glb` | `manhole_ladder` [free] | THE steel ladder |
| `world/props/meshy/wishlist/valve_wheel.glb`, `waste_pipe.glb`, `safety_netting.glb` | same [free] | valve wheel, outfall pipe, netting |
| `world/packs/stairs/stairs.glb` | (data.js stair kit `grate`, no catalogue row) | one steel-GRATING flight with handrails (ATD-London, CC-BY: credit needed) |
| `world/packs/stairs/stairs_railings.glb` | (stair kit `pack`) | a sheet of stair + balustrade families |
| `world/packs/pizzadoggy_psx_mega_pack/modular_structures/catwalk_1.glb` | `psx_catwalk_1` [free] | the only catwalk |
| `…/modular_structures/`: `wall_1*`, `wall_2_*`, `wall_1_rounded_corner*`, `doorway_*`, `side_doorway_*`, `double_single_doorway_*`, `pillar_1-3`, `beam_1/2/4/5`, `floor_ceiling_1-3`, `elevator_1/2`, `elevator_doorway_1-3`, `bars_metal_1/2`, `window_metal_bars_*`, `stairs_3/4/5_concrete/mp_1`, `pipes_holder_1`, `pipe_valve_holder_large_2*` | `psx_*` [free] | the PSX modular kit (grimy concrete) |
| `…/large_props/pipe_1.glb`, `pipe_1_corner`, `pipe_1_cross`, `pipe_1_short`, `pipe_valve_holder_large_1` | `psx_pipe_*` [free] | pipe runs |
| `…/electronics_and_misc/vent_1-3`, `vent_mp_1(_1)`, `elevator_buttons_1`, `elevator_call_button_1`, `elevator_screen_1`, `elevator_sign_1`; `small_props/keypad_1/2` | `vent_grille` [used], `psx_vent_*`, `psx_elevator_*`, `psx_keypad_*` | vents, lift fittings, keypads |
| `…/lighting/ceiling_lamp_*_on/_off.glb` (20), `lamp_*` (12) | `psx_ceiling_lamp_*` | ceiling lamps, lit and dark twins |
| `world/packs/domi236_industrial/ind_container.glb`, `ind_panel`, `ind_silo`, `ind_vent`, `ind_skip(_full)`, `ind_factory_red/tan/blue` | same; `ind_vent` [used] | container, panel, silo, big vent |
| `world/hq/models/`: `…a_breaker_panel…`, `utility_box_01_cc0_clip_ready_v1.glb`, `…office_pipe_run…`, `…a_fluorescent_fixture…`, `…vent…`, `…an_exit_sign…`, `…a_fire_extinguisher…`, `…one_meter_of_railing…` | `breaker_panel`, `utility_box`, `pipe_run`, `fluorescent`, `meshy_vent`, `exit_sign`, `meshy_fire_extinguisher` | services |
| `world/hq/models/` door leaves: `…a_bank_vault_door…`, `…security_door…`, `…submarine_bulkhead…`, `…futuristic_door…`, `…holographic_door…`, `…cell_door_with_a_slot…`, `…hospital_room_door_wi…`, `…institutional_wired_double_door…`, `…frosted_executive_glass_door…` | `leaf_vault`, `leaf_security`, `leaf_bulkhead` [free], `leaf_futuristic` [free], `leaf_holographic` [free], `leaf_cell`, `leaf_hospital` | door leaves: vault and bulkhead are the blast-door stand-ins; futuristic + holographic for the white chambers |
| `world/packs/elbolilloduro/ebd_housesonwater_generator.glb` | `generator` [free] | generator |
| `world/props/meshy_decor/boiler.glb`, `flood_mast.glb`, `t_pillar.glb` | procs `boiler`, `flood_mast`, `t_pillar` | boiler, floodlight mast, T pillar |

## B. TEXTURE SHEETS THAT FIT

How a sheet is worn: a room `shell` has slots `floor / apron` (ground) and `wall / dado / trim / ceiling / skirt` (wall); terrain has
`floor / path` and `cliff`. A value is a calm key, a TERRAIN_SPRITES key, `urban:<Name>`, or `hz_<family>_<nn>` (horror sheet).
**WARNING for a clean white redesign:** `ZONE_LOOKS.zones.dumb` re-skins the room at load: `rocks_5 -> hz:Stone_02`,
`urban:MetalCorrugatedPainted2a -> hz:Metal_06`, `metal -> hz:Metal_09`, `gunmetal -> hz:Metal_02`, `urban:PlasterWallPainted1a -> hz:Wall_09`,
plus stains (blood 0.07, dirt 0.3, drip 0.6, grime 0.35). White chambers must use keys that map does not name (or the zone row must change).
Today's shell: floor `urban:RubberNonSlip1a`, wall `urban:ConcreteStriped1c`, dado `urban:MetalCorrugatedPainted3a`, trim gunmetal, ceiling `urban:FibreCeilingTile2a`.

### Floor (ground role)
- White / clean: `calm_tiles` (White tiles), `calm_tiles_small`, `tilefloor`, `tilefloor_2`, `urban:TileGeneric1a…6c` (18), `urban:TileLinoleum1a…2c` (6), `urban:TileHexagons*` (7), `urban:TileMarble*` (12), `urban:MetroWhiteTile` (big white squares), `urban:MetroTiles` (dark grey squares), `urban:MetroFloor` (dark terrazzo), `terrazzo` (his painted sheet), `calm_checker`, `checkerboard*`, `training_floor`, `holo`, `holo_red` (holo grid floors).
- Rubber: `calm_rubber`, `rubber`, `rubber_2`, `urban:RubberNonSlip1a…5c` (15).
- Concrete: `calm_concrete`, `concrete_floor`, `concrete` (his), `urban:ConcreteSlab*` (6), `urban:ConcretePanels*` (12), `urban:ConcretePrecast*` (8), `urban:ConcreteGeneric*` (9), `urban:ConcreteCracked*` (6), `urban:ConcreteHexagons*` (4), `urban:ConcreteSidewalk*` (8), `urban:ConcreteUnderTiles*`, `urban:MetroConcrete`, `hz_floor_01…14`.
- Metal plate / grating: `calm_deckplate` (spaceship deck plate), `calm_rivets`, `calm_gunmetal`, `aluminium`, `metal`, `metal_2`, `metal_3`, `gunmetal`, `gunmetal_2`, `urban:MetalDiamondPlate*` (12), `urban:MetalGratingGrid*` (6), `urban:MetalGratingMesh*` (12), `urban:MetalGratingPainted*` (10), `urban:MetalSubwayGrill*` (4), `urban:MetalDrainStrip1/2`, `urban:MetalSteps1-4`, `urban:ConcreteSteps1-3`.
- Hazard: `urban:ConcreteWarningStripe1/2`, `urban:MetalWarningStripe1/2`, `urban:MetroTactile` (yellow tactile strip), `urban:ConcreteStriped*`.
- Parking / tram: `urban:RoadZone*` (6), `urban:RoadGeneric*`, `urban:RoadSingle*`, `urban:RoadDouble*`, `urban:ConcreteCurb1-4`, `urban:MetroRails` (ballast + sleepers + rails), `road`, `urban_street`.
- VIP: `carpet` (his), `calm_carpet`, `urban:CarpetPlain*` (12), `urban:CarpetPattern*`, `urban:CarpetDiamond*`, `urban:WoodFlooring*`, `calm_planks`, `calm_leather`.
- Rock / cave: `calm_cavefloor`, `cave_floor`, `calm_gravel`, `urban:GroundPebbles*`, `calm_rubble`.
- Liquids (coolant, sludge): `urban:Liquid_<Blue|Green|Yellow|Purple|Red|Brown>_<01-08>` (48), `nz_poison`, `nz_oil`, `sludge`.

### Wall (wall role)
- White lab / painted: `urban:PlasterWallPainted1a…2e` (11; 1a is re-skinned by the zone map), `urban:PlasterWallGeneric*` (10), `urban:PlasterBoard*` (10), `urban:PlasterWallStucco*`, `urban:MetalPanelPainted1a…2e` (10), `urban:MetalGenericPainted*` (12), `urban:MetroWallTile` (small white wall tiles), `urban:TileSubway1a…4d` (16), `urban:TileSubwayGen1/2`, `drywall`, `drywall_2…5`, `enamel_2`, `calm_plaster`, `calm_marblemint`, `marble_light`.
- Concrete: `urban:ConcreteStriped*`, `urban:ConcretePanels*`, `urban:ConcretePrecast*`, `urban:ConcreteWoodFormed*` (6, board-formed bunker concrete), `urban:ConcreteStucco*` (14), `urban:ConcreteMoulding*`, `urban:BrickCinder*` (18, cinder block), `urban:BrickPainted*` (11), `hz_wall_01…14`, `urban_wall`.
- Metal: `urban:MetalPanel*` (10), `urban:MetalWallRibbed*` (12), `urban:MetalCorrugated*` (12), `urban:MetalCorrugatedPainted*` (20), `urban:MetalShippingContainer*` (20), `urban:MetalShutter*` (7, hangar doors), `urban:MetalGeneric*` (12), `urban:MetalBeams*` (8), `urban:MetalTruss*` (24, hangar roof trusses), `urban:MetalConduit*` (4), `urban:MetalPipeOld*`, `urban:MetalPipePainted*` (15), `urban:MetroMetal`, `teal` (his aged teal metal trim), `calm_copper`, `hz_metal_01…14`, `hz_misc_01…15`.
- Vents / lights / glass: `urban:VentCover*` (8), `urban:VentWalls*` (4), `urban:LightInterior1a…2b` (+ `-Glow` twins), `urban:GlassGeneric*` (6), `urban:GlassWindowSquare* / Tall* / Factory*` (+ Glow, + Broken): the sheet way to do an observation window.
- Fence: `urban:MetalFenceChainlink1-4`, `urban:MetalFenceOld1/2`.
- Rock: `calm_rock`, `calm_darkrock`, `cave_wall`, `rocks_1…5`, `rock_wall_1/2`, `hz_stone_01…14`, `calm_obsidian_plain`.
- Ceiling: `urban:FibreCeilingTile*`, `ceiling` (his acoustic panel), `urban:ConcreteRoofBitumen*`.

## C. DECALS THAT FIT

`DOOR_HQ.decals` is keyed BY ROOM, each a list of `{kind, x, z, r, rot}`; the five kinds the renderer draws: **`oil`, `grime`, `scorch`,
`puddle`, `blood`** (+ `wear` at doors by `HQ_DECAL_RULES.door`). For a base: oil (hangar, parking, workshop), grime, scorch (test
chambers, collider), puddle (tunnels). There is NO number, arrow, lettering or hazard-chevron decal kind.

What does the job of signs / hazard / numbers:
- Zone stains (`ZONE_LOOKS.stains`, sheet keys `hz_stain_01…15`): blood 01-03, dirt 04-05, grime 06-08, drips down a wall 10-14, soot 15. Rows `{k:'decal', tex, x, z, …}` in a room.
- Urban sheets as decals / plates: `urban:SignCaution1a-1f`, `urban:SignDanger1a-1f`, `urban:SignHazard1a-2b`, `urban:SignProhibited1a-1c`, `urban:SignProtective1a-1d` (PPE), `urban:SignSpeedUsa010…120` (the only NUMBERS: usable as level / bay numbers), `urban:DecalStainOil1/2`, `urban:DecalStainLeaks1-6`, `urban:DecalPlasterHole1-3`, `urban:DecalManholeCover1/2`, `urban:DecalWindowsFactory*` (+Glow).
- Hazard stripes: `urban:ConcreteWarningStripe1/2`, `urban:MetalWarningStripe1/2`, `urban:MetroTactile`.
- Code props (catalogue `proc` rows): `warning_tape` (striped floor line), `radiation_sign` (trefoil plate), `parking_bay` (painted bay), `platform_edge` (yellow line), `floor_stain`, `station_sign` / `station_text` (an enamel board that prints any `text`: the way to write SECTOR / LEVEL names), `exit_sign`, `graffiti_wall`, `door_seal`, `lesson_sign`, `motto_plaque`, `now_serving`, `directory_board`, `departures_board`, `notice_board`.
- Arrows: none found anywhere (no sheet, no proc).
