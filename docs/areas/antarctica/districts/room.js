/* ANTARCTICA, THE ROOM DESIGN (2026-11-20, world polish thread 13; WORLD_POLISH_PLAN.md section 4, "HOW A BUILD THREAD USES A PLAN").
   The pieces that belong to the whole room, written in the room's own frame (squares sx 0..71 west to east, sy 0..71 north to south).
   THE PLAN IS READ, NOT RETYPED: every square below comes from mondo's approved height plan, docs/plans/world-polish/plans/antarctica.js,
   through the plan tool's own `build()` (docs/plans/world-polish/draw-plan.js). Change the plan, rerun `node bake-antarctica.js`.
   PASS 1, THE PILOT: THE ICE WALL (district W, rows 12 to 17 of squares + the icefall at its east foot).
   - THE WALK ON TOP: the plan's lane squares at level 31 (54.25 m) on the Wall's body are walked (`T`); the Wall's crest is built round them as
     Wall, and a crest corner beside the walk stands a low broken parapet (0.35 to 1.65 m) over it: you see out over it.
   - THE WEST STAIR: the plan's `e` squares, three flights cut in the face (20 levels, one a square), each flight one stair row (`stone`:
     a precast flight in the room's own ice sheets); its landings are flat.
   - THE ICE ARCH over the Gap (the Gap grown to three squares): a slab of ice 2.4 m thick at the walk's height from abutment to abutment.
   - THE ICEFALL: fallen blocks heaped against the Wall's east foot (level 13), reached by jumping up a chain of blocks; a fixed rope runs from
     the heap up the face to the walk (31.5 m: the found way up the Wall).
   - THE COVE LANDING (found 11-20 with the game's own walk solver: a player off the boat from Pirates' Cove reached 8 nodes and nothing else):
     the plan's cut step joins it to the shelf. */
'use strict';
const path = require('path');
const PLANTOOL = require(path.join(__dirname, '..', '..', '..', 'plans', 'world-polish', 'draw-plan.js'));
const PLAN = require(path.join(__dirname, '..', '..', '..', 'plans', 'world-polish', 'plans', 'antarctica.js'));
const LV = 1.75, TOP_LV = 31, SINK = 0.15;
const B = PLANTOOL.build(Object.assign({}, PLAN, { underlay: false }));   // the plan's own squares (its underlay is today's room: not needed here)
if (B.FAIL.length) throw new Error('the Antarctica plan does not build: ' + B.FAIL.slice(0, 3).join(' | '));
const T = (x, y) => B.T[y][x], L = (x, y) => B.L[y][x];
const WALL_ROWS = [12, 17];
/* the stair's steps, in order: the plan's `stairs` pairs whose two squares are both `e` (prev = the lower square) */
const PREV = new Map();
(PLAN.stairs || []).forEach(([a, b]) => { if (T(a[0], a[1]) !== 'e' || T(b[0], b[1]) !== 'e') return; const lo = L(a[0], a[1]) < L(b[0], b[1]) ? a : b, hi = lo === a ? b : a; PREV.set(hi[0] + ',' + hi[1], lo); });

exports.plan = ctx => {
    const { cell, surface, link, setRect, feat, gx, gc, r2, taken, W } = ctx;
    const TOP = TOP_LV * LV;
    /* THE GAP, grown to three squares: the plan's open squares through the Wall's body that are not on it */
    for (let y = WALL_ROWS[0]; y <= WALL_ROWS[1]; y++) for (let x = 0; x < W; x++) { const t = T(x, y);
        if (t === 'p' || t === 'u' || t === 'P') cell[y][x] = 'p';
        else if (t === 'r') { if (cell[y][x] !== 'x') cell[y][x] = 'x'; } }
    /* THE WALK ON TOP: the lane squares at level 31 */
    for (let y = WALL_ROWS[0]; y <= WALL_ROWS[1]; y++) for (let x = 0; x < W; x++) if ((T(x, y) === 'd' || T(x, y) === 'D') && L(x, y) === TOP_LV) surface(x, y, TOP, 'T');
    /* THE WEST STAIR: a step rises from its lower neighbour's side (one level over the square); a square with no lower step is a flat landing */
    const steps = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { if (T(x, y) !== 'e') continue; const l = L(x, y), p = PREV.get(x + ',' + y);
        if (p && L(p[0], p[1]) === l - 1) { const dx = x - p[0], dy = y - p[1], lo = (l - 1) * LV - SINK, hi = l * LV - SINK;   // corners [nw, ne, sw, se]; the field 15 cm under the flight row, so the flight is the surface (the game's exact pieces)
            surface(x, y, dx ? (dx > 0 ? [lo, hi, lo, hi] : [hi, lo, hi, lo]) : (dy > 0 ? [lo, lo, hi, hi] : [hi, hi, lo, lo]), 'T'); steps.push({ x, y, dx, dy, l }); }
        else surface(x, y, l * LV, 'T');
        taken.add(x + ':' + y); }
    /* each straight run of steps = one flight (a stair row: the walk reads its slope, the renderer draws its steps) */
    steps.sort((a, b) => a.l - b.l); const runs = [];
    steps.forEach(s => { const r = runs[runs.length - 1], q = r && r[r.length - 1];
        if (q && q.dx === s.dx && q.dy === s.dy && q.l === s.l - 1 && q.x + s.dx === s.x && q.y + s.dy === s.y) r.push(s); else runs.push([s]); });
    runs.forEach((r, i) => { const a = r[0], b = r[r.length - 1];
        const x0 = a.dx ? gx(a.x + (a.dx > 0 ? 0 : 1)) : gc(a.x), z0 = a.dy ? gx(a.y + (a.dy > 0 ? 0 : 1)) : gc(a.y);
        const x1 = b.dx ? gx(b.x + (b.dx > 0 ? 1 : 0)) : gc(b.x), z1 = b.dy ? gx(b.y + (b.dy > 0 ? 1 : 0)) : gc(b.y);
        feat({ k: 'ramp', id: 'ant:weststair:' + 'ABCDEFG'[i], absY: true, x0, z0, x1, z1, w: 3.5, h0: r2((a.l - 1) * LV), h1: r2(b.l * LV), stairs: true, model: 'stone', edge: 0.01 }); });
    /* THE ICE ARCH over the Gap: the plan's bridges (abutment square to abutment square), one slab at the walk's height */
    (PLAN.bridges || []).forEach(([a, b], i) => { if (L(a[0], a[1]) !== TOP_LV) return; link(a, b); });
    const br = (PLAN.bridges || []).filter(([a]) => L(a[0], a[1]) === TOP_LV);
    if (br.length) { const xs = br.map(q => q[0][0]).concat(br.map(q => q[1][0])), ys = br.map(q => q[0][1]);
        const xa = Math.min(...xs), xb = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        feat({ k: 'bridge', id: 'ant:arch', absY: true, x0: r2(gx(xa + 1) - 0.4), z0: r2(gx((y0 + y1 + 1) / 2)), x1: r2(gx(xb) + 0.4), z1: r2(gx((y0 + y1 + 1) / 2)), w: (y1 - y0 + 1) * 3.5, y: TOP, thick: 2.4, plain: true, rails: false, key: 'ice_1' }); }
    /* THE ICEFALL: the plan's open ground at level 13 at the Wall's east foot = the heap's top; the found way's blocks below it step up a jump at a time */
    const fall = []; for (let y = 18; y <= 23; y++) for (let x = 60; x < W; x++) if (T(x, y) === 'g' && L(x, y) === 13) fall.push([x, y]);
    fall.forEach(([x, y]) => surface(x, y, 13 * LV, 'i'));
    const FALL_FOUND = (PLAN.found || []).find(f => /icefall's blocks/.test(f.name)), ROPE = (PLAN.found || []).find(f => /THE ICEFALL/.test(f.name));
    if (FALL_FOUND) { const [fx, fy] = FALL_FOUND.from, g = ctx.groundAt(fx, fy + 1), d = (13 * LV - g) / 4;   // THE CHAIN: three blocks up from the snow below (fx, fy + 1) to the heap, a jump each (under 1.3 m)
        [[fx, fy], [fx, fy - 1], [fx + 1, fy - 1]].forEach(([x, y], i) => { surface(x, y, r2(g + d * (i + 1)), 'i'); taken.add(x + ':' + y); }); }
    if (ROPE) { const [rx, ry] = ROPE.from; feat({ k: 'climb', id: 'ant:icefall:rope', x: gc(rx), z: gx(ry), face: 0, look: 'rope', y0: 13 * LV, y1: TOP }); link(ROPE.from, ROPE.to); taken.add(rx + ':' + ry); }
    /* THE COVE LANDING: the plan's cut step (open ground at level 1 round the boat's landing) */
    for (let y = 60; y < W; y++) for (let x = 58; x < W; x++) if (T(x, y) === 'g' && L(x, y) === 1 && 'zi'.indexOf(cell[y][x]) >= 0) cell[y][x] = 'i';
};

/* THE LOOK of the pilot's pieces (drawn parts on the squares the plan made) */
exports.pieces = ctx => {
    const { look, gx, gc, r2, cell, W, COR, WD2, OVR } = ctx;
    const TOP = TOP_LV * LV, ICE = 'ice_1', PALE = 0xdcecf8, BLUE = 0xa8d4f0;
    /* THE ARCH: the slab is the walk; under it the haunches, ice blocks wedged into each side of the Gap, so it reads as an arch, not a plank */
    const arch = (PLAN.bridges || []).filter(([a]) => L(a[0], a[1]) === TOP_LV);
    if (arch.length) { const xa = arch[0][0][0], xb = arch[0][1][0], ys = arch.map(q => q[0][1]), zm = gx((Math.min(...ys) + Math.max(...ys) + 1) / 2), span = (xb - xa - 1) * 3.5;
        look('arch', (gx(xa + 1) + gx(xb)) / 2, zm, 0, a => {
            for (let k = 0; k < 5; k++) { const t = k / 5, w = span / 2 * (1 - Math.sqrt(1 - t * t)) + 0.4, h = 3.2 + k * 1.9;   // stepped haunches, deeper toward the sides
                [-1, 1].forEach(sg => a.box(sg * (span / 2 - w / 2), -2.4 - h, 0, w, h, 6.6, ICE, k % 2 ? PALE : BLUE)); }
            /* a rope on stakes along both edges of the deck */
            [-3.35, 3.35].forEach(z => { for (let x = -span / 2; x <= span / 2 + 0.01; x += span / 3) a.cyl(x, 0, z, 0.05, 1.15, WD2, 0x5a4630); a.box(0, 1.0, z, span, 0.04, 0.04, WD2, 0xd08030); });
        }, TOP); }
    /* THE WALK'S MARKER WANDS (the traverse's own, up top): a bamboo wand with an orange flag on every fourth square of the walk's south edge,
       one drawn row a plot (a row's parts stay near its middle), standing at the walk's height */
    const wands = {};
    let k = 0;
    for (let x = 0; x < W; x++) for (let y = 13; y <= 16; y++) { const o = OVR.get(y * W + x); if (cell[y][x] !== 'T' || !o || o[0] !== TOP || cell[y + 1][x] === 'T') continue;
        if (k++ % 4) continue; const px = Math.floor(x / 12); (wands[px] = wands[px] || []).push([gc(x), r2(gx(y + 1) - 0.6)]); }
    Object.keys(wands).forEach(px => { const cx = gc(+px * 12 + 6), cz = gx(15);
        look('wands' + px, cx, cz, 0, a => wands[px].forEach(([x, z], i) => { const lx = r2(x - cx), lz = r2(z - cz);
            a.cyl(lx, 0, lz, 0.03, 2.1, WD2, 0xc8b070); a.box(lx + 0.24, 1.72, lz, 0.46, 0.32, 0.02, 'marble_light', i % 2 ? 0xff7a1a : 0xff4a1a, { gain: 1.6 }); }), TOP); });
};

exports.dress = ctx => {
    const { props, gc, r2, cell } = ctx;
    const TOP = TOP_LV * LV, HEAP = 13 * LV;
    /* THE ICEFALL: blocks of the Wall that came down (`ice_block`), heaped against its foot (the heap's squares are the plan's level 13) and spilled round it */
    [[65, 18, 6.5, 20], [67, 18, 7.5, 200], [69, 18, 5.5, 75], [68, 19, 3.2, 140], [69, 20, 3.8, 35]].forEach(([x, y, h, f]) => props.push({ key: 'ice_block', x: r2(gc(x) + 0.3), z: r2(gc(y) - 0.4), y: HEAP, h, face: f }));
    [[63, 19, 2.6, 50], [70, 21, 3.4, 260], [65, 23, 1.8, 110], [62, 20, 1.4, 10]].forEach(([x, y, h, f]) => props.push({ key: 'ice_block', x: gc(x), z: gc(y), h, face: f }));
    props.push({ key: 'snow_heap', x: gc(67), z: gc(21), face: 30 });
    /* the lookouts the plan names on the walk: a cairn at each */
    (PLAN.lookouts || []).forEach(l => { const [x, y] = l.at; if (cell[y] && cell[y][x] === 'T') props.push({ key: 'cairn', x: r2(gc(x) + 1.1), z: r2(gc(y) - 1.1), y: TOP, face: 20 }); });
    /* the stair's foot: the coil of the fixed line; the icefall's tools at the rope's foot */
    props.push({ key: 'rope_coils', x: gc(13) + 0.8, z: gc(18), face: 30 });
    props.push({ key: 'ice_axe', x: gc(65), z: gc(18) + 0.9, y: HEAP, face: 70 }, { key: 'rope_coils', x: r2(gc(66) + 1), z: gc(19), y: HEAP, face: 200 });
};
