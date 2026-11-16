/* OUTER SPACE · THE MOON · district M · THE MARE (7 plots) — the pilot district.
   The sea of dust: THE LANDER on its pad (the landmark), THE STANDING DOOR (the bay's door, footprints to it), THE HABITAT (walk-in, "rated
   for six"), THE DISH on its platform, THE TRACKS and the rover at the end of them, open dust east and west to fight on.
   Squares are the Moon's own (sx 0..59, sy 0..47); ctx is bake-space.js's (P = a blocker on a square, dec = decor off its middle, on = on
   a square's middle sharing it, native = a unit, building / look = walk-in and drawn pieces, line = a line on the ground, grime = a decal).
   Notes: docs/notes/areas-complexes.md "OUTER SPACE, DISTRICT M" (the passes, the decisions, what is missing).
   PASS 1, EXTERIORS: the Lander at its real size with its flag, camera and blast mark; the Habitat as a white pressure module with an
   airlock porch, portholes, a stripe, tanks, a mast, a solar field and a power hut; the Dish at its real size with its control cabin and
   cable run; tyre tracks and footprints on the dust; a crashed probe, boulders; the equipment yard.
   PASS 2, INTERIORS: the Habitat's inside: a lit ceiling, the bunk room (six bunks, two lived in), the galley, the lab. */
'use strict';
const WHITE = 0xe9ebee, GREY = 0x9aa0aa, DARK = 0x3a3e46, RED = 0xb8442e, GOLD = 0xc9a23a, CELL = 0x3a64c8;

/* a row of solar panels: `n` tilted panels on legs, facing south (parts in the piece's own frame) */
function solarRow(a, c, n) { for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 2.5;
    a.box(x - 0.9, 0, 0.5, 0.08, 0.5, 0.08, c.TRUSS, DARK); a.box(x + 0.9, 0, 0.5, 0.08, 0.5, 0.08, c.TRUSS, DARK); a.box(x - 0.9, 0, -0.5, 0.08, 1.35, 0.08, c.TRUSS, DARK); a.box(x + 0.9, 0, -0.5, 0.08, 1.35, 0.08, c.TRUSS, DARK);
    a.roof('shed', x, 0.5, 0, 2.2, 0.9, 1.4, c.GLS, CELL, { glow: 0.45 }); } }

exports.build = (c) => {
    /* THE HABITAT: a white pressure module on the dust, its airlock on the south side where the track from the Lander ends */
    c.building('habitat', [49, 16, 54, 19, 'S'], 3.5, { leaf: 'leaf_bulkhead', keyIn: c.PANEL }, (a, w, d, door) => {
        a.shell(w, 3.5, d, c.PANEL, WHITE, door, [3.5, 1.75], { gain: 2.2 });   // the sheet is a dark tin: lifted so the module reads white under the floodlights
        a.roof('barrel', 0, 3.5, 0, w + 0.3, 1.5, d + 0.3, c.PANEL, 0xdfe2e8, { gain: 2.0 });
        /* the skirt it stands on: a ring, so the floor inside stays the floor (pass 2: a full plate stood 0.3 m over it) */
        a.box(0, 0, d / 2 + 0.2, w + 0.7, 0.3, 0.3, c.PLATE, GREY); a.box(0, 0, -d / 2 - 0.2, w + 0.7, 0.3, 0.3, c.PLATE, GREY); a.box(-w / 2 - 0.2, 0, 0, 0.3, 0.3, d + 0.1, c.PLATE, GREY); a.box(w / 2 + 0.2, 0, 0, 0.3, 0.3, d + 0.1, c.PLATE, GREY);
        /* THE INSIDE (pass 2): a lit white ceiling under the walk-in's own black one; the bunk room's wall (west) and the lab's (east), each
           with its doorway by the front wall; a floor stripe inside the airlock; a rib every 3.5 m */
        a.box(0, 2.82, 0, w - 0.3, 0.06, d - 0.3, c.PANEL, 0xf2f4f6, { sides: false, top: false, under: true, glow: 0.6, gain: 2.2 });   // 2.82: the walk-in's own ceiling hangs lower than 3.1 (seen)
        a.box(-3.5, 0, -1.55, 0.14, 2.82, 7.0, c.PANEL, WHITE, { gain: 2.0 }); a.box(3.5, 0, -1.55, 0.14, 2.82, 7.0, c.PANEL, WHITE, { gain: 2.0 });
        a.box(-3.5, 2.2, 3.45, 0.14, 0.62, 3.0, c.PANEL, WHITE, { gain: 2.0 }); a.box(3.5, 2.2, 3.45, 0.14, 0.62, 3.0, c.PANEL, WHITE, { gain: 2.0 });
        a.box(-3.42, 1.0, -1.55, 0.04, 0.2, 7.0, c.PANEL, RED); a.box(3.42, 1.0, -1.55, 0.04, 0.2, 7.0, c.PANEL, 0x2a5aa8);
        a.box(door.lx, 0.01, d / 2 - 1.0, door.cw + 1.2, 0.02, 0.5, c.STRIPE, null);
        for (const x of [-7, 0, 7]) a.box(x, 2.66, 0, 0.16, 0.16, d - 0.4, c.HULL, GREY);
        a.sign('BUNKS', -3.41, 2.3, 3.45, 1.6, 0.4, '#e9ebee', '#b8442e', 'staat', { ry: 90 }); a.sign('LAB', 3.41, 2.3, 3.45, 1.2, 0.4, '#e9ebee', '#2a5aa8', 'staat', { ry: 270 });
        a.box(0, 2.95, d / 2 + 0.04, w + 0.1, 0.28, 0.06, c.PANEL, RED); a.box(0, 2.95, -d / 2 - 0.04, w + 0.1, 0.28, 0.06, c.PANEL, RED);   // the stripe
        /* the airlock porch: two cheeks and a hood round the door, a step plate, a lamp over it */
        a.box(door.lx - door.cw / 2 - 0.25, 0, d / 2 + 0.9, 0.22, 2.7, 1.8, c.HULL, GREY); a.box(door.lx + door.cw / 2 + 0.25, 0, d / 2 + 0.9, 0.22, 2.7, 1.8, c.HULL, GREY);
        a.box(door.lx, 2.55, d / 2 + 0.9, door.cw + 0.95, 0.2, 1.9, c.HULL, GREY); a.box(door.lx, 0, d / 2 + 1.2, door.cw + 0.9, 0.12, 2.4, c.PLATE, GREY);
        a.box(door.lx, 2.3, d / 2 + 1.8, 0.5, 0.14, 0.14, c.GLS, 0xfff2c8, { glow: 1.6 });
        a.frame(door, d, c.STRIPE, null);
        /* portholes: front (not over the door), back and both ends */
        for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) > 2) { a.box(x, 1.25, d / 2 + 0.05, 1.0, 0.9, 0.08, c.GLS, 0x9fd8ff, { glow: 0.55 }); a.box(x, 1.13, d / 2 + 0.1, 1.3, 0.12, 0.12, c.HULL, DARK); a.box(x, 2.15, d / 2 + 0.1, 1.3, 0.12, 0.12, c.HULL, DARK); }
            a.box(x, 1.25, -d / 2 - 0.05, 1.0, 0.9, 0.08, c.GLS, 0x9fd8ff, { glow: 0.55 }); a.box(x, 1.13, -d / 2 - 0.1, 1.3, 0.12, 0.12, c.HULL, DARK); a.box(x, 2.15, -d / 2 - 0.1, 1.3, 0.12, 0.12, c.HULL, DARK); }
        a.sign('THE HABITAT', -w / 2 + 3.0, 2.25, d / 2 + 0.07, 4.2, 0.55, '#20242c', '#e9ebee', 'staat');
        /* on the roof: a mast with a crossbar, a vent, a beacon */
        a.cyl(w / 2 - 2, 4.6, 0, 0.06, 4.2, c.TRUSS, DARK); a.box(w / 2 - 2, 7.6, 0, 1.6, 0.06, 0.06, c.TRUSS, DARK); a.box(w / 2 - 2, 8.7, 0, 0.22, 0.22, 0.22, c.GLS, 0xff5040, { glow: 2.2 });
        a.cyl(-w / 2 + 2.5, 4.7, 0, 0.45, 0.7, c.HULL, GREY);
        /* at the west end: two white tanks on a plate, a pipe into the wall */
        a.box(-w / 2 - 1.6, 0, 0, 2.6, 0.2, 4.4, c.PLATE, GREY); a.cyl(-w / 2 - 1.6, 0.2, -1.1, 0.8, 2.5, c.PANEL, WHITE, { gain: 2.2 }); a.cyl(-w / 2 - 1.6, 0.2, 1.1, 0.8, 2.5, c.PANEL, WHITE, { gain: 2.2 });
        a.cyl(-w / 2 - 1.6, 2.7, -1.1, 0.5, 0.25, c.HULL, GREY); a.cyl(-w / 2 - 1.6, 2.7, 1.1, 0.5, 0.25, c.HULL, GREY); a.box(-w / 2 - 0.5, 1.6, 0, 1.2, 0.16, 0.16, c.HULL, GOLD);
    });
};

exports.dress = (c) => {
    const B = c.BUILT.habitat;
    /* ── THE LANDER: the real size, the blast mark under it, the flag (bleached white, as the real ones are), the camera that filmed it ── */
    c.P('lunar_lander_full', 39, 40, { face: 200 }); [[38, 39], [40, 39], [38, 41], [40, 41]].forEach(q => c.taken.add(q[0] + ':' + q[1]));
    c.grime('scorch', 39, 40, 4.6);
    c.look('flag', 35.5, 39.5, 20, a => { a.cyl(0, 0, 0, 0.035, 2.5, c.TRUSS, 0xcfd3da); a.box(0.62, 2.42, 0, 1.25, 0.03, 0.03, c.TRUSS, 0xcfd3da); a.box(0.64, 1.62, 0, 1.2, 0.78, 0.02, c.PANEL, 0xf4f4f0, { uv: [0.6, 0.4], gain: 2.4, glow: 0.35 }); });
    c.P('studio_camera', 35, 42, { face: 60 });
    /* footprints: from the Standing Door to the ladder, round the flag, out to the camera (thin, close pairs) */
    const steps = (pts) => { for (let i = 0; i + 1 < pts.length; i++) for (const o of [-0.08, 0.08]) c.line(pts[i][0] + o, pts[i][1] + o, pts[i + 1][0] + o, pts[i + 1][1] + o, 0.16, 0x50535a); };
    steps([[30.5, 43.6], [33.5, 43.4], [36.4, 42.2], [37.2, 40.9]]); steps([[37.2, 40.9], [36.2, 40.2], [35.7, 39.7]]); steps([[36.2, 40.2], [35.6, 41.6], [35.4, 42.3]]);
    /* ── THE TRACKS: two tyre lines from the pad east and north to the rover; the rover; the probe that came down before anyone did ── */
    const tyres = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { const dx = Math.sign(pts[i + 1][0] - pts[i][0]), dy = Math.sign(pts[i + 1][1] - pts[i][1]); for (const o of [-0.26, 0.26]) c.line(pts[i][0] + o * Math.abs(dy), pts[i][1] + o * Math.abs(dx), pts[i + 1][0] + o * Math.abs(dy), pts[i + 1][1] + o * Math.abs(dx), 0.3, 0x44464c); } };
    tyres([[42.2, 40.5], [51.5, 40.5], [51.5, 31.2]]); tyres([[51.5, 29.2], [51.5, 19.6]]);
    c.P('mars_rover', 51, 30, { face: 0 });
    c.P('satellite', 53, 34, { face: 130, y: 0.5 }); c.grime('scorch', 53, 34, 2.2);
    /* ── THE HABITAT's yard: a solar field east of it, the power hut, lights, the equipment ── */
    c.look('solar1', 56, 15.5, 0, a => solarRow(a, c, 2)); c.look('solar2', 56, 17.5, 0, a => solarRow(a, c, 2)); c.look('solar3', 56, 13.5, 0, a => solarRow(a, c, 2));
    [[55, 13], [56, 13], [55, 15], [56, 15], [55, 17], [56, 17]].forEach(q => c.taken.add(q[0] + ':' + q[1]));
    c.P('generator', 54, 14, { face: 90 }); c.P('cable_drum', 53, 13, { face: 20 });
    c.P('flood_mast', 48, 20); c.P('flood_mast', 55, 20, { noLight: true }); c.P('signpost', 50, 22, { face: 0 });
    c.P('ind_container', 49, 13, { face: 90 }); c.dec('psx_supply_crate_1', 51, 14); c.dec('psx_supply_crate_1_2', 51, 13); c.dec('psx_metal_barrel_mp_1', 52, 14); c.dec('psx_metal_barrel_mp_2', 48, 21);
    c.dec('traffic_cone', 49, 20); c.dec('traffic_cone', 54, 20);
    /* ── THE DISH: the real size on its platform, its control cabin at the foot of the ramp, the cable up the ramp ── */
    c.P('dish_big', 52, 6, { face: 150 }); [[51, 6], [52, 7], [51, 7]].forEach(q => c.taken.add(q[0] + ':' + q[1]));
    c.P('radio_console', 50, 11, { face: 90 }); c.P('retro_console', 53, 11, { face: 270 }); c.P('flood_mast', 54, 9, { noLight: true });
    c.line(52.9, 10.9, 52.9, 8.2, 0.12, 0x202226); c.line(52.9, 10.9, 53.1, 13.2, 0.12, 0x202226);
    c.dec('traffic_barrel', 50, 9); c.dec('psx_supply_crate_1_3', 54, 11);
    /* ── THE LANDER's yard: the instruments left behind, crates, a light ── */
    c.P('flood_mast', 36, 37); c.P('radio_console', 44, 43, { face: 300 }); c.dec('psx_supply_crate_1', 43, 42); c.dec('cable_drum', 45, 42); c.line(44.5, 43.4, 41.8, 41.6, 0.1, 0x202226);
    c.dec('psx_supply_crate_1_4', 43, 38); c.dec('cardboard_boxes', 42, 43); c.dec('traffic_cone', 36, 41);
    c.P('signpost', 32, 43, { face: 90 });
    /* ── boulders on the open dust (the D.O.O.R. kit's asteroids as moon rock) and standing stones ── */
    [[32, 38, 'asteroid_a', 40], [46, 37, 'asteroid_b', 200], [56, 26, 'asteroid_a', 120], [16, 40, 'asteroid_b', 300], [24, 44, 'asteroid_a', 10], [55, 42, 'asteroid_b', 80], [18, 37, 'asteroid_a', 220]].forEach(q => c.P(q[2], q[0], q[1], { face: q[3] }));
    [[33, 38], [49, 34], [47, 44], [22, 41], [26, 38], [54, 38], [57, 30], [15, 44]].forEach(q => c.dec('cave_stone', q[0], q[1]));
    /* ── THE HABITAT's INSIDE (pass 2). "Rated for six. There are two of us": six bunks, two of them lived in. Its frame: x along the
       front (the door at 0), +z toward the door. West = the bunk room, middle = the galley, east = the lab. ── */
    const G = 0.02;
    [-3.9, -1.9, 0.1].forEach((z, i) => { c.put(B, 'cot', -7.35, z, { face: 90, y: G }); c.put(B, 'cot', -4.6, z, { face: 90, y: G }); });
    c.put(B, 'psx_supply_crate_1_4', -7.6, 1.5, { face: 90 }); c.put(B, 'psx_supply_crate_1_3', -4.5, 1.5, { face: 270 }); c.put(B, 'retro_radio', -7.6, 1.5, { y: 0.38, face: 120 });   // (the old room's sea chests are pirate chests full of gold: not here) c.put(B, 'cardboard_boxes', -8.0, 3.9, { face: 20 });
    c.put(B, 'steel_table', -0.6, -2.6); c.put(B, 'folding_chair', -0.6, -3.7, { face: 0 }); c.put(B, 'folding_chair', -0.6, -1.5, { face: 180 }); c.put(B, 'folding_chair', -1.7, -2.6, { face: 90 }); c.put(B, 'folding_chair', 0.5, -2.6, { face: 270 });
    c.put(B, 'coffee_mug', -0.4, -2.5, { y: 0.78 }); c.put(B, 'mini_fridge', 2.6, -4.6, { face: 0 }); c.put(B, 'psx_supply_crate_1', -2.8, -4.5, { face: 10 }); c.put(B, 'psx_supply_crate_1_2', -2.8, -4.5, { y: 0.37, face: 40 }); c.put(B, 'psx_metal_barrel_mp_1', 1.6, -4.6);
    c.put(B, 'retro_console', 5.2, -4.5, { face: 0 }); c.put(B, 'radio_console', 7.4, -4.4, { face: 0 }); c.put(B, 'steel_table', 6.2, -0.6); c.put(B, 'crt_terminal', 6.2, -0.6, { y: 0.78, face: 180 }); c.put(B, 'folding_chair', 6.2, 0.6, { face: 180 });
    c.put(B, 'meshy_molten_cryo_tube', 8.0, 1.8, { face: 270 }); c.put(B, 'meshy_molten_cryo_tube', 8.0, 3.4, { face: 270 }); c.put(B, 'iso_tank', 4.6, 3.9, { face: 90 }); c.put(B, 'meteorite_plinth', 4.4, -2.4, { face: 0 });
    /* the lights: one real bulb in the galley (it lights the whole module), drawn lamps in the bunk room and the lab */
    c.put(B, 'bare_bulb', 0, -0.6, { y: 2.45 }); c.put(B, 'psx_ceiling_lamp_1_on', -6, -1.5, { y: 2.64, noLight: true }); c.put(B, 'psx_ceiling_lamp_1_on', 6, -1.5, { y: 2.64, noLight: true }); c.put(B, 'psx_ceiling_lamp_1_on', 0, 2.8, { y: 2.64, noLight: true });
};

exports.people = (c) => {
    c.native('grey', 41, 44, 30, c.sayOf('grey', 0));            // "The footprint was there in the previous frame."
    c.native('men in black', 50, 20, 180, c.sayOf('men in black', 0));   // "The habitat is rated for six."
    c.native('barbarella', 44, 37, 220);                          // her home (DOOR_TEXT.POINT_OF_ENTRY)
};
