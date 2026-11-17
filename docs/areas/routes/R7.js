/* COUNTY LANE (One World route R7, plots 3 to 14), the places made by hand (bake-route.js THE PLAN BY HAND + the dress hook). The test slice, 2026-11-17.
   One thing only: where the lane bends east, a footpath leaves it south. That is the wild link L8 (room site_ow_l8), the walk to the Lake past the long grass. */
'use strict';
module.exports = {
    /* the footpath's first squares: from the lane's south edge down plot (-13, 11) to its south side, on the plot's middle */
    plan(ctx) { const x0 = (-13 - ctx.BX0) * ctx.N + 5, y0 = (11 - ctx.BY0) * ctx.N; for (let y = y0 + 6; y < y0 + ctx.N; y++) for (const x of [x0, x0 + 1]) ctx.path(x, y); },
    dress(ctx) { const x = (-13 - ctx.BX0) * ctx.N + 6, y = (11 - ctx.BY0) * ctx.N + ctx.N - 1;
        ctx.doors.push({ id: 'ow_h_m13_12', wall: 'free', x: ctx.gx(x), z: ctx.gcz(y), face: 180, way: 'trail', label: 'THE TRAIL · THE LONG GRASS', sub: 'THE FOOTPATH SOUTH · TO THE LAKE', action: { room: 'site_ow_l8', at: 'ow_h_m13_12' }, desc: 'A footpath leaves the lane where it bends, off into grass nobody cuts.' });
        if (ctx.walked(x + 2, y - 2) && ctx.free(x + 2, y - 2)) ctx.P('trail_sign', x + 2, y - 2, { face: 0 }); },
};
