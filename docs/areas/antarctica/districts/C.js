/* ANTARCTICA, DISTRICT C · THE CREVASSE (6 plots: row 2) — the crack right across the traverse; three crossings.
   PLOTS: The Ice Bridge (P00-02) · The Crevasse, west (P01-02) · The Plank (P02-02) · The Crevasse (P03-02, the landmark: widest, the lowering rig)
   · The Snow Bridge (P04-02) · The Crevasse, east (P05-02). The slot itself is the tool's (the height sheet, 16 m down).
   STANDS TODAY (first build): the Plank's boards and rope posts, the lowering rig, warning tape and cones at the three crossings, a camp.
   NOT YET: anything down in the crack, ropes and ladders, the night lights, the dressing along both lips. */
'use strict';
exports.pieces = ctx => {
    const { look, gx, gc, WD, WD2, COR } = ctx;
    /* THE PLANK: boards across the ice bridge (squares 30..31 x 26..28), a rope on posts each side */
    look('plank', gx(31), gx(27.5), 0, a => {
        for (let z = -6.5; z <= 6.5; z += 0.55) a.box((Math.sin(z * 7) * 0.12), 0.04, z, 5.2 + Math.sin(z * 3) * 0.4, 0.07, 0.48, WD, 0x9a7a52);
        [-3.2, 3.2].forEach(x => { for (let z = -6; z <= 6; z += 3) a.cyl(x, 0, z, 0.06, 1.2, WD2, 0x5a4630); a.box(x, 1.05, 0, 0.04, 0.04, 12, WD2, 0xc8b070); });
    });
    /* THE LOWERING RIG at the widest place: a tripod over the lip, a line going down */
    look('lower', gc(42), gx(28) - 0.4, 0, a => {
        [[-1.6, 0, 1.2], [1.6, 0, 1.2], [0, 0, -1.4]].forEach(p => { for (let i = 0; i < 5; i++) a.box(p[0] * (1 - i / 5), i * 1.1, p[2] * (1 - i / 5), 0.12, 1.2, 0.12, COR, 0xc8a030); });
        a.box(0, 5.4, 0, 0.5, 0.3, 0.5, COR, 0x30343a); a.cyl(0, -14, 0.9, 0.03, 19.4, COR, 0xd8d8d8);
    });
};
exports.dress = ctx => {
    const { P, dec } = ctx;
    [[29, 25], [32, 25], [29, 33], [32, 33], [7, 28], [10, 28], [7, 33], [10, 33], [54, 28], [57, 28], [54, 35], [57, 35]].forEach((q, i) => P(i % 2 ? 'traffic_cone' : 'warning_tape', q[0], q[1]));
    P('signpost', 32, 24); P('signpost', 29, 34); P('chain_hoist', 43, 26); P('flood_mast', 40, 26); P('flood_mast', 34, 34);
    P('canvas_tent', 46, 25); dec('campfire', 47, 26); dec('backpack', 45, 25); dec('meshy_rope', 41, 26); dec('psx_supply_crate_1', 44, 26); dec('sleeping_bag', 47, 25);
    P('cave_stone', 18, 26); P('cave_stone', 63, 26); dec('icicles', 20, 34); dec('snow_sled', 12, 34);
};
