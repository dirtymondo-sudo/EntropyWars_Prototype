/* R9 THE BADLANDS HIGHWAY: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "the chain gas station, a motel,
   billboards (Exit 1)". The city chain's gas station, the LAST GAS billboard, the REST AREA gantry and the city-limit sign stood on the old
   Highway room (bake-desert.js, retired now) and are moved here, piece for piece. The motel is an idea of Claude's for the page's "a motel":
   a one-storey row of rooms with an office you can walk into (its rooms are a shell; an inside is for the Desert's interior pass).
   Squares: the room is 24 x 108; the highway's middle line is square x 12 south of the bend, the cars drive at x 10 (south) and x 14 (north). */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, billboard, building, put, at, U } = K;
    /* THE REST STOP (was the Highway's, by Exit 2): the store, the canopy, the sign, a truck at the pumps, on the west side, plots 6,15 and 6,16 */
    ctx.clear(0, 34, 8, 59);
    at(ctx, 'city_gas_canopy', 4.2, 41, { face: 270 }); at(ctx, 'city_gas_store', 3.4, 53.5, { face: 270 }); at(ctx, 'city_gas_sign', 7.6, 35.2, { face: 270 });
    at(ctx, 'car_truck', 5.4, 41.5, { face: 0 }); at(ctx, 'traffic_cone', 7.2, 37.4, { face: 30 }); at(ctx, 'psx_metal_barrel_mp_1', 1.3, 59.2, { face: 80 });
    at(ctx, 'park_bench', 7.0, 47.6, { face: 270 }); at(ctx, 'trash_bin', 7.0, 46.2, { face: 0 });
    /* THE BILLBOARD before it (was the Highway's LAST GAS), read by the traffic heading south from the city */
    billboard(ctx, 4.2, 25, 'S', 'LAST GAS');
    /* THE GANTRIES: the rest area and the Circus for the traffic going south; Exit 1, the city, for the traffic going north */
    gantry(ctx, 10, 30, 'S', 'REST AREA · GAS');
    gantry(ctx, 10, 92, 'S', 'THE CIRCUS · THE DESERT HIGHWAY');
    gantry(ctx, 14, 74, 'N', 'EXIT 1 · DISASTER CITY');
    gantry(ctx, 14, 26, 'N', 'DISASTER CITY · CITY LIMIT');
    /* THE MOTEL (an idea: the page's "a motel"), on the east side on the badlands, plots 7,17 and 7,18: eight rooms in a row, the office at the north end */
    ctx.clear(16, 61, 23, 78);
    const M = building(ctx, 'r9:motel', 19.2, 63, 22.4, 77, 'W', 3.5, { key: U('PlasterWallStucco2a'), tint: 0xe0c8a0, leaf: 'leaf_motel', roofTint: 0x7a3a2a,
        look(A, fw, fd) { for (let i = 0; i < 8; i++) { const lx = -fw / 2 + (i + 0.5) * fw / 8; if (Math.abs(lx) < 1.6) continue; A.box(lx, 0, fd / 2 + 0.03, 0.9, 2.1, 0.06, U('WoodGeneric1a'), 0x6a3e2a); A.box(lx + 1.1, 1.2, fd / 2 + 0.03, 0.8, 0.8, 0.05, U('GlassWindowTall1a'), 0x9fc0d0); }
            A.box(0, 0, fd / 2 + 1.4, fw, 0.15, 2.6, U('ConcreteSlab2a'), 0xbcb4a8);
            A.sign('MOTEL', 0, 3.7, fd / 2 + 0.3, 3.6, 0.9, '#ff6a5a', '#20140c', 'rye'); } });
    billboard(ctx, 18.2, 60.5, 'S', 'MOTEL · VACANCY', { span: 5, bh: 2.0 });
    at(ctx, 'car_suv', 17.6, 70.5, { face: 0 }); at(ctx, 'park_bench', 18.1, 66.4, { face: 90 }); at(ctx, 'trash_bin', 18.1, 75.2, { face: 0 });
    /* THE CITY LIMIT (was the Highway's Exit 1): the green sign, the signpost, a barrel, a skull in the sand */
    ctx.clear(16, 3, 22, 11);
    at(ctx, 'roads_g_sign_003', 17.5, 5.5, { face: 0 }); at(ctx, 'signpost', 19.5, 9.5, { face: 200 }); at(ctx, 'traffic_barrel', 17.2, 10.6, { face: 10 }); at(ctx, 'skull', 21.2, 7.3, { face: 140 });
} };
