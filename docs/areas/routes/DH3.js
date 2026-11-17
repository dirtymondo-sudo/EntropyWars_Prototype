/* DH3 THE DESERT HIGHWAY, Area 51 to Giza: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "wells and a caravan
   stop on it": THE CARAVAN STOP is here, south of the road in the dunes (plots 7,34 and 8,34): camels, a covered wagon, a tent, a fire ring and the
   well (an idea of Claude's for the page's words, of catalogue pieces).
   Squares: the room is 84 x 48; the highway runs east on row 36, north on square x 48, east on row 12.5. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    ctx.clear(13, 41, 34, 46);
    at(ctx, 'covered_wagon', 17.5, 43.6, { face: 90 }); at(ctx, 'camel', 21.4, 42.6, { face: 250 }); at(ctx, 'camel', 23.2, 44.8, { face: 200 }); at(ctx, 'camel', 25.6, 42.4, { face: 300 });
    at(ctx, 'canvas_tent', 29.5, 43.8, { face: 0 }); at(ctx, 'meshy_campfire_ring', 27.2, 44.6, {}); at(ctx, 'ancient_well', 32.4, 42.6, {});
    at(ctx, 'wooden_barrel', 33.2, 44.6, { face: 30 }); at(ctx, 'wooden_bucket', 31.4, 42.0, {}); at(ctx, 'firewood_stack', 30.6, 45.6, { face: 90 });
    gantry(ctx, 22, 38, 'E', 'GIZA · THE PYRAMIDS');
    gantry(ctx, 70, 10.5, 'W', 'AREA 51 · WESTERN TOWN');
} };
