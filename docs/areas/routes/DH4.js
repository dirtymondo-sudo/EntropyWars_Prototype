/* DH4 THE DESERT HIGHWAY, Giza to the Circus: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). From the retired Highway room
   (bake-desert.js, where the road met the Giza road): its last signpost and two barrels, by the road at the Giza end.
   Squares: the room is 72 x 84; the highway runs north on square x 60 (54 at the end by Giza), west on square x 48, west on row 12.5. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    /* THE FLYOVER (2026-11-22, mondo: the Badlands Highway "should be the standard for how the rest of the highways get built"; DH4.json `raised`, ow-raised.js):
       the last east to west run (row 12.48) is on ramps (columns 14-23 and 31-40) and a deck 5.5 m up (columns 23-31) over a road on columns 26 and 27 that runs on past the room both ways.
       The leg's straight is too short for an exit (about 30 squares; an exit needs 64), so this is ramps and a deck over a road, to the same standard
       otherwise: barriers, joints, the city's lamps, the telephone line, the city's adverts, mile markers counted on round the Desert Highway. */
    const { cityBoard, poleLine, mileMarker } = K, R = ctx.RAISED, H = R.H;
    ctx.clear(63, 76, 70, 82);
    at(ctx, 'signpost', 65.5, 79.5, { face: 0 }); at(ctx, 'traffic_barrel', 64.6, 81.6, { face: 20 }); at(ctx, 'traffic_barrel', 67.2, 81.2, { face: 80 });
    gantry(ctx, 62, 62, 'N', 'THE CIRCUS · WESTERN TOWN');
    gantry(ctx, 58, 44, 'S', 'GIZA · THE PYRAMIDS');
    gantry(ctx, 32, 10.5, 'W', 'THE CIRCUS', { y: R.hMain(32) });   // (on the ramp now)
    /* THE ROADSIDE */
    poleLine(ctx, 4, 6, 46, { step: 8, ew: true });
    cityBoard(ctx, 17, 23.2, 'E', 'SNAKE EYES CASINO', { lift: 9 }); cityBoard(ctx, 37, 23.2, 'W', 'KABOOM! COLA', { lift: 9 });
    mileMarker(ctx, 65.1, 66, 31); mileMarker(ctx, 65.1, 54, 32); mileMarker(ctx, 53.1, 24, 33);
    [36, 24, 12].forEach((x, k) => { const up = x > R.U0 && x < R.D1; if (up) mileMarker(ctx, x, R.at - R.E / ctx.C, 34 + k, { rot: 90, y: ctx.r2(R.hMain(x) + 0.9) }); else mileMarker(ctx, x, R.at - 5.1, 34 + k, { rot: 90 }); });
} };
