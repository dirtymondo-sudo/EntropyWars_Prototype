/* south-kit.js — shared hand pieces for the south routes' hooks (One World BUILD_PLAN phase 4.2, 2026-11-17): R6, R8, R9 and the Desert Highway's
   legs DH1 to DH4 (docs/areas/routes/<ID>.js require this file). Repo tooling, read by bake-route.js through the hooks; never loaded by the game.
   Everything is made of pieces already in the game: catalogue props (MODEL_LIST.md), `arch` rows (three-renderer.js THE ARCHITECTURE: boxes,
   cylinders, roofs, sign boards) and `texbuilding` rows (the walker's walls, door and inside), the way bake-desert.js builds Western Town.
   Coordinates: `sq(ctx, wx, wy)` = a WORLD plot point (fractions allowed) as this room's squares; the helpers take squares. */
'use strict';
const U = n => 'urban:' + n, STEEL = U('MetalWallRibbed1a'), WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), FLR = U('WoodFlooring1d'), PLAS = U('PlasterWallStucco2a'), CONC = U('ConcretePanels1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 };   // a building's front faces this way (bake-desert.js ROT)
const sq = (ctx, wx, wy) => [(wx - ctx.BX0) * ctx.N, (wy - ctx.BY0) * ctx.N];
const mx = (ctx, s) => ctx.r2(-ctx.W * ctx.C / 2 + s * ctx.C), mz = (ctx, s) => ctx.r2(-ctx.D * ctx.C / 2 + s * ctx.C);   // a square line (fractions allowed) in metres
/* a green sign gantry over one carriageway (bake-desert.js `gantry`): `dir` = the way the traffic that reads it drives (N E S W); (sx, sy) = squares */
let nGantry = 0;
function gantry(ctx, sx, sy, dir, words, o) {
    o = o || {}; const FACE = { S: 180, N: 0, E: 90, W: 270 }, w = o.span || 11.4, bw = Math.min(w - 1.2, Math.max(5.5, words.length * 0.42 + 1.2)), bh = o.bh || 2.0, P = [];
    for (const s of [-1, 1]) P.push({ s: 'box', p: [ctx.r2(s * w / 2), 0, 0], size: [0.32, 6.4 + bh, 0.32], key: STEEL, tint: 0x70767c });
    P.push({ s: 'box', p: [0, 6.0, 0], size: [ctx.r2(w + 0.3), 0.3, 0.3], key: STEEL, tint: 0x70767c }, { s: 'box', p: [0, 6.3, 0.12], size: [ctx.r2(bw), bh, 0.12], tint: o.bg ? parseInt(o.bg.slice(1), 16) : 0x0b5c3a },
        { s: 'quad', p: [0, 6.4, 0.2], size: [ctx.r2(bw - 0.5), ctx.r2(bh - 0.2)], key: 'txt:' + words + '|' + (o.fg || '#ffffff') + '|' + (o.bg || '#0b5c3a') + '|' + ctx.r2((bw - 0.5) / (bh - 0.2)) + '||' + (o.font || 'way'), uv: 'fit', kind: 'wall', glow: 0.25 });
    ctx.feat(Object.assign({ k: 'arch', id: 'ow:' + ctx.ID.toLowerCase() + ':sign:' + (nGantry++), x: mx(ctx, sx), z: mz(ctx, sy), rot: FACE[dir], parts: P }, o.y != null ? { y: o.y } : null));   // `o.y` (2026-11-22, THE RAISED HIGHWAY): the gantry's foot stands at this height (on a deck), not on the ground
}
/* a billboard on two posts beside the road (not over it), facing `face` degrees (0 = its words read from the north... the gantry's FACE table) */
function billboard(ctx, sx, sy, dir, words, o) { o = o || {}; gantry(ctx, sx, sy, dir, words, Object.assign({ span: 8, bh: 3.0, bg: '#7a1c18', fg: '#f0d890', font: 'rye' }, o)); }
/* a one-storey building the walker reads (a texbuilding with its door and inside) + its look (an `arch` shell): (sx0, sy0)-(sx1, sy1) squares,
   `side` = the way its front faces; `o.look(A, fw, fd, door)` adds parts. Returns { at(lx, lz) -> metres, face(f) } in the building's frame. */
function building(ctx, id, sx0, sy0, sx1, sy1, side, h, o) {
    o = o || {}; const ew = side === 'E' || side === 'W', C = ctx.C, fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = mx(ctx, (sx0 + sx1) / 2), cz = mz(ctx, (sy0 + sy1) / 2), rot = ROT[side];
    ctx.clear(Math.floor(sx0) - 1, Math.floor(sy0) - 1, Math.ceil(sx1), Math.ceil(sy1));
    const L = Math.max(2, fw) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols, col = Math.floor((cols - 1) / 2), door = { lx: -L / 2 + (col + 0.5) * cw, cw };
    ctx.feat({ k: 'texbuilding', id: 'ow:' + id, seed: 1, x: cx, z: cz, w: ctx.r2(fw), d: ctx.r2(fd), rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: o.leaf || 'leaf_shabby_wood', leafDouble: false, keyIn: o.keyIn || WD2, floorIn: o.floorIn || FLR });
    const P = [], key = o.key || WD, tint = o.tint, e = 0.05, Wd = fw + 2 * e, Dp = fd + 2 * e;
    const add = (q) => { if (q.key === undefined) q.key = key; if (tint != null && q.tint == null) q.tint = tint; P.push(q); return q; };
    add({ s: 'box', p: [0, 0, 0], size: [ctx.r2(Wd), h, ctx.r2(Dp)], top: false, faces: 'blr' });
    add({ s: 'quad', p: [0, 0, ctx.r2(Dp / 2)], size: [ctx.r2(Wd), h], hole: [ctx.r2(door.lx), ctx.r2(door.cw), 2.2] });
    add({ s: 'roof', form: o.roof || 'shed', size: [ctx.r2(Wd + 0.8), o.roofH || 0.6, ctx.r2(Dp + 0.8)], p: [0, h, 0], over: 0.4, key: o.roofKey || U('MetalCorrugated1a'), tint: o.roofTint || 0x8a8070, roof: true });
    const A = { box: (x, y, z, w, hh, d, k, t, q) => add(Object.assign({ s: 'box', p: [x, y, z], size: [w, hh, d], key: k, tint: t }, q || {})),
        cyl: (x, y, z, r, hh, k, t, q) => add(Object.assign({ s: 'cyl', p: [x, y, z], r, h: hh, key: k, tint: t }, q || {})),
        sign: (words, x, y, z, w, hh, fg, bg, font, q) => P.push(Object.assign({ s: 'quad', p: [x, y, z], size: [w, hh], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + ctx.r2(w / hh) + '||' + font, uv: 'fit', kind: 'wall', glow: 0.3 }, q || {})) };
    if (o.look) o.look(A, fw, fd, door);
    ctx.feat({ k: 'arch', id: 'ow:' + id + ':look', x: cx, z: cz, rot, parts: P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return { at: (lx, lz) => [ctx.r2(cx + lx * c - lz * s), ctx.r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd };
}
/* a prop in a building's frame (`face` in its frame: 180 = looking out of its front) */
const put = (ctx, B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); ctx.props.push(r); };
/* a prop at a square's middle / at metres */
const at = (ctx, key, sx, sy, o) => ctx.props.push(Object.assign({ key, x: ctx.r2(mx(ctx, sx)), z: ctx.r2(mz(ctx, sy)) }, o || {}));
/* ── THE ROADSIDE (2026-11-22, mondo on the raised Badlands Highway: "anything else you can think to add or polish? Telephone poles? Billboards from the city?
   Mile markers? Afterward This should be the standard for how the rest of the highways get built") ── */
/* THE CITY'S BILLBOARDS: one of Disaster City's own adverts (docs/disaster-city/billboards.js ADS: the brand, its line, its colours, its typeface, its mark;
   docs/notes/branding.md) on a lit board on two posts beside the road. `dir` = the way the traffic that reads it drives; `o.lift` = the board's foot over the
   ground (9 beside a deck, so it reads from up there); `o.w` its width. Never a new brand: `name` must be on the city's list. */
let nBoard = 0;
function cityBoard(ctx, sx, sy, dir, name, o) {
    o = o || {}; const ADS = require('../../disaster-city/billboards.js').ADS, ad = ADS.find(a => a[0] === name); if (!ad) throw new Error('cityBoard: not one of the city\'s adverts: ' + name);
    const FACE = { S: 180, N: 0, E: 90, W: 270 }, W = o.w || 10, Hh = ctx.r2(W / 2.5), leg = o.lift != null ? o.lift : 5, t = 0.3, hx = c => parseInt(String(c).slice(1), 16), P = [];
    for (const q of [-1, 1]) P.push({ s: 'box', p: [ctx.r2(q * (W / 2 - 1.2)), 0, -0.25], size: [0.36, ctx.r2(leg + Hh), 0.36], key: STEEL, tint: 0x4a4e55 });
    P.push({ s: 'box', p: [0, ctx.r2(leg - 0.5), -0.25], size: [ctx.r2(W - 1.6), 0.3, 0.3], key: STEEL, tint: 0x4a4e55 },                       // the catwalk under the board
           { s: 'box', p: [0, ctx.r2(leg - 0.12), -0.12], size: [ctx.r2(W + 0.3), ctx.r2(Hh + 0.24), 0.3], tint: 0x1a1b20 },                     // the frame, and the board's dark back
           { s: 'box', p: [0, leg, 0], size: [W, Hh, t], tint: hx(ad[3]), glow: 0.5 });                                                             // the lit panel
    const q = (y, ww, hh, words, font, mark) => P.push({ s: 'quad', p: [0, ctx.r2(y), ctx.r2(t / 2 + 0.02)], size: [ctx.r2(ww), ctx.r2(hh)], uv: 'fit', kind: 'over', glow: 0.9, tint: 16777215,
        key: 'txt:' + words + '|' + ad[2] + '||' + ctx.r2(ww / hh) + '||' + font + (mark ? '|' + mark : '') });
    q(leg + Hh * 0.36, W * 0.9, Hh * 0.52, ad[0], ad[4], ad[5]); q(leg + Hh * 0.1, W * 0.8, Hh * 0.19, ad[1], 'way', '');
    ctx.feat({ k: 'arch', id: 'ow:' + ctx.ID.toLowerCase() + ':ad:' + (nBoard++), x: mx(ctx, sx), z: mz(ctx, sy), rot: FACE[dir], parts: P });
}
/* THE TELEPHONE POLES: the Tacos pack's wooden power pole (catalogue `power_pole`, its crossarm across the line) every `step` squares down the square
   column `sx` from row `y0` to `y1`, and the wires between them (three thin lines from crossarm to crossarm, sloped with the ground). `skip(sy)` = no pole there. */
function poleLine(ctx, sx, y0, y1, o) {
    o = o || {}; const step = o.step || 8, top = o.top != null ? o.top : 9.9, P = [], pts = [];
    /* `o.ew` (2026-11-22, the Desert Highway): the line runs east to west: `sx` is its ROW, `y0`..`y1` its columns, the crossarms turned across it */
    for (let y = y0; y <= y1 + 1e-6; y += step) { if (o.skip && o.skip(y)) continue; pts.push(o.ew ? [mx(ctx, y), mz(ctx, sx), ctx.hAt(y, sx)] : [mx(ctx, sx), mz(ctx, y), ctx.hAt(sx, y)]); }
    pts.forEach(q => ctx.props.push({ key: 'power_pole', x: q[0], z: q[1], face: o.ew ? 90 : 0 }));
    const rx = o.ew ? (pts[0][0] + pts[pts.length - 1][0]) / 2 : pts[0][0], rz = o.ew ? pts[0][1] : (pts[0][1] + pts[pts.length - 1][1]) / 2, R3 = v => Math.round(v * 1000) / 1000;
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], L = o.ew ? b[0] - a[0] : b[1] - a[1], up = b[2] >= a[2], rise = Math.abs(b[2] - a[2]), mid = (o.ew ? (a[0] + b[0]) / 2 - rx : (a[1] + b[1]) / 2 - rz);
        for (const dx of [-1.0, 0, 1.0]) P.push(Object.assign({ s: 'box', p: [dx, R3(Math.min(a[2], b[2]) + top), R3(mid)], ry: up ? 0 : 180, size: [0.05, 0.05, R3(L)], tint: 0x16161a }, rise > 0.01 ? { shear: [R3(rise), R3(L)] } : null)); }
    /* (an east to west line is the same row turned a quarter: its own +z lies along the room's +x) */
    ctx.feat({ k: 'arch', id: 'ow:' + ctx.ID.toLowerCase() + ':wires:' + (o.ew ? 'ew' : '') + Math.round(sx * 10), x: ctx.r2(rx), z: ctx.r2(rz), rot: o.ew ? 90 : 0, y: 0, parts: P });
}
/* A MILE MARKER: the small green plate on a post at the road's edge, read from both ways. (sx, sy) squares; `o.y` = its foot (on a deck's parapet). */
let nMile = 0;
function mileMarker(ctx, sx, sy, n, o) {
    o = o || {}; const P = [{ s: 'box', p: [0, 0, 0], size: [0.08, 1.9, 0.08], key: STEEL, tint: 0x8a8e94 }, { s: 'box', p: [0, 1.0, 0], size: [0.5, 1.0, 0.05], tint: 0x0b5c3a }];
    for (const f of [0, 180]) { const z = f ? -0.035 : 0.035;
        P.push({ s: 'quad', p: [0, 1.62, z], ry: f, size: [0.44, 0.26], key: 'txt:MILE|#ffffff|#0b5c3a|1.7||way', uv: 'fit', kind: 'wall', glow: 0.2 },
               { s: 'quad', p: [0, 1.06, z], ry: f, size: [0.44, 0.52], key: 'txt:' + n + '|#ffffff|#0b5c3a|0.85||way', uv: 'fit', kind: 'wall', glow: 0.2 }); }
    ctx.feat(Object.assign({ k: 'arch', id: 'ow:' + ctx.ID.toLowerCase() + ':mile:' + (nMile++), x: mx(ctx, sx), z: mz(ctx, sy), rot: o.rot || 0, parts: P }, o.y != null ? { y: o.y } : null));   // `o.rot: 90` = beside an east to west road
}
module.exports = { U, STEEL, WD, WD2, FLR, PLAS, CONC, ROT, sq, mx, mz, gantry, billboard, cityBoard, poleLine, mileMarker, building, put, at };
