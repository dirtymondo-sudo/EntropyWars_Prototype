/* districts/E.js (2026-11-13) — DISASTER CITY, THE ENTERTAINMENT DISTRICT'S BUILDINGS (plots P08-04 .. P11-07).
   mondo 11-13: "architect the buildings ... every building should be unique and purposeful and recognizable ... domes, roof tops, modern
   architecture, curves"; his OK on the plan + mock-up 17:08 ("looks good, and remember this is basically replacing the strip").
   Loaded by bake-disaster-city.js (THE DISTRICT FILES, the build stage): repo-only tooling, never loaded by the game. For every building of the district
   it keeps the tool's own collision row (texbuilding / roof-route plateau) with its faces off (`skin: false`) and writes ONE `k: 'arch'`
   row of parts over the same footprint (docs/notes/areas-complexes.md "THE ARCHITECTURE ROW"). All numbers are metres from the building's
   footprint centre, x east, z south; `hw` / `hd` are the footprint's half sides. Notes: areas-complexes.md "THE ENTERTAINMENT DISTRICT". */
module.exports = { build: function (api) {
    const { C, gx, r3, features, lateRows, props, bInfo } = api;
    const D2R = Math.PI / 180, U = n => 'urban:' + n;
    /* the sheets (sprites.js URBAN_TEXTURES + the terrain keys): light ones take a tint cleanly */
    const GOLD = 'gold', BR1 = 'bricks_1', BR2 = 'bricks_2', BR3 = 'bricks_3', WOOD = 'wood_planks', PL = U('PlasterWallPainted1a'), ST = U('PlasterWallStucco1a'), MB = U('TileMarble1d'), MB3 = U('TileMarble3c'),
        SUB = U('TileSubway1a'), TG = U('TileGeneric1a'), CO = U('MetalCorrugatedPainted1a'), CO3 = U('MetalCorrugatedPainted3b'), CS = U('ConcreteStriped1c'), TR = U('MetalTruss1a'),
        GT = U('GlassWindowTall1a-Glow'), GF = U('GlassWindowFactory2a-Glow'), GS = U('GlassWindowSquare3a-Glow'), GR = U('GlassWindowResidential1-Glow1');
    /* a tint over a sheet: the sheets are mid grey, so the colour is lifted (clamped) to read as itself; a plain colour is written as is */
    const hex = s => parseInt(String(s).replace('#', ''), 16);
    const T = (s, key) => { const v = hex(s); if (!key) return v; const f = c => Math.min(255, Math.round(c * 1.7)); return (f(v >> 16 & 255) << 16) | (f(v >> 8 & 255) << 8) | f(v & 255); };
    const rows = [];
    const dropLate = id => { for (let i = lateRows.length - 1; i >= 0; i--) if (String(lateRows[i].id || '').indexOf('dc:' + id + '-s') === 0) lateRows.splice(i, 1); };
    /* B(id, o, fn): one building. o.walk = a walk-in shell (hollow, the city door in the plan's doorway), o.st = its storeys (the collision's
       and the roof slab's height), o.open = no collision row at all (an open pavilion). fn(b) writes the parts. */
    function B(id, o, fn) {
        const info = bInfo.find(q => q.id === id); if (!info) { console.error('entertainment: no building', id); return; }
        const row = features.find(f => f.id === 'dc:' + id); if (!row) { console.error('entertainment: no row', id); return; }
        const hw = info.cw * C / 2, hd = info.ch * C / 2, cx = r3(gx(info.cx0) + hw), cz = r3(gx(info.cy0) + hd);
        dropLate(id);
        let rot = 0, lx = 0, hollow = false;
        if (row.k === 'plateau') { row.bld = Object.assign({}, row.bld || {}, { skin: false }); }
        else if (o.open) { features.splice(features.indexOf(row), 1); }
        else {
            const side = info.side, ew = side === 'E' || side === 'W';
            rot = { S: 0, W: 90, N: 180, E: 270 }[side];
            row.x = cx; row.z = cz; row.w = r3((ew ? info.ch : info.cw) * C); row.d = r3((ew ? info.cw : info.ch) * C); row.rot = rot;
            delete row.key; row.style = row.style || 'office'; row.skin = false; row.storeys = o.st || 2;
            if (o.walk) { row.hollow = true; hollow = true; if (o.leaf) row.leaf = o.leaf; const L = row.w - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (row.door >= 1) col = Math.min(cols - 1, Math.round(row.door) - 1); else row.door = col + 1; lx = -L / 2 + (col + 0.5) * cw; }
            else { delete row.hollow; delete row.door; }
        }
        const parts = [], rc = Math.cos(-rot * D2R), rs = Math.sin(-rot * D2R);
        const fw = (rot === 90 || rot === 270) ? hd : hw, fd = (rot === 90 || rot === 270) ? hw : hd;        // the front's half width, the half depth back from it
        const loc = (u, v) => [r3(u * rc + v * rs), r3(-u * rs + v * rc)];                                    // the building's turned frame (front = +v) -> metres east / south
        const P = (s, x, y, z, key, tint, o2) => { const q = Object.assign({ s, p: [r3(x), r3(y), r3(z)] }, o2 || {}); if (key) q.key = key; if (tint != null) q.tint = T(tint, key); parts.push(q); return q; };
        const b = {
            hw, hd, id, parts, door: loc(lx, fd), out: loc(0, 1), along: loc(1, 0), side: info.side,
            box: (x, z, w, d, y, h, key, tint, o2) => P('box', x, y, z, key, tint, Object.assign({ size: [r3(w), r3(h), r3(d)] }, o2)),
            cyl: (x, z, r, y, h, key, tint, o2) => P('cyl', x, y, z, key, tint, Object.assign({ r: r3(r), h: r3(h), seg: 20 }, o2)),
            dome: (x, z, r, y, h, key, tint, o2) => P('dome', x, y, z, key, tint, Object.assign({ r: r3(r), h: r3(h) }, o2)),
            /* a roof over a w (east-west) x d (north-south) rectangle: o2.ridge 'x' | 'z'; a shed's o2.high = the side its high edge is on */
            roof: (form, x, z, w, d, y, h, key, tint, o2) => { o2 = Object.assign({}, o2); let ry = 0, sw = w, sd = d;
                if (form === 'shed') { ry = { n: 0, e: 90, s: 180, w: 270 }[o2.high || 'n']; if (ry === 90 || ry === 270) { sw = d; sd = w; } }
                else if (o2.ridge === 'z' || (!o2.ridge && d > w && form !== 'barrel')) { ry = 90; sw = d; sd = w; }
                delete o2.ridge; delete o2.high;
                return P('roof', x, y, z, key, tint, Object.assign({ form, size: [r3(sw), r3(h), r3(sd)], ry, roof: true }, o2)); },
            /* the footprint's four walls, 5 cm proud, the doorway cut in the front of a walk-in building */
            walls: (h, key, tint, o2) => { for (let k = 0; k < 4; k++) { const a = rot + k * 90, w2 = (k % 2 ? fd : fw) * 2 + 0.1, off = (k % 2 ? fw : fd) + 0.05, c = Math.cos(-a * D2R), s = Math.sin(-a * D2R);
                P('quad', off * s, 0, off * c, key, tint, Object.assign({ size: [r3(w2), r3(h)], ry: a % 360 }, k === 0 && hollow ? { hole: [r3(lx), 1.74, 2.2] } : {}, o2)); } return b; },
            top: (y, key, tint, inset) => P('quad', 0, y, 0, key, tint, { size: [r3(hw * 2 - (inset || 0) * 2), r3(hd * 2 - (inset || 0) * 2)], flat: true, roof: true }),
            /* a band right round the footprint (a cornice, a light strip): `out` metres proud */
            trim: (y, h, key, tint, out, o2) => P('box', 0, y, 0, key, tint, Object.assign({ size: [r3(hw * 2 + (out || 0.15) * 2), r3(h), r3(hd * 2 + (out || 0.15) * 2)], under: true }, o2)),
            /* a panel on a face: side 'n' | 's' | 'e' | 'w', u0..u1 along it (x for n / s, z for e / w) */
            face: (side, u0, u1, y, h, key, tint, o2) => { const m = (u0 + u1) / 2, pr = (o2 && o2.proud) || 0.09, o3 = Object.assign({}, o2); delete o3.proud;
                const q = side === 's' ? [m, hd + pr, 0] : side === 'n' ? [m, -hd - pr, 180] : side === 'w' ? [-hw - pr, m, 90] : [hw + pr, m, 270];
                return P('quad', (side === 'n' || side === 's') ? q[0] : q[0], y, (side === 'n' || side === 's') ? q[1] : q[1], key, tint, Object.assign({ size: [r3(Math.abs(u1 - u0)), r3(h)], ry: q[2] }, o3)); },
            /* a canopy over the doorway (or `at` metres along the front from the door), `dep` out from the wall, on two posts */
            canopy: (wid, dep, y, h, key, tint, o2) => { o2 = Object.assign({}, o2); const at = o2.at || 0, posts = o2.posts; delete o2.at; delete o2.posts; const c0 = loc(lx + at, fd + dep / 2);
                P('box', c0[0], y, c0[1], key, tint, Object.assign({ size: [r3(wid), r3(h), r3(dep)], ry: rot, under: true }, o2));
                if (posts) for (const sg of [-1, 1]) { const q = loc(lx + at + sg * (wid / 2 - 0.25), fd + dep - 0.25); P('cyl', q[0], 0, q[1], posts[0], posts[1], { r: 0.16, h: r3(y), seg: 8 }); }
                return b; },
        };
        fn(b);
        rows.push({ k: 'arch', id: 'dc:' + id + ':arch', x: cx, z: cz, rot: 0, parts });
        return b;
    }
    const GLOW = { glow: 0.55 }, NEON = { glow: 1 };

    /* ═══ P08-04 CASINO: the Strip's casino. Dark marble, brass bands, a domed corner tower, a red drive-up canopy ═══ */
    B('P08-04-B1', { walk: true, st: 2 }, b => {
        b.walls(9.6, MB, '#4a3560'); b.trim(9.6, 0.6, GOLD, null); b.top(9.9, CS, '#5a5560', 0.2);
        b.box(0, 0, b.hw * 2 - 1.6, b.hd * 2 - 3, 10.2, 3.2, ST, '#f1e2c0'); b.box(0, 0, b.hw * 2 - 1.2, b.hd * 2 - 2.6, 13.4, 0.4, GOLD, null);
        b.face('e', -b.hd + 6, b.door[1] - 1.4, 0.6, 2.6, GT, '#ffd9a0', GLOW); b.face('e', b.door[1] + 1.4, b.hd - 1, 0.6, 2.6, GT, '#ffd9a0', GLOW);
        b.face('e', -b.hd + 6, b.hd - 1, 5.2, 2.6, GS, '#ffc0e0', GLOW);
        const tx = b.hw - 0.4, tz = -b.hd + 2.6;                                                              // the tower on the north-east corner, on the street
        b.cyl(tx, tz, 3.0, 0, 15, MB, '#3a2a55'); b.cyl(tx, tz, 3.2, 9.6, 0.6, GOLD, null); b.cyl(tx, tz, 3.2, 14.6, 0.6, GOLD, null);
        b.dome(tx, tz, 3.0, 15.2, 2.6, CO, '#1f9a8c', { roof: true }); b.cyl(tx, tz, 0.45, 17.7, 4, GOLD, null, { r2: 0, seg: 8 });
        b.canopy(7.5, 4.6, 3.9, 0.7, PL, '#c8202c', { glow: 0.35, posts: [GOLD, null] });
    });
    B('P08-04-B2', { st: 1 }, b => {                                                                          // the pawn + chip exchange
        b.walls(4.2, BR2, '#b5653c'); b.roof('shed', 0, 0, b.hw * 2, b.hd * 2, 4.2, 1.6, CO3, '#2f5d50', { high: 'e', over: 0.5 });
        b.face('s', -b.hw + 1, b.hw - 1, 2.7, 0.9, null, '#7dff9a', NEON); b.canopy(b.hw * 2 - 1, 1.6, 2.5, 0.2, CO, '#e8c020', { at: 0 });
    });
    /* ═══ P09-04 COSTUME SHOPS: brick below, a white upper floor that overhangs, the roof walked (roof route) ═══ */
    B('P09-04-B1', {}, b => {
        b.walls(3.5, BR1, '#a8523a'); b.box(0, 0, b.hw * 2 + 0.8, b.hd * 2 + 0.8, 3.5, 3.5, PL, '#f4ead6', { under: true, top: false });
        for (const s of ['n', 's']) b.box(0, (s === 'n' ? -1 : 1) * (b.hd + 0.3), b.hw * 2 + 0.8, 0.2, 7, 0.9, WOOD, '#5b3a22');
        for (const s of [-1, 1]) b.box(s * (b.hw + 0.3), 0, 0.2, b.hd * 2 + 0.8, 7, 0.9, WOOD, '#5b3a22');
        b.face('s', -b.hw + 1, b.hw - 1, 4.2, 2.2, GR, '#ffe6b0', { glow: 0.5, proud: 0.45 }); b.face('w', -b.hd + 1, b.hd - 1, 4.2, 2.2, GR, '#ffe6b0', { glow: 0.5, proud: 0.45 });
        b.roof('shed', 0, b.hd + 0.9, b.hw * 2, 1.4, 2.6, 0.7, PL, '#d0306a', { high: 'n', roof: false }); b.face('s', -b.hw + 1.5, b.hw - 1.5, 0.5, 2.0, GT, '#ffd0e8', GLOW);
    });
    B('P09-04-B2', { st: 1 }, b => {                                                                          // masks + wigs
        b.walls(5.2, ST, '#7a4fb0'); b.roof('hip', 0, 0, b.hw * 2, b.hd * 2, 5.2, 2.8, CO, '#3a2a55', { over: 0.5 });
        b.face('n', -b.hw + 1, b.hw - 1, 0.6, 2.2, GS, '#e0c0ff', GLOW); b.face('n', -b.hw + 1, b.hw - 1, 3.3, 0.7, null, '#e0a0ff', NEON);
    });
    B('P09-04-B3', { st: 1 }, b => {                                                                          // the tailor's workshop: a saw-tooth roof
        b.walls(4.4, CO, '#2e8a8a'); const n = 3, sw = b.hw * 2 / n;
        for (let i = 0; i < n; i++) { const x = -b.hw + (i + 0.5) * sw; b.roof('shed', x, 0, sw, b.hd * 2, 4.4, 1.8, CO3, '#8a8f98', { high: 'e', keyEnd: GF, tintEnd: 0xd8f0ff }); }
        b.face('s', -b.hw + 1, b.hw - 1, 2.9, 0.7, null, '#f4ead6', { glow: 0.4 });
    });
    /* ═══ P10-04 CONCERT HALL: the district's landmark. A pale stone podium (its roof walked), a drum, a green dome, a glass lobby, the marquee ═══ */
    B('P10-04-B1', {}, b => {
        b.walls(7, MB3, '#e9e4da'); b.trim(7, 0.5, CS, '#cfc8b8', 0.2, { top: false });
        b.cyl(0, 1.5, 8.6, 7, 6, ST, '#efe8d8', { seg: 28, cap: false }); b.cyl(0, 1.5, 8.85, 12.6, 0.7, GOLD, null, { seg: 28 }); b.dome(0, 1.5, 8.6, 13.3, 4.4, CO, '#3f9c86', { seg: 28, rings: 7, roof: true });
        b.cyl(0, 1.5, 0.6, 17.6, 3.5, GOLD, null, { r2: 0, seg: 8 });
        b.box(0, b.hd - 2.2, 9, 3.2, 7, 9, BR3, '#5a5560');                                                    // the fly tower over the stage (south)
        b.cyl(0, -b.hd, 5.2, 0, 4.3, GT, '#cfe8ff', { arc: 180, a0: 180, glow: 0.55, seg: 24 }); b.cyl(0, -b.hd, 5.7, 4.3, 0.9, PL, '#b01828', { arc: 180, a0: 180, glow: 0.35, seg: 24 });   // the glass lobby drum + its red fascia
        b.box(0, -b.hd - 1.4, 25, 2.6, 4.3, 0.9, PL, '#b01828', { glow: 0.35, under: true });                  // the marquee's wings
        for (const s of [-1, 1]) { b.cyl(s * 12, -b.hd - 2.3, 0.3, 0, 4.3, MB, '#555', { seg: 8 }); b.face('n', s * 9.6 - 2.6, s * 9.6 + 2.6, 4.36, 0.78, null, '#fff6d0', { glow: 0.9, proud: 2.75 }); }
        b.box(0, -b.hd - 0.6, 2.8, 1.6, 5.2, 9, PL, '#b01828', { glow: 0.45 });                                // the blade sign
        b.face('n', -1.1, 1.1, 6, 7.4, null, '#fff6d0', { glow: 0.9, proud: 1.45 });
    });
    /* ═══ P11-04 RECORDING STUDIO: a low dark metal and timber box, a sloped roof, a round glass lobby, the red mast. Brick lofts behind ═══ */
    B('P11-04-B1', { walk: true, st: 1 }, b => {
        b.walls(5.2, CO, '#2b2f38'); b.trim(3.4, 1.8, WOOD, '#8a5a34', 0.08, { top: false });
        b.roof('shed', 0, 0, b.hw * 2, b.hd * 2, 5.2, 2.4, CO3, '#1c1f26', { high: 'e', over: 0.6, keyEnd: CO, tintEnd: T('#2b2f38', CO) });
        b.cyl(-b.hw, b.hd - 3.5, 3.6, 0, 5.2, GT, '#bfe0ff', { glow: 0.5, seg: 24 }); b.cyl(-b.hw, b.hd - 3.5, 3.9, 5.2, 0.4, CS, '#e8e8e8', { seg: 24 });
        b.cyl(b.hw - 4, -1, 0.15, 5.6, 9, TR, '#d03030', { seg: 6 }); b.cyl(b.hw - 4, -1, 0.2, 11, 1.4, CO, '#d8d8d8', { r2: 1.6, seg: 12 });
        b.face('s', b.door[0] + 2, b.hw - 1.5, 3.6, 0.9, null, '#ff4040', NEON);
    });
    B('P11-04-B2', {}, b => {                                                                                 // the artist lofts (the roof walked)
        b.walls(7, BR1, '#8f4a3a'); b.trim(7, 0.9, BR1, '#6f3a2e', 0.02, { top: false });
        b.face('w', -b.hd + 1.5, b.hd - 1.5, 4.2, 2, GR, '#ffe6b0', GLOW); b.face('w', -b.hd + 4, b.hd - 1.5, 0.8, 2.2, GR, '#ffe6b0', GLOW);
        b.cyl(b.hw - 3, b.hd - 4, 1.3, 7, 3.4, WOOD, '#7a5a3a'); b.cyl(b.hw - 3, b.hd - 4, 1.5, 10.4, 1.2, CO3, '#555', { r2: 0 });
    });
    /* ═══ P08-05 RESTAURANT COURT: a trattoria, a ramen house, a grill with a roof terrace (one walk-in shell); the burger drive-in across the road ═══ */
    B('P08-05-B1', { walk: true, st: 1 }, b => {
        const L = b.hd * 2, z0 = -b.hd, w = b.hw * 2, s1 = L * 0.31, s2 = L * 0.30, s3 = L - s1 - s2;         // three houses north to south along the west front
        b.walls(3.5, PL, '#b02020');                                                                          // the shell (the ramen house's red, the door in it)
        /* the trattoria (north): terracotta, a red gable, a green awning, a chimney */
        b.box(0, z0 + s1 / 2, w + 0.2, s1, 0, 5, ST, '#d98a58'); b.roof('gable', 0, z0 + s1 / 2, w, s1, 5, 2.4, CO, '#b03a28', { ridge: 'x', over: 0.5, keyEnd: ST, tintEnd: T('#d98a58', ST) });
        b.cyl(b.hw - 1.5, z0 + 2, 0.45, 5, 4, BR1, '#a05a40', { seg: 8 }); b.roof('shed', -b.hw - 0.9, z0 + s1 / 2, 1.6, s1 - 2, 2.6, 0.7, PL, '#2a8a4a', { high: 'e', roof: false });
        b.face('w', z0 + 1.2, z0 + s1 - 1.2, 0.7, 1.9, GR, '#ffe6b0', { glow: 0.55, proud: 0.2 });
        /* the ramen house (middle): red, two tiers of deep dark eaves, a small hip on top */
        const zm = z0 + s1 + s2 / 2;
        b.box(0, zm, w + 2.4, s2 + 1.2, 3.6, 0.3, WOOD, '#3a2618', { under: true }); b.box(0, zm, w - 2, s2 - 1.6, 3.9, 2.6, PL, '#b02020'); b.box(0, zm, w + 0.4, s2 - 0.2, 6.5, 0.3, WOOD, '#3a2618', { under: true });
        b.roof('hip', 0, zm, w - 2, s2 - 1.6, 6.8, 1.6, CO, '#2a2a30', { over: 0.3 }); b.face('w', zm - 2.2, zm + 2.2, 2.5, 0.8, null, '#f4e8c8', { glow: 0.7 });
        /* the rooftop grill (south): brick, a terrace under a pergola, a smokestack */
        const zs = z0 + s1 + s2 + s3 / 2;
        b.box(0, zs, w + 0.2, s3, 0, 7, BR1, '#9a5038'); b.box(0, zs, w + 0.3, s3 + 0.1, 7, 1, BR1, '#7a4030', { top: false });
        b.box(-0.6, zs, w - 3, s3 - 2.4, 9.6, 0.2, WOOD, '#5b3a22', { under: true });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(-0.6 + sx * (w / 2 - 1.8), zs + sz * (s3 / 2 - 1.5), 0.1, 7, 2.6, WOOD, '#5b3a22', { seg: 6 });
        b.cyl(b.hw - 1.4, zs + s3 / 2 - 1.6, 0.5, 7, 5, CO, '#444', { seg: 10 });
        b.face('w', zs - s3 / 2 + 1.2, zs + s3 / 2 - 1.2, 0.7, 2.2, GT, '#ffd0a0', { glow: 0.55, proud: 0.2 }); b.face('w', zs - s3 / 2 + 1.2, zs + s3 / 2 - 1.2, 4.2, 2, GR, '#ffe6b0', { glow: 0.55, proud: 0.2 });
        b.face('w', zs - 3.5, zs + 3.5, 3.0, 0.9, null, '#ff9030', { glow: 1, proud: 0.22 });
    });
    B('P08-05-B2', { st: 1 }, b => {                                                                          // the burger drive-in: a low box, a cantilever canopy, the giant burger on a pole
        b.walls(3.6, TG, '#f4f0e8'); b.trim(2.9, 0.7, PL, '#d02828', 0.06, { top: false }); b.box(0.6, 0, b.hw * 2 + 3.4, b.hd * 2 + 1.4, 3.6, 0.3, CO, '#f0c020', { under: true });
        b.face('e', -b.hd + 1.5, b.hd - 1.5, 0.9, 1.9, GT, '#cfe8ff', GLOW);
        const px = b.hw + 2.6, pz = -b.hd + 1.2;
        b.cyl(px, pz, 0.15, 0, 6, TR, '#888', { seg: 6 }); b.cyl(px, pz, 1.5, 6, 0.6, PL, '#c98a3a'); b.cyl(px, pz, 1.6, 6.6, 0.5, null, '#5a2a18'); b.cyl(px, pz, 1.65, 7.1, 0.15, null, '#f0c020'); b.cyl(px, pz, 1.65, 7.25, 0.15, null, '#3a9a3a'); b.dome(px, pz, 1.5, 7.4, 1.05, PL, '#c98a3a');
    });
    /* ═══ P09-05 COMEDY THEATER: a brick vaudeville house, a stepped front, a barrel roof, the yellow marquee, the blade sign ═══ */
    B('P09-05-B1', { walk: true, st: 3 }, b => {
        b.walls(10.7, BR1, '#b06a48'); b.top(10.62, CS, '#6a5a50', 0.1);
        b.box(0, -b.hd + 0.3, b.hw * 2 + 0.1, 0.6, 10.5, 1.2, ST, '#f0e0c0'); b.box(0, -b.hd + 0.3, b.hw * 2 * 0.62, 0.6, 11.7, 1.2, ST, '#f0e0c0'); b.box(0, -b.hd + 0.3, b.hw * 2 * 0.26, 0.6, 12.9, 1.4, ST, '#f0e0c0');
        b.roof('barrel', 0, 1.2, b.hw * 2 - 4, b.hd * 2 - 3.6, 10.5, 4.2, CO, '#5a2030', { ridge: 'z', seg: 12, keyEnd: BR1, tintEnd: T('#b06a48', BR1) });
        b.face('n', -b.hw + 1, b.hw - 1, 5.2, 3.4, GT, '#ffe0a0', GLOW);
        b.canopy(17, 3.4, 3.9, 0.9, PL, '#f0c020', { glow: 0.45 });
        b.box(b.hw + 0.5, -b.hd - 0.2, 0.9, 3.4, 4, 13, PL, '#d02848', { glow: 0.45 });
        b.canopy(4, 1.4, 2.6, 0.2, CO, '#d02848', { at: 0, posts: null });
    });
    /* ═══ P10-05 BACKSTAGE YARD: the loading dock (its roof walked), yellow shutters; the performers' trailers ═══ */
    B('P10-05-B1', {}, b => {
        b.walls(7, CO, '#7d8794'); b.trim(7, 0.9, CO3, '#555b66', 0.02, { top: false });
        for (const s of [-1, 1]) b.face('s', s * 3.8 - 2.4, s * 3.8 + 2.4, 0, 3.6, CO3, '#c8a020');
        b.roof('shed', 0, b.hd + 1.5, b.hw * 2, 3, 4.0, 0.9, CO3, '#3c4048', { high: 'n', roof: false, under: true }); b.box(0, b.hd + 0.9, b.hw * 2, 1.8, 0, 1.0, CS, '#aaaaaa');
        b.face('s', -6, 6, 4.9, 0.8, null, '#ffd24a', { glow: 0.8 });
    });
    B('P10-05-B2', { st: 1 }, b => {                                                                          // the crew canteen behind the trailers: plain, low, striped awning
        b.walls(3.8, PL, '#e8dcc0'); b.roof('gable', 0, 0, b.hw * 2, b.hd * 2, 3.8, 1.8, CO, '#7a8a5a', { ridge: 'x', over: 0.4, keyEnd: PL, tintEnd: T('#e8dcc0', PL) });
        b.face('n', -b.hw + 1.5, b.hw - 1.5, 0.8, 1.8, GR, '#ffe6b0', GLOW);
    });
    /* ═══ P11-05 FILM STUDIO: a cream sound stage under a great vault, the front office (its roof walked), the blue stage door, the water tower ═══ */
    B('P11-05-B1', {}, b => {
        b.walls(7, ST, '#f2e6c8'); b.trim(7, 0.45, PL, '#b03020', 0.12, { top: false });
        b.face('n', -b.hw + 1, b.hw - 1, 4.2, 2, GS, '#ffe6b0', GLOW);
        const sd = b.hd * 2 - 10.5;                                                                            // the stage: the back 17.5 m (the north 10.5 m stay the walked roof)
        b.box(0, b.hd - sd / 2, b.hw * 2 - 1, sd - 0.5, 7, 2.5, CO, '#d9cfb4', { top: false }); b.roof('barrel', 0, b.hd - sd / 2, b.hw * 2 - 1, sd - 0.5, 9.5, 5, CO3, '#8f8a7c', { ridge: 'x', seg: 12, keyEnd: CO, tintEnd: T('#d9cfb4', CO) });
        b.face('e', 2, 9, 0, 6.5, CO3, '#3a6ea8'); b.face('e', 2.4, 8.6, 7.2, 1.8, null, '#d9cfb4', { glow: 0.5 });
        const wx = b.hw + 2.2, wz = b.hd + 2.2;                                                                // the water tower, off the south-east corner
        b.cyl(wx, wz, 1.7, 9, 3.4, CO, '#f0f0f0'); b.cyl(wx, wz, 1.9, 12.4, 1.5, CO3, '#b03020', { r2: 0 });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(wx + sx * 1.2, wz + sz * 1.2, 0.12, 0, 9, TR, '#888888', { seg: 6 });
        b.box(0, -b.hd - 0.9, 10, 1.8, 3.3, 0.5, PL, '#b03020', { glow: 0.4, under: true });
    });
    /* ═══ P08-06 NIGHT MARKET: an open pavilion of coloured canopies over stalls (no walls: walked through); the noodle bar ═══ */
    B('P08-06-B1', { open: true }, b => {
        const cols = ['#d83030', '#f0b020', '#2a9a6a', '#3070d0'], n = 4, sl = (b.hd * 2 - 3.5) / n;
        for (let i = 0; i < n; i++) { const z = -b.hd + 1.75 + (i + 0.5) * sl;
            b.roof('gable', 0, z, b.hw * 2 - 1.4, sl, 3.4, 1.6, PL, cols[i], { ridge: 'x', over: 0.3, ds: true, roof: false });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * (b.hw - 0.9), z + sz * (sl / 2 - 0.3), 0.12, 0, 3.4, WOOD, '#5b3a22', { seg: 6 });
            b.box(-1.6, z, 3.8, sl - 2.4, 0, 1.0, WOOD, '#9a7248'); b.box(-1.6, z, 3.8, sl - 2.4, 1.0, 0.5, PL, cols[(i + 1) % 4]);
            features.push({ k: 'wall', x0: r3(gx(bInfo.find(q => q.id === b.id).cx0) + b.hw - 1.6), z0: r3(gx(bInfo.find(q => q.id === b.id).cy0) + b.hd + z - (sl - 2.4) / 2 + 0.9), x1: r3(gx(bInfo.find(q => q.id === b.id).cx0) + b.hw - 1.6), z1: r3(gx(bInfo.find(q => q.id === b.id).cy0) + b.hd + z + (sl - 2.4) / 2 - 0.9), h: 1.5, t: 3.6, key: 'urban:ConcreteStriped2a', ghost: true, rail: false });   // the stall blocks
        }
        b.box(b.hw + 0.4, 0, 0.3, 14, 5.2, 0.9, null, '#ff60c0', NEON); for (const s of [-1, 1]) b.cyl(b.hw + 0.4, s * 6.8, 0.14, 0, 5.2, TR, '#333333', { seg: 6 });
    });
    B('P08-06-B2', { st: 1 }, b => {                                                                          // the noodle bar: red, two wide dark eaves
        b.walls(4, PL, '#b02020'); b.box(0, 0, b.hw * 2 + 2.6, b.hd * 2 + 2.6, 4, 0.35, WOOD, '#2a1a12', { under: true }); b.box(0, 0, b.hw * 2 - 2.4, b.hd * 2 - 3.5, 4.35, 1.6, PL, '#b02020');
        b.box(0, 0, b.hw * 2 + 0.4, b.hd * 2 - 0.6, 5.95, 0.3, WOOD, '#2a1a12', { under: true }); b.face('s', -3.5, 3.5, 2.7, 0.9, null, '#f4e8c8', { glow: 0.7 });
    });
    /* ═══ P09-06 CABARET: a red house with a round turret under a cone; the magic shop; the prop store ═══ */
    B('P09-06-B1', { walk: true, st: 2 }, b => {
        b.walls(7.5, PL, '#a01830'); b.trim(7.5, 0.5, ST, '#f0d8a0', 0.15, { top: false }); b.roof('hip', 0, 0, b.hw * 2 - 2, b.hd * 2 - 2, 8, 2, CO, '#3a1018');
        const tx = -b.hw, tz = -b.hd;                                                                          // the turret on the north-west corner
        b.cyl(tx, tz, 2.6, 0, 11, PL, '#b82038'); b.cyl(tx, tz, 2.8, 7.5, 0.5, ST, '#f0d8a0'); b.cyl(tx, tz, 3.1, 11, 4.5, CO, '#3a1018', { r2: 0, roof: true });
        b.face('n', -b.hw + 3.5, b.hw - 1, 4.2, 2.2, GT, '#ffb0c8', GLOW); b.face('n', -b.hw + 3.5, b.hw - 1, 2.9, 0.8, null, '#ff80a0', NEON);
        b.canopy(3.4, 1.6, 2.6, 0.25, PL, '#f0d8a0', { glow: 0.3 });
    });
    B('P09-06-B2', { st: 1 }, b => {                                                                          // magic + jokes: purple, a tall pointed roof
        b.walls(5, ST, '#3a2a6a'); b.roof('pyramid', 0, 0, b.hw * 2, b.hd * 2, 5, 4.2, CO, '#201840', { over: 0.5 });
        b.face('s', -b.hw + 1, b.hw - 1, 0.7, 2, GS, '#c0a0ff', GLOW); b.face('s', -b.hw + 1, b.hw - 1, 3.1, 0.8, null, '#c0a0ff', NEON);
    });
    B('P09-06-B3', { st: 1 }, b => {                                                                          // the prop store: orange corrugated, a roller door
        b.walls(4.6, CO, '#b8742a'); b.roof('shed', 0, 0, b.hw * 2, b.hd * 2, 4.6, 1.5, CO3, '#6a6a70', { high: 'w', over: 0.4, keyEnd: CO, tintEnd: T('#b8742a', CO) });
        b.face('s', -3, 3, 0, 3.3, CO3, '#4a4a50'); b.face('s', -b.hw + 1, b.hw - 1, 3.5, 0.7, null, '#ffffff', { glow: 0.5 });
    });
    /* ═══ P10-06 STAGE WORKSHOP: the scenery shop. Brick, a saw-tooth glass roof, the paint tower, a chimney, the lumber lean-to ═══ */
    B('P10-06-B1', { walk: true, st: 2 }, b => {
        b.walls(7, BR3, '#8a6a58'); const n = 4, sd = b.hd * 2 / n;
        for (let i = 0; i < n; i++) b.roof('shed', 0, -b.hd + (i + 0.5) * sd, b.hw * 2, sd, 7, 2.6, CO3, '#59616c', { high: 's', keyEnd: GF, tintEnd: 0xd8f0ff });
        b.box(b.hw - 2.8, -b.hd + 2.8, 5.6, 5.6, 7, 8, BR3, '#7a5a4a'); b.roof('pyramid', b.hw - 2.8, -b.hd + 2.8, 5.6, 5.6, 15, 1.8, CO, '#3a4048', { over: 0.3 });
        b.cyl(-b.hw + 2.1, b.hd - 2.8, 0.7, 7, 8, BR2, '#6a4a3c', { r2: 0.5, seg: 10 });
        b.roof('shed', -b.hw - 1.9, 3.5, 3.8, 17.5, 3.6, 1, CO3, '#59616c', { high: 'e', roof: false, under: true });
        for (const s of [-1, 1]) b.cyl(-b.hw - 3.5, 3.5 + s * 8.4, 0.12, 0, 3.6, WOOD, '#5b3a22', { seg: 6 });
        b.box(-b.hw - 1.7, 3.5, 2.6, 14, 0, 1.2, WOOD, '#b08a58');
        b.face('n', -b.hw + 1, b.door[0] - 4.5, 2.6, 2.6, GF, '#d8f0ff', GLOW); b.face('n', b.door[0] + 4.5, b.hw - 6, 2.6, 2.6, GF, '#d8f0ff', GLOW);
        b.face('n', b.door[0] + 1.2, b.door[0] + 4.4, 0, 3.6, CO3, '#c8a020'); b.face('n', -8, 4, 5.6, 1, null, '#f0e8d0', { glow: 0.4 });
    });
    /* ═══ P11-06 ARCADE: black tile, a rounded west end, pink and cyan light bands, an arched entry, the gold token on the roof; the apartments ═══ */
    B('P11-06-B1', { walk: true, st: 1 }, b => {
        b.walls(6.3, SUB, '#1c1a2a'); b.top(6.3, CS, '#2a2838', 0.1);
        b.cyl(-b.hw, 0, b.hd, 0, 6.3, SUB, '#1c1a2a', { arc: 180, a0: 90, seg: 24 });
        for (const q of [[2.9, '#ff30c0'], [5.6, '#30e0ff']]) { b.trim(q[0], 0.25, null, q[1], 0.12, NEON); b.cyl(-b.hw, 0, b.hd + 0.12, q[0], 0.25, null, q[1], { arc: 180, a0: 90, seg: 24, glow: 1 }); }
        b.roof('barrel', b.door[0], b.hd + 1.75, 6.3, 3.5, 2.9, 1.1, null, '#30e0ff', { ridge: 'z', glow: 0.8, roof: false, ds: true });
        for (const s of [-1, 1]) b.box(b.door[0] + s * 3, b.hd + 1.75, 0.35, 3.5, 0, 2.9, null, '#ff30c0', NEON);
        b.face('s', b.door[0] + 4.5, b.hw - 1, 0.5, 2.3, GT, '#a0ffff', GLOW);
        b.cyl(b.hw - 6, 0, 2.6, 7.2, 0.5, null, '#f0c020', { glow: 0.5 }); b.cyl(b.hw - 6, 0, 0.3, 6.3, 0.9, TR, '#444444', { seg: 6 });
    });
    B('P11-06-B2', { st: 3 }, b => {                                                                          // the apartments (the repeating kind): brick, a gable, balconies
        b.walls(10.5, BR2, '#9a5a44'); b.roof('gable', 0, 0, b.hw * 2, b.hd * 2, 10.5, 3, CO, '#3a3038', { ridge: 'z', over: 0.4, keyEnd: BR2, tintEnd: T('#9a5a44', BR2) });
        for (const y of [4.2, 7.7]) { b.face('w', -b.hd + 1.4, b.hd - 1.4, y, 2, GR, '#ffe6b0', GLOW); b.box(-b.hw - 0.7, 0, 1.4, b.hd * 2 - 2.4, y - 0.7, 0.15, TR, '#333333', { under: true }); }
    });
    /* ═══ P09-07 KITCHEN LANE: the bakery (a gable, two chimneys); the kebab kiosk ═══ */
    B('P09-07-B1', { walk: true, st: 1 }, b => {
        b.walls(5, BR1, '#c08a5a'); b.roof('gable', 0, 0, b.hw * 2, b.hd * 2, 5, 2.6, CO, '#6a3a2a', { ridge: 'x', over: 0.4, keyEnd: BR1, tintEnd: T('#c08a5a', BR1) });
        for (const s of [-1, 1]) b.cyl(s * 5, -1, 0.5, 5, 5, BR3, '#5a4a44', { seg: 8 });
        b.face('s', -b.hw + 1.5, b.hw - 1.5, 0.6, 2, GR, '#ffe6b0', GLOW); b.roof('shed', 0, b.hd + 0.7, b.hw * 2 - 2, 1.4, 2.7, 0.6, PL, '#f0e0b0', { high: 'n', roof: false });
        b.canopy(3, 1.4, 2.6, 0.2, PL, '#f0e0b0');
    });
    B('P09-07-B2', { st: 1 }, b => {                                                                          // kebab, 24 h
        b.walls(3.8, TG, '#e8e0d0'); b.roof('shed', 0, 0, b.hw * 2, b.hd * 2, 3.8, 1.4, CO3, '#2a6a4a', { high: 'n', over: 0.6 });
        b.face('s', -b.hw + 1.5, b.hw - 1.5, 1.0, 1.4, GS, '#fff0c0', GLOW); b.face('s', -5, 5, 2.6, 0.8, null, '#30ff90', NEON);
    });
    /* ═══ P10-07 CREW STAIR: the long crew house with three dormers; the octagon ticket booth ═══ */
    B('P10-07-B1', { walk: true, st: 2 }, b => {
        b.walls(7, BR2, '#7a6a8a'); b.roof('gable', 0, 0, b.hw * 2, b.hd * 2, 7, 2.8, CO, '#34303c', { ridge: 'x', over: 0.4, keyEnd: BR2, tintEnd: T('#7a6a8a', BR2) });
        for (const x of [-9, 0, 9]) { b.box(x, -b.hd + 1.6, 3, 2.6, 7, 1.5, BR2, '#7a6a8a'); b.roof('gable', x, -b.hd + 1.6, 3, 3.2, 8.5, 1.3, CO, '#34303c', { ridge: 'z', keyEnd: GR, tintEnd: 0xffe6b0 }); }
        b.face('n', -b.hw + 1.5, b.door[0] - 1.6, 4.2, 2, GR, '#ffe6b0', GLOW); b.face('n', b.door[0] + 1.6, b.hw - 1.5, 4.2, 2, GR, '#ffe6b0', GLOW);
        b.canopy(4, 1.5, 2.6, 0.2, CO, '#ffd24a', { glow: 0.3 });
    });
    B('P10-07-B2', { st: 1 }, b => {                                                                          // the box office: a red hall, an octagon lantern under a yellow cone
        b.walls(3.7, PL, '#c02848'); b.top(3.7, CS, '#7a3040', 0.1); b.trim(3.3, 0.4, GOLD, null, 0.1, { top: false });
        b.face('e', -b.hd + 1.2, b.hd - 1.2, 1.0, 1.5, GS, '#fff0c0', GLOW); b.face('s', -b.hw + 1.2, b.hw - 1.2, 1.0, 1.5, GS, '#fff0c0', GLOW);
        b.cyl(0, 0, 3.6, 3.7, 2.2, PL, '#c02848', { seg: 8 }); b.cyl(0, 0, 3.65, 4.2, 1.2, GS, '#fff0c0', { seg: 8, glow: 0.55, cap: false }); b.cyl(0, 0, 4.4, 5.9, 2.6, CO, '#f0c020', { r2: 0, seg: 8, roof: true });
        b.cyl(0, 0, 0.3, 8.5, 1.2, GOLD, null, { r2: 0.05, seg: 6 });
    });
    /* ═══ P11-07 CINEMA: a cream deco front, a stepped top, the teal fin, the marquee round the corner ═══ */
    B('P11-07-B1', { walk: true, st: 3 }, b => {
        b.walls(10.7, ST, '#f0e2c4'); b.top(10.62, CS, '#8a8070', 0.1);
        b.box(-b.hw + 0.45, 0, 0.9, b.hd * 2 * 0.7, 10.5, 1.4, ST, '#f0e2c4'); b.box(-b.hw + 0.45, 0, 0.9, b.hd * 2 * 0.4, 11.9, 1.4, ST, '#f0e2c4');
        b.box(-b.hw - 0.75, 0, 1.5, 1.4, 3.6, 13.5, PL, '#1a8a9a', { glow: 0.5 });                             // the fin on the west front
        b.box(-b.hw - 1.3, 0, 2.6, b.hd * 2, 3.3, 1.3, PL, '#fff6d0', { glow: 0.6, under: true }); b.box(0, b.hd + 1.3, b.hw * 2, 2.6, 3.3, 1.3, PL, '#fff6d0', { glow: 0.6, under: true });
        b.cyl(-b.hw, b.hd, 2.6, 3.3, 1.3, PL, '#fff6d0', { arc: 90, a0: 90, glow: 0.6, seg: 16 });
        b.box(-b.hw - 1.35, 0, 2.7, b.hd * 2 + 0.1, 3.1, 0.2, null, '#c02030'); b.box(0, b.hd + 1.35, b.hw * 2 + 0.1, 2.7, 3.1, 0.2, null, '#c02030'); b.cyl(-b.hw, b.hd, 2.7, 3.1, 0.2, null, '#c02030', { arc: 90, a0: 90, seg: 16 });
        b.face('w', -b.hd + 1.5, -1.2, 5.6, 3.6, GT, '#ffe0a0', GLOW); b.face('w', 1.2, b.hd - 1.5, 5.6, 3.6, GT, '#ffe0a0', GLOW); b.face('s', -b.hw + 1.5, b.hw - 1.5, 5.6, 3.6, GT, '#ffe0a0', GLOW);
    });

    /* ═══ THE STRIP CARRIED OVER + the pack building ═══ */
    const plot = (px, py) => ({ x: lx => r3(gx(px * 12) + lx * C), z: ly => r3(gx(py * 12) + ly * C) });
    const clearProps = (x0, z0, x1, z1) => { for (let i = props.length - 1; i >= 0; i--) { const q = props[i]; if (q.x > x0 && q.x < x1 && q.z > z0 && q.z < z1) props.splice(i, 1); } for (let i = features.length - 1; i >= 0; i--) { const q = features[i]; if (q.k === 'tree' && q.x > x0 && q.x < x1 && q.z > z0 && q.z < z1) features.splice(i, 1); } };
    const ghost = (x, z, w, d, h) => features.push(w >= d ? { k: 'wall', x0: r3(x - w / 2 + d / 2), z0: r3(z), x1: r3(x + w / 2 - d / 2), z1: r3(z), h, t: r3(d), key: 'urban:ConcreteStriped2a', ghost: true, rail: false } : { k: 'wall', x0: r3(x), z0: r3(z - d / 2 + w / 2), x1: r3(x), z1: r3(z + d / 2 - w / 2), h, t: r3(w), key: 'urban:ConcreteStriped2a', ghost: true, rail: false });
    const free = (id, x, z, fn) => { const parts = []; const P = (s, px, y, pz, key, tint, o2) => { const q = Object.assign({ s, p: [r3(px), r3(y), r3(pz)] }, o2 || {}); if (key) q.key = key; if (tint != null) q.tint = T(tint, key); parts.push(q); return q; }; fn(P); rows.push({ k: 'arch', id: 'dc:E-' + id + ':arch', x: r3(x), z: r3(z), rot: 0, parts }); };
    /* the VHS shop (the pack's whole building, real size 14.9 x 13.6 m, its entrance at +Z): on the yard south-west of the Costume shops, its
       entrance to the walk on its east (a prop's face turns it clockwise like a building's rot: 270 = the front to the east) */
    { const p = plot(9, 4), x = p.x(3), z = p.z(9.2); clearProps(x - 7, z - 7.6, x + 7, z + 7.6); props.push({ key: 'city_vhs_shop', x, z, face: 270 }); }
    /* THE STRIP'S WEDDING CHAPEL (the Strip's own landmark, carried over): white, a pink roof, a little steeple, on the yard west of the Cinema */
    { const p = plot(11, 7), x = p.x(3), z = p.z(2); clearProps(x - 5.4, z - 3.6, x + 5.4, z + 3.6);   // squares 1..4 x 1..2, filled
      free('chapel', x, z, P => {
        P('box', 0, 0, 0, ST, '#fbf6ee', { size: [10.4, 4.4, 6.9], top: false }); P('roof', 0, 4.4, 0, CO, '#e88aa8', { form: 'gable', size: [10.4, 2.6, 6.9], over: 0.4, keyEnd: ST, tintEnd: T('#fbf6ee', ST), roof: true });
        P('box', 3.6, 0, 2.3, ST, '#fbf6ee', { size: [2.4, 8.2, 2.4] }); P('roof', 3.6, 8.2, 2.3, CO, '#e88aa8', { form: 'pyramid', size: [2.4, 3.4, 2.4], over: 0.25, roof: true }); P('cyl', 3.6, 11.5, 2.3, GOLD, null, { r: 0.18, r2: 0, h: 1.4, seg: 6 });
        P('quad', -1.2, 0.5, 3.51, GS, '#ffd0e0', { size: [5.6, 2.2], glow: 0.55 }); P('quad', -1.2, 3.1, 3.52, null, '#ff80b0', { size: [5.6, 0.7], glow: 1 }); P('quad', 3.6, 0, 3.56, U('DoorWoodenHalf1a'), '#ffffff', { size: [1.75, 2.45], uv: 'fit', kind: 'wall' });
      }); ghost(x, z, 10.4, 6.9, 4.4); }
    /* THE STRIP'S FOUNTAIN (carried over): a round basin, two tiers, lit water, two palms, on the yard south-west of the Recording studio */
    { const p = plot(11, 4), x = p.x(3), z = p.z(9); clearProps(x - 6.9, z - 6.9, x + 6.9, z + 6.9);   // the basin fills squares 2..3 x 8..9
      free('fountain', x, z, P => {
        P('cyl', 0, 0, 0, MB3, '#e9e4da', { r: 3.5, ri: 3.05, h: 0.7, seg: 24 }); P('cyl', 0, 0, 0, null, '#3aa0d8', { r: 3.07, h: 0.5, seg: 24, glow: 0.35 });
        P('cyl', 0, 0, 0, MB3, '#e9e4da', { r: 0.5, h: 2.2, seg: 10 }); P('cyl', 0, 1.5, 0, MB3, '#e9e4da', { r: 0.3, r2: 1.7, h: 0.4, seg: 16 }); P('cyl', 0, 1.9, 0, null, '#3aa0d8', { r: 1.6, h: 0.06, seg: 16, glow: 0.35 });
        P('cyl', 0, 2.2, 0, MB3, '#e9e4da', { r: 0.2, r2: 0.9, h: 0.3, seg: 12 }); P('cyl', 0, 2.5, 0, GOLD, null, { r: 0.22, r2: 0, h: 0.9, seg: 8 });
      }); ghost(x, z, 7, 7, 1.2);
      props.push({ key: 'palm_tree', x: p.x(1.5), z: p.z(7.5), h: 6.0 }, { key: 'palm_tree', x: p.x(4.5), z: p.z(10.5), h: 6.0 }, { key: 'park_bench', x: p.x(4.5), z: p.z(7.5), face: 180 }, { key: 'park_bench', x: p.x(1.5), z: p.z(10.5), face: 0 }); }   // each on its own square's middle (they block)
    /* the taxi rank's canopy and its round dispatch booth (plot P08-07: no plan building) */
    { const p = plot(8, 7), parts = [], cx = p.x(10), cz = p.z(1.5), bx = p.x(1.6), bz = p.z(1.5);
      const P = (s, x, y, z, key, tint, o2) => { const q = Object.assign({ s, p: [r3(x), y, r3(z)] }, o2); if (key) q.key = key; q.tint = T(tint, key); parts.push(q); };
      P('box', 0, 3.4, 0, CO, '#f0c020', { size: [9.6, 0.35, 6.4], under: true }); P('box', 0, 3.0, 0, null, '#111111', { size: [9.7, 0.4, 6.5], top: false });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) P('cyl', sx * 4.4, 0, sz * 2.8, TR, '#333333', { r: 0.12, h: 3.4, seg: 6 });
      rows.push({ k: 'arch', id: 'dc:E-taxi-canopy:arch', x: cx, z: cz, rot: 0, parts });
      const q2 = [], Q = (s, y, key, tint, o2) => { const q = Object.assign({ s, p: [0, y, 0] }, o2); if (key) q.key = key; q.tint = T(tint, key); q2.push(q); };
      Q('cyl', 0, PL, '#f0c020', { r: 2.2, h: 3.2, seg: 12 }); Q('cyl', 1.1, GS, '#cfe8ff', { r: 2.25, h: 1.3, seg: 12, glow: 0.5, cap: false }); Q('cyl', 3.2, CO, '#222222', { r: 2.8, r2: 0, h: 1.6, seg: 12, roof: true });
      rows.push({ k: 'arch', id: 'dc:E-taxi-booth:arch', x: bx, z: bz, rot: 0, parts: q2 });
      features.push({ k: 'wall', x0: bx, z0: bz, x1: bx, z1: bz, h: 3.2, t: 3.6, key: 'urban:ConcreteStriped2a', ghost: true, rail: false }); }
    features.push(...rows);
    return { arch: rows.length };
} };
