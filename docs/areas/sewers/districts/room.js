/* room.js — THE SEWERS' LABYRINTH, THE ROOM DESIGN (2026-11-20, world polish thread 10; mondo's OK on docs/plans/world-polish/plans/ug-sewers.js
   and on the whole underground's layout plans/underground.js: "Yes this is good, go ahead and start individual threads").
   The Sewers are the TOP of the underground labyrinth, just under the city: 8 x 6 plots, levels 144 (the Pumping Station, under the street)
   down to 120 (the bottom of the old mine). Every square, level, ladder, cliff, fall and pit is the PLAN's (draw-plan.js `build`): this file
   does not move one. It names the plots, sets the five districts on them, says how each district is floored and whether its passages carry
   a channel, places the five ways out, and dresses what stands on the squares (catalogue keys only; FITS list: areas-complexes.md
   "THE SEWERS' LABYRINTH").
       node bake-labyrinth.js docs/areas/sewers/districts/room.js [--dry-run]     writes THE SEWERS' room, `site_prebuilt_downtown_underworld`
   THE SWITCH (11-20, mondo's "okay continue" after the Culverts pilot): the labyrinth took the old room's id, so every way, map row and NPC board
   row that names the Sewers lands in it; the old room (bake-sewers.js, the SEWERS24 block) is gone and its five district files are the record
   its dressing was carried over from. Every old way in has a dead end in its own district (`ways` below).
   Squares are the PLAN's (x 0..95 west to east, y 0..71 north to south). A plot is 'bx,by' (0..7, 0..5).
   THE FIVE DISTRICTS, set on the plan's maze as it falls from the street (each one a branch of the maze, entered at its top):
     W THE CULVERTS          11 plots, levels 137-144: the way in from Disaster City (the Pumping Station) and the culverts round it (THE PILOT)
     R THE RADIOACTIVE DRAIN  8 plots, levels 130-136: the manhole up to the Power Station's yard, the Sludge Pit, the Settling Tank
     T THE RUNNING TUNNELS   11 plots, levels 128-137: the old line, the Depot, the Freight Line's door to the D.U.M.B.
     H THE HOLDING CELLS      6 plots, levels 127-130: the stair up to the precinct, the cells (grown from 2 plots, mondo 11-20)
     O THE OLD WORKINGS      12 plots, levels 120-126: the flooded mine at the bottom, the Chimney and the way on to the Tunnel-Way */
'use strict';
module.exports = {
    plan: require('../../../plans/world-polish/plans/ug-sewers.js'),
    room: 'site_prebuilt_downtown_underworld', part: 'underworld', site: 'prebuilt_downtown', marker: 'LABYRINTH-SEWERS', replaces: 'SEWERS24',
    world: { hub: 'underworld', layer: 'under', wx: 1, wy: 1 },
    label: 'DISASTER CITY · THE SEWERS',
    sub: 'THE CULVERTS · THE RADIOACTIVE DRAIN · THE RUNNING TUNNELS · THE HOLDING CELLS · THE OLD WORKINGS',
    parti: 'The top of the labyrinth under the city: brick culverts on many levels joined by iron ladders, the water stepping down over weirs and falls from the Pumping Station under the street to the flooded mine 42 m below; a radioactive drain, an old railway, the cells and the mine off its branches; dead ends with something in them.',
    districts: {
        W: { name: 'The Culverts', floor: 1, chamber: 3, channel: 'water' },
        R: { name: 'The Radioactive Drain', floor: 3, chamber: 3, channel: 'sludge', sump: 'sludge' },
        T: { name: 'The Running Tunnels', floor: 5, chamber: 5 },
        H: { name: 'The Holding Cells', floor: 2, chamber: 2 },
        O: { name: 'The Old Workings', floor: 6, chamber: 6 },
    },
    /* the paint: index 0 = the room's own floor; the districts' `floor` (passages) and `chamber` pick from it */
    pal: ['urban:ConcreteStriped2c', 'bricks_2', 'urban:TileGeneric4b', 'urban:ConcreteStriped1e', 'wood_planks', 'urban:TileSubway4a', 'dirt_2'],
    plots: {
        '3,0': ['W', 'The Pumping Station'], '4,0': ['W', 'The Pump Room'], '3,1': ['W', 'The Inspection Gallery'], '3,2': ['W', 'The Precinct Drain'],
        '5,0': ['W', 'The Junction'], '5,1': ['W', 'The Culverts'], '4,1': ['W', 'The Cistern'], '6,0': ['W', 'The East Return'], '6,1': ['W', 'The Culverts'],
        '7,0': ['W', 'The Storm Drain'], '7,1': ['W', 'The Outfall'],
        '6,2': ['R', 'The Power Station Drain'], '7,2': ['R', 'The Valve Gallery'], '6,3': ['R', 'The Green Culvert'], '7,3': ['R', 'The Sludge Pit'],
        '7,4': ['R', 'The Settling Tank'], '6,4': ['R', 'The Leak'], '7,5': ['R', 'The Drum Store'], '6,5': ['R', 'The Dead Drain'],
        '4,2': ['T', 'The Maintenance Hatch'], '4,3': ['T', 'The Ghost Station'], '3,3': ['T', 'The Signal Box'], '4,4': ['T', 'The Loop Line'],
        '3,4': ['T', 'The Crossing'], '3,5': ['T', 'The Depot'], '4,5': ['T', 'The Freight Line'], '5,5': ['T', 'The Loop Line South'],
        '5,4': ['T', 'The Siding'], '5,3': ['T', 'The Buffer Stops'], '5,2': ['T', 'The Cutting'],
        '2,5': ['H', 'The Sally Gate'], '2,4': ['H', 'The Guardroom'], '2,3': ['H', 'The Drunk Tank'], '1,3': ['H', 'The Holding Cells'],
        '1,4': ['H', 'The Property Room'], '0,3': ['H', 'The Vent Stack'],
        '0,4': ['O', 'The Adit'], '0,5': ['O', 'The Chimney'], '1,5': ['O', 'The Flood'], '0,2': ['O', 'The Pump Ledge'], '1,2': ['O', 'The Old Workings'],
        '2,2': ['O', 'The Timber Stope'], '2,1': ['O', 'The Ore Chute'], '1,1': ['O', 'The Winze'], '0,1': ['O', 'The Sump'], '0,0': ['O', 'The Lower Drift'],
        '1,0': ['O', 'The Bottom Level'], '2,0': ['O', 'The Fall Pool'],
    },
    /* THE WAYS OUT, the plan's five (plans/ug-sewers.js `doors`, in its order). `link` = the end of a DOOR_HQ.links row (rewritten in data.js by
       the tool); `id` = one of the room's own doors (the other room's door points at that id) */
    doors: [
        { id: 'ow_v_1_1', way: 'trail', leaf: 'leaf_portcullis', label: 'THE TUNNEL-WAY', sub: 'THE CHIMNEY · THE OLD ADIT WEST AND DOWN', action: { room: 'site_prebuilt_hollow_earth_ow_tunnelway', at: 'ow_v_1_1' }, desc: 'The old miners\' adit, timbered, going west and down. The draught out of it is warm.' },
        { id: 'freight_line', leaf: 'leaf_vault', minClearance: 6, label: 'THE FREIGHT LINE', sub: 'THE FREIGHT LINE · TO THE D.U.M.B.\'S SUB-LEVEL 7 · CLEARANCE L6', action: { room: 'site_prebuilt_dumb_base', at: 'freight_line' }, desc: 'A vault door in the end wall of the line, the track running on under it. Somebody keeps the hinges oiled.' },
        { id: 'pump', leaf: 'leaf_bulkhead', label: 'DISASTER CITY', sub: 'THE PUMPING STATION · UP TO THE STREET', action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: 'A bulkhead door at the foot of the shaft, the ladder going up past it to a grate and daylight. The pumps behind you run all night.' },
        { link: 'sewers_power' },     // the manhole up to the Power Station's yard (the plan's "Disaster City (a manhole)")
        { link: 'cells_dungeon' },    // the plan's "Disaster City (the Holding Cells)": the seventh cell, through to Room 24601's precinct
    ],
    /* THE OLD WAYS IN (every one the old room had), each at a dead end of its own district; `side` = the rock it stands against (else the first) */
    ways: [
        { id: 'ow_v_7_16', way: 'trail', leaf: 'leaf_bulkhead', label: 'THE D.U.M.B.', sub: 'THE GANTRY TUNNEL · INTO THE EAST GANTRY', action: { room: 'site_prebuilt_dumb_base', at: 'ow_v_7_16' }, desc: '', sq: [59, 68] },
        { id: 'ow_v_18_5', way: 'trail', leaf: 'leaf_bulkhead', label: 'THE DEEP · THE SEA FLOOR', sub: 'THE OUTFALL · THE PIPE RUNS OUT UNDER THE SEA', action: { room: 'site_prebuilt_atlantis_ow_floor', at: 'ow_v_18_5' }, desc: 'Where the fall\'s water leaves: a pipe as tall as a man, salt on its lip.', sq: [31, 7] },
        { link: 'docks_sewer', sq: [91, 4] },        // the Storm Drain: up to the flooded quay
        { link: 'stadium_sewers', sq: [79, 10] },    // the East Return: the gutter in the stadium road
        { link: 'sewers_drain', sq: [90, 2] },       // a DRAUGHT, in the Storm Drain's pit: sideways into the storm drain under the Woods
        { link: 'well_garden', sq: [58, 51] },       // the Loop Line: the garden well's rope
        { link: 'tunnels_works', sq: [68, 35] },     // the Cutting: the track on to the building's platform
        { link: 'tunnels_platform', sq: [64, 67] },  // the Loop Line South: the track on to Downtown's platform
        { link: 'workings_oubliette', sq: [11, 68] },   // the Chimney: the old portcullis into the Oubliette
    ],
    spawn: [41, 5], spawnFace: 180,
    lines: [
        '“Which way is out?” “Up.” “Which way is up?” “Against the water.”',
        '“How deep does it go?” “The water knows. Follow it down and you find the mine. Follow the mine down and you stop finding things.”',
        '“The ladders are iron.” “Some of them.” “What are the others?” “Rust, in the shape of a ladder.”',
        '“Somebody painted the wall.” “Somebody painted it green.” “That is not paint.”',
    ],
    /* ── THE DRESSING. a.P = a blocker on a square's middle ({ near: true } = the nearest free square); a.dec = decor off it; a.on = on the track;
       a.native = a resident; a.box / a.cyl = a drawn part (one `arch` row); a.kit = the district kit; a.rails = a run of track. Squares are the plan's. ── */
    dress(a) {
        const P = (k, x, y, o) => a.P(k, x, y, Object.assign({ near: true }, o || {})), dec = a.dec;
        /* ══ W · THE CULVERTS (the pilot, 11-20) ══ */
        a.culverts();
        /* THE PUMPING STATION (3,0; chamber, level 144): the shaft down from the street, the bulkhead door, the pumps */
        a.shaft(38, 2);
        P('centrifugal_pump', 44, 3, { face: 270 }); P('centrifugal_pump', 44, 6, { face: 270 }); P('gauge_board', 45, 8, { face: 270 });
        P('valve_wheel', 39, 9, { face: 0 }); P('gate_valve', 42, 9, { face: 0 }); P('boiler', 45, 5, { face: 270 });
        dec('wet_floor_sign', 40, 6); dec('psx_metal_barrel_mp_1', 38, 8); dec('traffic_barrel', 38, 7); dec('rat', 43, 5);
        a.bulb(41, 5); a.plate(38, 9, 's', 'PUMPING STATION 4', 'NO ENTRY BEYOND THE WEIR');
        /* THE JUNCTION (5,0; chamber, level 141): LANDMARK, where the big pipes meet over a sump */
        a.mains(62, 2, 69, 9);
        P('psx_pipe_valve_holder_large_1', 63, 3, { face: 90 }); P('valve_wheel', 68, 3, { face: 270 }); P('pd_lever', 62, 8, { face: 90 });
        dec('psx_wooden_crate_2', 69, 8); dec('psx_old_mattress_mp_1', 63, 9); dec('skull', 64, 9); dec('rat', 67, 7);
        a.bulb(65, 6); a.plate(62, 9, 's', 'THE JUNCTION', 'MAINS 1 - 4 · DO NOT CLOSE');
        /* THE PUMP ROOM (4,0; 143) and THE CISTERN (4,1; 138) */
        P('centrifugal_pump', 54, 4, { face: 180 }); dec('wooden_bucket', 55, 7); dec('mop', 52, 7); a.bulb(53, 5);
        P('air_compressor', 52, 19, { face: 0 }); dec('psx_metal_barrel_mp_2', 55, 19); dec('rat', 54, 17);
        /* THE INSPECTION GALLERY (3,1; 143) and THE PRECINCT DRAIN (3,2; 142) */
        dec('psx_cobweb_1', 41, 17); dec('tire_stack', 43, 19); dec('psx_brick_1', 40, 28); dec('psx_brick_1_2', 41, 29); dec('skull', 42, 30); P('utility_box', 43, 16, { face: 270 });
        /* THE EAST RETURN, THE STORM DRAIN, THE OUTFALL (6,0 / 7,0 / 7,1; 137-138) */
        dec('psx_metal_barrel_mp_1', 79, 5); dec('traffic_barrel', 90, 5); dec('psx_cobweb_2', 91, 17); dec('mushroom2', 88, 18); dec('woods_glowcap', 89, 19);
        dec('psx_old_mattress_mp_1', 77, 17); dec('railway_lantern', 78, 18);
        a.native('sewer gator', 66, 4, 180, ['“You came down the ladder.” “Yes.” “Then you know the way up. Nobody else down here does.”']);
        a.native('sewer gator', 89, 6, 270, ['“The water goes down.” “Where to?” “Ask the mine. It has had a lot of it.”']);
        a.native('mole man', 54, 6, 90, ['“Pump four runs all night.” “For who?” “For the street. The street never says thank you.”']);

        /* ══ R · THE RADIOACTIVE DRAIN (8 plots, 130-136): the Power Station's waste comes down the manhole; the channels run with sludge ══ */
        a.kit('R', { lamp: 0x8cff6a, every: 9, rubbish: ['radiation_drum', 'rat', 'warning_tape', null, 'psx_metal_barrel_mp_3', 'goo_tendril'] });
        /* THE POWER STATION DRAIN (6,2) + THE VALVE GALLERY (7,2) */
        P('waste_pipe', 79, 29, { face: 270 }); P('valve_wheel', 78, 31, { face: 0 }); dec('gate_valve', 77, 30);
        P('valve_wheel', 88, 30, { face: 90 }); P('gate_valve', 91, 29, { face: 270 }); P('psx_pipe_valve_holder_large_1', 90, 31, { face: 0 });
        a.plate(76, 28, 'w', 'POWER STATION OUTFALL', 'RADIATION · NO UNAUTHORISED ENTRY');
        /* THE SLUDGE PIT (7,3; chamber, 132): LANDMARK, the sludge sump and the black goo coming up out of it */
        dec('goo_tendril', 89, 38); dec('goo_tendril', 90, 38); dec('goo_tendril', 91, 39);
        P('radiation_drum', 87, 44); P('radiation_drum', 88, 44); P('radiation_drum', 93, 44); P('retro_control_panel', 93, 41, { face: 270 }); P('hazmat_suit', 86, 41, { face: 90 });
        dec('warning_tape', 89, 40); dec('skull', 92, 39); dec('hw_body', 87, 39); a.bulb(90, 42); a.plate(86, 45, 's', 'SLUDGE PIT', 'DO NOT TOUCH THE WATER');
        /* THE SETTLING TANK (7,4; chamber, 131) */
        P('centrifugal_pump', 87, 51, { face: 90 }); P('boiler', 92, 51, { face: 270 }); P('generator', 92, 56, { face: 270 }); P('gas_cylinder_rack', 87, 56, { face: 90 });
        P('steel_table', 90, 55); dec('hw_body_2', 89, 53); dec('psx_supply_crate_1_empty', 88, 54); dec('footlocker', 91, 57);
        /* THE DRUM STORE (7,5) */
        P('radiation_drum', 89, 65); P('radiation_drum', 90, 65); P('radiation_drum', 89, 66); dec('hazmat_suit', 91, 66);
        a.native('sewer gator', 88, 42, 90, ['“It glows.” “Yes.” “Is that bad?” “Not for me any more.”']);

        /* ══ T · THE RUNNING TUNNELS (11 plots, 128-137): the old line in the chambers, the Depot, the Freight Line's door to the D.U.M.B. ══ */
        a.kit('T', { lamp: 0xffa244, every: 10, rubbish: ['traffic_barrel', 'rat', 'railway_lantern', null, 'psx_metal_barrel_mp_2', 'cable_drum'] });
        /* THE GHOST STATION (4,3; chamber, 136): a platform nobody stops at */
        a.rails(50, 44, 57, 44, true);
        P('metro_bench', 52, 40, { face: 180 }); P('metro_bench', 55, 40, { face: 180 }); P('metro_column', 51, 42); P('metro_column', 56, 42); P('tunnel_signal', 57, 43, { face: 270 });
        dec('anatomy_skeleton', 53, 41); a.plate(54, 38, 'n', 'GHOST STATION', 'NO TRAINS STOP HERE');
        /* THE DEPOT (3,5; chamber, 132): LANDMARK, the hand car on its siding */
        a.rails(38, 66, 45, 66, true); a.on('hand_car', 41, 66, { face: 90 }); a.on('mine_cart', 44, 66, { face: 90 });
        P('cable_drum', 39, 63); P('traffic_barrel', 44, 63); P('railway_lantern', 42, 68); a.bulb(42, 64); a.plate(38, 62, 'n', 'THE DEPOT', 'LOOP LINE · SIDINGS 1 - 3');
        /* THE FREIGHT LINE (4,5; chamber, 131): the line on to the D.U.M.B.'s vault door */
        a.rails(52, 62, 52, 69, false); P('tunnel_signal', 54, 68, { face: 0 }); P('signpost', 50, 69, { face: 0 }); dec('traffic_barrel', 56, 63);
        /* THE CUTTING (5,2; 128) and THE SIDING (5,4; 129) */
        a.rails(62, 30, 69, 30, true); a.on('mine_cart', 65, 30, { face: 90 }); P('tunnel_signal', 63, 27, { face: 180 });
        a.rails(62, 54, 69, 54, true); P('cable_drum', 67, 51); P('traffic_barrel', 63, 56); P('traffic_barrel', 64, 56);
        a.native('karate frog', 43, 64, 180, ['“The line goes round.” “Where to?” “Here. That is what a loop is.”']);

        /* ══ H · THE HOLDING CELLS (6 plots, 127-130; grown from 2): the precinct's old cells, the Guardroom, the Drunk Tank ══ */
        a.kit('H', { lamp: 0xd8f0ff, every: 9, rubbish: ['psx_old_mattress_mp_1', 'rat', 'wooden_bucket', null, 'floor_stain', 'handcuffs'] });
        P('booking_desk', 18, 42, { face: 180 }); dec('key_ring', 19, 41); P('height_board', 19, 43, { face: 270 }); P('steel_bench', 17, 43);
        a.plate(16, 41, 'w', 'HOLDING CELLS', 'PRISONERS MUST BE SEARCHED');
        P('chain_bunk', 30, 40); P('steel_toilet', 29, 43); P('steel_bench', 28, 42); P('cell_bars', 31, 41, { face: 90 }); dec('psx_old_mattress_mp_1', 30, 42);
        P('booking_desk', 29, 53, { face: 0 }); dec('office_chair', 29, 54); P('steel_table', 31, 52); dec('key_ring', 31, 53); a.bulb(30, 54); a.plate(28, 55, 's', 'THE GUARDROOM', 'SHIFT 3 · NOBODY LEAVES');
        P('psx_supply_crate_1', 16, 52); P('footlocker', 19, 55); dec('handcuffs', 18, 53); P('height_board', 17, 52, { face: 180 });
        P('air_compressor', 5, 41); P('generator', 7, 43); dec('gate_valve', 6, 40);
        P('cell_bars', 29, 64, { face: 0 }); P('steel_bench', 31, 66); dec('handcuffs', 30, 65);
        a.native('police officer', 18, 41, 180, ['“Six cells, two occupied.” “Who is in the other four?” “Nobody we have charged.”']);

        /* ══ O · THE OLD WORKINGS (12 plots, 120-126): the flooded mine at the bottom; timber sets on its walls ══ */
        a.kit('O', { lamp: 0xffb060, lampKey: 'railway_lantern', every: 8, timber: true, rubbish: ['ore_heap', 'rat', 'cave_stone', null, 'psx_wooden_crate_2', 'skull_pile'] });
        /* THE CHIMNEY (0,5; chamber, 123): LANDMARK, the head wheel over the old shaft (the plan's landmark square), the way on to the Tunnel-Way */
        P('head_wheel', 6, 66); a.torch(4, 63); P('mine_cart', 8, 68, { face: 90 }); dec('ore_heap', 3, 68); dec('pickaxe', 7, 63);
        a.plate(2, 62, 'n', 'NO. 2 SHAFT', 'THE CHIMNEY · MEN AT WORK');
        /* THE FLOOD (1,5; 122), THE PUMP LEDGE (0,2; 126), THE SUMP (0,1; 123), THE OLD WORKINGS (1,2; 126), THE FALL POOL (2,0; 120) */
        P('rowboat', 17, 66, { face: 90 }); dec('fallen_log', 20, 63); dec('anatomy_skeleton', 15, 68); dec('skull_pile', 19, 68);
        P('beam_pump', 5, 29); P('anvil', 8, 31); P('psx_table_large_3', 3, 32); dec('platform_scale', 7, 27);
        P('hooded_statue', 5, 17, { face: 180 }); P('cauldron', 7, 19); dec('crystal_cluster', 3, 20); dec('skull_pile', 8, 15); P('sarcophagus', 3, 15, { face: 90 });
        P('mine_cart', 17, 29, { face: 90 }); dec('ore_heap', 19, 30); dec('pickaxe', 18, 31); P('signpost', 16, 31); dec('missing_board', 19, 28);
        dec('fallen_log', 29, 5); dec('psx_fish_skeleton_mp_1', 30, 6);
        a.native('mole man', 6, 64, 90, ['“The shaft goes down.” “How far?” “Further than the ladder.”']);
        a.native('samurai slug', 17, 30, 180);
    },
};
