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
exports.build = ctx => { const { gx, gz, cell, W, H, wall, look, door } = ctx;
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
        a.quad(gx(33), FY + WH - 0.05, gz(24), 63, 49, 'gold', 0xe8d8a8, { flat: true, ds: true, roof: true, uv: 7, glow: 0.3 });
        a.quad(gx(20), FY + WH - 0.05, gz(24), 28, 77, 'gold', 0xe8d8a8, { flat: true, ds: true, roof: true, uv: 7, glow: 0.3 });
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
exports.dress = ctx => { const { P, at, gx, gz, mx, mz } = ctx;
    /* the nave's two rows of columns (blockers on whole squares), the pews either side of the middle aisle */
    for (let x = 25; x <= 41; x += 2) { P('greek_column', x, 20, { h: 15 }); P('greek_column', x, 27, { h: 15 }); }
    for (let x = 26; x <= 38; x += 2) { P('catholic_pew', x, 22, { face: 270 }); P('catholic_pew', x, 25, { face: 270 }); }
    /* the crossing: the altar under the dome on its dais, the four piers */
    P('stone_altar', 20, 24, { face: 90 }); [[17, 20], [22, 20], [17, 27], [22, 27]].forEach(q => P('greek_column', q[0], q[1], { h: 20 }));
    P('royal_throne', 14, 22, { face: 90 }); P('lectern', 23, 22, { face: 90 }); P('church_podium', 23, 26, { face: 90 });
    [[17, 14], [22, 14], [17, 33], [22, 33]].forEach((q, i) => P('confessional_booth', q[0], q[1], { face: i < 2 ? 180 : 0 }));
    P('angel_statue', 43, 16, { face: 270 }); P('angel_statue', 43, 31, { face: 270 });
    [[24, 18], [24, 29], [41, 18], [41, 29], [18, 22], [18, 26]].forEach(q => P('brazier', q[0], q[1]));
    for (let x = 27; x <= 39; x += 4) { at('stained_glass', mx(x), gz(17) + 0.5, { y: 8, face: 180 }); at('stained_glass', mx(x), gz(31) - 0.5, { y: 8, face: 0 }); }
    [[19, 13.2, 180], [20, 34.8, 0]].forEach(q => at('holy_tapestry', mx(q[0]), gz(q[1]), { y: 5, face: q[2] }));
    /* PASS 1, the figures: thirteen on the attic (the catalogue's robed `hooded_statue`, the tall `god_statue` in the middle), two on the steps' pedestals */
    for (let i = 0; i < 13; i++) at(i === 6 ? 'god_statue' : 'hooded_statue', gx(45) + 0.6, gz(24) - 32.2 + 1.6 + i * (64.4 - 3.2) / 12, { y: 1.75 + 27.4, h: i === 6 ? 4.2 : 3.2, face: 90 });
    at('god_statue', gx(46.5), gz(15.5), { y: 3, h: 5, face: 90 }); at('god_statue', gx(46.5), gz(32.5), { y: 3, h: 5, face: 90 }); ctx.take(46, 15); ctx.take(46, 32);
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 30, 18, 180, say('vatican_basilica', 'priest', 0, 'female'), { gender: 'female' });
    native('priest', 21, 22, 90, say('vatican_basilica', 'priest', 0, 'male'), { gender: 'male' });
    native('seraphim', 19, 15, 180, say('vatican_basilica', 'seraphim'));
    native('priest', 43, 21, 90, null, { gender: 'male' });
};
