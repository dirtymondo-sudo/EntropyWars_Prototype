/* THE UNDERGROUND, THE TUNNEL-WAY: WHAT STANDS IN THE ROOM (2026-11-20, world polish threads 7 + 9 + 10, the Tunnel-Way's build thread).
   Read by bake-ug-tunnelway.js, in the room's own squares (x 0..59 west to east, y 0..59 north to south; the plan's squares,
   docs/plans/world-polish/plans/ug-tunnel-way.js). The tool lays the ground, the rock, the roofs, the ladders and the sumps from the plan;
   this file names the places and dresses them. Notes: docs/notes/areas-complexes.md "THE UNDERGROUND, THE TUNNEL-WAY".
   mondo 11-20: "underground horror like the descent movie"; the build brief: "dark, squeezes, bones, a nest, water noise".

   THE PILOT (11-20) dresses THE NORTH THIRD, plot rows 0 and 1 (squares y 0..23): the Catacombs' join (the Ossuary Gate), the Bone Passage, the
   shaft from Dead Man's Cave, the Nest, the dead expedition's camp in its pit, the crystal pocket, the weeping halls. The rest of the room stands as
   the plan's bare skeleton with one unlit torch a chamber, until mondo has seen the pilot. THE LIGHTS: the room's ten real lights all go to the
   pilot (row order); the skeleton's torches only glow. */
'use strict';
const PILOT_Y = 24;   // the pilot's rows: squares y < 24
const NAMES = {
    '0,0': 'The Weeping Hall', '1,0': 'The Nest', '2,0': 'The Ossuary Gate', '3,0': 'The Low Hall', '4,0': 'The Cold Hall',
    '0,1': 'The Black Sump', '1,1': 'The Shaft', '2,1': 'The Bone Passage', '3,1': 'The Crawl', '4,1': 'The Crystal Pocket',
    '0,2': 'The Great Chamber', '1,2': 'The Tunnel-Way 1,2', '2,2': 'The Tunnel-Way 2,2', '3,2': 'The Tunnel-Way 3,2', '4,2': 'The Cells Tunnel',
    '0,3': 'The Tunnel-Way 0,3', '1,3': 'The Tunnel-Way 1,3', '2,3': 'The Tunnel-Way 2,3', '3,3': 'The Tunnel-Way 3,3', '4,3': 'The Tunnel-Way 4,3',
    '0,4': 'The Tunnel-Way 0,4', '1,4': 'The Tunnel-Way 1,4', '2,4': 'The Way Down', '3,4': 'The Tunnel-Way 3,4', '4,4': 'The Tunnel-Way 4,4' };
/* the ground sheets: 1 = loose dirt, 2 = wet dark rock (round the sumps), 3 = cut stone (the Catacombs' end), 4 = flesh (the Nest) */
const PAL = ['dirt_2', 'rocks_dark_fantasy', 'dungeon_2', 'flesh_2'];

module.exports = {
    parti: 'A labyrinth cut in the rock under Dead Man\'s Cave: low passages that bend at every turn, halls where a fight fits, ladders and ropes where the floor steps, cliffs you only go down, pits with something in them, and the dark. It is entered at its top, from the Catacombs, and goes down as you go in, to the Cavern.',
    ambient: 0.14, fog: 0.014,
    spawn: [29, 5], spawnFace: 180,
    names: NAMES,
    palette: PAL,
    paint(a, x, y) {
        if (a.rock(x, y)) return 0;
        if (y < PILOT_Y && x >= 14 && x <= 21 && y >= 2 && y <= 9) return 4;                           // the Nest's floor
        if (x >= 26 && x <= 33 && y <= 15) return 3;                                                     // the Ossuary Gate + the Bone Passage: cut stone
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (a.water(x + dx, y + dy)) return 2;   // wet rock round a sump
        return ((x * 7 + y * 13) % 5 === 0) ? 1 : 0;
    },
    lines: [],
    airZones(a) {
        return [{ sx0: 14, sy0: 2, sx1: 22, sy1: 10, kind: 'dust', color: 0x8a6a5a, n: 30, speed: 0.15 },   // the Nest: spores in the air
                { sx0: 26, sy0: 0, sx1: 34, sy1: 16, kind: 'dust', color: 0xb8a888, n: 26, speed: 0.1 }];   // bone dust at the Catacombs' end
    },
    dress(a) {
        const R = a.mkRnd(2011), pick = l => l[Math.floor(R() * l.length)];
        const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        /* the side of a square that is rock (to stand a piece against the wall), or null */
        const wallOf = (x, y) => { for (const [dx, dy] of D4) if (a.rock(x + dx, y + dy)) return [dx, dy]; return null; };
        const free = (x, y) => a.open(x, y) && !a.keep(x, y) && !a.blockers().has(x + ',' + y);
        const edges = (x0, y0, x1, y1) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (free(x, y) && wallOf(x, y)) o.push([x, y]); return o; };
        /* a piece against the wall: pushed most of the way to the rock */
        const atWall = (key, x, y, o) => { const w = wallOf(x, y) || [0, 0]; return a.P(key, x, y, Object.assign({ dx: a.r2(w[0] * 1.1 + (R() - 0.5) * 0.6), dz: a.r2(w[1] * 1.1 + (R() - 0.5) * 0.6), face: Math.round(R() * 360) }, o)); };
        const loose = (key, x, y, o) => a.P(key, x, y, Object.assign({ dx: a.r2((R() - 0.5) * 2), dz: a.r2((R() - 0.5) * 2), face: Math.round(R() * 360), noBlock: true }, o));
        const scatterWall = (x0, y0, x1, y1, keys, n, o) => { const E = edges(x0, y0, x1, y1); for (let i = 0; i < n && E.length; i++) { const q = E.splice(Math.floor(R() * E.length), 1)[0]; atWall(pick(keys), q[0], q[1], Object.assign({ noBlock: true }, o)); } };
        const torch = (x, y, lit) => atWall('cave_torch', x, y, lit ? {} : { noLight: true });
        /* a low slab of rock hung over a passage: the squeeze (drawn only; you stoop under it) */
        const lowRock = (id, x0, y0, x1, y1, over) => { const h = a.floor(x0, y0) + over, w = (x1 - x0 + 1) * a.C, d = (y1 - y0 + 1) * a.C;
            a.feat({ k: 'arch', id: 'ugt:squeeze:' + id, x: a.r2(a.gx(x0) + w / 2), z: a.r2(a.gz(y0) + d / 2), y: a.r2(h), rot: 0,
                parts: [{ s: 'box', p: [0, 0, 0], size: [a.r2(w + 0.4), 3.2, a.r2(d + 0.4)], key: 'cave_wall', tint: 0x403a34, uv: 3.5, top: false, under: true },
                        { s: 'cyl', p: [a.r2(-w / 4), -0.7, 0], r: 0.05, r2: 0.35, h: 0.7, seg: 6, key: 'cave_wall', tint: 0x4a443e, uv: 2 },
                        { s: 'cyl', p: [a.r2(w / 5), -0.5, a.r2(d / 5)], r: 0.04, r2: 0.28, h: 0.5, seg: 6, key: 'cave_wall', tint: 0x4a443e, uv: 2 }] }); };

        /* ══ THE PILOT: THE NORTH THIRD ══ */

        /* THE OSSUARY GATE (chamber 2,0, level 130): where the Catacombs' bones come through the rock. The skulls are packed along every wall, a
           heap in each corner, candles left burning by whoever still comes down; two torches, the only warm light in the district */
        torch(26, 3, true); torch(33, 8, true);
        a.P('skull_pile', 26, 5, { dx: -0.8 }); a.P('skull_pile', 33, 2, { dx: 0.8, dz: -0.8 }); a.P('skull_pile', 26, 9, { dx: -0.8, dz: 0.8 });
        scatterWall(26, 2, 33, 9, ['skull', 'skull', 'femur', 'ulna'], 26);
        a.P('candle_ring', 30, 7); a.P('stone_altar', 32, 5, { face: 270 });
        loose('skull', 31, 5); loose('femur', 28, 8);
        a.P('floor_stain', 29, 6, { noBlock: true });
        a.P('rat', 27, 6, { noBlock: true, face: 40 }); a.P('rat', 32, 9, { noBlock: true, face: 200 });
        /* THE BONE PASSAGE (the old passage out of the Catacombs, south to the shaft's crossing): lined with bones the whole way */
        scatterWall(27, 10, 29, 15, ['skull', 'femur', 'skull', 'ulna'], 14);
        a.P('skull_pile', 28, 13, { dx: -1.2, noBlock: true }); a.P('candleRing', 29, 11, { noBlock: true });
        scatterWall(28, 16, 31, 19, ['skull', 'femur'], 6);

        /* THE NEST (chamber 1,0, level 127): something lives here. The floor is skin, the walls are webbed, its kills hang wrapped; one red bloom of
           teeth lights it, and nothing else. Up a ladder from the Ossuary Gate's west passage (or from the Weeping Hall) */
        a.P('nightmare_bloom', 19, 8, { face: 200 });
        a.P('goo_tendril', 14, 2, { dx: -0.6, dz: -0.6 }); a.P('goo_tendril', 21, 9, { dx: 0.6, dz: 0.6 }); a.P('goo_tendril', 14, 9, { dx: -0.5, dz: 0.6 });
        a.P('meshy_black_blob', 16, 4); a.P('meshy_black_blob', 20, 3, { face: 120 });
        scatterWall(14, 2, 21, 9, ['hw_web', 'hw_web_2', 'hw_web_3', 'psx_cobweb_1', 'psx_cobweb_2'], 18);
        for (const [x, y] of [[15, 6], [17, 7], [18, 3], [20, 6], [16, 8], [19, 5]]) loose('chrysalis', x, y, { h: 0.9 });
        loose('hw_body_2', 17, 5, { face: 70 }); loose('hw_part_3', 20, 8); loose('hw_part_5', 15, 3); loose('femur', 18, 6); loose('skull', 16, 7);
        a.P('dream_eye', 21, 2, { dx: 0.6, dz: -0.5 });
        for (let i = 0; i < 4; i++) a.P(pick(['bat_black', 'bat_brown', 'bat_grey']), 15 + i * 2, 3 + (i % 2) * 4, { noBlock: true, y: a.floor(15 + i * 2, 3 + (i % 2) * 4) + 5.2 + R(), face: Math.round(R() * 360) });
        a.P('floor_stain', 18, 7, { noBlock: true }); a.P('floor_stain', 16, 5, { noBlock: true });

        /* THE WEEPING HALL (chamber 0,0, level 125): water runs down its north wall into a sump; glowcaps where it is wet. Its east passage to the
           Nest is THE SQUEEZE: a boulder on one side and the roof down to stooping height */
        for (const [x, y] of [[4, 2], [7, 2], [3, 3], [8, 3]]) loose('woods_glowcap', x, y, { noBlock: true });
        a.P('moss_clump', 5, 2, { noBlock: true }); a.P('moss_clump', 6, 3, { noBlock: true });
        scatterWall(2, 4, 9, 9, ['rf_rock_1', 'psxg_rock_1', 'cave_stone', 'psxg_rock_2'], 7);
        a.P('rf_rock_2', 11, 3, { dx: 0.5, dz: -0.6, face: 30 });
        lowRock('weeping', 10, 3, 11, 6, 2.15);
        loose('skull', 9, 6); a.P('rat', 3, 8, { noBlock: true, face: 300 });

        /* THE SHAFT (junction 1,1, level 127): the foot of the ladder down from Dead Man's Cave's Tunnel Way. The last party's rope still hangs
           here; one torch somebody fixed at the foot */
        torch(19, 19, true);
        a.P('rope_coils', 17, 17, { noBlock: true, face: 40 }); a.P('meshy_rope', 18, 16, { noBlock: true, dx: 0.4 });
        loose('psx_flashlight_1', 16, 18); loose('backpack', 19, 17, { face: 120 });
        scatterWall(10, 17, 15, 19, ['psxg_rock_1', 'psxg_rock_3', 'skull'], 4);

        /* THE OLD CAMP (the pit off junction 2,1, level 128, down a ladder): the last expedition's, where they stopped. One of them is still in
           his bag. The candle is new */
        a.P('sleeping_bag', 30, 20, { face: 90, noBlock: true }); a.P('hw_body', 30, 20, { face: 90, noBlock: true, dz: 0.2 });
        a.P('meshy_campfire_ring', 29, 21, { noBlock: true }); loose('pickaxe', 30, 21); loose('psx_flashlight_1', 29, 21, { dx: 0.9 });
        a.P('field_radio', 30, 21, { noBlock: true, dx: 0.8, dz: 0.7, face: 210 }); a.P('candle_ring', 30, 21, { dx: -0.6, dz: 0.5 });
        a.P('psx_supply_crate_1', 30, 20, { dx: 1.0, dz: -1.0, noBlock: true, face: 15 });
        /* the camp's way up the junction: their gear left where they climbed */
        loose('rope_coils', 31, 18); loose('psx_canned_food_mp_5_rusty', 28, 17);

        /* THE LOW HALL (chamber 3,0, level 123) and the cliff down into it from the north-east passage: rubble, one torch */
        torch(38, 6, true);
        scatterWall(38, 2, 45, 9, ['rf_rock_1', 'rf_rock_2', 'ocean_rock_4', 'psxg_rock_1', 'cave_stone'], 9);
        loose('skull', 42, 7); loose('hw_part_6', 40, 4); a.P('rat', 44, 3, { noBlock: true, face: 90 });
        /* THE CRAWL (junctions 3,1 / 4,1, level 127): long and low, a second squeeze */
        lowRock('crawl', 40, 16, 43, 17, 2.25);
        scatterWall(40, 13, 47, 23, ['psxg_rock_1', 'psxg_rock_2', 'cave_stone'], 8);

        /* THE CRYSTAL POCKET (the pit off junction 4,1, level 125): the one beautiful thing down here */
        a.P('crystal_cluster', 57, 18, { dx: 0.6, dz: 0.4 }); a.P('meshy_crystal_shards', 56, 17, { noBlock: true, dx: -0.5, dz: -0.6 });
        a.P('meshy_crystal_shards', 57, 17, { noBlock: true, dx: 0.6, dz: -0.6, face: 120 });

        /* THE COLD HALL (chamber 4,0, level 125): a sump on its north side, the draught from the Sewers; THE BLACK SUMP (chamber 0,1, 124) */
        torch(57, 8, true);
        scatterWall(50, 2, 57, 9, ['rf_rock_1', 'psxg_rock_1', 'ocean_rock_3', 'cave_stone'], 7);
        for (const [x, y] of [[53, 2], [54, 3]]) loose('woods_glowcap', x, y);
        torch(2, 19, true);
        for (const [x, y] of [[4, 14], [7, 14], [5, 15]]) loose('woods_glowcap', x, y);
        scatterWall(2, 15, 9, 21, ['rf_rock_1', 'psxg_rock_1', 'psxg_rock_2', 'cave_stone', 'skull'], 8);
        loose('hw_body', 8, 20, { face: 170 }); loose('psx_flashlight_1', 7, 20);

        /* ══ THE REST (not dressed until mondo has seen the pilot): one unlit torch a chamber, glowing only ══ */
        a.PL.forEach(p => { if (!p.chamber || p.by * a.N < PILOT_Y) return; const E = edges(p.bx * a.N, p.by * a.N, p.bx * a.N + a.N - 1, p.by * a.N + a.N - 1); if (E.length) torch(E[0][0], E[0][1], false); });
    },
};
