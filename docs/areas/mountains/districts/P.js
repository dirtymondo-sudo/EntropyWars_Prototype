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

   THE INSIDES (pass 2, seen): all four are lit (`lit`: the walls, floor and ceiling again a hand inside, with glow) and furnished on the squares.
   - Warming Hut: a stone hearth with its fire, a bench and a rocking chair, two cots with lockers, the table (cocoa, the hut book, a lantern), a range and pots,
     a shelf of cans, the rescue corner (coats and helmets, a radio, a map table, a notice board)
   - Gate House: the keeper's bed, his desk under the back window, a hearth with a pot, keys, a rifle rack. Summit Shelter: two cots, a radio console, crates, fuel,
     first aid, a flare gun, an extinguisher. Fishing Hut: an iron stove, the hole in the floor, a stool, a bucket, traps, a net, a cooler

   THE DRESSING (pass 3, seen): every plot has its own things, from the model list's shortlist (the notes).
   - Shapes of this file (no model exists): `leanTo` (the WAY SHELTER with the RESCUE CACHE at the Switchbacks, the SLEIGH shed at the Sleigh Bend, turned with
     `R.ARCH[..].rot`), `lampPost` (a log post with a lit lantern, 11 of them), `snowPoles` (banded trail markers with a red top), `woodpile`, the outhouse
   - The Lookout: a bench, a dead tree, crows. The Ridge: a summit cross, stores by the Shelter. The Mast: a cable drum, gas bottles, a barrel
   - The Gate's yard: the keeper's horse at a hitching rail, hay, a barrel, sandbags, a snowman. The High Pass: a sarsen, an urn, a votive stand, candles, loose stones
   - The Switchbacks: the Way Shelter, dead trees, a snow fence. The Sleigh Bend: the shed with a sleigh and hay, a horse, a second sleigh, gifts and sacks
   - The Tarn: the fishers' camp (tent, fire, chest), a boat frozen in, stools and a bucket by the holes, traps. The Tree Line: the woodcutter's camp (two wood stacks,
     a sawhorse, a tent, a fire) with three wolves and bones; the climbers' camp (two tents, a fire, a pot, stumps). The Hut's yard: an outhouse, lamps, a dog, a snowman
   - PEOPLE: three yetis stand (the High Pass, the Sleigh Bend, the climbers' camp); no line, so they walk. No `encounters` export: the room's table is mondo's

   THE ATMOSPHERE (pass 4, seen by day and at night): `exports.airZones` = snow (hard and sideways on the Ridge, steady over the pass and the Tarn, thin under the
   pines); seven more real fires where people stop (torches at the Pass Gate and the Shelter, braziers at the Gate's yard, the Lookout, the Sleigh Bend and the Hut,
   a campfire at the Way Shelter; with the hearths, the camps and the High Pass's two: 14 lights in the district); smoke from the three flues

   KNOWN MISSING OR WRONG (the last pass: 5 polish)
   - The 22 lamp posts and snow poles are a `look` each (draw calls): one look for all, as district S did, if the frame rate asks for it
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
/* ── THE INSIDES (pass 2; the zone kit's rules: a building's own inside takes no light, so the walls, floor and ceiling are drawn again a hand inside with `glow`;
   every inside prop is `floor: true`; a thing that blocks stands on a square's middle) ── */
const onFloor = B => { const p = B.put; B.put = (key, lx, lz, q) => p(key, lx, lz, Object.assign({ floor: true }, q || {})); return B; };
const lit = (a, w, h, d, dr, key, tint, g, ctx) => { const top = h - 0.36, i = 0.3, t = 0.04, q = { glow: g, gain: 1.7 }, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2, e = w / 2 - i;
    a.box(0, 0, -(d / 2 - i), w - 2 * i, top, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - i), 0, 0, t, top, d - 2 * i, key, tint, q);
    a.box((-e + x0) / 2, 0, d / 2 - i, x0 + e, top, t, key, tint, q); a.box((x1 + e) / 2, 0, d / 2 - i, e - x1, top, t, key, tint, q); a.box(dr.lx, 2.2, d / 2 - i, dr.cw, top - 2.2, t, key, tint, q);
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, ctx.WD2, 0x8a6a48, { sides: false, top: false, under: true, glow: g * 0.75, gain: 1.6 }); };
const lamp = (a, x, top, z) => { a.box(x, top - 0.5, z, 0.03, 0.5, 0.03, 'marble_light', 0x2a2a2a); a.cyl(x, top - 0.52, z, 0.2, 0.05, 'marble_light', 0x2a2a2a, { seg: 8 }); a.cyl(x, top - 0.74, z, 0.11, 0.22, 'marble_light', 0xffb050, { seg: 10, glow: 1.2 }); a.cyl(x, top - 0.78, z, 0.13, 0.04, 'marble_light', 0x2a2a2a, { seg: 10 }); };
/* a stone hearth against the back wall (cx along it, k its size), its mouth open: the fire is the catalogue's `hearth_fire`, put in by build */
const hearth = (a, cx, d, top, k, WD2) => { const z0 = -d / 2 + 0.3, zc = z0 + 0.45 * k, B = 'rocks_5', T = 0xb0b0b8, g = { glow: 0.75, gain: 1.7, uv: 1.2 };
    for (const s of [-1, 1]) a.box(cx + s * 0.8 * k, 0, zc, 0.45 * k, 1.15 * k, 0.9 * k, B, T, g); a.box(cx, 1.15 * k, zc, 2.05 * k, 0.4 * k, 0.9 * k, B, T, g);
    a.box(cx, 0, z0 + 0.04, 1.15 * k, 1.15 * k, 0.06, B, 0x241a16, { glow: 0.8 }); a.box(cx, 0.16, zc, 1.15 * k, 0.04, 0.9 * k, B, 0x4a3a34, { glow: 0.8 });
    a.box(cx, 1.55 * k, zc + 0.04, 2.4 * k, 0.14, 0.9 * k + 0.16, WD2, 0x6a4a34, { glow: 0.8, gain: 1.4 }); a.box(cx, 1.55 * k + 0.14, z0 + 0.2, 1.4 * k, top - 1.55 * k - 0.14, 0.4, B, T, g); };
/* the dusk in a window, seen from inside (ew = on a side wall) */
const nightPane = (a, x, y, z, w, h, ew) => { const B = (px, pz, bw, bd, tint, gl) => ew ? a.box(pz, y, px, bd, h, bw, 'marble_light', tint, { glow: gl }) : a.box(px, y, pz, bw, h, bd, 'marble_light', tint, { glow: gl });
    B(x, z, w, 0.05, 0x6a88a8, 0.7); B(x, z + (z < 0 ? 0.03 : -0.03), 0.07, 0.06, TRIM, 0.8); };
/* a small iron stove with its pipe to the roof */
const stove = (a, x, z, top) => { a.cyl(x, 0.12, z, 0.34, 0.8, GM, 0x3a3e44, { seg: 10, gain: 1.6 }); for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) a.box(x + dx, 0, z + dz, 0.06, 0.14, 0.06, GM, 0x3a3e44);
    a.cyl(x, 0.92, z, 0.38, 0.06, GM, 0x3a3e44, { seg: 10, gain: 1.6 }); a.cyl(x, 0.98, z, 0.1, top - 0.98, GM, 0x4a5058, { seg: 8, gain: 1.6 }); a.box(x, 0.36, z + 0.33, 0.3, 0.26, 0.04, 'marble_light', 0xff8a30, { glow: 1.5 }); };
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
    lit(a, w, h, d, dr, WD, 0xd8b088, 0.85, ctx); for (const x of (q.lamps || [0])) lamp(a, x, h - 0.32, 0.3);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; nightPane(a, x, 1.15, d / 2 - 0.36, 1.3, 1.25, false); } for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 3.5) nightPane(a, z, 1.15, s * (w / 2 - 0.36), 1.3, 1.25, true);
    if (q.chimney) { hearth(a, q.chimney, d, h - 0.36, 1.15, WD2); a.box(q.chimney, 0, -d / 2 - 0.4, 1.7, h + q.rh + 0.9, 1.0, 'rocks_5', STONE, ROCK(0, { roof: true })); a.box(q.chimney, h + q.rh + 0.9, -d / 2 - 0.4, 1.9, 0.22, 1.2, 'ice', SNOW, { roof: true }); }
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

/* ── THE DRESSING'S SHAPES (pass 3): things the pass needs that no model exists for (the NEEDS A MODEL list), built as textured parts ── */
/* an open-fronted log shelter: its back at -z, open to +z, a shed roof falling to the back, a bench along the back wall */
const leanTo = (a, w, d, ctx) => { const { WD, WD2 } = ctx, g = { gain: 1.7 }, P = 0x5a4030;
    a.box(0, 0, -d / 2 + 0.14, w, 2.3, 0.28, WD, LOG, g); for (const s of [-1, 1]) a.box(s * (w / 2 - 0.14), 0, 0, 0.28, 2.3, d - 0.1, WD, LOG, g);
    for (let y = 0.3; y < 2.2; y += 0.5) { a.box(0, y, -d / 2 + 0.3, w - 0.5, 0.24, 0.06, WD2, 0x6a4c36, g); }
    const n = Math.max(2, Math.round(w / 3.5)); for (let i = 0; i <= n; i++) a.cyl(-w / 2 + 0.2 + i * (w - 0.4) / n, 0, d / 2 - 0.2, 0.15, 3.1, WD2, P, { seg: 8, gain: 1.6 });
    a.box(0, 3.0, d / 2 - 0.2, w + 0.2, 0.22, 0.22, WD2, P, { gain: 1.6 }); for (const s of [-1, 1]) a.box(s * (w / 2 - 0.14), 2.3, 0, 0.2, 0.16, d, WD2, P, { gain: 1.6 });
    a.roof('shed', 0, 2.45, 0, w + 0.9, 0.9, d + 1.0, 'ice', SNOW, { ry: 180 });
    a.box(0, 0.42, -d / 2 + 0.62, w - 1.4, 0.08, 0.5, WD2, 0x8a6a4a, g); for (let x = -w / 2 + 1.0; x <= w / 2 - 0.99; x += (w - 2) / 2) a.box(x, 0, -d / 2 + 0.62, 0.1, 0.42, 0.44, WD2, P, { gain: 1.6 });
    a.box(0, 0, -d / 2 - 0.4, w + 1.2, 0.4, 0.8, 'ice', SNOW); };
/* a stack of split logs under a cap of snow (along x) */
const woodpile = (a, x, z, w) => { for (let r = 0; r < 3; r++) for (let i = 0, n = Math.round(w / 0.34); i < n; i++) a.box(x - w / 2 + 0.17 + i * 0.34, r * 0.3, z, 0.3, 0.28, 1.0 - r * 0.06, ctx0.WD2, (i + r) % 3 ? 0x8a6444 : 0x6e4e34, { gain: 1.5 });
    a.box(x, 0.9, z, w + 0.1, 0.1, 1.1, 'ice', SNOW); for (const s of [-1, 1]) a.box(x + s * (w / 2 + 0.06), 0, z, 0.1, 1.1, 0.1, ctx0.WD2, 0x5a4030, { gain: 1.6 }); };
const ctx0 = {};
/* THE SQUARES: the rock between the Ridge and the pass below it is two open SNOW SLOPES now (letter `k`, the deep drift: nobody walks it, nothing stands on it), so
   the Ridge looks down on the Pass Gate and on the High Pass and they look up at it (the first look: every plot was a pit between rock walls; a drop cut to the
   north only faced the room's own edge wall). The Lookout gains two squares on the slope's lip, and the Frozen Tarn a snow shore round its ice */
exports.tailor = t => {
    const fill = (id, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (t.get(id, x, y) === 'r') t.set(id, x, y, ch); };
    fill('P04-00', 3, 7, 4, 7, 's'); fill('P04-00', 2, 8, 9, 11, 'k'); fill('P04-01', 2, 0, 9, 1, 'k');
    fill('P05-00', 8, 6, 11, 11, 'k'); fill('P05-01', 9, 0, 11, 1, 'k');
    for (const [x, y] of [[2, 2], [3, 2], [8, 2], [8, 3]]) if (t.get('P06-03', x, y) === 't') t.set('P06-03', x, y, 's');   // a little more yard round the Warming Hut (the pine INSIDE the hut was the renderer's: see the notes, THE OFF-CENTRE MODEL)
    { const id = 'P05-02', sh = []; for (let y = 0; y < t.N; y++) for (let x = 0; x < t.N; x++) { if (t.get(id, x, y) !== 'i') continue;
          if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < t.N && Y < t.N && t.get(id, X, Y) === 'r'; })) sh.push([x, y]); }
      sh.forEach(([x, y]) => t.set(id, x, y, 's')); }
};

const IN = {};   // the built houses, for the insides (build)
exports.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  level(ctx, 'P05-01', 1, 2, 10, 8); level(ctx, 'P05-02', 3, 2, 12, 10);   // the High Pass is a level saddle, the Tarn a level sheet
  /* THE WARMING HUT, on the tree line under the pass */
  const HUT = onFloor(building('hut', 'P06-03', [4, 3, 8, 6, 'S'], 3.5, {}, (a, w, d, dr) => logHouse(a, w, d, dr, { h: 3.5, rh: 2.6, chimney: 5.25, porch: true, name: 'WARMING HUT', lamps: [-3.5, 1.75] }, ctx)));
  IN.hut = HUT;
  /* THE GATE HOUSE (P04-01): the keeper's stone house beside the Pass Gate */
  IN.gate = onFloor(building('gatehouse', 'P04-01', [5, 2, 8, 4, 'S'], 3.3, {}, (a, w, d, dr) => { const h = 3.3, ST = 0xb4b4bc;
      lit(a, w, h, d, dr, 'urban:PlasterWallPainted1a', 0xf0dcc0, 0.85, ctx); lamp(a, 0, h - 0.32, 0.3); hearth(a, 3.5, d, h - 0.36, 0.9, WD2); nightPane(a, -w / 4, 1.15, -(d / 2 - 0.36), 1.1, 1.2, false); for (const s of [-1, 1]) nightPane(a, 0, 1.15, s * (w / 2 - 0.36), 1.1, 1.2, true);
      a.box(0, 0.9, -(d / 2 - 0.36), w - 0.8, 0.1, 0.05, WD2, 0x6a4a34, { glow: 0.8, gain: 1.4 }); for (const s of [-1, 1]) a.box(s * (w / 2 - 0.36), 0.9, 0, 0.05, 0.1, d - 0.8, WD2, 0x6a4a34, { glow: 0.8, gain: 1.4 });   // a dado rail
      a.shell(w, h, d, 'rocks_5', ST, dr, [1.75, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.8; });
      a.box(0, 0, 0, w + 0.3, 0.5, d + 0.3, 'rocks_5', 0x8c8c94, ROCK(0, { faces: 'blr', top: false })); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let i = 0; i < 7; i++) a.box(sx * (w / 2 + 0.03), i * 0.47, sz * (d / 2 + 0.03), i % 2 ? 0.5 : 0.36, 0.45, i % 2 ? 0.36 : 0.5, 'marble_light', 0xd8d4cc);   // the quoins
      a.roof('gable', 0, h, 0, w + 1.3, 2.3, d + 1.3, 'ice', SNOW, { keyEnd: 'rocks_5', tintEnd: ST, gain: 1.8 }); a.box(0, h + 2.26, 0, w + 1.6, 0.16, 0.22, WD2, 0x4a3626, { roof: true });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.14), 0, d / 2 + 0.1, 0.28, 2.4, 0.22, 'marble_light', 0xd8d4cc); a.box(dr.lx, 2.3, d / 2 + 0.1, dr.cw + 0.8, 0.3, 0.24, 'marble_light', 0xd8d4cc);
      a.roof('shed', dr.lx, 2.6, d / 2 + 0.55, dr.cw + 1.2, 0.4, 1.0, 'ice', SNOW); a.box(dr.lx, 0, d / 2 + 0.6, dr.cw + 0.9, 0.14, 1.0, 'rocks_5', 0xb8b8c0, ROCK());
      for (const x of [-w / 2 + 1.75, w / 2 - 1.75]) if (Math.abs(x - dr.lx) > 1.7) pane(a, x, 1.15, d / 2 + 0.1, 1.1, 1.2, false);
      for (const s of [-1, 1]) pane(a, 0, 1.15, s * (w / 2 + 0.1), 1.1, 1.2, true); pane(a, -w / 4, 1.15, -(d / 2 + 0.1), 1.1, 1.2, false);
      a.box(3.5, h, -d / 2 + 0.6, 1.1, 3.2, 1.1, 'rocks_5', 0x8c8c94, ROCK(0, { roof: true })); a.box(3.5, h + 3.2, -d / 2 + 0.6, 1.3, 0.2, 1.3, 'ice', SNOW, { roof: true });
      winter(a, w, h, d, dr, false, 0.6); lantern(a, dr.lx + dr.cw / 2 + 0.6, 1.7, d / 2 + 0.18);
      board(a, 'GATE HOUSE', dr.lx, 3.05, d / 2 + 0.72, 3.4, 0.6, '#f4ecd8', '#3a2a20', 'fell', { roof: true }); }));
  /* THE SUMMIT SHELTER (P05-00, the top of the range): a red emergency hut with a round roof */
  IN.shelter = onFloor(building('shelter', 'P05-00', [3, 8, 5, 10, 'N'], 2.5, { leaf: 'leaf_shabby_wood' }, (a, w, d, dr) => { const h = 2.5;
      lit(a, w, h, d, dr, 'urban:PlasterWallPainted1a', 0xe8e0c8, 0.85, ctx); lamp(a, 0, h - 0.32, 0); a.box(0, 1.3, -(d / 2 - 0.36), w - 0.8, 0.3, 0.05, null, RED, { glow: 0.8 }); for (const s of [-1, 1]) a.box(s * (w / 2 - 0.36), 1.3, 0.9 * s, 0.05, 0.3, 1.6, null, RED, { glow: 0.8 });
      a.shell(w, h, d, null, RED, dr); a.box(0, 0, 0, w + 0.3, 0.4, d + 0.3, 'rocks_5', STONE, ROCK(0, { faces: 'blr', top: false })); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      a.box(0, 1.5, -(d / 2 + 0.03), w + 0.12, 0.3, 0.06, null, 0xf0f0f0); for (const s of [-1, 1]) a.box(s * (w / 2 + 0.03), 1.5, 0, 0.06, 0.3, d + 0.12, null, 0xf0f0f0);   // the white band
      a.roof('barrel', 0, h, 0, d + 0.5, 1.5, w + 0.3, null, RED, { ry: 90, keyEnd: null, tintEnd: RED }); a.box(0, h + 1.38, 0, w * 0.55, 0.14, d + 0.3, 'ice', SNOW, { roof: true });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.1), 0, d / 2 + 0.08, 0.16, 2.3, 0.16, GM, GT); a.box(dr.lx, 2.22, d / 2 + 0.08, dr.cw + 0.36, 0.16, 0.16, GM, GT);
      for (const s of [-1, 1]) a.box(s * (w / 2 + 0.06), 1.2, 0, 0.06, 0.6, 0.9, 'marble_light', PANE, { glow: 1.0 });
      a.cyl(w / 2 - 0.5, h + 1.0, -d / 2 + 0.5, 0.03, 3.4, GM, GT, { seg: 6, roof: true }); a.box(w / 2 - 0.5, h + 4.4, -d / 2 + 0.5, 0.14, 0.14, 0.14, null, 0xff3020, { glow: 1.6, roof: true });   // the whip aerial and its light
      winter(a, w, h, d, dr, true, 0.3); lantern(a, dr.lx + dr.cw / 2 + 0.5, 1.6, d / 2 + 0.16);
      board(a, 'SHELTER', dr.lx, 2.5, d / 2 + 0.1, 2.6, 0.55, '#ffffff', '#8a1c18', 'stencil'); }));
  /* THE FISHING HUT, out on the Tarn's ice */
  IN.ice = onFloor(building('icehut', 'P05-02', [5, 5, 7, 7, 'S'], 2.6, {}, (a, w, d, dr) => { const h = 2.6, T = 0x8a6a4a;
      lit(a, w, h, d, dr, WD, 0xd8b088, 0.85, ctx); lamp(a, 0.6, h - 0.32, 0.6); stove(a, -w / 2 + 0.9, -d / 2 + 0.9, h - 0.3); nightPane(a, 0, 1.2, -(d / 2 - 0.36), 0.9, 0.9, false); for (const s of [-1, 1]) nightPane(a, 0, 1.2, s * (w / 2 - 0.36), 0.9, 0.9, true);
      a.cyl(1.75, 0.17, -1.75, 0.6, 0.02, null, 0x0c1c2c, { seg: 12, glow: 0.5 }); a.cyl(1.75, 0.16, -1.75, 0.82, 0.05, 'ice', ICE, { seg: 12, ri: 0.6, glow: 0.8 });   // the hole in the floor, down to the water
      a.shell(w, h, d, WD, T, dr, [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = 1.7; }); a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
      for (const s of [-1, 1]) a.box(s * (w / 2 - 0.3), -0.02, 0, 0.3, 0.14, d + 1.4, WD2, 0x5a4030, { gain: 1.6 });   // its two runners (it was dragged out here)
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.2, h, 0.2, WD2, 0x5a4030, { gain: 1.6 });
      a.roof('shed', 0, h, 0, w + 0.8, 0.9, d + 0.8, 'ice', SNOW); a.box(0, h - 0.14, 0, w + 0.14, 0.14, d + 0.14, WD2, 0x5a4030, { gain: 1.6, top: false });
      for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.08), 0, d / 2 + 0.08, 0.14, 2.3, 0.14, WD2, 0x5a4030, { gain: 1.6 }); a.box(dr.lx, 2.22, d / 2 + 0.08, dr.cw + 0.3, 0.14, 0.14, WD2, 0x5a4030, { gain: 1.6 });
      pane(a, 0, 1.2, -(d / 2 + 0.1), 0.9, 0.9, false); for (const s of [-1, 1]) pane(a, 0, 1.2, s * (w / 2 + 0.1), 0.9, 0.9, true);
      a.cyl(-w / 2 + 0.9, h, -d / 2 + 0.9, 0.12, 1.9, GM, GT, { seg: 8, roof: true }); a.cyl(-w / 2 + 0.9, h + 1.9, -d / 2 + 0.9, 0.2, 0.1, GM, GT, { seg: 8, roof: true });   // the stovepipe
      lantern(a, dr.lx + dr.cw / 2 + 0.45, 1.6, d / 2 + 0.16); board(a, 'FISHING HUT', dr.lx, 2.42, d / 2 + 0.1, 3.0, 0.5, '#f4ecd8', '#3a2a20', 'fell'); }));
};

/* THE AIR (pass 4; the tool's hook `airZones`, district S's): it snows on the pass. Hard and sideways on the Ridge, steady over the High Pass and the Tarn, thin
   under the pines. (A room with zones draws only its zones; district K hands the room's own thin snow back over the whole room.) Kept low: the frame rate. */
exports.airZones = ctx => { const { S } = ctx, Z = (id, id2, n, q) => { const a = S(id, 0, 0), b = S(id2, 11, 11); return Object.assign({ x0: a[0], y0: a[1], x1: b[0] + 1, y1: b[1] + 1, kind: 'snow', n }, q || {}); };
    return [Z('P04-00', 'P06-00', 300, { wind: 0.9, speed: 1.2 }), Z('P04-01', 'P06-02', 380, { wind: 0.4 }), Z('P04-03', 'P06-03', 110, { speed: 0.7 })]; };

exports.build = ctx => { ctx0.WD2 = ctx.WD2;
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
    const LG = { gain: 1.6 }, POST = 0x5a4030;
    const mark = (id, lx, ly) => { const q = S(id, lx, ly); R.taken.add(q[0] + ':' + q[1]); return q; };
  /* ── THE INSIDES (pass 2). A house's frame: x along its front, +z out of the door, the back wall at -d/2; its squares' middles are odd multiples of 1.75.
     What blocks (a table, a range, a bed, a bench, a console) stands on a square's middle; chairs, crates and small things stand off it; the door's square stays free ── */
  { const H = IN.hut;   // THE WARMING HUT, 4 x 3 squares, the door on (-1.75, 3.5): the hearth east, the bunks west, the table in the middle, the kitchen at the back
    H.put('hearth_fire', 5.25, -4.5, { w: 1.2, h: 1.0 }); H.put('locker_bench', 5.25, -1.2, { face: 0 }); H.put('rocking_chair', 3.6, -2.4, { face: 60 }); H.put('rug_round', 4.6, -2.6, { y: 0.17 });
    H.put('psx_wooden_crate_2', 6.4, -2.9); H.put('wooden_bucket', 3.5, -4.4);
    for (const z of [-3.5, 0]) { H.put('cot', -5.5, z, { face: 0 }); H.put('footlocker', -4.2, z + 1.3, { face: 90 }); H.put('psx_pillow_mp_1', -5.5, z - 0.75, { y: 0.5 }); }
    H.put('psx_carpet_mp_1', -4.4, -1.7, { y: 0.17, face: 90 }); H.put('scarf_rack', -6.2, 2.2, { face: 90 }); H.put('hook_rail', -6.6, 3.2, { face: 90 });
    H.put('psx_table_large_2', 1.75, 0, { face: 90 }); H.put('psx_chair_mp_3', 0.7, 0.3, { face: 90 }); H.put('psx_chair_mp_3', 2.8, -0.3, { face: 270 }); H.put('psx_chair_mp_3', 1.6, 1.15, { face: 0 });
    H.put('xmas_cocoa', 1.5, -0.2, { y: 0.97 }); H.put('xmas_cocoa', 2.1, 0.2, { y: 0.97 }); H.put('psx_open_book_mp_1', 1.8, 0.45, { y: 0.97, face: 20 }); H.put('railway_lantern', 1.4, 0.3, { y: 0.97 });
    H.put('kitchen_range', -1.75, -4.55, { face: 180 }); H.put('stock_pots', -0.6, -4.5); H.put('psx_shelf_mp_5', 1.75, -4.6, { face: 180 }); H.put('psx_canned_food_mp_1', 1.5, -4.6, { y: 0.9 }); H.put('psx_canned_food_mp_1', 2.0, -4.6, { y: 0.9 });
    H.put('turnout_gear_rack', 6.3, 3.5, { face: 270 }); H.put('field_radio', 5.6, 4.3, { y: 0.4 }); H.put('psx_supply_crate_1', 5.6, 4.3); H.put('notice_board', 2.6, 4.9, { face: 0 }); H.put('map_table', 3.2, 3.7, { face: 0 }); }
  { const H = IN.gate;   // THE GATE HOUSE, 3 x 2 squares, the door on (0, 1.75): the keeper's bed, his desk under the back window, the hearth
    H.put('hearth_fire', 3.5, -2.75, { w: 1.0, h: 0.85 }); H.put('cauldron', 3.5, -1.2); H.put('rocking_chair', 2.2, -0.4, { face: 45 });
    H.put('psx_bed_1', -3.5, -1.75, { face: 0 }); H.put('footlocker', -3.6, 0.5, { face: 0 }); H.put('rug_round', -2.0, 0.6, { y: 0.17 });
    H.put('psx_table_large_2', 0, -2.2, { face: 0 }); H.put('psx_chair_mp_3', 0.2, -1.0, { face: 0 }); H.put('psx_open_book_mp_1', -0.3, -2.2, { y: 0.97 }); H.put('table_lamp', 0.6, -2.4, { y: 0.97 }); H.put('coffee_mug', 0.1, -1.9, { y: 0.97 });
    H.put('key_rack', -1.6, 2.9, { face: 0, y: 0.9 }); H.put('rifle_rack', 4.4, 2.2, { face: 270 }); H.put('scarf_rack', -4.5, 2.6, { face: 90 }); H.put('psx_wooden_crate_2', 4.3, 0.6); }
  { const H = IN.shelter;   // THE SUMMIT SHELTER, 2 x 2 squares, the door on (-1.75, 1.75): two cots, the radio, the stores
    H.put('cot', -2.2, -2.3, { face: 90 }); H.put('cot', 1.2, -2.3, { face: 90 }); H.put('radio_console', 1.75, 1.75, { face: 270 });
    H.put('psx_supply_crate_1', 2.5, -0.6); H.put('psx_supply_crate_1', 2.5, -0.6, { y: 0.37, face: 30 }); H.put('psx_jerrycan_1', 2.6, 0.3); H.put('psx_metal_barrel_mp_0', -2.7, 0.1);
    H.put('psx_bandage_mp_1', 2.4, -0.6, { y: 0.75 }); H.put('psx_pills_bottle_1', 2.7, -0.5, { y: 0.75 }); H.put('item_flare_gun', -2.7, 0.1, { y: 0.98 }); H.put('fire_extinguisher', 0.4, 3.1, { face: 0 }); }
  { const H = IN.ice;   // THE FISHING HUT, 2 x 2 squares, the door on (-1.75, 1.75): the stove in the back corner, the hole in the floor, the catch
    H.put('psx_chair_mp_1', 1.0, -0.8, { face: 135 }); H.put('wooden_bucket', 2.6, -1.0); H.put('psx_fish_skeleton_mp_1', 0.9, -2.5, { y: 0.18 });
    H.put('lobster_traps', 2.5, 2.3, { face: 270 }); H.put('beach_cooler', 0.6, 2.6); H.put('footlocker', -2.4, -0.4, { face: 90 }); H.put('fishing_net_wall', 2.9, 0.6, { face: 270, y: 0.6 }); }
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
  { const p = R.byId['P05-02'], q = S('P05-02', 6, 6); look('tarn', gx(q[0]), gz(q[1]), a => {   // THE TARN: the ice itself, a sheet on every ice square, and two fishing holes
        for (let ly = 0; ly < N; ly++) { let x0 = -1; for (let lx = 0; lx <= N; lx++) { const on = lx < N && cell[p.ly * N + ly][p.lx * N + lx] === 'i';
            if (on && x0 < 0) x0 = lx; if (!on && x0 >= 0) { a.box(((x0 + lx) / 2 - 6) * C, 0.03, (ly + 0.5 - 6) * C, (lx - x0) * C, 0.04, C, 'ice_1', 0x8cc4ec, { uv: 7, glow: 0.35, sides: false }); x0 = -1; } } }
        for (const [x, z] of [[5.6, -5.4], [-4.4, 6.2]]) { a.cyl(x, 0.06, z, 0.62, 0.03, null, 0x0c1c2c, { seg: 12 }); a.cyl(x, 0.05, z, 0.8, 0.05, 'ice', SNOW, { seg: 12, ri: 0.62 }); } }); }
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
  /* ══ THE ATMOSPHERE (pass 4): real fire where people stop (the catalogue's brazier / torch / campfire carry a light; the lanterns and windows are lit shapes),
     smoke from the three flues (`chimney_smoke`, y = the flue's top from the ROOM's floor), the snow (airZones above) ══ */
  put('P04-01', 'cave_torch', 3, 5); put('P04-01', 'brazier', 9, 6); put('P04-00', 'brazier', 6, 6); put('P05-00', 'cave_torch', 6, 7); put('P06-01', 'campfire', 5, 4); put('P04-02', 'brazier', 6, 6); put('P06-03', 'brazier', 4, 8);
  IN.hut.put('chimney_smoke', 5.25, -5.65, { floor: false, y: 12.5 }); IN.gate.put('chimney_smoke', 3.5, -2.9, { floor: false, y: 13.7 }); IN.ice.put('chimney_smoke', -2.6, -2.6, { floor: false, y: 13.4 });
  /* ══ THE DRESSING (pass 3): every plot its own things, from the shortlist (areas-complexes.md "THE MOUNTAINS, THE SNOWY PASS"). Blockers on free squares' middles,
     small things off them, the trails' squares left clear ══ */
  const ghost = (id, lx, ly, t) => { const q = S(id, lx, ly); feat({ k: 'wall', x0: r2(mx(q[0]) - (t || 1.2) / 2), z0: mz(q[1]), x1: r2(mx(q[0]) + (t || 1.2) / 2), z1: mz(q[1]), t: t || 1.2, h: 2, ghost: true, rail: false }); };
  /* a lamp post: a log post on a stone foot, a lit lantern on its arm (the village's is candy-striped; the pass's is a bare log) */
  const lampPost = (id, lx, ly, turn) => { const q = mark(id, lx, ly), sx = turn ? -1 : 1; look('lamp:' + id + ':' + lx + ':' + ly, mx(q[0]), mz(q[1]), a => { a.cyl(0, 0, 0, 0.3, 0.3, 'rocks_5', 0x9a9aa0, ROCK(0, { seg: 8 })); a.cyl(0, 0.3, 0, 0.1, 2.9, WD2, POST, { seg: 8, gain: 1.6 });
        a.box(sx * 0.3, 2.95, 0, 0.7, 0.08, 0.08, WD2, POST, LG); lantern(a, sx * 0.55, 2.5, 0); a.box(sx * 0.55, 2.84, 0, 0.03, 0.12, 0.03, GM, GT); a.cyl(0, 3.2, 0, 0.14, 0.08, 'ice', SNOW, { seg: 8 }); }); };
  /* a snow pole: the trail's marker, banded, a red top that shows at night */
  const snowPoles = (id, list) => { list.forEach(([lx, ly, dx, dz]) => { const q = S(id, lx, ly); look('pole:' + id + ':' + lx + ':' + ly, r2(mx(q[0]) + dx), r2(mz(q[1]) + dz), a => { for (let i = 0; i < 5; i++) a.cyl(0, i * 0.5, 0, 0.045, 0.5, null, i % 2 ? 0x1c1c1c : 0xf08a20, { seg: 6 }); a.cyl(0, 2.5, 0, 0.06, 0.16, null, 0xff3020, { seg: 6, glow: 1.4 }); }); }); };
  /* THE RIDGE */
  put('P04-00', 'park_bench', 5, 4, { face: 180 }); put('P04-00', 'psxg_dead_tree_1', 4, 4); dec('P04-00', 'psxg_dead_bush_2', 6, 5); dec('P04-00', 'crow', 5, 6, { y: 0.02 }); lampPost('P04-00', 4, 6, 1);
  dec('P05-00', 'cross', 5, 6, { face: 180 }); dec('P05-00', 'psx_supply_crate_1', 5, 8); dec('P05-00', 'psx_jerrycan_1', 5, 9); put('P05-00', 'yellow_pole', 2, 8); dec('P05-00', 'psxg_dead_bush_1', 4, 5); lampPost('P05-00', 6, 8, 0);
  put('P06-00', 'cable_drum', 6, 6); put('P06-00', 'gas_cylinder_rack', 8, 6, { face: 270 }); dec('P06-00', 'psx_metal_barrel_mp_1', 6, 4); dec('P06-00', 'psxg_dead_bush_2', 8, 5);
  snowPoles('P05-00', [[5, 3, 0, -1.5], [8, 3, 0, -1.5], [11, 3, 0, -1.5]]); snowPoles('P06-00', [[2, 3, 0, -1.5], [5, 3, 0, -1.5]]);
  /* THE PASS GATE's yard: the keeper's horse at its rail, his stores, two lamps */
  put('P04-01', 'hitching_rail', 9, 4, { face: 90 }); put('P04-01', 'horse_brown', 9, 5, { face: 0 }); put('P04-01', 'hw_straw', 8, 4, { face: 90 }); lampPost('P04-01', 4, 3, 0); lampPost('P04-01', 8, 7, 1);
  put('P04-01', 'psx_metal_barrel_mp_0', 8, 3); dec('P04-01', 'psx_wooden_crate_4', 4, 4); dec('P04-01', 'hw_shovel', 4, 5); put('P04-01', 'xmas_snowman_2', 4, 7); dec('P04-01', 'meshy_sandbags', 7, 6, { face: 90 }); dec('P04-01', 'crow', 6, 6, { y: 0.02 });
  /* THE HIGH PASS: the pilgrims' things round the cairn */
  put('P05-01', 'sarsen', 7, 1); put('P05-01', 'stone_urn', 6, 3); dec('P05-01', 'votive_stand', 4, 3, { face: 180 }); dec('P05-01', 'hw_candles', 4, 5); dec('P05-01', 'hw_candles', 6, 5);
  for (const [lx, ly, k] of [[3, 3, 1], [7, 3, 2], [3, 5, 3], [7, 5, 4], [4, 1, 2], [6, 1, 1], [1, 4, 3], [9, 4, 2]]) dec('P05-01', 'psxg_rock_' + k, lx, ly); dec('P05-01', 'crow', 8, 5, { y: 0.02 }); dec('P05-01', 'psxg_stepping_stone_1', 5, 5); dec('P05-01', 'psxg_stepping_stone_2', 5, 3);
  native('P05-01', 'yeti', 8, 3, 200);
  /* THE SWITCHBACKS: the way shelter in the rock's nook with the rescue cache, dead trees, the poles */
  { const q = S('P06-01', 4, 2); look('wayshelter', mx(q[0]), mz(q[1]), a => { leanTo(a, 10.5, 3.5, ctx);
        a.box(3.6, 0, -0.9, 1.5, 0.9, 0.8, null, RED); a.box(3.6, 0.9, -0.9, 1.56, 0.08, 0.86, null, 0x8a1c18); a.box(3.6, 0.34, -0.49, 0.5, 0.14, 0.03, null, 0xf4f4f4, { glow: 0.5 }); a.box(3.6, 0.16, -0.49, 0.14, 0.5, 0.03, null, 0xf4f4f4, { glow: 0.5 });   // the rescue cache: a red chest with a white cross
        board(a, 'RESCUE CACHE', 0, 3.3, 1.72, 4.0, 0.55, '#ffffff', '#8a1c18', 'stencil'); lantern(a, -4.6, 2.3, 1.2); }); }
  dec('P06-01', 'meshy_rope', 5, 2); dec('P06-01', 'psx_supply_crate_1', 3, 2, { face: 20 }); dec('P06-01', 'psx_jerrycan_1', 3, 2); put('P06-01', 'psxg_dead_tree_2', 2, 4); put('P06-01', 'dead_snag', 6, 3); dec('P06-01', 'psxg_dead_bush_1', 5, 5); dec('P06-01', 'psxg_rock_3', 2, 3); put('P06-01', 'yellow_pole', 6, 5);
  { const q = S('P06-01', 2, 3); feat({ k: 'rail', x0: r2(gx(q[0]) - 0.3), z0: gz(q[1]), x1: r2(gx(q[0]) - 0.3), z1: gz(q[1] + 3), model: 'wood_fence', block: false }); }   // a snow fence on the windward side
  snowPoles('P06-01', [[4, 6, 1.5, 1.6], [2, 7, 0, -1.6], [6, 7, 1.6, 0]]);
  /* THE SLEIGH BEND: the sleigh shed in the west nook, the team's horse, hay, a second sleigh out on the snow */
  { const q = S('P04-02', 2, 7); look('sleighshed', mx(q[0]), mz(q[1]), a => { leanTo(a, 10.5, 3.5, ctx); board(a, 'SLEIGHS', 0, 3.3, 1.72, 2.6, 0.55, '#f4ecd8', '#3a2a20', 'fell'); lantern(a, 4.6, 2.3, 1.2); }); R.ARCH[R.ARCH.length - 1].rot = 270; }
  put('P04-02', 'sleigh', 2, 7, { face: 90 }); put('P04-02', 'hw_straw', 2, 6, { face: 0 }); dec('P04-02', 'hw_straw_2', 2, 8); put('P04-02', 'sleigh', 5, 6, { face: 30 }); put('P04-02', 'xmas_snowman', 6, 8);
  put('P04-02', 'hitching_rail', 3, 9, { face: 0 }); put('P04-02', 'horse_black', 4, 9, { face: 90 }); dec('P04-02', 'xmas_gift', 5, 7); dec('P04-02', 'money_sacks', 4, 6); lampPost('P04-02', 4, 5, 0); native('P04-02', 'yeti', 5, 8, 300);
  /* THE FROZEN TARN: the fishers' camp on the east shore, a boat frozen in, the catch by the holes */
  put('P05-02', 'camping_tent', 9, 4, { face: 200 }); put('P05-02', 'campfire', 9, 5); dec('P05-02', 'sea_chest', 8, 5); put('P05-02', 'rowboat', 9, 8, { face: 60 }); dec('P05-02', 'lobster_traps', 8, 8);
  dec('P05-02', 'wooden_bucket', 8, 4); dec('P05-02', 'psx_chair_mp_1', 7, 5); dec('P05-02', 'psx_fish_skeleton_mp_1', 4, 7, { y: 0.06 }); dec('P05-02', 'psx_chair_mp_1', 5, 8); dec('P05-02', 'beach_cooler', 4, 8);
  /* THE ROPE BRIDGE */
  lampPost('P06-02', 4, 4, 0); dec('P06-02', 'psx_wooden_crate_1', 7, 3); dec('P06-02', 'psx_supply_crate_1', 5, 4);
  /* THE TREE LINE, WEST: the woodcutter's camp, and the wolves that watch it */
  { const q = mark('P04-03', 2, 7); look('woodcamp', mx(q[0]), mz(q[1]), a => { woodpile(a, 0, 0, 3.0); woodpile(a, 0, 3.5, 3.0);
        for (const s of [-1, 1]) { a.box(5.0 + s * 0.6, 0, -3.3, 0.08, 0.8, 0.5, WD2, POST, LG); a.box(5.0 + s * 0.6, 0.4, -3.3, 0.5, 0.08, 0.08, WD2, POST, LG); } a.box(5.0, 0.8, -3.3, 1.9, 0.26, 0.26, WD2, 0x8a6444, { gain: 1.5 }); }); mark('P04-03', 2, 8); ghost('P04-03', 2, 7, 3); ghost('P04-03', 2, 8, 3); }   // two wood stacks, a log on a sawhorse
  put('P04-03', 'stump', 4, 7); put('P04-03', 'fallen_log', 5, 8, { face: 20 }); put('P04-03', 'dead_snag', 6, 6); dec('P04-03', 'meshy_camping_tent', 3, 5, { face: 160 }); put('P04-03', 'campfire', 4, 5);
  dec('P04-03', 'wolf', 6, 7); dec('P04-03', 'wolf', 5, 9, { face: 330 }); dec('P04-03', 'wolf', 3, 9, { face: 20 }); dec('P04-03', 'skull', 6, 8); dec('P04-03', 'femur', 5, 7); dec('P04-03', 'trap_bear_open', 3, 6); dec('P04-03', 'psx_hand_saw_1', 4, 6, { y: 0.02 });
  /* THE TREE LINE: the climbers' camp */
  put('P05-03', 'camping_tent', 6, 4, { face: 135 }); put('P05-03', 'camping_tent', 6, 7, { face: 20 }); put('P05-03', 'campfire', 7, 5); dec('P05-03', 'meshy_fallen_log', 8, 6, { face: 40 }); dec('P05-03', 'meshy_stump', 6, 5); dec('P05-03', 'meshy_stump', 8, 5);
  put('P05-03', 'cauldron', 7, 4); dec('P05-03', 'footlocker', 5, 4); dec('P05-03', 'psx_metal_barrel_mp_2', 9, 6); dec('P05-03', 'psx_old_mattress_mp_1', 9, 5, { y: 0.03 }); dec('P05-03', 'rabbit', 9, 4, { y: 0.02 }); dec('P05-03', 'rabbit', 6, 6, { y: 0.02 }); native('P05-03', 'yeti', 8, 4, 220);
  /* THE WARMING HUT's yard */
  { const q = mark('P06-03', 2, 4); look('outhouse', mx(q[0]), mz(q[1]), a => { a.box(0, 0, 0, 1.5, 2.3, 1.5, WD, 0x8a6a4a, { gain: 1.7 }); a.roof('shed', 0, 2.3, 0, 1.9, 0.5, 1.9, 'ice', SNOW, { ry: 270 }); a.box(0.76, 0, 0, 0.04, 2.0, 0.8, WD2, 0x5a4030, { gain: 1.6 }); a.box(0.79, 1.5, 0, 0.03, 0.22, 0.22, 'marble_light', PANE, { glow: 1.0 }); }); ghost('P06-03', 2, 4, 1.5); }
  put('P06-03', 'fallen_log', 3, 7, { face: 80 }); put('P06-03', 'signpost', 8, 6, { face: 0 }); lampPost('P06-03', 2, 6, 0); lampPost('P06-03', 8, 4, 1); put('P06-03', 'stump', 2, 5); dec('P06-03', 'dog', 5, 7); put('P06-03', 'xmas_snowman_3', 7, 7);
  dec('P06-03', 'psx_metal_barrel_mp_2', 8, 3); dec('P06-03', 'hw_shovel', 3, 6); dec('P06-03', 'psx_wooden_crate_2', 8, 5);
};
