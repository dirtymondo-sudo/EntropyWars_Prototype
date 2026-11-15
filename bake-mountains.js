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
   Never hand-edit between the markers: edit this tool or the layout and rerun. Notes: docs/notes/areas-complexes.md "THE MOUNTAINS ON PLOTS".
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
const MTN = 'site_prebuilt_shasta_mountains', POLE = 'site_prebuilt_northpole_plots', HILLS = 'site_prebuilt_shasta_hills';
const MASS = { r: 1, k: 1, a: 1, t: 1, z: 1 };   // z = the sea (the Hills' east end): sunk to the room's `seaBed`, under terrain.sea
const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const hash = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
    return (hash(ix, iy, s) * (1 - tx) + hash(ix + 1, iy, s) * tx) * (1 - ty) + (hash(ix, iy + 1, s) * (1 - tx) + hash(ix + 1, iy + 1, s) * tx) * ty; };
/* the textures the buildings wear (the city's sheets) */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 };

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
    let seed = o.seed; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const inR = (x, y) => x >= 0 && y >= 0 && x < W && y < H, open = (x, y) => inR(x, y) && !MASS[cell[y][x]];
    const S = (id, lx, ly) => { const p = byId[id]; if (!p) throw new Error('no plot ' + id + ' in ' + o.id); return [p.lx * N + lx, p.ly * N + ly]; };
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
    return { o, W, H, HW, HD, gx, gz, mx, mz, cell, plots, byId, F, props, doors, npc, marks, ARCH, count, taken, feat, rnd, open, inR, S, plotAt, carve, run, spur, door, put, dec, tree, native, building, look, heights, bad, flats };
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
const DOORWORDS = (label, sub, desc) => ({ label, sub, desc });

/* ════════════════════════════════════════════════ THE NORTH POLE (plan columns 0-3) ════════════════════════════════════════════════ */
const NP = makeRoom({ id: POLE, tag: 'pole', px0: 0, py0: 0, pw: 4, ph: 4, base: 9, seed: 16, deadLevel: () => 9, rockCap: 12 });
{ const R = NP, { put, dec, tree, native, building, look, S, door, mx, mz, gx, gz, props } = R;
  /* THE WAYS: the Pass Gate (east, up into the Mountains), the sleigh road south to Camelot's north gate (the link `northpole_camelot`), the bay door of DOOR HQ */
  door('pass', 'P03-01', 'e', Object.assign({ way: 'trail', action: { room: MTN, at: 'pass' } }, DOORWORDS('THE MOUNTAINS · THE SNOWY PASS', 'THE PASS GATE · UP OVER THE RANGE', 'The village road climbs out between two drifts and keeps climbing. The gate at the top is the only way over.')));
  const SLEIGH = R.spur('P03-03', 's'), BAY = R.spur('P01-03', 's');
  /* THE WORKSHOP (walked into): red boards on a stone foot, a snow roof, lit windows; its door on the east side, off the village lane */
  const SHOP = building('workshop', 'P02-00', [3, 3, 9, 8, 'E'], 5.25, { keyIn: WD, floorIn: 'wood_planks' }, (a, w, d, dr) => {
      a.shell(w, 5.25, d, WD, 0xb84438, dr, [3.5, 1.75]); a.box(0, 0, 0, w + 0.4, 0.9, d + 0.4, 'rocks_5', 0xa8a8b0, { faces: 'blr', top: false });
      a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
      a.roof('gable', 0, 5.25, 0, w + 1.8, 3.8, d + 1.8, 'ice', 0xf4f8ff, { keyEnd: WD, tintEnd: 0xb84438 });
      for (const x of [-5.2, 5.2]) a.box(x, 1.6, d / 2 + 0.08, 1.3, 1.5, 0.12, GLS, 0xf0d890, { glow: 0.7 });
      for (const s of [-1, 1]) for (const z of [-6, 0, 6]) a.box(s * (w / 2 + 0.06), 1.6, z, 0.1, 1.5, 1.3, GLS, 0xf0d890, { glow: 0.7 });
      a.box(dr.lx - dr.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, 0xf4f4f4); a.box(dr.lx + dr.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, 0xf4f4f4); a.box(dr.lx, 2.25, d / 2 + 0.1, dr.cw + 0.5, 0.2, 0.2, WD2, 0xf4f4f4);
      a.box(w / 2 - 1.6, 5.25, -d / 2 + 1.2, 1.3, 5.2, 1.3, 'bricks_2', 0xb86a54, { roof: true });                       // the chimney over the hearth
      a.box(w / 2 - 1.6, 0, -d / 2 + 0.6, 2.6, 2.2, 1.0, 'bricks_2', 0xb86a54); });                                      // the hearth inside, on the back wall
  SHOP.put('psx_table_large_3', -2, -2, { face: 90 }); SHOP.put('psx_table_large_3', -2, -7, { face: 90 }); SHOP.put('xmas_hammer', -2, -2, { y: 0.82 }); SHOP.put('xmas_hammer_2', -1.2, -7, { y: 0.82 });
  SHOP.put('xmas_cocoa', -2.6, -6.6, { y: 0.82 }); SHOP.put('xmas_gingerbread', -2.4, -2.6, { y: 0.82 }); SHOP.put('xmas_gift', -6.8, -8.6); SHOP.put('xmas_gift_2', -5.6, -8.9, { face: 30 }); SHOP.put('xmas_gift_3', -7, -6.6);
  SHOP.put('xmas_gift_4', 6.6, 6.8, { face: 60 }); SHOP.put('cardboard_boxes', -6.6, 6.4); SHOP.put('cardboard_box', -5.2, 7.4, { face: 40 }); SHOP.put('sea_chest', 6.4, 2.2, { face: 270 }); SHOP.put('xmas_tree', 5.6, 8.0, { h: 3.2, floor: true });
  SHOP.put('xmas_stocking', 4.2, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_stocking_2', 4.9, -9.75, { y: 1.5, face: 180 }); SHOP.put('xmas_garland', 0, -10.2, { y: 3.4, face: 180 }); SHOP.put('xmas_wreath', -4, -10.2, { y: 2.6, face: 180 });
  R.hearth = { x: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[0], z: SHOP.at(SHOP.fw / 2 - 1.6, -SHOP.fd / 2 + 1.25)[1], face: SHOP.face(180) };   // the fireplace: the link `northpole_haunted`
  /* the cottages: every other run of the plan's `B` is one of the pack's own houses, its door to the nearest snow */
  { const seen = new Set(); for (let y = 0; y < R.H; y++) for (let x = 0; x < R.W; x++) { if (R.cell[y][x] !== 'B' || seen.has(x + ':' + y) || R.taken.has(x + ':' + y)) continue;
        const run = [], st = [[x, y]]; seen.add(x + ':' + y);
        while (st.length) { const q = st.pop(); run.push(q); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = q[0] + dx, Y = q[1] + dy; if (R.inR(X, Y) && R.cell[Y][X] === 'B' && !seen.has(X + ':' + Y) && !R.taken.has(X + ':' + Y)) { seen.add(X + ':' + Y); st.push([X, Y]); } } }
        const x0 = Math.min(...run.map(q => q[0])), x1 = Math.max(...run.map(q => q[0])) + 1, y0 = Math.min(...run.map(q => q[1])), y1 = Math.max(...run.map(q => q[1])) + 1;
        const n = { S: 0, N: 0, E: 0, W: 0 }; for (let i = x0; i < x1; i++) { if (R.open(i, y1) && R.cell[y1][i] !== 'B') n.S++; if (R.open(i, y0 - 1) && R.cell[y0 - 1][i] !== 'B') n.N++; } for (let j = y0; j < y1; j++) { if (R.open(x1, j) && R.cell[j][x1] !== 'B') n.E++; if (R.open(x0 - 1, j) && R.cell[j][x0 - 1] !== 'B') n.W++; }
        const side = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
        run.forEach(q => R.taken.add(q[0] + ':' + q[1])); R.flats.push([x0, y0, x1, y1, side]);
        props.push({ key: 'xmas_house', x: r2((gx(x0) + gx(x1)) / 2), z: r2((gz(y0) + gz(y1)) / 2), face: { S: 180, N: 0, E: 90, W: 270 }[side], h: 5.6, floor: true }); R.count.cottages = (R.count.cottages || 0) + 1; } }
  /* THE POLE (the landmark): a striped pole on a cairn */
  { const q = S('P01-00', 7, 6); look('thepole', mx(q[0]), mz(q[1]), a => { for (let i = 0; i < 6; i++) a.cyl(0, i, 0, 0.3, 1.0, 'marble_light', i % 2 ? 0xf4f4f4 : 0xc83030, { seg: 10 }); a.cyl(0, 6, 0, 0.55, 0.7, 'marble_light', 0xc83030, { seg: 12 }); });
    R.taken.add(q[0] + ':' + q[1]); for (const d of [[-1, 0], [1, 1], [0, -1]]) props.push({ key: 'ocean_rock', x: r2(mx(q[0]) + d[0] * 1.5), z: r2(mz(q[1]) + d[1] * 1.5), face: Math.round(R.rnd() * 360) });
    put('P01-00', 'signpost', 5, 8, { face: 200 }); dec('P01-00', 'xmas_gift_3', 8, 5); }
  /* THE VILLAGE: the tree on the square, the fire, the snowmen, the presents */
  put('P02-01', 'xmas_tree', 5, 5, { h: 4.6, floor: true }); dec('P02-01', 'xmas_gift', 6, 6); dec('P02-01', 'xmas_gift_2', 4, 6); dec('P02-01', 'xmas_gift_3', 6, 4); dec('P02-01', 'xmas_gift_4', 4, 4);
  put('P02-01', 'park_bench', 3, 5, { face: 90 }); put('P02-01', 'campfire', 7, 6); native('P02-01', 'santa clause', 5, 7, 180, sayOf(O_POLE, 'santa clause'));
  put('P01-01', 'xmas_snowman', 5, 4); put('P01-01', 'xmas_tree_plain', 7, 5, { h: 4.2, floor: true }); dec('P01-01', 'xmas_gift_2', 6, 6); put('P01-01', 'xmas_snowman_3', 4, 6);
  put('P03-01', 'xmas_snowman_2', 5, 4); put('P03-01', 'xmas_tree_plain', 4, 6, { h: 4.2, floor: true }); dec('P03-01', 'xmas_gift_4', 6, 5); put('P03-01', 'signpost', 9, 5, { face: 90 });
  put('P03-00', 'xmas_tree', 5, 5, { h: 3.6, floor: true }); native('P03-00', 'gnome', 3, 5, 270, sayOf(O_POLE, 'gnome')); dec('P03-00', 'xmas_gift', 6, 4); dec('P03-00', 'cardboard_boxes', 6, 6);
  /* THE DRIFT: the yeti's end of the valley */
  native('P00-00', 'yeti', 5, 7, 90, sayOf(O_POLE, 'yeti')); put('P00-00', 'xmas_snowman', 4, 6); dec('P00-00', 'sea_chest', 6, 8); tree('P00-01', 'xmas_snow_pine', 6.5, 5, 5); dec('P00-01', 'fallen_log', 6, 6);
  /* THE SLEIGH ROAD and THE SNOWLINE */
  put('P02-02', 'sleigh', 5, 5, { face: 90 }); put('P02-02', 'sleigh', 6, 7, { face: 60 }); dec('P02-02', 'xmas_gift', 4, 6); put('P03-02', 'signpost', 6, 6, { face: 0 }); put('P03-02', 'campfire', 5, 7);
  put('P01-03', 'xmas_snowman_2', 6, 5); tree('P02-03', 'xmas_snow_pine_2', 6, 4, 6); put('P03-03', 'xmas_tree_plain', 7, 6, { h: 3.8, floor: true }); dec('P03-03', 'xmas_gift_3', 6, 7); dec('P02-03', 'fallen_log', 5, 7);
  /* THE FROZEN LAKE: you walk (and skate) on it; a pipe rail round the north shore to grind */
  { const q = S('P00-02', 9, 6); R.feat({ k: 'rail', arc: { x: mx(q[0]), z: mz(q[1]), r: 24, a0: 300, a1: 60 }, model: 'pipe', block: false }); }
  dec('P00-03', 'cave_stone', 4, 5); dec('P01-02', 'stump', 6, 5);
  R.out = { SLEIGH, BAY };
}

/* ════════════════════════════════════════════════ THE MOUNTAINS (plan columns 4-15) ════════════════════════════════════════════════ */
const SKI = { 3: 1, 4: 1, 5: 1 };   // the slopes' columns: one even grade from the Top Station to the Lodge (no flat shelves on a run)
const M = makeRoom({ id: MTN, tag: 'mtn', px0: 4, py0: 0, pw: 12, ph: 8, base: 8, seed: 72, rockCap: 26,
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

  /* ── THE BUILDINGS ── */
  const LOG = 0x7a5a40, DARK = 0x3a2a20, SNOW = 0xf4f8ff, STONE = 0x9a9aa0;
  const cabin = (a, w, d, dr, q) => {   // a log building: stone foot, log walls, corner logs, a snow roof whose gable faces the front, lit windows
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
  /* THE SKI LODGE (walked into): the great room, the fire, the bar */
  const LODGE = building('lodge', 'P08-03', [2, 2, 10, 8, 'S'], 5.25, { leafDouble: true }, (a, w, d, dr) => cabin(a, w, d, dr, { h: 5.25, rh: 6.2, chimney: 9.5, porch: true, name: 'SKI LODGE' }));
  LODGE.put('campfire', 9.5, -8.4); LODGE.put('chesterfield_sofa', 9.5, -4.6, { face: 0 }); LODGE.put('wingback_chair', 6.2, -6.4, { face: 60 }); LODGE.put('wingback_chair', 12.6, -6.4, { face: 300 }); LODGE.put('rug_round', 9.5, -6.2, { y: 0.17 });
  LODGE.put('coffee_table', 9.5, -6.0); LODGE.put('xmas_cocoa', 9.5, -6.0, { y: 0.5 }); LODGE.put('mobius_bar', -10.5, -7.2, { face: 90 }); for (const z of [-9, -7.4, -5.8, -4.2]) LODGE.put('bar_stool', -8.6, z);
  for (const q of [[-3, -5], [2, -1.5], [-5, 2.5]]) { LODGE.put('round_table', q[0], q[1]); LODGE.put('psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); LODGE.put('psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); LODGE.put('coffee_mug', q[0], q[1], { y: 0.78 }); }
  LODGE.put('jukebox', -12.8, 2, { face: 90 }); LODGE.put('arcade_cabinet', -12.8, 4.4, { face: 90 }); LODGE.put('air_hockey_table', 8, 4); LODGE.put('trophy_case', 13.2, 1, { face: 270 }); LODGE.put('locker_bench', 4, 8.6, { face: 180 });
  LODGE.put('notice_board', -5, 9.9, { y: 1.5, face: 0 }); LODGE.put('psx_sofa_3', 1, -8.8, { face: 180 }); LODGE.put('xmas_tree', -2.5, 7.2, { h: 3.4, floor: true });
  /* THE RENTAL HUT: boards on the wall, a counter */
  const RENT = building('rental', 'P07-03', [4, 4, 8, 7, 'S'], 3.5, {}, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.6, tint: 0x8a4a3a, name: 'RENTALS' }));
  RENT.put('form_counter', 0, -1.5, { face: 180 }); for (const x of [-4.6, -2.3, 2.3, 4.6]) RENT.put('skateboard', x, -4.7, { y: 1.1, face: 180 }); RENT.put('locker', -6, 2.5, { face: 90 }); RENT.put('locker', -6, 1.2, { face: 90 });
  RENT.put('locker_bench', 4.5, 2.6, { face: 0 }); RENT.put('price_tag', 0.8, -1.5, { y: 1.05 });
  /* THE WARMING HUT, on the tree line under the pass */
  const HUT = building('hut', 'P06-03', [4, 3, 8, 6, 'S'], 3.5, {}, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.6, chimney: 4.5, name: 'WARMING HUT' }));
  HUT.put('campfire', 4.5, -3.3); HUT.put('cot', -5, -3.4, { face: 0 }); HUT.put('cot', -5, 0.4, { face: 0 }); HUT.put('locker_bench', 1, -4.2, { face: 0 }); HUT.put('rug_round', 1.5, -1, { y: 0.17 }); HUT.put('xmas_cocoa', 1, -4.2, { y: 0.5 });
  HUT.put('psx_wooden_crate_2', 5.6, 3.4); HUT.put('railway_lantern', -1.5, 3.6);
  /* THE TOP STATION, where the chairlift lets you off and every run starts */
  const TOP = building('topstation', 'P08-00', [4, 3, 8, 7, 'S'], 3.5, { leaf: 'leaf_frame_only' }, (a, w, d, dr) => cabin(a, w, d, dr, { h: 3.5, rh: 2.4, tint: 0x5a6a7a, name: 'TOP STATION' }));
  TOP.put('locker_bench', -4.5, -5.5, { face: 0 }); TOP.put('locker_bench', 4.5, -5.5, { face: 0 }); TOP.put('notice_board', 0, -6.85, { y: 1.5, face: 180 }); TOP.put('railway_lantern', 5.6, 5.2);
  /* THE TEMPLE on the peak (walked into): marble, a portico of six columns, a pediment */
  const MARB = 0xf2efe6, TERRA = 0xb86a4a;
  const TEMPLE = building('temple', 'P11-00', [3, 3, 9, 7, 'S'], 7, { leaf: 'leaf_frame_only', leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
      a.shell(w, 7, d, 'marble_light', MARB, dr); a.box(0, 0, 1.75, w + 3.2, 0.3, d + 6.4, 'marble_light', 0xdcd8cc, { top: true });                       // the stylobate, a step proud
      for (let i = 0; i < 6; i++) { const x = -w / 2 - 0.6 + i * (w + 1.2) / 5; a.cyl(x, 0.3, d / 2 + 3.2, 0.55, 6.7, 'marble_light', MARB, { seg: 12 }); a.box(x, 6.7, d / 2 + 3.2, 1.5, 0.3, 1.5, 'marble_light', MARB); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) a.cyl(s * (w / 2 + 1.0), 0.3, -d / 2 + 0.6 + i * (d + 1.4) / 3.6, 0.5, 6.7, 'marble_light', MARB, { seg: 12 });
      a.box(0, 7, 1.6, w + 3.2, 0.9, d + 6.6, 'marble_light', 0xe6e2d6, { under: true });                                                                 // the entablature
      a.roof('gable', 0, 7.9, 1.6, d + 7.0, 3.0, w + 3.6, U('WoodGeneric2a'), TERRA, { ry: 90, keyEnd: 'marble_light', tintEnd: MARB }); });
  TEMPLE.put('stone_altar', 0, -3.6); TEMPLE.put('brazier', -4, -3.6); TEMPLE.put('brazier', 4, -3.6); TEMPLE.put('angel_statue', -8, -4.5, { face: 150 }); TEMPLE.put('angel_statue', 8, -4.5, { face: 210 });
  TEMPLE.put('instrument_harp', -7.5, 3.5, { face: 120 }); TEMPLE.put('greek_amphora', 7.6, 4.2); TEMPLE.put('greek_amphora', 8.6, 3.0, { face: 80 }); TEMPLE.put('lectern', 0, 0.5, { face: 180 });
  R.painting = { x: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[0], z: TEMPLE.at(-6, -TEMPLE.fd / 2 + 0.25)[1], face: TEMPLE.face(180) };   // the link `lodge_olympus` (a painting on the cella's back wall)
  native('P11-00', 'seraphim', 5, 8, 180, sayOf(O_OLYMPUS, 'seraphim'));

  /* ── THE SNOWY PASS ── */
  { const q = S('P04-01', 2, 4); look('passgate', gx(q[0]), gz(q[1] + 1), a => { for (const s of [-1, 1]) a.cyl(0, 0, s * 4.2, 0.28, 5.2, WD2, DARK, { seg: 8 }); a.box(0, 4.6, 0, 0.4, 0.4, 9.6, WD2, DARK); a.box(0, 5.1, 0, 0.5, 0.25, 11, WD2, 0x8a2a20); }); }
  put('P04-01', 'ocean_rock', 4, 3); dec('P04-01', 'ocean_rock_2', 5, 3); put('P04-01', 'signpost', 4, 7, { face: 270 }); dec('P04-01', 'railway_lantern', 3, 6);
  { const q = S('P05-01', 5, 5); look('highpass', mx(q[0]), mz(q[1]), a => { for (let i = 0; i < 5; i++) a.cyl(0, i * 0.7, 0, 1.3 - i * 0.22, 0.7, 'rocks_5', i % 2 ? 0x9a9aa0 : 0x86868c, { seg: 7 }); a.cyl(0, 3.5, 0, 0.07, 3.2, WD2, DARK, { seg: 6 });
        [0xc83030, 0x3060c8, 0xf0d040, 0x30a050, 0xf4f4f4].forEach((c, i) => a.box(0.5 + i * 0.5, 6.2 - i * 0.35, 0, 0.4, 0.34, 0.03, null, c)); }); R.taken.add(q[0] + ':' + q[1]); }   // THE HIGH PASS (the landmark): the cairn and its flags
  put('P05-01', 'brazier', 7, 6); dec('P05-01', 'cave_stone', 3, 6); put('P06-01', 'signpost', 3, 5, { face: 90 }); dec('P06-01', 'ocean_rock_3', 4, 3);
  put('P05-00', 'ocean_rock_4', 6, 3); dec('P05-00', 'eagle', 8, 4, { y: 0.02 }); dec('P04-00', 'cave_stone', 5, 5); dec('P06-00', 'cave_stone', 3, 4);
  put('P04-02', 'sleigh', 5, 6, { face: 30 }); put('P04-02', 'xmas_snowman', 3, 7); put('P05-02', 'camping_tent', 5, 3, { face: 200 }); dec('P05-02', 'sea_chest', 9, 3);
  { const p = R.byId['P06-02'], z0 = gz(p.ly * N + 5), z1 = gz(p.ly * N + 7), xa = gx(p.lx * N + 5), xb = gx(p.lx * N + 7);   // THE ROPE BRIDGE: planks over the crevasse, a rope rail either side (a wall: nobody falls in)
    for (const x of [xa + 0.15, xb - 0.15]) feat({ k: 'rail', x0: x, z0: r2(z0 - 1.2), x1: x, z1: r2(z1 + 1.2), model: 'ranch' });
    for (const [x0, x1] of [[gx(p.lx * N), xa], [xb, gx(p.lx * N + N)]]) for (const z of [r2(z0 - 0.4), r2(z1 + 0.4)]) feat({ k: 'rail', x0, z0: z, x1, z1: z, model: 'ranch' });   // …and along both lips of the slot
    put('P06-02', 'signpost', 5, 3, { face: 180 }); dec('P06-02', 'meshy_rope', 7, 8); }
  dec('P04-03', 'fallen_log', 5, 5); dec('P04-03', 'wolf', 4, 6); dec('P05-03', 'stump', 5, 6); tree('P05-03', 'xmas_snow_pine', 6, 6, 5); dec('P06-03', 'fallen_log', 3, 6); put('P06-03', 'signpost', 8, 6, { face: 0 });

  /* ── THE SKI LODGE + SLOPES: five runs (the Black Run, the Big Jump, the Slalom, the Half-Pipe, the Bunny Slope), groomed ice you ride down on the board ── */
  const SP = ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3'];
  for (const id of ['P07-00', 'P07-01', 'P07-02']) for (let ly = 1; ly < N; ly += 3) { tree(id, SP[ly % 3], 6 + (ly % 2), 2, ly); tree(id, SP[(ly + 1) % 3], 6.5, 9, ly + 1 < N ? ly + 1 : ly); }   // THE BLACK RUN: trees both sides
  { const q = S('P08-01', 4, 5); feat({ k: 'ramp', x0: gx(q[0] + 2), z0: gz(q[1]), x1: gx(q[0] + 2), z1: gz(q[1] + 2), w: 14, h0: 0, h1: 2.4, edge: 0.3 }); }                                                   // THE BIG JUMP: the kicker (you come down onto it; it throws you over the landing)
  put('P08-01', 'signpost', 2, 3, { face: 180 });
  { const p = R.byId['P09-01']; [[4, 1], [7, 3], [4, 5], [7, 7], [4, 9]].forEach(([lx, ly], i) => look('gate' + i, mx(p.lx * N + lx), mz(p.ly * N + ly), a => { for (const s of [-1, 1]) { a.cyl(s * 1.5, 0, 0, 0.06, 1.9, null, i % 2 ? 0xd03030 : 0x3050d0, { seg: 6 }); a.box(s * 1.5 + 0.3, 1.35, 0, 0.6, 0.5, 0.03, null, i % 2 ? 0xd03030 : 0x3050d0); } })); }   // THE SLALOM: five gates
  { const p = R.byId['P09-00'], xw = gx(p.lx * N + 5), xe = gx(p.lx * N + 7);   // THE HALF-PIPE: the floor two squares wide, a bank rising 3.2 m either side over two squares (in 7 m pieces down the hill, so each piece lies on its own stretch of slope)
    for (let ly = 1; ly < 11; ly += 2) { const zc = gz(p.ly * N + ly + 1); feat({ k: 'ramp', x0: xw, z0: zc, x1: r2(xw - 7), z1: zc, w: 7, h0: 0, h1: 3.2, edge: 0.05 }); feat({ k: 'ramp', x0: xe, z0: zc, x1: r2(xe + 7), z1: zc, w: 7, h0: 0, h1: 3.2, edge: 0.05 }); } }
  { const p = R.byId['P08-02'], x = gx(p.lx * N + 6);   // THE CHAIRLIFT's line: two pipe rails and two boxes under the chairs
    feat({ k: 'rail', x0: r2(x - 5.25), z0: gz(p.ly * N + 3), x1: r2(x - 5.25), z1: gz(p.ly * N + 8), model: 'pipe', block: false }); feat({ k: 'rail', x0: r2(x + 5.25), z0: gz(p.ly * N + 4), x1: r2(x + 5.25), z1: gz(p.ly * N + 9), model: 'pipe', block: false });
    put('P08-02', 'riser_1', 2, 9, { face: 0 }); put('P08-02', 'riser_1', 9, 2, { face: 0 }); }
  /* the lift: a tower every twelve squares from the Lodge to the Top Station, a chair hanging between; you ride it by its two stations' doors */
  { const top = S('P08-00', 6, 8), bot = S('P08-03', 6, 0), x = gx(top[0]);
    for (let sy = top[1] + 1, i = 0; sy <= bot[1]; sy += 7, i++) { look('lift' + i, x, gz(sy), a => { a.box(0, 0, 0, 0.5, 9, 0.5, U('MetalWallRibbed1a'), 0x5a6068); a.box(0, 8.6, 0, 5.0, 0.3, 0.4, U('MetalWallRibbed1a'), 0x5a6068); for (const s of [-1, 1]) a.cyl(s * 2.2, 8.9, 0, 0.35, 0.16, null, 0x2a2e34, { seg: 10 }); });
        if (i % 2 === 0) props.push({ key: 'decor_ferris_gondola', x: r2(x + 2.2), z: gz(sy + 3), y: 4.6, face: 0 }, { key: 'decor_ferris_gondola', x: r2(x - 2.2), z: gz(sy + 4), y: 4.6, face: 180 }); }
    R.doors.push(Object.assign({ id: 'lift_top', wall: 'free', x: r2(x + 3.5), z: gz(top[1]), face: 180, leaf: 'leaf_frame_only', action: { room: MTN, at: 'lift_bottom' } }, DOORWORDS('THE CHAIRLIFT', 'DOWN TO THE SKI LODGE', 'The chair comes round the wheel and does not stop. You sit down at the right moment or you do not.')));
    R.doors.push(Object.assign({ id: 'lift_bottom', wall: 'free', x: r2(x + 3.5), z: gz(bot[1] + 1), face: 0, leaf: 'leaf_frame_only', action: { room: MTN, at: 'lift_top' } }, DOORWORDS('THE CHAIRLIFT', 'UP TO THE TOP STATION', 'The lift line goes up the middle of the slopes. Every run starts where it ends.')));
    R.taken.add(top[0] + 1 + ':' + top[1]); R.taken.add(bot[0] + 1 + ':' + (bot[1] + 1)); }
  put('P09-02', 'xmas_snowman_2', 1, 6); dec('P09-02', 'traffic_cone', 1, 3); dec('P09-02', 'traffic_cone', 10, 3); dec('P09-02', 'traffic_cone', 10, 8);
  put('P09-03', 'signpost', 4, 4, { face: 180 }); put('P09-03', 'park_bench', 2, 3, { face: 180 }); put('P09-03', 'park_bench', 8, 3, { face: 180 }); put('P09-03', 'xmas_tree_plain', 9, 7, { h: 4.4, floor: true }); put('P09-03', 'sleigh', 2, 8, { face: 90 });
  put('P07-03', 'xmas_snowman', 2, 9); put('P08-03', 'campfire', 5, 10); put('P08-03', 'park_bench', 3, 10, { face: 0 }); put('P08-03', 'park_bench', 7, 10, { face: 0 }); put('P07-02', 'signpost', 9, 9, { face: 90 });

  /* ── MOUNT SHASTA ── */
  put('P14-00', 'cave_stone', 5, 5); dec('P14-00', 'cave_stone', 6, 7); put('P14-00', 'signpost', 7, 8, { face: 180 }); props.push({ key: 'white_cloud', x: mx(S('P14-00', 5, 5)[0]), z: mz(S('P14-00', 5, 5)[1]), y: 16, h: 7 });   // THE SUMMIT: the crater, the cloud parked over it
  dec('P13-00', 'cave_stone', 5, 4); dec('P15-00', 'ocean_rock_5', 6, 5); dec('P13-01', 'cave_stone', 5, 5); dec('P13-01', 'cave_stone', 4, 6);
  put('P14-01', 'camping_tent', 3, 4, { face: 140 }); put('P14-01', 'camping_tent', 8, 4, { face: 220 }); put('P14-01', 'campfire', 5, 3); dec('P14-01', 'sea_chest', 6, 2); native('P14-01', 'yeti', 7, 9, 300, sayOf(O_SHASTA, 'yeti'));
  { const q = S('P15-01', 5, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 3.6, rz: 3.0, y: -0.2, depth: 0.5, key: 'water', bank: 0.8 }); R.taken.add(q[0] + ':' + q[1]);   // THE STEAM VENTS: the warm pool
    const d = S('P15-01', 8, 6); R.lemuria = { x: mx(d[0]), z: mz(d[1]), face: 270 }; R.taken.add(d[0] + ':' + d[1]); }
  native('P15-01', 'nordic', 3, 5, 90, sayOf(O_SHASTA, 'nordic')); dec('P15-01', 'cave_stone', 4, 8); dec('P15-01', 'cave_stone', 6, 9);
  dec('P13-02', 'ocean_rock_6', 5, 6); dec('P13-02', 'ocean_rock_7', 4, 7); put('P14-02', 'signpost', 5, 4, { face: 0 }); dec('P15-02', 'cave_stone', 3, 5); dec('P15-02', 'ocean_rock_8', 4, 6);
  put('P13-03', 'campfire', 4, 6); put('P13-03', 'camping_tent', 2, 5, { face: 120 }); put('P13-03', 'camping_tent', 6, 7, { face: 240 }); put('P13-03', 'park_bench', 4, 8, { face: 0 }); put('P13-03', 'signpost', 6, 4, { face: 180 });
  native('P13-03', 'bigfoot', 2, 7, 60, sayOf(O_SHASTA, 'bigfoot')); dec('P13-03', 'fallen_log', 5, 9);
  dec('P14-03', 'candle_ring', 5, 6); dec('P14-03', 'instrument_drum', 6, 6); dec('P14-03', 'instrument_tambourine', 4, 7); dec('P14-03', 'instrument_guitar_lying', 6, 8); native('P14-03', 'shaman', 5, 5, 180); native('P14-03', 'ki fighter', 8, 7, 270);
  dec('P15-03', 'cave_stone', 4, 6); dec('P15-03', 'dead_snag', 5, 7);
  { const q = S('P13-03', 8, 6); R.bayShasta = { x: mx(q[0]), z: mz(q[1]), face: 270 }; R.taken.add(q[0] + ':' + q[1]); }   // Room 14179's cabin door stands on Bunny Flat
  /* the trail down to the Woods */
  dec('P13-04', 'fallen_log', 7, 5); dec('P13-04', 'stump', 6, 6); { const q = S('P14-04', 6, 6); feat({ k: 'pool', x: mx(q[0]), z: mz(q[1]), r: 5.0, rz: 5.0, y: -0.25, depth: 0.8, key: 'water', bank: 1.0 }); }   // THE SPRING
  { const a = S('P14-04', 6, 9), b = S('P14-04', 6, 11); feat({ k: 'deck', x0: mx(a[0]), z0: r2(gz(a[1]) - 1.75), x1: mx(a[0]), z1: r2(gz(b[1] + 1) + 1.75), w: 3.5, y: 0.3 }); }
  put('P14-05', 'park_bench', 6, 8, { face: 90 }); put('P14-05', 'lesson_sign', 4, 7, { face: 180 }); dec('P13-05', 'cave_stone', 6, 4);
  for (const d of [[6, 5], [8, 5], [5, 6], [9, 7], [7, 8]]) put('P14-06', 'cave_stone', d[0], d[1]); dec('P13-06', 'fallen_log', 6, 3);
  put('P13-07', 'signpost', 5, 5, { face: 180 }); put('P13-07', 'campfire', 7, 4); dec('P14-07', 'cave_stone', 7, 4); dec('P14-07', 'sea_chest', 8, 3);

  /* ── MOUNT OLYMPUS ── */
  { const c = S('P10-00', 5, 4), ring = [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]];   // THE TWELVE THRONES (eight seats fit the court's ring; four more on its north row)
    ring.forEach(d => { const sx = c[0] + d[0], sy = c[1] + d[1]; put('P10-00', 'royal_throne', sx - R.byId['P10-00'].lx * N, sy - R.byId['P10-00'].ly * N, { face: Math.round(Math.atan2(-d[0], d[1]) * 180 / Math.PI + 360) % 360 }); });
    for (const lx of [3, 4, 6, 7]) put('P10-00', 'royal_throne', lx, 0 + (lx === 3 || lx === 7 ? 3 : 2), { face: 180 }); put('P10-00', 'brazier', 5, 4); }
  native('P10-02', 'angel', 5, 4, 90, sayOf(O_OLYMPUS, 'angel'));
  for (const lx of [1, 11]) for (const ly of [0, 9]) put('P10-01', 'greek_column', lx, ly, {});   // THE STADIUM: the track, its four turning posts, the lanes
  { const p = R.byId['P10-01']; for (let i = 1; i < 5; i++) R.marks.push({ k: 'line', x0: gx(p.lx * N + 2), z0: r2(gz(p.ly * N) + i * 7), x1: gx(p.lx * N + 11), z1: r2(gz(p.ly * N) + i * 7), w: 0.14, color: 0xf4f0e4 }); }
  native('P10-01', 'cyclops', 3, 2, 120, sayOf(O_OLYMPUS, 'cyclops')); native('P10-01', 'minotaur', 9, 7, 300);
  for (const ly of [3, 4, 7, 8, 9]) for (const lx of [3, 9]) put('P11-01', 'greek_column', lx, ly, {});   // THE COLONNADE: two rows of columns
  put('P11-01', 'fountain', 6, 6); put('P10-02', 'angel_statue', 3, 3, { face: 180 }); put('P10-02', 'brazier', 6, 5);
  put('P11-02', 'lectern', 5, 6, { face: 0 }); dec('P11-02', 'instrument_harp', 3, 5); dec('P11-02', 'instrument_drum', 7, 5); native('P11-02', 'chosen one', 6, 8, 0);
  put('P12-02', 'fountain', 4, 5); dec('P12-02', 'greek_amphora', 2, 4); dec('P12-02', 'stone_urn', 6, 4); native('P12-02', 'orb of light', 3, 7, 200);
  for (const d of [[3, 3], [6, 4], [4, 6], [7, 7], [3, 8]]) tree('P10-03', 'tree_2', 4.2, d[0], d[1], 0.6); dec('P10-03', 'stone_urn', 5, 5);   // THE OLIVE GROVE
  put('P11-03', 'lion_statue', 3, 6, { face: 180 }); put('P11-03', 'lion_statue', 6, 6, { face: 180 }); put('P11-03', 'brazier', 2, 8); dec('P12-03', 'cave_stone', 6, 5);
  { const q = S('P11-02', 8, 4); R.bayOlympus = { x: mx(q[0]), z: mz(q[1]), face: 270 }; R.taken.add(q[0] + ':' + q[1]); }   // the Diplomatic bay's door stands at the Amphitheatre
  R.out = WAY;
}


/* ════════════════════════════════════════════════ THE HOLLYWOOD HILLS (plan room 2, 13 x 3 plots) ════════════════════════════════════════════════
   mondo 11-15: "The disaster city version of the Hollywood sign needs to be part of the mountains, not just a weenie on the edge of the map ...
   include the fake weenie mountains as part of this actual mountain plan"; his OK on plan 2 ("build it"). The dry east end of the range, straight
   above Disaster City: the ridge (row 0), the letters DISASTER CITY on their slope (row 1), the canyon foot over the city (row 2), and sea cliffs
   at the east end over the north end of the city's beach. Base level 2: the Cove's sand is at 0 m, the sea at -0.6. */
const HL = makeRoom({ id: HILLS, tag: 'hills', room: 1, px0: 0, py0: 0, pw: 13, ph: 3, base: 2, seed: 39, rockCap: 16, seaBed: -4.2, seaShore: -1.4, deadLevel: () => 10, trail: () => 'p',
    carves: [7, 8, 9, 10, 11].flatMap(lx => [['H07-02', lx, 8, 'Y'], ['H07-02', lx, 9, 'Y']])
        .concat([1, 2, 3].flatMap(ly => [['H10-00', 4, ly, 'f'], ['H10-00', 7, ly, 'f']]), [2, 3].flatMap(ly => [['H05-00', 5, ly, 'f'], ['H05-00', 6, ly, 'f']])) });   // (the tank's and the mast's pads are concrete, not rooms)   // the canyon road runs on east through the spur (the drawing stopped it at the rock)
{ const R = HL, { put, dec, tree, building, look, S, door, mx, mz, gx, gz, props, feat } = R;
  /* ── THE WAYS ── */
  door('shasta', 'H00-01', 'w', Object.assign({ way: 'road', action: { room: MTN, at: 'hills' } }, DOORWORDS('MOUNT SHASTA', 'THE SHASTA ROAD · WEST INTO THE SNOW', 'The road climbs west out of the brush. Somewhere past the cattle grid it stops being dry.')));
  door('ridge', 'H00-00', 'w', Object.assign({ way: 'trail', action: { room: MTN, at: 'saddle' } }, DOORWORDS('MOUNT SHASTA', 'THE SADDLE · THE GLACIER SIDE', 'The crest trail runs west onto the ice. The volcano is closer than it has any right to be.')));
  R.out = { road: R.spur('H07-02', 's', 'Y'), cove: R.spur('H12-02', 's', 'D') };
  const flat = (id, lx0, ly0, lx1, ly1) => { const a = S(id, lx0, ly0); R.flats.push([a[0], a[1], a[0] + lx1 - lx0, a[1] + ly1 - ly0, 'S']); };   // level ground (the reservoir, a car park)

  /* ── THE SIGN: twelve letters, each a standing plane cut from the typeface (the city's own sign's font), two legs behind it; you walk under and behind them ── */
  { const WORD = 'DISASTERCITY', LW = 9.4, LH = 13.6, STEEL = U('MetalWallRibbed1a');
    ['H06-01', 'H07-01', 'H08-01', 'H09-01'].forEach((id, pi) => [2, 6, 10].forEach((lx, li) => { const ch = WORD[pi * 3 + li], q = S(id, lx, 5), n = pi * 3 + li, lift = [0, 0, 0, 0, 0, 0, 0, 0, -1.2, 0, 0, -2.2][n], tilt = [0, 0, 5, 0, 0, 0, -4, 0, 0, 0, 0, 7][n];
        look('sign' + n, gx(q[0]), gz(q[1]), a => { a.quad(0, 1.2 + lift, 0, LW, LH, 'txt:' + ch + '|#f6f4ec||' + r2(LW / LH) + '||anton', null, Object.assign({ uv: 'fit', kind: 'over', ds: true }, tilt ? { rz: tilt } : {}));
            for (const sx of [-1, 1]) { a.box(sx * 2.6, 0, -0.9, 0.36, 10.5 + lift, 0.36, STEEL, 0x8a8e94); a.box(sx * 2.6, 6 + lift, -0.45, 0.2, 0.2, 0.9, STEEL, 0x8a8e94); }
            a.box(0, 3.2 + lift, -0.9, 5.6, 0.2, 0.2, STEEL, 0x8a8e94); });
        for (const d of [-1, 0]) R.taken.add((q[0] + d) + ':' + q[1]); })); }

  /* ── THE BUILDINGS (plain labels of the plan: mondo "fine for now") ── */
  const STUCCO = U('PlasterWallStucco1a'), WHITE = 0xf2efe6, DARKW = 0x3a2a20, DGLASS = 0x20303a;
  /* THE OBSERVATORY: white, a copper dome on a drum, two small domes on its wings */
  const OBS = building('observatory', 'H10-01', [3, 3, 9, 7, 'S'], 6, { leafDouble: true, keyIn: 'marble_light', floorIn: 'marble_light' }, (a, w, d, dr) => {
      a.shell(w, 6, d, 'marble_light', WHITE, dr); a.box(0, 6, 0, w + 0.8, 0.5, d + 0.8, 'marble_light', 0xe6e2d6, { roof: true, under: true });
      a.cyl(0, 6.5, 0, 4.6, 2.2, 'marble_light', WHITE, { seg: 20, roof: true }); a.dome(0, 8.7, 0, 4.8, 4.2, U('MetalWallRibbed1a'), 0x5a8a78, { roof: true });
      for (const sx of [-1, 1]) { a.cyl(sx * (w / 2 - 2.6), 6.5, 0, 2.0, 1.2, 'marble_light', WHITE, { seg: 14, roof: true }); a.dome(sx * (w / 2 - 2.6), 7.7, 0, 2.1, 1.9, U('MetalWallRibbed1a'), 0x5a8a78, { roof: true }); }
      for (let x = -w / 2 + 0.3; x <= w / 2 - 0.2; x += (w - 0.6) / 6) { if (Math.abs(x - dr.lx) < 1.2) continue; a.box(x, 0, d / 2 + 0.12, 0.6, 6, 0.24, 'marble_light', 0xe6e2d6); }
      a.sign('OBSERVATORY', 0, 4.4, d / 2 + 0.3, 9, 1.0, '#2a2a30', '', 'anton', { kind: 'over' }); });
  OBS.put('brass_telescope', 0, -1.5); OBS.put('brass_orrery', -6.5, -3.5); OBS.put('telescope', 6.5, -3.5, { face: 200 }); OBS.put('globe_lamp', -8.5, 4.5); OBS.put('lectern', 3, 3.5, { face: 180 }); OBS.put('iron_garden_bench', -4, 5.2, { face: 0 });
  /* THE HILL HOUSE: one storey, a flat roof that sails out over a wall of dark glass */
  const HOUSE = building('hillhouse', 'H04-02', [7, 3, 11, 5, 'S'], 3.5, { keyIn: STUCCO, floorIn: FLR }, (a, w, d, dr) => {
      a.shell(w, 3.5, d, STUCCO, WHITE, dr); a.box(0, 3.5, 0.9, w + 2.6, 0.3, d + 3.4, WD2, DARKW, { roof: true, under: true });
      for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; a.box(x, 0.3, d / 2 + 0.06, 2.9, 2.9, 0.08, GLS, DGLASS, { glow: 0.15 }); }
      a.box(-w / 2 - 0.6, 0, 0.9, 0.4, 3.5, d + 2.2, 'rocks_5', 0x9a9088); });
  HOUSE.put('psx_sofa_3', -3.5, -2.2, { face: 0 }); HOUSE.put('psx_tv_table_1', -3.5, 1.6, { face: 180 }); HOUSE.put('tube_tv', -3.5, 1.6, { y: 0.6, face: 180 }); HOUSE.put('psx_bed_1', 4.6, -1.6, { face: 0 }); HOUSE.put('retro_radio', 6.2, 1.8, { y: 0 });
  /* THE STILT HOUSE: timber, a deck out over the drop */
  const STILT = building('stilthouse', 'H09-02', [3, 3, 9, 8, 'S'], 3.5, { keyIn: WD, floorIn: FLR }, (a, w, d, dr) => {
      a.shell(w, 3.5, d, WD, 0xb8946a, dr, [3.5, 1.75]); a.box(0, 3.5, 0.6, w + 1.6, 0.3, d + 2.4, WD2, DARKW, { roof: true, under: true });
      for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; a.box(x, 0.6, d / 2 + 0.06, 2.6, 2.4, 0.08, GLS, DGLASS, { glow: 0.15 }); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (w / 2 - 0.3), -6, sz * (d / 2 - 0.3), 0.4, 6, 0.4, WD2, DARKW); });
  STILT.put('curved_sofa', -5, -4.5, { face: 0 }); STILT.put('coffee_table', -5, -2.2); STILT.put('decor_piano', 6, -5.5, { face: 300 }); STILT.put('couples_bed', 6.5, 4.5, { face: 270 }); STILT.put('rug_round', -5, -2.2, { y: 0.17 }); STILT.put('retro_radio', -9, 6);

  /* ── THE RIDGE (row 0) ── */
  put('H00-00', 'signpost', 4, 4, { face: 90 }); dec('H00-00', 'cave_stone', 7, 7); dec('H01-00', 'fallen_log', 2, 8); dec('H01-00', 'dead_snag', 9, 9);
  dec('H02-00', 'dead_snag', 3, 9); dec('H02-00', 'stump', 4, 8); dec('H02-00', 'dead_snag', 8, 9); put('H03-00', 'ocean_rock_4', 3, 8); put('H03-00', 'ocean_rock_6', 8, 9);
  put('H04-00', 'telescope', 6, 2, { face: 180 }); put('H04-00', 'park_bench', 7, 3, { face: 180 });
  { const q = S('H05-00', 6, 3); look('mast', gx(q[0]), gz(q[1]), a => { const ST = U('MetalWallRibbed1a');   // THE RADIO MAST: a red and white lattice with a light on top
        for (let i = 0; i < 6; i++) a.box(0, i * 5, 0, 0.9 - i * 0.1, 5, 0.9 - i * 0.1, ST, i % 2 ? 0xf0f0f0 : 0xc83030); for (const y of [9, 19, 27]) a.box(0, y, 0, 3.2, 0.14, 0.14, ST, 0x8a8e94);
        a.box(0, 30, 0, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1 }); a.box(0, 0, 0, 3.4, 0.5, 3.4, 'rocks_5', 0x9a9aa0); });
    for (const d of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) R.taken.add((q[0] + d[0]) + ':' + (q[1] + d[1])); }
  put('H06-00', 'park_bench', 5, 7, { face: 180 }); dec('H07-00', 'cave_stone', 8, 8); put('H08-00', 'signpost', 5, 3, { face: 180 }); dec('H08-00', 'eagle', 7, 2, { y: 0.02 }); dec('H09-00', 'cave_stone', 4, 8);
  put('H10-00', 'water_tower_west', 4, 2); put('H11-00', 'telescope', 8, 4, { face: 180 }); put('H11-00', 'park_bench', 7, 7, { face: 180 });

  /* ── THE LETTERS' SLOPE (row 1) ── */
  put('H00-01', 'signpost', 2, 4, { face: 90 });
  /* THE RESERVOIR + THE DAM: level water behind a concrete wall walk */
  flat('H01-01', 2, 0, 5, 4); { const a = S('H01-01', 2, 0); feat({ k: 'pool', x: gx(a[0] + 1.5), z: gz(a[1] + 2), r: 5.0, rz: 6.6, y: -0.3, depth: 1.2, key: 'water', bank: 0.6 }); }
  { const a = S('H01-01', 7, 0); R.flats.push([a[0], a[1], a[0] + 10, a[1] + 4, 'S']); feat({ k: 'pool', x: gx(a[0] + 4), z: gz(a[1] + 2), r: 13.6, rz: 6.6, y: -0.3, depth: 1.6, key: 'water', bank: 0.6 });
    const d = S('H02-01', 5, 0); feat({ k: 'rail', x0: r2(gx(d[0]) + 0.2), z0: gz(d[1]), x1: r2(gx(d[0]) + 0.2), z1: gz(d[1] + 4), model: 'pipe' }); }
  put('H04-01', 'car_truck', 7, 3, { face: 90 }); dec('H04-01', 'traffic_cone', 3, 3); dec('H04-01', 'traffic_cone', 4, 4); put('H05-01', 'horse_brown', 5, 10, { face: 90 }); put('H05-01', 'horse', 8, 10, { face: 250 });
  put('H10-01', 'telescope', 8, 8, { face: 180 }); put('H10-01', 'city_bench', 3, 8, { face: 180 });
  flat('H11-01', 6, 6, 11, 11); put('H11-01', 'telescope', 9, 7, { face: 180 }); put('H11-01', 'city_bench', 8, 9, { face: 180 }); put('H11-01', 'car_cadillac', 7, 7, { face: 90 });

  /* ── THE CANYON FOOT (row 2) ── */
  dec('H00-02', 'cave_stone', 7, 3); dec('H01-02', 'stump', 8, 8); dec('H03-02', 'traffic_cone', 3, 9);
  put('H04-02', 'mailbox_bank', 6, 7); put('H04-02', 'car_suv', 2, 7, { face: 90 }); tree('H04-02', 'palm', 9, 6, 2); tree('H04-02', 'palm', 8, 11, 8);
  dec('H05-02', 'traffic_cone', 9, 7);
  flat('H06-02', 2, 3, 10, 8); put('H06-02', 'car_pack_1', 3, 4); put('H06-02', 'car_pack_3', 5, 4); put('H06-02', 'car_taxi', 8, 4); put('H06-02', 'signpost', 4, 2, { face: 180 }); put('H06-02', 'trash_bin', 9, 2);
  put('H07-02', 'signpost', 4, 10, { face: 180 }); tree('H09-02', 'palm', 9, 1, 4); tree('H09-02', 'palm', 9, 10, 4); put('H09-02', 'pool_umbrella', 10, 7); put('H09-02', 'pool_lounger', 10, 8, { face: 180 });
  put('H10-02', 'signpost', 4, 7, { face: 0 }); put('H11-02', 'signpost', 7, 7, { face: 90 });
  put('H12-02', 'rowboat', 1, 9, { face: 70 }); put('H12-02', 'pool_umbrella', 2, 8); tree('H12-02', 'palm', 8, 0, 8); dec('H12-02', 'ocean_rock', 3, 10);
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
const block = ["        /* MOUNTAINS-BEGIN — THE MOUNTAINS ON PLOTS (2026-11-15): written by `node bake-mountains.js` from docs/areas/mountains/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */"]
    .concat(mBlock, pBlock, hBlock, ["        /* MOUNTAINS-END */"]).join('\n') + '\n';
/* the ends this tool owns: the links that lead into the two rooms, and the three bay doors of DOOR HQ */
const LINKS = {
    northpole_camelot: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 's', x: " + NP.out.SLEIGH + ", sub: 'THE SLEIGH ROAD · TO CAMELOT' }"],
    northpole_haunted: ['a', "{ site: 'prebuilt_northpole', part: 'plots', wall: 'free', x: " + NP.hearth.x + ", z: " + NP.hearth.z + ", face: " + NP.hearth.face + " }"],
    shasta_lemuria: ['a', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'free', x: " + M.lemuria.x + ", z: " + M.lemuria.z + ", face: " + M.lemuria.face + ", sub: 'LEMURIA · THE ADIT UNDER THE MOUNTAIN' }"],
    heaven_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'n', x: " + M.out.heaven + ", sub: 'THE GRAND STAIR · UP INTO HEAVEN' }"],
    lodge_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 'free', x: " + M.painting.x + ", z: " + M.painting.z + ", face: " + M.painting.face + " }"],
    vatican_olympus: ['b', "{ site: 'prebuilt_shasta', part: 'mountains', wall: 's', x: " + M.out.vatican + ", sub: 'THE PILGRIM STAIR · DOWN TO THE VATICAN' }"],
    downtown_mountains: ['b', "{ site: 'prebuilt_shasta', part: 'hills', wall: 's', x: " + HL.out.road + ", sub: 'THE CANYON ROAD · DOWN TO DISASTER CITY' }"],   // (plan 2: the city's mountain road lands under the sign now)
    downtown_cove: ['b', "{ site: 'prebuilt_shasta', part: 'hills', wall: 's', x: " + HL.out.cove + ", sub: 'THE COVE · SOUTH ALONG THE BEACH' }"],
};
const ENTRY = {
    prebuilt_shasta: "{ room: '" + MTN + "', door: { id: 'bay', wall: 'free', x: " + M.bayShasta.x + ", z: " + M.bayShasta.z + ", face: " + M.bayShasta.face + " } }",
    prebuilt_olympus: "{ room: '" + MTN + "', door: { id: 'bay_olympus', wall: 'free', x: " + M.bayOlympus.x + ", z: " + M.bayOlympus.z + ", face: " + M.bayOlympus.face + " } }",
    prebuilt_northpole: "{ room: '" + POLE + "', door: { id: 'bay', wall: 's', x: " + NP.out.BAY + " } }",
};
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
