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
    /* THE GANTRIES */
    gantry(ctx, 10, 24, 'S', 'WESTERN TOWN');
    gantry(ctx, 64, 10.5, 'W', 'WESTERN TOWN · AREA 51');
    gantry(ctx, 30, 14.5, 'E', 'THE CIRCUS');
} };
