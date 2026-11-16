/* HEAVEN · F · THE CLOUD FIELDS (4 plots: row 1 of room `site_prebuilt_heaven_plots`: the Terraces, the Sun, the Cloud Fields, the Cloud Paths)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: behind the Gate. "Is this the queue?" "This is the field." THE SUN: a dial of marble and gold on the floor in the field's middle.
   THE TERRACES: two steps of cloud (26.25 m, 28 m) up to the city's level. THE CLOUD PATHS: islands and narrow paths over open sky in the
   east; the Grand Stair's gate of cloud to Mount Olympus is on the east wall (link `heaven_olympus`, the tool's).
   STANDS TODAY (the first build): the Sun's dial, harps, braziers, statues, three people.
   NOT YET: the queue (rows of waiting benches), flower-like cloud tufts, the Terraces' balustrades, lamps along the marble way. */
'use strict';
exports.build = ctx => { const { gx, gz, mark } = ctx, x = gx(24), z = gz(18), G = 0xd8b860, Wt = 0xe8c8a0;
    mark({ k: 'ring', x, z, r: 4.6, w: 9.2, color: 0xb4a2a6, a: 0.5 }); mark({ k: 'ring', x, z, r: 10.2, w: 0.3, color: G, a: 0.9 }); mark({ k: 'ring', x, z, r: 11.6, w: 0.16, color: G, a: 0.85 }); mark({ k: 'ring', x, z, r: 1.4, w: 2.8, color: Wt, a: 0.95 });
    for (let i = 0; i < 16; i++) { const t = i * Math.PI / 8, c = Math.cos(t), s = Math.sin(t), r1 = i % 2 ? 6.6 : 9.2; mark({ k: 'line', x0: Math.round((x + c * 3.2) * 100) / 100, z0: Math.round((z + s * 3.2) * 100) / 100, x1: Math.round((x + c * r1) * 100) / 100, z1: Math.round((z + s * r1) * 100) / 100, w: 0.34, color: Wt, a: 0.95 }); }
};
exports.dress = ctx => { const { P } = ctx;
    [[20, 14], [28, 14], [20, 22], [28, 22]].forEach(q => P('brazier', q[0], q[1])); P('instrument_harp', 16, 18); P('instrument_harp', 32, 18); P('instrument_harp', 5, 16);
    P('angel_statue', 14, 13, { face: 135 }); P('angel_statue', 34, 22, { face: 315 }); P('lectern', 41, 18, { face: 90 }); P('greek_column', 43, 15, { h: 7 }); P('greek_column', 43, 20, { h: 7 }); P('park_bench', 16, 22, { face: 0 }); P('park_bench', 31, 14, { face: 180 });
};
exports.people = ctx => { const { native } = ctx; native('angel', 18, 16, 110); native('valkraye', 41, 15, 180); native('seraphim', 6, 21, 90); };
