/* THE MOUNTAINS · THE NORTH POLE VILLAGE (district N, 16 plots of room `site_prebuilt_northpole_plots`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P00-00 The Drift (10)                   P01-00 The Pole (10)                    P02-00 The Workshop (10)
     P03-00 The Village, north (10)          P00-01 The Drift, south (10)            P01-01 The Village, west (10)
     P02-01 The Village (10)                 P03-01 The Village, east (10)           P00-02 The Frozen Lake, north (9)
     P01-02 The Frozen Lake, east (9)        P02-02 The Sleigh Road (9)              P03-02 The Sleigh Road, east (9)
     P00-03 The Frozen Lake, south (9)       P01-03 The Snowline, west (9)           P02-03 The Snowline (9)
     P03-03 The Snowline, east (9)

   WHAT STANDS HERE TODAY
   - THE WORKSHOP (P02-00, walked into, door east): red boards on a stone foot, snow roof, hearth, two work tables, gifts. Its hearth is the link `northpole_haunted` (ctx.anchor('hearth'))
   - 16 cottages: every run of the plan's `B` squares is one `xmas_house` prop (the pack's own house; NOT walked into)
   - THE POLE (P01-00): a striped pole on a cairn. The village tree, benches, a fire, Santa Clause (P02-01), a gnome (P03-00), the yeti in the Drift (P00-00), all with their old lines
   - THE FROZEN LAKE: walked and skated on, a pipe grind rail round its north shore. Sleighs on the Sleigh Road, snowmen, plain trees
   - Night sky, snow pines in the plan's tree squares (the tool's tree zones)

   KNOWN MISSING OR WRONG
   - NEVER SEEN ON SCREEN: the first delivery was compiled headless only (no NaN, every door resolves); mondo has not looked at it. Your first job is a probe run and pictures (RULE #1c)
   - The cottages are props with no inside. No Ice Queen is placed. No encounter table
   - 4 open squares are not reached on foot (the tool's count `unreachedSquares`)
   - The world plan's Ice Wall is still open with mondo: do not build it without his word

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The Pass Gate door `pass` (P03-01, east wall), the sleigh road's way out to Camelot (P03-03, south wall; link `northpole_camelot`), DOOR HQ's bay door (P01-03, south wall)
   - The heights, the paint, the tree zones, the sky, the edges

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE WORKSHOP (walked into): red boards on a stone foot, a snow roof, lit windows; its door on the east side, off the village lane */
  const SHOP = building('workshop', 'P02-00', [3, 3, 9, 8, 'E'], 5.25, { keyIn: WD, floorIn: 'wood_planks' }, (a, w, d, dr) => {
      a.shell(w, 5.25, d, WD, 0xb84438, dr, [3.5, 1.75]); a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, 'rocks_5', 0xa8a8b0, { faces: 'blr', top: false });
      a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
      a.roof('gable', 0, 5.25, 0, w + 1.8, 3.8, d + 1.8, 'ice', 0xf4f8ff, { keyEnd: WD, tintEnd: 0xb84438 });
      for (const x of [-5.2, 5.2]) a.box(x, 1.6, d / 2 + 0.08, 1.3, 1.5, 0.12, GLS, 0xf0d890, { glow: 0.7 });
      for (const s of [-1, 1]) for (const z of [-6, 0, 6]) a.box(s * (w / 2 + 0.06), 1.6, z, 0.1, 1.5, 1.3, GLS, 0xf0d890, { glow: 0.7 });
      a.box(dr.lx - dr.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, 0xf4f4f4); a.box(dr.lx + dr.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, 0xf4f4f4); a.box(dr.lx, 2.25, d / 2 + 0.1, dr.cw + 0.5, 0.2, 0.2, WD2, 0xf4f4f4);
      a.box(w / 2 - 1.6, 5.25, -d / 2 + 1.2, 1.3, 5.2, 1.3, 'bricks_2', 0xb86a54, { roof: true });                       // the chimney over the hearth
      a.box(w / 2 - 1.6, 0, -d / 2 + 0.6, 2.6, 2.2, 1.0, 'bricks_2', 0xb86a54); });                                      // the hearth inside, on the back wall
  SHOP.put('psx_table_large_3', -2, -2, { face: 90 }); SHOP.put('psx_table_large_3', -2, -7, { face: 90 }); SHOP.put('xmas_hammer', -2, -2, { y: 0.82 }); SHOP.put('xmas_hammer_2', -1.2, -7, { y: 0.82 });
  SHOP.put('xmas_cocoa', -2.6, -6.6, { y: 0.82 }); SHOP.put('xmas_gingerbread', -2.4, -2.6, { y: 0.82 }); SHOP.put('xmas_gift', -6.8, -8.6); SHOP.put('xmas_gift_2', -5.6, -8.9, { face: 30 }); SHOP.put('xmas_gift_3', -7, -6.6);
  SHOP.put('xmas_gift_4', 6.6, 6.8, { face: 60 }); SHOP.put('cardboard_boxes', -6.6, 6.4); SHOP.put('cardboard_box', -5.2, 7.4, { face: 40 }); SHOP.put('sea_chest', 6.4, 2.2, { face: 270 }); SHOP.put('xmas_tree', 5.6, 8.0, { h: 3.2, floor: true });
  SHOP.put('xmas_stocking', 4.2, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_stocking_2', 4.9, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_garland', 0, -10.2, { y: 3.4, face: 180 }); SHOP.put('xmas_wreath', -4, -10.2, { y: 2.6, face: 180 });
  R.anchor('hearth', { x: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[0], z: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[1], face: SHOP.face(180) });   // the fireplace: the link `northpole_haunted`
  /* the cottages: every other run of the plan's `B` is one of the pack's own houses, its door to the nearest snow */
  { const seen = new Set(); for (let y = 0; y < R.H; y++) for (let x = 0; x < R.W; x++) { if (R.cell[y][x] !== 'B' || seen.has(x + ':' + y) || R.taken.has(x + ':' + y)) continue;
        const run = [], st = [[x, y]]; seen.add(x + ':' + y);
        while (st.length) { const q = st.pop(); run.push(q); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = q[0] + dx, Y = q[1] + dy; if (R.inR(X, Y) && R.cell[Y][X] === 'B' && !seen.has(X + ':' + Y) && !R.taken.has(X + ':' + Y)) { seen.add(X + ':' + Y); st.push([X, Y]); } } }
        const x0 = Math.min(...run.map(q => q[0])), x1 = Math.max(...run.map(q => q[0])) + 1, y0 = Math.min(...run.map(q => q[1])), y1 = Math.max(...run.map(q => q[1])) + 1;
        const n = { S: 0, N: 0, E: 0, W: 0 }; for (let i = x0; i < x1; i++) { if (R.open(i, y1) && R.cell[y1][i] !== 'B') n.S++; if (R.open(i, y0 - 1) && R.cell[y0 - 1][i] !== 'B') n.N++; } for (let j = y0; j < y1; j++) { if (R.open(x1, j) && R.cell[j][x1] !== 'B') n.E++; if (R.open(x0 - 1, j) && R.cell[j][x0 - 1] !== 'B') n.W++; }
        const side = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
        run.forEach(q => R.taken.add(q[0] + ':' + q[1])); R.flats.push([x0, y0, x1, y1, side]);
        props.push({ key: 'xmas_house', x: r2((gx(x0) + gx(x1)) / 2), z: r2((gz(y0) + gz(y1)) / 2), face: { S: 180, N: 0, E: 90, W: 270 }[side], h: 5.6, floor: true }); R.count.cottages = (R.count.cottages || 0) + 1; } }
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE POLE (the landmark): a striped pole on a cairn */
  { const q = S('P01-00', 7, 6); look('thepole', mx(q[0]), mz(q[1]), a => { for (let i = 0; i < 6; i++) a.cyl(0, i, 0, 0.3, 1.0, 'marble_light', i % 2 ? 0xf4f4f4 : 0xc83030, { seg: 10 }); a.cyl(0, 6, 0, 0.55, 0.7, 'marble_light', 0xc83030, { seg: 12 }); });
    R.taken.add(q[0] + ':' + q[1]); for (const d of [[-1, 0], [1, 1], [0, -1]]) props.push({ key: 'ocean_rock', x: r2(mx(q[0]) + d[0] * 1.5), z: r2(mz(q[1]) + d[1] * 1.5), face: Math.round(R.rnd() * 360) });
    put('P01-00', 'signpost', 5, 8, { face: 200 }); dec('P01-00', 'xmas_gift_3', 8, 5); }
  /* THE VILLAGE: the tree on the square, the fire, the snowmen, the presents */
  put('P02-01', 'xmas_tree', 5, 5, { h: 4.6, floor: true }); dec('P02-01', 'xmas_gift', 6, 6); dec('P02-01', 'xmas_gift_2', 4, 6); dec('P02-01', 'xmas_gift_3', 6, 4); dec('P02-01', 'xmas_gift_4', 4, 4);
  put('P02-01', 'park_bench', 3, 5, { face: 90 }); put('P02-01', 'campfire', 7, 6); native('P02-01', 'santa clause', 5, 7, 180, say('pole', 'santa clause'));
  put('P01-01', 'xmas_snowman', 5, 4); put('P01-01', 'xmas_tree_plain', 7, 5, { h: 4.2, floor: true }); dec('P01-01', 'xmas_gift_2', 6, 6); put('P01-01', 'xmas_snowman_3', 4, 6);
  put('P03-01', 'xmas_snowman_2', 5, 4); put('P03-01', 'xmas_tree_plain', 4, 6, { h: 4.2, floor: true }); dec('P03-01', 'xmas_gift_4', 6, 5); put('P03-01', 'signpost', 9, 5, { face: 90 });
  put('P03-00', 'xmas_tree', 5, 5, { h: 3.6, floor: true }); native('P03-00', 'gnome', 3, 5, 270, say('pole', 'gnome')); dec('P03-00', 'xmas_gift', 6, 4); dec('P03-00', 'cardboard_boxes', 6, 6);
  /* THE DRIFT: the yeti's end of the valley */
  native('P00-00', 'yeti', 5, 7, 90, say('pole', 'yeti')); put('P00-00', 'xmas_snowman', 4, 6); dec('P00-00', 'sea_chest', 6, 8); tree('P00-01', 'xmas_snow_pine', 6.5, 5, 5); dec('P00-01', 'fallen_log', 6, 6);
  /* THE SLEIGH ROAD and THE SNOWLINE */
  put('P02-02', 'sleigh', 5, 5, { face: 90 }); put('P02-02', 'sleigh', 6, 7, { face: 60 }); dec('P02-02', 'xmas_gift', 4, 6); put('P03-02', 'signpost', 6, 6, { face: 0 }); put('P03-02', 'campfire', 5, 7);
  put('P01-03', 'xmas_snowman_2', 6, 5); tree('P02-03', 'xmas_snow_pine_2', 6, 4, 6); put('P03-03', 'xmas_tree_plain', 7, 6, { h: 3.8, floor: true }); dec('P03-03', 'xmas_gift_3', 6, 7); dec('P02-03', 'fallen_log', 5, 7);
  /* THE FROZEN LAKE: you walk (and skate) on it; a pipe rail round the north shore to grind */
  { const q = S('P00-02', 9, 6); R.feat({ k: 'rail', arc: { x: mx(q[0]), z: mz(q[1]), r: 24, a0: 300, a1: 60 }, model: 'pipe', block: false }); }
  dec('P00-03', 'cave_stone', 4, 5); dec('P01-02', 'stump', 6, 5);
};
