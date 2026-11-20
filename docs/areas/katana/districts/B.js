/* KATANA ISLAND, district B: KATANA BAY (the pilot; world polish thread 21, 2026-11-20). bake-katana.js runs build(ctx).
   The plan mondo saw (docs/plans/world-polish/thread21/bay-plan.png), laid square by square in ISLAND squares (x east, y south):
   the Waterfront x 12..23, y 48..59 · the West Quay x 0..11, y 60..71 · the Lantern Head x 0..11, y 72..83 · the East Quay x 24..35, y 60..71 ·
   the Fishing Beach x 24..35, y 72..83 · the bay's water x 12..23, y 60..83. 1 level = 1.75 m: sand 0, the stone quays 1, the head's rock 2 and 3.
   LEVEL ON PURPOSE: the Landing Square (x 13..22, y 52..59), both quays, the beach.
   PASS 1 = the ground, the eight buildings' outsides, the Great Gate, the boats and the first props. The insides are bare rooms with a few
   things; furnishing is pass 2. STAND-INS mondo named (11-20): roofs made in code (jroof), no model yet for the gate in the water (drawn here). */
'use strict';
const DARK = 0x3a2a1e, PLASTER = 0xf0ebe0, RED = 0xc23a22, STONE = 0x8d8a84, STRAW = 0xd2b060;
module.exports = {
    from: [17, 58],   // the pier's head on the Landing Square: where the boat sets you down
    reach: [[13, 51, 'the Harbour Office'], [20, 52, 'the Fish Market'], [8, 63, 'the Shipwright’s Shed'], [6, 68, 'the Net Loft'], [29, 63, 'the Rice Store'], [28, 65, 'the Harbour Inn'],
        [30, 75, 'the Fishermen’s Hut'], [6, 79, 'the Lantern Tower'], [30, 80, 'the Fishing Beach'], [9, 79, 'the small beach'], [17, 66, 'the pier’s end'], [27, 52, 'the Harbour Gate stair’s head'], [8, 55, 'the West Steps’ head']],
    build(ctx) {
        const { C, r2, rnd, gx, gz, WD, WD2, SHG, FLR, PLS, TILE } = ctx;
        /* ── THE GROUND ── */
        ctx.set(12, 48, 23, 59, 'q', 1); ctx.set(24, 57, 26, 59, 'q', 1);                                   // the Waterfront + the quay's corner under the Merchants' Town
        ctx.set(0, 60, 11, 71, 'q', 1, { dry: true }); ctx.set(24, 60, 35, 71, 'q', 1, { dry: true });     // the two quays
        ctx.set(24, 72, 35, 83, 's', 0, { dry: true });                                                    // the Fishing Beach: sand
        ctx.set(0, 72, 11, 83, 's', 0, { dry: true });                                                     // the head's foot: sand, then its rock
        ctx.set(7, 72, 10, 74, 'q', 1, { dry: true }); ctx.set(2, 72, 10, 76, 'r', 1, { dry: true }); ctx.set(1, 74, 6, 82, 'r', 2, { dry: true }); ctx.set(3, 78, 6, 81, 'r', 3, { dry: true });
        ctx.set(7, 72, 10, 73, 'q', 1, { dry: true });
        ctx.pier('main', 17, 60, 18, 66); ctx.pier('west', 12, 68, 15, 69); ctx.pier('east1', 20, 62, 23, 63); ctx.pier('east2', 20, 68, 23, 69);   // the pier and the three short ones: timber decks on piles
        ctx.set(10, 62, 12, 63, 's', 0);                                                                   // the slip: a ramp of sand into the bay
        /* ── THE STAIRS (real flights on whole squares) ── */
        ctx.stairs('gate', 23, 51, 26, 53, 'E', 1, 3); ctx.set(27, 51, 27, 53, 'q', 3);                     // the Harbour Gate stair: the main way up into the City
        ctx.stairs('west', 9, 55, 11, 56, 'W', 1, 4); ctx.set(8, 55, 8, 56, 'q', 4);                        // the West Steps
        ctx.stairs('head1', 6, 75, 7, 75, 'W', 1, 2); ctx.stairs('head2', 3, 76, 3, 77, 'S', 2, 3);         // the Lantern Head's two flights
        /* ── THE BUILDINGS: plaster over a dark timber frame, a curved tiled roof, a swinging door; the inside is the same squares ── */
        const house = (a, w, h, d, door, o) => { o = o || {};
            a.shell(w, h, d, o.wall || PLS, o.wallTint != null ? o.wallTint : PLASTER, door, [1.75, 1.75], o.plain && o.wall ? 1.2 : 2.1); if (!o.plain) a.timber(w, h, d, DARK); a.frame(door, d, WD2, DARK);
            if (!o.plain) { const n = Math.round(w / 1.75), bw = w / n; for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + 0.5) * bw; if (Math.abs(lx - door.lx) < bw * 0.6) continue; a.P.push({ s: 'quad', p: [r2(lx), 0.95, r2(d / 2 + 0.075)], size: [r2(bw - 0.5), 1.25], key: PLS, tint: 0xfff6dc, glow: 0.3, gain: 2.4 });
                a.box(lx, 0.95, d / 2 + 0.08, 0.05, 1.25, 0.03, WD2, DARK); a.box(lx, 1.55, d / 2 + 0.08, bw - 0.5, 0.05, 0.03, WD2, DARK); } }       // paper screens with a dark cross bar
            return a.jroof(h, w, d, o.roof || {}); };
        const A = ctx.building('office', [12, 48, 16, 51, 'S'], 3.4, {}, (a, w, d, door) => house(a, w, 3.4, d, door, { roof: { top: 'gable' } }));
        const B = ctx.building('market', [18, 48, 23, 51, 'S'], 3.8, { leafDouble: true }, (a, w, d, door) => { house(a, w, 3.8, d, door, { roof: { top: 'gable', over: 1.6 } });
            for (const sx of [-1, 1]) a.cyl(sx * (w / 2 - 0.3), 0, d / 2 + 1.5, 0.14, 3.6, WD2, DARK, { seg: 8 }); });                                    // two posts under the deep front eave
        const Cb = ctx.building('shipwright', [3, 61, 8, 65, 'E'], 5.2, { leafDouble: true }, (a, w, d, door) => house(a, w, 5.2, d, door, { wall: WD, wallTint: 0x8a6a48, plain: true, roof: { top: 'gable', tint: 0x4a4038, over: 1.0 } }));
        const D = ctx.building('netloft', [3, 67, 6, 70, 'E'], 5.0, {}, (a, w, d, door) => { house(a, w, 5.0, d, door, { roof: { top: 'gable' } }); a.box(0, 2.5, d / 2 + 0.07, w + 0.24, 0.2, 0.1, WD2, DARK); });
        const E = ctx.building('ricestore', [28, 60, 32, 63, 'S'], 4.2, {}, (a, w, d, door) => { house(a, w, 4.2, d, door, { plain: true, roof: { top: 'hip', over: 0.7 } });
            a.box(0, 0, 0, w + 0.3, 1.1, d + 0.3, PLS, 0x3c4048, { top: false, uv: [1.75, 1.75] }); });                                                 // a store house: white walls on a dark foot band
        const Fb = ctx.building('inn', [27, 66, 31, 70, 'N'], 5.6, { leafDouble: true }, (a, w, d, door) => { house(a, w, 5.6, d, door, { roof: { top: 'gable', over: 1.5 } });
            a.box(0, 2.8, d / 2 + 0.07, w + 0.24, 0.22, 0.1, WD2, DARK);                                                                                   // the upper floor's beam
            a.roof('shed', 0, 2.75, d / 2 + 0.8, w * 0.6, 0.5, 1.5, TILE, 0x5a6676, { ry: 180 }); for (const sx of [-1, 1]) a.cyl(sx * w * 0.28, 0, d / 2 + 1.45, 0.1, 2.75, WD2, DARK, { seg: 8 }); });   // a porch roof over the door on two posts
        const Hh = ctx.building('hut', [31, 74, 34, 76, 'W'], 2.6, {}, (a, w, d, door) => { a.shell(w, 2.6, d, WD, 0x9a7a52, door, [1.75, 1.75]); a.frame(door, d, WD2, DARK);
            a.roof('gable', 0, 2.6, 0, w + 1.6, 2.0, d + 1.6, SHG, STRAW, { gain: 1.7, uv: [1.2, 1.2] }); a.box(0, 2.44, 0, w + 1.7, 0.16, d + 1.7, SHG, 0xb89448, { top: false, roof: true, gain: 1.6 }); });   // thatch
        const T = ctx.building('lantern', [4, 79, 6, 81, 'E'], 7.5, {}, (a, w, d, door) => { a.shell(w, 5.2, d, PLS, STONE, door, [1.75, 1.75], 1.6); a.frame(door, d, WD2, DARK);
            a.box(0, 0, 0, w + 0.8, 1.4, d + 0.8, PLS, 0x77746e, { top: true, uv: [1.75, 1.75], faces: 'blr' });                                          // the stone foot (open at the door's side)
            a.jroof(5.2, w, d, { top: 'hip', over: 0.9, skirt: 0.5, rise: 0.35 });                                                                         // a skirt roof under the fire room
            a.box(0, 5.75, 0, w * 0.62, 1.5, d * 0.62, PLS, 0xffd27a, { glow: 1.1 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.cyl(sx * w * 0.33, 5.7, sz * d * 0.33, 0.1, 1.6, WD2, DARK, { seg: 6 });   // the fire room: a lit box between four posts
            a.jroof(7.3, w * 0.7, d * 0.7, { top: 'pyramid', over: 0.8 }); });
        /* ── THE GREAT GATE in the water: the boat sails through it (drawn: no model in the game yet) ── */
        ctx.look('greatgate', 18, 78.5, 0, a => { const HP = 11, SP = 6.2;
            for (const sx of [-1, 1]) { a.cyl(sx * SP, -3, 0, 0.62, HP + 3, PLS, RED, { gain: 2.2, r2: 0.5, seg: 12, uv: [1.2, 1.2] }); a.cyl(sx * SP, -3, 0, 0.8, 3.6, PLS, 0x2a2a2e, { seg: 12 });                      // the two posts, their feet dark where the tide runs
                for (const sz of [-1, 1]) { a.cyl(sx * SP, -3, sz * 2.4, 0.3, 7.2, PLS, RED, { gain: 2.2, seg: 8 }); a.box(sx * SP, 2.6, sz * 1.2, 0.3, 0.3, 2.4, PLS, RED, { gain: 2.2 }); } }                                          // the four side legs and their ties
            a.box(0, HP - 2.6, 0, SP * 2 + 2.2, 0.7, 0.6, PLS, RED, { gain: 2.2 }); a.box(0, HP - 1.9, 0, 0.9, 1.5, 0.3, PLS, 0x2a2a2e);                                                                                     // the tie beam and the plate over it
            /* the top beam, curved with math: nine pieces on y = k x squared, so its ends lift */
            const n = 9, L = SP * 2 + 5.4; for (let i = 0; i < n; i++) { const x = -L / 2 + (i + 0.5) * L / n, lift = 0.9 * Math.pow(Math.abs(x) / (L / 2), 2.2);
                a.box(x, HP - 0.5 + lift, 0, L / n + 0.04, 0.75, 0.9, PLS, RED, { gain: 2.2 }); a.box(x, HP + 0.25 + lift, 0, L / n + 0.04, 0.3, 1.5, PLS, 0x2a2a2e, { roof: true }); } }, 0);
        /* ── THE FIRST PROPS (pass 1; every one a model the game already has) ── */
        ctx.P('stone_lantern', 15, 59); ctx.P('stone_lantern', 19, 59); ctx.P('stone_lantern', 13, 52); ctx.P('stone_lantern', 27, 54, { y: 0 }); ctx.P('stone_lantern', 7, 72);
        ctx.P('market_stall', 14, 53, { face: 90 }); ctx.P('market_stall', 20, 58, { face: 180 }); ctx.P('market_stall', 14, 58, { face: 90 });
        ctx.P('taiko_drum', 19, 53); ctx.P('bell_frame', 12, 51, { face: 0 }); ctx.P('lantern_post', 27, 63); ctx.P('lantern_post', 33, 63); ctx.P('lantern_post', 9, 60); ctx.P('lantern_post', 24, 71);
        ctx.P('hand_cart', 33, 61, { face: 200 }); ctx.P('wooden_barrel', 32, 63); ctx.P('wooden_barrel', 33, 64, { y: 0 }); ctx.P('fishing_net_wall', 7, 70, { face: 90 }); ctx.P('ship_anchor', 2, 66, { face: 30 });
        ctx.P('drying_fish', 27, 74, { face: 0 }); ctx.P('drying_fish', 32, 78, { face: 90 }); ctx.P('drying_fish', 34, 79, { face: 0 }); ctx.P('meshy_rowboat', 27, 77, { face: 70 }); ctx.P('meshy_rowboat', 31, 80, { face: 110 });
        ctx.P('firewood_stack', 34, 74, { face: 90 }); ctx.P('campfire', 30, 78);
        [[18.5, 51.5, 'woven_baskets'], [19.4, 51.6, 'woven_baskets'], [23.3, 50.4, 'wooden_barrel'], [16.5, 51.6, 'psx_wooden_crate_1'], [9.4, 61.2, 'rope_coils'], [9.5, 66.4, 'lobster_traps'], [2.6, 62.2, 'rope_coils'],
            [25.6, 61.4, 'wooden_barrel'], [25.5, 66.5, 'rope_coils'], [26.6, 70.5, 'woven_baskets'], [8.6, 64.6, 'oars'], [25.4, 73.4, 'oars'], [33.4, 76.6, 'fishing_rod'], [28.5, 79.5, 'woven_baskets']].forEach(q => ctx.at(q[2], q[0], q[1], { face: Math.round(rnd() * 360) }));
        [[17.15, 66.5], [18.85, 62.5], [11.6, 61.2], [11.6, 66.2], [24.4, 61.2], [24.4, 66.2], [15.6, 68.15], [20.4, 62.15]].forEach(q => ctx.at('mooring_bollard', q[0], q[1], {}));
        ctx.afloat('fishing_boat', 14.5, 64.5, { face: 0 }); ctx.afloat('dock_boat', 21.5, 65.8, { face: 180 }); ctx.afloat('meshy_rowboat', 13.5, 70.6, { face: 90 }); ctx.afloat('meshy_rowboat', 21.5, 61.2, { face: 90 });
        ctx.afloat('meshy_rowboat', 21.6, 70.7, { face: 270 }); ctx.afloat('fishing_boat', 15, 75, { face: 200 }); ctx.afloat('sea_buoy', 13.2, 80, {}); ctx.afloat('sea_buoy', 22.8, 80, {});
        for (let i = 0; i < 6; i++) ctx.dec('seagull', 25 + Math.floor(rnd() * 10), 76 + Math.floor(rnd() * 6)); for (let i = 0; i < 5; i++) ctx.dec('ocean_crab', 8 + Math.floor(rnd() * 3), 78 + Math.floor(rnd() * 4));
        /* a few trees where there is sand to stand in (trees never on stone) */
        ctx.tree('tree_56', 35, 73, 7); ctx.tree('tree_56', 34, 72, 6); ctx.tree('cherry', 35, 76, 6); ctx.tree('cherry_2', 25, 82, 5.5); ctx.tree('tree_56', 10, 82, 6);
        /* ── a first few things inside (pass 2 furnishes) ── */
        ctx.put(A, 'psx_coffee_table_1', 0, -1.5, { face: 0 }); ctx.put(A, 'psx_pillow_mp_1', -1.2, -1.5, {}); ctx.put(A, 'psx_pillow_mp_1', 1.2, -1.5, {});
        ctx.put(B, 'woven_baskets', -5, -2, { face: 20 }); ctx.put(B, 'wooden_barrel', 4, -2.5, { face: 200 }); ctx.put(B, 'woven_baskets', 0, -3.2, {});
        ctx.put(Cb, 'dock_boat', 0, -1, { face: 90 }); ctx.put(Cb, 'anvil', 5, -5, {}); ctx.put(D, 'rope_coils', -2, -2, {}); ctx.put(D, 'fishing_net_wall', 0, -4, { face: 0 });
        ctx.put(E, 'wooden_barrel', -4, -3, {}); ctx.put(E, 'wooden_barrel', -2.8, -3.2, {}); ctx.put(E, 'psx_wooden_crate_1', 3, -3, {});
        ctx.put(Fb, 'psx_coffee_table_1', -3, -2, {}); ctx.put(Fb, 'psx_coffee_table_1', 3, -2, {}); ctx.put(Fb, 'stock_pots', 4, -5, {}); ctx.put(Fb, 'privacy_screen', -4, -5, { face: 0 });
        ctx.put(Hh, 'psx_old_mattress_mp_1', -2, -1.5, {}); ctx.put(Hh, 'fishing_rod', 3, -2, {});
        /* ── people (units the game has; none on a way) ── */
        [['chef', 20, 53, 180], ['farmer', 15, 54, 90], ['samurai slug', 14, 59, 0], ['ninja', 33, 66, 270], ['monk', 8, 73, 90]].forEach(q => { ctx.take(q[1], q[2]); ctx.npc.push({ x: ctx.mx(q[1]), z: ctx.mz(q[2]), face: q[3], race: q[0] }); });
        void C; void gx; void gz; void T; void FLR;
    },
};
