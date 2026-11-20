/* KATANA ISLAND, district W: THE WOODS (world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx). ISLAND squares.
   Four plots: the Hot Spring 7 (x 36..47, y 36..47) · the Bamboo Wood 8 (x 12..23, y 24..35) · the Old Wood 9 (x 12..23, y 12..23) · the Cherry Wood 10
   (x 24..35, y 24..35). The Mountain Road climbs through the Bamboo Wood and the Cherry Wood; thin trails go to the hidden shrine in the Old Wood
   and down past the Hot Spring.
   CHERRY BLOSSOMS: the blossom trees (`cherry`, `cherry_2`, `cherry_3`, `maple`). The Bamboo Wood wears mondo's Meshy bamboo clumps (`fl_bamboo_clump`, 11-20; it wore tall birches before). LEVEL ON PURPOSE: the hot spring's court, the viewing ground in the Cherry Wood. */
'use strict';
module.exports = {
    reach: [[20, 29, 'the Bamboo Wood'], [29, 26, 'the Cherry Wood'], [15, 17, 'the hidden shrine'], [41, 41, 'the Hot Spring'], [44, 40, 'the spring’s bath house']],
    build(ctx) {
        /* ── THE RELIEF (the pass after the insides): hills and hollows inside the plots, laid before anything stands ── */
        ctx.hill(17.5, 18, 2.4, 2.5); ctx.hill(13.5, 22, 2.5, -2.0);                              // the Old Wood: a knoll between the trail's two legs, a hollow in the south-west corner
        ctx.hill(15, 26, 2.6, 3.0); ctx.hill(22.5, 30.5, 1.7, 2.0);                               // the Bamboo Wood: a rise in the north-west, a hump by the hermit's
        ctx.hill(24.7, 33.5, 1.9, 2.2); ctx.hill(34.6, 34.2, 1.5, 1.8);                           // the Cherry Wood: two knolls in its corners
        ctx.hill(37.5, 38, 2.4, 2.6);                                                             // the Hot Spring: a rock rise over the pools
        const { rnd, house, PLS, WD2, DARK } = ctx, RED = 0xc23a22, B = {};
        const P = (key, x, y, o) => { if (ctx.open(x, y)) ctx.P(key, x, y, o); };
        /* ── THE OLD WOOD: a rise in its north-east corner, the hidden shrine under the oldest trees ── */
        ctx.set(19, 12, 23, 15, 'g', 10);
        B.shrine = ctx.building('hiddenshrine', [14, 13, 16, 15, 'S'], 2.8, {}, (a, w, d, door) => house(a, w, 2.8, d, door, { wallTint: 0xb23a26, roof: { top: 'gable', over: 1.0 } }));
        ctx.at('kt_torii_gate', 15, 16.6, { h: 4.4, face: 0 }); ctx.P('kt_kitsune_statue', 13, 15 + 1, { face: 180 }); ctx.P('kt_kitsune_statue', 17, 16, { face: 180 }); ctx.at('kt_offering_box', 15, 15.5, { face: 180 });
        P('kt_stone_lantern', 12, 17); P('kt_stone_lantern', 18, 17); P('votive_stand', 16, 14, { face: 270 }); P('cairn', 21, 13); P('moss_clump', 17, 13);
        /* ── THE BAMBOO WOOD: tall thin trees close together, a hermit's hut off the road ── */
        B.hermit = ctx.building('hermit', [21, 33, 23, 35, 'W'], 2.6, {}, (a, w, d, door) => ctx.thatch(a, w, 2.6, d, door));
        /* ── THE CHERRY WOOD: the viewing pavilion in the road's loop, lanterns along it ── */
        B.pavilion = ctx.building('viewing', [29, 27, 31, 29, 'S'], 3.0, {}, (a, w, d, door) => house(a, w, 3.0, d, door, { roof: { top: 'pyramid', over: 1.3 } }));
        [[25, 29], [29, 29 + 4], [30, 26 + 3], [34, 27], [25, 25 - 1], [19, 29], [18, 33], [22, 26 - 1], [17, 30 - 4]].forEach(q => P('kt_stone_lantern', q[0], q[1]));
        P('prayer_flags', 30, 33, { face: 0 });
        /* ── THE HOT SPRING: two pools in a court of rocks, the bath house, maples ── */
        ctx.at('fl_lotus', 37.6, 45.6, { y: -0.3 }); ctx.feat({ k: 'pool', x: ctx.gx(38.5), z: ctx.gz(44.5), r: 4.6, y: -0.15, depth: 0.6, key: 'healing_spring' }); ctx.feat({ k: 'pool', x: ctx.gx(44.5), z: ctx.gz(45.5), r: 3.0, y: -0.15, depth: 0.6, key: 'healing_spring' });
        for (let y = 43; y <= 46; y++) for (let x = 37; x <= 39; x++) ctx.take(x, y); for (let y = 44; y <= 46; y++) for (let x = 44; x <= 45; x++) ctx.take(x, y);
        /* THE FALL (mondo 11-16: a waterfall is at least 7 m and leads somewhere): the spring's overflow runs to the terrace's south edge and falls 10.5 m into the
           Paddies' big field. A small pool at the lip, the paddy below; the row only draws (the drop is the terrace's own rock face, the plan's ledge 7 to 1). */
        ctx.feat({ k: 'pool', x: ctx.gx(41.5), z: ctx.gz(47.2), r: 1.5, y: -0.15, depth: 0.5, key: 'healing_spring' }); ctx.take(41, 46); ctx.take(41, 47); ctx.take(40, 47); ctx.take(42, 47);
        ctx.feat({ k: 'fall', x: ctx.gx(41.5), z: ctx.gz(48), face: 180, w: 3.0, y0: 12.1, y1: 1.65, out: 5, key: 'healing_spring' });
        ctx.feat({ k: 'pool', x: ctx.gx(41.5), z: ctx.gz(50.6), r: 3.2, y: -0.12, depth: 0.35 }); [[40, 49], [41, 49], [42, 49], [40, 50], [41, 50], [42, 50], [40, 51], [41, 51], [42, 51]].forEach(q => ctx.take(q[0], q[1]));   // the plunge pool, in the Paddies
        B.bath = ctx.building('springbath', [43, 37, 47, 40, 'S'], 3.8, { leafDouble: true }, (a, w, d, door) => house(a, w, 3.8, d, door, { roof: { top: 'gable', over: 1.3 } }));
        [[36, 42], [40, 43], [40, 46], [37, 47], [43, 46 + 1], [46, 44]].forEach((q, i) => P(['lake_rock', 'psxg_rock_1', 'psxg_rock_3'][i % 3], q[0], q[1], { face: Math.round(rnd() * 360) }));
        P('kt_stone_lantern', 42, 43 + 1); P('kt_stone_lantern', 42, 41 - 0); P('wooden_bucket', 40, 44); P('lantern_post', 46, 43 - 2);
                /* ── THE TREES (thick: these are the woods; never on a way, never where something stands) ── */
        let n = 0;
        ctx.sow(12, 12, 23, 23, 0.5, (x, y, v) => { if (ctx.tree(v < 0.5 ? 'tree_52' : v < 0.8 ? 'tree_56' : 'maple', x, y, 7 + rnd() * 4)) n++; });
        ctx.sow(12, 24, 23, 35, 0.55, (x, y, v) => { if (ctx.tree(v < 0.82 ? 'fl_bamboo_clump' : v < 0.94 ? 'tree_55' : 'cherry_3', x, y, 5.5 + rnd() * 1.8)) n++; });
        ctx.sow(24, 24, 35, 35, 0.5, (x, y, v) => { if (ctx.tree(v < 0.4 ? 'cherry' : v < 0.7 ? 'cherry_2' : v < 0.92 ? 'cherry_3' : 'maple', x, y, 5.5 + rnd() * 3)) n++; });
        ctx.sow(36, 36, 47, 47, 0.2, (x, y, v) => { if (ctx.tree(v < 0.45 ? 'maple' : v < 0.8 ? 'cherry_2' : 'tree_56', x, y, 5.5 + rnd() * 3)) n++; });
        ctx.sow(12, 12, 47, 47, 0.05, (x, y, v) => { const p = ctx.I.plotAt(x, y); if (p && p.d === 'W') ctx.dec(v < 0.5 ? 'fern' : 'moss_clump', x, y); });
        [['deer', 18, 20], ['fox', 21, 17], ['deer', 33, 34], ['heron', 41, 46 + 1]].forEach(q => { if (ctx.open(q[1], q[2])) ctx.dec(q[0], q[1], q[2]); });
        [['monk', 15, 16 + 2, 0], ['fairy', 30, 30, 0], ['ninja', 22, 30 - 2, 270], ['catgirl', 42, 42 + 3, 0], ['fairy', 20, 15 + 3, 90]].forEach(q => { if (!ctx.open(q[1], q[2])) return; ctx.take(q[1], q[2]); ctx.npc.push({ x: ctx.mx(q[1]), z: ctx.mz(q[2]), face: q[3], race: q[0] }); });
        console.log('the Woods: ' + n + ' trees'); void WD2; void DARK;
    },
};
