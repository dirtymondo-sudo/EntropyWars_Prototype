/* DISASTER CITY · THE HOLLYWOOD HILLS (district N, 39 plots NORTH of the plot grid, in the city's own room `site_prebuilt_downtown_streets`)
   mondo 2026-11-16: "we need to go ahead and just make Hollywood hills a part of disaster city. the whole point is to be able to look over the city".
   Until that day the Hills were their own room (`site_prebuilt_shasta_hills`, district H of bake-mountains.js). Everything that stood there stands
   here, in the same squares: the sign, the Observatory, the Hill House, the Stilt House, the mast, the tank, the reservoir, the Cove, the trees.
   Rules + notes: docs/notes/areas-complexes.md "THE HOLLYWOOD HILLS ARE PART OF DISASTER CITY". After an edit: `node bake-disaster-city.js`, then RULE #1.

   WHERE IT STANDS: 13 x 3 plots on the 36 rows of squares north of the city's north line (`room.north`, bake-disaster-city.js THE ROOM PAST THE PLOTS).
   A Hills square (sx, sy) is the city's square cx = sx, cy = sy - 36: Hills column H00..H11 stands over city plot column 0..11, H12 over the beach
   strip. Metres: x = -252 + 3.5 sx, z = -378 + 3.5 sy. The squares are docs/disaster-city/hills-layout.json (`cells`, `legend`; plot ids H00-00..H12-02).

   THE PLOTS (id, name, level; a level is 1.75 m, level 2 = 0 m; the levels stand 5 over the old room's, so the Hills look down on the city):
     row 0 the ridge:  H00-00 The Saddle · H01-00 The Fire Road · H02-00 The Burn · H03-00 The Boulders · H04-00 The Lookout Rock · H05-00 The Radio Mast
                       H06-00 The Ridge Trail · H07-00 Behind the Letters, west · H08-00 The Peak · H09-00 Behind the Letters, east · H10-00 The Water Tank
                       H11-00 The Headland · H12-00 The Sea Cliff
     row 1 the slope:  H00-01 The Shasta Road · H01-01 The Reservoir · H02-01 The Dam · H03-01 The Oak Canyon · H04-01 The Old Quarry · H05-01 The Horse Trail
                       H06-01..H09-01 The Sign (D I S · A S T · E R C · I T Y) · H10-01 The Observatory · H11-01 The Coast Overlook · H12-01 The Cliffs
     row 2 the foot:   H00-02 The Dry Wash · H01-02 The Chaparral · H02-02 The Gully · H03-02 The Fire Break · H04-02 The Hill House · H05-02 The Hairpin
                       H06-02 The Hikers' Lot · H07-02 The Canyon Road · H08-02 The Brush (the canyon mouth: the city's mountain road comes in here)
                       H09-02 The Stilt House · H10-02 The Observatory Drive · H11-02 The Cliff Stair · H12-02 The Cove (the boardwalk's north end)

   THE WAYS: up from the city on foot or on wheels, no door: THE MOUNTAIN ROAD (the Casino court's north gate, city squares cx 100..103) runs straight on
   into The Brush and climbs west to the Canyon Road; THE BOARDWALK's north end runs on into the Cove. Out to the Mountains: doors `shasta` (H00-01, the
   Shasta Road) and `ridge` (H00-00, the Saddle) on the west side, to the Mountains room's `hills` and `saddle`.

   THE GROUND: its heights are this file's (`north()`: the plot levels blended, the rock rising away from the walked squares, the sea column sunk);
   on the city's line every square takes the city's own height there, so the hill rises out of the city's back edge. Its sheets are its own ground
   zone (`room.zone`: dry grass, rock cliffs, dirt trails; three-renderer.js THE GROUND ZONES), not the city's asphalt and concrete.
   ROCK IS NOT A WALL HERE: the city's ground is all open (gen.allOpen), so only a face steeper than the walker climbs stops him.

   KNOWN MISSING OR WRONG
   - Nobody lives here (mondo: "don't worry about it yet"). No encounter table. No street lamps, no traffic on the canyon road
   - The three buildings are plain boxes by the city's standard ("each one unique, purposeful and recognizable"; his word on them: "fine for now")

   THE HOOKS: `apply` / `build` below are the old district file's own, word for word (S(plotId, lx, ly) = a square of a plot, 0..11, x east, y south;
   put = a blocker on a square's middle, dec = decor, jittered; tree; building (walk-in); look (an `arch` parts list); feat (any terrain row); flat). */
'use strict';
const fs = require('fs'), path = require('path');
const LAY = JSON.parse(fs.readFileSync(path.join(__dirname, '../hills-layout.json'), 'utf8'));
const N = 12, C = 3.5, LEVEL = 1.75, PW = LAY.cols, PH = LAY.rows, W = PW * N, H = PH * N, X0 = -252, Z0 = -252 - H * C;
const SEED = 39, ROCK_CAP = 16, SEA_BED = -4.2, SEA_SHORE = -1.9, SEA_FALL = 10, SHELF = -1.05, DEEP = -3.6;   // (the city's sea stands at -1.45, its sand shelf at -1.05: districts/B.js)
const MASS = { r: 1, t: 1, z: 1 };
const r2 = v => Math.round(v * 100) / 100;
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a');
const ROT = { S: 0, W: 90, N: 180, E: 270 }, DOORWORDS = (label, sub, desc) => ({ label, sub, desc });
const smooth = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const hash = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), tx = smooth(x - ix), ty = smooth(y - iy);
    return (hash(ix, iy, s) * (1 - tx) + hash(ix + 1, iy, s) * tx) * (1 - ty) + (hash(ix, iy + 1, s) * (1 - tx) + hash(ix + 1, iy + 1, s) * tx) * ty; };
const MTN = 'site_prebuilt_shasta_mountains';

/* the room past the plots (bake-disaster-city.js THE ROOM PAST THE PLOTS): 36 rows of squares north of the city, and the sheets their ground wears */
exports.room = { north: H, zone: { floor: 'grass_rocky', cliff: 'rocks_5', path: 'dirt_2', pal: ['rocks_5', 'dirt_2', 'urban:RoadGeneric1a', 'urban:ConcreteSlab2a', 'marble_light', 'desert', 'obsidian', 'grass_2'] } };
/* (the roads: the old room painted them in the roof bitumen sheet; seen on screen beside the city's own road that was a pale band across the mountain road at the
   city's line, so the Hills' roads wear the city's asphalt sheet now: one road from the Casino court to the canyon) */
const PAINT = { r: 'rocks_5', p: 'dirt_2', Y: 'urban:RoadGeneric1a', f: 'urban:ConcreteSlab2a', B: 'urban:ConcreteSlab2a', m: 'marble_light', D: 'desert', z: 'desert', w: 'desert', h: 'obsidian', t: 'grass_2' };

/* ══ the district's own board: its squares, and the helpers the old room's tool handed its district file (bake-mountains.js makeRoom, the same arithmetic) ══ */
let R = null;
function board(ctx) {
    const gx = c => r2(X0 + c * C), gz = r => r2(Z0 + r * C), mx = c => r2(X0 + (c + 0.5) * C), mz = r => r2(Z0 + (r + 0.5) * C);
    const cell = LAY.cells.map(r => r.split(''));
    const plots = LAY.plots.map(p => Object.assign({}, p, { lx: +p.id.slice(1, 3), ly: +p.id.slice(4, 6) }));
    const byId = {}, byXY = {}; plots.forEach(p => { byId[p.id] = p; byXY[p.lx + ':' + p.ly] = p; });
    const props = ctx.props, ARCH = [], flats = [], taken = new Set(), bad = [], hollow = [];
    const feat = f => { ctx.features.push(f); return f; };
    let v = SEED; const rnd = () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; };
    const inR = (x, y) => x >= 0 && y >= 0 && x < W && y < H, open = (x, y) => inR(x, y) && !MASS[cell[y][x]];
    const S = (id, lx, ly) => { const p = byId[id]; if (!p) throw new Error('the Hills: no plot ' + id); return [p.lx * N + lx, p.ly * N + ly]; };
    const set = (id, lx, ly, ch) => { const q = S(id, lx, ly); cell[q[1]][q[0]] = ch; };
    /* the old tool's own cuts: the canyon road runs on east through the spur; the tank's and the mast's pads are concrete */
    [7, 8, 9, 10, 11].forEach(lx => { set('H07-02', lx, 8, 'Y'); set('H07-02', lx, 9, 'Y'); });
    [1, 2, 3].forEach(ly => { set('H10-00', 4, ly, 'f'); set('H10-00', 7, ly, 'f'); }); [2, 3].forEach(ly => { set('H05-00', 5, ly, 'f'); set('H05-00', 6, ly, 'f'); });
    /* THE MOUNTAIN ROAD: the city's own road squares on its north line (the Casino court's gate) run straight on into The Brush, as wide as they are, up to the canyon road */
    const road = []; for (let cx = 8 * N; cx < 9 * N; cx++) if (ctx.cellAt(cx, 0) === 'R') road.push(cx);
    if (!road.length) throw new Error('the Hills: the city has no road square on its north line under H08-02 (move.js ways P08-04 N)');
    road.forEach(cx => { for (let sy = 2 * N + 8; sy < H; sy++) cell[sy][cx] = 'Y'; });
    /* the old tool's trails: two plots the plan joins meet on open squares (where the drawing left rock between them a trail is cut, two wide),
       and a way out is carried from the plot's nearest open square straight to the room's side (bake-mountains.js makeRoom THE PORTS / spur) */
    const plotAt = (sx, sy) => byXY[Math.floor(sx / N) + ':' + Math.floor(sy / N)] || null;
    const carve = (x, y, ch) => { if (inR(x, y) && (cell[y][x] === 'r' || cell[y][x] === 't')) cell[y][x] = ch || 'p'; };
    const carve2 = (x, y, vert, ch) => { carve(x, y, ch); if (vert) carve(x + 1, y, ch); else carve(x, y + 1, ch); };
    const run = (x0, y0, x1, y1, ch) => { const vert = x0 === x1, n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) carve2(n ? Math.round(x0 + (x1 - x0) * i / n) : x0, n ? Math.round(y0 + (y1 - y0) * i / n) : y0, vert, ch); };
    const hubOf = p => { let best = null; for (let ly = 1; ly < N - 1; ly++) for (let lx = 1; lx < N - 1; lx++) { if (!open(p.lx * N + lx, p.ly * N + ly)) continue; const d = Math.hypot(lx - 5.5, ly - 5.5); if (!best || d < best[0]) best = [d, lx, ly]; } return best ? [best[1], best[2]] : [5, 5]; };
    { const SIDE = { N: [0, -1, 'S'], S: [0, 1, 'N'], W: [-1, 0, 'E'], E: [1, 0, 'W'] };
      plots.forEach(p => (p.ports || []).forEach(sd => { if (sd !== 'S' && sd !== 'E') return; const q = byXY[(p.lx + SIDE[sd][0]) + ':' + (p.ly + SIDE[sd][1])]; if (!q || (q.ports || []).indexOf(SIDE[sd][2]) < 0) return;
          const x0 = p.lx * N, y0 = p.ly * N; let met = false;
          for (let k = 0; k < N; k++) { if (sd === 'S' ? (open(x0 + k, y0 + N - 1) && open(x0 + k, y0 + N)) : (open(x0 + N - 1, y0 + k) && open(x0 + N, y0 + k))) met = true; }
          if (met) return;
          const hp = hubOf(p), hq = hubOf(q), qx = q.lx * N, qy = q.ly * N;
          if (sd === 'S') { const k = Math.max(1, Math.min(N - 3, hp[0])); run(x0 + hp[0], y0 + hp[1], x0 + k, y0 + hp[1]); run(x0 + k, y0 + hp[1], x0 + k, y0 + N - 1); run(qx + k, qy, qx + k, qy + hq[1]); run(qx + k, qy + hq[1], qx + hq[0], qy + hq[1]); }
          else { const k = Math.max(1, Math.min(N - 3, hp[1])); run(x0 + hp[0], y0 + hp[1], x0 + hp[0], y0 + k); run(x0 + hp[0], y0 + k, x0 + N - 1, y0 + k); run(qx, qy + k, qx + hq[0], qy + k); run(qx + hq[0], qy + k, qx + hq[0], qy + hq[1]); } })); }
    function spur(id, wall, ch) { const p = byId[id], x0 = p.lx * N, y0 = p.ly * N; let best = null;
        for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) { if (!open(x0 + lx, y0 + ly)) continue; const d = wall === 'w' ? lx : N - 1 - ly; if (!best || d < best[0]) best = [d, lx, ly]; }
        if (!best) throw new Error('the Hills: no open square on ' + id);
        const lx = Math.min(best[1], N - 2), ly = Math.min(best[2], N - 2);
        if (wall === 'w') run(x0, y0 + ly, x0 + best[1], y0 + ly, ch); if (wall === 's') run(x0 + lx, y0 + best[2], x0 + lx, y0 + N - 1, ch);
        return wall === 'w' ? gz(y0 + ly + 1) : gx(x0 + lx + 1); }
    const out = { shasta: spur('H00-01', 'w'), ridge: spur('H00-00', 'w'), cove: spur('H12-02', 's', 'D') };   // the two ways west to the Mountains; THE COVE's sand down to the boardwalk's north end
    const free = (sx, sy, what) => { if (!open(sx, sy) || cell[sy][sx] === 'B' || taken.has(sx + ':' + sy)) { bad.push(what + ' @ ' + sx + ',' + sy + ' (' + (inR(sx, sy) ? cell[sy][sx] : 'out') + ')'); return false; } return true; };
    const put = (id, key, lx, ly, q) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, key)) return; taken.add(sx + ':' + sy); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, q || {})); };
    const dec = (id, key, lx, ly, q) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, key)) return; props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, q || {})); };
    const tree = (id, kind, h, lx, ly, r) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, kind)) return; taken.add(sx + ':' + sy); feat({ k: 'tree', x: mx(sx), z: mz(sy), kind, h, r: r || 0.8, keep: true }); };
    const native = (id, race, lx, ly, face, say) => { const [sx, sy] = S(id, lx, ly); if (!free(sx, sy, race)) return; taken.add(sx + ':' + sy); const n = { x: mx(sx), z: mz(sy), face: face || 0, race }; if (say) n.say = say; ctx.npcSpots.push(n); };
    function sheet() { const P = [];
        const add = (q, key, tint, x) => { if (key) q.key = key; if (tint != null) q.tint = tint; if (x) Object.assign(q, x); if (/GlassWindow/.test(key || '') && q.glow == null) q.glow = 0.3; P.push(q); return q; };
        const A = { P,
            box: (x, y, z, w, h, d, key, tint, q) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, q),
            cyl: (x, y, z, r, h, key, tint, q) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, q),
            dome: (x, y, z, r, h, key, tint, q) => add({ s: 'dome', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, q),
            quad: (x, y, z, w, h, key, tint, q) => add({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h)] }, key, tint, q),
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
        for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) { if (MASS[cell[y][x]]) cell[y][x] = 'B'; taken.add(x + ':' + y); hollow.push([x, y]); }
        const row = Object.assign({ k: 'texbuilding', id: 'hills:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, opt || {});
        Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
        feat(row); flats.push([sx0, sy0, sx1, sy1, side]);
        const a = sheet(), dr = texbDoor(fw, row.door); parts(a, fw, fd, dr);
        ARCH.push({ k: 'arch', id: 'hills:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
        const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
        const B = { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door: dr, cx, cz, rot };
        B.put = (key, lx, lz, q2) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, q2 || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame (180 = looking out of its front)
        return B; }
    const look = (id, sx, sy, fn) => { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'hills:' + id, x: r2(sx), z: r2(sy), rot: 0, parts: a.P }); };   // a free-standing look (no collision) at a metre spot
    const flat = (id, lx0, ly0, lx1, ly1) => { const a = S(id, lx0, ly0); flats.push([a[0], a[1], a[0] + lx1 - lx0, a[1] + ly1 - ly0, 'S']); };   // level ground (the reservoir, a car park)
    return { gx, gz, mx, mz, cell, plots, byId, byXY, props, ARCH, flats, taken, bad, hollow, feat, rnd, open, inR, S, put, dec, tree, native, building, look, flat, road, out, N, C, r2, U, WD, WD2, SHG, FLR, GLS, ROT, DOORWORDS };
}

/* ══ WHAT STANDS HERE: the old district file's own two hooks, unchanged ══ */


const content = {};
content.apply = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
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
};

content.build = ctx => {
    const R = ctx, { put, dec, tree, native, building, look, flat, cabin, say, S, mx, mz, gx, gz, props, feat, cell, N, C, r2, U, WD, WD2, SHG, FLR, GLS, DOORWORDS } = ctx;
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
};

exports.apply = ctx => { R = board(ctx); content.apply(R); };

exports.build = ctx => {
    content.build(R);
    if (R.bad.length) throw new Error('the Hills: ' + R.bad.length + ' pieces stand on a square that is not free:\n  ' + R.bad.join('\n  '));
    const { gx, gz, mx, mz, cell, S, DOORWORDS } = R;
    /* THE OAKS: the squares the plan drew as trees were the old room's thicket (its generator's tree zones); the city's ground has no thicket, so
       each such square carries one tree of the same kinds and heights (its own random stream: no other piece moves). Trees stand on grass (`t` is painted grass_2) */
    { let v = 3939; const rnd = () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }, KINDS = ['tree_2', 'tree_4', 'tree_2', 'tree']; let n = 0;
      for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) if (cell[sy][sx] === 't') { ctx.features.push({ k: 'tree', x: r2(mx(sx) + (rnd() - 0.5) * 1.2), z: r2(mz(sy) + (rnd() - 0.5) * 1.2), kind: KINDS[Math.floor(rnd() * 4)], h: r2(4.5 + rnd() * 3), r: 0.8, keep: true }); n++; }
      console.warn('[the Hills] oaks ' + n); }
    R.ARCH.forEach(a => ctx.lateRows.push(a));
    /* THE WAYS OUT to the Mountains (the old room's west wall doors, same ids; the Mountains' `hills` and `saddle` doors lead here: bake-mountains.js) */
    ctx.doors.push(Object.assign({ id: 'shasta', wall: 'free', x: r2(gx(0) + 1.75), z: R.out.shasta, face: 270, leaf: null, way: 'road', action: { room: MTN, at: 'hills' } }, DOORWORDS('MOUNT SHASTA', 'THE SHASTA ROAD · WEST INTO THE SNOW', 'The road climbs west out of the brush. Somewhere past the cattle grid it stops being dry.')));
    ctx.doors.push(Object.assign({ id: 'ridge', wall: 'free', x: r2(gx(0) + 1.75), z: R.out.ridge, face: 270, leaf: null, way: 'trail', action: { room: MTN, at: 'saddle' } }, DOORWORDS('MOUNT SHASTA', 'THE SADDLE · THE GLACIER SIDE', 'The crest trail runs west onto the ice. The volcano is closer than it has any right to be.')));
};

/* ══ THE GROUND (asked by bake-disaster-city.js once the city's own ground is known): every Hills square's four corner heights, its sheet, its floor flag.
   q.edge(cx) = [west, east] heights of the city's square (cx, 0) on the north line; q.nx = the room's squares across (the plots + the beach strip).
   The heights are the old room's (bake-mountains.js heights(): the plot levels blended between plot middles, the rock rising with its distance from the
   walked squares, falling to nothing at the sea, the sea column sunk), then THE JOIN: the last row's south corners stand on the city's line at the city's
   own heights (the boardwalk at 0, the sand shelf, the bay), so the hill rises out of the city's back edge with no wall between. ══ */
exports.north = q => {
    const { cell, byXY, flats, inR } = R, LIFT0 = LAY.base;
    const lv = (i, j) => (byXY[Math.max(0, Math.min(PW - 1, i)) + ':' + Math.max(0, Math.min(PH - 1, j))].level - LIFT0) * LEVEL;
    const prof = (i, pz) => { const f = 1 / 3, qz = pz - 0.5, j = Math.max(0, Math.min(PH - 2, Math.floor(qz))), v = Math.min(1, Math.max(0, (qz - j - f / 2) / (1 - f))); return lv(i, j) * (1 - v) + lv(i, j + 1) * v; };
    const base = (cx, cy) => { const px = cx / N - 0.5, i = Math.max(0, Math.min(PW - 2, Math.floor(px))), u = Math.min(1, Math.max(0, (px - i - 1 / 6) / (2 / 3))); return prof(i, cy / N) * (1 - u) + prof(i + 1, cy / N) * u; };
    const dist = is => { const d = new Int16Array(W * H).fill(-1), st = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (is(cell[y][x])) { d[y * W + x] = 0; st.push(x, y); }
        for (let i = 0; i < st.length; i += 2) { const x = st[i], y = st[i + 1], v = d[y * W + x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inR(X, Y) && d[Y * W + X] < 0) { d[Y * W + X] = v + 1; st.push(X, Y); } } }
        return d; };
    const dR = dist(ch => ch !== 'r'), dZ = dist(ch => ch === 'z');
    const Hc = new Float64Array((W + 1) * (H + 1));
    for (let cy = 0; cy <= H; cy++) for (let cx = 0; cx <= W; cx++) {
        let h = base(cx, cy), allR = 1, allZ = 1, anyZ = 0, dmin = 1e9;
        for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = cx + dx, y = cy + dy; if (!inR(x, y)) continue; const ch = cell[y][x];
            if (ch !== 'r') allR = 0; else dmin = Math.min(dmin, dR[y * W + x]); if (ch !== 'z') allZ = 0; else anyZ = 1; }
        if (allR && dmin < 1e9) { const n = vnoise(cx / 5, cy / 5, SEED) * 0.6 + vnoise(cx / 1.7, cy / 1.7, SEED + 7) * 0.4;   // THE ROCK: steep at the trail's edge, then climbing to a broken crest
            const sf = Math.min(1, Math.max(0, (dZ[Math.min(H - 1, cy) * W + Math.min(W - 1, cx)] - 1) / SEA_FALL));
            h += sf * Math.min(ROCK_CAP, 3.1 * Math.min(dmin, 2) + 1.7 * Math.max(0, dmin - 2)) * (0.7 + 0.6 * n); }
        if (allZ) h = SEA_BED; else if (anyZ && !allR) h = Math.min(h, SEA_SHORE);   // THE SEA: its bed; a beach meets it at the shore line (a rock square beside it keeps its height: a cliff)
        Hc[cy * (W + 1) + cx] = h;
    }
    flats.forEach(([x0, y0, x1, y1, side]) => { const fx = side === 'E' ? x1 : side === 'W' ? x0 : (x0 + x1) / 2, fy = side === 'S' ? y1 : side === 'N' ? y0 : (y0 + y1) / 2, ref = base(fx, fy);
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) Hc[cy * (W + 1) + cx] = ref; });
    /* THE COVE'S FOOT: over the boardwalk's end the old ground still came down from the Cliff Stair's level (5 m at the line). East of square 143 the first
       square north of the line lies at the boardwalk's own level and the next three rise no faster than 2 m a square, so the boardwalk walks onto the sand
       and up (walked with the game's own feet rule: a rise that began on the line itself stopped the walker where the city's boardwalk cut ends) */
    for (let cy = H - 4; cy <= H; cy++) for (let cx = 140; cx <= W; cx++) { const k = cy * (W + 1) + cx; Hc[k] = Math.min(Hc[k], 2.0 * Math.max(0, H - 1 - cy) + 2.0 * Math.max(0, 144 - cx)); }   // (eased in over four squares on the west, so the trail from the Cliff Stair comes down onto it)
    /* THE MOUNTAIN ROAD'S FOOT: the road's four squares north of the line climb from the city's height to the canyon road's in one even grade (on the
       last square alone it was a bank steep enough to wear the rock sheet: a pale band across the road, seen on screen) */
    { const r0 = R.road[0], r1 = R.road[R.road.length - 1] + 1, e0 = q.edge(r0)[0];
      for (let cx = r0; cx <= r1; cx++) { const top = Hc[(H - 4) * (W + 1) + cx]; for (let cy = H - 3; cy < H; cy++) Hc[cy * (W + 1) + cx] = e0 + (top - e0) * (H - cy) / 4; } }
    /* THE JOIN: what the city's line stands at under each Hills square */
    const south = cx => cx < 144 ? q.edge(cx) : cx < 146 ? [0, 0] : cx < 152 ? [SHELF, SHELF] : [DEEP, DEEP];
    const flag = new Set(R.hollow.map(c => c[0] + ':' + c[1]));
    const at = (cx, ry) => {   // a square of the north rows (cx across the room, ry 0 = the north edge): { h: [NW, NE, SW, SE], sheet, floor }
        if (cx >= W) return { h: [SEA_BED, SEA_BED, SEA_BED, SEA_BED], sheet: 'desert', floor: 0 };
        const k = ry * (W + 1) + cx, h = [Hc[k], Hc[k + 1], Hc[k + W + 1], Hc[k + W + 2]];
        if (ry === H - 1) { const s = south(cx); h[2] = cx >= 152 ? Math.min(h[2], s[0]) : s[0]; h[3] = cx >= 152 ? Math.min(h[3], s[1]) : s[1]; }
        return { h, sheet: PAINT[cell[ry][cx]] || null, floor: flag.has(cx + ':' + ry) ? 1 : 0 };
    };
    /* the walk check (the old tool's own): from the city's road every plot but the two sea-cliff plots is reached on foot, counting only steps the walker climbs */
    { const hC = (x, y) => { const c = at(x, y).h; return (c[0] + c[1] + c[2] + c[3]) / 4; }, tilt = (x, y) => { const c = at(x, y).h; return Math.max(Math.abs(c[1] - c[0]), Math.abs(c[3] - c[2]), Math.abs(c[2] - c[0]), Math.abs(c[3] - c[1])) / C; },   // (a square's own steepest edge: the walker's maxSlope is 1)
      seen = new Uint8Array(W * H), st = [[R.road[0], H - 1]]; seen[(H - 1) * W + R.road[0]] = 1;
      while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (!R.open(X, Y) || seen[Y * W + X]) continue; if (Math.abs(hC(X, Y) - hC(x, y)) / C > 0.85 || tilt(X, Y) > 0.98) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
      const cold = R.plots.filter(p => { if (p.id === 'H12-00' || p.id === 'H12-01') return false; for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) if (seen[(p.ly * N + ly) * W + p.lx * N + lx]) return false; return true; }).map(p => p.id);
      if (process.env.HILLS_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => R.open(x, y) && !seen[y * W + x] ? '!' : MASS[ch] ? (ch === 't' ? '.' : ' ') : ch).join('')).join('\n'));
      if (cold.length) throw new Error('the Hills: plots not reached on foot from the city\'s road: ' + cold.join(' '));
      let hi = -1e9, lo = 1e9; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = at(x, y).h; hi = Math.max(hi, c[0]); lo = Math.min(lo, c[0]); }
      console.warn('[the Hills] ground ' + JSON.stringify({ lowM: r2(lo), highM: r2(hi), road: R.road, cove: seen[(H - 1) * W + 144] ? 'walked' : 'NOT walked' })); }
    return { rows: H, at };
};
