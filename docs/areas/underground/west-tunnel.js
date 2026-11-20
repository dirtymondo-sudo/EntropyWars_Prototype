/* THE UNDERGROUND, THE WEST TUNNEL: the room design (world polish threads 7 + 9 + 10, 2026-11-20; mondo on the Long Tunnel pilot: "okay looks good contineu").
       node bake-underground.js west-tunnel
   The squares, levels, ladders, cliffs, pits and ways out are the plan's: docs/plans/world-polish/plans/ug-west-tunnel.js (mondo's OK, 11-20). This
   file names the room, its doors, its light and what stands in it. It replaces the old corridor room `site_prebuilt_hollow_earth_ow_west`.
   THE STORY IN THE ROCK: the caving team of the Long Tunnel came down the ESTATE'S WELL (link `well_skinwalker`, the boarded well in the yard) into
   the Well Bottom, made their first camp here, and went on north and up into the Long Tunnel, where their last camp is. Their marks are on the
   way: rope, a cold fire ring, a cairn. The crawlers came the other way. Horror sheets only (mondo 11-20: "don't use those calm textures"). */
'use strict';
module.exports = {
    key: 'W', plan: 'docs/plans/world-polish/plans/ug-west-tunnel.js',
    room: 'site_prebuilt_hollow_earth_ug_west', site: 'prebuilt_hollow_earth', part: 'ug_west',
    label: 'THE WEST TUNNEL', sub: 'THE CAVE MAZE UNDER THE ESTATE · THE WELL · THE LONG TUNNEL ABOVE · THE CAVERN BELOW',
    parti: 'A labyrinth on eighteen levels under the Estate: the old well comes down into it, the Long Tunnel is up its north passage and the Cavern down its east one; a caving team made its first camp here.',
    /* the underground's layout: the West Tunnel lies under the Long Tunnel, one plot west */
    world: { hub: 'cavern', layer: 'under', wx: -17, wy: -3 },
    seed: 23,
    names: {
        '0,0': 'The Charnel Pit', '1,0': 'The Crystal Crack', '2,0': 'The Upper Chamber', '3,0': 'The Cold Hall',
        '0,1': 'The Well Bottom', '1,1': 'The First Camp', '2,1': 'The Narrows', '3,1': 'The Drip Gallery',
        '0,2': 'The Drowned Floor', '1,2': 'The Ledge', '2,2': 'The Black Sump', '3,2': 'The Low Gallery',
    },
    /* the plan's ways out by index: 0 the Long Tunnel (N), 1 the Cavern (E), 2 the Estate's well (in the Well Bottom) */
    doors: {
        0: { id: 'ow_h_m15_2', room: 'site_prebuilt_hollow_earth_ug_long', label: 'THE LONG TUNNEL', sub: 'THE LONG TUNNEL · THE TUNNEL UP' },
        1: { id: 'ug_cavern_west', room: 'site_prebuilt_hollow_earth_ug_cavern', label: 'THE CAVERN', sub: 'THE CAVERN · THE PASSAGE EAST, AND DOWN', desc: 'The air comes up warm from the east.' },
        2: { link: 'well_skinwalker', end: 'b', face: 180 },
    },
    mood: { light: 0xffb070, ambient: 0.14, hero: false },
    vault: 1.75,
    pal: ['hz_stone_02', 'hz_stone_10', 'hz_stone_06'],   // dark cracked stone, rough red-brown rock, mineral stone (the horror pack's; the Long Tunnel's + the Cavern's)
    paint(ch, x, y, ctx) {
        if (x >= 20 && x <= 21 && y >= 5 && y <= 6) return 3;                                   // the crystal crack
        if ((x >= 2 && x <= 3 && y >= 17 && y <= 18) || (x >= 40 && x <= 45 && y >= 29 && y <= 33)) return 2;   // the nest, the den
        if (ch === 'c' || ch === 'k') return 0;
        const pit = ctx.branches.some(b => b.kind === 'dead end' && /pit/.test(b.to) && Math.abs(b.at[0] - x) <= 1 && Math.abs(b.at[1] - y) <= 1);
        return pit ? 2 : 0;
    },
    /* the drips over the Drip Gallery */
    air(ctx) { return { kind: 'none', zones: [{ x0: ctx.gx(39), z0: ctx.gz(15), x1: ctx.gx(45), z1: ctx.gz(21), kind: 'rain', color: 0x9aa8b0, n: 60, speed: 1 }] }; },
    lines: [],
    dress(ctx) {
        const { rnd } = ctx;
        const P = (key, x, y, o) => { if (!ctx.free(x, y)) throw new Error('west-tunnel: ' + key + ' on a square that is not free: ' + x + ',' + y); ctx.P(key, x, y, Object.assign({ face: Math.round(rnd() * 360) }, o || {})); };
        const d = (key, x, y, o) => ctx.dec(key, x, y, o);
        const up = (x, y, m) => ctx.y(x, y) + m;
        const ROCKS = ['ocean_rock_7', 'ocean_rock_5', 'ocean_rock_6', 'ocean_rock_8', 'ocean_rock_9'];
        const rubble = (sq, n) => { for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(rnd() * sq.length), 1)[0]; d(ROCKS[Math.floor(rnd() * ROCKS.length)], q[0], q[1], { h: Math.round((0.5 + rnd() * 0.7) * 100) / 100 }); } };
        const bones = (sq, n) => { for (let i = 0; i < n && sq.length; i++) { const q = sq.splice(Math.floor(rnd() * sq.length), 1)[0]; d('hw_part' + (i % 4 ? '_' + (2 + (i % 8)) : ''), q[0], q[1]); } };
        const mite = (id, x, y, h, key) => { ctx.arch(id, x, y, [{ s: 'cyl', p: [0, 0, 0], r: 0.5 + h * 0.12, r2: 0.07, h, seg: 7, key: key || 'hz_stone_02', tint: 0xe4e0d8, uv: 3.5 }]); ctx.take(x, y); };
        /* a boulder on one lane of a two-wide passage of plot (bx, by): a squeeze (the tool's walk check refuses one that cuts the way) */
        const squeeze = (bx, by, key, h) => { const ox = bx * 12, oy = by * 12, lv = ctx.lvl(ox + 6, oy + 6);
            for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const x = ox + i, y = oy + j; if (!ctx.free(x, y) || ctx.T[y][x] !== 'g' || ctx.lvl(x, y) !== lv) continue;
                const lane = [[1, 0], [-1, 0]].some(([a]) => ctx.open(x + a, y) && ctx.open(x, y + 1) && ctx.open(x, y - 1) && !ctx.open(x - a, y)) || [[0, 1], [0, -1]].some(([, b]) => ctx.open(x, y + b) && ctx.open(x + 1, y) && ctx.open(x - 1, y) && !ctx.open(x, y - b));
                if (lane && (i > 1 && i < 10 || j > 1 && j < 10) && !(i >= 4 && i <= 7 && j >= 4 && j <= 7)) { P(key, x, y, { h }); return; } } };

        /* ── THE UPPER CHAMBER (100): the way down from the Long Tunnel; the stalagmite you see from the passage; a torch at the mouth ── */
        const k = [30, 6];
        ctx.arch('stalagmite', k[0], k[1], [{ s: 'cyl', p: [0, 0, 0], r: 1.8, r2: 0.8, h: 4.8, seg: 9, key: 'hz_stone_02', tint: 0xe4e0d8, uv: 3.5 },
            { s: 'cyl', p: [0, 4.8, 0], r: 0.8, r2: 0.1, h: 3.2, seg: 8, key: 'hz_stone_07', tint: 0xf0ece4, uv: 3.5 }, { s: 'cyl', p: [-1.2, 0, 0.9], r: 0.8, r2: 0.12, h: 2.4, seg: 7, key: 'hz_stone_02', tint: 0xd6d2ca, uv: 3.5 }]);
        ctx.take(k[0], k[1]);
        P('cave_torch', 28, 2); mite('um0', 27, 8, 2.2); mite('um1', 33, 3, 1.4);
        P('ocean_rock_3', 32, 8, { h: 2.2 }); d('cairn', 31, 2, { jit: 0.4, h: 0.9 });   // the team's cairn at the top of the way down
        [[28, 5], [32, 4]].forEach((q, i) => d(i ? 'bat_grey' : 'bat_black', q[0], q[1], { y: up(q[0], q[1], 7.2 + i) }));
        rubble(ctx.walls(26, 2, 33, 9), 6);

        /* ── THE COLD HALL (98): the passage east and down to the Cavern; a torch at it; a dead caver with the end of a rope ── */
        P('cave_torch', 45, 5); mite('cm0', 39, 3, 1.8); mite('cm1', 44, 9, 2.6);
        d('hw_body_2', 40, 7, { jit: 0.3, face: 70 }); d('meshy_rope', 41, 7); d('psx_flashlight_1', 40, 8);
        rubble(ctx.walls(38, 2, 45, 9), 6);

        /* ── THE CHARNEL PIT (87, its pit 85) ── */
        P('skull_pile', 6, 2, { h: 1.0 }); d('skull_pile', 5, 2, { h: 0.7 }); bones([[5, 2], [6, 3], [5, 3], [4, 5], [6, 6], [7, 4]], 6); d('cattle_skull', 6, 3);
        d('hw_web', 6, 2, { y: up(6, 2, 2.2) }); rubble(ctx.walls(4, 4, 11, 7), 3);

        /* ── THE CRYSTAL CRACK (89, its pit 87): the one clean light on this side ── */
        P('crystal_cluster', 21, 6); d('meshy_crystal_shards', 21, 5); d('meshy_crystal_shard', 20, 6); d('meshy_crystal_shards', 18, 4, { h: 0.5 });
        rubble(ctx.walls(16, 4, 19, 7), 2);

        /* ── THE WELL BOTTOM (85): the Estate's boarded well comes down here (its square is left clear); its boards lie broken under it, its
           bucket, the team's rope. The pit beside it is a nest (the antpeople's: data.js HQ_NPC_PLACES) ── */
        d('psx_beam_1', 5, 17, { face: 30 }); d('psx_beam_2', 6, 16, { face: 110 }); d('wooden_bucket', 5, 16); d('rope_coils', 6, 18); d('meshy_rope', 4, 17, { face: 0 });
        d('psxg_dead_bush_1', 2, 18); d('meshy_black_blob', 3, 17, { h: 0.55 }); d('meshy_black_blob', 2, 17, { h: 0.4 }); d('psx_meat_1', 3, 18);
        bones([[2, 17], [3, 18], [7, 19], [6, 19]], 4); d('hw_web_2', 2, 18, { y: up(2, 18, 2.2) }); d('woods_glowcap', 3, 18, { h: 0.45 });

        /* ── THE FIRST CAMP (91, its pit 89): where the team slept the first night down; the fire is long cold ── */
        P('meshy_campfire_ring', 18, 18); d('sleeping_bag', 17, 19, { face: 80 }); d('sleeping_bag', 19, 17, { face: 200 }); d('backpack', 16, 16, { face: 40 });
        d('psx_canned_food_mp_3', 18, 17); d('psx_canned_food_mp_1', 17, 18); d('kettle', 19, 18); d('psx_notebook_1', 16, 19); d('item_walkie_talkie', 19, 19);
        d('hw_part_5', 21, 18); d('psxg_dirt_grave', 21, 17, { jit: 0.2, face: 90 });   // the pit: the first one they buried
        rubble(ctx.walls(16, 16, 19, 19), 2);

        /* ── THE NARROWS (95, its pit 93): boulders choke the passages; the pit goes nowhere ── */
        squeeze(2, 1, 'ocean_rock_3', 2.4); squeeze(2, 1, 'rf_rock_3', 2.4);
        P('cave_stone', 26, 18, { h: 1.6 }); d('psx_cobweb_1', 27, 17); d('hw_web_3', 26, 17, { y: up(26, 17, 1.8) });
        rubble(ctx.walls(28, 16, 31, 19), 3);

        /* ── THE DRIP GALLERY (96): it rains from the roof; a caver lies under a skin of flowstone ── */
        d('decor_effigy_figure', 42, 18, { jit: 0, face: 10 }); d('moss_clump', 39, 15); d('moss_clump', 44, 20); d('moss_clump', 41, 21);
        mite('dm0', 39, 19, 2.0); mite('dm1', 44, 15, 1.5); mite('dm2', 45, 18, 2.4); mite('dm3', 38, 16, 1.2);
        rubble(ctx.walls(38, 14, 45, 21), 4);

        /* ── THE DROWNED FLOOR (83, the bottom): under the Ledge's cliff; one of them came off it. A lure glows in the sump ── */
        d('hw_body', 7, 27, { jit: 0.3, face: 250 }); d('item_flare_gun', 8, 28); d('light_glow', 8, 28); d('ice_axe', 6, 27);
        d('ocean_anglerfish_dim', 5, 34, { y: up(5, 34, 0.5) }); P('lake_rock', 4, 33); P('lake_rock', 7, 33, { h: 1.1 }); d('psx_fish_skeleton_mp_1', 6, 32);
        rubble(ctx.walls(2, 26, 9, 33), 6);

        /* ── THE LEDGE (93): the cliff's lip; a ladder that did not reach, a rope cut short ── */
        d('wooden_ladder', 15, 27, { face: 90, y: up(15, 27, 0.1) }); d('rope_coils', 14, 28); d('meshy_rope', 15, 26);
        mite('lm0', 20, 31, 1.9); P('ocean_rock_3', 19, 26, { h: 1.9 }); rubble(ctx.walls(14, 26, 21, 33), 6);

        /* ── THE BLACK SUMP (93, its pit 91 under wading black water) ── */
        ctx.feat({ k: 'stream', absY: true, pts: [[ctx.gx(30), ctx.gcz(32)], [ctx.gx(30), ctx.gcz(33)]], w: 7, y: ctx.y(29, 32) + 0.35, depth: 0.6, key: 'water', bank: 0.3 });
        d('hw_part_4', 30, 31); d('psx_fish_skeleton_mp_1', 28, 29); rubble(ctx.walls(28, 28, 31, 31), 2);

        /* ── THE LOW GALLERY (91): the crawlers' den on this side ── */
        P('skull_pile', 44, 30, { h: 1.1 }); P('psxg_dead_bush_1', 43, 32); P('skull_pile', 39, 27, { h: 0.8 });
        d('meshy_black_blob', 44, 31, { h: 0.7 }); d('meshy_black_blob', 42, 32, { h: 0.5 }); d('meshy_black_blob', 45, 32, { h: 0.6 }); d('psx_meat_1_1', 43, 30);
        bones([[41, 29], [42, 31], [40, 32], [45, 29], [38, 30], [41, 33], [44, 33]], 7);
        d('hw_web', 45, 27, { y: up(45, 27, 2.6) }); d('woods_glowcap', 45, 30, { h: 0.6 }); d('woods_glowcap', 40, 33, { h: 0.45 }); d('hw_body', 39, 31, { jit: 0.3, face: 120 });
        rubble(ctx.walls(38, 26, 45, 33), 4);
    },
};
