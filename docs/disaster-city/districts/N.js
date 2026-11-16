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
exports.room = { north: H, zone: { floor: 'grass_rocky', cliff: 'rocks_5', path: 'dirt_2', pal: ['rocks_5', 'dirt_2', 'calm_flagstone', 'urban:ConcreteSlab2a', 'marble_light', 'desert', 'obsidian', 'grass_2'] } };
/* (the roads: the old room painted them in the roof bitumen sheet; seen on screen beside the city's own road that was a pale band across the mountain road at the
   city's line, so the Hills' roads wear the city's asphalt sheet now: one road from the Casino court to the canyon) */
const PAINT = { r: 'rocks_5', p: 'dirt_2',  f: 'urban:ConcreteSlab2a', B: 'urban:ConcreteSlab2a', m: 'marble_light', D: 'desert', z: 'desert', w: 'desert', h: 'obsidian', t: 'grass_2', s: 'calm_flagstone' };

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
            shell(w, h, d, key, tint, dr, uv, ex) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = (uv || ex) ? Object.assign(uv ? { uv } : {}, ex || {}) : null;
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

/* ══ PASS 1 (2026-11-16, mondo's district order: "do each district with all of the interior exterior polish passes"): THE BUILDINGS + THE LANDMARKS as
   real architecture. The three old buildings keep their plots, squares and doors and get a real look; three more houses stand on the foot row, so the
   hillside reads as the Hills from the city's streets (DECISIONS MADE FOR MONDO: areas-complexes.md "THE HOLLYWOOD HILLS, THE FIVE PASSES"). ══ */
const M = 'marble_light', COPPER = 'calm_copper', STL = U('MetalWallRibbed1a'), TILE = U('MetalRoofTiles1a'), CFORM = U('ConcreteWoodFormed1a'), WCL = U('WoodCladding1a'), DECK = U('WoodFlooring1a'), BEAM = U('WoodBeams1a'),
    STUCCO = U('PlasterWallStucco1a'), CORR = U('MetalCorrugated1a'), WHITE = 0xf2efe6, TRIM = 0xe6e2d6, DARKW = 0x3a2a20, DGLASS = 0x20303a, BRONZE = 0x7a6238, CLAY = 0xb5532e, STONE = 0x9a9088, G15 = { gain: 2.0 }, PATINA = 0x63a892;
function hillsKit(ctx) {
    const { feat, S, cell, gx, gz, r2 } = ctx;
    const glass = (a, x, y, z, w, h, ew, g, q) => ew ? a.box(x, y, z, 0.08, h, w, GLS, DGLASS, Object.assign({ glow: g == null ? 0.15 : g }, q || {})) : a.box(x, y, z, w, h, 0.08, GLS, DGLASS, Object.assign({ glow: g == null ? 0.15 : g }, q || {}));
    const block = (x, z, w, d, h) => feat({ k: 'wall', x0: r2(x - w / 2), z0: r2(z), x1: r2(x + w / 2), z1: r2(z), h: h || 2.2, t: d, key: 'urban:ConcreteStriped2a', ghost: true, rail: false });   // a drawn piece's body (the walker stops at it)
    const rail = (x0, z0, x1, z1, model) => feat({ k: 'rail', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), model });
    const paint = (id, lx0, ly0, lx1, ly1, ch) => { for (let ly = ly0; ly < ly1; ly++) for (let lx = lx0; lx < lx1; lx++) { const q = S(id, lx, ly); if ('gpf'.indexOf(cell[q[1]][q[0]]) >= 0) cell[q[1]][q[0]] = ch; } };
    const take = (id, lx0, ly0, lx1, ly1) => { for (let ly = ly0; ly < ly1; ly++) for (let lx = lx0; lx < lx1; lx++) { const q = S(id, lx, ly); ctx.taken.add(q[0] + ':' + q[1]); } };
    const O = id => { const q = S(id, 0, 0); return { x: lx => gx(q[0] + lx), z: ly => gz(q[1] + ly) }; };   // a plot's own lines in metres (lx, ly = square lines, 0..12)
    return { glass, block, rail, paint, take, O };
}
function hillsBuildings(ctx) {
    const R = ctx, { put, dec, tree, building, look, flat, S, mx, mz, gx, gz, props, feat, cell, r2 } = ctx, { glass, block, rail, paint, take, O } = hillsKit(ctx), B = R.B = {};
    /* THE OBSERVATORY (H10-01): white stone on a dark plinth, a copper dome on a windowed drum with a gallery, two small domes on the wings, a columned
       porch, tall dark windows between pilasters. It stands on a level terrace (the plan's marble squares) with a balustrade: the place to look over the city */
    B.obs = building('observatory', 'H10-01', [3, 3, 9, 7, 'S'], 6, { leafDouble: true, leaf: 'leaf_lobby_glass_double', keyIn: M, floorIn: M }, (a, w, d, dr) => {
        a.shell(w, 6, d, M, WHITE, dr, null, G15);
        a.box(0, 0, 0, w + 0.6, 0.8, d + 0.6, 'rocks_5', 0xb0a898, { faces: 'blr', top: false });
        { const xa = dr.lx - dr.cw / 2 - 0.25, xb = dr.lx + dr.cw / 2 + 0.25, e = w / 2 + 0.3; a.box((-e + xa) / 2, 0, d / 2 + 0.17, xa + e, 0.8, 0.34, 'rocks_5', 0xb0a898); a.box((xb + e) / 2, 0, d / 2 + 0.17, e - xb, 0.8, 0.34, 'rocks_5', 0xb0a898); }
        a.box(0, 5.5, 0, w + 0.9, 0.5, d + 0.9, M, TRIM, { top: false, gain: 2.0 }); a.box(0, 6, 0, w + 0.8, 0.5, d + 0.8, M, TRIM, { roof: true, under: true, gain: 2.0 }); a.box(0, 6.5, 0, w - 1.4, 0.45, d - 1.4, M, WHITE, { roof: true, gain: 2.0 });
        a.cyl(0, 6.95, 0, 4.7, 2.3, M, WHITE, { seg: 24, roof: true, gain: 2.0 }); a.box(0, 7.5, 0, 0.8, 1.2, 0.1, GLS, DGLASS, { ring: { n: 14, r: 4.72 }, glow: 0.3, roof: true });
        a.cyl(0, 9.25, 0, 5.4, 0.18, M, TRIM, { seg: 24, ri: 4.5, roof: true, gain: 2.0 }); a.box(0, 9.43, 0, 0.08, 0.9, 0.08, STL, BRONZE, { ring: { n: 24, r: 5.3 }, roof: true }); a.cyl(0, 10.3, 0, 5.36, 0.07, STL, BRONZE, { seg: 24, ri: 5.24, roof: true });
        a.dome(0, 9.25, 0, 4.6, 4.5, STL, PATINA, { roof: true, seg: 24 }); a.cyl(0, 13.7, 0, 0.5, 0.25, STL, BRONZE, { roof: true }); a.cyl(0, 13.95, 0, 0.12, 1.4, STL, BRONZE, { roof: true, r2: 0.03 });
        for (const sx of [-1, 1]) { const x = sx * (w / 2 - 3); a.cyl(x, 6.95, 0, 2.3, 1.3, M, WHITE, { seg: 16, roof: true, gain: 2.0 }); a.dome(x, 8.25, 0, 2.35, 2.1, STL, PATINA, { roof: true }); a.cyl(x, 10.3, 0, 0.08, 0.7, STL, BRONZE, { roof: true }); }
        const bays = 6, bw = (w - 0.6) / bays;
        for (let i = 0; i <= bays; i++) { const x = -w / 2 + 0.3 + i * bw; if (Math.abs(x - dr.lx) < 1.25) continue; a.box(x, 0.8, d / 2 + 0.12, 0.7, 4.7, 0.24, M, TRIM, G15); }
        for (let i = 0; i < bays; i++) { const x = -w / 2 + 0.3 + (i + 0.5) * bw; glass(a, x, 1.3, -d / 2 - 0.07, 1.7, 3.6, false, 0.25); if (Math.abs(x - dr.lx) < 1.9) continue; glass(a, x, 1.3, d / 2 + 0.07, 1.7, 3.6, false, 0.25); a.box(x, 4.9, d / 2 + 0.09, 2.0, 0.14, 0.12, STL, BRONZE); a.box(x, 1.16, d / 2 + 0.09, 2.0, 0.14, 0.14, M, TRIM, G15); }
        for (const s of [-1, 1]) for (const z of [-3.6, 0, 3.6]) glass(a, s * (w / 2 + 0.07), 1.3, z, 1.7, 3.6, true, 0.25);
        const px = dr.lx; for (const o of [-4.4, -1.75, 1.75, 4.4]) { a.cyl(px + o, 0.1, d / 2 + 3.0, 0.42, 5.05, M, WHITE, { seg: 12, gain: 2.0 }); a.box(px + o, 0.1, d / 2 + 3.0, 1.1, 0.3, 1.1, M, TRIM, G15); }
        a.box(px, 0, d / 2 + 1.8, 10.6, 0.1, 3.5, M, TRIM, G15); a.box(px, 5.15, d / 2 + 1.75, 10.8, 0.85, 3.5, M, WHITE, { gain: 2.0, under: true }); a.box(px, 6.0, d / 2 + 1.75, 9.2, 0.4, 2.9, M, TRIM, { gain: 2.0, roof: true });
        a.sign('OBSERVATORY', px, 5.28, d / 2 + 3.53, 8.4, 0.6, '#3a3226', '', 'marc', { kind: 'over' }); });
    flat('H10-01', 2, 2, 10, 10);
    { const o = O('H10-01'), X = o.x(6), Z = o.z(9), q = S('H10-01', 5, 8);   // THE MONUMENT on the terrace's axis: a six-sided shaft, a bronze sphere in a ring
      look('obs_monument', X, Z, a => { a.box(0, 0, 0, 3.0, 0.5, 3.0, M, TRIM, G15); a.box(0, 0.5, 0, 2.2, 0.4, 2.2, M, WHITE, G15); a.cyl(0, 0.9, 0, 0.85, 6.6, M, WHITE, { seg: 6, gain: 2.0, r2: 0.6 }); a.cyl(0, 7.5, 0, 0.8, 0.25, M, TRIM, { seg: 6, gain: 2.0 });
          a.cyl(0, 7.75, 0, 0.1, 0.5, STL, BRONZE); a.dome(0, 8.25, 0, 0.6, 0.6, STL, BRONZE); a.cyl(0, 8.2, 0, 1.0, 0.08, STL, BRONZE, { ri: 0.88, seg: 18 }); });
      block(X, Z, 3, 3); for (const d of [[0, 0], [1, 0], [0, 1], [1, 1]]) R.taken.add((q[0] + d[0]) + ':' + (q[1] + d[1]));
      const i = 0.25; rail(o.x(2) + i, o.z(10) - i, o.x(5), o.z(10) - i, 'balusters_b'); rail(o.x(7), o.z(10) - i, o.x(10) - i, o.z(10) - i, 'balusters_b');
      rail(o.x(2) + i, o.z(2) + i, o.x(2) + i, o.z(8), 'balusters_b'); rail(o.x(10) - i, o.z(2) + i, o.x(10) - i, o.z(8), 'balusters_b'); rail(o.x(2) + i, o.z(2) + i, o.x(5), o.z(2) + i, 'balusters_b'); rail(o.x(7), o.z(2) + i, o.x(10) - i, o.z(2) + i, 'balusters_b'); }

    /* THE HILL HOUSE (H04-02): white stucco under a flat roof that sails out, a raised glass room, a stone wall and chimney, dark glass to the road;
       across the road its pool terrace hangs over the city (flagstone, a round pool, a glass rail) */
    B.house = building('hillhouse', 'H04-02', [7, 3, 11, 5, 'S'], 3.5, { keyIn: STUCCO, floorIn: FLR, leaf: 'leaf_birch_glass' }, (a, w, d, dr) => {
        a.shell(w, 3.5, d, STUCCO, WHITE, dr, null, { gain: 1.9 }); a.box(0, 3.5, 0.9, w + 2.6, 0.3, d + 3.4, BEAM, DARKW, { roof: true, under: true }); a.box(0, 3.46, 0.9, w + 2.7, 0.4, d + 3.5, M, WHITE, { top: false, roof: true, gain: 2.0 });
        a.box(3.0, 3.8, -0.6, 6.4, 1.3, 4.6, STUCCO, WHITE, { gain: 1.9, roof: true, top: false }); glass(a, 3.0, 4.0, 1.74, 6.0, 0.9, false, 0.3, { roof: true }); a.box(3.0, 5.1, -0.3, 7.8, 0.25, 6.4, M, WHITE, { roof: true, under: true, gain: 2.0 });
        for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; glass(a, x, 0.3, d / 2 + 0.07, 2.9, 2.9, false, 0.2); }
        for (const z of [-1.6, 1.6]) glass(a, w / 2 + 0.07, 0.3, z, 2.4, 2.9, true, 0.2); for (const x of [-4.4, 0, 4.4]) glass(a, x, 1.9, -d / 2 - 0.07, 2.8, 1.1, false, 0.2);
        a.box(-w / 2 - 0.6, 0, 0.9, 0.5, 4.4, d + 2.2, 'rocks_5', STONE); a.box(w / 2 - 1.6, 0, -d / 2 - 0.5, 1.8, 6.2, 1.0, 'rocks_5', STONE); a.box(w / 2 - 1.6, 6.2, -d / 2 - 0.5, 2.1, 0.2, 1.3, CFORM, 0xc8c4bc); });
    paint('H04-02', 7, 7, 11, 10, 's');
    { const o = O('H04-02'), X = o.x(9), Z = o.z(8.5);
      feat({ k: 'pool', x: X, z: Z, r: 2.7, rz: 2.7, y: -0.12, depth: 1.2, key: 'water', bank: 0.25 });
      look('hillpool', X, Z, a => { a.cyl(0, 0, 0, 3.15, 0.14, M, WHITE, { seg: 28, ri: 2.7, gain: 2.0 }); });
      const i = 0.2; rail(o.x(7) + i, o.z(10) - i, o.x(11) - i, o.z(10) - i, 'glass'); rail(o.x(7) + i, o.z(7.6), o.x(7) + i, o.z(10) - i, 'glass'); take('H04-02', 8, 8, 10, 9); }

    /* THE STILT HOUSE (H09-02): timber boards under a tin shed roof, a stone chimney, a deck out east with a rail */
    B.stilt = building('stilthouse', 'H09-02', [3, 3, 9, 8, 'S'], 3.5, { keyIn: WCL, floorIn: FLR }, (a, w, d, dr) => {
        a.shell(w, 3.5, d, WCL, 0xc89a6a, dr, null, { gain: 1.3 }); a.box(0, 3.5, 0.6, w + 1.6, 0.3, d + 2.4, BEAM, DARKW, { roof: true, under: true });
        a.P.push({ s: 'roof', form: 'shed', p: [0, 3.8, 0.6], size: [w + 1.6, 1.5, d + 2.4], roof: true, key: CORR, tint: 0x8a9a8a, gain: 1.5 });
        for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - dr.lx) < 1.7) continue; glass(a, x, 0.6, d / 2 + 0.07, 2.6, 2.4, false, 0.2); a.box(x, 0.45, d / 2 + 0.1, 2.9, 0.14, 0.16, BEAM, DARKW); }
        for (const z of [-5.2, -1.7, 1.8, 5.3]) glass(a, w / 2 + 0.07, 0.5, z, 2.6, 2.5, true, 0.2);
        a.box(-w / 2 - 0.55, 0, -2, 1.1, 6.4, 1.9, 'rocks_5', STONE);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (w / 2 - 0.3), -6, sz * (d / 2 - 0.3), 0.4, 6, 0.4, BEAM, DARKW);
        a.box(w / 2 + 5.25, 0.02, 0, 10.5, 0.12, d, DECK, 0xb89068); for (const z of [-d / 2 + 0.3, 0, d / 2 - 0.3]) a.box(w / 2 + 10.2, -6, z, 0.34, 6, 0.34, BEAM, DARKW); });
    { const q = S('H09-02', 3, 3), o = O('H09-02'), i = 0.2; R.flats.push([q[0], q[1], q[0] + 9, q[1] + 5, 'S']);
      rail(o.x(12) - i, o.z(3) + i, o.x(12) - i, o.z(8) - i, 'wood'); rail(o.x(9), o.z(3) + i, o.x(12) - i, o.z(3) + i, 'wood'); rail(o.x(9.6), o.z(8) - i, o.x(12) - i, o.z(8) - i, 'wood'); }

    /* THE ROUND HOUSE (H05-02, new): a drum of concrete and dark glass under a saucer roof */
    B.round = building('roundhouse', 'H05-02', [3, 1, 6, 4, 'S'], 3.4, { keyIn: U('PlasterWallPainted1a'), floorIn: FLR, leaf: 'leaf_glass' }, (a, w, d, dr) => {
        const r = 7.8, A = { seg: 28, arc: 320, a0: 110 };
        a.cyl(0, 0, 0, r, 0.9, CFORM, 0xd8d4cc, Object.assign({ ri: r - 0.3 }, A)); a.cyl(0, 0.9, 0, r - 0.08, 2.0, GLS, DGLASS, Object.assign({ ri: r - 0.2, glow: 0.2 }, A)); a.cyl(0, 2.9, 0, r, 0.5, M, WHITE, Object.assign({ ri: r - 0.3, gain: 2.0 }, A));
        a.box(0, 0.9, 0, 0.14, 2.0, 0.14, M, WHITE, { ring: { n: 16, r: r - 0.04, a0: 110, arc: 320 }, gain: 2.0 });
        const xa = dr.lx - 1.3, xb = dr.lx + 1.3, e = r * Math.sin(20 * Math.PI / 180), zf = r * Math.cos(20 * Math.PI / 180);
        for (const x of [xa, xb]) a.box(x, 0, (d / 2 + zf) / 2 + 0.1, 0.2, 3.0, zf - d / 2 + 0.2, M, WHITE, G15); a.box(dr.lx, 3.0, (d / 2 + zf) / 2 + 0.2, 3.0, 0.2, zf - d / 2 + 0.6, M, WHITE, G15);
        if (xa + e > 0.3) glass(a, (-e + xa) / 2, 0, zf, xa + e, 3.0, false, 0.2); if (e - xb > 0.3) glass(a, (xb + e) / 2, 0, zf, e - xb, 3.0, false, 0.2);
        a.cyl(0, 3.4, 0, r + 1.7, 0.35, M, WHITE, { seg: 28, roof: true, gain: 2.0, ds: true }); a.cyl(0, 3.75, 0, r + 1.1, 1.3, STL, 0xd8d8dc, { seg: 28, r2: 1.7, roof: true }); a.cyl(0, 5.05, 0, 1.7, 0.3, STL, 0x8a8e94, { roof: true, seg: 16 }); a.dome(0, 5.35, 0, 1.2, 0.7, GLS, DGLASS, { roof: true, glow: 0.3 }); });

    /* THE VILLA (H10-02, new): cream stucco, a clay hip roof, a square tower, a loggia to the drive */
    B.villa = building('villa', 'H10-02', [8, 2, 11, 6, 'W'], 4.2, { keyIn: STUCCO, floorIn: U('TileGeneric1a'), leaf: 'leaf_white_wood' }, (a, w, d, dr) => {
        const CREAM = 0xf6efe0, sq = { gain: 1.9 };
        a.shell(w, 4.2, d, STUCCO, CREAM, dr, null, sq); a.P.push({ s: 'box', p: [0, 4.2, 0], size: [w + 1.2, 0.02, d + 1.2], sides: false, top: false, under: true, roof: true, key: BEAM, tint: DARKW }); a.P.push({ s: 'roof', form: 'hip', p: [0, 4.2, 0], size: [w + 1.2, 2.0, d + 1.2], roof: true, key: TILE, tint: CLAY });
        const tx = w / 2 - 1.9, tz = -d / 2 + 1.9; a.box(tx, 4.2, tz, 3.4, 3.4, 3.4, STUCCO, CREAM, { gain: 1.9, roof: true }); a.P.push({ s: 'roof', form: 'pyramid', p: [tx, 7.6, tz], size: [4.3, 1.6, 4.3], roof: true, key: TILE, tint: CLAY });
        for (const [ox, oz, ew] of [[0, 1.72, 0], [0, -1.72, 0], [1.72, 0, 1], [-1.72, 0, 1]]) a.box(tx + ox, 5.5, tz + oz, ew ? 0.06 : 1.0, 1.5, ew ? 1.0 : 0.06, null, 0x1a1410, { roof: true });
        for (const x of [-5.9, -3.4, 3.4, 5.9]) a.cyl(x, 0, d / 2 + 2.3, 0.22, 2.7, M, WHITE, { seg: 10, gain: 2.0 }); a.box(0, 2.7, d / 2 + 2.3, w, 0.4, 0.5, STUCCO, CREAM, sq); a.P.push({ s: 'roof', form: 'shed', p: [0, 3.1, d / 2 + 1.25], size: [w + 0.6, 0.8, 2.7], roof: true, key: TILE, tint: CLAY });
        for (const x of [-4.8, 3.0, 5.4]) { glass(a, x, 1.0, d / 2 + 0.07, 1.2, 1.7, false, 0.25); for (const s of [-1, 1]) a.box(x + s * 0.85, 1.0, d / 2 + 0.08, 0.4, 1.7, 0.08, WCL, 0x3a6a5a); }
        for (const s of [-1, 1]) for (const z of [-2.6, 2.2]) glass(a, s * (w / 2 + 0.07), 1.0, z, 1.2, 1.7, true, 0.25); for (const x of [-4.4, 0, 4.4]) glass(a, x, 1.0, -d / 2 - 0.07, 1.2, 1.7, false, 0.25);
        a.box(-w / 2 + 1.6, 4.2, -1, 0.9, 2.8, 0.9, STUCCO, CREAM, { gain: 1.9, roof: true }); a.box(-w / 2 + 1.6, 7.0, -1, 1.2, 0.18, 1.2, TILE, CLAY, { roof: true }); });

    /* THE A-FRAME (H01-02, new): dark boards, a steep roof to the ridge with a glass gable over the door, a deck */
    B.aframe = building('aframe', 'H01-02', [2, 1, 5, 4, 'S'], 3.0, { keyIn: WCL, floorIn: FLR }, (a, w, d, dr) => {
        a.shell(w, 3.0, d, WCL, 0x9a6a44, dr, null, { gain: 1.3 });
        a.P.push({ s: 'roof', form: 'gable', p: [0, 3.0, 0], size: [d + 0.12, 6.0, w + 1.5], ry: 90, roof: true, key: CORR, tint: 0x9a5a48, gain: 1.5, keyEnd: GLS, tintEnd: 0x3a5a6a });
        a.box(0, 2.86, d / 2 + 0.5, w + 1.5, 0.16, 1.1, BEAM, DARKW, { roof: true }); a.box(0, 3.0, d / 2 + 0.1, 0.2, 6.0, 0.14, BEAM, DARKW, { roof: true });
        for (const x of [-3.6, 2.6]) { if (Math.abs(x - dr.lx) < 1.6) continue; glass(a, x, 0.5, d / 2 + 0.07, 2.2, 2.2, false, 0.2); }
        a.box(0, 0, d / 2 + 1.5, w, 0.12, 2.9, DECK, 0xb89068); a.cyl(3.0, 6.0, -1.5, 0.18, 3.4, STL, 0x2a2a2e, { roof: true, seg: 8 }); });

    /* THE FIRE LOOKOUT (H02-00, new, over the burn): four timber legs, a cab with a glass band, a hip roof; drawn, not climbed */
    { const q = S('H02-00', 8, 8), X = mx(q[0]), Z = mz(q[1]);
      look('firetower', X, Z, a => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * 1.5, 0, sz * 1.5, 0.3, 9, 0.3, BEAM, DARKW);
          for (const y of [3, 6]) { for (const s of [-1, 1]) { a.box(0, y, s * 1.5, 3.3, 0.16, 0.16, BEAM, DARKW); a.box(s * 1.5, y, 0, 0.16, 0.16, 3.3, BEAM, DARKW); } }
          a.box(0, 9, 0, 5.2, 0.2, 5.2, DECK, 0xb89068, { under: true }); a.box(0, 9.2, 0, 3.4, 0.9, 3.4, WCL, 0xe8e2d4, { gain: 1.9 }); a.box(0, 10.1, 0, 3.3, 1.1, 3.3, GLS, DGLASS, { glow: 0.25 }); a.box(0, 11.2, 0, 3.4, 0.3, 3.4, WCL, 0xe8e2d4, { gain: 1.9 });
          a.P.push({ s: 'roof', form: 'pyramid', p: [0, 11.5, 0], size: [4.8, 1.3, 4.8], key: CORR, tint: 0x4a6a52 });
          for (const s of [-1, 1]) { a.box(0, 10.0, s * 2.5, 5.2, 0.08, 0.08, BEAM, DARKW); a.box(s * 2.5, 10.0, 0, 0.08, 0.08, 5.2, BEAM, DARKW); for (const t of [-1, 0, 1]) { a.box(t * 2.5, 9.2, s * 2.5, 0.1, 0.85, 0.1, BEAM, DARKW); a.box(s * 2.5, 9.2, t * 2.5, 0.1, 0.85, 0.1, BEAM, DARKW); } } });
      block(X, Z, 3.4, 3.4); R.taken.add(q[0] + ':' + q[1]); }

    /* THE TRANSMITTER HUT by the radio mast (H05-00) + antenna arms on the mast */
    { const q = S('H05-00', 4, 1), X = mx(q[0]), Z = mz(q[1]);
      look('masthut', X, Z, a => { a.box(0, 0, 0, 3.1, 2.7, 3.1, CFORM, 0xc8c4bc); a.box(0, 2.7, 0, 3.5, 0.2, 3.5, CFORM, 0xa8a49c); a.quad(0, 0, 1.56, 1.0, 2.1, U('DoorPaintedHalf1a'), null, { uv: 'fit' }); a.box(1.0, 1.9, 1.56, 0.6, 0.4, 0.06, STL, 0x8a8e94); a.cyl(-0.9, 2.9, -0.9, 0.5, 0.5, STL, 0x8a8e94, { seg: 10 }); });
      block(X, Z, 3.1, 3.1); R.taken.add(q[0] + ':' + q[1]);
      const m = S('H05-00', 6, 3); look('mastarms', gx(m[0]), gz(m[1]), a => { for (const [y, w2] of [[14, 2.6], [22, 2.0], [26, 1.6]]) { a.box(0, y, 0, w2, 0.1, 0.1, STL, 0xd0d0d4); a.box(0, y, 0, 0.1, 0.1, w2, STL, 0xd0d0d4); for (const s of [-1, 1]) { a.box(s * w2 / 2, y - 0.7, 0, 0.07, 1.5, 0.07, STL, 0xd0d0d4); a.box(0, y - 0.7, s * w2 / 2, 0.07, 1.5, 0.07, STL, 0xd0d0d4); } } a.box(0, 15, 0, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1 }); }); }

    /* THE DAM'S TOWER: a round intake tower in the reservoir, a walk from the dam's crest */
    { const o = O('H02-01'), X = o.x(3.5), Z = o.z(2);
      look('damtower', X, Z, a => { a.cyl(0, 0, 0, 1.5, 5.4, CFORM, 0xc8c4bc, { seg: 14 }); a.cyl(0, 5.4, 0, 1.9, 0.25, CFORM, 0xa8a49c, { seg: 14 }); a.box(0, 3.6, 0, 0.5, 0.9, 0.1, GLS, DGLASS, { ring: { n: 6, r: 1.52 }, glow: 0.2 }); a.P.push({ s: 'roof', form: 'pyramid', p: [0, 5.65, 0], size: [3.0, 0.9, 3.0], key: COPPER, tint: 0x7ab8a0 });
          a.box(3.4, 2.5, 0, 5.4, 0.16, 1.2, CFORM, 0xa8a49c, { under: true }); for (const s of [-1, 1]) a.box(3.4, 3.4, s * 0.55, 5.4, 0.06, 0.06, STL, 0x8a8e94); });
      rail(o.x(7) - 0.2, o.z(0), o.x(7) - 0.2, o.z(4), 'pipe'); }

    /* THE PEAK's survey pillar (H08-00), THE HIKERS' LOT's shelter (H06-02), THE HORSE TRAIL's shed + corral (H05-01), THE QUARRY's cut benches (H04-01) */
    { const q = S('H08-00', 4, 2), X = mx(q[0]), Z = mz(q[1]); look('peakpillar', X, Z, a => { a.box(0, 0, 0, 1.6, 0.3, 1.6, CFORM, 0xa8a49c); a.cyl(0, 0.3, 0, 0.32, 1.3, CFORM, 0xd8d4cc, { seg: 8, r2: 0.24 }); a.cyl(0, 1.6, 0, 0.2, 0.04, STL, BRONZE, { seg: 10 }); }); block(X, Z, 1.2, 1.2); R.taken.add(q[0] + ':' + q[1]); }
    { const o = O('H06-02'), X = o.x(11), Z = o.z(6); look('lotshelter', X, Z, a => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * 2.9, 0, sz * 2.4, 0.26, 2.6, 0.26, BEAM, DARKW); a.box(0, 2.6, 0, 6.4, 0.2, 5.4, BEAM, DARKW, { under: true }); a.P.push({ s: 'roof', form: 'gable', p: [0, 2.8, 0], size: [7.0, 1.3, 6.0], key: CORR, tint: 0x5a6a52, keyEnd: WCL, tintEnd: 0x9a6a44 }); a.box(0, 0, 0, 6.6, 0.08, 5.6, CFORM, 0xc8c4bc); }); }
    { const o = O('H05-01'), X = o.x(3), Z = o.z(10.5), i = 0.2; look('horseshed', X, Z, a => { a.box(0, 0, -1.5, 6.6, 2.6, 0.16, WCL, 0x8a5a3a, { gain: 1.3 }); for (const s of [-1, 1]) a.box(s * 3.3, 0, 0, 0.16, 2.6, 3.1, WCL, 0x8a5a3a, { gain: 1.3 }); for (const x of [-3.2, 0, 3.2]) a.box(x, 0, 1.5, 0.22, 2.3, 0.22, BEAM, DARKW); a.P.push({ s: 'roof', form: 'shed', p: [0, 2.6, 0], size: [7.2, 0.7, 3.8], ry: 180, key: CORR, tint: 0x6a5a50 }); });
      block(X, r2(Z - 1.5), 6.6, 0.3); take('H05-01', 2, 10, 4, 11);
      rail(o.x(5) - i, o.z(9.6), o.x(10), o.z(9.6), 'ranch'); rail(o.x(10), o.z(9.6), o.x(10), o.z(12) - i, 'ranch'); rail(o.x(5) - i, o.z(12) - i, o.x(10), o.z(12) - i, 'ranch'); rail(o.x(5) - i, o.z(10.6), o.x(5) - i, o.z(12) - i, 'ranch'); }
    { const o = O('H04-01'), X = o.x(6), Z = o.z(2); look('quarrycut', X, Z, a => { a.box(0, 0, -1.6, 29, 2.6, 3.2, 'rocks_5', 0xb8b0a4); a.box(-2, 2.6, -4.2, 24, 2.6, 2.6, 'rocks_5', 0xa8a094); a.box(1.5, 5.2, -6.4, 17, 2.4, 2.4, 'rocks_5', 0xb8b0a4); a.box(-15.5, 0, 3.6, 2.4, 2.0, 9, 'rocks_5', 0xa8a094); a.box(15.5, 0, 3.0, 2.4, 1.6, 7.6, 'rocks_5', 0xb8b0a4); }); }

    /* what stood inside the three old buildings (pass 2 lays the insides out on the squares) */
    { const OBS = B.obs, HOUSE = B.house, STILT = B.stilt, F = { floor: true }, P = (b, k, x, z, q) => b.put(k, x, z, Object.assign({}, F, q || {}));
      P(OBS, 'brass_telescope', 0, -1.5); P(OBS, 'brass_orrery', -6.5, -3.5); P(OBS, 'telescope', 6.5, -3.5, { face: 200 }); P(OBS, 'globe_lamp', -8.5, 4.5); P(OBS, 'lectern', 3, 3.5, { face: 180 }); P(OBS, 'iron_garden_bench', -4, 5.2, { face: 0 });
      P(HOUSE, 'psx_sofa_3', -3.5, -2.2, { face: 0 }); P(HOUSE, 'psx_tv_table_1', -3.5, 1.6, { face: 180 }); P(HOUSE, 'tube_tv', -3.5, 1.6, { y: 0.6, face: 180 }); P(HOUSE, 'psx_bed_1', 4.6, -1.6, { face: 0 }); P(HOUSE, 'retro_radio', 5.6, 1.8);
      P(STILT, 'curved_couch', -5, -4.5, { face: 0 }); P(STILT, 'coffee_table', -5, -2.2); P(STILT, 'decor_piano', 6, -5.5, { face: 300 }); P(STILT, 'couples_bed', 6.5, 4.5, { face: 270 }); P(STILT, 'rug_round', -5, -2.2, { y: 0.17 }); P(STILT, 'retro_radio', -9, 6); }

    /* THE COAST OVERLOOK + THE HEADLAND: a parapet on the sea side; THE CANYON ROAD: a guard rail on the drop side */
    { const o = O('H11-01'), i = 0.2; rail(o.x(11) - i, o.z(6) + i, o.x(11) - i, o.z(11) - i, 'parapet'); rail(o.x(7.2), o.z(11) - i, o.x(11) - i, o.z(11) - i, 'parapet'); }
    { const o = O('H11-00'); rail(o.x(10) - 0.2, o.z(3) + 0.2, o.x(10) - 0.2, o.z(9) - 0.2, 'parapet'); }
    { const a = O('H03-02'), b = O('H04-02'), c = O('H05-02'), z = a.z(7) + 0.25; rail(a.x(10.2), z, b.x(5) - 0.2, z, 'guard'); rail(b.x(11.2), z, c.x(6.8), z, 'guard'); }
}

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
  hillsBuildings(ctx);
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
  put('H07-02', 'signpost', 4, 10, { face: 180 }); tree('H09-02', 'palm', 9, 1, 4); tree('H09-02', 'palm', 9, 10, 1); put('H09-02', 'pool_umbrella', 10, 7); put('H09-02', 'pool_lounger', 10, 6, { face: 180 });
  put('H10-02', 'signpost', 4, 7, { face: 0 }); put('H11-02', 'signpost', 7, 7, { face: 90 });
  put('H12-02', 'rowboat', 1, 9, { face: 70 }); put('H12-02', 'pool_umbrella', 2, 8); tree('H12-02', 'palm', 8, 0, 8); dec('H12-02', 'ocean_rock', 3, 10);
};

/* ONE ROAD, ONE STREET SYSTEM (2026-11-16, mondo: "continue making it better and blend together more, natural part of the city"):
   - the Hills' road squares are cut OUT of the Hills' ground zone (`zone.out`, boxes in metres): they are drawn by the city's own ground material, so the
     asphalt is the very sheet, tint and light of the street it runs on from (a painted asphalt sheet in the zone read paler: a seam on the city's line);
   - the roads are STREETS of the city's plan (`exports.streets`, bake-disaster-city.js lays them into gen.streets): the lane lines, kerbs and covers the
     city paints on its streets run on up the canyon; the mountain road's own line is carried from the Casino court to the canyon road;
   - the city's lamp posts stand along them (ctx.lamps), in the Hills' own light (the tool's LOOKS.N). */
const zx = c => r2(X0 + c * C), zz = r => r2(Z0 + r * C);
exports.streets = [
    { pts: [[zx(102), -231], [zx(102), zz(33)]], w: 14 },          // THE MOUNTAIN ROAD: on from the city's avenue (its line ended at the last plot's middle) to the canyon road
    { pts: [[zx(67), zz(33)], [zx(108), zz(33)]], w: 7 },          // the canyon road, east-west along the foot
    { pts: [[zx(90), zz(12)], [zx(90), zz(33)]], w: 7 },           // the Canyon Road, up to the letters' slope
    { pts: [[zx(0), zz(18)], [zx(73), zz(18)]], w: 7 },            // the Shasta Road, west to the Mountains
    { pts: [[zx(46), zz(30)], [zx(68), zz(30)]], w: 7 }, { pts: [[zx(68), zz(30)], [zx(68), zz(33)]], w: 7 },   // the Hairpin
];
exports.apply = ctx => { R = board(ctx); content.apply(R);
    /* the road squares, as greedy boxes, leave the zone */
    { const used = new Set(), out = [], isY = (x, y) => x >= 0 && y >= 0 && x < W && y < H && R.cell[y][x] === 'Y' && !used.has(x + ':' + y);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isY(x, y)) continue; let w = 1; while (isY(x + w, y)) w++; let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (!isY(x + i, y + h)) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((x + i) + ':' + (y + j)); out.push([zx(x), zz(y), zx(x + w), zz(y + h)]); }
      exports.room.zone.out = out; console.warn('[the Hills] road boxes ' + out.length); } };

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
    /* THE LAMPS: the city's post, every 28 m, on alternate sides, on a square that is not road, rock, water or taken */
    { let n = 0; exports.streets.forEach((st, si) => { const a = st.pts[0], b = st.pts[1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, off = st.w / 2 + 0.85;
          for (let d = 14, k = si; d < len - 6; d += 28, k++) { const sd = k % 2 ? 1 : -1, nx = -uz * sd, nz = ux * sd, x = r2(a[0] + ux * d + nx * off), z = r2(a[1] + uz * d + nz * off); if (z > -252.5) continue;
              const sx = Math.floor((x - X0) / C), sy = Math.floor((z - Z0) / C), ch = R.inR(sx, sy) ? R.cell[sy][sx] : 'r'; if ('rzwYBt'.indexOf(ch) >= 0 || R.taken.has(sx + ':' + sy)) continue;
              if (ctx.lamps.some(l => Math.hypot(l.x - x, l.z - z) < 3)) continue; ctx.lamps.push({ x, z, nx: Math.round(nx), nz: Math.round(nz), d: 'N' }); n++; } });
      console.warn('[the Hills] lamps ' + n); }
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
