/* THE MOUNTAINS · THE SKI LODGE + SLOPES (district K, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P07-00 The Black Run, top (18)          P08-00 The Top Station (18)             P09-00 The Half-Pipe (17)
     P07-01 The Black Run (15)               P08-01 The Big Jump (14)                P09-01 The Slalom (14)
     P07-02 The Run-Out (11)                 P08-02 The Chairlift (11)               P09-02 The Bunny Slope (11)
     P07-03 The Rental Hut (8)               P08-03 The Ski Lodge (8)                P09-03 The Lodge Yard (8)

   WHAT STANDS HERE TODAY
   - Walked into: THE SKI LODGE (P08-03: fire, bar, tables, jukebox, arcade, air hockey), THE RENTAL HUT (P07-03: counter, boards on the wall), THE TOP STATION (P08-00)
   - Five runs on the tool's slope sheet (one even grade, the board rolls them): the Black Run through the trees (P07-00..02), the Big Jump's kicker (P08-01, a `ramp`), the Slalom's five gates (P09-01), the Half-Pipe's banks (P09-00, ten `ramp` rows), the Bunny Slope (P09-02)
   - THE CHAIRLIFT: six towers and gondola chairs up the middle, two grind rails under it, a door pair `lift_bottom` / `lift_top` (same room) that carries you
   - The Lodge Yard (P09-03) is the room's spawn (the tool's)

   KNOWN MISSING OR WRONG
   - Only the Lodge was seen on screen (one probe view after the swap). The runs, the lift, the huts' insides: never. mondo has not looked
   - Nothing rides the cable: the chairs hang still
   - mondo asked for "a ski loft and ski slopes, for skateboarding": nobody has ridden a run in the game yet. Check the kicker and the half-pipe with the board
   - No encounter table, nobody lives or works here (no one at the bar or the rental counter)

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The slope itself (zflat: no shelves on columns 7-9 of the plan), the paint of the runs, the spawn
   - The Bunny Slope's join east to Olympus' Sacred Way (the plan's own ports)
   - ctx.cabin (the log building, shared with district P): a change to it changes the Warming Hut too, so it needs a note on the board

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE SKI LODGE (walked into): the great room, the fire, the bar */
  const LODGE = building('lodge', 'P08-03', [2, 2, 10, 8, 'S'], 5.25, { leafDouble: true }, (a, w, d, dr) => cabin(a, w, d, dr, { h: 5.25, rh: 6.2, chimney: 9.5, porch: true, name: 'SKI LODGE' }));
  LODGE.put('campfire', 9.5, -8.4); LODGE.put('chesterfield_sofa', 9.5, -4.6, { face: 0 }); LODGE.put('wingback_chair', 6.2, -6.4, { face: 60 }); LODGE.put('wingback_chair', 12.6, -6.4, { face: 300 }); LODGE.put('rug_round', 9.5, -6.2, { y: 0.17 });
  LODGE.put('coffee_table', 9.5, -6.0); LODGE.put('xmas_cocoa', 9.5, -6.0, { y: 0.5 }); LODGE.put('mobius_bar', -10.5, -7.2, { face: 90 }); for (const z of [-9, -7.4, -5.8, -4.2]) LODGE.put('bar_stool', -8.6, z);
  for (const q of [[-3, -5], [2, -1.5], [-5, 2.5]]) { LODGE.put('round_table', q[0], q[1]); LODGE.put('psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); LODGE.put('psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); LODGE.put('coffee_mug', q[0], q[1], { y: 0.78 }); }
  LODGE.put('jukebox', -12.8, 2, { face: 90 }); LODGE.put('arcade_cabinet', -12.8, 4.4, { face: 90 }); LODGE.put('air_hockey_table', 8, 4); LODGE.put('trophy_case', 13.2, 1, { face: 270 }); LODGE.put('locker_bench', 4, 8.6, { face: 180 });
  LODGE.put('notice_board', -5, 9.9, { y: 1.5, face: 0 }); LODGE.put('psx_sofa_3', 1, -8.8, { face: 180 }); LODGE.put('xmas_tree', -2.5, 7.2, { h: 3.4, floor: true });
  /* THE RENTAL HUT: boards on the wall, a counter */
  const RENT = building('rental', 'P07-03', [4, 4, 8, 7, 'S'], 3.5, {}, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.6, tint: 0x8a4a3a, name: 'RENTALS' }));
  RENT.put('form_counter', 0, -1.5, { face: 180 }); for (const x of [-4.6, -2.3, 2.3, 4.6]) RENT.put('skateboard', x, -4.7, { y: 1.1, face: 180 }); RENT.put('locker', -6, 2.5, { face: 90 }); RENT.put('locker', -6, 1.2, { face: 90 });
  RENT.put('locker_bench', 4.5, 2.6, { face: 0 }); RENT.put('price_tag', 0.8, -1.5, { y: 1.05 });
  /* THE TOP STATION, where the chairlift lets you off and every run starts */
  const TOP = building('topstation', 'P08-00', [4, 3, 8, 7, 'S'], 3.5, { leaf: 'leaf_frame_only' }, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.4, tint: 0x5a6a7a, name: 'TOP STATION' }));
  TOP.put('locker_bench', -4.5, -5.5, { face: 0 }); TOP.put('locker_bench', 4.5, -5.5, { face: 0 }); TOP.put('notice_board', 0, -6.85, { y: 1.5, face: 180 }); TOP.put('railway_lantern', 5.6, 5.2);
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── THE SKI LODGE + SLOPES: five runs (the Black Run, the Big Jump, the Slalom, the Half-Pipe, the Bunny Slope), groomed ice you ride down on the board ── */
  const SP = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'];
  for (const id of ['P07-00', 'P07-01', 'P07-02']) for (let ly = 1; ly < N; ly += 3) { tree(id, SP[ly % 3], 6 + (ly % 2), 2, ly); tree(id, SP[(ly + 1) % 3], 6.5, 9, ly + 1 < N ? ly + 1 : ly); }   // THE BLACK RUN: trees both sides
  { const q = S('P08-01', 4, 5); feat({ k: 'ramp', x0: gx(q[0] + 2), z0: gz(q[1]), x1: gx(q[0] + 2), z1: gz(q[1] + 2), w: 14, h0: 0, h1: 2.4, edge: 0.3 }); }                                                   // THE BIG JUMP: the kicker (you come down onto it; it throws you over the landing)
  put('P08-01', 'signpost', 2, 3, { face: 180 });
  { const p = R.byId['P09-01']; [[4, 1], [7, 3], [4, 5], [7, 7], [4, 9]].forEach(([lx, ly], i) => look('gate' + i, mx(p.lx * N + lx), mz(p.ly * N + ly), a => { for (const s of [-1, 1]) { a.cyl(s * 1.5, 0, 0, 0.06, 1.9, null, i % 2 ? 0xd03030 : 0x3050d0, { seg: 6 }); a.box(s * 1.5 + 0.3, 1.35, 0, 0.6, 0.5, 0.03, null, i % 2 ? 0xd03030 : 0x3050d0); } })); }   // THE SLALOM: five gates
  { const p = R.byId['P09-00'], xw = gx(p.lx * N + 5), xe = gx(p.lx * N + 7);   // THE HALF-PIPE: the floor two squares wide, a bank rising 3.2 m either side over two squares (in 7 m pieces down the hill, so each piece lies on its own stretch of slope)
    for (let ly = 1; ly < 11; ly += 2) { const zc = gz(p.ly * N + ly + 1); feat({ k: 'ramp', x0: xw, z0: zc, x1: r2(xw - 7), z1: zc, w: 7, h0: 0, h1: 3.2, edge: 0.05 }); feat({ k: 'ramp', x0: xe, z0: zc, x1: r2(xe + 7), z1: zc, w: 7, h0: 0, h1: 3.2, edge: 0.05 }); } }
  { const p = R.byId['P08-02'], x = gx(p.lx * N + 6);   // THE CHAIRLIFT's line: two pipe rails and two boxes under the chairs
    feat({ k: 'rail', x0: r2(x - 5.25), z0: gz(p.ly * N + 3), x1: r2(x - 5.25), z1: gz(p.ly * N + 8), model: 'pipe', block: false }); feat({ k: 'rail', x0: r2(x + 5.25), z0: gz(p.ly * N + 4), x1: r2(x + 5.25), z1: gz(p.ly * N + 9), model: 'pipe', block: false });
    put('P08-02', 'riser_1', 2, 9, { face: 0 }); put('P08-02', 'riser_1', 9, 2, { face: 0 }); }
  /* the lift: a tower every twelve squares from the Lodge to the Top Station, a chair hanging between; you ride it by its two stations' doors */
  { const top = S('P08-00', 6, 8), bot = S('P08-03', 6, 0), x = gx(top[0]);
    for (let sy = top[1] + 1, i = 0; sy <= bot[1]; sy += 7, i++) { look('lift' + i, x, gz(sy), a => { a.box(0, 0, 0, 0.5, 9, 0.5, U('MetalWallRibbed1a'), 0x5a6068); a.box(0, 8.6, 0, 5.0, 0.3, 0.4, U('MetalWallRibbed1a'), 0x5a6068); for (const s of [-1, 1]) a.cyl(s * 2.2, 8.9, 0, 0.35, 0.16, null, 0x2a2e34, { seg: 10 }); });
        if (i % 2 === 0) props.push({ key: 'decor_ferris_gondola', x: r2(x + 2.2), z: gz(sy + 3), y: 4.6, face: 0 }, { key: 'decor_ferris_gondola', x: r2(x - 2.2), z: gz(sy + 4), y: 4.6, face: 180 }); }
    R.doors.push(Object.assign({ id: 'lift_top', wall: 'free', x: r2(x + 3.5), z: gz(top[1]), face: 180, leaf: 'leaf_frame_only', action: { room: R.o.id, at: 'lift_bottom' } }, DOORWORDS('THE CHAIRLIFT', 'DOWN TO THE SKI LODGE', 'The chair comes round the wheel and does not stop. You sit down at the right moment or you do not.')));
    R.doors.push(Object.assign({ id: 'lift_bottom', wall: 'free', x: r2(x + 3.5), z: gz(bot[1] + 1), face: 0, leaf: 'leaf_frame_only', action: { room: R.o.id, at: 'lift_top' } }, DOORWORDS('THE CHAIRLIFT', 'UP TO THE TOP STATION', 'The lift line goes up the middle of the slopes. Every run starts where it ends.')));
    R.taken.add(top[0] + 1 + ':' + top[1]); R.taken.add(bot[0] + 1 + ':' + (bot[1] + 1)); }
  put('P09-02', 'xmas_snowman_2', 1, 6); dec('P09-02', 'traffic_cone', 1, 3); dec('P09-02', 'traffic_cone', 10, 3); dec('P09-02', 'traffic_cone', 10, 8);
  put('P09-03', 'signpost', 4, 4, { face: 180 }); put('P09-03', 'park_bench', 2, 3, { face: 180 }); put('P09-03', 'park_bench', 8, 3, { face: 180 }); put('P09-03', 'xmas_tree_plain', 9, 7, { h: 4.4, floor: true }); put('P09-03', 'sleigh', 2, 8, { face: 90 });
  put('P07-03', 'xmas_snowman', 2, 9); put('P08-03', 'campfire', 5, 10); put('P08-03', 'park_bench', 3, 10, { face: 0 }); put('P08-03', 'park_bench', 7, 10, { face: 0 }); put('P07-02', 'signpost', 9, 9, { face: 90 });
};
