/* docs/disaster-city/districts/R.js (2026-11-13) — DISASTER CITY, SOUTHSIDE: the district's buildings, each its own architecture.
   mondo: "architect the buildings in their respective districts plots ... Every building should be unique and purposeful and
   recognizable ... overhangs ... different roofs ... domes, roof tops, modern architecture, curves ... its also okay to make the
   more reptitive buildings look similar like apartments". His OK on the plan + mock-up: 11-13 17:14 ("pizza yes, ok").

   Repo-only tooling, loaded by bake-disaster-city.js (THE DISTRICT FILES: `apply` before the street furniture, `build` last). It REDRAWS the rows the tool already wrote for Southside's plots and never touches another district's:
     · a building's LOOK is one `k: 'arch'` row (three-renderer.js _hqArchGeometry: parts, each its own sheet + tint);
     · its COLLISION stays the tool's own row with its faces off: a `texbuilding` with `skin: false` (the walk-in ones `hollow`,
       so the city's swing door hangs in the doorway), a roof-route `plateau` with `bld.skin: false` (its 7 m roof still walked);
     · the whole pack buildings (city_house, city_laundry, city_quequis_house, city_pizzeria) are catalogue props at REAL size;
     · the corner shop block is a Buildings-pack block at its own width (its door is taller than the player).
   Every part is written in the building's own frame: x along the front, +z out of the front, metres. Notes:
   docs/notes/areas-complexes.md "DISASTER CITY, SOUTHSIDE". */
'use strict';
/* before the street furniture: the laundromat's yard on the Canal walk is a building now (no lamp, no bench on it) */
function apply(ctx) { for (let y = 1; y <= 4; y++) for (let x = 7; x <= 10; x++) ctx.setCell(0 * ctx.N + x, 3 * ctx.N + y, 'I'); }
function build(ctx) {
    const { features, props, lateRows, bInfo, r3, ROOF_H } = ctx, lamps = ctx.lamps, PL = ctx.N * ctx.C;
    const rowOf = id => features.find(f => f.id === 'dc:' + id), infoOf = id => bInfo.find(b => b.id === id);
    const ROT = { S: 0, W: 90, N: 180, E: 270 };
    const out = [], claims = [], mine = new Set(), made = { arch: 0, props: 0, walkin: 0, cleared: 0 };

    /* ── the sheets (MODEL_LIST: the urban pack + the terrain sheets), tinted per building ── */
    const K = { plaster: 'urban:PlasterWallPainted1a', stucco: 'urban:PlasterWallStucco1a', rib: 'urban:ConcreteStriped2a', board: 'urban:ConcreteStriped1a',
        brick: 'bricks_1', brick2: 'bricks_2', stone: 'castle_wall', wood: 'wood_planks', metal: 'urban:MetalCorrugatedPainted1a', tile: 'urban:TileGeneric1a', conc: 'urban:ConcreteUnderTiles1',
        winR: 'urban:GlassWindowResidential1a', winT: 'urban:GlassWindowTall1a', winS: 'urban:GlassWindowSquare1a', winF: 'urban:GlassWindowFactory1a',
        doorW: 'urban:DoorWoodenHalf1a', doorS: 'urban:DoorStorefrontHalf1a', doorP: 'urban:DoorPaintedHalf2a' };

    /* ── a frame: a centre, a turn (as a texbuilding: the front is +z), a front width and a depth ── */
    const frame = (x, z, rot, W, D) => {
        const q = -rot * Math.PI / 180, rc = Math.cos(q), rs = Math.sin(q);
        const fr = { x: r3(x), z: r3(z), rot, W, D, hw: W / 2, hd: D / 2 };
        fr.at = (lx, lz) => [r3(x + lx * rc + lz * rs), r3(z - lx * rs + lz * rc)];
        fr.sub = (lx, lz, W2, D2) => { const c = fr.at(lx, lz); return frame(c[0], c[1], rot, W2, D2); };
        fr.face = (180 + rot) % 360;   // a +Z-front prop standing the same way
        /* the frame's box in the room (axis-aligned: every city building stands square) */
        fr.rect = (lx, lz, w, d, pad) => { const a = fr.at(lx - w / 2, lz - d / 2), b = fr.at(lx + w / 2, lz + d / 2), p = pad || 0; return { x0: Math.min(a[0], b[0]) - p, x1: Math.max(a[0], b[0]) + p, z0: Math.min(a[1], b[1]) - p, z1: Math.max(a[1], b[1]) + p }; };
        return fr;
    };
    /* the frame of a row the tool wrote (a texbuilding's own w / d / rot; a plateau's from its plan door side) */
    const frameOf = id => {
        const row = rowOf(id), info = infoOf(id); if (!row) throw new Error('southside: no row ' + id);
        if (row.k === 'texbuilding') return frame(row.x, row.z, row.rot || 0, row.w, row.d);
        const rot = ROT[info.side] || 0, ew = rot === 90 || rot === 270;
        return frame(row.x, row.z, rot, ew ? row.d : row.w, ew ? row.w : row.d);
    };
    const GLASS = [K.winR, K.winT, K.winS, K.winF], DOORS = [K.doorW, K.doorS, K.doorP], TRIM = 0xe6dfd0;   // THE POLISH PASS: what counts as a window / a door, the stone trim's tint
    const num = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
    const tidy = o => { const q = {}; Object.keys(o).forEach(k => { const v = o[k]; if (v === undefined || v === null) return; q[k] = Array.isArray(v) ? v.map(e => Array.isArray(e) ? e.map(num) : num(e)) : num(v); }); return q; };

    /* ── THE ARCHITECT: a parts list in a frame ── */
    const arch = (fr, id) => {
        const P = [], a = { fr, P }, bands = new Set();
        const add = (o) => { P.push(tidy(o)); return a; };
        a.box = (x, y, z, w, h, d, key, tint, o) => add(Object.assign({ s: 'box', p: [x, y, z], size: [w, h, d], key, tint }, o));
        /* THE POLISH PASS, THE ROOFS (mondo 11-13 20:18: "roofs and ac units"): a pitched roof of a real size gets a ridge cap and two cowled vents
           on its slope; a barrel roof a row of ridge ventilators (`bare: true` = none) */
        a.roof = (form, x, y, z, w, h, d, key, tint, o) => {
            add(Object.assign({ s: 'roof', form, p: [x, y, z], size: [w, h, d], key, tint, roof: true }, o, { bare: undefined }));
            if ((o && o.bare) || w < 6 || d < 4.5 || h < 1) return a;
            const ry = (o && o.ry) || 0, q = -ry * Math.PI / 180, c = Math.cos(q), sn = Math.sin(q), at = (dx, dz) => [x + dx * c + dz * sn, z - dx * sn + dz * c], DK = 0x4c4f54;
            if (form === 'gable') {
                add({ s: 'box', p: [x, y + h - 0.06, z], size: [w + 0.1, 0.16, 0.34], ry, key: K.metal, tint: DK });
                [[-w * 0.24, d * 0.22], [w * 0.2, -d * 0.24]].forEach(v => { const t = at(v[0], v[1]), yy = y + h * (1 - Math.abs(v[1]) / (d / 2)); add({ s: 'cyl', p: [t[0], yy - 0.15, t[1]], r: 0.16, h: 0.75, tint: DK, seg: 8 }); add({ s: 'cyl', p: [t[0], yy + 0.6, t[1]], r: 0.3, h: 0.14, tint: DK, seg: 8 }); });
            } else if (form === 'hip' || form === 'pyramid') {
                const t = at(w * 0.12, d * 0.2), yy = y + h * 0.6; add({ s: 'cyl', p: [t[0], yy - 0.3, t[1]], r: 0.16, h: 0.9, tint: DK, seg: 8 }); add({ s: 'cyl', p: [t[0], yy + 0.6, t[1]], r: 0.3, h: 0.14, tint: DK, seg: 8 });
            } else if (form === 'barrel') {
                const nn = Math.max(2, Math.floor(w / 5)), st = w / nn, t0 = at(-w / 2 + st / 2, 0), t1 = at(-w / 2 + st * 1.5, 0);
                add({ s: 'box', p: [t0[0], y + h - 0.08, t0[1]], size: [0.9, 0.5, 0.9], ry, key: K.metal, tint: 0xb8bcc0, n: nn, step: [t1[0] - t0[0], 0, t1[1] - t0[1]] });
            }
            return a;
        };
        a.cyl = (x, y, z, r, h, key, tint, o) => add(Object.assign({ s: 'cyl', p: [x, y, z], r, h, key, tint }, o));
        a.dome = (x, y, z, r, h, key, tint, o) => add(Object.assign({ s: 'dome', p: [x, y, z], r, h, key, tint, roof: true }, o));
        a.quad = (x, y, z, w, h, ry, key, tint, o) => add(Object.assign({ s: 'quad', p: [x, y, z], size: [w, h], ry, key, tint }, o));
        /* a spot on a face of the box (cx, cz, w, d): `along` the face, `off` out of it */
        const spot = (f, cx, cz, w, d, along, off) => f === 'f' ? { p: [cx + along, cz + d / 2 + off], ry: 0, st: [1, 0] } : f === 'b' ? { p: [cx + along, cz - d / 2 - off], ry: 180, st: [1, 0] }
            : f === 'l' ? { p: [cx - w / 2 - off, cz + along], ry: 90, st: [0, 1] } : { p: [cx + w / 2 + off, cz + along], ry: 270, st: [0, 1] };
        /* n panels evenly along the faces `fs` of the box (cx, cz, w, d) at height y: windows, shutters, doors */
        a.wins = (fs, cx, cz, w, d, y, o) => {
            o = o || {};
            fs.split('').forEach(f => {
                const L = (f === 'f' || f === 'b') ? w : d, n = o.n || Math.max(1, Math.floor(L / (o.pitch || 2.9))), pitch = (L - 2 * (o.margin || 0)) / n, s = spot(f, cx, cz, w, d, -(L - 2 * (o.margin || 0)) / 2 + pitch / 2, o.off || 0.06);
                add({ s: 'quad', p: [s.p[0], y, s.p[1]], size: [o.ww || 1.7, o.wh || 1.8], ry: s.ry, key: o.key === undefined ? K.winR : o.key, tint: o.tint, glow: o.glow, uv: o.uv || 'fit', kind: o.kind, n, step: [s.st[0] * pitch, 0, s.st[1] * pitch] });
                /* THE POLISH PASS (mondo 11-13 20:15: "one or two more layers deep with the detail"): a glazed opening gets a stone sill and a lintel
                   proud of the wall; an upper window on a back or side wall now and then carries a wall unit */
                const key = o.key === undefined ? K.winR : o.key, ww = o.ww || 1.7, wh = o.wh || 1.8, st = [s.st[0] * pitch, 0, s.st[1] * pitch], along0 = -(L - 2 * (o.margin || 0)) / 2 + pitch / 2;
                if (GLASS.indexOf(key) >= 0 && o.trim !== false) {
                    const s1 = spot(f, cx, cz, w, d, along0, 0.12), s2 = spot(f, cx, cz, w, d, along0, 0.07), tr = typeof o.trim === 'number' ? o.trim : TRIM;
                    add({ s: 'box', p: [s1.p[0], y - 0.1, s1.p[1]], size: [ww + 0.3, 0.1, 0.24], ry: s.ry, key: K.plaster, tint: tr, n, step: st });
                    add({ s: 'box', p: [s2.p[0], y + wh, s2.p[1]], size: [ww + 0.24, 0.17, 0.14], ry: s.ry, key: K.plaster, tint: tr, n, step: st });
                    if (key === K.winR && y > 3 && (f === 'b' || f === 'l') && n >= 3) {
                        const s3 = spot(f, cx, cz, w, d, along0 + pitch, 0.24);
                        add({ s: 'box', p: [s3.p[0], y - 0.02, s3.p[1]], size: [0.78, 0.44, 0.46], ry: s.ry, key: K.metal, tint: 0xc4c8cc, n: Math.ceil((n - 1) / 3), step: [st[0] * 3, 0, st[2] * 3] });
                    }
                }
            });
            return a;
        };
        /* floors of windows */
        /* THE BIG WINDOWS (mondo 11-13 18:49: "the windows are too small ... the bottom row of these buildings should be different/not windows"):
           a window is 1.7 x 1.8 m, and the ground row is half as many wide shop panes, not the upper floors' windows (`ground: 'same'` keeps it) */
        a.floors = (fs, cx, cz, w, d, n, o) => {
            o = o || {};
            for (let k = 0; k < n; k++) {
                if (k === 0 && o.ground !== 'same') { a.wins(fs, cx, cz, w, d, 0.45, Object.assign({}, o, { key: o.gkey || K.winS, ww: o.gww || 2.4, wh: 2.1, n: o.n ? Math.max(1, Math.round(o.n / 2)) : undefined, pitch: (o.pitch || 2.9) * 2 })); continue; }
                const yk = (o.y0 == null ? 1.0 : o.y0) + k * (o.per || 3.2), bk = [cx, cz, w, d, yk].join();
                if (o.band !== false && !bands.has(bk)) { bands.add(bk); a.box(cx, yk - 0.5, cz, w + 0.22, 0.18, d + 0.22, K.plaster, typeof o.trim === 'number' ? o.trim : TRIM, { top: false }); }   // a string course under each upper floor's sills
                a.wins(fs, cx, cz, w, d, yk, o);
            }
            return a;
        };
        /* one panel on a face: a sign (plain colour, lit), a door sheet, a shutter */
        a.panel = (f, cx, cz, w, d, along, y, pw, ph, key, tint, o) => {
            if (DOORS.indexOf(key) >= 0 && y < 0.3 && !(o && o.plain)) {   // THE POLISH PASS: a door stands on a stone step under a hood
                const s1 = spot(f, cx, cz, w, d, along, 0.42), s2 = spot(f, cx, cz, w, d, along, 0.34);
                add({ s: 'box', p: [s1.p[0], 0, s1.p[1]], size: [pw + 0.6, 0.16, 0.8], ry: s1.ry, key: K.conc, tint: 0xcfcac0 });
                add({ s: 'box', p: [s2.p[0], y + ph + 0.14, s2.p[1]], size: [pw + 0.5, 0.12, 0.64], ry: s2.ry, key: K.plaster, tint: TRIM, under: true });
            }
            const s = spot(f, cx, cz, w, d, along, (o && o.off) || 0.07); return add(Object.assign({ s: 'quad', p: [s.p[0], y, s.p[1]], size: [pw, ph], ry: s.ry, key, tint, uv: key ? 'fit' : undefined }, o, { off: undefined }));
        };
        /* a canvas awning off a face: the high edge on the wall */
        a.awning = (f, cx, cz, w, d, along, y, len, deep, tint, o) => { const s = spot(f, cx, cz, w, d, along, deep / 2); return add(Object.assign({ s: 'roof', form: 'shed', p: [s.p[0], y, s.p[1]], size: [len, 0.75, deep], ry: s.ry, key: K.plaster, tint, ds: true, under: true }, o)); };
        /* a parapet round a flat roof */
        a.parapet = (cx, y, cz, w, d, h, key, tint) => { const t = 0.3; a.box(cx, y, cz + d / 2 - t / 2, w, h, t, key, tint); a.box(cx, y, cz - d / 2 + t / 2, w, h, t, key, tint); a.box(cx - w / 2 + t / 2, y, cz, t, h, d - 2 * t, key, tint); return a.box(cx + w / 2 - t / 2, y, cz, t, h, d - 2 * t, key, tint); };
        /* the four walls of a walk-in building, the doorway cut where the texbuilding cuts it (data.js hqTexbDoor) */
        a.shell = (w, h, d, key, tint, door) => {
            a.box(0, 0, 0, w + 0.1, h, d + 0.1, key, tint, { faces: 'blr', top: false });
            return add({ s: 'quad', p: [0, 0, d / 2 + 0.05], size: [w + 0.1, h], key, tint, hole: door ? [door.lx, door.cw, 2.2] : undefined });
        };
        /* THE POLISH PASS, the dressing every building gets from its main block (the first part, a box on the ground): a base course in dark
           stone, two downpipes with their hoppers, and on a flat tiled roof a pair of vents and a roof unit */
        const dress = () => {
            const m = P[0]; if (!m || m.s !== 'box' || (m.p && m.p[1]) || !(m.size[1] >= 3) || m.ry) return;
            const x = m.p[0], z = m.p[2], w = m.size[0], d = m.size[2], fc = m.faces || 'fblr'; let h = m.size[1];
            add({ s: 'box', p: [x, 0, z], size: [w + 0.03, 0.4, d + 0.03], key: K.conc, tint: 0x7c7872, faces: fc, top: false });
            [[-1, 1, 'f', 'l'], [1, -1, 'b', 'r']].forEach(c => {
                if (fc.indexOf(c[2]) < 0 && fc.indexOf(c[3]) < 0) return;
                const px = x + c[0] * (w / 2 + 0.11), pz = z + c[1] * (d / 2 - 0.5);
                add({ s: 'cyl', p: [px, 0, pz], r: 0.07, h: h - 0.3, tint: 0x3a3e42, seg: 6, cap: false });
                add({ s: 'box', p: [px, h - 0.3, pz], size: [0.26, 0.26, 0.26], tint: 0x3a3e42 });
            });
            /* a flat roof nobody walks (the block draws its own top, nothing roofs it): two AC units with their fans, a pair of vents, a hatch */
            const roofed = P.some(q => (q.s === 'roof' || q.s === 'dome') && q.p[1] >= h - 0.6 && Math.abs(q.p[0] - x) < w / 2 && Math.abs(q.p[2] - z) < d / 2);
            if (m.top !== false && !roofed && w > 6 && d > 6) {
                const cap = P.find(q => q !== m && q.s === 'box' && Math.abs(q.p[1] - h) < 0.1 && q.size[0] >= w * 0.9 && q.size[2] >= d * 0.9 && q.top !== false);   // a cornice slab lying on the block
                const AC = 0xc8ccd0, DK = 0x4a4e52, ux = x + w * 0.2, uz = z + d * 0.16, big = w * d > 250; h += cap ? cap.size[1] : 0;
                add({ s: 'box', p: [ux, h + 0.12, uz], size: [1.7, 0.85, 1.15], key: K.metal, tint: AC, n: big ? 2 : 1, step: [0, 0, -2.0] });
                add({ s: 'box', p: [ux, h, uz], size: [1.9, 0.12, 1.3], tint: DK, n: big ? 2 : 1, step: [0, 0, -2.0] });
                add({ s: 'cyl', p: [ux, h + 0.97, uz], r: 0.42, h: 0.1, tint: DK, seg: 10, n: big ? 2 : 1, step: [0, 0, -2.0] });
                add({ s: 'box', p: [x - w * 0.24, h, z - d * 0.2], size: [0.7, 0.9, 0.7], key: K.metal, tint: 0xb4b8bc, n: 2, step: [1.7, 0, 0] });
                add({ s: 'box', p: [x - w * 0.24, h + 0.9, z - d * 0.2], size: [0.95, 0.1, 0.95], tint: DK, n: 2, step: [1.7, 0, 0] });
                add({ s: 'box', p: [x - w * 0.2, h, z + d * 0.26], size: [1.1, 0.35, 1.1], key: K.metal, tint: 0x8c9094 });
            }
        };
        a.done = () => { dress(); out.push({ k: 'arch', id: 'dc:' + id + '-arch', x: fr.x, z: fr.z, y: 0, rot: fr.rot, parts: P }); made.arch++; return a; };
        return a;
    };
    /* the doorway of a hollow texbuilding row, as data.js hqTexbDoor reads it */
    const doorOf = (row) => { const L = Math.max(2, row.w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (row.door >= 1) col = Math.min(cols - 1, Math.round(row.door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; };

    /* ── the collision rows ── */
    /* the tool's row keeps the footprint, draws nothing: h = the eaves; a walk-in one is hollow with a swing leaf */
    const solid = (id, fr, h, o) => {
        const row = rowOf(id); o = o || {};
        Object.keys(row).forEach(k => { if (['k', 'id', 'seed'].indexOf(k) < 0) delete row[k]; });
        Object.assign(row, { x: fr.x, z: fr.z, w: r3(fr.W), d: r3(fr.D), rot: fr.rot, storeys: Math.max(1, Math.round(h / 3.5)), h: r3(h), skin: false });
        if (o.walkin) { Object.assign(row, { hollow: true, leaf: o.leaf || 'leaf_shabby_wood', keyIn: o.keyIn || K.stucco, floorIn: o.floorIn || 'wood_planks' }); if (o.leafDouble) row.leafDouble = true; if (o.door) row.door = o.door; made.walkin++; }
        mine.add(row); return row;
    };
    const roofWalk = (id) => { const row = rowOf(id); row.bld = Object.assign({}, row.bld, { skin: false }); mine.add(row); return row; };
    const drop = (id) => { const i = features.findIndex(f => f.id === 'dc:' + id); if (i >= 0) features.splice(i, 1); };
    /* an invisible block (a tower, a kiosk, a stall: something outside a texbuilding that must stop a unit) */
    const ghost = (fr, lx, lz, w, d, h) => { const a = fr.at(lx - w / 2, lz), b = fr.at(lx + w / 2, lz); const g = { k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], h: r3(h), t: r3(d), key: K.conc, ghost: true, rail: false }; out.push(g); return g; };
    const prop = (key, x, z, face, o) => { const p = Object.assign({ key, x: r3(x), z: r3(z) }, face != null ? { face } : {}, o); props.push(p); mine.add(p); made.props++; return p; };
    const propAt = (fr, key, lx, lz, face, o) => { const c = fr.at(lx, lz); return prop(key, c[0], c[1], face == null ? fr.face : face, o); };
    const claim = (rect) => claims.push(rect);
    /* a plot's own frame: front south, x east, z south, origin the plot's middle (for the things that stand in a yard) */
    const plotFrame = (px, py) => frame(-ctx.HALF + (px + 0.5) * PL, -ctx.HALF + (py + 0.5) * PL, 0, PL, PL);
    /* THE LEVELS (docs/disaster-city/levels.js): a plot's ground height in metres. The tool lifts every arch row onto its building's base by
       itself; a row it does not lift (the pack block's texbuilding, the canal's water) asks here. */
    const plotY = (px, py) => (ctx.LEVELS ? ctx.LEVELS.grid[py][px] * ctx.LEVELS.M : 0);
    const sq = n => (n - 6) * 3.5;   // a plot-local square LINE (0..12) in the plot frame

    /* ════════ P00-00 THE CHURCH (landmark): stone nave, slate gable, aisles + buttresses, apse under a half dome, bell tower ════════ */
    (() => {
        const old = rowOf('P00-00-B1'), lot = frame(old.x, old.z, 270, 24.5, 28);       // the plan's east door is the front now (the nave runs back from it)
        const fr = lot.sub(3, 2, 18.5, 20), row = solid('P00-00-B1', fr, 6.5, { walkin: true, leaf: 'leaf_shabby_wood', leafDouble: true, keyIn: K.stucco, floorIn: 'wood_planks' });
        const a = arch(fr, 'P00-00-B1'), ST = 0xe6dcc4, SL = 0x6f7f96, CU = 0x6fb09c, dr = doorOf(row);
        a.shell(18.5, 6.5, 20, K.stone, ST, dr);
        a.roof('shed', -7.65, 6.5, 0, 20, 1.8, 3.2, K.rib, SL, { ry: 90, keyEnd: K.stone, tintEnd: ST, over: 0.3 });   // the aisles' roofs
        a.roof('shed', 7.65, 6.5, 0, 20, 1.8, 3.2, K.rib, SL, { ry: 270, keyEnd: K.stone, tintEnd: ST, over: 0.3 });
        a.box(0, 6.5, 0, 12.1, 4.2, 20, K.stone, ST, { top: false });                                                  // the clerestory
        a.roof('gable', 0, 10.7, 0, 20, 6.6, 12.1, K.rib, SL, { ry: 90, keyEnd: K.stone, tintEnd: ST, over: 0.5 });   // the nave's roof
        a.wins('lr', 0, 0, 12.1, 20, 7.6, { n: 5, ww: 1.1, wh: 2.2, key: K.winT, tint: 0xc9a8ff, glow: 0.35 });
        a.wins('lr', 0, 0, 18.5, 20, 1.3, { n: 5, ww: 1.1, wh: 3.4, key: K.winT, tint: 0xc9a8ff, glow: 0.25, off: 0.12 });
        a.box(-9.75, 0, -8, 0.9, 6.2, 0.8, K.stone, 0xcfc4aa, { n: 5, step: [0, 0, 4] });                              // the buttresses
        a.box(9.75, 0, -8, 0.9, 6.2, 0.8, K.stone, 0xcfc4aa, { n: 5, step: [0, 0, 4] });
        a.quad(0, 7.4, 10.08, 3.2, 3.2, 0, K.winS, 0xff9ad0, { glow: 0.5, uv: 'fit' });                                // the rose window
        a.cyl(0, 0, -10, 6, 7, K.stone, ST, { arc: 180, a0: 180, cap: false, seg: 20 });                               // the apse
        a.dome(0, 7, -10, 6.2, 4.2, K.plaster, CU, { arc: 180, a0: 180, ds: true, seg: 20 });
        a.wins('b', 0, -13, 6, 6, 1.6, { n: 1, ww: 1.2, wh: 3.4, key: K.winT, tint: 0xc9a8ff, glow: 0.25, off: 3.05 });
        a.box(-12.25, 0, 7, 6, 19, 6, K.stone, ST);                                                                    // the bell tower
        a.box(-12.25, 19, 7, 6.8, 0.6, 6.8, K.stone, 0xf2ead8, { under: true });
        a.wins('fblr', -12.25, 7, 6, 6, 13.6, { n: 1, ww: 2.2, wh: 3.8, key: null, tint: 0x15171c });                  // the belfry's openings
        a.roof('pyramid', -12.25, 19.6, 7, 6.8, 9.5, 6.8, K.plaster, CU);
        a.box(-12.25, 28.9, 7, 0.14, 2.2, 0.14, null, 0xd8c9a0); a.box(-12.25, 30.1, 7, 1.2, 0.14, 0.14, null, 0xd8c9a0);   // the cross
        a.box(dr.lx, 0, 11.4, 5, 0.3, 2.6, K.stone, 0xcfc4aa);                                                          // the step
        a.done();
        ghost(fr, -12.25, 7, 6, 6, 19); ghost(fr, 0, -11.5, 12, 3.5, 7);
    })();

    /* ════════ P01-00 TOWNHOUSE COURT ════════ */
    (() => {   // B1 the townhouses (roof walk): three brick houses, bays, stoops, a cornice
        const fr = frameOf('P01-00-B1'); roofWalk('P01-00-B1');
        const a = arch(fr, 'P01-00-B1'), W = fr.W, D = fr.D, bw = W / 3, tints = [0xd98a70, 0xf0a878, 0xb88474];
        for (let i = 0; i < 3; i++) {
            const cx = -W / 2 + bw * (i + 0.5);
            a.box(cx, 0, 0, bw, ROOF_H, D + 0.1, K.brick, tints[i], { top: false, faces: i === 0 ? 'fbl' : i === 2 ? 'fbr' : 'fb' });
            a.box(cx - bw * 0.14, 0, D / 2 + 0.5, bw * 0.5, ROOF_H - 0.5, 1.0, K.brick, tints[i]);                      // the bay
            a.wins('f', cx - bw * 0.14, D / 2 + 0.5, bw * 0.5, 1.0, 1.0, { n: 1, ww: 1.5, wh: 1.7 }); a.wins('f', cx - bw * 0.14, D / 2 + 0.5, bw * 0.5, 1.0, 4.3, { n: 1, ww: 1.5, wh: 1.7 });
            a.box(cx + bw * 0.32, 0, D / 2 + 0.8, 1.5, 0.6, 1.6, K.stone, 0xd8d0c0);                                    // the stoop
            a.panel('f', cx + bw * 0.32, 0, 0, D, 0, 0.6, 1.1, 2.2, K.doorW, [0xa8d0b8, 0xe8c890, 0xb8c8e8][i]);
            a.wins('f', cx + bw * 0.32, 0, 1.2, D, 4.3, { n: 1, ww: 1.0, wh: 1.7 });
        }
        a.floors('b', 0, 0, W, D, 2, { n: 6 });
        a.box(0, ROOF_H - 0.5, D / 2 + 0.2, W + 0.5, 0.5, 0.6, K.plaster, 0xf4ecd8, { under: true });                   // the cornice
        a.parapet(0, ROOF_H, 0, W, D, 0.9, K.brick, 0xc89078);
        a.done();
    })();
    (() => {   // B2 the bakery: cream stucco, a red gable, a brick chimney, striped awnings
        const fr = frameOf('P01-00-B2'); solid('P01-00-B2', fr, 4.2, { walkin: true, leaf: 'leaf_shabby_wood', keyIn: K.stucco, floorIn: K.tile });
        const a = arch(fr, 'P01-00-B2'), W = fr.W, D = fr.D, CR = 0xfff0c8, RD = 0xe07050, dr = doorOf(rowOf('P01-00-B2'));
        a.shell(W, 4.2, D, K.stucco, CR, dr);
        a.box(0, 4.2, -D * 0.18, W, 2.6, D * 0.64, K.stucco, CR, { top: false });
        a.roof('gable', 0, 6.8, -D * 0.18, D * 0.64, 2.8, W, K.rib, RD, { ry: 90, keyEnd: K.stucco, tintEnd: CR, over: 0.5 });
        a.roof('shed', 0, 4.2, D * 0.32, W, 1.3, D * 0.36, K.rib, RD, { keyEnd: K.stucco, tintEnd: CR, over: 0.3 });   // the shop's lean-to
        a.wins('f', dr.lx > 0 ? -W / 4 : W / 4, 0, W / 2, D, 0.7, { n: 1, ww: 3.4, wh: 2.2, key: K.winS });
        a.wins('r', 0, 0, W, D, 0.9, { n: 4, ww: 2.2, wh: 1.9, key: K.winS }); a.wins('lr', 0, -D * 0.18, W, D * 0.64, 4.6, { n: 3 });
        a.awning('f', 0, 0, W, D, 0, 3.4, W - 1, 2.0, 0xf05048); a.awning('r', 0, 0, W, D, 0, 3.3, D - 2, 1.5, 0xfff4e0);
        a.panel('f', 0, 0, W, D, 0, 3.5, W * 0.6, 0.7, null, 0xf8c840, { glow: 0.5, off: 0.1 });
        a.box(-W / 2 + 1.6, 4.2, -D / 2 + 2, 1.3, 6.2, 1.3, K.brick, 0xd98a70);                                        // the oven's chimney
        a.done();
    })();
    (() => {   // B3 the bike workshop (roof walk): blue-grey ribbed metal, two roll-up doors, a water tank on the roof
        const fr = frameOf('P01-00-B3'); roofWalk('P01-00-B3');
        const a = arch(fr, 'P01-00-B3'), W = fr.W, D = fr.D, BL = 0xb4d8e8;
        a.box(0, 0, 0, W + 0.1, ROOF_H, D + 0.1, K.rib, BL, { top: false });
        a.wins('f', 0, 0, W, D, 0, { n: 2, ww: W * 0.34, wh: 3.4, key: K.metal, tint: 0xe8ecf0, margin: 1 });
        a.panel('f', 0, 0, W, D, 0, 4.1, W * 0.7, 1.2, null, 0xf08a2c, { glow: 0.45 });
        a.wins('f', 0, 0, W, D, 5.7, { n: 6, ww: 1.8, wh: 0.9, key: K.winF }); a.wins('lr', 0, 0, W, D, 4.6, { n: 3, key: K.winF, ww: 1.8, wh: 1.4 });  a.wins('b', 0, 0, W, D, 4.6, { n: 5, key: K.winF, ww: 1.8, wh: 1.4 }); a.wins('b', 0, 0, W, D, 1.2, { n: 5, key: K.winF, ww: 1.8, wh: 1.4 });
        a.parapet(0, ROOF_H, 0, W, D, 0.6, K.rib, 0x6f8c98);
        a.cyl(W / 2 - 2.6, ROOF_H + 1.6, -D / 2 + 2.6, 1.5, 2.6, K.wood, 0xd0a070, { seg: 12 }); a.cyl(W / 2 - 2.6, ROOF_H + 4.2, -D / 2 + 2.6, 1.7, 1.2, K.rib, 0x707478, { r2: 0, seg: 12 });
        a.box(W / 2 - 2.6, ROOF_H, -D / 2 + 2.6, 2.4, 1.6, 2.4, null, 0x3a3c40, { top: false });
        a.done();
    })();

    /* ════════ P02-00 LAUNDRY TERRACES (roof walk): a stepped cream block, washing on lines across its roofs ════════ */
    (() => {
        const fr = frameOf('P02-00-B1'); roofWalk('P02-00-B1');
        const a = arch(fr, 'P02-00-B1'), W = fr.W, D = fr.D, CR = 0xf2e2b8, TL = 0x9fd0c6;
        a.box(0, 0, 0, W + 0.1, ROOF_H, D + 0.1, K.stucco, CR, { top: false });
        a.box(0, 3.4, 0, W + 0.3, 0.3, D + 0.3, K.plaster, TL, { top: false });                                        // the string course
        a.floors('fblr', 0, 0, W, D, 2, { n: 7 });
        a.wins('f', 0, 0, W, D, 0.5, { n: 4, ww: 4.2, wh: 2.4, key: K.winS, margin: 3 });                              // the wash house's shop windows
        a.awning('f', 0, 0, W, D, 0, 3.3, W - 4, 1.8, 0x7fc8d8); a.panel('f', 0, 0, W, D, 0, 3.7, W * 0.5, 1.0, null, 0xf0a030, { glow: 0.5, off: 0.12 });
        a.parapet(0, ROOF_H, 0, W, D, 0.8, K.plaster, TL);
        a.box(W / 2 - 4.5, ROOF_H, -D / 2 + 5.5, 8, 3.2, 10, K.stucco, 0xfff2d4, { top: false });                       // the drying loft on the roof
        a.roof('shed', W / 2 - 4.5, ROOF_H + 3.2, -D / 2 + 5.5, 10, 1.0, 8, K.rib, TL, { ry: 270, over: 0.4, keyEnd: K.stucco, tintEnd: 0xfff2d4 });
        a.wins('l', W / 2 - 4.5, -D / 2 + 5.5, 8, 10, ROOF_H + 1.0, { n: 3 });
        for (let i = 0; i < 4; i++) {   // the lines: two posts, a wire, the washing
            const x = -W / 2 + 2.5 + i * 4.2;
            a.box(x, ROOF_H, 1, 0.12, 2.2, 0.12, null, 0xe8e8e8, { n: 2, step: [0, 0, 11] });
            a.box(x, ROOF_H + 2.1, 6.5, 0.05, 0.05, 11, null, 0xf4f4f4);
            a.box(x, ROOF_H + 1.0, 2.4, 0.06, 1.1, 1.4, null, [0xf4ecd8, 0xe87868, 0x78b0d8, 0xf4d870][i], { n: 4, step: [0, 0, 2.5], top: false });
        }
        a.done();
    })();

    /* ════════ P03-00 THE BOXING GYM + a row house ════════ */
    (() => {   // B1 the gym: a red brick hall under a barrel vault, end piers, a painted sign band
        const fr = frameOf('P03-00-B1'), row = solid('P03-00-B1', fr, 6.5, { walkin: true, leaf: 'leaf_exit', leafDouble: true, keyIn: K.brick, floorIn: 'wood_planks', door: rowOf('P03-00-B1').door });
        const a = arch(fr, 'P03-00-B1'), W = fr.W, D = fr.D, BR = 0xd87060, dr = doorOf(row);
        a.shell(W, 6.5, D, K.brick, BR, dr);
        a.roof('barrel', 0, 6.5, 0, D, 4.2, W, K.rib, 0xc8d0d8, { ry: 90, keyEnd: K.brick, tintEnd: BR, seg: 12, over: 0.2 });
        a.box(-W / 2 + 0.3, 0, D / 2 + 0.25, 1.0, 9.2, 0.6, K.brick, 0xa85848, { n: 2, step: [W - 0.6, 0, 0] });        // the front's two piers
        a.panel('f', 0, 0, W, D, 0, 3.4, W * 0.8, 2.0, null, 0xfff0d0, { glow: 0.35 });
        a.wins('f', dr.lx > 0 ? -W * 0.2 : W * 0.2, 0, W * 0.6, D, 0.8, { n: 3, ww: 2.0, wh: 2.0, key: K.winF });
        a.quad(0, 7.0, D / 2 + 0.08, 4.2, 2.4, 0, K.winF, 0xffe890, { glow: 0.5, uv: 'fit' });                          // the lit lunette
        a.wins('lr', 0, 0, W, D, 4.0, { n: 5, ww: 1.8, wh: 1.4, key: K.winF });
        a.done();
    })();
    (() => {   // B2 the row house: tan clapboard, a brown gable to the street, a porch
        const fr = frameOf('P03-00-B2'); solid('P03-00-B2', fr, 6.4);
        const a = arch(fr, 'P03-00-B2'), W = fr.W, D = fr.D, TN = 0xf0d8a8, BN = 0x8c7468;
        a.box(0, 0, 0, W + 0.1, 6.4, D + 0.1, K.board, TN, { top: false });
        a.roof('gable', 0, 6.4, 0, D, 3.6, W, K.rib, BN, { ry: 90, keyEnd: K.board, tintEnd: TN, over: 0.5 });
        a.floors('fblr', 0, 0, W, D, 2, { pitch: 3.6 }); a.quad(0, 7.0, D / 2 + 0.08, 1.2, 1.4, 0, K.winR, null, { uv: 'fit' });
        a.box(0, 0, D / 2 + 1.1, W - 1, 0.4, 2.2, K.wood, 0xc8b090); a.roof('shed', 0, 2.9, D / 2 + 1.2, W - 0.6, 0.6, 2.4, K.rib, BN, { under: true, ds: true });
        a.box(-W / 2 + 0.9, 0.4, D / 2 + 2.0, 0.22, 2.5, 0.22, null, 0xf8f0e0, { n: 2, step: [W - 1.8, 0, 0] });
        a.panel('f', 0, 0, W, D, 0, 0.4, 1.1, 2.2, K.doorW, 0xc87858);
        a.done();
    })();

    /* ════════ P00-01 THE COMMUNITY KITCHEN + apartment row A ════════ */
    (() => {   // B1 the kitchen: a long cream hall, one green roof slope, a yellow canopy on posts, two steel vents
        const fr = frameOf('P00-01-B1'), row = solid('P00-01-B1', fr, 4.6, { walkin: true, leaf: 'leaf_exit', leafDouble: true, keyIn: K.stucco, floorIn: K.tile, door: rowOf('P00-01-B1').door });
        const a = arch(fr, 'P00-01-B1'), W = fr.W, D = fr.D, CR = 0xfff0d0, GN = 0x60b89c, dr = doorOf(row);
        a.shell(W, 4.6, D, K.stucco, CR, dr);
        a.roof('shed', 0, 4.6, 0, W, 2.4, D, K.rib, GN, { keyEnd: K.stucco, tintEnd: CR, over: 0.5 });
        a.roof('shed', 0, 3.0, D / 2 + 1.9, W - 3, 0.5, 3.8, K.plaster, 0xf8c040, { under: true, ds: true });            // the serving canopy
        a.box(-W / 2 + 2, 0, D / 2 + 3.6, 0.22, 3.0, 0.22, K.wood, 0xa07850, { n: 6, step: [(W - 4) / 5, 0, 0] });
        a.wins('f', 0, 0, W, D, 1.1, { n: 7, ww: 2.0, wh: 1.5, key: K.winS }); a.wins('b', 0, 0, W, D, 1.4, { n: 6 });
        a.panel('f', -W * 0.3, 0, W, D, 0, 3.4, 5, 0.8, null, 0xfff8e8, { glow: 0.4, off: 0.1 });
        a.cyl(-W * 0.3, 5.4, -D * 0.2, 0.55, 3.4, K.metal, 0xdde2e6, { seg: 10, n: 2, step: [5, 0, 0] }); a.cyl(-W * 0.3, 8.8, -D * 0.2, 0.9, 0.6, K.metal, 0xb0b6ba, { r2: 0.2, seg: 10, n: 2, step: [5, 0, 0] });
        a.done();
    })();
    const apartment = (id, tint, roofTint, form) => {   // the repeating one: three storeys, balconies / bays to the front
        const fr = frameOf(id); solid(id, fr, 9.6);
        const a = arch(fr, id), W = fr.W, D = fr.D;
        a.box(0, 0, 0, W + 0.1, 9.6, D + 0.1, form === 'gables' ? K.brick : K.plaster, tint, { top: false });
        if (form === 'gables') {
            for (let i = 0; i < 3; i++) a.roof('gable', -W / 3 + i * W / 3, 9.6, 0, D, 2.8, W / 3, K.rib, roofTint, { ry: 90, keyEnd: K.brick, tintEnd: tint, over: 0.3 });
            a.box(0, 3.9, D / 2 + 0.65, W - 3, 0.15, 1.3, null, 0x34363a, { n: 2, step: [0, 3.2, 0], under: true });      // the balconies
            a.box(0, 3.9, D / 2 + 1.27, W - 3, 1.0, 0.06, K.metal, 0x34363a, { n: 2, step: [0, 3.2, 0], kind: 'wall', ds: true });
        } else {
            a.roof('hip', 0, 9.6, 0, W, 2.8, D, K.rib, roofTint, { over: 0.5 });
            a.box(-W / 3, 0, D / 2 + 0.7, 4.5, 9.9, 1.4, K.plaster, 0xd4e6ec, { n: 3, step: [W / 3, 0, 0] });               // the stair bays
            a.wins('f', 0, D / 2 + 0.7, W, 1.4, 0, { n: 3, ww: 1.2, wh: 2.2, key: K.doorP, tint: 0xd8b890 });
        }
        a.floors('fb', 0, 0, W, D, 3, { n: 8 }); a.floors('lr', 0, 0, W, D, 3, { n: 3 });
        a.done();
    };
    apartment('P00-01-B2', 0xe8a888, 0x786a66, 'gables');
    apartment('P00-02-B2', 0xb8d0d8, 0x6a6470, 'hip');

    /* ════════ P01-01 THE CORNER SHOPS (roof walk): a Buildings-pack shop block at its own size on the corner, a low arcade of four shops round it ════════ */
    (() => {
        const fr = frameOf('P01-01-B1'); roofWalk('P01-01-B1');
        const W = fr.W, D = fr.D, PB = { key: 'pack_bld_09', w: 16.89, d: 13.86 };
        /* the pack block: the front's left corner (as the row's frame runs), a texbuilding row at 1.0 of its true width */
        const blk = fr.sub(-W / 2 + PB.w / 2, D / 2 - PB.d / 2, PB.w, PB.d);
        const prow = { k: 'texbuilding', id: 'dc:P01-01-B1-shop', x: blk.x, z: blk.z, y: plotY(1, 1), w: PB.w, d: PB.d, rot: fr.rot, storeys: 3, seed: 9100, key: PB.key }; out.push(prow);
        const a = arch(fr, 'P01-01-B1'), CR = 0xf0e2c0, SG = 0x9cc4b8;
        const rx = -W / 2 + PB.w, rw = W - PB.w;                      // the wing beside the block
        a.box(rx + rw / 2, 0, 0, rw + 0.05, ROOF_H, D + 0.1, K.stucco, CR, { top: false, faces: 'fbr' });
        a.box(-W / 2 + PB.w / 2, 0, -PB.d / 2, PB.w, ROOF_H, D - PB.d + 0.1, K.stucco, 0xe6d4a8, { top: false, faces: 'bl' });   // the wing behind it
        a.parapet(rx + rw / 2, ROOF_H, 0, rw, D, 0.8, K.plaster, SG);
        const shops = [0xf05048, 0x48b080, 0xf0b840, 0x5890e0], sl = D / 4;
        shops.forEach((c, i) => {   // four shops down the side street: a window, a door, a sign, an awning each
            const along = -D / 2 + sl * (i + 0.5);
            a.wins('r', rx + rw / 2, along, rw, sl, 0.5, { n: 1, ww: sl * 0.5, wh: 2.2, key: K.winS, margin: 0.4 });
            a.panel('r', rx + rw / 2, 0, rw, D, along + sl * 0.34, 0, 1.1, 2.2, K.doorS, 0xffffff);
            a.panel('r', rx + rw / 2, 0, rw, D, along, 3.6, sl * 0.86, 0.9, null, c, { glow: 0.45 });
            a.awning('r', rx + rw / 2, 0, rw, D, along, 3.4, sl * 0.86, 2.2, c);
        });
        a.box(W / 2 + 2.3, 0, -D / 2 + 0.5, 0.2, 2.7, 0.2, null, 0x3a3c40, { n: 5, step: [0, 0, (D - 1) / 4] });        // the arcade's posts
        a.wins('f', rx + rw / 2, 0, rw, D, 0.5, { n: 2, ww: 3.4, wh: 2.2, key: K.winS }); a.wins('fbr', rx + rw / 2, 0, rw, D, 4.4, { pitch: 3.2 });
        a.wins('bl', -W / 2 + PB.w / 2, -PB.d / 2, PB.w, D - PB.d, 1.0, { pitch: 3.4 }); a.wins('bl', -W / 2 + PB.w / 2, -PB.d / 2, PB.w, D - PB.d, 4.4, { pitch: 3.4 });
        a.roof('barrel', rx + rw / 2, ROOF_H, D / 2 - 0.3, 0.5, 2.2, 6, K.plaster, SG, { ry: 90, seg: 10 });            // the arcade's arched gable
        a.done();
    })();

    /* ════════ P02-01 THE TENEMENT STAIR + walk-up flats ════════ */
    (() => {   // B1 the tenement: five dark-brick storeys, the zig-zag fire stair up its front, a water tower
        const fr = frameOf('P02-01-B1'); solid('P02-01-B1', fr, 16);
        const a = arch(fr, 'P02-01-B1'), W = fr.W, D = fr.D, BR = 0xc07860, ST = 0xf0e4c8, IR = 0x2a2c30, per = 3.1;
        a.box(0, 0, 0, W + 0.1, 16, D + 0.1, K.brick, BR, { keyTop: K.conc });
        a.box(0, 16, 0, W + 0.7, 0.6, D + 0.7, K.plaster, ST, { under: true }); a.box(0, 3.5, 0, W + 0.4, 0.35, D + 0.4, K.plaster, ST, { top: false });
        a.floors('fb', 0, 0, W, D, 5, { n: 9, per, y0: 0.9 }); a.floors('lr', 0, 0, W, D, 5, { n: 4, per, y0: 0.9 });
        a.panel('f', 0, 0, W, D, -W * 0.3, 0, 1.3, 2.3, K.doorW, 0xb0c8b0);
        for (let k = 0; k < 4; k++) {   // a landing a floor, a stair between them, turn and turn about
            const y = 3.6 + k * per, sx = (k % 2 ? 1 : -1) * 4;
            a.box(0, y, D / 2 + 0.75, 16, 0.12, 1.5, K.metal, IR, { under: true }); a.box(0, y, D / 2 + 1.47, 16, 1.0, 0.06, K.metal, IR, { ds: true });
            a.box(sx, y - per, D / 2 + 0.9, 0.9, 0.1, 0.5, K.metal, IR, { n: 8, step: [-sx / 8 * 1.6, per / 8, 0], under: true });
        }
        a.box(W * 0.2, 16.6, -1, 0.2, 2.2, 0.2, null, IR, { n: 2, step: [2.6, 0, 0] }); a.box(W * 0.2, 16.6, 1.6, 0.2, 2.2, 0.2, null, IR, { n: 2, step: [2.6, 0, 0] });
        a.cyl(W * 0.2 + 1.3, 18.8, 0.3, 2.0, 3.0, K.wood, 0xc09868, { seg: 14 }); a.cyl(W * 0.2 + 1.3, 21.8, 0.3, 2.2, 1.6, K.rib, 0x5c5e62, { r2: 0, seg: 14 });
        a.box(-W * 0.25, 16.6, 0, 4, 2.6, 4, K.brick, BR, { keyTop: K.conc });                                         // the stair head
        a.done();
    })();
    (() => {   // B2 the walk-up flats (roof walk): ochre plaster, a roof garden under a pergola
        const fr = frameOf('P02-01-B2'); roofWalk('P02-01-B2');
        const a = arch(fr, 'P02-01-B2'), W = fr.W, D = fr.D, OC = 0xf0c880;
        a.box(0, 0, 0, W + 0.1, ROOF_H, D + 0.1, K.plaster, OC, { top: false });
        a.floors('fblr', 0, 0, W, D, 2, { n: 5 }); a.panel('f', 0, 0, W, D, -W * 0.3, 0, 1.2, 2.2, K.doorW, 0xc8a070);
        a.box(0, 3.45, 0, W + 0.3, 0.25, D + 0.3, K.plaster, 0xb88848, { top: false });
        a.parapet(0, ROOF_H, 0, W, D, 0.9, K.plaster, 0xc09050);
        a.box(-W / 2 + 2.5, ROOF_H, -D / 2 + 2, 2.6, 0.6, 1.2, 'leaves_3', 0xffffff, { n: 3, step: [4, 0, 0] });        // the planters
        a.box(W / 2 - 5.5, ROOF_H, D / 2 - 5.5, 0.16, 2.5, 0.16, K.wood, 0xa07850, { n: 2, step: [4.4, 0, 0] }); a.box(W / 2 - 5.5, ROOF_H, D / 2 - 1.5, 0.16, 2.5, 0.16, K.wood, 0xa07850, { n: 2, step: [4.4, 0, 0] });
        a.box(W / 2 - 5.7, ROOF_H + 2.5, D / 2 - 3.5, 0.3, 0.14, 4.8, K.wood, 0xa07850, { n: 6, step: [0.96, 0, 0] });
        a.done();
    })();

    /* ════════ P03-01 THE DOJO: a long timber hall, white panels between dark posts, a sweeping tiled roof, a red gate ════════ */
    (() => {
        const fr = frameOf('P03-01-B1'), row = solid('P03-01-B1', fr, 4.6, { walkin: true, leaf: 'leaf_shabby_wood', leafDouble: true, keyIn: K.plaster, floorIn: 'wood_planks' });
        const a = arch(fr, 'P03-01-B1'), W = fr.W, D = fr.D, WH = 0xfff8ec, DK = 0x5a4034, TL = 0x4c6460, RD = 0xe04838, dr = doorOf(row);
        a.shell(W, 4.6, D, K.plaster, WH, dr);
        a.box(-W / 2, 0, D / 2 + 0.12, 0.3, 4.6, 0.2, K.wood, DK, { n: 10, step: [W / 9, 0, 0] }); a.box(-W / 2, 0, -D / 2 - 0.12, 0.3, 4.6, 0.2, K.wood, DK, { n: 10, step: [W / 9, 0, 0] });
        a.box(0, 0, D / 2 + 1.2, W + 2, 0.5, 2.4, K.wood, 0x9c7c5c);                                                    // the veranda
        a.box(-W / 2 + 0.6, 0.5, D / 2 + 2.1, 0.24, 3.6, 0.24, K.wood, RD, { n: 9, step: [(W - 1.2) / 8, 0, 0] });
        a.roof('hip', 0, 4.4, 0.6, W + 1.6, 1.7, D + 3.6, K.rib, TL, { over: 1.3, ds: true });                          // the skirt roof, deep eaves
        a.box(0, 6.0, 0, W - 7, 0.9, D - 4.5, K.plaster, WH, { top: false });
        a.roof('gable', 0, 6.9, 0, W - 7, 2.9, D - 4.5, K.rib, TL, { keyEnd: K.plaster, tintEnd: WH, over: 0.7 });
        a.box(0, 9.7, 0, W - 5.4, 0.35, 0.7, K.plaster, 0xe8c860);                                                      // the ridge
        a.wins('f', 0, 0, W, D, 1.2, { n: 8, ww: 2.2, wh: 2.2, key: K.winS, tint: 0xfff4d8, margin: 1 });
        /* the gate before the door: two posts, a lintel, a tie under it */
        a.box(dr.lx - 2.6, 0, D / 2 + 5.4, 0.45, 5.0, 0.45, K.plaster, RD, { n: 2, step: [5.2, 0, 0] });
        a.box(dr.lx, 5.0, D / 2 + 5.4, 7.4, 0.5, 0.8, K.plaster, RD, { under: true }); a.box(dr.lx, 4.0, D / 2 + 5.4, 6.0, 0.35, 0.5, K.plaster, RD, { under: true });
        a.done();
    })();

    /* ════════ P00-02 THE BUS DEPOT: a white ticket office, a blue band, a curved canopy over the stands ════════ */
    (() => {
        const lot = frameOf('P00-02-B1'), W = lot.W, D = lot.D, ow = 9;
        const fr = lot.sub(-W / 2 + ow / 2, 0, ow, D); solid('P00-02-B1', fr, 4.2);
        const a = arch(lot, 'P00-02-B1'), WH = 0xf4f6f8, BL = 0x4c98e0, ox = -W / 2 + ow / 2, cw = W - ow - 1, cx = ox + ow / 2 + 0.5 + cw / 2;
        a.box(ox, 0, 0, ow + 0.1, 4.2, D + 0.1, K.tile, WH, { keyTop: K.conc }); a.box(ox, 4.2, 0, ow + 0.7, 0.4, D + 0.7, K.plaster, BL, { under: true });
        a.wins('f', ox, 0, ow, D, 1.0, { n: 2, ww: 2.6, wh: 2.0, key: K.winS }); a.wins('r', ox, 0, ow, D, 1.0, { n: 3, ww: 2.2, wh: 1.6, key: K.winS });
        a.panel('f', ox, 0, ow, D, 0, 3.2, ow * 0.7, 0.8, null, 0xf8c840, { glow: 0.5 });
        a.cyl(ox, 4.6, 0, 1.3, 1.5, K.plaster, WH, { seg: 16 }); a.box(ox, 4.9, 1.32, 0.12, 0.9, 0.06, null, 0x202226);  // the clock drum
        a.roof('barrel', cx, 3.6, 0, cw, 2.4, D - 1, K.rib, BL, { seg: 10, ds: true, keyEnd: null, tintEnd: BL });      // the canopy
        a.box(cx - cw / 2 + 0.4, 0, -D / 2 + 0.9, 0.3, 3.6, 0.3, K.plaster, 0xeeeeee, { n: 3, step: [(cw - 0.8) / 2, 0, 0] });
        a.box(cx - cw / 2 + 0.4, 0, D / 2 - 0.9, 0.3, 3.6, 0.3, K.plaster, 0xeeeeee, { n: 3, step: [(cw - 0.8) / 2, 0, 0] });
        a.done();
        propAt(lot, 'bus_shelter', cx, -D / 2 + 2.2, lot.face); propAt(lot, 'city_bench', cx, D / 2 - 2.0, (lot.face + 180) % 360);
        claim(lot.rect(cx, 0, cw, D, 0));
    })();

    /* ════════ P01-02 THE BACKYARD MARKET: an open striped hall, the pizzeria (pack), a carpenter's shed ════════ */
    (() => {   // B1 the market hall: no walls, four striped roof bays on green posts, stalls under them
        const fr = frameOf('P01-02-B1'), W = fr.W, D = fr.D; drop('P01-02-B1');
        const a = arch(fr, 'P01-02-B1'), GN = 0x4c7858, n = 4, bw = W / n;
        for (let i = 0; i < n; i++) a.roof('shed', -W / 2 + bw * (i + 0.5), 4.2, 0, D + 0.8, 1.6, bw, K.plaster, i % 2 ? 0xfff4e0 : 0xf05048, { ry: 90, ds: true, under: true, keyEnd: null, tintEnd: i % 2 ? 0xfff4e0 : 0xf05048 });
        a.box(-W / 2 + 0.2, 0, -D / 2 + 0.2, 0.3, 4.3, 0.3, K.plaster, GN, { n: 3, step: [(W - 0.4) / 2, 0, 0] }); a.box(-W / 2 + 0.2, 0, D / 2 - 0.2, 0.3, 4.3, 0.3, K.plaster, GN, { n: 3, step: [(W - 0.4) / 2, 0, 0] });
        a.box(-W / 2 + 0.2, 0, 0, 0.3, 4.3, 0.3, K.plaster, GN, { n: 3, step: [(W - 0.4) / 2, 0, 0] });
        const stalls = [[-W / 4, -D / 4, 0xf0b840], [W / 4, -D / 4, 0x70b048], [-W / 4, D / 4, 0xf05048], [W / 4, D / 4, 0xf08838]];
        stalls.forEach(s => { a.box(s[0], 0, s[1], 3.0, 1.0, 1.4, K.wood, 0xc09868); a.box(s[0], 1.0, s[1], 2.8, 0.3, 1.2, null, s[2]); ghost(fr, s[0], s[1], 3.0, 1.4, 1.3); });
        a.done();
    })();
    (() => {   // B2 the pizzeria (the Pizzeria pack's building, the city's chain): its shop front on the yard
        const old = rowOf('P01-02-B2'), fx = old.x, z0 = old.z - 7; drop('P01-02-B2');
        prop('city_pizzeria', fx, z0 + 10.25, 180); claim({ x0: fx - 5.6, x1: fx + 5.6, z0: z0 - 0.3, z1: z0 + 32.5 });   // (+ the tree line in front of its door)
    })();
    (() => {   // B3 the carpenter's shed: timber boards, one grey slope, a lean-to over the saw bench
        const fr = frameOf('P01-02-B3'); solid('P01-02-B3', fr, 4.0);
        const a = arch(fr, 'P01-02-B3'), W = fr.W, D = fr.D, WD = 0xd8b488, GY = 0x8c9498;
        a.box(0, 0, 0, W + 0.1, 4.0, D + 0.1, K.wood, WD, { top: false });
        a.roof('shed', 0, 4.0, 0, W, 2.6, D, K.rib, GY, { keyEnd: K.wood, tintEnd: WD, over: 0.5 });
        a.panel('f', -W * 0.2, 0, W, D, 0, 0, 5.6, 3.3, K.wood, 0x9c7450, { off: 0.1 });                                // the barn doors
        a.roof('shed', W * 0.28, 2.8, D / 2 + 1.5, W * 0.4, 0.6, 3.0, K.rib, GY, { under: true, ds: true });
        a.box(W * 0.28 - W * 0.18, 0, D / 2 + 2.8, 0.2, 2.8, 0.2, K.wood, 0x9c7450, { n: 2, step: [W * 0.36, 0, 0] });
        a.box(W * 0.28, 0, D / 2 + 1.4, 4, 1.1, 1.5, K.wood, 0xe8c890);
        a.wins('lr', 0, 0, W, D, 1.4, { n: 2, key: K.winF, ww: 1.8, wh: 1.4 });
        a.cyl(W / 2 - 2, 5.4, -D / 2 + 2, 0.4, 2.4, K.metal, 0x8c9094, { seg: 8 });
        a.done(); ghost(fr, W * 0.28, D / 2 + 1.4, 4, 1.5, 1.2);
    })();

    /* ════════ P02-02 THE REPAIR SHOPS (landmark): an auto garage, a sawtooth roof, three bays, an office, a sign pylon ════════ */
    (() => {
        const lot = frameOf('P02-02-B1'), W = lot.W, D = lot.D, gd = D - 6;
        const fr = lot.sub(0, 3, W, gd), row = solid('P02-02-B1', fr, 6.0, { walkin: true, leaf: 'leaf_security', keyIn: K.rib, floorIn: K.conc });
        const a = arch(fr, 'P02-02-B1'), GY = 0xe0e6ea, RD = 0xf04c3c, dr = doorOf(row), n = 4, tw = W / n;
        a.shell(W, 6.0, gd, K.rib, GY, dr);
        for (let i = 0; i < n; i++) {   // the saw teeth: a ribbed slope and a glazed upright each, running front to back
            const cx = -W / 2 + tw * (i + 0.5);
            a.roof('shed', cx, 6.0, 0, gd, 2.6, tw, K.rib, 0x7c8894, { ry: 270, keyEnd: K.winF, tintEnd: 0xffffff });
        }
        [-1, 1].forEach(s => { if (Math.abs(dr.lx - s * W * 0.3) < 3) return; a.panel('f', 0, 0, W, gd, s * W * 0.3, 0, 5.2, 4.2, K.metal, s < 0 ? 0xf4f4f4 : 0x3c3e42); });   // the roll-up doors
        a.panel('f', 0, 0, W, gd, 0, 4.5, W - 1, 1.3, null, RD, { glow: 0.35, off: 0.1 });
        a.wins('lr', 0, 0, W, gd, 1.6, { n: 4, key: K.winF, ww: 2.4, wh: 1.8 });
        a.done();
        const b = arch(lot, 'P02-02-B1o');                                                                              // the front yard: the pylon, the tyres
        b.cyl(W / 2 - 3, 0, D / 2 - 2.4, 0.25, 11, K.metal, 0x9a9ea2, { seg: 8 }); b.box(W / 2 - 3, 8.4, D / 2 - 2.4, 3.6, 2.5, 0.3, null, 0xf8c840, { glow: 0.5 });
        b.cyl(-W / 2 + 3, 0, D / 2 - 2.2, 0.75, 0.9, null, 0x1c1c1e, { ri: 0.35, seg: 12, n: 2, step: [1.7, 0, 0] }); b.cyl(-W / 2 + 3.8, 0.9, D / 2 - 2.2, 0.75, 0.5, null, 0x1c1c1e, { ri: 0.35, seg: 12 });
        b.done(); ghost(lot, W / 2 - 3, D / 2 - 2.4, 0.8, 0.8, 11); ghost(lot, -W / 2 + 3.8, D / 2 - 2.2, 3.4, 1.6, 1.4);
        propAt(lot, 'car_pack_2', W * 0.3, D / 2 - 3.0, (lot.face + 90) % 360);
    })();

    /* ════════ P03-02 THE COMMUNITY GATE + a news kiosk ════════ */
    (() => {   // B1 the gatehouse: twin brick towers under hipped roofs, a gated arch between them, a clock turret
        const fr = frameOf('P03-02-B1'); solid('P03-02-B1', fr, 8);
        const a = arch(fr, 'P03-02-B1'), W = fr.W, D = fr.D, BR = 0xe08868, SL = 0x6c7c8c, tw = (W - 8) / 2;
        [-1, 1].forEach(s => {
            const cx = s * (4 + tw / 2);
            a.box(cx, 0, 0, tw, 8, D + 0.1, K.brick, BR, { top: false }); a.roof('hip', cx, 8, 0, tw, 3.2, D, K.rib, SL, { over: 0.5 });
            a.floors('fb', cx, 0, tw, D, 2, { n: 3, per: 3.5 }); a.floors(s < 0 ? 'l' : 'r', cx, 0, tw, D, 2, { n: 2, per: 3.5 });
        });
        a.box(0, 5.4, 0, 8.1, 2.6, D + 0.1, K.brick, BR, { top: false, faces: 'fb', under: true });                     // the bridge over the gate
        a.roof('barrel', 0, 2.6, 0, D - 0.4, 2.8, 7.2, null, 0x4c2c24, { ry: 90, seg: 10, ds: true, keyEnd: null, tintEnd: 0x2c1c18 });   // the arch
        a.panel('f', 0, 0, W, D, 0, 0, 6.4, 3.6, K.wood, 0x7c5038, { off: -0.6 }); a.panel('b', 0, 0, W, D, 0, 0, 6.4, 3.6, K.wood, 0x7c5038, { off: -0.6 });   // the gates, shut
        a.box(0, 8, 0, 4.4, 4.4, 4.4, K.brick, BR, { top: false }); a.roof('pyramid', 0, 12.4, 0, 5.0, 3.8, 5.0, K.rib, SL);
        a.panel('f', 0, 0, 4.4, 4.4, 0, 9.2, 2.2, 2.2, null, 0xfff8e8, { glow: 0.5 }); a.panel('b', 0, 0, 4.4, 4.4, 0, 9.2, 2.2, 2.2, null, 0xfff8e8, { glow: 0.5 });
        a.done();
    })();
    (() => {   // B2 the news kiosk: a green octagon under a gold cone, a little store shed behind
        const fr = frameOf('P03-02-B2'), W = fr.W, D = fr.D; drop('P03-02-B2');
        const a = arch(fr, 'P03-02-B2'), kz = D / 2 - 3.6;
        a.cyl(0, 0, kz, 3.2, 3.2, K.plaster, 0x4c9878, { seg: 8, cap: false }); a.cyl(0, 3.2, kz, 4.2, 2.2, K.rib, 0xe8c050, { r2: 0, seg: 8, roof: true });
        a.cyl(0, 5.3, kz, 0.25, 1.1, null, 0xe8c050, { seg: 6 }); a.cyl(0, 3.0, kz, 4.2, 0.2, K.plaster, 0x3c7860, { seg: 8, ri: 3.1 });
        a.quad(0, 1.1, kz + 3.0, 2.4, 1.4, 0, K.winS, 0xfff4d8, { glow: 0.4, uv: 'fit' });
        a.box(-W / 2 + 3.2, 0, -D / 2 + 2.2, 5, 2.8, 3.4, K.rib, 0xa8b8c4, { top: false }); a.roof('shed', -W / 2 + 3.2, 2.8, -D / 2 + 2.2, 5, 0.6, 3.4, K.rib, 0x6c7880, { over: 0.3 });
        a.done(); ghost(fr, 0, kz, 6, 6, 3.2); ghost(fr, -W / 2 + 3.2, -D / 2 + 2.2, 5, 3.4, 2.8);
    })();

    /* ════════ P01-03 SOUTHSIDE HOMES: two of the House pack's houses, garage to the walk ════════ */
    ['P01-03-B1', 'P01-03-B2'].forEach(id => {
        const old = rowOf(id), xw = old.x - 8.75, z = old.z; drop(id);                                                  // the footprint's west edge is the front
        prop('city_house', xw + 10.1, z, 270); claim({ x0: xw - 0.2, x1: xw + 20.5, z0: z - 7.5, z1: z + 7.5 });
    });

    /* ════════ P02-03 PAWNSHOP COURT: the pawnshop, and the Quequis House pack's waffle house along the south side ════════ */
    (() => {   // B1 the pawnshop: dark green brick, gold cornices, barred windows, the three balls on a bracket
        const fr = frameOf('P02-03-B1'), row = solid('P02-03-B1', fr, 7.4, { walkin: true, leaf: 'leaf_security', keyIn: K.plaster, floorIn: 'wood_planks' });
        const a = arch(fr, 'P02-03-B1'), W = fr.W, D = fr.D, GN = 0x7c9070, GD = 0xf0d470, dr = doorOf(row);
        a.shell(W, 7.4, D, K.brick2, GN, dr);
        a.box(0, 7.4, 0, W + 0.8, 0.7, D + 0.8, K.plaster, GD, { under: true, keyTop: K.conc, tintTop: 0xffffff }); a.box(0, 3.7, 0, W + 0.5, 0.3, D + 0.5, K.plaster, GD, { top: false });
        a.wins('f', dr.lx > 0 ? -W * 0.22 : W * 0.22, 0, W * 0.56, D, 0.8, { n: 2, ww: 3.0, wh: 2.3, key: K.winS, tint: 0xa8b8c8 });
        a.wins('f', 0, 0, W, D, 4.6, { n: 5 }); a.floors('lr', 0, 0, W, D, 2, { n: 3, per: 3.7 }); a.floors('b', 0, 0, W, D, 2, { n: 4, per: 3.7 });
        const bx = W / 2 - 0.9, bz = D / 2 + 1.4;
        a.box(bx, 5.0, D / 2 + 0.7, 0.14, 0.14, 1.5, null, 0x2c2c2e);
        [[0, 4.0], [-0.55, 3.1], [0.55, 3.1]].forEach(q => a.dome(bx + q[0], q[1], bz, 0.45, 0.45, 'gold', 0xffffff, { roof: false }).dome(bx + q[0], q[1], bz, 0.45, -0.45, 'gold', 0xffffff, { roof: false, ds: true }));
        a.done();
    })();
    (() => {   // B2 + B3 the waffle house: one long pack building where the plan had two small shops
        const b2 = rowOf('P02-03-B2'), b3 = rowOf('P02-03-B3');
        const x0 = Math.min(b2.x - b2.w / 2, b3.x - b3.w / 2), x1 = Math.max(b2.x + b2.w / 2, b3.x + b3.w / 2), zf = Math.min(b2.z - b2.d / 2, b3.z - b3.d / 2);
        drop('P02-03-B2'); drop('P02-03-B3');
        prop('city_quequis_house', (x0 + x1) / 2, zf + 6.05, 0); claim({ x0: (x0 + x1) / 2 - 16.2, x1: (x0 + x1) / 2 + 16.2, z0: zf - 0.3, z1: zf + 12.4 });
    })();

    /* ════════ P00-03 THE CANAL WALK: the Laundry pack's laundromat on the walk, a boathouse on the water ════════ */
    (() => {
        const pf = plotFrame(0, 3);
        const lx = sq(7) + 8.35 + 0.1, lz = sq(5) - 6.15 - 0.15;                                                        // its front on the east-west walk
        propAt(pf, 'city_laundry', lx, lz, 180); claim(pf.rect(lx, lz, 16.7, 12.3, 0.4));
        /* the canal lies in the levels' sunk ditch (levels.js pieces, P00-03: squares 1..5 x 1..11, two levels deep, its bed along square line 3):
           the water half a metre deep on the bed, north to south */
        const bed = plotY(0, 3) - 2 * (ctx.LEVELS ? ctx.LEVELS.M : 0);
        out.push({ k: 'stream', pts: [pf.at(sq(3), sq(3.1)), pf.at(sq(3), sq(8.9))], w: 2.6, y: r3(bed + 0.5), depth: 0.5, bank: 0.4 });   // the canal (waded)
        claim(pf.rect(sq(3), sq(6), 6, 24, 0));
        const fr = pf.sub(sq(7.3), sq(8.4), 8, 5), a = arch(fr, 'P00-03-boathouse'), BL = 0x9cc0d4, RD = 0xc06454;                     // on the east bank
        a.box(0, 0, 0, 8, 3.2, 5, K.board, BL, { top: false }); a.roof('gable', 0, 3.2, 0, 8, 2.4, 5, K.rib, RD, { keyEnd: K.board, tintEnd: BL, over: 0.5 });
        a.panel('f', 0, 0, 8, 5, 0, 0, 3.6, 2.6, K.wood, 0x8c6444, { off: 0.08 }); a.wins('lr', 0, 0, 8, 5, 1.3, { n: 1 }); a.wins('b', 0, 0, 8, 5, 1.3, { n: 2 });
        a.box(0, 0, 3.6, 7, 0.3, 2.2, K.wood, 0xb89468);                                                                // the slip
        a.done(); ghost(fr, 0, 0, 8, 5, 3.2); claim(fr.rect(0, 1, 9, 8, 0));
        propAt(pf, 'rowboat', sq(3), sq(6), 0, { y: 0.3 });
    })();

    /* ════════ P03-03 THE STREET COURT: a car wash beside the road (the skate ramps stay) ════════ */
    (() => {
        const pf = plotFrame(3, 3), fr = pf.sub(sq(10), sq(3), 6.4, 13), a = arch(fr, 'P03-03-carwash'), WH = 0xf0f2f4, BL = 0x48a4e8;
        a.box(-2.95, 0, 0, 0.5, 4.2, 13, K.tile, WH); a.box(2.95, 0, 0, 0.5, 4.2, 13, K.tile, WH);
        a.box(0, 4.2, 0, 7.4, 0.8, 14, K.plaster, BL, { under: true }); a.panel('f', 0, 0, 7.4, 14, 0, 4.25, 5, 0.7, null, 0xfff8e8, { glow: 0.5 }); a.panel('b', 0, 0, 7.4, 14, 0, 4.25, 5, 0.7, null, 0xfff8e8, { glow: 0.5 });
        [0xf04c3c, 0x48a4e8, 0xf8c840].forEach((c, i) => { a.cyl(-1.9, 0.2, -4 + i * 4, 0.6, 3.4, K.plaster, c, { seg: 10 }); a.cyl(1.9, 0.2, -4 + i * 4, 0.6, 3.4, K.plaster, [0x48a4e8, 0xf8c840, 0xf04c3c][i], { seg: 10 }); });
        a.done(); ghost(fr, -2.95, 0, 0.5, 13, 4.2); ghost(fr, 2.95, 0, 0.5, 13, 4.2); claim(fr.rect(0, 0, 7.4, 14, 0));
    })();

    /* ── THE CLEARING: what the tool stood where a new, larger building now stands (a fence run, a tree, a bench, a back-lot infill, a lamp) ── */
    const inC = (x, z) => claims.some(c => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);
    for (let i = features.length - 1; i >= 0; i--) {
        const f = features[i]; if (mine.has(f)) continue;
        let hit = false;
        if (f.k === 'tree') hit = inC(f.x, f.z);
        else if (f.k === 'rail' || (f.k === 'wall' && !f.ghost)) { for (let t = 0; t <= 8 && !hit; t++) hit = inC(f.x0 + (f.x1 - f.x0) * t / 8, f.z0 + (f.z1 - f.z0) * t / 8); }
        else if (f.k === 'texbuilding' && /^dc:in\d+/.test(f.id || '')) { const ew = f.rot === 90 || f.rot === 270, hw = (ew ? f.d : f.w) / 2 - 0.2, hd = (ew ? f.w : f.d) / 2 - 0.2; hit = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].some(q => inC(f.x + q[0] * hw, f.z + q[1] * hd)); }
        if (hit) { features.splice(i, 1); made.cleared++; }
    }
    for (let i = props.length - 1; i >= 0; i--) { const p = props[i]; if (!mine.has(p) && inC(p.x, p.z)) { props.splice(i, 1); made.cleared++; } }
    if (lamps) for (let i = lamps.length - 1; i >= 0; i--) if (inC(lamps[i].x, lamps[i].z)) { lamps.splice(i, 1); made.cleared++; }

    /* ════════ THE BACK LOTS: the tool's infill buildings in Southside (a square or two deep, behind the yards), three kinds turn about:
       a row of lock-up garages, a brick store under one slope, a clapboard cottage under a gable ════════ */
    const LIM = -ctx.HALF + 4 * PL;
    features.filter(f => f.k === 'texbuilding' && /^dc:in\d+$/.test(f.id || '') && f.x < LIM && f.z < LIM && !inC(f.x, f.z)).forEach((f, i) => {
        const fr = frame(f.x, f.z, f.rot || 0, f.w, f.d), W = fr.W, D = fr.D, id = f.id.slice(3), kind = (Number(id.slice(2)) + i) % 3, tall = (f.storeys || 1) > 1 && D > 3.6;
        const h = tall ? 6.2 : 3.2, a = arch(fr, id), hue = [0xe8d8b0, 0xd0e0e8, 0xf0c8a8, 0xd8e8c8, 0xe8c8d0][Number(id.slice(2)) % 5];
        solid(id, fr, h);
        if (kind === 0) {
            a.box(0, 0, 0, W + 0.06, h, D + 0.06, K.rib, hue, { top: false }); a.box(0, h, 0, W + 0.6, 0.3, D + 0.6, K.conc, 0xd0d0d0, { under: true });
            a.wins('f', 0, 0, W, D, 0, { pitch: 3.5, ww: 2.6, wh: 2.4, key: K.metal, tint: [0xf0f0f0, 0xa8c0d8, 0xe8b0a0][i % 3] });
            if (tall) a.wins('f', 0, 0, W, D, 3.9, { pitch: 3.5, key: K.winF, ww: 1.8, wh: 1.2 });
        } else if (kind === 1) {
            a.box(0, 0, 0, W + 0.06, h, D + 0.06, K.brick, [0xe09078, 0xc8a890, 0xd8b0a0][i % 3], { top: false });
            a.roof('shed', 0, h, 0, W, 1.2, D, K.rib, 0x808890, { keyEnd: K.brick, tintEnd: [0xe09078, 0xc8a890, 0xd8b0a0][i % 3], over: 0.3 });
            a.floors('f', 0, 0, W, D, tall ? 2 : 1, { pitch: 3.5, per: 3.0 }); a.panel('f', 0, 0, W, D, -W / 2 + 1.2, 0, 1.1, 2.2, K.doorP, 0xffffff);
        } else {
            a.box(0, 0, 0, W + 0.06, h, D + 0.06, K.board, hue, { top: false });
            a.roof('gable', 0, h, 0, W, Math.min(2.4, D * 0.5), D, K.rib, [0x9c6858, 0x607080, 0x6c7c5c][i % 3], { keyEnd: K.board, tintEnd: hue, over: 0.35 });
            a.floors('f', 0, 0, W, D, tall ? 2 : 1, { pitch: 3.5, per: 3.0 }); a.panel('f', 0, 0, W, D, W / 2 - 1.2, 0, 1.1, 2.2, K.doorW, 0xffffff);
        }
        a.done(); made.backlots = (made.backlots || 0) + 1;
    });

    out.forEach(r => lateRows.push(r));
    console.log('SOUTHSIDE', JSON.stringify(made));
}
module.exports = { apply, build };
