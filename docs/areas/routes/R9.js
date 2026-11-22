/* R9 THE BADLANDS HIGHWAY: the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "the chain gas station, a motel,
   billboards (Exit 1)". The city chain's gas station, the LAST GAS billboard, the REST AREA gantry and the city-limit sign stood on the old
   Highway room (bake-desert.js, retired now) and are moved here, piece for piece. The motel is an idea of Claude's for the page's "a motel":
   a one-storey row of rooms with an office you can walk into (its rooms are a shell; an inside is for the Desert's interior pass).
   THE RAISED HIGHWAY (2026-11-22, mondo: "actual highway architecture, raised off the ground with exits and stuff"): the road is on ramps and a deck
   7 m up now (R9.json `raised`, ow-raised.js), with one exit. The room is four plots wide at the exit (R9.json `add`): the gas station stands on
   the two plots west of the exit's ramps, north of the road under the deck; the motel on the two plots east of them, south of it. Nothing was taken away.
   Squares: the room is 48 x 108; the highway's middle line is square x 24 south of the bend, the cars drive at x 22 (south) and x 26 (north); the
   deck is rows 33 to 87, the exit's ramps are columns 17-18 and 29-30, the road under the deck is rows 59 and 60. */
'use strict';
const K = require('./south-kit.js');
module.exports = { dress(ctx) {
    const { gantry, billboard, cityBoard, poleLine, mileMarker, building, at, U } = K, R = ctx.RAISED, H = R.H;
    const pave = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ctx.setPaint(x, y, ctx.ASPH); };
    /* THE REST STOP (was the Highway's, by Exit 2): the store, the canopy, the sign, a truck at the pumps; west of the exit, on a forecourt that opens
       onto the lane from the ramp's foot and onto the road under the deck */
    ctx.clear(1, 37, 16, 58); pave(2, 45, 15, 58);
    at(ctx, 'city_gas_store', 9.5, 41.5, { face: 0 }); at(ctx, 'city_gas_canopy', 9.5, 51.5, { face: 270 }); at(ctx, 'city_gas_sign', 14.6, 56.6, { face: 270 });
    at(ctx, 'car_truck', 10.7, 52, { face: 0 }); at(ctx, 'traffic_cone', 13.6, 48.2, { face: 30 }); at(ctx, 'psx_metal_barrel_mp_1', 14.6, 43.2, { face: 80 });
    at(ctx, 'park_bench', 5.2, 45.2, { face: 0 }); at(ctx, 'trash_bin', 6.6, 45.2, { face: 0 });
    /* THE BILLBOARD before it (was the Highway's LAST GAS), read by the traffic heading south from the city */
    billboard(ctx, 15.2, 25, 'S', 'LAST GAS');
    /* THE GANTRIES: the exit for both ways (on the deck), the Circus for the traffic going south; Exit 1, the city, for the traffic going north */
    gantry(ctx, 22, 30.5, 'S', 'EXIT · GAS · MOTEL', { y: R.hMain(30.5) });   // before the exit lane opens (a post in the lane otherwise)
    gantry(ctx, 26, 89.5, 'N', 'EXIT · GAS · MOTEL', { y: R.hMain(89.5) });
    gantry(ctx, 22, 102, 'S', 'THE CIRCUS · THE DESERT HIGHWAY');
    gantry(ctx, 26, 64, 'N', 'EXIT 1 · DISASTER CITY', { y: H });
    gantry(ctx, 26, 18.6, 'N', 'DISASTER CITY · CITY LIMIT');
    /* THE MOTEL (an idea: the page's "a motel"), east of the exit, south of the road under the deck: eight rooms in a row, the office at the north end,
       a car park between it and the ramp */
    ctx.clear(32, 61, 46, 82); pave(32, 61, 38, 68); pave(32, 69, 38, 79);
    building(ctx, 'r9:motel', 39.2, 63, 42.4, 77, 'W', 3.5, { key: U('PlasterWallStucco2a'), tint: 0xe0c8a0, leaf: 'leaf_motel', roofTint: 0x7a3a2a,
        look(A, fw, fd) { for (let i = 0; i < 8; i++) { const lx = -fw / 2 + (i + 0.5) * fw / 8; if (Math.abs(lx) < 1.6) continue; A.box(lx, 0, fd / 2 + 0.03, 0.9, 2.1, 0.06, U('WoodGeneric1a'), 0x6a3e2a); A.box(lx + 1.1, 1.2, fd / 2 + 0.03, 0.8, 0.8, 0.05, U('GlassWindowTall1a'), 0x9fc0d0); }
            A.box(0, 0, fd / 2 + 1.4, fw, 0.15, 2.6, U('ConcreteSlab2a'), 0xbcb4a8);
            A.sign('MOTEL', 0, 3.7, fd / 2 + 0.3, 3.6, 0.9, '#ff6a5a', '#20140c', 'rye'); } });
    billboard(ctx, 35.5, 62.4, 'E', 'MOTEL · VACANCY', { span: 5, bh: 2.0 });
    at(ctx, 'car_suv', 33.6, 71.5, { face: 0 }); at(ctx, 'park_bench', 38.1, 66.4, { face: 90 }); at(ctx, 'trash_bin', 38.1, 75.2, { face: 0 });
    /* THE ROADSIDE (2026-11-22, mondo: "Telephone poles? Billboards from the city? Mile markers?"):
       · the telephone line down the east side, clear of the ramps' walls, a pole every eight squares (none on the road under the deck);
       · four of Disaster City's own adverts on tall boards: two beside the deck (read from up there), one at each end on the ground;
       · a mile marker a plot on the south-bound side, counted from the city (on the parapet where the road is raised) */
    poleLine(ctx, 32.5, 6.5, 102.5, { step: 8 });
    cityBoard(ctx, 13.2, 72, 'S', 'ACT OF GOD INSURANCE', { lift: 9 }); cityBoard(ctx, 34.8, 44, 'N', 'MELTDOWN BURGER', { lift: 9 });
    cityBoard(ctx, 29.5, 15, 'N', 'KABOOM! COLA'); cityBoard(ctx, 16.6, 104.5, 'S', 'SNAKE EYES CASINO');
    { const L = ctx.LINE, xAt = y => { for (let i = 0; i + 1 < L.length; i++) { const a = L[i], b = L[i + 1]; if (y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1]) && Math.abs(b[1] - a[1]) > 1e-6) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return R.XC; };
      for (let k = 0; k < 9; k++) { const y = 6 + 12 * k, raised = y > R.U0 && y < R.D1;
          if (raised) { if (y > R.U1 - 1 && y < R.D0 + 1 && Math.min(y - R.U1, R.D0 - y) < 13) continue; mileMarker(ctx, R.XC - (R.E + 0.0) / ctx.C, y, k + 1, { y: ctx.r2(R.hMain(y) + 0.9) }); }
          else mileMarker(ctx, xAt(y) - 5.1, y, k + 1); } }
    /* THE CITY LIMIT (was the Highway's Exit 1): the green sign, the signpost, a barrel, a skull in the sand */
    ctx.clear(28, 3, 34, 11);
    at(ctx, 'roads_g_sign_003', 29.5, 5.5, { face: 0 }); at(ctx, 'signpost', 31.5, 9.5, { face: 200 }); at(ctx, 'traffic_barrel', 29.2, 10.6, { face: 10 }); at(ctx, 'skull', 33.2, 7.3, { face: 140 });
} };
