/* OUTER SPACE · SATURN · district G · THE RING SHARD (4 plots).
   The east rim under the rings: THE DOCKING SHELF (the ship's collar), THE RING SHARD (a splinter of ring ice fallen across the rim, 7 m,
   never climbed), THE RING PLANE (label mine: fallen ring ice on the south-east rim).
   Squares are Saturn's own (sx 0..47, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the shard (terrain in the ice sheet), asteroids and crystals fallen from the rings, the shelf's lights, the android.
   NOT YET (for the district thread): the shard is blocks of ice, not a splinter (NEEDS A MODEL); the rings overhead; the collar's
   frame; the square ice grain the grey talks about. */
'use strict';
exports.dress = (c) => {
    c.P('flood_mast', 33, 7); c.P('flood_mast', 27, 8); c.P('signpost', 26, 10, { face: 180 }); c.P('dish', 29, 6, { face: 220 });
    c.P('asteroid_a', 40, 24, { face: 30 }); c.P('asteroid_b', 37, 31, { face: 200 }); c.P('asteroid_a', 34, 10, { face: 110 });
    [[39, 16], [39, 20], [40, 27], [36, 33]].forEach(q => c.P('crystal_cluster', q[0], q[1]));
    c.P('lunar_lander', 31, 9, { face: 250 }); c.dec('iso_tank', 28, 7);
};
exports.people = (c) => {
    c.native('android', 24, 7, 180, c.sayOf('android', 0));       // "The collar seals. Then the ship is here or it is not."
    c.native('grey', 38, 28, 270);
};
