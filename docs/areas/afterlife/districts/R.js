/* HELL · R · THE RIM (5 plots of room `site_prebuilt_hell_plots`: P00-00 the Fissure's End, P01-00 the Rim north, P02-00 the Warm Wall,
   P00-01 the Rim west, P01-03 the Rim south = THE MOUTH)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the lip of the pit, 14 m over the bowl's floor. THE FISSURE'S END: the gorge the Cavern's tunnel comes out of (link `cave_hell`,
   west wall). THE WARM WALL, THE OTHER SIDE: the Catacombs' draught comes out high on the north wall (link `vatican_hell`). THE MOUTH: the
   bay door on its own ledge over the rim's south side, "three flights down".
   STANDS TODAY (the first build): torches, chains, skull piles, standing stones, the statue at the mouth, three people.
   NOT YET: the rim's parapet of broken rock, the "take a number" queue rail, hanging cages, the gorge's bones. */
'use strict';
exports.build = ctx => { ctx.feat({ k: 'scatter', key: 'menhir', n: 7, seed: 3 }); ctx.feat({ k: 'scatter', key: 'cave_stone', n: 9, seed: 4 }); };
exports.dress = ctx => { const { P } = ctx;
    [[3, 4], [3, 8], [9, 4], [16, 4], [22, 4], [28, 3], [33, 4], [4, 14], [4, 20], [14, 43], [22, 43]].forEach(q => P('cave_torch', q[0], q[1]));
    P('demon_statue', 21, 45, { face: 0 }); P('brazier', 16, 43); P('brazier', 19, 43); P('wall_chains', 27, 3); P('wall_chains', 32, 3); P('skull_pile', 6, 6); P('skull_pile', 30, 5); P('skull_pile', 12, 44);
};
exports.people = ctx => { const { native, say } = ctx;
    native('succubus', 20, 43, 20, say('hell_pit', 'succubus')); native('skeleton', 7, 5, 90); native('fallen angel', 31, 6, 180);
};
