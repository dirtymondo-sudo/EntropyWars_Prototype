/* ow-move.js — THE PLOT MOVER (2026-11-17, One World test slice: docs/plans/one-world/BUILD_PLAN.md phase 2; repo-only tooling).
   mondo's rule for the One World map: "Districts keep every plot and everything on them; only where the plots stand changes."
   A zone's bake tool builds its room in THE HOME FRAME as it always did (the district files never change), then asks this module
   to stand some of the plots somewhere else: a new room whose box is the bounding box of the plots' v13 world places.
   Rules: docs/notes/areas-complexes.md "ONE WORLD, HOW A ZONE MOVES" + "ONE WORLD, THE TEST SLICE".

   const M = require('./ow-move.js')({ cols, rows, cell, fill, plots, features, props, npc, doors });
       cols, rows   the home room's size in plots            cell   its squares, [row][col] of one letter (after every hook)
       fill         the letter of ground nobody walks ('t' the Woods' trees, 'c' the Estate's corn)
       plots        [{ id: 'P02-04', x, y (home col, row), name, district, level }]
       features, props, npc, doors   every piece of the home room
   const R = M.room([{ id: 'P02-04', wx: -14, wy: 0 }, … , { wx, wy, name, district, level, isNew: true }]);
       R.cols, rows, W, D (squares), HX, HZ (half sizes, m), wx, wy (the box's world plot), cell, mask, names
       R.at[col + ',' + row] = the plot standing there ({ id, name, district, level, col, row, dx, dz, home })
       R.features, props, npc   the pieces whose ANCHOR stands on one of the room's plots, moved by that plot's (dx, dz)
       R.doors                  its doors: a wall door whose side still lies on the room's wall stays a wall door, any other is `wall: 'free'`
       R.strays                 pieces that lay across two plots which no longer stand the same way to each other (printed by the tool)
       R.toRoom(homeX, homeZ)   a home point -> the room's point (by the plot it stands on), or null
       R.sq(id, lx, ly)         a plot-local square -> the room's square
   Nothing is turned. A stream row is cut where it leaves the room's plots. A scatter disc wider than a plot (a district's own
   scatter) becomes a row over the whole room with the same count. */
'use strict';
const C = 3.5, N = 12, PL = N * C;
const r2 = v => Math.round(v * 100) / 100;
module.exports = function mover(H) {
    const HX = H.cols * PL / 2, HZ = H.rows * PL / 2, byXY = {}, byId = {};
    H.plots.forEach(p => { byXY[p.x + ',' + p.y] = p; byId[p.id] = p; });
    const cl = (v, n) => Math.max(0, Math.min(n - 1, v));
    const homePlot = (x, z) => byXY[cl(Math.floor((x + HX) / PL + 1e-9), H.cols) + ',' + cl(Math.floor((z + HZ) / PL + 1e-9), H.rows)];
    const pt = q => Array.isArray(q) ? [q[0], q[1]] : [q.x, q.z];
    /* a piece's anchor (ow-census.js reads the same): a prop's x, z; a feature's middle; a rail or wall's midpoint; a line's middle point */
    function anchor(f) {
        if (f.x != null && f.z != null) return [f.x, f.z];
        if (f.x0 != null) return [(f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2];
        if (Array.isArray(f.pts) && f.pts.length) return pt(f.pts[Math.floor(f.pts.length / 2)]);
        return null;
    }
    /* the points a piece reaches (to tell a stray) */
    function reach(f) {
        if (f.k === 'scatter' && f.r) return [[f.x, f.z]];
        if (f.x != null && f.z != null) { const w = (f.w || 0) / 2, d = (f.d || 0) / 2, r = f.r || 0, rz = f.rz || f.r || 0, ex = Math.max(0, Math.max(w, r) - 0.2), ez = Math.max(0, Math.max(d, rz) - 0.2);
            if (f.k === 'arch' || f.k === 'tree' || f.k === 'texbuilding' && f.rot % 180) return [[f.x, f.z]];
            return [[f.x - ex, f.z - ez], [f.x + ex, f.z - ez], [f.x - ex, f.z + ez], [f.x + ex, f.z + ez]]; }
        if (f.x0 != null) return [[f.x0, f.z0], [f.x1, f.z1]];
        if (Array.isArray(f.pts)) return f.pts.map(pt);
        return [];
    }
    function shifted(f, dx, dz) {
        const o = Object.assign({}, f);
        if (o.x != null && o.z != null) { o.x = r2(o.x + dx); o.z = r2(o.z + dz); }
        if (o.x0 != null) { o.x0 = r2(o.x0 + dx); o.x1 = r2(o.x1 + dx); o.z0 = r2(o.z0 + dz); o.z1 = r2(o.z1 + dz); }
        if (Array.isArray(o.pts)) o.pts = o.pts.map(q => Array.isArray(q) ? [r2(q[0] + dx), r2(q[1] + dz)].concat(q.slice(2)) : Object.assign({}, q, { x: r2(q.x + dx), z: r2(q.z + dz) }));
        if (Array.isArray(o.off)) o.off = [r2(o.off[0] + dx), r2(o.off[1] + dz), r2(o.off[2] + dx), r2(o.off[3] + dz)];
        return o;
    }
    function room(list) {
        const wx = Math.min(...list.map(p => p.wx)), wy = Math.min(...list.map(p => p.wy)), cols = Math.max(...list.map(p => p.wx)) - wx + 1, rows = Math.max(...list.map(p => p.wy)) - wy + 1;
        const W = cols * N, D = rows * N, RX = W * C / 2, RZ = D * C / 2, at = {}, ofHome = {};
        const cell = []; for (let y = 0; y < D; y++) cell.push(new Array(W).fill(H.fill));
        list.forEach(p => { const h = p.id ? byId[p.id] : null; if (p.id && !h) throw new Error('ow-move: no home plot ' + p.id);
            const col = p.wx - wx, row = p.wy - wy, e = { id: p.id || null, home: h, isNew: !h, name: p.name || (h && h.name), district: p.district || (h && h.district), level: p.level != null ? p.level : (h ? h.level : 0), col, row, wx: p.wx, wy: p.wy };
            if (at[col + ',' + row]) throw new Error('ow-move: two plots on ' + p.wx + ',' + p.wy);
            at[col + ',' + row] = e;
            if (h) { e.dx = r2((-RX + col * PL) - (-HX + h.x * PL)); e.dz = r2((-RZ + row * PL) - (-HZ + h.y * PL)); ofHome[h.id] = e;
                for (let ly = 0; ly < N; ly++) for (let lx = 0; lx < N; lx++) cell[row * N + ly][col * N + lx] = H.cell[h.y * N + ly][h.x * N + lx]; } });
        const mine = (x, z) => { const h = homePlot(x, z); return h ? ofHome[h.id] || null : null; };
        const strays = [], features = [], props = [], npc = [], doors = [];
        const tell = f => (f.k || 'prop') + (f.key ? ':' + f.key : f.id ? '#' + f.id : f.kind ? ':' + f.kind : '');
        (H.features || []).forEach(f => {
            if (f.k === 'space') return;                                    // the open ground is cut again from the room's own squares
            if (f.k === 'scatter' && f.x == null) return;                   // a row over the whole home room is the tool's: written again
            if (f.k === 'stream' && Array.isArray(f.pts)) {                 // cut where it leaves the room's plots; each run moves with its own plot
                let run = [], e0 = null; const flush = () => { if (run.length >= 2) features.push(Object.assign({}, f, { pts: run })); else if (run.length === 1) strays.push('a stream point alone on ' + e0.name + ' (dropped: a one-point run draws nothing)'); run = []; };
                f.pts.forEach(q => { const p = pt(q), e = mine(p[0], p[1]); if (!e) { flush(); e0 = null; return; } if (e0 && (e.dx !== e0.dx || e.dz !== e0.dz)) flush(); e0 = e; run.push([r2(p[0] + e.dx), r2(p[1] + e.dz)]); });
                flush(); return; }
            if ((f.k === 'rail' || f.k === 'wall') && f.x0 != null) {         // a fence: cut at every plot line it crosses, each run moves with its own plot; one that lies ON a line is the north / west plot's
                const onX = Math.abs(f.x0 - f.x1) < 1e-6 && Math.abs(((f.x0 + HX) / PL) - Math.round((f.x0 + HX) / PL)) < 1e-6, onZ = Math.abs(f.z0 - f.z1) < 1e-6 && Math.abs(((f.z0 + HZ) / PL) - Math.round((f.z0 + HZ) / PL)) < 1e-6;
                const ts = [0, 1], len = Math.hypot(f.x1 - f.x0, f.z1 - f.z0) || 1;
                for (let i = 1; i < H.cols; i++) { const X = -HX + i * PL, t = (X - f.x0) / (f.x1 - f.x0); if (isFinite(t) && t > 0.02 / len && t < 1 - 0.02 / len) ts.push(t); }
                for (let i = 1; i < H.rows; i++) { const Z = -HZ + i * PL, t = (Z - f.z0) / (f.z1 - f.z0); if (isFinite(t) && t > 0.02 / len && t < 1 - 0.02 / len) ts.push(t); }
                ts.sort((p, q) => p - q);
                for (let i = 0; i + 1 < ts.length; i++) { const t0 = ts[i], t1 = ts[i + 1], mx = f.x0 + (f.x1 - f.x0) * (t0 + t1) / 2 - (onX ? 0.01 : 0), mz = f.z0 + (f.z1 - f.z0) * (t0 + t1) / 2 - (onZ ? 0.01 : 0), e = mine(mx, mz); if (!e) continue;
                    features.push(shifted(Object.assign({}, f, { x0: r2(f.x0 + (f.x1 - f.x0) * t0), z0: r2(f.z0 + (f.z1 - f.z0) * t0), x1: r2(f.x0 + (f.x1 - f.x0) * t1), z1: r2(f.z0 + (f.z1 - f.z0) * t1) }), e.dx, e.dz)); }
                return; }
            const a = anchor(f); if (!a) { strays.push(tell(f) + ' has no place: left where it was'); return; }
            const e = mine(a[0], a[1]); if (!e) return;
            const together = f.k === 'scatter' && f.r > PL / 2 && [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(q => { const o = mine(Math.max(-HX + 1, Math.min(HX - 1, a[0] + q[0] * f.r * 0.7)), Math.max(-HZ + 1, Math.min(HZ - 1, a[1] + q[1] * f.r * 0.7))); return o && o.dx === e.dx && o.dz === e.dz; });
            if (f.k === 'scatter' && f.r > PL / 2 && !together) {            // a district's own scatter whose plots stand apart now: over the whole new room, the same count
                const o = Object.assign({}, f); delete o.x; delete o.z; delete o.r; if (Array.isArray(o.off)) { const q = mine((o.off[0] + o.off[2]) / 2, (o.off[1] + o.off[3]) / 2) || e; o.off = shifted({ off: o.off }, q.dx, q.dz).off; } o.wide = 1; features.push(o); return; }
            const bad = reach(f).map(q => { const h = homePlot(q[0], q[1]), o = h && ofHome[h.id]; return (o && o.dx === e.dx && o.dz === e.dz) ? null : (h ? h.name : '?'); }).filter(Boolean);
            if (bad.length) strays.push(tell(f) + ' on ' + e.name + ' also lies on ' + [...new Set(bad)].join(', '));
            features.push(shifted(f, e.dx, e.dz));
        });
        (H.props || []).forEach(p => { const e = mine(p.x || 0, p.z || 0); if (e) props.push(shifted(p, e.dx, e.dz)); });
        (H.npc || []).forEach(n => { const e = mine(n.x || 0, n.z || 0); if (e) npc.push(shifted(n, e.dx, e.dz)); });
        /* a door: on a wall of the home room (x or z along it) or free. Its plot's side either lies on the new room's wall or it does not */
        (H.doors || []).forEach(d => {
            const hx = d.wall === 'w' ? -HX + 0.5 : d.wall === 'e' ? HX - 0.5 : d.x, hz = d.wall === 'n' ? -HZ + 0.5 : d.wall === 's' ? HZ - 0.5 : d.z, e = mine(hx, hz); if (!e) return;
            if (d.wall === 'free') { doors.push(shifted(d, e.dx, e.dz)); return; }
            const onWall = (d.wall === 'n' && e.row === 0) || (d.wall === 's' && e.row === rows - 1) || (d.wall === 'w' && e.col === 0) || (d.wall === 'e' && e.col === cols - 1), o = Object.assign({}, d);
            if (d.wall === 'n' || d.wall === 's') { o.x = r2(d.x + e.dx); if (!onWall) { o.z = r2((d.wall === 'n' ? -HZ + C / 2 : HZ - C / 2) + e.dz); o.face = d.wall === 'n' ? 0 : 180; o.wall = 'free'; } }
            else { o.z = r2(d.z + e.dz); if (!onWall) { o.x = r2((d.wall === 'w' ? -HX + C / 2 : HX - C / 2) + e.dx); o.face = d.wall === 'w' ? 270 : 90; o.wall = 'free'; } }
            o.side = d.wall; o.plot = e; doors.push(o);
        });
        const mask = []; for (let r = 0; r < rows; r++) { let s = ''; for (let c = 0; c < cols; c++) s += at[c + ',' + r] ? '#' : '.'; mask.push(s); }
        const pid = e => 'P' + String(e.col).padStart(2, '0') + '-' + String(e.row).padStart(2, '0');
        const order = list.map(p => at[(p.wx - wx) + ',' + (p.wy - wy)]);
        return { wx, wy, cols, rows, W, D, HX: RX, HZ: RZ, cell, at, mask, strays, features, props, npc, doors, order, pid, ofHome,
            names: order.map(e => [pid(e), e.name, e.district, e.level]),
            gx: c => r2(-RX + c * C), gz: c => r2(-RZ + c * C), gcx: c => r2(-RX + (c + 0.5) * C), gcz: c => r2(-RZ + (c + 0.5) * C),
            plotOfSq: (sx, sy) => (sx < 0 || sy < 0 || sx >= W || sy >= D) ? null : (at[Math.floor(sx / N) + ',' + Math.floor(sy / N)] || null),
            toRoom: (x, z) => { const e = mine(x, z); return e ? [r2(x + e.dx), r2(z + e.dz)] : null; },
            sq: (id, lx, ly) => { const e = ofHome[id]; if (!e) throw new Error('ow-move: ' + id + ' is not in this room'); return [e.col * N + lx, e.row * N + ly]; },
            /* THE LEVELS, laid again: the Woods' own rule (flat over a plot's middle four squares, a straight grade over the eight squares to the
               next plot's middle) on the plots as they stand now; a cell of the box that is no plot takes the level of the nearest plot */
            levels(LEVEL) { const lv = [];
                for (let r = 0; r < rows; r++) { lv.push([]); for (let c = 0; c < cols; c++) { let e = at[c + ',' + r];
                    if (!e) { let bd = 1e9; Object.keys(at).forEach(k => { const o = at[k], d2 = (o.col - c) * (o.col - c) + (o.row - r) * (o.row - r); if (d2 < bd) { bd = d2; e = o; } }); }
                    lv[r].push(e.level * LEVEL); } }
                const LV = (i, j) => lv[cl(j, rows)][cl(i, cols)], t = v => Math.min(1, Math.max(0, (v - 1 / 6) / (2 / 3)));
                return (xm, zm) => { const px = (xm + RX) / PL - 0.5, pz = (zm + RZ) / PL - 0.5, i = Math.floor(px), j = Math.floor(pz), u = t(px - i), v = t(pz - j);
                    return (LV(i, j) * (1 - u) + LV(i + 1, j) * u) * (1 - v) + (LV(i, j + 1) * (1 - u) + LV(i + 1, j + 1) * u) * v; }; },
            /* the open ground, cut again: greedy rectangles of every square `open` says is walked */
            spaces(open) { const out = [], used = new Uint8Array(W * D);
                for (let cy = 0; cy < D; cy++) for (let cx = 0; cx < W; cx++) { if (!open(cx, cy) || used[cy * W + cx]) continue;
                    let w = 1; while (cx + w < W && !used[cy * W + cx + w] && open(cx + w, cy)) w++;
                    let h = 1; rowsL: while (cy + h < D) { for (let i = 0; i < w; i++) if (used[(cy + h) * W + cx + i] || !open(cx + i, cy + h)) break rowsL; h++; }
                    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(cy + j) * W + cx + i] = 1;
                    out.push({ k: 'space', x: r2(-RX + cx * C + w * C / 2), z: r2(-RZ + cy * C + h * C / 2), w: w * C, d: h * C }); }
                return out; },
            /* THE SEAM ID of a plot side (the room-splitting rule 6): ow_v_<x>_<y> = the north-south line x at row y, ow_h_<x>_<y> = the east-west line y at column x */
            seamId(e, side) { const mm = v => (v < 0 ? 'm' + (-v) : '' + v); return side === 'E' ? 'ow_v_' + mm(e.wx + 1) + '_' + mm(e.wy) : side === 'W' ? 'ow_v_' + mm(e.wx) + '_' + mm(e.wy) : side === 'S' ? 'ow_h_' + mm(e.wx) + '_' + mm(e.wy + 1) : 'ow_h_' + mm(e.wx) + '_' + mm(e.wy); },
        };
    }
    return { room, homePlot, anchor, shifted, C, N, PL };
};
