/* THE WOODS · THE REDWOOD TRAIL (district T, plots x 0..2 · y 0..2, the north-west, levels 2 to 8: the climb to the snow) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: ancient and overgrown, "you are being watched". Giant redwoods, mushrooms, boulders, ferns, logs; pale green spores, snow on the Snowline.
   THE PLOTS AND WHAT STANDS THERE TODAY
     P00-00 The Snowline (L8)          three pines, two dead snags, a stone, two skull piles, a bird cage, skulls; native: yeti.
                                       The shasta door (Mount Shasta's Trailhead) is north. Ice sheet on the ground (the game has no snow sheet).
     P01-00 The Shelf (L7)             three cave stones, a sea chest, a signpost, five crosses; natives: krampus, skinwalker.
                                       The lemuria door (Agartha's Crystal City) is north.
     P02-00 The Falls (L6)             two cave stones, a lantern, frogs, an eagle. The Falls' pool is the tool's water.
     P00-01 The Old Trees, north (L5)  LANDMARK: the giant redwood (16 m) and a second (11 m), a log, five hung voodoo dolls, a ward totem; native: bigfoot.
     P01-01 The Meadow (L5)            campfire, drum, guitar, tambourine, bench, eagle; natives: shaman, ki fighter.
     P02-01 The Creek, upper (L4)      torch, a sack, a frog.
     P00-02 The Old Trees, south (L3)  a redwood (11 m), a log, two effigy figures, a hung doll, an eagle.
     P01-02 The Trail (L3)             a candle ring, three hung dolls, a ward totem.
     P02-02 The Creek, lower (L2)      torch, two ward totems.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE FALLS HAS NO WATERFALL: mondo asked for a pass that adds waterfalls and light shafts to rooms ("might need its own thread"). No
       engine piece draws either today (areas-complexes.md, the life pass, ASKED FOR, NOT BUILT). The engine part is not a district's.
     - The two Creek plots hold almost nothing of their own.
     - Seen in the probe, do not bring back: the thorn vine model (a toothed man-eater on a mound) is wrong for this wood, and the ocean
       pack's rocks draw as black blocks in this room (the boulders are cave_stone).
     - The trees are closed ("Good, keep them"): do not change tree kinds unasked.

   THE HOOKS (bake-woods.js "THE DISTRICT FILES" calls them; each one is optional):
     tailor(ctx)                          before the levels are read: change this district's squares in ctx.cell[cy][cx]
                                          (t trees, g grass, p path, s snow, r rock, w water, b bridge)
     dress(ctx), horror(ctx), life(ctx)   the three passes as they were built, run in this order; each starts on its own recorded dice,
                                          so an edit here never moves another district's pieces
     build(ctx)                           after all three: NEW work goes here first (its own dice; nothing that stands is thrown again)
                                          (a sow's seed is the count of feature rows before it: a feature row added in an old pass
                                          re-throws every later scatter of the room, one added in build moves nothing)
     wood, treeZones(ctx), airZones(ctx)  this district's forest mass and its air
   ctx: put / dec / tree / native (plot id, ..., dx, dy) stand a thing on the free square nearest the plot's clearing middle + (dx, dy) and claim
   the square (put = a blocker on the square's middle, dec = a small thing off it); hput / hdec = the same, skipped when the plot is full;
   life / fly = a small thing on a random open square (claims none); sow = a scatter row over a disc; centre(plot id) = the clearing's middle
   square; freeSquares(plot id); features / props (push your own rows), doors (read only), taken, cell; gx / gc = a square's line / middle in
   metres; ground(x, z) = the height there; rnd; h0 (horror only: props.length before the pass). A helper given another district's plot throws.
   NOT YOURS: the terrain, the levels, the trails and paths, the creek and the pools, the doors and link ends, the sky, the tree kinds
   (the trees row on the board), the particle engine. Those are the tool's: a note on the board first (docs/notes/claims.md).
   Rules for district threads: docs/notes/areas-complexes.md "THE WOODS, THE DISTRICT FILES". Bake: node bake-woods.js (--dry-run = counts only). */
'use strict';
module.exports = {
    id: 'T', name: 'The Redwood Trail',
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree_3', 14, 0.12],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(0, 0, 3, 1), { kinds: ['tree_56', 'tree_55', 'tree_56', 'tree_5'], treeH: [6, 9] }),                            // the three mountain plots, first (the first box a tree stands in wins)
        Object.assign(ctx.zoneOf(0, 0, 3, 3), { kinds: ['tree_52', 'tree_52', 'tree_55', 'tree_52', 'tree_53'], treeH: [8.5, 13] })],                 // giants
    airZones: ctx => [Object.assign(ctx.zoneOf(0, 0, 1, 1), { kind: 'snow', n: 150 }), Object.assign(ctx.zoneOf(0, 0, 3, 3), { kind: 'spores', color: 0xc8f090, n: 300 })],   // snow on the Snowline plot, first
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        tree('P00-01', 'tree_3', 16, 0, 0, 1.6); tree('P00-01', 'tree_3', 11, 2, 1, 1.0); tree('P00-02', 'tree_3', 11, 0, 0, 1.0); dec('P00-02', 'fallen_log', 1, 1); dec('P00-01', 'fallen_log', -1, 2);   // the giant redwood (the landmark)
        put('P01-01', 'campfire', 0, 0); dec('P01-01', 'instrument_drum', 1, 1); dec('P01-01', 'instrument_guitar_lying', -1, 1); dec('P01-01', 'instrument_tambourine', 1, -1); put('P01-01', 'park_bench', -2, -1, { face: 90 }); dec('P01-01', 'eagle', 3, -3);
        put('P01-00', 'cave_stone', 0, 0); put('P01-00', 'cave_stone', 2, 1); put('P01-00', 'cave_stone', -2, 1); dec('P01-00', 'sea_chest', 1, -1); put('P01-00', 'signpost', 0, 3);
        tree('P00-00', 'pine', 6.5, 0, 0); tree('P00-00', 'pine', 6.0, 3, 2); tree('P00-00', 'pine', 5.5, -3, 2); put('P00-00', 'dead_snag', 2, -3); put('P00-00', 'dead_snag', -2, -2); put('P00-00', 'cave_stone', 0, 3);
        put('P02-00', 'cave_stone', 0, 0); put('P02-00', 'cave_stone', 1, 1); dec('P01-02', 'candle_ring', 0, 0); put('P02-01', 'cave_torch', 0, 0); put('P02-02', 'cave_torch', 0, 0);
        native('P01-01', 'shaman', -2, 2, 0); native('P00-01', 'bigfoot', -2, -1, 120); native('P01-01', 'ki fighter', 3, 2, 300); native('P00-00', 'yeti', -1, 1, 150); native('P01-00', 'krampus', -1, 2, 180);
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P02-02', 'item_ward_totem', 1, 1); hdec('P02-02', 'item_ward_totem', -1, -1);
        hdec('P01-02', 'meshy_voodoo_doll', 1, 1, { y: 1.7 }); hdec('P01-02', 'meshy_voodoo_doll', -1, 1, { y: 2.1 }); hdec('P01-02', 'meshy_voodoo_doll', 0, -1, { y: 1.5 }); hdec('P01-02', 'item_ward_totem', 2, 0);
        hdec('P00-02', 'decor_effigy_figure', 1, -1); hdec('P00-02', 'decor_effigy_figure', -1, 1); hdec('P00-02', 'meshy_voodoo_doll', 2, 1, { y: 1.8 });
        [[1, 0, 1.3], [-1, 0, 1.9], [0, 1, 1.6], [0, -1, 2.2], [1, 1, 1.1]].forEach(d => hdec('P00-01', 'meshy_voodoo_doll', d[0], d[1], { y: d[2] })); hdec('P00-01', 'item_ward_totem', 3, 1);
        hdec('P02-01', 'meshy_burlap_sack', 1, 0); hdec('P02-00', 'railway_lantern', 1, 2);
        [[2, 2], [3, 0], [-3, 1], [-1, -3], [1, -2]].forEach(d => hdec('P01-00', 'cross', d[0], d[1], { face: 180 })); native('P01-00', 'skinwalker', 3, -2, 200);
        hput('P00-00', 'skull_pile', 1, 1); hput('P00-00', 'skull_pile', -2, 3); hput('P00-00', 'bird_cage', 3, -1); hdec('P00-00', 'skull', 2, 2); hdec('P00-00', 'skull', -1, 2); hdec('P00-00', 'skull', 0, -2);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        sow('mushroom2', 16, [22, 22], 38, { h: 0.45, r0: 0.25 }); sow('mushroom2', 6, [7, 27], 24, { h: 0.5, r0: 0.25 });
        sow('cave_stone', 14, [20, 21], 40, { r0: 0.5 });   /* seen in the probe (11-15): the ocean pack's rocks draw as black blocks here, and the thorn vine model is a toothed man-eater on a mound, wrong for this wood: it lives in Dead Man's Cave only */ sow('fern', 40, [20, 24], 42); sow('fallen_log', 8, [20, 24], 42, { r0: 1.9 }); sow('stump', 8, [20, 24], 42);
        ['P00-01', 'P00-02', 'P01-02', 'P02-01', 'P02-02', 'P01-01'].forEach((id, i) => { fly(id, i % 2 ? 'luna_moth' : 'hawk_moth', 1.5); life(id, i % 2 ? 'crow' : 'grasshopper'); });
        fly('P00-02', 'eagle', 9); fly('P02-00', 'eagle', 8); life('P02-00', 'meshy_frog'); life('P02-00', 'meshy_frog'); life('P02-01', 'meshy_frog');
    },
};
