/* THE ESTATE · THE CORN FIELDS (district C, the north-west nine: plots x 0..2 · y 0..2, squares sx 0..35 · sy 0..35, level 1).
   Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P00-00  The Tall Corn          level 1  corn over your head, one track
     P01-00  The Woods Gate         level 1  the fence and gate from the Woods
     P02-00  The Scarecrow          level 1  a scarecrow on its pole over the rows
     P00-01  The Circles, west      level 1  a flattened crop circle
     P01-01  The Circles            level 1  LANDMARK: the big crop circle
     P02-01  The Farm Track         level 1  the track to the Ranch
     P00-02  The Rows, west         level 1  corn rows, crows
     P01-02  The Hub                level 1  four tracks meet; the well
     P02-02  The Rows, east         level 1  corn rows
   WHAT STANDS HERE (the district thread, 2026-11-16; passes logged in docs/notes/areas-complexes.md "THE ESTATE, DISTRICT C"):
     every plot has its own thing. THE CUT ROWS (strips of tilled soil with drawn furrows + strips of standing young crop = lawn squares
     under the grass field) in The Tall Corn, both Rows and under the Scarecrow; THE CIRCLES with a formation left standing in the flattened
     ground, four stones, a cow; a watchers' camp on the west circle; THE HUB with a fingerpost, a wagon, rails, a bench; the silo yard;
     the power line and a lay-by on the Farm Track; the Woods gate's verge; drawn lamp posts and painted boards (plain words) all over.
   MISSING / WAITING (the NEEDS A MODEL list is in the notes):
     - THE CORN: no corn-stalk model exists on R2 (every list read; the pack's crops blown up are soil mounds, the seaweed is black). The
       `leaves_3` bank is the tool's and still reads as a hedge. A stalk model, once made, is placed here.
     - one scarecrow, the skinwalker and the mothman have no line (lines are mondo's to give).
     - no residents with routines, no encounter table (mondo's baked tables).
     - the Woods gate (P01-00) and the well (P01-02) are ways out: the tool's.
   THE HOOKS (bake-estate.js "THE DISTRICT FILES"; a file exports any of these, each is called with this district's own ctx):
     plan(ctx)    first of all: change the plan's squares (ctx.setRect(x0, y0, x1, y1, ch); 'c' = corn, anything else is walked).
     houses(ctx)  the main buildings (ctx.building: a hollow texbuilding + its drawn look; ctx.put: a prop in a building's own frame).
     sheds(ctx)   the out-buildings (same helpers).
     pieces(ctx)  drawn pieces on open ground (ctx.look) + their rows; ctx.flat(x0, y0, x1, y1) levels the ground under one.
     water(ctx)   pools, decks, rocks in the water.
     dress(ctx)   everything else: props (ctx.P on a square, ctx.dec off its middle), trees, rails, people (ctx.native), animals.
   ctx = { d, C, N, G, W, HALF, gx, gc, r2, PLAN, plot, cell, setRect, open, distAt, feat, props, npc, taken, building, put, look, sheet,
           windows, SOLID, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, P, dec, tree, native, rail, rnd, flat, sayOf, O_FIELDS, O_GROUNDS, BUILT }.
   Squares are (sx 0..72 west to east, sy 0..72 north to south); gx() = a square's west / north line in metres, gc() = its middle.
   ctx.rnd / ctx.dec throw THIS district's own dice, so nothing here moves another district's pieces. Row ids start 'est:'.
   NOT YOURS (the tool's, shared: a note on docs/notes/claims.md before anyone touches them): the corn wall and the pines on it, the levels,
   the paint rule, the sky and shell, the ways out (the Woods gate, the house's front door, `bay`, `bay13`, the well, the Lodge door).
   Rules for district threads: docs/notes/areas-complexes.md "THE ESTATE, THE DISTRICT FILES". Rebake: `node bake-estate.js`. */
'use strict';
/* THE LOOK RULES are the zone kit's (district H): iron 0x1c1c20, lamp amber 0xff9a30 at glow 0.7, trim 0x26222a. */
const IRON = 0x1c1c20, AMBER = 0xff9a30, LAMP = { glow: 0.7 }, TRIM = 0x26222a, POST = 0xb09a80;
const RING = (x, y) => { const d = Math.hypot(x + 0.5 - 18.5, y + 0.5 - 18.5); return (d >= 2.6 && d < 3.6) || (d >= 4.6 && d < 5.3 && (x + y) % 2 === 0); };   // THE FORMATION: a ring of green crop left standing in the big circle's flattened ground, and beads round it
module.exports = {
    plan(ctx) { const { setRect, cell } = ctx;
        /* THE CUT ROWS: a field is strips one square wide, bare tilled soil and the crop left standing (lawn squares: the grass field grows on them) */
        const strips = (x0, y0, x1, y1, ns) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ((ns ? x - x0 : y - y0) % 2) ? 'g' : 'p'; };
        setRect(14, 28, 16, 31, 'g');                              // THE HUB: a pocket off the tracks for the well
        for (let y = 13; y < 24; y++) for (let x = 13; x < 24; x++) if (RING(x, y) && cell[y][x] !== 'c') cell[y][x] = 'g';
        strips(1, 8, 6, 12, false);                                 // THE TALL CORN: a cut field west of the track
        strips(1, 23, 7, 30, false);                                // THE ROWS, WEST: the cut rows
        setRect(9, 24, 12, 27, 'g');                               //   and a rest by the track
        setRect(24, 31, 28, 35, 'p');                              // THE ROWS, EAST: the silo yard
        strips(32, 31, 35, 35, true);                              //   the east rows, cut
        setRect(32, 13, 35, 16, 'p');                              // THE FARM TRACK: a lay-by
        setRect(24, 18, 28, 21, 'p');                              //   a turning place south of the track
        setRect(26, 9, 33, 12, 'p'); strips(26, 9, 28, 12, true); strips(30, 9, 33, 12, true);                               // THE SCARECROW: the rows it watches
        setRect(23, 2, 27, 4, 'g');                                // THE WOODS GATE: the verge east of the gate
        setRect(9, 4, 13, 6, 'g');                                 // THE TALL CORN: a verge on the track's north side
    },
    dress(ctx) { const { gx, gc, r2, feat, props, P, dec, native, sayOf, O_FIELDS, look, rail, rnd, taken } = ctx;
        /* helpers: `at` = a piece anywhere on a square (fractions of a square), decor, never a blocker; `blk` = the walker's block under a drawn piece */
        const bad = [], at = (key, fx, fy, o) => ctx.cell[Math.floor(fy)][Math.floor(fx)] === 'c' ? bad.push(key + ' ' + fx + ',' + fy) : props.push(Object.assign({ key, x: gx(fx), z: gx(fy), face: Math.round(rnd() * 360), noBlock: true }, o || {}));
        const blk = (x0, z0, x1, z1, t, h) => feat({ k: 'wall', x0: r2(x0), z0: r2(z0), x1: r2(x1), z1: r2(z1), t: t || 0.3, h: h || 1.1, ghost: true, rail: false });
        const pick = a => a[Math.floor(rnd() * a.length)];
        const CROPS = ['hw_crop', 'hw_crop_2', 'hw_crop_3'], PUMP = ['hw_pumpkin', 'hw_pumpkin_2', 'hw_pumpkin_3', 'hw_pumpkin_4'];
        /* THE CUT ROWS: the pack's tilled beds laid in rows over a field, two beds a square, young crops down each bed (the grass field is not on dirt, so they show) */
        const rows = (x0, y0, x1, y1, ns, skip) => look('rows' + x0 + '_' + y0, gx(x0), gx(y0), 0, a => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if (ctx.cell[y][x] !== 'p' || (skip && skip(x, y))) continue;
            for (const o of [0.2, 0.5, 0.8]) { const lx = ((ns ? x + o : x + 0.5) - x0) * 3.5, lz = ((ns ? y + 0.5 : y + o) - y0) * 3.5; a.box(lx, -0.1, lz, ns ? 0.62 : 3.5, 0.3 + rnd() * 0.06, ns ? 3.5 : 0.62, 'dirt_3', 0xd8c0a0, { gain: 1.4 }); } } });
        const lampPost = (sx, sy, side) => { const q = { W: [gx(sx) + 0.3, gc(sy), 270], E: [gx(sx + 1) - 0.3, gc(sy), 90], N: [gc(sx), gx(sy) + 0.3, 0], S: [gc(sx), gx(sy + 1) - 0.3, 180] }[side];
            look('lampC' + sx + '_' + sy, q[0], q[1], q[2], a => { a.box(0, 0, 0, 0.34, 0.5, 0.34, null, IRON); a.cyl(0, 0.5, 0, 0.06, 2.7, null, IRON); a.box(0, 3.1, 0.3, 0.07, 0.07, 0.75, null, IRON);
                a.box(0, 2.62, 0.6, 0.24, 0.36, 0.24, null, AMBER, LAMP); a.box(0, 2.98, 0.6, 0.32, 0.07, 0.32, null, IRON); a.box(0, 2.55, 0.6, 0.3, 0.07, 0.3, null, IRON); a.cyl(0, 3.05, 0.6, 0.02, 0.1, null, IRON); }); };
        /* a painted board on two posts at a track's edge (plain words only) */
        const board = (id, fx, fy, rot, words, w) => look(id, gx(fx), gx(fy), rot, a => { a.box(-w / 2 + 0.1, 0, 0, 0.12, 1.9, 0.12, ctx.WD, POST); a.box(w / 2 - 0.1, 0, 0, 0.12, 1.9, 0.12, ctx.WD, POST);
            a.box(0, 1.15, 0, w, 0.6, 0.06, ctx.WD, POST); a.sign(words, 0, 1.22, 0.04, w - 0.16, 0.46, '#e0d0a8', '#4a3a2c', 'fell'); a.sign(words, 0, 1.22, -0.04, w - 0.16, 0.46, '#e0d0a8', '#4a3a2c', 'fell', { ry: 180 }); });

        /* ── THE CIRCLES (P01-01, the landmark) + THE CIRCLES, WEST (P00-01) ── */
        props.push({ key: 'ritual_circle', x: gx(18.5), z: gx(18.5), y: 0.01 });                                                   // THE CIRCLES' heart (the old room's)
        feat({ k: 'dip', x: gx(18.5), z: gx(18.5), r: 17, h: 0.12 }); feat({ k: 'dip', x: gx(5.5), z: gx(16.5), r: 10, h: 0.1 });
        dec('floor_stain', 5, 16, { y: 0.01 }); dec('crow', 3, 14); dec('crow', 7, 18); dec('crow', 20, 14); dec('grasshopper', 15, 22); dec('grasshopper_brown', 21, 22);
        P('cave_torch', 13, 17); P('cave_torch', 4, 13, { noLight: true });
        /* the four winds' gaps through the ring: a lamp post each side of the north one, pumpkins and stones at the others; what was left in the middle */
        P('menhir', 15, 15); P('menhir', 21, 15); P('menhir', 15, 21); P('menhir', 21, 21);                                        // four stones at the ring's corners (the plan's "ritual circle")
        P('cow', 19, 19, { face: 40 }); at('floor_stain', 19.2, 19.8, { y: 0.01 }); at('skull', 17.4, 19.3); at('crow', 19.8, 19.2); at('crow', 18.2, 20.3);
        at('hw_candles', 17.3, 17.3); at('hw_candle', 19.7, 17.4); at('hw_candle_2', 17.4, 19.7); at('hw_candles', 20.2, 17.6);
        for (let i = 0; i < 10; i++) { const a = rnd() * 6.283, r = 4.2 + rnd() * 1.1; at(pick(['psxg_rock_2', 'psxg_rock_3', 'psxg_rock_4', 'hw_straw_2', 'psxg_dead_bush_2']), 18.5 + Math.cos(a) * r, 18.5 + Math.sin(a) * r); }
        board('bd_circ', 18.5, 23.75, 0, 'KEEP OFF THE CROP', 2.6);
        /* the west circle: somebody has been camping on it to watch */
        P('camping_tent', 4, 15, { face: 120 }); P('flood_mast', 7, 15, { noLight: true }); P('film_camera', 6, 18, { face: 300 }); P('psx_wooden_crate_4', 3, 17);
        at('field_radio', 3.6, 17.9); at('railway_lantern', 5.3, 15.6); at('psx_jerrycan_1', 4.9, 14.4); at('meshy_burlap_sack', 3.3, 16.2); at('item_police_barricade', 7.6, 17.4, { face: 90 }); at('item_police_barricade', 5.5, 19.6, { face: 0 });
        at('traffic_cone', 6.6, 13.4); at('traffic_cone', 8.3, 16.2); at('warning_tape', 5.5, 16.5, { y: 0.01, face: 0 }); P('campfire', 5, 17, { noLight: true }); at('stump', 4.4, 18.2); at('wooden_bucket', 6.3, 16.6);

        /* ── THE HUB (P01-02): four tracks meet; the well ── */
        P('signpost', 14, 30, { face: 200 }); P('cave_torch', 15, 28); dec('wooden_bucket', 15, 30); dec('cardboard_boxes', 14, 28);
        look('finger', gx(19.5), gx(29.5), 0, a => { a.box(0, 0, 0, 0.5, 0.3, 0.5, 'castle_wall'); a.cyl(0, 0.3, 0, 0.09, 3.6, ctx.WD, POST); a.cyl(0, 3.9, 0, 0.14, 0.12, null, IRON);
            [['THE WOODS', 3.3, 0], ['THE CIRCLES', 2.85, 0], ['THE LAKE', 3.3, 270], ['THE RANCH', 2.85, 270], ['THE HOUSE', 3.3, 180]].forEach(q => { const t = q[2] * Math.PI / 180, dx = -Math.sin(t) * 0.75, dz = -Math.cos(t) * 0.75;
                a.box(dx, q[1], dz, 1.3, 0.3, 0.05, null, 0xc8b890, { ry: q[2] + 90 }); a.sign(q[0], dx + Math.cos(t) * 0.03, q[1] + 0.03, dz - Math.sin(t) * 0.03, 1.2, 0.24, '#2a2420', '#c8b890', 'fell', { ry: q[2] + 90 }); a.sign(q[0], dx - Math.cos(t) * 0.03, q[1] + 0.03, dz + Math.sin(t) * 0.03, 1.2, 0.24, '#2a2420', '#c8b890', 'fell', { ry: q[2] - 90 }); }); });
        blk(gx(19.5) - 0.3, gx(29.5), gx(19.5) + 0.3, gx(29.5), 0.6, 2); taken.add('19:29');
        P('covered_wagon', 21, 29, { face: 0 }); P('hitching_rail', 17, 30, { face: 0 }); P('hitching_rail', 18, 30, { face: 0 }); P('park_bench', 16, 30, { face: 180 });
        P('psx_metal_barrel_mp_1', 22, 30); at('psx_metal_barrel_mp_0', 22.2, 29.3); P('psx_wooden_crate_5', 17, 27); at('psx_wooden_crate_6', 17.2, 27.3); at('meshy_burlap_sack', 16.5, 28.2); at('meshy_burlap_sack', 20.6, 30.4);
        at('hw_straw', 22.6, 28.4); at('hw_straw_2', 21.5, 30.6); at('wooden_bucket', 16.3, 29.5); at('hand_truck', 17.7, 28.3); at('railway_lantern', 16.4, 30.7); at('crow', 21.2, 29.2, { y: 2.6 + 1.75 });
        lampPost(18, 27, 'N'); lampPost(22, 27, 'N'); lampPost(16, 32, 'N'); lampPost(20, 31, 'S');

        /* ── THE WOODS GATE (P01-00): the fence, the gate, the way in ── */
        dec('fallen_log', 18, 6); dec('butterfly', 20, 4); dec('ladybug', 17, 7); dec('caterpillar', 21, 6);
        board('bd_gate', 21.6, 4.4, 200, 'PRIVATE LAND', 2.2); lampPost(17, 4, 'W'); lampPost(22, 5, 'E'); lampPost(19, 8, 'W');
        P('hw_tree_3', 17, 3); P('psxg_dead_tree_1', 21, 7); P('stump', 16, 6); at('stump', 21.4, 7.6); at('psxg_dead_bush_1', 16.4, 4.6); at('psxg_dead_bush_2', 21.5, 3.6); at('psxg_rock_3', 17.5, 7.4); at('psxg_rock_4', 20.7, 2.6);
        for (let x = 23; x < 27; x++) P('hw_fence', x, 2, { face: 0 }); P('city_bench', 24, 3, { face: 180 }); at('hw_pumpkin_2', 25.4, 3.5); at('hw_pumpkin', 26.3, 3.3); at('rabbit', 23.6, 3.6); at('rabbit', 18.3, 3.2); at('anthill', 20.3, 7.5);
        at('psx_wooden_crate_4', 16.6, 5.5); at('meshy_burlap_sack', 17.2, 5.8); at('railway_lantern', 16.9, 5.1);

        /* ── THE SCARECROW (P02-00): on its pole over the rows it watches ── */
        dec('crow', 28, 6); dec('meshy_burlap_sack', 30, 9);
        P('hw_scarecrow', 30, 6, { face: 180 }); dec('hw_pumpkin', 28, 8); dec('hw_pumpkin_4', 31, 8); dec('hw_pumpkin_3', 30, 9); dec('hw_pumpkin_2', 28, 9);   // THE SCARECROW on its pole, its pumpkin patch
        rows(26, 9, 28, 12, true); rows(30, 9, 33, 12, true);
        for (let i = 0; i < 16; i++) at(pick(PUMP), 27.3 + rnd() * 4.4, 5.3 + rnd() * 3.4);                                         // the patch, thick
        at('crow', 30.5, 6.5, { y: 2.2 + 1.75 }); at('crow', 29.2, 5.4); at('crow', 31.4, 7.2); at('crow', 27.6, 10.3); at('crow', 31.7, 10.6);
        P('hw_straw', 27, 5); at('hw_straw_2', 27.6, 5.9); at('hw_straw', 31.4, 6.4); at('hw_shovel', 29.4, 8.6); at('wooden_bucket', 31.3, 9.3); at('psxg_jack_o_lantern_1', 30.5, 7.3); at('psxg_jack_o_lantern_2', 29.5, 7.4);
        P('hw_scarecrow_2', 32, 10, { face: 250 }); lampPost(24, 4, 'N'); lampPost(33, 7, 'N'); rail(26, 12, 28, 12); rail(30, 12, 33, 12); rail(33, 9, 33, 12);

        /* ── THE TALL CORN (P00-00): one track; a cut field at its end ── */
        rows(1, 8, 6, 12, false, (x, y) => x === 5 && y === 9);
        P('hw_scarecrow_2', 3, 10, { face: 90 }); P('hw_straw', 5, 9); at('hw_straw', 5.3, 8.4); at('hw_straw_2', 4.6, 8.3); at('crow', 2.4, 9.3); at('crow', 3.6, 11.4); at('crow', 3.5, 10.5, { y: 2.1 + 1.75 }); at('rabbit', 1.6, 11.5);
        rail(6, 8, 6, 9); rail(6, 11, 6, 12); board('bd_tall', 6.3, 12.4, 90, 'NO WAY THROUGH', 2.4);
        lampPost(8, 6, 'N'); lampPost(14, 6, 'N'); lampPost(6, 10, 'W');
        P('hw_tree_2', 9, 4); P('hw_tree_5', 12, 5); at('psxg_dead_bush_1', 10.5, 4.6); at('psxg_rock_1', 11.3, 5.5); at('stump', 10.2, 5.4); at('hw_pumpkin_3', 9.6, 5.6); at('fallen_log', 11.5, 4.5, { face: 80 });
        at('psx_wooden_crate_6', 7.5, 6.3); at('meshy_burlap_sack', 12.6, 6.4); at('tire_stack', 6.3, 8.5);

        /* ── THE FARM TRACK (P02-01): the track to the Ranch; the power line runs along it ── */
        for (const x of [24.5, 29.5, 34.5]) at('power_pole', x, 16.12, { face: 0 }); for (const y of [20.5, 25.5]) at('power_pole', 30.12, y, { face: 90 });
        P('car_truck', 33, 14, { face: 90 }); at('tire_stack', 32.4, 15.5); at('psx_jerrycan_1', 34.5, 15.4); P('psx_metal_barrel_mp_2', 32, 13); at('tool_chest', 34.4, 13.5); at('traffic_cone', 32.5, 14.5);
        P('covered_wagon', 25, 19, { face: 90 }); P('hw_straw', 27, 20); at('hw_straw', 26.5, 19.3); at('hw_straw_2', 27.4, 19.2); at('hw_straw', 26.4, 20.5); at('meshy_burlap_sack', 24.5, 20.5); at('wooden_bucket', 26.2, 18.4);
        P('hitching_rail', 24, 18, { face: 0 }); P('hitching_rail', 26, 18, { face: 0 }); board('bd_ranch', 31.7, 18.5, 270, 'THE RANCH', 2.0); lampPost(26, 16, 'N'); lampPost(33, 17, 'S'); lampPost(29, 22, 'W');
        at('crow', 24.5, 16.1, { y: 9.6 + 1.75 }); at('crow', 30.1, 20.4, { y: 9.6 + 1.75 }); at('rabbit', 27.5, 18.5); at('psxg_rock_2', 28.3, 13.6); at('psxg_dead_bush_2', 29.6, 12.4);

        /* ── THE ROWS, WEST (P00-02): the cut rows, crows ── */
        rows(1, 23, 7, 30, false, (x, y) => (x === 6 && (y === 26 || y === 27)) || (x === 3 && y === 26));
        P('hw_scarecrow', 3, 26, { face: 90 }); for (let i = 0; i < 9; i++) at('crow', 1.4 + rnd() * 5, 23.3 + rnd() * 6.4);
        P('hw_straw', 6, 26); at('hw_straw', 6.3, 27.3); at('hw_straw_2', 6.6, 26.6); at('hw_straw', 5.7, 27.6); at('hw_shovel', 5.4, 25.5); at('wooden_bucket', 6.4, 25.4); at('meshy_burlap_sack', 6.5, 28.4);
        rail(7, 23, 7, 26); rail(7, 28, 7, 30);
        P('hw_tree_4', 10, 24); P('city_bench', 9, 26, { face: 270 }); at('stump', 11.3, 25.4); at('psxg_dead_bush_1', 11.5, 26.5); at('hw_pumpkin', 10.4, 26.3); at('rabbit', 10.6, 25.5); at('anthill', 11.4, 24.4);
        lampPost(8, 22, 'E'); lampPost(8, 29, 'E'); lampPost(10, 32, 'N'); lampPost(5, 33, 'S');
        at('psx_wooden_crate_4', 4.5, 31.5); at('meshy_burlap_sack', 5.3, 31.4); at('fallen_log', 13.5, 33.6, { face: 10 }); at('psxg_rock_3', 16.4, 33.5); at('hw_pumpkin_4', 12.4, 32.3);

        /* ── THE ROWS, EAST (P02-02): the silo yard and the east rows ── */
        P('ind_silo', 25, 32); P('ind_silo', 25, 34); P('psx_metal_barrel_mp_3', 27, 34); at('psx_metal_barrel_mp_1', 27.3, 33.4); P('psx_wooden_crate_2', 24, 33); at('psx_wooden_crate_6', 24.4, 31.4);
        at('hand_truck', 26.6, 31.4); at('meshy_burlap_sack', 26.3, 34.5); at('meshy_burlap_sack', 26.8, 34.2); at('cable_drum', 27.5, 32.4); at('tire_stack', 24.5, 34.6); at('wooden_bucket', 26.4, 32.5);
        rail(24, 31, 27, 31); board('bd_silo', 27.6, 31.2, 0, 'GRAIN', 1.6); lampPost(27, 31, 'N');
        rows(32, 31, 35, 35, true); P('hw_scarecrow_2', 33, 33, { face: 270 }); at('crow', 33.4, 32.4); at('crow', 34.5, 34.4); at('crow', 32.6, 34.5); at('crow', 33.5, 33.5, { y: 2.1 + 1.75 });
        P('hw_straw', 29, 29); at('hw_straw_2', 28.5, 29.6); at('hw_pumpkin_2', 29.6, 29.4); lampPost(30, 26, 'W'); lampPost(31, 33, 'E'); lampPost(25, 27, 'N');
        at('psxg_rock_1', 26.5, 28.6); at('psxg_dead_bush_2', 23.5, 27.4); at('rabbit', 28.4, 33.5);

        if (bad.length) throw new Error('C: in the corn: ' + bad.join(' · '));
        /* ── the people (the plan's five) ── */
        native('scarecrow', 29, 7, 180, sayOf(O_FIELDS, 'scarecrow', 0)); native('scarecrow', 2, 15, 60, sayOf(O_FIELDS, 'scarecrow', 2)); native('scarecrow', 21, 14, 200);
        native('skinwalker', 16, 22, 180); native('mothman', 19, 5, 200);
    },
};
