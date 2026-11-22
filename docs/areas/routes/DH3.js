/* DH3 THE DESERT HIGHWAY, Area 51 to Giza: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "wells and a caravan
   stop on it": THE CARAVAN STOP is here, south of the road in the dunes (plots 7,34 and 8,34): camels, a covered wagon, a tent, a fire ring and the
   well (an idea of Claude's for the page's words, of catalogue pieces).
   Squares: the room is 84 x 48; the highway runs east on row 36, north on square x 48, east on row 12.5. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    /* THE FLYOVER (2026-11-22, mondo: the Badlands Highway "should be the standard for how the rest of the highways get built"; DH3.json `raised`, ow-raised.js):
       the first east to west run (row 36) is on ramps (columns 16-25 and 33-42) and a deck 5.5 m up (columns 25-33) over a road on columns 28 and 29 that runs on past the room both ways. The caravan stop's east half moved six squares east to let that road through.
       The leg's straight is too short for an exit (about 30 squares; an exit needs 64), so this is ramps and a deck over a road, to the same standard
       otherwise: barriers, joints, the city's lamps, the telephone line, the city's adverts, mile markers counted on round the Desert Highway. */
    const { cityBoard, poleLine, mileMarker } = K, R = ctx.RAISED, H = R.H;
    ctx.clear(13, 41, 40, 46);
    at(ctx, 'covered_wagon', 17.5, 43.6, { face: 90 }); at(ctx, 'camel', 21.4, 42.6, { face: 250 }); at(ctx, 'camel', 23.2, 44.8, { face: 200 }); at(ctx, 'camel', 25.6, 42.4, { face: 300 });
    at(ctx, 'canvas_tent', 35.5, 43.8, { face: 0 }); at(ctx, 'meshy_campfire_ring', 33.2, 44.6, {}); at(ctx, 'ancient_well', 38.4, 42.6, {});
    at(ctx, 'wooden_barrel', 39.2, 44.6, { face: 30 }); at(ctx, 'wooden_bucket', 37.4, 42.0, {}); at(ctx, 'firewood_stack', 36.6, 45.6, { face: 90 });
    gantry(ctx, 22, 38, 'E', 'GIZA · THE PYRAMIDS', { y: R.hMain(22) });   // (on the ramp now)
    /* THE ROADSIDE */
    poleLine(ctx, 27.5, 18, 42, { step: 8, ew: true });
    cityBoard(ctx, 19, 46.9, 'E', 'ICARUS AEROSPACE', { lift: 9 }); cityBoard(ctx, 44, 46.9, 'W', 'PANDORA SHIPPING', { lift: 9 });
    [18, 30, 42].forEach((x, k) => { const up = x > R.U0 && x < R.D1; if (up) mileMarker(ctx, x, R.at + R.E / ctx.C, 25 + k, { rot: 90, y: ctx.r2(R.hMain(x) + 0.9) }); else mileMarker(ctx, x, R.at + 5.1, 25 + k, { rot: 90 }); });
    mileMarker(ctx, 53.1, 24, 28); mileMarker(ctx, 60, 17.6, 29, { rot: 90 }); mileMarker(ctx, 72, 17.6, 30, { rot: 90 });
    gantry(ctx, 70, 10.5, 'W', 'AREA 51 · WESTERN TOWN');
} };
