/* THE DEEP, district R · ATLANTIS, THE RINGS (12 plots: the outer ring of the city's square, without its four corners) — first build by the
   Deep zone thread (2026-11-16). The outer canal (level 7), the outer ring (level 9), the city wall (level 13, 7 m of marble) and its four
   gates; on the ring: the Drowned Houses, the Market, the Theatre, the Gardens, the Workshops, the Harbour, the Baths, the Graves.
   Read by bake-deep.js (its header lists the stages and the ctx helpers). Squares are the room's; the city's middle is the corner 42,30.
   STANDS TODAY: the four gate houses, eleven roofless houses, the Market's stoa, the Theatre's seats, the Baths' two basins and round hall,
   the Workshops' two halls, the Graves, the Harbour's gear, coral in the Gardens. NOT YET: see docs/notes/areas-complexes.md "THE DEEP ON PLOTS". */
'use strict';
const PALE = 0xdfeeee, TEAL = 0x9fd8d0, DARK = 0x6f8f98;
exports.plan = ctx => {
    /* THE BATHS (P02-04): two basins sunk a level into the ring */
    ctx.setRect(27, 50, 30, 53, 'c', 8); ctx.setRect(32, 52, 35, 55, 'c', 8);
};
exports.build = ctx => {
    const { gx, gz, cx, cz, look, feat, MB } = ctx;
    /* the four gates: two towers and a beam over the road (the wall is 7 m; the towers 10) */
    [['N', 42, 2, 0], ['S', 42, 58, 0], ['W', 14, 30, 90], ['E', 70, 30, 90]].forEach(q => look('gate' + q[0], gx(q[1]), gz(q[2]), q[3], a => {
        const big = q[0] === 'S' ? 1.25 : 1;
        for (const s of [-1, 1]) { a.box(s * 8.9, 0, 0, 3.4, 10 * big, 5.2, MB, PALE); a.box(s * 8.9, 10 * big, 0, 4, 0.6, 5.8, MB, TEAL); a.column(s * 6.4, 0, 3.2, 7, 0.5, PALE); a.column(s * 6.4, 0, -3.2, 7, 0.5, PALE); }
        a.box(0, 7, 0, 14.4, 1.4, 4.4, MB, PALE); a.roof('gable', 0, 8.4, 0, 14.6, 2.2 * big, 4.8, MB, TEAL, { keyEnd: MB });
    }));
    /* THE DROWNED HOUSES (P02-00) and the south-west run (P01-03's edge): roofless houses, their walls broken at different heights */
    const house = (id, sx, sy, w, d, hs) => { const x0 = gx(sx), z0 = gz(sy), x1 = gx(sx + w), z1 = gz(sy + d), W = (a, b, c, e, h) => feat({ k: 'wall', x0: a, z0: b, x1: c, z1: e, h, t: 0.5, key: MB, tint: '#d9e8e6', rail: false });
        W(x0, z0, x1, z0, hs[0]); W(x1, z0, x1, z1, hs[1]); W(x0, z1, (x0 + x1) / 2 - 1, z1, hs[2]); W((x0 + x1) / 2 + 1, z1, x1, z1, hs[2]); W(x0, z0, x0, z1, hs[3]); };
    [[25, 7, 2, 2, [3.2, 2.1, 2.8, 1.2]], [28, 5, 2, 2, [1.4, 3.0, 2.2, 3.1]], [31, 4, 3, 2, [3.4, 2.6, 1.1, 2.9]], [35, 3, 2, 2, [2.2, 3.2, 3.0, 1.6]], [29, 9, 2, 2, [2.9, 1.3, 2.4, 3.3]], [33, 8, 2, 2, [1.8, 2.7, 3.1, 2.2]], [36, 7, 2, 2, [3.0, 3.0, 1.5, 2.5]],
     [17, 40, 2, 2, [2.6, 3.1, 1.9, 2.8]], [19, 44, 2, 2, [3.2, 1.5, 2.7, 2.0]]].forEach((q, i) => house('h' + i, q[0], q[1], q[2], q[3], q[4]));
    /* THE MARKET (P04-00): a stoa of ten columns under a long roof, stall tables before it */
    look('market', gx(54), gz(6), 0, a => { for (let i = 0; i < 10; i++) { a.column(-15.75 + i * 3.5, 0, 2.2, 5, 0.4, PALE); } a.box(0, 0, -2.4, 33, 5, 0.6, MB, TEAL); a.box(0, 5, 0, 34, 0.6, 6, MB, PALE); a.roof('shed', 0, 5.6, 0, 34, 1.6, 6.2, MB, DARK);
        for (let i = 0; i < 5; i++) a.box(-12 + i * 6, 0, 6.2, 3, 0.9, 1.3, MB, PALE); });
    /* THE THEATRE (P01-01): four tiers of seats in a half ring facing the city, a low stage */
    look('theatre', gx(19), gz(18), 60, a => { for (let i = 0; i < 4; i++) a.cyl(0, 0, 0, 13 - i * 2.4, 0.9 + i * 0.0 + (3 - i) * 0.9, MB, i % 2 ? PALE : TEAL, { ri: 10.6 - i * 2.4, arc: 180, a0: 90, seg: 28, cap: true });
        a.box(0, 0, 3.4, 12, 0.7, 4, MB, PALE); a.column(-5, 0.7, 4.8, 5, 0.4, PALE); a.column(5, 0.7, 4.8, 5, 0.4, PALE); });
    /* THE BATHS (P02-04): a round hall with a dome by the two basins */
    look('baths', gx(31), gz(48), 0, a => { a.cyl(0, 0, 0, 5, 4.4, MB, TEAL, { seg: 20, ri: 4.5, arc: 300, a0: 30 }); a.dome(0, 4.4, 0, 5, 3.4, MB, 0x4fa898, { seg: 20 }); for (let i = 0; i < 6; i++) a.column(Math.sin(i * 1.047) * 6.6, 0, Math.cos(i * 1.047) * 6.6, 4.4, 0.35, PALE); });
    /* THE WORKSHOPS (P05-01): two low halls with gable roofs, open fronts */
    [[63, 15, 20], [61, 21, 35]].forEach((q, i) => look('shop' + i, gx(q[0]), gz(q[1]), q[2], a => { a.box(0, 0, -3, 12, 4, 0.6, MB, TEAL); a.box(-5.7, 0, 0, 0.6, 4, 6.6, MB, TEAL); a.box(5.7, 0, 0, 0.6, 4, 6.6, MB, TEAL); for (let k = 0; k < 4; k++) a.column(-4.5 + k * 3, 0, 3, 4, 0.35, PALE); a.roof('gable', 0, 4, 0, 12.6, 2, 7.2, MB, DARK, { keyEnd: MB }); }));
    /* THE GRAVES (P04-04): a row of stelae along the wall */
    look('stelae', gx(54), gz(53), 20, a => { for (let i = 0; i < 7; i++) a.box(-10.5 + i * 3.5, 0, 0, 1.1, 1.6 + (i * 5 % 3) * 0.5, 0.35, MB, i % 2 ? PALE : DARK); });
};
exports.dress = ctx => {
    const { P, dec, swim, scatter } = ctx;
    /* the gates' lamps */
    P('crystal_cluster', 39, 4); P('crystal_cluster', 44, 55); P('crystal_cluster', 16, 27); P('crystal_cluster', 67, 32);
    /* the Market: amphorae and urns on and round the stalls */
    [[50, 8], [52, 8], [54, 8], [56, 8], [58, 8]].forEach((q, i) => dec(i % 2 ? 'stone_urn' : 'greek_amphora', q[0], q[1])); dec('greek_amphora', 49, 6); dec('greek_amphora', 59, 7); dec('stone_urn', 55, 10);
    /* the Drowned Houses: what was left indoors */
    dec('greek_amphora', 25, 7); dec('stone_urn', 31, 4); dec('sea_chest', 35, 3); dec('greek_amphora', 33, 8); dec('stone_urn', 29, 9);
    /* the Gardens (P01-03): coral where the beds were, clams, anemones */
    scatter('ocean_coral', 9, 20, 41, 4.5, 401); scatter('ocean_coral_5', 8, 21, 43, 4.5, 402); scatter('ocean_coral_3', 6, 19, 39, 4, 403); scatter('anemone', 12, 20, 42, 5, 404); dec('giant_clam', 18, 38); dec('giant_clam', 22, 45);
    P('decor_stone_arch', 20, 37, { h: 4.5, face: 30 });
    /* the Harbour (P05-03): the old docks' gear on the canal's rim */
    P('ship_anchor', 63, 41, { face: 40 }); dec('sea_chest', 61, 43); dec('sea_chest', 64, 44); P('mooring_bollard', 60, 40); P('mooring_bollard', 62, 44); dec('greek_amphora', 65, 40); P('rowboat', 60, 46, { face: 70 });
    /* the Graves (P04-04): the sarcophagus, two more, skulls, a statue */
    P('sarcophagus', 52, 51, { face: 20 }); P('sarcophagus', 56, 50, { face: 200 }); dec('skull_pile', 54, 51); dec('skull_pile', 58, 52); P('angel_statue', 50, 53, { face: 0 });
    /* the Baths: urns by the basins */
    dec('stone_urn', 30, 54); dec('greek_amphora', 36, 52); P('lion_statue', 26, 51, { face: 90 });
    /* the Workshops: the crystal works */
    P('crystal_cluster', 64, 18, { h: 2.4 }); dec('stone_urn', 60, 17); dec('greek_amphora', 62, 23);
    /* the Theatre: a bust on the stage */
    P('marble_bust', 20, 20);
    /* the outer canal: weed and coral on its bed, schools along it */
    scatter('ocean_seaweed', 20, 42, 30, 20.5, 411, { r0: 64 }); scatter('ocean_coral_6', 12, 42, 30, 20.5, 412, { r0: 64 }); scatter('ocean_seaweed_2', 16, 42, 30, 20.5, 413, { r0: 64 });
    [[22, 14], [62, 14], [22, 46], [62, 46], [42, 10], [42, 50]].forEach(q => dec('fish_school', q[0], q[1]));
    swim('ocean_turtle', 27, 12, 4); swim('ocean_tuna', 58, 12, 6); swim('ocean_stingray', 56, 46, 1.2); swim('ocean_octopus', 53, 52, 0.6); swim('ocean_eel', 30, 51, 1); swim('ocean_fish', 22, 30, 3); swim('ocean_brown_fish', 62, 30, 3);
    swim('ocean_moon_jelly', 42, 5, 9); swim('ocean_moon_jelly', 42, 55, 9); swim('ocean_box_jelly', 17, 30, 9); swim('ocean_box_jelly', 67, 30, 9);
};
exports.people = ctx => { const { native } = ctx; native('atlantean', 43, 53, 0); native('mermaid', 22, 40, 90); native('atlantean', 52, 9, 180); native('starfish', 62, 42, 270); native('siren', 19, 22, 120); };
