/* DH1 THE DESERT HIGHWAY, the Circus to Western Town: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). From the retired Highway
   room (bake-desert.js, its Exit 3 frontage road): THE DOOR, one road, one door, a door frame standing alone by the road with nothing behind it
   (the opening scene's and the main menu's spot), and THE BUS STOP. Both stand by the road's last stretch before Western Town.
   Squares: the room is 96 x 48; the highway runs west on row 12.5, then south on square x 12 (the cars at x 10 south, 14 north). */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    /* THE DOOR (plot -2,24, west of the road) */
    ctx.clear(1, 28, 7, 36);
    at(ctx, 'leaf_shabby_wood', 4.5, 32.5, { face: 90 }); at(ctx, 'paper_sheet', 5.4, 33.6, { y: 0.01, face: 40 }); at(ctx, 'signpost', 6.4, 29.6, { face: 160 });
    /* THE BUS STOP (plot -1,25, east of the road): the shelter, the school bus at the kerb, the sign */
    ctx.clear(17, 34, 23, 46);
    at(ctx, 'bus_shelter', 19.2, 41.5, { face: 270 }); at(ctx, 'school_bus', 21.6, 36.8, { face: 0 }); at(ctx, 'bus_stop_sign', 17.6, 43.6, {});
    /* THE RAISED HIGHWAY (2026-11-22, mondo: "This should be the standard for how the rest of the highways get built"; DH1.json `raised`, ow-raised.js
       with `axis: 'x'`): the east to west run is on ramps (columns 19-29 and 73-83) and a deck 6 m up (columns 29-73) with one exit; the road under
       the deck is columns 50 and 51 and runs on past the room both ways. The room has three more plots south of the exit (DH1.json `add`).
       Squares: the middle line is row 12.48, the cars drive on row 10.5 (west) and 14.5 (east); the exit's ramps are rows 5.5-7.5 and 17.5-19.5. */
    const { cityBoard, poleLine, mileMarker } = K, R = ctx.RAISED, H = R.H;
    const pave = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ctx.setPaint(x, y, ctx.ASPH); };
    /* THE GAS STATION (the city chain's, as on the Badlands Highway): south of the exit, east of the road under the deck, on a forecourt that opens onto it */
    ctx.clear(52, 24, 70, 35); pave(52, 24, 69, 35);
    at(ctx, 'city_gas_store', 66.5, 29.5, { face: 270 }); at(ctx, 'city_gas_canopy', 58.5, 29.5, { face: 180 }); at(ctx, 'city_gas_sign', 53.6, 25.2, { face: 0 });
    at(ctx, 'car_truck', 58.5, 30.7, { face: 90 }); at(ctx, 'traffic_cone', 62.2, 26.4, { face: 30 }); at(ctx, 'trash_bin', 63.4, 34.4, { face: 0 }); at(ctx, 'park_bench', 61.8, 34.4, { face: 180 });
    /* THE CARAVAN STOP (the design page: "wells and a caravan stop on it"), south of the gas station, by the road that runs on south */
    ctx.clear(53, 37, 59, 46);
    at(ctx, 'covered_wagon', 55.2, 39.2, { face: 20 }); at(ctx, 'covered_wagon', 58.2, 42.4, { face: 110 }); at(ctx, 'ancient_well', 55.4, 43.6, {});
    at(ctx, 'water_trough', 56.9, 44.6, { face: 90 }); at(ctx, 'campfire', 56.6, 41.2, {}); at(ctx, 'wooden_barrel', 54.2, 41.4, {}); at(ctx, 'wooden_bucket', 55.9, 44.5, {});
    /* THE GANTRIES: the exit for both ways, before the exit lane opens; the two that stood on the ground here are on the deck now */
    gantry(ctx, 10, 24, 'S', 'WESTERN TOWN');
    gantry(ctx, 75.5, 10.5, 'W', 'EXIT · GAS · CARAVAN STOP', { exit: '2A', y: R.hMain(75.5) });
    gantry(ctx, 26.5, 14.5, 'E', 'EXIT · GAS · CARAVAN STOP', { exit: '2A', y: R.hMain(26.5) });
    gantry(ctx, 45, 10.5, 'W', 'WESTERN TOWN · AREA 51', { y: H });
    gantry(ctx, 57, 14.5, 'E', 'THE CIRCUS', { y: H });
    /* THE ROADSIDE (the highway standard): the telephone line along the north side, clear of the ramps' walls; four of Disaster City's own adverts
       (two beside the deck, read from up there; one on the ground at each end); a mile marker a plot, counted on from the Badlands Highway's nine */
    poleLine(ctx, 3.5, 6, 94, { step: 8, ew: true });
    cityBoard(ctx, 36, 23.3, 'E', 'CALAMITY MUTUAL', { lift: 9 }); cityBoard(ctx, 77, 23.3, 'W', 'JITTERS COFFEE', { lift: 9 });
    cityBoard(ctx, 89, 20.5, 'W', 'HERO ENERGY'); cityBoard(ctx, 17.2, 27, 'N', 'LANDSLIDE REALTY');
    [90, 78, 66, 54, 42, 30, 18].forEach((x, k) => { const up = x > R.U0 && x < R.D1;
        if (up) { if (x > R.U1 - 1 && x < R.D0 + 1 && Math.min(x - R.U1, R.D0 - x) < 13) return; mileMarker(ctx, x, R.at - R.E / ctx.C, 10 + k, { rot: 90, y: ctx.r2(R.hMain(x) + 0.9) }); }
        else mileMarker(ctx, x, R.at - 5.1, 10 + k, { rot: 90 }); });
    mileMarker(ctx, 6.9, 24, 17); mileMarker(ctx, 6.9, 38, 18);
} };
