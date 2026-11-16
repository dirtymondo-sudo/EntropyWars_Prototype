#!/usr/bin/env node
/* bake-astral.js — THE ASTRAL REALM ON PLOTS (2026-11-16, the zone thread; mondo's order of 11-16: the eight old zones go on plots
   "completely redesigned/reimagined", built without waiting for his OK; plan 3 = docs/plans/world-zones/astral-realm_plot_plan_3.png).
   One room, 6 x 6 plots of 12 x 12 squares (252 m a side), and NO GROUND: every plot is an island hanging over the void at its own height
   (mondo 09-30: "the astral realm to have floating platforms that you have to jump across"; data.js terrain.void + float plateaus, the old
   Sea's own machinery, nothing new in the engine). Three districts:
   S THE SEA OF POSSIBILITY (16 plots, an S through the middle), L THE LIBRARY OF UNTHOUGHT THINGS (10, west, climbing to the Stacks),
   N THE NIGHTMARE (10, east, sinking to the Maw).
   Reads docs/areas/astral/layout.json (written by docs/plans/world-zones/draw-astral.js: every plot's name, district, level, ports, and the
   72 x 72 square map) and writes the room `site_prebuilt_lookingglass_realm` into data.js between ASTRAL36-BEGIN / ASTRAL36-END.
   `node bake-astral.js` writes; `--dry-run` prints the counts; `ASTRAL_DUMP=1` prints the walked map. Never hand-edit between the markers:
   edit this tool, the layout or a district file and rerun. Notes: docs/notes/areas-complexes.md "THE ASTRAL REALM ON PLOTS".

   THE DISTRICT FILES: what stands in a district is written in docs/areas/astral/districts/<S L N>.js, one thread a file. This tool keeps
   what is shared: the plan, the islands and their heights, the bridges and the floating steps, the void, the paint, the ways out, the sky,
   the checks. A district file may export plan(ctx), build(ctx), dress(ctx), people(ctx), airZones(ctx).

   THE SQUARE MAP: '.' = open sky (the void: nothing to stand on, a fall puts you back on the last ground). Everything else is an island:
   g astral ground, m marble walk, j library carpet, c the carpet runner, R nightmare flesh, h the worn walk, w still water, l lava,
   k a cloud square (a plot's edge squares at a port = the bridge / the floating steps to the next plot).
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   THE HEIGHTS: one height a plot (layout `level`, 1 level = 1.75 m): a whole island is flat at level x 1.75 m over the room's base. Two
   joined plots of one level share a cloud bridge (a float plateau, `under: 'cloud'`); of different levels (two at most) a flight of
   floating steps (a float stair ramp) over the two gap squares.
   THE WALKS: the m / c / h / k squares are the walks, two squares wide, from every port to the island's middle. Nothing that blocks may
   stand on one (the tool refuses it). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/astral/layout.json'), 'utf8'));
const C = 3.5, N = 12, GX = PLAN.cols, GY = PLAN.rows, W = N * GX, Hh = N * GY, HALF = W * C / 2, LEVEL = 1.75;
const ROOM = 'site_prebuilt_lookingglass_realm', SITE = 'prebuilt_lookingglass', PART = 'realm', WAITING = 'site_prebuilt_lookingglass_waiting';
const OLD = ['site_prebuilt_lookingglass_sea', 'site_prebuilt_lookingglass_nightmare', 'site_prebuilt_lookingglass_library'];
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HALF + c * C), gc = c => r2(-HALF + (c + 0.5) * C);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people, lines and door plates keep their own words: read from the old literals (so the three old literals stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [], d: (r.doors || []).map(d => ({ id: d.id, label: d.label, sub: d.sub, desc: d.desc, leaf: d.leaf })), c: r.counters || [] } : { n: [], l: [], d: [], c: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O = { sea: OLDR(OLD[0]), nightmare: OLDR(OLD[1]), library: OLDR(OLD[2]) };
const sayOf = (R, race, i) => (R.n.filter(n => n.race === race)[i || 0] || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
if (cell.length !== Hh || cell.some(r => r.length !== W)) throw new Error('layout.json cells: want ' + Hh + ' rows of ' + W);
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); if (!PLAN.districts[p.d]) throw new Error('district? ' + p.id); p.base = r2(p.level * LEVEL); p.sx = p.x * N; p.sy = p.y * N; plot[p.id] = p; });
const Pxy = (x, y) => plot['P0' + x + '-0' + y];
const plotAt = (sx, sy) => Pxy(Math.max(0, Math.min(GX - 1, Math.floor(sx / N))), Math.max(0, Math.min(GY - 1, Math.floor(sy / N))));
const distAt = (sx, sy) => plotAt(sx, sy).d, baseAt = (sx, sy) => plotAt(sx, sy).base;
const open = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && cell[y][x] !== '.';
const WALKS = 'mchk', isWalk = (x, y) => open(x, y) && WALKS.includes(cell[y][x]);
const GROUND = { S: 'g', L: 'j', N: 'R' }, WALK = { S: 'm', L: 'c', N: 'h' };
const F = [], props = [], doors = [], npc = [], counters = [], ARCH = [], count = {}, taken = new Set(), errs = [], strays = [];
const feat = o => { F.push(o); return o; };
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── placing things. A blocker stands on a square's middle (P / put), never on a walk, never two on one square; decor sits off the middle
   (dec / at), anywhere on an island; people stand on ground (native). `put` and `native` take the free ground square NEAREST the asked
   one, so a district file does not depend on an island's exact outline. ── */
let curD = null;
function spot(sx, sy, what, shared) { if (sx < 0 || sy < 0 || sx >= W || sy >= Hh) { errs.push(what + ' off the map at ' + sx + ',' + sy); return false; }
    if (curD && distAt(sx, sy) !== curD) strays.push(curD + ': ' + what + ' at ' + sx + ',' + sy + ' (' + distAt(sx, sy) + ')');
    if (!open(sx, sy)) { errs.push(what + ' stands over the void at ' + sx + ',' + sy); return false; }
    if (!shared) { if (isWalk(sx, sy)) errs.push(what + ' blocks the walk at ' + sx + ',' + sy); if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); }
    return true; }
const P = (key, sx, sy, o) => { spot(sx, sy, key); props.push(Object.assign({ key, x: gc(sx), z: gc(sy) }, o || {})); };
const freeG = (sx, sy) => open(sx, sy) && !isWalk(sx, sy) && !taken.has(sx + ':' + sy) && !'wl'.includes(cell[sy][sx]);
/* the free ground square of plot p nearest (lx, ly); `span` 2 = the corner between four free squares */
function nearest(p, lx, ly, span) { let best = null;
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const X = p.sx + x, Y = p.sy + y;
        const ok = span === 2 ? (freeG(X, Y) && freeG(X + 1, Y) && freeG(X, Y + 1) && freeG(X + 1, Y + 1) && x < N - 2 && y < N - 2) : freeG(X, Y); if (!ok) continue;
        const d = (x - lx) * (x - lx) + (y - ly) * (y - ly); if (!best || d < best[0]) best = [d, X, Y]; }
    if (!best) { errs.push('no free ground on ' + p.id + ' near ' + lx + ',' + ly); return null; } return [best[1], best[2]]; }
const sayRow = (n, say) => { if (say) n.say = say; return n; };

/* ── the pieces a district draws itself (arch rows: boxes, cylinders, quads, roofs, each wearing a sheet; the Estate's own helper) ── */
function sheet() {
    const Pp = [];
    /* (every drawn part carries a little light of its own: the room is a night with no sun, and an unlit part reads black) */
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (o.glow == null) o.glow = 0.3; Pp.push(o); return o; };
    return { P: Pp,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        quad: (x, y, z, w, h, ry, key, tint, o) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], ry: ry || 0 }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [x, y, z], size: [w, h, d] }, key, tint, o),
        sign(words, x, y, z, w, h, fg, bg, font, o) { Pp.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + (font || 'serif'), uv: 'fit', kind: 'wall' }, o || {})); } };
}

/* ── THE DISTRICT FILES ── */
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/astral/districts'), o = {}; fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { o[f[0]] = require(path.join(dir, f)); }); return o; })();
Object.keys(PLAN.districts).forEach(k => { if (!DISTRICTS[k]) throw new Error('district file missing: docs/areas/astral/districts/' + k + '.js'); });
const CTX = {}, POOLS = [], AIRQ = [];
Object.keys(DISTRICTS).forEach(k => { const rnd = mkRnd(7919 * k.charCodeAt(0));
    const sq = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [p.sx + lx, p.sy + ly]; };
    /* a plot's own point in metres: (lx, ly) in squares from its north-west corner, fractions allowed (6, 6 = its middle) */
    const pt = (id, lx, ly) => { const p = plot[id]; if (!p) throw new Error('plot? ' + id); return [r2(gx(p.sx) + lx * C), r2(gx(p.sy) + ly * C)]; };
    const ctx = CTX[k] = { d: k, C, N, W, H: Hh, LEVEL, gx, gc, r2, PLAN, plot, plots: PLAN.plots.filter(p => p.d === k), cell, setRect, open, isWalk, distAt, baseAt, feat, props, npc, counters, taken, rnd, sq, pt, O, sayOf, sheet,
        base: id => plot[id].base,
        /* plan stage: make these squares of a plot island ground (never the plot's edge squares: those are the gaps) */
        fill: (id, lx0, ly0, lx1, ly1) => { const p = plot[id]; for (let y = Math.max(1, ly0); y <= Math.min(N - 2, ly1); y++) for (let x = Math.max(1, lx0); x <= Math.min(N - 2, lx1); x++) if (cell[p.sy + y][p.sx + x] === '.') cell[p.sy + y][p.sx + x] = GROUND[k]; },
        /* a blocker on the free ground square nearest (lx, ly); returns its square [sx, sy]. o.span 2 = a piece four squares big, on their shared corner */
        put: (key, id, lx, ly, o) => { o = Object.assign({}, o || {}); const span = o.span; delete o.span; const s = nearest(plot[id], lx, ly, span); if (!s) return null;
            if (span === 2) { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(q => spot(s[0] + q[0], s[1] + q[1], key)); props.push(Object.assign({ key, x: gx(s[0] + 1), z: gx(s[1] + 1) }, o)); }
            else P(key, s[0], s[1], o); return s; },
        /* a blocker on exactly this square (an error when it is void, a walk or taken) */
        P: (key, id, lx, ly, o) => { const s = sq(id, lx, ly); P(key, s[0], s[1], o); },
        /* decor, off the square's middle, turned at random: on any island square near (lx, ly) */
        dec: (key, id, lx, ly, o) => { const p = plot[id]; let s = sq(id, Math.round(lx), Math.round(ly)); if (!open(s[0], s[1])) { const q = nearest(p, lx, ly); if (!q) return; s = q; taken.delete(s[0] + ':' + s[1]); }
            spot(s[0], s[1], key, true); props.push(Object.assign({ key, x: r2(gc(s[0]) + (rnd() - 0.5) * 1.8), z: r2(gc(s[1]) + (rnd() - 0.5) * 1.8), face: Math.round(rnd() * 360) }, o || {})); },
        /* a piece at an exact point of the plot (metres from fractions of squares): for things that hang, float or sit on a table. Over the void it needs its own `y` */
        at: (key, id, lx, ly, o) => { const q = pt(id, lx, ly); props.push(Object.assign({ key, x: q[0], z: q[1] }, o || {})); },
        native: (race, id, lx, ly, face, say) => { const s = nearest(plot[id], lx, ly); if (!s) return; spot(s[0], s[1], race); npc.push(sayRow({ x: gc(s[0]), z: gc(s[1]), face: face || 0, race }, say)); },
        free: (id, lx, ly) => { const s = sq(id, lx, ly); return freeG(s[0], s[1]); },
        /* every island square of a plot whose char is in `chars` (default: its ground), in reading order, as local [lx, ly] */
        squares: (id, chars) => { const p = plot[id], out = []; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = cell[p.sy + ly][p.sx + lx]; if (ch !== '.' && (chars || 'gjR').includes(ch)) out.push([lx, ly]); } return out; },
        /* the island's rim: free ground squares with open sky on at least one side, as local [lx, ly, side] (side = where the sky is) */
        rim: id => { const p = plot[id], out = []; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { const X = p.sx + lx, Y = p.sy + ly; if (!freeG(X, Y)) continue;
            const s = !open(X, Y - 1) ? 'N' : !open(X, Y + 1) ? 'S' : !open(X - 1, Y) ? 'W' : !open(X + 1, Y) ? 'E' : null; if (s) out.push([lx, ly, s]); } return out; },
        /* a round pool on an island: its squares turn to water ('w') or lava ('l'); never over a walk */
        pool: (id, lx, ly, r, key) => { const p = plot[id], q = pt(id, lx, ly), ch = key === 'lava' ? 'l' : 'w';
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = p.sx + x, Y = p.sy + y; if (!open(X, Y) || isWalk(X, Y)) continue; if (Math.hypot(gc(X) - q[0], gc(Y) - q[1]) < r - 0.6) { if (taken.has(X + ':' + Y)) errs.push('a pool over a taken square at ' + X + ',' + Y); cell[Y][X] = ch; } }
            POOLS.push({ k: 'pool', x: q[0], z: q[1], r, y: p.base, depth: key === 'lava' ? 0.9 : 0.5, key: key || 'water', bank: 1 }); },
        /* a drawn piece (an `arch` row) standing on a plot: fn(a) draws into a sheet whose frame is the point (lx, ly), y = 0 on the island's top */
        look: (name, id, lx, ly, rot, fn) => { const q = pt(id, lx, ly), a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'ast:' + name + ':look', x: q[0], z: q[1], rot: rot || 0, base: plot[id].base, parts: a.P }); },
        /* squares a drawn piece stands on (so nothing else is put there) */
        claim: (id, lx0, ly0, lx1, ly1) => { const p = plot[id]; for (let y = ly0; y <= ly1; y++) for (let x = lx0; x <= lx1; x++) { const X = p.sx + x, Y = p.sy + y; if (!open(X, Y)) errs.push('claim over the void on ' + id + ' ' + x + ',' + y); taken.add(X + ':' + Y); } },
    }; });
const run = stage => Object.keys(DISTRICTS).forEach(k => { const m = DISTRICTS[k]; if (m && typeof m[stage] === 'function') { curD = k; try { m[stage](CTX[k]); } finally { curD = null; } } });

run('plan');      // what a district changes on the plan's squares, before anything is derived from them

/* ── THE WAYS (six, shared: a district never moves one). Four doors of the room and two link ends (data.js DOOR_HQ.links: the link row
   holds the place; WANT below checks every row). A way stands at the end of its own short walk, on a side of its plot that has no port. ── */
const FACE_IN = { N: 180, S: 0, E: 270, W: 90 };
function wayAt(id, side) { const p = plot[id], d = p.d, dx = side === 'E' ? 1 : side === 'W' ? -1 : 0, dy = side === 'S' ? 1 : side === 'N' ? -1 : 0;
    for (let t = 1; t <= 5; t++) for (const m of [5, 6]) { const lx = dx ? (dx > 0 ? 11 - t : t) : m, ly = dy ? (dy > 0 ? 11 - t : t) : m; cell[p.sy + ly][p.sx + lx] = t === 1 ? GROUND[d] : WALK[d]; if (t <= 2) taken.add((p.sx + lx) + ':' + (p.sy + ly)); }
    const e = dx ? (dx > 0 ? 10.5 : 1.5) : 6, f = dy ? (dy > 0 ? 10.5 : 1.5) : 6;
    return { x: r2(gx(p.sx) + e * C), z: r2(gx(p.sy) + f * C), face: FACE_IN[side], plot: id }; }
const WAY = { waiting: wayAt('P02-00', 'N'), mirror: wayAt('P03-00', 'N'), library: wayAt('P01-00', 'N'), nightmare: wayAt('P05-01', 'N'), dumb_astral: wayAt('P00-04', 'S'), attic_nightmare: wayAt('P05-04', 'E') };
{ const w = O.sea.d.find(d => d.id === 'waiting') || {}, lib = O.sea.d.find(d => d.id === 'library') || {}, nm = O.nightmare.d.find(d => d.id === 'sea') || {};
  const door = (id, o) => doors.push(Object.assign({ id, wall: 'free', x: WAY[id].x, z: WAY[id].z, face: WAY[id].face, leaf: 'leaf_frame_only' }, o));
  door('waiting', { label: w.label || 'THE ASTRAL REALM · THE WAITING ROOM', sub: w.sub || 'THE FRAME · BACK TO THE CHAIRS', action: { room: WAITING, at: 'sea' }, desc: w.desc || '' });
  door('library', { label: 'THE ASTRAL REALM · THE WAITING ROOM', sub: 'THE FRAME · BACK TO THE CHAIRS', action: { room: WAITING, at: 'library' }, desc: 'A frame at the end of the nave with a carpet in it, and chairs. The catalogue would like it noted that you took nothing out.' });
  door('nightmare', { label: 'THE ASTRAL REALM · THE WAITING ROOM', sub: 'THE FRAME · BACK TO THE CHAIRS', action: { room: WAITING, at: 'nightmare' }, desc: 'A frame with a carpet in it, and chairs facing the wall. The sign over them still has your number on it.' });
  /* THE MIRROR (mondo 11-16: "just add some sort of door from th looking garden to the astral sea of possibility"): the far side of the frame in Camelot's Looking-Glass Garden (bake-camelot.js door `mirror`) */
  door('mirror', { label: 'CAMELOT · THE LOOKING-GLASS GARDEN', sub: 'THE MIRROR · BACK TO THE HEDGES', action: { room: 'site_prebuilt_camelot_kingdom', at: 'mirror' }, desc: 'A mirror frame with no glass in it, standing on an island. Through it: hedges, roses, a lawn. It does not reflect the Sea.' }); }
/* (the healing ring is the hub's own: the game lays it at the hub room's spawn, data.js hubs.astral) */

run('build');     // landmarks, drawn pieces, pools
run('dress');     // props
run('people');    // the people

if (strays.length) console.log('pieces a district stood on another district\'s squares (ask that district\'s thread):\n  ' + strays.join('\n  '));
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));

/* ── THE ISLANDS: every plot's squares as float plateaus at the plot's height (greedy rectangles). A rectangle runs 0.4 m into a
   neighbour square that is island too (two plateaus that only touch leave a notch on the line) and stops on the square's line at the sky.
   The biggest rectangle of a plot hangs the island's rock; the others hang a short one, so the island tapers to one point. ── */
const ISLE = [];
PLAN.plots.forEach(p => { const used = new Uint8Array(N * N), rects = [], isl = (lx, ly) => lx >= 0 && ly >= 0 && lx < N && ly < N && open(p.sx + lx, p.sy + ly) && !(cell[p.sy + ly][p.sx + lx] === 'k' && (lx === 0 || ly === 0 || lx === N - 1 || ly === N - 1));
    const inner = (lx, ly) => isl(lx, ly) && cell[p.sy + ly][p.sx + lx] === 'k';
    for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!isl(lx, ly) || used[ly * N + lx]) continue; const cloud = inner(lx, ly);
        let w = 1; while (isl(lx + w, ly) && !used[ly * N + lx + w] && inner(lx + w, ly) === cloud) w++;
        let h = 1; rows: while (ly + h < N) { for (let i = 0; i < w; i++) if (!isl(lx + i, ly + h) || used[(ly + h) * N + lx + i] || inner(lx + i, ly + h) !== cloud) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(ly + j) * N + lx + i] = 1;
        rects.push([lx, ly, w, h, cloud]); }
    const big = rects.filter(r => !r[4]).sort((a, b) => b[2] * b[3] - a[2] * a[3])[0];
    rects.forEach(r => { const [lx, ly, w, h, cloud] = r; let all = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!isl(x, y)) return false; return true; };
        const eW = all(lx - 1, ly, lx - 1, ly + h - 1) ? 0.4 : 0, eE = all(lx + w, ly, lx + w, ly + h - 1) ? 0.4 : 0, eN = all(lx, ly - 1, lx + w - 1, ly - 1) ? 0.4 : 0, eS = all(lx, ly + h, lx + w - 1, ly + h) ? 0.4 : 0;
        const x0 = gx(p.sx + lx) - eW, x1 = gx(p.sx + lx + w) + eE, z0 = gx(p.sy + ly) - eN, z1 = gx(p.sy + ly + h) + eS;
        const row = { k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: p.base, edge: 0.15, float: true };
        if (cloud) row.under = 'cloud'; else if (r !== big) row.depth = r2(Math.min(5, 1.5 + 0.5 * Math.max(w, h))); else row.depth = r2(Math.min(14, 4 + 0.9 * Math.max(w, h)));
        ISLE.push(row); });
    count.rects = (count.rects || 0) + rects.length; });

/* ── THE BRIDGES AND THE FLOATING STEPS: one a port pair, over the two gap squares (7 m), two squares wide (7 m) ── */
const JOIN = [];
PLAN.openings.forEach(o => { const a = plot[o.a], b = plot[o.b]; if (!a || !b) throw new Error('opening? ' + o.a + ' ' + o.b);
    const ns = a.x === b.x; if ((ns ? b.y - a.y : b.x - a.x) !== 1 || (ns ? a.x !== b.x : a.y !== b.y)) throw new Error('opening between plots that do not touch: ' + o.a + ' ' + o.b);
    const line = ns ? gx(b.sy) : gx(b.sx), mid = ns ? gx(a.sx + 6) : gx(a.sy + 6), pt = (along, t) => ns ? { x: along, z: t } : { x: t, z: along };
    if (a.level === b.level) { const c = pt(mid, line); JOIN.push({ k: 'plateau', x: c.x, z: c.z, w: ns ? 2 * C : 2 * C + 0.8, d: ns ? 2 * C + 0.8 : 2 * C, h: a.base, edge: 0.15, float: true, under: 'cloud' }); count.bridges = (count.bridges || 0) + 1; }
    else { const lo = a.level < b.level ? a : b, hi = lo === a ? b : a, sgn = lo === a ? -1 : 1, foot = pt(mid, r2(line + sgn * C)), head = pt(mid, r2(line - sgn * C));
        JOIN.push({ k: 'ramp', x0: foot.x, z0: foot.z, x1: head.x, z1: head.z, w: 2 * C, h0: lo.base, h1: hi.base, stairs: true, float: true }); count.steps = (count.steps || 0) + 1; } });

/* ── THE PAINT: one sheet a square (0 = the room's own astral ground) ── */
const PAL = ['marble_light', 'carpet_3', 'carpet', 'flesh', 'plague_flesh', 'marble'], PIDX = { g: 0, m: 1, j: 2, c: 3, R: 4, h: 5, k: 1, w: 6, l: 5 }, paint = new Uint8Array(W * Hh);
for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) paint[y * W + x] = PIDX[cell[y][x]] || 0;

/* ── checks: every prop key and unit exists; nothing stands over the void; every plot is walked to from the Frame ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key);
    const sx = Math.floor((p.x + HALF) / C), sy = Math.floor((p.z + HALF) / C); if (!open(sx, sy) && typeof p.y !== 'number') throw new Error(p.key + ' stands over the void at ' + sx + ',' + sy + ' (give it a y to hang it there)'); });
npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
const SPs = nearest(plot['P02-00'], 5, 3) || [plot['P02-00'].sx + 5, plot['P02-00'].sy + 4], SP = [plot['P02-00'].sx + 5, plot['P02-00'].sy + 4];
{ const seen = new Uint8Array(W * Hh), st = [SP]; if (!open(SP[0], SP[1])) throw new Error('the spawn is not open'); seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || seen[Y * W + X]) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const cold = PLAN.plots.filter(p => { for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.sy + ly) * W + p.sx + lx]) return false; return true; }).map(p => p.id);
  if (process.env.ASTRAL_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : ch === '.' ? ' ' : ch).join('')).join('\n'));
  if (cold.length) throw new Error('plots not reached on foot: ' + cold.join(' '));
  let op = 0, un = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; }
  /* a walk never ends blocked: every walk square is reached over walk squares only */
  Object.assign(count, { islandSquares: op, unreachedSquares: un }); }
void SPs;
const features = ISLE.concat(JOIN, POOLS, F, ARCH);
Object.assign(count, { plots: PLAN.plots.length, features: features.length, drawn: ARCH.length, props: props.length, doors: doors.length, natives: npc.length });

/* THE AIR BY DISTRICT (three-renderer.js _hqBuildAtmos `shell.atmos.zones`): a district file may export `airZones(ctx)` =
   [{ sx0, sy0, sx1, sy1 (its own squares, the end exclusive), kind, color, n, speed, wind }]. The realm's own dreaming dust (motes) is
   kept as a last zone over the whole room, because a room with zones draws only its zones. */
const AIR = [].concat(...Object.keys(DISTRICTS).filter(k => typeof DISTRICTS[k].airZones === 'function').map(k => (DISTRICTS[k].airZones(CTX[k]) || []).map(z => { const q = Object.assign({}, z, { x0: gx(z.sx0), z0: gx(z.sy0), x1: gx(z.sx1), z1: gx(z.sy1) });
    delete q.sx0; delete q.sy0; delete q.sx1; delete q.sy1; return q; })));
const ATMOS = { kind: 'motes', n: 200, color: 0xd8b4ff, zones: AIR.concat([{ x0: -HALF, z0: -HALF, x1: HALF, z1: HALF, kind: 'motes', n: 200, color: 0xd8b4ff }]) };
void AIRQ;

/* ── the room ── */
const TOP = Math.max.apply(null, PLAN.plots.map(p => p.base)), SPM = { x: gx(SP[0] + 1), z: gc(SP[1]) };
const LINES = O.sea.l.concat(O.library.l, O.nightmare.l), L = [];
L.push("        /* ASTRAL36-BEGIN — THE ASTRAL REALM ON PLOTS (2026-11-16): written by `node bake-astral.js` from docs/areas/astral/layout.json + districts/<S L N>.js. Never hand-edit between the markers; edit the tool, the layout or a district file and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE ASTRAL REALM',");
L.push("            sub: 'THE SEA OF POSSIBILITY · THE LIBRARY OF UNTHOUGHT THINGS · THE NIGHTMARE · 36 ISLANDS OVER THE VOID',");
L.push("            kind: 'box', site: '" + SITE + "', part: '" + PART + "',");
L.push("            shell: hqAstralShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", h: " + r2(TOP + 14) + ", wallH: " + r2(TOP + 14) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: " + r2(plot['P02-00'].base + 3.6) + " }, atmos: " + J(ATMOS) + " }),");
L.push("            parti: 'No ground: thirty-six islands over the void, each at its own height, joined by cloud bridges and floating steps. The Library climbs to the Stacks, the Nightmare sinks to the Maw, the Sea of Possibility winds between them.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + (N * C) + ", n: " + GX + ", names: " + J(PLAN.plots.map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 0.875, floor: 'nz_astral_a', cliff: 'crystal', path: 'marble_light',");
L.push("                noise: { amp: 0, scale: 9 }, outer: { m: 2, keep: 0, lift: -300 },   // no land past the room's edge: the sky all round (outer: false would close the room in a block with a flat bottom)");
L.push("                /* THE VOID (the old Sea's own): the room's floor is open sky; the islands are the float plateaus above it; a fall puts the walker back on the last ground */");
L.push("                void: { rock: 'rocks_5', glow: 0x8a4cff, glowY: -26, fall: -8 },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + W + ", nz: " + Hh + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
features.forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: " + J(counters) + ",");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(LINES) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 180 },");
L.push("        },");
L.push("        /* ASTRAL36-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const end = id => { const w = WAY[id]; return "b: { site: '" + SITE + "', part: '" + PART + "', wall: 'free', x: " + w.x + ", z: " + w.z + ", face: " + w.face + ","; };
const WANT = [[end('dumb_astral'), 'link dumb_astral'], [end('attic_nightmare'), 'link attic_nightmare'],
    ["action: { room: '" + ROOM + "', at: 'waiting' }", 'the Waiting Room\'s door `sea`'], ["action: { room: '" + ROOM + "', at: 'library' }", 'the Waiting Room\'s door `library`'], ["action: { room: '" + ROOM + "', at: 'nightmare' }", 'the Waiting Room\'s door `nightmare`']];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flat = src.replace(/ +/g, ' '), missing = WANT.filter(w => flat.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (DRY) process.exit(0);
const END = '        /* ASTRAL36-END */\n', b0 = src.indexOf('        /* ASTRAL36-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        ' + WAITING + ': {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
