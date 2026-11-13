#!/usr/bin/env node
/* ── DISASTER CITY, BAYSIDE: THE ARCHITECTURE (2026-11-13) ──
   mondo: "architect the buildings in their respective districts plots ... use different materials/textures and tint them to match your
   vision for the building ... every building should be unique and purposeful and recognizable ... domes, roof tops, modern architecture,
   curves ... design each building like an architect would, or like how a disney theme park designer would". His OK on the plan + the
   mock-up: 11-13 17:11 ("looks good"). The plan: https://claude.ai/artifact/S8nPJ2AF6soGsNFSgf9VkL; notes: docs/notes/areas-complexes.md
   "DISASTER CITY, BAYSIDE".

   Bayside is a pastel waterfront: coral, mint, aqua, lemon and pink stucco, white trim, terracotta and teal roofs. This file is the
   Bayside part of `node bake-disaster-city.js` (its district hook; not a game file, never uploaded). It only touches Bayside's plots
   (P08-08 .. P11-11):
     tailor(PLAN) before the plan is read: the cinema and the mall turn their fronts WEST (onto the avenue and the Cordon plaza).
     apply(ctx)   after the buildings and the door steps, before the street furniture: every Bayside building's own outside is switched off (`skin: false`: the walls, the doorway, the swing door
                 and the walked roofs stay) and a `k: 'arch'` row (three-renderer.js _hqArchGeometry) draws it instead; the small things
                 the plan has no building for (the lookout, the mall arch, the bandstand, the carports, the harbour master, the taco
                 stand) are added in yard squares, each on squares it takes so nothing else is dressed onto them.
   A building's parts are written in its own frame: x along the front (the left as you face it = −x), +z out of the front, y up. */
'use strict';

/* the sheets (the urban pack, 128 px = 1.75 m) and the tints */
const K = {
    plaster: 'urban:PlasterWallPainted1a', stucco: 'urban:PlasterWallStucco1a', conc: 'urban:ConcreteStriped2c', concA: 'urban:ConcreteStriped1a',
    corr: 'urban:MetalCorrugatedPainted1a', tile: 'urban:TileGeneric1a', marble: 'urban:TileMarble1a', check: 'urban:TileGeneric5a', subway: 'urban:TileSubway1a',
    gSq: 'urban:GlassWindowSquare1a', gSq2: 'urban:GlassWindowSquare2a', gTall: 'urban:GlassWindowTall1a', gRes: 'urban:GlassWindowResidential1a', gFac: 'urban:GlassWindowFactory1a',
    shutter: 'urban:GlassWindowResidentialShutter1', win: 'urban:DecalWindowsResidential1a', shop: 'urban:DoorStorefrontHalf1a', planks: 'wood_planks',
};
const T = {
    CORAL: 0xffa590, MINT: 0xa8ecd6, AQUA: 0x7fdcec, LEMON: 0xffe27a, PINK: 0xffb4d0, SAND: 0xf8dfae, TEAL: 0x38b0aa, NAVY: 0x44669c, TERRA: 0xd9704a,
    CREAM: 0xfff6e2, LILAC: 0xd2bcf6, WHITE: 0xffffff, GLASS: 0xb4e4ff, HOT: 0xff5a7a, RED: 0xe8483c, ORANGE: 0xffa23c, LEAF: 0x58b84c, GREY: 0xb9bcc0, DARK: 0x6c7076, YELLOW: 0xffd23c, STEEL: 0xd8dde2,
};
/* a sheet wears the city's building tint under its own (three-renderer.js HQ_TEXB.tint) and the stucco sheets are a mid grey, so a pastel
   over them reads as mud. A painted wall takes `gain` (the arch row: the tint times it, past white; the light still shades it) and glass a
   little of its own light (`glow`). */
const PAINT = 2.3, GL = 0.3;
const wallM = (tint, key) => ({ key: key || K.stucco, tint, gain: key === K.corr ? 2.0 : PAINT });
const trim = (tint) => ({ tint: tint == null ? T.WHITE : tint });                              // plain painted trim (no sheet)
const glass = (tint, key, glow) => ({ key: key || K.gSq, tint: tint == null ? T.GLASS : tint, glow: glow == null ? GL : glow, gain: 2.2 });
const A = Object.assign;
const box = (x, y, z, w, h, d, o) => A({ s: 'box', p: [x, y, z], size: [w, h, d] }, o);
const cyl = (x, y, z, r, h, o) => A({ s: 'cyl', p: [x, y, z], r, h }, o);
const dome = (x, y, z, r, h, o) => A({ s: 'dome', p: [x, y, z], r, h }, o);
const roof = (form, x, y, z, w, h, d, o) => A({ s: 'roof', form, p: [x, y, z], size: [w, h, d] }, o);
const E = 0.05;                                                                                 // a facade stands this far proud of the footprint
/* a panel on a face of a w × d box: 'f' front (+z), 'b' back, 'l' left (−x), 'r' right (+x); `u` along the face from its middle (left to right
   as you face it), `out` beyond the proud facade */
const pane = (side, W, D, u, y, w, h, o, out) => {
    const e = E + (out || 0);
    const at = side === 'f' ? [u, y, D / 2 + e, 0] : side === 'b' ? [-u, y, -D / 2 - e, 180] : side === 'r' ? [W / 2 + e, y, -u, 270] : [-W / 2 - e, y, u, 90];
    return A({ s: 'quad', p: [at[0], at[1], at[2]], ry: at[3], size: [w, h] }, o);
};
const allFaces = (W, D, y, h, o, out, sides) => (sides || 'fblr').split('').map(c => pane(c, W, D, 0, y, ((c === 'f' || c === 'b') ? W : D) + 2 * E, h, o, out));
/* a band round a w × d box (a cornice, a string course): four boxes, `out` proud, never a lid (a walked roof stays clear) */
const band = (W, D, y, h, out, o) => [
    box(0, y, D / 2 + out / 2, W + 2 * out, h, out, A({ under: true }, o)), box(0, y, -D / 2 - out / 2, W + 2 * out, h, out, A({ under: true }, o)),
    box(W / 2 + out / 2, y, 0, out, h, D, A({ under: true }, o)), box(-W / 2 - out / 2, y, 0, out, h, D, A({ under: true }, o)),
];
/* the front with the doorway cut in it (data.js hqTexbDoor: the door's square of the front, 1 = the left) */
const doorLx = (W, door) => { const L = Math.max(2, W) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return -L / 2 + (col + 0.5) * cw; };
const doorFront = (W, D, h, lx, o) => A({ s: 'quad', p: [0, 0, D / 2 + E], size: [W + 2 * E, h], hole: [lx, 1.74, 2.2] }, o);
/* a striped awning: a white lean-to with coloured stripes over it, its high edge on the wall (the row's −z) */
const awning = (x, y, z, w, dep, tint) => {
    const n = Math.max(2, Math.round(w / 1.2)), sw = w / (2 * n);
    return [roof('shed', x, y, z, w, 0.7, dep, { tint: T.WHITE, ds: true }), A(roof('shed', x - w / 2 + sw / 2, y + 0.03, z, sw, 0.7, dep + 0.06, { tint, ds: true }), { n, step: [2 * sw, 0, 0] })];
};
const posts = (x0, z0, n, step, h, r, o) => A(cyl(x0, 0, z0, r || 0.14, h, A({ seg: 8, cap: false }, o || trim())), n > 1 ? { n, step } : {});

/* ── THE BUILDINGS (each: the parts of one building W along its front, D deep; H where the row's own height matters) ── */
const B = {};

/* 1 · THE WATERFRONT HOTEL: a nine-storey coral slab, a white eyebrow over every floor, a round glass corner tower under a mint dome */
B.hotel = (W, D, lx) => {
    const H = 31.5, p = [];
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.CORAL), { keyTop: K.conc, tintTop: T.GREY })));
    p.push(doorFront(W, D, 3.5, lx, wallM(T.CREAM)));
    ['f', 'b'].forEach(s => p.push(pane(s, W, D, 0, 3.5, W - 3.5, H - 4.2, { key: K.win, uv: [3.5, 3.5] }, 0.02)));                    // a window a bay, two rows a floor
    ['l', 'r'].forEach(s => p.push(pane(s, W, D, 0, 3.5, 3.5, H - 4.2, glass(T.AQUA, K.gTall), 0.02)));                                 // a glass stair slot up each end
    p.push(A(box(0, 3.4, 0, W + 1.4, 0.22, D + 1.4, A(trim(), { under: true })), { n: 9, step: [0, 3.5, 0] }));                         // the eyebrows
    p.push(...band(W, D, H, 0.9, 0.12, wallM(T.CREAM)));
    /* the corner tower (the street corner: the front's right) */
    const tx = W / 2 - 2.6, tz = D / 2 - 2.6, tr = 4.0;
    p.push(cyl(tx, 0, tz, tr, 3.5, A(wallM(T.CREAM), { seg: 20, cap: false })));
    p.push(cyl(tx, 3.5, tz, tr, H, A(glass(T.AQUA, K.gTall, 0.4), { seg: 20, cap: false })));
    p.push(A(cyl(tx, 3.4, tz, tr + 0.35, 0.22, A(trim(), { seg: 20 })), { n: 10, step: [0, 3.5, 0] }));
    p.push(dome(tx, H + 3.6, tz, tr + 0.1, 3.4, A(wallM(T.MINT, K.plaster), { seg: 20 })));
    p.push(cyl(tx, H + 7.0, tz, 0.22, 6.5, A(trim(), { r2: 0.02, seg: 6 })));
    /* the fin (the sign), the canopy over the door */
    p.push(box(-W / 2 + 5.25, 7.2, D / 2 + 1.0, 0.5, 17, 1.9, A(trim(T.MINT), { glow: 0.45 })));
    p.push(box(-W / 2 + 5.25, 7.0, D / 2 + 1.0, 0.8, 0.25, 2.1, trim()), box(-W / 2 + 5.25, 24.2, D / 2 + 1.0, 0.8, 0.25, 2.1, trim()));
    p.push(box(lx, 2.75, D / 2 + 1.6, 6.5, 0.28, 3.2, A(trim(), { under: true })), posts(lx - 2.9, D / 2 + 2.9, 2, [5.8, 0, 0], 2.75, 0.16, trim(T.MINT)));
    p.push(box(lx, 3.03, D / 2 + 3.1, 6.5, 0.5, 0.12, A(trim(T.HOT), { glow: 0.5 })));
    return p;
};

/* 2 · THE SURF + BAIT SHACK: aqua corrugated, a lean-to roof, a striped awning, boards stood against the front */
B.surf = (W, D) => {
    const p = [];
    p.push(box(0, 0, 0, W, 4.0, D, A(wallM(T.AQUA, K.corr), { top: false })));
    p.push(roof('shed', 0, 4.0, 0, W, 2.2, D, A(wallM(T.STEEL, K.corr), { over: 0.6, keyEnd: K.corr, tintEnd: T.AQUA, under: true, roof: true })));
    p.push(pane('f', W, D, -1.2, 0.9, 5.25, 1.75, { key: K.shop, uv: [1.75, 1.75] }));
    p.push(box(W / 2 - 1.9, 0, D / 2 + 0.03, 1.1, 2.3, 0.1, trim(T.DARK)));
    p.push(...awning(-0.6, 2.9, D / 2 + 1.0, W - 1.6, 2.0, T.RED));
    [[T.LEMON, 0], [T.HOT, 0.75], [T.MINT, 1.5]].forEach(c => p.push(box(-W / 2 + 0.7 + c[1], 0, D / 2 + 2.25, 0.5, 2.3, 0.09, trim(c[0])), cyl(-W / 2 + 0.7 + c[1], 2.3, D / 2 + 2.25, 0.25, 0.4, A(trim(c[0]), { r2: 0.02, seg: 6 }))));
    p.push(box(0, 4.6, D / 2 + 0.25, 5, 1.1, 0.15, A(trim(T.LEMON), { glow: 0.4 })));
    return p;
};

/* 4 · THE ICE CREAM PARLOUR (a roof-route building: flat, 7 m): pink stucco, a mint cornice, striped awnings, a giant cone on its corner */
B.icecream = (W, D) => {
    const p = [];
    p.push(box(0, 0, 0, W + 2 * E, 6.3, D + 2 * E, A(wallM(T.PINK), { top: false })));
    p.push(...band(W, D, 6.3, 0.68, 0.3, wallM(T.MINT, K.plaster)), ...band(W, D, 3.3, 0.2, 0.12, trim()));
    p.push(pane('f', W, D, 0, 0.7, W - 1.75, 1.75, { key: K.shop, uv: [1.75, 1.75] }, 0.02), pane('f', W, D, 0, 4.0, W - 1.75, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02));
    ['l', 'r'].forEach(s => p.push(pane(s, W, D, 0, 4.0, D - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane(s, W, D, 0, 0.7, D - 7, 1.75, { key: K.shop, uv: [1.75, 1.75] }, 0.02)));
    p.push(...awning(0, 2.65, D / 2 + 0.9, W - 0.8, 1.8, T.MINT));
    /* the cone: on a bracket off the front's right corner */
    const cx = W / 2 + 0.9, cz = D / 2 + 0.9;
    p.push(box(cx - 0.6, 4.3, cz - 0.6, 1.4, 0.2, 1.4, trim()));
    p.push(cyl(cx, 4.4, cz, 0.12, 2.5, { key: K.check, tint: 0xe0a860, r2: 1.05, seg: 12, cap: false, uv: 0.7 }));
    p.push(dome(cx, 6.9, cz, 1.1, 1.15, trim(T.PINK)), dome(cx, 7.75, cz, 0.8, 0.9, trim(T.CREAM)), dome(cx, 8.45, cz, 0.22, 0.25, trim(T.RED)));
    return p;
};

/* 5 · THE BOAT WORKSHOP: teal corrugated under a barrel vault, a roller shutter, a hull on trestles is dressing */
B.boatshop = (W, D) => {
    const p = [];
    p.push(box(0, 0, 0, W, 5.0, D, A(wallM(T.TEAL, K.corr), { top: false })));
    p.push(roof('barrel', 0, 5.0, 0, D, 2.8, W, A(wallM(T.STEEL, K.corr), { ry: 90, over: 0.35, keyEnd: K.corr, tintEnd: T.TEAL, seg: 10, roof: true })));
    p.push(pane('f', W, D, -W / 2 + 4.4, 0, 5.2, 3.8, wallM(T.GREY, K.shutter), 0.02), pane('f', W, D, W / 2 - 3.5, 1.2, 3.5, 1.75, glass(T.GLASS, K.gFac), 0.02));
    p.push(box(-W / 2 + 4.4, 3.8, D / 2 + 0.2, 5.8, 0.3, 0.4, trim(T.YELLOW)));
    p.push(...band(W, D, 4.7, 0.3, 0.1, trim()));
    return p;
};

/* 6 · THE CINEMA: a stepped cream-and-lemon front, a glass drum over a ring marquee, a 26 m blade sign, the auditorium a plain box behind */
B.cinema = (W, D, lx) => {
    const p = [], H = 14, fz = D / 2, fd = 8;
    p.push(box(0, 0, -fd / 2, W, H, D - fd, A(wallM(T.CREAM, K.plaster), { faces: 'blr', keyTop: K.conc, tintTop: T.GREY })));              // the auditorium
    p.push(...band(W, D - fd, H - 0.5, 0.5, 0.1, trim(T.LEMON)).map(q => A(q, { p: [q.p[0], q.p[1], q.p[2] - fd / 2] })));
    p.push(box(0, 0, fz - fd / 2, W, 8, fd, A(wallM(T.LEMON, K.plaster), { faces: 'lr', top: false })));                                             // the front, three steps
    p.push(doorFront(W, D, 8, lx, wallM(T.LEMON, K.plaster)));
    p.push(box(0, 8, fz - fd / 2, W, 0.35, fd + 0.6, trim()));
    p.push(box(lx, 8.35, fz - 3.2, W * 0.68, 4.2, 6.4, wallM(T.CREAM)), box(lx, 12.55, fz - 3.2, W * 0.68 + 0.5, 0.3, 6.9, trim()));
    p.push(box(lx, 12.85, fz - 3.0, W * 0.4, 3.6, 5.0, wallM(T.LEMON, K.plaster)), box(lx, 16.45, fz - 3.0, W * 0.4 + 0.5, 0.3, 5.5, trim()));
    [-1, 1].forEach(s => p.push(pane('f', W, D, lx + s * (W * 0.34 + 1.9), 0.9, 2.6, 4.4, glass(T.PINK, K.gTall, 0.45), 0.02)));          // the poster cases
    /* the marquee: a half ring over the doors, a glass drum standing on it */
    p.push(cyl(lx, 3.0, fz, 5.4, 1.3, A(trim(T.HOT), { arc: 180, a0: 0, seg: 24, glow: 0.55 })));
    p.push(cyl(lx, 2.92, fz, 5.55, 0.1, A(trim(T.LEMON), { arc: 180, seg: 24, glow: 0.6, ds: true })), cyl(lx, 4.3, fz, 5.55, 0.1, A(trim(T.LEMON), { arc: 180, seg: 24, glow: 0.6 })));
    p.push(cyl(lx, 4.4, fz, 4.4, 3.6, A(glass(T.AQUA, K.gTall, 0.5), { arc: 180, seg: 24, cap: false })), cyl(lx, 8.0, fz, 4.6, 0.3, A(trim(), { arc: 180, seg: 24 })));
    p.push(posts(lx - 4.6, fz + 2.6, 2, [9.2, 0, 0], 3.0, 0.2, trim(T.CREAM)));
    /* the blade */
    const bx = lx - W * 0.34 - 0.2;
    p.push(box(bx, 8.35, fz + 0.9, 1.0, 17.6, 3.0, A(trim(T.PINK), { glow: 0.5 })));
    p.push(A(box(bx, 9.6, fz + 0.9, 1.12, 0.35, 3.12, A(trim(T.LEMON), { glow: 0.7 })), { n: 6, step: [0, 3.0, 0] }));
    p.push(cyl(bx, 25.95, fz + 0.9, 0.9, 1.6, A(trim(T.LEMON), { r2: 0.05, seg: 8, glow: 0.6 })));
    return p;
};

/* 7 · THE LOOKOUT PAVILION: eight columns on a marble disc, a teal cone roof */
B.lookout = () => {
    const p = [];
    p.push(cyl(0, 0, 0, 3.4, 0.1, { key: K.marble, seg: 16 }));
    p.push(cyl(0, 0, 0, 0.2, 3.3, A(trim(), { seg: 8, cap: false, ring: { n: 8, r: 2.9 } })));
    p.push(cyl(0, 3.3, 0, 3.25, 0.45, A(trim(), { ri: 2.6, seg: 16 })), cyl(0, 3.3, 0, 3.2, 0.05, A(trim(T.CREAM), { seg: 16, ds: true })));
    p.push(cyl(0, 3.75, 0, 3.9, 2.5, A(wallM(T.TEAL, K.corr), { r2: 0.05, seg: 8, ds: true, roof: true })), dome(0, 6.2, 0, 0.3, 0.4, trim(T.LEMON)));
    return p;
};

/* 8 · THE STREET MARKET HALL: three gabled roofs on posts over a low wall, open to the air */
B.market = (W, D, lx) => {
    const p = [], n = 3, bay = W / n, tints = [T.CORAL, T.LEMON, T.AQUA];
    p.push(box(0, 0, -D / 2 + 0.1, W, 1.1, 0.2, wallM(T.CREAM)), box(-W / 2 + 0.1, 0, 0, 0.2, 1.1, D, wallM(T.CREAM)), box(W / 2 - 0.1, 0, 0, 0.2, 1.1, D, wallM(T.CREAM)));
    p.push(A(doorFront(W, D, 1.1, lx, wallM(T.CREAM)), { ds: true }));
    const k = Math.round(W / 3.5);
    p.push(posts(-W / 2 + 0.15, D / 2 - 0.1, k + 1, [(W - 0.3) / k, 0, 0], 4.0, 0.15), posts(-W / 2 + 0.15, -D / 2 + 0.1, k + 1, [(W - 0.3) / k, 0, 0], 4.0, 0.15));
    p.push(box(0, 4.0, D / 2 - 0.1, W + 0.3, 0.3, 0.3, trim()), box(0, 4.0, -D / 2 + 0.1, W + 0.3, 0.3, 0.3, trim()));
    for (let i = 0; i < n; i++) p.push(roof('gable', -W / 2 + bay * (i + 0.5), 4.3, 0, D, 2.3, bay, A(wallM(tints[i], K.corr), { ry: 90, over: 0.45, keyEnd: K.planks, tintEnd: T.CREAM, ds: true, roof: true })));
    p.push(box(lx, 3.0, D / 2 + 0.15, 4.4, 0.9, 0.12, A(trim(T.HOT), { glow: 0.4 })));
    return p;
};

/* 10 · THE FLORIST: a round mint glasshouse on the street, a greenhouse shed behind, a lilac disc roof */
B.florist = (W, D) => {
    const p = [], r = W / 2 - 0.1, cz = D / 2 - r;
    p.push(cyl(0, 0, cz, r, 0.7, A(wallM(T.CREAM), { seg: 24, cap: false })), cyl(0, 0.7, cz, r, 3.1, A(glass(T.MINT, K.gSq2, 0.45), { seg: 24, cap: false })));
    p.push(cyl(0, 3.8, cz, r + 0.9, 0.35, A(trim(T.LILAC), { seg: 24, ds: true })), dome(0, 4.15, cz, r * 0.55, 1.5, A(glass(T.MINT, K.gSq2, 0.45), { seg: 16 })), dome(0, 5.6, cz, 0.3, 0.4, trim(T.LILAC)));
    const bd = D - r - 0.6;
    p.push(box(0, 0, -D / 2 + bd / 2, W - 1.0, 0.7, bd, A(wallM(T.CREAM), { top: false })), box(0, 0.7, -D / 2 + bd / 2, W - 1.0, 2.3, bd, A(glass(T.MINT, K.gFac, 0.4), { top: false })));
    p.push(roof('gable', 0, 3.0, -D / 2 + bd / 2, bd, 1.6, W - 1.0, A(glass(T.MINT, K.gFac, 0.4), { ry: 90, over: 0.15, roof: true })));
    return p;
};

/* 11 · THE FOOD HALL (a roof-route building: flat, 7 m): a factory-glass hall inside a ring of sand columns */
B.foodhall = (W, D, lx) => {
    const p = [];
    p.push(box(0, 0, 0, W + 2 * E, 0.8, D + 2 * E, A(wallM(T.SAND, K.plaster), { top: false })), box(0, 0.8, 0, W + 2 * E, 5.0, D + 2 * E, A(glass(T.GLASS, K.gFac, 0.38), { top: false })));
    p.push(...band(W, D, 5.8, 1.18, 0.35, wallM(T.SAND, K.plaster)));
    const col = (x0, z0, n, step) => A(box(x0, 0, z0, 0.7, 5.8, 0.7, wallM(T.SAND, K.plaster)), { n, step });
    const kx = Math.round(W / 3.5), kz = Math.round(D / 3.5);
    p.push(col(-W / 2, D / 2 + 0.2, kx + 1, [W / kx, 0, 0]), col(-W / 2, -D / 2 - 0.2, kx + 1, [W / kx, 0, 0]), col(-W / 2 - 0.2, -D / 2 + D / kz, kz - 1, [0, 0, D / kz]), col(W / 2 + 0.2, -D / 2 + D / kz, kz - 1, [0, 0, D / kz]));
    /* the way in: a terracotta porch on the door side */
    p.push(box(lx, 0, D / 2 + 0.5, 5.0, 4.6, 0.5, A(wallM(T.TERRA), { faces: 'f', top: false })), box(lx, 0, D / 2 + 0.78, 1.9, 2.4, 0.06, trim(T.DARK)));
    p.push(box(lx, 4.6, D / 2 + 1.3, 6.0, 0.3, 2.6, A(trim(), { under: true })), posts(lx - 2.7, D / 2 + 2.4, 2, [5.4, 0, 0], 4.6, 0.16));
    p.push(...awning(-W / 2 + 5.4, 3.0, D / 2 + 1.2, 6.0, 1.8, T.TERRA), ...awning(W / 2 - 5.4, 3.0, D / 2 + 1.2, 6.0, 1.8, T.TERRA));
    return p;
};

/* 12 · THE SECURITY OFFICE (a roof-route building: flat, 7 m): a two-grey bunker, the upper floor oversailing, slit windows, a yellow cap */
B.security = (W, D, lx) => {
    const p = [];
    p.push(box(0, 0, 0, W - 0.5, 3.5, D - 0.5, { key: K.conc, tint: T.DARK, gain: 1.5, top: false }));
    p.push(box(0, 3.5, 0, W + 0.5, 2.9, D + 0.5, { key: K.conc, tint: T.STEEL, gain: 1.7, top: false, under: true }));
    p.push(...band(W + 0.4, D + 0.4, 6.4, 0.58, 0.12, trim(T.YELLOW)));
    ['f', 'b'].forEach(s => p.push(A(pane(s, W + 0.5, D + 0.5, -W / 2 + 2.6, 4.6, 2.4, 0.6, glass(T.GLASS, K.gSq, 0.5), 0.02), { n: Math.floor((W - 3) / 3.5) + 1, step: [s === 'f' ? 3.5 : -3.5, 0, 0] })));
    p.push(box(lx, 0, D / 2 - 0.2, 2.0, 2.4, 0.08, trim(T.NAVY)), box(lx, 2.5, D / 2 + 0.1, 3.0, 0.25, 0.9, trim(T.YELLOW)));
    p.push(pane('f', W - 0.5, D - 0.5, W / 2 - 4.2, 0, 4.2, 3.0, wallM(T.GREY, K.shutter), 0.02));
    /* the mast and the dish stand off the right end (the roof is a route) */
    p.push(cyl(W / 2 + 1.2, 0, -D / 2 + 1.4, 0.14, 13, A(trim(T.STEEL), { seg: 6 })), box(W / 2 + 1.2, 10.5, -D / 2 + 1.4, 1.8, 0.1, 0.1, trim(T.STEEL)), box(W / 2 + 1.2, 11.6, -D / 2 + 1.4, 1.2, 0.1, 0.1, trim(T.STEEL)));
    p.push(dome(W / 2 + 1.2, 8.2, -D / 2 + 2.0, 1.0, 0.45, A(trim(T.WHITE), { ds: true })), dome(W / 2 + 1.2, 13, -D / 2 + 1.4, 0.16, 0.2, A(trim(T.RED), { glow: 0.9 })));
    return p;
};

/* 13 · THE STAFF APARTMENTS: a mint three-storey walk-up, balconies, a coral stair tower, a water tank */
B.apartments = (W, D) => {
    const p = [], H = 10.5;
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.MINT), { keyTop: K.conc, tintTop: T.GREY })));
    'fblr'.split('').forEach(s => { const len = (s === 'f' || s === 'b') ? W : D; p.push(pane(s, W, D, 0, 0.9, len - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane(s, W, D, 0, 4.4, len - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane(s, W, D, 0, 7.9, len - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02)); });
    p.push(A(box(-1.75, 3.4, D / 2 + 0.7, W - 5.2, 0.16, 1.4, A(trim(), { under: true })), { n: 2, step: [0, 3.5, 0] }), A(box(-1.75, 3.56, D / 2 + 1.36, W - 5.2, 0.95, 0.08, trim(T.CORAL)), { n: 2, step: [0, 3.5, 0] }));
    p.push(...band(W, D, H, 0.6, 0.1, trim()));
    p.push(box(W / 2 - 1.6, 0, D / 2 + 0.3, 3.4, H + 2.2, 3.4, wallM(T.CORAL)), pane('f', 3.4, 3.4, 0, 1.0, 1.2, H, glass(T.AQUA, K.gTall, 0.4), 0.02));
    p[p.length - 1].p = [W / 2 - 1.6, 1.0, D / 2 + 2.0 + E + 0.02];
    p.push(cyl(-W / 2 + 3.2, H + 1.6, -D / 2 + 3.2, 1.4, 1.9, A(wallM(T.CREAM, K.planks), { seg: 12 })), cyl(-W / 2 + 3.2, H + 3.5, -D / 2 + 3.2, 1.55, 0.8, A(trim(T.CORAL), { r2: 0.05, seg: 12 })));
    p.push(A(cyl(-W / 2 + 2.3, H, -D / 2 + 2.3, 0.1, 1.6, A(trim(T.DARK), { seg: 6, cap: false })), { n: 2, step: [1.8, 0, 0] }), A(cyl(-W / 2 + 2.3, H, -D / 2 + 4.1, 0.1, 1.6, A(trim(T.DARK), { seg: 6, cap: false })), { n: 2, step: [1.8, 0, 0] }));
    return p;
};

/* 14 · THE LOADING DOCK: a corrugated warehouse, a six-tooth sawtooth roof in navy with glass in every tooth, a yellow dock canopy, three shutters */
B.dock = (W, D, lx) => {
    const p = [], H = 7, n = 6, tw = W / n;
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.STEEL, K.corr), { faces: 'blr', top: false })));
    p.push(doorFront(W, D, H, lx, wallM(T.STEEL, K.corr)));
    p.push(A(roof('shed', -W / 2 + tw / 2, H, 0, D, 2.0, tw, A(wallM(T.NAVY, K.corr), { ry: 90, keyEnd: K.gFac, tintEnd: T.GLASS, roof: true })), { n, step: [tw, 0, 0] }));
    p.push(...band(W, D, 0, 1.1, 0.06, { key: K.conc, tint: T.DARK }));
    for (let i = 0; i < 3; i++) { const u = -W / 2 + 4.4 + i * 5.25; if (Math.abs(u - lx) > 3.2) p.push(pane('f', W, D, u, 1.1, 3.6, 3.2, wallM(T.GREY, K.shutter), 0.03)); }
    p.push(box(-W / 2 + 9.6, 4.5, D / 2 + 1.4, 15.5, 0.25, 2.8, A(trim(T.YELLOW), { under: true })), posts(-W / 2 + 2.2, D / 2 + 2.6, 4, [4.95, 0, 0], 4.5, 0.12, trim(T.YELLOW)));
    return p;
};

/* 15 · THE PARKING BOOTH (a roof-route building: flat, 7 m): a lemon box in navy bands, a glass strip */
B.booth = (W, D) => {
    const p = [];
    p.push(box(0, 0, 0, W + 2 * E, 7 - 0.02, D + 2 * E, A(wallM(T.LEMON, K.plaster), { top: false })));
    p.push(...band(W, D, 2.9, 0.5, 0.1, trim(T.NAVY)), ...band(W, D, 6.3, 0.68, 0.14, trim(T.NAVY)));
    p.push(...allFaces(W - 1.75, D - 1.75, 1.0, 1.75, glass(T.GLASS, K.gSq, 0.4), (1.75 / 2) + 0.02));
    p.push(box(0, 3.5, D / 2 + 0.3, 2.2, 2.2, 0.3, A(trim(T.NAVY), { glow: 0.3 })), box(0, 4.0, D / 2 + 0.47, 1.0, 1.2, 0.04, A(trim(T.WHITE), { glow: 0.6 })));   // the P sign's plate
    return p;
};

/* 16 · THE MALL ARCH: two coral pylons under aqua domes, a span between them, a barrel crown (x runs across the walk) */
B.arch = (half) => {
    const p = [];
    [-1, 1].forEach(s => {
        p.push(box(s * half, 0, 0, 2.4, 8.2, 2.4, wallM(T.CORAL)), box(s * half, 0, 0, 2.7, 0.9, 2.7, wallM(T.CREAM, K.plaster)), box(s * half, 8.2, 0, 2.9, 0.35, 2.9, trim()));
        p.push(dome(s * half, 8.55, 0, 1.25, 1.5, A(wallM(T.AQUA, K.plaster), { seg: 14 })), cyl(s * half, 10.0, 0, 0.1, 1.6, A(trim(), { r2: 0.01, seg: 6 })));
    });
    p.push(box(0, 5.6, 0, 2 * half - 2.4, 1.7, 1.3, A(trim(T.CREAM), { under: true, glow: 0.25 })));
    p.push(box(0, 5.95, 0, 2 * half - 4.4, 1.0, 1.42, A(trim(T.HOT), { glow: 0.55 })));                                                       // the name band
    p.push(roof('barrel', 0, 7.3, 0, 1.3, 1.5, 2 * half - 2.4, A(wallM(T.AQUA, K.plaster), { ry: 90, seg: 12 })));
    return p;
};

/* 17 · THE BANDSTAND: eight columns on a marble octagon, an aqua dome */
B.bandstand = () => {
    const p = [];
    p.push(cyl(0, 0, 0, 4.3, 0.12, { key: K.marble, seg: 8 }));
    p.push(cyl(0, 0, 0, 0.22, 3.6, A(trim(), { seg: 8, cap: false, ring: { n: 8, r: 3.7, a0: 22.5 } })));
    p.push(cyl(0, 3.6, 0, 4.1, 0.5, A(trim(), { ri: 3.3, seg: 8 })), cyl(0, 3.6, 0, 3.32, 0.06, A(trim(T.CREAM), { seg: 8, ds: true })));
    p.push(dome(0, 4.1, 0, 4.0, 2.6, A(wallM(T.AQUA, K.plaster), { seg: 16, roof: true })), cyl(0, 6.7, 0, 0.12, 1.4, A(trim(T.LEMON), { r2: 0.01, seg: 6 })));
    return p;
};

/* 18 · THE MALL CONCOURSE: four hip-roofed sand wings round a glass cross vault, a glass dome on the crossing, a coral portal on the plaza */
B.mall = (W, D, lx) => {
    const p = [], H = 10.5, arm = 8.4, cw = (W - arm) / 2, cd = (D - arm) / 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
        const x = c[0] * (arm / 2 + cw / 2), z = c[1] * (arm / 2 + cd / 2);
        p.push(box(x, 0, z, cw + (c[0] ? 2 * E : 0), H, cd + 2 * E, A(wallM(c[0] * c[1] > 0 ? T.SAND : T.CREAM), { top: false })));
        p.push(roof('hip', x, H + 0.3, z, cw, 2.7, cd, A(wallM(T.TERRA, K.corr), { over: 0.55, roof: true })), box(x, H, z, cw + 0.7, 0.3, cd + 0.7, trim()));
        ['f', 'b', 'l', 'r'].forEach(s => { const out = (s === 'f' && c[1] > 0) || (s === 'b' && c[1] < 0) || (s === 'l' && c[0] < 0) || (s === 'r' && c[0] > 0); if (!out) return;
            const len = (s === 'f' || s === 'b') ? cw : cd, q = pane(s, cw, cd, 0, 0.6, len - 1.75, 3.0, glass(T.GLASS, K.gSq, 0.4), 0.03), q2 = pane(s, cw, cd, 0, 5.3, len - 1.75, 3.5, { key: K.win, uv: [3.5, 3.5] }, 0.03);
            [q, q2].forEach(v => { v.p = [v.p[0] + x, v.p[1], v.p[2] + z]; p.push(v); }); });
    });
    /* the arcades on the plaza side: an awning along each wing */
    [-1, 1].forEach(s => p.push(...awning(s * (arm / 2 + cw / 2), 3.9, D / 2 + 1.1, cw - 0.6, 2.2, T.CORAL)));
    /* the cross vault: glass ends, glass barrels, the dome */
    const vh = 9.0;
    p.push(pane('b', arm, D, 0, 0, arm, vh, glass(T.AQUA, K.gTall, 0.45)), pane('l', W, arm, 0, 0, arm, vh, glass(T.AQUA, K.gTall, 0.45)), pane('r', W, arm, 0, 0, arm, vh, glass(T.AQUA, K.gTall, 0.45)));
    p.push(A(doorFront(arm, D, vh, lx, glass(T.AQUA, K.gTall, 0.45)), { size: [arm, vh] }));
    p.push(roof('barrel', 0, vh, 0, D + 2 * E, 3.4, arm, A(glass(T.AQUA, K.gFac, 0.45), { ry: 90, seg: 12, ds: true, roof: true })), roof('barrel', 0, vh, 0, W + 2 * E, 3.4, arm, A(glass(T.AQUA, K.gFac, 0.45), { seg: 12, ds: true, roof: true })));
    p.push(cyl(0, vh + 2.6, 0, 5.6, 1.3, A(wallM(T.CREAM, K.plaster), { seg: 24, cap: false, roof: true })), cyl(0, vh + 3.9, 0, 5.9, 0.3, A(trim(), { seg: 24, ri: 5.2, roof: true })));
    p.push(dome(0, vh + 4.2, 0, 5.5, 4.6, A(glass(T.AQUA, K.gSq2, 0.5), { seg: 24, rings: 8, roof: true })), cyl(0, vh + 8.7, 0, 0.5, 0.5, A(trim(), { seg: 8, roof: true })), cyl(0, vh + 9.2, 0, 0.14, 3.2, A(trim(T.LEMON), { r2: 0.01, seg: 6, roof: true })));
    /* the portal on the plaza: two coral piers, a lintel, a barrel crown (the doorway is in the glass behind it) */
    const pz = D / 2 + 0.9;
    [-1, 1].forEach(s => p.push(box(s * (arm / 2 + 0.3), 0, pz, 1.5, 11.2, 1.8, wallM(T.CORAL)), box(s * (arm / 2 + 0.3), 11.2, pz, 1.9, 0.35, 2.2, trim()), dome(s * (arm / 2 + 0.3), 11.55, pz, 0.8, 1.0, A(wallM(T.AQUA, K.plaster), { seg: 12 }))));
    p.push(box(0, 9.2, pz, arm - 0.9, 1.6, 1.5, A(trim(T.CREAM), { under: true, glow: 0.25 })), box(0, 9.5, pz + 0.05, arm - 2.6, 1.0, 1.52, A(trim(T.HOT), { glow: 0.55 })));
    p.push(roof('barrel', 0, 10.8, pz, 1.5, 2.3, arm - 0.9, A(wallM(T.CORAL), { ry: 90, seg: 12 })));
    /* the service door (the back wing), the shutter exit (the right arm) */
    p.push(pane('b', W, D, W / 2 - cw / 2 - 2, 0, 1.4, 2.3, trim(T.DARK), 0.05), pane('r', W, D, 0, 0, 5.2, 3.6, wallM(T.GREY, K.shutter), 0.05));
    return p;
};

/* 20 · THE JUICE BAR: a round orange with a leaf, a low cream wing either side */
B.juice = (W, D) => {
    const p = [], r = Math.min(D / 2 - 0.05, 5.2);
    p.push(box(0, 0, -0.6, W, 3.3, D - 1.2, A(wallM(T.CREAM), { keyTop: K.conc, tintTop: T.GREY })));
    p.push(...band(W, D - 1.2, 3.3, 0.35, 0.12, trim(T.ORANGE)).map(q => A(q, { p: [q.p[0], q.p[1], q.p[2] - 0.6] })));
    [-1, 1].forEach(s => p.push(pane('f', W, D - 1.2, s * (W / 2 - (W / 2 - r) / 2 - 0.2), 0.7, W / 2 - r - 0.9, 1.75, { key: K.shop, uv: [1.75, 1.75] }, -0.58), ...awning(s * (W / 2 - (W / 2 - r) / 2 - 0.2), 2.6, D / 2 - 0.4, W / 2 - r - 0.4, 1.6, T.ORANGE)));
    p.push(cyl(0, 0, 0, r, 3.4, A(wallM(T.ORANGE, K.plaster), { seg: 24, cap: false })), dome(0, 3.4, 0, r, r * 0.92, A(wallM(T.ORANGE, K.plaster), { seg: 24, rings: 8 })));
    p.push(box(0, 0.9, r - 0.5, 4.2, 1.6, 1.3, A(glass(T.GLASS, K.gSq, 0.5), { top: false })), box(0, 0, r - 0.5, 4.4, 0.9, 1.4, wallM(T.CREAM)));                                                           // the serving hatch
    p.push(box(0, 2.6, r + 0.5, 5.0, 0.16, 1.2, A(trim(), { under: true })));
    p.push(cyl(0, 3.4 + r * 0.92 - 0.1, 0, 0.16, 1.1, A(trim(0x7a5a34), { seg: 6 })), box(0.9, 3.4 + r * 0.92 + 0.75, 0, 1.9, 0.1, 0.95, A(trim(T.LEAF), { ry: 20, under: true })));
    return p;
};

/* 21 · THE CARPORTS: butterfly shade roofs on a post row behind the cars (x along the row; the long wing reaches forward, +z, over them) */
B.carport = (len) => {
    const p = [], k = Math.round(len / 3.5);
    p.push(posts(-len / 2 + 0.4, 0, k + 1, [(len - 0.8) / k, 0, 0], 3.0, 0.13, trim(T.NAVY)));
    p.push(box(0, 2.5, 0, len, 0.18, 0.3, trim(T.NAVY)));
    p.push(roof('shed', 0, 2.6, 2.6, len, 1.3, 5.2, { ry: 180, key: K.corr, tint: T.AQUA, gain: 2.0, ds: true }), roof('shed', 0, 2.6, -0.7, len, 0.5, 1.4, { key: K.corr, tint: T.AQUA, gain: 2.0, ds: true }));
    return p;
};

/* 22 · THE HARBOUR MASTER: a white house under a navy hip roof, a tower with a glazed lantern room, a flagpole */
B.harbour = (W, D) => {
    const p = [], H = 7, tx = W / 2 - 1.75;
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.WHITE, K.plaster), { top: false })), roof('hip', 0, H, 0, W, 2.2, D, A(wallM(T.NAVY, K.corr), { over: 0.5, roof: true })));
    p.push(...band(W, D, 0, 0.9, 0.06, trim(T.NAVY)));
    p.push(pane('f', W, D, -1.75, 1.0, W - 5.25, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane('f', W, D, -1.75, 4.4, W - 5.25, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane('b', W, D, 0, 4.4, W - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02));
    p.push(box(tx, 0, D / 2 - 1.2, 3.3, 12.5, 3.3, wallM(T.WHITE, K.plaster)), box(tx, 0, D / 2 + 0.47, 1.2, 2.3, 0.06, trim(T.NAVY)));
    p.push(box(tx, 12.5, D / 2 - 1.2, 4.3, 0.25, 4.3, A(trim(T.NAVY), { under: true })), cyl(tx, 12.75, D / 2 - 1.2, 1.5, 2.1, A(glass(T.GLASS, K.gSq, 0.6), { seg: 12, cap: false })));
    p.push(cyl(tx, 14.85, D / 2 - 1.2, 2.0, 1.5, A(trim(T.NAVY), { r2: 0.05, seg: 12 })), cyl(tx, 16.35, D / 2 - 1.2, 0.07, 3.2, A(trim(), { seg: 6 })), box(tx + 0.75, 18.5, D / 2 - 1.2, 1.4, 0.85, 0.04, A(trim(T.RED), { ds: true })));
    return p;
};

/* ── the plan: the cinema and the mall face WEST ── */
const WEST = { 'P10-08-B1': { x: 2, y: 5, ox: 1, oy: 5, side: 'W' }, 'P10-10-B1': { x: 2, y: 5, ox: 1, oy: 5, side: 'W' } };
function tailor(PLAN) {
    PLAN.plots.forEach(p => p.buildings.forEach(b => { const w = WEST[b.id]; if (w && !(b.doors[0] && b.doors[0].side === 'W')) b.doors.unshift(Object.assign({}, w)); }));
}

/* ── the build ── */
const SIDE_ROT = { S: 0, W: 90, N: 180, E: 270 };
const DESIGN = {
    'P08-08-B1': { fn: 'hotel', storeys: 9 }, 'P08-08-B2': { fn: 'surf', storeys: 1, solid: true },
    'P09-08-B2': { fn: 'icecream' }, 'P09-08-B3': { fn: 'boatshop', storeys: 2, solid: true },
    'P10-08-B1': { fn: 'cinema', storeys: 4 },
    'P08-09-B1': { fn: 'market', storeys: 1 }, 'P08-09-B2': { fn: 'florist', storeys: 1, solid: true },
    'P09-09-B1': { fn: 'foodhall' }, 'P10-09-B1': { fn: 'security' }, 'P10-09-B2': { fn: 'apartments', storeys: 3, solid: true },
    'P11-09-B1': { fn: 'dock', storeys: 2 }, 'P11-09-B2': { fn: 'booth' },
    'P10-10-B1': { fn: 'mall', storeys: 3 }, 'P11-10-B2': { fn: 'juice', storeys: 1, solid: true },
};
function apply(ctx) {
    const { features, lateRows, props, bInfo, take, gc, gx, r3, N } = ctx, out = { arch: 0, parts: 0 };
    const byId = {}; features.forEach(f => { if (f.id) byId[f.id] = f; });
    const push = (id, x, z, rot, parts) => { lateRows.push({ k: 'arch', id: 'dc:' + id + ':arch', x: r3(x), z: r3(z), rot, parts: parts.map(q => round(q, r3)) }); out.arch++; out.parts += parts.length; };
    Object.keys(DESIGN).forEach(id => {
        const d = DESIGN[id], row = byId['dc:' + id], info = bInfo.find(b => b.id === id);
        if (!row || !info) { console.warn('[bayside] no row for', id); return; }
        let W, D, rot, lx = 0;
        if (row.k === 'plateau') { row.bld = Object.assign({}, row.bld, { skin: false }); rot = SIDE_ROT[info.side]; const ew = info.side === 'E' || info.side === 'W'; W = ew ? row.d : row.w; D = ew ? row.w : row.d;
            const p = ctx.plotOf[info.plot], b = p.buildings.find(q => q.id === id), dr = b.doors[0];
            const k = info.side === 'S' ? (dr.x - b.x) : info.side === 'N' ? (b.x + b.w - 1 - dr.x) : info.side === 'E' ? (b.y + b.h - 1 - dr.y) : (dr.y - b.y); lx = doorLx(W, Math.round(k * 3.5 / 1.75) + 1); }
        else { row.skin = false; delete row.key; if (d.storeys) row.storeys = d.storeys; if (d.solid) { delete row.hollow; delete row.door; delete row.style; } W = row.w; D = row.d; rot = row.rot || 0; lx = doorLx(W, row.door); }
        push(id, row.x, row.z, rot, B[d.fn](W, D, lx));
    });
    /* the things the plan has no building for: each on yard squares it takes (so no tree, bench or bin is dressed onto them) */
    const cell = (px, py, cx, cy) => [px * N + cx, py * N + cy];
    const takeRect = (px, py, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) take(px * N + x, py * N + y); };
    const ghost = (x, z, t, h) => lateRows.push({ k: 'wall', x0: r3(x), z0: r3(z), x1: r3(x), z1: r3(z), h, t, key: K.stucco, ghost: true, rail: false });
    /* 7 the lookout: the Marina lookout's east strip, on the cross walk's line */
    { const x = gx(11 * N + 10), z = gx(8 * N + 8); takeRect(11, 8, 9, 7, 10, 8); push('bay-lookout', x, z, 0, B.lookout()); }
    /* 9 the taco stand: the market's yard, serving the cross walk */
    { const c = cell(8, 9, 1, 7); takeRect(8, 9, 1, 7, 2, 8); props.push({ key: 'city_taco_stand', x: r3(gx(c[0] + 1)), z: r3(gc(c[1])), face: 180 }); }
    /* 16 the mall arch: over the Arrival court's east walk, a pylon in the yard either side */
    { const x = gc(8 * N + 10), z = gx(10 * N + 6), half = 5.25; takeRect(8, 10, 10, 4, 10, 4); takeRect(8, 10, 10, 7, 10, 7); push('bay-arch', x, z, 90, B.arch(half)); ghost(x, z - half, 2.4, 8); ghost(x, z + half, 2.4, 8); }
    /* 17 the bandstand: the Cordon plaza's north lawn */
    { const x = gx(9 * N + 6), z = gx(10 * N + 3); takeRect(9, 10, 4, 1, 7, 4); push('bay-bandstand', x, z, 0, B.bandstand()); }
    /* 21 the carports: the Loading / parking plot's south band, three in a row */
    { const z = gx(11 * N + 10.55); takeRect(9, 11, 1, 10, 10, 10); [1, 3, 4, 6, 7, 9, 10].forEach(c => take(9 * N + c, 11 * N + 9));   // (the parked cars keep their squares: 2, 5, 8)
      [2.5, 6, 9.5].forEach((c, i) => push('bay-carport' + (i + 1), gx(9 * N + c), z, 180, B.carport(10.5))); }
    /* 22 the harbour master: the Boardwalk exit's south-west yard, its front to the road */
    { const x = gx(11 * N + 4), z = gx(11 * N + 10), W = 7, D = 7; takeRect(11, 11, 3, 9, 4, 10);
      lateRows.push({ k: 'texbuilding', id: 'dc:bay-harbourmaster', x: r3(x), z: r3(z), w: W, d: D, rot: 180, storeys: 2, seed: 7711, skin: false }); push('bay-harbourmaster', x, z, 180, B.harbour(W, D)); }
    console.warn('[bayside]', JSON.stringify(out));
}
/* numbers to the millimetre (the data.js block stays short) */
function round(q, r3) { const o = {}; Object.keys(q).forEach(k => { const v = q[k]; o[k] = typeof v === 'number' && !/^(tint|tintTop|tintEnd)$/.test(k) ? r3(v) : Array.isArray(v) ? v.map(a => typeof a === 'number' ? r3(a) : Array.isArray(a) ? a.map(r3) : a) : (v && typeof v === 'object') ? round(v, r3) : v; }); return o; }

module.exports = { tailor, apply, B, K, T };
