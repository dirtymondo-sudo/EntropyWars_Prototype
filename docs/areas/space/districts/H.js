/* OUTER SPACE · SATURN · district H · THE HEXAGON (12 plots).
   A six-sided plateau inside six STORM WALLS: THE RIM WALK round it (3.5 m up, four ramps down), THE EYE sunk in its middle (the storm's
   own eye: nobody stands on its floor), THE CAMP upwind on the west rim, THE DROP'S FRAME on the west rim (to the Singularity), THE
   AIRLOCK (the bay's door) on the south rim.
   Squares are Saturn's own (sx 0..47, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the forms (the tool's heights), the camp, crystals round the Eye, lights, the old room's people + the Black Goo.
   NOT YET (for the district thread): the Eye has no glow and no storm in it; the storm walls are plain rock in the storm sheet (they
   should move); wind and ring-light air; things blown against the walls; the rim walk is bare. */
'use strict';
exports.dress = (c) => {
    c.P('camping_tent', 7, 28, { face: 90 }); c.P('campfire', 9, 30); c.dec('cot', 8, 26); c.dec('sea_chest', 6, 30); c.P('steel_table', 9, 26); c.on('crt_terminal', 9, 26, { y: 0.78 });
    [[18, 20], [30, 20], [17, 28], [31, 28], [24, 15], [25, 34]].forEach(q => c.P('crystal_cluster', q[0], q[1]));
    c.P('flood_mast', 20, 41); c.P('flood_mast', 27, 41); c.P('flood_mast', 6, 21); c.P('signpost', 21, 37, { face: 0 }); c.P('signpost', 8, 23, { face: 90 });
    c.P('telescope', 14, 12, { face: 135 }); c.P('star_projector', 34, 36); c.P('escapepod', 12, 38, { face: 60 });
    c.dec('warning_tape', 20, 24); c.dec('warning_tape', 28, 24);
};
exports.people = (c) => {
    c.native('grey', 21, 33, 30, c.sayOf('grey', 0));             // "One ice grain in the ring is square."
    c.native('grey', 10, 28, 250, c.sayOf('grey', 1));            // "The camp is upwind of the eye."
    c.native('watcher', 7, 23, 90, c.sayOf('watcher', 0));        // "The frame on the rim has nothing in it."
    c.native('black goo', 27, 30, 300);                           // its home
};
