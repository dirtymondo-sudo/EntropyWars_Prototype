/* HEAVEN · T · THE STAIRWAY (8 plots: rows 3-4 of room `site_prebuilt_heaven_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: "the stair that only goes up". The foot (3.5 m; the telescope lands you on its south side, the Sky Bridge to Camelot's castle is
   its west side), then four floating flights (the tool's) with a landing each: 8.75 m (the pool that "heals the stairs", the Healing Zone
   is at the foot), 14 m, 19.25 m, and the Gate's landing at 24.5 m. THE LONG WAY ("on the left. It is also up") leaves the first landing
   east over THE FALL and comes round to the second. Everything hangs over open sky: a step off is a fall back to the last cloud.
   STANDS TODAY (the first build): columns at each flight's head, statues, braziers, a bench, loose clouds, the old Stairway's two people.
   NOT YET: balustrades on the landings, the pinnacle ("the pillar has no stair ... the door"), harps, more loose clouds under the flights. */
'use strict';
exports.dress = ctx => { const { P, at, gx, gz } = ctx;
    [[10, 51], [10, 54], [18, 49], [22, 49], [17, 38], [17, 42], [4, 37], [8, 37]].forEach(q => P('greek_column', q[0], q[1], { h: 6 }));
    P('angel_statue', 4, 51, { face: 90 }); P('lectern', 5, 55, { face: 0 }); P('brazier', 9, 51); P('brazier', 9, 55); P('park_bench', 18, 55, { face: 0 }); P('angel_statue', 24, 51, { face: 225 });
    P('brazier', 18, 38); P('brazier', 26, 42); P('angel_statue', 26, 38, { face: 180 }); P('brazier', 4, 42); P('brazier', 9, 42);
    [[30, 50, 6], [36, 45, 10], [26, 47, 4], [12, 46, 9], [2, 47, 12], [30, 37, 18], [46, 44, 9], [14, 33, 20], [38, 57, 5]].forEach(q => at('white_cloud', gx(q[0]), gz(q[1]), { y: q[2] }));
};
exports.people = ctx => { const { native, say } = ctx;
    native('chosen one', 7, 52, 20, say('heaven_stair', 'chosen one')); native('seraphim', 7, 39, 90, say('heaven_stair', 'seraphim')); native('angel', 20, 40, 180);
};
