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
   BUILT 2026-11-16 BY THE CLEARING THREAD (mondo's order: prototype every district, at most five passes; notes: areas-complexes.md "THE CLEARING")
     PASS 1, THE EXTERIORS (build): THE RANGER STATION on the Trail West (a walk-in: texbuilding woods:ranger + an arch row), THE TRAIL SHELTER at the Crossroads,
     THE HUNTER'S STAND in Deep woods west, THE GATE on the Fence Line, THE OLD PLAYGROUND in Deep woods east, the lamp posts and urns at the Stair's foot,
     the Old Tree at 19 m, the dark forest floor. The yards are DIRT squares opened in cut (YARDS below): a path square is not a free square, so no plot's
     middle moved and the Stair stands where it stood.
   KNOWN MISSING / WAITING FOR MONDO
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE STAIR IS SHARED: the room's spawn, its plate and the link woods_stair's free door (data.js, x -17.5, z 55.5, y 12.06) stand on the
       flight as it is. Do not move or resize the flight without a note on the board.
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
/* arch parts (data.js THE ARCHITECTURE ROW): p = the foot's middle in the row's frame (+x along the front, +z out of the front); a tint MULTIPLIES its sheet */
const R2 = v => Math.round(v * 100) / 100;
const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [R2(x), R2(y), R2(z)], size: [R2(w), R2(h), R2(d)], key, tint }, o || {});
const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [R2(x), R2(y), R2(z)], r: R2(r), h: R2(h), key, tint }, o || {});
const WD = 'urban:WoodGeneric1b', WD2 = 'urban:WoodGeneric1a', SH = 'urban:WoodGeneric2a', FL = 'urban:WoodFlooring1d', TIN = 'urban:MetalCorrugatedPainted1a', GLASS = 'urban:GlassWindowResidential1a', ROCK = 'rocks_5';
const SAGE = 0xa9c29a, TRIM = 0xe2dccb, DARK = 0x7d6c58, LOG = 0xcdbb9f, MOSS = 0x9fb089, ROOFG = 0x7f9a78, STONE = 0xd6d2c4, PANE = 0x6c747c, BOARD = 0xc9b9a0;
/* THE YARDS (cut): forest squares opened as DIRT ('p'), in room squares [col0, col1, row0, row1]. Dirt on purpose: a path square is walked and painted but is not a
   "free square" of its plot, so the plot's clearing middle (and with it the Stair, the spawn and every old piece) stays exactly where it was. */
const YARDS = [[8, 11, 41, 43],    // the ranger station's lot, south of the Trail West (the station on 8..10 x 42..43, its porch on row 41, a side yard on col 11)
    [25, 26, 42, 42],              // the trail shelter's pocket at the Crossroads, south of the trail
    [8, 8, 53, 53],                // the hunter's stand, Deep woods west
    [30, 33, 63, 66],              // the old playground, Deep woods east
    [29, 32, 58, 59]];             // the court at the foot of the Stair
module.exports = {
    id: 'C', name: 'The Clearing',
    ground: 'grass_dark_fantasy',   // THE GROUND BY DISTRICT: the forest floor (mondo's rule: forest floor = grass_dark_fantasy / dirt_2), not the room's bright lawn
    /* THE CUT (bake-woods.js): the yards the new buildings stand on */
    cut(ctx) { const { cell } = ctx; YARDS.forEach(q => { for (let cy = q[2]; cy <= q[3]; cy++) for (let cx = q[0]; cx <= q[1]; cx++) if (cell[cy][cx] === 't') cell[cy][cx] = 'p'; }); },
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree', 7.5, 0.03],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kinds: ['tree_53', 'tree_54', 'tree_53', 'tree_52', 'tree_54'], treeH: [5.5, 8.5] })],          // birch
    airZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kind: 'fireflies', n: 260 })],
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        tree('P01-03', 'tree_4', 19, 0, 0, 1.6); tree('P01-03', 'tree_4', 11.5, 1, 1, 0.95); tree('P01-03', 'tree_4', 10.5, -1, 1, 0.9);              // THE OLD TREE (the district's landmark; 19 m since 11-16, was 9.5: it did not stand out of 8.5 m birches)
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
    /* PASS 1, THE EXTERIORS (2026-11-16, the Clearing thread; mondo's order of the same day: every district prototyped, no questions). New rows only, on this
       district's own dice. Everything stands on the yards cut above or on ground no helper hands out. Row frame of an arch: +x along the front, +z out of it. */
    build(ctx) {
        const { plot, N, gx, gc, r2, features, props, doors } = ctx;
        const frame = (cx, cz, rot) => { const a = rot * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a)); return (rx, rz) => ({ x: r2(cx + rx * c - rz * s), z: r2(cz + rx * s + rz * c) }); };
        /* ── THE RANGER STATION (P00-03 The Trail West): a walk-in building made the city's way = one hollow `texbuilding` (the walls, the doorway, the swinging
           leaf) + one arch row for the look. Three squares along its front x two deep, the front to the NORTH (the trail), a porch on the square row before it.
           Sage boards on a stone base course, a green tin roof, dark glass, a stove pipe and a radio mast. No game role (like the cabin). ── */
        { const cx = r2(gx(8) + 5.25), cz = r2(gx(42) + 3.5), w = 10.5, d = 7, H = 3.5, E = 0.05, at = frame(cx, cz, 180);
          features.push({ k: 'texbuilding', id: 'woods:ranger', x: cx, z: cz, w, d, rot: 180, storeys: 1, seed: 2, skin: false, hollow: true, leaf: 'leaf_wooden', keyIn: WD2, floorIn: FL });
          const L = w - 0.12, cols = Math.round(L / 1.75), cw = L / cols, lx = r2(-L / 2 + (Math.floor((cols - 1) / 2) + 0.5) * cw);   // data.js hqTexbDoor: the doorway's middle along the front
          const win = (x, z, face) => { const f = face === 'f' || face === 'b', sg = (face === 'f' || face === 'r') ? 1 : -1, o = 0.06 * sg;   // a dark pane in a pale frame, a sill under it
              return f ? [box(x, 1.0, z + o, 1.5, 1.35, 0.08, GLASS, PANE, { uv: 'fit', faces: face, top: false }), box(x, 0.9, z + o * 2, 1.8, 0.1, 0.16, WD2, TRIM), box(x, 2.35, z + o * 2, 1.8, 0.1, 0.12, WD2, TRIM),
                      box(x - 0.82, 1.0, z + o * 2, 0.1, 1.35, 0.1, WD2, TRIM), box(x + 0.82, 1.0, z + o * 2, 0.1, 1.35, 0.1, WD2, TRIM), box(x, 1.0, z + o * 2, 0.06, 1.35, 0.1, WD2, TRIM)]
                  : [box(x + o, 1.0, z, 0.08, 1.35, 1.5, GLASS, PANE, { uv: 'fit', faces: face, top: false }), box(x + o * 2, 0.9, z, 0.16, 0.1, 1.8, WD2, TRIM), box(x + o * 2, 2.35, z, 0.12, 0.1, 1.8, WD2, TRIM),
                      box(x + o * 2, 1.0, z - 0.82, 0.1, 1.35, 0.1, WD2, TRIM), box(x + o * 2, 1.0, z + 0.82, 0.1, 1.35, 0.1, WD2, TRIM), box(x + o * 2, 1.0, z, 0.1, 1.35, 0.06, WD2, TRIM)]; };
          const parts = [
              box(0, 0, 0, w + 2 * E, H, d + 2 * E, WD, SAGE, { faces: 'blr', top: false, uv: [1.75, 3.5], gain: 1.5 }),                                           // three board walls
              { s: 'quad', p: [0, 0, r2(d / 2 + E)], size: [r2(w + 2 * E), H], key: WD, tint: SAGE, uv: [1.75, 3.5], gain: 1.5, hole: [lx, r2(cw), 2.2] },         // the front, its doorway cut
              box(0, 0, 0, w + 0.36, 0.85, d + 0.36, ROCK, STONE, { faces: 'blr', uv: [1.75, 1.75] }),                                                               // the stone base course
              box(-w / 2 - 0.09, 0, d / 2 + 0.09, 0.18, 0.85, 0.18, ROCK, STONE), box(w / 2 + 0.09, 0, d / 2 + 0.09, 0.18, 0.85, 0.18, ROCK, STONE),
              { s: 'roof', form: 'gable', p: [0, H, 0], size: [w + 1.6, 2.5, d + 1.4], key: TIN, tint: ROOFG, keyEnd: WD, tintEnd: SAGE, over: 0.5, roof: true },   // green tin, the ridge along the front
              ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(q => box(q[0] * w / 2, 0.85, q[1] * d / 2, 0.24, H - 0.85, 0.24, WD2, TRIM)),                             // corner boards
              box(0, H - 0.26, d / 2 + 0.08, w + 0.3, 0.26, 0.16, WD2, TRIM),                                                                                        // the frieze board
              box(lx - cw / 2 - 0.1, 0, d / 2 + 0.1, 0.18, 2.35, 0.18, WD2, TRIM), box(lx + cw / 2 + 0.1, 0, d / 2 + 0.1, 0.18, 2.35, 0.18, WD2, TRIM), box(lx, 2.2, d / 2 + 0.1, cw + 0.38, 0.18, 0.18, WD2, TRIM),   // the door frame
              ...win(-3.55, d / 2, 'f'), ...win(2.75, d / 2, 'f'), ...win(-2.6, -d / 2, 'b'), ...win(2.6, -d / 2, 'b'), ...win(w / 2, 0.4, 'r'), ...win(-w / 2, 0.4, 'l'),
              /* the porch: boards, five posts, a rail on both sides of the door's bay, a tin lean-to roof */
              box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FL, BOARD, { uv: [1.75, 1.75] }),
              box(0, 0, d / 2 + 1.7, w + 0.4, 0.16, 3.4, FL, BOARD), ...[-w / 2 + 0.1, -2.9, 1.1, 3.2, w / 2 - 0.1].map(x => box(x, 0, d / 2 + 3.2, 0.2, 2.6, 0.2, WD2, DARK)),
              box(-4.03, 0.9, d / 2 + 3.2, 2.26, 0.1, 0.12, WD2, DARK), box(-4.03, 0.45, d / 2 + 3.2, 2.26, 0.08, 0.08, WD2, DARK),
              box(2.15, 0.9, d / 2 + 3.2, 2.1, 0.1, 0.12, WD2, DARK), box(2.15, 0.45, d / 2 + 3.2, 2.1, 0.08, 0.08, WD2, DARK), box(4.2, 0.9, d / 2 + 3.2, 2.0, 0.1, 0.12, WD2, DARK), box(4.2, 0.45, d / 2 + 3.2, 2.0, 0.08, 0.08, WD2, DARK),
              { s: 'roof', form: 'shed', p: [0, 2.6, r2(d / 2 + 1.85)], size: [w + 1.0, 0.9, 3.9], key: TIN, tint: ROOFG, keyEnd: WD, tintEnd: SAGE, roof: true, under: true },
              /* the stove pipe and the radio mast */
              cyl(-3.6, H + 0.6, -1.3, 0.14, 2.7, TIN, 0x55595c, { seg: 8, roof: true }), cyl(-3.6, H + 3.3, -1.3, 0.24, 0.12, TIN, 0x45494c, { seg: 8, roof: true }),
              cyl(4.3, H + 0.4, -2.2, 0.06, 7.6, TIN, 0x9aa0a4, { seg: 6, roof: true }), box(4.3, H + 7.0, -2.2, 1.5, 0.05, 0.05, TIN, 0x9aa0a4, { roof: true }), box(4.3, H + 6.3, -2.2, 1.1, 0.05, 0.05, TIN, 0x9aa0a4, { roof: true }), box(4.3, H + 5.6, -2.2, 0.7, 0.05, 0.05, TIN, 0x9aa0a4, { roof: true }),
              /* the inside's lit plank ceiling (the hollow building's own ceiling draws black; under 3.18 m) on three beams */
              box(0, H - 0.62, 0, w - 0.5, 0.05, d - 0.5, WD, 0xe8dcc0, { uv: [3.5, 1.75], glow: 0.55, under: true, roof: true }),
              box(-3.5, H - 0.88, 0, 0.24, 0.26, d - 0.5, WD2, DARK, { n: 3, step: [3.5, 0, 0], roof: true }),
              /* the firewood stack under the east end of the porch roof, and the side yard's chopping block */
              box(-4.3, 0.16, d / 2 + 0.55, 1.6, 0.9, 0.5, WD2, 0x8a7458, { uv: [0.3, 0.3] }),
          ];
          features.push({ k: 'arch', id: 'woods:ranger:arch', x: cx, z: cz, rot: 180, parts });
          const P = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
          P('rocking_chair', 3.9, d / 2 + 1.5, { face: 160, y: 0.16 }); P('railway_lantern', 1.6, d / 2 + 2.9, { y: 0.16 }); P('psx_wooden_crate_2', -1.9, d / 2 + 0.7, { y: 0.16 });
          P('metal_trash_can', -6.4, d / 2 + 2.4); P('stump', -7.2, 0.3); P('wooden_bucket', -6.3, -0.6); P('psx_hand_saw_1', -7.0, 1.1, { y: 0.02 }); }
        /* ── THE TRAIL SHELTER (P02-03 The Crossroads): a three-sided log lean-to in a pocket of the trees on the trail's south side, open to the trail. Its back and
           its two ends stand on the pocket's own forest edges, so the walls you see are the walls you meet. ── */
        { const cx = gx(26), cz = gc(42), at = frame(cx, cz, 0);
          const logs = (x, z, w, d, h) => Array.from({ length: Math.round(h / 0.3) }, (_, i) => box(x, i * 0.3, z, w, 0.29, d, WD, i % 2 ? 0xbfae93 : LOG, { uv: [3.5, 0.3] }));
          features.push({ k: 'arch', id: 'woods:shelter', x: cx, z: cz, rot: 0, parts: [
              ...logs(0, 1.5, 7.0, 0.3, 2.4), ...logs(-3.35, 0, 0.3, 3.0, 2.7), ...logs(3.35, 0, 0.3, 3.0, 2.7),
              box(-3.35, 0, -1.55, 0.3, 3.1, 0.3, WD2, DARK), box(3.35, 0, -1.55, 0.3, 3.1, 0.3, WD2, DARK), box(0, 0, -1.55, 0.26, 3.1, 0.26, WD2, DARK), box(0, 2.95, -1.55, 7.2, 0.24, 0.26, WD2, DARK),
              { s: 'roof', form: 'shed', p: [0, 2.45, -0.1], size: [7.8, 0.75, 4.3], key: SH, tint: MOSS, keyEnd: WD2, tintEnd: DARK, roof: true, under: true },
              box(0, 0, 0.1, 6.6, 0.14, 2.9, FL, BOARD, { uv: [1.75, 1.75] }),                                                                                       // the sleeping deck
              box(0, 0.14, 1.0, 6.4, 0.34, 0.5, WD2, DARK), box(0, 0.48, 1.0, 6.4, 0.06, 0.6, WD2, 0xa89478),                                                        // the bench along the back wall
          ] });
          const P = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
          P('psx_old_mattress_mp_1', -1.9, 0.0, { y: 0.15, face: 90 }); P('meshy_burlap_sack', 2.3, 0.8, { y: 0.54 }); P('railway_lantern', 0.4, 0.95, { y: 0.54 }); P('psx_canned_food_mp_1', 0.9, 1.0, { y: 0.54 }); }
        /* ── THE HUNTER'S STAND (P00-04 Deep woods, west): a box blind on four legs at the glade's east edge, a ladder up its west side. Dressing, not a climb. ── */
        { const cx = gc(8), cz = gc(53), F = 3.0;
          features.push({ k: 'arch', id: 'woods:stand', x: cx, z: cz, rot: 0, parts: [
              ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(q => box(q[0] * 1.15, 0, q[1] * 1.15, 0.18, F + 2.0, 0.18, WD2, DARK)),
              box(0, F, 0, 2.7, 0.12, 2.7, FL, BOARD), box(0, 1.5, -1.15, 2.4, 0.1, 0.1, WD2, DARK), box(0, 1.5, 1.15, 2.4, 0.1, 0.1, WD2, DARK), box(1.15, 1.5, 0, 0.1, 0.1, 2.4, WD2, DARK),
              box(0, F + 0.12, -1.25, 2.6, 0.95, 0.06, WD, 0xb4c09a, { uv: [1.75, 1.0] }), box(0, F + 0.12, 1.25, 2.6, 0.95, 0.06, WD, 0xb4c09a, { uv: [1.75, 1.0] }),
              box(1.25, F + 0.12, 0, 0.06, 0.95, 2.6, WD, 0xb4c09a, { uv: [1.75, 1.0] }), box(-1.25, F + 0.12, 0.75, 0.06, 0.95, 1.1, WD, 0xb4c09a, { uv: [1.0, 1.0] }),
              { s: 'roof', form: 'shed', p: [0, F + 2.0, 0], size: [3.2, 0.45, 3.2], key: SH, tint: MOSS, keyEnd: WD2, tintEnd: DARK, roof: true, under: true },
              box(-1.42, 0, -0.75, 0.08, F + 0.9, 0.08, WD2, DARK), box(-1.42, 0, -0.2, 0.08, F + 0.9, 0.08, WD2, DARK),
              ...Array.from({ length: 9 }, (_, i) => box(-1.42, 0.3 + i * 0.36, -0.475, 0.06, 0.06, 0.6, WD2, 0xa89478)),
          ] }); }
        /* ── THE GATE (P01-05 The Fence Line): the ranch gate the rail had only a gap for. Two tall posts and a beam over the trail to the Estate, a blank board hung
           from it, both leaves swung open into the Woods. ── */
        { const gap = doors.find(d => d.id === 'estate').x, p = plot['P01-05'], z = gx(p.y * N + N - 1);
          features.push({ k: 'arch', id: 'woods:gate', x: gap, z, rot: 0, parts: [
              box(-3.5, 0, 0, 0.36, 4.5, 0.36, WD2, DARK), box(3.5, 0, 0, 0.36, 4.5, 0.36, WD2, DARK), box(0, 4.1, 0, 8.2, 0.32, 0.32, WD2, DARK),
              box(-2.9, 3.5, 0, 1.0, 0.14, 0.14, WD2, DARK), box(2.9, 3.5, 0, 1.0, 0.14, 0.14, WD2, DARK),
              box(-0.9, 3.55, 0, 0.05, 0.55, 0.05, TIN, 0x55595c), box(0.9, 3.55, 0, 0.05, 0.55, 0.05, TIN, 0x55595c), box(0, 2.9, 0, 2.6, 0.65, 0.08, WD, BOARD, { uv: [2.6, 0.65] }),
          ] });
          const leaf = [box(0.05, 0.1, 0, 0.12, 1.3, 0.1, WD2, DARK), box(3.15, 0.1, 0, 0.12, 1.3, 0.1, WD2, DARK), ...[0.25, 0.6, 0.95, 1.3].map(y => box(1.6, y, 0, 3.1, 0.1, 0.06, WD, BOARD, { uv: [3.1, 0.2] })), box(1.6, 0.25, 0.04, 0.1, 1.15, 0.04, WD2, DARK)];
          features.push({ k: 'arch', id: 'woods:gate:w', x: r2(gap - 3.3), z: r2(z - 0.2), rot: 255, parts: leaf }, { k: 'arch', id: 'woods:gate:e', x: r2(gap + 3.3), z: r2(z - 0.2), rot: 285, parts: leaf }); }
        /* ── THE OLD PLAYGROUND (P02-05 Deep woods, east): the Playground pack's three pieces on a worn dirt lot in the trees ── */
        props.push({ key: 'play_swing', x: gc(32), z: gc(64), face: 20 }, { key: 'play_slide', x: gc(31), z: gc(66), face: 300 }, { key: 'play_sandbox', x: r2(gc(33) - 0.4), z: r2(gc(65) + 0.9), face: 15 });
        /* ── THE COURT AT THE FOOT OF THE STAIR (P02-04): two lamp posts and two stone urns where the marble meets the dirt. The flight itself is not touched. ── */
        { const fx = gx(31), fz = gx(57);   // the foot's middle
          const post = sd => [box(sd * 2.6, 0, 1.2, 0.2, 2.9, 0.2, WD2, DARK), box(sd * 2.6 - sd * 0.35, 2.7, 1.2, 0.7, 0.1, 0.1, WD2, DARK), box(sd * 2.25, 2.25, 1.2, 0.03, 0.45, 0.03, TIN, 0x55595c),
              box(sd * 2.25, 1.93, 1.2, 0.22, 0.32, 0.22, null, 0xffc46a, { glow: 1 }), box(sd * 2.25, 2.25, 1.2, 0.3, 0.05, 0.3, TIN, 0x35393c), box(sd * 2.25, 1.9, 1.2, 0.3, 0.04, 0.3, TIN, 0x35393c)];
          features.push({ k: 'arch', id: 'woods:stairfoot', x: fx, z: fz, rot: 0, parts: [...post(-1), ...post(1)] });
          props.push({ key: 'stone_urn', x: r2(fx - 2.5), z: r2(fz + 3.2) }, { key: 'stone_urn', x: r2(fx + 2.5), z: r2(fz + 3.2) }); }
    },
};
