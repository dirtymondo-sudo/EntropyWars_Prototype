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
     site_prebuilt_shasta_hills       THE HOLLYWOOD HILLS (2026-11-15, plan 2, layout rooms[1]): 13 x 3 plots above Disaster City: the sign, the ridge, the sea cliffs
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
const MTN = 'site_prebuilt_shasta_mountains', POLE = 'site_prebuilt_northpole_plots', HILLS = 'site_prebuilt_shasta_hills';
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
   Pass), K (the Ski Lodge + slopes), O (Mount Olympus), S (Mount Shasta) (the Mountains room), H (the Hollywood Hills, its own room). No
   district's content is in this tool. THE TOOL KEEPS everything shared: the plan and its cuts (makeRoom's opts), the heights, the paint, the tree
   zones, the sky and edges, every way out (doors on the room's walls, the links' ends, DOOR HQ's bay doors), the spawn, the checks.
   A file may export any of:
     tailor(t)    inside makeRoom, after the tool's own `carves`, before the trails between plots are cut. t = { set(plotId, lx, ly, ch),
                  get(plotId, lx, ly), plot(plotId), N }: change a square of the district's own plots (the letters: layout.json `legend`)
     apply(ctx)   after the room's ways out exist: the standing things (ctx.building: a walked-in building takes its squares here)
     build(ctx)   after every district's apply: the dressing
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

    /* ── THE HEIGHTS (after every square is final) ── */
    function heights() {
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
    L.push("            shell: " + e.shell + ",");
    L.push("            parti: '" + e.parti + "',");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + o.pw + ", nz: " + o.ph + ", names: " + J(R.plots.map(p => [p.id, p.name, p.district, p.level])) + " },");
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
  door('pass', 'P03-01', 'e', Object.assign({ way: 'trail', action: { room: MTN, at: 'pass' } }, DOORWORDS('THE MOUNTAINS · THE SNOWY PASS', 'THE PASS GATE · UP OVER THE RANGE', 'The village road climbs out between two drifts and keeps climbing. The gate at the top is the only way over.')));
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
  door('hills', 'P15-02', 'e', Object.assign({ way: 'road', action: { room: HILLS, at: 'shasta' } }, DOORWORDS('THE HOLLYWOOD HILLS', 'THE SHASTA ROAD · EAST TO THE SIGN', 'The snow stops at a cattle grid. Past it the road is dry, the brush is brown, and a row of very large letters stands with its back to you.')));
  door('saddle', 'P15-00', 'e', Object.assign({ way: 'trail', action: { room: HILLS, at: 'ridge' } }, DOORWORDS('THE HOLLYWOOD HILLS', 'THE SADDLE · THE RIDGE BEHIND THE LETTERS', 'The ridge trail leaves the ice and follows the crest east. On a clear day you can see the whole city from it, and the back of its name.')));

  runDistricts(R, 'apply'); runDistricts(R, 'build');   // THE DISTRICT FILES: everything that stands on the plots
  R.out = WAY;
}


/* ════════════════════════════════════════════════ THE HOLLYWOOD HILLS (plan room 2, 13 x 3 plots) ════════════════════════════════════════════════
   mondo 11-15: "The disaster city version of the Hollywood sign needs to be part of the mountains, not just a weenie on the edge of the map ...
   include the fake weenie mountains as part of this actual mountain plan"; his OK on plan 2 ("build it"). The dry east end of the range, straight
   above Disaster City: the ridge (row 0), the letters DISASTER CITY on their slope (row 1), the canyon foot over the city (row 2), and sea cliffs
   at the east end over the north end of the city's beach. Base level 2: the Cove's sand is at 0 m, the sea at -0.6. */
const HL = makeRoom({ id: HILLS, tag: 'hills', files: ['H'], streams: { H: 39 }, room: 1, px0: 0, py0: 0, pw: 13, ph: 3, base: 2, seed: 39, rockCap: 16, seaBed: -4.2, seaShore: -1.4, deadLevel: () => 10, trail: () => 'p',
    carves: [7, 8, 9, 10, 11].flatMap(lx => [['H07-02', lx, 8, 'Y'], ['H07-02', lx, 9, 'Y']])
        .concat([10, 11].flatMap(ly => [['H08-02', 5, ly, 'Y'], ['H08-02', 6, ly, 'Y']]))   // the road's last squares down to the city (the door stands over the city's own mountain road: Hills x 84 = city x 105)
        .concat([1, 2, 3].flatMap(ly => [['H10-00', 4, ly, 'f'], ['H10-00', 7, ly, 'f']]), [2, 3].flatMap(ly => [['H05-00', 5, ly, 'f'], ['H05-00', 6, ly, 'f']])) });   // (the tank's and the mast's pads are concrete, not rooms)   // the canyon road runs on east through the spur (the drawing stopped it at the rock)
{ const R = HL, { put, dec, tree, building, look, S, door, mx, mz, gx, gz, props, feat } = R;
  /* ── THE WAYS ── */
  door('shasta', 'H00-01', 'w', Object.assign({ way: 'road', action: { room: MTN, at: 'hills' } }, DOORWORDS('MOUNT SHASTA', 'THE SHASTA ROAD · WEST INTO THE SNOW', 'The road climbs west out of the brush. Somewhere past the cattle grid it stops being dry.')));
  door('ridge', 'H00-00', 'w', Object.assign({ way: 'trail', action: { room: MTN, at: 'saddle' } }, DOORWORDS('MOUNT SHASTA', 'THE SADDLE · THE GLACIER SIDE', 'The crest trail runs west onto the ice. The volcano is closer than it has any right to be.')));
  R.out = { road: gx(S('H08-02', 6, 0)[0]), cove: R.spur('H12-02', 's', 'D') };
  runDistricts(R, 'apply'); runDistricts(R, 'build');   // THE DISTRICT FILES: everything that stands on the plots
}

/* ══ the three rooms ══ */
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
const hSpawn = HL.S('H07-02', 5, 9);
const hBlock = finish(HL, { label: 'THE HOLLYWOOD HILLS', sub: 'THE SIGN · THE RIDGE · THE OBSERVATORY · THE SEA CLIFFS', site: 'prebuilt_shasta', part: 'hills',
    shell: "hqAncientShell({ w: " + (2 * HL.HW) + ", d: " + (2 * HL.HD) + ", h: 20, wallH: 20, floor: 'grass_rocky', apron: 'grass_rocky', skirt: 'rocks_5', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: " + HL.mx(hSpawn[0]) + ", z: " + HL.mz(hSpawn[1]) + ", y: 5.0 },\n" +
           "                                    mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xfff0d8, ambient: 0.62 },\n" +
           "                                    sky: { night: 0, world: { kind: 'plain' }, tint: 0xa8c4e4, tintAmt: 0.3, stars: 0.5, nebula: 0.6, day: 1, clouds: 0.12, fog: { color: 0xd8c8b0, amount: 0.4, top: 0.05, band: 0.5, density: 0.005 }, scenery: 'none' },\n                                    look: HQ_ROOM_LOOKS.mountain })",
    parti: 'The dry end of the range on thirty-nine plots above the city: a ridge trail, twelve letters standing on their slope with a walk under them and a walk behind, a canyon road up from the streets, and cliffs where the hills fall into the bay.',
    floor: 'grass_rocky', cliff: 'rocks_5', pal: ['rocks_5', 'dirt_2', 'urban:ConcreteRoofBitumen1a', 'urban:ConcreteSlab2a', 'marble_light', 'desert', 'obsidian', 'grass_2'],
    paintOf: ch => ch === 'r' ? 1 : ch === 'p' ? 2 : ch === 'Y' ? 3 : (ch === 'f' || ch === 'B') ? 4 : ch === 'm' ? 5 : (ch === 'D' || ch === 'z' || ch === 'w') ? 6 : ch === 'h' ? 7 : ch === 't' ? 8 : 0,
    trees: { oak: { kinds: ['tree_2', 'tree_4', 'tree_2', 'tree'], treeH: [4.5, 7.5] } }, treeDefault: 'oak', maxTrees: 500, treeKey: () => 'oak',
    sea: process.env.HILLS_NO_SEA ? null : { y: -0.6, key: 'water' },
    edges: { reach: 440, n: { kind: 'mountain' }, w: { kind: 'mountain' }, e: { kind: 'coast' }, s: { kind: 'desert', cap: { kind: 'coast', at: 'e', off: 42, len: 30 } } },
    noWalk: ['H12-00', 'H12-01'],   // the sea cliffs: rock and water, nobody stands there
    lines: [], spawn: hSpawn, face: 180 });
const block = ["        /* MOUNTAINS-BEGIN — THE MOUNTAINS ON PLOTS (2026-11-15): written by `node bake-mountains.js` from docs/areas/mountains/layout.json. Never hand-edit between the markers; edit a district file (docs/areas/mountains/districts/), the tool or the layout and rerun. */"]
    .concat(mBlock, pBlock, hBlock, ["        /* MOUNTAINS-END */"]).join('\n') + '\n';
/* the ends this tool owns: the links that lead into the two rooms, and the three bay doors of DOOR HQ */
const LINKS = {
    northpole_camelot: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 's', x: " + NP.out.SLEIGH + ", sub: 'THE SLEIGH ROAD · TO CAMELOT' }"],
    northpole_haunted: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 'free', x: " + NP.anchors.hearth.x + ", z: " + NP.anchors.hearth.z + ", face: " + NP.anchors.hearth.face + " }"],
    shasta_lemuria: ['a', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'free', x: " + M.anchors.lemuria.x + ", z: " + M.anchors.lemuria.z + ", face: " + M.anchors.lemuria.face + ", sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN' }"],
    heaven_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'n', x: " + M.out.heaven + ", sub: 'THE GRAND STAIR · UP INTO HEAVEN' }"],
    lodge_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'free', x: " + M.anchors.painting.x + ", z: " + M.anchors.painting.z + ", face: " + M.anchors.painting.face + " }"],
    vatican_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 's', x: " + M.out.vatican + ", sub: 'THE PILGRIM STAIR · DOWN TO THE VATICAN' }"],
    downtown_mountains: ['b', "{ site: 'prebuilt_shasta', part: 'hills', wall: 's', x: " + HL.out.road + ", sub: 'THE CANYON ROAD · DOWN TO DISASTER CITY' }"],   // (plan 2: the city's mountain road lands under the sign now)
    downtown_cove: ['b', "{ site: 'prebuilt_shasta', part: 'hills', wall: 's', x: " + HL.out.cove + ", sub: 'THE COVE · SOUTH ALONG THE BEACH' }"],
};
const ENTRY = {
    prebuilt_shasta: "{ room: '" + MTN + "', door: { id: 'bay', wall: 'free', x: " + M.anchors.bayShasta.x + ", z: " + M.anchors.bayShasta.z + ", face: " + M.anchors.bayShasta.face + " } }",
    prebuilt_olympus: "{ room: '" + MTN + "', door: { id: 'bay_olympus', wall: 'free', x: " + M.anchors.bayOlympus.x + ", z: " + M.anchors.bayOlympus.z + ", face: " + M.anchors.bayOlympus.face + " } }",
    prebuilt_northpole: "{ room: '" + POLE + "', door: { id: 'bay', wall: 's', x: " + NP.out.BAY + " } }",
};
[[NP, ['hearth']], [M, ['painting', 'bayOlympus', 'lemuria', 'bayShasta']]].forEach(([R, need]) => need.forEach(k => { const a = R.anchors[k]; if (!a || !isFinite(a.x) || !isFinite(a.z)) throw new Error(R.o.id + ': no anchor `' + k + '` (a district file sets it: THE DISTRICT FILES)'); }));
console.log('ways ' + JSON.stringify({ pole: NP.out, mountains: M.out, hills: HL.out, woodsDoor: M.doors.find(d => d.id === 'woods').x }));
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
console.log('data.js: ' + MTN + ' + ' + POLE + ' + ' + HILLS + ' written (' + block.length + ' bytes)');