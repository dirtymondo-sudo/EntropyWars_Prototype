/* THE DESERT · WESTERN TOWN (district W, 16 plots) — the district file of `node bake-desert.js` (repo tooling, never uploaded).
   One thread = this one file. The tool, layout.json, the Highway and every shared piece belong to the tool's row on the board (docs/notes/claims.md).

   THE PLOTS (ids + names: docs/areas/desert/layout.json; a plot is 12 x 12 squares of 3.5 m):
     P08-01  Boot Hill                      home squares x 48..60 · y 0..12
     P09-01  The Church                     home squares x 60..72 · y 0..12
     P10-01  The Windmill                   home squares x 72..84 · y 0..12
     P11-01  The Mine                       home squares x 84..96 · y 0..12
     P08-02  The Stables                    home squares x 48..60 · y 12..24
     P09-02  The Saloon                     home squares x 60..72 · y 12..24
     P10-02  The Bank                       home squares x 72..84 · y 12..24
     P11-02  The Hotel                      home squares x 84..96 · y 12..24
     P08-03  The Jail                       home squares x 48..60 · y 24..36
     P09-03  Main Street                    home squares x 60..72 · y 24..36
     P10-03  The General Store              home squares x 72..84 · y 24..36
     P11-03  The Corral                     home squares x 84..96 · y 24..36
     P08-04  The Trail In                   home squares x 48..60 · y 36..48
     P09-04  The Wagon Camp                 home squares x 60..72 · y 36..48
     P10-04  Open range                     home squares x 72..84 · y 36..48
     P11-04  The Canyon                     home squares x 84..96 · y 36..48

   WHAT STANDS HERE TODAY:
   - MAIN STREET (P09-03) runs east-west between two rows of fronts; every front is `western()` below (plank walls, false front, porch, a
     `rye` sign). Walk-in, each with its inside: the LIVERY STABLE (P08-02), the SALOON (P09-02, a drawn balcony), the BANK (P10-02, vault),
     the HOTEL (P11-02, six beds), the SHERIFF's jail (P08-03, cells), the GENERAL STORE (P10-03), the CHURCH with its steeple (P09-01).
   - BOOT HILL (P08-01): a low hill, nine crosses. THE WINDMILL (P10-01): the windpump, a well, the water tower. THE MINE (P11-01): a culvert
     mouth in the rock, a pipe rail out of it. THE CORRAL (P11-03): a ranch-rail pen, a horse, two cows.
   - THE WAGON CAMP (P09-04): campfire, two tents, two covered wagons. OPEN RANGE (P10-04): skulls, snags. Nine hitching rails on Main Street.
   - THE TRAIL IN (P08-04): the way in from the Highway's Exit 3 (the county road and the overpass are the tool's).
   - People: sheriff, two cowboys (one says the old flight line's cowboy line), a skeleton on Boot Hill.

   KNOWN MISSING OR WRONG (from docs/notes/areas-complexes.md "THE DESERT ON PLOTS", "THE DESERT'S INSIDES", "THE LOOK PASS", "THE HIGHWAY"):
   - THE CANYON (P11-04) is cut in two by the move: it ran from the town to Giza's Dig; each end now opens on sand. It needs an end of its own.
   - THE MINE has no inside (a mouth and nothing behind it). The hotel and the saloon have no upstairs (the balcony is drawn only).
   - Never judged on screen: sign sizes, the false fronts, the porches, prop scale.
   - Thin: the south half (The Trail In, Open range, The Canyon) is nearly empty; no lamps, no troughs, no boardwalk between the fronts.
   - Not seen on screen since the blocks were moved apart (the same rows, shifted). Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS).
   - No door leaf drew in the probe on any swinging door ("THE LOOK PASS": shared city-door code or the probe; check on a real machine first).

   THE HOOKS (bake-desert.js "THE DISTRICT FILES" has the whole list of what ctx holds; each hook is optional):
     buildings(ctx)  the walk-in / shut buildings: building(id, [sx0, sy0, sx1, sy1, side], h, opts, parts) -> a handle (at, face, cx, cz)
     furnish(ctx)    what stands inside them: put(handle, key, lx, lz, opts), in the building's own frame
     ground(ctx)     everything on the open ground: P / Pm / dec (props), feat (terrain rows), pen, native (people), line (flat paint),
                     setPaint(sx, sy, sheet) (one of the room's seven ground sheets on a square of this block)
     pieces(ctx)     late pieces, after every district's ground
     doors(ctx)      the doors to other rooms (doors.push)
     dice            this file's own dice (ctx.rnd / ctx.dec): another district's change never re-throws them
     rooms(kit)      the rooms behind this district's doors, for bake-desert-insides.js (its kit: mk, the sheets)
   THE FRAME: this file is written in the FIRST BUILD's squares (sx 0..96 west to east, sy 0..96 north to south; gx = a square's west / north
   line in metres, gc = its middle). The tool moves every row this file makes to where the block stands in the 144-square room:
   room square = home square + (48, 12). Keep to your own block; the tool warns about a row outside it.
   REBAKE: node bake-desert.js   (--dry-run prints the counts). Rules: docs/notes/areas-complexes.md "THE DESERT, THE DISTRICT FILES". */
'use strict';
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, put, SOLID, P, Pm, dec, native, rnd, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let STABLES, SALOON, BANK, HOTEL, JAIL, STORE, CHURCH;
exports.dice = 3308375642;

/* A WESTERN FRONT: plank walls, corner posts, a false front taller than the roof with the name painted on it, a boardwalk porch on the
   square row before the door (posts + a lean-to roof, or a balcony), sash windows. Every one differs: height, colour, front, roof, porch. */
function western(a, w, d, door, o) {
    const h = o.h, tint = o.tint, trim = o.trim || 0x4a3626, rf = o.roofTint || 0x6a5a48;
    a.shell(w, h, d, WD, tint, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });                                                          // the boards inside, proud of the sand
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.32, h, 0.32, WD2, trim);
    a.box(0, h - 0.25, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, trim);
    if (o.roof === 'shed') a.roof('shed', 0, h, 0, w + 0.5, 1.1, d + 0.5, SHG, rf); else a.roof('gable', 0, h, 0, d + 0.5, o.rh || 2.0, w + 0.5, SHG, rf, { ry: 90, keyEnd: WD, tintEnd: tint });
    if (o.front) { a.box(0, h, d / 2 - 0.05, w + 0.3, o.front, 0.24, WD, tint, { roof: true, uv: [3.5, 1.75] }); a.box(0, h + o.front, d / 2 - 0.05, w + 0.8, 0.26, 0.5, WD2, trim, { roof: true });
        if (o.step) a.box(0, h + o.front + 0.26, d / 2 - 0.05, w * 0.5, o.step, 0.24, WD, tint, { roof: true }); }
    /* the doorway's frame, the windows either side of it (and a row upstairs on a two-storey front) */
    a.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, WD2, trim); a.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, WD2, trim);
    for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { if (Math.abs(x - door.lx) < 1.7) continue;
        a.box(x, 1.0, d / 2 + 0.06, 1.3, 1.4, 0.08, GLS, 0xe0cc98, { glow: 0.35 }); a.box(x, 0.86, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); a.box(x, 2.4, d / 2 + 0.12, 1.7, 0.14, 0.16, WD2, trim); }
    if (h >= 7) for (let x = -w / 2 + 1.75; x < w / 2; x += 3.5) { a.box(x, 4.5, d / 2 + 0.06, 1.2, 1.5, 0.08, GLS, 0xc8d4e0); a.box(x, 4.36, d / 2 + 0.12, 1.6, 0.14, 0.16, WD2, trim); }
    for (const s of [-1, 1]) for (let z = -d / 2 + 2.6; z < d / 2 - 1; z += 5.25) a.box(s * (w / 2 + 0.06), 1.0, z, 0.08, 1.4, 1.2, GLS, 0xc8d4e0);
    /* the porch */
    if (o.porch !== 'none') { a.box(0, 0, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62);
        const n = Math.max(2, Math.round(w / 3.5)), py = o.porch === 'balcony' ? 3.5 : 2.9;
        for (let i = 0; i <= n; i++) { const x = -w / 2 + 0.25 + i * (w - 0.5) / n; if (Math.abs(x - door.lx) < 0.9) continue; a.box(x, 0, d / 2 + 3.25, 0.2, py, 0.2, WD2, trim); }
        if (o.porch === 'balcony') { a.box(0, 3.5, d / 2 + 1.75, w, 0.16, 3.4, FLR, 0x8c7a62, { under: true }); a.box(0, 3.66, d / 2 + 3.3, w, 0.9, 0.1, WD2, trim);
            for (const s of [-1, 1]) a.box(s * (w / 2 - 0.05), 3.66, d / 2 + 1.75, 0.1, 0.9, 3.3, WD2, trim);
            for (let i = 0; i <= n; i++) a.box(-w / 2 + 0.25 + i * (w - 0.5) / n, 3.66, d / 2 + 3.25, 0.18, 2.9, 0.18, WD2, trim);
            a.roof('shed', 0, 6.55, d / 2 + 1.85, w + 0.6, 0.7, 3.8, SHG, rf); }
        else a.roof('shed', 0, py, d / 2 + 1.85, w + 0.6, 0.8, 3.8, SHG, rf); }
    /* the name */
    if (o.name) { const sw = Math.min(w - 1.2, o.name.length * 0.95 + 1.2), y = o.front ? h + (o.front - 1.0) / 2 : h - 1.25;
        a.sign(o.name, 0, y, d / 2 + (o.front ? 0.09 : 0.12), sw, 1.0, o.ink || '#2a1a10', o.board || '#d8c090', 'rye', o.front ? { roof: true } : null); }
}

exports.buildings = ctx => { bind(ctx);
    /* WESTERN TOWN (Main Street runs east-west between the two rows; every front faces it) */
    STABLES = building('stables', [49, 15, 57, 21, 'S'], 5.25, { leaf: 'leaf_barn', floorIn: 'dirt_2' }, (a, w, d, door) => western(a, w, d, door, { h: 5.25, tint: 0x8a5a3c, roofTint: 0x5a4636, rh: 3.0, porch: 'none', name: 'LIVERY STABLE', board: '#e8dcc0' }));
    SALOON = building('saloon', [61, 14, 69, 21, 'S'], 7, { leaf: 'leaf_saloon', leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 7, tint: 0xa0503c, trim: 0x3a2418, front: 2.4, step: 0.9, porch: 'balcony', name: 'SALOON', ink: '#f0d890', board: '#3a1c14' }));
    BANK = building('bank', [73, 16, 80, 21, 'S'], 5.25, { leafDouble: true, keyIn: PLAS }, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0xc8c0a8, trim: 0x5a5448, roofTint: 0x4a4a52, front: 1.8, name: 'BANK', ink: '#e8c860', board: '#2a3a30' });
        for (const s of [-1, 1]) a.box(door.lx + s * 1.6, 0, d / 2 + 0.3, 0.5, 4.6, 0.5, PLAS, 0xe0d8c4); });
    HOTEL = building('hotel', [85, 14, 93, 21, 'S'], 8.75, { leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 8.75, tint: 0xb89868, trim: 0x4a3020, roofTint: 0x7a4638, front: 1.4, porch: 'balcony', name: 'HOTEL', board: '#f0e8d0' }));
    JAIL = building('jail', [49, 27, 57, 32, 'N'], 4.2, { leaf: 'leaf_cell', keyIn: 'bricks_1', floorIn: 'cobblestone' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0x9a8a78, trim: 0x3a3430, roof: 'shed', front: 1.3, name: 'SHERIFF', ink: '#f0e8d0', board: '#3a3430' });
        a.box(0, 0, 0, w + 0.3, 1.2, d + 0.3, 'bricks_1', 0xb0a08c, { top: false, faces: 'blr' }); });
    STORE = building('store', [73, 27, 80, 32, 'N'], 5.25, {}, (a, w, d, door) => western(a, w, d, door, { h: 5.25, tint: 0x6a7a6a, trim: 0x2e3a30, front: 2.0, step: 0.7, name: 'GENERAL STORE', board: '#e8dcc0' }));
    CHURCH = building('church', [63, 1, 68, 5, 'S'], 7, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 7, tint: 0xe8e4d8, trim: 0x8a8478, roofTint: 0x4a4038, rh: 4.2, porch: 'none' });
        a.box(0, 7, d / 2 - 1.6, 2.6, 5.2, 2.6, WD, 0xe8e4d8, { roof: true }); a.roof('pyramid', 0, 12.2, d / 2 - 1.6, 3.2, 3.6, 3.2, SHG, 0x4a4038);          // the steeple over the door
        a.box(0, 16.0, d / 2 - 1.6, 0.16, 1.6, 0.16, WD2, 0x3a2a20, { roof: true }); a.box(0, 16.9, d / 2 - 1.6, 0.9, 0.16, 0.16, WD2, 0x3a2a20, { roof: true }); });
};

exports.furnish = ctx => { bind(ctx);
    put(SALOON, 'mobius_bar', -8.5, -6, { face: 90 }); for (const z of [-8, -6, -4]) put(SALOON, 'bar_stool', -6.6, z, {}); put(SALOON, 'decor_piano', 9.5, -8.5, { face: 180 });
    for (const q of [[-3, 2], [4, 3], [5, -4], [-2, -5]]) { put(SALOON, 'round_table', q[0], q[1], {}); put(SALOON, 'psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); put(SALOON, 'psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); }
    put(SALOON, 'psx_glass_bottle_1', -8.5, -5, { y: 1.5 }); put(SALOON, 'psx_glass_bottle_2', -8.5, -7, { y: 1.5 }); put(SALOON, 'psx_wooden_crate_2', 11, 9, {}); put(SALOON, 'slot_machine', 12, 0, { face: 270 });
    put(BANK, 'vault', 0, -6, { face: 180 }); put(BANK, 'form_counter', 0, 1.5, { face: 180 }); put(BANK, 'floor_safe', -9, -6.5, {}); put(BANK, 'money_sacks', 8.5, -6.5, {}); put(BANK, 'money_counter', 4, 1.5, { y: 1.0 });
    put(BANK, 'psx_gold_bar_pcs_1', -4, 1.5, { y: 1.02 }); put(BANK, 'iron_garden_bench', -9, 6, { face: 90 });
    put(JAIL, 'cell_bars', -8.75, -1.5, { face: 0 }); put(JAIL, 'cell_bars', -5.25, -1.5, { face: 0 }); put(JAIL, 'cell_bars', 5.25, -1.5, { face: 0 }); put(JAIL, 'cell_bars', 8.75, -1.5, { face: 0 });
    put(JAIL, 'cot', -8, -6, { face: 90 }); put(JAIL, 'cot', 8, -6, { face: 90 }); put(JAIL, 'wooden_bucket', -5.6, -6.6, {}); put(JAIL, 'exec_desk', 0, 3, { face: 180 }); put(JAIL, 'rocking_chair', 2.6, -0.2, { face: 200 });
    put(JAIL, 'footlocker', -11, 5, { face: 90 }); put(JAIL, 'notice_board', 4.5, 7.6, { face: 0, y: 1.5 });
    for (const z of [-3.5, -0.5, 2.5]) for (const x of [-4.6, 4.6]) put(CHURCH, 'church_pew', x, z, { face: 0 }); put(CHURCH, 'stone_altar', 0, -5.6, {}); put(CHURCH, 'candle_ring', -3, -5.8, {}); put(CHURCH, 'ships_bell', 3, -5.6, { y: 0.02 });
    put(STORE, 'form_counter', 0, -3, { face: 180 }); for (const x of [-9.5, -6, 6, 9.5]) put(STORE, 'psx_shelf_mp_2', x, -6.6, { face: 0 }); put(STORE, 'psx_wooden_crate_2', -9, 3, {}); put(STORE, 'psx_wooden_crate_3', -7.6, 4.2, { face: 30 });
    put(STORE, 'psx_metal_barrel_mp_1', 9, 4, {}); put(STORE, 'meshy_burlap_sack', 7.6, 3, {}); put(STORE, 'meshy_burlap_sack', 8.4, 5.4, {});
    put(STABLES, 'horse', -9, -4, { face: 90 }); put(STABLES, 'horse_brown', -3, -4, { face: 90 }); put(STABLES, 'horse_black', 3, -4, { face: 90 }); put(STABLES, 'meshy_burlap_sack', 10, -8, {}); put(STABLES, 'wooden_bucket', 6, -8, {}); put(STABLES, 'psx_wooden_crate_2', 11, 6, {});
    for (const q of [[-9, -7], [-9, -3], [-9, 1], [9, -7], [9, -3], [9, 1]]) put(HOTEL, 'psx_bed_1', q[0], q[1], { face: q[0] < 0 ? 90 : 270 }); put(HOTEL, 'form_counter', 0, 4, { face: 180 }); put(HOTEL, 'wingback_chair', -4, 8, { face: 160 }); put(HOTEL, 'rug_round', 0, -2, { y: 0.17 });
};

exports.ground = ctx => { bind(ctx);
    feat({ k: 'hill', x: gc(53), z: gc(3), r: 13, h: 2.6 });                                                              // BOOT HILL
    [[51, 1], [53, 1], [55, 1], [50, 3], [52, 3], [54, 3], [56, 3], [51, 5], [53, 5]].forEach((q, i) => Pm(i % 3 === 0 ? 'psx_cross_mp_2' : 'cross', gc(q[0]), gc(q[1]), { face: 180, h: 1.5 }));
    P('dead_snag', 57, 2, {}); dec('skull', 55, 4); dec('trap_coffin_lid', 49, 2);
    Pm('decor_windpump_tower', gc(77), gc(3), { h: 11 }); Pm('decor_windpump_wheel', gc(77), gc(3) + 0.9, { y: 10.2, span: 4.2 }); P('ancient_well', 79, 4, {}); dec('wooden_bucket', 78, 5); P('cow', 81, 3, { face: 240 });
    /* THE MINE: the mouth in the rock, the rails out of it */
    Pm('culvert_mouth', gx(90), gx(5) - 0.3, { face: 180, h: 3.2 }); feat({ k: 'rail', x0: gc(89), z0: gx(5), x1: gc(86), z1: gx(8), model: 'pipe', block: false }); P('psx_metal_barrel_mp_1', 92, 6, {}); P('psx_wooden_crate_2', 93, 6, {});
    dec('railway_lantern', 88, 6); P('luggage_cart', 87, 7, { face: 60 }); dec('cinder_block', 91, 7);
    P('ancient_well', 66, 24, {}); dec('wooden_bucket', 67, 24); P('signpost', 58, 23, { face: 90 });                      // MAIN STREET: the well where the showdown happens
    [[59, 21], [70, 21], [81, 21], [59, 26], [71, 26], [82, 26]].forEach(q => dec(rnd() < 0.5 ? 'psx_metal_barrel_mp_1' : 'psx_wooden_crate_2', q[0], q[1]));
    P('horse', 58, 21, { face: 0 }); P('horse_brown', 83, 26, { face: 180 }); P('iron_garden_bench', 71, 21, { face: 180 }); P('rocking_chair', 51, 26, { face: 0 });
    pen(84, 28, 88, 34, [0, 86]); P('horse_black', 85, 30, { face: 90 }); P('cow', 86, 32, { face: 300 }); P('cow', 87, 30, { face: 40 }); dec('wooden_bucket', 85, 33);                           // THE CORRAL
    P('campfire', 66, 44, {}); Pm('camping_tent', gc(64), gc(45), { face: 120 }); Pm('camping_tent', gc(68), gc(46), { face: 220 }); dec('sea_chest', 67, 46); dec('instrument_guitar_lying', 65, 43); P('luggage_cart', 70, 44, { face: 20 });
    dec('skull', 76, 43); dec('skull', 80, 39); dec('psx_fish_skeleton_mp_1', 78, 45, { y: 0.02 }); P('dead_snag', 74, 40, {}); P('dead_snag', 79, 42, {});
    native('sheriff', 53, 25, 0); native('cowboy', 65, 22, 180, sayOf(O_LINE, 'cowboy')); native('cowboy', 60, 24, 90); native('skeleton', 54, 2, 180);
};

/* THE MESHY PIECES (mondo 11-15 19:01 "okay go ahead": the packs have no cactus, covered wagon, water tower or hitching rail) */
exports.pieces = ctx => { bind(ctx);
    [[62, 22], [68, 22], [74, 22], [86, 22], [92, 22], [50, 22], [51, 25], [74, 25], [79, 25]].forEach(q => P('hitching_rail', q[0], q[1], { face: 0 }));       // along Main Street, clear of every door
    Pm('covered_wagon', gx(62), gc(42), { face: 0 }); Pm('covered_wagon', gx(71), gc(47), { face: 180 });                                                   // THE WAGON CAMP
    Pm('water_tower_west', gx(74), gx(9), {});                                                                                                               // by the windmill, on 2 x 2 squares
};
