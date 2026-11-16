/* THE MOUNTAINS · MOUNT SHASTA (district S, 20 plots of room `site_prebuilt_shasta_mountains`)
   One of the six district files of bake-mountains.js (THE DISTRICT FILES there; rules: docs/notes/areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES").
   One thread = this one file. Never edit bake-mountains.js, layout.json or another district's file without a note on the board (docs/notes/claims.md).
   After an edit: `node bake-mountains.js` (writes data.js between MOUNTAINS-BEGIN / END; `--dry-run` prints the counts only), then RULE #1.

   THE PLOTS (id, name, level; a level is 1.75 m; the plan's squares are layout.json, the tool's file):
     P13-00 Shastina (18)                    P14-00 The Summit (22)                  P15-00 The Glacier (18)
     P13-01 The Red Banks (17)               P14-01 Helen Lake (15)                  P15-01 The Steam Vents (16)
     P13-02 Avalanche Gulch (13)             P14-02 The Fork (12)                    P15-02 The Scree (13)
     P13-03 Bunny Flat (10)                  P14-03 Panther Meadows (10)             P15-03 The Old Lava (10)
     P13-04 The Last Trees (9)               P14-04 The Spring (9)                   P13-05 The Switchback, upper (9)
     P14-05 The Lookout (9)                  P13-06 The Switchback, lower (8)        P14-06 The Boulder Field (8)
     P13-07 The Trailhead (8)                P14-07 The Upper Shelf (8)

   WHAT STANDS HERE TODAY (the district thread, 11-16; pass by pass in areas-complexes.md "MOUNT SHASTA, THE DISTRICT THREAD")
   - SEVEN WALKED-IN BUILDINGS (one helper, `hut`; sign face `alfa`): the Ranger Station (the Trailhead), Bigfoot's Cabin (Bunny Flat), the Shaman's Lodge and the Ki Dojo
     (Panther Meadows), the Spring Shrine (the Spring), the Fire Lookout (the Lookout), the Climbers' Hut (Helen Lake, the frozen lake)
   - THE LANDMARKS: the Summit's rim of standing stones + its cairn and the cloud; the Glacier's seracs; Shastina's cairn; the Red Banks; the Lemuria adit's timber set
     at the Steam Vents; the Fork's great cairn + windbreak; the Trailhead's gate; the spring head
   - The camps, the natives (bigfoot, shaman, ki fighter, yeti, nordic), DOOR HQ's bay door on Bunny Flat (ctx.anchor('bayShasta')), the Lemuria door (ctx.anchor('lemuria'))

   KNOWN MISSING OR WRONG
   - The Upper Shelf (P14-07) has no door down to the Woods (the plan drew two joins; only the Trailhead's is cut). That door would be the tool's and the Woods holder's
   - No encounter table of its own (the room's table is joined from the district files that export one)

   THE TOOL'S, NOT YOURS (shared pieces that stand in this district)
   - The Trailhead's door `woods` (P13-07, south wall; bake-woods.js holds the far end), the doors `hills` (the Scree, P15-02) and `saddle` (the Glacier, P15-00) on the east wall to the Hollywood Hills
   - The heights, the paint (volcanic rock, dirt trail under level 12), the tree zones, the sky, the edges

   THE HOOKS (export any of them; ctx is described in bake-mountains.js "THE DISTRICT FILES")
   - tailor(t)   before the trails are cut: t.set(plotId, lx, ly, ch) / t.get(plotId, lx, ly) change a square of YOUR plots (the letters: layout.json `legend`)
   - apply(ctx)  the standing things: buildings you walk into (ctx.building), anything that takes squares before the dressing
   - build(ctx)  the dressing: put (a blocker on a square's middle), dec (decor, jittered), tree, native, look (an `arch` parts list), feat (any terrain row)
   Squares are S(plotId, lx, ly), 0..11 in a plot, x east, y south. S() throws on a plot that is not this district's. Your own random stream: ctx.rnd.
   A blocker stands centred on a whole 3.5 m square (owner-rules.md); the tool throws on a piece in the rock or on a taken square. */
'use strict';

/* ══ THE DISTRICT THREAD (2026-11-16, mondo's order: every district prototyped; docs/plans/DISTRICT_THREAD_BRIEF.md). Notes: areas-complexes.md "MOUNT SHASTA, THE DISTRICT THREAD".
   The district's one sign face: `alfa` (a park's routed slab letters, cream on brown). Parts frame of a building: its middle, x along the front, +z out of the front. ══ */
const WD2c = 'urban:WoodGeneric1a', TR = 0x3a2a20, STONE = 0x9a9aa0, CREAM = '#f0e2c0', BROWN = '#4a3222', FONT = 'alfa', GLASS = 0x2c3c50;
const onFloor = B => { const p = B.put; B.put = (key, lx, lz, q) => p(key, lx, lz, Object.assign({ floor: true }, q || {})); return B; };   // (the pilot's rule: every inside prop is `floor: true`)
const BUILT = {};
/* a window: dark glass in a dark timber frame with a sill (ew: on a side wall, x = along that wall, z = the wall's plane) */
const win = (a, x, y, z, w, h, ew, WD2) => { const B = (px, py, pz, bw, bh, bd, key, tint, q) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, q) : a.box(px, py, pz, bw, bh, bd, key, tint, q), o = z < 0 ? -1 : 1;
    B(x, y, z, w, h, 0.06, 'marble_light', GLASS, { glow: 0.7 }); B(x, y, z + o * 0.03, 0.08, h, 0.08, WD2, TR); B(x, y + h / 2 - 0.04, z + o * 0.03, w, 0.08, 0.08, WD2, TR);
    for (const s of [-1, 1]) B(x + s * (w / 2 + 0.05), y, z + o * 0.03, 0.1, h, 0.1, WD2, TR);
    B(x, y - 0.12, z + o * 0.06, w + 0.4, 0.12, 0.2, WD2, TR); B(x, y + h, z + o * 0.05, w + 0.3, 0.12, 0.16, WD2, TR); };
/* the same window seen from inside: the day in it, on the lining (z = the lining's plane) */
const winIn = (a, x, y, z, w, h, ew, WD2) => { const B = (px, py, pz, bw, bh, bd, key, tint, q) => ew ? a.box(pz, py, px, bd, bh, bw, key, tint, q) : a.box(px, py, pz, bw, bh, bd, key, tint, q), o = z < 0 ? 1 : -1, g = { glow: 0.9, gain: 1.5 };
    B(x, y, z + o * 0.03, w, h, 0.04, 'marble_light', 0xc4dcf0, { glow: 1.0 }); B(x, y, z + o * 0.06, 0.07, h, 0.05, WD2, 0x5a4030, g); B(x, y + h / 2 - 0.035, z + o * 0.06, w, 0.07, 0.05, WD2, 0x5a4030, g);
    for (const s of [-1, 1]) B(x + s * (w / 2 + 0.05), y, z + o * 0.06, 0.1, h, 0.06, WD2, 0x5a4030, g); B(x, y - 0.1, z + o * 0.09, w + 0.3, 0.1, 0.16, WD2, 0x5a4030, g); B(x, y + h, z + o * 0.06, w + 0.2, 0.1, 0.06, WD2, 0x5a4030, g); };
/* the lit inside (the pilot's finding: a building's own inside takes no light): walls, floor and ceiling again, a hand inside, drawn with `glow` */
const lit = (a, w, h, d, dr, key, tint, g, WD2) => { const top = h - 0.36, i = 0.3, t = 0.04, q = { glow: g, gain: 1.7 }, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2, e = w / 2 - i;
    a.box(0, 0, -(d / 2 - i), w - 2 * i, top, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - i), 0, 0, t, top, d - 2 * i, key, tint, q);
    a.box((-e + x0) / 2, 0, d / 2 - i, x0 + e, top, t, key, tint, q); a.box((x1 + e) / 2, 0, d / 2 - i, e - x1, top, t, key, tint, q); a.box(dr.lx, 2.2, d / 2 - i, dr.cw, top - 2.2, t, key, tint, q);
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, WD2, 0x8a6a48, { sides: false, top: false, under: true, glow: g * 0.75, gain: 1.6 }); };
/* a hearth against the back wall, open mouth (the fire is the catalogue's `hearth_fire`, put in by build), field stone */
const hearth = (a, cx, d, top, WD2) => { const z0 = -d / 2 + 0.3, zc = z0 + 0.45, B = 'rocks_5', T = 0xa8a8b0, g = { glow: 0.8 };
    for (const s of [-1, 1]) a.box(cx + s * 0.75, 0, zc, 0.4, 1.1, 0.9, B, T, g); a.box(cx, 1.1, zc, 1.9, 0.4, 0.9, B, T, g);
    a.box(cx, 0, z0 + 0.04, 1.1, 1.1, 0.06, B, 0x241a16, g); a.box(cx, 0.16, zc, 1.1, 0.04, 0.9, B, 0x4a3a34, g);
    a.box(cx, 1.5, zc + 0.04, 2.2, 0.14, 1.06, WD2, 0x6a4a34, { glow: 0.8, gain: 1.4 }); a.box(cx, 1.64, z0 + 0.2, 1.3, top - 1.64, 0.4, B, T, g); };
/* THE HUT: every walked-in building of the district. q: h, rh, tint, stone (field-stone walls), roof ('gable' | 'hip' | 'pyramid'), front (the gable over the door),
   snow (a snow roof, above the tree line), roofTint, chimney (x of a stone chimney on the back wall, with a hearth), porch, name, inKey / inTint (the lining), wide (the front window's width) */
const hut = (a, w, d, dr, q, ctx) => { const { WD, WD2, SHG, FLR } = ctx, h = q.h, wk = q.stone ? 'rocks_5' : WD, tint = q.tint;
    a.shell(w, h, d, wk, tint, dr, q.stone ? [3.5, 3.5] : [3.5, 1.75]); a.P.slice(-2).forEach(p => { p.gain = q.stone ? 1.7 : 1.9; });
    a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, 'rocks_5', 0x9c9ca4, { faces: 'blr', top: false, gain: 1.5 });                                   // the stone foot
    for (const s of [-1, 1]) { const x0 = dr.lx + s * (dr.cw / 2 + 0.25), e = s * (w / 2 + 0.2); a.box((x0 + e) / 2, 0, d / 2 + 0.1, Math.abs(e - x0), 0.9, 0.2, 'rocks_5', 0x9c9ca4, { gain: 1.5 }); }
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, q.floor || FLR, q.floorTint || 0x8c7a62, { uv: [1.75, 1.75], glow: 0.7 });
    lit(a, w, h, d, dr, q.inKey || WD, q.inTint || 0xd8b088, 0.85, WD2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.42, h, 0.42, q.stone ? 'rocks_5' : WD2, q.stone ? 0x8c8c94 : TR, q.stone ? { gain: 1.5 } : null);
    const rk = q.snow ? 'ice' : SHG, rt = q.snow ? 0xf4f8ff : (q.roofTint || 0x6a5038), rq = { gain: 1.6 };
    if (q.roof === 'hip' || q.roof === 'pyramid') a.roof(q.roof, 0, h, 0, w + 2.2, q.rh, d + 2.2, rk, rt, rq);
    else if (q.front) a.roof('gable', 0, h, 0, d + 1.8, q.rh, w + 1.8, rk, rt, { ry: 90, keyEnd: wk, tintEnd: tint, gain: 1.8 });
    else a.roof('gable', 0, h, 0, w + 1.8, q.rh, d + 1.8, rk, rt, { keyEnd: wk, tintEnd: tint, gain: 1.8 });
    if (q.roof === 'hip' || q.roof === 'pyramid') { for (const s of [-1, 1]) { a.box(0, h - 0.14, s * (d / 2 + 1.0), w + 2.2, 0.14, 0.2, WD2, TR, { roof: true }); a.box(s * (w / 2 + 1.0), h - 0.14, 0, 0.2, 0.14, d + 2.2, WD2, TR, { roof: true }); } }
    else if (q.front) a.box(0, h + q.rh - 0.04, 0, 0.22, 0.18, d + 2.0, WD2, TR, { roof: true }); else a.box(0, h + q.rh - 0.04, 0, w + 2.0, 0.18, 0.22, WD2, TR, { roof: true });   // the ridge board
    a.box(0, h - 0.2, 0, w + 0.16, 0.2, d + 0.16, WD2, TR, { top: false });                                                       // the wall plate under the eaves
    /* the door: posts, a head, a stone step */
    for (const s of [-1, 1]) a.box(dr.lx + s * (dr.cw / 2 + 0.12), 0, d / 2 + 0.1, 0.24, 2.4, 0.24, WD2, TR); a.box(dr.lx, 2.25, d / 2 + 0.1, dr.cw + 0.6, 0.24, 0.26, WD2, TR);
    a.box(dr.lx, 0, d / 2 + 0.6, dr.cw + 1.0, 0.14, 1.1, 'rocks_5', 0xa8a8b0);
    /* the windows: the front (beside the door), the sides, the back (when no chimney stands there) */
    const fwW = q.wide || 1.6, side = dr.lx < 0 ? 1 : -1, fx = side * Math.max(w / 4 + 0.3, Math.abs(dr.lx) + dr.cw / 2 + 0.7 + fwW / 2);
    const W2 = (x, z, ww, ew) => { win(a, x, 1.0, z, ww, 1.4, ew, WD2); winIn(a, x, 1.0, z - Math.sign(z) * 0.4, ww, 1.4, ew, WD2); };
    if (Math.abs(fx) + fwW / 2 < w / 2 - 0.3) W2(fx, d / 2 + 0.08, fwW, false);
    if (w >= 10 && Math.abs(-fx) + fwW / 2 < w / 2 - 0.3 && Math.abs(-fx - dr.lx) > dr.cw / 2 + fwW / 2 + 0.4) W2(-fx, d / 2 + 0.08, fwW, false);
    for (const s of [-1, 1]) for (let z = -d / 2 + 1.75; z < d / 2; z += 3.5) W2(z, s * (w / 2 + 0.08), 1.5, true);
    if (!q.chimney) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) W2(x, -d / 2 - 0.08, 1.5, false);
    else for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) if (Math.abs(x - q.chimney) > 2.2) W2(x, -d / 2 - 0.08, 1.5, false);
    if (q.chimney != null && q.chimney !== false) { const cx = q.chimney; a.box(cx, 0, -d / 2 - 0.4, 1.5, h + q.rh + 0.8, 1.0, 'rocks_5', STONE, { roof: true }); a.box(cx, h + q.rh + 0.8, -d / 2 - 0.4, 1.7, 0.2, 1.2, 'rocks_5', 0x6c6c74, { roof: true }); hearth(a, cx, d, h - 0.36, WD2); }
    if (q.porch) { a.box(0, 0, d / 2 + 1.3, w, 0.16, 2.5, FLR, 0x8c7a62); const n = Math.max(2, Math.round(w / 3.5));
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - dr.lx) < 0.9) continue; a.box(x, 0, d / 2 + 2.4, 0.24, 2.7, 0.24, WD2, TR); }
        a.roof('shed', 0, 2.7, d / 2 + 1.35, w + 0.6, 0.7, 2.9, rk, rt, rq); }
    /* the lantern by the door (a real piece: a hook, a cage, a warm pane) and the board over it */
    { const lx = dr.lx - side * (dr.cw / 2 + 0.55), z = d / 2 + 0.2; a.box(lx, 1.95, z - 0.06, 0.06, 0.06, 0.2, WD2, TR); a.box(lx, 1.62, z + 0.06, 0.2, 0.3, 0.2, 'marble_light', 0xffb050, { glow: 1.3 }); a.box(lx, 1.92, z + 0.06, 0.26, 0.05, 0.26, 'gunmetal', 0x3a3e44); a.box(lx, 1.58, z + 0.06, 0.26, 0.04, 0.26, 'gunmetal', 0x3a3e44); }
    if (q.name) { const bw = Math.min(w - 1.2, q.name.length * 0.42 + 1.4), y = q.porch ? 3.0 : q.front ? h + 0.2 : 2.62, z = d / 2 + (q.porch ? 2.72 : q.front ? 0.14 : 0.16), rr = (q.porch || q.front) ? { roof: true } : null;
        a.sign(q.name, 0, y, z, bw, 0.8, CREAM, BROWN, FONT, rr); a.box(0, y - 0.08, z - 0.03, bw + 0.2, 0.96, 0.05, WD2, TR, rr); } };
/* a cairn: flat stones stacked, tapering (a look; its square is taken and blocked by a ghost wall) */
const cairn = (a, k, top) => { let y = 0; const n = Math.round(4 * k); for (let i = 0; i < n; i++) { const r = (0.7 - 0.42 * i / n) * k, hh = 0.2 + 0.05 * ((i * 7) % 3); a.cyl(((i * 37) % 7 - 3) * 0.03 * k, y, ((i * 53) % 7 - 3) * 0.03 * k, r, hh, 'rocks_5', i % 2 ? 0xa8a8b0 : 0xc0c0c8, { seg: 7, r2: r * 0.9, gain: 1.7, a0: i * 23 }); y += hh; } if (top) { a.box(0, y, 0, 0.09, 0.9, 0.09, WD2c, 0x8a6a48, { gain: 1.6 }); a.box(0.2, y + 0.6, 0, 0.4, 0.26, 0.03, 'marble_light', 0xc8482c, { glow: 0.9 }); } };
/* blue ice: a group of seracs (tapered prisms of the glacier's sheet) */
const seracs = (a, list) => { for (const [x, z, r, hh, lean] of list) { const q = { seg: 5, glow: 0.92 }; a.cyl(x, 0, z, r, hh, 'ice_1', 0xa8d4f8, Object.assign({ r2: r * (lean || 0.3), a0: x * 40 }, q)); a.cyl(x + r * 0.7, 0, z + r * 0.5, r * 0.7, hh * 0.6, 'ice_1', 0xc8e6ff, Object.assign({ r2: r * 0.25, a0: 30 }, q)); a.cyl(x - r * 0.6, 0, z + r * 0.7, r * 0.55, hh * 0.38, 'ice_1', 0x8cc4f0, Object.assign({ r2: r * 0.3, a0: 55 }, q)); a.dome(x, 0, z, r * 1.7, 0.5, 'ice', 0xf4f8ff, { seg: 8, rings: 2 }); } };
const block = (R, id, lx, ly) => { const q = R.S(id, lx, ly), k = q[0] + ':' + q[1]; if (!R.open(q[0], q[1]) || R.cell[q[1]][q[0]] === 'B' || R.taken.has(k)) throw new Error('S: a piece on a square that is not free: ' + id + ' ' + lx + ',' + ly); R.taken.add(k);
    R.feat({ k: 'wall', x0: R.r2(R.mx(q[0]) - 0.9), z0: R.mz(q[1]), x1: R.r2(R.mx(q[0]) + 0.9), z1: R.mz(q[1]), t: 1.8, h: 1.2, ghost: true, rail: false }); return [R.mx(q[0]), R.mz(q[1])]; };

/* the ground a building stands on, in metres over the room's floor (the tool's own rule, bake-mountains.js heights(): the plots' levels blended, read at the
   middle of the building's front). A prop's `y` from 1 up is a height from the ROOM's floor, so a hung piece needs it: UP(B, h) = h over that building's floor */
const baseOf = R => { if (R._sBase) return R._sBase; const o = R.o, N = R.N, by = {}; R.plots.forEach(p => { by[p.lx + ':' + p.ly] = p; });
    const cl = (v, a, b) => Math.max(a, Math.min(b, v)), lv = (i, j) => { i = cl(i, 0, o.pw - 1); j = cl(j, 0, o.ph - 1); const p = by[i + ':' + j]; return ((p ? p.level : o.deadLevel(i, j)) - o.base) * 1.75; };
    const prof = (i, pz) => { const f = o.zflat ? o.zflat(i) : 1 / 3, qz = pz - 0.5, j = cl(Math.floor(qz), 0, o.ph - 2), v = cl((qz - j - f / 2) / (1 - f), 0, 1); return lv(i, j) * (1 - v) + lv(i, j + 1) * v; };
    return (R._sBase = (cx, cy) => { const px = cx / N - 0.5, i = cl(Math.floor(px), 0, o.pw - 2), u = cl((px - i - 1 / 6) / (2 / 3), 0, 1); return prof(i, cy / N) * (1 - u) + prof(i + 1, cy / N) * u; }); };
const groundAt = (R, plot, q) => { const base = baseOf(R), a0 = R.S(plot, q[0], q[1]), x0 = a0[0], y0 = a0[1], x1 = x0 + q[2] - q[0], y1 = y0 + q[3] - q[1], sd = q[4];
    return base(sd === 'E' ? x1 : sd === 'W' ? x0 : (x0 + x1) / 2, sd === 'S' ? y1 : sd === 'N' ? y0 : (y0 + y1) / 2); };
const gnd = (R, plot, lx, ly) => { const q = R.S(plot, lx, ly); return baseOf(R)(q[0] + 0.5, q[1] + 0.5); };   // the walked ground at a square's middle
const UP = (B, h) => Math.round((B.G + 0.16 + h) * 100) / 100, WALL = (B, h, face) => ({ mount: 0, y: UP(B, h), face });

/* the plan's squares this district opens (rock or trees to walked ground) so its buildings have a doorstep */
exports.tailor = t => {
    t.set('P14-01', 0, 4, 's'); t.set('P14-01', 1, 4, 's');           // the Climbers' Hut's doorstep, off the trail's end
    t.set('P14-03', 1, 2, 'g'); t.set('P14-03', 2, 2, 'g');           // the Shaman's lodge
    t.set('P13-03', 8, 9, 'g');                                       // Bigfoot's cabin
};

/* ══ THE BUILDINGS (pass 1, exteriors): seven walked-in buildings, named for what they are ══ */
exports.apply = ctx => {
    const { building } = ctx, mk = (id, plot, q, h, opt, hq) => { BUILT[id] = onFloor(building(id, plot, q, h, opt || {}, (a, w, d, dr) => hut(a, w, d, dr, Object.assign({ h }, hq), ctx))); BUILT[id].q = Object.assign({ h }, hq); BUILT[id].G = groundAt(ctx, plot, q); return BUILT[id]; };
    mk('ranger', 'P13-07', [2, 4, 4, 7, 'E'], 3.5, {}, { rh: 2.4, tint: 0x7a5a40, roofTint: 0x4a5a3c, porch: true, chimney: 3.4, name: 'RANGER STATION' });
    mk('bigfoot', 'P13-03', [9, 7, 11, 10, 'W'], 4.6, { leaf: 'leaf_shabby_wood' }, { rh: 3.0, tint: 0x7a5c40, roofTint: 0x4a3a2a, chimney: -3.2, front: true, name: "BIGFOOT'S CABIN" });
    mk('shaman', 'P14-03', [1, 0, 4, 2, 'S'], 3.5, {}, { rh: 3.4, roof: 'pyramid', tint: 0x8a6a48, roofTint: 0x7a6040, inTint: 0xe0b890, name: "THE SHAMAN'S LODGE" });
    mk('dojo', 'P14-03', [8, 10, 11, 12, 'N'], 3.5, { leaf: 'leaf_frame_only' }, { rh: 2.6, roof: 'hip', tint: 0x6a3a2c, roofTint: 0x3c4448, inTint: 0xe8d8b8, wide: 2.2, name: 'THE KI DOJO' });
    mk('shrine', 'P14-04', [8, 3, 10, 5, 'W'], 3.5, { leaf: 'leaf_frame_only' }, { rh: 2.2, stone: true, tint: 0xb0b0b8, roofTint: 0x5a4a3a, front: true, inKey: 'rocks_5', inTint: 0xd8d0c0, name: 'SPRING SHRINE' });
    mk('lookout', 'P14-05', [2, 10, 5, 12, 'N'], 3.5, {}, { rh: 2.0, roof: 'hip', tint: 0x8a7a5a, roofTint: 0x4a5a3c, wide: 2.6, name: 'FIRE LOOKOUT' });
    mk('climbers', 'P14-01', [0, 2, 3, 4, 'S'], 3.5, {}, { rh: 2.4, stone: true, snow: true, tint: 0xa0a0a8, chimney: 3.2, inTint: 0xc8a888, name: "CLIMBERS' HUT" });
};

exports.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
  /* ── MOUNT SHASTA ── */
  put('P14-00', 'cave_stone', 5, 5); dec('P14-00', 'cave_stone', 6, 7); put('P14-00', 'signpost', 7, 8, { face: 180 }); { const g0 = gnd(R, 'P14-00', 7, 6), q = S('P14-00', 7, 6), cx = mx(q[0]), cz = mz(q[1]), r2 = ctx.r2; for (const [dx, dz, dy, sp] of [[0, 0, 16, 30], [-11, 2, 15, 20], [11, -2, 15, 20], [0, -1, 20, 16]]) props.push({ key: 'white_cloud', x: r2(cx + dx), z: r2(cz + dz), y: r2(g0 + dy), span: sp, face: 90 }); }   // THE SUMMIT: the crater, the cloud parked over it
  dec('P13-00', 'cave_stone', 5, 4); dec('P15-00', 'ocean_rock_5', 6, 5); dec('P13-01', 'cave_stone', 5, 5); dec('P13-01', 'cave_stone', 4, 6);
  put('P14-01', 'camping_tent', 3, 4, { face: 140 }); put('P14-01', 'camping_tent', 8, 4, { face: 220 }); put('P14-01', 'campfire', 5, 3); dec('P14-01', 'sea_chest', 6, 2); native('P14-01', 'yeti', 7, 9, 300, say('shasta', 'yeti'));
  { const q = S('P15-01', 5, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 3.6, rz: 3.0, y: -0.2, depth: 0.5, key: 'water', bank: 0.8 }); R.taken.add(q[0] + ':' + q[1]);   // THE STEAM VENTS: the warm pool
    const d = S('P15-01', 8, 6); R.anchor('lemuria', { x: mx(d[0]), z: mz(d[1]), face: 270 }); R.taken.add(d[0] + ':' + d[1]); }
  native('P15-01', 'nordic', 3, 5, 90, say('shasta', 'nordic')); dec('P15-01', 'cave_stone', 4, 8); dec('P15-01', 'cave_stone', 6, 9);
  dec('P13-02', 'ocean_rock_6', 5, 6); dec('P13-02', 'ocean_rock_7', 4, 7); put('P14-02', 'signpost', 5, 4, { face: 0 }); dec('P15-02', 'cave_stone', 3, 5); dec('P15-02', 'ocean_rock_8', 4, 6);
  put('P13-03', 'campfire', 4, 6); put('P13-03', 'camping_tent', 2, 5, { face: 120 }); put('P13-03', 'camping_tent', 6, 7, { face: 240 }); put('P13-03', 'park_bench', 4, 8, { face: 0 }); put('P13-03', 'signpost', 6, 4, { face: 180 });
  native('P13-03', 'bigfoot', 2, 7, 60, say('shasta', 'bigfoot')); dec('P13-03', 'fallen_log', 5, 9);
  dec('P14-03', 'candle_ring', 5, 6); dec('P14-03', 'instrument_drum', 6, 6); dec('P14-03', 'instrument_tambourine', 4, 7); dec('P14-03', 'instrument_guitar_lying', 6, 8); native('P14-03', 'shaman', 5, 5, 180); native('P14-03', 'ki fighter', 8, 7, 270);
  dec('P15-03', 'cave_stone', 4, 6); dec('P15-03', 'dead_snag', 5, 7);
  { const q = S('P13-03', 8, 6); R.anchor('bayShasta', { x: mx(q[0]), z: mz(q[1]), face: 270 }); R.taken.add(q[0] + ':' + q[1]); }   // Room 14179's cabin door stands on Bunny Flat
  /* the trail down to the Woods */
  dec('P13-04', 'fallen_log', 7, 5); dec('P13-04', 'stump', 6, 6); { const q = S('P14-04', 6, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 5.0, rz: 5.0, y: -0.25, depth: 0.8, key: 'water', bank: 1.0 }); }   // THE SPRING
  { const a = S('P14-04', 6, 9), b = S('P14-04', 6, 11); feat({ k: 'deck', x0: mx(a[0]), z0: r2(gz(a[1]) - 1.75), x1: mx(a[0]), z1: r2(gz(b[1] + 1) + 1.75), w: 3.5, y: 0.3 }); }
  put('P14-05', 'park_bench', 6, 8, { face: 90 }); put('P14-05', 'lesson_sign', 4, 7, { face: 180 }); dec('P13-05', 'cave_stone', 6, 4);
  for (const d of [[6, 5], [8, 5], [5, 6], [9, 7], [7, 8]]) put('P14-06', 'cave_stone', d[0], d[1]); dec('P13-06', 'fallen_log', 6, 3);
  put('P13-07', 'signpost', 5, 5, { face: 180 }); put('P13-07', 'campfire', 7, 4); dec('P14-07', 'cave_stone', 7, 4); dec('P14-07', 'sea_chest', 8, 3);
  /* ══ PASS 1 (11-16): THE LANDMARKS OUTSIDE. Looks are textured shapes; a look that should stop a walker takes its square with block(). ══ */
  /* THE SUMMIT: the crater's rim (standing stones round the vent), the summit cairn with its register box */
  for (const [lx, ly, key, h] of [[6, 5, 'menhir', 2.4], [8, 5, 'sarsen', 3.0], [9, 7, 'menhir', 2.0], [8, 9, 'sarsen', 2.6], [5, 8, 'menhir', 2.8], [4, 6, 'cave_stone', 1.3]]) put('P14-00', key, lx, ly, { h, face: (lx * 67 + ly * 31) % 360 });
  { const p = block(R, 'P14-00', 7, 4); look('summit:cairn', p[0], p[1], a => { cairn(a, 1.5, true); a.box(0.9, 0, 0.3, 0.5, 0.4, 0.36, 'gunmetal', 0x5a6068); a.box(0.9, 0.4, 0.3, 0.54, 0.05, 0.4, 'gunmetal', 0x3a3e44); }); }
  /* THE GLACIER: seracs along its north and east edges, a crevasse-blue pool of melt */
  for (const [lx, ly, L] of [[6, 2, [[0, 0, 1.1, 4.2], [-1.2, 0.6, 0.8, 2.8]]], [9, 3, [[0, 0, 1.3, 5.0, 0.4], [1.0, -0.8, 0.7, 3.0]]], [10, 6, [[0, 0, 1.0, 3.6], [-0.4, 1.1, 0.8, 2.4]]], [4, 4, [[0, 0, 0.9, 3.0], [0.9, 0.7, 0.6, 2.0]]], [8, 8, [[0, 0, 1.0, 3.2, 0.5]]]]) { const p = block(R, 'P15-00', lx, ly); look('glacier:' + lx + ':' + ly, p[0], p[1], a => seracs(a, L)); }
  /* SHASTINA: the small cone's own cairn; THE RED BANKS: red pumice walls (the banks) along the west of the shelf */
  { const p = block(R, 'P13-00', 4, 4); look('shastina:cairn', p[0], p[1], a => cairn(a, 1.2, true)); }
  for (const [lx, ly, w, h] of [[3, 4, 3.2, 2.6], [3, 6, 3.0, 3.4], [4, 7, 2.6, 2.2]]) { const p = block(R, 'P13-01', lx, ly); look('redbanks:' + lx + ':' + ly, p[0], p[1], a => { a.dome(0, 0, 0, w / 2, h, 'rocks_5', 0xb0563c, { rz: 1.5, seg: 7, rings: 3 }); a.dome(0.9, 0, 0.8, w / 3, h * 0.5, 'rocks_5', 0x9c4a34, { seg: 6, rings: 3 }); }); }
  /* THE STEAM VENTS: the adit's timber set round the Lemuria door (the door is the tool's; the frame is ours), a spoil heap */
  { const q = S('P15-01', 8, 6), x = mx(q[0]), z = mz(q[1]); look('adit:frame', x, z, a => { for (const s of [-1, 1]) a.box(0.5, 0, s * 1.45, 0.4, 3.3, 0.4, WD2, 0x4a3626); a.box(0.5, 3.1, 0, 0.5, 0.4, 3.7, WD2, 0x4a3626); a.box(0.9, 3.5, 0, 1.2, 0.3, 4.4, 'rocks_5', 0x6c6c74);
      for (const s of [-1, 1]) a.box(1.3, 0, s * 2.1, 1.6, 2.4 + s * 0.3, 1.0, 'rocks_5', 0x74747c); a.sign('LEMURIA ADIT', 0.2, 3.56, 0, 0.05, 0.5, CREAM, BROWN, FONT); }); }
  { const p = block(R, 'P15-01', 7, 8); look('adit:spoil', p[0], p[1], a => { a.dome(0, 0, 0, 1.5, 1.1, 'rocks_5', 0x5a5a62, { seg: 7, rings: 3 }); a.dome(1.0, 0, -0.6, 0.8, 0.6, 'rocks_5', 0x6a6a72, { seg: 6, rings: 3 }); }); }
  /* THE FORK: the hub of the three trails: the great cairn, a stone windbreak with a bench in it */
  { const p = block(R, 'P14-02', 7, 4); look('fork:cairn', p[0], p[1], a => cairn(a, 2.0, true)); }
  { const q = S('P14-02', 9, 2), x = mx(q[0]), z = mz(q[1]); for (const d of [[9, 1], [10, 2]]) block(R, 'P14-02', d[0], d[1]);
    look('fork:windbreak', x, z, a => { a.cyl(0, 0, 0, 4.2, 1.3, 'rocks_5', 0x8c8c94, { ri: 3.5, arc: 200, a0: 190, seg: 20 }); a.cyl(0, 1.3, 0, 4.25, 0.14, 'ice', 0xf4f8ff, { ri: 3.45, arc: 200, a0: 190, seg: 20 }); }); put('P14-02', 'park_bench', 9, 2, { face: 200 }); }
  /* THE TRAILHEAD: the trail's gate (two posts in the trees, a beam, the park's board) and the notice board */
  { const q = S('P13-07', 6, 9), x = ctx.r2(mx(q[0]) + 1.75), z = mz(q[1]); look('trailhead:gate', x, z, a => { for (const s of [-1, 1]) { a.cyl(s * 4.4, 0, 0, 0.3, 4.6, WD2, 0x5a4030, { seg: 8 }); a.cyl(s * 4.4, 0, 0, 0.55, 0.7, 'rocks_5', 0x8c8c94, { seg: 8 }); }
      a.box(0, 3.9, 0, 9.6, 0.36, 0.36, WD2, 0x5a4030); a.sign('MOUNT SHASTA', 0, 3.0, 0.06, 5.2, 0.85, CREAM, BROWN, FONT); a.sign('MOUNT SHASTA', 0, 3.0, -0.06, 5.2, 0.85, CREAM, BROWN, FONT, { ry: 180 }); a.box(0, 2.94, 0, 5.4, 0.97, 0.08, WD2, TR); }); }
  put('P13-07', 'missing_board', 7, 6, { face: 270 }); put('P13-07', 'psx_toilet_cabin_mp_1', 9, 5, { face: 270 });
  /* THE SPRING: the spring head (a stone basin the water comes out of) above the pool */
  { const p = block(R, 'P14-04', 6, 3); look('spring:head', p[0], p[1], a => { a.cyl(0, 0, 0, 1.2, 0.7, 'rocks_5', 0xa8a8b0, { seg: 10, ri: 0.85 }); a.cyl(0, 0, 0, 0.86, 0.55, 'ice_1', 0x9fd8f0, { seg: 10, glow: 0.9 }); a.box(0, 0, -1.1, 1.6, 1.7, 0.6, 'rocks_5', 0x8c8c94); a.box(0, 1.0, -0.75, 0.3, 0.2, 0.3, 'rocks_5', 0x6c6c74); }); }
  /* ══ PASS 2 (11-16): THE INSIDES. A building's frame: x along its front, +z out of the door; `face` 180 looks out of the front, 0 at the back wall, 90 to +x, 270 to -x.
     THE SQUARES (the city's rule): a 10.5 x 7 m building is 3 x 2 of the fight's squares, middles x -3.5 / 0 / 3.5, z -1.75 (back) / 1.75 (front); the door is on the front
     middle square. What blocks stands on a middle; chairs, lamps, sacks and small things stand off them; wall pieces take no square. The front row stays free. ══ */
  { const B = BUILT, fire = (h, cx) => { h.put('hearth_fire', cx, -h.fd / 2 + 0.78, { w: 0.85, h: 0.75 }); h.put('chimney_smoke', cx, -h.fd / 2 - 0.4, { y: UP(h, h.q.h + h.q.rh + 0.9), rise: 5, floor: false }); };
    /* THE RANGER STATION: the map table, the radio, the desk by the fire */
    { const h = B.ranger; fire(h, 3.4); h.put('map_table', 0, -1.75, { face: 180 }); h.put('item_binoculars', 0.5, -1.6, { y: 0.8 }); h.put('papers_a', -0.5, -1.9, { y: 0.8 });
      h.put('radio_console', -3.5, -1.75, { face: 180 }); h.put('office_locker', -4.6, 0.9, { face: 90 }); h.put('office_locker', -4.6, 1.85, { face: 90 }); h.put('brochure_rack', 2.0, 3.0, { face: 0 });
      h.put('rocking_chair', 2.0, -1.0, { face: 110 }); h.put('rug_round', 3.3, -1.0, { y: 0.02 }); h.put('dog', 3.9, -0.7, { face: 300 }); h.put('psx_bedside_table_1', 4.5, 1.2, { face: 270 }); h.put('coffee_maker', 4.5, 1.2, { y: 0.64, face: 270 }); h.put('coffee_mug', 4.4, 0.9, { y: 0.64 });
      h.put('psx_chair_mp_1', -2.2, -1.2, { face: 250 }); h.put('notice_board', -1.3, -3.14, WALL(h, 1.3, 180)); h.put('key_rack', 4.9, -0.6, WALL(h, 1.4, 270)); h.put('wall_clock', 0.9, -3.14, WALL(h, 2.2, 180)); h.put('fire_extinguisher', -4.9, -0.3, WALL(h, 0.9, 90));
      h.put('psx_wooden_crate_1', -4.4, 2.9, { face: 12 }); h.put('psx_flashlight_1', -4.4, 2.9, { y: 0.37 }); }
    /* BIGFOOT'S CABIN: a big bed, a big table, the larder */
    { const h = B.bigfoot; fire(h, -3.2); h.put('couples_bed', 3.5, -1.75, { face: 180, h: 1.0 }); h.put('psx_dinner_table_1', 0, -1.75, { face: 90 }); h.put('psx_meat_1', 0.2, -1.6, { y: 0.87 }); h.put('psx_fish_skeleton_mp_1', -0.3, -2.0, { y: 0.87, face: 40 }); h.put('psx_canned_food_mp_1', 0.1, -2.2, { y: 0.87 });
      h.put('stump', -1.1, -1.4); h.put('stump', 1.1, -2.0); h.put('psx_armchair_1', -1.9, -0.5, { face: 240 }); h.put('rug_round', -3.2, -1.0, { y: 0.02 }); h.put('stock_pots', -4.4, -1.2, { face: 90 });
      h.put('sea_chest', 4.4, 2.7, { face: 270 }); h.put('psx_shelf_mp_2', -4.6, 2.5, { face: 90 }); h.put('beach_cooler', 2.4, 2.9, { face: 0 }); h.put('meshy_burlap_sack', 3.3, 2.9); h.put('fishing_net_wall', 4.9, -0.2, WALL(h, 1.2, 270));
      h.put('psx_photo_frame_mp_1', -1.0, -3.14, WALL(h, 1.7, 180)); h.put('fallen_log', -4.2, 0.6, { face: 90, h: 0.5 }); h.put('wooden_bucket', -2.2, 2.9); }
    /* THE SHAMAN'S LODGE: the brazier, the bed roll, the table of the craft */
    { const h = B.shaman; h.put('brazier', 0, -1.75); h.put('cot', -3.5, -1.75, { face: 90 }); h.put('psx_coffee_table_1', 3.5, -1.75, { face: 0 }); h.put('crystalBall', 3.5, -1.75, { y: 0.66 }); h.put('tarotDeck', 3.0, -1.6, { y: 0.66 }); h.put('hw_candles', 4.0, -1.9, { y: 0.66 });
      h.put('rug_round', 1.6, 0.9, { y: 0.02 }); h.put('rug_round', -1.9, 1.1, { y: 0.02 }); h.put('item_ward_totem', -1.5, -2.8, { face: 180 }); h.put('item_ward_totem', 1.5, -2.8, { face: 180 }); h.put('item_wizard_staff', 1.5, 3.0);
      h.put('psx_shelf_mp_2', 4.6, 1.2, { face: 270 }); h.put('item_potion_flask', 4.5, 2.0, { y: 0.02 }); h.put('instrument_drum', -2.4, 0.4); h.put('instrument_maracas', -1.4, 1.6, { face: 30 }); h.put('instrument_seed_pod', -2.3, 1.7);
      h.put('item_censer', 2.2, 0.4); h.put('psx_planter_pot_mp_1_full', -4.5, 2.9); h.put('fern', 4.4, 2.9, { h: 0.6 }); h.put('cauldron', -4.3, 0.9); h.put('psx_pillow_mp_1', -3.9, -1.75, { y: 0.45 }); }
    /* THE KI DOJO: the mat, the dummy, the bag, the rack, the tea corner */
    { const h = B.dojo; h.put('psx_carpet_mp_1', 0, 0.2, { y: 0.02, face: 0 }); h.put('wing_chun_dummy', -3.5, -1.75, { face: 150 }); h.put('punching_bag', 3.5, -1.75); h.put('dojo_weapon_rack', 0, -2.85, { face: 180 });
      h.put('taiko_drum', 3.5, 1.75, { face: 250 }); h.put('psx_coffee_table_1', -3.5, 1.75, { face: 90 }); h.put('xmas_cocoa', -3.3, 1.6, { y: 0.66 }); h.put('xmas_cocoa', -3.8, 1.95, { y: 0.66 }); h.put('psx_pillow_mp_1', -2.5, 1.2); h.put('psx_pillow_mp_1', -2.6, 2.4, { face: 40 });
      h.put('candelabra', -4.6, -0.2); h.put('candelabra', 4.6, -0.2); h.put('privacy_screen', -4.3, 3.0, { face: 20 }); h.put('paper_lantern', -1.75, 0, { y: UP(h, 2.3), mount: 0 }); h.put('paper_lantern', 1.75, 0, { y: UP(h, 2.3), mount: 0 });
      h.put('spear', 4.9, 1.0, WALL(h, 1.4, 270)); h.put('candle_ring', 0, 0.3, { y: 0.03 }); }
    /* THE SPRING SHRINE (2 x 2 squares, middles +-1.75): the altar, the votive stand, the water jars */
    { const h = B.shrine; h.put('stone_altar', 1.75, -1.75, { face: 180 }); h.put('item_censer', 1.4, -1.75, { y: 0.96 }); h.put('meshy_crystal_shard', 2.2, -1.8, { y: 0.96 }); h.put('hw_candles', 1.8, -2.0, { y: 0.96 });
      h.put('votive_stand', -1.9, -2.5, { face: 180 }); h.put('candelabra', 0.2, -2.8); h.put('candelabra', 3.0, -0.4); h.put('greek_amphora', -2.8, 0.2); h.put('greek_amphora', -2.7, -0.8, { face: 60 }); h.put('wooden_bucket', -2.0, 0.6);
      h.put('rug_round', 1.2, 0.8, { y: 0.02 }); h.put('ships_bell', 2.9, 2.9, { y: UP(h, 1.9), mount: 0, face: 0 }); h.put('candle_ring', 1.2, 0.8, { y: 0.03, noLight: true }); }
    /* THE FIRE LOOKOUT: the map table under the windows, the telescope, the radio, a cot */
    { const h = B.lookout; h.put('map_table', 0, -1.75, { face: 180 }); h.put('item_binoculars', -0.5, -1.7, { y: 0.8 }); h.put('brass_telescope', 3.5, -1.75, { face: 20 }); h.put('radio_console', -3.5, -1.75, { face: 180 });
      h.put('cot', -3.5, 1.75, { face: 0 }); h.put('psx_pillow_mp_1', -3.5, 1.1, { y: 0.45 }); h.put('psx_bedside_table_1', -4.5, 0.2, { face: 90 }); h.put('field_radio', -4.5, 0.2, { y: 0.64, face: 90 }); h.put('psx_chair_mp_1', 1.0, -0.6, { face: 330 });
      h.put('star_chart', 4.9, 0.9, WALL(h, 1.2, 270)); h.put('gauge_board', 2.6, 3.14, WALL(h, 1.3, 0)); h.put('fire_extinguisher', 1.4, 3.14, WALL(h, 0.9, 0)); h.put('hose_rack', -4.9, -1.2, WALL(h, 1.2, 90)); h.put('coffee_mug', 0.6, -1.9, { y: 0.8 });
      h.put('footlocker', 4.3, 2.8, { face: 270 }); h.put('ship_lantern', 0, 0.4, { y: UP(h, 2.7), mount: 0, noLight: true }); }
    /* THE CLIMBERS' HUT: two cots, the table, the kit by the fire */
    { const h = B.climbers; fire(h, 3.2); h.put('cot', -3.5, -1.75, { face: 90 }); h.put('cot', -3.5, 1.75, { face: 90 }); h.put('psx_pillow_mp_1', -4.1, -1.75, { y: 0.45 }); h.put('psx_pillow_mp_1', -4.1, 1.75, { y: 0.45 });
      h.put('psx_dinner_table_1', 0, -1.75, { face: 90 }); h.put('xmas_cocoa', 0.2, -1.5, { y: 0.87 }); h.put('psx_canned_food_mp_1', -0.2, -2.0, { y: 0.87 }); h.put('psx_flashlight_1', 0.1, -2.3, { y: 0.87 }); h.put('psx_chair_mp_1', 1.1, -1.5, { face: 270 }); h.put('psx_chair_mp_1', -1.1, -2.0, { face: 90 });
      h.put('meshy_rope', 4.3, 0.4); h.put('meshy_rope', 3.8, 1.0, { face: 70 }); h.put('footlocker', 4.3, 2.7, { face: 270 }); h.put('psx_supply_crate_1', 2.6, 2.9); h.put('stock_pots', 1.7, -2.6, { face: 180 }); h.put('hw_shovel', 4.6, -0.9, { face: 80 });
      h.put('rug_round', 3.0, -0.9, { y: 0.02 }); h.put('notice_board', -1.3, -3.14, WALL(h, 1.3, 180)); h.put('ship_lantern', 0, 0.6, { y: UP(h, 2.7), mount: 0, noLight: true }); h.put('psx_bandage_mp_1', -4.4, 0, { y: 0.02 }); }
  }
  /* ══ PASS 3 (11-16): THE DRESSING, plot by plot, from the model list (areas-complexes.md "MOUNT SHASTA, THE DISTRICT THREAD", FITS THIS DISTRICT).
     P = put (a blocker on a square's middle, never on a trail square), D = dec (decor, off the middle), T = a tree, NPC = a native. ══ */
  { const P = (id, list) => list.forEach(q => put(id, q[0], q[1], q[2], q[3])), D = (id, list) => list.forEach(q => dec(id, q[0], q[1], q[2], q[3])), F = f => ({ face: f });
    /* SHASTINA: the small cone: frost-split stones, a climbers' cache by the cairn */
    P('P13-00', [['psxg_rock_1', 6, 6, { h: 1.9, face: 40 }], ['psxg_rock_1', 4, 6, { h: 1.5, face: 200 }]]);
    D('P13-00', [['psxg_rock_1', 5, 6], ['psxg_rock_2', 6, 3], ['psxg_rock_3', 7, 5], ['psx_supply_crate_1', 5, 5], ['meshy_rope', 5, 5], ['crow', 4, 5], ['psxg_rock_4', 3, 5], ['psxg_rock_2', 6, 7]]);
    /* THE SUMMIT: the vent in the crater, a telescope on the rim, the survey drum */
    P('P14-00', [['sea_vent', 7, 6], ['telescope', 9, 5, F(250)]]);
    D('P14-00', [['psxg_rock_1', 6, 6], ['psxg_rock_2', 8, 7], ['psxg_rock_3', 7, 7], ['psx_metal_barrel_mp_1', 8, 4], ['psxg_rock_4', 6, 8], ['psxg_rock_2', 9, 8], ['eagle', 6, 6], ['meshy_rope', 8, 4]]);
    native('P14-00', 'nordic', 6, 9, 20);
    /* THE GLACIER: the wanded route across the ice, melt water, moraine stones */
    { const q = S('P15-00', 7, 5); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 2.4, rz: 1.5, y: -0.15, depth: 0.5, key: 'water', bank: 0.5 }); R.taken.add(q[0] + ':' + q[1]); }
    P('P15-00', [['psxg_rock_1', 5, 3, { h: 1.4 }]]);
    D('P15-00', [['meshy_crystal_shards', 6, 3, { h: 1.3 }], ['meshy_crystal_shards', 9, 7, { h: 1.0 }], ['meshy_crystal_shard', 8, 4, { h: 0.9 }], ['psxg_rock_2', 6, 7], ['psxg_rock_1', 8, 6], ['psxg_rock_3', 5, 5], ['hw_shovel', 6, 6], ['meshy_rope', 8, 7], ['psxg_rock_4', 10, 4]]);
    native('P15-00', 'yeti', 6, 4, 160);
    /* THE RED BANKS: pumice blocks fallen from the banks, dead scrub */
    P('P13-01', [['ocean_rock_4', 6, 6, F(70)], ['psxg_rock_1', 6, 4, { h: 1.6 }], ['signpost', 7, 5, F(90)]]);
    D('P13-01', [['psxg_rock_1', 5, 4], ['psxg_rock_2', 5, 6], ['psxg_rock_1', 4, 5], ['psxg_dead_bush_2', 6, 3], ['psxg_dead_bush_1', 5, 7], ['psxg_rock_3', 7, 6], ['psxg_rock_4', 6, 5], ['ocean_rock_7', 7, 4]]);
    /* HELEN LAKE: the frozen lake's camp: a boat frozen in, the ice-fishing hole, a snowman */
    P('P14-01', [['rowboat', 6, 7, F(30)], ['fallen_log', 6, 4, F(100)], ['xmas_snowman', 9, 6, F(220)]]);
    { const q = S('P14-01', 5, 7); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 0.7, rz: 0.7, y: -0.1, depth: 0.5, key: 'water', bank: 0.2 }); R.taken.add(q[0] + ':' + q[1]); }
    D('P14-01', [['beach_cooler', 4, 3], ['psx_supply_crate_1', 3, 3], ['psx_fish_skeleton_mp_1', 4, 7], ['wooden_bucket', 6, 6], ['meshy_rope', 2, 5], ['stock_pots', 5, 4], ['psx_canned_food_mp_1', 6, 3], ['psxg_rock_2', 9, 4], ['hw_shovel', 7, 5], ['psx_wooden_crate_1', 9, 3]]);
    /* THE STEAM VENTS: fumaroles on the lava, crystals and torches at the adit, a rope round the hot pool */
    P('P15-01', [['sea_vent', 4, 4], ['sea_vent', 6, 4, { h: 1.8, noLight: true }], ['sea_vent', 3, 7, { h: 2.0, noLight: true }], ['crystal_cluster', 7, 5], ['cave_torch', 8, 5], ['cave_torch', 8, 7, { noLight: true }]]);
    D('P15-01', [['rope_stanchion', 4, 6], ['rope_stanchion', 6, 7], ['rope_stanchion', 5, 5], ['psx_metal_barrel_mp_1', 6, 8], ['meshy_crystal_shards', 7, 7], ['meshy_crystal_shard', 7, 6], ['psxg_rock_1', 5, 8], ['psxg_rock_2', 3, 6], ['ocean_rock_7', 5, 3], ['psx_wooden_crate_4', 7, 4], ['hw_shovel', 6, 8], ['psxg_rock_3', 4, 5]]);
    /* AVALANCHE GULCH: what the last slide brought down: snapped trees, logs, blocks */
    P('P13-02', [['fallen_log', 7, 5, F(35)], ['fallen_log', 6, 7, F(110)], ['dead_snag', 8, 5, F(0)], ['psxg_rock_1', 8, 7, { h: 2.0, face: 130 }], ['hollow_dead_tree', 5, 5]]);
    D('P13-02', [['psxg_rock_1', 7, 6], ['psxg_rock_2', 8, 6], ['stump', 6, 5], ['psxg_rock_1', 6, 8], ['psxg_dead_bush_2', 7, 4], ['psxg_rock_3', 5, 7], ['fallen_log', 8, 4, { h: 0.4 }], ['psxg_rock_4', 9, 6], ['psxg_rock_1', 7, 8]]);
    /* THE FORK: wands on the three trails, an emergency cache in the windbreak */
    P('P14-02', [['psxg_rock_1', 5, 2, { h: 1.5 }], ['psxg_rock_1', 9, 6, { h: 1.3 }], ['signpost', 8, 3, F(140)]]);
    D('P14-02', [['psx_metal_barrel_mp_1', 10, 3], ['psx_supply_crate_1', 9, 3], ['meshy_campfire_ring', 8, 2], ['crow', 7, 5], ['psxg_rock_2', 6, 3], ['psxg_rock_1', 10, 5], ['psxg_rock_3', 5, 6], ['meshy_rope', 8, 2], ['psxg_rock_4', 7, 7], ['psxg_rock_2', 4, 3]]);
    /* THE SCREE: a slope of broken stone, the sign for the road east */
    P('P15-02', [['psxg_rock_1', 3, 4, { h: 1.7 }], ['psxg_rock_1', 5, 6, { h: 1.5, face: 80 }], ['psxg_rock_1', 2, 6, { h: 1.2 }], ['signpost', 6, 5, F(90)], ['hitching_rail', 5, 3]]);
    D('P15-02', [['psxg_rock_1', 4, 4], ['psxg_rock_2', 3, 6], ['psxg_rock_3', 4, 5], ['psxg_rock_1', 5, 5], ['psxg_rock_4', 2, 5], ['psxg_rock_2', 6, 4], ['psxg_dead_bush_2', 4, 7], ['psxg_rock_1', 3, 7], ['psxg_rock_3', 6, 6], ['psxg_dead_bush_1', 2, 4], ['psxg_rock_1', 5, 4], ['psxg_rock_4', 4, 3]]);
    /* BUNNY FLAT: the rabbits, the camp's kit, a sprung trap by Bigfoot's */
    P('P13-03', [['stump', 1, 6], ['hollow_dead_tree', 1, 8], ['hitching_rail', 5, 10], ['stump', 5, 7]]);
    D('P13-03', [['rabbit', 3, 8], ['rabbit', 6, 9], ['rabbit', 2, 9], ['rabbit', 7, 5], ['rabbit', 4, 10], ['beach_cooler', 3, 5], ['stock_pots', 5, 6], ['trap_bear_shut', 7, 9], ['woods_healflower', 3, 9], ['woods_healflower', 6, 8], ['fern', 0, 7], ['fern', 3, 10], ['psx_wooden_crate_1', 7, 7], ['meshy_burlap_sack', 7, 8], ['woods_healflower', 1, 5], ['fern', 8, 7]]);
    /* PANTHER MEADOWS: the flower meadow, the panther lying in it, a totem at the lodge, the dojo's post outside */
    P('P14-03', [['item_ward_totem', 4, 2, { h: 2.4, face: 180 }], ['wing_chun_dummy', 7, 8, F(20)], ['stump', 3, 7], ['stump', 7, 5], ['menhir', 10, 4, { h: 2.2 }], ['fallen_log', 2, 9, F(60)]]);
    D('P14-03', [['lion', 9, 3, { face: 200 }], ['woods_healflower', 3, 4], ['woods_healflower', 4, 9], ['woods_healflower', 8, 5], ['woods_healflower', 9, 6], ['woods_healflower', 2, 6], ['woods_healflower', 6, 3], ['woods_healflower', 10, 7], ['monarch', 4, 5], ['blue_morpho', 8, 4], ['swallowtail', 3, 8], ['monarch', 9, 7],
      ['fern', 1, 5], ['fern', 10, 9], ['mushroom2', 11, 5, { h: 1.0 }], ['psx_pillow_mp_1', 4, 6], ['psx_pillow_mp_1', 6, 7], ['item_censer', 5, 7], ['hw_candles', 3, 3], ['fern', 5, 2], ['meshy_crystal_shard', 6, 5]]);
    native('P14-03', 'hippie', 7, 4, 200);
    /* THE OLD LAVA: black blocks, burnt trees, the first ferns coming back */
    P('P15-03', [['ocean_rock_3', 4, 5, F(30)], ['ocean_rock_4', 6, 7, F(200)], ['hollow_dead_tree', 6, 5], ['dead_snag', 3, 6], ['ocean_rock_2', 7, 6], ['dead_snag', 5, 4]]);
    D('P15-03', [['psxg_dead_bush_1', 5, 6], ['psxg_dead_bush_2', 4, 7], ['fern', 7, 5], ['fern', 5, 8], ['ocean_rock_7', 6, 4], ['ocean_rock_9', 4, 6], ['ocean_rock_5', 6, 6], ['psxg_rock_1', 7, 7], ['crow', 5, 5], ['ocean_rock_6', 3, 5], ['fern', 4, 8]]);
    /* THE LAST TREES: the tree line: snags, stumps, young pines */
    P('P13-04', [['dead_snag', 8, 6], ['dead_snag', 6, 7], ['stump', 9, 5], ['signpost', 6, 4, F(180)]]); tree('P13-04', 'pine_2', 3.2, 8, 7); tree('P13-04', 'pine_2', 2.6, 5, 6); tree('P13-04', 'pine_2', 3.6, 9, 7);
    D('P13-04', [['psxg_dead_bush_1', 7, 6], ['psxg_dead_bush_2', 8, 5], ['crow', 8, 8], ['fern', 6, 8], ['psxg_rock_1', 7, 7], ['stump', 7, 4], ['fern', 9, 6], ['psxg_rock_2', 6, 5], ['fallen_log', 7, 8, { h: 0.4 }]]);
    /* THE SPRING: stepping stones to the shrine, ferns and frogs round the water, a log to sit on */
    P('P14-04', [['fallen_log', 3, 6, F(10)], ['stump', 4, 3]]);
    D('P14-04', [['psxg_stepping_stone_1', 7, 3], ['psxg_stepping_stone_2', 7, 4], ['psxg_stepping_stone_1', 5, 4], ['psxg_stepping_stone_2', 4, 4], ['wooden_bucket', 5, 3], ['fern', 4, 5], ['fern', 4, 7], ['fern', 8, 6], ['fern', 3, 4], ['meshy_frog', 4, 6], ['meshy_frog', 8, 5], ['woods_glowcap', 5, 8], ['woods_glowcap', 3, 5], ['hw_candles', 7, 2 + 1], ['blue_morpho', 8, 5], ['woods_healflower', 3, 3], ['woods_healflower', 8, 5]]);
    native('P14-04', 'hippie', 2, 4, 110);
    /* THE SWITCHBACK, upper: a rest stop on the bend */
    P('P13-05', [['hitching_rail', 4, 4, F(90)], ['fallen_log', 7, 3, F(80)], ['park_bench', 5, 3, F(180)], ['stump', 8, 4]]);
    D('P13-05', [['fern', 4, 5], ['fern', 8, 3], ['woods_healflower', 6, 2], ['woods_healflower', 7, 5], ['psxg_rock_1', 5, 5], ['rabbit', 7, 4], ['fern', 5, 2], ['psxg_rock_2', 8, 5], ['monarch', 6, 3]]);
    /* THE LOOKOUT: the rail along the drop, a telescope, the station's dish and water drum */
    P('P14-05', [['hw_fence', 1, 6, F(90)], ['hw_fence', 1, 7, F(90)], ['hw_fence', 1, 8, F(90)], ['telescope', 2, 6, F(270)], ['dish', 6, 9, F(200)], ['stump', 3, 5]]);
    D('P14-05', [['psx_metal_barrel_mp_1', 5, 9], ['eagle', 3, 6], ['fern', 2, 5], ['fern', 6, 6], ['psxg_rock_1', 5, 5], ['woods_healflower', 4, 8], ['psx_wooden_crate_1', 5, 9], ['crow', 2, 8], ['fern', 4, 5]]);
    /* THE SWITCHBACK, lower */
    P('P13-06', [['hitching_rail', 9, 3, F(90)], ['stump', 5, 3], ['fallen_log', 8, 6, F(20)], ['hollow_tree', 6, 2]]);
    D('P13-06', [['fern', 7, 2], ['fern', 5, 4], ['fern', 9, 4], ['rabbit', 7, 4], ['woods_healflower', 6, 5], ['psxg_rock_2', 8, 3], ['mushroom2', 8, 2, { h: 0.9 }], ['woods_glowcap', 7, 6], ['psxg_rock_1', 6, 6]]);
    /* THE BOULDER FIELD: the big blocks among the small ones */
    P('P14-06', [['sarsen', 7, 6, { h: 3.4, face: 40 }], ['psxg_rock_1', 6, 7, { h: 2.3, face: 120 }], ['psxg_rock_1', 8, 7, { h: 2.0, face: 250 }], ['menhir', 6, 9, { h: 2.4, face: 10 }], ['psxg_rock_1', 9, 6, { h: 1.8 }]]);
    D('P14-06', [['psxg_rock_1', 7, 5, { h: 1.2 }], ['psxg_rock_1', 8, 6, { h: 1.0 }], ['psxg_rock_2', 5, 7], ['psxg_rock_1', 7, 7, { h: 1.1 }], ['psxg_rock_3', 8, 8], ['fern', 5, 8], ['fern', 5, 7], ['crow', 7, 7], ['meshy_rope', 6, 6], ['psxg_rock_2', 9, 8], ['psxg_rock_4', 6, 8], ['fern', 8, 9]]);
    native('P14-06', 'gnome', 6, 6, 100);
    /* THE TRAILHEAD: the hitching rail and the pack horse, the fire's seats, the bin, the line's last pole */
    P('P13-07', [['hitching_rail', 5, 7], ['horse_brown', 6, 7, F(0)], ['fallen_log', 8, 3, F(90)], ['stump', 6, 3], ['power_pole', 10, 4]]);
    D('P13-07', [['metal_trash_can', 8, 4], ['psx_wooden_crate_4', 5, 4], ['meshy_burlap_sack', 5, 4], ['fern', 9, 6], ['fern', 6, 8], ['woods_healflower', 8, 7], ['wooden_bucket', 6, 6], ['psx_metal_barrel_mp_1', 4, 7 - 1], ['rabbit', 8, 6]]);
    /* THE UPPER SHELF: a pilgrims' camp off the trail */
    P('P14-07', [['meshy_camping_tent', 6, 5, F(120)], ['campfire', 8, 5], ['fallen_log', 7, 6, F(100)], ['stump', 9, 4]]);
    D('P14-07', [['instrument_guitar', 7, 5, { h: 0.9 }], ['hw_candles', 8, 6], ['fern', 5, 6], ['fern', 9, 6], ['beach_cooler', 6, 4], ['rabbit', 6, 7], ['woods_healflower', 8, 7], ['psx_pillow_mp_1', 8, 4], ['stock_pots', 9, 5], ['woods_healflower', 6, 3]]);
    native('P14-07', 'hippie', 7, 4, 150); native('P13-04', 'tree person', 7, 5, 200);
    /* the wands: thin orange poles with a flag that mark the route over snow and ice (a look, no collision, off the square's middle) */
    { const L = [['P13-00', 7, 4], ['P14-00', 5, 9], ['P15-00', 5, 6], ['P15-00', 7, 7], ['P15-00', 9, 5], ['P14-01', 4, 8], ['P13-02', 6, 4], ['P14-02', 4, 5], ['P14-02', 8, 6], ['P14-02', 6, 1]], o0 = S(L[0][0], L[0][1], L[0][2]), X0 = ctx.r2(mx(o0[0]) + 1.1), Z0 = ctx.r2(mz(o0[1]) - 0.9), G0 = gnd(R, L[0][0], L[0][1], L[0][2]);
      look('wands', X0, Z0, a => { for (const [id, lx, ly] of L) { const q = S(id, lx, ly), x = ctx.r2(mx(q[0]) + 1.1 - X0), z = ctx.r2(mz(q[1]) - 0.9 - Z0), y = ctx.r2(gnd(R, id, lx, ly) - G0);
          a.cyl(x, y - 0.3, z, 0.035, 2.6, 'marble_light', 0xd86a20, { seg: 6, glow: 0.9 }); a.box(x + 0.17, y + 1.95, z, 0.32, 0.22, 0.02, 'marble_light', 0xe8421c, { glow: 0.95 }); a.dome(x, y, z, 0.3, 0.14, 'ice', 0xf4f8ff, { seg: 6, rings: 2 }); } }); }
  }
  /* ══ PASS 4 (11-16): ATMOSPHERE. Steam over every vent and the hot pool, lantern posts down the trail (a glow, not a real light: the frame rate), lanterns at the
     dojo's eaves, a brazier at the shrine. The air (particles) is `airZones` below. The room's sky and its day are the tool's. ══ */
  { const r2 = ctx.r2, steam = (id, lx, ly, up, rise) => { const q = S(id, lx, ly); props.push({ key: 'chimney_smoke', x: mx(q[0]), z: mz(q[1]), y: r2(gnd(R, id, lx, ly) + up), rise: rise || 6 }); };
    steam('P14-00', 7, 6, 2.3, 9); steam('P15-01', 4, 4, 2.3); steam('P15-01', 6, 4, 1.8); steam('P15-01', 3, 7, 2.0); steam('P15-01', 5, 6, 0.4, 4); steam('P15-01', 6, 6, 0.4, 3);
    /* the lantern post: a timber post, an arm, a caged lantern (the district's own; the village's is candy-striped) */
    { const L = [['P13-07', 5, 8, -1.3, 0], ['P13-07', 4, 4, 1.2, -1.3], ['P13-07', 8, 2, 1.3, 1.2], ['P13-06', 6, 6, 1.3, 1.3], ['P13-06', 5, 3, -1.3, 1.2], ['P13-05', 5, 6, -1.3, 1.2], ['P13-05', 8, 2, 1.3, -1.2], ['P13-04', 5, 8, 1.3, 1.2], ['P13-04', 6, 4, 1.3, -1.3],
        ['P13-03', 3, 3, -1.3, -1.2], ['P13-03', 8, 8, 1.2, -1.3], ['P14-03', 3, 3, -1.3, 1.2], ['P14-03', 7, 9, -1.3, 1.3], ['P14-03', 10, 8, 1.3, -1.3], ['P14-04', 3, 3, -1.3, -1.3], ['P14-04', 7, 5, 1.3, 1.2], ['P14-05', 5, 5, 1.3, -1.3], ['P14-05', 5, 9, 1.3, -1.3],
        ['P14-06', 5, 5, -1.3, -1.3], ['P14-07', 5, 4, -1.3, 1.3], ['P14-02', 4, 6, -1.3, 1.2], ['P14-02', 8, 4, 1.3, 1.3], ['P14-01', 2, 5, 1.3, 1.3], ['P15-01', 3, 8, -1.3, 1.3], ['P13-02', 5, 6, -1.3, 1.3], ['P14-00', 6, 9, 1.3, 1.3]], o0 = S(L[0][0], L[0][1], L[0][2]), X0 = r2(mx(o0[0]) + L[0][3]), Z0 = r2(mz(o0[1]) + L[0][4]), G0 = gnd(R, L[0][0], L[0][1], L[0][2]);   // ONE look for all the posts (26 looks cost draw calls: the frame rate)
      look('lamps', X0, Z0, a => { for (const [id, lx, ly, ox, oz] of L) { const q = S(id, lx, ly), x = r2(mx(q[0]) + ox - X0), z = r2(mz(q[1]) + oz - Z0), y = r2(gnd(R, id, lx, ly) - G0), sx = ox > 0 ? -1 : 1;
          a.cyl(x, y - 0.3, z, 0.22, 0.65, 'rocks_5', 0x9c9ca4, { seg: 7, gain: 1.5 }); a.cyl(x, y + 0.35, z, 0.09, 2.75, WD2, 0x5a4030, { seg: 7, gain: 1.5 });
          a.box(x + sx * 0.28, y + 2.9, z, 0.7, 0.08, 0.08, WD2, 0x5a4030, { gain: 1.5 }); a.box(x + sx * 0.55, y + 2.52, z, 0.03, 0.4, 0.03, WD2, 0x2a2a2a); a.box(x + sx * 0.55, y + 2.2, z, 0.24, 0.34, 0.24, 'marble_light', 0xffb050, { glow: 1.4 }); a.box(x + sx * 0.55, y + 2.54, z, 0.3, 0.05, 0.3, WD2, 0x2a2a2a); a.box(x + sx * 0.55, y + 2.16, z, 0.3, 0.04, 0.3, WD2, 0x2a2a2a); } }); }
    /* the dojo's eaves, the shrine's fire, the lodge's porch light */
    { const h = BUILT.dojo; for (const x of [-4.7, 4.7]) h.put('paper_lantern', x, h.fd / 2 + 0.75, { y: UP(h, 2.45), mount: 0, floor: false }); }
    put('P14-04', 'brazier', 4, 2); dec('P14-03', 'hw_candles', 4, 3); dec('P14-03', 'hw_candles', 2, 3); dec('P14-04', 'hw_candles', 7, 4);
    dec('P14-04', 'woods_glowcap', 4, 8); dec('P14-04', 'woods_glowcap', 8, 6); dec('P13-06', 'woods_glowcap', 8, 4); dec('P14-03', 'woods_glowcap', 10, 6);
  }
};

/* THE AIR (pass 4; the tool's hook `airZones`, bake-mountains.js THE AIR BY DISTRICT): thin snow on the three peaks' plots, white motes of steam at the vents, ash over
   the two lava plots, fireflies in Panther Meadows, pale motes at the Spring, pollen in the wood. Squares are the room's (from S()). Kept thin: the frame rate. */
exports.airZones = ctx => { const { S } = ctx, Z = (id, kind, n, q, id2) => { const a = S(id, 0, 0), b = S(id2 || id, 11, 11); return Object.assign({ x0: a[0], y0: a[1], x1: b[0] + 1, y1: b[1] + 1, kind, n }, q || {}); };
    return [Z('P13-00', 'snow', 260, { speed: 0.7 }, 'P15-00'), Z('P14-01', 'snow', 70, { speed: 0.6 }), Z('P15-01', 'motes', 70, { color: 0xffffff, speed: 0.5 }), Z('P13-01', 'ash', 40), Z('P15-03', 'ash', 40),
        Z('P14-03', 'fireflies', 50), Z('P14-04', 'motes', 40, { color: 0xbfe8ff, speed: 0.3 }), Z('P13-03', 'dust', 50, { color: 0xffe8a0 }), Z('P13-04', 'dust', 90, { color: 0xffe8a0 }, 'P13-07'), Z('P14-05', 'dust', 70, { color: 0xffe8a0 }, 'P14-07')];
};
