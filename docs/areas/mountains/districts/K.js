/* THE MOUNTAINS · THE SKI LODGE + SLOPES (district K, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P07-00 The Black Run, top (18)          P08-00 The Top Station (18)             P09-00 The Half-Pipe (17)
     P07-01 The Black Run (15)               P08-01 The Big Jump (14)                P09-01 The Slalom (14)
     P07-02 The Run-Out (11)                 P08-02 The Chairlift (11)               P09-02 The Bunny Slope (11)
     P07-03 The Rental Hut (8)               P08-03 The Ski Lodge (8)                P09-03 The Lodge Yard (8)

   WHAT STANDS HERE TODAY (pass 1, exteriors, 11-16; seen on screen)
   - Walked into: THE SKI LODGE (P08-03), THE RENTAL HUT (P07-03), THE TOP STATION (P08-00). Their look is this file's `chalet` (log walls with crossed
     log ends, stone foot, snow roof with deep eaves, lit windows, drifts, icicles): the Lodge adds a glazed gable, a porch with a rail, a gabled way in on
     stone piers and a smoking stone stack; the Rental Hut a serving hatch and the catalogue's `surfboard_rack`; boards in the district's one face (`alfa`).
     Insides are still the first delivery's (pass 2).
   - Five runs on the tool's slope sheet (one even grade, the board rolls them): the Black Run through the trees (P07-00..02), the Big Jump's kicker (P08-01, a `ramp`),
     the Slalom's five gates (P09-01), the Half-Pipe (P09-00: two rounded snow walls 3.3 m high, see build), the Bunny Slope (P09-02)
   - THE CHAIRLIFT: a bullwheel house at each end, four gantry towers whose legs stand clear of the Big Jump's run, two cables, 16 chairs (one `hug` row),
     the catalogue's `ticket_booth` at the bottom, two grind rails under the line, a door pair `lift_bottom` / `lift_top` (same room) that carries you
   - The Lodge Yard (P09-03) is the room's spawn (the tool's)

   RIDDEN ON THE BOARD (the probe, 11-16: W held from the top of each run)
   - Black Run, Big Jump line, Half-Pipe floor + Slalom + Bunny Slope: clean top to bottom in about 11 s at the board's top speed, no snag. The kicker throws
     the rider about 2 m clear. Each run ENDS on a wall: the Black Run on the back of the Rental Hut, the Big Jump's line on the back of the Lodge (pass 3: nets, SLOW boards)

   KNOWN MISSING OR WRONG
   - Nothing rides the cable: the chairs hang still. Chairs that move, or a chair the player rides, would be a new mechanic: ASKED of mondo 11-16, not built
   - The insides (pass 2), run markers / fences / signs / snow guns / racks (pass 3), night lights + smoke + the night look (pass 4)
   - No encounter table, nobody lives or works here (no one at the bar or the rental counter)
   - The lift's two doors are the plain concrete frame (`leaf_frame_only`): they wait for mondo's word on the lift

   FOUND IN THE MODEL LIST (THE MODEL LIST FIRST, mondo 11-16; all are catalogue rows on R2 today, none placed before this thread)
   - used in pass 1: `surfboard_rack` (the Rental Hut's boards), `ticket_booth`, `rope_stanchion`, `chimney_smoke`
   - for pass 2 (insides): `scarf_rack`, `key_rack`, `brochure_rack`, `map_table`, `pinball_machine`, `arms_trophy` (over the fire), `psx_armchair_*`, `psx_sofa_*`,
     `stock_pots`, `pot_rack`, `psx_glass_bottle_*`, `radio_console` / `field_radio` (the lift man's desk), `hospital_bed` + `fire_extinguisher` (first aid), `hearth_fire`
   - for pass 3 (dressing): `hw_fence` (run edges), `item_police_barricade`, `traffic_barrel`, `pa_speaker` (on the towers), `turnstile` / `metro_gate` (the lift's gate),
     `telescope` (the Top Station's view), `psx_wooden_crate_*`, `psx_metal_barrel_mp_*`, `wrapped_pallet`, `hand_truck`, `quarter_pipe` + `riser_*`, `wolf`, `dog`, `eagle`, `rabbit`, `crow`
   - for pass 4 (night): `flood_mast` (a real night light, 26 m: night skiing), `festoon` (string lights), `brazier`, `meshy_hanging_lantern`, `railway_lantern`
   - looked at and not used: the Christmas pack's six `Snow*` nodes and its `Christmas_star` / `Ribbon` have no row (the snow caps of the pack's own house and
     trees, not loose drifts); `woods_cabin` / `xmas_house` are single house props (buildings are built); `decor_ferris_gondola` stood in for chairs and is gone

   NEEDS A MODEL (no file in MODEL_LIST.md or on R2; nothing stands in for them)
   - skis and poles (a rack of them), a snowboard, a snow gun, a piste groomer, a snowmobile, orange safety netting, a reindeer / elk head for the Lodge wall

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The slope itself (zflat: no shelves on columns 7-9 of the plan), the paint of the runs, the spawn
   - The Bunny Slope's join east to Olympus' Sacred Way (the plan's own ports)
   - ctx.cabin (the first delivery's log building): still the Warming Hut's (district P). This district no longer calls it (its look is `chalet` below)

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

/* ── THE LOOKS (pass 1, 11-16). Parts frame of a building: its middle, x along the front, +z out of the front, y from its floor. ── */
const LOGC = 0x8a6444, DARK = 0x3a2a20, SNOW = 0xf4f8ff, STONE = 0xa8a8b0, PANE = 0xffc070, STEEL = 0x69717a, PAD = 0xe07a1c, FONT = 'alfa';
const HC = 8.5;   // the lift cable over the snow (m); a chair's seat hangs 3.5 m under it
/* a lit window: a warm pane, a dark timber frame and cross, snow on the sill (ew: on a side wall, then `z` is the wall's x and `x` runs along z) */
const win = (a, x, y, z, w, h, ew, WD2, q) => { const o = z < 0 ? -1 : 1, G = Object.assign({ gain: 1.5 }, q || {}),
    B = (px, py, pz, bw, bh, bd, key, tint, g) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, g) : a.box(px, py, pz, bw, bh, bd, key, tint, g);
    B(x, y, z, w, h, 0.06, 'marble_light', PANE, Object.assign({ glow: 1.0 }, q || {}));
    B(x, y, z + o * 0.03, 0.08, h, 0.08, WD2, DARK, G); B(x, y + h / 2 - 0.04, z + o * 0.03, w, 0.08, 0.08, WD2, DARK, G);
    for (const s of [-1, 1]) B(x + s * (w / 2 + 0.06), y - 0.06, z + o * 0.04, 0.14, h + 0.2, 0.12, WD2, DARK, G);
    B(x, y - 0.14, z + o * 0.06, w + 0.4, 0.14, 0.22, WD2, DARK, G); B(x, y + h, z + o * 0.05, w + 0.3, 0.14, 0.18, WD2, DARK, G);
    B(x, y, z + o * 0.13, w + 0.4, 0.07, 0.14, 'ice', SNOW, q || null); B(x, y + h + 0.14, z + o * 0.06, w + 0.3, 0.06, 0.2, 'ice', SNOW, q || null); };
/* a painted board: the words in the district's one face, a dark timber frame, snow lying on its top edge */
const board = (a, words, x, y, z, w, h, fg, bg, WD2, q) => { a.sign(words, x, y, z, w, h, fg, bg, FONT, q);
    const f = (px, py, bw, bh) => a.box(px, py, z - 0.03, bw, bh, 0.08, WD2, DARK, Object.assign({ gain: 1.5 }, q || {})); f(x, y - 0.09, w + 0.18, 0.09); f(x, y + h, w + 0.18, 0.09); for (const s of [-1, 1]) f(x + s * (w / 2 + 0.045), y, 0.09, h);
    a.box(x, y + h + 0.09, z, w + 0.26, 0.09, 0.2, 'ice', SNOW, q || null); };
/* THE LOG BUILDING of this district (the Lodge, the Rental Hut, the Top Station): a stone foot, log walls with crossed log ends at the corners, a snow
   roof with deep eaves whose gable faces the front, lit windows on every wall, a stone chimney, drifts against the walls. (ctx.cabin is the first
   delivery's and still the Warming Hut's, district P; this district draws its own.) q: h, rh, tint, chimney (its x along the back wall), wins (false = none in front) */
const chalet = (a, w, d, dr, q, ctx) => { const { WD, WD2, FLR } = ctx, h = q.h, T = q.tint || LOGC, ov = 1.2;
    a.shell(w, h, d, WD, T, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; });
    a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, 'rocks_5', STONE, { faces: 'blr', top: false });
    { const x0 = dr.lx - dr.cw / 2 - 0.3, x1 = dr.lx + dr.cw / 2 + 0.3, e = w / 2 + 0.25; a.box((x0 - e) / 2, 0, d / 2 + 0.13, x0 + e, 1.0, 0.24, 'rocks_5', STONE); a.box((x1 + e) / 2, 0, d / 2 + 0.13, e - x1, 1.0, 0.24, 'rocks_5', STONE); }
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { a.box(sx * w / 2, 1.0, sz * d / 2, 0.44, h - 1.0, 0.44, WD2, 0x6a4a34, { gain: 1.5 });   // the corner post + the crossed log ends
        for (let y = 1.15, i = 0; y < h - 0.3; y += 0.5, i++) { if (i % 2) a.box(sx * (w / 2 + 0.3), y, sz * d / 2, 0.5, 0.3, 0.3, WD2, 0x7a583c, { gain: 1.5 }); else a.box(sx * w / 2, y, sz * (d / 2 + 0.3), 0.3, 0.3, 0.5, WD2, 0x7a583c, { gain: 1.5 }); } }
    a.roof('gable', 0, h, 0, d + 0.1, q.rh, w, 'ice', SNOW, { ry: 90, over: ov, keyEnd: WD, tintEnd: T, keyUnder: WD2, gain: 1.9 });
    for (const s of [-1, 1]) a.box(s * (w / 2 + ov), h - 0.2, 0, 0.16, 0.26, d + 2 * ov + 0.1, WD2, DARK, { roof: true, gain: 1.5 });          // the eave boards
    a.box(0, h + q.rh - 0.05, 0, 0.26, 0.2, d + 2 * ov + 0.3, WD2, DARK, { roof: true, gain: 1.5 });                                            // the ridge log
    a.box(0, h - 0.24, 0, w + 0.16, 0.24, d + 0.16, WD2, DARK, { top: false, gain: 1.5 });                                                       // the wall plate under the roof
    for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.12), 0, d / 2 + 0.12, 0.24, 2.4, 0.24, WD2, DARK, { gain: 1.5 }); a.box(dr.lx, 2.25, d / 2 + 0.12, dr.cw + 0.6, 0.24, 0.24, WD2, DARK, { gain: 1.5 });
    const wy = 1.15, wh = Math.min(1.7, h - 2.1);
    if (q.wins !== false) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (Math.abs(x - dr.lx) > 2.0) win(a, x, wy, d / 2 + 0.08, 1.5, wh, false, WD2);
    for (const s of [-1, 1]) for (let z = -d / 2 + 1.75; z < d / 2; z += 3.5) win(a, z, wy, s * (w / 2 + 0.08), 1.5, wh, true, WD2);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (!q.chimney || Math.abs(x - q.chimney) > 2.4) win(a, x, wy, -d / 2 - 0.08, 1.5, wh, false, WD2);
    if (q.chimney) { const cx = q.chimney, top = h + q.rh * (1 - Math.abs(cx) / (w / 2 + ov)) + 1.9;                                             // the stack climbs the back wall and stands clear of the roof
        a.box(cx, 0, -d / 2 - 0.55, 2.8, 2.6, 1.3, 'rocks_5', STONE, { gain: 1.6 }); a.box(cx, 2.6, -d / 2 - 0.45, 2.0, h - 2.6, 1.1, 'rocks_5', STONE, { gain: 1.6 }); a.box(cx, h, -d / 2 - 0.45, 2.0, top - h, 1.1, 'rocks_5', STONE, { roof: true, gain: 1.6 });
        a.box(cx, top, -d / 2 - 0.45, 2.3, 0.2, 1.4, 'rocks_5', 0x8a8a92, { roof: true }); a.box(cx, top + 0.2, -d / 2 - 0.45, 2.3, 0.12, 1.4, 'ice', SNOW, { roof: true });
        a.box(cx, 0, -d / 2 + 0.7, 3.0, 2.4, 1.2, 'rocks_5', STONE); a.box(cx, 2.4, -d / 2 + 0.75, 3.4, 0.2, 1.3, WD2, DARK); }                  // the hearth's breast inside (the first delivery's)
    a.box(0, 0, -(d / 2 + 0.55), w + 1.6, 0.36, 0.7, 'ice', SNOW); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.55), 0, 0, 0.7, 0.36, d + 0.5, 'ice', SNOW);   // drifts against the three walls without the door
    const L = i => 0.2 + 0.4 * (((i * 7919) % 13) / 13);                                                                                         // icicles along the two eaves
    for (const s of [-1, 1]) for (let i = 0, z = -d / 2 - ov + 0.2; z <= d / 2 + ov - 0.2; z += 0.5, i++) if (i % 5 !== 3) a.box(s * (w / 2 + ov - 0.06), h - L(i + (s > 0 ? 3 : 0)) - 0.2, z, 0.05, L(i + (s > 0 ? 3 : 0)), 0.05, 'ice', 0xdcecff, { roof: true, glow: 0.7 }); };
/* the Lodge: the log building + a glazed gable over the front, a porch along the whole front with a rail, a gabled way in on stone piers */
const lodge = (a, w, d, dr, ctx) => { const { WD, WD2, FLR } = ctx, h = 5.25, rh = 6.2, z0 = d / 2;
    chalet(a, w, d, dr, { h, rh, chimney: 9.5 }, ctx);
    for (let k = 0; k < 3; k++) { const y = h + 0.45 + k * 1.75, hw = Math.min(7.2, (w / 2 + 1.2) * (1 - (y + 1.4 - h) / rh) - 0.7), n = Math.max(1, Math.floor((2 * hw) / 1.7)), pw = (2 * hw) / n;   // the great window in the gable: three rows of panes under the rafters
        for (let i = 0; i < n; i++) a.box(-hw + (i + 0.5) * pw, y, z0 + 0.12, pw - 0.22, 1.4, 0.06, 'marble_light', PANE, { glow: 1.0, roof: true });
        a.box(0, y - 0.2, z0 + 0.14, 2 * hw + 0.3, 0.2, 0.2, WD2, DARK, { roof: true, gain: 1.5 }); }
    a.box(0, h + 0.2, z0 + 0.16, 0.3, rh - 0.5, 0.24, WD2, DARK, { roof: true, gain: 1.5 });                                                     // the king post
    a.box(0, 0, z0 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);                                                                                         // the porch: its deck, posts on stone, a rail, a snow roof
    { const n = Math.round(w / 3.5); for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.3 + i * (w - 0.6) / n; if (Math.abs(x - dr.lx) < 2.4) continue; a.box(x, 0, z0 + 3.25, 0.5, 0.9, 0.5, 'rocks_5', STONE); a.box(x, 0.9, z0 + 3.25, 0.26, 2.1, 0.26, WD2, DARK, { gain: 1.5 }); }
      for (const s of [-1, 1]) { const x0 = s < 0 ? -w / 2 + 0.3 : dr.lx + 3.2, x1 = s < 0 ? dr.lx - 3.2 : w / 2 - 0.3; for (const y of [0.55, 1.0]) a.box((x0 + x1) / 2, y, z0 + 3.25, x1 - x0, 0.1, 0.1, WD2, 0x6a4a34, { gain: 1.5 }); a.box((x0 + x1) / 2, 1.1, z0 + 3.25, x1 - x0, 0.05, 0.16, 'ice', SNOW); }
      for (const s of [-1, 1]) for (const y of [0.55, 1.0]) a.box(s * (w / 2 - 0.3), y, z0 + 1.7, 0.1, 0.1, 3.0, WD2, 0x6a4a34, { gain: 1.5 }); }
    a.box(0, 3.0, z0 + 3.25, w, 0.26, 0.26, WD2, DARK, { gain: 1.5 }); a.roof('shed', 0, 3.1, z0 + 1.85, w + 0.6, 0.8, 3.8, 'ice', SNOW);
    for (const s of [-1, 1]) { a.box(dr.lx + s * 2.9, 0, z0 + 4.2, 0.9, 1.2, 0.9, 'rocks_5', STONE); a.box(dr.lx + s * 2.9, 1.2, z0 + 4.2, 0.4, 2.3, 0.4, WD2, DARK, { gain: 1.5 }); a.box(dr.lx + s * 2.9, 1.2, z0 + 4.2, 1.0, 0.1, 1.0, 'ice', SNOW); }   // the way in
    a.box(dr.lx, 3.5, z0 + 4.2, 6.6, 0.4, 0.4, WD2, DARK, { gain: 1.5 }); a.roof('gable', dr.lx, 3.9, z0 + 2.3, 4.6, 1.8, 6.4, 'ice', SNOW, { ry: 90, over: 0.4, keyEnd: WD, tintEnd: LOGC, keyUnder: WD2, gain: 1.9 });
    board(a, 'SKI LODGE', dr.lx, 3.92, z0 + 4.66, 4.6, 0.82, '#f4ecd8', '#2f4a3a', WD2, { roof: true });
    for (const s of [-1, 1]) { a.box(dr.lx + s * (dr.cw / 2 + 0.7), 1.7, z0 + 0.2, 0.22, 0.34, 0.22, 'marble_light', 0xffb050, { glow: 1.3 }); a.box(dr.lx + s * (dr.cw / 2 + 0.7), 2.04, z0 + 0.2, 0.3, 0.06, 0.3, 'gunmetal', 0x30343a); } };   // a lantern each side of the door
/* the Rental Hut: the log building in red, a serving hatch with its shelf and a snow awning (the rack of boards by the door is the catalogue's `surfboard_rack`, put in build) */
const rental = (a, w, d, dr, ctx) => { const { WD, WD2 } = ctx, h = 3.5, z0 = d / 2, hx = dr.lx + 4.4;
    chalet(a, w, d, dr, { h, rh: 2.8, tint: 0x9c4a3c, wins: false }, ctx);
    a.box(hx, 1.15, z0 + 0.08, 3.0, 1.3, 0.06, 'marble_light', PANE, { glow: 1.0 }); for (const s of [-1, 1]) a.box(hx + s * 1.56, 1.05, z0 + 0.12, 0.14, 1.55, 0.14, WD2, DARK, { gain: 1.5 }); a.box(hx, 2.45, z0 + 0.12, 3.3, 0.14, 0.14, WD2, DARK, { gain: 1.5 });
    a.box(hx, 1.0, z0 + 0.36, 3.4, 0.1, 0.62, WD2, 0x7a583c, { gain: 1.5 }); a.box(hx, 1.1, z0 + 0.4, 3.4, 0.05, 0.5, 'ice', SNOW); a.roof('shed', hx, 2.62, z0 + 0.62, 3.8, 0.42, 1.2, 'ice', SNOW);
    board(a, 'RENTALS', 0, h + 0.2, z0 + 0.12, 3.6, 0.78, '#f4ecd8', '#2f4a3a', WD2, { roof: true });
    a.box(dr.lx + dr.cw / 2 + 0.6, 1.7, z0 + 0.2, 0.2, 0.3, 0.2, 'marble_light', 0xffb050, { glow: 1.3 }); };
/* the Top Station: the log building in slate blue, where the lift lets you off */
const topStation = (a, w, d, dr, ctx) => { const { WD2 } = ctx, h = 3.5;
    chalet(a, w, d, dr, { h, rh: 2.6, tint: 0x5f7488 }, ctx);
    board(a, 'TOP STATION', 0, h + 0.2, d / 2 + 0.12, 5.2, 0.78, '#f4ecd8', '#2f4a3a', WD2, { roof: true });
    a.box(dr.lx + dr.cw / 2 + 0.6, 1.7, d / 2 + 0.2, 0.2, 0.3, 0.2, 'marble_light', 0xffb050, { glow: 1.3 }); };
/* THE LIFT's pieces. A tower is a gantry: two legs 17.5 m apart, each on the middle of a square, so the Big Jump's run passes clean between them (the first
   delivery's single posts stood on the jump's own line, one of them in the kicker's run-up). Parts frame: the lift line's middle, x across it. */
const tower = (a, M, n) => {
    for (const s of [-1, 1]) { a.box(s * 8.75, 0, 0, 1.3, 0.45, 1.3, 'urban:ConcreteWoodFormed1a', 0xb0b0b0); a.box(s * 8.75, 0.45, 0, 0.6, HC + 0.75, 0.6, M, STEEL); a.box(s * 8.75, 0.45, 0, 0.86, 1.7, 0.86, WDPAD, PAD, { gain: 2.2 });
        a.box(s * (8.75 - 1.2), HC - 0.5, 0, 2.0, 0.3, 0.3, M, STEEL); a.box(s * 8.75, HC + 1.2, 0, 0.8, 0.1, 0.8, 'ice', SNOW); }
    a.box(0, HC + 0.7, 0, 18.1, 0.5, 0.5, M, STEEL); a.box(0, HC + 1.2, 0, 18.1, 0.09, 0.56, 'ice', SNOW);
    for (const s of [-1, 1]) { a.box(s * 2.2, HC + 0.22, 0, 0.18, 0.5, 0.18, M, STEEL); a.box(s * 2.2, HC + 0.1, 0, 0.16, 0.14, 2.2, M, 0x3a3e44); for (const k of [-0.9, -0.3, 0.3, 0.9]) a.box(s * 2.2, HC - 0.02, k, 0.1, 0.3, 0.3, 'gunmetal', 0x22252a); }   // the sheave train the cable runs under
    a.sign(String(n), -8.75, 2.5, 0.32, 0.5, 0.5, '#f4ecd8', '#2f4a3a', FONT); };
/* a station's end of the line: the bullwheel the cable turns round, under a machine housing on two columns (dir: +1 = the housing reaches south of the wheel) */
const wheelhouse = (a, M, dir) => {
    for (const s of [-1, 1]) { a.box(s * 5.25, 0, 0, 1.4, 0.45, 1.4, 'urban:ConcreteWoodFormed1a', 0xb0b0b0); a.box(s * 5.25, 0.45, 0, 0.75, HC + 0.5, 0.75, M, STEEL); a.box(s * 5.25, 0.45, 0, 1.0, 1.7, 1.0, WDPAD, PAD, { gain: 2.2 }); }
    a.box(0, HC + 0.5, 0, 11.3, 0.5, 0.7, M, STEEL);
    a.cyl(0, HC - 0.14, 0, 2.2, 0.26, M, 0x2c3036, { seg: 24 }); a.cyl(0, HC - 0.3, 0, 0.4, 0.8, M, 0x3a3e44, { seg: 10 });
    a.box(0, HC + 0.5, dir * 1.2, 5.2, 1.6, 6.6, M, 0xb03a30, { gain: 1.6 }); a.box(0, HC + 2.1, dir * 1.2, 5.4, 0.14, 6.8, 'ice', SNOW);
    a.box(0, HC + 0.9, dir * 1.2 + 3.32, 3.6, 0.7, 0.06, 'marble_light', PANE, { glow: 0.9 }); a.box(0, HC + 0.9, dir * 1.2 - 3.32, 3.6, 0.7, 0.06, 'marble_light', PANE, { glow: 0.9 }); };
/* a chair: a grip on the cable, a hanger, two seats' width of slats and a back (dz: +1 = it faces south, downhill) */
const chair = (a, x, z, dz, WD2) => { const M = 'gunmetal', T = 0x30343a, W = { gain: 1.6 };
    a.box(x, HC - 0.3, z, 0.24, 0.5, 0.3, M, T); a.box(x, HC - 2.6, z, 0.08, 2.35, 0.08, M, T); a.box(x, HC - 2.64, z, 2.0, 0.08, 0.08, M, T);
    for (const s of [-1, 1]) { a.box(x + s * 0.98, HC - 3.5, z - dz * 0.1, 0.06, 0.9, 0.06, M, T); a.box(x + s * 0.98, HC - 3.5, z + dz * 0.12, 0.06, 0.07, 0.5, M, T); }
    a.box(x, HC - 3.48, z + dz * 0.14, 1.9, 0.07, 0.52, WD2, 0x9a7048, W); a.box(x, HC - 3.4, z - dz * 0.14, 1.9, 0.62, 0.06, WD2, 0x9a7048, W);
    a.box(x, HC - 3.9, z + dz * 0.62, 1.9, 0.05, 0.05, M, T); for (const s of [-1, 1]) a.box(x + s * 0.7, HC - 3.9, z + dz * 0.5, 0.05, 0.45, 0.05, M, T); };
/* the snow's height at a square corner (cx, cy), in metres over the room's floor: the tool's own grade (bake-mountains.js heights(), `base`), read here
   only to hang a thing at a height (a prop's `y` from 1 m up is measured from the room's floor, not from the ground under it) */
const groundOf = ctx => { const o = ctx.o, N = ctx.N, by = {}, cl = (v, m) => Math.max(0, Math.min(m, v)); ctx.plots.forEach(p => { by[p.lx + ':' + p.ly] = p; });
    const lv = (i, j) => { i = cl(i, o.pw - 1); j = cl(j, o.ph - 1); const p = by[i + ':' + j]; return ((p ? p.level : o.deadLevel(i, j)) - o.base) * 1.75; };
    const prof = (i, pz) => { const f = o.zflat ? o.zflat(i) : 1 / 3, qz = pz - 0.5, j = cl(Math.floor(qz), o.ph - 2), v = Math.min(1, Math.max(0, (qz - j - f / 2) / (1 - f))); return lv(i, j) * (1 - v) + lv(i, j + 1) * v; };
    return (cx, cy) => { const px = cx / N - 0.5, i = cl(Math.floor(px), o.pw - 2), u = Math.min(1, Math.max(0, (px - i - 1 / 6) / (2 / 3))); return prof(i, cy / N) * (1 - u) + prof(i + 1, cy / N) * u; }; };
const WDPAD = 'marble_light';   // the padding round a tower's foot (a plain sheet under the orange)

exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* THE SKI LODGE (walked into): the great room, the fire, the bar */
  const LODGE = building('lodge', 'P08-03', [2, 2, 10, 8, 'S'], 5.25, { leafDouble: true }, (a, w, d, dr) => lodge(a, w, d, dr, ctx));
  { const q = S('P08-03', 6, 8), g = groundOf(ctx)(q[0], q[1]); LODGE.put('chimney_smoke', 9.5, -LODGE.fd / 2 - 0.45, { y: r2(g + 5.25 + 6.2 * (1 - 9.5 / (LODGE.fw / 2 + 1.2)) + 2.25) }); }   // the stack smokes (y = its top over the room's floor)
  LODGE.put('campfire', 9.5, -8.4); LODGE.put('chesterfield_sofa', 9.5, -4.6, { face: 0 }); LODGE.put('wingback_chair', 6.2, -6.4, { face: 60 }); LODGE.put('wingback_chair', 12.6, -6.4, { face: 300 }); LODGE.put('rug_round', 9.5, -6.2, { y: 0.17 });
  LODGE.put('coffee_table', 9.5, -6.0); LODGE.put('xmas_cocoa', 9.5, -6.0, { y: 0.5 }); LODGE.put('mobius_bar', -10.5, -7.2, { face: 90 }); for (const z of [-9, -7.4, -5.8, -4.2]) LODGE.put('bar_stool', -8.6, z);
  for (const q of [[-3, -5], [2, -1.5], [-5, 2.5]]) { LODGE.put('round_table', q[0], q[1]); LODGE.put('psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); LODGE.put('psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); LODGE.put('coffee_mug', q[0], q[1], { y: 0.78 }); }
  LODGE.put('jukebox', -12.8, 2, { face: 90 }); LODGE.put('arcade_cabinet', -12.8, 4.4, { face: 90 }); LODGE.put('air_hockey_table', 8, 4); LODGE.put('trophy_case', 13.2, 1, { face: 270 }); LODGE.put('locker_bench', 4, 8.6, { face: 180 });
  LODGE.put('notice_board', -5, 9.9, { y: 1.5, face: 0 }); LODGE.put('psx_sofa_3', 1, -8.8, { face: 180 }); LODGE.put('xmas_tree', -2.5, 7.2, { h: 3.4, floor: true });
  /* THE RENTAL HUT: boards on the wall, a counter */
  const RENT = building('rental', 'P07-03', [4, 4, 8, 7, 'S'], 3.5, {}, (a, w, d, dr) => rental(a, w, d, dr, ctx));
  RENT.put('form_counter', 0, -1.5, { face: 180 }); for (const x of [-4.6, -2.3, 2.3, 4.6]) RENT.put('skateboard', x, -4.7, { y: 1.1, face: 180 }); RENT.put('locker', -6, 2.5, { face: 90 }); RENT.put('locker', -6, 1.2, { face: 90 });
  RENT.put('locker_bench', 4.5, 2.6, { face: 0 }); RENT.put('price_tag', 0.8, -1.5, { y: 1.05 });
  /* THE TOP STATION, where the chairlift lets you off and every run starts */
  const TOP = building('topstation', 'P08-00', [4, 3, 8, 7, 'S'], 3.5, { leaf: 'leaf_frame_only' }, (a, w, d, dr) => topStation(a, w, d, dr, ctx));
  TOP.put('locker_bench', -4.5, -5.5, { face: 0 }); TOP.put('locker_bench', 4.5, -5.5, { face: 0 }); TOP.put('notice_board', 0, -6.85, { y: 1.5, face: 180 }); TOP.put('railway_lantern', 5.6, 5.2);
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── THE SKI LODGE + SLOPES: five runs (the Black Run, the Big Jump, the Slalom, the Half-Pipe, the Bunny Slope), groomed ice you ride down on the board ── */
  const SP = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'];
  for (const id of ['P07-00', 'P07-01', 'P07-02']) for (let ly = 1; ly < N; ly += 3) { tree(id, SP[ly % 3], 6 + (ly % 2), 2, ly); tree(id, SP[(ly + 1) % 3], 6.5, 9, ly + 1 < N ? ly + 1 : ly); }   // THE BLACK RUN: trees both sides
  { const q = S('P08-01', 4, 5); feat({ k: 'ramp', x0: gx(q[0] + 2), z0: gz(q[1]), x1: gx(q[0] + 2), z1: gz(q[1] + 2), w: 14, h0: 0, h1: 2.4, edge: 0.3 }); }                                                   // THE BIG JUMP: the kicker (you come down onto it; it throws you over the landing)
  put('P08-01', 'signpost', 2, 3, { face: 180 });
  { const p = R.byId['P09-01']; [[4, 1], [7, 3], [4, 5], [7, 7], [4, 9]].forEach(([lx, ly], i) => look('gate' + i, mx(p.lx * N + lx), mz(p.ly * N + ly), a => { for (const s of [-1, 1]) { a.cyl(s * 1.5, 0, 0, 0.06, 1.9, null, i % 2 ? 0xd03030 : 0x3050d0, { seg: 6 }); a.box(s * 1.5 + 0.3, 1.35, 0, 0.6, 0.5, 0.03, null, i % 2 ? 0xd03030 : 0x3050d0); } })); }   // THE SLALOM: five gates
  /* THE HALF-PIPE (pass 1): two snow walls run down the hill either side of a floor two squares wide. Each wall is ONE ramp row laid along the fall line
     (h0 = h1, so it lies on the slope) whose `edge` rounds both flanks over 7 m: a curved way up, a rounded top 3.5 m wide, a back you roll down again.
     (The first delivery's banks were straight wedges across the hill, in steps: the board flew off their tops and out of the district.) The wall rises
     over the pipe's first 7 m and sinks over its last, and breaks where the plot's grade does (row 6). */
  { const p = R.byId['P09-00'], HP = 3.3, Z = [0, 2, 6, 9.5, 11.5], Hs = [0, HP, HP, HP, 0];
    for (const xc of [gx(p.lx * N + 2.5), gx(p.lx * N + 9.5)]) for (let i = 0; i < 4; i++) feat({ k: 'ramp', x0: xc, z0: gz(p.ly * N + Z[i]), x1: xc, z1: gz(p.ly * N + Z[i + 1]), w: 17.5, h0: Hs[i], h1: Hs[i + 1], edge: 7 }); }
  { const p = R.byId['P08-02'], x = gx(p.lx * N + 6);   // THE CHAIRLIFT's line: two pipe rails and two boxes under the chairs
    feat({ k: 'rail', x0: r2(x - 5.25), z0: gz(p.ly * N + 3), x1: r2(x - 5.25), z1: gz(p.ly * N + 8), model: 'pipe', block: false }); feat({ k: 'rail', x0: r2(x + 5.25), z0: gz(p.ly * N + 4), x1: r2(x + 5.25), z1: gz(p.ly * N + 9), model: 'pipe', block: false });
    put('P08-02', 'riser_1', 2, 9, { face: 0 }); put('P08-02', 'riser_1', 9, 2, { face: 0 }); }
  /* THE LIFT (pass 1): the line runs up the middle of the slopes, over the Big Jump, as the plan draws it. Two bullwheels (one above the Lodge, one below the
     Top Station), four gantry towers between them, two cables, a chair every 10.5 m. A leg stands on the middle of a square and stops the walker (a ghost
     wall); everything else is over head height. The cables and the chairs are ONE `hug` row: each corner takes the ground under it, so a cable spans
     straight from tower to tower down the hill and a chair hangs level with it. Nothing moves yet: see the header (a question for mondo). */
  { const top = S('P08-00', 6, 8), bot = S('P08-03', 6, 0), x = gx(top[0]), M = U('MetalWallRibbed1a'), zT = gz(top[1] + 1), zB = gz(bot[1] + 0.5), TW = [12, 19, 26, 33].map(r => top[1] - 8 + r);
    const leg = (sx, sy) => { if (!R.open(sx, sy) || R.taken.has(sx + ':' + sy)) throw new Error('K: a lift leg on a taken square ' + sx + ',' + sy); R.taken.add(sx + ':' + sy); feat({ k: 'wall', x0: r2(mx(sx) - 0.4), z0: mz(sy), x1: r2(mx(sx) + 0.4), z1: mz(sy), t: 0.9, h: 3, ghost: true, rail: false }); };
    TW.forEach((sy, i) => { look('lift' + i, x, mz(sy), a => tower(a, M, i + 1)); leg(top[0] - 3, sy); leg(top[0] + 2, sy); });
    look('liftTop', x, zT, a => wheelhouse(a, M, -1)); leg(top[0] - 2, top[1] + 1); leg(top[0] + 1, top[1] + 1);
    look('liftBottom', x, zB, a => wheelhouse(a, M, 1)); leg(bot[0] - 2, bot[1]); leg(bot[0] + 1, bot[1]);
    const nodes = [zT].concat(TW.map(sy => mz(sy)), [zB]), kz0 = gz(S('P08-01', 0, 4)[1]), kz1 = gz(S('P08-01', 0, 8)[1]);
    look('liftLine', x, zT, a => { for (const s of [-1, 1]) { for (let i = 0; i + 1 < nodes.length; i++) a.box(s * 2.2, HC - 0.04, (nodes[i] + nodes[i + 1]) / 2 - zT, 0.07, 0.07, nodes[i + 1] - nodes[i], 'gunmetal', 0x22252a);
            for (let z = zT + (s > 0 ? 4 : 9.25); z < zB - 2; z += 10.5) if (z < kz0 || z > kz1) chair(a, s * 2.2, z - zT, -s, WD2); } });   // (east side climbs, its chairs face up the hill; no chair over the kicker, where the ground under it is the ramp)
    R.ARCH[R.ARCH.length - 1].hug = true;
    R.doors.push(Object.assign({ id: 'lift_top', wall: 'free', x: r2(x + 3.5), z: gz(top[1]), face: 180, leaf: 'leaf_frame_only', action: { room: R.o.id, at: 'lift_bottom' } }, DOORWORDS('THE CHAIRLIFT', 'DOWN TO THE SKI LODGE', 'The chair comes round the wheel and does not stop. You sit down at the right moment or you do not.')));
    R.doors.push(Object.assign({ id: 'lift_bottom', wall: 'free', x: r2(x + 3.5), z: gz(bot[1] + 1), face: 0, leaf: 'leaf_frame_only', action: { room: R.o.id, at: 'lift_top' } }, DOORWORDS('THE CHAIRLIFT', 'UP TO THE TOP STATION', 'The lift line goes up the middle of the slopes. Every run starts where it ends.')));
    R.taken.add(top[0] + 1 + ':' + top[1]); R.taken.add(bot[0] + 1 + ':' + (bot[1] + 1)); }
  put('P09-02', 'xmas_snowman_2', 1, 6); dec('P09-02', 'traffic_cone', 1, 3); dec('P09-02', 'traffic_cone', 10, 3); dec('P09-02', 'traffic_cone', 10, 8);
  put('P09-03', 'signpost', 4, 4, { face: 180 }); put('P09-03', 'park_bench', 2, 3, { face: 180 }); put('P09-03', 'park_bench', 8, 3, { face: 180 }); put('P09-03', 'xmas_tree_plain', 9, 7, { h: 4.4, floor: true }); put('P09-03', 'sleigh', 2, 8, { face: 90 });
  put('P07-03', 'surfboard_rack', 4, 7, { face: 180 }); put('P08-03', 'ticket_booth', 8, 1, { face: 180 }); dec('P08-03', 'rope_stanchion', 9, 1); dec('P08-03', 'rope_stanchion', 9, 0);   // (THE MODEL LIST FIRST, 11-16: the board rack and the lift's ticket booth are the game's own pieces)
  put('P07-03', 'xmas_snowman', 2, 9); put('P08-03', 'campfire', 5, 10); put('P08-03', 'park_bench', 3, 10, { face: 0 }); put('P08-03', 'park_bench', 7, 10, { face: 0 }); put('P07-02', 'signpost', 9, 9, { face: 90 });
};
