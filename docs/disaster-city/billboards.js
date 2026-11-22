/* THE BILLBOARDS (2026-11-20, the branding pass; mondo: "There should be neon signs and billboards in disaster city, with the streets that
   have nightlife looking like a major city"). Lit two-faced boards on the roofs of the two nightlife districts (E Entertainment, B Bayside)
   and a few over Hero Plaza and Financial, each an advert for one of the city's chains (docs/notes/branding.md). No district file is
   edited: bake-disaster-city.js calls `apply` on the finished rows, and a board is one new arch row (`bb:<building id>`) over a building.
   Where: per district (PER), the buildings (`texbuilding` rows `dc:Pxx-yy-Bn`, at least 10 x 7 m) with the most storeys whose dressing
   row (`<id>:arch`) has no pitched roof or dome. Two boards a building, one at each long edge of the roof (over the tallest slab the
   dressing lays there), each reading outward. The adverts are dealt in order, so a rebake gives the same city.
   `SIGNS_DUMP=1 node bake-disaster-city.js --dry-run` prints each board's building, place and advert.
   A board: two posts, a lit panel in the brand's ground colour, the name (its chain mark left of it, three-renderer.js HQ_CHAIN_MARKS)
   and the line under it.
   THE SIGNAGE PASS (2026-11-22, mondo: "Why does this one building have icarus aerospace, hotdogs, and burgers?? And the signs are clipping
   into stuff ... The signs should make logical sense ... think like an actual city planner"). The second and third passes dealt the twelve
   adverts in turn onto every open wall of both districts: a flower shop wore Icarus, Meltdown and Jitters, the boards covered the shops' own
   names, and a board hung on a building's bounding box stood in the air off a round wall or inside an awning. THE PLANNER'S RULES now:
   1. A FRONT IS THE TENANT'S. A face that carries the building's own sign or its doorway takes no advert at all.
   2. An advert hangs only on a BLANK WALL: behind every part of the board the wall itself stands within 30 cm (never glass, a shutter, a
      door, a sign), nothing stands in front of it for 2.5 m (a canopy, a stair, a neighbour, a tree), and at eye level no prop stands there.
      The board slides along the wall to the first clear stretch nearest its middle; no stretch = no board.
   3. One upper board and one pair of posters a building at most; a one-storey building takes no upper board (it stood over the eave).
   4. A ROOF BOARD reads over a STREET or a SQUARE: only the roof edges that look onto one of the city's streets within 40 m, or onto
      16 m of open ground, carry a board; never one that reads into a neighbour's wall.
   5. THE ADVERT FITS: a chain's own building advertises itself (Meltdown Burger, Mid Records, Snake Eyes); a place that sells food takes no
      other food or drink advert; otherwise the advert whose nearest twin is farthest away, so two of a kind are never read together.
   The surfaces are sign-check.js's (the same solids the sign check uses). */
'use strict';
const SC = require('./sign-check.js'), BRANDS = require('./sign-fonts.js');
const r2 = v => Math.round(v * 100) / 100, hex = c => parseInt(String(c).slice(1), 16);
/* [name, line, fg, bg, font, mark] */
const ADS = [
    ['ACT OF GOD INSURANCE', 'NOT COVERED.', '#111111', '#ffd21f', 'abril', 'bolt'],
    ['CALAMITY MUTUAL', 'TOO BIG TO FAIL.', '#e9d9a6', '#12332a', 'playfair', 'bank'],
    ['KABOOM! COLA', 'SHAKE WELL.', '#fff04a', '#7a1fd0', 'bungee', 'burst'],
    ['MID RECORDS', 'NEW ALBUM OUT NOW. IT’S FINE.', '#111111', '#e6e2d6', 'dela', 'mid'],
    ['PHOENIX RECONSTRUCTION', 'WE REBUILD. AGAIN.', '#ff8a1f', '#16161c', 'staat', 'flame'],
    ['ICARUS AEROSPACE', 'AIM HIGHER.', '#ffffff', '#163a6b', 'righteous', 'wing'],
    ['MELTDOWN BURGER', 'DANGEROUSLY CHEESY.', '#ffe14a', '#c8202a', 'bungee', 'burger'],
    ['JITTERS COFFEE', 'ONE MORE CUP.', '#fff3df', '#6b2f1a', 'pacifico', 'cup'],
    ['LANDSLIDE REALTY', 'HOMES THAT MOVE YOU.', '#2b2118', '#e9c9a0', 'playfair', ''],
    ['PANDORA SHIPPING', 'WE NEVER OPEN THE BOX.', '#f1e2c0', '#4a2f6b', 'alfa', 'crate'],
    ['HERO ENERGY', 'SAVE THE DAY. AGAIN TOMORROW.', '#ffffff', '#c8202a', 'archivo', ''],
    ['SNAKE EYES CASINO', 'FEELING LUCKY?', '#fff2c0', '#5a0c14', 'fasc', '']
];
const PER = { E: 7, B: 5, F: 2 }, STOREY = 3.5;
/* one board: its own arch row over the building, in world axes (the dressing rows `<id>:arch` are written the same way) */
function board(c, ads) {
    const parts = [], W = r2(Math.min(c.L * 0.8, 12)), Hh = r2(Math.min(W / 2.5, 4.6)), leg = 0.7, t = 0.3, T = c.T, ax = c.alongX;
    /* one board at each long edge of the roof, reading outward over the street below (11-20: a board on the roof's middle was hidden by the roof's own edge) */
    [1, -1].forEach((s, i) => { const ad = ads[i]; if (!ad) return; const e = s * (c.S / 2 - 0.3);
        const at = (u, y, off) => ax ? [r2(u), r2(y), r2(e + off)] : [r2(e + off), r2(y), r2(u)];
        const box3 = (u, y, len, hh, th, tint, x) => parts.push(Object.assign({ s: 'box', p: at(u, y, 0), size: ax ? [len, hh, th] : [th, hh, len], tint }, x || {}));
        for (const q of [-1, 1]) box3(q * (W / 2 - 0.5), T, 0.3, leg + Hh, 0.2, 0x2a2c32);
        box3(0, T + leg - 0.12, W + 0.3, Hh + 0.24, t - 0.08, 0x1a1b20);            // the frame
        box3(0, T + leg, W, Hh, t, hex(ad[3]), { glow: 0.55 });                      // the lit panel
        const ry = ax ? (s > 0 ? 0 : 180) : (s > 0 ? 270 : 90), off = s * (t / 2 + 0.02);
        const q = (y, ww, hh, words, font, mark) => parts.push({ s: 'quad', p: at(0, y, off), size: [r2(ww), r2(hh)], ry, uv: 'fit', kind: 'over', glow: 0.95, tint: 16777215,
            key: 'txt:' + words + '|' + ad[2] + '||' + r2(ww / hh) + '||' + font + (mark ? '|' + mark : '') });
        q(T + leg + Hh * 0.36, W * 0.9, Hh * 0.52, ad[0], ad[4], ad[5]); q(T + leg + Hh * 0.1, W * 0.8, Hh * 0.19, ad[1], 'way', ''); });
    return { k: 'arch', id: 'bb:' + c.id, x: c.x, z: c.z, y: c.y, rot: 0, parts };
}
/* a lit panel flat on a wall: f = the face ({ ax: it runs along x, s: the side, half: the wall's distance from the building's middle }), u = its
   middle along the wall, y0 = its foot, out = how far its middle stands off the wall line */
function panel(parts, f, u, y0, W, H, t, out, ad, glowP, glowT) {
    const ax = f.ax, e = f.s * (f.half + out), at = (y, off) => ax ? [r2(u), r2(y), r2(e + off)] : [r2(e + off), r2(y), r2(u)];
    parts.push({ s: 'box', p: at(y0 - 0.08, 0), size: ax ? [r2(W + 0.16), r2(H + 0.16), r2(t - 0.04)] : [r2(t - 0.04), r2(H + 0.16), r2(W + 0.16)], tint: 0x1a1b20 });
    parts.push({ s: 'box', p: at(y0, 0), size: ax ? [r2(W), r2(H), t] : [t, r2(H), r2(W)], tint: hex(ad[3]), glow: glowP });
    const ry = ax ? (f.s > 0 ? 0 : 180) : (f.s > 0 ? 270 : 90), off = f.s * (t / 2 + 0.02);
    const q = (y, ww, hh, words, font, mark) => parts.push({ s: 'quad', p: at(y, off), size: [r2(ww), r2(hh)], ry, uv: 'fit', kind: 'over', glow: glowT, tint: 16777215,
        key: 'txt:' + words + '|' + ad[2] + '||' + r2(ww / hh) + '||' + font + (mark ? '|' + mark : '') });
    q(y0 + H * 0.36, W * 0.9, H * 0.52, ad[0], ad[4], ad[5]); q(y0 + H * 0.1, W * 0.82, H * 0.2, ad[1], 'way', '');
}
const WALLS = { E: 1, B: 1 }, FOOD = /BURGER|COFFEE|CAFE|GRILL|RAMEN|KEBAB|BAKERY|DUMPLING|JUICE|ICE CREAM|SUNDAE|SLURP|MAMMA|FOOD|CANTEEN|NOODLE|MARKET|TRATTORIA|BAR\b|CLUB/, FOOD_AD = /BURGER|COFFEE|COLA/;
const NOT_WALL = /Glass|Window|Door|Shutter|Decal|Sign|^txt:/;
/* rows = the city's rows (new board rows are pushed onto it and returned in `rows`); districtOf(row) = its district letter;
   opt = { props: the city's props, streets: [{ pts: [[x, z], [x, z]], w }] } */
function apply(rows, districtOf, opt) { opt = opt || {};
    const K = { boards: 0, posters: 0, on: [], rows: [] }, by = {}, dress = {}, props = opt.props || [], streets = opt.streets || [];
    for (const r of rows) if (r.k === 'arch' && /:arch$/.test(String(r.id || '')) && Array.isArray(r.parts)) dress[String(r.id).replace(/:arch$/, '')] = r;
    const L = SC.solids(rows), trees = rows.filter(r => r.k === 'tree' && typeof r.x === 'number');
    /* does a street lie within 40 m out from (x, z) along (nx, nz)? */
    const onStreet = (x, z, nx, nz) => { for (let d = 5; d <= 40; d += 2.5) { const px = x + nx * d, pz = z + nz * d;
        for (const st of streets) { const a = st.pts[0], b = st.pts[1], dx = b[0] - a[0], dz = b[1] - a[1], LL = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / LL));
            if (Math.hypot(px - a[0] - dx * u, pz - a[1] - dz * u) < (st.w || 14) / 2) return true; } } return false; };
    /* THE ADVERT FITS (rule 5) */
    const placed = [], used = {};
    const pick = (x, z, own, not) => { let self = ADS.find(ad => own.some(w => w.length >= 6 && (ad[0].indexOf(w) === 0 || w.indexOf(ad[0]) === 0))); if (self && not && not.indexOf(self) >= 0) self = null;   // (its own name once a wall, never twice side by side)
        const food = own.some(w => FOOD.test(w)); let best = self || null, bs = -1;
        if (!best) ADS.forEach((ad, i) => { if ((food && FOOD_AD.test(ad[0])) || (not && not.indexOf(ad) >= 0)) return; let near = 1e9; placed.forEach(q => { if (q.ad === ad) near = Math.min(near, Math.hypot(q.x - x, q.z - z)); });
            const sc = Math.min(near, 400) - (used[ad[0]] || 0) * 6 - i * 0.01; if (sc > bs) { bs = sc; best = ad; } });
        placed.push({ ad: best, x, z }); used[best[0]] = (used[best[0]] || 0) + 1; return best; };
    /* a building's own names: its signs' words, under the business name the branding gives them (sign-fonts.js BRAND: BURGERS = MELTDOWN BURGER) */
    const ownWords = (A, d) => { const o = []; SC.expand(A).forEach(e => { if (!SC.isTxt(e.P)) return; const q = String(e.P.key).slice(4).split('|'); let w = q[0]; if (w.length < 3) return;
        try { const br = BRANDS.brandFor(d, w, q[2] || ''); if (br && br.words) w = br.words; } catch (x) {} w = w.toUpperCase(); if (o.indexOf(w) < 0) o.push(w); }); return o; };
    const span = r => { const turned = (((+r.rot || 0) % 180) + 180) % 180 === 90; return turned ? [r.d, r.w] : [r.w, r.d]; };
    const foot = [];   // every building's footprint in world axes: [x0, z0, x1, z1]
    for (const r of rows) { if ((r.k !== 'texbuilding' && r.k !== 'plateau') || typeof r.x !== 'number' || !r.w || !r.d) continue;
        const sp = span(r); foot.push([r.x - sp[0] / 2, r.z - sp[1] / 2, r.x + sp[0] / 2, r.z + sp[1] / 2, r.id]); }
    const inFoot = (x, z, me) => foot.some(f => f[4] !== me && x > f[0] && x < f[2] && z > f[1] && z < f[3]);
    /* (a square or a yard: no building's footprint for 16 m out) */
    const openOut = (x, z, nx, nz, me) => { for (let dd = 2; dd <= 16; dd += 2) if (inFoot(x + nx * dd, z + nz * dd, me)) return false; return true; };
    /* ── the roof boards ── */
    for (const r of rows) { if (r.k !== 'texbuilding' || !/^dc:P\d\d-\d\d-B\d$/.test(String(r.id || ''))) continue;
        const d = districtOf(r); if (!PER[d]) continue;
        const A = dress[r.id]; if (!A || typeof A.y !== 'number') continue;                       // (the dressing row carries the building's ground level)
        const wx = span(r)[0], wz = span(r)[1];
        if (Math.max(wx, wz) < 10 || Math.min(wx, wz) < 7 || (r.storeys || 1) > 4) continue;                                   // (no board on a tower's top: nobody reads it from the street)
        if (A.parts.some(p => p.s === 'roof' || p.s === 'cyl' && p.p && p.p[1] > (r.storeys || 1) * STOREY - 0.5 && (p.size || [])[0] > 3)) continue;   // a pitched roof or a dome: no board
        let T = (r.storeys || 1) * STOREY; for (const p of A.parts) if (p.s === 'box' && p.size && p.p && p.size[0] * p.size[2] > wx * wz * 0.3) T = Math.max(T, p.p[1] + p.size[1]);
        if (T > 20) continue;                                                                    // (a dressed tower, e.g. the hotel: same reason)
        const c = { id: r.id, x: r.x, z: r.z, y: A.y, T: r2(T), L: Math.max(wx, wz), S: Math.min(wx, wz), alongX: wx >= wz, st: r.storeys || 1, own: ownWords(A, d) };
        /* rule 4: the edges that look onto a street; and the board's own place on the roof must be empty air */
        const Lb = SC.near(L, r.x, r.z, c.L), W = Math.min(c.L * 0.8, 12), Hh = Math.min(W / 2.5, 4.6);
        c.edges = [1, -1].map(s => { const nx = c.alongX ? 0 : s, nz = c.alongX ? s : 0, e = s * (c.S / 2 - 0.3);
            if (!onStreet(r.x + nx * c.S / 2, r.z + nz * c.S / 2, nx, nz) && !openOut(r.x + nx * c.S / 2, r.z + nz * c.S / 2, nx, nz, r.id)) return false;
            for (const u of [-0.4, 0, 0.4]) for (const yy of [0.9, 0.7 + Hh / 2, 0.7 + Hh - 0.2]) { const w = c.alongX ? [r.x + u * W, A.y + T + yy, r.z + e] : [r.x + e, A.y + T + yy, r.z + u * W]; if (Lb.some(s2 => s2.P.s !== 'quad' && SC.inside(s2, w)) || SC.cast(Lb, w, [nx, 0, nz], 0, 1.5)) return false; }   // (a parapet or a roof hut at the edge: the board would stand in it or behind it)
            return true; });
        if (c.edges[0] || c.edges[1]) (by[d] = by[d] || []).push(c); }
    for (const d of Object.keys(PER)) { const LL = (by[d] || []).sort((a, c) => c.st - a.st || String(a.id).localeCompare(String(c.id))).slice(0, PER[d]);
        for (const c of LL) { const ads = c.edges.map((ok, i) => { if (!ok) return null; const s = i ? -1 : 1; return pick(c.alongX ? c.x : c.x + s * c.S / 2, c.alongX ? c.z + s * c.S / 2 : c.z, [], null); });
            const row = board(c, ads); rows.push(row); K.rows.push(row); K.boards += ads.filter(Boolean).length;
            K.on.push(d + ' roof ' + c.id + ' x ' + c.x + ' z ' + c.z + ' y ' + c.y + ' top ' + c.T + (c.alongX ? ' S: ' : ' E: ') + (ads[0] ? ads[0][0] : 'no street') + (c.alongX ? ' · N: ' : ' · W: ') + (ads[1] ? ads[1][0] : 'no street')); } }
    /* ── the wall boards and the posters ── */
    for (const r of rows.slice()) { if (r.k !== 'texbuilding' || !/^dc:P\d\d-\d\d-B\d$/.test(String(r.id || ''))) continue;
        const d = districtOf(r); if (!WALLS[d]) continue; const A = dress[r.id]; if (!A || typeof A.y !== 'number') continue;
        if (A.parts.some(p => p.s === 'box' && p.size && p.p && p.p[1] + p.size[1] > 20)) continue;   // (a dressed tower, e.g. the hotel: its own neon climbs that wall)
        const wx = span(r)[0], wz = span(r)[1], st = r.storeys || 1, own = ownWords(A, d), gy = A.y;
        const Lb = SC.near(L, r.x, r.z, Math.hypot(wx, wz) / 2 + 4);
        /* the building's own marks on the street: its signs and its doorways, in the room's metres */
        const marks = []; SC.expand(A).forEach(e => { const P = e.P; if (P.s !== 'quad' || P.flat || !(SC.isTxt(P) || P.hole)) return; const w = SC.frame(A, P).toWorld([P.hole ? P.hole[0] : 0, 1, 0]); marks.push([w[0], w[2]]); });
        const faces = [{ ax: true, s: 1, len: wx, half: wz / 2, n: 'S' }, { ax: true, s: -1, len: wx, half: wz / 2, n: 'N' }, { ax: false, s: 1, len: wz, half: wx / 2, n: 'E' }, { ax: false, s: -1, len: wz, half: wx / 2, n: 'W' }]
            .filter(f => { const nx = f.ax ? 0 : f.s, nz = f.ax ? f.s : 0; if (f.len < 9 || inFoot(r.x + nx * (f.half + 5), r.z + nz * (f.half + 5), r.id)) return false;
                /* rule 1: a front is the tenant's */
                return !marks.some(m => { const out = f.ax ? (m[1] - r.z) * f.s - f.half : (m[0] - r.x) * f.s - f.half, al = f.ax ? m[0] - r.x : m[1] - r.z; return out > -0.6 && out < 2.2 && Math.abs(al) <= f.len / 2 + 0.5; }); })
            .sort((a, b) => b.len - a.len);
        if (!faces.length) continue;
        /* rule 2: is the stretch W wide round u, from y0 up H, a blank wall with clear air before it? (t = the board's thickness, out = its stand-off) */
        const world = (f, u, y, o) => f.ax ? [r.x + u, gy + y, r.z + f.s * (f.half + o)] : [r.x + f.s * (f.half + o), gy + y, r.z + u];
        const blank = (f, u, y0, W, H, t, out, low) => { const n = f.ax ? [0, 0, f.s] : [f.s, 0, 0], bk = [-n[0], 0, -n[2]], Lf = f.L || (f.L = Lb.filter(s2 => { const o = f.ax ? (s2.c[1] - r.z) * f.s - f.half : (s2.c[0] - r.x) * f.s - f.half; return o > -s2.R - 0.6 && o < s2.R + 3.2; }));
            /* five columns first (most stretches fail here), then every 30 cm: a post or a pipe 30 cm wide between two columns is still in the way */
            const cols = [-0.46, -0.23, 0, 0.23, 0.46]; for (let a = -0.48; a <= 0.48; a += 0.3 / W) cols.push(a);
            for (const a of cols) for (const b of [0.06, 0.35, 0.65, 0.94]) { const w0 = world(f, u + a * W, y0 + b * H, out), w1 = world(f, u + a * W, y0 + b * H, out + t / 2 + 0.04);
                const h = SC.cast(Lf, w0, bk, 0, t / 2 + 0.32);   /* (from the board's middle: a pane lying exactly on its back is met too) */
                if (!h || h.exit || h.s.P.kind === 'over' || h.s.P.kind === 'glass' || NOT_WALL.test(String(h.s.P.key || ''))) return false;
                if (Lf.some(s2 => s2.P.s !== 'quad' && SC.inside(s2, w1)) || SC.cast(Lf, w1, n, 0, 2.5)) return false; }
            const mid = world(f, u, 0, 0), al = q => f.ax ? q.x - mid[0] : q.z - mid[2], ou = q => f.ax ? (q.z - mid[2]) * f.s : (q.x - mid[0]) * f.s;
            if (trees.some(q => Math.abs(al(q)) < W / 2 + 1.5 && ou(q) > -1 && ou(q) < 5)) return false;
            if (low && props.some(q => typeof q.x === 'number' && Math.abs(al(q)) < W / 2 + 0.7 && ou(q) > -0.6 && ou(q) < 2.4)) return false;
            return true; };
        const slide = (f, W, test) => { const lim = (f.len - W) / 2 - 0.4; if (lim < 0) return null; const us = [0]; for (let k = 0.5; k <= lim; k += 0.5) us.push(k, -k); for (const u of us) if (test(u)) return u; return null; };
        const parts = [], note = [];
        /* the upper board: two storeys or more, on the top storey */
        if (st >= 2) { const y0 = (st - 1) * STOREY + 0.5, Hh = STOREY - 0.9;
            for (const f of faces) { const W = r2(Math.min(f.len * 0.62, Hh * 2.6)), u = slide(f, W, uu => blank(f, uu, y0, W, Hh, 0.18, 0.22, false)); if (u == null) continue;
                const p = world(f, u, 0, 0), ad = pick(p[0], p[2], own, null); panel(parts, f, u, y0, W, Hh, 0.18, 0.22, ad, 0.55, 0.95); K.boards++; note.push(f.n + ' board: ' + ad[0]); break; } }
        /* the posters: one pair, side by side, on the first blank side wall */
        { const PW = 2.4, PH = 1.5, GAP = 0.4, W = PW * 2 + GAP;
            for (const f of faces) { const u = slide(f, W, uu => blank(f, uu, 0.9, W, PH, 0.1, 0.14, true)); if (u == null) continue;
                const p = world(f, u, 0, 0), a1 = pick(p[0], p[2], own, null), a2 = pick(p[0], p[2], own, [a1]);
                panel(parts, f, u - (PW + GAP) / 2, 0.9, PW, PH, 0.1, 0.14, a1, 0.45, 0.85); panel(parts, f, u + (PW + GAP) / 2, 0.9, PW, PH, 0.1, 0.14, a2, 0.45, 0.85);
                K.posters += 2; note.push(f.n + ' posters: ' + a1[0] + ', ' + a2[0]); break; } }
        if (!parts.length) continue;
        const row = { k: 'arch', id: 'bbw:' + r.id, x: r.x, z: r.z, y: gy, rot: 0, parts }; rows.push(row); K.rows.push(row);
        K.on.push(d + ' wall ' + r.id + ' (' + (own.slice(0, 2).join(', ') || 'no name') + ') x ' + r.x + ' z ' + r.z + ' ' + note.join(' · ')); }
    return K;
}
module.exports = { apply, ADS, PER };
