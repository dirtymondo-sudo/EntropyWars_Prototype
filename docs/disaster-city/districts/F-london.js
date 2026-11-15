/* DISASTER CITY · THE FINANCIAL DISTRICT · LONDON'S STREET (mondo 11-15: each district after a real city; the real-cities plan, his
   "Build it as drawn" 12:32 UTC: Financial = London). Required by F.js `build` (not a district file). The buildings' London changes are
   in F.js / F-detail.js; this file stands the street things:
   - RED PHONE BOXES built from parts (no new model): one on a free yard square beside a path in five plots. A phone box BLOCKS, so it
     stands on the middle of a whole 3.5 m square (mondo 11-13) with a ghost wall for the walker; a yard square, never a path square.
   - RED POST BOXES (pillar boxes, parts): decor, off the square's middle, beside each phone box; three black iron bollards with them.
   - STONE URNS (`stone_urn`, on R2) either side of the walk-in doors of the hotel, the bank offices and the penthouse stair (decor).
   - CAFE UMBRELLAS on the worker cafe's terrace: `pool_umbrella` over a `tulip_table` on three whole squares of the terrace's back row,
     the row in front of them and the north way in left open.
   The double-deck bus waits for mondo's OK on a Meshy concept (a new model); the black cabs are the car pack's car 7 in its black paint
   (F.js, the taxi court). Signs: plain `txt:` keys (the sign-font thread owns the faces). */
'use strict';
module.exports = function (api, K) {
    const { features, props, lateRows, cellAt, free, take, gc, r3, plotOf } = api, { box, cyl, dome, quad, U } = K;
    const RED = 0xc81e28, IRONK = 0x1c1e22, WHITE = 0xffffff, GLASS = U('GlassWindowSquare1a');
    const N = 12, made = { phone: 0, post: 0, urns: 0, umbrellas: 0 };
    const at = (x, z, rot, lx, lz) => { const q = rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q); return [r3(x + lx * c - lz * s), r3(z + lx * s + lz * c)]; };
    /* the phone box: a red cast box on a stone step, glazed in small panes on all four sides, a lit TELEPHONE band, a crown roof */
    const phoneBox = () => {
        const P = [box(0, 0, 0, 1.15, 0.14, 1.15, 'marble', 0xb8b2a6), box(0, 0.14, 0, 1.0, 2.3, 1.0, null, RED, { top: false })];
        for (const f of [[0, 0.51, 0], [-0.51, 0, 90], [0, -0.51, 180], [0.51, 0, 270]]) {
            P.push(quad(f[0], 0.75, f[1], 0.66, 1.35, f[2], GLASS, 0xe8eef0, { uv: 'fit' }));
            P.push(quad(f[0] * 1.02, 2.12, f[1] * 1.02, 0.78, 0.2, f[2], 'txt:TELEPHONE|#ffffff|#1a1a1a|4.5', WHITE, { uv: 'fit', glow: 0.6 }));
        }
        P.push(box(0, 2.44, 0, 1.12, 0.16, 1.12, null, RED), dome(0, 2.6, 0, 0.6, 0.26, null, RED, { seg: 12, rings: 3, roof: false }), box(0, 2.82, 0, 0.18, 0.12, 0.18, null, RED));
        P.push(box(0.36, 1.1, 0.53, 0.05, 0.3, 0.05, null, 0x30302c));   // the door's handle
        return P;
    };
    /* the pillar box: a red post on a black foot, a domed cap, the black slot */
    const postBox = (x, z) => [cyl(x, 0, z, 0.3, 0.12, null, IRONK, { seg: 12 }), cyl(x, 0.12, z, 0.27, 1.18, null, RED, { seg: 12, cap: false }),
        cyl(x, 1.3, z, 0.31, 0.08, null, RED, { seg: 12 }), dome(x, 1.38, z, 0.28, 0.16, null, RED, { seg: 12, rings: 3, roof: false }), box(x, 1.08, z + 0.26, 0.3, 0.05, 0.05, null, 0x0e0e0e)];
    const bollards = (x, z, n, st) => [cyl(x, 0, z, 0.1, 0.9, null, IRONK, { seg: 8, n, step: [st, 0, 0] }), dome(x, 0.9, z, 0.12, 0.1, null, IRONK, { seg: 8, rings: 2, roof: false, n, step: [st, 0, 0] })];

    /* the plots of the district (P08-00 .. P11-03) */
    const plots = []; for (let py = 0; py < 4; py++) for (let px = 8; px < 12; px++) { const id = 'P' + String(px).padStart(2, '0') + '-' + String(py).padStart(2, '0'); if (plotOf[id]) plots.push(plotOf[id]); }
    const D4 = [[0, 1, 0], [-1, 0, 90], [0, -1, 180], [1, 0, 270]];   // the path neighbour → the box's turn (its door looks onto the path)
    const want = ['P08-01', 'P09-00', 'P10-02', 'P11-02', 'P09-02', 'P11-00', 'P08-03'];
    for (const pid of want) {
        if (made.phone >= 5) break;
        const p = plotOf[pid]; if (!p) continue; let hit = null;
        for (let row = 1; row < N - 1 && !hit; row++) for (let col = 1; col < N - 1 && !hit; col++) {
            const cx = p.x * N + col, cy = p.y * N + row; if (!free(cx, cy, '.')) continue;
            const d = D4.find(v => cellAt(cx + v[0], cy + v[1]) === 'P'); if (!d) continue;
            if (D4.some(v => cellAt(cx + v[0], cy + v[1]) === 'D')) continue;   // never in front of a door
            hit = { cx, cy, rot: d[2] };
        }
        if (!hit) continue;
        take(hit.cx, hit.cy); const x = gc(hit.cx), z = gc(hit.cy);
        const parts = phoneBox().concat(postBox(-1.15, 0.7), bollards(1.05, 1.25, 3, -0.85));   // the post box and the bollards off the square's middle
        features.push({ k: 'arch', id: 'dc:F-london:phone' + made.phone, x, z, y: 0, rot: hit.rot, parts });
        const a = at(x, z, hit.rot, -0.5, 0), b = at(x, z, hit.rot, 0.5, 0);
        lateRows.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], t: 1.0, h: 2.6, ghost: true, rail: false });
        made.phone++; made.post++;
    }

    /* the stone urns beside three walk-in doors (decor, off the squares' middles) */
    for (const id of ['P08-00-B1', 'P10-01-B1', 'P10-03-B1']) {
        const f = features.find(r => r.id === 'dc:' + id && r.k === 'texbuilding'); if (!f || !f.hollow) continue;
        const L = f.w - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols, col = (isFinite(+f.door) && +f.door >= 1) ? Math.min(cols - 1, Math.round(+f.door) - 1) : Math.floor((cols - 1) / 2), lx = -L / 2 + (col + 0.5) * cw;
        for (const s of [-1, 1]) { const w = at(f.x, f.z, f.rot || 0, lx + s * (cw / 2 + 1.25), f.d / 2 + 0.55); props.push({ key: 'stone_urn', x: w[0], z: w[1], face: 0 }); made.urns++; }
    }

    /* the cafe umbrellas on the worker cafe's north terrace (its back row: cols 3, 8, 10 of row 1; row 2 and the way in at cols 5-6 stay open) */
    { const p = plotOf['P09-03'];
      if (p) for (const col of [3, 8, 10]) { const cx = p.x * N + col, cy = p.y * N + 1; if (cellAt(cx, cy) !== 'P') continue; const x = gc(cx), z = gc(cy);
          props.push({ key: 'pool_umbrella', x, z, face: 0 }, { key: 'tulip_table', x, z, face: 0 }, { key: 'tulip_chair', x: r3(x - 0.95), z: r3(z + 0.7), face: 90 }, { key: 'tulip_chair', x: r3(x + 0.95), z: r3(z + 0.7), face: 270 });
          take(cx, cy); made.umbrellas++; } }
    console.log('[financial] london', JSON.stringify(made));
};
