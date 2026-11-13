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
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.CORAL), { faces: 'blr', keyTop: K.conc, tintTop: T.GREY })), pane('f', W, D, 0, 3.5, W + 2 * E, H - 3.5, wallM(T.CORAL), -E));   // (the front is open behind the doorway: the lobby)
    p.push(doorFront(W, D, 3.5, lx, wallM(T.CREAM)));
    ['f', 'b'].forEach(s => p.push(pane(s, W, D, 0, 3.5, W - 3.5, H - 4.2, { key: K.win, uv: [3.5, 3.5] }, 0.02)));                    // a window a bay, two rows a floor
    ['l', 'r'].forEach(s => p.push(pane(s, W, D, 0, 3.5, 3.5, H - 4.2, glass(T.AQUA, K.gTall), 0.02)));                                 // a glass stair slot up each end
    p.push(...band(W, D, 3.4, 0.22, 0.7, trim()), A(box(0, 6.9, 0, W + 1.4, 0.22, D + 1.4, A(trim(), { under: true })), { n: 8, step: [0, 3.5, 0] }));   // (the first is a band: a slab would cut through the lobby)                         // the eyebrows
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
B.surf = (W, D, lx) => {
    const p = [];
    p.push(box(0, 0, 0, W, 4.0, D, A(wallM(T.AQUA, K.corr), { faces: 'blr', top: false })), doorFront(W, D, 4.0, lx, wallM(T.AQUA, K.corr)));   // a walk-in (the interiors pass)
    p.push(roof('shed', 0, 4.0, 0, W, 2.2, D, A(wallM(T.STEEL, K.corr), { over: 0.6, keyEnd: K.corr, tintEnd: T.AQUA, under: true, roof: true })));
    p.push(pane('f', W, D, -1.2, 0.9, 5.25, 1.75, { key: K.shop, uv: [1.75, 1.75] }));
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
B.boatshop = (W, D, lx) => {
    const p = [];
    p.push(box(0, 0, 0, W, 5.0, D, A(wallM(T.TEAL, K.corr), { faces: 'blr', top: false })), doorFront(W, D, 5.0, lx, wallM(T.TEAL, K.corr)));   // a walk-in (the interiors pass)
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
B.harbour = (W, D, lx) => {
    const p = [], H = 7, tx = W / 2 - 1.75;
    p.push(box(0, 0, 0, W, H, D, A(wallM(T.WHITE, K.plaster), { faces: 'blr', top: false })), doorFront(W, D, H, lx, wallM(T.WHITE, K.plaster)), roof('hip', 0, H, 0, W, 2.2, D, A(wallM(T.NAVY, K.corr), { over: 0.5, roof: true })));
    p.push(...band(W, D, 0, 0.9, 0.06, trim(T.NAVY)).slice(1), box((-W / 2 + lx - 0.9) / 2, 0, D / 2 + 0.03, lx - 0.9 + W / 2, 0.9, 0.06, trim(T.NAVY)), box((lx + 0.9 + W / 2) / 2, 0, D / 2 + 0.03, W / 2 - lx - 0.9, 0.9, 0.06, trim(T.NAVY)));   // (the dado stops either side of the doorway)
    p.push(pane('f', W, D, -2.6, 1.0, 1.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane('f', W, D, -1.75, 4.4, W - 5.25, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02), pane('b', W, D, 0, 4.4, W - 3.5, 1.75, { key: K.win, uv: [3.5, 1.75] }, 0.02));
    p.push(box(tx, 0, D / 2 - 1.2, 3.3, 12.5, 3.3, wallM(T.WHITE, K.plaster)), box(tx, 0, D / 2 + 0.47, 1.2, 2.3, 0.06, trim(T.NAVY)));
    p.push(box(tx, 12.5, D / 2 - 1.2, 4.3, 0.25, 4.3, A(trim(T.NAVY), { under: true })), cyl(tx, 12.75, D / 2 - 1.2, 1.5, 2.1, A(glass(T.GLASS, K.gSq, 0.6), { seg: 12, cap: false })));
    p.push(cyl(tx, 14.85, D / 2 - 1.2, 2.0, 1.5, A(trim(T.NAVY), { r2: 0.05, seg: 12 })), cyl(tx, 16.35, D / 2 - 1.2, 0.07, 3.2, A(trim(), { seg: 6 })), box(tx + 0.75, 18.5, D / 2 - 1.2, 1.4, 0.85, 0.04, A(trim(T.RED), { ds: true })));
    return p;
};


/* ══ THE BEACH (2026-11-13, mondo 17:05: "bayside needs to have the actual bayside in it too (the beach), with sand and a pier and stuff,
   thats like the whole point"; 17:11 "yes add sea wall and water") ══
   Past the plot grid's east edge, along Bayside's four plot rows (cells cx 144.., cy 96..143; bake-disaster-city.js `room.east`):
     cx 144-145  THE BOARDWALK: a plank promenade on top of the sea wall (the city's level, 0)
     cx 146-151  THE SAND: a shelf 1.05 m under the boardwalk (the sea wall is that drop), four ramps down to it
     cx 152..    THE BAY: the shelf slopes under the water (terrain.sea at -1.45) to 3.6 m down
     THE PIER on the mall's axis (the mall dome, the East shops), a square head with a pavilion; a bait hut half way
     THE BREAKWATER: a concrete mole off the boardwalk's north end, the lighthouse on its head
     THE GRILL DECK: the BurgerPiz (the pack's own building, real size) on a plank deck at the south end
   North of Bayside the strip is open water under a quay wall (the city's east edge). */
const EAST = 20, SEA_Y = -1.45, SHELF = -1.05, DEEP = -3.6;
/* no skyline in the water: the whole east side, the north side past the quay, the south side past the grill deck */
const room = { east: EAST, sea: { y: SEA_Y, key: 'water', field: true }, backdropOpen: [[252 + EAST * 3.5 - 1, -400, 400, 400], [254, -400, 400, -250], [252 + 14 * 3.5 - 4, 250, 400, 400]] };

/* the pier head's pavilion: an octagon of columns under a pink cone, a glazed lantern on top */
B.pavilion = () => {
    const p = [];
    p.push(cyl(0, 0.05, 0, 6.6, 0.12, { key: K.planks, seg: 8 }));
    p.push(cyl(0, 0, 0, 0.24, 4.0, A(trim(), { seg: 8, cap: false, ring: { n: 8, r: 6.0, a0: 22.5 } })));
    p.push(cyl(0, 4.0, 0, 6.5, 0.5, A(trim(), { ri: 5.6, seg: 8 })), cyl(0, 4.0, 0, 5.62, 0.06, A(trim(T.CREAM), { seg: 8, ds: true })));
    p.push(cyl(0, 4.5, 0, 7.2, 2.6, A(wallM(T.PINK, K.corr), { r2: 2.2, seg: 8, cap: false, ds: true, roof: true })));
    p.push(cyl(0, 7.1, 0, 2.0, 1.5, A(glass(T.GLASS, K.gSq, 0.6), { seg: 8, cap: false, roof: true })), cyl(0, 8.6, 0, 2.6, 1.5, A(wallM(T.PINK, K.corr), { r2: 0.05, seg: 8, roof: true })), cyl(0, 10.1, 0, 0.08, 1.8, A(trim(), { seg: 6, roof: true })));
    p.push(cyl(0, 0, 0, 1.3, 1.0, A(wallM(T.CREAM), { seg: 8 })));                                                                       // the kiosk counter in the middle
    return p;
};
/* the pier: lamp posts down both sides, piles under it (x along the pier, from its root) */
B.pier = (len, w) => {
    const p = [], n = Math.floor(len / 10.5);
    [-1, 1].forEach(s => {
        p.push(A(cyl(5.25, 0, s * (w / 2 - 0.25), 0.07, 3.4, A(trim(T.NAVY), { seg: 6, cap: false })), { n, step: [10.5, 0, 0] }), A(dome(5.25, 3.4, s * (w / 2 - 0.25), 0.22, 0.26, A(trim(T.CREAM), { glow: 0.9, seg: 8 })), { n, step: [10.5, 0, 0] }));
        p.push(A(cyl(3.5, -4.2, s * (w / 2 - 0.5), 0.22, 4.1, { key: K.planks, tint: 0x8a6a48, seg: 6, cap: false }), { n: Math.floor(len / 3.5), step: [3.5, 0, 0] }));
    });
    return p;
};
/* the bait + tackle hut on its own bit of deck */
B.bait = () => {
    const p = [];
    p.push(box(0, 0.05, 0, 4.2, 2.6, 4.2, A(wallM(T.LEMON, K.corr), { top: false })), roof('gable', 0, 2.65, 0, 4.2, 1.2, 4.2, A(wallM(T.RED, K.corr), { over: 0.4, keyEnd: K.planks, tintEnd: T.CREAM, roof: true })));
    p.push(pane('f', 4.2, 4.2, 0.4, 1.0, 2.2, 1.1, glass(T.GLASS, K.gSq, 0.5), 0.02), ...awning(0.4, 2.1, 2.1 + 0.6, 3.0, 1.2, T.RED), box(-1.5, 0.05, 2.14, 0.9, 2.1, 0.06, trim(T.NAVY)));
    return p;
};
/* the lifeguard station: a hut on stilts over the sand, a red hip roof, a ramp, a flag (its floor at the boardwalk's level) */
B.lifeguard = () => {
    const p = [], y0 = 1.3;
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(c => p.push(cyl(c[0], 0, c[1], 0.12, y0, { key: K.planks, seg: 6, cap: false })));
    p.push(box(0, y0, 0, 5.0, 0.16, 5.0, { key: K.planks, under: true }), box(0, y0 + 0.16, -0.5, 3.6, 2.3, 3.0, A(wallM(T.WHITE, K.planks), { top: false })));
    p.push(roof('hip', 0, y0 + 2.46, -0.5, 3.6, 1.3, 3.0, A(wallM(T.RED, K.corr), { over: 0.7, roof: true })));
    p.push(pane('f', 3.6, 3.0, 0, y0 + 0.9, 2.6, 1.1, glass(T.GLASS, K.gSq, 0.5), 0.02)); p[p.length - 1].p[2] -= 0.5;
    p.push(A(box(0, y0 + 0.16, 2.4, 5.0, 0.06, 0.06, trim(T.RED)), { n: 2, step: [0, 0.5, 0] }), box(-2.45, y0 + 0.16, 2.4, 0.08, 1.0, 0.08, trim(T.RED)), box(2.45, y0 + 0.16, 2.4, 0.08, 1.0, 0.08, trim(T.RED)));
    p.push(cyl(1.9, y0 + 2.4, -1.9, 0.05, 3.4, A(trim(), { seg: 6 })), box(2.45, y0 + 5.0, -1.9, 1.1, 0.7, 0.04, A(trim(T.RED), { ds: true })));
    p.push(box(-3.4, 0.55, 1.4, 2.4, 0.1, 1.2, { key: K.planks, under: true }), box(-3.9, 0, 1.4, 0.1, 0.55, 1.2, { key: K.planks }));           // the step up
    return p;
};
/* the volleyball net: two posts, the net between them (x along it) */
B.net = () => [posts(-4.5, 0, 2, [9, 0, 0], 2.5, 0.07, trim(T.NAVY)), { s: 'quad', p: [0, 1.45, 0], size: [9, 1.0], key: 'urban:MetalTruss1a', kind: 'over', ds: true, uv: [0.5, 0.5], tint: T.WHITE }, box(0, 2.43, 0, 9, 0.05, 0.05, trim())];

/* ══ THE POLISH PASS (2026-11-13, mondo 20:15: "one more polish pass on the exteriors ... go one or two more layers deep with the detail,
   the foundation is already there and is good"; 20:18 "roofs and ac units"; 20:19 "and textures, different textures or decals for different
   parts of the building") ══
   A second layer over every building above (POLISH.<name> gets the same arguments and the parts list to add to): the building's NAME in
   letters (the arch row's `text` part), a base course in a sheet of its own (tile, subway tile, marble, bare concrete), window sills and
   heads, pilasters and dentils, downpipes with hoppers, wall AC units with grilles, vent grilles, service doors (the pack's door sheets),
   wall lamps, and the roof: a membrane sheet, parapet coping, AC plant, vent stacks, hatches, aerials. Roof-route buildings (ice cream,
   food hall, security, parking booth) keep their roofs clear: their plant hangs on the walls. */
const KP = {
    subway: 'urban:TileSubway1a', subwayB: 'urban:TileSubway3a', tileB: 'urban:TileGeneric3a', tileC: 'urban:TileGeneric6a', tileD: 'urban:TileGeneric2a', marbleB: 'urban:TileMarble2a',
    under: 'urban:ConcreteUnderTiles1a', bare: 'urban:ConcreteUnderTiles1a', metal: 'urban:MetalCorrugatedPainted1a', wallTile: 'urban:TileSubway2a',   // (the metro pack's sheets drew black on an arch row: the urban pack's only)
    rubber: 'urban:RubberNonSlip1a', rubberB: 'urban:RubberNonSlip3a',
    grill: 'urban:MetalSubwayGrill1a', grillB: 'urban:MetalSubwayGrill2a', truss: 'urban:MetalTruss1a', ceil: 'urban:FibreCeilingTile1a',
    doorP: 'urban:DoorPaintedHalf1a', doorP2: 'urban:DoorPaintedHalf3a', doorW: 'urban:DoorWoodenHalf1a', hazard: 'urban:SignHazard1a', caution: 'urban:SignCaution1a', strip: 'urban:ConcreteStriped1a',
};
const mat = (key, tint, gain) => ({ key, tint: tint == null ? T.WHITE : tint, gain: gain || 1.6 });
const flen = (s, W, D) => (s === 'f' || s === 'b') ? W : D;
const stepOf = (s, du) => s === 'f' ? [du, 0, 0] : s === 'b' ? [-du, 0, 0] : s === 'r' ? [0, 0, -du] : [0, 0, du];
/* a box proud of a face (u along the face from its middle, as `pane`) */
const bar = (s, W, D, u, y, w, h, dep, o, off) => { const q = (off || 0) + dep / 2; return s === 'f' ? box(u, y, D / 2 + q, w, h, dep, o) : s === 'b' ? box(-u, y, -D / 2 - q, w, h, dep, o) : s === 'r' ? box(W / 2 + q, y, -u, dep, h, w, o) : box(-W / 2 - q, y, u, dep, h, w, o); };
const bars = (s, W, D, u0, du, n, y, w, h, dep, o, off) => A(bar(s, W, D, u0, y, w, h, dep, o, off), n > 1 ? { n, step: stepOf(s, du) } : {});
const spot = (s, W, D, u, out) => s === 'f' ? [u, D / 2 + out] : s === 'b' ? [-u, -D / 2 - out] : s === 'r' ? [W / 2 + out, -u] : [-W / 2 - out, u];
/* the word on a face: `proud` metres off the footprint's face */
const sign = (s, W, D, u, y, w, h, text, o, proud) => pane(s, W, D, u, y, w, h, A({ text, ink: '#ffffff' }, o), (proud == null ? 0.03 : proud) - E);
/* a sign board: a backing box and the word on it */
const board = (s, W, D, u, y, w, h, text, bgTint, o, dep) => [bar(s, W, D, u, y, w, h, dep || 0.12, A(trim(bgTint), (o && o.glow) ? { glow: o.glow * 0.5 } : {})), sign(s, W, D, u, y + h * 0.08, w * 0.92, h * 0.84, text, o, (dep || 0.12) + 0.015)];
/* a window row's sill and head */
const winTrim = (s, W, D, u, y, w, h, tint) => [bar(s, W, D, u, y - 0.13, w + 0.3, 0.13, 0.18, trim(tint)), bar(s, W, D, u, y + h, w + 0.2, 0.12, 0.1, trim(tint))];
/* pilasters along a face: `k` bays */
const pilasters = (s, W, D, k, y, h, o, w, dep) => bars(s, W, D, -(flen(s, W, D) - (w || 0.4)) / 2, (flen(s, W, D) - (w || 0.4)) / k, k + 1, y, w || 0.4, h, dep || 0.1, o);
/* a dentil course under a cornice */
const dentils = (s, W, D, y, o) => { const L = flen(s, W, D), n = Math.max(2, Math.floor(L / 0.55)); return bars(s, W, D, -L / 2 + 0.2, (L - 0.4) / (n - 1), n, y, 0.26, 0.2, 0.14, o); };
/* a downpipe: the hopper under the eaves, the pipe, its brackets, a shoe */
const pipe = (s, W, D, u, H, tint, y0) => { const c = spot(s, W, D, u, 0.1), o = trim(tint == null ? T.STEEL : tint), b = y0 || 0;
    return [cyl(c[0], b, c[1], 0.065, H - b - 0.3, A({ seg: 6, cap: false }, o)), box(c[0], H - 0.34, c[1], 0.3, 0.34, 0.26, o), A(box(c[0], b + 0.9, c[1], 0.22, 0.05, 0.22, trim(T.DARK)), { n: Math.max(1, Math.floor((H - b - 1) / 2.6)), step: [0, 2.6, 0] })]; };
/* a wall AC unit: the box, its grille, the drip stain under it (the wall's own sheet, darker) */
const ac = (s, W, D, u, y, wall) => { const p = [bar(s, W, D, u, y, 0.95, 0.62, 0.42, mat(KP.metal, T.STEEL, 1.5)), pane(s, W, D, u, y + 0.07, 0.72, 0.46, { key: KP.grill, uv: 'fit', tint: T.GREY, kind: 'wall' }, 0.43 - E), bar(s, W, D, u, y - 0.07, 0.8, 0.07, 0.3, trim(T.DARK))];
    if (wall) p.push(pane(s, W, D, u, Math.max(0, y - 1.5), 0.5, Math.min(1.43, y), { key: wall.key, tint: wall.tint, gain: (wall.gain || 1) * 0.74 }, 0.012));
    return p; };
const acRow = (s, W, D, u0, du, n, y, wall) => { const p = []; for (let i = 0; i < n; i++) p.push(...ac(s, W, D, u0 + du * i, y, wall)); return p; };
/* a vent grille, a service door (the pack's painted door, a step, a lamp over it), a wall lamp */
const vent = (s, W, D, u, y, w, h) => [pane(s, W, D, u, y, w, h, { key: KP.grillB, uv: 'fit', tint: T.GREY, kind: 'wall' }, 0.03), bar(s, W, D, u, y - 0.06, w + 0.12, 0.06, 0.08, trim(T.DARK))];
const lamp = (s, W, D, u, y) => [bar(s, W, D, u, y, 0.12, 0.3, 0.2, trim(T.DARK)), bar(s, W, D, u, y - 0.16, 0.26, 0.26, 0.26, A(trim(T.CREAM), { glow: 0.95 }), 0.16)];
const svcDoor = (s, W, D, u, key, tint) => [pane(s, W, D, u, 0, 1.15, 2.2, { key: key || KP.doorP, uv: 'fit', tint: tint == null ? T.WHITE : tint, kind: 'wall', gain: 1.5 }, 0.03), bar(s, W, D, u, 2.2, 1.4, 0.1, 0.12, trim()), bar(s, W, D, u, 0, 1.5, 0.14, 0.5, mat(KP.bare, T.GREY)), ...lamp(s, W, D, u, 2.5)];
/* the roof: an AC plant unit on a kerb (its fan on top, a grille on its face), a mushroom vent, a hatch, an aerial, a duct run */
const plant = (x, y, z, big) => { const w = big ? 2.6 : 1.7, h = big ? 1.3 : 0.95, d = big ? 1.5 : 1.1;
    return [box(x, y, z, w + 0.3, 0.14, d + 0.3, mat(KP.bare, T.GREY)), box(x, y + 0.14, z, w, h, d, mat(KP.metal, T.STEEL, 1.5)), { s: 'quad', p: [x, y + 0.24, z + d / 2 + 0.01], size: [w * 0.8, h * 0.72], key: KP.grill, uv: 'fit', tint: T.GREY, kind: 'wall' },
        cyl(x - (big ? 0.6 : 0), y + 0.14 + h, z, 0.42, 0.1, A(trim(T.DARK), { seg: 10 })), ...(big ? [cyl(x + 0.6, y + 0.14 + h, z, 0.42, 0.1, A(trim(T.DARK), { seg: 10 }))] : [])]; };
const stack = (x, y, z, h) => [cyl(x, y, z, 0.16, h || 0.8, A(trim(T.STEEL), { seg: 8, cap: false })), cyl(x, y + (h || 0.8), z, 0.32, 0.1, A(trim(T.STEEL), { seg: 8 }))];
const hatch = (x, y, z) => [box(x, y, z, 1.1, 0.35, 1.1, mat(KP.bare, T.GREY)), box(x, y + 0.35, z, 1.2, 0.06, 1.2, mat(KP.metal, T.STEEL, 1.5))];
const aerial = (x, y, z, h) => [cyl(x, y, z, 0.035, h, A(trim(T.DARK), { seg: 5 })), box(x, y + h * 0.72, z, 1.1, 0.03, 0.03, trim(T.DARK)), box(x, y + h * 0.86, z, 0.8, 0.03, 0.03, trim(T.DARK)), box(x, y + h - 0.05, z, 0.5, 0.03, 0.03, trim(T.DARK))];
const duct = (x0, y, z0, x1, z1) => box((x0 + x1) / 2, y, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.4, 0.4, Math.abs(z1 - z0) + 0.4, mat(KP.metal, T.STEEL, 1.5));
/* a flat roof's finish: the membrane sheet just over the slab, a coping on the parapet line */
const roofSkin = (W, D, y, key, tint, cx, cz) => A({ s: 'quad', flat: true, p: [cx || 0, y + 0.02, cz || 0], size: [W - 0.3, D - 0.3], key, tint: tint == null ? T.GREY : tint, gain: 1.5, roof: true });
const coping = (W, D, y, tint, cx, cz) => band(W, D, y, 0.1, 0.16, trim(tint)).map(q => A(q, { p: [q.p[0] + (cx || 0), q.p[1], q.p[2] + (cz || 0)] }));
const moved = (parts, dx, dz) => parts.map(q => A({}, q, { p: [q.p[0] + dx, q.p[1], q.p[2] + dz] }));
/* a base course round a box in a sheet of its own */
const plinth = (W, D, h, key, tint, gain) => band(W, D, 0, h, 0.07, mat(key, tint, gain));
/* a planter: a tiled box, green in it */
const planter = (x, z, w, d) => [box(x, 0, z, w, 0.55, d, mat(KP.tileB, T.TERRA, 1.8)), box(x, 0.5, z, w - 0.16, 0.34, d - 0.16, trim(T.LEAF))];

/* a rail between the columns of a ring (n columns at radius r, the first at a0 degrees), `skip` = the bays left open (their index).
   Written out one by one: the arch row's `ring` turns a part the mirrored way, right only for a part that is the same all round. */
const ringRails = (cx, cz, n, r, a0, y, skip, o) => { const out = [], st = 360 / n, rr = r * Math.cos(st * Math.PI / 360), L = 2 * r * Math.sin(st * Math.PI / 360) - 0.3;
    for (let i = 0; i < n; i++) { if ((skip || []).indexOf(i) >= 0) continue; const a = (a0 + st * (i + 0.5)) * Math.PI / 180; out.push(A(box(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr, L, 0.07, 0.07, o || trim()), { ry: a * 180 / Math.PI + 90 })); }
    return out; };
/* THE LETTERING (three-renderer.js _hqArchSignTex, the city's shared sign part: key 'txt:WORDS|ink|bg|aspect'): a part written here with
   `text` becomes that key; `vert: true` (a blade sign) becomes one square part a letter, stacked. */
const lettered = (parts) => { const out = [];
    parts.forEach(q => { if (q.text == null) { out.push(q); return; }
        const o = A({}, q), word = String(q.text).replace(/'/g, ''), ink = q.ink || '#ffffff', bg = q.bg || '', w = q.size[0], h = q.size[1]; delete o.text; delete o.ink; delete o.bg; delete o.vert;
        if (!q.vert) { out.push(A(o, { key: 'txt:' + word + '|' + ink + '|' + bg + '|' + (Math.round(w / h * 100) / 100), uv: 'fit', kind: bg ? 'wall' : 'over' })); return; }
        const n = word.length, ch = h / n;
        for (let i = 0; i < n; i++) out.push(A({}, o, { p: [q.p[0], q.p[1] + h - ch * (i + 1) + ch * 0.06, q.p[2]], size: [w, ch * 0.88], key: 'txt:' + word[i] + '|' + ink + '|' + bg + '|' + (Math.round(w / (ch * 0.88) * 100) / 100), uv: 'fit', kind: bg ? 'wall' : 'over' })); });
    return out; };
const POLISH = {};
POLISH.hotel = (p, W, D, lx) => {
    const H = 31.5, body = wallM(T.CORAL);
    p.push(...plinth(W, D, 0.8, KP.marbleB, T.CREAM, 1.7), ...band(W, D, 3.05, 0.3, 0.1, trim()));
    ['l', 'r', 'b'].forEach(s => p.push(pane(s, W, D, 0, 0.8, flen(s, W, D) + 2 * E, 2.25, mat(KP.subway, T.CREAM, 1.9), 0.01)));                       // the ground storey: cream tile, not the body's stucco
    /* the balconies: a glass balustrade on every eyebrow, fins between the bays (front and back) */
    const k = Math.max(2, Math.round((W - 3.5) / 3.5));
    ['f', 'b'].forEach(s => {
        p.push(A(bar(s, W, D, 0, 3.62, W - 3.5, 0.9, 0.05, A(glass(T.AQUA, K.gSq, 0.25), { uv: [1.75, 0.9], win: 'keep' }), 0.62), { n: 8, step: [0, 3.5, 0] }));
        p.push(A(bar(s, W, D, 0, 4.52, W - 3.5, 0.05, 0.08, trim(), 0.6), { n: 8, step: [0, 3.5, 0] }));
        p.push(bars(s, W, D, -(W - 3.5) / 2, (W - 3.5) / k, k + 1, 3.62, 0.09, H - 3.9, 0.66, trim(T.CREAM)));
    });
    /* the roof: membrane, the lift overrun, plant, stacks, the letters on a truss along the front */
    p.push(roofSkin(W, D, H, KP.rubber, T.GREY), ...coping(W, D, H + 0.9, T.WHITE));
    p.push(box(-W / 4, H, -D / 4, 4.2, 2.8, 3.6, wallM(T.CREAM, K.plaster)), box(-W / 4, H + 2.8, -D / 4, 4.6, 0.2, 4.0, trim()), ...moved(svcDoor('f', 4.2, 3.6, 0, KP.doorP2), -W / 4, -D / 4).map(q => A(q, { p: [q.p[0], q.p[1] + H, q.p[2]] })));
    p.push(...plant(-W / 2 + 4, H, D / 4 - 1, true), ...plant(-W / 2 + 8, H, D / 4 - 1, true), ...plant(2, H, -D / 4, false), ...stack(4.5, H, -D / 4), ...stack(5.6, H, -D / 4), ...hatch(0, H, D / 4), duct(-W / 2 + 4, H + 0.5, D / 4 - 3, -W / 4, D / 4 - 3), ...aerial(-W / 4 + 1, H + 3.0, -D / 4, 4.5));
    const sw = Math.min(W * 0.5, 15);
    p.push({ s: 'quad', p: [-W / 2 + sw / 2 + 2, H + 0.9, D / 2 - 0.5], size: [sw, 3.4], key: KP.truss, kind: 'over', ds: true, uv: [1.75, 1.75], tint: T.STEEL });
    p.push({ s: 'quad', p: [-W / 2 + sw / 2 + 2, H + 1.2, D / 2 - 0.44], size: [sw - 0.6, 2.8], text: 'HOTEL', ink: '#ff5a7a', glow: 0.9 });
    /* the fin's letters, the canopy's, the door's lamps and planters */
    const fx = -W / 2 + 5.25, fz = D / 2 + 1.0;
    p.push({ s: 'quad', p: [fx - 0.26, 7.7, fz], ry: 90, size: [1.6, 16], text: 'HOTEL', vert: true, ink: '#ffffff', glow: 0.8 }, { s: 'quad', p: [fx + 0.26, 7.7, fz], ry: 270, size: [1.6, 16], text: 'HOTEL', vert: true, ink: '#ffffff', glow: 0.8 });
    p.push({ s: 'quad', p: [lx, 3.06, D / 2 + 3.17], size: [3.2, 0.44], text: 'HOTEL', ink: '#ffffff', glow: 0.7 });
    p.push(...lamp('f', W, D, lx - 2.4, 2.0), ...lamp('f', W, D, lx + 2.4, 2.0), ...planter(lx - 3.6, D / 2 + 0.6, 1.2, 0.9), ...planter(lx + 3.6, D / 2 + 0.6, 1.2, 0.9));
    p.push({ s: 'quad', flat: true, p: [lx, 0.03, D / 2 + 1.7], size: [3.0, 3.2], key: KP.rubberB, tint: T.RED, gain: 1.6 });                                 // the door mat (a red carpet)
    /* the back: the service door, a vent bank, the pipes down the back corners */
    p.push(...svcDoor('b', W, D, W / 2 - 3, KP.doorP2), ...vent('b', W, D, W / 2 - 6, 1.2, 1.6, 1.0), ...vent('b', W, D, -W / 2 + 4, 1.2, 1.6, 1.0), ...pipe('b', W, D, W / 2 - 0.5, H, T.CREAM), ...pipe('b', W, D, -W / 2 + 0.5, H, T.CREAM));
    p.push(...acRow('l', W, D, -D / 2 + 3, 0, 1, 1.4, null), ...acRow('r', W, D, D / 2 - 3, 0, 1, 1.4, null));
    void body;
};
POLISH.surf = (p, W, D) => {
    p.push(...plinth(W, D, 0.5, K.planks, 0x9a7a54, 1.4));
    ['f', 'b'].forEach(s => p.push(bar(s, W, D, -W / 2 + 0.09, 0, 0.18, 4.0, 0.06, trim()), bar(s, W, D, W / 2 - 0.09, 0, 0.18, 4.0, 0.06, trim())));
    p.push(sign('f', W, D, 0, 4.66, 4.6, 0.98, 'SURF SHOP', { ink: '#2c4470' }, 0.335));
    p.push(...board('f', W, D, W / 2 - 1.9, 2.45, 1.1, 0.42, 'OPEN', T.RED, { glow: 0.5 }, 0.08));
    p.push(pane('l', W, D, 0, 1.3, 1.6, 1.3, A(glass(T.GLASS, K.gRes, 0.3), { uv: 'fit' }), 0.02), ...winTrim('l', W, D, 0, 1.3, 1.6, 1.3), pane('r', W, D, 0, 1.3, 1.6, 1.3, A(glass(T.GLASS, K.gRes, 0.3), { uv: 'fit' }), 0.02), ...winTrim('r', W, D, 0, 1.3, 1.6, 1.3));
    p.push(box(-W / 2 + 1.45, 1.7, D / 2 + 2.3, 2.3, 0.07, 0.07, { key: K.planks }), box(-W / 2 + 1.45, 0.25, D / 2 + 2.3, 2.3, 0.07, 0.3, { key: K.planks }));       // the board rack
    p.push(...svcDoor('b', W, D, 0, KP.doorW), ...ac('b', W, D, -W / 2 + 1.5, 2.2, wallM(T.AQUA, K.corr)), ...pipe('b', W, D, W / 2 - 0.3, 4.0, T.WHITE));
    const c = spot('b', W, D, W / 2 - 0.3, 0.55); p.push(cyl(c[0], 0, c[1], 0.42, 0.95, { key: K.planks, tint: 0x8a6a48, seg: 10 }));                                // the rain barrel under the pipe
    p.push(...stack(W / 4, 4.9, -D / 4, 0.9));
};
POLISH.icecream = (p, W, D, lx) => {
    const body = wallM(T.PINK);
    p.push(...plinth(W, D, 0.7, KP.tileC, T.MINT, 1.9));
    p.push(pilasters('f', W, D, Math.max(2, Math.round(W / 5.25)), 0.7, 5.6, wallM(T.CREAM, K.plaster)), ...['f', 'l', 'r'].map(s => dentils(s, W, D, 6.08, trim())));
    p.push(...winTrim('f', W, D, 0, 4.0, W - 1.75, 1.75), ...winTrim('l', W, D, 0, 4.0, D - 3.5, 1.75), ...winTrim('r', W, D, 0, 4.0, D - 3.5, 1.75));
    p.push(sign('f', W, D, 0, 6.36, Math.min(W - 2, 8), 0.56, 'ICE CREAM', { ink: '#ffffff' }, 0.31));
    p.push(...board('f', W, D, 0, 3.42, Math.min(W - 3, 6), 0.5, 'SUNDAES  SHAKES  CONES', T.HOT, { glow: 0.4 }, 0.1));
    p.push(...lamp('f', W, D, -W / 2 + 0.6, 2.9), ...lamp('f', W, D, W / 2 - 0.6, 2.9));
    p.push(...svcDoor('b', W, D, W / 2 - 2, KP.doorP), ...acRow('b', W, D, -W / 2 + 2, 2.2, 3, 4.1, body), ...vent('b', W, D, 0, 1.0, 1.4, 0.9), ...pipe('b', W, D, W / 2 - 0.4, 6.3, T.MINT), ...pipe('b', W, D, -W / 2 + 0.4, 6.3, T.MINT));
    p.push(pane('b', W, D, 0, 0.7, W + 2 * E, 2.3, mat(KP.wallTile, T.CREAM, 1.8), 0.008));                                                                       // the yard side's ground storey: white tile
};
POLISH.boatshop = (p, W, D) => {
    p.push(...plinth(W, D, 0.7, KP.bare, T.GREY, 1.5));
    'fb'.split('').forEach(s => p.push(bar(s, W, D, -W / 2 + 0.1, 0.7, 0.2, 4.0, 0.06, trim()), bar(s, W, D, W / 2 - 0.1, 0.7, 0.2, 4.0, 0.06, trim())));
    p.push(...board('f', W, D, 0, 5.25, Math.min(W - 3, 7), 1.0, 'BOAT REPAIR', T.WHITE, { ink: '#2c4470' }, 0.14));
    p.push(box(-W / 2 + 4.4, 4.2, D / 2 + 1.1, 0.22, 0.32, 2.2, mat(KP.metal, T.DARK, 1.3)), cyl(-W / 2 + 4.4, 3.0, D / 2 + 1.9, 0.03, 1.2, A(trim(T.DARK), { seg: 5, cap: false })), box(-W / 2 + 4.4, 2.8, D / 2 + 1.9, 0.22, 0.22, 0.1, trim(T.YELLOW)));   // the hoist beam, chain and hook
    p.push(pane('f', W, D, -W / 2 + 1.2, 1.2, 0.6, 0.6, { key: KP.hazard, uv: 'fit', kind: 'wall' }, 0.03), pane('f', W, D, -W / 2 + 7.6, 1.2, 0.6, 0.6, { key: KP.caution, uv: 'fit', kind: 'wall' }, 0.03));
    p.push(...winTrim('f', W, D, W / 2 - 3.5, 1.2, 3.5, 1.75, T.WHITE), ...lamp('f', W, D, -W / 2 + 4.4, 4.45));
    ['l', 'r'].forEach(s => p.push(pane(s, W, D, 0, 2.4, D - 5, 1.4, A(glass(T.GLASS, K.gFac, 0.3), { uv: [1.75, 1.4] }), 0.02), ...winTrim(s, W, D, 0, 2.4, D - 5, 1.4), ...vent(s, W, D, D / 2 - 1.5, 3.4, 1.2, 0.8)));
    p.push(...svcDoor('b', W, D, 0, KP.doorP2), ...pipe('f', W, D, W / 2 - 0.3, 5.0, T.WHITE), ...pipe('b', W, D, W / 2 - 0.3, 5.0, T.WHITE), ...ac('b', W, D, -W / 2 + 2, 2.4, wallM(T.TEAL, K.corr)));
    [-D / 4, 0, D / 4].forEach(z => p.push(cyl(0, 7.7, z, 0.4, 0.55, A(mat(KP.metal, T.STEEL, 1.5), { seg: 10, roof: true })), cyl(0, 8.25, z, 0.5, 0.25, A(trim(T.STEEL), { r2: 0.1, seg: 10, roof: true }))));   // the ridge ventilators
};
POLISH.cinema = (p, W, D, lx) => {
    const H = 14, fz = D / 2, fd = 8, AW = W, AD = D - fd, az = -fd / 2;
    /* the front: a marble base, fluting on the upper tiers, neon lines, the letters */
    p.push(pane('f', W, D, 0, 0, W + 2 * E, 0.9, mat(KP.marbleB, T.PINK, 1.7), 0.012), box(0, 0.9, fz + 0.06, W + 0.2, 0.1, 0.12, trim()));
    const t2 = W * 0.68, n2 = Math.max(3, Math.floor((t2 - 1.2) / 1.3) + 1);
    p.push(A(box(lx - (n2 - 1) * 0.65, 8.35, fz + 0.08, 0.26, 4.2, 0.16, trim()), { n: n2, step: [1.3, 0, 0] }));
    p.push(A(box(lx, 13.4, fz - 0.44, W * 0.4 - 0.6, 0.14, 0.1, A(trim(T.HOT), { glow: 0.8 })), { n: 3, step: [0, 1.0, 0] }));
    const bx = lx - W * 0.34 - 0.2;
    p.push({ s: 'quad', p: [bx - 0.51, 9.2, fz + 0.9], ry: 90, size: [2.3, 15.8], text: 'CINEMA', vert: true, ink: '#ffe27a', glow: 0.95 }, { s: 'quad', p: [bx + 0.51, 9.2, fz + 0.9], ry: 270, size: [2.3, 15.8], text: 'CINEMA', vert: true, ink: '#ffe27a', glow: 0.95 });
    p.push(box(lx, 3.05, fz + 5.45, 5.6, 1.2, 0.16, A(trim(T.WHITE), { glow: 0.45 })), { s: 'quad', p: [lx, 3.15, fz + 5.54], size: [5.2, 1.0], text: 'NOW SHOWING', ink: '#30343c' });
    p.push(A(box(0, 2.84, 0, 0.16, 0.14, 0.16, A(trim(T.CREAM), { glow: 1 })), { p: [lx, 2.84, fz], ring: { n: 15, r: 5.15, a0: 6, arc: 168 } }));                            // the chaser bulbs under the marquee
    [-1, 1].forEach(s => { const u = lx + s * (W * 0.34 + 1.9); p.push(bar('f', W, D, u, 0.78, 2.9, 0.12, 0.14, trim(T.LEMON)), bar('f', W, D, u, 5.3, 2.9, 0.12, 0.14, trim(T.LEMON)), bar('f', W, D, u - 1.39, 0.9, 0.12, 4.4, 0.14, trim(T.LEMON)), bar('f', W, D, u + 1.39, 0.9, 0.12, 4.4, 0.14, trim(T.LEMON))); });
    p.push(...board('f', W, D, lx + 3.4, 2.5, 1.9, 0.4, 'TICKETS', T.HOT, { glow: 0.5 }, 0.08), pane('f', W, D, lx + 3.4, 1.1, 1.3, 1.2, A(glass(T.GLASS, K.gSq, 0.5), { uv: 'fit' }), 0.02), bar('f', W, D, lx + 3.4, 1.0, 1.6, 0.08, 0.3, trim()));
    /* the auditorium: a tile base, pilasters, exits, plant on the roof */
    const mv = q => moved(q, 0, az);
    p.push(...mv(plinth(AW, AD, 1.0, KP.subwayB, T.CREAM, 1.8).slice(1)));
    ['l', 'r'].forEach(s => p.push(...mv([pilasters(s, AW, AD, Math.max(2, Math.round(AD / 5.25)), 1.0, H - 1.5, wallM(T.LEMON, K.plaster), 0.5, 0.12)]), ...mv(svcDoor(s, AW, AD, -AD / 4, KP.doorP2, T.HOT)), ...mv(board(s, AW, AD, -AD / 4, 2.95, 1.2, 0.34, 'EXIT', T.LEAF, { glow: 0.6 }, 0.06)), ...mv(pipe(s, AW, AD, AD / 2 - 0.5, H - 0.5, T.CREAM))));
    p.push(...mv(svcDoor('b', AW, AD, 0, KP.doorP2, T.HOT)), ...mv(acRow('b', AW, AD, -AW / 2 + 3, 0, 1, 2.6, wallM(T.CREAM, K.plaster))), ...mv(vent('b', AW, AD, AW / 2 - 3, 2.0, 2.0, 1.2)));
    p.push(roofSkin(AW, AD, H, KP.rubber, T.GREY, 0, az), ...coping(AW, AD, H, T.LEMON, 0, az), ...plant(-AW / 4, H, az - 1, true), ...plant(AW / 4, H, az - 1, true), duct(-AW / 4, H + 0.5, az + 1.2, AW / 4, az + 1.2), ...stack(0, H, az - AD / 2 + 2), ...hatch(AW / 2 - 2.5, H, az - AD / 2 + 2.5));
};
POLISH.lookout = (p) => {
    p.push(cyl(0, 0, 0, 3.95, 0.05, { key: KP.bare, tint: T.GREY, gain: 1.5, seg: 16 }));
    p.push(box(0, 0.1, 0, 0.56, 0.14, 0.56, A(trim(T.CREAM), { ring: { n: 8, r: 2.9 } })), box(0, 3.14, 0, 0.56, 0.16, 0.56, A(trim(T.CREAM), { ring: { n: 8, r: 2.9 } })));
    [0.95, 0.5].forEach(y => p.push(...ringRails(0, 0, 8, 2.9, 0, y, [0])));
    p.push(cyl(0, 0.1, 0, 1.15, 0.45, { key: K.planks, ri: 0.75, seg: 12 }), cyl(0, 0.1, 0, 0.75, 0.9, A(mat(KP.tileB, T.TEAL, 1.8), { seg: 12 })), dome(0, 1.0, 0, 0.6, 0.45, trim(T.LEAF)));
    p.push(box(0, 6.5, 0, 0.9, 0.04, 0.04, trim(T.DARK)), box(0, 6.5, 0, 0.04, 0.04, 0.9, trim(T.DARK)), box(0.3, 6.62, 0, 0.5, 0.22, 0.03, A(trim(T.RED), { ds: true })));
    p.push(A(box(0, 3.0, 0, 0.14, 0.14, 0.14, A(trim(T.CREAM), { glow: 1 })), { ring: { n: 8, r: 2.45, a0: 22.5 } }));
};
POLISH.market = (p, W, D, lx) => {
    p.push(box(0, 1.1, -D / 2 + 0.1, W + 0.1, 0.08, 0.34, trim()), box(-W / 2 + 0.1, 1.1, 0, 0.34, 0.08, D + 0.1, trim()), box(W / 2 - 0.1, 1.1, 0, 0.34, 0.08, D + 0.1, trim()));
    p.push(pane('b', W, D, 0, 0, W, 1.1, mat(KP.tileD, T.AQUA, 1.8), 0.11), pane('l', W, D, 0, 0, D, 1.1, mat(KP.tileD, T.AQUA, 1.8), 0.11), pane('r', W, D, 0, 0, D, 1.1, mat(KP.tileD, T.AQUA, 1.8), 0.11));
    p.push({ s: 'quad', p: [lx, 3.07, D / 2 + 0.22], size: [4.0, 0.76], text: 'MARKET', ink: '#ffffff', glow: 0.6 });
    /* bunting under the front beam, lamps hung from it */
    const nb = Math.max(4, Math.floor((W - 1) / 1.8));
    [T.RED, T.LEMON, T.AQUA].forEach((c, i) => p.push(A(box(-W / 2 + 0.6 + i * 0.6, 3.55, D / 2 - 0.1, 0.34, 0.4, 0.03, A(trim(c), { ds: true })), { n: nb, step: [1.8, 0, 0] })));
    const k = Math.round(W / 3.5);
    p.push(A(cyl(-W / 2 + 0.15 + (W - 0.3) / k / 2, 3.2, 0, 0.02, 0.8, A(trim(T.DARK), { seg: 4, cap: false })), { n: k, step: [(W - 0.3) / k, 0, 0] }), A(dome(-W / 2 + 0.15 + (W - 0.3) / k / 2, 3.0, 0, 0.2, 0.22, A(trim(T.CREAM), { glow: 0.9, seg: 8 })), { n: k, step: [(W - 0.3) / k, 0, 0] }));
    p.push(A(box(-W / 2 + 0.15, 3.8, 0, 0.2, 0.2, D - 0.2, trim()), { n: k + 1, step: [(W - 0.3) / k, 0, 0] }));                                              // the tie beams
    /* the stalls along the back wall: a plank counter, a striped valance, crates of fruit */
    const ns = Math.max(2, Math.floor((W - 2) / 4.2));
    for (let i = 0; i < ns; i++) { const x = -W / 2 + 1.75 + i * 7, z = -D / 2 + 1.75, c = [T.ORANGE, T.LEAF, T.RED, T.LEMON][i % 4];
        p.push(box(x, 0, z, 2.8, 0.95, 1.0, mat(K.planks, T.WHITE, 2.0)), ...awning(x, 2.3, z + 0.5, 3.0, 1.3, [T.CORAL, T.AQUA, T.LEMON][i % 3]), box(x - 0.7, 0.95, z, 0.9, 0.22, 0.7, mat(K.planks, 0xc8a070, 1.9)), box(x - 0.7, 1.1, z, 0.8, 0.14, 0.6, trim(c)), box(x + 0.6, 0.95, z, 0.9, 0.22, 0.7, mat(K.planks, 0xc8a070, 1.9)), box(x + 0.6, 1.1, z, 0.8, 0.14, 0.6, trim([T.RED, T.LEMON, T.ORANGE, T.LEAF][i % 4]))); }
    p.push({ s: 'quad', flat: true, p: [0, 0.03, 0], size: [W - 0.6, D - 0.6], key: KP.tileD, tint: T.CREAM, gain: 1.7 });                                         // the hall's tiled floor
};
POLISH.florist = (p, W, D, lx) => {
    const r = W / 2 - 0.1, cz = D / 2 - r, bd = D - r - 0.6, sz = -D / 2 + bd / 2;
    p.push(cyl(0, 0, cz, r + 0.06, 0.7, A(mat(KP.tileC, T.LILAC, 1.9), { seg: 24, cap: false })), cyl(0, 0.7, cz, r + 0.12, 0.08, A(trim(), { seg: 24, ri: r - 0.05 })), cyl(0, 2.3, cz, r + 0.06, 0.08, A(trim(), { seg: 24, ri: r - 0.02 })));
    p.push(box(0, 0.78, 0, 0.09, 3.0, 0.09, A(trim(), { p: [0, 0.78, cz], ring: { n: 12, r: r + 0.03, a0: 15 } })));                                               // the mullions
    p.push(...[-1, 1].map(s => box(lx + s * 1.0, 0, D / 2 + 0.06, 0.16, 2.4, 0.22, trim())), box(lx, 2.4, D / 2 + 0.06, 2.3, 0.16, 0.26, trim()));
    p.push(cyl(r * 0.78, 0, D / 2 + 0.5, 0.06, 3.0, A(trim(T.DARK), { seg: 6 })), box(r * 0.78 - 0.9, 2.9, D / 2 + 0.5, 1.9, 0.06, 0.06, trim(T.DARK)), box(r * 0.78 - 0.9, 2.1, D / 2 + 0.5, 1.9, 0.7, 0.06, trim(T.LILAC)),
        { s: 'quad', p: [r * 0.78 - 0.9, 2.16, D / 2 + 0.54], size: [1.75, 0.58], text: 'FLOWERS', ink: '#ffffff' }, { s: 'quad', p: [r * 0.78 - 0.9, 2.16, D / 2 + 0.46], ry: 180, size: [1.75, 0.58], text: 'FLOWERS', ink: '#ffffff' });
    [[T.PINK, 40], [T.LEMON, 140], [T.HOT, 320], [T.LILAC, 220]].forEach(c => { const a = c[1] * Math.PI / 180, x = Math.cos(a) * (r + 0.6), z = cz + Math.sin(a) * (r + 0.6);
        p.push(cyl(x, 0, z, 0.45, 0.5, A(mat(KP.tileB, T.TERRA, 1.8), { seg: 10 })), dome(x, 0.5, z, 0.5, 0.4, trim(T.LEAF)), dome(x + 0.15, 0.78, z, 0.2, 0.2, trim(c[0])), dome(x - 0.2, 0.74, z + 0.1, 0.17, 0.17, trim(c[0]))); });
    /* the greenhouse shed: glazing bars, a ridge cresting, the water butt */
    const nb = Math.max(3, Math.round(bd / 1.3));
    ['l', 'r'].forEach(s => p.push(...moved([bars(s, W - 1.0, bd, -bd / 2 + 0.05, (bd - 0.1) / nb, nb + 1, 0.7, 0.08, 2.3, 0.06, trim())], 0, sz)));
    p.push(box(0, 4.58, sz, 0.1, 0.14, bd + 0.3, trim()), ...moved(band(W - 1.0, bd, 2.95, 0.12, 0.08, trim()), 0, sz), ...moved(svcDoor('b', W - 1.0, bd, 0, KP.doorW), 0, sz));
    p.push(cyl(-W / 2 + 0.2, 0, sz, 0.4, 1.0, A(mat(KP.metal, T.TEAL, 1.6), { seg: 10 })), ...moved(pipe('l', W - 1.0, bd, 0, 3.0, T.WHITE), 0, sz));
};
POLISH.foodhall = (p, W, D, lx) => {
    p.push(...band(W, D, 0, 0.8, 0.05, mat(KP.tileB, T.TERRA, 1.8)), ...band(W, D, 3.2, 0.22, 0.05, wallM(T.SAND, K.plaster)));
    const col = (x0, z0, n, step, y, h, s) => A(box(x0, y, z0, s, h, s, trim(T.CREAM)), { n, step });
    const kx = Math.round(W / 3.5), kz = Math.round(D / 3.5);
    [[0, 0.35, 0.95], [5.5, 0.3, 1.0]].forEach(c => p.push(col(-W / 2, D / 2 + 0.2, kx + 1, [W / kx, 0, 0], c[0], c[1], c[2]), col(-W / 2, -D / 2 - 0.2, kx + 1, [W / kx, 0, 0], c[0], c[1], c[2]), col(-W / 2 - 0.2, -D / 2 + D / kz, kz - 1, [0, 0, D / kz], c[0], c[1], c[2]), col(W / 2 + 0.2, -D / 2 + D / kz, kz - 1, [0, 0, D / kz], c[0], c[1], c[2])));
    ['f', 'l', 'r', 'b'].forEach(s => p.push(dentils(s, W, D, 5.58, trim(T.CREAM))));
    p.push(box(lx, 4.9, D / 2 + 2.45, 5.6, 0.08, 0.1, trim(T.DARK)), { s: 'quad', p: [lx, 4.95, D / 2 + 2.5], size: [5.4, 1.1], text: 'FOOD HALL', ink: '#d9704a', glow: 0.6 }, { s: 'quad', p: [lx, 4.95, D / 2 + 2.48], ry: 180, size: [5.4, 1.1], text: 'FOOD HALL', ink: '#d9704a', glow: 0.3 });
    p.push(box(lx, 0, D / 2 + 0.77, 5.04, 0.9, 0.04, mat(KP.tileB, T.CREAM, 1.8)), ...lamp('f', W, D, lx - 1.7, 2.6).map(q => A(q, { p: [q.p[0], q.p[1], q.p[2] + 0.75] })), ...lamp('f', W, D, lx + 1.7, 2.6).map(q => A(q, { p: [q.p[0], q.p[1], q.p[2] + 0.75] })));
    [-1, 1].forEach(s => p.push(...board('f', W, D, s * (W / 2 - 5.4), 3.95, 4.4, 0.5, s < 0 ? 'GRILL  NOODLES  TACOS' : 'COFFEE  JUICE  SWEETS', T.TERRA, { glow: 0.35 }, 0.42)));
    /* the back: the kitchen door, AC units, the grease duct up the wall (the roof is a route: nothing stands on it) */
    p.push(...svcDoor('b', W, D, W / 2 - 3, KP.doorP2), ...acRow('b', W, D, -W / 2 + 3, 2.4, 3, 3.6, null), ...vent('b', W, D, 0, 1.2, 1.8, 1.0));
    const c = spot('b', W, D, W / 2 - 5.5, 0.32); p.push(box(c[0], 1.6, c[1], 0.55, 5.9, 0.55, mat(KP.metal, T.STEEL, 1.5)), cyl(c[0], 7.5, c[1], 0.45, 0.14, A(trim(T.STEEL), { seg: 8 })));
    p.push(...pipe('l', W, D, D / 2 - 0.5, 5.8, T.SAND), ...pipe('r', W, D, -D / 2 + 0.5, 5.8, T.SAND));
};
POLISH.security = (p, W, D, lx) => {
    const W1 = W + 0.5, D1 = D + 0.5, W0 = W - 0.5, D0 = D - 0.5;
    p.push(...plinth(W0, D0, 0.6, KP.strip, T.YELLOW, 1.6));
    p.push(...board('f', W1, D1, lx, 3.68, 4.4, 0.72, 'SECURITY', T.NAVY, {}, 0.08));
    const n = Math.floor((W - 3) / 3.5) + 1;
    ['f', 'b'].forEach(s => p.push(bars(s, W1, D1, -W / 2 + 2.6, 3.5, n, 4.5, 2.6, 0.1, 0.12, trim(T.DARK)), bars(s, W1, D1, -W / 2 + 2.6, 3.5, n, 5.2, 2.6, 0.08, 0.2, trim(T.DARK))));
    ['l', 'r'].forEach(s => p.push(pane(s, W1, D1, 0, 4.6, D - 3, 0.6, A(glass(T.GLASS, K.gSq, 0.5), { uv: [2.4, 0.6] }), 0.02), bar(s, W1, D1, 0, 4.5, D - 2.8, 0.1, 0.12, trim(T.DARK)), ...vent(s, W0, D0, 0, 1.6, 1.4, 0.9), ...acRow(s, W0, D0, D0 / 2 - 2, 0, 1, 1.9, null)));
    /* cameras under the oversail's front corners, floodlights on the cap, the keypad, the shutter's hazard jambs */
    [-1, 1].forEach(s => p.push(box(s * (W1 / 2 - 0.3), 3.2, D1 / 2 - 0.2, 0.08, 0.3, 0.08, trim(T.DARK)), box(s * (W1 / 2 - 0.3), 3.06, D1 / 2 - 0.05, 0.16, 0.14, 0.36, trim(T.WHITE)), box(s * (W1 / 2 - 1.2), 6.98, D1 / 2 + 0.1, 0.5, 0.3, 0.2, A(trim(T.CREAM), { glow: 0.9 }))));
    p.push(bar('f', W0, D0, lx + 1.35, 1.2, 0.2, 0.3, 0.06, trim(T.STEEL)), bar('f', W0, D0, lx + 1.35, 1.38, 0.06, 0.06, 0.02, A(trim(T.RED), { glow: 1 }), 0.06));
    [-2.2, 2.2].forEach(d => p.push(bar('f', W0, D0, W / 2 - 4.2 + d, 0, 0.16, 3.1, 0.06, mat(KP.strip, T.YELLOW, 1.7))));
    p.push(pane('f', W0, D0, W / 2 - 1.2, 1.5, 0.55, 0.55, { key: KP.hazard, uv: 'fit', kind: 'wall' }, 0.03));
    /* the back: a door, a ladder to the roof, pipes */
    p.push(...svcDoor('b', W0, D0, -W / 2 + 2.5, KP.doorP2, T.STEEL));
    const c = spot('b', W1, D1, W / 2 - 2, 0.1); p.push(cyl(c[0] - 0.25, 0.4, c[1], 0.03, 7.0, A(trim(T.STEEL), { seg: 5, cap: false })), cyl(c[0] + 0.25, 0.4, c[1], 0.03, 7.0, A(trim(T.STEEL), { seg: 5, cap: false })), A(box(c[0], 0.6, c[1], 0.5, 0.03, 0.03, trim(T.STEEL)), { n: 19, step: [0, 0.35, 0] }));
    p.push(...pipe('b', W1, D1, -W / 2 + 0.3, 6.4, T.DARK, 3.5), ...pipe('f', W1, D1, -W / 2 + 0.3, 6.4, T.DARK, 3.5));
    p.push(...aerial(W / 2 + 1.2, 9.0, -D / 2 + 1.4, 2.0));
};
POLISH.apartments = (p, W, D, lx) => {
    const H = 10.5, body = wallM(T.MINT);
    p.push(...plinth(W, D, 0.8, KP.subwayB, T.TEAL, 1.9));
    'fblr'.split('').forEach(s => { const len = flen(s, W, D); [0.9, 4.4, 7.9].forEach(y => p.push(...winTrim(s, W, D, 0, y, len - 3.5, 1.75))); });
    ['b', 'l'].forEach(s => { const len = flen(s, W, D), n = Math.max(1, Math.floor((len - 5) / 3.5)); [3.45, 6.95].forEach(y => p.push(...acRow(s, W, D, -(n - 1) * 1.75, 3.5, n, y, body))); });
    /* the balconies' posts and top rails, the door's hood and letter boxes */
    const bw = W - 5.2, kb = Math.max(2, Math.round(bw / 3.5));
    p.push(A(box(-1.75 - bw / 2 + 0.05, 3.56, D / 2 + 1.36, 0.08, 2.5, 0.08, trim()), { n: kb + 1, step: [(bw - 0.1) / kb, 0, 0] }), A(box(-1.75 - bw / 2 + 0.05, 7.06, D / 2 + 1.36, 0.08, 1.05, 0.08, trim()), { n: kb + 1, step: [(bw - 0.1) / kb, 0, 0] }));
    p.push(A(box(-1.75, 4.51, D / 2 + 1.36, bw, 0.06, 0.1, trim()), { n: 2, step: [0, 3.5, 0] }));
    p.push(...awning(lx, 2.45, D / 2 + 0.55, 2.4, 1.0, T.CORAL), ...lamp('f', W, D, lx + 1.3, 2.0), bar('f', W, D, lx - 1.6, 1.0, 1.0, 0.5, 0.14, mat(KP.metal, T.STEEL, 1.5)), ...board('f', W, D, lx - 1.6, 1.62, 1.0, 0.26, 'MAIL', T.NAVY, {}, 0.05));
    p.push(...pipe('b', W, D, W / 2 - 0.4, H, T.WHITE), ...pipe('b', W, D, -W / 2 + 0.4, H, T.WHITE), ...pipe('l', W, D, D / 2 - 0.4, H, T.WHITE), ...svcDoor('b', W, D, 0, KP.doorW));
    /* the roof: membrane, coping, the tank's ladder, a hatch, stacks, an aerial, plant */
    p.push(roofSkin(W, D, H, KP.under, T.GREY), ...coping(W, D, H + 0.6, T.CORAL), ...hatch(W / 4, H, -D / 4), ...stack(0, H, 0), ...stack(1.2, H, 0), ...stack(-W / 4, H, D / 4, 1.1), ...aerial(W / 4 + 2, H, D / 4, 3.2), ...plant(W / 4, H, D / 4 - 0.5, false));
    p.push(box(W / 2 - 1.6, H + 2.2, D / 2 + 0.3, 3.8, 0.22, 3.8, trim()), ...band(3.4, 3.4, 0, 0.8, 0.07, mat(KP.subwayB, T.TEAL, 1.9)).map(q => A(q, { p: [q.p[0] + W / 2 - 1.6, q.p[1], q.p[2] + D / 2 + 0.3] })));
};
POLISH.dock = (p, W, D, lx) => {
    const H = 7;
    p.push(...board('f', W, D, W / 2 - 6.5, 5.25, 9.5, 1.2, 'LOADING DOCK', T.NAVY, {}, 0.1));
    let bay = 0;
    for (let i = 0; i < 3; i++) { const u = -W / 2 + 4.4 + i * 5.25; if (Math.abs(u - lx) <= 3.2) continue; bay++;
        p.push(...board('f', W, D, u, 4.85, 0.9, 0.8, String(bay), T.YELLOW, { ink: '#20242c' }, 0.08), bar('f', W, D, u - 1.6, 0.35, 0.3, 0.6, 0.18, mat(KP.rubber, T.DARK, 1.2), 0.06), bar('f', W, D, u + 1.6, 0.35, 0.3, 0.6, 0.18, mat(KP.rubber, T.DARK, 1.2), 0.06),
            pane('f', W, D, u, 0.25, 3.6, 0.6, { key: KP.strip, tint: T.YELLOW, gain: 1.7, uv: [0.9, 0.6] }, 0.07), ...lamp('f', W, D, u, 4.3), bar('f', W, D, u - 1.9, 1.1, 0.14, 3.3, 0.08, trim(T.YELLOW)), bar('f', W, D, u + 1.9, 1.1, 0.14, 3.3, 0.08, trim(T.YELLOW))); }
    p.push(pane('f', W, D, -W / 2 + 1.2, 1.6, 0.6, 0.6, { key: KP.caution, uv: 'fit', kind: 'wall' }, 0.03));
    ['l', 'r'].forEach(s => p.push(...vent(s, W, D, -D / 4, 4.6, 1.8, 1.1), ...vent(s, W, D, D / 4, 4.6, 1.8, 1.1), pane(s, W, D, 0, 1.1, D - 2, 0.12, trim(T.YELLOW), 0.02), ...pipe(s, W, D, D / 2 - 0.4, H, T.NAVY), ...pipe(s, W, D, -D / 2 + 0.4, H, T.NAVY)));
    p.push(...svcDoor('r', W, D, D / 2 - 3, KP.doorP2, T.YELLOW), ...svcDoor('b', W, D, 0, KP.doorP2, T.YELLOW), ...acRow('b', W, D, -W / 2 + 3, 3.0, 2, 3.0, null));
    [-W / 4, W / 4].forEach(x => p.push(cyl(x, H, -D / 2 + 1.3, 0.36, 3.6, A(mat(KP.metal, T.STEEL, 1.5), { seg: 10, cap: false, roof: true })), cyl(x, H + 3.6, -D / 2 + 1.3, 0.5, 0.14, A(trim(T.DARK), { seg: 10, roof: true }))));
    p.push(A(box(-W / 2 + 2.2, 4.4, D / 2 + 1.4, 0.1, 0.12, 2.6, trim(T.YELLOW)), { n: 4, step: [4.95, 0, 0] }));
};
POLISH.booth = (p, W, D) => {
    p.push(...plinth(W, D, 0.6, KP.strip, T.YELLOW, 1.6));
    p.push({ s: 'quad', p: [0, 4.05, D / 2 + 0.5], size: [0.9, 1.1], text: 'P', ink: '#2c4470' });
    ['f', 'l', 'r'].forEach(s => p.push(sign(s, W, D, 0, 6.37, Math.min(flen(s, W, D) - 1, 5), 0.54, 'PARKING', {}, 0.15)));
    p.push(bar('f', W, D, 0, 0.93, W - 1.5, 0.08, 0.36, mat(KP.metal, T.STEEL, 1.5)), ...board('f', W, D, 0, 3.0, Math.min(W - 1, 3.4), 0.36, 'PAY HERE', T.WHITE, { ink: '#2c4470' }, 0.11));
    p.push(...ac('l', W, D, 0, 4.2, wallM(T.LEMON, K.plaster)), ...svcDoor('b', W, D, 0, KP.doorP, T.NAVY), ...pipe('b', W, D, W / 2 - 0.3, 6.3, T.NAVY), ...vent('r', W, D, 0, 4.2, 1.2, 0.8));
    [-1, 1].forEach(s => p.push(box(s * (W / 2 - 0.2), 6.98, D / 2 + 0.2, 0.4, 0.26, 0.2, A(trim(T.CREAM), { glow: 0.9 }))));
};
POLISH.arch = (p, half) => {
    p.push({ s: 'quad', p: [0, 6.0, 0.725], size: [2 * half - 4.8, 0.9], text: 'THE MALL', ink: '#ffffff', glow: 0.7 }, { s: 'quad', p: [0, 6.0, -0.725], ry: 180, size: [2 * half - 4.8, 0.9], text: 'THE MALL', ink: '#ffffff', glow: 0.7 });
    [-1, 1].forEach(s => {
        p.push(box(s * half, 0, 0, 2.74, 0.9, 2.74, mat(KP.marbleB, T.CREAM, 1.7)));
        [1, -1].forEach(f => p.push(box(s * half, 1.5, f * 1.23, 1.5, 5.2, 0.06, wallM(T.CREAM, K.plaster)), box(s * half, 2.4, f * 1.27, 0.8, 3.0, 0.04, trim(f > 0 ? T.AQUA : T.LEMON)), box(s * half, 5.4, f * 1.29, 1.0, 0.08, 0.1, trim(T.DARK))));
        p.push(box(s * (half - 1.35), 4.4, 0, 0.3, 0.5, 0.3, A(trim(T.CREAM), { glow: 0.95 })), box(s * (half - 1.28), 4.9, 0, 0.16, 0.1, 0.16, trim(T.DARK)));
        p.push(A(box(s * half - 1.2, 7.92, 1.3, 0.26, 0.22, 0.14, trim()), { n: 5, step: [0.6, 0, 0] }), A(box(s * half - 1.2, 7.92, -1.3, 0.26, 0.22, 0.14, trim()), { n: 5, step: [0.6, 0, 0] }));
    });
};
POLISH.bandstand = (p) => {
    p.push(cyl(0, 0, 0, 4.8, 0.05, { key: KP.bare, tint: T.GREY, gain: 1.5, seg: 8 }));
    p.push(box(0, 0.12, 0, 0.6, 0.16, 0.6, A(trim(T.CREAM), { ring: { n: 8, r: 3.7, a0: 22.5 } })), box(0, 3.42, 0, 0.6, 0.18, 0.6, A(trim(T.CREAM), { ring: { n: 8, r: 3.7, a0: 22.5 } })));
    [1.0, 0.55].forEach(y => p.push(...ringRails(0, 0, 8, 3.7, 22.5, y, [1])));
    p.push(A(box(0, 3.3, 0, 0.14, 0.14, 0.14, A(trim(T.CREAM), { glow: 1 })), { ring: { n: 16, r: 3.2 } }));
    p.push(dome(0, 8.0, 0, 0.26, 0.3, trim(T.LEMON)), cyl(0, 4.1, 0, 4.12, 0.14, A(trim(T.CREAM), { ri: 3.9, seg: 16, roof: true })));
    p.push(box(0, 0, 4.55, 2.6, 0.08, 0.5, { key: K.marble }));
};
POLISH.mall = (p, W, D, lx) => {
    const H = 10.5, arm = 8.4, cw = (W - arm) / 2, cd = (D - arm) / 2, vh = 9.0, pz = D / 2 + 0.9;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
        const x = c[0] * (arm / 2 + cw / 2), z = c[1] * (arm / 2 + cd / 2), mv = q => moved(q, x, z), body = wallM(c[0] * c[1] > 0 ? T.SAND : T.CREAM);
        const outS = (c[1] > 0 ? 'f' : 'b'), outX = (c[0] > 0 ? 'r' : 'l');
        [outS, outX].forEach(s => { const len = flen(s, cw, cd);
            p.push(...mv([pane(s, cw, cd, 0, 0, len + 2 * E, 0.6, mat(KP.marbleB, T.TERRA, 1.7), 0.035), bar(s, cw, cd, 0, 4.45, len + 0.2, 0.28, 0.12, trim()), pilasters(s, cw, cd, Math.max(2, Math.round(len / 5.25)), 0.6, H - 0.6, wallM(T.CREAM, K.plaster), 0.5, 0.09)]));
            p.push(...mv(winTrim(s, cw, cd, 0, 5.3, len - 1.75, 3.5)), ...mv([dentils(s, cw, cd, H - 0.26, trim())])); });
        p.push(...mv(pipe(outX, cw, cd, c[1] > 0 ? -cd / 2 + 0.4 : cd / 2 - 0.4, H, T.CREAM)));
        if (c[1] < 0) p.push(...mv(acRow('b', cw, cd, -cw / 2 + 2.5, 2.6, Math.max(1, Math.floor((cw - 4) / 2.6)), 4.0, body)));
        /* a lantern on each hip */
        p.push(box(x, H + 2.6, z, 1.3, 0.9, 1.3, A(wallM(T.CREAM, K.plaster), { roof: true })), roof('pyramid', x, H + 3.5, z, 1.3, 0.9, 1.3, A(mat(KP.tileB, T.TERRA, 1.8), { over: 0.3, roof: true })), ...allFaces(1.3, 1.3, H + 2.75, 0.6, { key: KP.grillB, uv: 'fit', tint: T.GREY, kind: 'wall', roof: true }, 0.01).map(q => A(q, { p: [q.p[0] + x, q.p[1], q.p[2] + z], size: [0.9, 0.6] })));
    });
    /* the plaza side: shop names over the awnings */
    p.push(...moved(board('f', cw, cd, 0, 4.78, Math.min(cw - 2, 5), 0.48, 'SHOPS', T.CORAL, { glow: 0.4 }, 0.14), -(arm / 2 + cw / 2), arm / 2 + cd / 2), ...moved(board('f', cw, cd, 0, 4.78, Math.min(cw - 2, 5), 0.48, 'CAFE', T.CORAL, { glow: 0.4 }, 0.14), arm / 2 + cw / 2, arm / 2 + cd / 2));
    p.push({ s: 'quad', p: [0, 9.56, pz + 0.82], size: [arm - 3.0, 0.88], text: 'THE MALL', ink: '#ffffff', glow: 0.8 });
    [-1, 1].forEach(s => p.push(box(s * (arm / 2 + 0.3), 0, pz, 1.56, 0.9, 1.86, mat(KP.marbleB, T.CREAM, 1.7)), box(s * (arm / 2 + 0.3), 2.0, pz + 0.92, 0.9, 5.6, 0.05, wallM(T.CREAM, K.plaster)), box(s * (arm / 2 + 0.3), 6.0, pz + 1.06, 0.3, 0.5, 0.3, A(trim(T.CREAM), { glow: 0.95 }))));
    /* the vault's glass ends: mullions and a transom */
    [['b', arm, D], ['l', W, arm], ['r', W, arm]].forEach(c => p.push(bars(c[0], c[1], c[2], -arm / 2 + 0.06, (arm - 0.12) / 4, 5, 0, 0.14, vh, 0.1, trim()), bar(c[0], c[1], c[2], 0, 3.3, arm, 0.14, 0.1, trim()), bar(c[0], c[1], c[2], 0, vh - 0.2, arm + 0.2, 0.3, 0.14, trim())));
    p.push(bar('f', arm, D, -arm / 2 + 0.07, 0, 0.14, vh, 0.1, trim()), bar('f', arm, D, arm / 2 - 0.07, 0, 0.14, vh, 0.1, trim()), bar('f', arm, D, 0, 3.3, arm, 0.14, 0.1, trim()));
    p.push(A(box(0, vh + 3.3, 0, 0.3, 0.5, 0.2, A(trim(), { roof: true })), { ring: { n: 12, r: 5.75 } }));                                                     // brackets round the drum
};
POLISH.juice = (p, W, D) => {
    const r = Math.min(D / 2 - 0.05, 5.2), top = 3.4 + r * 0.92, WD = D - 1.2;
    p.push(...moved(plinth(W, WD, 0.5, KP.tileC, T.ORANGE, 1.9), 0, -0.6), cyl(0, 0, 0, r + 0.05, 0.5, A(mat(KP.tileC, T.ORANGE, 1.9), { seg: 24, cap: false })));
    p.push(box(0, 2.76, r + 1.06, 3.8, 0.66, 0.08, trim()), { s: 'quad', p: [0, 2.8, r + 1.11], size: [3.5, 0.58], text: 'JUICE', ink: '#ff8a1c' });
    p.push(cyl(-1.3, top - 1.0, 0.8, 0.26, 3.4, A(trim(), { seg: 10 })), A(cyl(-1.3, top - 0.3, 0.8, 0.275, 0.28, A(trim(T.RED), { seg: 10, cap: false })), { n: 4, step: [0, 0.62, 0] }));        // the straw
    p.push(box(-0.9, top + 0.75, 0, 1.6, 0.1, 0.8, A(trim(T.LEAF), { ry: -25, under: true })));
    p.push(roofSkin(W, WD, 3.3, KP.under, T.GREY, 0, -0.6), ...plant(-W / 2 + 2, 3.3, -D / 2 + 1.6, false), ...plant(W / 2 - 2, 3.3, -D / 2 + 1.6, false), ...stack(-W / 2 + 4, 3.3, -D / 2 + 1.4), ...stack(W / 2 - 4, 3.3, -D / 2 + 1.4));
    p.push(...moved([...svcDoor('b', W, WD, W / 2 - 2, KP.doorP, T.ORANGE), ...ac('b', W, WD, -W / 2 + 2, 1.9, wallM(T.CREAM)), ...pipe('b', W, WD, 0, 3.3, T.ORANGE), ...lamp('f', W, WD, -W / 2 + 0.5, 2.3), ...lamp('f', W, WD, W / 2 - 0.5, 2.3)], 0, -0.6));
    p.push(bar('f', 4.4, 1.4, 0, 0.9, 4.6, 0.07, 0.3, { key: K.marble }, r - 0.5));
};
POLISH.carport = (p, len) => {
    const k = Math.round(len / 3.5);
    p.push(A(box(-len / 2 + 0.4, 2.42, 2.3, 0.12, 0.2, 4.6, trim(T.NAVY)), { n: k + 1, step: [(len - 0.8) / k, 0, 0] }), box(0, 3.8, 5.2, len, 0.16, 0.08, trim()), box(0, 2.56, -1.4, len, 0.14, 0.14, trim()));
    p.push(A(box(-len / 2 + 0.4 + (len - 0.8) / k / 2, 2.36, 2.0, 1.2, 0.06, 0.16, A(trim(T.CREAM), { glow: 0.9 })), { n: k, step: [(len - 0.8) / k, 0, 0] }));
    p.push(A(box(-len / 2 + 0.4, 0, 0, 0.4, 0.5, 0.4, mat(KP.strip, T.YELLOW, 1.6)), { n: k + 1, step: [(len - 0.8) / k, 0, 0] }), cyl(len / 2 - 0.4, 0, -1.4, 0.05, 2.56, A(trim(T.STEEL), { seg: 6, cap: false })));
};
POLISH.harbour = (p, W, D) => {
    const H = 7, tx = W / 2 - 1.75, tz = D / 2 - 1.2;
    p.push(...band(W, D, 0, 0.9, 0.075, mat(KP.subwayB, T.NAVY, 2.0)), ...band(W, D, 3.5, 0.16, 0.08, trim(T.NAVY)));
    p.push(...winTrim('f', W, D, -1.75, 1.0, W - 5.25, 1.75, T.NAVY), ...winTrim('f', W, D, -1.75, 4.4, W - 5.25, 1.75, T.NAVY), ...winTrim('b', W, D, 0, 4.4, W - 3.5, 1.75, T.NAVY));
    p.push(sign('f', W, D, -1.75, 3.0, Math.min(W - 5.5, 3.4), 0.42, 'HARBOUR MASTER', { ink: '#2c4470' }, 0.02));
    p.push(...band(3.3, 3.3, 7.4, 0.3, 0.06, trim(T.NAVY)).map(q => A(q, { p: [q.p[0] + tx, q.p[1], q.p[2] + tz] })), ...band(3.3, 3.3, 10.4, 0.3, 0.06, trim(T.RED)).map(q => A(q, { p: [q.p[0] + tx, q.p[1], q.p[2] + tz] })));
    [4.4, 8.2, 11.0].forEach(y => p.push({ s: 'quad', p: [tx, y, tz + 1.65 + E + 0.02], size: [0.7, 1.2], key: K.gSq, tint: T.GLASS, glow: 0.4, gain: 2.2, uv: 'fit' }));
    p.push(...band(4.1, 4.1, 13.65, 0.06, 0.05, trim()).map(q => A(q, { p: [q.p[0] + tx, q.p[1], q.p[2] + tz] })), cyl(0, 12.75, 0, 0.04, 0.95, A(trim(), { seg: 5, cap: false, p: [tx, 12.75, tz], ring: { n: 4, r: 2.9, a0: 45 } })));
    p.push(box(tx, 2.45, D / 2 + 0.75, 1.8, 0.12, 0.7, A(trim(T.NAVY), { under: true })), ...lamp('f', W, D, tx + 1.0, 1.9).map(q => A(q, { p: [q.p[0], q.p[1], q.p[2] + 0.45] })));
    p.push(box(tx, 17.6, tz, 1.6, 0.04, 0.04, trim()), box(tx - 0.6, 17.0, tz, 0.5, 0.5, 0.03, A(trim(T.LEMON), { ds: true })), box(tx + 0.6, 17.0, tz, 0.5, 0.5, 0.03, A(trim(T.HOT), { ds: true })));
    p.push(box(-W / 4, H + 0.6, -D / 5, 0.8, 1.9, 0.8, A(wallM(T.WHITE, K.plaster), { roof: true })), box(-W / 4, H + 2.5, -D / 5, 1.0, 0.14, 1.0, A(trim(T.NAVY), { roof: true })));
    p.push(...pipe('l', W, D, D / 2 - 0.3, H, T.NAVY), ...pipe('b', W, D, W / 2 - 0.3, H, T.NAVY), ...ac('b', W, D, -W / 2 + 1.5, 1.6, wallM(T.WHITE, K.plaster)), ...svcDoor('l', W, D, -1, KP.doorW));
};
POLISH.bait = (p) => { p.push(...board('f', 4.2, 4.2, 0.4, 3.0, 2.2, 0.55, 'BAIT', T.WHITE, { ink: '#2c4470' }, 0.5), ...plinth(4.2, 4.2, 0.4, K.planks, 0x8a6a48, 1.4), ...pipe('l', 4.2, 4.2, 1.8, 2.6, T.WHITE), ...stack(1.2, 3.3, -0.8, 0.6)); };
POLISH.lifeguard = (p) => { const y0 = 1.3; p.push({ s: 'quad', p: [0, y0 + 0.3, 1.03], size: [2.8, 0.42], text: 'LIFEGUARD', ink: '#ffffff', bg: '#e8483c' }, box(1.2, y0 + 2.0, 1.1, 0.5, 0.5, 0.08, trim(T.RED)), box(1.2, y0 + 2.12, 1.15, 0.26, 0.26, 0.04, trim()), ...aerial(-1.6, y0 + 2.46, -1.6, 1.6)); };
POLISH.pavilion = (p) => {
    p.push(box(0, 0.17, 0, 0.62, 0.16, 0.62, A(trim(T.CREAM), { ring: { n: 8, r: 6.0, a0: 22.5 } })), box(0, 3.82, 0, 0.62, 0.18, 0.62, A(trim(T.CREAM), { ring: { n: 8, r: 6.0, a0: 22.5 } })));
    [1.0, 0.55].forEach(y => p.push(...ringRails(0, 0, 8, 6.0, 22.5, y, [3, 7])));
    p.push(A(box(0, 3.7, 0, 0.14, 0.14, 0.14, A(trim(T.CREAM), { glow: 1 })), { ring: { n: 24, r: 5.4 } }), cyl(0, 1.0, 0, 1.45, 0.08, { key: K.marble, seg: 8 }));
};
Object.keys(POLISH).forEach(name => { const base = B[name]; B[name] = (...a) => { const p = base(...a); try { POLISH[name](p, ...a); } catch (e) { console.warn('[bayside] polish failed', name, e); } return lettered(p); }; });

/* ── the plan: the cinema and the mall face WEST ── */
const WEST = { 'P10-08-B1': { x: 2, y: 5, ox: 1, oy: 5, side: 'W' }, 'P10-10-B1': { x: 2, y: 5, ox: 1, oy: 5, side: 'W' } };
/* the ways out onto the boardwalk: pavement through the yard and the edge band of the four east plots (plot cells x, rows y0..y1) */
const WAYS = { 'P11-08': [9, 11, 5, 6], 'P11-09': [9, 11, 9, 10], 'P11-10': [9, 11, 9, 10], 'P11-11': [9, 11, 3, 6] };
function tailor(PLAN) {
    PLAN.plots.forEach(p => p.buildings.forEach(b => { const w = WEST[b.id]; if (w && !(b.doors[0] && b.doors[0].side === 'W')) b.doors.unshift(Object.assign({}, w)); }));
    PLAN.plots.forEach(p => { const w = WAYS[p.id]; if (!w) return; p.cells = p.cells.map((r, y) => (y < w[2] || y > w[3]) ? r : r.split('').map((ch, x) => (x >= w[0] && x <= w[1]) ? 'P' : ch).join('')); });
}

/* ── the build ── */
const SIDE_ROT = { S: 0, W: 90, N: 180, E: 270 };
const DESIGN = {
    'P08-08-B1': { fn: 'hotel', storeys: 2, floorIn: 'urban:TileMarble1a' }, 'P08-08-B2': { fn: 'surf', storeys: 1, door: 5 },
    'P09-08-B2': { fn: 'icecream' }, 'P09-08-B3': { fn: 'boatshop', storeys: 1, door: 6, keyIn: 'urban:MetalCorrugatedPainted1a' },
    'P10-08-B1': { fn: 'cinema', storeys: 4 },
    'P08-09-B1': { fn: 'market', storeys: 1 }, 'P08-09-B2': { fn: 'florist', storeys: 1, solid: true },
    'P09-09-B1': { fn: 'foodhall' }, 'P10-09-B1': { fn: 'security' }, 'P10-09-B2': { fn: 'apartments', storeys: 3, solid: true },
    'P11-09-B1': { fn: 'dock', storeys: 2, keyIn: 'urban:MetalCorrugatedPainted1a' }, 'P11-09-B2': { fn: 'booth' },
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
        else { row.skin = false; delete row.key; if (d.storeys) row.storeys = d.storeys; if (d.solid) { delete row.hollow; delete row.door; delete row.style; } if (d.door) { row.hollow = true; row.door = d.door; } if (d.keyIn) row.keyIn = d.keyIn; if (d.floorIn) row.floorIn = d.floorIn; W = row.w; D = row.d; rot = row.rot || 0; lx = doorLx(W, row.door); }
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
      const hm = { k: 'texbuilding', id: 'dc:bay-harbourmaster', x: r3(x), z: r3(z), w: W, d: D, rot: 180, storeys: 1, seed: 7711, skin: false, hollow: true, door: 2 }; lateRows.push(hm); byId[hm.id] = hm; push('bay-harbourmaster', x, z, 180, B.harbour(W, D, doorLx(W, 2))); }
    beach(ctx, push, ghost);
    interiors(ctx, byId, push);
    console.warn('[bayside]', JSON.stringify(out));
}
/* ── THE INTERIORS (2026-11-13, mondo 21:04 "let's go ahead and do the interiors"; his OK on plan 2, 21:24) ──
   Six walk-ins, each one room behind the city's swinging door, laid out ON THE 3.5 m BATTLE SQUARES (his rule, 21:14 + 21:17: "if its gonna
   be a barrier it needs to snap to the grid/be centered on a cell, if its just a prop or dressing ... it needs to be not centered"; "a
   intended walkway still needs to be one cell wide, not have stuff halfway on 2 cells"):
     - a BLOCKER (a desk, a counter, a seat block, racking, the boat) is built over whole squares, centred, and each of its squares is shut
       with a ghost wall, so nothing stands half on it;
     - DECOR (plants, lamps, stools, boards on a wall, barrels in a corner) hugs the walls and the corners, off the squares' middles;
     - every walk is whole empty squares, door to back wall.
   A room's frame is its building's: x along the front, +z out of the front door; square (c, r): c from the −x wall, r from the BACK wall.
   `hd` on a prop is the way its front looks in that frame (0 = to the back wall, 90 = +x, 180 = to the door, 270 = −x). */
/* ── THE INTERIORS, SECOND PASS (2026-11-13, mondo 22:33: "do another interior pass ... make a list of models needed/wanted but not in the
   bucket or game, and make meshy versions of them. The surfboards, for example ... Focus on aesthetic, vibe, atmosphere for the interiors") ──
   New pieces (data.js catalogue, THE BAYSIDE INTERIOR PIECES): 15 Meshy models (surfboards, the board rack, the wetsuit rail, the sunglasses
   spinner, the bellhop cart, cinema seat rows, the forklift, wrapped pallets, the outboard, lobster traps, the net, the ship's wheel and bell)
   + the elegantcrow Beach Props Pack (life ring, swim ring, air mattresses, cool box, beach ball). Pieces other districts made (the claims list,
   project files meshy/interior-claims.md) are placed only once their catalogue row is on main (`CAT.has`): rerunning the bake picks them up.
   Same grid rule as the first pass: a blocker centred on whole shut squares, decor against the walls off the squares' middles.
   A wall piece = a floor prop at a height (`y`) a few cm off the wall's paint (the liner stands 0.34 in). */
const CAT = (() => { let c = null; const load = () => { if (c) return c; try { c = require('../../../load-data.js').loadGameData().DOOR_HQ.catalogue; } catch (e) { console.warn('[bayside] catalogue not read', e.message); c = {}; } return c; };
    return { has: k => !!load()[k], row: k => load()[k] || null }; })();
const quad = (x, y, z, w, h, ry, o) => A({ s: 'quad', p: [x, y, z], ry, size: [w, h] }, o);
const glowT = (tint, g) => ({ tint, glow: g == null ? 1 : g });
/* a wall sconce: a brass back plate and a lit shade, on the wall `side` ('b' back, 'f' front, 'l' left, 'r' right) of a W x D room */
const sconce = (W, D, side, u, y, tint) => { const e = 0.36, sh = glowT(tint || 0xffe2a8, 1), br = mat('gold', T.WHITE, 1.5);
    if (side === 'b') return [box(u, y, -D / 2 + e, 0.18, 0.34, 0.04, br), box(u, y + 0.08, -D / 2 + e + 0.14, 0.3, 0.3, 0.22, sh)];
    if (side === 'f') return [box(u, y, D / 2 - e, 0.18, 0.34, 0.04, br), box(u, y + 0.08, D / 2 - e - 0.14, 0.3, 0.3, 0.22, sh)];
    if (side === 'l') return [box(-W / 2 + e, y, u, 0.04, 0.34, 0.18, br), box(-W / 2 + e + 0.14, y + 0.08, u, 0.22, 0.3, 0.3, sh)];
    return [box(W / 2 - e, y, u, 0.04, 0.34, 0.18, br), box(W / 2 - e - 0.14, y + 0.08, u, 0.22, 0.3, 0.3, sh)]; };
/* a hung chandelier (the hotel, when the Entertainment district's crystal one is not on main): a chain, a brass drum, a ring of lit candles */
const chandelier = (x, z, top) => { const br = mat('gold', T.WHITE, 1.6), p = [cyl(x, top - 1.2, z, 0.03, 1.2, A(trim(T.DARK), { seg: 5 })), cyl(x, top - 1.9, z, 0.22, 0.7, A(br, { seg: 10 })),
        cyl(x, top - 1.75, z, 1.05, 0.1, A(br, { seg: 16, cap: false })), cyl(x, top - 2.25, z, 0.65, 0.08, A(br, { seg: 14, cap: false })), dome(x, top - 2.1, z, 0.3, 0.3, glowT(0xfff0c8, 0.9))];
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; p.push(cyl(x + Math.cos(a) * 1.0, top - 1.65, z + Math.sin(a) * 1.0, 0.045, 0.22, A(glowT(0xfff4d8, 1), { seg: 6 }))); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; p.push(cyl(x + Math.cos(a) * 0.62, top - 2.17, z + Math.sin(a) * 0.62, 0.04, 0.18, A(glowT(0xfff4d8, 1), { seg: 6 }))); }
    return p; };
const SECOND = {
    /* 1 the hotel lobby: marble pilasters + a crown moulding + a gilt line, sconces, two chandeliers over the walk, a backlit bar, desk lamps,
       a rug under the sofas, the bellhop cart against the front wall */
    'P08-08-B1': (R) => { const { P, cx, cz, W, D, H } = R, back = -D / 2 + 0.3, stone = mat('marble_light', T.CREAM, 1.7), gilt = mat('gold', T.WHITE, 1.5);
        const pil = (x, zf) => P.push(box(x, 0, zf, 0.55, H - 0.4, 0.22, stone), box(x, H - 0.55, zf, 0.75, 0.25, 0.3, trim(T.CREAM)), box(x, 0, zf, 0.7, 0.3, 0.3, stone));
        [0.5, 1.5, 2.5, 5.5, 6.5].forEach(k => { pil(cx(k), -D / 2 + 0.45); P.push(...sconce(W, D, 'b', cx(k), 2.7)); });
        [0.5, 1.5, 4.5, 5.5, 6.5, 7.5].forEach(k => { pil(cx(k), D / 2 - 0.45); P.push(...sconce(W, D, 'f', cx(k), 2.7)); });
        P.push(box(0, H - 0.42, -D / 2 + 0.42, W - 0.8, 0.3, 0.16, trim(T.CREAM)), box(0, H - 0.42, D / 2 - 0.42, W - 0.8, 0.3, 0.16, trim(T.CREAM)), box(-W / 2 + 0.42, H - 0.42, 0, 0.16, 0.3, D - 0.8, trim(T.CREAM)), box(W / 2 - 0.42, H - 0.42, 0, 0.16, 0.3, D - 0.8, trim(T.CREAM)));   // the crown moulding
        P.push(box(0, 1.0, -D / 2 + 0.39, W - 0.8, 0.05, 0.04, gilt), box(-W / 2 + 0.39, 1.0, 0, 0.04, 0.05, D - 0.8, gilt), box(W / 2 - 0.39, 1.0, 0, 0.04, 0.05, D - 0.8, gilt));   // the gilt line on the dado
        const ch = CAT.row('crystal_chandelier');                                                                                                // two chandeliers over the walk row
        [cx(2), cx(6)].forEach(x => { if (ch) R.prop('crystal_chandelier', x, cz(1), 0, ch.ceil ? { y: H } : { y: H - (ch.h || 1.6) }); else P.push(...chandelier(x, cz(1), H)); });
        P.push(quad(cx(7.5), 1.2, back + 0.09, 6.2, 1.4, 0, glowT(0xffb060, 0.55)), box(cx(7.5), 2.65, back + 0.14, 6.4, 0.12, 0.3, WOODT(0x70442c)));   // the bar's back light, a top shelf
        [-2.6, 2.4].forEach(dx => P.push(cyl(cx(3.5) + dx, 1.13, cz(0) - 0.3, 0.07, 0.36, A(gilt, { seg: 6 })), cyl(cx(3.5) + dx, 1.45, cz(0) - 0.3, 0.2, 0.2, A(glowT(0x5ec080, 0.7), { seg: 8, r2: 0.12 }))));   // green desk lamps
        P.push(quad(cx(0.5), 0.065, cz(0) + 0.2, 5.6, 3.0, 0, A(mat(KP.rubber, 0xc8a040, 1.7), { flat: true })), quad(cx(0.5), 0.07, cz(0) + 0.2, 5.0, 2.4, 0, A(mat(KP.rubber, 0x283a68, 1.7), { flat: true })));   // a rug under the sofas
        R.prop('luggage_cart', cx(5) + 0.6, D / 2 - 0.8, 0);                                                                                    // the bellhop cart by the front wall
    },
    /* 2 the cinema: the seat rows (in the first pass's place), wall sconces down both sides of the hall, a gold runner up the centre aisle,
       exit signs, NOW SHOWING over the hall's door, a menu board over the snack counter, the old projector on show in the foyer's front-left square */
    'P10-08-B1': (R) => { const { P, cx, cz, W, D } = R, zp = -D / 2 + 21;
        [0, 1, 2, 3, 4, 5].forEach(r => { P.push(...sconce(W, D, 'l', cz(r), 4.2, 0xffc890), ...sconce(W, D, 'r', cz(r), 4.2, 0xffc890));
            P.push(quad(-W / 2 + 0.37, 3.2, cz(r), 1.4, 2.6, 90, glowT(0xffb070, 0.18)), quad(W / 2 - 0.37, 3.2, cz(r), 1.4, 2.6, 270, glowT(0xffb070, 0.18))); });   // the soft wash over each
        P.push(quad(0, 0.07, (cz(0) - 1.75 + zp) / 2, 1.3, zp - cz(0) + 1.75, 0, A(mat(KP.rubber, 0xc89a3c, 1.7), { flat: true })));            // the gold runner
        const ex = CAT.row('exit_sign') ? (x, z, y, hd) => R.prop('exit_sign', x, z, hd, { y, mount: 0 }) : () => {};
        ex(cx(3), zp - 0.3, 2.85, 0); ex(-0.87, D / 2 - 0.45, 2.55, 0);
        P.push(quad(0, 2.95, zp + 0.17, 3.0, 0.62, 0, { text: 'NOW SHOWING', ink: '#ffe08a', bg: '#200c14', glow: 0.9 }));                         // over the hall's door, foyer side
        P.push(A(box(-1.6, 3.62, zp + 0.2, 0.09, 0.09, 0.06, glowT(0xfff0c0, 1)), { n: 17, step: [0.2, 0, 0] }), A(box(-1.6, 2.84, zp + 0.2, 0.09, 0.09, 0.06, glowT(0xfff0c0, 1)), { n: 17, step: [0.2, 0, 0] }));   // its marquee bulbs
        P.push(quad(-W / 2 + 0.37, 2.2, cz(6), 2.8, 1.0, 90, { text: 'POPCORN  SODA  CANDY', ink: '#fff2c0', bg: '#30121c', glow: 0.8 }));
        if (CAT.has('film_projector')) { R.prop('film_projector', cx(0), cz(7), 90); R.shut(0, 7, 0, 7, 1.8); }                                // the old projector on show (a blocker: centred on its square, shut)
    },
    /* 3 the loading dock: the forklift and two wrapped pallets on shut squares, a roller shutter + LOADING BAY over them, hazard paint along
       the racking, high-bay lamps, a fire extinguisher by the door, the pallet jack when it is on main */
    'P11-09-B1': (R, WOOD) => { const { P, cx, cz, D, H } = R, back = -D / 2 + 0.3;
        R.prop('forklift', cx(7), cz(2), 270); R.shut(7, 2, 7, 2, 2.0);
        R.prop('wrapped_pallet', cx(5), cz(0), 0); R.prop('wrapped_pallet', cx(6), cz(0), 90); R.shut(5, 0, 6, 0, 1.0);
        if (CAT.has('pallet_jack')) R.prop('pallet_jack', cx(5) + 1.15, cz(0) + 1.1, 90);
        P.push(quad(cx(5.5), 0, back + 0.08, 6.0, 4.3, 0, mat(K.corr, T.GREY, 1.5)), box(cx(5.5), 4.3, back + 0.15, 6.4, 0.45, 0.3, mat(KP.metal, T.DARK, 1.5)), box(cx(5.5) - 3.1, 0, back + 0.12, 0.2, 4.3, 0.2, trim(T.YELLOW)), box(cx(5.5) + 3.1, 0, back + 0.12, 0.2, 4.3, 0.2, trim(T.YELLOW)));   // the roller shutter
        P.push(quad(cx(5.5), 4.9, back + 0.09, 3.6, 0.7, 0, { text: 'LOADING BAY', ink: '#1c1c1c', bg: '#e8c020' }));
        P.push(quad(cx(1.5), 0.066, cz(0) + 1.62, 14.0, 0.22, 0, A(trim(T.YELLOW), { flat: true })), A(quad(cx(0) - 1.4, 0.07, cz(0) + 1.62, 0.3, 0.22, 0, A(trim(0x1c1c1c), { flat: true })), { n: 20, step: [0.7, 0, 0] }));   // the hazard paint
        [2.5, 5.5].forEach(k => P.push(cyl(cx(k), H - 1.2, cz(1), 0.025, 1.2, A(trim(T.DARK), { seg: 4 })), cyl(cx(k), H - 1.55, cz(1), 0.45, 0.35, A(trim(0x50545c), { seg: 10, r2: 0.18 })), cyl(cx(k), H - 1.6, cz(1), 0.4, 0.05, A(glowT(0xf4f6ff, 1), { seg: 10 }))));   // the high-bay lamps
        if (CAT.has('fire_extinguisher')) R.prop('fire_extinguisher', cx(4) + 1.3, D / 2 - 0.45, 0, { y: 0.95, mount: 0 });
    },
    /* 4 the surf shop: the board rack on its square, boards up both walls, the wetsuit rail, the sunglasses spinner, life ring, swim rings,
       air beds, a cool box and a bin of beach balls, coloured bulbs strung under the ceiling, the shop's sign */
    'P08-08-B2': (R) => { const { P, cx, cz, W, D, H } = R, back = -D / 2 + 0.3;
        R.prop('surfboard_rack', cx(0), cz(0), 180); R.shut(0, 0, 0, 0, 2.3);
        ['surfboard_long', 'surfboard_short', 'surfboard_fish', 'surfboard_short'].forEach((k, i) => R.prop(k, -W / 2 + 0.48, cz(0) + 0.6 + i * 2.3, 90));   // boards up the left wall
        ['surfboard_long', 'surfboard_fish'].forEach((k, i) => R.prop(k, W / 2 - 0.48, cz(1) + 0.4 + i * 2.6, 270));                                 // and the right
        R.prop('wetsuit_rail', cx(1), back + 0.45, 180);
        R.prop('sunglasses_spinner', cx(1) - 1.2, D / 2 - 0.75, 0);
        R.prop('beach_life_ring', 0.6, D / 2 - 0.42, 0, { y: 1.75 }); R.prop('beach_life_ring', W / 2 - 0.42, cz(3) - 1.3, 270, { y: 1.6 });
        [0, 0.29, 0.58].forEach(y => R.prop('beach_swim_ring', W / 2 - 0.92, cz(3) + 1.0, 0, { y }));
        R.prop('beach_air_mattress_blue', W / 2 - 0.85, cz(2) + 1.1, 0); R.prop('beach_air_mattress_pink', W / 2 - 0.85, cz(2) + 1.1, 0, { y: 0.18 });
        R.prop('beach_cooler', cx(1) + 1.2, back + 0.4, 0);
        P.push(cyl(cx(1) - 1.2, 0, back + 0.55, 0.42, 0.55, A(trim(T.STEEL), { seg: 10, cap: false })));                                       // the bin of beach balls
        [[-0.12, -0.1], [0.14, 0.08], [-0.05, 0.16]].forEach((o, i) => R.prop('beach_ball', cx(1) - 1.2 + o[0], back + 0.55 + o[1], i * 40, { y: 0.25 + i * 0.12 }));
        const bulbs = [0xff6060, 0xffd040, 0x60e0ff, 0x80ff90, 0xff90e0];
        [cz(1), cz(3)].forEach(z => { P.push(box(0, H - 0.34, z, W - 0.9, 0.02, 0.02, trim(T.DARK))); for (let i = 0; i < 9; i++) P.push(dome(-W / 2 + 0.75 + i * (W - 1.5) / 8, H - 0.48, z, 0.08, 0.14, glowT(bulbs[i % 5], 1))); });
        P.push(quad(cx(1), 2.15, back + 0.09, 3.0, 0.62, 0, { text: 'SURF SHOP', ink: '#ffffff', bg: '#1f6f8b', glow: 0.6 }));
    },
    /* 5 boat repair: the outboard (in the first pass's engine place, SECOND only adds), lobster pots, the net on the left wall, life rings,
       paint tins on the bench, a work lamp over the hull */
    'P09-08-B3': (R) => { const { P, cx, cz, W, D } = R, back = -D / 2 + 0.3;
        R.prop('lobster_traps', cx(1) + 0.95, D / 2 - 0.75, 0);
        R.prop('fishing_net_wall', -W / 2 + 0.4, cz(1), 90, { y: 0.55 });
        R.prop('beach_life_ring', W / 2 - 0.42, cz(1), 270, { y: 1.7 }); R.prop('beach_life_ring', cx(2.5), back + 0.12, 180, { y: 2.15 });
        [[T.RED, -0.2], [T.WHITE, 0.15], [T.NAVY, 0.5], [T.YELLOW, 0.85]].forEach(k => P.push(cyl(cx(0.5) - 2.6 + k[1], 0.9, cz(0) - 0.35, 0.12, 0.2, A(trim(k[0]), { seg: 8 }))));   // paint tins
        P.push(cyl(cx(2.5), 2.6, cz(1), 0.02, 0.58, A(trim(T.DARK), { seg: 4 })), cyl(cx(2.5), 2.45, cz(1), 0.28, 0.2, A(trim(0x2c5a40), { seg: 10, r2: 0.12 })), cyl(cx(2.5), 2.43, cz(1), 0.24, 0.04, A(glowT(0xfff0c8, 1), { seg: 10 })));   // the work lamp
        P.push(quad(cx(2.5), 0.065, cz(1), 4.4, 2.0, 0, A(trim(0x3a3630), { flat: true, glow: 0 })));                                          // the stain under the hull
    },
    /* 6 the harbour master: the ship's wheel over the cabinets, the bell by the door, a life ring, a chart on the wall, the chart lamp */
    'bay-harbourmaster': (R) => { const { P, cx, cz, W, D } = R, back = -D / 2 + 0.3;
        R.prop('ship_wheel', cx(0) - 0.45, back + 0.2, 180, { y: 1.7 });
        R.prop('ships_bell', -W / 2 + 0.38, cz(1) - 0.2, 90, { y: 1.55 });
        R.prop('beach_life_ring', cx(0) + 1.2, back + 0.12, 180, { y: 1.55 });
        P.push(quad(W / 2 - 0.36, 1.35, cz(0), 1.7, 1.15, 270, trim(0x4a3a2a)), quad(W / 2 - 0.37, 1.42, cz(0), 1.5, 1.0, 270, trim(0xf0e6c8)), quad(W / 2 - 0.38, 1.6, cz(0) + 0.2, 0.7, 0.5, 270, trim(T.AQUA)));   // a chart in a frame
        P.push(cyl(cx(1) - 0.9, 1.02, cz(0) + 0.45, 0.06, 0.35, A(mat('gold', T.WHITE, 1.5), { seg: 6 })), cyl(cx(1) - 0.9, 1.33, cz(0) + 0.45, 0.18, 0.16, A(glowT(0x60c088, 0.75), { seg: 8, r2: 0.1 })));   // the chart lamp
    },
};
const WOODT = (tint) => mat(K.planks, tint, 1.9);
function interiors(ctx, byId, push) {
    const { lateRows, props, r3 } = ctx, n = { rooms: 0, parts: 0, blocked: 0, props: 0 };
    const WOOD = (tint, g) => mat(K.planks, tint == null ? 0xc89868 : tint, g || 1.9), LAMP = { tint: 0xfff2cc, glow: 1, under: true };
    const room = (id, fn) => {
        const row = byId['dc:' + id]; if (!row || !row.hollow) { console.warn('[bayside] no walk-in row for', id); return; }
        const W = row.w, D = row.d, rot = row.rot || 0, q = rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q), P = [];
        const at = (lx, lz) => [r3(row.x + lx * c - lz * s), r3(row.z + lx * s + lz * c)];
        const R = {
            W, D, P, cols: Math.round(W / 3.5), rows: Math.round(D / 3.5), H: row.storeys * 3.5 - 0.32,
            cx: col => -W / 2 + (col + 0.5) * 3.5, cz: rw => -D / 2 + (rw + 0.5) * 3.5,
            /* shut whole squares (c0..c1, r0..r1), h high */
            shut(c0, r0, c1, r1, h) { for (let a = c0; a <= (c1 == null ? c0 : c1); a++) for (let b = r0; b <= (r1 == null ? r0 : r1); b++) { const w = at(R.cx(a), R.cz(b)); lateRows.push({ k: 'wall', x0: w[0], z0: w[1], x1: w[0], z1: w[1], h: h || 1.2, t: 3.3, key: K.stucco, ghost: true, rail: false }); n.blocked++; } },
            /* a ghost wall along a line of the frame (a partition) */
            line(x0, z0, x1, z1, h) { const a = at(x0, z0), b = at(x1, z1); lateRows.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h, t: 0.3, key: K.stucco, ghost: true, rail: false }); },
            prop(key, lx, lz, hd, o) { const w = at(lx, lz); props.push(A({ key, x: w[0], z: w[1], face: (((hd || 0) + rot) % 360 + 360) % 360, floor: true }, o)); n.props++; },   // `floor`: on the room's floor, never on the roof slab over it (three-renderer.js THE FLOOR UNDER IT)
            lamps(list, y) { list.forEach(l => P.push(box(l[0], (y || R.H) - 0.14, l[1], 1.0, 0.12, 1.0, LAMP))); },
            rug(x, z, w, d, o) { P.push(A({ s: 'quad', flat: true, p: [x, 0.06, z], size: [w, d] }, o)); },
            /* the room's own paint over the inside walls (the row's inside is the bare sheet): a wall coat `h` high, a dado under it, a ceiling */
            liner(wall, dado, ceil, h) { const lx = doorLx(W, row.door), coat = (m, hh, e, hole) => { if (!m) return;
                P.push({ s: 'quad', p: [0, 0, -D / 2 + e], ry: 0, size: [W - 2 * e, hh], ...m }, A({ s: 'quad', p: [0, 0, D / 2 - e], ry: 180, size: [W - 2 * e, hh], hole: [-lx, 1.74, Math.min(2.2, hole)] }, m), { s: 'quad', p: [-W / 2 + e, 0, 0], ry: 270, size: [D - 2 * e, hh], ...m }, { s: 'quad', p: [W / 2 - e, 0, 0], ry: 90, size: [D - 2 * e, hh], ...m }); };
                coat(wall, h || R.H, 0.34, 2.2); coat(dado, 1.0, 0.36, 1.0);
                if (ceil) P.push(box(0, R.H - 0.07, 0, W - 0.7, 0.04, D - 0.7, A({ under: true, roof: true, top: false, glow: 0.5 }, ceil))); },
        };
        fn(R); if (SECOND[id]) SECOND[id](R, WOOD, LAMP); const LP = lettered(P); push(id + ':in', row.x, row.z, rot, LP); n.rooms++; n.parts += LP.length;
    };
    /* 1 the hotel lobby (9 x 3; the door on square 3): the walk is the whole middle row */
    room('P08-08-B1', R => { const { P, cx, cz, D } = R, back = -D / 2 + 0.3;
        R.liner(wallM(T.CREAM, K.plaster), mat(K.marble, T.CORAL, 1.9), mat(KP.ceil, T.WHITE, 1.8));
        R.rug(cx(3), cz(1.5), 2.3, 6.6, mat(KP.rubber, 0xc03048, 1.7));                                                                          // the red carpet, door to desk
        P.push(box(cx(3.5), 0, cz(0), 6.4, 1.05, 1.5, WOOD(0xa87048)), box(cx(3.5), 1.05, cz(0), 6.7, 0.08, 1.8, mat(K.marble, T.WHITE, 1.8)));   // the reception desk
        P.push(dome(cx(3.5) + 2.2, 1.13, cz(0) + 0.3, 0.12, 0.1, trim(T.YELLOW)), box(cx(3.5), 1.5, back + 0.05, 4.2, 1.4, 0.08, WOOD(0x7a5030)));  // the bell, the key rack
        P.push(A(box(cx(3.5) - 1.8, 1.62, back + 0.11, 0.08, 0.22, 0.03, trim(T.YELLOW)), { n: 10, step: [0.4, 0, 0] }), A(box(cx(3.5) - 1.8, 2.2, back + 0.11, 0.08, 0.22, 0.03, trim(T.YELLOW)), { n: 10, step: [0.4, 0, 0] }));
        R.shut(3, 0, 4, 0, 1.2);
        P.push(box(cx(7.5), 0, cz(0), 6.4, 1.1, 1.3, WOOD(0x70442c)), box(cx(7.5), 1.1, cz(0), 6.6, 0.07, 1.55, trim(0x2c2c34)));                  // the bar
        P.push(box(cx(7.5), 1.3, back + 0.12, 6.0, 0.06, 0.3, WOOD(0x70442c)), box(cx(7.5), 2.0, back + 0.12, 6.0, 0.06, 0.3, WOOD(0x70442c)));
        [T.LEAF, T.ORANGE, T.AQUA, T.RED].forEach((t, i) => P.push(A(cyl(cx(7.5) - 2.7 + i * 0.35, 1.36 + (i % 2) * 0.7, back + 0.12, 0.07, 0.36, A(trim(t), { seg: 6 })), { n: 4, step: [1.4, 0, 0] })));
        P.push(A(cyl(cx(7.5) - 2.0, 0, cz(0) + 1.45, 0.22, 0.78, A(trim(T.HOT), { seg: 10 })), { n: 3, step: [2.0, 0, 0] }));                    // three stools, on the squares' edge
        R.shut(7, 0, 8, 0, 1.2);
        R.prop('psx_sofa_1', cx(0), cz(0), 90); R.prop('psx_sofa_3', cx(1), cz(0), 180); R.prop('psx_sofa_4', cx(0), cz(2), 90);
        P.push(cyl(cx(8), 0, cz(2), 1.55, R.H, A(glass(T.AQUA, K.gTall, 0.5), { seg: 16, cap: false })), box(cx(8) - 1.56, 0, cz(2), 0.06, 2.3, 1.1, trim(T.MINT)));   // the tower stair's drum, its door
        R.shut(8, 2, 8, 2, 3);
        [5, 6].forEach(k => P.push(box(cx(k), 0, back + 0.02, 2.5, 2.7, 0.06, trim(0x50545c)), box(cx(k) - 0.52, 0, back + 0.07, 1.0, 2.4, 0.04, trim(T.STEEL)), box(cx(k) + 0.52, 0, back + 0.07, 1.0, 2.4, 0.04, trim(T.STEEL)), box(cx(k), 2.8, back + 0.05, 0.5, 0.2, 0.05, { tint: T.ORANGE, glow: 1 })));   // the lifts
        R.prop('office_plant', cx(2) + 0.9, cz(0) - 1.0); R.prop('office_plant', cx(1) + 1.2, cz(2) + 1.15); R.prop('office_plant', cx(6) + 1.2, cz(2) + 1.15); R.prop('office_plant', cx(5) + 1.75, cz(0) - 1.1);
        P.push(box(cx(4) + 1.2, 0, cz(2) + 1.2, 0.8, 0.55, 0.4, trim(T.NAVY)), box(cx(4) + 0.4, 0, cz(2) + 1.25, 0.5, 0.7, 0.3, trim(T.TERRA)));  // luggage by the wall
        R.lamps([1, 3, 5, 7].map(k => [cx(k), cz(1)]));
    });
    /* 2 the cinema (7 x 8; the door on square 3): the foyer is rows 6-7, the hall rows 0-5; the centre aisle and both cross aisles are whole squares */
    room('P10-08-B1', R => { const { P, cx, cz, W, D } = R, back = -D / 2 + 0.3, zp = -D / 2 + 21, FH = 4.4;
        R.liner(wallM(0x8a3040, K.plaster), mat(KP.rubber, 0x40242c, 1.6), mat(KP.ceil, 0x6a5058, 1.5));
        R.rug(0, 0, W - 0.7, D - 0.7, mat(KP.rubber, 0xa02c40, 1.7));
        [[-W / 2 + 0.3, cx(3) - 1.75], [cx(3) + 1.75, W / 2 - 0.3]].forEach(e => { P.push(box((e[0] + e[1]) / 2, 0, zp, e[1] - e[0], R.H, 0.3, wallM(T.CREAM, K.plaster))); R.line(e[0], zp, e[1], zp, R.H); });   // the wall between the foyer and the hall
        P.push(box(cx(3), 2.7, zp, 3.5, R.H - 2.7, 0.3, wallM(T.CREAM, K.plaster)), box(cx(3), 2.5, zp, 3.9, 0.2, 0.5, trim(T.LEMON)));
        P.push(box(0, FH, zp + 3.5, W - 0.6, 0.15, 6.8, A(mat(KP.ceil, T.WHITE, 1.6), { under: true, roof: true, glow: 0.5 })));                              // the foyer's ceiling
        R.lamps([[cx(1), cz(6.5)], [cx(3), cz(6.5)], [cx(5), cz(6.5)]], FH);
        P.push(box(0, 2.2, back + 0.1, 17.5, 7.4, 0.12, { tint: 0xf4f6ff, glow: 0.55 }), box(0, 2.0, back + 0.06, 18.1, 7.8, 0.08, trim(0x202028)));   // the screen
        [-1, 1].forEach(k => P.push(A(box(k * 10.4, 0, back + 0.25, 0.42, 10.4, 0.3, trim(0x9c1c30)), { n: 4, step: [k * 0.46, 0, 0.02] })));     // the curtains
        P.push(box(0, 10.4, back + 0.3, W - 0.7, 0.9, 0.5, trim(0x9c1c30)));
        [2, 3, 4].forEach(rw => [0, 4].forEach(c0 => { const x = cx(c0 + 1);                                                                    // the seat blocks: two benches a square, facing the screen
            [-0.8, 0.8].forEach(dz => [-3.6, -1.2, 1.2, 3.6].forEach(dx => R.prop('cinema_seat_row', x + dx, cz(rw) + dz, 0)));   // (second pass: the Meshy seat rows in place of the plain benches)
            R.shut(c0, rw, c0 + 2, rw, 1.3); }));
        P.push(box(cx(3), 7.4, zp - 1.1, 6.5, 2.6, 1.9, A(wallM(T.LEMON, K.plaster), { under: true })), box(cx(3), 8.3, zp - 2.08, 1.0, 0.6, 0.06, { tint: 0xfff0b0, glow: 1 }));   // the projector booth, over the cross aisle
        P.push(A(box(cx(3) - 1.6, 0.02, cz(1), 0.12, 0.03, 0.5, { tint: 0xffe08a, glow: 0.9 }), { n: 5, step: [0, 0, 3.5] }), A(box(cx(3) + 1.6, 0.02, cz(1), 0.12, 0.03, 0.5, { tint: 0xffe08a, glow: 0.9 }), { n: 5, step: [0, 0, 3.5] }));   // the aisle lights
        P.push(box(cx(0), 0, cz(6), 3.0, 1.05, 1.5, wallM(T.LEMON, K.plaster)), box(cx(0), 1.05, cz(6), 3.2, 0.07, 1.7, trim()), box(cx(0) - 0.6, 1.12, cz(6), 1.3, 0.55, 0.9, A(glass(T.GLASS, K.gSq, 0.5), { top: true })));   // the snack counter
        P.push(A(box(cx(0) - 1.35, 0.25, cz(6) + 0.76, 0.3, 0.6, 0.02, trim(T.RED)), { n: 5, step: [0.6, 0, 0] }));
        R.prop('cash_register', cx(0) + 0.9, cz(6), 180, { y: 1.12 }); R.shut(0, 6, 0, 6, 1.2);
        R.prop('popcorn_cart', cx(1), cz(6), 180); R.shut(1, 6, 1, 6, 1.7);
        R.prop('ticket_booth', cx(5), cz(6), 180); R.shut(5, 6, 5, 6, 2.6);
        R.prop('psx_sofa_5', cx(6), cz(7), 270);
        R.prop('office_plant', cx(0) - 1.1, cz(7) + 1.15); R.prop('office_plant', cx(6) + 1.15, cz(6) - 1.1);
        [[1, T.HOT], [2, T.AQUA], [4, T.LEMON], [5, T.MINT]].forEach(k => P.push({ s: 'quad', p: [cx(k[0]), 1.2, D / 2 - 0.3], ry: 180, size: [1.5, 2.1], tint: 0x202028 }, { s: 'quad', p: [cx(k[0]), 1.3, D / 2 - 0.32], ry: 180, size: [1.3, 1.9], tint: k[1], glow: 0.35 }));   // poster frames on the front wall
    });
    /* 3 the loading dock (9 x 3; the door on square 5): the walk is the whole middle row */
    room('P11-09-B1', R => { const { P, cx, cz, D } = R, back = -D / 2 + 0.3;
        R.liner(wallM(T.STEEL, K.corr), mat(K.conc, T.YELLOW, 1.6), mat(K.corr, T.GREY, 1.6));
        P.push(A(cyl(cx(0) - 1.55, 0, cz(0) - 0.6, 0.06, 4.4, A(trim(T.ORANGE), { seg: 4, cap: false })), { n: 5, step: [3.4, 0, 0] }), A(cyl(cx(0) - 1.55, 0, cz(0) + 0.6, 0.06, 4.4, A(trim(T.ORANGE), { seg: 4, cap: false })), { n: 5, step: [3.4, 0, 0] }));   // the racking
        P.push(A(box(cx(1.5), 0.2, cz(0), 13.7, 0.1, 1.3, trim(T.NAVY)), { n: 4, step: [0, 1.35, 0] }));
        [0.3, 1.65, 3.0].forEach((y, i) => P.push(A(box(cx(0) - 0.9 + i * 0.5, y, cz(0), 1.1, 0.9, 1.0, WOOD(i === 1 ? 0xb89060 : 0xd0a870)), { n: 6, step: [2.2, 0, 0] })));
        R.shut(0, 0, 3, 0, 4.4);
        R.prop('exec_desk', cx(8), cz(0), 180); R.prop('office_chair', cx(8), cz(0) - 1.0, 180); R.shut(8, 0, 8, 0, 1.0);
        [0, 1, 2].forEach(k => R.prop('office_locker', cx(7) - 0.9 + k * 0.85, back + 0.35, 180));
        R.prop('ind_container', cx(0.5), cz(2), 90); R.shut(0, 2, 1, 2, 2.2);
        [3, 8].forEach((c0, i) => { P.push(box(cx(c0), 0, cz(2), 2.7, 1.3, 2.7, WOOD(0xc49a62)), box(cx(c0) + (i ? -0.4 : 0.4), 1.3, cz(2) + 0.3, 1.4, 1.2, 1.4, A(WOOD(0xd8b078), { ry: 20 })), box(cx(c0) - (i ? -0.7 : 0.7), 1.3, cz(2) - 0.6, 0.9, 0.7, 0.9, WOOD(0xb08850))); R.shut(c0, 2, c0, 2, 2.5); });
        R.prop('psx_metal_barrel_mp_0', cx(4) - 1.2, back + 0.5); R.prop('psx_metal_barrel_mp_2', cx(4) - 0.35, back + 0.55);
        R.prop('psx_wooden_crate_1', cx(6) + 1.2, cz(2) + 1.2, 30); P.push(box(cx(2) + 1.0, 0, cz(2) + 1.15, 1.2, 0.14, 1.0, WOOD(0xb89060)));     // a crate, a pallet by the wall
        R.lamps([1, 4, 7].map(k => [cx(k), cz(1)]));
    });
    /* 4 the surf shop (3 x 5; the door on square 2): a walk down both sides of the tables */
    room('P08-08-B2', R => { const { P, cx, cz, W, D } = R, back = -D / 2 + 0.3;
        R.liner(wallM(T.AQUA, K.plaster), WOOD(0xf0e0c0, 2.0), mat(KP.ceil, T.WHITE, 1.8));
        R.rug(0, 0, W - 0.6, D - 0.6, WOOD(0xd8b888, 1.8));                                                                                     // the plank floor
        P.push(box(cx(2), 0, cz(0), 3.0, 2.5, 3.0, A(wallM(T.NAVY, K.corr), { faces: 'blr' })), A(box(cx(2) - 1.3, 0.2, cz(0) + 1.5, 0.44, 2.2, 0.05, trim(T.RED)), { n: 6, step: [0.52, 0, 0] }), box(cx(2), 2.4, cz(0) + 1.5, 3.1, 0.1, 0.1, trim()));   // the changing booth, its curtain
        R.shut(2, 0, 2, 0, 2.5);
        [1, 3].forEach(rw => { P.push(box(cx(1), 0.8, cz(rw), 3.0, 0.1, 3.0, WOOD(0xe0c090)), A(cyl(cx(1) - 1.3, 0, cz(rw) - 1.3, 0.07, 0.8, A(trim(), { seg: 6, cap: false })), { n: 2, step: [2.6, 0, 0] }), A(cyl(cx(1) - 1.3, 0, cz(rw) + 1.3, 0.07, 0.8, A(trim(), { seg: 6, cap: false })), { n: 2, step: [2.6, 0, 0] }));
            [T.AQUA, T.HOT, T.LEMON, T.MINT, T.CORAL, T.WHITE].forEach((t, i) => P.push(box(cx(1) - 0.9 + (i % 3) * 0.9, 0.9, cz(rw) - 0.6 + Math.floor(i / 3) * 1.2, 0.6, 0.12 + (i % 2) * 0.08, 0.7, trim(t))));   // folded shirts
            R.shut(1, rw, 1, rw, 1.0); });
        P.push(box(cx(0), 0, cz(4), 3.0, 1.05, 1.4, WOOD(0xc89868)), box(cx(0), 1.05, cz(4), 3.2, 0.06, 1.6, trim(T.AQUA))); R.prop('cash_register', cx(0) + 0.7, cz(4), 90, { y: 1.1 }); R.shut(0, 4, 0, 4, 1.2);
        /* (the second pass: the boards on both walls and the wetsuit rail are the Meshy surfboards + wetsuit rail, SECOND below) */
        R.prop('office_plant', cx(2) + 1.15, cz(4) - 1.0);
        R.lamps([[cx(0), cz(2)], [cx(2), cz(2)]]);
    });
    /* 5 the boat repair (5 x 3; the door on square 2): the walk goes all round the hull */
    room('P09-08-B3', R => { const { P, cx, cz, D } = R, back = -D / 2 + 0.3;
        R.liner(wallM(T.TEAL, K.corr), mat(K.conc, T.GREY, 1.6), mat(K.corr, T.STEEL, 1.6));
        P.push(box(cx(0.5), 0, cz(0), 6.4, 0.9, 1.3, WOOD(0xb89060)), box(cx(0.5), 1.3, back + 0.05, 5.6, 1.2, 0.06, trim(0x40444c)));             // the workbench, its tool board
        [T.RED, T.YELLOW, T.STEEL, T.ORANGE].forEach((t, i) => P.push(A(box(cx(0.5) - 2.4 + i * 0.3, 1.5 + (i % 2) * 0.4, back + 0.1, 0.12, 0.5, 0.03, trim(t)), { n: 4, step: [1.3, 0, 0] })));
        P.push(box(cx(0.5) - 2.0, 0.9, cz(0), 0.7, 0.3, 0.5, trim(T.RED)), box(cx(0.5) + 1.6, 0.9, cz(0) + 0.1, 0.5, 0.2, 0.9, trim(T.STEEL)));
        R.shut(0, 0, 1, 0, 1.2);
        R.prop('outboard_motor', cx(4), cz(0), 180);                                                                                            // the engine on its stand (second pass: the Meshy outboard)
        P.push(A(cyl(cx(4) - 1.3, 0, cz(0), 0.08, 2.9, A(trim(T.YELLOW), { seg: 4, cap: false })), { n: 2, step: [2.6, 0, 0] }), box(cx(4), 2.9, cz(0), 3.0, 0.16, 0.16, trim(T.YELLOW)), box(cx(4), 1.7, cz(0), 0.04, 1.2, 0.04, trim(T.DARK)));   // the hoist
        R.shut(4, 0, 4, 0, 2.9);
        [-1.3, 1.3].forEach(dx => P.push(box(cx(2.5) + dx, 0.9, cz(1), 0.12, 0.1, 1.9, WOOD(0xb89060)), A(box(cx(2.5) + dx, 0, cz(1) - 0.8, 0.1, 0.9, 0.1, WOOD(0xb89060)), { n: 2, step: [0, 0, 1.6] })));   // the trestles
        R.prop('rowboat', cx(2.5), cz(1), 90, { y: 1.0 }); R.shut(2, 1, 3, 1, 1.8);
        P.push(A(box(cx(4), 0, cz(2), 3.0, 0.14, 0.5, WOOD(0xd8b078)), { n: 4, step: [0, 0.3, 0] }), A(box(cx(4), 0.15, cz(2) - 0.9, 3.0, 0.14, 0.5, WOOD(0xc8a068)), { n: 4, step: [0, 0.3, 0] }), A(box(cx(4), 0.15, cz(2) + 0.9, 3.0, 0.14, 0.5, WOOD(0xc8a068)), { n: 4, step: [0, 0.3, 0] }));   // the timber stack
        R.shut(4, 2, 4, 2, 1.3);
        R.prop('ship_anchor', cx(0), cz(2), 90); P.push(cyl(cx(0) + 0.9, 0, cz(2) + 0.7, 0.45, 0.22, A(WOOD(0xd8c090), { seg: 10 })), cyl(cx(0) - 0.8, 0, cz(2) - 0.8, 0.38, 0.3, A(WOOD(0xd8c090), { seg: 10 })));   // the spare anchor, coils of rope
        R.shut(0, 2, 0, 2, 1.9);
        [0, 1, 2].forEach(k => R.prop('office_locker', cx(2.5) - 0.85 + k * 0.85, back + 0.35, 180));
        R.prop('psx_metal_barrel_mp_1', cx(3) + 1.25, cz(2) + 1.2); R.prop('psx_metal_barrel_mp_3', cx(1) - 1.3, cz(2) + 1.2);
        R.lamps([[cx(1), cz(1)], [cx(3), cz(1) + 1.75]]);
    });
    /* 6 the harbour master (2 x 2; the door on square 0): the tower's foot fills the front right square, the chart table the back right */
    room('bay-harbourmaster', R => { const { P, cx, cz, W, D } = R, back = -D / 2 + 0.3;
        R.liner(wallM(T.WHITE, K.plaster), WOOD(0x8a6a4a, 1.9), mat(KP.ceil, T.WHITE, 1.8));
        R.rug(cx(0), 0, 2.4, D - 1.2, mat(KP.rubber, 0xb83848, 1.7));
        P.push(box(cx(1) + 0.05, 0, D / 2 - 1.72, 3.3, R.H, 3.2, A(wallM(T.WHITE, K.plaster), { faces: 'bl', top: false })), box(cx(1) - 1.62, 0, D / 2 - 1.6, 0.05, 2.2, 1.0, trim(T.NAVY)));   // the tower's foot, its door
        R.shut(1, 1, 1, 1, 3);
        P.push(box(cx(1), 0, cz(0), 2.7, 1.0, 1.7, WOOD(0xa87850)), { s: 'quad', flat: true, p: [cx(1) - 0.2, 1.02, cz(0)], size: [1.7, 1.2], tint: 0xf4ecd0 }, { s: 'quad', flat: true, p: [cx(1) - 0.3, 1.03, cz(0) + 0.1], size: [0.9, 0.6], tint: T.AQUA });   // the chart table, a chart
        R.prop('retro_radio', cx(1) + 0.95, cz(0) - 0.3, 180, { y: 1.02 }); R.shut(1, 0, 1, 0, 1.2);
        R.prop('filing_cabinet', cx(0) - 0.9, back + 0.35, 180); R.prop('filing_cabinet', cx(0) - 0.05, back + 0.35, 180);
        R.prop('brass_telescope', -W / 2 + 0.85, cz(0) + 1.3, 270);
        R.lamps([[cx(0), cz(0.5)]]);
    });
    /* 7 the market hall (5 x 3, open): the stalls stand on squares 0, 2, 4 of the back row; a till on each, a crate stack on the middle of the front row's square 2 */
    room('P08-09-B1', R => { const { P, cx, cz } = R;
        [0, 2, 4].forEach(k => { R.prop('cash_register', cx(k) + 0.05, cz(0), 180, { y: 1.0 }); R.shut(k, 0, k, 0, 1.2); });
        P.push(box(cx(2), 0, cz(2), 2.6, 0.9, 2.6, WOOD(0xc49a62)), box(cx(2) - 0.5, 0.9, cz(2) + 0.4, 1.3, 0.8, 1.3, A(WOOD(0xd8b078), { ry: 15 })), box(cx(2) + 0.7, 0.9, cz(2) - 0.6, 0.9, 0.35, 0.7, trim(T.ORANGE)));
        R.shut(2, 2, 2, 2, 1.7);
    });
    console.warn('[bayside interiors]', JSON.stringify(n));
}

function beach(ctx, push, ghost) {
    const { lateRows, props, take, gc, gx, r3, N, paintCell } = ctx;
    const X0 = gx(144), XB = gx(146), XE = gx(144 + EAST), Z0 = gx(8 * N), Z1 = gx(12 * N);     // the city's east edge, the sea wall, the room's east edge; Bayside's north and south
    const rect = (x0, z0, x1, z1, h, o) => lateRows.push(Object.assign({ k: 'plateau', x: r3((x0 + x1) / 2), z: r3((z0 + z1) / 2), w: r3(x1 - x0), d: r3(z1 - z0), h, absY: true }, o));   // absY: the beach is at sea level whatever the city's levels beside it
    const ZN = Z0 + 7, ZS = gx(136), XG = gx(158), XD = gx(151.5);                              // the mole's south side; the grill deck's north side and east side; where the shelf starts down
    /* the water: north of Bayside (under the quay wall), the shelf, the deep, east of the mole's arm, east of the grill deck */
    /* THE LEVELS: the ground east of the city would carry the edge plot's level out to sea (the Marina plot stands a level up), so the whole
       beach strip is first cut flat to level 0; the Marina's way out comes down a ramp across the boardwalk's width */
    rect(X0 + 0.4, Z0, XE + 2, Z1 + 2, 0, { sink: true, edge: 0.3 });
    { const lv = (ctx.lvOf && ctx.plotOf['P11-08']) ? ctx.lvOf(ctx.plotOf['P11-08']) * ctx.LEVELS.M : 0;
      if (lv > 0) lateRows.push({ k: 'ramp', x0: r3(X0 + 0.2), z0: gx(8 * N + 6), x1: r3(XB - 0.4), z1: gx(8 * N + 6), w: 7, h0: lv, h1: 0, edge: 0.2, absY: true }); }
    rect(X0 + 0.6, -ctx.HALF - 2, XE + 2, Z0, DEEP, { sink: true, edge: 0.4 });   // (THE NATURAL EDGES, 2026-11-13: to past the field's north edge, so no rim of the city's level stands across the north end of the bay)
    rect(XB, ZN, XE + 2, ZS, SHELF, { sink: true, edge: 0.3 });
    rect(XD, ZN, XE + 16, ZS, DEEP, { sink: true, edge: 12 });   // (THE NATURAL EDGES: the 12 m bank on its east side lies past the field, so no sand bar rises along the room's east edge)
    rect(gx(161), Z0 - 0.4, XE + 2, ZN + 0.4, DEEP, { sink: true, edge: 0.4 });
    rect(XG, ZS - 0.4, XE + 2, Z1 + 2, DEEP, { sink: true, edge: 0.4 });
    /* the mole's arm out to the light (the boardwalk's level), its round head */
    rect(gx(159), ZN - 0.5, gx(161), gx(104), 0, { edge: 0.4 });
    lateRows.push({ k: 'plateau', x: gx(160), z: gx(105), r: 6.2, h: 0, edge: 0.4, absY: true });
    /* the ramps down to the sand, off the boardwalk at each way out of the city */
    const RAMPS = [gx(8 * N + 6), gx(9 * N + 10), gx(10 * N + 10), gx(11 * N + 2.5)];
    RAMPS.forEach(z => lateRows.push({ k: 'ramp', x0: XB - 0.2, z0: r3(z), x1: r3(XB + 7), z1: r3(z), w: 3.5, h0: 0, h1: SHELF, edge: 0.2, absY: true }));
    /* the pier (the mall's axis: rows 5-6 of the row-10 plots), its head, the bait hut's bit of deck */
    const ZP = gx(10 * N + 6), XH0 = gx(157), XH1 = gx(163);
    lateRows.push({ k: 'deck', x0: XB - 0.3, z0: ZP, x1: XH0, z1: ZP, w: 7, y: 0, absY: true }, { k: 'deck', x0: XH0, z0: ZP, x1: XH1, z1: ZP, w: 21, y: 0, rails: false, absY: true }, { k: 'deck', x0: gx(152), z0: r3(ZP - 7), x1: gx(154), z1: r3(ZP - 7), w: 7, y: 0, rails: false, absY: true });
    push('bay-pier', XB, ZP, 0, B.pier(XH0 - XB, 7));
    push('bay-pavilion', (XH0 + XH1) / 2, ZP, 0, B.pavilion()); ghost((XH0 + XH1) / 2, ZP, 2.6, 1.0);
    push('bay-bait', gx(153), ZP - 7.6, 0, B.bait()); ghost(gx(153), ZP - 7.6, 4.2, 2.6);
    /* the ground sheets: planks (the boardwalk, the grill deck), sand (the shelf and the bay's floor), concrete (the mole) */
    for (let cy = 8 * N; cy < 12 * N; cy++) for (let cx = 144; cx < 144 + EAST; cx++) {
        const mole = (cy < 8 * N + 2 && cx >= 146 && cx < 161) || (cx >= 159 && cx < 161 && cy < 8 * N + 8) || (Math.hypot(cx + 0.5 - 160, cy + 0.5 - (8 * N + 9)) < 2.2);
        const deck = cx < 146 || (cy >= 136 && cx < 158);
        paintCell(cx, cy, mole && cx >= 146 ? 'urban:ConcreteStriped2a' : deck ? 'wood_planks' : 'desert');
    }
    /* the promenade's rail along the sea wall, open at the ramps, the pier and the mole */
    const gaps = RAMPS.map(z => [z - 2, z + 2]).concat([[ZP - 3.7, ZP + 3.7], [Z0, ZN + 0.2], [ZS, Z1]]);
    { let z = Z0; const cuts = gaps.slice().sort((a, b) => a[0] - b[0]); cuts.push([Z1, Z1]);
      cuts.forEach(g => { if (g[0] - z > 1) lateRows.push({ k: 'rail', x0: r3(XB - 0.25), z0: r3(z), x1: r3(XB - 0.25), z1: r3(g[0]), model: 'spear' }); z = Math.max(z, g[1]); }); }
    /* the life on it */
    for (let cy = 8 * N + 1; cy < 12 * N; cy += 3) props.push({ key: 'palm_tree', x: r3(X0 + 0.9), z: gx(cy) });
    for (let cy = 8 * N + 4; cy < 12 * N - 9; cy += 6) props.push({ key: 'city_bench', x: r3(XB - 1.0), z: gc(cy), face: 90 });
    const sand = (cx, cy) => [gc(cx), gc(cy)];
    [[147, 100], [149, 104], [147, 110], [149, 116], [147, 123], [149, 129], [147, 133]].forEach((c, i) => { const q = sand(c[0], c[1]);
        props.push({ key: 'pool_umbrella', x: q[0], z: q[1] }, { key: 'pool_lounger', x: gc(c[0] + 1), z: q[1], face: 90 }, { key: 'pool_lounger', x: gc(c[0] + 1), z: gc(c[1] + 1), face: 90 }); });
    props.push({ key: 'lifeguard_chair', x: gc(150), z: gc(8 * N + 13), face: 90 }, { key: 'lifeguard_chair', x: gc(150), z: gc(10 * N + 13), face: 90 });
    props.push({ key: 'rowboat', x: gc(150), z: gc(8 * N + 4), face: 70 }, { key: 'rowboat', x: gc(150), z: gc(11 * N + 1), face: 110 });
    for (let i = 0; i < 5; i++) props.push({ key: 'sea_buoy', x: gx(156), z: gx(8 * N + 5 + i * 7.5) });
    push('bay-net', gc(148), gx(9 * N + 6), 90, B.net());
    push('bay-lifeguard', gc(148), gx(10 * N + 2), 270, B.lifeguard()); ghost(gc(148), gx(10 * N + 2), 3.4, 3.0);
    /* the light on the mole's head (the Marina lookout's own lighthouse moves out here: its yard square is taken, so the city's is skipped) */
    take(11 * N + 9, 8 * N + 5); take(11 * N + 10, 8 * N + 5); take(11 * N + 9, 8 * N + 6); take(11 * N + 10, 8 * N + 6);
    props.push({ key: 'lighthouse', x: gx(160), z: gx(105), face: 90 });
    /* the grill: the BurgerPiz at its own size on the deck, its long windowed front to the beach */
    props.push({ key: 'city_burgerpiz', x: gx(152), z: gx(140.5), face: 180 });
}
/* numbers to the millimetre (the data.js block stays short) */
function round(q, r3) { const o = {}; Object.keys(q).forEach(k => { const v = q[k]; o[k] = typeof v === 'number' && !/^(tint|tintTop|tintEnd)$/.test(k) ? r3(v) : Array.isArray(v) ? v.map(a => typeof a === 'number' ? r3(a) : Array.isArray(a) ? a.map(r3) : a) : (v && typeof v === 'object') ? round(v, r3) : v; }); return o; }

/* after every row exists: the city's own edge fences across the ways out to the boardwalk come down */
function build(ctx) {
    const { features, gx, N } = ctx, X0 = gx(144);
    const open = Object.keys(WAYS).map(id => { const py = +id.slice(4), w = WAYS[id]; return [gx(py * N + w[2]), gx(py * N + w[3] + 1)]; });
    for (let i = features.length - 1; i >= 0; i--) { const f = features[i];
        if ((f.k === 'rail' || f.k === 'wall') && !f.ghost && Math.abs(f.x0 - X0) < 0.5 && Math.abs(f.x1 - X0) < 0.5 && open.some(o => Math.min(f.z0, f.z1) >= o[0] - 0.1 && Math.max(f.z0, f.z1) <= o[1] + 0.1)) features.splice(i, 1); }
}
module.exports = { room, tailor, apply, build, B, K, T };
