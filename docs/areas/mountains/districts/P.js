/* THE MOUNTAINS · THE SNOWY PASS (district P, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P04-00 The Ridge, west (18)             P05-00 The Ridge (19)                   P06-00 The Ridge, east (18)
     P04-01 The Pass Gate (12)               P05-01 The High Pass (15)               P06-01 The Switchbacks (14)
     P04-02 The Sleigh Bend (11)             P05-02 The Frozen Tarn (13)             P06-02 The Rope Bridge (13)
     P04-03 The Tree Line, west (10)         P05-03 The Tree Line (10)               P06-03 The Warming Hut (11)

   WHAT STANDS HERE TODAY (pass 1 of 5, 11-16, seen on screen; notes: areas-complexes.md "THE MOUNTAINS, THE SNOWY PASS")
   - FOUR WALKED-IN BUILDINGS: the WARMING HUT (P06-03, `logHouse`: painted logs, log courses, porch, stone chimney, wood stack), the GATE HOUSE (P04-01, stone,
     quoins), the SUMMIT SHELTER (P05-00, a red emergency hut with a round roof and an aerial), the FISHING HUT (P05-02, on runners on the ice)
   - THE PASS GATE (P04-01): stone piers, log posts, two beams under a snow roof, lanterns, its board on both faces
   - THE HIGH PASS (P05-01, the landmark, levelled): the great cairn, four poles with prayer flags strung to it, two stone seats, braziers, standing stones
   - THE RIDGE: THE LOOKOUT (P04-00: a deck, a rail, a flag, a telescope, on the lip of a snow slope over the Pass Gate), THE MAST (P06-00: a red and white lattice
     radio mast with its lights, a cabinet, a dish), the eagle. `tailor` turned the rock between the Ridge and the pass into two snow slopes (`k`): each sees the other
   - THE FROZEN TARN (P05-02, levelled): a blue ice sheet on every ice square, a snow shore, two fishing holes, a tent
   - THE ROPE BRIDGE (P06-02): planks on stringers, four posts on stone feet, two sagging ropes a side with hangers; ranch rails along both lips of the slot
   - A sleigh and a snowman at the Sleigh Bend, grey stones (no black `ocean_rock` left), logs, a wolf at the Tree Line

   KNOWN MISSING OR WRONG (the next passes: 2 insides, 3 dressing, 4 atmosphere, 5 polish)
   - The four insides are bare or unlit (the hut has the first delivery's fire, cots and bench). Nobody lives here. The Switchbacks, the Sleigh Bend and both Tree
     Line plots are still thin
   - NOT THIS FILE'S (the tool's / the engine's): green summer trees stand past the Pass Gate (the room's west edge land); the room's edge wall north of the Ridge;
     the snow's paint shows its tile grid; the rock sheet is very large on the crags; a north drop off the Ridge is not possible (the edge land climbs from the wall)

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The Pass Gate door `pass` (P04-01, west wall, to the North Pole)
   - The plan's two cuts here: the hub of P06-02 and the extra port P05-00 S (makeRoom opts in the tool)
   - The heights (the crevasse too), the paint, the tree zones, the sky, the edges; ctx.cabin (the log building, shared with district K)

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';
/* ── the pass's kit (pass 1, 11-16): colours, the lit window, the log house, ropes, flags. Everything is an `arch` part: sheets from the zone kit, bare colours wear a surface ── */
const SNOW = 0xf4f8ff, ICE = 0xdcecff, STONE = 0xa8a8b0, LOG = 0x7a5a40, DARK = 0x3a2a20, TRIM = 0xe8dcc0, PANE = 0xffc070, RED = 0xb8342c, HEMP = 0xb89a64, GM = 'gunmetal', GT = 0x4a5058;
const ROCK = (tint, x) => Object.assign({ gain: 1.7, uv: 1.75 }, x || {}), FLAGS = [0x3060c8, 0xf4f4f4, 0xc83030, 0x30a050, 0xf0d040];
/* level ground over a rectangle of a plot's squares (the end is exclusive), at the PLOT'S OWN level: the tool's `flat` takes the height at the rectangle's south
   edge, which is already on the grade to the next plot. A plot is level on its squares 4..8; the rectangle is cut on square 6 so both halves read their height there */
const level = (ctx, id, lx0, ly0, lx1, ly1) => { const a = ctx.S(id, lx0, ly0), ox = a[0] - lx0, oy = a[1] - ly0, xm = (lx0 + lx1) / 2, ym = (ly0 + ly1) / 2;
    if (ym >= 4 && ym <= 8 && lx0 < 6 && lx1 > 6) { ctx.flats.push([a[0], a[1], ox + 6, oy + ly1, 'E']); ctx.flats.push([ox + 6, a[1], ox + lx1, oy + ly1, 'W']); }
    else if (xm >= 4 && xm <= 8 && ly0 < 6 && ly1 > 6) { ctx.flats.push([a[0], a[1], ox + lx1, oy + 6, 'S']); ctx.flats.push([a[0], oy + 6, ox + lx1, oy + ly1, 'N']); }
    else throw new Error('level: ' + id + ' has no level square on the cut'); };
/* a lit window (the pilot's `pane`): a warm pane, a pale frame and cross, snow on the sill; ew = on a side wall */
const pane = (a, x, y, z, w, h, ew) => { const B = (px, py, pz, bw, bh, bd, key, tint, q) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, q) : a.box(px, py, pz, bw, bh, bd, key, tint, q), o = z < 0 ? -1 : 1;
    B(x, y, z, w, h, 0.06, 'marble_light', PANE, { glow: 1.0 }); B(x, y, z + o * 0.03, 0.07, h, 0.08, 'marble_light', TRIM); B(x, y + h / 2 - 0.035, z + o * 0.03, w, 0.07, 0.08, 'marble_light', TRIM);
    B(x, y - 0.1, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM); B(x, y + h, z + o * 0.05, w + 0.3, 0.1, 0.16, 'marble_light', TRIM); B(x, y, z + o * 0.1, w + 0.34, 0.07, 0.14, 'ice', SNOW); };
/* a lantern on a bracket (a lit box under a cap) */
const lantern = (a, x, y, z, q) => { a.box(x, y, z, 0.2, 0.28, 0.2, 'marble_light', 0xffb050, Object.assign({ glow: 1.3 }, q || {})); a.box(x, y + 0.28, z, 0.28, 0.06, 0.28, GM, GT, q || null); a.box(x, y + 0.34, z, 0.24, 0.05, 0.24, 'ice', SNOW, q || null); };
/* drifts against the walls without the door, icicles under the eaves (`front`: the gable is over the door, so the eaves are the two sides; `over` = the eaves' overhang) */
const winter = (a, w, h, d, dr, front, over) => {
    a.box(0, 0, -(d / 2 + 0.45), w + 1.4, 0.34, 0.7, 'ice', SNOW); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.45), 0, 0, 0.7, 0.34, d + 0.3, 'ice', SNOW);
    const L = i => 0.18 + 0.36 * (((i * 7919) % 13) / 13), ic = (x, z, i) => a.box(x, h - L(i) + 0.02, z, 0.05, L(i), 0.05, 'ice', ICE, { roof: true, glow: 0.7 });
    if (front) { for (const s of [-1, 1]) for (let i = 0, z = -d / 2 - 0.5; z <= d / 2 + 0.5; z += 0.45, i++) if (i % 5 !== 3) ic(s * (w / 2 + over), z, i + (s > 0 ? 3 : 0)); }
    else for (const s of [-1, 1]) for (let i = 0, x = -w / 2 - 0.5; x <= w / 2 + 0.5; x += 0.45, i++) if (i % 5 !== 3) ic(x, s * (d / 2 + over), i + (s > 0 ? 3 : 0)); };
/* a painted board with snow on its top edge; `q.ry` turns it */
const board = (a, words, x, y, z, w, h, fg, bg, font, q) => { a.sign(words, x, y, z, w, h, fg, bg, font, q); };
/* THE LOG HOUSE (the Warming Hut): the zone's cabin, redrawn after the first look (the walls read black, the windows olive): painted logs with `gain`, proud log
   courses, round corner logs, a stone foot, lit panes, a stone chimney, a porch on log posts, a wood stack, drifts and icicles */
const logHouse = (a, w, d, dr, q, ctx) => { const { WD, WD2, FLR } = ctx, h = q.h, tint = q.tint || LOG, C2 = 0x6a4c36, g = { gain: 1.7 };
    a.shell(w, h, d, WD, tint, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; });
    a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, 'rocks_5', STONE, ROCK(0, { faces: 'blr', top: false }));
    { const x0 = dr.lx - dr.cw / 2 - 0.3, x1 = dr.lx + dr.cw / 2 + 0.3, e = w / 2 + 0.2; a.box((x0 - e) / 2, 0, d / 2 + 0.1, x0 + e, 0.9, 0.2, 'rocks_5', STONE, ROCK()); a.box((x1 + e) / 2, 0, d / 2 + 0.1, e - x1, 0.9, 0.2, 'rocks_5', STONE, ROCK()); }
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
    for (let y = 1.02, i = 0; y < h - 0.25; y += 0.5, i++) { const t = i % 2 ? C2 : 0x7c5a40;   // the log courses
        a.box(0, y, -(d / 2 + 0.06), w + 0.5, 0.26, 0.12, WD2, t, g); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), y, 0, 0.12, 0.26, d + 0.5, WD2, t, g);
        if (y > 2.3) a.box(0, y, d / 2 + 0.06, w + 0.5, 0.26, 0.12, WD2, t, g); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * (w / 2 + 0.05), 0, sz * (d / 2 + 0.05), 0.26, h, WD2, 0x5a4030, { seg: 8, gain: 1.6 });
    a.roof('gable', 0, h, 0, d + 1.8, q.rh, w + 1.8, 'ice', SNOW, { ry: 90, keyEnd: WD, tintEnd: tint, gain: 1.7 }); a.box(0, h + q.rh - 0.04, 0, 0.22, 0.16, d + 2.1, WD2, 0x4a3626, { roof: true });
    for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.12), 0, d / 2 + 0.12, 0.24, 2.4, 0.24, WD2, 0x5a4030, { gain: 1.6 }); a.box(dr.lx, 2.25, d / 2 + 0.12, dr.cw + 0.6, 0.24, 0.24, WD2, 0x5a4030, { gain: 1.6 });
    a.box(dr.lx, 0, d / 2 + 0.6, dr.cw + 0.9, 0.14, 1.0, 'rocks_5', 0xb8b8c0, ROCK());
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; pane(a, x, 1.15, d / 2 + 0.14, 1.3, 1.25, false); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 3.5) pane(a, z, 1.15, s * (w / 2 + 0.14), 1.3, 1.25, true);
    a.box(0, h + q.rh * 0.42, d / 2 + 0.94, 0.7, 0.7, 0.06, 'marble_light', PANE, { glow: 1.0, roof: true });
    if (q.chimney) { a.box(q.chimney, 0, -d / 2 - 0.4, 1.7, h + q.rh + 0.9, 1.0, 'rocks_5', STONE, ROCK(0, { roof: true })); a.box(q.chimney, h + q.rh + 0.9, -d / 2 - 0.4, 1.9, 0.22, 1.2, 'ice', SNOW, { roof: true }); }
    if (q.porch) { a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62, { uv: [1.75, 1.75] }); const n = Math.max(2, Math.round(w / 3.5));
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - dr.lx) < 0.9) continue; a.cyl(x, 0, d / 2 + 3.25, 0.15, 2.9, WD2, 0x5a4030, { seg: 8, gain: 1.6 }); }
        a.box(0, 2.72, d / 2 + 3.25, w + 0.2, 0.2, 0.2, WD2, 0x5a4030, { gain: 1.6 });
        for (const s of [-1, 1]) { const x0 = s < 0 ? -w / 2 + 0.25 : dr.lx + 1.2, x1 = s < 0 ? dr.lx - 1.2 : w / 2 - 0.25; if (x1 - x0 > 0.6) for (const y of [0.5, 1.0]) a.box((x0 + x1) / 2, y, d / 2 + 3.25, x1 - x0, 0.1, 0.1, WD2, 0x6a4c36, g); }
        a.roof('shed', 0, 2.9, d / 2 + 1.85, w + 0.6, 0.8, 3.8, 'ice', SNOW); }
    winter(a, w, h, d, dr, true, 0.84);
    { const x = -(w / 2 + 0.42); a.box(x, 0, -d / 2 + 2.2, 0.6, 1.0, 3.2, WD2, 0x8a6444, { gain: 1.5 }); a.box(x, 1.0, -d / 2 + 2.2, 0.74, 0.1, 3.3, 'ice', SNOW); }   // the wood stack under the west eave
    lantern(a, dr.lx + dr.cw / 2 + 0.55, 1.7, d / 2 + (q.porch ? 0.2 : 0.2));
    if (q.name) board(a, q.name, 0, q.porch ? 3.75 : h - 0.2, d / 2 + (q.porch ? 3.55 : 0.96), Math.min(w - 1.0, q.name.length * 0.52 + 1.4), 0.8, '#f4ecd8', '#3a2a20', 'fell', { roof: true }); };
/* a rope between two points on one line (x or z), sagging; and a string of prayer flags the same way */
const rope = (a, x0, y0, z0, x1, y1, z1, sag, t) => { const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.45)), sl = L / n + 0.04;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; a.box(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - sag * 4 * u * (1 - u), z0 + (z1 - z0) * u, ax ? sl : (t || 0.06), t || 0.06, ax ? (t || 0.06) : sl, null, HEMP); } };
const flagLine = (a, x0, y0, z0, x1, y1, z1, sag, k) => { rope(a, x0, y0, z0, x1, y1, z1, sag, 0.03); const ax = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.5);
    for (let i = 1; i < n; i++) { const u = i / n; a.box(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - sag * 4 * u * (1 - u) - 0.36, z0 + (z1 - z0) * u, ax ? 0.36 : 0.03, 0.34, ax ? 0.03 : 0.36, null, FLAGS[(i + (k || 0)) % 5], { glow: 0.25 }); } };

/* THE SQUARES: the rock between the Ridge and the pass below it is two open SNOW SLOPES now (letter `k`, the deep drift: nobody walks it, nothing stands on it), so
   the Ridge looks down on the Pass Gate and on the High Pass and they look up at it (the first look: every plot was a pit between rock walls; a drop cut to the
   north only faced the room's own edge wall). The Lookout gains two squares on the slope's lip, and the Frozen Tarn a snow shore round its ice */
exports.tailor = t => {
    const fill = (id, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (t.get(id, x, y) === 'r') t.set(id, x, y, ch); };
    fill('P04-00', 3, 7, 4, 7, 's'); fill('P04-00', 2, 8, 9, 11, 'k'); fill('P04-01', 2, 0, 9, 1, 'k');
    fill('P05-00', 8, 6, 11, 11, 'k'); fill('P05-01', 9, 0, 11, 1, 'k');
    { const id = 'P05-02', sh = []; for (let y = 0; y < t.N; y++) for (let x = 0; x < t.N; x++) { if (t.get(id, x, y) !== 'i') continue;
          if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < t.N && Y < t.N && t.get(id, X, Y) === 'r'; })) sh.push([x, y]); }
      sh.forEach(([x, y]) => t.set(id, x, y, 's')); }
};

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  level(ctx, 'P05-01', 1, 2, 10, 8); level(ctx, 'P05-02', 3, 2, 12, 10);   // the High Pass is a level saddle, the Tarn a level sheet
  /* THE WARMING HUT, on the tree line under the pass */
  const HUT = building('hut', 'P06-03', [4, 3, 8, 6, 'S'], 3.5, {}, (a, w, d, dr) => logHouse(a, w, d, dr, { h: 3.5, rh: 2.6, chimney: 4.5, porch: true, name: 'WARMING HUT' }, ctx));
  HUT.put('campfire', 4.5, -3.3); HUT.put('cot', -5, -3.4, { face: 0 }); HUT.put('cot', -5, 0.4, { face: 0 }); HUT.put('locker_bench', 1, -4.2, { face: 0 }); HUT.put('rug_round', 1.5, -1, { y: 0.17 }); HUT.put('xmas_cocoa', 1, -4.2, { y: 0.5 });
  HUT.put('psx_wooden_crate_2', 5.6, 3.4); HUT.put('railway_lantern', -1.5, 3.6);
  /* THE GATE HOUSE (P04-01): the keeper's stone house beside the Pass Gate */
  building('gatehouse', 'P04-01', [5, 2, 8, 4, 'S'], 3.3, {}, (a, w, d, dr) => { const h = 3.3, ST = 0xb4b4bc;
      a.shell(w, h, d, 'rocks_5', ST, dr, [1.75, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.8; });
      a.box(0, 0, 0, w + 0.3, 0.5, d + 0.3, 'rocks_5', 0x8c8c94, ROCK(0, { faces: 'blr', top: false })); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < 7; i++) a.box(sx * (w / 2 + 0.03), i * 0.47, sz * (d / 2 + 0.03), i % 2 ? 0.5 : 0.36, 0.45, i % 2 ? 0.36 : 0.5, 'marble_light', 0xd8d4cc);   // the quoins
      a.roof('gable', 0, h, 0, w + 1.3, 2.3, d + 1.3, 'ice', SNOW, { keyEnd: 'rocks_5', tintEnd: ST, gain: 1.8 }); a.box(0, h + 2.26, 0, w + 1.6, 0.16, 0.22, WD2, 0x4a3626, { roof: true });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.14), 0, d / 2 + 0.1, 0.28, 2.4, 0.22, 'marble_light', 0xd8d4cc); a.box(dr.lx, 2.3, d / 2 + 0.1, dr.cw + 0.8, 0.3, 0.24, 'marble_light', 0xd8d4cc);
      a.roof('shed', dr.lx, 2.6, d / 2 + 0.55, dr.cw + 1.2, 0.4, 1.0, 'ice', SNOW); a.box(dr.lx, 0, d / 2 + 0.6, dr.cw + 0.9, 0.14, 1.0, 'rocks_5', 0xb8b8c0, ROCK());
      for (const x of [-w / 2 + 1.75, w / 2 - 1.75]) if (Math.abs(x - dr.lx) > 1.7) pane(a, x, 1.15, d / 2 + 0.1, 1.1, 1.2, false);
      for (const s of [-1, 1]) pane(a, 0, 1.15, s * (w / 2 + 0.1), 1.1, 1.2, true); pane(a, -w / 4, 1.15, -(d / 2 + 0.1), 1.1, 1.2, false);
      a.box(w / 2 - 1.2, h, -d / 2 + 0.6, 1.1, 3.2, 1.1, 'rocks_5', 0x8c8c94, ROCK(0, { roof: true })); a.box(w / 2 - 1.2, h + 3.2, -d / 2 + 0.6, 1.3, 0.2, 1.3, 'ice', SNOW, { roof: true });
      winter(a, w, h, d, dr, false, 0.6); lantern(a, dr.lx + dr.cw / 2 + 0.6, 1.7, d / 2 + 0.18);
      board(a, 'GATE HOUSE', dr.lx, 3.05, d / 2 + 0.72, 3.4, 0.6, '#f4ecd8', '#3a2a20', 'fell', { roof: true }); });
  /* THE SUMMIT SHELTER (P05-00, the top of the range): a red emergency hut with a round roof */
  building('shelter', 'P05-00', [3, 8, 5, 10, 'N'], 2.5, { leaf: 'leaf_shabby_wood' }, (a, w, d, dr) => { const h = 2.5;
      a.shell(w, h, d, null, RED, dr); a.box(0, 0, 0, w + 0.3, 0.4, d + 0.3, 'rocks_5', STONE, ROCK(0, { faces: 'blr', top: false })); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      a.box(0, 1.5, -(d / 2 + 0.03), w + 0.12, 0.3, 0.06, null, 0xf0f0f0); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.03), 1.5, 0, 0.06, 0.3, d + 0.12, null, 0xf0f0f0);   // the white band
      a.roof('barrel', 0, h, 0, d + 0.5, 1.5, w + 0.3, null, RED, { ry: 90, keyEnd: null, tintEnd: RED }); a.box(0, h + 1.38, 0, w * 0.55, 0.14, d + 0.3, 'ice', SNOW, { roof: true });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.1), 0, d / 2 + 0.08, 0.16, 2.3, 0.16, GM, GT); a.box(dr.lx, 2.22, d / 2 + 0.08, dr.cw + 0.36, 0.16, 0.16, GM, GT);
      for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), 1.2, 0, 0.06, 0.6, 0.9, 'marble_light', PANE, { glow: 1.0 });
      a.cyl(w / 2 - 0.5, h + 1.0, -d / 2 + 0.5, 0.03, 3.4, GM, GT, { seg: 6, roof: true }); a.box(w / 2 - 0.5, h + 4.4, -d / 2 + 0.5, 0.14, 0.14, 0.14, null, 0xff3020, { glow: 1.6, roof: true });   // the whip aerial and its light
      winter(a, w, h, d, dr, true, 0.3); lantern(a, dr.lx + dr.cw / 2 + 0.5, 1.6, d / 2 + 0.16);
      board(a, 'SHELTER', dr.lx, 2.5, d / 2 + 0.1, 2.6, 0.55, '#ffffff', '#8a1c18', 'stencil'); });
  /* THE FISHING HUT, out on the Tarn's ice */
  building('icehut', 'P05-02', [5, 5, 7, 7, 'S'], 2.6, {}, (a, w, d, dr) => { const h = 2.6, T = 0x8a6a4a;
      a.shell(w, h, d, WD, T, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; }); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      for (const s of [-1, 1]) a.box(s * (w / 2 - 0.3), -0.02, 0, 0.3, 0.14, d + 1.4, WD2, 0x5a4030, { gain: 1.6 });   // its two runners (it was dragged out here)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.2, h, 0.2, WD2, 0x5a4030, { gain: 1.6 });
      a.roof('shed', 0, h, 0, w + 0.8, 0.9, d + 0.8, 'ice', SNOW); a.box(0, h - 0.14, 0, w + 0.14, 0.14, d + 0.14, WD2, 0x5a4030, { gain: 1.6, top: false });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.08), 0, d / 2 + 0.08, 0.14, 2.3, 0.14, WD2, 0x5a4030, { gain: 1.6 }); a.box(dr.lx, 2.22, d / 2 + 0.08, dr.cw + 0.3, 0.14, 0.14, WD2, 0x5a4030, { gain: 1.6 });
      pane(a, 0, 1.2, -(d / 2 + 0.1), 0.9, 0.9, false); for (const s of [-1, 1]) pane(a, 0, 1.2, s * (w / 2 + 0.1), 0.9, 0.9, true);
      a.cyl(-w / 2 + 0.9, h, -d / 2 + 0.9, 0.12, 1.9, GM, GT, { seg: 8, roof: true }); a.cyl(-w / 2 + 0.9, h + 1.9, -d / 2 + 0.9, 0.2, 0.1, GM, GT, { seg: 8, roof: true });   // the stovepipe
      lantern(a, dr.lx + dr.cw / 2 + 0.45, 1.6, d / 2 + 0.16); board(a, 'FISHING HUT', dr.lx, 2.42, d / 2 + 0.1, 3.0, 0.5, '#f4ecd8', '#3a2a20', 'fell'); });
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
    const LG = { gain: 1.6 }, POST = 0x5a4030;
    const mark = (id, lx, ly) => { const q = S(id, lx, ly); R.taken.add(q[0] + ':' + q[1]); return q; };
  /* ── THE PASS GATE (P04-01): two stone piers, log posts, two beams, a snow roof on the top beam, lanterns, the board on both faces ── */
  { const q = S('P04-01', 2, 4); look('passgate', r2(gx(q[0]) + 1.75), gz(q[1] + 1), a => {
        for (const s of [-1, 1]) { a.box(0, 0, s * 4.0, 1.5, 2.0, 1.5, 'rocks_5', STONE, ROCK()); a.box(0, 2.0, s * 4.0, 1.7, 0.18, 1.7, 'ice', SNOW); a.cyl(0, 2.0, s * 4.0, 0.34, 4.6, WD2, POST, { seg: 10, gain: 1.6 });
            a.box(0, 5.0, s * 2.9, 0.26, 0.26, 2.0, WD2, POST, LG); lantern(a, 0, 3.6, s * 2.5); a.box(0, 3.94, s * 2.5, 0.04, 1.1, 0.04, GM, GT); }
        a.box(0, 5.3, 0, 0.5, 0.5, 10.6, WD2, POST, LG); a.box(0, 6.5, 0, 0.6, 0.5, 12.2, WD2, 0x8a2a20, { gain: 1.5 }); for (const s of [-1, 1]) a.box(0, 5.8, s * 2.2, 0.36, 0.7, 0.36, WD2, POST, LG); a.box(0, 5.8, 0, 0.36, 0.7, 0.36, WD2, POST, LG);
        a.roof('gable', 0, 7.0, 0, 13.0, 0.7, 1.6, 'ice', SNOW, { ry: 90 });
        for (const ry of [90, 270]) board(a, 'THE PASS GATE', (ry === 90 ? 0.3 : -0.3), 4.15, 0, 5.2, 0.95, '#f4ecd8', '#3a2a20', 'fell', { ry }); }); }
  put('P04-01', 'hw_stone_3', 4, 6); dec('P04-01', 'psxg_rock_2', 5, 7); put('P04-01', 'signpost', 3, 6, { face: 270 }); dec('P04-01', 'railway_lantern', 4, 4);
  /* ── THE HIGH PASS (P05-01, the landmark): the great cairn on its ring, four flag poles and the flags strung to it, braziers ── */
  { const q = mark('P05-01', 5, 4); look('highpass', mx(q[0]), mz(q[1]), a => {
        a.cyl(0, 0, 0, 3.0, 0.3, 'rocks_5', 0x9a9aa0, ROCK(0, { seg: 12 })); for (let i = 0; i < 7; i++) a.cyl(0, 0.3 + i * 0.62, 0, 1.55 - i * 0.2, 0.62, 'rocks_5', i % 2 ? 0xa6a6ae : 0x8e8e96, ROCK(0, { seg: 8, r2: 1.4 - i * 0.2 }));
        a.cyl(0, 4.64, 0, 0.32, 0.3, 'ice', SNOW, { seg: 8 }); a.cyl(0, 4.6, 0, 0.07, 2.6, WD2, DARK, { seg: 6, gain: 1.6 });
        for (const [dx, dz, k] of [[8.75, 0, 0], [-8.75, 0, 2], [0, 7, 1], [0, -7, 3]]) { a.cyl(dx, 0, dz, 0.5, 0.5, 'rocks_5', 0x9a9aa0, ROCK(0, { seg: 8 })); a.cyl(dx, 0.5, dz, 0.09, 4.3, WD2, DARK, { seg: 6, gain: 1.6 });
            flagLine(a, 0, 7.0, 0, dx, 4.7, dz, 0.5, k); }
        for (const s of [-1, 1]) { a.box(s * 4.6, 0, 2.6, 2.0, 0.45, 0.6, 'rocks_5', 0xa6a6ae, ROCK()); a.box(s * 4.6, 0.45, 2.6, 2.1, 0.06, 0.7, 'ice', SNOW); }   // two stone seats
        a.box(2.6, 0, 3.3, 0.12, 1.5, 0.12, WD2, DARK, { gain: 1.6 }); board(a, 'THE HIGH PASS', 2.6, 1.0, 3.38, 2.4, 0.5, '#f4ecd8', '#3a2a20', 'fell'); });
    for (const [lx, ly] of [[8, 4], [2, 4], [5, 6], [5, 2]]) mark('P05-01', lx, ly); }
  put('P05-01', 'brazier', 3, 6); put('P05-01', 'brazier', 7, 6); put('P05-01', 'menhir', 2, 2); put('P05-01', 'cave_stone', 8, 2); put('P06-01', 'signpost', 3, 5, { face: 90 }); put('P06-01', 'hw_stone_5', 4, 3); dec('P06-01', 'psxg_rock_1', 5, 3);
  /* ── THE RIDGE (P04-00 .. P06-00): the Lookout's deck on the edge, the rail along the drop, the mast ── */
  { const q = S('P04-00', 5, 7); look('lookout', gx(q[0]), mz(q[1]), a => {   // THE LOOKOUT: a plank deck on the lip of the snow slope, a rail, a flag; the Pass Gate is below
        a.box(0, 0.02, 0.1, 14.2, 0.12, 3.5, FLR, 0x8c7a62, { uv: [1.75, 1.75] }); for (let x = -7; x <= 7.01; x += 2.8) { a.box(x, 0, 1.75, 0.22, 1.25, 0.22, WD2, POST, LG); a.box(x, 1.25, 1.75, 0.3, 0.06, 0.3, 'ice', SNOW); }
        for (const y of [0.55, 1.05]) { a.box(0, y, 1.75, 14.0, 0.12, 0.1, WD2, 0x6a4c36, LG); a.box(-7, y, 0.1, 0.1, 0.12, 3.3, WD2, 0x6a4c36, LG); } a.box(-7, 0, -1.55, 0.22, 1.25, 0.22, WD2, POST, LG);
        a.cyl(-6.6, 0, 1.4, 0.07, 6.5, GM, GT, { seg: 6 }); a.box(-5.95, 5.5, 1.4, 1.2, 0.8, 0.03, null, RED, { glow: 0.3 }); a.box(-5.95, 5.75, 1.4, 0.5, 0.3, 0.05, null, 0xf4f4f4, { glow: 0.3 });
        a.box(-6.9, 0, -1.2, 0.12, 2.5, 0.12, WD2, POST, LG); board(a, 'THE LOOKOUT', -6.82, 1.9, 0.1, 2.4, 0.5, '#f4ecd8', '#3a2a20', 'fell', { ry: 90 }); }); }
  put('P04-00', 'brass_telescope', 4, 7, { face: 180 }); put('P04-00', 'hw_stone_2', 6, 4); dec('P04-00', 'psxg_rock_3', 5, 5);
  { const d0 = S('P05-00', 7, 5), d1 = S('P05-00', 11, 5); feat({ k: 'rail', x0: gx(d0[0]), z0: r2(gz(d0[1]) + 0.3), x1: gx(d1[0] + 1), z1: r2(gz(d1[1]) + 0.3), model: 'ranch' }); }   // the rail on the ridge trail where it looks down on the High Pass
  { const q = mark('P06-00', 7, 5); look('mast', mx(q[0]), mz(q[1]), a => {   // THE MAST: a lattice radio mast in red and white, a red light on top
        a.box(0, 0, 0, 3.0, 0.3, 3.0, 'rocks_5', 0x8c8c94, ROCK());
        for (let i = 0; i < 7; i++) { const w0 = 1.1 - i * 0.13, c = i % 2 ? 0xf0f0f0 : 0xc83020, y = 0.3 + i * 2.4; for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w0, y, sz * w0, 0.1, 2.4, 0.1, null, c);
            for (const s of [-1, 1]) { a.box(0, y + 2.3, s * w0, 2 * w0, 0.08, 0.08, null, c); a.box(s * w0, y + 2.3, 0, 0.08, 0.08, 2 * w0, null, c); a.box(0, y + 1.15, s * w0, 2 * w0, 0.05, 0.05, null, c); a.box(s * w0, y + 1.15, 0, 0.05, 0.05, 2 * w0, null, c); } }
        a.cyl(0, 17.1, 0, 0.04, 3.2, GM, GT, { seg: 6 }); a.box(0, 20.3, 0, 0.3, 0.3, 0.3, null, 0xff2a1a, { glow: 1.8 }); a.box(0, 9.9, 0.5, 0.22, 0.22, 0.22, null, 0xff2a1a, { glow: 1.8 });
        a.box(2.2, 0.3, -0.6, 1.1, 1.7, 0.8, GM, 0x6a7078, { gain: 1.5 }); a.box(2.2, 2.0, -0.6, 1.2, 0.08, 0.9, 'ice', SNOW); a.box(2.2, 1.5, -0.18, 0.08, 0.08, 0.04, null, 0x40ff60, { glow: 1.6 }); }); }
  put('P06-00', 'dish', 8, 4, { face: 180 }); put('P05-00', 'hw_stone_4', 6, 6); dec('P05-00', 'eagle', 8, 4, { y: 0.02 }); dec('P05-00', 'psxg_rock_2', 3, 6); dec('P06-00', 'psxg_rock_1', 6, 6);
  /* ── THE SLEIGH BEND, THE FROZEN TARN ── */
  put('P04-02', 'sleigh', 5, 6, { face: 30 }); put('P04-02', 'xmas_snowman', 3, 7);
  { const p = R.byId['P05-02'], q = S('P05-02', 6, 6); look('tarn', gx(q[0]), gz(q[1]), a => {   // THE TARN: the ice itself, a sheet on every ice square, and two fishing holes
        for (let ly = 0; ly < N; ly++) { let x0 = -1; for (let lx = 0; lx <= N; lx++) { const on = lx < N && cell[p.ly * N + ly][p.lx * N + lx] === 'i';
            if (on && x0 < 0) x0 = lx; if (!on && x0 >= 0) { a.box(((x0 + lx) / 2 - 6) * C, 0.03, (ly + 0.5 - 6) * C, (lx - x0) * C, 0.04, C, 'ice_1', 0x8cc4ec, { uv: 7, glow: 0.35, sides: false }); x0 = -1; } } }
        for (const [x, z] of [[5.6, -5.4], [-4.4, 6.2]]) { a.cyl(x, 0.06, z, 0.62, 0.03, null, 0x0c1c2c, { seg: 12 }); a.cyl(x, 0.05, z, 0.8, 0.05, 'ice', SNOW, { seg: 12, ri: 0.62 }); } }); }
  put('P05-02', 'camping_tent', 9, 4, { face: 200 }); dec('P05-02', 'sea_chest', 9, 6);
  /* ── THE ROPE BRIDGE (P06-02): planks on two stringers, four posts on stone feet, two ropes a side with their hangers; ranch rails along both lips of the slot ── */
  { const p = R.byId['P06-02'], z0 = gz(p.ly * N + 5), z1 = gz(p.ly * N + 7), xa = gx(p.lx * N + 5), xb = gx(p.lx * N + 7);
    for (const [x0, x1] of [[gx(p.lx * N), xa], [xb, gx(p.lx * N + N)]]) for (const z of [r2(z0 - 0.4), r2(z1 + 0.4)]) feat({ k: 'rail', x0, z0: z, x1, z1: z, model: 'ranch' });
    look('ropebridge', r2((xa + xb) / 2), r2((z0 + z1) / 2), a => {
        for (const s of [-1, 1]) a.box(s * 2.6, 0, 0, 0.3, 0.1, 8.4, WD2, POST, LG);
        for (let i = 0; i < 17; i++) a.box((i % 3 - 1) * 0.06, 0.1, -4.0 + i * 0.5, 6.5, 0.07, 0.42, WD2, i % 2 ? 0x8a6a4a : 0x74583e, LG);
        for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { a.cyl(sx * 3.3, 0, sz * 4.3, 0.55, 0.5, 'rocks_5', 0x9a9aa0, ROCK(0, { seg: 8 })); a.cyl(sx * 3.3, 0.5, sz * 4.3, 0.2, 2.1, WD2, POST, { seg: 8, gain: 1.6 }); a.cyl(sx * 3.3, 2.6, sz * 4.3, 0.24, 0.1, 'ice', SNOW, { seg: 8 }); }
            rope(a, sx * 3.3, 2.3, -4.3, sx * 3.3, 2.3, 4.3, 0.75, 0.09); rope(a, sx * 3.3, 1.2, -4.3, sx * 3.3, 1.2, 4.3, 0.5, 0.07);
            for (let z = -3.6; z <= 3.61; z += 0.9) { const u = (z + 4.3) / 8.6, top = 2.3 - 0.75 * 4 * u * (1 - u); a.box(sx * 3.3, 0.14, z, 0.04, top - 0.14, 0.04, null, HEMP); } } }); }
  put('P06-02', 'signpost', 5, 3, { face: 180 }); dec('P06-02', 'meshy_rope', 7, 8);
  dec('P04-03', 'fallen_log', 5, 5); dec('P04-03', 'wolf', 4, 6); dec('P05-03', 'stump', 5, 6); tree('P05-03', 'xmas_snow_pine', 6, 6, 5); dec('P06-03', 'fallen_log', 3, 7); put('P06-03', 'signpost', 8, 6, { face: 0 });
};
