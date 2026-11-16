/* HEAVEN · A · THE GATE (4 plots: row 2 of room `site_prebuilt_heaven_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the top of the stair: one long landing of marble (24.5 m up) under a wall of cloud 7 m high that runs the whole width of
   Heaven; THE GATE is the one way through it (squares 23-24 x 24-25). "The gate is frosted for modesty. Ours." THE BOOK: the lectern at
   the landing's east end: "Name?" "It is in the book." The landing is the queue.
   STANDS TODAY (the first build): the pearly gate, columns and statues either side, the book, harps, the old Cloud Fields' seraphim.
   NOT YET: the queue's rope line, benches for the wait, the gate's own lamps, the landing's balustrade (its south edge is open sky). */
'use strict';
exports.dress = ctx => { const { P, at, gx, gz } = ctx;
    at('pearly_gate', gx(24), gz(25), { y: 24.5, face: 180 });
    [[21, 26], [26, 26], [19, 26], [28, 26]].forEach(q => P('greek_column', q[0], q[1], { h: 8 })); P('angel_statue', 17, 26, { face: 180 }); P('angel_statue', 30, 26, { face: 180 });
    P('lectern', 40, 28, { face: 270 }); P('instrument_harp', 42, 27); P('instrument_harp', 12, 27); P('brazier', 22, 30); P('brazier', 25, 30); P('brazier', 8, 27); P('brazier', 38, 27);
};
exports.people = ctx => { const { native, say } = ctx; native('seraphim', 41, 29, 270, say('heaven_gate', 'seraphim')); native('angel', 22, 28, 135); native('valkraye', 27, 28, 225); };
