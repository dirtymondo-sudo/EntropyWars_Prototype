/* HERO PLAZA — the district's buildings as parts lists (2026-11-13, mondo: "architect the buildings ... every building should be unique and
   purposeful and recognizable"; his OK on the plan 11-13 17:12). Read by bake-disaster-city.js THE DISTRICT FILES (build(ctx), after every row exists): each entry below
   draws one building with a `k: 'arch'` row (docs/notes/areas-complexes.md THE ARCHITECTURE ROW) and tells the tool what to do with the
   plan's own row (its collision, inside, door and walked roof stay with that row, its outside switched off).
   Frame: the building's middle, x east, z south, y up, metres. Sheets are mondo's own (the urban pack + the terrain sheets), tinted per part.
   NEVER the old gold sheet: `gold` is the terrain key that resolves to gilt.png (mondo 11-13: "there is a better gold texture").
   Plan + mock-up: https://claude.ai/artifact/36EML6wNh4PjGRH6u2hzhy · notes: areas-complexes.md "HERO PLAZA, THE BUILDINGS". */
'use strict';
const U = n => 'urban:' + n;
const STUCCO = U('PlasterWallStucco2a'), PLASTER = U('PlasterWallPainted1b'), CONC = U('ConcreteStriped2a'), CONC1 = U('ConcreteStriped1c'), TILE = U('TileSubway1a');
const G_TALL = U('GlassWindowTall1a'), G_SQ = U('GlassWindowSquare1a'), G_FAC = U('GlassWindowFactory1a'), G_RES = U('GlassWindowResidential1a'), G_RES2 = U('GlassWindowResidential2a');
const CORR = U('MetalCorrugatedPainted1a'), CORR2 = U('MetalCorrugatedPainted2a'), BRICK = 'bricks_3', MARBLE = 'marble_light', ALU = 'aluminium', GOLD = 'gold', WOOD = 'wood_planks', COBBLE = 'cobblestone', METAL = 'metal';
const SIDE_RY = { S: 0, W: 90, N: 180, E: 270 };

/* one building's parts, written with short helpers (x, z = the part's middle; y = its foot) */
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    return {
        P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [x, y, z], size: [w, h, d] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [x, y, z], r, h }, key, tint, o),
        dome: (x, y, z, r, h, key, tint, o) => add({ s: 'dome', p: [x, y, z], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o),
        quad: (x, y, z, w, h, ry, key, tint, o) => add({ s: 'quad', p: [x, y, z], size: [w, h], ry }, key, tint, o),
        /* the four walls of a walk-in building `sx` x `sz`, `h` high, 5 cm proud, the doorway cut on `side` at the tool's `lx` (hqTexbDoor) */
        shell(sx, h, sz, key, tint, door, o) {
            const e = 0.05, W = sx + 2 * e, D = sz + 2 * e;
            if (!door) return add({ s: 'box', p: [0, 0, 0], size: [W, h, D], top: false }, key, tint, o);
            const f = { S: 'f', N: 'b', W: 'l', E: 'r' }[door.side];
            add({ s: 'box', p: [0, 0, 0], size: [W, h, D], top: false, faces: 'fblr'.replace(f, '') }, key, tint, o);
            const ew = door.side === 'E' || door.side === 'W', n = { S: [0, D / 2], N: [0, -D / 2], W: [-W / 2, 0], E: [W / 2, 0] }[door.side];
            add({ s: 'quad', p: [n[0], 0, n[1]], size: [ew ? D : W, h], ry: SIDE_RY[door.side], hole: [door.lx, door.cw, door.h] }, key, tint, o);
        },
        /* n columns along a line */
        cols(x0, z0, x1, z1, n, r, h, key, tint) { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0; add({ s: 'cyl', p: [x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t], r, h, seg: 10 }, key, tint); } },
    };
}

/* ── THE BUILDINGS: id (the plan's) → { row, parts(door) } · row: what the plan's own row becomes ── */
const B = {};

/* 1 · NEWS OFFICE — an art-deco ziggurat: three setbacks in ivory stucco, copper-green cornices, window strips, a mast */
B['P04-04-B1'] = { row: { storeys: 2 }, parts(door) { const a = sheet(), IV = 0xf2e6c8, CU = 0x5fae9c, GL = 0xa8c8e8;
    a.shell(28, 10.5, 28, STUCCO, IV, door); a.box(0, 10.5, 0, 29.2, 0.6, 29.2, ALU, CU, { under: true });
    a.box(0, 11.1, 0, 21, 10.5, 21, STUCCO, IV); a.box(0, 21.6, 0, 22.2, 0.6, 22.2, ALU, CU, { under: true });
    a.box(0, 22.2, 0, 14, 7, 14, STUCCO, IV); a.box(0, 29.2, 0, 15.2, 0.6, 15.2, ALU, CU, { under: true });
    a.box(0, 29.8, 0, 7, 5, 7, STUCCO, 0xe0d0aa); a.roof('pyramid', 0, 34.8, 0, 7, 3.2, 7, ALU, CU); a.cyl(0, 38, 0, 0.22, 14, ALU, 0xcfd4d8, { seg: 6, r2: 0.05 }); a.cyl(0, 45, 0, 1.5, 0.3, null, 0xd03a30, { seg: 12 });
    for (const s of [-1, 1]) {
        for (const i of [-3, -1, 1, 3]) { a.box(i * 3.5, 1.4, s * 14.12, 2.2, 8.4, 0.2, G_TALL, GL); a.box(s * 14.12, 1.4, i * 3.5, 0.2, 8.4, 2.2, G_TALL, GL); }
        for (const i of [-2, 0, 2]) { a.box(i * 3.5, 12, s * 10.55, 2.2, 8.6, 0.2, G_TALL, GL); a.box(s * 10.55, 12, i * 3.5, 0.2, 8.6, 2.2, G_TALL, GL); }
        a.box(0, 23, s * 7.05, 2.2, 5.4, 0.2, G_TALL, GL); a.box(s * 7.05, 23, 0, 0.2, 5.4, 2.2, G_TALL, GL);
    }
    if (door) { const n = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] }[door.side], ew = n[0] !== 0, t = door.lx * (door.side === 'S' || door.side === 'W' ? 1 : -1);   // the marquee over the doorway
        a.box(ew ? n[0] * 15.6 : t, 3.3, ew ? (door.side === 'W' ? door.lx : -door.lx) : n[1] * 15.6, ew ? 3.2 : 9, 0.45, ew ? 9 : 3.2, GOLD, 0xffffff, { under: true }); }
    return a.P; } };

/* 2 · HERO WORKSHOP — a brick garage under a four-tooth sawtooth roof, north lights, a roller shutter, an exhaust stack */
B['P05-04-B1'] = { row: { storeys: 2, leaf: 'leaf_security' }, parts(door) { const a = sheet(), BR = 0xd8785c;
    a.shell(17.5, 7, 14, BRICK, BR, door); a.box(0, 7, 0, 17.9, 0.3, 14.4, ALU, 0xe8e0d0, { top: false });
    for (let i = 0; i < 4; i++) { const x = -6.5625 + i * 4.375;
        a.roof('shed', x, 7.3, 0, 13.9, 2.6, 4.375, CORR, 0xc04a40, { ry: 90, keyEnd: G_FAC, tintEnd: 0xd8ecf8 }); }
    a.box(4.6, 0, 7.12, 6, 4.4, 0.16, ALU, 0xd6dade); a.box(4.6, 4.4, 7.3, 6.6, 0.3, 0.6, null, 0xe8b820);        // the roller shutter + its yellow head
    a.box(0, 5.2, 7.14, 12, 1.3, 0.12, null, 0xe8b820);                                                           // the sign board (no lettering yet)
    a.cyl(6.6, 7.3, -4.6, 0.45, 5.2, METAL, 0xb0b4b8, { seg: 10 }); a.box(-10.3, 0, 2.5, 3, 3, 4.2, CORR2, 0x6f9fd0);
    return a.P; } };

/* 4 · WORKSHOP STORE — ochre brick under a green gable, a blue awning */
B['P05-04-B3'] = { row: { solid: true }, parts() { const a = sheet(), OC = 0xe6c274;
    a.box(0, 0, 0, 10.6, 7, 17.6, BRICK, OC, { top: false }); a.roof('gable', 0, 7, 0, 17.6, 4, 10.6, CORR, 0x5f9a72, { ry: 90, over: 0.5, keyEnd: BRICK, tintEnd: OC });
    a.box(0, 0.5, -8.86, 7, 2.5, 0.12, G_SQ, 0xd8ecf8); a.roof('shed', 0, 3.2, -9.9, 10.4, 1.1, 2.2, null, 0x3f72c0, { under: true }); a.cyl(0, 8.4, -8.9, 1.1, 0.25, ALU, 0xffffff, { seg: 14, ry: 0 });
    return a.P; } };

/* 5 · SUPERHERO TOWER — the district's weenie: a columned marble podium, a glass shaft with white fins, a round drum on the plaza corner,
       an overhanging observation ring, a gilt dome, pyramid and spire */
B['P06-04-B1'] = { row: { storeys: 2 }, parts(door) { const a = sheet(), GL = 0xcfe6ff, WH = 0xf6f8fb, MB = 0xf6f1e4;
    a.shell(28, 7, 28, MARBLE, MB, door); a.box(0, 7, 0, 31, 0.8, 31, MARBLE, 0xffffff, { under: true });
    a.cols(-14, 15.3, 14, 15.3, 9, 0.5, 7, MARBLE, 0xffffff); a.cols(-14, -15.3, 14, -15.3, 9, 0.5, 7, MARBLE, 0xffffff); a.cols(15.3, -10.5, 15.3, 10.5, 7, 0.5, 7, MARBLE, 0xffffff); a.cols(-15.3, -10.5, -15.3, 10.5, 7, 0.5, 7, MARBLE, 0xffffff);
    a.box(0, 7.8, 0, 17.5, 49, 17.5, G_TALL, GL, { glow: 0.45 }); a.cyl(-8.75, 7.8, 8.75, 6, 56, G_SQ, 0xe0f0ff, { seg: 24, glow: 0.45 });
    for (const c of [[1, 1], [1, -1], [-1, -1]]) a.box(c[0] * 9.2, 7.8, c[1] * 9.2, 1.4, 53, 1.4, ALU, WH);
    for (let y = 21; y < 56; y += 10.5) a.box(0, y, 0, 18.4, 0.5, 18.4, ALU, WH, { under: true });
    a.cyl(0, 56.8, 0, 15, 1.4, ALU, WH, { seg: 32 }); a.cyl(0, 58.2, 0, 12.5, 3.5, G_SQ, 0xe0f0ff, { seg: 32, glow: 0.5, cap: false }); a.cyl(0, 61.7, 0, 13.5, 0.8, ALU, WH, { seg: 32 });
    a.box(0, 62.5, 0, 10.5, 7, 10.5, G_TALL, GL, { glow: 0.45 }); a.dome(-8.75, 63.8, 8.75, 6, 4.8, GOLD, 0xffffff, { roof: true }); a.roof('pyramid', 0, 69.5, 0, 10.5, 5.5, 10.5, GOLD, 0xffffff);
    a.cyl(0, 75, 0, 0.35, 13, ALU, 0xffffff, { seg: 8, r2: 0.04 });
    a.box(0, 32, 8.85, 6.4, 7.2, 0.3, GOLD, 0xffffff); a.box(0, 33.6, 9.05, 3.6, 4, 0.2, null, 0xd0303a);       // the shield on the plaza face
    return a.P; } };

/* 6 · PRESS COURT — a glass pavilion under a floating roof on thin columns, press steps and flag poles in front */
B['P07-04-B1'] = { row: { storeys: 1 }, parts(door) { const a = sheet();
    a.shell(24.5, 4.6, 14, G_SQ, 0xe0f0ff, door, { glow: 0.35 }); a.box(0, 4.6, 0.8, 28.5, 0.8, 18.6, CONC1, 0xfafaf6, { under: true });
    a.cols(-12.8, 9.2, 12.8, 9.2, 6, 0.24, 4.6, ALU, 0xffffff);
    for (const x of [8.2, 9.8, 11.4]) { a.cyl(x, 0, 10.6, 0.08, 7.5, ALU, 0xffffff, { seg: 6 }); a.box(x + 0.75, 6, 10.6, 1.4, 0.9, 0.06, null, x === 9.8 ? 0xd0303a : 0x24488a); }
    return a.P; } };

/* 7 · APARTMENTS A — the repeatable block: stone foot, terracotta floors, two bay stacks, a cornice, a water tank */
function apartments(sx, sz, st, tint, baySide) { const a = sheet(), h = st * 3.5;
    a.box(0, 0, 0, sx + 0.1, 3.5, sz + 0.1, STUCCO, 0xe6dfd0, { top: false }); a.box(0, 3.5, 0, sx + 0.1, h - 3.5, sz + 0.1, G_RES, tint, { top: false, glow: 0.12 });
    a.box(0, h, 0, sx + 1.1, 0.6, sz + 1.1, ALU, 0xf2ecde, { under: true }); a.box(0, h + 0.6, 0, sx, 0.7, sz, BRICK, 0xb86a58, { keyTop: CONC, tintTop: 0x8a8a86 });
    const n = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] }[baySide];
    for (const o of [-0.28, 0.28]) { if (n[0]) a.box(n[0] * (sx / 2 + 0.6), 3.5, o * sz, 1.2, h - 5.25, 3.2, G_RES, 0xf0e6d6, { glow: 0.12 }); else a.box(o * sx, 3.5, n[1] * (sz / 2 + 0.6), 3.2, h - 5.25, 1.2, G_RES, 0xf0e6d6, { glow: 0.12 }); }
    a.cyl(sx * 0.25, h + 2.6, -sz * 0.25, 1.7, 2.6, WOOD, 0xb89068, { seg: 12 }); a.cyl(sx * 0.25, h + 5.2, -sz * 0.25, 1.9, 1.2, null, 0x6a5848, { seg: 12, r2: 0 });
    a.cyl(sx * 0.25, h + 1.3, -sz * 0.25, 1.2, 1.3, METAL, 0x55585c, { seg: 4, cap: false });
    return a.P; }
B['P07-04-B2'] = { row: { solid: true }, parts() { return apartments(17.5, 24.5, 5, 0xe6a288, 'W'); } };

/* 8 · COFFEE ARCADE — a cafe hall under a glass barrel vault, a four-bay striped arcade on columns along the walk, a giant cup on the roof.
       (The plan's pack block moved next door: 9.) */
B['P04-05-B1'] = { row: { hollow: true, storeys: 2, doorSide: 'E', key: null }, parts(door) { const a = sheet(), CR = 0xf4e0bc, BRN = 0x8a5230;
    a.shell(17.5, 7, 17.5, STUCCO, CR, door); a.box(0, 7, 0, 18.3, 0.5, 18.3, null, BRN, { under: true }); a.roof('barrel', 0, 7.5, 0, 17.5, 4.6, 12, G_FAC, 0xf4c878, { ry: 90, glow: 0.35, keyEnd: STUCCO, tintEnd: CR });
    a.box(11.3, 3.6, 0, 5, 0.4, 17.5, STUCCO, CR, { under: true });
    for (let i = 0; i < 4; i++) a.roof('barrel', 11.3, 4, -6.5625 + i * 4.375, 5, 1.6, 4.3, null, i % 2 ? 0xf6f0e2 : BRN);
    a.cols(13.5, -8.75, 13.5, 8.75, 5, 0.32, 3.6, MARBLE, 0xffffff);
    a.cyl(-3, 12.4, 5.5, 2.3, 3, MARBLE, 0xffffff, { seg: 18, r2: 2.75 }); a.cyl(-3, 15.3, 5.5, 2.5, 0.12, null, 0x5a3118, { seg: 18 }); a.box(0.3, 13.1, 5.5, 1.3, 1.8, 0.5, MARBLE, 0xffffff);   // the cup, its coffee, its handle
    return a.P; } };

/* 9 · THE SHOP BLOCK — the pack's photo shop block at its true size (the tool's packFit), on the annex lot */
B['P04-05-B2'] = { row: { pack: 'pack_bld_09', packSide: 'E' } };

/* 11 · TRAINING HALL — a brick armory: four round turrets with cone caps, tall window bays, a gabled porch, red banners; the flat roof is the
        roof route, walked round a glass monitor */
B['P06-05-B1'] = { parts() { const a = sheet(), BR = 0xc08468, SL = 0x5878a0;
    a.box(0, 0, 0, 28.1, 7, 28.1, BRICK, BR, { top: false }); a.box(0, 6.6, 0, 28.7, 0.45, 28.7, ALU, 0xf0e6d2, { top: false, under: true });
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { a.cyl(c[0] * 13.6, 0, c[1] * 13.6, 2.4, 10.5, BRICK, BR, { seg: 12 }); a.cyl(c[0] * 13.6, 10.5, c[1] * 13.6, 2.8, 3.2, CORR, SL, { seg: 12, r2: 0, roof: true }); }
    a.box(0, 7.05, 0, 8, 1.1, 18, BRICK, BR, { roof: true }); a.roof('barrel', 0, 8.15, 0, 18, 3.6, 8, G_FAC, 0xd8ecf8, { ry: 90, glow: 0.3, keyEnd: BRICK, tintEnd: BR });
    for (const i of [-2, -1, 1, 2]) for (const s of [-1, 1]) a.box(i * 4.6, 1, s * 14.12, 2.6, 4.6, 0.14, G_TALL, 0xb8d4ec);
    for (const i of [-2, -1, 0, 1, 2]) for (const s of [-1, 1]) a.box(s * 14.12, 1, i * 4.6, 0.14, 4.6, 2.6, G_TALL, 0xb8d4ec);
    a.box(0, 0, -15.6, 7, 4.2, 3.1, BRICK, BR, { top: false }); a.roof('gable', 0, 4.2, -15.6, 3.6, 2, 7.4, CORR, SL, { ry: 90, keyEnd: ALU, tintEnd: 0xf0e6d2 }); a.box(0, 0, -17.2, 3.2, 3, 0.12, WOOD, 0x8a5a36);
    for (const x of [-9.2, 9.2]) a.box(x, 2.2, -14.22, 1.8, 4.4, 0.08, null, 0xd0303a);
    return a.P; } };

/* 12 · TOWER SERVICE — the tower's plant: blind concrete, a louvre band, three cooling towers, a striped stack, a tank, pipe runs, a dock */
B['P07-05-B1'] = { row: { storeys: 2, leaf: 'leaf_security' }, parts(door) { const a = sheet(), CC = 0xc4ccd2;
    a.shell(28, 14, 24.5, CONC, CC, door); a.box(0, 9.5, 0, 28.4, 2.2, 24.9, CORR2, 0x98a4ac, { top: false }); a.box(0, 14, 0, 28.3, 0.9, 24.8, CONC1, 0xb0b6ba, { roof: true });
    for (const x of [-8, 0, 8]) { a.cyl(x, 14.9, 5, 3.2, 4.5, CONC1, 0xe0e2de, { seg: 16, r2: 2.4, roof: true }); a.cyl(x, 19.4, 5, 2.45, 0.3, null, 0x2c2c2e, { seg: 16, roof: true }); }
    a.cyl(10, 14.9, -7, 1.0, 13, null, 0xf0f0f0, { seg: 12, roof: true }); for (let i = 0; i < 3; i++) a.cyl(10, 17.5 + i * 4, -7, 1.04, 1.6, null, 0xd0303a, { seg: 12, cap: false, roof: true });
    a.cyl(-8, 15.6, -7, 3, 3, ALU, 0xe6eaee, { seg: 14, roof: true }); a.dome(-8, 18.6, -7, 3, 1.6, ALU, 0xe6eaee, { roof: true });
    for (const y of [3, 5]) a.box(-14.4, y, 0, 0.6, 0.6, 22, null, 0xe8b820);                                    // the pipe runs down the west face
    a.box(4, 0, 13.4, 16, 1.1, 2.4, CONC1, 0xc4c4be); a.box(4, 4.6, 13.7, 17, 0.35, 3.2, CORR, 0x98a4ac, { under: true }); for (const x of [-1, 4, 9]) a.box(x, 1.1, 12.36, 3.6, 2.9, 0.12, ALU, 0xd6dade);
    return a.P; } };

/* 13 · APARTMENT STAIR — the tenement whose street face is an iron stair: landings, flights, rails; a wooden water tower on the roof */
B['P04-06-B1'] = { row: { storeys: 2, leaf: 'leaf_shabby_wood' }, parts(door) { const a = sheet(), h = 21, IR = 0x3a3a40;
    a.shell(14, 3.5, 24.5, BRICK, 0x9a5048, door); a.box(0, 3.5, 0, 14.1, h - 3.5, 24.6, G_RES2, 0xc87060, { top: false, glow: 0.12 }); a.box(0, h, 0, 15.1, 0.7, 25.6, ALU, 0xe4d8be, { under: true });
    for (let i = 0; i < 5; i++) { const y = 3.5 + i * 3.5, s = i % 2 ? 1 : -1;
        a.box(8.15, y, 0, 2.2, 0.14, 13, METAL, IR, { under: true }); a.box(9.2, y, 0, 0.07, 1.1, 13, METAL, IR);
        if (i < 4) for (let k = 0; k < 8; k++) a.box(7.6, y + (k + 1) * 0.4, s * (4.2 - k * 1.05), 0.9, 0.1, 1.05, METAL, IR, { under: true }); }
    a.cols(9.2, -6.4, 9.2, 6.4, 2, 0.07, h - 2.4, METAL, IR);
    a.cyl(-2, h + 2.7, -6, 2, 3, WOOD, 0xb89068, { seg: 12, roof: true }); a.cyl(-2, h + 5.7, -6, 2.2, 1.4, null, 0x6a5848, { seg: 12, r2: 0, roof: true }); a.cyl(-2, h + 0.7, -6, 1.5, 2, METAL, 0x55585c, { seg: 4, cap: false, roof: true });
    return a.P; } };

/* 14 · TOWNHOUSE ROW — three joined houses, each its own colour and gable, stoops and painted doors on the north walk */
B['P04-06-B2'] = { row: { solid: true }, parts() { const a = sheet(), T = [0xe08a72, 0xf0dca0, 0x88a8c4], DR = [0x3a6a48, 0x8a2a2a, 0x2a427a];
    for (let i = 0; i < 3; i++) { const x = -5.85 + i * 5.85, hh = 10.5 + (i === 1 ? 1.2 : 0), key = i === 1 ? PLASTER : BRICK;
        a.box(x, 0, 0, 5.85, hh, 17.6, key, T[i], { top: false }); a.roof('gable', x, hh, 0, 17.6, 3, 5.85, CORR2, i === 1 ? 0xa85048 : 0x586878, { ry: 90, over: 0.25, keyEnd: key, tintEnd: T[i] });
        a.box(x, 0, -9.6, 2.4, 0.5, 1.6, MARBLE, 0xd8d0c0); a.box(x - 0.9, 0.5, -8.86, 1.1, 2.3, 0.12, WOOD, DR[i]); a.box(x + 1.2, 1.4, -8.86, 1.5, 1.6, 0.1, G_SQ, 0xd8ecf8);
        for (const y of [4.6, 7.8]) for (const o of [-1.3, 1.3]) a.box(x + o, y, -8.86, 1.3, 1.8, 0.1, G_SQ, 0xd8ecf8); }
    return a.P; } };

/* 16 · TRANSIT COURT — the station: cream tile, a long canopy on the north front, a clock tower on the corner, a glass front; the flat roof is
        the roof route (the Metro pack's pieces stand inside in the interiors pass) */
B['P06-06-B1'] = { parts() { const a = sheet(), TL = 0xf6eed8, GR = 0x3f8a72;
    a.box(0, 0, 0, 28.1, 7, 24.6, TILE, TL, { top: false }); a.box(0, 6.6, 0, 28.7, 0.45, 25.2, null, GR, { top: false, under: true });
    a.box(-3, 0.3, -12.36, 17, 3.6, 0.12, G_SQ, 0xd8ecff, { glow: 0.3 }); a.box(-3, 4.4, -15.2, 24, 0.5, 5.6, CONC1, 0xf6f6f2, { under: true });
    for (const x of [-13, -8, -3, 2, 7]) a.box(x, 4.9, -13.2, 0.25, 0.9, 1.6, null, GR);
    a.box(11.5, 0, -10, 5, 19, 5, TILE, TL, { top: false }); a.box(11.5, 19, -10, 5.8, 0.5, 5.8, null, GR, { under: true }); a.roof('pyramid', 11.5, 19.5, -10, 5.8, 4, 5.8, ALU, 0x6fb89e);
    a.box(11.5, 13.6, -12.56, 3.2, 3.2, 0.1, MARBLE, 0xffffff); a.box(8.94, 13.6, -10, 0.1, 3.2, 3.2, MARBLE, 0xffffff);                         // the clock faces' plates (the clock prop hangs on them)
    a.box(-3, 7.6, -11.6, 13, 2.2, 0.3, null, GR, { roof: true });                                                                                // the roof sign board (no lettering yet)
    return a.P; } };

/* 17 · OFFICE COURT — a teal glass slab on stilts over a recessed lobby, sun fins, a round glass stair tower, a penthouse */
B['P07-06-B1'] = { row: { storeys: 1 }, parts(door) { const a = sheet(), TQ = 0xa8f0e2;
    a.shell(17.5, 3.5, 21, G_SQ, 0xe0f0ff, door, { glow: 0.35 }); a.cols(-9.6, -9.2, -9.6, 9.2, 5, 0.4, 3.5, CONC1, 0xf2f2ee);
    a.box(-1, 3.5, 0, 19.6, 21, 21.1, G_SQ, TQ, { top: false, under: true, glow: 0.35 }); for (let i = -5; i <= 5; i++) a.box(-11.1, 3.5, i * 1.9, 0.7, 21, 0.18, ALU, 0xffffff);
    a.box(-1, 24.5, 0, 20.4, 0.6, 21.9, CONC1, 0xf8f8f4, { under: true, roof: true }); a.box(2, 25.1, -3, 8, 3.2, 10, G_SQ, 0xe0f0ff, { glow: 0.3, roof: true }); a.box(2, 28.3, -3, 9.5, 0.4, 11.5, CONC1, 0xf8f8f4, { under: true, roof: true });
    a.cyl(8.75, 0, 10.5, 3.4, 27, G_TALL, 0xd6f4ee, { seg: 18, glow: 0.35 }); a.cyl(8.75, 27, 10.5, 3.7, 0.5, CONC1, 0xf8f8f4, { seg: 18 });
    return a.P; } };

/* 18 · THE ANNEX — a small stone pavilion with a four-column porch and pediment; its flat roof is the roof route */
B['P07-06-B2'] = { parts() { const a = sheet();
    a.box(0, 0, 0, 10.6, 7, 17.6, MARBLE, 0xf2ecdc, { top: false }); a.box(0, 6.6, 0, 11.3, 0.45, 18.3, MARBLE, 0xffffff, { top: false, under: true });
    a.cols(-6.5, -4.5, -6.5, 4.5, 4, 0.4, 5.2, MARBLE, 0xffffff); a.box(-6.2, 5.2, 0, 2.6, 0.5, 11, MARBLE, 0xffffff, { under: true }); a.roof('gable', -6.2, 5.7, 0, 2.6, 1.6, 11, MARBLE, 0xf6f1e4);
    return a.P; } };

/* 19 · MARKET STEPS — an open cobble terrace toward the avenue with three tent-roofed stalls on timber posts (walked through) */
B['P05-07-B1'] = { row: { remove: true }, parts() { const a = sheet(), TN = [0xe0554c, 0xf6eed6, 0x3f9a70];
    a.box(0, 0, 0, 17.5, 0.12, 10.5, COBBLE, 0xe6d4b6);
    for (let i = 0; i < 3; i++) { const x = -5.6 + i * 5.6;
        for (const c of [[-2.2, -2.4], [2.2, -2.4], [-2.2, 2.4], [2.2, 2.4]]) a.cyl(x + c[0], 0.12, c[1], 0.12, 3.3, WOOD, 0x9a7650, { seg: 6 });
        a.roof('pyramid', x, 3.4, 0, 5.4, 2, 5.8, null, TN[i], { under: true }); }
    return a.P; },
    props(c) { return [-5.6, 0, 5.6].map((x, i) => ({ key: ['popcorn_cart', 'hot_dog_stand', 'psx_wooden_crate_1'][i], x: c.x + x, z: c.z - 1.4, face: 0 })); } };

/* 20 · KIOSKS — a round green kiosk with a cone roof and gilt ball, and a yellow snack stand under a flat roof and awning */
B['P05-07-B2'] = { row: { replace: [{ dx: -4.5, dz: 0, w: 5.2, d: 5.2 }, { dx: 4, dz: -0.5, w: 6, d: 4 }] }, parts() { const a = sheet(), GN = 0x3f8a62;
    a.cyl(-4.5, 0, 0, 2.6, 3.2, null, GN, { seg: 8 }); a.cyl(-4.5, 3.2, 0, 3.3, 0.25, null, 0x2c6446, { seg: 8 }); a.cyl(-4.5, 3.45, 0, 2.8, 1.8, null, GN, { seg: 8, r2: 0 }); a.dome(-4.5, 5.2, 0, 0.35, 0.4, GOLD, 0xffffff);
    a.box(4, 0, -0.5, 6, 3, 4, CORR, 0xf0c040, { top: false }); a.box(4, 3, 0.3, 7, 0.25, 6, null, 0xf8f8f4, { under: true }); a.roof('shed', 4, 2.3, 2.3, 6, 0.8, 1.6, null, 0xd0303a, { under: true }); a.box(4, 1.1, 1.52, 4.4, 1.2, 0.06, G_SQ, 0xd8ecf8);
    return a.P; } };

/* 21 · DELIVERY YARD — the depot: blue-grey corrugated under a single-pitch roof, four roller shutters, a raised dock and its canopy (north) */
B['P07-07-B1'] = { row: { storeys: 1, leaf: 'leaf_security' }, parts(door) { const a = sheet(), BL = 0x9ab4cc, RD = 0xc85a48;
    a.shell(31.5, 6, 10.5, CORR2, BL, door); a.roof('shed', 0, 6, 0, 31.6, 2.4, 10.6, CORR, RD, { ry: 180, keyEnd: CORR2, tintEnd: BL });
    for (const x of [-13, -8.2, 8.2, 13]) a.box(x, 0.2, -5.36, 4, 3.6, 0.12, ALU, 0xd6dade); a.box(0, 4.6, -6.8, 31.5, 0.3, 3, CORR, RD, { under: true });
    return a.P; } };

/* 22 · DISPATCH OFFICE — a small brick office under an oversized flat roof, a crate sign on top */
B['P07-07-B2'] = { row: { replace: [{ dx: 0, dz: 0, w: 10, d: 7 }] }, parts() { const a = sheet();
    a.box(0, 0, 0, 10.05, 3.6, 7.05, BRICK, 0xe09a70, { top: false }); a.box(0.8, 3.6, 0.8, 13, 0.4, 10, CONC1, 0xf8f8f4, { under: true }); a.box(0, 0.9, 3.56, 6, 1.9, 0.1, G_SQ, 0xd8ecf8);
    a.box(0, 4, 0, 2.6, 2.6, 2.6, WOOD, 0xe0b878); a.box(0, 4.9, 0, 2.7, 0.3, 2.7, null, 0x8a5a36); a.box(0, 4, 0, 0.3, 2.65, 2.7, null, 0x8a5a36);
    return a.P; } };

/* ── THE OPEN GROUND: drawn pieces that belong to no plan building (room metres) ── */
const OPEN = [
    /* 10 · HERO PLAZA — a curved colonnade behind the fountain (the tool's own fountain prop), a domed bandstand, flag poles */
    { id: 'plaza', x: -22.75, z: -33.25, parts() { const a = sheet(), R = 12;
        a.P.push({ s: 'cyl', p: [0, 0, 0], r: 0.45, h: 5.6, seg: 10, key: MARBLE, tint: 0xffffff, ring: { n: 9, r: R, a0: 200, arc: 140 } });
        a.cyl(0, 5.6, 0, R + 0.7, 0.8, MARBLE, 0xffffff, { seg: 40, arc: 150, a0: 195, ri: R - 0.7 });
        const bx = 15.75, bz = 22.75;                                                                                // the bandstand, south-east of the fountain
        a.cyl(bx, 0, bz, 4.2, 0.45, MARBLE, 0xe6e0d2, { seg: 16 }); a.P.push({ s: 'cyl', p: [bx, 0.45, bz], r: 0.22, h: 3.2, seg: 8, key: MARBLE, tint: 0xffffff, ring: { n: 8, r: 3.6 } });
        a.cyl(bx, 3.65, bz, 4.3, 0.4, ALU, 0x5fae9c, { seg: 16 }); a.dome(bx, 4.05, bz, 4.1, 2.8, ALU, 0x6fc0aa, { roof: true });
        for (const q of [[-8, 5.5], [8, 5.5], [0, 7.5]]) { a.cyl(q[0], 0, q[1], 0.09, 9, ALU, 0xffffff, { seg: 6 }); a.box(q[0] + 0.95, 7.6, q[1], 1.8, 1.1, 0.06, null, q[0] ? 0x24488a : 0xd0303a); }
        return a.P; } },
    /* 15 · MEMORIAL WALK — a curved dark wall behind the tool's statue, an obelisk with a gilt tip, a flame bowl */
    { id: 'memorial', x: -10.5, z: 21, parts() { const a = sheet();
        a.cyl(0, 0, 0, 9, 3.2, 'marble', 0x8a9098, { seg: 32, arc: 110, a0: -55, ri: 8.4 });
        a.cyl(-14, 0, 0, 2, 0.6, MARBLE, 0xe8e2d2, { seg: 4, ry: 45 }); a.cyl(-14, 0.6, 0, 1.1, 11, MARBLE, 0xf6f2e6, { seg: 4, r2: 0.6, ry: 45 }); a.cyl(-14, 11.6, 0, 0.6, 1.2, GOLD, 0xffffff, { seg: 4, r2: 0, ry: 45 });
        a.cyl(-14, 0, 6, 1, 0.9, 'marble', 0x8a9098, { seg: 12 }); a.cyl(-14, 0.9, 6, 0.5, 1.2, null, 0xff8a1e, { seg: 8, r2: 0, glow: 1 });
        return a.P; } },
    /* 23 · THE GATEWAYS — a marble pylon pair with gilt caps and a banner beam over the avenue, at each end of the district */
    ...[-80.5, 80.5].map((x, i) => ({ id: 'gate' + i, x, z: 63, walls: [[0, -10.5, 3, 3], [0, 10.5, 3, 3]], parts() { const a = sheet();
        for (const z of [-10.5, 10.5]) { a.box(0, 0, z, 3, 11, 3, MARBLE, 0xf6f1e4); a.box(0, 11, z, 3.6, 0.6, 3.6, GOLD, 0xffffff, { under: true }); a.dome(0, 11.6, z, 1.1, 1.3, GOLD, 0xffffff); }
        a.box(0, 8.6, 0, 1.2, 1.9, 18, null, 0x24488a, { under: true }); a.box(0, 10.5, 0, 1.8, 0.5, 18.6, MARBLE, 0xffffff, { under: true }); a.roof('barrel', 0, 11, 0, 1.6, 1.8, 16, MARBLE, 0xffffff);
        return a.P; } })),
];

/* 3 · THE PIZZERIA — the chain's pack building (mondo 11-13 17:07: a chain, one a district) at real size on the Local shop's lot, door north */
const SWAP = { 'P05-04-B2': { key: 'city_pizzeria', side: 'N', hw: 5.05, hd: 10.25, push: 0.75 } };



/* ── build(ctx): the tool's hook, after every row exists. The plan's own row keeps the collision, the inside, the door and the walked roof with
   its outside switched off (`skin: false`); `row` says what else changes: storeys, leaf, solid (no inside), hollow + doorSide (an inside on that
   side), pack + packSide (a pack shop block; its row `w` IS its scale, kept within 0.9 to 1.15 of the block's own width), replace (smaller
   footprints), remove (walked through). Draws no random number. ── */
const PACK_W = { pack_bld_08: 15.52, pack_bld_09: 16.89 };
function build(ctx) {
    const { PLAN, features, props, bInfo, r3, C } = ctx, M = { district: 'H', B, OPEN, SWAP }; let nArch = 0;
    const R3 = v => typeof v === 'number' ? Math.round(v * 1000) / 1000 : Array.isArray(v) ? v.map(R3) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(e => [e[0], R3(e[1])])) : v;
    const ROT = { S: 0, W: 90, N: 180, E: 270 }, SIDE_OF = { 0: 'S', 90: 'W', 180: 'N', 270: 'E' };
    const planB = id => { for (const p of PLAN.plots) { const b = p.buildings.find(q => q.id === id); if (b) return b; } return null; };
    const doorOf = row => { if (!row || row.k !== 'texbuilding' || !row.hollow) return null;   // data.js hqTexbDoor, in the row's own frame
        const L = Math.max(2, row.w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2);
        if (row.door >= 1) col = Math.min(cols - 1, Math.round(row.door) - 1);
        return { side: SIDE_OF[row.rot || 0], lx: -L / 2 + (col + 0.5) * cw, cw, h: 2.2 }; };
        Object.keys(M.B || {}).forEach(bid => {
            const def = M.B[bid], S = def.row || {}, i = features.findIndex(r => r.id === 'dc:' + bid), info = bInfo.find(b => b.id === bid), b = planB(bid);
            if (i < 0 || !info || !b) { console.warn('arch: no row for', bid); return; }
            let row = features[i]; const c = { x: info.x, z: info.z, w: info.w, d: info.d2 };
            const turn = side => { const ew = side === 'E' || side === 'W'; row.rot = ROT[side]; row.w = r3((ew ? b.h : b.w) * C); row.d = r3((ew ? b.w : b.h) * C);
                const dr = b.doors.find(q => q.side === side); delete row.door;
                if (dr) { const k = side === 'S' ? (dr.x - b.x) : side === 'N' ? (b.x + b.w - 1 - dr.x) : side === 'E' ? (b.y + b.h - 1 - dr.y) : (dr.y - b.y); row.door = Math.round(k * C / 1.75) + 1; } };
            if (S.pack) {   // a pack shop block at its own size (packFit): the whole model is the building
                                turn(S.packSide || 'S'); delete row.door; delete row.hollow; delete row.style; row.key = S.pack; const sc = row.w / PACK_W[S.pack]; if (!(sc >= 0.9 && sc <= 1.15)) console.warn('H: pack block off scale', bid, sc); return;
            }
            if (S.remove) features.splice(i, 1);
            else if (S.replace) features.splice(i, 1, ...S.replace.map((q, n) => ({ k: 'texbuilding', id: 'dc:' + bid + '-a' + n, x: r3(c.x + q.dx), z: r3(c.z + q.dz), w: q.w, d: q.d, rot: 0, storeys: 1, seed: row.seed, skin: false })));
            else if (row.k === 'plateau') row.bld = Object.assign({}, row.bld, { skin: false });
            else {
                delete row.key; row.skin = false; if (!row.style) row.style = 'office';
                if (S.hollow) { row.hollow = true; turn(S.doorSide || info.side); }
                if (S.solid) { delete row.hollow; delete row.door; }
                if (S.storeys) row.storeys = S.storeys; else if (S.solid) row.storeys = 2;
                if (S.leaf) row.leaf = S.leaf;
            }
            if (def.parts) { features.push({ k: 'arch', id: 'arch:' + bid, x: c.x, z: c.z, rot: 0, parts: R3(def.parts((S.remove || S.replace) ? null : doorOf(row), c)) }); nArch++; }
            if (def.props) def.props(c).forEach(q => props.push(R3(q)));
        });
        (M.OPEN || []).forEach(o => {
            features.push({ k: 'arch', id: 'arch:' + M.district + ':' + o.id, x: o.x, z: o.z, rot: 0, parts: R3(o.parts()) }); nArch++;
            (o.walls || []).forEach((q, n) => features.push({ k: 'texbuilding', id: 'dc:' + M.district + ':' + o.id + '-w' + n, x: r3(o.x + q[0]), z: r3(o.z + q[1]), w: q[2], d: q[3], rot: 0, storeys: 3, seed: 1, skin: false }));
        });
        Object.keys(M.SWAP || {}).forEach(bid => {   // a plan building replaced by a whole catalogue building (a prop: real size, entrance at +Z, solid)
            const q = M.SWAP[bid], i = features.findIndex(r => r.id === 'dc:' + bid), info = bInfo.find(b => b.id === bid); if (i < 0 || !info) { console.warn('arch: no row to swap', bid); return; }
            features.splice(i, 1);
            const n = { S: [0, 1], N: [0, -1], W: [-1, 0], E: [1, 0] }[q.side], ew = n[0] !== 0, half = (ew ? info.w : info.d2) / 2 + (q.push || 0) - q.hd;
            const x = r3(info.x + n[0] * half), z = r3(info.z + n[1] * half), hx = ew ? q.hd : q.hw, hz = ew ? q.hw : q.hd;
            for (let k = props.length - 1; k >= 0; k--) if (Math.abs(props[k].x - x) < hx + 0.6 && Math.abs(props[k].z - z) < hz + 0.6) props.splice(k, 1);   // nothing stands inside it
            props.push({ key: q.key, x, z, face: ROT[q.side] });
        });
}
module.exports = { build };
