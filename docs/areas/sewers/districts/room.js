/* room.js — THE SEWERS' LABYRINTH, THE ROOM DESIGN (2026-11-20, world polish thread 10; mondo's OK on docs/plans/world-polish/plans/ug-sewers.js
   and on the whole underground's layout plans/underground.js: "Yes this is good, go ahead and start individual threads").
   The Sewers are the TOP of the underground labyrinth, just under the city: 8 x 6 plots, levels 144 (the Pumping Station, under the street)
   down to 120 (the bottom of the old mine). Every square, level, ladder, cliff, fall and pit is the PLAN's (draw-plan.js `build`): this file
   does not move one. It names the plots, sets the five districts on them, says how each district is floored and whether its passages carry
   a channel, places the five ways out, and dresses what stands on the squares (catalogue keys only; FITS list: areas-complexes.md
   "THE SEWERS' LABYRINTH").
       node bake-labyrinth.js docs/areas/sewers/districts/room.js [--dry-run]     writes `site_prebuilt_sewers_labyrinth` into data.js
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
    room: 'site_prebuilt_sewers_labyrinth', part: 'labyrinth', site: 'prebuilt_downtown', marker: 'LABYRINTH-SEWERS',
    label: 'DISASTER CITY · THE SEWERS',
    sub: 'THE CULVERTS · THE RADIOACTIVE DRAIN · THE RUNNING TUNNELS · THE HOLDING CELLS · THE OLD WORKINGS',
    parti: 'The top of the labyrinth under the city: brick culverts on many levels joined by iron ladders, the water stepping down over weirs and falls from the Pumping Station under the street to the flooded mine 42 m below; a radioactive drain, an old railway, the cells and the mine off its branches; dead ends with something in them.',
    districts: {
        W: { name: 'The Culverts', floor: 1, chamber: 3, channel: 'water' },
        R: { name: 'The Radioactive Drain', floor: 3, chamber: 3 },
        T: { name: 'The Running Tunnels', floor: 5, chamber: 5 },
        H: { name: 'The Holding Cells', floor: 2, chamber: 2 },
        O: { name: 'The Old Workings', floor: 6, chamber: 6 },
    },
    /* the paint: index 0 = the room's own floor; the districts' `floor` (passages) and `chamber` pick from it */
    pal: ['urban:ConcreteStriped2c', 'bricks_2', 'urban:TileGeneric4b', 'urban:ConcreteStriped1e', 'wood_planks', 'urban:TileSubway4a', 'dirt_2'],
    plots: {
        '3,0': ['W', 'The Pumping Station'], '4,0': ['W', 'The Pump Room'], '3,1': ['W', 'The Inspection Gallery'], '3,2': ['W', 'The Precinct Drain'],
        '5,0': ['W', 'The Junction'], '5,1': ['W', 'The Culverts'], '4,1': ['W', 'The Cistern'], '6,0': ['W', 'The East Return'], '6,1': ['W', 'The Culverts'],
        '7,0': ['W', 'The Storm Drain'], '7,1': ['W', 'The Overflow'],
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
    /* THE WAYS OUT: one row a door of the plan (plans/ug-sewers.js `doors`, in its order); the room's other end of each */
    doors: [
        { id: 'ow_tunnelway', leaf: 'leaf_portcullis', label: 'THE TUNNEL-WAY', sub: 'THE CHIMNEY · THE OLD ADIT WEST AND DOWN', action: { room: 'site_prebuilt_hollow_earth_ow_tunnelway', at: 'ow_v_1_1' }, desc: 'The old miners\' adit, timbered, going west and down. The draught out of it is warm.' },
        { id: 'freight_line', leaf: 'leaf_vault', label: 'THE D.U.M.B.', sub: 'THE FREIGHT LINE · DOWN TO THE EAST GANTRY', action: { room: 'site_prebuilt_dumb_base', at: 'ow_v_7_16' }, desc: 'A vault door in the end wall of the line, the track running on under it. Somebody keeps the hinges oiled.' },
        { id: 'pump', leaf: 'leaf_bulkhead', label: 'DISASTER CITY', sub: 'THE PUMPING STATION · UP TO THE STREET', action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: 'A bulkhead door at the foot of the shaft, the ladder going up past it to a grate and daylight. The pumps behind you run all night.' },
        { id: 'sewers_power', leaf: 'leaf_bulkhead', label: 'THE POWER STATION', sub: 'THE MANHOLE · UP TO THE YARD', action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: 'A manhole ladder up to the Power Station\'s yard. The pipes beside it are warm, and the water under it glows.' },
        { id: 'cells_stair', leaf: 'leaf_cell', label: 'THE PRECINCT', sub: 'THE HOLDING CELLS · THE STAIR UP', action: { room: 'site_prebuilt_downtown_streets', at: 'sewer' }, desc: 'A barred door and a concrete stair up into the precinct\'s basement.' },
    ],
    spawn: [41, 5], spawnFace: 180,
    lines: [
        '“Which way is out?” “Up.” “Which way is up?” “Against the water.”',
        '“How deep does it go?” “The water knows. Follow it down and you find the mine. Follow the mine down and you stop finding things.”',
        '“The ladders are iron.” “Some of them.” “What are the others?” “Rust, in the shape of a ladder.”',
    ],
    /* ── THE PILOT'S DRESSING: the Culverts (W). a.P = a blocker on a square's middle; a.dec = decor off it; a.ceil = hung from the vault;
       a.native = a resident; a.box / a.cyl = a drawn part (one `arch` row). Squares are the plan's. ── */
    dress(a) {
        a.culverts();   // the district kit (bake-labyrinth.js THE CULVERTS KIT): lamps, pipes, channels' mouths and grates, weirs, rats, rubbish
        const P = a.P, dec = a.dec;
        /* THE PUMPING STATION (3,0; chamber, level 144): the shaft down from the street, the bulkhead door, the pumps */
        a.shaft(38, 2);                                         // the manhole shaft over the door: ladder, daylight down it
        P('centrifugal_pump', 44, 3, { face: 270 }); P('centrifugal_pump', 44, 6, { face: 270 }); P('gauge_board', 45, 8, { face: 270 });
        P('valve_wheel', 39, 9, { face: 0 }); P('gate_valve', 42, 9, { face: 0 }); P('boiler', 45, 5, { face: 270 });
        dec('wet_floor_sign', 40, 6); dec('psx_metal_barrel_mp_1', 38, 8); dec('traffic_barrel', 38, 7); dec('rat', 43, 5);
        a.bulb(41, 5, 'The Pumping Station');
        a.plate(38, 9, 's', 'PUMPING STATION 4', 'NO ENTRY BEYOND THE WEIR');
        /* THE JUNCTION (5,0; chamber, level 141): LANDMARK, where the big pipes meet over a sump */
        a.mains(62, 2, 69, 9);                                  // four big mains across the chamber's vault, a valve gallery
        P('psx_pipe_valve_holder_large_1', 63, 3, { face: 90 }); P('valve_wheel', 68, 3, { face: 270 }); P('pd_lever', 62, 8, { face: 90 });
        dec('psx_wooden_crate_2', 69, 8); dec('psx_old_mattress_mp_1', 63, 9); dec('skull', 64, 9); dec('rat', 67, 7);
        a.bulb(65, 6, 'The Junction');
        a.plate(62, 9, 's', 'THE JUNCTION', 'MAINS 1 - 4 · DO NOT CLOSE');
        /* THE PUMP ROOM (4,0; level 143) and THE CISTERN (4,1; level 138): a junction each */
        P('centrifugal_pump', 54, 4, { face: 180 }); dec('wooden_bucket', 55, 7); dec('mop', 52, 7);
        a.bulb(53, 5, 'The Pump Room');
        P('air_compressor', 52, 19, { face: 0 }); dec('psx_metal_barrel_mp_2', 55, 19); dec('rat', 54, 17);
        /* THE INSPECTION GALLERY (3,1; level 143) and THE PRECINCT DRAIN (3,2; level 142): the long feeder south, its cliff down to the line */
        dec('psx_cobweb_1', 41, 17); dec('tire_stack', 43, 19); dec('psx_brick_1', 40, 28); dec('psx_brick_1_2', 41, 29); dec('skull', 42, 30);
        P('utility_box', 43, 16, { face: 270 });
        /* THE EAST RETURN, THE STORM DRAIN, THE OVERFLOW (6,0 / 7,0 / 7,1; levels 137-138): the culverts bend down to the drain */
        dec('psx_metal_barrel_mp_1', 79, 5); dec('traffic_barrel', 90, 5); dec('psx_cobweb_2', 91, 17); dec('mushroom2', 88, 18); dec('woods_glowcap', 89, 19);
        dec('psx_old_mattress_mp_1', 77, 17); dec('railway_lantern', 78, 18);
        /* the residents (the old Sewers' own kinds): a sewer gator in the Junction, one in the Storm Drain, a mole man at the Pump Room */
        a.native('sewer gator', 66, 4, 180, ['“You came down the ladder.” “Yes.” “Then you know the way up. Nobody else down here does.”']);
        a.native('sewer gator', 89, 6, 270, ['“The water goes down.” “Where to?” “Ask the mine. It has had a lot of it.”']);
        a.native('mole man', 54, 6, 90, ['“Pump four runs all night.” “For who?” “For the street. The street never says thank you.”']);
    },
};
