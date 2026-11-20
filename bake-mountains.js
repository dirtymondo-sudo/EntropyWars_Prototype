#!/usr/bin/env node
/* bake-mountains.js — THE MOUNTAINS ON PLOTS (2026-11-15, mondo: "there should be a mountain zone with 3 main trails/peaks you can end up. Mt shasta
   - woods mountain trail, snowy mountain trail that leads to north pole village, mountains and woods separate camelot from the north pole. and
   another mountain trail that leads to mount olympus. And there should be a ski loft and ski slopes, for skateboarding"; his OK on the plot plan
   19:37 UTC "okay that's good"). The fourth area of the world plan after the Woods, Camelot Kingdom and the Desert: one range, 72 plots of
   12 x 12 squares of 3.5 m, five districts west to east: THE NORTH POLE VILLAGE, THE SNOWY PASS, THE SKI LODGE + SLOPES, MOUNT SHASTA, MOUNT OLYMPUS.
   Reads docs/areas/mountains/layout.json (the approved plan: every plot's name, district, level, ports and the 192 x 96 square map) and writes
   TWO rooms into data.js between MOUNTAINS-BEGIN / MOUNTAINS-END:
     site_prebuilt_shasta_mountains   THE MOUNTAINS: plan columns 4-15 (12 x 8 plots, 504 x 336 m; 56 plots are built, the rest is the range's rock)
     site_prebuilt_northpole_plots    THE NORTH POLE: plan columns 0-3 (4 x 4 plots, 168 m), behind the Pass Gate
     (the Hollywood Hills, plan 2's third room, left this tool on 2026-11-16: mondo "make Hollywood hills a part of disaster city". They are district N of the
      city's own room now: docs/disaster-city/districts/N.js + hills-layout.json, written by bake-disaster-city.js. The old room is in DOOR_HQ.retired.)
   PLAN 2 also SWAPPED Mount Shasta and Mount Olympus (range order: Pole, Pass, Lodge, OLYMPUS, SHASTA, Hills): Olympus is plan columns 10-12, Shasta 13-15, its trail 13-14.
   and the ends of the links / bay doors that lead into them. `node bake-mountains.js` writes; `--dry-run` prints the counts.
   Never hand-edit between the markers: edit a district file, this tool or the layout and rerun. Notes: docs/notes/areas-complexes.md "THE MOUNTAINS ON PLOTS".
   SINCE 2026-11-16 EVERYTHING THAT STANDS ON THE PLOTS (buildings, props, natives, looks) IS IN docs/areas/mountains/districts/<N P K O S H>.js, one
   file a district thread (THE DISTRICT FILES below; rules: areas-complexes.md "THE MOUNTAINS, THE DISTRICT FILES"). This tool is the shared part:
   nobody edits it without a note on the board (docs/notes/claims.md).
   HOW A ROOM IS MADE (the Woods' way): terrain.gen { kind: 'plan', look: 'trees' }; every walked square is a `space` row, everything else
   (rock, deep drift, the crevasse, trees) is the plan's solid mass. The HEIGHTS are terrain.slope.cells: a plot's level x 1.75 m, graded to the
   next plot, PLUS the rock itself (a rock square's corners rise with their distance from the nearest walked square: the crags are the height
   field, not rows). A building's squares are levelled. Squares are (sx west to east, sy north to south) of the ROOM; S(id, lx, ly) = a plot's own square. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/mountains/layout.json'), 'utf8'));
const ALL = PLAN.rooms[0].cells, C = 3.5, N = 12, PL = N * C, LEVEL = 1.75;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [] } : { n: [], l: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_POLE = OLDR('site_prebuilt_northpole_village'), O_SHASTA = OLDR('site_prebuilt_shasta_slopes'), O_OLYMPUS = OLDR('site_prebuilt_olympus_summit');
const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;
const OLD = { pole: O_POLE, shasta: O_SHASTA, olympus: O_OLYMPUS };   // the old rooms' natives and lines: ctx.say('pole', 'gnome')
const MTN = 'site_prebuilt_shasta_mountains', R_LODGE = 'site_prebuilt_shasta_ow_lodge', R_OLY = 'site_prebuilt_shasta_ow_olympus', R_SHASTA = 'site_prebuilt_shasta_ow_shasta', POLE = 'site_prebuilt_northpole_plots', CITY = 'site_prebuilt_downtown_streets';   // (the Hollywood Hills are part of Disaster City's room since 2026-11-16: its doors `shasta` and `ridge`, docs/disaster-city/districts/N.js)
const MASS = { r: 1, k: 1, a: 1, t: 1, z: 1 };   // z = the sea (the Hills' east end): sunk to the room's `seaBed`, under terrain.sea
const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const hash = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
    return (hash(ix, iy, s) * (1 - tx) + hash(ix + 1, iy, s) * tx) * (1 - ty) + (hash(ix, iy + 1, s) * (1 - tx) + hash(ix + 1, iy + 1, s) * tx) * ty; };
/* the textures the buildings wear (the city's sheets) */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 };
const DOORWORDS = (label, sub, desc) => ({ label, sub, desc });
/* ── THE DISTRICT FILES (2026-11-16, the one hook for the six district threads; the city's way: bake-disaster-city.js "THE DISTRICT FILES") ──
   docs/areas/mountains/districts/<LETTER>.js, one per district of layout.json `districts`: N (the North Pole village, its own room), P (the Snowy
   Pass), K (the Ski Lodge + slopes), O (Mount Olympus), S (Mount Shasta) (the Mountains room). (H, the Hollywood Hills, is Disaster City's district N since 2026-11-16.) No
   district's content is in this tool. THE TOOL KEEPS everything shared: the plan and its cuts (makeRoom's opts), the heights, the paint, the tree
   zones, the sky and edges, every way out (doors on the room's walls, the links' ends, DOOR HQ's bay doors), the spawn, the checks.
   A file may export any of:
     tailor(t)    inside makeRoom, after the tool's own `carves`, before the trails between plots are cut. t = { set(plotId, lx, ly, ch),
                  get(plotId, lx, ly), plot(plotId), N }: change a square of the district's own plots (the letters: layout.json `legend`)
     apply(ctx)   after the room's ways out exist: the standing things (ctx.building: a walked-in building takes its squares here)
     build(ctx)   after every district's apply: the dressing
     airZones(ctx) the district's air (particles by squares): see finish() THE AIR BY DISTRICT
   A room runs its files in the order of its `files` opt, one stage for all of them, then the next stage.
   ctx = the room (everything makeRoom returns: put, dec, tree, native, building, look, feat, flat, S, gx, gz, mx, mz, cell, byId, plots, props,
   doors, marks, taken, flats, count, open, inR, rnd, o, W, H ...) + anchor(name, { x, z, face }) + say(old, race) + cabin + the constants
   N, C, r2, U, WD, WD2, SHG, FLR, GLS, ROT, DOORWORDS.
   WHILE A FILE'S HOOK RUNS: S(plotId, ..) (so put / dec / tree / native / building too) throws on a plot of another district; ctx.rnd is the
   district's OWN stream (its start = the room's `streams` opt), so a piece added in one district never moves another district's decor.
   THE ANCHORS a district must set (the tool writes the link / bay door there and throws when one is missing): N `hearth`; O `painting`,
   `bayOlympus`; S `lemuria`, `bayShasta`. */
const DDIR = path.join(REPO, 'docs/areas/mountains/districts');
const DISTRICTS = {}; fs.readdirSync(DDIR).filter(f => /^[A-Z]\.js$/.test(f)).sort().forEach(f => { DISTRICTS[f[0]] = require(path.join(DDIR, f)); });
const runDistricts = (R, stage) => R.o.files.forEach(L => { const m = DISTRICTS[L]; if (!m) throw new Error('no district file ' + L + '.js for ' + R.o.id); if (typeof m[stage] === 'function') R.inDistrict(L, () => m[stage](R.ctx)); });
/* the log building the Lodge, the huts and the Top Station share (districts K and P): stone foot, log walls, corner logs, a snow roof, lit windows */
const LOG = 0x7a5a40, DARK = 0x3a2a20, SNOW = 0xf4f8ff, STONE = 0x9a9aa0;
const cabin = (a, w, d, dr, q) => {   // (the gable faces the front)
    a.shell(w, q.h, d, WD, q.tint || LOG, dr, [3.5, 1.75]); a.box(0, 0, 0, w + 0.4, 1.0, d + 0.4, 'rocks_5', STONE, { faces: 'blr', top: false });
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.42, q.h, 0.42, WD2, DARK);
    a.roof('gable', 0, q.h, 0, d + 1.8, q.rh, w + 1.8, 'ice', SNOW, { ry: 90, keyEnd: WD, tintEnd: q.tint || LOG });
    a.box(dr.lx - dr.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, DARK); a.box(dr.lx + dr.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, DARK); a.box(dr.lx, 2.25, d / 2 + 0.1, dr.cw + 0.5, 0.2, 0.2, WD2, DARK);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; a.box(x, 1.1, d / 2 + 0.06, 1.4, 1.5, 0.08, GLS, 0xf0d890, { glow: 0.6 }); a.box(x, 0.96, d / 2 + 0.12, 1.8, 0.14, 0.16, WD2, DARK); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.1, z, 0.08, 1.5, 1.3, GLS, 0xf0d890, { glow: 0.6 });
    if (q.chimney) { a.box(q.chimney, q.h, -d / 2 + 1.0, 1.5, q.rh + 1.6, 1.5, 'rocks_5', STONE, { roof: true }); a.box(q.chimney, 0, -d / 2 + 0.7, 3.0, 2.4, 1.2, 'rocks_5', STONE); a.box(q.chimney, 2.4, -d / 2 + 0.75, 3.4, 0.2, 1.3, WD2, DARK); }
    if (q.porch) { a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62); const n = Math.max(2, Math.round(w / 3.5));
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - dr.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.24, 2.9, 0.24, WD2, DARK); }
        a.roof('shed', 0, 2.9, d / 2 + 1.85, w + 0.6, 0.8, 3.8, 'ice', SNOW); }
    if (q.name) a.sign(q.name, 0, q.h + (q.porch ? 0.9 : -0.2), d / 2 + (q.porch ? 0.16 : 0.14), Math.min(w - 1.5, q.name.length * 0.9 + 1.2), 1.0, '#f4ecd8', '#3a2a20', 'rye', q.porch ? { roof: true } : null); };

/* THE HEIGHTS of a room (makeRoom's, and the One World rooms'): o = { pw, ph, base, seed, deadLevel(i, j), zflat?(i), rockCap?, seaBed?, seaFall?, seaShore? },
   byXY['col:row'] = a plot { level }, flats = [[x0, y0, x1, y1, side]] squares levelled to their front. Returns the (W + 1) x (H + 1) corner heights. */
function heightsOf({ o, W, H, cell, byXY, flats, inR }) {
    const lv = (i, j) => { const p = byXY[Math.max(0, Math.min(o.pw - 1, i)) + ':' + Math.max(0, Math.min(o.ph - 1, j))]; return ((p ? p.level : o.deadLevel(Math.max(0, Math.min(o.pw - 1, i)), Math.max(0, Math.min(o.ph - 1, j)))) - o.base) * LEVEL; };
    const prof = (i, pz) => { const f = o.zflat ? o.zflat(i) : 1 / 3, qz = pz - 0.5, j = Math.max(0, Math.min(o.ph - 2, Math.floor(qz))), v = Math.min(1, Math.max(0, (qz - j - f / 2) / (1 - f))); return lv(i, j) * (1 - v) + lv(i, j + 1) * v; };
    /* `smooth` (THE ONE MOUNTAIN, 2026-11-20): one even fall from plot middle to plot middle both ways, no shelf at a plot's middle: a ski run never flattens under the board */
    const base = o.smooth ? (cx, cy) => { const px = cx / N - 0.5, pz = cy / N - 0.5, i = Math.floor(px), j = Math.floor(pz), u = px - i, v = pz - j; return (lv(i, j) * (1 - u) + lv(i + 1, j) * u) * (1 - v) + (lv(i, j + 1) * (1 - u) + lv(i + 1, j + 1) * u) * v; }
        : (cx, cy) => { const px = cx / N - 0.5, i = Math.max(0, Math.min(o.pw - 2, Math.floor(px))), u = Math.min(1, Math.max(0, (px - i - 1 / 6) / (2 / 3))); return prof(i, cy / N) * (1 - u) + prof(i + 1, cy / N) * u; };
    /* how far a mass square is from the nearest square that is not its own kind (squares; the room's edge is more of the same) */
    const distOf = ch => { const d = new Int16Array(W * H).fill(-1), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cell[y][x] !== ch) { d[y * W + x] = 0; q.push(x, y); }
        for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inR(X, Y) && d[Y * W + X] < 0) { d[Y * W + X] = v + 1; q.push(X, Y); } } }
        return d; };
    const dR = distOf('r'), dK = distOf('k');
    /* THE SEA CLIFFS (the on-screen check, 2026-11-15: the Coast Overlook looked at a wall of rock): rock near the sea does not climb, it falls.
       dZ = how far a square is from the nearest sea square; within `seaFall` squares the rock's rise is scaled down to nothing at the water */
    const dZ = (() => { if (o.seaBed == null) return null; const d = new Int16Array(W * H).fill(-1), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cell[y][x] === 'z') { d[y * W + x] = 0; q.push(x, y); }
        for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inR(X, Y) && d[Y * W + X] < 0) { d[Y * W + X] = v + 1; q.push(X, Y); } } }
        return d; })();
    const Hc = new Float64Array((W + 1) * (H + 1));
    for (let cy = 0; cy <= H; cy++) for (let cx = 0; cx <= W; cx++) {
        let h = base(cx, cy), all = { r: 1, k: 1, a: 1, z: 1 }, dmin = 1e9, kmin = 1e9, anyZ = 0;
        for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = cx + dx, y = cy + dy; if (!inR(x, y)) continue; const ch = cell[y][x];
            if (ch !== 'r') all.r = 0; else dmin = Math.min(dmin, dR[y * W + x]); if (ch !== 'k') all.k = 0; else kmin = Math.min(kmin, dK[y * W + x]); if (ch !== 'a') all.a = 0; if (ch !== 'z') all.z = 0; else anyZ = 1; }
        if (all.r && dmin < 1e9) { const n = vnoise(cx / 5, cy / 5, o.seed) * 0.6 + vnoise(cx / 1.7, cy / 1.7, o.seed + 7) * 0.4;   // THE ROCK: steep at the trail's edge, then climbing to a broken crest
            const sf = dZ ? Math.min(1, Math.max(0, (dZ[Math.min(H - 1, cy) * W + Math.min(W - 1, cx)] - 1) / (o.seaFall || 10))) : 1;
            h += sf * Math.min(o.rockCap || 26, 3.1 * Math.min(dmin, 2) + 1.7 * Math.max(0, dmin - 2)) * (0.7 + 0.6 * n); }
        else if (all.k && kmin < 1e9) h += Math.min(2.4, 1.0 * kmin) * (0.7 + 0.6 * vnoise(cx / 2.5, cy / 2.5, o.seed + 3));            // THE DEEP DRIFT / THE CLOUD BANK: a soft swell
        else if (all.a) h -= 9;
        if (all.z) h = o.seaBed; else if (anyZ && all.r === 0) h = Math.min(h, o.seaShore != null ? o.seaShore : h);   // THE SEA: its bed; a beach meets it at the shore line (a rock square beside it keeps its height: a cliff)                                                                                                         // THE CREVASSE: a slot cut down between its two rows
        Hc[cy * (W + 1) + cx] = h;
    }
    /* a building stands on level ground: its squares take the height at the middle of its front */
    flats.forEach(([x0, y0, x1, y1, side]) => { const fx = side === 'E' ? x1 : side === 'W' ? x0 : (x0 + x1) / 2, fy = side === 'S' ? y1 : side === 'N' ? y0 : (y0 + y1) / 2, ref = base(fx, fy);
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) Hc[cy * (W + 1) + cx] = ref; });
    return Hc;
}

/* ══ ONE ROOM: the plan's plots px0.. (pw x ph), its squares, and the helpers that dress it ══ */
function makeRoom(o) {
    const W = o.pw * N, H = o.ph * N, HW = W * C / 2, HD = H * C / 2;
    const gx = c => r2(-HW + c * C), gz = r => r2(-HD + r * C), mx = c => r2(-HW + (c + 0.5) * C), mz = r => r2(-HD + (r + 0.5) * C);
    const SRC = PLAN.rooms[o.room || 0];
    const cell = []; for (let r = 0; r < H; r++) cell.push(SRC.cells[o.py0 * N + r].slice(o.px0 * N, o.px0 * N + W).split(''));
    const plots = SRC.plots.filter(p => { const x = +p.id.slice(1, 3), y = +p.id.slice(4, 6); return x >= o.px0 && x < o.px0 + o.pw && y >= o.py0 && y < o.py0 + o.ph; })
        .map(p => Object.assign({}, p, { lx: +p.id.slice(1, 3) - o.px0, ly: +p.id.slice(4, 6) - o.py0 }));
    const byId = {}, byXY = {}; plots.forEach(p => { byId[p.id] = p; byXY[p.lx + ':' + p.ly] = p; });
    const F = [], props = [], doors = [], npc = [], marks = [], ARCH = [], flats = [], count = {}, taken = new Set();
    const feat = f => { F.push(f); return f; };
    /* the random numbers: one stream a district (o.streams, THE DISTRICT FILES), so a district's dressing never shifts another's */
    const main = { v: o.seed }, streams = {}; let cur = main, own = null;
    Object.keys(o.streams || {}).forEach(L => { streams[L] = { v: o.streams[L] }; });
    const rnd = () => { cur.v = (cur.v * 1664525 + 1013904223) >>> 0; return cur.v / 4294967296; };
    const ownOf = L => new Set(plots.filter(p => p.district === PLAN.districts[L]).map(p => p.id));
    const inDistrict = (L, fn) => { if (!streams[L]) throw new Error(o.id + ': no random stream for district ' + L + ' (makeRoom opts `streams`)'); cur = streams[L]; own = ownOf(L); try { return fn(); } finally { cur = main; own = null; } };
    const anchors = {}, anchor = (name, at) => { anchors[name] = at; };
    const inR = (x, y) => x >= 0 && y >= 0 && x < W && y < H, open = (x, y) => inR(x, y) && !MASS[cell[y][x]];
    const S = (id, lx, ly) => { const p = byId[id]; if (!p) throw new Error('no plot ' + id + ' in ' + o.id); if (own && !own.has(id)) throw new Error(o.id + ': ' + id + ' (' + p.district + ') is another district\'s plot'); return [p.lx * N + lx, p.ly * N + ly]; };
    const plotAt = (sx, sy) => byXY[Math.floor(sx / N) + ':' + Math.floor(sy / N)] || null;
    const trailOf = p => (o.trail ? o.trail(p) : 'o');
    const carve = (x, y, ch) => { if (inR(x, y) && (cell[y][x] === 'r' || cell[y][x] === 'k' || cell[y][x] === 't')) { const p = plotAt(x, y); cell[y][x] = ch || (p ? trailOf(p) : 'o'); } };
    const carve2 = (x, y, vert, ch) => { carve(x, y, ch); if (vert) carve(x + 1, y, ch); else carve(x, y + 1, ch); };   // two squares wide, across the way it runs
    const run = (x0, y0, x1, y1, ch) => { const vert = x0 === x1, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) carve2(n ? Math.round(x0 + (x1 - x0) * i / n) : x0, n ? Math.round(y0 + (y1 - y0) * i / n) : y0, vert, ch); };
    const hubOf = p => { if (o.hubs && o.hubs[p.id]) return o.hubs[p.id]; let best = null; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { if (!open(p.lx * N + lx, p.ly * N + ly)) continue; const d = Math.hypot(lx - 5.5, ly - 5.5); if (!best || d < best[0]) best = [d, lx, ly]; }
        return best ? [best[1], best[2]] : [5, 5]; };
    /* THE PORTS: two plots the plan joins (each lists the other's side) meet on open squares; where the drawing left rock between them a trail is cut */
    { const SIDE = { N: [0, -1, 'S'], S: [0, 1, 'N'], W: [-1, 0, 'E'], E: [1, 0, 'W'] }; let cut = 0;
      (o.carves || []).forEach(([id, lx, ly, ch]) => { const p = byId[id]; cell[p.ly * N + ly][p.lx * N + lx] = ch; });
      (o.files || []).forEach(L => { const m = DISTRICTS[L]; if (!m || typeof m.tailor !== 'function') return; const mine = ownOf(L);   // THE DISTRICT FILES: tailor
          const at = (id, lx, ly) => { if (!mine.has(id)) throw new Error(o.id + ': tailor of ' + L + '.js on ' + id + ', not its plot'); if (!(lx >= 0 && ly >= 0 && lx < N && ly < N)) throw new Error('tailor: no square ' + lx + ',' + ly); const p = byId[id]; return [p.lx * N + lx, p.ly * N + ly]; };
          m.tailor({ N, plot: id => byId[id], get: (id, lx, ly) => { const q = at(id, lx, ly); return cell[q[1]][q[0]]; }, set: (id, lx, ly, ch) => { const q = at(id, lx, ly); cell[q[1]][q[0]] = ch; } }); });
      (o.extraPorts || []).forEach(([id, sd]) => { const p = byId[id], q = byXY[(p.lx + SIDE[sd][0]) + ':' + (p.ly + SIDE[sd][1])]; if (p.ports.indexOf(sd) < 0) p.ports.push(sd); if (q.ports.indexOf(SIDE[sd][2]) < 0) q.ports.push(SIDE[sd][2]); });
      plots.forEach(p => (p.ports || []).forEach(sd => { if (sd !== 'S' && sd !== 'E') return; const q = byXY[(p.lx + SIDE[sd][0]) + ':' + (p.ly + SIDE[sd][1])]; if (!q || (q.ports || []).indexOf(SIDE[sd][2]) < 0) return;
          const x0 = p.lx * N, y0 = p.ly * N; let met = false;
          for (let k = 0; k < N; k++) { if (sd === 'S' ? (open(x0 + k, y0 + N - 1) && open(x0 + k, y0 + N)) : (open(x0 + N - 1, y0 + k) && open(x0 + N, y0 + k))) met = true; }
          if (met) return;
          const hp = hubOf(p), hq = hubOf(q), qx = q.lx * N, qy = q.ly * N;
          if (sd === 'S') { const k = Math.max(1, Math.min(N - 3, hp[0])); run(x0 + hp[0], y0 + hp[1], x0 + k, y0 + hp[1]); run(x0 + k, y0 + hp[1], x0 + k, y0 + N - 1); run(qx + k, qy, qx + k, qy + hq[1]); run(qx + k, qy + hq[1], qx + hq[0], qy + hq[1]); }
          else { const k = Math.max(1, Math.min(N - 3, hp[1])); run(x0 + hp[0], y0 + hp[1], x0 + hp[0], y0 + k); run(x0 + hp[0], y0 + k, x0 + N - 1, y0 + k); run(qx, qy + k, qx + hq[0], qy + k); run(qx + hq[0], qy + k, qx + hq[0], qy + hq[1]); }
          cut++; }));
      count.portsCut = cut; }
    /* a way out: the trail carried from the plot's nearest open square straight to the room's wall, two wide; returns the door's place along the wall (m) */
    function spur(id, wall, ch) { const p = byId[id], x0 = p.lx * N, y0 = p.ly * N; let best = null;
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!open(x0 + lx, y0 + ly)) continue; const d = wall === 'w' ? lx : wall === 'e' ? N - 1 - lx : wall === 'n' ? ly : N - 1 - ly; if (!best || d < best[0]) best = [d, lx, ly]; }
        if (!best) throw new Error('no open square on ' + id);
        const lx = Math.min(best[1], N - 2), ly = Math.min(best[2], N - 2);
        if (wall === 'w') run(x0, y0 + ly, x0 + best[1], y0 + ly, ch); if (wall === 'e') run(x0 + best[1], y0 + ly, x0 + N - 1, y0 + ly, ch);
        if (wall === 'n') run(x0 + lx, y0, x0 + lx, y0 + best[2], ch); if (wall === 's') run(x0 + lx, y0 + best[2], x0 + lx, y0 + N - 1, ch);
        return (wall === 'w' || wall === 'e') ? gz(y0 + ly + 1) : gx(x0 + lx + 1); }
    function door(id, plotId, wall, d, ch) { const a = spur(plotId, wall, ch); const row = Object.assign({ id, wall }, (wall === 'w' || wall === 'e') ? { z: a } : { x: a }, d); doors.push(row); return row; }

    /* ── the dressing: a blocker stands on a free square's middle (put), decor off it (dec); the tool stops on a piece standing in the mass or on a taken square ── */
    const bad = [];
    const free = (sx, sy, what) => { if (!open(sx, sy) || cell[sy][sx] === 'B' || taken.has(sx + ':' + sy)) { bad.push(what + ' @ ' + sx + ',' + sy + ' (' + (inR(sx, sy) ? cell[sy][sx] : 'out') + ')'); return false; } return true; };
    const put = (id, key, lx, ly, q) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, key)) return; taken.add(sx + ':' + sy); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, q || {})); };
    const dec = (id, key, lx, ly, q) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, key)) return; props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, q || {})); };
    const tree = (id, kind, h, lx, ly, r) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, kind)) return; taken.add(sx + ':' + sy); feat({ k: 'tree', x: mx(sx), z: mz(sy), kind, h, r: r || 0.8 }); };
    const native = (id, race, lx, ly, face, say) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, race)) return; taken.add(sx + ':' + sy); const n = { x: mx(sx), z: mz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

    /* ── THE BUILDINGS (the city's way, the Desert's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside)
       with its own outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the front. ── */
    function sheet() { const P = [];
        const add = (q, key, tint, x) => { if (key) q.key = key; if (tint != null) q.tint = tint; if (x) Object.assign(q, x); if (/GlassWindow/.test(key || '') && q.glow == null) q.glow = 0.3; P.push(q); return q; };
        const A = { P,
            box: (x, y, z, w, h, d, key, tint, q) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, q),
            cyl: (x, y, z, r, h, key, tint, q) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, q),
            dome: (x, y, z, r, h, key, tint, q) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, q),
            quad: (x, y, z, w, h, key, tint, q) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, q),
            /* a roof is drawn from outside only: one timber sheet facing down under it (Camelot's "gaps in the roofs") */
            roof: (form, x, y, z, w, h, d, key, tint, q) => { add({ s: 'box', p: [x, y, z], size: [(q && q.ry) ? d : w, 0.02, (q && q.ry) ? w : d], sides: false, top: false, under: true, roof: true }, WD2, 0x4a3626);
                return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, q); },
            shell(w, h, d, key, tint, dr, uv) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? { uv } : null;
                add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
                add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(dr.lx), r2(dr.cw), 2.2] }, key, tint, x); },
            sign(words, x, y, z, w, h, fg, bg, font, q) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, q || {})); } };
        return A; }
    function texbDoor(w, dr) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (dr >= 1) col = Math.min(cols - 1, Math.round(dr) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
    function building(id, plotId, q, h, opt, parts) {   // q = [lx0, ly0, lx1, ly1, side] in the plot's squares (the end is exclusive); `side` = the wall its front is on
        const a0 = S(plotId, q[0], q[1]), sx0 = a0[0], sy0 = a0[1], sx1 = sx0 + q[2] - q[0], sy1 = sy0 + q[3] - q[1], side = q[4];
        const ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
        for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { if (MASS[cell[y][x]]) cell[y][x] = 'B'; taken.add(x + ':' + y); }
        const row = Object.assign({ k: 'texbuilding', id: o.tag + ':' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, opt || {});
        Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
        feat(row); flats.push([sx0, sy0, sx1, sy1, side]);
        const a = sheet(), dr = texbDoor(fw, row.door); parts(a, fw, fd, dr);
        ARCH.push({ k: 'arch', id: o.tag + ':' + id + ':look', x: cx, z: cz, rot, parts: a.P });
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); count.buildings = (count.buildings || 0) + 1;
        const B = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door: dr, cx, cz, rot };
        B.put = (key, lx, lz, q2) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, q2 || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame (180 = looking out of its front)
        return B; }
    const look = (id, sx, sy, fn) => { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: o.tag + ':' + id, x: r2(sx), z: r2(sy), rot: 0, parts: a.P }); };   // a free-standing look (no collision) at a metre spot

    /* ── THE HEIGHTS (after every square is final): heightsOf below (one function, so a One World room lays its heights by the same rule) ── */
    const heights = () => heightsOf({ o, W, H, cell, byXY, flats, inR });
    const flat = (id, lx0, ly0, lx1, ly1) => { const a = S(id, lx0, ly0); flats.push([a[0], a[1], a[0] + lx1 - lx0, a[1] + ly1 - ly0, 'S']); };   // level ground (the reservoir, a car park)
    const R = { sheet, o, W, H, HW, HD, gx, gz, mx, mz, cell, plots, byId, F, props, doors, npc, marks, ARCH, count, taken, feat, rnd, open, inR, S, plotAt, carve, run, spur, door, put, dec, tree, native, building, look, flat, heights, bad, flats, anchors, anchor, inDistrict };
    R.ctx = Object.assign({}, R, { N, C, r2, U, WD, WD2, SHG, FLR, GLS, ROT, DOORWORDS, cabin, say: (old, race) => sayOf(OLD[old], race) });   // what a district file is handed (THE DISTRICT FILES)
    delete R.ctx.inDistrict; delete R.ctx.heights; delete R.ctx.spur; delete R.ctx.door; delete R.ctx.carve; delete R.ctx.run;   // the tool's own: the ways out and the trails
    return R;
}

/* ══ the room's block: the spaces, the paint, the slope, the tree zones, the checks ══ */
function finish(R, e) {
    const { o, W, H, gx, gz, mx, mz, cell, F, props, doors, npc, ARCH, count, open } = R;
    if (R.bad.length) throw new Error(o.id + ': ' + R.bad.length + ' pieces stand on a square that is not free:\n  ' + R.bad.join('\n  '));
    ARCH.forEach(a => F.push(a));
    /* the walked squares as `space` rows (greedy rectangles) */
    const used = new Uint8Array(W * H), spaces = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y) || used[y * W + x]) continue;
        let w = 1; while (x + w < W && !used[y * W + x + w] && open(x + w, y)) w++;
        let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (used[(y + h) * W + x + i] || !open(x + i, y + h)) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1;
        spaces.push({ k: 'space', x: r2(gx(x) + w * C / 2), z: r2(gz(y) + h * C / 2), w: w * C, d: h * C }); }
    count.spaces = spaces.length;
    /* the tree zones: trees only where the plan drew trees; the rock, the drift and the crevasse stay bare */
    const zones = [], zu = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 't' || zu[y * W + x]) continue; const key = e.treeKey(x, y);
        let w = 1; while (x + w < W && !zu[y * W + x + w] && cell[y][x + w] === 't' && e.treeKey(x + w, y) === key) w++;
        let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (zu[(y + h) * W + x + i] || cell[y + h][x + i] !== 't' || e.treeKey(x + i, y + h) !== key) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) zu[(y + j) * W + x + i] = 1;
        zones.push(Object.assign({ x0: gx(x), z0: gz(y), x1: gx(x + w), z1: gz(y + h) }, e.trees[key])); }
    zones.push({ x0: gx(0) - 50, z0: gz(0) - 50, x1: gx(W) + 50, z1: gz(H) + 50, none: true });
    count.zones = zones.length;
    /* the heights, a square's four corners at a time */
    const Hc = R.heights(), slope = Buffer.alloc(W * H * 8);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((c, k) => slope.writeInt16LE(Math.round(Hc[(y + c[1]) * (W + 1) + x + c[0]] * 100), q + k * 2)); }
    const paint = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint[y * W + x] = e.paintOf(cell[y][x], x, y);
    /* checks: every key and unit exists; every plot is walked to from the spawn; no walked step is steeper than the walker climbs */
    const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
    props.forEach(p => { if (!CAT[p.key]) throw new Error(o.id + ': not in the catalogue: ' + p.key); });
    npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error(o.id + ': not a unit: ' + n.race); });
    const hC = (x, y) => (Hc[y * (W + 1) + x] + Hc[y * (W + 1) + x + 1] + Hc[(y + 1) * (W + 1) + x] + Hc[(y + 1) * (W + 1) + x + 1]) / 4;
    const seen = new Uint8Array(W * H), st = [e.spawn]; if (!open(e.spawn[0], e.spawn[1])) throw new Error(o.id + ': the spawn is not open'); seen[e.spawn[1] * W + e.spawn[0]] = 1; let steep = 0;
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!open(X, Y) || seen[Y * W + X]) continue;
        if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.85) { steep++; continue; } seen[Y * W + X] = 1; st.push([X, Y]); } }
    const cold = R.plots.filter(p => { if ((e.noWalk || []).indexOf(p.id) >= 0) return false; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.ly * N + ly) * W + p.lx * N + lx]) return false; return true; }).map(p => p.id);
    if (process.env.MTN_DUMP === o.tag) console.log(cell.map((r, y) => r.map((ch, x) => open(x, y) && !seen[y * W + x] ? '!' : MASS[ch] ? (ch === 't' ? '.' : ' ') : ch).join('')).join('\n'));
    if (cold.length) throw new Error(o.id + ': plots not reached on foot: ' + cold.join(' '));
    let op = 0, un = 0, hi = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (open(x, y)) { op++; if (!seen[y * W + x]) un++; hi = Math.max(hi, hC(x, y)); }
    Object.assign(count, { openSquares: op, unreachedSquares: un, steepSteps: steep, topWalkedM: r2(hi), features: F.length + spaces.length, props: props.length, doors: doors.length, natives: npc.length });
    const L = [];
    L.push("        " + o.id + ": {");
    L.push("            label: '" + e.label + "',");
    L.push("            sub: '" + e.sub + "',");
    L.push("            kind: 'box', site: '" + e.site + "', part: '" + e.part + "',");
    if (e.world) { L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */"); L.push("            world: " + J(e.world) + ","); }
    /* THE ROOM'S OWN PEOPLE (2026-11-16, district N; mondo: "Is there not already units tagged with North Pole or ice? ... figure it out whatever fits"):
       a district file may export `encounters = { list: [{ race, w }], walkers, levels, group, spots }` (data.js THE ENCOUNTER TABLE: who walks the room,
       weighted; mondo's AREA UNITS window still wins over it). A room's table = its files' lists joined (a race twice keeps its larger weight), the
       ranges of the first file that has them. No file exports one = no row, the game's own people, as before. */
    { const encs = (o.files || []).map(Lt => DISTRICTS[Lt] && DISTRICTS[Lt].encounters).filter(Boolean);
      if (encs.length) { const list = []; encs.forEach(E => (E.list || []).forEach(x => { if (RACES.indexOf(x.race) < 0) throw new Error(o.id + ': encounters: not a unit: ' + x.race); const y = list.find(z => z.race === x.race); if (y) y.w = Math.max(y.w, x.w); else list.push({ race: x.race, w: x.w }); }));
          L.push("            encounters: " + J(Object.assign({}, encs[0], { list })) + ","); } }
    /* THE AIR BY DISTRICT (2026-11-16, district S; Camelot's hook): a district file may export `airZones(ctx)` = [{ x0, y0, x1, y1 (the room's squares, from S()),
       kind, color?, n?, speed?, wind? }] (three-renderer.js HQ_ATMOS_KINDS: snow, motes, fireflies, dust, ash, spores ...). The zones of a room's files are joined
       into the shell's `atmos`. No file exports one = the shell as it was, byte for byte. */
    { const raw = e.air || [].concat(...(o.files || []).map(Lt => (DISTRICTS[Lt] && typeof DISTRICTS[Lt].airZones === 'function') ? R.inDistrict(Lt, () => DISTRICTS[Lt].airZones(R.ctx).map(z => Object.assign({ L: Lt }, z))) : []));
      R.airRaw = raw;   // (THE ONE WORLD MOVE stands the home room's zones on the moved plots: e.air = them, in the new room's squares)
      const air = raw.map(z => { z = Object.assign({}, z); delete z.L; return z; })
          .map(z => { const q = Object.assign({}, z, { x0: gx(z.x0), z0: gz(z.y0), x1: gx(z.x1), z1: gz(z.y1) }); delete q.y0; delete q.y1; return q; });
      if (air.length) { if (e.shell.indexOf('look: HQ_ROOM_LOOKS') < 0) throw new Error(o.id + ': airZones: the shell has no `look:` to write the air before'); e = Object.assign({}, e, { shell: e.shell.replace('look: HQ_ROOM_LOOKS', 'atmos: ' + J({ kind: air[0].kind, tier: 'open', zones: air }) + ', look: HQ_ROOM_LOOKS') }); } }
    L.push("            shell: " + e.shell + ",");
    L.push("            parti: '" + e.parti + "',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + o.pw + ", nz: " + o.ph + (e.mask ? ", nx: " + o.pw + ", mask: " + J(e.mask) : "") + ", names: " + J(R.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
    L.push("            terrain: {");
    L.push("                res: 1.75, floor: '" + e.floor + "', cliff: '" + (e.cliff || 'rocks_5') + "', path: 'dirt_2',   // half a square a node (the Desert's and the kingdom's grain: a room this size at 0.875 stands up four times slower)");
    L.push("                noise: { amp: 0.1, scale: 8 },");
    if (e.sea) L.push("                sea: " + J(e.sea) + ",");
    L.push("                backdrop: false, edges: " + J(e.edges) + ",");
    L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(e.pal) + ", t: 'u8', res: " + C + ", x0: " + mx(0) + ", z0: " + mz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
    L.push("                gen: { kind: 'plan', look: 'trees', seed: " + o.seed + ", rim: 0, forceGrow: 0, treeGap: 2.6, treeIn: 0.9, spacing: 3.5, depth: 5.25, maxTrees: " + e.maxTrees + ", treeH: [5.5, 8.5], kinds: " + J(e.trees[e.treeDefault].kinds) + ", zones: " + J(zones) + " },");
    L.push("                marks: " + J(R.marks) + ",");
    L.push("                features: [");
    spaces.forEach(f => L.push("                    " + J(f) + ","));
    F.forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    doors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(e.lines) + ",");
    L.push("            spawn: { x: " + mx(e.spawn[0]) + ", z: " + mz(e.spawn[1]) + ", face: " + (e.face || 0) + " },");
    L.push("        },");
    console.log(o.id + ' ' + JSON.stringify(count));
    return L;
}

/* ════════════════════════════════════════════════ THE NORTH POLE (plan columns 0-3) ════════════════════════════════════════════════ */
const NP = makeRoom({ id: POLE, tag: 'pole', files: ['N'], streams: { N: 16 }, px0: 0, py0: 0, pw: 4, ph: 4, base: 9, seed: 16, deadLevel: () => 9, rockCap: 12 });
{ const R = NP, { put, dec, tree, native, building, look, S, door, mx, mz, gx, gz, props } = R;
  /* THE WAYS: the Pass Gate (east, up into the Mountains), the sleigh road south to Camelot's north gate (the link `northpole_camelot`), the bay door of DOOR HQ */
  /* THE POLAR TRAIL (route R5, One World phase 4.1, 2026-11-17): the village's west way. The trail comes in across the tundra from the Mountains' ridge and
     reaches the Pole on its west wall at row -27 (seam ow_v_0_m27); it replaces the Pass Gate (`pass`, east wall), which jumped to the Lodge without a walk */
  if (vm.runInContext('!!DOOR_HQ.rooms.site_ow_r5', D)) door('ow_v_0_m27', 'P00-01', 'w', Object.assign({ way: 'open', passage: { len: 3, deep: 1.2, w: 5 }, action: { room: 'site_ow_r5', at: 'ow_v_0_m27' } }, DOORWORDS('THE POLAR TRAIL', 'THE WEST WAY · ACROSS THE TUNDRA TO THE MOUNTAINS', 'Past the last cottage the snow goes flat and white to the west. A line of cairns marks a trail across it, towards the mountains.')));
  const SLEIGH = R.spur('P03-03', 's'), BAY = R.spur('P01-03', 's');
  runDistricts(R, 'apply'); runDistricts(R, 'build');   // THE DISTRICT FILES: everything that stands on the plots
  R.out = { SLEIGH, BAY };
}

/* ════════════════════════════════════════════════ THE MOUNTAINS (plan columns 4-15) ════════════════════════════════════════════════ */
const SKI = { 3: 1, 4: 1, 5: 1 };   // the slopes' columns: one even grade from the Top Station to the Lodge (no flat shelves on a run)
/* `streams`: the states the room's one stream had at each district's first decor when the districts were split out (11-16): the split changed no number */
const M = makeRoom({ id: MTN, tag: 'mtn', oneMountain: true, files: ['P', 'K', 'S', 'O'], streams: { P: 72, K: 2855161781, S: 3659870008, O: 2570278025 }, px0: 4, py0: 0, pw: 12, ph: 8, base: 8, seed: 72, rockCap: 26,
    hubs: { 'P06-02': [6, 3] }, extraPorts: [['P05-00', 'S'], ['P12-03', 'E'], ['P07-03', 'S'], ['P08-03', 'S'], ['P09-03', 'S']],   /* (11-20: the Rental Hut, the Lodge and the Yard open south onto the village's new plots) */   // …and (THE SWAP, plan 2) the Goat Track walks on east to Bunny Flat: Olympus and Shasta meet there   // the Ridge is climbed from the High Pass (the plan drew it joined to nothing)
    carves: [7, 8, 9].map(ly => ['P12-01', 7, ly, 'm']).concat([['P12-01', 7, 10, 'm']], [2, 3, 4, 5, 6].flatMap(lx => [['P12-01', lx, 5, 'm'], ['P12-01', lx, 6, 'm']])),   // THE CLOUD LINE: the stair is two squares wide all the way, and the Colonnade's walk goes on through the cloud to it
    hubs2: 0,   // the Rope Bridge's trails leave from the snow north of the crevasse (never along the slot)
    deadLevel: (i, j) => j >= 4 ? [9, 9, 8, 8][j - 4] : 8, zflat: i => SKI[i] ? 0 : 1 / 3,
    trail: p => p.district === 'Mount Olympus' ? 'm' : (p.district === 'Mount Shasta' && p.level <= 11) ? 'p' : 'o' });
{ const R = M, { put, dec, tree, native, building, look, S, door, mx, mz, gx, gz, props, feat, cell } = R;
  /* ── THE WAYS ── */
  /* (2026-11-17, One World phase 4.1) the Pass Gate `pass` to the North Pole is gone: the Polar Trail (route R5) walks from the Ridge to the Pole now */
  /* (2026-11-17, One World phase 5) the Trailhead's `woods` door (a jump down to the Redwood Trail, 13 plots away) is gone: the trail down from the Trailhead is the Canyon Trail (R2, seam ow_h_m3_m14 on this same side); the Redwood Trail goes up to the Snowy Pass by the wild link L3 */
  { const p = R.byId['P12-00']; for (let ly = 0; ly <= 7; ly++) for (const lx of [7, 8]) cell[p.ly * N + ly][p.lx * N + lx] = 'm'; }   // THE GRAND STAIR goes on up through the cloud to the room's north wall
  const WAY = { heaven: R.spur('P12-00', 'n', 'm'), vatican: R.spur('P11-03', 's', 'm') };
  /* THE HOLLYWOOD HILLS (plan 2): Shasta's east side walks on into the Hills (the city's mountain road lands there now, not at the Lodge Yard) */
  /* (2026-11-17, One World phase 5) the `hills` door (the Shasta Road, a jump east to the Hollywood Hills) is gone with the Hills' `shasta`: the Hills are walked to by the Canyon Trail (R2) and the River Road (R1) */
  /* (2026-11-17, One World phase 4.1) the `saddle` door to the Hills' ridge is gone: that ridge way is the River Road's (route R1) now; the Hills are reached by the Canyon Trail (R2) */

  runDistricts(R, 'apply'); runDistricts(R, 'build');   // THE DISTRICT FILES: everything that stands on the plots
  R.out = WAY;
}


/* (The Hollywood Hills stood here as a third room until 2026-11-16: Disaster City's district N now, docs/disaster-city/districts/N.js.) */

/* ══ the two rooms ══ */
const SNOWPINES = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3', 'xmas_pine'];
const SKY_DAY = "{ night: 0, world: { kind: 'plain' }, tint: 0x9fc4e8, tintAmt: 0.3, stars: 0.5, nebula: 0.6, day: 1, clouds: 0.35, fog: { color: 0xbfd8ea, amount: 0.45, top: 0.05, band: 0.5, density: 0.006 }, scenery: 'none' }";
const mSpawn = M.S('P09-03', 5, 6), pSpawn = NP.S('P02-01', 5, 8);
const mBlock = finish(M, { label: 'THE MOUNTAINS', sub: 'THE SNOWY PASS · THE SKI LODGE · MOUNT SHASTA · MOUNT OLYMPUS', site: 'prebuilt_shasta', part: 'mountains',
    shell: "hqAncientShell({ w: " + (2 * M.HW) + ", d: " + (2 * M.HD) + ", h: 20, wallH: 20, floor: 'ice', apron: 'ice', skirt: 'rocks_5', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + M.mx(mSpawn[0]) + ", z: " + M.mz(mSpawn[1]) + ", y: 5.0 },\n" +
           "                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xf0f4ff, ambient: 0.6 },\n" +
           "                                    sky: " + SKY_DAY + ",\n                                    look: HQ_ROOM_LOOKS.mountain })",
    parti: 'One range on fifty-six plots, every plot a twelve by twelve board: three trails and three places you end up (the volcano over the Woods, the pass down to the Pole, the temple above the cloud), with a ski lodge where they meet and five runs to ride down.',
    floor: 'grass_2', pal: ['ice', 'rocks_5', 'dirt_2', 'ice_1', 'marble_light', 'igloo', 'wood_planks', 'obsidian'],
    paintOf: (ch, x, y) => { const p = M.plotAt(x, y), oly = p && p.district === 'Mount Olympus';
            return ch === 's' || ch === 'B' ? 1 : ch === 'k' ? (oly ? 5 : 1) : ch === 'r' ? 2 : (ch === 'p' || ch === 'd') ? 3 : (ch === 'i' || ch === 'x' || ch === 'a') ? 4 : ch === 'm' ? 5 : ch === 'o' ? 6 : (ch === 'j' || ch === 'b') ? ((p && p.id === 'P06-02') || ch === 'b' ? 7 : 6) : ch === 'h' ? 8 : (ch === 't' && p && p.ly === 3 && p.lx < 3) ? 1 : 0; },
    trees: { snow: { kinds: SNOWPINES, treeH: [5.5, 8] }, pine: { kinds: ['pine', 'pine', 'tree_3', 'tree_2'], treeH: [5.5, 9] } }, treeDefault: 'pine', maxTrees: 2600,
    treeKey: (x, y) => { const p = M.plotAt(x, y); return (p && p.ly === 3 && p.lx < 3) ? 'snow' : 'pine'; },
    edges: { reach: 440, n: { kind: 'mountain' }, w: { kind: 'mountain' }, e: { kind: 'mountain' }, s: { kind: 'forest' } },
    lines: O_SHASTA.l.concat(O_OLYMPUS.l), spawn: mSpawn, face: 0 });
const pBlock = finish(NP, { label: 'THE NORTH POLE', sub: 'THE VILLAGE · THE WORKSHOP · THE FROZEN LAKE · THE DRIFT · THE POLE', site: 'prebuilt_northpole', part: 'plots',
    shell: "hqAncientShell({ w: " + (2 * NP.HW) + ", d: " + (2 * NP.HD) + ", h: 20, wallH: 20, floor: 'ice', apron: 'ice', skirt: 'ice_1', apronColor: 0xe8f0ff, floorColor: 0xe8f0ff, plate: { x: " + NP.mx(pSpawn[0]) + ", z: " + NP.mz(pSpawn[1]) + ", y: 5.0 },\n" +
           "                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xf0e8d8, ambient: 0.5, night: 1 },\n" +
           "                                    sky: { night: 1, world: { kind: 'plain', ground: 'ice', groundColor: 0xe8f0ff }, tint: 0x0d1424, tintAmt: 0.5, stars: 1.4, nebula: 1.6, fog: { color: 0x1c2c48, amount: 0.5, top: 0.05, band: 0.5, density: 0.012 }, scenery: 'none' },\n" +
           "                                    look: HQ_ROOM_LOOKS.white })",
    parti: 'A high white valley on sixteen plots behind the pass: a village round a tree, a workshop with its lights on, a pole with stripes, a lake you can walk on, and drifts too deep to cross anywhere but the road.',
    floor: 'ice', pal: ['ice_1', 'igloo', 'wood_planks'], paintOf: ch => ch === 'i' ? 1 : ch === 'o' ? 2 : 0,
    trees: { snow: { kinds: SNOWPINES, treeH: [5.5, 8] } }, treeDefault: 'snow', maxTrees: 1400, treeKey: () => 'snow',
    edges: { world: true, reach: 440, ways: [{ side: 'w', at: -38.5 }, { side: 'n', at: -61.25 }] },   /* ONE WORLD PHASE 5 (2026-11-17): the land past the Pole's line reads the map (tundra west, south and east, the Frozen Sea north). It was a mountain on all four sides, from when the village stood behind the Pass Gate: the Polar Trail came in across flat tundra and met a mountain wall, and the sea to the north was a ridge. The ways: the Polar Trail's west way, the track north to the Frozen Sea */
    lines: O_POLE.l, spawn: pSpawn, face: 0 });
[[NP, ['hearth']], [M, ['painting', 'bayOlympus', 'lemuria', 'bayShasta']]].forEach(([R, need]) => need.forEach(k => { const a = R.anchors[k]; if (!a || !isFinite(a.x) || !isFinite(a.z)) throw new Error(R.o.id + ': no anchor `' + k + '` (a district file sets it: THE DISTRICT FILES)'); }));

/* ══ THE ONE WORLD MOVE (2026-11-17, mondo's approved map v13; docs/plans/one-world/BUILD_PLAN.md phase 3, wave A: "Olympus, the Snowy Pass, the Ski
   Lodge, Shasta as climbs along the range; the North Pole stays") ═════════════════════════════════════════════════════════════════════════════════
   Everything above builds the Mountains in THE HOME FRAME, the 12 x 8 room the four district files were written for (its checks run as before; that
   room is not written any more). Here the result is stood where the One World map puts it (docs/plans/one-world/plots.json; the mover = ow-move.js),
   by THE ROOM-SPLITTING RULE (areas-complexes.md: join what touches until a number stops it; 30 plots, a 12 x 12 box):
     site_prebuilt_shasta_ow_lodge     THE SKI LODGE (K) + the wild link L9 + THE SNOWY PASS (P)     29 plots, box 10 x 9 at world -23,-22
     site_prebuilt_shasta_ow_olympus   the wild link L10 + MOUNT OLYMPUS (O) + the wild link L11      19 plots, box 10 x 6 at -14,-18
     site_prebuilt_shasta_ow_shasta    MOUNT SHASTA (S)                                               20 plots, box  7 x 7 at -4,-21
   (the Snowy Pass + L10 + Olympus would be 31 plots: L10, two plots, joins the room of the district it touches by rule 4, Olympus's.)
   A plot keeps its name, its squares and every piece on it; its id is its place in its new room's grid. What is laid again is the tool's own:
   the box's other cells (the map's ground there: rock, drift or forest, nobody walks them), the joints between plots that touch now (a trail cut
   from each plot's hub, the home's own rule), the heights (heightsOf, the same rule on the plots as they stand), the paint, the tree zones, the open
   ground, the seams. The three wild links' plots are THIS tool's (rule 4 for L10; L9 and L11 sit inside their rooms' boxes): a snowfield on each
   plot with the trail across it and ONE place beside it (ow-places.js; every name an idea of Claude's, plain). The North Pole stays as it is
   (its world place is bake-map.js's). Rules: docs/notes/areas-complexes.md "ONE WORLD, HOW A ZONE MOVES"; this move: "THE MOUNTAINS, THE ONE WORLD MOVE". */
const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8')), OWP = require('./ow-places.js');
const hasRoom = id => vm.runInContext('!!DOOR_HQ.rooms.' + id, D);
const HOMEP = M.plots.map(p => ({ id: p.id, x: p.lx, y: p.ly, name: p.name, district: p.district, level: p.level }));
const MOVER = require('./ow-move.js')({ cols: M.o.pw, rows: M.o.ph, cell: M.cell, fill: 'r', plots: HOMEP, features: M.F, props: M.props, npc: M.npc, doors: M.doors });
/* ── THE ONE MOUNTAIN (2026-11-20, world polish thread 5; mondo: "The ski trails should be all over the mountain ... I should be able to ski all the way from
   the top of mt Olympus to the base"; his "okay" on the plan). Where every plot stands, its level, the runs and the walking ways are THE PLAN:
   docs/plans/world-polish/thread5/draw-mountain.js (it checks itself and draws mountain-plan.png). The plots of K, P, S and O are stood by its grid, not by
   plots.json's v13 places (docs/plans/one-world/after-v13.js writes the plan's places into plots.json). Mount Shasta is gone as a name: its plots are the
   middle and top of the mountain and wear the district of the ground they stand on. Notes: areas-complexes.md "THE MOUNTAINS, ONE SKI MOUNTAIN". ── */
const MP = require('./docs/plans/world-polish/thread5/draw-mountain.js');
const DNAME = { K: 'The Ski Lodge', P: 'The Snowy Pass', O: 'Mount Olympus', D: 'The Long Descent' };
const RENAMED = { 'the cornice': 'Shastina', 'the bowl': 'The Summit', 'the frozen lake': 'Helen Lake', 'the meadows': 'Panther Meadows', 'the hot springs': 'The Steam Vents' };   // the plan's plain name: the plot that moves there
const PLACE_OF = { '2,2': 'trapper', '3,2': 'camp', '4,1': 'minecart', '6,1': 'snowman', '4,2': 'markers', '8,8': 'totem', '9,8': 'markers', '13,7': 'camp', '13,6': 'trapper', '14,6': 'minecart', '14,7': 'snowman', '15,7': 'stone' };   // the old wild links' places (ow-places.js)
const homeByName = {}; M.plots.forEach(p => { homeByName[p.name.toLowerCase()] = p; });
const nice = t => t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase()) : t.replace(/^the (camp|trapper|mine|snowman|boundary)/, (m, a) => 'The Long Descent, the ' + a);
const USED = {};
/* the old slopes ran north to south; on the mountain the fall line runs east to west: a piste plot of the old resort is TURNED a quarter (its uphill side, north at home,
   faces east), so its tree lines, poles, gates, kicker and half-pipe lie along its run. The Lodge, the Rental Hut and the Yard are not turned (the Lodge fronts the Yard). */
const TURNED = { 'P07-00': 1, 'P07-01': 1, 'P07-02': 1, 'P08-00': 1, 'P08-01': 1, 'P08-02': 1, 'P09-00': 1, 'P09-01': 1, 'P09-02': 1 };
const planList = keep => MP.cells.filter(keep).map(([c, r]) => { const raw = MP.NAME[c + ',' + r], star = /\*$/.test(raw), nm = raw.replace(/\*$/, ''), key = nm.toLowerCase();
    const base = { wx: MP.WX0 + c, wy: MP.WY0 + r, level: MP.L(c, r), district: DNAME[c >= 13 ? 'D' : MP.DIST(c, r)] };
    if (PLACE_OF[c + ',' + r]) return Object.assign(base, { name: nice(nm), place: PLACE_OF[c + ',' + r] });
    if (!star) return Object.assign(base, { name: nice(nm) });
    const h = homeByName[(RENAMED[key] || nm).toLowerCase()]; if (!h) throw new Error('the plan names a standing plot the layout does not have: ' + raw);
    if (USED[h.id]) throw new Error('the plan stands ' + h.name + ' twice'); USED[h.id] = 1;
    return Object.assign(base, { id: h.id, name: RENAMED[key] ? nm : h.name }, TURNED[h.id] ? { turn: 90 } : null); });
const WOODS_ROOM = hasRoom('site_prebuilt_fairy_forest_ow_redwood') ? 'site_prebuilt_fairy_forest_ow_redwood' : 'site_prebuilt_fairy_forest_plots';   // the Woods thread moves the Snowline (11-17)
/* THE SEAMS: { at: [world x, y], side } of a plot in this room -> the room past that side (the seam's own id on both doors, rule 6). `ifRoom` = written only
   when that room stands (a neighbour zone's link that is not merged yet). `way`: the route kit's rule by the link plot's ground (rock = an arch, snow = open). */
const STAND = [
    { id: R_LODGE, part: 'ow_lodge', files: ['K', 'P', 'S', 'O'], label: 'THE MOUNTAINS · THE SKI MOUNTAIN', sub: 'THE SKI LODGE · THE SNOWY PASS · MOUNT OLYMPUS · ONE MOUNTAIN, TOP TO BOTTOM',
      list: planList(([c]) => c <= 12), spawn: ['P09-03', 5, 6], lines: O_OLYMPUS.l.concat(O_SHASTA.l), smooth: true,
      parti: 'One ski mountain: the temples of Mount Olympus on the summit, double blacks off the top, blacks and blues down the middle, greens to the Ski Lodge and its village at the west foot; the Pass Road snakes across it from the tree line to the ridge.',
      seams: [{ at: [-16, -14], side: 'W', id: 'ow_v_m16_m14', room: 'site_ow_l3', way: 'trail', label: 'THE WOODS · THE REDWOOD TRAIL', sub: 'THE TREE LINE · DOWN INTO THE TREES', desc: 'The trail drops off the snow into the first of the big trees.', ifRoom: 1 },
              { at: [-22, -16], side: 'W', id: 'ow_v_m22_m16', room: 'site_ow_l6', way: 'open', open: 5, label: 'CAME A LOT KINGDOM · THE SNOWY PINES', sub: 'THE LODGE YARD · WEST DOWN THE VALLEY', desc: 'Ski tracks give out at the yard’s end. Past them a trail goes west and down, into pines.', ifRoom: 1 },
              { at: [-14, -22], side: 'E', k: [5, 6], id: 'ow_v_m13_m22', room: 'site_ow_r5', way: 'open', open: 5, label: 'THE POLAR TRAIL', sub: 'THE RIDGE · EAST ACROSS THE TUNDRA', desc: 'Past the end of the ridge the snow flattens out into tundra, and a line of cairns goes east towards the Pole.', ifRoom: 1 },
              { at: [-11, -13], side: 'E', k: [5, 6], id: 'ow_v_m10_m13', room: 'site_ow_r3', way: 'trail', label: 'THE PILGRIM WAY', sub: 'THE PILGRIM STAIR · DOWN THE WAY OF SHRINES', desc: 'A worn path leaves the stair and goes down through the trees, past little shrines.', ifRoom: 1 },
              { at: [-10, -15], side: 'E', id: 'ow_v_m9_m15', room: R_SHASTA, way: 'open', open: 5, label: 'THE LONG DESCENT', sub: 'THE AMPHITHEATRE · EAST AND DOWN TO THE RIVER ROAD', desc: 'The snow runs on east and down in long bends, towards the low country.' }] },
    { id: R_SHASTA, part: 'ow_shasta', files: ['S'], label: 'THE MOUNTAINS · THE LONG DESCENT', sub: 'MOUNT OLYMPUS · THE EAST WAY DOWN · 13 PLOTS',
      list: planList(([c]) => c >= 13), spawn: ['P13-07', null, null], lines: [], smooth: true,
      parti: 'The east way off the mountain: thirteen plots of snow in long bends from the Amphitheatre down to the Trailhead, where the canyon trail goes on to the low country.',
      seams: [{ at: [-9, -15], side: 'W', id: 'ow_v_m9_m15', room: R_LODGE, way: 'open', open: 5, label: 'MOUNT OLYMPUS · THE AMPHITHEATRE', sub: 'THE LONG DESCENT · WEST AND UP THE MOUNTAIN', desc: 'The bends climb west towards a white temple on the top of the mountain.' },
              { at: [-3, -15], side: 'S', k: [2, 3], id: 'ow_h_m3_m14', room: 'site_ow_r1', way: 'trail', label: 'THE CANYON TRAIL', sub: 'THE TRAILHEAD · DOWN THE CANYON TO THE HILLS', desc: 'A dry trail goes south down a canyon, towards some hills with very large letters on them.', ifRoom: 1 }] },
];
{ const left = M.plots.filter(p => !USED[p.id]).map(p => p.name); if (left.length) throw new Error('the plan leaves standing plots out: ' + left.join(', ')); }
const SIDE4 = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, OPP = { N: 'S', S: 'N', W: 'E', E: 'W' }, FACE = { N: 180, E: 270, S: 0, W: 90 };
const GROUND = PJ.ground, groundAt = (x, y) => { const r = GROUND.rows[y - GROUND.y0]; return r ? r[x - GROUND.x0] : '~'; };
const FILL_OF = g => (g === 'f' || g === 'w') ? 't' : (g === 'P' || g === 'R' || g === 'A' || g === 'c' || g === 'b') ? 'r' : 'k';   // a box cell nobody walks: the map's own ground there
const OPENED = { r: 1, k: 1, t: 1 };
const nearestLevel = (R, c, r) => { let best = null, bd = 1e9; Object.keys(R.at).forEach(k => { const e = R.at[k], d2 = (e.col - c) * (e.col - c) + (e.row - r) * (e.row - r); if (d2 < bd) { bd = d2; best = e; } }); return best.level; };
const ROOMS_OW = [], STRAYS = [], WHERE = {};   // WHERE[home plot id] = { room, e, R } (a home point -> its room and place)
STAND.forEach(S => {
    const R = MOVER.room(S.list), Wn = R.W, Dn = R.D, c2 = R.cell;
    R.strays.forEach(t => STRAYS.push(S.label + ': ' + t));
    R.order.forEach(e => { if (e.home) WHERE[e.id] = { S, R, e }; });
    const inR = (x, y) => x >= 0 && y >= 0 && x < Wn && y < Dn, openR = (x, y) => inR(x, y) && !MASS[c2[y][x]];
    /* 1. the box's other cells wear the map's ground; a wild link's plot is a snowfield with a rock rim (its trail is cut by the joints below) */
    for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) { const e = R.at[c + ',' + r];
        if (!e) { const ch = FILL_OF(groundAt(R.wx + c, R.wy + r)); for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) c2[r * N + ly][c * N + lx] = ch; continue; }
        if (!e.isNew) continue;
        if (S.id === R_LODGE || !S.list.find(q => q.wx === e.wx && q.wy === e.wy).place) {   /* (on the ski mountain a place plot is open snow too: its rock rim stood as a wall of crags across the runs, and a run's poles stood on top of it) */ for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) c2[r * N + ly][c * N + lx] = 's'; continue; }   // a new plot of the plan: open snow, the piste
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const dx = lx - 5.5, dy = ly - 5.5, rr = 7.6 + 1.4 * vnoise((R.wx + c) * N + lx, (R.wy + r) * N + ly, 9);
            c2[r * N + ly][c * N + lx] = (lx >= 1 && ly >= 1 && lx <= 10 && ly <= 10 && Math.abs(dx) + Math.abs(dy) <= rr) ? 's' : 'r'; } }
    /* 1b. THE ONE MOUNTAIN: a plot that was a trail in a rim of rock (the Pass, Shasta, the old slopes' edges) is open snow now: the pistes are wide open ground
       and a rider is never stopped by the rim of the plot he stood on at home. Olympus keeps its rock and cloud; trees, the crevasse and water stay. */
    if (S.smooth) R.order.forEach(e => { if (!e.home || e.home.district === 'Mount Olympus') return; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const ch = c2[e.row * N + ly][e.col * N + lx]; if (ch === 'r' || ch === 'k') c2[e.row * N + ly][e.col * N + lx] = 's'; } });
    /* 2. the joints: two plots that touch now and did not stand that way at home get one crossing, a trail from each plot's hub (makeRoom THE PORTS) */
    const trailOf = e => e.isNew ? 'o' : e.home.district === 'Mount Olympus' ? 'm' : 'o';
    const carve = (x, y, ch) => { if (inR(x, y) && OPENED[c2[y][x]] && R.plotOfSq(x, y)) c2[y][x] = ch; };
    const run = (x0, y0, x1, y1, ch) => { const vert = x0 === x1, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = n ? Math.round(x0 + (x1 - x0) * i / n) : x0, y = n ? Math.round(y0 + (y1 - y0) * i / n) : y0; carve(x, y, ch); if (vert) carve(x + 1, y, ch); else carve(x, y + 1, ch); } };
    const hubOf = e => { const h = e.home && M.o.hubs && M.o.hubs[e.id]; if (h) return h; let best = null; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { if (!openR(e.col * N + lx, e.row * N + ly)) continue; const d = Math.hypot(lx - 5.5, ly - 5.5); if (!best || d < best[0]) best = [d, lx, ly]; } return best ? [best[1], best[2]] : [5, 5]; };
    const border = (e, sd, k) => sd === 'N' ? [e.col * N + k, e.row * N] : sd === 'S' ? [e.col * N + k, e.row * N + N - 1] : sd === 'W' ? [e.col * N, e.row * N + k] : [e.col * N + N - 1, e.row * N + k];
    const openK = (e, sd) => { const o = []; for (let k = 0; k < N; k++) { const q = border(e, sd, k); if (openR(q[0], q[1])) o.push(k); } return o; };
    const nbr = (e, sd) => R.at[(e.col + SIDE4[sd][0]) + ',' + (e.row + SIDE4[sd][1])] || null;
    const mid = a => a[Math.floor((a.length - 1) / 2)];
    const leg = (e, sd, k) => { const h = hubOf(e), hx = e.col * N + h[0], hy = e.row * N + h[1], [tx, ty] = border(e, sd, k), ch = trailOf(e);
        if (sd === 'N' || sd === 'S') { run(hx, hy, tx, hy, ch); run(tx, hy, tx, ty, ch); } else { run(hx, hy, hx, ty, ch); run(hx, ty, tx, ty, ch); } };
    let joints = 0;
    R.order.forEach(A => ['E', 'S'].forEach(sd => { const B = nbr(A, sd); if (!B) return; const o = OPP[sd];
        if (A.home && B.home && B.home.x - A.home.x === SIDE4[sd][0] && B.home.y - A.home.y === SIDE4[sd][1]) return;   // stood that way at home: its own joint (or none) as built
        const oa = openK(A, sd), ob = openK(B, o); if (oa.some(k => ob.indexOf(k) >= 0)) return;
        const k = Math.max(1, Math.min(N - 3, oa.length ? mid(oa) : ob.length ? mid(ob) : 4)); leg(A, sd, k); leg(B, o, k); joints++; }));
    /* 3. the seams (rule 6): a trail to the side unless the plot is open there; the door on the widest open run's middle (a wall door on the box's wall, else free) */
    const ways = [], seamDoors = [];
    S.seams.forEach(sm => { const e = R.at[(sm.at[0] - R.wx) + ',' + (sm.at[1] - R.wy)]; if (!e) throw new Error(S.id + ': no plot at ' + sm.at + ' for seam ' + sm.id);
        const nb = nbr(e, sm.side); if (nb) throw new Error(S.id + ': seam ' + sm.id + ' on a side with a plot of the same room');
        if (sm.ifRoom && !hasRoom(sm.room)) { console.log('seam ' + sm.id + ' (' + S.id + '): ' + sm.room + ' is not in the game yet, no door written'); return; }
        let ok = openK(e, sm.side); if (sm.k) { sm.k.forEach(k => leg(e, sm.side, k)); ok = openK(e, sm.side).filter(k => k >= sm.k[0] - 1 && k <= sm.k[sm.k.length - 1] + 1); } else if (!ok.length) { leg(e, sm.side, e.isNew ? 4 : 5); ok = openK(e, sm.side); }   // `k`: the squares the path crosses on (a route's line, One World phase 4.1)
        let best = [ok[0], ok[0]], a = ok[0]; for (let i = 1; i <= ok.length; i++) { if (i === ok.length || ok[i] !== ok[i - 1] + 1) { if (ok[i - 1] - a > best[1] - best[0]) best = [a, ok[i - 1]]; a = ok[i]; } }
        const along = (best[0] + best[1] + 1) / 2, sd = sm.side, ns = sd === 'N' || sd === 'S', onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1);
        const q = border(e, sd, Math.floor(along - 0.01)), d = { id: sm.id, wall: onWall ? sd.toLowerCase() : 'free' };
        if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); }
        else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(q[0]); d.z = ns ? R.gcz(q[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }
        if (sm.way === 'open') d.passage = Object.assign(d.passage || {}, { w: sm.open || 5 });
        seamDoors.push(Object.assign(d, { way: sm.way, label: sm.label, sub: sm.sub, action: { room: sm.room, at: sm.to || sm.id }, desc: sm.desc }));   // `to`: the door's id over there when it is not this seam's (an interim jump)
        if (onWall) ways.push({ side: d.wall, at: d.x != null ? d.x : d.z }); });
    /* 4. the doors that moved with their plots: a door into the old room goes to the room that has its `at` now; the Trailhead's goes to the Woods' room */
    const doors = R.doors.map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; if (o.wall !== 'free') ways.push({ side: o.wall, at: o.x != null ? o.x : o.z }); return o; }).concat(seamDoors);
    /* 5. one place on every wild link plot (ow-places.js), on a clear patch of its snowfield beside the trail */
    const placed = [];
    R.order.filter(e => e.isNew && S.list.find(q => q.wx === e.wx && q.wy === e.wy).place).forEach(e => { const src = S.list.find(q => q.wx === e.wx && q.wy === e.wy), pl = OWP.PLACES[src.place], rr = pl.r; let at = null;
        const spots = []; for (let ly = 2; ly <= 9; ly++) for (let lx = 2; lx <= 9; lx++) spots.push([lx, ly]); spots.sort((p, q) => Math.hypot(q[0] - 5.5, q[1] - 5.5) - Math.hypot(p[0] - 5.5, p[1] - 5.5) || p[1] - q[1] || p[0] - q[0]);   // off the middle (the trail crosses there) first
        for (const [lx, ly] of spots) { let ok = true; for (let dy = -rr; dy <= rr && ok; dy++) for (let dx = -rr; dx <= rr; dx++) { const x = e.col * N + lx + dx, y = e.row * N + ly + dy; if (!inR(x, y) || c2[y][x] !== 's') { ok = false; break; } } if (ok) { at = [lx, ly]; break; } }
        if (!at) throw new Error(S.id + ': NO PLACE on ' + e.name + ' (no clear ' + (2 * rr + 1) + ' x ' + (2 * rr + 1) + ' patch beside the trail)');
        OWP.lay(pl, e.col * N + at[0], e.row * N + at[1], { P: (key, sx, sy, o) => placed.push(Object.assign({ key, x: R.gcx(sx), z: R.gcz(sy) }, o || {})), at: (key, fx, fy, o) => placed.push(Object.assign({ key, x: R.gx(fx), z: R.gz(fy) }, o || {})) }); });
    /* 6. the air (the districts' own zones, a plot at a time where its plots parted), the marks, the levelled squares */
    const toSq = (hx, hy) => { const hp = M.plots.find(p => hx >= p.lx * N && hx < (p.lx + 1) * N && hy >= p.ly * N && hy < (p.ly + 1) * N), e = hp && R.ofHome[hp.id]; return e ? [hx - hp.lx * N + e.col * N, hy - hp.ly * N + e.row * N, e] : null; };
    const air = []; (M.airRaw || []).filter(z => S.files.indexOf(z.L) >= 0).forEach(z => { const area = (z.x1 - z.x0) * (z.y1 - z.y0);
        M.plots.forEach(p => { const e = R.ofHome[p.id]; if (!e) return; const x0 = Math.max(z.x0, p.lx * N), y0 = Math.max(z.y0, p.ly * N), x1 = Math.min(z.x1, (p.lx + 1) * N), y1 = Math.min(z.y1, (p.ly + 1) * N); if (x1 <= x0 || y1 <= y0) return;
            const q = Object.assign({}, z, { x0: x0 - p.lx * N + e.col * N, y0: y0 - p.ly * N + e.row * N, x1: x1 - p.lx * N + e.col * N, y1: y1 - p.ly * N + e.row * N });
            if (z.n != null) q.n = Math.max(1, Math.round(z.n * (x1 - x0) * (y1 - y0) / area)); air.push(q); }); });
    const marks = M.marks.map(mk => { const a = mk.x0 != null ? R.toRoom((mk.x0 + mk.x1) / 2, (mk.z0 + mk.z1) / 2) : R.toRoom(mk.x, mk.z); if (!a) return null; const dx = a[0] - (mk.x0 != null ? (mk.x0 + mk.x1) / 2 : mk.x), dz = a[1] - (mk.x0 != null ? (mk.z0 + mk.z1) / 2 : mk.z); return MOVER.shifted(mk, dx, dz); }).filter(Boolean);
    const flats = M.flats.map(f => { const a = toSq(f[0], f[1]); return a ? [a[0], a[1], a[0] + f[2] - f[0], a[1] + f[3] - f[1], f[4]] : null; }).filter(Boolean);
    /* 5b. THE RUNS AND THE WALKING WAYS OF THE PLAN, cut into the ground: a run is a groomed lane ('i') through whatever rock, drift or wood stands on its line
       (green 7 squares wide, blue 6, black 5, double black 4); a walking way is packed snow ('o') on its own square legs (3, 2 or 1 wide). A building's squares,
       paving, water and the crevasse are never cut. */
    { const c0 = R.wx - MP.WX0, r0 = R.wy - MP.WY0, CUT = { r: 1, k: 1, t: 1, s: 1 }, WIDE = { g: 3.4, b: 2.9, k: 2.4, kk: 1.9 }; let laneSq = 0, waySq = 0;
      const stamp = (fx, fy, rad, ch, own) => { for (let y = Math.floor(fy - rad); y <= Math.ceil(fy + rad); y++) for (let x = Math.floor(fx - rad); x <= Math.ceil(fx + rad); x++) { if (!inR(x, y) || !R.plotOfSq(x, y)) continue; if (Math.hypot(x + 0.5 - fx, y + 0.5 - fy) > rad) continue; const was = c2[y][x]; if (CUT[was] || (own && was === 'i')) { c2[y][x] = ch; if (ch === 'i') laneSq++; else waySq++; } } };
      MP.RUNS.forEach(([name, mark, pts]) => { const P = pts.map(([c, r]) => [(c - c0 + 0.5) * N, (r - r0 + 0.5) * N]);
          const path = []; if (P.length < 3) path.push(...P); else { path.push(P[0]); for (let i = 1; i < P.length - 1; i++) { const a = path[path.length - 1], q = P[i], b = i === P.length - 2 ? P[i + 1] : [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2]; for (let t = 1; t <= 24; t++) { const u = t / 24; path.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * q[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * q[1] + u * u * b[1]]); } } }
          for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2)); for (let t = 0; t <= n; t++) stamp(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n, WIDE[mark], 'i'); }  (S.runPaths = S.runPaths || []).push({ name, mark, path, wide: WIDE[mark] }); });
      MP.WAYS.forEach(([name, wide, plots]) => { const pts = MP.lay(plots).map(([x, y]) => [x - c0 * N, y - r0 * N]);
          for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); for (let t = 0; t <= n; t++) { const x = a[0] + Math.sign(b[0] - a[0]) * t, y = a[1] + Math.sign(b[1] - a[1]) * t; for (let k = 0; k < wide; k++) for (let m = 0; m < wide; m++) { const X = x + k - (wide >> 1), Y = y + m - (wide >> 1); if (inR(X, Y) && R.plotOfSq(X, Y) && CUT[c2[Y][X]] && c2[Y][X] !== 's') { c2[Y][X] = 'o'; waySq++; } } } } });
      /* 5c. NOTHING SOLID STANDS ON A RUN: a blocking prop or a tree whose square a run now crosses steps aside to the nearest square of its own plot that is open,
         off every run and free (it keeps its place inside the square). Nothing is taken away. */
      const CATM = vm.runInContext('DOOR_HQ.catalogue', D), busy = new Set(); let stepped = 0;
      const sqOf = q => [Math.floor((q.x + R.HX) / C), Math.floor((q.z + R.HZ) / C)];
      R.props.forEach(q => { const a = sqOf(q); busy.add(a[0] + ':' + a[1]); }); R.features.forEach(f => { if (f.k === 'tree') { const a = sqOf(f); busy.add(a[0] + ':' + a[1]); } });
      const aside = q => { const [sx, sy] = sqOf(q); if (!inR(sx, sy) || c2[sy][sx] !== 'i') return q; const e = R.plotOfSq(sx, sy); let best = null;
          for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const X = e.col * N + lx, Y = e.row * N + ly, ch = c2[Y][X]; if (ch === 'i' || ch === 'B' || ch === 'o' || MASS[ch] || busy.has(X + ':' + Y)) continue; const d = Math.hypot(X - sx, Y - sy); if (!best || d < best[0]) best = [d, X, Y]; }
          if (!best) return q; busy.add(best[1] + ':' + best[2]); stepped++; return Object.assign({}, q, { x: r2(q.x + (best[1] - sx) * C), z: r2(q.z + (best[2] - sy) * C) }); };
      R.props = R.props.map(q => (CATM[q.key] && CATM[q.key].block && q.floor !== true && q.y == null) ? aside(q) : q);
      R.features = R.features.map(f => f.k === 'tree' ? aside(f) : f);
      S.cut = { laneSq, waySq, stepped }; }
    const byXY = {}; R.order.forEach(e => { byXY[e.col + ':' + e.row] = e; });
    const kCols = {}; R.order.forEach(e => { if (e.district === 'The Ski Lodge + slopes') kCols[e.col] = 1; });
    const ho = { pw: R.cols, ph: R.rows, base: S.smooth ? Math.min(...R.order.map(e => e.level)) : M.o.base, smooth: !!S.smooth, seed: M.o.seed, rockCap: M.o.rockCap, deadLevel: (i, j) => nearestLevel(R, i, j), zflat: i => kCols[i] ? 0 : 1 / 3 };
    const plots = R.order.map(e => ({ id: R.pid(e), name: e.name, district: e.district, level: e.level, lx: e.col, ly: e.row, e }));
    const R2 = { o: { id: S.id, tag: S.part, files: S.files, pw: R.cols, ph: R.rows, seed: M.o.seed }, W: Wn, H: Dn, gx: R.gx, gz: R.gz, mx: R.gcx, mz: R.gcz, cell: c2, F: R.features.slice(), props: R.props.concat(placed), doors, npc: R.npc, ARCH: [], count: { plots: S.list.length, box: R.cols + 'x' + R.rows, joints }, open: openR,
        plots, bad: [], marks, heights: () => heightsOf({ o: ho, W: Wn, H: Dn, cell: c2, byXY, flats, inR }), inDistrict: (L, fn) => fn(), ctx: null };
    /* THE PIECES WITH A HEIGHT OF THEIR OWN (a cloud, chimney smoke, a pool, a deck: `y` over the room's floor, written for the home's ground) ride the new
       ground: the difference between the ground under them now and the ground they were written for */
    { const HcH = M.heights(), HcN = R2.heights(), samp = (Hc, Wd, Hd, fx, fy) => { const x = Math.max(0, Math.min(Wd, Math.round(fx))), y = Math.max(0, Math.min(Hd, Math.round(fy))); return Hc[y * (Wd + 1) + x]; }; let n = 0;
      const lift = q => { if (typeof q.y !== 'number' || q.y < 1 || q.x == null) return q;   /* (a prop's `y` from 1 m up is over the ROOM's floor, on the floor of a building too: a shelf's bottle, a thing hung on a wall; under 1 m it is over the ground it stands on and needs nothing) */ const e = R.plotOfSq(Math.floor((q.x + R.HX) / C), Math.floor((q.z + R.HZ) / C)); if (!e || !e.home) return q;
          const ca = Math.round(Math.cos((e.turn || 0) * Math.PI / 180)), sa = Math.round(Math.sin((e.turn || 0) * Math.PI / 180)), ux = q.x - (-R.HX + (e.col + 0.5) * PL), uz = q.z - (-R.HZ + (e.row + 0.5) * PL),
              hx = -M.HW + (e.home.x + 0.5) * PL + ux * ca + uz * sa, hz = -M.HD + (e.home.y + 0.5) * PL - ux * sa + uz * ca;   // the piece's home point (a turned plot: the turn undone)
          const d = samp(HcN, Wn, Dn, (q.x + R.HX) / C, (q.z + R.HZ) / C) - samp(HcH, M.W, M.H, (hx + M.HW) / C, (hz + M.HD) / C); n++; return Object.assign({}, q, { y: r2(q.y + d) }); };
      R2.props = R2.props.map(lift); R2.F = R2.F.map(f => (f.k === 'pool' || f.k === 'deck') ? lift(f) : f); R2.count.lifted = n; Object.assign(R2.count, S.cut); }
    /* ══ THE MOUNTAIN'S OWN DRESSING, IN THE ROOM'S FRAME (2026-11-20, world polish thread 5, the base pass) ══
       What belongs to the mountain as a whole and to no one plot: every run made to READ as a run (a board with its name and mark at its top, marker poles down
       both edges, a line of pines along both edges where the ground beside it is open snow), and THE LIFTS. Heights are read off the room's own ground. */
    /* THE FIVE LIFTS of the plan (a = the bottom dock, b = the top dock, in the plan's plot grid; travel and dwell in seconds) */
    const THE_LIFTS = [
        { id: 'lift1', name: 'THE LODGE CHAIR', a: [1.3, 5.3], b: [6, 4.25], travel: 34, dwell: 7, up: 'UP TO THE MID STATION', down: 'DOWN TO THE SKI LODGE' },
        { id: 'lift2', name: 'THE SUMMIT CHAIR', a: [6.35, 3.85], b: [9.7, 3.3], travel: 30, dwell: 7, up: 'UP TO MOUNT OLYMPUS', down: 'DOWN TO THE MID STATION' },
        { id: 'lift3', name: 'THE NORTH CHAIR', a: [4.3, 1.4], b: [8, 1.35], travel: 28, dwell: 7, up: 'UP TO THE HIGH PASS', down: 'DOWN TO THE NORTH VALLEY' },
        { id: 'lift4', name: 'THE SOUTH CHAIR', a: [3.3, 7.35], b: [8, 7.3], travel: 34, dwell: 7, up: 'UP TO THE LOOKOUT', down: 'DOWN TO THE LOW WOODS' },
        { id: 'lift5', name: 'THE BUNNY TOW', a: [0.9, 4.65], b: [2.6, 4.7], travel: 14, dwell: 5, up: 'UP THE NURSERY SLOPE', down: 'DOWN TO THE LODGE' }];
    if (S.smooth && S.runPaths) { const KIT = DISTRICTS.K.kit, Hn = R2.heights(), hAt = (x, z) => { const fx = Math.max(0, Math.min(Wn - 1e-6, (x + R.HX) / C)), fy = Math.max(0, Math.min(Dn - 1e-6, (z + R.HZ) / C)), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, g = (a, b) => Hn[b * (Wn + 1) + a]; return (g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - v) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * v; };
      const mX = sx => r2(-R.HX + sx * C), mZ = sy => r2(-R.HZ + sy * C), ROTOF = (dx, dz) => r2(Math.atan2(-dx, dz) * 180 / Math.PI);   // an arch's `rot` that turns its +z onto (dx, dz)
      const arch = (id, x, z, rot, fn, hug) => { const a = M.sheet(); fn(a); const row = { k: 'arch', id: S.part + ':' + id, x: r2(x), z: r2(z), rot, parts: a.P }; if (hug) row.hug = true; R2.F.push(row); };
      const busy = new Set(); R2.props.forEach(q => busy.add(Math.floor((q.x + R.HX) / C) + ':' + Math.floor((q.z + R.HZ) / C))); R2.F.forEach(f => { if (f.k === 'tree' || f.k === 'texbuilding') busy.add(Math.floor((f.x + R.HX) / C) + ':' + Math.floor((f.z + R.HZ) / C)); });
      const INK = { g: '#208040', b: '#2050c0', k: '#111111', kk: '#111111' }, MARK = { g: '●', b: '■', k: '◆', kk: '◆◆' }, TINT = { g: 0x208040, b: 0x2050c0, k: 0x1a1a1a, kk: 0x1a1a1a }, WD2 = U('WoodGeneric1a'); let nTrees = 0, nPoles = 0, nBoards = 0;
      const along = (path, step) => { const out = []; let acc = 0, next = step * 0.5; for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue; while (next <= acc + L) { const t = (next - acc) / L; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / L, (b[1] - a[1]) / L]); next += step; } acc += L; } return out.filter(q => inR(Math.floor(q[0]), Math.floor(q[1])) && R.plotOfSq(Math.floor(q[0]), Math.floor(q[1]))); };
      /* A `hug` ROW OVER A TREE SQUARE STANDS IN THE AIR (seen on screen 11-20, mondo: "the poles are floating in the sky"): the game's ground under a square nobody
         walks (a tree square) is the top of its hidden mass, and a hugging corner takes that. The old slopes' own pole rows and lamp flames (K.js, `hug`) are
         written here as plain rows: every part at its own height over the row's origin, read off the room's true ground. */
      R2.F = R2.F.map(f => { if (f.k !== 'arch' || !f.hug || !/^mtn:(poles|lampFlames)/.test(f.id || '')) return f; const rc = Math.cos(-(f.rot || 0) * Math.PI / 180), rs = Math.sin(-(f.rot || 0) * Math.PI / 180), oy = hAt(f.x, f.z);   // (the renderer's own turn: three-renderer.js _hqArchGeometry, `-rot`)
          const parts = f.parts.map(q => { const wx = f.x + q.p[0] * rc + q.p[2] * rs, wz = f.z - q.p[0] * rs + q.p[2] * rc; return Object.assign({}, q, { p: [q.p[0], r2(q.p[1] + hAt(wx, wz) - oy), q.p[2]] }); });
          const o = Object.assign({}, f, { parts, y: r2(oy) }); delete o.hug; return o; });
      const seenTop = {}, LIFTLINES = S.id === R_LODGE ? THE_LIFTS.map(l => [l.a[0], l.a[1], l.b[0], l.b[1]]).map(([c0, r0, c1, r1]) => [(c0 - (R.wx - MP.WX0) + 0.5) * N, (r0 - (R.wy - MP.WY0) + 0.5) * N, (c1 - (R.wx - MP.WX0) + 0.5) * N, (r1 - (R.wy - MP.WY0) + 0.5) * N]) : [];
      S.runPaths.forEach((run, ri) => { const { name, mark, path, wide } = run, id = 'run' + ri;
          /* the board, a few squares down from the run's top, beside its lane (not where another run's board already stands) */
          { const q = along(path, 4)[1] || along(path, 4)[0]; if (q) { let bx = q[0] - q[3] * (wide + 1.6), by = q[1] + q[2] * (wide + 1.6); const key = Math.round(bx / 4) + ':' + Math.round(by / 4); if (seenTop[key]) { bx = q[0] + q[3] * (wide + 1.6); by = q[1] - q[2] * (wide + 1.6); } seenTop[key] = 1;
              if (inR(Math.floor(bx), Math.floor(by)) && R.plotOfSq(Math.floor(bx), Math.floor(by)) && c2[Math.floor(by)][Math.floor(bx)] !== 'B') { const words = name.toUpperCase(), wd = Math.min(3.0, words.length * 0.22 + 0.4); busy.add(Math.floor(bx) + ':' + Math.floor(by)); nBoards++;
                  arch(id + ':board', mX(bx), mZ(by), ROTOF(q[2], q[3]), a => { for (const s of [-1, 1]) { a.box(s * 2.08, 0, 0, 0.16, 2.75, 0.16, WD2, KIT.DARK, { gain: 1.5 }); a.box(s * 2.08, 2.75, 0, 0.24, 0.07, 0.24, 'ice', KIT.SNOW); }
                      a.box(0, 1.55, 0, 4.2, 0.95, 0.1, WD2, 0x2a3a30, { gain: 1.5 }); a.box(0, 2.5, 0, 4.3, 0.08, 0.2, 'ice', KIT.SNOW);
                      for (const f of [1, -1]) { const o = f > 0 ? { glow: 0.85 } : { ry: 180, glow: 0.85 }; a.sign(words, f * 0.42, 1.72, f * 0.06, wd, 0.6, '#f4ecd8', '#2f4a3a', KIT.FONT, o); a.sign(MARK[mark], f * -1.6, 1.72, f * 0.06, mark === 'kk' ? 0.9 : 0.6, 0.6, INK[mark], '#f4ecd8', KIT.FONT, o); } }); } } }
          /* the marker poles: both edges, every four squares; one `hug` row a run (each pole takes the ground under it) */
          /* (11-20, mondo: "the poles are floating in the sky": as ONE `hug` row a run they stood in the air on screen. Each pole now carries its own height over
             the row's origin, read off the room's ground here, and the row is a plain one with its own `y`.) */
          { const pts = along(path, 4); if (pts.length) { const o = pts[0], ox = mX(o[0]), oz = mZ(o[1]), oy = hAt(ox, oz); arch(id + ':poles', ox, oz, 0, a => pts.forEach(q => { for (const s of [-1, 1]) { const X = mX(q[0] - s * q[3] * (wide + 0.2)), Z = mZ(q[1] + s * q[2] * (wide + 0.2)), x = X - ox, z = Z - oz, y = r2(hAt(X, Z) - oy - 0.05), ch = (c2[Math.floor((Z + R.HZ) / C)] || [])[Math.floor((X + R.HX) / C)]; if (ch !== 's' && ch !== 'i' && ch !== 'o') continue;   /* a pole stands on snow, never on a rock, a tree square or a building */ nPoles++;
                  a.box(x, y, z, 0.07, 1.75, 0.07, 'ice', 0xe8701c, { gain: 1.5 }); a.box(x, y + 1.37, z, 0.34, 0.34, 0.05, 'ice', TINT[mark], { gain: 1.4 }); a.box(x, y + 1.61, z, 0.1, 0.1, 0.1, 'ice', 0xffb050, { glow: 1.5 }); } })); R2.F[R2.F.length - 1].y = r2(oy); } }
          /* the tree lines: a pine every three squares along both edges, two squares off the lane, only on open snow that no run, way, building or piece has */
          along(path, 3).forEach((q, k) => { for (const s of [-1, 1]) { const tx = Math.floor(q[0] - s * q[3] * (wide + 1.8)), ty = Math.floor(q[1] + s * q[2] * (wide + 1.8)); if (!inR(tx, ty) || c2[ty][tx] !== 's' || busy.has(tx + ':' + ty)) continue; const e = R.plotOfSq(tx, ty); if (!e || (e.home && e.home.district === 'Mount Olympus')) continue;
              if (e.level <= 4) continue;   // the base (the village, the lift's foot, the nursery slope) stays open
              if (LIFTLINES.some(([ax, ay, bx, by]) => { const L2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay), t = Math.max(0, Math.min(1, ((tx - ax) * (bx - ax) + (ty - ay) * (by - ay)) / L2)); return Math.hypot(tx - (ax + (bx - ax) * t), ty - (ay + (by - ay) * t)) < 4; })) continue;   // nothing grows under a lift
              busy.add(tx + ':' + ty); nTrees++; R2.F.push({ k: 'tree', x: R.gcx(tx), z: R.gcz(ty), kind: (k + ri) % 5 === 0 ? SNOWPINES[(k + ri) % SNOWPINES.length] : 'pine', h: r2(5.5 + ((k * 7 + ri * 3) % 5) * 0.6), r: 0.8 }); } }); });
      /* ── THE LIFTS (mondo 11-20: "yes lift should carry you"). A lift is two CHAIRS that shuttle on two cables side by side, one up while the other comes down:
         each chair is a `bridge` row with a `mover` (three-renderer.js THE MAIL `_hqBuildMovers`, look 'chair'): you step on at a station, it carries you to the
         other one, you step off. The cable is one `hug` row from station to station (straight, 8.5 m over the chairs' line); the wheel houses are the Lodge
         district's own (K.js kit); a pylon stands every 40 m, as tall as the cable is over the ground there. THE FIRST ONE ONLY, for mondo's look: THE LODGE CHAIR. ── */
      const LIFT = (id, name, A, B, o) => { const c0 = R.wx - MP.WX0, r0 = R.wy - MP.WY0, P = ([c, r]) => [-R.HX + (c - c0 + 0.5) * PL, -R.HZ + (r - r0 + 0.5) * PL], a = P(A), b = P(B), L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L, HCL = KIT.HC, MT = U('MetalWallRibbed1a');
          const ya = hAt(a[0], a[1]) + 0.25, yb = hAt(b[0], b[1]) + 0.25, rotDown = ROTOF(-dx, -dz);
          /* the chairs: 3.5 m square decks, 2.2 m either side of the line */
          [[-1, 0], [1, 0.5]].forEach(([s, phase]) => { const ox = -dz * s * 2.2, oz = dx * s * 2.2; R2.F.push({ k: 'bridge', id: S.part + ':' + id + ':chair' + (s > 0 ? 'B' : 'A'), w: 3.5, y: 0.28, thick: 0.3, plain: true, rails: false, hide: true,   // (a bridge row's `y` is over the ground under it: the compile adds the snow's height)
              mover: { to: [r2(b[0] - a[0]), r2(yb - ya), r2(b[1] - a[1])], travel: o.travel, dwell: o.dwell, phase, look: 'chair', hang: HCL },
              x0: r2(a[0] + ox - dx * 1.75), z0: r2(a[1] + oz - dz * 1.75), x1: r2(a[0] + ox + dx * 1.75), z1: r2(a[1] + oz + dz * 1.75) }); });
          /* the cables: one straight box a side, station to station; a `hug` row: its two ends take the ground under them */
          arch(id + ':cable', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ROTOF(dx, dz), q => { for (const s of [-1, 1]) q.box(s * 2.2, HCL + 0.4, 0, 0.08, 0.08, L + 8, 'gunmetal', 0x22252a); }, true);
          /* the wheel houses, 7 m behind each dock */
          arch(id + ':bottom', a[0] - dx * 7, a[1] - dz * 7, rotDown, q => KIT.wheelhouse(q, MT, 1)); arch(id + ':top', b[0] + dx * 7, b[1] + dz * 7, rotDown, q => KIT.wheelhouse(q, MT, -1));
          /* the pylons */
          for (let d = 40; d < L - 25; d += 40) { const x = a[0] + dx * d, z = a[1] + dz * d, gap = (ya + (yb - ya) * d / L) - hAt(x, z), h = HCL + 0.4 + Math.max(0, gap);
              arch(id + ':pylon' + d, x, z, rotDown, q => { q.box(0, 0, 0, 1.4, 0.45, 1.4, 'urban:ConcreteWoodFormed1a', 0xb0b0b0); q.box(0, 0.45, 0, 0.7, h + 0.3, 0.7, MT, KIT.STEEL); q.box(0, 0.45, 0, 1.0, 1.7, 1.0, 'marble_light', 0xe07a1c, { gain: 2.2 });
                  q.box(0, h + 0.2, 0, 5.4, 0.4, 0.5, MT, KIT.STEEL); q.box(0, h + 0.6, 0, 5.4, 0.08, 0.56, 'ice', KIT.SNOW); for (const s of [-1, 1]) { q.box(s * 2.2, h - 0.1, 0, 0.16, 0.14, 2.0, MT, 0x3a3e44); for (const k of [-0.8, 0, 0.8]) q.box(s * 2.2, h - 0.22, k, 0.1, 0.28, 0.28, 'gunmetal', 0x22252a); } });
              R2.F.push({ k: 'wall', x0: r2(x - 0.5), z0: r2(z), x1: r2(x + 0.5), z1: r2(z), t: 1.0, h: 3, ghost: true, rail: false }); }
          /* a board at each station */
          [[a, -1, o.up], [b, 1, o.down]].forEach(([p, s, words], i) => arch(id + ':sign' + i, p[0] + dx * s * 3.5 - dz * 5.5, p[1] + dz * s * 3.5 + dx * 5.5, rotDown, q => { for (const t of [-1, 1]) q.box(t * 2.3, 0, 0, 0.16, 3.0, 0.16, WD2, KIT.DARK, { gain: 1.5 }); q.box(0, 1.7, 0, 4.7, 1.2, 0.1, WD2, 0x2a3a30, { gain: 1.5 }); q.box(0, 2.9, 0, 4.8, 0.08, 0.2, 'ice', KIT.SNOW);
              for (const f of [1, -1]) { const g = f > 0 ? { glow: 0.85 } : { ry: 180, glow: 0.85 }; q.sign(name, 0, 2.3, f * 0.06, Math.min(4.3, name.length * 0.26 + 0.4), 0.5, '#f4ecd8', '#2f4a3a', KIT.FONT, g); q.sign(words, 0, 1.8, f * 0.06, Math.min(4.3, words.length * 0.2 + 0.4), 0.38, '#f4ecd8', '#2f4a3a', KIT.FONT, g); } }));
          let clear = 1e9; for (let d = 0; d <= L; d += 3.5) clear = Math.min(clear, (ya + (yb - ya) * d / L) - hAt(a[0] + dx * d, a[1] + dz * d));   // the chairs' line over the snow (it must never dip under it)
          return { L: r2(L), rise: r2(yb - ya), clear: r2(clear) }; };
      Object.assign(R2.count, { runBoards: nBoards, runPoles: nPoles, runTrees: nTrees });
      /* nothing grows under a lift: a tree an old plot brought with it leaves the lift's line and its stations (16 m either side) */
      { const near = f => LIFTLINES.some(([ax, ay, bx, by]) => { const tx = (f.x + R.HX) / C, ty = (f.z + R.HZ) / C, L2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay), t = Math.max(-0.06, Math.min(1.06, ((tx - ax) * (bx - ax) + (ty - ay) * (by - ay)) / L2)); return Math.hypot(tx - (ax + (bx - ax) * t), ty - (ay + (by - ay) * t)) < 4.6; });
        const n0 = R2.F.length; R2.F = R2.F.filter(f => !(f.k === 'tree' && near(f))); R2.count.treesOffTheLift = n0 - R2.F.length; }
      if (S.id === R_LODGE) R2.count.lifts = THE_LIFTS.map(l => { const q = LIFT(l.id, l.name, l.a, l.b, l); return l.name + ' ' + q.L + ' m up ' + q.rise + ' m, least clear ' + q.clear + ' m'; }); 
      /* EVERY DRAWN ROW STANDS ON THE TRUE GROUND: a row with no `y` takes the game's ground under its origin, and over a tree square that is the top of the
         square's hidden mass (a board, a sign or a post beside a run stood in the air). Each row of this room carries its own `y` off the room's heights. */
      { let n = 0; R2.F = R2.F.map(f => { if (f.k !== 'arch' || f.hug || typeof f.y === 'number' || f.x == null) return f; n++; return Object.assign({}, f, { y: r2(hAt(f.x, f.z)) }); }); R2.count.rowsGrounded = n; } }
    R2.plotAt = (sx, sy) => { const e = R.plotOfSq(sx, sy); return e ? (e.home ? M.byId[e.id] : { id: null, district: e.district, lx: -1, ly: -1 }) : null; };
    /* the spawn: a hub square of its plot (the Lodge Yard's own square, as before) */
    const sp = (() => { const e = R.ofHome[S.spawn[0]]; if (S.spawn[1] != null) return [e.col * N + S.spawn[1], e.row * N + S.spawn[2]]; const h = hubOf(e); return [e.col * N + h[0], e.row * N + h[1]]; })();
    ROOMS_OW.push({ S, R, R2, air, ways, sp });
});
if (STRAYS.length) console.log('STRAYS (a piece across two plots that no longer stand the same way: areas-complexes.md "THE MOUNTAINS, THE ONE WORLD MOVE"):\n  ' + STRAYS.join('\n  '));
/* a door into the old room names the new room that has its `at` (the chairlift's pair); the Trailhead's way down goes to the Woods' room */
ROOMS_OW.forEach(o => o.R2.doors.forEach(d => { if (!d.action) return;
    if (d.action.room === MTN) { const t = ROOMS_OW.find(q => q.R2.doors.some(x => x.id === d.action.at)); if (!t) throw new Error(o.S.id + ': door ' + d.id + ' leads to `' + d.action.at + '`, which no new room has'); d.action = Object.assign({}, d.action, { room: t.S.id }); }
    if (d.id === 'woods') d.action = Object.assign({}, d.action, { room: WOODS_ROOM }); }));
/* where a point of the home room stands now (a link end, a bay door): its room, and the point moved with its plot */
const moved = (x, z, what) => { const hp = MOVER.homePlot(x, z), w = hp && WHERE[hp.id]; if (!w) throw new Error(what + ': no new room holds home plot ' + (hp && hp.id)); return { S: w.S, R: w.R, x: r2(x + w.e.dx), z: r2(z + w.e.dz), e: w.e }; };
const owBlocks = ROOMS_OW.map(o => { const { S, R, R2 } = o, w = 2 * R.HX, d = 2 * R.HZ;
    return finish(R2, { label: S.label, sub: S.sub, site: 'prebuilt_shasta', part: S.part, world: { hub: 'mountains', layer: 'surface', wx: R.wx, wy: R.wy }, mask: R.mask, air: o.air,
        shell: "(s => { s.sky.landmarks = 'world'; return s; })(hqAncientShell({ w: " + w + ", d: " + d + ", h: 20, wallH: 20, floor: 'ice', apron: 'ice', skirt: 'rocks_5', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + R2.mx(o.sp[0]) + ", z: " + R2.mz(o.sp[1]) + ", y: 5.0 },\n" +
               "                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xf0f4ff, ambient: 0.6 },\n" +
               "                                    sky: " + SKY_DAY + ",\n                                    look: HQ_ROOM_LOOKS.mountain }))",
        parti: S.parti, floor: 'grass_2', pal: ['ice', 'rocks_5', 'dirt_2', 'ice_1', 'marble_light', 'igloo', 'wood_planks', 'obsidian'],
        paintOf: (ch, x, y) => { const p = R2.plotAt(x, y), oly = p && p.district === 'Mount Olympus';
            if (S.smooth && !oly) { if (ch === 'g') return 1; if (ch === 'p' || ch === 'd') return 6; }   // THE ONE MOUNTAIN: Shasta's summer meadows and dirt trails lie under snow now
            return ch === 's' || ch === 'B' ? 1 : ch === 'k' ? (oly ? 5 : 1) : ch === 'r' ? 2 : (ch === 'p' || ch === 'd') ? 3 : (ch === 'i' || ch === 'x' || ch === 'a') ? 4 : ch === 'm' ? 5 : ch === 'o' ? 6 : (ch === 'j' || ch === 'b') ? ((p && p.id === 'P06-02') || ch === 'b' ? 7 : 6) : ch === 'h' ? 8 : (ch === 't' && p && p.ly === 3 && p.lx < 3) ? 1 : 0; },
        trees: { snow: { kinds: SNOWPINES, treeH: [5.5, 8] }, pine: { kinds: ['pine', 'pine', 'pine', 'pine', 'pine', SNOWPINES[0]], treeH: [5.5, 9] } }   /* (THE ONE MOUNTAIN: no summer leaf trees on a ski mountain; one snow pine in six, they are heavy) */, treeDefault: 'pine', maxTrees: Math.round(2600 * R.cols * R.rows / 96),
        treeKey: (x, y) => { const p = R2.plotAt(x, y); return (p && p.ly === 3 && p.lx < 3) ? 'snow' : 'pine'; },
        edges: { world: true, reach: 440, ways: o.ways }, lines: S.lines, spawn: o.sp, face: 0 }); });
const block = ["        /* MOUNTAINS-BEGIN — THE MOUNTAINS ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the range stands at its One World places as three rooms): written by `node bake-mountains.js` from docs/areas/mountains/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit a district file (docs/areas/mountains/districts/), the tool or the layout and rerun. */"]
    .concat(...owBlocks, pBlock, ["        /* MOUNTAINS-END */"]).join('\n') + '\n';
/* the ends this tool owns: the links that lead into the rooms, and the three bay doors of DOOR HQ (each at its plot's new place, in the room that holds it) */
const A = k => moved(M.anchors[k].x, M.anchors[k].z, k), aH = moved(M.out.heaven, -M.HD + 0.5, 'heaven'), aV = moved(M.out.vatican, M.gz((M.byId['P11-03'].ly + 1) * N) - 0.5, 'vatican');   // (the Pilgrim Stair's south side: at home its door stood on the room's far wall, past four plots of rock)
const aL = A('lemuria'), aP = A('painting'), aBS = A('bayShasta'), aBO = A('bayOlympus');
const LINKS = {
    /* northpole_camelot: gone 2026-11-17 (One World phase 5): the sleigh road jumped from the Pole to Camelot's Snowy Pines; the Polar Trail (R5) and the trail L6 walk it */
    northpole_haunted: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 'free', x: " + NP.anchors.hearth.x + ", z: " + NP.anchors.hearth.z + ", face: " + NP.anchors.hearth.face + " }"],
    shasta_lemuria: ['a', "{ site: 'prebuilt_shasta', part: '" + aL.S.part + "', wall: 'free', x: " + aL.x + ", z: " + aL.z + ", face: " + M.anchors.lemuria.face + ", sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN' }"],
    heaven_olympus: ['b', "{ site: 'prebuilt_shasta', part: '" + aH.S.part + "', wall: 'free', x: " + aH.x + ", z: " + r2(aH.z + 1.25) + ", face: 180, sub: 'THE GRAND STAIR · UP INTO HEAVEN' }"],   // (THE ONE MOUNTAIN: the Grand Stair stands inside the room now, crags north of it)
    lodge_olympus: ['b', "{ site: 'prebuilt_shasta', part: '" + aP.S.part + "', wall: 'free', x: " + aP.x + ", z: " + aP.z + ", face: " + M.anchors.painting.face + " }"],
    /* vatican_olympus: gone 2026-11-17 (One World phase 5): the Pilgrim Way (R3) is the walk down to the Vatican; the Pilgrim Stair's foot on the south wall has no door */
};
const ENTRY = {
    prebuilt_shasta: "{ room: '" + aBS.S.id + "', door: { id: 'bay', wall: 'free', x: " + aBS.x + ", z: " + aBS.z + ", face: " + M.anchors.bayShasta.face + " } }",
    prebuilt_olympus: "{ room: '" + aBO.S.id + "', door: { id: 'bay_olympus', wall: 'free', x: " + aBO.x + ", z: " + aBO.z + ", face: " + M.anchors.bayOlympus.face + " } }",
    prebuilt_northpole: "{ room: '" + POLE + "', door: { id: 'bay', wall: 's', x: " + NP.out.BAY + " } }",
};
console.log('ways ' + JSON.stringify({ pole: NP.out, links: Object.keys(LINKS).map(k => k + ' ' + LINKS[k][1].slice(0, 90)), woods: WOODS_ROOM }));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* MOUNTAINS-END */\n', b0 = src.indexOf('        /* MOUNTAINS-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        /* WOODS36-BEGIN'; const a = src.indexOf(anchor); if (a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
Object.keys(LINKS).forEach(id => { const [side, lit] = LINKS[id], i = src.indexOf("{ id: '" + id + "'"); if (i < 0) throw new Error('link not found: ' + id);
    const m = new RegExp('\\n( +)' + side + ': \\{[^\\n]*').exec(src.slice(i, i + 3000)); if (!m) throw new Error('no `' + side + '` end on link ' + id);
    src = src.slice(0, i + m.index) + '\n' + m[1] + side + ': ' + lit + ',   // THE MOUNTAINS ON PLOTS: written by bake-mountains.js' + src.slice(i + m.index + m[0].length); });
Object.keys(ENTRY).forEach(site => { const m = new RegExp('\\n( +)' + site + ': +\\{ room: [^\\n]*').exec(src); if (!m) throw new Error('no siteRooms.entry row for ' + site);
    src = src.slice(0, m.index) + '\n' + m[1] + site + ': ' + ENTRY[site] + ',   // THE MOUNTAINS ON PLOTS: written by bake-mountains.js' + src.slice(m.index + m[0].length); });
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOMS_OW.map(o => o.S.id).join(', ') + ' + ' + POLE + ' written (' + block.length + ' bytes)');