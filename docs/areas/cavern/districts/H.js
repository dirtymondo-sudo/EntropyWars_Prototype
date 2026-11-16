/* THE CAVERN, district H · HOLLOW EARTH (11 plots, the south-west). One thread a file (docs/notes/claims.md). Read by `node bake-cavern.js`;
   rules: docs/notes/areas-complexes.md "THE CAVERN ON PLOTS" + "THE CAVERN, THE ZONE KIT".
   BRIEF: a whole country under the crust with its own sun. Open to the crust far overhead; the INNER SUN hangs over the Terrace in the
   middle (P01-04) and lights everything (the room's first big light). You come down the long stair from the Mouth's Lip onto the Country
   (P02-03). North shelf (level 2): the Crystal Forest, the Mushroom Shelf. One step down (1): the Old Trees, the Giant's Steps and Seat.
   The country (0): the Hot Spring, the Sun, the Sunken Garden, the Nesting Ground (dinosaurs), the Jetty on the lake, the Polar Opening
   (Antarctica; Bay 3's frame). Who lives here: dinosaur, antperson, goblin, reptilian, giant, gnome, elf.
   STANDS (first build): the Sun on its spire over the Terrace, the altar facing it; trees by plot (oaks on the Old Trees, giant caps on
   the Mushroom Shelf, palms in the country), crystals in the Crystal Forest, the old room's pieces (signposts, fires, chests, the giant's
   seat), a dinosaur skeleton and an ant hill, the BATTLE marker, eight bystanders with the old lines.
   NOT YET: the district's five passes (nothing here is dressed; no building stands). */
'use strict';
const SUN = 'P01-04';
module.exports = {
    deep: ['P01-05'],
    suns(ctx) { const s = ctx.sq(SUN, 6, 6); return [{ x: ctx.r2(ctx.gcx(s[0]) - 1.75), y: 30, z: ctx.r2(ctx.gcz(s[1]) - 1.75), color: 0xffe2a8, intensity: 2.1, dist: 170, decay: 1 }]; },
    build(ctx) {
        const s = ctx.sq(SUN, 6, 6), x = ctx.r2(ctx.gcx(s[0]) - 1.75), z = ctx.r2(ctx.gcz(s[1]) - 1.75);
        /* THE TERRACE and the spire the Sun stands over */
        ctx.feat({ k: 'plateau', x, z, r: 8.75, h: 1.75, edge: 0.5 }); ctx.feat({ k: 'ramp', x0: x, z0: ctx.r2(z + 13.5), x1: x, z1: ctx.r2(z + 8.2), w: 7, h0: 0, h1: 1.75, stairs: true });
        for (let ly = 4; ly <= 7; ly++) for (let lx = 4; lx <= 7; lx++) { const q = ctx.sq(SUN, lx, ly); ctx.taken.add(q[0] + ':' + q[1]); }
        ctx.feat({ k: 'arch', id: 'cav:sun', x, z, rot: 0, base: 1.75, parts: [
            { s: 'cyl', p: [0, 0, 0], r: 2.6, r2: 0.7, h: 21, seg: 10, key: 'rocks_5', tint: 0xbcb9aa },
            { s: 'dome', p: [0, 28.2, 0], r: 6.5, h: 6.5, seg: 24, rings: 8, tint: 0xfff0b8, glow: 1, ds: true }, { s: 'dome', p: [0, 28.2, 0], r: 6.5, h: -6.5, seg: 24, rings: 8, tint: 0xffe9a0, glow: 1, ds: true },
            { s: 'dome', p: [0, 28.2, 0], r: 8.2, h: 8.2, seg: 20, rings: 6, tint: 0xffc860, glow: 0.5, ds: true, kind: 'glass' }, { s: 'dome', p: [0, 28.2, 0], r: 8.2, h: -8.2, seg: 20, rings: 6, tint: 0xffc860, glow: 0.5, ds: true, kind: 'glass' } ] });
        /* the BATTLE marker of the old Inner Sun, on the Country */
        const bt = (ctx.O.innersun.c || []).find(c => c.id === 'battle'), b = ctx.sq('P02-03', 8, 8);
        if (bt) { ctx.taken.add(b[0] + ':' + b[1]); ctx.counters.push(Object.assign({}, bt, { x: ctx.gcx(b[0]), z: ctx.gcz(b[1]), plateY: 2.35 })); }
        /* the trees: each on a grass square of its plot */
        const wood = (id, kinds, n, h0, h1) => { const sq = ctx.squares(id, 'g').filter(q => ctx.free(id, q[0], q[1]) && q[0] > 0 && q[1] > 0 && q[0] < 11 && q[1] < 11);
            for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(ctx.rnd() * sq.length), 1)[0], t = ctx.sq(id, q[0], q[1]); ctx.taken.add(t[0] + ':' + t[1]);
                ctx.feat({ k: 'tree', x: ctx.gcx(t[0]), z: ctx.gcz(t[1]), kind: kinds[Math.floor(ctx.rnd() * kinds.length)], h: ctx.r2(h0 + ctx.rnd() * (h1 - h0)), r: 0.8 }); } };
        wood('P00-03', ['tree_3', 'tree_52'], 12, 12, 18); wood('P01-02', ['fae_cap', 'fae_cap_2'], 12, 3.5, 8); wood('P00-04', ['tree_52', 'palm'], 6, 8, 13); wood('P01-03', ['tree_3'], 4, 10, 14);
        wood('P02-04', ['palm', 'fae_bloom_tree'], 7, 4, 7); wood('P00-05', ['palm'], 6, 6, 9); wood('P02-05', ['palm', 'tree_52'], 5, 6, 10); wood('P01-05', ['palm'], 4, 6, 9); wood('P02-03', ['tree_52'], 3, 9, 12); wood('P01-04', ['palm'], 4, 5, 8);
    },
    dress(ctx) {
        const put = (key, id, lx, ly, o) => { if (ctx.free(id, lx, ly)) ctx.P(key, id, lx, ly, o); };
        const scatter = (key, id, n, o, f) => { const sq = ctx.squares(id, 'gds').filter(q => ctx.free(id, q[0], q[1])); for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(ctx.rnd() * sq.length), 1)[0]; ctx.P(key, id, q[0], q[1], Object.assign({}, o, f ? f() : {})); } };
        scatter('meshy_crystal_shards', 'P00-02', 16, {}, () => ({ h: ctx.r2(2.5 + ctx.rnd() * 5), face: Math.round(ctx.rnd() * 360) })); scatter('crystal_cluster', 'P00-02', 4);
        scatter('mushroom2', 'P01-02', 8); scatter('woods_glowcap', 'P01-02', 8);
        const s = ctx.sq(SUN, 6, 9); ctx.props.push({ key: 'stone_altar', x: ctx.r2(ctx.gcx(s[0]) - 1.75), z: ctx.gcz(s[1]), face: 0 }); ctx.taken.add(s[0] + ':' + s[1]);
        put('brazier', SUN, 4, 9); put('brazier', SUN, 7, 9);
        put('royal_throne', 'P01-03', 6, 4, { h: 5.5, face: 180 }); put('meshy_giant_foot', 'P01-03', 8, 6, { h: 3.4 });
        put('dinosaur_skeleton', 'P00-05', 5, 6); scatter('ocean_rock_5', 'P00-05', 6, { h: 0.9 }); scatter('hw_straw', 'P00-05', 4);
        put('anthill', 'P02-04', 8, 8, { h: 3.2 }); scatter('ant', 'P02-04', 4);
        put('campfire', 'P02-03', 4, 8); put('signpost', 'P02-03', 7, 4); put('sea_chest', 'P02-03', 3, 9); put('campfire', 'P00-04', 9, 9); put('fallen_log', 'P00-03', 8, 3); put('hollow_tree', 'P00-03', 9, 8);
        put('rowboat', 'P01-05', 3, 4); put('signpost', 'P02-05', 5, 5);
    },
    people(ctx) {
        const O = ctx.O.innersun, at = (race, id, lx, ly, face, say) => { if (ctx.free(id, lx, ly)) ctx.native(race, id, lx, ly, face, say); };
        at('reptilian', 'P02-05', 8, 6, 30, ctx.sayOf(O, 'reptilian')); at('giant', 'P01-03', 5, 7, 270, ctx.sayOf(O, 'giant')); at('gnome', SUN, 9, 9, 180, ctx.sayOf(O, 'gnome'));   /* the old room's elf is not a unit today (AVAILABLE_RACES): not placed, its line waits */
        at('dinosaur', 'P00-05', 8, 4, 90); at('dinosaur', 'P02-03', 4, 10, 200); at('antperson', 'P02-04', 6, 6, 0); at('goblin', 'P01-02', 6, 6, 180);
    },
};
