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
const ROUNDS = { mars: { fq: 36, center: 1, fill: '.', fillH: 0 }, saturn: { fq: 48, center: 5, fill: '.', fillH: -2 }, singularity: { fq: 36, center: 4, fill: 'c', fillH: 0, xToFill: true } };   // (the Singularity: its rock ring goes and the ball beyond the map is black glass, obsidian: the 'e' rim sheet, lava, does not draw on a walk's ground)
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
        cell[Y][X] = ch != null && !(o.xToFill && ch === 'x') ? (asChar ? asChar(ch) : ch) : o.fill; } }
    return { cell, H4 };
}
/* a door on the map (square sx, sy, face) → the net: its square, its face turned with the ground and snapped to a quarter turn */
function wayOnNet(K, sx, sy, face) { const q = K.sq(sx, sy); return { sx: Math.max(0, Math.min(K.W - 1, q.x)), sy: Math.max(0, Math.min(K.H - 1, q.y)), face: ((Math.round((face + q.turn) / 90) * 90) % 360 + 360) % 360 }; }
module.exports = { C, N, PL_FACES, ROUNDS, rmKit, sampleNet, wayOnNet, vnoise, v3 };
