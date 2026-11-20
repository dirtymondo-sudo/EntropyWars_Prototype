/* KATANA ISLAND, THE INSIDES (world polish thread 21, 2026-11-20; mondo: "go ahead and do those interiors"). bake-katana.js furnishes every walk-in
   building through this file: ROOM_OF says which kind of room a building id is, ROOMS draws it.
   A room is drawn in the BUILDING'S OWN FRAME: x along the front (-w/2 .. w/2), z from the back wall (-d/2) to the door's wall (+d/2), y up from
   the ground; the door is at x = door.lx on the +z wall. Every room gets the same shell first (`shell`): a lit lining 0.335 m inside the walls
   (the hollow building's own walls draw dark), dark posts and a head rail on it, a lit board ceiling with rafters under the building's own, and
   straw mats on the floor. Then its own things: drawn where the game has no model (low tables, cushions, bedding, an alcove with a hung scroll, a
   sunk hearth, counters, shelves, wooden tubs, a dais, paper screens), catalogue models where it has one (`put`).
   STAND-INS mondo named 11-20: `sword` for a katana, `decor_armour_stand_post` for samurai armour.
   One storey a building for now (the Inn, the Net Loft, the Theatre, the Keep and the Pagoda are tall rooms). */
'use strict';
const ROOM_OF = {
    office: 'office', market: 'market', shipwright: 'shipwright', netloft: 'netloft', ricestore: 'store', inn: 'inn', hut: 'hut', lantern: 'tower',
    bathhouse: 'bath', teashop: 'shop', brewery: 'brewery', lanternmaker: 'workshop', noodles: 'kitchen', pagoda: 'pagoda', templehall: 'temple', monks: 'home',
    theatre: 'theatre', teahouse: 'tea', townhouse1: 'home', townhouse2: 'home', dojo: 'dojo', samurai1: 'samurai', samurai2: 'samurai', armoury: 'armoury', keep: 'keep',
    guardhouse: 'guard', pavilion: 'tea', fisher1: 'hut', fisher2: 'hut', fisher3: 'hut', farm1: 'farm', farm2: 'farm', farm3: 'farm', store: 'store', headman: 'home',
    hiddenshrine: 'shrine', hermit: 'hut', viewing: 'tea', springbath: 'bath',
};
const THATCHED = { hut: 1, fisher1: 1, fisher2: 1, fisher3: 1, farm1: 1, farm2: 1, farm3: 1, hermit: 1 };
function furnish(K) {
    /* K: a (the sheet to draw on), put(key, lx, lz, opts), w, d, h, door, id, rnd, sheets { WD, WD2, SHG, FLR, PLS } */
    const { a, put, w, d, h, door, id, rnd } = K, { WD2, SHG, FLR, PLS } = K.sheets, r2 = v => Math.round(v * 100) / 100;
    const DARK = 0x3a2a1e, FY = 0.14, e = 0.335, W2 = w / 2 - e, D2 = d / 2 - e, Hc = r2(Math.min(h - 0.6, 3.6)), thatched = !!THATCHED[id];
    const Q = (x, y, z, qw, qh, ry, key, tn, o) => a.P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [r2(qw), r2(qh)], ry, key, tint: tn }, o || {}));
    const box = (x, y, z, bw, bh, bd, key, tn, o) => a.box(x, y, z, bw, bh, bd, key, tn, o);
    /* ── the shell ── */
    const lit = { gain: 2.0, glow: 0.22, uv: [1.75, 1.75], kind: 'wall' }, WALL = thatched ? 0xd8c498 : 0xf2ecde, wkey = thatched ? WD2 : PLS;
    Q(0, 0, -D2, 2 * W2, Hc, 0, wkey, WALL, lit); Q(0, 0, D2, 2 * W2, Hc, 180, wkey, WALL, Object.assign({}, lit, { hole: [r2(-door.lx), r2(door.cw + 0.12), 2.25] }));
    Q(-W2, 0, 0, 2 * D2, Hc, 270, wkey, WALL, lit); Q(W2, 0, 0, 2 * D2, Hc, 90, wkey, WALL, lit);
    box(0, Hc - 0.05, 0, 2 * W2, 0.04, 2 * D2, thatched ? SHG : FLR, thatched ? 0xf0d890 : 0xe6c89a, { glow: 0.75, gain: 2.1, under: true, roof: true, top: false, ds: true, uv: [1.2, 1.2] });   // the lit ceiling
    for (let x = -W2 + 0.9; x < W2 - 0.4; x += 1.75) box(x, Hc - 0.22, 0, 0.14, 0.17, 2 * D2, WD2, DARK, { roof: true });                                                                   // rafters
    for (const sz of [-1, 1]) { box(0, Hc - 0.5, sz * (D2 - 0.04), 2 * W2, 0.16, 0.07, WD2, DARK); a.P.push({ s: 'box', p: [r2(-W2 + 0.06), 0, r2(sz * (D2 - 0.04))], size: [0.14, Hc, 0.07], key: WD2, tint: DARK, n: Math.max(2, Math.round(2 * W2 / 1.75) + 1), step: [r2((2 * W2 - 0.12) / Math.max(1, Math.round(2 * W2 / 1.75))), 0, 0] }); }
    for (const sx of [-1, 1]) { box(sx * (W2 - 0.04), Hc - 0.5, 0, 0.07, 0.16, 2 * D2, WD2, DARK); a.P.push({ s: 'box', p: [r2(sx * (W2 - 0.04)), 0, r2(-D2 + 0.06)], size: [0.07, Hc, 0.14], key: WD2, tint: DARK, n: Math.max(2, Math.round(2 * D2 / 1.75) + 1), step: [0, 0, r2((2 * D2 - 0.12) / Math.max(1, Math.round(2 * D2 / 1.75)))] }); }
    /* ── the pieces ── */
    const mats = (x0, z0, x1, z1, tn) => { const mw = x1 - x0, md = z1 - z0; box((x0 + x1) / 2, FY, (z0 + z1) / 2, mw, 0.03, md, SHG, tn != null ? tn : 0xc9c488, { gain: 1.9, uv: [0.9, 0.9] });
        const nx = Math.max(1, Math.round(mw / 1.75)); a.P.push({ s: 'box', p: [r2(x0), FY, r2((z0 + z1) / 2)], size: [0.06, 0.035, r2(md)], tint: 0x2e3a2a, n: nx + 1, step: [r2(mw / nx), 0, 0] });
        const nz = Math.max(1, Math.round(md / 3.5)); a.P.push({ s: 'box', p: [r2((x0 + x1) / 2), FY, r2(z0)], size: [r2(mw), 0.035, 0.06], tint: 0x2e3a2a, n: nz + 1, step: [0, 0, r2(md / nz)] }); };
    const table = (x, z, tw, td, th) => { th = th || 0.34; box(x, FY + th, z, tw, 0.06, td, WD2, 0x5a3a26, { uv: [0.9, 0.9] }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(x + sx * (tw / 2 - 0.08), FY, z + sz * (td / 2 - 0.08), 0.08, th, 0.08, WD2, DARK); };
    const cushion = (x, z, tn) => box(x, FY + 0.03, z, 0.55, 0.09, 0.55, SHG, tn != null ? tn : 0x7a2a2a, { gain: 1.6, uv: [0.5, 0.5] });
    const seatRing = (x, z, tw, td, tn) => { cushion(x, z + td / 2 + 0.45, tn); cushion(x, z - td / 2 - 0.45, tn); if (tw > 1.3) { cushion(x - tw / 2 - 0.45, z, tn); cushion(x + tw / 2 + 0.45, z, tn); } };
    const futon = (x, z, turn) => { const fw = turn ? 1.9 : 1.0, fd = turn ? 1.0 : 1.9; box(x, FY + 0.03, z, fw, 0.1, fd, SHG, 0xf2efe6, { gain: 2.0, uv: [0.9, 0.9] }); box(x + (turn ? 0.2 : 0), FY + 0.13, z + (turn ? 0 : 0.2), fw - (turn ? 0.5 : 0.1), 0.07, fd - (turn ? 0.1 : 0.5), SHG, 0x4a5a8a, { gain: 1.6, uv: [0.7, 0.7] });
        box(x - (turn ? 0.72 : 0), FY + 0.13, z - (turn ? 0 : 0.72), turn ? 0.26 : 0.5, 0.1, turn ? 0.5 : 0.26, SHG, 0xe8e2d0, { gain: 1.9 }); };
    const alcove = (x, aw) => { const zb = -D2; box(x, FY, zb + 0.4, aw, 0.16, 0.8, WD2, 0x5a3a26, { uv: [0.9, 0.9] }); box(x - aw / 2 - 0.06, 0, zb + 0.4, 0.12, Hc - 0.5, 0.8, WD2, DARK); box(x + aw / 2 + 0.06, 0, zb + 0.4, 0.12, Hc - 0.5, 0.12, WD2, DARK);
        Q(x, 0.9, zb + 0.03, 0.55, 1.5, 0, PLS, 0xf6f0dc, { gain: 2.3, glow: 0.2, kind: 'wall' }); Q(x, 1.25, zb + 0.035, 0.36, 0.8, 0, null, 0x2a2a30, { kind: 'wall' }); box(x, 2.4, zb + 0.04, 0.62, 0.05, 0.05, WD2, DARK); box(x, 0.88, zb + 0.04, 0.62, 0.05, 0.05, WD2, DARK); };
    const hearth = (x, z) => { box(x, FY, z, 1.3, 0.1, 1.3, WD2, DARK, { uv: [0.9, 0.9] }); box(x, FY + 0.1, z, 1.0, 0.02, 1.0, null, 0x2a2622); a.cyl(x, FY + 0.12, z, 0.3, 0.04, null, 0xff6a1a, { seg: 8, glow: 0.9 }); put('kettle', x, z, { y: 0.5 }); };
    const counter = (x, z, len, ry) => { box(x, FY, z, len, 0.95, 0.6, WD2, 0x6a4a30, { ry: ry || 0, uv: [0.9, 0.9] }); box(x, FY + 0.95, z, len + 0.1, 0.06, 0.72, WD2, 0x4a3424, { ry: ry || 0 }); };
    const shelf = (x, z, len, ry, rows) => { for (let k = 0; k < (rows || 3); k++) box(x, FY + 0.5 + k * 0.55, z, len, 0.05, 0.4, WD2, 0x5a3a26, { ry: ry || 0 }); for (const s of [-1, 1]) { const dx = ry ? 0 : s * len / 2, dz = ry ? s * len / 2 : 0; box(x + dx, FY, z + dz, 0.07, 0.5 + (rows || 3) * 0.55, 0.4, WD2, DARK, { ry: ry || 0 }); } };
    const tub = (x, z, tw, td) => { box(x, FY, z, tw, 0.75, td, WD2, 0xb8905a, { uv: [0.6, 0.6], top: false, gain: 1.5 }); box(x, FY + 0.62, z, tw - 0.16, 0.02, td - 0.16, null, 0x6ab0c8, { glow: 0.25 }); for (const y of [0.18, 0.56]) { box(x, FY + y, z, tw + 0.04, 0.05, td + 0.04, null, 0x3a3a3a, { top: false }); } box(x + tw / 2 + 0.35, FY, z, 0.5, 0.32, td * 0.6, WD2, 0x8a6a48); };
    const dais = (x, z, tw, td, dh) => { box(x, FY, z, tw, dh, td, WD2, 0x5a3a26, { uv: [0.9, 0.9] }); box(x, FY + dh, z, tw - 0.1, 0.03, td - 0.1, SHG, 0xc9c488, { gain: 1.9, uv: [0.9, 0.9] }); };
    const screen = (x, z, len, ry) => { box(x, FY, z, len, 1.9, 0.05, PLS, 0xfbf4de, { ry: ry || 0, glow: 0.3, gain: 2.3, uv: [1.75, 1.75] }); for (const y of [0, 0.62, 1.25, 1.87]) box(x, FY + y, z, len + 0.02, 0.05, 0.07, WD2, DARK, { ry: ry || 0 }); const n = Math.max(2, Math.round(len / 0.9)); for (let i = 0; i <= n; i++) { const t = -len / 2 + i * len / n; box(x + (ry ? 0 : t), FY, z + (ry ? t : 0), 0.05, 1.9, 0.07, WD2, DARK, { ry: ry || 0 }); } };
    const lamp = (x, z) => put('paper_lantern', x, z, { y: r2(Hc - 0.75), h: 0.42 });
    /* THE FLAG of Katana Bay (mondo's relationship web, 2026-11-20: "Their flag is a red square and white background"): a pole, a white cloth, a red square on it */
    const flag = (x, z, ry) => { box(x, FY, z, 0.07, 2.5, 0.07, WD2, DARK); const dx = ry === 90 ? 0 : 0.5, dz = ry === 90 ? 0.5 : 0; box(x + dx, FY + 1.35, z + dz, ry === 90 ? 0.03 : 0.9, 1.1, ry === 90 ? 0.9 : 0.03, PLS, 0xffffff, { gain: 2.4, glow: 0.15 }); box(x + dx, FY + 1.65, z + dz, ry === 90 ? 0.04 : 0.44, 0.44, ry === 90 ? 0.44 : 0.04, PLS, 0xd0281e, { gain: 2.2 }); };
    const xl = -W2 + 0.5, xr = W2 - 0.5, zb = -D2 + 0.5, zf = D2 - 0.5, big = 2 * W2 >= 12, deep = 2 * D2 >= 9;
    const farX = door.lx > 0 ? -1 : 1;   // the side of the room away from the door
    const type = ROOM_OF[id];
    /* ── the rooms ── */
    if (type !== 'shipwright' && type !== 'market' && type !== 'tower' && type !== 'brewery' && type !== 'store') mats(-W2 + 0.2, -D2 + 0.2, W2 - 0.2, D2 - 1.3);
    if (type === 'home' || type === 'samurai') { alcove(farX * (W2 - 1.5), 1.6); hearth(0, 0.2); table(-farX * (W2 - 1.6), zb + 0.9, 1.3, 0.8); seatRing(-farX * (W2 - 1.6), zb + 0.9, 1.3, 0.8);
        futon(farX * (W2 - 0.9), 0.6); if (2 * W2 > 6) futon(farX * (W2 - 2.1), 0.6); shelf(-farX * (W2 - 0.25), 0.4, 1.6, 90, 3); put('woven_baskets', -farX * (W2 - 0.9), zf - 0.8, {}); lamp(0, zb + 1.5);
        if (type === 'samurai') { put('decor_armour_stand_post', farX * (W2 - 0.7), zb + 0.3, { face: 0 }); put('sword', farX * (W2 - 1.5), zb + 0.45, { y: 0.35 }); put('privacy_screen', farX * (W2 - 3.0), 0.2, { face: 90 }); } }
    else if (type === 'hut' || type === 'farm') { hearth(0, 0); futon(xl + 0.7, zb + 0.6, true); futon(xr - 0.7, zb + 0.6, true); put('stock_pots', -farX * (W2 - 0.8), zf - 0.6, {}); put('woven_baskets', farX * (W2 - 0.8), zf - 0.7, {});
        put(type === 'farm' ? 'wooden_bucket' : 'fishing_rod', farX * (W2 - 0.5), 0, {}); if (2 * W2 > 6) { put('wooden_barrel', xr - 0.3, 0.6, {}); shelf(xl - 0.1, 0.6, 1.4, 90, 2); } }
    else if (type === 'office') { table(0, zb + 1.0, 1.9, 0.9, 0.38); cushion(0, zb + 0.25, 0x2a3a6a); cushion(-0.6, zb + 2.0); cushion(0.6, zb + 2.0); shelf(xl - 0.15, 0, 2.2, 90, 4); shelf(xr + 0.15, -0.6, 1.6, 90, 4); alcove(farX * (W2 - 1.3), 1.4);
        put('psx_wooden_crate_1', xr - 0.4, zf - 0.6, {}); put('candelabra', 0.7, zb + 1.0, { y: 0.44 }); lamp(0, 0.6); }
    else if (type === 'market') { for (let x = -W2 + 1.6; x < W2 - 1; x += 3.2) { table(x, zb + 1.2, 2.4, 1.0, 0.8); put('woven_baskets', x - 0.5, zb + 1.2, { y: 0.9 }); put('river_fish', x + 0.5, zb + 1.2, { y: 0.9 }); }
        counter(farX * (W2 - 1.6), 0.8, 2.6, 0); put('wooden_barrel', xl, zf - 0.4, {}); put('wooden_barrel', xl + 1.1, zf - 0.3, {}); put('wooden_bucket', xr, zf - 0.6, {}); put('drying_fish', -farX * (W2 - 1.4), 0.4, { face: 90 }); lamp(-2, 0.5); lamp(2, 0.5); }
    else if (type === 'shipwright') { put('dock_boat', 0, -0.6, { face: 90, y: 0.5 }); for (const sx of [-2.4, 0, 2.4]) { box(sx, FY, -0.6, 0.3, 0.5, 2.6, WD2, DARK); } put('forge', xl + 0.6, zb + 0.6, { face: 0 }); put('anvil', xl + 2.2, zb + 0.9, {}); put('grindstone', xl + 0.6, zf - 1.2, {});
        for (let k = 0; k < 4; k++) box(xr - 1.0, FY + k * 0.16, zb + 0.5 + k * 0.05, 3.4, 0.14, 0.34, WD2, 0xb8905a, { uv: [0.9, 0.9] }); put('oars', xr - 0.3, 0.8, { face: 90 }); put('rope_coils', xr - 0.8, zf - 0.8, {}); shelf(0, zb - 0.1, 3.0, 0, 3); }
    else if (type === 'netloft') { put('fishing_net_wall', 0, zb + 0.1, { face: 0 }); put('fishing_net_wall', xl + 0.1, 0, { face: 90 }); put('rope_coils', xr - 0.5, zb + 0.6, {}); put('rope_coils', xr - 0.6, 0.4, {}); put('lobster_traps', xl + 0.8, zf - 0.9, {}); table(farX * 1.2, 0.2, 1.6, 0.9, 0.7); put('oars', xr - 0.2, zf - 1.0, { face: 90 }); futon(farX * (W2 - 0.9), zb + 1.2); }
    else if (type === 'store' || type === 'brewery') { const n = Math.floor((2 * W2 - 1) / 1.2); for (let i = 0; i < n; i++) { put('wooden_barrel', -W2 + 0.8 + i * 1.2, zb + 0.2, {}); if (type === 'brewery' && i % 2 === 0) put('wooden_barrel', -W2 + 0.8 + i * 1.2, zb + 1.3, {}); }
        shelf(xl - 0.15, 0.6, 2.4, 90, 4); for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) box(xr - 0.9 - j * 0.0, FY + k * 0.42, 0.2 + j * 0.9 + k * 0.45, 0.9, 0.42, 0.85, SHG, 0xd8c890, { gain: 1.8, uv: [0.5, 0.5] });   // rice bales stacked
        put('psx_wooden_crate_1', 0, 0.4, {}); put('woven_baskets', 1.2, zf - 0.7, {}); if (type === 'brewery') { a.cyl(farX * 1.5, FY, 0.6, 1.1, 1.5, WD2, 0xb8905a, { seg: 14, uv: [0.6, 0.6] }); a.cyl(farX * 1.5, FY + 1.42, 0.6, 0.98, 0.03, null, 0xe8e2c8, { seg: 14 }); counter(-farX * 1.8, zf - 1.6, 2.2, 0); put('teacups', -farX * 1.8, zf - 1.6, { y: 1.16, h: 0.3 }); } lamp(0, 0); }
    else if (type === 'inn') { hearth(0, 0.6); for (const sx of [-1, 1]) { table(sx * (W2 - 2.2), 1.2, 1.5, 0.9); seatRing(sx * (W2 - 2.2), 1.2, 1.5, 0.9); table(sx * (W2 - 2.2), -1.4, 1.5, 0.9); seatRing(sx * (W2 - 2.2), -1.4, 1.5, 0.9, 0x2a4a3a); }
        counter(0, zb + 0.9, Math.min(5, 2 * W2 - 4), 0); put('stock_pots', -1.2, zb + 0.2, {}); put('teapot', 0.8, zb + 0.9, { y: 1.16, span: 0.34 }); put('wooden_barrel', xl, zb + 0.2, {}); put('wooden_barrel', xr, zb + 0.2, {});
        screen(farX * (W2 - 1.4), zb + 2.4, 2.4, 0); futon(farX * (W2 - 0.9), zb + 1.2, true); alcove(-farX * (W2 - 1.3), 1.4); lamp(-2.5, 0); lamp(2.5, 0); }
    else if (type === 'tea' || type === 'shop' || type === 'kitchen') { table(0, 0, 1.5, 0.9); seatRing(0, 0, 1.5, 0.9, 0x2a4a3a); put('teapot', 0, 0, { y: 0.54, span: 0.34 }); put('teacups', 0.45, 0.1, { y: 0.54, h: 0.3 }); alcove(farX * (W2 - 1.2), 1.3);
        if (2 * W2 > 6) { table(-farX * (W2 - 1.5), zb + 1.0, 1.2, 0.8); seatRing(-farX * (W2 - 1.5), zb + 1.0, 1.2, 0.8); } if (type !== 'tea') { counter(-farX * (W2 - 1.4), zf - 1.9, 2.0, 0); shelf(-farX * (W2 - 0.1), 0, 1.8, 90, 4); put(type === 'kitchen' ? 'stock_pots' : 'woven_baskets', -farX * (W2 - 1.4), zb + 0.3, {}); }
        put('kettle', farX * 0.9, zf - 1.6, { y: 0.2 }); lamp(0, 0.4); }
    else if (type === 'workshop') { table(0, zb + 0.9, 2 * W2 - 1.6, 0.9, 0.7); for (let i = 0; i < 3; i++) put('paper_lantern', -1.4 + i * 1.4, zb + 0.9, { y: 0.92, h: 0.42 }); for (let i = 0; i < 4; i++) put('paper_lantern', -W2 + 1 + i * 1.3, 0.6, { y: r2(Hc - 0.8 - (i % 2) * 0.3), h: 0.42 }); shelf(xl - 0.15, 0.4, 2.0, 90, 4); cushion(0, zb + 1.9); }
    else if (type === 'bath') { tub(-W2 + 2.2, zb + 1.3, 2.6, 1.8); tub(W2 - 2.6, zb + 1.3, 2.6, 1.8); screen(0, zb + 1.3, 2.6, 90); for (const sx of [-1, 1]) { box(sx * (W2 - 1.6), FY, zf - 1.5, 2.2, 0.4, 0.5, WD2, 0x8a6a48); put('wooden_bucket', sx * (W2 - 1.0), 0.3, {}); }
        shelf(farX * (W2 - 0.1), 0.6, 1.8, 90, 3); put('privacy_screen', -farX * 1.2, zf - 2.2, { face: 0 }); put('brazier', 0, 0.9, {}); lamp(-2, 0.2); lamp(2, 0.2); }
    else if (type === 'dojo') { put('dojo_weapon_rack', xl + 0.2, zb + 0.2, { face: 0 }); put('dojo_weapon_rack', xr - 0.2, zb + 0.2, { face: 0 }); alcove(0, 2.4); put('sword', 0, zb + 0.45, { y: 0.4 }); put('decor_armour_stand_post', -2.2, zb + 0.3, {}); put('decor_armour_stand_post', 2.2, zb + 0.3, {});
        put('wing_chun_dummy', xl + 0.6, 0.8, {}); put('wing_chun_dummy', xl + 0.6, 3.0, {}); put('taiko_drum', xr - 0.6, zf - 1.4, {}); for (let i = 0; i < 5; i++) cushion(xr - 0.5, -3 + i * 1.1, 0x2a2a3a); put('spear', xr - 0.2, -4.2, {}); flag(xl + 0.2, -3.6, 90); lamp(-3, 0); lamp(3, 0); lamp(0, 3); }
    else if (type === 'armoury' || type === 'guard') { put('dojo_weapon_rack', 0, zb + 0.2, { face: 0 }); for (let i = 0; i < 3; i++) { put('spear', xl + 0.2 + i * 0.5, zb + 0.3, {}); put('decor_armour_stand_post', xr - 0.3, zb + 0.4 + i * 1.5, { face: 270 }); }
        shelf(xl - 0.15, 0.8, 2.2, 90, 4); put('sword', xl + 0.1, 0.8, { y: 1.2 }); put('psx_wooden_crate_1', 0, 0.6, {}); if (type === 'guard') { hearth(0, 0.4); futon(xr - 0.6, zf - 2.2); futon(xl + 0.6, zf - 2.2); } else { put('wooden_barrel', 0, zf - 1.8, {}); flag(xr - 0.2, zf - 1.6, 90); } lamp(0, 0); }
    else if (type === 'temple' || type === 'pagoda' || type === 'shrine') { const dw = Math.min(4.4, 2 * W2 - 1.5); dais(0, zb + 0.9, dw, 1.5, 0.5); put('votive_stand', 0, zb + 0.9, { y: 0.67 }); put('brazier', -dw / 2 - 0.5, zb + 1.4, {}); put('brazier', dw / 2 + 0.5, zb + 1.4, {});
        Q(0, 1.2, -D2 + 0.03, Math.min(2.2, dw), 1.9, 0, PLS, 0xd8a83a, { gain: 2.4, glow: 0.35, kind: 'wall' }); box(0, 1.15, -D2 + 0.05, Math.min(2.4, dw + 0.2), 0.08, 0.08, WD2, DARK); box(0, 3.1, -D2 + 0.05, Math.min(2.4, dw + 0.2), 0.08, 0.08, WD2, DARK);   // the gilt panel behind the altar
        if (type !== 'shrine') { put('gong', xl + 0.6, 0.2, { face: 90 }); for (let r = 0; r < (deep ? 3 : 1); r++) for (let i = -2; i <= 2; i++) if (Math.abs(i * 1.1) < W2 - 1.2) cushion(i * 1.1, 0.6 + r * 1.0, 0x8a2a2a); put('item_censer', 0, zb + 2.0, {}); put('prayer_flags', 0, 0, { y: r2(Hc - 1.4), face: 0 }); }
        lamp(-1.6, 0.4); lamp(1.6, 0.4); }
    else if (type === 'theatre') { dais(0, zb + 1.6, 2 * W2 - 1.2, 3.0, 0.6); screen(0, zb + 0.25, 2 * W2 - 2.0, 0); put('taiko_drum', -W2 + 1.6, zb + 1.2, { y: 0.74 }); put('taiko_drum', W2 - 1.6, zb + 1.2, { y: 0.74 }); put('privacy_screen', 0, zb + 1.0, { y: 0.74, face: 0 });
        for (let r = 0; r < 3; r++) for (let i = -4; i <= 4; i++) if (Math.abs(i * 1.2) < W2 - 0.8) cushion(i * 1.2, 0.2 + r * 1.2, r % 2 ? 0x2a4a3a : 0x7a2a2a); lamp(-4, -1); lamp(0, -1); lamp(4, -1); }
    else if (type === 'keep') { dais(0, zb + 1.4, 5.0, 2.4, 0.4); cushion(0, zb + 1.2, 0x8a6a1a); screen(0, zb + 0.25, 4.6, 0); put('sword', 0.9, zb + 1.6, { y: 0.6 }); for (const sx of [-1, 1]) { put('decor_armour_stand_post', sx * 3.4, zb + 0.5, {}); flag(sx * (W2 - 0.9), zb + 0.5, 0); put('brazier', sx * 2.9, zb + 2.9, {});
            for (let i = 0; i < 3; i++) cushion(sx * 2.2, zb + 4.2 + i * 1.2, 0x2a2a3a); put('dojo_weapon_rack', sx * (W2 - 0.3), 1.6, { face: sx > 0 ? 270 : 90 }); } table(0, zb + 4.6, 1.8, 1.0); put('teapot', 0, zb + 4.6, { y: 0.54, span: 0.34 }); lamp(-3, 1); lamp(3, 1); lamp(0, 3); }
    else if (type === 'tower') { put('brazier', 0, 0, {}); put('firewood_stack', farX * (W2 - 0.9), zb + 0.4, { face: 0 }); put('wooden_bucket', -farX * (W2 - 0.6), zb + 0.5, {}); }
    void rnd; void big; void xl; void xr;
}
module.exports = { ROOM_OF, furnish };
