/* DISASTER CITY, THE INTERIOR POLISH (2026-11-15, mondo: "rugs/carpets flickering, desks clipping through chairs, zombie floating in the
   air ... do another polish pass on disaster city"). Run by `node bake-disaster-city.js` after every district file has built and the prop
   pass has run, over every WALK-IN building (a hollow texbuilding) of the room. Repo tooling only. It MOVES rows, it never drops one.

   What it finds and mends, whichever district wrote the row (so a later district edit cannot bring the fault back):
   1. THE ROOF STANDERS: a prop with no `floor: true` beside a wall stands on that wall's TOP (three-renderer.js _hqPlaceProps reads the
      walker's feet there): a plant by the wall of a two-storey lobby was drawn on the roof (97 props in Financial + Hero Plaza). Every
      prop of a walk-in gets `floor: true`; one standing on a low block on purpose (a till on a counter block, a car on the lift) is left alone.
   2. THE SHARED SURFACES: two drawn faces on one plane flicker (a carpet quad at the room floor's own height, a panel flush with the
      wall, two trims crossing at one height). The smaller piece moves 6 mm proud of the other, round after round, until none share a
      plane. The room's own floor (0.03 m), inside walls (0.30 m in) and ceiling count as faces and never move.
   3. THE RUGS: a rug / carpet / doormat prop lies on the ground under the room's floor sheet (a round rug's top is at 0.029 m, the floor
      at 0.030 m): it is lifted onto the highest floor layer under it.
   4. THE SUNK PROPS: a prop standing on the ground under a raised floor layer (a stage, a dais, a 6 cm floor overlay) is lifted onto it.
   5. THE BURIED LININGS: a walk-in draws its own inside wall 0.30 m in from the row's edge. A district's lining, panelling or wall coat
      set nearer the edge than that (Civic's at 0.17 m, Financial's at 0.27 m) is BEHIND the room's wall and never seen, and so is every
      wall piece hung on it. Per wall: the buried layers and all in front of them come out by one step so the first stands at 0.33 m
      (their order kept), and the props against that wall come out with them. A wall piece still behind the wall's face hangs on it.
   6. THE CLIPPING PROPS (the model sizes in prop-sizes.json, measured by measure-props.js): a piece through the ceiling comes down / is
      made the room's height; a piece in the wall comes in to the wall's face (a hung piece lying across its wall is turned flat to it);
      two pieces in each other step apart (the lighter one, never a blocker; a chair may stand 15 cm under its table).
   The tally goes to the bake's console line (`interiorPolish`). Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE INTERIOR POLISH". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const r3 = v => Math.round(v * 1000) / 1000, D2R = Math.PI / 180;
const PUSH = 0.006, SAME = 0.003, FLOOR_Y = 0.03, WALL_IN = 0.30;
const IN_ROW = /[:\-]in(:|$)/;   // a district's inside row: 'arch:P04-00-B1-in', 'dc:P08-04-B1:in', 'dc:P08-08-B1:in:arch', 'ind:P00-08-B1:in'
const FLAT_KEY = /(^|_)(rug|carpet|doormat)(_|$)/;

module.exports = function interiorPolish(ctx) {
    const { features, props, at, REPO } = ctx, tally = { rooms: 0, roofStanders: 0, sharedFloor: 0, sharedWall: 0, rounds: 0, stuck: 0, rugs: 0, sunk: 0, buried: 0, buriedProps: 0, behindWall: 0, ceiling: 0, fitted: 0, turned: 0, inWall: 0, carried: 0, apart: 0, left: 0 };
    /* the catalogue (which props hang from the ceiling, which are vehicles) and the renderer's own arch geometry */
    let CAT = {};
    try { const sb = require(path.join(REPO, 'load-data.js')).loadGameData({ quiet: true }); CAT = vm.runInContext('DOOR_HQ.catalogue', sb) || {}; } catch (e) { console.warn('THE INTERIOR POLISH: no catalogue', e.message); }
    let archGeo = null;
    try {
        const src = fs.readFileSync(path.join(REPO, 'three-renderer.js'), 'utf8'), a = src.indexOf('function _hqArchGeometry(row, C) {'), b = src.indexOf('/* THE LETTERING (2026-11-13', a);
        if (a < 0 || b < 0) throw new Error('_hqArchGeometry not found');
        archGeo = new Function('HQ_TEXB', src.slice(a, b) + '\nreturn _hqArchGeometry;')({ cell: 1.75, storey: 3.5, bigWin: 1, archBase: 'urban:ConcreteStriped2a' });
    } catch (e) { console.warn('THE INTERIOR POLISH: the shared surfaces are skipped,', e.message); }

    /* the walk-ins, each in its own frame (lx along the front, lz = out of the door) */
    const bld = features.filter(f => f.k === 'texbuilding' && f.hollow).map(f => {
        const q = (f.rot || 0) * D2R, H = f.h || (Math.max(1, Math.round(f.storeys || 2)) * 3.5);
        return { f, id: f.id, x: f.x, z: f.z, w: Math.max(2, f.w || 8), d: Math.max(2, f.d || 8), c: Math.cos(q), s: Math.sin(q), base: at(f.x, f.z), Hc: Math.max(2.6, H - 0.32), props: [], rows: [] };
    });
    const toLocal = (B, x, z) => { const dx = x - B.x, dz = z - B.z; return [dx * B.c + dz * B.s, -dx * B.s + dz * B.c]; };
    const inside = (B, x, z, pad) => { const l = toLocal(B, x, z); return Math.abs(l[0]) <= B.w / 2 + (pad || 0) && Math.abs(l[1]) <= B.d / 2 + (pad || 0); };
    const homeOf = (x, z, pad) => bld.find(B => inside(B, x, z, pad));
    props.forEach(p => { const B = homeOf(p.x, p.z, 0); if (B) B.props.push(p); });
    tally.rooms = bld.length;

    /* ── 1. THE ROOF STANDERS ── */
    const walls = features.filter(f => f.k === 'wall' && f.ghost), onBlock = new Map();
    const segDist = (w, x, z) => { const ax = w.x1 - w.x0, az = w.z1 - w.z0, L2 = ax * ax + az * az, t = L2 ? Math.max(0, Math.min(1, ((x - w.x0) * ax + (z - w.z0) * az) / L2)) : 0; return Math.hypot(x - (w.x0 + ax * t), z - (w.z0 + az * t)); };
    bld.forEach(B => {
        const near = walls.filter(w => inside(B, (w.x0 + w.x1) / 2, (w.z0 + w.z1) / 2, 1));
        B.props.forEach(p => {
            if (p.floor === true) return;
            /* on a low block on purpose (a counter, a stage, a lift): left to stand on it */
            const blk = near.filter(w => (w.h != null ? w.h : 9) < 2.45 && segDist(w, p.x, p.z) < (w.t || 0.3) / 2 + 0.45); if (blk.length) { onBlock.set(p, Math.max.apply(null, blk.map(w => w.h))); return; }
            if (CAT[p.key] && CAT[p.key].vehicle) return;   // (a vehicle reads the ground itself)
            p.floor = true; tally.roofStanders++;   // (every other prop of the room too: `floor: true` is the room's ground, what each of them stood on anyway)
        });
    });

    /* ── the drawn faces of each walk-in: its arch parts (by where they are), its own floor, inside walls and ceiling ── */
    const faces = new Map(); bld.forEach(B => faces.set(B, []));
    const partTris = (B, row, pi) => {
        const G = archGeo(Object.assign({}, row, { base: row.y || 0, parts: [row.parts[pi]] }), 1.75), out = [];
        for (const id in G) { const g = G[id];
            for (let i = 0; i < g.idx.length; i += 3) {
                const v = [0, 1, 2].map(k => { const j = g.idx[i + k] * 3; return [g.pos[j], g.pos[j + 1] - B.base, g.pos[j + 2]]; });
                const e1 = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]], e2 = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
                let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const L = Math.hypot(n[0], n[1], n[2]); if (L < 1e-9) continue; n = n.map(x => x / L);
                out.push({ v, n, area: L / 2, over: g.kind === 'over' });
            } }
        return out;
    };
    const roomy = (B, t) => t.v.every(q => { const l = toLocal(B, q[0], q[2]); return Math.abs(l[0]) <= B.w / 2 - 0.2 && Math.abs(l[1]) <= B.d / 2 - 0.2 && q[1] <= B.Hc + 0.06 && q[1] >= -0.3; });
    if (archGeo) {
        features.forEach(row => { if (row.k !== 'arch' || !Array.isArray(row.parts)) return;
            row.parts.forEach((P, pi) => {
                let T; try { T = partTris({ base: 0 }, row, pi); } catch (e) { return; } if (!T.length) return;
                let cx = 0, cz = 0; T.forEach(t => t.v.forEach(q => { cx += q[0]; cz += q[2]; })); cx /= 3 * T.length; cz /= 3 * T.length;
                const B = homeOf(cx, cz, 0.2); if (!B) return;
                const ref = { row, pi }; T.forEach(t => { t.v.forEach(q => { q[1] -= B.base; }); t.ref = ref; }); ref.all = T; ref.tris = T.filter(t => roomy(B, t));
                faces.get(B).push(ref);
            }); });
        bld.forEach(B => {
            const hw = B.w / 2, hd = B.d / 2, iw = hw - WALL_IN, id = hd - WALL_IN, W = (lx, y, lz) => [B.x + lx * B.c - lz * B.s, y, B.z + lx * B.s + lz * B.c];
            const own = (pts, n) => { const nn = [n[0] * B.c - n[2] * B.s, n[1], n[0] * B.s + n[2] * B.c], ref = { own: true }; ref.tris = [[0, 1, 2], [0, 2, 3]].map(ix => ({ v: ix.map(i => W(pts[i][0], pts[i][1], pts[i][2])), n: nn, area: 1e6, over: false, ref })); faces.get(B).push(ref); };
            own([[-hw, FLOOR_Y, hd], [hw, FLOOR_Y, hd], [hw, FLOOR_Y, -hd], [-hw, FLOOR_Y, -hd]], [0, 1, 0]);
            own([[-iw, B.Hc, -id], [iw, B.Hc, -id], [iw, B.Hc, id], [-iw, B.Hc, id]], [0, -1, 0]);
            own([[-iw, 0, id], [iw, 0, id], [iw, B.Hc, id], [-iw, B.Hc, id]], [0, 0, -1]);
            own([[-iw, 0, -id], [iw, 0, -id], [iw, B.Hc, -id], [-iw, B.Hc, -id]], [0, 0, 1]);
            own([[iw, 0, -id], [iw, 0, id], [iw, B.Hc, id], [iw, B.Hc, -id]], [-1, 0, 0]);
            own([[-iw, 0, -id], [-iw, 0, id], [-iw, B.Hc, id], [-iw, B.Hc, -id]], [1, 0, 0]);
        });
    }

    /* ── 2. THE SHARED SURFACES ── */
    const clip = (subj, cl) => { let o = subj;
        for (let i = 0; i < cl.length && o.length; i++) { const a = cl[i], b = cl[(i + 1) % cl.length], inp = o, side = p => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); o = [];
            for (let k = 0; k < inp.length; k++) { const p = inp[k], q = inp[(k + 1) % inp.length], sp = side(p), sq = side(q); if (sp >= 0) o.push(p); if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); o.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } }
        return o; };
    const area2 = p => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
    const ccw = p => area2(p) < 0 ? p.slice().reverse() : p;
    const shared = B => {   // → [{ a, b (refs), n, gap, area }]
        const groups = new Map(), found = new Map();
        faces.get(B).forEach(ref => ref.tris.forEach(t => { t.d = t.n[0] * t.v[0][0] + t.n[1] * t.v[0][1] + t.n[2] * t.v[0][2]; const key = t.n.map(x => Math.round(x * 50)).join(','); (groups.get(key) || groups.set(key, []).get(key)).push(t); }));
        groups.forEach(L => { L.sort((p, q) => p.d - q.d);
            for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
                const a = L[i], b = L[j]; if (b.d - a.d > SAME) break; if (a.ref === b.ref || (a.ref.own && b.ref.own)) continue;
                if (a.n[0] * b.n[0] + a.n[1] * b.n[1] + a.n[2] * b.n[2] < 0.9995) continue;
                if (a.over !== b.over) continue;   // a decal over a wall: the renderer's polygon offset already puts it in front
                const n = a.n, u = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], w0 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]], wl = Math.hypot(w0[0], w0[1], w0[2]), Wv = w0.map(x => x / wl), Uv = [Wv[1] * n[2] - Wv[2] * n[1], Wv[2] * n[0] - Wv[0] * n[2], Wv[0] * n[1] - Wv[1] * n[0]];
                const pr = t => ccw(t.v.map(q => [q[0] * Uv[0] + q[1] * Uv[1] + q[2] * Uv[2], q[0] * Wv[0] + q[1] * Wv[1] + q[2] * Wv[2]]));
                const ov = clip(pr(a), pr(b)), ar = ov.length >= 3 ? Math.abs(area2(ov)) : 0; if (ar < 0.004) continue;
                let m = found.get(a.ref); if (!m) found.set(a.ref, m = new Map()); const k = b.ref, nk = n.map(x => Math.round(x * 50)).join(',');
                let rec = (m.get(k) || m.set(k, {}).get(k))[nk]; if (!rec) rec = m.get(k)[nk] = { a: a.ref, b: b.ref, n, area: 0, fa: a, fb: b }; rec.area += ar;
            } });
        const out = []; found.forEach(m => m.forEach(byN => Object.keys(byN).forEach(nk => { if (byN[nk].area >= 0.02) out.push(byN[nk]); })));
        return out;
    };
    const planeArea = (ref, n, d) => ref.own ? Infinity : ref.tris.reduce((s, t) => s + ((t.n[0] * n[0] + t.n[1] * n[1] + t.n[2] * n[2] > 0.9995 && Math.abs(t.d - d) < SAME * 2) ? t.area : 0), 0);
    /* a part moved `by` metres along the world normal `n` (its face on that side only) → true when it could be moved */
    const push = (ref, n, by) => {
        const row = ref.row, P0 = row.parts[ref.pi]; if (!P0 || P0.ring) return false;
        const rc = Math.cos(-(row.rot || 0) * D2R), rs = Math.sin(-(row.rot || 0) * D2R), pc = Math.cos(-(P0.ry || 0) * D2R), ps = Math.sin(-(P0.ry || 0) * D2R);
        const lx = n[0] * rc - n[2] * rs, lz = n[0] * rs + n[2] * rc, dx = lx * pc - lz * ps, dz = lx * ps + lz * pc, dy = n[1];   // the normal in the part's own frame
        const P = Object.assign({}, P0, { p: (P0.p || [0, 0, 0]).slice() }); if (Array.isArray(P0.size)) P.size = P0.size.slice();
        const shift = (ax, az) => { P.p[0] = r3(P.p[0] + ax * pc + az * ps); P.p[2] = r3(P.p[2] - ax * ps + az * pc); };   // a step in the part's frame → the row's
        if (P.s === 'box' && P.size) {
            if (Math.abs(dy) > 0.9) { P.size[1] = r3(P.size[1] + by); if (dy < 0) P.p[1] = r3(P.p[1] - by); }
            else if (Math.abs(dx) > 0.9) { P.size[0] = r3(P.size[0] + by); shift(Math.sign(dx) * by / 2, 0); }
            else if (Math.abs(dz) > 0.9) { P.size[2] = r3(P.size[2] + by); shift(0, Math.sign(dz) * by / 2); }
            else return false;
        } else if (P.s === 'quad') {
            if (P.flat) { if (Math.abs(dy) < 0.9) return false; P.p[1] = r3(P.p[1] + Math.sign(dy) * by); }
            else { if (Math.abs(dz) < 0.9) return false; shift(0, Math.sign(dz) * by); }
        } else if ((P.s === 'cyl' || P.s === 'poly') && dy > 0.9) P.h = r3((+P.h || 1) + by);
        else return false;
        row.parts[ref.pi] = P;
        return true;
    };
    const remesh = (B, m) => { try { const T = partTris(B, m.row, m.pi); T.forEach(t => { t.ref = m; }); m.all = T; m.tris = T.filter(t => roomy(B, t)); return true; } catch (e) { return false; } };
    /* ── 5. THE BURIED LININGS (before the shared surfaces, which then tidy what this moved) ── */
    if (archGeo) bld.forEach(B => {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(sd => {   // the wall on the local +x, -x, +z, -z side; `inw` = its normal into the room, in room axes
            const half = sd[0] ? B.w / 2 : B.d / 2, inl = [-sd[0], -sd[1]], inw = [inl[0] * B.c - inl[1] * B.s, 0, inl[0] * B.s + inl[1] * B.c];
            const depthOf = (x, z) => { const l = toLocal(B, x, z); return half - (sd[0] ? l[0] * sd[0] : l[1] * sd[1]); };
            const byRef = new Map(), hist = {};
            faces.get(B).forEach(ref => { if (ref.own || !IN_ROW.test(ref.row.id || '')) return; ref.all.forEach(t => {   // (an INSIDE row only: a facade box's back face is in the wall on purpose)
                if (t.n[0] * inw[0] + t.n[2] * inw[2] < 0.99 || t.v[0][1] > B.Hc || t.v[2][1] < -0.1) return;
                const d = depthOf(t.v[0][0], t.v[0][2]); if (d < 0.05 || d > 0.6) return;
                const k = Math.round(d * 100); hist[k] = (hist[k] || 0) + t.area; if (!byRef.has(ref) || d < byRef.get(ref)) byRef.set(ref, d); }); });
            let first = null; Object.keys(hist).map(Number).sort((a, b) => a - b).forEach(k => { if (first == null && k < WALL_IN * 100 - 0.5 && (hist[k] + (hist[k + 1] || 0) + (hist[k - 1] || 0)) >= 2) first = k / 100; });
            if (first == null) return;
            const delta = r3(WALL_IN + 0.03 - first); if (delta < 0.004) return;
            if (process.env.DC_POLISH_LOG) console.log('BURIED', B.id, sd.join(','), 'first', first, 'delta', delta, 'parts', [...byRef].filter(e => e[1] < WALL_IN + delta - 0.001).length, [...new Set([...byRef].filter(e => e[1] < WALL_IN + delta - 0.001).map(e => (e[0].row.id || '') + ':' + (e[0].row.parts[e[0].pi].s) + ':' + (e[0].row.parts[e[0].pi].key || 'tint') + '@' + e[1].toFixed(2)))].slice(0, 6).join(' | '));
            byRef.forEach((d, ref) => { if (d < WALL_IN + delta - 0.001 && push(ref, inw, delta)) { remesh(B, ref); tally.buried++; } });
            /* the props set against that lining (a wall piece on it, a locker with its back to it) come out with it */
            B.props.forEach(p => { const d = depthOf(p.x, p.z); if (d < 0.75) { p.x = r3(p.x + inw[0] * delta); p.z = r3(p.z + inw[2] * delta); tally.buriedProps++; } });
        });
        /* a wall piece whose middle is still behind the inside wall's face hangs on that face */
        B.props.forEach(p => { const cat = CAT[p.key] || {}, hung = p.mount != null || cat.mount || (typeof p.y === 'number' && p.y >= 1);
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(sd => { const half = sd[0] ? B.w / 2 : B.d / 2, l = toLocal(B, p.x, p.z), d = half - (sd[0] ? l[0] * sd[0] : l[1] * sd[1]);
                if (d >= WALL_IN + 0.01) return; const want = hung ? WALL_IN + 0.03 : WALL_IN + 0.03 + Math.min(0.5, cat.foot || 0.2), by = want - d, inl = [-sd[0], -sd[1]];
                p.x = r3(p.x + (inl[0] * B.c - inl[1] * B.s) * by); p.z = r3(p.z + (inl[0] * B.s + inl[1] * B.c) * by); tally.behindWall++; }); });
    });
    if (archGeo) bld.forEach(B => {
        const dead = new Set();
        for (let round = 0; round < 12; round++) {
            const L = shared(B).filter(c => !(dead.has(c.a) && dead.has(c.b)) && !(c.a.own && dead.has(c.b)) && !(c.b.own && dead.has(c.a))); if (!L.length) break;
            tally.rounds = Math.max(tally.rounds, round + 1);
            const moved = new Set();
            L.forEach(c => {
                const da = c.fa.d, db = c.fb.d, Aa = planeArea(c.a, c.n, da), Ab = planeArea(c.b, c.n, db);
                let m = c.a.own ? c.b : c.b.own ? c.a : (Aa < Ab ? c.a : Ab < Aa ? c.b : c.b), o = m === c.a ? c.b : c.a;
                if (dead.has(m)) { if (o.own || dead.has(o)) return; const t = m; m = o; o = t; }
                if (moved.has(m) || moved.has(o)) return;   // one move a round for a piece and its neighbour
                const od = o === c.a ? da : db, md = m === c.a ? da : db, by = r3(Math.max(PUSH, od - md + PUSH));   // proud of the other face, wherever inside the tolerance it stood
                if (!push(m, c.n, by)) { dead.add(m); tally.stuck++; return; }
                moved.add(m); if (round === 0) { if (Math.abs(c.n[1]) > 0.9) tally.sharedFloor++; else tally.sharedWall++; }
                if (!remesh(B, m)) dead.add(m);
            });
            if (!moved.size) break;
        }
    });

    /* ── 3 + 4. THE RUGS, THE SUNK PROPS: the highest floor layer under a prop's middle ── */
    const inTri = (t, x, z) => { const a = t.v[0], b = t.v[1], c = t.v[2], s1 = (b[0] - a[0]) * (z - a[2]) - (b[2] - a[2]) * (x - a[0]), s2 = (c[0] - b[0]) * (z - b[2]) - (c[2] - b[2]) * (x - b[0]), s3 = (a[0] - c[0]) * (z - c[2]) - (a[2] - c[2]) * (x - c[0]); return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0); };
    bld.forEach(B => {
        const floors = [];   // the floor-like tops: a part's level top of 1.5 m² or more, under 0.6 m
        faces.get(B).forEach(ref => { if (ref.own) return; const byY = {}; ref.tris.forEach(t => { if (t.n[1] > 0.99 && t.v[0][1] <= 0.6 && t.v[0][1] > FLOOR_Y) { const k = t.v[0][1].toFixed(3); (byY[k] = byY[k] || []).push(t); } });
            Object.keys(byY).forEach(k => { if (byY[k].reduce((s, t) => s + t.area, 0) >= 1.5) byY[k].forEach(t => floors.push(t)); }); });
        const floorAt = (x, z) => { let y = FLOOR_Y; floors.forEach(t => { if (t.v[0][1] > y && inTri(t, x, z)) y = t.v[0][1]; }); return y; };
        B.props.forEach(p => {
            const cat = CAT[p.key] || {}; if (cat.ceil || p.ceil || onBlock.has(p) || (p.floor !== true && !cat.vehicle)) return;
            const g = at(p.x, p.z) - B.base, top = floorAt(p.x, p.z), own = (typeof p.y === 'number') ? p.y : 0;   // (a `y` of 1 m or more is a height from the room's floor: a hung piece, never touched)
            if (own >= 1 || own <= -0.5 || p.mount || cat.mount) return;
            if (cat.lay || FLAT_KEY.test(p.key)) { const want = r3(top - g + 0.012); if (own < want - 0.001) { p.y = want; tally.rugs++; } return; }
            if (top > FLOOR_Y + 0.015 && own + g < top - 0.045) { p.y = r3(top - g); tally.sunk++; }
        });
    });
    /* ── 6. THE CLIPPING PROPS (the measured models: prop-sizes.json, written by measure-props.js) ── */
    let SIZES = null; try { SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, 'prop-sizes.json'), 'utf8')); } catch (e) { console.warn('THE INTERIOR POLISH: no prop-sizes.json, the clipping props are skipped (run measure-props.js)'); }
    if (SIZES) bld.forEach(B => {
        const FIT = { instrument_guitar: 0.38 };   // (a spell's guitar is 2.66 m long at its catalogue size: on a wall it is 1 m)
        B.props.forEach(p => { if (FIT[p.key] && p.h == null) { p.h = FIT[p.key]; tally.fitted++; } });
        const boxOf = (p, blocks) => { const S = SIZES[p.key], cat = CAT[p.key] || {}; if (!S || cat.ceil || p.ceil || cat.vehicle || (onBlock.has(p) && !blocks)) return null;
            const span = cat.span != null && cat.h == null, f = span ? (p.span && cat.span ? p.span / cat.span : 1) : (p.h && cat.h ? p.h / cat.h : 1);
            const raw = typeof p.y === 'number' ? p.y : 0, own = (raw >= 1 ? raw - at(p.x, p.z) : raw) + (onBlock.get(p) || 0), mount = p.mount != null ? p.mount : (cat.mount || 0), yaw = Math.PI - ((p.face || 0) + (p.rot || 0)) * D2R, c = Math.cos(yaw), s = Math.sin(yaw);
            const b = { p, cat, hx: S[0] * f / 2, hz: S[2] * f / 2, h: S[1] * f, y0: own + mount, hung: false, ax: [c, -s], az: [s, c], block: !!cat.block, flat: !!(cat.lay || FLAT_KEY.test(p.key)) };
            b.y1 = b.y0 + b.h; b.hung = (own >= 1 || !!mount) && !onBlock.has(p) && wallGap(b, p.x, p.z) < 0.6; return b; };   // (hung = a piece on a wall; a crate stacked 1 m up is not)
        const reach = (b, u) => Math.abs(b.ax[0] * u[0] + b.ax[1] * u[1]) * b.hx + Math.abs(b.az[0] * u[0] + b.az[1] * u[1]) * b.hz;
        const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(sd => ({ sd, half: sd[0] ? B.w / 2 : B.d / 2, inw: [-sd[0] * B.c + sd[1] * B.s, -sd[0] * B.s - sd[1] * B.c] }));
        const depth = (S, x, z) => { const l = toLocal(B, x, z); return S.half - (S.sd[0] ? l[0] * S.sd[0] : l[1] * S.sd[1]); };
        const wallGap = (b, x, z) => Math.min.apply(null, SIDES.map(S => depth(S, x, z) - reach(b, S.inw)));   // the box's nearest edge to the row's edge
        const OPEN = /arch|palm|tree|lift|gate|frame/, SEAT = /chair|stool|bench|seat/, TABLE = /table|desk|counter|bar|bench/;
        const over = (a, b, ax, az) => { let m = Infinity; const dx = b.p.x - (ax != null ? ax : a.p.x), dz = b.p.z - (az != null ? az : a.p.z);
            for (const u of [a.ax, a.az, b.ax, b.az]) { const o = reach(a, u) + reach(b, u) - Math.abs(dx * u[0] + dz * u[1]); if (o <= 0) return 0; if (o < m) m = o; } return m; };
        const clash = (a, b) => { if (a.flat || b.flat || Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) < 0.12) return 0;
            const up = q => q.y0 >= 0.2 && !q.hung; if (up(a) !== up(b)) return 0;   // (a piece set on a table top stands ON the other; two on one top are a pair like any)
            if (OPEN.test(a.p.key) || OPEN.test(b.p.key)) return 0;   // (an arch over a lectern, a fern under a palm, a car on its lift)
            const tuck = (SEAT.test(a.p.key) && TABLE.test(b.p.key)) || (SEAT.test(b.p.key) && TABLE.test(a.p.key)) ? 0.15 : 0.06; return tuck; };
        /* a. the piece through the ceiling: a hung piece comes down, a standing one (a palm) is made the room's height */
        B.props.forEach(p => { const b = boxOf(p, true); if (!b || b.y1 <= B.Hc - 0.02) return; const cat = b.cat;
            if (typeof p.y === 'number' && p.y >= 1) { p.y = r3(Math.max(1, p.y - (b.y1 - (B.Hc - 0.1)))); tally.ceiling++; }
            else if (b.hung && (p.mount != null || cat.mount)) { p.mount = r3(Math.max(0.5, (p.mount != null ? p.mount : cat.mount) - (b.y1 - (B.Hc - 0.15)))); tally.ceiling++; }
            else if (cat.h && !(cat.span != null && cat.h == null) && !p.span) { p.h = r3((B.Hc - 0.12 - b.y0) / b.h * (p.h || cat.h)); tally.ceiling++; } });
        /* b. the piece in the wall: a hung piece lying across its wall is turned flat to it; then any piece comes in until its box clears the wall's face */
        B.props.forEach(p => { let b = boxOf(p); if (!b || b.flat) return;
            SIDES.forEach(S => { let r = reach(b, S.inw), d = depth(S, p.x, p.z); if (d < -0.05 || d - r >= WALL_IN - 0.03) return;
                if (b.hung && r > 0.2) { const o = p.face || 0; p.face = (o + 90) % 360; const b2 = boxOf(p); if (reach(b2, S.inw) < r * 0.6) { b = b2; r = reach(b, S.inw); tally.turned++; } else p.face = o; }
                const by = WALL_IN + 0.04 - (d - r); if (by <= 0 || by > 1.1) return;
                const carry = (q, depthLeft) => { const was = B.props.map(o => { const ob = o !== q.p && boxOf(o); return ob && clash(q, ob) ? [ob, over(q, ob)] : null; }).filter(Boolean);
                    q.p.x = r3(q.p.x + S.inw[0] * by); q.p.z = r3(q.p.z + S.inw[1] * by);
                    if (depthLeft > 0) was.forEach(e => { if (over(q, e[0]) > Math.max(clash(q, e[0]), e[1]) + 0.01) { carry(e[0], depthLeft - 1); tally.carried++; } }); };   // (a piece it now stands in comes in with it: a second row of shelves)
                carry(b, 4); tally.inWall++; }); });
        /* c. two pieces in each other: the lighter one (never a blocker: it keeps its square) steps out along the shortest way that stays in
              the room and out of every other piece; a wall piece slides along its wall. A chair may stand 15 cm under its table. */
        /* a school desk draws its OWN blue chair (three-renderer.js _hqProcs.school_desk: 0.56 m out of its front): a second chair set on that
           spot stood in it ("desks clipping through chairs"). The desk and its chair count as two pieces that never move. */
        const own = []; B.props.forEach(p => { if (p.key !== 'school_desk') return; const yaw = Math.PI - ((p.face || 0) + (p.rot || 0)) * D2R, c = Math.cos(yaw), s = Math.sin(yaw);
            const mk = (key, lz, hx, hz, h) => ({ p: { key, x: p.x + lz * s, z: p.z + lz * c }, cat: {}, hx, hz, h, y0: 0, y1: h, hung: false, ax: [c, -s], az: [s, c], block: true, flat: false });
            own.push(mk('school_desk', 0, 0.55, 0.25, 0.75), mk('school_seat', 0.57, 0.21, 0.21, 0.83)); });
        for (let round = 0; round < 4; round++) {
            const bx = B.props.map(boxOf).filter(Boolean).concat(own); let moved = 0;
            for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) {
                const a = bx[i], b = bx[j], tol = clash(a, b); if (!tol) continue; const pn = over(a, b); if (pn <= tol) continue;
                const rank = q => q.block ? 9 : q.hung ? 1 : 0, area = q => q.hx * q.hz;
                const order = [a, b].filter(q => !q.block).sort((p, q) => (rank(p) - rank(q)) || (area(p) - area(q))); let done = false;
                for (const m of order) { if (done) break; const o = m === a ? b : a, dx = m.p.x - o.p.x, dz = m.p.z - o.p.z;
                    const wall = m.hung ? SIDES.slice().sort((p, q) => depth(p, m.p.x, m.p.z) - depth(q, m.p.x, m.p.z))[0] : null, cand = [];
                    [a.ax, a.az, b.ax, b.az].forEach(u => { if (wall && Math.abs(u[0] * wall.inw[0] + u[1] * wall.inw[1]) > 0.3) return;
                        const along = dx * u[0] + dz * u[1], full = reach(a, u) + reach(b, u) - tol + 0.03;
                        [1, -1].forEach(sg => { const by = sg * full - along; cand.push({ u, by, len: Math.abs(by) }); }); });
                    cand.sort((p, q) => p.len - q.len);
                    for (const cd of cand) { if (cd.len > 1.3) break; const nx = m.p.x + cd.u[0] * cd.by, nz = m.p.z + cd.u[1] * cd.by;
                        if (wallGap(m, nx, nz) < WALL_IN + 0.02 && wallGap(m, nx, nz) < wallGap(m, m.p.x, m.p.z) - 0.001) continue;
                        if (bx.some(q => q !== m && q !== o && clash(m, q) && over(m, q, nx, nz) > Math.max(clash(m, q), over(m, q)) + 0.001)) continue;
                        m.p.x = r3(nx); m.p.z = r3(nz); tally.apart++; moved++; done = true; break; } }
                if (!done) { tally.left++; if (process.env.DC_POLISH_LOG) console.log('LEFT', B.id, a.p.key, b.p.key, pn.toFixed(2)); }
            }
            if (!moved) break; if (round < 3) tally.left = 0;
        }
    });
    return tally;
};
