/* HELL · L · THE BOWL (4 plots of room `site_prebuilt_hell_plots`: P02-01 the Lava Lake, P01-02 the Bowl, P02-02 the Plinth, P02-03 the Far Shore)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the floor of the pit (3.5 m over the lava) round the lake. THE PLINTH stands on its island (squares 28-30 x 27-29), reached by the
   causeway (the tool's bridge): "Who is chained to the plinth?" "Nobody, now." THE BOWL: the altar, the chains, the queue ("take a number").
   STANDS TODAY (the first build): the Plinth, the altar, braziers round the lake, the old Pit's two people + three more.
   NOT YET: the queue's rail and its number machine (the fire extinguisher of the old room stands by the altar), the lake's rim stones,
   the Far Shore's cages, heat haze + embers over the lake (the air pass). */
'use strict';
exports.build = ctx => { const { gx, gz, look } = ctx;
    look('plinth', gx(29.5), gz(28.5), 0, 3.5, a => { a.box(0, 0, 0, 3.2, 1, 3.2, 'obsidian', 0x3a2c2c); a.box(0, 1, 0, 2.4, 3.2, 2.4, 'obsidian', 0x4a3434); a.box(0, 4.2, 0, 3, 0.5, 3, 'obsidian', 0x3a2c2c); });
};
exports.dress = ctx => { const { P, at, gx, gz } = ctx;
    ctx.take(29, 28); at('wall_chains', gx(29.5), gz(28.5) + 1.3, { y: 4.6, face: 0 }); at('wall_chains', gx(29.5), gz(28.5) - 1.3, { y: 4.6, face: 180 });
    P('stone_altar', 17, 24, { face: 90 }); P('fire_extinguisher', 16, 25); P('wall_chains', 15, 26); P('stocks', 18, 31, { face: 90 }); P('demon_statue', 15, 28, { face: 90 });
    [[21, 25], [21, 33], [27, 19], [33, 20], [27, 36], [33, 35], [28, 27], [30, 29]].forEach(q => P('brazier', q[0], q[1])); [[19, 30], [24, 35], [34, 22]].forEach(q => P('skull_pile', q[0], q[1]));
};
exports.people = ctx => { const { native, say } = ctx;
    native('demon', 19, 26, 200, say('hell_pit', 'demon')); native('demon prince', 30, 28, 270); native('demon princess', 30, 19, 180); native('skeleton', 26, 35, 0); native('ghoul', 17, 33, 45);
};
