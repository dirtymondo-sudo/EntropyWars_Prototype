/* THE ESTATE · THE CORN FIELDS (district C, the north-west nine: plots x 0..2 · y 0..2, squares sx 0..35 · sy 0..35, level 1).
   Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P00-00  The Tall Corn          level 1  corn over your head, one track
     P01-00  The Woods Gate         level 1  the fence and gate from the Woods
     P02-00  The Scarecrow          level 1  a scarecrow on its pole over the rows
     P00-01  The Circles, west      level 1  a flattened crop circle
     P01-01  The Circles            level 1  LANDMARK: the big crop circle
     P02-01  The Farm Track         level 1  the track to the Ranch
     P00-02  The Rows, west         level 1  corn rows, crows
     P01-02  The Hub                level 1  four tracks meet; the well
     P02-02  The Rows, east         level 1  corn rows
   WHAT STANDS HERE TODAY: tracks cut through the corn (the corn itself is the room's wall, the tool's); the crop circles (the old room's
     ritual circle, two shallow dips, a stain); THE HUB with the well's pocket, a signpost, torches, boxes; THE SCARECROW on its pole
     (Halloween pack) with a pumpkin patch; crows and insects; five people: three scarecrows, a skinwalker, a mothman.
   MISSING / WAITING:
     - THE CORN: no corn-stalk model exists; the `leaves_3` bank (2.4 m) stands in and reads as a hedge. It waits for the Meshy key
       (mondo 11-15: no Meshy yet). The bank is the tool's; a stalk model, once made, is placed here.
     - one scarecrow (22, 15) has no line (its old line named the mesa, which is gone); the skinwalker and the mothman have none either.
     - nothing but the tracks tells the nine plots apart: The Tall Corn, both Rows and The Farm Track carry almost no dressing.
     - the bus-stop pack's `Wheat` sheaf (mondo's packs, bucket `dirtymondo`) is not in the catalogue yet.
     - no residents with routines, no encounter table (mondo's baked tables), night not seen on screen.
     - the Woods gate (P01-00) and the well (P01-02) are ways out: the tool's.
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
    plan(ctx) { const { setRect } = ctx;
        setRect(14, 28, 16, 31, 'g');                              // THE HUB: a pocket off the tracks for the well
    },
    dress(ctx) { const { gx, feat, props, P, dec, native, sayOf, O_FIELDS } = ctx;
        props.push({ key: 'ritual_circle', x: gx(18.5), z: gx(18.5), y: 0.01 });                                                   // THE CIRCLES' heart (the old room's)
        feat({ k: 'dip', x: gx(18.5), z: gx(18.5), r: 17, h: 0.12 }); feat({ k: 'dip', x: gx(5.5), z: gx(16.5), r: 10, h: 0.1 });
        dec('floor_stain', 5, 16, { y: 0.01 }); dec('crow', 3, 14); dec('crow', 7, 18); dec('crow', 20, 14); dec('grasshopper', 16, 20); dec('grasshopper_brown', 21, 22);
        P('cave_torch', 13, 17); P('cave_torch', 4, 13); P('signpost', 14, 30, { face: 200 }); P('cave_torch', 15, 28); dec('wooden_bucket', 15, 30); dec('cardboard_boxes', 14, 28);
        dec('crow', 28, 6); dec('meshy_burlap_sack', 30, 9); dec('fallen_log', 18, 6); dec('butterfly', 20, 4); dec('ladybug', 17, 7); dec('caterpillar', 21, 6);
        P('hw_scarecrow', 30, 6, { face: 180 }); dec('hw_pumpkin', 28, 8); dec('hw_pumpkin_4', 31, 8); dec('hw_pumpkin_3', 30, 9); dec('hw_pumpkin_2', 28, 9);   // THE SCARECROW on its pole, its pumpkin patch
        native('scarecrow', 29, 7, 180, sayOf(O_FIELDS, 'scarecrow', 0)); native('scarecrow', 2, 15, 60, sayOf(O_FIELDS, 'scarecrow', 2)); native('scarecrow', 22, 15, 200);
        native('skinwalker', 16, 21, 180); native('mothman', 19, 5, 200);
    },
};
