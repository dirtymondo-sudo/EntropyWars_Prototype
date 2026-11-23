/* THE INTERIOR KITS (2026-11-23, mondo: "I want every building to have an interior. If there is a door the player should be able to walk inside
   of it (very important for a game called DOOR HQ)"; plan https://claude.ai/artifact/RVPh8wvd9u6uAPj6QubPnd, step 1). The shared furnishing a
   district thread lays in a walk-in building when it opens a door find-doors.js lists. One call furnishes one hollow `texbuilding` row:

       const KITS = require('<repo>/docs/interiors/kits.js');
       const out = KITS.furnish(row, 'shop', { seed: 'P05-02-B2', tint: 0x6a4a34 });   // → { arch, props, ghosts, kind, used, free }
       features.push(out.arch, ...out.ghosts); props.push(...out.props);

   or, in Disaster City, a row that carries `kit: '<kind>'` (and optionally `kitSeed`, `kitTint`) is furnished by bake-disaster-city.js THE KITS
   after the district files, so a district thread only writes the word. Kinds: shop, flat, office, workshop, kiosk, clinic, back (back of house:
   a store room, a stock room, a plant room). KITS.kitFor(name) guesses one from a building's name ("Laundromat" → shop, "Apartments" → flat).

   THE RULES the kits keep (mondo's, docs/notes/owner-rules.md): the room is squares of 3.5 m; the DOOR'S COLUMN, front to back, and the FRONT
   ROW across the room are a walkway one whole square wide and never furnished; a blocker takes a whole square, decor stands off a square's middle
   against a wall; every free square stays reached from the door (each piece is placed only if a walk from the door still reaches every square
   left free: no closed-off corner); few props in a small room (a 1 or 2 square room is a kiosk, whatever the kind); every prop is an R2 catalogue
   prop (PACK-FIRST), the arch parts are only the counters, lamps, the floor coat and the room's paint. The seed (the row id) picks the variant
   props, the tints and which side the counter stands on, so two shops in one street never read the same.
   Frame: the row's own (x across, z front to back, the door at +z, the row's `rot` turns it), metres. Notes: docs/notes/areas-complexes.md
   "THE INTERIOR KITS". */
'use strict';
const SQ = 3.5, U = n => 'urban:' + n;
const WOOD = 'wood_planks', MARBLE = 'marble_light', ALU = 'aluminium', CONC = U('ConcreteStriped2a');

/* a small seeded random (mulberry32 over the seed's characters) */
function rng(seed) { let h = 1779033703 ^ String(seed).length; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
    let a = h >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* data.js hqTexbDoor's doorway middle in the row's frame (columns of ~1.75 m across the front, `door` = 1-based column; `doorLx` = metres) */
function doorLx(row) { if (isFinite(+row.doorLx)) return +row.doorLx; const L = Math.max(2, +row.w || 8) - 0.12, n = Math.max(1, Math.round(L / 1.75)), cw = L / n;
    let c = Math.floor((n - 1) / 2); if (row.door >= 1) c = Math.min(n - 1, Math.round(row.door) - 1); return -L / 2 + (c + 0.5) * cw; }

/* the room: its squares, the door's square, the walkway, the reach guard, and the placing helpers */
function room(row, seed) {
    const W = Math.max(2, +row.w || 8), D = Math.max(2, +row.d || 8), rot = +row.rot || 0, q = rot * Math.PI / 180, cs = Math.cos(q), sn = Math.sin(q);
    const nx = Math.max(1, Math.floor((W + 0.3) / SQ)), nz = Math.max(1, Math.floor((D + 0.3) / SQ)), sx = Math.min(SQ, (W - 0.5) / nx), sz = Math.min(SQ, (D - 0.5) / nz), ox = -nx * sx / 2, oz = -nz * sz / 2;   // a square = 3.5 m, a little less in a room a hair under whole squares (10.5 m outside = 10 m in)
    const dlx = doorLx(row), di = Math.min(nx - 1, Math.max(0, Math.floor((dlx - ox) / sx)));
    const R = rng(seed || row.id || 'kit'), P = [], props = [], ghosts = [], used = new Set(), walk = new Set();
    for (let j = 0; j < nz; j++) walk.add(di + ',' + j); for (let i = 0; i < nx; i++) walk.add(i + ',' + (nz - 1));
    const world = (lx, lz) => [row.x + lx * cs - lz * sn, row.z + lx * sn + lz * cs];
    const at = (i, j) => [ox + (i + 0.5) * sx, oz + (j + 0.5) * sz];
    const free = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && !used.has(i + ',' + j) && !walk.has(i + ',' + j);
    /* the reach guard: would taking (i, j) leave a free square no walk from the door reaches? */
    const keepsReach = (i, j) => { const S = new Set([di + ',' + (nz - 1)]), L = [[di, nz - 1]], block = k => used.has(k) || k === i + ',' + j;
        while (L.length) { const [a, b] = L.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([u, v]) => { const x = a + u, z = b + v, k = x + ',' + z; if (x < 0 || z < 0 || x >= nx || z >= nz || S.has(k) || block(k)) return; S.add(k); L.push([x, z]); }); }
        for (let x = 0; x < nx; x++) for (let z = 0; z < nz; z++) { const k = x + ',' + z; if (!block(k) && !S.has(k)) return false; } return true; };
    const take = (i, j) => { if (!free(i, j) || !keepsReach(i, j)) return false; used.add(i + ',' + j); return true; };
    const pick = list => list[Math.floor(R() * list.length) % list.length];
    /* the squares by a wall, back wall first, then the side walls back to front (the kit's order of preference) */
    const wallSquares = () => { const o = []; for (let i = 0; i < nx; i++) o.push([i, 0, 0]); for (let j = 1; j < nz; j++) { o.push([0, j, 270]); if (nx > 1) o.push([nx - 1, j, 90]); }
        return o.filter((s, k) => o.findIndex(t => t[0] === s[0] && t[1] === s[1]) === k); };
    const midSquares = () => { const o = []; for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) o.push([i, j, 0]); return o; };
    const K = {
        W, D, nx, nz, sx, sz, di, R, pick, at, free, take, used, walk, P, props, ghosts, wallSquares, midSquares,
        H: (row.storeys || 1) * 3.5 - 0.32,
        /* a prop; face = the room frame's (0 = it looks at the door, +z; 90 = the right wall's own, looking -x; 270 = the left wall's) */
        prop(key, lx, lz, face, o) { const p = world(lx, lz); props.push(Object.assign({ key, x: r3(p[0]), z: r3(p[1]), face: ((((face || 0) + rot + 180) % 360) + 360) % 360, floor: true }, o || {})); },
        ghost(lx, lz, w, d, h) { const A = w >= d ? world(lx - (w - d) / 2, lz) : world(lx, lz - (d - w) / 2), B = w >= d ? world(lx + (w - d) / 2, lz) : world(lx, lz + (d - w) / 2);
            ghosts.push({ k: 'wall', x0: r3(A[0]), z0: r3(A[1]), x1: r3(B[0]), z1: r3(B[1]), h, t: r3(Math.min(w, d)), key: CONC, ghost: true, rail: false }); },
        box(x, y, z, w, h, d, key, tint, o) { const p = Object.assign({ s: 'box', p: [r3(x), r3(y), r3(z)], size: [r3(w), r3(h), r3(d)] }, key ? { key } : {}, tint != null ? { tint } : {}, o || {}); P.push(p); return p; },
        /* a piece on a whole square: blocks it (props with a catalogue foot block by themselves) */
        on(i, j, face, fn) { if (!take(i, j)) return false; const [x, z] = at(i, j); fn(x, z, face); return true; },
        /* the next free wall square (back first) */
        nextWall(skip) { for (const s of wallSquares()) if (free(s[0], s[1]) && !(skip && skip(s)) && keepsReach(s[0], s[1])) return s; return null; },
        nextMid() { for (const s of midSquares()) if (free(s[0], s[1]) && keepsReach(s[0], s[1])) return s; return null; },
        /* a piece pressed to its wall inside its square (`back` m from the square's middle toward the wall) */
        wallPos(s, back) { const [x, z] = at(s[0], s[1]), b = back || 1.0, f = s[2]; return f === 0 ? [x, z - b] : f === 270 ? [x - b, z] : f === 90 ? [x + b, z] : [x, z + b]; },
        /* decor by a wall on a walkway square, off its middle (never blocks: noBlock) */
        decor(key, s, face, o) { const [x, z] = at(s[0], s[1]); const f = s[2] != null ? s[2] : 0, e = 1.35; const p = f === 0 ? [x + 1.2, z - e] : f === 270 ? [x - e, z - 1.2] : f === 90 ? [x + e, z - 1.2] : [x + 1.2, z + e];
            K.prop(key, p[0], p[1], face != null ? face : f, Object.assign({ noBlock: true }, o || {})); },
        /* a counter across n squares on the back wall (bar toward the door, a back unit behind it, staff between): the squares in front stay free */
        counter(i0, n, tint, top) { for (let k = 0; k < n; k++) if (!take(i0 + k, 0)) { for (let m = 0; m < k; m++) used.delete((i0 + m) + ',0'); return null; }
            const x = at(i0, 0)[0] + (n - 1) * sx / 2, z = at(0, 0)[1], L = n * sx - 0.5;
            K.box(x, 0, z + 0.55, L, 1.05, 0.8, WOOD, tint); K.box(x, 1.05, z + 0.55, L + 0.1, 0.08, 1.0, MARBLE, top || 0xf0ece2);
            K.box(x, 0, z - 1.25, L, 0.9, 0.6, WOOD, tint); K.box(x, 0.9, z - 1.25, L, 0.05, 0.64, MARBLE, top || 0xf0ece2);
            K.ghost(x, z + 0.55, L, 0.9, 1.2); K.ghost(x, z - 1.25, L, 0.7, 1.0); return [x, z]; },
        /* the ceiling lights: one fluorescent panel a square or two, in a grid */
        lamps(tint) { const y = K.H - 0.16, step = (nx * nz > 6) ? 2 : 1;
            for (let i = 0; i < nx; i += step) for (let j = 0; j < nz; j += step) { const [x, z] = at(Math.min(nx - 1, i + (step - 1) / 2), Math.min(nz - 1, j + (step - 1) / 2));
                K.box(x, y + 0.04, z, 1.32, 0.08, 0.62, null, 0xe8e8e4, { roof: true }); K.box(x, y, z, 1.2, 0.05, 0.5, null, tint || 0xfff6e0, { glow: 1, under: true, roof: true }); } },
        /* a floor coat over the bare inside sheet (the kit's look) and a skirting */
        floor(key, tint) { K._floor = true; K.box(0, 0, 0, W - 0.5, 0.1, D - 0.5, key, tint, { uv: 3.5 }); },   // 10 cm: over a route room's uneven ground too (seen 11-23: the grass sheet came through a 3.5 cm coat)
        rug(x, z, w, d, tint, key) { P.push(Object.assign({ s: 'quad', flat: true, p: [r3(x), 0.13, r3(z)], size: [r3(w), r3(d)], tint: tint == null ? 0xffffff : tint, gain: 1.6 }, key ? { key } : {})); },
    };
    return K;
}
const r3 = v => Math.round(v * 1000) / 1000;
const TINTS = [0x6a4a34, 0x3c5a7a, 0x7a3c3c, 0x4a6a4a, 0x5a5a62, 0x8a6a3a];

/* ── THE KITS: kind → fn(K, o). Each lays its key pieces first, then fills by a budget (fewer in a small room) ── */
const KITS = {
    /* a corner shop: the till counter on the back wall, shelving down the side walls, a rack by the door, a fridge */
    shop(K, o) { const n = Math.min(2, Math.max(1, K.nx - 1)), side = K.R() < 0.5 ? 0 : K.nx - n;
        let c = null, cn = n; for (const m of [n, 1]) { for (const i0 of [side, side === 0 ? K.nx - m : 0, K.di - m, K.di + 1]) { if (i0 < 0 || i0 + m > K.nx || (i0 <= K.di && K.di < i0 + m)) continue; c = K.counter(i0, m, o.tint); if (c) { cn = m; break; } } if (c) break; }
        if (c) { const n = cn; K.prop('cash_register', c[0] - (n * K.sx) / 4, c[1] + 0.55, 0, { y: 1.13, noBlock: true }); K.prop(K.pick(['psx_tv_mp_1', 'tube_tv']), c[0] + 0.6, c[1] - 1.25, 0, { y: 0.95, noBlock: true }); }
        const shelf = K.pick(['metal_shelving', 'psx_shelf_mp_5', 'psx_shelf_mp_6', 'psx_shelf_mp_7', 'ebd_gasstation_metal_shelving']);
        let s; const budget = Math.max(1, Math.round(K.nx * K.nz * 0.35));
        for (let k = 0; k < budget && (s = K.nextWall(t => t[1] === 0 && c)); k++) K.on(s[0], s[1], s[2], () => { const p = K.wallPos(s, 0.9); K.prop(k === 1 ? K.pick(['round_fridge', 'psx_vending_machine_1']) : shelf, p[0], p[1], s[2]); });
        K.decor(K.pick(['newspaper_rack', 'brochure_rack']), [K.di, K.nz - 1, 90]); K.decor('trash_bin', [K.di, K.nz - 1, 270]);
        K.lamps(); },
    /* a flat: a sofa facing a TV, a bed with its table and wardrobe on the back wall, a kitchen table, a fridge, a rug */
    flat(K, o) { const A = [
            s => { const p = K.wallPos(s, 0.8); K.prop(K.pick(['psx_bed_1', 'psx_bed_2', 'dorm_bed', 'couples_bed']), p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 0.9); K.prop(K.pick(['psx_sofa_1', 'psx_sofa_3', 'psx_sofa_4', 'chesterfield_sofa']), p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 1.1); K.prop(K.pick(['psx_wardrobe_mp_1', 'psx_wardrobe_mp_1_2']), p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 1.0); K.prop(K.pick(['round_fridge', 'mini_fridge']), p[0], p[1], s[2]); K.prop('sink', p[0] + (s[2] === 0 ? 1.0 : 0), p[1] + (s[2] === 0 ? 0 : 1.0), s[2], { noBlock: true }); },
            s => { const p = K.wallPos(s, 1.0); K.prop(K.pick(['psx_tv_table_1', 'psx_tv_table_4']), p[0], p[1], s[2]); },
        ];
        let s, k = 0; const budget = Math.max(2, Math.round(K.nx * K.nz * 0.4));
        while (k < Math.min(budget, A.length) && (s = K.nextWall())) { const fn = A[k]; K.on(s[0], s[1], s[2], () => fn(s)); k++; }
        if ((s = K.nextMid())) K.on(s[0], s[1], 0, (x, z) => { K.prop(K.pick(['psx_table_large_2', 'round_table', 'coffee_table']), x, z, 0); const ch = K.pick(['psx_chair_mp_1', 'psx_chair_mp_2', 'psx_chair_mp_3']); K.prop(ch, x, z - 1.1, 0, { noBlock: true }); K.prop(ch, x, z + 1.1, 180, { noBlock: true }); });
        const [rx, rz] = K.at(K.di, Math.max(0, K.nz - 2)); K.rug(rx, rz, 2.6, 1.8, K.pick([0x8a3a3a, 0x3a5a8a, 0x6a5a3a]));
        K.decor(K.pick(['potted_plant', 'office_plant']), [K.di, K.nz - 1, 270]); K.decor(K.pick(['psx_lamp_1_on', 'table_lamp']), [K.di, K.nz - 1, 90]);
        K.lamps(0xffe8c0); },
    /* an office: desks two by two, filing cabinets on the back wall, a water cooler, plants */
    office(K, o) { let s, n = 0; const budget = Math.max(1, Math.round(K.nx * K.nz * 0.4));
        while (n < budget && (s = K.nextMid() || K.nextWall())) { const desk = n % 3 !== 2 || s[2] !== 0;
            K.on(s[0], s[1], s[2], (x, z) => { if (desk && !K.wallSquares().some(t => t[0] === s[0] && t[1] === s[1] && t[2] !== 0)) {
                    K.prop('tanker_desk', x, z - 0.42, 180); K.prop('tanker_desk', x, z + 0.42, 0); K.prop(K.pick(['computer_chair_grey', 'office_chair']), x, z - 1.25, 0, { noBlock: true }); K.prop(K.pick(['computer_chair_blue', 'office_chair']), x, z + 1.25, 180, { noBlock: true });
                    K.prop('psx_pc_monitor_mp_1', x - 0.2, z - 0.3, 180, { y: 0.78, noBlock: true }); K.prop('psx_pc_monitor_mp_1', x + 0.2, z + 0.3, 0, { y: 0.78, noBlock: true }); }
                else { const p = K.wallPos(s, 1.1); for (const u of [-0.85, 0, 0.85]) K.prop(K.pick(['filing_cabinet', 'meshy_filing_cabinet']), p[0] + (s[2] === 0 ? u : 0), p[1] + (s[2] === 0 ? 0 : u), s[2]); } }); n++; }
        K.decor('water_cooler', [K.di, K.nz - 1, 90]); K.decor(K.pick(['office_plant', 'potted_plant']), [K.di, K.nz - 1, 270]);
        K.lamps(); },
    /* a workshop: a steel bench under a pegboard, a tool chest, a lathe, shelving, crates and barrels */
    workshop(K, o) { const A = [
            s => { const p = K.wallPos(s, 0.9); K.prop('steel_bench', p[0], p[1], s[2]); const w = K.wallPos(s, 1.55); K.prop('tool_pegboard', w[0], w[1], s[2], { y: 1.2, mount: 0, noBlock: true }); },
            s => { const p = K.wallPos(s, 0.9); K.prop('tool_chest', p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 0.9); K.prop('metal_shelving', p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 0.6); K.prop('metal_lathe', p[0], p[1], s[2]); },
            s => { const p = K.wallPos(s, 0.7); K.prop(K.pick(['psx_wooden_crate_1', 'psx_wooden_crate_2', 'psx_supply_crate_1']), p[0] - 0.4, p[1], s[2]); K.prop(K.pick(['psx_metal_barrel_mp_0', 'psx_metal_barrel_mp_1', 'wooden_barrel']), p[0] + 0.6, p[1] + 0.3, s[2]); },
        ];
        let s, k = 0; const budget = Math.max(2, Math.round(K.nx * K.nz * 0.4));
        while (k < Math.min(budget, A.length) && (s = K.nextWall())) { const fn = A[k]; K.on(s[0], s[1], s[2], () => fn(s)); k++; }
        if ((s = K.nextMid())) K.on(s[0], s[1], 0, (x, z) => K.prop('pallet_jack', x, z, 90));
        K.floor(U('ConcreteStriped1c'), 0xb8b4ac); K.decor('trash_bin', [K.di, K.nz - 1, 270]);
        K.lamps(0xf0f4ff); },
    /* a kiosk (one or two squares): a counter on the back wall, a rack, a vending machine by the door; nothing else */
    kiosk(K, o) { const n = K.nx > 1 ? 1 : 0; let c = null;
        if (K.nz > 1) { for (let i = 0; i < K.nx && !c; i++) if (i !== K.di) c = K.counter(i, 1, o.tint); }
        if (!c && K.nz > 1) { const [x, z] = K.at(K.di, 0); K.box(x, 0, z - 1.25, K.sx - 0.5, 1.05, 0.7, WOOD, o.tint); K.box(x, 1.05, z - 1.25, K.sx - 0.4, 0.08, 0.9, MARBLE, 0xf0ece2); K.ghost(x, z - 1.25, K.sx - 0.5, 0.8, 1.2); c = [x, z - 1.8]; }
        if (c) K.prop('cash_register', c[0], c[1] + 0.55, 0, { y: 1.13, noBlock: true });
        K.decor(K.pick(['newspaper_rack', 'brochure_rack']), [K.di, K.nz - 1, 270]);
        if (K.nx * K.nz > 1) K.decor('psx_vending_machine_1', [K.di, K.nz - 1, 90]);
        K.lamps(); void n; },
    /* a clinic: a reception counter, beds with drip stands down a wall, waiting chairs, a sink and a cabinet */
    clinic(K, o) { const n = K.nx >= 3 ? 1 : 0; let c = null; for (let i = 0; i < K.nx && !c && n; i++) if (i !== K.di) c = K.counter(i, 1, 0xe8e8ec, 0xffffff);
        if (c) K.prop('psx_pc_monitor_mp_1', c[0], c[1] + 0.55, 0, { y: 1.13, noBlock: true });
        let s, k = 0; const budget = Math.max(1, Math.round(K.nx * K.nz * 0.35));
        while (k < budget && (s = K.nextWall(t => t[1] === 0 && c))) { const kk = k; K.on(s[0], s[1], s[2], () => { const p = K.wallPos(s, 0.55);
                if (kk % 3 === 2) { K.prop(K.pick(['psx_display_cabinet_mp_1', 'round_cabinet']), p[0], p[1], s[2]); K.prop('sink', p[0] + (s[2] === 0 ? 1.1 : 0), p[1] + (s[2] === 0 ? 0 : 1.1), s[2], { noBlock: true }); }
                else { K.prop('hospital_bed', p[0], p[1], s[2]); K.prop('iv_stand', p[0] + (s[2] === 0 ? 1.2 : 0.9), p[1] + (s[2] === 0 ? 0.6 : 1.2), s[2], { noBlock: true }); } }); k++; }
        const [fx, fz] = K.at(K.di, K.nz - 1); for (const u of [-1, 1]) K.prop(K.pick(['molded_chair', 'cafeteria_chair']), fx + u * 1.3, fz - 1.3, 0, { noBlock: true });
        K.floor(U('TileSubway1a'), 0xf4f6f8); K.lamps(0xf4fbff); },
    /* back of house: shelving, crates, barrels, a pallet jack: the store room behind a shop, the plant room in a tower */
    back(K, o) { let s, k = 0; const budget = Math.max(1, Math.round(K.nx * K.nz * 0.45));
        while (k < budget && (s = K.nextWall())) { const kk = k; K.on(s[0], s[1], s[2], () => { const p = K.wallPos(s, 0.9);
                if (kk % 2 === 0) K.prop(K.pick(['metal_shelving', 'ebd_gasstation_metal_shelving']), p[0], p[1], s[2]);
                else { K.prop(K.pick(['psx_supply_crate_1', 'psx_wooden_crate_3', 'psx_wooden_crate_4', 'wrapped_pallet']), p[0], p[1], s[2]); K.prop(K.pick(['psx_metal_barrel_mp_2', 'psx_metal_barrel_mp_3']), p[0] + 0.9, p[1] + 0.5, s[2], { noBlock: true }); } }); k++; }
        K.floor(U('ConcreteStriped1c'), 0xa8a49c); K.lamps(0xe8f0ff); },
};

/* a building's name → a kit (the plan's names: "Laundromat", "Apartments", "Police station" ...) */
function kitFor(name) { const s = String(name || '').toLowerCase();
    if (/clinic|hospital|doctor|dent|vet|pharm|medic|surgery/.test(s)) return 'clinic';
    if (/kiosk|booth|ticket|stand|hut|news ?stand|guard/.test(s)) return 'kiosk';
    if (/garage|workshop|repair|mechanic|auto|factory|plant|works|depot|forge|smith|warehouse|mill/.test(s)) return /warehouse|depot|storage/.test(s) ? 'back' : 'workshop';
    if (/office|bank|insurance|agency|studio|records|bureau|hall|station|mutual|tower|firm|lab/.test(s)) return 'office';
    if (/flat|apart|house|home|condo|loft|motel|inn|room|cabin|trailer|cottage|villa/.test(s)) return 'flat';
    if (/store ?room|stock|storage|back|plant room|boiler|shed/.test(s)) return 'back';
    return 'shop'; }

/* furnish one hollow texbuilding row: { arch, props, ghosts, kind, used, free } (arch = null when the kit drew no parts) */
function furnish(row, kind, opts) {
    opts = opts || {}; const seed = opts.seed || row.kitSeed || row.id || 'kit', K = room(row, seed);
    let k = kind || row.kit || 'shop'; if (K.nx * K.nz <= 2) k = 'kiosk'; if (!KITS[k]) throw new Error('kits: no kit ' + k);
    const o = Object.assign({ tint: row.kitTint != null ? row.kitTint : TINTS[Math.floor(K.R() * TINTS.length)] }, opts);
    KITS[k](K, o);
    if (!K._floor) K.floor(...({ shop: [U('TileGeneric5a'), 0xffffff], flat: [WOOD, 0xb08a64], office: [U('TileGeneric1a'), 0xd8d4cc], kiosk: [U('TileGeneric5a'), 0xffffff] }[k] || [U('ConcreteStriped1c'), 0xb8b4ac]));   // every kit lays its own floor
    const arch = K.P.length ? { k: 'arch', id: 'arch:' + String(row.id || 'kit').replace(/^dc:/, '') + ':kit', x: row.x, z: row.z, rot: row.rot || 0, parts: K.P.map(p => (p.glow == null && p.key ? Object.assign(p, { glow: 0.3 }) : p)) } : null;
    let freeN = 0; for (let i = 0; i < K.nx; i++) for (let j = 0; j < K.nz; j++) if (!K.used.has(i + ',' + j)) freeN++;
    return { arch, props: K.props, ghosts: K.ghosts, kind: k, used: K.used.size, free: freeN, squares: [K.nx, K.nz] };
}

module.exports = { furnish, kitFor, KINDS: Object.keys(KITS), doorLx };
