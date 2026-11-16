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
   - Nobody lives here (mondo: "don't worry about it yet"). No encounter table.
   - THE THREE BUILDINGS have their exteriors and interiors (11-16, mondo: "do exteriors and interiors of the buildings"; notes: areas-complexes.md
     "THE HOLLYWOOD HILLS, THE THREE BUILDINGS"). Still open on them: the Stilt House's west deck is drawn only (the walker walks the slope under it);
     the Observatory's doorway is 0.87 m west of the frontispiece's middle (a glazed light fills the other half); the windows are dark panes outside
     and daylit sheets inside, not see-through; no rails, braces or columns on these three bump the walker (only walls, partitions and whole squares do)

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
   real architecture. The three old buildings are THE THREE BUILDINGS' in content.apply (the other Hills thread, the same day); here: their terraces, three more houses on the foot row, so the
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
    /* THE OBSERVATORY'S TERRACE (H10-01; the building itself is THE THREE BUILDINGS' in content.apply): the plan's marble squares are one level terrace
       with a balustrade, open where the paths and the drive come in: the place to look over the city */
    flat('H10-01', 2, 2, 10, 10);
    { const o = O('H10-01'), X = o.x(6), Z = o.z(9), q = S('H10-01', 5, 8);   // THE MONUMENT on the terrace's axis: a six-sided shaft, a bronze sphere in a ring
      look('obs_monument', X, Z, a => { a.box(0, 0, 0, 3.0, 0.5, 3.0, M, TRIM, G15); a.box(0, 0.5, 0, 2.2, 0.4, 2.2, M, WHITE, G15); a.cyl(0, 0.9, 0, 0.85, 6.6, M, WHITE, { seg: 6, gain: 2.0, r2: 0.6 }); a.cyl(0, 7.5, 0, 0.8, 0.25, M, TRIM, { seg: 6, gain: 2.0 });
          a.cyl(0, 7.75, 0, 0.1, 0.5, STL, BRONZE); a.dome(0, 8.25, 0, 0.6, 0.6, STL, BRONZE); a.cyl(0, 8.2, 0, 1.0, 0.08, STL, BRONZE, { ri: 0.88, seg: 18 }); });
      block(X, Z, 3, 3); for (const d of [[0, 0], [1, 0], [0, 1], [1, 1]]) R.taken.add((q[0] + d[0]) + ':' + (q[1] + d[1]));
      const i = 0.25; rail(o.x(2) + i, o.z(10) - i, o.x(5), o.z(10) - i, 'balusters_b'); rail(o.x(7), o.z(10) - i, o.x(10) - i, o.z(10) - i, 'balusters_b');
      rail(o.x(2) + i, o.z(2) + i, o.x(2) + i, o.z(8), 'balusters_b'); rail(o.x(10) - i, o.z(2) + i, o.x(10) - i, o.z(8), 'balusters_b'); rail(o.x(2) + i, o.z(2) + i, o.x(5), o.z(2) + i, 'balusters_b'); rail(o.x(7), o.z(2) + i, o.x(10) - i, o.z(2) + i, 'balusters_b'); }

    /* THE HILL HOUSE'S POOL TERRACE (H04-02, across the road from the house): flagstone, a round pool with a white coping, a glass rail over the city */
    paint('H04-02', 7, 7, 11, 10, 's');
    { const o = O('H04-02'), X = o.x(9), Z = o.z(8.5);
      feat({ k: 'pool', x: X, z: Z, r: 2.7, rz: 2.7, y: -0.12, depth: 1.2, key: 'water', bank: 0.25 });
      look('hillpool', X, Z, a => { a.cyl(0, 0, 0, 3.15, 0.14, M, WHITE, { seg: 28, ri: 2.7, gain: 2.0 }); });
      const i = 0.2; rail(o.x(7) + i, o.z(10) - i, o.x(11) - i, o.z(10) - i, 'glass'); rail(o.x(7) + i, o.z(7.6), o.x(7) + i, o.z(10) - i, 'glass'); take('H04-02', 8, 8, 10, 9); }

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

    /* THE COAST OVERLOOK + THE HEADLAND: a parapet on the sea side; THE CANYON ROAD: a guard rail on the drop side */
    { const o = O('H11-01'), i = 0.2; rail(o.x(11) - i, o.z(6) + i, o.x(11) - i, o.z(11) - i, 'parapet'); rail(o.x(7.2), o.z(11) - i, o.x(11) - i, o.z(11) - i, 'parapet'); }
    { const o = O('H11-00'); rail(o.x(10) - 0.2, o.z(3) + 0.2, o.x(10) - 0.2, o.z(9) - 0.2, 'parapet'); }
    { const a = O('H03-02'), b = O('H04-02'), c = O('H05-02'), z = a.z(7) + 0.25; rail(a.x(10.2), z, b.x(5) - 0.2, z, 'guard'); rail(b.x(11.2), z, c.x(6.8), z, 'guard'); }
}

/* ══ PASS 2: THE INSIDES of the three new houses + THE YARDS of all six. Every walk-in is lit and furnished on the fight's squares (a blocker on a square's middle, the door's square and the way in from
   it kept clear, decor off centre). A building's own inside takes no light, so `lit` draws the walls and the ceiling again a hand inside with `glow`
   (the Mountains' North Pole kit: areas-complexes.md "PASS 2, INTERIORS"). Every inside prop is `floor: true` (near a wall it would stand on the wall's top). ══ */
const litIn = (a, w, h, d, dr, key, tint, g, ceil) => { const top = h - 0.36, i = 0.3, t = 0.04, q = { glow: g, gain: 1.7 }, x0 = dr.lx - dr.cw / 2, x1 = dr.lx + dr.cw / 2, e = w / 2 - i;
    a.box(0, 0, -(d / 2 - i), w - 2 * i, top, t, key, tint, q); for (const s of [-1, 1]) a.box(s * (w / 2 - i), 0, 0, t, top, d - 2 * i, key, tint, q);
    a.box((-e + x0) / 2, 0, d / 2 - i, x0 + e, top, t, key, tint, q); a.box((x1 + e) / 2, 0, d / 2 - i, e - x1, top, t, key, tint, q); a.box(dr.lx, 2.2, d / 2 - i, dr.cw, top - 2.2, t, key, tint, q);
    a.box(0, top - 0.1, 0, w - 2 * i, 0.02, d - 2 * i, ceil ? ceil[0] : BEAM, ceil ? ceil[1] : 0x8a6a48, { sides: false, top: false, under: true, glow: g * (ceil ? ceil[2] || 0.75 : 0.75), gain: 1.6 }); };
/* a window seen from inside: the night (or the day) in a dark pane with a pale frame, on the wall `side` ('b' back, 'l', 'r', 'f' front) at `u` along it */
const paneIn = (a, w, d, side, u, y, pw, ph) => { const i = 0.34, ew = side === 'l' || side === 'r', x = side === 'l' ? -(w / 2 - i) : side === 'r' ? w / 2 - i : u, z = side === 'b' ? -(d / 2 - i) : side === 'f' ? d / 2 - i : u;
    a.box(x, y, z, ew ? 0.05 : pw, ph, ew ? pw : 0.05, M, 0x24344c, { glow: 0.55 }); a.box(x, y - 0.08, z, ew ? 0.09 : pw + 0.2, 0.08, ew ? pw + 0.2 : 0.09, M, WHITE, { glow: 0.9 }); a.box(x, y + ph, z, ew ? 0.09 : pw + 0.2, 0.08, ew ? pw + 0.2 : 0.09, M, WHITE, { glow: 0.9 }); };
const hearth = (a, cx, zc0, top, k, ry) => { const Bk = 'bricks_2', T = 0xb86a54, g = { glow: 0.8 }, P = [];   // against the west wall: built in a frame of its own, then turned
    const b = (x, y, z, w, h, d, key, tint, q) => a.box(zc0 ? x : x, y, z, w, h, d, key, tint, q);
    for (const s of [-1, 1]) b(cx, 0, zc0 + s * 0.75 * k, 0.9 * k, 1.1 * k, 0.4 * k, Bk, T, g); b(cx, 1.1 * k, zc0, 0.9 * k, 0.4 * k, 1.9 * k, Bk, T, g);
    b(cx - 0.4 * k, 0, zc0, 0.06, 1.1 * k, 1.1 * k, Bk, 0x241a16, g); b(cx + 0.04, 1.5 * k, zc0, 0.9 * k + 0.16, 0.14, 2.2 * k, BEAM, 0x6a4a34, { glow: 0.8, gain: 1.4 }); b(cx - 0.25 * k, 1.5 * k + 0.14, zc0, 0.4, top - 1.5 * k - 0.14, 1.3 * k, Bk, T, g); };
function hillsInsides(ctx) {
    const R = ctx, { look, r2 } = ctx, B = R.B, F = { floor: true };
    const inside = (b, id, h, key, tint, g, ceil, more) => { look(id + ':in', b.cx, b.cz, a => { litIn(a, b.fw, h, b.fd, b.door, key, tint, g, ceil); if (more) more(a, b.fw, b.fd); }); R.ARCH[R.ARCH.length - 1].rot = b.rot; };   // (look() rows stand at rot 0: the row takes its building's turn, the Villa faces west)
    const P = (b, k, x, z, face, q) => b.put(k, x, z, Object.assign({ face: face || 0 }, F, q || {}));
    /* THE ROUND HOUSE: the lounge under the saucer */
    { const b = B.round; inside(b, 'roundhouse', 3.4, U('PlasterWallPainted1a'), 0xf0e6d0, 0.85, [M, 0xf4e8d0, 0.9], (a, w, d) => { for (const u of [-3, 0.6, 3.4]) paneIn(a, w, d, 'b', u, 0.9, 2.2, 1.9); for (const u of [-3, 0.4, 3.2]) { paneIn(a, w, d, 'l', u, 0.9, 2.2, 1.9); paneIn(a, w, d, 'r', u, 0.9, 2.2, 1.9); } });
      P(b, 'tulip_table', 0, 0); P(b, 'rug_round', 0, 0, 0, { y: 0.02, span: 3 }); P(b, 'tulip_chair', -1.1, 0.4, 100); P(b, 'tulip_chair', 1.1, -0.3, 280); P(b, 'curved_couch', -3.5, -3.5, 45); P(b, 'egg_chair', -3.5, 0, 90); P(b, 'lava_lamp_floor', -4.3, 2.2);
      P(b, 'jukebox', 3.5, 0, 270); P(b, 'mini_fridge', 3.5, -3.5, 0); P(b, 'bar_stool', 2.4, -2.5); P(b, 'bar_stool', 3.9, -2.2); P(b, 'pinball_machine', 3.5, 3.5, 270); P(b, 'space_divider', 0, -4.2, 0); P(b, 'disc_cluster', 0, 0); P(b, 'sputnik_lamp', -2.6, -2.6); P(b, 'mushroom_lamp', 4.3, -4.3, 0, { y: 0.85 }); }
    /* THE VILLA: tile and dark wood */
    { const b = B.villa; inside(b, 'villa', 4.2, STUCCO, 0xf6ecd6, 0.85, [BEAM, 0x8a6a48, 0.8], (a, w, d) => { for (const u of [-4.8, 3.0, 5.4]) paneIn(a, w, d, 'f', u, 1.0, 1.1, 1.6); for (const u of [-4.4, 0, 4.4]) paneIn(a, w, d, 'b', u, 1.0, 1.1, 1.6); for (const u of [-2.6, 2.2]) { paneIn(a, w, d, 'l', u, 1.0, 1.1, 1.6); paneIn(a, w, d, 'r', u, 1.0, 1.1, 1.6); } });
      P(b, 'chesterfield_sofa', -5.25, -3.5, 0); P(b, 'wingback_chair', -5.25, 0, 90); P(b, 'coffee_table', -3.6, -1.9); P(b, 'psx_carpet_mp_1', -4.2, -1.6, 0, { y: 0.02 }); P(b, 'psx_dinner_table_1', 1.75, 0); for (const [x, z, f] of [[0.5, 0, 90], [3.0, 0, 270], [1.75, -1.3, 0], [1.75, 1.3, 180]]) P(b, 'psx_chair_mp_1', x, z, f);
      P(b, 'royal_bed', 5.25, -3.5, 0); P(b, 'privacy_screen', 3.5, -3.6, 90); P(b, 'makeup_vanity', 5.25, 3.5, 180); P(b, 'kitchen_range', -1.75, -4.4, 0); P(b, 'round_fridge', -0.3, -4.4, 0); P(b, 'marble_bust', -6.2, 3.9, 135); P(b, 'stone_urn', 1.0, 4.2); P(b, 'potted_plant', 6.2, 0.6);
      P(b, 'crystal_chandelier', 1.75, 0, 0, { y: 2.45 }); P(b, 'painting_landscape', 1.75, -4.9, 0, { y: 1.9 }); P(b, 'painting_portrait', -6.6, -1.75, 90, { y: 1.9 }); }
    /* THE A-FRAME: one room, a bed, a chair by the stove pipe */
    { const b = B.aframe; inside(b, 'aframe', 3.0, WCL, 0xd0a070, 0.8, null, (a, w, d) => { for (const u of [-3.6, 2.6]) paneIn(a, w, d, 'f', u, 0.5, 2.0, 2.0); });
      P(b, 'psx_bed_1', 3.5, -3.5, 0); P(b, 'footlocker', 3.5, -1.3, 0); P(b, 'psx_armchair_2', -3.5, -3.5, 45); P(b, 'rocking_chair', -3.5, 0, 90); P(b, 'psx_coffee_table_1', -1.9, -2.0); P(b, 'psx_tv_table_1', 3.5, 3.5, 270); P(b, 'tube_tv', 3.5, 3.5, 270, { y: 0.74 });
      P(b, 'psx_shelf_mp_2', 0, -4.6, 0); P(b, 'instrument_guitar', -4.4, 2.2, 60); P(b, 'psx_carpet_mp_1', 0, -0.6, 0, { y: 0.02 }); P(b, 'table_lamp', -1.9, -2.0, 0, { y: 0.66 }); P(b, 'psx_lamp_1_on', -4.3, -1.8); P(b, 'retro_radio', 0, -4.6, 0, { y: 1.4 }); }

    /* ── THE YARDS (pass 2): what stands round the houses and on the terraces ── */
    const { put, dec, tree, S, mx, mz, props, feat } = ctx, { rail, O } = hillsKit(ctx);
    /* the Villa's south garden: a fountain between two palms, urns, a stone rail on the garden's edge; urns at the loggia */
    put('H10-02', 'fountain', 9, 6); tree('H10-02', 'palm', 8, 7, 7); tree('H10-02', 'palm', 8, 11, 7); dec('H10-02', 'stone_urn', 8, 6); dec('H10-02', 'stone_urn', 10, 6); put('H10-02', 'lion_statue', 7, 6, { face: 270 });
    { const o = O('H10-02'); rail(o.x(7), o.z(8) - 0.2, o.x(12) - 0.2, o.z(8) - 0.2, 'stone'); const b = B.villa; b.put('stone_urn', -6.4, b.fd / 2 + 3.1); b.put('stone_urn', 6.4, b.fd / 2 + 3.1); b.put('potted_plant', 2.2, b.fd / 2 + 1.0); }
    tree('H10-02', 'palm', 8, 2, 3); tree('H10-02', 'palm', 7, 3, 6); dec('H10-02', 'prickly_pear', 1, 1); dec('H10-02', 'prickly_pear', 0, 5);
    /* the Round House: the sports car on the grass, cactus, flamingos, the dish */
    put('H05-02', 'car_cyber', 8, 4, { face: 90 }); put('H05-02', 'mailbox_bank', 1, 4, { face: 180 }); dec('H05-02', 'flamingo', 0, 3); dec('H05-02', 'flamingo', 1, 2); put('H05-02', 'dish', 0, 0, { face: 150 }); put('H05-02', 'saguaro_cactus', 8, 0); dec('H05-02', 'prickly_pear', 7, 1); dec('H05-02', 'prickly_pear', 0, 1);
    /* the A-Frame: pines, a fire ring with stump seats, the car on the track's edge */
    tree('H01-02', 'pine', 7.5, 0, 1); tree('H01-02', 'pine', 6.5, 6, 0); tree('H01-02', 'pine', 8, 7, 1); tree('H01-02', 'pine', 6, 0, 3); put('H01-02', 'campfire', 6, 3); dec('H01-02', 'stump', 7, 3); dec('H01-02', 'stump', 6, 4); dec('H01-02', 'fallen_log', 5, 2); put('H01-02', 'car_pack_4', 9, 4, { face: 90 }); dec('H01-02', 'wooden_bucket', 5, 4);
    /* the Hill House's pool terrace: loungers, a cooler, a ball, a float on the water, plants */
    put('H04-02', 'pool_lounger', 7, 8, { face: 90 }); put('H04-02', 'pool_lounger', 10, 7, { face: 200 }); dec('H04-02', 'beach_ball', 10, 9); dec('H04-02', 'beach_cooler', 7, 9); dec('H04-02', 'potted_plant', 7, 7);
    { const o = O('H04-02'); props.push({ key: 'beach_air_mattress_pink', x: r2(o.x(9) + 0.5), z: r2(o.z(8.5) - 0.4), y: -0.08, face: 30 }); }
    /* the Observatory's terrace: two more telescopes at the south rail, benches, urns at the corners */
    put('H10-01', 'telescope', 4, 9, { face: 180 }); put('H10-01', 'telescope', 7, 9, { face: 180 }); put('H10-01', 'city_bench', 2, 5, { face: 90 }); put('H10-01', 'city_bench', 9, 5, { face: 270 }); dec('H10-01', 'stone_urn', 2, 2); dec('H10-01', 'stone_urn', 9, 2); dec('H10-01', 'stone_urn', 2, 7); dec('H10-01', 'stone_urn', 9, 7);
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
  /* ── THE THREE BUILDINGS (mondo 11-16: "do exteriors and interiors of the buildings"). Each is a walk-in `texbuilding` (its walls, its doorway, its
     swinging leaf) wearing an `arch` look. Parts frame: the building's middle, x along the front (east), +z out of the front (south, the city), y up
     from its floor. THE SQUARES: a thing that blocks stands on the middle of a whole 3.5 m square (the square middles are in each block's comment);
     a prop with no foot of its own that should block gets a ghost block on its square (`blk`); a partition stands on a line between squares, as the
     outer walls do. Models: every prop is a catalogue row found through MODEL_LIST.md (the PSX Mega Pack furniture, mondo's Meshy props, the
     Elbolilloduro kitchen and bath pieces, the Meshy city-interior exhibits). ── */
  const STUCCO = U('PlasterWallStucco1a'), PLAST = U('PlasterWallPainted1a'), WHITE = 0xf2efe6, CREAM = 0xe6e2d6, DARKW = 0x3a2a20, DGLASS = 0x18242e, IRON = 0x24272c, DAY = 0xcfe2f4;
  const MARB = 'marble_light', GREENM = U('TileMarble1a'), COPPER = U('MetalWallRibbed1a'), VERDI = 0x63b49c, STONE = 'calm_flagstone', BITUMEN = U('ConcreteRoofBitumen1a');
  const OUT = (side, u, o, hw, hd) => side === 'f' ? [u, hd + o] : side === 'b' ? [u, -hd - o] : side === 'l' ? [-hw - o, u] : [hw + o, u];
  const SZ = (side, wd, dp) => (side === 'f' || side === 'b') ? [wd, dp] : [dp, wd];
  /* a window on an outer wall: a dark frame and a pane of dark glass (side f / b / l / r, u along that wall) */
  const pane = (a, side, u, y, wd, ht, hw, hd, x) => { let p = OUT(side, u, 0.09, hw, hd), s = SZ(side, wd + 0.24, 0.1); a.box(p[0], y - 0.12, p[1], s[0], ht + 0.24, s[1], null, IRON, x);
      p = OUT(side, u, 0.13, hw, hd); s = SZ(side, wd, 0.1); a.box(p[0], y, p[1], s[0], ht, s[1], GLS, DGLASS, Object.assign({ uv: 'fit', glow: 0.12 }, x || {})); };
  /* the same window from inside: a frame and a daylit sheet on the inside wall */
  const winIn = (a, wall, u, y, wd, ht, hw, hd, frame) => { const e = 0.3, ry = wall === 'b' ? 0 : wall === 'f' ? 180 : wall === 'l' ? 270 : 90, at = wall === 'b' ? [u, -hd + e] : wall === 'f' ? [u, hd - e] : wall === 'l' ? [-hw + e, u] : [hw - e, u];
      const nx = wall === 'l' ? 1 : wall === 'r' ? -1 : 0, nz = wall === 'b' ? 1 : wall === 'f' ? -1 : 0;
      a.quad(at[0] + nx * 0.02, y - 0.1, at[1] + nz * 0.02, wd + 0.2, ht + 0.2, null, frame == null ? IRON : frame, { ry }); a.quad(at[0] + nx * 0.04, y, at[1] + nz * 0.04, wd, ht, GLS, DAY, { ry, glow: 0.7, uv: 'fit', win: 'keep' }); };
  /* a hanging lamp: a rod from the ceiling and a lit drum */
  const pend = (a, x, z, y, top, r) => { a.cyl(x, y + 0.3, z, 0.015, top - y - 0.3, null, 0x202020, { seg: 4, cap: false }); a.cyl(x, y, z, r, 0.3, null, 0xfff0d0, { glow: 0.9, seg: 12, r2: r2(r * 0.6) }); };
  /* an inside partition: drawn (a plaster wall on a line between squares) + what the walker bumps */
  const partDraw = (a, w, h, key, tint) => a.box((w[0] + w[2]) / 2, 0, (w[1] + w[3]) / 2, Math.abs(w[2] - w[0]) + 0.16, h, Math.abs(w[3] - w[1]) + 0.16, key, tint);
  const partWalk = (B, w, h) => { const p = B.at(w[0], w[1]), q = B.at(w[2], w[3]); feat({ k: 'wall', x0: p[0], z0: p[1], x1: q[0], z1: q[1], h, t: 0.2, key: 'urban:ConcreteStriped2a', ghost: true, rail: false }); };
  const lift = (a, gains) => a.P.forEach(p => { if (p.key && gains[p.key] && !p.glow && p.gain == null) p.gain = gains[p.key]; });   // a grey sheet under a light tint reads as mud: its own colour, lifted (the arch row's `gain`)
  const lit = (a, x, z, y, w, d) => { a.box(x, y - 0.07, z, w + 0.2, 0.05, d + 0.2, null, 0x8a8e96, { under: true, roof: true }); a.box(x, y - 0.09, z, w, 0.03, d, null, 0xfff4dc, { glow: 1, under: true, roof: true }); };   // a lit panel under a ceiling
  const blk = (B, lx, lz, h) => { const p = B.at(lx, lz); feat({ k: 'wall', x0: p[0], z0: p[1], x1: p[0], z1: p[1], h: h || 1.1, t: C, key: 'urban:ConcreteStriped2a', ghost: true, rail: false }); };   // a whole square that blocks

  /* THE OBSERVATORY (21 x 14 m, squares x -8.75 -5.25 -1.75 1.75 5.25 8.75 · z -5.25 -1.75 1.75 5.25): a white Art Deco hall, a copper-green dome on a
     windowed drum over its middle, a small dome on each wing, giant piers between tall dark windows, a frontispiece with a bronze and glass portal.
     Inside: one exhibit hall, the brass telescope on a round dais under an inner sky dome, the exhibits in the wings, the ticket booth by the door */
  const OH = 7;
  const OBS = building('observatory', 'H10-01', [3, 3, 9, 7, 'S'], OH, { storeys: 2, leaf: 'leaf_lobby_glass_double', leafDouble: true, keyIn: MARB, floorIn: U('TileMarble2a') }, (a, w, d, dr) => {
      const hw = w / 2, hd = d / 2, RF = { roof: true }, Hc = OH - 0.32;
      a.shell(w, OH, d, MARB, WHITE, dr);
      /* the base course (the front's stops at the frontispiece) */
      for (const q of [[0, -hd - 0.1, w + 0.4, 0.2], [-hw - 0.1, 0, 0.2, d], [hw + 0.1, 0, 0.2, d], [-7.45, hd + 0.1, 6.5, 0.2], [7.45, hd + 0.1, 6.5, 0.2]]) a.box(q[0], 0, q[1], q[2], 0.9, q[3], 'calm_marble', 0xb4b0a6);
      /* the bays: a pier on every bay line, a tall dark window in every bay */
      const pier = (side, u) => { let p = OUT(side, u, 0.15, hw, hd), s = SZ(side, 0.62, 0.3); a.box(p[0], 0.9, p[1], s[0], OH - 0.9, s[1], MARB, CREAM); s = SZ(side, 0.8, 0.4); a.box(p[0], OH - 0.55, p[1], s[0], 0.55, s[1], MARB, WHITE); a.box(p[0], 0.9, p[1], s[0], 0.3, s[1], MARB, WHITE); };
      const bays = (side, u0, u1, n, wins) => { const s = (u1 - u0) / n; for (let i = 0; i <= n; i++) pier(side, u0 + i * s); if (wins !== false) for (let i = 0; i < n; i++) { const u = u0 + (i + 0.5) * s; pane(a, side, u, 1.7, 1.3, 4.1, hw, hd); const p = OUT(side, u, 0.14, hw, hd), z = SZ(side, 1.7, 0.28); a.box(p[0], 1.4, p[1], z[0], 0.18, z[1], MARB, CREAM); } };
      bays('f', -hw + 0.3, -4.7, 2); bays('f', 4.7, hw - 0.3, 2); bays('l', -hd + 0.3, hd - 0.3, 4); bays('r', -hd + 0.3, hd - 0.3, 4); bays('b', -hw + 0.3, hw - 0.3, 6, false);
      /* THE FRONTISPIECE: two piers and a head, proud of the wall; in its opening the door, a glazed light beside it and a tall light over both */
      const zf = hd + 0.35;
      for (const sx of [-1, 1]) { a.box(sx * 3.15, 0, zf, 2.5, 9.0, 0.7, MARB, WHITE); a.box(sx * 3.15, 0, zf + 0.06, 2.7, 0.9, 0.7, 'calm_marble', 0xb4b0a6); a.box(sx * 3.15 - 0.6, 1.6, zf + 0.38, 0.5, 5.0, 0.1, MARB, CREAM, { n: 2, step: [1.2, 0, 0] });
          a.box(sx * 3.15, 2.5, zf + 0.44, 0.34, 0.7, 0.26, null, 0xffe2a8, { glow: 1 }); a.box(sx * 3.15, 3.2, zf + 0.44, 0.44, 0.1, 0.34, null, 0x6a4a2a); a.box(sx * 3.15, 2.4, zf + 0.44, 0.44, 0.1, 0.34, null, 0x6a4a2a); }
      a.box(0, 4.9, zf, 3.8, 4.1, 0.7, MARB, WHITE, { under: true }); a.box(0, 9.0, zf - 0.2, 9.2, 0.3, 1.3, MARB, CREAM, { under: true, roof: true });
      a.sign('OBSERVATORY', 0, 7.3, zf + 0.37, 7.4, 0.95, '#241a10', '', 'cinzel', { kind: 'over' });
      { const z = hd + 0.12, BR = 0x5a4026;   // the portal's bronze and glass (the doorway itself is the row's: x -1.74 .. 0)
        a.box(0.9, 0.1, z, 1.62, 2.1, 0.08, GLS, DGLASS, { uv: 'fit', glow: 0.12 }); a.box(0, 2.42, z, 3.5, 2.3, 0.08, GLS, DGLASS, { uv: [1.75, 2.3], glow: 0.12 });
        for (const x of [-1.84, 0.03, 1.84]) a.box(x, 0, z + 0.02, 0.12, 4.9, 0.14, null, BR); a.box(0, 2.24, z + 0.02, 3.8, 0.16, 0.14, null, BR); a.box(0.9, 0, z + 0.02, 1.7, 0.1, 0.14, null, BR); a.box(0, 4.74, z + 0.02, 3.8, 0.16, 0.14, null, BR); }
      a.box(0, 0, hd + 2.1, 10.4, 0.07, 2.9, MARB, CREAM);   // the landing before the door
      /* the roof: a cornice, a parapet, the raised middle, the drum with its ring of windows, the copper dome and its finial; a small dome on each wing */
      a.box(0, OH, 0, w + 0.9, 0.4, d + 0.9, MARB, CREAM, { roof: true, under: true }); a.box(0, OH + 0.4, 0, w + 0.3, 0.55, d + 0.3, MARB, WHITE, { roof: true, keyTop: BITUMEN, tintTop: 0x9a9a98 });
      a.box(0, OH + 0.95, 0.3, 8.8, 1.05, d + 0.1, MARB, WHITE, RF); a.box(0, OH + 2.0, 0.3, 9.2, 0.3, d + 0.5, MARB, CREAM, { roof: true, under: true });
      a.cyl(0, OH + 2.3, 0, 4.7, 1.9, MARB, WHITE, { seg: 24, roof: true }); a.box(0, OH + 2.8, 0, 1.0, 0.95, 0.12, GLS, DGLASS, { ring: { n: 12, r: 4.68 }, roof: true, uv: 'fit', glow: 0.12 });
      a.cyl(0, OH + 4.2, 0, 4.95, 0.25, MARB, CREAM, { seg: 24, roof: true }); a.dome(0, OH + 4.45, 0, 4.8, 4.3, COPPER, VERDI, { seg: 24, rings: 8, roof: true });
      a.cyl(0, OH + 8.7, 0, 0.42, 0.5, COPPER, VERDI, RF); a.cyl(0, OH + 9.2, 0, 0.1, 1.7, COPPER, VERDI, { r2: 0, seg: 8, roof: true });
      for (const sx of [-1, 1]) { a.cyl(sx * 7.2, OH + 0.95, 0, 2.3, 1.2, MARB, WHITE, { seg: 16, roof: true }); a.cyl(sx * 7.2, OH + 2.15, 0, 2.45, 0.18, MARB, CREAM, { seg: 16, roof: true });
          a.dome(sx * 7.2, OH + 2.33, 0, 2.35, 2.2, COPPER, VERDI, { seg: 16, roof: true }); a.cyl(sx * 7.2, OH + 4.5, 0, 0.07, 0.9, COPPER, VERDI, { r2: 0, seg: 6, roof: true });
          a.box(sx * 7.2, OH + 1.3, 0, 0.7, 0.6, 0.1, GLS, DGLASS, { ring: { n: 6, r: 2.28 }, roof: true, uv: 'fit', glow: 0.12 }); }
      /* INSIDE: a green marble dado and a bronze rail, piers on the walls, the daylit windows, the floor's ring, the dais, the inner sky dome, the lamps */
      const ix = hw - 0.3, iz = hd - 0.3;
      for (const q of [[0, -iz + 0.03, 2 * ix, 0.06], [-ix + 0.03, 0, 0.06, 2 * iz], [ix - 0.03, 0, 0.06, 2 * iz], [-6.0, iz - 0.03, 8.4, 0.06], [5.13, iz - 0.03, 10.1, 0.06]]) { a.box(q[0], 0, q[1], q[2], 1.2, q[3], GREENM, 0x3a5a48); a.box(q[0], 1.2, q[1], q[2] + 0.04, 0.08, q[3] + 0.04, null, 0x6a4a2a); }
      for (const x of [-7, -3.5, 3.5, 7]) a.box(x, 0, -iz + 0.09, 0.5, Hc, 0.14, MARB, CREAM); for (const x of [-7.45, -4.4, 4.4, 7.45]) a.box(x, 0, iz - 0.09, 0.5, Hc, 0.14, MARB, CREAM); for (const z of [-3.5, 0, 3.5]) for (const sx of [-1, 1]) a.box(sx * (ix - 0.09), 0, z, 0.14, Hc, 0.5, MARB, CREAM);
      for (const u of [-8.83, -6.08, 6.08, 8.83]) winIn(a, 'f', u, 1.7, 1.2, 3.9, hw, hd, 0x5a4026); for (const u of [-5.03, -1.68, 1.68, 5.03]) { winIn(a, 'l', u, 1.7, 1.2, 3.9, hw, hd, 0x5a4026); winIn(a, 'r', u, 1.7, 1.2, 3.9, hw, hd, 0x5a4026); }
      a.cyl(0, 0.04, 0, 4.5, 0.02, 'calm_marble', 0x3a5a48, { ri: 4.0, seg: 32 }); a.cyl(0, 0.04, 0, 3.5, 0.14, 'calm_marble', 0x2e4a3c, { seg: 32, keyTop: MARB, tintTop: CREAM }); a.cyl(0, 0.18, 0, 3.2, 0.16, 'calm_marble', 0x2e4a3c, { seg: 32, keyTop: MARB, tintTop: WHITE });
      a.cyl(0, Hc - 2.5, 0, 4.45, 0.22, null, 0x6a4a2a, { ri: 4.2, seg: 32, roof: true }); a.dome(0, Hc - 2.3, 0, 4.2, 2.2, null, 0x1c2a5c, { ds: true, seg: 28, rings: 8, glow: 0.45, roof: true });   // (roof parts: they hide with the roofs in the view from above, as the lit panels do)
      for (const q of [[-7, -3.4], [-7, 3.4], [7, -3.4], [7, 3.4]]) pend(a, q[0], q[1], 4.2, Hc, 0.42);
      for (const q of [[-7, 0], [7, 0], [0, -5.6], [0, 5.6]]) { a.box(q[0], Hc - 0.1, q[1], 2.6, 0.05, 1.2, null, 0x8a8e96, { under: true, roof: true }); a.box(q[0], Hc - 0.12, q[1], 2.4, 0.03, 1.0, null, 0xfff4dc, { glow: 1, under: true, roof: true }); }
      /* the plinths of the exhibits that have no foot of their own */
      for (const q of [[-8.75, -1.75, 0.9], [-8.75, -5.25, 0.25], [5.25, -5.25, 0.25], [8.75, -5.25, 0.25]]) { a.cyl(q[0], 0.03, q[1], 1.1, q[2], 'calm_marble', 0x2e4a3c, { seg: 20, keyTop: MARB, tintTop: CREAM }); }
      lift(a, { [MARB]: 1.65, [COPPER]: 1.25 });
  });
  for (const q of [[-1.75, -1.75], [1.75, -1.75], [-1.75, 1.75], [1.75, 1.75]]) blk(OBS, q[0], q[1], 0.6);   // the dais
  for (const q of [[-8.75, -1.75], [-8.75, -5.25], [5.25, -5.25], [8.75, -5.25], [1.75, 5.25]]) blk(OBS, q[0], q[1], 1.0);
  OBS.put('brass_telescope', 0, 0, { y: 0.34, h: 3.3, face: 200 }); for (let i = 0; i < 8; i++) OBS.put('rope_stanchion', r2(2.85 * Math.cos(i * Math.PI / 4 + 0.39)), r2(2.85 * Math.sin(i * Math.PI / 4 + 0.39)), { y: 0.34, face: i * 45 });
  OBS.put('saturn', 0, 0, { y: 4.7, span: 2.6 }); OBS.put('asteroid_a', 7.6, -1.2, { y: 4.6, span: 1.3 });
  OBS.put('brass_orrery', -8.75, -1.75, { y: 0.93, h: 1.25 }); OBS.put('rocket_engine', -8.75, -5.25, { y: 0.28, face: 180 }); OBS.put('meteorite_plinth', 5.25, -5.25, { y: 0.28, face: 180 }); OBS.put('museum_vitrine', 8.75, -5.25, { y: 0.28, face: 180 });
  OBS.put('star_projector', 5.25, -1.75); OBS.put('star_dome', 5.25, -1.75, { y: OH - 0.75 }); OBS.put('lectern', -5.25, 1.75, { face: 90 }); OBS.put('concierge_podium', 1.75, 5.25, { face: 270 }); OBS.put('ticket_machine', 4.3, 6.3, { face: 0 }); OBS.put('ticket_machine', 5.5, 6.3, { face: 0 });
  OBS.put('astronomical_clock', 0, -6.25, { face: 180 }); OBS.put('marble_bust', -2.7, -6.2, { face: 180 }); OBS.put('marble_bust', 2.7, -6.2, { face: 180 }); OBS.put('star_chart', -5.25, -6.6, { face: 180 }); OBS.put('star_chart', 5.25, -6.6, { face: 180 });
  OBS.put('iron_garden_bench', -9.55, 3.5, { face: 90 }); OBS.put('iron_garden_bench', 9.55, 1.75, { face: 270 }); OBS.put('iron_garden_bench', 6.9, 6.15, { face: 0 }); OBS.put('globe_lamp', -9.6, 6.1); OBS.put('globe_lamp', 9.6, 6.1);
  OBS.put('potted_plant', -9.6, -6.1); OBS.put('potted_plant', 9.6, -6.1); OBS.put('stone_urn', -5.0, 8.3); OBS.put('stone_urn', 5.0, 8.3); OBS.put('doormat', OBS.door.lx, 7.6, { y: 0.08 });

  /* THE HILL HOUSE (14 x 7 m, squares x -5.25 -1.75 1.75 5.25 · z -1.75 1.75): mid-century modern on the Hairpin. A white flat roof sailing out on every
     side and over a carport, a wall of dark glass to the city, a stone chimney wall, a clerestory lantern over the living room.
     Inside, one open plan: the living room at the fire, the dining table, the kitchen with its bar, the bedroom past a partition with a wash basin */
  const HH = 3.4, HPART = [3.5, -3.2, 3.5, 0.1];
  const HOUSE = building('hillhouse', 'H04-02', [7, 3, 11, 5, 'S'], HH, { leaf: 'leaf_orange_glass', keyIn: PLAST, floorIn: FLR }, (a, w, d, dr) => {
      const hw = w / 2, hd = d / 2, Hc = HH - 0.32, cw = (w - 0.12) / 8, x0 = -(w - 0.12) / 2, colx = c => x0 + (c + 0.5) * cw;
      a.shell(w, HH, d, PLAST, WHITE, dr);
      /* the glass wall: storey-high dark panes between steel mullions (the two bedroom bays are boards with a ribbon window) */
      for (const c of [0, 1, 2, 4, 5]) a.box(colx(c), 0.1, hd + 0.11, cw - 0.1, 2.4, 0.06, GLS, DGLASS, { uv: 'fit', glow: 0.12 });
      for (const c of [0, 1, 2, 3, 4, 5]) a.box(colx(c), 2.6, hd + 0.11, cw - 0.1, HH - 2.6, 0.06, GLS, DGLASS, { uv: 'fit', glow: 0.12 });
      for (let c = 0; c <= 6; c++) a.box(x0 + c * cw, 0, hd + 0.13, 0.1, HH, 0.14, null, IRON); a.box(x0 + 3 * cw, 2.5, hd + 0.13, 6 * cw, 0.1, 0.14, null, IRON);
      for (const q of [[0, 3], [4, 6]]) a.box(x0 + (q[0] + q[1]) / 2 * cw, 0, hd + 0.13, (q[1] - q[0]) * cw, 0.1, 0.14, null, IRON);
      a.box(colx(6.5), 0, hd + 0.09, 2 * cw, HH, 0.08, WD, 0x9a6a40, { uv: [1.2, 1.2] }); pane(a, 'f', colx(6.5), 2.0, 2.7, 0.7, hw, hd);
      /* the east wall's slot, the back's clerestory ribbon, the stone chimney wall on the west and its stack */
      pane(a, 'r', 1.2, 0.5, 0.8, 2.4, hw, hd); pane(a, 'b', -3.4, 2.3, 5.6, 0.7, hw, hd); pane(a, 'b', 4.2, 2.3, 3.6, 0.7, hw, hd);
      a.box(-hw - 0.4, 0, -0.4, 0.8, HH + 1.0, d + 1.7, STONE, 0xb8ac9c, { uv: [2.2, 2.2] }); a.box(-hw - 0.4, HH + 1.0, -0.2, 1.0, 1.1, 1.7, STONE, 0xb8ac9c, { uv: [2.2, 2.2], roof: true }); a.box(-hw - 0.4, HH + 2.1, -0.2, 1.2, 0.12, 1.9, null, 0x55524e, { roof: true });
      /* the roof: one white slab with a boarded soffit, out over the carport on two steel posts; the lantern over the living room under a second slab */
      a.box(1.7, HH, 0.2, w + 5.2, 0.34, d + 2.4, PLAST, WHITE, { roof: true, under: true, keyUnder: WD2, keyTop: BITUMEN, tintTop: 0x9a9a98 });
      a.box(-2.6, HH + 0.34, 0, 8.4, 0.5, d - 1.4, GLS, DGLASS, { roof: true, top: false, uv: [1.75, 0.5], glow: 0.12 }); a.box(-2.6, HH + 0.84, 0.3, 9.8, 0.24, d + 0.6, PLAST, WHITE, { roof: true, under: true, keyUnder: WD2, keyTop: BITUMEN, tintTop: 0x9a9a98 });
      for (const z of [-2.9, 3.1]) a.box(hw + 4.0, -0.8, z, 0.14, HH + 0.8, 0.14, null, IRON);
      /* INSIDE: the daylit glass, the fireplace of the chimney wall, the partition and its closet doors, the kitchen run and its bar, the lamps */
      const iz = hd - 0.3, ix = hw - 0.3;
      for (const c of [0, 1, 2, 4, 5]) { a.quad(colx(c), 0.1, iz - 0.04, cw - 0.1, Hc - 0.2, GLS, DAY, { ry: 180, glow: 0.7, uv: 'fit', win: 'keep' }); } for (let c = 0; c <= 6; c++) a.box(x0 + c * cw, 0, iz - 0.05, 0.1, Hc, 0.1, null, IRON);
      a.quad(colx(6.5), 2.0, iz - 0.04, 2.7, 0.7, GLS, DAY, { ry: 180, glow: 0.7, uv: 'fit', win: 'keep' }); a.quad(-3.4, 2.2, -iz + 0.04, 5.6, 0.6, GLS, DAY, { glow: 0.7, uv: [1.4, 0.6], win: 'keep' });
      a.box(-ix + 0.3, 0, 0, 0.6, Hc, 2.6, STONE, 0xb8ac9c, { uv: [2.2, 2.2] }); a.box(-ix + 0.62, 0.3, 0, 0.06, 0.85, 1.2, null, 0x0c0c0c); a.box(-ix + 0.8, 0, 0, 1.0, 0.14, 3.0, 'calm_darkstone', 0x8a8680); a.box(-ix + 0.66, 1.5, 0, 0.14, 0.1, 2.2, WD2, DARKW);
      partDraw(a, HPART, Hc, PLAST, WHITE); for (const z of [-2.6, -1.7, -0.8]) a.quad(3.6, 0.05, z, 0.84, 2.2, WD, 0x9a6a40, { ry: 270, uv: [0.84, 2.2] });
      const CAB = 0xe8e4da, TOP = 0x3a3c40;   // the kitchen run on the back wall (square 1.75, -1.75) and the bar before it
      a.box(1.38, 0, -iz + 0.33, 0.55, 0.9, 0.62, PLAST, CAB); a.box(1.38, 0.9, -iz + 0.33, 0.59, 0.05, 0.66, 'calm_darkstone', TOP); a.box(3.3, 0, -iz + 0.33, 0.3, 0.9, 0.62, PLAST, CAB); a.box(0.98, 1.75, -iz + 0.2, 1.35, 0.7, 0.36, WD, 0x9a6a40, { under: true, uv: [1.2, 1.2] });
      a.box(1.75, 0, -0.6, 2.7, 1.0, 0.6, WD, 0x9a6a40, { uv: [1.2, 1.2] }); a.box(1.75, 1.0, -0.6, 2.9, 0.06, 0.8, 'calm_marble', 0xf0ece4);
      a.box(ix - 0.03, 1.1, 2.2, 0.04, 0.9, 0.7, GLS, 0xa8c4d4, { uv: 'fit', glow: 0.35 });   // the mirror over the basin
      pend(a, 1.2, -0.6, 2.0, Hc, 0.2); pend(a, 2.3, -0.6, 2.0, Hc, 0.2); pend(a, -1.75, -1.75, 1.9, Hc, 0.34);
      for (const q of [[-5.25, 1.75], [5.25, 0], [1.75, 1.75]]) lit(a, q[0], q[1], Hc, 1.3, 1.3);
      lift(a, { [PLAST]: 1.8, [WD]: 1.3, [WD2]: 1.2 });
  });
  partWalk(HOUSE, HPART, 3.0); blk(HOUSE, 1.75, -1.75, 1.0);
  HOUSE.put('psx_sofa_3', -5.25, -1.75, { face: 180 }); HOUSE.put('coffee_table', -5.25, 1.75); HOUSE.put('shag_rug', -5.25, 0.6, { y: 0.04 }); HOUSE.put('retro_radio', -5.1, 1.7, { y: 0.47, face: 150 }); HOUSE.put('psx_book_mp_1', -5.5, 1.95, { y: 0.47, face: 40 });
  HOUSE.put('hearth_fire', -6.0, 0, { face: 90, h: 0.75, y: 0.14 }); HOUSE.put('sputnik_lamp', -4.4, 0.2, { y: 2.08 }); HOUSE.put('tulip_chair', -3.75, 2.3, { face: 250 }); HOUSE.put('potted_plant', -6.25, 2.75); HOUSE.put('psx_photo_frame_mp_1', -6.0, -0.9, { y: 1.6, face: 90 });
  HOUSE.put('tulip_table', -1.75, -1.75); HOUSE.put('tulip_chair', -2.6, -1.75, { face: 90 }); HOUSE.put('tulip_chair', -0.9, -1.75, { face: 270 }); HOUSE.put('tulip_chair', -1.75, -2.6, { face: 180 }); HOUSE.put('psx_plate_mp_1', -1.75, -1.6, { y: 0.75 });
  HOUSE.put('round_fridge', 0.55, -2.75, { face: 180 }); HOUSE.put('kitchen_range', 2.4, -2.85, { face: 180 }); HOUSE.put('range_hood', 2.4, -3.0, { face: 180 }); HOUSE.put('microwave', 1.38, -2.85, { y: 0.96, face: 180 });
  HOUSE.put('bar_stool', 1.2, 0.35, { face: 0 }); HOUSE.put('bar_stool', 2.3, 0.35, { face: 0 }); HOUSE.put('psx_plate_mp_1', 1.3, -0.55, { y: 1.07 }); HOUSE.put('psx_plate_mp_1', 2.2, -0.55, { y: 1.07 });
  HOUSE.put('psx_bed_1', 5.25, -1.75, { face: 180 }); HOUSE.put('psx_bedside_table_1', 6.3, -2.8, { face: 180 }); HOUSE.put('mushroom_lamp', 6.3, -2.8, { y: 0.65 }); HOUSE.put('psx_carpet_mp_1', 5.25, 1.6, { y: 0.04, span: 2.4 });
  HOUSE.put('sink', 6.45, 2.2, { face: 270 }); HOUSE.put('office_plant', 3.1, 2.75); HOUSE.put('doormat', HOUSE.door.lx, 2.75); HOUSE.put('wall_clock', -0.25, -3.15, { y: 1.9, face: 180 });
  put('H04-02', 'car_cadillac', 11, 3, { face: 0 });   // under the carport

  /* THE STILT HOUSE (21 x 17.5 m, squares x -8.75 -5.25 -1.75 1.75 5.25 8.75 · z -7 -3.5 0 3.5 7): timber under a butterfly roof, its high side a band of
     glass to the city; a boarded deck out front and round the west side, where it stands on stilts over the drop.
     Inside: the lounge with the piano along the view wall; behind a partition the kitchen (open, a bar), the bathroom and the bedroom */
  const SH = 3.6, SPART = [[-3.5, -1.75, 0, -1.75], [7, -1.75, 10.2, -1.75], [-3.5, -8.45, -3.5, -1.75], [3.5, -8.45, 3.5, -1.75]], TIMBER = 0xd0a472, STN = 0x6b4a32, ROOFM = U('MetalRoofTiles1a');
  const STILT = building('stilthouse', 'H09-02', [3, 3, 9, 8, 'S'], SH, { leaf: 'leaf_wooden', keyIn: WD, floorIn: FLR }, (a, w, d, dr) => {
      const hw = w / 2, hd = d / 2, Hc = SH - 0.32, ix = hw - 0.3, iz = hd - 0.3, DECKT = 0x8a6a48;
      a.shell(w, SH, d, WD, TIMBER, dr, [3.5, 1.75]);
      /* battens on the boards, a dark plinth, the corner posts */
      a.box(-hw + 0.9, 0, -hd - 0.08, 0.08, SH, 0.06, WD2, STN, { n: 12, step: [1.75, 0, 0] }); for (const sx of [-1, 1]) a.box(sx * (hw + 0.08), 0, -hd + 0.9, 0.06, SH, 0.08, WD2, STN, { n: 10, step: [0, 0, 1.75] });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * (hw + 0.02), 0, sz * (hd + 0.02), 0.3, SH, 0.3, WD2, STN);
      /* the view wall: four wide dark panes and a narrow one, timber posts between; side and back windows */
      for (const x of [-6.96, -3.48, 1.74, 5.22]) pane(a, 'f', x, 0.3, 3.0, 2.7, hw, hd); pane(a, 'f', 8.3, 0.3, 1.3, 2.7, hw, hd); for (const x of [-8.7, -5.22, -1.86, 0.08, 3.48, 7.18, 9.4]) a.box(x, 0, hd + 0.1, 0.2, SH, 0.24, WD2, STN);
      for (const z of [-5.25, 1.75, 5.25]) pane(a, 'l', z, 0.9, 2.2, 1.8, hw, hd); for (const z of [-5.25, 3.5]) pane(a, 'r', z, 0.9, 2.2, 1.8, hw, hd); for (const x of [-7, 0, 7]) pane(a, 'b', x, 1.6, 1.8, 1.0, hw, hd);
      /* THE BUTTERFLY ROOF: two metal slopes down to a valley over the middle; the north one closes on boards, the south one on a band of glass over the view wall */
      a.roof('shed', 0, SH, -hd / 2, w + 0.1, 1.1, hd, ROOFM, 0x8a949c, { keyEnd: WD, tintEnd: TIMBER, uv: [1.75, 1.75] });
      a.box(0, SH, hd / 2, w, 0.02, hd, WD2, 0x4a3626, { sides: false, top: false, under: true, roof: true });
      a.P.push({ s: 'roof', form: 'shed', p: [0, SH, r2(hd / 2)], size: [w + 0.1, 2.1, hd], ry: 180, roof: true, key: ROOFM, tint: 0x8a949c, keyEnd: GLS, tintEnd: DGLASS, uv: [1.75, 2.1] });
      a.box(0, SH + 2.1, hd + 0.75, w + 1.6, 0.14, 1.7, WD2, STN, { roof: true, under: true }); a.box(0, SH + 1.1, -hd - 0.5, w + 1.6, 0.14, 1.2, WD2, STN, { roof: true, under: true }); a.box(0, SH - 0.02, 0, w + 0.6, 0.3, 0.7, null, 0x55524e, { roof: true });
      /* THE DECK: boards before the front (the ground is level there) and along the west side, out over the drop on stilts; a rail of posts and two bars */
      const DZ = hd + 1.95, DW = hw + 1.95;
      a.box(-0.48, -0.34, DZ, w + 2.95, 0.4, 3.9, FLR, DECKT, { uv: [1.75, 1.75] }); a.box(-DW, -0.34, 0, 3.9, 0.4, d, FLR, DECKT, { uv: [1.75, 1.75], under: true });
      for (const z of [-7.6, -3.4, 0.8, 5.0, 9.2, 12.4]) { a.box(-hw - 3.6, -6.4, z, 0.3, 6.1, 0.3, WD2, STN); a.box(-hw - 1.85, -1.5, z, 3.6, 0.2, 0.2, WD2, STN); a.box(-hw - 1.85, -3.2, z, 3.6, 0.16, 0.16, WD2, STN); } a.box(-hw - 3.6, -2.2, 2.4, 0.2, 0.24, 20.2, WD2, STN); a.box(-hw - 3.6, -0.6, 2.4, 0.22, 0.28, 20.6, WD2, STN);
      const rail = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), ew = Math.abs(x1 - x0) > Math.abs(z1 - z0), n = Math.max(1, Math.round(L / 1.75));
          a.box(x0, 0.06, z0, 0.1, 1.0, 0.1, WD2, STN, { n: n + 1, step: [(x1 - x0) / n, 0, (z1 - z0) / n] }); for (const y of [0.55, 1.0]) a.box((x0 + x1) / 2, y, (z0 + z1) / 2, ew ? L : 0.07, 0.07, ew ? 0.07 : L, WD2, STN); };
      rail(-hw - 3.8, hd + 3.8, -3.5, hd + 3.8); rail(3.5, hd + 3.8, hw + 0.9, hd + 3.8); rail(-hw - 3.8, -hd + 0.1, -hw - 3.8, hd + 3.8); rail(-hw - 3.8, -hd + 0.1, -hw, -hd + 0.1);
      a.box(-hw - 3.2, 0.06, 0, 0.5, 0.45, 5.0, WD, TIMBER); a.box(-hw - 3.4, 0.51, 0, 0.1, 0.4, 5.0, WD, TIMBER);   // the deck's built-in bench
      /* INSIDE: the daylit view wall, the partitions, the kitchen run and its bar, the bathroom's tiles, the closet wall, the lamps */
      for (const x of [-6.96, -3.48, 1.74, 5.22]) winIn(a, 'f', x, 0.3, 3.0, 2.6, hw, hd, STN); winIn(a, 'f', 8.3, 0.3, 1.3, 2.6, hw, hd, STN); for (const z of [1.75, 5.25]) winIn(a, 'l', z, 0.9, 2.2, 1.8, hw, hd, STN); winIn(a, 'r', 3.5, 0.9, 2.2, 1.8, hw, hd, STN); winIn(a, 'r', -5.25, 0.9, 2.2, 1.8, hw, hd, STN); winIn(a, 'l', -5.25, 0.9, 2.2, 1.8, hw, hd, STN);
      SPART.forEach(q => partDraw(a, q, Hc, WD, 0xd8b48a));
      a.quad(0, 0.045, -5.1, 6.8, 6.5, U('TileGeneric1a'), 0xdfe8ea, { flat: true, uv: [1.75, 1.75] }); a.box(-3.38, 1.1, -3.5, 0.04, 0.9, 0.7, GLS, 0xa8c4d4, { uv: 'fit', glow: 0.35 });
      for (const z of [-7.6, -6.6, -5.6, -4.6]) a.quad(3.62, 0.05, z, 0.94, 2.3, WD2, 0x6a4a30, { ry: 270, uv: [0.94, 2.3] });   // the closet wall of the bedroom
      const CAB = 0x2f4a44, TOP = 0xe8e2d6;   // the kitchen run on the back wall (squares -8.75 / -5.25, -7) and the bar (square -5.25, -3.5)
      a.box(-6.85, 0, -iz + 0.33, 2.3, 0.9, 0.62, PLAST, CAB); a.box(-6.85, 0.9, -iz + 0.33, 2.34, 0.05, 0.66, 'calm_marble', TOP); a.box(-9.85, 0, -iz + 0.33, 0.6, 0.9, 0.62, PLAST, CAB); a.box(-9.85, 0.9, -iz + 0.33, 0.64, 0.05, 0.66, 'calm_marble', TOP);
      a.box(-4.0, 0, -iz + 0.33, 0.8, 2.3, 0.62, PLAST, CAB); a.box(-6.25, 1.75, -iz + 0.2, 3.5, 0.7, 0.36, PLAST, CAB, { under: true }); a.box(-6.6, 0.93, -iz + 0.33, 0.7, 0.03, 0.45, null, 0x9aa0a6);
      a.box(-5.25, 0, -2.5, 2.7, 1.0, 0.8, PLAST, CAB); a.box(-5.25, 1.0, -2.5, 2.9, 0.06, 1.0, 'calm_marble', TOP);
      pend(a, -5.9, -2.5, 2.1, Hc, 0.2); pend(a, -4.6, -2.5, 2.1, Hc, 0.2); pend(a, 5.25, 3.5, 2.0, Hc, 0.36); pend(a, 7, -4.6, 2.2, Hc, 0.3); pend(a, 0, -5.1, 2.3, Hc, 0.26);
      for (const q of [[-8.75, 6.2], [0, 6.2], [8.75, 6.2], [-1.75, 0.6], [5.25, 0.2], [-7, -5.6], [7, -6.6]]) lit(a, q[0], q[1], Hc, 1.5, 0.9);
      lift(a, { [WD]: 1.5, [WD2]: 1.3, [FLR]: 1.3 });
  });
  SPART.forEach(q => partWalk(STILT, q, 3.2)); for (const q of [[-8.75, -7], [-5.25, -7], [-5.25, -3.5]]) blk(STILT, q[0], q[1], 1.0);
  STILT.put('curved_sofa', -8.75, 3.5, { face: 90 }); STILT.put('coffee_table', -5.25, 3.5); STILT.put('psx_sofa_3', -1.75, 3.5, { face: 270 }); STILT.put('shag_rug', -5.25, 3.5, { y: 0.04 }); STILT.put('psx_book_mp_1', -5.1, 3.4, { y: 0.47, face: 70 }); STILT.put('sputnik_lamp', -5.25, 3.5, { y: 2.28 });
  STILT.put('decor_piano', 8.75, 3.5, { face: 270 }); STILT.put('instrument_guitar', 9.75, 1.5, { face: 250 }); STILT.put('psx_dinner_table_1', 5.25, 3.5); STILT.put('psx_chair_mp_3', 5.25, 2.35, { face: 180 }); STILT.put('psx_chair_mp_3', 5.25, 4.65, { face: 0 }); STILT.put('psx_chair_mp_3', 4.1, 3.5, { face: 90 });
  STILT.put('lava_lamp_floor', -9.6, 1.0); STILT.put('potted_plant', -9.6, 7.9); STILT.put('potted_plant', 9.6, 7.9); STILT.put('painting_seascape', 8.6, -1.6, { y: 1.3, face: 180 }); STILT.put('doormat', STILT.door.lx, 7.95);
  STILT.put('kitchen_range', -8.75, -8.1, { face: 180 }); STILT.put('range_hood', -8.75, -8.25, { face: 180 }); STILT.put('round_fridge', -5.05, -7.95, { face: 180 }); STILT.put('microwave', -7.4, -8.1, { y: 0.96, face: 180 }); STILT.put('pot_rack', -5.25, -2.5, { y: 2.75 });
  STILT.put('bar_stool', -5.9, -1.45, { face: 0 }); STILT.put('bar_stool', -4.6, -1.45, { face: 0 }); STILT.put('psx_plate_mp_1', -5.8, -2.4, { y: 1.07 }); STILT.put('retro_radio', -4.5, -2.6, { y: 1.07, face: 200 });
  STILT.put('psx_toilet_mp_1', -1.75, -7, { face: 180 }); STILT.put('shower_stall', 1.75, -7.85, { face: 180 }); STILT.put('sink', -3.2, -3.5, { face: 90 }); STILT.put('ebd_house_toilet_paper', -2.8, -7.6, { y: 0.8 });
  STILT.put('couples_bed', 8.75, -7, { face: 180 }); STILT.put('psx_bedside_table_1', 7.2, -7.9, { face: 180 }); STILT.put('mushroom_lamp', 7.2, -7.9, { y: 0.65 }); STILT.put('egg_chair', 8.75, -3.5, { face: 250 }); STILT.put('psx_carpet_mp_1', 6.6, -4.4, { y: 0.04, span: 2.6 });
  STILT.put('pool_lounger', -8.75, 10.5, { face: 180 }); STILT.put('pool_lounger', -5.25, 10.5, { face: 180 }); STILT.put('beach_cooler', -7.0, 10.9); STILT.put('psx_dinner_table_1', 8.75, 10.5); STILT.put('psx_chair_mp_3', 8.75, 9.4, { face: 180 }); STILT.put('psx_chair_mp_3', 7.6, 10.5, { face: 90 }); STILT.put('psx_chair_mp_3', 9.9, 10.5, { face: 270 });
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
  put('H07-02', 'signpost', 4, 10, { face: 180 }); tree('H09-02', 'palm', 9, 1, 4); tree('H09-02', 'palm', 9, 10, 4); put('H09-02', 'pool_umbrella', 10, 7); put('H09-02', 'pool_lounger', 10, 8, { face: 180 });
  put('H10-02', 'signpost', 4, 7, { face: 0 }); put('H11-02', 'signpost', 7, 7, { face: 90 });
  put('H12-02', 'rowboat', 1, 9, { face: 70 }); put('H12-02', 'pool_umbrella', 2, 8); tree('H12-02', 'palm', 8, 0, 8); dec('H12-02', 'ocean_rock', 3, 10);
  hillsInsides(ctx);
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
