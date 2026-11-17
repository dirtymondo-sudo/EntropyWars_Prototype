/* THE VATICAN · S · THE SQUARE (8 plots: columns 4-5 of room `site_prebuilt_vatican_plots`, sx 48-71)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the oval of marble before the Basilica: two arcs of columns round its north and south ends (the plan's `k` squares), the obelisk
   in the middle (its plinth: squares 59-60 x 23-24), a fountain north and south (the two basins), the gate in the east wall.
   STANDS TODAY (the first build): the columns, the obelisk, the two fountains, the closed gate, lamp posts, benches, four people.
   NOT YET: the colonnade's roof and the 140 figures on it, paving bands (the oval's spokes), the gate's own house, flags, pilgrims' barriers.
   The gate: Disaster City's Civic Center gate is on the other side (owner side). It is CLOSED: no link, a note on the board. */
'use strict';
exports.build = ctx => { const { gx, gz, wall, look } = ctx;
    /* THE GATE IS OPEN (2026-11-17, One World: the River Road, route R1, goes out of it over the Tiber; was shut, a ghost wall) */
    /* THE OBELISK: a needle of red granite on a marble pedestal, a gilt cross on its tip (the catalogue's `obelisk` is a black monolith with eyes: not this one) */
    look('obelisk', gx(60), gz(24), 0, 0.9, a => { a.box(0, 0, 0, 4.4, 1.2, 4.4, 'marble_2', 0xe8e0d0); a.box(0, 1.2, 0, 3.2, 3, 3.2, 'marble_2', 0xf0e8d8); a.box(0, 4.2, 0, 3.8, 0.5, 3.8, 'marble_2', 0xe8e0d0);
        a.cyl(0, 4.7, 0, 1.75, 19, 'marble_2', 0xd8a08a, { r2: 1.15, seg: 4, a0: 45, glow: 0.35 }); a.cyl(0, 23.7, 0, 1.15, 1.6, 'marble_2', 0xd8a08a, { r2: 0, seg: 4, a0: 45, glow: 0.35 });
        a.box(0, 25.3, 0, 0.14, 1.5, 0.14, 'gold'); a.box(0, 26.2, 0, 0.9, 0.14, 0.14, 'gold'); });
    look('gate', gx(71.5), gz(24), 0, 0, a => {
        for (let i = -1; i <= 1; i += 2) { a.box(-1.85, 0, i * 3.25, 3.3, 6.4, 0.3, 'urban:MetalCorrugated1a', 0x3a2f22);   // the two bronze leaves, swung in against the jambs
            a.box(-1.85, 0.4, i * 3.03, 2.6, 5.4, 0.12, 'gold', 0x8a6a2a); }
        a.box(0, 6.4, 0, 3.6, 2.4, 7.6, 'marble_light', 0xe2d6bc); a.roof('gable', 0, 8.8, 0, 7.6, 2, 3.6, 'marble_light', 0xd9cdb2, { ry: 90 });
    });
};
exports.dress = ctx => { const { P, at, dec, cell, gx, gz, W, H } = ctx;
    /* THE COLONNADE: a column on every other `k` square of the arcs' inner and outer rows (the row between them is the walk) */
    const cols = [], k = (x, y) => x >= 48 && x < W && y >= 0 && y < H && cell[y][x] === 'k';
    for (let y = 1; y < 47; y++) for (let x = 48; x < 71; x++) { if (!k(x, y)) continue; const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(q => !k(x + q[0], y + q[1])); if (edge && (x + y) % 2 === 0) cols.push([x, y]); }
    ctx.columns('colonnade', cols, 10.5, { r: 0.75 });
    at('fountain', gx(60), gz(13), { h: 4.6 }); at('fountain', gx(60), gz(35), { h: 4.6 });
    [[52, 20], [52, 27], [57, 20], [57, 27], [63, 20], [63, 27], [68, 20], [68, 27]].forEach(q => P('iron_lamp_post', q[0], q[1]));
    [[55, 14], [65, 14], [55, 33], [65, 33]].forEach((q, i) => P('iron_garden_bench', q[0], q[1], { face: i < 2 ? 180 : 0 }));
    [[49, 2], [69, 4], [49, 45], [69, 43]].forEach(q => P('angel_statue', q[0], q[1]));
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 56, 22, 90, say('vatican_courtyard', 'priest', 0, 'female'), { gender: 'female' });
    native('gargoyle', 69, 22, 270); native('priest', 62, 30, 0, null, { gender: 'male' }); native('gargoyle', 53, 6, 135);
};
