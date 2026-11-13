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
    const B = (id, x, z, rot, parts) => lateRows.push({ k: 'arch', id: 'arch:S:' + id, x: r3(x), z: r3(z), y: 0, rot, parts: parts.flat(Infinity).map(clean) });
    const cellOf = v => Math.floor((v + ctx.HALF) / ctx.C);
    const prop = (key, x, z, face) => { take(cellOf(x), cellOf(z)); props.push({ key, x: r3(x), z: r3(z), face }); };

    /* ── P04-08 · THE MUSEUM: limestone, a six-column portico and pediment, a verdigris dome and lantern, tall windows, red banners. WALK-IN. ── */
    { const f = walkin('P04-08-B1', 3), LIME = 0xfff0d6, VERD = 0xa8ecd2, hx = -14 + (f.door - 0.5) * 1.75;
      B('P04-08-B1', f.x, f.z, f.rot, [
        walls(28, 10.5, 24.5, WHITE, LIME, { door: [hx, 1.74, 2.2] }),
        { s: 'box', p: [0, 0, 0], size: [28.3, 1.1, 24.8], faces: 'blr', top: false, key: CONC },
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
        { s: 'box', p: [0, 0, 0], size: [28.4, 1.2, 28.4], top: false, key: DARK },
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
    { const f = solid('P07-08-B2', 2);
      B('P07-08-B2', f.x, f.z, f.rot, [
        walls(21, 6.4, 17.5, STUCCO, 0xfff2cf),
        { s: 'roof', form: 'hip', p: [0, 6.4, 0], size: [21, 4, 17.5], over: 0.7, key: T_RED, tint: 0xe08a5c, uv: 2 },
        { s: 'roof', form: 'shed', ry: 180, p: [0, 2.9, 10.5], size: [14.8, 0.9, 3.5], key: T_RED, tint: 0xe08a5c, under: true, ds: true, uv: 2 },
        { s: 'cyl', p: [-7, 0, 12.05], r: 0.16, h: 2.95, seg: 8, key: WHITE, n: 5, step: [3.5, 0, 0] },
        panels('f', 21, 17.5, 0.9, 1.5, 1.7, 4, G_RES, { span: 15 }), panels('f', 21, 17.5, 3.9, 1.5, 1.7, 5, G_RES), panels('l', 21, 17.5, 3.9, 1.5, 1.7, 4, G_RES), panels('r', 21, 17.5, 3.9, 1.5, 1.7, 4, G_RES),
        { s: 'quad', p: [0, 0, 8.78], size: [1.3, 2.3], key: DOORS, uv: 'fit', kind: 'wall' },
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
    { const f = solid('P06-09-B2', 2);
      B('P06-09-B2', f.x, f.z, f.rot, [
        walls(17.5, 5.6, 17.5, T_BLUE, 0xcfe0ff),
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
    { const f = solid('P07-10-B2', 2);
      B('P07-10-B2', f.x, f.z, f.rot, [
        walls(17.5, 8.4, 17.5, T_OCHRE, 0xd8b890),
        { s: 'roof', form: 'gable', ry: 90, p: [0, 8.4, 0], size: [17.5, 5.5, 17.5], over: 0.5, key: DARK, tint: 0x6a6f7c, keyEnd: T_OCHRE },
        panels('f', 17.5, 17.5, 1.0, 1.5, 1.9, 3, G_RES, { span: 9, c: 2.5 }), panels('f', 17.5, 17.5, 4.6, 1.5, 1.9, 5, G_RES),
        { s: 'cyl', p: [0, 10.6, 8.78], r: 0.9, h: 0.06, seg: 16, key: G_SQ, tint: 0xffffff },
        { s: 'quad', p: [-6, 0, 8.78], size: [1.3, 2.4], tint: 0x2f5fd0 },
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
};
