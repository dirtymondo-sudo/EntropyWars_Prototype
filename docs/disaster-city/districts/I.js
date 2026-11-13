/* docs/disaster-city/districts/I.js — THE INDUSTRIAL DISTRICT (2026-11-13, the Industrial thread; mondo: "architect the buildings ... every building should be unique and purposeful and
   recognizable"): every building of plots x 0-3, y 8-11 as an `arch` row (areas-complexes.md THE ARCHITECTURE ROW) written in the building's FRONT
   FRAME (front = +z, x along the front; the row's `rot` is its texbuilding's), its collision the row the tool already wrote with `skin: false`:
   a walk-in keeps `hollow` (the city door hangs in the doorway), an outside-only building is a solid texbuilding, a roof-route tier stays a
   plateau (the two walk-in tiers, Freight gate + Loading office, become hollow texbuildings: two storeys = the same 7 m walked roof slab).
   Run by bake-disaster-city.js (THE DISTRICT FILES: `build(ctx)`, after every row exists). Everything here touches Industrial rows only. Notes: areas-complexes.md "DISASTER CITY, THE INDUSTRIAL DISTRICT". */
'use strict';
/* THE DEEPER HANGAR (mondo 11-13 21:21 "make hangar deeper so it fits"): the plan's hangar is two squares deep; the F22 is 10.6 m across, so the
   hangar takes the walk square in front of it too (column 8 of P03-10): four squares deep with the tool's own growth, its door one square west. */
exports.tailor = function (PLAN, plotOf) {
    const p = plotOf['P03-10'], b = p && p.buildings.find(v => v.id === 'P03-10-B1'); if (!b || b.x !== 9) return;
    b.x = 8; b.w = 3; b.doors.forEach(d => { d.x = 8; d.ox = 7; });
    p.cells = p.cells.map((row, y) => { if (y < 1 || y > 8) return row; const a = row.split(''); a[8] = y === 5 ? 'D' : 'I'; if (y === 5) a[9] = 'I'; return a.join(''); });
};
exports.build = function (ctx) {
    const { plotOf, features, props, bInfo, lateRows, gx, gc, r3, take, cellAt, C, N } = ctx;
    const pid = (x, y) => 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0');
    const DECOR = new Set(['city_bench', 'park_bench', 'city_bin', 'signpost', 'fire_hydrant', 'traffic_cone', 'cardboard_boxes', 'psx_planter_pot_mp_1_full', 'round_table', 'pool_umbrella', 'vending_machine', 'barrel']);
    const U = k => 'urban:' + k, ROT = { S: 0, W: 90, N: 180, E: 270 }, E = 0.05;
    const T = { red: 0xb5523f, brick: 0xa85a44, dbrick: 0x8a4636, yellow: 0xf2c230, cream: 0xe9dfc4, white: 0xf2f0ea, dark: 0x3a3d42, slate: 0x56616c, teal: 0x4f9a94, copper: 0x5f9e8f,
        ochre: 0xd9a441, sage: 0x9db28a, dblue: 0x7f9bb8, pink: 0xc98674, orange: 0xe07b39, mustard: 0xc9a13a, silver: 0xd5d8dc, steel: 0x8f9aa5, conc: 0xc9c2b0, black: 0x15171a, glass: 0xcfe6f0 };
    const ROOF = U('ConcreteUnderTiles1'), TIN = U('MetalCorrugatedPainted1a'), PLAIN = U('PlasterWallPainted1a'), TRUSS = U('MetalTruss1a'), GRILL = U('MetalSubwayGrill1a');
    const box = (x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'box', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)], key, tint }, o || {});
    const cyl = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'cyl', p: [r3(x), r3(y), r3(z)], r, h, key, tint }, o || {});
    const dome = (x, y, z, r, h, key, tint, o) => Object.assign({ s: 'dome', p: [r3(x), r3(y), r3(z)], r, h, key, tint }, o || {});
    const roof = (form, x, y, z, w, h, d, key, tint, o) => Object.assign({ s: 'roof', form, p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)], key, tint, roof: true }, o || {});
    const truss = (x, y, z, w, h, d, tint) => box(x, y, z, w, h, d, TRUSS, tint, { kind: 'over', ds: true });
    const bay = (x, z, w, h) => [box(x, 0, z, w + 0.5, h + 0.3, 0.1, PLAIN, T.dark), box(x, 0, z + 0.04, w, h, 0.1, TIN, 0xe2e4e6)];   // a roller door: a light ribbed panel in a dark frame, on the front
    const bayX = (x, z, w, h) => [box(x, 0, z, 0.1, h + 0.3, w + 0.5, PLAIN, T.dark), box(x + Math.sign(x) * 0.04, 0, z, 0.1, h, w, TIN, 0xe2e4e6)];   // … on a side wall
    const vents = (x, y, z, n, dx) => box(x, y, z, 2, 1.2, 2, GRILL, 0xffffff, { n, step: [dx, 0, 0], keyTop: PLAIN, tintTop: T.steel, roof: true });
    /* the body: a solid box (keyTop the roof), or for a walk-in the three blind walls, the front with its doorway cut, and the roof slab */
    const body = (c, h, key, tint, o) => {
        o = o || {}; const w = c.fw + 2 * E, d = c.fd + 2 * E;
        if (!c.door) return [box(0, 0, 0, w, h, d, key, tint, { keyTop: o.top || ROOF, tintTop: o.topTint || 0x9a9da0, uv: o.uv })];
        return [box(0, 0, 0, w, h, d, key, tint, { faces: 'blr', top: false, uv: o.uv }), { s: 'quad', p: [0, 0, r3(d / 2)], size: [r3(w), h], key, tint, uv: o.uv, hole: [r3(c.door.lx), r3(c.door.cw), 2.2] },
            box(0, h, 0, w, 0.12, d, o.top || ROOF, o.topTint || 0x9a9da0, { roof: true })];
    };
    const CT = [0x4c78c9, 0xc0522d, 0x4f8f55, 0xe0b02e, 0xd9d9d9, 0x8a3d6b, 0x2f8f9a];
    const house = (tint, hipped) => c => {
        const long = c.fd > c.fw, o = [...body(c, 6.6, U('PlasterWallStucco1a'), tint)];
        o.push(hipped ? roof('hip', 0, 6.6, 0, c.fw + 1, 3, c.fd + 1, U('MetalCorrugatedPainted3a'), 0xffffff) : roof('gable', 0, 6.6, 0, (long ? c.fd : c.fw) + 1, 3, (long ? c.fw : c.fd) + 1, U('MetalCorrugatedPainted3a'), 0xffffff, { ry: long ? 90 : 0, keyEnd: U('PlasterWallStucco1a'), tintEnd: tint }));
        const nd = Math.max(2, Math.floor(c.fw / 5.5)), sx = c.fw / nd;
        o.push(box(-c.fw / 2 + sx / 2, 0, c.fd / 2 + 0.1, 1, 2.05, 0.1, U('DoorWoodenHalf1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: nd, step: [sx, 0, 0] }));
        o.push(box(-c.fw / 2 + sx / 2, 0, c.fd / 2 + 0.6, 1.8, 0.3, 1.1, U('ConcreteStriped2a'), 0xdddddd, { n: nd, step: [sx, 0, 0] }));
        [1.0, 4.3].forEach(y => o.push(box(-c.fw / 2 + sx / 2 + (y < 2 ? 1.9 : 0), y, c.fd / 2 + 0.1, 1.75, 1.75, 0.1, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: y < 2 && sx < 4.4 ? 0 : nd, step: [sx, 0, 0] })));
        o.push(box(long ? 1.5 : -c.fw / 3.4, 7.4, long ? -c.fd / 3.4 : 1.5, 0.9, 3, 0.9, 'bricks_3', T.brick, { n: 3, step: long ? [0, 0, c.fd / 3.4] : [c.fw / 3.4, 0, 0], roof: true }));
        return o.filter(q => q.n !== 0);
    };
    /* name → { inside, st (storeys of the collision row), leaf, fit (c → a smaller collision row in the front frame: [x, z, w, d]), parts(c) }; c = { fw, fd, door, b } */
    const DESIGN = {
        'P00-08-B1': { inside: true, st: 2, leaf: 'leaf_security', parts: c => [   // FREIGHT GATE: the weigh hall, a hazard parapet, the truck gantry on its second door's side, a round control cab
            ...body(c, 7, U('ConcreteStriped2a'), T.conc),
            box(0, 6.2, c.fd / 2 + 0.2, c.fw + 0.9, 0.8, 0.3, PLAIN, T.yellow), box(0, 6.2, -c.fd / 2 - 0.2, c.fw + 0.9, 0.8, 0.3, PLAIN, T.yellow),
            box(c.fw / 2 + 0.2, 6.2, 0, 0.3, 0.8, c.fd + 0.9, PLAIN, T.yellow), box(-c.fw / 2 - 0.2, 6.2, 0, 0.3, 0.8, c.fd + 0.9, PLAIN, T.yellow),
            ...[-7, 0, 7].flatMap(z => bayX(-c.fw / 2 - 0.1, z, 4.6, 4.4)),
            truss(-c.fw / 2 - 3.5, 0, -9, 1.3, 10, 1.3, T.yellow), truss(-c.fw / 2 - 3.5, 0, 9, 1.3, 10, 1.3, T.yellow), truss(-c.fw / 2 - 3.5, 9, 0, 1.6, 1.6, 19.6, T.yellow),
            box(-c.fw / 2 - 3.5, 10.6, 0, 0.3, 2.2, 12, PLAIN, T.dark),
            cyl(-10, 7.1, 10, 3.4, 3, U('GlassWindowSquare1a'), 0xffffff, { roof: true }), cyl(-10, 10.1, 10, 4.3, 1.3, TIN, T.dark, { r2: 0.05, roof: true }), cyl(-10, 11.4, 10, 0.12, 5, PLAIN, T.red, { roof: true }),
            vents(6, 7.12, -6, 2, 5)] },
        'P01-08-B1': { st: 2, parts: c => [   // WAREHOUSE: red tin, a dock canopy over two bay doors, roof vents
            box(0, 0, 0, c.fw + 0.1, 6.4, c.fd + 0.1, U('MetalCorrugatedPainted2a'), 0xffffff, { top: false }), box(0, 6.4, 0, c.fw + 0.6, 0.6, c.fd + 0.6, U('ConcreteStriped2a'), 0xdddddd, { top: false }),
            box(0, 3.9, c.fd / 2 + 1.7, c.fw - 1, 0.3, 3.4, TIN, T.silver, { under: true }), box(-c.fw / 2 + 1, 0, c.fd / 2 + 3.2, 0.25, 3.9, 0.25, PLAIN, T.dark, { n: 2, step: [c.fw - 2, 0, 0] }),
            ...bay(-4.4, c.fd / 2 + 0.1, 4.6, 3.5), ...bay(4.4, c.fd / 2 + 0.1, 4.6, 3.5), vents(-5, 7.05, -3, 3, 5)] },
        'P01-08-B2': { st: 2, parts: c => [   // CANTEEN: a cream ground floor, the blue tin upper floor jutting over the door
            box(0, 0, 0, c.fw + 0.1, 3.5, c.fd + 0.1, PLAIN, T.cream, { top: false }), box(0, 3.5, 0.65, c.fw + 0.1, 3.5, c.fd + 1.4, U('MetalCorrugatedPainted5a'), 0xffffff, { top: false, under: true, keyUnder: PLAIN }),
            box(0, 0.5, c.fd / 2 + 0.1, 9, 2.2, 0.1, U('GlassWindowSquare1a'), 0xffffff), box(0, 4.2, c.fd / 2 + 1.4, 8, 1.1, 0.12, PLAIN, T.red)] },
        'P01-08-B3': { st: 2, parts: c => [   // WELDING SHOP: a green lean-to, one big bay
            ...body(c, 4.2, U('MetalCorrugatedPainted4a'), 0xffffff, { top: TIN }), roof('shed', 0, 4.2, 0, c.fw + 0.7, 2.4, c.fd + 0.7, TIN, T.steel, { keyEnd: U('MetalCorrugatedPainted4a') }), ...bay(0, c.fd / 2 + 0.1, 5, 3.6)] },
        'P02-08-B1': { inside: true, st: 3, leaf: 'leaf_security', parts: c => {   // POWER STATION: a brick turbine hall under a barrel roof, the boiler house and two striped stacks on its back half
            const o = [...body(c, 10.5, 'bricks_3', T.brick), roof('barrel', 0, 10.6, c.fd / 2 - 9, c.fw + 0.7, 5, 18.6, TIN, T.slate, { keyEnd: 'bricks_3', tintEnd: T.brick }),
                box(-8, 3.2, c.fd / 2 + 0.1, 9, 4.6, 0.1, U('GlassWindowFactory1a'), T.glass), box(8.4, 3.2, c.fd / 2 + 0.1, 9, 4.6, 0.1, U('GlassWindowFactory1a'), T.glass),
                box(8, 10.6, -c.fd / 2 + 5, 11.5, 5, 9.4, U('ConcreteStriped1a'), 0xb9b1a2, { roof: true, keyTop: ROOF }), box(8, 15.6, -c.fd / 2 + 5, 12.1, 0.5, 10, U('ConcreteStriped2a'), T.dark, { roof: true })];
            [-3.5, -10].forEach(x => { o.push(cyl(x, 10.6, -c.fd / 2 + 5, 2.3, 2.4, U('ConcreteStriped2a'), 0xbbbbbb, { roof: true })); for (let i = 0; i < 6; i++) o.push(cyl(x, 13 + i * 4, -c.fd / 2 + 5, 1.7 - i * 0.07, 4, PLAIN, i % 2 ? 0xf0f0f0 : T.red, { r2: 1.63 - i * 0.07, roof: true, cap: i === 5 })); });
            return o; } },
        'P03-08-B1': { inside: true, st: 2, leaf: 'leaf_exit', parts: c => [   // MACHINE SHOP: three long sawteeth, their glass to the road, bay doors
            ...body(c, 7, PLAIN, 0x8a5a44, { top: TIN }), roof('shed', 0, 7.1, -3.5, c.fw + 0.4, 2.4, 3.5, TIN, T.steel, { ry: 180, n: 3, step: [0, 0, 3.5], keyEnd: PLAIN, tintEnd: 0x8a5a44 }),
            box(0, 7.15, -1.72, c.fw - 0.6, 2.1, 0.08, U('GlassWindowFactory3a'), T.glass, { n: 3, step: [0, 0, 3.5], roof: true, faces: 'f', top: false }),
            ...[-11, -5, 9.5].flatMap(x => bay(x, c.fd / 2 + 0.1, 4.6, 4.2))] },
        'P03-08-B2': { st: 1, parts: c => [   // LUNCH COUNTER: an orange walk-up counter under a wide flat roof
            box(0, 0, 0, c.fw + 0.1, 3.1, c.fd + 0.1, U('PlasterWallStucco1a'), T.orange, { top: false }), box(0, 3.1, 1, c.fw + 1.4, 0.35, c.fd + 3, PLAIN, T.white, { under: true }),
            box(0, 1.1, c.fd / 2 + 0.1, 9, 1.3, 0.1, U('GlassWindowSquare1a'), 0xffffff), box(0, 0.95, c.fd / 2 + 0.35, 9.6, 0.15, 0.6, PLAIN, T.white), box(0, 3.45, 0, 8, 1.6, 0.3, PLAIN, T.red)] },
        'P00-09-B1': { st: 2, parts: c => {   // CONTAINER COURT: a depot of stacked shipping containers, three high (the roof walked)
            const o = [], nx = Math.round(c.fw / 6.125), nz = Math.round(c.fd / 2.625), lx = c.fw / nx, lz = c.fd / nz; let s = 7;
            for (let l = 0; l < 3; l++) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { s = (s * 73 + 17) % 101;
                o.push(box(-c.fw / 2 + lx * (i + 0.5), l * 2.333, -c.fd / 2 + lz * (j + 0.5), lx - 0.06 + (i === 0 || i === nx - 1 ? 0.1 : 0), 2.3, lz - 0.06 + (j === 0 || j === nz - 1 ? 0.1 : 0), TIN, CT[s % CT.length], { top: l === 2, uv: [1.75, 2.3] })); }
            return o; } },
        'P00-09-B2': { st: 2, parts: house(T.ochre) }, 'P02-09-B2': { st: 2, parts: house(T.sage, true) }, 'P00-10-B2': { st: 2, parts: house(T.dblue) }, 'P01-11-B2': { st: 2, parts: house(T.pink) },
        'P01-09-B1': { inside: true, st: 2, parts: c => {   // LOADING OFFICE: a white upper floor cantilevered over a dark base, ribbon windows, a mast (the roof walked)
            const R = c.fw / 2 + 1.5, o = [...body(c, 3.5, ROOF, 0xcccccc, { top: PLAIN, topTint: T.white })];
            o.push(box(0, 3.5, R - 0.8, 2 * R, 3.5, 1.6, PLAIN, T.white, { under: true, top: false }), box(0, 3.5, -R + 0.8, 2 * R, 3.5, 1.6, PLAIN, T.white, { under: true, top: false }),
                box(R - 0.8, 3.5, 0, 1.6, 3.5, 2 * R - 3.2, PLAIN, T.white, { under: true, top: false }), box(-R + 0.8, 3.5, 0, 1.6, 3.5, 2 * R - 3.2, PLAIN, T.white, { under: true, top: false }),
                box(0, 7, 0, 2 * R, 0.12, 2 * R, ROOF, 0x9a9da0, { roof: true }),
                box(0, 4.3, R + 0.05, 2 * R - 2, 1.7, 0.1, U('GlassWindowSquare1a'), 0xffffff), box(0, 4.3, -R - 0.05, 2 * R - 2, 1.7, 0.1, U('GlassWindowSquare1a'), 0xffffff),
                box(R + 0.05, 4.3, 0, 0.1, 1.7, 2 * R - 2, U('GlassWindowSquare1a'), 0xffffff), box(-R - 0.05, 4.3, 0, 0.1, 1.7, 2 * R - 2, U('GlassWindowSquare1a'), 0xffffff),
                box(-R + 0.5, 0, R - 0.5, 0.7, 3.5, 0.7, U('ConcreteStriped2a'), 0xeeeeee, { n: 2, step: [2 * R - 1, 0, 0] }), box(-R + 0.5, 0, -R + 0.5, 0.7, 3.5, 0.7, U('ConcreteStriped2a'), 0xeeeeee, { n: 2, step: [2 * R - 1, 0, 0] }),
                box(8, 7.12, -8, 6, 3, 6, U('ConcreteStriped2a'), 0xdddddd, { roof: true, keyTop: ROOF }), cyl(8, 10.1, -8, 0.18, 10, PLAIN, T.red, { roof: true }), truss(-6, 7.1, R - 1, 12, 2.6, 0.3, T.dark));
            return o; } },
        'P02-09-B1': { st: 1, parts: c => {   // TRANSFORMER YARD: the control house, three transformers behind a wall, two pylons (locked: no inside)
            const o = [box(0, 0, c.fd / 2, c.fw + 0.1, 1.5, 0.25, U('ConcreteStriped2a'), 0xcfcfcf), box(0, 0, -c.fd / 2, c.fw + 0.1, 1.5, 0.25, U('ConcreteStriped2a'), 0xcfcfcf),
                box(c.fw / 2, 0, 0, 0.25, 1.5, c.fd, U('ConcreteStriped2a'), 0xcfcfcf), box(-c.fw / 2, 0, 0, 0.25, 1.5, c.fd, U('ConcreteStriped2a'), 0xcfcfcf),
                box(0, 0, 0, c.fw, 0.06, c.fd, ROOF, 0x8d9094, { sides: false }),
                box(-c.fw / 2 + 4, 0, 0, 7.6, 4, c.fd - 1, U('ConcreteStriped1a'), 0xcfc8b8, { top: false }), box(-c.fw / 2 + 4, 4, 0, 8.8, 0.4, c.fd + 0.2, U('ConcreteStriped2a'), T.dark),
                box(-3.5, 0.25, c.fd / 2 + 0.15, 1.1, 1.1, 0.06, U('SignHazard1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: 3, step: [5, 0, 0] }),
                box(-1.5, 0, 0, 2.6, 3, 5, PLAIN, 0x6f8f7a, { n: 3, step: [4.5, 0, 0] }), box(-1.5, 3, 0, 2.9, 0.25, 5.3, PLAIN, T.dark, { n: 3, step: [4.5, 0, 0] })];
            [-1.5, 0, 1.5].forEach(z => o.push(cyl(-1.5, 3.25, z, 0.25, 1.3, PLAIN, 0xe6e6e6, { n: 3, step: [4.5, 0, 0], seg: 8 })));
            [-3, 3].forEach(z => o.push(truss(c.fw / 2 - 1.2, 0, z, 1, 13, 1, T.steel), truss(c.fw / 2 - 1.2, 10.5, z, 0.5, 0.5, 5, T.steel), truss(c.fw / 2 - 1.2, 12.4, z, 0.5, 0.5, 3.4, T.steel)));
            return o; } },
        'P03-09-B1': { inside: true, st: 2, parts: c => [   // AEROSPACE LAB: a white lab under a curved roof, a radar dome on one end, a dish on the other
            ...body(c, 7, PLAIN, T.white, { top: PLAIN, topTint: T.silver }), box(0, 3.3, 0, c.fw + 0.3, 0.5, c.fd + 0.3, PLAIN, T.dblue, { top: false }),
            roof('barrel', -4.5, 7.1, 0, c.fw - 9, 2.6, c.fd + 0.4, TIN, T.silver, { keyEnd: PLAIN, tintEnd: T.white }),
            cyl(c.fw / 2 - 4.6, 7.1, 0, 4.3, 1.6, PLAIN, T.white, { roof: true, seg: 24 }), dome(c.fw / 2 - 4.6, 8.7, 0, 4.3, 4.3, PLAIN, 0xfafafa, { roof: true, seg: 24 }),
            box(7.5, 1.2, c.fd / 2 + 0.1, 12, 4.6, 0.1, U('GlassWindowTall1a'), 0xdff3ff),
            cyl(-c.fw / 2 + 2.2, 9.6, 0, 0.2, 1.6, PLAIN, T.dark, { roof: true, seg: 8 }), cyl(-c.fw / 2 + 2.2, 11.2, 0, 0.2, 0.9, PLAIN, 0xf4f4f4, { r2: 2.1, roof: true, ds: true, cap: false })] },
        'P03-09-B2': { st: 1, parts: c => [   // CHECKPOINT: a glass guard booth under a floating roof, a barrier
            box(0, 0, -3, 5, 3, 7, U('GlassWindowSquare1a'), 0xffffff, { top: false }), box(0, 0, -3, 5.2, 0.9, 7.2, PLAIN, T.dark, { top: false }),
            box(0, 3, 0, c.fw + 1.5, 0.35, c.fd + 0.5, PLAIN, T.dark, { under: true, keyUnder: PLAIN }), box(-c.fw / 2 + 0.6, 0, c.fd / 2 - 0.6, 0.5, 3, 0.5, PLAIN, T.yellow, { n: 2, step: [c.fw - 1.2, 0, 0] }),
            box(0, 1, c.fd / 2 + 0.6, c.fw - 1, 0.18, 0.18, PLAIN, T.red), box(0, 0, 0, c.fw, 0.06, c.fd, U('ConcreteStriped2a'), 0xbdbdbd, { sides: false })] },
        'P00-10-B1': { inside: true, st: 2, leaf: 'leaf_office', parts: c => {   // PORT OFFICE: dark brick, a slate hip roof, the lookout tower with a copper cap, a balcony
            const tx = c.fw / 2 - 4.4;
            return [...body(c, 7, 'bricks_3', T.dbrick), roof('hip', -4.4, 7.1, 0, c.fw - 8, 2.8, c.fd + 1, TIN, T.slate),
                box(tx, 7.1, 0, 7.6, 3.6, 7.6, 'bricks_3', T.dbrick, { roof: true, top: false }), box(tx, 10.7, 0, 8.6, 0.4, 8.6, U('ConcreteStriped2a'), 0xe8e8e8, { roof: true, under: true }),
                box(tx, 11.1, 0, 6.8, 2.3, 6.8, U('GlassWindowTall1a'), 0xffffff, { roof: true, top: false }), roof('pyramid', tx, 13.4, 0, 8.8, 4, 8.8, PLAIN, T.copper), cyl(tx, 17.4, 0, 0.1, 3, PLAIN, T.dark, { roof: true, seg: 6 }),
                box(-5, 3.5, c.fd / 2 + 0.85, 12, 0.3, 1.6, U('ConcreteStriped2a'), 0xe8e8e8, { under: true }), truss(-5, 3.8, c.fd / 2 + 1.6, 12, 1, 0.1, T.dark),
                box(-5, 4.3, c.fd / 2 + 0.1, 1.75, 1.75, 0.1, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: 4, step: [3.2, 0, 0] })]; } },
        'P01-10-B1': { st: 2, parts: c => [   // CARGO SHEDS: twin green gabled sheds, open fronts
            box(-c.fw / 4, 0, 0, c.fw / 2 - 0.1, 4.4, c.fd + 0.1, U('MetalCorrugatedPainted4a'), 0xffffff, { top: false, n: 2, step: [c.fw / 2, 0, 0] }),
            roof('gable', -c.fw / 4, 4.4, 0, c.fd + 0.9, 2.2, c.fw / 2 + 0.3, TIN, T.steel, { ry: 90, n: 2, step: [c.fw / 2, 0, 0], keyEnd: U('MetalCorrugatedPainted4a') }),
            box(-c.fw / 4, 0, c.fd / 2 + 0.1, c.fw / 2 - 1.6, 3.6, 0.1, PLAIN, T.black, { n: 2, step: [c.fw / 2, 0, 0] })] },
        'P01-10-B2': { st: 2, parts: c => [   // HARDWARE STORE: a mustard false front with a stepped parapet and a tin awning
            ...body(c, 4.2, U('PlasterWallStucco1a'), T.mustard), box(0, 4.2, c.fd / 2 - 0.2, c.fw + 0.1, 1.4, 0.5, U('PlasterWallStucco1a'), T.mustard), box(0, 5.6, c.fd / 2 - 0.2, c.fw / 2, 1, 0.5, U('PlasterWallStucco1a'), T.mustard),
            roof('shed', 0, 2.8, c.fd / 2 + 1.25, c.fw - 2, 0.9, 2.4, U('MetalCorrugatedPainted2a'), 0xffffff, { roof: false, under: true }), box(0, 0.6, c.fd / 2 + 0.1, c.fw - 6, 2, 0.1, U('GlassWindowSquare1a'), 0xffffff)] },
        'P01-10-B3': { st: 2, parts: c => [   // FORKLIFT REPAIR: a silver half-round hut, its bay in the end wall
            roof('barrel', 0, 0, 0, c.fd + 0.1, 5.6, c.fw + 0.1, TIN, T.silver, { ry: 90, roof: false, keyEnd: TIN, tintEnd: 0xb9bdc2, seg: 14 }), ...bay(0, c.fd / 2 + 0.1, 4.6, 3.8)] },
        'P02-10-B1': { inside: true, st: 2, leaf: 'leaf_exit', parts: c => [   // MAINTENANCE DEPOT: five roller-door bays, a raised glass monitor roof
            ...body(c, 7, U('MetalCorrugatedPainted5a'), 0xffffff), box(0, 7, 0, c.fw + 0.7, 0.4, c.fd + 0.7, U('ConcreteStriped2a'), 0xdddddd, { top: false, roof: true }),
            box(0, 7.4, 0, c.fw - 1, 2, 8, U('GlassWindowFactory3a'), T.glass, { roof: true, top: false }), roof('gable', 0, 9.4, 0, c.fw, 1.3, 9, TIN, T.steel, { keyEnd: TIN }),
            ...[-11.6, -7.1, -2.6, 4.3, 8.9].flatMap(x => bay(x, c.fd / 2 + 0.1, 3.9, 4)), box(0, 4.7, c.fd / 2 + 0.35, c.fw - 1, 0.3, 0.6, PLAIN, T.yellow)] },
        'P03-10-B1': { inside: true, st: 2, leaf: 'leaf_exit', parts: c => [   // HANGAR: a long arched hangar, its open end to the apron (7 m walls: the F22 inside stands 5 m)
            ...body(c, 7, TIN, T.silver, { top: TIN }), roof('barrel', 0, 7.1, 0, c.fw + 0.2, 4.2, c.fd + 0.2, TIN, 0xe6e8ea, { keyEnd: TIN, tintEnd: T.silver, seg: 14 }),
            box(c.fw / 2 + 0.1, 0, 0, 0.1, 6, 11, PLAIN, T.black), box(c.fw / 2 + 0.16, 6.2, 0, 0.1, 0.7, 6, PLAIN, T.red)] },
        'P03-10-B2': { st: 1, parts: c => [   // CONTROL TOWER: a low base, a slim shaft, the overhanging glass cab, a red cone
            box(0, 0, 0, c.fw + 0.1, 3.5, c.fd + 0.1, U('ConcreteStriped1a'), 0xcfc8b8, { top: false }), box(0, 3.5, 0, c.fw + 0.7, 0.35, c.fd + 0.7, U('ConcreteStriped2a'), T.dark),
            cyl(c.fw / 2 - 4.5, 3.85, 0, 1.9, 12, U('ConcreteStriped2a'), 0xe2e2e2), cyl(c.fw / 2 - 4.5, 15.85, 0, 2.7, 0.5, U('ConcreteStriped2a'), T.dark),
            cyl(c.fw / 2 - 4.5, 16.35, 0, 3.3, 2.8, U('GlassWindowSquare1a'), 0xffffff, { seg: 20 }), cyl(c.fw / 2 - 4.5, 19.15, 0, 3.9, 1.3, TIN, T.red, { r2: 0.05, seg: 20 }), cyl(c.fw / 2 - 4.5, 20.4, 0, 0.1, 4, PLAIN, T.dark, { seg: 6 })] },
        'P01-11-B1': { inside: true, st: 2, fit: c => [c.fw / 2 - 7, 0, 14, c.fd], extra: c => [[-c.fw / 2 + 5.25, 0, 10.5, c.fd, 2]],   // WATER WORKS: a brick pump house with a lantern roof; two domed tanks beside it (their own solid row)
            parts: (c, C0) => { const tx = -C0.fw / 2 + 5.25 - c.ox; return [
                ...body(c, 7, 'bricks_3', T.brick), roof('hip', 0, 7.1, 0, c.fw + 1, 3.4, c.fd + 1, TIN, T.slate), box(0, 9.1, 0, 4, 1.7, 5, U('GlassWindowFactory3a'), T.glass, { roof: true, top: false }), roof('hip', 0, 10.8, 0, 4.8, 1.2, 5.8, TIN, T.slate),
                box(c.door.lx > 0 ? -2.5 : 2.5, 1.5, c.fd / 2 + 0.1, 7, 4.6, 0.1, U('GlassWindowTall1a'), 0xffffff),
                ...[-4.4, 4.4].flatMap(z => [cyl(tx, 0, z, 3.9, 0.6, U('ConcreteStriped2a'), 0xbbbbbb, { seg: 20 }), cyl(tx, 0.6, z, 3.6, 7.6, TIN, T.teal, { seg: 20, cap: false }), dome(tx, 8.2, z, 3.6, 1.7, PLAIN, T.teal, { seg: 20 })]),
                box((c.fw / 2 * -1 + tx + 3.6) / 2 - 0.2, 2, 0, Math.abs(-c.fw / 2 - tx - 3.6) + 0.6, 0.7, 0.7, PLAIN, T.teal)]; } },
        'P02-11-B1': { inside: true, st: 1, leaf: 'none', parts: c => [   // PUMP COURT: a square valve house (the way down to the sewers), a round pump drum under a teal cone on it
            ...body(c, 3.5, U('ConcreteStriped1a'), 0xd6cfbf), box(0, 3.6, 0, c.fw + 0.6, 0.35, c.fd + 0.6, U('ConcreteStriped2a'), T.dark, { roof: true }),
            cyl(0, 3.95, 0, 4.9, 3.6, U('ConcreteStriped1a'), 0xd6cfbf, { roof: true, seg: 24 }), cyl(0, 7.55, 0, 5.7, 3.2, TIN, T.teal, { r2: 1, roof: true, seg: 24 }),
            cyl(0, 10.75, 0, 1, 1.2, U('GlassWindowFactory3a'), 0xffffff, { roof: true }), cyl(0, 11.95, 0, 1.4, 1, TIN, T.teal, { r2: 0.05, roof: true }),
            box(c.fw / 2 + 0.5, 0.4, -3, 0.8, 0.8, 7, PLAIN, T.teal), box(c.fw / 2 + 0.5, 0.4, 3.5, 0.8, 0.8, 5, PLAIN, T.teal)] },
        'P02-11-B2': { st: 2, parts: c => [   // CORNER STORE: a white shopfront, a teal upper floor with a bay window, a red awning
            box(0, 0, 0, c.fw + 0.1, 3.6, c.fd + 0.1, PLAIN, T.white, { top: false }), box(0, 3.6, 0, c.fw + 0.1, 3.2, c.fd + 0.1, U('PlasterWallStucco1a'), T.teal, { top: false }),
            box(0, 6.8, 0, c.fw + 0.7, 0.35, c.fd + 0.7, U('ConcreteStriped2a'), 0xeeeeee, { keyTop: ROOF, tintTop: 0x9a9da0 }), box(0, 3.9, c.fd / 2 + 0.6, 5, 2.4, 1.2, U('GlassWindowSquare1a'), 0xffffff, { under: true }),
            box(0, 0.5, c.fd / 2 + 0.1, c.fw - 3, 2.1, 0.1, U('GlassWindowSquare1a'), 0xffffff), roof('shed', 0, 2.75, c.fd / 2 + 1.05, c.fw - 1, 0.8, 2, U('MetalCorrugatedPainted2a'), 0xffffff, { roof: false, under: true })] },
        'P02-11-B3': { st: 2, parts: c => [   // BOAT REPAIR: a brown lean-to with an open bay
            box(0, 0, 0, c.fw + 0.1, 4.6, c.fd + 0.1, U('MetalCorrugatedPainted3a'), 0xffffff, { top: false }), roof('shed', 0, 4.6, 0, c.fw + 0.7, 2.4, c.fd + 0.7, TIN, T.steel, { keyEnd: U('MetalCorrugatedPainted3a') }),
            box(0, 0, c.fd / 2 + 0.1, 6.5, 3.8, 0.1, PLAIN, T.black)] },
        'P03-11-B1': { inside: true, st: 2, leaf: 'leaf_shabby_wood', fit: c => [-c.fw / 2 + 6.5, c.fd / 2 - 4.25, 13, 8.5],   // RAIL SERVICE: a signal box (brick base, a glazed upper floor jutting out, a big-eaved gable), a water tower in its yard
            parts: (c, C0) => { const wx = C0.fw / 2 - 3 - c.ox, wz = -C0.fd / 2 + 3.5 - c.oz; return [
                ...body(c, 3.5, 'bricks_3', T.brick, { top: PLAIN }), box(0, 3.5, 0, c.fw + 1.4, 3, c.fd + 1.4, U('GlassWindowSquare1a'), 0xffffff, { top: false, under: true, keyUnder: PLAIN }),
                roof('gable', 0, 6.5, 0, c.fw + 2.8, 2.4, c.fd + 2.8, U('MetalCorrugatedPainted2a'), 0xffffff, { keyEnd: PLAIN, tintEnd: T.cream }),
                box(0, 3.3, c.fd / 2 + 1.7, c.fw, 0.2, 2.2, TIN, T.steel, { under: true }), box(-c.fw / 2 + 0.4, 0, c.fd / 2 + 2.6, 0.25, 3.3, 0.25, PLAIN, T.dark, { n: 3, step: [c.fw / 2 - 0.4, 0, 0] }),
                truss(wx - 1.2, 0, wz - 1.2, 0.35, 7, 0.35, T.dark), truss(wx + 1.2, 0, wz - 1.2, 0.35, 7, 0.35, T.dark), truss(wx - 1.2, 0, wz + 1.2, 0.35, 7, 0.35, T.dark), truss(wx + 1.2, 0, wz + 1.2, 0.35, 7, 0.35, T.dark),
                cyl(wx, 7, wz, 2.3, 3, TIN, T.red, { seg: 16 }), cyl(wx, 10, wz, 2.6, 1.3, TIN, T.dark, { r2: 0.05, seg: 16 })]; } },
    };
    /* THE POLISH PASS (2026-11-13, mondo: "one more polish pass on the exteriors ... go one or two more layers deep with the detail"): a second list per building,
       added to its arch row: plinths, corner posts, cornices, door surrounds + canopies + lamps, window sills / lintels / mullions, downpipes + gutters, roof ribs,
       ladders, sign boards (blank: the arch row has no lettering), rust streaks. Helpers work in the front frame; `clr` keeps a list of x clear of the doorway. */
    const CONC = U('ConcreteStriped2a'), LAMP = 0xfff0c0, RUST = 0x8a5a3a;
    const ring = (c, y, h, t, key, tint, o) => { const w = c.fw + 2 * t, F = c.fd / 2 + t / 2 + E, S = c.fw / 2 + t / 2 + E, D = c.door, r = [];
        if (D && y < 2.2) { const a = -w / 2, b = D.lx - D.cw / 2 - 0.2, e = D.lx + D.cw / 2 + 0.2, f = w / 2; if (b - a > 0.2) r.push(box((a + b) / 2, y, F, b - a, h, t, key, tint, o)); if (f - e > 0.2) r.push(box((e + f) / 2, y, F, f - e, h, t, key, tint, o)); }
        else r.push(box(0, y, F, w, h, t, key, tint, o));
        r.push(box(0, y, -F, w, h, t, key, tint, o), box(S, y, 0, t, h, c.fd, key, tint, o), box(-S, y, 0, t, h, c.fd, key, tint, o)); return r; };
    const corners = (c, y, h, t, key, tint, o) => [box(-c.fw / 2, y, c.fd / 2, t, h, t, key, tint, Object.assign({ n: 2, step: [c.fw, 0, 0] }, o)), box(-c.fw / 2, y, -c.fd / 2, t, h, t, key, tint, Object.assign({ n: 2, step: [c.fw, 0, 0] }, o))];
    const pipes = (c, h, inset) => [cyl(-c.fw / 2 + (inset || 0.9), 0, c.fd / 2 + 0.2, 0.09, h, PLAIN, T.dark, { seg: 6, n: 2, step: [c.fw - 2 * (inset || 0.9), 0, 0] }), box(-c.fw / 2 + (inset || 0.9), h - 0.25, c.fd / 2 + 0.2, 0.34, 0.3, 0.34, PLAIN, T.dark, { n: 2, step: [c.fw - 2 * (inset || 0.9), 0, 0] })];
    const lamp = (x, y, z, o) => [box(x, y, z, 0.5, 0.14, 0.34, PLAIN, T.dark, o), box(x, y - 0.08, z, 0.36, 0.08, 0.24, null, LAMP, Object.assign({ glow: 0.9 }, o))];
    const doorTrim = (c, tint, wide) => { const D = c.door; if (!D) return []; const F = c.fd / 2 + 0.12;
        return [box(D.lx - D.cw / 2 - 0.12, 0, F, 0.2, 2.42, 0.22, PLAIN, tint, { n: 2, step: [D.cw + 0.24, 0, 0] }), box(D.lx, 2.22, F, D.cw + 0.6, 0.26, 0.24, PLAIN, tint),
            box(D.lx, 2.75, c.fd / 2 + 0.75, D.cw + (wide || 1.6), 0.14, 1.5, TIN, tint, { under: true }), box(D.lx, 0, c.fd / 2 + 0.75, D.cw + 1.2, 0.1, 1.5, CONC, 0xbdbdbd), ...lamp(D.lx, 2.7, c.fd / 2 + 0.6)]; };
    const frame = (x, y, z, w, h, n, tint) => [box(x, y - 0.16, z + 0.1, w + 0.4, 0.16, 0.3, CONC, 0xd8d8d8), box(x, y + h, z + 0.08, w + 0.3, 0.2, 0.2, PLAIN, tint), box(x - w / 2, y, z + 0.08, 0.12, h, 0.1, PLAIN, tint, { n: n + 1, step: [w / n, 0, 0] })];
    /* THE LETTERING (the shared `txt:` sheet, PR #1327): letters only, laid over a board; the words are the plan's building names / what the place is */
    const txt = (x, y, z, w, h, words, fg) => ({ s: 'quad', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h)], key: 'txt:' + words + '|' + (fg || '#f4f1ea') + '||' + (Math.round(w / h * 100) / 100), uv: 'fit', tint: 0xffffff, kind: 'over' });
    const sign = (x, y, z, w, h, tint, rim, words, fg) => [box(x, y, z, w + 0.24, h + 0.24, 0.1, PLAIN, rim == null ? T.dark : rim), box(x, y + 0.12, z + 0.05, w, h, 0.1, PLAIN, tint)].concat(words ? [txt(x, y + 0.12 + h * 0.14, z + 0.115, w * 0.88, h * 0.72, words, fg)] : []);
    const ladder = (x, z, h, alongX) => truss(x, 0.4, z, alongX ? 0.6 : 0.08, h, alongX ? 0.08 : 0.6, T.dark);
    const haz = (x, y, z, n, dx) => box(x, y, z, 0.9, 0.9, 0.06, U('SignHazard1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: n || 1, step: [dx || 0, 0, 0] });
    const streaks = (x, y, z, h, n, dx) => box(x, y, z, 0.45, h, 0.04, U('MetalCorrugatedPainted3a'), RUST, { n, step: [dx, 0, 0], faces: 'f', top: false });
    const doorDecal = (x, z, key) => [box(x, 0, z + 0.03, 1.3, 2.3, 0.08, PLAIN, T.dark), box(x, 0, z + 0.08, 1.05, 2.1, 0.08, U(key || 'DoorPaintedHalf1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false }), ...lamp(x, 2.55, z + 0.25)];
    const clr = (c, xs, half) => c.door ? xs.filter(x => Math.abs(x - c.door.lx) > half + c.door.cw / 2 + 0.35) : xs;
    const MORE = {
        'P00-08-B1': c => [...ring(c, 0, 0.6, 0.12, PLAIN, T.dark), ...corners(c, 0.6, 5.6, 0.8, CONC, 0xe2ddd0), ...doorTrim(c, T.yellow), ...pipes(c, 6.2, 1.6),
            ...clr(c, [-c.fw / 4, c.fw / 4], 3).flatMap(x => [box(x, 4, c.fd / 2 + 0.1, c.fw / 2 - 4, 1.5, 0.1, U('GlassWindowSquare1a'), 0xffffff), ...frame(x, 4, c.fd / 2 + 0.1, c.fw / 2 - 4, 1.5, 4, T.dark)]),
            box(-c.fw / 2 - 0.3, 0, -9.8, 0.3, 1.1, 0.3, PLAIN, T.yellow, { n: 4, step: [0, 0, 6.53] }), ...[-7, 0, 7].flatMap(z => lamp(-c.fw / 2 - 0.35, 5.1, z)),
            ladder(c.fw / 2 + 0.16, 5, 6.8), cyl(-10, 7.1, 10, 3.55, 0.35, PLAIN, T.dark, { roof: true }), cyl(-10, 9.8, 10, 3.55, 0.3, PLAIN, T.dark, { roof: true }),
            box(-10, 16.3, 10, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1, roof: true }), haz(c.door.lx + 2.2, 1.2, c.fd / 2 + 0.12), txt(0, 6.3, c.fd / 2 + 0.37, 8, 0.6, 'FREIGHT GATE', '#22262a')],
        'P01-08-B1': c => [...ring(c, 0, 1, 0.14, CONC, 0xbdb6a6), ...corners(c, 1, 5.4, 0.5, PLAIN, T.dark), ...pipes(c, 6.4, 0.5),
            box(c.fw / 2 + 0.1, 4.3, 0, 0.1, 1.3, c.fd - 4, U('GlassWindowFactory1a'), T.glass), box(-c.fw / 2 - 0.1, 4.3, 0, 0.1, 1.3, c.fd - 4, U('GlassWindowFactory1a'), T.glass),
            box(0, 3.75, c.fd / 2 + 3.38, c.fw - 1, 0.28, 0.08, PLAIN, T.yellow), ...[-4.4, 4.4].flatMap((x, i) => [...sign(x, 4.6, c.fd / 2 + 0.12, 0.9, 0.9, T.white, null, String(i + 1), '#22262a'), ...lamp(x, 3.8, c.fd / 2 + 1.5)]), txt(0, 5.6, c.fd / 2 + 0.1, 7, 0.7, 'WAREHOUSE', '#f4f1ea'),
            streaks(-7.6, 3.2, c.fd / 2 + 0.09, 3.1, 3, 7.6), streaks(-6, 2.4, -c.fd / 2 - 0.09, 3.9, 4, 4, ), ...doorDecal(0, c.fd / 2 + 0.06), box(0, 0, c.fd / 2 + 2.4, 3, 1, 2, CONC, 0xbdb6a6),
            box(0, 0, c.fd / 2 + 3.8, 1.6, 0.5, 0.8, CONC, 0xbdb6a6)],
        'P01-08-B2': c => [...ring(c, 0, 0.5, 0.1, CONC, 0xb8b0a0), ...frame(0, 0.5, c.fd / 2 + 0.1, 9, 2.2, 6, T.dark), ...doorDecal(6.4, c.fd / 2 + 0.06, 'DoorStorefrontHalf1a'), ...pipes(c, 7, 0.4),
            box(-c.fw / 2 + 1, 2.9, c.fd / 2 + 0.7, 0.2, 0.6, 1.3, PLAIN, T.dark, { n: 5, step: [(c.fw - 2) / 4, 0, 0] }), ...sign(-6.6, 0.7, c.fd / 2 + 0.1, 1.1, 1.5, 0x2a2d30, T.cream, 'MENU'), txt(0, 4.4, c.fd / 2 + 1.48, 6, 0.8, 'CANTEEN'),
            box(0, 4.05, c.fd / 2 + 1.38, 8.4, 1.4, 0.08, PLAIN, T.white), box(0, 6.95, 0.65, c.fw + 0.5, 0.3, c.fd + 1.8, PLAIN, T.dark, { roof: true }),
            box(-c.fw / 2 + 3, 4.4, c.fd / 2 + 1.42, 1.75, 1.75, 0.08, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: 2, step: [c.fw - 6, 0, 0] }),
            box(c.fw / 2 + 0.4, 2.2, -2, 0.7, 0.6, 1, PLAIN, T.steel), ...[-3, 3].flatMap(x => lamp(x, 3.42, c.fd / 2 + 0.9))],
        'P01-08-B3': c => [...ring(c, 0, 0.5, 0.1, CONC, 0xb8b0a0), ...corners(c, 0.5, 3.7, 0.35, PLAIN, T.dark), box(0, 4.12, c.fd / 2 + 0.5, c.fw + 0.8, 0.16, 0.2, PLAIN, T.dark), ...pipes(c, 4.1, 0.3),
            ...lamp(0, 4.0, c.fd / 2 + 0.35), haz(3.6, 1.3, c.fd / 2 + 0.1), ...doorDecal(-c.fw / 2 + 1.6, c.fd / 2 + 0.06), cyl(c.fw / 2 - 1.5, 4.6, -c.fd / 2 + 1.5, 0.28, 3.2, PLAIN, T.dark, { seg: 8, roof: true }),
            cyl(c.fw / 2 - 1.5, 7.8, -c.fd / 2 + 1.5, 0.5, 0.3, PLAIN, T.dark, { r2: 0.1, seg: 8, roof: true }), ...sign(0, 4.25, c.fd / 2 + 0.3, 4, 0.8, T.yellow, null, 'WELDING', '#22262a'), streaks(-c.fw / 2 + 1, 1.2, -c.fd / 2 - 0.09, 2.8, 3, (c.fw - 2) / 2)],
        'P02-08-B1': c => { const F = c.fd / 2;
            const o = [...ring(c, 0, 1.1, 0.16, CONC, 0xcfc8b8), ...ring(c, 9.7, 0.5, 0.3, CONC, 0xd8d2c4), ...ring(c, 10.2, 0.3, 0.45, CONC, 0xd8d2c4), ...doorTrim(c, T.dark, 2.6),
                ...clr(c, [-13.1, -2.9, 3.3, 13.5, -c.fw / 2 + 0.4, c.fw / 2 - 0.4].filter(x => Math.abs(x) < c.fw / 2), 0.4).map(x => box(x, 1.1, F + 0.13, 0.75, 8.6, 0.26, 'bricks_3', T.dbrick)),
                ...frame(-8, 3.2, F + 0.1, 9, 4.6, 5, T.dark), ...frame(8.4, 3.2, F + 0.1, 9, 4.6, 5, T.dark), box(-8, 5.4, F + 0.18, 9, 0.14, 0.08, PLAIN, T.dark, { n: 2, step: [16.4, 0, 0] }),
                box(c.fw / 2 + 0.13, 1.1, -c.fd / 2 + 2, 0.26, 8.6, 0.75, 'bricks_3', T.dbrick, { n: 5, step: [0, 0, (c.fd - 4) / 4] }), box(-c.fw / 2 - 0.13, 1.1, -c.fd / 2 + 2, 0.26, 8.6, 0.75, 'bricks_3', T.dbrick, { n: 5, step: [0, 0, (c.fd - 4) / 4] }),
                roof('barrel', -c.fw / 2 + 2, 10.6, F - 9, 0.4, 5.15, 19, PLAIN, T.dark, { n: 6, step: [(c.fw - 4) / 5, 0, 0] }),
                ...sign(c.door.lx, 7.9, F + 0.14, 7, 1.1, 0xd8d2c4, T.dark, 'POWER STATION', '#22262a'), ...clr(c, [c.door.lx - 2.4, c.door.lx + 2.4], 0).map(x => haz(x, 1.3, F + 0.2)),
                box(8, 12.4, -c.fd / 2 + 9.75, 9, 1.6, 0.1, U('GlassWindowFactory3a'), T.glass, { roof: true }), ladder(c.fw / 2 + 0.3, -c.fd / 2 + 3, 10.4)];
            [-3.5, -10].forEach(x => { o.push(cyl(x, 36.7, -c.fd / 2 + 5, 1.45, 0.5, PLAIN, T.dark, { roof: true, cap: false }), truss(x + 1.75, 13, -c.fd / 2 + 5, 0.08, 23.5, 0.6, T.dark), box(x, 37.2, -c.fd / 2 + 5, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1, roof: true })); });
            o.push(box(-6.75, 11.4, -c.fd / 2 + 1.6, 9, 0.7, 0.7, PLAIN, T.steel, { roof: true }), box(1.4, 10.6, -c.fd / 2 + 5, 2.4, 1.6, 2.4, PLAIN, T.steel, { roof: true }), vents(-6, 10.62, -c.fd / 2 + 9.5, 2, 4));
            return o; },
        'P03-08-B1': c => [...ring(c, 0, 0.7, 0.12, PLAIN, T.dark), ...corners(c, 0.7, 6.3, 0.5, PLAIN, T.dark), ...doorTrim(c, T.steel), box(0, 4.7, c.fd / 2 + 0.14, c.fw + 0.2, 0.4, 0.2, PLAIN, T.dark),
            box(0, 5.3, c.fd / 2 + 0.1, c.fw - 2, 1.3, 0.1, U('GlassWindowFactory1a'), T.glass), ...frame(0, 5.3, c.fd / 2 + 0.1, c.fw - 2, 1.3, 10, T.dark),
            ...[-11, -5, 9.5].flatMap((x, i) => [...sign(x, 4.75, c.fd / 2 + 0.22, 0.8, 0.8, T.yellow, null, String(i + 1), '#22262a'), box(x - 2.75, 0, c.fd / 2 + 0.3, 0.25, 1.1, 0.25, PLAIN, T.yellow, { n: 2, step: [5.5, 0, 0] })]),
            cyl(c.fw / 2 + 0.2, 0, -3.5, 0.09, 7, PLAIN, T.dark, { seg: 6, n: 3, step: [0, 0, 3.5] }), box(c.fw / 2 + 0.1, 3.6, 0, 0.1, 1.5, c.fd - 3, U('GlassWindowFactory1a'), T.glass), box(-c.fw / 2 - 0.1, 3.6, 0, 0.1, 1.5, c.fd - 3, U('GlassWindowFactory1a'), T.glass),
            cyl(-c.fw / 2 + 2, 7.1, -c.fd / 2 + 1.2, 0.3, 3.4, PLAIN, T.dark, { seg: 8, roof: true, n: 2, step: [3, 0, 0] })],
        'P03-08-B2': c => [box(0, 0, c.fd / 2 + 0.1, 9.8, 0.95, 0.12, U('TileSubway1a'), 0xffffff), ...frame(0, 1.1, c.fd / 2 + 0.1, 9, 1.3, 6, T.dark), cyl(-3.75, 0, c.fd / 2 + 1.1, 0.07, 0.62, PLAIN, T.silver, { seg: 6, n: 6, step: [1.5, 0, 0] }),
            cyl(-3.75, 0.62, c.fd / 2 + 1.1, 0.24, 0.1, PLAIN, T.red, { seg: 10, n: 6, step: [1.5, 0, 0] }), box(0, 3.14, c.fd / 2 + 2.52, c.fw + 1.5, 0.28, 0.06, PLAIN, T.red), box(0, 3.14, -c.fd / 2 - 0.52, c.fw + 1.5, 0.28, 0.06, PLAIN, T.red),
            box(c.fw / 2 + 0.72, 3.14, 1, 0.06, 0.28, c.fd + 3, PLAIN, T.red), box(-c.fw / 2 - 0.72, 3.14, 1, 0.06, 0.28, c.fd + 3, PLAIN, T.red), box(-3, 3.02, c.fd / 2 + 1.3, 0.4, 0.08, 0.3, null, LAMP, { glow: 0.9, n: 3, step: [3, 0, 0] }),
            box(-3.4, 3.45, 0, 0.14, 1.9, 0.14, PLAIN, T.dark, { n: 2, step: [6.8, 0, 0] }), box(0, 5.05, 0, 8.3, 0.12, 0.42, PLAIN, T.white), ...sign(-5.8, 1.1, c.fd / 2 + 0.1, 0.9, 1.3, 0x2a2d30, T.white, 'MENU'), ...sign(5.8, 1.1, c.fd / 2 + 0.1, 0.9, 1.3, 0x2a2d30, T.white, 'OPEN'), txt(0, 3.65, 0.17, 6.4, 1.2, 'LUNCH COUNTER'),
            box(-c.fw / 2 - 0.6, 0, c.fd / 2 + 2.3, 0.18, 3.1, 0.18, PLAIN, T.white, { n: 2, step: [c.fw + 1.2, 0, 0] }), ...ring(c, 0, 0.3, 0.08, CONC, 0xb8b0a0).slice(1)],
        'P00-09-B1': c => { const o = [], nz = Math.round(c.fd / 2.625), lz = c.fd / nz;
            for (let l = 0; l < 3; l++) [-1, 1].forEach(sx => [-0.35, 0.35].forEach(dz => o.push(box(sx * (c.fw / 2 + 0.1), l * 2.333 + 0.12, -c.fd / 2 + lz * 0.5 + dz, 0.06, 2.06, 0.06, PLAIN, T.dark, { n: nz, step: [0, 0, lz] }))));
            o.push(box(0, 0, 0, c.fw + 0.5, 0.16, c.fd + 0.5, CONC, 0xa9a9a9, { sides: true }));
            return o; },
        'P01-09-B1': c => { const R = c.fw / 2 + 1.5;
            return [...ring(c, 0, 0.5, 0.1, PLAIN, T.dark), ...doorTrim(c, T.dark), box(0, 3.5, R + 0.04, 2 * R + 0.1, 0.3, 0.1, PLAIN, T.dark, { n: 2, step: [0, 3.2, 0] }), box(0, 3.5, -R - 0.04, 2 * R + 0.1, 0.3, 0.1, PLAIN, T.dark, { n: 2, step: [0, 3.2, 0] }),
                box(R + 0.04, 3.5, 0, 0.1, 0.3, 2 * R + 0.1, PLAIN, T.dark, { n: 2, step: [0, 3.2, 0] }), box(-R - 0.04, 3.5, 0, 0.1, 0.3, 2 * R + 0.1, PLAIN, T.dark, { n: 2, step: [0, 3.2, 0] }),
                box(-R + 1, 4.3, R + 0.12, 0.12, 1.7, 0.08, PLAIN, T.white, { n: 9, step: [(2 * R - 2) / 8, 0, 0] }), box(-R + 1, 4.3, -R - 0.12, 0.12, 1.7, 0.08, PLAIN, T.white, { n: 9, step: [(2 * R - 2) / 8, 0, 0] }),
                box(R + 0.12, 4.3, -R + 1, 0.08, 1.7, 0.12, PLAIN, T.white, { n: 9, step: [0, 0, (2 * R - 2) / 8] }), box(-R - 0.12, 4.3, -R + 1, 0.08, 1.7, 0.12, PLAIN, T.white, { n: 9, step: [0, 0, (2 * R - 2) / 8] }),
                box(-R + 2.5, 3.42, R - 0.8, 0.5, 0.08, 0.5, null, LAMP, { glow: 0.9, n: 4, step: [(2 * R - 5) / 3, 0, 0] }), cyl(5.6, 10.12, -6.2, 0.1, 0.8, PLAIN, T.dark, { roof: true, seg: 6 }),
                cyl(5.6, 10.9, -6.2, 0.15, 0.6, PLAIN, 0xf4f4f4, { r2: 1.1, roof: true, ds: true, cap: false }), box(8, 20.1, -8, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1, roof: true }), box(8, 8.2, -4.95, 3, 1.3, 0.1, GRILL, 0xffffff, { roof: true })]; },
        'P02-09-B1': c => { const o = [truss(0, 1.5, c.fd / 2, c.fw, 0.9, 0.06, T.steel), truss(0, 1.5, -c.fd / 2, c.fw, 0.9, 0.06, T.steel), truss(c.fw / 2, 1.5, 0, 0.06, 0.9, c.fd, T.steel), truss(-c.fw / 2, 1.5, 0, 0.06, 0.9, c.fd, T.steel),
                ...doorDecal(-c.fw / 2 + 4, c.fd / 2 + 0.14), box(-c.fw / 2 + 0.06, 1.6, 0, 0.1, 1.5, 6, U('GlassWindowSquare1a'), 0xffffff), box(-c.fw / 2 + 8.5, 1.2, c.fd / 2 - 3, 0.5, 1.2, 0.8, PLAIN, 0x5f7a66, { n: 2, step: [0, 0, -2] })];
            [-1.5, 3, 7.5].forEach(x => [-1.38, 1.38].forEach(dx => o.push(box(x + dx, 0.5, -2.1, 0.14, 2.2, 0.34, PLAIN, 0x4d6557, { n: 8, step: [0, 0, 0.6] }))));
            [-1.5, 0, 1.5].forEach(z => o.push(box(3, 4.55, z, 9.6, 0.07, 0.07, PLAIN, T.silver), box(c.fw / 2 - 4, 4.6 + 3, z * 2, 5.6, 0.05, 0.05, PLAIN, T.dark)));
            o.push(box(c.fw / 2 - 1.2, 13, -3, 0.25, 0.25, 0.25, null, 0xff3020, { glow: 1, n: 2, step: [0, 0, 6] }));
            return o; },
        'P03-09-B1': c => [...ring(c, 0, 0.5, 0.1, PLAIN, T.slate), ...doorTrim(c, T.white, 3.4), ...clr(c, [1.5, 4.5, 7.5, 10.5, 13.5].filter(x => x < c.fw / 2 - 0.3), 0).map(x => box(x, 0.9, c.fd / 2 + 0.2, 0.16, 5.3, 0.5, PLAIN, T.white)),
            box(7.5, 5.8, c.fd / 2 + 0.3, 12.6, 0.2, 0.8, PLAIN, T.white, { under: true }), box(7.5, 0.9, c.fd / 2 + 0.2, 12.6, 0.3, 0.4, PLAIN, T.white),
            roof('barrel', -c.fw / 2 + 0.6, 7.1, 0, 0.3, 2.72, c.fd + 0.7, PLAIN, T.dblue, { n: 6, step: [(c.fw - 10.2) / 5, 0, 0] }), cyl(c.fw / 2 - 4.6, 8.5, 0, 4.42, 0.4, PLAIN, T.dblue, { roof: true, seg: 24, cap: false }),
            box(-c.fw / 2 + 4, 4.2, c.fd / 2 + 0.1, 5, 1.6, 0.1, U('GlassWindowSquare1a'), 0xffffff), ...frame(-c.fw / 2 + 4, 4.2, c.fd / 2 + 0.1, 5, 1.6, 4, T.slate), ...sign(-c.fw / 2 + 4, 1.2, c.fd / 2 + 0.1, 3.2, 1.6, T.dblue, T.white, 'AEROSPACE LAB'),
            box(0, 4.2, -c.fd / 2 - 0.1, c.fw - 4, 1.6, 0.1, U('GlassWindowSquare1a'), 0xffffff), box(-c.fw / 2 + 2.2, 12.2, 0, 0.25, 0.25, 0.25, null, 0xff3020, { glow: 1, roof: true }), box(-2, 7.1, -c.fd / 2 + 1.2, 1.6, 1, 1.2, PLAIN, T.steel, { roof: true, n: 2, step: [2.6, 0, 0] }),
            ...pipes(c, 7, 0.3)],
        'P03-09-B2': c => [box(0, 0.9, -3, 5.24, 0.12, 7.24, PLAIN, T.yellow, { top: false }), box(-2.5, 0.9, 0.5, 0.14, 2.1, 0.14, PLAIN, T.dark, { n: 2, step: [5, 0, 0] }), box(-2.5, 0.9, -6.5, 0.14, 2.1, 0.14, PLAIN, T.dark, { n: 2, step: [5, 0, 0] }),
            box(0, 3, c.fd / 2 + 0.26, c.fw + 1.5, 0.35, 0.06, PLAIN, T.yellow), box(0, 3, -c.fd / 2 - 0.26, c.fw + 1.5, 0.35, 0.06, PLAIN, T.yellow), box(-c.fw / 4, 2.9, 1.5, 0.6, 0.1, 0.4, null, LAMP, { glow: 0.9, n: 2, step: [c.fw / 2, 0, 0] }),
            box(-c.fw / 2 + 0.6, 0, c.fd / 2 + 0.6, 0.5, 1.3, 0.5, PLAIN, T.dark), box(-c.fw / 2 + 0.2, 0.75, c.fd / 2 + 0.6, 0.7, 0.6, 0.4, PLAIN, T.dark), haz(-c.fw / 4, 0.65, c.fd / 2 + 0.72, 3, c.fw / 4),
            box(-c.fw / 2 + 1.5, 0, c.fd / 2 + 1.6, 0.3, 0.9, 0.3, PLAIN, T.yellow, { n: 5, step: [(c.fw - 3) / 4, 0, 0] }), cyl(c.fw / 2 - 0.6, 3.35, -c.fd / 2 + 0.6, 0.07, 2.4, PLAIN, T.dark, { seg: 6 }), box(c.fw / 2 - 0.6, 5.6, -c.fd / 2 + 0.85, 0.3, 0.25, 0.5, PLAIN, T.white),
            ...sign(0, 1.2, -6.56, 2.4, 1, 0xb5523f, T.white, 'STOP')],
        'P00-10-B1': c => { const tx = c.fw / 2 - 4.4, F = c.fd / 2;
            return [...ring(c, 0, 0.9, 0.14, CONC, 0xcfc8b8), ...corners(c, 0.9, 6.1, 0.7, CONC, 0xdcd6c8), ...ring(c, 6.6, 0.4, 0.25, CONC, 0xdcd6c8), ...doorTrim(c, T.dark),
                box(-10.6, 2.9, F + 0.5, 0.25, 0.6, 1, CONC, 0xdcd6c8, { n: 5, step: [2.8, 0, 0] }), box(-5, 4.14, F + 0.12, 2.1, 0.16, 0.3, CONC, 0xdcd6c8, { n: 4, step: [3.2, 0, 0] }), box(-5, 6.05, F + 0.12, 2.1, 0.22, 0.2, CONC, 0xdcd6c8, { n: 4, step: [3.2, 0, 0] }),
                ...clr(c, [-9.8, -6.6, -3.4, -0.2, 3], 1).flatMap(x => [box(x, 1.1, F + 0.1, 1.75, 1.75, 0.1, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false }), box(x, 0.94, F + 0.12, 2.1, 0.16, 0.3, CONC, 0xdcd6c8)]),
                box(tx - 3.8, 7.1, 3.8, 0.7, 3.6, 0.7, CONC, 0xdcd6c8, { roof: true, n: 2, step: [7.6, 0, 0] }), box(tx - 3.8, 7.1, -3.8, 0.7, 3.6, 0.7, CONC, 0xdcd6c8, { roof: true, n: 2, step: [7.6, 0, 0] }),
                box(tx - 3.4, 11.1, 3.42, 0.14, 2.3, 0.1, PLAIN, T.dark, { roof: true, n: 5, step: [1.7, 0, 0] }), box(tx - 3.4, 11.1, -3.42, 0.14, 2.3, 0.1, PLAIN, T.dark, { roof: true, n: 5, step: [1.7, 0, 0] }),
                box(tx + 3.42, 11.1, -3.4, 0.1, 2.3, 0.14, PLAIN, T.dark, { roof: true, n: 5, step: [0, 0, 1.7] }), box(tx - 3.42, 11.1, -3.4, 0.1, 2.3, 0.14, PLAIN, T.dark, { roof: true, n: 5, step: [0, 0, 1.7] }),
                box(tx, 20.1, 0.5, 0.06, 0.7, 1, PLAIN, T.red, { roof: true }), ...pipes(c, 6.6, 1.2),
                box(-4.4, 9.2, -2, 1, 1.6, 1, 'bricks_3', T.dbrick, { roof: true, n: 2, step: [0, 0, 4] }), box(-4.4, 10.8, -2, 1.3, 0.2, 1.3, CONC, 0xdcd6c8, { roof: true, n: 2, step: [0, 0, 4] })]; },
        'P01-10-B1': c => [...ring(c, 0, 0.5, 0.1, CONC, 0xb8b0a0), box(-c.fw / 4 - (c.fw / 4 - 0.8), 0, c.fd / 2 + 0.16, 0.3, 3.9, 0.2, PLAIN, T.yellow, { n: 2, step: [c.fw / 2 - 1.6, 0, 0] }), box(c.fw / 4 - (c.fw / 4 - 0.8), 0, c.fd / 2 + 0.16, 0.3, 3.9, 0.2, PLAIN, T.yellow, { n: 2, step: [c.fw / 2 - 1.6, 0, 0] }),
            box(-c.fw / 4, 3.6, c.fd / 2 + 0.16, c.fw / 2 - 1.3, 0.35, 0.2, PLAIN, T.yellow, { n: 2, step: [c.fw / 2, 0, 0] }), ...[-c.fw / 4, c.fw / 4].flatMap((x, i) => [...sign(x, 4.3, c.fd / 2 + 0.12, 0.9, 0.9, T.white, null, 'AB'[i], '#22262a'), ...lamp(x, 4.1, c.fd / 2 + 0.5)]),
            box(0, 4.3, 0, 0.3, 0.2, c.fd + 0.9, PLAIN, T.dark), cyl(0, 0, c.fd / 2 + 0.25, 0.09, 4.3, PLAIN, T.dark, { seg: 6 }), box(-c.fw / 4, 6.55, 0, 0.7, 0.4, c.fd - 2, PLAIN, T.dark, { n: 2, step: [c.fw / 2, 0, 0], roof: true }),
            streaks(-c.fw / 2 + 1.5, 1.4, -c.fd / 2 - 0.09, 3, 4, (c.fw - 3) / 3), box(c.fw / 2 + 0.1, 2.6, 0, 0.1, 1.2, c.fd - 4, U('GlassWindowFactory1a'), T.glass), box(-c.fw / 2 - 0.1, 2.6, 0, 0.1, 1.2, c.fd - 4, U('GlassWindowFactory1a'), T.glass)],
        'P01-10-B2': c => [...ring(c, 0, 0.45, 0.1, CONC, 0xb8b0a0), ...frame(0, 0.6, c.fd / 2 + 0.1, c.fw - 6, 2, 4, 0x5a3a26), ...doorDecal(c.fw / 2 - 1.7, c.fd / 2 + 0.06, 'DoorWoodenHalf1a'),
            box(0, 5.6, c.fd / 2 - 0.2, c.fw + 0.4, 0.16, 0.8, PLAIN, T.white), box(0, 6.6, c.fd / 2 - 0.2, c.fw / 2 + 0.4, 0.16, 0.8, PLAIN, T.white), box(-c.fw * 3 / 8 - 0.05, 5.6, c.fd / 2 - 0.2, c.fw / 4, 0.01, 0.5, PLAIN, T.white),
            ...sign(0, 4.3, c.fd / 2 + 0.08, c.fw - 5, 1.2, 0x7a3b2a, T.cream).concat([txt(0, 4.6, c.fd / 2 + 0.2, Math.min(c.fw - 6, 8), 0.85, 'HARDWARE', '#e9dfc4')]), box(-c.fw / 2 + 1.3, 0, c.fd / 2 + 2.3, 0.16, 2.85, 0.16, PLAIN, 0x5a3a26, { n: 3, step: [(c.fw - 2.6) / 2, 0, 0] }), ...pipes(c, 4.2, 0.3),
            box(c.fw / 2 + 0.1, 1.6, -1, 0.08, 1.75, 1.75, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'r', top: false })],
        'P01-10-B3': c => [box(-c.fw / 2 - 0.05, 0, 0, 0.5, 0.5, c.fd + 0.3, CONC, 0xb8b0a0, { n: 2, step: [c.fw + 0.1, 0, 0] }), ...lamp(0, 4.35, c.fd / 2 + 0.3), ...sign(0, 4.45, c.fd / 2 + 0.1, 2.6, 0.7, T.yellow, null, 'FORKLIFT REPAIR', '#22262a'), ...doorDecal(-c.fw / 2 + 2.2, c.fd / 2 + 0.1),
            cyl(0, 5.5, -c.fd / 3, 0.35, 0.8, PLAIN, T.dark, { seg: 8, roof: true, n: 3, step: [0, 0, c.fd / 3] }), cyl(0, 6.3, -c.fd / 3, 0.55, 0.25, PLAIN, T.dark, { r2: 0.1, seg: 8, roof: true, n: 3, step: [0, 0, c.fd / 3] }),
            box(-2.6, 0, c.fd / 2 + 0.35, 0.25, 1, 0.25, PLAIN, T.yellow, { n: 2, step: [5.2, 0, 0] }), box(0, 1.6, -c.fd / 2 - 0.12, 3, 1.4, 0.1, U('GlassWindowFactory1a'), T.glass), ...frame(0, 1.6, -c.fd / 2 - 0.3, 0.01, 0.01, 1, T.dark).slice(0, 0)],
        'P02-10-B1': c => [...ring(c, 0, 0.6, 0.12, PLAIN, T.dark), ...corners(c, 0.6, 6.4, 0.5, PLAIN, T.dark), ...doorTrim(c, T.yellow), ...clr(c, [-9.35, -4.85, 6.6], 0).map(x => box(x, 0, c.fd / 2 + 0.16, 0.5, 4.7, 0.3, PLAIN, T.dark)),
            ...[-11.6, -7.1, -2.6, 4.3, 8.9].flatMap((x, i) => [...sign(x, 5.3, c.fd / 2 + 0.12, 0.8, 0.8, T.white, null, String(i + 1), '#22262a'), ...lamp(x, 5.05, c.fd / 2 + 0.75)]), box(-c.fw / 2 + 0.5, 7.4, 4.06, 0.14, 2, 0.1, PLAIN, T.dark, { roof: true, n: 12, step: [(c.fw - 1) / 11, 0, 0] }),
            box(-c.fw / 2 + 0.5, 7.4, -4.06, 0.14, 2, 0.1, PLAIN, T.dark, { roof: true, n: 12, step: [(c.fw - 1) / 11, 0, 0] }), box(c.fw / 2 + 0.1, 4, 0, 0.1, 1.5, c.fd - 3, U('GlassWindowFactory1a'), T.glass), box(-c.fw / 2 - 0.1, 4, 0, 0.1, 1.5, c.fd - 3, U('GlassWindowFactory1a'), T.glass),
            ...pipes(c, 7, 0.35), box(-13.9, 0, c.fd / 2 + 0.45, 0.25, 1, 0.25, PLAIN, T.yellow, { n: 4, step: [4.5, 0, 0] }), streaks(-c.fw / 2 + 2, 2, -c.fd / 2 - 0.09, 5, 5, (c.fw - 4) / 4), ladder(-c.fw / 2 - 0.16, -3, 7)],
        'P03-10-B1': c => [box(0, 0, c.fd / 2 + 0.2, c.fw + 0.4, 0.6, 0.4, CONC, 0xb8b0a0), box(0, 0, -c.fd / 2 - 0.2, c.fw + 0.4, 0.6, 0.4, CONC, 0xb8b0a0), ...doorTrim(c, T.steel),
            roof('barrel', -c.fw / 2 + 0.3, 7.1, 0, 0.35, 4.32, c.fd + 0.5, PLAIN, T.slate, { n: 8, step: [(c.fw - 0.6) / 7, 0, 0], seg: 14 }), box(c.fw / 2 + 0.14, 0, -5.7, 0.2, 6.2, 0.4, PLAIN, T.yellow, { n: 2, step: [0, 0, 11.4] }),
            box(c.fw / 2 + 0.14, 6, 0, 0.2, 0.4, 11.8, PLAIN, T.yellow), box(-c.fw / 2 + 3, 1.3, c.fd / 2 + 0.1, c.fw - 8, 1.3, 0.1, U('GlassWindowFactory1a'), T.glass), box(0, 1.3, -c.fd / 2 - 0.1, c.fw - 6, 1.3, 0.1, U('GlassWindowFactory1a'), T.glass),
            cyl(-c.fw / 2 + 1, 11.3, 0, 0.06, 3.5, PLAIN, T.dark, { seg: 6, roof: true }), cyl(-c.fw / 2 + 1.5, 14.4, 0, 0.3, 0.3, PLAIN, T.orange, { r2: 0.12, seg: 8, roof: true, cap: false, ds: true }),
            box(c.fw / 2 + 0.2, 10.7, 0, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1, roof: true }), box(0, 4.6, c.fd / 2 + 0.1, c.fw - 4, 1.3, 0.1, U('GlassWindowFactory1a'), T.glass), txt(c.door.lx, 3.2, c.fd / 2 + 0.1, 4, 0.7, 'HANGAR', '#22262a')],
        'P03-10-B2': c => { const sx = c.fw / 2 - 4.5;
            return [...ring(c, 0, 0.5, 0.1, PLAIN, T.dark), ...doorDecal(-c.fw / 2 + 2.5, c.fd / 2 + 0.06), box(-c.fw / 2 + 6, 1.2, c.fd / 2 + 0.1, 4, 1.5, 0.1, U('GlassWindowSquare1a'), 0xffffff), ...frame(-c.fw / 2 + 6, 1.2, c.fd / 2 + 0.1, 4, 1.5, 3, T.dark),
                cyl(sx, 6.5, 0, 1.96, 0.3, PLAIN, T.dark, { cap: false, n: 3, step: [0, 3.2, 0] }), box(sx, 5, 1.92, 0.5, 1, 0.08, U('GlassWindowSquare1a'), 0xffffff, { win: 'keep', n: 3, step: [0, 3.2, 0] }),
                cyl(sx, 16.1, 0, 4.1, 0.25, PLAIN, T.dark, { seg: 20 }), cyl(sx, 16.35, 0, 4, 1, TRUSS, T.dark, { seg: 20, cap: false, kind: 'over', ds: true }),
                box(0, 16.35, 0, 0.14, 2.8, 0.1, PLAIN, T.dark, { p: [sx, 16.35, 0], ring: { n: 10, r: 3.33 } }), cyl(sx, 19.1, 0, 3.95, 0.14, PLAIN, T.white, { seg: 20 }),
                cyl(sx + 1.2, 19.6, 1, 0.05, 2.6, PLAIN, T.dark, { seg: 5 }), cyl(sx - 1, 19.7, -1.2, 0.05, 1.8, PLAIN, T.dark, { seg: 5 }), box(sx, 24.4, 0, 0.3, 0.3, 0.3, null, 0xff3020, { glow: 1 }), ladder(sx - 1.98, 0, 12.2)]; },
        'P01-11-B1': (c, C0) => { const tx = -C0.fw / 2 + 5.25 - c.ox, F = c.fd / 2, wx = c.door.lx > 0 ? -2.5 : 2.5;
            return [...ring(c, 0, 1, 0.16, CONC, 0xcfc8b8), ...corners(c, 1, 6, 0.7, CONC, 0xdcd6c8), ...ring(c, 6.55, 0.45, 0.3, CONC, 0xdcd6c8), ...doorTrim(c, T.teal), ...frame(wx, 1.5, F + 0.1, 7, 4.6, 4, T.dark),
                box(wx, 6.15, F + 0.14, 7.6, 0.3, 0.3, CONC, 0xdcd6c8), box(0, 9.1, 2.52, 0.12, 1.7, 0.1, PLAIN, T.dark, { roof: true, n: 1 }), box(-2, 9.1, 2.54, 0.12, 1.7, 0.08, PLAIN, T.dark, { roof: true, n: 5, step: [1, 0, 0] }),
                ...[-4.4, 4.4].flatMap(z => [cyl(tx, 2.6, z, 3.67, 0.22, PLAIN, 0x2f6f6a, { seg: 20, cap: false, n: 3, step: [0, 2.3, 0] }), truss(tx, 0.6, z + (z > 0 ? 3.66 : -3.66), 0.6, 7.8, 0.08, T.dark), cyl(tx, 9.9, z, 0.4, 0.5, PLAIN, T.dark, { seg: 8 })]),
                box(tx, 8.3, 0, 0.9, 0.12, 2.4, GRILL, 0xffffff), box(-c.fw / 2 - 0.3, 1.8, 0, 0.5, 1.1, 1.1, PLAIN, 0x2f6f6a), cyl(-c.fw / 2 - 0.9, 0, 1.6, 0.35, 2.35, PLAIN, T.teal, { seg: 8 }), cyl(-c.fw / 2 - 0.9, 2.35, 1.6, 0.5, 0.12, PLAIN, T.red, { seg: 10 }),
                ...pipes(c, 6.6, 1.2), haz(c.door.lx + (c.door.lx > 0 ? 2 : -2), 1.3, F + 0.2)]; },
        'P02-11-B1': c => [...ring(c, 0, 0.6, 0.12, CONC, 0xb8b0a0), box(c.door.lx - c.door.cw / 2 - 0.2, 0, c.fd / 2 + 0.16, 0.34, 2.7, 0.34, PLAIN, T.dark, { n: 2, step: [c.door.cw + 0.4, 0, 0] }), box(c.door.lx, 2.3, c.fd / 2 + 0.16, c.door.cw + 0.9, 0.4, 0.36, PLAIN, T.dark),
            ...lamp(c.door.lx, 2.85, c.fd / 2 + 0.35), haz(c.door.lx - 2.2, 1.3, c.fd / 2 + 0.12, 2, 4.4), cyl(0, 4.6, 0, 4.96, 0.25, PLAIN, T.dark, { roof: true, seg: 24, cap: false, n: 2, step: [0, 2.4, 0] }),
            box(0, 5.2, 0, 1.3, 1.4, 0.08, U('GlassWindowSquare1a'), 0xffffff, { win: 'keep', roof: true, p: [0, 5.2, 0], ring: { n: 8, r: 4.93 } }), truss(0, 3.95, c.fd / 2 + 0.25, c.fw + 0.5, 1, 0.06, T.dark), truss(0, 3.95, -c.fd / 2 - 0.25, c.fw + 0.5, 1, 0.06, T.dark),
            truss(c.fw / 2 + 0.25, 3.95, 0, 0.06, 1, c.fd + 0.5, T.dark), truss(-c.fw / 2 - 0.25, 3.95, 0, 0.06, 1, c.fd + 0.5, T.dark), box(c.fw / 2 + 0.5, 0.3, -5.5, 1.1, 1, 0.25, PLAIN, 0x2f6f6a, { n: 4, step: [0, 0, 3.6] }),
            cyl(c.fw / 2 + 0.5, 1.2, 0.2, 0.12, 0.6, PLAIN, T.dark, { seg: 6 }), cyl(c.fw / 2 + 0.5, 1.8, 0.2, 0.45, 0.08, PLAIN, T.red, { seg: 10 }), ladder(-c.fw / 2 - 0.16, 2, 3.4), ...pipes(c, 3.5, 0.3)],
        'P02-11-B2': c => [...ring(c, 0, 0.5, 0.1, CONC, 0xb8b0a0), ...corners(c, 0.5, 3.1, 0.5, PLAIN, T.white), ...frame(0, 0.5, c.fd / 2 + 0.1, c.fw - 3, 2.1, 6, 0x2f6f6a), box(0, 0, c.fd / 2 + 0.14, 1.4, 2.5, 0.12, PLAIN, 0x2f6f6a),
            box(0, 0, c.fd / 2 + 0.2, 1.05, 2.1, 0.1, U('DoorStorefrontHalf1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false }), box(0, 6.3, c.fd / 2 + 0.6, 5.4, 0.2, 1.5, PLAIN, T.white), box(-2.2, 3.5, c.fd / 2 + 0.6, 0.25, 0.4, 1.1, PLAIN, T.white, { n: 3, step: [2.2, 0, 0] }),
            box(-c.fw / 2 + (c.fw / 2 - 2.5) / 2, 4.3, c.fd / 2 + 0.1, 1.75, 1.75, 0.1, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: 2, step: [c.fw / 2 + 2.5, 0, 0] }),
            box(-c.fw / 2 + (c.fw / 2 - 2.5) / 2, 4.14, c.fd / 2 + 0.12, 2.1, 0.16, 0.3, CONC, 0xeeeeee, { n: 2, step: [c.fw / 2 + 2.5, 0, 0] }), ...sign(0, 7.15, c.fd / 2 + 0.2, c.fw - 4, 1, 0x2f6f6a, T.white).concat([txt(0, 7.4, c.fd / 2 + 0.32, Math.min(c.fw - 5, 8), 0.72, 'CORNER STORE')]), ...pipes(c, 6.8, 0.3),
            box(c.fw / 2 + 0.1, 4.3, -c.fd / 4, 0.08, 1.75, 1.75, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'r', top: false, n: 2, step: [0, 0, c.fd / 2] }), ...[-3, 3].flatMap(x => lamp(x, 2.7, c.fd / 2 + 0.3))],
        'P02-11-B3': c => [...ring(c, 0, 0.5, 0.1, CONC, 0xb8b0a0).slice(1), box(-3.45, 0, c.fd / 2 + 0.16, 0.35, 4.1, 0.3, PLAIN, 0x5a3a26, { n: 2, step: [6.9, 0, 0] }), box(0, 3.8, c.fd / 2 + 0.16, 7.3, 0.4, 0.3, PLAIN, 0x5a3a26),
            truss(0, 4.3, c.fd / 2 + 1.6, 0.5, 0.5, 3.2, T.yellow), box(0, 3.3, c.fd / 2 + 2.9, 0.08, 1, 0.08, PLAIN, T.dark), box(0, 3.05, c.fd / 2 + 2.9, 0.3, 0.3, 0.3, PLAIN, T.dark), box(0, 4.55, c.fd / 2 + 0.5, c.fw + 0.8, 0.16, 0.2, PLAIN, T.dark),
            ...pipes(c, 4.5, 0.3), ...lamp(-5, 3.6, c.fd / 2 + 0.3), ...sign(c.fw / 2 - 2.6, 2.2, c.fd / 2 + 0.1, 2.6, 1, T.white, 0x2f5f8a, 'BOAT REPAIR', '#2f5f8a'), box(c.fw / 2 + 0.1, 2.4, 0, 0.1, 1.3, c.fd - 3, U('GlassWindowFactory1a'), T.glass),
            streaks(-c.fw / 2 + 1.2, 1.2, -c.fd / 2 - 0.09, 3.2, 4, (c.fw - 2.4) / 3), box(0, 0, c.fd / 2 + 2, 0.14, 0.14, 4, PLAIN, T.dark, { n: 2, step: [1.6, 0, 0], p: [-0.8, 0, c.fd / 2 + 2] })],
        'P03-11-B1': (c, C0) => { const wx = C0.fw / 2 - 3 - c.ox, wz = -C0.fd / 2 + 3.5 - c.oz, W = c.fw / 2 + 0.7, F = c.fd / 2 + 0.7;
            const o = [...ring(c, 0, 0.6, 0.12, CONC, 0xcfc8b8), ...doorTrim(c, T.dark, 0.9).slice(0, 2), box(-W, 3.5, F, 0.22, 3, 0.22, PLAIN, T.cream, { n: 2, step: [2 * W, 0, 0] }), box(-W, 3.5, -F, 0.22, 3, 0.22, PLAIN, T.cream, { n: 2, step: [2 * W, 0, 0] }),
                box(-W + 0.1, 3.5, F + 0.04, 0.12, 3, 0.1, PLAIN, T.cream, { n: 8, step: [(2 * W - 0.2) / 7, 0, 0] }), box(0, 3.5, F + 0.04, 2 * W, 0.7, 0.1, PLAIN, T.cream), box(0, 3.5, -F - 0.04, 2 * W, 0.7, 0.1, PLAIN, T.cream),
                box(W + 0.04, 3.5, 0, 0.1, 0.7, 2 * F, PLAIN, T.cream), box(-W - 0.04, 3.5, 0, 0.1, 0.7, 2 * F, PLAIN, T.cream), box(W + 0.04, 3.5, -F + 0.1, 0.1, 3, 0.12, PLAIN, T.cream, { n: 6, step: [0, 0, (2 * F - 0.2) / 5] }),
                ...sign(0, 2.45, c.fd / 2 + 0.14, 5, 0.6, T.cream, T.dark, 'RAIL SERVICE', '#22262a'), cyl(-W - 1.2, 6.5, 0, 0.06, 0.01, PLAIN, T.dark, { seg: 4 }), box(-c.fw / 2 - 1.5, 6.4, F + 0.6, 0.12, 1.2, 0.12, PLAIN, T.dark, { n: 2, step: [c.fw + 3, 0, 0] }),
                cyl(wx, 7.9, wz, 2.36, 0.2, PLAIN, T.dark, { seg: 16, cap: false, n: 2, step: [0, 1.4, 0] }), box(wx - 3.2, 6.6, wz, 2, 0.3, 0.3, PLAIN, T.dark), ladder(wx + 1.45, wz, 9.4), truss(wx, 3.4, wz - 1.2, 2.4, 0.3, 0.1, T.dark), truss(wx, 3.4, wz + 1.2, 2.4, 0.3, 0.1, T.dark)];
            for (let i = 0; i < 9; i++) o.push(box(c.fw / 2 + 1.5, 0, c.fd / 2 - 0.4 - i * 0.55, 1.2, 0.39 * (i + 1), 0.55, PLAIN, T.dark));   // the outside stair to the lever floor, stepped boxes
            o.push(truss(c.fw / 2 + 2.12, 0.4, c.fd / 2 - 2.6, 0.06, 4.2, 5, T.dark));
            const sx = -c.fw / 2 - 3, sz = c.fd / 2 + 1;   // a semaphore signal in the yard
            o.push(cyl(sx, 0, sz, 0.1, 7.5, PLAIN, T.white, { seg: 6 }), box(sx + 0.8, 6.6, sz, 1.6, 0.35, 0.08, PLAIN, T.red), box(sx + 1.3, 6.6, sz + 0.02, 0.25, 0.35, 0.08, PLAIN, T.white), box(sx, 6.1, sz + 0.12, 0.25, 0.25, 0.1, null, 0xff3020, { glow: 1 }), box(sx, 0, sz, 0.5, 0.3, 0.5, CONC, 0xbbbbbb));
            return o; },
    };
    const houseMore = (c, tint) => { const long = c.fd > c.fw, nd = Math.max(2, Math.floor(c.fw / 5.5)), sx = c.fw / nd, x0 = -c.fw / 2 + sx / 2, F = c.fd / 2, WH = 0xf4f1ea;
        const o = [...ring(c, 0, 0.45, 0.1, CONC, 0xb8b0a0), ...corners(c, 0.45, 6.15, 0.3, PLAIN, WH), box(0, 3.4, F + 0.08, c.fw + 0.2, 0.18, 0.12, PLAIN, WH),
            box(x0, 2.3, F + 0.55, 1.7, 0.12, 1, U('MetalCorrugatedPainted3a'), 0xffffff, { n: nd, step: [sx, 0, 0], under: true }), box(x0 - 0.75, 0.3, F + 0.95, 0.1, 2, 0.1, PLAIN, WH, { n: nd, step: [sx, 0, 0] }), box(x0 + 0.75, 0.3, F + 0.95, 0.1, 2, 0.1, PLAIN, WH, { n: nd, step: [sx, 0, 0] }),
            box(x0, 4.14, F + 0.12, 2.05, 0.14, 0.28, PLAIN, WH, { n: nd, step: [sx, 0, 0] }), box(x0, 6.05, F + 0.1, 2.05, 0.16, 0.16, PLAIN, WH, { n: nd, step: [sx, 0, 0] }),
            box(x0 - 1.1, 4.3, F + 0.1, 0.4, 1.75, 0.06, PLAIN, 0x3d5a4a, { n: nd, step: [sx, 0, 0] }), box(x0 + 1.1, 4.3, F + 0.1, 0.4, 1.75, 0.06, PLAIN, 0x3d5a4a, { n: nd, step: [sx, 0, 0] }),
            box(x0 + 0.85, 2.05, F + 0.2, 0.22, 0.22, 0.2, null, LAMP, { glow: 0.8, n: nd, step: [sx, 0, 0] }), ...pipes(c, 6.6, 0.25),
            box(0, 1.6, -F - 0.1, 1.75, 1.75, 0.08, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'b', top: false, n: 1 }), box(-c.fw / 2 + sx / 2, 4.3, -F - 0.1, 1.75, 1.75, 0.08, U('DecalWindowsResidential1a'), 0xffffff, { uv: 'fit', faces: 'b', top: false, n: nd, step: [sx, 0, 0] })];
        if (!long) o.push(box(0, 6.5, F + 0.55, c.fw + 1.1, 0.14, 0.18, PLAIN, T.dark), box(0, 6.5, -F - 0.55, c.fw + 1.1, 0.14, 0.18, PLAIN, T.dark));
        else o.push(box(c.fw / 2 + 0.55, 6.5, 0, 0.18, 0.14, c.fd + 1.1, PLAIN, T.dark), box(-c.fw / 2 - 0.55, 6.5, 0, 0.18, 0.14, c.fd + 1.1, PLAIN, T.dark));
        o.push(box(long ? 1.5 : -c.fw / 3.4, 10.4, long ? -c.fd / 3.4 : 1.5, 1.15, 0.18, 1.15, CONC, 0xd0d0d0, { n: 3, step: long ? [0, 0, c.fd / 3.4] : [c.fw / 3.4, 0, 0], roof: true }));
        return o; };
    ['P00-09-B2', 'P02-09-B2', 'P00-10-B2', 'P01-11-B2'].forEach(id => { MORE[id] = c => houseMore(c); });
    /* THE ROOFS + THE AC UNITS + MORE SHEETS (mondo 20:18 "roofs and ac units", 20:19 "different textures or decals for different parts of the building"): a third list.
       ac = a roof unit (a steel case, a grill top, on a dark skid); wac = a wall unit on brackets; parapet = a coping ring round a flat roof; walk = a rubber roof walkway;
       manhole = the urban pack's cover decal on the yard. On the five walked roofs (the roof route) only the edges and corners are dressed. */
    const ac = (x, y, z, o) => [box(x, y, z, 1.9, 0.14, 1.3, PLAIN, T.dark, Object.assign({ roof: true }, o)), box(x, y + 0.14, z, 1.7, 0.95, 1.15, U('MetalCorrugatedPainted1c'), 0xdfe3e6, Object.assign({ roof: true, keyTop: GRILL, tintTop: 0xffffff }, o))];
    const wac = (x, y, z, side, o) => [box(x, y, z, side ? 0.5 : 0.9, 0.6, side ? 0.9 : 0.5, GRILL, 0xe6e6e6, o), box(x, y - 0.08, z, side ? 0.56 : 0.96, 0.08, side ? 0.96 : 0.56, PLAIN, T.dark, o)];
    const parapet = (c, y, h, key, tint) => ring(Object.assign({}, c, { door: null }), y, h, 0.3, key, tint, { roof: true });
    const walk = (x, y, z, w, d) => box(x, y, z, w, 0.05, d, U('RubberNonSlip1a'), 0xffffff, { roof: true, sides: false });
    const duct = (x, y, z, w, d) => box(x, y, z, w, 0.5, d, U('MetalCorrugatedPainted1c'), 0xcfd3d6, { roof: true });
    const hatch = (x, y, z) => [box(x, y, z, 1.3, 0.35, 1.3, CONC, 0x8d9094, { roof: true }), box(x, y + 0.35, z, 1.4, 0.08, 1.4, PLAIN, T.dark, { roof: true })];
    const manhole = (x, z, n, dx) => ({ s: 'quad', flat: true, p: [r3(x), 0.03, r3(z)], size: [1.1, 1.1], key: U('DecalManholeCover'), kind: 'over', uv: 'fit', n: n || 1, step: [dx || 0, 0, 0] });
    const ROOFS = {
        'P00-08-B1': c => [...ac(c.fw / 2 - 1.6, 7.12, c.fd / 2 - 1.4), ...ac(c.fw / 2 - 1.6, 7.12, c.fd / 2 - 3.2), manhole(-c.fw / 2 - 2, c.fd / 2 + 1.5)],
        'P01-08-B1': c => [...wac(c.fw / 2 + 0.3, 2.4, c.fd / 4, true), ...wac(-c.fw / 2 - 0.3, 2.4, -c.fd / 4, true)],
        'P01-08-B2': c => [...wac(-c.fw / 2 - 0.3, 5, 1.5, true), box(0, 0.5, -c.fd / 2 - 0.1, c.fw - 2, 2.6, 0.08, U('TileGeneric2a'), 0xe8e2d2, { faces: 'b', top: false })],
        'P01-08-B3': c => [...wac(-c.fw / 2 - 0.3, 2.6, 0, true), box(-c.fw / 2 + 2, 4.8, c.fd / 2 - 1.5, 1.2, 0.5, 1.2, GRILL, 0xffffff, { roof: true })],
        'P02-08-B1': c => [...parapet({ fw: 11.5, fd: 9.4 }, 16.1, 0.5, CONC, T.dark).map(q => (q.p[0] = r3(q.p[0] + 8), q.p[2] = r3(q.p[2] - c.fd / 2 + 5), q)), ...ac(6, 16.1, -c.fd / 2 + 3), ...ac(10, 16.1, -c.fd / 2 + 3),
            duct(8, 16.1, -c.fd / 2 + 6.5, 7, 0.7), ...hatch(11.8, 16.1, -c.fd / 2 + 8), walk(-6.75, 10.62, -c.fd / 2 + 8.8, 12, 1), box(c.fw / 2 - 1.2, 10.6, -c.fd / 2 + 11.5, 1.6, 2.4, 1.6, 'bricks_3', T.dbrick, { roof: true, keyTop: ROOF }),
            ...wac(c.fw / 2 + 0.3, 3, c.fd / 4, true), box(0, 1.1, -c.fd / 2 - 0.12, c.fw - 6, 2.6, 0.1, U('DecalWindowsFactory1a'), 0xffffff, { faces: 'b', top: false, win: 'keep', uv: [3.5, 2.6] }), manhole(c.door.lx + 4, c.fd / 2 + 2.5, 2, 3)],
        'P03-08-B1': c => [box(0, 7.1, c.fd / 2 - 0.9, c.fw - 1, 0.06, 1.5, U('RubberNonSlip1a'), 0xffffff, { roof: true, sides: false }), ...ac(c.fw / 2 - 2, 7.12, c.fd / 2 - 0.9), ...ac(c.fw / 2 - 4.4, 7.12, c.fd / 2 - 0.9),
            duct(0, 7.12, c.fd / 2 - 0.9, c.fw / 2, 0.6), ...ring(Object.assign({}, c, { door: null }), 7, 0.35, 0.2, CONC, 0x77777a, { roof: true }), ...wac(-c.fw / 2 - 0.3, 2.2, 3, true)],
        'P03-08-B2': c => [...ac(-2.5, 3.45, -1.6), ...ac(2.5, 3.45, -1.6), duct(0, 3.45, -1.6, 3.2, 0.6), cyl(4.5, 3.45, 1.2, 0.3, 1.1, PLAIN, T.silver, { seg: 8, roof: true }), cyl(4.5, 4.55, 1.2, 0.45, 0.2, PLAIN, T.dark, { r2: 0.1, seg: 8, roof: true }),
            box(0, 0, -c.fd / 2 - 0.1, c.fw - 1, 3, 0.08, U('TileSubway1a'), 0xffffff, { faces: 'b', top: false, uv: 1.75, n: 1 })],
        'P01-09-B1': c => { const R = c.fw / 2 + 1.5; return [...ac(-R + 1.6, 7.12, -R + 1.4), ...ac(-R + 3.8, 7.12, -R + 1.4), box(0, 7.1, 0, 2 * R + 0.3, 0.3, 0.2, PLAIN, T.dark, { roof: true, p: [0, 7.1, -R - 0.02] }), manhole(R + 1.5, R + 1), txt(0, 6.2, R + 0.07, 8, 0.6, 'LOADING OFFICE', '#22262a')]; },
        'P02-09-B1': c => [...parapet({ fw: 8.8, fd: c.fd + 0.2 }, 4.4, 0.3, CONC, T.dark).map(q => (q.p[0] = r3(q.p[0] - c.fw / 2 + 4), q)), ...ac(-c.fw / 2 + 2.6, 4.4, -2), ...hatch(-c.fw / 2 + 5.5, 4.4, 2.5), ...wac(-c.fw / 2 + 7.95, 2.4, 2, true),
            box(4, 0.04, 0, 13, 0.04, c.fd - 1.5, U('TileGeneric5a'), 0x9a9a94, { sides: false }), manhole(-1.5, c.fd / 2 - 1.2, 3, 4.5)],
        'P03-09-B1': c => [...ac(c.fw / 2 - 1.3, 7.1, c.fd / 2 - 1.2), ...ac(c.fw / 2 - 1.3, 7.1, -c.fd / 2 + 1.2), walk(c.fw / 2 - 8.6, 7.12, 0, 1, c.fd - 1), ...parapet(c, 7, 0.35, PLAIN, T.dblue),
            box(0, 0.5, -c.fd / 2 - 0.1, c.fw - 2, 2.6, 0.08, U('TileGeneric4a'), 0xdfe6ea, { faces: 'b', top: false }), ...wac(-c.fw / 2 - 0.3, 2.4, 2, true), ...wac(-c.fw / 2 - 0.3, 2.4, -2, true)],
        'P03-09-B2': c => [...ac(0, 3.35, -3), ...wac(-2.85, 1.6, -4.5, true)],
        'P00-10-B1': c => [...wac(-c.fw / 2 - 0.3, 5, 2, true), ...wac(-c.fw / 2 - 0.3, 1.9, -2, true), box(-4.4, 9.95, 0, c.fw - 14, 0.2, 0.5, PLAIN, T.copper, { roof: true })],
        'P01-10-B1': c => [...wac(c.fw / 2 + 0.3, 1.2, c.fd / 2 - 2, true), box(-c.fw / 4, 5.5, c.fd / 2 + 0.12, 1.4, 0.9, 0.08, GRILL, 0xffffff, { n: 2, step: [c.fw / 2, 0, 0] }), box(-c.fw / 4, 5.5, -c.fd / 2 - 0.12, 1.4, 0.9, 0.08, GRILL, 0xffffff, { n: 2, step: [c.fw / 2, 0, 0] })],
        'P01-10-B2': c => [...ac(-2, 4.2, -1.5), ...ac(2.2, 4.2, -1.5), ...hatch(c.fw / 2 - 2, 4.2, -c.fd / 2 + 2), box(0, 4.2, -c.fd / 2 - 0.02, c.fw + 0.3, 0.45, 0.25, CONC, 0x8d8d8d, { roof: true }),
            box(c.fw / 2 + 0.02, 4.2, -0.4, 0.25, 0.45, c.fd - 0.6, CONC, 0x8d8d8d, { roof: true }), box(-c.fw / 2 - 0.02, 4.2, -0.4, 0.25, 0.45, c.fd - 0.6, CONC, 0x8d8d8d, { roof: true }), ...wac(-c.fw / 2 - 0.3, 2.3, 1.5, true),
            box(0, 0.45, c.fd / 2 + 0.07, c.fw - 0.4, 0.5, 0.06, 'bricks_3', T.brick, { faces: 'f', top: false })],
        'P01-10-B3': c => [...wac(c.fw / 2 - 1.2, 2.6, c.fd / 2 + 0.36, false)],
        'P02-10-B1': c => [...ac(-c.fw / 2 + 2, 7.4, c.fd / 2 - 1.3), ...ac(-c.fw / 2 + 4.4, 7.4, c.fd / 2 - 1.3), ...ac(c.fw / 2 - 2, 7.4, -c.fd / 2 + 1.3), duct(0, 7.4, -c.fd / 2 + 1.3, c.fw / 2, 0.6), walk(0, 7.41, c.fd / 2 - 1.3, c.fw / 2, 0.9),
            ...hatch(c.fw / 2 - 2, 7.4, c.fd / 2 - 1.3), box(0, 7.4, c.fd / 2 + 0.2, c.fw + 0.8, 0.4, 0.2, PLAIN, T.dark, { roof: true, n: 2, step: [0, 0, -c.fd - 0.4] }), ...wac(c.fw / 2 + 0.3, 2.2, 3, true)],
        'P03-10-B1': c => [...wac(-c.fw / 2 + 2, 2.9, c.fd / 2 + 0.3, false), box(-c.fw / 4, 11.25, 0, 1.2, 0.5, 1.2, GRILL, 0xffffff, { roof: true, n: 3, step: [c.fw / 4, 0, 0] })],
        'P03-10-B2': c => [...ac(-c.fw / 2 + 2, 3.85, 0), ...ac(-c.fw / 2 + 4.3, 3.85, 0), ...hatch(-c.fw / 2 + 2, 3.85, c.fd / 2 - 1.5), ...parapet(c, 3.85, 0.3, CONC, T.dark), ...wac(-c.fw / 2 - 0.3, 2.2, 0, true)],
        'P01-11-B1': c => [...wac(c.fw / 2 + 0.3, 2.2, 1, true), box(0, 1, -c.fd / 2 - 0.12, c.fw - 3, 2.6, 0.1, U('DecalWindowsFactory1a'), 0xffffff, { faces: 'b', top: false, win: 'keep', uv: [3.5, 2.6] }), manhole(-c.fw / 2 - 2.6, c.fd / 2 + 1.2, 2, 2)],
        'P02-11-B1': c => [...ac(-c.fw / 2 + 1.4, 3.95, -c.fd / 2 + 1.2), ...hatch(c.fw / 2 - 1.3, 3.95, c.fd / 2 - 1.3), walk(0, 3.96, c.fd / 2 - 1.3, c.fw - 4, 0.9), manhole(c.fw / 2 + 2.2, -2, 2, 0), manhole(-2, c.fd / 2 + 2.2, 2, 4)],
        'P02-11-B2': c => [...ac(-2, 7.15, -1.5), ...ac(2, 7.15, -1.5), ...hatch(c.fw / 2 - 1.6, 7.15, -c.fd / 2 + 1.6), ...parapet(c, 7.15, 0.45, PLAIN, T.white).slice(1), ...wac(-c.fw / 2 - 0.3, 5, 0, true),
            box(0, 0.5, c.fd / 2 + 0.07, c.fw - 0.6, 0.02, 0.02, PLAIN, T.white), box(0, 0, -c.fd / 2 - 0.1, c.fw - 1, 3.5, 0.08, 'bricks_3', T.brick, { faces: 'b', top: false })],
        'P02-11-B3': c => [...wac(c.fw / 2 + 0.3, 3, -1, true), box(c.fw / 4, 5.6, -c.fd / 4, 1.2, 0.5, 1.2, GRILL, 0xffffff, { roof: true })],
        'P03-11-B1': c => [...wac(-c.fw / 2 - 0.3, 1.9, 0, true), box(0, 0.6, -c.fd / 2 - 0.1, c.fw - 1, 2.6, 0.08, U('TileSubway3a'), 0xe6dcc6, { faces: 'b', top: false, n: 1 })],
    };
    ['P00-09-B2', 'P02-09-B2', 'P00-10-B2', 'P01-11-B2'].forEach((id, i) => { ROOFS[id] = c => [...wac(c.fw / 2 + 0.3, 4.6, i % 2 ? 1.5 : -1.5, true), ...wac(-c.fw / 2 - 0.3, 1.6, i % 2 ? -2 : 2, true), box(0, 0.45, c.fd / 2 + 0.07, c.fw + 0.1, 0.55, 0.06, 'bricks_3', T.brick, { faces: 'f', top: false })]; });
    const texbDoor = f => { const L = Math.max(2, +f.w || 8) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (isFinite(+f.door) && +f.door >= 1) col = Math.min(cols - 1, Math.round(+f.door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw, cols }; };   // data.js hqTexbDoor
    const count2 = { arch: 0, parts: 0, inside: 0 }, out = [];
    bInfo.filter(b => b.d === 'I').forEach(b => {
        const DS = DESIGN[b.id]; if (!DS) { console.log('industrial: no design for', b.id, b.name); return; }
        const i = features.findIndex(f => f.id === 'dc:' + b.id), old = features[i], rot = ROT[b.side], ew = b.side === 'E' || b.side === 'W';
        const C0 = { fw: ew ? b.d2 : b.w, fd: ew ? b.w : b.d2 }, q = rot * Math.PI / 180, cs = Math.cos(q), sn = Math.sin(q);
        const world = (lx, lz) => [r3(b.x + lx * cs - lz * sn), r3(b.z + lx * sn + lz * cs)];
        let c = { fw: C0.fw, fd: C0.fd, ox: 0, oz: 0 }, row;
        if (old.k === 'plateau' && !DS.inside) { old.bld = Object.assign({}, old.bld, { skin: false }); row = null; }
        else {
            /* the collision row: the tool's own texbuilding (or, for a walk-in roof tier, one in the plateau's place), in the front frame */
            row = { k: 'texbuilding', id: old.id, x: b.x, z: b.z, w: r3(C0.fw), d: r3(C0.fd), rot, storeys: DS.st || 2, style: 'factory', seed: old.seed != null ? old.seed : (old.bld ? old.bld.seed : i), skin: false };
            let doorLx = null;
            if (DS.inside) {
                row.hollow = true;
                if (old.k === 'texbuilding' && old.door) row.door = old.door;
                else {   // a roof tier had no doorway: the plan's first door, as the tool counts it
                    const pb = plotOf[b.plot].buildings.find(v => v.id === b.id), dr = pb.doors[0];
                    const k = b.side === 'S' ? (dr.x - pb.x) : b.side === 'N' ? (pb.x + pb.w - 1 - dr.x) : b.side === 'E' ? (pb.y + pb.h - 1 - dr.y) : (dr.y - pb.y); row.door = Math.round(k * C / 1.75) + 1;
                }
                doorLx = texbDoor(row).lx;
                if (DS.leaf) row.leaf = DS.leaf;
            }
            if (DS.fit) {   // a body smaller than the plan's footprint: the row shrinks to it, its doorway kept where the plan put it
                const F = DS.fit(C0), wp = world(F[0], F[1]); row.x = wp[0]; row.z = wp[1]; row.w = r3(F[2]); row.d = r3(F[3]); c = { fw: F[2], fd: F[3], ox: F[0], oz: F[1] };
                if (DS.inside) { const L = row.w - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; row.door = Math.max(1, Math.min(cols, Math.round((doorLx - F[0] + L / 2) / cw + 0.5))); }
            }
            if (DS.inside) { c.door = texbDoor(row); count2.inside++; }
            features[i] = row;
            (DS.extra ? DS.extra(C0) : []).forEach((X, n) => { const wp = world(X[0], X[1]); out.push({ k: 'texbuilding', id: old.id + '-x' + (n + 1), x: wp[0], z: wp[1], w: r3(X[2]), d: r3(X[3]), rot, storeys: X[4] || 2, style: 'factory', seed: 9500 + n, skin: false }); });
        }
        const wp = world(c.ox, c.oz), parts = DS.parts(c, C0).concat(MORE[b.id] ? MORE[b.id](c, C0) : [], ROOFS[b.id] ? ROOFS[b.id](c, C0) : []).filter(q => q && q.size ? q.size.every(v => v > 0) : !!q);
        out.push({ k: 'arch', id: 'ind:' + b.id, x: wp[0], y: 0, z: wp[1], rot, parts });   // y: 0 = stand on the ground, never on a roof-route plateau's 7 m top
        count2.arch++; count2.parts += parts.length;
    });
    /* DOCK EDGE (P00-11, no building): the port crane, the district's landmark — a truss gantry over the quay, a container on its hook */
    (function () {
        const p = plotOf['P00-11'], x = gx(p.x * N + 3.5), z = gx(p.y * N + 9), Y = T.yellow;
        out.push({ k: 'arch', id: 'ind:crane', x, y: 0, z, rot: 0, parts: [
            ...[[-5, -3.5], [-5, 3.5], [5, -3.5], [5, 3.5]].map(q => truss(q[0], 0, q[1], 1.4, 22, 1.4, Y)), truss(0, 20, -3.5, 11.4, 1.6, 1.4, Y), truss(0, 20, 3.5, 11.4, 1.6, 1.4, Y),
            truss(0, 22, 0, 3, 2.2, 30, Y), box(0, 24.2, 0, 4, 3, 5, PLAIN, Y), truss(0, 27.2, 0, 0.6, 5, 0.6, Y), box(0, 14.9, 9.5, 0.15, 7.1, 0.15, PLAIN, T.dark),
            box(0, 12.6, 9.5, 6.1, 2.3, 2.5, TIN, CT[1], { uv: [1.75, 2.3] }), ...[[-5, -3.5], [-5, 3.5], [5, -3.5], [5, 3.5]].map(q => box(q[0], 0, q[1], 2.2, 0.6, 2.2, U('ConcreteStriped2a'), 0xbbbbbb)),
            /* the polish pass: the rails it rides, hazard plates on its feet, the cab's windows, a ladder up one leg, the beacon */
            box(-5, 0, 0, 0.3, 0.12, 34, PLAIN, T.dark, { n: 2, step: [10, 0, 0] }), box(-5, 0.7, 4.62, 0.9, 0.9, 0.06, U('SignHazard1a'), 0xffffff, { uv: 'fit', faces: 'f', top: false, n: 2, step: [10, 0, 0] }),
            box(0, 25.2, 0, 4.1, 1.2, 5.1, U('GlassWindowSquare1a'), 0xffffff, { win: 'keep', top: false }), truss(5.75, 0.6, 3.5, 0.08, 19.4, 0.6, T.dark), box(0, 32.2, 0, 0.35, 0.35, 0.35, null, 0xff3020, { glow: 1 }),
            box(0, 21.9, 13, 3.2, 0.3, 0.3, PLAIN, T.dark, { n: 2, step: [0, 0, -26] })] });
        count2.arch++;
        /* the legs block (four ghost posts) */
        [[-5, -3.5], [-5, 3.5], [5, -3.5], [5, 3.5]].forEach((q, n) => out.push({ k: 'texbuilding', id: 'dc:ind-crane-leg' + n, x: r3(x + q[0]), z: r3(z + q[1]), w: 2.2, d: 2.2, rot: 0, storeys: 2, style: 'factory', seed: 9600 + n, skin: false }));
    })();
    /* THE INDUSTRIAL PACK's pieces (domi236, cut by bake-pack-pieces.py ind_*): container stacks on the dock and in the yards, a silo, skips, panels —
       on squares nothing else took (a decorative prop already there gives way: the yard is the stack's) */
    const drop = (cx, cy) => { for (let k = props.length - 1; k >= 0; k--) { const q = props[k]; if (Math.abs(q.x - gc(cx)) < C / 2 && Math.abs(q.z - gc(cy)) < C / 2 && DECOR.has(q.key)) props.splice(k, 1); } };
    const okCell = (cx, cy) => '.'.indexOf(cellAt(cx, cy)) >= 0 && !props.some(q => Math.abs(q.x - gc(cx)) < C / 2 && Math.abs(q.z - gc(cy)) < C / 2 && !DECOR.has(q.key)) && plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))].d === 'I';
    const stackAt = (cx, cy, levels, face) => {   // one 20 ft box lies across two squares (cx, cx+1 when face 90; cy, cy+1 when 0), centred on their shared line
        const two = face === 90 ? [[cx, cy], [cx + 1, cy]] : [[cx, cy], [cx, cy + 1]];
        if (!two.every(q => okCell(q[0], q[1]))) return 0;
        two.forEach(q => { drop(q[0], q[1]); take(q[0], q[1]); });
        const x = face === 90 ? gx(cx + 1) : gc(cx), z = face === 90 ? gc(cy) : gx(cy + 1);
        for (let l = 0; l < levels; l++) props.push(Object.assign({ key: 'ind_container', x: r3(x), z: r3(z), face }, l ? { y: r3(l * 2.15) } : {}));
        return levels;
    };
    let boxes = 0;
    const dk = plotOf['P00-11'], dx0 = dk.x * N, dy0 = dk.y * N;
    [[6, 7, 3, 90], [6, 8, 2, 90], [8, 7, 2, 90], [8, 8, 3, 90], [6, 10, 2, 90], [8, 10, 1, 90], [1, 1, 2, 0], [2, 1, 1, 0], [1, 3, 1, 0]].forEach(q => { boxes += stackAt(dx0 + q[0], dy0 + q[1], q[2], q[3]); });
    const cc = plotOf['P00-09'], cx0 = cc.x * N, cy0 = cc.y * N;
    [[1, 1, 2, 90], [1, 2, 1, 90]].forEach(q => { boxes += stackAt(cx0 + q[0], cy0 + q[1], q[2], q[3]); });
    const one = (plot, lx, ly, key, face) => { const p = plotOf[plot], cx = p.x * N + lx, cy = p.y * N + ly; if (!okCell(cx, cy)) return 0; drop(cx, cy); take(cx, cy); props.push({ key, x: gc(cx), z: gc(cy), face: face || 0 }); return 1; };
    count2.silo = one('P01-08', 9, 2, 'ind_silo') + one('P01-10', 2, 8, 'ind_silo');
    count2.skip = one('P01-08', 8, 4, 'ind_skip_full', 90) + one('P02-11', 9, 8, 'ind_skip', 0) + one('P01-10', 9, 4, 'ind_skip_full', 90);
    count2.panel = one('P02-09', 9, 1, 'ind_panel', 180) + one('P02-09', 9, 2, 'ind_panel', 180);
    count2.boxes = boxes;
    /* the F22 in the hangar: 15.5 x 10.6 m = five squares by three, its nose along the hangar, the row of squares behind the front wall left as the walkway */
    (function () { const b = bInfo.find(v => v.id === 'P03-10-B1'); if (!b) return; const ew = b.side === 'E' || b.side === 'W', fd = ew ? b.w : b.d2, q = ROT[b.side] * Math.PI / 180, lz = fd / 2 - 8.6;
        if (fd < 13.9) { console.log('industrial: the hangar is', fd, 'm deep, the jet stays out'); return; }
        const fw = ew ? b.d2 : b.w, lx = Math.round(fw / C) % 2 ? 0 : -C / 2;   // an even count of squares along the hangar: half a square off, so it fills whole squares
        props.push({ key: 'fighter_jet', x: r3(b.x + lx * Math.cos(q) - lz * Math.sin(q)), z: r3(b.z + lx * Math.sin(q) + lz * Math.cos(q)), face: ew ? 0 : 90 }); count2.jet = 1; })();
    lateRows.push(...out);
    console.log('industrial', JSON.stringify(count2));
};
