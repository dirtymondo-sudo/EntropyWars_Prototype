/* ANTARCTICA, DISTRICT W · THE ICE WALL (6 plots: row 1) — the wall at the end of the world: 35 m sheer right across the zone, ONE cut through it.
   PLOTS: The Ice Wall far west / west (P00-01, P01-01) · The Gap (P02-01: the cut, two squares wide) · The Ice Wall (P03-01, the landmark + the watch post)
   · The Ice Wall east / far east (P04-01, P05-01). The wall itself is the tool's (the height sheet). The track along its foot is the plan's.
   STANDS TODAY (first build): the Gap's two gate pylons and board, the watch post, flood masts along the face, a Yeti and a Nordic.
   NOT YET: fallen blocks along the face, ladders, the night look (the masts are the light).
   WORLD POLISH THREAD 13 (2026-11-20): the west stair, the walk ON the Wall, the arch over the Gap and the icefall + its rope are the room
   design's (`room.js`, read from the height plan), not this file's. */
'use strict';
exports.pieces = ctx => {
    const { look, gx, COR } = ctx;
    /* THE GAP'S GATE: a steel pylon each side of the cut and a board across, on the wall's south face */
    look('gap', gx(31), gx(18) + 0.6, 0, a => {
        [-4.6, 4.6].forEach(x => { a.box(x, 0, 0, 0.7, 7, 0.7, COR, 0x4a5058); a.box(x, 7, 0, 1.0, 0.3, 1.0, COR, 0x30343a); a.box(x, 5.6, 0.4, 0.4, 0.4, 0.2, 'marble_light', 0xff5030, { glow: 1.0 }); });
        a.box(0, 6.2, 0, 9.2, 0.25, 0.25, COR, 0x4a5058);
        a.sign('THE ICE WALL', 0, 6.5, 0.16, 6.4, 0.9, '#f4f0e6', '#23262b', 'stencil');
    });
};
exports.dress = ctx => {
    const { P, dec, native, sayOf } = ctx;
    [5, 17, 26, 35, 44, 52, 66].forEach(x => P('flood_mast', x, 19));
    P('timber_lookout', 40, 22); P('item_flat_earth', 42, 22, { h: 1.2 }); dec('psx_supply_crate_1', 41, 23); dec('item_binoculars', 39, 22); P('trail_sign', 33, 22); P('signpost', 28, 22);
    P('canvas_tent', 20, 22); dec('campfire', 21, 23); dec('psx_metal_barrel_mp_2', 19, 23);
    [[4, 22], [12, 19], [24, 19], [49, 19], [58, 19], [61, 22], [68, 19]].forEach(q => dec('icicles', q[0], q[1]));
    native('yeti', 10, 22, 90, sayOf('yeti', 0)); native('nordic', 33, 19, 180, null); native('yeti', 64, 19, 200, null);
};
