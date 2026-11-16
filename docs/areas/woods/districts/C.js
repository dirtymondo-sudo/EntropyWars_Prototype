/* THE WOODS · THE CLEARING (district C, plots x 0..2 · y 3..5, the south-west, levels 0 to 2) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: the friendly woods, "someone was just here". Birch mass, heal flowers, butterflies, bees, rabbits; fireflies in the air.
   THE PLOTS AND WHAT STANDS THERE TODAY
     P00-03 The Trail West (L2)     lesson sign, torch, the MISSING board, a candle. The trail west = the link woods_camelot (the tool's).
     P01-03 The Old Tree (L2)       LANDMARK: three big full trees (9.5 / 8 / 7.5 m), a cobweb, a candle; native: tree person.
     P02-03 The Crossroads (L2)     signpost, torch, a paper sheet, rabbit, crows.
     P00-04 Deep woods, west (L1)   wolf, three bear traps, a trip wire; native: werewolf.
     P01-04 The Campfire (L1)       campfire, boxes, log, torch, a tent, flashlight, VHS tape, camera flash, sack; native: hippie.
     P02-04 The Stair (L2)          the marble flight up to DOOR HQ (13.61 m, a ramp row), torch, lantern.
     P00-05 Deep woods, south (L1)  anthill, ant, moths, a bear trap, a skull, a broken trip wire.
     P01-05 The Fence Line (L0)     a ranch rail along the south side with the gate's gap at the estate door, three hung sacks; native: scarecrow.
     P02-05 Deep woods, east (L1)   rabbit, crows, a trip wire, a dead snag with a crow on it. The forest door (back to Room 420) is south.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE STAIR IS SHARED: the room's spawn, its plate and the link woods_stair's free door (data.js, x -17.5, z 55.5, y 12.06) stand on the
       flight as it is. Do not move or resize the flight without a note on the board.
     - The Fence Line's gate is only a gap in the rail: no gate piece stands there.
     - The three Deep woods plots are new forest plots with little of their own (a wolf, an anthill, rabbits).
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
    id: 'C', name: 'The Clearing',
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree', 7.5, 0.03],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kinds: ['tree_53', 'tree_54', 'tree_53', 'tree_52', 'tree_54'], treeH: [5.5, 8.5] })],          // birch
    airZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kind: 'fireflies', n: 260 })],
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        tree('P01-03', 'tree_4', 9.5, 0, 0, 1.0); tree('P01-03', 'tree_4', 8.0, 1, 1, 0.85); tree('P01-03', 'tree_4', 7.5, -1, 1, 0.8);              // THE OLD TREE (the district's landmark)
        put('P02-03', 'signpost', 0, 0, { face: 30 }); put('P02-03', 'cave_torch', 3, -2); dec('P02-03', 'paper_sheet', -2, 2, { y: 0.01 }); dec('P02-03', 'rabbit', -3, -2); dec('P02-03', 'crow', 3, 3);
        put('P01-04', 'campfire', 0, 0); dec('P01-04', 'cardboard_boxes', 2, 1); dec('P01-04', 'fallen_log', -2, 1); put('P01-04', 'cave_torch', 0, -3);
        { const q = centre('P02-04');   // THE STAIR: the building's own marble flight, standing alone in the trees and climbing past the treeline (the old clearing's row)
          features.push({ k: 'ramp', x0: gx(q[0]), z0: gx(q[1] + 1), x1: gx(q[0]), z1: gx(q[1] - 4), w: 3.5, h0: 0, h1: 13.61, stairs: true, edge: 0.2, model: 'concrete', built: true, key: 'marble_light', side: 'marble_light',
              runner: { w: 2.0, color: 0x2f58d0 }, cheek: { h: 1.0, t: 0.4, key: 'marble_light', head: true } });
          for (let d = -4; d <= 0; d++) for (const s of [-1, 0]) taken.add((q[0] + s) + ':' + (q[1] + d)); put('P02-04', 'cave_torch', 2, 1); }
        dec('P00-04', 'wolf', 0, 0); dec('P00-05', 'anthill', 0, 0); dec('P00-05', 'ant', 1, 0); dec('P00-05', 'luna_moth', -1, 1); dec('P00-05', 'hawk_moth', 1, 1);
        dec('P02-05', 'rabbit', 0, 0); dec('P02-05', 'crow', 1, 1); dec('P00-03', 'lesson_sign', 0, 0); put('P00-03', 'cave_torch', 1, 0);
        { const p = plot['P01-05'], z = gx(p.y * N + N - 1);   // THE FENCE LINE: a ranch rail along the plot's south side, the gate's gap where the path goes through
          const gap = doors.find(d => d.id === 'estate').x; features.push({ k: 'rail', x0: gx(p.x * N + 1), z0: z, x1: r2(gap - 3.5), z1: z, model: 'ranch' }, { k: 'rail', x0: r2(gap + 3.5), z0: z, x1: gx(p.x * N + N - 1), z1: z, model: 'ranch' }); }
        native('P01-03', 'tree person', 2, 2, 200); native('P01-04', 'hippie', 2, -1, 270); native('P00-04', 'werewolf', 1, 1, 90);
    },
    /* THE HORROR PASS (mondo 11-15): it gets worse the farther you walk from the Stair */
    horror(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        hdec('P02-04', 'railway_lantern', 1, 3); hdec('P02-03', 'crow', -3, 3); hdec('P01-03', 'psx_cobweb_1', 1, 0, { y: 1.1 }); hdec('P01-03', 'candle', -1, 0);
        hput('P01-04', 'camping_tent', -2, -2, { face: 140 }); hdec('P01-04', 'psx_flashlight_1', 1, -1); hdec('P01-04', 'psx_vhs_tape_1', 1, 2); hdec('P01-04', 'item_old_camera_flash', -1, 2); hdec('P01-04', 'meshy_burlap_sack', 3, 0);
        hput('P00-03', 'missing_board', 0, 0, { face: 180 }); hdec('P00-03', 'candle', 1, 1);
        hdec('P00-04', 'trap_bear_open', 2, -1); hdec('P00-04', 'trap_bear_open', -2, 1); hdec('P00-04', 'trap_trip_wire', 0, 2); hdec('P00-04', 'trap_bear_shut', -1, -2);
        hdec('P00-05', 'trap_bear_open', 2, 1); hdec('P00-05', 'skull', 0, 1); hdec('P00-05', 'trap_trip_wire_broken', -2, 0);
        hdec('P02-05', 'trap_trip_wire', 2, 0); { const q = hput('P02-05', 'dead_snag', -2, 1); if (q) props.push({ key: 'crow', x: gc(q[0]), z: gc(q[1]), y: 4.5, face: 200 }); }
        hdec('P01-05', 'meshy_burlap_sack', -2, 2, { y: 0.9 }); hdec('P01-05', 'meshy_burlap_sack', 0, 3, { y: 0.9 }); hdec('P01-05', 'meshy_burlap_sack', 2, 2, { y: 0.9 }); native('P01-05', 'scarecrow', 2, -1, 0);
    },
    /* THE LIFE PASS (mondo 11-15): this district's own wood, its plants and its small animals */
    life(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        sow('woods_healflower', 34, [18, 54], 60, { h: 0.7, r0: 0.3 }); sow('fern', 20, [18, 54], 60);
        DIST('C').forEach((id, i) => { fly(id, ['butterfly', 'monarch', 'blue_morpho', 'swallowtail'][i % 4], 1.2); fly(id, ['swallowtail', 'butterfly', 'monarch', 'blue_morpho'][i % 4], 1.6); fly(id, i % 2 ? 'bee' : 'bumblebee', 0.8); life(id, i % 3 ? 'ladybug' : 'grasshopper'); });
        ['P01-03', 'P02-03', 'P01-04', 'P02-04', 'P01-05'].forEach(id => { life(id, 'rabbit'); life(id, 'woods_healflower', { h: 0.9 }); life(id, 'woods_healflower', { h: 0.75 }); });
    },
};
