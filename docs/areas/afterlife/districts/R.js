/* HELL · R · THE RIM (5 plots of room `site_prebuilt_hell_plots`: P00-00 the Fissure's End, P01-00 the Rim north, P02-00 the Warm Wall,
   P00-01 the Rim west, P01-03 the Rim south = THE MOUTH)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the lip of the pit, 14 m over the bowl's floor. THE FISSURE'S END: the gorge the Cavern's tunnel comes out of (link `cave_hell`,
   west wall). THE WARM WALL, THE OTHER SIDE: the Catacombs' draught comes out high on the north wall (link `vatican_hell`). THE MOUTH: the
   bay door on its own ledge over the rim's south side, "three flights down".
   STANDS TODAY (the first build): chains, skull piles, standing stones, the statue at the mouth, three people.
   THE LIGHT PASS (2026-11-20, thread 11 of docs/plans/world-polish/WORLD_POLISH_PLAN.md; the plan is docs/plans/world-polish/plans/hell.js,
   approved by mondo 11-20: LIGHT AND LANDMARKS, no ground moves). THE RIM IS COLD AND DARK, WITH TORCH LINES THAT LEAD TO THE DESCENT:
   - THE NORTH LINE: from the Fissure east along the rim, down to its lip and on to the head of the north flight (layout stair 2).
   - THE WEST LINE: from the Fissure south along the west rim to the head of the west flight (stair 3, the Descent's).
   - THE SOUTH LINE: along the south rim's lip either side of the Mouth.
   - THE WARM WALL'S TWO TALL BRAZIERS: a brazier on a stone pillar each side of the way up to the Catacombs (the plan's "Mouth" mark).
   - THE FISSURE'S RED GLOW: two red torches at the gorge's mouth and a red light down in it.
   - THE FLIGHTS' TORCH PAIRS on the rim's three flights (stairs 2, 1, 6; D.js flightTorches).
   Lit (three of the room's ten point lights): the Warm Wall's braziers, the Fissure, the Mouth. Every other torch is `noLight` (flame + glow).
   NOT YET: the rim's parapet of broken rock, the "take a number" queue rail, hanging cages, the gorge's bones. */
'use strict';
const D = require('./D.js');
exports.build = ctx => { const { look, gx, gz, mx, mz, hh, wall } = ctx;
    ctx.feat({ k: 'scatter', key: 'menhir', n: 7, seed: 3 }); ctx.feat({ k: 'scatter', key: 'cave_stone', n: 9, seed: 4 });
    /* the Warm Wall's two pillars (squares 28,2 and 31,2): 2.2 m of black stone, a brazier on each */
    [[28, 2], [31, 2]].forEach((q, i) => { const x = mx(q[0]), z = mz(q[1]), y = hh[q[1]][q[0]];
        look('warm_pillar' + i, x, z, 0, y, a => { a.box(0, 0, 0, 1.3, 0.35, 1.3, 'obsidian', 0x3a2c2c); a.box(0, 0.35, 0, 0.9, 1.6, 0.9, 'rocks_5', 0x5a4038); a.box(0, 1.95, 0, 1.15, 0.25, 1.15, 'obsidian', 0x3a2c2c); });
        wall(x - 0.6, z, x + 0.6, z, y, 2.2, { t: 1.2 }); });
};
exports.dress = ctx => { const { P, at, mx, mz, gx, gz, hh, walk, taken } = ctx;
    const torch = (x, y, o) => { if (walk(x, y) && !taken.has(x + ':' + y)) P('cave_torch', x, y, Object.assign({ noLight: true, glow: { size: 2.4 } }, o || {})); };   // (a bigger halo: the line reads across the pit)
    /* THE NORTH LINE (the Fissure > the rim > its lip > the north flight's head) */
    [[4, 4], [7, 5], [10, 7], [13, 8], [16, 9], [19, 9]].forEach(q => torch(q[0], q[1]));
    /* THE WEST LINE (the Fissure > down the west rim > the west flight's head) */
    [[3, 11], [4, 14], [5, 17], [5, 20], [4, 23]].forEach(q => torch(q[0], q[1]));
    /* THE SOUTH LINE (the south rim's lip, the Mouth between) */
    [[13, 41], [21, 41], [24, 41], [27, 41], [30, 41], [33, 41]].forEach(q => torch(q[0], q[1]));
    /* THE FLIGHTS: the north flight (stair 2), the south rim's flight down (stair 1), the bowl's south flight (stair 6) */
    D.flightTorches(ctx, [2, 1, 6]);
    /* THE WARM WALL'S TALL BRAZIERS + their light (lit) */
    [[28, 2], [31, 2]].forEach(q => { ctx.take(q[0], q[1]); at('brazier', mx(q[0]), mz(q[1]), { y: hh[q[1]][q[0]] + 2.2, noSeat: true, noBlock: true }); });
    at('light_glow', gx(30), mz(3), { y: hh[3][29] + 3.2, noSeat: true, light: { color: 0xff7a30, intensity: 1.3, dist: 20 } });
    /* THE FISSURE'S RED GLOW: two red torches at the gorge's mouth + a red light down in it (lit) */
    P('torch_red', 2, 4, { noLight: true }); P('torch_red', 3, 7, { noLight: true });
    at('light_glow', gx(1), mz(5), { y: hh[5][1] + 1.2, noSeat: true, light: { color: 0xff2a14, intensity: 1.5, dist: 18 }, glow: { y: 0.6, size: 7, color: 0xff2a14 } });
    /* THE MOUTH: its two braziers and the statue, as they stood; a warm light over the landing (lit) */
    P('demon_statue', 21, 45, { face: 0 }); P('brazier', 16, 43); P('brazier', 19, 43);
    at('light_glow', gx(18), mz(42), { y: hh[42][17] + 3.5, noSeat: true, light: { color: 0xff8a40, intensity: 1.2, dist: 18 } });
    P('wall_chains', 27, 3); P('wall_chains', 32, 3); P('skull_pile', 6, 6); P('skull_pile', 30, 5); P('skull_pile', 12, 44);
};
exports.people = ctx => { const { native, say } = ctx;
    native('succubus', 20, 43, 20, say('hell_pit', 'succubus')); native('skeleton', 7, 7, 90); native('fallen angel', 31, 6, 180);
};
