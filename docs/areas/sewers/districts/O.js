/* THE SEWERS, district O · THE OLD WORKINGS (2 plots: the Old Workings, the Chimney). The mine under the precinct, the lowest level (0).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: older than the city; bricked, flooded, lit by fire. Reached by the rope ladder from the trap under the Drunk Tank (8.75 m) and by
   the climb in the Adit from the Storm Drain. The Chimney's west door is the old portcullis into the Cavern's Oubliette. ctx: see W.js.
   THE MODEL LIST PASS: a skeleton, skulls, parts, a bucket, mushrooms. STANDS TODAY (first build): the Flood (waded), torches, a brazier, bones, a signpost, the old room's two bystanders.
   NOT YET: the Sump (deep, never waded), the Pump Ledge, the Chimney's shaft (3.9 m) as a thing to look up. */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
module.exports = {
    dress(ctx) {
        ['P01-01', 'P00-01'].forEach((id, i) => {
            const cs = ctx.corners(id); [0, cs.length - 1].forEach(k => { const q = cs[k]; if (q && ctx.free(id, q[0], q[1])) ctx.P('cave_torch', id, q[0], q[1]); });
            const mid = ctx.inner(id), q = nth(mid, 3 + i * 4); if (q) ctx.P(i ? 'skull_pile' : 'brazier', id, q[0], q[1]);
            for (let k = 1; k < cs.length - 1; k += 3) { const q2 = cs[k]; if (ctx.free(id, q2[0], q2[1])) ctx.dec(['skull_pile', 'psx_cobweb_2', 'psx_wooden_crate_3', 'psx_cobweb_1'][k % 4], id, q2[0], q2[1]); }   // the grime pass
            const dry = ctx.squares(id, 'o'); for (let k = 6; k < dry.length; k += 12) ctx.dec('floor_stain', id, dry[k][0], dry[k][1]);
        });
        /* a blocker on the k-th free square of a list, decor on the k-th square (THE MODEL LIST PASS helpers) */
        const putP = (key, id, list, k, o) => { for (let i = Math.max(0, Math.min(list.length - 1, k)); i < list.length; i++) { const q = list[i]; if (ctx.free(id, q[0], q[1])) { ctx.P(key, id, q[0], q[1], o); return true; } } return false; };
        const putD = (key, id, list, k) => { const q = nth(list, k); if (q) ctx.dec(key, id, q[0], q[1]); };
        /* THE MODEL LIST PASS (mondo 11-16): MODEL_LIST.md searched for mine, bone, skull, well, bucket. A skeleton against the wall, skulls
           and parts in the flood's edge, a bucket, pale mushrooms. */
        putP('anatomy_skeleton', 'P01-01', ctx.corners('P01-01'), 2); [3, 7, 12].forEach(k => putD('skull', 'P01-01', ctx.inner('P01-01'), k)); putD('hw_part_3', 'P01-01', ctx.inner('P01-01'), 15); putD('hw_part', 'P00-01', ctx.inner('P00-01'), 6);
        putD('wooden_bucket', 'P00-01', ctx.inner('P00-01'), 9); [1, 4].forEach(k => putD('mushroom2', 'P00-01', ctx.corners('P00-01'), k)); putD('mushroom2', 'P01-01', ctx.corners('P01-01'), 5);
        const s = nth(ctx.inner('P00-01'), 0); if (s) ctx.P('signpost', 'P00-01', s[0], s[1]);
    },
    people(ctx) {
        const O = ctx.O.workings, stand = (race, id, k) => { const q = nth(ctx.inner(id), k); if (q) ctx.native(race, id, q[0], q[1], 90, ctx.sayOf(O, race)); };
        stand('ghoul', 'P01-01', 9); stand('skeleton', 'P00-01', 12);
    },
};
