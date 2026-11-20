/* trail-room.js — THE HOUSE TRAIL'S ROOM DESIGN (2026-11-20, world polish thread 17; mondo's OK on docs/plans/world-polish/plans/estate-house-trail.js,
   "yep looks good", and on the walked way itself: "Yes this is a big priority"). Its own room, `site_prebuilt_skinwalker_ow_trail`, 7 x 3 plots at
   world -20,14: every plot is new, so bake-estate.js THE ROOM DESIGN lays the whole room from the plan, and this file is everything that stands on it.
   Squares are the PLAN's (x 0..83 west to east, y 0..35 north to south). A horror walk (the Woods' brief: Silent Hill, Blair Witch): dead woods as the
   wall, the switchbacks up the hill, the Dead Oak on the bare top, the Pond in the hollow its ledges drop into, the old camp, the estate's old Back Gate
   and its lodge, the thin path off the top through the low woods to the Graveyard's back gate. Pieces: catalogue keys only (FITS_ESTATE.md). */
'use strict';
module.exports = {
    plan: require('../../../plans/world-polish/plans/estate-house-trail.js'),
    wx0: -20, wy0: 14,
    dress(a) { const P = a.P;
        /* ── THE FENCE GAP (6,2; level 1): where the trail leaves the lake ── */
        P('trail_sign', 79, 33, { face: 270 }); P('psxg_dead_bush_1', 81, 34, { dx: 0.8 }); P('psxg_dead_bush_2', 76, 34, { dx: -0.6 }); P('stump', 76, 29); P('crow', 77, 29, { dx: 0.4 });
        P('lantern_post', 75, 27, { pocket: true }); P('rf_rock_1', 82, 28, { dx: 1.0, face: 40 });
        /* ── THE SWITCHBACKS: a lamp at each turn (the last light before the top), a scarecrow nobody put there ── */
        P('lantern_post', 69, 25, { pocket: true }); P('lantern_post', 62, 33, { pocket: true }); P('lantern_post', 55, 26, { pocket: true });
        P('hw_scarecrow', 60, 30, { pocket: true, face: 300 }); P('fallen_log', 50, 34, { pocket: true, face: 15 });
        /* ── THE DEAD OAK (4,1; level 5): the hill's open top, a fight fits; the oak is the landmark seen from the lake ── */
        a.tree(49, 13, 'rf_oak_4_winter', 15);
        P('crow', 50, 14, { dx: -0.6, y: 0.1 }); P('crow', 51, 15); P('hw_scarecrow', 53, 16, { face: 200 }); P('cairn', 56, 15, { dx: 0.5 }); P('missing_board', 54, 19, { face: 0 });
        P('rf_rock_3', 50, 19, { face: 120 }); P('hw_web', 50, 13, { dx: 0.9 }); P('psxg_dead_bush_2', 55, 13);
        /* ── THE POND (5,1; level 0): the hollow the oak's ledges drop into ── */
        P('reeds', 61, 14); P('reeds', 66, 14); P('reeds', 61, 19); P('reeds', 67, 18, { dx: -0.6 }); P('meshy_rowboat', 63, 19, { face: 80, dz: 0.6 });
        P('psxg_dead_tree_1', 60, 20); P('psxg_dead_tree_2', 67, 13); P('meshy_frog', 62, 19); P('meshy_frog', 66, 20); P('stump', 67, 20);
        /* ── THE OLD CAMP (the hollow south of the switchbacks; level 2): somebody's, left in a hurry ── */
        P('camping_tent', 39, 27, { face: 200 }); P('meshy_campfire_ring', 41, 29); P('backpack', 42, 27); P('sleeping_bag', 39, 30, { face: 90 }); P('film_camera', 43, 30, { face: 250 });
        P('railway_lantern', 40, 31, { noLight: true }); P('field_radio', 42, 31); P('psxg_dead_bush_1', 38, 26, { dx: -0.6 });
        /* ── THE FAR SIDE and THE DESCENT: dead trees standing in the way's pockets, a fallen trunk ── */
        P('hw_tree_3', 44, 9, { pocket: true }); P('hw_tree_4', 33, 7, { pocket: true }); P('meshy_fallen_log', 27, 10, { pocket: true, face: 70 });
        P('lantern_post', 37, 3, { pocket: true }); P('lantern_post', 24, 9, { pocket: true });
        /* ── THE BACK GATE (1,0; level 2): the estate's old back yard and its lodge ── */
        P('psxg_wall_pillar', 13, 4, { dx: -0.9 }); P('psxg_wall_pillar', 13, 7, { dx: -0.9 }); P('hw_gate_leaf', 13, 5, { dx: -1.2, face: 90 });
        P('cairn', 16, 7); P('stump', 19, 7); P('crow', 14, 2); P('rf_rock_1', 17, 2, { face: 200 });
        { /* THE GATEHOUSE (new): the estate's old back lodge, 10.5 m square, a walk-in: rubble-stone walls, a shingle gable, the door to the yard (south),
             one room below, a loft over the back half (drawn; a ladder to it); a stove, a cot, crates, a lamp */
          const x0 = a.gx(21), z0 = a.gz(1), w = 10.5, d = 10.5, cx = x0 + w / 2, cz = z0 + d / 2, y0 = a.h(22, 2), ST = 'urban:BrickMasonry1a', STT = 0x8f8a7e, WDK = 'urban:WoodGeneric1a';
          a.feat({ k: 'texbuilding', id: 'est:gatehouse', x: cx, z: cz, w, d, rot: 0, storeys: 1, h: 3.6, seed: 7, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WDK, floorIn: 'urban:WoodFlooring1d' });
          const s = a.sheet(), door = a.texbDoor(w, null);
          s.shell(w, 3.6, d, ST, STT, door, [1.75, 1.75]); s.frame(door, d, WDK, 0x3a2c22);
          s.box(0, -0.2, 0, w + 0.4, 0.3, d + 0.4, 'rocks_5', 0x8a8478, { uv: [3.5, 3.5] });                                     // the footing
          s.roof('gable', 0, 3.6, 0, w + 0.8, 2.6, d + 0.8, 'urban:WoodGeneric2a', 0x3a3438, { keyEnd: ST, tintEnd: STT });
          s.box(w / 2 - 1.4, 3.6, -d / 2 + 1.6, 0.9, 2.8, 0.9, ST, 0x6d6458, { uv: [1.75, 1.75] });                               // the chimney
          for (const lx of [-3.2, 3.2]) { s.box(lx, 1.3, d / 2 + 0.06, 1.0, 1.1, 0.08, 'urban:GlassWindowTall1a', 0x2a3040, { glow: 0.15 }); s.box(lx, 1.2, d / 2 + 0.12, 1.4, 0.12, 0.16, WDK, 0x2a2622); }
          s.box(0, 2.7, -d / 4 - 0.4, w - 0.4, 0.16, d / 2 - 0.6, WDK, 0x5a4636);                                                   // THE LOFT (drawn): boards over the back half
          s.box(0, 3.15, -0.6, w - 0.4, 0.08, 0.08, WDK, 0x4a3828); s.box(-3, 2.9, -0.6, 0.08, 0.5, 0.08, WDK, 0x4a3828); s.box(3, 2.9, -0.6, 0.08, 0.5, 0.08, WDK, 0x4a3828);   // its rail
          s.sign('BACK LODGE', 0, 2.5, d / 2 + 0.1, 2.6, 0.42, '#d8d0b8', '#2e2a26', 'fell');
          a.feat({ k: 'arch', id: 'est:gatehouse:look', x: cx, z: cz, y: y0, rot: 0, parts: s.P }); }
        P('wooden_ladder', 22, 2, { dz: 0.4, face: 0 }); P('wood_stove', 23, 1, { noLight: true, dx: 0.6, dz: -0.6 }); P('psx_wooden_crate_4', 21, 1, { dx: -0.6, dz: -0.6 });
        P('railway_lantern', 21, 3, { noLight: true, dx: -0.8 }); P('wooden_bucket', 23, 3, { dx: 0.7 });
        /* ── THE LOW WOODS and THE BOTTOM: the thin path to the Graveyard's back gate ── */
        P('hw_tree_3', 22, 20, { pocket: true }); P('hw_web', 13, 15, { pocket: true }); P('hw_scarecrow', 16, 13, { pocket: true, face: 90 }); P('lantern_post', 9, 18, { pocket: true });
        P('psxg_wall_pillar', 1, 16, { pocket: true }); P('psxg_wall_pillar', 1, 18, { pocket: true });
    },
};
