/* THE VATICAN · G · THE GARDENS (4 plots: column 0 of room `site_prebuilt_vatican_plots`: P00-00 the Hedge Maze, P00-01 the Gardens,
   P00-02 the Campanile, P00-03 the Wall, west)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the gardens behind the apse. THE HEDGE MAZE (the plan's `h` squares are hedge 2.6 m high: one way in from the south, its heart
   at 6,6): "the hedges were planted as a maze and grew as a maze". THE GARDENS: lawns and pines. THE CAMPANILE: "the campanile is a
   stump": the stump of the bell tower (squares 4-6 x 23-25, 5.25 m of brick). THE WALL, WEST: the wall walk and its tower.
   STANDS TODAY (the first build): the maze, the stump, pines, statues, urns, benches.
   NOT YET: flower beds, a grotto, the wall walk's stair, the bell lying by the stump, topiary, hedges along the walks. */
'use strict';
exports.build = ctx => { const { gx, gz, look } = ctx;
    look('campanile', gx(5.5), gz(24.5), 0, 5.25, a => {   // the broken top of the stump: ragged courses of brick
        a.box(-3.5, 0, 0, 3.4, 2.6, 10.4, 'bricks_3', 0xb8a890); a.box(1.2, 0, -3.5, 6, 1.5, 3.4, 'bricks_3', 0xb8a890); a.box(3.5, 0, 2.2, 3.4, 0.8, 6, 'bricks_3', 0xa89880);
    });
};
exports.dress = ctx => { const { P, tree, rnd, cell, taken } = ctx;
    P('angel_statue', 6, 6, { face: 180 });   // the heart of the maze
    P('stone_urn', 4, 16); P('stone_urn', 7, 16); P('iron_garden_bench', 6, 18, { face: 180 }); P('lion_statue', 4, 40, { face: 90 }); P('lion_statue', 7, 40, { face: 270 });
    P('iron_garden_bench', 6, 30, { face: 270 }); P('iron_lamp_post', 6, 15); P('iron_lamp_post', 6, 34); P('iron_lamp_post', 6, 44);
    const keep = { '8:24': 1, '4:17': 1 };   // where the people stand
    for (let y = 13; y < 46; y++) for (let x = 1; x < 11; x++) { if (cell[y][x] !== 'g' || rnd() > 0.16 || taken.has(x + ':' + y) || keep[x + ':' + y]) continue; if (x >= 3 && x <= 7 && y >= 22 && y <= 26) continue; tree(x, y, rnd() < 0.8 ? 'pine' : 'tree_5', 6 + rnd() * 3); }
};
exports.people = ctx => { const { native } = ctx; native('gargoyle', 8, 24, 90); native('priest', 4, 17, 90, null, { gender: 'female' }); };
