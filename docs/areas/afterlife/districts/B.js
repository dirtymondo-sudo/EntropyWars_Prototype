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
exports.build = ctx => { const { gx, gz, cell, W, H, wall, look } = ctx;
    const isB = (x, y) => x >= 0 && y >= 0 && x < W && y < H && cell[y][x] === 'B';
    /* THE WALLS: every side of a floor square that faces a square that is not the floor. The front (x = 45) keeps three doorways; the
       narthex opens to the nave through three more. Merged along each line, bumped as ghosts, drawn below (the apse is drawn as a curve). */
    const DOORS = { 45: [[19, 20], [23, 25], [28, 29]], 42: [[18, 20], [22, 26], [28, 30]] }, runs = [];
    const gap = (line, y) => (DOORS[line] || []).some(q => y >= q[0] && y < q[1]);
    for (let x = 12; x <= 46; x++) { let s = null; for (let y = 12; y <= 36; y++) { const on = (isB(x, y) !== isB(x - 1, y)) && !gap(x, y); if (on && s == null) s = y; if (!on && s != null) { runs.push(['v', x, s, y]); s = null; } } }
    for (let y = 12; y <= 36; y++) { let s = null; for (let x = 12; x <= 46; x++) { const on = isB(x, y) !== isB(x, y - 1); if (on && s == null) s = x; if (!on && s != null) { runs.push(['h', y, s, x]); s = null; } } }
    for (let y = 15; y < 33; y++) if (!gap(42, y) && isB(42, y) && isB(41, y)) { let e = y; while (e < 33 && !gap(42, e) && isB(41, e)) e++; runs.push(['v', 42, y, e, 1]); y = e; }   // the wall between the narthex and the nave
    runs.forEach(r => r[0] === 'v' ? wall(gx(r[1]), gz(r[2]), gx(r[1]), gz(r[3]), FY, WH) : wall(gx(r[2]), gz(r[1]), gx(r[3]), gz(r[1]), FY, WH));
    look('basilica', 0, 0, 0, 0, a => {
        runs.forEach(r => { const apse = r[0] === 'v' ? r[1] < 16 : (r[2] < 16 && r[3] <= 16); if (apse) return; const inner = r[4];
            if (r[0] === 'v') a.box(gx(r[1]), FY, (gz(r[2]) + gz(r[3])) / 2, 0.7, inner ? 12 : WH, (r[3] - r[2]) * 3.5 + 0.7, MARB, TRAV, { uv: [7, 7], glow: 0.35 });
            else a.box((gx(r[2]) + gx(r[3])) / 2, FY, gz(r[1]), (r[3] - r[2]) * 3.5 + 0.7, WH, 0.7, MARB, TRAV, { uv: [7, 7], glow: 0.35 }); });
        /* the plinth course and the cornice round the body */
        a.box(gx(33), FY + WH, gz(24), 64, 1.2, 50.4, MARB, 0xd9cdb2, { sides: true }); a.box(gx(20), FY + WH, gz(24), 29.4, 1.2, 78.4, MARB, 0xd9cdb2);
        /* THE APSE: a curved wall and its half dome */
        a.cyl(gx(16.4), FY, gz(24), 17.6, WH, MARB, TRAV, { arc: 180, a0: 90, ri: 17, ds: true, seg: 20, cap: false, uv: [7, 7] });
        a.dome(gx(16.4), FY + WH, gz(24), 17.6, 9, MARB, LEAD, { arc: 180, a0: 90, ds: true, seg: 20, roof: true });
        /* THE ROOFS: the nave's and the transepts' vaults (seen from outside; hidden with the roofs when you are in) */
        a.roof('barrel', gx(34.5), FY + WH + 1.2, gz(24), 73.5, 8, 50, MARB, LEAD, { uv: 7 });
        a.roof('barrel', gx(20), FY + WH + 1.2, gz(24), 78, 8, 28.6, MARB, LEAD, { ry: 90, uv: 7 });
        /* the ceilings from inside: a coffered gilt sheet under each */
        a.quad(gx(33), FY + WH - 0.05, gz(24), 63, 49, 'gold', 0xe8d8a8, { flat: true, ds: true, roof: true, uv: 7, glow: 0.3 });
        a.quad(gx(20), FY + WH - 0.05, gz(24), 28, 77, 'gold', 0xe8d8a8, { flat: true, ds: true, roof: true, uv: 7, glow: 0.3 });
        /* THE DOME over the crossing: the drum with its ring of paired columns, the ribbed dome, the lantern, the cross */
        const dx = gx(20), dz = gz(24), dy = FY + WH + 1.2;
        a.cyl(dx, dy, dz, 14.5, 3, MARB, TRAV, { seg: 32, roof: true }); a.cyl(dx, dy + 3, dz, 13.2, 11, MARB, TRAV, { seg: 32, roof: true });
        a.cyl(0, dy + 3, 0, 0.55, 10, MARB, 0xf4eedf, { ring: { n: 16, r: 13.9, a0: 0 }, seg: 8, roof: true, p: [dx, dy + 3, dz] });
        a.cyl(dx, dy + 14, dz, 14.4, 1.2, MARB, 0xd9cdb2, { seg: 32, roof: true });
        a.dome(dx, dy + 15.2, dz, 13.6, 15, MARB, LEAD, { seg: 32, rings: 12, roof: true });
        a.cyl(dx, dy + 29.6, dz, 2.6, 5, MARB, TRAV, { seg: 12, roof: true }); a.dome(dx, dy + 34.6, dz, 2.8, 3, MARB, LEAD, { seg: 12, roof: true });
        a.cyl(dx, dy + 37.4, dz, 0.5, 0.9, 'gold', null, { seg: 10, roof: true }); a.box(dx, dy + 38.3, dz, 0.3, 3.4, 0.3, 'gold', null, { roof: true }); a.box(dx, dy + 40.2, dz, 1.8, 0.3, 0.3, 'gold', null, { roof: true });
        /* two small domes over the transept's shoulders */
        [[25.5, 15], [25.5, 33]].forEach(q => { a.cyl(gx(q[0]), dy, gz(q[1]), 4.6, 4, MARB, TRAV, { seg: 16, roof: true }); a.dome(gx(q[0]), dy + 4, gz(q[1]), 4.8, 5, MARB, LEAD, { seg: 16, roof: true }); });
        /* THE FRONT (east, x = sx 45): eight giant columns, the entablature, the pediment over the middle, the attic and its balustrade */
        const fx = gx(45) + 0.9;
        [15.6, 18, 21.2, 22.6, 25.4, 26.8, 30, 32.4].forEach(sy => a.cyl(fx, FY, gz(sy), 1.15, 17.5, MARB, 0xffffff, { seg: 14, glow: 0.4 }));
        a.box(fx - 0.2, FY + 17.5, gz(24), 2.6, 2.4, 64, MARB, 0xf2e8d2, { glow: 0.35 }); a.box(fx - 0.6, FY + 19.9, gz(24), 1.8, 4.2, 64, MARB, TRAV, { uv: [7, 7], glow: 0.35 });
        a.roof('gable', fx - 0.3, FY + 19.9, gz(24), 22, 4.6, 2.4, MARB, 0xe2d6bc, { ry: 90, keyEnd: MARB, roof: false });
        a.box(fx - 0.6, FY + 24.1, gz(24), 2.2, 0.9, 64.6, MARB, 0xd9cdb2);
        for (let i = 0; i < 13; i++) a.box(fx - 0.6, FY + 25, gz(15.4) + i * 5.02, 0.9, 2.6, 0.9, MARB, 0xf4eedf);   // the row of figures on the attic (plain plinths: the statues NEED A MODEL)
        /* the three doorways' bronze frames and the benediction window over the middle one */
        [[19, 20], [23, 25], [28, 29]].forEach(q => { const z = (gz(q[0]) + gz(q[1])) / 2, w = (q[1] - q[0]) * 3.5; a.box(gx(45), FY + 5.6, z, 0.9, 1, w + 1, MARB, 0xcdbf9f); a.box(gx(45) - 0.1, FY + 6.6, z, 0.2, 5.5, w - 0.6, 'urban:GlassWindowTall1a', 0x33312c, { glow: 0.15 }); });
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
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 30, 18, 180, say('vatican_basilica', 'priest', 0, 'female'), { gender: 'female' });
    native('priest', 21, 22, 90, say('vatican_basilica', 'priest', 0, 'male'), { gender: 'male' });
    native('seraphim', 19, 15, 180, say('vatican_basilica', 'seraphim'));
    native('priest', 43, 21, 90, null, { gender: 'male' });
};
