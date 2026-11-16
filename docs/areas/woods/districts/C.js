/* THE WOODS · THE CLEARING (district C, plots x 0..2 · y 3..5, the south-west, levels 0 to 2) — this district's own content, split out of bake-woods.js on
   2026-11-16 (mondo: "every single zone needs to be like that. now. so we can work in parallel"). One thread = this one file.
   Repo tooling only: nothing here ships; the room is baked into data.js (site_prebuilt_fairy_forest_plots, WOODS36-BEGIN / END).

   THE LOOK: the friendly woods, "someone was just here". Birch mass, heal flowers, butterflies, bees, rabbits; fireflies in the air.
   THE PLOTS AND WHAT STANDS THERE TODAY (after the five passes of 2026-11-16)
     P00-03 The Trail West (L2)     THE RANGER STATION (walk-in, furnished), its side yard (mower, tyres, barrel, cat); lesson sign, torch, the MISSING board.
                                    The trail west = the link woods_camelot (the tool's).
     P01-03 The Old Tree (L2)       LANDMARK: the 19 m tree and its two companions, stones at the roots, bees, a bench that looks at it, a ward totem; native: tree person.
     P02-03 The Crossroads (L2)     signpost, torch, THE TRAIL SHELTER (a log lean-to), a bench, a bin, a cairn, trail lamps, rabbit, crows.
     P00-04 Deep woods, west (L1)   THE HUNTER'S STAND, shells under it, a hollow dead tree, bones and meat, bear traps, a trip wire; wolf; native: werewolf.
     P01-04 The Campfire (L1)       the camp: fire, log seats, two tents, instruments, cooler, cups, chairs, radio, a string of bulbs, torch; native: hippie.
     P02-04 The Stair (L2)          the marble flight up to DOOR HQ (13.61 m, a ramp row: SHARED), two lamp posts and two urns on a dirt court at its foot, a bench, flowers.
     P00-05 Deep woods, south (L1)  a rusted wreck, its key, a phone, a body, tyres, a hollow tree; anthill, moths, a bear trap, a skull.
     P01-05 The Fence Line (L0)     the ranch rail and THE GATE (posts, beam, hung board, two open leaves, two lanterns), a well, straw, a pumpkin patch, hens, a dog,
                                    three hung sacks; native: scarecrow (+ a second, a prop).
     P02-05 Deep woods, east (L1)   THE OLD PLAYGROUND (swing, slide, sandbox, a bench, toys left behind), a dead snag with a crow. The forest door (Room 420) is south.
   BUILT 2026-11-16 BY THE CLEARING THREAD (mondo's order: prototype every district, at most five passes; notes: areas-complexes.md "THE CLEARING")
     PASS 1, THE EXTERIORS (build): THE RANGER STATION on the Trail West (a walk-in: texbuilding woods:ranger + an arch row), THE TRAIL SHELTER at the Crossroads,
     THE HUNTER'S STAND in Deep woods west, THE GATE on the Fence Line, THE OLD PLAYGROUND in Deep woods east, the lamp posts and urns at the Stair's foot,
     the Old Tree at 19 m, the dark forest floor. The yards are DIRT squares opened in cut (YARDS below): a path square is not a free square, so no plot's
     middle moved and the Stair stands where it stood.
     PASS 2, THE INTERIORS: the ranger station's one room (office west, bunk + wood stove east; parts in its arch row, props through P()); the shelter's deck.
     PASS 3, THE DRESSING (dressing(), called from build): the camp's ring, the Old Tree's bench and bees, the Crossroads' bench and cairn, the station's side
     yard, the Fence Line's straw / pumpkin patch / well / hens, the stand's litter, a wreck in Deep woods south, the playground's leftovers, three soft scatters.
     PASS 4, THE ATMOSPHERE (atmosphere() + airZones): lamps as lit boxes (no light), a lit office window, the camp's string of bulbs; pollen, sparks, spores.
     PASS 5, THE POLISH: glass lanterns, small toadstools, this header.
     THE MODEL PASS (models(), mondo's new word 11-16): the wish-list models: camper van, picnic table, tyre swing, outhouse, firewood, packs, braced gate
     leaves, wood stove, lantern posts, string lights, trail boards, a cairn, a deer; the drawn stand-ins they replace are out.
   KNOWN MISSING / WAITING FOR MONDO
     - NEEDS A MODEL, what is left after the model pass: nothing asked is missing. The lantern posts and the string lights do not glow at night (the models carry no light).
     - The life pass and the horror pass are live but wait for his look (the board).
     - THE STAIR IS SHARED: the room's spawn, its plate and the link woods_stair's free door (data.js, x -17.5, z 55.5, y 12.06) stand on the
       flight as it is. Do not move or resize the flight without a note on the board.
     - STOPPED after five passes (mondo's order): nothing more is built here until he has seen it. His list to overrule: areas-complexes.md "THE CLEARING".
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
/* PASS 3, THE DRESSING (2026-11-16): catalogue pieces only, called at the end of build (its own dice). "Someone was just here": the camp is mid-evening, the
   station's yard is mid-chore, the playground was left in a hurry; it gets worse the farther west and south you walk from the Stair (the horror pass's rule).
   hput / hdec stand a piece on the plot's next free square (a blocker on its middle, a small thing off it); the camp's ring and the yards are placed by hand. */
function dressing(ctx) {
    const { N, gx, gc, r2, props, features, taken, centre, hput, hdec, life, fly, sow, rnd } = ctx;
    const P = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));
    /* ── THE CAMPFIRE (P01-04): the ring round the fire (the four squares beside it are kept for it), a second tent, the evening's leftovers ── */
    { const c = centre('P01-04'), fx = gc(c[0]), fz = gc(c[1]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(q => taken.add((c[0] + q[0]) + ':' + (c[1] + q[1])));
      P('fallen_log', fx - 2.5, fz + 0.2, { face: 0 }); P('fallen_log', fx + 0.3, fz + 2.6, { face: 90 }); P('fallen_log', fx + 2.6, fz - 0.4, { face: 10 });
      P('instrument_guitar_lying', fx - 2.2, fz - 1.5, { face: 250 }); P('instrument_drum', fx - 1.3, fz + 2.0, { face: 30 }); P('instrument_tambourine', fx - 0.6, fz + 2.2, { y: 0.02 });
      P('beach_cooler', fx + 2.4, fz + 1.6, { face: 200 }); P('solo_cup', fx + 1.9, fz + 1.2); P('solo_cup', fx + 2.9, fz + 1.0, { face: 80 }); P('solo_cup', fx + 1.5, fz - 1.3); P('psx_glass_bottle_1', fx + 2.1, fz - 1.6); P('psx_glass_bottle_2', fx - 1.6, fz - 0.9);
      P('folding_chair', fx + 0.4, fz - 2.3, { face: 0 }); P('folding_chair', fx - 1.0, fz - 2.1, { face: 20 }); P('retro_radio', fx + 1.1, fz - 2.5, { face: 200 }); P('psx_cassette_tape_mp_1', fx + 1.4, fz - 2.2, { y: 0.02 });
      P('psx_canned_food_mp_3', fx - 0.9, fz - 1.1); P('coffee_mug', fx + 0.9, fz + 1.2); P('psx_matchbox_1', fx + 0.6, fz - 1.0, { y: 0.02 }); P('psx_lighter_mp_1', fx - 1.9, fz + 1.2, { y: 0.02 });
      hput('P01-04', 'meshy_camping_tent', 3, -2, { face: 220 }); hdec('P01-04', 'psx_old_mattress_mp_1', -3, 0, { y: 0.02 }); hdec('P01-04', 'skateboard', 2, 3); hdec('P01-04', 'meshy_rope', -3, 2); hdec('P01-04', 'garbage_bag', 3, 2);
      hdec('P01-04', 'psx_wooden_crate_3', -1, -3); hdec('P01-04', 'item_binoculars', 0, 3, { y: 0.02 }); hdec('P01-04', 'ship_lantern', -2, -1, { y: 0.5, noLight: true }); hdec('P01-04', 'psx_cigs_packet_1', 3, -1, { y: 0.02 }); }
    /* ── THE OLD TREE (P01-03): a bench that looks at it, stones at its roots, the bees' tree, things left on the bench ── */
    { const c = centre('P01-03'), tx = gc(c[0]), tz = gc(c[1]);
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, d = 2.0 + (i % 3) * 0.35; P('psxg_rock_' + (1 + i % 4), tx + Math.cos(a) * d, tz + Math.sin(a) * d, { face: i * 67 }); }
      P('bee_frames', tx + 0.9, tz - 0.5, { y: 3.2 }); P('bee_frames', tx + 1.1, tz + 0.2, { y: 2.7 }); P('bee_frames', tx + 0.6, tz - 0.9, { y: 3.6 }); P('chrysalis', tx - 0.75, tz + 0.5, { y: 2.2 }); P('caterpillar_bug', tx - 1.5, tz - 1.2);
      const q = hput('P01-03', 'iron_garden_bench', 0, 3, { face: 180 }); if (q) { P('psx_book_mp_3', gc(q[0]) - 0.3, gc(q[1]), { y: 0.5, face: 30 }); P('hw_candles', gc(q[0]) + 1.2, gc(q[1]) + 0.3); }
      hdec('P01-03', 'item_ward_totem', -3, 0); hdec('P01-03', 'fae_toadstool', 2, -2, { noLight: true, h: 0.55 }); hdec('P01-03', 'fae_toadstool', -2, -2, { noLight: true, h: 0.4 });   // small (pass 5: at 1.75 m they read as the Ritual Ground's) hdec('P01-03', 'instrument_violin_lying', 1, 3, { y: 0.02 });
      hdec('P01-03', 'hw_web', -1, -1, { y: 1.5 }); hdec('P01-03', 'psxg_dead_bush_1', 3, 2); hdec('P01-03', 'wooden_bucket', -2, 2); }
    /* ── THE CROSSROADS (P02-03): a bench and a bin by the signpost, a cairn, what walkers leave ── */
    hput('P02-03', 'iron_garden_bench', -2, -1, { face: 90 }); hput('P02-03', 'metal_trash_can', 1, -2); hput('P02-03', 'cairn', 2, 2); hdec('P02-03', 'psxg_rock_4', -3, 3);
    hdec('P02-03', 'psx_glass_bottle_2', -1, -3); hdec('P02-03', 'psx_canned_food_mp_5_rusty', 3, 0); hdec('P02-03', 'hw_pumpkin', 4, -2); hdec('P02-03', 'psxg_dead_bush_2', -3, -3); hdec('P02-03', 'item_dowsing_rod', 0, 3, { y: 0.02 });
    /* ── THE TRAIL WEST (P00-03): the station's side yard, mid-chore ── */
    { const yx = gc(11), y0 = gx(41);   // the side yard's column (east of the station), from the porch's line south
      P('ride_on_mower', yx + 0.3, y0 + 8.3, { face: 200 }); P('tire_stack', yx + 0.9, y0 + 5.6); P('psx_metal_barrel_mp_1', yx - 1.2, y0 + 3.7); P('psx_jerrycan_1', yx + 0.9, y0 + 9.7, { face: 40 }); P('hw_shovel', yx - 1.1, y0 + 6.2, { face: 70 });
      P('psx_wooden_crate_4', yx + 1.0, y0 + 1.0); P('garbage_bag', yx + 0.2, y0 + 2.6); P('cat', yx - 0.6, y0 + 0.9, { face: 300 }); }
    /* ── THE FENCE LINE (P01-05): the Estate's edge: straw, a pumpkin patch, a well, hens, the scarecrow's twin ── */
    { const c = centre('P01-05');
      hput('P01-05', 'ancient_well', -2, -2); hput('P01-05', 'hw_scarecrow_2', 3, 1, { face: 200 }); hput('P01-05', 'hw_straw', 2, 3, { face: 20 }); hput('P01-05', 'hw_straw_2', 3, 3, { face: 80 }); hput('P01-05', 'hw_straw', -3, 3, { face: 100 }); hput('P01-05', 'hitching_rail', -3, 1, { face: 90 });
      const q = hdec('P01-05', 'hw_farmland', 1, -2, { face: 0 }); if (q) { const x = gc(q[0]), z = gc(q[1]); [[-1, -0.9], [0, -1.0], [1, -0.8], [-0.9, 0.2], [0.2, 0.1], [1.1, 0.3], [-0.4, 1.0], [0.8, 1.1]].forEach((d, i) => P(['hw_pumpkin', 'hw_pumpkin_2', 'hw_pumpkin_3', 'hw_crop', 'hw_crop_2'][i % 5], x + d[0], z + d[1], { face: i * 50 })); }
      hdec('P01-05', 'chicken', 0, 1); hdec('P01-05', 'chicken', 1, 1); hdec('P01-05', 'chicken', -1, 0); hdec('P01-05', 'wooden_bucket', -2, -1); hdec('P01-05', 'hw_shovel', -3, -1); hdec('P01-05', 'psx_wooden_crate_5', 2, -1); hdec('P01-05', 'dog', 0, 2); void c; }
    /* ── DEEP WOODS, WEST (P00-04): under the stand, and what the wolf left ── */
    { const sx = gc(8), sz = gc(53);
      P('psx_glass_bottle_2', sx - 0.5, sz + 0.6); P('psx_shotgun_ammo_1', sx + 0.4, sz - 0.3, { y: 0.02 }); P('psx_shotgun_ammo_2', sx + 0.1, sz + 0.2, { y: 0.02 }); P('psx_cig_1', sx - 0.3, sz - 0.7, { y: 0.02 }); P('psx_ammo_box_mp_1', sx + 0.6, sz + 0.7);
      hput('P00-04', 'hollow_dead_tree', -2, 2, { face: 40 }); hdec('P00-04', 'psx_meat_1', 1, -1, { y: 0.02 }); hdec('P00-04', 'femur', 0, 1); hdec('P00-04', 'ulna', 1, 1); hdec('P00-04', 'hw_part_3', -1, 2); hdec('P00-04', 'hw_part_5', 2, 2);
      hdec('P00-04', 'psxg_dead_bush_1', -2, -1); hdec('P00-04', 'psxg_rock_2', 2, -2); hdec('P00-04', 'hw_web_2', -1, 0, { y: 1.3 }); hdec('P00-04', 'psx_smartphone_mp_1_broken', 0, -2, { y: 0.02 }); }
    /* ── DEEP WOODS, SOUTH (P00-05): a wreck nobody drove here, and whoever was in it ── */
    hput('P00-05', 'crashed_car_2', 0, 0, { face: 130 }); hput('P00-05', 'tire_stack', 2, 1); hput('P00-05', 'hollow_tree', -2, -1); hdec('P00-05', 'car_key', 1, -1, { y: 0.02 }); hdec('P00-05', 'psx_cell_phone_1', -1, 1, { y: 0.02 });
    hdec('P00-05', 'hw_body_2', 2, -1); hdec('P00-05', 'psx_cigs_packet_1', 0, 2, { y: 0.02 }); hdec('P00-05', 'psxg_dead_bush_2', 3, 2); hdec('P00-05', 'psxg_rock_4', -2, 2); hdec('P00-05', 'hw_web', 1, 2, { y: 1.2 }); hdec('P00-05', 'psx_jerrycan_1', -1, -1);
    /* ── DEEP WOODS, EAST (P02-05): the old playground's leftovers (its dirt lot: squares 30..33 x 63..66) ── */
    { const X = gc(31), Z = gc(64);
      P('iron_garden_bench', gc(30), gc(63) - 0.6, { face: 0 }); P('beach_ball', X + 3.6, Z + 4.4); P('football', X - 1.2, Z + 1.3); P('skateboard', X + 5.6, Z - 1.6, { face: 70 }); P('psx_lollipop_mp_1', X + 2.3, Z + 3.4, { y: 0.02 });
      P('psx_handheld_game_console_1', gc(30) + 0.4, gc(63) - 0.5, { y: 0.5 }); P('metal_trash_can', gc(33) + 0.6, gc(63) - 0.5); P('psxg_dead_bush_1', gc(33) + 0.9, gc(66) + 0.6); P('hw_web', gc(32) + 0.2, gc(64), { y: 1.6, face: 20 });
      P('xmas_gift_2', X + 0.9, Z + 5.2, { face: 40 }); P('crow', gc(32), gc(64), { y: 2.55, face: 200 }); }
    /* ── THE STAIR (P02-04): flowers and ferns round the court, a bench to wait on ── */
    hput('P02-04', 'iron_garden_bench', -3, 2, { face: 90 }); hdec('P02-04', 'woods_healflower', -2, 3, { h: 0.9 }); hdec('P02-04', 'woods_healflower', 2, 3, { h: 0.8 }); hdec('P02-04', 'fern', -3, 0); hdec('P02-04', 'fern', 3, 0); hdec('P02-04', 'psxg_rock_3', 3, 2);
    /* ── THE SCATTERS (every disc inside the district): stones along the trails, dead bush and toadstools in the deep woods, heal flowers round the Stair ── */
    /* (11-16, pass 4: the four stone scatters, the two dead-bush scatters and the stumps are gone: a scatter lands on a path as readily as beside it, and a knee-high
       stone stood in the middle of the Trail West. Stones and bushes are placed by hand on the glades above; only small soft things are scattered.) */
    sow('mushroom2', 16, [8, 60], 18, { h: 0.4, r0: 0.3 }); sow('woods_healflower', 16, [31, 55], 12, { h: 0.75, r0: 0.3 }); sow('fern', 26, [18, 50], 30);
}
/* PASS 4, THE ATMOSPHERE (2026-11-16): lit pieces only (a `glow` box draws lit and lights nothing: the room's ten real lights are the torches and the fires).
   A lamp = a warm lit box under a dark cap. Trail lamps at the joins, the station's porch lamp and one lit office window, lanterns on the gate's posts and
   under the shelter's roof, a string of bulbs over the camp. The air is in airZones above. Seen by day and at night (probe: window._hqClockHour). */
function atmosphere(ctx) {
    const { N, gx, gc, r2, features, doors, plot, centre } = ctx;
    const WARM = 0xffc46a, CAP = 0x35393c;
    const lantern = (x, y, z) => [box(x, y, z, 0.22, 0.32, 0.22, GLASS, WARM, { uv: 'fit', glow: 1 }),   /* a glass sheet (pass 5: a lit box with no sheet drew as lined paper) */ box(x, y + 0.32, z, 0.3, 0.05, 0.3, TIN, CAP), box(x, y - 0.04, z, 0.3, 0.04, 0.3, TIN, CAP)];
        /* the ranger station (rot 180: +x = west, +z = north, out of the front): the porch lamp by the door, the office window lit from inside */
    { const cx = r2(gx(8) + 5.25), cz = r2(gx(42) + 3.5), d = 7;
      features.push({ k: 'arch', id: 'woods:ranger:lights', x: cx, z: cz, rot: 180, parts: [
          box(0.55, 2.3, d / 2 + 0.2, 0.06, 0.06, 0.3, TIN, CAP), ...lantern(0.55, 1.95, d / 2 + 0.34),
          box(2.75, 1.0, d / 2 + 0.115, 1.5, 1.35, 0.03, GLASS, 0xffc98a, { uv: 'fit', faces: 'f', top: false, glow: 0.7 }) ] }); }
    /* the trail shelter (rot 0, open to the north): a lantern hung from the front beam */
    features.push({ k: 'arch', id: 'woods:shelter:lights', x: gx(26), z: gc(42), rot: 0, parts: [box(1.6, 2.5, -1.4, 0.03, 0.45, 0.03, TIN, 0x55595c), ...lantern(1.6, 2.18, -1.4)] });
    /* the gate: a lantern on the inside of each post */
    { const gap = doors.find(d => d.id === 'estate').x, p = plot['P01-05'], z = gx(p.y * N + N - 1);
      features.push({ k: 'arch', id: 'woods:gate:lights', x: gap, z, rot: 0, parts: [-1, 1].flatMap(sd => [box(sd * 3.5, 2.6, -0.4, 0.06, 0.06, 0.5, TIN, CAP), ...lantern(sd * 3.5, 2.2, -0.6)]) }); }
    /* trail lamps: the Crossroads' join, the Old Tree's turn, the trail down to the camp, the playground's corner (one row, the room's own frame) */
    /* (the model pass: the six lamps are `lantern_post` models; they were posts and lanterns drawn from boxes) */
    [[27, 42, 0.5, 0.5], [20, 42, -0.4, 0.5], [17, 46, 0.4, 1.0], [30, 46, 0.4, 1.0], [13, 55, 3.1, -0.5], [28, 63, 0.4, 0.6]].forEach((q, i) => ctx.props.push({ key: 'lantern_post', x: r2(gx(q[0]) + q[2]), z: r2(gx(q[1]) + q[3]), face: i % 2 ? 90 : 0 }));
    /* the camp's string of bulbs: two posts and a wire on the line between two square rows south of the fire, seven bulbs */
    { const c = centre('P01-04'), fx = gc(c[0]), z = r2(gc(c[1]) + 5.25);   // the model pass: two `string_lights` (it was a wire and seven drawn bulbs)
      ctx.props.push({ key: 'string_lights', x: r2(fx - 2.6), z, face: 0 }, { key: 'string_lights', x: r2(fx + 2.6), z, face: 0 }); }
}
/* THE MODEL PASS (2026-11-16, mondo: "these are models that were added ... tell all of those district threads that needed models to use these ones";
   docs/plans/WISHLIST_MODELS_ADDED.md): the pieces this district's NEEDS A MODEL list asked for, and others of the 246 that fit. The stand-ins they replace
   are taken out where they stood (the drawn stove and firewood, the drawn gate leaves, the drawn lamp posts and bulbs, the rock-pile cairn). */
function models(ctx) {
    const { N, gx, gc, r2, props, taken, plot, cell, centre, hput, hdec } = ctx;
    const P = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));
    /* THE CAMPFIRE: the camper van on two free squares side by side on the glade's east side, a picnic table, packs, a kettle, a clothes line, a grill */
    { const p = plot['P01-04'], c = centre('P01-04'); let spot = null;
      for (let lx = N - 2; lx >= 2 && !spot; lx--) for (let ly = 1; ly < N - 1 && !spot; ly++) { const X = p.x * N + lx, Y = p.y * N + ly;
          if (cell[Y][X] === 'g' && cell[Y][X - 1] === 'g' && !taken.has(X + ':' + Y) && !taken.has((X - 1) + ':' + Y) && Math.abs(Y - c[1]) <= 2) spot = [X, Y]; }
      if (spot) { taken.add(spot[0] + ':' + spot[1]); taken.add((spot[0] - 1) + ':' + spot[1]); P('camper_van', gx(spot[0]), gc(spot[1]), { face: 0 }); }
      hput('P01-04', 'picnic_table', -2, 3, { face: 20 }); hput('P01-04', 'clothes_line', 3, 3, { face: 100 }); hput('P01-04', 'bbq_grill', 2, -3); hdec('P01-04', 'backpack', -3, -1); hdec('P01-04', 'backpack', 1, 3);
      P('kettle', gc(c[0]) + 0.75, gc(c[1]) + 0.55, { face: 60 }); P('sleeping_bag', gc(c[0]) - 3.6, gc(c[1]) - 1.9, { face: 70 }); }
    /* THE OLD TREE: the hammock (in the game before the wish list as `hammock`, the Houses on the water pack's; mondo 11-16: "a lot of the requested models we
       already have too"), on two free squares side by side on the glade's south side */
    { const p = plot['P01-03'], c = centre('P01-03'); let spot = null;
      for (let ly = N - 2; ly >= 1 && !spot; ly--) for (let lx = 2; lx < N - 1 && !spot; lx++) { const X = p.x * N + lx, Y = p.y * N + ly;
          if (cell[Y][X] === 'g' && cell[Y][X - 1] === 'g' && !taken.has(X + ':' + Y) && !taken.has((X - 1) + ':' + Y) && Y > c[1]) spot = [X, Y]; }
      if (spot) { taken.add(spot[0] + ':' + spot[1]); taken.add((spot[0] - 1) + ':' + spot[1]); P('hammock', gx(spot[0]), gc(spot[1]), { face: 0 }); } }
    /* THE OLD PLAYGROUND: the tyre swing */
    P('tyre_swing', gc(33) - 0.3, gc(63) + 0.9, { face: 100 });
    /* THE CROSSROADS: the trail's map board, an outhouse behind the shelter's corner, a milestone */
    hput('P02-03', 'trail_sign', -1, 2, { face: 0 }); hput('P02-03', 'outhouse', -4, 3, { face: 90 }); hdec('P02-03', 'milestone', 1, -3);
    /* THE OLD TREE: one deer under it, an owl, moss and flowers */
    hput('P01-03', 'deer', 3, -1, { face: 250 }); hdec('P01-03', 'moss_clump', -1, 2); hdec('P01-03', 'moss_clump', 2, 0); hdec('P01-03', 'wild_flowers', 1, -2); hdec('P01-03', 'wild_flowers', -3, 2); hdec('P01-03', 'hedgehog', 0, 2);
    /* THE STAIR: a trail board where the flight meets the woods, flowers */
    hput('P02-04', 'trail_sign', 3, 3, { face: 0 }); hdec('P02-04', 'wild_flowers', -1, 3); hdec('P02-04', 'wild_flowers', 1, 2);
    /* THE FENCE LINE: a beehive, a wheelbarrow, a trough, a kennel for the dog, a pitchfork in the straw */
    hput('P01-05', 'beehive', -3, -2); hput('P01-05', 'kennel', 1, 3, { face: 180 }); hput('P01-05', 'water_trough', 3, -1, { face: 90 }); hdec('P01-05', 'wheelbarrow', -1, 2); hdec('P01-05', 'pitchfork', 2, 2); hdec('P01-05', 'hay_bale', 3, 2); hdec('P01-05', 'rooster', 0, -1);
    /* THE DEEP WOODS: a raven on its post and a fox (west), a pack by the wreck and a hooded stone (south) */
    hdec('P00-04', 'raven_perch', -2, 0); hdec('P00-04', 'fox', 2, 1); hdec('P00-04', 'moss_clump', 0, -1); hdec('P00-05', 'backpack', 1, 1); hdec('P00-05', 'moss_clump', -1, 2); hdec('P00-05', 'owl_perched', -2, 1);
}
module.exports = {
    id: 'C', name: 'The Clearing',
    ground: 'grass_dark_fantasy',   // THE GROUND BY DISTRICT: the forest floor (mondo's rule: forest floor = grass_dark_fantasy / dirt_2), not the room's bright lawn
    /* THE CUT (bake-woods.js): the yards the new buildings stand on */
    cut(ctx) { const { cell } = ctx; YARDS.forEach(q => { for (let cy = q[2]; cy <= q[3]; cy++) for (let cx = q[0]; cx <= q[1]; cx++) if (cell[cy][cx] === 't') cell[cy][cx] = 'p'; }); },
    /* the forest mass: the feature trees planted deep in this district's tree squares [kind, height m, chance a deep square] (plots of level 6 up get pines, the tool's rule) */
    wood: ['tree', 7.5, 0.03],
    /* THE TREE ZONES (terrain.gen.zones, the thicket by district) and THE AIR BY DISTRICT (shell.atmos.zones): boxes in plots, zoneOf(x0, y0, x1, y1) */
    treeZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kinds: ['tree_53', 'tree_54', 'tree_53', 'tree_52', 'tree_54'], treeH: [5.5, 8.5] })],          // birch
    /* PASS 4 (2026-11-16): the air by plot. Fireflies everywhere (as before); warm pollen in the sun over the trail row and the Stair; sparks over the camp's
       fire (the engine finds the fire and the torch itself); pale spores drifting in the two far Deep woods plots. */
    airZones: ctx => [Object.assign(ctx.zoneOf(0, 3, 3, 6), { kind: 'fireflies', n: 260 }),
        Object.assign(ctx.zoneOf(0, 3, 3, 4), { kind: 'dust', color: 0xffe7a8, n: 150 }), Object.assign(ctx.zoneOf(2, 4, 3, 5), { kind: 'dust', color: 0xffe7a8, n: 60 }),
        Object.assign(ctx.zoneOf(1, 4, 2, 5), { kind: 'embers', n: 46 }),
        Object.assign(ctx.zoneOf(0, 4, 1, 6), { kind: 'spores', color: 0xa9c7a2, speed: 0.6, n: 120 })],
    /* THE DRESSING: the landmark, the set pieces and the natives (ported from the old rooms) */
    dress(ctx) {
        const { plot, cell, N, C, W, PL, HALF, gx, gc, r2, rnd, features, props, doors, taken, count, h0, centre, put, dec, tree, native, hput, hdec, life, fly, sow, softAt, DIST } = ctx;
        tree('P01-03', 'tree_4', 19, 0, 0, 1.0); tree('P01-03', 'tree_4', 11.5, 1, 1, 0.95); tree('P01-03', 'tree_4', 10.5, -1, 1, 0.9);              // THE OLD TREE (the district's landmark; 19 m since 11-16, was 9.5: it did not stand out of 8.5 m birches)
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
              box(0, 0, 0, w + 0.36, 0.85, d + 0.36, ROCK, STONE, { faces: 'blr', top: false, uv: [1.75, 1.75] }), box(0, 0.85, -d / 2 - 0.12, w + 0.36, 0.04, 0.14, ROCK, STONE), box(-w / 2 - 0.12, 0.85, 0, 0.14, 0.04, d + 0.36, ROCK, STONE), box(w / 2 + 0.12, 0.85, 0, 0.14, 0.04, d + 0.36, ROCK, STONE),                                                               // the stone base course
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
              /* (the model pass: the drawn firewood stack is the `firewood_stack` model now, placed below) */
              /* PASS 2, THE INTERIOR (2026-11-16): one room, the office on the west half, the bunk and the stove on the east half. A boarded dado on the three
                 blind walls, the six windows drawn from inside as pale lit panes in their frames (the building's own inside walls have no holes), the wood stove
                 under the pipe on a stone pad, its firewood, a plank counter by the door. */
              box(0, 0.16, -d / 2 + 0.3, w - 0.6, 1.0, 0.05, WD2, 0xb7a488, { uv: [1.75, 1.0] }), box(-w / 2 + 0.3, 0.16, 0, 0.05, 1.0, d - 0.6, WD2, 0xb7a488, { uv: [1.75, 1.0] }), box(w / 2 - 0.3, 0.16, 0, 0.05, 1.0, d - 0.6, WD2, 0xb7a488, { uv: [1.75, 1.0] }),
              box(0, 1.16, -d / 2 + 0.32, w - 0.6, 0.07, 0.09, WD2, DARK), box(-w / 2 + 0.32, 1.16, 0, 0.09, 0.07, d - 0.6, WD2, DARK), box(w / 2 - 0.32, 1.16, 0, 0.09, 0.07, d - 0.6, WD2, DARK),
              ...[[-3.55, 1], [2.75, 1], [-2.6, -1], [2.6, -1]].flatMap(q => { const z = q[1] * (d / 2 - 0.29);   // front + back panes, seen from inside
                  return [box(q[0], 1.2, z, 1.5, 1.15, 0.04, GLASS, 0xcfe0e6, { uv: 'fit', glow: 0.75 }), box(q[0], 1.13, z, 1.75, 0.08, 0.1, WD2, TRIM), box(q[0], 2.35, z, 1.75, 0.08, 0.1, WD2, TRIM), box(q[0] - 0.8, 1.2, z, 0.09, 1.15, 0.1, WD2, TRIM), box(q[0] + 0.8, 1.2, z, 0.09, 1.15, 0.1, WD2, TRIM)]; }),
              ...[-1, 1].flatMap(sd => { const x = sd * (w / 2 - 0.29);                                           // the two end panes
                  return [box(x, 1.2, 0.4, 0.04, 1.15, 1.5, GLASS, 0xcfe0e6, { uv: 'fit', glow: 0.75 }), box(x, 1.13, 0.4, 0.1, 0.08, 1.75, WD2, TRIM), box(x, 2.35, 0.4, 0.1, 0.08, 1.75, WD2, TRIM), box(x, 1.2, -0.4, 0.1, 1.15, 0.09, WD2, TRIM), box(x, 1.2, 1.2, 0.1, 1.15, 0.09, WD2, TRIM)]; }),
              box(-3.6, 0.16, -1.3, 1.4, 0.06, 1.4, ROCK, STONE, { uv: [1.75, 1.75] }), cyl(-3.6, 1.8, -1.3, 0.09, 1.04, TIN, 0x3a3d40, { seg: 8 }),                  // the pipe from the stove's top to the ceiling (the stove itself = the `wood_stove` model since the model pass)
              box(lx, 0.165, d / 2 - 1.0, 1.5, 0.02, 0.9, 'urban:CarpetPlain1c', 0x4f6a4a, { sides: false }),                                                     // the door mat
              box(1.0, 1.02, d / 2 - 0.62, 1.5, 0.06, 0.6, WD2, 0x8a7a62), box(0.33, 0.16, d / 2 - 0.62, 0.08, 0.86, 0.5, WD2, DARK), box(1.67, 0.16, d / 2 - 0.62, 0.08, 0.86, 0.5, WD2, DARK),   // the counter by the door
              box(0.6, 1.9, -d / 2 + 0.34, 1.3, 0.05, 0.3, WD2, DARK), box(4.6, 1.9, -d / 2 + 0.34, 0.6, 0.05, 0.3, WD2, DARK),                                   // two wall shelves on the back wall
          ];
          features.push({ k: 'arch', id: 'woods:ranger:arch', x: cx, z: cz, rot: 180, parts });
          const P = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
          P('rocking_chair', 3.9, d / 2 + 1.5, { face: 160, y: 0.16 }); P('railway_lantern', 1.6, d / 2 + 2.9, { y: 0.16 }); P('psx_wooden_crate_2', -1.9, d / 2 + 0.7, { y: 0.16 });
          P('metal_trash_can', -6.4, d / 2 + 2.4); P('axe_chopping_block', -7.2, 0.3, { face: 40 }); P('wooden_bucket', -6.3, -0.6);
          P('firewood_stack', -4.2, d / 2 + 0.5, { y: 0.16 }); P('firewood_stack', -4.62, 0.9, { y: 0.16, face: 90 }); P('wood_stove', -3.6, -1.3, { y: 0.22, face: 270 }); P('backpack', -2.6, d / 2 + 2.6, { y: 0.16, face: 150 });
          P('fire_danger_sign', 6.2, d / 2 + 4.6, { face: 180 }); P('mailbox', -6.6, d / 2 + 5.2, { face: 180 }); P('antler_trophy', 0.75, -3.12, { y: 2.15, face: 180 });
          /* PASS 2, THE INTERIOR: blockers against the walls, the door's square and the middle of the room clear; every lit piece carries noLight */
          const F = 0.16, T = 1.13;   // the floor boards; the desk's top
          P('psx_table_large_2', 3.0, 2.55, { y: F }); P('psx_chair_mp_1', 3.0, 1.7, { y: F, face: 180 }); P('field_radio', 3.55, 2.75, { y: T }); P('psx_lamp_1_on', 2.35, 2.8, { y: T, noLight: true });
          P('item_walkie_talkie', 3.15, 2.4, { y: T, face: 40 }); P('coffee_mug', 2.6, 2.35, { y: T }); P('psx_book_mp_1', 2.75, 2.7, { y: T, face: 20 }); P('item_binoculars', 3.65, 2.35, { y: T, face: 300 });
          P('radio_console', 4.5, 2.6, { y: F }); P('psx_shelf_mp_5', 4.72, -2.2, { y: F, face: 90 }); P('psx_bedside_table_1', 4.6, 0.4, { y: F, face: 90 }); P('coffee_maker', 4.6, 0.25, { y: 0.8 }); P('coffee_mug', 4.55, 0.65, { y: 0.8 });
          P('map_table', 1.7, -0.5, { y: F }); P('psx_book_mp_2', 1.3, -0.4, { y: 0.94, face: 15 }); P('psx_flashlight_1', 2.3, -0.7, { y: 0.94, face: 70 }); P('item_flare_gun', 1.9, -0.2, { y: 0.94, face: 200 }); P('psx_matchbox_1', 1.1, -0.8, { y: 0.94 });
          P('evidence_board', 0.75, -2.85, { y: F, face: 180 }); P('rifle_rack', -1.0, -2.9, { y: F, face: 180 }); P('psx_wardrobe_mp_1', -4.3, -2.85, { y: F, face: 180 });
          P('psx_bed_1', -3.45, 2.45, { y: F }); P('psx_pillow_mp_1', -4.4, 2.45, { y: 0.75 }); P('footlocker', -1.75, 2.5, { y: F, face: 90 }); P('psx_armchair_1', -1.9, -0.9, { y: F, face: 90 });
          P('psx_carpet_mp_1', -0.3, 0.2, { y: 0.17 }); P('brochure_rack', 1.0, 3.12, { y: 1.1 }); P('psx_clock_1', 2.75, -3.17, { y: 2.45, face: 180 }); P('psx_painting_1', -w / 2 + 0.36, -2.4, { y: 1.9, face: 270 });
          /* (the model pass: the two ceiling lamps are out: they drew above the roof, not under the ceiling; the lit plank ceiling lights the room) */
          P('psx_canned_food_mp_1', 0.3, -3.15, { y: 1.96 }); P('psx_canned_food_mp_2', 0.6, -3.15, { y: 1.96 }); P('retro_radio', 0.95, -3.15, { y: 1.96, face: 180 }); P('psx_glass_bottle_1', 4.6, -3.15, { y: 1.96 });
          P('psx_supply_crate_1', -0.4, -2.95, { y: F }); P('psx_jerrycan_1', 4.3, -3.0, { y: F }); P('hw_candles', 0.6, 2.9, { y: 1.09 }); }
        /* ── THE TRAIL SHELTER (P02-03 The Crossroads): a three-sided log lean-to in a pocket of the trees on the trail's south side, open to the trail. Its back and
           its two ends stand on the pocket's own forest edges, so the walls you see are the walls you meet. ── */
        { const cx = gx(26), cz = gc(42), at = frame(cx, cz, 0);
          const logs = (x, z, w, d, h) => Array.from({ length: Math.round(h / 0.3) }, (_, i) => box(x, i * 0.3, z, w, 0.29, d, WD, i % 2 ? 0xd9c9ad : 0xeadcc2, { uv: [3.5, 0.3], gain: 1.5 }));
          features.push({ k: 'arch', id: 'woods:shelter', x: cx, z: cz, rot: 0, parts: [
              ...logs(0, 1.5, 7.0, 0.3, 2.4), ...logs(-3.35, 0, 0.3, 3.0, 2.7), ...logs(3.35, 0, 0.3, 3.0, 2.7),
              box(-3.35, 0, -1.55, 0.3, 3.1, 0.3, WD2, DARK), box(3.35, 0, -1.55, 0.3, 3.1, 0.3, WD2, DARK), box(0, 0, -1.55, 0.26, 3.1, 0.26, WD2, DARK), box(0, 2.95, -1.55, 7.2, 0.24, 0.26, WD2, DARK),
              { s: 'roof', form: 'shed', p: [0, 2.45, -0.1], size: [7.8, 0.75, 4.3], key: SH, tint: MOSS, keyEnd: WD2, tintEnd: DARK, roof: true, under: true },
              box(0, 0, 0.1, 6.6, 0.14, 2.9, FL, BOARD, { uv: [1.75, 1.75] }),                                                                                       // the sleeping deck
              box(0, 0.14, 1.0, 6.4, 0.34, 0.5, WD2, DARK), box(0, 0.48, 1.0, 6.4, 0.06, 0.6, WD2, 0xa89478),                                                        // the bench along the back wall
          ] });
          const P = (key, rx, rz, o) => props.push(Object.assign({ key }, at(rx, rz), o || {}));
          P('sleeping_bag', -1.6, -0.2, { y: 0.14 }); P('backpack', -2.9, 0.9, { y: 0.14, face: 200 }); P('kettle', 1.5, 0.95, { y: 0.54 }); P('meshy_burlap_sack', 2.3, 0.8, { y: 0.54 }); P('railway_lantern', 0.4, 0.95, { y: 0.54 }); P('psx_canned_food_mp_1', 0.9, 1.0, { y: 0.54 }); }
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
          /* the two leaves = the `braced_gate` model since the model pass (they were two arch rows of drawn rails), swung open into the Woods */
          props.push({ key: 'braced_gate', x: r2(gap - 3.69), z: r2(z - 1.65), face: 105 }, { key: 'braced_gate', x: r2(gap + 3.69), z: r2(z - 1.65), face: 75 }); }
        /* ── THE OLD PLAYGROUND (P02-05 Deep woods, east): the Playground pack's three pieces on a worn dirt lot in the trees ── */
        props.push({ key: 'play_swing', x: gc(32), z: gc(64), face: 20 }, { key: 'play_slide', x: gc(31), z: gc(66), face: 300 }, { key: 'play_sandbox', x: r2(gc(33) - 0.4), z: r2(gc(65) + 0.9), face: 15 });
        /* ── THE COURT AT THE FOOT OF THE STAIR (P02-04): two lamp posts and two stone urns where the marble meets the dirt. The flight itself is not touched. ── */
        { const fx = gx(31), fz = gx(57);   // the foot's middle
          props.push({ key: 'lantern_post', x: r2(fx - 2.6), z: r2(fz + 1.2), face: 0 }, { key: 'lantern_post', x: r2(fx + 2.6), z: r2(fz + 1.2), face: 0 });   // the model pass: were drawn posts
          props.push({ key: 'stone_urn', x: r2(fx - 2.5), z: r2(fz + 3.2) }, { key: 'stone_urn', x: r2(fx + 2.5), z: r2(fz + 3.2) }); }
        dressing(ctx);
        atmosphere(ctx);
        models(ctx);
    },
};
