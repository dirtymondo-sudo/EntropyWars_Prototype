/* THE DEEP, district S · THE SEA FLOOR (9 plots: the west column P00-00 .. P00-04 and the four corners of the city's square) — first build by the
   Deep zone thread (2026-11-16). What the old Abyss scattered over its floor, each on a plot of its own: the Kelp Forest, the Wreck (the Dutchman
   below, her hatch = the tool's link), the open Sea Floor, the Upwelling (the tool's link, under the Triangle's Maelstrom), the Reef Wall, the
   Station and its bathyscaphe, the Spire, the Dunes, the Drowned Circle.
   Read by bake-deep.js (its header lists the stages and the ctx helpers). Squares are the room's.
   STANDS TODAY + NOT YET: docs/notes/areas-complexes.md "THE DEEP ON PLOTS". */
'use strict';
exports.build = ctx => {
    const { gx, gz, cx, cz, look, feat, MB, scatter } = ctx;
    /* THE STATION (P01-00): the deck is a block of the height map (squares 15..17 x 3..5, 3.5 m); its rail, its legs' feet, its mast */
    feat({ k: 'rail', x0: gx(15), z0: gz(3), x1: gx(18), z1: gz(3) }); feat({ k: 'rail', x0: gx(15), z0: gz(3), x1: gx(15), z1: gz(6) });
    look('station', gx(16.5), gz(4.5), 0, a => { a.box(0, 0, 0, 4.2, 2.6, 3.4, 'urban:MetalCorrugated1a', 0x8aa0a8); a.roof('shed', 0, 2.6, 0, 4.6, 0.5, 3.8, 'urban:MetalCorrugated1a', 0x5f7880); a.cyl(4.2, 0, -4.2, 0.12, 6, null, 0x9aa8b0); a.dome(4.2, 6, -4.2, 0.3, 0.3, null, 0xff5040, { glow: 1 });
        a.box(0, 0.9, 1.75, 1.6, 1.1, 0.08, 'urban:GlassWindowTall1a', 0x8fd8e8, { glow: 0.5 }); });
    /* THE KELP FOREST (P00-00) */
    scatter('kelp', 120, 6, 6, 6.4, 11); scatter('ocean_seaweed', 14, 6, 6, 6.4, 48); scatter('ocean_seaweed_2', 20, 6, 6, 6.4, 49);
    /* THE REEF WALL (P00-04, P01-04's south): coral all along the ridge */
    [[4, 56], [9, 57], [14, 55], [19, 52]].forEach((q, i) => { scatter('ocean_coral', 7, q[0], q[1], 3, 60 + i); scatter('ocean_coral_3', 5, q[0], q[1], 3, 70 + i); scatter('ocean_coral_5', 6, q[0], q[1], 3, 80 + i); scatter('ocean_coral_6', 5, q[0], q[1], 3, 90 + i); scatter('anemone', 8, q[0], q[1], 3, 100 + i); });
    /* the open floor: rocks and weed */
    scatter('ocean_rock_3', 4, 6, 30, 6, 51); scatter('ocean_rock_4', 4, 17, 52, 6, 52); scatter('ocean_rock', 5, 66, 8, 5, 53); scatter('ocean_seaweed_2', 12, 6, 30, 6, 54); scatter('ocean_rock_2', 5, 66, 52, 6, 55);
};
exports.dress = ctx => {
    const { P, dec, swim } = ctx;
    P('submarine', 20, 4, { face: 90 });                                                         // THE BATHYSCAPHE, moored off the station (first: its lamp keeps under the light cap)
    dec('paper_sheet', 16, 4, { y: 0.01, face: 140 });                                           // the station's log, dissolving
    P('gate_valve', 17, 5); P('scba_rack', 15, 5, { face: 90 });
    /* THE WRECK (P00-01): the Dutchman below, on her side; her gear spilled round her */
    P('ship_wreck', 5, 17, { face: 350 }); P('ship_anchor', 9, 15, { face: 60 }); P('ship_cannon', 3, 20, { face: 200 }); P('ship_cannon', 8, 21, { face: 130 }); dec('sea_chest', 6, 20); dec('sea_chest', 10, 19); dec('skull_pile', 4, 14); P('ship_wheel', 2, 16, { face: 80 }); dec('ships_bell', 9, 20);
    swim('ocean_shark', 5, 17, 7); swim('ocean_hammerhead', 9, 22, 5);
    /* THE KELP FOREST: the humpback over it, small fish in it */
    swim('ocean_humpback', 8, 8, 12); swim('ocean_fish', 4, 5, 1); swim('ocean_fish_3', 8, 9, 1.5); swim('ocean_clownfish', 5, 9, 1); swim('ocean_turtle', 9, 4, 3);
    /* THE SEA FLOOR (P00-02): the road's lamps, schools, a ray */
    P('crystal_cluster', 3, 28); P('crystal_cluster', 9, 31); dec('fish_school', 5, 26); dec('fish_school', 8, 33); swim('ocean_stingray', 6, 32, 1); swim('ocean_manta', 5, 27, 8); swim('ocean_dolphin', 9, 34, 10);
    dec('ocean_starfish', 2, 31); dec('ocean_conch', 10, 27); dec('ocean_crab', 4, 33); dec('ocean_lobster', 7, 25);
    /* THE UPWELLING (P00-03): the jelly bloom up the way down from the Triangle */
    [[5, 41, 4], [7, 43, 7], [6, 40, 10], [4, 43, 13], [8, 41, 16], [5, 44, 19], [7, 40, 22], [6, 43, 25]].forEach((q, i) => swim(['ocean_bioluminescent_jelly', 'ocean_moon_jelly_pulsing', 'ocean_box_jelly', 'ocean_moon_jelly'][i % 4], q[0], q[1], q[2]));
    P('sea_buoy', 3, 39); dec('giant_clam', 9, 45);
    /* THE REEF WALL: clownfish, an eel, an octopus */
    swim('ocean_clownfish', 5, 55, 3); swim('ocean_dory', 12, 56, 3.5); swim('ocean_eel', 16, 54, 2.5); swim('ocean_octopus', 8, 57, 3); swim('ocean_fish_2', 3, 54, 4); dec('fish_school', 10, 52);
    /* THE SPIRE (P05-00): a tuna round it */
    swim('ocean_tuna', 66, 6, 9); swim('ocean_shark', 64, 9, 6); dec('ocean_starfish', 65, 8);
    /* THE DUNES (P01-04): crabs, a lobster, shells */
    dec('ocean_crab', 15, 50); dec('ocean_crab', 20, 56); dec('ocean_lobster', 17, 58); dec('ocean_conch', 22, 51); dec('ocean_sand_dollar_2', 14, 55); swim('ocean_stingray', 18, 53, 0.8);
    /* THE DROWNED CIRCLE (P05-04): eight stones on the mound, an octopus among them */
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P(i % 4 === 0 ? 'sarsen' : 'menhir', Math.round(65.5 + 2.8 * Math.cos(a)), Math.round(54.5 + 2.6 * Math.sin(a)), { face: Math.round(i * 45) }); }
    swim('ocean_octopus', 66, 55, 0.5); swim('ocean_squid', 68, 51, 5);
};
exports.people = ctx => { const { native, sayOf, O_ABYSS } = ctx;
    native('atlantean', 18, 7, 200, sayOf(O_ABYSS, 'atlantean', 1));                             // "The bathyscaphe is Records'."
    native('sharkman', 11, 17, 250); native('jellyfish', 9, 40, 300); native('deep sea fish', 3, 44, 40); native('mermaid', 12, 53, 0); native('pirate', 7, 14, 160); };
