/* AGARTHA, THE ROOM DESIGN (2026-11-20, world polish thread 9; WORLD_POLISH_PLAN.md section 4, "HOW A BUILD THREAD USES A PLAN").
   Read by `node bake-agartha.js`. Written in the room's own frame: squares sx 0..59 west to east, sy 0..47 north to south (the plan's own).
   THE PLAN IS READ, NOT RETYPED: docs/plans/world-polish/plans/ug-agartha.js (mondo's OK 11-20). The plan's squares, levels, ladders,
   cliffs and pits are the tool's; this file names the places, raises the buildings, dresses, lights and peoples them.
   mondo 11-20 (the brief): "Agartha is a CITY in a cave: it needs real architecture you walk into, lit by its crystals, with the dark maze
   round it"; the maze is "victory road ... underground horror like the descent movie".

   PASS 1, THE PILOT: THE UPPER SHELF (level 134, the west two columns of plots, squares x 0..23) + the dark maze under it (126 to 132).
   - THE LEMURIA ADIT (2..3 x 0..1): the old mine's timbered tunnel from the north wall (the Mountains' Hot Springs), rails, a cart left behind.
   - THE LEMURIAN GATE: where the mine meets the city, a white gate with a lit crystal in its keystone.
   - THE ADIT SQUARE (2..9 x 2..9, the board): white paving round THE GREAT CRYSTAL (6,6), the great chamber's stalagmite grown through with
     crystal, which lights the whole shelf (the room's first big light); four columns stand round its precinct.
   - THE UPPER TERRACE (10..14 x 7..9): the forecourt of THE HALL OF RECORDS (10..14 x 2..6), a hall you walk into: the city's records on
     crystal tablets, the telescope, orrery and lectern the old Upper Terrace had, a model of the city.
   - TWO HOMES CUT IN THE ROCK: west of the square (0..1 x 4..7) and south of the terrace (9..12 x 10..12).
   - THE DROP (6..8 x 10..11): the square's south way ends at a broken balustrade over the cliff (8 levels down; an old rope hangs there).
   - THE COLONNADE (15..19 x 4..7): the way east out of the city into the dark, between columns.
   - THE MAZE UNDER THE SHELF: dark rock, cobwebs, loose rock, bones; a torch at a few bends, most of them dead; the pits the plan names:
     a NEST (17..18 x 2..3), a CRYSTAL POCKET (20..21 x 29..30), a BONE PIT (5..6 x 44..45), an OLD CAMP (17..18 x 44..45) where an
     expedition stopped and did not leave.
   PASS 2 (11-20, mondo: "okay continue"): THE TERRACES and THE SPIRE.
   - THE TERRACES, the middle shelf: THE PLAZA (chamber 2,3, 125; the board, the old Plaza's fountain and benches) and THE INNER GATE
     (chamber 3,3, 124; the board, the gate down to the Long Tunnel) joined by A MARBLE STAIR (34..37 x 42..44); a house cut in the west
     rock (22..25 x 38..41), a house in the east rock (48..51 x 42..44), THE GATEHOUSE (38..41 x 46..47).
   - THE SPIRE, the lower shelf: THE TEMPLE (27..32 x 2..5, chamber 2,0 at 120) and its court; chamber 3,0 (118) is a ring round a pit of
     black water 6 levels down, THE SPIRE on an island in the middle (the old room's Spire, grown: 36 m of crystal lit from inside, the
     city's great light), FOUR CRYSTAL BRIDGES from the ring to the island, a ladder up out of the pit; the Loch Ness Monster in the water.
   - THE MAZE east of the city: the pits the plan names (a bone pit, a nest, a crystal pocket, a squeeze, a sump of black water) and the
     dead end where something is kept (a cell, chains, what is left in it). */
'use strict';
const CITY = [2, 2, 14, 9], LEVEL_M = 1.75;
const MARBLE = 'hz_wall_01', CRYSTAL = 'hz_misc_05', WHITE = 0xf2efe6, STONE = 0xe2ddd0, GLOW = 0xbff4ff;
const PILOT_X = 24;   // squares x < 24: the pilot's third
const SPIRE = [42, 6];   // the island's corner square (41..42 x 5..6): the Spire stands on the line between them
const TERR = [[26, 38, 33, 45], [38, 38, 45, 45], [34, 39, 37, 44]];   // the Plaza, the Inner Gate, the stair between

module.exports = {
    parti: 'A city of white marble cut into the rock of the deepest cave there is, lit from inside by its crystals, on three shelves stepping down to its Spire; round it, a dark labyrinth of passages, ladders, cliffs and pits that does not want you to find the way.',
    ambient: 0.14,
    spawn: [3, 3], spawnFace: 180,
    plotNames: { '0,0': 'The Adit Square', '1,0': 'The Hall of Records', '0,1': 'Under the Drop', '1,1': 'The Upper Maze', '0,2': 'The West Galleries', '1,2': 'The Crystal Pocket', '0,3': 'The Bone Pit', '1,3': 'The Old Camp',
        '2,0': 'The Temple', '3,0': 'The Spire', '4,0': 'The Low Bone Pit', '2,1': 'The Middle Maze', '3,1': 'The Squeeze', '4,1': 'The Low Nest', '2,2': 'The Stair Junction', '3,2': 'The Sump', '4,2': 'The Low Pocket',
        '2,3': 'The Plaza', '3,3': 'The Inner Gate', '4,3': 'The Kept Room' },
    bridge: { key: 'hz_misc_05', thick: 0.3, rails: true },

    plan(ctx) {
        const { headroom, paint, squaresIn, open, T } = ctx;
        /* THE HEADROOM: the city's chamber is tall (9 levels over its paving), the colonnade 4, the adit a mine's */
        headroom(CITY[0], CITY[1], CITY[2], CITY[3], 9 * LEVEL_M);
        headroom(15, 3, 19, 8, 4 * LEVEL_M);
        headroom(2, 0, 3, 1, 4.6);
        headroom(38, 2, 45, 9, 40);             // THE SPIRE's vault
        headroom(26, 2, 33, 9, 7 * LEVEL_M);    // the Temple's chamber
        TERR.forEach(r => headroom(r[0], r[1], r[2], r[3], 7 * LEVEL_M));
        headroom(22, 38, 25, 41, 5.6); headroom(48, 42, 51, 44, 5.6); headroom(38, 46, 41, 47, 5.6);
        TERR.concat([[26, 2, 33, 9], [38, 2, 45, 9], [36, 3, 37, 4]]).forEach(r => squaresIn(r[0], r[1], r[2], r[3], (x, y) => open(x, y) && T(x, y) !== 'w').forEach(([x, y]) => paint(x, y, 'marble_light')));
        squaresIn(41, 5, 42, 6, open).forEach(([x, y]) => paint(x, y, 'crystal'));
        squaresIn(22, 38, 25, 41, open).concat(squaresIn(48, 42, 51, 44, open), squaresIn(38, 46, 41, 47, open), squaresIn(27, 2, 32, 5, open)).forEach(([x, y]) => paint(x, y, 'marble_2'));
        paint(40, 7, 'rocks_dark_fantasy');
        [[53, 2, 54, 3], [56, 17, 57, 18], [56, 29, 57, 30], [41, 20, 42, 21], [41, 26, 42, 27], [52, 40, 53, 41]].forEach(r => squaresIn(r[0], r[1], r[2], r[3], open).forEach(([x, y]) => paint(x, y, 'rocks_dark_fantasy')));
        squaresIn(41, 26, 42, 27, open).forEach(([x, y]) => paint(x, y, 'obsidian'));
        /* THE PAINT: white paving on the shelf, crystal under the Great Crystal's precinct, the adit's dirt, the pits' dark */
        squaresIn(CITY[0], CITY[1], CITY[2], CITY[3], open).forEach(([x, y]) => paint(x, y, 'marble_light'));
        squaresIn(15, 4, 19, 7, open).forEach(([x, y]) => paint(x, y, 'marble_2'));
        squaresIn(5, 5, 7, 7, open).forEach(([x, y]) => paint(x, y, 'crystal'));
        squaresIn(2, 0, 3, 1, open).forEach(([x, y]) => paint(x, y, 'dirt_2'));
        squaresIn(0, 4, 1, 7, open).concat(squaresIn(9, 10, 12, 12, open)).forEach(([x, y]) => paint(x, y, 'marble_2'));
        [[17, 2, 18, 3], [20, 29, 21, 30], [5, 44, 6, 45], [17, 44, 18, 45]].forEach(r => squaresIn(r[0], r[1], r[2], r[3], open).forEach(([x, y]) => paint(x, y, T(x, y) === 'w' ? 'obsidian' : 'rocks_dark_fantasy')));
    },

    build(ctx) {
        const { building, look, gx, gz, gcx, gcz, walkOf, taken, put, P, dec, U, counters, OLD, r2, C } = ctx;
        const F0 = walkOf(3, 3);
        /* ── THE LEMURIA ADIT: timber sets down the old mine (a cap on two legs every square), the rails, the cart ── */
        const WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a');
        [0, 1].forEach(y => look('adit:set' + y, gx(3), gcz(y), 0, F0, a => {
            [-1, 1].forEach(s => a.box(s * 3.3, 0, 0, 0.32, 3.3, 0.32, WD, 0x8a6a48));
            a.box(0, 3.3, 0, 7.2, 0.34, 0.4, WD, 0x7a5a3c);
            a.box(0, 3.64, 0, 7.4, 0.08, 3.5, WD2, 0x5e4a36);   // lagging over the cap
        }));
        /* ── THE LEMURIAN GATE: where the mine meets the city ── */
        look('gate', gx(3), gz(2), 0, F0, a => {
            [-1, 1].forEach(s => { a.box(s * 2.95, 0, 0.3, 1.1, 0.45, 1.1, MARBLE, STONE); a.box(s * 2.95, 0.45, 0.3, 0.8, 3.15, 0.8, MARBLE, WHITE); a.box(s * 2.95, 3.6, 0.3, 1.1, 0.3, 1.1, MARBLE, STONE); });
            a.box(0, 3.9, 0.3, 7.6, 0.6, 1.0, MARBLE, WHITE);
            a.box(0, 3.98, 0.82, 6.4, 0.16, 0.06, CRYSTAL, GLOW, { glow: 1.1 });   // the lit band on the lintel
            a.cone(0, 4.5, 0.4, 0.45, 0.05, 1.2, CRYSTAL, 0xd8fbff, { glow: 1.6 });   // the keystone crystal
        });
        /* ── THE GREAT CRYSTAL (6,6): the great chamber's stalagmite, grown through with crystal; the shelf's light ── */
        const gc6 = [gcx(6), gcz(6)];
        /* the podium the stalagmite rose from (a blocker 1.6 m high: the board's centre), the rock, the crystal grown up through it: upright
           hexagonal prisms, lit from inside (the shelf's big light hangs in it: `suns`) */
        ctx.feat({ k: 'plateau', id: 'aga:greatcrystal', x: gc6[0], z: gc6[1], w: 3.5, d: 3.5, h: 1.6, edge: 0.1, key: MARBLE });   // (a plateau's h is over the ground here: the room's floor is the height sheet)
        look('greatcrystal', gc6[0], gc6[1], 0, F0, a => {
            a.box(0, 1.6, 0, 3.9, 0.18, 3.9, MARBLE, WHITE);   // the podium's cap (the plateau is its block)
            a.cone(0, 1.75, 0, 1.6, 0.6, 4.2, 'hz_stone_02', 0x6a625a); a.cone(0.95, 1.75, -0.7, 0.7, 0.12, 2.6, 'hz_stone_02', 0x5e574f);
            const prism = (x, z, r, h, y0, tint, glow) => { a.P.push({ s: 'cyl', p: [x, y0, z], r, h, seg: 6, key: CRYSTAL, tint, glow }, { s: 'cyl', p: [x, r2(y0 + h), z], r, r2: 0.04, h: r2(r * 2.1), seg: 6, key: CRYSTAL, tint, glow }); };
            prism(0, 0, 1.15, 8.6, 2.6, 0xd2f6ff, 1.7);
            prism(1.25, 0.55, 0.55, 4.6, 2.2, 0xb8ecff, 1.4);
            prism(-1.05, -0.75, 0.62, 5.8, 2.4, 0xc8e8ff, 1.4);
            prism(0.25, -1.35, 0.42, 3.4, 2.0, 0xa8e4f8, 1.2);
            prism(-0.55, 1.25, 0.48, 3.9, 2.1, 0xd8f0ff, 1.2);
        });
        taken.add('6:6');
        [[5, 5, 2.2], [7, 7, 1.8], [7, 5, 1.4], [5, 7, 1.6]].forEach(([x, y, h], i) => P('crystal_cluster', x, y, { h, face: 70 * i, noLight: i !== 0 }));
        /* four columns round the precinct (blockers on whole squares: the board's cover) */
        [[4, 4], [8, 4], [4, 8], [8, 8]].forEach(([x, y]) => P('greek_column', x, y, { h: 5.2 }));
        /* THE BATTLE MARKER the old room had (the arena of Agartha), at the square's south-west corner */
        const bt = (OLD.c || []).find(c => c.id === 'battle_agartha');
        if (bt) { taken.add('2:9'); counters.push(Object.assign({}, bt, { x: gcx(2), z: gcz(9) })); }

        /* ── THE HALL OF RECORDS (10..14 x 2..6, door south): one hall of white marble ── */
        const hall = building('hall', [10, 2, 14, 6], 'S', 7, { leaf: 'leaf_frosted', leafDouble: true, keyIn: 'hz_wall_01', floorIn: 'hz_stone_12' }, (a, fw, fd, door) => {
            a.box(0, -0.05, 0, fw + 0.8, 0.4, fd + 0.8, MARBLE, STONE);                 // the plinth
            a.shell(fw, 7, fd, MARBLE, WHITE, door, 3.5);
            /* THE FRONT: six pilasters, tall lit crystal windows between them (the records glow through), the door between the middle two */
            [-8.35, -5.6, -3.0, 3.0, 5.6, 8.35].forEach(lx => { a.box(lx, 0.35, fd / 2 + 0.2, 0.8, 6.65, 0.45, MARBLE, STONE); a.box(lx, 0.35, fd / 2 + 0.3, 1.0, 0.5, 0.6, MARBLE, WHITE); a.box(lx, 6.4, fd / 2 + 0.3, 1.0, 0.45, 0.6, MARBLE, WHITE); });
            [-7.0, -4.3, 4.3, 7.0].forEach(lx => { a.box(lx, 1.2, fd / 2 + 0.06, 1.3, 4.2, 0.08, CRYSTAL, 0xa8e6ff, { glow: 0.8 }); a.box(lx, 5.55, fd / 2 + 0.12, 1.6, 0.3, 0.2, MARBLE, WHITE); });
            /* the dome over the crown, the crystal on its top */
            a.P.push({ s: 'dome', p: [0, 9.05, 0], r: 4.2, h: 3.1, seg: 20, key: MARBLE, tint: WHITE });
            a.box(0, 9.05, 0, 9.0, 0.3, 9.0, MARBLE, STONE);
            a.box(0, 7.0, 0, fw + 1.0, 0.55, fd + 1.0, MARBLE, STONE);                  // the cornice
            a.box(0, 7.55, 0, fw - 1.2, 0.9, fd - 1.2, MARBLE, WHITE);                  // the attic
            a.box(0, 8.45, 0, fw - 4.2, 0.6, fd - 4.2, MARBLE, STONE);                  // the crown
            a.cone(0, 12.0, 0, 0.9, 0.06, 3.0, CRYSTAL, 0xd8fbff, { glow: 1.4 });      // the crystal on the dome
            a.box(0, 6.25, fd / 2 + 0.08, fw - 1.6, 0.26, 0.08, CRYSTAL, GLOW, { glow: 1.2 });   // the lit frieze
            /* the portico: its roof on the two columns that stand on the forecourt (props), the steps under it */
            a.box(0, 6.55, fd / 2 + 1.75, fw - 0.4, 0.5, 3.5, MARBLE, WHITE);
            a.box(0, 7.05, fd / 2 + 1.75, fw - 0.2, 0.3, 3.7, MARBLE, STONE);
            a.box(door.lx, 0, fd / 2 + 0.55, 5.2, 0.18, 1.1, MARBLE, STONE);
            a.sign('HALL OF RECORDS', door.lx, 3.35, fd / 2 + 0.09, 6.4, 0.75, '#e8fbff', '#22323c', 'cinzel');
        });
        [[10, 7], [14, 7]].forEach(([x, y]) => P('greek_column', x, y, { h: 6.55 }));
        /* inside: shelves of records round three walls, the model of the city in the middle, the old terrace's telescope, orrery and lectern */
        const hw = hall.fw / 2, hd = hall.fd / 2;
        [-6.0, -3.0, 0, 3.0, 6.0].forEach(lx => put(hall, 'library_shelf_full', lx, -hd + 0.9, { face: 180 }));
        [-4.5, -1.5, 1.5, 4.5].forEach(lz => { put(hall, 'library_shelf_full', -hw + 0.9, lz, { face: 90 }); put(hall, 'library_shelf_full', hw - 0.9, lz, { face: 270 }); });
        put(hall, 'city_scale_model', 0, -1.2, { face: 0 });
        put(hall, 'rug_round', 0, 3.6, {});
        put(hall, 'lectern', -3.6, 1.6, { face: 180 }); put(hall, 'lectern', 3.6, 1.6, { face: 180 });
        put(hall, 'brass_telescope', -5.4, 5.0, { face: 150 }); put(hall, 'brass_orrery', 5.4, 5.0, { face: 180 }); put(hall, 'astronomical_clock', 5.6, -5.9, { face: 225 });
        put(hall, 'marble_bust', -2.8, 6.2, { face: 180 }); put(hall, 'marble_bust', 2.8, 6.2, { face: 180 });
        put(hall, 'crystal_chandelier', 0, -1.2, { ceil: true, y: r2(F0 + 6.6) });
        put(hall, 'crystal_cluster', -5.4, -5.6, { h: 1.4, noLight: true }); put(hall, 'crystal_cluster', 5.4, 2.2, { h: 1.2, noLight: true });

        /* ── THE HOMES CUT IN THE ROCK: a front of white stone on the rock face, a room you walk into ── */
        const front = (a, fw, fd, door, h) => {
            a.shell(fw, h, fd, MARBLE, STONE, door, 3.5);
            a.box(door.lx, 0, fd / 2 + 0.12, 2.6, 0.3, 0.5, MARBLE, WHITE);                       // the sill step
            [-1, 1].forEach(s => a.box(door.lx + s * 1.25, 0.3, fd / 2 + 0.14, 0.42, 2.7, 0.3, MARBLE, WHITE));   // the door's jambs
            a.box(door.lx, 3.0, fd / 2 + 0.14, 3.2, 0.5, 0.36, MARBLE, WHITE);                    // the lintel
            a.box(door.lx, 3.56, fd / 2 + 0.2, 0.9, 0.5, 0.14, CRYSTAL, GLOW, { glow: 1.3 });   // a lit crystal set over the door
            a.box(0, h - 0.4, fd / 2 + 0.1, fw - 0.6, 0.3, 0.24, MARBLE, WHITE);                  // the carved band under the rock
            [-1, 1].forEach(s => { const lx = door.lx + s * 3.6; if (Math.abs(lx) < fw / 2 - 0.8) a.box(lx, 1.2, fd / 2 + 0.06, 1.2, 1.1, 0.06, CRYSTAL, 0x9fdcf0, { glow: 0.6 }); });   // two small lit windows
        };
        const west = building('home_w', [0, 4, 1, 7], 'E', 5.6, {}, (a, fw, fd, door) => front(a, fw, fd, door, 5.6));
        put(west, 'couples_bed', -4.2, -1.3, { face: 90 }); put(west, 'trestle_table', 2.2, -1.0, { face: 0 }); put(west, 'folding_chair', 2.2, 0.4, { face: 0 });
        put(west, 'rug_round', -0.8, 0.6, {}); put(west, 'crystal_cluster', 5.0, -2.0, { h: 0.9 }); put(west, 'sea_chest', -5.0, 1.9, { face: 90 }); put(west, 'woven_baskets', 4.8, 1.9, {});
        const south = building('home_s', [9, 10, 12, 12], 'N', 5.6, {}, (a, fw, fd, door) => front(a, fw, fd, door, 5.6));
        put(south, 'dorm_bed', -4.7, -2.9, { face: 90 }); put(south, 'dorm_bed', -4.7, -0.5, { face: 90 }); put(south, 'fur_rug', -1.2, -1.6, {});
        put(south, 'trestle_table', 2.8, -2.4, { face: 0 }); put(south, 'rocking_chair', 3.0, 1.6, { face: 200 }); put(south, 'kettle', 2.4, -2.6, {});
        put(south, 'brazier', 4.8, 2.8, {}); put(south, 'crystal_cluster', -4.9, 3.0, { h: 0.9, noLight: true }); put(south, 'library_shelf', 0.6, -3.8, { face: 180 });

        /* ── THE DROP (6..8 x 10..11): a broken balustrade over the cliff, the gap where the rope hangs (6) ── */
        look('drop', gx(7) + 1.75, gz(12) - 0.25, 0, F0, a => {
            a.box(0, 0, 0, 3.4, 0.25, 0.5, MARBLE, STONE);
            [-1.4, -0.5, 0.4].forEach(lx => a.cyl(lx, 0.25, 0, 0.13, 0.7, MARBLE, WHITE));
            a.box(-0.5, 0.95, 0, 2.2, 0.16, 0.42, MARBLE, WHITE);
            a.box(1.25, 0.3, 0.3, 0.6, 0.35, 0.5, MARBLE, STONE, { ry: 35 });   // a fallen piece
        });
        /* ── THE COLONNADE (15..19 x 4..7): columns either side of the way east ── */
        [[16, 4], [19, 4], [16, 7], [19, 7]].forEach(([x, y]) => P('greek_column', x, y, { h: 4.6 }));

        /* ══ PASS 2: THE TERRACES ══ */
        const FT = walkOf(30, 42), FG = walkOf(42, 42);
        /* THE MARBLE STAIR between the Plaza (125) and the Inner Gate (124): one flight three squares wide over the plan's ramp squares */
        ctx.feat({ k: 'ramp', id: 'aga:terrace:stair', absY: true, x0: gx(38), z0: r2(gz(42) + 1.5 * C), x1: gx(36), z1: r2(gz(42) + 1.5 * C), w: 3 * C, h0: FG, h1: FT, stairs: true, built: true, key: MARBLE, railing: 'glass', edge: 0.15 });
        /* the houses cut in the rock, the Gatehouse */
        const hw2 = building('house_tw', [22, 38, 25, 41], 'E', 5.6, {}, (a, fw, fd, door) => front(a, fw, fd, door, 5.6));
        put(hw2, 'couples_bed', -3.6, -1.2, { face: 90 }); put(hw2, 'dorm_bed', -3.6, 1.4, { face: 90 }); put(hw2, 'trestle_table', 2.4, -1.2, { face: 0 }); put(hw2, 'folding_chair', 2.4, 0.1, { face: 0 });
        put(hw2, 'fur_rug', 0.2, 0.8, {}); put(hw2, 'crystal_cluster', 4.2, 1.6, { h: 0.8, noLight: true }); put(hw2, 'woven_baskets', 4.4, -1.6, {}); put(hw2, 'kettle', 2.0, -1.2, {});
        const he2 = building('house_te', [48, 42, 51, 44], 'W', 5.6, {}, (a, fw, fd, door) => front(a, fw, fd, door, 5.6));
        put(he2, 'dorm_bed', -3.2, -2.4, { face: 90 }); put(he2, 'trestle_table', 2.6, -1.8, { face: 0 }); put(he2, 'rocking_chair', 1.6, 1.4, { face: 200 });
        put(he2, 'brazier', 3.6, 2.0, {}); put(he2, 'library_shelf', -0.4, -3.2, { face: 180 }); put(he2, 'crystal_cluster', -3.6, 1.8, { h: 0.8, noLight: true });
        const gate = building('gatehouse', [38, 46, 41, 47], 'N', 5.6, {}, (a, fw, fd, door) => front(a, fw, fd, door, 5.6));
        put(gate, 'cot', -3.6, -0.6, { face: 90 }); put(gate, 'dojo_weapon_rack', 2.0, -1.2, { face: 180 }); put(gate, 'armour_stand', 4.0, -1.0, { face: 180 }); put(gate, 'trestle_table', -0.4, 0.4, { face: 0 });
        /* THE INNER GATE: two crystal-capped piers either side of the way down to the Long Tunnel (43..44 x 46..47) */
        look('innergate', gx(44), gz(46), 0, FG, a => {
            [-1, 1].forEach(s => { a.box(s * 3.95, 0, 0.3, 1.2, 0.5, 1.2, MARBLE, STONE); a.box(s * 3.95, 0.5, 0.3, 0.9, 4.2, 0.9, MARBLE, WHITE); a.cone(s * 3.95, 4.7, 0.3, 0.55, 0.05, 1.8, CRYSTAL, 0xd8fbff, { glow: 1.4 }); });
            a.box(0, 4.7, 0.3, 8.8, 0.5, 0.7, MARBLE, WHITE); a.box(0, 4.8, 0.66, 7.4, 0.14, 0.05, CRYSTAL, GLOW, { glow: 1.1 });
            a.sign('THE LONG TUNNEL', 0, 3.75, 0.66, 4.6, 0.6, '#e8fbff', '#22323c', 'cinzel');
        });
        /* the Plaza: the old Plaza's fountain in the middle, its benches and garden rings round it */
        P('fountain', 30, 42, { noLight: true, h: 2.4 });
        P('iron_garden_bench', 27, 41, { face: 90 }); P('iron_garden_bench', 33, 42, { face: 270 }); dec('garden_ring', 28, 44, {}); dec('garden_ring', 32, 39, {});
        [[26, 38], [33, 38], [26, 45], [33, 45]].forEach(([x, y]) => P('greek_column', x, y, { h: 5.2 }));
        P('stone_lantern', 38, 39, {}); P('stone_lantern', 45, 39, {}); P('angel_statue', 45, 42, { face: 270, h: 3.0 });
        P('torch_white', 42, 45, {}); P('torch_white', 45, 45, { noLight: true });

        /* ══ PASS 2: THE SPIRE ══ */
        const FS = walkOf(38, 2), FTm = walkOf(29, 7), sx = gx(SPIRE[0]), sz = gz(SPIRE[1]);
        /* the Spire's foot (a blocker on the island, a step of white marble), the Spire: crystal lit from inside, 36 m, the old room's habit grown */
        ctx.feat({ k: 'plateau', id: 'aga:spire', x: sx, z: sz, w: 4.6, d: 4.6, h: 0.9, edge: 0.1, key: MARBLE });
        look('spire', sx, sz, 0, FS, a => {
            a.box(0, 0.9, 0, 5.0, 0.2, 5.0, MARBLE, WHITE);
            a.P.push({ s: 'cyl', p: [0, 1.0, 0], r: 2.1, r2: 1.5, h: 10, seg: 6, key: CRYSTAL, tint: 0xe8fbff, glow: 1.3 },
                     { s: 'cyl', p: [0, 11.0, 0], r: 1.5, r2: 0.12, h: 24, seg: 6, key: CRYSTAL, tint: 0xf0fdff, glow: 1.7 },
                     { s: 'cyl', p: [1.7, 1.0, 1.0], r: 0.8, r2: 0.08, h: 9, seg: 5, key: CRYSTAL, tint: 0xa8e8ff, glow: 0.9 },
                     { s: 'cyl', p: [-1.6, 1.0, -1.2], r: 0.9, r2: 0.08, h: 12, seg: 5, key: CRYSTAL, tint: 0xb8f0e8, glow: 0.9 },
                     { s: 'cyl', p: [-0.9, 1.0, 1.8], r: 0.6, r2: 0.06, h: 6.5, seg: 5, key: CRYSTAL, tint: 0xc8d8ff, glow: 0.8 },
                     { s: 'cyl', p: [1.2, 1.0, -1.7], r: 0.55, r2: 0.06, h: 5.5, seg: 5, key: CRYSTAL, tint: 0xd8f0ff, glow: 0.8 });
        });
        /* the bridges' ends: a crystal post either side of each (THE CRYSTAL BRIDGES are the plan's `bridges`, written by the tool) */
        (ctx.PLAN.bridges || []).forEach(([p0, p1], i) => { const dx = Math.sign(p1[0] - p0[0]), dy = Math.sign(p1[1] - p0[1]), ox = dy ? 1.55 : 0, oz = dx ? 1.55 : 0;
            const cx = gx(p0[0]) + C / 2 + dx * (C / 2), cz = gz(p0[1]) + C / 2 + dy * (C / 2);
            look('bridgeposts:' + i, cx, cz, 0, FS, a => { [-1, 1].forEach(s => { a.box(s * ox, 0, s * oz, 0.4, 1.1, 0.4, MARBLE, WHITE); a.cone(s * ox, 1.1, s * oz, 0.22, 0.03, 0.8, CRYSTAL, 0xd8fbff, { glow: 1.4 }); }); }); });
        /* the ring: columns at its corners, lanterns */
        [[38, 2], [45, 2], [38, 9], [45, 9]].forEach(([x, y]) => P('greek_column', x, y, { h: 6.5 }));
        /* THE TEMPLE (27..32 x 2..5, door south onto its court) */
        const temple = building('temple', [27, 2, 32, 5], 'S', 7, { leaf: 'leaf_frosted', leafDouble: true, floorIn: 'hz_stone_12' }, (a, fw, fd, door) => {
            a.box(0, -0.05, 0, fw + 0.8, 0.4, fd + 0.8, MARBLE, STONE);
            a.shell(fw, 7, fd, MARBLE, WHITE, door, 3.5);
            [-1, 1].forEach(sg => { for (let k = 0; k < 3; k++) { const lx = sg * (2.4 + k * 2.9); if (Math.abs(lx) > fw / 2 - 0.3) continue; a.box(lx, 0.35, fd / 2 + 0.25, 0.8, 6.65, 0.5, MARBLE, STONE); } });
            a.box(0, 7.0, 0, fw + 1.0, 0.5, fd + 1.0, MARBLE, STONE);
            /* a stepped crown, the temple's crystal on the top */
            [0, 1, 2].forEach(k => a.box(0, 7.5 + k * 0.6, 0, fw - 2 - k * 3.2, 0.6, fd - 2 - k * 3.2, MARBLE, k % 2 ? STONE : WHITE));
            a.P.push({ s: 'cyl', p: [0, 9.3, 0], r: 0.9, r2: 0.05, h: 2.6, seg: 6, key: CRYSTAL, tint: 0xd8fbff, glow: 1.5 });
            a.box(0, 6.2, fd / 2 + 0.08, fw - 1.6, 0.26, 0.08, CRYSTAL, GLOW, { glow: 1.2 });
            a.box(door.lx, 0, fd / 2 + 0.55, 5.2, 0.18, 1.1, MARBLE, STONE);
            a.sign('THE TEMPLE', door.lx, 3.35, fd / 2 + 0.09, 4.4, 0.75, '#e8fbff', '#22323c', 'cinzel');
        });
        put(temple, 'god_statue', 0, -temple.fd / 2 + 1.4, { face: 180, h: 4.2 }); put(temple, 'stone_altar', 0, -1.0, { face: 180 }); put(temple, 'candleRing', 0, 1.2, {});
        put(temple, 'brazier', -temple.fw / 2 + 1.4, -1.5, {}); put(temple, 'brazier', temple.fw / 2 - 1.4, -1.5, {});
        put(temple, 'crystal_cluster', -temple.fw / 2 + 1.3, -temple.fd / 2 + 1.2, { h: 1.8 }); put(temple, 'crystal_cluster', temple.fw / 2 - 1.3, -temple.fd / 2 + 1.2, { h: 1.6, noLight: true });
        put(temple, 'tripod_bowl', -2.6, 1.6, {}); put(temple, 'tripod_bowl', 2.6, 1.6, {}); put(temple, 'crystal_chandelier', 0, 0, { ceil: true, y: r2(FTm + 6.6) });
        /* the Temple's court */
        P('stone_lantern', 27, 7, {}); P('stone_lantern', 32, 7, {}); P('stone_urn', 26, 9, {}); P('stone_urn', 33, 9, {}); P('iron_garden_bench', 29, 9, { face: 0 });
    },

    dress(ctx) {
        const { P, dec, free, open, wet, wallsBeside, squaresIn, T, rnd, walkOf, r2 } = ctx;
        const F0 = walkOf(3, 3);
        /* the city: the adit's mine gear, torches at the gate, benches and lamps on the square and the terrace */
        P('mine_cart', 3, 1, { face: 0 }); dec('rail_section', 3, 0, { face: 0 }); dec('pickaxe', 2, 1, {}); dec('ore_heap', 3, 0, { h: 0.9 });
        dec('ship_lantern', 3, 0, {});
        P('torch_white', 2, 3, {}); P('torch_white', 3, 2, { noLight: true });
        P('iron_garden_bench', 9, 3, { face: 270 }); P('iron_garden_bench', 9, 8, { face: 270 });
        P('stone_lantern', 13, 8, {}); P('stone_lantern', 11, 8, {});
        P('angel_statue', 9, 6, { face: 270, h: 3.2 });
        dec('meshy_crystal_shards', 2, 9, { h: 1.4 }); dec('meshy_crystal_shards', 14, 9, { h: 1.1 });
        P('torch_white', 15, 6, { noLight: true }); P('torch_blue', 18, 5, { noLight: true });
        P('crystal_cluster', 3, 7, { h: 1.2, noLight: true });

        /* THE PITS of the pilot's third */
        /* a NEST (17..18 x 2..3): webs, what it kept */
        dec('hw_web', 18, 2, {}); dec('hw_web_2', 17, 2, {}); P('skull_pile', 18, 3, { h: 1.1 }); dec('hw_part_3', 18, 2, {}); dec('femur', 17, 2, {}); dec('hw_body_2', 18, 3, { face: 40 });
        /* a CRYSTAL POCKET (20..21 x 29..30) */
        P('crystal_cluster', 21, 29, { h: 2.4 }); P('crystal_cluster', 21, 30, { h: 1.5, noLight: true }); dec('meshy_crystal_shards', 20, 30, { h: 1.0 });
        /* a BONE PIT (5..6 x 44..45) */
        P('skull_pile', 6, 45, { h: 1.3 }); dec('skull_pile', 6, 44, { h: 0.8 }); dec('femur', 5, 45, {}); dec('ulna', 6, 45, {}); dec('skull', 5, 45, {}); dec('hw_part_5', 6, 44, {}); dec('hw_part_7', 5, 45, {});
        /* an OLD CAMP (17..18 x 44..45): the expedition that stopped here */
        P('canvas_tent', 18, 45, { face: 300, h: 2.0 }); dec('sleeping_bag', 18, 44, { face: 80 }); dec('backpack', 17, 45, {}); dec('cage_lamp', 18, 44, { noLight: false });
        dec('rope_coils', 17, 45, {}); dec('psx_flashlight_1', 18, 44, {}); dec('item_flare_gun', 17, 45, {}); dec('psx_notebook_1', 18, 45, {}); dec('hw_body_2', 18, 44, { face: 160 });

        /* THE MAZE under the shelf (the pilot's third, out of the city): loose rock along the walls, webs in the corners, bones, a few torches */
        const inCity = (x, y) => x >= CITY[0] && x <= CITY[2] && y >= CITY[1] && y <= CITY[3];
        const ROCKS = ['psxg_rock_1', 'psxg_rock_2', 'psxg_rock_3', 'psxg_rock_4', 'ocean_rock_5', 'cave_stone'];
        const WEBS = ['psx_cobweb_1', 'psx_cobweb_2', 'psx_cobweb_4', 'hw_web_3'];
        const BONES = ['femur', 'ulna', 'skull', 'hw_part_5', 'hw_part_7'];
        const CITYR = [[15, 3, 19, 8], [34, 39, 37, 44], [36, 3, 37, 4], [43, 46, 44, 47]], inR2 = (x, y) => CITYR.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
        squaresIn(0, 0, ctx.W - 1, 47, (x, y) => open(x, y) && !wet(x, y) && T(x, y) === 'g' && !inCity(x, y) && !inR2(x, y)).forEach(([x, y]) => {
            if (!free(x, y)) return; const nw = wallsBeside(x, y), r = rnd();
            if (nw >= 2 && r < 0.16) dec(WEBS[Math.floor(rnd() * WEBS.length)], x, y, {});
            else if (nw >= 1 && r < 0.3) dec(ROCKS[Math.floor(rnd() * ROCKS.length)], x, y, { h: r2(0.5 + rnd() * 0.9), noBlock: true });
            else if (r < 0.36) dec(BONES[Math.floor(rnd() * BONES.length)], x, y, {});
        });
        /* THE DARK: one torch a plot of the maze, at a bend; one in four still burns (a room has ten prop lights: HQ_PROP_LIGHT_MAX) */
        const TORCH = [[6, 17], [17, 17], [5, 30], [17, 29], [6, 41], [18, 41], [16, 13], [29, 17], [41, 17], [53, 17], [53, 29], [41, 29], [29, 29], [53, 5], [53, 41]];
        TORCH.forEach(([x, y], i) => { if (free(x, y)) P('cave_torch', x, y, (i === 0 || i === 4 || i === 10) ? {} : { noLight: true }); });

        /* PASS 2, THE PITS east of the city */
        /* a BONE PIT (53..54 x 2..3, 110) */
        P('skull_pile', 54, 2, { h: 1.2 }); dec('femur', 53, 2, {}); dec('skull', 54, 3, {}); dec('hw_part_5', 53, 2, {}); dec('ulna', 54, 3, {}); dec('hw_body', 54, 2, {});
        /* a NEST (56..57 x 17..18): webs over everything, what it brought back */
        dec('hw_web', 57, 17, {}); dec('hw_web_2', 56, 18, {}); dec('hw_web_3', 57, 18, {}); P('skull_pile', 57, 18, { h: 0.9 }); dec('hw_body_2', 57, 17, { face: 120 }); dec('spider', 56, 18, {}); dec('spider', 57, 17, {});
        /* a CRYSTAL POCKET (56..57 x 29..30) */
        P('crystal_cluster', 57, 29, { h: 2.6 }); P('crystal_cluster', 57, 30, { h: 1.4, noLight: true }); dec('meshy_crystal_shards', 56, 30, { h: 1.1 });
        /* a SQUEEZE that goes nowhere (41..42 x 20..21): loose rock to the roof, a dropped pack */
        dec('psxg_rock_1', 42, 21, { h: 1.3, noBlock: true }); dec('cave_stone', 41, 21, { h: 1.6, noBlock: true }); dec('backpack', 42, 20, {}); dec('psx_cobweb_2', 41, 21, {});
        /* a SUMP OF BLACK WATER (41..42 x 26..27): its floor wet and black, what floated in */
        dec('hw_body', 42, 26, { face: 30 }); dec('rat', 41, 26, {}); dec('rat', 42, 27, {});
        /* THE KEPT ROOM (the dead end at 52..53 x 40..41): bars across it, chains, what is left of what was kept */
        dec('cell_bars', 52, 41, { face: 90 }); dec('wall_chains', 52, 40, { face: 90 }); dec('skull', 52, 40, {}); dec('hw_part_3', 53, 40, {}); dec('psx_old_mattress_mp_1', 53, 41, {});
        dec('candle_ring', 53, 40, {});
    },

    people(ctx) {
        const { native, npc, BUILT, r2 } = ctx;
        const inside = (Bd, race, lx, lz, face) => { const p = Bd.at(lx, lz); npc.push({ x: p[0], z: p[1], face: Bd.face(face || 0), race }); };
        native('crystal guardian', 4, 3, 180);
        native('nordic', 7, 3, 220);
        native('nordic', 12, 8, 160);
        inside(BUILT.hall, 'machine elves', 0, 2.4, 0);
        inside(BUILT.home_w, 'nordic', 1.0, 1.8, 270);
        /* PASS 2: the Terraces, the Spire */
        native('nordic', 29, 40, 160); native('nordic', 31, 44, 330); native('crystal guardian', 44, 44, 0); native('golem', 39, 45, 0);
        native('crystal guardian', 41, 6, 270); native('loch ness monster', 43, 4, 200);
        inside(BUILT.temple, 'machine elves', 1.4, 2.2, 0); inside(BUILT.house_tw, 'nordic', 1.0, 0.4, 270);
    },

    /* THE BIG LIGHTS (four at most in the room): the Great Crystal; the Hall's lit frieze */
    suns(ctx) {
        const { gcx, gcz, gx, gz, walkOf, r2 } = ctx, F0 = walkOf(3, 3);
        return [{ x: gcx(6), y: r2(F0 + 9.5), z: gcz(6), color: 0xa8ecff, intensity: 1.6, dist: 60, decay: 1 },
                /* THE SPIRE: the city's great light, high in its vault */
                { x: gx(42), y: r2(walkOf(38, 2) + 22), z: gz(6), color: 0xa8ecff, intensity: 2.0, dist: 110, decay: 1 },
                /* the Terraces: over the Plaza's fountain and the stair */
                { x: gx(35), y: r2(walkOf(30, 42) + 8), z: gz(42), color: 0xc8f2ff, intensity: 1.2, dist: 48, decay: 1 },
                /* the Hall of Records' lit front */
                { x: gx(12) + 1.75, y: r2(F0 + 6.5), z: gz(8), color: 0xd8f6ff, intensity: 0.9, dist: 26, decay: 1 }];
    },
};
