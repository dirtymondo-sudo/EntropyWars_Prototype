/* THE SIGN CHECK (2026-11-22, the signage pass; mondo: "the signs are clipping into stuff ... The signs should make logical sense ...
   You need to think like an actual city planner"). Repo tooling, run by bake-disaster-city.js after every district and the billboards.
   What it knows: every drawn surface of the city as a testable solid (an arch row's box / cyl / poly parts and its standing quads, a
   skinned texbuilding), in the renderer's own frames (three-renderer.js `_hqArchGeometry`: a part's `ry`, then its row's `rot`).
   What it does (`fix`): every outdoor 'txt:' sign is looked at from the front, at three points across its middle line. A sign that sits
   INSIDE a wall, or has a surface standing within 0.6 m in front of it, is drawn out along its own facing to 2 cm past that surface,
   when half a metre of clear air waits there within 1.6 m; a sign that cannot be cleared is only listed. No sign is renamed or turned,
   and no district file is edited: a district thread that adds signs just rebakes. The one thing taken out is a TWIN: a smaller lettering
   left lying under a larger one on the same face (see THE TWINS).
   The list: docs/disaster-city/sign-check.txt (moved / left as they stand, with the surface in the way).
   Never looked at: a room's inside rows (`…:in`, `…-in`), letters set back to back on a blade (a 'txt:' quad never blocks another),
   posts and brackets under 12 cm. */
'use strict';
const D2R = Math.PI / 180;
/* a row's parts as the renderer lays them: `ring` and `n` / `step` copies (an `along` part follows a path: not read) */
function expand(row) { const parts = [];
    (row.parts || []).forEach(p0 => { if (!p0 || !p0.s || p0.along) return; let list = [p0];
        if (p0.ring && p0.ring.n > 0) { list = []; for (let i = 0; i < p0.ring.n; i++) { const a = ((p0.ring.a0 || 0) + (p0.ring.arc || 360) * i / (p0.ring.arc && p0.ring.arc < 360 ? Math.max(1, p0.ring.n - 1) : p0.ring.n)) * D2R, pp = p0.p || [0, 0, 0];
            list.push(Object.assign({}, p0, { p: [pp[0] + Math.cos(a) * p0.ring.r, pp[1], pp[2] + Math.sin(a) * p0.ring.r], ry: (p0.ry || 0) + 90 - a / D2R, ring: null })); } }
        list.forEach(p1 => { const n = Math.max(1, Math.min(200, Math.round(p1.n || 1))), st = p1.step || [0, 0, 0], q = p1.p || [0, 0, 0];
            for (let k = 0; k < n; k++) parts.push({ P: n > 1 ? Object.assign({}, p1, { p: [q[0] + st[0] * k, q[1] + st[1] * k, q[2] + st[2] * k] }) : p1, src: p0, one: list.length === 1 && n === 1 }); }); });
    return parts; }
/* a part's frame: its own metres <-> the room's; n = the way its front (+z) looks */
function frame(row, P) { const rc = Math.cos(-(row.rot || 0) * D2R), rs = Math.sin(-(row.rot || 0) * D2R), pc = Math.cos(-(P.ry || 0) * D2R), ps = Math.sin(-(P.ry || 0) * D2R), pp = P.p || [0, 0, 0], y0 = (row.y || 0) + (row.base || 0);
    return { toWorld(v) { const lx = pp[0] + v[0] * pc + v[2] * ps, lz = pp[2] - v[0] * ps + v[2] * pc; return [row.x + lx * rc + lz * rs, y0 + pp[1] + v[1], row.z - lx * rs + lz * rc]; },
        toLocal(w) { const dx = w[0] - row.x, dz = w[2] - row.z, lx = dx * rc - dz * rs, lz = dx * rs + dz * rc, u = lx - pp[0], q = lz - pp[2]; return [u * pc - q * ps, w[1] - y0 - pp[1], u * ps + q * pc]; },
        n: [ps * rc + pc * rs, 0, -ps * rs + pc * rc],
        /* the row's own frame (to write a moved part back): a room-metres direction as the row sees it */
        rowDir(d) { return [d[0] * rc - d[2] * rs, 0, d[0] * rs + d[2] * rc]; } }; }
const isTxt = P => /^txt:/.test(String(P.key || ''));
const inRow = row => /(:in|-in)(:|$)/.test(String(row.id || ''));
/* every surface of the city */
function solids(rows) { const L = [];
    rows.forEach(row => { if (!row || row.k === 'gone' || typeof row.x !== 'number') return;
        if (row.k === 'texbuilding' && row.skin !== false) { const P = { s: 'box', p: [0, 0, 0], size: [row.w, row.h || (row.storeys || 1) * 3.5, row.d] }; L.push({ row, P, src: P, F: frame(row, P), R: Math.hypot(row.w, row.d) / 2 + 1, c: [row.x, row.z] }); }
        if (row.k !== 'arch') return;
        expand(row).forEach(e => { const P = e.P, F = frame(row, P), S = P.size || [1, 1, 1]; let R;
            if (P.s === 'box') R = Math.hypot(S[0], S[2]) / 2; else if (P.s === 'quad') { if (P.flat) return; R = S[0] / 2; }
            else if (P.s === 'cyl') { if (P.ri || (P.arc && P.arc < 360)) return; R = Math.max(+P.r || 1, P.r2 != null ? +P.r2 : 0); if (R < 0.12) return; }
            else if (P.s === 'poly') R = Math.max.apply(null, (P.pts || [[0, 0]]).map(q => Math.hypot(q[0], q[1]))); else return;
            const c = F.toWorld([0, 0, 0]); L.push({ row, P, src: e.src, F, R: R + 0.5, c: [c[0], c[2]] }); }); });
    return L; }
const near = (L, x, z, R) => L.filter(s => Math.hypot(s.c[0] - x, s.c[1] - z) < s.R + R);
function inside(s, w) { const P = s.P, v = s.F.toLocal(w), S = P.size || [1, 1, 1];
    if (P.s === 'box') return Math.abs(v[0]) <= S[0] / 2 && v[1] >= 0 && v[1] <= S[1] && Math.abs(v[2]) <= S[2] / 2;
    if (P.s === 'cyl') { const h = +P.h || 1; if (v[1] < 0 || v[1] > h) return false; const r = +P.r || 1, r2 = P.r2 != null ? +P.r2 : r, rr = r + (r2 - r) * v[1] / h; return v[0] * v[0] + v[2] * v[2] <= rr * rr; }
    if (P.s === 'poly') { const h = +P.h || 1; if (v[1] < 0 || v[1] > h) return false; const pts = P.pts || []; let sg = 0;
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], cr = (b[0] - a[0]) * (v[2] - a[1]) - (b[1] - a[1]) * (v[0] - a[0]); if (Math.abs(cr) < 1e-9) continue; if (!sg) sg = Math.sign(cr); else if (Math.sign(cr) !== sg) return false; }
        return pts.length >= 3; }
    return false; }
function crossQuad(s, w0, w1) { const P = s.P, a = s.F.toLocal(w0), b = s.F.toLocal(w1); if ((a[2] > 0) === (b[2] > 0)) return false;
    const f = a[2] / (a[2] - b[2]), x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, S = P.size || [1, 1]; if (Math.abs(x) > S[0] / 2 || y < 0 || y > S[1]) return false;
    if (P.hole && Math.abs(x - P.hole[0]) < P.hole[1] / 2 && y < P.hole[2]) return false; return true; }
/* the first surface met going from w along dir (a unit, level) between t0 and t1 metres (t1 < t0 = backwards); skip(s) = a solid not to count.
   A solid's surface = going into it or out of it (a building's shell is a box: a point inside it is in a room, not in a wall). */
function cast(L, w, dir, t0, t1, skip) { const step = 0.04, lst = L.filter(s => Math.hypot(s.c[0] - w[0], s.c[1] - w[2]) < s.R + Math.abs(t1) + Math.abs(t0) + 0.2 && !(skip && skip(s)));
    const n = Math.ceil(Math.abs(t1 - t0) / step), sg = t1 > t0 ? 1 : -1; let prev = [w[0] + dir[0] * t0, w[1], w[2] + dir[2] * t0];
    const st = lst.map(s => s.P.s === 'quad' ? false : inside(s, prev));
    for (let i = 1; i <= n; i++) { const t = t0 + sg * step * i, p = [w[0] + dir[0] * t, w[1], w[2] + dir[2] * t];
        for (let k = 0; k < lst.length; k++) { const s = lst[k]; if (s.P.s === 'quad') { if (crossQuad(s, prev, p)) return { t, s }; } else if (inside(s, p) !== st[k]) return { t, s, exit: st[k] }; }
        prev = p; }
    return null; }
/* THE CLEARANCE: rows = the city's rows. Returns { signs, moved, left, lines }. */
function fix(rows, opt) { opt = opt || {};
    const L = solids(rows), K = { signs: 0, moved: 0, left: 0, lines: [] }, REACH = 0.6, FAR = 1.6, AIR = 0.5;
    rows.forEach(row => { if (!row || row.k !== 'arch' || inRow(row) || typeof row.x !== 'number') return;
        /* THE TWINS: two signs of one row on one plane, facing the same way, one lying over the other (a later pass lettered a blade again and the
           first lettering stayed under it: the cinema's fin read C over N over I). The smaller one is the leftover: taken out. */
        { const T = expand(row).filter(e => e.one && isTxt(e.P) && e.P.s === 'quad' && !e.P.flat && e.P.size).map(e => { const F = frame(row, e.P); return { e, F, c: F.toWorld([0, e.P.size[1] / 2, 0]), a: e.P.size[0] * e.P.size[1] }; });
          const gone = new Set();
          for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const A = T[i], B = T[j]; if (gone.has(A.e.src) || gone.has(B.e.src)) continue;
              if (A.F.n[0] * B.F.n[0] + A.F.n[2] * B.F.n[2] < 0.95) continue; const v = A.F.toLocal(B.c); if (Math.abs(v[2]) > 0.08) continue;
              const ox = Math.min(A.e.P.size[0] / 2, v[0] + B.e.P.size[0] / 2) - Math.max(-A.e.P.size[0] / 2, v[0] - B.e.P.size[0] / 2), oy = Math.min(A.e.P.size[1], v[1] + B.e.P.size[1] / 2) - Math.max(0, v[1] - B.e.P.size[1] / 2);
              if (ox <= 0 || oy <= 0 || ox * oy < 0.25 * Math.min(A.a, B.a)) continue;
              const small = A.a < B.a ? A : B, big = small === A ? B : A; gone.add(small.e.src); K.twins = (K.twins || 0) + 1;
              K.lines.push('TWIN ' + JSON.stringify(String(small.e.P.key).split('|')[0].slice(4)) + ' on ' + row.id + ' at ' + small.c.map(q => Math.round(q * 10) / 10).join(', ') + ': lay under ' + JSON.stringify(String(big.e.P.key).split('|')[0].slice(4)) + ' on the same face: the smaller lettering taken out'); }
          if (gone.size) row.parts = row.parts.filter(p => !gone.has(p)); }
        expand(row).forEach(e => { const P = e.P; if (!isTxt(P) || P.s !== 'quad' || P.flat || !P.size) return; K.signs++;
            const F = frame(row, P), S = P.size, c = F.toWorld([0, S[1] / 2, 0]);
            const lst = near(L, c[0], c[2], S[0] / 2 + FAR + AIR + 0.5).filter(s => s.src !== e.src && !(s.P.s === 'quad' && (isTxt(s.P) || s.P.kind === 'over')));
            const pts = [0, -0.35, 0.35].map(u => F.toWorld([u * S[0], S[1] / 2, 0]));
            /* in the way at t metres out? a solid holds one of the three points, or a standing quad lies between t - 4 cm and t */
            const at = t => pts.map(w => [w[0] + F.n[0] * t, w[1], w[2] + F.n[2] * t]);
            const hit = t => { const a = at(t - 0.04), b = at(t); for (const s of lst) for (let i = 0; i < 3; i++) { if (s.P.s === 'quad' ? crossQuad(s, a[i], b[i]) : inside(s, b[i])) return s; } return null; };
            /* (a solid that still holds the sign 1.6 m on is a shell the sign hangs in, e.g. a porch's or a hall's box: not a wall in front of it) */
            const shell = new Set(lst.filter(s => s.P.s !== 'quad' && at(0.02).some(w => inside(s, w)) && at(FAR + AIR).some(w => inside(s, w))));
            const hitW = t => { const a = at(t - 0.04), b = at(t); for (const s of lst) { if (shell.has(s)) continue; for (let i = 0; i < 3; i++) if (s.P.s === 'quad' ? crossQuad(s, a[i], b[i]) : inside(s, b[i])) return s; } return null; };
            let first = null, by = null; for (let t = 0.02; t <= REACH + 1e-6; t += 0.04) { const s = hitW(t); if (s) { first = t; by = s; break; } }
            if (first == null) return;
            const what = (by.row.id || by.row.k) + ' ' + by.P.s + (by.P.key ? ' ' + String(by.P.key).split('|')[0].slice(0, 28) : ''), words = String(P.key).split('|')[0].slice(4);
            const line = (verb, x) => K.lines.push(verb + ' ' + JSON.stringify(words) + ' on ' + row.id + ' at ' + c.map(v => Math.round(v * 10) / 10).join(', ') + ': ' + what + ' ' + x);
            /* a surface standing off the sign (a colonnade before a frieze, a truss before a board) is not a sign in a wall: listed, never moved */
            if (first > 0.1) { K.left++; line('LEFT', 'stands ' + first.toFixed(2) + ' m in front of it (not moved: the sign is not in a wall)'); return; }
            if (!e.one) { K.left++; line('LEFT', 'in the way at ' + first.toFixed(2) + ' m (a copied part: move it in its district file)'); return; }
            let out = null; for (let t = first + 0.04; t <= FAR + 1e-6; t += 0.04) { let ok = true; for (let q = t; q <= t + AIR + 1e-6; q += 0.04) if (hitW(q)) { ok = false; break; } if (ok) { out = t; break; } }
            if (out == null) { K.left++; line('LEFT', 'in the way at ' + first.toFixed(2) + ' m, no clear air within ' + FAR + ' m'); return; }
            const d = F.rowDir(F.n), mv = out + 0.01, pp = e.src.p || (e.src.p = [0, 0, 0]);
            pp[0] = Math.round((pp[0] + d[0] * mv) * 1000) / 1000; pp[2] = Math.round((pp[2] + d[2] * mv) * 1000) / 1000;
            K.moved++; line('MOVED', 'was in the way at ' + first.toFixed(2) + ' m: drawn out ' + mv.toFixed(2) + ' m'); }); });
    return K; }
module.exports = { expand, frame, solids, near, inside, crossQuad, cast, fix, isTxt, inRow };
