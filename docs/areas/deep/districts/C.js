/* THE DEEP, district C · ATLANTIS, THE CITADEL (9 plots: P02-01 .. P04-03) — the PILOT district of the Deep zone thread (2026-11-16).
   The middle of the ring city: the island (the Agora, level 11) with the Temple of the Deep on its podium at the north end (level 12), the
   inner canal (level 7) crossed by four causeways, and the inner ring (level 10) with the Palace, the Columns, the Statues and the Obelisks.
   Read by bake-deep.js (its header lists the stages and the ctx helpers). Squares are the room's: sx 0..95, sy 0..59; the city's middle is
   the corner 42,30. The ways (the vault door, the drowned stair, the spawn) are the tool's.
   `inside(ctx)` writes the Temple's dry room (site_prebuilt_atlantis_pocket, 18 x 18 squares; its own squares 0..17, g() a line, m() a middle).
   STANDS TODAY: see the notes, docs/notes/areas-complexes.md "THE DEEP, THE CITADEL". */
'use strict';
const TEAL = 0x9fd8d0, PALE = 0xdfeeee, SEAGREEN = 0x4fa898, DARK = 0x6f8f98;

exports.plan = ctx => {
    /* THE PALACE's podium on the inner ring's north-west (the old Abyss's own, 4.7 m over its agora; here a level over the ring) */
    ctx.setRect(27, 16, 33, 20, 'B', 11);
};

exports.build = ctx => {
    const { gx, gz, cx, cz, look, feat, MB, RU } = ctx;
    /* ── THE TEMPLE OF THE DEEP: a round hall under a dome behind an eight-column porch (the podium = squares 38..45 x 20..23) ── */
    look('temple', gx(42), gz(22), 0, a => {
        /* the three great steps down to the Agora, the porch's whole width */
        a.box(0, -1.75, 7 + 1.8, 22, 0.6, 3.6, MB, PALE); a.box(0, -1.15, 7 + 1.2, 22, 0.6, 2.4, MB, PALE); a.box(0, -0.55, 7 + 0.6, 22, 0.55, 1.2, MB, PALE);
        /* the rotunda: a drum, a cornice, the dome, its lantern */
        a.cyl(0, 0, -0.6, 6.1, 9, MB, TEAL, { seg: 28 }); a.cyl(0, 9, -0.6, 6.5, 0.7, MB, PALE, { seg: 28 });
        a.dome(0, 9.7, -0.6, 6.1, 5.2, MB, SEAGREEN, { seg: 28, glow: 0.22 }); a.cyl(0, 14.7, -0.6, 0.9, 1.2, MB, PALE, { seg: 10 }); a.dome(0, 15.9, -0.6, 0.9, 0.9, null, 0xbff8f0, { glow: 1 });
        /* the porch: eight columns, the beam, the pediment (its ridge runs front to back) */
        for (let i = 0; i < 8; i++) { if (i === 3 || i === 4) { /* the two middle columns stand wider: the door between them */ } a.column(-9.8 + i * 2.8, 0, 6.1, 8, 0.5, PALE); }
        for (let i = 0; i < 2; i++) for (const s of [-1, 1]) a.column(s * 9.8, 0, 3.3 - i * 2.8, 8, 0.5, PALE);
        a.box(0, 8, 4.6, 21.2, 1.0, 4.4, MB, PALE); a.roof('gable', 0, 9, 4.6, 4.6, 2.6, 21.4, MB, TEAL, { ry: 90, keyEnd: MB });
        /* the door's surround in the drum's front */
        a.box(-2.3, 0, 5.2, 0.7, 5.2, 0.9, MB, DARK); a.box(2.3, 0, 5.2, 0.7, 5.2, 0.9, MB, DARK); a.box(0, 5.2, 5.2, 5.3, 0.8, 0.9, MB, DARK);
        /* the podium's two wings: a low wall and three stumps each side */
        for (const s of [-1, 1]) { a.box(s * 12.4, 0, -6.6, 3.2, 1.1, 0.6, MB, PALE); for (let i = 0; i < 3; i++) a.stump(s * 12.4, 0, -4.2 + i * 3.4, 1.2 + ((i * 7 + (s > 0 ? 3 : 0)) % 4) * 0.9, 0.5, PALE); }
    });
    /* ── THE AGORA's two stoas: a colonnade down each flank of the square, a beam over it ── */
    for (const s of [-1, 1]) look('stoa' + (s < 0 ? 'W' : 'E'), gx(42) + s * 19.25, gz(30), 0, a => {
        for (let i = 0; i < 9; i++) a.column(0, 0, -14 + i * 3.5, 6, 0.42, PALE);
        a.box(0, 6, 0, 1.3, 0.7, 29.4, MB, PALE);
    });
    /* ── THE PALACE (P02-01): a hall behind a front of nine metre columns; the old dome, lit from within, stands on it (a prop) ── */
    look('palace', gx(30), gz(18), 0, a => {
        for (let i = 0; i < 6; i++) a.column(-8.75 + i * 3.5, 0, 6.2, 9, 0.55, PALE);
        a.box(0, 9, 6.2, 19.6, 1.1, 1.5, MB, PALE);
        a.box(0, 0, -5.9, 20, 5.5, 1.2, MB, TEAL); a.box(-9.4, 0, 0, 1.2, 5.5, 11, MB, TEAL); a.box(9.4, 0, 0, 1.2, 5.5, 11, MB, TEAL);
    });
    /* its stair down onto the ring, toward the Agora */
    look('palacestep', gx(30), gz(20), 0, a => { a.box(0, -1.75, 1.2, 10, 0.6, 2.4, MB, PALE); a.box(0, -1.15, 0.6, 10, 0.6, 1.2, MB, PALE); });
    /* ── THE COLUMNS (P04-01): a colonnade round the inner ring's north-east, half of it fallen; the fallen lintel across the ring (a grind) ── */
    look('columns', gx(42), gz(30), 0, a => {
        for (let i = 0; i < 9; i++) { const t = (300 + i * 7.5) * Math.PI / 180, r = 16 * 3.5, x = Math.sin(t) * -r * -1, z = -Math.cos(t) * r; const X = Math.sin((30 + i * 7.5) * Math.PI / 180) * r, Z = -Math.cos((30 + i * 7.5) * Math.PI / 180) * r;
            if (i % 3 === 1) a.stump(X, 0, Z, 1.4 + (i % 4) * 0.8, 0.5, PALE); else a.column(X, 0, Z, 7, 0.5, PALE); }
    });
    feat({ k: 'wall', x0: cx(53), z0: gz(17) , x1: cx(56), z1: gz(19), h: 1.0, t: 0.7, key: MB, tint: '#eaf6f6', rail: false });
    /* ── the four causeways' lamps: a pair of crystal-topped piers at each end (the crystals are props, in dress) ── */
    [[42, 17.5, 0], [42, 42.5, 0], [29.5, 30, 90], [54.5, 30, 90]].forEach((q, i) => look('pier' + i, gx(q[0]), gz(q[1]), q[2], a => {
        for (const s of [-1, 1]) for (const e of [-1, 1]) { a.box(s * 7.6, 0, e * 4.6, 1.1, 2.6, 1.1, MB, PALE); a.box(s * 7.6, 2.6, e * 4.6, 1.5, 0.3, 1.5, MB, TEAL); }
    }));
};

exports.dress = ctx => {
    const { P, dec, swim, scatter } = ctx;
    /* THE AGORA: the four crystal pylons round its middle (lit), the statues at the temple's steps, clams and coral at the stoas' feet */
    P('crystal_cluster', 39, 27, { h: 4.5 }); P('crystal_cluster', 44, 27, { h: 4.5 }); P('crystal_cluster', 39, 32, { h: 4.5 }); P('crystal_cluster', 44, 32, { h: 4.5 });
    P('angel_statue', 38, 24, { face: 180 }); P('angel_statue', 45, 24, { face: 180 });
    [[37, 26], [37, 33], [46, 26], [46, 33]].forEach(q => dec('giant_clam', q[0], q[1]));
    [[36, 28, 'ocean_coral'], [36, 31, 'ocean_coral_5'], [47, 28, 'ocean_coral_5'], [47, 31, 'ocean_coral']].forEach(q => dec(q[2], q[0], q[1], { h: 2.6 }));
    /* THE PALACE: the old dome on its podium, the throne before it, crystals at its corners */
    P('temple_dome', 30, 18, { face: 180 }); P('royal_throne', 30, 19, { face: 180 }); P('crystal_cluster', 27, 19); P('crystal_cluster', 32, 16);
    /* THE STATUES (P02-03): a row round the inner ring's south-west */
    [[26, 36], [27, 39], [29, 42], [31, 44], [34, 45]].forEach((q, i) => P('angel_statue', q[0], q[1], { face: 45 + i * 12 }));
    /* THE OBELISKS (P04-03): two obelisks and the two pylons */
    P('obelisk', 55, 40); P('obelisk', 51, 44); P('meshy_tesla_coil', 57, 37); P('meshy_tesla_coil', 48, 45);
    /* the causeways' lamps */
    P('crystal_cluster', 39, 16); P('crystal_cluster', 44, 43);
    /* the canal: coral, weed and a chest on its bed */
    scatter('ocean_coral_3', 10, 42, 30, 12.6, 301, { r0: 37 }); scatter('ocean_seaweed_2', 18, 42, 30, 13, 302, { r0: 38 }); scatter('ocean_coral_6', 8, 42, 30, 13, 303, { r0: 38 });
    dec('sea_chest', 33, 30 - 9); dec('sea_chest', 52, 39);
    /* the life: schools in the canal, a manta and two dolphins high over the Agora, turtles, lantern jellies over the stoas */
    [[31, 24], [53, 24], [31, 36], [53, 37], [42, 18]].forEach(q => dec('fish_school', q[0], q[1]));
    swim('ocean_manta', 42, 30, 13); swim('ocean_dolphin', 36, 22, 11); swim('ocean_dolphin', 49, 37, 12); swim('ocean_turtle', 30, 30, 3); swim('ocean_turtle', 54, 28, 4);
    [[36, 26, 7], [36, 30, 8], [36, 34, 7], [47, 26, 7], [47, 30, 8], [47, 34, 7]].forEach((q, i) => swim(i % 3 === 1 ? 'ocean_moon_jelly_pulsing' : 'ocean_bioluminescent_jelly', q[0], q[1], q[2]));
    swim('ocean_clownfish', 37, 27, 1.2); swim('ocean_dory', 46, 32, 1.4); swim('ocean_fish_2', 40, 25, 2); swim('ocean_stingray', 50, 30, 1);
};

exports.people = ctx => {
    const { native, sayOf, O_ABYSS } = ctx;
    native('atlantean', 40, 29, 180, sayOf(O_ABYSS, 'atlantean', 0));     // "The road goes up to the temple."
    native('mermaid', 45, 33, 300); native('atlantean', 31, 21, 135); native('starfish', 37, 35, 60);
};

/* ── THE TEMPLE OF THE DEEP, the dry room (18 x 18 squares, the door south, the dais north, the Oracle in its pool) ── */
exports.inside = ctx => {
    const { g, m, feat, P, put, native, sayOf, O_TEMPLE, shaft, look, MB } = ctx;
    feat({ k: 'plateau', x: 0, z: g(3), w: 28, d: 14, h: 3.5, edge: 0.2 });                                   // THE DAIS
    feat({ k: 'ramp', x0: 0, z0: g(9), x1: 0, z1: g(5), w: 7, h0: 0, h1: 3.5, stairs: true, edge: 0.4 });     // its stair (four squares long, two wide: the old room's)
    feat({ k: 'pool', x: 0, z: g(13), r: 8.75, y: -0.3, depth: 0.7 });                                        // THE ORACLE POOL (waded)
    feat({ k: 'plateau', x: 0, z: g(13), r: 3.5, h: 8.4, edge: 0.6 });                                        // THE ORACLE (the tape)
    put('royal_throne', 0, g(2) + 0.5, { face: 0 });
    put('brazier', -10.5, g(5) - 1.75); put('brazier', 10.5, g(5) - 1.75);
    [[4, 10], [13, 10], [4, 15], [13, 15]].forEach(q => P('brazier', q[0], q[1]));
    [[2, 2], [15, 2], [2, 6], [15, 6]].forEach(q => P('greek_column', q[0], q[1]));
    [[2, 10], [15, 10], [2, 15], [15, 15]].forEach(q => P('greek_column', q[0], q[1], { h: 5.5 }));
    P('angel_statue', 4, 6, { face: 180 }); P('angel_statue', 13, 6, { face: 180 });
    P('crystal_cluster', 1, 8); P('crystal_cluster', 16, 8);
    put('stained_glass', 0, 0, { wall: 'w', z: -14 }); put('stained_glass', 0, 0, { wall: 'w', z: 14 }); put('stained_glass', 0, 0, { wall: 'e', z: -14 }); put('stained_glass', 0, 0, { wall: 'e', z: 14 });
    put('holy_tapestry', 0, 0, { wall: 'n', x: 0 });
    put('sea_chest', -12, g(2), { face: 30 }); put('skull_pile', 12.5, g(2));
    put('paper_sheet', 3.75, g(3), { y: 3.51, face: 140 });                                                   // the oracle's last answer, on the dais
    put('ocean_clownfish', 0, g(13), { y: -0.85, hover: 0.5, swim: { r: 5.6, v: 0.6, bob: 0.05 } }); put('ocean_dory', 0, g(13), { y: -0.85, hover: 0.5, swim: { r: 7, v: 0.7, bob: 0.05, dir: -1 } });
    put('ocean_fish_3', 0, g(13), { y: -0.85, hover: 0.5, swim: { r: 4.6, v: 0.5, bob: 0.05 } });
    put('ocean_conch', -9.6, g(13) + 2, { face: 40 }); put('ocean_starfish', 9.4, g(13) - 3); put('ocean_sand_dollar_2', 8, g(13) + 5.6);
    native('atlantean', 7, 7, 150, sayOf(O_TEMPLE, 'atlantean', 0)); native('mermaid', 5, 14, 60, sayOf(O_TEMPLE, 'mermaid', 0));
    [[-27, -14, 90], [-27, 14, 90], [27, -14, 270], [27, 14, 270]].forEach(q => shaft({ x: q[0], z: q[1], top: 11, h: 12, w: 2.8, tilt: 34, dir: q[2], color: 0xbfe8e0, intensity: 0.3 }));
};
