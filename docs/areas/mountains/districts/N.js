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

   WHAT STANDS HERE TODAY (seen on screen 11-16, the district thread's first look + the exteriors pass)
   - THE WORKSHOP (P02-00, walked into, door east): red boards on a stone foot, snow roof, white trim, lit windows, its board over the door, hearth, two work
     tables, gifts. Its hearth is the link `northpole_haunted` (ctx.anchor('hearth'))
   - 15 COTTAGES, each a walked-in building (COTTAGES below: one row a house; 7 x 7 m, a door, lit windows, a snow roof, lights along the front). Five wear a
     plain board (POST OFFICE, BAKERY, TOY SHOP, STABLE, COAL): plain labels, waiting for mondo's word. Their insides are EMPTY (the interiors pass)
   - THE POLE (P01-00): a striped pole with a gilt ball on a stone ring. The village tree, benches, a fire, Santa Clause (P02-01), a gnome (P03-00), the yeti in
     the Drift (P00-00), all with their old lines
   - THE FROZEN LAKE: walked and skated on, a pipe grind rail round its north shore. Sleighs on the Sleigh Road, snowmen, plain trees
   - Night sky, snow pines in the plan's tree squares (the tool's tree zones)

   KNOWN MISSING OR WRONG
   - The cottages' insides are empty; the Workshop's inside is dark and thin (next pass). No Ice Queen is placed. No encounter table
   - The lake's ice reads like the snow at night (the tool's paint: `ice_1` beside `ice`)
   - The world plan's Ice Wall is still open with mondo: do not build it without his word

   NEEDS A MODEL (nothing in the catalogue fits; no stand-in is placed)
   - a reindeer (the Stable has none), a street lamp / lantern post for the lanes, a mail box, a sled

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
      for (const x of [-7, -3.6, 5.2, 8.2]) pane(a, x, 1.3, d / 2 + 0.08, 1.4, 1.7, false, 0x3f6b4a, ctx);
      for (const s of [-1, 1]) for (const z of [-6, 0, 6]) pane(a, z, 1.3, s * (w / 2 + 0.08), 1.4, 1.7, true, 0x3f6b4a, ctx);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) a.box(dr.lx + s * (dr.cw / 2 + 0.14), i * 0.5, d / 2 + 0.12, 0.26, 0.5, 0.26, 'marble_light', i % 2 ? TRIM : 0xc83030);   // candy posts at the door
      a.box(dr.lx, 2.5, d / 2 + 0.12, dr.cw + 0.8, 0.22, 0.26, 'marble_light', TRIM); a.box(dr.lx, 0, d / 2 + 0.7, dr.cw + 1.6, 0.14, 1.3, 'rocks_5', 0xb8b8c0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.4, 5.25, 0.4, 'marble_light', TRIM);
      a.sign('WORKSHOP', dr.lx, 3.3, d / 2 + 0.16, 6.2, 1.1, '#f6efd8', '#1f4a2a', 'fell'); bulbs(a, -w / 2 + 0.4, w / 2 - 0.4, 5.05, d / 2 + 0.16);
      a.box(w / 2 - 1.6, 5.25, -d / 2 + 1.2, 1.3, 5.2, 1.3, 'bricks_2', 0xb86a54, { roof: true });                       // the chimney over the hearth
      a.box(w / 2 - 1.6, 0, -d / 2 + 0.6, 2.6, 2.2, 1.0, 'bricks_2', 0xb86a54); });                                      // the hearth inside, on the back wall
  SHOP.put('psx_table_large_3', -2, -2, { face: 90 }); SHOP.put('psx_table_large_3', -2, -7, { face: 90 }); SHOP.put('xmas_hammer', -2, -2, { y: 0.82 }); SHOP.put('xmas_hammer_2', -1.2, -7, { y: 0.82 });
  SHOP.put('xmas_cocoa', -2.6, -6.6, { y: 0.82 }); SHOP.put('xmas_gingerbread', -2.4, -2.6, { y: 0.82 }); SHOP.put('xmas_gift', -6.8, -8.6); SHOP.put('xmas_gift_2', -5.6, -8.9, { face: 30 }); SHOP.put('xmas_gift_3', -7, -6.6);
  SHOP.put('xmas_gift_4', 6.6, 6.8, { face: 60 }); SHOP.put('cardboard_boxes', -6.6, 6.4); SHOP.put('cardboard_box', -5.2, 7.4, { face: 40 }); SHOP.put('sea_chest', 6.4, 2.2, { face: 270 }); SHOP.put('xmas_tree', 5.6, 8.0, { h: 3.2, floor: true });
  SHOP.put('xmas_stocking', 4.2, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_stocking_2', 4.9, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_garland', 0, -10.2, { y: 3.4, face: 180 }); SHOP.put('xmas_wreath', -4, -10.2, { y: 2.6, face: 180 });
  R.anchor('hearth', { x: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[0], z: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[1], face: SHOP.face(180) });   // the fireplace: the link `northpole_haunted`
  /* THE COTTAGES (the exteriors pass, 11-16): the first look showed sixteen copies of one white town house prop, too wide for their squares. Each run of
     the plan's `B` squares is now a built house of its own you can walk into: [id, plot, lx, ly, front, wall tint, opts]. */
  COTTAGES.forEach(([id, plot, lx, ly, side, tint, q]) => { q = Object.assign({ h: 3.3, rh: 2.6, tint }, q);
      building(id, plot, [lx, ly, lx + 2, ly + 2, side], q.h, { keyIn: WD, floorIn: 'wood_planks' }, (a, w, d, dr) => cottage(a, w, d, dr, q, ctx)); R.count.cottages = (R.count.cottages || 0) + 1; });
};
exports.tailor = t => { t.set('P03-00', 7, 8, 's'); t.set('P03-00', 7, 9, 's'); };   // the two-square nook east of the Coal store was cut off by one drift square: it is the store's yard now

/* ── a cottage's look. Parts frame: the house's middle, x along the front, +z out of the front. ── */
const TRIM = 0xf6f6f2, PANE = 0xffc070, BULBS = [0xff3828, 0x38d058, 0xffc030, 0x4890ff];
const pane = (a, x, y, z, w, h, ew, shut, ctx) => {   // a lit window: a warm pane, a white frame and cross, shutters (ew: on a side wall)
    const B = (px, py, pz, bw, bh, bd, key, tint, q) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, q) : a.box(px, py, pz, bw, bh, bd, key, tint, q), o = z < 0 ? -1 : 1;
    B(x, y, z, w, h, 0.06, 'marble_light', PANE, { glow: 1.0 }); B(x, y, z + o * 0.03, 0.07, h, 0.08, 'marble_light', TRIM); B(x, y + h / 2 - 0.035, z + o * 0.03, w, 0.07, 0.08, 'marble_light', TRIM);
    B(x, y - 0.1, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM); B(x, y + h, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM);
    if (shut != null) for (const s of [-1, 1]) B(x + s * (w / 2 + 0.2), y, z + o * 0.02, 0.34, h, 0.06, ctx.WD, shut); };
const bulbs = (a, x0, x1, y, z) => { const n = Math.max(2, Math.round((x1 - x0) / 0.7)); for (let i = 0; i <= n; i++) a.box(x0 + (x1 - x0) * i / n, y - (i % 2 ? 0.1 : 0), z, 0.13, 0.13, 0.13, 'marble_light', BULBS[i % 4], { glow: 1.6 }); };
const cottage = (a, w, d, dr, q, ctx) => { const { WD, WD2, FLR } = ctx, h = q.h;
    a.shell(w, h, d, WD, q.tint, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; });   // (gain: the boards' paint read as near black at night under the brown sheet)
    a.box(0, 0, 0, w + 0.4, 0.8, d + 0.4, 'rocks_5', 0xa8a8b0, { faces: 'blr', top: false });
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, h, 0.3, 'marble_light', TRIM);
    if (q.front) a.roof('gable', 0, h, 0, d + 1.6, q.rh, w + 1.6, 'ice', 0xf4f8ff, { ry: 90, keyEnd: WD, tintEnd: q.tint, gain: 1.7 });      // the gable over the door
    else a.roof('gable', 0, h, 0, w + 1.6, q.rh, d + 1.6, 'ice', 0xf4f8ff, { keyEnd: WD, tintEnd: q.tint, gain: 1.7 });                      // the eaves over the door
    /* the door: white posts and head, a step, the lights */
    for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.1), 0, d / 2 + 0.1, 0.2, 2.4, 0.2, 'marble_light', TRIM); a.box(dr.lx, 2.25, d / 2 + 0.1, dr.cw + 0.5, 0.2, 0.2, 'marble_light', TRIM);
    a.box(dr.lx, 0, d / 2 + 0.55, dr.cw + 0.9, 0.14, 1.0, 'rocks_5', 0xb8b8c0);
    bulbs(a, -w / 2 + 0.3, w / 2 - 0.3, Math.min(h - 0.12, 3.05), d / 2 + 0.14);
    /* the windows: one beside the door, one a side, one at the back */
    const wx = dr.lx < 0 ? w / 4 + 0.2 : -w / 4 - 0.2; pane(a, wx, 1.05, d / 2 + 0.08, 1.2, 1.3, false, q.shut, ctx);
    for (const s of [-1, 1]) pane(a, 0.4 * s, 1.05, s * (w / 2 + 0.08), 1.2, 1.3, true, q.shut, ctx);
    if (!q.chimney) pane(a, 0, 1.05, -d / 2 - 0.08, 1.2, 1.3, false, q.shut, ctx);
    if (q.front) a.box(0, h + 0.75, d / 2 + 0.84, 0.7, 0.7, 0.06, 'marble_light', PANE, { glow: 1.0, roof: true });                   // the loft's light in the gable
    if (q.chimney) { const cx = q.chimney; a.box(cx, 0, -d / 2 - 0.35, 1.3, h + q.rh + 0.7, 0.9, 'bricks_2', 0xb86a54, { roof: true }); a.box(cx, h + q.rh + 0.7, -d / 2 - 0.35, 1.5, 0.22, 1.1, 'ice', 0xf4f8ff, { roof: true });
        a.box(cx, 0, -d / 2 + 0.45, 1.9, 1.5, 0.7, 'bricks_2', 0xb86a54); a.box(cx, 1.5, -d / 2 + 0.5, 2.2, 0.14, 0.85, WD2, 0x5a4030); }                                                         // the hearth inside + its shelf
    if (q.porch) { a.box(0, 0, d / 2 + 1.2, w, 0.16, 2.3, FLR, 0x8c7a62); for (const s of [-1, 1]) for (let i = 0; i < 5; i++) a.box(s * (w / 2 - 0.2), i * 0.52, d / 2 + 2.15, 0.2, 0.52, 0.2, 'marble_light', i % 2 ? TRIM : 0xc83030);   // candy posts
        a.roof('shed', 0, 2.6, d / 2 + 1.25, w + 0.4, 0.6, 2.6, 'ice', 0xf4f8ff); }
    if (q.name) a.sign(q.name, 0, q.front ? h - 0.1 : 2.5, d / 2 + (q.porch ? 2.5 : q.front ? 0.86 : 0.16), Math.min(w - 1.2, q.name.length * 0.55 + 1.0), 0.72, '#f6efd8', q.board || '#7a1f1f', 'fell', (q.front || q.porch) ? { roof: true } : null); };
const RED = 0xb84438, GREEN = 0x3f6b4a, CREAM = 0xd8c8a8, BLUE = 0x5a7890, GINGER = 0x9a6238, PLUM = 0x7a4a6a, LOG = 0x7a5a40;
const COTTAGES = [
    /* the village square (P02-01), round the tree */
    ['post', 'P02-01', 2, 2, 'E', BLUE, { name: 'POST OFFICE', board: '#1f3a5a', front: true, shut: 0xf6f6f2 }],
    ['bakery', 'P02-01', 8, 3, 'W', GINGER, { name: 'BAKERY', board: '#5a2a1a', chimney: 1.8, porch: true, h: 3.5, shut: 0xf6f6f2 }],
    ['toys', 'P02-01', 3, 8, 'N', RED, { name: 'TOY SHOP', board: '#1f4a2a', front: true, h: 3.6, rh: 3.0, shut: 0x3f6b4a }],
    ['square4', 'P02-01', 8, 8, 'N', GREEN, { chimney: -1.8, shut: 0xb84438 }],
    /* the west lane (P01-01), homes */
    ['west1', 'P01-01', 2, 2, 'E', CREAM, { chimney: 1.8, shut: 0xb84438 }],
    ['west2', 'P01-01', 8, 3, 'W', RED, { front: true, shut: 0xf6f6f2 }],
    ['west3', 'P01-01', 3, 8, 'N', GREEN, { front: true, h: 3.5, shut: 0xf6f6f2, porch: true }],
    ['west4', 'P01-01', 8, 8, 'N', PLUM, { chimney: 1.8, shut: 0xf6f6f2 }],
    /* the east lane (P03-01), by the Pass Gate */
    ['stable', 'P03-01', 2, 2, 'E', LOG, { name: 'STABLE', board: '#3a2a20', front: true, h: 3.8, rh: 2.8 }],
    ['east2', 'P03-01', 8, 3, 'W', BLUE, { chimney: -1.8, shut: 0xf6f6f2 }],
    ['east3', 'P03-01', 3, 8, 'N', CREAM, { front: true, shut: 0x3f6b4a }],
    ['east4', 'P03-01', 8, 8, 'N', RED, { chimney: 1.8, shut: 0x3f6b4a, porch: true }],
    /* the north end (P03-00), under the rock */
    ['north1', 'P03-00', 2, 2, 'S', GREEN, { front: true, shut: 0xf6f6f2 }],
    ['north2', 'P03-00', 8, 3, 'W', GINGER, { chimney: 1.8, shut: 0xb84438 }],
    ['coal', 'P03-00', 3, 8, 'N', 0x4a4a52, { name: 'COAL', board: '#1a1a1e', front: true, h: 3.0, rh: 2.4 }],
];

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE POLE (the landmark): a striped pole on a cairn */
  { const q = S('P01-00', 7, 6); look('thepole', mx(q[0]), mz(q[1]), a => { a.cyl(0, 0, 0, 1.5, 0.5, 'rocks_5', 0xa8a8b0, { seg: 12 }); a.cyl(0, 0.5, 0, 1.1, 0.3, 'ice', 0xf4f8ff, { seg: 12 });
        for (let i = 0; i < 8; i++) a.cyl(0, 0.8 + i * 0.8, 0, 0.32, 0.8, 'marble_light', i % 2 ? 0xf4f4f4 : 0xc83030, { seg: 10 }); a.cyl(0, 7.2, 0, 0.42, 0.12, 'marble_light', 0xf4f4f4, { seg: 10 }); a.dome(0, 7.32, 0, 0.55, 0.55, 'gold_2', 0xffe9a0, { glow: 0.25 }); });
    R.taken.add(q[0] + ':' + q[1]);
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
