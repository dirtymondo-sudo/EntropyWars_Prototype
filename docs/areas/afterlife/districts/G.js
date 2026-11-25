/* THE VATICAN · G · THE GARDENS (4 plots: column 0 of room `site_prebuilt_vatican_plots`: P00-00 the Hedge Maze, P00-01 the Gardens,
   P00-02 the Campanile, P00-03 the Wall, west)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the gardens behind the apse. THE HEDGE MAZE (the plan's `h` squares are hedge 2.6 m high: one way in from the south, its heart
   at 6,6): "the hedges were planted as a maze and grew as a maze". THE GARDENS: lawns and pines. THE CAMPANILE: "the campanile is a
   stump": the stump of the bell tower (squares 4-6 x 23-25, 5.25 m of brick). THE WALL, WEST: the wall walk and its tower.
   STANDS TODAY (the first build): the maze, the stump, pines, statues, urns, benches.
   NOT YET: a grotto, the wall walk's stair, the bell lying by the stump, topiary, hedges along the walks.
   THE SCENIC PASS (2026-11-25): the random pines are out; a cypress avenue leads to the stump, pine clumps frame the west gate, rose beds, an olive grove. */
'use strict';
exports.build = ctx => { const { gx, gz, look } = ctx;
    look('campanile', gx(5.5), gz(24.5), 0, 5.25, a => {   // the broken top of the stump: ragged courses of brick
        a.box(-3.5, 0, 0, 3.4, 2.6, 10.4, 'bricks_3', 0xb8a890); a.box(1.2, 0, -3.5, 6, 1.5, 3.4, 'bricks_3', 0xb8a890); a.box(3.5, 0, 2.2, 3.4, 0.8, 6, 'bricks_3', 0xa89880);
    });
};
exports.dress = ctx => { const { P, tree, rnd, cell } = ctx;
    P('angel_statue', 6, 6, { face: 180 });   // the heart of the maze
    P('stone_urn', 4, 16); P('stone_urn', 7, 16); P('iron_garden_bench', 6, 18, { face: 180 }); P('lion_statue', 4, 40, { face: 90 }); P('lion_statue', 7, 40, { face: 270 });
    P('iron_garden_bench', 6, 30, { face: 270 }); P('iron_lamp_post', 6, 15); P('iron_lamp_post', 6, 34); P('iron_lamp_post', 6, 44);
    /* THE SCENIC PASS (2026-11-25, flora.md 00b, zone group 6; was: a pine on 16 % of the lawn squares, at random, the "randomly placed" look mondo hated).
       One focal = the Campanile's stump on the long walk (x 5). Its LEADING LINE = a cypress avenue on both sides of the walk from the south cross walk
       (y 40) up to the stump; the WEST GATE (y 24-25) is FRAMED by a clump of stone pines on each side; the east lawn's middle (x 7-9, y 25-35) is kept
       OPEN (the bench under the cypresses looks onto it); the trees stand in GROUPS of 3 or 5 at the walls and the corners (S4, S5), mixed heights;
       the FLOWER BEDS (the plan's "flower beds along the walks") are rose beds by the benches and the north walk; a VIGNETTE in each end: an olive grove
       with a vine trellis (south-east), a rose bed and urns by the maze's gate (north). The lavender, daisies and poppies are the flora field's (`med`). */
    const H = (a, b) => a + rnd() * (b - a), g = (x, y) => cell[y] && cell[y][x] === 'g';
    const pine = (x, y, a, b) => { if (g(x, y)) tree(x, y, 'pine', H(a, b)); };
    const put = (key, x, y, o) => { if (g(x, y)) P(key, x, y, o); };
    [28, 31, 34, 37].forEach(y => { put('cypress_tree', 4, y); if (y !== 31 && y !== 34) put('cypress_tree', 6, y); });   // the avenue (the bench sits in its gap at 6,30-31, a lamp post at 6,34)
    put('cypress_tree', 4, 21); put('cypress_tree', 6, 21);                                                     // the avenue's head, either side of the stump's approach
    pine(1, 21, 8, 9.5); pine(2, 20, 6, 7); pine(1, 19, 6.5, 7.5);                                              // the west gate's frame, north clump
    pine(1, 28, 8.5, 9.5); pine(2, 29, 6, 7); pine(1, 30, 6.5, 7.5);                                            // the west gate's frame, south clump
    pine(9, 13, 8.5, 9.5); pine(10, 14, 7, 8); pine(8, 13, 6, 6.5); pine(10, 15, 6, 7); pine(9, 14, 5.5, 6);   // a grove of five in the north-east corner
    pine(1, 34, 7, 8.5); pine(2, 36, 6, 7); pine(1, 37, 8, 9);                                                  // against the west wall
    pine(10, 22, 7.5, 8.5); pine(10, 24, 6, 7); pine(9, 23, 5.5, 6.5);                                          // the east lawn's north rim (its open middle below)
    put('olive_tree', 9, 42, { face: 20 }); put('olive_tree', 8, 44, { face: 200 }); put('olive_tree', 10, 45, { face: 110 });   // the olive grove (south-east)
    put('grape_trellis', 10, 41, { face: 90 }); put('iron_garden_bench', 7, 42, { face: 90 });                 // ... with a vine trellis and a bench in its shade
    put('rose_bed', 7, 30, { face: 90 }); put('rose_bed', 7, 18, { face: 0 }); put('rose_bed', 4, 18, { face: 0 });   // the beds by the benches
    put('rose_bed', 3, 13, { face: 0 }); put('rose_bed', 8, 15, { face: 0 }); put('stone_urn', 2, 13);           // either side of the north walk, before the maze's way in (6,11)
    pine(2, 44, 7, 8); pine(1, 42, 6, 7); put('cypress_tree', 3, 45);                                           // the south-west corner, behind the lions
};
exports.people = ctx => { const { native } = ctx; native('gargoyle', 8, 24, 90); native('priest', 4, 17, 90, null, { gender: 'female' }); };
