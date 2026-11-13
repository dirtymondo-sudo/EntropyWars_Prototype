/* DISASTER CITY · THE UNIVERSITY DISTRICT — every building architected (2026-11-13, mondo: "architect the buildings in their respective
   districts plots ... every building should be unique and purposeful and recognizable"). Repo-only tooling: bake-disaster-city.js runs
   this file's build(ctx) once its own rows are written (THE DISTRICT FILES hook); it re-dresses the district's 22 buildings (plots x 0-3, y 4-7 of docs/disaster-city/city-layout.json).

   A building = (1) what the walker reads — the tool's own row with its skin off (`texbuilding` + `skin: false`, a roof-route `plateau` +
   `bld.skin: false`), or a few of them where the plan's one box is really wings round a court — and (2) ONE `k: 'arch'` row: its look as
   a parts list (docs/notes/areas-complexes.md "THE ARCHITECTURE ROW"). Every builder works in the building's own frame: the front faces
   +z, x runs to the right along the front, w = the front's width, d = the depth.

   THE TWO HALVES: the OLD CAMPUS (west: red brick, pale stone, blue slate) and the SCIENCE SIDE (east: white panel, glass, concrete, metal).
   Three landmarks stand over the rest: the observatory's green dome, the library's clock tower, the boiler stack. */
'use strict';
const T = 1.75, C = 3.5;
/* ── the looks: [sheet, tint, the sheet's size in metres (none = one square)] — only sheets that stay themselves: an `urban:` sheet or a calm sheet by its own
   name (an `hq:` sheet drew BLACK on an arch part in the game) (a battle sheet's key is swapped for a dark calm sheet in the game: slate on it went black) ── */
const BRICK = ['urban:TileSubway3a', 0xffffff, C], BRICKD = ['urban:TileSubway4a', 0xe0d0c8, C], BUFF = ['urban:TileSubway1a', 0xffffff, C], STONE = ['calm_marble', 0xfff2d8], LIME = ['urban:PlasterWallStucco1a', 0xf2e8d2], WHITE = ['urban:PlasterWallPainted1a', 0xffffff],
    SLATE = ['calm_tiles_small', 0x8498d0], SLATEG = ['calm_tiles_small', 0x90b8a0], VERD = ['calm_snow', 0x58c8a8], LEAD = ['calm_deckplate', 0xffffff], ALU = ['calm_tiles', 0xdfe6ee], CONC = ['urban:ConcreteStriped2a', 0xffffff], CONCD = ['urban:ConcreteStriped1a', 0xd8d0c4],
    GUN = ['calm_gunmetal', 0xffffff], BLACK = ['calm_gunmetal', 0xa0a8b8], CORR = ['urban:MetalCorrugatedPainted1a', 0xffffff], CORRG = ['urban:MetalCorrugatedPainted4c', 0xffffff], CORRR = ['urban:MetalCorrugatedPainted2a', 0xffffff],
    TILEW = ['calm_tiles', 0xffffff], TILEC = ['calm_tiles', 0xffeec8], TILEB = ['calm_tiles', 0xa8d0f0], TILEN = ['calm_tiles', 0x4a6cb0], TEAL = ['calm_tiles', 0x3a7a78], MINT = ['calm_tiles', 0x68d0b0],
    GL = ['urban:GlassWindowSquare1a', 0xcfe4ee], GLT = ['urban:GlassWindowTall1a', 0xd4ecf0], GLB = ['urban:GlassWindowTall3a', 0xffffff], GLD = ['urban:GlassWindowFactory1a', 0x9098b0], GLR = ['urban:GlassWindowResidential1a', 0xdfe8f0], GLK = ['urban:GlassWindowSquare3a', 0xd8f4f0],
    WOOD = ['calm_planks', 0xffffff], WOODG = ['calm_planks', 0xa8e0b8], MARB = ['calm_marble', 0xffffff], AWN = ['urban:TileSubway1a', 0xffffff], CREAM = ['urban:PlasterWallPainted1a', 0xf6e6b8], SAGE = ['urban:PlasterWallPainted1a', 0xa8c4a0], BLUE = ['urban:PlasterWallPainted1a', 0x98b0cc],
    RES = ['urban:DecalWindowsResidential1a', 0xffffff], FAC = ['urban:DecalWindowsFactory1a', 0xffffff], DOORW = ['urban:DoorWoodenHalf1a', 0xffffff], DOORS = ['urban:DoorStorefrontHalf1a', 0xffffff], DOORP = ['urban:DoorPaintedHalf2a', 0xffffff], TRUSS = ['urban:MetalTruss1a', 0xffffff];
const r3 = v => Math.round(v * 1000) / 1000;

module.exports.build = function (api) {
    const { PLAN, features, props, bInfo } = api;
    let P = null, ctx = null;   // the parts of the building being drawn; its frame
    const look = (L, o) => { const q = Object.assign({}, o || {}); if (L[0]) q.key = L[0]; if (L[1] != null && L[1] !== 0xffffff) q.tint = L[1]; if (L[2] && q.uv == null) q.uv = L[2]; return q; };
    const part = (s, p, L, o) => { const q = Object.assign({ s, p: p.map(r3) }, look(L, o)); P.push(q); return q; };
    /* ── the shapes (the mock-up's helpers, written as parts) ── */
    const box = (x, y, z, w, h, d, L, o) => part('box', [x, y, z], L, Object.assign({ size: [r3(w), r3(h), r3(d)] }, o || {}));
    const cyl = (x, y, z, r, h, L, seg, r2, o) => part('cyl', [x, y, z], L, Object.assign({ r: r3(r), h: r3(h), seg: seg || 16 }, r2 != null ? { r2: r3(r2) } : {}, o || {}));
    const cone = (x, y, z, r, h, L, seg) => cyl(x, y, z, r, h, L, seg, 0, { roof: true });
    const dome = (x, y, z, r, L, sq, seg) => part('dome', [x, y, z], L, { r: r3(r), h: r3(r * (sq || 1)), seg: seg || 20, rings: 6, roof: true, glow: 0.3 });   // a little of its own colour on the shaded side (an unlit dome read black)
    const roofP = (form, x, y, z, w, h, d, L, o) => part('roof', [x, y, z], L, Object.assign({ form, size: [r3(w), r3(h), r3(d)], roof: true }, o || {}));
    const ends = LE => LE ? { keyEnd: LE[0], tintEnd: LE[1] } : {};
    /* gable: the ridge along 'x' or 'z' (w = along x, d = along z in the building's frame) */
    const gable = (x, y, z, w, d, h, ax, L, LE, ov) => ax === 'z' ? roofP('gable', x, y, z, d, h, w, L, Object.assign({ ry: 90, over: ov == null ? 0.4 : ov }, ends(LE))) : roofP('gable', x, y, z, w, h, d, L, Object.assign({ over: ov == null ? 0.4 : ov }, ends(LE)));
    const hip = (x, y, z, w, d, h, L, ov) => d > w ? roofP('hip', x, y, z, d, h, w, L, { ry: 90, over: ov == null ? 0.4 : ov }) : roofP('hip', x, y, z, w, h, d, L, { over: ov == null ? 0.4 : ov });
    const pyramid = (x, y, z, w, h, L) => roofP('pyramid', x, y, z, w, h, w, L, {});
    /* shed: the high edge at the back (-z), turned ry degrees (clockwise): 90 = the high edge at +x ... */
    const shed = (x, y, z, w, d, h, L, ry, LE, o) => roofP('shed', x, y, z, w, h, d, L, Object.assign({ ry: ry || 0, ds: true }, ends(LE), o || {}));
    /* vault: a barrel along 'x' or 'z', its length w, its span d, its rise h */
    const vault = (x, y, z, w, d, h, ax, L, LE) => roofP('barrel', x, y, z, w, h, d, L, Object.assign({ ry: ax === 'z' ? 90 : 0, seg: 10 }, ends(LE)));
    /* a strip of a window sheet on a face: f = 'f' (front, +z) 'b' 'l' (-x) 'r'; cx = its middle along that face; off = the face's distance from the middle */
    const FACE = { f: (cx, off) => [[cx, 0, off], 0], b: (cx, off) => [[cx, 0, -off], 180], r: (cx, off) => [[off, 0, cx], 270], l: (cx, off) => [[-off, 0, cx], 90] };
    const panel = (f, cx, y, len, h, off, L, o) => { const [p, ry] = FACE[f](cx, off + 0.05); return part('quad', [p[0], y, p[2]], L, Object.assign({ size: [r3(len), r3(h)] }, ry ? { ry } : {}, o || {})); };
    /* the cut-out window decals hold 2 x 2 small windows a sheet: drawn at twice the size, one row a strip (a window about 1.2 m wide) */
    const decal = L => L === RES || L === FAC;
    const WD = 5.25;   // THE BIG WINDOWS (mondo 11-13): a cut-out window sheet (2 x 2 windows) drawn 5.25 m a sheet, one row a strip: a window about 1.8 m wide
    const win = (f, cx, y, len, h, off, L) => decal(L) ? panel(f, cx, y, len, WD / 2, off, L, { uv: [WD, WD] }) : panel(f, cx, y, len, h, off, L, null);
    const door = (f, cx, off, L, w) => panel(f, cx, 0, w || 1.9, 2.3, off + 0.03, L || DOORW, { uv: [r3((w || 1.9) / 2), 2.3], kind: 'wall' });
    const rows = (f, cx, len, off, n, L, y0) => { const m = decal(L) ? WD / 2 : T; for (let s = (decal(L) && n > 1) ? 1 : 0; s < n; s++) win(f, cx, (y0 == null ? 1.0 : y0) + s * C, Math.max(m, Math.floor(len / m) * m), T, off, L); };
    const allRows = (w, d, n, L, y0) => { rows('f', 0, w - T, d / 2, n, L, y0); rows('b', 0, w - T, d / 2, n, L, y0); rows('l', 0, d - T, w / 2, n, L, y0); rows('r', 0, d - T, w / 2, n, L, y0); };
    const parapet = (w, d, y, L, h) => { h = h || 0.9; box(0, y, d / 2 - 0.15, w, h, 0.3, L); box(0, y, -d / 2 + 0.15, w, h, 0.3, L); box(w / 2 - 0.15, y, 0, 0.3, h, d - 0.6, L); box(-w / 2 + 0.15, y, 0, 0.3, h, d - 0.6, L); };
    /* a cornice round a roof's edge: four strips OUTSIDE the footprint (a walked roof keeps its own slab clear) */
    const cornice = (w, d, y, L, o, h) => { o = o || 0.35; h = h || 0.35; box(0, y, d / 2 + o / 2, w + 2 * o, h, o, L, { under: true }); box(0, y, -d / 2 - o / 2, w + 2 * o, h, o, L, { under: true }); box(w / 2 + o / 2, y, 0, o, h, d, L, { under: true }); box(-w / 2 - o / 2, y, 0, o, h, d, L, { under: true }); };

    /* ── what the walker reads: rows in the room's metres, from the building's frame ── */
    const toWorld = (lx, lz) => { const q = ctx.rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q); return [r3(ctx.x + lx * c - lz * s), r3(ctx.z + lx * s + lz * c)]; };
    const turned = () => ctx.rot === 90 || ctx.rot === 270;
    let sub = 0;
    /* a solid box of the building (walls + an unseen roof), nothing drawn */
    const solid = (lx, lz, w, d, h, o) => { const [x, z] = toWorld(lx, lz); const row = Object.assign({ k: 'texbuilding', id: ctx.id + '-u' + (++sub), x, z, w: r3(Math.max(2, w)), d: r3(Math.max(2, d)), rot: ctx.rot, storeys: Math.max(1, Math.round(h / C)), seed: 7000 + sub, skin: false }, o || {}); features.push(row); return row; };
    /* a small thing that blocks (a column, a tank): one ghost wall */
    const block = (lx, lz, w, d, h) => { const a = toWorld(lx - w / 2, lz), b = toWorld(lx + w / 2, lz); features.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h: h || 3, t: r3(d), ghost: true, rail: false }); };
    /* a block on a walked roof (the dome's drum, the vault): a higher tier inside the tier, its own faces off */
    let tiers = [];
    const tier = (lx, lz, w, d, h) => { tiers.push([lx, lz, w, d]); const [x, z] = toWorld(lx, lz), tw = turned(); features.push({ k: 'plateau', id: ctx.id + '-u' + (++sub), x, z, w: r3((tw ? d : w) - 0.3), d: r3((tw ? w : d) - 0.3), h: r3(h), edge: 0.15, bld: { skin: false, seed: 7000 + sub } }); };   // 0.15 m inside its drawn walls: the plateau's own cliff never shows through them
    /* the walk-in building's doorway, as data.js hqTexbDoor finds it: its square of the front (1 = the left as you face it) nearest x */
    const doorAt = (w, x) => { const L = w - 0.12, cols = Math.max(1, Math.round(L / T)), cw = L / cols, col = Math.max(0, Math.min(cols - 1, Math.round((x + L / 2) / cw - 0.5))); return { door: col + 1, lx: r3(-L / 2 + (col + 0.5) * cw), cw: r3(cw) }; };
    /* the front wall of a walk-in building: a panel with the doorway cut out (the leaf is the engine's) */
    const front = (w, h, d, L, D, y) => part('quad', [0, y || 0, d / 2], L, { size: [r3(w), r3(h)], hole: [D.lx, D.cw, 2.2] });
    /* walls on the other three sides */
    const shell = (w, h, d, L, y) => box(0, y || 0, 0, w, h, d, L, { faces: 'blr', top: false });

    /* ═══ THE BUILDINGS ═══ */
    const B = {};
    /* OLD CAMPUS ─────────────────────────────────────────────────────────────────────────── */
    B.dorm = (w, d, row) => {   // a quad: four gabled wings round an open court, an archway through the front
        const H = 10.5, t = 7, gap = 5;
        row.dead = true;
        const fl = (w - gap) / 2;
        [-1, 1].forEach(s => { const cx = s * (gap / 2 + fl / 2); box(cx, 0, d / 2 - t / 2, fl, H, t, BRICK, { top: false }); rows('f', cx, fl - T, d / 2, 3, RES); solid(cx, d / 2 - t / 2, fl, t, H); });
        box(0, 4.6, d / 2 - t / 2, gap, H - 4.6, t, BRICK, { top: false, under: true, faces: 'fb' }); box(0, 4.2, d / 2 - t / 2, gap + 0.6, 0.5, t + 0.3, LIME, { under: true }); win('f', 0, 6, 3.5, T, d / 2, RES);
        gable(0, H, d / 2 - t / 2, w, t, 3.6, 'x', SLATE, BRICK); gable(0, H, d / 2 - 0.2, 6.4, 1.2, 2.6, 'z', SLATE, LIME, 0.2);
        box(0, 0, -d / 2 + t / 2, w, H, t, BRICK, { top: false }); rows('b', 0, w - T, d / 2, 3, RES); rows('f', 0, w - 2 * t - T, -d / 2 + t, 3, RES); gable(0, H, -d / 2 + t / 2, w, t, 3.6, 'x', SLATE, BRICK); solid(0, -d / 2 + t / 2, w, t, H);
        [-1, 1].forEach(s => { const cx = s * (w / 2 - t / 2), len = d - 2 * t; box(cx, 0, 0, t, H, len, BRICK, { top: false, faces: 'lr' }); rows(s < 0 ? 'l' : 'r', 0, len - T, w / 2, 3, RES); rows(s < 0 ? 'r' : 'l', 0, len - T, -(w / 2 - t), 3, RES);
            gable(cx, H, 0, t, len + 0.5, 3.6, 'z', SLATE, BRICK); solid(cx, 0, t, len, H);
            box(s * (w / 2 - 1.2), H, d / 2 - 2, 1.1, 5, 1.1, BRICKD); box(s * (w / 2 - 1.2), H, -d / 2 + 2, 1.1, 5, 1.1, BRICKD); });
        door('b', 0, -(d / 2 - t), DOORW, 2.6);   // the hall door, across the court from the archway
    };
    B.lecture = (w, d) => {   // roof route: a brick hall, a six-column porch + pediment, a lead vault over the auditorium
        box(0, 0, 0, w, 7, d, BRICK, { top: false }); box(0, 0, 0, w + 0.4, 1.0, d + 0.4, LIME); allRows(w, d, 1, GLT, 1.6); win('l', 0, 3.35, d - C, T, w / 2, GLT); win('r', 0, 3.35, d - C, T, w / 2, GLT);
        win('f', -w / 2 + 3.5, 3.35, 5.25, T, d / 2, GLT); win('f', w / 2 - 3.5, 3.35, 5.25, T, d / 2, GLT); win('b', 0, 3.35, w - C, T, d / 2, GLT); cornice(w, d, 6.5, LIME, 0.45, 0.5);
        const pw = 15.75, pd = 3.2; box(0, 0, d / 2 + pd / 2, pw + 0.6, 0.15, pd + 0.3, STONE);
        for (let i = 0; i < 6; i++) { const x = -pw / 2 + 0.7 + i * (pw - 1.4) / 5; cyl(x, 0.15, d / 2 + pd - 0.5, 0.48, 6.1, MARB, 12); block(x, d / 2 + pd - 0.5, 0.9, 0.9, 6); }
        box(0, 6.25, d / 2 + pd / 2, pw + 0.4, 0.9, pd + 0.2, MARB, { under: true }); gable(0, 7.15, d / 2 + pd / 2, pw + 0.4, pd + 0.2, 2.6, 'z', LEAD, MARB, 0.15);
        [-2.6, 0, 2.6].forEach(x => door('f', x, d / 2, DOORW, 2.2));
        box(0, 7, -1.5, 15, 1.4, 14, BRICK, { top: false }); vault(0, 8.4, -1.5, 14, 15, 3.4, 'z', LEAD, BRICK); tier(0, -1.5, 15, 14, 9.6);
    };
    B.library = (w, d, row) => {   // collegiate gothic: steep slate gables, a gabled front with one tall window, buttresses, a clock tower. WALK-IN (the nave)
        const H = 10.5, nd = 14, nz = d / 2 - nd / 2, rd = d - nd, rz = nz - nd / 2 - rd / 2, D = doorAt(w, 0);
        Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_lobby_glass_double', storeys: 3, d: nd }); [row.x, row.z] = toWorld(0, nz);
        P.push(Object.assign({ s: 'quad', p: [0, 0, r3(nz + nd / 2)], size: [w, H], hole: [D.lx, D.cw, 2.2] }, look(STONE))); box(0, 0, nz, w, H, nd, STONE, { faces: 'blr', top: false });
        gable(0, H, nz, w, nd, 7, 'x', SLATE, STONE, 0.3); gable(0, H, nz + nd / 4, 8.75, nd / 2 + 0.1, 5.2, 'z', SLATE, STONE, 0.25);
        win('f', 0, 3.4, 3.5, 6.6, nz + nd / 2, GLT); box(0, 2.3, nz + nd / 2 + 0.2, 4.4, 0.5, 0.4, MARB); [-1, 1].forEach(s => { box(s * 4.4, 0, nz + nd / 2 + 0.45, 0.9, H + 2.5, 0.9, STONE); pyramid(s * 4.4, H + 2.5, nz + nd / 2 + 0.45, 1.3, 2.2, SLATE); box(s * 2.4, 0, nz + nd / 2 + 0.2, 0.5, 2.3, 0.4, MARB); });
        [-8.4, 8.4].forEach(x => win('f', x, 2.2, 5.25, 6.2, nz + nd / 2, GLT)); win('b', -w / 4 - 1.75, 2.2, w / 2 - 5.25, 6.2, -(nz - nd / 2), GLT); win('b', w / 4 + 1.75, 2.2, w / 2 - 5.25, 6.2, -(nz - nd / 2), GLT);
        for (let i = 0; i < 6; i++) { const x = -w / 2 + 0.5 + i * (w - 1) / 5; if (Math.abs(x) < 5.5 || x > w / 2 - 7) continue; box(x, 0, nz + nd / 2 + 0.5, 0.9, 7.5, 1.0, STONE); box(x, 7.5, nz + nd / 2 + 0.3, 0.9, 1.6, 0.6, MARB); }
        const rw = 14; box(0, 0, rz, rw, H - 1.5, rd, STONE, { top: false, faces: 'blr' }); gable(0, H - 1.5, rz, rw, rd + 0.6, 5.4, 'z', SLATE, STONE, 0.3); solid(0, rz, rw, rd, H - 1.5);
        [-1, 1].forEach(s => win(s < 0 ? 'l' : 'r', rz, 2.2, Math.floor((rd - 3.5) / T) * T, 5.2, rw / 2, GLT));
        const tx = w / 2 - 3.2, tz = nz + nd / 2 - 2.2, ts = 6.4; box(tx, 0, tz, ts, 22, ts, STONE, { top: false }); box(tx, 22, tz, ts + 0.6, 0.5, ts + 0.6, MARB, { under: true }); pyramid(tx, 22.5, tz, ts + 0.5, 6.5, SLATE);
        [['f', tx, tz + ts / 2], ['r', tz, tx + ts / 2]].forEach(([f, cx, off]) => { const [p, ry] = FACE[f](cx, off + 0.06); P.push(Object.assign({ s: 'cyl', p: [p[0], 18.6, p[2]], r: 2.1, h: 0.12, seg: 20, ry: ry }, look(['calm_snow', 0xfff8e0]))); });
        /* the clock faces: a pale disc on its edge is not a part shape, so each face is a square stone-framed panel + two hands */
        [['f', tx, tz + ts / 2], ['r', tz, tx + ts / 2]].forEach(([f, cx, off]) => { panel(f, cx, 16.5, 4.2, 4.2, off + 0.02, ['calm_snow', 0xfff8e0]); panel(f, cx, 18.6, 0.22, 1.7, off + 0.06, [null, 0x202020]); panel(f, cx + 0.55, 18.5, 1.3, 0.22, off + 0.06, [null, 0x202020]); win(f, cx, 11.5, T, 3.5, off, GLT); });
        P.splice(P.findIndex(q => q.s === 'cyl' && q.h === 0.12), 2);   // (the lying discs are dropped: the panels are the faces)
    };
    B.cafe = (w, d, row) => {   // a brick house under a hipped slate roof, a glass conservatory, a striped awning, a round corner bay under a cone. WALK-IN
        const D = doorAt(w, 1.2); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_suburban', storeys: 2 });
        front(w, 7, d, BRICK, D); shell(w, 7, d, BRICK); rows('f', 0, w - T, d / 2, 1, RES, 4.4); rows('b', 0, w - T, d / 2, 2, RES); rows('l', 0, d - T, w / 2, 2, RES); rows('r', -1.5, d - 6, w / 2, 2, RES);
        hip(0, 7, 0, w, d, 3.8, SLATEG, 0.6); box(-w / 4, 7, -1.5, 1.2, 5.2, 1.2, BRICKD); box(w / 5, 7, -1.5, 1.2, 5.2, 1.2, BRICKD);
        const cw = w * 0.42, cx = -w / 2 + cw / 2 + 0.5; box(cx, 0.7, d / 2 + 1.6, cw, 2.1, 3.2, GLR, { top: false, faces: 'flr' }); shed(cx, 2.8, d / 2 + 1.6, cw + 0.3, 3.4, 1.3, GL, 0, GLR); box(cx, 0, d / 2 + 1.6, cw + 0.2, 0.7, 3.4, BRICKD); block(cx, d / 2 + 1.6, cw, 3.2, 2.8);
        const ax = D.lx + 0.9 + (w / 2 - 3 - D.lx - 0.9) / 2, aw = w / 2 - 3 - D.lx - 0.9; if (aw > 2) { shed(ax, 2.9, d / 2 + 1.0, aw, 2.0, 0.9, AWN, 0); win('f', ax, 0.7, Math.floor((aw - 0.6) / T) * T, 2.1, d / 2, GLB); }
        cyl(w / 2 - 0.3, 0, d / 2 - 0.3, 2.3, 8.2, BRICK, 12); cone(w / 2 - 0.3, 8.2, d / 2 - 0.3, 2.7, 3.6, SLATEG, 12); win('f', w / 2 - 0.3, 4.6, T, T, d / 2 + 2.0, RES); block(w / 2 - 0.3, d / 2 + 0.9, 3.6, 2.2, 8); door('r', -d / 2 + 2.5, w / 2, DOORW, 1.3);
    };
    B.gate = (w, d, row) => {   // the campus gate: an archway between two turrets under cone roofs, a lodge wing each side (the right one WALK-IN: the porter's lodge)
        const aw = 8.75, ww = (w - aw) / 2 - 2, wd = d - 2; row.dead = true;
        [-1, 1].forEach(s => { box(s * (aw / 2 - 1.2), 0, 0, 2.4, 9.5, d, STONE, { top: false }); solid(s * (aw / 2 - 1.2), 0, 2.4, d, 9.5);
            cyl(s * (aw / 2 + 1.6), 0, d / 2 - 1.0, 2.5, 13, BRICK, 8); cyl(s * (aw / 2 + 1.6), 13, d / 2 - 1.0, 2.8, 0.5, MARB, 8); cone(s * (aw / 2 + 1.6), 13.5, d / 2 - 1.0, 3.0, 5.2, SLATE, 8); block(s * (aw / 2 + 1.6), d / 2 + 0.2, 4.6, 2.6, 13);
            win('f', s * (aw / 2 + 1.6), 9.5, 0.9, 2.4, d / 2 + 1.5, GLT); const cx = s * (aw / 2 + 2 + ww / 2);
            if (s > 0) { const r2 = solid(cx, 0, ww, wd, 7, { hollow: true, leaf: 'leaf_shabby_wood' }), D = doorAt(r2.w, 1.5); r2.door = D.door; lodgeRow = r2; P.push(Object.assign({ s: 'quad', p: [r3(cx), 0, r3(wd / 2)], size: [r3(ww), 7], hole: [D.lx, D.cw, 2.2] }, look(BRICK))); box(cx, 0, 0, ww, 7, wd, BRICK, { faces: 'blr', top: false }); }
            else { box(cx, 0, 0, ww, 7, wd, BRICK, { top: false }); solid(cx, 0, ww, wd, 7); }
            gable(cx, 7, 0, ww, wd, 3.2, 'x', SLATE, BRICK, 0.35); rows('f', s * (aw / 2 + 4.6 + (ww - 2.6) / 2) - (s > 0 ? 0 : 0), ww - 4.4, wd / 2, 1, RES, 4.5); rows('b', cx, ww - T, wd / 2, 2, RES); });
        box(0, 5.2, 0, aw - 4.8, 4.3, d, STONE, { top: false, under: true, faces: 'fb' }); box(0, 4.8, 0, aw - 4.4, 0.5, d + 0.3, MARB, { under: true }); box(0, 9.5, 0, aw + 0.4, 0.5, d + 0.4, MARB, { under: true });
        P.push(Object.assign({ s: 'box', p: [r3(-aw / 2 + 0.6), 10, r3(d / 2 - 0.3)], size: [0.8, 0.9, 0.6], n: 6, step: [1.5, 0, 0] }, look(STONE))); win('f', 0, 6.4, T, T, d / 2, GLT);
        [-1, 1].forEach(s => box(s * 2.0, 0, d / 2 + 0.9, 0.1, 3.6, 1.8, ['urban:MetalTruss1a', 0x404040], { kind: 'over', ds: true }));
    };
    B.faculty = (w, d, row) => {   // a terrace of gabled houses, each its own colour, bay window, stoop and chimney
        const n = Math.max(3, Math.round(w / 7.5)), hw = w / n, looks = [BRICK, CREAM, SAGE, BLUE, BUFF]; Object.assign(row, { hollow: false, storeys: 2 }); delete row.door;
        for (let i = 0; i < n; i++) { const cx = -w / 2 + hw * (i + 0.5), L = looks[i % looks.length];
            box(cx, 0, 0, hw - 0.1, 7, d, L, { top: false }); rows('f', cx + 0.9, hw - 3.6, d / 2, 1, RES, 4.5); rows('b', cx, hw - T, d / 2, 2, RES);
            if (i % 2 === 0) gable(cx, 7, 0, hw, d, 3.4, 'z', SLATE, L, 0.35); else { gable(cx, 7, 0, hw, d, 3.0, 'x', SLATEG, L, 0.35); box(cx, 7.3, d / 4, 2, 1.6, 1.6, L, { top: false }); gable(cx, 8.9, d / 4, 2, 1.8, 0.9, 'z', SLATEG, L, 0.15); win('f', cx, 7.6, 1.2, 1.1, d / 4 + 0.8, GLR); }
            box(cx - 1.7, 0.5, d / 2 + 0.45, 2.6, 3.0, 0.9, MARB); win('f', cx - 1.7, 1.2, T, T, d / 2 + 0.9, GLR); shed(cx - 1.7, 3.5, d / 2 + 0.5, 2.9, 1.1, 0.5, SLATE, 0);
            box(cx + 1.9, 0, d / 2 + 0.6, 1.8, 0.3, 1.2, STONE); door('f', cx + 1.9, d / 2, DOORW, 1.3); box(cx + hw / 2 - 0.9, 7, -1, 0.9, 4.6, 0.9, BRICKD); }
    };
    B.bookshop = (w, d) => {   // roof route: a painted shopfront under a striped awning, cream plaster over it, a deep cornice
        box(0, 0, 0, w, 3.5, d, WOODG, { top: false }); box(0, 3.5, 0, w, 3.5, d, CREAM, { top: false }); win('f', -0.9, 0.6, Math.floor((w - 4) / T) * T, 2.4, d / 2, GLB); win('r', 0, 0.6, d - C, 2.4, w / 2, GLB); door('f', w / 2 - 1.6, d / 2, DOORS);
        rows('f', 0, w - T, d / 2, 1, RES, 4.3); rows('r', 0, d - T, w / 2, 1, RES, 4.3); rows('l', 0, d - T, w / 2, 1, RES, 4.3); rows('b', 0, w - T, d / 2, 1, RES, 4.3);
        shed(0, 2.9, d / 2 + 0.9, w, 1.8, 0.9, AWN, 0); shed(w / 2 + 0.9, 2.9, 0, d, 1.8, 0.9, AWN, 270); cornice(w, d, 6.55, WOODG, 0.45, 0.45);
        box(-w / 2 - 0.6, 4.2, d / 2 - 1.5, 1.0, 1.3, 0.15, ['calm_planks', 0x80c090]);
    };
    B.workshop = (w, d, row) => {   // the bike workshop: a brick foot, green corrugated walls, a sawtooth roof of north lights
        Object.assign(row, { storeys: 2 }); box(0, 0, 0, w, 1.2, d, BRICKD, { top: false }); box(0, 1.2, 0, w, 3.6, d, CORRG, { top: false });
        const n = Math.max(3, Math.round(w / 4.7)), bw = w / n; for (let i = 0; i < n; i++) shed(-w / 2 + bw * (i + 0.5), 4.8, 0, d, bw, 2.2, CORR, 270, GL);
        box(-1.5, 0, d / 2 + 0.05, 3.6, 3.3, 0.12, ['urban:MetalCorrugatedPainted1a', 0xd0d4d8]); door('f', 3.5, d / 2, DOORP); shed(0, 3.6, d / 2 + 1, w - 2, 2, 0.5, CORRR, 0, null, { under: true });
    };
    /* SCIENCE SIDE ─────────────────────────────────────────────────────────────────────────── */
    B.observatory = (w, d) => {   // roof route: a white podium, a column porch, the terrace round the dome
        box(0, 0, 0, w, 7, d, LIME, { top: false }); box(0, 0, 0, w + 0.5, 0.9, d + 0.5, STONE);
        P.push(Object.assign({ s: 'box', p: [r3(-w / 2 + T), 0.9, r3(d / 2 + 0.12)], size: [0.7, 5.7, 0.25], n: Math.floor((w - T) / C) + 1, step: [C, 0, 0] }, look(MARB)), Object.assign({ s: 'box', p: [r3(-w / 2 + T), 0.9, r3(-d / 2 - 0.12)], size: [0.7, 5.7, 0.25], n: Math.floor((w - T) / C) + 1, step: [C, 0, 0] }, look(MARB)));
        P.push(Object.assign({ s: 'box', p: [r3(w / 2 + 0.12), 0.9, r3(-d / 2 + T)], size: [0.25, 5.7, 0.7], n: Math.floor((d - T) / C) + 1, step: [0, 0, C] }, look(MARB)), Object.assign({ s: 'box', p: [r3(-w / 2 - 0.12), 0.9, r3(-d / 2 + T)], size: [0.25, 5.7, 0.7], n: Math.floor((d - T) / C) + 1, step: [0, 0, C] }, look(MARB)));
        allRows(w, d, 2, GLT, 1.4); cornice(w, d, 6.5, MARB, 0.5, 0.5);
        const pd = 3.2; box(0, 0, d / 2 + pd / 2, 10, 0.15, pd + 0.3, STONE); [-3.9, -1.3, 1.3, 3.9].forEach(x => { cyl(x, 0.15, d / 2 + pd - 0.5, 0.42, 6.0, MARB, 12); block(x, d / 2 + pd - 0.5, 0.8, 0.8, 6); });
        box(0, 6.15, d / 2 + pd / 2, 10.4, 0.85, pd + 0.2, MARB, { under: true }); gable(0, 7, d / 2 + pd / 2, 10.4, pd + 0.2, 1.8, 'z', VERD, MARB, 0.1); door('f', 0, d / 2, DOORW, 2.6);
        const r = Math.min(7.4, d / 2 - 4.6); cyl(0, 7, 0, r, 3.6, LIME, 28); cyl(0, 10.6, 0, r + 0.3, 0.4, MARB, 28); dome(0, 11, 0, r, VERD, 1, 28);
        tier(0, 0, r * 1.7, r * 1.7, 10.6);
        const tx = -w / 2 + 3.2, tz = -d / 2 + 3.2; cyl(tx, 7, tz, 2.2, 2.4, LIME, 14); dome(tx, 9.4, tz, 2.2, VERD, 1, 14); tier(tx, tz, 3.4, 3.4, 9.4);
        box(w / 2 + 1.2, 3, 0, 2.4, 0.25, 5, MARB, { under: true }); door('r', 0, w / 2, DOORW);
    };
    B.lab = (w, d, row) => {   // white panels, ribbon glass, a sawtooth north-light roof, a glass stair drum, three stacks. WALK-IN
        const D = doorAt(w, -3); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_lobby_glass_double', storeys: 2 });
        front(w, 7, d, WHITE, D); shell(w, 7, d, WHITE); box(0, 0, 0, w + 0.1, 0.8, d + 0.1, CONCD, { faces: 'blr', top: false });
        [1.4, 4.7].forEach(y => { win('b', 0, y, w - T, T, d / 2, GLD); win('l', 0, y, d - T, T, w / 2, GLD); win('r', 0, y, d - T, T, w / 2, GLD); });
        win('f', 0, 4.7, w - 7, T, d / 2, GLD); win('f', -w / 2 + 4.4, 1.4, 5.25, T, d / 2, GLD); win('f', D.lx + 5.6, 1.4, Math.floor((w / 2 - 4 - D.lx - 3) / T) * T, T, d / 2, GLD);
        const n = Math.max(4, Math.round(w / 5)), bw = w / n; for (let i = 0; i < n; i++) shed(-w / 2 + bw * (i + 0.5), 7, 0, d, bw, 2.1, ALU, 270, GL);
        cyl(w / 2 - 1.2, 0, d / 2 + 0.6, 2.6, 11, GLT, 18); cyl(w / 2 - 1.2, 11, d / 2 + 0.6, 2.9, 0.3, ALU, 18); block(w / 2 - 1.2, d / 2 + 1.6, 5, 3.2, 11);
        const OR = ['calm_snow', 0xf08a3c]; box(D.lx, 3.0, d / 2 + 1.6, 7, 0.28, 3.2, OR, { under: true }); box(D.lx - 3.3, 0, d / 2 + 0.3, 0.4, 3.0, 0.6, OR);
        [-2, 0, 2].forEach(x => cyl(-w / 2 + 3 + x, 7, -d / 2 + 1.4, 0.38, 6.2, ALU, 10)); box(-w / 2 + 3, 7, -d / 2 + 1.4, 6, 1.2, 1.8, GUN);
    };
    B.annex = (w, d) => {   // roof route: brutalist — the upper floor hangs over a glass ground floor, fins all round, a roof greenhouse + a tank
        box(0, 0, 0, w - 2.6, 3.5, d - 2.6, GLD, { top: false }); box(0, 3.5, 0, w, 3.5, d, CONC, { top: false, under: true });
        const nx = Math.floor((w - 0.9) / T) + 1, nz = Math.floor((d - 0.9) / T) + 1;
        P.push(Object.assign({ s: 'box', p: [r3(-w / 2 + 0.9), 3.7, r3(d / 2 + 0.2)], size: [0.25, 3.1, 0.5], n: nx, step: [T, 0, 0] }, look(CONCD)), Object.assign({ s: 'box', p: [r3(-w / 2 + 0.9), 3.7, r3(-d / 2 - 0.2)], size: [0.25, 3.1, 0.5], n: nx, step: [T, 0, 0] }, look(CONCD)));
        P.push(Object.assign({ s: 'box', p: [r3(w / 2 + 0.2), 3.7, r3(-d / 2 + 0.9)], size: [0.5, 3.1, 0.25], n: nz, step: [0, 0, T] }, look(CONCD)), Object.assign({ s: 'box', p: [r3(-w / 2 - 0.2), 3.7, r3(-d / 2 + 0.9)], size: [0.5, 3.1, 0.25], n: nz, step: [0, 0, T] }, look(CONCD)));
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(a * (w / 2 - 0.5), 0, b * (d / 2 - 0.5), 0.8, 3.5, 0.8, CONCD, { top: false })); door('f', 0, d / 2 - 1.3, DOORS, 2.6);
        box(-2.5, 7, -2, 5, 2.2, 4, GL, { top: false }); gable(-2.5, 9.2, -2, 5, 4, 1.3, 'x', GL, GL, 0.1); tier(-2.5, -2, 5, 4, 9.2); cyl(3.5, 7, 3, 1.5, 2.6, ALU, 14); cone(3.5, 9.6, 3, 1.6, 0.7, ALU, 14); tier(3.5, 3, 2.6, 2.6, 9.6);
    };
    B.psych = (w, d, row) => {   // streamline: rounded ends, glass ribbons, the upper floor hung over the pavement on thin posts. WALK-IN (the middle)
        const r = d / 2, L = w - d, o = 1.3, D = doorAt(L, 0); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_lobby_glass_double', storeys: 2, w: r3(L) });
        P.push(Object.assign({ s: 'quad', p: [0, 0, r3(r)], size: [r3(L), 3.5], hole: [D.lx, D.cw, 2.2] }, look(TILEC))); box(0, 0, 0, L, 3.5, d, TILEC, { faces: 'b', top: false });
        [-1, 1].forEach(s => { cyl(s * L / 2, 0, 0, r, 3.5, TILEC, 20, null, { cap: false, arc: 180, a0: s > 0 ? -90 : 90 }); cyl(s * L / 2, 3.5, o / 2, r + o / 2, 3.5, TILEC, 22, null, { arc: 180, a0: s > 0 ? -90 : 90, keyTop: TEAL[0], tintTop: TEAL[1] }); cyl(s * L / 2, 4.4, o / 2, r + o / 2 + 0.04, T, GLD, 22, null, { cap: false, arc: 180, a0: s > 0 ? -90 : 90 });
            cyl(s * L / 2, 7, o / 2, r + o / 2 + 0.45, 0.3, TEAL, 22, null, { arc: 180, a0: s > 0 ? -90 : 90 }); solid(s * (L / 2 + r / 2), 0, r, d, 7);
            win('f', s * (L / 4 + D.cw / 2), 1.1, Math.floor((L / 2 - D.cw - 0.6) / T) * T, T, r, GLD); });
        win('b', 0, 1.1, L - T, T, r, GLD); box(0, 3.5, o / 2, L, 3.5, d + o, TILEC, { faces: 'fb', keyTop: TEAL[0], tintTop: TEAL[1], under: true }); win('f', 0, 4.4, L, T, r + o, GLD); win('b', 0, 4.4, L, T, r, GLD);
        box(0, 3.35, o / 2, L + 0.2, 0.3, d + o + 0.3, TEAL, { faces: 'fb' }); box(0, 7, o / 2, L, 0.3, d + o + 0.9, TEAL, { faces: 'fb', under: true });
        P.push(Object.assign({ s: 'cyl', p: [r3(-L / 2 + 1), 0, r3(r + o - 0.25)], r: 0.12, h: 3.5, seg: 8, cap: false, n: Math.floor((L - 2) / C) + 1, step: [C, 0, 0] }, look(ALU))); cyl(0, 7.3, 0, 1.6, 1.6, GLD, 16); cyl(0, 8.9, 0, 1.9, 0.2, ALU, 16);
    };
    B.court = (w, d, row) => {   // the lab service court: sheds round a truck yard — a vaulted bay shed + dock, the boiler house + its stack, the tank farm
        const t = 8.75; row.dead = true;
        box(-w / 2 + t / 2, 0, 0, t, 6, d, CORR, { top: false }); vault(-w / 2 + t / 2, 6, 0, d, t, 2.6, 'z', CORR, CORR); solid(-w / 2 + t / 2, 0, t, d, 7);
        box(-w / 2 + t + 1.2, 0, 0, 2.4, 1.2, d - 12, CONCD); block(-w / 2 + t + 1.2, 0, 2.4, d - 12, 1.2); shed(-w / 2 + t + 1.6, 4.4, 0, d - 12, 3.4, 0.8, CORRR, 270, null, { under: true });
        P.push(Object.assign({ s: 'box', p: [r3(-w / 2 + t + 0.06), 1.2, -6], size: [0.12, 2.9, 3.2], n: 4, step: [0, 0, 4] }, look(['urban:MetalCorrugatedPainted1a', 0xc8ccd4])));
        box(t / 2, 0, -d / 2 + 4, w - t, 5.2, 8, BRICKD, { top: false }); rows('f', t / 2, w - t - C, -d / 2 + 8, 1, FAC, 1.6); box(t / 2, 5.2, -d / 2 + 4, w - t + 0.5, 0.35, 8.5, CONC, { under: true }); solid(t / 2, -d / 2 + 4, w - t, 8, 7); door('f', 2, -d / 2 + 8, DOORP, 2.2);
        const sx = w / 2 - 3.2, sz = -d / 2 + 3.6; cyl(sx, 5.2, sz, 1.4, 21, BRICK, 16, 1.0); cyl(sx, 23, sz, 1.08, 0.9, MARB, 16, null, { cap: false }); cyl(sx, 24.8, sz, 1.04, 0.9, MARB, 16, null, { cap: false });
        [0, 5.8, 11.6].forEach((x, i) => { const cx = -w / 2 + t + 5 + x, cz = d / 2 - 4; cyl(cx, 0.6, cz, 2.4, 6.4 - i * 0.8, ALU, 18, null, { cap: false }); dome(cx, 7 - i * 0.8, cz, 2.4, ALU, 0.35, 18); box(cx, 0, cz, 5.2, 0.6, 5.2, CONCD); block(cx, cz, 4.8, 4.8, 6); });
        box(4, 3.2, d / 2 - 7.4, w - t - 3, 0.5, 0.5, ['calm_snow', 0xf0c040], { under: true }); box(4, 3.9, d / 2 - 7.4, w - t - 3, 0.3, 0.3, ['calm_snow', 0xd04838]); P.push(Object.assign({ s: 'box', p: [-6, 0, r3(d / 2 - 7.4)], size: [0.3, 3.2, 0.3], n: 4, step: [6, 0, 0] }, look(GUN)));
    };
    B.secret = (w, d, row) => {   // the research annex: a windowless black slab under a gunmetal barrel roof, slit windows, dishes and a mast. WALK-IN
        const D = doorAt(w, 0); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_security', storeys: 1 });
        front(w, 3.5, d, BLACK, D); shell(w, 3.5, d, BLACK); vault(0, 3.5, 0, w, d + 0.5, 3.6, 'x', GUN, BLACK);
        P.push(Object.assign({ s: 'quad', p: [r3(-w / 2 + 2.6), 2.2, r3(d / 2 + 0.05)], size: [0.5, 1.0], n: Math.floor((w - 5) / C) + 1, step: [C, 0, 0], glow: 0.6, kind: 'glass' }, look(['urban:GlassWindowFactory1a', 0x70f0c0])));
        box(D.lx - 1.6, 0, d / 2 + 0.3, 0.5, 3.0, 0.6, GUN); box(D.lx + 1.6, 0, d / 2 + 0.3, 0.5, 3.0, 0.6, GUN); box(D.lx, 2.9, d / 2 + 0.5, 4.2, 0.4, 1.0, GUN, { under: true });
        [-w / 2 + 4, w / 2 - 6].forEach(x => { cyl(x, 6.6, 0, 0.14, 2.4, ALU, 8); cyl(x, 9.0, 0, 0.3, 0.7, ALU, 16, 1.7); }); cyl(w / 2 - 2, 6, 0, 0.1, 9, ALU, 6); box(w / 2 - 2, 15, 0, 0.3, 0.3, 0.3, [null, 0xff3020], { glow: 1 });
    };
    B.museum = (w, d, row) => {   // the science museum: a glass hall under one long barrel roof, a faceted planetarium globe at its end. WALK-IN
        const D = doorAt(w, -4); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_lobby_glass_double', storeys: 2 });
        front(w, 7, d, WHITE, D); shell(w, 7, d, WHITE); win('f', D.lx - 1.2 - (w / 2 + D.lx - 2) / 2, 0.6, Math.floor((w / 2 + D.lx - 2) / T) * T, 5.4, d / 2, GLT); win('f', D.lx + 4.7, 0.6, 7, 5.4, d / 2, GLT); win('f', D.lx, 2.5, T, 3.5, d / 2, GLT);
        win('b', 0, 2.6, w - C, T, d / 2, GL); vault(0, 7, 0, w, d + 1.6, 2.6, 'x', ALU, GLT);
        P.push(Object.assign({ s: 'box', p: [r3(-w / 2 + 1), 0, r3(d / 2 + 0.25)], size: [0.3, 7, 0.5], n: Math.floor((w - 12) / C) + 1, step: [C, 0, 0] }, look(ALU)));
        const gx = w / 2 - 4.5, gz = d / 2 + 2.2; cyl(gx, 0, gz, 3.2, 1.2, CONCD, 16); P.push(Object.assign({ s: 'dome', p: [r3(gx), 4.2, r3(gz)], r: 4.2, h: 4.2, seg: 10, rings: 4, roof: true, glow: 0.3 }, look(['calm_tiles', 0xbcd4ff])));   // the planetarium globe stands OUT of the front (inside the hall it read as a grey lump)
        cyl(gx, 1.2, gz, 3.2, 3.0, ['calm_tiles', 0xbcd4ff], 10, 4.2, { cap: false, glow: 0.3 }); block(gx, gz, 8, 8, 6);
        box(D.lx, 3.1, d / 2 + 1.5, 7, 0.25, 3, ['calm_snow', 0x3c7cd8], { under: true });
    };
    B.clinic = (w, d, row) => {   // the clinic: white tile, a glass-block round corner, a canopy on thin posts, the cross on a pylon. WALK-IN
        const D = doorAt(w, 1.5); Object.assign(row, { hollow: true, door: D.door, leaf: 'leaf_lobby_glass_double', storeys: 1 });
        front(w, 3.5, d, TILEW, D); shell(w, 3.5, d, TILEW); box(0, 0, 0, w + 0.1, 0.9, d + 0.1, MINT, { faces: 'blr', top: false }); box(0, 3.5, 0, w + 0.8, 0.3, d + 0.8, MINT, { under: true });
        box(0, 3.8, 0, w - 3, 1.5, d - 3, GL, { top: false }); box(0, 5.3, 0, w - 2, 0.3, d - 2, ALU, { under: true });
        cyl(-w / 2 + 0.2, 0, d / 2 - 0.2, 2.2, 3.5, GLK, 16, null, { cap: false }); block(-w / 2 + 0.6, d / 2 + 1.0, 3.6, 2.2, 3.5);
        win('l', -1.5, 1.3, Math.floor((d - 5) / T) * T, T, w / 2, GL); win('r', 0, 1.3, d - C, T, w / 2, GL); win('b', 0, 1.3, w - T, T, d / 2, GL);
        box(D.lx, 2.8, d / 2 + 1.8, 5, 0.25, 3.6, TILEW, { under: true }); [-1, 1].forEach(s => cyl(D.lx + s * 2.2, 0, d / 2 + 3.3, 0.1, 2.8, ALU, 8));
        const px = w / 2 - 0.6, pz = d / 2 + 1.2; box(px, 0, pz, 0.5, 7, 0.5, TILEW); box(px, 7, pz, 1.9, 1.9, 0.4, TILEW); panel('f', px, 7.7, 1.5, 0.5, pz + 0.2, [null, 0x1ea05a], { glow: 0.7 }); panel('f', px, 7.2, 0.5, 1.5, pz + 0.2, [null, 0x1ea05a], { glow: 0.7 }); block(px, pz, 0.6, 0.6, 7);
    };
    B.newsstand = (w, d) => {   // roof route: the print shop + news kiosk — blue tile, a glass shopfront, a deep canopy all along the front, a sign frame
        box(0, 0, 0, w, 7, d, TILEB, { top: false }); box(0, 0, 0, w + 0.1, 1.0, d + 0.1, TILEN); win('f', -0.9, 1.0, Math.floor((w - 4) / T) * T, 2.2, d / 2, GLB); rows('f', 0, w - T, d / 2, 1, GL, 4.4); rows('l', 0, d - T, w / 2, 1, GL, 4.4); rows('r', 0, d - T, w / 2, 1, GL, 4.4); rows('b', 0, w - T, d / 2, 1, GL, 4.4);
        box(0, 3.3, d / 2 + 1.1, w + 1.2, 0.3, 2.6, TILEN, { under: true }); cornice(w, d, 6.6, TILEW, 0.3, 0.4); door('f', w / 2 - 1.6, d / 2, DOORS); box(0, 4.2, d / 2 + 0.25, w * 0.6, 1.4, 0.2, TRUSS, { kind: 'over', ds: true });
    };
    B.foodstand = (w, d, row) => {   // the food stand: a tiled counter under a big red canopy, a yellow sign board
        Object.assign(row, { storeys: 1, d: r3(d - 4) }); [row.x, row.z] = toWorld(0, -2);
        box(0, 0, -2, w - 1, 3.4, d - 4, TILEW, { top: false }); box(0, 0, -2, w - 0.9, 1.1, d - 3.9, ['calm_tiles', 0xd84a3a]); box(0, 1.1, d / 2 - 3.95, w - 3, 1.7, 0.1, ['calm_gunmetal', 0x8088a0]); box(0, 1.0, d / 2 - 3.7, w - 2.4, 0.15, 0.8, ALU);
        shed(0, 3.2, d / 2 - 2, w + 0.6, 4.4, 1.0, CORRR, 180, null, { under: true }); [-1, 1].forEach(s => cyl(s * (w / 2 - 0.3), 0, d / 2 - 0.1, 0.1, 4.1, ALU, 8)); box(0, 3.4, -2, w - 0.6, 0.3, d - 3.6, CORRR); box(0, 3.9, -3, w - 2, 1.5, 0.25, ['calm_tiles', 0xf4c83c]);
    };
    B.gatehouse = (w, d, row) => {   // the guard post: a glass booth under a wide flat roof, a barrier arm
        Object.assign(row, { storeys: 1, w: r3(w - 6), d: r3(d - 3) }); box(0, 0, 0, w - 6, 1.1, d - 3, CONCD, { top: false }); box(0, 1.1, 0, w - 6, 2.0, d - 3, GLR, { top: false }); box(0, 3.1, 0, w - 1, 0.35, d + 1.5, CONC, { under: true }); box(0, 3.45, 0, w - 5, 0.5, d - 2, GUN); door('f', 0, d / 2 - 1.5, DOORP, 1.3);
        cyl(w / 2 - 2, 0, d / 2 + 0.6, 0.16, 1.2, ALU, 8); box(w / 2 - 2 + 2.8, 1.1, d / 2 + 0.6, 5.6, 0.16, 0.16, ['calm_tiles', 0xe84030]);
    };
    B.store = (w, d, row) => {   // the corner store: a glass front, a red fascia with a lit sign band, a flat roof
        Object.assign(row, { storeys: 1 }); box(0, 0, 0, w, 3.6, d, TILEW, { top: false }); win('f', 0, 0.5, Math.floor((w - T) / T) * T, 2.4, d / 2, GLB); box(0, 3.2, d / 2 + 0.35, w + 0.4, 1.3, 0.7, ['calm_tiles', 0xe8443c], { under: true }); panel('f', 0, 3.5, w - 4, 0.6, d / 2 + 0.7, [null, 0xfff4d0], { glow: 0.8 });
        box(0, 3.6, 0, w + 0.3, 0.3, d + 0.3, CONC, { under: true }); door('f', 0, d / 2, DOORS, 2.6); box(-w / 2 + 2, 3.9, -1, 2, 1.1, 2, ALU);
    };
    B.pavilion = (w, d, row) => {   // the museum's ticket + gift pavilion: a glass box under a tilted floating roof on four posts
        Object.assign(row, { storeys: 1, w: r3(w - 4), d: r3(d - 2.6) }); box(0, 0.5, 0, w - 4, 2.5, d - 2.6, GLR, { top: false }); box(0, 0, 0, w - 3.9, 0.5, d - 2.5, CONCD); box(0, 3.0, 0, w - 4, 0.15, d - 2.6, CONCD);
        shed(0, 3.4, 0, w + 1, d + 1, 1.5, ['calm_snow', 0x3c7cd8], 180, null, { under: true }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(a * (w / 2 - 0.4), 0, b * (d / 2 - 0.4), 0.13, b > 0 ? 4.7 : 3.6, ALU, 8)); door('f', 0, d / 2 - 1.3, DOORS, 2.6);
    };
    B.bandstand = () => { cyl(0, 0, 0, 4.2, 0.2, STONE, 8); P.push(Object.assign({ s: 'cyl', p: [0, 0.2, 0], r: 0.14, h: 3.7, seg: 8, cap: false, ring: { n: 8, r: 3.7, a0: 22.5 } }, look(['calm_snow', 0x2c4a3c]))); cyl(0, 3.9, 0, 4.5, 0.25, ['calm_snow', 0x2c4a3c], 8); cone(0, 4.15, 0, 4.6, 2.2, VERD, 8); cyl(0, 6.35, 0, 0.1, 1.2, ALU, 6); };

    /* ═══ THE DISTRICT: plan building → its builder ═══ */
    const KIND = { 'P00-04-B1': 'dorm', 'P01-04-B1': 'bookshop', 'P01-04-B2': 'PACK', 'P01-04-B3': 'workshop', 'P02-04-B1': 'observatory', 'P03-04-B1': 'faculty', 'P03-04-B2': 'newsstand',
        'P01-05-B1': 'lecture', 'P02-05-B1': 'lab', 'P02-05-B2': 'annex', 'P03-05-B1': 'psych', 'P03-05-B2': 'foodstand', 'P00-06-B1': 'cafe', 'P00-06-B2': 'PIZZA', 'P01-06-B1': 'library', 'P02-06-B1': 'court',
        'P03-06-B1': 'secret', 'P03-06-B2': 'gatehouse', 'P00-07-B1': 'gate', 'P01-07-B1': 'clinic', 'P01-07-B2': 'store', 'P02-07-B1': 'museum', 'P02-07-B2': 'pavilion' };
    /* ── THE POLISH PASS (mondo 11-13 20:15: "one more polish pass on the exteriors ... go one or two more layers deep with the detail, the
       foundation is already there and is good"): the second layer every building gets from its own parts, written once — a stone plinth, a
       string course a storey, corner stones on brick and stone, a sill and a head on every window strip, a step and a lamp at every door,
       downpipes with hoppers on the back corners, a hanging sign at the shops, plant on the flat roofs. Drawn only (arch parts). ── */
    const MASON = /TileSubway|calm_marble|calm_castle/, WALLK = /TileSubway|calm_marble|calm_castle|Plaster|calm_tiles$|ConcreteStriped|calm_planks/;
    const TRIM = ['calm_marble', 0xfffaf0], TRIMD = ['calm_marble', 0xc4bcb0], PIPE = ['calm_gunmetal', 0xc0c8d8], IRON = ['calm_gunmetal', 0x9098a8];
    const SIGNS = { bookshop: 0x3c8a5c, store: 0xe8443c, cafe: 0xf0a830, workshop: 0x3c7cd8, clinic: 0x3ab878, newsstand: 0xe8c040, foodstand: 0xe85a30, museum: 0x4a6cd0, library: 0x8a2c2c };
    const FLAT = { clinic: 5.6, store: 3.9 };
    const LABEL = { library: ['LIBRARY', '#f4ecd8', '#5a1e1e'], lecture: ['LECTURE HALL', '#f4ecd8', '#5a1e1e'], dorm: ['DORMITORY', '#f4ecd8', '#5a1e1e'], cafe: ['CAFE', '#3a2a10', '#f0b040'], bookshop: ['BOOKS', '#f4ecd8', '#2c6a4a'],
        workshop: ['BIKE REPAIR', '#ffffff', '#2c5cb0'], observatory: ['OBSERVATORY', '#e8f4ee', '#24584a'], lab: ['RESEARCH LAB', '#ffffff', '#2a3a4a'], annex: ['LAB ANNEX', '#ffffff', '#2a3a4a'], psych: ['PSYCHOLOGY', '#ffffff', '#2a6a68'],
        museum: ['SCIENCE MUSEUM', '#ffffff', '#3a5cc0'], clinic: ['CLINIC', '#ffffff', '#2a9a64'], store: ['CORNER STORE', '#ffffff', '#c83a32'], newsstand: ['NEWS', '#2a2410', '#e8c040'], foodstand: ['HOT FOOD', '#ffffff', '#d84a28'],
        secret: ['AUTHORISED STAFF ONLY', '#f0d040', '#202428'], gatehouse: ['SECURITY', '#ffffff', '#202428'] };
    const SCI = { lab: 1, annex: 1, court: 1, secret: 1, observatory: 1, psych: 1 };
    const polish = (kind, walkedRoof) => {
        const base = P.slice(), NRM = ry => { const q = (ry || 0) * Math.PI / 180; return [-Math.sin(q), Math.cos(q)]; }, sq = v => Math.abs(Math.round(v)) % 2 === 1 ? Math.abs(Math.round(v)) : 0;
        const doors = base.filter(q => q.s === 'quad' && /^urban:Door/.test(q.key || '')), holes = base.filter(q => q.s === 'quad' && q.hole);
        const doorFace = {}; doors.forEach(q => { doorFace[(q.ry || 0) % 360] = true; }); holes.forEach(q => { doorFace[(q.ry || 0) % 360] = true; });
        const FRY = { f: 0, b: 180, r: 270, l: 90 };
        /* the walls: every plain upright box that stands on the ground */
        let shellBox = null;
        base.forEach(q => {
            if (q.s !== 'box' || q.n || q.ry || q.ring || !q.size || q.sides === false || !WALLK.test(q.key || '')) return;
            const [x, y, z] = q.p, [w, h, d] = q.size; if (y > 0.05 || h < 3 || Math.min(w, d) < 3) return;
            if (!shellBox || w * d > shellBox.size[0] * shellBox.size[2]) shellBox = q;
            const fc = q.faces || 'fblr', strip = (f, yy, hh, o, L) => { if (fc.indexOf(f) < 0) return;
                if (f === 'f') box(x, yy, z + d / 2 + o / 2, w + 2 * o, hh, o, L, { under: true }); if (f === 'b') box(x, yy, z - d / 2 - o / 2, w + 2 * o, hh, o, L, { under: true });
                if (f === 'r') box(x + w / 2 + o / 2, yy, z, o, hh, d, L, { under: true }); if (f === 'l') box(x - w / 2 - o / 2, yy, z, o, hh, d, L, { under: true }); };
            const mason = MASON.test(q.key), T1 = mason ? TRIM : TRIMD;
            'fblr'.split('').forEach(f => { if (!doorFace[FRY[f]]) strip(f, 0, 0.55, 0.12, TRIMD); });   // the plinth (never across a door)
            for (let yy = C; yy < h - 1.2; yy += C) 'fblr'.split('').forEach(f => strip(f, yy - 0.09, 0.18, 0.09, T1));   // a string course a storey
            if (mason && h >= 5) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { if ((b > 0 && fc.indexOf('f') < 0)) return;   // the corner stones
                P.push(Object.assign({ s: 'box', p: [r3(x + a * (w / 2 - 0.12)), 0.6, r3(z + b * (d / 2 - 0.12))], size: [0.46, 0.34, 0.46], n: Math.max(1, Math.floor((h - 0.9) / 0.68)), step: [0, 0.68, 0] }, look(TRIM))); });
            if (h >= 5) [-1, 1].forEach(a => { const px = x + a * (w / 2 + 0.1), pz = z - d / 2 + 0.5;   // a downpipe + its hopper on each back corner
                cyl(px, 0, pz, 0.07, h - 0.3, PIPE, 6, null, { cap: false }); box(px, h - 0.55, pz, 0.3, 0.3, 0.3, PIPE); });
        });
        /* the windows: a sill under and a head over every strip of a window sheet */
        base.forEach(q => { if (q.s !== 'quad' || q.hole || !/^urban:(GlassWindow|DecalWindows)/.test(q.key || '') || !q.size || q.size[0] < 1.5 || q.n) return;
            const [nx, nz] = NRM(q.ry), [len, h] = q.size, o = { size: [r3(len + 0.3), 0.1, 0.26] }; if (q.ry) o.ry = q.ry;
            part('box', [q.p[0] + nx * 0.02, q.p[1] - 0.1, q.p[2] + nz * 0.02], TRIM, o);
            part('box', [q.p[0] + nx * 0.02, q.p[1] + h, q.p[2] + nz * 0.02], TRIM, Object.assign({}, o, { size: [r3(len + 0.2), 0.14, 0.2] })); });
        /* the doors: a step, a lamp beside, the shop's hanging sign at the first */
        const dl = doors.map(q => ({ x: q.p[0], z: q.p[2], ry: q.ry || 0, w: q.size[0] })).concat(holes.map(q => ({ x: q.p[0] + q.hole[0], z: q.p[2], ry: q.ry || 0, w: q.hole[1] })));
        dl.forEach((D, i) => { const [nx, nz] = NRM(D.ry), tx = nz, tz = -nx, o = D.ry ? { ry: D.ry } : {};
            part('box', [D.x + nx * 0.45, 0, D.z + nz * 0.45], TRIMD, Object.assign({ size: [r3(D.w + 0.8), 0.12, 0.9] }, o));
            const lx = D.x + tx * (D.w / 2 + 0.4) + nx * 0.14, lz = D.z + tz * (D.w / 2 + 0.4) + nz * 0.14;
            part('box', [lx, 2.3, lz], IRON, Object.assign({ size: [0.1, 0.1, 0.28] }, o)); part('box', [lx + nx * 0.1, 2.05, lz + nz * 0.1], [null, 0xffe2a0], Object.assign({ size: [0.2, 0.3, 0.2], glow: 1 }, o));
            if (i === 0 && SIGNS[kind]) { const sx = D.x - tx * (D.w / 2 + 0.7) + nx * 0.62, sz = D.z - tz * (D.w / 2 + 0.7) + nz * 0.62;
                part('box', [sx, 3.62, sz], IRON, Object.assign({ size: [0.06, 0.06, 1.2] }, o)); part('box', [sx, 2.8, sz], ['calm_snow', SIGNS[kind]], Object.assign({ size: [0.1, 0.8, 1.0], under: true }, o));
                part('box', [sx, 2.95, sz], ['calm_snow', 0xfff4dc], Object.assign({ size: [0.13, 0.5, 0.7] }, o)); }
        });
        /* ROOFS + AC UNITS (mondo 20:18): wall units under the back and side windows of the lived-in buildings, plant on every flat roof —
           condensers on a pad, a vent stack, a roof hatch; on a walked roof (the roof route) they stand along the back edge and block */
        base.forEach((q, i) => { if (q.s !== 'quad' || !/^urban:(DecalWindowsResidential|GlassWindowResidential)/.test(q.key || '') || !(q.ry) || !q.size || q.size[0] < 3 || q.p[1] < 3) return;
            const [nx, nz] = NRM(q.ry), tx = nz, tz = -nx, o = { ry: q.ry }, k = (i % 2 ? 0.25 : -0.25) * q.size[0];
            part('box', [q.p[0] + tx * k + nx * 0.2, q.p[1] - 0.62, q.p[2] + tz * k + nz * 0.2], ['calm_tiles', 0xc4c8cc], Object.assign({ size: [0.8, 0.5, 0.42], under: true }, o));
            part('quad', [q.p[0] + tx * k + nx * 0.43, q.p[1] - 0.56, q.p[2] + tz * k + nz * 0.43], ['urban:MetalSubwayGrill1a', 0xffffff], Object.assign({ size: [0.7, 0.38], uv: 'fit', kind: 'wall' }, o)); });
        const unit = (ux, y, uz, blk) => { box(ux, y, uz, 1.9, 0.12, 1.4, TRIMD); box(ux, y + 0.12, uz, 1.5, 0.95, 1.0, ['calm_tiles', 0xc8ccd0]); cyl(ux, y + 1.07, uz, 0.36, 0.08, IRON, 10);
            part('quad', [ux, y + 0.27, uz + 0.51], ['urban:MetalSubwayGrill1a', 0xffffff], { size: [1.3, 0.65], uv: 'fit', kind: 'wall' }); if (blk) block(ux, uz, 1.6, 1.1, y + 1.1); };
        const stack = (vx, y, vz, blk) => { cyl(vx, y, vz, 0.22, 1.3, PIPE, 8); cyl(vx, y + 1.3, vz, 0.36, 0.14, PIPE, 8); if (blk) block(vx, vz, 0.6, 0.6, y + 1.4); };
        const plant = (x, y, z, w, d, walked) => {
            if (walked) {   // along the roof's edges, never within 5 m of a bridge / a stair / a ladder landing, never on a tier
                const routes = []; features.forEach(f => { if (!/^(bridge|ramp|landing|climb|deck)$/.test(f.k)) return; [[f.x, f.z], [f.x0, f.z0], [f.x1, f.z1]].forEach(q => { if (q[0] != null && q[1] != null) routes.push(q); }); });
                const free = (lx, lz) => { const [wx, wz] = toWorld(lx, lz); return !routes.some(q => Math.hypot(q[0] - wx, q[1] - wz) < 5) && !tiers.some(t => Math.abs(lx - t[0]) < t[2] / 2 + 1.4 && Math.abs(lz - t[1]) < t[3] / 2 + 1.2); };
                const spots = []; [-1, 1].forEach(sd => [-0.3, -0.1, 0.1, 0.3].forEach(a => spots.push([a * w, sd * (d / 2 - 1.5)])));
                const ok = spots.filter(q => free(q[0], q[1])).slice(0, 3);
                ok.forEach((q, i) => (i < 2 ? unit : stack)(q[0], y, q[1], true));
                return; }
            [-0.28, 0.2].forEach(a => unit(x + a * w, y, z - 0.22 * d, false)); stack(x + 0.34 * w, y, z + 0.26 * d, false);
            box(x - 0.36 * w, y, z + 0.22 * d, 1.1, 0.35, 1.1, IRON); box(x + 0.05 * w, y, z + 0.3 * d, 2.2, 0.5, 0.5, ['urban:MetalCorrugatedPainted1a', 0xffffff]);
        };
        if (walkedRoof) plant(0, 7, 0, walkedRoof[0], walkedRoof[1], true);
        else if (FLAT[kind] && shellBox) plant(shellBox.p[0], FLAT[kind], shellBox.p[2], shellBox.size[0], shellBox.size[2], false);
        /* TEXTURES + DECALS (mondo 20:19: "different textures or decals for different parts of the building"): a louvre grille low on the back
           wall, a rubber mat on every door step, and on the science side a hazard plate by the door + a caution plate on the back wall */
        if (shellBox) { const [x, , z] = shellBox.p, [w, , d] = shellBox.size;
            [-0.3, 0.3].forEach(a => part('quad', [x + a * w, 0.7, z - d / 2 - 0.13], ['urban:MetalSubwayGrill2a', 0xffffff], { size: [1.2, 0.8], uv: 'fit', kind: 'wall', ry: 180 }));
            if (SCI[kind]) part('quad', [x, 1.9, z - d / 2 - 0.13], ['urban:SignCaution1a', 0xffffff], { size: [0.7, 0.7], uv: 'fit', ry: 180, win: 'keep' }); }
        /* SIGN LETTERING (the shared 'txt:' sheet, PR #1327): the building's plain name on a board over its first door — what it IS, no invented names */
        if (LABEL[kind] && dl.length) { const D = dl[0], [nx, nz] = NRM(D.ry), o = D.ry ? { ry: D.ry } : {}, t = LABEL[kind], len = r3(Math.max(1.6, 0.32 * t[0].length + 0.7)), asp = Math.round(len / 0.55 * 10) / 10;
            part('box', [D.x + nx * 0.14, 2.42, D.z + nz * 0.14], IRON, Object.assign({ size: [r3(len + 0.16), 0.71, 0.1] }, o));
            P.push(Object.assign({ s: 'quad', p: [r3(D.x + nx * 0.2), 2.5, r3(D.z + nz * 0.2)], size: [len, 0.55], uv: 'fit', kind: 'wall', key: 'txt:' + t[0] + '|' + t[1] + '|' + t[2] + '|' + asp }, o)); }
        dl.forEach((D, i) => { const [nx, nz] = NRM(D.ry), tx = nz, tz = -nx, o = D.ry ? { ry: D.ry } : {};
            part('box', [D.x + nx * 0.45, 0.12, D.z + nz * 0.45], ['urban:RubberNonSlip1a', 0xffffff], Object.assign({ size: [r3(D.w), 0.025, 0.6], sides: false }, o));
            if (SCI[kind] && i === 0) part('quad', [D.x + tx * (D.w / 2 + 1.0) + nx * 0.06, 1.5, D.z + tz * (D.w / 2 + 1.0) + nz * 0.06], [kind === 'secret' ? 'urban:SignProhibited1a' : 'urban:SignHazard1a', 0xffffff], Object.assign({ size: [0.55, 0.55], uv: 'fit' }, o)); });
    };
    /* ── THE INSIDES (mondo 11-13 21:04 "let's go ahead and do the interiors", his OK on the grid plan 21:23; his grid rule 21:14 + 21:17: a
       barrier fills whole 3.5 m battle squares, a walkway is a whole square wide, dressing sits OFF the square centres). One room a walk-in
       building; ROOMS[kind].g = the approved plan, rows listed BACK first, columns from the LEFT as you face the front from outside; '' =
       a walkway square, a word = what fills that square (FILL). Catalogue props + arch parts; every filled square gets one ghost block. ── */
    let lodgeRow = null;
    const ROOMS = {
        library: { floorIn: 'calm_planks', keyIn: 'urban:PlasterWallPainted1a', g: [['shelfw', 'shelfw', 'shelfw', 'shelfw', 'shelfw', 'shelfw', 'shelfw', 'shelfw'], ['', 'rtable', '', 'shelf', '', 'rtable', '', 'stair'], ['', 'rtable', '', 'shelf', '', 'rtable', '', ''], ['arm', '', '', 'ldesk', '', '', '', 'files']], gallery: true },
        cafe: { floorIn: 'urban:TileGeneric5a', keyIn: 'urban:PlasterWallStucco1a', g: [['range', 'sinks', 'fridge', 'cake', '', 'ctable', ''], ['counter', 'till', 'counter', 'counter', '', '', ''], ['', '', '', '', '', 'ctable', ''], ['booth', 'booth', '', '', '', 'booth', 'booth']] },
        lab: { floorIn: 'calm_tiles', keyIn: 'urban:PlasterWallPainted1a', g: [['racks', 'racks', 'racks', 'mstack', 'fhood', 'tank', 'stable', 'tank'], ['', '', '', '', '', '', '', ''], ['', 'bench', 'bench', '', 'bench', 'bench', '', ''], ['lockers', '', '', '', '', '', 'desk', 'crates']], glass: [[5, 2, 5, 4], [5, 2, 6, 2], [7, 2, 8, 2]] },
        psych: { floorIn: 'calm_carpet', keyIn: 'urban:PlasterWallPainted1a', g: [['mstack', '', '', 'recep', '', 'couch', 'chaise'], ['egg', '', 'wait', '', '', '', 'arm1']], glass: [[2, 1, 2, 2]], part: [[5, 1, 5, 2]] },
        secret: { floorIn: 'calm_concrete', keyIn: 'urban:ConcreteStriped1a', g: [['racks', 'racks', 'racks', '', 'console', 'specs', 'tank', 'tank', 'tank'], ['', '', '', '', '', '', '', '', ''], ['crates', 'crates', '', 'desk', '', '', 'stable', '', 'lockers']], gate: [4, 1] },
        clinic: { floorIn: 'calm_tiles_small', keyIn: 'urban:TileGeneric1a', g: [['lockers', '', 'cabinets'], ['bed', '', 'bed'], ['', '', ''], ['recep', 'recep', ''], ['wait', '', 'vend']], part: [[0, 2, 2, 2], [0, 4, 1, 4], [2, 4, 3, 4]] },
        museum: { floorIn: 'urban:TileMarble1a', keyIn: 'urban:PlasterWallPainted1a', g: [['btele', 'case', 'case', 'orrery', 'case', 'case', 'meteor', 'fish', 'tele'], ['', '', '', '', '', '', '', '', ''], ['globe', '', 'ticket', '', '', 'mbench', 'dino', 'dino2', 'trophy']], planets: true },
        lodge: { floorIn: 'calm_planks', keyIn: 'urban:PlasterWallStucco1a', g: [['pdesk', ''], ['arm1', '']] },
    };
    const inside = (kind, row) => {
        const R = ROOMS[kind], q0 = ctx.rot * Math.PI / 180, c0 = Math.cos(q0), s0 = Math.sin(q0), dx = row.x - ctx.x, dz = row.z - ctx.z, ox = dx * c0 + dz * s0, oz = -dx * s0 + dz * c0;
        const W = row.w, D = row.d, nc = R.g[0].length, nr = R.g.length, cw = W / nc, cd = D / nr, H = Math.max(3.4, (row.storeys || 1) * C - 0.3);
        Object.assign(row, { floorIn: R.floorIn, keyIn: R.keyIn });
        const prop = (key, lx, lz, f, y, top) => { const [x, z] = toWorld(lx, lz), q = { key, x, z, face: ((ctx.rot + (f || 0)) % 360 + 360) % 360 }; if (y) q.y = r3(y); if (!top) q.floor = true; props.push(q); };   // floor: on the room's floor, never on its own square's ghost block (top = on the gallery's slab)
        const fill = (lx, lz, h) => block(lx, lz, Math.min(3.3, cw - 0.2), Math.min(3.3, cd - 0.2), h);
        const seg = (x0, z0, x1, z1, h) => { const a = toWorld(x0, z0), b = toWorld(x1, z1); features.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h, t: 0.2, ghost: true, rail: false }); };
        const WOODD = ['calm_planks', 0xb89878], STEEL = ['calm_tiles', 0xc8d0d8], DARK = ['calm_gunmetal', 0xb0b8c8], CUSH = ['calm_snow', 0x4a8a9c];
        const board = (lx, y, lz, len, hh, ry, txt, fg, bg) => P.push(Object.assign({ s: 'quad', p: [r3(lx), y, r3(lz)], size: [len, hh], uv: 'fit', kind: 'wall', key: 'txt:' + txt + '|' + fg + '|' + bg + '|' + Math.round(len / hh * 10) / 10 }, ry ? { ry } : {}));
        const FILL = {
            /* (x, z) = the square's middle; back = the square's back edge is the room's wall */
            shelfw: (x, z) => { [-0.85, 0.85].forEach(a => prop('library_shelf_full', x + a, z - 0.35, 0)); box(x, 0, z - 1.2, 3.4, 3.2, 0.5, WOODD); fill(x, z, 2.6); },
            shelf: (x, z) => { [-0.85, 0.85].forEach(a => { prop('library_shelf_full', x - 0.5, z + a, 270); prop('library_shelf_full', x + 0.5, z + a, 90); }); fill(x, z, 2.6); },
            rtable: (x, z) => { prop('conference_table', x, z, 90); [-0.9, 0.9].forEach(a => { prop('cafeteria_chair', x - 1.25, z + a, 90); prop('cafeteria_chair', x + 1.25, z + a, 270); }); prop('desk_lamp', x + 0.3, z - 0.7, 0, 0.76); fill(x, z, 1.0); },
            arm: (x, z) => { prop('psx_armchair_1', x - 0.8, z - 0.5, 20); prop('psx_armchair_1', x + 0.8, z - 0.5, 340); prop('psx_coffee_table_1', x, z + 0.7, 0); fill(x, z, 1.0); },
            arm1: (x, z) => { prop('psx_armchair_1', x, z, 0); prop('globe_lamp', x - 1.1, z - 1.1, 0); fill(x, z, 1.0); },
            ldesk: (x, z) => { prop('round_desk', x, z, 0); prop('office_chair', x, z - 0.9, 0); prop('desk_lamp', x + 0.6, z + 0.2, 0, 0.76); fill(x, z, 1.0); },
            pdesk: (x, z) => { prop('tanker_desk', x, z, 0); prop('office_chair', x, z - 0.9, 0); prop('desk_lamp', x - 0.5, z + 0.1, 0, 0.76); board(x, 1.6, z - cd / 2 + 0.3, 1.6, 0.5, 0, 'KEYS', '#f4ecd8', '#5a3a1e'); fill(x, z, 1.0); },
            files: (x, z) => { [-1, 0, 1].forEach(a => prop('filing_cabinet', x + a, z - 0.6, 0)); fill(x, z, 1.4); },
            stair: () => {},
            range: (x, z) => { prop('kitchen_range', x - 0.8, z - 0.9, 0); prop('kitchen_range', x + 0.8, z - 0.9, 0); fill(x, z, 1.2); },
            sinks: (x, z) => { prop('sink_row', x, z - 0.9, 0); fill(x, z, 1.2); },
            fridge: (x, z) => { prop('round_fridge', x - 0.8, z - 0.9, 0); prop('mini_fridge', x + 0.7, z - 0.9, 0); fill(x, z, 1.8); },
            cake: (x, z) => { box(x, 0, z - 0.9, 3.2, 0.95, 0.9, WOODD); prop('coffee_maker', x - 0.7, z - 0.9, 0, 0.95); prop('coffee_maker', x + 0.3, z - 0.9, 0, 0.95); fill(x, z, 1.2); },
            counter: (x, z) => { box(x, 0, z, 3.5, 1.05, 1.0, WOODD); box(x, 1.05, z, 3.5, 0.06, 1.15, STEEL, { under: true }); prop('coffee_mug', x + 0.8, z + 0.2, 0, 1.11); fill(x, z, 1.2); },
            till: (x, z) => { box(x, 0, z, 3.5, 1.05, 1.0, WOODD); box(x, 1.05, z, 3.5, 0.06, 1.15, STEEL, { under: true }); prop('cash_register', x - 0.5, z, 0, 1.11); board(x, 2.4, z - 0.4, 2.6, 0.6, 0, 'MENU', '#f4ecd8', '#2a2a2a'); fill(x, z, 1.2); },
            ctable: (x, z) => { prop('tulip_table', x, z, 0); [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([a, b], i) => prop('tulip_chair', x + a * 0.95, z + b * 0.95, [180, 0, 270, 90][i])); fill(x, z, 0.9); },
            booth: (x, z) => { box(x, 0, z + 0.4, 1.1, 0.74, 2.0, WOODD); [-1, 1].forEach(a => { box(x + a * 1.15, 0, z + 0.4, 0.75, 0.45, 2.0, CUSH); box(x + a * 1.5, 0, z + 0.4, 0.14, 1.2, 2.0, CUSH); }); prop('coffee_mug', x + 0.2, z + 0.1, 0, 0.74); fill(x, z, 1.2); },
            racks: (x, z) => { [-1.1, 0, 1.1].forEach(a => prop('server_rack', x + a, z - 0.9, 0)); fill(x, z, 2.1); },
            mstack: (x, z) => { prop('monitor_stack', x - 0.6, z - 0.9, 0); prop('retro_console', x + 0.7, z - 0.4, 0); fill(x, z, 2.0); },
            tank: (x, z) => { prop('iso_tank', x, z, 0); box(x, 0, z, 2.6, 0.12, 2.6, DARK); fill(x, z, 1.4); },
            stable: (x, z) => { prop('steel_table', x - 0.8, z, 0); prop('steel_table', x + 0.8, z, 0); fill(x, z, 0.9); },
            bench: (x, z) => { box(x, 0, z, 3.4, 0.9, 1.4, STEEL); box(x, 0.9, z, 3.5, 0.06, 1.5, DARK, { under: true }); prop('psx_pc_monitor_mp_1', x - 0.8, z, 0, 0.96); prop('item_potion_flask', x + 0.7, z + 0.3, 0, 0.96); fill(x, z, 1.0); },
            lockers: (x, z) => { [-1.2, -0.4, 0.4, 1.2].forEach(a => prop('locker', x + a, z - 0.9, 0)); fill(x, z, 1.9); },
            cabinets: (x, z) => { [-0.9, 0.9].forEach(a => prop('round_cabinet', x + a, z - 0.8, 0)); prop('metal_shelving', x, z + 0.5, 0); fill(x, z, 1.8); },
            desk: (x, z) => { prop('tanker_desk', x, z, 0); prop('computer_chair_grey', x, z - 0.9, 0); prop('psx_pc_monitor_mp_1', x + 0.3, z, 0, 0.76); fill(x, z, 1.0); },
            crates: (x, z) => { prop('cardboard_boxes', x - 0.7, z - 0.5, 15); prop('cardboard_boxes', x + 0.7, z + 0.5, 290); prop('cardboard_box', x + 0.8, z - 0.8, 40); fill(x, z, 1.0); },
            console: (x, z) => { [-0.9, 0.9].forEach(a => prop('retro_console', x + a, z - 0.6, 0)); prop('monitor_stack', x, z - 1.3, 0); fill(x, z, 1.6); },
            recep: (x, z) => { box(x, 0, z, 3.5, 1.05, 0.9, STEEL); box(x, 1.05, z, 3.5, 0.06, 1.05, DARK, { under: true }); prop('office_chair', x, z - 1.0, 0); prop('psx_pc_monitor_mp_1', x - 0.6, z, 0, 1.11); fill(x, z, 1.2); },
            wait: (x, z) => { [-1.1, -0.35, 0.4, 1.15].forEach(a => prop('molded_chair', x + a, z + 0.9, 180)); prop('potted_plant', x - 1.2, z - 1.0, 0); fill(x, z, 0.9); },
            egg: (x, z) => { prop('egg_chair', x, z, 45); prop('rug_round', x + 0.3, z + 0.3, 0); fill(x, z, 1.3); },
            couch: (x, z) => { prop('curved_couch', x, z - 0.5, 0); fill(x, z, 1.0); },
            bed: (x, z) => { prop('hospital_bed', x, z, 90); prop('round_cabinet', x - 1.1, z - 1.1, 0); fill(x, z, 1.0); },
            vend: (x, z) => { prop('vending_machine', x - 0.6, z - 0.9, 0); prop('potted_plant', x + 1.0, z + 0.9, 0); fill(x, z, 1.9); },
            btele: (x, z) => { cyl(x, 0, z, 1.4, 0.35, ['calm_marble', 0xffffff], 12); prop('brass_telescope', x, z, 30, 0.35); fill(x, z, 1.6); },
            tele: (x, z) => { cyl(x, 0, z, 1.4, 0.35, ['calm_marble', 0xffffff], 12); prop('telescope', x, z, 330, 0.35); fill(x, z, 1.6); },
            case: (x, z) => { [-0.85, 0.85].forEach(a => prop('psx_display_cabinet_mp_1', x + a, z - 0.5, 0)); fill(x, z, 2.1); },
            fish: (x, z) => { box(x, 0, z, 2.8, 0.7, 1.4, ['calm_marble', 0xffffff]); prop('psx_fish_skeleton_mp_1', x, z, 0, 0.7); fill(x, z, 1.4); },
            trophy: (x, z) => { prop('trophy_case', x, z - 0.3, 0); fill(x, z, 2.1); },
            ticket: (x, z) => { box(x, 0, z, 3.2, 1.05, 0.9, WOODD); prop('cash_register', x - 0.5, z, 0, 1.05); board(x, 1.9, z - 0.2, 2.4, 0.5, 0, 'TICKETS', '#ffffff', '#3a5cc0'); fill(x, z, 1.2); },
            mbench: (x, z) => { prop('metro_bench', x, z, 0); fill(x, z, 0.9); },
            /* THE SECOND PASS (mondo 11-13 22:33: "make a list of models needed/wanted but not in the bucket or game, and make meshy versions of
               them ... Focus on aesthetic, vibe, atmosphere for the interiors"): the University's own Meshy pieces, each on whole squares */
            fhood: (x, z) => { prop('fume_hood', x, z - 0.95, 0); prop('lab_glassware', x - 0.5, z - 0.95, 10, 0.92); fill(x, z, 2.4); },
            specs: (x, z) => { prop('specimen_shelf', x - 0.84, z - 1.05, 0); prop('specimen_shelf', x + 0.84, z - 1.05, 0); fill(x, z, 2.1); },
            chaise: (x, z) => { prop('therapy_chaise', x - 0.2, z - 0.3, 20); prop('globe_lamp', x + 1.2, z - 1.2, 0); prop('rug_round', x - 0.2, z + 0.2, 0); fill(x, z, 1.0); },
            orrery: (x, z) => { cyl(x, 0, z, 0.75, 0.9, ['calm_marble', 0xffffff], 16); cyl(x, 0.9, z, 0.85, 0.06, ['calm_gunmetal', 0xc8b070], 16); prop('brass_orrery', x, z, 0, 0.96); fill(x, z, 2.0); },
            meteor: (x, z) => { prop('meteorite_plinth', x, z - 0.2, 20); [[-1.1, -1.1], [1.1, -1.1], [-1.1, 0.9], [1.1, 0.9]].forEach(([a, b]) => prop('rope_stanchion', x + a, z + b, 0)); fill(x, z, 1.4); },
            dino: (x, z) => { const cx = x + cw / 2; box(cx, 0, z, 2 * cw - 0.5, 0.3, cd - 0.5, ['calm_marble', 0x9a9488]); prop('dinosaur_skeleton', cx, z, 90, 0.3);   // two squares: the skeleton walks along the room, over both
                [-1, 0, 1].forEach(sx => [-1, 1].forEach(sz => prop('rope_stanchion', cx + sx * (cw - 0.12), z + sz * (cd / 2 - 0.12), 0)));   // a rope round the plinth, on its own squares' edges
                board(cx + 1.6, 0.9, z - cd / 2 + 0.3, 1.3, 0.4, 180, 'FOSSIL', '#f4ecd8', '#2a2a2a'); fill(x, z, 3.0); },
            dino2: (x, z) => fill(x, z, 3.0),
            globe: (x, z) => { cyl(x, 0, z, 0.5, 0.9, DARK, 10); cyl(x, 0.9, z, 0.2, 1.2, ['calm_tiles', 0x6aa8e0], 14, 1.2); P.push(Object.assign({ s: 'dome', p: [r3(x), 2.1, r3(z)], r: 1.2, h: 1.2, seg: 14, rings: 5 }, look(['calm_tiles', 0x6aa8e0]))); fill(x, z, 2.4); },
        };
        R.g.forEach((line, ri) => line.forEach((t, ci) => { if (!t) return; const x = ox - W / 2 + (ci + 0.5) * cw, z = oz - D / 2 + (ri + 0.5) * cd; if (FILL[t]) FILL[t](x, z); else console.warn('university: no fill', t); }));
        /* partitions on the squares' edges ([c0, r0, c1, r1] in squares, r counted from the FRONT): dark glass or plaster, a ghost wall each */
        const edge = (e, L, glass) => { const x0 = ox - W / 2 + e[0] * cw, x1 = ox - W / 2 + e[2] * cw, z0 = oz + D / 2 - e[1] * cd, z1 = oz + D / 2 - e[3] * cd, hh = Math.min(H, 3.2);
            if (Math.abs(x0 - x1) < 0.01) box(x0, 0, (z0 + z1) / 2, 0.12, hh, Math.abs(z1 - z0), L, glass ? { kind: 'glass', win: 'keep' } : {}); else box((x0 + x1) / 2, 0, z0, Math.abs(x1 - x0), hh, 0.12, L, glass ? { kind: 'glass', win: 'keep' } : {});
            seg(x0, z0, x1, z1, hh); };
        (R.glass || []).forEach(e => edge(e, ['urban:GlassWindowSquare1a', 0xcfe4ee], true)); (R.part || []).forEach(e => edge(e, ['urban:PlasterWallPainted1a', 0xffffff], false));
        if (R.gate) { const x = ox - W / 2 + (R.gate[0] + 0.5) * cw, z = oz + D / 2 - (R.gate[1] + 0.5) * cd; [-1, 1].forEach(a => box(x + a * 1.55, 0, z, 0.3, 2.4, 1.0, DARK)); box(x, 2.4, z, 3.4, 0.3, 1.0, DARK, { under: true }); board(x, 2.45, z + 0.51, 2.6, 0.22, 0, 'SCAN', '#f0d040', '#202428'); }
        if (R.planets) [[0.18, 0.5, 0xe8a040], [0.3, 0.32, 0x6aa8e0], [0.42, 0.42, 0xd86040], [0.56, 0.75, 0xd8b890], [0.7, 0.6, 0xe0d0a0], [0.82, 0.36, 0x8ac8d8]].forEach(([a, r, col], i) => { const x = ox - W / 2 + a * W, z = oz + (i % 2 ? 0.5 : -0.5), y = 4.2 + (i % 3) * 0.3;
            cyl(x, y - r, z, 0.03, r, [null, col], 10, r, { glow: 0.5 }); P.push({ s: 'dome', p: [r3(x), r3(y), r3(z)], r, h: r, seg: 10, rings: 4, tint: col, glow: 0.5 }); cyl(x, y + r, z, 0.015, Math.max(0.3, H - y - r), DARK, 4, null, { cap: false }); });
        if (R.gallery) {   // the library's gallery: a walk one square wide over the back row of shelves, the stair in its own square
            const zb = oz - D / 2 + cd / 2, a = toWorld(ox - W / 2, zb), b = toWorld(ox + W / 2, zb); features.push({ k: 'bridge', id: ctx.id + '-gal', x0: a[0], z0: a[1], x1: b[0], z1: b[1], w: r3(cd), y: 3.5, plain: true, key: 'calm_planks' });
            const sx = ox + W / 2 - cw / 2, s0 = toWorld(sx, oz - D / 2 + 2 * cd), s1 = toWorld(sx, oz - D / 2 + cd); features.push({ k: 'ramp', id: ctx.id + '-galstair', x0: s0[0], z0: s0[1], x1: s1[0], z1: s1[1], w: r3(cw - 0.3), h0: 0, h1: 3.5, stairs: true });
            box(ox, 3.5, zb + cd / 2 - 0.05, W - cw, 1.0, 0.08, ['calm_gunmetal', 0xb0b8c8]); for (let ci = 0; ci < nc; ci++) { const x = ox - W / 2 + (ci + 0.5) * cw; [-0.85, 0.85].forEach(q => prop('library_shelf_full', x + q, zb - cd / 2 + 0.55, 0, 0, true)); }
        }
        /* ── THE ATMOSPHERE (the second pass, mondo 11-13 22:33: "do another interior pass ... Focus on aesthetic, vibe, atmosphere for the
           interiors"). Each room: its own paint over the bare inside sheet (a wall coat, a dado, a skirting, a crown and a LIT ceiling: the
           hollow building's own ceiling draws black), its own light (lit ceiling panels, pendants, strips, chandeliers, lamp glows: drawn
           glow, the city room's ten real lights stay with the streets), and dressing OFF the square centres (books, glassware, plants,
           clocks, runners on the walkways: nothing that blocks stands on a walkway square, nothing sits half across two). ── */
        const nCol = Math.max(1, Math.round((W - 0.12) / T)), dX = -(W - 0.12) / 2 + ((row.door || Math.ceil(nCol / 2)) - 0.5) * (W - 0.12) / nCol;   // the doorway's middle, room-local
        const sx = ci => -W / 2 + (ci + 0.5) * cw, sz = ri => -D / 2 + (ri + 0.5) * cd, X = rx => r3(ox + rx), Z = rz => r3(oz + rz);
        const M = (key, tint, gain) => [key, tint, null, gain];
        const lk = L => Object.assign(look([L[0], L[1]]), L[3] ? { gain: L[3] } : {});
        const coat = (L, h, e) => { const o = lk(L); h = r3(h);
            P.push(Object.assign({ s: 'quad', p: [X(0), 0, Z(-D / 2 + e)], size: [r3(W - 2 * e), h] }, o), Object.assign({ s: 'quad', p: [X(0), 0, Z(D / 2 - e)], ry: 180, size: [r3(W - 2 * e), h], hole: [r3(-dX), 1.8, Math.min(2.25, h)] }, o),
                Object.assign({ s: 'quad', p: [X(-W / 2 + e), 0, Z(0)], ry: 270, size: [r3(D - 2 * e), h] }, o), Object.assign({ s: 'quad', p: [X(W / 2 - e), 0, Z(0)], ry: 90, size: [r3(D - 2 * e), h] }, o)); };
        /* a band round the walls (skirting, chair rail, crown): four thin boxes y up, t proud of the coat; the front one broken at the doorway */
        const band = (L, y, h, t, e) => { const o = lk(L), f = e + t / 2, run = (x0, x1, z) => { if (x1 - x0 > 0.05) P.push(Object.assign({ s: 'box', p: [X((x0 + x1) / 2), r3(y), Z(z)], size: [r3(x1 - x0), r3(h), r3(t)] }, o)); };
            run(-W / 2 + e, W / 2 - e, -D / 2 + f); if (y < 2.25) { run(-W / 2 + e, dX - 0.95, D / 2 - f); run(dX + 0.95, W / 2 - e, D / 2 - f); } else run(-W / 2 + e, W / 2 - e, D / 2 - f);
            [-1, 1].forEach(sg => P.push(Object.assign({ s: 'box', p: [X(sg * (W / 2 - f)), r3(y), Z(0)], size: [r3(t), r3(h), r3(D - 2 * e)] }, o))); };
        const liner = (wall, dado, dadoH, ceil, trimL) => { coat(wall, H, 0.34); if (dado) coat(dado, dadoH, 0.355); const tl = trimL || ['calm_gunmetal', 0x8a8a90];
            band(tl, 0, 0.14, 0.05, 0.36); if (dado) band(tl, dadoH - 0.03, 0.06, 0.05, 0.36); band(tl, H - 0.26, 0.22, 0.12, 0.36);
            if (ceil) P.push(Object.assign({ s: 'box', p: [X(0), r3(H - 0.06), Z(0)], size: [r3(W - 0.7), 0.04, r3(D - 0.7)], under: true, roof: true, top: false }, lk(ceil), { glow: ceil[4] == null ? 0.45 : ceil[4] })); };
        const GLOW = tint => ({ tint, glow: 1, under: true });
        /* lights (drawn): a flush lit panel; a fluorescent strip; a pendant (cord, a shade, a lit bulb under it) */
        const panelL = (rx, rz, w, d, tint) => { P.push({ s: 'box', p: [X(rx), r3(H - 0.11), Z(rz)], size: [r3(w + 0.14), 0.05, r3(d + 0.14)], tint: 0x9a9ea6, under: true }, Object.assign({ s: 'box', p: [X(rx), r3(H - 0.13), Z(rz)], size: [r3(w), 0.03, r3(d)] }, GLOW(tint || 0xf4f8ff))); };
        const strip = (rx, rz, len, alongZ, tint) => { const sz2 = alongZ ? [0.24, 0.07, len] : [len, 0.07, 0.24]; P.push({ s: 'box', p: [X(rx), r3(H - 0.34), Z(rz)], size: sz2, tint: 0xd8dce2, under: true }, Object.assign({ s: 'box', p: [X(rx), r3(H - 0.36), Z(rz)], size: [sz2[0] * 0.7, 0.03, sz2[2] * 0.7].map(r3) }, GLOW(tint || 0xeef8ff)));
            P.push({ s: 'cyl', p: [X(rx), r3(H - 0.34), Z(rz)], r: 0.01, h: 0.34, seg: 4, tint: 0x30343a, cap: false }); };
        const pendant = (rx, rz, y, shade, bulb, r) => { r = r || 0.28; P.push({ s: 'cyl', p: [X(rx), r3(y + 0.26), Z(rz)], r: 0.012, h: r3(H - y - 0.26), seg: 4, tint: 0x202020, cap: false },
            Object.assign({ s: 'cyl', p: [X(rx), r3(y), Z(rz)], r: r3(r), r2: r3(r * 0.25), h: 0.28, seg: 14, ds: true, cap: false }, shade),
            Object.assign({ s: 'cyl', p: [X(rx), r3(y - 0.06), Z(rz)], r: r3(r * 0.3), h: 0.14, seg: 10 }, GLOW(bulb || 0xffe2a8))); };
        /* a lit window on a wall (daylight through glass the facade's windows stand for): wall 'l' | 'r' | 'b', along = room-local x or z */
        const window_ = (wall, along, y, w, h, L) => { const e = 0.33, g = Object.assign(lk(L || ['urban:GlassWindowTall1a', 0xd8ecff, null, 1.4]), { glow: 0.7, win: 'keep' });
            const at = wall === 'l' ? [X(-W / 2 + e), Z(along), 270] : wall === 'r' ? [X(W / 2 - e), Z(along), 90] : [X(along), Z(-D / 2 + e), 0];
            P.push({ s: 'box', p: [at[0], r3(y - 0.12), at[1]], size: [r3(w + 0.3), r3(h + 0.24), 0.06], ry: at[2], tint: 0x5a4632 }, Object.assign({ s: 'quad', p: [at[0], r3(y), at[1]], size: [r3(w), r3(h)], ry: at[2] }, g)); };
        const rug = (rx, rz, w, d, L) => P.push(Object.assign({ s: 'quad', flat: true, p: [X(rx), 0.03, Z(rz)], size: [r3(w), r3(d)] }, lk(L)));
        /* a prop room-local; `wall`: 'b' back, 'f' front, 'l' left, 'r' right = stand against it, its front to the room */
        const WF = { b: 0, f: 180, l: 90, r: 270 };
        const dress = (key, rx, rz, f, y) => prop(key, X(rx), Z(rz), f || 0, y);
        const onWall = (key, wall, along, f) => { const e = 0.42, p = wall === 'b' ? [along, -D / 2 + e] : wall === 'f' ? [along, D / 2 - e] : wall === 'l' ? [-W / 2 + e, along] : [W / 2 - e, along]; dress(key, p[0], p[1], WF[wall] + (f || 0)); };
        const books = (rx, rz, y, n, f) => { for (let i = 0; i < n; i++) dress('psx_book_mp_' + (1 + ((i * 3 + Math.round(rx * 7)) % 10 + 10) % 10), rx + (i % 2) * 0.05, rz + (i % 3) * 0.03, (f || 0) + i * 9, r3(y + i * 0.045)); };
        const ATMOS = {
            library: () => {   // a reading hall at night: forest green over walnut, a coffered cream ceiling, brass chandeliers, green lamps on every table
                liner(M('urban:PlasterWallPainted1a', 0x2e5a40, 1.5), M('calm_planks', 0x7a5034, 1.4), 1.35, ['urban:FibreCeilingTile1a', 0xf2e2c0, null, 1.6, 0.4], ['calm_planks', 0x5a3820]);
                [2, 4, 6].forEach(ci => P.push({ s: 'box', p: [X(sx(ci) - cw / 2), r3(H - 0.6), Z(0)], size: [0.3, 0.5, r3(D - 0.8)], key: 'calm_planks', tint: 0x6a4428, under: true }));   // the ceiling's beams
                [[1, 1.5], [3.5, 1.5], [5, 1.5], [3.5, 3]].forEach(([c, r]) => { const rx = -W / 2 + c * cw + cw / 2, rz = -D / 2 + r * cd + (r === 3 ? 0 : cd / 2); dress('library_chandelier', rx, rz, 0, r3(Math.min(6.4, H - 1.6))); P.push({ s: 'cyl', p: [X(rx), r3(Math.min(6.4, H - 1.6) + 1.1), Z(rz)], r: 0.02, h: r3(H - Math.min(6.4, H - 1.6) - 1.1), seg: 4, tint: 0x8a6a30, cap: false }); });
                [-1, 1].forEach(sg => [-0.25, 0.25].forEach(a => window_(sg < 0 ? 'l' : 'r', a * D * 0.9, 4.6, 1.5, 4.2)));                                   // tall lit windows over the gallery line
                rug(dX, D / 2 - 3.9, 2.0, 6.6, M('calm_carpet', 0x8a2a2a, 1.3));                                                          // the red runner from the door
                R.g.forEach((line, ri) => line.forEach((t, ci) => { const x = sx(ci), z = sz(ri);
                    if (t === 'rtable') { dress('banker_lamp', x + 0.12, z - 0.75, 180, 0.76); dress('banker_lamp', x - 0.12, z + 0.75, 0, 0.76); books(x + 0.2, z + 0.25, 0.76, 3, 15); dress('psx_open_book_mp_1', x - 0.15, z - 0.2, 80, 0.76); }
                    if (t === 'shelfw' && (ci === 1 || ci === 6)) dress('library_ladder', x + 0.6, z + 0.05, 180);   // its top hooks lean to the shelves                                                // a rolling ladder against the shelf wall
                    if (t === 'ldesk') { books(x - 0.5, z - 0.1, 0.76, 4, 0); dress('banker_lamp', x - 0.55, z + 0.35, 180, 0.76); } }));
                onWall('wall_clock', 'f', dX); dress('globe_lamp', sx(1) - 1.15, sz(3) + 1.1, 0); dress('potted_plant', sx(7) - 1.2, sz(3) + 1.15, 0); dress('potted_plant', sx(0) + 1.2, sz(1) - 1.15, 0);
                onWall('notice_board', 'l', sz(2.5)); onWall('chalkboard', 'r', sz(2));
            },
            cafe: () => {   // warm and busy: cream walls over a bottle-green tiled dado, ceiling fans, amber pendants over the booths
                liner(M('urban:PlasterWallStucco1a', 0xf6e2b8, 2.0), M('urban:TileSubway2a', 0x5a9a7a, 1.5), 1.2, ['urban:FibreCeilingTile1a', 0xfff2dc, null, 1.6, 0.45], ['calm_planks', 0x6a4a30]);
                [1, 3, 5].forEach(ci => dress('psx_ceiling_fan_mp_1_1_light_on', sx(ci), sz(2), 0, r3(H - 0.65)));
                R.g.forEach((line, ri) => line.forEach((t, ci) => { const x = sx(ci), z = sz(ri);
                    if (t === 'booth') pendant(x, z + 0.4, 2.1, { key: 'calm_tiles', tint: 0xd88a30, glow: 0.35 }, 0xffcf80, 0.3);
                    if (t === 'ctable') pendant(x, z, 2.3, { key: 'calm_tiles', tint: 0x2a5a48, glow: 0.2 }, 0xffe0a0, 0.32);
                    if (t === 'counter' && ci === 2) dress('espresso_machine', x - 0.6, z - 0.05, 180, 1.11);
                    if (t === 'counter' && ci === 3) dress('pastry_case', x - 0.2, z, 0, 1.11); }));
                [0.5, 2.5].forEach(c => pendant(-W / 2 + c * cw + cw / 2, sz(1), 2.6, { key: 'calm_gunmetal', tint: 0x30343a }, 0xfff0c8, 0.22));                // over the counter
                window_('r', -cd * 0.6, 1.3, 2.4, 2.6, ['urban:GlassWindowResidential1a', 0xfff0d8, null, 1.4]); window_('r', cd * 0.6, 1.3, 2.4, 2.6, ['urban:GlassWindowResidential1a', 0xfff0d8, null, 1.4]);
                onWall('chalkboard', 'l', sz(2)); onWall('wall_clock', 'f', dX); dress('potted_plant', sx(6) + 1.2, sz(2) - 1.2, 0); dress('office_plant', sx(4) + 1.2, sz(3) + 1.15, 0); dress('potted_plant', sx(0) + 1.15, sz(2) + 1.15, 0);
            },
            lab: () => {   // clinical and cool: white walls over blue-grey steel, a bright tiled ceiling, fluorescent strips over every walk
                liner(M('urban:PlasterWallPainted1a', 0xf2f6f8, 1.8), M('calm_tiles', 0x9ab0c4, 1.3), 1.1, ['urban:FibreCeilingTile1a', 0xffffff, null, 1.7, 0.55], ['calm_gunmetal', 0xb0b8c4]);
                for (let ci = 0; ci < nc; ci++) [1, 3].forEach(ri => strip(sx(ci), sz(ri), 2.4, false));
                R.g.forEach((line, ri) => line.forEach((t, ci) => { const x = sx(ci), z = sz(ri);
                    if (t === 'bench') { dress('microscope', x + 0.05, z - 0.3, 180, 0.96); dress('lab_glassware', x + 1.0, z - 0.35, 200, 0.96); dress('papers_a', x - 0.2, z + 0.45, 10, 0.96); } }));
                onWall('exit_sign', 'f', dX); onWall('fire_extinguisher', 'f', dX + 1.4); onWall('notice_board', 'l', sz(1)); onWall('wall_clock', 'r', sz(1));
                dress('anatomy_skeleton', sx(4) + 1.2, sz(3) + 1.0, 200);
            },
            psych: () => {   // soft and quiet: sage over oak, warm low lamps, a rug under the waiting chairs
                liner(M('urban:PlasterWallPainted1a', 0x9cb8a0, 1.9), M('calm_planks', 0x9a7450, 1.4), 1.0, ['urban:FibreCeilingTile1a', 0xfff4e4, null, 1.6, 0.35], ['calm_planks', 0x7a5a3a]);
                [1, 3, 5].forEach(ci => pendant(sx(ci), sz(1), 2.5, { key: 'calm_tiles', tint: 0xf0e6d0, glow: 0.4 }, 0xffe6b8, 0.36));
                rug(sx(2), sz(1), 2.6, 2.2, M('calm_carpet', 0xc8a070, 1.2)); dress('table_lamp', sx(3) + 1.25, sz(0) + 0.1, 0, 1.11);
                dress('potted_plant', sx(4) + 1.2, sz(0) - 1.15, 0); dress('office_plant', sx(1) - 1.2, sz(0) - 1.15, 0); onWall('wall_clock', 'b', sx(4)); onWall('wall_shelf', 'r', sz(1));
            },
            secret: () => {   // the research annex after hours: dark concrete, cold blue strips, a red light over the scanner
                liner(M('urban:ConcreteStriped1a', 0x8a929c, 1.2), M('calm_gunmetal', 0x5a6068, 1.2), 1.0, ['calm_gunmetal', 0x3a4048, null, 1.0, 0.15], ['calm_gunmetal', 0xd8b030]);
                for (let ci = 0; ci < nc; ci += 2) strip(sx(ci), sz(1), 2.6, false, 0x9ad8ff);
                [6, 7, 8].forEach(ci => P.push(Object.assign({ s: 'box', p: [X(sx(ci)), 0.13, Z(sz(0))], size: [2.7, 0.03, 2.7] }, GLOW(0x58e0c8))));                   // the tanks' lit floors
                if (R.gate) { const x = sx(R.gate[0]); P.push(Object.assign({ s: 'dome', p: [X(x), 2.72, Z(D / 2 - (R.gate[1] + 0.5) * cd)], r: 0.12, h: 0.12, seg: 8, rings: 2 }, GLOW(0xff3020))); }
                for (let ci = 0; ci < nc; ci++) if (ci !== Math.floor((dX + W / 2) / cw)) [-1, 1].forEach(sg => P.push({ s: 'quad', flat: true, p: [X(sx(ci)), 0.03, Z(sz(1) + sg * (cd / 2 - 0.08))], size: [r3(cw - 0.1), 0.12], tint: 0xe0b820, glow: 0.3 }));   // the walk's hazard edge
                onWall('exit_sign', 'f', dX); onWall('fire_extinguisher', 'b', sx(3));
            },
            clinic: () => {   // pale mint tile, a white dado, a bright panelled ceiling, screens and drips by the beds
                liner(M('urban:PlasterWallPainted1a', 0xc8ecdc, 1.9), M('urban:TileGeneric1a', 0xffffff, 1.4), 1.3, ['urban:FibreCeilingTile1a', 0xffffff, null, 1.7, 0.55], ['calm_gunmetal', 0xb8c4c8]);
                for (let ri = 0; ri < nr; ri++) panelL(sx(1), sz(ri), 1.2, 1.2);
                R.g.forEach((line, ri) => line.forEach((t, ci) => { const x = sx(ci), z = sz(ri);
                    if (t === 'bed') { const inn = ci === 0 ? 1 : -1; dress('iv_stand', x + inn * 1.1, z - 1.1, 0); dress('privacy_screen', x + inn * 1.45, z + 0.4, inn > 0 ? 270 : 90); } }));
                dress('wheelchair', sx(2) + 0.95, sz(2) - 1.0, 250); dress('anatomy_skeleton', sx(1) + 1.2, sz(0) - 1.15, 0);
                onWall('exit_sign', 'f', dX); onWall('wall_clock', 'l', sz(4)); onWall('notice_board', 'r', sz(2));
            },
            museum: () => {   // the night gallery: deep blue walls over marble, a dark ceiling, a lit skylight over the walk, spots on every case
                liner(M('urban:PlasterWallPainted1a', 0x2c3c64, 1.6), M('urban:TileMarble1a', 0xf4f0e8, 1.3), 1.2, ['calm_gunmetal', 0x2a3040, null, 1.0, 0.2], ['calm_marble', 0xd8c8a0]);
                for (let ci = 0; ci < nc; ci++) panelL(sx(ci), sz(1), 2.6, 1.6, 0xeaf2ff);                                                                     // the skylight over the middle walk
                R.g.forEach((line, ri) => line.forEach((t, ci) => { if (!t || t === 'dino2' || ri === 1) return; const x = sx(ci) + (t === 'dino' ? cw / 2 : 0), z = sz(ri) + (ri ? -0.6 : 0.6);
                    P.push({ s: 'cyl', p: [X(x), r3(H - 0.5), Z(z)], r: 0.09, r2: 0.13, h: 0.24, seg: 8, tint: 0x202428, cap: false }, Object.assign({ s: 'cyl', p: [X(x), r3(H - 0.53), Z(z)], r: 0.085, h: 0.03, seg: 8 }, GLOW(0xfff0d0)));
                    P.push({ s: 'cyl', p: [X(x), r3(H - 0.26), Z(z)], r: 0.015, h: 0.26, seg: 4, tint: 0x202428, cap: false }); }));
                onWall('exit_sign', 'f', dX); dress('potted_plant', sx(4) + 1.2, sz(2) + 1.15, 0);
            },
            lodge: () => {   // the porter's lodge: oak to the waist, a bare bulb, the radio on
                liner(M('urban:PlasterWallStucco1a', 0xf0dcb0, 2.0), M('calm_planks', 0x8a6040, 1.4), 1.2, ['urban:FibreCeilingTile1a', 0xfff0d8, null, 1.5, 0.35], ['calm_planks', 0x5a3a20]);
                pendant(0, 0, 2.4, { key: 'calm_gunmetal', tint: 0x2a4a3a }, 0xffd890, 0.3);
                dress('retro_radio', sx(0) + 0.6, sz(0) + 0.15, 200, 0.76); dress('psx_clock_1', sx(0) - 0.7, sz(0) + 0.2, 160, 0.76); onWall('wall_clock', 'l', sz(1)); onWall('notice_board', 'r', sz(0));
            },
        };
        if (ATMOS[kind]) ATMOS[kind]();
    };
    const ROT = { S: 0, W: 90, N: 180, E: 270 };
    const SHALLOW = { 'P03-05-B1': 3.5 };
    const count = { arch: 0, parts: 0 };
    bInfo.filter(b => b.d === 'U').forEach(b => {
        const kind = KIND[b.id], row = features.find(f => f.id === 'dc:' + b.id); if (!kind || !row) { console.warn('university: no builder / row for', b.id, b.name); return; }
        const tierRow = row.k === 'plateau', rot = tierRow ? ROT[b.side] : row.rot, ew = rot === 90 || rot === 270;
        const w = tierRow ? (ew ? row.d : row.w) : row.w;
        /* THE LEVELS: a walk-in building whose back stood ON a plot line with a higher plot behind it showed that plot's bank inside (the
           psychology lab, two levels under the research lab): it is one square shallower, its back a square off the line */
        if (SHALLOW[b.id] && !tierRow) { const cut = SHALLOW[b.id], q = rot * Math.PI / 180; row.d = r3(row.d - cut); row.x = r3(row.x - Math.sin(q) * cut / 2); row.z = r3(row.z + Math.cos(q) * cut / 2); }
        const d = tierRow ? (ew ? row.w : row.d) : row.d;
        ctx = { id: 'dc:' + b.id, x: row.x, z: row.z, rot }; P = []; sub = 0; tiers = []; lodgeRow = null;
        if (kind === 'PACK') { delete row.style; row.key = 'pack_bld_09'; row.storeys = 3; return; }   // the shop block at its own size: 16.9 m wide on a 17.5 m front
        if (kind === 'PIZZA') {   // the chain's pizza place stands on this lot (a catalogue prop at its real size, its entrance to the south walk), the plan's row goes
            features.splice(features.indexOf(row), 1); props.push({ key: 'city_pizzeria', x: row.x, z: r3(row.z + (ew ? row.w : row.d) / 2 - 10.25 - 0.4), face: 180 }); return; }
        if (tierRow) { row.bld = Object.assign({}, row.bld, { skin: false }); delete row.bld.style; }
        else { row.skin = false; delete row.style; delete row.key; delete row.hollow; delete row.door; }
        B[kind](tierRow ? w + 0.3 : w, tierRow ? d + 0.3 : d, row);   // a roof-route building is a plateau: its drawn walls stand 0.15 m outside the plateau's own cliff
        polish(kind, tierRow ? [w, d] : null);
        { const ir = kind === 'gate' ? lodgeRow : row; if (ir && ir.hollow && ROOMS[kind === 'gate' ? 'lodge' : kind]) inside(kind === 'gate' ? 'lodge' : kind, ir); }
        if (row.dead) features.splice(features.indexOf(row), 1);
        features.push(Object.assign({ k: 'arch', id: 'dcu:' + b.id, x: ctx.x, z: ctx.z }, tierRow ? { y: 0 } : {}, { rot, parts: P })); count.arch++; count.parts += P.length;   // y: 0 over a roof-walk plateau (harmless since main gives an arch row its ground)
    });
    /* the campus green's bandstand, on the grass south-west of the cross walks */
    { const p = PLAN.plots.find(q => q.name === 'Campus green'); if (p) { const x = r3(api.gx(p.x * 12 + 2.5)), z = r3(api.gx(p.y * 12 + 8.5)); ctx = { id: 'dc:green', x, z, rot: 0 }; P = []; B.bandstand(); features.push({ k: 'arch', id: 'dcu:bandstand', x, z, rot: 0, parts: P }); count.arch++; count.parts += P.length; } }
    console.log('university:', JSON.stringify(count));
};
