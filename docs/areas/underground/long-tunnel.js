/* THE UNDERGROUND, THE LONG TUNNEL: the room design (world polish threads 7 + 9 + 10, 2026-11-20).
       node bake-underground.js long-tunnel
   The squares, the levels, the ladders, the cliffs, the pits and the ways out are the plan's: docs/plans/world-polish/plans/ug-long-tunnel.js
   (mondo's OK, 11-20; written by docs/plans/world-polish/underground/gen-district.py L). This file says what the room is called, where its
   doors lead, and what stands in it. It replaces the old corridor room `site_prebuilt_hollow_earth_ow_long` (ten plots in a line), retired to it.
   mondo 11-20: "This should be the most dungeon and labyrinth like ... we need victory road. labyrinth, height diffs, cliffs, drops waterfalls,
   underground horror like the descent movie". So: dark (ten lights in the whole room, most of them the lost team's), squeezes, bones, a nest,
   water you hear before you see. Plot names are plain (owner-rules: "simple names"). */
'use strict';
module.exports = {
    key: 'L', plan: 'docs/plans/world-polish/plans/ug-long-tunnel.js',
    room: 'site_prebuilt_hollow_earth_ug_long', site: 'prebuilt_hollow_earth', part: 'ug_long',
    label: 'THE LONG TUNNEL', sub: 'THE CAVE MAZE UNDER THE WOODS · AGARTHA ABOVE · THE WEST TUNNEL BELOW · A SIDE WAY TO THE TUNNEL-WAY',
    parti: 'A labyrinth of passages and chambers on fourteen levels between Agartha and the West Tunnel: ladders up, cliffs you only drop, pits with something in each, and the last camp of a caving team that never came out.',
    /* the underground's layout no longer sits exactly under the surface (mondo 11-20: "Yes that is okay"): 3 x 5 plots where the old corridor ran */
    world: { hub: 'cavern', layer: 'under', wx: -16, wy: -8 },
    seed: 11,
    names: {
        '1,0': 'The Great Chamber', '0,0': 'The Bone Pit', '2,0': 'The Squeeze',
        '0,1': 'The Black Pool', '1,1': 'The Crossing', '2,1': 'The East Hall',
        '0,2': 'The Nest', '1,2': 'The Old Camp', '2,2': 'The Drip Chamber',
        '0,3': 'The Sump Hall', '1,3': 'The Falls', '2,3': 'The Black Sump',
        '0,4': 'The Crystal Pocket', '1,4': 'The Low Hall', '2,4': 'The Last Chamber',
    },
    /* the plan's ways out, by side; ids are the seams the neighbours already carry */
    doors: {
        N: { id: 'ow_h_m15_m8', room: 'site_prebuilt_hollow_earth_ow_agartha', label: 'AGARTHA', sub: 'AGARTHA · THE TUNNEL UP' },
        S: { id: 'ow_h_m15_2', room: 'site_prebuilt_hollow_earth_ug_west', label: 'THE WEST TUNNEL', sub: 'THE WEST TUNNEL · THE TUNNEL DOWN' },
        E: { id: 'ug_tw_long', room: 'site_prebuilt_hollow_earth_ow_tunnelway', label: 'THE TUNNEL-WAY', sub: 'THE TUNNEL-WAY · EAST, AND UP' },   // the Tunnel-Way's labyrinth (bake-ug-tunnelway.js) keeps the other end
    },
    mood: { light: 0xffb070, ambient: 0.14, hero: false },
    vault: 1.75,
    /* the paint: 0 = the room's floor (hz_stone_02, the chambers), then the sheets below */
    pal: ['hz_stone_02', 'hz_stone_10', 'hz_stone_06'],   // dark cracked stone, rough red-brown rock, mineral stone: the horror pack's (no calm sheet; the new Cavern's palette; its mud `hz_floor_03` reads as yellow straw here)
    paint(ch, x, y, ctx) {
        if ((x >= 8 && x <= 9 && y >= 29 && y <= 30) || (x >= 30 && x <= 33 && y >= 51 && y <= 55)) return 2;   // the nest's pit, the den's corner: red-brown (the blood is the zone look's stains)
        if (ch === 'c' || ch === 'k') return 0;
        if (x >= 4 && x <= 6 && y >= 55 && y <= 57) return 3;                 // the crystal pocket
        const pit = ctx.branches.some(b => b.kind === 'dead end' && /pit/.test(b.to) && Math.abs(b.at[0] - x) <= 1 && Math.abs(b.at[1] - y) <= 1);
        return pit ? 2 : 1;
    },
    /* the drips over the Drip Chamber: a thin rain off its roof (no sound: the game has no water sound, and none may be generated) */
    air(ctx) { return { kind: 'none', zones: [{ x0: ctx.gx(27), z0: ctx.gz(27), x1: ctx.gx(33), z1: ctx.gz(33), kind: 'rain', color: 0x9aa8b0, n: 60, speed: 1 }] }; },
    dress(ctx) {
        const { rnd } = ctx;
        /* a blocker only on a free square; decor anywhere in the room (off centre) */
        const P = (key, x, y, o) => { if (!ctx.free(x, y)) throw new Error('long-tunnel: ' + key + ' on a square that is not free: ' + x + ',' + y); ctx.P(key, x, y, Object.assign({ face: Math.round(rnd() * 360) }, o || {})); };
        const d = (key, x, y, o) => ctx.dec(key, x, y, o);
        const up = (x, y, m) => ctx.y(x, y) + m;   // a prop's y is the room's metres: m over the floor there (a bat on the roof, a lamp on a ledge)
        const ROCKS = ['ocean_rock_7', 'ocean_rock_5', 'ocean_rock_6', 'ocean_rock_8', 'ocean_rock_9'];   // (not the Halloween pack's `hw_stone*`: they are headstones)
        const rubble = (sq, n) => { for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(rnd() * sq.length), 1)[0]; d(ROCKS[Math.floor(rnd() * ROCKS.length)], q[0], q[1], { h: Math.round((0.5 + rnd() * 0.7) * 100) / 100 }); } };
        const bones = (sq, n) => { for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(rnd() * sq.length), 1)[0]; d('hw_part' + (i % 4 ? '_' + (2 + (i % 8)) : ''), q[0], q[1]); } };

        /* ── THE GREAT CHAMBER (116): the way in from Agartha. Agartha's people keep one torch at the mouth; past it, a beast's bones and the dark ── */
        const k = [18, 6], parts = [];
        parts.push({ s: 'cyl', p: [0, 0, 0], r: 2.1, r2: 0.9, h: 5.5, seg: 9, key: 'hz_stone_02', tint: 0xe4e0d8, uv: 3.5 });
        parts.push({ s: 'cyl', p: [0, 5.5, 0], r: 0.9, r2: 0.12, h: 3.6, seg: 8, key: 'hz_stone_07', tint: 0xf0ece4, uv: 3.5 });
        parts.push({ s: 'cyl', p: [1.3, 0, 0.8], r: 0.9, r2: 0.15, h: 2.8, seg: 7, key: 'hz_stone_02', tint: 0xd6d2ca, uv: 3.5 });
        ctx.arch('stalagmite', k[0], k[1], parts); ctx.take(k[0], k[1]);
        /* lesser stalagmites round the chamber (drawn, the Cavern's rock kit) */
        [[15, 3, 2.2], [20, 8, 1.6], [14, 8, 2.8], [21, 3, 1.2]].forEach((q, i) => { ctx.arch('mite' + i, q[0], q[1], [{ s: 'cyl', p: [0, 0, 0], r: 0.7 + q[2] * 0.12, r2: 0.08, h: q[2], seg: 7, key: 'hz_stone_02', tint: 0xe4e0d8, uv: 3.5 }]); ctx.take(q[0], q[1]); });
        P('cave_torch', 19, 2);
        P('ocean_rock_3', 16, 8, { h: 2.6 }); d('ocean_rock_3', 20, 4, { h: 1.8 });   // blocks fallen from the vault
        bones([[16, 7], [17, 8], [15, 6]], 3);
        d('psx_cobweb_1', 17, 2); d('psx_cobweb_2', 14, 5);
        [[16, 4], [19, 5], [20, 7]].forEach((q, i) => d(['bat_black', 'bat_brown', 'bat_grey'][i], q[0], q[1], { y: up(q[0], q[1], 7.5 + i) }));
        rubble(ctx.walls(14, 2, 21, 9), 6);

        /* ── THE BONE PIT (114, its pit 112): something drags what it kills down here ── */
        P('skull_pile', 2, 6, { h: 1.1 }); d('skull_pile', 3, 6, { h: 0.8 }); bones([[2, 5], [3, 6], [2, 6], [3, 5], [4, 6], [5, 7]], 6);
        d('cattle_skull', 2, 5); d('hw_web', 2, 5, { y: up(2, 5, 2.2) });
        /* the secret at the dead end: the first of the team, his pack and his notes */
        d('hw_body_2', 4, 4, { jit: 0.3, face: 120 }); d('backpack', 5, 4, { face: 200 }); d('psx_notebook_1', 4, 4, { face: 30 });
        rubble(ctx.walls(4, 4, 11, 7), 3);

        /* ── THE SQUEEZE (107): boulders narrow the way south to one square, twice; the pit beside it goes nowhere ── */
        P('ocean_rock_3', 29, 8, { h: 2.4 }); P('rf_rock_3', 28, 10, { h: 2.6 });
        P('cave_stone', 33, 6, { h: 1.6 }); d('hw_web_2', 33, 5, { y: up(33, 5, 1.6) }); d('rope_coils', 32, 6); d('psx_flashlight_1', 32, 5);
        d('item_old_camera_flash', 28, 4, { face: 250 }); d('hw_part_6', 29, 4);   // the secret: the team's camera, its last pictures in it
        rubble(ctx.walls(28, 4, 31, 11), 4);

        /* ── THE BLACK POOL (110): a sump under the chamber's north wall; someone went in after something ── */
        P('lake_rock', 4, 14); P('lake_rock', 7, 14, { h: 1.2 });
        d('hw_body', 6, 14, { jit: 0.4, face: 10 }); d('meshy_rope', 5, 14, { face: 0 }); d('psx_fish_skeleton_mp_1', 8, 15);
        d('ocean_eel', 5, 12, { y: up(5, 12, 0.4) });
        rubble(ctx.walls(2, 14, 9, 21), 7);

        /* ── THE CROSSING (113): the team's cairn, their way-marker home ── */
        P('cairn', 19, 19); d('meshy_rope', 18, 18); rubble(ctx.walls(16, 16, 19, 19), 2);

        /* ── THE EAST HALL (110): an older mine came through here from the Tunnel-Way; its torch still burns at the side passage ── */
        P('cave_torch', 33, 16); P('mine_cart', 27, 20, { face: 90 }); P('psx_wooden_crate_1', 32, 20); d('psx_wooden_crate_2', 33, 21); d('pickaxe', 26, 19);
        P('ocean_rock_3', 28, 15, { h: 2.2 });   // a block fallen from the roof
        [[30, 16], [31, 18]].forEach((q, i) => d(i ? 'bat_grey' : 'bat_black', q[0], q[1], { y: up(q[0], q[1], 6.8) }));
        rubble(ctx.walls(26, 14, 33, 21), 6);

        /* ── THE NEST (106, its pit 104): dead brush dragged in, bones, black egg sacs and fresh meat; the crawlers' (the NPC places put them here) ── */
        P('psxg_dead_bush_1', 9, 30); d('psxg_dead_bush_2', 8, 30); P('skull_pile', 9, 29, { h: 0.9 });
        d('meshy_black_blob', 8, 30, { h: 0.6 }); d('meshy_black_blob', 9, 30, { h: 0.45 }); d('meshy_black_blob', 9, 29, { h: 0.5 });
        d('psx_meat_1', 8, 29); d('psx_meat_1_1', 9, 30); bones([[8, 29], [8, 30], [9, 29], [9, 30], [7, 30], [6, 31], [5, 29]], 7);
        d('hw_web', 4, 31, { y: up(4, 31, 2.4) }); d('hw_web_3', 7, 28, { y: up(7, 28, 2.4) }); d('psx_cobweb_4', 5, 28); d('spider', 6, 30, { h: 0.5 });
        d('woods_glowcap', 9, 29, { h: 0.5 }); d('woods_glowcap', 4, 30, { h: 0.4 });
        d('hw_body_2', 4, 28, { jit: 0.3, face: 300 }); d('psx_walkie_talkie_1', 5, 28);   // the secret: a caver, his radio still on
        rubble(ctx.walls(6, 32, 7, 35), 2);

        /* ── THE OLD CAMP (110, its pit 108): the lost team's last camp. A dying fire, a tent, bags; in the pit a stretcher and a grave ── */
        P('campfire', 18, 30); P('camping_tent', 19, 31, { face: 315 });
        d('sleeping_bag', 18, 31, { face: 90 }); d('sleeping_bag', 19, 30, { face: 170 }); d('backpack', 18, 28, { face: 30 }); d('kettle', 18, 30);
        d('psx_canned_food_mp_1', 18, 29); d('psx_canned_food_mp_2', 19, 28); d('psx_bandage_mp_1', 18, 31); d('item_flare_gun', 19, 28); d('rope_coils', 16, 31);
        d('stretcher', 21, 30, { jit: 0.2, face: 0 }); d('psxg_dirt_grave', 21, 29, { jit: 0.2, face: 0 }); d('ice_axe', 20, 29);

        /* ── THE DRIP CHAMBER (108): a dead end that rains from its roof; a caver lies under a skin of flowstone ── */
        d('decor_effigy_figure', 30, 30, { jit: 0, face: 80 }); d('moss_clump', 28, 31); d('moss_clump', 32, 28);
        [[27, 27, 1.8], [32, 32, 2.4], [27, 32, 1.4], [33, 27, 1.1], [31, 26, 2.0]].forEach((q, i) => { ctx.arch('drip' + i, q[0], q[1], [{ s: 'cyl', p: [0, 0, 0], r: 0.5 + q[2] * 0.12, r2: 0.06, h: q[2], seg: 7, key: 'hz_stone_02', tint: 0xd6d2ca, uv: 3.5 }]); ctx.take(q[0], q[1]); });
        rubble(ctx.walls(26, 26, 33, 33), 4);

        /* ── THE SUMP HALL (108): a lure glows in the black water ── */
        d('ocean_anglerfish_dim', 6, 46, { y: up(6, 46, 0.5) }); P('lake_rock', 4, 45); d('psx_flashlight_1', 7, 44); d('hw_part_8', 6, 44);
        rubble(ctx.walls(2, 38, 9, 45), 6);

        /* ── THE FALLS (110 > 105): the team fixed a rope at the lip and went down ── */
        d('rope_coils', 20, 46); d('meshy_rope', 19, 46, { face: 180 }); d('moss_clump', 18, 47); d('moss_clump', 16, 45); rubble(ctx.walls(16, 40, 19, 43), 2);

        /* ── THE BLACK SUMP (108, its pit 106 under black water) ── */
        ctx.feat({ k: 'stream', absY: true, pts: [[ctx.gx(33), ctx.gcz(41)], [ctx.gx(33), ctx.gcz(42)]], w: 7, y: ctx.y(32, 41) + 0.35, depth: 0.6, key: 'water', bank: 0.3 });
        d('psx_fish_skeleton_mp_1', 30, 43); d('hw_part_4', 28, 42); rubble(ctx.walls(28, 40, 31, 43), 3);

        /* ── THE CRYSTAL POCKET (103, its pit 101): the only clean light in the tunnel ── */
        P('crystal_cluster', 6, 57); d('meshy_crystal_shards', 6, 56); d('meshy_crystal_shard', 5, 57); d('meshy_crystal_shards', 7, 54, { h: 0.6 });
        d('hw_body_2', 4, 52, { jit: 0.3, face: 60 }); d('pickaxe', 5, 52);   // the secret: someone dug for the crystals and stayed

        /* ── THE LOW HALL (105): the foot of the falls. One of the team fell; his flare still burns. The way down to the West Tunnel ── */
        d('hw_body', 19, 50, { jit: 0.3, face: 200 }); d('item_flare_gun', 20, 51); d('light_glow', 20, 51); d('ice_axe', 18, 50);
        P('cave_torch', 17, 57); P('lake_rock', 21, 50); rubble(ctx.walls(14, 50, 21, 57), 7);

        /* ── THE LAST CHAMBER (108): the crawlers' den, the deep end ── */
        P('psxg_dead_bush_1', 32, 52); P('skull_pile', 33, 54, { h: 1.2 }); P('skull_pile', 31, 51); P('skull_pile', 27, 56, { h: 0.8 });
        d('meshy_black_blob', 32, 53, { h: 0.7 }); d('meshy_black_blob', 33, 53, { h: 0.5 }); d('meshy_black_blob', 31, 53, { h: 0.8 }); d('cattle_skull', 30, 52);
        d('psx_meat_1', 31, 52); bones([[29, 51], [30, 53], [32, 55], [28, 54], [31, 56], [33, 51], [26, 52], [29, 55]], 8);
        d('hw_web_2', 33, 50, { y: up(33, 50, 2.6) }); d('hw_web', 26, 57, { y: up(26, 57, 2.4) });
        d('woods_glowcap', 33, 51, { h: 0.6 }); d('woods_glowcap', 26, 55, { h: 0.45 }); d('woods_glowcap', 30, 57, { h: 0.5 });
        d('hw_body', 28, 51, { jit: 0.3, face: 250 });
        rubble(ctx.walls(26, 50, 33, 57), 5);
    },
};
