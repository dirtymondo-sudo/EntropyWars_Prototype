#!/usr/bin/env node
/* bake-desert.js — THE DESERT ON PLOTS (2026-11-15, mondo: "start a thread to start on the desert" · "put the circus in the desert ... i meant
   district not plot" · "okay looks good" on the plot plan, 18:33 UTC). The third area of the world plan after the Woods and Camelot Kingdom:
   8 x 8 plots of 12 x 12 squares (336 m a side), five districts: THE ROAD, THE CIRCUS, WESTERN TOWN, AREA 51, GIZA.
   Reads docs/areas/desert/layout.json (the approved plan: every plot's name + district, and the 96 x 96 square map) and writes the room
   `site_prebuilt_area51_desert` into data.js between DESERT64-BEGIN / DESERT64-END. `node bake-desert.js` writes; `--dry-run` prints the counts.
   Never hand-edit between the markers: edit this tool or the layout and rerun. Notes: docs/notes/areas-complexes.md "THE DESERT ON PLOTS".
   THE DISTRICT FILES (2026-11-16): the four districts' content is docs/areas/desert/districts/<C|W|A|G>.js, loaded through one hook below
   ("THE DISTRICT FILES"); this tool keeps the Highway and every shared piece. One thread = one district file.
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
/* the tool's own dice (the highway's decor, the cacti). They start where the first build's one stream stood after the four districts; each
   district file throws its own (THE DISTRICT FILES below). */
let seed = 1644840566; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const inBase = (x, y) => y > 54 && x < 45;                                   // inside Area 51's fence
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };
cell[54][0] = 'f';                                                           // the fence reaches the room's west edge

/* ── THE GROUND: one painted sheet a square (0 = the room's own sand) ── */
const PAL = ['urban:RoadGeneric1a', 'dirt_2', 'urban:ConcreteSlab2a', 'bricks_1', 'wasteland', 'urban:WoodFlooring1a', 'dirt_4'], paint = new Uint8Array(NW * NW);
const paintOf = (ch, x, y) => (ch === 'r' || ch === 'R') ? 1 : ch === 'd' ? 2 : ch === 'c' ? 3 : (ch === 'p' || ch === 's' || /[1-4]/.test(ch)) ? 4 : ch === 'k' ? 5 : ch === 'x' ? 6 : (y > 102 && x < 45 && ch !== 'B') ? 7 : 0;   // (x, y) = the NEW frame's squares; 7 = the base's own dirt inside Area 51's fence
/* lane paint: the highway's lines (below, the new frame); a district's own flat paint is its file's (Runway 33: A.js) */
const line = (x0, z0, x1, z1, w, color) => marks.push({ k: 'line', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), w, color });

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

/* ── helpers for the open ground ── */
const P = (key, sx, sy, o) => props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {}));                    // on a square's middle (a blocker)
const Pm = (key, x, z, o) => props.push(Object.assign({ key, x: r2(x), z: r2(z) }, o || {}));                       // at a metre spot
const decWith = rnd => (key, sx, sy, o) => props.push(Object.assign({ key, x: r2(gc(sx) + (rnd() - 0.5) * 1.6), z: r2(gc(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {}));   // off the middle (decor)
const native = (race, sx, sy, face, say) => { const n = { x: gc(sx), z: gc(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* ══ THE DISTRICT FILES (2026-11-16, the one hook for the four district threads; the city's way, bake-disaster-city.js "THE DISTRICT FILES") ══
   docs/areas/desert/districts/<LETTER>.js: C The Circus · W Western Town · A Area 51 · G Giza. No district's content lives in this tool. The
   Highway (R), the layout's own squares (ground paint, rock, the base's fence), the cacti, the scatter, the edges, the sky, the cars and the
   room's text stay here. Rules for the threads: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES".
   A file may export any of these hooks, each called with its own ctx:
     buildings(ctx)  its buildings (building())            furnish(ctx)  what stands inside them (put())
     ground(ctx)     everything on its open ground          pieces(ctx)   late pieces, after every district's ground
     doors(ctx)      its doors to other rooms (doors.push)
   and `dice` (the seed of its own dice) and `rooms(kit)` (the rooms behind its doors: bake-desert-insides.js reads that one).
   ctx = { id, C, N, gx, gc, r2, feat, props, doors, npc, marks, count, line, setRect, cell, pen, building, sheet, put, SOLID, P, Pm, dec, native,
           rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, PLAN, OLDP, plot, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS }.
   THE FRAME: a district file writes the FIRST BUILD's squares (gx / gc, 0..96); THE MOVE below carries every row a file made to where its block
   stands (MOVE, metres new - old; OFF, the same in squares: room square = home square + OFF). A row moves with the FILE that made it.
   THE ORDER AS BUILT (STAGES): the rows are written in the order the first build wrote them, so the split changed nothing in data.js. A
   district a stage does not name runs after the named ones, by letter.
   THE DICE: every file has its own (`dice`, ctx.rnd, ctx.dec), started where the one shared stream stood when that district's turn came in
   the first build; so one district's change never re-throws another's decor. The tool's own stream (the highway's decor, the cacti) starts
   where the four left it. The CACTI are thrown over the whole room AFTER the districts and stay off their pieces: a district's new piece can
   move cacti anywhere in the room. That is expected; a rebake settles it. */
const MOVE = { C: [-84, -42], W: [84, -42], A: [-84, 84], G: [84, 84] }, OFF = {}; Object.keys(MOVE).forEach(k => { OFF[k] = [(MOVE[k][0] + 84) / C, (MOVE[k][1] + 84) / C]; });
const DDIR = path.join(REPO, 'docs/areas/desert/districts');
const DISTRICTS = !fs.existsSync(DDIR) ? [] : fs.readdirSync(DDIR).filter(f => /^[A-Z]\.js$/.test(f)).sort().map(f => { const m = require(path.join(DDIR, f)); m._file = f[0]; if (!MOVE[m._file]) throw new Error('no block for district file ' + f); return m; });
const STAGES = { buildings: 'WCA', furnish: 'WAC', ground: 'CWAG', pieces: 'W', doors: 'ACG' };
const own = new Map(), paintOver = [], CTX = {};
const ctxOf = m => CTX[m._file] || (CTX[m._file] = (() => { const id = m._file; let s = m.dice != null ? m.dice >>> 0 : id.charCodeAt(0) * 7919; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    /* setPaint(sx, sy, sheet): one of the room's ground sheets (PAL; 'sand' = the room's own floor) on a home square of this file's block */
    const setPaint = (sx, sy, key) => { const i = key === 'sand' ? 0 : PAL.indexOf(key) + 1; if (key !== 'sand' && !i) throw new Error(id + '.js setPaint: not one of the ground sheets (' + PAL.join(', ') + '): ' + key);
        if (sx < 0 || sy < 0 || sx >= W || sy >= W || blockOf(sx, sy) !== id) throw new Error(id + '.js setPaint: square ' + sx + ', ' + sy + ' is not on its block'); paintOver.push([sx + OFF[id][0], sy + OFF[id][1], i]); };
    return { id, C, N, gx, gc, r2, feat, props, doors, npc, marks, count, line, setRect, cell, pen, building, sheet, put, SOLID, P, Pm, dec: decWith(rnd), native, rnd, setPaint,
        sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, PLAN, OLDP, plot, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS }; })());
const run = stage => { const ord = STAGES[stage] || '', rank = m => { const i = ord.indexOf(m._file); return i < 0 ? 99 : i; }, lists = [F, ARCH, props, npc, doors, marks];
    DISTRICTS.filter(m => typeof m[stage] === 'function').sort((a, b) => rank(a) - rank(b) || (a._file < b._file ? -1 : 1)).forEach(m => {
        const before = new Set(); lists.forEach(A => A.forEach(o => before.add(o)));
        m[stage](ctxOf(m));
        lists.forEach(A => A.forEach(o => { if (!before.has(o)) own.set(o, m._file); })); }); };

/* ── THE BUILDINGS of every district: its file's `buildings` hook (Western Town's fronts are W.js western()) ── */
run('buildings');
ARCH.forEach(feat);

/* ── THE INSIDES of the walk-in buildings: each district file's `furnish` hook ── */
run('furnish');


/* (THE ROAD district of the first build is gone: the highway and its pieces are authored in the new frame, below) */

/* ── THE CIRCUS · WESTERN TOWN · AREA 51 · GIZA: each district's open ground is its file's `ground` hook ── */
run('ground');


run('pieces');   // (Western Town's Meshy pieces: hitching rails, covered wagons, the water tower)
/* scattered off the grid: stones, skulls, the odd bone pile (nothing on a road) */
/* (2026-11-16, the Area 51 thread, noted on the board: `off` = Area 51's paved ground (the apron, Runway 33, the hangar's apron; room metres). A
   piece thrown there is dropped, never moved, so every other piece stands where it stood: dead trees and stones stood on the runway.) */
{ const off = [nx(2), nx(111), nx(38), nx(134)];
  feat({ k: 'scatter', key: 'cave_stone', n: 130, seed: 5, off }); feat({ k: 'scatter', key: 'skull', n: 26, seed: 6, off }); feat({ k: 'scatter', key: 'dead_snag', n: 22, seed: 7, off }); }

/* ── THE WAYS ── (the highway north to Disaster City and the Robbers' Tunnel are LINKS, written at the end; the bay door of Room 444 is siteRooms.entry).
   Each district's doors to other rooms are its file's `doors` hook (Hangar 18, the White Rooms, the storm drain: A · the tunnel, the Mandela Room: C ·
   the three ways into the Great Pyramid: G). */
run('doors');
/* ── THE MOVE: every row authored above stands in the first build's squares; its block goes to its new place whole (metres, new − old: MOVE,
   by THE DISTRICT FILES above). A row of the first build's Road district (the old highway strip) is dropped: the tool prints what it dropped. ── */
{ const blockAt = (x, z) => blockOf(Math.max(0, Math.min(W - 1, Math.floor((x + HALF) / C + 1e-6))), Math.max(0, Math.min(W - 1, Math.floor((z + HALF) / C + 1e-6))));
  const dropped = [], stray = [];
  const move = (o, what) => {
      const mine = own.get(o);   // (a district file's row moves with its file's block; a row of the tool's own, the rock, by the block it stands on)
      if (o.wall && o.wall !== 'free') { const b = mine || (o.wall === 's' ? (o.x < 0 ? 'A' : 'G') : o.wall === 'e' ? (o.z < 0 ? 'W' : 'G') : o.wall === 'w' ? (o.z < 0 ? 'C' : 'A') : (o.x < 0 ? 'C' : 'W'));
          if (typeof o.x === 'number') o.x = r2(o.x + MOVE[b][0]); if (typeof o.z === 'number') o.z = r2(o.z + MOVE[b][1]); return true; }
      const ax = o.x != null ? o.x : o.x0 != null ? (o.x0 + o.x1) / 2 : o.pts ? o.pts[0][0] : o.arc ? o.arc.x : null, az = o.z != null ? o.z : o.z0 != null ? (o.z0 + o.z1) / 2 : o.pts ? o.pts[0][1] : o.arc ? o.arc.z : null;
      if (ax == null || az == null) return true;
      const at = blockAt(ax, az), b = mine || at; if (mine && at !== mine) stray.push(mine + '.js ' + what + ':' + (o.id || o.key || o.k || o.race)); if (b === 'R') { dropped.push(what + ':' + (o.key || o.k || o.race || o.id)); return false; }
      const dx = MOVE[b][0], dz = MOVE[b][1];
      ['x', 'x0', 'x1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dx); }); ['z', 'z0', 'z1'].forEach(k => { if (typeof o[k] === 'number') o[k] = r2(o[k] + dz); });
      if (o.pts) o.pts = o.pts.map(q => [r2(q[0] + dx), r2(q[1] + dz)].concat(q.slice(2))); if (o.arc) { o.arc = Object.assign({}, o.arc, { x: r2(o.arc.x + dx), z: r2(o.arc.z + dz) }); }
      return true; };
  const sweep = (A, what) => { for (let i = A.length - 1; i >= 0; i--) if (!move(A[i], what)) A.splice(i, 1); };
  sweep(F, 'row'); sweep(props, 'prop'); sweep(npc, 'unit'); sweep(doors, 'door'); sweep(marks, 'mark');
  if (dropped.length) console.log('dropped with the old Road district: ' + dropped.join(' '));
  if (stray.length) console.warn('OUTSIDE ITS BLOCK (a district file\'s row that stands on another block\'s squares; it moved with its own file): ' + stray.join(' ')); }

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
paintOver.forEach(q => { paint[q[1] * NW + q[0]] = q[2]; });   // a district file's own ground (ctx.setPaint)
count.props = props.length; count.features = F.length; count.doors = doors.length; count.natives = npc.length; count.marks = marks.length;

/* ── the rooms ── */
/* THE AIR BY DISTRICT (2026-11-16, the Western Town thread; the Woods' way, three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district file
   may export `airZones(ctx)` = [{ sx0, sy0, sx1, sy1 (its HOME squares), kind, color, n, speed, wind }]. With no zone from any file the shell
   line is what it was (the site's own dust). With one, the room's old air is kept as a last zone over the whole room (the site row's values). */
const AIR = [].concat(...DISTRICTS.filter(m => typeof m.airZones === 'function').map(m => m.airZones(ctxOf(m)).map(z => { const o = OFF[m._file], q = Object.assign({}, z, { x0: nx(z.sx0 + o[0]), z0: nx(z.sy0 + o[1]), x1: nx(z.sx1 + o[0]), z1: nx(z.sy1 + o[1]) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const SP = { x: nx(42), z: nx(1) };

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3, wave A, the Desert row) ══════════════
   Everything above builds the Desert in THE HOME FRAME, the 12 x 12 room of the Highway (squares 0..144, nx / nc). Here the result is stood where
   the One World map puts it (docs/plans/one-world/plots.json; the mover = ow-move.js). v13 stands the four districts apart, so each is a room:
     THE CIRCUS (C)      -> its own room at world plots 6..8 x 21..23 (3 x 3)                  `site_prebuilt_area51_ow_circus`
     WESTERN TOWN (W)    -> its own room at -4..-1 x 26..29 (4 x 4)                             `site_prebuilt_area51_ow_town`
     AREA 51 (A)         -> its own room at 2..5 x 33..36 (4 x 4); it KEEPS the old room id    `site_prebuilt_area51_desert`
                            (every door of Hangar 18, the White Rooms and the D.U.M.B. that names the old room lands on an Area 51 door: hangar, ward, stormdrain)
     GIZA (G)            -> its own room at 13..16 x 29..32 (4 x 4)                             `site_prebuilt_area51_ow_giza`
     THE HIGHWAY (R)     -> RETIRED (BUILD_PLAN phase 4.2, 2026-11-17): the Desert Highway is four route rooms between the districts
                            (74 plots, `site_ow_dh1`..`dh4`, bake-route.js) + the Badlands Highway R9 from the city.  was `site_prebuilt_area51_highway`
   No two districts touch on the map, so none joins another (the room-splitting rule 2); the Highway's legs that do touch them are 4.2's to build.
   A block moves WHOLE (all its plots the same way), so nothing on it is a stray and no fence is cut at a plot line. What is laid again is the
   tool's own: the room-wide scatter (a share a room), the paint and the lane paint cut a room at a time, the air, the seams.
   THE SEAMS (4.2): each district's room meets every road that reaches it (the Desert Highway's legs, R8 the Ranch Road, R9 the Badlands Highway)
   with an open seam (`way: 'open'`, room-splitting rule 6, mondo 11-17 "open ground has no portal"); its id is the world seam id, the same on the
   route room's side (bake-route.js writes that one from the route's spec). Rules: docs/notes/areas-complexes.md "ONE WORLD, HOW A ZONE MOVES" + "THE DESERT, THE ONE WORLD MOVE". */
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
const HOMEP = PLAN.plots.map(p => ({ id: p.id, x: +p.id.slice(1, 3), y: +p.id.slice(4, 6), name: p.name, district: p.district, level: 0 })), pById = {};
HOMEP.forEach(p => { pById[p.id] = p; });
/* a block moves whole, so the fences go with it uncut (the mover cuts a rail / wall at every plot line, for plots that part): they are moved here by the
   mover's own anchor rule, the rest by the mover */
const FENCE = f => (f.k === 'rail' || f.k === 'wall') && f.x0 != null;
const MOVER = require('./ow-move.js')({ cols: 12, rows: 12, cell: ncell, fill: '.', plots: HOMEP, features: F.filter(f => !FENCE(f)), props, npc, doors });
const v13 = letter => { const d = PJ.districts.find(q => q.today && q.today.room === ROOM && q.today.districts.indexOf(letter) >= 0); if (!d) throw new Error('plots.json has no Desert district ' + letter);
    return d.plots.map(q => { const p = pById[q.was]; if (!p || p.name !== q.n || p.district !== letter) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); return { id: q.was, wx: q.x, wy: q.y }; }); };
const R_HWY = 'site_prebuilt_area51_highway', R_CIRC = 'site_prebuilt_area51_ow_circus', R_TOWN = 'site_prebuilt_area51_ow_town', R_A51 = ROOM, R_GIZA = 'site_prebuilt_area51_ow_giza';
const BLOCK = { C: [12, 12, 48, 48], W: [96, 12, 144, 60], A: [0, 96, 48, 144], G: [96, 96, 144, 144] };   // each district's squares in the home frame (x0, y0, x1, y1)
/* a seam: the district's plot + side, the Highway's plot across it, `along` = squares from the plots' shared corner to the road's middle line, `open` = how wide */
const STAND = [
    { id: R_CIRC, part: 'ow_circus', letter: 'C', label: 'THE CIRCUS', sub: 'THE DESERT · THE BIG TOP · 9 PLOTS', lines: O_CARN.l,
      parti: 'A circus pitched on the open sand, nine plots: the ticket booth, the Big Top, the wheel, the midway, the fence round all of it, and the road in from the Highway.',
      seams: [
        { side: 'E', at: [9, 23.04], room: 'site_ow_dh4', open: 16, label: 'THE DESERT HIGHWAY · EAST', sub: 'EXIT 2 · EAST TO GIZA', desc: 'The highway runs east out of the circus lot, then south across the sand to the pyramids.' },
        { side: 'W', at: [6, 23.04], room: 'site_ow_dh1', open: 16, label: 'THE DESERT HIGHWAY · WEST', sub: 'EXIT 2 · WEST TO WESTERN TOWN', desc: 'The highway runs west past a lone door and a bus stop to the western town.' },
        { side: 'N', at: [6.96, 21], room: 'site_ow_r9', open: 16, label: 'THE BADLANDS HIGHWAY', sub: 'NORTH TO DISASTER CITY', desc: 'The highway runs north through the badlands, past the last gas and a motel, to the city.' } ] },
    { id: R_TOWN, part: 'ow_town', letter: 'W', label: 'WESTERN TOWN', sub: 'THE DESERT · MAIN STREET · 16 PLOTS', lines: [],
      parti: 'A western town of sixteen plots: Main Street, the saloon, the bank, the jail, the church on its rise, Boot Hill, the mine in the rock, the corral and the wagon camp.',
      seams: [
        { side: 'N', at: [-1.25, 26], room: 'site_ow_dh1', open: 16, label: 'THE DESERT HIGHWAY · NORTH', sub: 'EXIT 3 · EAST TO THE CIRCUS', desc: 'Main Street turns to asphalt at the town line: the highway north, then east to the circus.' },
        { side: 'N', at: [-3.1, 26], room: 'site_ow_r8', open: 11, label: 'THE RANCH ROAD', sub: 'NORTH TO THE RANCH', desc: 'A dirt road north out of town, past a crop circle and the cattle, to the ranch.' },
        { side: 'S', at: [-0.4167, 30], room: 'site_ow_dh2', open: 16, label: 'THE DESERT HIGHWAY · SOUTH', sub: 'EXIT 3 · SOUTH TO AREA 51', desc: 'The canyon road meets the highway: south past the trailers to the base.' } ] },
    { id: R_A51, part: 'desert', letter: 'A', label: 'AREA 51', sub: 'THE DESERT · THE BASE · 16 PLOTS', lines: O_GATE.l.concat(O_LINE.l),
      parti: 'A fenced base of sixteen plots on the open sand: the gate, the apron, the tower, Runway 33, the crater, Hangar 18 and the yard of the White Rooms.',
      seams: [
        { side: 'W', at: [2, 34.04], room: 'site_ow_dh2', open: 16, label: 'THE DESERT HIGHWAY · WEST', sub: 'THE BASE ROAD · NORTH TO WESTERN TOWN', desc: 'The base road runs west to the highway, the trailers and the town.' },
        { side: 'E', at: [6, 33.3], room: 'site_ow_dh3', open: 16, label: 'THE DESERT HIGHWAY · EAST', sub: 'THE BASE ROAD · EAST TO GIZA', desc: 'The base road runs east past a caravan stop to the pyramids.' } ] },
    { id: R_GIZA, part: 'ow_giza', letter: 'G', label: 'GIZA', sub: 'THE DESERT · THE PYRAMIDS · 16 PLOTS', lines: O_GIZA.l,
      parti: 'Three pyramids and the Sphinx on sixteen plots of sand: the causeway, the dig, the obelisks, the oasis, the Tomb Door and the Great Pyramid over four plots.',
      seams: [
        { side: 'N', at: [13.5, 29], room: 'site_ow_dh4', open: 16, label: 'THE DESERT HIGHWAY · NORTH', sub: 'THE GIZA ROAD · NORTH TO THE CIRCUS', desc: 'The causeway turns to road and runs north to the circus.' },
        { side: 'W', at: [13, 32.04], room: 'site_ow_dh3', open: 16, label: 'THE DESERT HIGHWAY · WEST', sub: 'THE GIZA ROAD · WEST TO AREA 51', desc: 'The road runs west past a caravan stop to the fenced base.' },
        /* THE COAST + THE CAUSEWAY (2026-11-17, One World 4.3, the 4.3 thread's seams, re-written as `seams` rows by the 4.2 thread): R10 the Coast Road
           comes in from the north on Giza's P10-08 (world 15,29), west of the pyramid on the line between 15 and 16; R11 the Delta Causeway from the
           east on P11-11 (world 16,32), on the line between rows 31 and 32. Their side is the route kit's. */
        { side: 'N', at: [15.5, 29], room: 'site_ow_r10', open: 11, label: 'THE COAST ROAD', sub: 'NORTH ALONG THE SEA · TO THE BEACH', desc: 'A dirt road runs north off the sand, the sea on its right the whole way.' },
        { side: 'E', at: [17, 32], room: 'site_ow_r11', open: 11, label: 'THE DELTA CAUSEWAY', sub: 'EAST OVER THE REED FLATS · TO GÖBEKLI TEPE', desc: 'A dirt road runs east off the sand over the reed flats.' } ] },
];
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, FACE = { N: 180, E: 270, S: 0, W: 90 }, OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };   // a free door's face = the way its opening faces, INTO its plot (ow-move.js)
const crop = (R, homeSq) => { const out = new Uint8Array(R.W * R.D); for (let y = 0; y < R.D; y++) for (let x = 0; x < R.W; x++) { const e = R.plotOfSq(x, y); if (!e || !e.home) continue; out[y * R.W + x] = homeSq(e.home.x * N + x - e.col * N, e.home.y * N + y - e.row * N); } return out; };
const deltaAt = (R, x, z) => { const q = R.toRoom(x, z); return q ? [q[0] - x, q[1] - z] : null; };
const shiftLine = (o, d) => Object.assign({}, o, { x0: r2(o.x0 + d[0]), z0: r2(o.z0 + d[1]), x1: r2(o.x1 + d[0]), z1: r2(o.z1 + d[1]) });
const SCATTER = F.filter(f => f.k === 'scatter' && f.x == null);   // the room-wide rows (the stones, skulls, snags; `off` = Area 51's paved ground): a share a room
const ROOMS_OUT = [], STRAYS = [];
let HWY = null;
STAND.forEach(S => {
    const R = MOVER.room(v13(S.letter)); R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    const fences = F.filter(FENCE).map(f => { const a = MOVER.anchor(f), d = deltaAt(R, a[0], a[1]); return d ? MOVER.shifted(f, d[0], d[1]) : null; }).filter(Boolean);
    const mk = marks.map(m => { const d = deltaAt(R, (m.x0 + m.x1) / 2, (m.z0 + m.z1) / 2); return d ? shiftLine(m, d) : null; }).filter(Boolean);
    const air = AIR.map(z => { const d = deltaAt(R, (z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2); return d ? shiftLine(z, d) : null; }).filter(Boolean);
    const share = R.order.length / 144, dA = S.letter === 'A' ? deltaAt(R, nc(10), nc(120)) : null;
    const scatter = SCATTER.map(f => { const o = Object.assign({}, f, { n: Math.max(1, Math.round(f.n * share)) }); if (o.off) { if (dA) o.off = [r2(o.off[0] + dA[0]), r2(o.off[1] + dA[1]), r2(o.off[2] + dA[0]), r2(o.off[3] + dA[1])]; else delete o.off; } return o; });
    /* THE SEAMS (BUILD_PLAN 4.2): an open wall door on the district's side for every leg of the Desert Highway (and R8, R9) that meets it; the route
       room (bake-route.js) writes its pair, same id. `at` = the world plot point where the road's line crosses the room's wall (the route spec's line) */
    const mm = v => (v < 0 ? 'm' + (-v) : '' + v), seamDoors = [], ways = [];
    S.seams.forEach(sm => { const sd = sm.side, ns = sd === 'N' || sd === 'S', ax = sm.at[0] - R.wx, ay = sm.at[1] - R.wy;
        const onEdge = sd === 'N' ? ay === 0 : sd === 'S' ? ay === R.rows : sd === 'W' ? ax === 0 : ax === R.cols;
        const col = Math.min(R.cols - 1, Math.floor(ax)), row = Math.min(R.rows - 1, Math.floor(ay)), e = R.order.find(q => q.col === col && q.row === row);
        if (!onEdge || !e) throw new Error(S.id + ': the seam at ' + sm.at + ' is not on the room\'s ' + sd + ' wall');
        const id = ns ? 'ow_h_' + mm(e.wx) + '_' + mm(sd === 'N' ? e.wy : e.wy + 1) : 'ow_v_' + mm(sd === 'W' ? e.wx : e.wx + 1) + '_' + mm(e.wy);
        const d = { id, wall: sd.toLowerCase() }; if (ns) d.x = R.gx(ax * N); else d.z = R.gz(ay * N);
        seamDoors.push(Object.assign(d, { way: 'open', passage: { w: sm.open }, label: sm.label, sub: sm.sub, action: { room: sm.room, at: id }, desc: sm.desc }));
        ways.push({ side: sd.toLowerCase(), at: ns ? d.x : d.z }); });
    /* the spawn: two squares in from the first seam */
    const s0 = S.seams[0], sd = s0.side, ns = sd === 'N' || sd === 'S', qx = Math.min(R.W - 1, Math.floor((s0.at[0] - R.wx) * N)), qy = Math.min(R.D - 1, Math.floor((s0.at[1] - R.wy) * N));
    const spSq = [qx - SIDE4[sd][0] * 2, qy - SIDE4[sd][1] * 2];
    const doorsOut = R.doors.map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; return o; }).concat(seamDoors);
    ROOMS_OUT.push({ S, R, world: true, W: R.W, D: R.D, HX: R.HX, HZ: R.HZ, names: R.names, mask: null, cols: R.cols, rows: R.rows,
        paint: crop(R, (x, y) => paint[y * NW + x]), marks: mk, traffic: [], features: R.features.concat(fences, scatter), doors: doorsOut, props: R.props, npc: R.npc, air, lines: S.lines,
        sp: { x: R.gcx(spSq[0]), z: R.gcz(spSq[1]), face: FACE[sd] }, ways,
        gx0: R.gx(0), gz0: R.gz(0), gcx0: R.gcx(0), gcz0: R.gcz(0) });
});
/* THE HIGHWAY, RETIRED (BUILD_PLAN 4.2, 2026-11-17): its 87 plots are still laid out here so the count below holds, but the room is NOT written:
   the Desert Highway is the route kit's four legs now (docs/areas/routes/DH1..DH4, `node bake-route.js DH1 DH2 DH3 DH4`) and the Badlands Highway
   R9 in from the city. What stood on the Highway was carried onto them by hand in their hooks (the gas station + LAST GAS + the city limit -> R9; the
   Door + the bus stop -> DH1; the trailers, the conspiracy theorist and the wreck -> DH2; the last signpost -> DH4; the cars -> each highway's own
   traffic). Dropped with the room: its mesas, cacti and rocks (the route kit grows its own by the ground), the Exit 3 overpass (no road crosses now)
   and its nine gantries (each leg has its own). data.js DOOR_HQ.retired sends an old save in it to R9. */
{ const list = HOMEP.filter(p => p.district === 'R').map(p => ({ id: p.id, wx: p.x, wy: p.y })), R = MOVER.room(list);
  if (R.cols !== 12 || R.rows !== 12 || R.order.some(e => e.dx || e.dz)) throw new Error('the Highway moved: it must stand as it stood');
  R.strays.forEach(t => STRAYS.push('THE HIGHWAY: ' + t));
  const inBlock = (x, y) => Object.keys(BLOCK).some(k => { const b = BLOCK[k]; return x >= b[0] && x < b[2] && y >= b[1] && y < b[3]; });
  const fences = F.filter(FENCE).filter(f => { const a = MOVER.anchor(f), hp = MOVER.homePlot(a[0], a[1]); return hp && hp.district === 'R'; });
  const mk = marks.filter(m => { const hp = MOVER.homePlot((m.x0 + m.x1) / 2, (m.z0 + m.z1) / 2); return hp && hp.district === 'R'; });
  const air = AIR.filter(z => { const hp = MOVER.homePlot((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2); return hp && hp.district === 'R'; });
  const scatter = SCATTER.map(f => { const o = Object.assign({}, f, { n: Math.max(1, Math.round(f.n * list.length / 144)) }); delete o.off; return o; });
  const mesas = []; Object.keys(BLOCK).forEach(k => { const b = BLOCK[k], w = (b[2] - b[0]) * C, d = (b[3] - b[1]) * C, x = r2(nx(b[0]) + w / 2), z = r2(nx(b[1]) + d / 2);
      mesas.push({ k: 'plateau', x, z, w, d, h: 5.25, edge: 0.5 }, { k: 'plateau', x, z, w: w - 2 * C, d: d - 2 * C, h: 8.75, edge: 0.5 }); });
  const hp = crop(R, (x, y) => inBlock(x, y) ? 0 : paint[y * NW + x]);
  const doorsOut = R.doors.map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; return o; });
  HWY = ({ S: { id: R_HWY, part: 'highway', label: 'THE DESERT', sub: 'THE HIGHWAY · FOUR EXITS · 87 PLOTS', lines: [], hwy: true,
        parti: 'A highway across open sand, eighty-seven plots: in from Disaster City, a rest stop, the trailers, a lone door by the frontage road, and off its exits the roads out to a circus, a western town, a fenced base and three pyramids, each a long way from the next.' },
      R, world: false, W: R.W, D: R.D, HX: R.HX, HZ: R.HZ, names: R.names, mask: R.mask, cols: 12, rows: 12, paint: hp, marks: mk, traffic: TRAFFIC, features: R.features.concat(fences, scatter, mesas),
      doors: doorsOut, props: R.props, npc: R.npc, air, lines: [], sp: { x: SP.x, z: SP.z, face: 180 }, ways: [], gx0: nx(0), gz0: nx(0), gcx0: nc(0), gcz0: nc(0) }); }
if (STRAYS.length) console.log('STRAYS (a piece across two plots that no longer stand the same way):\n  ' + STRAYS.join('\n  '));
/* every piece of the home room stands in exactly one of the four rooms, or stood on the Highway (retired above; counted so nothing goes missing unseen) */
{ const ALL = ROOMS_OUT.concat([HWY]), n = k => ALL.reduce((s, o) => s + o[k].length, 0), fe = ALL.reduce((s, o) => s + o.features.length, 0) - ALL.length * SCATTER.length - 8, nSeam = STAND.reduce((s, S) => s + S.seams.length, 0);
  if (n('props') !== props.length) throw new Error('props: ' + n('props') + ' of ' + props.length + ' stand in a room');
  if (n('npc') !== npc.length) throw new Error('natives: ' + n('npc') + ' of ' + npc.length + ' stand in a room');
  if (fe !== F.length - SCATTER.length) throw new Error('features: ' + fe + ' of ' + (F.length - SCATTER.length) + ' stand in a room');
  if (n('doors') - nSeam !== doors.length) throw new Error('doors: ' + (n('doors') - nSeam) + ' of ' + doors.length);
  if (n('marks') !== marks.length) throw new Error('marks: ' + n('marks') + ' of ' + marks.length);
  console.log('THE HIGHWAY (retired, not written): ' + HWY.props.length + ' props, ' + HWY.npc.length + ' natives, ' + HWY.features.length + ' features, ' + HWY.doors.length + ' doors left with it'); }
ROOMS_OUT.forEach(o => console.log(o.S.id + ' ' + JSON.stringify({ box: o.cols + 'x' + o.rows, plots: o.names.length, props: o.props.length, features: o.features.length, doors: o.doors.length, natives: o.npc.length, marks: o.marks.length, wx: o.world ? o.R.wx : '-', wy: o.world ? o.R.wy : '-' })));

/* ── the rooms' text ── */
const EDGE_DRY = "plants: { kinds: ['saguaro'], p: 0.02, h: [3.8, 6.4] }";
const M = [];
M.push("        /* DESERT64-BEGIN — THE DESERT ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the Circus, Western Town, Area 51 and Giza stand at their One World places as rooms of their own; the Highway is retired, its legs are route rooms, bake-route.js DH1-DH4): written by `node bake-desert.js` from docs/areas/desert/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit the tool, a district file or the layout and rerun. */");
ROOMS_OUT.forEach(o => { const S = o.S, w = r2(2 * o.HX), d = r2(2 * o.HZ);
    const atmos = o.air.length ? " atmos: " + J({ kind: 'dust', color: 0xd8d0c0, n: Math.max(30, Math.round(140 * o.names.length / 144)), zones: o.air.concat([{ x0: -o.HX, z0: -o.HZ, x1: o.HX, z1: o.HZ, kind: 'dust', color: 0xd8d0c0, n: Math.max(30, Math.round(140 * o.names.length / 144)) }]) }) + "," : "";
    M.push("        " + S.id + ": {");
    M.push("            label: " + J(S.label) + ",");
    M.push("            sub: " + J(S.sub) + ",");
    M.push("            kind: 'box', site: 'prebuilt_area51', part: " + J(S.part) + ",");
    if (o.world) { M.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
        M.push("            world: { hub: 'desert', layer: 'surface', wx: " + o.R.wx + ", wy: " + o.R.wy + " },"); }
    M.push("            shell: hqAncientShell({ w: " + w + ", d: " + d + ", h: 20, wallH: 20, floor: 'desert', apron: 'desert', skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + o.sp.x + ", z: " + o.sp.z + ", y: 5.0 },");
    M.push("                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xfff0d0, ambient: 0.62 }," + atmos);
    M.push("                                    sky: { night: 0, tint: 0xd9b46a, tintAmt: 0.35, stars: 0.5, nebula: 0.4, day: 1, clouds: 0.05, fog: { color: 0xd8b370, amount: 0.55, top: 0.05, band: 0.45, density: 0.012 }, scenery: 'none'" + (o.world ? ", landmarks: 'world'" : "") + " },");
    M.push("                                    look: HQ_ROOM_LOOKS.plateau }),");
    M.push("            parti: " + J(S.parti) + ",");
    M.push("            typology: 'grid',");
    M.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + o.cols + ", nx: " + o.cols + ", nz: " + o.rows + (o.mask ? ", mask: " + J(o.mask) : "") + ", names: " + J(o.names) + " },");
    M.push("            terrain: {");
    M.push("                res: 1.75, floor: 'desert', cliff: 'rock_wall_1', path: 'dirt_2',");
    M.push("                noise: { amp: 0.08, scale: 9 },");
    if (o.world) {
        M.push("                /* THE HORIZON READS THE MAP: the land past every line is the world's own ground there, plot by plot (three-renderer.js _hqEdgeLandFn `world`); the room's saguaros run on past it */");
        M.push("                backdrop: false, edges: { world: true, reach: 440, ways: " + J(o.ways) + ", " + EDGE_DRY + " },");
    } else {
        /* THE EDGES THAT FIT THE MAP (2026-11-16, mondo: "in desert, its surrounded by mountains but that's not what's actually next to it on the map, so it doesn't
           make any sense"): north the city's sand, west the scrub, south sand and far rock tables, east the bay then Leylines' sand. The Highway's room is not on
           the world grid yet (BUILD_PLAN 4.2 re-routes it), so it keeps the sides it had. */
        M.push("                /* THE EDGES THAT FIT THE MAP: north the city's sand, west the scrub, south sand and far rock tables, east the bay then Leylines' sand (three-renderer.js _hqBuildEdgeLand) */");
        M.push("                backdrop: false, edges: { reach: 440, n: { kind: 'desert', " + EDGE_DRY + " }, w: { kind: 'scrub' }, s: { kind: 'mesa', " + EDGE_DRY + " }, e: { kind: 'desert', beyond: { kind: 'coast', d: 120, len: 40 }, cap: { kind: 'mesa', at: 's', off: 210, len: 90 }, " + EDGE_DRY + " } },");
    }
    M.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + o.gcx0 + ", z0: " + o.gcz0 + ", nx: " + o.W + ", nz: " + o.D + ", d: '" + Buffer.from(o.paint).toString('base64') + "' },");
    M.push("                marks: " + J(o.marks) + ",");
    if (o.traffic.length) { M.push("                /* THE HIGHWAY'S CARS (the city's own traffic system): in from the west along the eastbound side, south to the end, east to Giza; and back */");
        M.push("                traffic: " + J(o.traffic) + ","); }
    M.push("                features: [");
    o.features.forEach(f => M.push("                    " + J(f) + ","));
    M.push("                ],");
    M.push("            },");
    M.push("            doors: [");
    o.doors.forEach(dr => M.push("                " + J(dr) + ","));
    M.push("            ],");
    M.push("            counters: [],");
    M.push("            props: [");
    for (let i = 0; i < o.props.length; i += 4) M.push("                " + o.props.slice(i, i + 4).map(J).join(", ") + ",");
    M.push("            ],");
    M.push("            agents: [],");
    M.push("            npcSpots: " + J(o.npc) + ",");
    M.push("            onlineSpots: [],");
    M.push("            lines: " + J(o.lines) + ",");
    M.push("            spawn: { x: " + o.sp.x + ", z: " + o.sp.z + ", face: " + o.sp.face + " },");
    M.push("        },"); });
M.push("        /* DESERT64-END */");
const block = M.join('\n') + '\n';
/* the ends the data.js rows outside the block must agree with (DOOR_HQ.links + siteRooms.entry): the tool refuses to write when one has drifted */
const GZ = ROOMS_OUT.find(o => o.S.id === R_GIZA), gz = GZ.R.toRoom(r2(gx(73) - 0.5 + MOVE.G[0]), r2(gx(79) + MOVE.G[1])), gzE = GZ.R.toRoom(nx(140), r2(gx(69) + MOVE.G[1]));
const ENDS = { gobekli_giza: { part: 'ow_giza', wall: 'e', z: gzE[1] }, bay444: { room: R_GIZA, wall: 'free', x: gz[0], z: gz[1], face: 270 } };
console.log(JSON.stringify(count)); console.log('ends ' + JSON.stringify(ENDS));
const WANT = [
    ["b: { site: 'prebuilt_area51', part: 'ow_giza', wall: 'e', z: " + ENDS.gobekli_giza.z + ",", 'link gobekli_giza end b'],
    ["prebuilt_giza: { room: '" + R_GIZA + "', door: { id: 'bay', wall: 'free', x: " + ENDS.bay444.x + ", z: " + ENDS.bay444.z + ", face: 270 } }", 'siteRooms.entry.prebuilt_giza'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
{ const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0].replace(/ +/g, ' ')) < 0);
  if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at these rooms yet (see the rows above)'); } }
if (DRY) { ROOMS_OUT.forEach(o => console.log(o.S.id + ' seams ' + JSON.stringify(o.doors.filter(d => /^ow_/.test(d.id)).map(d => [d.id, d.wall, d.x, d.z, d.face])) + ' spawn ' + JSON.stringify(o.sp))); process.exit(0); }
const END = '        /* DESERT64-END */\n', b0 = src.indexOf('        /* DESERT64-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_area51_flightline: {', a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOMS_OUT.map(o => o.S.id).join(', ') + ' written (' + block.length + ' bytes)');
