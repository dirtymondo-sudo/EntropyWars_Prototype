/* HELL · D · THE DESCENT (3 plots of room `site_prebuilt_hell_plots`: P01-01 the Descent, P00-02 the Alcove, P00-03 the Ash Flats)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the way down. THE DESCENT: the second terrace (8.75 m) and its flights. THE ALCOVE: a hollow in the rim's west wall (squares 2-3 x
   28-31). THE ASH FLATS: a flat of ash on the rim's south-west corner.
   STANDS TODAY (the first build): torches, the stocks, chains in the alcove, skulls in the ash, two people.
   NOT YET: the alcove's shrine, dead trees in the ash (NEEDS A MODEL: a burnt tree), bone drifts, a toll booth at each flight. */
'use strict';
exports.dress = ctx => { const { P } = ctx;
    [[15, 14], [20, 13], [13, 22], [9, 32], [10, 34]].forEach(q => P('cave_torch', q[0], q[1])); P('stocks', 16, 16, { face: 180 }); P('wall_chains', 2, 29); P('wall_chains', 2, 30); P('brazier', 3, 31);
    [[4, 38], [8, 41], [5, 44], [10, 37]].forEach(q => P('skull_pile', q[0], q[1])); P('psxg_tombstone_1', 7, 39, { face: 160 }); P('psxg_tombstone_3', 9, 43, { face: 200 });
};
exports.people = ctx => { const { native } = ctx; native('halfdemon', 18, 15, 180); native('undead', 6, 41, 90); };
