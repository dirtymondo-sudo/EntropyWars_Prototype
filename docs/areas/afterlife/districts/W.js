/* HELL · W · THE WALKWAYS (4 plots of room `site_prebuilt_hell_plots`: column 3: the High Platforms, the Walkways, the Lava Below, the Walkways east)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the east side of the pit has fallen in. Four platforms stand on pillars of rock at the rim's height (14 m) over a sea of lava; five
   walkways (the tool's bridges, railed) run rim > platform 1 > 2 > 3 > 4 > rim. THE LAVA BELOW: a ledge 1.75 m over the lava under the third
   platform, reached down the chains (the tool's climb on its east face).
   STANDS TODAY (the first build): braziers and torches on the platforms, the statue, chains, skulls on the ledge, three people.
   NOT YET: broken walkway stubs, hanging chains under the bridges, the ledge's cages, embers + heat haze (the air pass). */
'use strict';
exports.dress = ctx => { const { P } = ctx;
    [[38, 4], [43, 9], [39, 15], [43, 19], [39, 30], [43, 26], [38, 43], [43, 38]].forEach(q => P('brazier', q[0], q[1])); P('demon_statue', 41, 6, { face: 180 }); P('wall_chains', 43, 17); P('wall_chains', 39, 28);
    [[38, 25], [45, 31], [37, 32]].forEach(q => P('skull_pile', q[0], q[1])); P('cave_torch', 45, 25); P('cave_torch', 37, 28);
};
exports.people = ctx => { const { native } = ctx; native('demon', 41, 17, 180); native('fallen angel', 41, 41, 0); native('overlord', 40, 7, 270); };
