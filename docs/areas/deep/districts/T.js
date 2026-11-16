/* THE DEEP, district T · THE TRENCH (10 plots: P06-00 .. P07-04) — first build by the Deep zone thread (2026-11-16). East of the city the floor
   falls 14 m in two drops: the lip and the Shelf (level 8 to 5), the first floor (level 2) with its rock spires, the Bottom (level 0), the far
   wall. The smokers (the Vents), the Bones, the things with lights.
   Read by bake-deep.js (its header lists the stages and the ctx helpers). Squares are the room's.
   STANDS TODAY + NOT YET: docs/notes/areas-complexes.md "THE DEEP ON PLOTS". */
'use strict';
exports.build = ctx => {
    const { scatter } = ctx;
    scatter('ocean_rock_3', 6, 82, 30, 6, 201); scatter('ocean_rock_4', 6, 90, 40, 5, 202); scatter('ocean_rock_5', 5, 84, 50, 5, 203); scatter('ocean_rock_7', 5, 90, 8, 4, 204);
};
exports.dress = ctx => {
    const { P, dec, swim } = ctx;
    /* THE VENTS (P07-01): the smokers on their mound */
    P('sea_vent', 90, 18); P('sea_vent', 88, 17); P('sea_vent', 91, 20); P('sea_vent', 92, 16); P('sea_vent', 89, 20);
    /* THE BONES (P06-04): the great skeleton on the floor, skulls */
    P('dinosaur_skeleton', 81, 54, { face: 70 }); dec('skull_pile', 83, 51); dec('skull_pile', 79, 56); dec('psx_fish_skeleton_mp_1', 82, 57);
    /* THE BOTTOM (P07-02) + THE DARK: the kraken's black tendrils, crystals in the rock */
    [[90, 27], [92, 30], [89, 32], [93, 33]].forEach(q => P('goo_tendril', q[0], q[1], { h: 4.5 }));
    P('crystal_cluster', 87, 4); P('crystal_cluster', 92, 44); P('crystal_cluster', 81, 26);
    /* the things with lights */
    swim('ocean_anglerfish', 89, 6, 3); swim('ocean_anglerfish_dim', 91, 10, 5); swim('ocean_anglerfish_jaws', 90, 38, 2); swim('ocean_anglerfish', 92, 42, 4); swim('ocean_anglerfish_dim', 88, 46, 3); swim('ocean_anglerfish_jaws', 84, 12, 3);
    [[83, 24, 6], [86, 36, 8], [90, 48, 6], [81, 44, 9], [88, 28, 11], [92, 52, 5], [84, 5, 7], [79, 34, 10]].forEach((q, i) => swim(i % 2 ? 'ocean_moon_jelly_pulsing' : 'ocean_bioluminescent_jelly', q[0], q[1], q[2]));
    swim('ocean_squid', 90, 30, 6); swim('ocean_squid', 86, 20, 5); swim('ocean_eel', 83, 40, 1); swim('ocean_eel', 91, 55, 1); swim('ocean_shark', 80, 30, 12); swim('ocean_whale', 84, 30, 22);
    /* the lip: a chest somebody dropped, anemones */
    dec('sea_chest', 78, 6); dec('anemone', 74, 20); dec('anemone', 75, 36); dec('anemone', 74, 48);
};
exports.people = ctx => { const { native, sayOf, O_ABYSS } = ctx;
    native('mermaid', 73, 27, 90, sayOf(O_ABYSS, 'mermaid', 0));                                 // "Do not go in the trench."
    native('kraken', 91, 31, 270, sayOf(O_ABYSS, 'kraken', 0));                                  // "THE SHIP."
    native('deep sea fish', 88, 22, 200); native('deep sea fish', 85, 48, 20); native('kaiju', 92, 8, 180); };
