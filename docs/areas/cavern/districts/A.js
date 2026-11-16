/* THE CAVERN, district A · AGARTHA, THE CRYSTAL CITY (12 plots, the south-east). One thread a file (docs/notes/claims.md). Read by
   `node bake-cavern.js`; rules: docs/notes/areas-complexes.md "THE CAVERN ON PLOTS" + "THE CAVERN, THE ZONE KIT".
   BRIEF: a shining city of white terraces round THE SPIRE (P04-03), which is lit from inside and lights the city (the room's second big
   light). The upper city (level 4): the Gallery, the Upper Terrace, the Adit Terrace (where the Crystal Adit comes out). The Spire's
   terrace (2): the Lower Terrace and its canal, the Spire, the Lemuria Stair (Mount Shasta; the Woods' trail). The lower city (0): the Lake
   (deep; the canal pours into it), the Plaza, the East Gate (Technoticlan), the Pier, the Inner Gate (Bay 3's door), the Admiral's Tunnel
   (Antarctica). Who lives here: crystal guardian, nordic, machine elves; the Loch Ness Monster in the lake.
   STANDS (first build): the Spire, columns along the paved ways, crystals, the fountain and benches of the Plaza, the telescope and
   lectern on the Upper Terrace, the old room's braziers and garden rings, the BATTLE marker, six bystanders with the old lines.
   NOT YET: the district's five passes (no house stands: the old room had none either). */
'use strict';
const SPIRE = 'P04-03';
module.exports = {
    deep: ['P03-04', 'P03-05'],
    suns(ctx) { const s = ctx.sq(SPIRE, 4, 4); return [{ x: ctx.gcx(s[0]), y: ctx.r2(ctx.plot[SPIRE].base + 16), z: ctx.gcz(s[1]), color: 0xa8ecff, intensity: 1.7, dist: 110, decay: 1 }]; },
    build(ctx) {
        const s = ctx.sq(SPIRE, 4, 4), x = ctx.gcx(s[0]), z = ctx.gcz(s[1]);
        for (let ly = 3; ly <= 5; ly++) for (let lx = 3; lx <= 5; lx++) { const q = ctx.sq(SPIRE, lx, ly); ctx.taken.add(q[0] + ':' + q[1]); }
        ctx.feat({ k: 'plateau', x, z, w: 10.5, d: 10.5, h: ctx.r2(ctx.plot[SPIRE].base + 0.9), edge: 0.1 });
        ctx.feat({ k: 'arch', id: 'cav:spire', x, z, rot: 0, base: ctx.r2(ctx.plot[SPIRE].base + 0.9), parts: [
            { s: 'cyl', p: [0, 0, 0], r: 3.4, r2: 2.2, h: 9, seg: 6, key: 'crystal', tint: 0xe8fbff, glow: 1.1 }, { s: 'cyl', p: [0, 9, 0], r: 2.2, r2: 0.15, h: 27, seg: 6, key: 'crystal', tint: 0xf0fdff, glow: 1.5 },
            { s: 'cyl', p: [2.6, 0, 1.4], r: 1.1, r2: 0.1, h: 11, seg: 5, key: 'crystal', tint: 0xa8e8ff, glow: 0.5 }, { s: 'cyl', p: [-2.4, 0, -1.8], r: 1.3, r2: 0.1, h: 14, seg: 5, key: 'crystal', tint: 0xb8f0e8, glow: 0.5 }, { s: 'cyl', p: [-1.2, 0, 2.8], r: 0.9, r2: 0.1, h: 8, seg: 5, key: 'crystal', tint: 0xc8d8ff, glow: 0.5 } ] });
        const bt = (ctx.O.agartha.c || []).find(c => c.id === 'battle'), b = ctx.sq('P04-04', 3, 8);
        if (bt) { ctx.taken.add(b[0] + ':' + b[1]); ctx.counters.push(Object.assign({}, bt, { id: 'battle_agartha', x: ctx.gcx(b[0]), z: ctx.gcz(b[1]), plateY: 2.35 })); }
    },
    dress(ctx) {
        const put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); };
        /* columns down both sides of the paved ways (a marble square with paving beside it), every third square */
        ctx.plots.forEach(p => { ctx.squares(p.id, 'm').forEach(q => { if ((q[0] + q[1]) % 5 || q[0] < 1 || q[1] < 1 || q[0] > 10 || q[1] > 10) return; const t = ctx.sq(p.id, q[0], q[1]);
            if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => (ctx.cell[t[1] + d[1]] || [])[t[0] + d[0]] === 'q')) put('greek_column', p.id, q[0], q[1]); }); });
        const scatter = (key, id, n, f) => { const sq = ctx.squares(id, 'm').filter(q => ctx.free(id, q[0], q[1]) && q[0] > 0 && q[1] > 0 && q[0] < 11 && q[1] < 11); for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(ctx.rnd() * sq.length), 1)[0]; ctx.P(key, id, q[0], q[1], f ? f() : {}); } };
        ctx.plots.forEach(p => scatter('meshy_crystal_shards', p.id, 4, () => ({ h: ctx.r2(1.2 + ctx.rnd() * 3.2), face: Math.round(ctx.rnd() * 360) })));
        put('fountain', 'P04-04', 8, 4); put('iron_garden_bench', 'P04-04', 9, 8); put('iron_garden_bench', 'P04-04', 2, 3); put('garden_ring', 'P04-04', 3, 5); put('garden_ring', 'P05-05', 4, 4);
        put('brass_telescope', 'P04-02', 9, 3); put('lectern', 'P04-02', 8, 4); put('brass_orrery', 'P04-02', 10, 5);
        put('brazier', 'P04-05', 4, 8); put('brazier', 'P04-05', 9, 8); put('brazier', 'P05-02', 4, 3); put('brazier', 'P03-02', 4, 4);
        put('pearly_gate', 'P04-05', 6, 8, { face: 0 }); put('skiff', 'P03-05', 2, 6); put('sea_chest', 'P03-05', 8, 7); put('stone_altar', 'P05-03', 4, 7); put('candleRing', 'P05-03', 5, 8);
    },
    people(ctx) {
        const O = ctx.O.agartha, at = (race, id, lx, ly, face, say) => { if (ctx.free(id, lx, ly)) ctx.native(race, id, lx, ly, face, say); };
        at('nordic', 'P04-04', 5, 5, 30, ctx.sayOf(O, 'nordic', 0)); at('machine elves', 'P05-02', 5, 6, 90, ctx.sayOf(O, 'machine elves')); at('nordic', 'P03-02', 6, 6, 90, ctx.sayOf(O, 'nordic', 1));
        at('crystal guardian', 'P04-03', 8, 8, 180); at('crystal guardian', 'P04-05', 3, 6, 0); at('loch ness monster', 'P03-05', 4, 7, 0);
    },
};
