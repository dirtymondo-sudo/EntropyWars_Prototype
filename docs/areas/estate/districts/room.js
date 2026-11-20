/* room.js — THE ESTATE'S ROOM DESIGN, in the ROOM's own frame (2026-11-20, world polish thread 17, mondo's OK on the height plan:
   docs/plans/world-polish/plans/estate.js, "yep looks good").
   The squares, the levels, the ramps and the ledges are the PLAN's: bake-estate.js THE ROOM DESIGN reads it through the plan tool
   (docs/plans/world-polish/draw-plan.js `build`) and lays it, square by square, over every plot of the districts named in `letters`.
   This file is what stands on that new ground that no home-frame district file can write: the new plots (the West Bank, the Bluff) have
   no home square. Squares here are the PLAN's / the joined room's (x 0..59 west to east, y 0..215 north to south; the room
   `site_prebuilt_skinwalker_ow_lake`, box 5 x 18 plots at world -14,5). The plan changes FIRST, then this file, then the bake.
   THE PILOT (11-20): the Lake (district L) and its two new plots. The Corn Fields and the Ranch stand as they did until mondo has looked.
   Pieces: catalogue keys only (the FITS shortlist: docs/plans/world-polish/thread17/FITS_ESTATE.md). */
'use strict';
module.exports = {
    plan: require('../../../plans/world-polish/plans/estate.js'),
    wx0: -14, wy0: 5,      // the world plot the plan's square 0,0 stands on (the room's box)
    letters: ['L'],        // the districts the plan lays (the pilot: the Lake)
    /* `dress(a)`: a.P(key, x, y, o) = a piece on an OPEN, level square (o.dx / o.dz = metres off its middle; o.pocket = a square of the
       mass beside open ground, opened for it); a.tree(x, y, kind, h); a.feat(row); a.gx / a.gz = a square line in metres; a.h(x, y) = ground */
    dress(a) { const P = a.P;
        /* ── THE WEST BANK (plan 1,11; level 1): the shore walk climbs off the west shore onto it; the trail west leaves by its gate ── */
        /* the trail's end until the House Trail is built (its own room, plans/estate-house-trail.js): a farm gate, shut, and a board */
        P('timber_gate', 13, 141, { face: 90 }); P('trail_sign', 14, 139, { face: 90 }); P('lantern_post', 16, 143, { pocket: true });
        /* a bench on the bank's lip, looking east over the water; the old willow that leans out over it */
        P('iron_garden_bench', 18, 142, { face: 90, dx: 0.6 }); a.tree(18, 143, 'rf_willow_2', 9);
        P('wild_flowers', 14, 142); P('fern', 17, 142, { dx: 0.8 }); P('psxg_dead_bush_1', 13, 139, { dx: -0.9 });
        /* the washed-out bank: the notch, a stump and a fallen log at its foot (the roots are the climb: bake-estate.js lays every `found` climb of the plan) */
        P('stump', 21, 140, { dz: -0.9 }); P('meshy_fallen_log', 23, 140, { dz: 1.0, face: 80 });
        /* ── THE BLUFF (plan 1,12; level 2): the open top over the water, a board fits; the lookout on its east edge sees the Boathouse ── */
        P('coin_telescope', 21, 149, { face: 55 }); P('cairn', 22, 148, { dx: 0.6 }); P('iron_garden_bench', 20, 151, { face: 90 });
        a.tree(15, 153, 'rf_oak_2_autumn', 10.5); P('crow', 15, 152, { dx: 0.7, y: 0.1 });
        P('rf_rock_3', 14, 147, { dx: -1.2, dz: -0.6, face: 30 }); P('rf_rock_1', 14, 150, { dx: -1.3, face: 140 }); P('rf_rock_2', 16, 154, { dz: 1.3, face: 260 });
        P('rf_rock_4', 21, 154, { dx: 0.8, dz: 1.2, face: 200 }); P('rf_rock_1', 21, 153, { dx: 1.0, face: 10 });
        P('wild_flowers', 17, 148); P('wild_flowers', 18, 152); P('psxg_dead_bush_1', 19, 154, { dz: 0.9 });
        /* the climb up from the West Bank: a lamp at its foot */
        P('lantern_post', 17, 145, { pocket: true });
        /* ── THE SHORE WALK: the bench over the water (the South Shore, level 1) and the walk down off the Bluff ── */
        P('park_bench', 26, 145, { face: 0 }); P('rf_rock_2', 24, 144, { dx: -0.8, dz: -1.0, face: 70 });
        P('lantern_post', 29, 150, { pocket: true }); P('trail_sign', 27, 150, { pocket: true, face: 180 });
    },
};
