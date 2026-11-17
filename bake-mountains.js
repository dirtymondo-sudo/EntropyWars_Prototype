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
    const base = (cx, cy) => { const px = cx / N - 0.5, i = Math.max(0, Math.min(o.pw - 2, Math.floor(px))), u = Math.min(1, Math.max(0, (px - i - 1 / 6) / (2 / 3))); return prof(i, cy / N) * (1 - u) + prof(i + 1, cy / N) * u; };
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
    const R = { o, W, H, HW, HD, gx, gz, mx, mz, cell, plots, byId, F, props, doors, npc, marks, ARCH, count, taken, feat, rnd, open, inR, S, plotAt, carve, run, spur, door, put, dec, tree, native, building, look, flat, heights, bad, flats, anchors, anchor, inDistrict };
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
  door('pass', 'P03-01', 'e', Object.assign({ way: 'trail', action: { room: R_LODGE, at: 'pass' } }, DOORWORDS('THE MOUNTAINS · THE SNOWY PASS', 'THE PASS GATE · UP OVER THE RANGE', 'The village road climbs out between two drifts and keeps climbing. The gate at the top is the only way over.')));
  const SLEIGH = R.spur('P03-03', 's'), BAY = R.spur('P01-03', 's');
  runDistricts(R, 'apply'); runDistricts(R, 'build');   // THE DISTRICT FILES: everything that stands on the plots
  R.out = { SLEIGH, BAY };
}

/* ════════════════════════════════════════════════ THE MOUNTAINS (plan columns 4-15) ════════════════════════════════════════════════ */
const SKI = { 3: 1, 4: 1, 5: 1 };   // the slopes' columns: one even grade from the Top Station to the Lodge (no flat shelves on a run)
/* `streams`: the states the room's one stream had at each district's first decor when the districts were split out (11-16): the split changed no number */
const M = makeRoom({ id: MTN, tag: 'mtn', files: ['P', 'K', 'S', 'O'], streams: { P: 72, K: 2855161781, S: 3659870008, O: 2570278025 }, px0: 4, py0: 0, pw: 12, ph: 8, base: 8, seed: 72, rockCap: 26,
    hubs: { 'P06-02': [6, 3] }, extraPorts: [['P05-00', 'S'], ['P12-03', 'E']],   // …and (THE SWAP, plan 2) the Goat Track walks on east to Bunny Flat: Olympus and Shasta meet there   // the Ridge is climbed from the High Pass (the plan drew it joined to nothing)
    carves: [7, 8, 9].map(ly => ['P12-01', 7, ly, 'm']).concat([['P12-01', 7, 10, 'm']], [2, 3, 4, 5, 6].flatMap(lx => [['P12-01', lx, 5, 'm'], ['P12-01', lx, 6, 'm']])),   // THE CLOUD LINE: the stair is two squares wide all the way, and the Colonnade's walk goes on through the cloud to it
    hubs2: 0,   // the Rope Bridge's trails leave from the snow north of the crevasse (never along the slot)
    deadLevel: (i, j) => j >= 4 ? [9, 9, 8, 8][j - 4] : 8, zflat: i => SKI[i] ? 0 : 1 / 3,
    trail: p => p.district === 'Mount Olympus' ? 'm' : (p.district === 'Mount Shasta' && p.level <= 11) ? 'p' : 'o' });
{ const R = M, { put, dec, tree, native, building, look, S, door, mx, mz, gx, gz, props, feat, cell } = R;
  /* ── THE WAYS ── */
  door('pass', 'P04-01', 'w', Object.assign({ way: 'trail', action: { room: POLE, at: 'pass' } }, DOORWORDS('THE NORTH POLE · THE VILLAGE', 'THE PASS GATE · DOWN INTO THE VALLEY', 'A gate of two poles and a crossbar. Past it the trail drops into a white valley with lit windows in it.')));
  door('woods', 'P13-07', 's', Object.assign({ way: 'trail', action: { room: 'site_prebuilt_fairy_forest_plots', at: 'shasta' } }, DOORWORDS('THE WOODS · THE SNOWLINE', 'THE TRAILHEAD · DOWN INTO THE TREES', 'The trail goes down out of the pines into older trees. It is warmer down there, and nothing else about it is better.')));
  { const p = R.byId['P12-00']; for (let ly = 0; ly <= 7; ly++) for (const lx of [7, 8]) cell[p.ly * N + ly][p.lx * N + lx] = 'm'; }   // THE GRAND STAIR goes on up through the cloud to the room's north wall
  const WAY = { heaven: R.spur('P12-00', 'n', 'm'), vatican: R.spur('P11-03', 's', 'm') };
  /* THE HOLLYWOOD HILLS (plan 2): Shasta's east side walks on into the Hills (the city's mountain road lands there now, not at the Lodge Yard) */
  door('hills', 'P15-02', 'e', Object.assign({ way: 'road', action: { room: CITY, at: 'shasta' } }, DOORWORDS('THE HOLLYWOOD HILLS', 'THE SHASTA ROAD · EAST TO THE SIGN', 'The snow stops at a cattle grid. Past it the road is dry, the brush is brown, and a row of very large letters stands with its back to you.')));
  door('saddle', 'P15-00', 'e', Object.assign({ way: 'trail', action: { room: CITY, at: 'ridge' } }, DOORWORDS('THE HOLLYWOOD HILLS', 'THE SADDLE · THE RIDGE BEHIND THE LETTERS', 'The ridge trail leaves the ice and follows the crest east. On a clear day you can see the whole city from it, and the back of its name.')));

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
    edges: { reach: 440, n: { kind: 'mountain' }, w: { kind: 'mountain' }, e: { kind: 'mountain' }, s: { kind: 'mountain' } },
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
const v13 = did => { const d = PJ.districts.find(q => q.id === did); if (!d) throw new Error('plots.json has no district ' + did);
    return d.plots.map(q => { const p = M.byId[q.was]; if (!p || p.name !== q.n) throw new Error('plots.json and the layout disagree on ' + q.was + ' ' + q.n); return { id: q.was, wx: q.x, wy: q.y }; }); };
/* a wild link's plots: a level each (graded from one end's plot to the other's) and the place each one carries (by hand, from the snow and rock places) */
const LINKPLOTS = (lid, label, levels, places) => { const l = PJ.links.find(q => q.id === lid); if (!l || l.plots.length !== levels.length) throw new Error('plots.json link ' + lid + ' has ' + (l ? l.plots.length : 0) + ' plots');
    return l.plots.map((q, i) => ({ wx: q[0], wy: q[1], level: levels[i], name: label + ', ' + OWP.PLACES[places[i]].name, district: 'Wild link ' + lid, link: lid, place: places[i] })); };
const L9 = LINKPLOTS('L9', 'The Traverse', [17, 17, 16, 16, 16], ['trapper', 'minecart', 'snowman', 'camp', 'markers']);
const L10 = LINKPLOTS('L10', 'The Saddle Path', [10, 11], ['totem', 'markers']);
const L11 = LINKPLOTS('L11', 'The Long Descent', [15, 13, 12, 10, 9], ['camp', 'trapper', 'minecart', 'snowman', 'stone']);
const WOODS_ROOM = hasRoom('site_prebuilt_fairy_forest_ow_redwood') ? 'site_prebuilt_fairy_forest_ow_redwood' : 'site_prebuilt_fairy_forest_plots';   // the Woods thread moves the Snowline (11-17)
/* THE SEAMS: { at: [world x, y], side } of a plot in this room -> the room past that side (the seam's own id on both doors, rule 6). `ifRoom` = written only
   when that room stands (a neighbour zone's link that is not merged yet). `way`: the route kit's rule by the link plot's ground (rock = an arch, snow = open). */
const STAND = [
    { id: R_LODGE, part: 'ow_lodge', files: ['K', 'P'], label: 'THE SKI LODGE · THE SNOWY PASS', sub: 'THE MOUNTAINS · THE SKI LODGE + SLOPES · THE TRAVERSE · THE SNOWY PASS · 29 PLOTS',
      list: v13('mtnK').concat(L9, v13('mtnP')), spawn: ['P09-03', 5, 6], lines: [],
      parti: 'The west of the range in one walk, twenty-nine plots: the ski lodge at the foot of its runs, the traverse east along the snow to the high pass, and the Snowy Pass a trail down the range from the ridge to the tree line.',
      seams: [{ at: [-16, -14], side: 'W', id: 'ow_v_m16_m14', room: 'site_ow_l3', way: 'trail', label: 'THE WOODS · THE REDWOOD TRAIL', sub: 'THE TREE LINE · DOWN INTO THE TREES', desc: 'The trail drops off the snow into the first of the big trees.', ifRoom: 1 },
              { at: [-15, -14], side: 'E', id: 'ow_v_m14_m14', room: R_OLY, way: 'trail', label: 'MOUNT OLYMPUS · THE SADDLE PATH', sub: 'THE TREE LINE · EAST OVER THE SADDLE', desc: 'A path goes east along the saddle, towards a mountain with something white built on top of it.' },
              { at: [-22, -16], side: 'W', id: 'ow_v_m22_m16', room: 'site_ow_l6', way: 'open', open: 5, label: 'CAMELOT KINGDOM · THE SNOWY PINES', sub: 'THE LODGE YARD · WEST DOWN THE VALLEY', desc: 'Ski tracks give out at the yard’s end. Past them a trail goes west and down, into pines.', ifRoom: 1 }] },
    { id: R_OLY, part: 'ow_olympus', files: ['O'], label: 'MOUNT OLYMPUS', sub: 'THE MOUNTAINS · THE SADDLE PATH · MOUNT OLYMPUS · THE LONG DESCENT · 19 PLOTS',
      list: L10.concat(v13('mtn'), L11), spawn: ['P10-02', null, null], lines: O_OLYMPUS.l,
      parti: 'The temple mountain on twelve plots above the cloud, with the saddle path coming in from the Snowy Pass and the long descent going on east across the snow to Mount Shasta.',
      seams: [{ at: [-14, -14], side: 'W', id: 'ow_v_m14_m14', room: R_LODGE, way: 'trail', label: 'THE SNOWY PASS · THE TREE LINE', sub: 'THE SADDLE PATH · WEST TO THE PASS', desc: 'The path goes back west along the saddle to the pass.' },
              { at: [-5, -15], side: 'E', id: 'ow_v_m4_m15', room: R_SHASTA, way: 'open', open: 5, label: 'MOUNT SHASTA · THE UPPER SHELF', sub: 'THE LONG DESCENT · EAST TO THE VOLCANO', desc: 'The snow runs on east and down. The mountain ahead is the one that smokes.' }] },
    { id: R_SHASTA, part: 'ow_shasta', files: ['S'], label: 'MOUNT SHASTA', sub: 'THE MOUNTAINS · MOUNT SHASTA · 20 PLOTS',
      list: v13('shasta'), spawn: ['P13-03', null, null], lines: O_SHASTA.l,
      parti: 'The volcano on twenty plots: the trail climbs from the trailhead past the lookout and the switchbacks to the meadows, the gulch, the lake and the summit.',
      seams: [{ at: [-4, -15], side: 'W', id: 'ow_v_m4_m15', room: R_OLY, way: 'open', open: 5, label: 'MOUNT OLYMPUS · THE LONG DESCENT', sub: 'THE UPPER SHELF · WEST ACROSS THE SNOW', desc: 'A line of footprints goes west across the snow, towards a white temple on the next mountain.' }] },
];
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
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { const dx = lx - 5.5, dy = ly - 5.5, rr = 7.6 + 1.4 * vnoise((R.wx + c) * N + lx, (R.wy + r) * N + ly, 9);
            c2[r * N + ly][c * N + lx] = (lx >= 1 && ly >= 1 && lx <= 10 && ly <= 10 && Math.abs(dx) + Math.abs(dy) <= rr) ? 's' : 'r'; } }
    /* 2. the joints: two plots that touch now and did not stand that way at home get one crossing, a trail from each plot's hub (makeRoom THE PORTS) */
    const trailOf = e => e.isNew ? 'o' : e.district === 'Mount Olympus' ? 'm' : (e.district === 'Mount Shasta' && e.level <= 11) ? 'p' : 'o';
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
        let ok = openK(e, sm.side); if (!ok.length) { leg(e, sm.side, e.isNew ? 4 : 5); ok = openK(e, sm.side); }
        let best = [ok[0], ok[0]], a = ok[0]; for (let i = 1; i <= ok.length; i++) { if (i === ok.length || ok[i] !== ok[i - 1] + 1) { if (ok[i - 1] - a > best[1] - best[0]) best = [a, ok[i - 1]]; a = ok[i]; } }
        const along = (best[0] + best[1] + 1) / 2, sd = sm.side, ns = sd === 'N' || sd === 'S', onWall = (sd === 'N' && e.row === 0) || (sd === 'S' && e.row === R.rows - 1) || (sd === 'W' && e.col === 0) || (sd === 'E' && e.col === R.cols - 1);
        const q = border(e, sd, Math.floor(along - 0.01)), d = { id: sm.id, wall: onWall ? sd.toLowerCase() : 'free' };
        if (onWall) { if (ns) d.x = R.gx(e.col * N + along); else d.z = R.gz(e.row * N + along); }
        else { d.x = ns ? R.gx(e.col * N + along) : R.gcx(q[0]); d.z = ns ? R.gcz(q[1]) : R.gz(e.row * N + along); d.face = FACE[sd]; d.passage = Object.assign({}, MOVER.FREE_PASS); }
        if (sm.way === 'open') d.passage = Object.assign(d.passage || {}, { w: sm.open || 5 });
        seamDoors.push(Object.assign(d, { way: sm.way, label: sm.label, sub: sm.sub, action: { room: sm.room, at: sm.id }, desc: sm.desc }));
        if (onWall) ways.push({ side: d.wall, at: d.x != null ? d.x : d.z }); });
    /* 4. the doors that moved with their plots: a door into the old room goes to the room that has its `at` now; the Trailhead's goes to the Woods' room */
    const doors = R.doors.map(d => { const o = Object.assign({}, d); delete o.side; delete o.plot; if (o.wall !== 'free') ways.push({ side: o.wall, at: o.x != null ? o.x : o.z }); return o; }).concat(seamDoors);
    /* 5. one place on every wild link plot (ow-places.js), on a clear patch of its snowfield beside the trail */
    const placed = [];
    R.order.filter(e => e.isNew).forEach(e => { const src = S.list.find(q => q.wx === e.wx && q.wy === e.wy), pl = OWP.PLACES[src.place], rr = pl.r; let at = null;
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
    const byXY = {}; R.order.forEach(e => { byXY[e.col + ':' + e.row] = e; });
    const kCols = {}; R.order.forEach(e => { if (e.district === 'The Ski Lodge + slopes') kCols[e.col] = 1; });
    const ho = { pw: R.cols, ph: R.rows, base: M.o.base, seed: M.o.seed, rockCap: M.o.rockCap, deadLevel: (i, j) => nearestLevel(R, i, j), zflat: i => kCols[i] ? 0 : 1 / 3 };
    const plots = R.order.map(e => ({ id: R.pid(e), name: e.name, district: e.district, level: e.level, lx: e.col, ly: e.row, e }));
    const R2 = { o: { id: S.id, tag: S.part, files: S.files, pw: R.cols, ph: R.rows, seed: M.o.seed }, W: Wn, H: Dn, gx: R.gx, gz: R.gz, mx: R.gcx, mz: R.gcz, cell: c2, F: R.features.slice(), props: R.props.concat(placed), doors, npc: R.npc, ARCH: [], count: { plots: S.list.length, box: R.cols + 'x' + R.rows, joints }, open: openR,
        plots, bad: [], marks, heights: () => heightsOf({ o: ho, W: Wn, H: Dn, cell: c2, byXY, flats, inR }), inDistrict: (L, fn) => fn(), ctx: null };
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
            return ch === 's' || ch === 'B' ? 1 : ch === 'k' ? (oly ? 5 : 1) : ch === 'r' ? 2 : (ch === 'p' || ch === 'd') ? 3 : (ch === 'i' || ch === 'x' || ch === 'a') ? 4 : ch === 'm' ? 5 : ch === 'o' ? 6 : (ch === 'j' || ch === 'b') ? ((p && p.id === 'P06-02') || ch === 'b' ? 7 : 6) : ch === 'h' ? 8 : (ch === 't' && p && p.ly === 3 && p.lx < 3) ? 1 : 0; },
        trees: { snow: { kinds: SNOWPINES, treeH: [5.5, 8] }, pine: { kinds: ['pine', 'pine', 'tree_3', 'tree_2'], treeH: [5.5, 9] } }, treeDefault: 'pine', maxTrees: Math.round(2600 * R.cols * R.rows / 96),
        treeKey: (x, y) => { const p = R2.plotAt(x, y); return (p && p.ly === 3 && p.lx < 3) ? 'snow' : 'pine'; },
        edges: { world: true, reach: 440, ways: o.ways }, lines: S.lines, spawn: o.sp, face: 0 }); });
const block = ["        /* MOUNTAINS-BEGIN — THE MOUNTAINS ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17: the range stands at its One World places as three rooms): written by `node bake-mountains.js` from docs/areas/mountains/layout.json + docs/plans/one-world/plots.json. Never hand-edit between the markers; edit a district file (docs/areas/mountains/districts/), the tool or the layout and rerun. */"]
    .concat(...owBlocks, pBlock, ["        /* MOUNTAINS-END */"]).join('\n') + '\n';
/* the ends this tool owns: the links that lead into the rooms, and the three bay doors of DOOR HQ (each at its plot's new place, in the room that holds it) */
const A = k => moved(M.anchors[k].x, M.anchors[k].z, k), aH = moved(M.out.heaven, -M.HD + 0.5, 'heaven'), aV = moved(M.out.vatican, M.gz((M.byId['P11-03'].ly + 1) * N) - 0.5, 'vatican');   // (the Pilgrim Stair's south side: at home its door stood on the room's far wall, past four plots of rock)
const aL = A('lemuria'), aP = A('painting'), aBS = A('bayShasta'), aBO = A('bayOlympus');
if (aH.e.row !== 0 || aV.e.row !== aV.R.rows - 1) throw new Error('the Grand Stair / the Pilgrim Stair no longer stand on their room\'s north / south wall');
const LINKS = {
    northpole_camelot: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 's', x: " + NP.out.SLEIGH + ", sub: 'THE SLEIGH ROAD · TO CAMELOT' }"],
    northpole_haunted: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 'free', x: " + NP.anchors.hearth.x + ", z: " + NP.anchors.hearth.z + ", face: " + NP.anchors.hearth.face + " }"],
    shasta_lemuria: ['a', "{ site: 'prebuilt_shasta', part: '" + aL.S.part + "', wall: 'free', x: " + aL.x + ", z: " + aL.z + ", face: " + M.anchors.lemuria.face + ", sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN' }"],
    heaven_olympus: ['b', "{ site: 'prebuilt_shasta', part: '" + aH.S.part + "', wall: 'n', x: " + aH.x + ", sub: 'THE GRAND STAIR · UP INTO HEAVEN' }"],
    lodge_olympus: ['b', "{ site: 'prebuilt_shasta', part: '" + aP.S.part + "', wall: 'free', x: " + aP.x + ", z: " + aP.z + ", face: " + M.anchors.painting.face + " }"],
    vatican_olympus: ['b', "{ site: 'prebuilt_shasta', part: '" + aV.S.part + "', wall: 's', x: " + aV.x + ", sub: 'THE PILGRIM STAIR · DOWN TO THE VATICAN' }"],
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