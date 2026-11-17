/* ROUTE R1, THE RIVER ROAD — the places made by hand (bake-route.js THE ROUTE KIT hook; One World phase 4.1, 2026-11-17).
   THE TIBER: the design's river (docs/plans/one-world/gen.js RIVERS.tiber, Shasta to the Salt Lake) crosses the road's band on the river meadow,
   world x -5.33 at y -4 to x -5.0 at y -2. It runs north-south across the whole room as a `stream` (deep: you cross it on the bridge), and the
   highway crosses it on a deck: the design page's "the bridge over the Tiber". Nothing the kit scattered stands in the water. */
'use strict';
const TIBER = [[-5.333, -4.05], [-5.4, -3.4], [-5.22, -2.8], [-4.99, -1.95]];   // world plots (gen.js RIVERS.tiber, between its points [-5,-7], [-5.4,-3.4], [-4.4,1])
const distTo = (pts, x, z) => { let best = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return best; };
module.exports = {
    /* the river's squares are nobody's ground (not walked: the places, the trees and the scatter keep off them); the road's own squares stay the road (the bridge) */
    plan(ctx) {
        const { BX0, BY0, N, W, D, cell } = ctx, pts = TIBER.map(p => [(p[0] - BX0) * N, (p[1] - BY0) * N]);
        for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) if ((cell[y][x] === 'g' || cell[y][x] === 'v') && distTo(pts, x + 0.5, y + 0.5) < 2.6) cell[y][x] = 'x';
    },
    dress(ctx) {
        const { BX0, BY0, N, C, W, D, r2, feat, props, F } = ctx, HX = W * C / 2, HZ = D * C / 2, PL = N * C;
        const m = p => [r2((p[0] - BX0) * PL - HX), r2((p[1] - BY0) * PL - HZ)];
        const pts = TIBER.map(m), WIDE = 10.5, CLEAR = WIDE / 2 + 2.5;
        /* nothing in the river or on its banks (props, the kit's trees, rails) */
        const dSeg = (x, z) => { let best = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t)); } return best; };
        const gone = []; for (let i = props.length - 1; i >= 0; i--) if (dSeg(props[i].x, props[i].z) < CLEAR) gone.push(props.splice(i, 1)[0].key);
        console.log('the Tiber: ' + gone.length + ' scattered pieces kept off the water (' + [...new Set(gone)].join(', ') + ')');
        for (let i = F.length - 1; i >= 0; i--) { const f = F[i]; if (f.k === 'tree' && dSeg(f.x, f.z) < CLEAR) F.splice(i, 1); else if (f.k === 'rail' && dSeg((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2) < CLEAR + 8) F.splice(i, 1); }
        /* the west bank between the gate and the river: a walk down it from the road into the lower meadow, kept clear (three squares either side of the plot line) */
        const sq = (x, z) => [Math.floor((x + HX) / C), Math.floor((z + HZ) / C)], bankX = m([-5.333, 0])[0] - CLEAR, lineY = N;
        const onWalk = (x, z) => { const q = sq(x, z); return x < bankX && Math.abs(q[1] + 0.5 - lineY) <= 3; };
        for (let i = props.length - 1; i >= 0; i--) if (onWalk(props[i].x, props[i].z)) props.splice(i, 1);
        for (let i = F.length - 1; i >= 0; i--) if (F[i].k === 'tree' && onWalk(F[i].x, F[i].z)) F.splice(i, 1);
        feat({ k: 'stream', pts, w: WIDE, y: -0.4, depth: 1.6, bank: 2.2, key: 'water' });
        /* THE BRIDGE: the deck where the road's line crosses the river (y -3.62 on the west stretch), past both banks, the road's full width */
        const z = m([0, -3.62])[1], xr = m([-5.37, 0])[0];
        feat({ k: 'deck', x0: r2(xr - 11), z0: z, x1: r2(xr + 11), z1: z, w: 27, y: 0.3 });
    },
};
