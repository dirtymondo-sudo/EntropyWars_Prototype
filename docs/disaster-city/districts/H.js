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
const CORR = U('MetalCorrugatedPainted1a'), CORR2 = U('MetalCorrugatedPainted2a'), CORR5 = U('MetalCorrugatedPainted5a'), BRICK = 'bricks_3', MARBLE = 'marble_light', ALU = 'aluminium', GOLD = 'gold', WOOD = 'wood_planks', COBBLE = 'cobblestone', METAL = 'metal';
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
    a.box(0, 0.5, -8.86, 7, 2.5, 0.12, G_SQ, 0xd8ecf8); a.roof('shed', 0, 3.2, -9.9, 10.4, 1.1, 2.2, null, 0x3f72c0, { under: true, ry: 180 }); a.cyl(0, 8.4, -8.9, 1.1, 0.25, ALU, 0xffffff, { seg: 14, ry: 0 });
    return a.P; } };

/* 5 · SUPERHERO TOWER — the district's weenie: a columned marble podium, a glass shaft with white fins, a round drum on the plaza corner,
       an overhanging observation ring, a gilt dome, pyramid and spire */
B['P06-04-B1'] = { row: { storeys: 2 }, parts(door) {   // the walk-in lobby opens on the plaza (mondo 22:30 "keep the new lobby"); the story door THE TOWER stands at its lift bank (`joins` below)
    const a = sheet(), GL = 0xcfe6ff, WH = 0xf6f8fb, MB = 0xf6f1e4;
    a.shell(28, 7, 28, MARBLE, MB, door); a.box(0, 7, 0, 31, 0.8, 31, MARBLE, 0xffffff, { under: true });
    a.cols(-14, 15.3, 14, 15.3, 9, 0.5, 7, MARBLE, 0xffffff); a.cols(-14, -15.3, 14, -15.3, 9, 0.5, 7, MARBLE, 0xffffff); a.cols(15.3, -10.5, 15.3, 10.5, 7, 0.5, 7, MARBLE, 0xffffff); a.cols(-15.3, -10.5, -15.3, 10.5, 7, 0.5, 7, MARBLE, 0xffffff);
    a.box(0, 7.8, 0, 17.5, 49, 17.5, G_TALL, GL, { glow: 0.45 }); a.cyl(-8.75, 7.8, 8.75, 6, 56, G_SQ, 0xe0f0ff, { seg: 24 });
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
function apartments(sx, sz, st, tint, baySide, door) { const a = sheet(), h = st * 3.5;
    if (door) a.shell(sx, 3.5, sz, STUCCO, 0xe6dfd0, door); else a.box(0, 0, 0, sx + 0.1, 3.5, sz + 0.1, STUCCO, 0xe6dfd0, { top: false });   // a walk-in's ground floor has the real doorway (11-14, the residents' bedrooms) a.box(0, 3.5, 0, sx + 0.1, h - 3.5, sz + 0.1, G_RES, tint, { top: false, glow: 0.12 });
    a.box(0, h, 0, sx + 1.1, 0.6, sz + 1.1, ALU, 0xf2ecde, { under: true }); a.box(0, h + 0.6, 0, sx, 0.7, sz, BRICK, 0xb86a58, { keyTop: CONC, tintTop: 0x8a8a86 });
    const n = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] }[baySide];
    for (const o of [-0.28, 0.28]) { if (n[0]) a.box(n[0] * (sx / 2 + 0.6), 3.5, o * sz, 1.2, h - 5.25, 3.2, G_RES, 0xf0e6d6, { glow: 0.12 }); else a.box(o * sx, 3.5, n[1] * (sz / 2 + 0.6), 3.2, h - 5.25, 1.2, G_RES, 0xf0e6d6, { glow: 0.12 }); }
    a.cyl(sx * 0.25, h + 2.6, -sz * 0.25, 1.7, 2.6, WOOD, 0xb89068, { seg: 12 }); a.cyl(sx * 0.25, h + 5.2, -sz * 0.25, 1.9, 1.2, null, 0x6a5848, { seg: 12, r2: 0 });
    a.cyl(sx * 0.25, h + 1.3, -sz * 0.25, 1.2, 1.3, METAL, 0x55585c, { seg: 4, cap: false });
    return a.P; }
/* (11-14, mondo picked "District threads add them": the city's residents sleep in real beds) Apartments A is a walk-in now: a ground-floor
   flat of three bedrooms (Sidekick, Police officer, Nephilim) off a front hall, IN['P07-04-B2'] below. The plan id stays: the residents find
   their home by it. */
B['P07-04-B2'] = { row: { storeys: 1, hollow: true, doorSide: 'W' }, parts(door) { return apartments(17.5, 24.5, 5, 0xe6a288, 'W', door); } };

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
B['P06-05-B1'] = { row: { inside: 'N', storeys: 2 }, parts(door) { const a = sheet(), BR = 0xc08468, SL = 0x5878a0;   // a walk-in since the interiors pass (mondo 11-13 21:22)
    a.shell(28, 7, 28, BRICK, BR, door); a.box(0, 6.6, 0, 28.7, 0.45, 28.7, ALU, 0xf0e6d2, { top: false, under: true });
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { a.cyl(c[0] * 13.6, 0, c[1] * 13.6, 2.4, 10.5, BRICK, BR, { seg: 12 }); a.cyl(c[0] * 13.6, 10.5, c[1] * 13.6, 2.8, 3.2, CORR, SL, { seg: 12, r2: 0, roof: true }); }
    a.box(0, 7.05, 0, 8, 1.1, 18, BRICK, BR, { roof: true }); a.roof('barrel', 0, 8.15, 0, 18, 3.6, 8, G_FAC, 0xd8ecf8, { ry: 90, glow: 0.3, keyEnd: BRICK, tintEnd: BR });
    for (const i of [-2, -1, 1, 2]) for (const s of [-1, 1]) a.box(i * 4.6, 1, s * 14.12, 2.6, 4.6, 0.14, G_TALL, 0xb8d4ec);
    for (const i of [-2, -1, 0, 1, 2]) for (const s of [-1, 1]) a.box(s * 14.12, 1, i * 4.6, 0.14, 4.6, 2.6, G_TALL, 0xb8d4ec);
    a.box(0, 0, -15.6, 7, 4.2, 3.1, BRICK, BR, { top: false, faces: 'lr', ds: true }); a.roof('gable', 0, 4.2, -15.6, 3.6, 2, 7.4, CORR, SL, { ry: 90, keyEnd: ALU, tintEnd: 0xf0e6d2 });   // the porch: open, the way in
    for (const s of [-1, 1]) a.box(s * 2.6, 0, -17.0, 1.8, 4.2, 0.3, BRICK, BR, { top: false }); a.box(0, 3.0, -17.0, 3.4, 1.2, 0.3, BRICK, BR, { under: true });
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
    a.shell(14, 3.5, 24.5, BRICK, 0xd88470, door); a.box(0, 3.5, 0, 14.1, h - 3.5, 24.6, G_RES2, 0xffb098, { top: false, glow: 0.12 }); a.box(0, h, 0, 15.1, 0.7, 25.6, ALU, 0xe4d8be, { under: true });
    for (let i = 0; i < 5; i++) { const y = 3.5 + i * 3.5, s = i % 2 ? 1 : -1;
        a.box(8.15, y, 0, 2.2, 0.14, 13, METAL, IR, { under: true }); a.box(9.2, y, 0, 0.07, 1.1, 13, METAL, IR);
        if (i < 4) for (let k = 0; k < 8; k++) a.box(7.6, y + (k + 1) * 0.4, s * (4.2 - k * 1.05), 0.9, 0.1, 1.05, METAL, IR, { under: true }); }
    a.cols(9.2, -6.4, 9.2, 6.4, 2, 0.07, h - 2.4, METAL, IR);
    a.cyl(-2, h + 2.7, -6, 2, 3, WOOD, 0xb89068, { seg: 12, roof: true }); a.cyl(-2, h + 5.7, -6, 2.2, 1.4, null, 0x6a5848, { seg: 12, r2: 0, roof: true }); a.cyl(-2, h + 0.7, -6, 1.5, 2, METAL, 0x55585c, { seg: 4, cap: false, roof: true });
    return a.P; } };

/* 14 · TOWNHOUSE ROW — three joined houses, each its own colour and gable, stoops and painted doors on the north walk */
B['P04-06-B2'] = { row: { solid: true }, parts() { const a = sheet(), T = [0xe08a72, 0xf0dca0, 0x88a8c4], DR = [0x3a6a48, 0x8a2a2a, 0x2a427a];
    for (let i = 0; i < 3; i++) { const x = -5.85 + i * 5.85, hh = 10.5 + (i === 1 ? 1.2 : 0), key = i === 1 ? PLASTER : BRICK;
        a.box(x, 0, 0, 5.85, hh, 17.6, key, T[i], { top: false }); a.roof('gable', x, hh, 0, 17.6, 3, 5.85, i === 1 ? CORR2 : CORR, i === 1 ? 0xe07060 : 0x8098b0, { ry: 90, over: 0.25, keyEnd: key, tintEnd: T[i] });
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
B['P07-07-B1'] = { row: { storeys: 1, leaf: 'leaf_security' }, parts(door) { const a = sheet(), BL = 0xe0ecf8, RD = 0xc85a48;
    a.shell(31.5, 6, 10.5, CORR5, BL, door); a.roof('shed', 0, 6, 0, 31.6, 2.4, 10.6, CORR, RD, { ry: 180, keyEnd: CORR5, tintEnd: BL });
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

/* ── THE POLISH PASS (2026-11-13, mondo 20:15: "one more polish pass on the exteriors ... go one or two more layers deep with the detail,
   the foundation is already there and is good"): a second parts list per building, added after its own: plinths, string courses, window
   sills and heads, pilasters, downpipes, wall lamps, vents, awnings, balconies, merlons, roof kit. No lettering (the arch row has none),
   no gold but the `gold` key, the glass left dark. `kit(a)` are the helpers: every piece is laid against a wall by its side. ── */
const DARK = 0x3a3d42, STONE = 0xa8a294, WARM = 0xffd9a0, FACE = { S: 'f', N: 'b', E: 'r', W: 'l' };
const GRILL = U('MetalSubwayGrill1a'), HAZ = U('SignHazard1a'), GRANITE = U('ConcreteUnderTiles1'), PAVER = U('TileGeneric1a'), PAVER_D = U('TileGeneric3a'), TAR = U('RubberNonSlip1a'), CHECK = U('TileMarble1a');
const D_WOOD = U('DoorWoodenHalf1a'), D_GREY = U('DoorPaintedHalf1a'), D_RED = U('DoorPaintedHalf2a'), D_SHOP = U('DoorStorefrontHalf1a'), DEC_R1 = U('DecalWindowsResidential1a'), DEC_R2 = U('DecalWindowsResidential2a'), DEC_F = U('DecalWindowsFactory1a'), SHUT = U('GlassWindowResidentialShutter1');
function kit(a) {
    const K = {
        /* a box laid on a wall: side S/N/E/W, half = that wall's distance from the middle, u = along the wall (world x on S/N, world z on E/W), t = how far it stands out */
        on(side, half, u, y, w, h, t, key, tint, o) {
            const s = (side === 'S' || side === 'E') ? 1 : -1, c = s * (half + t / 2);
            return (side === 'S' || side === 'N') ? a.box(u, y, c, w, h, t, key, tint, o) : a.box(c, y, u, t, h, w, key, tint, o); },
        doorU: door => door ? door.lx * (door.side === 'S' || door.side === 'W' ? 1 : -1) : null,
        sides: (sx, sz) => [['S', sz / 2, sx], ['N', sz / 2, sx], ['E', sx / 2, sz], ['W', sx / 2, sz]],
        /* a base course right round, open at the doorway */
        plinth(sx, sz, h, door, key, tint, out) { out = out || 0.1; const du = K.doorU(door);
            K.sides(sx, sz).forEach(([sd, half, L]) => { const e = L / 2 + out;
                if (door && door.side === sd) { const g0 = du - door.cw / 2 - 0.12, g1 = du + door.cw / 2 + 0.12;
                    if (g0 > -e) K.on(sd, half, (-e + g0) / 2, 0, g0 + e, h, out, key, tint); if (g1 < e) K.on(sd, half, (g1 + e) / 2, 0, e - g1, h, out, key, tint); }
                else K.on(sd, half, 0, 0, 2 * e, h, out, key, tint); }); },
        /* a belt course: a slab the building's size. Over a walk-in room (2nd inside pass) it is a RING round the walls instead: the slab's
           underside spanned the whole room under its ceiling and hid the lit ceiling from inside (the cafe, the tower lobby) */
        course: (sx, sz, y, h, out, key, tint, o) => { if (!RING_COURSE) return a.box(0, y, 0, sx + 2 * out, h, sz + 2 * out, key, tint, Object.assign({ under: true }, o));
            const d = out + 0.4, X = sx + 2 * out, Z = sz + 2 * out, O = Object.assign({ under: true }, o);
            for (const s of [-1, 1]) { a.box(0, y, s * (Z / 2 - d / 2), X, h, d, key, tint, O); a.box(s * (X / 2 - d / 2), y, 0, d, h, Z - 2 * d, key, tint, O); } },
        /* sills and heads for a row of windows `w` wide, `hh` tall, feet at y */
        frames(side, half, us, y, w, hh, key, tint, o) { us.forEach(u => { K.on(side, half, u, y - 0.14, w + 0.36, 0.14, 0.3, key, tint, o); K.on(side, half, u, y + hh, w + 0.36, 0.2, 0.24, key, tint, o); }); },
        pil(side, half, us, y, h, w, t, key, tint, o) { us.forEach(u => K.on(side, half, u, y, w, h, t, key, tint, o)); },
        /* one sheet, once, on the outward face only: a window, a door leaf, a decal of windows, a grille, a hazard plate */
        panel: (side, half, u, y, w, h, key, tint, o) => K.on(side, half, u, y, w, h, 0.07, key, tint == null ? 0xffffff : tint, Object.assign({ uv: 'fit', faces: FACE[side], top: false }, o)),
        win(side, half, us, y, w, hh, key, tint, o) { us.forEach(u => K.panel(side, half, u, y, w, hh, key, tint, o)); },
        decal(side, half, us, y, w, h, key) { us.forEach(u => K.panel(side, half, u, y, w, h, key)); },
        door: (side, half, u, y, w, h, key, tint) => K.panel(side, half, u, y, w, h, key || D_WOOD, tint),
        hazard: (side, half, u, y, w, h) => K.panel(side, half, u, y, w, h, HAZ),
        /* real lettering on a board (THE SIGN LETTERING, PR #1327: key 'txt:WORDS|fg|bg|aspect', a panel facing out of the wall) */
        sign(side, half, u, y, w, h, words, fg, bg) { const s = (side === 'S' || side === 'E') ? 1 : -1, c = s * (half + 0.1), ns = side === 'S' || side === 'N';
            return a.quad(ns ? u : c, y, ns ? c : u, w, h, SIDE_RY[side], 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + Math.max(1, Math.round(w / h)), null, Object.assign({ uv: 'fit' }, bg ? {} : { kind: 'over' })); },
        /* a roof surface in its own sheet, and a low parapet round it */
        rTop: (x, y, z, w, d, key, tint) => a.box(x, y, z, w, 0.05, d, key, tint == null ? 0xffffff : tint, { roof: true }),
        parapet(x, y, z, w, d, h, key, tint) { for (const s of [-1, 1]) { a.box(x, y, z + s * (d / 2 - 0.12), w, h, 0.24, key, tint, { roof: true }); a.box(x + s * (w / 2 - 0.12), y, z, 0.24, h, d - 0.48, key, tint, { roof: true }); } },
        /* a downpipe with its hopper, down a wall */
        pipe(side, half, u, h, tint) { K.on(side, half, u, 0, 0.14, h, 0.14, METAL, tint || DARK); K.on(side, half, u, h - 0.35, 0.4, 0.35, 0.3, METAL, tint || DARK); },
        lamp(side, half, u, y) { K.on(side, half, u, y, 0.14, 0.1, 0.32, null, DARK); K.on(side, half + 0.2, u, y - 0.3, 0.18, 0.3, 0.18, null, 0xd8963c, { glow: 0.7 }); },   // (seen in game: a pale glow box read as a sheet of paper, so the lantern is small and amber)
        lamps(door, half, y) { if (!door) return; const du = K.doorU(door); K.lamp(door.side, half, du - door.cw / 2 - 0.55, y || 2.5); K.lamp(door.side, half, du + door.cw / 2 + 0.55, y || 2.5); },
        vent(side, half, u, y, w, h) { K.on(side, half, u, y - 0.06, (w || 1.2) + 0.12, (h || 0.8) + 0.12, 0.05, null, DARK); K.panel(side, half + 0.05, u, y, w || 1.2, h || 0.8, GRILL); },
        ac(side, half, u, y) { K.on(side, half, u, y, 0.95, 0.62, 0.5, ALU, 0xd8dce0); K.on(side, half, u, y - 0.1, 0.8, 0.1, 0.55, null, DARK); K.panel(side, half + 0.5, u, y + 0.07, 0.8, 0.48, GRILL); },
        /* a flat canopy with a hanging valance */
        awning(side, half, u, y, w, dep, tint, tint2) { K.on(side, half, u, y, w, 0.12, dep, null, tint, { under: true }); K.on(side, half + dep - 0.06, u, y - 0.34, w, 0.34, 0.06, null, tint2 || tint); },
        balcony(side, half, u, y, w) { K.on(side, half, u, y, w, 0.12, 1.0, CONC1, 0xe8e4da, { under: true }); K.on(side, half + 0.95, u, y + 0.12, w, 0.9, 0.05, METAL, DARK); },
        /* roof kit: an air handler, a stub vent, a stair bulkhead, a skylight */
        rAC(x, y, z) { a.box(x, y, z, 2.0, 0.16, 1.5, CONC1, 0xb8b8b2, { roof: true }); a.box(x, y + 0.16, z, 1.7, 1.0, 1.2, ALU, 0xd8dce0, { roof: true }); a.cyl(x, y + 1.16, z, 0.42, 0.12, null, DARK, { seg: 10, roof: true });
            a.box(x, y + 0.3, z + 0.62, 1.4, 0.7, 0.04, GRILL, 0xffffff, { uv: 'fit', faces: 'f', top: false, roof: true }); a.box(x, y + 0.3, z - 0.62, 1.4, 0.7, 0.04, GRILL, 0xffffff, { uv: 'fit', faces: 'b', top: false, roof: true }); },
        /* a long duct run on a roof */
        rDuct(x, y, z, len, alongX) { a.box(x, y + 0.3, z, alongX ? len : 0.7, 0.55, alongX ? 0.7 : len, ALU, 0xc8ccd0, { roof: true }); },
        rVent(x, y, z) { a.cyl(x, y, z, 0.2, 0.8, METAL, 0xb0b4b8, { seg: 8, roof: true }); a.cyl(x, y + 0.8, z, 0.34, 0.2, METAL, 0xb0b4b8, { seg: 8, r2: 0.1, roof: true }); },
        rHut(x, y, z, key, tint) { a.box(x, y, z, 3, 2.5, 3, key, tint, { roof: true }); a.box(x, y + 2.5, z, 3.4, 0.2, 3.4, CONC1, 0xe8e4da, { under: true, roof: true }); a.box(x, y, z + 1.52, 1, 2.05, 0.06, D_GREY, 0xffffff, { uv: 'fit', faces: 'f', top: false, roof: true }); },
        rSky(x, y, z, w, d) { a.box(x, y, z, w, 0.5, d, G_SQ, 0xd8ecf8, { roof: true }); },
        rail(sx, sz, y, tint) { for (const s of [-1, 1]) { a.box(0, y, s * sz / 2, sx, 1.0, 0.06, METAL, tint || DARK, { roof: true }); a.box(s * sx / 2, y, 0, 0.06, 1.0, sz, METAL, tint || DARK, { roof: true }); } },
        /* skip the pieces that would cross the doorway */
        clear(door, side, us, m) { if (!door || door.side !== side) return us; const du = K.doorU(door); return us.filter(u => Math.abs(u - du) > (m || 1.8)); },
    };
    return K;
}
const steps = (lo, hi, st) => { const r = []; for (let v = lo; v <= hi + 1e-6; v += st) r.push(Math.round(v * 1000) / 1000); return r; };
const DET = {};

/* 1 · NEWS OFFICE: a dark stone foot, fluted piers between the window strips on every tier, copper sills and heads, corner finials, lanterns */
DET['P04-04-B1'] = (a, door) => { const K = kit(a), IV2 = 0xfff4dc, CU = 0x5fae9c;
    K.plinth(28, 28, 0.9, door, GRANITE, 0xffffff, 0.12);
    K.sides(28, 28).forEach(([sd, half]) => {
        K.frames(sd, half, K.clear(door, sd, [-10.5, -3.5, 3.5, 10.5], 1.2), 1.4, 2.2, 8.4, ALU, CU);
        K.pil(sd, half, K.clear(door, sd, [-13.4, -7, 0, 7, 13.4], 2.4), 0.9, 9.6, 0.9, 0.22, STUCCO, IV2);
        K.frames(sd, 10.5, [-7, 0, 7], 12, 2.2, 8.6, ALU, CU); K.pil(sd, 10.5, [-9.9, -3.5, 3.5, 9.9], 11.7, 9.9, 0.8, 0.2, STUCCO, IV2);
        K.frames(sd, 7, [0], 23, 2.2, 5.4, ALU, CU); K.pil(sd, 7, [-6.4, -2.4, 2.4, 6.4], 22.8, 6.4, 0.7, 0.18, STUCCO, IV2); });
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { a.box(c[0] * 13.2, 11.1, c[1] * 13.2, 1.5, 1.8, 1.5, STUCCO, IV2, { roof: true }); a.roof('pyramid', c[0] * 13.2, 12.9, c[1] * 13.2, 1.5, 0.9, 1.5, ALU, CU);
        a.box(c[0] * 9.8, 22.2, c[1] * 9.8, 1.2, 1.5, 1.2, STUCCO, IV2, { roof: true }); a.roof('pyramid', c[0] * 9.8, 23.7, c[1] * 9.8, 1.2, 0.8, 1.2, ALU, CU);
        a.box(c[0] * 6.3, 29.8, c[1] * 6.3, 1, 1.2, 1, STUCCO, IV2, { roof: true }); }
    K.rTop(0, 11.1, 0, 28.2, 28.2, PAVER, 0xd8d0c0); K.rTop(0, 22.2, 0, 21.2, 21.2, PAVER, 0xd8d0c0); K.rTop(0, 29.8, 0, 14.2, 14.2, PAVER_D); K.parapet(0, 11.1, 0, 28.6, 28.6, 0.5, STUCCO, IV2); K.parapet(0, 22.2, 0, 21.6, 21.6, 0.5, STUCCO, IV2);
    K.rAC(-12, 11.15, 4); K.rAC(-12, 11.15, 7); K.rAC(12, 11.15, -4); K.rAC(12, 11.15, -7); K.rDuct(12, 11.15, 3, 8, false); K.rVent(4, 11.15, 12.2); K.rVent(-4, 11.15, -12.2); K.rAC(8.6, 22.25, 0); K.rVent(-8.6, 22.25, 3);
    a.cyl(0, 44.2, 0, 0.5, 0.35, null, 0xff3020, { seg: 8, glow: 1 });   // the mast's warning light
    K.lamps(door, 14, 2.9);
    if (door) { const du = K.doorU(door); K.on(door.side, 14, du, 4.2, 7, 1.1, 0.14, null, 0x2a3a34); K.sign(door.side, 14.06, du, 4.3, 6.4, 0.9, 'NEWS', '#e8d9a8', ''); } };

/* 2 · HERO WORKSHOP: a concrete foot, brick piers, an eaves gutter and downpipes, louvres, lamps by the shutter, a framed sign board */
DET['P05-04-B1'] = (a, door) => { const K = kit(a), BR2 = 0xb85c44;
    K.plinth(17.5, 14, 0.6, door, CONC1, 0xb8b8b2, 0.1);
    K.pil('N', 7, K.clear(door, 'N', [-8.4, -4.375, 0, 4.375, 8.4]), 0.6, 6.4, 0.7, 0.16, BRICK, BR2); K.pil('S', 7, K.clear(door, 'S', [-8.4, -4.375, 0, 8.4]), 0.6, 6.4, 0.7, 0.16, BRICK, BR2);
    K.pil('E', 8.75, K.clear(door, 'E', [-6.65, 0, 6.65]), 0.6, 6.4, 0.7, 0.16, BRICK, BR2); K.pil('W', 8.75, K.clear(door, 'W', [-6.65, 6.65]), 0.6, 6.4, 0.7, 0.16, BRICK, BR2);
    K.course(17.5, 14, 6.72, 0.2, 0.2, METAL, DARK); K.pipe('N', 7, -8.0, 6.7); K.pipe('N', 7, 8.0, 6.7); K.pipe('S', 7, -8.0, 6.7);
    K.vent('E', 8.75, -3.3, 4.6); K.vent('E', 8.75, 3.3, 4.6); K.vent('N', 7, -2.2, 4.6); K.vent('N', 7, 2.2, 4.6);
    K.lamp('S', 7, 1.1, 4.2); K.lamp('S', 7, 8.1, 4.2);
    K.on('S', 7.14, 0, 5.1, 12.3, 0.1, 0.12, null, DARK); K.on('S', 7.14, 0, 6.5, 12.3, 0.1, 0.12, null, DARK); K.on('S', 7.14, -6.1, 5.1, 0.1, 1.5, 0.12, null, DARK); K.on('S', 7.14, 6.1, 5.1, 0.1, 1.5, 0.12, null, DARK);
    K.sign('S', 7.2, 0, 5.3, 11.4, 1.1, 'HERO WORKSHOP', '#2a2a2e', '');
    for (const x of [1.45, 7.75]) { K.on('S', 7, x, 0, 0.3, 4.4, 0.24, null, DARK); K.hazard('S', 7.24, x, 0, 0.3, 1.2); }
    K.ac('W', 8.75, 4, 3.2); K.ac('W', 8.75, 5.4, 3.2);                                   // the shutter's yellow guides
    a.cyl(6.6, 12.5, -4.6, 0.6, 0.25, METAL, 0x8a8e92, { seg: 10 }); a.cyl(6.6, 7.3, -4.6, 0.75, 0.3, METAL, 0x8a8e92, { seg: 10, roof: true });
    K.lamps(door, door && (door.side === 'N' || door.side === 'S') ? 7 : 8.75, 2.6); };

/* 4 · WORKSHOP STORE: quoins, a shop-window frame, upper windows with sills on the long sides, a chimney, pipes */
DET['P05-04-B3'] = a => { const K = kit(a), CRM = 0xfff2d2, GN = 0x5f9a72;
    K.plinth(10.6, 17.6, 0.45, null, BRICK, 0x9a7a48, 0.1);
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) a.box(c[0] * 5.05, 0.45, c[1] * 8.55, 0.7, 6.55, 0.7, STUCCO, CRM, { top: false });
    K.on('N', 8.8, 0, 0.36, 7.4, 0.14, 0.3, null, GN); K.on('N', 8.8, 0, 3.0, 7.4, 0.16, 0.26, null, GN); K.pil('N', 8.8, [-3.6, -1.2, 1.2, 3.6], 0.5, 2.5, 0.12, 0.2, null, GN);
    for (const sd of ['E', 'W']) { K.decal(sd, 5.3, [-4.6, 4.6], 1.0, 3.2, 5.2, DEC_R1); K.ac(sd, 5.3, 0, 4.4); }
    K.decal('N', 8.8, [0], 3.9, 5.2, 2.6, DEC_R1); K.door('N', 8.93, 2.6, 0.5, 1.1, 2.3, D_SHOP);
    K.door('S', 8.8, 2.2, 0, 1.1, 2.2, D_GREY); K.decal('S', 8.8, [-1.6], 3.6, 3.2, 2.6, DEC_R1); K.lamp('S', 8.8, 3.3, 2.5); K.pipe('S', 8.8, -4.6, 6.9); K.pipe('N', 8.8, 4.9, 6.9);
    a.box(2.4, 8.2, 4.5, 0.9, 3.4, 0.9, BRICK, 0xc89a58, { roof: true }); a.box(2.4, 11.6, 4.5, 1.15, 0.2, 1.15, CONC1, 0xd8d4c8, { roof: true }); a.cyl(2.4, 11.8, 4.5, 0.2, 0.5, null, 0x9a5a3c, { seg: 8, roof: true }); };

/* 5 · SUPERHERO TOWER: a stepped base, an architrave and a gilt frieze on the podium, fins on the shaft, bands on the drum, a rail on the ring */
DET['P06-04-B1'] = (a, door) => { const K = kit(a), WH = 0xf6f8fb;
    a.box(0, 0, 0, 32, 0.22, 32, MARBLE, 0xe2dccc, { keyTop: CHECK, tintTop: 0xffffff }); K.rTop(0, 7.8, 0, 30.6, 30.6, PAVER, 0xe6e2d8); K.parapet(0, 7.8, 0, 30.9, 30.9, 0.6, MARBLE, 0xffffff); K.course(28, 28, 6.15, 0.55, 1.35, MARBLE, 0xf2ecde); K.course(28, 28, 6.72, 0.14, 1.5, GOLD, 0xffffff);
    K.sides(17.5, 17.5).forEach(([sd, half]) => K.pil(sd, half, [-5.8, -2.9, 2.9, 5.8], 7.8, 49, 0.22, 0.32, ALU, WH));
    for (const y of [18, 28.5, 39, 49.5, 60]) a.cyl(-8.75, y, 8.75, 6.14, 0.4, ALU, WH, { seg: 24 });
    a.cyl(0, 58.2, 0, 14.8, 1.1, ALU, WH, { seg: 32, ri: 14.68 }); a.cyl(0, 62.5, 0, 13.3, 0.9, ALU, WH, { seg: 32, ri: 13.2 });
    for (const c of [[1, 1], [1, -1], [-1, -1]]) K.rAC(c[0] * 12, 7.8, c[1] * 12); K.rVent(12, 7.85, 0); K.rVent(0, 7.85, -12); K.rDuct(12, 7.85, -5, 9, false); K.rDuct(4, 7.85, -12, 9, true);
    a.box(0, 31.8, 9.02, 6.9, 0.2, 0.34, ALU, WH); a.box(0, 39.2, 9.02, 6.9, 0.2, 0.34, ALU, WH);                       // the shield's frame
    a.cyl(0, 87.6, 0, 0.3, 0.4, null, 0xff3020, { seg: 8, glow: 1 });
    if (door) { const du = K.doorU(door); K.pil(door.side, 14, [du - door.cw / 2 - 0.45, du + door.cw / 2 + 0.45], 0, 3.1, 0.5, 0.3, GOLD, 0xffffff); K.on(door.side, 14, du, 2.6, door.cw + 1.9, 0.5, 0.36, GOLD, 0xffffff); K.lamps(door, 14.2, 2.4); } };

/* 6 · PRESS COURT: a kerb, slim mullions on the glass, a dark fascia on the floating roof, press steps, a dish on the roof */
DET['P07-04-B1'] = (a, door) => { const K = kit(a);
    K.plinth(24.5, 14, 0.3, door, CONC1, 0xd8d8d2, 0.1);
    for (const sd of ['S', 'N']) K.pil(sd, 7, K.clear(door, sd, steps(-10.5, 10.5, 3.5), 1.3), 0.3, 4.3, 0.12, 0.14, ALU, 0xffffff);
    for (const sd of ['E', 'W']) K.pil(sd, 12.25, K.clear(door, sd, [-3.5, 0, 3.5], 1.3), 0.3, 4.3, 0.12, 0.14, ALU, 0xffffff);
    K.course(24.5, 14, 2.5, 0.1, 0.09, ALU, 0xffffff);
    a.box(0, 5.42, 0.8, 28.7, 0.14, 18.8, METAL, DARK, { roof: true }); a.box(0, 4.42, 0.8, 28.56, 0.18, 18.66, null, 0x24488a, { top: false, under: false });
    K.sign('S', 10.1, 0, 4.66, 9, 0.68, 'PRESS COURT', '#ffffff', '#24488a');
    a.box(0, 0, 10.6, 24, 0.16, 1.2, CONC1, 0xe4e4de); a.box(0, 0, 11.6, 26, 0.08, 1.0, CONC1, 0xdadad4);
    K.rTop(0, 5.4, 0.8, 28.3, 18.4, TAR, 0xffffff); K.rAC(-9, 5.56, -3); K.rAC(-5.5, 5.56, -3); K.rSky(2, 5.45, 2, 8, 3); a.cyl(8, 5.56, -3, 0.12, 1.3, METAL, 0xb0b4b8, { seg: 6, roof: true }); a.dome(8, 6.5, -3, 1.2, 0.5, ALU, 0xe8ecf0, { roof: true });
    for (const x of [8.2, 9.8, 11.4]) a.cyl(x, 0, 10.6, 0.26, 0.3, CONC1, 0xd0d0ca, { seg: 8 });
    K.lamps(door, door && (door.side === 'N' || door.side === 'S') ? 7 : 12.25, 2.9); };

/* 7 · APARTMENTS A: a belt course, balconies on the back, an entrance canopy between the bays, pipes, a stair hut and vents on the roof */
function aptDress(a, sx, sz, st, baySide, door) { const K = kit(a), h = st * 3.5, opp = { W: 'E', E: 'W', N: 'S', S: 'N' }[baySide], ew = baySide === 'E' || baySide === 'W';
    const hb = (ew ? sx : sz) / 2, L = ew ? sz : sx;
    K.plinth(sx, sz, 0.5, null, STUCCO, 0xb8b0a0, 0.12); K.course(sx, sz, 3.4, 0.24, 0.16, STUCCO, 0xf2ecde);
    for (let f = 1; f < st; f++) for (const u of [-0.28 * L, 0.28 * L]) K.balcony(opp, hb, u, f * 3.5, 3);
    if (door && door.side === baySide) { const du = K.doorU(door); K.awning(baySide, hb, du, 2.7, 3.4, 1.5, 0x2c5a48, 0x2c5a48); K.lamps(door, hb, 2.4); }   // a walk-in: the real swing door
    else { K.awning(baySide, hb, 0, 2.7, 3.4, 1.5, 0x2c5a48, 0x2c5a48); K.door(baySide, hb, -0.55, 0, 1.1, 2.3, D_WOOD); K.door(baySide, hb, 0.55, 0, 1.1, 2.3, D_WOOD); K.lamp(baySide, hb, -1.3, 2.4); K.lamp(baySide, hb, 1.3, 2.4); }
    K.door(opp, hb, 0, 0, 1.1, 2.2, D_GREY); for (let f = 1; f < st; f++) { K.ac(opp, hb, -0.28 * L + 2.2, f * 3.5 + 1.4); if (f % 2) K.ac(opp, hb, 0.28 * L - 2.2, f * 3.5 + 1.4); }
    K.rTop(0, h + 0.6, 0, sx - 0.5, sz - 0.5, TAR, 0xffffff);
    K.pipe(opp, hb, 0, h); K.pipe(opp, hb, -L / 2 + 0.5, h); K.pipe(opp, hb, L / 2 - 0.5, h);
    K.rHut(-sx * 0.2, h + 0.6, sz * 0.2, BRICK, 0xb86a58); K.rVent(sx * 0.1, h + 0.6, sz * 0.3); K.rVent(-sx * 0.3, h + 0.6, -sz * 0.3); K.rAC(sx * 0.2, h + 0.6, sz * 0.05);
    a.cyl(-sx * 0.3, h + 0.6, sz * 0.38, 0.05, 3.2, METAL, 0xb0b4b8, { seg: 5, roof: true }); }
DET['P07-04-B2'] = (a, door) => aptDress(a, 17.5, 24.5, 5, 'W', door);

/* 8 · COFFEE ARCADE: a brown dado, shuttered upper windows on the blank sides, menu boards by the door, a saucer under the cup, a flue */
DET['P04-05-B1'] = (a, door) => { const K = kit(a), CR2 = 0xfff0d0, BRN = 0x8a5230;
    K.plinth(17.5, 17.5, 0.9, door, STUCCO, BRN, 0.1); K.course(17.5, 17.5, 6.5, 0.22, 0.18, STUCCO, CR2);
    for (const sd of ['N', 'S', 'W']) { const us = [-5.2, 0, 5.2];
        K.win(sd, 8.8, us, 3.3, 2.0, 2.6, G_SQ, 0xd8ecf8); K.frames(sd, 8.8, us, 3.3, 2.0, 2.6, STUCCO, CR2);
        us.forEach(u => { K.panel(sd, 8.8, u - 1.45, 3.3, 0.8, 2.6, SHUT, 0xc89a70); K.panel(sd, 8.8, u + 1.45, 3.3, 0.8, 2.6, SHUT, 0xc89a70); K.on(sd, 8.8, u, 2.75, 2.2, 0.4, 0.45, WOOD, 0x6a4a2c); K.on(sd, 8.8 + 0.05, u, 3.15, 2.0, 0.3, 0.35, null, 0x4f8a48); }); }
    if (door) { const du = K.doorU(door); for (const s of [-1, 1]) K.on(door.side, 8.8, du + s * (door.cw / 2 + 1.0), 0.9, 0.9, 1.4, 0.08, null, 0x2a2420); K.lamps(door, 8.8, 2.6); }
    K.rTop(0, 7.5, 0, 18.1, 18.1, PAVER_D); a.box(11.3, 0, 0, 5, 0.06, 17.5, U('TileMarble3c'), 0xffffff); K.rAC(-6.5, 7.55, -6.5); K.ac('W', 8.8, 3, 1.6);
    a.cyl(-3, 12.15, 5.5, 3.5, 0.25, MARBLE, 0xffffff, { seg: 18 }); a.cyl(6, 7.5, -6.5, 0.3, 2.6, METAL, 0xb0b4b8, { seg: 8, roof: true }); a.cyl(6, 10.1, -6.5, 0.45, 0.25, METAL, 0x8a8e92, { seg: 8, r2: 0.15, roof: true });
    K.pipe('W', 8.8, -8.2, 6.9); K.pipe('W', 8.8, 8.2, 6.9);
    K.on('E', 8.8, 0, 5.75, 7, 0.7, 0.12, null, BRN); K.sign('E', 8.84, 0, 5.8, 5.4, 0.6, 'COFFEE', '#fff0d0', '');   /* above the arcade's vaults (they hid it lower) */ };

/* 11 · TRAINING HALL: a stone foot, stone sills and heads, merlons round the walked roof, bands on the turrets, porch steps */
DET['P06-05-B1'] = (a, door) => { const K = kit(a), ST = 0xe6dcc6, BR = 0xc08468;
    K.plinth(28.1, 28.1, 1.0, door, GRANITE, 0xffffff, 0.14);
    for (const sd of ['N', 'S']) K.frames(sd, 14.1, sd === 'N' ? [-9.2, 9.2] : [-9.2, -4.6, 4.6, 9.2], 1, 2.6, 4.6, MARBLE, ST);
    for (const sd of ['E', 'W']) K.frames(sd, 14.1, [-9.2, -4.6, 0, 4.6, 9.2], 1, 2.6, 4.6, MARBLE, ST);
    for (const u of steps(-9.8, 9.8, 2.8)) for (const s of [-1, 1]) { a.box(u, 7.05, s * 14.05, 1.4, 0.8, 0.5, BRICK, BR, { roof: true }); a.box(s * 14.05, 7.05, u, 0.5, 0.8, 1.4, BRICK, BR, { roof: true }); }
    for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { for (const y of [6.6, 10.1]) a.cyl(c[0] * 13.6, y, c[1] * 13.6, 2.56, 0.35, MARBLE, ST, { seg: 12 }); a.cyl(c[0] * 13.6, 13.7, c[1] * 13.6, 0.12, 0.9, GOLD, 0xffffff, { seg: 6, r2: 0.02, roof: true }); }
    a.box(0, 0, -17.9, 5, 0.34, 1.2, MARBLE, STONE); a.box(0, 0, -18.9, 6, 0.17, 1.0, MARBLE, STONE);
    for (const x of [-9.2, 9.2]) a.box(x, 6.62, -14.28, 2.2, 0.1, 0.2, METAL, DARK);
    K.sign('N', 14.1, 0, 5.5, 8, 0.9, 'TRAINING HALL', '#fff4dc', '#7a2a2a');
    K.door('S', 14.1, 0, 0, 1.2, 2.3, D_GREY); K.lamp('S', 14.1, 1.2, 2.6);
    K.rAC(-9, 7.05, 10); K.rAC(-6.5, 7.05, 10); K.rAC(9, 7.05, 10); K.rVent(9, 7.05, -10); K.rVent(-9, 7.05, -10); K.rDuct(-7.75, 7.05, 6, 6, false);                                     // the banners' rods
    K.lamp('N', 17.15, -2.2, 2.9); K.lamp('N', 17.15, 2.2, 2.9); K.pipe('S', 14.1, -11, 6.6); K.pipe('S', 14.1, 11, 6.6); };

/* 12 · TOWER SERVICE: a foot, concrete ribs, a roof rail, a ladder on the stack, a catwalk between the cooling towers, dock bumpers and lamps */
DET['P07-05-B1'] = (a, door) => { const K = kit(a), RB = 0xd2d8dc;
    K.plinth(28, 24.5, 0.7, door, CONC1, 0x9a9e9e, 0.12);
    K.pil('N', 12.25, K.clear(door, 'N', steps(-11.5, 11.5, 4.6)), 0.7, 8.8, 0.6, 0.3, CONC, RB); K.pil('E', 14, K.clear(door, 'E', steps(-9.2, 9.2, 4.6)), 0.7, 8.8, 0.6, 0.3, CONC, RB);
    K.pil('S', 12.25, K.clear(door, 'S', [-13, -9, 13]), 0.7, 8.8, 0.6, 0.3, CONC, RB);
    K.rTop(0, 14.9, 0, 28.1, 24.6, PAVER_D); K.rAC(-11, 14.95, 9.5); K.rAC(-8, 14.95, 9.5); K.rAC(11, 14.95, 9.5); K.rDuct(0, 14.95, 9.5, 14, true); K.rHut(11, 14.9, 2, CONC, 0xc4ccd2);
    K.rail(28.3, 24.8, 14.9, 0xe8b820); a.box(10.9, 14.9, -5.9, 0.5, 13, 0.08, METAL, DARK, { roof: true });
    a.box(0, 17.2, 5, 20, 0.12, 1.2, METAL, DARK, { roof: true }); a.box(0, 17.32, 5.6, 20, 0.9, 0.05, METAL, 0xe8b820, { roof: true });
    for (const x of [-12, -4, 4]) a.cyl(x, 14.9, -7, 0.2, 0.7, METAL, 0x8a8e92, { seg: 6, roof: true });
    for (const x of [-3, 2, 7, 11]) K.on('S', 14.6, x, 0.35, 0.5, 0.6, 0.14, null, 0x202022); for (const x of steps(-3, 11, 2)) a.box(x, 0.55, 14.62, 2, 0.5, 0.04, HAZ, 0xffffff, { uv: 'fit', faces: 'f', top: false });
    for (const x of [-1, 4, 9]) K.lamp('S', 12.25, x, 4.4); K.vent('N', 12.25, -8, 12.2, 2.4, 1.0); K.vent('N', 12.25, 8, 12.2, 2.4, 1.0); K.vent('E', 14, 0, 12.2, 2.4, 1.0);
    K.lamps(door, door && (door.side === 'N' || door.side === 'S') ? 12.25 : 14, 2.6); };

/* 13 · APARTMENT STAIR: a foot, a belt course, cornice brackets, air units on the back, an awning over the door, a stair hut */
DET['P04-06-B1'] = (a, door) => { const K = kit(a), h = 21, CRM = 0xe4d8be;
    K.plinth(14, 24.5, 0.6, door, BRICK, 0x8a4a40, 0.1); K.course(14, 24.5, 3.38, 0.24, 0.14, ALU, CRM);
    for (const u of steps(-6, 6, 2)) for (const sd of ['N', 'S']) K.on(sd, 12.3, u, h - 0.5, 0.3, 0.5, 0.45, ALU, CRM);
    for (const u of steps(-11, 11, 2)) K.on('W', 7.05, u, h - 0.5, 0.3, 0.5, 0.45, ALU, CRM);
    [[-8, 5.2], [3, 5.2], [-3, 8.7], [8, 8.7], [-8, 12.2], [0, 12.2], [5, 15.7], [-5, 19.2]].forEach(q => K.ac('W', 7.05, q[0], q[1]));
    K.pipe('W', 7.05, -11.6, h); K.pipe('W', 7.05, 11.6, h); K.pipe('N', 12.3, -5, h); K.pipe('S', 12.3, -5, h);
    if (door) { const du = K.doorU(door), hf = door.side === 'N' || door.side === 'S' ? 12.3 : 7.05; if (door.side !== 'E') K.awning(door.side, hf, du, 2.5, 3, 1.3, 0x7a2a2a, 0x7a2a2a); K.lamps(door, hf, 2.4); }
    K.rTop(0, h + 0.7, 0, 14.9, 25.4, TAR, 0xffffff); K.parapet(0, h + 0.7, 0, 15.1, 25.6, 0.5, BRICK, 0xd88470); K.rAC(-4, h + 0.75, -9); K.rHut(3, h + 0.7, 6, BRICK, 0xd88470); K.rVent(3, h + 0.7, -3); K.rVent(-4, h + 0.7, 4); K.rVent(4, h + 0.7, -9); };

/* 14 · TOWNHOUSE ROW: sills and heads, door hoods, stoop rails, a cornice each, chimneys, back windows and doors, pipes between the houses */
DET['P04-06-B2'] = a => { const K = kit(a), TR = [0xfff0e0, 0xf6f0e0, 0xeef4fa], DR = [0x3a6a48, 0x8a2a2a, 0x2a427a];
    for (let i = 0; i < 3; i++) { const x = -5.85 + i * 5.85, hh = 10.5 + (i === 1 ? 1.2 : 0);
        K.on('N', 8.8, x, 0, 5.95, 0.5, 0.1, MARBLE, STONE);
        K.frames('N', 8.8, [x - 1.3, x + 1.3], 4.6, 1.3, 1.8, STUCCO, TR[i]); K.frames('N', 8.8, [x - 1.3, x + 1.3], 7.8, 1.3, 1.8, STUCCO, TR[i]); K.frames('N', 8.8, [x + 1.2], 1.4, 1.5, 1.6, STUCCO, TR[i]);
        K.on('N', 8.8, x - 0.9, 2.95, 1.7, 0.14, 0.8, null, DR[i], { under: true }); K.on('N', 8.8, x - 0.9, 2.8, 1.4, 0.15, 0.2, STUCCO, TR[i]);
        for (const o of [-1.15, 1.15]) a.box(x + o, 0.5, -9.9, 0.06, 0.9, 1.4, METAL, DARK);
        K.on('N', 8.8, x, hh - 0.55, 5.85, 0.3, 0.3, STUCCO, TR[i]); K.on('N', 8.8, x, hh - 0.2, 5.95, 0.2, 0.45, STUCCO, TR[i]);
        K.lamp('N', 8.8, x - 1.9, 2.5);
        a.box(x + 1.9, hh + 0.4, 3, 0.9, 3.4, 0.9, BRICK, 0xc07860, { roof: true }); a.box(x + 1.9, hh + 3.8, 3, 1.1, 0.18, 1.1, CONC1, 0xd8d4c8, { roof: true }); a.cyl(x + 1.9, hh + 3.98, 3, 0.18, 0.45, null, 0x9a5a3c, { seg: 8, roof: true });
        K.decal('S', 8.8, [x], 4.0, 4.2, 5.8, i === 1 ? DEC_R1 : DEC_R2); K.win('S', 8.8, [x + 1.2], 1.3, 1.3, 1.8, G_SQ, 0xd8ecf8); K.frames('S', 8.8, [x + 1.2], 1.3, 1.3, 1.8, STUCCO, TR[i]); K.ac('S', 8.8, x + 2.2, 4.4);
        K.door('N', 8.93, x - 0.9, 0.5, 1.1, 2.3, [D_WOOD, D_RED, D_GREY][i]);
        K.door('S', 8.8, x - 1.1, 0.25, 1.0, 2.1, D_GREY); K.on('S', 8.8, x - 1.1, 0, 1.6, 0.25, 1.0, MARBLE, STONE);
        if (i) K.pipe('N', 8.8, x - 2.925, hh - 1.2); }
    for (const sd of ['E', 'W']) { K.decal(sd, 8.775, [-4.6, 4.6], 4.0, 3.4, 5.6, DEC_R2); K.on(sd, 8.775, 0, 0, 17.7, 0.5, 0.1, MARBLE, STONE); }
    K.on('S', 8.8, 0, 0, 17.6, 0.5, 0.1, MARBLE, STONE); };

/* 16 · TRANSIT COURT: a green tile foot and belt, piers, high windows, posts and a fascia on the canopy, bands and a louvre on the clock tower */
DET['P06-06-B1'] = a => { const K = kit(a), TL2 = 0xfffaea, GR = 0x3f8a72, GD = 0x2c6a56;
    K.plinth(28.1, 24.6, 1.0, null, TILE, GD, 0.12); K.course(28.1, 24.6, 3.9, 0.3, 0.1, null, GR);
    K.pil('S', 12.3, steps(-11.75, 11.75, 4.7), 1, 5.6, 0.7, 0.2, TILE, TL2); K.win('S', 12.3, [-9.4, -4.7, 0, 4.7, 9.4], 4.4, 3, 1.5, G_SQ, 0xd8ecff); K.frames('S', 12.3, [-9.4, -4.7, 0, 4.7, 9.4], 4.4, 3, 1.5, null, GR);
    for (const sd of ['E', 'W']) { K.pil(sd, 14.05, steps(-9.4, 9.4, 4.7), 1, 5.6, 0.7, 0.2, TILE, TL2); K.win(sd, 14.05, [-7.05, -2.35, 2.35, 7.05], 4.4, 3, 1.5, G_SQ, 0xd8ecff); K.frames(sd, 14.05, [-7.05, -2.35, 2.35, 7.05], 4.4, 3, 1.5, null, GR); }
    for (const x of steps(-14, 6, 5)) { a.cyl(x, 0, -17.5, 0.16, 4.4, null, GR, { seg: 8 }); a.cyl(x, 0, -17.5, 0.3, 0.35, CONC1, 0xd8d8d2, { seg: 8 }); }
    a.box(-3, 0, -15.2, 24, 0.06, 5.6, U('TileMarble2a'), 0xffffff); K.door('S', 12.3, 11, 0, 1.2, 2.3, D_GREY); K.rDuct(-7.25, 7.05, 2, 9, false);
    a.box(-3, 4.3, -18.02, 24.1, 0.7, 0.08, null, GR); a.box(-3, 4.9, -15.2, 24.2, 0.08, 5.7, METAL, DARK, { roof: true });
    K.pil('N', 12.3, [-11.9, -7.4, -3, 1.4, 5.8], 0.3, 3.6, 0.14, 0.2, ALU, 0xffffff); K.on('N', 12.3, -3, 3.9, 17.4, 0.2, 0.2, ALU, 0xffffff);
    for (const y of [7.0, 12.6, 17.6]) a.box(11.5, y, -10, 5.3, 0.35, 5.3, null, GR, { under: true });
    a.box(11.5, 9.2, -12.54, 1.6, 2.4, 0.08, CORR, 0x8a9096); a.box(8.96, 9.2, -10, 0.08, 2.4, 1.6, CORR, 0x8a9096);
    for (const q of [[11.5, -12.62, 3.5, 0.1], [8.88, -10, 0.1, 3.5]]) { a.box(q[0], 13.45, q[1], q[2], 0.16, q[3], GOLD, 0xffffff); a.box(q[0], 16.8, q[1], q[2], 0.16, q[3], GOLD, 0xffffff); }
    K.sign('N', 11.76, -3, 7.8, 12, 1.8, 'TRANSIT COURT', '#fffaea', '');
    a.cyl(11.5, 23.5, -10, 0.06, 2.4, ALU, 0xffffff, { seg: 5, roof: true });
    K.on('N', 11.6 - 0.15, -3, 7.5, 13.4, 0.12, 0.34, null, GD, { roof: true }); K.on('N', 11.6 - 0.15, -3, 9.78, 13.4, 0.12, 0.34, null, GD, { roof: true });
    K.rAC(-9, 7.05, 6); K.rAC(-5.5, 7.05, 6); K.rSky(2, 7.05, 4, 6, 2.4); K.rSky(2, 7.05, 8.5, 6, 2.4); K.rVent(8, 7.05, 8); };

/* 17 · OFFICE COURT: white spandrel lines on every floor, mullions in the lobby, an entrance canopy, rings on the stair tower, roof kit and a mast */
DET['P07-06-B1'] = (a, door) => { const K = kit(a), WH = 0xf8f8f4;
    for (const y of steps(7, 21, 3.5)) a.box(-1, y - 0.12, 0, 19.78, 0.24, 21.28, CONC1, WH, { top: false, under: false });
    for (const sd of ['N', 'S']) K.pil(sd, 10.5, K.clear(door, sd, steps(-7, 7, 3.5), 1.3), 0, 3.5, 0.12, 0.14, ALU, 0xffffff);
    K.pil('E', 8.75, K.clear(door, 'E', steps(-7, 7, 3.5), 1.3), 0, 3.5, 0.12, 0.14, ALU, 0xffffff);
    for (const y of steps(3.5, 24.5, 3.5)) a.cyl(8.75, y, 10.5, 3.48, 0.22, CONC1, WH, { seg: 18 });
    a.box(-9.6, 3.3, 0, 1.2, 0.2, 19.4, CONC1, WH, { under: true });
    if (door) { const du = K.doorU(door), hf = door.side === 'N' || door.side === 'S' ? 10.5 : 8.75; K.awning(door.side, hf, du, 2.75, 4.2, 2.2, 0xf8f8f4, 0x2f8a7a); K.lamps(door, hf, 2.4); }
    K.rTop(-1, 25.1, 0, 20.2, 21.7, TAR, 0xffffff); K.rDuct(-4, 25.15, 4.5, 8, true); K.rAC(-7, 25.15, 9); K.rAC(-7, 25.1, 6); K.rAC(-7, 25.1, 3); K.rAC(-7, 25.1, -7); K.rVent(-3, 25.1, 8); K.rail(20.2, 21.7, 25.1, 0xd8dce0);
    a.cyl(2, 28.7, -3, 0.1, 6, ALU, 0xffffff, { seg: 6, r2: 0.03, roof: true }); a.cyl(2, 34.6, -3, 0.22, 0.3, null, 0xff3020, { seg: 8, glow: 1 }); };

/* 18 · THE ANNEX: a grey foot, tall windows in marble surrounds, dentils under the cornice, column bases, porch steps and a door, a balustrade */
DET['P07-06-B2'] = a => { const K = kit(a), MW = 0xffffff;
    K.plinth(10.6, 17.6, 0.7, null, GRANITE, 0xffffff, 0.12);
    for (const sd of ['N', 'S']) { K.win(sd, 8.8, [-2.6, 2.6], 1.6, 1.6, 3.6, G_TALL, 0xb8d4ec); K.frames(sd, 8.8, [-2.6, 2.6], 1.6, 1.6, 3.6, MARBLE, MW); }
    K.win('E', 5.3, [-6, -2, 2, 6], 1.6, 1.6, 3.6, G_TALL, 0xb8d4ec); K.frames('E', 5.3, [-6, -2, 2, 6], 1.6, 1.6, 3.6, MARBLE, MW);
    K.win('W', 5.3, [-7, 7], 1.6, 1.6, 3.6, G_TALL, 0xb8d4ec); K.frames('W', 5.3, [-7, 7], 1.6, 1.6, 3.6, MARBLE, MW);
    for (const u of steps(-4.4, 4.4, 2.2)) for (const sd of ['N', 'S']) K.on(sd, 8.8, u, 6.2, 0.4, 0.4, 0.3, MARBLE, MW);
    for (const u of steps(-7.7, 7.7, 2.2)) K.on('E', 5.3, u, 6.2, 0.4, 0.4, 0.3, MARBLE, MW);
    for (const z of [-4.5, -1.5, 1.5, 4.5]) { a.box(-6.5, 0, z, 1.1, 0.35, 1.1, MARBLE, 0xe6e0d2); a.box(-6.5, 4.9, z, 1.0, 0.3, 1.0, MARBLE, MW); }
    a.box(-7.6, 0, 0, 1.2, 0.2, 11, MARBLE, STONE); K.door('W', 5.3, -0.55, 0, 1.1, 3.0, D_WOOD); K.door('W', 5.3, 0.55, 0, 1.1, 3.0, D_WOOD); K.rAC(2, 7.05, 5); K.rVent(-2, 7.05, -5); K.on('W', 5.3, 0, 3.2, 2.8, 0.3, 0.2, MARBLE, MW);
    for (const s of [-1, 1]) { a.box(0, 7.05, s * 8.7, 10.6, 0.8, 0.14, MARBLE, 0xf2ecdc, { roof: true }); a.box(s * 5.2, 7.05, 0, 0.14, 0.8, 17.4, MARBLE, 0xf2ecdc, { roof: true }); } };

/* 19 · MARKET STEPS: a counter under each tent, a valance on each tent, steps to the avenue */
DET['P05-07-B1'] = a => { const TN = [0xc8443c, 0xe6dec6, 0x2f8a60];
    for (let i = 0; i < 3; i++) { const x = -5.6 + i * 5.6;
        a.box(x, 0.12, 1.6, 3.8, 0.9, 0.9, WOOD, 0xb08a5c); a.box(x, 1.02, 1.6, 4.0, 0.08, 1.1, WOOD, 0x8a6a44, { under: true });
        for (const s of [-1, 1]) { a.box(x, 3.1, s * 2.86, 5.4, 0.34, 0.05, null, TN[i]); a.box(x + s * 2.66, 3.1, 0, 0.05, 0.34, 5.7, null, TN[i]); }
        a.cyl(x, 5.4, 0, 0.1, 0.5, GOLD, 0xffffff, { seg: 6, r2: 0.02 }); }
    a.box(0, 0, 5.75, 17.5, 0.12, 0.9, MARBLE, STONE); a.box(0, 0, -5.75, 17.5, 0.12, 0.9, MARBLE, STONE); };

/* 20 · KIOSKS: a counter ledge and a window band on the round kiosk; a counter, a menu board and roof posts on the snack stand */
DET['P05-07-B2'] = a => {
    a.cyl(-4.5, 0, 0, 2.72, 0.5, null, 0x2c6446, { seg: 8 }); a.cyl(-4.5, 1.05, 0, 2.95, 0.12, WOOD, 0xb08a5c, { seg: 8 }); a.cyl(-4.5, 1.25, 0, 2.64, 1.3, G_SQ, 0xd8ecf8, { seg: 8, cap: false, win: 'keep' });
    a.cyl(-4.5, 5.6, 0, 0.05, 0.5, GOLD, 0xffffff, { seg: 5 });
    a.box(4, 0, -0.5, 6.12, 0.45, 4.12, CONC1, 0xc8c8c2, { top: false }); a.box(4, 1.0, 1.75, 4.8, 0.1, 0.5, WOOD, 0xb08a5c, { under: true }); a.box(4, 2.45, 1.54, 4.4, 0.5, 0.06, null, 0x2a2420); a.quad(4, 2.5, 1.6, 3.6, 0.4, 0, 'txt:SNACKS|#ffe6a0||9', null, { uv: 'fit', kind: 'over' });
    for (const x of [0.8, 7.2]) a.cyl(x, 0, 3.0, 0.07, 3, ALU, 0xffffff, { seg: 6 });
    for (const x of [1.75, 3.25, 4.75, 6.25]) a.box(x, 2.32, 3.1, 0.75, 0.3, 0.05, null, 0xf8f8f4);
    a.box(6.2, 3.25, -1.6, 0.9, 0.6, 0.7, ALU, 0xd8dce0, { roof: true }); };

/* 21 · DELIVERY YARD: a foot, dark shutter jambs and heads, bumpers, canopy posts, a gutter and pipes, lamps over the docks, high windows, turbine vents */
DET['P07-07-B1'] = (a, door) => { const K = kit(a), RD = 0xc85a48;
    K.plinth(31.5, 10.5, 0.5, door, CONC1, 0x9a9e9e, 0.1);
    for (const x of [-13, -8.2, 8.2, 13]) { K.on('N', 5.3, x - 2.15, 0.2, 0.3, 3.9, 0.2, null, DARK); K.on('N', 5.3, x + 2.15, 0.2, 0.3, 3.9, 0.2, null, DARK); K.on('N', 5.3, x, 3.8, 4.6, 0.3, 0.22, null, 0xe8b820);
        K.lamp('N', 5.3, x, 4.5); for (const o of [-1.4, 1.4]) K.on('N', 5.3, x + o, 0.2, 0.4, 0.5, 0.16, null, 0x202022); K.hazard('N', 5.52, x - 2.15, 0.2, 0.3, 1.2); K.hazard('N', 5.52, x + 2.15, 0.2, 0.3, 1.2); }
    K.sign('N', 5.3, 0, 5.0, 8, 0.8, 'DELIVERIES', '#ffffff', '#24488a');
    for (const x of steps(-15, 15, 7.5)) a.cyl(x, 0, -8.1, 0.12, 4.6, METAL, DARK, { seg: 6 });
    a.box(0, 4.42, -8.32, 31.6, 0.2, 0.08, null, RD);
    K.on('S', 5.3, 0, 5.75, 31.7, 0.18, 0.2, METAL, DARK); K.pipe('S', 5.3, -15.2, 5.8); K.pipe('S', 5.3, 15.2, 5.8); K.pipe('S', 5.3, 0, 5.8);
    K.decal('S', 5.3, K.clear(door, 'S', steps(-12, 12, 6), 2.2), 2.4, 3.2, 3, DEC_F); K.ac('S', 5.3, -9, 2.6); K.ac('S', 5.3, 9, 2.6);
    for (const x of [-10.6, -5, 5, 10.6]) { a.cyl(x, 8.5, 1.5, 0.35, 0.5, METAL, 0xb0b4b8, { seg: 8, roof: true }); a.dome(x, 9.0, 1.5, 0.45, 0.4, METAL, 0xb0b4b8, { roof: true }); }
    for (const sd of ['E', 'W']) { K.vent(sd, 15.8, 0, 4.2, 1.6, 1.0); K.pil(sd, 15.8, [-5.1, 5.1], 0.5, 5.5, 0.3, 0.12, ALU, 0xd6dade); }
    K.lamps(door, door && (door.side === 'N' || door.side === 'S') ? 5.3 : 15.8, 2.6); };

/* 22 · DISPATCH OFFICE: a foot, a framed window, a door and its lamp, posts under the big roof, a dark fascia, an air unit */
DET['P07-07-B2'] = a => { const K = kit(a);
    K.plinth(10.05, 7.05, 0.45, null, CONC1, 0xb0b0aa, 0.1); K.frames('S', 3.55, [0], 0.9, 6, 1.9, CONC1, 0xf0f0ea); K.pil('S', 3.55, [-1, 1], 0.9, 1.9, 0.1, 0.14, CONC1, 0xf0f0ea);
    K.door('E', 5.05, 1.6, 0, 1.0, 2.2, D_RED); K.rTop(0.8, 4.0, 0.8, 12.8, 9.8, TAR, 0xffffff); K.lamp('E', 5.05, 2.5, 2.5); K.win('N', 3.55, [-2.5, 2.5], 1.2, 1.6, 1.4, G_SQ, 0xd8ecf8); K.frames('N', 3.55, [-2.5, 2.5], 1.2, 1.6, 1.4, CONC1, 0xf0f0ea);
    K.sign('S', 3.55, 0, 2.95, 4.4, 0.5, 'DISPATCH', '#ffffff', '#2a2a2e');
    for (const q of [[7, 5.5], [7, -3.9], [-5.4, 5.5]]) a.cyl(q[0], 0, q[1], 0.1, 3.6, ALU, 0xffffff, { seg: 6 });
    a.box(0.8, 3.52, 0.8, 13.06, 0.16, 10.06, METAL, DARK, { top: false, under: false }); K.ac('W', 5.05, -1.5, 2.2); K.pipe('N', 3.55, -4.6, 3.5); };

/* the open pieces: bases, capitals and a gilt line on the colonnade; a rail, steps and a finial on the bandstand; flag-pole feet and balls;
   a cap and a step on the memorial wall; feet, gilt bands and lanterns on the gateways */
const DET_OPEN = {
    plaza(a) { const R = 12, bx = 15.75, bz = 22.75;
        a.P.push({ s: 'cyl', p: [0, 0, 0], r: 0.66, h: 0.4, seg: 10, key: MARBLE, tint: 0xe6e0d2, ring: { n: 9, r: R, a0: 200, arc: 140 } }); a.P.push({ s: 'cyl', p: [0, 5.25, 0], r: 0.62, h: 0.35, seg: 10, key: MARBLE, tint: 0xffffff, ring: { n: 9, r: R, a0: 200, arc: 140 } });
        a.cyl(0, 6.4, 0, R + 0.85, 0.16, GOLD, 0xffffff, { seg: 40, arc: 150, a0: 195, ri: R - 0.85 }); a.cyl(0, 0, 0, R + 1.3, 0.16, MARBLE, 0xe2dccc, { seg: 40, arc: 156, a0: 192, ri: R - 1.3 });
        a.cyl(bx, 0, bz, 4.9, 0.22, MARBLE, 0xd8d2c4, { seg: 16 }); a.cyl(bx, 0.45, bz, 3.4, 0.03, CHECK, 0xffffff, { seg: 16 }); a.cyl(bx, 1.4, bz, 3.72, 0.1, MARBLE, 0xffffff, { seg: 16, ri: 3.5 }); a.cyl(bx, 6.85, bz, 0.12, 0.9, GOLD, 0xffffff, { seg: 6, r2: 0.02, roof: true });
        a.cyl(bx, 3.3, bz, 4.5, 0.3, ALU, 0x4f9a88, { seg: 16, ri: 3.3 });
        for (const q of [[-8, 5.5], [8, 5.5], [0, 7.5]]) { a.cyl(q[0], 0, q[1], 0.4, 0.5, MARBLE, 0xe6e0d2, { seg: 8 }); a.dome(q[0], 9, q[1], 0.16, 0.2, GOLD, 0xffffff); } },
    memorial(a) { a.cyl(0, 3.2, 0, 9.14, 0.22, MARBLE, 0xd8d4c8, { seg: 32, arc: 112, a0: -56, ri: 8.26 }); a.cyl(0, 0, 0, 9.5, 0.3, MARBLE, 0xb8b4a8, { seg: 32, arc: 114, a0: -57, ri: 7.9 });
        a.cyl(-14, 0, 0, 3, 0.25, MARBLE, 0xd0cabc, { seg: 4, ry: 45 }); a.cyl(-14, 0.9, 6, 1.12, 0.14, GOLD, 0xffffff, { seg: 12, ri: 0.9 }); a.cyl(-14, 0, 6, 1.5, 0.2, MARBLE, 0xb8b4a8, { seg: 12 }); },
    gate(a) { for (const z of [-10.5, 10.5]) { a.box(0, 0, z, 3.6, 0.9, 3.6, MARBLE, 0xd8d2c4); a.box(0, 6, z, 3.2, 0.35, 3.2, GOLD, 0xffffff); a.box(0, 2.4, z, 3.16, 0.2, 3.16, MARBLE, 0xffffff);
            for (const s of [-1, 1]) { a.box(s * 1.66, 3.4, z, 0.3, 0.45, 0.3, null, WARM, { glow: 1 }); a.box(s * 1.58, 3.9, z, 0.2, 0.1, 0.4, null, DARK); } }
        a.box(0, 8.5, 0, 1.3, 0.12, 18, GOLD, 0xffffff); a.box(0, 10.5, 0, 1.3, 0.12, 18, GOLD, 0xffffff); },
};

/* 3 · THE PIZZERIA — the chain's pack building (mondo 11-13 17:07: a chain, one a district) at real size on the Local shop's lot, door north */
const SWAP = { 'P05-04-B2': { key: 'city_pizzeria', side: 'N', hw: 5.05, hd: 10.25, push: 0.75 } };



/* ── THE INSIDES (2026-11-13, mondo's OK 21:22 on the floor plans; his grid rule 21:14 + 21:17: "if its gonna be a barrier it needs to snap to
   the grid / be centered on a cell, if its just a prop or dressing then it needs to be not centered ... a intended walkway still needs to be
   one cell wide, not have stuff halfway on 2 cells"). Each walk-in room is written on its own 3.5 m battle squares: (i, j) = the square,
   i from the left wall, j from the back wall, the door in the last row (the room's own frame: +z = its front, so one layout serves any
   facing). A thing that blocks fills whole squares, centred; decor stands off a square's middle and blocks nothing. Furniture = the
   catalogue's props; counters, glass walls, lift cores, stages and the like = parts of one `arch` row per room, each with a ghost wall
   (its collision). No prop carries a `y`: a thing on a desk is drawn as a part. ── */
const SQ = 3.5, TRUSS = U('MetalTruss1a'), MAT_RED = U('RubberNonSlip2a');
function insideKit(row) {
    const a = sheet(), props = [], ghosts = [], rot = row.rot || 0, q = rot * Math.PI / 180, cs = Math.cos(q), sn = Math.sin(q), W = row.w, D = row.d;
    const world = (lx, lz) => [row.x + lx * cs - lz * sn, row.z + lx * sn + lz * cs];
    const K = {
        a, props, ghosts, W, D,
        H: (row.storeys || 1) * 3.5 - 0.32,                                                                       // the ceiling (the row's inside roof, as B.js reads it)
        dlx: (() => { const L = Math.max(2, W) - 0.12, n = Math.max(1, Math.round(L / 1.75)), cw = L / n; let c = Math.floor((n - 1) / 2); if (row.door >= 1) c = Math.min(n - 1, Math.round(row.door) - 1); return -L / 2 + (c + 0.5) * cw; })(),   // data.js hqTexbDoor's lx
        at: (i, j, w, h) => [-W / 2 + (i + (w || 1) / 2) * SQ, -D / 2 + (j + (h || 1) / 2) * SQ],                 // the middle of a square / a block of squares
        prop(key, lx, lz, face) { const p = world(lx, lz); props.push({ key, x: p[0], z: p[1], face: ((((face || 0) + rot + 180) % 360) + 360) % 360 }); },   // (+180, 11-14: a prop's `face` is a heading, 0 = its front to -z; the kit's `face` is the room frame's 0 = its front to +z, the door. Seen: chairs and lockers showed the walk their backs; Entertainment + University found the same)
        ghost(lx, lz, w, d, h) { const A = w >= d ? world(lx - (w - d) / 2, lz) : world(lx, lz - (d - w) / 2), B = w >= d ? world(lx + (w - d) / 2, lz) : world(lx, lz + (d - w) / 2);
            ghosts.push({ k: 'wall', x0: A[0], z0: A[1], x1: B[0], z1: B[1], h, t: Math.min(w, d), key: CONC, ghost: true, rail: false }); },
        floor(key, tint, uv) { a.box(0, 0, 0, W - 0.5, 0.03, D - 0.5, key, tint, { uv: uv || 3.5, faces: '' }); },
        /* a screen on a desk / a wall: f = the way it looks (0 = the front, 90 = the left, 180 = the back, 270 = the right) */
        mon(x, y, z, f, w, h, tint) { w = w || 0.55; h = h || 0.4; const n = { 0: [0, 1], 90: [-1, 0], 180: [0, -1], 270: [1, 0] }[f], ew = n[0] !== 0;
            a.box(x, y, z, ew ? 0.08 : w, h, ew ? w : 0.08, null, 0x22262c); a.box(x + n[0] * 0.045, y + 0.04, z + n[1] * 0.045, ew ? 0.01 : w - 0.08, h - 0.08, ew ? w - 0.08 : 0.01, null, tint || 0x4a90c8, { glow: 0.9 }); },
        /* a counter n squares long across the room: the bar on its `dir` side (+1 = toward the door), the back unit behind it, staff between */
        counter(i, j, n, dir, tint, top) { const [x, z] = K.at(i, j, n), L = n * SQ - 0.5;
            a.box(x, 0, z + dir * 1.0, L, 1.05, 0.8, WOOD, tint); a.box(x, 1.05, z + dir * 1.0, L + 0.1, 0.08, 1.0, MARBLE, top || 0xf0ece2);
            a.box(x, 0, z - dir * 1.25, L, 0.9, 0.6, WOOD, tint); a.box(x, 0.9, z - dir * 1.25, L, 0.05, 0.64, MARBLE, top || 0xf0ece2);
            K.ghost(x, z, L, 3.0, 1.2); return [x, z]; },
        /* a glass wall along a run of squares: axis 'x' (across the room) or 'z' (front to back) */
        glass(i, j, n, axis) { const [x, z] = axis === 'x' ? K.at(i, j, n, 1) : K.at(i, j, 1, n), L = n * SQ - 0.1, ex = axis === 'x';
            a.box(x, 0, z, ex ? L : 0.1, 2.9, ex ? 0.1 : L, G_SQ, 0xd8ecf8, { ds: true, uv: [1.75, 2.9], win: 'keep' }); a.box(x, 2.9, z, ex ? L : 0.2, 0.14, ex ? 0.2 : L, ALU, 0xd6dade); a.box(x, 0, z, ex ? L : 0.2, 0.12, ex ? 0.2 : L, ALU, 0xd6dade);
            K.ghost(x, z, ex ? L : 0.4, ex ? 0.4 : L, 3); },
        /* a lift core n squares long on the back wall, a door a square */
        lifts(i, j, n, tint, skip) { const [x, z] = K.at(i, j, n), L = n * SQ - 0.2;   // skip = a square of the core left without a lift door (a story door stands there)
            a.box(x, 0, z, L, 3.3, 3.2, MARBLE, tint); a.box(x, 3.3, z, L + 0.2, 0.2, 3.4, ALU, 0xd6dade);
            for (let k = 0; k < n; k++) { if (k === skip) continue; const dx = x - L / 2 + (k + 0.5) * (L / n); a.box(dx, 0, z + 1.62, 1.7, 2.4, 0.06, ALU, 0xc8ccd0); a.box(dx, 0, z + 1.66, 0.04, 2.4, 0.02, null, DARK); a.box(dx, 2.4, z + 1.62, 2.0, 0.16, 0.1, METAL, DARK); a.box(dx, 2.7, z + 1.62, 0.5, 0.22, 0.05, null, 0xffb040, { glow: 0.9 }); }
            K.ghost(x, z, L, 3.2, 3.3); },
        column(i, j, h, tint) { const [x, z] = K.at(i, j); a.cyl(x, 0, z, 0.55, h, MARBLE, tint, { seg: 12 }); a.box(x, 0, z, 1.5, 0.35, 1.5, MARBLE, tint); a.box(x, h - 0.4, z, 1.5, 0.4, 1.5, MARBLE, tint, { under: true }); K.ghost(x, z, 1.5, 1.5, h); },
        /* a trophy case: a dark base, gilt cups under a glass top on four posts */
        trophies(i, j, axis) { const [x, z] = K.at(i, j), ex = axis === 'x', w = ex ? 3.0 : 1.2, d = ex ? 1.2 : 3.0;
            a.box(x, 0, z, w, 0.8, d, WOOD, 0x4a3426); a.box(x, 0.8, z, w - 0.1, 0.05, d - 0.1, null, 0x8a2030);
            for (const u of [-1, 0, 1]) { const tx = x + (ex ? u * 0.9 : 0), tz = z + (ex ? 0 : u * 0.9); a.cyl(tx, 0.85, tz, 0.14, 0.06, GOLD, 0xffffff, { seg: 8 }); a.cyl(tx, 0.91, tz, 0.04, 0.2, GOLD, 0xffffff, { seg: 6 }); a.cyl(tx, 1.11, tz, 0.08, 0.3, GOLD, 0xffffff, { seg: 10, r2: 0.2 }); }
            for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) a.box(x + c[0] * (w / 2 - 0.04), 0.8, z + c[1] * (d / 2 - 0.04), 0.06, 1.1, 0.06, ALU, 0xd6dade);
            a.box(x, 1.9, z, w, 0.06, d, ALU, 0xd6dade); K.ghost(x, z, w, d, 1.9); },
        /* two desks back to back in a square, a chair and a screen each */
        desks(i, j) { const [x, z] = K.at(i, j);
            K.prop('tanker_desk', x, z - 0.42, 180); K.prop('tanker_desk', x, z + 0.42, 0); K.prop('computer_chair_grey', x, z - 1.25, 0); K.prop('computer_chair_blue', x, z + 1.25, 180);
            K.mon(x - 0.2, 0.78, z - 0.3, 180); K.mon(x + 0.2, 0.78, z + 0.3, 0); },
        /* a row of one prop across a square: n of `key`, `step` apart, looking `face` (the row runs across the way they look) */
        line(key, i, j, n, step, face) { const [x, z] = K.at(i, j), along = face === 0 || face === 180; for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * step; K.prop(key, x + (along ? o : 0), z + (along ? 0 : o), face); } },
        table(i, j, key, chair) { const [x, z] = K.at(i, j); K.prop(key, x, z, 0); K.prop(chair, x, z - 1.3, 0); K.prop(chair, x, z + 1.3, 180); K.prop(chair, x - 1.3, z, 270); K.prop(chair, x + 1.3, z, 90); },
        /* decor: off the square's middle, by a corner (cx, cz = −1 / 0 / +1) */
        decor(key, i, j, cx, cz, face) { const [x, z] = K.at(i, j); K.prop(key, x + cx * 1.25, z + cz * 1.25, face || 0); },
        /* THE SECOND PASS (11-13 night, mondo: "focus on aesthetic, vibe, atmosphere for the interiors"): the helpers below dress a room
           over its first-pass layout. Nothing here blocks a square (decor hugs the walls, off the squares' middles) unless it says `ghost`. */
        /* a prop with the room's own floor under it (`floor: true`: never the roof slab over it) and an optional height (a desk top, a wall) */
        put(key, lx, lz, face, y, o) { const p = world(lx, lz); props.push(Object.assign({ key, x: p[0], z: p[1], face: ((((face || 0) + rot + 180) % 360) + 360) % 360, floor: true }, y != null ? { y } : {}, o || {})); },
        /* a prop on a wall at height y (mount 0: the catalogue mount would lift it again): side 'b' (the back), 'l', 'r', 'f' (the front, the door's), u = along it from its middle (+x on b / f, +z on l / r) */
        wall(key, side, u, y, o) { const e = 0.45, P = { b: [u, -D / 2 + e, 0], f: [u, D / 2 - e, 180], l: [-W / 2 + e, u, 270], r: [W / 2 - e, u, 90] }[side]; K.put(key, P[0], P[1], P[2], y, Object.assign({ mount: 0 }, o)); },
        /* the room's own paint over the bare inside sheet (B.js R.liner): a wall coat, a dado under it, a skirting, a lit ceiling */
        liner(wall, dado, ceil, o) { o = o || {}; const H = K.H, lx = K.dlx, dh = o.dado || 1.0;
            const coat = (m, hh, e, y) => { if (!m) return; const q = (p, ry, w, hole) => a.P.push(Object.assign({ s: 'quad', p, ry, size: [w, hh] }, hole ? { hole } : {}, m));
                q([0, y || 0, -D / 2 + e], 0, W - 2 * e); q([0, y || 0, D / 2 - e], 180, W - 2 * e, [-lx, 1.74, Math.min(2.2, hh)]); q([-W / 2 + e, y || 0, 0], 270, D - 2 * e); q([W / 2 - e, y || 0, 0], 90, D - 2 * e); };
            coat(wall, H, 0.34); coat(dado, dh, 0.36);
            if (dado && o.rail !== false) coat({ tint: o.rail || 0x3a2a20 }, 0.06, 0.38, dh);                                                   // the dado rail
            coat({ tint: o.skirt || 0x2a2a2c }, 0.14, 0.39);                                                                                   // the skirting
            if (ceil) a.P.push(Object.assign({ s: 'box', p: [0, H - 0.07, 0], size: [W - 0.7, 0.04, D - 0.7], under: true, roof: true, top: false, glow: 0.5 }, ceil)); },
        /* a ceiling fitting: a white frame and its lit diffuser (a fluorescent panel), `w` x `d`, just under the ceiling */
        lamp(x, z, w, d, tint, o) { o = o || {}; const y = (o.y || K.H) - 0.16; a.box(x, y + 0.04, z, w + 0.12, 0.08, d + 0.12, null, 0xe8e8e4, { roof: true });
            a.box(x, y, z, w, 0.05, d, null, tint || 0xfff6e0, { glow: 1, under: true, roof: true }); },
        /* a pendant: a cord from the ceiling, a shade, a glowing bulb under it */
        pendant(x, z, drop, shade, tint) { const y = K.H - drop; a.cyl(x, y + 0.3, z, 0.012, drop - 0.3, null, 0x1a1a1a, { seg: 4, roof: true });
            a.cyl(x, y, z, 0.42, 0.36, null, shade || 0x2a4a3a, { seg: 12, r2: 0.1, roof: true }); a.cyl(x, y - 0.03, z, 0.34, 0.05, null, tint || 0xffe2a8, { seg: 12, glow: 1, roof: true }); a.cyl(x, y - 0.17, z, 0.13, 0.14, null, tint || 0xffe2a8, { seg: 10, glow: 1, roof: true }); },
        /* a wall lamp (a sconce): a back plate and a lit glass, on side s at u, y high */
        sconce(side, u, y, tint) { const e = 0.4, P = { b: [u, -D / 2 + e, 0, 1], f: [u, D / 2 - e, 0, -1], l: [-W / 2 + e, u, 1, 0], r: [W / 2 - e, u, -1, 0] }[side], ew = P[2] !== 0;
            a.box(P[0], y, P[1], ew ? 0.04 : 0.22, 0.32, ew ? 0.22 : 0.04, null, 0x3a2a1a); a.box(P[0] + P[2] * 0.1, y + 0.06, P[1] + P[3] * 0.1, ew ? 0.16 : 0.2, 0.22, ew ? 0.2 : 0.16, null, tint || 0xffd9a0, { glow: 1 }); },
        /* a rug / a painted floor area, 6 cm up (the room's floor sheet stays under it) */
        rug(x, z, w, d, key, tint, gain) { a.P.push(Object.assign({ s: 'quad', flat: true, p: [x, 0.06, z], size: [w, d], tint: tint == null ? 0xffffff : tint, gain: gain || 1.6 }, key ? { key } : {})); },
        /* a framed print on a wall (a flat colour field in a frame: no words, no logo) */
        frame(side, u, y, w, h, tint, ftint) { const e = 0.4, P = { b: [u, -D / 2 + e, 0, 1], f: [u, D / 2 - e, 0, -1], l: [-W / 2 + e, u, 1, 0], r: [W / 2 - e, u, -1, 0] }[side], ew = P[2] !== 0;
            a.box(P[0], y, P[1], ew ? 0.05 : w, h, ew ? w : 0.05, null, ftint || 0x2a1e16); a.box(P[0] + P[2] * 0.03, y + 0.08, P[1] + P[3] * 0.03, ew ? 0.01 : w - 0.16, h - 0.16, ew ? w - 0.16 : 0.01, null, tint); },
        sign(x, y, z, w, h, words, fg, bg) { a.box(x, y, z, w, h, 0.06, 'txt:' + words + '|' + fg + '|' + (bg || '') + '|' + (Math.round(w / h * 100) / 100), 0xffffff, { uv: 'fit', faces: 'f', top: false, glow: 0.5, ...(bg ? {} : { kind: 'over' }) }); },
    };
    return K;
}
const IN = {};
/* 1 · NEWS OFFICE: the newsroom (8 x 8) */
IN['P04-04-B1'] = K => { const a = K.a;
    { const [x, z] = K.at(0, 0, 4); a.box(x, 0, z + 0.4, 13.4, 0.9, 2.2, WOOD, 0x5a4636); a.box(x, 0.9, z + 0.4, 13.5, 0.06, 2.3, null, 0x2c3038); a.box(x, 0, z - 1.3, 13.6, 3.6, 0.4, null, 0x2c3038);   // the TV wall: a long console under six screens
        for (let k = 0; k < 6; k++) K.mon(x - 5.5 + k * 2.2, 1.5, z - 1.05, 0, 1.9, 1.3, [0x4a90c8, 0xc85a4a, 0x58b070, 0xd8b040, 0x4a90c8, 0x9a6ac8][k]); K.ghost(x, z, 13.6, 3.0, 3.6); }
    K.glass(5, 0, 1, 'z'); K.glass(6, 2, 2, 'x');                                                                // the editor's office, its doorway the open square beside the glass
    { const [x, z] = K.at(6, 0); K.prop('exec_desk', x, z, 0); K.prop('exec_chair', x, z - 1.0, 0); K.mon(x, 0.78, z - 0.1, 180); }
    K.line('filing_cabinet', 7, 0, 3, 0.85, 0); K.line('filing_cabinet', 6, 5, 3, 0.85, 90);
    for (const j of [3, 5]) for (const i of [0, 1, 3, 4]) K.desks(i, j);
    { const [x, z] = K.at(6, 3, 2); K.prop('conference_table', x - 1.65, z, 90); K.prop('conference_table', x + 1.65, z, 90); for (const u of [-2.4, -0.8, 0.8, 2.4]) { K.prop('office_chair', x + u, z - 1.2, 0); K.prop('office_chair', x + u, z + 1.2, 180); } }
    K.prop('curved_couch', ...K.at(0, 7), 0); K.prop('curved_couch', ...K.at(1, 7), 0);
    { const [x, z] = K.counter(5, 7, 2, -1, 0x6a4a34); K.prop('computer_chair_grey', x, z + 0.2, 180); K.mon(x - 1, 1.13, z - 1.0, 0); }
    K.decor('potted_plant', 7, 7, 1, 1); K.decor('potted_plant', 2, 7, -1, 1); K.decor('trash_bin', 0, 1, -1, -1); K.decor('water_cooler', 5, 3, 1, -1, 90); K.decor('office_plant', 7, 4, 1, 1); K.decor('potted_plant', 4, 0, 1, -1); };
/* 2 · HERO WORKSHOP: the garage (5 x 4) */
IN['P05-04-B1'] = K => { const a = K.a;
    { const [x, z] = K.at(0, 0, 3); a.box(x, 0, z - 0.2, 9.8, 0.9, 1.6, CORR, 0x6a7078); a.box(x, 0.9, z - 0.2, 10, 0.08, 1.8, WOOD, 0xc09a68); a.box(x, 1.2, z - 1.45, 9.8, 1.6, 0.08, WOOD, 0x8a6a48);   // the work bench + its peg board
        for (const u of [-3.6, -1.2, 1.2, 3.6]) a.box(x + u, 0.98, z - 0.3, 0.7, 0.35, 0.45, null, [0xc8443c, 0x3f72c0, 0xe8b820, 0x4a8a5a][Math.round((u + 3.6) / 2.4)]); K.ghost(x, z, 9.8, 2.6, 1.2); }
    K.line('office_locker', 3, 0, 3, 0.9, 0); K.line('office_locker', 4, 0, 3, 0.9, 0);
    { const [x, z] = K.at(3, 1, 2, 2); a.box(x, 0, z, 6.6, 0.12, 6.6, PAVER_D, 0xb8bcc0); for (const s of [-1, 1]) { a.box(x, 0.12, z + s * 3.15, 6.6, 0.02, 0.3, HAZ, 0xffffff); a.box(x + s * 3.15, 0.12, z, 0.3, 0.02, 6.6, HAZ, 0xffffff); }   // the vehicle bay
        for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) a.cyl(x + c[0] * 1.3, 0.12, z + c[1] * 1.7, 0.16, 0.35, METAL, 0xc8443c, { seg: 8 }); K.prop('parked_car', x, z, 0); K.ghost(x, z, 6.6, 6.6, 0.4); }
    { const [x, z] = K.at(0, 2); K.prop('retro_console', x - 0.4, z, 270); K.prop('computer_chair_grey', x + 0.6, z, 90); }
    { const [x, z] = K.at(2, 3); K.prop('psx_wooden_crate_3', x - 0.6, z - 0.4, 0); K.prop('psx_wooden_crate_4', x + 0.6, z - 0.4, 0); K.prop('psx_wooden_crate_2', x, z + 0.7, 0); }
    K.decor('psx_metal_barrel_mp_1', 1, 3, 1, 1); K.decor('traffic_cone', 3, 3, -1, 1); K.decor('traffic_cone', 2, 1, 1, 1); K.decor('trash_bin', 1, 1, -1, -1); };
/* 3 · SUPERHERO TOWER: the lobby (8 x 8) */
IN['P06-04-B1'] = K => { const a = K.a; K.floor(CHECK, 0xffffff, 3.5);
    K.lifts(2, 0, 4, 0xf4efe4, 2);   // its third square = the story door THE TOWER (joins.tower)
    { const [x, z] = K.at(2, 0, 4); a.box(x, 3.5, z - 0.2, 13.8, 3.3, 2.8, MARBLE, 0xf4efe4); }   // the core runs up to the ceiling (the story door's housing stood out over it)
    for (const j of [2, 5]) { K.column(2, j, 6.9, 0xf4efe4); K.column(5, j, 6.9, 0xf4efe4); K.trophies(0, j, 'z'); K.trophies(7, j, 'z'); }
    K.trophies(0, 0, 'x'); K.trophies(7, 0, 'x');
    { const [x, z] = K.at(3, 3, 2, 2); a.cyl(x, 0, z, 3.1, 1.1, MARBLE, 0xf4efe4, { seg: 24, ri: 2.3 }); a.cyl(x, 1.1, z, 3.2, 0.08, WOOD, 0x4a3426, { seg: 24, ri: 2.2 }); a.cyl(x, 0, z, 3.15, 0.14, GOLD, 0xffffff, { seg: 24, ri: 3.0 });   // the round desk
        K.prop('computer_chair_blue', x, z - 1.2, 180); K.prop('computer_chair_blue', x, z + 1.2, 0); K.mon(x, 1.18, z - 2.5, 0); K.mon(x, 1.18, z + 2.5, 180); K.ghost(x, z, 6.4, 6.4, 1.2); }
    for (const i of [1, 2, 5, 6]) K.prop('curved_couch', ...K.at(i, 6), 180);
    for (const s of [0, 7]) { const [x, z] = K.at(s, 3); const wx = x + (s ? 1.3 : -1.3); a.box(wx, 2.2, z + 1.2, 0.06, 3.6, 1.4, null, 0xc8303a); a.box(wx, 5.8, z + 1.2, 0.1, 0.12, 1.6, GOLD, 0xffffff); a.box(wx, 2.2, z - 1.2 + 7, 0.06, 3.6, 1.4, null, 0x2f5fb8); a.box(wx, 5.8, z - 1.2 + 7, 0.1, 0.12, 1.6, GOLD, 0xffffff); }   // banners on the side walls
    K.decor('potted_plant', 0, 7, -1, 1); K.decor('potted_plant', 7, 7, 1, 1); K.decor('potted_plant', 1, 0, -1, -1); K.decor('potted_plant', 6, 0, 1, -1); };
/* 4 · PRESS COURT: the briefing room (7 x 4) */
IN['P07-04-B1'] = K => { const a = K.a;
    { const [x, z] = K.at(1, 0, 5); a.box(x, 0, z, 17.3, 0.45, 3.3, WOOD, 0xb08a5c); a.box(x, 0, z + 1.67, 17.3, 0.45, 0.04, null, 0x2a4a8a); a.box(x, 0.45, z - 1.5, 17, 2.5, 0.12, null, 0x2a4a8a);   // the stage + its backdrop
        K.sign(x, 1.7, z - 1.42, 6, 0.8, 'PRESS COURT', '#ffffff', '');
        a.box(x, 0.45, z + 0.3, 0.8, 1.1, 0.55, WOOD, 0x4a3426); a.box(x, 1.55, z + 0.3, 0.9, 0.06, 0.65, WOOD, 0x4a3426); a.cyl(x, 1.6, z + 0.45, 0.02, 0.3, METAL, DARK, { seg: 5 }); a.cyl(x, 1.9, z + 0.45, 0.05, 0.1, null, 0x22262c, { seg: 6 });   // the podium + its microphone
        K.ghost(x, z, 17.3, 3.3, 0.6); }
    for (const i of [1, 4]) { const [x, z] = K.at(i, 1, 2, 2); for (const u of [-2.4, -0.8, 0.8, 2.4]) for (const v of [-2.1, -0.7, 0.7, 2.1]) K.prop('folding_chair', x + u, z + v, 180); }
    for (const i of [0, 6]) { const [x, z] = K.at(i, 3); if (HAS('studio_camera')) { K.put('studio_camera', x, z, 180); K.ghost(x, z, 1.2, 1.2, 1.8); continue; } a.cyl(x, 0, z, 0.5, 0.06, METAL, DARK, { seg: 10 }); a.cyl(x, 0.06, z, 0.05, 1.4, METAL, DARK, { seg: 6 }); a.box(x, 1.46, z, 0.4, 0.34, 0.8, null, 0x22262c); a.cyl(x, 1.5, z - 0.5, 0.12, 0.26, null, 0x3a3d42, { seg: 8 }); a.box(x, 1.84, z + 0.2, 0.1, 0.1, 0.1, null, 0xd03a30, { glow: 0.9 }); K.ghost(x, z, 1.2, 1.2, 1.8); }   // the cameras
    for (const i of [0, 6]) { const [x, z] = K.at(i, 0), fx = x + (i ? 0.9 : -0.9); a.cyl(fx, 0, z - 1.0, 0.04, 2.7, GOLD, 0xffffff, { seg: 6 }); a.box(fx + (i ? -0.5 : 0.5), 1.9, z - 1.0, 0.95, 0.65, 0.03, null, i ? 0xc8303a : 0x2f5fb8); a.cyl(fx, 0, z - 1.0, 0.22, 0.08, METAL, DARK, { seg: 8 }); }   // the flags
    K.decor('potted_plant', 1, 3, -1, 1); K.decor('potted_plant', 5, 3, 1, 1); };
/* 5 · COFFEE ARCADE: the cafe (5 x 5) */
IN['P04-05-B1'] = K => { const a = K.a; K.floor(U('TileGeneric5a'), 0xffffff, 3.5);
    { const [x, z] = K.counter(0, 0, 4, 1, 0x7a5236, 0xe8dcc8);
        a.box(x - 4, 1.13, z + 1.0, 0.5, 0.6, 0.45, ALU, 0xb8bcc0); a.box(x - 4, 1.73, z + 1.0, 0.3, 0.12, 0.3, null, 0x22262c); a.box(x - 2.4, 1.13, z + 1.0, 0.5, 0.6, 0.45, ALU, 0xb8bcc0);   // the coffee machines
        a.box(x + 4.5, 1.13, z + 1.0, 0.42, 0.3, 0.4, null, 0xd8ceb4); a.box(x + 4.5, 1.43, z + 0.9, 0.3, 0.14, 0.08, null, 0x22262c);                                                              // the till
        a.box(x + 1.2, 1.13, z + 1.0, 1.6, 0.5, 0.6, G_SQ, 0xe8f4fc, { uv: 'fit', win: 'keep' });                                                                                                  // the cake case
        K.sign(x, 2.6, z - 1.2, 5, 0.9, 'COFFEE', '#fff4dc', '#5a3a26'); }
    K.line('vending_machine', 4, 0, 2, 1.2, 0);
    for (const j of [2, 4]) for (const i of [0, 2]) K.table(i, j, 'psx_dinner_table_1', 'cafeteria_chair');
    K.prop('psx_sofa_1', ...K.at(4, 2), 90); K.prop('psx_sofa_1', ...K.at(4, 3), 90);
    K.decor('potted_plant', 4, 4, 1, 1); K.decor('trash_bin', 4, 1, 1, -1); K.decor('potted_plant', 1, 3, -1, 1); K.decor('office_plant', 1, 1, 1, -1); };
/* 6 · TOWER SERVICE: the plant room (8 x 7) */
IN['P07-05-B1'] = K => { const a = K.a;
    for (const i of [0, 2, 4]) { const [x, z] = K.at(i, 0); K.prop('boiler', x, z, 0); a.cyl(x + 0.5, 2.2, z - 0.6, 0.14, 4.7, METAL, 0xb0b4b8, { seg: 8 }); a.box(x, 5.4, z - 0.6, 3.5, 0.26, 0.26, METAL, 0xb0b4b8); }
    { const [x, z] = K.at(6, 0, 2, 2); a.cyl(x, 0, z, 3.0, 4.2, ALU, 0x9ab0c0, { seg: 20 }); a.dome(x, 4.2, z, 3.0, 0.9, ALU, 0x9ab0c0); for (const y of [0.3, 2.1, 3.9]) a.cyl(x, y, z, 3.06, 0.14, METAL, DARK, { seg: 20 }); a.box(x - 3.1, 0, z + 0.4, 0.08, 4.4, 0.5, TRUSS, 0xe8b820, { kind: 'over', ds: true }); K.ghost(x, z, 6.2, 6.2, 5); }   // the water tank
    { const [x, z] = K.at(0, 3, 3); a.box(x, 0, z - 1.3, 10, 3.2, 0.3, null, 0x2c3038); for (let k = 0; k < 5; k++) K.mon(x - 4 + k * 2, 1.6, z - 1.1, 0, 1.7, 1.1, [0x58b070, 0x4a90c8, 0xd8b040, 0x58b070, 0xc85a4a][k]);   // the control desk under its wall of screens
        for (const u of [-3.5, 0, 3.5]) { K.prop('retro_console', x + u - 0.85, z - 0.3, 180); K.prop('retro_console', x + u + 0.85, z - 0.3, 180); K.prop('computer_chair_grey', x + u, z + 0.8, 180); } K.ghost(x, z - 1.3, 10, 0.4, 3.2); }
    { const [x, z] = K.at(4, 3, 1, 2); a.box(x, 0, z, 0.08, 3, 6.9, TRUSS, 0xc8ccd0, { kind: 'over', ds: true, uv: 1.5 }); for (const v of [-3.4, 0, 3.4]) a.cyl(x, 0, z + v, 0.07, 3.1, METAL, DARK, { seg: 6 }); a.box(x, 3, z, 0.14, 0.1, 6.9, METAL, DARK); K.ghost(x, z, 0.4, 6.9, 3); }   // the cage fence
    for (const c of [[6, 3], [7, 4]]) { const [x, z] = K.at(c[0], c[1]); K.prop('psx_wooden_crate_3', x - 0.6, z - 0.5, 0); K.prop('psx_wooden_crate_5', x + 0.6, z - 0.5, 0); K.prop('psx_wooden_crate_2', x, z + 0.65, 0); }
    for (const c of [[7, 3], [6, 4]]) { const [x, z] = K.at(c[0], c[1]); for (const o of [[-0.5, -0.5], [0.5, -0.5], [0, 0.45]]) K.prop('psx_metal_barrel_mp_' + (1 + (c[0] + o[0] > 6.5 ? 1 : 0)), x + o[0], z + o[1], 0); }
    K.line('office_locker', 0, 5, 3, 0.9, 270); K.line('office_locker', 0, 6, 3, 0.9, 270);
    { const [x, z] = K.at(6, 6, 2); a.box(x, 0, z, 6, 0.25, 2.4, CONC1, 0xb8b8b2); a.box(x - 0.8, 0.25, z, 3.8, 1.7, 2.0, CORR, 0x4a8a5a); a.box(x + 2.0, 0.25, z, 1.6, 1.3, 1.8, CORR, 0x3a6a46); a.box(x - 0.8, 0.6, z + 1.01, 2.4, 1.0, 0.04, GRILL, 0xc8ccd0); a.cyl(x - 2.2, 1.95, z - 0.5, 0.14, 4.9, METAL, 0xb0b4b8, { seg: 8 }); a.box(x + 2.0, 1.0, z + 0.91, 0.5, 0.3, 0.04, null, 0xe8b820, { glow: 0.6 }); K.ghost(x, z, 6, 2.4, 2); }   // the generator
    for (const s of [-1, 1]) a.box(s * 3.5, 6.0, -K.D / 2 + 9, 0.3, 0.3, K.D - 1, METAL, s > 0 ? 0xc8443c : 0x3f72c0);                                                                                 // the pipe runs under the ceiling
    K.decor('mop_bucket', 1, 6, 1, 1); K.decor('traffic_cone', 5, 0, -1, -1); K.decor('psx_metal_barrel_mp_3', 7, 5, 1, 1); K.decor('trash_bin', 3, 4, -1, 1); };
/* 7 · APARTMENT STAIR: the lobby (7 x 4) */
IN['P04-06-B1'] = K => { const a = K.a;
    if (HAS('mailbox_bank')) { const [x, z] = K.at(0, 0, 2); for (const u of [-2.3, -1.15, 0, 1.15, 2.3]) K.put('mailbox_bank', x + u, -K.D / 2 + 0.68, 0, 0.6); a.box(x, 0, -K.D / 2 + 0.75, 6.4, 0.6, 0.6, WOOD, 0x4a3020); K.ghost(x, z, 6.4, 1.2, 1.9); }   // the Meshy brass banks (2nd pass) on a dark wood plinth
    else { const [x, z] = K.at(0, 0, 2); a.box(x, 0.3, z, 6.4, 1.5, 1.0, GRILL, 0xc8ccd0); for (const u of [-3, 0, 3]) a.box(x + u, 0, z, 0.12, 0.3, 0.9, METAL, DARK); a.box(x, 1.8, z, 6.5, 0.06, 1.1, WOOD, 0x6a4a34); K.ghost(x, z, 6.4, 1.2, 1.9); }   // the mailboxes
    { const [x, z] = K.at(2, 0, 2, 2); for (let k = 0; k < 11; k++) a.box(x, 0, z + 3.2 - 0.6 * k, 6.4, 0.32 * (k + 1), 0.6, CONC1, 0xc8c2b4); for (const s of [-1, 1]) a.box(x + s * 3.25, 0, z, 0.1, 4.5, 6.6, PLASTER, 0xe6d8c0);   // the stair up to the closed landing
        a.box(x, 3.52, z - 3.28, 1.2, 2.2, 0.06, D_GREY, 0xffffff, { uv: 'fit', faces: 'f', top: false }); K.ghost(x, z, 6.6, 6.6, 4.5); }
    K.lifts(4, 0, 1, 0xe6d8c0);
    { const [x, z] = K.counter(5, 0, 2, 1, 0x6a4a34); K.prop('exec_chair', x, z - 0.2, 0); K.mon(x + 1.5, 1.13, z + 1.0, 180); }
    K.prop('psx_sofa_3', ...K.at(0, 2), 270); K.line('vending_machine', 0, 3, 2, 1.2, 270);
    K.decor('potted_plant', 6, 3, 1, 1); K.decor('trash_bin', 1, 3, -1, 1); K.decor('office_plant', 6, 2, 1, -1); };
/* 8 · OFFICE COURT: the lobby (6 x 5) */
IN['P07-06-B1'] = K => { const a = K.a; K.floor(PAVER, 0xffffff, 3.5);
    K.lifts(1, 0, 4, 0xe8eaec);
    for (const i of [0, 1, 4, 5]) K.line('metro_gate', i, 1, 3, 1.1, 0);
    { const [x, z] = K.counter(2, 3, 2, 1, 0x4a5058, 0xf4f4f0); K.prop('computer_chair_grey', x - 1, z - 0.2, 0); K.prop('computer_chair_grey', x + 1, z - 0.2, 0); K.mon(x - 1, 1.13, z + 1.0, 180); K.mon(x + 1, 1.13, z + 1.0, 180); }
    K.prop('curved_couch', ...K.at(0, 4), 270);
    K.glass(4, 4, 1, 'z'); { const [x, z] = K.at(5, 4); K.prop('conference_table', x, z, 0); K.prop('office_chair', x - 1.0, z - 0.5, 270); K.prop('office_chair', x - 1.0, z + 0.6, 270); K.prop('office_chair', x + 1.0, z, 90); }
    K.decor('potted_plant', 0, 0, -1, -1); K.decor('potted_plant', 5, 0, 1, -1); K.decor('office_plant', 0, 2, -1, 1); K.decor('water_cooler', 5, 2, 1, 1, 90); K.decor('trash_bin', 1, 4, 1, 1); };
/* 9 · DELIVERY YARD: the depot floor (9 x 3) */
IN['P07-07-B1'] = K => { const a = K.a;
    for (const i of [0, 1, 3, 4, 6, 7]) { const [x, z] = K.at(i, 0); K.prop('ebd_gasstation_metal_shelving', x, z, 0); }
    K.line('office_locker', 8, 0, 3, 0.9, 0);
    { const [x, z] = K.at(0, 2, 2); K.prop('conveyor', x, z, 0); }
    for (const i of [4, 6]) { const [x, z] = K.at(i, 2); a.box(x, 0, z, 1.5, 0.14, 1.3, WOOD, 0xb08a5c); K.prop('cardboard_boxes', x, z, 0); }
    { const [x, z] = K.at(7, 2, 2); K.prop('tanker_desk', x - 0.9, z, 180); K.prop('tanker_desk', x + 0.9, z, 180); K.prop('computer_chair_grey', x - 0.9, z - 0.9, 0); K.prop('computer_chair_grey', x + 0.9, z - 0.9, 0); K.mon(x - 0.9, 0.78, z + 0.15, 180); K.mon(x + 0.9, 0.78, z + 0.15, 180); }
    a.box(0, 0.03, K.D / 2 - 0.5, K.W - 1, 0.01, 0.3, HAZ, 0xffffff);
    K.decor('cardboard_box', 2, 0, -1, -1); K.decor('trash_bin', 5, 0, 1, -1); K.decor('psx_metal_barrel_mp_2', 5, 2, 1, 1); K.decor('traffic_cone', 2, 2, -1, 1); };
/* 10 · TRAINING HALL: the gym floor (8 x 8), a walk-in since this pass */
IN['P06-05-B1'] = K => { const a = K.a; K.floor(TAR, 0x6a7078, 3.5);
    for (const i of [0, 1, 6, 7]) K.line('office_locker', i, 0, 3, 0.9, 0);
    { const [x, z] = K.at(3, 0, 2); for (const u of [-2.2, 2.2]) { for (const s of [-1, 1]) a.box(x + u + s * 0.7, 0, z, 0.1, 2.2, 0.1, METAL, DARK); a.box(x + u, 1.4, z, 2.4, 0.06, 0.06, ALU, 0xd6dade); for (const s of [-1, 1]) a.box(x + u + s * 1.0, 1.2, z, 0.08, 0.46, 0.46, null, 0x22262c); a.box(x + u, 0.4, z + 0.9, 0.5, 0.12, 1.3, null, 0x8a2a2a); a.box(x + u, 0, z + 0.9, 0.4, 0.4, 1.1, METAL, DARK); }   // the weight racks + benches
        K.ghost(x, z, 6.6, 2.6, 1.6); }
    { const [x, z] = K.at(3, 3, 2, 2); a.box(x, 0, z, 6.6, 0.55, 6.6, null, 0x2f5fb8); a.box(x, 0.55, z, 6.4, 0.04, 6.4, PAVER, 0xf0f0ea);   // the sparring ring
        for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) a.cyl(x + c[0] * 3.0, 0.55, z + c[1] * 3.0, 0.1, 1.4, null, c[0] * c[1] > 0 ? 0xc8303a : 0x2f5fb8, { seg: 8 });
        for (const y of [1.0, 1.35, 1.7]) for (const s of [-1, 1]) { a.box(x, y, z + s * 3.0, 6, 0.04, 0.04, null, 0xf4f4f0); a.box(x + s * 3.0, y, z, 0.04, 0.04, 6, null, 0xf4f4f0); }
        K.ghost(x, z, 6.6, 6.6, 0.6); }
    for (const c of [[0, 2], [7, 2], [0, 5], [7, 5]]) { const [x, z] = K.at(c[0], c[1]); for (const s of [-1, 1]) a.box(x, 0, z + s * 1.3, 0.12, 2.9, 0.12, METAL, DARK); a.box(x, 2.9, z, 0.14, 0.14, 2.8, METAL, DARK);   // the punching bags on their frames
        for (const v of [-0.6, 0.6]) { if (HAS('punching_bag')) { K.put('punching_bag', x, z + v, 90, 0.6); continue; } a.cyl(x, 2.3, z + v, 0.02, 0.6, METAL, 0xb0b4b8, { seg: 5 }); a.cyl(x, 1.1, z + v, 0.26, 1.2, TAR, 0xa83a3a, { seg: 10 }); } K.ghost(x, z, 1.0, 2.8, 2.9); }
    for (const i of [0, 1, 6, 7]) K.line('metro_bench', i, 7, 1, 1, 180);
    K.decor('water_cooler', 2, 7, -1, 1, 180); K.decor('trash_bin', 5, 7, 1, 1); K.decor('traffic_cone', 2, 4, -1, 1); K.decor('traffic_cone', 5, 4, 1, -1); };

/* ── THE SECOND PASS (2026-11-13 night, mondo: "do another interior pass ... Focus on aesthetic, vibe, atmosphere for the interiors"; "make a list of
   models needed/wanted but not in the bucket or game, and make meshy versions of them"). Over each room's first-pass layout: the room's own paint
   (a wall coat, a dado, a rail, a skirting, a lit ceiling: the bare inside sheet read grey and its ceiling black), its light fittings (panels,
   pendants, sconces: drawn and glowing, the city's ten real lamps are shared by the whole map), rugs, wall pieces (clocks, exit signs, boards,
   extinguishers) and the clutter of the trade. The Meshy pieces (data.js 'Meshy city interiors'): this district's treadmill, welding_cart,
   photocopier, newspaper_bundles, studio_camera, pallet_jack, hand_truck, mailbox_bank; Southside's punching_bag, dumbbell_rack, weight_bench,
   tool_chest, engine_hoist, tire_stack; University's espresso_machine, pastry_case, rope_stanchion; Entertainment's studio_light (claims:
   project files meshy/interior-claims.md). A piece another district makes is placed only once its catalogue row is in data.js (`HAS`), so a
   rebake after their merge brings it in. The grid rule holds: a piece that blocks is centred on whole squares with a ghost; the rest hugs a
   wall or a corner, off the squares' middles, never across a walkway. ── */
const HAS = (() => { let src = null; const seen = {}; return k => { if (seen[k] != null) return seen[k]; if (src == null) { try { src = require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'data.js'), 'utf8'); } catch (e) { src = ''; } } return (seen[k] = new RegExp('\\n\\s+' + k + ':\\s*\\{').test(src)); }; })();
const PAINT2 = (tint, key, gain) => ({ key: key || PLASTER_A, tint, gain: gain || 2.0 }), WOODM = tint => ({ key: WOOD, tint, gain: 1.5 }), CEIL = tint => ({ key: U('FibreCeilingTile1a'), tint: tint || 0xffffff, gain: 1.9, glow: 0.9 });
const PLASTER_A = U('PlasterWallPainted1a'), PLASTER_B = U('PlasterWallPainted1b'), COOL = 0xeaf4ff;
const IN2 = {};
let RING_COURSE = false;
/* 1 · NEWS OFFICE: cream walls over a walnut dado, a blue carpet under the desks, a fluorescent panel over every desk square, the world clocks
   over the TV wall, paper and coffee on the desks, the photocopier and the bundles of the day's papers by the front */
IN2['P04-04-B1'] = K => { const at = K.at;
    K.liner(PAINT2(0xf2e6cc), WOODM(0x7a5a40), CEIL(), { dado: 1.1 });
    K.rug(...at(0, 3, 5, 4), 5 * SQ - 0.6, 4 * SQ - 0.6, 'carpet', 0x6a8ac8, 1.9);
    for (const j of [3, 5]) for (const i of [0, 1, 3, 4]) { const [x, z] = at(i, j); K.lamp(x, z, 2.4, 0.5);
        K.put('papers_a', x + 0.45, z - 0.45, 180, 0.76); K.put('coffee_mug', x - 0.55, z - 0.55, 0, 0.76); K.put('papers_b', x - 0.45, z + 0.45, 0, 0.76); K.put('coffee_mug', x + 0.6, z + 0.55, 0, 0.76); }
    K.lamp(...at(0, 1, 4), 10, 0.5); K.lamp(...at(6, 3, 2), 3, 0.6); K.lamp(...at(5, 7, 2), 3, 0.6); K.lamp(...at(6, 0, 2), 3, 0.6); K.lamp(...at(2, 7, 2), 3, 0.6);
    K.wall('world_clocks', 'b', at(0, 0, 4)[0], 4.3); K.wall('wall_clock', 'l', at(0, 4)[1], 2.8); K.wall('notice_board', 'l', at(0, 6)[1], 1.2);
    K.wall('exit_sign', 'f', K.dlx, 2.75); K.wall('fire_extinguisher', 'f', K.dlx + 1.5, 1.0);
    { const [x, z] = at(7, 6); K.put('photocopier', x, z, 90); K.ghost(x, z, 1.4, 1.4, 1.2); }
    K.put('newspaper_bundles', at(2, 7)[0] - 1.1, at(2, 7)[1] + 1.1, 20); K.put('newspaper_bundles', at(7, 5)[0] + 1.1, at(7, 5)[1] + 1.0, 70); };
/* 2 · HERO WORKSHOP: pale corrugated walls over a hazard band, strip lights over the bench and the bay, the hero's own garage clutter */
IN2['P05-04-B1'] = K => { const at = K.at;
    K.liner({ key: CORR, tint: 0xd8dde2, gain: 2.0 }, { key: HAZ, tint: 0xffffff, gain: 1.2 }, { key: CORR, tint: 0x8a9098, gain: 1.6, glow: 0.7 }, { dado: 0.3, rail: false });
    { const [x, z] = at(0, 0, 3); K.lamp(x, z + 0.6, 7.5, 0.3, COOL); } { const [x, z] = at(3, 1, 2, 2); K.lamp(x, z - 1.2, 5, 0.3, COOL); K.lamp(x, z + 1.2, 5, 0.3, COOL); }
    K.lamp(...at(0, 2), 2.0, 0.3, COOL); K.lamp(...at(2, 3), 2.0, 0.3, COOL);
    K.wall('wall_clock', 'b', at(1, 0)[0], 3.4); K.wall('exit_sign', 'f', K.dlx, 2.75); K.wall('fire_extinguisher', 'l', at(0, 1)[1], 1.0); K.wall('hook_rail', 'l', at(0, 1)[1] + 1.0, 1.75);
    { const [x, z] = at(2, 2); K.put('welding_cart', x + 0.9, z, 270); }
    if (HAS('engine_hoist')) { const [x, z] = at(3, 1, 2, 2); K.put('engine_hoist', x + 2.2, z - 2.0, 270); }      // inside the bay's own ghost
    if (HAS('tool_chest')) K.put('tool_chest', K.W / 2 - 0.6, at(4, 3)[1] + 0.4, 90);
    if (HAS('tire_stack')) { const [x, z] = at(1, 3); K.put('tire_stack', x - 1.1, z + 1.1, 0); } };
/* 3 · SUPERHERO TOWER: ivory walls over a marble dado, a red runner from the doors to the round desk, a ring light over the desk, pendants,
   sconces, the directory by the lifts; brass rope stanchions along the runner (University's) */
IN2['P06-04-B1'] = K => { const a = K.a, at = K.at;
    K.liner(PAINT2(0xf6eedd, PLASTER_A, 2.1), { key: U('TileMarble2a'), tint: 0xe0d4bc, gain: 1.7 }, CEIL(), { dado: 1.2, rail: 0xb08a3a });
    const [dx, dz] = at(3, 3, 2, 2), z0 = dz + 3.4, z1 = K.D / 2 - 0.5;
    K.rug(K.dlx, (z0 + z1) / 2, 2.0, z1 - z0, 'carpet', 0xa02030, 1.6);
    a.cyl(dx, K.H - 1.2, dz, 2.7, 0.12, null, 0xfff0d0, { seg: 24, ri: 2.4, glow: 1, roof: true }); for (const c of [[1, 0], [-1, 0], [0, 1], [0, -1]]) a.cyl(dx + c[0] * 2.55, K.H - 1.08, dz + c[1] * 2.55, 0.015, 1.08, null, 0x1a1a1a, { seg: 4, roof: true });
    for (const p of [[1, 1], [6, 1], [1, 4], [6, 4], [2, 6], [5, 6]]) K.pendant(...at(p[0], p[1]), 1.8, 0x7a1a24, 0xffe2a8);
    for (const s of ['l', 'r']) for (const j of [1, 6]) K.sconce(s, at(0, j)[1], 2.6);
    K.wall('directory_board', 'r', at(7, 4)[1], 1.0); K.wall('wall_clock', 'l', at(0, 1)[1], 4.6); K.wall('exit_sign', 'f', K.dlx, 2.75);   // (the board moved out of Eagleman's room, 11-14)
    if (HAS('rope_stanchion')) for (const j of [5, 6]) { const z = at(0, j)[1]; K.put('rope_stanchion', K.dlx - 1.6, z, 90); K.put('rope_stanchion', K.dlx + 3.2, z, 90); }
    TOWER_ROOMS(K); };
/* THE RESIDENTS' ROOMS in the tower (11-14, bedrooms brief): the lobby keeps everything; its two back corners (2 x 2 squares beside the lift
   core, each with its trophy case) are walled off as bedrooms, a one-square doorway each off the lobby: the Superhero's (left, squares 0-1)
   and Eagleman's (right, 6-7). Bed at the back wall next to the trophies, the wardrobe on the side wall. */
function TOWER_ROOMS(K) { const at = K.at, zF = at(0, 1)[1] + 1.75;
    for (const [i0, iw] of [[0, 2], [6, 0]]) { const xi = at(i0, 0)[0], xe = at(iw === 2 ? 1 : 6, 0)[0] + (iw === 2 ? 1.75 : -1.75), xo = iw === 2 ? -K.W / 2 : K.W / 2, dI = iw === 2 ? 1 : 6;
        partition(K, xe, -K.D / 2, xe, zF); partition(K, xo, zF, xe, zF, [[Math.min(at(dI, 0)[0] - 1.75, at(dI, 0)[0] + 1.75), Math.max(at(dI, 0)[0] - 1.75, at(dI, 0)[0] + 1.75)]], 0xf6eedd); }
    bedSet(K, ...at(1, 0), 0, 'psx_bed_4_3', ...at(0, 1), 270, 1, 0xa02030);      // the Superhero
    bedSet(K, ...at(6, 0), 0, 'psx_bed_4_4', ...at(7, 1), 90, -1, 0x2f5f9a);        // Eagleman
    K.pendant(...at(0, 0), 1.8, 0x7a1a24, 0xffe2a8); K.pendant(...at(7, 0), 1.8, 0x7a1a24, 0xffe2a8); }
/* 4 · PRESS COURT: blue-grey walls over a dark dado, a red carpet under the seats, ceiling panels, a lighting truss with its cans over the stage;
   the TV cameras are the Meshy pedestal camera (the drawn ones stay as the fallback), studio lights at the stage's ends (Entertainment's) */
IN2['P07-04-B1'] = K => { const a = K.a, at = K.at;
    K.liner(PAINT2(0x8a9ab4), WOODM(0x4a3020), CEIL(), { dado: 1.0 });
    K.rug(...at(0, 1, 7, 3), 7 * SQ - 0.8, 3 * SQ - 0.5, 'carpet', 0x9a2a34, 1.5);
    for (const j of [1, 3]) for (const i of [1, 3, 5]) K.lamp(...at(i, j), 1.2, 1.2);
    { const [x, z] = at(1, 0, 5); a.box(x, K.H - 0.45, z + 1.2, 17, 0.28, 0.28, TRUSS, 0xd0d0d0, { kind: 'over', ds: true, roof: true });
        for (let k = 0; k < 6; k++) { const cx = x - 7 + k * 2.8; a.cyl(cx, K.H - 0.8, z + 1.2, 0.15, 0.34, null, 0x1a1a1a, { seg: 8, roof: true }); a.cyl(cx, K.H - 0.82, z + 1.2, 0.12, 0.03, null, 0xfff0c8, { seg: 8, glow: 1, roof: true }); } }
    if (HAS('studio_light')) { K.put('studio_light', -K.W / 2 + 0.8, at(0, 1)[1], 225); K.put('studio_light', K.W / 2 - 0.8, at(6, 1)[1], 135); }
    K.wall('wall_clock', 'l', at(0, 2)[1], 2.4); K.wall('exit_sign', 'f', K.dlx, 2.45); K.wall('fire_extinguisher', 'f', K.dlx + 1.5, 1.0); };
/* 5 · COFFEE ARCADE: terracotta walls over a dark wood dado, green-shaded pendants over the tables, amber ones over the counter, the espresso
   machine + the pastry case (University's), the menu board, cups on the tables */
IN2['P04-05-B1'] = K => { const at = K.at;
    K.liner(PAINT2(0xe8c49c), WOODM(0x5a3a26), CEIL(), { dado: 1.1, rail: 0x2a1a10 });
    for (const j of [2, 4]) for (const i of [0, 2]) { const [x, z] = at(i, j); K.pendant(x, z, 2.6, 0x2a5a3a); K.put('coffee_mug', x + 0.25, z - 0.2, 0, 0.86); K.put('coffee_mug', x - 0.3, z + 0.25, 0, 0.86); }
    { const [x, z] = at(0, 0, 4); for (const u of [-4, 0, 4]) K.pendant(x + u, z + 1.0, 2.4, 0x8a5a2a);
        K.put('coffee_maker', x + 1.0, z - 1.25, 0, 0.95); K.put('coffee_mug', x - 1.0, z + 1.0, 0, 1.13);
        if (HAS('espresso_machine')) K.put('espresso_machine', x - 3.2, z - 1.25, 0, 0.95);
        if (HAS('pastry_case')) K.put('pastry_case', x + 2.9, z + 1.0, 0, 1.13); }
    K.pendant(...at(4, 2), 2.6, 0x2a5a3a); K.pendant(...at(4, 3), 2.6, 0x2a5a3a);
    for (const j of [2, 3]) K.sconce('r', at(4, j)[1], 2.1); K.sconce('l', at(0, 3)[1], 2.1);
    K.wall('chalkboard', 'r', at(4, 1)[1], 1.0); K.wall('wall_clock', 'l', at(0, 1)[1], 2.8); K.wall('exit_sign', 'f', K.dlx, 2.75); };
/* 6 · TOWER SERVICE: pale walls over a safety-green dado with a yellow rail, a dark steel ceiling, cool strip lights and caged wall lamps,
   breaker panels, signs */
IN2['P07-05-B1'] = K => { const at = K.at;
    K.liner(PAINT2(0xc8ccc4, PLASTER_B, 1.8), { key: PLASTER_B, tint: 0x3a6a4a, gain: 1.8 }, { key: CORR, tint: 0x6a7078, gain: 1.5 }, { dado: 1.3, rail: 0xe8b820 });
    for (const j of [2, 4, 6]) for (const i of [1, 3, 5, 7]) { const [x, z] = at(i, j); K.lamp(x, z, 2.8, 0.25, COOL, { y: K.H - 1.0 }); }
    for (const s of ['l', 'r']) for (const j of [1, 3, 5]) K.sconce(s, at(0, j)[1], 3.0, COOL);
    K.wall('breaker_panel', 'l', at(0, 1)[1], 1.25); K.wall('breaker_panel', 'l', at(0, 2)[1], 1.25);
    K.wall('exit_sign', 'f', K.dlx, 2.75); K.wall('fire_extinguisher', 'f', K.dlx + 1.5, 1.0); K.wall('wall_clock', 'f', K.dlx - 2.2, 2.8);
    K.put('wet_floor_sign', at(5, 5)[0] - 1.1, at(5, 5)[1] + 1.1, 30); };
/* 7 · APARTMENT STAIR: sage walls over a dark wood dado, a red runner from the door, pendants, sconces, the brass mailbox banks (Meshy, in the
   drawn grill's place), a doormat, an umbrella stand, the residents' notice board */
IN2['P04-06-B1'] = K => { const at = K.at;
    K.liner(PAINT2(0xb8c4a0, U('PlasterWallPainted2a'), 2.0), WOODM(0x4a3020), CEIL(), { dado: 1.1 }); K.floor(U('TileGeneric5a'), 0xffffff, 3.5);
    { const x = at(4, 0)[0], z0 = at(4, 1)[1], z1 = K.D / 2 - 0.5; K.rug(x, (z0 + z1) / 2, 2.2, z1 - z0, 'carpet', 0x8a2a2a, 1.6); for (const j of [1, 2, 3]) K.pendant(x, at(4, j)[1], 2.6, 0x5a3a20); }
    K.lamp(...at(5, 0, 2), 3, 0.6); for (const j of [1, 3]) K.sconce('l', at(0, j)[1], 2.2); K.sconce('r', at(6, 2)[1], 2.2);
    K.put('doormat', K.dlx, K.D / 2 - 1.0, 0); K.put('umbrella_stand', K.dlx - 1.4, K.D / 2 - 0.6, 0);   // (the stand + the board moved out of the Antihero's room, 11-14)
    K.wall('notice_board', 'f', at(2, 3)[0], 1.2); K.wall('wall_clock', 'b', at(5, 0, 2)[0], 3.0); K.wall('exit_sign', 'f', K.dlx, 2.75);
    /* THE RESIDENTS' ROOM (11-14, bedrooms brief): the Antihero's, the front-right corner (squares 5-6, rows 2-3) walled off the stair hall,
       its doorway one square on the hall walk (square 5, row 2 -> the walk at square 4). Bed head to the right wall, wardrobe in the corner. */
    { const xw = at(4, 0)[0] + 1.75, zb = at(0, 1)[1] + 1.75; partition(K, xw, zb, xw, K.D / 2, [[zb, zb + 3.5]]); partition(K, xw, zb, K.W / 2, zb);
      bedSet(K, ...at(6, 2), 90, 'psx_bed_5_4', ...at(6, 3), 90, 1, 0x3a3a40); K.pendant(...at(5, 2), 0.7, 0x2a2a2e); } };
/* 8 · OFFICE COURT: cool grey walls over a marble dado, a grid of ceiling panels, the building directory, a globe lamp by the couch, a rug under
   the meeting table */
IN2['P07-06-B1'] = K => { const at = K.at;
    K.liner(PAINT2(0xdfe6ee), { key: U('TileMarble1a'), tint: 0xc8ccd0, gain: 1.7 }, CEIL(), { dado: 1.2, rail: 0x8a9098 });
    for (const i of [0, 2, 4]) for (const j of [1, 3]) K.lamp(...at(i, j, 2, 1), 1.4, 1.4);
    K.wall('directory_board', 'l', at(0, 2)[1], 1.0); K.wall('wall_clock', 'r', at(5, 2)[1], 2.4); K.wall('exit_sign', 'f', K.dlx, 2.45); K.wall('fire_extinguisher', 'f', K.dlx - 1.5, 1.0);
    K.put('rug_office', ...at(5, 4), 0); K.put('globe_lamp', at(0, 4)[0] - 1.2, at(0, 4)[1] - 1.25, 0); };
/* 13b · APARTMENTS A (11-14, the residents' bedrooms brief, project files disaster-city-residents/bedrooms-brief.md "Hero Plaza (H)"): the ground
   floor is a flat, 7 x 5 squares, the swing door (the plan's) in the front row at square 0. Three bedrooms across the back three rows behind plaster
   partitions on the squares' edges, each with a one-square doorway off the hall: the Sidekick's (squares 0-1, doorway 1), the Nephilim's
   (2-4, doorway 3), the Police officer's (5-6, doorway 5). Each bed and wardrobe fills a whole square
   at the back wall; bedside tables, lamps, rugs = decor off the squares' middles. The hall (rows 3-4): a sofa (square 3) and a dining table
   (square 6) on whole squares in the front row, row 3 the walk from the door, whole squares wide. Beds = PSX singles (the residents' code takes any key matching /bed|cot/). */
/* THE RESIDENTS' ROOMS (11-14): a plaster partition along a square edge (x0,z0 -> x1,z1, room metres) with its ghost, a skirting, and
   one-square doorways (`gaps`: [from, to] metres along it) under a lintel; a bed + wardrobe + bedside table + lamp + rug set. */
function partition(K, x0, z0, x1, z1, gaps, tint) { const a = K.a, H = K.H, T = 0.16, ew = Math.abs(x1 - x0) > Math.abs(z1 - z0), L0 = ew ? Math.min(x0, x1) : Math.min(z0, z1), L1 = ew ? Math.max(x0, x1) : Math.max(z0, z1), c = ew ? z0 : x0;
    const G = { gain: 2.0 };   // the painted coat's lift (K.liner's PAINT2): bare PLASTER reads near black in the city's shade
    const seg = (u0, u1, y, h) => { const m = (u0 + u1) / 2, l = u1 - u0; if (l < 0.05) return; if (ew) a.box(m, y, c, l, h, T, PLASTER_A, tint || 0xeee2cc, G); else a.box(c, y, m, T, h, l, PLASTER_A, tint || 0xeee2cc, G);
        if (y === 0) { if (ew) { a.box(m, 0, c, l, 0.14, T + 0.04, WOOD, 0x4a3020); K.ghost(m, c, l, T, H); } else { a.box(c, 0, m, T + 0.04, 0.14, l, WOOD, 0x4a3020); K.ghost(c, m, T, l, H); } } };
    let u = L0; for (const g of (gaps || []).slice().sort((p, q) => p[0] - q[0])) { seg(u, g[0], 0, H); seg(g[0], g[1], 2.3, H - 2.3); u = g[1]; } seg(u, L1, 0, H); }
function bedSet(K, bx, bz, bf, bed, wx, wz, wf, side, rugT, o) { o = o || {};
    K.prop(bed, bx, bz, (bf + 270) % 360); K.prop(o.wardrobe || 'psx_wardrobe_mp_1', wx, wz, wf);   // (the PSX bed's length runs along its own x, the headboard at +x: +270 puts the head where `bf` says, seen on screen 11-14)
    const r = bf * Math.PI / 180, hx = Math.sin(r), hz = -Math.cos(r), sx = -hz * side, sz = hx * side;   // hx/hz: toward the bed's head (the wall); sx/sz: its side
    K.put(o.table || 'psx_bedside_table_1', bx + hx * 0.75 + sx * 1.15, bz + hz * 0.75 + sz * 1.15, bf); K.put('table_lamp', bx + hx * 0.75 + sx * 1.15, bz + hz * 0.75 + sz * 1.15, bf, 0.64);
    K.rug(bx - hx * 1.9, bz - hz * 1.9, Math.abs(hx) > 0.5 ? 1.4 : 2.4, Math.abs(hx) > 0.5 ? 2.4 : 1.4, 'carpet', rugT, 1.6); }
IN['P07-04-B2'] = K => { const at = K.at, PART = 0xf2e6d0, zF = at(0, 2)[1] + 1.75;
    K.floor(WOOD, 0xb08a64, 3.5);
    K.liner(PAINT2(0xe8d8b8), WOODM(0x6a4a30), CEIL(), { dado: 0.9, rail: 0x4a3020 });
    /* the partitions: two side walls between the rooms, the bedrooms' front wall with three one-square doorways */
    for (const x of [at(1, 0)[0] + 1.75, at(4, 0)[0] + 1.75]) partition(K, x, -K.D / 2, x, zF, null, PART);
    partition(K, -K.W / 2, zF, K.W / 2, zF, [1, 3, 5].map(i => [at(i, 0)[0] - 1.75, at(i, 0)[0] + 1.75]), PART);   // a lintel over each doorway
    /* the bedrooms: [bed square, wardrobe square, bed key, rug tint, lamp tint] */
    for (const [bi, wi, bed, rugT, sh] of [[0, 1, 'psx_bed_4_2', 0x2a4a7a, 0x3a5a8a], [2, 4, 'psx_bed_5_3', 0x6a2a3a, 0x7a3a2a], [6, 5, 'psx_bed_5_1', 0x2a3a5a, 0x5a5a62]]) {
        const [bx, bz] = at(bi, 0), [wx, wz] = at(wi, 0), s = bi < wi ? 1 : -1;
        K.prop(bed, bx, bz, 270); K.prop('psx_wardrobe_mp_1', wx, wz, 0);   // (270: the head to the back wall, see bedSet)
        K.put('psx_bedside_table_1', bx + s * 1.25, bz - 1.25, 0); K.put('table_lamp', bx + s * 1.25, bz - 1.25, 0, 0.64);
        K.rug(bx, bz + 2.2, 2.4, 1.6, 'carpet', rugT, 1.6);
        K.pendant((bx + wx) / 2, at(bi, 1)[1], 0.7, sh); }
    /* the hall: a sofa facing the bedrooms, the dining table on the right, a rug and lamps down the walk */
    K.prop('psx_sofa_1', ...at(3, 4), 180); K.decor('potted_plant', 2, 4, -1, 1); K.decor('potted_plant', 6, 3, 1, -1);
    K.table(6, 4, 'psx_dinner_table_1', 'cafeteria_chair');
    K.rug(at(3, 3)[0], at(3, 3)[1] + 1.75, 10.5, 2.2, 'carpet', 0x7a5a3a, 1.5);
    for (const i of [1, 3, 5]) K.lamp(at(i, 3)[0], at(i, 3)[1] + 1.75, 1.2, 1.2, 0xfff0d0);
    K.wall('wall_clock', 'f', at(5, 4)[0], 2.2); K.put('doormat', K.dlx, K.D / 2 - 1.0, 0); K.put('umbrella_stand', K.dlx + 1.4, K.D / 2 - 0.6, 0); };
/* 9 · DELIVERY YARD: pale corrugated walls over a hazard band, cool strip lights down the walk, the pallet jack by the pallets, a hand truck, bundles
   of papers by the racks, the dispatch board */
IN2['P07-07-B1'] = K => { const at = K.at;
    K.liner({ key: CORR, tint: 0xc8ccd0, gain: 2.0 }, { key: HAZ, tint: 0xffffff, gain: 1.2 }, { key: CORR, tint: 0x7a8088, gain: 1.5 }, { dado: 0.3, rail: false });
    for (const i of [0, 3, 6]) { const [x, z] = at(i, 1, 3); K.lamp(x, z, 6.0, 0.25, COOL); } K.lamp(...at(7, 2, 2), 3, 0.3, COOL);
    { const [x, z] = at(5, 2); K.put('pallet_jack', x - 0.4, z + 0.6, 90); } { const [x, z] = at(2, 2); K.put('hand_truck', x - 1.0, z + 1.0, 20); }
    K.put('newspaper_bundles', at(2, 0)[0] + 1.1, at(2, 0)[1] - 1.0, 0); K.put('newspaper_bundles', at(5, 0)[0] - 1.1, at(5, 0)[1] - 1.0, 90);
    { const [x, z] = at(7, 2, 2); K.put('clipboard_flat', x - 0.6, z + 0.2, 0, 0.76); K.put('coffee_mug', x + 1.3, z + 0.1, 0, 0.76); K.wall('notice_board', 'f', x, 1.2); }
    K.wall('wall_clock', 'f', at(8, 2)[0] + 0.6, 2.4); K.wall('exit_sign', 'f', K.dlx, 2.45); K.wall('fire_extinguisher', 'f', K.dlx + 1.5, 1.0); };
/* 10 · TRAINING HALL: white walls over a red dado with a blue rail, a dark steel ceiling, high-bay pendants, a light frame over the ring, mirrors
   on the back wall, red + blue banners; the treadmills (Meshy), Southside's dumbbell rack + bench + heavy bags when they are in */
IN2['P06-05-B1'] = K => { const a = K.a, at = K.at;
    K.liner(PAINT2(0xeeeeea), { key: PLASTER_B, tint: 0xb83a3a, gain: 1.8 }, { key: CORR, tint: 0x5a6068, gain: 1.4 }, { dado: 1.4, rail: 0x2f5fb8 });
    for (const p of [[1, 1], [6, 1], [1, 3.5], [6, 3.5], [1, 6], [6, 6], [3.5, 6], [3.5, 1]]) { const [x, z] = at(Math.floor(p[0]), Math.floor(p[1])), ox = (p[0] % 1) * SQ, oz = (p[1] % 1) * SQ; K.pendant(x + ox, z + oz, 2.2, 0x3a3d42, 0xf4f8ff); }
    { const [x, z] = at(3, 3, 2, 2); K.lamp(x, z, 4.4, 4.4, 0xfff6e0, { y: K.H - 1.6 }); for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) a.cyl(x + c[0] * 2.1, K.H - 1.6, z + c[1] * 2.1, 0.015, 1.6, null, 0x1a1a1a, { seg: 4, roof: true }); }
    for (const i of [2, 5]) { const [x] = at(i, 0); a.box(x, 0.4, -K.D / 2 + 0.42, 3.0, 2.0, 0.04, null, 0xdfe8ee, { glow: 0.5 }); a.box(x, 0.34, -K.D / 2 + 0.41, 3.12, 2.12, 0.02, null, 0x2a2a2c); }   // the mirrors
    for (const s of [-1, 1]) for (const j of [3, 4]) { const z = at(0, j)[1], x = s * (K.W / 2 - 0.42); a.box(x, 2.6, z, 0.05, 3.4, 1.4, null, j === 3 ? 0xc8303a : 0x2f5fb8); a.box(x, 6.0, z, 0.08, 0.1, 1.6, METAL, DARK); }   // the banners
    for (const i of [1, 6]) { const [x, z] = at(i, 6); K.put('treadmill', x, z, 0); K.ghost(x, z, 1.2, 2.4, 1.4); }
    if (HAS('dumbbell_rack')) { const [x, z] = at(2, 0); K.put('dumbbell_rack', x, z, 0); K.ghost(x, z, 2.8, 1.4, 1.0); }
    if (HAS('weight_bench')) { const [x, z] = at(5, 0); K.put('weight_bench', x, z, 0); K.ghost(x, z, 2.4, 1.6, 1.2); }
    K.wall('wall_clock', 'b', at(3, 0, 2)[0], 4.2); K.wall('exit_sign', 'f', K.dlx, 2.75); K.wall('fire_extinguisher', 'f', K.dlx + 1.5, 1.0); };

/* ── build(ctx): the tool's hook, after every row exists. The plan's own row keeps the collision, the inside, the door and the walked roof with
   its outside switched off (`skin: false`); `row` says what else changes: storeys, leaf, solid (no inside), hollow + doorSide (an inside on that
   side), pack + packSide (a pack shop block; its row `w` IS its scale, kept within 0.9 to 1.15 of the block's own width), replace (smaller
   footprints), remove (walked through). Draws no random number. ── */
const PACK_W = { pack_bld_08: 15.52, pack_bld_09: 16.89 };
function build(ctx) {
    const { PLAN, features, props, bInfo, r3, C } = ctx, M = { district: 'H', B, OPEN, SWAP }; let nArch = 0;
    const R3 = v => typeof v === 'number' ? Math.round(v * 1000) / 1000 : Array.isArray(v) ? v.map(R3) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(e => [e[0], R3(e[1])])) : v;
    /* the shade lift: a sheet in the city's shade reads near black, so every textured part keeps a little of its own light */
    /* a battle-sheet key (bricks_3, aluminium, marble_light, gold ...) is drawn with its darker calm sheet in the game: `gain` 1.5 lifts it back */
    const LIFT = ps => ps.map(p => { if (!p.key || /^txt:/.test(p.key)) return p; const q = Object.assign({}, p); if (!(q.glow > 0) && !/GlassWindow/.test(q.key)) q.glow = 0.16;   /* the dark glass stays dark (mondo 19:02) */ if (!/^(urban|hq):/.test(q.key) && !(q.gain > 0)) q.gain = 1.5; return q; });
    /* the tool's back-lot infill on the plaza's north edge stood in front of the Workshop store and the pizzeria's corner: off */
    for (let i = features.length - 1; i >= 0; i--) { const f = features[i]; if (f.k === 'texbuilding' && /^dc:in\d+$/.test(f.id || '') && f.x > -42 && f.x < 0 && f.z > -45 && f.z < -38) features.splice(i, 1); }
    /* the polish pass: a building's second parts list, written after its own */
    const dress = (P, fn, door) => { if (!fn) return P; const a = sheet(); fn(a, door); return P.concat(a.P); };
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
            if (S.inside && row.k === 'plateau') {   // a roof-route tier becomes a walk-in: a hollow building in its place, its roof slab still walked at 7 m
                row = features[i] = { k: 'texbuilding', id: row.id, x: c.x, z: c.z, w: r3(b.w * C), d: r3(b.h * C), rot: 0, storeys: 2, style: 'office', seed: (row.bld && row.bld.seed != null) ? row.bld.seed : i, skin: false, hollow: true };
                turn(S.inside);
            }
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
            const dr0 = (S.remove || S.replace) ? null : doorOf(row);
            RING_COURSE = !!IN[bid];   // a walk-in's belt courses are rings (the kit's `course`)
            if (def.parts) { features.push({ k: 'arch', id: 'arch:' + bid, x: c.x, z: c.z, rot: 0, ...(row.k === 'plateau' ? { y: 0 } : {}), parts: LIFT(R3(dress(def.parts(dr0, c), DET[bid], dr0))) }); nArch++; }
            RING_COURSE = false;
            if (def.props) def.props(c).forEach(q => props.push(R3(q)));
        });
        (M.OPEN || []).forEach(o => {
            features.push({ k: 'arch', id: 'arch:' + M.district + ':' + o.id, x: o.x, z: o.z, rot: 0, parts: LIFT(R3(dress(o.parts(), DET_OPEN[o.id.replace(/\d+$/, '')], null))) }); nArch++;
            (o.walls || []).forEach((q, n) => features.push({ k: 'texbuilding', id: 'dc:' + M.district + ':' + o.id + '-w' + n, x: r3(o.x + q[0]), z: r3(o.z + q[1]), w: q[2], d: q[3], rot: 0, storeys: 3, seed: 1, skin: false }));
        });
        /* THE INSIDES: one arch row, the room's props and its ghost walls per walk-in building, in the room's own frame */
        Object.keys(IN).forEach(bid => {
            const row = features.find(r => r.id === 'dc:' + bid); if (!row || row.k !== 'texbuilding' || !row.hollow) { console.warn('H: no walk-in row for the inside of', bid); return; }
            const K = insideKit(row); IN[bid](K); if (IN2[bid]) IN2[bid](K);
            features.push({ k: 'arch', id: 'arch:' + bid + ':in', x: row.x, z: row.z, rot: row.rot || 0, parts: LIFT(R3(K.a.P)).map(p => (p.glow < 0.3 ? Object.assign(p, { glow: 0.3 }) : p)) }); nArch++;
            K.props.forEach(q => props.push(R3(q))); K.ghosts.forEach(g => features.push(R3(g)));
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
/* THE TOWER (the story door into site_prebuilt_downtown_lobby and the rooms past it) moves off the plaza doorway onto the lift bank of the walk-in
   lobby: square (4, 0) of a room at rot 180 → room metres x 21 − 1.75, z −63 + 10.6 (the lift core's face), facing the lobby (mondo 22:30). */
const joins = { tower: { x: 19.25, z: -52.45, face: 0, sub: 'THE LIFTS · INTO THE TOWER' } };
module.exports = { build, joins };
