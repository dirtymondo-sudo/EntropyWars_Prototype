/* OUTER SPACE · THE MOON · district M · THE MARE (7 plots) — the pilot district.
   The sea of dust: THE LANDER on its pad (the landmark), THE STANDING DOOR (the bay's door, footprints to it), THE HABITAT (walk-in, "rated
   for six"), THE DISH on its platform, THE TRACKS and the rover at the end of them, open dust east and west to fight on.
   Squares are the Moon's own (sx 0..59, sy 0..47); ctx is bake-space.js's (P = a blocker on a square, dec = decor off its middle,
   native = a unit, building / look = walk-in and drawn pieces). Notes: docs/notes/areas-complexes.md "OUTER SPACE, DISTRICT M".
   STANDS TODAY (the first build): the Lander, the Habitat's shell and plain furnishing, the Dish, the rover, the old room's two people here.
   NOT YET: see the notes section (the pilot's passes). */
'use strict';
exports.build = (c) => {
    /* THE HABITAT: a pressure module on the dust, its airlock door on the south side, where the track from the Lander ends */
    c.building('habitat', [49, 16, 54, 19, 'S'], 3.5, { leaf: 'leaf_bulkhead' }, (a, w, d, door) => {
        a.shell(w, 3.5, d, c.HULL, 0xe6e8ec, door, [3.5, 1.75]); a.frame(door, d, c.PANEL, 0xb8442e);
        a.roof('barrel', 0, 3.5, 0, w + 0.4, 1.3, d + 0.4, c.PANEL, 0xdfe2e8);
        a.box(0, 0, 0, w + 0.5, 0.25, d + 0.5, c.PLATE, 0x8a8f98);
    });
};
exports.dress = (c) => {
    const B = c.BUILT.habitat;
    c.P('lunar_lander', 39, 40, { face: 200 });
    c.P('dish', 52, 6, { face: 150 });
    c.P('mars_rover', 52, 30, { face: 20 });
    c.P('flood_mast', 36, 38); c.P('flood_mast', 48, 20);
    c.P('signpost', 32, 43, { face: 90 }); c.P('signpost', 50, 22, { face: 0 });
    c.P('iso_tank', 48, 17, { face: 90 }); c.P('iso_tank', 48, 18, { face: 90 });
    c.dec('cardboard_boxes', 43, 41); c.dec('sea_chest', 43, 39); c.dec('traffic_cone', 36, 41); c.dec('traffic_barrel', 53, 9);
    /* the old room's habitat things, inside */
    c.put(B, 'cot', -6.5, -3.4, { face: 90 }); c.put(B, 'cot', -6.5, -1.4, { face: 90 }); c.put(B, 'steel_table', 4.5, -3.2); c.put(B, 'crt_terminal', 4.5, -3.2, { y: 0.78, face: 0 });
    c.put(B, 'folding_chair', 4.5, -2.0, { face: 180 }); c.put(B, 'mini_fridge', 7.2, -3.6, { face: 0 }); c.put(B, 'retro_radio', 3.6, -3.3, { y: 0.78 });
};
exports.people = (c) => {
    c.native('grey', 41, 44, 30, c.sayOf('grey', 0));            // "The footprint was there in the previous frame."
    c.native('men in black', 50, 20, 180, c.sayOf('men in black', 0));   // "The habitat is rated for six."
    c.native('barbarella', 44, 37, 220);                          // her home (DOOR_TEXT.POINT_OF_ENTRY)
};
