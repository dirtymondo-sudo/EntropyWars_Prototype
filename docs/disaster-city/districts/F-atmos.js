/* DISASTER CITY · THE FINANCIAL DISTRICT · THE SECOND PASS (2026-11-14, mondo 11-13 22:33: "after a district's first interior pass, do another
   interior pass ... make a list of models needed/wanted but not in the bucket or game, and make meshy versions of them ... Focus on aesthetic,
   vibe, atmosphere for the interiors"). Required by F-inside.js: `atmos(T, g, I)` runs after a hall's first pass (INS[id]) and before its arch
   row is written, so its parts go into the same `dc:<id>:in` row.
   THE LIGHT: the hollow building's own ceiling draws black and the city room's ten real lights stay with the streets, so each hall gets a LIT
   ceiling deck (a sheet with `glow`), lit panels / strips / pendants / sconces / daylit windows (drawn glow only).
   THE WALLS: a coat over the bare inside sheet 3 cm in front of the wall (behind the first pass's lift doors, mail boxes and screens, which
   stand 9 cm out), a dado, a skirting, a rail and a crown; pilasters flat on the walls.
   THE SQUARES (mondo 11-13 21:14): a new thing that blocks stands on a whole 3.5 m square's middle with a ghost wall for the walker
   (`I.solid`); chairs, lamps, plants, carts and wall pieces stand OFF the squares' middles or flat on a wall; no walkway square is closed.
   THE PIECES: the 22 Financial Meshy models (data.js "THE FINANCIAL INTERIOR PIECES") + other districts' Meshy pieces (luggage_cart,
   crystal_chandelier, rope_stanchion, photocopier, espresso_machine, jewelry_case, banker_lamp) + the PSX Mega Pack (paintings, armchairs,
   monitors, keypads, walkie-talkies). A piece's front is +Z: heading 180 = its front to the building's door side (+z), 0 = to the back wall.
   Left alone: the Bankers' terrace homes, the hotel's Politician room (front-left squares) and the penthouse's bedroom column (both the
   residents' bedrooms work of the first-pass thread). */
'use strict';
module.exports = function (K, A) {
    const { box, cyl, quad, U } = K, { props } = A, r3 = v => Math.round(v * 1000) / 1000;
    const GILT = 'gold', WHITE = 0xffffff, IRON = 0x24272c, WARM = 0xffe2a8;
    /* a hall whose facade's cornice slab runs through its storey (the hotel: a marble slab, under face at 6.38 m, over the whole plan) hangs its
       ceiling under that slab, or the slab's unlit underside is the ceiling the walker sees */
    const LOW = { 'P08-00-B1': 6.3 };
    const kit = (T, g, I) => {
        const W = T.W, D = T.D, W2 = W / 2, D2 = D / 2, E = 0.24, H = LOW[T.id] || Math.max(2.5, (T.row.storeys || 1) * 3.5 - 0.32), lx = T.lx, dw = T.cw + 0.12;
        const Q = (...p) => I.Q.push(...p.filter(Boolean));
        /* a prop at room-local (x, z), its front turned `hd` (0 = to the back wall, 180 = to the door side, 90 = to +x) */
        const P = (key, x, z, hd, o) => I.put(key, r3(x), r3(z), 'f', Object.assign({ face: (((hd || 0) + T.rot) % 360 + 360) % 360 }, o || {}));
        /* a wall piece with its back to wall 'b' | 'f' | 'l' | 'r', `along` = x (b/f) or z (l/r), `e` = half its depth */
        const onWall = (key, wall, along, y, e, o) => { e = E + (e || 0.15); const at = wall === 'b' ? [along, -D2 + e, 180] : wall === 'f' ? [along, D2 - e, 0] : wall === 'l' ? [-W2 + e, along, 90] : [W2 - e, along, 270];
            P(key, at[0], at[1], at[2], Object.assign({ y: r3(y), mount: 0 }, o || {})); };
        const coat = (key, tint, h, gain, e, glow) => { e = e || 0.27; const o = Object.assign({ kind: 'wall' }, gain ? { gain } : {}, glow ? { glow } : {});
            Q(quad(0, 0, -D2 + e, W - 2 * e, h, 0, key, tint, o), quad(0, 0, D2 - e, W - 2 * e, h, 180, key, tint, Object.assign({ hole: [r3(-lx), r3(dw), Math.min(2.25, h)] }, o)),
                quad(-W2 + e, 0, 0, D - 2 * e, h, 270, key, tint, o), quad(W2 - e, 0, 0, D - 2 * e, h, 90, key, tint, o)); };
        /* a band round the four walls (skirting, rail, crown): `t` proud of the coat, broken at the doorway under the door head */
        const band = (y, h, t, key, tint, o) => { const e = 0.28, f = e + t / 2, run = (x0, x1, z) => { if (x1 - x0 > 0.05) Q(box((x0 + x1) / 2, y, z, x1 - x0, h, t, key, tint, o)); };
            run(-W2 + e, W2 - e, -D2 + f); if (y < 2.3) { run(-W2 + e, lx - dw / 2, D2 - f); run(lx + dw / 2, W2 - e, D2 - f); } else run(-W2 + e, W2 - e, D2 - f);
            for (const sg of [-1, 1]) Q(box(sg * (W2 - f), y, 0, t, h, D - 2 * e, key, tint, o)); };
        /* the lining: a wall coat, a dado to `dh` with its rail, a skirting, a crown and the lit ceiling deck */
        const liner = o => { if (o.wall) coat(o.wall[0], o.wall[1], H, o.wall[2], 0.27, o.wall[3] == null ? 0.14 : o.wall[3]); if (o.dado) { coat(o.dado[0], o.dado[1], o.dh, o.dado[2], 0.275); band(o.dh - 0.03, 0.07, 0.05, o.rail ? o.rail[0] : null, o.rail ? o.rail[1] : 0x3a2418, o.rail && o.rail[2]); }
            band(0, 0.15, 0.05, o.skirt ? o.skirt[0] : null, o.skirt ? o.skirt[1] : 0x2a2420); if (o.crown) band(H - 0.3, 0.26, 0.14, o.crown[0], o.crown[1], o.crown[2]);
            if (o.ceil) Q(box(0, H - 0.05, 0, W - 0.6, 0.04, D - 0.6, o.ceil[0], o.ceil[1], { glow: o.ceil[2], gain: o.ceil[3] || 1.4, under: true, roof: true, top: false })); };
        /* coffer beams under the ceiling on the squares' lines (every `every` squares) */
        const coffers = (key, tint, every, deep) => { deep = deep || 0.35; const lines = (vals, n) => vals.filter((v, i) => i % every === 0).map(v => v - 1.75);
            for (const x of lines(g.X)) if (x > -W2 + 1 && x < W2 - 1) Q(box(x, H - deep, 0, 0.3, deep - 0.04, D - 0.7, key, tint, { under: true }));
            for (const z of lines(g.Z)) if (z > -D2 + 1 && z < D2 - 1) Q(box(0, H - deep, z, W - 0.7, deep - 0.04, 0.3, key, tint, { under: true })); };
        const panel = (x, z, w, d, tint) => Q(box(x, H - 0.1, z, w + 0.14, 0.05, d + 0.14, null, 0x8a8e96, { under: true }), box(x, H - 0.12, z, w, 0.03, d, null, tint || 0xf4f8ff, { glow: 1, under: true }));
        const strip = (x, z, len, alongZ, tint) => { const s = alongZ ? [0.24, len] : [len, 0.24]; Q(box(x, H - 0.4, z, s[0], 0.07, s[1], null, 0xd8dce2, { under: true }), box(x, H - 0.42, z, s[0] * 0.7, 0.03, s[1] * 0.92, null, tint || 0xeef8ff, { glow: 1, under: true }), cyl(x, H - 0.33, z, 0.01, 0.33, null, IRON, { seg: 4, cap: false })); };
        const pend = (x, z, y, shade, bulb, r) => { r = r || 0.3; Q(cyl(x, y + 0.26, z, 0.012, H - y - 0.26, null, 0x202020, { seg: 4, cap: false }), cyl(x, y, z, r, 0.28, shade[0], shade[1], { r2: r3(r * 0.25), seg: 14, ds: true, cap: false }), cyl(x, y - 0.06, z, r * 0.3, 0.14, null, bulb || WARM, { glow: 1, seg: 10, under: true })); };
        /* a wall sconce: a gilt back plate, an arm and a lit shade */
        const sconce = (wall, along, y, tint) => { const e = 0.3, at = wall === 'b' ? [along, -D2 + e, 0] : wall === 'f' ? [along, D2 - e, 180] : wall === 'l' ? [-W2 + e, along, 90] : [W2 - e, along, 270];
            const ox = wall === 'l' ? 0.12 : wall === 'r' ? -0.12 : 0, oz = wall === 'b' ? 0.12 : wall === 'f' ? -0.12 : 0;
            Q(box(at[0], y - 0.2, at[1], wall === 'l' || wall === 'r' ? 0.04 : 0.16, 0.4, wall === 'l' || wall === 'r' ? 0.16 : 0.04, GILT, WHITE, { gain: 1.4 }), box(at[0] + ox, y, at[1] + oz, 0.2, 0.26, 0.2, null, tint || WARM, { glow: 1 }), box(at[0] + ox, y + 0.26, at[1] + oz, 0.24, 0.04, 0.24, GILT, WHITE, { gain: 1.4 })); };
        /* a daylit window on a wall (the facade's glass stands for it): a frame and a lit sheet, muntins */
        const window_ = (wall, along, y, w, h, frameTint, key) => { const e = 0.28, ry = wall === 'b' ? 0 : wall === 'f' ? 180 : wall === 'l' ? 270 : 90, at = wall === 'b' ? [along, -D2 + e] : wall === 'f' ? [along, D2 - e] : wall === 'l' ? [-W2 + e, along] : [W2 - e, along];
            const nx = wall === 'l' ? 1 : wall === 'r' ? -1 : 0, nz = wall === 'b' ? 1 : wall === 'f' ? -1 : 0, al = wall === 'l' || wall === 'r';
            Q(quad(at[0] + nx * 0.01, y - 0.12, at[1] + nz * 0.01, w + 0.3, h + 0.24, ry, null, frameTint || 0x3a2a1c), quad(at[0] + nx * 0.03, y, at[1] + nz * 0.03, w, h, ry, key || U('GlassWindowTall1a'), 0xdcecff, { glow: 0.75, win: 'keep', uv: 'fit' }),
                box(at[0] + nx * 0.05, y + h / 2 - 0.03, at[1] + nz * 0.05, al ? 0.04 : w, 0.06, al ? w : 0.04, null, frameTint || 0x3a2a1c), box(at[0] + nx * 0.05, y, at[1] + nz * 0.05, al ? 0.04 : 0.06, h, al ? 0.06 : 0.04, null, frameTint || 0x3a2a1c)); };
        /* a pilaster flat on a wall, full height: a shaft, a base and a capital */
        const pilaster = (wall, along, key, tint, w, capKey, capTint) => { w = w || 0.5; const e = 0.27 + 0.07, al = wall === 'l' || wall === 'r', at = wall === 'b' ? [along, -D2 + e] : wall === 'f' ? [along, D2 - e] : wall === 'l' ? [-W2 + e, along] : [W2 - e, along];
            const bw = al ? 0.14 : w, bd = al ? w : 0.14, cw = al ? 0.24 : w + 0.2, cd = al ? w + 0.2 : 0.24;
            Q(box(at[0], 0, at[1], bw, H - 0.3, bd, key, tint), box(at[0], 0, at[1], cw, 0.4, cd, key, tint), box(at[0], H - 0.62, at[1], cw, 0.32, cd, capKey || key, capTint || tint, capKey === GILT ? { gain: 1.4 } : {})); };
        const rug = (x, z, w, d, key, tint) => Q(quad(x, 0.035, z, w, d, 0, key, tint, { flat: true }));
        return { W, D, W2, D2, E, H, lx, Q, P, onWall, coat, band, liner, coffers, panel, strip, pend, sconce, window_, pilaster, rug, c: g.c, X: g.X, Z: g.Z };
    };

    const SECOND = {
        /* THE HOTEL LOBBY: a grand deco lobby. Walnut wainscot under cream plaster, a gilt rail, marble pilasters, a coffered lit ceiling, daylit
           upper windows; the key cabinet over reception, the concierge podium and a bellhop's cart by the door, a second lounge of Chesterfields,
           wingbacks by the fire-side sofas, stools at the bar, crystal chandeliers over both lounges, urns by the desk. */
        'P08-00-B1': (T, A) => {
            const { H, W2, D2, c, P, onWall } = A;
            A.liner({ wall: [U('PlasterWallStucco1a'), 0xeadcc0, 1.3], dado: ['calm_planks', 0x6a3c22, 1.2], dh: 1.3, rail: [GILT, WHITE, { gain: 1.4 }], skirt: ['calm_planks', 0x2a160c], crown: ['calm_marble', 0xf0e6d4], ceil: [U('FibreCeilingTile1a'), 0xfff0d8, 0.9] });
            A.coffers('calm_planks', 0x4a2a18, 2, 0.45);
            for (const z of [-10.5, -3.5]) A.pilaster('l', z, 'calm_marble', 0xe8e0d0, 0.6, GILT, WHITE); for (const z of [-10.5, 3.5, 10.5]) A.pilaster('r', z, 'calm_marble', 0xe8e0d0, 0.6, GILT, WHITE);
            for (const x of [-10.5, -6.3, 6.3, 10.3]) A.pilaster('b', x, 'calm_marble', 0xe8e0d0, 0.6, GILT, WHITE); for (const x of [-5.5, 7, 10.5]) A.pilaster('f', x, 'calm_marble', 0xe8e0d0, 0.6, GILT, WHITE);
            for (const z of [-7, 0, 7]) A.window_('r', z, 3.9, 2.0, 2.3); A.window_('l', -7, 3.9, 2.0, 2.3);
            for (const z of [-12.2, -8.8, 0.6]) A.sconce('l', z, 2.4); for (const z of [-12.2, -8.8, 5.2, 8.8, 12.2]) A.sconce('r', z, 2.6); for (const x of [-5.3, 5.3]) A.sconce('b', x, 2.4); for (const x of [3.0, 5.2, 8.8, 12.2]) A.sconce('f', x, 2.4);
            onWall('key_rack', 'b', 0, 2.95, 0.12); onWall('psx_painting_1', 'b', -3.1, 3.0, 0.05, { h: 1.0 }); onWall('psx_painting_1', 'b', 3.1, 3.0, 0.05, { h: 1.0 });
            onWall('psx_painting_1', 'l', -5.25, 1.9, 0.05, { h: 0.9 }); onWall('psx_painting_1', 'l', -1.75, 1.9, 0.05, { h: 0.9 });
            P('concierge_podium', -2.4, 8.3, 180); P('luggage_cart', 5.4, -9.4, 270); P('stone_urn', -6.3, -12.9, 180); P('stone_urn', 6.3, -12.9, 180);
            P('marble_bust', -2.6, D2 - 0.6, 0); P('marble_bust', 4.4, D2 - 0.6, 0);
            for (const z of [-6.2, -4.4, -2.6, -0.8, 1.0, 2.8]) P('bar_stool', 11.15, z, 90);
            P('wingback_chair', -7.9, -5.0, 270); P('wingback_chair', -7.9, -2.0, 270);
            /* the second lounge on the right of the walk: a Chesterfield each side of a low table on its rug (the squares c(5,3) and c(5,5)) */
            const s4 = c(5, 4);
            A.rug(s4[0], s4[1], 3.2, 4.4, 'carpet', 0x7a1a24); P('chesterfield_sofa', s4[0], s4[1] - 1.4, 180); P('chesterfield_sofa', s4[0], s4[1] + 1.4, 0); P('psx_coffee_table_1', s4[0], s4[1], 0);
            P('banker_lamp', s4[0] + 0.3, s4[1], 180, { y: 1.0 });
            P('crystal_chandelier', s4[0], s4[1], 0, { y: r3(H - 1.75) }); P('crystal_chandelier', -9.6, -3.5, 0, { y: r3(H - 1.75) });
        },
        /* THE GOBLIN BANK: a marble banking temple. Cream marble walls over a green marble dado, gilt rails, giant pilasters, a coffered lit
           ceiling, clerestory daylight high up; a velvet rope before the vault, busts either side, sacks by the gold, deposit box walls,
           counting machines on the teller counters, ticker machines on the managers' desks, old safes in the back corners, urns by the doors. */
        'P10-00-B1': (T, A) => {
            const { H, W2, D2, c, P, onWall } = A;
            A.liner({ wall: ['calm_marble', 0xeee6d6, 1.2], dado: [U('TileMarble1a'), 0x3a5a48, 1.1], dh: 1.6, rail: [GILT, WHITE, { gain: 1.4 }], skirt: ['calm_marble', 0x24382c], crown: [GILT, WHITE, { gain: 1.3 }], ceil: [U('PlasterWallStucco1a'), 0xf6eedc, 0.84] });
            A.coffers('calm_marble', 0xe0d6c0, 1, 0.6);
            for (const z of [-7, 0, 6]) { A.pilaster('l', z, 'calm_marble', 0xf2ecde, 0.9, GILT, WHITE); A.pilaster('r', z, 'calm_marble', 0xf2ecde, 0.9, GILT, WHITE); }
            for (const x of [-10.5, -5.0, 5.0, 10.5]) A.pilaster('b', x, 'calm_marble', 0xf2ecde, 0.9, GILT, WHITE); for (const x of [-7, 7]) A.pilaster('f', x, 'calm_marble', 0xf2ecde, 0.9, GILT, WHITE);
            for (const z of [-3.5, 3.5, -9.6]) { A.window_('l', z, 8.2, 2.2, 3.8, 0x2a3a30); A.window_('r', z, 8.2, 2.2, 3.8, 0x2a3a30); } for (const x of [-3.5, 3.5]) A.window_('f', x, 8.2, 2.2, 3.8, 0x2a3a30);
            for (const z of [-3.5, 3.5]) { A.sconce('l', z, 2.9); A.sconce('r', z, 2.9); } for (const x of [-7.8, 7.8]) A.sconce('b', x, 2.9);
            for (const x of [-2.4, -0.8, 0.8, 2.4]) P('rope_stanchion', x, -9.0, 0); A.rug(0, -1.5, 3.0, 17, 'carpet', 0x6a1420);
            P('marble_bust', -3.5, -10.75, 180); P('marble_bust', 3.5, -10.75, 180); P('money_sacks', -7.0, -10.5, 160); P('money_sacks', 7.0, -10.5, 200);
            onWall('deposit_box_wall', 'l', -8.6, 0, 0.3); onWall('deposit_box_wall', 'r', -8.6, 0, 0.3);
            for (const x of [-7, 7]) P('money_counter', x, c(0, 2)[1], 0, { y: 1.18 });
            P('stock_ticker', c(0, 0)[0] - 0.65, c(0, 0)[1] + 0.05, 180, { y: 1.0 }); P('stock_ticker', c(5, 0)[0] - 0.65, c(5, 0)[1] + 0.05, 180, { y: 1.0 });
            P('floor_safe', -W2 + 0.75, -D2 + 0.75, 135); P('floor_safe', W2 - 0.75, -D2 + 0.75, 225);
            P('stone_urn', -10.0, D2 - 0.75, 0); P('stone_urn', 10.0, D2 - 0.75, 0);
            onWall('psx_painting_1', 'l', 3.5, 3.6, 0.05, { h: 1.8 }); onWall('psx_painting_1', 'r', 3.5, 3.6, 0.05, { h: 1.8 });
        },
        /* THE BANK OFFICES LOBBY: a teal-and-walnut corporate lobby. Pale walls, a walnut feature wall behind reception, a lit ceiling of panels,
           the curtain wall's daylight along the front; two cash machines and a water cooler by the waiting corner, armchairs facing its sofas,
           a copier and a shredder by the manager's desk, a keypad by the lifts. */
        'P10-01-B1': (T, A) => {
            const { H, W2, D2, c, P, onWall, lx } = A;
            A.liner({ wall: [U('PlasterWallPainted1a'), 0xe4eaec, 1.2], dado: ['calm_planks', 0x7a5638, 1.3], dh: 1.0, rail: ['calm_gunmetal', 0x2f6a6a], skirt: [null, 0x1e2a2c], crown: ['calm_gunmetal', 0x2f6a6a], ceil: [U('FibreCeilingTile1a'), 0xffffff, 0.9] });
            A.Q(quad(1.75, 0, -D2 + 0.29, 9.6, 4.6, 0, 'calm_planks', 0x6a4428, { kind: 'wall' }), box(1.75, 4.6, -D2 + 0.33, 9.8, 0.12, 0.12, 'calm_gunmetal', 0x2f6a6a));
            for (const x of A.X) for (const z of [-3.5, 3.5]) A.panel(x, z, 1.2, 1.2);
            for (const x of [-12.5, -9.2, 3.3, 6.6, 9.9, 13.2]) A.window_('f', x, 1.15, 2.6, 4.1, 0x1e3a3a, U('GlassWindowTall1a'));
            P('atm', 9.7, -D2 + 0.6, 180); P('atm', 11.2, -D2 + 0.6, 180); P('meshy_water_cooler', 12.8, -D2 + 0.5, 180);
            P('psx_armchair_1', 9.6, -0.95, 90); P('psx_armchair_1', 9.6, 0.95, 90);
            P('photocopier', -9.4, -D2 + 0.7, 180); P('paper_shredder', -4.9, -D2 + 0.55, 180);
            onWall('psx_keypad_1', 'l', 0, 1.3, 0.02);
            P('banker_lamp', 1.75 + 1.2, c(4, 0)[1], 180, { y: 1.13 });
        },
        /* THE VAULT ANNEX: cold steel and concrete. A gunmetal dado with a yellow stripe, a lit concrete ceiling, red beacons and cameras over
           the cage gate, a keypad on the cage, hazard paint on the threshold; deposit box walls on the back wall, sacks between the gold,
           a loaded cash cart beside the counting table, a counting machine on it, an old safe by the clerk. */
        'P11-01-B1': (T, A) => {
            const { H, W2, D2, c, P, onWall } = A, zc = c(0, 4)[1];
            A.liner({ dado: ['calm_gunmetal', 0x4a564e, 1.2], dh: 1.2, rail: [null, 0xe8b820], skirt: [null, 0x1a1c1e], ceil: ['calm_concrete', 0xc8ccd0, 0.75] });
            for (const x of [-5.25, 5.25, -12.6, 12.6]) onWall('deposit_box_wall', 'b', x, 0, 0.3);
            P('money_sacks', 0, -11.2, 180); P('money_sacks', -3.3, -11.3, 200);
            P('cash_cart', c(3, 2)[0], c(3, 2)[1], 90); I_solid(T, A, c(3, 2)[0] - 0.6, c(3, 2)[1], c(3, 2)[0] + 0.6, c(3, 2)[1], 0.7, 1.0);
            P('money_counter', c(4, 2)[0] + 0.45, c(4, 2)[1], 180, { y: 1.0 });
            P('floor_safe', W2 - 0.75, c(0, 5)[1] - 1.0, 270);
            P('security_camera', -W2 + 0.4, zc + 0.3, 135, { y: 2.6, mount: 0 }); P('security_camera', W2 - 0.4, zc + 0.3, 225, { y: 2.6, mount: 0 }); P('security_camera', -W2 + 0.4, -D2 + 0.4, 135, { y: 2.6, mount: 0 });
            P('psx_keypad_1', c(4, 4)[0] - 1.45, zc + 0.14, 180, { y: 1.3, mount: 0 });
            const gx = c(3, 4)[0]; A.Q(box(gx - 1.2, 2.6, zc + 0.16, 0.24, 0.2, 0.14, null, 0x2a2c30), box(gx - 1.2, 2.63, zc + 0.24, 0.16, 0.14, 0.04, null, 0xff3020, { glow: 1 }), box(gx + 1.2, 2.6, zc + 0.16, 0.24, 0.2, 0.14, null, 0x2a2c30), box(gx + 1.2, 2.63, zc + 0.24, 0.16, 0.14, 0.04, null, 0xff3020, { glow: 1 }));
            A.Q(quad(gx, 0.04, zc + 0.5, 3.3, 0.45, 0, U('SignHazard1a'), WHITE, { flat: true, uv: [0.9, 0.45], kind: 'over' }), quad(gx, 0.04, zc - 0.5, 3.3, 0.45, 0, U('SignHazard1a'), WHITE, { flat: true, uv: [0.9, 0.45], kind: 'over' }));
            for (const z of [-7, 0, 7]) { A.strip(-7, z, 3.0, false, 0xe8fff4); A.strip(7, z, 3.0, false, 0xe8fff4); }
        },
        /* THE TAXI DISPATCH: chequered yellow, the radio set beside the desk, the car keys on the wall, a cooler by the lockers, a lit ceiling */
        'P08-02-B1': (T, A) => {
            const { H, W2, D2, P, onWall } = A;
            A.liner({ wall: [U('PlasterWallPainted1a'), 0xf0dc90, 1.2], dado: ['calm_gunmetal', 0x2a2a2a, 1.0], dh: 1.1, rail: [U('TileGeneric1a'), 0xf2c200], skirt: [null, 0x111111], ceil: [U('FibreCeilingTile1a'), 0xfff8e8, 0.85] });
            P('radio_console', -W2 + 0.65, -D2 + 0.6, 180); onWall('key_rack', 'l', 0.4, 1.35, 0.12, { span: 1.0 }); P('meshy_water_cooler', W2 - 0.5, D2 - 0.9, 270);
            P('psx_walkie_talkie_2', -1.6, -D2 + 0.6, 180, { y: 1.0 }); onWall('wall_clock', 'b', 1.2, 2.3, 0.04);
            A.strip(0, 0, 2.4, false);
        },
        /* THE DRIVERS' STORE: bright and white, a red stripe, the newspaper rack by the door, a cash machine, coffee on the counter */
        'P08-02-B2': (T, A) => {
            const { H, W2, D2, c, P } = A;
            A.liner({ wall: [U('PlasterWallPainted1a'), 0xf4f2ec, 1.3], dado: ['calm_tiles', 0xffffff, 1.1], dh: 1.2, rail: [null, 0xe24a1c], skirt: [null, 0x30302e], crown: [null, 0xe24a1c], ceil: [U('FibreCeilingTile1a'), 0xffffff, 0.95] });
            P('newspaper_rack', -3.4, D2 - 0.6, 0); P('atm', 4.6, D2 - 0.65, 0);
            P('espresso_machine', c(4, 0)[0], c(4, 0)[1] + 0.7, 270, { y: 1.13 });
            for (const x of [-7, 0, 7]) A.strip(x, D2 - 1.0, 2.4, false);
        },
        /* THE INTELLIGENCE OFFICE: a dark operations room. Acoustic panels to the door head, a dim ceiling with cold strips, the situation table
           lit on the operations floor, the evidence board on the interview room's wall, the radio rack and the tape recorder by the console,
           monitors on the console, a bare lamp low over the interview table, red beacons over the gates, a shredder by the guard. */
        'P10-02-B1': (T, A) => {
            const { H, W2, D2, c, P } = A;
            A.liner({ dado: ['calm_gunmetal', 0x262a30, 1.0], dh: 2.3, rail: [null, 0x3a4a5a], skirt: [null, 0x111316], ceil: ['calm_concrete', 0x8a9098, 0.5] });
            const m = c(2, 0); P('map_table', m[0], m[1], 180); I_solid(T, A, m[0] - 1.1, m[1], m[0] + 1.1, m[1], 1.4, 0.95);
            A.Q(box(m[0], 2.0, m[1], 2.4, 0.06, 1.5, null, 0x1a1c20, { under: true }), box(m[0], 1.98, m[1], 2.0, 0.03, 1.1, null, 0xdff0ff, { glow: 1, under: true }), cyl(m[0], 2.06, m[1], 0.012, H - 2.06, null, IRON, { seg: 4, cap: false }));
            P('evidence_board', -3.05, c(1, 0)[1] - 1.0, 90);
            P('radio_console', 6.5, -D2 + 0.65, 180); P('reel_to_reel', 7.9, -D2 + 0.6, 180);
            for (const x of [-1.5, 0.6, 2.9, 5.0]) P('psx_pc_monitor_mp_1', x, -D2 + 0.9, 180, { y: 1.0 });
            P('psx_walkie_talkie_1', c(0, 2)[0] + 0.35, c(0, 2)[1] - 0.3, 270, { y: 1.0 }); P('paper_shredder', -W2 + 0.7, D2 - 0.9, 90);
            A.pend(c(0, 0)[0], c(0, 0)[1], 1.75, [null, 0x2a3a2a], 0xfff4d0, 0.26);
            for (const i of [1, 2]) A.Q(cyl(c(i, 1)[0], H - 0.3, c(i, 1)[1] + 1.2, 0.012, 0.3, null, IRON, { seg: 4, cap: false }), box(c(i, 1)[0], H - 0.5, c(i, 1)[1] + 1.2, 0.26, 0.2, 0.18, null, 0x2a2c30), box(c(i, 1)[0], H - 0.47, c(i, 1)[1] + 1.3, 0.18, 0.14, 0.04, null, 0xff2a1a, { glow: 1 }));
            for (const z of [0, 3.5]) { A.strip(-1.75, z, 2.6, false, 0xdfeeff); A.strip(1.75, z, 2.6, false, 0xdfeeff); }
            P('security_camera', W2 - 0.4, D2 - 0.4, 225, { y: 2.6, mount: 0 });
        },
        /* THE FINANCE ARCADE: a marble arcade. A rose-marble dado, gilt rails, a coffered lit ceiling; the ticker machine at the Exchange
           booth, a counting machine at Loans, the jewellery case and an old safe at the Pawn end, two cash machines on the end wall */
        'P08-03-B1': (T, A) => {
            const { H, W2, D2, c, P } = A, zb = -D2 + 0.24;
            A.liner({ wall: [U('PlasterWallStucco1a'), 0xf0e2c8, 1.25], dado: ['calm_marble', 0x9a6a5a, 1.1], dh: 1.1, rail: [GILT, WHITE, { gain: 1.4 }], skirt: ['calm_marble', 0x3a2420], crown: [GILT, WHITE, { gain: 1.3 }], ceil: [U('FibreCeilingTile1a'), 0xfff0dc, 0.9] });
            A.coffers('calm_marble', 0xe8dcc4, 1, 0.3);
            P('stock_ticker', c(1, 0)[0] - 0.9, zb + 0.32, 180, { y: 1.12 }); P('money_counter', c(2, 0)[0] - 0.8, zb + 0.32, 180, { y: 1.12 });
            P('jewelry_case', c(3, 0)[0], D2 - 0.75, 0); P('floor_safe', c(4, 0)[0] - 0.6, D2 - 0.65, 0);
            P('atm', W2 - 0.6, c(4, 0)[1] - 0.3, 270); P('atm', W2 - 0.6, c(4, 0)[1] + 1.2, 270);
            for (const x of [-3.5, 3.5]) { A.sconce('f', x, 2.3); }
        },
        /* THE PENTHOUSE STAIR LOBBY (columns 0-2; column 3 is the Halfdemon's bedroom): a lit ceiling, a wingback by the sofa, a painting */
        'P10-03-B1': (T, A) => {
            const { H, W, D, P, onWall } = A;
            A.Q(box(0, H - 0.05, 0, W - 0.6, 0.04, D - 0.6, U('FibreCeilingTile1a'), 0xfff0dc, { glow: 0.9, gain: 1.4, under: true, roof: true, top: false }));
            P('wingback_chair', -0.9, 1.0, 270); onWall('psx_painting_1', 'l', 0, 1.9, 0.05, { h: 0.9 });
        },
        /* THE PALM HOUSE: daylight through the glass roof, iron benches on the walk, a birdcage in the corner, urns at the pool */
        'P11-03-B1': (T, A) => {
            const { H, W, D, W2, D2, P } = A;
            A.Q(box(0, H - 0.05, 0, W - 0.6, 0.04, D - 0.6, U('GlassWindowFactory3a'), 0xeaf6ff, { glow: 0.8, under: true, roof: true, top: false, win: 'keep' }));
            for (let k = -3; k <= 3; k++) A.Q(box(k * 3.5, H - 0.3, 0, 0.12, 0.25, D - 0.7, null, 0x1e2a22, { under: true }));
            P('iron_garden_bench', -6.5, D2 - 0.75, 0); P('iron_garden_bench', 6.5, D2 - 0.75, 0); P('bird_cage', -W2 + 0.75, 0.2, 90);
            P('stone_urn', -3.0, -0.25, 180); P('stone_urn', 3.0, -0.25, 180);
        },
    };
    /* a ghost wall for a new blocker (the first pass's `solid`, in the building's frame) */
    const I_solid = (T, A, x0, z0, x1, z1, t, h) => A.solid(x0, z0, x1, z1, t, h);
    return (T, g, I, n0) => {
        const f = SECOND[T.id];
        if (f) { const A = Object.assign(kit(T, g, I), { solid: I.solid }); f(T, A); }
        if (process.env.DC_F_DUMP) { const q = T.rot * Math.PI / 180, c = Math.cos(q), s = Math.sin(q);
            const P = props.slice(n0).map(p => { const dx = p.x - T.x, dz = p.z - T.z; return { key: p.key, x: r3(dx * c + dz * s), z: r3(-dx * s + dz * c), face: ((p.face - T.rot) % 360 + 360) % 360 }; });
            require('fs').writeFileSync(process.env.DC_F_DUMP + '/' + T.id + '.json', JSON.stringify({ id: T.id, W: T.W, D: T.D, lx: T.lx, cw: T.cw, rot: T.rot, storeys: T.row.storeys, X: g.X, Z: g.Z, parts: I.Q.filter(Boolean), props: P })); }
    };
};
