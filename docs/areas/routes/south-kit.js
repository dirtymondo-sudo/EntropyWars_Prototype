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
    ctx.feat({ k: 'arch', id: 'ow:' + ctx.ID.toLowerCase() + ':sign:' + (nGantry++), x: mx(ctx, sx), z: mz(ctx, sy), rot: FACE[dir], parts: P });
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
module.exports = { U, STEEL, WD, WD2, FLR, PLAS, CONC, ROT, sq, mx, mz, gantry, billboard, building, put, at };
