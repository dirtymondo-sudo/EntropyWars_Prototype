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
    /* THE BLACK CUBE (2026-11-27, mondo: "way in should be the black cube/hexagon on saturn"): it hangs over the plateau south of the Eye, three squares a side,
       nothing holding it; the frame under it (the way `cube_dmt`, bake-space.js CROSS) is the way into its inside. Drawn only: it hangs clear of every head. */
    { const w = c.ways.cube_dmt; if (!w || w.sx > 47) throw new Error('H: the way cube_dmt is not on the flat map');
      c.look('black_cube', w.sx + 0.5, w.sy + 0.5, 0, a => { const S = 10.5, Y = 3.3, h = S / 2, t = 0.14, E = { glow: 1 }, K = c.PLATE, T = 0xcdb8ff;
          a.box(0, Y, 0, S, S, S, c.HULL, 0x050507);
          /* its twelve edges, lit: a black cube on a black sky is not seen */
          [[-h, -h], [h, -h], [-h, h], [h, h]].forEach(q => { a.box(q[0], Y, q[1], t, S, t, K, T, E); });
          [Y, Y + S - t].forEach(y => { [-h, h].forEach(q => { a.box(0, y, q, S, t, t, K, T, E); a.box(q, y, 0, t, t, S, K, T, E); }); }); }); }
};
exports.people = (c) => {
    c.native('grey', 21, 33, 30, c.sayOf('grey', 0));             // "One ice grain in the ring is square."
    c.native('grey', 10, 28, 250, c.sayOf('grey', 1));            // "The camp is upwind of the eye."
    c.native('watcher', 7, 23, 90, c.sayOf('watcher', 0));        // "The frame on the rim has nothing in it."
    c.native('black goo', 27, 30, 300);                           // its home
};
