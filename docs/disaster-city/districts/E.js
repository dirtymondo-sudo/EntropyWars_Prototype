/* districts/E.js (2026-11-13) — DISASTER CITY, THE ENTERTAINMENT DISTRICT'S BUILDINGS (plots P08-04 .. P11-07).
   mondo 11-13: "architect the buildings ... every building should be unique and purposeful and recognizable ... domes, roof tops, modern
   architecture, curves"; his OK on the plan + mock-up 17:08 ("looks good, and remember this is basically replacing the strip").
   Loaded by bake-disaster-city.js (THE DISTRICT FILES, the build stage): repo-only tooling, never loaded by the game. For every building of the district
   it keeps the tool's own collision row (texbuilding / roof-route plateau) with its faces off (`skin: false`) and writes ONE `k: 'arch'`
   row of parts over the same footprint (docs/notes/areas-complexes.md "THE ARCHITECTURE ROW"). All numbers are metres from the building's
   footprint centre, x east, z south; `hw` / `hd` are the footprint's half sides. Notes: areas-complexes.md "THE ENTERTAINMENT DISTRICT". */
module.exports = { build: function (api) {
    const { C, gx, r3, features, lateRows, props, bInfo, plotOf, lvOf, LEVELS } = api;
    const EXTRA = {};   // a building of this file's own that the plan does not hold (the wedding chapel): id -> its footprint, like a bInfo row
    const D2R = Math.PI / 180, U = n => 'urban:' + n;
    /* the sheets (sprites.js URBAN_TEXTURES + the terrain keys): light ones take a tint cleanly */
    const GOLD = 'gold', BR1 = 'bricks_1', BR2 = 'bricks_2', BR3 = 'bricks_3', WOOD = 'wood_planks', PL = U('PlasterWallPainted1a'), ST = U('PlasterWallStucco1a'), MB = U('TileMarble1d'), MB3 = U('TileMarble3c'),
        SUB = U('TileSubway1a'), TG = U('TileGeneric1a'), CO = U('MetalCorrugatedPainted1a'), CO3 = U('MetalCorrugatedPainted3b'), CS = U('ConcreteStriped1c'), TR = U('MetalTruss1a'),
        RF = U('RubberNonSlip1a'), RFC = U('ConcreteUnderTiles1'), GRL = U('MetalSubwayGrill1a'), CHK = U('TileGeneric5b'), RTL = U('TileSubway3a'), DADO = U('PlasterWallPainted2c'), SHUT = U('GlassWindowResidentialShutter1'), HAZ = U('SignHazard2a'),
        DOORS = [U('DoorPaintedHalf1a'), U('DoorPaintedHalf3b'), U('DoorWoodenHalf1a'), U('DoorStorefrontHalf1a')],
        GT = U('GlassWindowTall1a-Glow'), GF = U('GlassWindowFactory2a-Glow'), GS = U('GlassWindowSquare3a-Glow'), GR = U('GlassWindowResidential1-Glow1');
    /* a tint over a sheet: the sheets are mid grey, so the colour is lifted (clamped) to read as itself; a plain colour is written as is */
    const hex = s => parseInt(String(s).replace('#', ''), 16);
    const T = (s, key) => { const v = hex(s); if (!key) return v; const f = c => Math.min(255, Math.round(c * 1.7)); return (f(v >> 16 & 255) << 16) | (f(v >> 8 & 255) << 8) | f(v & 255); };
    const rows = [];
    const dropLate = id => { for (let i = lateRows.length - 1; i >= 0; i--) if (String(lateRows[i].id || '').indexOf('dc:' + id + '-s') === 0) lateRows.splice(i, 1); };
    /* B(id, o, fn): one building. o.walk = a walk-in shell (hollow, the city door in the plan's doorway), o.st = its storeys (the collision's
       and the roof slab's height), o.open = no collision row at all (an open pavilion). fn(b) writes the parts. */
    function B(id, o, fn) {
        const info = EXTRA[id] || bInfo.find(q => q.id === id); if (!info) { console.error('entertainment: no building', id); return; }
        let row = features.find(f => f.id === 'dc:' + id); if (!row) { console.error('entertainment: no row', id); return; }
        const hw = info.cw * C / 2, hd = info.ch * C / 2, cx = r3(gx(info.cx0) + hw), cz = r3(gx(info.cy0) + hd);
        dropLate(id);
        let rot = 0, lx = 0, hollow = false;
        if (row.k === 'plateau' && o.walk) {   /* a walk-in roof tier: a hollow texbuilding in the plateau's place, two storeys = the same 7 m walked roof slab (as the Industrial district does); its doorway = the plan's first door */
            const pb = plotOf[info.plot].buildings.find(v => v.id === id), dr = pb.doors[0], sd = info.side, kk = sd === 'S' ? (dr.x - pb.x) : sd === 'N' ? (pb.x + pb.w - 1 - dr.x) : sd === 'E' ? (pb.y + pb.h - 1 - dr.y) : (dr.y - pb.y);
            const nr = { k: 'texbuilding', id: row.id, seed: (row.bld && row.bld.seed) || 0, door: Math.round(kk * C / 1.75) + 1 }; features[features.indexOf(row)] = nr; row = nr; o = Object.assign({}, o, { st: 2 });
        }
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
            /* ── THE DETAIL LAYER (mondo 11-13 20:15: "go one or two more layers deep with the detail") ── */
            hollow, fs: info.side.toLowerCase(), du: 0,
            /* a box standing ON a face: u along it, `dep` out from the wall (`off` = a gap first) */
            sbox: (side, u, y, w, h, dep, key, tint, o2) => { o2 = Object.assign({}, o2); const off = o2.off || 0; delete o2.off; const ns = side === 'n' || side === 's', sg = (side === 's' || side === 'e') ? 1 : -1, c = (ns ? hd : hw) + off + dep / 2;
                return ns ? P('box', u, y, sg * c, key, tint, Object.assign({ size: [r3(w), r3(h), r3(dep)] }, o2)) : P('box', sg * c, y, u, key, tint, Object.assign({ size: [r3(dep), r3(h), r3(w)] }, o2)); },
            /* a base course round the foot of the walls, broken at the doorway of a walk-in building */
            plinth: (h, key, tint, out) => { out = out || 0.1; for (const side of ['n', 's', 'e', 'w']) { const half = (side === 'n' || side === 's') ? hw + out : hd + out;
                if (hollow && side === b.fs) { const d0 = b.du; if (d0 - 1.05 > -half) b.sbox(side, (-half + d0 - 1.05) / 2, 0, d0 - 1.05 + half, h, out, key, tint); if (half > d0 + 1.05) b.sbox(side, (d0 + 1.05 + half) / 2, 0, half - d0 - 1.05, h, out, key, tint); }
                else b.sbox(side, 0, 0, half * 2, h, out, key, tint); } return b; },
            /* piers on a face at the given places (a shaft, a wider cap) */
            piers: (side, us, y, h, w, key, tint, capKey, capTint) => { for (const u of us) { b.sbox(side, u, y, w, h, 0.2, key, tint); b.sbox(side, u, y + h - 0.3, w + 0.2, 0.3, 0.3, capKey === undefined ? key : capKey, capTint === undefined ? tint : capTint); } return b; },
            /* a moulded cornice: a deep top course over a shallower bed course */
            cornice: (y, key, tint, out) => { out = out || 0.34; b.trim(y, 0.24, key, tint, out); b.trim(y - 0.22, 0.22, key, tint, out * 0.5, { top: false }); return b; },
            /* window joinery over a glass band: a head, a sill that sticks out, n bays of mullions */
            frames: (side, u0, u1, y, h, n, tint, pr) => { pr = pr || 0.09; const L = u1 - u0, m = (u0 + u1) / 2; b.sbox(side, m, y + h, L + 0.3, 0.16, pr + 0.1, null, tint); b.sbox(side, m, y - 0.14, L + 0.4, 0.14, pr + 0.2, null, tint);
                for (let i = 0; i <= n; i++) b.sbox(side, u0 + L * i / n, y, 0.12, h, pr + 0.07, null, tint); return b; },
            /* a downpipe with its hopper head */
            pipe: (side, u, h, tint) => { const ns = side === 'n' || side === 's', sg = (side === 's' || side === 'e') ? 1 : -1, c = (ns ? hd : hw) + 0.14; P('cyl', ns ? u : sg * c, 0, ns ? sg * c : u, null, tint || '#3a3d42', { r: 0.07, h: r3(h - 0.3), seg: 6, cap: false }); b.sbox(side, u, h - 0.42, 0.34, 0.3, 0.26, null, tint || '#3a3d42'); return b; },
            /* an awning: a sloped cloth strip, striped when a second colour is given */
            awning: (side, u0, u1, y, dep, tint, tint2) => { const L = u1 - u0, n = tint2 ? Math.max(2, Math.round(L / 1.1)) : 1, ns = side === 'n' || side === 's', sg = (side === 's' || side === 'e') ? 1 : -1, c = sg * ((ns ? hd : hw) + dep / 2);
                for (let i = 0; i < n; i++) { const u = u0 + L * (i + 0.5) / n, w = L / n; b.roof('shed', ns ? u : c, ns ? c : u, ns ? w : dep, ns ? dep : w, y, dep * 0.42, PL, (i % 2 && tint2) ? tint2 : tint, { high: { s: 'n', n: 's', e: 'w', w: 'e' }[side], roof: false, ds: true }); }
                b.sbox(side, (u0 + u1) / 2, y - 0.22, L, 0.22, 0.04, PL, tint, { off: dep - 0.04 }); return b; },
            /* a wall lamp: a bracket and a lit glass */
            lamp: (side, u, y, tint) => { b.sbox(side, u, y + 0.34, 0.08, 0.08, 0.34, null, '#2a2a2e'); b.sbox(side, u, y, 0.26, 0.36, 0.26, null, tint || '#ffe2a0', { off: 0.1, glow: 1 }); return b; },
            /* a sign that hangs out square from the wall on an arm */
            blade: (side, u, y, w, h, tint, glow) => { b.sbox(side, u, y + h, 0.07, 0.07, w + 0.25, null, '#2a2a2e'); b.sbox(side, u, y, 0.14, h, w, null, tint, { off: 0.2, glow: glow == null ? 0.7 : glow }); return b; },
            /* a framed sign board flat on the wall */
            board: (side, u0, u1, y, h, tint, frame, glow) => { const m = (u0 + u1) / 2, L = u1 - u0; b.sbox(side, m, y - 0.1, L + 0.2, h + 0.2, 0.12, null, frame || '#26262a'); b.sbox(side, m, y, L, h, 0.08, null, tint, { off: 0.1, glow: glow == null ? 0.7 : glow }); return b; },
            /* a run of show bulbs */
            bulbs: (side, u0, u1, y, n, tint, off) => { for (let i = 0; i < n; i++) b.sbox(side, u0 + (u1 - u0) * (n === 1 ? 0.5 : i / (n - 1)), y, 0.2, 0.2, 0.2, null, tint || '#fff2c0', { off: off || 0.02, glow: 1 }); return b; },
            /* a louvred vent grille on the wall */
            grille: (side, u, y, w, h) => { b.sbox(side, u, y - 0.05, (w || 0.9) + 0.1, (h || 0.55) + 0.1, 0.05, null, '#3c4046'); b.sbox(side, u, y, w || 0.9, h || 0.55, 0.04, GRL, '#9aa0a8', { off: 0.05, uv: 0.6 }); return b; },
            /* roof plant: an air handler with its fan, a vent cowl */
            ac: (x, z, y, wide) => { b.box(x, z, wide ? 2.2 : 1.4, 0.9, y, 0.95, CO, '#b9bcc0'); b.box(x, z, wide ? 2.36 : 1.56, 1.06, y, 0.12, null, '#55585e'); b.cyl(x, z, 0.33, y + 0.95, 0.07, null, '#2c2e33', { seg: 10 }); return b; },
            cowl: (x, z, y) => { b.cyl(x, z, 0.2, y, 0.75, CO, '#9a9da2', { seg: 8 }); b.cyl(x, z, 0.36, y + 0.75, 0.16, null, '#55585e', { r2: 0.12, seg: 8 }); return b; },
            /* corner stones up the four corners */
            corners: (y, h, key, tint, w) => { w = w || 0.5; for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * (hw + 0.1 - w / 2 + 0.06), sz * (hd + 0.1 - w / 2 + 0.06), w, w, y, h, key, tint, { top: false }); return b; },
            /* ── roofs, AC units, more sheets (mondo 20:18 "roofs and ac units", 20:19 "different textures or decals for different parts") ── */
            /* a parapet on top of the walls on the given sides, with a coping */
            parapet: (sides, y, h, key, tint, cop) => { for (const side of sides) { const L = ((side === 'n' || side === 's') ? hw : hd) * 2 + 0.1; b.sbox(side, 0, y, L, h, 0.28, key, tint, { off: -0.23 }); b.sbox(side, 0, y + h, L + 0.1, 0.1, 0.4, CS, cop || '#c8c4bc', { off: -0.29 }); } return b; },
            /* a wall AC unit on its bracket, its grille to the street */
            wac: (side, u, y) => { b.sbox(side, u, y - 0.08, 0.8, 0.06, 0.5, null, '#3a3d42'); b.sbox(side, u, y, 0.9, 0.6, 0.45, CO, '#c4c7cb', { off: 0.03 }); b.sbox(side, u, y + 0.08, 0.7, 0.44, 0.03, GRL, '#8a9098', { off: 0.48, uv: 0.5 }); return b; },
            /* a service door: a pack door sheet in a frame, a step */
            sdoor: (side, u, i, tint) => { b.sbox(side, u, 0, 1.25, 2.25, 0.07, null, '#2e2e32'); b.sbox(side, u, 0.08, 1.05, 2.1, 0.03, DOORS[i || 0], tint || '#ffffff', { off: 0.07, uv: 'fit', kind: 'wall' }); b.sbox(side, u, 0, 1.5, 0.08, 0.5, CS, '#9a9a9a'); return b; },
            /* a hazard plate */
            haz: (side, u, y) => { b.sbox(side, u, y, 0.45, 0.45, 0.03, HAZ, '#ffffff', { off: 0.02, uv: 'fit', kind: 'wall' }); return b; },
            /* a big roof unit: the cabinet on a kerb, two fans, a duct run to a riser, a hazard plate */
            plant: (x, z, y, len) => { len = len || 3; b.box(x, z, 2.6, 1.5, y, 0.15, CS, '#8a8a8a'); b.box(x, z, 2.4, 1.3, y + 0.15, 1.2, CO, '#aeb2b8'); for (const s of [-1, 1]) b.cyl(x + s * 0.6, z, 0.42, y + 1.35, 0.08, null, '#2c2e33', { seg: 10 });
                b.box(x + 1.2 + len / 2, z, len, 0.5, y + 0.3, 0.4, CO, '#9a9ea4'); b.box(x + 1.2 + len, z, 0.6, 0.6, y, 0.9, CO, '#9a9ea4'); P('quad', x, y + 0.5, z + 0.66, HAZ, 0xffffff, { size: [0.4, 0.4], uv: 'fit', kind: 'wall' }); return b; },
            /* a skylight: a kerb, a lit glass lid */
            sky: (x, z, y, w, d) => { b.box(x, z, w, d, y, 0.3, CS, '#8a8a8a'); b.box(x, z, w - 0.2, d - 0.2, y + 0.3, 0.1, GF, '#d8f0ff', { glow: 0.5 }); return b; },
            /* a roof hatch with its ladder hoops */
            hatch: (x, z, y) => { b.box(x, z, 1.0, 1.0, y, 0.35, CO3, '#5a5e66'); b.box(x + 0.7, z, 0.06, 0.6, y, 1.0, TR, '#888888'); return b; },
            /* a gutter under an eave */
            gutter: (side, y, over, tint) => { const L = ((side === 'n' || side === 's') ? hw : hd) * 2 + (over || 0) * 2; b.sbox(side, 0, y - 0.16, L, 0.16, 0.2, null, tint || '#4a4e55', { off: (over || 0) - 0.02 }); return b; },
            /* ── THE LETTERING (the shared 'txt:WORDS|fg|bg|aspect' sign sheet, PR #1327): words over the lit panels; no bg = the letters alone ── */
            txt: (side, u0, u1, y, h, words, fg, pr, glow, bg) => { const L = Math.abs(u1 - u0), o3 = { proud: pr || 0.12, uv: 'fit' }; if (!bg) o3.kind = 'over'; if (glow) o3.glow = glow;
                return b.face(side, u0, u1, y, h, 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + (Math.round(L / h * 100) / 100), '#ffffff', o3); },
            /* a word read down a blade sign, a letter a panel */
            vtxt: (side, u, y1, step, w, word, fg, pr, glow) => { [...word].forEach((ch, i) => b.txt(side, u - w / 2, u + w / 2, y1 - (i + 1) * step + step * 0.08, step * 0.84, ch, fg, pr, glow)); return b; },
        };
        { const dr = b.door; b.du = (b.fs === 'n' || b.fs === 's') ? dr[0] : dr[1]; }
        fn(b); if (DETAIL[id]) DETAIL[id](b); if (ROOFS[id]) ROOFS[id](b); if (LETTERS[id]) LETTERS[id](b); if (INSIDE[id] && hollow) inside(b, INSIDE[id], { loc, cx, cz, fw, fd, row, lx, gy: lvOf(plotOf[info.plot]) * LEVELS.M });
        { const ar = { k: 'arch', id: 'dc:' + id + ':arch', x: cx, z: cz, rot: 0, parts }; if (row.k === 'plateau') ar.y = 0;   /* over a roof-walk plateau the row would stand on its 7 m roof */ rows.push(ar); }
        return b;
    }
    const GLOW = { glow: 0.55 }, NEON = { glow: 1 };
    /* ═══ THE DETAIL LAYER, per building (the polish pass, mondo 11-13 20:15): base courses, piers, cornices, window joinery, awnings, lamps,
       hanging signs, show bulbs, downpipes, roof plant. Each runs after its building's massing; `F` is the front, `K` the back, `L` / `R` the flanks. ═══ */
    const OPP = { n: 's', s: 'n', e: 'w', w: 'e' }, FLK = { n: ['w', 'e'], s: ['w', 'e'], e: ['n', 's'], w: ['n', 's'] };
    const half = (b, side) => (side === 'n' || side === 's') ? b.hw : b.hd;
    const spread = (a, z, n) => Array.from({ length: n }, (_, i) => a + (z - a) * (n === 1 ? 0.5 : i / (n - 1)));
    const IRON = '#2a2a2e', CREAM = '#f0e6cc', ZINC = '#6a6f76';
    const DETAIL = {
        'P08-04-B1': b => { const F = b.fs, K = OPP[F], h = half(b, F), d = b.du;                              // CASINO
            b.plinth(0.8, MB, '#241a30', 0.14); b.trim(4.5, 0.22, GOLD, null, 0.12, { top: false });
            b.piers(F, [-h + 5.6, d - 1.5, d + 1.5, h - 0.6], 0.8, 8.8, 0.7, MB, '#2c2040', GOLD, null); b.piers(F, spread(-h + 8.5, h - 3, 4).filter(u => Math.abs(u - d) > 2.4), 4.7, 4.9, 0.45, MB, '#2c2040', GOLD, null);
            b.frames(F, -h + 6, d - 1.4, 0.6, 2.6, 4, '#c9a24a'); b.frames(F, d + 1.4, h - 1, 0.6, 2.6, 4, '#c9a24a'); b.frames(F, -h + 6, h - 1, 5.2, 2.6, 10, '#c9a24a');
            for (const s of FLK[F]) { b.piers(s, spread(-half(b, s) + 1.2, half(b, s) - 1.2, 4), 0.8, 8.8, 0.7, MB, '#2c2040', GOLD, null); b.board(s, -2.6, 2.6, 5.4, 2.2, '#ffd9a0', '#3a2a55', 0.6); b.pipe(s, half(b, s) - 0.5, 9.6, '#8a6a30'); }
            b.piers(K, spread(-h + 1.5, h - 1.5, 6), 0.8, 8.8, 0.7, MB, '#2c2040'); b.grille(K, -3, 1.4, 1.4, 0.8); b.grille(K, 3, 1.4, 1.4, 0.8);
            b.bulbs(F, d - 3.5, d + 3.5, 3.7, 9, '#fff2c0', 4.5); b.lamp(F, d - 2.1, 2.5); b.lamp(F, d + 2.1, 2.5);
            b.ac(-1, -2, 13.8, true); b.ac(-1, 3, 13.8, true); b.cowl(1.5, 0.5, 13.8); b.trim(13.8, 0.14, CS, '#7a7480', -0.5, { top: false }); },
        'P08-04-B2': b => { const F = b.fs, h = half(b, F);                                                    // PAWN
            b.plinth(0.5, BR3, '#5a3a2a'); b.frames(F, -h + 1, h - 1, 0.7, 1.6, 4, '#2f5d50'); b.sbox(F, 0, 0.7, h * 2 - 2, 1.6, 0.05, GS, '#fff0c0', { glow: 0.45 });
            b.sbox(F, 0, 0.7, h * 2 - 1.8, 1.6, 0.03, TR, '#444444', { off: 0.16 });                           /* the security mesh over the window */
            b.blade(F, h - 0.6, 2.8, 0.9, 0.9, '#f0c020'); b.lamp(F, -h + 0.5, 2.3); b.pipe(OPP[F], h - 0.4, 4.2); b.grille(FLK[F][0], 0, 2.6); },
        'P09-04-B1': b => {                                                                                    // COSTUME SHOPS
            b.plinth(0.45, BR3, '#5a3028'); b.frames('s', -b.hw + 1.5, b.hw - 1.5, 0.5, 2.0, 6, '#5b3a22'); b.frames('s', -b.hw + 1, b.hw - 1, 4.2, 2.2, 8, '#5b3a22', 0.45); b.frames('w', -b.hd + 1, b.hd - 1, 4.2, 2.2, 5, '#5b3a22', 0.45);
            for (const u of spread(-b.hw + 0.4, b.hw - 0.4, 7)) { b.sbox('s', u, 3.5, 0.18, 3.5, 0.06, WOOD, '#5b3a22', { off: 0.4 }); b.sbox('s', u, 3.0, 0.22, 0.5, 0.5, WOOD, '#5b3a22'); }
            for (const u of spread(-b.hd + 0.4, b.hd - 0.4, 5)) { b.sbox('w', u, 3.5, 0.18, 3.5, 0.06, WOOD, '#5b3a22', { off: 0.4 }); b.sbox('e', u, 3.5, 0.18, 3.5, 0.06, WOOD, '#5b3a22', { off: 0.4 }); }
            for (const [i, u] of spread(-b.hw + 3, b.hw - 3, 4).entries()) b.blade('s', u, 2.75, 0.8, 0.7, ['#d0306a', '#f0b020', '#2a9a8a', '#7a4fb0'][i], 0.5);
            b.lamp('w', -b.hd + 1.2, 2.4); b.lamp('w', b.hd - 1.2, 2.4); b.pipe('n', -b.hw + 0.6, 7); b.pipe('n', b.hw - 0.6, 7); b.grille('n', 0, 1.6, 1.2, 0.7); },
        'P09-04-B2': b => { const F = b.fs, h = half(b, F);                                                    // MASKS + WIGS
            b.plinth(0.5, ST, '#4a2f70'); b.corners(0.5, 4.7, ST, '#f0e0ff', 0.55); b.frames(F, -h + 1, h - 1, 0.6, 2.2, 5, '#f0e0ff'); b.cornice(5.2, ST, '#f0e0ff', 0.3);
            b.awning(F, -h + 0.8, h - 0.8, 2.95, 1.2, '#7a4fb0', '#f4ead6'); b.blade(F, -h + 0.5, 3.6, 1.0, 1.0, '#e0a0ff'); b.lamp(F, h - 0.5, 2.4, '#e8c8ff'); b.pipe(OPP[F], 0, 5.2); },
        'P09-04-B3': b => { const F = b.fs, h = half(b, F);                                                    // TAILOR
            b.plinth(0.9, CS, '#8a8f98'); b.trim(4.3, 0.14, CO3, '#1e5a5a', 0.1, { top: false });
            b.sbox(F, 0, 0.9, h * 2 - 2, 1.7, 0.05, GF, '#d8f0ff', { glow: 0.4 }); b.frames(F, -h + 1, h - 1, 0.9, 1.7, 6, '#1e5a5a', 0.05);
            b.board(F, -h + 1, h - 1, 2.9, 0.7, '#f4ead6', '#1e5a5a', 0.4); b.pipe(F, -h + 0.3, 4.4, '#1e5a5a'); b.pipe(F, h - 0.3, 4.4, '#1e5a5a'); b.grille(OPP[F], 0, 2.8); b.lamp(F, 0, 3.75); },
        'P10-04-B1': b => {                                                                                    // CONCERT HALL
            b.plinth(0.9, MB3, '#bdb6a8', 0.16); b.cornice(7, MB3, '#f4efe4', 0.4);
            for (const s of ['e', 'w']) { const us = spread(-b.hd + 1.5, b.hd - 1.5, 7); b.piers(s, us, 0.9, 5.8, 0.8, MB3, '#f4efe4');
                for (let i = 0; i < us.length - 1; i++) { const m = (us[i] + us[i + 1]) / 2; b.sbox(s, m, 2.2, 1.8, 3.2, 0.06, U('GlassWindowTall1a'), '#8090a8'); b.sbox(s, m, 5.4, 2.2, 0.2, 0.16, MB3, '#f4efe4'); } }
            b.piers('s', spread(-b.hw + 1.5, b.hw - 1.5, 6), 0.9, 5.8, 0.8, MB3, '#f4efe4'); b.sbox('s', 0, 0, 5, 4.2, 0.08, CO3, '#5a5560'); b.lamp('s', -3.2, 3); b.lamp('s', 3.2, 3);
            for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; b.box(Math.cos(a) * 8.75, 1.5 + Math.sin(a) * 8.75, 0.55, 0.55, 7, 5.6, ST, '#f8f2e4', { ry: -a / D2R, top: false }); }   /* the drum's piers */
            b.cyl(0, 1.5, 8.7, 9.2, 2.2, U('GlassWindowTall1a'), '#8090a8', { seg: 28, cap: false }); b.cyl(0, 1.5, 8.9, 7, 0.5, MB3, '#f4efe4', { seg: 28 });
            b.bulbs('n', -12.3, 12.3, 4.2, 22, '#fff2c0', 2.65); for (const s of [-1, 1]) b.bulbs('n', s * 1.25, s * 1.25, 6, 1, '#fff2c0', 1.5);
            for (let i = 0; i < 9; i++) b.sbox('n', 1.25, 6.4 + i * 0.85, 0.18, 0.18, 0.18, null, '#fff2c0', { off: 1.4, glow: 1 }), b.sbox('n', -1.25, 6.4 + i * 0.85, 0.18, 0.18, 0.18, null, '#fff2c0', { off: 1.4, glow: 1 });
            b.box(0, b.hd - 2.2, 9.3, 3.5, 15.9, 0.3, CS, '#3e3a44'); b.grille('s', 0, 12, 2.4, 1.4); b.ac(6, b.hd - 2.4, 16.2); b.cowl(-3, b.hd - 2.2, 16.2); },
        'P11-04-B1': b => { const F = b.fs, h = half(b, F), d = b.du;                                          // RECORDING STUDIO
            b.plinth(0.6, CS, '#1c1f26'); for (const u of spread(-h + 1, h - 1, 9)) if (Math.abs(u - d) > 1.4) b.sbox(F, u, 3.4, 0.14, 1.8, 0.14, WOOD, '#5e3c20');
            b.canopy(3.4, 1.5, 2.5, 0.18, CO3, '#1c1f26'); b.lamp(F, d - 1.5, 2.0, '#ff5050'); b.sbox(F, d + 1.5, 2.25, 0.7, 0.3, 0.1, null, '#ff3030', { glow: 1 });   /* the ON AIR light */
            for (const y of [1.3, 2.6, 3.9]) b.cyl(-b.hw, b.hd - 3.5, 3.66, y, 0.12, null, '#1c1f26', { seg: 24 });
            b.pipe(OPP[F], -h + 0.5, 5.2); b.grille(OPP[F], 2, 1.5, 1.6, 0.9); b.grille(OPP[F], -3, 3.6); for (const y of [7.5, 9.5, 11.5]) b.cyl(b.hw - 4, -1, 0.5, y, 0.06, null, '#d03030', { seg: 8 }); },
        'P11-04-B2': b => {                                                                                    // LOFTS
            b.plinth(0.5, BR3, '#4e2e26'); b.frames('w', -b.hd + 1.5, b.hd - 1.5, 4.2, 2, 6, IRON); b.frames('w', -b.hd + 4, b.hd - 1.5, 0.8, 2.2, 5, IRON);
            b.sbox('w', 0, 3.5, b.hd * 2 - 2.4, 0.12, 1.2, TR, '#333333', { under: true }); b.sbox('w', 0, 3.6, b.hd * 2 - 2.4, 1.0, 0.05, TR, '#333333', { off: 1.15 });   /* the fire escape balcony */
            b.sbox('w', -b.hd + 2, 0, 0.8, 3.5, 0.06, TR, '#333333', { off: 0.9 }); b.trim(3.3, 0.2, BR3, '#5a3028', 0.06, { top: false });
            b.pipe('w', -b.hd + 0.4, 7); b.pipe('e', 0, 7); b.grille('e', -3, 1.6); for (const y of [7.6, 9.0, 10.2]) b.cyl(b.hw - 3, b.hd - 4, 1.34, y, 0.1, null, IRON); },
        'P08-05-B1': b => { const L = b.hd * 2, z0 = -b.hd, s1 = L * 0.31, s2 = L * 0.30, s3 = L - s1 - s2, zm = z0 + s1 + s2 / 2, zs = z0 + s1 + s2 + s3 / 2;   // RESTAURANT COURT
            b.sbox('w', z0 + s1 / 2, 0, s1, 0.5, 0.1, BR1, '#a05a40', { off: 0.1 }); b.frames('w', z0 + 1.2, z0 + s1 - 1.2, 0.7, 1.9, 4, '#3a5a30', 0.2);
            for (const u of [z0 + 1.2, z0 + s1 - 1.2]) { b.sbox('w', u - 0.35, 0.7, 0.4, 1.9, 0.06, WOOD, '#2a6a3a', { off: 0.2 }); b.sbox('w', u + 0.35, 0.7, 0.4, 1.9, 0.06, WOOD, '#2a6a3a', { off: 0.2 }); }   /* shutters */
            b.blade('w', z0 + 0.6, 3.4, 0.9, 0.8, '#f4e8c8', 0.5); b.cyl(b.hw - 1.5, z0 + 2, 0.6, 9, 0.25, BR1, '#7a4030', { seg: 8 });
            for (const sg of [-1, 1]) { b.cyl(-b.hw - 1.5, zm + sg * (s2 / 2 - 0.5), 0.16, 0, 3.6, PL, '#b02020', { seg: 8 }); b.sbox('w', zm + sg * 2.6, 1.5, 0.3, 0.7, 0.3, PL, '#d83030', { off: 0.9, glow: 0.9 }); }   /* red posts, paper lanterns */
            b.sbox('w', zm, 0.6, s2 - 1.4, 1.6, 0.06, WOOD, '#3a2618', { off: 0.1 }); for (const u of spread(zm - s2 / 2 + 0.9, zm + s2 / 2 - 0.9, 7)) b.sbox('w', u, 0.6, 0.08, 1.6, 0.05, WOOD, '#8a5a34', { off: 0.16 });   /* the slatted front */
            b.sbox('w', zs, 0, s3, 0.5, 0.1, BR3, '#5a3028', { off: 0.1 }); b.frames('w', zs - s3 / 2 + 1.2, zs + s3 / 2 - 1.2, 0.7, 2.2, 4, IRON, 0.2); b.frames('w', zs - s3 / 2 + 1.2, zs + s3 / 2 - 1.2, 4.2, 2, 5, IRON, 0.2);
            b.awning('w', zs - s3 / 2 + 0.8, zs + s3 / 2 - 0.8, 3.0, 1.3, '#2a2a30', '#ff9030');
            for (const sg of [-1, 1]) b.box(-0.6, zs + sg * (s3 / 2 - 1.2), b.hw * 2 - 3, 0.06, 8, 0.9, TR, '#333333'); b.box(-b.hw + 0.9, zs, 0.06, s3 - 2.4, 8, 0.9, TR, '#333333');   /* the terrace rail */
            for (const u of spread(zs - s3 / 2 + 2, zs + s3 / 2 - 2, 4)) b.box(-0.6, u, b.hw * 2 - 3, 0.12, 9.5, 0.12, WOOD, '#5b3a22');
            b.cyl(b.hw - 1.4, zs + s3 / 2 - 1.6, 0.66, 11.8, 0.3, null, '#2c2e33', { seg: 10 }); b.pipe('e', z0 + 1, 5); b.pipe('e', zs, 7); b.grille('e', zm, 1.5, 1.4, 0.8); b.ac(b.hw - 2, zm, 6.9); },
        'P08-05-B2': b => { const F = b.fs, h = half(b, F);                                                    // BURGER DRIVE-IN
            b.plinth(0.9, TG, '#d02828'); b.frames(F, -h + 1.5, h - 1.5, 0.9, 1.9, 5, '#c8ccd2'); b.bulbs(F, -h, h, 3.45, 9, '#fff2c0', F === 'e' ? 2.3 : 0.7);
            b.sbox(OPP[F], 0, 1.1, 1.6, 1.1, 0.1, GS, '#fff0c0', { glow: 0.5 }); b.sbox(OPP[F], 0, 0.95, 2.0, 0.12, 0.45, CO, '#c8ccd2'); b.awning(OPP[F], -1.4, 1.4, 2.4, 0.9, '#d02828', '#f4f0e8');   /* the drive-up hatch */
            b.board(FLK[F][0], -2.4, 2.4, 1.3, 1.4, '#fff6d0', '#d02828', 0.6); b.ac(0, 0, 3.9, true); b.cowl(1.6, 1.2, 3.9); b.cowl(-1.8, -1, 3.9); },
        'P09-05-B1': b => { const d = b.du;                                                                    // COMEDY THEATER
            b.plinth(0.9, ST, '#cdbd9c', 0.14); b.piers('n', [-b.hw + 0.5, -b.hw * 0.52, b.hw * 0.52, b.hw - 0.5], 0.9, 9.6, 0.9, ST, '#f0e0c0');
            b.frames('n', -b.hw + 1, b.hw - 1, 5.2, 3.4, 9, '#5a2030'); for (const u of spread(-b.hw + 2.6, b.hw - 2.6, 5)) b.sbox('n', u, 8.75, 2.4, 0.5, 0.2, ST, '#f0e0c0');
            b.trim(4.6, 0.3, ST, '#f0e0c0', 0.1, { top: false }); for (const y of [11.7, 12.9, 14.3]) b.sbox('n', 0, y - 0.02, y < 12 ? b.hw * 2 + 0.3 : y < 13 ? b.hw * 1.24 + 0.2 : b.hw * 0.52 + 0.2, 0.14, 0.8, CS, '#8a7a68', { off: -0.7 });
            b.bulbs('n', d - 8.2, d + 8.2, 3.95, 17, '#fff2c0', 3.3); b.bulbs('n', d - 8.2, d + 8.2, 4.6, 17, '#ffd060', 3.3);
            for (let i = 0; i < 11; i++) b.box(b.hw + 0.5, -b.hd - 1.98, 0.2, 0.2, 4.6 + i * 1.15, 0.2, null, '#fff2c0', { glow: 1 });
            b.board('n', -b.hw + 1.2, d - 2.6, 0.9, 2.2, '#fff6d0', '#5a2030', 0.5); b.board('n', d + 2.6, b.hw - 1.2, 0.9, 2.2, '#fff6d0', '#5a2030', 0.5);   /* the poster cases */
            for (const s of ['e', 'w']) { b.piers(s, spread(-b.hd + 1, b.hd - 1, 6), 0.9, 9.6, 0.7, BR1, '#8f5238', ST, '#f0e0c0'); b.pipe(s, b.hd - 0.5, 10.7); }
            b.sbox('s', 0, 0, 3.4, 3.4, 0.08, CO3, '#5a2030'); b.lamp('s', 2.4, 2.8); b.grille('s', -5, 6, 1.8, 1.0); b.ac(-b.hw + 2, b.hd - 1.2, 10.62); b.ac(b.hw - 2, b.hd - 1.2, 10.62); },
        'P10-05-B1': b => {                                                                                    // BACKSTAGE DOCK
            b.plinth(1.0, CS, '#8a8a8a'); for (const s of [-1, 1]) { b.frames('s', s * 3.8 - 2.4, s * 3.8 + 2.4, 0, 3.6, 1, '#3c4048'); for (const y of [0.6, 1.2, 1.8, 2.4, 3.0]) b.sbox('s', s * 3.8, y, 4.7, 0.05, 0.03, null, '#8a6c10', { off: 0.1 }); }
            for (const u of [-7.4, -3.8, 0, 3.8, 7.4].filter(u => Math.abs(u) < b.hw - 0.5)) b.sbox('s', u, 0.25, 0.5, 0.5, 0.14, null, '#1a1a1c', { off: 1.8 });   /* the dock bumpers */
            b.sbox('s', 0, 1.0, b.hw * 2, 0.12, 0.2, null, '#e8c020', { off: 1.7 }); for (const u of [-b.hw + 0.6, b.hw - 0.6]) b.cyl(u, b.hd + 2.8, 0.1, 0, 4.2, TR, '#3c4048', { seg: 6 });
            b.lamp('s', -b.hw + 1, 4.2, '#fff0c0'); b.lamp('s', b.hw - 1, 4.2, '#fff0c0'); b.lamp('s', 0, 4.2, '#fff0c0');
            for (const s of ['e', 'w']) { for (const u of spread(-b.hd + 1, b.hd - 1, 4)) b.sbox(s, u, 1, 0.3, 6, 0.12, CO3, '#555b66'); b.pipe(s, -b.hd + 0.4, 7); } b.grille('n', -3, 4.6, 1.6, 0.9); b.grille('n', 3, 4.6, 1.6, 0.9); },
        'P10-05-B2': b => { const F = b.fs, h = half(b, F);                                                    // CREW CANTEEN
            b.plinth(0.6, BR3, '#8a7a68'); b.frames(F, -h + 1.5, h - 1.5, 0.8, 1.8, 5, '#5a6a3e'); b.awning(F, -h + 1, h - 1, 2.75, 1.3, '#7a8a5a', '#f0e8d0');
            b.blade(F, h - 0.5, 2.9, 0.8, 0.6, '#f0e8d0', 0.4); b.cyl(h * 0.5, 0, 0.3, 3.8, 2.6, CO, '#8a8f98', { seg: 8 }); b.cyl(h * 0.5, 0, 0.45, 6.4, 0.2, null, '#55585e', { seg: 8 }); b.pipe(OPP[F], -h + 0.4, 3.8); b.grille(OPP[F], 1, 2.4); },
        'P11-05-B1': b => {                                                                                    // FILM STUDIO
            b.plinth(0.8, CS, '#b8ac90', 0.12); b.piers('n', spread(-b.hw + 0.6, b.hw - 0.6, 6).filter(u => Math.abs(u - b.du) > 1.4), 0.8, 5.9, 0.7, ST, '#fff6e0'); b.frames('n', -b.hw + 1, b.hw - 1, 4.2, 2, 8, '#b03020');
            if (Math.abs(b.du) > 2.9) { b.sbox('n', 0, 0.8, 3.4, 2.6, 0.08, U('GlassWindowTall1a'), '#607088'); b.frames('n', -1.7, 1.7, 0.8, 2.6, 2, '#b03020', 0.08); } b.bulbs('n', -4.6, 4.6, 3.45, 9, '#fff2c0', 1.85);
            for (const u of [-7.5, 7.5].filter(u => Math.abs(u) < b.hw - 2 && Math.abs(u - b.du) > 2.6)) b.board('n', u - 1.4, u + 1.4, 1.0, 2.2, '#fff6d0', '#b03020', 0.45);
            const sd = b.hd * 2 - 10.5; for (const s of ['e', 'w']) for (const u of spread(b.hd - sd + 0.6, b.hd - 0.6, 5)) b.sbox(s, u, 0.8, 0.6, 8.7, 0.25, CO, '#c4b99c', { off: -0.5 });   /* the stage's buttress ribs */
            b.frames('e', 2, 9, 0, 6.5, 2, '#24476e'); b.sbox('e', 5.5, 6.6, 7.6, 0.25, 0.9, CO3, '#24476e'); b.sbox('e', 0.6, 4.4, 0.4, 0.5, 0.3, null, '#ff3030', { glow: 1 });   /* the stage door's hood + the red light */
            b.sbox('e', -4, 5, 4.2, 2.6, 0.1, null, '#fff6e0'); b.sbox('e', -4, 5.9, 3.4, 0.9, 0.04, null, '#b03020', { off: 0.1 });   /* the stage number panel */
            b.pipe('w', b.hd - 0.6, 9.4); b.pipe('w', b.hd - sd + 0.4, 9.4); b.grille('s', -4, 5, 2.2, 1.2); b.grille('s', 4, 5, 2.2, 1.2); b.ac(-b.hw + 2, b.hd + 0.9, 0, true);
            const wx = b.hw + 2.2, wz = b.hd + 2.2; b.cyl(wx, wz, 1.76, 9.6, 0.14, null, IRON, { seg: 16 }); b.cyl(wx, wz, 1.76, 11.6, 0.14, null, IRON, { seg: 16 }); b.box(wx, wz, 2.6, 0.1, 5, 0.1, TR, '#888888'); b.box(wx, wz, 0.1, 2.6, 5, 0.1, TR, '#888888'); },
        'P08-06-B1': b => { const n = 4, sl = (b.hd * 2 - 3.5) / n, cols = ['#d83030', '#f0b020', '#2a9a6a', '#3070d0'];   // NIGHT MARKET
            for (let i = 0; i < n; i++) { const z = -b.hd + 1.75 + (i + 0.5) * sl;
                for (const sx of [-1, 1]) b.box(sx * (b.hw - 0.75), z, 0.05, sl + 0.5, 3.0, 0.4, PL, cols[i]);   /* the valances */
                for (const u of spread(-b.hw + 2, b.hw - 2, 5)) b.box(u, z + sl / 2 - 0.3, 0.26, 0.26, 2.6, 0.36, PL, ['#ff5050', '#ffd060', '#60e0a0', '#70a0ff'][(i + Math.round(u)) & 3], { glow: 1 });   /* the lantern strings */
                b.box(0, z + sl / 2 - 0.3, b.hw * 2 - 1.8, 0.03, 2.98, 0.03, null, IRON);
                b.box(-1.6, z, 4.1, sl - 2.1, 1.5, 0.06, WOOD, '#5b3a22'); b.box(-1.6, z - (sl - 2.4) / 2 + 0.3, 3.4, 0.5, 1.56, 0.45, PL, cols[(i + 2) % 4]); b.box(-1.6, z + (sl - 2.4) / 2 - 0.3, 3.4, 0.5, 1.56, 0.3, WOOD, '#c8a060'); }
            b.cyl(-b.hw + 1.2, -b.hd + 0.9, 0.14, 0, 5.4, TR, '#333333', { seg: 6 }); b.cyl(-b.hw + 1.2, b.hd - 0.9, 0.14, 0, 5.4, TR, '#333333', { seg: 6 });
            b.box(-b.hw + 1.2, -b.hd + 0.9, 2.6, 0.2, 4.4, 1.0, null, '#ffd24a', { glow: 0.9 }); b.box(-b.hw + 1.2, b.hd - 0.9, 2.6, 0.2, 4.4, 1.0, null, '#ffd24a', { glow: 0.9 }); },
        'P08-06-B2': b => { const F = b.fs, h = half(b, F);                                                    // NOODLE BAR
            b.plinth(0.5, CS, '#3a2a24'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * (b.hw + 1.0), sz * (b.hd + 1.0), 0.16, 0, 4, PL, '#8a1818', { seg: 8 });
            b.sbox(F, 0, 0.9, h * 2 - 2, 1.5, 0.06, GR, '#ffe6b0', { glow: 0.5 }); b.frames(F, -h + 1, h - 1, 0.9, 1.5, 6, '#2a1a12', 0.06); b.sbox(F, 0, 0.78, h * 2 - 1.4, 0.12, 0.6, WOOD, '#5b3a22');   /* the counter */
            for (const u of spread(-h + 1.4, h - 1.4, 5)) b.sbox(F, u, 2.55, 0.5, 1.0, 0.03, PL, u ? '#f4e8c8' : '#2a1a12', { off: 0.75 });   /* the door cloths */
            for (const u of [-h + 0.2, h - 0.2]) b.sbox(F, u, 2.3, 0.34, 0.7, 0.34, PL, '#e03030', { off: 1.0, glow: 0.9 }); b.cyl(0, 0, 0.3, 6.25, 1.6, CO, '#444444', { seg: 8 }); b.pipe(OPP[F], h - 0.4, 4); },
        'P09-06-B1': b => { const d = b.du;                                                                    // CABARET
            b.plinth(0.7, ST, '#5a1020', 0.12); b.corners(0.7, 6.8, ST, '#f0d8a0', 0.5); b.frames('n', -b.hw + 3.5, b.hw - 1, 4.2, 2.2, 6, '#f0d8a0');
            for (const u of spread(-b.hw + 3.5, b.hw - 1, 7)) b.sbox('n', u, 6.4, 0.5, 0.5, 0.2, ST, '#f0d8a0'); b.trim(3.8, 0.2, ST, '#f0d8a0', 0.1, { top: false });
            b.bulbs('n', d - 1.6, d + 1.6, 2.65, 7, '#ffb0c8', 1.6); b.lamp('n', d - 2.2, 2.2, '#ff90b0'); b.lamp('n', d + 2.2, 2.2, '#ff90b0');
            b.board('n', d + 3, Math.min(b.hw - 1, d + 5.6), 0.9, 1.9, '#ffd0e0', '#f0d8a0', 0.5);
            const tx = -b.hw, tz = -b.hd; for (const y of [3.6, 11]) b.cyl(tx, tz, 2.75, y, 0.25, ST, '#f0d8a0'); b.cyl(tx, tz, 2.64, 4.4, 2.2, GT, '#ffb0c8', { glow: 0.5, cap: false }); b.cyl(tx, tz, 2.64, 8.4, 1.8, GT, '#ffb0c8', { glow: 0.5, cap: false });
            b.cyl(tx, tz, 0.12, 15.4, 1.8, GOLD, null, { r2: 0.02, seg: 6 }); for (const s of ['e', 'w']) { b.piers(s, spread(-b.hd + 2.8, b.hd - 0.8, 4), 0.7, 6.8, 0.6, PL, '#8a1428', ST, '#f0d8a0'); } b.pipe('s', b.hw - 0.5, 7.5); b.pipe('s', -b.hw + 0.5, 7.5); b.grille('s', 0, 1.6, 1.4, 0.8); },
        'P09-06-B2': b => { const F = b.fs, h = half(b, F);                                                    // MAGIC SHOP
            b.plinth(0.5, ST, '#201840'); b.frames(F, -h + 1, h - 1, 0.7, 2, 4, '#c8a84a'); b.corners(0.5, 4.5, ST, '#5a4a9a', 0.45);
            b.blade(F, -h + 0.5, 3.4, 1.0, 1.1, '#c0a0ff'); b.lamp(F, h - 0.5, 2.3, '#c0a0ff'); b.cyl(0, 0, 0.5, 9.2, 0.9, null, '#c0a0ff', { r2: 0, seg: 4, glow: 0.9 }); b.cyl(0, 0, 0.5, 8.7, 0.5, null, '#c0a0ff', { r2: 0.5, seg: 4, glow: 0.9 }).r = 0.02;
            for (const s of FLK[F]) b.sbox(s, 0, 2.2, 1.6, 1.6, 0.08, GS, '#c0a0ff', { glow: 0.5 }); b.pipe(OPP[F], 0, 5); },
        'P09-06-B3': b => { const F = b.fs, h = half(b, F);                                                    // PROP STORE
            b.plinth(0.8, CS, '#7a7a7a'); b.frames(F, -3, 3, 0, 3.3, 1, '#2c2c30'); for (const y of [0.55, 1.1, 1.65, 2.2, 2.75]) b.sbox(F, 0, y, 5.9, 0.05, 0.03, null, '#333338', { off: 0.1 });
            for (const u of [-3.4, 3.4]) b.cyl(...(F === 's' || F === 'n' ? [u, (F === 's' ? 1 : -1) * (b.hd + 0.5)] : [(F === 'e' ? 1 : -1) * (b.hw + 0.5), u]), 0.14, 0, 1.0, null, '#e8c020', { seg: 8 });   /* bollards */
            b.lamp(F, -h + 1, 3.6, '#fff0c0'); b.lamp(F, h - 1, 3.6, '#fff0c0'); b.sbox(F, -h + 1.6, 0.9, 1.1, 2.1, 0.06, CO3, '#6a4a1c'); b.pipe(F, h - 0.25, 4.6); for (const s of FLK[F]) for (const u of spread(-half(b, s) + 1, half(b, s) - 1, 3)) b.sbox(s, u, 0.8, 0.25, 3.8, 0.1, CO3, '#8a561e'); },
        'P10-06-B1': b => { const d = b.du;                                                                    // STAGE WORKSHOP
            b.plinth(0.9, CS, '#6a5a50', 0.12); b.trim(6.7, 0.3, BR3, '#5e463a', 0.1, { top: false });
            b.frames('n', -b.hw + 1, d - 4.5, 2.6, 2.6, 5, IRON); b.frames('n', d + 4.5, b.hw - 6, 2.6, 2.6, 3, IRON); b.frames('n', d + 1.2, d + 4.4, 0, 3.6, 1, '#3c4048');
            for (const y of [0.6, 1.2, 1.8, 2.4, 3.0]) b.sbox('n', d + 2.8, y, 3.1, 0.05, 0.03, null, '#8a6c10', { off: 0.1 });
            b.piers('n', [-b.hw + 0.5, d - 1.6, d + 5, b.hw - 5.9], 0.9, 5.8, 0.7, BR3, '#7a5a4a', CS, '#b8ac9c'); b.lamp('n', d - 1.6, 2.6); b.sbox('n', d + 2.8, 3.9, 0.3, 0.3, 1.6, TR, '#e8c020');   /* the hoist beam */
            const px = b.hw - 2.8, pz = -b.hd + 2.8; for (const y of [10.2, 12.4]) for (const sg of [-1, 1]) { b.box(px + sg * 2.83, pz, 0.06, 1.6, y, 1.4, GF, '#d8f0ff', { glow: 0.4 }); b.box(px, pz + sg * 2.83, 1.6, 0.06, y, 1.4, GF, '#d8f0ff', { glow: 0.4 }); }
            b.box(px, pz, 5.9, 5.9, 14.7, 0.3, CS, '#b8ac9c'); b.cyl(-b.hw + 2.1, b.hd - 2.8, 0.62, 14.6, 0.4, BR2, '#4a342a', { seg: 10 });
            for (const s of ['e', 's']) { b.piers(s, spread(-half(b, s) + 1, half(b, s) - 1, 5), 0.9, 5.8, 0.6, BR3, '#7a5a4a'); b.pipe(s, half(b, s) - 0.4, 7); } b.grille('s', 0, 4.5, 2, 1.1);
            for (const u of spread(-3, 10, 5)) b.box(-b.hw - 1.7, u, 2.7, 0.1, 1.2, 0.5, WOOD, '#8a6a40'); },
        'P11-06-B1': b => { const d = b.du;                                                                    // ARCADE
            b.plinth(0.5, SUB, '#0c0a16'); b.cyl(-b.hw, 0, b.hd + 0.1, 0, 0.5, SUB, '#0c0a16', { arc: 180, a0: 90, seg: 24 });
            b.frames('s', d + 4.5, b.hw - 1, 0.5, 2.3, 5, '#ff30c0'); for (const u of spread(-b.hw + 1.5, d - 4.5, 3)) b.board('s', u - 1.2, u + 1.2, 0.8, 1.9, ['#30e0ff', '#ffe030', '#ff30c0'][Math.abs(Math.round(u)) % 3], '#0c0a16', 0.6);   /* the cabinet posters */
            b.bulbs('s', d - 3, d + 3, 4.1, 9, '#ffe030', 3.4); b.board('n', -6, 6, 3.4, 1.6, '#30e0ff', '#0c0a16', 0.7); for (const u of spread(-b.hw + 2, b.hw - 2, 6)) b.sbox('n', u, 0.5, 0.25, 2.4, 0.08, null, '#ff30c0', { glow: 1 });
            b.trim(4.25, 0.12, null, '#ffe030', 0.12, NEON); b.cyl(-b.hw, 0, b.hd + 0.12, 4.25, 0.12, null, '#ffe030', { arc: 180, a0: 90, seg: 24, glow: 1 });
            for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.box(b.hw - 6 + Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0.3, 0.3, 7.7, 0.08, null, '#fff2c0', { glow: 1 }); } b.cyl(b.hw - 6, 0, 1.2, 7.7, 0.1, null, '#c89a10');
            b.ac(2, -b.hd + 1.4, 6.3, true); b.ac(-4, -b.hd + 1.4, 6.3); b.cowl(6, 1.5, 6.3); b.pipe('e', 0, 6.3, '#1c1a2a'); },
        'P11-06-B2': b => {                                                                                    // APARTMENTS
            b.plinth(0.6, BR3, '#5a3428'); b.trim(3.5, 0.2, CS, '#c8b8a0', 0.08, { top: false }); b.trim(7, 0.2, CS, '#c8b8a0', 0.08, { top: false });
            for (const y of [4.2, 7.7]) { b.frames('w', -b.hd + 1.4, b.hd - 1.4, y, 2, 6, CREAM); b.sbox('w', 0, y - 0.55, b.hd * 2 - 2.4, 1.0, 0.05, TR, '#333333', { off: 1.36 }); for (const sg of [-1, 1]) b.sbox('w', sg * (b.hd - 1.2), y - 0.55, 0.05, 1.0, 1.4, TR, '#333333'); }
            b.sbox('w', 0, 0.7, 4, 2.3, 0.06, GR, '#ffe6b0', { glow: 0.35 }); b.frames('w', -2, 2, 0.7, 2.3, 3, CREAM, 0.06); b.awning('w', -2.4, 2.4, 3.05, 1.1, '#3a3038');
            for (const s of ['n', 's']) for (const y of [1.2, 4.6, 8.1]) for (const u of [-b.hw / 2, b.hw / 2]) { b.sbox(s, u, y, 1.3, 1.6, 0.06, GR, '#ffe6b0', { glow: 0.35 }); b.sbox(s, u, y - 0.12, 1.6, 0.12, 0.2, CS, '#c8b8a0'); b.sbox(s, u, y + 1.6, 1.6, 0.16, 0.14, CS, '#c8b8a0'); }
            b.pipe('e', -b.hd + 0.5, 10.5); b.pipe('e', b.hd - 0.5, 10.5); for (const y of [2.2, 5.6, 9.1]) b.sbox('e', 0, y, 0.9, 0.6, 0.45, CO, '#b9bcc0'); b.cyl(0, b.hd * 0.4, 0.4, 12.2, 2.6, BR3, '#5a3428', { seg: 8 }); },
        'P09-07-B1': b => { const d = b.du;                                                                    // BAKERY
            b.plinth(0.6, BR3, '#8a5a3a'); b.frames('s', -b.hw + 1.5, b.hw - 1.5, 0.6, 2, 6, '#6a3a2a'); b.corners(0.6, 4.4, BR3, '#8a5a3a', 0.5);
            b.blade('s', -b.hw + 0.6, 3.5, 1.0, 0.9, '#f0e0b0', 0.5); b.lamp('s', d - 1.4, 2.3); b.lamp('s', d + 1.4, 2.3);
            for (const s of [-1, 1]) { b.cyl(s * 5, -1, 0.62, 10, 0.25, BR3, '#4a3a34', { seg: 8 }); b.cyl(s * 5, -1, 0.28, 10.25, 0.6, null, '#b0582e', { seg: 8 }); }
            for (const s of ['e', 'w']) { b.sbox(s, 0, 1.4, 1.5, 1.6, 0.06, GR, '#ffe6b0', { glow: 0.4 }); b.frames(s, -0.75, 0.75, 1.4, 1.6, 2, '#6a3a2a', 0.06); } b.sbox('n', 2, 0, 1.2, 2.2, 0.06, WOOD, '#6a3a2a'); b.grille('n', -2, 2.6, 1.4, 0.8); b.pipe('n', b.hw - 0.4, 5); },
        'P09-07-B2': b => { const F = b.fs, h = half(b, F);                                                    // KEBAB
            b.plinth(0.9, TG, '#2a6a4a'); b.frames(F, -h + 1.5, h - 1.5, 1.0, 1.4, 4, '#c8ccd2'); b.sbox(F, 0, 0.88, h * 2 - 2.4, 0.12, 0.55, CO, '#c8ccd2');   /* the serving shelf */
            b.awning(F, -h + 1, h - 1, 2.45, 1.2, '#2a6a4a', '#f4f0e8'); b.blade(F, h - 0.4, 2.9, 0.7, 0.7, '#30ff90'); b.cyl(h * 0.4, 0, 0.26, 3.8, 2.2, CO, '#9a9da2', { seg: 8 }); b.cyl(h * 0.4, 0, 0.42, 6, 0.18, null, '#55585e', { seg: 8 }); b.pipe(OPP[F], 0, 3.8); },
        'P10-07-B1': b => { const d = b.du;                                                                    // CREW HOUSE
            b.plinth(0.6, BR3, '#4a4058'); b.trim(3.6, 0.22, CS, '#c8c0d0', 0.08, { top: false }); b.frames('n', -b.hw + 1.5, d - 1.6, 4.2, 2, 6, CREAM); b.frames('n', d + 1.6, b.hw - 1.5, 4.2, 2, 6, CREAM);
            for (const u of spread(-b.hw + 2.5, b.hw - 2.5, 6)) if (Math.abs(u - d) > 2.2) { b.sbox('n', u, 0.9, 1.4, 1.9, 0.06, GR, '#ffe6b0', { glow: 0.4 }); b.frames('n', u - 0.7, u + 0.7, 0.9, 1.9, 2, CREAM, 0.06); }
            b.lamp('n', d - 1.5, 2.3); b.lamp('n', d + 1.5, 2.3); b.corners(0.6, 6.4, BR3, '#5a4e6a', 0.5);
            for (const x of [-b.hw + 3, b.hw - 3]) { b.cyl(x, 1.5, 0.45, 8, 2.6, BR3, '#4a4058', { seg: 8 }); b.cyl(x, 1.5, 0.58, 10.6, 0.2, BR3, '#3a3048', { seg: 8 }); }
            b.sbox('s', 0, 0.2, 2.2, 3.3, 0.9, TR, '#333333'); b.sbox('s', 0, 3.5, 3.4, 0.1, 1.1, TR, '#333333'); b.pipe('s', -b.hw + 0.5, 7); b.pipe('s', b.hw - 0.5, 7); },
        'P10-07-B2': b => {                                                                                    // BOX OFFICE
            b.plinth(0.9, PL, '#7a1830'); b.frames('e', -b.hd + 1.2, b.hd - 1.2, 1.0, 1.5, 4, '#c9a24a'); b.frames('s', -b.hw + 1.2, b.hw - 1.2, 1.0, 1.5, 4, '#c9a24a');
            b.sbox('e', 0, 0.88, b.hd * 2 - 2, 0.12, 0.4, GOLD, null); b.sbox('s', 0, 0.88, b.hw * 2 - 2, 0.12, 0.4, GOLD, null); b.bulbs('e', -b.hd + 0.6, b.hd - 0.6, 2.85, 8); b.bulbs('s', -b.hw + 0.6, b.hw - 0.6, 2.85, 8);
            for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; b.box(Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0.3, 0.3, 3.7, 2.2, GOLD, null, { ry: -a / D2R, top: false }); } b.cyl(0, 0, 3.8, 5.75, 0.2, GOLD, null, { seg: 8 }); },
        'P11-07-B1': b => {                                                                                    // CINEMA
            b.plinth(0.9, MB, '#1a6a78', 0.14); for (const y of [9.2, 9.7, 10.2]) b.trim(y, 0.14, PL, '#1a8a9a', 0.07, { top: false });
            b.piers('w', [-b.hd + 0.6, -3.4, 3.4, b.hd - 0.6], 4.7, 5.9, 0.8, ST, '#fff4dc'); b.frames('w', -b.hd + 1.5, -1.2, 5.6, 3.6, 4, '#1a8a9a'); b.frames('w', 1.2, b.hd - 1.5, 5.6, 3.6, 4, '#1a8a9a');
            b.piers('s', spread(-b.hw + 0.6, b.hw - 0.6, 4), 4.7, 5.9, 0.8, ST, '#fff4dc'); b.frames('s', -b.hw + 1.5, b.hw - 1.5, 5.6, 3.6, 8, '#1a8a9a');
            b.bulbs('w', -b.hd, b.hd, 3.38, 16, '#fff2c0', 2.62); b.bulbs('s', -b.hw, b.hw, 3.38, 14, '#fff2c0', 2.62); b.bulbs('w', -b.hd, b.hd, 4.45, 16, '#ff6070', 2.62); b.bulbs('s', -b.hw, b.hw, 4.45, 14, '#ff6070', 2.62);
            for (let i = 0; i < 10; i++) { b.box(-b.hw - 1.52, 0.5, 0.08, 0.2, 5 + i * 1.2, 0.2, null, '#fff2c0', { glow: 1 }); b.box(-b.hw - 1.52, -0.5, 0.08, 0.2, 5 + i * 1.2, 0.2, null, '#fff2c0', { glow: 1 }); }
            for (const u of [-b.hd + 2.6, b.hd - 2.6]) b.board('w', u - 1.3, u + 1.3, 0.95, 2.1, '#fff6d0', '#1a8a9a', 0.5); for (const u of spread(-b.hw + 3, b.hw - 3, 3)) b.board('s', u - 1.3, u + 1.3, 0.95, 2.1, '#fff6d0', '#1a8a9a', 0.5);
            for (const s of ['n', 'e']) { b.piers(s, spread(-half(b, s) + 1, half(b, s) - 1, 5), 0.9, 9.7, 0.7, ST, '#e2d4b4'); b.pipe(s, half(b, s) - 0.5, 10.7); } b.sbox('e', 0, 0, 1.8, 2.3, 0.07, CO3, '#1a6a78'); b.lamp('e', 1.5, 2.5);
            b.ac(b.hw - 2.5, -3, 10.62, true); b.ac(b.hw - 2.5, 3, 10.62, true); b.cowl(2, 0, 10.62); b.grille('n', 0, 6, 2.2, 1.2); },
    };

    /* ═══ ROOFS + AC UNITS + MORE SHEETS, per building (mondo 11-13 20:18 + 20:19): roof membranes and parapets, roof plant, skylights, hatches,
       gutters, wall AC units, pack door sheets on the service doors, grill sheets, hazard plates, a second sheet for the base or a band ═══ */
    const ROOFS = {
        'P08-04-B1': b => { const F = b.fs, K = OPP[F];                                                        // CASINO
            b.top(13.82, RF, '#5a5660', 1.0); b.plant(-b.hw + 5, 0, 13.8, 2.5); b.sky(2, -1.5, 13.8, 3, 2); b.hatch(-b.hw + 3, b.hd - 3.5, 13.8);
            b.parapet([K, FLK[F][0], FLK[F][1]], 10.2, 0.5, MB, '#4a3560', '#c9a24a'); b.sdoor(K, 0, 0, '#b8a8c8'); b.haz(K, 1.2, 1.4); b.wac(K, -6, 5.4); b.wac(K, 6, 5.4); b.wac(K, -6, 2.6); b.wac(K, 6, 2.6);
            b.sbox(K, 0, 0.8, half(b, K) * 2 - 1, 2.4, 0.03, DADO, '#8a7aa0', { off: 0.05, uv: [3.5, 3.2] }); },
        'P08-04-B2': b => { const K = OPP[b.fs]; b.gutter(OPP['e'] === K ? 'w' : 'w', 4.2, 0.5); b.wac(K, -1.5, 2.6); b.sdoor(K, 1.5, 1); b.cowl(0, 0, 5.0); },
        'P09-04-B1': b => { b.sdoor('n', -4, 2); b.sdoor('n', 4, 2); b.wac('n', -7, 5); b.wac('n', 0, 5); b.wac('n', 7, 5); b.wac('e', 0, 5); b.sbox('s', 0, 0.45, b.hw * 2 - 0.4, 0.05, 0.03, RTL, '#d0306a', { off: 0.05 });
            b.plant(-b.hw + 3, -b.hd + 1.6, 7, 2); b.sky(4, 0, 7, 3, 1.6); b.hatch(b.hw - 1.5, -b.hd + 1.5, 7); },
        'P09-04-B2': b => { const K = OPP[b.fs]; b.gutter('e', 5.2, 0.5); b.gutter('w', 5.2, 0.5); b.sdoor(K, -1.5, 2, '#c8b0e8'); b.wac(K, 1.6, 2.8); b.cyl(1.5, 1, 0.22, 6, 1.6, CO, '#9a9da2', { seg: 8 }); },
        'P09-04-B3': b => { const K = OPP[b.fs]; b.sdoor(K, 2.5, 0, '#a8d0d0'); b.wac(K, -2.5, 2.6); b.haz(K, 3.6, 1.5); b.gutter('w', 4.4, 0); b.sbox(b.fs, 0, 0, half(b, b.fs) * 2 + 0.2, 0.9, 0.03, CHK, '#8ac0c0', { off: 0.1, uv: 1.75 }); },
        'P10-04-B1': b => {                                                                                    // CONCERT HALL
            for (const [x, z] of [[-b.hw + 2.5, -b.hd + 3], [b.hw - 2.5, -b.hd + 3]]) b.sky(x, z, 7, 2.4, 2.4);
            b.plant(-b.hw + 3.5, b.hd - 2.2, 7, 2); b.plant(b.hw - 6.5, b.hd - 2.2, 7, 2); b.box(0, b.hd - 2.2, 8.4, 2.6, 16.2, 0.04, RF, '#55525c');
            b.sdoor('s', -4.5, 0, '#c8c0b0'); b.sdoor('s', 4.5, 0, '#c8c0b0'); b.haz('s', 5.7, 1.5); b.wac('s', -7.5, 5); b.wac('s', 7.5, 5);
            for (const s of ['e', 'w']) b.sbox(s, 0, 0.9, b.hd * 2 - 1, 0.5, 0.03, U('TileMarble1d'), '#6a6470', { off: 0.17 }); },
        'P11-04-B1': b => { const K = OPP[b.fs]; b.sdoor(K, -2, 1, '#8a8f98'); b.wac(K, 5, 2.4); b.wac(K, 6.2, 2.4); b.haz(K, -0.8, 1.5); b.gutter('w', 5.2, 0.6, '#1c1f26');
            b.cyl(-b.hw, b.hd - 3.5, 3.4, 5.61, 0.03, RF, '#3a3d46', { seg: 24 }); b.cyl(-b.hw, b.hd - 3.5, 0.8, 5.6, 0.35, GF, '#bfe0ff', { seg: 12, glow: 0.5 }); },
        'P11-04-B2': b => { b.sdoor('w', -b.hd + 2.6, 2); b.wac('e', 3, 5); b.wac('e', -5, 5); b.wac('e', 3, 1.9); b.plant(-b.hw + 3, -b.hd + 2, 7, 2); b.sky(-1, 2, 7, 2.6, 1.8); b.sky(-1, -3, 7, 2.6, 1.8); b.hatch(-b.hw + 1.5, b.hd - 1.5, 7); },
        'P08-05-B1': b => { const L = b.hd * 2, z0 = -b.hd, s1 = L * 0.31, s2 = L * 0.30, s3 = L - s1 - s2, zm = z0 + s1 + s2 / 2, zs = z0 + s1 + s2 + s3 / 2;
            b.sbox('w', zs, 0.5, s3 - 0.4, 0.2, 0.03, CHK, '#e0e0e0', { off: 0.12, uv: 0.8 }); b.sbox('w', zm, 0, s2 - 1, 0.6, 0.05, RTL, '#b02020', { off: 0.1 });
            for (const u of [z0 + 2, z0 + s1 - 2]) b.sbox('e', u, 1.4, 1.2, 1.5, 0.05, SHUT, '#d8c8a8', { uv: 'fit', kind: 'wall' });
            b.sdoor('e', z0 + s1 / 2, 2); b.sdoor('e', zs + 1.5, 0); b.wac('e', zm - 2, 2.6); b.wac('e', zm + 2, 2.6); b.wac('e', zs - 2.5, 4.6); b.haz('e', zs + 2.7, 1.5);
            b.box(0, zs, b.hw * 2 - 0.6, s3 - 0.6, 8.0, 0.03, CHK, '#b8b0a0', { uv: 1.2 }); b.gutter('n', 5, 0.5); },
        'P08-05-B2': b => { const F = b.fs; b.sbox(F, 0, 0, half(b, F) * 2 + 0.24, 0.9, 0.03, CHK, '#ff5050', { off: 0.12, uv: 0.9 }); b.box(0.6, 0, b.hw * 2 + 3, b.hd * 2 + 1, 3.9, 0.03, RF, '#5a5a60'); b.plant(-1.5, -1.6, 3.9, 1.5); b.sdoor(FLK[F][1], 0, 0, '#f0d0d0'); b.wac(FLK[F][1], 2.2, 2.2); },
        'P09-05-B1': b => { b.parapet(['e', 'w', 's'], 10.7, 0.55, BR1, '#8f5238', '#f0e0c0'); b.plant(-b.hw + 5, b.hd - 3.2, 10.62, 3); b.hatch(b.hw - 1.6, b.hd - 3.2, 10.62); b.sky(-b.hw + 1.6, 0, 10.62, 1.4, 3);
            b.sdoor('s', -3.6, 0, '#c8a890'); b.sdoor('s', 3.6, 0, '#c8a890'); b.haz('s', 4.8, 1.5); b.wac('e', 0, 5); b.wac('e', 4, 5); b.wac('w', 0, 5); b.wac('w', 4, 5);
            b.sbox('n', 0, 0.9, b.hw * 2 - 1.2, 0.5, 0.03, RTL, '#a03040', { off: 0.16 }); for (const s of ['e', 'w']) b.sbox(s, 0, 0.9, b.hd * 2 - 0.4, 2.6, 0.03, DADO, '#c89878', { off: 0.03, uv: [3.5, 3.4] }); },
        'P10-05-B1': b => { b.sdoor('s', -b.hw + 1.2, 0, '#a8b0bc'); b.haz('s', -b.hw + 2.3, 1.6); b.haz('s', 0, 4.0); b.wac('n', -6, 2.6); b.wac('n', 6, 2.6); b.plant(-4, -b.hd + 1.6, 7, 3); b.hatch(b.hw - 1.5, -b.hd + 1.5, 7); b.sky(3, 1, 7, 3, 1.6); },
        'P10-05-B2': b => { const F = b.fs, K = OPP[F]; b.gutter('n', 3.8, 0.4); b.gutter('s', 3.8, 0.4); b.sdoor(K, -2, 2); b.wac(K, 3, 2.3); b.sbox(F, 0, 0.6, half(b, F) * 2 - 0.3, 0.2, 0.03, CHK, '#b8c8a0', { off: 0.02, uv: 0.8 }); },
        'P11-05-B1': b => { b.plant(-b.hw + 3.5, -b.hd + 6.5, 7, 2.5); b.sky(2, -b.hd + 4, 7, 3, 2); b.hatch(b.hw - 1.6, -b.hd + 8.5, 7);
            b.sdoor('w', -b.hd + 6, 0, '#e0d4b8'); b.sdoor('w', b.hd - 4, 1); b.haz('w', b.hd - 2.8, 1.5); b.wac('w', -b.hd + 2, 5); b.wac('w', -b.hd + 4, 5); b.wac('s', -7, 3); b.wac('s', 7, 3);
            b.sbox('n', 0, 0.8, b.hw * 2 - 1.5, 0.45, 0.03, RTL, '#b03020', { off: 0.14 }); for (const u of [0.25, 0.5, 0.75]) b.box(0, b.hd - (b.hd * 2 - 10.5) * u, b.hw * 2 - 0.6, 0.18, 9.4, 0.2, CO3, '#6a665c'); },
        'P08-06-B2': b => { const K = OPP[b.fs]; b.sdoor(K, 2, 2, '#c09080'); b.wac(K, -2, 2.4); b.sbox(b.fs, 0, 0, half(b, b.fs) * 2 + 0.2, 0.8, 0.03, RTL, '#8a1818', { off: 0.1 }); b.box(0, 0, b.hw * 2 - 2.6, b.hd * 2 - 3.7, 6.26, 0.03, RF, '#2a2422'); },
        'P09-06-B1': b => { b.gutter('e', 8, -0.75); b.gutter('w', 8, -0.75); b.gutter('s', 8, -0.75); b.sdoor('s', 3, 2, '#d0a0a0'); b.wac('s', -3, 5); b.wac('s', 5.5, 5); b.wac('e', 0, 5); b.haz('s', 4.2, 1.5);
            b.sbox('n', (-b.hw + 3.5 + b.hw - 1) / 2, 0.7, b.hw * 2 - 5, 0.5, 0.03, U('TileMarble1d'), '#3a1420', { off: 0.14 }); for (const s of ['e', 'w']) b.sbox(s, 1, 0.7, b.hd * 2 - 4, 2.8, 0.03, DADO, '#b05868', { off: 0.03, uv: [3.5, 3.4] }); },
        'P09-06-B2': b => { const K = OPP[b.fs]; b.sdoor(K, 1.6, 2, '#a898d8'); b.wac(K, -1.6, 2.6); b.sbox(b.fs, 0, 0, half(b, b.fs) * 2 + 0.2, 0.5, 0.03, CHK, '#8a70d0', { off: 0.1, uv: 0.8 }); },
        'P09-06-B3': b => { const K = OPP[b.fs]; b.sdoor(K, -2, 0, '#d8b080'); b.wac(K, 2, 2.6); b.haz(b.fs, 3.6, 1.6); b.gutter('e', 4.6, 0.4); b.cowl(-1, 0, 5.4); b.cowl(2, 0, 5.2); },
        'P10-06-B1': b => { b.sdoor('s', -5, 0, '#b8a090'); b.sdoor('e', 4, 1); b.haz('s', -3.8, 1.5); b.haz('n', b.du + 4.9, 1.6); b.wac('s', 4, 4.6); b.wac('s', 7, 4.6); b.wac('e', -4, 4.6);
            b.gutter('w', 7.02, 0); b.plant(b.hw - 2.8, -b.hd + 2.8, 15, 0.6);
            b.sbox('n', -b.hw / 2 - 1, 0.9, 6, 1.5, 0.03, DADO, '#a08878', { off: 0.03, uv: [3.5, 3] }); },
        'P11-06-B1': b => { b.parapet(['n', 'e'], 6.3, 0.4, SUB, '#1c1a2a', '#30e0ff'); b.plant(-6, 2.5, 6.3, 3); b.sky(-10, -1, 6.3, 2, 2); b.hatch(b.hw - 1.5, b.hd - 1.5, 6.3);
            b.sdoor('n', b.hw - 3, 0, '#5a5870'); b.haz('n', b.hw - 1.8, 1.5); b.wac('e', -3, 3.6); b.wac('e', 3, 3.6); b.sbox('s', (b.du + 4.5 + b.hw - 1) / 2, 0, b.hw - 1 - b.du - 4.5, 0.5, 0.03, CHK, '#ff30c0', { off: 0.12, uv: 0.7 }); },
        'P11-06-B2': b => { b.gutter('e', 10.5, 0.4); b.gutter('w', 10.5, 0.4); b.sdoor('e', 0, 2, '#c8a090'); for (const y of [4.4, 7.9]) for (const u of [-b.hd + 2, b.hd - 2]) b.wac('e', u, y);
            for (const s of ['n', 's']) for (const y of [1.2, 4.6, 8.1]) b.sbox(s, 0, y, 1.1, 1.6, 0.05, SHUT, '#c8b8a0', { uv: 'fit', kind: 'wall' }); b.sbox('w', 0, 0.6, b.hd * 2, 0.12, 0.03, CS, '#c8b8a0', { off: 0.1 }); },
        'P09-07-B1': b => { b.gutter('n', 5, 0.4); b.gutter('s', 5, 0.4); b.sdoor('n', 2, 2, '#d8b890'); b.wac('n', -4.5, 2.6); b.sbox('s', 0, 0.6, b.hw * 2 - 0.3, 0.2, 0.03, CHK, '#e8d8b8', { off: 0.02, uv: 0.8 }); },
        'P09-07-B2': b => { const K = OPP[b.fs]; b.sdoor(K, 2, 0, '#d8e0d8'); b.wac(K, -2, 2.3); b.gutter('s', 3.8, 0.6, '#1e4a34'); b.sbox(b.fs, 0, 0.9, half(b, b.fs) * 2 - 0.3, 0.12, 0.03, CHK, '#60c090', { off: 0.02, uv: 0.5 }); },
        'P10-07-B1': b => { b.gutter('n', 7, 0.4); b.gutter('s', 7, 0.4); b.sdoor('s', 0, 2, '#b0a0c0'); b.wac('s', -8, 4.8); b.wac('s', 8, 4.8); b.wac('s', -8, 1.8); for (const s of ['e', 'w']) for (const y of [1.2, 4.6]) b.sbox(s, 0, y, 1.1, 1.6, 0.05, SHUT, '#c0b8d0', { uv: 'fit', kind: 'wall' }); },
        'P10-07-B2': b => { b.parapet(['n', 'w', 'e', 's'], 3.7, 0.3, PL, '#c02848', '#c9a24a'); b.sdoor('n', 0, 3, '#ffd8e0'); b.wac('w', 0, 2.3); b.sbox('e', 0, 0, b.hd * 2 + 0.2, 0.9, 0.03, CHK, '#e04060', { off: 0.12, uv: 0.9 }); b.sbox('s', 0, 0, b.hw * 2 + 0.2, 0.9, 0.03, CHK, '#e04060', { off: 0.12, uv: 0.9 }); },
        'P11-07-B1': b => { b.parapet(['n', 'e', 's'], 10.7, 0.55, ST, '#e2d4b4', '#1a8a9a'); b.plant(-2, -b.hd + 3, 10.62, 3); b.sky(-b.hw / 2, 3, 10.62, 2.4, 2.4); b.hatch(b.hw - 1.6, b.hd - 1.6, 10.62);
            b.sdoor('n', -4, 0, '#d8ccb0'); b.sdoor('n', 4, 0, '#d8ccb0'); b.haz('n', 5.2, 1.5); b.wac('e', -5, 5.5); b.wac('e', 5, 5.5); b.wac('n', 0, 3.2);
            for (const s of ['n', 'e']) b.sbox(s, 0, 0.9, half(b, s) * 2 - 1, 2.6, 0.03, DADO, '#c8b898', { off: 0.03, uv: [3.5, 3.4] }); b.sbox('w', 0, 0.9, b.hd * 2 - 1.5, 0.5, 0.03, CHK, '#1a8a9a', { off: 0.16, uv: 0.8 }); b.sbox('s', 0, 0.9, b.hw * 2 - 1.5, 0.5, 0.03, CHK, '#1a8a9a', { off: 0.16, uv: 0.8 }); },
    };
    /* ═══ THE LETTERING, per building: plain trade words on the sign panels (no invented names) ═══ */
    const INK = '#1a1a1e', WHT = '#ffffff';
    const LETTERS = {
        'P08-04-B1': b => { const F = b.fs, d = b.du; b.txt(F, d - 3.2, d + 3.2, 3.94, 0.62, 'CASINO', '#fff2c0', 4.62, 0.9); for (const s of FLK[F]) b.txt(s, -2.4, 2.4, 5.6, 1.8, 'CASINO', '#5a1a30', 0.2); },
        'P08-04-B2': b => { b.txt('s', -b.hw + 1.2, b.hw - 1.2, 2.75, 0.8, 'PAWN', INK, 0.11); },
        'P09-04-B1': b => { b.txt('s', -5, 5, 7.1, 0.7, 'COSTUMES', '#f4ead6', 0.52); b.txt('w', -3.5, 3.5, 7.1, 0.7, 'COSTUMES', '#f4ead6', 0.52); },
        'P09-04-B2': b => { b.txt('n', -b.hw + 1.2, b.hw - 1.2, 3.35, 0.6, 'MASKS + WIGS', INK, 0.11); },
        'P09-04-B3': b => { const F = b.fs, h = half(b, F); b.txt(F, -h + 1.4, h - 1.4, 2.95, 0.6, 'TAILOR', '#1e5a5a', 0.2); },
        'P10-04-B1': b => { b.txt('n', -12, -7.2, 4.42, 0.66, 'TONIGHT', '#b01828', 2.78); b.txt('n', 7.2, 12, 4.42, 0.66, 'LIVE MUSIC', '#b01828', 2.78); b.vtxt('n', 0, 13.3, 1.02, 1.5, 'CONCERT', '#b01828', 1.48); },
        'P11-04-B1': b => { const d = b.du; b.txt('s', d + 2.3, b.hw - 1.8, 3.68, 0.74, 'RECORDING STUDIO', INK, 0.11); b.txt(b.fs, d + 1.18, d + 1.82, 2.28, 0.24, 'ON AIR', WHT, 0.12, 1); },
        'P08-05-B1': b => { const L = b.hd * 2, z0 = -b.hd, s1 = L * 0.31, s2 = L * 0.30, s3 = L - s1 - s2, zm = z0 + s1 + s2 / 2, zs = z0 + s1 + s2 + s3 / 2;
            b.txt('w', z0 + s1 / 2 - 2.6, z0 + s1 / 2 + 2.6, 3.7, 0.6, 'TRATTORIA', '#fff0d0', 0.2); b.txt('w', zm - 2, zm + 2, 2.56, 0.68, 'RAMEN', '#b02020', 0.11); b.txt('w', zs - 3.2, zs + 3.2, 6.3, 0.6, 'ROOFTOP GRILL', '#ffb060', 0.24, 0.8); },
        'P08-05-B2': b => { const s = FLK[b.fs][0]; b.txt(s, -2.2, 2.2, 1.5, 1.0, 'BURGERS', '#d02828', 0.2); },
        'P09-05-B1': b => { const d = b.du; b.txt('n', d - 7, d + 7, 4.0, 0.72, 'COMEDY TONIGHT', '#5a2030', 3.43); [...'COMEDY'].forEach((ch, i) => b.box(b.hw + 0.5, -b.hd - 1.93, 0.7, 0.02, 15.2 - (i + 1) * 1.7, 1.4, 'txt:' + ch + '|#fff6d0||0.5', '#ffffff', { uv: 'fit', kind: 'over', glow: 0.9 })); },
        'P10-05-B1': b => { b.txt('s', -5.6, 5.6, 4.96, 0.68, 'LOADING DOCK', INK, 0.11); },
        'P10-05-B2': b => { const F = b.fs; b.txt(F, -2.6, 2.6, 3.2, 0.5, 'CANTEEN', '#4a5a34', 0.08); },
        'P11-05-B1': b => { b.txt('n', -4.6, 4.6, 3.32, 0.46, 'FILM STUDIO', '#fff6d0', 1.82, 0.9); b.txt('e', -5.6, -2.4, 5.95, 0.8, 'STAGE 1', WHT, 0.16); b.txt('e', 2.8, 8.2, 7.5, 1.2, 'STAGE DOOR', '#24476e', 0.11); },
        'P08-06-B1': b => { b.txt('e', -6.5, 6.5, 5.28, 0.74, 'NIGHT MARKET', INK, 0.57); P0(b, -b.hw + 1.2, 4.5, -b.hd + 0.78, 180, 2.4, 0.8, 'MARKET'); P0(b, -b.hw + 1.2, 4.5, b.hd - 0.78, 0, 2.4, 0.8, 'MARKET'); },
        'P08-06-B2': b => { b.txt('s', -3.2, 3.2, 2.78, 0.74, 'NOODLES', '#b02020', 0.11); },
        'P09-06-B1': b => { b.txt('n', -b.hw + 4, b.hw - 1.5, 2.96, 0.68, 'CABARET', INK, 0.11); },
        'P09-06-B2': b => { b.txt('s', -b.hw + 1.3, b.hw - 1.3, 3.16, 0.68, 'MAGIC + JOKES', INK, 0.11); },
        'P09-06-B3': b => { b.txt('s', -b.hw + 1.4, b.hw - 1.4, 3.55, 0.6, 'PROP STORE', '#b8742a', 0.11); },
        'P10-06-B1': b => { b.txt('n', -7.6, 3.6, 5.68, 0.84, 'SCENERY WORKSHOP', '#5e463a', 0.11); },
        'P11-06-B1': b => { const d = b.du; b.txt('n', -5.6, 5.6, 3.55, 1.3, 'ARCADE', '#0c0a16', 0.2); b.txt('s', d + 4.8, b.hw - 1.3, 3.25, 0.9, 'ARCADE', '#30e0ff', 0.1, 1); },
        'P09-07-B1': b => { b.txt('s', -3, 3, 3.5, 0.6, 'BAKERY', '#fff0d0', 0.08); },
        'P09-07-B2': b => { b.txt('s', -4.7, 4.7, 2.66, 0.68, 'KEBAB  OPEN 24H', INK, 0.11); },
        'P10-07-B1': b => { const d = b.du; b.txt('n', d - 1.6, d + 1.6, 3.05, 0.42, 'STAGE CREW', '#f0e6cc', 0.08); },
        'P10-07-B2': b => { b.txt('e', -Math.min(2.4, b.hd - 0.6), Math.min(2.4, b.hd - 0.6), 3.32, 0.36, 'BOX OFFICE', '#5a1020', 0.12); b.txt('s', -Math.min(2.4, b.hw - 0.6), Math.min(2.4, b.hw - 0.6), 3.32, 0.36, 'BOX OFFICE', '#5a1020', 0.12); },
        'P11-07-B1': b => { b.txt('w', -b.hd + 1, -1.6, 3.42, 1.06, 'NOW SHOWING', '#c02030', 2.63); b.txt('w', 1.6, b.hd - 1, 3.42, 1.06, 'DOUBLE FEATURE', '#c02030', 2.63); b.txt('s', -b.hw + 1.5, b.hw - 1.5, 3.42, 1.06, 'NOW SHOWING', '#c02030', 2.63);
            b.vtxt('w', 0, 16.4, 1.75, 0.62, 'CINEMA', '#fff6d0', 1.53, 0.9); },
    };
    /* a free-standing word panel (x, z in the building's metres, ry its facing) */
    function P0(b, x, y, z, ry, w, h, words) { b.parts.push({ s: 'quad', p: [r3(x), y, r3(z)], ry, size: [w, h], key: 'txt:' + words + '|' + INK + '||' + (Math.round(w / h * 100) / 100), uv: 'fit', tint: 0xffffff, kind: 'over' }); }
    /* ═══ THE INSIDES (mondo 11-13 21:04 "let's go ahead and do the interiors", his OK on the cell plans 21:23). A walk-in shell is furnished IN
       PLACE, in the city room, on the 3.5 m battle squares (his 21:14 + 21:17 rule): a letter of a plan is one whole square. '.' = a walkway, a
       full square wide, nothing on it. Any other letter = a blocker that fills its square (a ghost block over it) and is drawn by KIT[letter]
       in the square's own frame: +z looks at the nearest walkway. Plans are written back row first, the front (door) row last, left = the left
       as you face the building from outside. Catalogue props where the model list has one (slot machines, sofas, beds, ranges, the piano, the
       ticket booth, the popcorn cart ...), three.js parts for the rest (there is no arcade cabinet, seat row or stage model). ═══ */
    const INSIDE = {
        'P08-04-B1': { g: ['SSS.cc.BB', '.........', 'SS..r.j.G'], keyIn: MB, floorIn: U('TileMarble3c'), rug: '#7a2030', table: '#1a6a3a', lamp: '#ffd9a0', words: { c: 'CASHIER', B: 'BAR' }, hang: 'crystal_chandelier', dado: '#3a2212', ceil: '#5a1a28', sconce: '#ffd9a0', stage: 'wheel' },
        'P11-04-B1': { g: ['R.M.P.V', '......V', 'L..XXX.', 'L......'], keyIn: WOOD, floorIn: WOOD, rug: '#3a3d46', R: 'amps', lamp: '#fff0d0', dado: '#2a2a30', ceil: '#2a2630', sconce: '#ffb070', juke: true },
        'P08-05-B1': { g: ['KKKKKKKKK', 'T.T.BB.LL', '.........'], keyIn: PL, floorIn: CHK, rug: null, table: '#f0e6d0', lamp: '#ffe6b0', words: { B: 'RAMEN' }, hang: 'paper_lantern', hangAll: true, dado: '#6a2018', ceil: '#3a2a22', juke: true },
        'P09-05-B1': { g: ['L.RR..mm', '.GGGGGG.', '........', 'HHH..HHH', 'HHH..HHH', 'HHH..HHH', '........', 'I.....Q.'], keyIn: BR1, floorIn: WOOD, rug: '#7a2838', rake: 3, seatFace: 'back', seat: '#b03040', lamp: '#ffe0a0', dado: '#2a1418', ceil: '#24161a', sconce: '#ffc890' },
        'P09-06-B1': { g: ['m.R', 'GGG', '.T.', 'B.T', '..T'], keyIn: PL, floorIn: WOOD, rug: '#6a1830', table: '#f0d8a0', lamp: '#ffb0c8', hang: 'mirror_ball', hangOne: true, dado: '#2a0a14', ceil: '#2a1020', sconce: '#ff90b0', T: 'lamp', stage: 'band' },
        'P10-06-B1': { g: ['YY.ZZ.DD', '........', 'GGG..DD.', 'GGG.....', '.....FFF', 'WW......', 'WW...FFF', 'RR......'], keyIn: BR3, floorIn: CS, rug: null, R: 'lumber', stage: 'set', lamp: '#f0f4ff', set: 'lights' },
        'P11-06-B1': { g: ['UAaAh.C', '.......', 'J..AA.D'], keyIn: SUB, floorIn: U('RubberNonSlip1a'), rug: '#241a40', lamp: '#30e0ff', words: { C: 'PRIZES' }, hang: 'mirror_ball', hangOne: true, dado: '#14102a', ceil: '#100c20', sconce: '#ff30c0', D: 'juke' },
        'P09-07-B1': { g: ['OOO', '..K', 'WW.', 'CC.', '..D'], keyIn: SUB, floorIn: CHK, rug: null, lamp: '#fff0d0', words: { C: 'FRESH BREAD' }, D: 'bread', C: 'bread', O: 'deck', dado: '#8a5a34', ceil: '#f0e6d0' },
        'P10-07-B1': { g: ['EEE.UU.NN', '.........', 'EE..T..RR'], keyIn: PL, floorIn: WOOD, rug: '#4a4058', table: '#8a5a34', lamp: '#fff0d0', dado: '#5b3a22', ceil: '#d8d0c0' },
        'P11-07-B1': { g: ['.....', 'HH.HH', 'HH.HH', 'HH.HH', '.I.Q.'], keyIn: PL, floorIn: U('RubberNonSlip1a'), rug: '#7a2030', rake: 1, seatFace: 'back', seat: '#a02838', screen: true, lamp: '#ffe0a0', dado: '#2a0a10', ceil: '#18080c', sconce: '#ffb070', I: 'projector' },
    };
    Object.assign(INSIDE, {
        'P10-04-B1': { g: ['m.RR..PL', '.GGGGGG.', '.GGGGGG.', '........', 'HHH..HHH', 'HHH..HHH', 'HHH..HHH', 'I......Q'], keyIn: MB3, floorIn: WOOD, rug: '#7a2030', rake: 4, seatFace: 'back', seat: '#8a1c2c', lamp: '#fff2c0', hang: 'crystal_chandelier', hangRow: 3, dado: '#3a2212', ceil: '#4a1a22', sconce: '#ffe0a0', stage: 'orchestra' },
        'P11-05-B1': { g: ['FFF..YYD', '........', 'GGG.k.X.', 'GGG.....', '........', 'R.L..m.N', '........', 'Z......D'], keyIn: CO, floorIn: CS, rug: null, stage: 'set', lamp: '#f0f4ff', set: 'lights', ceil: '#1a1c22' },
        'E-chapel': { g: ['pwp', 'p.p'], keyIn: ST, floorIn: WOOD, rug: '#b03060', lamp: '#ffd0e0', dado: '#f4e8e0', ceil: '#fff0f4', sconce: '#ffe0e8' },
    });
    const BLOCK_H = { r: 1.0, j: 1.0, a: 1.9, h: 1.9, k: 1.9, p: 1.0, w: 2.6, S: 1.8, T: 1.0, B: 2.2, c: 2.4, G: 1.0, K: 2.2, H: 1.2, L: 1.0, U: 1.0, X: 1.2, M: 1.2, P: 1.3, V: 2.4, A: 1.9, R: 1.8, m: 2.0, O: 2.2, W: 1.0, F: 4.2, Y: 2.2, Z: 1.0, D: 2.4, J: 0.9, C: 1.1, I: 2.6, Q: 1.7, E: 1.2, N: 1.9 };
    const HANG = { crystal_chandelier: 1.4, mirror_ball: 0.9, paper_lantern: 0.7 };   // the catalogue `h` of what hangs over a walk (PASS 2)
    const stool = (k, x, z) => { k.part('cyl', x, 0, z, null, '#2a2a2e', { r: 0.05, h: 0.7, seg: 6 }); k.part('cyl', x, 0.7, z, PL, '#8a2030', { r: 0.2, h: 0.07, seg: 10 }); };
    /* KIT[letter](k): k.part(s, lx, y, lz, key, tint, o) = a part in the square's frame; k.prop(key, lx, lz, turn) = a catalogue prop; k.i / k.n = this square's place in its run */
    const KIT = {
        S: k => { k.part('box', 0, 0, -0.3, PL, k.S.rug || '#7a2030', { size: [3.4, 0.1, 2.4] }); for (const x of [-1.05, 0, 1.05]) k.prop('slot_machine', x, -0.7, 0); },
        T: k => { k.part('cyl', 0, 0, 0, null, '#2a2a2e', { r: 0.14, h: 0.72, seg: 8 }); k.part('cyl', 0, 0.72, 0, PL, k.S.table || '#8a5a34', { r: 1.05, h: 0.07, seg: 16 }); k.part('cyl', 0, 0.7, 0, WOOD, '#5b3a22', { r: 1.1, h: 0.04, seg: 16 });
            for (let i = 0; i < 4; i++) { const a = (i + 0.5) * Math.PI / 2, x = Math.cos(a) * 1.38, z = Math.sin(a) * 1.38; k.part('cyl', x, 0, z, null, '#2a2a2e', { r: 0.05, h: 0.45, seg: 6 }); k.part('cyl', x, 0.45, z, PL, '#8a2030', { r: 0.22, h: 0.08, seg: 10 }); }
            if (k.S.T === 'lamp') k.prop('table_lamp', 0.25, -0.2, 0, { y: 0.79 }); },
        /* PASS 2 (mondo 11-13 22:33 "focus on aesthetic, vibe, atmosphere"): the casino's roulette + blackjack tables (Meshy), stools on the players' side */
        r: k => { k.prop('roulette_table', 0, -0.45, 0); for (const x of [-0.75, 0, 0.75]) stool(k, x, 0.75); },
        j: k => { k.prop('blackjack_table', 0, -0.5, 0); for (const a of [-60, -20, 20, 60]) stool(k, Math.sin(a * D2R) * 1.2, -0.5 + Math.cos(a * D2R) * 1.05); },
        /* PASS 2: the arcade's pinball pair (a) and claw crane pair (h) */
        a: k => { for (const x of [-0.8, 0.8]) k.prop('pinball_machine', x, -0.55, 0); },
        h: k => { for (const x of [-0.85, 0.85]) k.prop('claw_machine', x, -0.9, 0); },
        B: k => { k.part('box', 0, 0, 0.75, WOOD, '#4a2c18', { size: [3.5, 1.05, 0.7] }); k.part('box', 0, 1.05, 0.8, MB3, '#e9e4da', { size: [3.5, 0.06, 0.95] }); k.part('box', 0, 0, -1.5, WOOD, '#3a2212', { size: [3.5, 2.2, 0.4] });
            for (const y of [1.0, 1.55]) { k.part('box', 0, y, -1.24, WOOD, '#5b3a22', { size: [3.4, 0.05, 0.3] }); for (let i = 0; i < 7; i++) k.part('box', -1.5 + i * 0.5, y + 0.05, -1.22, null, ['#40c060', '#e0a020', '#c03030', '#3080d0'][(i + (y > 1.2 ? 1 : 0)) % 4], { size: [0.12, 0.32, 0.12], glow: 0.6 }); }
            for (const x of [-1.1, 0, 1.1]) { k.part('cyl', x, 0, 1.45, null, '#2a2a2e', { r: 0.05, h: 0.7, seg: 6 }); k.part('cyl', x, 0.7, 1.45, PL, '#8a2030', { r: 0.2, h: 0.07, seg: 10 }); }
            if (k.i === 0 && k.S.words && k.S.words.B) k.sign(k.S.words.B, 0, 2.3, -1.28, 2.4, 0.5); },
        c: k => { k.part('box', 0, 0, 0.9, MB, '#4a3560', { size: [3.5, 1.1, 0.6] }); k.part('box', 0, 1.1, 0.9, GOLD, null, { size: [3.5, 0.06, 0.7] }); k.part('quad', 0, 1.16, 1.0, TR, '#c9a24a', { size: [3.5, 1.2], ds: true }); k.part('box', 0, 2.36, 0.9, GOLD, null, { size: [3.5, 0.2, 0.5] });
            k.part('box', 0, 0, -1.4, CO3, '#3c4046', { size: [3.3, 1.6, 0.6] }); if (k.i === 0 && k.S.words && k.S.words.c) k.sign(k.S.words.c, 1.75, 2.62, 1.16, 3.0, 0.5); },
        G: k => { const set = k.S.stage === 'set'; k.part('box', 0, 0, 0, WOOD, set ? '#b08a58' : '#6a4a30', { size: [3.5, 0.9, 3.5] });
            if (k.edge.front) { k.part('box', 0, 0.9, 1.68, null, '#1a1a1e', { size: [3.5, 0.12, 0.14] }); if (!set) for (const x of [-1.1, 0, 1.1]) k.part('box', x, 0.9, 1.5, null, '#fff2c0', { size: [0.3, 0.14, 0.2], glow: 1 }); }
            if (k.edge.back) { if (set) { k.part('quad', 0, 0.9, -1.5, PL, ['#8ab8e0', '#e0a070', '#6a9a6a'][k.i % 3], { size: [3.5, 3.4], ds: true }); k.part('box', 0, 0.9, -1.62, WOOD, '#8a6a40', { size: [3.5, 3.4, 0.08] }); }
                else k.part('quad', 0, 0.9, -1.55, PL, '#8a1428', { size: [3.5, Math.max(2, k.H - 1.2)], ds: true, uv: [0.6, 3] }); }
            if (k.S.stage === 'wheel') k.prop('money_wheel', 0, -0.9, 0, { y: 0.9 });
            if (k.S.stage === 'band') { if (k.i === 0) { k.prop('drum_kit', 0.15, -0.55, 0, { y: 0.9 }); k.prop('pa_speaker', -1.35, 1.05, 0, { y: 0.9 }); } if (k.i === k.n - 1) { k.prop('guitar_amp', -0.4, -1.2, 0, { y: 0.9 }); k.prop('pa_speaker', 1.35, 1.05, 0, { y: 0.9 }); } }
            if (k.S.stage === 'orchestra') { if (k.edge.back && !k.edge.front) { for (const x of [-0.85, 0.85]) { k.prop('folding_chair', x, -0.55, 0, { y: 0.9 }); k.prop('music_stand', x + 0.1, 0.45, 180, { y: 0.9 }); }
                    const ins = ['instrument_harp', null, 'instrument_cello', null, 'instrument_cello', null][k.i % 6]; if (ins) k.prop(ins, 1.4, -1.25, 0, { y: 0.9 }); }
                if (k.edge.front && k.i === Math.floor(k.n / 2)) { k.part('box', -1.2, 0.9, 0.9, WOOD, '#3a2212', { size: [0.9, 0.2, 0.9] }); k.prop('music_stand', -1.2, 0.55, 180, { y: 1.1 }); } }
            if (k.S.set === 'lights' && set && k.edge.front && (k.i === 0 || k.i === k.n - 1)) k.prop('studio_light', k.i === 0 ? -1.2 : 1.2, 1.1, 180 + (k.i === 0 ? -25 : 25), { y: 0.9 });
            if (!set && k.i === Math.floor(k.n / 2) && k.edge.front) { k.part('cyl', 0, 0.9, 0.6, null, '#2a2a2e', { r: 0.03, h: 1.4, seg: 6 }); k.part('cyl', 0, 0.9, 0.6, null, '#2a2a2e', { r: 0.2, h: 0.03, seg: 10 }); k.part('box', 0, 2.3, 0.6, null, '#55585e', { size: [0.08, 0.16, 0.08] }); } },
        K: k => { k.part('box', 0, 0, 0.6, CO, '#c4c7cb', { size: [3.5, 0.9, 0.8] }); k.part('box', 0, 0.9, 0.6, null, '#d8dade', { size: [3.5, 0.04, 0.9] }); k.part('box', 0, 2.1, -1.0, CO, '#9a9ea4', { size: [3.3, 0.5, 1.2] });
            if (k.i % 2 === 0) k.prop('kitchen_range', 0, -1.3, 0); else { k.part('box', -0.8, 0, -1.3, CO, '#b9bcc0', { size: [1.4, 1.9, 0.7] }); k.part('box', 0.9, 0, -1.3, CO, '#c4c7cb', { size: [1.5, 0.9, 0.7] }); } },
        H: k => { const y0 = k.S.rake != null ? Math.max(0, k.r - k.S.rake) * 0.3 : 0; if (y0 > 0) k.part('box', 0, 0, 0, WOOD, '#3a2a24', { size: [3.5, y0, 3.5] });
            for (const z of [-0.85, 0.85]) for (const x of [-1.3, -0.43, 0.43, 1.3]) { k.part('box', x, y0 + 0.2, z, PL, k.S.seat || '#b03040', { size: [0.78, 0.26, 0.6] }); k.part('box', x, y0 + 0.2, z - 0.36, PL, k.S.seat || '#b03040', { size: [0.78, 0.85, 0.14] }); k.part('box', x, y0, z, null, '#1e1e22', { size: [0.5, 0.2, 0.4] }); } },
        L: k => { k.part('box', 0, 0, 0, PL, k.S.rug || '#4a4058', { size: [3.3, 0.03, 3.3] }); k.prop('psx_sofa_1', 0, -0.5, 0); k.part('box', 0.2, 0, 1.0, WOOD, '#5b3a22', { size: [1.2, 0.4, 0.6] }); if (k.S.juke && k.once('juke')) k.prop('jukebox', 1.25, -1.15, 0); },
        U: k => { k.part('box', 0, 0, 0, PL, k.S.rug || '#4a4058', { size: [3.3, 0.03, 3.3] }); if (k.i === 0) k.prop('curved_couch', k.n > 1 ? 1.75 : 0, -0.3, 0); k.part('box', 0, 0, 1.1, WOOD, '#3a2a24', { size: [1.6, 0.45, 0.5] }); k.part('box', 0, 0.45, 1.1, null, '#1a1a1e', { size: [0.7, 0.5, 0.4] }); k.part('quad', 0, 0.5, 0.89, null, '#a0d8ff', { size: [0.56, 0.4], ry: 180, glow: 0.9 }); },
        X: k => { if (k.i === Math.floor(k.n / 2)) { k.prop('mixing_console', 0, -0.2, 0); k.part('cyl', 0, 0, 1.15, null, '#2a2a2e', { r: 0.28, h: 0.5, seg: 10 }); return; }   /* PASS 2: the Meshy console in the middle, racks beside it */
            k.part('box', 0, 0, 0, WOOD, '#3a2a24', { size: [3.5, 0.78, 1.1] }); k.part('box', 0, 0.78, 0.1, null, '#1c1f26', { size: [3.4, 0.12, 0.9] }); for (let i = 0; i < 10; i++) k.part('box', -1.5 + i * 0.33, 0.9, 0.2, null, i % 3 ? '#e0e0e0' : '#ff5040', { size: [0.06, 0.04, 0.4], glow: 0.5 });
            k.part('box', 0, 0.9, -0.42, null, '#1a1a1e', { size: [1.3, 0.8, 0.08] }); k.part('quad', 0, 0.96, -0.37, null, '#60e0a0', { size: [1.16, 0.66], glow: 0.9 }); k.part('cyl', 0, 0, 1.15, null, '#2a2a2e', { r: 0.28, h: 0.5, seg: 10 }); },
        M: k => { k.part('box', 0, 0, 0, PL, '#7a2030', { size: [3.0, 0.18, 3.0] }); k.prop('drum_kit', 0, 0.05, 0, { y: 0.18 }); },   /* PASS 2: the Meshy kit on its riser (was cylinders) */
        P: k => { k.prop('decor_piano', 0, -0.2, 0); k.part('box', 0, 0, 0.9, WOOD, '#2a1a12', { size: [0.9, 0.48, 0.4] }); },
        V: k => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.part('box', sx * 1.55, 0, sz * 1.55, null, '#2a2a2e', { size: [0.12, 2.4, 0.12] }); k.part('box', 0, 2.4, 0, WOOD, '#5e3c20', { size: [3.3, 0.1, 3.3] });
            for (const a of [0, 90, 180, 270]) k.part('quad', Math.sin(a * D2R) * 1.55, 0.9, Math.cos(a * D2R) * 1.55, U('GlassWindowTall1a'), '#8090a8', { size: [3.0, 1.5], ry: a, uv: 'fit', ds: true, win: 'keep' });
            for (const a of [0, 90, 180, 270]) k.part('quad', Math.sin(a * D2R) * 1.55, 0, Math.cos(a * D2R) * 1.55, WOOD, '#5e3c20', { size: [3.1, 0.9], ry: a, ds: true });
            k.part('cyl', 0, 0, 0, null, '#2a2a2e', { r: 0.03, h: 1.5, seg: 6 }); k.part('box', 0, 1.5, 0, null, '#8a8a8a', { size: [0.1, 0.2, 0.1] }); },
        A: k => { for (const x of [-1.1, 0, 1.1]) k.prop('arcade_cabinet', x, -0.7, 0); k.part('quad', 0, 0, -0.7, null, ['#ff30c0', '#30e0ff'][k.i % 2], { size: [3.3, 1.4], flat: true, glow: 0.35 }); },   /* PASS 2: three Meshy cabinets a square, all facing the walk (the old back row faced the wall), a lit strip under them */
        R: k => { if (k.S.R === 'amps') { k.prop('guitar_amp', -1.05, -1.15, 0); k.prop('guitar_amp', 1.05, -1.15, 0); k.prop('instrument_guitar', -0.3, -0.6, 0); k.prop('instrument_guitar', 0.45, -0.6, 0); return; }
            if (k.S.R === 'lumber') { for (const x of [-1.6, 0, 1.6]) k.part('box', x, 0, -0.9, TR, '#3c4046', { size: [0.1, 2.2, 1.4] }); for (const y of [0.3, 1.0, 1.7]) for (let i = 0; i < 4; i++) k.part('box', 0, y + i * 0.09, -0.9 - 0.3 + i * 0.2, WOOD, i % 2 ? '#c8a060' : '#b08a58', { size: [3.4, 0.08, 0.5] }); return; }
            k.prop('costume_rack', -0.2, -0.95, 0); k.prop('costume_rack', 0.25, 0.55, 0); },   /* PASS 2: two Meshy costume racks (were shape rails) */
        m: k => { for (const x of [-0.85, 0.85]) k.prop('makeup_vanity', x, -1.1, 0); },   /* PASS 2: two Meshy dressing-room vanities, bulbs round the mirrors */
        O: k => { if (k.S.O === 'deck') { k.prop('deck_oven', -0.85, -1.1, 0); k.prop('deck_oven', 0.9, -1.1, 0); k.part('box', 0, 2.15, -1.1, CO, '#9a9ea4', { size: [3.4, 0.45, 1.2] });
                k.part('box', 0, 0, 0.75, WOOD, '#b08a58', { size: [2.6, 0.85, 0.7] }); for (const x of [-0.8, 0, 0.8]) k.part('cyl', x, 0.85, 0.75, PL, '#d8a860', { r: 0.26, h: 0.14, seg: 10 }); return; }
            k.part('box', -0.85, 0, -1.25, CO, '#55585e', { size: [1.6, 2.0, 0.9] }); for (const y of [0.35, 0.95, 1.55]) k.part('quad', -0.85, y, -0.79, null, '#ff9030', { size: [1.3, 0.4], glow: 0.8 }); k.prop('kitchen_range', 0.9, -1.3, 0); k.part('box', 0, 2.15, -1.1, CO, '#9a9ea4', { size: [3.4, 0.45, 1.2] });
            k.part('box', 0, 0, 0.7, WOOD, '#b08a58', { size: [2.6, 0.85, 0.8] }); for (const x of [-0.8, 0, 0.8]) k.part('cyl', x, 0.85, 0.7, PL, '#d8a860', { r: 0.26, h: 0.14, seg: 10 }); },
        W: k => { k.prop('steel_table', -0.9, 0, 0); k.prop('steel_table', 0.9, 0, 0); k.part('box', 0, 0.78, 0, WOOD, '#c8a060', { size: [2.8, 0.06, 0.3], ry: 12 }); k.part('box', -1.0, 0.78, 0.15, null, '#c03030', { size: [0.3, 0.2, 0.2] }); },
        F: k => { k.part('quad', 0, 0, 0, PL, ['#8ab8e0', '#e09060', '#5a9a6a'][(k.r + k.i) % 3], { size: [3.5, 4.2], ds: true }); for (const x of [-1.4, 0, 1.4]) { k.part('box', x, 0, -0.06, WOOD, '#8a6a40', { size: [0.08, 4.2, 0.08] }); k.part('box', x, 0, -0.7, WOOD, '#8a6a40', { size: [0.08, 0.08, 1.4] }); } },
        Y: k => { k.part('box', -0.8, 0, -0.6, WOOD, '#b08a58', { size: [1.3, 1.1, 1.3] }); k.part('box', 0.75, 0, -0.5, WOOD, '#9a7248', { size: [1.2, 1.0, 1.2], ry: 8 }); k.part('box', -0.1, 0, 0.9, WOOD, '#c8a060', { size: [1.1, 0.9, 1.0], ry: -6 }); k.part('box', -0.7, 1.1, -0.6, WOOD, '#9a7248', { size: [1.0, 0.9, 1.0], ry: 15 }); },
        Z: k => { if (k.i === 0) { k.prop('exec_desk', k.n > 1 ? 1.75 : 0, 0.3, 0); k.prop('exec_chair', k.n > 1 ? 1.75 : 0, -0.8, 0); } else k.part('box', 0.8, 0, -1.3, CO3, '#5a5e66', { size: [1.0, 1.4, 0.6] }); },
        D: k => { if (k.S.D === 'bread') { k.prop('bread_rack', -0.85, -1.2, 0); k.prop('bread_rack', 0.85, -1.2, 0); return; } if (k.S.D === 'juke') { k.prop('jukebox', -0.9, -1.2, 0); k.prop('claw_machine', 0.85, -0.9, 0); return; }
            k.prop('library_shelf_full', -0.9, -1.0, 0); k.prop('library_shelf_full', 0.9, -1.0, 0); },
        J: k => { k.prop('air_hockey_table', 0, 0, 0); },   /* PASS 2: the Meshy table (was shapes) */
        C: k => { k.part('box', 0, 0, 0.6, WOOD, '#5b3a22', { size: [3.5, 1.0, 0.7] }); k.part('quad', 0, 0.15, 0.96, GS, '#fff0c0', { size: [3.3, 0.7], glow: 0.5, uv: 'fit', win: 'keep' }); k.part('box', 0, 1.0, 0.6, MB3, '#e9e4da', { size: [3.5, 0.05, 0.8] });
            if (k.S.C === 'bread') { k.prop('bread_rack', -0.85, -1.3, 0); k.prop('bread_rack', 0.85, -1.3, 0); if (k.i === k.n - 1) k.prop('wedding_cake', 1.1, 0.6, 0, { y: 1.05 }); }
            else { k.part('box', 0, 0, -1.45, WOOD, '#3a2212', { size: [3.5, 2.2, 0.45] }); for (const y of [0.7, 1.25, 1.8]) for (let i = 0; i < 6; i++) k.part('box', -1.4 + i * 0.56, y, -1.15, PL, ['#ff30c0', '#ffe030', '#30e0ff', '#d8a860'][(i + Math.round(y * 2)) % 4], { size: [0.36, 0.3, 0.3] }); }
            if (k.i === 0) k.part('box', -1.1, 1.05, 0.6, null, '#2a2a2e', { size: [0.4, 0.3, 0.4] }); if (k.i === 0 && k.S.words && k.S.words.C) k.sign(k.S.words.C, k.n > 1 ? 1.75 : 0, 2.3, -1.2, 3.0, 0.5); },
        /* a film camera on its tripod beside a lamp on a stand */
        k: k => { const t = k.turnTo(-1, 0);   /* PASS 2: the Meshy movie camera, a fresnel and the director's chair, all looking at the set (the squares to the left) */
            k.prop('film_camera', 0.1, -0.1, t); k.prop('studio_light', 0.95, -1.1, t + 20); k.prop('directors_chair', 0.95, 0.95, t); },
        /* chapel pews: three benches that look at the altar */
        p: k => { for (const z of [-1.1, 0, 1.1]) { k.part('box', 0, 0.3, z, WOOD, '#8a5a34', { size: [2.9, 0.12, 0.5] }); k.part('box', 0, 0.3, z + 0.28, WOOD, '#8a5a34', { size: [2.9, 0.7, 0.08] }); for (const x of [-1.4, 1.4]) k.part('box', x, 0, z + 0.05, WOOD, '#5b3a22', { size: [0.08, 0.75, 0.6] }); } },
        /* the wedding altar: a flower arch, the lectern, two candle stands on a round rug */
        w: k => { k.part('cyl', 0, 0.02, 0, PL, '#f4c0d0', { r: 1.6, h: 0.03, seg: 20 }); k.prop('wedding_arch', 0, -1.0, 0);   /* PASS 2: the Meshy rose arch (was cylinders), the cake on its little table */
            k.part('cyl', -1.3, 0, -1.25, WOOD, '#f4ece4', { r: 0.32, h: 0.74, seg: 12 }); k.prop('wedding_cake', -1.3, -1.25, 0, { y: 0.75 });
            k.prop('lectern', 0, -0.3, 0); for (const x of [-1.35, 1.35]) { k.part('cyl', x, 0, 0.2, GOLD, null, { r: 0.05, h: 1.1, seg: 6 }); k.part('box', x, 1.1, 0.2, null, '#fff2c0', { size: [0.1, 0.2, 0.1], glow: 1 }); } },
        I: k => { if (k.S.I === 'projector') { k.prop('ticket_booth', 0.4, 0, 0); k.prop('film_projector', -1.3, -0.55, 25); return; } k.prop('ticket_booth', 0, 0, 0); },   /* PASS 2: the cinema shows an old projector beside its booth */
        Q: k => k.prop('popcorn_cart', 0, 0, 0),
        E: k => { k.prop('dorm_bed', -0.85, 0, 0); k.prop('dorm_bed', 0.85, 0, 0); },
        N: k => { for (const x of [-1.2, -0.4, 0.4, 1.2]) k.prop('locker', x, -1.4, 0); k.part('box', 0, 0, 0.3, WOOD, '#8a5a34', { size: [2.8, 0.45, 0.4] }); },
    };
    function inside(b, S, env) {
        const g = S.g, nR = g.length, nC = g[0].length, { loc, cx, cz, fw, fd, row, lx } = env, H = Math.max(2.6, (row.storeys || 2) * 3.5 - 0.35), gy = env.gy || 0, done = new Set();
        const ang = w => ((Math.round(-Math.atan2(w[0], w[1]) / D2R) % 360) + 360) % 360;
        /* PASS 2: the walkway squares something hangs over: every other one (`hangAll`), the one nearest the middle (`hangOne`), else every other one of row `hangRow` (1) */
        const hangAt = new Set(); if (S.hang) { let best = null, bd = 1e9; for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) { if (g[r][c] !== '.') continue;
            if (S.hangAll ? (r + c) % 2 === 1 : !S.hangOne && r === (S.hangRow != null ? S.hangRow : 1) && c % 2 === 0) hangAt.add(r + ',' + c);
            const dd = Math.abs(r - (nR - 1) / 2) + Math.abs(c - (nC - 1) / 2); if (dd < bd) { bd = dd; best = r + ',' + c; } } if (S.hangOne && best) hangAt.add(best); }
        /* a catalogue prop ON THE ROOM'S FLOOR (`floor: true`: never on the ghost block over its square, nor the roof slab: three-renderer.js THE FLOOR UNDER IT);
           `o.y` = its height over the floor (a table top, a stage, a ceiling hang), written as the absolute height (the plot's level + y) */
        const putProp = (key, wx, wz, face, o) => { const q = { key, x: r3(wx), z: r3(wz), face: ((Math.round(face) % 360) + 360) % 360, floor: true }; if (o && o.y != null) q.y = r3(gy + o.y); props.push(q); return q; };
        if (Math.abs(nC * C - fw * 2) > 0.1 || Math.abs(nR * C - fd * 2) > 0.1) { console.error('entertainment: the inside plan of', b.id, 'is', nC + 'x' + nR, 'squares, the shell', (fw * 2 / C) + 'x' + (fd * 2 / C)); return; }
        row.keyIn = S.keyIn; row.floorIn = S.floorIn; const parts = [], at = (c, r) => (r < 0 || r >= nR || c < 0 || c >= nC) ? '#' : g[r][c];
        const dc = Math.floor((lx + fw) / C); if (at(dc, nR - 1) !== '.') console.error('entertainment: the doorway square of', b.id, 'is not a walkway');
        for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) { const ch = g[r][c], u = -fw + (c + 0.5) * C, v = -fd + (r + 0.5) * C, o = loc(u, v);
            if (ch === '.') { if (S.rug) parts.push({ s: 'quad', p: [o[0], 0.02, o[1]], size: [C, C], flat: true, key: PL, tint: T(S.rug, PL) });
                if ((r + c) % 2 === 0) { parts.push({ s: 'box', p: [o[0], r3(H - 0.14), o[1]], size: [1.3, 0.1, 0.5], tint: hex(S.lamp || '#fff0d0'), glow: 1, roof: true }); }
                /* PASS 2: what hangs over the walk (decoration, off the square's centre, well over head height): chandeliers, the mirror ball, lanterns */
                if (hangAt.has(r + ',' + c)) { const hh = HANG[S.hang] || 1; putProp(S.hang, cx + o[0] + 0.35, cz + o[1] - 0.25, 0, { y: Math.max(2.1, H - hh - (S.hang === 'paper_lantern' ? 0.25 : 0.05)) }); }
                continue; }
            if (!KIT[ch]) { console.error('entertainment: no kit for', ch); continue; }
            /* the square looks at its nearest walkway: the front first, then the back, the left, the right (seat rows look where the plan says) */
            let d = [[0, 1], [0, -1], [-1, 0], [1, 0]].find(q => at(c + q[0], r + q[1]) === '.') || [0, 1]; if (ch === 'H' && S.seatFace === 'back') d = [0, -1];
            if ((ch === 'G' && at(c, r + 1) !== '#') || ch === 'F') d = [0, 1]; if (ch === 'p') d = [0, -1];   /* (PASS 2: a stage on the door row, the casino's, looks into the room, not at the front wall) */
            const w = loc(d[0], d[1]), f = ((Math.round(-Math.atan2(w[0], w[1]) / D2R) % 360) + 360) % 360, a = -f * D2R, ca = Math.cos(a), sa = Math.sin(a);
            let i = 0, n = 1; while (at(c - i - 1, r) === ch) i++; while (at(c - i + n, r) === ch) n++;
            const k = { S, r, c, i, n, H, edge: { front: at(c, r + 1) !== ch, back: at(c, r - 1) !== ch },
                part: (s, px, y, pz, key, tint, o2) => { const q = Object.assign({ s, p: [r3(o[0] + px * ca + pz * sa), r3(y), r3(o[1] - px * sa + pz * ca)] }, o2 || {}); q.ry = (((q.ry || 0) + f) % 360 + 360) % 360; if (key) q.key = key; if (tint != null) q.tint = T(tint, key); parts.push(q); return q; },
                prop: (key, px, pz, turn, o3) => putProp(key, cx + o[0] + px * ca + pz * sa, cz + o[1] - px * sa + pz * ca, f + 180 + (turn || 0), o3),   /* (+180: a prop's `face` is a heading, 0 = its front to -z, 180 = to +z — `f` is the square's own frame turn, so without it every prop showed the walk its back; seen on screen 11-14) */
                turnTo: (dc2, dr2) => ((ang(loc(dc2, dr2)) - f) % 360 + 360) % 360, once: tag => !done.has(tag) && !!done.add(tag),
                sign: (words, px, y, pz, sw, sh) => { const q = k.part('quad', px, y, pz, 'txt:' + words + '|#fff2c0||' + (Math.round(sw / sh * 100) / 100), null, { size: [sw, sh], uv: 'fit', kind: 'over', glow: 0.9 }); q.tint = 0xffffff; } };
            KIT[ch](k);
            features.push({ k: 'wall', x0: r3(cx + o[0]), z0: r3(cz + o[1]), x1: r3(cx + o[0]), z1: r3(cz + o[1]), h: BLOCK_H[ch] || 1.2, t: C, key: 'urban:ConcreteStriped2a', ghost: true, rail: false });
        }
        /* PASS 2, THE ROOM'S FINISH: a painted ceiling under the slab (the bare inside sheet reads black up there), a dado round the walls, lit
           sconces along the side walls and the back (decoration: on the walls, over the blockers' heads) */
        const fF = ang(loc(0, 1));
        if (S.ceil) { const o = loc(0, 0); parts.push({ s: 'box', p: [o[0], r3(H - 0.04), o[1]], ry: fF, size: [r3(fw * 2 - 0.6), 0.03, r3(fd * 2 - 0.6)], key: PL, tint: T(S.ceil, PL), glow: 0.3, under: true, roof: true, top: false }); }
        if (S.dado) for (const [u, v, du, dv, L] of [[0, -fd + 0.3, 0, 1, fw * 2 - 0.6], [0, fd - 0.3, 0, -1, fw * 2 - 0.6], [-fw + 0.3, 0, 1, 0, fd * 2 - 0.6], [fw - 0.3, 0, -1, 0, fd * 2 - 0.6]]) {
            const o = loc(u, v), q = { s: 'quad', p: [o[0], 0.02, o[1]], ry: ang(loc(du, dv)), size: [r3(L), 1.05], key: WOOD, tint: T(S.dado, WOOD) }; if (dv < 0) q.hole = [r3(-lx), 1.74, 1.05]; parts.push(q);
            const t = loc(u + du * 0.03, v + dv * 0.03); parts.push({ s: 'box', p: [t[0], 1.05, t[1]], ry: ang(loc(du, dv)), size: [r3(L), 0.06, 0.06], key: WOOD, tint: T(S.dado, WOOD) }); }
        if (S.sconce) { const sc = (u, v, du, dv) => { const o = loc(u, v); parts.push({ s: 'quad', p: [o[0], 2.05, o[1]], ry: ang(loc(du, dv)), size: [0.7, 1.0], tint: hex(S.sconce), glow: 0.35 }); const b2 = loc(u + du * 0.08, v + dv * 0.08); parts.push({ s: 'box', p: [b2[0], 2.35, b2[1]], ry: ang(loc(du, dv)), size: [0.22, 0.3, 0.14], tint: hex(S.sconce), glow: 1 }); };
            for (let r = 0; r < nR; r++) { const v = -fd + (r + 0.5) * C; if (r === nR - 1 && nR > 1) continue; sc(-fw + 0.32, v, 1, 0); sc(fw - 0.32, v, -1, 0); }
            for (let c = 1; c < nC; c += 2) sc(-fw + c * C, -fd + 0.32, 0, 1); }
        /* the lit EXIT over the doorway, inside; the cinema's screen on the back wall */
        { const o = loc(lx, fd - 0.3), w = loc(0, -1), f = ((Math.round(-Math.atan2(w[0], w[1]) / D2R) % 360) + 360) % 360; parts.push({ s: 'quad', p: [o[0], 2.3, o[1]], ry: f, size: [0.9, 0.3], key: 'txt:EXIT|#ffffff|#1a8a3a|3', uv: 'fit', tint: 0xffffff, glow: 0.9 }); }
        if (S.screen) { const o = loc(0, -fd + 0.3), w = loc(0, 1), f = ((Math.round(-Math.atan2(w[0], w[1]) / D2R) % 360) + 360) % 360; parts.push({ s: 'quad', p: [o[0], 1.6, o[1]], ry: f, size: [r3(fw * 2 - 3), r3(Math.min(6, H - 2.4))], tint: 0xe8f4ff, glow: 0.9 }); parts.push({ s: 'quad', p: [loc(0, -fd + 0.28)[0], 1.4, loc(0, -fd + 0.28)[1]], ry: f, size: [r3(fw * 2 - 2.6), r3(Math.min(6, H - 2.4) + 0.4)], tint: 0x101014 }); }
        rows.push({ k: 'arch', id: 'dc:' + b.id + ':in', x: cx, z: cz, rot: 0, parts });
    }
    /* ═══ P08-04 CASINO: the Strip's casino. Dark marble, brass bands, a domed corner tower, a red drive-up canopy ═══ */
    B('P08-04-B1', { walk: true, st: 2 }, b => {
        b.walls(9.6, MB, '#4a3560'); b.trim(9.6, 0.6, GOLD, null); b.top(9.9, RF, '#6a6670', 0.2);
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
    B('P10-04-B1', { walk: true }, b => {
        b.walls(7, MB3, '#e9e4da'); b.trim(7, 0.5, CS, '#cfc8b8', 0.2, { top: false });
        b.cyl(0, 1.5, 8.6, 7, 6, ST, '#efe8d8', { seg: 28, cap: false }); b.cyl(0, 1.5, 8.85, 12.6, 0.7, GOLD, null, { seg: 28 }); b.dome(0, 1.5, 8.6, 13.3, 4.4, CO, '#3f9c86', { seg: 28, rings: 7, roof: true });
        b.cyl(0, 1.5, 0.6, 17.6, 3.5, GOLD, null, { r2: 0, seg: 8 });
        b.box(0, b.hd - 2.2, 9, 3.2, 7, 9, BR3, '#5a5560');                                                    // the fly tower over the stage (south)
        for (let i = 0; i <= 8; i++) { const a = (180 + i * 22.5) * D2R, x = Math.cos(a) * 5.2, z = -b.hd + Math.sin(a) * 5.2; if (Math.abs(x - b.door[0]) > 1.3) { b.cyl(x, z, 0.32, 0, 4.3, MB3, '#f4efe4', { seg: 10 }); b.cyl(x, z, 0.45, 0, 0.4, MB3, '#bdb6a8', { seg: 10 }); } }   /* the lobby's open colonnade (it was a glass drum: the doorway is behind it now) */ b.cyl(0, -b.hd, 5.7, 4.3, 0.9, PL, '#b01828', { arc: 180, a0: 180, glow: 0.35, seg: 24 });   // the glass lobby drum + its red fascia
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
        b.walls(10.7, BR1, '#b06a48'); b.top(10.62, RFC, '#8a8078', 0.1);
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
    B('P11-05-B1', { walk: true }, b => {
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
        b.walls(6.3, SUB, '#1c1a2a'); b.top(6.3, RF, '#4a4858', 0.1);
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
        b.walls(3.7, PL, '#c02848'); b.top(3.7, RF, '#7a4050', 0.1); b.trim(3.3, 0.4, GOLD, null, 0.1, { top: false });
        b.face('e', -b.hd + 1.2, b.hd - 1.2, 1.0, 1.5, GS, '#fff0c0', GLOW); b.face('s', -b.hw + 1.2, b.hw - 1.2, 1.0, 1.5, GS, '#fff0c0', GLOW);
        b.cyl(0, 0, 3.6, 3.7, 2.2, PL, '#c02848', { seg: 8 }); b.cyl(0, 0, 3.65, 4.2, 1.2, GS, '#fff0c0', { seg: 8, glow: 0.55, cap: false }); b.cyl(0, 0, 4.4, 5.9, 2.6, CO, '#f0c020', { r2: 0, seg: 8, roof: true });
        b.cyl(0, 0, 0.3, 8.5, 1.2, GOLD, null, { r2: 0.05, seg: 6 });
    });
    /* ═══ P11-07 CINEMA: a cream deco front, a stepped top, the teal fin, the marquee round the corner ═══ */
    B('P11-07-B1', { walk: true, st: 3 }, b => {
        b.walls(10.7, ST, '#f0e2c4'); b.top(10.62, RFC, '#9a9488', 0.1);
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
    const parts_txt = (P, x, y, z, ry, w, h, words, fg) => { const q = P('quad', x, y, z, 'txt:' + words + '|' + fg + '||' + (Math.round(w / h * 100) / 100), null, { size: [w, h], ry, uv: 'fit', kind: 'over' }); q.tint = 0xffffff; return q; };
    const free = (id, x, z, fn) => { const parts = []; const P = (s, px, y, pz, key, tint, o2) => { const q = Object.assign({ s, p: [r3(px), r3(y), r3(pz)] }, o2 || {}); if (key) q.key = key; if (tint != null) q.tint = T(tint, key); parts.push(q); return q; }; fn(P); rows.push({ k: 'arch', id: 'dc:E-' + id + ':arch', x: r3(x), z: r3(z), rot: 0, parts }); };
    /* the VHS shop (the pack's whole building, real size 14.9 x 13.6 m, its entrance at +Z): on the yard south-west of the Costume shops, its
       entrance to the walk on its east (a prop's face turns it clockwise like a building's rot: 270 = the front to the east) */
    { const p = plot(9, 4), x = p.x(3), z = p.z(9.2); clearProps(x - 7, z - 7.6, x + 7, z + 7.6); props.push({ key: 'city_vhs_shop', x, z, face: 270 }); }
    /* THE STRIP'S WEDDING CHAPEL (the Strip's own landmark, carried over): white, a pink roof, a little steeple over its door, on the yard west of
       the Cinema. A walk-in shell of this file's own (the plan holds no chapel): squares 1..3 x 1..2 of plot P11-07, its front to the south walk. */
    { const p = plot(11, 7), x = p.x(2.5), z = p.z(2); clearProps(x - 5.4, z - 3.6, x + 5.4, z + 3.6);
      EXTRA['E-chapel'] = { id: 'E-chapel', name: 'Wedding chapel', plot: 'P11-07', cx0: 11 * 12 + 1, cy0: 7 * 12 + 1, cw: 3, ch: 2, side: 'S' };
      features.push({ k: 'texbuilding', id: 'dc:E-chapel', seed: 77, x, z, w: 10.5, d: 7, rot: 0, storeys: 1 });
      B('E-chapel', { walk: true, st: 1, leaf: 'leaf_motel' }, b => {
        b.walls(3.6, ST, '#fbf6ee'); b.plinth(0.5, MB3, '#e0c8d0'); b.roof('gable', 0, 0, b.hw * 2, b.hd * 2, 3.6, 2.6, CO, '#e88aa8', { ridge: 'x', over: 0.4, keyEnd: ST, tintEnd: T('#fbf6ee', ST) });
        b.box(b.door[0], b.hd - 1.2, 2.4, 2.4, 4.6, 3.4, ST, '#fbf6ee'); b.roof('pyramid', b.door[0], b.hd - 1.2, 2.4, 2.4, 8.0, 3.2, CO, '#e88aa8', { over: 0.25 }); b.cyl(b.door[0], b.hd - 1.2, 0.18, 11.1, 1.4, GOLD, null, { r2: 0, seg: 6 });
        for (const sg of [-1, 1]) { const u = b.door[0] + sg * 3.1; b.face('s', u - 1.3, u + 1.3, 0.7, 1.9, GS, '#ffd0e0', { glow: 0.55 }); b.frames('s', u - 1.3, u + 1.3, 0.7, 1.9, 2, '#e88aa8'); }
        b.face('s', b.door[0] - 2.6, b.door[0] + 2.6, 2.75, 0.62, null, '#ff80b0', { glow: 1 }); b.txt('s', b.door[0] - 2.5, b.door[0] + 2.5, 2.78, 0.56, 'WEDDING CHAPEL', '#7a1038', 0.11);
        b.lamp('s', b.door[0] - 1.3, 2.0, '#ffd0e0'); b.lamp('s', b.door[0] + 1.3, 2.0, '#ffd0e0'); b.pipe('n', b.hw - 0.4, 3.6, '#e0c8d0'); b.wac('n', -2, 2.2); b.gutter('n', 3.6, 0.4, '#e0c8d0'); b.gutter('s', 3.6, 0.4, '#e0c8d0');
      }); }
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
      for (const sg of [1, -1]) parts.push({ s: 'quad', p: [0, 3.02, sg * 3.27], ry: sg > 0 ? 0 : 180, size: [3.2, 0.36], key: 'txt:TAXI|#f0c020||8.89', uv: 'fit', tint: 0xffffff, kind: 'over', glow: 0.8 });
      rows.push({ k: 'arch', id: 'dc:E-taxi-canopy:arch', x: cx, z: cz, rot: 0, parts });
      const q2 = [], Q = (s, y, key, tint, o2) => { const q = Object.assign({ s, p: [0, y, 0] }, o2); if (key) q.key = key; q.tint = T(tint, key); q2.push(q); };
      Q('cyl', 0, PL, '#f0c020', { r: 2.2, h: 3.2, seg: 12 }); Q('cyl', 1.1, GS, '#cfe8ff', { r: 2.25, h: 1.3, seg: 12, glow: 0.5, cap: false }); Q('cyl', 3.2, CO, '#222222', { r: 2.8, r2: 0, h: 1.6, seg: 12, roof: true });
      rows.push({ k: 'arch', id: 'dc:E-taxi-booth:arch', x: bx, z: bz, rot: 0, parts: q2 });
      features.push({ k: 'wall', x0: bx, z0: bz, x1: bx, z1: bz, h: 3.2, t: 3.6, key: 'urban:ConcreteStriped2a', ghost: true, rail: false }); }
    features.push(...rows);
    return { arch: rows.length };
} };
