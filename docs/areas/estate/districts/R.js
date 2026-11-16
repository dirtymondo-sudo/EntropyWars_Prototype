/* THE ESTATE · THE RANCH (district R, the south-east nine: plots x 3..5 · y 3..5, squares sx 36..71 · sy 36..71, level 1, the
   Windmill 2). Repo tooling only: bake-estate.js loads this file through its one hook (THE DISTRICT FILES) and writes the room
   `site_prebuilt_skinwalker_estate` into data.js. One thread works this file; nobody else edits it.
   THE PLOTS (docs/areas/estate/layout.json):
     P03-03  The Pasture            level 1  open grass, cows
     P04-03  The Windmill           level 2  LANDMARK: the windmill
     P05-03  The Hay Field          level 1  bales
     P03-04  The Paddock            level 1  fenced ring, horses
     P04-04  The Barn               level 1  the barn (inside: new)
     P05-04  The Farmhouse          level 1  the farmhouse, porch (inside: new)
     P03-05  The Ranch Gate         level 1  gate, cattle grid
     P04-05  The Yard               level 1  chicken coop, trough
     P05-05  The Cow Field          level 1  cows, a fence out to the desert road
   WHAT STANDS HERE TODAY: THE BARN (walk-in: red boards, tin roof, sliding doors; a horse, two cows, sacks, crates, straw), THE
     FARMHOUSE (walk-in: white boards, green roof, porch, chimney; table, bed, armchair, the cat; a dog on the porch), the Yard's hen
     house (solid), THE WINDMILL (`decor_windpump_tower` + wheel), the Paddock's ring rail with three horses, the Pasture's cows and a
     trailer, the Hay Field's straw bales + a truck + a scarecrow, the kitchen garden and the picket fence by the farmhouse, the Ranch
     Gate's rail + signpost + two trailers, the Cow Field's fence and cows, chickens, and two people: a cowboy, a goatman.
   MISSING / WAITING:
     - art the game does not have: a trough (the Yard's plan names one). Nothing was generated; no Meshy yet (mondo 11-15).
     - the Ranch Gate has no gate leaf and no cattle grid (the plan names both): a gap in the rail stands in.
     - the Barn and the Farmhouse have no upstairs; their insides were not seen on screen.
     - the cowboy has no line (his old line named the three gates, which are gone); the goatman has none.
     - the Cow Field's "fence out to the desert road" leads nowhere: no door to the Desert exists (a way out = the tool's).
     - Room 512's stable door `bay` (the Yard's south wall) and the Lodge's saloon door by the farmhouse porch are the tool's.
     - no residents with routines, no encounter table (mondo's baked tables), night not seen on screen.
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
let BARN = null, FARM = null;   // the two walk-ins' handles (houses), used again by dress
module.exports = {
    houses(ctx) { const { building, put, windows, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT } = ctx;
        /* THE BARN (walk-in): red boards, white corner boards, a tall roof with its ridge front to back, the hayloft door over the barn doors */
        BARN = building('barn', [51, 50, 58, 56, 'S'], 5.25, { leaf: 'leaf_barn', leafDouble: true, floorIn: 'dirt_2', storeys: 1 }, (a, w, d, door) => {
            const RED = 0x9a3a30, WHITE = 0xe8e2d4, ROOF = 0x5a5650;
            a.shell(w, 5.25, d, WD, RED, door, [3.5, 1.75]);
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.34, 5.25, 0.34, WD2, WHITE);
            a.box(0, 5.0, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, WHITE);
            a.roof('gable', 0, 5.25, 0, d + 0.8, 4.6, w + 0.8, COR, ROOF, { ry: 90, keyEnd: WD, tintEnd: RED });
            a.frame(door, d, WD2, WHITE);
            for (const sd of [-1, 1]) { a.box(door.lx + sd * 2.15, 0, d / 2 + 0.07, 2.3, 2.9, 0.08, WD2, 0x6a2a22); a.box(door.lx + sd * 2.15, 1.4, d / 2 + 0.12, 2.3, 0.14, 0.06, WD2, WHITE); a.box(door.lx + sd * 3.3, 0, d / 2 + 0.12, 0.14, 2.9, 0.06, WD2, WHITE); }   // the two big sliding doors, run back either side of the doorway
            a.box(door.lx, 2.9, d / 2 + 0.12, 7.0, 0.16, 0.1, WD2, WHITE);
            a.box(door.lx, 3.4, d / 2 + 0.07, 2.2, 1.4, 0.08, WD2, 0x4a2a22); a.box(door.lx, 3.3, d / 2 + 0.12, 2.6, 0.14, 0.14, WD2, WHITE); a.box(door.lx, 4.8, d / 2 + 0.12, 2.6, 0.14, 0.14, WD2, WHITE);   // the hayloft door
            for (const x of [-8.75, 8.75]) { a.box(x, 1.2, d / 2 + 0.06, 1.2, 1.2, 0.08, SHUT, 0xb0a898, { uv: 'fit', faces: 'f', top: false }); a.box(x, 1.06, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, WHITE); }
        });
        put(BARN, 'horse_brown', -8.6, -6.4, { face: 180 }); put(BARN, 'cow', 8.6, -6.4, { face: 180 }); put(BARN, 'cow', 8.6, -1.2, { face: 270 });
        put(BARN, 'meshy_burlap_sack', -10.4, 4.4); put(BARN, 'meshy_burlap_sack', -9.2, 5.6); put(BARN, 'meshy_burlap_sack', -10.6, 6.6); put(BARN, 'wooden_bucket', -6.2, -8.6); put(BARN, 'wooden_bucket', 6.4, -3.6);
        put(BARN, 'psx_wooden_crate_1', 9.8, 6.8); put(BARN, 'psx_wooden_crate_2', 8.4, 7.4); put(BARN, 'psx_metal_barrel_mp_1', 10.6, 4.6); put(BARN, 'tool_chest', -10.4, -1.2, { face: 90 });
        put(BARN, 'railway_lantern', 2.4, 8.2); put(BARN, 'psx_cobweb_1', -11.4, -9.6, { y: 3.6 }); put(BARN, 'psx_cobweb_2', 11.4, 9.4, { y: 3.6 });
        /* THE FARMHOUSE (walk-in): white boards, a green roof, a brick chimney, the porch on the plan's plank row */
        FARM = building('farmhouse', [63, 51, 69, 56, 'S'], 3.5, { leaf: 'leaf_white_wood' }, (a, w, d, door) => {
            const WHITE = 0xe6e0d0, GREEN = 0x4a6048, TRIM = 0x3a4a3a;
            a.shell(w, 3.5, d, WD, WHITE, door, [3.5, 1.75], { gain: 2.2 });
            a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });
            for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.3, 3.5, 0.3, WD2, TRIM);
            a.roof('gable', 0, 3.5, 0, w + 1.0, 3.2, d + 1.0, SHG, GREEN, { keyEnd: WD, tintEnd: WHITE });
            a.frame(door, d, WD2, TRIM); windows(a, w, d, 1.0, 1.4, door.lx, 0xf0d898, 0.45);
            for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.0, z, 0.08, 1.4, 1.2, GLS, 0xc8d4e0);
            a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);                                                               // the porch
            for (let i = 0; i <= 6; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / 6; if (Math.abs(x - door.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.2, 2.8, 0.2, WD2, WHITE); }
            a.roof('shed', 0, 2.8, d / 2 + 1.85, w + 0.6, 0.7, 3.8, SHG, GREEN);
            a.box(6.6, 0, -d / 2 - 0.5, 1.6, 7.4, 1.1, BRK, 0x9a6a58, { roof: true }); a.box(6.6, 0, -d / 2 + 0.75, 2.2, 1.5, 0.9, BRK, 0x9a6a58);   // the chimney, its hearth inside
        });
        put(FARM, 'psx_dinner_table_1', -4.4, -1.2); put(FARM, 'psx_chair_mp_1', -4.4, -2.8, { face: 0 }); put(FARM, 'psx_chair_mp_1', -4.4, 0.4, { face: 180 }); put(FARM, 'psx_chair_mp_1', -6.2, -1.2, { face: 90 });
        put(FARM, 'psx_bed_1', 6.6, 5.4, { face: 270 }); put(FARM, 'psx_bedside_table_1', 8.9, 6.9); put(FARM, 'rug_round', 1.2, 1.6, { y: 0.17 }); put(FARM, 'psx_armchair_1', 4.4, -5.6, { face: 0 });
        put(FARM, 'psx_shelf_mp_2', -9.4, -6.6, { face: 90 }); put(FARM, 'retro_radio', -9.3, 3.2); put(FARM, 'cat', 2.6, -4.4, { face: 140 }); put(FARM, 'candle', 6.6, -7.0, { y: 1.5 });
        put(FARM, 'rocking_chair', -7.6, 10.4, { face: 180 }); put(FARM, 'dog', 5.2, 10.6, { face: 200 }); put(FARM, 'railway_lantern', 9.4, 10.2);
    },
    sheds(ctx) { const { building, SOLID, WD, WD2, COR, SHUT } = ctx;
        /* THE COOP: the hen house in the Yard (a low shed, not walked into) */
        building('coop', [56, 67, 59, 70, 'W'], 2.8, SOLID, (a, w, d) => {
            a.box(0, 0, 0, w + 0.1, 2.8, d + 0.1, WD, 0x8a5a3c, { top: false, uv: [3.5, 1.75] }); a.roof('shed', 0, 2.8, 0, w + 0.8, 1.2, d + 0.8, COR, 0x6a6660);
            a.box(0, 0.5, d / 2 + 0.07, 0.9, 0.9, 0.08, WD2, 0x2a1c14); a.box(0, 0, d / 2 + 0.9, 0.8, 0.5, 1.7, WD2, 0x6a5038);              // the hens' hatch and its ramp block
            for (const x of [-3.2, 3.2]) a.box(x, 1.4, d / 2 + 0.06, 1.1, 0.8, 0.08, SHUT, 0xa8a090, { uv: 'fit', faces: 'f', top: false });
        });
    },
    dress(ctx) { const { gx, gc, r2, feat, props, taken, put, P, dec, tree, native, rail, rnd, flat } = ctx;
        props.push({ key: 'decor_windpump_tower', x: gx(54), z: gx(41), h: 11 }, { key: 'decor_windpump_wheel', x: gx(54), z: r2(gx(41) + 0.9), y: 10.2, span: 4.2 });   // THE WINDMILL (the landmark)
        [[53, 40], [54, 40], [53, 41], [54, 41]].forEach(q => taken.add(q[0] + ':' + q[1])); dec('wooden_bucket', 55, 41); P('cave_torch', 51, 44);
        [[38, 40, 60], [41, 44, 200], [45, 38, 300], [39, 46, 120], [46, 45, 20]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 42, 41); dec('grasshopper_jump', 44, 46); dec('butterfly', 40, 43);
        tree(37, 37, 'tree_2', 8); tree(47, 47, 'tree', 7.5); props.push({ key: 'trailer_home_2', x: r2(gx(38) + 8.75), z: gx(39), face: 0 }); for (let y = 38; y < 40; y++) for (let x = 38; x < 43; x++) taken.add(x + ':' + y);
        P('car_truck', 64, 41, { face: 180, span: 6.8 }); dec('meshy_burlap_sack', 66, 43); dec('meshy_burlap_sack', 62, 44); dec('crow', 68, 38); dec('crow', 61, 46); dec('grasshopper_brown', 69, 45);
        { const O = [[40, 50], [44, 50], [46, 52], [46, 56], [44, 58], [40, 58], [38, 56], [38, 52]];   // THE PADDOCK: the ring's rail on the plan's line, its gate in the south side
          O.forEach((a, i) => { const b = O[(i + 1) % O.length]; if (i === 4) { feat({ k: 'rail', x0: gc(44), z0: gc(58), x1: gc(43) + 1.75, z1: gc(58), model: 'ranch' }); feat({ k: 'rail', x0: gc(41) - 1.75, z0: gc(58), x1: gc(40), z1: gc(58), model: 'ranch' }); }
              else feat({ k: 'rail', x0: gc(a[0]), z0: gc(a[1]), x1: gc(b[0]), z1: gc(b[1]), model: 'ranch' }); }); }
        P('horse_brown', 41, 53, { face: 75 }); P('horse_black', 43, 55, { face: 250 }); P('horse', 42, 51, { face: 15 }); dec('wooden_bucket', 40, 56);
        P('cave_torch', 50, 57); P('cave_torch', 59, 57); dec('psx_wooden_crate_1', 59, 55); P('psx_metal_barrel_mp_1', 50, 55);
        P('signpost', 37, 64, { face: 90 }); P('cave_torch', 37, 67); rail(36, 60, 36, 65); rail(36, 67, 36, 72);                         // THE RANCH GATE: the rail on the district's line, the gap on the track
        props.push({ key: 'trailer_home_4', x: r2(gx(39) + 8.75), z: gx(62), face: 0 }, { key: 'trailer_home_6', x: r2(gx(39) + 8.75), z: gx(70), face: 180 });   // the old Corn Fields' three trailers stand on the ranch now
        for (const y0 of [61, 69]) for (let y = y0; y < y0 + 2; y++) for (let x = 39; x < 44; x++) taken.add(x + ':' + y);
        [[52, 62, 200], [50, 68, 120], [54, 70, 300], [49, 64, 40], [53, 66, 250]].forEach(q => dec('chicken', q[0], q[1], { face: q[2] })); P('campfire', 50, 61); dec('cardboard_boxes', 51, 62); dec('anthill', 49, 70); dec('ant', 50, 70);
        P('psx_metal_barrel_mp_2', 55, 70); dec('wooden_bucket', 55, 67); P('cave_torch', 48, 66);
        rail(60, 60, 64, 60); rail(67, 60, 72, 60); rail(60, 60, 60, 65); rail(60, 67, 60, 72);                                            // THE COW FIELD's fence, a gap on each side
        [[63, 63, 270], [66, 66, 300], [69, 62, 0], [64, 69, 90]].forEach(q => P('cow', q[0], q[1], { face: q[2] })); dec('grasshopper', 67, 64); tree(70, 70, 'tree_2', 8); tree(61, 70, 'tree', 7);
        { /* THE HAY FIELD: straw bales in rows (the Halloween pack's), a stack by the truck, a scarecrow over them */
          for (let y = 37; y <= 46; y += 3) for (let x = 61; x <= 70; x += 3) { if (taken.has(x + ':' + y) || (x === 64 && y === 40)) continue; P(rnd() < 0.5 ? 'hw_straw' : 'hw_straw_2', x, y, { face: rnd() < 0.7 ? 0 : 90 }); }
          props.push({ key: 'hw_straw', x: gc(67), z: gc(41), face: 0 }, { key: 'hw_straw', x: r2(gc(67) + 1.5), z: gc(41), face: 0 }, { key: 'hw_straw_2', x: r2(gc(67) + 0.7), z: gc(41), y: 0.86, face: 0 }); taken.add('67:41');
          P('hw_scarecrow_2', 66, 38, { face: 180 });
          P('hw_straw', 58, 57, { face: 90 }); P('hw_straw_2', 58, 58, { face: 0 }); props.push({ key: 'hw_straw', x: gc(58), z: gc(57), y: 0.86, face: 90 });
          put(BARN, 'hw_straw', 9.6, -3.4, { face: 0 }); put(BARN, 'hw_straw', 9.6, -4.6, { face: 0 }); put(BARN, 'hw_straw_2', 9.6, -4.0, { face: 0, y: 0.86 }); put(BARN, 'hw_straw', -4.6, -8.6, { face: 90 });
          /* THE KITCHEN GARDEN east of the farmhouse: two tilled beds, their crops, pumpkins */
          for (const x of [70, 71]) { props.push({ key: 'hw_farmland', x: gc(x), z: gx(53), face: 0, y: 0.02 }); for (let i = 0; i < 4; i++) props.push({ key: ['hw_crop', 'hw_crop_2', 'hw_crop_3'][(x + i) % 3], x: r2(gc(x) + (i % 2 ? 0.4 : -0.4)), z: r2(gx(53) - 1.4 + i * 0.95), y: 0.2 }); }
          for (let y = 51; y < 55; y++) for (const x of [70, 71]) taken.add(x + ':' + y); dec('hw_pumpkin_4', 70, 55); dec('hw_pumpkin', 71, 50); dec('hw_pumpkin_2', 69, 56);
          /* the picket fence before the farmhouse porch, a gap at the door */
          const dx = FARM.at(FARM.door.lx, 0)[0]; for (let x = gx(62) + 0.83; x < gx(69); x += 1.66) { if (Math.abs(x - dx) < 1.8) continue; props.push({ key: 'hw_fence', x: r2(x), z: gx(58), face: 0 }); } }
        native('cowboy', 40, 64, 340); native('goatman', 44, 42, 200);
        flat(53, 40, 55, 42);   // the ground levelled under the windmill
    },
};
