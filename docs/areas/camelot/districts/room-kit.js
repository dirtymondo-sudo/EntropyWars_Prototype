/* room-kit.js — what the three woods' room designs share (N-room.js, W-room.js, F-room.js). Repo tooling only (2026-11-20, the world polish plan,
   thread 3 REDONE on mondo's word: "I still feel like they are too flat ... Where are the ridges and hills valleys? Thin trails off the main
   path? There are still just long straight wide pathways ... Disaster city elevation was done by giving different districts different height
   ranges, and allowing height ranges inside the plots too ... The point is to help the player orient themselves in the world").
   const K = require('./room-kit.js')(k)   (k = bake-camelot.js's design kit)
   K.levels(L, o)      THE BASE: L[row][col] = a plot's level in steps of 1.75 m (null = no plot: the nearest plot's). Flat over a plot, a grade
                       where two plots meet: o.gx = [a, b] / o.gy = [a, b] squares of the grade west / east (north / south) of the plot line.
                       o.roll = metres of rolling ground added on the plots o.rollOn(col, row) says (the new ones: an old plot's drawn rows
                       were made for level ground). Calls k.base(); returns the height function (squares -> metres).
   K.curve(pts, w, ch, sheet, o)   a WAY that winds: a smooth line through the points (square middles), swung side to side (o.amp squares,
                       o.wave squares a swing; 0 at both ends so junctions hold), stamped w squares wide. w 3 = a road, 2 = a trail, 1 = a thin trail.
                       Returns the squares it ran through (to stand things along it).
   K.arch(id, parts, each)   a drawn row anchored ON its parts (a row stands on the base at its ANCHOR: one row across the room floats or
                       sinks wherever the ground is not its anchor's). `each` = one row a part (a chain down a slope). */
'use strict';
module.exports = function (k) {
    const { r2, gx, gz } = k, N = 12, STEP = 1.75;
    const sm = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    const hash = (i, j, s) => { let n = (i * 374761393 + j * 668265263 + s * 1274126177) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const vnoise = (x, y, s) => { const i = Math.floor(x), j = Math.floor(y), u = sm(x - i), v = sm(y - j); return (hash(i, j, s) * (1 - u) + hash(i + 1, j, s) * u) * (1 - v) + (hash(i, j + 1, s) * (1 - u) + hash(i + 1, j + 1, s) * u) * v; };
    function levels(L, o) { o = o || {}; const rows = L.length, cols = L[0].length, GX = o.gx || [1.5, 1.5], GY = o.gy || [1.5, 1.5];
        const has = (c, r) => c >= 0 && r >= 0 && c < cols && r < rows && L[r][c] != null;
        const lv = (c, r) => { c = Math.max(0, Math.min(cols - 1, c)); r = Math.max(0, Math.min(rows - 1, r)); if (L[r][c] != null) return L[r][c];
            let best = 0, bd = 1e9; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (L[j][i] != null) { const d = (i - c) * (i - c) + (j - r) * (j - r); if (d < bd) { bd = d; best = L[j][i]; } } return best; };
        /* along one axis: which two plots a point lies between and how far (0 = the first, 1 = the second) */
        const ax = (p, G) => { const b = Math.round(p / N) * N, d = p - b; if (d >= -G[0] && d <= G[1]) return [b / N - 1, b / N, sm((d + G[0]) / (G[0] + G[1]))]; const c = Math.floor(p / N); return [c, c, 0]; };
        const fn = (x, y) => { const X = ax(x, GX), Y = ax(y, GY);
            let h = ((lv(X[0], Y[0]) * (1 - X[2]) + lv(X[1], Y[0]) * X[2]) * (1 - Y[2]) + (lv(X[0], Y[1]) * (1 - X[2]) + lv(X[1], Y[1]) * X[2]) * Y[2]) * STEP;
            if (o.roll) { const c = Math.floor(x / N), r = Math.floor(y / N), on = c2 => has(c2[0], c2[1]) && (!o.rollOn || o.rollOn(c2[0], c2[1]));
                /* the roll fades to nothing two squares inside a plot that does not roll, and on the room's own line */
                let w = 0; if (on([c, r])) { w = 1; const lx = x - c * N, ly = y - r * N; if (!on([c - 1, r])) w = Math.min(w, sm(lx / 2)); if (!on([c + 1, r])) w = Math.min(w, sm((N - lx) / 2)); if (!on([c, r - 1])) w = Math.min(w, sm(ly / 2)); if (!on([c, r + 1])) w = Math.min(w, sm((N - ly) / 2)); }
                if (w > 0) h += w * o.roll * ((vnoise(x / 6.5 + 3.1, y / 6.5 + 7.7, o.seed || 1) - 0.5) * 1.5 + (vnoise(x / 2.9 + 11.3, y / 2.9 + 1.9, (o.seed || 1) + 5) - 0.5) * 0.5); }
            return h; };
        k.base(fn); return fn; }
    function curve(pts, w, ch, sheet, o) { o = o || {}; const amp = o.amp == null ? 1.0 : o.amp, wave = o.wave || 9, ph = o.ph == null ? pts[0][0] * 0.7 + pts[0][1] * 0.3 : o.ph;
        const P = [pts[0]].concat(pts, [pts[pts.length - 1]]), S = [];
        for (let i = 1; i + 2 < P.length; i++) { const a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2], n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) * 4));
            for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t, f = q => 0.5 * ((2 * b[q]) + (-a[q] + c[q]) * t + (2 * a[q] - 5 * b[q] + 4 * c[q] - d[q]) * t2 + (-a[q] + 3 * b[q] - 3 * c[q] + d[q]) * t3); S.push([f(0), f(1)]); } }
        S.push(pts[pts.length - 1].slice());
        let len = 0; const D = [0]; for (let i = 1; i < S.length; i++) { len += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]); D.push(len); }
        const out = [], seen = new Set(); let px = null, py = null; const lo = -Math.floor((w - 1) / 2);
        const put = (x, y) => { for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) { const X = x + lo + dx, Y = y + lo + dy; if (k.plot(X, Y)) k.carve(X, Y, X + 1, Y + 1, ch || 'i', sheet); } const key = x + ':' + y; if (!seen.has(key)) { seen.add(key); out.push([x, y]); } };
        for (let i = 0; i < S.length; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
            const env = Math.min(1, D[i] / 3, (len - D[i]) / 3), off = amp * env * Math.sin(D[i] * 2 * Math.PI / wave + ph);
            const x = Math.floor(S[i][0] - ty / tl * off), y = Math.floor(S[i][1] + tx / tl * off);
            if (px != null && x !== px && y !== py) put(px, y);   // never corner to corner: a walker cannot pass a diagonal
            put(x, y); px = x; py = y; }
        return out; }
    function arch(id, parts, each) { if (!parts.length) return;
        if (each) { parts.forEach((p, i) => k.feat({ k: 'arch', id: id + '_' + i, x: r2(p.p[0]), z: r2(p.p[2]), rot: 0, y: 0, parts: [Object.assign({}, p, { p: [0, p.p[1], 0] })] })); return; }
        const cx = r2(parts.reduce((t, p) => t + p.p[0], 0) / parts.length), cz = r2(parts.reduce((t, p) => t + p.p[2], 0) / parts.length);
        k.feat({ k: 'arch', id, x: cx, z: cz, rot: 0, y: 0, parts: parts.map(p => Object.assign({}, p, { p: [r2(p.p[0] - cx), p.p[1], r2(p.p[2] - cz)] })) }); }
    /* things along a way: every `step` squares of the list a curve returned, `side` squares off it (on the first free square that way) */
    function along(list, step, side, fn) { for (let i = Math.floor(step / 2); i < list.length; i += step) { const a = list[Math.max(0, i - 2)], b = list[Math.min(list.length - 1, i + 2)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, s = (Math.floor(i / step) % 2 ? 1 : -1) * side;
            fn(list[i][0] + 0.5 - ty / tl * s, list[i][1] + 0.5 + tx / tl * s, i); } }
    return { levels, curve, arch, along, STEP };
};
