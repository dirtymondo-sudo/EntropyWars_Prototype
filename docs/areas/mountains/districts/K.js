/* THE MOUNTAINS · THE SKI LODGE + SLOPES (district K, 12 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P07-00 The Black Run, top (18)          P08-00 The Top Station (18)             P09-00 The Half-Pipe (17)
     P07-01 The Black Run (15)               P08-01 The Big Jump (14)                P09-01 The Slalom (14)
     P07-02 The Run-Out (11)                 P08-02 The Chairlift (11)               P09-02 The Bunny Slope (11)
     P07-03 The Rental Hut (8)               P08-03 The Ski Lodge (8)                P09-03 The Lodge Yard (8)

   WHAT STANDS HERE TODAY (passes 1 + 2 of 5: exteriors, insides; 11-16; seen on screen)
   - Walked into: THE SKI LODGE (P08-03), THE RENTAL HUT (P07-03), THE TOP STATION (P08-00). Their look is this file's `chalet` (log walls with crossed
     log ends, stone foot, snow roof with deep eaves, lit windows, drifts, icicles): the Lodge adds a glazed gable, a porch with a rail, a gabled way in on
     stone piers and a smoking stone stack; the Rental Hut a serving hatch and the catalogue's `surfboard_rack`; boards in the district's one face (`alfa`).
     THE INSIDES (pass 2): every room is lined and lit (`lit`: glowing board walls, a dado, tie beams, skirting; `night`: the dark in each window), every prop
     `floor: true`, every blocker on a square's middle. The Lodge (8 x 6 squares): the great stone hearth with the catalogue's flame, sofa and chairs, a built bar
     with a back bar of bottles, four tables, the boot room behind a low screen, the games corner, three wheel lamps. The Rental Hut: a counter, the stock on the
     back wall (the game's surfboards), tools, lockers. The Top Station: the lift man's desk, radio and gauges, a stove, a bed for the hurt, benches.
   - Five runs on the tool's slope sheet (one even grade, the board rolls them): the Black Run through the trees (P07-00..02), the Big Jump's kicker (P08-01, a `ramp`),
     the Slalom's five gates (P09-01), the Half-Pipe (P09-00: two rounded snow walls 3.3 m high, see build), the Bunny Slope (P09-02)
   - THE CHAIRLIFT: a bullwheel house at each end, four gantry towers whose legs stand clear of the Big Jump's run, two cables, 16 chairs (one `hug` row),
     the catalogue's `ticket_booth` at the bottom, two grind rails under the line, a door pair `lift_bottom` / `lift_top` (same room) that carries you
   - The Lodge Yard (P09-03) is the room's spawn (the tool's)

   RIDDEN ON THE BOARD (the probe, 11-16: W held from the top of each run)
   - Black Run, Big Jump line, Half-Pipe floor + Slalom + Bunny Slope: clean top to bottom in about 11 s at the board's top speed, no snag. The kicker throws
     the rider about 2 m clear. Each run ENDS on a wall: the Black Run on the back of the Rental Hut, the Big Jump's line on the back of the Lodge (pass 3: nets, SLOW boards)

   KNOWN MISSING OR WRONG
   - Nothing rides the cable: the chairs hang still. Chairs that move, or a chair the player rides, would be a new mechanic: LISTED for mondo, not built
   - Run markers / fences / signs / racks (pass 3), night lights + the night look (pass 4)
   - No encounter table, nobody lives or works here (no one at the bar or the rental counter)
   - The lift's two doors are the plain concrete frame (`leaf_frame_only`): they stay until mondo rules on the lift

   FOUND IN THE MODEL LIST (THE MODEL LIST FIRST, mondo 11-16; all are catalogue rows on R2 today, none placed before this thread)
   - used in pass 1: `surfboard_rack` (the Rental Hut's boards), `ticket_booth`, `rope_stanchion`, `chimney_smoke`
   - used in pass 2: `scarf_rack`, `key_rack`, `brochure_rack`, `map_table`, `pinball_machine`, `claw_machine`, `arms_trophy`, `painting_landscape` / `_seascape`, `psx_armchair_1`,
     `psx_dinner_table_1`, `psx_chair_mp_3`, `psx_coffee_table_1`, `psx_carpet_mp_1`, `psx_glass_bottle_1/2`, `xmas_champagne`, `espresso_machine`, `coffee_maker`, `stock_pots`,
     `chess_set_game`, `footlocker`, `surfboard_short/long/fish`, `sunglasses_spinner`, `tool_chest`, `tool_pegboard`, `radio_console`, `field_radio`, `gauge_board`,
     `breaker_panel`, `punch_clock`, `rotary_phone`, `item_binoculars`, `psx_walkie_talkie_1`, `hospital_bed`, `fire_extinguisher`, `hearth_fire`
   - TOO HEAVY to place (a 2 MB Meshy file each, 100,000+ triangles): `coffee_mug`, `coffee_table`, `mini_fridge`, `hook_rail_long`, `potted_plant`
   - the first list for pass 2 was: `scarf_rack`, `key_rack`, `brochure_rack`, `map_table`, `pinball_machine`, `arms_trophy` (over the fire), `psx_armchair_*`, `psx_sofa_*`,
     `stock_pots`, `pot_rack`, `psx_glass_bottle_*`, `radio_console` / `field_radio` (the lift man's desk), `hospital_bed` + `fire_extinguisher` (first aid), `hearth_fire`
   - for pass 3 (dressing): `hw_fence` (run edges), `item_police_barricade`, `traffic_barrel`, `pa_speaker` (on the towers), `turnstile` / `metro_gate` (the lift's gate),
     `telescope` (the Top Station's view), `psx_wooden_crate_*`, `psx_metal_barrel_mp_*`, `wrapped_pallet`, `hand_truck`, `quarter_pipe` + `riser_*`, `wolf`, `dog`, `eagle`, `rabbit`, `crow`
   - for pass 4 (night): `flood_mast` (a real night light, 26 m: night skiing), `festoon` (string lights), `brazier`, `meshy_hanging_lantern`, `railway_lantern`
   - looked at and not used: the Christmas pack's six `Snow*` nodes and its `Christmas_star` / `Ribbon` have no row (the snow caps of the pack's own house and
     trees, not loose drifts); `woods_cabin` / `xmas_house` are single house props (buildings are built); `decor_ferris_gondola` stood in for chairs and is gone

   NEEDS A MODEL (no file in MODEL_LIST.md or on R2; nothing stands in for them)
   - skis and poles (a rack of them), a snowboard, ski boots, a snow gun, a piste groomer, a snowmobile, a rescue sled, orange safety netting, an elk head for the Lodge wall,
     a pool table, a dartboard, beer taps and glasses, a wood stove, a firewood stack, a lamp post, lit string lights, a trail-map board (the full read of the lists, 11-16)

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
/* ── THE INSIDES (pass 2, 11-16; the pilot's findings, THE ZONE KIT point 2). A building's own inside takes no light: `lit` lines the walls and the ceiling
   a hand inside with thin boxes that glow; every prop inside is `floor: true`; a thing that blocks stands on the middle of a 3.5 m square. ── */
const lit = (a, w, h, d, dr, key, tint, g, WD2) => { const top = h - 0.36, i = 0.3, t = 0.04, q = { glow: g, gain: 1.7 }, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2, e = w / 2 - i;
    a.box(0, 0, -(d / 2 - i), w - 2 * i, top, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - i), 0, 0, t, top, d - 2 * i, key, tint, q);
    a.box((-e + x0) / 2, 0, d / 2 - i, x0 + e, top, t, key, tint, q); a.box((x1 + e) / 2, 0, d / 2 - i, e - x1, top, t, key, tint, q); a.box(dr.lx, 2.2, d / 2 - i, dr.cw, top - 2.2, t, key, tint, q);
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, WD2, 0x8a6a48, { sides: false, top: false, under: true, glow: g * 0.75, gain: 1.6 });
    for (let z = -d / 2 + 3.5; z < d / 2 - 1; z += 3.5) a.box(0, top - 0.5, z, w - 2 * i, 0.4, 0.34, WD2, 0x6a4a34, { glow: 0.7, gain: 1.5 });                       // the tie beams under the ceiling
    { const D = { glow: 0.8, gain: 1.6 }, T2 = 0x9a7450, y = 0.16, hh = 0.95, e = i + 0.03, xe = w / 2 - e; a.box(0, y, -(d / 2 - e), w - 2 * e, hh, 0.03, WD2, T2, D); for (const s of [-1, 1]) a.box(s * xe, y, 0, 0.03, hh, d - 2 * e, WD2, T2, D);   // a dado of darker boards under a rail
      a.box((-xe + x0) / 2, y, d / 2 - e, x0 + xe, hh, 0.03, WD2, T2, D); a.box((x1 + xe) / 2, y, d / 2 - e, xe - x1, hh, 0.03, WD2, T2, D);
      a.box(0, y + hh, -(d / 2 - e), w - 2 * e, 0.07, 0.07, WD2, 0x4a3626, D); for (const s of [-1, 1]) a.box(s * xe, y + hh, 0, 0.07, 0.07, d - 2 * e, WD2, 0x4a3626, D); }
    a.box(0, 0.16, -(d / 2 - i - 0.05), w - 2 * i, 0.22, 0.06, WD2, 0x5a4030, { glow: 0.7, gain: 1.5 }); for (const s of [-1, 1]) a.box(s * (w / 2 - i - 0.05), 0.16, 0, 0.06, 0.22, d - 2 * i, WD2, 0x5a4030, { glow: 0.7, gain: 1.5 }); };   // the skirting
/* a window seen from inside: the night in the glass, a timber frame and cross, a sill (ew: on a side wall) */
const night = (a, x, y, z, w, h, ew, WD2) => { const o = z < 0 ? 1 : -1, G = { glow: 0.75, gain: 1.5 }, B = (px, py, pz, bw, bh, bd, key, tint, g) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, g) : a.box(px, py, pz, bw, bh, bd, key, tint, g);
    B(x, y, z, w, h, 0.06, 'marble_light', 0x24344c, { glow: 0.5 }); B(x, y, z + o * 0.04, 0.07, h, 0.06, WD2, 0x5a4030, G); B(x, y + h / 2 - 0.035, z + o * 0.04, w, 0.07, 0.06, WD2, 0x5a4030, G);
    for (const s of [-1, 1]) B(x + s * (w / 2 + 0.05), y - 0.05, z + o * 0.04, 0.12, h + 0.17, 0.08, WD2, 0x5a4030, G); B(x, y - 0.12, z + o * 0.07, w + 0.36, 0.12, 0.18, WD2, 0x5a4030, G); B(x, y + h, z + o * 0.04, w + 0.24, 0.12, 0.08, WD2, 0x5a4030, G); };
/* a pendant lamp: a rod from the ceiling, a dark shade, a lit bulb under it */
const pendant = (a, x, top, z, drop) => { a.box(x, top - drop, z, 0.03, drop, 0.03, 'gunmetal', 0x2a2a2a); a.cyl(x, top - drop - 0.2, z, 0.26, 0.2, 'gunmetal', 0x30343a, { seg: 10, r2: 0.08 }); a.cyl(x, top - drop - 0.32, z, 0.12, 0.14, 'marble_light', 0xffb050, { seg: 8, glow: 1.3 }); };
/* a wheel of lamps hung on chains from the ceiling (the Lodge's great room) */
const wheelLamp = (a, x, top, z, r) => { for (const q of [[1, 0], [-1, 0], [0, 1], [0, -1]]) a.box(x + q[0] * r * 0.8, top - 1.3, z + q[1] * r * 0.8, 0.03, 1.3, 0.03, 'gunmetal', 0x2a2a2a);
    a.cyl(x, top - 1.42, z, r, 0.12, 'gunmetal', 0x3a2a20, { seg: 16, ri: r - 0.16, glow: 0.5 }); for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; a.cyl(x + Math.cos(t) * (r - 0.08), top - 1.3, z + Math.sin(t) * (r - 0.08), 0.06, 0.22, 'marble_light', 0xffc070, { seg: 6, glow: 1.4 }); } };
/* a counter along x on a row of squares' middles: a boarded body, a dark top, a foot rail (its ghost wall is the caller's) */
const counter = (a, x, z, len, WD2, o) => { o = o || {}; const hh = o.h || 1.1, dp = o.depth || 0.9; a.box(x, 0.16, z, len, hh - 0.16, dp, WD2, o.tint || 0x8a6444, { glow: 0.75, gain: 1.5 }); a.box(x, hh, z, len + 0.16, 0.08, dp + 0.2, WD2, 0x3a2a20, { glow: 0.8, gain: 1.6 });
    if (o.rail) a.box(x, 0.36, z + dp / 2 + 0.12, len - 0.2, 0.05, 0.05, 'gold', 0xffffff, { gain: 1.5, glow: 0.6 }); };
/* THE LOG BUILDING of this district (the Lodge, the Rental Hut, the Top Station): a stone foot, log walls with crossed log ends at the corners, a snow
   roof with deep eaves whose gable faces the front, lit windows on every wall, a stone chimney, drifts against the walls. (ctx.cabin is the first
   delivery's and still the Warming Hut's, district P; this district draws its own.) q: h, rh, tint, chimney (its x along the back wall), wins (false = none in front) */
const chalet = (a, w, d, dr, q, ctx) => { const { WD, WD2, FLR } = ctx, h = q.h, T = q.tint || LOGC, ov = 1.2;
    a.shell(w, h, d, WD, T, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; });
    a.box(0, 0, 0, w + 0.5, 1.0, d + 0.5, 'rocks_5', STONE, { faces: 'blr', top: false });
    { const x0 = dr.lx - dr.cw / 2 - 0.3, x1 = dr.lx + dr.cw / 2 + 0.3, e = w / 2 + 0.25; a.box((x0 - e) / 2, 0, d / 2 + 0.13, x0 + e, 1.0, 0.24, 'rocks_5', STONE); a.box((x1 + e) / 2, 0, d / 2 + 0.13, e - x1, 1.0, 0.24, 'rocks_5', STONE); }
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x9c8468, { uv: [1.75, 1.75], glow: 0.7 }); lit(a, w, h, d, dr, WD, q.wall || 0xd8b088, 0.85, WD2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { a.box(sx * w / 2, 1.0, sz * d / 2, 0.44, h - 1.0, 0.44, WD2, 0x6a4a34, { gain: 1.5 });   // the corner post + the crossed log ends
        for (let y = 1.15, i = 0; y < h - 0.3; y += 0.5, i++) { if (i % 2) a.box(sx * (w / 2 + 0.3), y, sz * d / 2, 0.5, 0.3, 0.3, WD2, 0x7a583c, { gain: 1.5 }); else a.box(sx * w / 2, y, sz * (d / 2 + 0.3), 0.3, 0.3, 0.5, WD2, 0x7a583c, { gain: 1.5 }); } }
    a.roof('gable', 0, h, 0, d + 0.1, q.rh, w, 'ice', SNOW, { ry: 90, over: ov, keyEnd: WD, tintEnd: T, keyUnder: WD2, gain: 1.9 });
    for (const s of [-1, 1]) a.box(s * (w / 2 + ov), h - 0.2, 0, 0.16, 0.26, d + 2 * ov + 0.1, WD2, DARK, { roof: true, gain: 1.5 });          // the eave boards
    a.box(0, h + q.rh - 0.05, 0, 0.26, 0.2, d + 2 * ov + 0.3, WD2, DARK, { roof: true, gain: 1.5 });                                            // the ridge log
    a.box(0, h - 0.24, 0, w + 0.16, 0.24, d + 0.16, WD2, DARK, { top: false, gain: 1.5 });                                                       // the wall plate under the roof
    for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.12), 0, d / 2 + 0.12, 0.24, 2.4, 0.24, WD2, DARK, { gain: 1.5 }); a.box(dr.lx, 2.25, d / 2 + 0.12, dr.cw + 0.6, 0.24, 0.24, WD2, DARK, { gain: 1.5 });
    const wy = 1.15, wh = Math.min(1.7, h - 2.1);
    const skip = (q.noWin || []);   // squares' windows left out, as 'f2' / 'b0' / 'l1' / 'r3' (a wall a thing stands against inside)
    for (let x = -w / 2 + 1.75, i = 0; x < w / 2; x += 3.5, i++) if (q.wins !== false && Math.abs(x - dr.lx) > 2.0 && skip.indexOf('f' + i) < 0) { win(a, x, wy, d / 2 + 0.08, 1.5, wh, false, WD2); night(a, x, wy, d / 2 - 0.33, 1.5, wh, false, WD2); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 1.75, j = 0; z < d / 2; z += 3.5, j++) if (skip.indexOf((s < 0 ? 'l' : 'r') + j) < 0) { win(a, z, wy, s * (w / 2 + 0.08), 1.5, wh, true, WD2); night(a, z, wy, s * (w / 2 - 0.33), 1.5, wh, true, WD2); }
    for (let x = -w / 2 + 1.75, i = 0; x < w / 2; x += 3.5, i++) if ((!q.chimney || Math.abs(x - q.chimney) > 2.4) && skip.indexOf('b' + i) < 0) { win(a, x, wy, -d / 2 - 0.08, 1.5, wh, false, WD2); night(a, x, wy, -d / 2 + 0.33, 1.5, wh, false, WD2); }
    if (q.chimney) { const cx = q.chimney, top = h + q.rh * (1 - Math.abs(cx) / (w / 2 + ov)) + 1.9;                                             // the stack climbs the back wall and stands clear of the roof
        a.box(cx, 0, -d / 2 - 0.55, 2.8, 2.6, 1.3, 'rocks_5', STONE, { gain: 1.6 }); a.box(cx, 2.6, -d / 2 - 0.45, 2.0, h - 2.6, 1.1, 'rocks_5', STONE, { gain: 1.6 }); a.box(cx, h, -d / 2 - 0.45, 2.0, top - h, 1.1, 'rocks_5', STONE, { roof: true, gain: 1.6 });
        a.box(cx, top, -d / 2 - 0.45, 2.3, 0.2, 1.4, 'rocks_5', 0x8a8a92, { roof: true }); a.box(cx, top + 0.2, -d / 2 - 0.45, 2.3, 0.12, 1.4, 'ice', SNOW, { roof: true });
    }
    a.box(0, 0, -(d / 2 + 0.55), w + 1.6, 0.36, 0.7, 'ice', SNOW); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.55), 0, 0, 0.7, 0.36, d + 0.5, 'ice', SNOW);   // drifts against the three walls without the door
    const L = i => 0.2 + 0.4 * (((i * 7919) % 13) / 13);                                                                                         // icicles along the two eaves
    for (const s of [-1, 1]) for (let i = 0, z = -d / 2 - ov + 0.2; z <= d / 2 + ov - 0.2; z += 0.5, i++) if (i % 5 !== 3) a.box(s * (w / 2 + ov - 0.06), h - L(i + (s > 0 ? 3 : 0)) - 0.2, z, 0.05, L(i + (s > 0 ? 3 : 0)), 0.05, 'ice', 0xdcecff, { roof: true, glow: 0.7 }); };
/* the Lodge: the log building + a glazed gable over the front, a porch along the whole front with a rail, a gabled way in on stone piers */
const lodge = (a, w, d, dr, ctx) => { const { WD, WD2, FLR } = ctx, h = 5.25, rh = 6.2, z0 = d / 2;
    chalet(a, w, d, dr, { h, rh, chimney: 8.75, noWin: ['b0', 'b1', 'b2', 'l4', 'l5', 'r2'] }, ctx);
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
    chalet(a, w, d, dr, { h, rh: 2.8, tint: 0x9c4a3c, wins: false, noWin: ['b0', 'b1', 'b2', 'b3', 'l0'] }, ctx);
    a.box(hx, 1.15, z0 + 0.08, 3.0, 1.3, 0.06, 'marble_light', PANE, { glow: 1.0 }); for (const s of [-1, 1]) a.box(hx + s * 1.56, 1.05, z0 + 0.12, 0.14, 1.55, 0.14, WD2, DARK, { gain: 1.5 }); a.box(hx, 2.45, z0 + 0.12, 3.3, 0.14, 0.14, WD2, DARK, { gain: 1.5 });
    a.box(hx, 1.0, z0 + 0.36, 3.4, 0.1, 0.62, WD2, 0x7a583c, { gain: 1.5 }); a.box(hx, 1.1, z0 + 0.4, 3.4, 0.05, 0.5, 'ice', SNOW); a.roof('shed', hx, 2.62, z0 + 0.62, 3.8, 0.42, 1.2, 'ice', SNOW);
    board(a, 'RENTALS', 0, h + 0.2, z0 + 0.12, 3.6, 0.78, '#f4ecd8', '#2f4a3a', WD2, { roof: true });
    a.box(dr.lx + dr.cw / 2 + 0.6, 1.7, z0 + 0.2, 0.2, 0.3, 0.2, 'marble_light', 0xffb050, { glow: 1.3 }); };
/* the Top Station: the log building in slate blue, where the lift lets you off */
const topStation = (a, w, d, dr, ctx) => { const { WD2 } = ctx, h = 3.5;
    chalet(a, w, d, dr, { h, rh: 2.6, tint: 0x5f7488, noWin: ['b3', 'r0', 'l1', 'l2'] }, ctx);
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
  const GR = groundOf(ctx), onFloor = B => { const p0 = B.put; B.put = (key, lx, lz, q) => p0(key, lx, lz, Object.assign({ floor: true }, q || {})); return B; };
  /* a walked-in building: its look, then its inside. `In(a, B, T)`: a = the look's own parts list (the inside's built pieces go on it), B = the building
     (B.put: a prop, `floor: true`), T = { sq(i, j): the middle of the square i from the left, j from the back wall; up(h): h over its floor, for a prop's
     `y` from 1 m (those are measured from the room's floor); solid(x0, z0, x1, z1, t, h): a ghost wall for a built piece } */
  const walkIn = (id, plot, q, h, opt, lookFn, In) => { let A = null; const B = onFloor(building(id, plot, q, h, opt, (a, w, d, dr) => { A = a; lookFn(a, w, d, dr, ctx); }));
      const s0 = S(plot, q[0], q[1]), g = GR((s0[0] + s0[0] + q[2] - q[0]) / 2, s0[1] + q[3] - q[1]), w = B.fw, d = B.fd;
      const T = { w, d, h, g, sq: (i, j) => [-w / 2 + 1.75 + 3.5 * i, -d / 2 + 1.75 + 3.5 * j], up: v => r2(g + 0.16 + v),
          solid: (x0, z0, x1, z1, t, hh) => { const p0 = B.at(x0, z0), p1 = B.at(x1, z1); feat({ k: 'wall', x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], t: t || 0.9, h: hh || 1.1, ghost: true, rail: false }); },
          on: (key, i, j, o) => { const c = T.sq(i, j); B.put(key, c[0], c[1], o); }, hang: (key, x, z, hh, face, o) => B.put(key, x, z, Object.assign({ mount: 0, y: T.up(hh), face }, o || {})) };
      In(A, B, T); return B; };

  /* THE SKI LODGE, 8 x 6 squares, the door on square (3, 5). The fire (back, square 6), the bar (back left, squares 0 to 2), the boot room (front left,
     behind a low screen), the games corner (front right), three tables between. The door's column of squares runs clear to the back wall. */
  const LODGE = walkIn('lodge', 'P08-03', [2, 2, 10, 8, 'S'], 5.25, { leafDouble: true }, lodge, (a, B, T) => { const { w, d } = T, zb = -d / 2 + 0.3, top = 5.25 - 0.46, G = { glow: 0.8 }, GW = { glow: 0.75, gain: 1.5 };
    B.put('chimney_smoke', 8.75, -d / 2 - 0.45, { y: r2(T.g + 5.25 + 6.2 * (1 - 8.75 / (w / 2 + 1.2)) + 2.25), floor: false });                    // the stack smokes
    /* the great hearth: stone piers, a stone head, the breast up to the ceiling, a raised hearthstone, a timber mantel; the fire is the catalogue's flame */
    { const cx = 8.75, zc = zb + 0.6; for (const s of [-1, 1]) a.box(cx + s * 1.45, 0.16, zc, 0.8, 1.9, 1.2, 'rocks_5', STONE, G); a.box(cx, 2.06, zc, 3.7, 0.55, 1.2, 'rocks_5', STONE, G); a.box(cx, 2.61, zb + 0.4, 2.6, top - 2.5, 0.8, 'rocks_5', STONE, G);
      a.box(cx, 0.16, zb + 0.06, 2.1, 1.9, 0.08, 'rocks_5', 0x2a2422, G); a.box(cx, 0.16, zc + 0.3, 4.2, 0.2, 2.0, 'rocks_5', 0x8a8a92, G); a.box(cx, 2.61, zc + 0.08, 4.0, 0.16, 1.4, WD2, 0x5a4030, GW);
      B.put('hearth_fire', cx, zb + 0.85, { w: 1.7, h: 1.4 }); T.solid(cx - 1.9, zc, cx + 1.9, zc, 1.3, 2); T.hang('arms_trophy', cx, zb + 0.86, 3.25, 180);
      a.box(cx - 3.0, 0.16, zb + 0.4, 1.3, 0.9, 0.6, WD2, 0x8a6444, GW); a.box(cx - 3.0, 1.06, zb + 0.4, 1.0, 0.3, 0.55, WD2, 0x7a583c, GW); }                                                            // the wood stacked beside it
    T.on('chesterfield_sofa', 6, 2, { face: 0 }); T.on('psx_coffee_table_1', 6, 1); B.put('rug_round', 8.75, -4.6, { y: 0.17, span: 3.4 }); B.put('xmas_cocoa', 8.6, -5.2, { y: T.up(0.48) }); B.put('xmas_cocoa_2', 9.0, -5.4, { y: T.up(0.48) });
    B.put('wingback_chair', 6.3, -5.0, { face: 60 }); B.put('wingback_chair', 11.4, -5.0, { face: 300 }); B.put('psx_armchair_1', 11.9, -1.2, { face: 290 }); B.put('table_lamp', 12.9, -3.2, { y: 0.02 });
    /* the bar: a counter on the middles of squares (0..2, 1), the back bar on the wall behind it, stools, three lamps over it */
    { const z = T.sq(0, 1)[1], x = -8.75, len = 10.1; counter(a, x, z, len, WD2, { rail: true }); T.solid(x - len / 2, z, x + len / 2, z, 1.0, 1.15);
      a.box(x, 0.16, zb + 0.3, 9.6, 0.95, 0.56, WD2, 0x6a4a34, GW); a.box(x, 1.11, zb + 0.3, 9.7, 0.06, 0.6, WD2, 0x3a2a20, GW); a.box(x, 1.17, zb + 0.07, 9.6, 2.1, 0.06, 'marble_light', 0xffc890, { glow: 0.9 });
      for (const y of [1.75, 2.35, 2.95]) a.box(x, y, zb + 0.2, 9.6, 0.05, 0.32, WD2, 0x3a2a20, GW); for (const s of [-1, 0, 1]) a.box(x + s * 4.8, 1.17, zb + 0.2, 0.1, 2.2, 0.36, WD2, 0x3a2a20, GW); a.box(x, 3.3, zb + 0.22, 9.9, 0.2, 0.44, WD2, 0x3a2a20, GW);
      const BOT = ['psx_glass_bottle_1', 'psx_glass_bottle_2', 'xmas_champagne']; for (let i = 0; i < 14; i++) B.put(BOT[i % 3], r2(x - 4.3 + i * 0.66), zb + 0.22, { y: T.up([1.8, 2.4, 1.8, 3.0][i % 4]), face: (i * 67) % 360 });
      for (const sx of [-12.4, -10.6, -8.8, -7.0, -5.2]) B.put('bar_stool', sx, z + 1.0, { face: 0 }); for (const sx of [-11.5, -8.0, -6.0]) B.put('xmas_cocoa', sx, z + 0.1, { y: T.up(1.19) }); B.put('xmas_punch', -10.0, z - 0.1, { y: T.up(1.19) }); B.put('cash_register', -4.5, z - 0.1, { y: T.up(1.19), face: 180 });
      for (const sx of [-12, -8.75, -5.5]) pendant(a, sx, top, z, 1.5); B.put('stock_pots', -13.0, zb + 0.5, { y: T.up(1.18) }); }
    /* four tables, each on a square's middle, four chairs round it off the middles */
    for (const [i, j, what] of [[1, 3, 'xmas_cookies'], [4, 3, 'xmas_punch_2'], [4, 1, 'xmas_bake'], [2, 4, 'xmas_carvery']]) { const c = T.sq(i, j); B.put('psx_dinner_table_1', c[0], c[1]); B.put(what, c[0], c[1], { y: T.up(0.88) });
      for (const [dx, dz, f] of [[1.15, 0, 270], [-1.15, 0, 90], [0, 1.15, 0], [0, -1.15, 180]]) B.put('psx_chair_mp_3', c[0] + dx, c[1] + dz, { face: f }); }
    /* the boot room: lockers on the left wall, a bench, the scarf rack, behind a low boarded screen on the line between rows 3 and 4 */
    { const zs = T.sq(0, 3)[1] + 1.75; a.box(-w / 2 + 0.3 + 3.35, 0.16, zs, 6.7, 1.3, 0.16, WD2, 0x7a583c, GW); a.box(-w / 2 + 0.3 + 3.35, 1.46, zs, 6.9, 0.08, 0.26, WD2, 0x3a2a20, GW); T.solid(-w / 2 + 0.3, zs, -w / 2 + 7.0, zs, 0.3, 1.4);
      for (const z of [4.3, 5.5, 6.7, 7.9]) B.put('locker', -w / 2 + 0.75, z, { face: 90 }); T.on('locker_bench', 1, 5, { face: 0 }); B.put('scarf_rack', -8.2, 9.3, { face: 0 }); B.put('rug_office', -11.0, 5.4, { y: 0.17 });
      a.sign('BOOT ROOM', -w / 2 + 3.6, 1.62, zs - 0.1, 2.6, 0.5, '#f4ecd8', '#2f4a3a', FONT, { glow: 0.8 }); a.sign('BOOT ROOM', -w / 2 + 3.6, 1.62, zs + 0.1, 2.6, 0.5, '#f4ecd8', '#2f4a3a', FONT, { glow: 0.8, ry: 180 }); }
    /* the games corner (front right): the first delivery's machines + the pinball table, the trophies on the right wall */
    T.on('arcade_cabinet', 7, 5, { face: 270 }); T.on('pinball_machine', 7, 4, { face: 270 }); T.on('jukebox', 6, 5, { face: 0 }); T.on('air_hockey_table', 5, 4); B.put('trophy_case', w / 2 - 0.36, T.sq(7, 2)[1], { face: 270 });
    T.on('xmas_tree', 4, 0, { h: 3.4 }); B.put('xmas_gift', 0.6, -9.4, { face: 200 }); B.put('xmas_gift_2', 2.9, -9.2, { face: 40 }); B.put('xmas_gift_3', 1.2, -7.6, { face: 110 });
    T.hang('notice_board', -5.6, d / 2 - 0.36, 1.2, 0); T.hang('wall_clock', 2.6, d / 2 - 0.36, 2.7, 0); B.put('brochure_rack', 1.9, 9.5, { face: 0 }); T.hang('xmas_wreath', -w / 2 + 0.36, T.sq(0, 2)[1], 2.6, 90); T.hang('xmas_garland', 3.5, zb + 0.06, 3.9, 180);
    for (const c of [[-3.5, 3.5], [5.25, 3.5], [8.75, -3.0]]) wheelLamp(a, c[0], top, c[1], 1.1);
    /* from the whole model list (the second read, 11-16): pictures, the bar's kit, hooks, a claw machine, chess on a table, a carpet up the door's aisle. LEFT OUT for their weight (a Meshy file of about 2 MB each, 100,000+ triangles: `coffee_mug`,
       `coffee_table`, `mini_fridge`, `hook_rail_long`, `potted_plant`): seven of them took the room from 1.3 to 2.1 million triangles */
    T.hang('painting_landscape', w / 2 - 0.36, T.sq(7, 0)[1] + 0.6, 1.9, 270); T.hang('painting_seascape', -1.75, zb + 0.06, 1.9, 180); T.hang('painting_landscape', w / 2 - 0.36, T.sq(7, 3)[1] + 1.75, 1.9, 270);
    B.put('espresso_machine', -7.2, zb + 0.3, { y: T.up(1.19), face: 180 }); B.put('coffee_maker', -9.6, zb + 0.3, { y: T.up(1.19), face: 180 });
    B.put('footlocker', -9.4, 4.4, { face: 0 }); B.put('claw_machine', T.sq(6, 5)[0] - 1.6, T.sq(6, 5)[1] + 0.3, { face: 0 }); B.put('chess_set_game', T.sq(4, 1)[0] + 0.1, T.sq(4, 1)[1] - 0.25, { y: T.up(0.88) });
    B.put('psx_carpet_mp_1', T.sq(3, 3)[0], T.sq(3, 3)[1] + 1.0, { y: 0.17, face: 90 }); });   // (no lantern with a light of its own: two of them halved the probe's frame rate in this room)

  /* THE RENTAL HUT, 4 x 3 squares, the door on square (1, 2). The counter stands on the middles of squares (1..3, 1): staff behind it, the boards on the
     back wall; the left column of squares is the way round to the bench and the lockers. */
  const RENT = walkIn('rental', 'P07-03', [4, 4, 8, 7, 'S'], 3.5, {}, rental, (a, B, T) => { const { w, d } = T, zb = -d / 2 + 0.3, top = 3.5 - 0.46, GW = { glow: 0.75, gain: 1.5 }, z = T.sq(0, 1)[1], x = 1.75, len = 10.0;
    counter(a, x, z, len, WD2); T.solid(x - len / 2, z, x + len / 2, z, 1.0, 1.15); B.put('cash_register', 3.6, z, { y: T.up(1.19), face: 180 }); B.put('brochure_rack', -2.6, z + 0.9, { face: 0 });
    for (const y of [1.0, 2.2]) a.box(1.75, y, zb + 0.14, 9.6, 0.1, 0.12, WD2, 0x3a2a20, GW);                                                    // the board wall: two rails, the boards stood against them
    ['surfboard_short', 'surfboard_long', 'surfboard_fish', 'surfboard_short', 'surfboard_long', 'surfboard_fish'].forEach((k, i) => B.put(k, -2.6 + i * 1.05, zb + 0.42, { face: 180 }));   // the stock: the game's own boards
    for (const sx of [-1.4, 0.9, 3.2, 5.5]) B.put('skateboard', sx, zb + 1.1, { face: 90 }); T.on('surfboard_rack', 3, 0, { face: 180 });
    T.on('tool_chest', 0, 0, { face: 180 }); T.hang('tool_pegboard', -5.25, zb + 0.06, 1.5, 180); for (const lz of [-1.0, 0.2]) B.put('locker', -w / 2 + 0.75, lz, { face: 90 }); T.on('locker_bench', 0, 2, { face: 90 }); T.hang('key_rack', 5.6, zb + 0.06, 1.6, 180);
    T.hang('wall_clock', -3.0, d / 2 - 0.36, 2.3, 0); B.put('scarf_rack', 5.9, 4.2, { face: 270 }); B.put('rug_office', -1.0, 3.3, { y: 0.17 });
    for (const sx of [-1.75, 1.75, 5.25]) pendant(a, sx, top, z, 0.7); pendant(a, -5.25, top, 2.0, 0.7);
    for (const [sx, k] of [[4.6, 'surfboard_short'], [6.2, 'surfboard_short']]) B.put(k, sx, 4.4, { face: 0 }); B.put('sunglasses_spinner', -2.9, 3.9); B.put('footlocker', -5.6, -3.2, { face: 90 }); });

  /* THE TOP STATION, 4 x 4 squares, the door on square (1, 3): the lift man's room. His desk and radio at the back right, a stove at the back left, a bed for
     the hurt at the right wall, benches for the cold on the left. */
  const TOP = walkIn('topstation', 'P08-00', [4, 3, 8, 7, 'S'], 3.5, { leaf: 'leaf_frame_only' }, topStation, (a, B, T) => { const { w, d } = T, zb = -d / 2 + 0.3, top = 3.5 - 0.46, G = { glow: 0.8 }, GW = { glow: 0.75, gain: 1.5 };
    T.on('radio_console', 3, 0, { face: 180 }); { const c = T.sq(2, 0); counter(a, c[0], c[1], 2.6, WD2, { h: 0.82, depth: 1.1 }); T.solid(c[0] - 1.3, c[1], c[0] + 1.3, c[1], 1.1, 0.9); B.put('field_radio', c[0] - 0.5, c[1], { y: T.up(0.91), face: 180 }); B.put('xmas_cocoa_2', c[0] + 0.7, c[1] + 0.2, { y: T.up(0.91) }); B.put('table_lamp', c[0] + 0.9, c[1] - 0.25, { y: T.up(0.91) }); B.put('psx_chair_mp_3', c[0], c[1] + 1.2, { face: 0 }); }
    { const c = T.sq(0, 0); a.box(c[0], 0.16, c[1], 1.5, 0.08, 1.5, 'rocks_5', 0x8a8a92, G); a.cyl(c[0], 0.24, c[1], 0.5, 1.0, 'gunmetal', 0x2c2c30, { seg: 12, glow: 0.5 }); a.cyl(c[0], 1.24, c[1], 0.56, 0.08, 'gunmetal', 0x1c1c20, { seg: 12, glow: 0.5 }); a.cyl(c[0], 1.32, c[1] - 0.2, 0.12, top - 1.3, 'gunmetal', 0x2c2c30, { seg: 8, glow: 0.5 });   // the stove and its pipe
      a.box(c[0], 0.5, c[1] + 0.5, 0.5, 0.4, 0.04, 'marble_light', 0xff8030, { glow: 1.4 }); T.solid(c[0] - 0.5, c[1], c[0] + 0.5, c[1], 1.1, 1.3); a.box(c[0] + 1.3, 0.16, zb + 0.35, 0.9, 0.7, 0.5, WD2, 0x8a6444, GW); }
    T.on('hospital_bed', 3, 2, { face: 0 }); T.hang('fire_extinguisher', w / 2 - 0.36, T.sq(3, 1)[1], 0.95, 270); T.on('locker_bench', 0, 1, { face: 90 }); T.on('locker_bench', 0, 2, { face: 90 });
    T.hang('notice_board', 0, zb + 0.06, 1.2, 180); T.hang('wall_clock', 3.4, zb + 0.06, 2.4, 180); B.put('railway_lantern', 5.9, 5.9); B.put('rug_office', 0.5, 0.5, { y: 0.17 }); T.on('map_table', 2, 2);
    pendant(a, -1.75, top, -1.75, 0.6); pendant(a, 1.75, top, 1.75, 0.6); pendant(a, 3.5, top, -4.6, 0.6);
    T.hang('breaker_panel', -w / 2 + 0.36, T.sq(0, 3)[1], 1.25, 90); T.hang('punch_clock', w / 2 - 0.36, T.sq(3, 3)[1], 1.3, 270); T.hang('gauge_board', T.sq(2, 0)[0], zb + 0.06, 1.6, 180); B.put('rotary_phone', T.sq(2, 0)[0] + 0.2, T.sq(2, 0)[1] - 0.3, { y: T.up(0.91) });
    B.put('item_binoculars', T.sq(2, 0)[0] - 0.9, T.sq(2, 0)[1] + 0.25, { y: T.up(0.91) }); B.put('psx_walkie_talkie_1', T.sq(2, 2)[0] + 0.3, T.sq(2, 2)[1], { y: T.up(0.95) }); B.put('psx_bandage_mp_1', T.sq(3, 2)[0] - 1.1, T.sq(3, 2)[1] + 0.9, { y: 0.02 }); B.put('footlocker', T.sq(3, 3)[0] + 0.4, T.sq(3, 3)[1] + 0.9, { face: 270 }); });
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
