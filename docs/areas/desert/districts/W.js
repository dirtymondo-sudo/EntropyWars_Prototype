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

   WHAT STANDS HERE TODAY (after THE EXTERIORS PASS, 2026-11-16; seen in the browser):
   - MAIN STREET (squares y 22..25) between two rows of fronts at real scale (7 to 17.5 m wide), a plank boardwalk down each side (rows 21
     and 26), the cross street on x 70..71. Every front is `western()` below (plank walls, false front, porch or balcony, a `rye` sign).
     North row, west to east: LIVERY STABLE (P08-02), BLACKSMITH, SALOON (P09-02, balcony), BARBER, BANK (P10-02), ASSAY OFFICE, TELEGRAPH,
     HOTEL (P11-02, balcony). South row: SHERIFF (P08-03), UNDERTAKER, the open lot with the well and the horse pond (P09-03),
     GENERAL STORE (P10-03), THE CORRAL (P11-03). All twelve are walk-in; the five small trades are new in this pass (generic frontier
     trades, no story names) and hold only a few first pieces.
   - THE CHURCH (P09-01): a narrow whitewashed nave, gable and steeple to the back street. BOOT HILL (P08-01): the hill inside a ranch
     rail, a timber gate with its name, crosses, headstones, grave mounds. THE WINDMILL (P10-01): windpump, well, water tower.
   - THE MINE (P11-01): a timbered adit in the rock (drawn; the rock stops the walker), a narrow track across the back street to a buffer.
   - THE CANYON (P11-04): a box canyon now; its south end is a rock wall (the other end is Giza's Canyon Mouth, far off since the move).
   - THE WAGON CAMP (P09-04): campfire, two tents, two covered wagons. OPEN RANGE (P10-04): skulls, snags. Twelve hitching rails.
   - THE TRAIL IN (P08-04): the way in from the Highway's Exit 3 (the county road and the overpass are the tool's).
   - People: sheriff, two cowboys (one says the old flight line's cowboy line), a skeleton on Boot Hill.

   NEEDS A MODEL (nothing in the packs or the catalogue; no stand-in placed): anvil + forge (the blacksmith has a brazier and barrels only),
   water trough, hay bale, mine cart, pickaxe, wanted poster, tumbleweed, gallows, a canvas prospector's tent (the camp's two are modern
   camping tents), a telegraph key / pole.

   KNOWN MISSING OR WRONG:
   - INTERIORS (next pass): every inside holds only the first build's pieces fitted to the new walls; none was judged on screen. The hotel
     and the saloon have no upstairs (the balcony is drawn only). THE MINE has no inside.
   - Thin: the south half (The Trail In, Open range, The Canyon's floor) is nearly empty; no lamps, no troughs; the box canyon holds nothing.
   - Fights use the old plateau's table everywhere (data.js HQ_AREA_ENCOUNTERS, not this file's).
   - Door leaves DO draw in the probe here (saloon, church, jail seen 11-16); the open finding in "THE LOOK PASS" is not true of this town.

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
let C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS;
const bind = ctx => ({ C, gx, gc, r2, feat, props, doors, npc, count, line, setRect, pen, building, sheet, put, SOLID, P, Pm, dec, native, rnd, setPaint, sayOf, O_GIZA, O_GATE, O_LINE, O_CARN, U, WD, WD2, SHG, FLR, GLS, RIB, COR, CONC, PLAS } = ctx);
let STABLES, SMITH, SALOON, BARBER, BANK, ASSAY, WIRE, HOTEL, JAIL, COFFINS, STORE, CHURCH;
const PLANKS = 'urban:WoodFlooring1a';
exports.dice = 3308375642;

/* A WESTERN FRONT: plank walls, corner posts, a false front taller than the roof with the name painted on it, a boardwalk porch on the
   square row before the door (posts + a lean-to roof, or a balcony), sash windows. Every one differs: height, colour, front, roof, porch. */
function western(a, w, d, door, o) {
    const h = o.h, tint = o.tint, trim = o.trim || 0x4a3626, rf = o.roofTint || 0x6a5a48, WK = o.key || WD;
    a.shell(w, h, d, WK, tint, door, [3.5, 1.75]);
    a.box(0, 0, 0, w - 0.1, 0.16, d - 0.1, FLR, 0x8c7a62, { uv: [1.75, 1.75] });                                                          // the boards inside, proud of the sand
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * w / 2, 0, sz * d / 2, 0.32, h, 0.32, WD2, trim);
    a.box(0, h - 0.25, d / 2 + 0.08, w + 0.3, 0.25, 0.2, WD2, trim);
    if (o.roof === 'shed') a.roof('shed', 0, h, 0, w + 0.5, 1.1, d + 0.5, SHG, rf); else if (o.front) a.roof('gable', 0, h, -0.3, d - 0.3, o.rh || Math.max(0.9, Math.min(2.0, o.front - 0.3)), w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });   // behind a false front: lower than it, and it stops at its back (it hid the name)
    else a.roof('gable', 0, h, 0, d + 0.5, o.rh || 2.0, w + 0.5, SHG, rf, { ry: 90, keyEnd: WK, tintEnd: tint });
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

/* THE EXTERIORS PASS (2026-11-16, the Western Town thread). The first build's seven fronts were 24 to 28 m wide (barns); a frontier front is
   7 to 17 m. Every front is redrawn at that scale, five small trades fill the rows (blacksmith, barber, assay office, telegraph, undertaker),
   and one plank boardwalk runs down each side of Main Street. North row: fronts face south, their porches on square row 21. South row: fronts
   face north, porches on row 26. The cross street is squares x 70..71. */
exports.buildings = ctx => { bind(ctx);
    const RF = 0x9a8a78;
    STABLES = building('stables', [49, 16, 54, 21, 'S'], 6, { leaf: 'leaf_barn', floorIn: 'dirt_2' }, (a, w, d, door) => western(a, w, d, door, { h: 6, tint: 0xc08a60, roofTint: 0x8a6e58, rh: 3.2, porch: 'none', name: 'LIVERY STABLE', board: '#e8dcc0' }));
    SMITH = building('smith', [56, 18, 59, 21, 'S'], 4.2, { floorIn: 'dirt_2' }, (a, w, d, door) => western(a, w, d, door, { h: 4.2, tint: 0x9a8474, trim: 0x3a3028, roofTint: 0x6a625c, roof: 'shed', name: 'BLACKSMITH', ink: '#e8dcc0', board: '#3a3028' }));
    SALOON = building('saloon', [61, 16, 65, 21, 'S'], 7, { leaf: 'leaf_saloon', leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 7, tint: 0xd8785a, trim: 0x5a3424, roofTint: RF, front: 2.4, step: 0.9, porch: 'balcony', name: 'SALOON', ink: '#f0d890', board: '#3a1c14' }));
    BARBER = building('barber', [66, 18, 69, 21, 'S'], 4.6, {}, (a, w, d, door) => western(a, w, d, door, { h: 4.6, tint: 0xe8e0d0, trim: 0x8a3a30, roofTint: RF, front: 1.5, name: 'BARBER', ink: '#8a2a22', board: '#f0e8d8' }));
    BANK = building('bank', [73, 17, 76, 21, 'S'], 5.25, { leafDouble: true, keyIn: PLAS }, (a, w, d, door) => { western(a, w, d, door, { h: 5.25, tint: 0xf0e8d4, trim: 0x6a6458, roofTint: 0x70707a, front: 1.8, name: 'BANK', ink: '#e8c860', board: '#2a3a30' });
        for (const s of [-1, 1]) a.box(door.lx + s * 1.6, 0, d / 2 + 0.3, 0.5, 4.6, 0.5, PLAS, 0xe8e0cc); });
    ASSAY = building('assay', [77, 18, 80, 21, 'S'], 4.4, {}, (a, w, d, door) => western(a, w, d, door, { h: 4.4, tint: 0xc8a878, trim: 0x5a4028, roofTint: RF, front: 1.2, step: 0.6, name: 'ASSAY OFFICE', board: '#e8dcc0' }));
    WIRE = building('telegraph', [81, 18, 83, 21, 'S'], 4.9, {}, (a, w, d, door) => western(a, w, d, door, { h: 4.9, tint: 0xa8b4c0, trim: 0x3a4450, roofTint: RF, front: 1.6, name: 'TELEGRAPH', ink: '#f0e8d0', board: '#2a3440' }));
    HOTEL = building('hotel', [85, 15, 89, 21, 'S'], 8.75, { leafDouble: true }, (a, w, d, door) => western(a, w, d, door, { h: 8.75, tint: 0xe0c090, trim: 0x6a4630, roofTint: 0xa86a58, front: 1.4, porch: 'balcony', name: 'HOTEL', board: '#f0e8d0' }));
    JAIL = building('jail', [50, 27, 53, 30, 'N'], 4.2, { leaf: 'leaf_cell', keyIn: 'bricks_1', floorIn: 'cobblestone' }, (a, w, d, door) => { western(a, w, d, door, { h: 4.2, tint: 0xc8b8a0, trim: 0x4a443e, roofTint: 0x7a746c, roof: 'shed', front: 1.3, name: 'SHERIFF', ink: '#f0e8d0', board: '#3a3430' });
        a.box(0, 0, 0, w + 0.3, 1.2, d + 0.3, 'bricks_1', 0xc8b8a4, { top: false, faces: 'blr' }); });
    COFFINS = building('undertaker', [55, 27, 58, 30, 'N'], 5, {}, (a, w, d, door) => western(a, w, d, door, { h: 5, tint: 0x9a968e, trim: 0x2a2826, roofTint: 0x6a665e, front: 1.7, name: 'UNDERTAKER', ink: '#e8e4d8', board: '#1e1c1a' }));
    STORE = building('store', [73, 27, 77, 31, 'N'], 5.25, {}, (a, w, d, door) => western(a, w, d, door, { h: 5.25, tint: 0x9ab09a, trim: 0x3e4e40, roofTint: RF, front: 2.0, step: 0.7, name: 'GENERAL STORE', board: '#e8dcc0' }));
    /* THE CHURCH: a narrow nave, its gable end and steeple to the back street */
    CHURCH = building('church', [64, 0, 67, 5, 'S'], 6, { leafDouble: true }, (a, w, d, door) => { western(a, w, d, door, { h: 6, tint: 0xffffff, trim: 0xb0aaa0, roofTint: 0x6a6058, rh: 3.6, porch: 'none', key: PLAS });
        a.box(0, 6, d / 2 - 1.6, 2.6, 5.4, 2.6, PLAS, 0xffffff, { roof: true }); a.box(0, 9.2, d / 2 - 0.28, 1.0, 1.5, 0.06, WD2, 0x3a2a20, { roof: true });   // the steeple over the door, its louvre
        a.roof('pyramid', 0, 11.4, d / 2 - 1.6, 3.2, 3.8, 3.2, SHG, 0x6a6058);
        a.box(0, 15.2, d / 2 - 1.6, 0.16, 1.6, 0.16, WD2, 0x3a2a20, { roof: true }); a.box(0, 16.1, d / 2 - 1.6, 0.9, 0.16, 0.16, WD2, 0x3a2a20, { roof: true }); });
};

/* inside, in each building's own frame (x along the front, +z out of the door). The interiors pass furnishes them properly; this keeps what
   the first build had, fitted to the new walls, and gives the five new trades their first pieces. */
exports.furnish = ctx => { bind(ctx);
    put(SALOON, 'mobius_bar', -5, -4, { face: 90 }); for (const z of [-6, -4, -2]) put(SALOON, 'bar_stool', -3.3, z, {}); put(SALOON, 'decor_piano', 5, -7.3, { face: 180 });
    for (const q of [[2.5, 1.5], [3, -3.2]]) { put(SALOON, 'round_table', q[0], q[1], {}); put(SALOON, 'psx_chair_mp_1', q[0] + 1.1, q[1], { face: 270 }); put(SALOON, 'psx_chair_mp_1', q[0] - 1.1, q[1], { face: 90 }); }
    put(SALOON, 'psx_glass_bottle_1', -5, -3, { y: 1.5 }); put(SALOON, 'psx_glass_bottle_2', -5, -5, { y: 1.5 }); put(SALOON, 'psx_wooden_crate_2', 5.5, 6.5, {}); put(SALOON, 'slot_machine', 6, 3.5, { face: 270 });
    put(BANK, 'vault', 0, -5, { face: 180 }); put(BANK, 'form_counter', 0, 0.5, { face: 180 }); put(BANK, 'floor_safe', -4, -5.5, {}); put(BANK, 'money_sacks', 4, -5.5, {}); put(BANK, 'money_counter', 2.5, 0.5, { y: 1.0 });
    put(BANK, 'psx_gold_bar_pcs_1', -2, 0.5, { y: 1.02 }); put(BANK, 'iron_garden_bench', -4.2, 4.5, { face: 90 });
    put(JAIL, 'cell_bars', -3.5, -1.5, { face: 0 }); put(JAIL, 'cell_bars', 3.5, -1.5, { face: 0 }); put(JAIL, 'cot', -3.5, -4, { face: 90 }); put(JAIL, 'cot', 3.5, -4, { face: 90 }); put(JAIL, 'wooden_bucket', -1.6, -4.4, {});
    put(JAIL, 'exec_desk', 0, 2.2, { face: 180 }); put(JAIL, 'footlocker', -4.2, 3.6, { face: 90 }); put(JAIL, 'notice_board', 3, 4.9, { face: 0, y: 1.5 });
    for (const z of [-3, -0.5, 2, 4.5]) for (const x of [-2.6, 2.6]) put(CHURCH, 'church_pew', x, z, { face: 0 }); put(CHURCH, 'stone_altar', 0, -7, {}); put(CHURCH, 'candle_ring', -3, -7.2, {}); put(CHURCH, 'ships_bell', 3, -7, { y: 0.02 });
    put(STORE, 'form_counter', 0, -2.5, { face: 180 }); for (const x of [-5.5, -2.5, 2.5, 5.5]) put(STORE, 'psx_shelf_mp_2', x, -6.2, { face: 0 }); put(STORE, 'psx_wooden_crate_2', -5, 3, {}); put(STORE, 'psx_wooden_crate_3', -4, 4.4, { face: 30 });
    put(STORE, 'psx_metal_barrel_mp_1', 5, 3.5, {}); put(STORE, 'meshy_burlap_sack', 4, 2.4, {}); put(STORE, 'meshy_burlap_sack', 5, 5, {});
    put(STABLES, 'horse', -6, -5, { face: 90 }); put(STABLES, 'horse_brown', -2, -5, { face: 90 }); put(STABLES, 'horse_black', 2, -5, { face: 90 }); put(STABLES, 'meshy_burlap_sack', 6, -7, {}); put(STABLES, 'wooden_bucket', 4.5, -7, {}); put(STABLES, 'psx_wooden_crate_2', 7, 5, {});
    for (const q of [[-5, -9], [-5, -6], [-5, -3], [5, -9], [5, -6], [5, -3]]) put(HOTEL, 'psx_bed_1', q[0], q[1], { face: q[0] < 0 ? 90 : 270 }); put(HOTEL, 'form_counter', 0, 4, { face: 180 }); put(HOTEL, 'wingback_chair', -4.5, 8, { face: 160 }); put(HOTEL, 'rug_round', 0, 0, { y: 0.17 });
    put(BARBER, 'barber_chair', -2, -1, { face: 180 }); put(BARBER, 'barber_chair', 1.5, -1, { face: 180 }); put(BARBER, 'barber_mirror', -2, -4.9, { face: 0, y: 1.3 }); put(BARBER, 'barber_mirror', 1.5, -4.9, { face: 0, y: 1.3 }); put(BARBER, 'iron_garden_bench', 4.2, 2.5, { face: 270 });
    put(COFFINS, 'psxg_coffin', -2.6, -2.2, { face: 0 }); put(COFFINS, 'psxg_coffin', -0.6, -2.2, { face: 0 }); put(COFFINS, 'trap_coffin_open', 3, -3, { face: 180 }); put(COFFINS, 'form_counter', 0, 2.2, { face: 180 }); put(COFFINS, 'hw_shovel', 4.4, 3.8, {});
    put(ASSAY, 'form_counter', 0, -1, { face: 180 }); put(ASSAY, 'floor_safe', -3.8, -4.2, {}); put(ASSAY, 'psx_gold_bar_pcs_1', 1, -1, { y: 1.17 }); put(ASSAY, 'psx_wooden_crate_2', 3.8, -4, {}); put(ASSAY, 'money_sacks', 3.6, 3.4, {});
    put(WIRE, 'exec_desk', 0, -2.2, { face: 180 }); put(WIRE, 'psx_chair_mp_1', 0, -3.6, { face: 180 }); put(WIRE, 'notice_board', 1.6, 4.9, { face: 0, y: 1.5 });
    put(SMITH, 'brazier', 0, -3, {}); put(SMITH, 'psx_metal_barrel_mp_1', -3.8, -4, {}); put(SMITH, 'wooden_bucket', 1.6, -3.4, {}); put(SMITH, 'psx_wooden_crate_2', 3.8, -3.8, {}); put(SMITH, 'hw_shovel', -4.4, 1, {});
};

exports.ground = ctx => { bind(ctx);
    /* THE BOARDWALKS: one plank walk down each side of Main Street, from front to front */
    for (let x = 49; x < 95; x++) if (x !== 70 && x !== 71) setPaint(x, 21, PLANKS);
    for (let x = 49; x < 83; x++) if (x !== 70 && x !== 71) setPaint(x, 26, PLANKS);
    /* BOOT HILL: the low hill, a ranch rail round it, the gate on the back street */
    feat({ k: 'hill', x: gc(53), z: gc(3), r: 13, h: 2.6 }); pen(49, 0, 57, 6, [2, 53]);
    { const a = sheet(); for (const s of [-1, 1]) a.box(s * 1.9, 0, 0, 0.28, 3.6, 0.28, WD2, 0x6a4e3a); a.box(0, 3.3, 0, 4.4, 0.24, 0.3, WD2, 0x6a4e3a); a.sign('BOOT HILL', 0, 2.5, 0.06, 3.4, 0.75, '#2a1a10', '#d8c090', 'rye'); a.sign('BOOT HILL', 0, 2.5, -0.06, 3.4, 0.75, '#2a1a10', '#d8c090', 'rye', { ry: 180 });
        feat({ k: 'arch', id: 'des:w:boothill', x: gc(53), z: gc(6), rot: 0, parts: a.P }); }
    [[51, 1], [53, 1], [55, 1], [50, 3], [52, 3], [54, 3], [56, 3], [51, 5], [55, 5]].forEach((q, i) => { const k = i % 3;
        Pm(k === 0 ? 'psx_cross_mp_2' : k === 1 ? 'cross' : 'psxg_tombstone_' + (1 + i % 3), gc(q[0]), gc(q[1]) - 0.9, k === 2 ? { face: 180 } : { face: 180, h: 1.5 }); Pm('psxg_dirt_grave', gc(q[0]), gc(q[1]) + 0.5, { face: 0 }); });
    P('psxg_dead_tree_1', 57, 2, {}); dec('skull', 55, 4); dec('trap_coffin_lid', 49, 2); dec('hw_shovel', 52, 4);
    Pm('decor_windpump_tower', gc(77), gc(3), { h: 11 }); Pm('decor_windpump_wheel', gc(77), gc(3) + 0.9, { y: 10.2, span: 4.2 }); P('ancient_well', 79, 4, {}); dec('wooden_bucket', 78, 5); P('cow', 81, 3, { face: 240 });
    /* THE MINE: a timbered adit in the rock's south face (three sets, plank lagging, the dark behind), a narrow track out of it across the back
       street to the ore dump. Drawn; the rock stops the walker at the face. */
    { const a = sheet(), T = 0x7a5a40, DK = 0x0c0a08;
        a.box(0, 0, -1.0, 3.4, 2.9, 0.2, WD2, DK); a.box(0, 0, 0.9, 3.0, 0.04, 3.8, 'dirt_2', 0x5a4a3a, { sides: false });
        for (const z of [0.2, 1.5, 2.8]) { for (const s of [-1, 1]) a.box(s * 1.6, 0, z, 0.32, 2.7, 0.32, WD2, T); a.box(0, 2.7, z, 4.0, 0.34, 0.36, WD2, T); }
        a.box(0, 3.04, 1.0, 3.8, 0.1, 4.0, WD, 0x8a6a4c); for (const s of [-1, 1]) a.box(s * 1.72, 0, 0.9, 0.08, 2.7, 3.8, WD, 0x6a5038);
        a.sign('MINE', 0, 3.2, 3.0, 2.4, 0.7, '#e8dcc0', '#3a2a1c', 'rye');
        for (const s of [-1, 1]) a.box(s * 0.45, 0.06, 7.2, 0.08, 0.1, 15.6, RIB, 0x4a4440); a.box(0, 0, -0.4, 1.5, 0.07, 0.2, WD2, 0x4a3626, { n: 24, step: [0, 0, 0.66] });
        a.box(0, 0, 15.2, 1.6, 0.7, 0.3, WD2, T);                                                                                                           // the buffer at the track's end
        feat({ k: 'arch', id: 'des:w:mine', x: gx(90), z: gx(5), rot: 0, parts: a.P }); }
    P('psx_metal_barrel_mp_1', 92, 6, {}); P('psx_wooden_crate_2', 93, 6, {}); dec('railway_lantern', 88, 6); dec('psx_wooden_crate_3', 91, 9); dec('hw_shovel', 88, 8);
    /* THE CANYON (P11-04): its other end is Giza's now, a long way off, so this end is a box canyon: the slot stops at a rock wall */
    feat({ k: 'plateau', x: gx(91), z: gx(46.5), w: 4 * C, d: 3 * C, h: 8.75, edge: 0.5 });
    /* MAIN STREET: the well where the showdown happens, the horse pond on the open lot south of it */
    P('ancient_well', 66, 24, {}); dec('wooden_bucket', 67, 24); P('signpost', 59, 22, { face: 90 });
    feat({ k: 'pool', x: gx(65), z: gx(30), r: 3.2, rz: 3.2, y: -0.2, depth: 0.8, key: 'water', bank: 0.8 });
    [[55, 21], [60, 21], [69, 21], [80, 21], [84, 21], [54, 26], [59, 26], [78, 26]].forEach(q => dec(rnd() < 0.5 ? 'psx_metal_barrel_mp_1' : 'psx_wooden_crate_2', q[0], q[1]));
    Pm('horse', gc(54), gc(22) + 1.7, { face: 0 }); Pm('horse_brown', gc(77), gc(25) - 1.7, { face: 180 }); P('iron_garden_bench', 72, 21, { face: 180 }); P('rocking_chair', 49, 26, { face: 0 });
    Pm('barber_pole', gc(69) - 0.6, gx(21) + 0.3, { y: 1.5 }); Pm('psxg_coffin', gc(58) + 0.4, gx(27) - 0.5, { face: 90 }); Pm('trap_coffin_lid', gc(54) + 0.9, gx(27) - 0.4, {});
    pen(84, 28, 88, 34, [0, 86]); P('horse_black', 85, 30, { face: 90 }); P('cow', 86, 32, { face: 300 }); P('cow', 87, 30, { face: 40 }); dec('wooden_bucket', 85, 33);                           // THE CORRAL
    P('campfire', 66, 44, {}); Pm('camping_tent', gc(64), gc(45), { face: 120 }); Pm('camping_tent', gc(68), gc(46), { face: 220 }); dec('sea_chest', 67, 46); dec('instrument_guitar_lying', 65, 43);
    dec('skull', 76, 43); dec('skull', 80, 39); dec('psx_fish_skeleton_mp_1', 78, 45, { y: 0.02 }); P('dead_snag', 74, 40, {}); P('dead_snag', 79, 42, {});
    native('sheriff', 52, 25, 0); native('cowboy', 64, 22, 180, sayOf(O_LINE, 'cowboy')); native('cowboy', 60, 24, 90); native('skeleton', 54, 2, 180);
};

/* THE MESHY PIECES (mondo 11-15 19:01 "okay go ahead": the packs have no cactus, covered wagon, water tower or hitching rail) */
exports.pieces = ctx => { bind(ctx);
    [[49, 22], [54, 22], [60, 22], [65, 22], [72, 22], [76, 22], [84, 22], [89, 22], [53, 25], [58, 25], [72, 25], [77, 25]].forEach(q => P('hitching_rail', q[0], q[1], { face: 0 }));   // along Main Street, clear of every door
    Pm('covered_wagon', gx(62), gc(42), { face: 0 }); Pm('covered_wagon', gx(71), gc(47), { face: 180 });                                                   // THE WAGON CAMP
    Pm('water_tower_west', gx(74), gx(9), {});                                                                                                               // by the windmill, on 2 x 2 squares
};
