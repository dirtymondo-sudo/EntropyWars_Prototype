/* THE CAVERN, district K · THE CAVERN (13 plots: the two north rows + the Mouth, P02-02). One thread a file (docs/notes/claims.md). Read by
   `node bake-cavern.js`; rules: docs/notes/areas-complexes.md "THE CAVERN ON PLOTS" + "THE CAVERN, THE ZONE KIT".
   BRIEF: the dark cave under the crust, the crossroads of everything below. A loop over three tiers: the Crossroads (level 4) > the Terrace
   and its fall > up to the Shelf (8) > up to the High Tier (12) > Level −6's cut rock > down to the Spur (8) > the rope bridge over the lava
   chasm > the Hot Shelf and its lava lake > the Fissure (the way to Hell) > down the Long Ramp (4) > the River Chamber > the Crossroads.
   Off the loop: the Crystal Adit (down from the Shelf; on south into Agartha), the Oubliette (a step down from the Adit; the Sewers, DOOR
   HQ's cell), the Mouth (south of the Crossroads: the Lip over Hollow Earth, the long stair down).
   THE LIGHT: torch amber, and the lava's red on the hot side (the room's third big light). No daylight but what comes in at the Mouth.
   A plot's squares are local (lx, ly 0..11 from its north-west corner). ctx: bake-cavern.js CTX (the Sewers' own: P, dec, native, sq,
   squares, corners, inner, free, plot, feat, props, counters, O = the old rooms' people, lines and door plates).
   STANDS TODAY: see the STANDS / NOT YET list at the end of this header; the pilot's passes are logged in the notes.
   STANDS (first build): torches at the bends, the old rooms' pieces re-homed (the Needle's menhir, the stocks and cot, the crystals of the
   Adit, the bulbs of Level −6, the candle rings), the Healing Zone, six bystanders with their old lines.
   NOT YET: everything a pass makes (see the notes). */
'use strict';
const CROSS = 'P02-01';
module.exports = {
    suns(ctx) { const s = ctx.sq('P01-00', 6, 4), b = ctx.plot['P01-00'].base; return [{ x: ctx.gcx(s[0]), y: ctx.r2(b + 2.2), z: ctx.gcz(s[1]), color: 0xff5a20, intensity: 1.5, dist: 46, decay: 1.4 }]; },
    build(ctx) {
        /* the Healing Zone, the old Cavern's own, by the Crossroads' way in */
        const hz = (ctx.O.gallery.c || []).find(c => c.id === 'healzone'), s = ctx.sq(CROSS, 7, 4);
        if (hz) { ctx.taken.add(s[0] + ':' + s[1]); ctx.counters.push(Object.assign({}, hz, { x: ctx.gcx(s[0]), z: ctx.gcz(s[1]), plateY: ctx.r2(ctx.plot[CROSS].base + 2.35) })); }
    },
    dress(ctx) {
        const put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); };
        /* a torch in two corners of every plot: the first two bends the plan gives */
        ctx.plots.forEach(p => { const c = ctx.corners(p.id); [c[0], c[c.length - 1]].forEach(q => { if (q) put('cave_torch', p.id, q[0], q[1], { noLight: !['P02-01', 'P03-01', 'P02-02', 'P00-01', 'P05-01'].includes(p.id) }); }); });
        put('menhir', CROSS, 6, 6, { h: 5.2 });                                   // THE NEEDLE
        put('ancient_well', CROSS, 2, 4);                                         // the cellar well's head, beside its rope
        put('stocks', 'P05-00', 4, 4); put('cot', 'P05-00', 8, 3); ctx.dec('candleRing', 'P05-00', 6, 7); ctx.dec('skull_pile', 'P05-00', 3, 8);
        [[5, 3], [6, 8], [9, 6], [8, 9]].forEach(q => put('meshy_crystal_shards', 'P05-01', q[0], q[1], { h: 1.6 })); put('crystal_cluster', 'P05-01', 9, 7);
        const bulb = (id, lx, ly) => { const q = ctx.sq(id, lx, ly); ctx.props.push({ key: 'bare_bulb', x: ctx.gcx(q[0]), z: ctx.gcz(q[1]), ceil: true, y: ctx.r2(ctx.plot[id].base + 4.6), noLight: true }); };
        bulb('P03-00', 4, 5); bulb('P03-00', 8, 5); ctx.dec('cardboard_boxes', 'P03-00', 3, 8); ctx.dec('paper_sheet', 'P03-00', 7, 7);
        ctx.dec('candleRing', 'P00-00', 7, 6); ctx.dec('candleRing', 'P02-02', 6, 5);
        put('rope_bridge', 'P02-00', 5, 6); put('mine_cart', 'P05-01', 5, 9); ctx.dec('pickaxe', 'P05-01', 6, 2);
    },
    people(ctx) {
        const O = ctx.O;
        ctx.native('ghoul', CROSS, 8, 7, 300, ctx.sayOf(O.gallery, 'ghoul')); ctx.native('gnome', CROSS, 3, 7, 160, ctx.sayOf(O.gallery, 'gnome'));
        ctx.native('gnome', 'P05-01', 6, 5, 250, ctx.sayOf(O.adit, 'gnome')); ctx.native('reptilian', 'P02-02', 7, 9, 180, ctx.sayOf(O.mouth, 'reptilian'));
        ctx.native('ghoul', 'P05-00', 6, 4, 180); ctx.native('reptilian', 'P01-00', 8, 7, 0);
    },
};
