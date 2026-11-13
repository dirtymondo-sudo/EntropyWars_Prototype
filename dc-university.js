/* DISASTER CITY · THE UNIVERSITY DISTRICT — every building architected (2026-11-13, mondo: "architect the buildings in their respective
   districts plots ... every building should be unique and purposeful and recognizable"). Repo-only tooling: bake-disaster-city.js calls
   this once its own rows are written; it re-dresses the district's 22 buildings (plots x 0-3, y 4-7 of docs/disaster-city/city-layout.json).

   A building = (1) what the walker reads — the tool's own row with its skin off (`texbuilding` + `skin: false`, a roof-route `plateau` +
   `bld.skin: false`), or a few of them where the plan's one box is really wings round a court — and (2) ONE `k: 'arch'` row: its look as
   a parts list (docs/notes/areas-complexes.md "THE ARCHITECTURE ROW"). Every builder works in the building's own frame: the front faces
   +z, x runs to the right along the front, w = the front's width, d = the depth.

   THE TWO HALVES: the OLD CAMPUS (west: red brick, pale stone, blue slate) and the SCIENCE SIDE (east: white panel, glass, concrete, metal).
   Three landmarks stand over the rest: the observatory's green dome, the library's clock tower, the boiler stack. */
'use strict';
const T = 1.75, C = 3.5;
/* ── the looks: [sheet, tint] ── */
const BRICK = ['bricks_3', 0xe08a6c], BRICKD = ['bricks_3', 0xb86a58], BUFF = ['bricks_3', 0xf0d8a8], STONE = ['bricks_1', 0xd8ccb4], LIME = ['urban:PlasterWallStucco1a', 0xf2e8d2], WHITE = ['urban:PlasterWallPainted1a', 0xe4e6e8],
    SLATE = ['concrete_floor', 0x7c8cb4], SLATEG = ['concrete_floor', 0x8aa090], VERD = ['aluminium', 0x62b49a], LEAD = ['aluminium', 0x6e767e], ALU = ['aluminium', 0xb8c0c8], CONC = ['urban:ConcreteStriped2a', 0xffffff], CONCD = ['urban:ConcreteStriped1a', 0xd8d0c4],
    GUN = ['gunmetal', 0x8890a0], BLACK = ['gunmetal', 0x50545c], CORR = ['urban:MetalCorrugatedPainted1a', 0xffffff], CORRG = ['urban:MetalCorrugatedPainted4c', 0xffffff], CORRR = ['urban:MetalCorrugatedPainted2a', 0xffffff],
    TILEW = ['tilefloor', 0xd8d8d2], TILEC = ['tilefloor', 0xf0e2c0], TILEB = ['tilefloor', 0x9cc4e4], TILEN = ['tilefloor', 0x3c5c8c], TEAL = ['tilefloor', 0x2f5a5c], MINT = ['tilefloor', 0x58b89a],
    GL = ['urban:GlassWindowSquare1a', 0xcfe4ee], GLT = ['urban:GlassWindowTall1a', 0xd4ecf0], GLB = ['urban:GlassWindowTall3a', 0xffffff], GLD = ['urban:GlassWindowFactory1a', 0x9098b0], GLR = ['urban:GlassWindowResidential1a', 0xdfe8f0], GLK = ['urban:GlassWindowSquare3a', 0xd8f4f0],
    WOOD = ['wood_planks', 0xc09a70], WOODG = ['wood_planks', 0x6f9a7c], MARB = ['marble_light', 0xd6d0c2], AWN = ['urban:TileSubway1a', 0xffffff], CREAM = ['urban:PlasterWallPainted1a', 0xf6e6b8], SAGE = ['urban:PlasterWallPainted1a', 0xa8c4a0], BLUE = ['urban:PlasterWallPainted1a', 0x98b0cc],
    RES = ['urban:DecalWindowsResidential1a', 0xffffff], FAC = ['urban:DecalWindowsFactory1a', 0xffffff], DOORW = ['urban:DoorWoodenHalf1a', 0xffffff], DOORS = ['urban:DoorStorefrontHalf1a', 0xffffff], DOORP = ['urban:DoorPaintedHalf2a', 0xffffff], TRUSS = ['urban:MetalTruss1a', 0xffffff];
const r3 = v => Math.round(v * 1000) / 1000;

module.exports = function (api) {
    const { PLAN, features, props, bInfo, ROOF_H } = api;
    let P = null, ctx = null;   // the parts of the building being drawn; its frame
    const look = (L, o) => { const q = Object.assign({}, o || {}); if (L[0]) q.key = L[0]; if (L[1] != null && L[1] !== 0xffffff) q.tint = L[1]; return q; };
    const part = (s, p, L, o) => { const q = Object.assign({ s, p: p.map(r3) }, look(L, o)); P.push(q); return q; };
    /* ── the shapes (the mock-up's helpers, written as parts) ── */
    const box = (x, y, z, w, h, d, L, o) => part('box', [x, y, z], L, Object.assign({ size: [r3(w), r3(h), r3(d)] }, o || {}));
    const cyl = (x, y, z, r, h, L, seg, r2, o) => part('cyl', [x, y, z], L, Object.assign({ r: r3(r), h: r3(h), seg: seg || 16 }, r2 != null ? { r2: r3(r2) } : {}, o || {}));
    const cone = (x, y, z, r, h, L, seg) => cyl(x, y, z, r, h, L, seg, 0, { roof: true });
    const dome = (x, y, z, r, L, sq, seg) => part('dome', [x, y, z], L, { r: r3(r), h: r3(r * (sq || 1)), seg: seg || 20, rings: 6, roof: true });
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
    const win = (f, cx, y, len, h, off, L) => panel(f, cx, y, len, h, off, L, decal(L) ? { uv: [C, C] } : null);
    const door = (f, cx, off, L, w) => panel(f, cx, 0, w || 1.9, 2.3, off + 0.03, L || DOORW, { uv: [r3((w || 1.9) / 2), 2.3], kind: 'wall' });
    const rows = (f, cx, len, off, n, L, y0) => { const m = decal(L) ? C : T; for (let s = 0; s < n; s++) win(f, cx, (y0 == null ? 1.0 : y0) + s * C, Math.max(m, Math.floor(len / m) * m), T, off, L); };
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
    const tier = (lx, lz, w, d, h) => { const [x, z] = toWorld(lx, lz), tw = turned(); features.push({ k: 'plateau', id: ctx.id + '-u' + (++sub), x, z, w: r3(tw ? d : w), d: r3(tw ? w : d), h: r3(h), edge: 0.15, bld: { skin: false, seed: 7000 + sub } }); };
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
        [['f', tx, tz + ts / 2], ['r', tz, tx + ts / 2]].forEach(([f, cx, off]) => { const [p, ry] = FACE[f](cx, off + 0.06); P.push(Object.assign({ s: 'cyl', p: [p[0], 18.6, p[2]], r: 2.1, h: 0.12, seg: 20, ry: ry }, look(['marble_light', 0xfff8e0]))); });
        /* the clock faces: a pale disc on its edge is not a part shape, so each face is a square stone-framed panel + two hands */
        [['f', tx, tz + ts / 2], ['r', tz, tx + ts / 2]].forEach(([f, cx, off]) => { panel(f, cx, 16.5, 4.2, 4.2, off + 0.02, ['marble_light', 0xfff8e0]); panel(f, cx, 18.6, 0.22, 1.7, off + 0.06, [null, 0x202020]); panel(f, cx + 0.55, 18.5, 1.3, 0.22, off + 0.06, [null, 0x202020]); win(f, cx, 11.5, T, 3.5, off, GLT); });
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
            if (s > 0) { const r2 = solid(cx, 0, ww, wd, 7, { hollow: true, leaf: 'leaf_shabby_wood' }), D = doorAt(r2.w, 1.5); r2.door = D.door; P.push(Object.assign({ s: 'quad', p: [r3(cx), 0, r3(wd / 2)], size: [r3(ww), 7], hole: [D.lx, D.cw, 2.2] }, look(BRICK))); box(cx, 0, 0, ww, 7, wd, BRICK, { faces: 'blr', top: false }); }
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
        box(-w / 2 - 0.6, 4.2, d / 2 - 1.5, 1.0, 1.3, 0.15, ['wood_planks', 0x34503c]);
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
        P.push(Object.assign({ s: 'dome', p: [0, 11, 0], r: r3(r + 0.08), h: r3(r + 0.08), arc: 18, a0: 51, seg: 6, rings: 6, ds: true, roof: true }, look(['gunmetal', 0x303440])));   // the slit
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
        const OR = ['aluminium', 0xf08a3c]; box(D.lx, 3.0, d / 2 + 1.6, 7, 0.28, 3.2, OR, { under: true }); box(D.lx - 3.3, 0, d / 2 + 0.3, 0.4, 3.0, 0.6, OR);
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
        box(4, 3.2, d / 2 - 7.4, w - t - 3, 0.5, 0.5, ['aluminium', 0xf0c040], { under: true }); box(4, 3.9, d / 2 - 7.4, w - t - 3, 0.3, 0.3, ['aluminium', 0xd04838]); P.push(Object.assign({ s: 'box', p: [-6, 0, r3(d / 2 - 7.4)], size: [0.3, 3.2, 0.3], n: 4, step: [6, 0, 0] }, look(GUN)));
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
        const gx = w / 2 - 4.5; cyl(gx, 0, 0.6, 4.2, 1.2, CONCD, 16); P.push(Object.assign({ s: 'dome', p: [r3(gx), 4.2, 0.6], r: 5.6, h: 5.6, seg: 10, rings: 4, roof: true }, look(['aluminium', 0xd4e2f4])));
        cyl(gx, 1.2, 0.6, 5.6, 3.0, ['aluminium', 0xd4e2f4], 10, 5.6, { cap: false }); block(gx, d / 2 + 2.2, 9, 4, 6);
        box(D.lx, 3.1, d / 2 + 1.5, 7, 0.25, 3, ['aluminium', 0x3c7cd8], { under: true });
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
        box(0, 0, -2, w - 1, 3.4, d - 4, TILEW, { top: false }); box(0, 0, -2, w - 0.9, 1.1, d - 3.9, ['tilefloor', 0xd84a3a]); box(0, 1.1, d / 2 - 3.95, w - 3, 1.7, 0.1, ['gunmetal', 0x30343c]); box(0, 1.0, d / 2 - 3.7, w - 2.4, 0.15, 0.8, ALU);
        shed(0, 3.2, d / 2 - 2, w + 0.6, 4.4, 1.0, CORRR, 180, null, { under: true }); [-1, 1].forEach(s => cyl(s * (w / 2 - 0.3), 0, d / 2 - 0.1, 0.1, 4.1, ALU, 8)); box(0, 3.4, -2, w - 0.6, 0.3, d - 3.6, CORRR); box(0, 3.9, -3, w - 2, 1.5, 0.25, ['tilefloor', 0xf4c83c]);
    };
    B.gatehouse = (w, d, row) => {   // the guard post: a glass booth under a wide flat roof, a barrier arm
        Object.assign(row, { storeys: 1, w: r3(w - 6), d: r3(d - 3) }); box(0, 0, 0, w - 6, 1.1, d - 3, CONCD, { top: false }); box(0, 1.1, 0, w - 6, 2.0, d - 3, GLR, { top: false }); box(0, 3.1, 0, w - 1, 0.35, d + 1.5, CONC, { under: true }); box(0, 3.45, 0, w - 5, 0.5, d - 2, GUN); door('f', 0, d / 2 - 1.5, DOORP, 1.3);
        cyl(w / 2 - 2, 0, d / 2 + 0.6, 0.16, 1.2, ALU, 8); box(w / 2 - 2 + 2.8, 1.1, d / 2 + 0.6, 5.6, 0.16, 0.16, ['tilefloor', 0xe84030]);
    };
    B.store = (w, d, row) => {   // the corner store: a glass front, a red fascia with a lit sign band, a flat roof
        Object.assign(row, { storeys: 1 }); box(0, 0, 0, w, 3.6, d, TILEW, { top: false }); win('f', 0, 0.5, Math.floor((w - T) / T) * T, 2.4, d / 2, GLB); box(0, 3.2, d / 2 + 0.35, w + 0.4, 1.3, 0.7, ['tilefloor', 0xe8443c], { under: true }); panel('f', 0, 3.5, w - 4, 0.6, d / 2 + 0.7, [null, 0xfff4d0], { glow: 0.8 });
        box(0, 3.6, 0, w + 0.3, 0.3, d + 0.3, CONC, { under: true }); door('f', 0, d / 2, DOORS, 2.6); box(-w / 2 + 2, 3.9, -1, 2, 1.1, 2, ALU);
    };
    B.pavilion = (w, d, row) => {   // the museum's ticket + gift pavilion: a glass box under a tilted floating roof on four posts
        Object.assign(row, { storeys: 1, w: r3(w - 4), d: r3(d - 2.6) }); box(0, 0.5, 0, w - 4, 2.5, d - 2.6, GLR, { top: false }); box(0, 0, 0, w - 3.9, 0.5, d - 2.5, CONCD); box(0, 3.0, 0, w - 4, 0.15, d - 2.6, CONCD);
        shed(0, 3.4, 0, w + 1, d + 1, 1.5, ['aluminium', 0x3c7cd8], 180, null, { under: true }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(a * (w / 2 - 0.4), 0, b * (d / 2 - 0.4), 0.13, b > 0 ? 4.7 : 3.6, ALU, 8)); door('f', 0, d / 2 - 1.3, DOORS, 2.6);
    };
    B.bandstand = () => { cyl(0, 0, 0, 4.2, 0.2, STONE, 8); P.push(Object.assign({ s: 'cyl', p: [0, 0.2, 0], r: 0.14, h: 3.7, seg: 8, cap: false, ring: { n: 8, r: 3.7, a0: 22.5 } }, look(['aluminium', 0x2c4a3c]))); cyl(0, 3.9, 0, 4.5, 0.25, ['aluminium', 0x2c4a3c], 8); cone(0, 4.15, 0, 4.6, 2.2, VERD, 8); cyl(0, 6.35, 0, 0.1, 1.2, ALU, 6); };

    /* ═══ THE DISTRICT: plan building → its builder ═══ */
    const KIND = { 'P00-04-B1': 'dorm', 'P01-04-B1': 'bookshop', 'P01-04-B2': 'PACK', 'P01-04-B3': 'workshop', 'P02-04-B1': 'observatory', 'P03-04-B1': 'faculty', 'P03-04-B2': 'newsstand',
        'P01-05-B1': 'lecture', 'P02-05-B1': 'lab', 'P02-05-B2': 'annex', 'P03-05-B1': 'psych', 'P03-05-B2': 'foodstand', 'P00-06-B1': 'cafe', 'P00-06-B2': 'PIZZA', 'P01-06-B1': 'library', 'P02-06-B1': 'court',
        'P03-06-B1': 'secret', 'P03-06-B2': 'gatehouse', 'P00-07-B1': 'gate', 'P01-07-B1': 'clinic', 'P01-07-B2': 'store', 'P02-07-B1': 'museum', 'P02-07-B2': 'pavilion' };
    const ROT = { S: 0, W: 90, N: 180, E: 270 };
    const count = { arch: 0, parts: 0 };
    bInfo.filter(b => b.d === 'U').forEach(b => {
        const kind = KIND[b.id], row = features.find(f => f.id === 'dc:' + b.id); if (!kind || !row) { console.warn('university: no builder / row for', b.id, b.name); return; }
        const tierRow = row.k === 'plateau', rot = tierRow ? ROT[b.side] : row.rot, ew = rot === 90 || rot === 270;
        const w = tierRow ? (ew ? row.d : row.w) : row.w, d = tierRow ? (ew ? row.w : row.d) : row.d;
        ctx = { id: 'dc:' + b.id, x: row.x, z: row.z, rot }; P = []; sub = 0;
        if (kind === 'PACK') { delete row.style; row.key = 'pack_bld_09'; row.storeys = 3; return; }   // the shop block at its own size: 16.9 m wide on a 17.5 m front
        if (kind === 'PIZZA') {   // the chain's pizza place stands on this lot (a catalogue prop at its real size, its entrance to the south walk), the plan's row goes
            features.splice(features.indexOf(row), 1); props.push({ key: 'city_pizzeria', x: row.x, z: r3(row.z + (ew ? row.w : row.d) / 2 - 10.25 - 0.4), face: 180 }); return; }
        if (tierRow) { row.bld = Object.assign({}, row.bld, { skin: false }); delete row.bld.style; }
        else { row.skin = false; delete row.style; delete row.key; delete row.hollow; delete row.door; }
        B[kind](w, d, row);
        if (row.dead) features.splice(features.indexOf(row), 1);
        features.push({ k: 'arch', id: 'dcu:' + b.id, x: ctx.x, z: ctx.z, rot, parts: P }); count.arch++; count.parts += P.length;
    });
    /* the campus green's bandstand, on the grass south-west of the cross walks */
    { const p = PLAN.plots.find(q => q.name === 'Campus green'); if (p) { const x = r3(api.gx(p.x * 12 + 2.5)), z = r3(api.gx(p.y * 12 + 8.5)); ctx = { id: 'dc:green', x, z, rot: 0 }; P = []; B.bandstand(); features.push({ k: 'arch', id: 'dcu:bandstand', x, z, rot: 0, parts: P }); count.arch++; count.parts += P.length; } }
    return count;
};
