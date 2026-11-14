/* docs/disaster-city/districts/I.js — THE INDUSTRIAL DISTRICT (2026-11-13, the Industrial thread; mondo: "architect the buildings ... every building should be unique and purposeful and
   recognizable"): every building of plots x 0-3, y 8-11 as an `arch` row (areas-complexes.md THE ARCHITECTURE ROW) written in the building's FRONT
   FRAME (front = +z, x along the front; the row's `rot` is its texbuilding's), its collision the row the tool already wrote with `skin: false`:
   a walk-in keeps `hollow` (the city door hangs in the doorway), an outside-only building is a solid texbuilding, a roof-route tier stays a
   plateau (the two walk-in tiers, Freight gate + Loading office, become hollow texbuildings: two storeys = the same 7 m walked roof slab).
   Run by bake-disaster-city.js (THE DISTRICT FILES: `build(ctx)`, after every row exists). Everything here touches Industrial rows only. Notes: areas-complexes.md "DISASTER CITY, THE INDUSTRIAL DISTRICT". */
'use strict';
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
        'P03-10-B1': { inside: true, st: 2, leaf: 'leaf_exit', fit: c => [0, C / 2, c.fw, c.fd + C], parts: c => [   // HANGAR: a long arched hangar, its open end to the apron (7 m walls: the F22 inside stands 5 m)
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
    /* THE INSIDES (2026-11-13, mondo 21:04 "let's go ahead and do the interiors", his "all okay" 22:25 on the plan /mnt/project-files/disaster-city-industrial/interiors_plan_1..3.jpg;
       his grid rule 21:14 + 21:17: a blocker fills WHOLE 3.5 m battle squares, centred; a walkway is whole empty squares; decoration sits off centre / on the walls).
       A room is written on its own squares: i from the LEFT wall (the building's -x), j from the FRONT wall (j 0 = the row the door opens on). `g` = the blockers
       [kit, i, j, squares wide, squares deep, option]; every square of one gets a ghost block. `walls` = partitions on the lines between squares [i0, j0, i1, j1], a
       doorway = a one-square gap. `decor(K)` = the off-centre dressing. Built pieces with no model (turbines, pumps, counters, plinths) are parts of the room's one
       arch row `ind:<id>:in`. A prop's `hd`: 180 looks at the front wall (the door side), 0 at the back. */
    const TEAL2 = 0x2f6f6a, SUB = U('TileSubway1a');
    const KIT = {
        truck(K, x, z, gw, gd) { K.part(box(x, 0, z, gw - 0.3, 0.1, gd - 0.5, U('MetalCorrugatedPainted1c'), 0xaab0b6), box(x, 0.1, z, gw - 0.1, 0.02, gd - 0.3, null, T.yellow, { sides: false, kind: 'over' })); K.P('car_truck', x, z, gw > gd ? 90 : 0); },
        veh(K, x, z, gw, gd, o) { K.part(box(x, 0, z, 2.9, 0.08, gd - 0.6, U('MetalCorrugatedPainted1c'), 0x9aa0a6)); K.P(o, x, z, 0); },
        desk(K, x, z, gw, gd, o, hd) { const n = Math.max(1, Math.round(gw / C)); for (let k = 0; k < n; k++) { const dx = x - gw / 2 + (k + 0.5) * gw / n, s = hd === 180 ? 1 : -1;
            K.P('tanker_desk', dx, z, hd); K.P('crt_terminal', dx - 0.35, z, hd, 0.78); K.P('office_chair', dx, z - s * 0.95, hd); if (k % 2) K.P('rotary_phone', dx + 0.45, z, hd, 0.78); else K.P('desk_lamp', dx + 0.5, z, hd, 0.78); } },
        files(K, x, z, gw, gd, o, hd) { const long = gd > gw, n = Math.round((long ? gd : gw) / 0.8) - 1; for (let k = 0; k < n; k++) { const t = (k - (n - 1) / 2) * 0.8; K.P('filing_cabinet', long ? x : x + t, long ? z + t : z, long ? (o === 'r' ? 270 : 90) : hd); } },
        shelf(K, x, z, gw, gd, o, hd) { const long = gd > gw, n = Math.max(1, Math.round((long ? gd : gw) / 1.7)); for (let k = 0; k < n; k++) { const t = (k - (n - 1) / 2) * 1.7; K.P('metal_shelving', long ? x : x + t, long ? z + t : z, long ? (o === 'r' ? 270 : 90) : hd); } },
        racks(K, x, z, gw, gd, o, hd) { const long = gd > gw, n = Math.max(1, Math.round((long ? gd : gw) / 1.1)); for (let k = 0; k < n; k++) { const t = (k - (n - 1) / 2) * 1.1; K.P('server_rack', long ? x : x + t, long ? z + t : z, long ? (o === 'r' ? 270 : 90) : hd); } },
        lockers(K, x, z, gw, gd, o, hd) { const s = hd === 180 ? 1 : -1; for (let k = 0; k < 4; k++) K.P('locker', x - 1.05 + k * 0.7, z - s * 0.7, hd); K.P('locker_bench', x, z + s * 0.6, hd); },
        cont(K, x, z, gw, gd) { [-1.4, 1.4].forEach((dz, k) => { K.P('ind_container', x, z + dz, 90); K.P('ind_container', x, z + dz, 90, 2.15); if (k) K.P('ind_container', x, z + dz, 90, 4.3); }); },
        crates(K, x, z, gw, gd) { const n = Math.max(1, Math.round(gw / C)) * Math.max(1, Math.round(gd / C)), long = gd > gw; for (let k = 0; k < n; k++) { const t = (k - (n - 1) / 2) * C, cx = long ? x : x + t, cz = long ? z + t : z;
            K.P('psx_wooden_crate_3', cx - 0.7, cz - 0.6, 0); K.P('psx_wooden_crate_3', cx + 0.55, cz - 0.5, 90); K.P('psx_wooden_crate_3', cx - 0.1, cz + 0.65, 0); K.P('psx_wooden_crate_1', cx - 0.7, cz - 0.6, 30, 1.08); K.P('psx_wooden_crate_3', cx + 0.5, cz - 0.5, 0, 1.08); } },
        barrels(K, x, z) { [[-0.6, -0.5, 0], [0.5, -0.6, 2], [0, 0.5, 1], [-0.75, 0.6, 3], [0.8, 0.45, 0]].forEach(q => K.P('psx_metal_barrel_mp_' + q[2], x + q[0], z + q[1], 0)); },
        boiler(K, x, z, gw, gd, o, hd) { const n = Math.max(1, Math.round(gw / C)); for (let k = 0; k < n; k++) K.P('boiler', x - gw / 2 + (k + 0.5) * C, z, hd); K.part(box(x, 2.5, z, gw - 0.6, 0.5, 0.5, PLAIN, T.steel), cyl(x - gw / 2 + 0.8, 2.3, z, 0.25, K.H - 2.3, PLAIN, T.steel, { seg: 8 })); },
        panel(K, x, z, gw, gd, o, hd) { const n = Math.max(1, Math.round(gw / 1.75)); for (let k = 0; k < n; k++) K.P('retro_control_panel', x - gw / 2 + (k + 0.5) * gw / n, z, hd); },
        tesla(K, x, z) { K.P('meshy_tesla_coil', x, z, 0); K.part(box(x, 0, z, 2.6, 0.2, 2.6, CONC, 0x8d8d8d), truss(x, 0.2, z + 1.3, 2.6, 2.6, 0.05, T.yellow), truss(x, 0.2, z - 1.3, 2.6, 2.6, 0.05, T.yellow), truss(x + 1.3, 0.2, z, 0.05, 2.6, 2.6, T.yellow), truss(x - 1.3, 0.2, z, 0.05, 2.6, 2.6, T.yellow), haz(x, 1, z + 1.34)); },
        bench(K, x, z, gw, gd, o, hd) { const n = Math.max(1, Math.round(gw / 1.75)); for (let k = 0; k < n; k++) { const dx = x - gw / 2 + (k + 0.5) * gw / n; K.P('steel_table', dx, z, hd); if (k % 3 === 0) K.P('desk_lamp', dx, z, hd, 0.78); if (k % 3 === 1) K.P('clipboard_flat', dx, z, hd, 0.78); } K.part(box(x, 1.5, z + (hd === 180 ? -1 : 1) * 1.55, gw - 0.6, 0.9, 0.08, GRILL, 0xffffff)); },
        conv(K, x, z, gw, gd) { K.P('conveyor', x, z, 0); K.P('psx_wooden_crate_1', x - 1.5, z, 0, 0.9); K.P('psx_wooden_crate_1', x + 0.8, z, 20, 0.9); },
        counter(K, x, z, gw, gd, o) { K.part(box(x, 0, z, gw - 0.2, 1.05, 0.9, U('TileGeneric2a'), 0xd8d2c4), box(x, 1.05, z, gw, 0.08, 1.1, PLAIN, T.dark)); K.P('crt_terminal', x - gw / 4, z, 0, 1.13); K.P('clipboard_flat', x + gw / 4, z, 0, 1.13); },
        bigdesk(K, x, z, gw, gd, o, hd) { const s = hd === 180 ? 1 : -1; K.P('exec_desk', x, z, hd); K.P('exec_chair', x, z - s * 1.05, hd); K.P('desk_lamp', x + 0.8, z, hd, 0.78); K.P('rotary_phone', x - 0.7, z, hd, 0.78); },
        table(K, x, z) { K.P('round_table', x, z, 0); [[0, 1.25, 180], [0, -1.25, 0], [1.25, 0, 270], [-1.25, 0, 90]].forEach(q => K.P('cafeteria_chair', x + q[0], z + q[1], q[2])); },
        vend(K, x, z, gw, gd, o, hd) { K.P('vending_machine', x - 0.9, z, hd); K.P('water_cooler', x + 0.3, z, hd); K.P('mini_fridge', x + 1.1, z, hd); K.P('coffee_maker', x + 1.1, z, hd, 0.85); },
        seat(K, x, z, gw, gd, o, hd) { K.P('metro_bench', x - 0.6, z, hd); K.P('metro_bench', x + 0.9, z + 0.9, (hd + 90) % 360); },
        rocket(K, x, z) { K.part(box(x, 0, z, 2.6, 0.5, 2.6, CONC, 0x9a9a9a), truss(x - 0.9, 0.5, z, 0.25, 3.4, 0.25, T.yellow), truss(x + 0.9, 0.5, z, 0.25, 3.4, 0.25, T.yellow), box(x, 3.7, z, 2.2, 0.2, 0.3, PLAIN, T.yellow)); K.P('missile', x, z, 0, 0.5); },
        scope(K, x, z) { K.part(cyl(x, 0, z, 1.5, 0.5, U('TileMarble1a'), 0xdddddd, { seg: 20 }), cyl(x, 0.5, z, 1.1, 0.25, PLAIN, T.dblue, { seg: 20 })); K.P('brass_telescope', x, z, 0, 0.75); },
        dish(K, x, z) { K.part(box(x, 0, z, 2, 0.3, 2, CONC, 0x9a9a9a)); K.P('dish', x, z, 0, 0.3); },
        radio(K, x, z, gw, gd, o, hd) { K.P('monitor_stack', x - 0.6, z, hd); K.P('steel_table', x + 0.9, z, hd); K.P('retro_radio', x + 0.9, z, hd, 0.78); },
        chart(K, x, z) { K.P('conference_table', x, z, 0); K.P('globe_lamp', x + 0.9, z, 0, 0.78); },
        chairs(K, x, z, gw, gd, o, hd) { for (let k = 0; k < 6; k++) K.P('folding_chair', x - 0.9 + (k % 3) * 0.9, z - 0.5 + Math.floor(k / 3) * 1, hd); },
        missile(K, x, z) { K.part(box(x, 0, z, 1.6, 0.9, 2.6, U('MetalCorrugatedPainted1c'), 0x8f9aa5), box(x, 0.9, z, 0.3, 0.2, 2.8, PLAIN, T.yellow)); K.P('missile', x, z, 0, 1.1); },
        /* a turbine set (the second pass, 2026-11-14): the Meshy steam_turbine (7 m, its own plinth) on the first pass's concrete bed, the steam
           riser to the roof, a yellow rail round it. The first pass drew the set from shapes (drums, flanges) because no model existed. */
        turbine(K, x, z, gw, gd) { const long = gd > gw, L = (long ? gd : gw) - 1, Wd = (long ? gw : gd) - 1.4, at = (t, y, w, h, d, key, tint, o) => long ? box(x, y, z + t, d, h, w, key, tint, o) : box(x + t, y, z, w, h, d, key, tint, o);
            K.part(at(0, 0, L, 0.8, Wd + 0.8, CONC, 0xb9b1a2), cyl(long ? x : x - L * 0.3, 3.75, long ? z - L * 0.3 : z, 0.5, K.H - 3.75, PLAIN, T.steel, { seg: 10 }), cyl(long ? x : x - L * 0.3, 3.75, long ? z - L * 0.3 : z, 0.75, 0.25, PLAIN, T.dark, { seg: 10 }),
                box(x + (long ? Wd / 2 + 0.25 : 0), 0.8, z + (long ? 0 : Wd / 2 + 0.25), long ? 0.05 : L, 0.9, long ? L : 0.05, TRUSS, T.yellow, { kind: 'over', ds: true }),
                box(x - (long ? Wd / 2 + 0.25 : 0), 0.8, z - (long ? 0 : Wd / 2 + 0.25), long ? 0.05 : L, 0.9, long ? L : 0.05, TRUSS, T.yellow, { kind: 'over', ds: true }));
            K.P('steam_turbine', x, z + (long ? L * 0.06 : 0), long ? 90 : 0, 0.8); },
        /* a pump set (the second pass): the Meshy centrifugal_pump (motor + spiral casing, 2.6 m) on a concrete bed, its outlet rising to a teal
           header that runs to the main pipes (the first pass drew motor + casing from shapes) */
        pump(K, x, z, gw, gd) { const n = Math.max(1, Math.round(gd / C)); for (let k = 0; k < n; k++) { const pz = z - gd / 2 + (k + 0.5) * C;
            K.part(box(x, 0, pz, 2.8, 0.4, 2.4, CONC, 0xb9b1a2), box(x - 1.6, 2.6, pz, 2.2, 0.5, 0.5, PLAIN, T.teal), cyl(x - 0.75, 1.55, pz, 0.16, 1.1, PLAIN, T.teal, { seg: 8 }));
            K.P('centrifugal_pump', x, pz, 180, 0.4); } },   // 180 = the model as made: the casing at -x, toward the main pipes
        /* the main pipes: two fat pipes on saddles along the run, a gate valve a square */
        pipes(K, x, z, gw, gd) { const n = Math.max(1, Math.round(gd / C)); K.part(box(x - 0.6, 0.5, z, 0.8, 0.8, gd - 0.2, PLAIN, T.teal), box(x + 0.6, 0.5, z, 0.8, 0.8, gd - 0.2, PLAIN, TEAL2), box(x, 0, z - gd / 2 + C / 2, 2.4, 0.5, 0.4, CONC, 0x9a9a9a, { n, step: [0, 0, C] }),
            box(x - 0.6, 0.45, z - gd / 2 + 0.6, 0.95, 0.9, 0.2, PLAIN, T.dark, { n: n + 1, step: [0, 0, (gd - 1.2) / n] })); for (let k = 0; k < n; k++) K.P('gate_valve', x + 0.6, z - gd / 2 + C / 2 + k * C, 0, 0.52); },   // a gate valve a square on the second pipe (the second pass; the first drew a stem + a red wheel)
    };
    const KH = { truck: 2.8, veh: 1.9, cont: 6.4, shelf: 1.9, racks: 2.2, lockers: 1.9, boiler: 2.4, tesla: 2.8, turbine: 3.4, rocket: 4, missile: 2, vend: 1.9, radio: 2.2, dish: 2.6, scope: 2.6, pump: 1.6, pipes: 1.4, files: 1.4 };
    const CSF = U('ConcreteStriped1b'), IN = {
        'P00-08-B1': { W: 8, D: 8, keyIn: U('ConcreteStriped1a'), floorIn: CSF, walls: [[6, 0, 6, 1], [6, 2, 8, 2]],
            g: [['truck', 2, 3, 3, 1], ['desk', 7, 0, 1, 1], ['files', 7, 1, 1, 1], ['cont', 0, 6, 2, 2], ['crates', 3, 6, 3, 1], ['shelf', 6, 7, 2, 1], ['lockers', 0, 0, 1, 1], ['barrels', 0, 4, 1, 1]],
            decor(K) { K.wallProp('punch_clock', 'f', 5.4); K.wallProp('notice_board', 'f', 3.4); K.wallProp('breaker_panel', 'l', 2.4); K.wallProp('breaker_panel', 'l', 3.3); K.sign(6.9, 2, 2.6, 'CUSTOMS'); } },
        'P02-08-B1': { W: 8, D: 8, keyIn: 'bricks_3', tintIn: T.brick, floorIn: U('TileGeneric5a'), walls: [[5, 6, 5, 8], [6, 6, 8, 6]],
            g: [['turbine', 1, 2, 2, 3], ['turbine', 5, 2, 2, 3], ['boiler', 0, 7, 3, 1], ['panel', 6, 7, 2, 1], ['tesla', 7, 0, 1, 1], ['lockers', 0, 0, 1, 1], ['crates', 0, 5, 1, 1]],
            decor(K) { K.part(box(0, 6.2, K.lz(5.5), K.fw - 1, 0.6, 0.6, PLAIN, T.steel), box(-K.fw / 2 + 5.2, 6.2, K.lz(5.5) + 2, 0.6, 0.6, 4, PLAIN, T.steel), box(K.fw / 2 - 8.6, 6.2, K.lz(5.5) + 2, 0.6, 0.6, 4, PLAIN, T.steel));
                [2.5, 3.5, 4.5, 5.5].forEach(j => K.wallProp('breaker_panel', 'l', j)); K.wallProp('monitor_stack', 'b', 7.4); K.wallProp('wall_clock', 'b', 6.2); K.P('office_chair', K.lx(6.5), K.lz(6.6), 0); K.sign(6.5, 6, 3.6, 'CONTROL ROOM'); } },
        'P03-08-B1': { W: 9, D: 3, keyIn: PLAIN, tintIn: 0xb9a48a, floorIn: CSF, walls: [],
            g: [['bench', 1, 2, 5, 1], ['shelf', 7, 2, 2, 1], ['conv', 1, 0, 2, 1], ['bench', 3, 0, 1, 1], ['crates', 0, 0, 1, 1], ['barrels', 0, 2, 1, 1], ['desk', 8, 0, 1, 1], ['lockers', 7, 0, 1, 1]],
            decor(K) { K.wallProp('punch_clock', 'f', 6.3); K.wallProp('breaker_panel', 'f', 4.3); K.wallProp('notice_board', 'r', 1.5); } },
        'P01-09-B1': { W: 8, D: 8, keyIn: PLAIN, tintIn: 0xe6e0d0, floorIn: U('TileGeneric4a'), walls: [[0, 5, 1, 5], [2, 5, 3, 5], [4, 5, 6, 5], [7, 5, 8, 5], [3, 5, 3, 8], [5, 5, 5, 8], [6, 0, 6, 1], [6, 2, 8, 2]],
            g: [['counter', 1, 1, 3, 1], ['desk', 1, 3, 2, 1], ['desk', 1, 4, 2, 1], ['desk', 4, 3, 2, 1], ['desk', 4, 4, 2, 1], ['files', 0, 6, 1, 2, 'l'], ['shelf', 2, 6, 1, 2, 'r'], ['racks', 4, 5, 1, 3, 'r'], ['bigdesk', 6, 6, 1, 1],
                ['files', 7, 7, 1, 1], ['table', 7, 0, 1, 1], ['vend', 7, 1, 1, 1], ['seat', 0, 0, 1, 1]],
            decor(K) { K.part(box(K.lx(1.5), 2.2, K.lz(5) + 0.14, 5, 1.3, 0.06, null, 0x1c2a22), txt(K.lx(1.5), 2.95, K.lz(5) + 0.18, 3.4, 0.4, 'DISPATCH', '#f2c230')); K.wallPropAt('world_clocks', K.lx(4.9), K.lz(5) + 0.14, 180); K.P('office_plant', K.lx(0.4), K.lz(1.6), 0); K.P('office_plant', K.lx(5.6), K.lz(7.6), 0);
                K.wallProp('notice_board', 'f', 1.5); K.P('rug_office', K.lx(6.5), K.lz(6.3), 0); } },
        'P03-09-B1': { W: 9, D: 3, keyIn: PLAIN, tintIn: 0xf0f0ee, floorIn: U('TileGeneric3a'), walls: [[6, 0, 6, 1], [6, 2, 6, 3]],
            g: [['racks', 0, 2, 1, 1], ['panel', 1, 2, 2, 1], ['rocket', 4, 2, 1, 1], ['lockers', 5, 2, 1, 1], ['bench', 0, 0, 2, 1], ['scope', 7, 1, 1, 1], ['dish', 8, 2, 1, 1]],
            decor(K) { K.wallProp('dream_screen', 'b', 2); K.wallProp('chalkboard', 'b', 3.5); K.P('globe_lamp', K.lx(8.5), K.lz(0.3), 0); K.P('office_plant', K.lx(2.6), K.lz(0.35), 0); K.P('eeg_rack', K.lx(0.4), K.lz(1.75), 90); } },
        'P00-10-B1': { W: 8, D: 3, keyIn: PLAIN, tintIn: 0xdcd2b8, floorIn: 'wood_planks', walls: [[5, 0, 5, 1], [5, 2, 5, 3]],
            g: [['counter', 2, 1, 1, 1], ['seat', 0, 0, 1, 1], ['desk', 0, 2, 4, 1], ['files', 4, 2, 1, 1], ['bigdesk', 6, 2, 1, 1], ['chart', 6, 0, 1, 1], ['radio', 7, 2, 1, 1]],
            decor(K) { K.P('brass_telescope', K.lx(7.6), K.lz(0.35), 0); K.wallProp('world_clocks', 'f', 3.5); K.wallProp('notice_board', 'f', 1.2); K.P('office_plant', K.lx(0.35), K.lz(1.3), 0); K.P('water_cooler', K.lx(0.3), K.lz(1.8), 90); K.P('rug_office', K.lx(6.5), K.lz(1.5), 0); } },
        'P02-10-B1': { W: 8, D: 7, keyIn: U('MetalCorrugatedPainted1c'), floorIn: CSF, walls: [[6, 5, 6, 6], [7, 5, 8, 5]],
            g: [['veh', 0, 1, 1, 3, 'car_truck'], ['veh', 2, 1, 1, 2, 'car_suv'], ['veh', 5, 1, 1, 2, 'car_taxi'], ['veh', 7, 1, 1, 2, 'car_ambulance'], ['bench', 1, 6, 4, 1], ['shelf', 0, 5, 1, 2, 'l'], ['desk', 7, 6, 1, 1], ['barrels', 5, 6, 1, 1], ['lockers', 7, 4, 1, 1]],
            decor(K) { [0, 2, 5, 7].forEach((i, n) => K.part(txt(K.lx(i + 0.5), 4.4, K.lz(0) - 0.2, 0.9, 0.9, String(n + 1), '#f2c230'))); K.wallProp('breaker_panel', 'r', 3.4); K.wallProp('punch_clock', 'r', 2.6); K.P('traffic_cone', K.lx(3.6), K.lz(1.5), 0); K.P('traffic_cone', K.lx(4.4), K.lz(2.4), 0);
                K.P('psx_metal_barrel_mp_1', K.lx(1.5), K.lz(3.7), 0); } },
        'P03-10-B1': { W: 9, D: 4, keyIn: U('MetalCorrugatedPainted1c'), floorIn: CSF, walls: [],
            g: [['bench', 0, 3, 1, 1], ['crates', 0, 2, 1, 1], ['lockers', 8, 3, 1, 1], ['missile', 8, 2, 1, 1], ['missile', 8, 1, 1, 1], ['jet', 2, 1, 5, 3]],
            decor(K) { K.wallProp('chalkboard', 'l', 1.3); K.P('folding_chair', K.lx(0.5), K.lz(0.9), 270); K.P('folding_chair', K.lx(0.5), K.lz(1.7), 270); K.P('traffic_cone', K.lx(1.5), K.lz(0.9), 0); K.P('traffic_cone', K.lx(7.5), K.lz(0.9), 0); K.wallProp('notice_board', 'f', 6.4); } },
        'P01-11-B1': { W: 4, D: 5, keyIn: SUB, floorIn: U('TileGeneric5a'), walls: [],
            g: [['pipes', 0, 1, 1, 3], ['pump', 1, 1, 1, 3], ['desk', 3, 4, 1, 1], ['lockers', 1, 4, 1, 1], ['barrels', 0, 0, 1, 1]],
            decor(K) { K.wallProp('retro_control_panel', 'r', 2.5); K.wallProp('breaker_panel', 'r', 1.5); K.wallProp('breaker_panel', 'r', 3.4); K.wallProp('notice_board', 'f', 1.6); } },
        'P02-11-B1': { W: 3, D: 5, keyIn: U('ConcreteStriped1a'), floorIn: CSF, walls: [],
            g: [['pipes', 0, 1, 1, 3], ['lockers', 2, 2, 1, 1], ['crates', 0, 0, 1, 1]],
            decor(K) { K.wallProp('breaker_panel', 'r', 3.4); K.wallProp('notice_board', 'f', 0.6); K.P('traffic_barrel', K.lx(1.5), K.lz(0.3), 0); K.P('traffic_barrel', K.lx(0.4), K.lz(4.5), 0); } },
        'P03-11-B1': { W: 3, D: 2, keyIn: 'bricks_3', tintIn: T.brick, floorIn: 'wood_planks', walls: [],
            g: [['racks', 1, 1, 2, 1], ['desk', 2, 0, 1, 1]],
            decor(K) { K.wallProp('departures_board', 'r', 1.2); K.wallProp('wall_clock', 'r', 0.5); K.wallProp('locker', 'l', 1.2); K.wallProp('locker', 'l', 1.9); K.P('coffee_maker', K.lx(1.4), K.lz(0.2), 0, 0.5); K.P('psx_wooden_crate_3', K.lx(1.4), K.lz(0.2), 0); } },
    };
    /* ── THE SECOND PASS: ATMOSPHERE + THE MESHY PIECES (2026-11-14, mondo 11-13 22:33: "after a district's first interior pass, do another interior pass
       ... make a list of models needed/wanted but not in the bucket or game, and make meshy versions of them ... Focus on aesthetic, vibe, atmosphere
       for the interiors"). Runs after each room's first pass (`SECOND[id](Q)`). Every room gets its own paint (a dado coat 0.35 m in from the walls,
       a stripe, a skirting), a ceiling (the hollow building's own ceiling draws black: a dark deck, roof trusses, lit skylights where the roof has
       glass), DRAWN light (Meshy high-bay lamps with a lit bulb under each, fluorescent strips, pendants; the city room's ten real lights stay with
       the streets) and, in the works rooms, yellow safety lines painted round every blocked square that meets a walk. New blockers (`Q.block`) obey
       his grid rule: whole squares, a ghost block each, never the doorway square, and only where every walk square stays reachable from the door
       (a flood fill; a refused one prints a console line). Dressing sits off the square centres or on the walls. The Meshy pieces (data.js
       "THE INDUSTRIAL INTERIOR PIECES"; R2 Assets/world/props/meshy/): steam_turbine, centrifugal_pump, gate_valve (in the first pass's kits now),
       high_bay_lamp, gauge_board, metal_lathe, drill_press, tool_pegboard, gas_cylinder_rack, air_compressor, jet_engine_stand, aircraft_tug,
       maintenance_stairs, rocket_engine, signal_lever_frame, railway_lantern, platform_scale, chain_hoist, ship_model, cable_drum. Other districts'
       pieces are used only when their row is in data.js at bake time (`HAS`: Southside's tool_chest / tire_stack / engine_hoist, Hero Plaza's
       welding_cart); a rerun of the bake brings them in once those land. ── */
    const DJ = (() => { try { return require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'data.js'), 'utf8'); } catch (e) { return ''; } })();
    const HAS = k => new RegExp('^\\s*' + k + '\\s*:\\s*\\{\\s*file:', 'm').test(DJ);
    const sgn = (x, y, z, w, h, words, ink, bg, ry) => Object.assign({ s: 'quad', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h)], key: 'txt:' + words + '|' + ink + '|' + (bg || '') + '|' + (Math.round(w / h * 100) / 100), uv: 'fit', tint: 0xffffff, kind: 'over' }, ry ? { ry } : {});
    const kit2 = (K, S, dc, c, ghost, W2, rot) => {
        const { H, fw, fd } = K, C2 = C / 2, E2 = 0.345, dX = c.door.lx, dW = c.door.cw + 0.12;
        const cx = i => K.lx(i + 0.5), cz = j => K.lz(j + 0.5);   // a square's centre (i from the left wall, j from the front)
        const key = (i, j) => i + ',' + j, shut = new Set(), cut = new Set();
        S.g.forEach(q => { for (let a = 0; a < q[3]; a++) for (let e = 0; e < q[4]; e++) shut.add(key(q[1] + a, q[2] + e)); });
        (S.walls || []).forEach(w => { if (w[0] === w[2]) for (let j = Math.min(w[1], w[3]); j < Math.max(w[1], w[3]); j++) cut.add(key(w[0] - 1, j) + '|' + key(w[0], j));
            else for (let i = Math.min(w[0], w[2]); i < Math.max(w[0], w[2]); i++) cut.add(key(i, w[1] - 1) + '|' + key(i, w[1])); });
        const open = (a, b) => !cut.has(a + '|' + b) && !cut.has(b + '|' + a);
        const reach = blk => { const seen = new Set(), st = [[dc, 0]]; if (blk.has(key(dc, 0))) return seen;
            while (st.length) { const [i, j] = st.pop(), k = key(i, j); if (seen.has(k)) continue; seen.add(k);
                [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([u, v]) => { const i2 = i + u, j2 = j + v, k2 = key(i2, j2); if (i2 >= 0 && j2 >= 0 && i2 < S.W && j2 < S.D && !blk.has(k2) && !seen.has(k2) && open(k, k2)) st.push([i2, j2]); }); }
            return seen; };
        const Q = {
            K, H, fw, fd, cx, cz, dX,
            part() { for (const q of arguments) K.part(q); },
            P: (k, x, z, hd, y, more) => K.P(k, x, z, hd, y, more),
            /* a link door of the bake's (JOIN) moved onto this room's wall from the inside, its face to the room (the free door's panel stands 0.5 m proud) */
            join(id, lx, lz) { if (!ctx.JOIN || !ctx.JOIN[id]) { console.log('industrial 2nd pass: no join', id); return; } const p = W2(lx, lz); ctx.JOIN[id] = { x: p[0], z: p[1], face: (rot + 180) % 360, noEntrance: true }; count2.joinMoved = id; },
            exit() { K.P('exit_sign', dX, fd / 2 - 0.32, 0); },   // the lit EXIT over the doorway, inside
            has: HAS,
            /* a NEW blocker on whole squares: never the doorway, never one that cuts a walk square off from the door */
            block(i, j, w, d, h, fn) { const sq = []; for (let a = 0; a < w; a++) for (let e = 0; e < d; e++) sq.push(key(i + a, j + e));
                if (sq.some(k => shut.has(k)) || sq.includes(key(dc, 0)) || i < 0 || j < 0 || i + w > S.W || j + d > S.D) { console.log('industrial 2nd pass: square taken', JSON.stringify([i, j, w, d])); return false; }
                const before = reach(shut), after = reach(new Set([...shut, ...sq]));
                if ([...before].some(k => !sq.includes(k) && !after.has(k))) { console.log('industrial 2nd pass: a blocker would cut a walk off', JSON.stringify([i, j, w, d])); return false; }
                sq.forEach(k => { shut.add(k); const [a, e] = k.split(',').map(Number); ghost(a, e, h); });
                fn(K.lx(i + w / 2), K.lz(j + d / 2), w * C, d * C); return true; },
            /* paint: a coat on the four walls `h` high (the front one with the doorway cut), a stripe at its top, a skirting */
            coat(k, tint, h, gain, e) { e = e || E2; const o = Object.assign({ key: k, tint }, gain ? { gain } : {}), hh = r3(h);
                Q.part(Object.assign({ s: 'quad', p: [0, 0, r3(-fd / 2 + e)], size: [r3(fw - 2 * e), hh] }, o), Object.assign({ s: 'quad', p: [0, 0, r3(fd / 2 - e)], ry: 180, size: [r3(fw - 2 * e), hh], hole: [r3(-dX), r3(dW), Math.min(2.25, hh)] }, o),
                    Object.assign({ s: 'quad', p: [r3(-fw / 2 + e), 0, 0], ry: 270, size: [r3(fd - 2 * e), hh] }, o), Object.assign({ s: 'quad', p: [r3(fw / 2 - e), 0, 0], ry: 90, size: [r3(fd - 2 * e), hh] }, o)); },
            band(y, h, t, k, tint, e) { e = (e || E2) + 0.012; const f = e + t / 2, o = { key: k || null, tint };
                const run = (x0, x1, z) => { if (x1 - x0 > 0.05) Q.part(Object.assign({ s: 'box', p: [r3((x0 + x1) / 2), r3(y), r3(z)], size: [r3(x1 - x0), r3(h), r3(t)] }, o)); };
                run(-fw / 2 + e, fw / 2 - e, -fd / 2 + f); if (y < 2.3) { run(-fw / 2 + e, dX - dW / 2, fd / 2 - f); run(dX + dW / 2, fw / 2 - e, fd / 2 - f); } else run(-fw / 2 + e, fw / 2 - e, fd / 2 - f);
                [-1, 1].forEach(sg => Q.part(Object.assign({ s: 'box', p: [r3(sg * (fw / 2 - f)), r3(y), 0], size: [r3(t), r3(h), r3(fd - 2 * e)] }, o))); },
            paint(dado, dadoTint, dadoH, stripe, gain) { Q.coat(dado, dadoTint, dadoH, gain); if (stripe != null) Q.band(dadoH, 0.09, 0.03, null, stripe); Q.band(0, 0.14, 0.04, null, 0x2a2c30); },
            /* the ceiling under the roof slab: a deck (`glow` a little: the hollow ceiling is black), roof trusses across x every `every` squares */
            ceil(k, tint, glow, trussTint, every) { Q.part({ s: 'box', p: [0, r3(H - 0.05), 0], size: [r3(fw - 0.7), 0.04, r3(fd - 0.7)], key: k, tint, glow: glow || 0, under: true, roof: true, top: false });
                if (trussTint != null) for (let j = every || 2; j < S.D; j += every || 2) Q.part(box(0, H - 0.75, K.lz(j), fw - 0.75, 0.7, 0.14, TRUSS, trussTint, { kind: 'over', ds: true, under: true }), box(0, H - 0.78, K.lz(j), fw - 0.75, 0.06, 0.2, PLAIN, trussTint)); },
            /* a skylight: a lit glass panel set in the ceiling, its dark frame */
            sky(x, z, w, d, tint) { Q.part(box(x, H - 0.1, z, w + 0.24, 0.05, d + 0.24, PLAIN, 0x34383e, { under: true }), box(x, H - 0.12, z, w, 0.03, d, U('GlassWindowFactory3a'), tint || 0xe6f2ff, { glow: 0.85, under: true, top: false, win: 'keep' })); },
            /* a Meshy high-bay lamp hung from the ceiling over (x, z), its bulb lit */
            hb(x, z, drop) { const y = H - 0.92 - (drop || 0); Q.P('high_bay_lamp', x, z, 0, r3(y)); if (drop) Q.part(cyl(x, y + 0.9, z, 0.02, drop, PLAIN, 0x202226, { seg: 4, cap: false }));
                Q.part(cyl(x, y + 0.02, z, 0.13, 0.08, null, 0xfff1cc, { glow: 1, seg: 10, under: true })); },
            /* a fluorescent strip (along x unless `alongZ`) */
            strip(x, z, len, alongZ, tint) { const s = alongZ ? [0.22, 0.07, len] : [len, 0.07, 0.22]; Q.part({ s: 'box', p: [r3(x), r3(H - 0.42), r3(z)], size: s, tint: 0xd8dce2, under: true },
                Object.assign({ s: 'box', p: [r3(x), r3(H - 0.44), r3(z)], size: [r3(s[0] - 0.06), 0.03, r3(s[2] - 0.06)], tint: tint || 0xf4fbff, glow: 1, under: true }), cyl(x, H - 0.37, z, 0.01, 0.37, PLAIN, 0x30343a, { seg: 4, cap: false })); },
            /* a pendant: cord, a shade, a lit bulb */
            pend(x, z, y, shadeTint, bulb, r) { r = r || 0.28; Q.part(cyl(x, y + 0.26, z, 0.012, H - y - 0.26, PLAIN, 0x202020, { seg: 4, cap: false }), cyl(x, y, z, r, 0.28, PLAIN, shadeTint, { r2: r * 0.25, seg: 14, ds: true, cap: false }),
                cyl(x, y - 0.06, z, r * 0.3, 0.14, null, bulb || 0xffe2a8, { glow: 1, seg: 10, under: true })); },
            /* a warning beacon (a lit box in a dark cage) */
            beacon(x, y, z, tint) { Q.part(box(x, y, z, 0.26, 0.2, 0.18, PLAIN, 0x2a2c30), box(x, y + 0.02, z + 0.1, 0.18, 0.15, 0.04, null, tint || 0xff9a1a, { glow: 1 })); },
            /* yellow safety lines round every blocked square that meets an open walk square (works rooms) */
            lines(tint) { const t = 0.09, y = 0.012;
                shut.forEach(k => { const [i, j] = k.split(',').map(Number);
                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([u, v]) => { const i2 = i + u, j2 = j + v, k2 = key(i2, j2); if (i2 < 0 || j2 < 0 || i2 >= S.W || j2 >= S.D || shut.has(k2) || !open(k, k2)) return;
                        const x = cx(i) + u * (C2 - 0.12), z = cz(j) - v * (C2 - 0.12);
                        Q.part(box(x, y, z, u ? t : C - 0.04, 0.01, u ? C - 0.04 : t, null, tint || T.yellow, { sides: false, kind: 'over' })); }); }); },
            /* a lettered sign on a wall: 'b' back, 'f' front (inside, over the door side), 'l', 'r'; `along` = room-local x (b/f) or z (l/r) */
            sign(wall, along, y, w, h, words, ink, bg) { const e = E2 + 0.03;
                if (wall === 'b') Q.part(sgn(along, y, -fd / 2 + e, w, h, words, ink, bg)); else if (wall === 'f') Q.part(sgn(along, y, fd / 2 - e, w, h, words, ink, bg, 180));
                else if (wall === 'l') Q.part(sgn(-fw / 2 + e, y, along, w, h, words, ink, bg, 270)); else Q.part(sgn(fw / 2 - e, y, along, w, h, words, ink, bg, 90)); },
            /* a prop flat on a wall at height y (gauge boards, pegboards, the ship's wheel): its back to the wall, its front to the room */
            onWall(k, wall, along, y, e) { e = e || 0.42; const at = wall === 'b' ? [along, -fd / 2 + e, 180] : wall === 'f' ? [along, fd / 2 - e, 0] : wall === 'l' ? [-fw / 2 + e, along, 90] : [fw / 2 - e, along, 270]; Q.P(k, at[0], at[1], at[2], y); },
            /* a pipe run high on a wall: a fat pipe + a thin one on brackets, flanges every 1.75 m */
            pipe(wall, y, tint, from, to) { const e = 0.62, L = (to - from), m = (from + to) / 2, n = Math.max(1, Math.floor(L / 1.75));
                if (wall === 'b' || wall === 'f') { const z = wall === 'b' ? -fd / 2 + e : fd / 2 - e, s = wall === 'b' ? -1 : 1;
                    Q.part(box(m, y, z, L, 0.36, 0.36, PLAIN, tint), box(m, y + 0.5, z + s * 0.08, L, 0.16, 0.16, PLAIN, T.steel), box(from + 0.6, y - 0.03, z, 0.12, 0.42, 0.44, PLAIN, 0x2a2c30, { n, step: [L / n, 0, 0] }),
                        box(from + 0.6, y - 0.25, z + s * 0.12, 0.08, 0.25, 0.5, PLAIN, 0x3a3d42, { n, step: [L / n, 0, 0] })); }
                else { const x = wall === 'l' ? -fw / 2 + e : fw / 2 - e, s = wall === 'l' ? -1 : 1;
                    Q.part(box(x, y, m, 0.36, 0.36, L, PLAIN, tint), box(x + s * 0.08, y + 0.5, m, 0.16, 0.16, L, PLAIN, T.steel), box(x, y - 0.03, from + 0.6, 0.44, 0.42, 0.12, PLAIN, 0x2a2c30, { n, step: [0, 0, L / n] }),
                        box(x + s * 0.12, y - 0.25, from + 0.6, 0.5, 0.25, 0.08, PLAIN, 0x3a3d42, { n, step: [0, 0, L / n] })); } },
        };
        return Q;
    };
    const STEEL_DK = 0x3c4148, HAZ = U('SignHazard1a');
    const SECOND = {
        /* FREIGHT GATE (the customs weigh hall): cold sodium light from high bays, a slate-blue dado with a yellow stripe, skylights, a gantry beam over
           the truck with a chain block, the platform scale by the wall, a forklift + wrapped pallets parked in the pockets, safety lines */
        'P00-08-B1': Q => {
            Q.paint(U('ConcreteStriped1a'), 0x6f7f90, 1.3, T.yellow, 1.1); Q.ceil(PLAIN, 0x4a4f56, 0.06, 0x8f9aa5, 2);
            [1.5, 4, 6.5].forEach(j => Q.sky(-Q.fw / 4, Q.K.lz(j), 3, 1.2)); [1.5, 4, 6.5].forEach(j => Q.sky(Q.fw / 4, Q.K.lz(j), 3, 1.2));
            [[1, 1.5], [4, 1.5], [1, 4.5], [4, 4.6], [6.5, 4.5], [2.5, 6.5]].forEach(([i, j]) => Q.hb(Q.K.lx(i + 0.5), Q.K.lz(j)));
            Q.part(box(0, Q.H - 0.7, Q.cz(3), Q.fw - 0.7, 0.5, 0.32, PLAIN, T.yellow), box(0, Q.H - 0.72, Q.cz(3) + 0.17, Q.fw - 0.8, 0.46, 0.02, HAZ, 0xffffff, { uv: 0.9, faces: 'f', top: false }));
            Q.P('chain_hoist', Q.cx(3) + 1.4, Q.cz(3), 0, r3(Q.H - 0.7 - 2.0));
            Q.block(7, 5, 1, 1, 1.9, (x, z) => Q.P('forklift', x - 0.15, z, 270));
            Q.block(5, 7, 1, 1, 1.0, (x, z) => { Q.P('wrapped_pallet', x - 0.7, z + 0.1, 0); Q.P('wrapped_pallet', x + 0.75, z - 0.2, 90); });
            Q.P('platform_scale', Q.K.lx(0) + 0.6, Q.cz(2) - 0.3, 90); Q.P('cable_drum', Q.fw / 2 - 0.45, Q.cz(6) + 0.6, 270);
            Q.K.wallProp('fire_extinguisher', 'f', 2.6); Q.exit(); Q.onWall('gauge_board', 'l', Q.cz(5), 1.35);
            Q.sign('b', Q.cx(3), 3.2, 4.2, 0.55, 'MAX LOAD 40 TONNES', '#1c1d20', '#f2c230'); Q.sign('l', Q.cz(3), 2.4, 2.6, 0.45, 'KEEP CLEAR', '#ffffff', '#b3261e');
            Q.lines();
        },
        /* POWER STATION: the turbine hall in green tile and brick under a skylit barrel roof, an overhead crane on rails with its chain block over the
           walk between the sets, gauge boards and pipe runs on the walls, HIGH VOLTAGE on the tesla cage, a warm control room behind its glass */
        'P02-08-B1': Q => {
            Q.paint(U('TileSubway1a'), 0x6fa08a, 1.6, 0x2f5f4a, 1.2); Q.ceil(PLAIN, 0x3e4248, 0.05, 0x7f8b96, 2);
            for (let j = 0.6; j < 7.8; j += 1.6) Q.sky(0, Q.K.lz(j), 4.2, 1.1);
            Q.part(box(-Q.fw / 2 + 0.75, Q.H - 1.6, 0, 0.4, 0.5, Q.fd - 1.2, PLAIN, STEEL_DK), box(Q.fw / 2 - 0.75, Q.H - 1.6, 0, 0.4, 0.5, Q.fd - 1.2, PLAIN, STEEL_DK),
                box(0, Q.H - 1.15, Q.K.lz(4), Q.fw - 1.4, 0.8, 0.7, PLAIN, T.yellow), box(0, Q.H - 1.13, Q.K.lz(4) + 0.36, Q.fw - 1.6, 0.6, 0.02, HAZ, 0xffffff, { uv: 0.9, faces: 'f', top: false }),
                box(-Q.fw / 2 + 0.9, Q.H - 1.3, Q.K.lz(4), 0.9, 0.7, 1.4, PLAIN, 0x2a2c30), box(Q.fw / 2 - 0.9, Q.H - 1.3, Q.K.lz(4), 0.9, 0.7, 1.4, PLAIN, 0x2a2c30));
            Q.P('chain_hoist', Q.cx(3) + 1.75, Q.K.lz(4), 0, r3(Q.H - 1.15 - 2.0));
            [[0.5, 1.5], [3.5, 1.5], [7.5, 1.5], [3.5, 5.5], [0.5, 6], [3.5, 6.6]].forEach(([i, j]) => Q.hb(Q.K.lx(i), Q.K.lz(j), 1.2));
            Q.onWall('gauge_board', 'l', Q.cz(2), 1.4); Q.onWall('gauge_board', 'l', Q.cz(3.6), 1.4); Q.onWall('gauge_board', 'r', Q.cz(2.5), 1.4);
            Q.pipe('l', 4.2, T.red, -Q.fd / 2 + 1, Q.fd / 2 - 1); Q.pipe('r', 4.6, T.teal, -Q.fd / 2 + 1, Q.fd / 2 - 1.2);
            Q.sign('r', Q.cz(0.5), 2.6, 2.6, 0.5, 'DANGER HIGH VOLTAGE', '#ffffff', '#b3261e'); Q.beacon(Q.fw / 2 - 0.4, 3.0, Q.cz(1.2), 0xff3b20);
            Q.sign('b', Q.cx(1.5), 3.6, 4, 0.55, 'TURBINE HALL', '#f4f1ea', '#2f5f4a');
            Q.strip(Q.cx(6.5), Q.cz(6.5), 2.6, false, 0xffe6b0); Q.strip(Q.cx(6.5), Q.cz(7.3), 2.6, false, 0xffe6b0);
            Q.P('cable_drum', Q.K.lx(0) + 0.5, Q.cz(1) + 0.4, 90); Q.K.wallProp('fire_extinguisher', 'f', 2.5); Q.exit();
            Q.lines();
        },
        /* MACHINE SHOP: north light through the sawtooth glazing, a grey-green dado, fluorescents over the benches, tool boards over them, the
           lathe + the pillar drill on their own squares, the welding gas rack and the compressor on the walls */
        'P03-08-B1': Q => {
            Q.paint(PLAIN, 0x7d8f7c, 1.25, T.yellow, 1.1); Q.ceil(PLAIN, 0x4a4e54, 0.05, 0x8f9aa5, 3);
            [-Q.fw / 3, 0, Q.fw / 3].forEach(x => [0.6, 1.6, 2.5].forEach(j => Q.sky(x, Q.K.lz(j), Q.fw / 3 - 1.4, 0.7, 0xfff6e0)));
            for (let i = 1; i < 6; i += 2) Q.strip(Q.cx(i), Q.cz(2) + 0.6, 2.6, false);
            [1.5, 4.5, 7.5].forEach(i => Q.hb(Q.K.lx(i), Q.cz(1)));
            Q.block(4, 0, 1, 1, 1.4, (x, z) => Q.P('metal_lathe', x, z + 0.35, 0));
            Q.block(6, 2, 1, 1, 1.8, (x, z) => { Q.P('drill_press', x - 0.6, z - 0.4, 180); if (Q.has('tool_chest')) Q.P('tool_chest', x + 0.8, z - 0.9, 180); });
            Q.onWall('tool_pegboard', 'b', Q.cx(1.5), 1.25, 0.47); Q.onWall('tool_pegboard', 'b', Q.cx(3.5), 1.25, 0.47); Q.onWall('tool_pegboard', 'b', Q.cx(5), 1.25, 0.47);
            Q.P('gas_cylinder_rack', Q.cx(6) + 0.9, Q.fd / 2 - 0.55, 0); if (Q.has('welding_cart')) Q.P('welding_cart', Q.cx(6) - 0.4, Q.fd / 2 - 0.7, 0);
            Q.P('air_compressor', Q.fw / 2 - 0.55, Q.cz(1), 270); Q.sign('l', Q.cz(1), 2.5, 2.4, 0.45, 'EYE PROTECTION', '#1c1d20', '#f2c230');
            Q.exit(); Q.lines();
        },
        /* LOADING OFFICE: a dispatch office at the end of a shift: cream over a bottle-green dado, a lit tile ceiling, fluorescents over the desk rows,
           a pendant over the counter, coat hooks by the door */
        'P01-09-B1': Q => {
            Q.paint(U('PlasterWallPainted1a'), 0x3f6b55, 1.1, 0x2a2c30, 1.4); Q.ceil(U('FibreCeilingTile1a'), 0xf4eedc, 0.35);
            [3, 4].forEach(j => [1.5, 5].forEach(i => Q.strip(Q.K.lx(i), Q.cz(j), 2.4, false)));
            [1.5, 2.5, 3.5].forEach(i => Q.pend(Q.K.lx(i), Q.cz(1), 2.4, 0x2f5f4a, 0xffe2a8, 0.24));
            Q.strip(Q.cx(6.5), Q.cz(6.5), 2.2, false, 0xfff0d0); Q.strip(Q.cx(1), Q.cz(6.5), 2.2, true, 0xfff0d0);
            Q.K.wallProp('hook_rail', 'f', 2.6); Q.K.wallProp('fire_extinguisher', 'f', 5.4); Q.exit();
            Q.sign('l', Q.cz(3.5), 2.2, 2.4, 0.42, 'SHIFT ROTA', '#22262a', '#f4f1ea');
        },
        /* AEROSPACE LAB: a clean room: blue-grey dado, white light from strips over every square, blue status glows on the racks, the rocket engine on
           its test frame in the back row, the satellite parked behind the partition */
        'P03-09-B1': Q => {
            Q.paint(PLAIN, 0x9fb2c4, 1.1, 0x3d6a9a, 1.3); Q.ceil(U('FibreCeilingTile1a'), 0xffffff, 0.5);
            for (let i = 0; i < 9; i++) Q.strip(Q.cx(i), Q.cz(1), 2.4, true);
            Q.block(3, 2, 1, 1, 3, (x, z) => { Q.part(box(x, 0, z, 2.4, 0.2, 2.4, CONC, 0x9a9ea4), box(x, 0.2, z + 1.15, 2.4, 0.05, 0.08, null, T.yellow, { kind: 'over' })); Q.P('rocket_engine', x, z, 180, 0.2); });
            Q.block(7, 2, 1, 1, 2, (x, z) => Q.P('satellite', x, z - 0.2, 180, 0.3, { span: 3.0 }));
            [0.5, 1.5, 2.5].forEach(i => Q.part(box(Q.K.lx(i), 2.05, Q.cz(2) + 1.3, 0.5, 0.05, 0.03, null, 0x58b6ff, { glow: 1 })));
            Q.sign('b', Q.cx(7), 2.6, 2.6, 0.45, 'CLEAN ROOM', '#ffffff', '#3d6a9a'); Q.beacon(Q.K.lx(6) + 0.35, 2.4, Q.cz(1) - 1.4, 0x58ff8a);
            Q.exit(); Q.K.wallProp('fire_extinguisher', 'f', 5.5); Q.lines(0x3d6a9a);
        },
        /* PORT OFFICE: the harbour master's room: dark oak to the waist, slate walls, brass pendants over the desks, the ship model in its glass case,
           the ship's wheel and bell on the walls, a lantern on the chart table */
        'P00-10-B1': Q => {
            Q.paint('wood_planks', 0x6a4a30, 1.15, 0x3a2a1c, 1.3); Q.ceil('wood_planks', 0x8a6a4c, 0.12);
            [0.6, 2.4, 4.4, 6.5].forEach(i => Q.pend(Q.K.lx(i), Q.cz(2) + 0.6, 2.5, 0xb8893a, 0xffd890, 0.26)); Q.pend(Q.cx(6), Q.cz(0), 2.3, 0x2f5f4a, 0xffe2a8, 0.3);
            Q.block(7, 0, 1, 1, 1.6, (x, z) => { Q.part(box(x, 0, z, 1.6, 0.85, 0.75, 'wood_planks', 0x5a3a24), box(x, 0.85, z, 1.7, 0.05, 0.85, PLAIN, 0x3a2a1c),
                box(x, 0.9, z, 1.55, 0.6, 0.7, U('GlassWindowSquare1a'), 0xe6f4ff, { kind: 'glass', ds: true, win: 'keep', uv: 'fit' }), box(x, 1.5, z, 1.6, 0.04, 0.75, PLAIN, 0x3a2a1c));
                Q.P('ship_model', x, z, 180, 0.92); });
            Q.onWall('ship_wheel', 'r', Q.cz(1.5), 1.5, 0.4); Q.onWall('ships_bell', 'f', Q.cx(3.6), 1.6, 0.3); Q.P('ship_lantern', Q.cx(6) + 0.5, Q.cz(0) + 0.1, 0, 0.78);
            Q.P('banker_lamp', Q.cx(6) - 0.75, Q.cz(2) + 0.1, 180, 0.78); Q.sign('b', Q.cx(2), 2.4, 3.2, 0.42, 'TIDES AND BERTHS', '#f2e6c8', '#22303a');
        },
        /* MAINTENANCE DEPOT: oil-dark concrete, a grey-blue dado, high bays over the bays, the monitor roof lit, tool boards over the long bench, a
           beam + chain block over the truck, the compressor and the gas rack on the walls */
        'P02-10-B1': Q => {
            Q.paint(U('ConcreteStriped1a'), 0x5d6f82, 1.3, T.yellow, 1.1); Q.ceil(PLAIN, 0x44484e, 0.05, 0x8f9aa5, 2);
            for (let i = 0.5; i < 8; i += 1.5) Q.sky(Q.K.lx(i + 0.25), Q.cz(3), 2.4, 1.6);
            [[1.5, 0.6], [4, 0.6], [6.5, 0.6], [1.5, 4.5], [4, 4.5], [6.5, 4.5]].forEach(([i, j]) => Q.hb(Q.K.lx(i), Q.K.lz(j)));
            Q.part(box(Q.cx(0), Q.H - 0.65, 0, 0.32, 0.45, Q.fd - 0.8, PLAIN, T.yellow)); Q.P('chain_hoist', Q.cx(0), Q.cz(2), 90, r3(Q.H - 0.65 - 2.0));
            [1.6, 3.4, 5.2].forEach(i => Q.onWall('tool_pegboard', 'b', Q.K.lx(i), 1.3, 0.47));
            Q.P('air_compressor', Q.K.lx(0) + 0.5, Q.cz(4), 90); Q.P('gas_cylinder_rack', Q.fw / 2 - 0.45, Q.cz(3), 270);
            if (Q.has('tire_stack')) Q.P('tire_stack', Q.cx(1) - 0.9, Q.cz(5) + 0.9, 0); if (Q.has('engine_hoist')) Q.P('engine_hoist', Q.cx(3) + 0.9, Q.cz(3) - 0.2, 270);
            Q.P('psx_jerrycan_1', Q.cx(6) + 1.2, Q.cz(4) + 1.2, 20); Q.P('psx_jerrycan_1', Q.cx(6) + 0.9, Q.cz(4) + 1.35, 70);
            Q.K.wallProp('fire_extinguisher', 'f', 2.6); Q.exit(); Q.lines();
        },
        /* HANGAR: the vault lit from high bays over the walk and floodlit over the jet, a taxi line under it, the jet engine on its stand, the tug +
           the work steps parked in the back corner, NO SMOKING on the back wall */
        'P03-10-B1': Q => {
            Q.paint(U('MetalCorrugatedPainted1c'), 0x6a7480, 1.4, T.yellow, 1.1); Q.ceil(PLAIN, 0x3e4248, 0.05);
            for (let i = 1; i < 9; i += 2) Q.part(box(Q.K.lx(i), Q.H - 0.75, 0, 0.14, 0.7, Q.fd - 0.75, TRUSS, 0x8f9aa5, { kind: 'over', ds: true, under: true }));
            for (let i = 0.5; i < 9; i += 2) Q.hb(Q.K.lx(i + 0.5), Q.cz(0));
            [2.5, 4.5, 6.5].forEach(i => Q.hb(Q.K.lx(i), Q.cz(2)));
            Q.part(box(Q.K.lx(4.5), 0.012, Q.cz(2), 5 * C - 0.6, 0.01, 0.16, null, T.yellow, { sides: false, kind: 'over' }));
            Q.block(0, 1, 1, 1, 1.8, (x, z) => Q.P('jet_engine_stand', x, z, 0));
            Q.block(7, 3, 1, 1, 1.6, (x, z) => Q.P('aircraft_tug', x, z, 0)); Q.block(7, 2, 1, 1, 3, (x, z) => Q.P('maintenance_stairs', x, z, 0));
            Q.sign('b', Q.cx(1), 3.0, 3.4, 0.5, 'NO SMOKING', '#ffffff', '#b3261e'); Q.beacon(Q.K.lx(5) - 1.5, 4.2, Q.fd / 2 - 0.45, 0xff9a1a);
            Q.K.wallProp('fire_extinguisher', 'f', 3.6); Q.K.wallProp('fire_extinguisher', 'f', 7.4); Q.lines();
        },
        /* WATER WORKS: a Victorian pump house: cream glazed tile over a green tiled dado, the lantern roof's glass lit, brass pendants down the walk,
           gauge boards on the wall, the pumps + valves as Meshy pieces */
        'P01-11-B1': Q => {
            Q.paint(U('TileSubway1a'), 0x4f8a6a, 1.5, 0x7a2e2a, 1.3); Q.ceil(PLAIN, 0x5a5f66, 0.06, 0x6f7a84, 2);
            Q.sky(Q.cx(2), 0, 2.2, Q.fd - 3, 0xfff2d8);
            [1, 2.5, 4].forEach(j => Q.pend(Q.cx(2.5), Q.K.lz(j), 3.4, 0xb8893a, 0xffd890, 0.32));
            Q.onWall('gauge_board', 'b', Q.cx(2.5), 1.4); Q.onWall('gauge_board', 'r', Q.cz(1.5), 1.4);
            Q.pipe('l', 3.6, T.teal, -Q.fd / 2 + 1, Q.fd / 2 - 1); Q.sign('b', Q.cx(1.5), 3.0, 2.8, 0.45, 'HIGH LIFT PUMPS', '#f4f1ea', '#2f5f4a');
            Q.K.wallProp('fire_extinguisher', 'f', 1.6); Q.lines();
        },
        /* PUMP COURT: the valve house over the culverts: wet concrete, a red emergency light, the gauge board, the valves on the main, a manhole, the
           bulkhead down to the sewers on the back wall */
        'P02-11-B1': Q => {
            Q.paint(U('ConcreteStriped1a'), 0x5d6670, 1.2, T.yellow, 1.0); Q.ceil(PLAIN, 0x44484e, 0.04);
            [1.5, 3.5].forEach(j => Q.strip(Q.cx(1.4), Q.K.lz(j), 2.2, true, 0xdff4ff)); Q.beacon(Q.fw / 2 - 0.4, 2.4, Q.cz(4), 0xff2a1a);
            Q.onWall('gauge_board', 'r', Q.cz(3.5), 1.25); Q.part({ s: 'quad', flat: true, p: [r3(Q.cx(0) - 0.6), 0.02, r3(Q.cz(4) + 0.4)], size: [1.1, 1.1], key: U('DecalManholeCover'), kind: 'over', uv: 'fit' });
            /* THE SEWERS DOOR (bake-disaster-city.js JOIN.sewer, "on the Pump court's doorway") stood FREE 0.25 m outside this front wall, its 3.3 m
               panel over most of this room's own doorway: the room could not be walked into. It hangs on the back wall now, at the end of the walk
               (square 1, 4): in through the valve house, down through the bulkhead. */
            Q.join('sewer', Q.cx(1), -Q.fd / 2 + 0.36);
            Q.P('wet_floor_sign', Q.cx(1) + 1.1, Q.cz(1) - 0.9, 200); Q.lines();
        },
        /* RAIL SERVICE: the signal box: brick, a warm bulb, the lever frame on its own square, the hand lamps by the door and on the desk */
        'P03-11-B1': Q => {
            Q.paint('wood_planks', 0x5a3a24, 1.0, 0x2a2c30, 1.2); Q.ceil('wood_planks', 0x7a5a3c, 0.1);
            Q.pend(Q.cx(1), Q.cz(0.5), 2.6, 0x2a2c30, 0xffd890, 0.3); Q.pend(Q.cx(2), Q.cz(1), 2.6, 0x2a2c30, 0xffd890, 0.3);
            Q.block(0, 1, 1, 1, 1.4, (x, z) => Q.P('signal_lever_frame', x, z + 0.4, 180));
            Q.P('railway_lantern', Q.cx(2) + 0.55, Q.cz(0) - 0.05, 180, 0.78); Q.P('railway_lantern', Q.cx(1) + 1.2, Q.fd / 2 - 0.5, 160);
            Q.K.wallProp('fire_extinguisher', 'f', 1.6);
        },
    };
    const inside = (b, c, world, rot, row) => {
        const S = IN[b.id]; if (!S) return; const fw = c.fw, fd = c.fd, H = (row.storeys || 2) * 3.5 - 0.32, parts = [], W2 = (lx, lz) => world(c.ox + lx, c.oz + lz);
        const dc = Math.floor((c.door.lx + fw / 2) / C);
        if (S.g.some(q => q[2] === 0 && dc >= q[1] && dc < q[1] + q[3])) { console.log('industrial: the doorway square of', b.id, 'is not a walkway, the inside is left out'); return; }
        row.keyIn = S.keyIn; row.floorIn = S.floorIn; if (S.tintIn) row.tintIn = S.tintIn;
        const K = { H, fw, fd, lx: i => -fw / 2 + i * C, lz: j => fd / 2 - j * C, part() { for (const q of arguments) parts.push(q); },
            P(key, lx, lz, hd, y, more) { const p = W2(lx, lz), q = { key, x: p[0], z: p[1], face: (((hd || 0) + rot) % 360 + 360) % 360, floor: true }; if (y) q.y = r3(y); if (more) Object.assign(q, more); props.push(q); count2.inProps = (count2.inProps || 0) + 1; },
            /* a prop hung / stood on a wall: side 'f' front, 'b' back, 'l' left, 'r' right; u = squares along that wall (from the left, or from the front) */
            wallProp(key, side, u) { const e = 0.32; if (side === 'f') K.P(key, K.lx(u), fd / 2 - e, 0); else if (side === 'b') K.P(key, K.lx(u), -fd / 2 + e, 180); else if (side === 'l') K.P(key, -fw / 2 + e, K.lz(u), 90); else K.P(key, fw / 2 - e, K.lz(u), 270); },
            wallPropAt(key, lx, lz, hd) { K.P(key, lx, lz, hd); },
            sign(i, j, w, words) { parts.push(txt(K.lx(i), 2.5, K.lz(j) + 0.14, w, 0.45, words, '#22262a')); } };
        S.g.forEach(q => { const kit = q[0], i = q[1], j = q[2], w = q[3], d = q[4], x = K.lx(i + w / 2), z = K.lz(j + d / 2), hd = j === 0 ? 0 : 180;
            for (let a = 0; a < w; a++) for (let e = 0; e < d; e++) { const p = W2(K.lx(i + a + 0.5), K.lz(j + e + 0.5)); features.push({ k: 'wall', x0: p[0], z0: p[1], x1: p[0], z1: p[1], h: KH[kit] || 1.2, t: C, key: CONC, ghost: true, rail: false }); count2.inBlocks = (count2.inBlocks || 0) + 1; }
            if (kit !== 'jet') KIT[kit](K, x, z, w * C, d * C, q[5], hd); });
        (S.walls || []).forEach(q => { const x0 = K.lx(q[0]), z0 = K.lz(q[1]), x1 = K.lx(q[2]), z1 = K.lz(q[3]), a = W2(x0, z0), e = W2(x1, z1);
            parts.push(box((x0 + x1) / 2, 0, (z0 + z1) / 2, Math.abs(x1 - x0) + 0.2, H, Math.abs(z1 - z0) + 0.2, S.keyIn, S.tintIn || 0xffffff, { top: false }));
            features.push({ k: 'wall', x0: a[0], z0: a[1], x1: e[0], z1: e[1], h: H, t: 0.3, key: CONC, ghost: true, rail: false }); });
        /* ceiling light panels over the walkways, every other square */
        for (let i = 0; i < S.W; i++) for (let j = 0; j < S.D; j++) if ((i + j) % 2 === 0 && !S.g.some(q => i >= q[1] && i < q[1] + q[3] && j >= q[2] && j < q[2] + q[4]))
            parts.push(box(K.lx(i + 0.5), H - 0.1, K.lz(j + 0.5), 1.4, 0.08, 0.5, null, 0xfff4d6, { glow: 1 }));
        if (S.decor) S.decor(K);
        if (SECOND[b.id]) SECOND[b.id](kit2(K, S, dc, c, (i, j, h) => { const p = W2(K.lx(i + 0.5), K.lz(j + 0.5)); features.push({ k: 'wall', x0: p[0], z0: p[1], x1: p[0], z1: p[1], h: h || 1.2, t: C, key: CONC, ghost: true, rail: false }); count2.inBlocks2 = (count2.inBlocks2 || 0) + 1; }, W2, rot));
        const wp = W2(0, 0); out.push({ k: 'arch', id: 'ind:' + b.id + ':in', x: wp[0], y: 0, z: wp[1], rot, parts }); count2.inRooms = (count2.inRooms || 0) + 1; count2.inParts = (count2.inParts || 0) + parts.length;
    };
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
        if (row && DS.inside) inside(b, c, world, rot, row);
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
    (function () { const b = bInfo.find(v => v.id === 'P03-10-B1'); if (!b) return; const ew = b.side === 'E' || b.side === 'W', fd = (ew ? b.w : b.d2) + C, q = ROT[b.side] * Math.PI / 180, lz = fd / 2 - 8.6;
        if (fd < 13.9) { console.log('industrial: the hangar is', fd, 'm deep, the jet stays out'); return; }
        const fw = ew ? b.d2 : b.w, lx = Math.round(fw / C) % 2 ? 0 : -C / 2;   // an even count of squares along the hangar: half a square off, so it fills whole squares
        /* the walk square the deeper hangar took: the street lamp that stood on it goes */
        if (ctx.lamps) { const hw = (ew ? fd : fw) / 2 + 0.3, hd = (ew ? fw : fd) / 2 + 0.3, cx = b.x - (C / 2) * Math.sin(q), cz = b.z + (C / 2) * Math.cos(q);
            for (let i = ctx.lamps.length - 1; i >= 0; i--) { const l = ctx.lamps[i]; if (Math.abs(l.x - cx) < hw && Math.abs(l.z - cz) < hd) { ctx.lamps.splice(i, 1); count2.lampOut = (count2.lampOut || 0) + 1; } } }
        props.push({ key: 'fighter_jet', x: r3(b.x + lx * Math.cos(q) - (lz + C / 2) * Math.sin(q)), z: r3(b.z + lx * Math.sin(q) + (lz + C / 2) * Math.cos(q)), face: ew ? 0 : 90 }); count2.jet = 1; })();
    lateRows.push(...out);
    console.log('industrial', JSON.stringify(count2));
};
