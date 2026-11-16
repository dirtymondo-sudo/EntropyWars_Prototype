/* THE ESTATE · THE LAKE (district L, the north-east nine: plots x 3..5 · y 0..2, squares sx 36..71 · sy 0..35, level 0).
   Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P03-00  The Reeds              level 0  reeds, mud
     P04-00  The North Shore        level 0  shingle beach
     P05-00  The Boathouse          level 0  boathouse and slip
     P03-01  The Dock               level 0  a long dock out over the water
     P04-01  The Lake               level 0  LANDMARK: open water; something big under it
     P05-01  The Lake, east         level 0  water, the far bank
     P03-02  The South Shore        level 0  picnic ground
     P04-02  The Lake, south        level 0  water, lily pads
     P05-02  The Marsh              level 0  wet ground, frogs
   WHAT STANDS HERE TODAY: the Lake (one pool 98 x 82 m, 1 m deep, waded and swum, a rock in its middle), the long dock from the west
     shore, THE BOATHOUSE (walk-in: a rowboat, a sea chest, a lantern) with its slip, the Marsh's two pools, a picnic ground on the
     South Shore (benches, a campfire, folding chairs), rowboats, logs, frogs, moths, dead snags, seven trees, and the Loch Ness Monster
     in the water south of the rock (mondo's OK 11-15).
   MISSING / WAITING:
     - not seen on screen: the Loch Ness Monster in 1 m of water, the Boathouse's inside, the Lake at night.
     - the plan's own words are not built yet: The Reeds has no reeds, The Lake, south has no lily pads, The North Shore has no
       shingle beach dressing, The Lake, east has no far bank of its own.
     - the water is one flat pool: no shore line dressing, no mist, nothing "big under it" but the unit.
     - no residents with routines, no encounter table (mondo's baked tables).
   THE HOOKS (bake-estate.js "THE DISTRICT FILES"; a file exports any of these, each is called with this district's own ctx):
     plan(ctx)    first of all: change the plan's squares (ctx.setRect(x0, y0, x1, y1, ch); 'c' = corn, anything else is walked).
     houses(ctx)  the main buildings (ctx.building: a hollow texbuilding + its drawn look; ctx.put: a prop in a building's own frame).
     sheds(ctx)   the out-buildings (same helpers).
     pieces(ctx)  drawn pieces on open ground (ctx.look) + their rows; ctx.flat(x0, y0, x1, y1) levels the ground under one.
     water(ctx)   pools, decks, rocks in the water.
     dress(ctx)   everything else: props (ctx.P on a square, ctx.dec off its middle), trees, rails, people (ctx.native), animals.
   ctx = { d, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet,
           windows, SOLID, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec, tree, native, rail, rnd, flat, sayOf, O_FIELDS, O_GROUNDS, BUILT }.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   ctx.rnd / ctx.dec throw THIS district's own dice, so nothing here moves another district's pieces. Row ids start 'est:'.
   NOT YOURS (the tool's, shared: a note on docs/notes/claims.md before anyone touches them): the corn wall and the pines on it, the levels,
   the paint rule, the sky and shell, the ways out (the Woods gate, the house's front door, `bay`, `bay13`, the well, the Lodge door).
   Rules for district threads: docs/notes/areas-complexes.md "THE ESTATE, THE DISTRICT FILES". Rebake: `node bake-estate.js`. */
'use strict';
module.exports = {
    houses(ctx) { const { building, put, U, WD, WD2, COR, SHUT } = ctx;
        /* THE BOATHOUSE (walk-in): grey weathered boards, a tin roof, the slip down to the water */
        const BOAT = building('boathouse', [67, 5, 71, 9, 'S'], 3.5, { leaf: 'leaf_shabby_wood', floorIn: U('WoodFlooring1a') }, (a, w, d, door) => {
            const GREY = 0x8a8478, TRIM = 0x4a463e;
            a.shell(w, 3.5, d, WD, GREY, door, [3.5, 1.75]);
            a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, U('WoodFlooring1a'), 0x8a7c68, { uv: [1.75, 1.75] });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 3.5, 0.3, WD2, TRIM);
            a.roof('gable', 0, 3.5, 0, d + 0.8, 2.4, w + 0.8, COR, 0x6a7078, { ry: 90, keyEnd: WD, tintEnd: GREY });
            a.frame(door, d, WD2, TRIM); a.box(-w / 2 - 0.06, 1.1, 0, 0.08, 1.3, 2.4, SHUT, 0xa8a498, { uv: 'fit', faces: 'l', top: false });
        });
        put(BOAT, 'rowboat', -2.6, -2.4, { face: 90 }); put(BOAT, 'sea_chest', 4.6, -5.0, { face: 0 }); put(BOAT, 'ship_lantern', 5.2, 4.6); put(BOAT, 'wooden_bucket', 3.8, 1.2); put(BOAT, 'psx_wooden_crate_3', 5.0, -1.6);
    },
    water(ctx) { const { W, gx, gc, feat, taken } = ctx;
        feat({ k: 'pool', x: gx(54), z: gx(17.5), r: 49, rz: 41, y: -0.3, depth: 1.0, key: 'water', bank: 2.4 });
        feat({ k: 'plateau', x: gc(54), z: gc(18), r: 5.25, h: 1.4, edge: 0.5 });
        feat({ k: 'deck', x0: gx(36), z0: gx(18), x1: gx(49), z1: gx(18), w: 7, y: 0.3 });
        feat({ k: 'deck', x0: gx(67), z0: gc(7), x1: gx(60), z1: gc(7), w: 3.5, y: 0.3 });
        feat({ k: 'pool', x: gx(63.5), z: gx(27), r: 9, rz: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.6 }); feat({ k: 'pool', x: gx(68.5), z: gx(32.5), r: 7.5, y: -0.25, depth: 0.6, key: 'water', bank: 1.4 });
        const inLake = (x, y) => Math.pow((x + 0.5 - 54) / 14.6, 2) + Math.pow((y + 0.5 - 17.5) / 12.3, 2) < 1 || Math.hypot(x + 0.5 - 63.5, y + 0.5 - 27) < 3 || Math.hypot(x + 0.5 - 68.5, y + 0.5 - 32.5) < 2.6;
        for (let y = 0; y < 36; y++) for (let x = 36; x < W; x++) if (inLake(x, y)) taken.add(x + ':' + y);
    },
    dress(ctx) { const { gc, npc, P, dec, tree } = ctx;
        P('rowboat', 50, 3, { face: 80 }); dec('fallen_log', 46, 2); dec('fallen_log', 58, 3); dec('meshy_frog', 38, 3); dec('meshy_frog', 39, 8); dec('luna_moth', 37, 5); dec('fallen_log', 37, 10);
        P('cave_torch', 36, 16); P('cave_torch', 36, 19); P('meshy_rowboat', 66, 10, { face: 300 }); dec('dockring', 66, 9); dec('wooden_bucket', 69, 10);
        P('park_bench', 40, 31, { face: 0 }); P('park_bench', 44, 32, { face: 0 }); P('campfire', 42, 33); dec('folding_chair', 41, 34); dec('folding_chair', 43, 34); dec('butterfly', 46, 31);
        dec('meshy_frog', 61, 30); dec('meshy_frog', 66, 29); dec('meshy_frog', 70, 35); dec('meshy_frog', 64, 33); P('dead_snag', 62, 33); P('dead_snag', 70, 28); dec('hawk_moth', 67, 26);
        tree(38, 1, 'tree', 7.5); tree(70, 2, 'tree_2', 8); tree(37, 33, 'tree', 7); tree(47, 34, 'tree_2', 7.5); tree(58, 33, 'tree', 8); tree(70, 14, 'tree_2', 7); tree(70, 21, 'tree', 7.5);
        npc.push({ x: gc(54), z: gc(23), face: 0, race: 'loch ness monster' });                                                    // in the water, south of the rock (mondo's OK 11-15)
    },
};
