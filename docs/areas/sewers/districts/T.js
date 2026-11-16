/* THE SEWERS, district T · THE RUNNING TUNNELS (5 plots: the Ghost Station, the Loop Line twice, the Crossing, the Depot).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: the subway under the sewers (mondo 11-16: "the subway station can be connected to / a part of the sewers"). Level 1, two levels
   under the culverts; reached by the Maintenance Hatch stair (the Depot) and the rope down the well at the Junction (the Crossing).
   The tool lays the two steel rails along every run of `j` squares. ctx: see W.js.
   STANDS TODAY (first build): the Ghost Station's platform 1 m up with its bench, board and maps; two parked trains in the Depot; torches;
   the old room's four bystanders. NOT YET: the Signal Gantry at the Crossing, the lit train's light, the garden well's rope as a model,
   station tiles on the tunnel walls. */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
module.exports = {
    build(ctx) {
        /* THE GHOST STATION: the platform stands 1 m over the track ("it has a platform and no stairs up": no way out of it but the track) */
        const g = ctx.plot['P00-03'], x0 = ctx.gx(g.sx + 2), x1 = ctx.gx(g.sx + 10), z0 = ctx.gz(g.sy + 2), z1 = ctx.gz(g.sy + 5);
        ctx.feat({ k: 'plateau', x: ctx.r2((x0 + x1) / 2), z: ctx.r2((z0 + z1) / 2), w: ctx.r2(x1 - x0), d: ctx.r2(z1 - z0), h: ctx.r2(g.base + 1), edge: 0.15 });
        ctx.feat({ k: 'ramp', x0: ctx.r2(ctx.gx(g.sx + 10) + 3.5), z0: ctx.gcz(g.sy + 4), x1: ctx.r2(ctx.gx(g.sx + 10) - 0.4), z1: ctx.gcz(g.sy + 4), w: 3.5, h0: g.base, h1: ctx.r2(g.base + 1), stairs: true, model: 'metro', edge: 0.15 });
    },
    plan(ctx) {
        /* the platform's east step needs its square open */
        const g = ctx.plot['P00-03']; for (let lx = 10; lx <= 11; lx++) if (ctx.cell[g.sy + 4][g.sx + lx] === 'x') ctx.cell[g.sy + 4][g.sx + lx] = 'o';
    },
    dress(ctx) {
        const st = ctx.squares('P00-03', 'f').filter(q => q[1] === 2);
        ['metro_bench', 'departures_board', 'tube_map', 'metro_vending', 'metro_bin'].forEach((k, i) => { const q = st[1 + i * 1]; if (q && ctx.free('P00-03', q[0], q[1])) ctx.P(k, 'P00-03', q[0], q[1], { face: 180 }); });
        /* THE DEPOT: a train on each siding */
        [[5, 4], [5, 8]].forEach(q => { const s = ctx.sq('P04-03', q[0], q[1]); ctx.props.push({ key: 'track_bed', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }, { key: 'metro_car', x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), face: 90 }); });
        ctx.plots.forEach((p, i) => { const cs = ctx.corners(p.id), q = nth(cs, i % 3); if (q && ctx.free(p.id, q[0], q[1])) ctx.P('cave_torch', p.id, q[0], q[1]);
            const dry = ctx.squares(p.id, 'o'); for (let k = 4; k < dry.length; k += 11) ctx.dec(k % 2 ? 'paper_sheet' : 'floor_stain', p.id, dry[k][0], dry[k][1]);
            const b = nth(cs, cs.length - 1); if (b && ctx.free(p.id, b[0], b[1]) && i % 2) ctx.P('traffic_barrel', p.id, b[0], b[1]); });
    },
    people(ctx) {
        const O = ctx.O.tunnels, stand = (race, id, list, k) => { const q = nth(list, k || 0); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('skeleton', 'P00-03', ctx.squares('P00-03', 'f').filter(q => q[1] === 3), 3);
        stand('zombie', 'P01-03', ctx.squares('P01-03', 'o'), 6); stand('ai', 'P02-03', ctx.squares('P02-03', 'o'), 5); stand('gangster', 'P04-03', ctx.inner('P04-03'), 2);
    },
};
