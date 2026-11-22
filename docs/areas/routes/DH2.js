/* DH2 THE DESERT HIGHWAY, Western Town to Area 51: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). From the retired Highway room
   (bake-desert.js, Exit 4, the base road): THE TRAILERS, two either side of the road where it turns east for the base, and the conspiracy theorist
   who sits outside them and watches who takes the turn-off (his lines as they were); the wreck on the shoulder.
   Squares: the room is 48 x 60; the highway runs south on square x 12, then east on row 48.5 (the cars at row 46.5 west, 50.5 east). */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, at } = K;
    /* THE FLYOVER (2026-11-22, mondo: the Badlands Highway "should be the standard for how the rest of the highways get built"; DH2.json `raised`, ow-raised.js):
       the north to south run is on ramps (rows 14-23 and 33-42) and a deck 5.5 m up (rows 23-33) over a road on rows 27 and 28 that runs on past the room both ways.
       The leg's straight is too short for an exit (about 30 squares; an exit needs 64), so this is ramps and a deck over a road, to the same standard
       otherwise: barriers, joints, the city's lamps, the telephone line, the city's adverts, mile markers counted on round the Desert Highway. */
    const { cityBoard, poleLine, mileMarker } = K, R = ctx.RAISED, H = R.H;
    /* THE TRAILERS (plots 0,33 1,33 north of the road, 0,34 1,34 south of it) */
    ctx.clear(23, 36, 47, 43); ctx.clear(23, 54, 47, 59);
    at(ctx, 'trailer_home_1', 29.5, 39.6, { face: 0 }); at(ctx, 'trailer_home_3', 41.5, 40.2, { face: 0 });
    at(ctx, 'trailer_home_2', 29.5, 56.6, { face: 180 }); at(ctx, 'trailer_home_5', 41.5, 56.9, { face: 180 });
    at(ctx, 'dish', 35.5, 38.2, {}); at(ctx, 'folding_chair', 34.2, 42.3, { face: 200 }); at(ctx, 'folding_chair', 35.6, 42.6, { face: 170 }); at(ctx, 'retro_radio', 36.6, 42.2, { face: 190 });
    at(ctx, 'campfire', 38.6, 42.1, {}); at(ctx, 'garbage_bag', 36.2, 58.6, { face: 30 }); at(ctx, 'car_suv', 46.0, 55.6, { face: 90 });
    const say = (ctx.SPEC.say || {})['conspiracy theorist'];
    ctx.npc.push(Object.assign({ x: K.mx(ctx, 35), z: K.mz(ctx, 41.2), face: 200, race: 'conspiracy theorist' }, say ? { say } : {}));
    /* the wreck on the shoulder of the long straight (plot -2,32) */
    ctx.clear(2, 18, 7, 24);
    at(ctx, 'crashed_car', 4.5, 21, { face: 30 }); at(ctx, 'skull', 5.6, 23.4, { face: 120 });
    /* THE GANTRIES */
    gantry(ctx, 10, 14, 'S', 'AREA 51');
    gantry(ctx, 26, 50.5, 'E', 'AREA 51 · THE BASE ROAD');
    gantry(ctx, 14, 30, 'N', 'WESTERN TOWN', { y: H });   // (on the deck now)
    /* the wagon of plot -2,32 (the kit's own place stood on the new road under the deck: DH2.json `places` switches it off, its pieces stand here) */
    at(ctx, 'covered_wagon', 3.6, 32.6, { face: 15 }); at(ctx, 'wooden_barrel', 5.6, 32.6, {}); at(ctx, 'cattle_skull', 2.1, 33.7, {}); at(ctx, 'wooden_bucket', 4.9, 33.8, {});
    /* THE ROADSIDE */
    poleLine(ctx, 20.5, 6, 38, { step: 8 });
    cityBoard(ctx, 1.4, 33, 'S', 'MID RECORDS', { lift: 9 }); cityBoard(ctx, 1.4, 11, 'N', 'PHOENIX RECONSTRUCTION', { lift: 9 });
    [6, 18, 30, 42].forEach((y, k) => { const up = y > R.U0 && y < R.D1; if (up) mileMarker(ctx, R.XC - R.E / ctx.C, y, 19 + k, { y: ctx.r2(R.hMain(y) + 0.9) }); else mileMarker(ctx, R.XC - 5.1, y, 19 + k); });
    mileMarker(ctx, 24, 53.6, 23, { rot: 90 }); mileMarker(ctx, 36, 53.6, 24, { rot: 90 });
} };
