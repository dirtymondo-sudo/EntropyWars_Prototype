/* DISASTER CITY · THE FINANCIAL DISTRICT (2026-11-13, mondo: "architect the buildings in their respective districts plots ... every
   building should be unique and purposeful and recognizable"; his OK on the mock-up 11-13 17:10: project files disaster-city-financial/).
   A district file of `node bake-disaster-city.js` (docs/disaster-city/districts/<LETTER>.js): `tailor` changes the plan before it is
   read, `build` runs after every row exists. Each building keeps its collision row (a `texbuilding` or a roof-route `plateau`, its own
   skin switched off) and gets ONE `arch` row (three-renderer.js THE ARCHITECTURE): its look as a list of parts in the row's own frame,
   the front at +z, `W` along the front, `D` back from it. Old money in stone and copper on the north row, glass and steel in the middle,
   the working back of house (brick, tin, docks) behind. Never hand-edit data.js between the DC144 markers: edit this file and rerun. */
'use strict';
const U = n => 'urban:' + n;
const STONE = 'marble', BR1 = 'bricks_1', BR2 = 'bricks_2', BR3 = 'bricks_3', ALU = 'aluminium', GUN = 'gunmetal', WOOD = 'wood';
const CONC = U('ConcreteStriped2c'), CONC2 = U('ConcreteStriped1e'), CORR = U('MetalCorrugatedPainted1a'), CORR2 = U('MetalCorrugatedPainted3a');
const GT = U('GlassWindowTall1a'), GT4 = U('GlassWindowTall4a'), GS1 = U('GlassWindowSquare1a'), GS2 = U('GlassWindowSquare2a'), GR = U('GlassWindowResidential1a'), GF = U('GlassWindowFactory1a');
const WIN = U('DecalWindowsResidential1a'), WINF = U('DecalWindowsFactory1a'), DW = U('DoorWoodenHalf1a'), DS = U('DoorStorefrontHalf1a'), DP = U('DoorPaintedHalf1a');
const VERDI = 0x58b89a, SLATE = 0x7a8496, WHITE = 0xffffff;

/* ── the parts (three-renderer.js _hqArchGeometry) ── */
const r3 = v => Math.round(v * 1000) / 1000;
const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)], key, tint }, o || {});
const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [r3(x), r3(y), r3(z)], r, h, key, tint, seg: 16 }, o || {});
const dome = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'dome', p: [r3(x), r3(y), r3(z)], r, h, key, tint, roof: true }, o || {});
const roof = (form, x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'roof', form, p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)], key, tint, roof: true }, o || {});
const quad = (x, y, z, w, h, ry, key, tint, o) => Object.assign({ s: 'quad', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h)], ry: ry || 0, key, tint }, o || {});
/* a face of a box of size w × d centred on (x, z): 'f' front (+z), 'b' back, 'r' right (+x), 'l' left → a panel just proud of it */
const onFace = (f, x, z, w, d, out) => f === 'f' ? [x, z + d / 2 + out, 0] : f === 'b' ? [x, z - d / 2 - out, 180] : f === 'r' ? [x + w / 2 + out, z, 270] : [x - w / 2 - out, z, 90];
/* windows: the pack's see-through decal (two windows a 3.5 m tile, one storey tall) on the named faces of a box */
function wins(P, faces, x, y, z, w, h, d, key, margin) {
    for (const f of faces) { const q = onFace(f, x, z, w, d, 0.05), len = (f === 'f' || f === 'b' ? w : d) - (margin == null ? 1.4 : margin); if (len > 1) P.push(quad(q[0], y, q[1], len, h, q[2], key || WIN, WHITE)); }   // no uv: the shared code sizes a window sheet to a storey bay (THE BIG WINDOWS)
}
/* a vertical half disc (a round arch's head, a fanlight): a dome squeezed flat */
const fan = (x, y, z, r, ry, key, tint, o) => Object.assign({ s: 'dome', p: [r3(x), r3(y), r3(z)], r, h: r, rz: 0.06, ry: ry || 0, key, tint, seg: 16, rings: 5 }, o || {});
/* a drawn door (a building with no inside): the pack's half door sheet and its mirror, in a stone frame */
function fakeDoor(P, x, y, z, ry, key, tint, w, h) {
    w = w || 2.2; h = h || 2.6;
    P.push(quad(x, y, z, w, h, ry, key || DW, tint || WHITE, { uv: [w / 2, h], kind: 'wall' }));
}
/* a walk-in building's front wall with its doorway cut out (the city door's leaf hangs in it), and a stone frame round the gap */
function frontWithDoor(P, T, y0, h, key, tint, o) {
    P.push(quad(0, y0, T.D / 2 + 0.05, T.W + 0.1, h, 0, key, tint, Object.assign({ hole: [T.lx, T.cw, 2.2] }, o || {})));
    P.push(box(T.lx - T.cw / 2 - 0.16, y0, T.D / 2 + 0.12, 0.3, 2.5, 0.3, STONE, 0xd8d0c0), box(T.lx + T.cw / 2 + 0.16, y0, T.D / 2 + 0.12, 0.3, 2.5, 0.3, STONE, 0xd8d0c0), box(T.lx, y0 + 2.22, T.D / 2 + 0.12, T.cw + 0.92, 0.3, 0.3, STONE, 0xd8d0c0));
}

module.exports = {
    id: 'F',
    /* THE WORKER CAFE'S PLOT (mondo 11-13 17:13 "ok thats fine"): the DINER pack building is 23.4 × 24.3 m at its real size, so it takes
       the middle of the plot (7 × 7 squares), the footpaths go round it and the terrace beside it is two squares deep. All four ways in
       and out of the plot stay open. */
    tailor(PLAN) {
        const p = PLAN.plots.find(q => q.id === 'P09-03'); if (!p) return;
        p.cells = ['#####PP#####', '#IIPPPPPPPP#', '#IIPPPPPPPP#', '#IIIIIIIIIP#', '#IDIIIIIIIP#', 'PPPIIIIIIIPP', 'PPPIIIIIIIPP', '#PPIIIIIIIP#', '#PPIIIIIIIP#', '#PPIIIDIIIP#', '#PPPPPPPPPP#', '#####PP#####'];
        const b1 = p.buildings.find(b => b.name === 'Worker cafe'), b2 = p.buildings.find(b => b.name !== 'Worker cafe');
        Object.assign(b1, { x: 3, y: 3, w: 7, h: 7, doors: [{ x: 6, y: 9, ox: 6, oy: 10, side: 'S' }] });
        Object.assign(b2, { x: 1, y: 1, w: 2, h: 4, doors: [{ x: 2, y: 4, ox: 2, oy: 5, side: 'S' }] });
    },
    build(api) {
        const { features, props, lateRows } = api, all = () => features.concat(lateRows);
        const rowOf = id => all().find(f => f.id === 'dc:' + id);
        const drop = row => { for (const L of [features, lateRows]) { const i = L.indexOf(row); if (i >= 0) L.splice(i, 1); } };
        let made = 0;
        /* a building's frame from its collision row. A texbuilding: its own turn, `o.w` / `o.d` / `o.dz` resize it (dz = moved back along
           its own z), `o.hollow` keeps the walk-in inside and the doorway, `o.st` the storeys of the collision box (the inside's height).
           A plateau (a walked roof, never turned): `o.face` picks the front. */
        const frame = (id, o) => {
            o = o || {}; const row = rowOf(id); if (!row) { console.warn('[financial] no row', id); return null; }
            const T = { id, row };
            if (row.k === 'plateau') {
                T.rot = { S: 0, W: 90, N: 180, E: 270 }[o.face || 'S']; const ew = T.rot === 90 || T.rot === 270;
                T.W = ew ? row.d : row.w; T.D = ew ? row.w : row.d; T.x = row.x; T.z = row.z; T.H = row.h;
                row.bld = Object.assign({}, row.bld, { skin: false });
            } else {
                T.rot = row.rot || 0; const q = T.rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q);
                if (o.dz || o.dx) { const lx = o.dx || 0, lz = o.dz || 0; row.x = r3(row.x + lx * c - lz * s); row.z = r3(row.z + lx * s + lz * c); }
                if (o.w) { row.w = o.w; delete row.door; } if (o.d) row.d = o.d;
                delete row.key; delete row.style; row.skin = false; row.storeys = o.st || 2;
                if (o.hollow) { row.hollow = true; if (o.door) row.door = o.door; if (o.leaf) row.leaf = o.leaf; if (o.leafDouble) row.leafDouble = true; }
                else { delete row.hollow; delete row.door; }
                T.W = row.w; T.D = row.d; T.x = row.x; T.z = row.z;
                if (o.hollow) { const L = Math.max(2, T.W) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (isFinite(+row.door) && +row.door >= 1) col = Math.min(cols - 1, Math.round(+row.door) - 1); T.lx = -L / 2 + (col + 0.5) * cw; T.cw = cw; }
            }
            return T;
        };
        const local = (T, lx, lz) => { const q = T.rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q); return [r3(T.x + lx * c - lz * s), r3(T.z + lx * s + lz * c)]; };
        const emit = (T, parts) => { features.push({ k: 'arch', id: 'dc:' + T.id + ':arch', x: T.x, z: T.z, y: 0, rot: T.rot, parts: parts.filter(Boolean) }); made++; };   // y: 0 = from the ground (over a roof-route plateau the row would stand on its 7 m roof)
        const prop = (T, key, lx, lz, face, o) => { const w = local(T, lx, lz); props.push(Object.assign({ key, x: w[0], z: w[1], face: ((face || 0) + 360 - T.rot + 180) % 360 }, o || {})); };

        /* ── the repeating kinds (mondo: "its also okay to make the more reptitive buildings look similar like apartments") ── */
        /* the bankers' terrace: brick houses under slate roofs, stone base, stoops, dormers, a stack each */
        const terrace = (id, n, tints) => {
            const T = frame(id, { st: 3 }); if (!T) return; const P = [], hw = T.W / n, D = T.D;
            for (let i = 0; i < n; i++) {
                const x = -T.W / 2 + hw * (i + 0.5), H = 10.5 + (i % 2) * 0.6, dc = [0x8a3a30, 0x2f5a48, 0x30405a][i % 3];
                P.push(box(x, 0, 0, hw + 0.04, H, D + 0.1, i % 2 ? BR3 : BR1, tints[i % tints.length], { top: false }));
                P.push(box(x, 0, 0, hw + 0.06, 1.3, D + 0.3, STONE, 0xbdb6a8));
                wins(P, 'fb', x, 3.6, 0, hw, 3.5, D + 0.1, WIN, 0.8); wins(P, 'fb', x, 7.0, 0, hw, 3.5, D + 0.1, WIN, 0.8);
                P.push(box(x, H, 0, hw + 0.2, 0.45, D + 0.7, STONE, 0xd8d0c0));
                P.push(roof('hip', x, H + 0.45, 0, hw - 0.2, 3.0, D - 0.2, GUN, SLATE));
                P.push(box(x - hw * 0.2, H + 0.5, D / 2 - 1.4, 1.3, 1.5, 1.4, STONE, 0xd8d0c0), box(x + hw * 0.2, H + 0.5, D / 2 - 1.4, 1.3, 1.5, 1.4, STONE, 0xd8d0c0));
                P.push(box(x + hw / 2 - 0.6, H, -D / 4, 0.9, 4.6, 0.9, BR3, 0xa07060));
                P.push(box(x - hw * 0.22, 0, D / 2 + 0.75, 2.2, 0.35, 1.3, STONE, 0xbdb6a8));
                fakeDoor(P, x - hw * 0.22, 0.35, D / 2 + 0.11, 0, DW, dc, 1.8, 2.6);
                P.push(quad(x + hw * 0.2, 1.4, D / 2 + 0.11, Math.min(1.8, hw * 0.34), 2.0, 0, GR, WHITE, { uv: [1.8, 2.0] }));
            }
            emit(T, P);
        };
        /* the small shop: plaster or brick, a glass front under an awning, a stone fascia band, windows over, a parapet */
        const shop = (id, o) => {
            const T = frame(id, { face: o.face, st: 2 }); if (!T) return; const P = [], W = T.W, D = T.D, H = T.H || 7;
            P.push(box(0, 0, 0, W + 0.1, H - (T.H ? 0.02 : 0), D + 0.1, o.wall, o.tint, { top: !T.H }));
            P.push(quad(0.9, 0.5, D / 2 + 0.11, W - 4.2, 2.7, 0, GT, 0xdfeee8, { uv: [3.5, 2.7] }), box(0, 0, D / 2 + 0.1, W + 0.2, 0.5, 0.25, STONE, 0x8a8478));
            fakeDoor(P, -W / 2 + 1.6, 0, D / 2 + 0.11, 0, DS, WHITE, 2.0, 2.6);
            P.push(box(0, 3.25, D / 2 + 0.2, W - 0.4, 0.8, 0.3, null, o.trim));
            P.push(roof('shed', 0, 3.3, D / 2 + 1.1, W - 0.4, 0.8, 1.8, null, o.trim, { under: true, roof: false }));
            P.push(quad(0, 4.3, D / 2 + 0.11, W - 1.4, 2.2, 0, GS1, 0xd0dce4, { uv: [1.75, 2.2] }));
            P.push(box(0, H - 0.4, 0, W + 0.6, 0.38, D + 0.6, STONE, 0xd0c8b8, { top: false, under: true }));
            emit(T, P);
        };
        /* the workshop: tin on a brick dado, a roller door, factory windows, a sawtooth roof (flat where the roof is walked) */
        const workshop = (id, o) => {
            const T = frame(id, { face: o.face, st: 2 }); if (!T) return; const P = [], W = T.W, D = T.D, flat = !!T.H, H = flat ? T.H - 0.02 : 5.6;
            P.push(box(0, 0, 0, W + 0.16, 1.5, D + 0.16, BR1, 0xb09080), box(0, 1.5, 0, W + 0.1, H - 1.5, D + 0.1, CORR, o.tint, { top: !flat }));
            P.push(quad(1.2, 0, D / 2 + 0.12, 4.2, 3.6, 0, CORR2, 0x9aa0a8)); fakeDoor(P, -W / 2 + 1.5, 0, D / 2 + 0.12, 0, DP, WHITE, 1.7, 2.5);
            wins(P, 'f', 0, H - 2.0, 0, W, 1.75, D + 0.1, WINF, 1.0);
            if (flat) P.push(box(0, H - 0.36, 0, W + 0.5, 0.34, D + 0.5, CONC, 0xa0a0a0, { top: false, under: true }));
            else { const n = o.teeth || 3, tw = W / n; for (let i = 0; i < n; i++) P.push(roof('shed', -W / 2 + tw * (i + 0.5), H, 0, D, 2.2, tw, CORR2, 0x8c97a0, { ry: 90, keyEnd: GF, tintEnd: 0xd8e8e8 })); }
            emit(T, P);
        };
        /* a back lot (the infill on the district's closed edges): a plain service block, each its own brick and height */
        const backlot = (row, i) => {
            const T = { id: row.id.replace(/^dc:/, ''), row, rot: row.rot || 0, W: row.w, D: row.d, x: row.x, z: row.z }; delete row.key; delete row.style; row.skin = false;
            const H = Math.max(1, Math.min(12, row.storeys || 2)) * 3.5, mats = [[BR1, 0xc8a890], [BR3, 0xb8a090], [CONC2, 0xd0c8b8], [U('PlasterWallPainted1a'), 0xe0d8c8], [BR2, 0xc0b8a8]], m = mats[i % mats.length], P = [];
            P.push(box(0, 0, 0, T.W + 0.1, H, T.D + 0.1, m[0], m[1], { keyTop: U('ConcreteUnderTiles1') }), box(0, 0, 0, T.W + 0.2, 0.9, T.D + 0.2, STONE, 0xa8a298, { top: false }));
            if (i % 3 === 1 && H > 6) { P.push(box(0, 3.5, 0, T.W + 0.16, H - 3.9, T.D + 0.16, i % 2 ? GS1 : GS2, 0xc0ccd8, { uv: [1.75, 3.5], top: false, faces: 'fb' })); wins(P, 'fb', 0, 0.4, 0, T.W, 3.1, T.D + 0.1, WIN, 1.0); }
            else for (let s = 0; s < H / 3.5 - 0.5; s++) wins(P, 'fb', 0, s * 3.5 + (s ? 0 : 0.4), 0, T.W, 3.1, T.D + 0.1, i % 2 ? WINF : WIN, 1.0);
            P.push(box(0, H - 0.3, 0, T.W + 0.5, 0.45, T.D + 0.5, STONE, 0xcfc8b8, { top: false, under: true }));
            emit(T, P);
        };

        /* ═══ 1. THE LUXURY HOTEL — an art-deco stepped tower over a pool-terrace podium (its roof is on the roof route), a verdigris roof, a
               canopy on columns over the door ═══ */
        (() => {
            const T = frame('P08-00-B1', { face: 'N' }); if (!T) return; const P = [], W = T.W, CREAM = 0xf2e2c4, ROSE = 0xe9cdb0, tx = 3, tz = -3, TW = 17.5, Y = T.H;
            P.push(box(0, 0, 0, W + 0.1, Y - 0.02, T.D + 0.1, STONE, CREAM, { top: false, uv: 3.5 }));
            P.push(quad(0, 0.6, T.D / 2 + 0.11, 22, 3.4, 0, GT, 0xf4e8c8, { uv: [3.5, 3.4] }), box(0, 0, T.D / 2 + 0.1, W, 0.6, 0.3, GUN, 0x606068));
            P.push(box(-10.8, 0, T.D / 2 + 0.2, 0.7, Y - 0.1, 0.5, STONE, 0xd9c8a4, { n: 7, step: [3.6, 0, 0] }));
            wins(P, 'lrb', 0, 3.4, 0, W + 0.1, 3.3, T.D + 0.1, WIN, 2);
            P.push(box(0, Y - 0.62, 0, W + 1.1, 0.6, T.D + 1.1, STONE, 0xd9c8a4, { top: false, under: true }));
            P.push(quad(-9, Y + 0.06, 9, 7, 4, 0, null, 0x3aa0c8, { flat: true, glow: 0.2 }));                                  // the terrace pool
            P.push(box(tx, Y, tz, TW, 24.5, TW, U('PlasterWallPainted1a'), ROSE, { top: false, uv: 3.5 }));
            for (let k = 0; k < 7; k++) wins(P, 'fblr', tx, Y + k * 3.5, tz, TW, 3.5, TW, WIN, 2.4);
            for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push(box(tx + c[0] * (TW / 2 - 0.5), Y, tz + c[1] * (TW / 2 - 0.5), 1.8, 26, 1.8, STONE, CREAM));
            P.push(box(tx - 3, Y, tz + TW / 2 + 0.1, 0.8, 27.5, 0.6, STONE, 0xd9c8a4, { n: 2, step: [6, 0, 0] }));
            P.push(box(tx, Y + 24.5, tz, 14, 3.5, 14, GT4, 0xc8d8e8, { uv: [1.75, 3.5] }));   // the sky bar: dark glass (mondo 11-13 19:02 likes the dark windows)
            for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push(box(tx + c[0] * 6.8, Y + 24.5, tz + c[1] * 6.8, 0.9, 3.5, 0.9, STONE, CREAM, { top: false }));
            P.push(box(tx, Y + 28, tz, 10.5, 3.2, 10.5, STONE, 0xe6d4b0, { uv: 3.5 }), box(tx, Y + 31.2, tz, 11.4, 0.4, 11.4, ALU, VERDI, { under: true }));
            P.push(roof('hip', tx, Y + 31.6, tz, 10.6, 4.2, 10.6, ALU, VERDI), cyl(tx, Y + 35.4, tz, 0.12, 6, null, 0xd0d0d0, { seg: 6 }), box(tx + 0.9, Y + 40.2, tz, 1.8, 1.1, 0.06, null, 0xb02030));
            /* the marquee: a deco canopy hung off the wall over the pavement (the footpath under it stays clear) */
            P.push(box(0, 4.3, T.D / 2 + 1.75, 11, 0.45, 3.5, 'gold', WHITE, { under: true }), box(0, 4.75, T.D / 2 + 1.5, 9.6, 0.5, 2.8, STONE, CREAM));
            P.push(box(-5.2, 4.75, T.D / 2 + 0.2, 0.5, 2.6, 0.4, STONE, 0xd9c8a4, { n: 2, step: [10.4, 0, 0] }));
            P.push(quad(0, 0.05, T.D / 2 + 1.75, 3.2, 3.4, 0, null, 0xa01828, { flat: true }));
            fakeDoor(P, 0, 0, T.D / 2 + 0.13, 0, DS, 0xf0d890, 3.0, 3.0);
            emit(T, P);
            /* the tower blocks the terrace: a collision box standing on the walked roof */
            const w = local(T, tx, tz); lateRows.push({ k: 'texbuilding', id: 'dc:P08-00-B1-tower', x: w[0], z: w[1], w: TW, d: TW, rot: T.rot, y: Y, storeys: 7, skin: false, seed: 9801 });
        })();

        /* ═══ 2. THE BANK ARCHIVE — a windowless record vault: board-marked concrete, slit windows, a drum corner, a heavy lid ═══ */
        (() => {
            const T = frame('P09-00-B1', { st: 3 }); if (!T) return; const P = [], W = T.W, D = T.D, G = 0xc4c8cc;
            P.push(box(0, 0, 0, W + 0.1, 11.5, D + 0.1, CONC, G, { top: false }), box(0, 0, 0, W + 0.4, 1.0, D + 0.4, GUN, 0x808088, { top: false }));
            P.push(box(-3, 2.2, D / 2 + 0.08, 0.45, 8, 0.1, null, 0x1c2228, { n: 5, step: [2.1, 0, 0], top: false }));
            P.push(cyl(-W / 2 + 0.6, 0, D / 2 - 0.6, 3.2, 13.5, GT4, 0xb8c4d0, { seg: 20, uv: [1.75, 3.375], keyTop: CONC2 }), cyl(-W / 2 + 0.6, 0, D / 2 - 0.6, 3.3, 1.0, CONC2, 0xb4b8bc, { seg: 20 }), cyl(-W / 2 + 0.6, 13.5, D / 2 - 0.6, 3.4, 0.4, CONC2, 0xb4b8bc, { seg: 20 }), box(0, 11.5, 0, W + 2.2, 1.3, D + 2.2, CONC, 0xa4a8ac, { under: true }));
            fakeDoor(P, 3.5, 0, D / 2 + 0.12, 0, DP, 0xb0b8c0, 2.0, 2.6);
            emit(T, P);
        })();
        shop('P09-00-B2', { face: 'N', wall: BR1, tint: 0xc8a890, trim: 0x2f5a48 });
        workshop('P09-00-B3', { face: 'E', tint: 0x6a80a0 });

        /* ═══ 3. THE GOBLIN BANK — the district's landmark: a marble temple, a great arch behind a six-column portico, a verdigris dome ═══ */
        (() => {
            const T = frame('P10-00-B1', { hollow: true, st: 4, w: 26.3, d: 23, dz: -2.5, leaf: 'leaf_lobby_glass_double' }); if (!T) return;
            const P = [], W = T.W, D = T.D, JADE = 0xe6eedc, TRIM = 0xd2dcc8, F = D / 2, lx = T.lx;
            P.push(box(0, 0, 0, W + 0.1, 15, D + 0.1, STONE, JADE, { top: false, uv: 3.5, faces: 'blr' })); frontWithDoor(P, T, 0, 15, STONE, JADE, { uv: 3.5 });
            P.push(box(W / 2 + 0.25, 0, -9.9, 0.5, 15, 1.1, STONE, TRIM, { n: 7, step: [0, 0, 3.3], top: false }), box(-W / 2 - 0.25, 0, -9.9, 0.5, 15, 1.1, STONE, TRIM, { n: 7, step: [0, 0, 3.3], top: false }));
            P.push(quad(W / 2 + 0.12, 3.5, -8.25, 1.5, 7, 270, GR, 0xbfd0c0, { uv: [1.5, 3.5], n: 6, step: [0, 0, 3.3] }), quad(-W / 2 - 0.12, 3.5, -8.25, 1.5, 7, 90, GR, 0xbfd0c0, { uv: [1.5, 3.5], n: 6, step: [0, 0, 3.3] }));
            P.push(box(0, 15, 0, W + 1.4, 0.9, D + 1.4, STONE, TRIM, { under: true }), box(0, 15.9, 0, 21, 3.2, 19, STONE, JADE, { uv: 3.5 }));
            P.push(cyl(0, 19.1, 0, 8.2, 3.6, STONE, 0xdce4d0, { seg: 32, cap: false }), quad(0, 19.7, 0, 1.4, 2.2, 0, GR, 0xbfd0c0, { uv: [1.4, 2.2], ring: { n: 16, r: 8.26 } }));
            P.push(cyl(0, 22.7, 0, 8.6, 0.5, ALU, VERDI, { seg: 32 }), dome(0, 23.2, 0, 8.1, 8.1, ALU, VERDI, { seg: 32, rings: 8 }));
            P.push(cyl(0, 31.1, 0, 1.3, 2.2, STONE, JADE, { seg: 12 }), dome(0, 33.3, 0, 1.5, 1.5, 'gold', WHITE), cyl(0, 34.6, 0, 0.1, 2.6, null, 0xe8c860, { seg: 6 }));
            /* the portico: a stylobate, six columns (the middle pair opened round the arch), the entablature, the pediment */
            P.push(box(0, 0, F + 2.5, 22, 0.3, 5, CONC2, 0xd0ccc0));
            for (let c = 0; c < 6; c++) { const cx = -8.75 + c * 3.5 + (c === 2 ? -0.9 : c === 3 ? 0.9 : 0) + lx; P.push(cyl(cx, 0.3, F + 4, 0.72, 11.8, STONE, WHITE, { seg: 16, r2: 0.6, cap: false }), box(cx, 0.3, F + 4, 1.8, 0.5, 1.8, STONE, TRIM), box(cx, 12.0, F + 4, 1.7, 0.4, 1.7, STONE, TRIM)); }
            P.push(box(lx, 12.4, F + 2.6, 21.6, 1.7, 5, STONE, JADE, { under: true }), box(lx, 14.1, F + 2.6, 22.6, 0.4, 5.6, STONE, TRIM, { under: true }));
            P.push(roof('gable', lx, 14.5, F + 2.6, 5.4, 3.6, 22.6, STONE, JADE, { ry: 90, keyEnd: STONE, tintEnd: JADE }));
            /* the great arch round the doorway */
            P.push(quad(lx - 1.9, 0, F + 0.1, 1.9, 5.4, 0, GT, 0x8a7a40, { uv: [1.9, 5.4] }), quad(lx + 1.9, 0, F + 0.1, 1.9, 5.4, 0, GT, 0x8a7a40, { uv: [1.9, 5.4] }), quad(lx, 2.5, F + 0.1, 1.9, 2.9, 0, GT, 0x8a7a40, { uv: [1.9, 2.9] }));
            P.push(fan(lx, 5.4, F + 0.16, 3.25, 0, 'gold', WHITE), fan(lx, 5.4, F + 0.2, 2.8, 0, GT, 0x8a7a40, { kind: 'glass' }));
            P.push(box(lx - 3.05, 0, F + 0.25, 0.5, 5.4, 0.5, 'gold', WHITE), box(lx + 3.05, 0, F + 0.25, 0.5, 5.4, 0.5, 'gold', WHITE), box(lx, 8.5, F + 0.25, 0.9, 0.9, 0.5, 'gold', WHITE));
            /* the two lion blocks */
            for (const x of [-12, 12]) P.push(box(lx + x, 0, F + 3.2, 2.2, 1.6, 3.4, CONC2, 0xd0ccc0));
            for (const x of [-12, 12]) P.push(cyl(lx + x, 1.6, F + 3.2, 0.5, 0.9, STONE, TRIM, { seg: 10, r2: 0.8 }), dome(lx + x, 2.5, F + 3.2, 0.8, 0.5, 'gold', WHITE, { roof: false }));
            emit(T, P);
        })();

        /* ═══ 4. THE EXECUTIVE COURT — a blue glass slab on stilts over a glass lobby, a boardroom box hung out over the court, a helipad;
               the bankers' terrace beside it ═══ */
        (() => {
            const T = frame('P11-00-B1', { st: 1, w: 16, d: 6.5, dz: -1.0 }); if (!T) return; const P = [], W = 28, D = 13, BLUE = 0xa8d0f0, cz = 1.0;   // the slab's own middle: the row was moved back onto the lobby
            P.push(cyl(-12.6, 0, cz + D / 2 - 0.8, 0.45, 5.25, CONC, 0xc8c8c8, { seg: 12, cap: false, n: 8, step: [3.6, 0, 0] }), cyl(-12.6, 0, cz - D / 2 + 0.8, 0.45, 5.25, CONC, 0xc8c8c8, { seg: 12, cap: false, n: 8, step: [3.6, 0, 0] }));
            P.push(box(0, 0, 0, T.W + 0.1, 5.25, T.D + 0.1, GT4, 0xd8e8f0, { uv: [3.5, 5.25], top: false, keyBase: GT4 })); fakeDoor(P, 0, 0, T.D / 2 + 0.12, 0, DS, WHITE, 2.8, 2.8);
            P.push(box(0, 5.25, cz, W, 17.5, D, GS1, BLUE, { uv: 3.5, under: true, keyTop: U('ConcreteUnderTiles1') }));
            P.push(box(0, 5.1, cz, W + 0.7, 0.3, D + 0.7, ALU, 0xe8eef2, { n: 6, step: [0, 3.5, 0], under: true }));
            P.push(box(-W / 2 + 1.6, 0, cz, 3.2, 26.5, D + 0.2, STONE, 0xd0d4d8, { uv: 3.5 }));                                     // the stone lift core
            P.push(box(4, 15.9, cz + D / 2 + 2.6, 9, 3.4, 5.4, GT4, 0x6a8098, { uv: [3.5, 3.4], top: false }), box(4, 15.6, cz + D / 2 + 2.6, 9.5, 0.3, 5.8, ALU, 0xe8eef2, { under: true }), box(4, 19.3, cz + D / 2 + 2.6, 9.5, 0.3, 5.8, ALU, 0xe8eef2));
            P.push(cyl(3, 22.75, cz, 4.2, 0.25, CONC, 0x80848a, { seg: 28 }), box(3, 23.02, cz, 0.5, 0.02, 3.2, null, 0xffe26a, { n: 2, step: [1.6, 0, 0] }), box(3.8, 23.02, cz, 1.6, 0.02, 0.5, null, 0xffe26a));
            emit(T, P);
            prop(T, 'fountain', 0, 25, 0); prop(T, 'planter', -7, 9.5); prop(T, 'planter', 7, 9.5);
        })();
        terrace('P11-00-B2', 3, [0xc8806c, 0xe0c0a0, 0xaa7a6a]);

        /* ═══ 5. THE MEMBERS CLUB — an oxblood brick clubhouse (its roof is on the roof route): stone corners, a bowed bay under a
               verdigris cap, a green awning over a discreet door, two stacks ═══ */
        (() => {
            const T = frame('P08-01-B1', { face: 'S' }); if (!T) return; const P = [], W = T.W, D = T.D, OX = 0xc87462, Y = T.H, F = D / 2;
            P.push(box(0, 0, 0, W + 0.1, Y - 0.02, D + 0.1, BR3, OX, { top: false }), box(0, 0, 0, W + 0.4, 1.1, D + 0.4, STONE, 0xcfc6b4, { top: false }));
            for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push(box(c[0] * (W / 2 - 0.3), 1.1, c[1] * (F - 0.3), 1.2, Y - 1.2, 1.2, STONE, 0xe2dac8, { top: false }));
            wins(P, 'blr', 0, 3.5, 0, W + 0.1, 3.3, D + 0.1, WIN, 3); wins(P, 'blr', 0, 0.6, 0, W + 0.1, 3.0, D + 0.1, WIN, 3);
            P.push(quad(-W / 4 - 1, 3.6, F + 0.11, W / 2 - 3, 3.2, 0, WIN, WHITE, { uv: [3.5, 3.5] }));
            P.push(box(0, Y - 0.52, 0, W + 1.0, 0.5, D + 1.0, STONE, 0xe2dac8, { top: false, under: true }));
            const bx = W / 4;
            P.push(cyl(bx, 0, F, 2.7, 6.0, GR, 0xf0e4c4, { seg: 20, uv: [1.4, 3.0], cap: false, arc: 180, a0: 0 }), cyl(bx, 0, F, 2.85, 1.0, STONE, 0xcfc6b4, { seg: 20, arc: 180, a0: 0 }), cyl(bx, 6.0, F, 2.95, 0.35, STONE, 0xe2dac8, { seg: 20, arc: 180, a0: 0 }));
            P.push(dome(bx, 6.35, F, 2.75, 1.2, ALU, VERDI, { arc: 180, a0: 0, roof: false }));
            const dx = -W / 4 - 1;
            fakeDoor(P, dx, 0, F + 0.12, 0, DW, 0x6a5040, 2.2, 2.7);
            P.push(roof('shed', dx, 2.95, F + 1.35, 3.6, 1.0, 2.6, null, 0x1f4a38, { under: true, roof: false }));
            P.push(cyl(dx - 1.7, 0, F + 2.5, 0.06, 3.0, null, 0xd8b060, { seg: 6 }), cyl(dx + 1.7, 0, F + 2.5, 0.06, 3.0, null, 0xd8b060, { seg: 6 }));
            P.push(box(dx - 1.6, 2.1, F + 0.3, 0.3, 0.45, 0.3, null, 0xffe8a0, { glow: 0.9 }), box(dx + 1.6, 2.1, F + 0.3, 0.3, 0.45, 0.3, null, 0xffe8a0, { glow: 0.9 }));
            P.push(box(W / 2 - 1.0, Y, -F + 1.0, 1.2, 3.4, 1.2, BR3, OX), box(-W / 2 + 1.0, Y, -F + 1.0, 1.2, 3.4, 1.2, BR3, OX));
            emit(T, P);
        })();

        /* ═══ 6. THE CATERER YARD — the working back of the district: a brick north wing (its roof is on the roof route), a tin dock wing
               with a canopy and three shutters, a sawtooth kitchen with its stacks, round a loading yard open to the south ═══ */
        (() => {
            const row = rowOf('P09-01-B1'); if (!row) return;
            /* the roof-route tier becomes the north wing alone (both bridges land on it); the two wings below are ground buildings */
            const x0 = row.x, z0 = row.z, Wf = row.w, Df = row.d, nd = 10.5; row.z = r3(z0 - Df / 2 + nd / 2); row.d = nd;
            const T = frame('P09-01-B1', { face: 'S' }), P = [], Y = T.H, TAN = 0xdcb898, TIN = 0xe4dec8, F = nd / 2;
            P.push(box(0, 0, 0, Wf + 0.1, Y - 0.02, nd + 0.1, BR1, TAN, { top: false })); wins(P, 'fb', 0, 3.6, 0, Wf, 1.75, nd + 0.1, WINF, 4);
            P.push(box(0, Y - 0.34, 0, Wf + 0.5, 0.32, nd + 0.5, CONC, 0xa8a8a8, { top: false, under: true }));
            fakeDoor(P, 2, 0, F + 0.12, 0, DP, 0xd0d0c8, 2.0, 2.6);
            const wl = 17.5, wz = F + wl / 2, ww = 9;                                                                     // the wings, in the north wing's frame
            P.push(box(-Wf / 2 + ww / 2, 0, wz, ww, 1.4, wl, BR1, TAN, { top: false }), box(-Wf / 2 + ww / 2, 1.4, wz, ww, 4.9, wl, CORR, TIN, { keyTop: U('ConcreteUnderTiles1') }));
            P.push(box(-Wf / 2 + ww + 1.4, 0, wz, 2.8, 1.2, wl - 2, CONC, 0xb8b8b8));                                       // the dock
            P.push(quad(-Wf / 2 + ww + 0.06, 1.2, wz - 5.6, 3.8, 3.4, 270, CORR2, 0x9aa0a8, { n: 3, step: [0, 0, 5.6] }));
            P.push(box(-Wf / 2 + ww + 2.2, 4.9, wz, 4.4, 0.3, wl - 1, CORR2, 0x8a98a0, { under: true }), cyl(-Wf / 2 + ww + 4.1, 1.2, wz - 7.5, 0.1, 3.7, null, 0x606870, { seg: 6, n: 4, step: [0, 0, 5] }));
            P.push(box(Wf / 2 - ww / 2, 0, wz, ww, 6, wl, BR1, 0xcca88c, { top: false }));
            P.push(roof('shed', Wf / 2 - ww / 2, 6, wz - wl / 2 + wl / 8, ww, 2.4, wl / 4, CORR2, 0x8c97a0, { n: 4, step: [0, 0, wl / 4], keyEnd: GF, tintEnd: 0xd8e8e8, ry: 180 }));
            P.push(quad(Wf / 2 - ww - 0.06, 2.2, wz, wl - 2, 1.75, 90, WINF, WHITE, { uv: [3.5, 3.5] }));
            P.push(cyl(Wf / 2 - 1.3, 6, wz - 5.5, 0.5, 5.5, ALU, 0xd0d4d8, { seg: 12, n: 3, step: [0, 0, 4.75] }));
            fakeDoor(P, Wf / 2 + 0.06, 0, wz - 3, 270, DP, 0xd0d0c8, 2.0, 2.6);
            emit(T, P);
            /* the wings' collision (ground buildings with no skin) */
            const wW = local(T, -Wf / 2 + ww / 2, wz), wE = local(T, Wf / 2 - ww / 2, wz);
            lateRows.push({ k: 'texbuilding', id: 'dc:P09-01-B1-dock', x: wW[0], z: wW[1], w: ww, d: wl, rot: 0, storeys: 2, skin: false, seed: 9802 }, { k: 'texbuilding', id: 'dc:P09-01-B1-kitchen', x: wE[0], z: wE[1], w: ww, d: wl, rot: 0, storeys: 2, skin: false, seed: 9803 });
            prop(T, 'car_truck', 1.5, wz + 1, 0); prop(T, 'dumpster', 3.4, wz + 7, 270);
        })();

        /* ═══ 7. THE BANK OFFICES — a teal curtain-wall slab on a glass lobby behind stone piers, aluminium floor bands, a stone core
               taller than the slab, plant on the roof ═══ */
        (() => {
            const T = frame('P10-01-B1', { hollow: true, st: 2 }); if (!T) return; const P = [], W = T.W, D = T.D, TEAL = 0x9ae0d8, F = D / 2;
            P.push(box(0, 0, 0, W + 0.1, 7, D + 0.1, GT, 0xe0f0ec, { uv: [3.5, 7], top: false, faces: 'blr', keyBase: GT })); frontWithDoor(P, T, 0, 7, GT, 0xe0f0ec, { uv: [3.5, 7], keyBase: GT });
            P.push(box(-W / 2 + 6, 0, F + 0.45, 0.8, 7, 0.8, STONE, 0xd8d8d0, { n: Math.floor((W - 7) / 3.3) + 1, step: [3.3, 0, 0], top: false }));
            P.push(box(0, 7, 0, W + 0.1, 24.5, D + 1.2, GS2, TEAL, { uv: 3.5, under: true, keyTop: U('ConcreteUnderTiles1') }));
            P.push(box(0, 6.86, 0, W + 0.9, 0.28, D + 2.0, ALU, 0xeef2f4, { n: 8, step: [0, 3.5, 0], under: true }));
            P.push(box(-W / 2 + 4.2, 7, F + 0.75, 0.14, 24.5, 0.3, ALU, 0xeef2f4, { n: Math.floor((W - 5) / 1.75), step: [1.75, 0, 0], top: false }));
            P.push(box(-W / 2 + 2.4, 0, 0, 4.8, 35, D + 1.8, CONC2, 0xe0d4c0));
            P.push(box(5, 31.5, 0, 10, 3, 6, CORR2, 0x9aa4ac), cyl(-W / 2 + 2.4, 35, 0, 0.14, 10, null, 0xd0d0d0, { seg: 6 }), box(-W / 2 + 2.4, 45, 0, 0.4, 0.4, 0.4, null, 0xff3030, { glow: 1 }));
            emit(T, P);
        })();
        terrace('P10-01-B2', 3, [0xd09880, 0xb8b0a0, 0xc08870]);

        /* ═══ 8. THE VAULT ANNEX — a bunker: stepped dark stone, no windows, a round-headed steel vault door in a stepped portal, four
               camera drums, a low concrete cap ═══ */
        (() => {
            const T = frame('P11-01-B1', { hollow: true, st: 1, leaf: 'leaf_security', leafDouble: true }); if (!T) return; const P = [], W = T.W, D = T.D, DK = 0xa8aeba, F = D / 2, lx = T.lx;
            P.push(box(0, 0, 0, W + 0.1, 3.7, D + 0.1, GUN, DK, { top: false, faces: 'blr' })); frontWithDoor(P, T, 0, 3.7, GUN, DK);   // the inside is one storey: it stays under the first step
            P.push(box(0, 3.4, 0, W - 1.2, 3.2, D - 1.2, GUN, DK), box(0, 6.6, 0, W - 2.6, 2.8, D - 2.6, GUN, DK));
            P.push(box(0, 9.4, 0, W - 5.5, 3.2, D - 5, CONC, 0xb4b8bc), box(0, 12.6, 0, W - 3.5, 0.9, D - 3, CONC, 0x94989e, { under: true }), dome(0, 13.5, 0, 6.5, 2.1, CONC2, 0xbcc0c4, { seg: 28 }));
            for (const c of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push(cyl(c[0] * (W / 2 - 1.0), 0, c[1] * (F - 1.0), 2.3, 11.5, GUN, 0x969ca8, { seg: 16, cap: false }), cyl(c[0] * (W / 2 - 1.0), 11.5, c[1] * (F - 1.0), 2.6, 0.5, CONC, 0x94989e, { seg: 16 }));
            /* the portal: three stepped frames round the doorway, the vault door's round head and its wheel over it */
            P.push(box(lx - 4.6, 0, F + 0.5, 1.6, 8, 1.0, CONC, 0x80848c), box(lx + 4.6, 0, F + 0.5, 1.6, 8, 1.0, CONC, 0x80848c), box(lx, 7, F + 0.5, 10.8, 1.0, 1.0, CONC, 0x80848c));
            P.push(box(lx - 3.2, 0, F + 0.35, 1.3, 7, 0.7, GUN, 0xb0b4bc), box(lx + 3.2, 0, F + 0.35, 1.3, 7, 0.7, GUN, 0xb0b4bc));
            P.push(quad(lx - 1.7, 0, F + 0.12, 1.66, 3.4, 0, 'metal', 0xd8dce0), quad(lx + 1.7, 0, F + 0.12, 1.66, 3.4, 0, 'metal', 0xd8dce0), quad(lx, 2.2, F + 0.12, 1.76, 1.2, 0, 'metal', 0xd8dce0));
            P.push(fan(lx, 3.4, F + 0.14, 2.55, 0, 'metal', 0xd8dce0), fan(lx, 3.4, F + 0.2, 0.9, 0, 'gold', WHITE), box(lx, 4.3, F + 0.2, 3.6, 0.16, 0.1, 'gold', WHITE), box(lx, 3.42, F + 0.2, 5.1, 0.2, 0.12, 'gold', WHITE));
            P.push(cyl(lx - 10.4, 0, F + 4, 0.28, 1.0, CONC, 0x94989e, { seg: 10, n: 3, step: [2.6, 0, 0] }), cyl(lx + 5.2, 0, F + 4, 0.28, 1.0, CONC, 0x94989e, { seg: 10, n: 3, step: [2.6, 0, 0] }));
            emit(T, P);
        })();

        /* ═══ 9. THE TAXI COURT — a long cantilevered canopy over the rank with a yellow checker fascia and a round-ended dispatch office;
               the drivers' store across the road ═══ */
        (() => {
            const T = frame('P08-02-B1', { hollow: true, st: 1, w: 6.2, d: 5.6, door: 2, leaf: 'leaf_office' }); if (!T) return;
            /* the row is now the dispatch office at the rank's south end; the canopy and the back wall are drawn round it */
            const full = 31.5, deep = 10.5, P = [], YEL = 0xf2c230, ox = full / 2 - 3.4, F = T.D / 2;                       // the rank runs to -x of the office
            const mv = local(T, -ox, -1.0); T.row.x = mv[0]; T.row.z = mv[1]; T.x = mv[0]; T.z = mv[1];
            P.push(box(0, 0, 0, T.W + 0.1, 4.2, T.D + 0.1, U('PlasterWallPainted1a'), 0xf8f4e8, { top: false, faces: 'blr' })); frontWithDoor(P, T, 0, 4.2, U('PlasterWallPainted1a'), 0xf8f4e8);
            P.push(cyl(T.W / 2, 0, F - 0.4, 2.3, 4.2, GT, 0xe0f0f0, { seg: 18, uv: [2.5, 4.2], cap: false }), cyl(T.W / 2, 4.2, F - 0.4, 2.5, 0.3, ALU, 0xf0f0f0, { seg: 18 }), box(0, 4.2, 0, T.W + 0.3, 0.3, T.D + 0.3, ALU, 0xf0f0f0));
            const cx = ox, cz = 2.4;                                                                                           // the canopy's middle, in the office's frame
            P.push(box(cx, 0, -deep / 2 + 1.5, full, 6, 1.0, BR1, 0xd0c0a8));                                                 // the back wall
            P.push(box(cx, 5.4, cz, full + 1, 0.5, deep + 3.4, ALU, 0xf4f4f4, { under: true }));
            P.push(box(cx, 4.7, cz + deep / 2 + 1.7, full + 1, 1.2, 0.2, U('TileMarble1a'), YEL, { uv: 1.2 }), box(cx + full / 2 + 0.5, 4.7, cz, 0.2, 1.2, deep + 3.4, U('TileMarble1a'), YEL, { uv: 1.2 }), box(cx - full / 2 - 0.5, 4.7, cz, 0.2, 1.2, deep + 3.4, U('TileMarble1a'), YEL, { uv: 1.2 }));
            P.push(cyl(cx - 9.9, 0, 1.4, 0.2, 5.4, null, 0x30343a, { seg: 8, cap: false, n: 4, step: [6.6, 0, 0] }));
            emit(T, P);
            { const A = local(T, cx - full / 2, -deep / 2 + 1.5), B = local(T, cx + full / 2, -deep / 2 + 1.5); lateRows.push({ k: 'wall', x0: A[0], z0: A[1], x1: B[0], z1: B[1], t: 1.0, h: 6, ghost: true, rail: false }); }
            for (let c = 0; c < 4; c++) prop(T, 'car_taxi', cx - 9 + c * 5.4 + 2.7, 2.6, 0);
        })();
        (() => {
            const T = frame('P08-02-B2', { hollow: true, st: 1, w: 21, d: 7, leaf: 'leaf_lobby_glass_double' }); if (!T) return; const P = [], W = T.W, D = T.D, F = D / 2;
            P.push(box(0, 0, 0, W + 0.1, 4.4, D + 0.1, U('PlasterWallPainted1a'), 0xf8f6ee, { faces: 'blr', keyTop: U('ConcreteUnderTiles1') })); frontWithDoor(P, T, 0, 4.4, GT, 0xe4f4f0, { uv: [3.0, 4.4] });
            P.push(box(0, 3.3, F + 0.8, W + 0.6, 1.3, 1.6, null, 0xf2f2ee, { under: true }), box(0, 3.5, F + 1.62, W + 0.6, 0.28, 0.05, null, 0xe24a1c, { top: false }), box(0, 3.85, F + 1.62, W + 0.6, 0.28, 0.05, null, 0x1e8a4a, { top: false }));
            P.push(box(W / 2 + 2.4, 0, 0, 4.6, 3.2, D - 1, BR1, 0xc8b8a8), quad(W / 2 + 2.4, 0, F - 0.42, 3.2, 2.8, 0, CORR2, 0x9aa0a8));
            emit(T, P);
        })();

        /* ═══ 10. THE TAILOR SHOPS — the pack's shop block at its real size (the shared rule), the atelier, the cloth store ═══ */
        shop('P09-02-B2', { wall: U('PlasterWallPainted1d'), tint: 0xf0e4c8, trim: 0x7a2030 });
        workshop('P09-02-B3', { tint: 0xb88a6a, teeth: 3 });

        /* ═══ 11. THE INTELLIGENCE OFFICE — no sign: black glass tiers that grow as they rise over a recessed dark stone foot, a radome
               and a mast on the roof ═══ */
        (() => {
            const T = frame('P10-02-B1', { hollow: true, st: 1, w: 19, d: 15.5, leaf: 'leaf_security', leafDouble: true }); if (!T) return; const P = [], F = T.D / 2, BLK = 0x586a8c, FW = 28, FD = 24.5;
            P.push(box(0, 0, 0, T.W + 0.1, 5.25, T.D + 0.1, GUN, 0x80848c, { top: false, faces: 'blr' })); frontWithDoor(P, T, 0, 5.25, GUN, 0x80848c);
            P.push(cyl(-10.4, 0, FD / 2 - 2.2, 0.5, 5.25, CONC, 0x94989e, { seg: 10, cap: false, n: 5, step: [5.2, 0, 0] }), cyl(-10.4, 0, -FD / 2 + 2.2, 0.5, 5.25, CONC, 0x94989e, { seg: 10, cap: false, n: 5, step: [5.2, 0, 0] }));
            [[21, 17.5], [23.4, 19.8], [25.7, 22.2], [FW, FD]].forEach((t, i) => { P.push(box(0, 5.25 + i * 4, 0, t[0], 3.6, t[1], GT4, BLK, { uv: [1.75, 3.6], under: true, top: false }), box(0, 5.25 + i * 4 + 3.6, 0, t[0] + 0.5, 0.4, t[1] + 0.5, CONC2, 0xb4b4ac, { under: true, keyTop: U('ConcreteUnderTiles1') })); });
            P.push(cyl(-6, 21.25, -3, 2.2, 1.6, CONC, 0xa8a8a8), dome(-6, 22.85, -3, 3.9, 5.2, 'enamel_2', WHITE, { seg: 20, rings: 8 }));
            P.push(cyl(5, 21.25, -6, 1.8, 0.5, ALU, 0xf0f0f0, { r2: 0.3 }), cyl(9, 21.25, 2, 1.3, 0.45, ALU, 0xf0f0f0, { r2: 0.25 }), cyl(3, 21.25, 6, 1.1, 0.4, ALU, 0xf0f0f0, { r2: 0.2 }));
            P.push(cyl(8, 21.25, -7, 0.16, 12, null, 0xb0b0b0, { seg: 6 }), box(8, 33.25, -7, 0.4, 0.4, 0.4, null, 0xff3030, { glow: 1 }), box(2, 21.25, -1, 5, 2.2, 4, CORR2, 0x8a929a));
            P.push(cyl(-12, 0, FD / 2 + 3.6, 0.25, 0.9, CONC, 0x80848a, { seg: 8, n: 11, step: [2.4, 0, 0] }));
            emit(T, P);
        })();

        /* ═══ 12. THE SERVICE GARAGE — a bow-roofed tin shed on a brick dado, three bays with their shutters half up; the bankers'
               terrace beside it ═══ */
        (() => {
            const T = frame('P11-02-B1', { st: 2 }); if (!T) return; const P = [], W = T.W, D = T.D, F = D / 2, TG = 0x9ac4ba;
            P.push(box(0, 0, 0, W + 0.1, 1.4, D + 0.1, BR1, 0xc8a890, { top: false }), box(0, 1.4, 0, W + 0.06, 4.2, D + 0.06, CORR, TG, { top: false }));
            P.push(roof('barrel', 0, 5.6, 0, W + 0.6, 3.4, D + 0.6, CORR2, 0xc87a5c, { keyEnd: CORR, tintEnd: TG, seg: 12 }));
            for (let i = 0; i < 3; i++) { const x = -W / 2 + 3.6 + i * 6.2; P.push(quad(x, 0, F + 0.1, 5.0, 4.4, 0, null, 0x15181c), quad(x, 2.6, F + 0.14, 5.0, 1.8, 0, CORR2, 0xa8aeb4)); }
            P.push(quad(0, 4.5, F + 0.1, W - 1.2, 1.0, 0, GF, 0xd0dce0, { uv: [1.75, 1.0] }));
            fakeDoor(P, W / 2 - 1.8, 0, F + 0.12, 0, DP, 0xd8d0c0, 1.7, 2.5);
            emit(T, P);
            prop(T, 'car_suv', -W / 2 + 9.8, F + 3.2, 20);
        })();
        terrace('P11-02-B2', 4, [0xd09a80, 0xb8b0a0, 0xc8806c, 0xe0c0a0]);

        /* ═══ 13. THE FINANCE ARCADE — a sandstone loggia you walk under: four arches on piers before the shop front, tall windows
               over, a clock gable, a glazed roof lantern; the news kiosk opposite ═══ */
        (() => {
            const T = frame('P08-03-B1', { hollow: true, st: 1, d: 6.5, dz: -2.0, leaf: 'leaf_lobby_glass_double' }); if (!T) return; const P = [], W = T.W, F = T.D / 2, SAND = 0xf4dcb0, TR = 0xe0c898, FD = 10.5, cz = 2.0, FF = cz + FD / 2;
            P.push(box(0, 0, 0, W + 0.1, 5.2, T.D + 0.1, STONE, SAND, { top: false, faces: 'blr' })); frontWithDoor(P, T, 0, 5.2, GT, 0xf0e8d0, { uv: [3.0, 5.2], keyBase: GT });
            const n = 4, bay = (W - 1) / n;
            P.push(box(-W / 2 + 0.5, 0, FF - 0.5, 1.0, 3.6, 1.0, STONE, TR, { n: n + 1, step: [bay, 0, 0], top: false }));
            P.push(box(0, 3.6, FF - 0.5, W + 0.1, 1.6, 1.0, STONE, SAND, { under: true, top: false }));
            for (let a = 0; a < n; a++) P.push(fan(-W / 2 + 0.5 + bay * (a + 0.5), 3.6, FF + 0.02, bay / 2 - 0.5, 0, null, 0x2a2620), fan(-W / 2 + 0.5 + bay * (a + 0.5), 3.6, FF - 0.02, bay / 2 - 0.36, 0, STONE, TR));
            P.push(box(0, 5.2, cz, W + 0.1, 7, FD + 0.1, STONE, SAND, { uv: 3.5, under: true, keyTop: U('ConcreteUnderTiles1') }), box(0, 5.0, cz, W + 0.6, 0.4, FD + 0.6, STONE, TR, { under: true }));
            P.push(quad(-W / 2 + 0.5 + bay / 2, 6.2, FF + 0.11, 1.7, 4.6, 0, GR, 0xd8e0d0, { uv: [1.7, 2.3], n, step: [bay, 0, 0] }));
            P.push(box(0, 12.2, cz, W + 1.0, 0.55, FD + 1.0, STONE, TR, { under: true }), roof('gable', 0, 12.75, FF - 0.4, 0.7, 2.6, 6, STONE, SAND, { ry: 90, keyEnd: STONE, tintEnd: SAND, roof: false }));
            P.push(fan(0, 12.95, FF + 0.02, 0.95, 0, null, 0xfaf6e8, { glow: 0.5 }));
            P.push(roof('barrel', 0, 12.75, cz - 0.6, W - 1.5, 2.2, 4.4, GF, 0xd8f0ec, { keyEnd: GF, tintEnd: 0xd8f0ec }));
            emit(T, P);
        })();
        (() => {
            const T = frame('P08-03-B2', { st: 1, w: 10, d: 4.6, dz: 6.4 }); if (!T) return; const P = [], W = T.W, D = T.D, F = D / 2;
            P.push(box(0, 0, 0, W + 0.1, 3.4, D + 0.1, U('PlasterWallPainted1a'), 0x3a6a56, { top: false }), quad(0, 0.9, F + 0.11, W - 2, 1.9, 0, GT, 0xf0e8d0, { uv: [3, 1.9] }));
            P.push(roof('barrel', 0, 3.4, 0.6, W + 0.6, 1.2, D + 2.4, ALU, VERDI, { keyEnd: ALU, tintEnd: VERDI }), box(-3, 0, F + 0.8, 1.6, 1.2, 0.6, WOOD, 0xd8b888), box(2, 0, F + 0.8, 1.6, 1.2, 0.6, WOOD, 0xd8b888));
            emit(T, P);
        })();

        /* ═══ 14. THE WORKER CAFE — the DINER pack building at its real size in the middle of its plot; the terrace beside it ═══ */
        (() => {
            const row = rowOf('P09-03-B1'); if (!row) return;
            props.unshift({ key: 'city_diner', x: row.x, z: r3(row.z - 0.1), face: 180 });   // face 180 = its entrance and DINER sign to the south (seen in game)
            drop(row);
        })();
        terrace('P09-03-B2', 2, [0xb8b0a0, 0xc8806c]);

        /* ═══ 15. THE PENTHOUSE STAIR — a slim ivory point tower: balcony rings, two glass drum corners, a glazed stair shaft, a glass
               penthouse under a butterfly roof ═══ */
        (() => {
            const T = frame('P10-03-B1', { hollow: true, st: 1, leaf: 'leaf_lobby_glass_double' }); if (!T) return; const P = [], W = T.W, D = T.D, F = D / 2, IV = 0xfaf2e2, H = 31.5;
            P.push(box(0, 0, 0, W + 0.1, H, D + 0.1, U('PlasterWallStucco1a'), IV, { uv: 3.5, top: false, faces: 'blr' })); frontWithDoor(P, T, 0, H, U('PlasterWallStucco1a'), IV, { uv: 3.5 });
            P.push(box(0, 3.38, 0, W + 1.8, 0.25, D + 1.8, CONC, 0xf0f0ec, { n: 9, step: [0, 3.5, 0], under: true }));
            for (let k = 1; k < 9; k++) { wins(P, 'fb', 0, k * 3.5 + 0.2, 0, W - 3, 3.3, D + 0.1, WIN, 1.0); wins(P, 'lr', 0, k * 3.5 + 0.2, 0, W + 0.1, 3.3, D, WIN, 1.5); }
            P.push(cyl(-W / 2 + 0.6, 0, F - 0.6, 1.9, H, GT, 0xe4f6fc, { uv: [1.75, 3.5], cap: false }), cyl(W / 2 - 0.6, 0, F - 0.6, 1.9, H, GT, 0xe4f6fc, { uv: [1.75, 3.5], cap: false }));
            P.push(box(W / 2 - 1.4, 0, -F - 1.0, 3.2, H + 5, 3.2, GF, 0xc8e4ec, { uv: 1.75 }));
            P.push(box(0, H, 0, W + 2.4, 0.4, D + 2.4, CONC, 0xf0f0ec, { under: true }), box(-0.6, H + 0.4, -0.3, W - 5, 4.4, D - 3.6, GT4, 0xc8e4f0, { uv: [2.2, 4.4], top: false }));
            P.push(roof('shed', -0.6 - (W - 2) / 4, H + 4.8, -0.3, D - 0.6, 1.2, (W - 2) / 2, ALU, WHITE, { ry: 270, under: true }), roof('shed', -0.6 + (W - 2) / 4, H + 4.8, -0.3, D - 0.6, 1.2, (W - 2) / 2, ALU, WHITE, { ry: 90, under: true }));
            P.push(box(T.lx, 2.9, F + 1.2, 5, 0.3, 2.4, ALU, 0xf4f4f4, { under: true }));
            emit(T, P);
        })();
        shop('P10-03-B2', { wall: BR1, tint: 0xc8b8a8, trim: 0x1e3a5a });
        workshop('P10-03-B3', { tint: 0x8a9a7a, teeth: 2 });

        /* ═══ 16. THE PRIVATE GARDEN — a walled garden behind an arched iron gate, and in it a white palm house: glass vault wings and a
               glass dome. The plot's block becomes the garden's wall (four wall rows, the gate a gap) and the palm house alone is a building. ═══ */
        (() => {
            const row = rowOf('P11-03-B1'); if (!row) return;
            const gx0 = row.x, gz0 = row.z, GW = row.w, GD = row.d, rot = row.rot || 0;
            const T = frame('P11-03-B1', { hollow: true, st: 1, w: 22.9, d: 7.4, dz: -3, leaf: 'leaf_lobby_glass_double' }), P = [], MOSS = 0xd8d0b8, GLS = 0xeafffa, cz = 3, F = cz + GD / 2, hw = GW / 2;   // (0, cz) = the garden's middle in the palm house's frame
            /* the garden wall and the gate piers */
            P.push(box(0, 0, cz - GD / 2, GW, 2.8, 0.6, BR2, MOSS), box(hw, 0, cz, 0.6, 2.8, GD, BR2, MOSS), box(-hw, 0, cz, 0.6, 2.8, GD, BR2, MOSS));
            P.push(box(0, 2.8, cz - GD / 2, GW + 0.3, 0.25, 0.9, STONE, 0xd8d0c0), box(hw, 2.8, cz, 0.9, 0.25, GD + 0.3, STONE, 0xd8d0c0), box(-hw, 2.8, cz, 0.9, 0.25, GD + 0.3, STONE, 0xd8d0c0));
            const gp = 2.6, sw = hw - gp;
            P.push(box(-(gp + sw / 2), 0, F, sw, 2.8, 0.6, BR2, MOSS), box(gp + sw / 2, 0, F, sw, 2.8, 0.6, BR2, MOSS), box(-(gp + sw / 2), 2.8, F, sw + 0.3, 0.25, 0.9, STONE, 0xd8d0c0), box(gp + sw / 2, 2.8, F, sw + 0.3, 0.25, 0.9, STONE, 0xd8d0c0));
            P.push(box(-gp, 0, F, 1.2, 4.2, 1.2, STONE, 0xd8d0c0), box(gp, 0, F, 1.2, 4.2, 1.2, STONE, 0xd8d0c0), dome(-gp, 4.2, F, 0.5, 0.5, STONE, 0xd8d0c0, { roof: false }), dome(gp, 4.2, F, 0.5, 0.5, STONE, 0xd8d0c0, { roof: false }));
            P.push(box(0, 3.9, F, 2 * gp - 1.2, 0.14, 0.14, null, 0x1c1e22), fan(0, 4.0, F, 1.9, 0, null, 0x1c1e22, { kind: 'wall' }));
            /* the palm house */
            P.push(box(0, 0, 0, T.W + 0.6, 0.7, 8, STONE, 0xf8f8f4, { faces: 'blr' }), box(0, 0.7, 0, T.W + 0.1, 3.2, T.D + 0.1, GF, GLS, { uv: [1.75, 3.2], top: false, faces: 'blr', glow: 0.5, kind: 'wall' })); frontWithDoor(P, T, 0, 3.9, GF, GLS, { uv: [1.75, 3.9], glow: 0.5, kind: 'wall' });
            P.push(roof('barrel', 0, 3.9, 0, T.W + 0.1, 3.7, T.D + 0.1, GF, GLS, { keyEnd: GF, tintEnd: GLS, seg: 12 }));
            P.push(box(0, 0, -2.4, 9, 0.7, 7.6, STONE, 0xf8f8f4), box(0, 0.7, -2.4, 8.4, 5.2, 7, GF, GLS, { uv: [1.75, 2.6], glow: 0.5, kind: 'wall' }));
            P.push(cyl(0, 5.9, 0, 4.3, 1.2, GF, GLS, { seg: 24, glow: 0.5, kind: 'wall', cap: false }), cyl(0, 7.1, 0, 4.5, 0.25, ALU, WHITE, { seg: 24 }), dome(0, 7.35, 0, 4.2, 4.2, GF, GLS, { seg: 24, rings: 8 }), cyl(0, 11.5, 0, 0.5, 0.9, ALU, WHITE, { seg: 8 }), dome(0, 12.4, 0, 0.4, 0.5, 'gold', WHITE));
            /* the parterre: clipped hedges, a gazebo */
            for (const p of [[-7, 9], [7, 9], [-7, 14], [7, 14]]) P.push(box(p[0], 0, p[1] + cz - 3, 6, 0.9, 0.8, 'leaves_3', 0xc8e8b8), box(p[0], 0, p[1] + cz - 1.4, 0.8, 0.9, 3, 'leaves_3', 0xc8e8b8));
            P.push(cyl(10.2, 0, cz + 3.5, 0.09, 2.6, null, WHITE, { seg: 6, ring: { n: 6, r: 1.6 } }), cyl(10.2, 2.6, cz + 3.5, 2.1, 1.3, ALU, VERDI, { seg: 6, r2: 0.05 }));
            emit(T, P);
            /* the garden wall's collision: ghost walls round the old block, the gate a gap */
            const gw = (a, b) => { const A = local(T, a[0], a[1]), B = local(T, b[0], b[1]); lateRows.push({ k: 'wall', x0: A[0], z0: A[1], x1: B[0], z1: B[1], t: 0.6, h: 2.8, ghost: true, rail: false }); };
            gw([-hw, cz - GD / 2], [hw, cz - GD / 2]); gw([hw, cz - GD / 2], [hw, F]); gw([-hw, cz - GD / 2], [-hw, F]); gw([-hw, F], [-gp, F]); gw([gp, F], [hw, F]);
            prop(T, 'fountain', 0, cz + 8.5, 0); prop(T, 'angel_statue', -10, cz - 9, 180); prop(T, 'city_bench', -10.5, cz + 6, 90); prop(T, 'city_bench', 10.5, cz + 10, 270);
            for (const t of [[-11, 10.5], [11, 10.5], [-11.5, -11], [11.5, -11]]) { const w = local(T, t[0], cz + t[1]); features.push({ k: 'tree', x: w[0], z: w[1], kind: 'tree_4', h: 4.6 }); }
        })();

        /* ── the back lots on the district's closed edges ── */
        const mine = f => f.x >= api.gx(96) - 0.01 && f.z <= api.gx(48) + 0.01;
        all().filter(f => f.k === 'texbuilding' && /^dc:in\d+/.test(f.id || '') && mine(f)).forEach((f, i) => backlot(f, i));
        console.log('[financial] arch rows', made);
    },
};
