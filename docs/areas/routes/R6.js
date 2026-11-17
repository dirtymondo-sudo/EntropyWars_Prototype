/* R6 THE VALLEY ROAD: the plan and the places by hand (One World BUILD_PLAN phase 4.2, 2026-11-17). The design page: "down the Tiber valley past the
   water mill and over the covered bridge to the city". The road leaves the Woods' Tunnel Way, bends east over the Tiber (a stream through the river
   meadow, crossed by a covered bridge) past the water mill on its east bank, and runs on to Disaster City's west side. The map's band reaches five
   plots west of the Tunnel Way: a spur of the road runs out there to a turning place in the open woodland. The mill and the bridge are ideas of
   Claude's for the page's words, built of the game's own pieces (a texbuilding you can walk into, `arch` rows, the stream and bridge rows).
   Squares: the room is 144 x 36; the road's line is row 12 west of the bend, row 23.5 east of it. */
'use strict';
const K = require('./south-kit.js');
const TIBER_X = 74.4;   // the river's middle, squares (world x -5.8)
module.exports = {
    plan(ctx) { for (let x = 6; x <= 66; x++) for (let y = 11; y <= 13; y++) ctx.path(x, y); for (let x = 3; x <= 8; x++) for (let y = 9; y <= 15; y++) ctx.path(x, y); },
    dress(ctx) {
        const { building, at, mx, mz, U, WD } = K, r2 = ctx.r2;
        /* THE TIBER: a stream down the river meadow, north to south across the room, under the bridge */
        let lo = 99; for (let y = 0; y < 36; y++) lo = Math.min(lo, ctx.hAt(TIBER_X, y));
        ctx.clear(71, 0, 78, 35);
        ctx.feat({ k: 'stream', pts: [[mx(ctx, TIBER_X), mz(ctx, 0.2)], [mx(ctx, TIBER_X + 0.6), mz(ctx, 12)], [mx(ctx, TIBER_X - 0.4), mz(ctx, 35.8)]], w: 7, y: r2(lo - 0.15), depth: 0.6 });
        /* THE COVERED BRIDGE: a deck over the water on the road's line, timber walls to the rail and a gabled roof over it */
        const y0 = r2(lo + 0.35), bx0 = 69.6, bx1 = 79.2;
        ctx.feat({ k: 'bridge', x0: mx(ctx, bx0), z0: mz(ctx, 12), x1: mx(ctx, bx1), z1: mz(ctx, 12), w: 8.75, y: y0, key: 'urban:WoodFlooring1d' });
        const L = r2((bx1 - bx0) * ctx.C), P = [];
        for (const s of [-1, 1]) { P.push({ s: 'box', p: [0, 0, r2(s * 4.2)], size: [L, 1.1, 0.25], key: WD, tint: 0x8a3a28 }, { s: 'box', p: [0, 2.9, r2(s * 4.2)], size: [L, 1.4, 0.25], key: WD, tint: 0x8a3a28 });
            for (let i = 0; i <= 6; i++) P.push({ s: 'box', p: [r2(-L / 2 + i * L / 6), 0, r2(s * 4.2)], size: [0.3, 4.3, 0.3], key: U('WoodGeneric1a'), tint: 0x5a3020 }); }
        P.push({ s: 'roof', form: 'gable', size: [r2(L + 1.2), 2.4, 9.6], p: [0, 4.3, 0], over: 0.5, key: U('MetalCorrugated1a'), tint: 0x6a5a4a, keyEnd: WD, roof: true });
        ctx.feat({ k: 'arch', id: 'ow:r6:bridge', x: mx(ctx, (bx0 + bx1) / 2), z: mz(ctx, 12), rot: 0, y: y0, parts: P });
        /* THE WATER MILL on the east bank south of the road: a timber mill house you can walk into, its wheel turning in the river */
        const M = building(ctx, 'r6:mill', 77.6, 26, 82.4, 31.6, 'N', 5.25, { key: WD, tint: 0x9a7a58, roof: 'gable', roofH: 2.2, roofTint: 0x5a4a3a, look(A, fw, fd) {
            A.box(0, 0, 0, fw + 0.2, 0.8, fd + 0.2, U('BrickMasonry2a'), 0x9a948a);
            A.cyl(-fw / 2 - 1.3, 0.3, 0, 2.6, 0.9, WD, 0x6a4a30, { ry: 90, seg: 16, ri: 2.1 });
            for (let i = 0; i < 8; i++) A.box(-fw / 2 - 1.3, 2.9, 0, 0.9, 0.18, 5.0, U('WoodGeneric1a'), 0x5a3a22, { ry: 0 }); } });
        at(ctx, 'wooden_barrel', 83.2, 25.8, { face: 20 }); at(ctx, 'hay_bale', 84, 30.5, { face: 80 }); at(ctx, 'wheelbarrow', 83.4, 27.6, { face: 200 });
        /* THE TURNING PLACE at the spur's west end, in the open woodland: a log pile and a cart */
        at(ctx, 'firewood_stack', 3.2, 8.6, { face: 0 }); at(ctx, 'hay_cart', 9.6, 17.4, { face: 90 });
    },
};
