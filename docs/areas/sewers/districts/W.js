/* THE SEWERS, district W · THE SEWERS (15 plots: the culverts, the Junction, the Cistern, the Pump Room, the Outfall).
   One thread a file (docs/notes/claims.md). Read by `node bake-sewers.js`; rules: docs/notes/areas-complexes.md "THE SEWERS ON PLOTS".
   BRIEF: a dungeon, dark, grimy, scary (mondo 11-16). Brick culverts that bend, fork and stop; the water steps down over the falls from the
   north row to the Outfall. Lit by few fires only. Names are the old Sewers' own sub-areas and door plates: invent none.
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: P (a blocker on a square's middle), dec (decor, off centre),
   native (a bystander), feat (a terrain row), squares / corners / inner / walled (lists of local squares), plot[id].base (its floor, m).
   STANDS TODAY (build 4: the tool vaults every tunnel and roofs every plot; ctx.pier / ctx.ceil): torches on the bends, the Pump Room's boiler, the Junction's brazier + Healing Zone, the Inspection Gallery
   on its step, barrels / grates / stains, the old room's four bystanders. THE MODEL LIST PASS: pump, gauge board, hoist, lever, dumpster, tyres, a body at the Outfall, litter, drains, mushrooms. THE GRIME PASS: the tool lays slime lines, rusted mains, floor decals; here: rubbish in the bends, cobwebs, valves. NOT YET: graffiti, drips, the Cistern's rail,
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
        /* THE JUNCTION'S PIERS: four brick piers round the pool, floor to vault; the Cistern's and the Outfall's, two each by the fall */
        [[4, 4], [8, 4], [4, 8], [8, 8]].forEach(q => ctx.pier('P02-02', q[0], q[1]));
        [[2, 2], [2, 10]].forEach(q => ctx.pier('P04-01', q[0], q[1])); [[3, 4], [9, 4]].forEach(q => ctx.pier('P05-03', q[0], q[1]));
        /* THE HEALING ZONE at the Junction (the old Sewers' own counter, moved with its words) */
        const hz = ctx.O.sewers.c.find(c => c.id === 'healzone');
        if (hz) { const s = ctx.sq('P02-02', 4, 9); ctx.counters.push(Object.assign({}, hz, { x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), plateY: ctx.r2(ctx.plot['P02-02'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
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
        /* THE GRIME PASS (mondo 11-16): rubbish washed into the bends and dead ends, cobwebs in the corners, a valve by the pumps */
        const RUB = ['garbage_bags', 'garbage_bag', 'metal_trash_can', 'psx_metal_barrel_mp_1', 'psx_wooden_crate_3', 'garbage_bag', 'psx_metal_barrel_mp_3'];
        ctx.plots.forEach((p, i) => { const cs = ctx.corners(p.id);
            for (let k = 2 + (i % 3); k < cs.length; k += 4) { const q = cs[k]; if (ctx.free(p.id, q[0], q[1])) ctx.dec(RUB[(k + i) % RUB.length], p.id, q[0], q[1]); }
            for (let k = 1; k < cs.length; k += 5) { const q = cs[k]; ctx.dec(k % 2 ? 'psx_cobweb_1' : 'psx_cobweb_2', p.id, q[0], q[1]); } });
        ['P04-00', 'P03-00'].forEach(id => { const q = nth(ctx.walled(id), 2); if (q && ctx.free(id, q[0], q[1])) ctx.P('gate_valve', id, q[0], q[1]); });
        ctx.grime('blood', 'P05-03', 4, 11, 1.3);
        /* a blocker on the k-th free square of a list, decor on the k-th square (THE MODEL LIST PASS helpers) */
        const putP = (key, id, list, k, o) => { for (let i = Math.max(0, Math.min(list.length - 1, k)); i < list.length; i++) { const q = list[i]; if (ctx.free(id, q[0], q[1])) { ctx.P(key, id, q[0], q[1], o); return true; } } return false; };
        const putD = (key, id, list, k) => { const q = nth(list, k); if (q) ctx.dec(key, id, q[0], q[1]); };
        /* THE MODEL LIST PASS (mondo 11-16: "look at the model list right now to see what else they could add"): MODEL_LIST.md searched for
           sewer, pump, pipe, drain, rubbish, body. THE PUMP ROOM: a centrifugal pump, the gauge board, a utility box, a valve stand.
           THE PUMPING STATION: a chain hoist and a lever. THE JUNCTION: a dumpster, tyres, cones, a mop bucket. THE OUTFALL: what the
           water brought down (a body, parts, a fish's bones). Litter on every walk; round drains; pale mushrooms in the dead ends. */
        putP('centrifugal_pump', 'P04-00', ctx.inner('P04-00'), 1); putP('gauge_board', 'P04-00', ctx.walled('P04-00'), 5, { face: 180 }); putP('utility_box', 'P04-00', ctx.walled('P04-00'), 8); putP('psx_pipe_valve_holder_large_1', 'P04-00', ctx.walled('P04-00'), 11);
        putP('chain_hoist', 'P03-00', ctx.walled('P03-00'), 5); putP('pd_lever', 'P03-00', ctx.walled('P03-00'), 7);
        putP('dumpster', 'P02-02', ctx.walled('P02-02'), 6); putP('tire_stack', 'P02-02', ctx.walled('P02-02'), 9); putD('traffic_cone', 'P02-02', ctx.inner('P02-02'), 5); putD('traffic_cone', 'P02-02', ctx.inner('P02-02'), 9); putD('mop_bucket', 'P02-02', ctx.walled('P02-02'), 12);
        { const w = ctx.walled('P05-03'); putD('hw_body', 'P05-03', w, 7); putD('hw_part_3', 'P05-03', w, 9); putD('hw_part', 'P05-03', w, 12); putD('psx_fish_skeleton_mp_1', 'P05-03', w, 3); }
        const LITTER = ['psx_glass_bottle_1', 'psx_tin_can_mp_1_rusty', 'newspaper_bundles', 'psx_syringe_mp_1', 'psx_jerrycan_1', 'psx_tin_can_mp_1_rusty', 'meshy_round_street_drain', 'psx_glass_bottle_1'];
        ctx.plots.forEach((p, i) => { const dry = ctx.squares(p.id, 'o'); for (let k = 5 + (i % 5); k < dry.length; k += 8) ctx.dec(LITTER[(k + i) % LITTER.length], p.id, dry[k][0], dry[k][1]);
            const cs = ctx.corners(p.id), m = nth(cs, cs.length - 1 - (i % 2)); if (m && i % 3 === 0) ctx.dec('mushroom2', p.id, m[0], m[1]); });
        /* the rooms */
        const pr = ctx.inner('P04-00'); { const q = nth(pr, Math.floor(pr.length / 2)); if (q) ctx.P('boiler', 'P04-00', q[0], q[1]); }
        { const w = ctx.walled('P02-02'); [2, Math.floor(w.length / 2), w.length - 3].forEach(k => { const q = nth(w, k); if (q && ctx.free('P02-02', q[0], q[1])) ctx.P('cave_torch', 'P02-02', q[0], q[1]); }); }   // the hall's own fires
        const jn = ctx.inner('P02-02'); { const q = nth(jn, 0); if (q) ctx.P('brazier', 'P02-02', q[0], q[1]); }
        ['P03-00', 'P05-02', 'P05-03'].forEach(id => { const w = ctx.walled(id), q = nth(w, 1); if (q) ctx.P('traffic_barrel', id, q[0], q[1]); const r = nth(ctx.walled(id), 4); if (r) ctx.dec('wet_floor_sign', id, r[0], r[1]); });
        ctx.squares('P05-00', 'f').filter(q => q[1] <= 5).slice(0, 2).forEach(q => ctx.dec('drain_grate', 'P05-00', q[0], q[1]));
    },
    people(ctx) {
        const O = ctx.O.sewers, stand = (race, id, k) => { const l = ctx.inner(id).concat(ctx.walled(id)), q = nth(l, k || 0); if (q) ctx.native(race, id, q[0], q[1], 180, ctx.sayOf(O, race)); };
        stand('ghoul', 'P03-00'); stand('gangster', 'P02-02', 3); stand('zombie', 'P05-03'); stand('conspiracy theorist', 'P04-01');
    },
};
