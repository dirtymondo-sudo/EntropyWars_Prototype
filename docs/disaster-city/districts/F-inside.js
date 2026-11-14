/* DISASTER CITY · THE FINANCIAL DISTRICT · THE INSIDES (2026-11-13, mondo 21:04 "after the district threads do their exterior polish, let's go
   ahead and do the interiors"; his OK on the plan 21:19; the hotel is his exception: it gets an inside too). Required by F.js (not a district
   file): `furnish(T)` runs after a walk-in's outside is written and fills its one hall.
   THE SQUARES (mondo 21:14 + 21:17): the city fights on 3.5 m squares. A thing that BLOCKS (a counter, a sofa, a vault, a cage) stands on the
   middle of a whole square of the CITY's grid (`g.c(i, j)`: the full squares inside the walls, i along the front, j from the back wall), so
   every walkway is whole squares wide; a thing that does nothing in a fight (a plant, a lamp, a chair, a rug) stands OFF a square's middle;
   what hangs flat on a wall (lift doors, mail boxes, screens, a vault door) takes no square. Where a building is not whole squares wide the
   strip left along a wall holds only wall-side things.
   Furniture = models already in the catalogue (MODEL_LIST.md §6); counters, cages, beds and lamps are arch parts with a ghost wall for the
   walker. One arch row a building: `dc:<id>:in`. */
'use strict';
const { INDOOR } = require('../props.js');
module.exports = function (K, A) {
    const { box, cyl, dome, quad, STONE, ALU, GUN, WOOD, CONC, CORR2, U } = K, { local, props, features, lateRows } = A, WHITE = 0xffffff;
    const atmos = require('./F-atmos.js')(K, A);   // THE SECOND PASS (2026-11-14): light, panelling and the Meshy pieces over each hall's first pass
    const r3 = v => Math.round(v * 1000) / 1000;
    const IRON = 0x24272c, LAMP = 0xffd890, BRASS = { gain: 1.5 }, GRILL = U('MetalSubwayGrill1a'), CR = 0xd8d0c0;
    /* the city's full squares inside a building, in its own frame */
    const grid = T => {
        const q = T.rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q), ew = Math.abs(Math.round(s)) === 1, wx = (ew ? T.D : T.W) / 2, wz = (ew ? T.W : T.D) / 2, xs = new Set(), zs = new Set();
        for (let cx = Math.ceil((T.x - wx + 252) / 3.5 - 0.09); cx + 1 <= (T.x + wx + 252) / 3.5 + 0.09; cx++) for (let cz = Math.ceil((T.z - wz + 252) / 3.5 - 0.09); cz + 1 <= (T.z + wz + 252) / 3.5 + 0.09; cz++) {
            const dx = -252 + (cx + 0.5) * 3.5 - T.x, dz = -252 + (cz + 0.5) * 3.5 - T.z; xs.add(r3(dx * c + dz * s)); zs.add(r3(-dx * s + dz * c)); }
        const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
        return { X, Z, nx: X.length, nz: Z.length, c: (i, j) => [X[i], Z[j]], bw: -T.D / 2 + 0.3, fw: T.D / 2 - 0.3, lw: -T.W / 2 + 0.3, rw: T.W / 2 - 0.3 };
    };
    const DIR = { f: 180, b: 0, r: 90, l: 270 };   // the way a prop's front looks, in the building's frame
    const ctx = T => {
        const Q = [];
        const put = (key, x, z, dir, o) => { const w = local(T, x, z), q = Object.assign({ key, x: w[0], z: w[1], face: (DIR[dir || 'f'] + T.rot) % 360 }, o || {}); props.push(q); INDOOR.add(q); };
        const solid = (x0, z0, x1, z1, t, h) => { const a = local(T, x0, z0), b = local(T, x1, z1); lateRows.push({ k: 'wall', x0: a[0], z0: a[1], x1: b[0], z1: b[1], t: t || 0.8, h: h || 1.1, ghost: true, rail: false }); };
        /* a counter on a square's middle: `len` along x (or z), a stone top on a panelled body */
        const counter = (x, z, len, alongZ, o) => { o = o || {}; const h = o.h || 1.05, dp = o.depth || 0.9, w = alongZ ? dp : len, d = alongZ ? len : dp;
            Q.push(box(x, 0, z, w, h, d, o.key || WOOD, o.tint || 0x8a5a3a), box(x, h, z, w + 0.12, 0.07, d + 0.12, o.top || STONE, o.topTint || 0xe8e4dc), box(x, 0, z, w + 0.04, 0.12, d + 0.04, null, IRON, { top: false }));
            solid(alongZ ? x : x - len / 2, alongZ ? z - len / 2 : z, alongZ ? x : x + len / 2, alongZ ? z + len / 2 : z, dp, h); };
        /* a brass teller screen standing on a counter */
        const screen = (x, z, len) => Q.push(quad(x, 1.12, z, len, 1.1, 0, GRILL, 0xd8b860, { uv: [0.55, 0.55], kind: 'over', ds: true }), box(x, 2.22, z, len, 0.08, 0.1, 'gold', WHITE, BRASS), box(x - len / 2, 1.12, z, 0.08, 1.1, 0.1, 'gold', WHITE, Object.assign({ n: 2, step: [len, 0, 0] }, BRASS)));
        /* lift doors drawn shut on a wall (ry 0 = on the back wall, facing the front) */
        const lift = (x, z, ry) => { const o = ry === 270 ? [0.02, 0] : ry === 90 ? [-0.02, 0] : [0, 0.02], al = ry === 270 || ry === 90;
            Q.push(quad(x, 0, z, 1.9, 2.4, ry, CORR2, 0xc8ccd0, { uv: [0.95, 2.4], kind: 'wall' }), quad(x + o[0], 0, z + o[1], 0.04, 2.4, ry, null, IRON),
                box(x, 2.4, z, al ? 0.14 : 2.3, 0.2, al ? 2.3 : 0.14, ALU, 0xe0e4e8), box(al ? x : x - 1.1, 0, al ? z - 1.1 : z, 0.14, 2.4, 0.14, ALU, 0xe0e4e8, { n: 2, step: al ? [0, 0, 2.2] : [2.2, 0, 0] }),
                box(x + (al ? 0 : 1.45), 1.1, z + (al ? 1.45 : 0), 0.12, 0.22, 0.12, null, LAMP, { glow: 1 }), box(x, 2.7, z, al ? 0.1 : 0.7, 0.2, al ? 0.7 : 0.1, null, 0xff5030, { glow: 1 })); };
        /* a chandelier hung from the ceiling: a gold ring of lamps on a rod */
        const chandelier = (x, z, ceil, drop, r) => Q.push(cyl(x, ceil - drop, z, 0.04, drop, null, IRON, { seg: 4 }), cyl(x, ceil - drop - 0.12, z, r, 0.12, 'gold', WHITE, Object.assign({ seg: 16, ri: r - 0.12 }, BRASS)), cyl(x, ceil - drop - 0.1, z, r * 0.45, 0.1, 'gold', WHITE, Object.assign({ seg: 12 }, BRASS)),
            box(x, ceil - drop - 0.34, z, 0.2, 0.24, 0.2, null, LAMP, { glow: 1, ring: { n: 8, r: r - 0.06 } }), box(x, ceil - drop - 0.4, z, 0.3, 0.3, 0.3, null, LAMP, { glow: 1 }));
        const ceilLamp = (x, z, ceil, n, st) => Q.push(box(x, ceil - 0.1, z, 1.4, 0.08, 0.4, null, LAMP, Object.assign({ glow: 1, under: true }, n ? { n, step: st } : {})));
        /* a wall between squares (on the squares' line): to the ceiling, or a cage of grille */
        const partition = (x0, z0, x1, z1, h, key, tint) => { const al = Math.abs(x1 - x0) < 0.01, len = al ? Math.abs(z1 - z0) : Math.abs(x1 - x0); Q.push(box((x0 + x1) / 2, 0, (z0 + z1) / 2, al ? 0.2 : len, h, al ? len : 0.2, key, tint)); solid(x0, z0, x1, z1, 0.3, h); };
        const cage = (x0, z, x1, h) => { const len = x1 - x0, cx = (x0 + x1) / 2; Q.push(quad(cx, 0.15, z, len, h - 0.3, 0, GRILL, 0xa8aeb4, { uv: [0.7, 0.7], kind: 'over', ds: true }), box(cx, 0, z, len, 0.15, 0.2, GUN, 0x70747c), box(cx, h - 0.15, z, len, 0.15, 0.2, GUN, 0x70747c), box(x0 + 0.08, 0, z, 0.16, h, 0.22, GUN, 0x70747c, { n: Math.max(2, Math.round(len / 1.75) + 1), step: [(len - 0.16) / Math.max(1, Math.round(len / 1.75)), 0, 0] })); solid(x0, z, x1, z, 0.3, h); };
        /* a pile of gold bars on a pallet, on a square's middle */
        const gold = (x, z) => { Q.push(box(x, 0, z, 1.9, 0.14, 1.3, WOOD, 0x8a6a48), box(x, 0.14, z, 1.6, 0.3, 1.0, 'gold', WHITE, BRASS), box(x, 0.44, z, 1.2, 0.3, 0.8, 'gold', WHITE, BRASS), box(x, 0.74, z, 0.8, 0.3, 0.5, 'gold', WHITE, BRASS)); solid(x - 0.9, z, x + 0.9, z, 1.2, 1.0); };
        /* a planting bed: a stone kerb, earth, a low green */
        const bed = (x, z, w, d, block) => { Q.push(box(x, 0, z, w, 0.5, d, STONE, CR), box(x, 0.5, z, w - 0.3, 0.06, d - 0.3, null, 0x3a2c20), box(x, 0.5, z, w - 0.6, 0.4, d - 0.6, 'leaves_3', 0xb8e0a8)); if (block) solid(x - w / 2, z, x + w / 2, z, d, 0.9); };
        /* a glowing screen on a wall */
        const tv = (x, y, z, w, h, ry, tint) => Q.push(quad(x, y, z, w, h, ry || 0, null, tint || 0x58c8ff, { glow: 0.4 }), quad(x, y - 0.06, z - (ry ? 0 : 0.01), w + 0.12, h + 0.12, ry || 0, null, IRON));
        const done = () => { if (Q.length) features.push({ k: 'arch', id: 'dc:' + T.id + ':in', x: T.x, z: T.z, y: 0, rot: T.rot, parts: Q.filter(Boolean).map(p => { if (p.key == null) delete p.key; return p; }) }); };
        return { Q, put, solid, counter, screen, lift, chandelier, ceilLamp, partition, cage, gold, bed, tv, done };
    };
    const look = (T, keyIn, floorIn) => { if (keyIn) T.row.keyIn = keyIn; if (floorIn) T.row.floorIn = floorIn; };

    /* THE BEDROOMS (mondo 11-14 02:21, the residents' brief): a bankers' terrace is one walk-in home. The bedroom is the two back rows behind
       a wall with one whole square left open; a bed a resident on the back row (the residents' code finds any /bed|cot/ prop in the home),
       a wardrobe; the front room keeps the door's column clear and has a sofa, a table and a kitchen counter down the far column. */
    const home = beds => (T, g, I) => {
        look(T, U('PlasterWallPainted1b'), 'wood_planks'); const H = 3.18, c = g.c, n = g.nx, zp = c(0, 1)[1] + 1.75, BED = ['psx_bed_4_1', 'psx_bed_5_2'];
        I.partition(g.lw, zp, c(1, 0)[0] - 1.75, zp, H, U('PlasterWallPainted1b'), 0xe8e0d0); I.partition(c(1, 0)[0] + 1.75, zp, g.rw, zp, H, U('PlasterWallPainted1b'), 0xe8e0d0);
        for (let k = 0; k < beds; k++) { const p = c(k * 2, 0); I.put(BED[k % 2], p[0], p[1], 'f'); I.put('psx_bedside_table_1', p[0] + 1.35, p[1] - 1.2, 'f'); I.put('table_lamp', p[0] + 1.35, p[1] - 1.2, 'f', { y: 0.66 }); }
        const w = n > 3 ? c(n - 1, 0) : c(0, 1); I.put('psx_wardrobe_mp_1', w[0], w[1], n > 3 ? 'f' : 'r');
        I.put('rug_round', c(1, 0)[0] + 0.9, c(1, 0)[1] + 1.2, 'f'); I.put('potted_plant', g.rw - 0.5, zp - 0.5, 'f');
        const e = n - 1;
        I.put('psx_dinner_table_1', c(e, 2)[0], c(e, 2)[1], 'f'); I.put('psx_chair_mp_1', c(e, 2)[0] - 1.25, c(e, 2)[1] + 0.9, 'r');
        I.put('psx_sofa_3', c(e, 3)[0], c(e, 3)[1], 'l'); I.put('rug_office', c(e - 1, 3)[0] + 0.9, c(e - 1, 3)[1] + 0.8, 'f'); I.put('globe_lamp', g.rw - 0.5, c(e, 3)[1] + 1.75, 'f');
        I.counter(c(e, 4)[0], c(e, 4)[1], 3.3, false, { tint: 0xe8e0d0, key: U('PlasterWallPainted1a'), topTint: 0x40444a, top: null }); I.put('mini_fridge', c(e, 4)[0] - 1.2, g.fw - 0.45, 'b', { y: 1.13 });
        if (n > 3) { I.put('library_shelf_full', c(e - 2, 2)[0], zp + 0.75, 'f'); I.put('psx_armchair_1', c(e - 1, 4)[0] + 0.9, c(e - 1, 4)[1] + 0.8, 'b'); }
        I.put('office_plant', g.lw + 0.5, zp + 0.5, 'f');
        I.ceilLamp(c(1, 0)[0], c(0, 0)[1] + 1.75, H); I.ceilLamp(c(Math.min(e, 1), 3)[0], c(0, 3)[1], H, n > 3 ? 2 : 1, [7, 0, 0]);
    };
    const INS = {
        'P11-00-B2': home(1), 'P10-01-B2': home(1), 'P11-02-B2': home(1), 'P09-03-B2': home(2),
        /* 1. THE HOTEL LOBBY (8 x 8, 6.7 m high): reception across the back between the lifts and the stair door, a lounge with the piano on
              one side, the bar down the other, two dining tables by the front */
        'P08-00-B1': (T, g, I) => {
            look(T, U('PlasterWallPainted1d'), U('TileMarble2a')); const H = 6.68, c = g.c;
            I.counter(0, c(0, 0)[1], 10.3, false, { tint: 0x6a3a28, topTint: 0xf0e8d8 }); I.put('desk_lamp', -3.6, c(0, 0)[1], 'f', { y: 1.13 }); I.put('desk_lamp', 3.6, c(0, 0)[1], 'f', { y: 1.13 });
            I.Q.push(box(0, 0, g.bw + 0.25, 9, 2.6, 0.4, WOOD, 0x5a3424), box(0, 2.6, g.bw + 0.3, 9.4, 0.14, 0.5, 'gold', WHITE, BRASS), box(-3.9, 1.3, g.bw + 0.47, 0.5, 0.12, 0.06, 'gold', WHITE, Object.assign({ n: 14, step: [0.6, 0, 0] }, BRASS)), box(-3.9, 1.8, g.bw + 0.47, 0.5, 0.12, 0.06, 'gold', WHITE, Object.assign({ n: 14, step: [0.6, 0, 0] }, BRASS)));
            I.lift(c(0, 0)[0], g.bw + 0.03, 0); I.lift(c(1, 0)[0], g.bw + 0.03, 0);
            I.Q.push(quad(c(7, 0)[0], 0, g.bw + 0.03, 1.2, 2.3, 0, U('DoorPaintedHalf2a'), 0xc8c8c0, { uv: [1.2, 2.3], kind: 'wall' }), box(c(7, 0)[0], 2.4, g.bw + 0.06, 0.9, 0.24, 0.06, null, 0x40c060, { glow: 1 }));
            for (const j of [2, 3]) I.put('psx_sofa_3', c(0, j)[0], c(0, j)[1], 'r'); I.put('coffee_table', c(1, 2)[0] - 0.9, c(1, 2)[1] + 1.75, 'f'); I.put('rug_office', c(1, 2)[0] - 0.9, c(1, 2)[1] + 1.75, 'f'); I.put('globe_lamp', g.lw + 0.5, c(0, 4)[1] - 0.2, 'f');
            I.put('decor_piano', c(0, 5)[0], c(0, 5)[1], 'r'); I.put('tulip_chair', c(0, 5)[0] + 1.2, c(0, 5)[1] + 1.0, 'l');
            I.counter(c(7, 3)[0], c(7, 3)[1], 10.3, true, { tint: 0x4a2a20, topTint: 0x2a2c30, top: null });
            I.Q.push(box(g.rw - 0.2, 1.3, c(7, 3)[1], 0.3, 0.06, 9.6, WOOD, 0x4a2a20, { n: 3, step: [0, 0.55, 0] }), box(g.rw - 0.2, 1.36, c(7, 3)[1] - 4.4, 0.14, 0.34, 0.14, null, 0x2a6a4a, { n: 12, step: [0, 0, 0.8] }), box(g.rw - 0.2, 1.91, c(7, 3)[1] - 4.0, 0.14, 0.34, 0.14, null, 0xa86a2a, { n: 11, step: [0, 0, 0.8] }));
            for (const j of [2, 3, 4]) I.put('tulip_chair', c(6, j)[0] + 1.15, c(6, j)[1] + 0.9, 'r');
            for (const p of [c(6, 6), c(7, 7)]) { I.put('tulip_table', p[0], p[1], 'f'); I.put('tulip_chair', p[0] - 0.9, p[1] - 0.9, 'r'); I.put('tulip_chair', p[0] + 0.9, p[1] + 0.9, 'l'); }
            I.chandelier(0, 0, H, 1.6, 1.5); I.chandelier(-7, 5, H, 1.2, 0.9); I.chandelier(7, 5, H, 1.2, 0.9);
            /* THE POLITICIAN'S ROOM (the residents' brief: "a hotel room is fine"): the front corner, two squares by two, walled to 3.2 m under a lid, a whole square left open as its door */
            { const x1 = c(1, 0)[0] + 1.75, z0 = c(0, 6)[1] - 1.75, RW = U('PlasterWallPainted1b');
              I.partition(g.lw, z0, x1, z0, 3.2, RW, 0xe8dcc8); I.partition(x1, c(0, 7)[1] - 1.75, x1, g.fw, 3.2, RW, 0xe8dcc8);
              I.Q.push(box((g.lw + x1) / 2, 3.2, (z0 + g.fw) / 2, x1 - g.lw + 0.2, 0.15, g.fw - z0 + 0.2, RW, 0xe8dcc8, { under: true }), box(x1, 2.3, c(0, 6)[1], 0.2, 0.9, 3.5, RW, 0xe8dcc8));
              I.put('psx_bed_2', c(0, 7)[0], c(0, 7)[1], 'r'); I.put('psx_bedside_table_1', c(0, 7)[0] - 1.2, c(0, 7)[1] - 1.4, 'r'); I.put('table_lamp', c(0, 7)[0] - 1.2, c(0, 7)[1] - 1.4, 'r', { y: 0.66 });
              I.put('psx_wardrobe_mp_1', c(0, 6)[0], c(0, 6)[1], 'f'); I.put('rug_round', c(1, 7)[0] - 0.7, c(1, 7)[1] - 0.9, 'f'); I.Q.push(box(c(0, 7)[0], 3.0, c(0, 7)[1], 0.5, 0.12, 0.5, null, LAMP, { glow: 1 })); }
            I.put('palm_tree', c(2, 7)[0] - 1.2, g.fw - 0.6, 'f', { h: 2.6 }); I.put('palm_tree', g.rw - 0.6, g.bw + 0.9, 'f', { h: 2.6 }); I.put('potted_plant', c(2, 7)[0] + 1.2, g.fw - 0.5, 'f'); I.put('potted_plant', c(5, 7)[0] + 1.2, g.fw - 0.5, 'f');
            I.Q.push(quad(T.lx, 0.04, c(4, 6)[1], 2.4, 6.6, 0, null, 0xa01828, { flat: true }));
        },
        /* 3. THE GOBLIN BANK (6 x 6 squares and a strip each side, 13.7 m high): a teller line across the hall with a two-square gate, the
              great vault door on the back wall between two gold piles, two managers' desks, two writing tables, benches down the side strips */
        'P10-00-B1': (T, g, I) => {
            look(T, U('PlasterWallStucco1a'), U('TileMarble2a')); const H = 13.68, c = g.c, zb = g.bw + 0.04;
            for (const i of [0, 4]) { const x = (c(i, 2)[0] + c(i + 1, 2)[0]) / 2; I.counter(x, c(i, 2)[1], 6.6, false, { key: STONE, tint: 0xd2dcc8, topTint: 0x2c4a3c, h: 1.1 }); I.screen(x, c(i, 2)[1], 6.4); I.put('cash_register', x - 1.7, c(i, 2)[1], 'b', { y: 1.18 }); I.put('cash_register', x + 1.7, c(i, 2)[1], 'b', { y: 1.18 }); }
            I.Q.push(box(0, 0, zb + 0.1, 5.6, 6.2, 0.2, GUN, 0x8a909c), quad(0, 0.5, zb + 0.22, 4.6, 4.6, 0, 'metal', 0xd8dce0, { uv: 'fit' }),
                box(0, 2.6, zb + 0.3, 3.0, 0.24, 0.16, 'gold', WHITE, BRASS), box(0, 1.3, zb + 0.3, 0.24, 3.0, 0.16, 'gold', WHITE, BRASS), box(0, 2.3, zb + 0.4, 0.9, 0.9, 0.12, 'gold', WHITE, BRASS), box(-1.9, 0.9, zb + 0.24, 0.2, 0.2, 0.08, null, IRON, { n: 6, step: [0.76, 0, 0] }), box(-1.9, 4.5, zb + 0.24, 0.2, 0.2, 0.08, null, IRON, { n: 6, step: [0.76, 0, 0] }), box(-2.6, 0, zb + 0.3, 0.4, 6.2, 0.4, 'gold', WHITE, Object.assign({ n: 2, step: [5.2, 0, 0] }, BRASS)), box(0, 6.2, zb + 0.3, 6.0, 0.4, 0.5, 'gold', WHITE, BRASS));
            I.gold(c(1, 0)[0], c(1, 0)[1]); I.gold(c(4, 0)[0], c(4, 0)[1]);
            for (const i of [0, 5]) { I.put('exec_desk', c(i, 0)[0], c(i, 0)[1], 'f'); I.put('exec_chair', c(i, 0)[0], c(i, 0)[1] - 1.0, 'f'); I.put('desk_lamp', c(i, 0)[0] + 0.8, c(i, 0)[1], 'f', { y: 1.0 }); }
            for (const i of [1, 4]) { const p = c(i, 4); I.counter(p[0], p[1], 2.2, false, { key: STONE, tint: 0xd2dcc8, topTint: 0x2c4a3c, depth: 1.1, h: 1.15 }); I.put('desk_lamp', p[0], p[1], 'f', { y: 1.24 }); }
            for (const s of [-1, 1]) { I.put('city_bench', s * (g.rw - 0.45), c(0, 4)[1], s > 0 ? 'l' : 'r'); I.put('city_bench', s * (g.rw - 0.45), c(0, 5)[1], s > 0 ? 'l' : 'r'); I.put('potted_plant', s * (g.rw - 0.5), g.fw - 0.5, 'f'); I.put('globe_lamp', s * (g.rw - 0.5), c(0, 3)[1] - 1.75, 'f'); }
            I.chandelier(0, c(0, 4)[1] - 1.75, H, 6.2, 2.0); I.chandelier(-7, c(0, 1)[1], H, 7.6, 1.0); I.chandelier(7, c(0, 1)[1], H, 7.6, 1.0);
        },
        /* 7. THE BANK OFFICES LOBBY (9 x 4, 6.7 m high): reception, a guard's desk and a gate by the lifts, a waiting corner */
        'P10-01-B1': (T, g, I) => {
            look(T, U('PlasterWallPainted1a'), U('TileGeneric5a')); const H = 6.68, c = g.c, x = (c(4, 0)[0] + c(5, 0)[0]) / 2;
            I.counter(x, c(4, 0)[1], 6.4, false, { key: STONE, tint: 0xd8d8d0, topTint: 0x30343a }); I.put('desk_lamp', x - 2.4, c(4, 0)[1], 'f', { y: 1.13 }); I.put('office_chair', x, c(4, 0)[1] - 1.0, 'f');
            I.Q.push(box(x, 2.1, g.bw + 0.06, 5.2, 1.3, 0.05, null, 0x1e3a5a), box(x - 1.6, 2.4, g.bw + 0.1, 0.7, 0.7, 0.05, null, 0xf4f4f0, { n: 3, step: [1.6, 0, 0] }), box(x - 1.6, 2.72, g.bw + 0.13, 0.05, 0.3, 0.03, null, IRON, { n: 3, step: [1.6, 0, 0] }), box(x - 1.48, 2.72, g.bw + 0.13, 0.24, 0.05, 0.03, null, IRON, { n: 3, step: [1.6, 0, 0] }));
            I.lift(g.lw + 0.03, c(0, 0)[1], 270); I.lift(g.lw + 0.03, c(0, 1)[1], 270);
            I.put('exec_desk', c(2, 0)[0], c(2, 0)[1], 'f'); I.put('exec_chair', c(2, 0)[0], c(2, 0)[1] - 1.0, 'f');
            I.put('ebd_metro_turnstile', c(1, 2)[0], c(1, 2)[1], 'r'); I.Q.push(box(c(1, 2)[0], 0, c(1, 2)[1] - 1.1, 0.5, 1.0, 0.5, ALU, 0xd0d4d8), box(c(1, 2)[0], 0, c(1, 2)[1] + 1.1, 0.5, 1.0, 0.5, ALU, 0xd0d4d8)); I.solid(c(1, 2)[0], c(1, 2)[1] - 1.4, c(1, 2)[0], c(1, 2)[1] + 1.4, 0.6, 1.0);
            for (const j of [1, 2]) I.put('psx_sofa_3', c(8, j)[0], c(8, j)[1], 'l'); I.put('coffee_table', c(7, 1)[0] + 0.9, c(7, 1)[1] + 1.75, 'f'); I.put('rug_office', c(7, 1)[0] + 0.9, c(7, 1)[1] + 1.75, 'f');
            I.put('potted_plant', g.rw - 0.5, g.bw + 0.5, 'f'); I.put('potted_plant', g.rw - 0.5, g.fw - 0.5, 'f'); I.put('office_plant', g.lw + 0.5, g.fw - 0.5, 'f'); I.put('office_plant', c(6, 0)[0] + 1.2, g.bw + 0.5, 'f');
            I.ceilLamp(c(1, 1)[0], c(0, 1)[1] + 1.75, H, 4, [7, 0, 0]);
        },
        /* 8. THE VAULT ANNEX (8 x 7, 3.2 m high): a guard post and a gate, a cage wall with one opening, then the deposit boxes, the counting
              table, two vaults and the gold */
        'P11-01-B1': (T, g, I) => {
            look(T, U('ConcreteStriped2c'), U('ConcreteUnderTiles1')); const H = 3.18, c = g.c, zc = (c(0, 4)[1]);
            I.cage(g.lw, zc, c(2, 4)[0] + 1.75, H); I.cage(c(4, 4)[0] - 1.75, zc, g.rw, H);
            I.Q.push(box(c(3, 4)[0], H - 0.3, zc, 3.5, 0.3, 0.22, GUN, 0x70747c), quad(c(3, 4)[0] + 2.2, 1.3, zc + 0.13, 0.5, 0.5, 0, U('SignProhibited1a'), WHITE, { uv: 'fit' }));
            for (const i of [1, 6]) I.put('vault', c(i, 0)[0], c(i, 0)[1], 'f', { h: 2.9 });
            I.gold(c(3, 0)[0], c(3, 0)[1]); I.gold(c(4, 0)[0], c(4, 0)[1]);
            for (const i of [0, 2, 5, 7]) { const p = c(i, 2); for (const k of [-1, 0, 1]) I.put('office_locker', p[0] + k * 0.85, p[1], 'f'); I.solid(p[0] - 1.3, p[1], p[0] + 1.3, p[1], 0.7, 1.8); }
            I.put('steel_table', c(4, 2)[0], c(4, 2)[1], 'f'); I.put('psx_cash_1', c(4, 2)[0] - 0.3, c(4, 2)[1], 'f', { y: 1.0 }); I.put('folding_chair', c(4, 2)[0] + 1.2, c(4, 2)[1] + 0.9, 'l');
            I.put('exec_desk', c(6, 5)[0], c(6, 5)[1], 'f'); I.put('exec_chair', c(6, 5)[0], c(6, 5)[1] - 1.0, 'f');
            I.put('ebd_metro_turnstile', c(2, 5)[0], c(2, 5)[1], 'f');
            I.put('locker_bench', g.lw + 1.3, g.fw - 0.45, 'b'); I.put('filing_cabinet', g.rw - 0.45, c(7, 6)[1] + 0.9, 'l');
            for (const s of [-1, 1]) I.Q.push(box(s * (g.rw - 0.25), 2.6, g.fw - 0.4, 0.26, 0.22, 0.5, null, 0xe0e4e8), box(s * (g.rw - 0.25), 2.6, zc - 0.5, 0.26, 0.22, 0.5, null, 0xe0e4e8));
            I.ceilLamp(c(1, 1)[0], c(0, 1)[1], H, 3, [10.5, 0, 0]); I.ceilLamp(c(1, 3)[0], c(0, 3)[1], H, 3, [10.5, 0, 0]); I.ceilLamp(c(1, 5)[0], c(0, 5)[1] + 1.75, H, 3, [10.5, 0, 0]);
        },
        /* 9. THE TAXI DISPATCH (smaller than two squares): a desk on the back wall, lockers, a bench; the middle stays clear */
        'P08-02-B1': (T, g, I) => {
            look(T, U('PlasterWallPainted1a'), U('TileGeneric5a'));
            I.put('tanker_desk', -1.2, g.bw + 0.45, 'f'); I.put('office_chair', -1.2, g.bw + 1.3, 'b'); I.put('desk_fan', -0.8, g.bw + 0.4, 'f', { y: 1.0 });
            I.put('locker', g.rw - 0.75, g.bw + 0.35, 'f'); I.put('locker', g.rw - 1.6, g.bw + 0.35, 'f');
            I.tv(-1.2, 1.5, g.bw + 0.03, 1.6, 0.9, 0, 0x50d890); I.ceilLamp(0, 0, 3.18);
        },
        /* 10. THE DRIVERS' STORE (one row of squares between two half strips, 3.2 m high): fridges and shelves along the back wall strip, a
               shelf unit on one end square, the counter and its till on the other, the door's square and the squares beside it clear */
        'P08-02-B2': (T, g, I) => {
            look(T, U('PlasterWallPainted1a'), U('TileGeneric5a')); const H = 3.18, c = g.c, n = g.nx, z = c(0, 0)[1];
            for (let k = 0; k < 4; k++) I.put('round_fridge', g.lw + 0.7 + k * 1.1, g.bw + 0.5, 'f');
            for (let k = 0; k < 5; k++) I.put('metal_shelving', -2 + k * 1.1, g.bw + 0.3, 'f');
            I.put('vending_machine', g.rw - 0.4, g.bw + 1.2, 'l'); I.put('vending_machine', g.rw - 0.4, g.bw + 2.4, 'l');
            I.put('ebd_gasstation_metal_shelving', c(0, 0)[0], z, 'r', { h: 1.9 });
            I.counter(c(n - 1, 0)[0], z, 2.6, true, { tint: 0xe8e4dc, key: U('PlasterWallPainted1a'), topTint: 0xe24a1c, top: null }); I.put('cash_register', c(n - 1, 0)[0], z - 0.6, 'l', { y: 1.13 });
            I.put('psx_wooden_crate_1', g.lw + 0.6, g.fw - 0.5, 'f'); I.put('cardboard_boxes', c(1, 0)[0] + 1.75, g.bw + 1.9, 'f');
            I.ceilLamp(c(0, 0)[0], z, H, n, [3.5, 0, 0]);
        },
        /* 11. THE INTELLIGENCE OFFICE (4 x 3 squares, a strip all round, 3.2 m high): two gates across the aisle, a guard's desk, the way round
               by the server wall, a wall of screens at the back, one interview room in the corner */
        'P10-02-B1': (T, g, I) => {
            look(T, U('ConcreteStriped2c'), U('ConcreteUnderTiles1')); const H = 3.18, c = g.c;
            for (const i of [1, 2]) I.put('ebd_metro_turnstile', c(i, 1)[0], c(i, 1)[1], 'f'); I.Q.push(box(0, 0, c(1, 1)[1], 0.4, 1.0, 0.6, ALU, 0xd0d4d8)); I.solid(c(1, 1)[0] - 1.4, c(1, 1)[1], c(2, 1)[0] + 1.4, c(1, 1)[1], 0.6, 1.0);
            I.put('exec_desk', c(0, 2)[0], c(0, 2)[1], 'r'); I.put('exec_chair', c(0, 2)[0] - 1.0, c(0, 2)[1], 'r');
            const rx = c(0, 0)[0] + 1.75, rz = c(0, 0)[1] + 1.75;
            I.partition(rx, g.bw, rx, rz, H, CONC, 0x9aa0a8); I.partition(g.lw, rz, rx - 1.6, rz, H, CONC, 0x9aa0a8);
            I.Q.push(box(rx - 0.8, 2.2, rz, 1.6, H - 2.2, 0.2, CONC, 0x9aa0a8), quad(rx + 0.11, 1.0, c(0, 0)[1], 2.0, 1.1, 270, U('GlassWindowTall4a'), 0x8090a0, { uv: [2.0, 1.1], ds: true }));
            I.put('steel_table', c(0, 0)[0], c(0, 0)[1], 'f'); I.put('folding_chair', c(0, 0)[0] - 1.1, c(0, 0)[1] - 0.9, 'r'); I.put('folding_chair', c(0, 0)[0] + 1.0, c(0, 0)[1] + 0.9, 'l'); I.put('desk_lamp', c(0, 0)[0], c(0, 0)[1], 'f', { y: 1.0 });
            for (let k = 0; k < 5; k++) I.tv(c(1, 0)[0] - 0.4 + k * 1.9, 1.3 + (k % 2) * 0.1, g.bw + 0.04, 1.6, 1.0, 0, [0x58c8ff, 0x50d890, 0x58c8ff, 0xffb040, 0x58c8ff][k]);
            I.Q.push(box(c(2, 0)[0], 0, g.bw + 0.5, 8.4, 0.8, 0.7, GUN, 0x70747c), box(c(2, 0)[0], 0.8, g.bw + 0.5, 8.6, 0.06, 0.8, null, IRON));
            for (let k = 0; k < 6; k++) I.put('server_rack', g.rw - 0.4, c(3, 0)[1] - 1.2 + k * 1.0, 'l');
            I.Q.push(box(g.lw + 0.25, 2.6, g.fw - 0.4, 0.26, 0.22, 0.5, null, 0xe0e4e8), quad(T.lx + 2.6, 1.3, g.fw - 0.02, 0.5, 0.5, 180, U('SignProhibited1a'), WHITE, { uv: 'fit' }));
            I.ceilLamp(c(0, 1)[0], c(0, 1)[1] + 1.75, H, 4, [3.5, 0, 0]); I.ceilLamp(c(1, 0)[0], c(1, 0)[1], H, 3, [3.5, 0, 0]);
        },
        /* 13. THE FINANCE ARCADE (one row of five squares, 3.2 m high): three shallow booths in the back wall (they are the wall: every
               square stays open), a display case, a bench by the wall */
        'P08-03-B1': (T, g, I) => {
            look(T, U('PlasterWallStucco1a'), U('TileMarble3a')); const H = 3.18, c = g.c, zb = g.bw, NM = [[0x2f5a48, 'EXCHANGE'], [0x7a2030, 'LOANS'], [0x1e3a5a, 'PAWN']];
            for (let k = 0; k < 3; k++) { const x = c(1 + k, 0)[0];
                I.Q.push(box(x, 0, zb + 0.3, 3.0, 1.05, 0.6, WOOD, 0x6a3a28), box(x, 1.05, zb + 0.3, 3.1, 0.07, 0.7, STONE, 0xe8e4dc), quad(x, 1.12, zb + 0.5, 2.9, 1.2, 0, GRILL, 0xd8b860, { uv: [0.6, 0.6], kind: 'over' }),
                    box(x, 2.32, zb + 0.35, 3.1, 0.5, 0.7, null, NM[k][0]), quad(x, 2.38, zb + 0.71, 2.6, 0.38, 0, 'txt:' + NM[k][1] + '|#f4ecd8||7', WHITE, { uv: 'fit', kind: 'over' }), box(x - 1.55, 0, zb + 0.35, 0.12, 2.82, 0.7, 'gold', WHITE, Object.assign({ n: 2, step: [3.1, 0, 0] }, BRASS)));
                I.put('cash_register', x + 0.8, zb + 0.3, 'f', { y: 1.13 }); }
            for (const k of [-0.5, 0.5]) I.put('psx_display_cabinet_mp_1', c(4, 0)[0] + k, zb + 0.35, 'f');
            I.put('city_bench', c(0, 0)[0], zb + 0.4, 'f'); I.put('wall_clock', c(0, 0)[0], zb + 0.05, 'f', { y: 2.3 });
            I.ceilLamp(c(0, 0)[0], c(0, 0)[1] + 1.2, H, 5, [3.5, 0, 0]);
        },
        /* 15. THE PENTHOUSE STAIR LOBBY (4 x 3, 3.2 m high): the concierge's desk, mail boxes and the lift on the back wall, a sofa */
        'P10-03-B1': (T, g, I) => {
            look(T, U('PlasterWallStucco1a'), U('TileMarble3a')); const H = 3.18, c = g.c;
            I.counter(c(1, 0)[0], c(1, 0)[1], 2.6, false, { tint: 0x6a3a28, topTint: 0xf0e8d8 }); I.put('desk_lamp', c(1, 0)[0] - 0.8, c(1, 0)[1], 'f', { y: 1.13 }); I.put('office_chair', c(1, 0)[0], c(1, 0)[1] - 1.0, 'f');
            I.Q.push(box(c(0, 0)[0], 0.9, g.bw + 0.1, 2.8, 1.3, 0.2, ALU, 0xb8bcc0), box(c(0, 0)[0] - 1.2, 0.98, g.bw + 0.21, 0.5, 0.26, 0.02, null, IRON, { n: 5, step: [0.6, 0, 0] }), box(c(0, 0)[0] - 1.2, 1.4, g.bw + 0.21, 0.5, 0.26, 0.02, null, IRON, { n: 5, step: [0.6, 0, 0] }), box(c(0, 0)[0] - 1.2, 1.82, g.bw + 0.21, 0.5, 0.26, 0.02, null, IRON, { n: 5, step: [0.6, 0, 0] }));
            I.lift(c(2, 0)[0], g.bw + 0.03, 0);
            /* THE HALFDEMON'S BEDROOM (the residents' brief, 11-14): the end column behind a wall, its front square left open as the way in; a royal bed on the back square */
            { const x0 = c(3, 0)[0] - 1.75, RW = U('PlasterWallStucco1a'); I.partition(x0, g.bw, x0, c(3, 1)[1] + 1.75, H, RW, 0xd8c8b8);
              I.put('royal_bed', c(3, 0)[0], c(3, 0)[1], 'f'); I.put('psx_bedside_table_1', c(3, 0)[0] - 1.3, c(3, 0)[1] + 1.3, 'f'); I.put('table_lamp', c(3, 0)[0] - 1.3, c(3, 0)[1] + 1.3, 'f', { y: 0.66 }); I.put('rug_round', c(3, 1)[0] - 0.5, c(3, 1)[1] + 0.7, 'f'); }
            I.put('psx_sofa_3', c(0, 1)[0], c(0, 1)[1], 'r'); I.put('rug_round', c(1, 1)[0] - 0.8, c(1, 1)[1] + 1.0, 'f'); I.put('coffee_table', c(1, 1)[0] - 0.8, c(1, 1)[1] + 1.0, 'f');
            I.put('potted_plant', g.lw + 0.5, g.fw - 0.5, 'f'); I.put('potted_plant', g.rw - 0.5, g.fw - 0.5, 'f'); I.put('globe_lamp', g.rw - 0.5, c(3, 1)[1] + 0.9, 'f');
            I.chandelier(0, c(0, 1)[1], H, 0.3, 0.7);
        },
        /* 16. THE PALM HOUSE (6 x 2 squares under the glass vault): the back row is planted (a bed on each two squares either side of a
               pool on the middle two, each filling its squares), the front row is the walk, pots and ferns off the squares' middles */
        'P11-03-B1': (T, g, I) => {
            look(T, U('GlassWindowFactory1a'), U('TileGeneric1a')); const c = g.c, zb = c(0, 0)[1], zf = c(0, 1)[1];
            for (const s of [-1, 1]) { const x = s * 7; I.bed(x, zb, 6.7, 3.2, true); I.put('palm_tree', x - 1.9, zb - 0.3, 'f', { h: 3.2, y: 0.5 }); I.put('palm_tree', x + 1.7, zb + 0.4, 'f', { h: 2.5, y: 0.5 }); for (const k of [-0.4, 2.7, -2.8]) I.put('fern', x + k, zb + 0.9 - Math.abs(k) * 0.2, 'f', { y: 0.5 }); }
            I.Q.push(box(0, 0, zb, 6.7, 0.5, 3.2, STONE, CR), box(0, 0.5, zb, 6.1, 0.04, 2.6, null, 0x3aa0c8, { glow: 0.2 }), cyl(0, 0.5, zb, 0.5, 0.5, STONE, CR, { seg: 8 }), cyl(0, 1.0, zb, 0.9, 0.12, STONE, CR, { seg: 12 }), cyl(0, 1.12, zb, 0.12, 0.5, STONE, CR, { seg: 6 })); I.solid(-3.35, zb, 3.35, zb, 3.2, 0.9);
            I.put('potted_plant', g.lw + 0.5, g.fw - 0.5, 'f'); I.put('potted_plant', g.rw - 0.5, g.fw - 0.5, 'f'); I.put('fern', c(1, 1)[0] + 1.3, g.fw - 0.4, 'f'); I.put('fern', c(4, 1)[0] - 1.3, g.fw - 0.4, 'f');
            I.Q.push(box(-7, 3.0, zf, 0.5, 0.1, 0.3, null, 0xd0a0ff, { glow: 0.8, n: 5, step: [3.5, 0, 0] }));
        },
    };
    return T => { const f = INS[T.id]; if (!f || !T.row || !T.row.hollow) return; const I = ctx(T), g = grid(T), n0 = props.length; f(T, g, I); atmos(T, g, I, n0); I.done(); if (process.env.DC_F_DEBUG) console.log('[inside]', T.id, 'rot', T.rot, g.nx + ' x ' + g.nz, 'X', g.X.join(','), 'Z', g.Z.join(','), 'bad', props.slice(n0).filter(p => !isFinite(p.x) || !isFinite(p.z)).map(p => p.key).join(',')); };
};
