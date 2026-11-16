/* THE VATICAN · B · THE BASILICA (6 plots: P01-01 P02-01 P03-01 P01-02 P02-02 P03-02 of room `site_prebuilt_vatican_plots`)
   THE ZONE'S PILOT DISTRICT. One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js (shared: a note first).
   THE IDEA: St Peter's at its own scale, a Latin cross 112 m long with its floor seven steps over the Square: the apse and the chair in the
   west, the dome over the crossing, the nave and its two aisles, the narthex behind the front, the steps down to the Square.
   THE SQUARES (room squares, sx west to east, sy north to south; the floor stands at 1.75 m):
     apse sx 13-16 (a curve) · crossing + transepts sx 16-23 x sy 13-34 · nave sx 24-41 x sy 17-30 (columns on sy 20 and sy 27, the middle
     aisle sy 23-24) · narthex sx 42-44 x sy 15-32 · the steps sx 45-47 x sy 16-31 (the tool's stair).
   Notes, passes, decisions: docs/notes/areas-complexes.md "THE AFTERLIFE, THE BASILICA". */
'use strict';
const FY = 1.75, WH = 22.75, MARB = 'urban:PlasterWallPainted1a', TRAV = 0xfff8ea, LEAD = 0xa9bcc8;
exports.build = ctx => { exports.build2(ctx); const { gx, gz, cell, W, H, wall, look, door } = ctx;
    const isB = (x, y) => x >= 0 && y >= 0 && x < W && y < H && cell[y][x] === 'B';
    /* THE WALLS: every side of a floor square that faces a square that is not the floor. The front (x = 45) keeps four doorways a square wide
       (two in the middle, one each side); the narthex opens to the nave through three arches. Merged along each line, bumped as ghosts, drawn
       below (the apse is drawn as a curve). */
    const DOORS = { 45: [[19, 20], [23, 25], [28, 29]], 42: [[18, 20], [22, 26], [28, 30]] }, runs = [];
    const gap = (line, y) => (DOORS[line] || []).some(q => y >= q[0] && y < q[1]);
    for (let x = 12; x <= 46; x++) { let s = null; for (let y = 12; y <= 36; y++) { const on = (isB(x, y) !== isB(x - 1, y)) && !gap(x, y); if (on && s == null) s = y; if (!on && s != null) { runs.push(['v', x, s, y, 0, isB(x, s) ? -1 : 1]); s = null; } } }
    for (let y = 12; y <= 36; y++) { let s = null; for (let x = 12; x <= 46; x++) { const on = isB(x, y) !== isB(x, y - 1); if (on && s == null) s = x; if (!on && s != null) { runs.push(['h', y, s, x, 0, isB(s, y) ? -1 : 1]); s = null; } } }
    for (let y = 15; y < 33; y++) if (!gap(42, y) && isB(42, y) && isB(41, y)) { let e = y; while (e < 33 && !gap(42, e) && isB(41, e)) e++; runs.push(['v', 42, y, e, 1, 0]); y = e; }   // the wall between the narthex and the nave
    runs.forEach(r => r[0] === 'v' ? wall(gx(r[1]), gz(r[2]), gx(r[1]), gz(r[3]), FY, WH) : wall(gx(r[2]), gz(r[1]), gx(r[3]), gz(r[1]), FY, WH));
    /* the front's doors: bronze leaves that swing (PASS 1) */
    [19, 23, 24, 28].forEach(sy => door(gx(45), gz(sy + 0.5), 90, { double: true, y: FY, leaf: 'leaf_wooden' }));
    const STONE = { uv: [7, 7], glow: 0.42 }, TRIM = 0xfffaf0, DARKG = 'urban:GlassWindowTall1a';
    look('basilica', 0, 0, 0, 0, a => {
        runs.forEach(r => { const apse = r[0] === 'v' ? r[1] < 16 : (r[2] < 16 && r[3] <= 16); if (apse) return; const inner = r[4], out = r[5], L = (r[3] - r[2]) * 3.5, v = r[0] === 'v';
            const mid = v ? (gz(r[2]) + gz(r[3])) / 2 : (gx(r[2]) + gx(r[3])) / 2, line = v ? gx(r[1]) : gz(r[1]);
            const bx = (along, y, t, h, len, key, tint, o) => v ? a.box(line + t, y, along, 0, 0, 0, key, tint, Object.assign({ size: [o.th, h, len] }, o.x)) : a.box(along, y, line + t, 0, 0, 0, key, tint, Object.assign({ size: [len, h, o.th] }, o.x));
            bx(mid, FY, 0, inner ? 12 : WH, L + 0.7, MARB, TRAV, { th: 0.7, x: STONE });
            if (inner || (v && r[1] === 45)) return;
            /* PASS 1: the side walls' order: a plinth, giant pilasters every 7 m, two tiers of windows between them, the cornice */
            bx(mid, FY - 1.75, out * 0.5, 2.6, L + 1.4, MARB, 0xe6dcc6, { th: 0.5, x: { uv: [7, 7], glow: 0.3 } });
            bx(mid, FY + WH - 1.3, out * 0.6, 1.3, L + 1.6, MARB, TRIM, { th: 0.9, x: { glow: 0.45 } });
            bx(mid, FY + 11.2, out * 0.45, 0.6, L + 0.9, MARB, TRIM, { th: 0.3, x: { glow: 0.45 } });
            const n = Math.max(1, Math.round(L / 7));
            for (let i = 0; i <= n; i++) bx(mid - L / 2 + i * L / n, FY, out * 0.5, WH - 1.3, 1.3, MARB, TRIM, { th: 0.45, x: { glow: 0.5 } });
            for (let i = 0; i < n; i++) { const c = mid - L / 2 + (i + 0.5) * L / n;
                bx(c, FY + 3.2, out * 0.4, 5.6, 1.9, DARKG, 0x2c2e33, { th: 0.12, x: { glow: 0.12 } }); bx(c, FY + 2.8, out * 0.5, 0.4, 2.7, MARB, TRIM, { th: 0.4, x: { glow: 0.45 } }); bx(c, FY + 8.8, out * 0.5, 0.5, 2.9, MARB, TRIM, { th: 0.5, x: { glow: 0.45 } });
                bx(c, FY + 13.2, out * 0.4, 4.2, 1.9, DARKG, 0x2c2e33, { th: 0.12, x: { glow: 0.12 } }); bx(c, FY + 12.8, out * 0.5, 0.4, 2.7, MARB, TRIM, { th: 0.4, x: { glow: 0.45 } }); } });
        /* THE APSE: a curved wall, its cornice and its half dome */
        a.cyl(gx(16.4), FY, gz(24), 17.6, WH, MARB, TRAV, { arc: 180, a0: 90, ri: 17, ds: true, seg: 20, cap: false, uv: [7, 7], glow: 0.42 });
        a.cyl(gx(16.4), FY + WH - 1.3, gz(24), 18.2, 1.3, MARB, TRIM, { arc: 180, a0: 90, ri: 17.2, seg: 20, glow: 0.45 });
        a.dome(gx(16.4), FY + WH, gz(24), 17.6, 9, MARB, LEAD, { arc: 180, a0: 90, ds: true, seg: 20, roof: true, glow: 0.25 });
        /* THE ROOFS: the nave's and the transepts' vaults in lead (seen from outside; hidden with the roofs when you are in) */
        a.roof('barrel', gx(34.5), FY + WH, gz(24), 73.5, 8, 50, MARB, LEAD, { uv: 7, glow: 0.25 });
        a.roof('barrel', gx(20), FY + WH, gz(24), 78, 8, 28.6, MARB, LEAD, { ry: 90, uv: 7, glow: 0.25 });
        /* the ceilings from inside: a gilt sheet under each */
        /* THE DOME over the crossing: the drum with its ring of columns and windows, the dome, the lantern, the ball and the cross */
        const dx = gx(20), dz = gz(24), dy = FY + WH;
        a.cyl(dx, dy, dz, 14.8, 4, MARB, TRAV, { seg: 32, roof: true, glow: 0.4 }); a.cyl(dx, dy + 4, dz, 13.2, 11, MARB, TRAV, { seg: 32, roof: true, glow: 0.4 });
        a.cyl(0, 0, 0, 0.62, 10, MARB, TRIM, { ring: { n: 16, r: 14, a0: 0 }, seg: 8, roof: true, p: [dx, dy + 4, dz], glow: 0.5 });
        a.box(0, 0, 0, 0, 0, 0, DARKG, 0x2c2e33, { size: [0.2, 6.5, 2.4], ring: { n: 16, r: 13.28, a0: 11.25 }, roof: true, p: [dx, dy + 6, dz], glow: 0.12 });
        a.cyl(dx, dy + 15, dz, 14.8, 1.4, MARB, TRIM, { seg: 32, roof: true, glow: 0.45 });
        a.dome(dx, dy + 16.4, dz, 13.8, 16, MARB, LEAD, { seg: 32, rings: 12, roof: true, glow: 0.3 });
        a.box(0, 0, 0, 0, 0, 0, MARB, 0xc4d2da, { size: [0.5, 0.5, 0.5], ring: { n: 16, r: 13.9, a0: 0 }, roof: true, p: [dx, dy + 16.4, dz], glow: 0.3 });
        a.cyl(dx, dy + 31.6, dz, 3, 1, MARB, TRIM, { seg: 12, roof: true, glow: 0.45 }); a.cyl(dx, dy + 32.6, dz, 2.4, 5, MARB, TRAV, { seg: 12, roof: true, glow: 0.4 });
        a.cyl(0, 0, 0, 0.3, 4.6, MARB, TRIM, { ring: { n: 8, r: 2.7, a0: 0 }, seg: 6, roof: true, p: [dx, dy + 32.8, dz], glow: 0.5 });
        a.dome(dx, dy + 37.6, dz, 3, 3.4, MARB, LEAD, { seg: 12, roof: true, glow: 0.3 });
        a.dome(dx, dy + 40.8, dz, 0.8, 0.8, 'gold', null, { seg: 10, roof: true, glow: 0.4 }); a.cyl(dx, dy + 40.2, dz, 0.8, 0.7, 'gold', null, { seg: 10, roof: true, glow: 0.4 });
        a.box(dx, dy + 41.6, dz, 0.3, 3.4, 0.3, 'gold', null, { roof: true, glow: 0.4 }); a.box(dx, dy + 43.4, dz, 0.3, 0.3, 1.9, 'gold', null, { roof: true, glow: 0.4 });
        /* two small domes over the nave's shoulders */
        [[25.5, 15], [25.5, 33]].forEach(q => { a.cyl(gx(q[0]), dy, gz(q[1]), 4.8, 5, MARB, TRAV, { seg: 16, roof: true, glow: 0.4 }); a.cyl(0, 0, 0, 0.35, 4.4, MARB, TRIM, { ring: { n: 8, r: 4.95, a0: 0 }, seg: 6, roof: true, p: [gx(q[0]), dy + 0.3, gz(q[1])], glow: 0.5 });
            a.dome(gx(q[0]), dy + 5, gz(q[1]), 5, 5.4, MARB, LEAD, { seg: 16, roof: true, glow: 0.3 }); a.cyl(gx(q[0]), dy + 10.2, gz(q[1]), 0.9, 1.6, MARB, TRIM, { seg: 8, roof: true, glow: 0.45 }); });
        /* THE FRONT (east, x = sx 45): the wall with its doorways, eight giant columns, four pilasters, the entablature, the pediment over the
           middle four, the attic with its windows, the balustrade, the two clocks' bays, the loggia over the middle door */
        const fx = gx(45), ZC = gz(24), FW = 64.4;
        [[15, 19], [20, 23], [25, 28], [29, 33]].forEach(q => a.box(fx, FY, (gz(q[0]) + gz(q[1])) / 2, 0.8, 19.6, (q[1] - q[0]) * 3.5, MARB, TRAV, STONE));     // the wall between the doorways
        [[19, 20], [23, 25], [28, 29]].forEach(q => { const z = (gz(q[0]) + gz(q[1])) / 2, w = (q[1] - q[0]) * 3.5;
            a.box(fx, FY + 4.4, z, 0.8, 15.2, w, MARB, TRAV, STONE);                                                    // the wall over each doorway
            a.box(fx + 0.5, FY + 4.4, z, 0.5, 0.7, w + 1.4, MARB, TRIM, { glow: 0.5 }); a.box(fx + 0.5, FY, z - w / 2 - 0.45, 0.5, 4.4, 0.5, MARB, TRIM, { glow: 0.5 }); a.box(fx + 0.5, FY, z + w / 2 + 0.45, 0.5, 4.4, 0.5, MARB, TRIM, { glow: 0.5 });
            a.box(fx + 0.45, FY + 7.4, z, 0.14, 5.4, Math.min(w, 3.5) - 0.9, DARKG, 0x2c2e33, { glow: 0.12 }); a.box(fx + 0.6, FY + 6.9, z, 1.5, 0.45, Math.min(w, 3.5) + 0.6, MARB, TRIM, { glow: 0.5 }); });   // a window + its balcony over each door
        [15.5, 17.9, 21.4, 22.5, 25.5, 26.6, 30.1, 32.5].forEach(sy => { a.box(fx + 1.5, FY, gz(sy), 2.9, 1.3, 2.9, MARB, TRIM, { glow: 0.45 }); a.cyl(fx + 1.5, FY + 1.3, gz(sy), 1.15, 15.6, MARB, 0xffffff, { r2: 1, seg: 14, glow: 0.5 }); a.box(fx + 1.5, FY + 16.9, gz(sy), 2.9, 1.1, 2.9, MARB, TRIM, { glow: 0.5 }); });
        a.box(fx + 1.2, FY + 18, ZC, 3.6, 2.6, FW, MARB, TRIM, { glow: 0.45 });                                           // the entablature
        a.sign('IN HONOREM PRINCIPIS APOSTOLORVM', fx + 3.02, FY + 18.6, ZC, 40, 1.4, '#6a5a44', '#f4ecdc', 'marc', { ry: 90 });
        a.box(fx + 1.4, FY + 20.6, ZC, 4.2, 0.6, FW + 0.8, MARB, TRIM, { glow: 0.5 });
        a.roof('gable', fx + 1.3, FY + 21.2, ZC, 3.4, 4.6, 24.5, MARB, TRIM, { keyEnd: MARB, roof: false, glow: 0.45 });   // the pediment
        a.box(fx + 0.4, FY + 21.2, ZC, 1.6, 4.4, FW, MARB, TRAV, STONE);                                                 // the attic
        for (let i = 0; i < 9; i++) { const z = ZC - FW / 2 + 3.6 + i * (FW - 7.2) / 8; if (i >= 3 && i <= 5) continue; a.box(fx + 1.22, FY + 22.2, z, 0.12, 2.4, 1.7, DARKG, 0x2c2e33, { glow: 0.12 }); a.box(fx + 1.25, FY + 21.9, z, 0.3, 0.3, 2.3, MARB, TRIM, { glow: 0.5 }); }
        a.box(fx + 0.6, FY + 25.6, ZC, 2.2, 0.7, FW + 0.6, MARB, TRIM, { glow: 0.5 });
        for (let i = 0; i < 13; i++) a.box(fx + 0.6, FY + 26.3, ZC - FW / 2 + 1.6 + i * (FW - 3.2) / 12, 1.1, 1.1, 1.1, MARB, TRIM, { glow: 0.5 });   // the figures' plinths (the figures: dress)
        /* the steps' two pedestals (Peter and Paul stand on them: dress) */
        [[46.5, 15.5], [46.5, 32.5]].forEach(q => a.box(gx(q[0]), 0, gz(q[1]), 2.6, 3, 2.6, MARB, TRIM, { glow: 0.45 }));
    });
};
/* PASS 2, THE INSIDE (drawn; the walker's blockers are the dress stage's): the nave's two entablatures on their columns and its gilt barrel
   vault, the aisles' flat coffers, the crossing's four piers and the inside of the dome, the transepts' vaults, the apse's shell and glory,
   the baldachin over the altar, the galleries ("the galleries are closed"), the red runner. */
exports.build2 = ctx => { const { gx, gz, mx, mz, look, wall, mark } = ctx, G = 'gold', GT = 0xf0dca0, P1 = 'urban:PlasterWallPainted1a', W1 = 0xfffaf0;
    const CH = 16.4;   // the top of the nave's columns (15 m + base + capital) over the floor
    look('basilica_in', 0, 0, 0, FY, a => {
        /* the nave: an entablature along each row of columns, the clerestory wall over it, the barrel vault between them, the aisles' ceilings */
        [20.5, 27.5].forEach((sy, i) => { const z = gz(sy), s = i ? 1 : -1;
            a.box(gx(33), CH, z, 63, 1.5, 1.7, P1, W1, { glow: 0.5 }); a.box(gx(33), CH + 1.5, z + s * 0.2, 63, 0.5, 2.2, G, GT, { glow: 0.45 });
            a.box(gx(33), CH + 2, z + s * 0.35, 63, WH - CH - 2, 0.6, P1, W1, { glow: 0.45, uv: [7, 7] });
            a.quad(gx(33), CH + 1.9, gz(i ? 29.25 : 18.75), 63, 12.2, G, 0xd8c890, { flat: true, ds: true, roof: true, uv: 3.5, glow: 0.35 }); });
        a.roof('barrel', gx(33), CH + 2, gz(24), 63, 4.3, 22.6, G, GT, { ds: true, ends: false, seg: 12, uv: 3.5, glow: 0.4 });
        for (let x = 25; x <= 41; x += 2) a.roof('barrel', mx(x), CH + 1.9, gz(24), 0.9, 4.4, 22.7, P1, W1, { ds: true, ends: false, seg: 12, glow: 0.5 });   // the vault's ribs, one over each pair of columns
        /* the transepts' vaults (north and south of the crossing) and the narthex's ceiling */
        [[13, 20], [28, 35]].forEach(q => a.roof('barrel', gx(20), CH + 2, (gz(q[0]) + gz(q[1])) / 2, (q[1] - q[0]) * 3.5, 4.3, 27.4, G, GT, { ry: 90, ds: true, ends: false, seg: 12, uv: 3.5, glow: 0.4 }));
        a.quad(gx(43.5), 12, gz(24), 10.2, 62.4, G, 0xd8c890, { flat: true, ds: true, roof: true, uv: 3.5, glow: 0.35 });
        /* THE CROSSING: four piers, four arches' beams, the ring, the inside of the drum (its windows lit) and of the dome, the oculus' glow */
        [[17, 20], [22, 20], [17, 27], [22, 27]].forEach(q => { a.box(mx(q[0]), 0, mz(q[1]), 3.4, CH + 1.5, 3.4, P1, W1, { glow: 0.5, uv: [3.5, 7] }); a.box(mx(q[0]), 0, mz(q[1]), 3.8, 1.2, 3.8, 'marble_2', 0xe8dcc8, { glow: 0.3 }); a.box(mx(q[0]), CH + 1.5, mz(q[1]), 3.9, 0.6, 3.9, G, GT, { glow: 0.45 }); });
        const dx = gx(20), dz = gz(24);
        a.cyl(dx, CH + 2.1, dz, 14.6, 1.6, G, GT, { ri: 12.6, seg: 32, glow: 0.45, roof: true });
        a.cyl(dx, CH + 3.7, dz, 12.8, 11.3, P1, W1, { ri: 12.5, seg: 32, ds: true, cap: false, glow: 0.5, roof: true });
        a.box(0, 0, 0, 0, 0, 0, 'urban:GlassWindowTall1a', 0xfff0c0, { size: [0.2, 6.5, 2.4], ring: { n: 16, r: 12.45, a0: 11.25 }, roof: true, p: [dx, FY + WH + 6 - FY, dz], glow: 0.95 });
        a.dome(dx, CH + 15, dz, 12.6, 14.5, G, 0xe8d090, { seg: 32, rings: 12, ds: true, roof: true, glow: 0.45 });
        a.sign('TV ES PETRVS ET SVPER HANC PETRAM', dx, CH + 2.5, dz + 12.55, 30, 1.1, '#2a2a6a', '#e8c860', 'marc', { ry: 180, roof: true });
        /* THE APSE: its gilt shell inside, the glory window over the chair, the chair's dais */
        a.dome(gx(16.4), WH - 0.4, dz, 16.6, 8.4, G, GT, { arc: 180, a0: 90, ds: true, seg: 20, roof: true, glow: 0.4 });
        a.cyl(gx(13.4), 9.5, dz, 2.6, 0.2, G, 0xffe9a0, { seg: 24, glow: 1, rx: 90 }); a.box(gx(13.5), 6.2, dz, 0.3, 6.8, 4.6, 'urban:GlassWindowTall1a', 0xffd880, { glow: 1 });
        a.box(gx(14.4), 0, dz, 4.4, 0.35, 9, 'marble_2', 0xe8dcc8, { glow: 0.3 }); a.box(gx(14.1), 0.35, dz, 3.4, 0.35, 7, 'marble_2', 0xf0e4d0, { glow: 0.3 });
        /* THE BALDACHIN over the altar: four twisted bronze columns on marble pedestals, the canopy, the orb and cross */
        [[19, 23], [20, 23], [19, 24], [20, 24]].forEach(q => { a.box(mx(q[0]), 0, mz(q[1]), 1.5, 1.6, 1.5, 'marble_2', 0xe8dcc8, { glow: 0.3 }); a.cyl(mx(q[0]), 1.6, mz(q[1]), 0.5, 8.6, G, 0x7a5a30, { seg: 10, glow: 0.35 });
            for (let k = 0; k < 6; k++) a.cyl(mx(q[0]), 2.2 + k * 1.4, mz(q[1]), 0.6, 0.35, G, 0xc8a050, { seg: 10, glow: 0.5 }); a.box(mx(q[0]), 10.2, mz(q[1]), 1.5, 0.7, 1.5, G, 0xc8a050, { glow: 0.5 }); });
        a.box(dx, 10.9, dz, 5.6, 0.8, 5.6, G, 0x7a5a30, { glow: 0.35 }); a.box(dx, 11.7, dz, 6, 0.3, 6, G, 0xc8a050, { glow: 0.5 }); a.roof('pyramid', dx, 12, dz, 4.6, 2.4, 4.6, G, 0x7a5a30, { roof: false, glow: 0.35 });
        a.dome(dx, 14.4, dz, 0.5, 0.5, G, 0xe8c860, { glow: 0.6 }); a.box(dx, 14.9, dz, 0.16, 1.5, 0.16, G, 0xe8c860, { glow: 0.6 }); a.box(dx, 15.8, dz, 0.9, 0.16, 0.16, G, 0xe8c860, { glow: 0.6 });
        a.box(dx, 0, dz, 9.4, 0.3, 9.4, 'marble_2', 0xe8dcc8, { glow: 0.3 });                                            // the altar's step
        a.box(gx(20), 0, gz(13) + 1, 14.5, 2.3, 1.7, 'wood', 0x6a4428, { glow: 0.2 }); a.box(gx(20), 2.3, gz(13) + 0.8, 15, 0.3, 1.3, G, GT, { glow: 0.45 });   // the organ's case under its pipes (north transept)
        /* THE GALLERIES: a shelf and its balustrade along each aisle's wall and round the transepts' ends, 9.6 m up, no way to them */
        [[gx(33), gz(17) + 0.9, 63, 1.4], [gx(33), gz(31) - 0.9, 63, 1.4]].forEach(q => { a.box(q[0], 9.6, q[1], q[2], 0.4, q[3], P1, W1, { glow: 0.5 }); a.box(q[0], 10, q[1] + (q[1] < gz(24) ? 0.55 : -0.55), q[2], 1, 0.2, P1, W1, { glow: 0.5 }); a.box(q[0], 9.2, q[1], q[2], 0.4, q[3] - 0.5, G, GT, { glow: 0.4 }); });
        /* the red runner up the middle aisle and the marble rounds on the floor */
        a.quad(gx(33.5), 0.04, dz, 59.5, 3.4, 'carpet_4', 0xb02a2a, { flat: true, uv: 3.5 });
    });
    [[20, 24, 4.6, 0xb89a50], [33, 24, 0, 0], [43.5, 24, 3.2, 0x9a5a4a]].forEach(q => { if (q[2]) { mark({ k: 'ring', x: gx(q[0]), z: gz(q[1]), r: q[2], w: 0.5, color: q[3], a: 0.85 }); mark({ k: 'ring', x: gx(q[0]), z: gz(q[1]), r: q[2] + 1.6, w: 0.25, color: q[3], a: 0.7 }); } });
    /* the piers and the baldachin's columns stop the walker */
    [[17, 20], [22, 20], [17, 27], [22, 27]].forEach(q => { wall(gx(q[0]), mz(q[1]), gx(q[0] + 1), mz(q[1]), FY, 6, { t: 3.4 }); });
    [[19, 23], [20, 23], [19, 24], [20, 24]].forEach(q => wall(mx(q[0]) - 0.6, mz(q[1]), mx(q[0]) + 0.6, mz(q[1]), FY, 4, { t: 1.2 }));
};
exports.dress = ctx => { const { P, at, gx, gz, mx, mz } = ctx;
    /* the nave's two rows of columns (blockers on whole squares), the pews either side of the middle aisle */
    for (let x = 25; x <= 41; x += 2) { P('greek_column', x, 20, { h: 15 }); P('greek_column', x, 27, { h: 15 }); }
    for (let x = 26; x <= 38; x += 2) { P('catholic_pew', x, 22, { face: 270 }); P('catholic_pew', x, 25, { face: 270 }); }
    /* the crossing: the altar under the dome on its dais, the four piers */
    [[17, 20], [22, 20], [17, 27], [22, 27], [19, 23], [20, 23], [19, 24], [20, 24]].forEach(q => ctx.take(q[0], q[1]));   // the piers, the baldachin's four columns (drawn, build2)
    at('stone_altar', gx(20), gz(24), { y: FY + 0.3, face: 90 }); at('candelabra', gx(20) - 1.2, gz(24) - 2.9, { y: FY + 0.3 }); at('candelabra', gx(20) - 1.2, gz(24) + 2.9, { y: FY + 0.3 }); at('meshy_bible', gx(20), gz(24), { y: FY + 1.28, face: 90 });
    P('royal_throne', 14, 23, { face: 90, h: 2.6 }); P('lectern', 23, 22, { face: 90 }); P('church_podium', 23, 25, { face: 90 });
    /* PASS 2: the side chapels along the aisles (an altar, a painting over it, two candelabra), the organ in the north transept, tombs in the
       south one, chandeliers down the nave, the narthex's stoups and ropes */
    [27, 31, 35, 39].forEach((x, i) => { P('stone_altar', x, 17, { face: 180 }); at('painting_portrait', mx(x), gz(17) + 0.62, { y: FY + 3.4, face: 180, span: 2.6 }); if (i % 2 === 0) at('candelabra', mx(x) - 1.4, gz(17) + 1.2, {});
        P('stone_altar', x, 30, { face: 0 }); at(i % 2 ? 'painting_landscape' : 'painting_portrait', mx(x), gz(31) - 0.62, { y: FY + 3.4, face: 0, span: 2.6 }); if (i % 2) at('candelabra', mx(x) + 1.4, gz(31) - 1.2, {}); });
    for (let i = 0; i < 9; i++) at('decor_organ_pipe_white', gx(20) - 6 + i * 1.5, gz(13) + 0.7, { y: FY + 2.2, h: 4 + (4 - Math.abs(i - 4)) * 0.9 });
    P('judges_bench', 20, 14, { face: 180 }); P('instrument_harp', 18, 15); P('instrument_cello', 21, 15);
    P('sarcophagus', 19, 33, { face: 90 }); P('sarcophagus', 20, 33, { face: 90 }); at('tomb_plaque', gx(20), gz(35) - 0.45, { y: FY + 2.2, face: 0 }); P('weeping_angel', 18, 31, { face: 0 }); P('weeping_angel', 21, 31, { face: 0 });
    [28, 34, 40].forEach(x => at('crystal_chandelier', gx(x), gz(24), { y: FY + 13.5, h: 3.2 }));
    P('stone_urn', 43, 19, { h: 1.4 }); P('stone_urn', 43, 28, { h: 1.4 }); [[43, 22], [43, 25]].forEach(q => P('rope_stanchion', q[0], q[1]));

    [[16, 16], [23, 16], [16, 31], [23, 31]].forEach((q, i) => P('confessional_booth', q[0], q[1], { face: i % 2 ? 270 : 90 }));
    P('angel_statue', 43, 16, { face: 270 }); P('angel_statue', 43, 31, { face: 270 });
    [[24, 18], [24, 29], [41, 18], [41, 29]].forEach(q => P('candle_ring', q[0], q[1]));
    [[19, 13.2, 180], [20, 34.8, 0]].forEach(q => at('holy_tapestry', mx(q[0]), gz(q[1]), { y: 5, face: q[2] }));
    exports.dress3(ctx);
    /* PASS 1, the figures: thirteen on the attic (the catalogue's robed `hooded_statue`, the tall `god_statue` in the middle), two on the steps' pedestals */
    for (let i = 0; i < 13; i++) at(i === 6 ? 'god_statue' : 'hooded_statue', gx(45) + 0.6, gz(24) - 32.2 + 1.6 + i * (64.4 - 3.2) / 12, { y: 1.75 + 27.4, h: i === 6 ? 4.2 : 3.2, face: 90 });
    at('god_statue', gx(46.5), gz(15.5), { y: 3, h: 5, face: 90 }); at('god_statue', gx(46.5), gz(32.5), { y: 3, h: 5, face: 90 }); ctx.take(46, 15); ctx.take(46, 32);
};
/* PASS 3, THE DRESSING. Inside: a rug, candles and a censer at each chapel, plaques between the chapels, pews in the transepts facing the
   altar, ropes round the altar's step, stoups at the doors, the pulpit. Outside: lamp posts and benches down both flanks, planters, the
   figures at the buttresses, the bell that "is ringing" on its frame by the north transept, urns round the apse. */
exports.dress3 = ctx => { const { P, at, dec, gx, gz, mx, mz, look } = ctx;
    [27, 31, 35, 39].forEach((x, i) => { [[17, 1, 180], [30, -1, 0]].forEach(q => { const z = gz(q[0] + (q[1] > 0 ? 1 : 0)) + q[1] * 1.6;
        at('psx_carpet_mp_1', mx(x), z + q[1] * 1.2, { y: FY + 0.02, face: 90 }); at('hw_candles', mx(x) - 0.7, mz(q[0]), { y: FY + 0.96 }); at('hw_candles_2', mx(x) + 0.7, mz(q[0]), { y: FY + 0.96 });
        if (i === (q[1] > 0 ? 1 : 2)) at('item_censer', mx(x), mz(q[0]) + q[1] * 0.2, { y: FY + 0.96 }); });
        if (i === 1) { at('tomb_plaque', gx(x + 2.5), gz(17) + 0.42, { y: FY + 1.4, face: 0 }); at('tomb_plaque', gx(x + 2.5), gz(31) - 0.42, { y: FY + 1.4, face: 180 }); } });
    [18, 21].forEach(x => { P('church_pew', x, 18, { face: 180 }); P('church_pew', x, 29, { face: 0 }); });
    [[18, 22], [18, 25], [22, 22], [22, 25]].forEach(q => dec('rope_stanchion', q[0], q[1]));
    at('meshy_bible', mx(23), mz(22), { y: FY + 1.18, face: 90 }); at('candelabra', gx(14.6), gz(22.2), { y: FY + 0.7 }); at('candelabra', gx(14.6), gz(25.8), { y: FY + 0.7 });
    at('banner', gx(24) + 0.5, mz(21), { y: FY + 9, face: 90, h: 5 }); at('banner', gx(24) + 0.5, mz(26), { y: FY + 9, face: 90, h: 5 });
    /* outside, the north flank (sy 12-16) and the south flank (sy 31-35) */
    [26, 30, 34, 38].forEach((x, i) => { P('iron_lamp_post', x, 14); P('iron_lamp_post', x, 33); if (i % 2) { P('iron_garden_bench', x + 2, 15, { face: 0 }); P('iron_garden_bench', x + 2, 32, { face: 180 }); } else { P('potted_plant', x + 2, 15, { h: 1.7 }); P('potted_plant', x + 2, 32, { h: 1.7 }); } });
    [[25, 16], [41, 14], [25, 31], [41, 33]].forEach((q, i) => P('hooded_statue', q[0], q[1], { h: 3, face: i < 2 ? 0 : 180 }));
    [[12, 18], [12, 29], [13, 14], [13, 33]].forEach(q => P('stone_urn', q[0], q[1], { h: 1.5 }));
    /* the bell on its timber frame (the campanile is a stump: "then what is ringing?") */
    look('bellframe', mx(14), mz(12), 0, 0, a => { a.box(-1.2, 0, 0, 0.3, 3.2, 0.3, 'wood', 0x5a3c24); a.box(1.2, 0, 0, 0.3, 3.2, 0.3, 'wood', 0x5a3c24); a.box(0, 3.2, 0, 3, 0.3, 0.4, 'wood', 0x5a3c24); a.box(-1.2, 0, 0, 0.5, 0.2, 1.6, 'wood', 0x5a3c24); a.box(1.2, 0, 0, 0.5, 0.2, 1.6, 'wood', 0x5a3c24); });
    ctx.take(14, 12); at('ships_bell', mx(14), mz(12), { y: 1.9, h: 1.3 });
    /* the steps: lamp posts at their foot, planters at the doors */
    [[47, 15], [47, 32]].forEach(q => P('iron_lamp_post', q[0], q[1]));
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 30, 18, 180, say('vatican_basilica', 'priest', 0, 'female'), { gender: 'female' });
    native('priest', 22, 23, 90, say('vatican_basilica', 'priest', 0, 'male'), { gender: 'male' });
    native('seraphim', 19, 17, 180, say('vatican_basilica', 'seraphim'));
    native('priest', 43, 21, 90, null, { gender: 'male' });
};
