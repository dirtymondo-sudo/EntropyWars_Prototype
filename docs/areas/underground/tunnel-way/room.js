/* THE UNDERGROUND, THE TUNNEL-WAY: WHAT STANDS IN THE ROOM (2026-11-20, world polish threads 7 + 9 + 10, the Tunnel-Way's build thread).
   Read by bake-ug-tunnelway.js, in the room's own squares (x 0..59 west to east, y 0..59 north to south; the plan's squares,
   docs/plans/world-polish/plans/ug-tunnel-way.js). The tool lays the ground, the rock, the roofs, the ladders and the sumps from the plan;
   this file names the places and dresses them. Notes: docs/notes/areas-complexes.md "THE UNDERGROUND, THE TUNNEL-WAY".
   mondo 11-20: "underground horror like the descent movie"; the build brief: "dark, squeezes, bones, a nest, water noise".

   THE PILOT (11-20) dressed THE NORTH THIRD, plot rows 0 and 1 (squares y 0..23): the Catacombs' join (the Ossuary Gate), the Bone Passage, the
   shaft from Dead Man's Cave, the Nest, the dead expedition's camp in its pit, the crystal pocket, the weeping halls. On mondo's word ("okay
   continue", 11-20) the MIDDLE and SOUTH THIRDS: the Great Chamber + its stalagmite, the Crystal Bend, the Dead Squeeze, the Long Drop, the Cells
   Tunnel, the Bone Pit, the Larder, the Black Water, the Gnawing Pit, the Stretcher Camp, the two nests, the secret, the Way Down.
   THE LIGHTS: ten real lights, one a place (the Gate, the Nest's bloom, the Shaft, the Old Camp's candle, the two crystal pockets, the Great
   Chamber's brazier, the Cells Tunnel, the Larder, the Way Down); every other torch, candle and glowcap only glows (`noLight`). */
'use strict';
const PILOT_Y = 24;   // the pilot's rows: squares y < 24
const NAMES = {
    '0,0': 'The Weeping Hall', '1,0': 'The Nest', '2,0': 'The Ossuary Gate', '3,0': 'The Low Hall', '4,0': 'The Cold Hall',
    '0,1': 'The Black Sump', '1,1': 'The Shaft', '2,1': 'The Bone Passage', '3,1': 'The Crawl', '4,1': 'The Crystal Pocket',
    '0,2': 'The Great Chamber', '1,2': 'The Crystal Bend', '2,2': 'The Dead Squeeze', '3,2': 'The Long Drop', '4,2': 'The Cells Tunnel',
    '0,3': 'The Bone Pit', '1,3': 'The Larder', '2,3': 'The Black Water', '3,3': 'The Gnawing Pit', '4,3': 'The Stretcher Camp',
    '0,4': 'The Low Nest', '1,4': 'The Long Bend', '2,4': 'The Way Down', '3,4': 'The Deep Nest', '4,4': 'The Dry Bend' };
/* the ground sheets, all the horror pack (mondo 11-20: "don't use the calm textures, use from the urban decay or horror pack"; the Cavern's palette):
   1 = mud (hz_floor_03), 2 = wet black rock round the sumps (hz_misc_05), 3 = cut stone flags at the Catacombs' end (hz_floor_12), 4 = the Nests' crust, dark and organic (hz_misc_06; hz_misc_15 read as lava) */
const PAL = ['hz_floor_03', 'hz_misc_05', 'hz_floor_12', 'hz_misc_06'];

module.exports = {
    parti: 'A labyrinth cut in the rock under Dead Man\'s Cave: low passages that bend at every turn, halls where a fight fits, ladders and ropes where the floor steps, cliffs you only go down, pits with something in them, and the dark. It is entered at its top, from the Catacombs, and goes down as you go in, to the Cavern.',
    ambient: 0.14, fog: 0.014,
    spawn: [29, 5], spawnFace: 180,
    names: NAMES,
    palette: PAL,
    paint(a, x, y) {
        if (a.rock(x, y)) return 0;
        if (y < PILOT_Y && x >= 14 && x <= 21 && y >= 2 && y <= 9) return 4;                           // the Nest's floor
        if ((x >= 1 && x <= 4 && y >= 52 && y <= 55) || (x >= 40 && x <= 43 && y >= 49 && y <= 52)) return 4;   // the two nests' pits
        if (x >= 26 && x <= 33 && y <= 15) return 3;                                                     // the Ossuary Gate + the Bone Passage: cut stone
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (a.water(x + dx, y + dy)) return 2;   // wet rock round a sump
        return ((x * 7 + y * 13) % 5 === 0) ? 1 : 0;
    },
    lines: [],
    airZones(a) {
        return [{ sx0: 14, sy0: 2, sx1: 22, sy1: 10, kind: 'dust', color: 0x8a6a5a, n: 30, speed: 0.15 },   // the Nest: spores in the air
                { sx0: 26, sy0: 0, sx1: 34, sy1: 16, kind: 'dust', color: 0xb8a888, n: 26, speed: 0.1 },    // bone dust at the Catacombs' end
                { sx0: 26, sy0: 50, sx1: 34, sy1: 60, kind: 'dust', color: 0xc89060, n: 22, speed: 0.35 },  // the Way Down: warm air coming up
                { sx0: 1, sy0: 52, sx1: 5, sy1: 56, kind: 'dust', color: 0x8a6a5a, n: 10, speed: 0.15 }, { sx0: 40, sy0: 49, sx1: 44, sy1: 53, kind: 'dust', color: 0x8a6a5a, n: 10, speed: 0.15 }];   // bone dust at the Catacombs' end
    },
    dress(a) {
        const R = a.mkRnd(2011), pick = l => l[Math.floor(R() * l.length)];
        const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        /* the side of a square that is rock (to stand a piece against the wall), or null */
        const wallOf = (x, y) => { for (const [dx, dy] of D4) if (a.rock(x + dx, y + dy)) return [dx, dy]; return null; };
        const free = (x, y) => a.open(x, y) && !a.keep(x, y) && !a.blockers().has(x + ',' + y);
        const edges = (x0, y0, x1, y1) => { const o = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (free(x, y) && wallOf(x, y)) o.push([x, y]); return o; };
        /* a piece against the wall: pushed most of the way to the rock */
        const atWall = (key, x, y, o) => { const w = wallOf(x, y) || [0, 0]; return a.P(key, x, y, Object.assign({ dx: a.r2(w[0] * 0.5 + (R() - 0.5) * 0.5 * Math.abs(w[1])), dz: a.r2(w[1] * 0.5 + (R() - 0.5) * 0.5 * Math.abs(w[0])), face: Math.round(R() * 360) }, o)); };
        const loose = (key, x, y, o) => a.P(key, x, y, Object.assign({ dx: a.r2((R() - 0.5) * 2), dz: a.r2((R() - 0.5) * 2), face: Math.round(R() * 360), noBlock: true }, o));
        const scatterWall = (x0, y0, x1, y1, keys, n, o) => { const E = edges(x0, y0, x1, y1); for (let i = 0; i < n && E.length; i++) { const q = E.splice(Math.floor(R() * E.length), 1)[0]; atWall(pick(keys), q[0], q[1], Object.assign({ noBlock: true }, o)); } };
        const torch = (x, y, lit) => atWall('cave_torch', x, y, lit ? {} : { noLight: true });
        /* a low slab of rock hung over a passage: the squeeze (drawn only; you stoop under it) */
        const lowRock = (id, x0, y0, x1, y1, over) => { const h = a.floor(x0, y0) + over, w = (x1 - x0 + 1) * a.C, d = (y1 - y0 + 1) * a.C, parts = [];
            /* the rock comes down in lumps: a ceiling 0.9 m over the stoop line, and cones hanging from it to the line itself */
            parts.push({ s: 'box', p: [0, 0.9, 0], size: [a.r2(w), a.r2(Math.max(2.6, a.roofAt(x0, y0) - h - 0.6)), a.r2(d)], key: 'hz_stone_10', tint: 0xd6d2ca, uv: 3.5, top: false, under: true });
            const n = Math.max(6, Math.round(w * d / 3));
            for (let i = 0; i < n; i++) { const len = a.r2(0.5 + R() * 0.45), r = a.r2(0.35 + R() * 0.5);
                parts.push({ s: 'cyl', p: [a.r2((R() - 0.5) * (w - 0.6)), a.r2(0.92 - len), a.r2((R() - 0.5) * (d - 0.6))], r: a.r2(r * 0.25), r2: r, h: len, seg: 7, key: 'hz_stone_02', tint: 0xe4e0d8, uv: 2 }); }
            a.feat({ k: 'arch', id: 'ugt:squeeze:' + id, x: a.r2(a.gx(x0) + w / 2), z: a.r2(a.gz(y0) + d / 2), y: a.r2(h), rot: 0, parts }); };

        /* ══ THE PILOT: THE NORTH THIRD ══ */

        /* THE OSSUARY GATE (chamber 2,0, level 130): where the Catacombs' bones come through the rock. The skulls are packed along every wall, a
           heap in each corner, candles left burning by whoever still comes down; two torches, the only warm light in the district */
        torch(26, 3, true); torch(33, 8, false);
        a.P('skull_pile', 26, 5, { dx: -0.8 }); a.P('skull_pile', 33, 2, { dx: 0.8, dz: -0.8 }); a.P('skull_pile', 26, 9, { dx: -0.8, dz: 0.8 });
        scatterWall(26, 2, 33, 9, ['skull', 'skull', 'hw_part_2', 'skull'], 26);
        a.P('candle_ring', 30, 7, { noLight: true }); a.P('stone_altar', 32, 5, { face: 270 });
        loose('skull', 31, 5); loose('hw_part_2', 28, 8);
        a.P('floor_stain', 29, 6, { noBlock: true });
        a.P('rat', 27, 6, { noBlock: true, face: 40 }); a.P('rat', 32, 9, { noBlock: true, face: 200 });
        /* THE BONE PASSAGE (the old passage out of the Catacombs, south to the shaft's crossing): lined with bones the whole way */
        scatterWall(27, 10, 29, 15, ['skull', 'hw_part_2', 'skull', 'skull'], 14);
        a.P('skull_pile', 28, 13, { dx: -1.2, noBlock: true }); a.P('candleRing', 29, 11, { noBlock: true });
        scatterWall(28, 16, 31, 19, ['skull', 'hw_part_2'], 6);

        /* THE NEST (chamber 1,0, level 127): something lives here. The floor is skin, the walls are webbed, its kills hang wrapped; one red bloom of
           teeth lights it, and nothing else. Up a ladder from the Ossuary Gate's west passage (or from the Weeping Hall) */
        a.P('nightmare_bloom', 19, 8, { face: 200 });
        a.P('goo_tendril', 14, 2, { dx: -0.6, dz: -0.6 }); a.P('goo_tendril', 21, 9, { dx: 0.6, dz: 0.6 }); a.P('goo_tendril', 14, 9, { dx: -0.5, dz: 0.6 });
        a.P('meshy_black_blob', 16, 4); a.P('meshy_black_blob', 20, 3, { face: 120 }); a.P('meshy_black_blob', 15, 8, { face: 300, h: 1.4 }); a.P('meshy_black_blob', 18, 2, { face: 30, h: 0.7 });
        a.P('hw_body_rising', 20, 7, { face: 250 }); loose('hw_body', 15, 5, { face: 20 });
        scatterWall(14, 2, 21, 9, ['hw_web', 'hw_web_2', 'hw_web_3', 'psx_cobweb_1', 'psx_cobweb_2'], 18);
        for (const [x, y] of [[15, 6], [20, 6], [16, 8]]) loose('chrysalis', x, y, { h: 0.9 });
        for (const [x, y] of [[17, 7], [18, 3], [19, 5]]) loose(pick(['hw_part', 'hw_part_2', 'hw_part_4', 'skull', 'hw_part_2']), x, y);
        loose('hw_body_2', 17, 5, { face: 70 }); loose('hw_part_3', 20, 8); loose('hw_part_5', 15, 3); loose('hw_part_2', 18, 6); loose('skull', 16, 7);
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
        torch(38, 6, false);
        scatterWall(38, 2, 45, 9, ['rf_rock_1', 'rf_rock_2', 'ocean_rock_4', 'psxg_rock_1', 'cave_stone'], 9);
        loose('skull', 42, 7); loose('hw_part_6', 40, 4); a.P('rat', 44, 3, { noBlock: true, face: 90 });
        /* THE CRAWL (junctions 3,1 / 4,1, level 127): long and low, a second squeeze */
        lowRock('crawl', 40, 16, 43, 17, 2.25);
        scatterWall(40, 13, 47, 23, ['psxg_rock_1', 'psxg_rock_2', 'cave_stone'], 8);

        /* THE CRYSTAL POCKET (the pit off junction 4,1, level 125): the one beautiful thing down here */
        a.P('crystal_cluster', 57, 18, { dx: 0.6, dz: 0.4 }); a.P('meshy_crystal_shards', 56, 17, { noBlock: true, dx: -0.5, dz: -0.6 });
        a.P('meshy_crystal_shards', 57, 17, { noBlock: true, dx: 0.6, dz: -0.6, face: 120 });

        /* THE COLD HALL (chamber 4,0, level 125): a sump on its north side, the draught from the Sewers; THE BLACK SUMP (chamber 0,1, 124) */
        torch(57, 8, false);
        scatterWall(50, 2, 57, 9, ['rf_rock_1', 'psxg_rock_1', 'ocean_rock_3', 'cave_stone'], 7);
        for (const [x, y] of [[53, 2], [54, 3]]) loose('woods_glowcap', x, y);
        torch(2, 19, false);
        for (const [x, y] of [[4, 14], [7, 14], [5, 15]]) loose('woods_glowcap', x, y);
        scatterWall(2, 15, 9, 21, ['rf_rock_1', 'psxg_rock_1', 'psxg_rock_2', 'cave_stone', 'skull'], 8);
        loose('hw_body', 8, 20, { face: 170 }); loose('psx_flashlight_1', 7, 20);

        /* ══ THE MIDDLE THIRD (plot row 2) and THE SOUTH THIRD (rows 3 and 4), built on mondo's word on the pilot (11-20: "okay continue") ══ */

        /* THE GREAT CHAMBER (chamber 0,2, level 121): the district's landmark, THE STALAGMITE (the plan's `k` square, two levels tall: drawn here, no
           model exists), seen from THE EDGE (the plan's lookout, its north-west corner). The Long Tunnel goes west out of it, eleven levels down. An old
           fire somebody keeps alight; the CLIFF from the Crystal Bend drops four levels into its east passage */
        { const sx = 6, sy = 30, ox = a.gcx(sx), oz = a.gcz(sy), parts = [], tint = [0xf0ece6, 0xe4e0d8, 0xffffff];
          parts.push({ s: 'cyl', p: [0, 0, 0], r: 1.25, r2: 0.12, h: 7.4, seg: 9, key: 'hz_stone_07', tint: tint[0], uv: 2.5 });
          for (const [dx, dz, h, r] of [[1.2, 0.6, 3.6, 0.6], [-1.0, 0.9, 2.6, 0.5], [0.4, -1.2, 4.4, 0.7], [-0.9, -0.7, 1.8, 0.45], [1.5, -0.6, 1.4, 0.35]])
              parts.push({ s: 'cyl', p: [dx, 0, dz], r, r2: 0.06, h, seg: 7, key: 'hz_stone_07', tint: tint[Math.floor(R() * 3)], uv: 2 });
          parts.push({ s: 'cyl', p: [0, a.roofAt(sx, sy) - a.floor(sx, sy) - 3.2, 0], r: 0.1, r2: 1.1, h: 3.2, seg: 8, key: 'hz_stone_02', tint: 0xe4e0d8, uv: 2 });   // its stalactite, nearly meeting it
          a.feat({ k: 'arch', id: 'ugt:stalagmite', x: ox, z: oz, y: a.floor(sx, sy), rot: 0, parts });
          a.P('sarsen', sx, sy, { h: 3.0, face: 20 }); }   // (its body, inside the drawn column: so you walk round it)
        a.P('brazier', 4, 28, { face: 30 }); a.P('firewood_stack', 3, 27, { dx: -0.5, dz: -0.6 });
        loose('skull', 2, 26); a.P('rope_coils', 2, 26, { noBlock: true, dx: 0.6, dz: 0.5 });   // THE EDGE: somebody stood here and looked
        scatterWall(2, 26, 9, 33, ['rf_rock_1', 'rf_rock_2', 'psxg_rock_1', 'cave_stone', 'skull', 'ocean_rock_4'], 12);
        for (const [x, y] of [[8, 27], [3, 32], [8, 33]]) loose('woods_glowcap', x, y);
        loose('hw_body', 7, 32, { face: 80 }); loose('psx_flashlight_1', 8, 32); a.P('rat', 5, 33, { noBlock: true, face: 160 });
        scatterWall(10, 30, 15, 33, ['psxg_rock_1', 'psxg_rock_2', 'cave_stone'], 4);

        /* THE CRYSTAL BEND (junction 1,2, 125) and its pit, the second CRYSTAL POCKET (123) */
        a.P('crystal_cluster', 20, 30, { dx: -0.4, dz: 0.5 }); a.P('meshy_crystal_shards', 21, 29, { noBlock: true, dx: 0.5, dz: -0.5 });
        a.P('meshy_crystal_shards', 21, 30, { noBlock: true, dx: 0.6, dz: 0.6, face: 200 }); loose('meshy_crystal_shards', 18, 29, { h: 0.5 });
        scatterWall(16, 24, 19, 35, ['psxg_rock_1', 'psxg_rock_3', 'cave_stone'], 6);

        /* THE DEAD SQUEEZE (junction 2,2, 125): its pit is a squeeze that goes nowhere (the rock down to crawling height over it, a boot left in it) */
        lowRock('dead', 26, 29, 27, 30, 1.55); loose('hw_part_6', 26, 30); loose('psx_flashlight_1', 26, 29);
        scatterWall(28, 28, 35, 35, ['psxg_rock_1', 'cave_stone', 'skull'], 6);
        /* THE LONG DROP (junction 3,2, 127): the CLIFF seven levels straight down into the passage under it (the free climb beside it is the way back) */
        scatterWall(36, 24, 47, 33, ['rf_rock_1', 'psxg_rock_1', 'psxg_rock_2'], 8);
        a.P('rope_coils', 41, 34, { noBlock: true, face: 300 }); loose('hw_body_2', 41, 38, { face: 10 });   // one who fell

        /* THE CELLS TUNNEL (chamber 4,2, level 124): the way east to the Sewers' Holding Cells; the gaol's drain broke through here: brick, chains,
           a bunk somebody dragged down, a sump on its north side */
        torch(57, 31, true);
        a.P('chain_bunk', 51, 32, { face: 90 }); a.P('drain_grate', 55, 26, { noBlock: true, face: 20 });
        scatterWall(50, 26, 57, 33, ['psx_brick_1', 'psx_brick_1', 'psxg_rock_1', 'skull', 'cave_stone'], 12);
        a.P('trap_chain_draped', 50, 28, { noBlock: true, dx: -0.4 }); a.P('wall_chains', 50, 31, { noBlock: true, dx: -0.4 });
        for (const [x, y, f] of [[53, 30, 20], [56, 28, 250], [52, 27, 90]]) a.P('rat', x, y, { noBlock: true, face: f });
        loose('psx_canned_food_mp_5_rusty', 54, 32);

        /* THE BONE PIT (the pit off junction 0,3, level 121): whatever eats down here drops what it does not want */
        a.P('skull_pile', 2, 41, { noBlock: true, dx: -0.5, dz: -0.5 }); loose('skull', 3, 42); loose('hw_part_2', 2, 42); loose('hw_part_9', 3, 41);
        scatterWall(4, 36, 7, 47, ['psxg_rock_1', 'psxg_rock_2', 'skull'], 6);
        lowRock('bonepit', 4, 36, 5, 39, 2.2);   // the passage down from the Great Chamber: a squeeze

        /* THE LARDER (chamber 1,3, level 125): the Nest's store. Hooks in the roof, the meat on them, chains, a sump at its foot. One torch nobody lit */
        torch(14, 39, true);
        for (const [x, y] of [[16, 40], [18, 41], [20, 40], [17, 43], [19, 44]]) a.P('meat_hook', x, y, { y: a.floor(x, y) + 4.6, face: Math.round(R() * 360) });
        loose('hw_body', 15, 44, { face: 300 }); loose('hw_body_2', 21, 42, { face: 90 }); loose('hw_part_3', 18, 39); loose('hw_part_4', 16, 42);
        a.P('trap_chain_draped', 14, 42, { noBlock: true, dx: -0.4 }); a.P('wall_chains', 21, 38, { noBlock: true, dx: 0.4 });
        a.P('floor_stain', 17, 41, { noBlock: true }); a.P('floor_stain', 19, 43, { noBlock: true });
        scatterWall(14, 38, 21, 45, ['skull', 'hw_part_2', 'psxg_rock_1'], 8);

        /* THE BLACK WATER (junction 2,3, 122): its pit (120) holds still black water you wade in, against its west wall; something lies under it */
        a.feat({ k: 'stream', pts: [[a.gcx(26), a.r2(a.gz(41) + 0.6)], [a.gcx(26), a.r2(a.gz(43) - 0.6)]], w: 3.5, y: 0.3, depth: 0.3 });   // one square wide, beside the ladder's foot (a swimmer never climbs: the ladder stays dry)
        loose('skull', 27, 42, { y: a.floor(27, 42) + 0.05 });
        scatterWall(28, 36, 35, 43, ['psxg_rock_1', 'cave_stone', 'psxg_rock_3'], 6);

        /* THE GNAWING PIT (the pit off junction 3,3, 118): the second bone pit */
        a.P('skull_pile', 42, 45, { noBlock: true, dx: 0.5, dz: 0.5 }); loose('hw_part_7', 41, 45); loose('skull', 42, 44); loose('hw_part', 41, 44);
        scatterWall(40, 40, 51, 43, ['psxg_rock_1', 'psxg_rock_2', 'skull'], 7);
        lowRock('gnaw', 48, 42, 51, 43, 2.2);   // the passage east to the Stretcher Camp: a squeeze

        /* THE STRETCHER CAMP (the pit off junction 4,3, 116): the rescue that came after the first party. They got one of them onto the stretcher */
        a.P('stretcher', 57, 41, { noBlock: true, face: 0 }); a.P('hw_body_2', 57, 41, { noBlock: true, face: 0 });
        loose('backpack', 56, 42, { face: 200 }); loose('psx_flashlight_1', 57, 42); a.P('rope_coils', 56, 41, { noBlock: true, dx: -0.5, dz: -0.5 });
        loose('item_walkie_talkie', 57, 42, { dx: 0.7 });
        scatterWall(52, 44, 55, 55, ['psxg_rock_1', 'cave_stone', 'psxg_rock_2'], 6);

        /* THE LOW NEST (the pit off junction 0,4, 118) and THE DEEP NEST (the pit off junction 3,4, 114, the room's lowest floor): eggs, webs, the
           wrapped. THE SECRET (junction 3,4's dead corner): something kept, in a chest that is not the Nest's */
        for (const [px, py] of [[2, 53], [41, 50]]) {
            a.P('meshy_black_blob', px, py + 1, { face: Math.round(R() * 360), h: 1.2 }); loose('chrysalis', px + 1, py, { h: 0.9 }); loose('chrysalis', px, py, { h: 0.7 });
            loose('hw_body_2', px + 1, py + 1, { face: Math.round(R() * 360) }); a.P('dream_eye', px + 1, py + 1, { dx: 0.7, dz: 0.7 }); }
        a.P('goo_tendril', 2, 54, { dx: -0.7, dz: 0.7 }); a.P('goo_tendril', 42, 50, { dx: 0.7, dz: -0.7 });
        a.P('sea_chest', 40, 52, { dx: -0.7, dz: -0.6, face: 135 }); loose('skull', 40, 53);
        scatterWall(4, 48, 15, 55, ['psxg_rock_1', 'psxg_rock_2', 'cave_stone', 'skull'], 9);
        scatterWall(44, 52, 51, 55, ['psxg_rock_1', 'cave_stone'], 4);

        /* THE WAY DOWN (chamber 2,4, level 117): the bottom of the Tunnel-Way; the passage south goes on down twelve levels to the Cavern's Last Camp.
           Warm air comes up it. The rope the camp came down on starts here */
        torch(26, 51, true);
        a.P('rope_coils', 28, 57, { noBlock: true, dx: -0.5, face: 80 }); loose('pickaxe', 30, 56); loose('ice_axe', 31, 55);
        a.P('psx_supply_crate_1', 33, 56, { noBlock: true, face: 25 }); a.P('psx_supply_crate_1', 33, 55, { noBlock: true, face: 300 });
        scatterWall(26, 50, 33, 57, ['rf_rock_1', 'rf_rock_2', 'psxg_rock_1', 'cave_stone', 'skull'], 11);
        for (const [x, y] of [[29, 50], [30, 50], [32, 51]]) loose('woods_glowcap', x, y);
        a.P('missing_board', 32, 50, { dx: 0.6, dz: -0.6, face: 200 });   // their faces, carried down and nailed up here
        scatterWall(16, 50, 25, 57, ['psxg_rock_1', 'cave_stone', 'psxg_rock_3'], 6);

        /* the long bends between: rubble and glowcaps, an unlit torch where two ways meet */
        torch(4, 50, false); torch(52, 53, false); torch(42, 31, false); torch(17, 34, false);
        scatterWall(0, 24, 59, 59, ['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'cave_stone'], 30);
    },
};
