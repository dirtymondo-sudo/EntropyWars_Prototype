/* OUTER SPACE · MARS · district V · THE CANYON (5 plots).
   A cut across the whole map, 5.25 m deep, four squares wide: ways down at its west end, its east end (THE CANYON MOUTH) and in the middle
   from the south plain; THE ARCH passes over it; THE CANALS (label mine) are three dead-straight cuts off it.
   Squares are Mars' own (sx 0..59, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the cut, its three ramps, crystals and stones on its floor, a camp fire, the Droid.
   NOT YET (for the district thread): anything in the canals (dry today: ice? the game has `ice`); caves in the walls; the canyon mouth's
   fan; lights; a reason to walk its length. */
'use strict';
exports.dress = (c) => {
    [[10, 29], [18, 28], [30, 27], [38, 28], [47, 29], [52, 30]].forEach(q => c.dec('cave_stone', q[0], q[1]));
    c.P('crystal_cluster', 14, 30); c.P('crystal_cluster', 34, 26); c.P('crystal_cluster', 50, 24);
    c.P('campfire', 26, 29); c.dec('cot', 27, 28); c.dec('sea_chest', 25, 28);
};
exports.people = (c) => {
    c.native('droid', 28, 29, 270);                               // its home
    c.native('martian', 44, 28, 90);
};
