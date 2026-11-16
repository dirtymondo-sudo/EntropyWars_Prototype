/* THE SEWERS, district W · THE SEWERS (15 plots: the culverts, the Junction, the Cistern, the Pump Room, the Outfall).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: a dungeon, dark, grimy, scary (mondo 11-16). Brick culverts that bend, fork and stop; the water steps down over the falls from the
   north row to the Outfall. Lit by few fires only. Names are the old Sewers' own sub-areas and door plates: invent none.
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: P (a blocker on a square's middle), dec (decor, off centre),
   native (a bystander), feat (a terrain row), squares / corners / inner / walled (lists of local squares), plot[id].base (its floor, m).
   STANDS TODAY (first build): torches on the bends, the Pump Room's boiler, the Junction's brazier + Healing Zone, the Inspection Gallery
   on its step, barrels / grates / stains, the old room's four bystanders. NOT YET: pipes along the walls, graffiti, the Cistern's rail,
   anything to look at in the 11 plain culvert plots' dead ends. */
'use strict';
const nth = (list, i) => list.length ? list[Math.min(list.length - 1, Math.max(0, i))] : null;
module.exports = {
    /* tanks nobody wades */
    deep: ['P04-01'],
    build(ctx) {
        /* THE INSPECTION GALLERY: the room's north part stands 1.6 m up its stair, looking down on the culvert */
        const g = ctx.plot['P05-00'], x0 = ctx.gx(g.sx + 8), x1 = ctx.gx(g.sx + 11), z0 = ctx.gz(g.sy + 2), z1 = ctx.gz(g.sy + 6);
        ctx.feat({ k: 'plateau', x: ctx.r2((x0 + x1) / 2), z: ctx.r2((z0 + z1) / 2), w: ctx.r2(x1 - x0), d: ctx.r2(z1 - z0), h: ctx.r2(g.base + 1.6), edge: 0.15 });
        ctx.feat({ k: 'ramp', x0: ctx.gcx(g.sx + 9), z0: ctx.gz(g.sy + 8), x1: ctx.gcx(g.sx + 9), z1: ctx.r2(ctx.gz(g.sy + 6) - 0.4), w: 3.5, h0: g.base, h1: ctx.r2(g.base + 1.6), stairs: true, model: 'grate', edge: 0.15 });
        /* THE HEALING ZONE at the Junction (the old Sewers' own counter, moved with its words) */
        const hz = ctx.O.sewers.c.find(c => c.id === 'healzone');
        if (hz) { const s = ctx.sq('P02-02', 8, 8); ctx.counters.push(Object.assign({}, hz, { x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), plateY: ctx.r2(ctx.plot['P02-02'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
    },
    dress(ctx) {
        ctx.plots.forEach((p, i) => {
            const cs = ctx.corners(p.id);
            /* a torch on two bends of every plot: the only light in the culverts */
            [0, Math.floor(cs.length / 2)].forEach(k => { const q = cs[k]; if (q && ctx.free(p.id, q[0], q[1])) ctx.P('cave_torch', p.id, q[0], q[1]); });
            const dry = ctx.squares(p.id, 'o');
            for (let k = 3 + (i % 4); k < dry.length; k += 9) { const q = dry[k]; ctx.dec(['floor_stain', 'paper_sheet', 'floor_drain', 'floor_stain'][(k + i) % 4], p.id, q[0], q[1]); }
            const tip = nth(ctx.corners(p.id), 1 + (i % 3)); if (tip && ctx.free(p.id, tip[0], tip[1]) && i % 2 === 0) ctx.P(i % 4 ? 'traffic_barrel' : 'cardboard_boxes', p.id, tip[0], tip[1]);
        });
        /* the rooms */
        const pr = ctx.inner('P04-00'); { const q = nth(pr, Math.floor(pr.length / 2)); if (q) ctx.P('boiler', 'P04-00', q[0], q[1]); }
        const jn = ctx.inner('P02-02'); { const q = nth(jn, 0); if (q) ctx.P('brazier', 'P02-02', q[0], q[1]); }
        ['P03-00', 'P05-02', 'P05-03'].forEach(id => { const w = ctx.walled(id), q = nth(w, 1); if (q) ctx.P('traffic_barrel', id, q[0], q[1]); const r = nth(ctx.walled(id), 4); if (r) ctx.dec('wet_floor_sign', id, r[0], r[1]); });
        ctx.squares('P05-00', 'f').filter(q => q[1] <= 5).slice(0, 2).forEach(q => ctx.dec('drain_grate', 'P05-00', q[0], q[1]));
    },
    people(ctx) {
        const O = ctx.O.sewers, stand = (race, id, k) => { const l = ctx.inner(id).concat(ctx.walled(id)), q = nth(l, k || 0); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('ghoul', 'P03-00'); stand('gangster', 'P02-02', 3); stand('zombie', 'P05-03'); stand('conspiracy theorist', 'P04-01');
    },
};
