/* space-ball.js — THE ROUND WORLDS' MAP KIT (2026-11-17), shared by draw-space.js (the plan + its picture) and bake-space.js (the room).
   A world laid as a flat map (Mars, Saturn, the Singularity) goes onto a ball whose net is 3 x 2 faces of `fq` squares (the face table is
   three-renderer.js THE ROUND WORLDS'). The map is wrapped round the ball from the middle of one face (`center`) at its true size (the
   azimuthal equidistant layout: every distance from the map's middle is kept), so each net square reads the ground under it on the map and
   the ground meets itself over every seam with no stitching. Ground beyond the map's edge is `fill`. Repo-only tooling (not a game file). */
'use strict';
const C = 3.5, N = 12;
const PL_FACES = [[[-1, 0, 0], [0, 0, 1], [0, -1, 0]], [[0, 0, 1], [1, 0, 0], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, -1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, -1, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, -1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]];
const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, f = t => t * t * (3 - 2 * t);
    return (hash(xi, yi, s) * (1 - f(u)) + hash(xi + 1, yi, s) * f(u)) * (1 - f(v)) + (hash(xi, yi + 1, s) * (1 - f(u)) + hash(xi + 1, yi + 1, s) * f(u)) * f(v); };
/* which worlds go round: fq = a face's squares, center = the face the map's middle sits on (1 = the face you meet first, 5 = the north
   pole, 4 = the south pole), fill / fillH = the ground beyond the map, xToFill = the map's rock becomes fill too */
/* BIGGER (2026-11-17, mondo: "i wouldnt mind if they were bigger, especially relative to each other (saturn should be bigger than the moon
   obviously)"): the Moon keeps its 24 (R 53 m), Mars 36 -> 48 (R 107 m, twice the Moon as it is), the Singularity 36 -> 48, Saturn 48 -> 96
   (R 214 m, four Moons). `band(d)` = the ground beyond the map by where it lies on the ball. */
const LATLON = d => [Math.asin(Math.max(-1, Math.min(1, d[1]))) * 180 / Math.PI, Math.atan2(d[2], d[0])];
/* PASS 2 (2026-11-17, mondo: "they all need another pass because they do not look good from afar ... saturn need to be a lot more epic and
   detailed ... its hexagonal storm at the pole"): the ground beyond a map is drawn for the eye far off. MARS: white caps on both poles (`w`)
   and dark country (`d`) by a slow noise. SATURN: THE HEXAGON STORM, six-sided rings of cloud round the pole out to 47 degrees north, a
   black wall of storm (`k`) hard against the rim walk and a thin one further out; then belts in three tones (gold deck `.`, pale cloud `b`,
   dark `d`) with white storm ovals in the dark belts, and a dark cap on the south pole. Every square of it is walked. */
const SAT_R = 2 * 96 * C / Math.PI;
const SAT_BELTS = [[0, 3.5, 'b'], [3.5, 8, '.'], [8, 13.5, 'd'], [13.5, 17, '.'], [17, 21, 'b'], [21, 24.5, 'd'], [24.5, 30, '.'], [30, 33, 'b'], [33, 38, 'd'], [38, 44, '.'], [44, 47.5, 'b'], [47.5, 52, 'd'], [52, 60, '.'], [60, 64, 'b'], [64, 72, '.'], [72, 91, 'd']];
const SAT_OVALS = [[-10.5, 0.6, 9, 2.6], [-10.8, 3.9, 5, 2], [22.6, 2.2, 6, 1.7], [-35.5, -1.4, 7, 2.2], [-35.2, 1.9, 4, 1.6], [10.6, -2.5, 4.5, 1.8], [-49.5, 0.2, 5, 1.8]];   // [lat, lon (rad), half width, half height] degrees
const ROUNDS = {
    mars: { fq: 48, center: 1, fill: '.', fillH: 0,
        band: d => { const [lat] = LATLON(d), n = vnoise(d[0] * 2.3 + 11, d[1] * 2.3 + d[2] * 1.9 + 3, 17) * 0.65 + vnoise(d[0] * 6.1 + 2, d[2] * 6.1 + d[1] * 5.3, 23) * 0.35;
            if (Math.abs(lat) + (n - 0.5) * 14 > 72) return 'w';
            return n > 0.6 && Math.abs(lat) < 58 ? 'd' : '.'; } },
    saturn: { fq: 96, center: 5, fill: '.', fillH: -2, xToFill: true,   // (11-17: the storm walls of rock are gone: a square crown of grey rock on the pole, and 80 plots nobody reached)
        band: d => { const [lat, lon] = LATLON(d);
            /* the hexagon: squares from the pole, in the map's own six-sided measure (flat sides north and south, as the rim walk) */
            const rs = Math.acos(Math.max(-1, Math.min(1, d[1]))) * SAT_R / C, hl = Math.hypot(d[0], d[2]) || 1, px = rs * d[0] / hl, pz = rs * d[2] / hl, hx = Math.max(Math.abs(pz), Math.abs(pz) * 0.5 + Math.abs(px) * 0.8660254);
            if (hx < 46) return hx < 24.5 ? 'k' : hx < 29 ? '.' : hx < 33 ? 'b' : hx < 36 ? 'd' : hx < 40 ? '.' : hx < 41.5 ? 'k' : hx < 44 ? 'b' : '.';
            for (const o of SAT_OVALS) { let dl = lon - o[1]; dl = Math.atan2(Math.sin(dl), Math.cos(dl)) * 180 / Math.PI * Math.cos(lat * Math.PI / 180); if (Math.pow(dl / o[2], 2) + Math.pow((lat - o[0]) / o[3], 2) < 1) return 'b'; }
            const a = Math.abs(lat + 1.1 * Math.sin(lon * 3 + lat * 0.2) + 0.6 * Math.sin(lon * 8 + 1));
            for (const q of SAT_BELTS) if (a >= q[0] && a < q[1]) return (lat < 0 && q[2] === 'b' && a > 40) ? '.' : q[2];
            return '.'; } },
    singularity: { fq: 48, center: 4, fill: 'c', fillH: 0, xToFill: true } };   // (the Singularity: its rock ring goes and the ball beyond the map is black glass, obsidian: the 'e' rim sheet, lava, does not draw on a walk's ground)
const v3 = { dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], add: (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
function rmKit(fq, center, W0, H0) {
    const R = 2 * fq * C / Math.PI, F = PL_FACES[center], n = F[0], U = F[1], V = F[2], cx0 = W0 / 2, cy0 = H0 / 2, PI4 = Math.PI / 4;
    /* the net's (X, Y) (squares, continuous) → the ball's direction; the face is given (a point on a face's edge belongs to both) */
    const dirAt = (k, X, Y) => { const f = PL_FACES[k], a = (X - (k % 3) * fq) / fq * 2 - 1, b = (Y - Math.floor(k / 3) * fq) / fq * 2 - 1;
        return v3.norm([0, 1, 2].map(i => f[0][i] + f[1][i] * Math.tan(a * PI4) + f[2][i] * Math.tan(b * PI4))); };
    /* a direction → the net's (X, Y) on the face it is most on (or on face k, run on past its edge) */
    const netAt = (d, kIn) => { let k = kIn; if (k == null) { let best = -2; for (let i = 0; i < 6; i++) { const q = v3.dot(d, PL_FACES[i][0]); if (q > best) { best = q; k = i; } } }
        const f = PL_FACES[k], dn = v3.dot(d, f[0]), a = Math.atan(v3.dot(d, f[1]) / dn) / PI4, b = Math.atan(v3.dot(d, f[2]) / dn) / PI4;
        return { k, X: (k % 3) * fq + (a + 1) / 2 * fq, Y: Math.floor(k / 3) * fq + (b + 1) / 2 * fq }; };
    /* the map's (x, y) (squares) → the ball's direction, and back */
    const fwd = (x, y) => { const dx = x - cx0, dy = y - cy0, dl = Math.hypot(dx, dy); if (dl < 1e-9) return n.slice(); const th = dl * C / R, t = v3.norm(v3.add(v3.add([0, 0, 0], U, dx), V, dy));
        return v3.norm(v3.add(n.map(q => q * Math.cos(th)), t, Math.sin(th))); };
    const back = d => { const c = Math.max(-1, Math.min(1, v3.dot(d, n))), th = Math.acos(c), t = v3.add(d, n, -c), tl = Math.hypot(t[0], t[1], t[2]); if (tl < 1e-9) return [cx0, cy0];
        const s = th * R / C / tl; return [cx0 + v3.dot(t, U) * s, cy0 + v3.dot(t, V) * s]; };
    /* a point of the map (x, y continuous squares) → the net's continuous (X, Y) + the turn (degrees, clockwise) of the ground there */
    const pt = (x, y) => { const p = netAt(fwd(x, y)), q = netAt(fwd(x + 0.5, y), p.k); return { X: p.X, Y: p.Y, k: p.k, turn: Math.atan2(q.Y - p.Y, q.X - p.X) * 180 / Math.PI }; };
    /* the map's square (x, y) → the net's square + the turn */
    const sq = (x, y) => { const q = pt(x + 0.5, y + 0.5); return { x: Math.floor(q.X), y: Math.floor(q.Y), X: q.X, Y: q.Y, turn: q.turn }; };
    /* a net square's middle → the map's (x, y) (continuous squares) */
    const fromNet = (X, Y) => { const k = Math.floor(Y / fq) * 3 + Math.floor(X / fq); return back(dirAt(k, X, Y)); };
    return { R, fq, dirAt, netAt, fwd, back, pt, sq, fromNet, W: 3 * fq, H: 2 * fq };
}
/* the ground of the net: every square reads the map square under its middle (its char) and its four corners (heights, bilinear in that
   square); beyond the map, `fill` at fillH with a little roll. A = { W, H, cell(x, y) → char, h4(x, y) → [4] }; `asChar` maps a map char */
function sampleNet(o, K, A, asChar) {
    const inMap = (x, y) => x >= 0 && y >= 0 && x < A.W && y < A.H;
    const fillH = d => o.fillH + 0.6 * (vnoise(d[0] * 9 + 7, d[1] * 9 + d[2] * 5, 31) - 0.5);
    const cell = [], H4 = [];
    for (let Y = 0; Y < K.H; Y++) { cell.push(new Array(K.W)); H4.push(new Array(K.W)); for (let X = 0; X < K.W; X++) {
        const k = Math.floor(Y / K.fq) * 3 + Math.floor(X / K.fq), [ox, oy] = K.back(K.dirAt(k, X + 0.5, Y + 0.5)), sx = Math.floor(ox), sy = Math.floor(oy);
        const crn = [[X, Y], [X + 1, Y], [X, Y + 1], [X + 1, Y + 1]].map(([cx, cy]) => { const d = K.dirAt(k, cx, cy), [qx, qy] = K.back(d);
            if (!inMap(sx, sy)) return inMap(Math.floor(qx), Math.floor(qy)) ? (() => { const q = A.h4(Math.floor(qx), Math.floor(qy)); return (q[0] + q[1] + q[2] + q[3]) / 4; })() : fillH(d);
            const fx = Math.max(0, Math.min(1, qx - sx)), fy = Math.max(0, Math.min(1, qy - sy)), q = A.h4(sx, sy);
            return (q[0] * (1 - fx) + q[1] * fx) * (1 - fy) + (q[2] * (1 - fx) + q[3] * fx) * fy; });
        H4[Y][X] = crn.map(h => Math.round(h * 100) / 100);
        const ch = inMap(sx, sy) ? A.cell(sx, sy) : null;
        cell[Y][X] = ch != null && !(o.xToFill && ch === 'x') ? (asChar ? asChar(ch) : ch) : (o.band ? o.band(K.dirAt(k, X + 0.5, Y + 0.5)) : o.fill); } }
    return { cell, H4 };
}
/* a door on the map (square sx, sy, face) → the net: its square, its face turned with the ground and snapped to a quarter turn */
function wayOnNet(K, sx, sy, face) { const q = K.sq(sx, sy); return { sx: Math.max(0, Math.min(K.W - 1, q.x)), sy: Math.max(0, Math.min(K.H - 1, q.y)), face: ((Math.round((face + q.turn) / 90) * 90) % 360 + 360) % 360 }; }
module.exports = { C, N, PL_FACES, ROUNDS, rmKit, sampleNet, wayOnNet, vnoise, v3 };
