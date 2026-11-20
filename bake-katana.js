/* bake-katana.js — KATANA ISLAND ON PLOTS (2026-11-20, world polish thread 21). `node bake-katana.js [--dry-run]`
   mondo 11-20: "volcano island is gonna be remade to Katana Island, which will be like feudal Japan ... with Katana Bay as one of the districts";
   "a love letter to anime and Japan"; "a shoreline and a village and woods and a jungle and a volcano and a whole Japanese city"; 25 to 30 plots.
   Writes ONE room into data.js between the KATANA-BEGIN / KATANA-END markers from docs/areas/katana/layout.js (29 plots, six districts, their
   levels, every way as corner squares on the battle grid, the ledges) and the district files docs/areas/katana/districts/<letter>.js.
   THE PILOT (this first build): the room is `site_prebuilt_bermuda_katana`, NOT joined to the world yet. The Volcano Island
   (`site_prebuilt_bermuda_ow_volcano`, bake-beach.js) stands as it was until the whole island is built and mondo says swap. Only KATANA BAY
   (districts/B.js) is built; the other five districts are their shaped ground, their ways painted and a few trees, so the bay has its backdrop.
   THE FRAME: the island's own squares (ix 0..83 east, iy 0..83 south, layout.js) stand one plot in: room square = island square + 12; the room
   is 9 x 9 plots = 108 x 108 squares of 3.5 m. 1 level = 1.75 m.
   THE HEIGHTS: Katana Bay is laid square by square by its file (whole levels, stone quays, piers, the head's rock). Everywhere else the plots'
   levels are blended plot middle to plot middle (the city's way) with the volcano's cone on top; a district that gets built takes its squares
   over the same way the bay did (ctx.set). The sea floor falls from the shore.
   A DISTRICT FILE exports build(ctx). ctx: C, sq helpers gx gz mx mz (ISLAND squares), set(x0, y0, x1, y1, kind, level) ground, stairs(...),
   building(id, [x0, y0, x1, y1, front], h, opts, parts) (a walk-in: hollow texbuilding + its drawn look; x1 / y1 are one past the last square),
   look(id, ix, iy, rot, parts, y) a drawn thing, P(key, ix, iy, opts) a blocker on a square's middle, dec(key, ix, iy, opts) decor off the
   middle, afloat(key, ix, iy, opts), put(B, key, lx, lz, opts) a prop inside a building, tree(kind, ix, iy, h), sheet() and the sheets, rnd.
   Not a game file, never uploaded. Notes: docs/notes/areas-complexes.md "KATANA ISLAND". */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const I = require('./docs/areas/katana/layout.js');
const ROOM = 'site_prebuilt_bermuda_katana';
const C = 3.5, N = 12, OFF = 12, COLS = 9, ROWS = 9, W = COLS * N, H = ROWS * N, HW = W * C / 2, HD = H * C / 2, LV = 1.75, SEA_BED = -3.5;
const r2 = v => Math.round(v * 100) / 100, J = o => JSON.stringify(o);
/* ISLAND squares -> the room's metres */
const gx = ix => r2(-HW + (ix + OFF) * C), gz = iy => r2(-HD + (iy + OFF) * C), mx = ix => gx(ix + 0.5), mz = iy => gz(iy + 0.5);
const inr = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
let seed = 2111; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── the ground: one kind + one height a ROOM square. kinds: w water, s sand, g ground (blended), q quay stone, p planks (a pier), r rock, v the volcano, l lava ── */
const kind = [], hgt = new Float32Array(W * H), hard = new Uint8Array(W * H), paintKey = [];
for (let y = 0; y < H; y++) { kind.push([]); paintKey.push([]); for (let x = 0; x < W; x++) { kind[y].push('w'); paintKey[y].push(null); } }
const iK = (ix, iy) => (ix < 0 || iy < 0 || ix >= I.W || iy >= I.H) ? 'sea' : I.KIND[iy][ix];
/* the blended level of an island square: the plots' levels, plot middle to plot middle; a plot that is sea counts as its land neighbours */
function blend(ix, iy) { const fx = (ix + 0.5) / N - 0.5, fy = (iy + 0.5) / N - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sm = t => t * t * (3 - 2 * t); let a = 0, n = 0;
    [[0, 0, (1 - sm(tx)) * (1 - sm(ty))], [1, 0, sm(tx) * (1 - sm(ty))], [0, 1, (1 - sm(tx)) * sm(ty)], [1, 1, sm(tx) * sm(ty)]].forEach(([dx, dy, wt]) => { const p = I.plot[(x0 + dx) + ':' + (y0 + dy)]; if (p && p.d === 'V' && wt > 0) { a += p.level * wt; n += wt; } });
    const own = I.plotAt(ix, iy); return n > 0 ? a / n : own.level; }
const CRATER = [41.5, 17.5];
for (let iy = 0; iy < I.H; iy++) for (let ix = 0; ix < I.W; ix++) { const k = iK(ix, iy), p = I.plotAt(ix, iy), X = ix + OFF, Y = iy + OFF, o = Y * W + X; if (k === 'sea' || !p) continue;
    if (p.d === 'B') { kind[Y][X] = k === 'sand' ? 's' : 'q'; hgt[o] = k === 'sand' ? 0.4 : p.level * LV; hard[o] = k === 'sand' ? 0 : 1; continue; }
    /* THE TERRACES (the build after the pilot): every plot outside the volcano is level ground at its own level, with a rock face where it meets another
       level (any such face is a drop you walk off). The volcano's five plots stay rolling ground: the plots' levels blended, the cone on top. */
    if (p.d !== 'V') { const sand = k === 'sand'; kind[Y][X] = sand ? 's' : 'g'; hgt[o] = sand ? 0.4 : p.level * LV; hard[o] = sand ? 0 : 1; continue; }
    let h = blend(ix, iy) * LV, kk = 'g'; const r = Math.hypot(ix + 0.5 - CRATER[0], iy + 0.5 - CRATER[1]);
    if (p.d === 'V' || r < 15) { const cone = r < 2.6 ? 40 : r < 4 ? 45.5 : 45.5 - (r - 4) * 3.0;   /* THE CONE: the rim 45.5 m (26 levels: raised 11-20 from the plan's 18, it read too low from the bay), the lava inside 40 m, 3 m of fall a square */ if (cone > h || r < 4) { h = cone; kk = r < 2.6 ? 'l' : 'v'; } else if (p.d === 'V') kk = 'v'; }
    if (k === 'sand') { kk = 's'; h = 0.4; }
    kind[Y][X] = kk; hgt[o] = h; }
/* the ways outside the bay: dirt, for now (each district lays its own when it is built) */
I.WAYS.forEach(w => I.waySquares(w).forEach(q => { const p = I.plotAt(q[0], q[1]); if (p && p.d !== 'B' && iK(q[0], q[1]) !== 'sea') paintKey[q[1] + OFF][q[0] + OFF] = p.d === 'C' ? 'cobblestone' : p.d === 'V' ? 'scorched' : 'dirt'; }));

/* ── the lists the room is written from ── */
const F = [], ARCH = [], props = [], npc = [], taken = new Set(), errs = [], count = {};
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), PLS = U('PlasterWallStucco2a'), TILE = U('MetalRoofTiles1a'), BEAM = U('WoodBeams1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)], roof: true }, key, tint, o),
        shell(w, h, d, key, tint, door, uv, gain) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? (gain ? { uv, gain } : { uv }) : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        /* THE CURVED ROOF, MADE WITH MATH (mondo 11-20: "try to make the roofs yourself with math"): a Japanese roof's sweep in flat pieces. From the eave up:
           a wide, shallow HIP skirt (the low sweep and the deep eaves), then a steeper roof on a smaller foot standing exactly on the skirt's own slope
           (so the two meet in one line and the pitch grows toward the ridge), a ridge beam, and four lifted corner tips. `top` = 'gable' (the hip-and-gable
           roof of a house or hall) or 'hip' (a store, a gate) or 'pyramid' (a tower's cap). w x d = the walls' foot, y = the wall head. */
        jroof(y, w, d, o) { o = o || {}; const ov = o.over != null ? o.over : 1.3, key = o.key || TILE, tint = o.tint != null ? o.tint : 0x5a6676, top = o.top || 'gable', X = { uv: [1.6, 1.6] };
            const W1 = w + 2 * ov, D1 = d + 2 * ov, r1 = o.skirt != null ? o.skirt : 0.2 * Math.min(W1, D1) / 2 + 0.25;                 // the skirt: about 11 degrees
            const dz = top === 'pyramid' ? Math.min(w, d) * 0.56 : d * 0.64, dxx = top === 'pyramid' ? dz : w * (top === 'gable' ? 0.92 : 0.7), y2 = r1 * (1 - dz / D1);   // where the upper roof's foot meets the skirt's slope
            const r2h = o.rise != null ? o.rise : dz / 2 * 0.95 + 0.3;                                                                    // the upper roof: about 43 degrees
            add({ s: 'box', p: [0, r2(y - 0.06), 0], size: [r2(W1), 0.06, r2(D1)], sides: false, top: false, under: true, roof: true }, WD2, 0x3a2a1e);   // the soffit: dark boards under the eaves
            add({ s: 'box', p: [0, r2(y - 0.16), 0], size: [r2(W1 + 0.1), 0.16, r2(D1 + 0.1)], top: false, roof: true }, WD2, 0x2e2420);                    // the eave's edge board
            A.roof('hip', 0, y, 0, W1, r1, D1, key, tint, X);
            A.roof(top, 0, y + y2 - 0.02, 0, dxx, r2h, dz, key, tint, Object.assign({ keyEnd: PLS, tintEnd: 0xe8e2d2 }, X));
            if (top !== 'pyramid') { const rl = top === 'gable' ? dxx + 0.5 : Math.max(0.6, dxx - dz + 0.5); A.box(0, y + y2 + r2h - 0.1, 0, rl, 0.28, 0.34, key, 0x2a3038, { roof: true });       // the ridge
                for (const s of [-1, 1]) A.box(s * rl / 2, y + y2 + r2h - 0.1, 0, 0.3, 0.52, 0.44, key, 0x2a3038, { roof: true }); }                                                               // its two end tiles
            else A.cyl(0, y + y2 + r2h - 0.05, 0, 0.16, 0.9, WD2, 0x2a3038, { r2: 0.04, seg: 6, roof: true });                                                                                    // a finial
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) add({ s: 'box', p: [r2(sx * (W1 / 2 - 0.42)), r2(y + 0.02), r2(sz * (D1 / 2 - 0.42))], size: [0.84, 0.22, 0.84], roof: true }, key, tint);   // the lifted corner tips
            return y + y2 + r2h; },
        /* a timber frame over plaster: dark posts every 1.75 m and at the corners, a sill and a head beam, on all four sides */
        timber(w, h, d, tint) { const t = tint != null ? tint : 0x3a2a1e;
            for (const sz of [-1, 1]) { A.box(0, 0, sz * (d / 2 + 0.06), w + 0.24, 0.22, 0.1, WD2, t); A.box(0, h - 0.24, sz * (d / 2 + 0.06), w + 0.24, 0.24, 0.1, WD2, t);
                P.push({ s: 'box', p: [r2(-w / 2), 0, r2(sz * (d / 2 + 0.06))], size: [0.2, r2(h), 0.1], key: WD2, tint: t, n: Math.round(w / 1.75) + 1, step: [r2(w / Math.round(w / 1.75)), 0, 0] }); }
            for (const sx of [-1, 1]) { A.box(sx * (w / 2 + 0.06), 0, 0, 0.1, 0.22, d + 0.24, WD2, t); A.box(sx * (w / 2 + 0.06), h - 0.24, 0, 0.1, 0.24, d + 0.24, WD2, t);
                P.push({ s: 'box', p: [r2(sx * (w / 2 + 0.06)), 0, r2(-d / 2)], size: [0.1, r2(h), 0.2], key: WD2, tint: t, n: Math.round(d / 1.75) + 1, step: [0, 0, r2(d / Math.round(d / 1.75))] }); } },
        /* a paper screen on a wall: a pale lit panel with a dark lattice (lx along the front, z = the wall's face) */
        screen(lx, y, z, w, h, ry) { const q = { s: 'quad', p: [r2(lx), r2(y), r2(z)], size: [r2(w), r2(h)], tint: 0xf4ecd6, glow: 0.35 }; if (ry) q.ry = ry; P.push(q); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
const ctx = { C, LV, N, r2, rnd, gx, gz, mx, mz, I, U, WD, WD2, SHG, FLR, PLS, TILE, BEAM, sheet, errs, props, F, npc,
    /* ground: island squares x0..x1, y0..y1 INCLUSIVE; kind 'q' quay, 'p' planks, 'r' rock, 's' sand, 'w' water; level in levels (or metres with { m: true }) */
    set(x0, y0, x1, y1, k, level, o) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const X = x + OFF, Y = y + OFF; if (!inr(X, Y)) continue; if (o && o.dry && kind[Y][X] === 'w') continue; kind[Y][X] = k; hgt[Y * W + X] = (o && o.m) ? level : level * LV; hard[Y * W + X] = k === 's' || k === 'w' ? 0 : 1; if (o && o.paint) paintKey[Y][X] = o.paint; } },
    kindAt: (ix, iy) => kind[iy + OFF][ix + OFF], hAt: (ix, iy) => hgt[(iy + OFF) * W + ix + OFF],
    /* a stair: island squares x0..x1, y0..y1 inclusive, climbing `dir` ('N' 'S' 'E' 'W') from level a to level b (levels, or metres with m: true). The squares under it are set to the low level. */
    stairs(id, x0, y0, x1, y1, dir, a, b, o) { o = o || {}; const lo = o.m ? a : a * LV, hi = o.m ? b : b * LV, ew = dir === 'E' || dir === 'W', cxm = (gx(x0) + gx(x1 + 1)) / 2, czm = (gz(y0) + gz(y1 + 1)) / 2;
        const e0 = dir === 'E' ? gx(x0) : dir === 'W' ? gx(x1 + 1) : dir === 'S' ? gz(y0) : gz(y1 + 1), e1 = dir === 'E' ? gx(x1 + 1) : dir === 'W' ? gx(x0) : dir === 'S' ? gz(y1 + 1) : gz(y0);
        ctx.set(x0, y0, x1, y1, o.kind || 'q', lo, { m: true, paint: o.paint });
        F.push({ k: 'ramp', id: 'kat:stair:' + id, absY: true, x0: r2(ew ? e0 : cxm), z0: r2(ew ? czm : e0), x1: r2(ew ? e1 : cxm), z1: r2(ew ? czm : e1), w: r2((ew ? y1 - y0 + 1 : x1 - x0 + 1) * C), h0: r2(lo), h1: r2(hi), stairs: true, model: o.model || 'stone', edge: 0.01 });
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) taken.add(x + ':' + y); },
    /* a timber pier over the water: island squares inclusive, its deck at the quay's level on piles (the water under it stays water) */
    pier(id, x0, y0, x1, y1, level) { const ew = (x1 - x0) >= (y1 - y0), y = r2((level == null ? 1 : level) * LV), cxm = (gx(x0) + gx(x1 + 1)) / 2, czm = (gz(y0) + gz(y1 + 1)) / 2;
        F.push({ k: 'deck', id: 'kat:pier:' + id, absY: true, x0: r2(ew ? gx(x0) : cxm), z0: r2(ew ? czm : gz(y0)), x1: r2(ew ? gx(x1 + 1) : cxm), z1: r2(ew ? czm : gz(y1 + 1)), w: r2((ew ? y1 - y0 + 1 : x1 - x0 + 1) * C), y, rails: false });
        const a = sheet(); for (let yy = y0; yy <= y1 + 1; yy++) for (let xx = x0; xx <= x1 + 1; xx++) { if ((xx !== x0 && xx !== x1 + 1) && (yy !== y0 && yy !== y1 + 1)) continue; if (ew ? (yy !== y0 && yy !== y1 + 1) : (xx !== x0 && xx !== x1 + 1)) continue;
            a.cyl((xx - x0) * C + (xx === x0 ? 0.25 : -0.25), -3.2, (yy - y0) * C + (yy === y0 ? 0.25 : -0.25), 0.2, y + 3.75, WD2, 0x4a3828, { seg: 8 }); }
        ARCH.push({ k: 'arch', id: 'kat:pier:' + id + ':look', x: gx(x0), z: gz(y0), y: 0, rot: 0, parts: a.P }); },
    building(id, q, h, o, parts) { const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
        const row = Object.assign({ k: 'texbuilding', id: 'kat:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: PLS, floorIn: FLR }, o || {});
        F.push(row); for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { if (taken.has(x + ':' + y)) errs.push(id + ': square taken ' + x + ',' + y); taken.add(x + ':' + y); }
        const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
        ARCH.push({ k: 'arch', id: 'kat:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); count.buildings = (count.buildings || 0) + 1;
        return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot }; },
    put(B, key, lx, lz, o) { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); },
    /* a drawn thing at an island square's corner point (ix, iy may be fractions); y = its foot in metres (0 = the sea) or leave out to stand on the ground */
    look(id, ix, iy, rot, fn, y) { const a = sheet(); fn(a); const row = { k: 'arch', id: 'kat:' + id + ':look', x: gx(ix), z: gz(iy), rot: rot || 0, parts: a.P }; if (y != null) row.y = y; ARCH.push(row); },
    P(key, ix, iy, o) { if (taken.has(ix + ':' + iy)) errs.push(key + ': square taken ' + ix + ',' + iy); if (kind[iy + OFF][ix + OFF] === 'w') errs.push(key + ' stands in the water at ' + ix + ',' + iy); taken.add(ix + ':' + iy); props.push(Object.assign({ key, x: mx(ix), z: mz(iy) }, o || {})); },
    dec(key, ix, iy, o) { props.push(Object.assign({ key, x: r2(mx(ix) + (rnd() - 0.5) * 1.6), z: r2(mz(iy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); },
    at(key, fx, fy, o) { props.push(Object.assign({ key, x: gx(fx), z: gz(fy) }, o || {})); },   // decor at an exact point (fractions of squares)
    afloat(key, fx, fy, o) { props.push(Object.assign({ key, x: gx(fx), z: gz(fy), y: 0.32 }, o || {})); },
    tree(kindName, ix, iy, h, o) { if (taken.has(ix + ':' + iy)) return false; const k = kind[iy + OFF][ix + OFF]; if (k !== 'g' && k !== 's') return false; taken.add(ix + ':' + iy); F.push(Object.assign({ k: 'tree', x: r2(mx(ix) + (rnd() - 0.5)), z: r2(mz(iy) + (rnd() - 0.5)), kind: kindName, h: r2(h), r: 0.6 }, o || {})); return true; },
    free: (ix, iy) => !taken.has(ix + ':' + iy), take: (ix, iy) => taken.add(ix + ':' + iy), feat: row => F.push(row) };
/* THE HOUSE every district builds with: plaster over a dark timber frame, paper screens on the front, the curved roof. o: wall, wallTint, plain (no frame, no
   screens), roof (jroof's options). Returns the ridge's height. mondo will likely make Meshy roofs later: this is the one place to swap. */
const DARK = 0x3a2a1e, PLASTER = 0xf0ebe0;
ctx.DARK = DARK; ctx.PLASTER = PLASTER;
ctx.house = (a, w, h, d, door, o) => { o = o || {};
    a.shell(w, h, d, o.wall || PLS, o.wallTint != null ? o.wallTint : PLASTER, door, [1.75, 1.75], o.plain && o.wall ? 1.2 : 2.1); if (!o.plain) a.timber(w, h, d, DARK); a.frame(door, d, WD2, DARK);
    if (!o.plain) { const n = Math.round(w / 1.75), bw = w / n; for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + 0.5) * bw; if (Math.abs(lx - door.lx) < bw * 0.6) continue; a.P.push({ s: 'quad', p: [r2(lx), 0.95, r2(d / 2 + 0.075)], size: [r2(bw - 0.5), 1.25], key: PLS, tint: 0xfff6dc, glow: 0.3, gain: 2.4 });
        a.box(lx, 0.95, d / 2 + 0.08, 0.05, 1.25, 0.03, WD2, DARK); a.box(lx, 1.55, d / 2 + 0.08, bw - 0.5, 0.05, 0.03, WD2, DARK); } }
    if (o.storeys > 1) for (let k = 1; k < o.storeys; k++) a.box(0, h * k / o.storeys, d / 2 + 0.07, w + 0.24, 0.22, 0.1, WD2, DARK);
    return o.noRoof ? h : a.jroof(h, w, d, o.roof || {}); };
/* A TOWER OF ROOFS (a pagoda, a castle keep): `tiers` storeys, each a plaster box a little smaller than the one under it with its own skirt roof, the top one
   a full roof. w x d = the foot, h0 = the first storey's height, hs = each further storey's. Parts frame as a building's. Returns the top. */
ctx.tiers = (a, w, d, tiers, h0, hs, o) => { o = o || {}; let y = 0, ww = w, dd = d;
    for (let k = 0; k < tiers; k++) { const hh = k === 0 ? h0 : hs, last = k === tiers - 1;
        if (k > 0) { a.box(0, y, 0, ww, hh, dd, PLS, o.wallTint != null ? o.wallTint : PLASTER, { top: false, uv: [1.75, 1.75], gain: 2.1 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * ww / 2, y, sz * dd / 2, 0.2, hh, 0.2, WD2, o.post != null ? o.post : DARK); }
        y += hh; const sub = sheet(); const top = sub.jroof(0, ww, dd, last ? Object.assign({ top: o.top || 'gable', over: o.over || 1.2 }, o.roof || {}) : Object.assign({ top: 'hip', skirt: 0.75, rise: 0.45, over: o.over || 1.6 }, o.roof || {}));
        sub.P.forEach(q => { q.p = [q.p[0], r2(q.p[1] + y), q.p[2]]; a.P.push(q); }); if (last) return y + top; ww *= o.shrink || 0.78; dd *= o.shrink || 0.78; }
    return y; };
/* the ways' squares are kept clear of trees and blockers */
const WAYSQ = new Set(); I.WAYS.forEach(w => I.waySquares(w).forEach(q => WAYSQ.add(q[0] + ':' + q[1])));

/* ── the districts ── */
const DIST = {}; ['B', 'C', 'L', 'W', 'J', 'V'].forEach(d => { const f = path.join(REPO, 'docs/areas/katana/districts', d + '.js'); if (fs.existsSync(f)) DIST[d] = require(f); });
ctx.WAYSQ = WAYSQ; ctx.onWay = (ix, iy) => WAYSQ.has(ix + ':' + iy);
/* helpers every district uses: `open(ix, iy)` = level earth nobody stands on and no way crosses; `sow(x0, y0, x1, y1, chance, fn)` = fn(ix, iy, v) on
   each open square of a box that the dice pick (one stream, in reading order); `B2(id, q, ...)` = a building only on open earth (else the bake stops) */
ctx.open = (ix, iy) => ix >= 0 && iy >= 0 && ix < I.W && iy < I.H && kind[iy + OFF][ix + OFF] === 'g' && !taken.has(ix + ':' + iy) && !WAYSQ.has(ix + ':' + iy);
ctx.sow = (x0, y0, x1, y1, chance, fn) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = rnd(); if (v < chance && ctx.open(x, y)) fn(x, y, v / chance); } };
ctx.thatch = (a, w, h, d, door, tint) => { a.shell(w, h, d, WD, tint != null ? tint : 0x9a7a52, door, [1.75, 1.75]); a.frame(door, d, WD2, DARK);
    a.roof('gable', 0, h, 0, w + 1.6, Math.max(1.6, d * 0.42), d + 1.6, SHG, 0xd2b060, { gain: 1.7, uv: [1.2, 1.2] }); a.box(0, h - 0.16, 0, w + 1.7, 0.16, d + 1.7, SHG, 0xb89448, { top: false, roof: true, gain: 1.6 }); };
const building0 = ctx.building; ctx.building = (id, q, h, o, parts) => { for (let y = q[1]; y < q[3]; y++) for (let x = q[0]; x < q[2]; x++) { if (kind[y + OFF][x + OFF] === 'w' || (kind[y + OFF][x + OFF] === 's' && !(o && o.onSand))) errs.push(id + ': not on firm ground at ' + x + ',' + y); if (WAYSQ.has(x + ':' + y)) errs.push(id + ': stands on a way at ' + x + ',' + y); } if (o && o.onSand) { o = Object.assign({}, o); delete o.onSand; } return building0(id, q, h, o, parts); };
Object.keys(DIST).forEach(d => DIST[d].build(ctx));

/* ── THE WAYS' STAIRS: wherever a way (layout.js) steps from one height to another, a real flight stands on the LOW side, as wide as the way, long enough
   for the rise (about 2.4 m of rise a square), unless a district already laid one there. A way too short before a turn for its flight stops the bake. ── */
{ const under = (ix, iy) => { const px = mx(ix), pz = mz(iy); return F.some(f => (f.k === 'ramp' || f.k === 'deck') && (f.z0 === f.z1 ? (px > Math.min(f.x0, f.x1) && px < Math.max(f.x0, f.x1) && Math.abs(pz - f.z0) < f.w / 2) : (pz > Math.min(f.z0, f.z1) && pz < Math.max(f.z0, f.z1) && Math.abs(px - f.x0) < f.w / 2))); };
  const H = (ix, iy) => hgt[(iy + OFF) * W + ix + OFF], dirOf = (dx, dy) => dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N'; let made = 0;
  I.WAYS.forEach((w, wi) => { const pts = w[2], wd = w[1], lo = -Math.floor((wd - 1) / 2), hi = Math.ceil((wd - 1) / 2), line = [];
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], sx = Math.sign(b[0] - a[0]), sy = Math.sign(b[1] - a[1]); let x = a[0], y = a[1]; if (i === 1) line.push([x, y]); while (x !== b[0] || y !== b[1]) { x += sx; y += sy; line.push([x, y]); } }
      for (let i = 0; i + 1 < line.length; i++) { const a = line[i], b = line[i + 1], ha = H(a[0], a[1]), hb = H(b[0], b[1]), dh = Math.abs(ha - hb); if (dh <= 0.6) continue;
          const pa = I.plotAt(a[0], a[1]), pb = I.plotAt(b[0], b[1]); if (!pa || !pb || (pa.d === 'V' && pb.d === 'V')) continue; if (under(a[0], a[1]) || under(b[0], b[1])) continue;
          const up = hb > ha, low = up ? a : b, step = up ? [a[0] - b[0], a[1] - b[1]] : [b[0] - a[0], b[1] - a[1]], hLow = Math.min(ha, hb), hHigh = Math.max(ha, hb);   // `step` = one square further into the low side
          let n = Math.max(1, Math.ceil(dh / 2.4)), got = 1; while (got < n) { const q = [low[0] + step[0] * got, low[1] + step[1] * got], j = up ? i - got : i + 1 + got, on = line[j] && line[j][0] === q[0] && line[j][1] === q[1]; if (!on || Math.abs(H(q[0], q[1]) - hLow) > 0.05 || under(q[0], q[1])) break; got++; }
          if (dh / (got * C) > 1.01) { errs.push(w[0] + ': no room for a flight of ' + r2(dh) + ' m at ' + a + ' -> ' + b + ' (' + got + ' of ' + n + ' squares)'); continue; }
          const far = [low[0] + step[0] * (got - 1), low[1] + step[1] * (got - 1)], ew = step[0] !== 0, x0 = Math.min(low[0], far[0]) + (ew ? 0 : lo), x1 = Math.max(low[0], far[0]) + (ew ? 0 : hi), y0 = Math.min(low[1], far[1]) + (ew ? lo : 0), y1 = Math.max(low[1], far[1]) + (ew ? hi : 0);
          const plow = I.plotAt(low[0], low[1]), city = plow.d === 'C' || plow.d === 'B';
          ctx.stairs('way' + wi + '_' + i, x0, y0, x1, y1, dirOf(-step[0], -step[1]), hLow, hHigh, { m: true, kind: kind[low[1] + OFF][low[0] + OFF] === 's' ? 'g' : kind[low[1] + OFF][low[0] + OFF], paint: city ? 'cobblestone' : 'dirt', model: city ? 'stone' : 'timber' }); made++; } });
  count.wayStairs = made; }

/* ── the backdrop: the districts not built yet wear a few trees, so the bay is not seen against bare hills (each is replaced when its district is built) ── */
{ const NOT_BUILT = {}; ['W', 'J', 'L', 'C', 'V'].forEach(d => { if (!DIST[d]) NOT_BUILT[d] = 1; }); let cherry = 0, palm = 0, pine = 0;
  for (let iy = 0; iy < I.H; iy++) for (let ix = 0; ix < I.W; ix++) { const p = I.plotAt(ix, iy); if (!p || !NOT_BUILT[p.d] || WAYSQ.has(ix + ':' + iy)) { if (p && NOT_BUILT[p.d]) rnd(); continue; } const v = rnd(), nm = p.name;
      if (p.d === 'W' && nm !== 'The Bamboo Wood' && v < 0.2) { if (ctx.tree(['cherry', 'cherry_2', 'cherry_3'][Math.floor(rnd() * 3)], ix, iy, 5.5 + rnd() * 2.5)) cherry++; }
      else if (p.d === 'W' && v < 0.16) { if (ctx.tree('tree_55', ix, iy, 6 + rnd() * 3)) pine++; }
      else if (p.d === 'J' && v < 0.16) { if (ctx.tree('palm', ix, iy, 4.6 + rnd() * 2.4)) palm++; }
      else if (p.d === 'L' && v < 0.035) { if (ctx.tree(rnd() < 0.5 ? 'cherry_2' : 'tree_52', ix, iy, 5 + rnd() * 2)) cherry++; }
      else if (p.d === 'C' && v < 0.03) { if (ctx.tree(rnd() < 0.6 ? 'tree_56' : 'cherry', ix, iy, 6 + rnd() * 2)) pine++; } }
  Object.assign(count, { cherry, palm, pine }); }

/* ── the sea floor, the slopes, the paint ── */
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
{ const d = new Int16Array(W * H).fill(999), q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (kind[y][x] !== 'w') { d[y * W + x] = 0; q.push(x, y); }
  for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x] + 1; for (const [dx, dy] of N8) { const X = x + dx, Y = y + dy; if (inr(X, Y) && d[Y * W + X] > v) { d[Y * W + X] = v; q.push(X, Y); } } }
  /* sand rises from the water's edge (0.4 m, then 0.3 m a square, 1.2 m at most); water falls from the shore */
  const dw = new Int16Array(W * H).fill(999), q2 = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (kind[y][x] === 'w') { dw[y * W + x] = 0; q2.push(x, y); }
  for (let i = 0; i < q2.length; i += 2) { const x = q2[i], y = q2[i + 1], v = dw[y * W + x] + 1; for (const [dx, dy] of N8) { const X = x + dx, Y = y + dy; if (inr(X, Y) && dw[Y * W + X] > v) { dw[Y * W + X] = v; q2.push(X, Y); } } }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = y * W + x; if (kind[y][x] === 'w') hgt[o] = Math.max(SEA_BED, -(0.45 + 0.7 * (d[o] - 1))); else if (kind[y][x] === 's' && !hard[o]) hgt[o] = Math.min(1.2, 0.4 + 0.3 * (dw[o] - 1)); } }
/* a square's four corners: soft ground (sand, blended ground, the cone, the sea floor) takes the mean of the soft squares round the corner, so it rolls;
   hard ground (quay, planks, rock, a district's laid squares) is level, with a wall where it meets another height */
const soft = (x, y) => inr(x, y) && !hard[y * W + x];
const corner = (cx, cy) => { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = cx + dx, Y = cy + dy; if (soft(X, Y)) { s += hgt[Y * W + X]; n++; } } return s / n; };
const slope = Buffer.alloc(W * H * 8);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8, sf = soft(x, y); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round((sf ? corner(x + q[0], y + q[1]) : hgt[y * W + x]) * 100), o + k * 2)); }
const KEY = { q: 'cobblestone', p: 'wood_planks', r: 'rocks_5', v: 'obsidian', l: 'lava' }, PAL = [], paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = kind[y][x]; let key = paintKey[y][x] || KEY[k] || null;
    if (!key && k === 'g') { const p = I.plotAt(x - OFF, y - OFF); key = !p ? 'grass_2' : (p.d === 'W' || p.d === 'J') ? 'grass_dark_fantasy' : p.d === 'C' ? 'dirt' : 'grass_2'; }
    if (!key) continue; let i = PAL.indexOf(key); if (i < 0) { PAL.push(key); i = PAL.length - 1; } paint[y * W + x] = i + 1; }
if (PAL.length > 8) throw new Error('more than 8 paint sheets: ' + PAL.join(' '));

/* ── the checks: nothing on a taken square (the helpers), every place a district names is reached on foot from the pier ── */
{ const from = DIST.B.from, st = [[from[0] + OFF, from[1] + OFF]], seen = new Uint8Array(W * H); seen[st[0][1] * W + st[0][0]] = 1;
  const ramp = new Map(); F.forEach(f0 => { if (f0.k !== 'ramp' && f0.k !== 'deck') return; const f = f0.k === 'deck' ? Object.assign({ h0: f0.y, h1: f0.y }, f0) : f0; const xa = Math.min(f.x0, f.x1), xb = Math.max(f.x0, f.x1), za = Math.min(f.z0, f.z1), zb = Math.max(f.z0, f.z1), ew = f.z0 === f.z1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const px = -HW + (x + 0.5) * C, pz = -HD + (y + 0.5) * C; if (ew ? (px > xa && px < xb && Math.abs(pz - f.z0) < f.w / 2) : (pz > za && pz < zb && Math.abs(px - f.x0) < f.w / 2)) ramp.set(y * W + x, f); } });
  const hOf = (k, toward) => { const f = ramp.get(k); if (!f) return [hgt[k], hgt[k]]; return [f.h0, f.h1]; };
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of N8.slice(0, 4)) { const X = x + dx, Y = y + dy; if (!inr(X, Y) || seen[Y * W + X]) continue; const a = y * W + x, b = Y * W + X; if (hgt[b] <= -1.15 && !ramp.has(b)) continue;
      const A2 = hOf(a), B2 = hOf(b), sfb = !hard[a] && !hard[b], gap = Math.min(Math.abs(A2[0] - B2[0]), Math.abs(A2[0] - B2[1]), Math.abs(A2[1] - B2[0]), Math.abs(A2[1] - B2[1]));
      if (sfb ? Math.abs(hgt[a] - hgt[b]) / C > 1.0 : gap > 0.62) continue; seen[b] = 1; st.push([X, Y]); } }
  Object.keys(DIST).forEach(d => (DIST[d].reach || []).forEach(q => { if (!seen[(q[1] + OFF) * W + q[0] + OFF]) errs.push('not reached on foot from the pier: ' + q[2] + ' (' + q[0] + ',' + q[1] + ')'); }));
  ([]).forEach(q => { if (!seen[(q[1] + OFF) * W + q[0] + OFF]) errs.push('not reached on foot from the pier: ' + q[2] + ' (' + q[0] + ',' + q[1] + ')'); });
  if (process.env.KATANA_DUMP) console.log(kind.map((r, y) => r.map((ch, x) => seen[y * W + x] ? '.' : ch === 'w' ? ' ' : ch).join('')).join('\n')); }
if (errs.length) { console.log(errs.join('\n')); if (!DRY) throw new Error(errs.length + ' problems'); }

/* ── the room ── */
const SP = { x: mx(DIST.B.from[0]), z: mz(DIST.B.from[1]) }, names = I.PLOTS.map(p => ['P' + String(p[0] + 1).padStart(2, '0') + '-' + String(p[1] + 1).padStart(2, '0'), p[4], p[2], p[3]]);
const L = [];
L.push("        /* KATANA-BEGIN — KATANA ISLAND ON PLOTS (2026-11-20, world polish thread 21): written by `node bake-katana.js` from docs/areas/katana/. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. All six districts stand (pass 1); the boat from the Harbour lands at the bay's pier. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'KATANA ISLAND',");
L.push("            sub: 'KATANA BAY · THE CITY · THE VILLAGE · THE WOODS · THE JUNGLE · THE VOLCANO',");
L.push("            kind: 'box', site: 'prebuilt_bermuda', part: 'katana',");
L.push("            /* THE ONE WORLD: Katana Island stands where the Volcano Island stood, one plot wider on every side (9 x 9 at 21,-20; THE SWAP, 2026-11-20) */");
L.push("            world: { hub: 'beach', layer: 'surface', wx: 21, wy: -20 },");
L.push("            shell: hqSeaShell({ w: " + (2 * HW) + ", d: " + (2 * HD) + ", plate: { x: " + SP.x + ", z: " + SP.z + ", y: 4.4 }, sky: Object.assign({}, hqSeaShell().sky, { scenery: 'none', landmarks: [] }) }),");
L.push("            parti: 'An island of old Japan far out at sea: a harbour town round a bay, a castle city on the slope, a village in its paddies, cherry and bamboo woods, a jungle with dinosaurs, and the volcano over all of it.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + COLS + ", nz: " + ROWS + ", districts: " + J(Object.keys(I.DIST).reduce((o, k) => { o[k] = I.DIST[k][0].replace(/\b([A-Z])([A-Z]+)/g, (m, x, y) => x + y.toLowerCase()); return o; }, {})) + ", names: " + J(names) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'desert', cliff: 'rocks_5', path: 'wood_planks',");
L.push("                base: 0, noise: { amp: 0.06, scale: 9 }, crag: false,");
L.push("                sea: { y: 0, key: 'water' },");
L.push("                outer: { m: 60 },");
L.push("                backdrop: false, edges: { world: true, reach: 440 },");
L.push("                /* THE HEIGHTS ARE THE MAP: one level = 1.75 m; the bay's quays and piers, the plots' levels and the volcano are all this grid */");
L.push("                slope: { cells: { res: " + C + ", x0: " + r2(-HW) + ", z0: " + r2(-HD) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + r2(-HW + C / 2) + ", z0: " + r2(-HD + C / 2) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
F.concat(ARCH).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: [],");
L.push("            spawn: { x: " + SP.x + ", z: " + SP.z + ", face: 0 },");
L.push("        },");
L.push("        /* KATANA-END */");
const block = L.join('\n') + '\n';
console.log(ROOM + ': ' + J(Object.assign({ features: F.length + ARCH.length, props: props.length, pal: PAL }, count)));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* KATANA-END */\n', b0 = src.indexOf('        /* KATANA-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        /* BEACH140-BEGIN'); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
