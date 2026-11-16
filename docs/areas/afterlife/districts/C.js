/* THE VATICAN · C · THE CLOISTER (3 plots: P01-03 the Cloister, P02-03 the Cistern, P03-03 the Fountain; room `site_prebuilt_vatican_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the quiet south side of the Basilica. THE CLOISTER: an arcade (`k`) round a garth of lawn with a cross of walks. THE CISTERN:
   "consecrated once, then drained, then a rope": the well down to the Catacombs (door `well`, the tool's) in a ring of marble. THE FOUNTAIN:
   the fountain that "runs on consecrated water" in a garden court; the gardener.
   STANDS TODAY (the first build): the arcade's columns, the garth's four pines, the well, the fountain, benches, the gardener.
   NOT YET: the arcade's roof and its back wall, the lanes' walls and gates, flower beds, the gardener's shed ("a gardener's door"). */
'use strict';
exports.dress = ctx => { const { P, at, tree, cell, gx, gz } = ctx;
    for (let y = 37; y < 46; y++) for (let x = 13; x < 24; x++) if (cell[y][x] === 'k' && (x + y) % 2 === 0 && x !== 18 && y !== 41) P('greek_column', x, y, { h: 6 });
    [[16, 39], [21, 39], [16, 43], [21, 43]].forEach(q => tree(q[0], q[1], 'pine', 7)); P('iron_garden_bench', 17, 40, { face: 90 }); P('iron_garden_bench', 20, 43, { face: 270 });
    P('brazier', 27, 38); P('brazier', 34, 38); P('park_bench', 27, 44, { face: 0 }); P('stone_urn', 33, 44); P('wooden_cross', 30, 38, { face: 180 });
    at('fountain', gx(42.5), gz(41.5), { h: 5 }); [[38, 38], [46, 38], [38, 45], [46, 45]].forEach(q => tree(q[0], q[1], 'pine', 8));
    P('park_bench', 40, 39, { face: 135 }); P('park_bench', 45, 44, { face: 315 }); P('angel_statue', 39, 44, { face: 45 }); P('angel_statue', 46, 40, { face: 225 });
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 40, 43, 45, say('vatican_courtyard', 'priest', 0, 'male'), { gender: 'male' });   // the gardener
    native('priest', 19, 40, 180, null, { gender: 'female' }); native('gargoyle', 31, 44, 0);
};
