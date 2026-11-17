/* DH4 THE DESERT HIGHWAY, Giza to the Circus: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). From the retired Highway room
   (bake-desert.js, where the road met the Giza road): its last signpost and two barrels, by the road at the Giza end.
   Squares: the room is 72 x 84; the highway runs north on square x 60 (54 at the end by Giza), west on square x 48, west on row 12.5. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    ctx.clear(63, 76, 70, 82);
    at(ctx, 'signpost', 65.5, 79.5, { face: 0 }); at(ctx, 'traffic_barrel', 64.6, 81.6, { face: 20 }); at(ctx, 'traffic_barrel', 67.2, 81.2, { face: 80 });
    gantry(ctx, 62, 62, 'N', 'THE CIRCUS · WESTERN TOWN');
    gantry(ctx, 58, 44, 'S', 'GIZA · THE PYRAMIDS');
    gantry(ctx, 32, 10.5, 'W', 'THE CIRCUS');
} };
