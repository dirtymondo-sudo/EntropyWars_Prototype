/* DISASTER CITY · THE SPORTS + CULTURE DISTRICT (plots P04..P07 × rows 08..11; mondo's OK 2026-11-13 17:20: "Yes, build it").
   Loaded by bake-disaster-city.js (THE DISTRICT FILES). Every building here is drawn by one `arch` row (three-renderer.js _hqArchGeometry;
   notes: docs/notes/areas-complexes.md "DISASTER CITY, THE ARCHITECTURE ROW"); the plan's own row keeps the collision, the doorway, the
   inside and the walked roof and draws nothing (`skin: false`).
   - tailor: THE STADIUM takes four plots (Park west, Park east, Practice court, Locker rooms: mondo 17:17 "is this not where the football
     field is supposed to go?", his pick "Stadium on 4 plots, 3/4 size field"); the Museum faces south onto a forecourt; the two
     street kiosks and the pizzeria stand on their own squares.
   - apply: the looks, the collision rows, the props.
   GOLD (mondo 11-13 17:12): gold is the terrain key 'gold' (the gilt sheet), never a tinted plaster. */
const U = n => 'urban:' + n;
const STUCCO = U('PlasterWallStucco1a'), WHITE = U('PlasterWallPainted1a'), DARK = U('PlasterWallPainted1b'), REDP = U('PlasterWallPainted1c'), OCHRE = U('PlasterWallPainted1d'), GREENP = U('PlasterWallPainted1e'), BLUEP = U('PlasterWallPainted1f');
const ROOFC = U('ConcreteUnderTiles1'), CONC = U('ConcreteStriped2a'), CONCW = U('ConcreteStriped1a');
const M_GREY = U('MetalCorrugatedPainted1a'), M_RED = U('MetalCorrugatedPainted2a'), M_OCHRE = U('MetalCorrugatedPainted3a'), M_GREEN = U('MetalCorrugatedPainted4a'), M_BLUE = U('MetalCorrugatedPainted5a');
const G_TALL = U('GlassWindowTall1a'), G_TALL3 = U('GlassWindowTall3a'), G_SQ = U('GlassWindowSquare1a'), G_SQ3 = U('GlassWindowSquare3a'), G_FAC = U('GlassWindowFactory2a'), G_FAC1 = U('GlassWindowFactory1a'), G_RES = U('GlassWindowResidential1a');
const T_RED = U('TileSubway3a'), T_BLUE = U('TileSubway3d'), T_OCHRE = U('TileSubway3b'), T_CHECK = U('TileGeneric5a');
const GRILL = U('MetalSubwayGrill1a'), MARBLE = U('TileMarble1a'), MARBLE_D = U('TileMarble2d'), RUBBER = U('RubberNonSlip1a'), RUB_Y = U('RubberNonSlip3a'), PAVE = U('TileGeneric2a');
const TRUSS = U('MetalTruss1b'), DOORS = U('DoorStorefrontHalf1b'), GOLD = 'gold';
const STADIUM = ['P04-09', 'P05-09', 'P04-10', 'P05-10'];

/* ── helpers: parts in a building's own frame (front = +z, the footprint w × d centred on the row) ── */
const walls = (w, h, d, key, tint, o) => { o = o || {}; const uv = o.uv || 3.5, out = [{ s: 'box', p: [0, 0, 0], size: [w, h, d], faces: o.door ? 'blr' : 'fblr', top: false, key, tint, uv }]; if (o.door) out.push({ s: 'quad', p: [0, 0, d / 2], size: [w, h], hole: o.door, key, tint, uv }); return out; };
const slab = (w, d, y, t, key, tint, keyTop) => ({ s: 'box', p: [0, y, 0], size: [w, t, d], under: true, key, tint, keyTop: keyTop || key });
/* a row of panels along one face: 'f' front, 'b' back, 'l' (-x), 'r' (+x); n panels spread over `span` */
const panels = (face, w, d, y, pw, ph, n, key, o) => { o = o || {}; const L = (face === 'f' || face === 'b') ? w : d, span = o.span || (L - pw - 1.2), st = n > 1 ? span / (n - 1) : 0, off = 0.03 + (o.out || 0), c = o.c || 0;
    const P = { s: 'quad', size: [pw, ph], key, uv: o.uv || 'fit', n, tint: o.tint, glow: o.glow, kind: o.kind };
    if (face === 'f') { P.p = [c - span / 2, y, d / 2 + off]; P.step = [st, 0, 0]; }
    if (face === 'b') { P.p = [c + span / 2, y, -d / 2 - off]; P.step = [-st, 0, 0]; P.ry = 180; }
    if (face === 'r') { P.p = [w / 2 + off, y, c + span / 2]; P.step = [0, 0, -st]; P.ry = -90; }
    if (face === 'l') { P.p = [-w / 2 - off, y, c - span / 2]; P.step = [0, 0, st]; P.ry = 90; }
    return P; };
/* a striped awning: alternating sloped strips over a shop front */
const awning = (cx, y, z, w, depth, c1, c2, n) => { const out = [], sw = w / n; for (let i = 0; i < n; i++) out.push({ s: 'roof', form: 'shed', ry: 180, p: [cx - w / 2 + sw * (i + 0.5), y, z + depth / 2], size: [sw, 0.9, depth], tint: i % 2 ? c2 : c1, under: true, ds: true }); return out; };
const clean = o => { Object.keys(o).forEach(k => { if (o[k] === undefined) delete o[k]; }); return o; };

/* ═══ tailor: before the plan is read ═══ */
exports.tailor = (PLAN, plotOf) => {
    const rows = (id, a) => { plotOf[id].cells = a; a.forEach(r => { if (r.length !== 12) throw new Error('S.js: a row of ' + id + ' is not 12 squares'); }); };
    /* THE STADIUM: G = the grass (the field and its ends: nothing is placed there), I = a stand, P = the concourse behind a stand */
    const G = 'GGGGGGGGGGGG', Pv = 'PPPPPPPPPPPP', sw = 'GGIIIIIIIIII', se = 'IIIIIIIIIIGG';
    rows('P04-09', [Pv, Pv, sw, sw, sw, sw, G, G, G, G, G, G]); rows('P05-09', [Pv, Pv, se, se, se, se, G, G, G, G, G, G]);
    rows('P04-10', [G, G, G, G, G, G, sw, sw, sw, sw, Pv, Pv]); rows('P05-10', [G, G, G, G, G, G, se, se, se, se, Pv, Pv]);
    STADIUM.forEach(id => { const p = plotOf[id]; p.buildings = []; p.wasName = p.name; p.name = 'Stadium'; });
    /* THE MUSEUM faces SOUTH (the plan's north door looked at the back of the next plot's buildings, a square away): its portico stands on a
       forecourt three squares deep that runs on into the stadium's concourse */
    { const p = plotOf['P04-08'], b = p.buildings[0]; b.doors = [{ x: 5, y: 8, ox: 5, oy: 9, side: 'S' }].concat(b.doors.filter(d => d.side === 'E'));
      rows('P04-08', ['############', '#PPPPPPPPPP#', '#PIIIIIIIIP#', '#PIIIIIIIIP#', '#PIIIIIIIIP#', '#PIIIIIIIDPP', '#PIIIIIIIIPP', '#PIIIIIIIIP#', '#PIIIIDIIIP#', '#PPPPPPPPPP#', '#PPPPPPPPPP#', '#PPPPPPPPPP#']); }
    /* THE STREET KIOSKS (P05-11, P06-11): a kiosk is two squares by two, not the plan's long annex; THE PIZZERIA (P05-11) is the pack's own
       building on six squares by three, turned along the road (its front east, onto the stall court) */
    ['P05-11', 'P06-11'].forEach(id => { const p = plotOf[id]; p.buildings = p.buildings.filter(b => b.id !== id + '-B2'); const c = p.cells.slice(); c[1] = '#.II.PP....#'; c[2] = '#.II.PP....#'; rows(id, c); });
    { const p = plotOf['P05-11']; p.buildings = p.buildings.filter(b => b.id !== 'P05-11-B1'); const c = p.cells.slice(); c[9] = 'IIIIII.....#'; c[10] = 'IIIIII.....#'; c[11] = 'IIIIII######'; rows('P05-11', c); }
};

/* ═══ apply: the buildings and their door steps exist ═══ */
exports.apply = (ctx) => {
    const { features, props, lateRows, take, gc, r3 } = ctx;
    const row = id => { const f = features.find(q => q.id === 'dc:' + id); if (!f) throw new Error('S.js: no row dc:' + id); return f; };
    let seed = 7700;
    /* the plan's row keeps the collision and draws nothing */
    const solid = (id, st) => { const f = row(id); delete f.key; delete f.hollow; delete f.door; f.style = f.style || 'office'; f.storeys = st; f.skin = false; return f; };
    const walkin = (id, st, door) => { const f = row(id); delete f.key; f.style = f.style || 'office'; f.hollow = true; f.storeys = st; if (door) f.door = door; f.skin = false; return f; };
    const tier = id => { const f = row(id); f.bld.skin = false; return f; };
    /* a block nothing is drawn for: a stand, a kiosk, a mast's foot (collision only) */
    const block = (id, x, z, w, d, st) => features.push({ k: 'texbuilding', id: 'dc:S-' + id, x: r3(x), z: r3(z), w, d, rot: 0, storeys: st || 1, style: 'office', seed: seed++, skin: false });
    const B = (id, x, z, rot, parts) => lateRows.push({ k: 'arch', id: 'arch:S:' + id, x: r3(x), z: r3(z), y: 0, rot, parts: parts.concat(X[id] ? X[id]() : []).flat(Infinity).map(clean) });

    /* ═══ THE POLISH PASS (mondo 11-13 20:15: "one more polish pass on the exteriors ... Go one or two more layers deep with the detail, the
       foundation is already there and is good"; 20:18: "roofs and ac units"). X[id] = the second and third layer of a building, added to its
       arch row: cornices and copings, sills and lintels, door surrounds and steps, wall lamps, gutters and downpipes, lettered signs
       (three-renderer.js THE LETTERING), roof plant (AC units, vents, hatches, tanks), flags. Nothing at ground level stands out past 0.8 m. ═══ */
    const X = {};
    const STEEL = 0x4a5058, DARKM = 0x2a2e34, CREAM = 0xf2ead8, LAMP = 0xffe2a0;
    /* a point on a face: u = along it (left to right as you look at it), out = off the wall */
    const on = (face, w, d, u, out) => face === 'f' ? [u, d / 2 + out] : face === 'b' ? [-u, -d / 2 - out] : face === 'r' ? [w / 2 + out, -u] : [-w / 2 - out, u];
    const RY = { f: 0, b: 180, r: -90, l: 90 }, STEP = { f: [1, 0], b: [-1, 0], r: [0, -1], l: [0, 1] };
    /* a box on a face: bw along it, bh high, bt standing out; n of them a step apart */
    const bx = (face, w, d, u, y, bw, bh, bt, o) => { o = o || {}; const q = on(face, w, d, u, bt / 2 + (o.out || 0)), ns = face === 'f' || face === 'b';
        const P = Object.assign({ s: 'box', p: [q[0], y, q[1]], size: ns ? [bw, bh, bt] : [bt, bh, bw] }, o); delete P.out;
        if (o.n > 1) P.step = [STEP[face][0] * o.st, 0, STEP[face][1] * o.st]; delete P.st; return P; };
    /* the sills and lintels of a row of windows laid by panels() (same face, y, size, count, span, centre) */
    const trim = (face, w, d, y, pw, ph, n, o) => { o = o || {}; const L = (face === 'f' || face === 'b') ? w : d, span = o.span || (L - pw - 1.2), st = n > 1 ? span / (n - 1) : 0, u0 = (o.c || 0) - span / 2, K = { key: o.key || WHITE, tint: o.tint, n, st };
        return [bx(face, w, d, u0, y - 0.14, pw + 0.3, 0.14, 0.2, K), bx(face, w, d, u0, y + ph, pw + 0.24, 0.16, 0.12, K)]; };
    /* shutters either side of a row of windows */
    const shutters = (face, w, d, y, pw, ph, n, tint, o) => { o = o || {}; const L = (face === 'f' || face === 'b') ? w : d, span = o.span || (L - pw - 1.2), st = n > 1 ? span / (n - 1) : 0, u0 = (o.c || 0) - span / 2;
        return [-1, 1].map(sd => bx(face, w, d, u0 + sd * (pw / 2 + 0.24), y, 0.42, ph, 0.06, { tint, n, st })); };
    const cornice = (w, d, y, t, out, key, tint, o) => Object.assign({ s: 'box', p: [0, y, 0], size: [w + 2 * out, t, d + 2 * out], top: false, under: true, key, tint }, o || {});
    const coping = (w, d, y, key, tint) => [bx('f', w, d, 0, y, w + 0.3, 0.3, 0.3, { out: -0.3, key, tint }), bx('b', w, d, 0, y, w + 0.3, 0.3, 0.3, { out: -0.3, key, tint }), bx('l', w, d, 0, y, d - 0.3, 0.3, 0.3, { out: -0.3, key, tint }), bx('r', w, d, 0, y, d - 0.3, 0.3, 0.3, { out: -0.3, key, tint })];
    const pipe = (face, w, d, u, h, tint) => { const q = on(face, w, d, u, 0.1); return [{ s: 'cyl', p: [q[0], 0, q[1]], r: 0.07, h, seg: 6, tint: tint || DARKM }, bx(face, w, d, u, h - 0.3, 0.3, 0.3, 0.26, { tint: tint || DARKM })]; };
    const gutter = (face, w, d, y, len, tint) => bx(face, w, d, 0, y, len, 0.16, 0.22, { tint: tint || DARKM });
    const lamp = (face, w, d, u, y) => [bx(face, w, d, u, y, 0.34, 0.4, 0.3, { tint: LAMP, glow: 0.9 }), bx(face, w, d, u, y + 0.4, 0.44, 0.08, 0.38, { tint: DARKM })];
    /* a lettered sign: the words on a board (bg) or alone (bg ''), sw × sh, its foot at y */
    const sign = (face, w, d, u, y, sw, sh, words, fg, bg, o) => { o = o || {}; const q = on(face, w, d, u, 0.05 + (o.out || 0));
        const P = { s: 'quad', p: [q[0], y, q[1]], ry: RY[face], size: [sw, sh], key: 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + (Math.round(sw / sh * 100) / 100), uv: 'fit', tint: 0xffffff, glow: o.glow, kind: bg ? undefined : 'over' };
        return o.board ? [bx(face, w, d, u, y - 0.12, sw + 0.3, sh + 0.24, 0.14, { out: o.out || 0, tint: o.board }), Object.assign(P, { p: [on(face, w, d, u, 0.2 + (o.out || 0))[0], y, on(face, w, d, u, 0.2 + (o.out || 0))[1]] })] : P; };
    /* a free-standing sign on any plane: a quad at [x, y, z] turned ry */
    const signAt = (x, y, z, ry, sw, sh, words, fg, bg, glow) => ({ s: 'quad', p: [x, y, z], ry, size: [sw, sh], key: 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + (Math.round(sw / sh * 100) / 100), uv: 'fit', tint: 0xffffff, glow, kind: bg ? undefined : 'over' });
    /* THE ROOF PLANT: an AC unit (a cabinet, its fan ring, its feet), a vent cowl, a roof hatch, a duct run, a water tank */
    const ac = (x, y, z, sc) => { sc = sc || 1; return [{ s: 'box', p: [x, y + 0.14, z], size: [1.5 * sc, 0.95 * sc, 1.0 * sc], key: M_GREY, tint: 0xc8ccd0, uv: 1.2 }, { s: 'box', p: [x, y, z], size: [1.3 * sc, 0.14, 0.8 * sc], tint: DARKM },
        { s: 'cyl', p: [x, y + 0.14 + 0.95 * sc, z], r: 0.36 * sc, h: 0.08, seg: 12, tint: DARKM }, { s: 'quad', p: [x, y + 0.3, z + 0.5 * sc + 0.01], size: [1.2 * sc, 0.6 * sc], key: GRILL, uv: 'fit' }]; };
    const acRow = (x, y, z, n, dx, dz) => Array.from({ length: n }, (_, i) => ac(x + i * (dx || 0), y, z + i * (dz || 0)));
    const wallAC = (face, w, d, u, y) => [bx(face, w, d, u, y, 0.9, 0.6, 0.45, { key: M_GREY, tint: 0xc8ccd0, uv: 0.9 }), bx(face, w, d, u, y + 0.08, 0.7, 0.44, 0.02, { key: GRILL, uv: [0.7, 0.44], out: 0.45 }), bx(face, w, d, u, y - 0.08, 1.0, 0.08, 0.5, { tint: DARKM })];
    const vent = (x, y, z, r) => { r = r || 0.25; return [{ s: 'cyl', p: [x, y, z], r, h: 0.7, seg: 10, tint: 0x9aa0a8 }, { s: 'cyl', p: [x, y + 0.7, z], r: r * 1.7, r2: r * 0.6, h: 0.3, seg: 10, tint: 0x7a8088 }]; };
    /* a rubber walkway laid on a flat roof between the plant */
    const mat = (x, y, z, w2, d2) => ({ s: 'quad', flat: true, p: [x, y + 0.03, z], size: [w2, d2], key: RUBBER, uv: 1.75 });
    const hatch = (x, y, z) => [{ s: 'box', p: [x, y, z], size: [1.2, 0.35, 1.2], key: M_GREY, tint: 0x8a9098, uv: 1.2 }, { s: 'box', p: [x, y + 0.35, z], size: [1.3, 0.08, 1.3], tint: DARKM }];
    const duct = (x, y, z, len, alongZ) => [{ s: 'box', p: [x, y + 0.25, z], size: alongZ ? [0.6, 0.5, len] : [len, 0.5, 0.6], key: M_GREY, tint: 0xb0b6bc, uv: 1.2 }, { s: 'box', p: [x, y, z], size: alongZ ? [0.2, 0.25, len * 0.9] : [len * 0.9, 0.25, 0.2], tint: DARKM }];
    const tank = (x, y, z, r, h) => [{ s: 'box', p: [x, y, z], size: [r * 1.6, 0.9, r * 1.6], top: false, key: TRUSS, uv: [1.1, 0.9], ds: true }, { s: 'cyl', p: [x, y + 0.9, z], r, h, seg: 14, key: M_OCHRE, tint: 0xb89878, uv: 1.5 }, { s: 'cyl', p: [x, y + 0.9 + h, z], r: r * 1.08, r2: 0, h: r * 0.7, seg: 14, tint: 0x5a4a40 }];
    const flag = (x, y, z, h, tint) => [{ s: 'cyl', p: [x, y, z], r: 0.07, h, seg: 6, tint: 0xdddddd }, { s: 'quad', p: [x + 0.65, y + h - 0.95, z], size: [1.3, 0.85], tint, ds: true }];
    const steps = (face, w, d, u, sw, n) => Array.from({ length: n }, (_, i) => bx(face, w, d, u, 0, sw + (n - 1 - i) * 0.0, 0.17 * (n - i), 0.36, { out: 0.36 * i, key: CONC }));
    const surround = (face, w, d, u, dw, dh, key, tint) => [bx(face, w, d, u - dw / 2 - 0.2, 0, 0.3, dh + 0.3, 0.18, { key, tint }), bx(face, w, d, u + dw / 2 + 0.2, 0, 0.3, dh + 0.3, 0.18, { key, tint }), bx(face, w, d, u, dh + 0.05, dw + 0.9, 0.34, 0.26, { key, tint })];

    /* THE MUSEUM: the name cut in the frieze, steps up to the portico, a dentil course, pilasters between the tall windows with sills and
       keystones, a roundel in the pediment, a balustrade round the roof, a ring cornice and ribs on the drum, lamps and urns at the door,
       roof plant behind the parapet */
    X['P04-08-B1'] = () => { const w = 28, d = 24.5, o = [];
        o.push(signAt(0, 8.72, 16.58, 0, 13, 1.05, 'MUSEUM OF THE CITY', '#3a3428', ''));
        o.push({ s: 'box', p: [0, 0, 16.9], size: [21.5, 0.2, 0.9], key: MARBLE }, { s: 'box', p: [0, 0.2, 16.6], size: [21.5, 0.2, 0.5], key: MARBLE }, { s: 'box', p: [0, 0.36, 14.3], size: [20.6, 0.06, 4.1], key: MARBLE_D, uv: 1.75 });
        o.push({ s: 'box', p: [-9.9, 8.3, 16.62], size: [0.3, 0.28, 0.16], key: WHITE, n: 34, step: [0.6, 0, 0] });
        o.push({ s: 'cyl', p: [0, 10.6, 16.72], r: 0.8, h: 0.08, seg: 16, tint: 0x8fd6b8 });
        ['l', 'r'].forEach(fc => { o.push(bx(fc, w, d, -10.25, 1.1, 0.7, 9.4, 0.22, { key: WHITE, tint: 0xf4e6c8, n: 7, st: 3.42 }), trim(fc, w, d, 2.6, 1.75, 5.6, 6, { key: WHITE }), bx(fc, w, d, -8.775, 8.36, 0.5, 0.5, 0.2, { key: WHITE, n: 6, st: 3.51 })); });
        o.push(bx('b', w, d, -12, 1.1, 0.7, 9.4, 0.22, { key: WHITE, tint: 0xf4e6c8, n: 9, st: 3 }), pipe('b', w, d, -13.4, 10.5), pipe('b', w, d, 13.4, 10.5), wallAC('b', w, d, -6, 3.2), wallAC('b', w, d, 6, 3.2));
        o.push(cornice(28, 24.5, 9.9, 0.3, 0.35, WHITE, 0xffffff));
        /* the balustrade: a rail on a row of balusters round the roof slab */
        [['f', 29, 49], ['b', 29, 49], ['l', 25.5, 43], ['r', 25.5, 43]].forEach(q => { o.push(bx(q[0], 29.4, 25.9, 0, 12.0, q[1], 0.14, 0.3, { out: -0.45, key: WHITE }), bx(q[0], 29.4, 25.9, -q[1] / 2 + 0.3, 11.2, 0.16, 0.8, 0.16, { out: -0.38, key: WHITE, n: q[2], st: (q[1] - 0.6) / (q[2] - 1) })); });
        o.push({ s: 'cyl', p: [0, 14.55, 0], r: 6.6, h: 0.3, seg: 24, key: WHITE }, { s: 'cyl', p: [0, 12.3, 0], r: 6.5, h: 0.25, seg: 24, key: WHITE });
        o.push({ s: 'box', p: [0, 12.3, 0], size: [0.3, 2.3, 0.3], key: WHITE, ring: { n: 12, r: 6.4, a0: 15 } });
        o.push({ s: 'cyl', p: [0, 19.7, 0], r: 1.3, h: 0.2, seg: 12, key: WHITE }, { s: 'cyl', p: [0, 22.9, 0], r: 0.05, h: 1.6, seg: 5, tint: 0xdddddd });
        o.push(surround('f', w, d, -2.625, 1.75, 2.3, WHITE, 0xffffff), lamp('f', w, d, -4.6, 2.4), lamp('f', w, d, -0.65, 2.4));
        o.push({ s: 'box', p: [-10.9, 0, 15.4], size: [1.1, 1.1, 1.1], key: WHITE, n: 2, step: [21.8, 0, 0] }, { s: 'dome', p: [-10.9, 1.1, 15.4], r: 0.5, h: 0.7, seg: 8, rings: 3, tint: 0x8fd6b8, n: 2, step: [21.8, 0, 0] });
        o.push(acRow(-10.5, 12.3, -9, 3, 1.9, 0), acRow(7, 12.3, -9, 2, 1.9, 0), hatch(10.5, 12.3, 8), mat(0, 12.3, -9, 26, 1.2), mat(10.5, 12.3, 0, 1.2, 17), vent(-10.5, 12.3, 8), vent(-9.2, 12.3, 8), duct(9.5, 12.3, -4.5, 6, true));
        return o; };
    /* THE GALLERY: the name on the glass box's fascia, black mullions and a sill on it, a steel coping, a lit door reveal, a cube on a plinth by
       the door, a downpipe; the roof plant sits on the glass box (the roof itself is the roof walk) */
    X['P05-08-B1'] = () => { const w = 17.6, d = 14.1, o = [];
        o.push(signAt(3.2, 6.05, 8.83, 0, 5.4, 0.6, 'GALLERY', '#f4f4f4', ''));
        o.push({ s: 'box', p: [-0.8, 3.4, 8.82], size: [0.1, 3.4, 0.06], tint: DARKM, n: 6, step: [1.6, 0, 0] }, { s: 'box', p: [3.2, 3.32, 7.2], size: [8.2, 0.1, 3.4], tint: DARKM }, { s: 'box', p: [3.2, 6.8, 7.2], size: [8.2, 0.12, 3.4], tint: DARKM });
        o.push(bx('l', w, d, 0, 6.86, 14.3, 0.16, 0.12, { tint: STEEL }), bx('r', w, d, 0, 6.86, 14.3, 0.16, 0.12, { tint: STEEL }), bx('b', w, d, 0, 6.86, 17.8, 0.16, 0.12, { tint: STEEL }), bx('f', w, d, -4.9, 6.86, 7.9, 0.16, 0.12, { tint: STEEL }));
        o.push(bx('f', w, d, -3.4, 2.82, 7.4, 0.08, 0.3, { tint: LAMP, glow: 0.8 }), pipe('b', w, d, -8.2, 6.9, STEEL), pipe('b', w, d, 8.2, 6.9, STEEL), wallAC('b', w, d, 3, 2.6), wallAC('b', w, d, 4.4, 2.6));
        o.push({ s: 'box', p: [7.6, 0, 7.75], size: [1.0, 0.7, 1.0], key: MARBLE_D }, { s: 'box', p: [7.6, 0.7, 7.75], size: [0.7, 0.7, 0.7], tint: 0xff6a4a });
        o.push(ac(1.6, 6.92, 7.2, 0.8), ac(4.8, 6.92, 7.2, 0.8));
        return o; };
    /* THE ART SUPPLY SHOP: a painted name board over the awning, a brick plinth, sills and lintels, a shop door, gutters and downpipes, a
       chimney cap and pots, a brush-and-palette hanging sign, a ridge vent */
    X['P05-08-B2'] = () => { const w = 17.5, d = 14, o = [];
        o.push(sign('f', w, d, 0, 3.55, 9.5, 0.62, 'ART SUPPLIES', '#f2ead8', '#1e3a5a', { board: 0x16293f }));
        o.push(bx('f', w, d, 0, 0, 17.7, 0.5, 0.1, { key: T_RED, tint: 0xa87868 }), bx('l', w, d, 0, 0, 14.2, 0.5, 0.1, { key: T_RED, tint: 0xa87868 }), bx('r', w, d, 0, 0, 14.2, 0.5, 0.1, { key: T_RED, tint: 0xa87868 }));
        o.push(trim('f', w, d, 4.2, 1.5, 2, 5), trim('l', w, d, 4.2, 1.5, 2, 3), trim('r', w, d, 4.2, 1.5, 2, 3));
        o.push(gutter('f', w, d, 6.84, 18.4, 0x2a3a4a), gutter('b', w, d, 6.84, 18.4, 0x2a3a4a), pipe('f', w, d, -8.4, 6.9, 0x2a3a4a), pipe('f', w, d, 8.4, 6.9, 0x2a3a4a), pipe('b', w, d, 8.4, 6.9, 0x2a3a4a));
        o.push({ s: 'box', p: [5.5, 12.4, -3], size: [1.5, 0.2, 1.5], key: CONC }, { s: 'cyl', p: [5.2, 12.6, -3], r: 0.18, h: 0.5, seg: 8, tint: 0xb86a4a, n: 2, step: [0.6, 0, 0] });
        o.push({ s: 'box', p: [-8.2, 3.3, 8.2], size: [0.08, 0.08, 1.2], tint: DARKM }, { s: 'cyl', p: [-8.2, 2.3, 8.75], r: 0.45, h: 0.06, seg: 12, tint: 0xf2c14a }, vent(-4, 9.2, 0, 0.2), wallAC('b', w, d, -5, 2.6), wallAC('l', w, d, 4, 2.6));
        return o; };
    /* THE SCULPTORS' WORKSHOP: a name board, a steel frame and a lamp over the roller door, a hazard kerb, gutters at the sawtooth valleys,
       an extract stack and wall fans, a gantry beam with a hoist over the door */
    X['P05-08-B3'] = () => { const w = 17.5, d = 10.5, o = [];
        o.push(sign('f', w, d, 4.6, 4.6, 6.4, 0.6, 'SCULPTORS WORKSHOP', '#f4f4f4', '#27425e', { board: 0x1a2c40 }));
        o.push(bx('f', w, d, -5.85, 0, 0.25, 3.8, 0.14, { tint: STEEL }), bx('f', w, d, -1.15, 0, 0.25, 3.8, 0.14, { tint: STEEL }), bx('f', w, d, -3.5, 3.6, 4.95, 0.3, 0.2, { tint: 0xe8c020 }), lamp('f', w, d, -3.5, 4.1));
        o.push(bx('f', w, d, 0, 0, 17.7, 0.45, 0.1, { key: CONC }), bx('l', w, d, 0, 0, 10.7, 0.45, 0.1, { key: CONC }), bx('r', w, d, 0, 0, 10.7, 0.45, 0.1, { key: CONC }));
        o.push({ s: 'box', p: [-3.5, 5.0, 6.1], size: [0.25, 0.4, 1.9], tint: 0xe8c020 }, { s: 'box', p: [-3.5, 4.3, 6.8], size: [0.3, 0.7, 0.3], tint: DARKM });
        o.push(trim('f', w, d, 2.2, 2.6, 2.2, 2, { span: 4.2, c: 4.6, key: CONC }), pipe('f', w, d, 8.5, 5.6), pipe('b', w, d, -8.5, 5.6), pipe('b', w, d, 8.5, 5.6));
        o.push({ s: 'cyl', p: [6.8, 5.6, -3.6], r: 0.35, h: 4.2, seg: 10, tint: 0x8a9098 }, { s: 'cyl', p: [6.8, 9.8, -3.6], r: 0.55, r2: 0.3, h: 0.4, seg: 10, tint: 0x6a7078 });
        o.push({ s: 'cyl', p: [0, 3.6, -5.3], r: 0.55, h: 0.12, seg: 12, tint: DARKM, n: 2, step: [3, 0, 0] }, wallAC('r', w, d, 2, 2.4), wallAC('r', w, d, 3.4, 2.4));
        return o; };
    /* THE WRESTLING HALL: the marquee's letter board and its row of bulbs, poster cases by the doors, steps, a dentil course under the gilt band,
       gilt caps on the pilasters, pennants on the front towers, gilt ribs and a base ring on the big top, lamps down the side walls, the side
       walls' pilasters, downpipes; plant in the back corners of the roof terrace (off the roof walk's line) */
    X['P06-08-B1'] = () => { const w = 28.1, d = 28.1, RED = 0xe2473a, o = [];
        o.push(signAt(0, 3.45, 16.74, 0, 10.6, 1.0, 'WRESTLING TONIGHT', '#2a1410', '', 0));
        o.push(signAt(0, 4.5, 16.74, 0, 7, 0.62, 'THE BIG TOP ARENA', '#8a1c14', ''));
        o.push({ s: 'box', p: [-5.6, 3.02, 16.76], size: [0.16, 0.16, 0.1], tint: LAMP, glow: 1, n: 29, step: [0.4, 0, 0] }, { s: 'box', p: [-5.6, 5.36, 16.76], size: [0.16, 0.16, 0.1], tint: LAMP, glow: 1, n: 29, step: [0.4, 0, 0] });
        o.push({ s: 'box', p: [-6.1, 2.98, 15.4], size: [0.12, 0.1, 2.7], tint: LAMP, glow: 0.8, n: 2, step: [12.2, 0, 0] });
        [-9.2, -6.4, 6.4, 9.2].forEach((u, i) => o.push(bx('f', w, d, u, 0.9, 1.7, 2.3, 0.12, { key: GOLD, glow: 0.3, out: 0.5 }), bx('f', w, d, u, 1.02, 1.46, 2.06, 0.04, { tint: [0x2f5fd0, 0xd23a2a, 0x2f8f4a, 0xe8a020][i], out: 0.62 })));
        o.push({ s: 'box', p: [0, 0, 17.0], size: [11, 0.18, 0.7], key: MARBLE }, { s: 'quad', flat: true, p: [0, 0.03, 15.4], size: [11.6, 2.6], key: U('RubberNonSlip2a'), uv: 1.75, kind: 'over' });
        ['f', 'b', 'l', 'r'].forEach(fc => o.push(bx(fc, w, d, -13.6, 5.86, 0.34, 0.34, 0.2, { key: WHITE, tint: 0xfff6e0, n: 46, st: 0.6045, out: 0.2 })));
        ['l', 'r', 'b'].forEach(fc => o.push(bx(fc, w, d, -12.4, 0, 1.3, 7, 0.5, { key: GOLD, glow: 0.3, n: 8, st: 3.543 }), bx(fc, w, d, -10.63, 4.3, 0.4, 0.5, 0.3, { tint: LAMP, glow: 0.8, n: 7, st: 3.543 })));
        o.push(flag(-13, 12.4, 13, 2.6, RED), flag(13, 12.4, 13, 2.6, RED));
        o.push({ s: 'box', p: [0, 7.02, 0], size: [0.3, 4, 0.3], key: GOLD, glow: 0.3, ring: { n: 16, r: 9.08 } }, { s: 'cyl', p: [0, 7.0, 0], r: 9.5, h: 0.4, seg: 32, key: GOLD, glow: 0.3 });
        o.push(pipe('b', w, d, -13.6, 6.2), pipe('b', w, d, 13.6, 6.2));
        o.push(acRow(-11.6, 7.02, -12.2, 2, 2, 0), acRow(9.6, 7.02, -12.2, 2, 2, 0), hatch(-12, 7.02, -8.6), vent(12.2, 7.02, -9.4), vent(12.2, 7.02, -8.2));
        return o; };
    /* THE CLUBHOUSE: the name on the blue band, white frames round the big windows, a brick plinth, a scalloped valance and pennants on the
       canopy, the press box's antennae and its own AC, a clock on the gable end, downpipes */
    X['P07-08-B1'] = () => { const w = 28.1, d = 10.6, o = [];
        o.push(signAt(0, 5.25, 5.42, 0, 9, 0.62, 'CLUBHOUSE', '#f4f4f4', ''));
        o.push(trim('f', w, d, 0.3, 2.4, 2.4, 6, { span: 22 }), bx('f', w, d, -11, 0.3, 0.14, 2.4, 0.08, { key: WHITE, n: 6, st: 4.4, out: 0.02 }), trim('b', w, d, 4.0, 1.6, 1.8, 7));
        o.push(bx('b', w, d, 0, 0, 28.3, 0.6, 0.1, { key: CONC }), bx('l', w, d, 0, 0, 10.8, 0.6, 0.1, { key: CONC }), bx('r', w, d, 0, 0, 10.8, 0.6, 0.1, { key: CONC }));
        o.push({ s: 'box', p: [-12.6, 3.95, 9.1], size: [0.6, 0.36, 0.06], tint: 0xf4f4f4, n: 22, step: [1.2, 0, 0] }, { s: 'box', p: [-12, 3.95, 9.1], size: [0.6, 0.36, 0.06], tint: 0x3b62c4, n: 21, step: [1.2, 0, 0] });
        o.push({ s: 'cyl', p: [-14.1, 4.6, 0], r: 0.8, h: 0.1, seg: 16, tint: 0xf4f4f4, ry: 90 }, pipe('b', w, d, -13.8, 6.3), pipe('b', w, d, 13.8, 6.3), wallAC('b', w, d, -9, 2.2), wallAC('b', w, d, 9, 2.2));
        o.push({ s: 'cyl', p: [-3.6, 9.8, -3.1], r: 0.05, h: 2.4, seg: 5, tint: 0xdddddd, n: 2, step: [7.2, 0, 0] }, ac(2.6, 9.8, -3.3, 0.8), { s: 'box', p: [0, 9.8, -3.1], size: [9.3, 0.14, 3.7], tint: DARKM, sides: true, top: false, under: true });
        return o; };
    /* THE GROUNDSKEEPER'S HOUSE: green shutters and flower boxes, a porch rail, a door hood, a stone plinth, gutters and downpipes, chimney
       pots, a dormer on the front slope, a wall AC round the back */
    X['P07-08-B2'] = () => { const w = 21, d = 17.5, GRN = 0x2f6f4a, o = [];
        o.push(shutters('f', w, d, 0.9, 1.5, 1.7, 4, GRN, { span: 15 }), shutters('f', w, d, 3.9, 1.5, 1.7, 5, GRN), shutters('l', w, d, 3.9, 1.5, 1.7, 4, GRN), shutters('r', w, d, 3.9, 1.5, 1.7, 4, GRN));
        o.push(bx('f', w, d, -7.5, 0.62, 1.7, 0.26, 0.3, { tint: 0x8a5a3a, n: 4, st: 5 }), bx('f', w, d, -7.5, 0.88, 1.5, 0.2, 0.24, { tint: 0xd24a6a, n: 4, st: 5 }));
        o.push(trim('f', w, d, 3.9, 1.5, 1.7, 5), bx('f', w, d, 0, 0, 21.2, 0.5, 0.1, { key: CONC }), bx('l', w, d, 0, 0, 17.7, 0.5, 0.1, { key: CONC }), bx('r', w, d, 0, 0, 17.7, 0.5, 0.1, { key: CONC }));
        o.push({ s: 'box', p: [-5.25, 0.85, 12.05], size: [3.4, 0.08, 0.08], key: WHITE, n: 4, step: [3.5, 0, 0] }, { s: 'box', p: [-6.4, 0, 12.05], size: [0.07, 0.85, 0.07], key: WHITE, n: 12, step: [1.166, 0, 0] });
        o.push(gutter('f', w, d, 6.3, 22.4, 0x5a3a2a), gutter('b', w, d, 6.3, 22.4, 0x5a3a2a), pipe('f', w, d, -10.2, 6.3, 0x5a3a2a), pipe('f', w, d, 10.2, 6.3, 0x5a3a2a), pipe('b', w, d, 10.2, 6.3, 0x5a3a2a), wallAC('b', w, d, 4, 1.4));
        o.push({ s: 'box', p: [-6, 11.6, -3], size: [1.6, 0.2, 1.6], key: CONC }, { s: 'cyl', p: [-6.3, 11.8, -3], r: 0.18, h: 0.5, seg: 8, tint: 0xb86a4a, n: 2, step: [0.6, 0, 0] });
        o.push({ s: 'box', p: [4, 6.6, 5.4], size: [2.2, 1.7, 2.6], key: STUCCO, tint: 0xfff2cf }, { s: 'roof', form: 'gable', ry: 90, p: [4, 8.3, 5.4], size: [2.6, 1.1, 2.6], over: 0.2, key: T_RED, tint: 0xe08a5c }, { s: 'quad', p: [4, 6.9, 6.72], size: [1.3, 1.2], key: G_RES, uv: 'fit' });
        return o; };
    /* THE STADIUM: the scoreboard's lettering, the name over the press box and on the back walls, aisles and a front rail on each stand,
       pilasters and gate signs on the back walls, pennants along the tops, dugouts on the sidelines, lamp heads on the masts, AC on the press box */
    X['stadium'] = () => { const o = [];
        o.push(signAt(-39.72, 9.3, 0, -90, 11.6, 1.2, 'HOME  14      VISITORS  10', '#ffb020', '#14161a', 0.9), signAt(-39.72, 7.2, 0, -90, 11.6, 1.0, 'QTR 3     08:42', '#ffe2a0', '#14161a', 0.9));
        o.push({ s: 'box', p: [-40.25, 11.5, 0], size: [1.2, 0.3, 14.4], tint: 0x444a52 }, signAt(-40.77, 8.2, 0, 90, 10, 1.6, 'CITY STADIUM', '#f4f4f4', '#1b1e24'));
        [-1, 1].forEach(dir => {
            for (let k = 0; k < 8; k++) o.push({ s: 'box', p: [-23.3, 1.2 + k * 0.85, dir * (21.8 + k * 1.6)], size: [1.2, 0.03, 1.6], key: RUB_Y, uv: 1.2, n: 3, step: [23.3, 0, 0] });
            o.push({ s: 'box', p: [0, 2.1, dir * 21.05], size: [70, 0.08, 0.08], tint: 0xdddddd }, { s: 'box', p: [-34.9, 1.2, dir * 21.05], size: [0.08, 0.9, 0.08], tint: 0xdddddd, n: 21, step: [3.49, 0, 0] });
            o.push({ s: 'box', p: [0, 0, dir * 35.06], size: [70.2, 1.1, 0.12], key: CONC }, { s: 'box', p: [0, 0, dir * 21.0], size: [70, 1.2, 0.06], key: PAVE, uv: 1.75 });
            o.push({ s: 'box', p: [-35, 0, dir * 35.1], size: [1.0, 9.6, 0.3], key: T_RED, tint: 0xb07a68, n: 11, step: [7, 0, 0] });
            o.push({ s: 'cyl', p: [-31.5, 10.2, dir * 34.4], r: 0.06, h: 2.2, seg: 5, tint: 0xdddddd, n: 10, step: [7, 0, 0] });
            for (let i = 0; i < 10; i++) o.push({ s: 'quad', p: [-31.5 + i * 7 + 0.55, 11.6, dir * 34.4], size: [1.1, 0.7], tint: i % 2 ? 0x3b62c4 : 0xf4f4f4, ds: true });
            o.push(signAt(dir > 0 ? 0 : 0, 6.6, dir * 35.27, dir > 0 ? 0 : 180, 16, 1.4, 'CITY STADIUM', '#f4f4f4', '#3b62c4'));
            [-21, 21].forEach((x, i) => o.push(signAt(x, 3.0, dir * 35.27, dir > 0 ? 0 : 180, 4.2, 0.6, dir > 0 ? (i ? 'GATE B' : 'GATE A') : (i ? 'GATE C' : 'GATE D'), '#1b1e24', '#f2ead8')));
            /* a dugout on the sideline: a low roof on posts over the bench, on the lines between squares */
            [-14, 0, 14].forEach(x => o.push({ s: 'roof', form: 'shed', ry: dir > 0 ? 0 : 180, p: [x, 2.1, dir * 20.3], size: [5, 0.5, 1.6], key: dir > 0 ? M_RED : M_BLUE, under: true, ds: true, uv: 2 }, { s: 'box', p: [x - 2.4, 0, dir * 21], size: [0.1, 2.5, 0.1], tint: 0xdddddd, n: 2, step: [4.8, 0, 0] }));
        });
        o.push(signAt(0, 9.95, 30.35, 180, 9, 0.6, 'PRESS', '#f4f4f4', ''), acRow(-8, 10.8, 32.6, 3, 2, 0), { s: 'cyl', p: [8, 10.8, 32.6], r: 0.05, h: 3, seg: 5, tint: 0xdddddd }, { s: 'dome', p: [5, 10.8, 32.6], r: 0.7, h: 0.5, seg: 10, rings: 3, tint: 0xdddddd });
        o.push(signAt(-12.25, 2.85, 35.27, 0, 6, 0.6, 'LOCKER ROOMS', '#1b1e24', '#f2ead8'), lamp('f', 70, 70.06, -12.25, 3.6), lamp('f', 70, 70.06, 12.25, 3.6));
        o.push({ s: 'box', p: [0, 10.3, -25.1], size: [70, 0.5, 0.2], tint: 0x27408a }, { s: 'box', p: [-33, 10.2, -30], size: [0.3, 0.3, 10], key: TRUSS, uv: [0.6, 1.1], n: 7, step: [11, 0, 0] });
        [[-40.25, -26.25], [40.25, -26.25], [-40.25, 26.25], [40.25, 26.25]].forEach(q => o.push({ s: 'box', p: [q[0], 16.3, q[1]], size: [1.6, 0.12, 1.6], tint: STEEL }, { s: 'box', p: [q[0], 0, q[1]], size: [1.1, 0.5, 1.1], key: CONC }, { s: 'box', p: [q[0] - 1.35, 17.25, q[1] + 0.27], size: [0.7, 0.5, 0.06], tint: 0xffffff, glow: 1, n: 4, step: [0.9, 0, 0] }, { s: 'box', p: [q[0] - 1.35, 18.0, q[1] + 0.27], size: [0.7, 0.5, 0.06], tint: 0xffffff, glow: 1, n: 4, step: [0.9, 0, 0] }));
        return o; };
    /* THE ARENA LOADING DOCK: dock numbers over the roller doors, steel door frames and rubber bumpers, the name board, cage lamps, a wall
       ladder to the roof, a pipe run, louvres; a second tank's worth of plant stays by the first (the roof is the roof walk) */
    X['P06-09-B1'] = () => { const w = 24.6, d = 10.6, o = [];
        [-7.5, 0, 7.5].forEach((u, i) => o.push(sign('f', w, d, u, 4.75, 1.0, 0.7, String(i + 1), '#14161a', '#f2cf4a', { out: 0.02 }), bx('f', w, d, u - 2.45, 1.3, 0.25, 3.5, 0.12, { tint: STEEL }), bx('f', w, d, u + 2.45, 1.3, 0.25, 3.5, 0.12, { tint: STEEL }), bx('f', w, d, u - 1.6, 0.75, 0.5, 0.5, 0.22, { key: RUBBER, uv: 0.5, n: 2, st: 3.2 }), lamp('f', w, d, u + 3.1, 4.0)));
        o.push(sign('f', w, d, 0, 5.95, 9, 0.6, 'ARENA DELIVERIES', '#f2cf4a', '#2a2e34', { out: 0.02 }));
        o.push(bx('b', w, d, 11, 0.4, 0.5, 6.9, 0.08, { tint: 0x9aa0a8 }), bx('b', w, d, 11, 0.6, 0.6, 0.06, 0.12, { tint: 0x9aa0a8, n: 1 }));
        for (let i = 0; i < 16; i++) o.push(bx('b', w, d, 11, 0.6 + i * 0.42, 0.6, 0.05, 0.14, { tint: 0x9aa0a8 }));
        o.push(bx('b', w, d, -4, 4.6, 14, 0.22, 0.22, { tint: 0x8a5a3a }), bx('l', w, d, 0, 2.2, 2.4, 1.6, 0.1, { key: GRILL, uv: [1.2, 0.8] }), bx('r', w, d, 0, 2.2, 2.4, 1.6, 0.1, { key: GRILL, uv: [1.2, 0.8] }));
        o.push(pipe('b', w, d, -12, 6.9), pipe('l', w, d, 5, 6.9), ac(8, 7, -4.6, 0.8), vent(5.4, 7, -4.4), { s: 'box', p: [-7, 8.3, -3.4], size: [1.2, 0.7, 1.2], tint: 0x7a8088 });
        return o; };
    /* THE BOX OFFICE: the name over the awning, counters and frames at the ticket windows, poster cases, gilt bands and a ball finial on the
       turret, a tile plinth, the sign fin's lettering, roof plant behind the parapet */
    X['P06-09-B2'] = () => { const w = 17.5, d = 17.5, o = [];
        o.push(sign('f', w, d, -3, 4.2, 8, 0.8, 'BOX OFFICE', '#f4f4f4', '#2f5fd0', { board: 0x1e3a8a }));
        o.push(trim('f', w, d, 1.0, 1.6, 1.6, 4, { span: 8.6, c: -3 }), bx('f', w, d, -3, 0.82, 11, 0.1, 0.45, { key: WHITE }));
        o.push(bx('r', w, d, -3, 0.9, 1.7, 2.4, 0.1, { tint: 0x1e3a8a, n: 3, st: 3 }), bx('r', w, d, -3, 1.02, 1.46, 2.16, 0.04, { tint: 0xe8a020, n: 3, st: 3, out: 0.1 }), bx('l', w, d, -3, 0.9, 1.7, 2.4, 0.1, { tint: 0x1e3a8a, n: 3, st: 3 }), bx('l', w, d, -3, 1.02, 1.46, 2.16, 0.04, { tint: 0xd23a2a, n: 3, st: 3, out: 0.1 }));
        o.push({ s: 'cyl', p: [7.9, 3.2, 7.9], r: 2.38, h: 0.3, seg: 20, key: GOLD, glow: 0.3 }, { s: 'cyl', p: [7.9, 7.9, 7.9], r: 2.42, h: 0.3, seg: 20, key: GOLD, glow: 0.3 }, { s: 'dome', p: [7.9, 11.6, 7.9], r: 0.4, seg: 8, rings: 4, key: GOLD, glow: 0.3 });
        o.push(bx('f', w, d, -1, 0, 15.6, 0.5, 0.08, { key: T_BLUE, tint: 0x6f90c8 }), bx('l', w, d, 0, 0, 17.6, 0.5, 0.08, { key: T_BLUE, tint: 0x6f90c8 }), bx('r', w, d, -1, 0, 15.6, 0.5, 0.08, { key: T_BLUE, tint: 0x6f90c8 }));
        o.push(signAt(-8.24, 6.6, 9.2, 90, 0.85, 2.6, 'T', '#f4f4f4', ''), signAt(-8.76, 6.6, 9.2, -90, 0.85, 2.6, 'T', '#f4f4f4', ''));
        o.push(coping(18.1, 18.1, 6.2, WHITE), acRow(-6.5, 6.2, -6, 2, 2, 0), mat(-1, 6.2, -4.2, 13, 1.1), vent(-2, 6.2, -6.5), hatch(2, 6.2, -6), duct(-5.5, 6.2, -2.5, 4, true), pipe('b', w, d, -8.5, 5.6), pipe('b', w, d, 8.5, 5.6));
        return o; };
    /* THE SPORTS CLINIC: the name in teal on the white wall, steel mullions on the glass corner and the ribbon, a steel coping, the cross
       pylon's name, a lit canopy edge, downpipes, louvres; plant on the glass corner's own roof */
    X['P07-09-B1'] = () => { const w = 28.1, d = 28.1, o = [];
        o.push(signAt(-4.5, 5.75, 14.1, 0, 9, 0.8, 'SPORTS CLINIC', '#1f8f80', ''));
        o.push({ s: 'box', p: [14, 0, 14], size: [0.12, 7.4, 0.1], tint: STEEL, ring: { n: 24, r: 4.93 } }, { s: 'cyl', p: [14, 7.4, 14], r: 5.0, h: 0.14, seg: 24, tint: STEEL }, { s: 'cyl', p: [14, 0, 14], r: 5.0, h: 0.35, seg: 24, key: MARBLE });
        ['f', 'b', 'l', 'r'].forEach(fc => o.push(bx(fc, w, d, -12.6, 3.9, 0.1, 1.7, 0.08, { tint: STEEL, n: 15, st: 1.8, out: 0.08 }), bx(fc, w, d, 0, 6.86, 28.3, 0.16, 0.12, { tint: STEEL })));
        o.push({ s: 'cyl', p: [3.5, 2.86, 17.2], r: 4.24, h: 0.06, seg: 24, tint: LAMP, glow: 0.7 }, signAt(-11.92, 4.6, 15.75, -90, 1.9, 0.45, 'CLINIC', '#1f8f80', ''), signAt(-12.58, 4.6, 15.75, 90, 1.9, 0.45, 'CLINIC', '#1f8f80', ''));
        o.push(pipe('b', w, d, -13.9, 6.9, 0xc8ccd0), pipe('b', w, d, 13.9, 6.9, 0xc8ccd0), bx('b', w, d, -6, 1.6, 2.4, 1.6, 0.1, { key: GRILL, uv: [1.2, 0.8], n: 3, st: 6 }));
        o.push(ac(13, 7.54, 13, 0.9), ac(15.4, 7.54, 14.6, 0.9), vent(14.4, 7.54, 16.6));
        return o; };
    /* THE TRAINING GYM: the name painted on the brick gable, stone sills and lintels on the factory windows, stone caps on the buttresses, a
       stone door surround with lamps and the canopy's hangers, ridge ventilators along the bow roof, gutters and downpipes at every other
       buttress, wall AC units and an extract fan on the back */
    X['P06-10-B1'] = () => { const w = 28, d = 28, f = row('P06-10-B1'), hx = -14 + (f.door - 0.5) * 1.75, o = [];
        o.push(signAt(0, 10.35, 14.05, 0, 13, 1.1, 'TRAINING GYM', '#f2ead8', ''), signAt(0, 5.44, 14.17, 0, 12, 0.56, 'BOXING   WEIGHTS   WRESTLING', '#f2ead8', ''));
        ['l', 'r'].forEach(fc => o.push(trim(fc, w, d, 2.2, 2.2, 3.8, 7, { span: 21, key: CONC }), bx(fc, w, d, -12.25, 7, 1.5, 0.25, 1.0, { key: CONC, n: 8, st: 3.5 }), gutter(fc, w, d, 6.7, 29, DARKM), pipe(fc, w, d, -10.5, 6.7), pipe(fc, w, d, 3.5, 6.7)));
        o.push(trim('f', w, d, 2.6, 2.2, 3.4, 4, { span: 21, key: CONC }), surround('f', w, d, hx, 1.75, 2.3, CONC), lamp('f', w, d, hx - 1.9, 2.5), lamp('f', w, d, hx + 1.9, 2.5));
        o.push({ s: 'cyl', p: [hx - 2.7, 2.95, 16.4], r: 0.03, h: 2.3, seg: 4, tint: DARKM, n: 2, step: [5.4, 0, 0] });
        o.push({ s: 'cyl', p: [0, 12.1, -9], r: 0.55, h: 0.7, seg: 10, tint: 0x6f8f6a, n: 4, step: [0, 0, 6] }, { s: 'cyl', p: [0, 12.8, -9], r: 0.85, r2: 0.2, h: 0.45, seg: 10, tint: 0x5a7a56, n: 4, step: [0, 0, 6] });
        o.push(wallAC('b', w, d, -8, 2.4), wallAC('b', w, d, -6.6, 2.4), wallAC('b', w, d, 7, 2.4), { s: 'cyl', p: [0, 4.4, -14.1], r: 0.9, h: 0.14, seg: 14, tint: DARKM }, bx('b', w, d, 0, 0, 28.2, 1.2, 0.12, { key: CONC }));
        return o; };
    /* THE BAND SHELL: tonight's banner on the lighting rig, speaker stacks either side of the stage, a row of footlights, stage steps, gilt
       ribs on the shell, a lamp over the stage door, a coping, plant on the backstage roof */
    X['P07-10-B1'] = () => { const w = 28, d = 10.5, o = [];
        o.push(signAt(4, 8.75, 6.72, 0, 11, 0.9, 'LIVE TONIGHT', '#f2ead8', '#8a1c14', 0.4));
        o.push({ s: 'box', p: [-4.2, 0.9, 4.4], size: [1.3, 2.6, 1.1], tint: 0x16181c, n: 2, step: [16.4, 0, 0] }, { s: 'cyl', p: [-4.2, 2.6, 4.97], r: 0.4, h: 0.04, seg: 10, tint: 0x3a3f46, n: 2, step: [16.4, 0, 0] });
        o.push({ s: 'box', p: [-3.5, 0.9, 5.05], size: [0.3, 0.16, 0.2], tint: LAMP, glow: 1, n: 16, step: [1, 0, 0] });
        o.push({ s: 'box', p: [-5.6, 0, 4.6], size: [1.0, 0.3, 1.0], key: CONC }, { s: 'box', p: [-5.4, 0.3, 4.4], size: [0.6, 0.3, 0.8], key: CONC }, { s: 'box', p: [13.5, 0, 5.5], size: [1, 0.3, 0.5], key: CONC });
        for (let i = 0; i < 7; i++) o.push({ s: 'dome', p: [4, 0.92, 5.2], r: 9.03, h: 5.42, rz: 5.03, arc: 2, a0: 195 + i * 25, seg: 2, rings: 8, key: GOLD, glow: 0.3, ds: true });
        o.push(lamp('f', w, d, -11.375, 2.6), sign('f', w, d, -11.375, 3.2, 2.6, 0.4, 'STAGE DOOR', '#f2ead8', '#2a2e34'));
        o.push(coping(28.4, 10.9, 7.5, DARK, 0x6a7080), acRow(-11, 7.5, -3, 3, 2, 0), mat(0, 7.5, -1.2, 25, 1.1), duct(-2, 7.5, -3.6, 9), vent(6, 7.5, -3.4), vent(7.4, 7.5, -3.4), hatch(11.5, 7.5, -2.6), pipe('b', w, d, -13.6, 7), pipe('b', w, d, 13.6, 7));
        return o; };
    /* THE STAGE DOOR HOUSE: stone sills and lintels, a gabled door hood on brackets with a lamp and a brass plate, a stone plinth and a string
       course, bargeboards, a chimney with pots, gutters and downpipes, a wall AC round the back */
    X['P07-10-B2'] = () => { const w = 17.5, d = 17.5, o = [];
        o.push(trim('f', w, d, 1.0, 1.5, 1.9, 3, { span: 9, c: 2.5, key: CONC }), trim('f', w, d, 4.6, 1.5, 1.9, 5, { key: CONC }), trim('l', w, d, 4.6, 1.5, 1.9, 4, { key: CONC }), trim('r', w, d, 4.6, 1.5, 1.9, 4, { key: CONC }));
        o.push({ s: 'roof', form: 'gable', p: [-6, 2.75, 9.15], size: [2.2, 0.7, 0.8], over: 0.1, key: DARK, tint: 0x6a6f7c }, bx('f', w, d, -6.9, 2.3, 0.12, 0.45, 0.7, { tint: DARKM, n: 2, st: 1.8 }), lamp('f', w, d, -4.7, 2.0), bx('f', w, d, -7.3, 1.3, 0.5, 0.34, 0.04, { key: GOLD, glow: 0.3 }), bx('f', w, d, -6, 0, 2, 0.17, 0.6, { key: CONC }));
        o.push(bx('f', w, d, 0, 0, 17.7, 0.6, 0.1, { key: CONC }), bx('l', w, d, 0, 0, 17.7, 0.6, 0.1, { key: CONC }), bx('r', w, d, 0, 0, 17.7, 0.6, 0.1, { key: CONC }), bx('f', w, d, 0, 3.7, 17.7, 0.22, 0.1, { key: CONC }), bx('f', w, d, 0, 8.3, 17.7, 0.22, 0.1, { key: CONC }));
        o.push({ s: 'box', p: [5, 8.4, -4], size: [1.3, 5.6, 1.3], key: T_OCHRE, tint: 0xc0a078 }, { s: 'box', p: [5, 14, -4], size: [1.6, 0.2, 1.6], key: CONC }, { s: 'cyl', p: [4.7, 14.2, -4], r: 0.18, h: 0.5, seg: 8, tint: 0xb86a4a, n: 2, step: [0.6, 0, 0] });
        o.push(gutter('l', w, d, 8.2, 18.4), gutter('r', w, d, 8.2, 18.4), pipe('l', w, d, 8.4, 8.2), pipe('r', w, d, -8.4, 8.2), wallAC('b', w, d, 4, 1.8), wallAC('b', w, d, -3, 5.2));
        return o; };
    /* THE STADIUM GATE: the name on the arch, lanterns on the piers, ball finials */
    X['P04-11-gate'] = () => [signAt(0, 4.25, 0.47, 0, 7.4, 0.42, 'CITY STADIUM', '#f2ead8', ''), signAt(0, 4.25, -0.47, 180, 7.4, 0.42, 'CITY STADIUM', '#f2ead8', ''),
        { s: 'box', p: [-5.25, 3.2, 1.2], size: [0.4, 0.55, 0.4], tint: LAMP, glow: 0.9, n: 2, step: [10.5, 0, 0] }, { s: 'box', p: [-5.25, 3.75, 1.2], size: [0.52, 0.1, 0.52], tint: DARKM, n: 2, step: [10.5, 0, 0] },
        { s: 'dome', p: [-5.25, 6.7, 0], r: 0.35, seg: 8, rings: 4, key: GOLD, glow: 0.3, n: 2, step: [10.5, 0, 0] }, { s: 'box', p: [-5.25, 0, 0], size: [2.5, 0.5, 2.5], key: CONC, n: 2, step: [10.5, 0, 0] }];
    /* THE STALLS: a name board on each stall, crates and sacks on the counters */
    X['P05-11-stalls'] = () => { const o = []; [['FRUIT', -5.25, '#d23a2a'], ['FISH', -1.75, '#2f5fd0'], ['BREAD', 1.75, '#b87a10'], ['FLOWERS', 5.25, '#2f8f4a']].forEach((q, i) => {
        o.push(signAt(q[1], 2.45, 1.32, 0, 2.6, 0.42, q[0], '#f2ead8', q[2]), { s: 'box', p: [q[1] - 0.9, 0.95, 0.6], size: [0.6, 0.3, 0.5], tint: 0x8a5a3a, n: 3, step: [0.9, 0, 0] }, { s: 'box', p: [q[1] - 0.9, 1.25, 0.6], size: [0.5, 0.14, 0.4], tint: [0xe8a020, 0x9ab8c8, 0xd8b070, 0xd24a8a][i], n: 3, step: [0.9, 0, 0] }, { s: 'box', p: [q[1] + 1.1, 0, -0.6], size: [0.7, 0.6, 0.7], tint: 0x8a5a3a }); }); return o; };
    /* THE FOOD KIOSK: the word on every other side, a serving shelf, a menu board, a lamp ring under the roof, a vent on the cap */
    X['P05-11-B2'] = () => [{ s: 'quad', p: [0, 2.68, 0], size: [2.6, 0.44], key: 'txt:HOT FOOD|#f2ead8||5.91', uv: 'fit', tint: 0xffffff, kind: 'over', ring: { n: 3, r: 2.96, a0: 30 } }, { s: 'quad', p: [0, 2.68, 0], size: [2.6, 0.44], key: 'txt:DRINKS|#f2ead8||5.91', uv: 'fit', tint: 0xffffff, kind: 'over', ring: { n: 3, r: 2.96, a0: 90 } },
        { s: 'cyl', p: [0, 1.06, 0], r: 3.7, h: 0.1, seg: 6, key: WHITE }, { s: 'cyl', p: [0, 3.14, 0], r: 3.5, h: 0.06, seg: 6, tint: LAMP, glow: 0.8 }, { s: 'cyl', p: [0, 0, 0], r: 3.5, h: 0.3, seg: 6, key: CONC }, vent(1, 4.6, 0.4, 0.18)];
    /* THE EQUIPMENT DEPOT: the name over the canopy, bay numbers, steel frames on the roller doors, a door surround and lamp, a coping,
       downpipes, the roof's AC row, ducts and vents, a stand under the ball */
    X['P06-11-B1'] = () => { const w = 31.5, d = 10.5, f = row('P06-11-B1'), hx = -f.w / 2 + (f.door - 0.5) * 1.75, o = [];
        o.push(signAt(2, 4.62, 5.5, 0, 12, 0.46, 'EQUIPMENT DEPOT', '#f4f4f4', '#2a2e34'));
        [[-11, 'A'], [4.6, 'B'], [11, 'C']].forEach(q => o.push(bx('f', w, d, q[0] - 2.33, 0, 0.25, 3.6, 0.1, { tint: STEEL }), bx('f', w, d, q[0] + 2.33, 0, 0.25, 3.6, 0.1, { tint: STEEL }), sign('f', w, d, q[0] + 2.9, 2.0, 0.6, 0.6, q[1], '#14161a', '#f2ead8', { out: 0.02 })));
        o.push(surround('f', w, d, hx, 1.75, 2.3, CONC), lamp('f', w, d, hx + 1.6, 2.5), bx('f', w, d, 0, 0, 31.7, 0.4, 0.06, { key: CONC }));
        o.push(coping(31.9, 10.9, 5.1, DARK, 0x6a7080), acRow(-2, 5.1, -2.5, 4, 2, 0), mat(2, 5.1, -0.6, 22, 1.1), duct(9.5, 5.1, -2.6, 7), vent(13.6, 5.1, 2, 0.22), vent(13.6, 5.1, 0.8, 0.22), hatch(7, 5.1, 2), pipe('b', w, d, -15.4, 4.6), pipe('b', w, d, 15.4, 4.6), pipe('l', w, d, 4.5, 4.6));
        o.push({ s: 'box', p: [-11.5, 5.1, 0], size: [3.2, 0.2, 3.2], tint: STEEL });
        return o; };
    /* THE RENTAL KIOSK: the word round the canopy edge, sills at the hatches, a tile plinth, a lamp ring */
    X['P06-11-B2'] = () => [{ s: 'quad', p: [0, 3.0, 0], size: [3.2, 0.5], key: 'txt:RENTALS|#f4f4f4||6.4', uv: 'fit', tint: 0xffffff, kind: 'over', ring: { n: 4, r: 4.42, a0: 45 } },
        { s: 'cyl', p: [0, 0.98, 0], r: 3.36, h: 0.12, seg: 20, key: WHITE }, { s: 'cyl', p: [0, 0, 0], r: 3.3, h: 0.4, seg: 20, key: T_BLUE, tint: 0x6f90c8 }, { s: 'cyl', p: [0, 2.94, 0], r: 3.3, h: 0.06, seg: 20, tint: LAMP, glow: 0.8 }, vent(0, 4.35, 0, 0.3)];
    /* THE SOUTH GATEHOUSE: the name over the arch and on the hall, clock faces and string courses on the towers, window surrounds, a keystone,
       a canopy fascia with bay numbers, a stone plinth, lamps, the hall roof's plant behind a coping */
    X['P07-11-B1'] = () => { const w = 31.5, d = 10.5, f = row('P07-11-B1'), hx = -f.w / 2 + (f.door - 0.5) * 1.75, o = [];
        o.push(signAt(10, 6.6, 6.22, 0, 6.6, 0.7, 'SOUTH GATE', '#3a3428', ''), sign('f', w, d, -4.4, 4.35, 9, 0.6, 'TICKETS', '#f4f4f4', '#3b62c4', { out: 0.02 }));
        [-13.5, 13.5].forEach(x => { o.push({ s: 'cyl', p: [x, 8.6, 5.52], r: 0.85, h: 0.08, seg: 16, tint: 0xf4f4f4, ry: 0 }, { s: 'box', p: [x, 5.4, 3.2], size: [4.8, 0.25, 4.8], top: false, under: true, key: WHITE }, { s: 'box', p: [x, 10.2, 3.2], size: [4.9, 0.3, 4.9], top: false, under: true, key: WHITE }, { s: 'box', p: [x, 0, 3.2], size: [4.8, 0.6, 4.8], top: false, key: CONC });
            o.push({ s: 'box', p: [x, 6.06, 5.56], size: [1.8, 0.14, 0.14], key: WHITE }, { s: 'box', p: [x, 8.8, 5.56], size: [1.74, 0.16, 0.1], key: WHITE }); });
        o.push({ s: 'box', p: [10, 9.3, 5.6], size: [1.0, 0.9, 1.3], key: WHITE }, { s: 'box', p: [-4.4, 3.28, 8.72], size: [13.6, 0.3, 0.06], tint: 0x27408a });
        o.push(trim('f', w, d, 1.0, 1.5, 1.6, 3, { span: 5.4, c: -7.4 }), bx('f', w, d, -7.4, 0.86, 7.4, 0.1, 0.4, { key: WHITE }), surround('f', w, d, hx, 1.75, 2.3, WHITE), lamp('f', w, d, hx + 1.7, 2.5), bx('f', w, d, -2, 0, 18, 0.5, 0.06, { key: CONC }));
        o.push(coping(31.9, 10.9, 5.8, WHITE), acRow(-6, 5.8, -3, 3, 2, 0), mat(0, 5.8, -1.2, 20, 1.1), duct(3, 5.8, -3.2, 6), vent(-9, 5.8, -3, 0.22), hatch(7.5, 5.8, -2.6), pipe('b', w, d, -15.4, 5.2), pipe('b', w, d, 15.4, 5.2));
        return o; };
    /* THE GATE LODGE: green shutters, sills, a door with a hood and a lamp, a stone plinth, gutters and downpipes, a chimney with a pot */
    X['P07-11-B2'] = () => { const f = row('P07-11-B2'), w = f.w, d = f.d, GRN = 0x2f6f4a, o = [];
        o.push(shutters('f', w, d, 1.0, 1.4, 1.6, 2, GRN, { span: 5 }), shutters('l', w, d, 1.0, 1.4, 1.6, 4, GRN), shutters('r', w, d, 1.0, 1.4, 1.6, 4, GRN), trim('f', w, d, 1.0, 1.4, 1.6, 2, { span: 5 }), trim('l', w, d, 1.0, 1.4, 1.6, 4), trim('r', w, d, 1.0, 1.4, 1.6, 4));
        o.push(bx('f', w, d, 0, 0, 1.2, 2.3, 0.06, { tint: GRN }), bx('f', w, d, 0, 2.4, 2, 0.14, 0.7, { key: GREENP, tint: 0x8fd6b8 }), lamp('f', w, d, 1.1, 1.9), bx('f', w, d, 0, 0, w + 0.2, 0.4, 0.08, { key: CONC }), bx('l', w, d, 0, 0, d + 0.2, 0.4, 0.08, { key: CONC }), bx('r', w, d, 0, 0, d + 0.2, 0.4, 0.08, { key: CONC }));
        o.push(gutter('f', w, d, 3.5, w + 1.9, 0x3a4a40), gutter('b', w, d, 3.5, w + 1.9, 0x3a4a40), pipe('f', w, d, w / 2 - 0.3, 3.5, 0x3a4a40), pipe('b', w, d, w / 2 - 0.3, 3.5, 0x3a4a40), wallAC('b', w, d, 0, 1.2));
        o.push({ s: 'box', p: [w / 4, 3.6, -d / 4], size: [1.0, 3.6, 1.0], key: STUCCO, tint: 0xe6dcc8 }, { s: 'box', p: [w / 4, 7.2, -d / 4], size: [1.25, 0.16, 1.25], key: CONC }, { s: 'cyl', p: [w / 4, 7.36, -d / 4], r: 0.18, h: 0.45, seg: 8, tint: 0xb86a4a });
        return o; };

    const cellOf = v => Math.floor((v + ctx.HALF) / ctx.C);
    const prop = (key, x, z, face) => { take(cellOf(x), cellOf(z)); props.push({ key, x: r3(x), z: r3(z), face }); };

    /* ── P04-08 · THE MUSEUM: limestone, a six-column portico and pediment, a verdigris dome and lantern, tall windows, red banners. WALK-IN. ── */
    { const f = walkin('P04-08-B1', 3), LIME = 0xfff0d6, VERD = 0xa8ecd2, hx = -14 + (f.door - 0.5) * 1.75;
      B('P04-08-B1', f.x, f.z, f.rot, [
        walls(28, 10.5, 24.5, WHITE, LIME, { door: [hx, 1.74, 2.2] }),
        { s: 'box', p: [0, 0, 0], size: [28.3, 1.1, 24.8], faces: 'blr', top: false, key: MARBLE, uv: 1.75 },
        slab(29.4, 25.9, 10.5, 0.7, WHITE, 0xffffff, ROOFC),
        { s: 'box', p: [0, 11.2, 0], size: [28, 1.1, 24.5], key: WHITE, tint: LIME, keyTop: ROOFC, uv: 3.5 },
        { s: 'cyl', p: [-8.75, 0.4, 15.4], r: 0.6, r2: 0.52, h: 7.8, seg: 12, key: WHITE, n: 6, step: [3.5, 0, 0], uv: [1.75, 7.8] },
        { s: 'box', p: [-8.75, 0, 15.4], size: [1.6, 0.4, 1.6], key: WHITE, n: 6, step: [3.5, 0, 0] },
        { s: 'box', p: [-8.75, 8.2, 15.4], size: [1.6, 0.4, 1.6], key: WHITE, n: 6, step: [3.5, 0, 0], under: true },
        { s: 'box', p: [0, 8.6, 14.4], size: [20.6, 1.3, 4.3], under: true, key: WHITE },
        { s: 'roof', form: 'gable', ry: 90, p: [0, 9.9, 14.4], size: [4.3, 2.9, 20.6], over: 0.3, key: GREENP, tint: VERD, keyEnd: WHITE, tintEnd: LIME },
        { s: 'cyl', p: [0, 12.3, 0], r: 6.3, h: 2.4, seg: 24, key: WHITE, tint: LIME, keyTop: ROOFC },
        { s: 'quad', p: [0, 12.6, 0], size: [1.2, 1.8], key: G_TALL, uv: 'fit', ring: { n: 12, r: 6.34 } },
        { s: 'dome', p: [0, 14.7, 0], r: 6.0, h: 5.4, seg: 24, rings: 8, key: GREENP, tint: VERD, uv: 3 },
        { s: 'cyl', p: [0, 19.9, 0], r: 0.9, h: 1.5, seg: 10, key: WHITE },
        { s: 'cyl', p: [0, 21.4, 0], r: 1.15, r2: 0, h: 1.5, seg: 10, key: GREENP, tint: VERD },
        panels('r', 28, 24.5, 2.6, 1.75, 5.6, 6, G_TALL), panels('l', 28, 24.5, 2.6, 1.75, 5.6, 6, G_TALL),
        { s: 'quad', p: [-12.25, 2.6, 12.28], size: [1.75, 5.6], key: G_TALL, uv: 'fit', n: 2, step: [24.5, 0, 0] },
        { s: 'quad', p: [-5.25, 2.4, 15.4], size: [1.5, 5.2], tint: 0xa02626, ds: true, n: 2, step: [10.5, 0, 0] },
      ]); }

    /* ── P05-08 · GALLERY COURT ── */
    /* THE GALLERY: a white modern cube, a dark glass box pushed out over the door, a red fin wall, a slab canopy. Roof walked (the roof route). */
    { const f = tier('P05-08-B1');
      B('P05-08-B1', f.x, f.z, 180, [
        { s: 'box', p: [0, 0, 0], size: [17.6, 7, 14.1], top: false, key: WHITE, uv: 3.5 },
        { s: 'box', p: [3.2, 3.4, 7.2], size: [8, 3.4, 3.2], under: true, key: G_SQ3, tint: 0x8fb4c8, keyTop: ROOFC, uv: 1.75 },
        { s: 'box', p: [-8.5, 0, 8.8], size: [0.5, 8.6, 3.5], key: REDP, tint: 0xff6a4a },
        slab(9, 3.4, 2.9, 0.25, DARK, 0x555555),
        { s: 'box', p: [-3.6, 0, 7.05], size: [0.4, 2.9, 0.4], key: DARK, n: 2, step: [5.4, 0, 0] },
        panels('f', 17.6, 14.1, 0.2, 1.75, 2.6, 3, G_TALL3, { span: 5.2, c: -3.4 }),
        panels('l', 17.6, 14.1, 4.2, 6, 1.4, 1, G_SQ3, { uv: [1.75, 1.4] }), panels('r', 17.6, 14.1, 0.6, 1.75, 5.2, 3, G_TALL3, { span: 7 }),
      ]); }
    /* THE ART SUPPLY SHOP: painted ochre brick, a striped awning over the shop glass, a steep gable roof in blue metal. Solid. */
    { const f = solid('P05-08-B2', 2);
      B('P05-08-B2', f.x, f.z, f.rot, [
        walls(17.5, 7, 14, OCHRE, 0xffd9a0),
        panels('f', 17.5, 14, 0.25, 3.2, 2.6, 4, G_SQ, { span: 12.4, uv: [1.6, 1.3] }),
        awning(0, 3.0, 7, 16.5, 1.8, 0xc23a2a, 0xf2ead8, 11),
        panels('f', 17.5, 14, 4.2, 1.5, 2, 5, G_RES), panels('l', 17.5, 14, 4.2, 1.5, 2, 3, G_RES), panels('r', 17.5, 14, 4.2, 1.5, 2, 3, G_RES),
        { s: 'roof', form: 'gable', p: [0, 7, 0], size: [17.5, 4.2, 14], over: 0.5, key: M_BLUE, keyEnd: OCHRE, tint: 0xffffff },
        { s: 'box', p: [5.5, 7, -3], size: [1.2, 5.4, 1.2], key: T_RED },
      ]); }
    /* THE SCULPTORS' WORKSHOP: a blue corrugated shed, a north-light sawtooth roof (three sheds with glass risers), a roller door, a plinth with a
       stone on it by the door. Solid. */
    { const f = solid('P05-08-B3', 2);
      B('P05-08-B3', f.x, f.z, f.rot, [
        walls(17.5, 5.6, 10.5, M_BLUE, 0xffffff, { uv: 3.5 }),
        { s: 'roof', form: 'shed', ry: 90, p: [-5.83, 5.6, 0], size: [10.5, 2.4, 5.83], key: M_GREY, keyEnd: G_FAC, n: 3, step: [5.83, 0, 0], uv: 3.5 },
        { s: 'quad', p: [-3.5, 0, 5.28], size: [4.4, 3.6], key: M_GREY, tint: 0xd8d8d8, uv: [4.4, 0.9] },
        panels('f', 17.5, 10.5, 2.2, 2.6, 2.2, 2, G_FAC1, { span: 4.2, c: 4.6 }),
        { s: 'box', p: [7, 0, 5.9], size: [1.6, 1.4, 1.1], key: STUCCO, tint: 0xdddddd }, { s: 'dome', p: [7, 1.4, 5.9], r: 0.55, h: 1.1, seg: 10, rings: 4, key: STUCCO },
      ]); }

    /* ── P06-08 · THE WRESTLING HALL, the district's landmark: a red and gold square hall whose roof terrace (walked, the roof route) carries a
       striped big-top drum and dome; flag towers on the two front corners (the roof bridges land on the back ones); a lit marquee over the doors ── */
    { const f = tier('P06-08-B1'), RED = 0xe2473a, stripes = [];
      for (let i = 0; i < 16; i++) stripes.push({ s: 'cyl', p: [0, 7.02, 0], r: 9, h: 4, seg: 32, arc: 22.5, a0: i * 22.5, cap: false, key: i % 2 ? WHITE : REDP, tint: i % 2 ? 0xfff6e0 : RED });
      for (let i = 0; i < 16; i++) stripes.push({ s: 'dome', p: [0, 11.02, 0], r: 9.4, h: 4.2, seg: 2, rings: 6, arc: 22.5, a0: i * 22.5, key: i % 2 ? REDP : WHITE, tint: i % 2 ? RED : 0xfff6e0 });
      B('P06-08-B1', f.x, f.z, 180, [
        { s: 'box', p: [0, 0, 0], size: [28.1, 7, 28.1], top: false, key: REDP, tint: RED, uv: 3.5 },
        { s: 'box', p: [0, 0, 0], size: [28.4, 1.2, 28.4], top: false, key: MARBLE_D, uv: 1.75 },
        { s: 'box', p: [0, 6.2, 0], size: [28.5, 0.8, 28.5], top: false, key: GOLD, glow: 0.3 },
        { s: 'box', p: [-12.4, 0, 14.2], size: [1.3, 7, 0.5], key: GOLD, glow: 0.3, n: 8, step: [3.543, 0, 0] },
        { s: 'box', p: [0, 3.0, 15.4], size: [12, 2.6, 2.6], under: true, key: DARK, tint: 0x444444 },
        { s: 'quad', p: [0, 3.3, 16.72], size: [11.4, 2.0], key: GOLD, glow: 0.7, uv: [2, 2] },
        { s: 'box', p: [-5.25, 0, 16.3], size: [0.5, 3, 0.5], key: DARK, n: 2, step: [10.5, 0, 0] },
        panels('f', 28, 28.1, 0.1, 1.75, 2.6, 4, DOORS, { span: 6.2, kind: 'over' }),
        stripes,
        { s: 'cyl', p: [0, 11.0, 0], r: 9.6, h: 0.35, seg: 32, key: GOLD, glow: 0.3 },
        { s: 'cyl', p: [0, 15.1, 0], r: 0.9, h: 1.2, seg: 10, key: GOLD, glow: 0.3 }, { s: 'cyl', p: [0, 16.3, 0], r: 0.12, h: 3, seg: 6, tint: 0xdddddd }, { s: 'quad', p: [0.8, 17.9, 0], size: [1.6, 1.1], tint: RED, ds: true },
        { s: 'box', p: [-13, 7, 13], size: [2.2, 3, 2.2], key: REDP, tint: RED, n: 2, step: [26, 0, 0] },
        { s: 'roof', form: 'pyramid', p: [-13, 10, 13], size: [2.2, 2.4, 2.2], over: 0.3, key: GOLD, glow: 0.3, n: 2, step: [26, 0, 0] },
      ]);
      /* the drum stands on the walked roof: a tier inside it, so nobody walks through the big top */
      features.push({ k: 'plateau', id: 'dc:S-drum', x: f.x, z: f.z, w: 12.25, d: 12.25, h: 10.5, edge: 0.3, bld: { style: 'office', seed: seed++, skin: false } }); }

    /* ── P07-08 · THE CLUBHOUSE: a long varsity-brick clubhouse, blue and gold bands, a grandstand canopy on truss posts over the yard side, a press
       box on the roof. Roof walked. The yard: a goal post. ── */
    { const f = tier('P07-08-B1'), BLUE = 0x3b62c4;
      B('P07-08-B1', f.x, f.z, 90, [
        { s: 'box', p: [0, 0, 0], size: [28.1, 7, 10.6], top: false, key: T_RED, tint: 0xd9a08c, uv: 3.5 },
        { s: 'box', p: [0, 3.2, 0], size: [28.3, 0.7, 10.8], top: false, key: BLUEP, tint: BLUE }, { s: 'box', p: [0, 6.3, 0], size: [28.3, 0.7, 10.8], top: false, key: GOLD, glow: 0.3 },
        { s: 'roof', form: 'shed', ry: 180, p: [0, 4.3, 7.2], size: [26, 1.3, 3.8], key: M_BLUE, under: true, ds: true, uv: 3.5 },
        { s: 'box', p: [-10.5, 0, 8.75], size: [0.45, 4.4, 0.45], key: TRUSS, n: 4, step: [7, 0, 0], uv: [0.45, 2.2] },
        panels('f', 28, 10.6, 0.3, 2.4, 2.4, 6, G_SQ, { span: 22 }), panels('b', 28, 10.6, 4.0, 1.6, 1.8, 7, G_RES),
        { s: 'box', p: [0, 7, -3.1], size: [9, 2.8, 3.4], key: WHITE, keyTop: ROOFC }, { s: 'quad', p: [0, 7.7, -1.37], size: [8.4, 1.5], key: G_SQ3, uv: [1.75, 1.5] },
      ]);
      prop('field_goal_post', gc(86), gc(105), 90); }
    /* THE GROUNDSKEEPER'S HOUSE: cream stucco, a terracotta hip roof, a porch on posts, a chimney. Solid. */
    { const f = walkin('P07-08-B2', 2, 7);   // THE LUCHADOR'S HOME (the residents' bedrooms): a walk-in, the door in face square 7
      B('P07-08-B2', f.x, f.z, f.rot, [
        walls(21, 6.4, 17.5, STUCCO, 0xfff2cf, { door: [0.875, 1.74, 2.2] }),
        { s: 'roof', form: 'hip', p: [0, 6.4, 0], size: [21, 4, 17.5], over: 0.7, key: T_RED, tint: 0xe08a5c, uv: 2 },
        { s: 'roof', form: 'shed', ry: 180, p: [0, 2.9, 10.5], size: [14.8, 0.9, 3.5], key: T_RED, tint: 0xe08a5c, under: true, ds: true, uv: 2 },
        { s: 'cyl', p: [-7, 0, 12.05], r: 0.16, h: 2.95, seg: 8, key: WHITE, n: 5, step: [3.5, 0, 0] },
        panels('f', 21, 17.5, 0.9, 1.5, 1.7, 4, G_RES, { span: 15 }), panels('f', 21, 17.5, 3.9, 1.5, 1.7, 5, G_RES), panels('l', 21, 17.5, 3.9, 1.5, 1.7, 4, G_RES), panels('r', 21, 17.5, 3.9, 1.5, 1.7, 4, G_RES),
        { s: 'box', p: [-6, 6.4, -3], size: [1.3, 5.2, 1.3], key: T_RED, tint: 0xc98a70 },
      ]); }

    /* ── P04-09 + P05-09 + P04-10 + P05-10 · THE STADIUM: the football field (77 × 35 m, 22 squares by 10, with its end zones), a stand on each long
       side (the locker rooms' doors under the south stand, a press box on top; a roof over the north stand), the scoreboard at the west end,
       four flood masts, a goal post on each end line, the team benches on the sidelines. The grass is the ground's own sheet; the lines, the
       stripes and the end zones lie on it. ── */
    { const P = [], SX = -42, SZ = 168, lay = (x, z, w, d, tint, y) => ({ s: 'quad', flat: true, p: [x, y || 0.02, z], size: [w, d], tint, kind: 'over' });
      for (let i = 0; i < 5; i++) P.push(lay(-28.35 + i * 12.6, 0, 6.3, 35, 0x447c34));
      P.push(lay(-35, 0, 7, 35, 0x2a50b8), lay(35, 0, 7, 35, 0xb8322a));
      for (let i = 0; i < 11; i++) P.push(lay(-31.5 + i * 6.3, 0, 0.2, 35, 0xffffff, 0.035));
      P.push(lay(0, -17.5, 77.2, 0.22, 0xffffff, 0.035), lay(0, 17.5, 77.2, 0.22, 0xffffff, 0.035), lay(-38.5, 0, 0.22, 35, 0xffffff, 0.035), lay(38.5, 0, 0.22, 35, 0xffffff, 0.035));
      const stand = (dir) => { const o = [];
        for (let k = 0; k < 8; k++) o.push({ s: 'box', p: [0, 0, dir * (21.8 + k * 1.6)], size: [70, 1.2 + k * 0.85, 1.6], key: CONC, keyTop: k % 2 ? BLUEP : WHITE, tintTop: k % 2 ? 0x4a78e0 : 0xf4f4f4, uv: 3.5 });
        o.push({ s: 'box', p: [0, 0, dir * 34.4], size: [70, 9.6, 1.2], key: T_RED, tint: 0xd9a08c, uv: 3.5 });
        o.push({ s: 'box', p: [0, 9.6, dir * 34.4], size: [70.4, 0.6, 1.6], key: BLUEP, tint: 0x3b62c4 });
        o.push({ s: 'quad', p: [dir > 0 ? -28 : 28, 5.2, dir * 35.03], ry: dir > 0 ? 0 : 180, size: [1.6, 1.8], key: G_RES, uv: 'fit', n: 9, step: [dir > 0 ? 7 : -7, 0, 0] });
        return o; };
      P.push(stand(-1), stand(1));
      /* the south stand: the locker rooms' doors on the concourse, the press box on top */
      P.push({ s: 'quad', p: [-12.25, 0.05, 35.03], size: [3.5, 2.6], key: DOORS, uv: [1.75, 2.6], kind: 'over', n: 2, step: [24.5, 0, 0] });
      P.push({ s: 'box', p: [0, 7.6, 32.4], size: [22, 3.2, 4], key: WHITE, keyTop: ROOFC, under: true }, { s: 'quad', p: [0, 8.3, 30.37], ry: 180, size: [21, 1.8], key: G_SQ3, uv: [1.75, 1.8] });
      /* the north stand's roof on its truss posts */
      P.push({ s: 'roof', form: 'shed', p: [0, 10.4, -30], size: [70, 2.2, 10], key: M_BLUE, under: true, ds: true, uv: 3.5 }, { s: 'box', p: [-33, 0, -35.3], size: [0.6, 10.6, 0.6], key: TRUSS, uv: [0.6, 2.2], n: 7, step: [11, 0, 0] });
      /* the scoreboard */
      P.push({ s: 'box', p: [-40.25, 0, -5.25], size: [0.7, 9, 0.7], tint: 0x444a52, n: 2, step: [0, 0, 10.5] }, { s: 'box', p: [-40.25, 6, 0], size: [1, 5.5, 14], tint: 0x1b1e24 }, { s: 'quad', p: [-39.73, 6.6, 0], ry: -90, size: [12.6, 4.2], tint: 0xffb020, glow: 0.5 });
      const mast = (x, z) => [{ s: 'cyl', p: [x, 0, z], r: 0.3, h: 17, seg: 8, tint: 0x666c74 }, { s: 'box', p: [x, 17, z], size: [3.6, 1.8, 0.5], tint: 0xf4f2e0, glow: 0.6 }];
      P.push(mast(-40.25, -26.25), mast(40.25, -26.25), mast(-40.25, 26.25), mast(40.25, 26.25));
      B('stadium', SX, SZ, 0, P);
      block('stand-n', SX, SZ - 28, 70, 14, 3); block('stand-s', SX, SZ + 28, 70, 14, 3);
      [[-40.25, -26.25], [40.25, -26.25], [-40.25, 26.25], [40.25, 26.25], [-40.25, -5.25], [-40.25, 5.25]].forEach((q, i) => block('mast' + i, SX + q[0], SZ + q[1], 2, 2, 3));
      props.push({ key: 'field_goal_post', x: r3(SX - 38.5), z: SZ, face: 270 }, { key: 'field_goal_post', x: r3(SX + 38.5), z: SZ, face: 90 });
      [-14, 0, 14].forEach(dx => { props.push({ key: 'park_bench', x: SX + dx, z: r3(SZ - 20.5), face: 0 }, { key: 'park_bench', x: SX + dx, z: r3(SZ + 20.5), face: 180 }); }); }

    /* ── P06-09 · ARENA SERVICE ── */
    /* THE LOADING DOCK: grey corrugated back-of-house, a hazard-yellow band, three roller doors under a dock canopy, a roof tank and ducts. Roof walked. */
    { const f = tier('P06-09-B1');
      B('P06-09-B1', f.x, f.z, 90, [
        { s: 'box', p: [0, 0, 0], size: [24.6, 7, 10.6], top: false, key: M_GREY, uv: 3.5 },
        { s: 'box', p: [0, 0, 0], size: [24.8, 1.3, 10.8], top: false, key: OCHRE, tint: 0xf2cf4a },
        { s: 'quad', p: [-7.5, 1.3, 5.34], size: [4.6, 3.4], key: M_OCHRE, tint: 0xf2cf4a, uv: [4.6, 0.85], n: 3, step: [7.5, 0, 0] },
        { s: 'roof', form: 'shed', ry: 180, p: [0, 5.0, 6.6], size: [23, 0.8, 2.6], key: M_GREY, tint: 0xbbbbbb, under: true, ds: true, uv: 3.5 },
        { s: 'cyl', p: [8, 7, -2.6], r: 1.7, h: 2.8, seg: 14, key: M_GREY, tint: 0xd0d0d0 }, { s: 'cyl', p: [8, 9.8, -2.6], r: 1.7, r2: 0, h: 0.9, seg: 14, key: M_GREY },
        { s: 'box', p: [-7, 7, -3.4], size: [5, 1.3, 1.6], key: M_GREY, tint: 0x9aa4ac },
      ]); }
    /* THE BOX OFFICE: a round corner turret with a cone roof, ticket windows under a striped awning, a tall sign fin. Solid. */
    { const f = walkin('P06-09-B2', 2, 7);   // THE QUARTERBACK'S HOME: a walk-in, the door in face square 7 (between the windows and the turret)
      B('P06-09-B2', f.x, f.z, f.rot, [
        walls(17.5, 5.6, 17.5, T_BLUE, 0xcfe0ff, { door: [2.625, 1.74, 2.2] }),
        { s: 'box', p: [0, 5.6, 0], size: [18.1, 0.6, 18.1], key: WHITE, keyTop: ROOFC, under: true },
        { s: 'cyl', p: [7.9, 0, 7.9], r: 2.3, h: 8.2, seg: 20, key: WHITE }, { s: 'cyl', p: [7.9, 8.2, 7.9], r: 2.8, r2: 0, h: 3.4, seg: 20, key: REDP, tint: 0xe2473a },
        { s: 'quad', p: [7.9, 1.1, 7.9], size: [1.1, 1.5], key: G_RES, uv: 'fit', ring: { n: 4, r: 2.34, a0: -25, arc: 140 } },
        panels('f', 17.5, 17.5, 1.0, 1.6, 1.6, 4, G_RES, { span: 8.6, c: -3 }),
        awning(-3, 3.0, 8.75, 11.5, 1.6, 0x2f5fd0, 0xf2ead8, 9),
        { s: 'box', p: [-8.5, 0, 9.2], size: [0.5, 9.5, 0.9], key: REDP, tint: 0xe2473a },
      ]); }

    /* ── P07-09 · THE SPORTS CLINIC: clean white panels over a blue tile base, a ribbon of teal glass, a rounded glass entrance corner, a disc
       canopy on one column, a green-cross pylon. Roof walked. ── */
    { const f = tier('P07-09-B1'), TEAL = 0x7fd6c8;
      B('P07-09-B1', f.x, f.z, 180, [
        { s: 'box', p: [0, 0, 0], size: [28.1, 7, 28.1], top: false, key: WHITE, uv: 3.5 },
        { s: 'box', p: [0, 0, 0], size: [28.3, 1.4, 28.3], top: false, key: T_BLUE, tint: 0x9fd0e8 },
        { s: 'box', p: [0, 3.9, 0], size: [28.25, 1.7, 28.25], top: false, key: G_SQ3, tint: TEAL, uv: 1.7 },
        { s: 'cyl', p: [14, 0, 14], r: 4.9, h: 7.4, seg: 24, key: G_TALL3, tint: TEAL, keyTop: ROOFC, uv: [1.75, 3.7] },
        { s: 'cyl', p: [14, 3.1, 14], r: 5.05, h: 0.5, seg: 24, key: WHITE },
        { s: 'cyl', p: [3.5, 2.9, 17.2], r: 4.2, h: 0.3, seg: 24, key: WHITE, tint: 0xffffff }, { s: 'cyl', p: [3.5, 0, 17.5], r: 0.25, h: 2.9, seg: 10, key: WHITE },
        { s: 'box', p: [-12.25, 0, 15.75], size: [0.6, 9, 2.2], key: WHITE },
        { s: 'quad', p: [-11.93, 6.9, 15.75], ry: -90, size: [1.7, 0.55], tint: 0x1fbf5a, glow: 0.7 }, { s: 'quad', p: [-11.93, 6.325, 15.75], ry: -90, size: [0.55, 1.7], tint: 0x1fbf5a, glow: 0.7 },
        { s: 'quad', p: [-12.57, 6.9, 15.75], ry: 90, size: [1.7, 0.55], tint: 0x1fbf5a, glow: 0.7 }, { s: 'quad', p: [-12.57, 6.325, 15.75], ry: 90, size: [0.55, 1.7], tint: 0x1fbf5a, glow: 0.7 },
        panels('f', 28, 28.1, 0.2, 1.75, 2.6, 2, DOORS, { span: 1.75, c: 3.5, kind: 'over' }),
      ]);
      /* the glass corner fills the four squares round the building's corner: a tier under it (the roof walk runs on over it) */
      features.push({ k: 'plateau', id: 'dc:S-clinic-corner', x: r3(f.x - 14), z: r3(f.z - 14), w: 7, d: 7, h: 7, edge: 0.3, bld: { style: 'office', seed: seed++, skin: false } });
      [[-1, -1], [0, -1], [-1, 0]].forEach(q => take(cellOf(f.x - 14 + q[0] * 3.5 + 1.75), cellOf(f.z - 14 + q[1] * 3.5 + 1.75))); }

    /* ── P06-10 · THE TRAINING GYM: an old brick drill hall: buttressed brick walls, tall factory windows, one bow-string barrel roof over the
       whole floor in green metal, a red stripe, a canopy over the door. WALK-IN. ── */
    { const f = walkin('P06-10-B1', 2), hx = -14 + (f.door - 0.5) * 1.75;
      B('P06-10-B1', f.x, f.z, f.rot, [
        walls(28, 7, 28, T_RED, 0xc98f7c, { door: [hx, 1.74, 2.2] }),
        { s: 'box', p: [0, 0, 0], size: [28.3, 1.2, 28.3], faces: 'blr', top: false, key: CONC },
        { s: 'box', p: [-14.1, 0, -12.25], size: [0.9, 7, 1.4], key: T_RED, tint: 0xb07a68, n: 8, step: [0, 0, 3.5] }, { s: 'box', p: [14.1, 0, -12.25], size: [0.9, 7, 1.4], key: T_RED, tint: 0xb07a68, n: 8, step: [0, 0, 3.5] },
        panels('l', 28, 28, 2.2, 2.2, 3.8, 7, G_FAC, { span: 21, uv: [2.2, 3.8] }), panels('r', 28, 28, 2.2, 2.2, 3.8, 7, G_FAC, { span: 21, uv: [2.2, 3.8] }),
        panels('f', 28, 28, 2.6, 2.2, 3.4, 4, G_FAC, { span: 21, uv: [2.2, 3.4] }),
        slab(27.9, 27.9, 7, 0.05, WHITE, 0xffffff, ROOFC),
        { s: 'roof', form: 'barrel', ry: 90, p: [0, 7, 0], size: [28, 5.2, 28], over: 0.6, key: M_GREEN, keyEnd: T_RED, tint: 0xffffff, uv: 3.5, seg: 14 },
        { s: 'quad', p: [0, 7.6, 14.03], size: [10, 2.6], key: G_FAC1, uv: [2.5, 2.6] },
        { s: 'box', p: [0, 5.4, 14.05], size: [28.2, 0.7, 0.2], key: REDP, tint: 0xe2473a },
        { s: 'box', p: [hx, 2.7, 15.3], size: [6, 0.25, 2.6], under: true, key: DARK, tint: 0x555555 },
      ]); }

    /* ── P07-10 · EVENT SQUARE ── */
    /* THE BAND SHELL: a dark backstage block whose front opens as a stage under a white half-dome shell, a raised stage, two lighting truss
       towers and a rig; the stage door (painted) on its left wing. Solid: the stage is looked at, not walked on. */
    { const f = solid('P07-10-B1', 2);
      B('P07-10-B1', f.x, f.z, f.rot, [
        { s: 'box', p: [0, 0, 0], size: [28, 7, 10.5], faces: 'blr', top: false, key: DARK, tint: 0x9aa0b0, uv: 3.5 },
        { s: 'quad', p: [-9.5, 0, 5.25], size: [9, 7], key: DARK, tint: 0x9aa0b0, uv: 3.5 }, { s: 'quad', p: [-11.375, 0, 5.28], size: [1.4, 2.3], tint: 0x2f5fd0 }, { s: 'quad', p: [13.5, 0, 5.25], size: [1, 7], key: DARK, tint: 0x9aa0b0, uv: 3.5 },
        { s: 'quad', p: [4, 6.3, 5.25], size: [18, 0.7], key: DARK, tint: 0x9aa0b0, uv: 3.5 },
        { s: 'box', p: [0, 7, 0], size: [28.4, 0.5, 10.9], key: REDP, tint: 0xe2473a, keyTop: ROOFC, under: true },
        { s: 'dome', p: [4, 0.9, 5.2], r: 9, h: 5.4, rz: 5, arc: 180, a0: 180, seg: 20, rings: 8, key: WHITE, tint: 0xfff6e0, ds: true, uv: 3.5 },
        { s: 'box', p: [4, 0, 2.6], size: [18, 0.9, 5.2], key: CONC, keyTop: U('TileGeneric3a') },
        { s: 'box', p: [-5.7, 0, 6.3], size: [1.1, 10.5, 1.1], key: TRUSS, uv: [1.1, 2.2], n: 2, step: [19.4, 0, 0] },
        { s: 'box', p: [4, 9.9, 6.3], size: [20.5, 0.8, 0.8], key: TRUSS, uv: [1.6, 0.8] },
        { s: 'box', p: [-3, 9.1, 6.3], size: [0.7, 0.8, 0.7], tint: 0x222222, n: 5, step: [3.5, 0, 0] },
      ]); }
    /* THE STAGE DOOR HOUSE: a narrow brick townhouse, a steep gable facing the square, a round attic window, a blue door. Solid. */
    { const f = walkin('P07-10-B2', 2, 2);   // THE JUGGERNAUT'S HOME: a walk-in, the door where the blue door was painted
      B('P07-10-B2', f.x, f.z, f.rot, [
        walls(17.5, 8.4, 17.5, T_OCHRE, 0xd8b890, { door: [-6.125, 1.74, 2.2] }),
        { s: 'roof', form: 'gable', ry: 90, p: [0, 8.4, 0], size: [17.5, 5.5, 17.5], over: 0.5, key: DARK, tint: 0x6a6f7c, keyEnd: T_OCHRE },
        panels('f', 17.5, 17.5, 1.0, 1.5, 1.9, 3, G_RES, { span: 9, c: 2.5 }), panels('f', 17.5, 17.5, 4.6, 1.5, 1.9, 5, G_RES),
        { s: 'cyl', p: [0, 10.6, 8.78], r: 0.9, h: 0.06, seg: 16, key: G_SQ, tint: 0xffffff },

        panels('l', 17.5, 17.5, 4.6, 1.5, 1.9, 4, G_RES), panels('r', 17.5, 17.5, 4.6, 1.5, 1.9, 4, G_RES),
      ]); }

    /* ── P04-11 · THE STADIUM GATE (the plan's park gate): stone gate piers with green caps and an arched head over the path to the stadium,
       iron railings either side. The piers stand on their squares' middles. ── */
    { const gx0 = -63, gz0 = gc(133);
      B('P04-11-gate', gx0, gz0, 0, [
        { s: 'box', p: [-5.25, 0, 0], size: [2.2, 5.4, 2.2], key: STUCCO, tint: 0xe6dcc8, n: 2, step: [10.5, 0, 0] },
        { s: 'roof', form: 'pyramid', p: [-5.25, 5.4, 0], size: [2.2, 1.3, 2.2], over: 0.3, key: GREENP, tint: 0x8fd6b8, n: 2, step: [10.5, 0, 0] },
        { s: 'box', p: [0, 4.2, 0], size: [8.4, 0.5, 0.9], key: DARK, tint: 0x333333, under: true },
        { s: 'roof', form: 'barrel', ry: 90, p: [0, 4.7, 0], size: [0.6, 2.2, 8], key: DARK, tint: 0x333333 },
        { s: 'box', p: [-13.4, 0, 0], size: [0.12, 2.2, 0.12], tint: 0x222222, n: 18, step: [0.4, 0, 0] }, { s: 'box', p: [6.6, 0, 0], size: [0.12, 2.2, 0.12], tint: 0x222222, n: 18, step: [0.4, 0, 0] },
        { s: 'box', p: [-10, 2.0, 0], size: [7, 0.12, 0.12], tint: 0x222222, n: 2, step: [20, 0, 0] },
      ]);
      [-12.25, -8.75, -5.25, 5.25, 8.75, 12.25].forEach((dx, i) => { take(cellOf(gx0 + dx), cellOf(gz0)); if (i === 2 || i === 3) block('gate' + i, gx0 + dx, gz0, 2.2, 2.2, 2); });
      block('gate-w', gx0 - 10.5, gz0, 7, 2, 1); block('gate-e', gx0 + 10.5, gz0, 7, 2, 1); }

    /* ── P05-11 · VENDOR STALLS: THE PIZZERIA (the Pizzeria PSX pack's own building at its own size, mondo 16:41: "Isnt there a pizza resturaunt
       ... Those definitely need to be buildings somewhere"), a row of four striped market stalls on their squares, a hot dog stand, and the
       hexagonal food kiosk ── */
    { props.push({ key: 'city_pizzeria', x: -31.5, z: 246.75, face: 90 });
      const stall = (x, c) => [{ s: 'cyl', p: [x - 1.5, 0, 1.2], r: 0.07, h: 2.4, seg: 6, tint: 0xdddddd, n: 2, step: [3, 0, 0] }, { s: 'cyl', p: [x - 1.5, 0, -1.2], r: 0.07, h: 2.9, seg: 6, tint: 0xdddddd, n: 2, step: [3, 0, 0] }, awning(x, 2.4, -1.4, 3.4, 2.8, c, 0xf2ead8, 4), { s: 'box', p: [x, 0, 0.6], size: [3, 0.95, 0.8], key: STUCCO, tint: 0xd9c8a8 }];
      B('P05-11-stalls', -10.5, 246.75, 180, [stall(-5.25, 0xd23a2a), stall(-1.75, 0x2f5fd0), stall(1.75, 0xe8a020), stall(5.25, 0x2f8f4a)]);
      block('stalls', -10.5, 246.75, 14, 3.5, 1); [-15.75, -12.25, -8.75, -5.25].forEach(x => take(cellOf(x), cellOf(246.75)));
      prop('hot_dog_stand', gc(68), gc(133), 180);
      B('P05-11-B2', -31.5, 217, 0, [
        { s: 'cyl', p: [0, 0, 0], r: 3.4, h: 1.1, seg: 6, key: T_CHECK, uv: 1.1 }, { s: 'cyl', p: [0, 1.1, 0], r: 3.2, h: 1.5, seg: 6, key: G_SQ, uv: [1.75, 1.5] }, { s: 'cyl', p: [0, 2.6, 0], r: 3.4, h: 0.6, seg: 6, key: REDP, tint: 0xe2473a },
        { s: 'cyl', p: [0, 3.2, 0], r: 5, r2: 0.5, h: 2.2, seg: 6, key: WHITE, tint: 0xfff6e0, under: true }, { s: 'dome', p: [0, 5.4, 0], r: 0.7, seg: 8, rings: 4, tint: 0xe2473a },
      ]);
      block('food-kiosk', -31.5, 217, 7, 7, 1); }

    /* ── P06-11 · EQUIPMENT COURT: THE EQUIPMENT DEPOT, a long low depot, three coloured roller bays, a lean-to canopy, a giant ball on the roof
       as its roadside sign. WALK-IN. And the round rental kiosk. ── */
    { const f = walkin('P06-11-B1', 1), hx = -f.w / 2 + (f.door - 0.5) * 1.75;
      B('P06-11-B1', f.x, f.z, f.rot, [
        walls(31.5, 4.6, 10.5, CONCW, 0xffffff, { door: [hx, 1.74, 2.2] }),
        { s: 'quad', p: [-11, 0, 5.28], size: [4.4, 3.4], key: M_RED, uv: [4.4, 0.85] }, { s: 'quad', p: [4.6, 0, 5.28], size: [4.4, 3.4], key: M_BLUE, uv: [4.4, 0.85] }, { s: 'quad', p: [11, 0, 5.28], size: [4.4, 3.4], key: M_OCHRE, uv: [4.4, 0.85] },
        { s: 'roof', form: 'shed', ry: 180, p: [0, 3.7, 6.6], size: [31.5, 0.7, 2.8], key: M_GREY, under: true, ds: true, uv: 3.5 },
        slab(31.4, 10.4, 3.5, 0.05, WHITE),
        { s: 'box', p: [0, 4.6, 0], size: [31.9, 0.5, 10.9], key: DARK, keyTop: ROOFC, under: true },
        { s: 'cyl', p: [-11.5, 5.1, 0], r: 1.3, r2: 1.9, h: 0.9, seg: 16, tint: 0x555c66 }, { s: 'dome', p: [-11.5, 6.0, 0], r: 2.6, seg: 16, rings: 6, key: T_CHECK, uv: 1.3 },
      ]);
      B('P06-11-B2', 10.5, 217, 0, [
        { s: 'cyl', p: [0, 0, 0], r: 3.2, h: 3, seg: 20, key: T_OCHRE, tint: 0xffd070 }, { s: 'quad', p: [0, 1.1, 0], size: [1.4, 1.4], key: G_RES, uv: 'fit', ring: { n: 6, r: 3.23 } },
        { s: 'cyl', p: [0, 3, 0], r: 3.2, r2: 5.4, h: 1.1, seg: 20, key: WHITE }, { s: 'cyl', p: [0, 4.1, 0], r: 5.4, h: 0.25, seg: 20, key: BLUEP, tint: 0x3b62c4, keyTop: ROOFC },
      ]);
      block('rental-kiosk', 10.5, 217, 7, 7, 1); }

    /* ── P07-11 · SOUTH GATE: THE GATEHOUSE, the sports grounds' public entrance on the road: a long ticket hall between two flag towers, a great
       arch over the way in, a row of turnstile bays under a canopy (the barriers stand on the lines between squares). WALK-IN. And the gate lodge. ── */
    { const f = walkin('P07-11-B1', 1), hx = -f.w / 2 + (f.door - 0.5) * 1.75, SAND = 0xf2dcae, BLUE = 0x3b62c4;
      B('P07-11-B1', f.x, f.z, f.rot, [
        walls(31.5, 5.2, 10.5, STUCCO, SAND, { door: [hx, 1.74, 2.2] }),
        slab(31.4, 10.4, 3.5, 0.05, WHITE),
        { s: 'box', p: [0, 5.2, 0], size: [31.9, 0.6, 10.9], key: WHITE, keyTop: ROOFC, under: true },
        { s: 'box', p: [-13.5, 0, 3.2], size: [4.6, 10.5, 4.6], key: STUCCO, tint: SAND, n: 2, step: [27, 0, 0] },
        { s: 'roof', form: 'pyramid', p: [-13.5, 10.5, 3.2], size: [4.6, 3.4, 4.6], over: 0.5, key: BLUEP, tint: BLUE, n: 2, step: [27, 0, 0] },
        { s: 'cyl', p: [-13.5, 13.9, 3.2], r: 0.1, h: 3, seg: 6, tint: 0xdddddd, n: 2, step: [27, 0, 0] }, { s: 'quad', p: [-12.7, 15.6, 3.2], size: [1.6, 1.1], tint: 0xf4f4f4, ds: true, n: 2, step: [27, 0, 0] },
        { s: 'quad', p: [-13.5, 6.2, 5.53], size: [1.5, 2.6], key: G_TALL, uv: 'fit', n: 2, step: [27, 0, 0] },
        { s: 'box', p: [6, 0, 5.6], size: [1.2, 6.4, 1.2], key: STUCCO, tint: SAND, n: 2, step: [8, 0, 0] },
        { s: 'roof', form: 'barrel', ry: 90, p: [10, 6.4, 5.6], size: [1.2, 3.2, 9.2], key: STUCCO, tint: SAND, keyEnd: STUCCO, tintEnd: SAND },
        { s: 'roof', form: 'shed', ry: 180, p: [-4.4, 3.4, 7.0], size: [13.6, 0.8, 3.4], key: M_BLUE, under: true, ds: true, uv: 3.5 },
        { s: 'cyl', p: [-8.75, 0, 8.5], r: 0.12, h: 3.45, seg: 8, tint: 0xdddddd, n: 4, step: [3.5, 0, 0] },
        panels('f', 31.5, 10.5, 1.0, 1.5, 1.6, 3, G_RES, { span: 5.4, c: -7.4 }),
        { s: 'box', p: [-8.75, 0, 7.6], size: [0.25, 1.05, 1.6], tint: 0x8a929c, n: 4, step: [3.5, 0, 0] },
      ]); }
    { const f = solid('P07-11-B2', 1);
      B('P07-11-B2', f.x, f.z, f.rot, [
        walls(f.w, 3.6, f.d, STUCCO, 0xe6dcc8),
        { s: 'roof', form: 'hip', p: [0, 3.6, 0], size: [f.w, 3, f.d], over: 0.9, key: GREENP, tint: 0x8fd6b8 },
        panels('f', f.w, f.d, 1.0, 1.4, 1.6, 2, G_RES, { span: 5 }), panels('l', f.w, f.d, 1.0, 1.4, 1.6, 4, G_RES), panels('r', f.w, f.d, 1.0, 1.4, 1.6, 4, G_RES),
      ]); }

    /* ═══ THE INTERIORS (mondo 11-13 21:04: "after the district threads do their exterior polish, let's go ahead and do the interiors"; his OK on
       the plan 21:19). The four walk-ins get rooms. Everything is laid on the 3.5 m BATTLE SQUARES of the building's own frame: (u, v) = squares
       from the front's left corner as you face it from outside, v back from the front wall. His rules (21:14 / 21:17): a wall runs on a square
       line, a doorway is the middle 1.75 m of ONE square's edge, a thing that blocks fills whole squares (a ghost wall under it), a walkway is
       a whole square wide, decor stands off the squares' middles against a wall. Inner walls = arch boxes + ghost walls with the gaps; inner
       doors = the row's `inner` list (three-renderer.js THE INNER DOORS: swinging leaves like the front door's). ═══ */
    const inside = (id, o) => {
        const f = row(id), Wm = f.w, Dm = f.d, q = -(f.rot || 0) * Math.PI / 180, c = Math.round(Math.cos(q)), sn = Math.round(Math.sin(q)), SQ = 3.5, T = 0.22, DW = 1.75, DH = 2.2;
        const parts = []; f.inner = []; f.keyIn = o.wall; f.floorIn = o.floor; if (o.h) f.h = o.h + 0.32;   // (the inside's ceiling = the outside's roof slab)
        if (o.leaf) { f.leaf = o.leaf; if (o.leafDouble) f.leafDouble = true; }
        const loc = (u, v) => [-Wm / 2 + u * SQ, Dm / 2 - v * SQ], wld = (lx, lz) => [r3(f.x + lx * c + lz * sn), r3(f.z - lx * sn + lz * c)];
        const fw = th => ((540 - th - (f.rot || 0)) % 360 + 360) % 360;   // a prop's `face` from a turn in the building's frame (0 = it looks at the front wall, 90 = to the right)
        const ghost = (lx, lz, w, d, h) => { const a = w >= d ? wld(lx - w / 2 + d / 2, lz) : wld(lx, lz - d / 2 + w / 2), b = w >= d ? wld(lx + w / 2 - d / 2, lz) : wld(lx, lz + d / 2 - w / 2);
            lateRows.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h: r3(h), t: r3(Math.min(w, d)), key: CONC, ghost: true, rail: false }); };
        const fL = Wm - 0.12, fCols = Math.max(1, Math.round(fL / 1.75)), fCw = fL / fCols, fCol = Math.min(fCols - 1, Math.max(0, Math.round(+f.door || 1) - 1));   // the front doorway (data.js hqTexbDoor)
        const I = {
            f, parts, loc, fw, H: (f.h > 0 ? f.h : f.storeys * 3.5) - 0.32,
            NU: Math.round(Wm / SQ), NV: Math.round(Dm / SQ), wld,
            doors: [{ axis: 'u', at: 0, m: (-fL / 2 + (fCol + 0.5) * fCw + Wm / 2) / SQ, w: fCw + 0.06, h: 2.2 }],   // every doorway on a square line: the front's, then the inner walls' (I.wall)
            /* a wall on a square line: axis 'u' = along the front at v = at, 'v' = front to back at u = at; from a to b (squares); doors = [[middle (squares), leaf, words]] */
            wall(axis, at, a, b, h, doors, K) { K = K || {}; let cur = a;
                const piece = (x0, x1) => { if (x1 - x0 < 0.02) return; const m = (x0 + x1) / 2, L = (x1 - x0) * SQ, P = axis === 'u' ? loc(m, at) : loc(at, m);
                    parts.push({ s: 'box', p: [P[0], 0, P[1]], size: axis === 'u' ? [L, h, T] : [T, h, L], key: K.key || o.wall, tint: K.tint, uv: 3.5, glow: 0.3 });
                    parts.push({ s: 'box', p: [P[0], 0, P[1]], size: axis === 'u' ? [L, 0.16, T + 0.06] : [T + 0.06, 0.16, L], tint: K.skirt || 0x3a3a3a });
                    ghost(P[0], P[1], axis === 'u' ? L : 0.3, axis === 'u' ? 0.3 : L, h); };
                (doors || []).slice().sort((x, y) => x[0] - y[0]).forEach(dr => { const g = DW / 2 / SQ, P = axis === 'u' ? loc(dr[0], at) : loc(at, dr[0]);
                    I.doors.push({ axis, at, m: dr[0], w: DW, h: DH });
                    piece(cur, dr[0] - g); cur = dr[0] + g;
                    parts.push({ s: 'box', p: [P[0], DH, P[1]], size: axis === 'u' ? [DW, h - DH, T] : [T, h - DH, DW], key: K.key || o.wall, tint: K.tint, uv: 3.5, under: true, glow: 0.3 });
                    [-1, 1].forEach(sd => parts.push({ s: 'box', p: axis === 'u' ? [P[0] + sd * (DW / 2 + 0.06), 0, P[1]] : [P[0], 0, P[1] + sd * (DW / 2 + 0.06)], size: [axis === 'u' ? 0.12 : T + 0.08, DH + 0.1, axis === 'u' ? T + 0.08 : 0.12], tint: K.frame || 0x4a3a2c }));
                    parts.push({ s: 'box', p: [P[0], DH, P[1]], size: axis === 'u' ? [DW + 0.24, 0.12, T + 0.08] : [T + 0.08, 0.12, DW + 0.24], tint: K.frame || 0x4a3a2c });
                    if (dr[1] !== 'none') f.inner.push({ x: r3(P[0]), z: r3(P[1]), rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: dr[1] || 'leaf_office', double: dr[3] ? true : undefined });
                    if (dr[2]) { const sh = 0.34, sw = Math.min(DW + 0.6, 0.26 * dr[2].length + 0.3), k = 'txt:' + dr[2] + '|' + (K.fg || '#f2ead8') + '||' + (Math.round(sw / sh * 100) / 100);
                        [1, -1].forEach(sd => parts.push({ s: 'quad', p: axis === 'u' ? [P[0], DH + 0.3, P[1] + sd * (T / 2 + 0.02)] : [P[0] + sd * (T / 2 + 0.02), DH + 0.3, P[1]], ry: axis === 'u' ? (sd > 0 ? 0 : 180) : (sd > 0 ? -90 : 90), size: [sw, sh], key: k, uv: 'fit', tint: 0xffffff, kind: 'over' })); }
                });
                piece(cur, b); },
            /* a ceiling over low rooms: squares u0..u1 × v0..v1 at y */
            ceil(u0, v0, u1, v1, y, key, tint) { const P = loc((u0 + u1) / 2, (v0 + v1) / 2); parts.push({ s: 'box', p: [P[0], y, P[1]], size: [(u1 - u0) * SQ, 0.14, (v1 - v0) * SQ], under: true, key: key || WHITE, tint, uv: 3.5 }); },
            /* a thing that blocks: whole squares u..u+nu × v..v+nv */
            block(u, v, nu, nv, h) { const P = loc(u + nu / 2, v + nv / 2), w = nu * SQ - 0.04, d = nv * SQ - 0.04;   // (a ring of thin walls on the squares' own lines: a model inside it keeps the floor; keep models 0.5 m off the lines)
                [-1, 1].forEach(sd => { ghost(P[0], P[1] + sd * (d / 2 - 0.15), w, 0.3, h || 1.2); ghost(P[0] + sd * (w / 2 - 0.15), P[1], 0.3, d, h || 1.2); }); return P; },
            /* a model: at (u, v) in squares (any fraction), turned th in the building's frame */
            prop(key, u, v, th, x) { const P = loc(u, v), Wd = wld(P[0], P[1]); props.push(Object.assign({ key, x: Wd[0], z: Wd[1], face: fw(th || 0) }, (x && x.y != null) ? {} : { floor: true }, x || {})); },   // `floor`: on the room's floor, never on a ghost wall's top
            /* a ceiling lamp: a glowing pan under y */
            lampAt(u, v, y) { const P = loc(u, v); parts.push({ s: 'box', p: [P[0], y - 0.5, P[1]], size: [0.04, 0.5, 0.04], tint: DARKM }, { s: 'cyl', p: [P[0], y - 0.72, P[1]], r: 0.42, r2: 0.16, h: 0.22, seg: 10, tint: DARKM }, { s: 'cyl', p: [P[0], y - 0.78, P[1]], r: 0.3, h: 0.06, seg: 10, tint: LAMP, glow: 1 }); },
            /* ── THE SECOND PASS KIT (the atmosphere: mondo 11-13 22:33 "do another interior pass ... Focus on aesthetic, vibe, atmosphere for the
               interiors"). A ROOM = squares u0..u1 × v0..v1. Its four edges are either the building's own wall (the coat stands 0.33 m in: the
               drawn face is 0.06 m in from the row's edge, the inside face 0.24 m further) or an inner wall (0.13 m off its middle line); every doorway on an edge (the front's, I.wall's) is cut out
               of each layer below its head. L = { key, tint, gain, uv, glow }. Nothing here blocks: walls, trim, light and floor paint only. ── */
            edges(u0, v0, u1, v1, sides) { const NU = I.NU, NV = I.NV, eOf = out => out ? 0.33 : T / 2 + 0.02, eL = eOf(u0 <= 0), eR = eOf(u1 >= NU), eF = eOf(v0 <= 0), eB = eOf(v1 >= NV), out = [];
                const sd = sides || 'fblr';
                /* per edge: the line's points a → b (local metres, along the edge), its fixed coordinate, the facing (ry) and the doorways on it (squares) */
                if (sd.includes('b')) out.push({ k: 'b', along: 'x', a: loc(u0, 0)[0] + eL, b: loc(u1, 0)[0] - eR, c: loc(0, v1)[1] + eB, ry: 0, n: [0, 1], ds: I.doors.filter(d => d.axis === 'u' && Math.abs(d.at - v1) < 1e-6 && d.m > u0 && d.m < u1).map(d => ({ x: loc(d.m, 0)[0], w: d.w, h: d.h })) });
                if (sd.includes('f')) out.push({ k: 'f', along: 'x', a: loc(u0, 0)[0] + eL, b: loc(u1, 0)[0] - eR, c: loc(0, v0)[1] - eF, ry: 180, n: [0, -1], ds: I.doors.filter(d => d.axis === 'u' && Math.abs(d.at - v0) < 1e-6 && d.m > u0 && d.m < u1).map(d => ({ x: loc(d.m, 0)[0], w: d.w, h: d.h })) });
                if (sd.includes('l')) out.push({ k: 'l', along: 'z', a: loc(0, v1)[1] + eB, b: loc(0, v0)[1] - eF, c: loc(u0, 0)[0] + eL, ry: 270, n: [1, 0], ds: I.doors.filter(d => d.axis === 'v' && Math.abs(d.at - u0) < 1e-6 && d.m > v0 && d.m < v1).map(d => ({ x: loc(0, d.m)[1], w: d.w, h: d.h })) });
                if (sd.includes('r')) out.push({ k: 'r', along: 'z', a: loc(0, v1)[1] + eB, b: loc(0, v0)[1] - eF, c: loc(u1, 0)[0] - eR, ry: 90, n: [-1, 0], ds: I.doors.filter(d => d.axis === 'v' && Math.abs(d.at - u1) < 1e-6 && d.m > v0 && d.m < v1).map(d => ({ x: loc(0, d.m)[1], w: d.w, h: d.h })) });
                return out; },
            /* the runs of an edge between its doorways (y0 under a door's head) and the heads over them */
            runs(E, y0, y1) { const out = []; let cur = E.a; const ds = y0 < 2.3 ? E.ds.slice().sort((p, q) => p.x - q.x) : [];
                ds.forEach(d => { const g0 = d.x - d.w / 2, g1 = d.x + d.w / 2; if (g0 - cur > 0.03) out.push([cur, g0, y0, y1]); if (y1 > d.h + 0.02) out.push([Math.max(cur, g0), Math.min(E.b, g1), Math.max(y0, d.h), y1]); cur = Math.max(cur, g1); });
                if (E.b - cur > 0.03) out.push([cur, E.b, y0, y1]); return out; },
            /* a coat of paint / panelling on a room's walls from y0 to y1 (e: how far proud of the edge, for layers) */
            coat(u0, v0, u1, v1, y0, y1, L, o) { o = o || {}; const lift = o.lift || 0;
                I.edges(u0, v0, u1, v1, o.sides).forEach(E => I.runs(E, y0, y1).forEach(r => { const m = (r[0] + r[1]) / 2, len = r[1] - r[0], c = E.c + (E.k === 'b' || E.k === 'l' ? lift : -lift);
                    parts.push(Object.assign({ s: 'quad', p: E.along === 'x' ? [m, r[2], c] : [c, r[2], m], ry: E.ry, size: [len, r[3] - r[2]], uv: 3.5 }, L, { glow: Math.min(1, (L.glow || 0) + 0.12) })); })); },   // (+0.12 glow: the insides have no real light; a deep colour read black)
            /* a band round a room (skirting, dado rail, picture rail, cornice): a box h tall, t deep, at y */
            band(u0, v0, u1, v1, y, h, t, L, o) { o = o || {};
                I.edges(u0, v0, u1, v1, o.sides).forEach(E => I.runs(E, y, y + h).forEach(r => { const m = (r[0] + r[1]) / 2, len = r[1] - r[0], c = E.c + E.n[0] * t / 2 + E.n[1] * t / 2;
                    parts.push(Object.assign({ s: 'box', p: E.along === 'x' ? [m, r[2], c] : [c, r[2], m], size: E.along === 'x' ? [len, r[3] - r[2], t] : [t, r[3] - r[2], len], uv: 1.75 }, L)); })); },
            /* the whole liner: a wall coat, a dado (panelling below dh) with its rail, a skirting and a cornice at the top */
            liner(u0, v0, u1, v1, top, wall, dado, dh, trim, o) { o = o || {}; I.coat(u0, v0, u1, v1, 0, top, wall, o);
                if (dado) { I.coat(u0, v0, u1, v1, 0, dh, dado, Object.assign({}, o, { lift: 0.015 })); I.band(u0, v0, u1, v1, dh - 0.03, 0.07, 0.05, trim, o); }
                I.band(u0, v0, u1, v1, 0, 0.16, 0.05, trim, o); if (!o.noCrown) I.band(u0, v0, u1, v1, top - 0.18, 0.18, 0.1, trim, o); },
            /* a floor laid over a room (a parquet, a carpet, a mat): a flat quad 3 cm up, `in` metres in from the room's lines */
            floorOf(u0, v0, u1, v1, L, inset, y) { const P = loc((u0 + u1) / 2, (v0 + v1) / 2), i2 = inset == null ? 0.14 : inset;
                parts.push(Object.assign({ s: 'quad', flat: true, p: [P[0], y || 0.035, P[1]], size: [(u1 - u0) * SQ - 2 * i2, (v1 - v0) * SQ - 2 * i2], uv: 1.75 }, L)); },
            /* a lit ceiling (the hollow building's own ceiling draws black): a flush panel under y, glowing */
            ceilLit(u0, v0, u1, v1, y, L) { const P = loc((u0 + u1) / 2, (v0 + v1) / 2); parts.push(Object.assign({ s: 'box', p: [P[0], y - 0.05, P[1]], size: [(u1 - u0) * SQ - 0.3, 0.04, (v1 - v0) * SQ - 0.3], under: true, top: false, uv: 3.5, glow: 0.4 }, L)); },
            /* a fluorescent strip on a short drop (drawn glow), along u or v */
            strip(u, v, len, alongV, y, tint) { const P = loc(u, v), sz = alongV ? [0.26, 0.07, len] : [len, 0.07, 0.26];
                parts.push({ s: 'box', p: [P[0], y - 0.32, P[1]], size: sz, tint: 0xd8dce2, under: true }, { s: 'box', p: [P[0], y - 0.34, P[1]], size: [sz[0] * 0.72, 0.03, sz[2] * 0.72], tint: tint || 0xeef6ff, glow: 1, under: true },
                    { s: 'box', p: [P[0], y - 0.25, P[1]], size: [0.02, 0.25, 0.02], tint: DARKM }); },
            /* a pendant: a cord from the ceiling (top), a shade, a lit bulb */
            pendant(u, v, y, top, shade, bulb, r) { const P = loc(u, v); r = r || 0.3;
                parts.push({ s: 'cyl', p: [P[0], y + 0.26, P[1]], r: 0.012, h: Math.max(0.05, top - y - 0.26), seg: 4, tint: 0x202020 }, Object.assign({ s: 'cyl', p: [P[0], y, P[1]], r, r2: r * 0.25, h: 0.28, seg: 14, ds: true }, shade),
                    { s: 'cyl', p: [P[0], y - 0.06, P[1]], r: r * 0.32, h: 0.14, seg: 10, tint: bulb || 0xffe2a8, glow: 1 }); },
            /* a picture light: a brass bar over a painting on edge E-side ('b'|'f'|'l'|'r') of a room line, at along (local metres) */
            picLight(side, line, along, y, w) { const n = { b: [0, 1], f: [0, -1], l: [1, 0], r: [-1, 0] }[side], c = line + (n[0] + n[1]) * 0.2, x = side === 'b' || side === 'f';
                parts.push({ s: 'box', p: x ? [along, y, c] : [c, y, along], size: x ? [w, 0.07, 0.1] : [0.1, 0.07, w], key: GOLD, glow: 0.2 }, { s: 'box', p: x ? [along, y - 0.04, c] : [c, y - 0.04, along], size: x ? [w * 0.9, 0.02, 0.05] : [0.05, 0.02, w * 0.9], tint: 0xfff0c8, glow: 1 },
                    { s: 'box', p: x ? [along, y - 0.06, line + (n[0] + n[1]) * 0.08] : [line + (n[0] + n[1]) * 0.08, y - 0.06, along], size: x ? [0.05, 0.05, 0.16] : [0.16, 0.05, 0.05], key: GOLD }); },
            /* a model hung on a wall: square-space (u, v) at the wall, turned th (0 looks at the front), at y with no catalogue mount */
            onWall(key, u, v, th, y, x) { I.prop(key, u, v, th, Object.assign({ y, mount: 0, floor: true }, x || {})); },   // floor: its y is measured from the room's ground, never from the wall's top beside it (Codex, PR #1375: paintings stood at the wall's top)
            done() { lateRows.push({ k: 'arch', id: 'arch:S:' + id + ':in', x: r3(f.x), z: r3(f.z), y: 0, rot: f.rot, parts: parts.flat(Infinity).map(clean) }); },
        };
        return I;
    };
    /* a catalogue row on main? (another district's Meshy model lands with its own PR: until then the first pass's piece stays) */
    const DATA = (() => { try { return require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'data.js'), 'utf8'); } catch (e) { return ''; } })();
    const HAS = key => new RegExp('^\\s+' + key + ':\\s+\\{', 'm').test(DATA);
    const txt = (w, sh, words, fg, bg) => 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + (Math.round(w / sh * 100) / 100);
    /* a rope line: brass posts with a red rope, from local a to b */
    const ropeLine = (P, a, b) => { const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.3) + 1);
        for (let i = 0; i < n; i++) { const t = i / (n - 1), x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; P.push({ s: 'cyl', p: [x, 0, z], r: 0.16, h: 0.05, seg: 8, key: GOLD, glow: 0.2 }, { s: 'cyl', p: [x, 0, z], r: 0.04, h: 0.95, seg: 6, key: GOLD, glow: 0.2 }); }
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]), al = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]); P.push({ s: 'box', p: [(a[0] + b[0]) / 2, 0.78, (a[1] + b[1]) / 2], size: al ? [L, 0.06, 0.05] : [0.05, 0.06, L], tint: 0xa02028 }); };

    /* ── THE MUSEUM, 8 × 7 squares, the door in square u3: the entrance hall, the rotunda under the dome with the dinosaur, Antiquity on the
       left, the Arms hall on the right, the painting gallery across the back. Partitions 4.2 m high, open above to the tall ceiling. ── */
    { const f0 = row('P04-08-B1'), I = inside('P04-08-B1', { h: 10.5, wall: WHITE, floor: MARBLE, leaf: 'leaf_wooden', leafDouble: true }), P = I.parts, h = 4.2, K = { tint: 0xe8dcc0, frame: 0x6a4a2a };
      I.wall('u', 5, 0, 8, h, [[1.5, 'leaf_wooden', 'GALLERY'], [3.5, 'leaf_wooden', 'PAINTING GALLERY'], [6.5, 'leaf_wooden', 'GALLERY']], K);
      I.wall('v', 2, 0, 5, h, [[3.5, 'leaf_wooden', 'ANTIQUITY']], K); I.wall('v', 6, 0, 5, h, [[3.5, 'leaf_wooden', 'ARMS HALL']], K);
      I.wall('u', 2, 2, 6, h, [[3.5, 'leaf_wooden', 'ROTUNDA']], K);
      P.push({ s: 'box', p: [0, h, I.loc(0, 5)[1]], size: [28, 0.18, 0.5], key: MARBLE_D, uv: 1.75 });
      /* the rotunda: the dinosaur on a marble plinth (two squares), a rope round it, pilasters on the walls */
      { const c0 = I.block(3, 3, 2, 1, 3);
        P.push({ s: 'box', p: [c0[0], 0, c0[1]], size: [6.4, 0.05, 2.9], key: MARBLE_D, uv: 1.75 },
          { s: 'box', p: [c0[0], 0, c0[1] + 1.9], size: [1.5, 0.9, 0.08], tint: 0x3a2c20 }, { s: 'quad', p: [c0[0], 0.5, c0[1] + 1.95], size: [1.4, 0.3], key: txt(1.4, 0.3, 'DINOSAUR', '#f2ead8', ''), uv: 'fit', tint: 0xffffff, kind: 'over' });
        [[-3.25, -1.5, 3.25, -1.5], [-3.25, 1.5, 3.25, 1.5], [-3.25, -1.5, -3.25, 1.5], [3.25, -1.5, 3.25, 1.5]].forEach(e => ropeLine(P, [c0[0] + e[0], c0[1] + e[1]], [c0[0] + e[2], c0[1] + e[3]]));
        /* THE SECOND PASS: the plinth holds the University's Meshy dinosaur skeleton (a museum's dinosaur is its bones); the live dinosaur
           (the race's own model, the first pass's stand-in) is kept, off the plinth on the rotunda's back right square, looking at it */
        I.prop('dinosaur_skeleton', 4, 3.5, 90);
        if (ctx.npcSpots) { const n0 = I.wld(I.loc(4.5, 4.5)[0], I.loc(4.5, 4.5)[1]); ctx.npcSpots.push({ x: n0[0], z: n0[1], face: I.fw(0), race: 'dinosaur' }); }   // (no line: it does not talk)
        [[2, 2], [6, 2], [2, 5], [6, 5]].forEach(a => { const q2 = I.loc(a[0], a[1]), dx = a[0] === 2 ? 0.3 : -0.3, dz = a[1] === 2 ? -0.3 : 0.3; P.push({ s: 'cyl', p: [q2[0] + dx, 0, q2[1] + dz], r: 0.28, h: h, seg: 10, key: MARBLE, uv: [1.75, h] }, { s: 'box', p: [q2[0] + dx, h, q2[1] + dz], size: [0.8, 0.2, 0.8], key: MARBLE_D }); });
        I.lampAt(3.5, 2.5, 6.5); I.lampAt(4.5, 2.5, 6.5); I.lampAt(3.5, 4.5, 6.5); I.lampAt(4.5, 4.5, 6.5); }
      /* the entrance hall: the ticket desk in the back right square, a rope line beside it */
      { const d0 = I.block(5, 1, 1, 1, 1.2);
        P.push({ s: 'box', p: [d0[0], 0, d0[1]], size: [2.9, 1.05, 2.9], key: U('TileMarble2d'), uv: 1.75 }, { s: 'box', p: [d0[0], 1.05, d0[1]], size: [3.1, 0.08, 3.1], key: WHITE, tint: 0x5a3c22 },
          { s: 'quad', p: [d0[0] - 1.47, 0.35, d0[1]], ry: 90, size: [2.2, 0.42], key: txt(2.2, 0.42, 'TICKETS', '#f2ead8', ''), uv: 'fit', tint: 0xffffff, kind: 'over' });
        const a = I.loc(4.15, 0.3), b = I.loc(4.15, 1.7); ropeLine(P, a, b);
        I.prop('psx_planter_pot_mp_1_full', 2.3, 0.3, 0); I.prop('psx_planter_pot_mp_1_full', 5.7, 0.3, 0); I.lampAt(4, 1, 6.5); }
      /* Antiquity: statues and the sarcophagus down the outer wall, the walk along the inner one */
      I.block(0, 0, 1, 1, 2.5); I.prop('demon_statue', 0.5, 0.5, 90); I.block(0, 2, 1, 1, 1.4); I.prop('sarcophagus', 0.5, 2.5, 0); I.block(0, 4, 1, 1, 2.5); I.prop('angel_statue', 0.5, 4.5, 90);
      [1.5, 3.5].forEach(v => { const q2 = I.loc(0.5, v); P.push({ s: 'cyl', p: [q2[0] - 1.2, 0, q2[1]], r: 0.3, h: 1.1, seg: 10, key: MARBLE_D, uv: [1.75, 1.1] }); I.prop(HAS('marble_bust') ? 'marble_bust' : 'decor_trophy_cup', 0.5 - 1.2 / 3.5, v, 90, HAS('marble_bust') ? { y: 1.1, h: 0.75, floor: true } : { y: 1.1, floor: true }); });   // the plan's busts (Financial's Meshy bust once its row is on main); the cups moved to the gym's trophy room
      I.lampAt(1, 1.5, 6.5); I.lampAt(1, 3.5, 6.5);
      /* the Arms hall: cabinets and armour stands down the outer wall */
      [0, 2, 4].forEach(v => { I.block(7, v, 1, 1, 2.2); I.prop('psx_display_cabinet_mp_1', 7.5, v + 0.5, 270, { h: 2.4 }); });
      [1, 3].forEach(v => { I.block(7, v, 1, 1, 2.2); I.prop('armour_stand', 7.5, v + 0.5, 270); const q2 = I.loc(7.5, v + 0.5); P.push({ s: 'cyl', p: [q2[0], 0, q2[1]], r: 1.1, h: 0.14, seg: 16, key: MARBLE_D, uv: 1.75 }); });
      I.prop('decor_armour_plinth', 6.2, 0.2, 0); I.prop('decor_armour_plinth', 6.2, 4.8, 0); I.lampAt(7, 1.5, 6.5); I.lampAt(7, 3.5, 6.5);
      /* the painting gallery: paintings on the back wall, two benches on square middles in the back row */
      /* (THE SECOND PASS: the eight painted boards are gilt-framed Meshy oils now, one a square, each under a brass picture light) */
      [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5].forEach((u, i) => { const k = ['painting_landscape', 'painting_portrait', 'painting_seascape', 'painting_portrait'][i % 4], H0 = { painting_landscape: [1.05, 1.69], painting_portrait: [1.2, 1.4], painting_seascape: [1.15, 1.46] }[k];
        I.onWall(k, u, 7 - 0.42 / 3.5, 0, H0[0]); I.picLight('b', I.loc(0, 7)[1] + 0.31, I.loc(u, 0)[0], H0[0] + H0[1] + 0.14, 1.0); });
      I.block(2, 6, 1, 1, 0.9); I.prop('gallery_ottoman', 2.5, 6.5, 0); I.block(5, 6, 1, 1, 0.9); I.prop('gallery_ottoman', 5.5, 6.5, 0);
      [1, 3, 5, 7].forEach(u => I.lampAt(u, 6, 6.5));
      /* ═══ THE SECOND PASS: THE MUSEUM (the atmosphere). A hushed, warm, old museum: each hall its own colour under a gilt picture rail at
         the partitions' top (4.2 m), warm stone above it up to a lit coffered ceiling, a red runner from the door to the dinosaur, gilt-framed
         oils under picture lights on an oxblood wall, a crystal chandelier over the skeleton and two library chandeliers over the gallery. ═══ */
      { const H = I.H, TR = { key: GOLD, glow: 0.15 }, WOOD = { key: 'calm_planks', tint: 0x4a2e1c, uv: 1.4 }, ST = { key: 'calm_marble', tint: 0xf0e2c4, gain: 1.1, glow: 0.12 };
        /* the halls: entrance (cream stucco over walnut), rotunda (warm stone over dark marble), Antiquity (Pompeian red over black),
           the Arms hall (navy over oak), the gallery (oxblood over walnut, a parquet floor) */
        I.liner(2, 0, 6, 2, h, { key: STUCCO, tint: 0xf4e4c4, gain: 1.15, glow: 0.12 }, WOOD, 1.1, TR);
        I.liner(2, 2, 6, 5, h, ST, { key: MARBLE_D, uv: 1.75 }, 0.9, TR);
        I.liner(0, 0, 2, 5, h, { key: WHITE, tint: 0xa8402c, gain: 1.2, glow: 0.1 }, { key: DARK, tint: 0x24201c, glow: 0.05 }, 1.0, TR);
        I.liner(6, 0, 8, 5, h, { key: WHITE, tint: 0x2c3e66, gain: 1.2, glow: 0.1 }, { key: 'calm_planks', tint: 0x6a4a2c, uv: 1.4 }, 1.2, TR);
        I.liner(0, 5, 8, 7, h, { key: WHITE, tint: 0x6a1e24, gain: 1.25, glow: 0.1 }, WOOD, 0.85, TR);
        I.floorOf(0, 5, 8, 7, { key: 'calm_planks', tint: 0xb07a4a, uv: 1.2 }, 0.3, 0.045);
        /* above the partitions: warm stone to the ceiling, a cornice, a lit coffered ceiling (gilt beams on every square line) */
        I.coat(0, 0, I.NU, I.NV, h, H, ST); I.band(0, 0, I.NU, I.NV, h - 0.02, 0.24, 0.16, TR); I.band(0, 0, I.NU, I.NV, H - 0.5, 0.5, 0.22, { key: 'calm_marble', tint: 0xe8d8b8 });
        I.ceilLit(0, 0, I.NU, I.NV, H, { key: 'calm_marble', tint: 0xfff4dc, glow: 0.55 });
        for (let u = 1; u < I.NU; u++) { const x = I.loc(u, 0)[0]; P.push({ s: 'box', p: [x, H - 0.42, 0], size: [0.3, 0.36, I.NV * 3.5 - 0.5], key: GOLD, tint: 0xc8a050, under: true, glow: 0.1 }); }
        for (let v = 1; v < I.NV; v++) { const z = I.loc(0, v)[1]; P.push({ s: 'box', p: [0, H - 0.42, z], size: [I.NU * 3.5 - 0.5, 0.36, 0.3], key: GOLD, tint: 0xc8a050, under: true, glow: 0.1 }); }
        /* the red runner: from the front door to the rotunda's doorway, and round the plinth's rope */
        { const a = I.loc(3.38, 0), b = I.loc(3.38, 2); P.push({ s: 'quad', flat: true, p: [a[0], 0.045, (a[1] + b[1]) / 2], size: [1.6, Math.abs(a[1] - b[1]) - 0.3], key: 'calm_carpet', tint: 0x8a1a22, uv: 1.2 }, { s: 'quad', flat: true, p: [a[0], 0.05, (a[1] + b[1]) / 2], size: [1.3, Math.abs(a[1] - b[1]) - 0.3], key: 'calm_carpet', tint: 0x9e2228, uv: 1.2 }); }
        /* the rotunda: the crystal chandelier over the skeleton on a chain from the ceiling; MUSEUM OF THE CITY over the rotunda's doorway */
        { const c = I.loc(4, 3.5); I.prop('crystal_chandelier', 4, 3.5, 0, { y: 7.2, h: 1.6, floor: true }); P.push({ s: 'cyl', p: [c[0], 8.75, c[1]], r: 0.03, h: H - 8.75, seg: 5, tint: 0x8a7040 }); }
        { const q2 = I.loc(4, 2); P.push({ s: 'quad', p: [q2[0], 3.05, q2[1] + 0.14], size: [5.6, 0.5], key: txt(5.6, 0.5, 'MUSEUM OF THE CITY', '#e8c870', ''), uv: 'fit', tint: 0xffffff, kind: 'over' }); }
        /* the gallery: two library chandeliers hung over the benches */
        [2.5, 5.5].forEach(u => { const c = I.loc(u, 6.5); I.prop('library_chandelier', u, 6.5, 0, { y: 5.8, h: 1.1, floor: true }); P.push({ s: 'cyl', p: [c[0], 6.9, c[1]], r: 0.025, h: H - 6.9, seg: 5, tint: 0x5a4a30 }); });
        /* Antiquity: two black-figure amphorae and a coin case along the inner wall (off the walk's middle) */
        I.prop('greek_amphora', 1.83, 0.55, 270); I.prop('museum_vitrine', 1.8, 1.55, 270); I.prop('greek_amphora', 1.83, 2.55, 270); I.prop('museum_vitrine', 1.8, 4.45, 270);
        /* the Arms hall: shield-and-sword plaques on the inner wall (either side of its doorway), banners high on the outer wall */
        I.onWall('arms_trophy', 6 + 0.2 / 3.5, 1.5, 90, 2.3); I.onWall('arms_trophy', 6 + 0.2 / 3.5, 4.5, 90, 2.3);
        [1, 2.5, 4].forEach(v => I.onWall('banner', 8 - 0.28 / 3.5, v, 270, 6.2));
        /* the entrance hall: the grandfather clock in the front left corner, a bench of the museum's own by the ticket desk's rope */
        I.prop('gclock', 2.17, 1.8, 90); I.prop('gallery_ottoman', 4.6, 0.25, 180, { h: 0.5 }); }
      I.done(); }

    /* ── THE TRAINING GYM, 8 × 8 squares, the door in square u4: lobby (front desk), office and trophy room across the front under a low
       ceiling, the tall main hall (ring, heavy bags, weights, the mat), the locker room across the back. ── */
    { const I = inside('P06-10-B1', { h: 7, wall: T_RED, floor: RUBBER, leaf: 'leaf_exit', leafDouble: true }), P = I.parts, h = 3.3, K = { key: WHITE, tint: 0xd8d2c4 };
      I.wall('u', 2, 0, 8, h, [[4.5, 'leaf_exit', 'MAIN HALL', 1]], K); I.wall('u', 6, 0, 8, h, [[4.5, 'leaf_exit', 'LOCKER ROOM', 1]], K);
      I.wall('v', 3, 0, 2, h, [[0.5, 'leaf_office', 'OFFICE']], K); I.wall('v', 5, 0, 2, h, [[0.5, 'leaf_office', 'TROPHY ROOM']], K);
      I.ceil(0, 0, 8, 2, h); I.ceil(0, 6, 8, 8, h);
      /* the ring: a deck on four squares, corner posts, three ropes, the apron lettered */
      { const c0 = I.block(3, 3, 2, 2, 2.2), R = 3.0;
        P.push({ s: 'box', p: [c0[0], 0, c0[1]], size: [6.5, 0.9, 6.5], key: BLUEP, tint: 0x3050a0, uv: 3.5 }, { s: 'box', p: [c0[0], 0.9, c0[1]], size: [6.6, 0.08, 6.6], key: WHITE, tint: 0xe8e4d8, uv: 3.5 });
        [[-1, -1, 0xb02020], [1, 1, 0x2040b0], [-1, 1, 0xf0f0f0], [1, -1, 0xf0f0f0]].forEach(a => P.push({ s: 'cyl', p: [c0[0] + a[0] * R, 0.98, c0[1] + a[1] * R], r: 0.1, h: 1.35, seg: 8, tint: 0xd0d0d0 }, { s: 'box', p: [c0[0] + a[0] * (R - 0.14), 1.25, c0[1] + a[1] * (R - 0.14)], size: [0.34, 1.0, 0.34], tint: a[2] }));
        [1.35, 1.75, 2.15].forEach((y, i) => { const col = [0xb02020, 0xf0f0f0, 0x2040b0][i]; [-1, 1].forEach(sd => P.push({ s: 'box', p: [c0[0], y, c0[1] + sd * R], size: [2 * R, 0.05, 0.05], tint: col }, { s: 'box', p: [c0[0] + sd * R, y, c0[1]], size: [0.05, 0.05, 2 * R], tint: col })); });
        [[0, 3.26, 0], [0, -3.26, 180], [3.26, 0, -90], [-3.26, 0, 90]].forEach(a => P.push({ s: 'quad', p: [c0[0] + a[0], 0.22, c0[1] + a[1]], ry: a[2], size: [4.4, 0.46], key: txt(4.4, 0.46, 'TRAINING GYM', '#f2ead8', ''), uv: 'fit', tint: 0xffffff, kind: 'over' }));
        [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(a => { const y = I.H; P.push({ s: 'box', p: [c0[0] + a[0], y - 1.0, c0[1] + a[1]], size: [0.04, 1.0, 0.04], tint: DARKM }, { s: 'cyl', p: [c0[0] + a[0], y - 1.3, c0[1] + a[1]], r: 0.6, r2: 0.2, h: 0.3, seg: 10, tint: DARKM }, { s: 'cyl', p: [c0[0] + a[0], y - 1.36, c0[1] + a[1]], r: 0.45, h: 0.06, seg: 10, tint: LAMP, glow: 1 }); }); }
      /* heavy bags on the left wall: a square each, a bracket off the wall, a chain, the bag */
      [2, 4].forEach(v => { const b0 = I.block(0, v, 1, 1, 2.4);
        P.push({ s: 'box', p: [b0[0] - 0.85, 3.3, b0[1]], size: [1.9, 0.12, 0.12], tint: DARKM }); I.prop('punching_bag', 0.5, v + 0.5, 90, { y: 1.0, floor: true }); });   // (THE SECOND PASS: Southside's Meshy bag + chains in place of the drawn cylinder, its top at the bracket)
      /* the weights corner (right wall): Southside's Meshy dumbbell rack against the wall, its weight bench beside it (THE SECOND PASS: in place
         of the drawn box rack and the two box benches), all off the squares' middles */
      I.prop('dumbbell_rack', 7.8, 4.5, 270); I.prop('weight_bench', 7.7, 5.5, 270);
      /* the wrestling mat: on the floor, walked over */
      { const m0 = I.loc(7, 3); P.push({ s: 'box', p: [m0[0], 0, m0[1]], size: [6.6, 0.07, 6.6], key: RUB_Y, tint: 0x3a78c8, uv: 1.75 }, { s: 'cyl', p: [m0[0], 0.07, m0[1]], r: 2.2, h: 0.012, seg: 28, tint: 0xf0e8d0 }, { s: 'cyl', p: [m0[0], 0.082, m0[1]], r: 2.05, h: 0.012, seg: 28, key: RUB_Y, tint: 0x3a78c8, uv: 1.75 }); }
      [[1.5, 3], [1.5, 5], [6.5, 4.6]].forEach(a => I.lampAt(a[0], a[1], I.H));
      P.push({ s: 'quad', p: [0, 4.6, I.loc(0, 6)[1] + 0.13], size: [9, 0.9], key: txt(9, 0.9, 'NO PAIN NO GAIN', '#f2ead8', ''), uv: 'fit', tint: 0xffffff, kind: 'over' });
      P.push({ s: 'box', p: [0, h + 0.14, I.loc(0, 6)[1] - 3.5], size: [28, 3.2, 7], faces: 'f', top: false, key: T_RED, uv: 3.5 }, { s: 'box', p: [0, h + 0.14, I.loc(0, 2)[1] + 3.5], size: [28, 3.2, 7], faces: 'b', top: false, key: T_RED, uv: 3.5 });
      /* the locker room: lockers along the back wall (whole squares), a bench on a square's middle each side */
      [0, 1, 2, 5, 6, 7].forEach(u => { I.block(u, 7, 1, 1, 2); [0.2, 0.5, 0.8].forEach(t => I.prop('office_locker', u + t, 7.82, 0)); });
      I.block(1, 6, 1, 1, 0.6); I.prop('locker_bench', 1.5, 6.5, 0); I.block(6, 6, 1, 1, 0.6); I.prop('locker_bench', 6.5, 6.5, 0);
      I.lampAt(2.5, 6.6, h); I.lampAt(5.5, 6.6, h);
      /* the lobby: the front desk in square (3, 1), a vending machine against the right wall */
      { const d0 = I.block(3, 1, 1, 1, 1.2);
        P.push({ s: 'box', p: [d0[0], 0, d0[1]], size: [2.8, 1.05, 2.6], key: M_RED, uv: 1.2 }, { s: 'box', p: [d0[0], 1.05, d0[1]], size: [3.0, 0.08, 2.8], tint: 0x2a2a2a },
          { s: 'quad', p: [d0[0] + 1.41, 0.34, d0[1]], ry: -90, size: [2.0, 0.4], key: txt(2.0, 0.4, 'FRONT DESK', '#f2ead8', ''), uv: 'fit', tint: 0xffffff, kind: 'over' });
        I.prop('vending_machine', 4.85, 1.25, 270); I.lampAt(4, 1, h); }
      /* the office: a desk on a square's middle, a chair, a filing cabinet and a clock on the walls */
      I.block(1, 1, 1, 1, 1); I.prop('tanker_desk', 1.5, 1.5, 0); I.prop('office_chair', 1.5, 1.85, 180); I.prop('filing_cabinet', 0.15, 1.8, 90); I.prop('potted_plant', 0.2, 0.2, 0); I.lampAt(1.5, 0.8, h);
      /* the trophy room: the case along the back wall (two squares), cups on a plinth */
      I.block(6, 1, 2, 1, 2.1); I.prop('trophy_case', 6.5, 1.84, 0); I.prop('trophy_case', 7.5, 1.84, 0);
      [7.7, 6.95, 6.2].forEach(u => { const q2 = I.loc(u, 0.3); P.push({ s: 'cyl', p: [q2[0], 0, q2[1]], r: 0.3, h: 1.0, seg: 10, key: MARBLE_D, uv: [1.75, 1] }); I.prop('decor_trophy_cup', u, 0.3, 0, { y: 1.0, floor: true }); });   // (the second pass: the museum's two cups moved here)
      I.lampAt(6.5, 0.8, h);
      /* ═══ THE SECOND PASS: THE TRAINING GYM (the atmosphere). An old-school fight gym: the main hall's red tile over a charcoal dado with a
         white stripe, steel trusses with strip lights and bunting under a lit roof, the real gear (bags, rack, bench, a squat cage, rowers on
         the wall, treadmills, bikes, speed bags); a cream lobby and a green office under lit ceilings, a panelled trophy room, a white-tiled
         locker room with showers. ═══ */
      { const H = I.H, h0 = h + 0.14, WH = { tint: 0xf2f0ea, glow: 0.2 }, DADO = { key: DARK, tint: 0x34363a, glow: 0.05 }, PANEL = { key: 'calm_planks', tint: 0x5a3a24, uv: 1.4 };
        /* the main hall: the dado + its stripe on the tall walls (the red tile above is the building's own) */
        I.coat(0, 2, 8, 6, 0, 1.3, DADO); I.band(0, 2, 8, 6, 1.3, 0.12, 0.04, WH); I.band(0, 2, 8, 6, 0, 0.16, 0.05, { tint: 0x1c1c1e });
        /* the roof: a lit corrugated ceiling, three steel trusses across, strip lights between them, bunting along the hall */
        I.ceilLit(0, 2, 8, 6, H, { key: M_GREY, tint: 0xc8ccd0, glow: 0.3 });
        [2.6, 4, 5.4].forEach(v => { const z = I.loc(0, v)[1]; P.push({ s: 'box', p: [0, H - 0.9, z], size: [I.NU * 3.5 - 0.5, 0.8, 0.22], key: TRUSS, tint: 0x8a9098, uv: 0.8, under: true, ds: true }); });
        [1, 3, 5, 7].forEach(u => [3.3, 4.7].forEach(v => I.strip(u, v, 2.6, true, H - 0.6)));
        [3.3, 4.7].forEach((v, k) => { const z = I.loc(0, v)[1], n = 26, L = I.NU * 3.5 - 1.2; P.push({ s: 'box', p: [0, 5.15, z], size: [L, 0.015, 0.015], tint: 0x202020 });
          for (let i = 0; i < n; i++) P.push({ s: 'cyl', p: [-L / 2 + (i + 0.5) * L / n, 4.75, z], r: 0.01, r2: 0.18, h: 0.4, seg: 3, ry: 90, tint: [0xc82828, 0xf2f0ea, 0x2848a8][(i + k) % 3], glow: 0.2 }); });
        /* the gear: a squat cage in the back left corner, a rower against the left wall between the bags, two treadmills against the back
           wall (their runners face it), three bikes against the front wall, speed bags + gloves on the walls, a medicine-ball rack on the mat */
        I.block(0, 5, 1, 1, 2.3); I.prop('squat_rack', 0.5, 5.5, 90);
        I.block(0, 3, 1, 1, 0.8); I.prop('rowing_machine', 0.5, 3.5, 0);
        I.block(5, 5, 1, 1, 1.4); I.prop('treadmill', 5.5, 5.5, 0); I.block(6, 5, 1, 1, 1.4); I.prop('treadmill', 6.5, 5.5, 0);
        [1.3, 1.9, 2.5].forEach(u => I.prop('exercise_bike', u, 2.24, 180));
        [1.5, 2.6].forEach(u => I.onWall('speed_bag', u, 6 - 0.55 / 3.5, 0, 1.45));
        I.onWall('boxing_gloves', 0.12, 3.05, 90, 1.5); I.onWall('boxing_gloves', 0.12, 4.95, 90, 1.5); I.prop('water_cooler', 3.4, 2.12, 180);
        I.prop('medicine_ball_rack', 7.83, 2.35, 270);
        /* the lobby: cream over charcoal with a red stripe, a lit ceiling, the notice board, a clock over the hall's door, a mat */
        I.liner(3, 0, 5, 2, h, { key: STUCCO, tint: 0xf2e6cc, gain: 1.1, glow: 0.15 }, DADO, 1.1, { tint: 0xb02828, glow: 0.1 }); I.ceilLit(3, 0, 5, 2, h, { key: U('FibreCeilingTile1a'), tint: 0xfff6e4, glow: 0.45 });
        I.onWall('notice_board', 3.45, 2 - 0.14 / 3.5, 0, 1.2); I.onWall('wall_clock', 4.5, 2 - 0.14 / 3.5, 0, 2.55); I.prop('doormat', I.doors[0].m, 0.2, 0);
        /* the office: green over oak panelling, a lit ceiling, a rug under the desk, a chalkboard + a clock */
        I.liner(0, 0, 3, 2, h, { key: WHITE, tint: 0x5f7a58, gain: 1.15, glow: 0.12 }, PANEL, 1.0, { key: 'calm_planks', tint: 0x3a2414 }); I.ceilLit(0, 0, 3, 2, h, { key: U('FibreCeilingTile1a'), tint: 0xfff2dc, glow: 0.45 });
        I.prop('rug_office', 1.5, 1.5, 0); I.onWall('chalkboard', 0.08, 0.9, 90, 1.0); I.onWall('wall_clock', 2.4, 2 - 0.14 / 3.5, 0, 2.5);
        /* the trophy room: deep green over dark panelling to the rail, gold trim, a runner, HALL OF FAME over the cases under picture lights */
        I.liner(5, 0, 8, 2, h, { key: WHITE, tint: 0x24483a, gain: 1.2, glow: 0.1 }, PANEL, 1.3, { key: GOLD, glow: 0.15 }); I.ceilLit(5, 0, 8, 2, h, { key: U('FibreCeilingTile1a'), tint: 0xffecc8, glow: 0.4 });
        { const q2 = I.loc(7, 2); P.push({ s: 'quad', p: [q2[0], 2.4, q2[1] + 0.14], size: [3.4, 0.42], key: txt(3.4, 0.42, 'HALL OF FAME', '#e8c870', ''), uv: 'fit', tint: 0xffffff, kind: 'over' }); [6.5, 7.5].forEach(u => I.picLight('b', q2[1] + 0.11, I.loc(u, 0)[0], 2.25, 1.4)); }
        { const a = I.loc(5.1, 0.5), b = I.loc(7.9, 0.5); P.push({ s: 'quad', flat: true, p: [(a[0] + b[0]) / 2, 0.045, a[1]], size: [Math.abs(b[0] - a[0]), 1.2], key: 'calm_carpet', tint: 0x7a1a20, uv: 1.2 }); }
        /* the locker room: white tile to 1.8 m under pale blue, a lit ceiling, strips, two showers against the back wall in the middle */
        I.liner(0, 6, 8, 8, h, { key: WHITE, tint: 0xb8cad8, gain: 1.15, glow: 0.15 }, { key: U('TileSubway1a'), tint: 0xf4f6f8, gain: 1.1, glow: 0.12, uv: 1.75 }, 1.8, { tint: 0x4a6a8a });
        I.ceilLit(0, 6, 8, 8, h, { key: U('FibreCeilingTile1a'), tint: 0xf4fbff, glow: 0.45 }); [1.5, 6.5].forEach(u => I.strip(u, 7, 2.4, false, h + 0.2));
        I.block(3, 7, 1, 1, 2.1); I.prop('shower_stall', 3.5, 7.82, 0); I.block(4, 7, 1, 1, 2.1); I.prop('shower_stall', 4.5, 7.82, 0);
        I.prop('laundry_cart', 3.2, 6.25, 0); I.onWall('wall_clock', 2.6, 6 + 0.14 / 3.5, 180, 2.5); }
      I.done(); }

    /* ── THE EQUIPMENT DEPOT, 9 × 3 squares, the door in square u3: bay A (field gear), the grounds office (the door opens into it), bay B
       (stores), bay C (workshop). ── */
    { const I = inside('P06-11-B1', { h: 3.5, wall: CONCW, floor: CONC, leaf: 'leaf_security', leafDouble: true }), P = I.parts, h = I.H, K = { key: M_GREY, tint: 0xb8bcc0, frame: 0x30343a };
      I.wall('v', 2, 0, 3, h, [[0.5, 'leaf_security', 'BAY A']], K); I.wall('v', 4, 0, 3, h, [[0.5, 'leaf_security', 'BAY B']], K); I.wall('v', 7, 0, 3, h, [[0.5, 'leaf_security', 'BAY C']], K);
      /* bay A: shelving across the back (two squares), cones, footballs and the line marker along the left wall */
      [0, 1].forEach(u => { I.block(u, 2, 1, 1, 1.8); [0.25, 0.75].forEach(t => I.prop('metal_shelving', u + t, 2.85, 0)); });
      [0.5, 0.75, 1.0].forEach(v => I.prop('traffic_cone', 0.14, v, 0)); I.prop('football', 0.2, 1.4, 0); I.prop('football', 0.3, 1.55, 40); I.prop('football', 0.16, 1.7, 80);
      I.prop('line_marker', 1.78, 1.7, 90);   // (THE SECOND PASS: the Meshy line-marking cart in place of the three drawn boxes)
      /* the grounds office: the desk on the back square's middle, lockers and the time clock on the walls */
      I.block(3, 2, 1, 1, 1); I.prop('tanker_desk', 3.5, 2.5, 0); I.prop('office_chair', 3.5, 2.85, 180); [1.4, 1.65, 1.9].forEach(v => I.prop('office_locker', 2.16, v, 90)); I.prop('punch_clock', 3.86, 1.5, 270);
      /* bay B: shelving across the back (three squares), a crate stack on one square, a pallet of boxes by the wall */
      [4, 5, 6].forEach(u => { I.block(u, 2, 1, 1, 1.8); [0.25, 0.75].forEach(t => I.prop('metal_shelving', u + t, 2.85, 0)); });
      I.block(6, 1, 1, 1, 1.6); I.prop('psx_wooden_crate_3', 6.3, 1.3, 0); I.prop('psx_wooden_crate_3', 6.7, 1.35, 20); I.prop('psx_wooden_crate_3', 6.35, 1.7, 0); I.prop('psx_wooden_crate_5', 6.7, 1.72, 0); I.prop('psx_wooden_crate_1', 6.45, 1.45, 30, { y: 1.08 });
      I.prop('psx_supply_crate_1', 4.2, 1.8, 0); I.prop('psx_supply_crate_1_2', 4.2, 1.6, 15); I.prop('cardboard_boxes', 6.8, 0.2, 0);
      /* bay C: the steel work tables across the back (two squares), a barrel, sandbags */
      [7, 8].forEach(u => { I.block(u, 2, 1, 1, 1); I.prop('steel_table', u + 0.5, 2.5, 0); });
      I.prop('psx_metal_barrel_mp_1', 8.8, 1.8, 0); I.prop('psx_metal_barrel_mp_2', 8.8, 1.55, 0); I.prop('meshy_sandbags', 8.7, 0.25, 90); I.prop('utility_box', 7.14, 1.7, 90);
      [1, 3, 5.5, 8].forEach(u => I.lampAt(u, 1.2, h));
      /* ═══ THE SECOND PASS: THE EQUIPMENT DEPOT (the atmosphere). A working groundskeeper's store: blue-grey painted block to 1.2 m under a
         safety-yellow band in the bays, the aisles lined in yellow on the floor, strip lights under a lit corrugated ceiling, the field gear
         itself (a tackling sled in the stores, the ride-on mower in the workshop by the tools, a ball cage by bay A's door); the office pale
         green over oak, a lit ceiling, a clock, the notice board, the water cooler. ═══ */
      { const H = I.H, BAND = { tint: 0xe8b818, glow: 0.2 }, LOW = { key: CONCW, tint: 0x6a7a8c, gain: 1.1, glow: 0.08 };
        [[0, 2], [4, 7], [7, 9]].forEach(r => { I.coat(r[0], 0, r[1], 3, 0, 1.2, LOW); I.band(r[0], 0, r[1], 3, 1.2, 0.12, 0.03, BAND); I.band(r[0], 0, r[1], 3, 0, 0.14, 0.05, { tint: 0x26282c });
          I.ceilLit(r[0], 0, r[1], 3, H, { key: M_GREY, tint: 0xd0d4d8, glow: 0.3 });
          const a = I.loc(r[0], 1)[0] + 0.3, b = I.loc(r[1], 1)[0] - 0.3, z = I.loc(0, 1.97)[1]; P.push({ s: 'quad', flat: true, p: [(a + b) / 2, 0.045, z], size: [Math.abs(b - a), 0.1], tint: 0xe8c020, glow: 0.15 });
          for (let u = r[0]; u < r[1]; u++) I.strip(u + 0.5, 1.7, 2.4, false, H); });
        I.liner(2, 0, 4, 3, H, { key: WHITE, tint: 0xb8d4b0, gain: 1.15, glow: 0.12 }, { key: 'calm_planks', tint: 0x7a5434, uv: 1.4 }, 1.0, { key: 'calm_planks', tint: 0x4a3020 }, { noCrown: true });
        I.ceilLit(2, 0, 4, 3, H, { key: U('FibreCeilingTile1a'), tint: 0xfff4e0, glow: 0.45 });
        I.onWall('notice_board', 2.5, 3 - 0.3 / 3.5, 0, 1.25); I.onWall('wall_clock', 3.5, 3 - 0.3 / 3.5, 0, 2.55); I.prop('water_cooler', 3.82, 1.05, 270);
        /* the gear */
        I.prop('ball_cart', 1.0, 0.2, 180);
        I.block(5, 1, 1, 1, 1.4); I.prop('tackling_sled', 5.5, 1.5, 0);
        I.block(8, 1, 1, 1, 1.2); I.prop('ride_on_mower', 8.42, 1.5, 0);
        [7.5, 8.5].forEach(u => I.onWall('tool_pegboard', u, 3 - 0.3 / 3.5, 0, 1.25)); I.prop('tool_chest', 7.17, 1.15, 90); }
      I.done(); }

    /* ── THE SOUTH GATE TICKET HALL, 9 × 3 squares, the door in square u3: the ticket hall (a counter with four windows across the back),
       the stewards' room, security + lost property. No turnstiles: the building has the one doorway, so there is no way through it. ── */
    { const I = inside('P07-11-B1', { h: 3.5, wall: WHITE, floor: T_CHECK, leaf: 'leaf_lobby_glass_double' }), P = I.parts, h = I.H, K = { tint: 0xf2dcae, frame: 0x2a4a9a };
      I.wall('v', 4, 0, 3, h, [[0.5, 'leaf_office', 'STEWARDS']], K); I.wall('v', 7, 0, 3, h, [[0.5, 'leaf_security', 'SECURITY']], K);
      /* the counter: three squares across the back, a glass screen with four windows, the fascia lettered */
      { const c0 = I.block(0, 2, 3, 1, 3), fz = c0[1] + 1.45;
        P.push({ s: 'box', p: [c0[0], 0, fz - 0.3], size: [10.3, 1.05, 0.6], key: BLUEP, tint: 0x3b62c4, uv: 1.75 }, { s: 'box', p: [c0[0], 1.05, fz - 0.25], size: [10.4, 0.07, 0.8], key: MARBLE, uv: 1.75 },
          { s: 'box', p: [c0[0], 2.35, fz - 0.3], size: [10.3, h - 2.35, 0.3], key: WHITE, tint: 0xf2dcae, uv: 3.5 },
          { s: 'quad', p: [c0[0], 2.5, fz - 0.14], size: [5.2, 0.5], key: txt(5.2, 0.5, 'TICKETS', '#ffffff', '#2a4a9a'), uv: 'fit', tint: 0xffffff });
        [-3.85, -1.28, 1.28, 3.85].forEach((x, i) => P.push({ s: 'quad', p: [c0[0] + x, 1.12, fz - 0.3], size: [2.2, 1.23], key: G_SQ, uv: 'fit', ds: true }, { s: 'quad', p: [c0[0] + x, 1.95, fz - 0.28], size: [0.5, 0.26], key: txt(0.5, 0.26, String(i + 1), '#ffffff', '#2a4a9a'), uv: 'fit', tint: 0xffffff }));
        [-5.15, -2.57, 0, 2.57, 5.15].forEach(x => P.push({ s: 'box', p: [c0[0] + x, 1.12, fz - 0.3], size: [0.14, 1.23, 0.14], tint: 0x2a4a9a })); }
      { const a = I.loc(0.75, 1.82), b = I.loc(2.25, 1.82); ropeLine(P, a, b); }
      I.block(0, 0, 1, 1, 0.9); I.prop('metro_bench', 0.5, 0.5, 90); I.prop('vending_machine', 3.85, 1.6, 270); I.prop('psx_planter_pot_mp_1_full', 2.2, 0.2, 0);
      /* the stewards' room: a steel table on the back middle square, chairs, lockers on the back wall */
      I.block(5, 2, 1, 1, 1); I.prop('steel_table', 5.5, 2.5, 0); I.prop('folding_chair', 5.2, 2.1, 160); I.prop('folding_chair', 5.8, 2.1, 200);
      [4.2, 4.45, 4.7, 6.3, 6.55, 6.8].forEach(u => I.prop('office_locker', u, 2.84, 0)); I.prop('punch_clock', 6.86, 1.5, 270);
      /* security: the monitor wall on the back square, the lost property shelf on the right wall's middle square */
      I.block(7, 2, 1, 1, 2.2); I.prop('monitor_stack', 7.5, 2.84, 0); I.prop('office_chair', 7.5, 2.2, 180);
      I.block(8, 1, 1, 1, 2); I.prop('lost_shelf', 8.84, 1.5, 270);
      [1.5, 3, 5.5, 8].forEach(u => I.lampAt(u, 1.2, h));
      /* ═══ THE SECOND PASS: THE SOUTH GATE (the atmosphere). Match-day in the club's colours: cream walls over a navy dado with a red rail,
         a lit ceiling, strips, bunting across the hall, the self-service ticket machines by the door, a scarf stand, SOUTH GATE painted on the
         wall; the stewards' room grey-green with its notice board and water cooler; security dim blue with the walk-through arch. ═══ */
      { const H = I.H, RED = { tint: 0xb82830, glow: 0.12 }, NAVY = { key: WHITE, tint: 0x22345c, gain: 1.15, glow: 0.06 };
        I.liner(0, 0, 4, 3, H, { key: STUCCO, tint: 0xf4e8cc, gain: 1.1, glow: 0.15 }, NAVY, 1.2, RED, { noCrown: true }); I.ceilLit(0, 0, 4, 3, H, { key: U('FibreCeilingTile1a'), tint: 0xfff8ea, glow: 0.45 });
        [1, 2].forEach(v => I.strip(2, v, 2.4, false, H));
        { const z = I.loc(0, 0.95)[1], a = I.loc(0.1, 0)[0], b = I.loc(3.9, 0)[0], n = 22, L = Math.abs(b - a), x0 = Math.min(a, b);
          P.push({ s: 'box', p: [(a + b) / 2, 3.02, z], size: [L, 0.015, 0.015], tint: 0x202020 });
          for (let i = 0; i < n; i++) P.push({ s: 'cyl', p: [x0 + (i + 0.5) * L / n, 2.66, z], r: 0.01, r2: 0.16, h: 0.36, seg: 3, ry: 90, tint: [0x2a4a9a, 0xf2f0ea, 0xb82830][i % 3], glow: 0.2 }); }
        { const q2 = I.loc(0, 1.5); P.push({ s: 'quad', p: [q2[0] + 0.28, 2.1, q2[1]], ry: 270, size: [3.4, 0.55], key: txt(3.4, 0.55, 'SOUTH GATE', '#2a4a9a', ''), uv: 'fit', tint: 0xffffff, kind: 'over' }); }
        I.prop('ticket_machine', 1.3, 0.16, 180); I.prop('ticket_machine', 1.8, 0.16, 180); I.prop('scarf_rack', 0.22, 1.35, 90);
        I.liner(4, 0, 7, 3, H, { key: WHITE, tint: 0xc8d2c4, gain: 1.15, glow: 0.12 }, { key: WHITE, tint: 0x5a6e60, gain: 1.1, glow: 0.06 }, 1.1, { tint: 0x2a3a30 }, { noCrown: true });
        I.ceilLit(4, 0, 7, 3, H, { key: U('FibreCeilingTile1a'), tint: 0xf8fbff, glow: 0.4 }); I.onWall('notice_board', 4 + 0.14 / 3.5, 1.6, 90, 1.2); I.prop('water_cooler', 6.8, 1.02, 270);
        I.liner(7, 0, 9, 3, H, { key: WHITE, tint: 0x6a7a96, gain: 1.1, glow: 0.08 }, { key: DARK, tint: 0x2a3040, glow: 0.04 }, 1.1, { tint: 0x1a1e28 }, { noCrown: true });
        I.ceilLit(7, 0, 9, 3, H, { key: U('FibreCeilingTile1a'), tint: 0xdfe8ff, glow: 0.3 }); I.prop('metal_detector', 8.45, 0.2, 180); }
      I.done(); }

    /* ═══ THE RESIDENTS' BEDROOMS (mondo 11-14 02:21 "District threads add them"; /mnt/project-files/disaster-city-residents/bedrooms-brief.md):
       the three Sports residences are walk-ins with a ground-floor bedroom, one bed each. The residents' code finds a bed by its key
       (/bed|cot/) inside the home's footprint. 5 squares deep: a living room across the front three rows, the bedroom across the back two.
       The bed, the wardrobe, the sofa and the table each fill one square; the rest is decor against the walls. ═══ */
    const home = (id, o) => { const I = inside(id, { h: o.h, wall: o.wall, floor: o.floor, leaf: 'leaf_suburban' }), P = I.parts, Wn = Math.round(I.f.w / 3.5), h = 3.1;
        I.wall('u', 3, 0, Wn, h, [[o.bedDoor + 0.5, 'leaf_wooden', 'BEDROOM']], { tint: o.tint, frame: 0x5a3c22 }); I.ceil(0, 0, Wn, 5, h, WHITE, 0xe8e2d4);
        /* the bedroom: the bed in a back corner square, the wardrobe in the other, a bedside table, a rug */
        const bu = o.bedU, wu = bu === 0 ? Wn - 1 : 0;
        I.block(bu, 4, 1, 1, 0.9); I.prop(o.bed, bu + 0.5, 4.5, bu === 0 ? 90 : 270); I.prop('psx_bedside_table_1', bu + (bu === 0 ? 0.25 : 0.75), 3.4, 180);
        I.block(wu, 4, 1, 1, 2.1); I.prop('psx_wardrobe_mp_1', wu + 0.5, 4.62, 0); I.prop('rug_round', o.bedDoor + 0.5, 4.2, 0); I.lampAt(Wn / 2, 4, h);
        /* the living room: the sofa and the table on squares of the side away from the door, plants and a clock on the walls */
        const su = o.door <= 1 ? Wn - 1 : 0;
        I.block(su, 1, 1, 1, 0.9); I.prop('psx_sofa_1', su + 0.5, 1.5, su === 0 ? 90 : 270); I.block(su, 2, 1, 1, 0.8); I.prop('psx_dinner_table_1', su + 0.5, 2.5, 0);
        I.prop('potted_plant', su === 0 ? 0.2 : Wn - 0.2, 0.25, 0); I.prop('psx_tv_table_1', su === 0 ? Wn - 0.25 : 0.25, 1.5, su === 0 ? 270 : 90); I.lampAt(Wn / 2, 1.5, h);
        if (o.extra) o.extra(I, P, Wn);
        I.done(); };
    /* the Quarterback (the Box office house): footballs and a cup by the bed */
    home('P06-09-B2', { h: 5.6, wall: WHITE, floor: 'wood_planks', tint: 0xcfe0ff, door: 3, bedDoor: 2, bedU: 0, bed: 'psx_bed_4_1',
        extra: (I, P, Wn) => { I.prop('football', 1.3, 4.85, 0); I.prop('football', 1.45, 4.8, 60); const q2 = I.loc(Wn - 1.3, 4.8); P.push({ s: 'cyl', p: [q2[0], 0, q2[1]], r: 0.28, h: 0.9, seg: 10, key: MARBLE_D, uv: [1.75, 0.9] }); I.prop('decor_trophy_cup', Wn - 1.3, 4.8, 0, { y: 1.0 }); } });
    /* the Luchador (the house with the veranda): a small mat and the ring's colours on the bedroom wall */
    home('P07-08-B2', { h: 6.4, wall: STUCCO, floor: 'wood_planks', tint: 0xfff2cf, door: 3, bedDoor: 2, bedU: 5, bed: 'psx_bed_4_2',
        extra: (I, P, Wn) => { const m0 = I.loc(2.5, 4.3); P.push({ s: 'box', p: [m0[0], 0, m0[1]], size: [3.0, 0.06, 2.2], key: RUB_Y, tint: 0xc83a3a, uv: 1.75 });
            const q2 = I.loc(3, 5); P.push({ s: 'quad', p: [q2[0], 1.6, q2[1] + 0.5], size: [2.6, 0.5], key: txt(2.6, 0.5, 'LUCHA LIBRE', '#f2ead8', '#a02028'), uv: 'fit', tint: 0xffffff }); } });
    /* the Juggernaut (the tall ochre house): a dumbbell rack on the bedroom wall */
    home('P07-10-B2', { h: 8.4, wall: WHITE, floor: 'wood_planks', tint: 0xd8b890, door: 0, bedDoor: 2, bedU: 4, bed: 'psx_bed_4_3',
        extra: (I, P, Wn) => { const r0 = I.loc(2.5, 4.78); P.push({ s: 'box', p: [r0[0], 0, r0[1]], size: [2.6, 0.9, 0.5], key: M_GREY, tint: 0x30343a, uv: 1.2 });
            for (let i = 0; i < 6; i++) { const x0 = r0[0] - 1.1 + i * 0.44, rr = 0.1 + 0.012 * i; P.push({ s: 'box', p: [x0, 0.95 + rr - 0.03, r0[1] + 0.1], size: [0.06, 0.06, 0.42], tint: 0x9098a0 }, { s: 'box', p: [x0, 0.95, r0[1] - 0.08], size: [2 * rr, 2 * rr, 0.1], tint: 0x1c1c1c }, { s: 'box', p: [x0, 0.95, r0[1] + 0.28], size: [2 * rr, 2 * rr, 0.1], tint: 0x1c1c1c }); } } });
};

/* ═══ build: THE GIANT APE (the plan's home for him was Park west, now the stadium). mondo 11-13 19:25: "put king kong in the district with the
   most high rises or tall buildings" = FINANCIAL (5 to 11 storeys). He stands on the open ground at the foot of the Penthouse stair tower
   (P10-03, the tallest), on a square's middle, off every path; his line is his own from the old streets. ═══ */
exports.build = (ctx) => {
    /* THE WALK-INS' WALLS (the second interior pass, 2026-11-14): a plot-border edge (hedge / wall / rail) laid along a walk-in's own wall
       stood half inside the room (the Equipment depot's east end: the x = 0 hedge, 0.9 m thick, came 0.45 m through the wall). Such an edge is
       MOVED out, its inner face 5 cm clear of the building, never dropped. */
    (ctx.features ? ['P04-08-B1', 'P06-10-B1', 'P06-11-B1', 'P07-11-B1'] : []).forEach(id => { const b = ctx.features.find(q => q.id === 'dc:' + id); if (!b) return;
        const ew = (b.rot || 0) % 180 ? b.d : b.w, ed = (b.rot || 0) % 180 ? b.w : b.d, X0 = b.x - ew / 2, X1 = b.x + ew / 2, Z0 = b.z - ed / 2, Z1 = b.z + ed / 2;
        ctx.features.forEach(f => { if (!(f.k === 'wall' || f.k === 'rail') || f.ghost || f.x0 == null) return; const t = (f.t || 0.3) / 2;
            if (f.x0 === f.x1 && Math.max(f.z0, f.z1) > Z0 + 0.3 && Math.min(f.z0, f.z1) < Z1 - 0.3 && f.x0 + t > X0 && f.x0 - t < X1) { const nx = (f.x0 - X0 < X1 - f.x0) ? X0 - t - 0.05 : X1 + t + 0.05; f.x0 = f.x1 = Math.round(nx * 1000) / 1000; }
            else if (f.z0 === f.z1 && Math.max(f.x0, f.x1) > X0 + 0.3 && Math.min(f.x0, f.x1) < X1 - 0.3 && f.z0 + t > Z0 && f.z0 - t < Z1) { const nz = (f.z0 - Z0 < Z1 - f.z0) ? Z0 - t - 0.05 : Z1 + t + 0.05; f.z0 = f.z1 = Math.round(nz * 1000) / 1000; } }); });
    if (!ctx.npcSpots) return;
    const x = ctx.gc(121), z = ctx.gc(45);
    ctx.take(121, 45);
    ctx.npcSpots.push({ x, z, face: 0, race: 'king kong', say: ['“…” “Was that you?” “…” “The tower.” “…” “Every year?” “…”'] });
};
