#!/usr/bin/env node
/* bake-desert.js — THE DESERT ON PLOTS (2026-11-15, mondo: "start a thread to start on the desert" · "put the circus in the desert ... i meant
   district not plot" · "okay looks good" on the plot plan, 18:33 UTC). The third area of the world plan after the Woods and Camelot Kingdom:
   8 x 8 plots of 12 x 12 squares (336 m a side), five districts: THE ROAD, THE CIRCUS, WESTERN TOWN, AREA 51, GIZA.
   Reads docs/areas/desert/layout.json (the approved plan: every plot's name + district, and the 96 x 96 square map) and writes the room
   `site_prebuilt_area51_desert` into data.js between DESERT64-BEGIN / DESERT64-END. `node bake-desert.js` writes; `--dry-run` prints the counts.
   Never hand-edit between the markers: edit this tool or the layout and rerun. Notes: docs/notes/areas-complexes.md "THE DESERT ON PLOTS".
   The desert is OPEN ground (no `gen`): rock, fences, buildings and the pyramids are the only walls. Squares are (sx 0..96 west to east,
   sy 0..96 north to south); gx() = a square's west / north line in metres, gc() = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
/* THE HIGHWAY (2026-11-16, mondo: "add a desert highway that connects them together and spreads them out. Full highway with exits and stuff, and
   connected to the roads of disaster city" · "12x12 is fine" · cars: "yes obviously" · "does disaster city not get its own exit too?"):
   the room is 12 x 12 plots now. PLAN = the new layout (docs/plans/desert/make-layout-4.py writes it); OLDP = the first build's 8 x 8 layout.
   The four districts are still AUTHORED in the first build's squares (gx / gc / P / put / building below, the OLD frame) and every row they make is
   MOVED WHOLE with its block at the end (remap). The highway, its exits, signs, cars and the open desert are authored in the NEW frame (nx / nc). */
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/desert/layout.json'), 'utf8'));
const OLDP = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/desert/layout-8x8.json'), 'utf8'));
const C = 3.5, N = 12, G = 8, W = N * G, HALF = W * C / 2, ROOM = 'site_prebuilt_area51_desert';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], f: (r.terrain && r.terrain.features) || [] } : { n: [], l: [], f: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_GIZA = OLDR('site_prebuilt_giza_plateau'), O_GATE = OLDR('site_prebuilt_area51_gate'), O_LINE = OLDR('site_prebuilt_area51_flightline'), O_CARN = OLDR('carnival');
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;
const cell = OLDP.cells.map(r => r.split(''));
const NW = 144, NHALF = NW * 3.5 / 2, nx = c => Math.round((-NHALF + c * 3.5) * 100) / 100, nc = c => nx(c + 0.5), ncell = PLAN.cells.map(r => r.split(''));
const plot = {}; OLDP.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); plot[p.id] = p; });
const F = [], props = [], doors = [], npc = [], marks = [], count = {};
const feat = o => { F.push(o); return o; };
let seed = 51; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const inBase = (x, y) => y > 54 && x < 45;                                   // inside Area 51's fence
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
cell[54][0] = 'f';                                                           // the fence reaches the room's west edge

/* ── THE GROUND: one painted sheet a square (0 = the room's own sand) ── */
const PAL = ['urban:RoadGeneric1a', 'dirt_2', 'urban:ConcreteSlab2a', 'bricks_1', 'wasteland', 'urban:WoodFlooring1a', 'dirt_4'], paint = new Uint8Array(NW * NW);
const paintOf = (ch, x, y) => (ch === 'r' || ch === 'R') ? 1 : ch === 'd' ? 2 : ch === 'c' ? 3 : (ch === 'p' || ch === 's' || /[1-4]/.test(ch)) ? 4 : ch === 'k' ? 5 : ch === 'x' ? 6 : (y > 102 && x < 45 && ch !== 'B') ? 7 : 0;   // (x, y) = the NEW frame's squares; 7 = the base's own dirt inside Area 51's fence
/* lane paint: the highway's centre line, the runway's dashes and threshold bars */
const line = (x0, z0, x1, z1, w, color) => marks.push({ k: 'line', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), w, color });
for (let x = 4; x < 40; x += 3) line(gx(x), gx(78), gx(x + 1.5), gx(78), 0.5, 0xf0f0f0);
for (let i = 0; i < 6; i++) line(gx(2.6), gx(76.4 + i * 0.6), gx(4.2), gx(76.4 + i * 0.6), 0.9, 0xf0f0f0);

/* ── THE ROCK: every run of the plan's `m` is a 5.25 m shelf; its inner squares stand 8.75 m (a mesa's cap). Nothing climbs it. ── */
function rects(test, cb) { const used = new Uint8Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (!test(x, y) || used[y * W + x]) continue;
        let w = 1; while (x + w < W && !used[y * W + x + w] && test(x + w, y)) w++;
        let h = 1; rows: while (y + h < W) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !test(x + i, y + h)) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1; cb(x, y, w, h); } }
const isM = (x, y) => x < 0 || y < 0 || x >= W || y >= W || cell[y][x] === 'm';
const deepM = (x, y) => cell[y][x] === 'm' && isM(x - 1, y) && isM(x + 1, y) && isM(x, y - 1) && isM(x, y + 1);
const slab = (x, y, w, h, hh, edge) => feat({ k: 'plateau', x: r2(gx(x) + w * C / 2), z: r2(gx(y) + h * C / 2), w: w * C, d: h * C, h: hh, edge });
/* (a shelf never runs across two blocks: each block's rock is its own rows, so it moves with its block) */
const blockOf = (x, y) => x >= 48 ? (y >= 48 ? 'G' : 'W') : (y >= 48 ? 'A' : (x >= 12 && y < 36 ? 'C' : 'R'));
for (const b of ['C', 'W', 'A', 'G']) { rects((x, y) => cell[y][x] === 'm' && blockOf(x, y) === b, (x, y, w, h) => { slab(x, y, w, h, 5.25, 0.5); count.rock = (count.rock || 0) + 1; });
    rects((x, y) => deepM(x, y) && blockOf(x, y) === b, (x, y, w, h) => slab(x, y, w, h, 8.75, 0.5)); }
/* THE CANYON: the slot through the rock from the town to the Dig is the plan's dirt squares; a stone arch look over its north mouth is left to the rock itself */

/* ── THE FENCES: chain-link along the plan's `f` squares inside the base (2.6 m, never climbed), a ranch rail round the corral and the pens ── */
function runs(test, cb) {
    for (let y = 0; y < W; y++) { let x = 0; while (x < W) { if (!test(x, y)) { x++; continue; } let e = x; while (e + 1 < W && test(e + 1, y)) e++; if (e > x) cb(x, y, e, y); x = e + 1; } }
    for (let x = 0; x < W; x++) { let y = 0; while (y < W) { if (!test(x, y)) { y++; continue; } let e = y; while (e + 1 < W && test(x, e + 1)) e++; if (e > y) cb(x, y, x, e); y = e + 1; } } }
const CHAIN = 'urban:MetalFenceChainlink1';
runs((x, y) => cell[y][x] === 'f' && y >= 54 && x < 46, (x0, y0, x1, y1) => {
    const a = [x0 === 0 ? gx(0) : gc(x0), gc(y0)], b = [gc(x1), y1 === W - 1 ? gx(W) : gc(y1)];
    feat({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h: 2.6, t: 0.2, key: CHAIN, rail: false }); count.fence = (count.fence || 0) + 1; });
const pen = (x0, y0, x1, y1, gap) => {   // a rail ring on the squares' middles; `gap` = [side, square] leaves one square open
    const P = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
    P.forEach((s, i) => { if (gap && gap[0] === i) { const g = gap[1];
            if (s[1] === s[3]) { const lo = Math.min(s[0], s[2]), hi = Math.max(s[0], s[2]); if (g > lo) feat({ k: 'rail', x0: gc(lo), z0: gc(s[1]), x1: gc(g) - 1.75, z1: gc(s[1]), model: 'ranch' }); if (g < hi) feat({ k: 'rail', x0: gc(g) + 1.75, z0: gc(s[1]), x1: gc(hi), z1: gc(s[1]), model: 'ranch' }); }
            else { const lo = Math.min(s[1], s[3]), hi = Math.max(s[1], s[3]); if (g > lo) feat({ k: 'rail', x0: gc(s[0]), z0: gc(lo), x1: gc(s[0]), z1: gc(g) - 1.75, model: 'ranch' }); if (g < hi) feat({ k: 'rail', x0: gc(s[0]), z0: gc(g) + 1.75, x1: gc(s[0]), z1: gc(hi), model: 'ranch' }); }
            return; }
        feat({ k: 'rail', x0: gc(s[0]), z0: gc(s[1]), x1: gc(s[2]), z1: gc(s[3]), model: 'ranch' }); }); };

/* ── THE BUILDINGS (the city's way, Camelot's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside)
   with its own outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the
   front, y up. Squares x0..x1 x y0..y1 (the end is exclusive), `side` = the wall its front is on. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'),
    RIB = U('MetalWallRibbed1a'), COR = U('MetalCorrugated1a'), CONC = U('ConcretePanels1a'), PLAS = U('PlasterWallStucco2a');
const ROT = { S: 0, W: 90, N: 180, E: 270 }, ARCH = [];
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h, seg: 16 }, key, tint, o),
        quad: (x, y, z, w, h, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, o),
        /* a roof is drawn from outside only: one timber sheet facing down under it (Camelot's "gaps in the roofs") */
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? { uv } : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        /* a painted sign board: the words in a typeface (three-renderer.js HQ_SIGN_FONTS) */
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gx((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'des:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: Math.max(1, Math.floor(h / 3.5 + 0.01)), h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); setRect(sx0, sy0, sx1, sy1, 'B');
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'des:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot };
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame (180 = looking out of its front)
const SOLID = { hollow: false, leaf: undefined, leafDouble: undefined, keyIn: undefined, floorIn: undefined };

/* A WESTERN FRONT: plank walls, corner posts, a false front taller than the roof with the name painted on it, a boardwalk porch on the
   square row before the door (posts + a lean-to roof, or a balcony), sash windows. Every one differs: height, colour, front, roof, porch. */
function western(a, w, d, door, o) {
    const h = o.h, tint = o.tint, trim = o.trim || 0x4a3626, rf = o.roofTint || 0x6a5a48;
    a.shell(w, h, d, WD, tint, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });                                                          // the boards inside, proud of the sand
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.32, h, 0.32, WD2, trim);
    a.box(0, h - 0.25, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, trim);
    if (o.roof === 'shed') a.roof('shed', 0, h, 0, w + 0.5, 1.1, d + 0.5, SHG, rf); else a.roof('gable', 0, h, 0, d + 0.5, o.rh || 2.0, w + 0.5, SHG, rf, { ry: 90, keyEnd: WD, tintEnd: tint });
    if (o.front) { a.box(0, h, d / 2 - 0.05, w + 0.3, o.front, 0.24, WD, tint, { roof: true, uv: [3.5, 1.75] }); a.box(0, h + o.front, d / 2 - 0.05, w + 0.8, 0.26, 0.5, WD2, trim, { roof: true });
        if (o.step) a.box(0, h + o.front + 0.26, d / 2 - 0.05, w * 0.5, o.step, 0.24, WD, tint, { roof: true }); }
    /* the doorway's frame, the windows either side of it (and a row upstairs on a two-storey front) */
    a.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, WD2, trim);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 1.7) continue;
        a.box(x, 1.0, d / 2 + 0.06, 1.3, 1.4, 0.08, GLS, 0xe0cc98, { glow: 0.35 }); a.box(x, 0.86, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); a.box(x, 2.4, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); }
    if (h >= 7) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { a.box(x, 4.5, d / 2 + 0.06, 1.2, 1.5, 0.08, GLS, 0xc8d4e0); a.box(x, 4.36, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, trim); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.0, z, 0.08, 1.4, 1.2, GLS, 0xc8d4e0);
    /* the porch */
    if (o.porch !== 'none') { a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);
        const n = Math.max(2, Math.round(w / 3.5)), py = o.porch === 'balcony' ? 3.5 : 2.9;
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - door.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.2, py, 0.2, WD2, trim); }
        if (o.porch === 'balcony') { a.box(0, 3.5, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62, { under: true }); a.box(0, 3.66, d / 2 + 3.3, w, 0.9, 0.1, WD2, trim);
            for (const s of [-1, 1]) a.box(s * (w / 2 - 0.05), 3.66, d / 2 + 1.75, 0.1, 0.9, 3.3, WD2, trim);
            for (let i = 0; i <= n; i++) a.box(-w / 2 + 0.25 + i * (w - 0.5) / n, 3.66, d / 2 + 3.25, 0.18, 2.9, 0.18, WD2, trim);
            a.roof('shed', 0, 6.55, d / 2 + 1.85, w + 0.6, 0.7, 3.8, SHG, rf); }
        else a.roof('shed', 0, py, d / 2 + 1.85, w + 0.6, 0.8, 3.8, SHG, rf); }
    /* the name */
    if (o.name) { const sw = Math.min(w - 1.2, o.name.length * 0.95 + 1.2), y = o.front ? h + (o.front - 1.0) / 2 : h - 1.25;
        a.sign(o.name, 0, y, d / 2 + (o.front ? 0.09 : 0.12), sw, 1.0, o.ink || '#2a1a10', o.board || '#d8c090', 'rye', o.front ? { roof: true } : null); }
}
/* WESTERN TOWN (Main Street runs east-west between the two rows; every front faces it) */
const STABLES = building('stables', [49, 15, 57, 21, 'S'], 5.25, { leaf: 'leaf_barn', floorIn: 'dirt_2' }, (a, w, d, door) => western(a, w, d, door, { h: 5.25, tint: 0x8a5a3c, roofTint: 0x5a4636, rh: 3.0, porch: 'none', name: 'LIVERY STABLE', board: '#e8dcc0' }));
const SALOON = building('saloon', [61, 14, 69, 21, 'S'], 7, { leaf: 'leaf_saloon', leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 7, tint: 0xa0503c, trim: 0x3a2418, front: 2.4, step: 0.9, porch: 'balcony', name: 'SALOON', ink: '#f0d890', board: '#3a1c14' }));
const BANK = building('bank', [73, 16, 80, 21, 'S'], 5.25, { leafDouble: true, keyIn: PLAS }, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0xc8c0a8, trim: 0x5a5448, roofTint: 0x4a4a52, front: 1.8, name: 'BANK', ink: '#e8c860', board: '#2a3a30' });
    for (const s of [-1, 1]) a.box(door.lx + s * 1.6, 0, d / 2 + 0.3, 0.5, 4.6, 0.5, PLAS, 0xe0d8c4); });
const HOTEL = building('hotel', [85, 14, 93, 21, 'S'], 8.75, { leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 8.75, tint: 0xb89868, trim: 0x4a3020, roofTint: 0x7a4638, front: 1.4, porch: 'balcony', name: 'HOTEL', board: '#f0e8d0' }));
const JAIL = building('jail', [49, 27, 57, 32, 'N'], 4.2, { leaf: 'leaf_cell', keyIn: 'bricks_1', floorIn: 'cobblestone' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0x9a8a78, trim: 0x3a3430, roof: 'shed', front: 1.3, name: 'SHERIFF', ink: '#f0e8d0', board: '#3a3430' });
    a.box(0, 0, 0, w + 0.3, 1.2, d + 0.3, 'bricks_1', 0xb0a08c, { top: false, faces: 'blr' }); });
const STORE = building('store', [73, 27, 80, 32, 'N'], 5.25, {}, (a, w, d, door) => western(a, w, d, door, { h: 5.25, tint: 0x6a7a6a, trim: 0x2e3a30, front: 2.0, step: 0.7, name: 'GENERAL STORE', board: '#e8dcc0' }));
const CHURCH = building('church', [63, 1, 68, 5, 'S'], 7, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 7, tint: 0xe8e4d8, trim: 0x8a8478, roofTint: 0x4a4038, rh: 4.2, porch: 'none' });
    a.box(0, 7, d / 2 - 1.6, 2.6, 5.2, 2.6, WD, 0xe8e4d8, { roof: true }); a.roof('pyramid', 0, 12.2, d / 2 - 1.6, 3.2, 3.6, 3.2, SHG, 0x4a4038);          // the steeple over the door
    a.box(0, 16.0, d / 2 - 1.6, 0.16, 1.6, 0.16, WD2, 0x3a2a20, { roof: true }); a.box(0, 16.9, d / 2 - 1.6, 0.9, 0.16, 0.16, WD2, 0x3a2a20, { roof: true }); });
/* THE ROAD: nothing walked into but the chain's own store (a pack model, placed below) */
/* THE CIRCUS: the big top is a hollow building under a striped cone (the ring inside); the hall of mirrors' front holds the old carnival's frame */
const RED = 0xb8302c, CREAM = 0xf0e8d4;
const BIGTOP = building('bigtop', [26, 14, 33, 21, 'W'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'canvas', floorIn: 'dirt_2' }, (a, w, d, door) => {
    a.shell(w, 5.2, d, 'canvas', CREAM, door);
    for (let i = 0; i < 7; i += 2) { const x = -w / 2 + 1.75 + i * 3.5; for (const s of [-1, 1]) a.box(x, 0, s * (d / 2 + 0.08), 3.4, 5.2, 0.06, 'canvas', RED);
        for (const s of [-1, 1]) if (!(s > 0 && false)) a.box(s * (w / 2 + 0.08), 0, x, 0.06, 5.2, 3.4, 'canvas', RED, s > 0 ? null : null); }
    a.roof('pyramid', 0, 5.2, 0, w + 1.6, 9.5, d + 1.6, 'canvas', RED); a.roof('pyramid', 0, 5.25, 0, w * 0.62, 9.6, d * 0.62, 'canvas', CREAM);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 6.2, 0.3, WD2, 0x4a3626);
    a.cyl(0, 14.6, 0, 0.12, 4.2, 'aluminium', 0xd8d8d8, { roof: true }); a.box(0.9, 17.4, 0, 1.8, 1.0, 0.04, null, 0xe8c030, { roof: true });                 // the king pole and its pennant
    a.sign('BIG TOP', door.lx, 3.4, d / 2 + 0.12, 7.0, 1.4, '#f0d890', '#7a1c18', 'rye'); });
const MIRRORS = building('mirrors', [44, 26, 47, 30, 'W'], 5.25, SOLID, (a, w, d) => {
    a.box(0, 0, 0, w, 5.25, d, WD, 0x6a4a8a, { top: false, uv: [3.5, 1.75] }); a.roof('shed', 0, 5.25, 0, w + 0.5, 0.9, d + 0.5, SHG, 0x3a2a4a);
    for (const x of [-4.4, -1.5, 1.5, 4.4]) a.box(x, 0.6, d / 2 + 0.06, 1.5, 3.0, 0.06, GLS, 0xb8d8f0, { glow: 0.5 });
    a.sign('HALL OF MIRRORS', 0, 4.0, d / 2 + 0.1, 11.0, 1.0, '#f0e8ff', '#3a2a4a', 'rye'); });
/* AREA 51 */
const POST = building('guardpost', [4, 51, 6, 54, 'W'], 3.5, { leaf: 'leaf_window_medium', keyIn: CONC, floorIn: U('ConcreteSlab2a') }, (a, w, d, door) => {
    a.shell(w, 3.2, d, CONC, 0xb8b8b0, door); a.box(0, 3.2, 0, w + 1.4, 0.25, d + 1.4, COR, 0x8a8a86, { under: true });
    for (const x of [-3.2, 3.2]) a.box(x, 1.1, d / 2 + 0.06, 1.6, 1.2, 0.06, GLS, 0xa8c0d0);
    a.sign('RESTRICTED AREA', 0, 2.55, d / 2 + 0.1, 6.0, 0.5, '#ffffff', '#a82a20', 'stencil'); });
const HANGAR = building('hangar', [13, 86, 23, 94, 'N'], 14, SOLID, (a, w, d) => {
    a.box(0, 0, 0, w, 10.5, d, RIB, 0x9aa0a0, { top: false, uv: [3.5, 3.5] }); a.roof('barrel', 0, 10.5, 0, w + 0.6, 5.6, d + 0.6, COR, 0x7c8484, { keyEnd: RIB, tintEnd: 0x9aa0a0 });
    a.box(0, 0, d / 2 + 0.06, 24.5, 9.2, 0.1, COR, 0x5a6266, { uv: [3.5, 3.5] });                                                                       // THE BIG DOOR, shut: six leaves on a rail
    for (let i = -3; i <= 3; i++) a.box(i * 4.08, 0, d / 2 + 0.13, 0.16, 9.2, 0.08, RIB, 0x3e4446);
    a.box(0, 9.2, d / 2 + 0.2, 26, 0.5, 0.5, RIB, 0x3e4446);
    a.sign('18', 0, 10.4, d / 2 + 0.2, 5.6, 3.6, '#f0f0f0', '', 'stencil', { kind: 'over' });
    a.sign('HANGAR 18', -14.6, 3.2, d / 2 + 0.08, 4.2, 0.6, '#f0f0f0', '#23262b', 'stencil');
    for (const s of [-1, 1]) for (let z = -d / 2 + 3.5; z < d / 2; z += 7) a.box(s * (w / 2 + 0.3), 0, z, 0.6, 10.5, 0.8, RIB, 0x7c8484);                // the frames down each side
    for (const x of [-12, 12]) a.box(x, 14.2, 0, 1.4, 1.2, 1.4, COR, 0x5a6266, { roof: true }); });
const WING = building('wing', [27, 89, 31, 93, 'N'], 5.25, SOLID, (a, w, d) => {
    a.box(0, 0, 0, w, 5.25, d, CONC, 0xe8e8e4, { top: false }); a.box(0, 5.25, 0, w + 0.6, 0.3, d + 0.6, CONC, 0xc8c8c4, { under: true });
    for (const x of [-5, 5]) a.box(x, 2.4, d / 2 + 0.06, 1.4, 0.7, 0.06, GLS, 0xf0f4f8, { glow: 0.7 });
    a.sign('PSYCHIATRIC', 0, 3.6, d / 2 + 0.1, 5.2, 0.6, '#23262b', '#f0f0ec', 'way'); });
ARCH.forEach(feat);

/* ── THE INSIDES ── */
put(SALOON, 'mobius_bar', -8.5, -6, { face: 90 }); for (const z of [-8, -6, -4]) put(SALOON, 'bar_stool', -6.6, z, {}); put(SALOON, 'decor_piano', 9.5, -8.5, { face: 180 });
for (const q of [[-3, 2], [4, 3], [5, -4], [-2, -5]]) { put(SALOON, 'round_table', q[0], q[1], {}); put(SALOON, 'psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); put(SALOON, 'psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); }
put(SALOON, 'psx_glass_bottle_1', -8.5, -5, { y: 1.5 }); put(SALOON, 'psx_glass_bottle_2', -8.5, -7, { y: 1.5 }); put(SALOON, 'psx_wooden_crate_2', 11, 9, {}); put(SALOON, 'slot_machine', 12, 0, { face: 270 });
put(BANK, 'vault', 0, -6, { face: 180 }); put(BANK, 'form_counter', 0, 1.5, { face: 180 }); put(BANK, 'floor_safe', -9, -6.5, {}); put(BANK, 'money_sacks', 8.5, -6.5, {}); put(BANK, 'money_counter', 4, 1.5, { y: 1.0 });
put(BANK, 'psx_gold_bar_pcs_1', -4, 1.5, { y: 1.02 }); put(BANK, 'iron_garden_bench', -9, 6, { face: 90 });
put(JAIL, 'cell_bars', -8.75, -1.5, { face: 0 }); put(JAIL, 'cell_bars', -5.25, -1.5, { face: 0 }); put(JAIL, 'cell_bars', 5.25, -1.5, { face: 0 }); put(JAIL, 'cell_bars', 8.75, -1.5, { face: 0 });
put(JAIL, 'cot', -8, -6, { face: 90 }); put(JAIL, 'cot', 8, -6, { face: 90 }); put(JAIL, 'wooden_bucket', -5.6, -6.6, {}); put(JAIL, 'exec_desk', 0, 3, { face: 180 }); put(JAIL, 'rocking_chair', 2.6, -0.2, { face: 200 });
put(JAIL, 'footlocker', -11, 5, { face: 90 }); put(JAIL, 'notice_board', 4.5, 7.6, { face: 0, y: 1.5 });
for (const z of [-3.5, -0.5, 2.5]) for (const x of [-4.6, 4.6]) put(CHURCH, 'church_pew', x, z, { face: 0 }); put(CHURCH, 'stone_altar', 0, -5.6, {}); put(CHURCH, 'candle_ring', -3, -5.8, {}); put(CHURCH, 'ships_bell', 3, -5.6, { y: 0.02 });
put(STORE, 'form_counter', 0, -3, { face: 180 }); for (const x of [-9.5, -6, 6, 9.5]) put(STORE, 'psx_shelf_mp_2', x, -6.6, { face: 0 }); put(STORE, 'psx_wooden_crate_2', -9, 3, {}); put(STORE, 'psx_wooden_crate_3', -7.6, 4.2, { face: 30 });
put(STORE, 'psx_metal_barrel_mp_1', 9, 4, {}); put(STORE, 'meshy_burlap_sack', 7.6, 3, {}); put(STORE, 'meshy_burlap_sack', 8.4, 5.4, {});
put(STABLES, 'horse', -9, -4, { face: 90 }); put(STABLES, 'horse_brown', -3, -4, { face: 90 }); put(STABLES, 'horse_black', 3, -4, { face: 90 }); put(STABLES, 'meshy_burlap_sack', 10, -8, {}); put(STABLES, 'wooden_bucket', 6, -8, {}); put(STABLES, 'psx_wooden_crate_2', 11, 6, {});
for (const q of [[-9, -7], [-9, -3], [-9, 1], [9, -7], [9, -3], [9, 1]]) put(HOTEL, 'psx_bed_1', q[0], q[1], { face: q[0] < 0 ? 90 : 270 }); put(HOTEL, 'form_counter', 0, 4, { face: 180 }); put(HOTEL, 'wingback_chair', -4, 8, { face: 160 }); put(HOTEL, 'rug_round', 0, -2, { y: 0.17 });
put(POST, 'steel_table', 0, -1.6, { face: 0 }); put(POST, 'crt_terminal', 0, -1.6, { y: 0.76, face: 0 }); put(POST, 'folding_chair', 0, -0.6, { face: 0 });
/* the big top's ring */
put(BIGTOP, 'riser_1', 0, -9.5, { face: 0 }); put(BIGTOP, 'riser_2', 0, -10.2, { face: 0 }); put(BIGTOP, 'riser_1', -9.5, 0, { face: 90 }); put(BIGTOP, 'riser_1', 9.5, 0, { face: 270 });
put(BIGTOP, 'instrument_drum', 6, -7.5, { face: 200 }); put(BIGTOP, 'mirror_ball', 0, 0, { y: 4.6 }); put(BIGTOP, 'rug_round', 0, 0, { y: 0.02 });

/* ── helpers for the open ground ── */
const P = (key, sx, sy, o) => props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {}));                    // on a square's middle (a blocker)
const Pm = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));                       // at a metre spot
const dec = (key, sx, sy, o) => props.push(Object.assign({ key, x: r2(gc(sx) + (rnd() - 0.5) * 1.6), z: r2(gc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {}));   // off the middle (decor)
const native = (race, sx, sy, face, say) => { const n = { x: gc(sx), z: gc(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* (THE ROAD district of the first build is gone: the highway and its pieces are authored in the new frame, below) */

/* ── THE CIRCUS (the old carnival, HQ Room 1893, moved out here: its pieces, its people and their own lines) ── */
Pm('ferris_wheel', gx(42), gx(2), { h: 22, face: 0 }); setRect(39, 1, 45, 3, 'B');
Pm('carousel', gx(45.5), gx(15), { h: 5.6 }); setRect(43, 13, 48, 17, 'B');
pen(13, 0, 16, 3); pen(19, 0, 22, 3); P('lion', 14, 1, { face: 150 }); P('elephant', 20, 1, { face: 200 }); P('giraffe', 21, 2, { face: 160 }); dec('psx_wooden_crate_2', 17, 2); dec('meshy_burlap_sack', 18, 3);
Pm('carnival_tent', gx(26), gx(2), { face: 180 }); Pm('carnival_tent', gx(34), gx(2), { face: 180 }); Pm('trailer_home_6', gx(30), gx(4) - 0.5, { face: 0 }); dec('psx_wooden_crate_3', 29, 6); dec('instrument_tambourine', 33, 5);
Pm('ticket_booth', gc(15), gc(29), { h: 3.0, face: 180 }); P('high_striker', 21, 20, { h: 6.5, face: 180 }); P('popcorn_cart', 13, 14, { face: 90 }); P('hot_dog_stand', 20, 14, { face: 270 });
Pm('carnival_tent', gx(14), gx(22), { face: 90 }); P('slot_machine', 20, 21, { face: 270 }); P('park_bench', 14, 19, { face: 90 }); P('park_bench', 21, 16, { face: 270 }); dec('trash_bin', 13, 16); dec('beach_ball', 22, 19);
Pm('fortune_tent', gc(27), gc(27), { h: 5.2, face: 180 }); feat({ k: 'pool', x: gx(33), z: gx(28), r: 3.4, rz: 3.4, y: -0.2, depth: 1.4, key: 'water', bank: 0.8 }); pen(31, 26, 34, 29);
P('park_bench', 36, 28, { face: 270 }); dec('trash_bin', 38, 25); P('paper_lantern', 42, 22, { y: 2.2 });
native('ringmaster', 24, 18, 270, sayOf(O_CARN, 'ringmaster')); native('clown', 22, 30, 200); native('giant', 22, 20, 180, sayOf(O_CARN, 'giant')); native('fortune teller', 27, 29, 180, sayOf(O_CARN, 'fortune teller'));
native('mermaid', 35, 27, 270, sayOf(O_CARN, 'mermaid')); native('gnome', 40, 5, 180, sayOf(O_CARN, 'gnome')); native('catgirl', 16, 22, 90, sayOf(O_CARN, 'catgirl'));

/* ── WESTERN TOWN ── */
feat({ k: 'hill', x: gc(53), z: gc(3), r: 13, h: 2.6 });                                                              // BOOT HILL
[[51, 1], [53, 1], [55, 1], [50, 3], [52, 3], [54, 3], [56, 3], [51, 5], [53, 5]].forEach((q, i) => Pm(i % 3 === 0 ? 'psx_cross_mp_2' : 'cross', gc(q[0]), gc(q[1]), { face: 180, h: 1.5 }));
P('dead_snag', 57, 2, {}); dec('skull', 55, 4); dec('trap_coffin_lid', 49, 2);
Pm('decor_windpump_tower', gc(77), gc(3), { h: 11 }); Pm('decor_windpump_wheel', gc(77), gc(3) + 0.9, { y: 10.2, span: 4.2 }); P('ancient_well', 79, 4, {}); dec('wooden_bucket', 78, 5); P('cow', 81, 3, { face: 240 });
/* THE MINE: the mouth in the rock, the rails out of it */
Pm('culvert_mouth', gx(90), gx(5) - 0.3, { face: 180, h: 3.2 }); feat({ k: 'rail', x0: gc(89), z0: gx(5), x1: gc(86), z1: gx(8), model: 'pipe', block: false }); P('psx_metal_barrel_mp_1', 92, 6, {}); P('psx_wooden_crate_2', 93, 6, {});
dec('railway_lantern', 88, 6); P('luggage_cart', 87, 7, { face: 60 }); dec('cinder_block', 91, 7);
P('ancient_well', 66, 24, {}); dec('wooden_bucket', 67, 24); P('signpost', 58, 23, { face: 90 });                      // MAIN STREET: the well where the showdown happens
[[59, 21], [70, 21], [81, 21], [59, 26], [71, 26], [82, 26]].forEach(q => dec(rnd() < 0.5 ? 'psx_metal_barrel_mp_1' : 'psx_wooden_crate_2', q[0], q[1]));
P('horse', 58, 21, { face: 0 }); P('horse_brown', 83, 26, { face: 180 }); P('iron_garden_bench', 71, 21, { face: 180 }); P('rocking_chair', 51, 26, { face: 0 });
pen(84, 28, 88, 34, [0, 86]); P('horse_black', 85, 30, { face: 90 }); P('cow', 86, 32, { face: 300 }); P('cow', 87, 30, { face: 40 }); dec('wooden_bucket', 85, 33);                           // THE CORRAL
P('campfire', 66, 44, {}); Pm('camping_tent', gc(64), gc(45), { face: 120 }); Pm('camping_tent', gc(68), gc(46), { face: 220 }); dec('sea_chest', 67, 46); dec('instrument_guitar_lying', 65, 43); P('luggage_cart', 70, 44, { face: 20 });
dec('skull', 76, 43); dec('skull', 80, 39); dec('psx_fish_skeleton_mp_1', 78, 45, { y: 0.02 }); P('dead_snag', 74, 40, {}); P('dead_snag', 79, 42, {});
native('sheriff', 53, 25, 0); native('cowboy', 65, 22, 180, sayOf(O_LINE, 'cowboy')); native('cowboy', 60, 24, 90); native('skeleton', 54, 2, 180);

/* ── AREA 51 ── */
P('radiation_sign', 3, 53, { face: 0, y: 1.2 }); P('flood_mast', 3, 55, {}); P('flood_mast', 8, 55, {}); dec('traffic_barrel', 3, 50); dec('traffic_barrel', 0, 52); P('car_cop', 8, 52, { face: 180 }); P('car_suv', 10, 52, { face: 180 });
P('security_camera', 7, 54, { y: 2.4, face: 0 }); P('security_camera', 30, 54, { y: 2.4, face: 0 }); P('flood_mast', 24, 55, {}); P('flood_mast', 44, 55, {}); P('roads_g_sign_005', 3, 48, { face: 180 });
Pm('dish', gc(9), gc(63), { h: 9 }); P('flood_mast', 6, 66, {});
/* THE APRON: the old flight line's trucks, the bus, the sandbags, the fire truck */
Pm('car_truck', gc(15), gc(64), { face: 90 }); Pm('car_truck', gc(15), gc(67), { face: 90 }); Pm('car_truck', gc(15), gc(70), { face: 90 }); Pm('school_bus', gc(20), gc(72), { face: 0 }); Pm('fire_truck', gc(33), gc(72), { face: 90 });
[[19, 64], [19, 68], [23, 64], [23, 68]].forEach(q => Pm('meshy_sandbags', gc(q[0]), gc(q[1]), { h: 1.6 })); P('bus_shelter', 22, 74, { face: 180 }); P('flood_mast', 13, 63, {}); P('flood_mast', 34, 63, {}); P('flood_mast', 13, 74, {}); P('flood_mast', 34, 74, {});
dec('traffic_cone', 25, 70); dec('traffic_cone', 27, 71); dec('cinder_block', 17, 73); P('iso_tank', 32, 65, {});
/* THE TOWER: the old flight line's own tower rows (the base, the drum, the fire escape, the ladder, the rails, the mast), moved here whole */
{ const dx = gx(29.5) + 11.375, dz = gx(66) + 16.625, sh = f => { const o = JSON.parse(JSON.stringify(f));
      ['x', 'x0', 'x1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dx); }); ['z', 'z0', 'z1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dz); });
      if (o.pts) o.pts = o.pts.map(p => [r2(p[0] + dx), r2(p[1] + dz)].concat(p.slice(2))); if (o.arc) { o.arc.x = r2(o.arc.x + dx); o.arc.z = r2(o.arc.z + dz); } return o; };
  const keep = O_LINE.f.filter(f => { const x = f.x != null ? f.x : f.x0 != null ? (f.x0 + f.x1) / 2 : f.pts ? f.pts[0][0] : f.arc ? f.arc.x : null, z = f.z != null ? f.z : f.z0 != null ? (f.z0 + f.z1) / 2 : f.pts ? f.pts[0][1] : f.arc ? f.arc.z : null;
      return x != null && x > -31 && x < -3 && z > -22 && z < -11 && ['plateau', 'ramp', 'rail', 'climb'].indexOf(f.k) >= 0; });
  if (keep.length < 8) throw new Error('the old tower rows were not found (' + keep.length + ')');
  keep.forEach(f => feat(sh(f))); count.tower = keep.length; setRect(26, 64, 32, 68, 'B');
  Pm('floating_orb', -11.375 + dx, -14.875 + dz, { face: 0 }); npc.push({ x: r2(-10.8 + dx), z: r2(-17.4 + dz), face: 160, race: 'marksman', say: sayOf(O_LINE, 'marksman') }); }
[37, 39, 41, 43].forEach((x, i) => { Pm('military_tank', gc(x), gc(65), { face: i % 2 ? 180 : 0 }); if (i < 3) feat({ k: 'wall', x0: gx(x + 1) + 1.75, z0: gx(64), x1: gx(x + 1) + 1.75, z1: gx(67), h: 1.5, t: 0.6, key: 'wasteland' }); });   // THE PENS
Pm('fighter_jet', gx(20), gx(78), { face: 90 }); [6, 14, 26, 34].forEach(x => { P('flood_mast', x, 75, {}); P('flood_mast', x, 81, {}); });
feat({ k: 'dip', x: gx(40.5), z: gx(78.5), r: 11, h: 2.4 }); Pm('saucer_lg', gx(40.5), gx(78.5), { span: 9, y: -2.2 }); dec('warning_tape', 37, 75, { y: 0.01 }); dec('traffic_cone', 36, 80);
[[2, 86], [9, 92], [38, 88], [43, 93]].forEach(q => P('flood_mast', q[0], q[1], {}));                                 // THE DRY LAKE: the lights that go round all night
P('radiation_sign', 24, 85, { y: 1.4, face: 0 }); P('military_tank', 12, 84, { face: 90 }); P('psx_supply_crate_1', 24, 87, {}); P('psx_supply_crate_1_2', 24, 89, {});
native('men in black', 3, 57, 0, sayOf(O_GATE, 'men in black')); native('marksman', 7, 52, 270, sayOf(O_GATE, 'marksman')); native('men in black', 21, 73, 270, sayOf(O_LINE, 'men in black'));
native('spy', 30, 62, 180); native('bligblog', 38, 82, 0); native('grey', 41, 74, 200);

/* ── GIZA ── */
const STONE = 0xd8c49a, ST2 = 0xc8b088, PYR = [];
function tier(cx, cz, w, h0, h1) { feat({ k: 'plateau', x: cx, z: cz, w, d: w, h: h1, edge: 0.3 }); PYR.push({ s: 'box', p: [cx, h0, cz], size: [r2(w + 0.06), r2(h1 - h0 + 0.03), r2(w + 0.06)], key: 'bricks_1', tint: h1 > 7 ? ST2 : STONE, uv: [3.5, 1.75] }); }
const stair = (x0, z0, x1, z1, h0, h1) => feat({ k: 'ramp', x0, z0, x1, z1, w: 7, h0, h1, stairs: true, built: true, edge: 0.3, key: 'bricks_1' });
/* THE GREAT PYRAMID on four plots: 77 m at the foot, four tiers to 14 m, THE NORTH STAIR up its north face */
{ const cx = gx(84), cz = gx(84); [[77, 3.5], [56, 7], [35, 10.5], [14, 14]].forEach((t, i) => tier(cx, cz, t[0], i * 3.5, t[1]));
  stair(cx, gx(69), cx, gx(73), 0, 3.5); stair(cx, gx(73), cx, gx(76), 3.5, 7); stair(cx, gx(76), cx, gx(79), 7, 10.5); stair(cx, gx(79), cx, gx(82), 10.5, 14);
  PYR.push({ s: 'roof', form: 'pyramid', p: [cx, 14.03, cz], size: [7, 4.2, 7], key: 'bricks_1', tint: 0xe8c860, roof: true });                         // the capstone
  P('brazier', 82, 70, {}); P('brazier', 85, 70, {}); P('obelisk', 81, 72, { h: 5 }); P('obelisk', 86, 72, { h: 5 }); }
/* KHAFRE: 35 m, three tiers, its stair on the west face */
{ const cx = gx(78), cz = gx(65); [[35, 3.5], [21, 7], [7, 10.5]].forEach((t, i) => tier(cx, cz, t[0], i * 3.5, t[1]));
  stair(gx(71), cz, gx(73), cz, 0, 3.5); stair(gx(73), cz, gx(75), cz, 3.5, 7); stair(gx(75), cz, gx(77), cz, 7, 10.5); }
/* MENKAURE: 21 m, two tiers, its stair on the north face */
{ const cx = gx(66), cz = gx(65); tier(cx, cz, 21, 0, 3); tier(cx, cz, 7, 3, 6); stair(cx, gx(60), cx, gx(62), 0, 3); stair(cx, gx(62), cx, gx(64), 3, 6); }
/* THE SPHINX, facing east: the body, the head, the two paws */
{ const z = gx(51); feat({ k: 'plateau', x: gx(66), z, w: 28, d: 10.5, h: 3.5, edge: 0.3 }); feat({ k: 'plateau', x: gx(69), z, r: 4.4, h: 8.75, edge: 0.3 });
  PYR.push({ s: 'box', p: [gx(66), 0, z], size: [28.06, 3.53, 10.56], key: 'bricks_1', tint: STONE, uv: [3.5, 1.75] }, { s: 'cyl', p: [gx(69), 3.5, z], r: 4.45, h: 5.28, seg: 10, key: 'bricks_1', tint: ST2, uv: 1.75 },
      { s: 'box', p: [gx(69) + 4.2, 4.6, z], size: [1.2, 3.2, 5.6], key: 'bricks_1', tint: STONE }, { s: 'box', p: [gx(69), 8.78, z], size: [7.4, 1.4, 9.4], key: 'bricks_1', tint: 0xc09858 });   // the face, the headdress
  for (const s of [-1, 1]) { feat({ k: 'plateau', x: gx(71.5), z: r2(z + s * 3.5), w: 10.5, d: 3.0, h: 1.75, edge: 0.2 }); PYR.push({ s: 'box', p: [gx(71.5), 0, r2(z + s * 3.5)], size: [10.56, 1.78, 3.06], key: 'bricks_1', tint: STONE }); }
  setRect(62, 49, 74, 53, 'B'); P('brazier', 75, 49, {}); P('brazier', 75, 52, {}); }
feat({ k: 'arch', id: 'des:giza:look', x: 0, z: 0, parts: PYR });
[[50, 62], [57, 62], [50, 69], [57, 69]].forEach(q => P('obelisk', q[0], q[1], {})); P('brazier', 52, 65, {}); P('brazier', 55, 65, {}); P('signpost', 54, 55, { face: 90 });
/* THE DIG: two trenches a level down, the camp */
feat({ k: 'plateau', x: gx(76.5), z: gc(50), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 }); feat({ k: 'plateau', x: gx(78.5), z: gc(56), w: 17.5, d: 3.5, h: -1, sink: true, edge: 0.3 });
P('campfire', 80, 53, {}); Pm('camping_tent', gc(82), gc(52), { face: 240 }); Pm('camping_tent', gc(82), gc(55), { face: 280 }); dec('cardboard_boxes', 78, 53); dec('cardboard_boxes', 77, 58); P('sarcophagus', 80, 58, { face: 60 }); dec('paper_sheet', 79, 54, { y: 0.01 });
dec('psx_wooden_crate_2', 75, 52); P('trap_sarcophagus_box', 78, 56, { y: -1, face: 90 });
/* THE OASIS */
feat({ k: 'pool', x: gx(53.5), z: gx(78.5), r: 8.5, rz: 7.5, y: -0.25, depth: 1.0, key: 'water', bank: 1.6 });
[[50, 76, 4.6], [56, 77, 5.0], [51, 81, 4.4], [55, 81, 4.8], [53, 75, 5.2], [58, 80, 4.2]].forEach(q => feat({ k: 'tree', x: gc(q[0]), z: gc(q[1]), kind: 'palm', h: q[2], r: 1.3 }));
dec('sea_chest', 57, 82); P('camel_stand_in_none', 0, 0, { skip: true });
/* THE SAND SEA, the Robbers' Tunnel, the Tomb Door */
P('sarcophagus', 54, 89, { face: 20, y: -0.3 }); dec('skull_pile', 62, 90); dec('skull', 50, 91); P('cave_stone', 66, 88, {}); P('cave_stone', 58, 92, {});
dec('skull_pile', 92, 66); dec('paper_sheet', 91, 68, { y: 0.01 }); P('brazier', 71, 77, {}); P('brazier', 71, 80, {}); P('signpost', 70, 82, { face: 270 });
native('anubis', 76, 54, 200, sayOf(O_GIZA, 'anubis')); native('annunaki', 86, 70, 270, sayOf(O_GIZA, 'annunaki')); native('skeleton', 79, 55, 300, sayOf(O_GIZA, 'skeleton'));
native('conspiracy theorist', 91, 70, 40, sayOf(O_GIZA, 'conspiracy theorist')); native('mummy', 69, 80, 270); native('djinn', 55, 84, 0);
{ const i = props.findIndex(p => p.skip); if (i >= 0) props.splice(i, 1); }

/* ── THE MESHY PIECES (mondo 11-15 19:01 "okay go ahead": the packs have no cactus, covered wagon, water tower or hitching rail) ── */
[[62, 22], [68, 22], [74, 22], [86, 22], [92, 22], [50, 22], [51, 25], [74, 25], [79, 25]].forEach(q => P('hitching_rail', q[0], q[1], { face: 0 }));       // along Main Street, clear of every door
Pm('covered_wagon', gx(62), gc(42), { face: 0 }); Pm('covered_wagon', gx(71), gc(47), { face: 180 });                                                   // THE WAGON CAMP
Pm('water_tower_west', gx(74), gx(9), {});                                                                                                               // by the windmill, on 2 x 2 squares
/* scattered off the grid: stones, skulls, the odd bone pile (nothing on a road) */
feat({ k: 'scatter', key: 'cave_stone', n: 130, seed: 5 }); feat({ k: 'scatter', key: 'skull', n: 26, seed: 6 }); feat({ k: 'scatter', key: 'dead_snag', n: 22, seed: 7 });

/* ── THE WAYS ── (the highway north to Disaster City and the Robbers' Tunnel are LINKS, written at the end; the bay door of Room 444 is siteRooms.entry) */
doors.push({ id: 'hangar', wall: 'free', x: HANGAR.cx, z: r2(gx(86) - 0.45), face: 0, leaf: 'leaf_bulkhead', wide: true, label: 'AREA 51 · HANGAR 18', sub: 'THE BIG DOOR · INTO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'flightline' },
    desc: 'The hangar’s big door from the apron. Eighteen is painted on it in letters taller than the door is; the door is taller than that.' });
doors.push({ id: 'ward', wall: 'free', x: WING.cx, z: r2(gx(89) - 0.45), face: 0, leaf: 'leaf_cell', label: 'AREA 51 · THE WHITE ROOMS', sub: 'THE YARD GATE · INTO THE WING', action: { room: 'site_prebuilt_area51_ward', at: 'yard' },
    desc: 'The barred gate into the wing. From out here the white is a light left on.' });
doors.push({ id: 'stormdrain', wall: 's', x: gx(34), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE STORM DRAIN · UNDER THE FENCE INTO THE WHITE ROOMS', action: { room: 'site_prebuilt_area51_ward', at: 'stormdrain' },
    desc: 'A culvert mouth in the yard’s south berm. It goes under the fence and comes up through a grate in a white corridor.', draft: true });
doors.push({ id: 'tunnel', wall: 'free', x: gc(13), z: gc(29), face: 180, leaf: 'leaf_barn', label: 'THE TUNNEL', sub: 'ROOM 1893 · BACK TO THE PLATFORM', action: { room: 'tunnel', at: 'carnival' },
    desc: 'A barn door standing by the ticket booth with nothing behind it but sand. Back to the platform. The train will still be there.' });
doors.push({ id: 'mirrors', wall: 'free', x: r2(gx(44) - 0.45), z: gx(28), face: 270, leaf: 'leaf_frame_only', label: 'THE MANDELA ROOM', sub: 'ROOM * · IT IS DIFFERENT IN THERE', action: { room: 'mandela', at: 'mirrors' },
    desc: 'The hall of mirrors. It is not a hall and there are no mirrors; it is a room, and it is never the room it was.' });

/* THE DESERT'S INSIDES (2026-11-15, bake-desert-insides.js): the three ways into the Great Pyramid's inside. The entrance in the north face beside
   the North Stair, the slab beside the Tomb Door in the west face (Room 444's own door stays where it is), the Robbers' Cut (hidden) further north. */
{ const fx = r2(gx(73) - 0.45), nz = r2(gx(73) - 0.45);
  doors.push({ id: 'pyramid', wall: 'free', x: gc(87), z: nz, face: 0, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE NORTH FACE · THE WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'north' },
      desc: 'A square mouth in the north face, beside the stair, two courses up from the sand. The air that comes out of it is older than the stair.' });
  doors.push({ id: 'tombside', wall: 'free', x: fx, z: gc(81), face: 270, leaf: 'leaf_frame_only', label: 'THE GREAT PYRAMID', sub: 'THE WEST FACE · BEHIND THE TOMB DOOR', action: { room: 'site_prebuilt_giza_pyramid', at: 'tomb' },
      desc: 'A casing stone that turns on its middle, a few steps south of the Tomb Door.' });
  doors.push({ id: 'cut', wall: 'free', x: fx, z: gc(75), face: 270, secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · A ROUGH WAY IN', action: { room: 'site_prebuilt_giza_pyramid', at: 'cut' },
      desc: 'A hole hacked through the casing stones at the height of a crouch. The chisel marks all point inward.', draft: true });
  /* no cactus within two squares of these three (the cacti were seeded before the doors; only one standing in a doorway's way is taken out) */
  const near = p => doors.slice(-3).some(d => Math.hypot(p.x - d.x, p.z - d.z) < 7.5); let cut = 0;
  for (let i = props.length - 1; i >= 0; i--) if (props[i].key === 'saguaro_cactus' && near(props[i])) { props.splice(i, 1); cut++; }
  count.cactiCut = cut; }
/* ── THE MOVE: every row authored above stands in the first build's squares; its block goes to its new place whole (metres, new − old).
   A row of the first build's Road district (the old highway strip) is dropped: the tool prints what it dropped. ── */
const MOVE = { C: [-84, -42], W: [84, -42], A: [-84, 84], G: [84, 84] };
{ const blockAt = (x, z) => blockOf(Math.max(0, Math.min(W - 1, Math.floor((x + HALF) / C + 1e-6))), Math.max(0, Math.min(W - 1, Math.floor((z + HALF) / C + 1e-6))));
  const dropped = [];
  const move = (o, what) => {
      if (o.wall && o.wall !== 'free') { const b = o.wall === 's' ? (o.x < 0 ? 'A' : 'G') : o.wall === 'e' ? (o.z < 0 ? 'W' : 'G') : o.wall === 'w' ? (o.z < 0 ? 'C' : 'A') : (o.x < 0 ? 'C' : 'W');
          if (typeof o.x === 'number') o.x = r2(o.x + MOVE[b][0]); if (typeof o.z === 'number') o.z = r2(o.z + MOVE[b][1]); return true; }
      const ax = o.x != null ? o.x : o.x0 != null ? (o.x0 + o.x1) / 2 : o.pts ? o.pts[0][0] : o.arc ? o.arc.x : null, az = o.z != null ? o.z : o.z0 != null ? (o.z0 + o.z1) / 2 : o.pts ? o.pts[0][1] : o.arc ? o.arc.z : null;
      if (ax == null || az == null) return true;
      const b = blockAt(ax, az); if (b === 'R') { dropped.push(what + ':' + (o.key || o.k || o.race || o.id)); return false; }
      const dx = MOVE[b][0], dz = MOVE[b][1];
      ['x', 'x0', 'x1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dx); }); ['z', 'z0', 'z1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dz); });
      if (o.pts) o.pts = o.pts.map(q => [r2(q[0] + dx), r2(q[1] + dz)].concat(q.slice(2))); if (o.arc) { o.arc = Object.assign({}, o.arc, { x: r2(o.arc.x + dx), z: r2(o.arc.z + dz) }); }
      return true; };
  const sweep = (A, what) => { for (let i = A.length - 1; i >= 0; i--) if (!move(A[i], what)) A.splice(i, 1); };
  sweep(F, 'row'); sweep(props, 'prop'); sweep(npc, 'unit'); sweep(doors, 'door'); sweep(marks, 'mark');
  if (dropped.length) console.log('dropped with the old Road district: ' + dropped.join(' ')); }

/* ════ THE NEW FRAME: squares 0..144 (nx = a square's west / north line, nc = its middle) ════ */
const nP = (key, sx, sy, o) => props.push(Object.assign({ key, x: nc(sx), z: nc(sy) }, o || {}));
const nPm = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));
const ndec = (key, sx, sy, o) => props.push(Object.assign({ key, x: r2(nc(sx) + (rnd() - 0.5) * 1.6), z: r2(nc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {}));
const ASPH = 'urban:RoadGeneric1a', WHITE = 0xf0f0f0, YEL = 0xe8b830;
/* THE HIGHWAY (squares, as make-layout-4.py paints them): westbound y 2..5 and eastbound y 7..10 from the west wall, southbound x 68..71 and
   northbound x 73..76 down to the end at y 93; three lanes a side, a sand median between. Lane paint: two dashed lines a carriageway, a yellow
   line on the median side, a white one on the shoulder. */
{ const dashV = (x, y0, y1) => { for (let y = y0; y + 2 <= y1; y += 4) line(nx(x), nx(y), nx(x), nx(y + 2), 0.14, WHITE); }, dashH = (y, x0, x1) => { for (let x = x0; x + 2 <= x1; x += 4) line(nx(x), nx(y), nx(x + 2), nx(y), 0.14, WHITE); };
  dashV(69, 11, 90); dashV(70, 11, 90); dashV(74, 6, 90); dashV(75, 6, 90); dashH(3, 0, 72); dashH(4, 0, 72); dashH(8, 0, 67); dashH(9, 0, 67);
  line(nx(71) - 0.3, nx(10), nx(71) - 0.3, nx(90), 0.16, YEL); line(nx(73) + 0.3, nx(5), nx(73) + 0.3, nx(90), 0.16, YEL); line(nx(0), nx(5) - 0.3, nx(41), nx(5) - 0.3, 0.16, YEL); line(nx(43), nx(5) - 0.3, nx(73), nx(5) - 0.3, 0.16, YEL);
  line(nx(0), nx(7) + 0.3, nx(41), nx(7) + 0.3, 0.16, YEL); line(nx(43), nx(7) + 0.3, nx(71), nx(7) + 0.3, 0.16, YEL);
  line(nx(68) + 0.3, nx(10), nx(68) + 0.3, nx(90), 0.14, WHITE); line(nx(76) - 0.3, nx(2), nx(76) - 0.3, nx(90), 0.14, WHITE); line(nx(0), nx(2) + 0.3, nx(41), nx(2) + 0.3, 0.14, WHITE); line(nx(43), nx(2) + 0.3, nx(76), nx(2) + 0.3, 0.14, WHITE); line(nx(0), nx(10) - 0.3, nx(68), nx(10) - 0.3, 0.14, WHITE);
  /* the two-lane roads: one yellow line down the middle */
  line(nx(42), nx(0), nx(42), nx(2), 0.14, YEL); line(nx(40), nx(53.5), nx(56), nx(53.5), 0.14, YEL); line(nx(88), nx(53.5), nx(96), nx(53.5), 0.14, YEL); line(nx(3), nx(81), nx(67), nx(81), 0.14, YEL); line(nx(2), nx(82), nx(2), nx(96), 0.14, YEL);
  line(nx(76), nx(91.5), nx(101), nx(91.5), 0.14, YEL); line(nx(52), nx(44), nx(67), nx(44), 0.14, YEL); }
/* EXIT 3's OVERPASS: the county road climbs an earth bank either side and crosses the highway on a bridge 5.25 m up (the cars pass under it) */
feat({ k: 'ramp', x0: nx(56), z0: nx(53.5), x1: r2(nx(64) + 0.5), z1: nx(53.5), w: 10.5, h0: 0, h1: 5.25, edge: 0.6 });
feat({ k: 'ramp', x0: nx(88), z0: nx(53.5), x1: r2(nx(80) - 0.5), z1: nx(53.5), w: 10.5, h0: 0, h1: 5.25, edge: 0.6 });
feat({ k: 'bridge', x0: nx(64), z0: nx(53.5), x1: nx(80), z1: nx(53.5), w: 10.5, y: 5.25, key: ASPH });
/* THE SIGNS: a gantry over the lanes it speaks to, its green board turned to the traffic coming at it (`dir` = the way that traffic drives) */
{ let n = 0; const FACE = { S: 180, N: 0, E: 90, W: 270 }, STEEL = 'urban:MetalWallRibbed1a';
  const gantry = (sx, sy, dir, words, span, o) => { o = o || {}; const w = span || 11.4, bw = Math.min(w - 1.2, Math.max(5.5, words.length * 0.42 + 1.2)), bh = o.bh || 2.0, P = [];
      for (const s of [-1, 1]) P.push({ s: 'box', p: [r2(s * w / 2), 0, 0], size: [0.32, 6.4 + bh, 0.32], key: STEEL, tint: 0x70767c });
      P.push({ s: 'box', p: [0, 6.0, 0], size: [r2(w + 0.3), 0.3, 0.3], key: STEEL, tint: 0x70767c }, { s: 'box', p: [0, 6.3, 0.12], size: [bw, bh, 0.12], tint: o.bg ? parseInt(o.bg.slice(1), 16) : 0x0b5c3a },
          { s: 'quad', p: [0, 6.4, 0.2], size: [r2(bw - 0.5), r2(bh - 0.2)], key: 'txt:' + words + '|' + (o.fg || '#ffffff') + '|' + (o.bg || '#0b5c3a') + '|' + r2((bw - 0.5) / (bh - 0.2)) + '||' + (o.font || 'way'), uv: 'fit', kind: 'wall', glow: 0.25 });
      feat({ k: 'arch', id: 'des:sign:' + (n++), x: nx(sx), z: nx(sy), rot: FACE[dir], parts: P }); };
  gantry(24, 8.5, 'E', 'EXIT 1 · DISASTER CITY'); gantry(58, 3.5, 'W', 'EXIT 1 · DISASTER CITY'); gantry(74.5, 15, 'N', 'EXIT 1 · DISASTER CITY · LEFT');
  gantry(69.5, 27, 'S', 'EXIT 2 · THE CIRCUS'); gantry(69.5, 40, 'S', 'EXIT 3 · WESTERN TOWN'); gantry(74.5, 67, 'N', 'EXIT 3 · WESTERN TOWN'); gantry(74.5, 38, 'N', 'REST AREA · GAS');
  gantry(69.5, 86, 'S', 'GIZA · HIGHWAY ENDS');
  /* (Exit 4, the base road, has no sign.) The billboard before the rest stop */
  gantry(81, 37, 'N', 'LAST GAS', 9, { bg: '#7a1c18', fg: '#f0d890', font: 'rye', bh: 3.0 });
  count.signs = n; }
/* THE REST STOP: the city chain's gas station (the store, the canopy, the sign), a truck at the pumps */
nPm('city_gas_canopy', nx(81), nx(27), { face: 90 }); nPm('city_gas_store', r2(nx(81) + 15.9), nx(27), { face: 90 }); nPm('city_gas_sign', r2(nx(79) + 0.6), r2(nx(22) + 1.2), { face: 90 });
nP('car_truck', 80, 30, { face: 0 }); ndec('traffic_cone', 79, 23); ndec('psx_metal_barrel_mp_1', 89, 31); nP('park_bench', 84, 31, { face: 180 }); ndec('trash_bin', 86, 31);
/* EXIT 1: the city limit */
nP('roads_g_sign_003', 44, 0, { face: 180 }); nP('signpost', 39, 0, { face: 200 }); ndec('traffic_barrel', 46, 0); ndec('skull', 36, 0);
/* THE DOOR: one road, one door (the opening scene and the main menu's own spot): a door frame standing alone by the frontage road, nothing behind it */
nP('leaf_shabby_wood', 46, 57, { face: 0 }); ndec('paper_sheet', 46, 58, { y: 0.01 }); nP('signpost', 49, 56, { face: 160 });
/* THE BUS STOP, on the frontage road */
nP('bus_shelter', 43, 50, { face: 0 }); nPm('school_bus', nx(48), nc(50), { face: 90 }); nP('bus_stop_sign', 41, 50, {});
/* THE TRAILERS: they sit either side of the base road and watch who takes the turn-off */
[[40, 75, 0, 1], [47, 76, 0, 3], [40, 84, 180, 2], [47, 85, 180, 5]].forEach(q => nPm('trailer_home_' + q[3], r2(nx(q[0]) + 8.75), r2(nx(q[1]) + 3.5), { face: q[2] }));
nP('dish', 54, 76, {}); ndec('folding_chair', 45, 78); ndec('folding_chair', 46, 78); ndec('retro_radio', 47, 78); nP('campfire', 53, 78, {}); ndec('garbage_bag', 54, 85); nP('car_suv', 55, 84, { face: 90 });
npc.push({ x: nc(48), z: nc(78), face: 200, race: 'conspiracy theorist', say: sayOf(O_LINE, 'conspiracy theorist') });
/* the shoulder: a wreck by the turn-off, the last signpost where the highway stops */
nP('crashed_car', 65, 68, { face: 30 }); ndec('skull', 64, 71); nP('signpost', 78, 94, { face: 90 }); ndec('traffic_barrel', 67, 94); ndec('traffic_barrel', 72, 94);
/* THE CARS (data.js terrain.traffic, the city's own system): one line in and down to Giza, one line back out. Each carriageway is one way, so
   the cars keep to its middle lane; on the two-way road at the end each line keeps to its own side. */
const TRAFFIC = [
    { pts: [[nx(0), nx(8.5)], [nx(69.5), nx(8.5)], [nx(69.5), nx(92.2)], [nx(100), nx(92.2)]], loop: false, n: 5, speed: 10, lane: 0.01, kinds: ['suv', 'cadillac', 'taxi', 'suv'] },
    { pts: [[nx(100), nx(90.8)], [nx(74.5), nx(90.8)], [nx(74.5), nx(3.5)], [nx(0), nx(3.5)]], loop: false, n: 5, speed: 10, lane: 0.01, kinds: ['cadillac', 'suv', 'copcar', 'taxi'] },
];
/* THE CACTI: saguaros on the open sand of the whole room, one to a square, never within two squares of a road, a building or another piece,
   never inside the base, the circus or on Main Street (mondo 11-15: no prickly pear for now: PEARS = 0) */
{ const taken = new Set(), sq = v => Math.floor((v + NHALF) / 3.5);
  props.forEach(p => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) taken.add((sq(p.x) + i) + ',' + (sq(p.z) + j)); });
  npc.forEach(q => taken.add(sq(q.x) + ',' + sq(q.z)));
  doors.forEach(d => { if (d.wall === 'free') for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) taken.add((sq(d.x) + i) + ',' + (sq(d.z) + j)); });
  F.forEach(f => { if (f.k === 'texbuilding' || f.k === 'plateau' || f.k === 'pool') { const w = (f.w || 2 * (f.r || 2)) / 2 + 3.5, d = (f.d || 2 * (f.rz || f.r || 2)) / 2 + 3.5; for (let x = sq(f.x - w); x <= sq(f.x + w); x++) for (let y = sq(f.z - d); y <= sq(f.z + d); y++) taken.add(x + ',' + y); } });
  const hard = (x, y) => x < 0 || y < 0 || x >= NW || y >= NW || !'.uo'.includes(ncell[y][x]);
  const sand = (x, y) => { if (x < 2 || y < 2 || x > NW - 3 || y > NW - 3 || ncell[y][x] !== '.') return false; if (y > 100 && x < 47) return false; if (x >= 12 && x < 48 && y >= 12 && y < 48) return false; if (x >= 96 && y >= 33 && y <= 38) return false;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (hard(x + i, y + j)) return false; return true; };
  let nS = 0, nPr = 0, tries = 0; const SAG = 130, PEARS = 0;
  while ((nS < SAG || nPr < PEARS) && tries++ < 60000) { const x = Math.floor(rnd() * NW), y = Math.floor(rnd() * NW); if (!sand(x, y) || taken.has(x + ',' + y)) continue;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) taken.add((x + i) + ',' + (y + j));
      if (nS < SAG && (nPr >= PEARS || rnd() < 0.58)) { nP('saguaro_cactus', x, y, { face: Math.round(rnd() * 360), h: r2(3.8 + rnd() * 2.6) }); nS++; }
      else { nP('prickly_pear', x, y, { face: Math.round(rnd() * 360), h: r2(1.1 + rnd() * 0.8) }); nPr++; } }
  count.cacti = nS + nPr; }
/* nothing stands in a driving lane: a piece within 3.2 m of a car line is a bug in this tool */
props.forEach(p => { TRAFFIC.forEach(t => { for (let i = 0; i + 1 < t.pts.length; i++) { const a = t.pts[i], b = t.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz, u = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.z - a[1]) * dz) / L2));
    if (Math.hypot(p.x - a[0] - u * dx, p.z - a[1] - u * dz) < 3.2) throw new Error(p.key + ' stands in a lane at ' + p.x + ', ' + p.z); } }); });

/* ── checks: every prop key and unit exists ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
for (let y = 0; y < NW; y++) for (let x = 0; x < NW; x++) paint[y * NW + x] = paintOf(ncell[y][x], x, y);
count.props = props.length; count.features = F.length; count.doors = doors.length; count.natives = npc.length; count.marks = marks.length;

/* ── the room ── */
const SP = { x: nx(42), z: nx(1) }, LINES = O_GATE.l.concat(O_LINE.l, O_GIZA.l, O_CARN.l), M = [];
M.push("        /* DESERT64-BEGIN — THE DESERT ON PLOTS (2026-11-15): written by `node bake-desert.js` from docs/areas/desert/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
M.push("        " + ROOM + ": {");
M.push("            label: 'THE DESERT',");
M.push("            sub: 'THE HIGHWAY · FOUR EXITS · 144 PLOTS',");
M.push("            kind: 'box', site: 'prebuilt_area51', part: 'desert',");
M.push("            shell: hqAncientShell({ w: " + (2 * NHALF) + ", d: " + (2 * NHALF) + ", h: 20, wallH: 20, floor: 'desert', apron: 'desert', skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + SP.x + ", z: " + SP.z + ", y: 5.0 },");
M.push("                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xfff0d0, ambient: 0.62 },");
M.push("                                    sky: { night: 0, tint: 0xd9b46a, tintAmt: 0.35, stars: 0.5, nebula: 0.4, day: 1, clouds: 0.05, fog: { color: 0xd8b370, amount: 0.55, top: 0.05, band: 0.45, density: 0.012 }, scenery: 'none' },");
M.push("                                    look: HQ_ROOM_LOOKS.plateau }),");
M.push("            parti: 'A highway down the middle of a hundred and forty-four plots of open sand, and off its exits a circus, a western town, a fenced base and three pyramids, each a long way from the next.',");
M.push("            typology: 'grid',");
M.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: 12, names: " + J(PLAN.plots.map(p => [p.id, p.name, p.district, 0])) + " },");
M.push("            terrain: {");
M.push("                res: 1.75, floor: 'desert', cliff: 'rock_wall_1', path: 'dirt_2',");
M.push("                noise: { amp: 0.08, scale: 9 },");
M.push("                /* THE NATURAL EDGES: the desert goes on north (Disaster City is that way) and east, mountains stand west and south (three-renderer.js _hqBuildEdgeLand) */");
M.push("                backdrop: false, edges: { reach: 440, n: { kind: 'desert' }, w: { kind: 'mountain' }, s: { kind: 'mountain' }, e: { kind: 'desert' } },");
M.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + nc(0) + ", z0: " + nc(0) + ", nx: " + NW + ", nz: " + NW + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
M.push("                marks: " + J(marks) + ",");
M.push("                /* THE HIGHWAY'S CARS (the city's own traffic system): in from the west along the eastbound side, south to the end, east to Giza; and back */");
M.push("                traffic: " + J(TRAFFIC) + ",");
M.push("                features: [");
F.forEach(f => M.push("                    " + J(f) + ","));
M.push("                ],");
M.push("            },");
M.push("            doors: [");
doors.forEach(d => M.push("                " + J(d) + ","));
M.push("            ],");
M.push("            counters: [],");
M.push("            props: [");
for (let i = 0; i < props.length; i += 4) M.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
M.push("            ],");
M.push("            agents: [],");
M.push("            npcSpots: " + J(npc) + ",");
M.push("            onlineSpots: [],");
M.push("            lines: " + J(LINES) + ",");
M.push("            spawn: { x: " + SP.x + ", z: " + SP.z + ", face: 180 },");
M.push("        },");
M.push("        /* DESERT64-END */");
const block = M.join('\n') + '\n';
/* the ends the data.js rows outside the block must agree with (DOOR_HQ.links + siteRooms.entry): printed so a moved path is noticed */
const ENDS = { downtown_desert: { wall: 'n', x: nx(42) }, gobekli_giza: { wall: 'e', z: r2(gx(69) + MOVE.G[1]) }, bay444: { wall: 'free', x: r2(gx(73) - 0.5 + MOVE.G[0]), z: r2(gx(79) + MOVE.G[1]), face: 270 } };
console.log(JSON.stringify(count)); console.log('ends ' + JSON.stringify(ENDS));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* DESERT64-END */\n', b0 = src.indexOf('        /* DESERT64-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_area51_flightline: {', a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
