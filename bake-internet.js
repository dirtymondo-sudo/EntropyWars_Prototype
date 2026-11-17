#!/usr/bin/env node
/* bake-internet.js — THE INTERNET ON PLOTS (2026-11-17, One World phase 4.4, BUILD_PLAN row 4.4: "the Internet (36)"; mondo OK'd the four
   districts 11-17: "that is okay"). One room, 6 x 6 plots of 12 x 12 squares (252 m a side), NO GROUND: every plot is a tile hanging over
   a glowing grid at its own height (the Astral Realm's machinery: data.js terrain.void + float plateaus; nothing new in the engine).
   The Internet is "beyond" on the One World sheet, beside the Astral Realm; you come in through the screen in the D.U.M.B.'s Control Room
   (link `dumb_internet`, way `screen`). Four districts:
     S THE SERVER FARM (north-west, 9 plots: ONE floor, the data hall, aisles of racks), F THE FEED (north-east: the boulevard of giant
     screens), B THE FORUMS (south-east: plazas of message boards), D THE DARK WEB (south-west: underneath, sinking to the lowest tile).
   Reads docs/areas/internet/layout.json (written by docs/plans/world-zones/draw-internet.js: every plot's name, district, level, ports and
   the 72 x 72 square map) and writes the room `site_prebuilt_internet_web` into data.js between INTERNET36-BEGIN / INTERNET36-END.
   `node bake-internet.js` writes; `--dry-run` prints the counts; `INTERNET_DUMP=1` prints the walked map. Never hand-edit between the
   markers: edit this tool, the layout or a district file and rerun. Notes: docs/notes/areas-complexes.md "THE INTERNET ON PLOTS".

   THE DISTRICT FILES: what stands in a district is written in docs/areas/internet/districts/<S F B D>.js, one thread a file. This tool keeps
   what is shared: the plan, the tiles and their heights, the bridges and the floating steps, the void, the paint, the way in, the sky, the
   checks. A district file may export plan(ctx), build(ctx), dress(ctx), people(ctx), airZones(ctx) (the Astral Realm's file API).

   THE SQUARE MAP: '.' = open sky (the void: a fall puts you back on the last ground). Everything else is a tile:
   s the data hall's raised floor, a an aisle, f the Feed's glass, v the boulevard, b a forum plaza, p a forum walk, d the Dark Web's black
   tile, x a dark walk, k a bridge square (a plot's edge squares at a narrow port: the bridge / the floating steps to the next plot).
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   THE HEIGHTS: one height a plot (layout `level`, 1 level = 1.75 m). A NARROW join of one level = a bridge (a float plateau over the two
   edge squares); of two levels = a flight of floating steps. A WIDE join (the data hall, the boulevard) = the two floors run into each other.
   THE WALKS: the a / v / p / x / k squares. Nothing that blocks may stand on one (the tool refuses it). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/internet/layout.json'), 'utf8'));
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = N * GX, Hh = N * GY, HALF = W * C / 2, LEVEL = 1.75;
const ROOM = 'site_prebuilt_internet_web', SITE = 'prebuilt_internet', PART = 'web';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const cell = PLAN.cells.map(r => r.split(''));
if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error('layout.json cells: want ' + Hh + ' rows of ' + W);
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.id); p.base = r2(p.level * LEVEL); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + x + '-0' + y];
const plotAt = (sx, sy) => Pxy(Math.max(0, Math.min(GX - 1, Math.floor(sx / N))), Math.max(0, Math.min(GY - 1, Math.floor(sy / N))));
const distAt = (sx, sy) => plotAt(sx, sy).d, baseAt = (sx, sy) => plotAt(sx, sy).base;
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== '.';
const WALKS = 'avpxk', isWalk = (x, y) => open(x, y) && WALKS.includes(cell[y][x]);
const GROUND = { S: 's', F: 'f', B: 'b', D: 'd' }, WALK = { S: 'a', F: 'v', B: 'p', D: 'x' };
const F = [], props = [], npc = [], counters = [], ARCH = [], count = {}, taken = new Set(), errs = [], strays = [];
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── placing things (the Astral Realm's rules). A blocker stands on a square's middle (P / put), never on a walk, never two on one square;
   decor sits off the middle (dec / at); people stand on ground (native). `put` and `native` take the free ground square NEAREST the asked one. ── */
let curD = null;
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= Hh) { errs.push(what + ' off the map at ' + sx + ',' + sy); return false; }
    if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (!open(sx, sy)) { errs.push(what + ' stands over the void at ' + sx + ',' + sy); return false; }
    if (!shared) { if (isWalk(sx, sy)) errs.push(what + ' blocks the walk at ' + sx + ',' + sy); if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); }
    return true; }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {})); };
const freeG = (sx, sy) => open(sx, sy) && !isWalk(sx, sy) && !taken.has(sx + ':' + sy);
function nearest(p, lx, ly, span) { let best = null;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = p.sx + x, Y = p.sy + y;
        const ok = span === 2 ? (freeG(X, Y) && freeG(X + 1, Y) && freeG(X, Y + 1) && freeG(X + 1, Y + 1) && x < N - 1 && y < N - 1) : freeG(X, Y); if (!ok) continue;
        const d = (x - lx) * (x - lx) + (y - ly) * (y - ly); if (!best || d < best[0]) best = [d, X, Y]; }
    if (!best) { errs.push('no free ground on ' + p.id + ' near ' + lx + ',' + ly); return null; } return [best[1], best[2]]; }
const sayRow = (n, say) => { if (say) n.say = say; return n; };

/* ── the pieces a district draws itself (arch rows: boxes, cylinders, quads, roofs, signs; the Astral Realm's helper). Every drawn part
   carries a little light of its own: the room is a night with no sun ── */
function sheet() {
    const Pp = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (o.glow == null) o.glow = 0.3; Pp.push(o); return o; };
    return { P: Pp,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        cone: (x, y, z, r, rTop, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, r2: rTop, h }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h, seg: 10, rings: 3 }, key, tint, o),
        quad: (x, y, z, w, h, ry, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], ry: ry || 0 }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [x, y, z], size: [w, h, d] }, key, tint, o),
        /* words on a panel (a `txt:` sheet): fg / bg are CSS colours, font serif | sans | mono | stencil */
        sign(words, x, y, z, w, h, fg, bg, font, o) { Pp.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + (font || 'sans'), uv: 'fit', kind: 'wall', glow: 0.9 }, o || {})); } };
}

/* ── THE DISTRICT FILES ── */
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/internet/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/internet/districts/' + k + '.js'); });
const CTX = {}, POOLS = [];
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [p.sx + lx, p.sy + ly]; };
    const pt = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [r2(gx(p.sx) + lx * C), r2(gx(p.sy) + ly * C)]; };
    CTX[k] = { d: k, C, N, W, H: Hh, LEVEL, gx, gc, r2, PLAN, plot, plots: PLAN.plots.filter(p => p.d === k), cell, setRect, open, isWalk, distAt, baseAt, feat, props, npc, counters, taken, rnd, sq, pt, sheet,
        base: id => plot[id].base,
        put: (key, id, lx, ly, o) => { o = Object.assign({}, o || {}); const span = o.span; delete o.span; const s = nearest(plot[id], lx, ly, span); if (!s) return null;
            if (span === 2) { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(q => spot(s[0] + q[0], s[1] + q[1], key)); props.push(Object.assign({ key, x: gx(s[0] + 1), z: gx(s[1] + 1) }, o)); }
            else P(key, s[0], s[1], o); return s; },
        P: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); P(key, s[0], s[1], o); },
        dec: (key, id, lx, ly, o) => { const p = plot[id]; let s = sq(id, Math.round(lx), Math.round(ly)); if (!open(s[0], s[1])) { const q = nearest(p, lx, ly); if (!q) return; s = q; taken.delete(s[0] + ':' + s[1]); }
            spot(s[0], s[1], key, true); props.push(Object.assign({ key, x: r2(gc(s[0]) + (rnd() - 0.5) * 1.8), z: r2(gc(s[1]) + (rnd() - 0.5) * 1.8), face: Math.round(rnd() * 360) }, o || {})); },
        at: (key, id, lx, ly, o) => { const q = pt(id, lx, ly); props.push(Object.assign({ key, x: q[0], z: q[1] }, o || {})); },
        native: (race, id, lx, ly, face, say) => { const s = nearest(plot[id], lx, ly); if (!s) return; spot(s[0], s[1], race); npc.push(sayRow({ x: gc(s[0]), z: gc(s[1]), face: face || 0, race }, say)); },
        free: (id, lx, ly) => { const s = sq(id, lx, ly); return freeG(s[0], s[1]); },
        squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = cell[p.sy + ly][p.sx + lx]; if (ch !== '.' && (chars || 'sfbd').includes(ch)) out.push([lx, ly]); } return out; },
        rim: id => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const X = p.sx + lx, Y = p.sy + ly; if (!freeG(X, Y)) continue;
            const s = !open(X, Y - 1) ? 'N' : !open(X, Y + 1) ? 'S' : !open(X - 1, Y) ? 'W' : !open(X + 1, Y) ? 'E' : null; if (s) out.push([lx, ly, s]); } return out; },
        pool: (id, lx, ly, r, key) => { const p = plot[id], q = pt(id, lx, ly), ch = 'w';
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = p.sx + x, Y = p.sy + y; if (!open(X, Y) || isWalk(X, Y)) continue; if (Math.hypot(gc(X) - q[0], gc(Y) - q[1]) < r - 0.6) { if (taken.has(X + ':' + Y)) errs.push('a pool over a taken square at ' + X + ',' + Y); cell[Y][X] = ch; } }
            POOLS.push({ k: 'pool', x: q[0], z: q[1], r, y: p.base, depth: key === 'lava' ? 0.9 : 0.5, key: key || 'water', bank: 1 }); },
        /* a drawn piece standing on a plot: fn(a) draws into a sheet whose frame is the point (lx, ly), y = 0 on the tile's top */
        look: (name, id, lx, ly, rot, fn) => { const q = pt(id, lx, ly), a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'net:' + name + ':look', x: q[0], z: q[1], rot: rot || 0, base: plot[id].base, parts: a.P }); },
        rimRail: (id, model, skip) => { const p = plot[id]; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const X = p.sx + lx, Y = p.sy + ly; if (!open(X, Y) || cell[Y][X] === 'k' || (skip && skip(lx, ly))) continue;
            const R = (x0, z0, x1, z1) => feat({ k: 'rail', x0, z0, x1, z1, y: p.base, model: model || 'balusters_b' });
            if (!open(X, Y - 1)) R(gx(X), gx(Y), gx(X + 1), gx(Y)); if (!open(X, Y + 1)) R(gx(X), gx(Y + 1), gx(X + 1), gx(Y + 1)); if (!open(X - 1, Y)) R(gx(X), gx(Y), gx(X), gx(Y + 1)); if (!open(X + 1, Y)) R(gx(X + 1), gx(Y), gx(X + 1), gx(Y + 1)); } },
        claim: (id, lx0, ly0, lx1, ly1) => { const p = plot[id]; for (let y = ly0; y <= ly1; y++) for (let x = lx0; x <= lx1; x++) { const X = p.sx + x, Y = p.sy + y; if (!open(X, Y)) errs.push('claim over the void on ' + id + ' ' + x + ',' + y); taken.add(X + ':' + Y); } },
    }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');

/* ── THE WAY IN (shared: a district never moves it). The link `dumb_internet` (data.js DOOR_HQ.links holds the place; WANT below checks the
   row): a free spot at the end of its own short walk on the plot's side, the screen standing against the sky. ── */
const FACE_IN = { N: 180, S: 0, E: 270, W: 90 };
function wayAt(id, side, along) { const p = plot[id], d = p.d, dx = side === 'E' ? 1 : side === 'W' ? -1 : 0, dy = side === 'S' ? 1 : side === 'N' ? -1 : 0, mm = along || [5, 6];
    for (let t = 1; t <= 4; t++) for (const m of mm) { const lx = dx ? (dx > 0 ? 11 - t : t) : m, ly = dy ? (dy > 0 ? 11 - t : t) : m; if (cell[p.sy + ly][p.sx + lx] === '.') throw new Error('the way ' + id + ' stands over the void'); cell[p.sy + ly][p.sx + lx] = WALK[d]; if (t <= 2) taken.add((p.sx + lx) + ':' + (p.sy + ly)); }
    const e = dx ? (dx > 0 ? 10.5 : 1.5) : (mm[0] + 1), f = dy ? (dy > 0 ? 10.5 : 1.5) : (mm[0] + 1);
    return { x: r2(gx(p.sx) + e * C), z: r2(gx(p.sy) + f * C), face: FACE_IN[side], plot: id }; }
const WAY = { dumb_internet: wayAt('P00-00', 'N', [2, 3]) };

run('build');
run('dress');
run('people');

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE TILES: every plot's squares as float plateaus at the plot's height (greedy rectangles). A rectangle runs 0.4 m into a neighbour
   square that is tile at the same height (two plateaus that only touch leave a notch on the line), also over a plot line (the data hall,
   the boulevard), and stops on the square's line at the sky. The biggest rectangle of a plot hangs the deepest underside. ── */
const isTile = (x, y) => open(x, y) && cell[y][x] !== 'k';
const sameAt = (x, y, base) => isTile(x, y) && baseAt(x, y) === base;
const ISLE = [];
PLAN.plots.forEach(p => { const used = new Uint8Array(N * N), rects = [], isl = (lx, ly) => lx >= 0 && ly >= 0 && lx < N && ly < N && isTile(p.sx + lx, p.sy + ly);
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!isl(lx, ly) || used[ly * N + lx]) continue;
        let w = 1; while (isl(lx + w, ly) && !used[ly * N + lx + w]) w++;
        let h = 1; rows: while (ly + h < N) { for (let i = 0; i < w; i++) if (!isl(lx + i, ly + h) || used[(ly + h) * N + lx + i]) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(ly + j) * N + lx + i] = 1;
        rects.push([lx, ly, w, h]); }
    const big = rects.slice().sort((a, b) => b[2] * b[3] - a[2] * a[3])[0];
    rects.forEach(r => { const [lx, ly, w, h] = r, X0 = p.sx + lx, Y0 = p.sy + ly, all = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!sameAt(x, y, p.base)) return false; return true; };
        const eW = all(X0 - 1, Y0, X0 - 1, Y0 + h - 1) ? 0.4 : 0, eE = all(X0 + w, Y0, X0 + w, Y0 + h - 1) ? 0.4 : 0, eN = all(X0, Y0 - 1, X0 + w - 1, Y0 - 1) ? 0.4 : 0, eS = all(X0, Y0 + h, X0 + w - 1, Y0 + h) ? 0.4 : 0;
        const x0 = gx(X0) - eW, x1 = gx(X0 + w) + eE, z0 = gx(Y0) - eN, z1 = gx(Y0 + h) + eS;
        const row = { k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15, float: true };
        row.depth = r === big ? r2(Math.min(4, 1.6 + 0.2 * Math.max(w, h))) : r2(Math.min(2, 1.0 + 0.15 * Math.max(w, h)));   // (thin tech slabs, not the Astral Realm's hanging rock)
        if (p.d === 'D') row.rock = 'gunmetal_2';
        ISLE.push(row); });
    count.rects = (count.rects || 0) + rects.length; });

/* ── THE BRIDGES AND THE FLOATING STEPS: one a narrow opening, over the two edge squares (7 m), two squares wide (7 m) ── */
const JOIN = [];
PLAN.openings.forEach(o => { if (o.kind === 'wide') return; const a = plot[o.a], b = plot[o.b], ns = a.x === b.x;
    const line = ns ? gx(b.sy) : gx(b.sx), mid = ns ? gx(a.sx + 6) : gx(a.sy + 6), pt = (along, t) => ns ? { x: along, z: t } : { x: t, z: along };
    if (a.level === b.level) { const c = pt(mid, line); JOIN.push({ k: 'plateau', x: c.x, z: c.z, w: ns ? 2 * C : 2 * C + 0.8, d: ns ? 2 * C + 0.8 : 2 * C, h: a.base, edge: 0.15, float: true, depth: 1.2, rock: 'metal_2' }); count.bridges = (count.bridges || 0) + 1; }
    else { const lo = a.level < b.level ? a : b, hi = lo === a ? b : a, sgn = lo === a ? -1 : 1, foot = pt(mid, r2(line + sgn * C)), head = pt(mid, r2(line - sgn * C));
        JOIN.push({ k: 'ramp', x0: foot.x, z0: foot.z, x1: head.x, z1: head.z, w: 2 * C, h0: lo.base, h1: hi.base, stairs: true, float: true }); count.steps = (count.steps || 0) + 1; } });

/* ── THE PAINT: one sheet a square (0 = the room's own floor sheet) ── */
const PAL = ['tilefloor_2', 'urban:MetalGratingGrid1a', 'holo', 'aluminium', 'checkerboard_2', 'concrete_floor', 'gunmetal_2', 'holo_red', 'metal_2'];
const PIDX = { s: 1, a: 2, f: 3, v: 4, b: 5, p: 6, d: 8, x: 8, k: 9, w: 0 }, paint = new Uint8Array(W * Hh);   // (the Dark Web: dark tile, red rims, walk and ground alike)
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) paint[y * W + x] = PIDX[cell[y][x]] || 0;

/* ── checks: every prop key and unit exists; nothing stands over the void; every plot is walked to from the way in ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key);
    const sx = Math.floor((p.x + HALF) / C), sy = Math.floor((p.z + HALF) / C); if (!open(sx, sy) && typeof p.y !== 'number') throw new Error(p.key + ' stands over the void at ' + sx + ',' + sy + ' (give it a y to hang it there)'); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SP = [plot['P00-00'].sx + 3, plot['P00-00'].sy + 4];
{ const seen = new Uint8Array(W * Hh), st = [SP]; if (!open(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X2 = x + dx, Y2 = y + dy; if (!open(X2, Y2) || seen[Y2 * W + X2]) continue; seen[Y2 * W + X2] = 1; st.push([X2, Y2]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.name);
  if (process.env.INTERNET_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : ch === '.' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' | '));
  let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; }
  Object.assign(count, { tileSquares: op, unreachedSquares: un }); }
const features = ISLE.concat(JOIN, POOLS, F, ARCH);
Object.assign(count, { plots: PLAN.plots.length, features: features.length, drawn: ARCH.length, props: props.length, natives: npc.length, strays: strays.length });

/* THE AIR BY DISTRICT (three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district file may export `airZones(ctx)` =
   [{ sx0, sy0, sx1, sy1 (its own squares, the end exclusive), kind, color, n, speed, wind }]. The grid's own drifting bits are a last zone over the room. */
const AIR = [].concat(...Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => {
    const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gx(z.sy0), x1: gx(z.sx1), z1: gx(z.sy1) }); delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = { kind: 'motes', n: 200, color: 0x7fffd0, zones: AIR.concat([{ x0: -HALF, z0: -HALF, x1: HALF, z1: HALF, kind: 'motes', n: 260, color: 0x7fffd0 }]) };

/* ── the room ── */
const TOP = Math.max.apply(null, PLAN.plots.map(p => p.base)), SPM = { x: gc(SP[0]), z: gc(SP[1]) };
const SKY = { night: 1, lock: true, tint: 0x04261e, tintAmt: 0.6, stars: 0.6, nebula: 1.2, fog: { color: 0x0a3a30, amount: 0.4, top: 0.06, band: 0.5, density: 0.012 }, scenery: 'holosim', density: 0.9 };
const L = [];
L.push("        /* INTERNET36-BEGIN — THE INTERNET ON PLOTS (2026-11-17, One World phase 4.4): written by `node bake-internet.js` from docs/areas/internet/layout.json + districts/<S F B D>.js. Never hand-edit between the markers: edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE INTERNET',");
L.push("            sub: 'THE SERVER FARM · THE FEED · THE FORUMS · THE DARK WEB UNDERNEATH',");
L.push("            kind: 'box', site: '" + SITE + "', part: '" + PART + "',");
L.push("            shell: hqAstralShell({ w: " + r2(2 * HALF) + ", d: " + r2(2 * HALF) + ", h: " + r2(TOP + 14) + ", wallH: " + r2(TOP + 14) + ", floor: 'holo', wall: 'gunmetal', dado: 'gunmetal', apron: 'holo', skirt: 'gunmetal', ceiling: 'holo', apronColor: 0x7fffd0, floorColor: 0xd8fff0, wallColor: 0x9ad8c8, dadoColor: 0x6ab8a8,"
    + " mood: { lamp: 0x7fffd0, glow: 0x40ffb0, strip: 0xb0ffe8, light: 0xd0fff0, ambient: 0.55, night: 1 }, sky: " + J(SKY) + ", plate: { x: " + SPM.x + ", z: " + r2(SPM.z + 3) + ", y: " + r2(plot['P00-00'].base + 3.6) + " }, look: HQ_ROOM_LOOKS.internet, atmos: " + J(ATMOS) + " }),");
L.push("            parti: 'No ground: 36 tiles over a glowing grid. The Server Farm is one floor of racks; a boulevard of screens runs east through the Feed; the Forums are plazas of boards; the Dark Web sinks underneath.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + GX + ", nx: " + GX + ", nz: " + GY + ", mask: " + J(Array.from({ length: GY }, () => '#'.repeat(GX))) + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'holo', cliff: 'metal_2', path: 'aluminium',");
L.push("                noise: { amp: 0, scale: 9 }, outer: { m: 2, keep: 0, lift: -300 },   // no land past the room's edge: the grid all round");
L.push("                /* THE VOID (the Astral Realm's): the room's floor is open sky; the tiles are the float plateaus above it; a fall puts the walker back on the last ground */");
L.push("                void: { rock: 'metal_2', glow: 0x20ffa0, glowY: -26, fall: -8 },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
features.forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [],");
L.push("            counters: " + J(counters) + ",");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: [],");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 0 },");
L.push("        },");
L.push("        /* INTERNET36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const end = id => "b: { site: '" + SITE + "', part: '" + PART + "', wall: 'free', x: " + WAY[id].x + ", z: " + WAY[id].z + ", face: " + WAY[id].face + ",";
const WANT = [[end('dumb_internet'), 'link dumb_internet'], ["internet: { label: 'THE INTERNET', room: '" + ROOM + "'", 'hubs.internet'], ['internet: { name:', 'HQ_ROOM_LOOKS.internet']];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* INTERNET36-END */\n', b0 = src.indexOf('        /* INTERNET36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        /* ASTRAL36-BEGIN'); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
