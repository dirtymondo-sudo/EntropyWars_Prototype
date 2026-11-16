/* HEAVEN · A · THE GATE (4 plots: row 2 of room `site_prebuilt_heaven_plots`)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the top of the stair: one long landing of marble (24.5 m up) under a wall of cloud 7 m high that runs the whole width of
   Heaven; THE GATE is the one way through it (squares 23-24 x 24-25). "The gate is frosted for modesty. Ours." THE BOOK: the lectern at
   the landing's east end: "Name?" "It is in the book." The landing is the queue.
   STANDS TODAY (the first build): the pearly gate, columns and statues either side, the book, harps, the old Cloud Fields' seraphim.
   NOT YET: the queue's rope line, benches for the wait, the gate's own lamps, the landing's balustrade (its south edge is open sky). */
'use strict';
/* THE WALL OF CLOUD: a bank of cumulus the whole width of Heaven (the plan's `K` squares, sy 24-25), drawn as heaps of cloud; the walker
   is stopped by two ghost walls. The Gate (squares 23-24) is the one gap. */
exports.build = ctx => { const { gx, gz, wall, look, HW } = ctx, Y = 24.5;
    [[-HW, gx(23)], [gx(25), HW]].forEach(q => { wall(q[0], gz(24) + 0.3, q[1], gz(24) + 0.3, Y, 8); wall(q[0], gz(26) - 0.3, q[1], gz(26) - 0.3, Y, 8); });
    wall(gx(23), gz(24), gx(23), gz(26), Y, 8); wall(gx(25), gz(24), gx(25), gz(26), Y, 8);
    look('bank', 0, gz(25), 0, Y, a => { let s = 9; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        for (let x = -HW + 2; x < HW - 1; x += 3.6 + rnd() * 2.4) { if (Math.abs(x) < 5.4) continue; const r = 3.6 + rnd() * 2.6;
            a.dome(x, -0.6, (rnd() - 0.5) * 2, r, 4.5 + rnd() * 3.5, 'cloud_2', 0xffffff, { rz: 3.2 + rnd() * 1.4, seg: 10, rings: 5, glow: 0.75 });
            if (rnd() < 0.6) a.dome(x + (rnd() - 0.5) * 3, -0.4, (rnd() - 0.5) * 3.5, r * 0.6, 3 + rnd() * 3, 'cloud_2', 0xffffff, { seg: 8, rings: 4, glow: 0.75 }); } });
};
exports.dress = ctx => { const { P, at, gx, gz } = ctx;
    at('pearly_gate', gx(24), gz(25), { y: 24.5, face: 180 });
    [[21, 26], [26, 26], [19, 26], [28, 26]].forEach(q => P('greek_column', q[0], q[1], { h: 8 })); P('angel_statue', 17, 26, { face: 180 }); P('angel_statue', 30, 26, { face: 180 });
    P('lectern', 40, 28, { face: 270 }); P('instrument_harp', 42, 27); P('instrument_harp', 12, 27); P('brazier', 22, 30); P('brazier', 25, 30); P('brazier', 8, 27); P('brazier', 38, 27);
};
exports.people = ctx => { const { native, say } = ctx; native('seraphim', 41, 29, 270, say('heaven_gate', 'seraphim')); native('angel', 22, 28, 135); native('valkraye', 27, 28, 225); };
