/* THE VATICAN · O · THE COLOSSEUM (9 plots: columns 1-3, rows 0-2 of room `site_prebuilt_vatican_plots`, sx 12-47, sy 0-35; the map's
   district `col`, world plots -11..-9 x -9..-7, straight north of the Vatican under Mount Olympus). One thread a file
   (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js. NOTE: this district builds AFTER the Vatican's One World move, so its
   squares are the MOVED room's (the other Vatican files still build in the home frame, 36 squares further north).
   THE IDEA: the arena of the ultimate holy city, as the real one stands: an oval with an arcade round it on the ground, the stands rising in six
   tiers (the map's `e` squares, 0.875 m a step: walked), a podium wall round the sand (`p`), a gate at each end of the long axis: the north one
   (the Gate of Life, label mine) opens on the plaza the Pilgrim Way comes into, the south one (the Gate of Death, label mine) on the plaza by the
   Vatican's wall, where a flight climbs to the Pilgrim Stair's gate (the Courtyard's terrace).
   STANDS TODAY (the first build, One World phase 4.4): the outer wall (48 piers, three storeys of arches, the attic with its flag poles), the two
   gates' lions, braziers on the podium's ring, the beast cages by the Gate of Death, a chariot on the sand, benches and urns on the plaza, fighters
   on the sand and a referee.
   NOT YET: the arches' curves (straight lintels today), the awning (the velarium) over the stands, seats on the tiers, the emperor's box, the
   trapdoors in the sand, the hypogeum under it. */
'use strict';
const CX = 30, CY = 16, RX = 15.5, RY = 12.5, NP = 48;   // the oval's middle (a square corner) + its half axes in squares, the piers round it
exports.build = ctx => { const { gx, gz, look, feat, C } = ctx, cx = gx(CX), cz = gz(CY), rx = RX * C - 1.2, rz = RY * C - 1.2;
    /* THE OUTER WALL: travertine piers on the oval, three storeys of arches (straight lintels), the attic over them. One drawn row; a ghost
       wall a pier so the walker goes round (the arches between are open: the arcade is walked in from the plaza all round) */
    const pier = i => { const a = (i + 0.5) / NP * Math.PI * 2; return { a, x: Math.cos(a) * rx, z: Math.sin(a) * rz, ry: Math.atan2(-Math.cos(a) * rz, -Math.sin(a) * rx) * 180 / Math.PI }; };
    const TRAV = 'marble_2', TT = 0xe2d2b0, ST = [0, 7, 13, 19], ATTIC = 4.5;
    look('outer_wall', cx, cz, 0, 0, a => {
        for (let i = 0; i < NP; i++) { const p = pier(i), q = pier((i + 1) % NP), mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, len = Math.hypot(q.x - p.x, q.z - p.z), ry = Math.atan2(-(q.z - p.z), q.x - p.x) * 180 / Math.PI;
            const ux = (q.x - p.x) / len, uz = (q.z - p.z) / len, open = len - 2.6;   // (along the bay; the opening between two piers)
            a.box(p.x, 0, p.z, 2.6, ST[3], 2.4, TRAV, TT, { ry: p.ry, glow: 0.25 });                                          // the pier, ground to the attic
            [1, 2, 3].forEach(s => { a.box(mx, ST[s] - 1.7, mz, len, 1.7, 2.2, TRAV, TT, { ry, glow: 0.25 });                // a storey's arch band over the opening
                [-1, 1].forEach(k => a.box(mx + ux * k * (open / 2 - 0.45), ST[s] - 2.5, mz + uz * k * (open / 2 - 0.45), 0.9, 0.8, 2.0, TRAV, TT, { ry, glow: 0.25 })); });   // the arch's shoulders (a stepped arch)
            [1, 2].forEach(s => a.box(mx, ST[s], mz, len, 1.0, 0.6, TRAV, 0xd6c6a2, { ry, glow: 0.2 }));                       // the parapet of the storey above
            a.box(mx, ST[3], mz, len + 0.2, ATTIC, 1.6, TRAV, 0xd8c8a6, { ry, glow: 0.25 });                                   // THE ATTIC: a solid band
            if (i % 2 === 0) a.box(mx, ST[3] + ATTIC * 0.4, mz, 1.0, 1.4, 1.7, TRAV, 0x8a7a62, { ry, glow: 0.1 });            // its windows (dark panels)
            a.box(p.x, ST[3], p.z, 0.9, ATTIC, 1.9, TRAV, 0xeadcc0, { ry: p.ry, glow: 0.25 });                                // a pilaster on the attic
            a.box(mx, ST[3] + ATTIC, mz, len + 0.4, 0.5, 2.0, TRAV, 0xeadcc0, { ry, glow: 0.25 });                            // the cornice
            feat({ k: 'wall', absY: true, x0: Math.round((cx + p.x - 1.2) * 100) / 100, z0: Math.round((cz + p.z) * 100) / 100, x1: Math.round((cx + p.x + 1.2) * 100) / 100, z1: Math.round((cz + p.z) * 100) / 100, t: 2.2, h: 4, y: 4, ghost: true, rail: false }); }
    });
    /* THE PODIUM'S PARAPET: a low marble rail on the podium wall's top, all round the sand but the two gates */
    look('podium_rail', cx, cz, 0, 3.5, a => { const n = 36, pr = 0.515, prx = RX * C * pr, prz = RY * C * pr;
        for (let i = 0; i < n; i++) { const t0 = i / n * Math.PI * 2, t1 = (i + 1) / n * Math.PI * 2, x0 = Math.cos(t0) * prx, z0 = Math.sin(t0) * prz, x1 = Math.cos(t1) * prx, z1 = Math.sin(t1) * prz;
            if (Math.abs(x0 + x1) / 2 < 4.5) continue;   // (the two gates)
            a.box((x0 + x1) / 2, 0, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) + 0.1, 1.0, 0.45, 'marble_light', 0xf0e8d8, { ry: Math.atan2(-(z1 - z0), x1 - x0) * 180 / Math.PI, glow: 0.3 }); } });
    /* THE GATES' ARCHES: a deeper arch at each end of the long axis, over the way through the stands */
    [[CY - RY * 0.72, 'n'], [CY + RY * 0.72, 's']].forEach(([y, k]) => look('gate_' + k, gx(CX), gz(y), 0, 0, a => {
        a.box(-4.4, 0, 0, 1.6, 7, 3.4, TRAV, TT, { glow: 0.25 }); a.box(4.4, 0, 0, 1.6, 7, 3.4, TRAV, TT, { glow: 0.25 }); a.box(0, 5.6, 0, 10.4, 1.6, 3.4, TRAV, TT, { glow: 0.25 }); }));
};
exports.dress = ctx => { const { P, dec, cell } = ctx;
    /* the two gates: a lion each side, outside on the plaza */
    P('lion_statue', 28, 1, { face: 180 }); P('lion_statue', 31, 1, { face: 180 });
    P('lion_statue', 27, 30, { face: 0 }); P('lion_statue', 32, 30, { face: 0 });
    /* braziers on the sand's edge, round the oval */
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2, x = Math.floor(CX + Math.cos(a) * RX * 0.42), y = Math.floor(CY + Math.sin(a) * RY * 0.42); if (cell[y][x] === 'a') P('brazier', x, y); }
    /* the sand: a chariot, two weapon racks */
    P('chariot', 24, 15, { face: 90 }); P('dojo_weapon_rack', 27, 20, { face: 0 }); P('dojo_weapon_rack', 32, 20, { face: 0 });
    /* the beast cages by the Gate of Death, on the plaza */
    P('cage_wagon', 22, 31, { face: 90 }); P('cage_wagon', 37, 31, { face: 270 });
    /* the plaza: benches, urns, amphorae, flag poles at the four corners of the oval */
    [[15, 3], [44, 3], [15, 31], [44, 28]].forEach(q => P('flag_pole', q[0], q[1]));
    [[20, 2, 180], [39, 2, 180], [14, 16, 90], [45, 16, 270], [20, 33, 0]].forEach(q => P('park_bench', q[0], q[1], { face: q[2] }));
    [[16, 6], [43, 6], [16, 26], [43, 25], [24, 33], [36, 33]].forEach(q => P('stone_urn', q[0], q[1]));
    [[14, 9], [45, 9], [14, 23], [45, 22], [26, 2], [34, 2]].forEach(q => dec('greek_amphora', q[0], q[1]));
};
exports.people = ctx => { const { native } = ctx;
    /* the fighters on the sand and their referee; a ringmaster at the Gate of Life; the plaza's crowd (units named after their race) */
    native('swordfighter', 27, 16, 90, null, { gender: 'male' }); native('minotaur', 33, 16, 270);
    native('luchador', 30, 12, 180); native('referee', 30, 19, 0);
    native('ringmaster', 32, 3, 180); native('quarterback', 18, 29, 45); native('pope', 38, 34, 0);
};
