/* OUTER SPACE · MARS · district R · THE ROVER BAY (5 plots).
   The south plain: THE AIRLOCK (the bay's door), THE ROVER BAY (walk-in; the ship's collar is its hatch, on its north side), THE TRACKS
   with the rover at the end of them, THE DUNES west with the Martian's tripod standing in them (label mine).
   Squares are Mars' own (sx 0..59, sy 0..47). Notes: docs/notes/areas-complexes.md "OUTER SPACE ON PLOTS".
   STANDS TODAY (the first build): the bay's shell with a second rover inside, the apron, the rover, the tripod, the old camp, the Martian.
   NOT YET (for the district thread): the bay's inside (tools, a lift, a workbench), its big door; tyre tracks as decals; the dunes are
   bare; solar panels (NEEDS A MODEL); a habitat. */
'use strict';
exports.build = (c) => {
    c.building('roverbay', [39, 40, 46, 44, 'S'], 5.25, { leaf: 'leaf_bulkhead', leafDouble: true }, (a, w, d, door) => {
        a.shell(w, 5.25, d, c.HULL, 0xd8d2c4, door, [3.5, 1.75]); a.frame(door, d, c.STRIPE, null);
        a.roof('barrel', 0, 5.25, 0, w + 0.4, 1.6, d + 0.4, c.PANEL, 0xc9c2b2);
    });
};
exports.dress = (c) => {
    const B = c.BUILT.roverbay;
    c.put(B, 'mars_rover', -6, 0, { face: 90 }); c.put(B, 'steel_table', 7, -4); c.put(B, 'crt_terminal', 7, -4, { y: 0.78 }); c.put(B, 'iso_tank', 9.5, 2, { face: 90 });
    c.P('mars_rover', 55, 38, { face: 350 }); c.P('decor_tripod_machine', 15, 41, { face: 120 });
    c.P('flood_mast', 37, 44); c.P('flood_mast', 47, 39); c.P('signpost', 32, 44, { face: 90 });
    c.P('campfire', 34, 40); c.dec('cot', 35, 39); c.dec('folding_chair', 33, 39); c.dec('cardboard_boxes', 36, 41);
    c.dec('traffic_cone', 48, 41); c.dec('traffic_cone', 48, 43); c.dec('traffic_barrel', 38, 39);
};
exports.people = (c) => {
    c.native('martian', 33, 42, 200, c.sayOf('martian', 0));      // "The rover looks behind it because we told it to. We were waving."
    c.native('droid', 48, 42, 270);
};
