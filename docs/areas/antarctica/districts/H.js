/* ANTARCTICA, DISTRICT H · THE HULL IN THE ICE (6 plots: row 0) — what is behind the wall: a ship's hull rising out of the ice, the dig along it,
   and the collar where the Spaceship's airlock opens (the tool's door on the north wall, at the end of the slot in the hull: squares 36..37).
   PLOTS: The Drift (P00-00) · The Dig Camp (P01-00) · The Hull in the Ice (P02-00) · The Collar (P03-00) · The Survey Line (P04-00) · The Blue Ice (P05-00).
   STANDS TODAY (first build): the hull (two dark vaults 9 m high with ribs, the collar's ring between them), the dig trench's lights, the camp,
   the survey's stakes, hull plates lying loose, a Man in Black, a Nordic, a Yeti.
   NOT YET: the hull's own detail (plates, hatches, lights along it), the trench's shoring and ladders, the snow cave, the lookout. */
'use strict';
exports.pieces = ctx => {
    const { look, gx, gc, COR, WD2 } = ctx, HULL = 0x3a4048, RIB = 0x23262b;
    /* THE HULL: squares 26..45 x 1..4, cut by the collar's slot at 36..37 */
    [[26, 36], [38, 46]].forEach((q, i) => look('hull' + i, gx((q[0] + q[1]) / 2), gx(3), 0, a => { const w = (q[1] - q[0]) * 3.5;
        a.roof('barrel', 0, 0, 0, w, 9, 15, COR, HULL, { seg: 14, keyEnd: COR, tintEnd: RIB });
        for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 5) a.roof('barrel', x, 0, 0, 0.5, 9.25, 15.5, COR, RIB, { seg: 14, keyEnd: COR, tintEnd: RIB });
        for (let x = -w / 2 + 3.5; x <= w / 2 - 3; x += 10) a.box(x, 2.2, 7.6, 1.6, 0.5, 0.1, 'marble_light', 0x7fe0ff, { glow: 1.0 });
    }));
    /* THE COLLAR: a ring round the slot's mouth, a lintel joining the two halves */
    look('collar', gx(37), gx(5), 0, a => {
        a.box(-3.9, 0, 0, 0.8, 6.4, 1.2, COR, RIB); a.box(3.9, 0, 0, 0.8, 6.4, 1.2, COR, RIB); a.box(0, 6.4, 0, 8.6, 0.9, 1.2, COR, RIB);
        a.box(0, 7.3, -7, 7.2, 1.6, 15, COR, HULL);
        a.box(-3.9, 5.2, 0.62, 0.3, 0.5, 0.06, 'marble_light', 0xffb030, { glow: 1.0 }); a.box(3.9, 5.2, 0.62, 0.3, 0.5, 0.06, 'marble_light', 0xffb030, { glow: 1.0 });
        a.sign('THE COLLAR', 0, 6.55, 0.62, 5.0, 0.6, '#ffd070', '#15171a', 'stencil');
    });
    /* THE SURVEY LINE: stakes with a red rag, every second square across the buried hull */
    for (let x = 48; x <= 58; x += 2) look('stake' + x, gc(x), gx(10) - 0.5, 0, a => { a.cyl(0, 0, 0, 0.04, 1.6, WD2, 0xc8b070); a.box(0.2, 1.25, 0, 0.4, 0.28, 0.02, 'marble_light', 0xd02a20, { gain: 1.4 }); });
};
exports.dress = ctx => {
    const { P, dec, native, sayOf } = ctx;
    P('flood_mast', 27, 6); P('flood_mast', 44, 6); P('flood_mast', 34, 6); P('flood_mast', 39, 6);
    P('hullplate', 24, 3); dec('hullplate', 47, 4); P('nacelle', 49, 2, { h: 3 }); dec('escapepod', 23, 5);
    P('canvas_tent', 16, 9); P('canvas_tent', 18, 9); P('camping_tent', 20, 9); P('campfire', 19, 10); dec('psx_wooden_crate_4', 21, 10); dec('pickaxe', 22, 9); dec('wheelbarrow', 15, 10); dec('psx_supply_crate_1_4', 16, 10);
    dec('pickaxe', 28, 5); dec('psx_wooden_crate_5', 41, 6); dec('wheelbarrow', 33, 5); dec('cable_drum', 43, 5);
    P('brass_telescope', 63, 5); dec('backpack', 64, 6);
    native('men in black', 53, 9, 180, sayOf('men in black', 0)); native('nordic', 35, 6, 180, null); native('yeti', 7, 6, 120, null);
};
