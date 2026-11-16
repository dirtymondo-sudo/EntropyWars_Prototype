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
   - 16 COTTAGES, each a walked-in building (COTTAGES below: one row a house; 7 x 7 m, a door, lit windows, a snow roof, lights along the front). Five wear a
     plain board (POST OFFICE, BAKERY, TOY SHOP, STABLE, COAL): plain labels, waiting for mondo's word.
   - THE INSIDES (pass 2): every house is lit and furnished (build, "THE INSIDES"): ten homes on two plans (a bed home, a table home; brick hearths with a
     real fire where the house has a chimney), the Post Office (counter, sorting wall, sacks), the Bakery (oven, racks, counter), the Toy Shop (cabinets, a
     horse, a counter), the Stable (a sleigh, straw), the Coal store (the heap, sacks, the scale). The Workshop: five benches, the loft with the wrapping and
     its ladder (the yeti's line), the bell by the chimney (the gnome's line), tools, lamps
   - THE POLE (P01-00): a striped pole with a gilt ball on a stone ring, four lamps and two benches round it. The village tree, a fire, Santa Clause (P02-01),
     a gnome (P03-00), the yeti in the Drift (P00-00), all with their old lines
   - THE DRESSING (pass 3; build, "THE DRESSING"): 31 candy-striped lamp posts (`lampPost`, a look on a square's middle), lights strung from the square's four
     lamps to the tree, the well on the west lane, the shop fronts' freight, wood by the doors, a sleigh being loaded at the Workshop, the Coal store's heap,
     the yeti's stones and fire, a bench and a snowman at the lake, freight and a camp on the Sleigh Road, hares, crows, a dog
   - THE FROZEN LAKE: walked and skated on, a pipe grind rail round its north shore
   - Night sky, snow pines in the plan's tree squares (the tool's tree zones)

   - THE ATMOSPHERE (pass 4): a real flame (`hearth_fire`) in every hearth, braziers at the Pole, the lake, the Sleigh Road and the two south ways out

   KNOWN MISSING OR WRONG
   - No Ice Queen is placed. No encounter table. Nobody stands inside a house (Santa's old line: "The workshop is empty because everyone is on the list.")
   - The five boards (POST OFFICE, BAKERY, TOY SHOP, STABLE, COAL) are plain labels: waiting for mondo's word
   - The world plan's Ice Wall is still open with mondo: do not build it without his word
   - NOT A DISTRICT FILE'S TO FIX (the tool's or the engine's; asked of mondo 11-16): no falling snow, no sound bed and no aurora (the walked rooms have
     no hook for any of the three); the lake's ice reads like the snow at night (the tool's paint: `ice_1` beside `ice`); one tree-zone kind (`xmas_pine`)
     is a bright green summer tree; the zone pines' skirts are 4 m wide and blurred up close and one covers half the Sleigh Road's trail

   NEEDS A MODEL (nothing in the catalogue fits; no stand-in is placed)
   - a reindeer (the Stable has a sleigh and straw, no animal), a mail box for outside the Post Office, a sled, an axe and a chopping block for the wood

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
  const SHOP = BUILT.workshop = building('workshop', 'P02-00', [3, 3, 9, 8, 'E'], 5.25, { keyIn: WD, floorIn: 'wood_planks' }, (a, w, d, dr) => {
      a.shell(w, 5.25, d, WD, 0xb84438, dr, [3.5, 1.75]); a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, 'rocks_5', 0xa8a8b0, { faces: 'blr', top: false });
      a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      a.roof('gable', 0, 5.25, 0, w + 1.8, 3.8, d + 1.8, 'ice', 0xf4f8ff, { keyEnd: WD, tintEnd: 0xb84438 });
      for (const x of [-7, -3.6, 5.2, 8.2]) pane(a, x, 1.3, d / 2 + 0.08, 1.4, 1.7, false, 0x3f6b4a, ctx);
      for (const s of [-1, 1]) for (const z of [-6, 0, 6]) pane(a, z, 1.3, s * (w / 2 + 0.08), 1.4, 1.7, true, 0x3f6b4a, ctx);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) a.box(dr.lx + s * (dr.cw / 2 + 0.14), i * 0.5, d / 2 + 0.12, 0.26, 0.5, 0.26, 'marble_light', i % 2 ? TRIM : 0xc83030);   // candy posts at the door
      a.box(dr.lx, 2.5, d / 2 + 0.12, dr.cw + 0.8, 0.22, 0.26, 'marble_light', TRIM); a.box(dr.lx, 0, d / 2 + 0.7, dr.cw + 1.6, 0.14, 1.3, 'rocks_5', 0xb8b8c0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.4, 5.25, 0.4, 'marble_light', TRIM);
      a.sign('WORKSHOP', dr.lx, 3.3, d / 2 + 0.16, 6.2, 1.1, '#f6efd8', '#1f4a2a', 'fell'); bulbs(a, -w / 2 + 0.4, w / 2 - 0.4, 5.05, d / 2 + 0.16);
      a.box(w / 2 - 1.6, 5.25, -d / 2 + 1.2, 1.3, 5.2, 1.3, 'bricks_2', 0xb86a54, { roof: true });                       // the chimney over the hearth
      hearth(a, w / 2 - 1.6, d, 5.25 - 0.36, 1.4, WD2); lit(a, w, 5.25, d, dr, WD, 0xd8b088, 0.9, ctx);   // the hearth inside (its fire: build), the lit inside
      /* THE LOFT (the yeti's line: "The loft is where the wrapping is kept. I am not allowed up the ladder."): a deck over the back left corner, a ladder, a rail */
      a.box(-5.2, 2.9, -7.3, 6.6, 0.18, 6.0, FLR, 0x8c7a62, { uv: [1.75, 1.75] }); for (const x of [-2.0, -5.2]) a.box(x, 0, -4.4, 0.24, 2.9, 0.24, WD2, 0x5a4030);
      a.box(-5.2, 3.9, -4.36, 6.6, 0.1, 0.1, WD2, 0x5a4030); for (let x = -8.3; x <= -2.0; x += 1.05) a.box(x, 3.08, -4.36, 0.08, 0.82, 0.08, WD2, 0x5a4030);
      for (const x of [-1.2, -0.7]) a.box(x, 0, -6.2, 0.07, 3.6, 0.07, WD2, 0x6a4a34); for (let y = 0.35; y < 3.5; y += 0.35) a.box(-0.95, y, -6.2, 0.5, 0.05, 0.05, WD2, 0x6a4a34);
      for (const z of [-6, 0, 6]) for (const x of [-4.4, 4.4]) lamp(a, x, 5.25 - 0.32, z); });                                      // the hearth inside, on the back wall
  SHOP.put('psx_table_large_3', -2, -2, { face: 90 }); SHOP.put('psx_table_large_3', -2, -7, { face: 90 }); SHOP.put('xmas_hammer', -2, -2, { y: 0.82 }); SHOP.put('xmas_hammer_2', -1.2, -7, { y: 0.82 });
  SHOP.put('xmas_cocoa', -2.6, -6.6, { y: 0.82 }); SHOP.put('xmas_gingerbread', -2.4, -2.6, { y: 0.82 }); SHOP.put('xmas_gift', -6.8, -8.6); SHOP.put('xmas_gift_2', -5.6, -8.9, { face: 30 }); SHOP.put('xmas_gift_3', -7, -6.6);
  SHOP.put('xmas_gift_4', 6.6, 6.8, { face: 60 }); SHOP.put('cardboard_boxes', -6.6, 6.4); SHOP.put('cardboard_box', -5.2, 7.4, { face: 40 }); SHOP.put('sea_chest', 6.4, 2.2, { face: 270 }); SHOP.put('xmas_tree', 5.6, 8.0, { h: 3.2, floor: true });
  SHOP.put('xmas_stocking', 6.5, -8.86, { y: 1.5, face: 180 }); SHOP.put('xmas_stocking_2', 7.8, -8.86, { y: 1.5, face: 180 }); SHOP.put('hearth_fire', SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 0.8, { w: 1.2, h: 1.05 }); SHOP.put('xmas_garland', 0, -10.12, { mount: 0, y: 5.3, face: 180 }); SHOP.put('xmas_wreath', 1.5, -10.12, { mount: 0, y: 4.5, face: 180 });   // (hung on the wall: see WALL() in build)
  R.anchor('hearth', { x: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[0], z: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[1], face: SHOP.face(180) });   // the fireplace: the link `northpole_haunted`
  /* THE COTTAGES (the exteriors pass, 11-16): the first look showed sixteen copies of one white town house prop, too wide for their squares. Each run of
     the plan's `B` squares is now a built house of its own you can walk into: [id, plot, lx, ly, front, wall tint, opts]. */
  COTTAGES.forEach(([id, plot, lx, ly, side, tint, q]) => { q = Object.assign({ h: 3.3, rh: 2.6, tint }, q);
      BUILT[id] = building(id, plot, [lx, ly, lx + 2, ly + 2, side], q.h, { keyIn: q.wood ? WD : 'urban:PlasterWallPainted1a', floorIn: 'wood_planks' }, (a, w, d, dr) => cottage(a, w, d, dr, q, ctx)); BUILT[id].q = q; R.count.cottages = (R.count.cottages || 0) + 1; });
};
exports.tailor = t => { t.set('P03-00', 7, 8, 's'); t.set('P03-00', 7, 9, 's'); };   // the plan's sixteenth house (P03-00 8,8) was cut off by one drift square: these two squares are its way in

/* ── a cottage's look. Parts frame: the house's middle, x along the front, +z out of the front. ── */
const BUILT = {};   // id -> the built house (its frame: x along the front, +z out of the front, the back wall at -3.5), for the insides
const TRIM = 0xf6f6f2, PANE = 0xffc070, BULBS = [0xff3828, 0x38d058, 0xffc030, 0x4890ff];
const pane = (a, x, y, z, w, h, ew, shut, ctx, inn) => {   // a lit window: a warm pane, a white frame and cross, shutters (ew: on a side wall; inn: seen from inside, the night in it)
    const B = (px, py, pz, bw, bh, bd, key, tint, q) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, q) : a.box(px, py, pz, bw, bh, bd, key, tint, q), o = (z < 0 ? -1 : 1) * (inn ? -1 : 1);
    B(x, y, z, w, h, 0.06, 'marble_light', inn ? 0x24344c : PANE, { glow: inn ? 0.5 : 1.0 }); B(x, y, z + o * 0.03, 0.07, h, 0.08, 'marble_light', TRIM); B(x, y + h / 2 - 0.035, z + o * 0.03, w, 0.07, 0.08, 'marble_light', TRIM);
    B(x, y - 0.1, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM); B(x, y + h, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM);
    if (shut != null) for (const s of [-1, 1]) B(x + s * (w / 2 + 0.2), y, z + o * 0.02, 0.34, h, 0.06, ctx.WD, shut); };
const bulbs = (a, x0, x1, y, z) => { const n = Math.max(2, Math.round((x1 - x0) / 0.7)); for (let i = 0; i <= n; i++) a.box(x0 + (x1 - x0) * i / n, y - (i % 2 ? 0.1 : 0), z, 0.13, 0.13, 0.13, 'marble_light', BULBS[i % 4], { glow: 1.6 }); };
const lamp = (a, x, top, z) => { a.box(x, top - 0.5, z, 0.03, 0.5, 0.03, 'marble_light', 0x2a2a2a); a.cyl(x, top - 0.52, z, 0.2, 0.05, 'marble_light', 0x2a2a2a, { seg: 8 }); a.cyl(x, top - 0.74, z, 0.11, 0.22, 'marble_light', 0xffb050, { seg: 10, glow: 1.2 }); a.cyl(x, top - 0.78, z, 0.13, 0.04, 'marble_light', 0x2a2a2a, { seg: 10 }); };
/* a hearth against the back wall (cx along it, k = its size): two piers, a head, a dark back, a shelf, the breast up to the ceiling. Its mouth is OPEN:
   the fire is the catalogue's `hearth_fire` (the battle's flame on three logs, a real light), put in by build at z -d/2 + 0.78 (nearer the wall it would stand on the wall: see WALL()) */
const hearth = (a, cx, d, top, k, WD2) => { const z0 = -d / 2 + 0.3, zc = z0 + 0.45 * k, B = 'bricks_2', T = 0xb86a54, g = { glow: 0.8 };
    for (const s of [-1, 1]) a.box(cx + s * 0.75 * k, 0, zc, 0.4 * k, 1.1 * k, 0.9 * k, B, T, g); a.box(cx, 1.1 * k, zc, 1.9 * k, 0.4 * k, 0.9 * k, B, T, g);
    a.box(cx, 0, z0 + 0.04, 1.1 * k, 1.1 * k, 0.06, B, 0x241a16, g); a.box(cx, 0.16, zc, 1.1 * k, 0.04, 0.9 * k, B, 0x4a3a34, g);
    a.box(cx, 1.5 * k, zc + 0.04, 2.2 * k, 0.14, 0.9 * k + 0.16, WD2, 0x6a4a34, { glow: 0.8, gain: 1.4 }); a.box(cx, 1.5 * k + 0.14, z0 + 0.2, 1.3 * k, top - 1.5 * k - 0.14, 0.4, B, T, g); };
/* the lit inside (the first look inside: a room with a lamp was as dark as the night outside; the walls a building draws take no light of their own):
   the four walls, the floor and the ceiling again, a hand inside the building's own, each with `glow` (a part with glow is drawn UNLIT at tint x glow: 0.8 is a lit room, 0.25 was darker than no glow at all) */
const lit = (a, w, h, d, dr, key, tint, g, ctx) => { const top = h - 0.36, i = 0.3, t = 0.04, q = { glow: g, gain: 1.7 }, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2, e = w / 2 - i;   // (thin boxes: a `quad` there lost to the building's own wall)
    a.box(0, 0, -(d / 2 - i), w - 2 * i, top, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - i), 0, 0, t, top, d - 2 * i, key, tint, q);
    a.box((-e + x0) / 2, 0, d / 2 - i, x0 + e, top, t, key, tint, q); a.box((x1 + e) / 2, 0, d / 2 - i, e - x1, top, t, key, tint, q); a.box(dr.lx, 2.2, d / 2 - i, dr.cw, top - 2.2, t, key, tint, q);
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, ctx.WD2, 0x8a6a48, { sides: false, top: false, under: true, glow: g * 0.75, gain: 1.6 }); };
const cottage = (a, w, d, dr, q, ctx) => { const { WD, WD2, FLR } = ctx, h = q.h;
    a.shell(w, h, d, WD, q.tint, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; });   // (gain: the boards' paint read as near black at night under the brown sheet)
    a.box(0, 0, 0, w + 0.4, 0.8, d + 0.4, 'rocks_5', 0xa8a8b0, { faces: 'blr', top: false });
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
    if (q.wood) lit(a, w, h, d, dr, WD, 0xd8b088, 0.85, ctx); else lit(a, w, h, d, dr, 'urban:PlasterWallPainted1a', q.wall || 0xffe2b8, 0.85, ctx);
    if (q.inside) q.inside(a, w, d);
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
    if (!q.chimney) { pane(a, 0, 1.05, -d / 2 - 0.08, 1.2, 1.3, false, q.shut, ctx); if (!q.inside) pane(a, 0, 1.05, -d / 2 + 0.35, 1.2, 1.3, false, null, ctx, true); }
    pane(a, wx, 1.05, d / 2 - 0.35, 1.2, 1.3, false, null, ctx, true); for (const s of [-1, 1]) pane(a, 0.4 * s, 1.05, s * (w / 2 - 0.35), 1.2, 1.3, true, null, ctx, true);
    if (q.front) a.box(0, h + 0.75, d / 2 + 0.84, 0.7, 0.7, 0.06, 'marble_light', PANE, { glow: 1.0, roof: true });                   // the loft's light in the gable
    if (q.chimney) { const cx = q.chimney; a.box(cx, 0, -d / 2 - 0.35, 1.3, h + q.rh + 0.7, 0.9, 'bricks_2', 0xb86a54, { roof: true }); a.box(cx, h + q.rh + 0.7, -d / 2 - 0.35, 1.5, 0.22, 1.1, 'ice', 0xf4f8ff, { roof: true });
        hearth(a, cx, d, h - 0.36, 1, WD2); }
    lamp(a, 0, h - 0.32, 0.3);                                                                                                        // the lamp inside, hung from the ceiling
    if (q.coal) { a.dome(-1.8, 0.1, -1.8, 1.25, 0.95, 'obsidian', 0x3a3a40); a.dome(-2.3, 0.1, 0.1, 0.8, 0.55, 'obsidian', 0x3a3a40); }   // the heap
    if (q.porch) { a.box(0, 0, d / 2 + 1.2, w, 0.16, 2.3, FLR, 0x8c7a62); for (const s of [-1, 1]) for (let i = 0; i < 5; i++) a.box(s * (w / 2 - 0.2), i * 0.52, d / 2 + 2.15, 0.2, 0.52, 0.2, 'marble_light', i % 2 ? TRIM : 0xc83030);   // candy posts
        a.roof('shed', 0, 2.6, d / 2 + 1.25, w + 0.4, 0.6, 2.6, 'ice', 0xf4f8ff); }
    if (q.name) a.sign(q.name, 0, q.front ? h - 0.1 : 2.5, d / 2 + (q.porch ? 2.5 : q.front ? 0.86 : 0.16), Math.min(w - 1.2, q.name.length * 0.55 + 1.0), 0.72, '#f6efd8', q.board || '#7a1f1f', 'fell', (q.front || q.porch) ? { roof: true } : null); };
const RED = 0xb84438, GREEN = 0x3f6b4a, CREAM = 0xd8c8a8, BLUE = 0x5a7890, GINGER = 0x9a6238, PLUM = 0x7a4a6a, LOG = 0x7a5a40;
const COTTAGES = [
    /* the village square (P02-01), round the tree */
    ['post', 'P02-01', 2, 2, 'E', BLUE, { name: 'POST OFFICE', board: '#1f3a5a', front: true, shut: 0xf6f6f2, inside: (a, w, d) => a.box(-0.65, 0, -d / 2 + 0.47, 3.6, 2.2, 0.4, 'urban:WoodGeneric1a', 0x9a7450, { glow: 0.85, gain: 1.5 }) }],   // (the sorting wall the mail boxes hang on)
    ['bakery', 'P02-01', 8, 3, 'W', GINGER, { name: 'BAKERY', board: '#5a2a1a', chimney: 1.8, porch: true, h: 3.5, shut: 0xf6f6f2 }],
    ['toys', 'P02-01', 3, 8, 'N', RED, { name: 'TOY SHOP', board: '#1f4a2a', front: true, h: 3.6, rh: 3.0, shut: 0x3f6b4a }],
    ['square4', 'P02-01', 8, 8, 'N', GREEN, { chimney: -1.8, shut: 0xb84438 }],
    /* the west lane (P01-01), homes */
    ['west1', 'P01-01', 2, 2, 'E', CREAM, { chimney: 1.8, shut: 0xb84438 }],
    ['west2', 'P01-01', 8, 3, 'W', RED, { front: true, shut: 0xf6f6f2 }],
    ['west3', 'P01-01', 3, 8, 'N', GREEN, { front: true, h: 3.5, shut: 0xf6f6f2, porch: true }],
    ['west4', 'P01-01', 8, 8, 'N', PLUM, { chimney: 1.8, shut: 0xf6f6f2 }],
    /* the east lane (P03-01), by the Pass Gate */
    ['stable', 'P03-01', 2, 2, 'E', LOG, { name: 'STABLE', board: '#3a2a20', front: true, h: 3.8, rh: 2.8, wood: true }],
    ['east2', 'P03-01', 8, 3, 'W', BLUE, { chimney: -1.8, shut: 0xf6f6f2 }],
    ['east3', 'P03-01', 3, 8, 'N', CREAM, { front: true, shut: 0x3f6b4a }],
    ['east4', 'P03-01', 8, 8, 'N', RED, { chimney: 1.8, shut: 0x3f6b4a, porch: true }],
    /* the north end (P03-00), under the rock */
    ['north1', 'P03-00', 2, 2, 'S', GREEN, { front: true, shut: 0xf6f6f2 }],
    ['north2', 'P03-00', 8, 3, 'W', GINGER, { chimney: 1.8, shut: 0xb84438 }],
    ['north3', 'P03-00', 8, 8, 'W', PLUM, { chimney: -1.8, shut: 0xf6f6f2 }],   // (the plan's sixteenth house: its two squares were cut off by one drift square until `tailor` opened it)
    ['coal', 'P03-00', 3, 8, 'N', 0x4a4a52, { name: 'COAL', board: '#1a1a1e', front: true, h: 3.0, rh: 2.4, wood: true, coal: true }],
];

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ══ THE INSIDES (pass 2, 11-16). A house's frame: x along its front, +z out of the door, the back wall at z -3.5; `face` 180 looks out of the front, 0 at
     the back wall, 90 to +x, 270 to -x. A 7 m house has 6.4 m inside.
     A PROP WHOSE FOOT TOUCHES A WALL'S 0.3 m BOX LANDS ON THE ROOF (seen 11-16: the mail boxes at y 6.7): keep a wall piece's middle 0.4 m off the outer face. ══ */
  { const B = id => BUILT[id], T = 0.86;
    /* A PROP'S `y` (three-renderer.js THE TIER HEIGHT, measured here 11-16): under 1 it is a lift over what is under the prop; from 1 up it is a height from
       the ROOM's floor, and the village stands 1.75 m over that, so UP(h) = h over a house's floor. Within about 0.6 m of a building's outer face a prop
       stands on the wall's 2.15 m walker box (the mail boxes hung at y 6.7): WALL(h) = h up the wall for a piece hung there (h from 1.55 up; pass mount 0). */
    const G = 1.9, UP = h => h < 1 ? h : r2(G + h), WALL = h => ({ mount: 0, y: h >= 2.03 ? r2(G + h) : r2(h - 2.03) });
    const hearthSide = h => (h.q.chimney || 0);
    const xmas = (h, x, z) => { h.put('xmas_tree', x, z, { h: 1.9, floor: true }); h.put('xmas_gift', x - 0.7, z - 0.2, { face: 20 }); h.put('xmas_gift_3', x - 0.3, z - 0.7, { face: 70 }); };
    const mantel = h => { const c = hearthSide(h); if (!c) return; h.put('hearth_fire', c, -2.72, { w: 0.85, h: 0.75 }); h.put('xmas_stocking', c - 0.5, -2.2, { y: 1.05, face: 180 }); h.put('xmas_stocking_2', c + 0.5, -2.2, { y: 1.05, face: 180 }); h.put('xmas_garland', c, -2.18, { y: 1.66, face: 180 }); };
    /* a home with a bed: the bed away from the hearth, a wardrobe, a rocking chair at the fire */
    const bedHome = (h, tree) => { const c = hearthSide(h), s = c > 0 ? -1 : 1;
        h.put('psx_bed_1', s * 2.0, -2.0, { face: 180 }); h.put('psx_bedside_table_1', s * 0.75, -2.85, { face: 180 }); h.put('table_lamp', s * 0.75, -2.85, { y: 0.64 });
        h.put('psx_wardrobe_mp_1', s * 2.75, 0.4, { face: s > 0 ? 270 : 90 }); h.put('rug_round', -s * 0.9, -0.2);
        if (c) h.put('rocking_chair', c + s * 0.3, -0.9, { face: 0 }); else h.put('psx_armchair_1', -s * 2.4, -2.3, { face: 180 });
        mantel(h); if (tree) xmas(h, -s * 2.4, 2.3); else h.put('xmas_wreath', -s * 1.9, -3.12, Object.assign({ face: 180 }, WALL(1.9))); };
    /* a home with a table: the table by the side window, a sofa, a shelf */
    const tableHome = (h, tree) => { const c = hearthSide(h), s = c > 0 ? -1 : 1;
        h.put('psx_dinner_table_1', s * 1.75, -1.4); h.put('psx_chair_mp_3', s * 1.75, -0.35, { face: 0 }); h.put('psx_chair_mp_3', s * 1.75, -2.45, { face: 180 });
        h.put('xmas_cocoa', s * 1.5, -1.3, { y: T }); h.put('xmas_cookies', s * 2.05, -1.55, { y: T }); h.put('xmas_cocoa_2', s * 1.95, -1.0, { y: T });
        h.put('psx_sofa_1', -s * 2.45, -0.5, { face: s > 0 ? 90 : 270 }); h.put('rug_round', -s * 0.7, 0.2); h.put('psx_shelf_mp_5', s * 2.85, 1.2, { face: s > 0 ? 270 : 90 });
        mantel(h); if (tree) xmas(h, -s * 2.3, 2.3); h.put('psx_painting_1', -s * 3.12, 0.2, Object.assign({ face: s > 0 ? 90 : 270 }, WALL(1.7))); };
    bedHome(B('square4'), true); tableHome(B('west1'), true); bedHome(B('west2'), false); tableHome(B('west3'), false); bedHome(B('west4'), true);
    tableHome(B('east2'), false); bedHome(B('east3'), true); tableHome(B('east4'), true); bedHome(B('north1'), false); tableHome(B('north2'), true); bedHome(B('north3'), true);
    /* THE POST OFFICE: the counter, the boxes on the back wall, the sacks */
    { const h = B('post'); h.put('form_counter', -1.3, -0.9, { face: 180 }); h.put('form_counter', 0.9, -0.9, { face: 180 }); h.put('mailbox_bank', -1.6, -2.58, { y: 0.9, face: 180 }); h.put('mailbox_bank', 0.3, -2.58, { y: 0.9, face: 180 });
      h.put('wall_clock', 2.2, -3.14, Object.assign({ face: 180 }, WALL(2.2))); h.put('platform_scale', 2.5, -2.2, { face: 180 }); h.put('meshy_burlap_sack', 2.6, 2.3); h.put('meshy_burlap_sack', 2.2, 1.5, { face: 80 }); h.put('meshy_burlap_sack', 2.75, 0.8, { face: 200 });
      h.put('newspaper_bundles', -2.6, 2.5); h.put('xmas_gift_2', -2.5, -2.4); h.put('xmas_gift', -1.9, -2.2, { face: 40 }); h.put('xmas_gift_4', -2.6, -1.7); }
    /* THE BAKERY: the oven beside the hearth, the racks, the counter */
    { const h = B('bakery'); h.put('deck_oven', -0.7, -2.7, { face: 180 }); h.put('bread_rack', -2.85, -1.3, { face: 90 }); h.put('bread_rack', -2.85, 0.4, { face: 90 }); h.put('psx_table_large_3', 1.5, 0.3);
      h.put('cash_register', 2.0, 0.6, { y: 0.91, face: 180 }); h.put('xmas_cookies', 1.2, 0.1, { y: 0.91 }); h.put('xmas_bake', 1.7, -0.1, { y: 0.91 }); h.put('xmas_flan', 0.9, 0.6, { y: 0.91 }); h.put('xmas_gingerbread', 1.4, 0.65, { y: 0.91 });
      h.put('meshy_burlap_sack', 2.7, -1.6); h.put('meshy_burlap_sack', 2.75, 2.5, { face: 120 }); mantel(h); }
    /* THE TOY SHOP: cabinets down both sides, a horse, a counter by the door */
    { const h = B('toys'); h.put('psx_display_cabinet_mp_1', -2.8, -1.9, { face: 90 }); h.put('psx_display_cabinet_mp_2', -2.8, -0.2, { face: 90 }); h.put('psx_shelf_mp_4_1', 2.8, -1.9, { face: 270 }); h.put('psx_shelf_mp_5', 2.8, -0.2, { face: 270 });
      h.put('decor_carousel_horse', 0.3, -1.6, { h: 1.2, face: 200 }); h.put('beach_ball', -1.3, -2.6); h.put('football', 1.4, -2.7); h.put('psx_dinner_table_1', 2.2, 2.2); h.put('cash_register', 2.2, 2.2, { y: T, face: 270 });
      h.put('xmas_gift', -2.5, 2.4); h.put('xmas_gift_2', -2.6, 1.6, { face: 30 }); h.put('xmas_gift_4', -1.9, 2.6, { face: 60 }); h.put('xmas_gift_3', -2.5, 2.4, { y: 0.49 }); h.put('xmas_tree', 0.2, -2.8, { h: 1.6, floor: true }); }
    /* THE STABLE: a sleigh under cover, straw, a bucket (no reindeer in the catalogue: NEEDS A MODEL) */
    { const h = B('stable'); h.put('sleigh', 1.3, -0.9, { face: 180 }); h.put('hw_straw', -2.5, -2.7); h.put('hw_straw', -2.5, -1.3); h.put('hw_straw', -2.5, -2.0, { y: 0.86 }); h.put('hw_straw', -1.0, -2.8, { face: 90 });
      h.put('wooden_bucket', -2.4, 1.9, { h: 0.34 }); h.put('broom', 2.8, 2.7); h.put('railway_lantern', -2.6, 0.2, { y: 0 }); h.put('meshy_burlap_sack', 2.7, -2.7); }
    /* THE COAL STORE: the heap (in its look), sacks, the scale */
    { const h = B('coal'); h.put('platform_scale', 1.9, -2.0, { face: 180 }); h.put('meshy_burlap_sack', 2.6, 0.2); h.put('meshy_burlap_sack', 2.2, 0.9, { face: 70 }); h.put('meshy_burlap_sack', 2.7, 1.5, { face: 150 }); h.put('meshy_burlap_sack', 0.4, -2.8, { face: 30 });
      h.put('psx_wooden_crate_2', 2.5, 2.6); h.put('railway_lantern', 2.5, 2.6, { y: UP(1.08) }); h.put('wooden_bucket', -0.6, 0.9, { h: 0.34 }); }
    /* THE WORKSHOP: three more benches, the toys on them, the tools, the bell by the chimney (the gnome's line), the wrapping in the loft */
    { const h = B('workshop'); h.put('psx_table_large_3', -2, 3.5, { face: 90 }); h.put('psx_table_large_3', 3.5, -2, { face: 90 }); h.put('psx_table_large_3', 3.5, 3.5, { face: 90 });
      h.put('beach_ball', -2, 3.2, { y: 0.91 }); h.put('xmas_gift_3', -2.2, 4.2, { y: 0.91 }); h.put('football', 3.4, -2.4, { y: 0.91 }); h.put('decor_carousel_horse', 3.5, 3.5, { y: 0.91, h: 0.7, face: 250 }); h.put('xmas_gift_4', 3.6, -1.4, { y: 0.91 }); h.put('railway_lantern', 3.3, 2.6, { y: 0.91 });
      h.put('tool_pegboard', -8.38, 0.5, Object.assign({ face: 90 }, WALL(1.6))); h.put('tool_pegboard', -8.38, 3.0, Object.assign({ face: 90 }, WALL(1.6))); h.put('tool_chest', -7.9, 5.6, { face: 90 }); h.put('ships_bell', 4.6, -10.1, Object.assign({ face: 180 }, WALL(3.0)));
      h.put('xmas_gift', -7.6, -9.2, { y: UP(3.08) }); h.put('xmas_gift_2', -6.4, -9.4, { y: UP(3.08), face: 30 }); h.put('xmas_gift', -5.0, -9.3, { y: UP(3.08), face: 60 }); h.put('xmas_gift_4', -7.8, -7.6, { y: UP(3.08) }); h.put('cardboard_boxes', -3.6, -9.2, { y: UP(3.08) });
      h.put('cardboard_box', -7.6, -6.0, { y: UP(3.08), face: 40 }); h.put('xmas_gift_3', -6.4, -9.4, { y: UP(3.56) }); h.put('xmas_garland_2', -5.2, -10.12, Object.assign({ face: 180 }, WALL(4.3))); h.put('psx_wooden_crate_2', 7.4, 6.0); h.put('psx_wooden_crate_3', 7.5, 4.6, { face: 20 }); }
  }
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

  /* ══ THE DRESSING (pass 3, 11-16): the lanes' lamps, the shop fronts, the yards, the lake's edge, the road. Blockers stand on a square's middle (put,
     lampPost); the small things lie off it (dec). The two-wide trails (`o`) and the squares in front of doors stay clear. ══ */
  { const lampPost = (id, lx, ly, turn) => { const q = S(id, lx, ly), k = q[0] + ':' + q[1]; if (!R.open(q[0], q[1]) || R.cell[q[1]][q[0]] === 'B' || R.taken.has(k)) throw new Error('lamp post on a square that is not free: ' + id + ' ' + lx + ',' + ly);
        R.taken.add(k); const sx = turn ? -1 : 1;
        look('lamp:' + id + ':' + lx + ':' + ly, mx(q[0]), mz(q[1]), a => { a.cyl(0, 0, 0, 0.17, 0.3, 'rocks_5', 0xa8a8b0, { seg: 8 }); for (let i = 0; i < 6; i++) a.cyl(0, 0.3 + i * 0.45, 0, 0.07, 0.45, 'marble_light', i % 2 ? 0xf4f4f4 : 0xc83030, { seg: 8 });
            a.box(sx * 0.25, 2.95, 0, 0.62, 0.06, 0.06, 'marble_light', 0x2a2a2a); a.box(sx * 0.5, 2.55, 0, 0.26, 0.36, 0.26, 'marble_light', 0xffb050, { glow: 1.3 }); a.box(sx * 0.5, 2.91, 0, 0.36, 0.06, 0.36, 'marble_light', 0x2a2a2a); a.box(sx * 0.5, 2.97, 0, 0.32, 0.06, 0.32, 'ice', 0xf4f8ff); }); };
    /* THE SQUARE (P02-01): a lamp at each corner, lights strung from them to the tree, benches, the shop fronts */
    for (const [lx, ly, t] of [[1, 1, 0], [9, 1, 1], [1, 7, 0], [9, 7, 1]]) lampPost('P02-01', lx, ly, t);
    { const c = S('P02-01', 5, 5); look('square:strings', mx(c[0]), mz(c[1]), a => { for (const [lx, ly, t] of [[1, 1, 0], [9, 1, 1], [1, 7, 0], [9, 7, 1]]) { const ex = (lx - 5) * C + (t ? -0.5 : 0.5), ez = (ly - 5) * C, n = Math.round(Math.hypot(ex, ez) / 0.8);
            for (let i = 2; i < n; i++) { const u = i / n; a.box(ex * u, 4.3 + (2.62 - 4.3) * u - 0.9 * Math.sin(Math.PI * u), ez * u, 0.12, 0.12, 0.12, 'marble_light', BULBS[i % 4], { glow: 1.6 }); } } }); }
    put('P02-01', 'park_bench', 7, 4, { face: 270 }); put('P02-01', 'park_bench', 5, 3, { face: 180 }); dec('P02-01', 'xmas_gift_2', 6, 5); dec('P02-01', 'xmas_gift_3', 4, 5);
    dec('P02-01', 'meshy_burlap_sack', 4, 4); dec('P02-01', 'newspaper_bundles', 4, 1); put('P02-01', 'psx_wooden_crate_2', 10, 3); dec('P02-01', 'psx_wooden_crate_6', 10, 4); dec('P02-01', 'meshy_burlap_sack', 10, 5);
    dec('P02-01', 'decor_carousel_horse', 2, 8, { h: 1.3 }); put('P02-01', 'xmas_snowman_3', 7, 8); dec('P02-01', 'xmas_gift_4', 6, 8); dec('P02-01', 'stump', 6, 9); dec('P02-01', 'rabbit', 2, 6);
    /* THE WEST LANE (P01-01): the well, a dog, the wood for the fires */
    for (const [lx, ly, t] of [[4, 1, 0], [9, 2, 1], [2, 4, 0], [8, 7, 1]]) lampPost('P01-01', lx, ly, t);
    put('P01-01', 'ancient_well', 5, 5); dec('P01-01', 'wooden_bucket', 6, 5, { h: 0.34 }); dec('P01-01', 'dog', 4, 3); dec('P01-01', 'fallen_log', 10, 3); dec('P01-01', 'stump', 10, 4); put('P01-01', 'park_bench', 7, 3, { face: 180 });
    dec('P01-01', 'rabbit', 6, 1); dec('P01-01', 'psx_wooden_crate_1', 5, 8); dec('P01-01', 'xmas_gift', 7, 8);
    /* THE EAST LANE (P03-01): the Stable's yard, the last lamp before the Pass Gate */
    for (const [lx, ly, t] of [[8, 2, 1], [2, 5, 0], [10, 4, 1], [7, 7, 0]]) lampPost('P03-01', lx, ly, t);
    put('P03-01', 'hw_straw', 2, 4); dec('P03-01', 'wooden_bucket', 3, 4, { h: 0.34 }); put('P03-01', 'sleigh', 6, 2, { face: 90 }); dec('P03-01', 'hw_straw_2', 4, 4); put('P03-01', 'park_bench', 7, 5, { face: 270 }); dec('P03-01', 'rabbit', 6, 8); dec('P03-01', 'fallen_log', 5, 9);
    /* THE NORTH END (P03-00): the Coal store's yard in the nook, wood by the doors */
    for (const [lx, ly, t] of [[1, 4, 0], [7, 5, 1], [6, 2, 1]]) lampPost('P03-00', lx, ly, t);
    { const q = S('P03-00', 5, 8); look('coal:yard', mx(q[0]), mz(q[1]), a => { a.dome(0, 0, 0, 1.35, 0.95, 'obsidian', 0x3a3a40); a.dome(0.9, 0, 0.9, 0.6, 0.4, 'obsidian', 0x3a3a40); }); R.taken.add(q[0] + ':' + q[1]); }
    put('P03-00', 'psx_wooden_crate_2', 2, 8); dec('P03-00', 'meshy_burlap_sack', 6, 8); dec('P03-00', 'meshy_burlap_sack', 5, 9); dec('P03-00', 'fallen_log', 1, 3); dec('P03-00', 'stump', 0, 4); dec('P03-00', 'crow', 6, 7); dec('P03-00', 'xmas_gift_2', 4, 6);
    /* THE WORKSHOP'S YARD (P02-00): a lamp each side of the door, a sleigh being loaded, the crates */
    lampPost('P02-00', 9, 3, 1); lampPost('P02-00', 9, 6, 1); put('P02-00', 'sleigh', 9, 2, { face: 200 }); dec('P02-00', 'xmas_gift', 8, 2); dec('P02-00', 'xmas_gift_2', 7, 2); dec('P02-00', 'xmas_gift_4', 8, 1);
    put('P02-00', 'psx_wooden_crate_3', 10, 3); dec('P02-00', 'cardboard_boxes', 10, 4); dec('P02-00', 'psx_wooden_crate_6', 10, 5); put('P02-00', 'xmas_tree_plain', 6, 1, { h: 4.0, floor: true });
    /* THE POLE (P01-00): four lamps round it, benches to look at it from */
    for (const [lx, ly, t] of [[5, 4, 0], [9, 4, 1], [4, 7, 0], [9, 8, 1]]) lampPost('P01-00', lx, ly, t);
    put('P01-00', 'park_bench', 7, 3, { face: 180 }); put('P01-00', 'park_bench', 10, 6, { face: 270 }); dec('P01-00', 'xmas_gift', 6, 7); dec('P01-00', 'xmas_gift_4', 8, 7); put('P01-00', 'xmas_snowman', 6, 8);
    /* THE DRIFT (P00-00, P00-01): the yeti's end: stones, a fire, what the snow left */
    put('P00-00', 'hw_stone_3', 3, 6); dec('P00-00', 'hw_stone', 3, 8); dec('P00-00', 'psxg_rock_1', 4, 5); dec('P00-00', 'fallen_log', 6, 5); put('P00-00', 'campfire', 6, 7); dec('P00-00', 'stump', 7, 8); dec('P00-00', 'crow', 5, 9);
    lampPost('P00-01', 8, 4, 1); dec('P00-01', 'stump', 4, 5); dec('P00-01', 'rabbit', 7, 7); dec('P00-01', 'psxg_rock_2', 5, 3); dec('P00-01', 'hw_stone_2', 7, 4);
    /* THE FROZEN LAKE: a snowman on the ice, a bench and a lamp at the east edge, stumps to sit on */
    put('P00-02', 'xmas_snowman_2', 5, 4); dec('P00-02', 'stump', 3, 3); dec('P00-02', 'stump', 4, 3); lampPost('P01-02', 9, 4, 1); put('P01-02', 'park_bench', 9, 6, { face: 270 }); dec('P01-02', 'xmas_gift_3', 8, 6);
    put('P00-03', 'xmas_snowman', 3, 4); dec('P00-03', 'stump', 6, 6); lampPost('P00-03', 8, 5, 1); dec('P00-03', 'rabbit', 5, 7);
    /* THE SLEIGH ROAD (P02-02, P03-02): freight for the sleighs, a camp at the turn */
    lampPost('P02-02', 3, 5, 0); lampPost('P02-02', 7, 6, 1); put('P02-02', 'psx_wooden_crate_2', 4, 4); dec('P02-02', 'cardboard_boxes', 6, 4); put('P02-02', 'signpost', 5, 8, { face: 180 });   // (4,7 stood inside the skirt of a tree-zone pine) dec('P02-02', 'meshy_burlap_sack', 3, 6); dec('P02-02', 'xmas_gift_2', 6, 6);
    lampPost('P03-02', 8, 6, 1); dec('P03-02', 'fallen_log', 7, 7); dec('P03-02', 'stump', 4, 7); put('P03-02', 'sleigh', 7, 8, { face: 200 }); dec('P03-02', 'xmas_gift', 6, 8);
    /* THE SNOWLINE (P01-03, P02-03, P03-03): the last lamps before the ways out */
    lampPost('P01-03', 4, 6, 0); lampPost('P01-03', 8, 4, 1); dec('P01-03', 'xmas_gift_3', 5, 4); put('P01-03', 'signpost', 7, 6, { face: 180 });
    lampPost('P02-03', 2, 7, 0); put('P02-03', 'xmas_snowman', 6, 6); dec('P02-03', 'stump', 3, 8); dec('P02-03', 'rabbit', 5, 6);
    lampPost('P03-03', 9, 7, 1); lampPost('P03-03', 5, 6, 0); put('P03-03', 'signpost', 8, 8, { face: 180 }); put('P03-03', 'xmas_snowman_3', 6, 9); dec('P03-03', 'fallen_log', 8, 6);
    /* ── THE ATMOSPHERE (pass 4): warm light in the cold. Braziers (real lights) where people would stand at night ── */
    put('P01-00', 'brazier', 6, 6); put('P01-00', 'brazier', 8, 6); put('P01-02', 'brazier', 8, 5); put('P02-02', 'brazier', 7, 5); put('P01-03', 'brazier', 6, 4); put('P03-03', 'brazier', 7, 8);
  }
};
